import json
import logging
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError
from pydantic import ValidationError
from app.core.security import decode_ws_token
from app.schemas.predict import CoordinatesPayload
from app.services.inference import inference_service

logger = logging.getLogger("librasquest.api")
router = APIRouter()

@router.websocket("/ws/predict")
async def ws_predict(websocket: WebSocket, token: str = Query(default=None)) -> None:
    if not token:
        await websocket.close(code=4008)
        return
    try:
        decode_ws_token(token)
    except (JWTError, ValueError):
        await websocket.close(code=4008)
        return

    await websocket.accept()
    client_id = f"{websocket.client.host}:{websocket.client.port}"
    logger.info("Cliente conectado ao canal: %s", client_id)

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Payload JSON inválido."})
                continue

            try:
                payload = CoordinatesPayload(**data)
            except ValidationError as exc:
                clean_msg = exc.errors()[0].get("msg", str(exc)).replace("Value error, ", "")
                await websocket.send_json({"error": clean_msg})
                continue

            try:
                prediction = await inference_service.run_inference(payload.coordinates)
                await websocket.send_json(prediction.model_dump())
            except Exception as exc:
                logger.error("Falha de inferência para o cliente %s: %s", client_id, exc)
                await websocket.send_json({"error": str(exc)})

    except WebSocketDisconnect:
        logger.info("Cliente desconectado de forma limpa: %s", client_id)
    except Exception as exc:
        logger.error("Erro inesperado no ciclo de vida do WebSocket para o cliente %s: %s", client_id, exc)