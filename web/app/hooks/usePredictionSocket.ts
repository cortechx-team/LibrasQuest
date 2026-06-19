'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandPredictionPayload } from '../lib/mediapipe/handFeatures';

type ConnectionStatus = 'idle' | 'connecting' | 'handshaking' | 'connected' | 'disconnected' | 'error';

export type Prediction = {
  letter: string;
  confidence: number;
};

type ReadyMessage = {
  type: 'ready';
  model_loaded: boolean;
};

function isReadyMessage(data: Prediction | ReadyMessage | { error: string }): data is ReadyMessage {
  return 'type' in data && data.type === 'ready';
}

function getPredictionSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_PREDICTION_WS_URL;
  const defaultProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new URL(
    configuredUrl ?? `${defaultProtocol}//${window.location.hostname}:8000/ws/predict`,
  ).toString();
}

export function usePredictionSocket(
  enabled: boolean,
  onPrediction?: (prediction: Prediction) => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onPredictionRef = useRef(onPrediction);
  const isReadyRef = useRef(false);
  const waitingForResponseRef = useRef(false);

  useEffect(() => {
    onPredictionRef.current = onPrediction;
  }, [onPrediction]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const socket = new WebSocket(getPredictionSocketUrl());
    socketRef.current = socket;
    isReadyRef.current = false;

    socket.addEventListener('open', () => {
      if (!active) {
        return;
      }
      setStatus('handshaking');
      setError(null);
    });

    socket.addEventListener('message', (event) => {
      if (!active) {
        return;
      }
      waitingForResponseRef.current = false;

      try {
        const data = JSON.parse(event.data) as Prediction | ReadyMessage | { error: string };
        if ('error' in data) {
          setError(data.error);
          return;
        }

        if (isReadyMessage(data)) {
          isReadyRef.current = data.model_loaded;
          setStatus(data.model_loaded ? 'connected' : 'handshaking');
          setError(null);
          return;
        }

        setPrediction(data);
        onPredictionRef.current?.(data);
        setError(null);
      } catch {
        setError('O backend retornou uma resposta inválida.');
      }
    });

    socket.addEventListener('error', () => {
      if (!active) {
        return;
      }
      waitingForResponseRef.current = false;
      isReadyRef.current = false;
      setStatus('error');
      setError('Não foi possível conectar ao serviço de reconhecimento.');
    });

    socket.addEventListener('close', () => {
      if (!active) {
        return;
      }
      waitingForResponseRef.current = false;
      isReadyRef.current = false;
      setStatus((currentStatus) => currentStatus === 'error' ? 'error' : 'disconnected');
    });

    return () => {
      active = false;
      socketRef.current = null;
      isReadyRef.current = false;
      waitingForResponseRef.current = false;
      socket.close();
    };
  }, [enabled]);

  const sendFrame = useCallback((payload: HandPredictionPayload) => {
    const socket = socketRef.current;
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !isReadyRef.current ||
      waitingForResponseRef.current
    ) {
      return;
    }

    waitingForResponseRef.current = true;
    socket.send(JSON.stringify(payload));
  }, []);

  return {
    status: enabled ? (status === 'idle' ? 'connecting' : status) : 'idle',
    prediction: enabled ? prediction : null,
    error: enabled ? error : null,
    sendFrame,
  };
}
