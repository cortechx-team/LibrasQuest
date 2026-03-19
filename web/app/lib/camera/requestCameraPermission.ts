/**
 * Módulo para solicitar permissão da câmera
 * Centraliza a lógica de permissão para evitar duplicação de código.
 */

export type CameraPermissionStatus = 'granted' | 'denied' | 'unsupported' | 'error';

export type CameraPermissionResult = {
  status: CameraPermissionStatus;
  stream: MediaStream | null;
};

/**
 * Solicita permissão para acessar a câmera do usuário.
 * @returns Promise<CameraPermissionResult> - Resultado da permissão e stream da câmera
 */
export async function requestCameraPermission(): Promise<CameraPermissionResult> {
  // Verificar suporte do navegador
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      status: 'unsupported',
      stream: null,
    };
  }

  try {
    // Solicitar acesso à câmera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    return {
      status: 'granted',
      stream,
    };
  } catch (error) {
    // Tratar erros específicos
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return {
          status: 'denied',
          stream: null,
        };
      }
      if (error.name === 'NotFoundError') {
        return {
          status: 'unsupported',
          stream: null,
        }; // Câmera não encontrada
      }
    }

    console.error('Erro ao solicitar permissão da câmera:', error);
    return {
      status: 'error',
      stream: null,
    };
  }
}