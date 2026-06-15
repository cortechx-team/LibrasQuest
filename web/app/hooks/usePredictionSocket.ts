'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandPredictionPayload } from '../lib/mediapipe/handFeatures';
import { getAuthToken, saveAuthToken, clearAuthToken, authenticateGuest } from '../lib/auth';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type Prediction = {
  letter: string;
  confidence: number;
};

function getPredictionSocketUrl(token: string): string {
  const configuredUrl = process.env.NEXT_PUBLIC_PREDICTION_WS_URL;
  const defaultProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  const baseUrl = new URL(
    configuredUrl ?? `${defaultProtocol}//${window.location.hostname}:8000/ws/predict`
  );
  
  baseUrl.searchParams.set('token', token);
  return baseUrl.toString();
}

export function usePredictionSocket(enabled: boolean) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCounter, setReconnectCounter] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const waitingForResponseRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    let socket: WebSocket | null = null;

    async function connect() {
      try {
        setStatus('connecting');
        
        let token = getAuthToken();
        
        if (!token) {
          token = await authenticateGuest();
          if (!active) return;
          saveAuthToken(token);
        }

        socket = new WebSocket(getPredictionSocketUrl(token));
        socketRef.current = socket;

        socket.addEventListener('open', () => {
          if (!active) return;
          setStatus('connected');
          setError(null);
        });

        socket.addEventListener('message', (event) => {
          if (!active) return;
          waitingForResponseRef.current = false;

          try {
            const data = JSON.parse(event.data) as Prediction | { error: string };
            if ('error' in data) {
              setError(data.error);
              return;
            }

            setPrediction(data);
            setError(null);
          } catch {
            setError('O backend retornou uma resposta inválida.');
          }
        });

        socket.addEventListener('error', () => {
          if (!active) return;
          waitingForResponseRef.current = false;
          setStatus('error');
          setError('Não foi possível conectar ao serviço de reconhecimento.');
        });

        socket.addEventListener('close', (event: CloseEvent) => {
          if (!active) return;
          waitingForResponseRef.current = false;
          
          if (event.code === 4008) {
            clearAuthToken();
            setReconnectCounter((prev) => prev + 1);
          } else {
            setStatus((currentStatus) => currentStatus === 'error' ? 'error' : 'disconnected');
          }
        });

      } catch (err) {
        if (!active) return;
        setStatus('error');
        setError('Não foi possível gerar as credenciais temporárias para o jogo.');
      }
    }

    connect();

    return () => {
      active = false;
      waitingForResponseRef.current = false;
      if (socket) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [enabled, reconnectCounter]);

  const sendFrame = useCallback((payload: HandPredictionPayload) => {
    const socket = socketRef.current;
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
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