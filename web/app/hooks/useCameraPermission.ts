'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestCameraPermission, CameraPermissionStatus } from '../lib/camera/requestCameraPermission';

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach(track => track.stop());
}

/**
 * Hook para gerenciar o estado e ações da permissão da câmera
 */
export function useCameraPermission() {
  const [status, setStatus] = useState<CameraPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopMediaStream(stream);
    };
  }, [stream]);

  const requestPermission = useCallback(async (): Promise<CameraPermissionStatus> => {
    setIsLoading(true);
    setError(null);

    setStream(currentStream => {
      stopMediaStream(currentStream);
      return null;
    });

    try {
      const { status: resultStatus, stream: resultStream } = await requestCameraPermission();

      setStatus(resultStatus);

      if (resultStatus === 'granted' && resultStream) {
        setStream(resultStream);
      }

      return resultStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
      setStream(null);
      return 'error';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCameraTest = useCallback(() => {
    setStream(currentStream => {
      stopMediaStream(currentStream);
      return null;
    });

    setStatus(null);
    setError(null);
  }, []);

  return {
    status,
    isLoading,
    error,
    stream,
    requestPermission,
    stopCameraTest,
  };
}
