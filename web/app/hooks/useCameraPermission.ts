'use client';

import { useState } from 'react';
import { requestCameraPermission, CameraPermissionStatus } from '../lib/camera/requestCameraPermission';

/**
 * Hook para gerenciar o estado e ações da permissão da câmera
 */
export function useCameraPermission() {
  const [status, setStatus] = useState<CameraPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestCameraPermission();
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    error,
    requestPermission,
  };
}