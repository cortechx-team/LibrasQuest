import logging
import math
import csv
import warnings
import numpy as np
import joblib
from typing import Any

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

from app.core.config import MODEL_PATH, STATS_PATH
from app.schemas.predict import PredictionResponse

logger = logging.getLogger("librasquest.services")

class InferenceService:
    def __init__(self) -> None:
        self.classifier: Any = None
        self.means_vector: np.ndarray = None
        self.stds_vector: np.ndarray = None

    def load_model(self) -> None:
        logger.info("Carregando modelo %s na memória...", MODEL_PATH)
        try:
            self.classifier = joblib.load(MODEL_PATH)
            logger.info("Modelo carregado com sucesso.")
        except Exception as e:
            logger.error("Erro crítico ao carregar o modelo em %s: %s", MODEL_PATH, e)
            raise e

        logger.info("Carregando pesos de normalização de %s...", STATS_PATH)
        try:
            self._load_standardization_stats()
            logger.info("Pesos de normalização carregados com sucesso.")
        except Exception as e:
            logger.error("Erro ao carregar os pesos de normalização: %s", e)
            raise e

    def unload_model(self) -> None:
        logger.info("Descarregando modelo e pesos da memória.")
        self.classifier = None
        self.means_vector = None
        self.stds_vector = None

    def _load_standardization_stats(self) -> None:
        feature_order = []
        for idx in range(21):
            for axis in ("x", "y", "z"):
                feature_order.append(f"{axis}{idx}")
        
        for name in ['polegar', 'indicador', 'medio', 'anelar', 'minimo']:
            feature_order.append(f"dist_{name}_pulso")
            
        pares_especificos = [
            "dist_indicador_medio_pontas", "dist_indicador_medio_pip", "dist_indicador_medio_mcp",
            "dist_polegar_minimo_pontas", "dist_polegar_indicador_pontas", "dist_polegar_indicador_mcp",
            "dist_polegar_indicador_pip", "dist_polegar_indicador_dip", "dist_polegar_indicador_tip",
            "dist_indicador_anelar_pontas", "dist_medio_anelar_pontas"
        ]
        feature_order.extend(pares_especificos)

        raw_stats = {}
        with open(STATS_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_stats[row['feature'].strip()] = {
                    'mean': float(row['mean']),
                    'std': float(row['std'])
                }

        means = []
        stds = []
        for feat in feature_order:
            if feat not in raw_stats:
                raise KeyError(f"A característica '{feat}' exigida não foi encontrada no arquivo de estatísticas atualizado.")
            means.append(raw_stats[feat]['mean'])
            stds.append(raw_stats[feat]['std'])

        self.means_vector = np.array(means, dtype=np.float32).reshape(1, -1)
        self.stds_vector = np.array(stds, dtype=np.float32).reshape(1, -1)

    def _normalize_spatial(self, coordinates: list[float]) -> list[float]:
        coords = np.array(coordinates, dtype=np.float32).reshape(21, 3)
        
        wrist = coords[0]
        coords = coords - wrist
        
        max_val = np.max(np.abs(coords))
        if max_val > 0:
            coords = coords / max_val
            
        return coords.flatten().tolist()

    def _build_feature_vector(self, coordinates: list[float]) -> np.ndarray:
        norm_coords = self._normalize_spatial(coordinates)
        
        def get_pt(idx: int):
            return norm_coords[idx * 3], norm_coords[idx * 3 + 1], norm_coords[idx * 3 + 2]
            
        def calc_dist(idx_a: int, idx_b: int) -> float:
            p1, p2 = get_pt(idx_a), get_pt(idx_b)
            return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2)

        features = list(norm_coords)
        
        pontas = [4, 8, 12, 16, 20]
        for p in pontas:
            features.append(calc_dist(p, 0))
            
        pares_juntas = [
            (8, 12), (6, 10), (5, 9), (4, 20), (4, 8),
            (4, 5), (4, 6), (4, 7), (4, 8), (8, 16), (12, 16)
        ]
        for a, b in pares_juntas:
            features.append(calc_dist(a, b))
            
        raw_vector = np.array(features, dtype=np.float32).reshape(1, -1)
        
        scaled_vector = (raw_vector - self.means_vector) / self.stds_vector
        return scaled_vector

    async def run_inference(self, coordinates: list[float]) -> PredictionResponse:
        if not self.classifier or self.means_vector is None:
            raise RuntimeError("O sistema de inferência ou os pesos não foram inicializados.")
        
        features = self._build_feature_vector(coordinates)
        
        try:
            prediction = self.classifier.predict(features)
            letter = str(prediction[0])
            
            if hasattr(self.classifier, "predict_proba"):
                confidence = float(np.max(self.classifier.predict_proba(features)))
            else:
                confidence = 1.0
                
        except ValueError as e:
            logger.error("Erro de dimensionalidade nos dados enviados: %s", e)
            raise ValueError(f"O formato do array ({features.shape}) é incompatível com o modelo.")
            
        return PredictionResponse(letter=letter, confidence=round(confidence, 4))

inference_service = InferenceService()