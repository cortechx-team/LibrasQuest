/**
 * Módulo para solicitar permissão da câmera
 * Centraliza a lógica de permissão para evitar duplicação de código.
 */

export type CameraPermissionStatus = 'granted' | 'denied' | 'unsupported' | 'error';

/**
 * Solicita permissão para acessar a câmera do usuário.
 * @returns Promise<CameraPermissionStatus> - Status da permissão
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  // Verificar suporte do navegador
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }

  try {
    // Solicitar acesso à câmera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    // Encerrar o stream imediatamente após obter permissão
    stream.getTracks().forEach(track => track.stop());

    return 'granted';
  } catch (error) {
    // Tratar erros específicos
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'denied';
      }
      if (error.name === 'NotFoundError') {
        return 'unsupported'; // Câmera não encontrada
      }
    }

    console.error('Erro ao solicitar permissão da câmera:', error);
    return 'error';
  }
}