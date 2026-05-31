'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCameraPermission } from '../hooks/useCameraPermission';

/**
 * Componente Hero
 * Seção de destaque inicial da página de aterrissagem (Hero Section).
 * Apresenta o título em pixel art e um "Call to Action" (Chamada para Ação).
 */
export default function Hero() {
  const { status, isLoading, error, stream, requestPermission, stopCameraTest } = useCameraPermission();
  const [isCameraConfirmed, setIsCameraConfirmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const didRedirectToGame = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {
        // Alguns navegadores podem bloquear autoplay mesmo com muted.
      });
      return;
    }

    videoRef.current.srcObject = null;
  }, [stream]);

  const clearGameRedirect = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  };

  const handleCameraTest = async () => {
    setIsCameraConfirmed(false);
    didRedirectToGame.current = false;
    clearGameRedirect();

    const result = await requestPermission();

    // Tratar o resultado após a requisição
    if (result === 'denied') {
      alert('Permissão negada. Para usar o LibrasQuest, você precisa permitir o acesso à câmera');
    } else if (result === 'unsupported') {
      alert('Seu navegador não suporta acesso à câmera ou nenhuma câmera foi encontrada');
    } else if (result === 'error') {
      alert(`Ocorreu um erro ao acessar a câmera: ${error || 'Tente novamente'}`);
    }
  };

  const handleCameraReady = () => {
    if (didRedirectToGame.current) {
      return;
    }

    didRedirectToGame.current = true;
    setIsCameraConfirmed(true);
    sessionStorage.setItem('librasquest-camera-confirmed', 'true');
    redirectTimeoutRef.current = setTimeout(() => {
      router.push('/jogo');
    }, 2000);
  };

  const handleStopCameraTest = () => {
    setIsCameraConfirmed(false);
    didRedirectToGame.current = false;
    clearGameRedirect();
    stopCameraTest();
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-24 text-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]">
      
      {/* Título Principal Estilo Pixel Art e Efeitos */}
      <div className="pixel-title text-primary-cyan text-4xl sm:text-5xl md:text-6xl mb-25 z-10">
        LibrasQuest
      </div>

      {/* Subtítulo Destacando o Propósito */}
      <h1 className="text-3xl md:text-4xl font-semibold mb-5 z-10 text-text-white mt-0">
        O aprendizado de Libras <br className="hidden sm:block" /> ficou fácil
      </h1>

      {/* Descrição do Produto/Projeto */}
      <p className="text-lg md:text-xl max-w-150 mb-8 opacity-80 z-10 text-white leading-relaxed">
        Domine a Língua Brasileira de Sinais através de desafios, missões e uma jornada gamificada épica.
      </p>

      {/* Botões de Ação */}
      <div className="flex flex-col items-center z-10 w-full">
        <button 
          onClick={handleCameraTest}
          disabled={isLoading}
          className="bg-primary-cyan text-black px-8 py-3 rounded-full font-bold hover:bg-opacity-80 transition-all shadow-lg hover:shadow-primary-cyan/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Aguardando câmera...' : 'Teste sua câmera para começar'}
        </button>

        {status === 'granted' && stream && (
          <>
            <div className="mt-5 w-full max-w-sm rounded-2xl border border-primary-cyan/60 bg-black/40 p-3 shadow-lg">
              <p className="mb-2 text-sm text-primary-cyan">Pré-visualização da câmera</p>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedData={handleCameraReady}
                className="h-48 w-full rounded-lg object-cover scale-x-[-1]"
              />
              {isCameraConfirmed && (
                <p className="mt-3 rounded-lg bg-primary-cyan/10 px-3 py-2 text-sm font-semibold text-primary-cyan">
                  Imagem confirmada. Avançando em 2 segundos...
                </p>
              )}
            </div>

            <button
              onClick={handleStopCameraTest}
              className="mt-3 w-full max-w-sm rounded-full border border-primary-cyan px-6 py-2 font-semibold text-primary-cyan transition-colors hover:bg-primary-cyan hover:text-black"
            >
              Interromper teste
            </button>
          </>
        )}
      </div>

    </section>
  );
}
