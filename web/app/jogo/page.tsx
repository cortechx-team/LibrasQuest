'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { usePredictionSocket } from '../hooks/usePredictionSocket';
import { drawHandLandmarks } from '../lib/mediapipe/handFeatures';
import {
  MINIMUM_PREDICTION_CONFIDENCE,
  isConfidentPrediction,
  normalizePredictionLetter,
} from '../lib/prediction';

function getPredictionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idle: 'aguardando',
    connecting: 'conectando',
    handshaking: 'validando modelo',
    connected: 'conectada',
    disconnected: 'desconectada',
    error: 'erro',
  };

  return labels[status] ?? status;
}

function getInitializationMessage(handTrackingStatus: string, predictionStatus: string): string {
  if (predictionStatus !== 'connected') {
    return predictionStatus === 'handshaking'
      ? 'Validando modelo de reconhecimento...'
      : 'Conectando ao reconhecimento...';
  }

  if (handTrackingStatus === 'loading') {
    return 'Carregando modelo da câmera...';
  }

  return 'Preparando captura...';
}

export default function GameplayPage() {
  const { status, isLoading, error, stream, requestPermission } = useCameraPermission();
  const didRequestCamera = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    status: handTrackingStatus,
    frameData,
    error: handTrackingError,
  } = useHandLandmarker({
    videoRef,
    enabled: Boolean(stream),
  });
  const {
    status: predictionStatus,
    prediction,
    error: predictionError,
    sendFrame,
  } = usePredictionSocket(Boolean(stream));
  const isModelReady = handTrackingStatus === 'ready' || handTrackingStatus === 'detecting';
  const isSocketReady = predictionStatus === 'connected';
  const isConnectionError = predictionStatus === 'error' || handTrackingStatus === 'error';
  const isInitializing = Boolean(stream) && !isConnectionError && (!isModelReady || !isSocketReady);
  const recognizedLetter = isConfidentPrediction(prediction)
    ? normalizePredictionLetter(prediction.letter)
    : null;

  useEffect(() => {
    const confirmed = sessionStorage.getItem('librasquest-camera-confirmed') === 'true';

    if (confirmed && !didRequestCamera.current) {
      didRequestCamera.current = true;
      void requestPermission();
    }
  }, [requestPermission]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {
        // A câmera já foi liberada no fluxo inicial, mas alguns navegadores podem exigir nova interação.
      });
      return;
    }

    videoRef.current.srcObject = null;
  }, [stream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
      }
      if (canvas.height !== video.videoHeight) {
        canvas.height = video.videoHeight;
      }
    }

    drawHandLandmarks(canvas, frameData?.landmarks ?? null);

    if (frameData) {
      sendFrame(frameData.payload);
    }
  }, [frameData, sendFrame]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <Header />

      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-5 px-5 py-28 lg:grid-cols-[260px_1fr_280px]">
        <aside className="rounded-2xl border border-white/10 bg-bg-dark/70 p-5 backdrop-blur-md">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">Missão atual</p>
          <h1 className="mt-4 text-2xl font-bold">Faça o sinal indicado</h1>
          <div className="mt-6 rounded-xl border border-primary-cyan/35 bg-primary-cyan/10 p-5 text-center">
            <p className="text-sm text-white/70">Sinal</p>
            <p className="mt-2 text-4xl font-bold text-primary-cyan">Olá</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/70">
            Posicione sua mão dentro do quadro e repita o sinal para avançar no desafio.
          </p>
        </aside>

        <section className="flex min-h-[560px] flex-col rounded-2xl border border-primary-cyan/30 bg-black/35 p-4 shadow-[0_0_40px_rgba(66,245,227,0.12)] backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">Arena</p>
              <h2 className="mt-1 text-2xl font-bold">Câmera de reconhecimento</h2>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-primary-cyan hover:text-primary-cyan"
            >
              Voltar
            </Link>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/60">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full min-h-[420px] w-full scale-x-[-1] object-cover"
                />
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-white/15 bg-black/65 px-3 py-2">
                    {handTrackingStatus === 'detecting'
                      ? 'Mão detectada'
                      : handTrackingStatus === 'loading'
                        ? 'Carregando MediaPipe'
                        : 'Mostre uma mão'}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/65 px-3 py-2">
                    API: {getPredictionStatusLabel(predictionStatus)}
                  </span>
                </div>
                {isInitializing && (
                  <div className="absolute inset-0 grid place-items-center bg-black/65 text-center backdrop-blur-sm">
                    <div>
                      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-cyan/25 border-t-primary-cyan" />
                      <p className="mt-4 text-lg font-bold text-primary-cyan">
                        {getInitializationMessage(handTrackingStatus, predictionStatus)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="px-6 text-center">
                <p className="text-xl font-bold text-primary-cyan">
                  {isLoading ? 'Ativando câmera...' : 'Câmera aguardando confirmação'}
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/70">
                  Confirme a imagem na página principal ou ative a câmera para continuar o desafio.
                </p>
                <button
                  type="button"
                  onClick={() => void requestPermission()}
                  disabled={isLoading}
                  className="mt-6 rounded-full bg-primary-cyan px-6 py-3 font-bold text-black transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-cyan/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ativar câmera
                </button>
              </div>
            )}

            {status === 'error' && (
              <p className="absolute bottom-4 left-4 right-4 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                Não foi possível acessar a câmera. {error || 'Tente novamente.'}
              </p>
            )}

            {(handTrackingError || predictionError) && (
              <p className="absolute bottom-4 left-4 right-4 rounded-lg border border-amber-300/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-50">
                {handTrackingError || predictionError}
              </p>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-bg-dark/70 p-5 backdrop-blur-md">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">Progresso</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">XP</p>
              <p className="mt-1 text-3xl font-bold">0</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">Sequência</p>
              <p className="mt-1 text-3xl font-bold">0 dias</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">Reconhecimento</p>
              <p className="mt-1 text-3xl font-bold text-primary-cyan">
                {recognizedLetter ?? '--'}
              </p>
              <p className="mt-2 text-sm text-white/65">
                {prediction
                  ? prediction.confidence >= MINIMUM_PREDICTION_CONFIDENCE
                    ? `${Math.round(prediction.confidence * 100)}% de confiança`
                    : 'Nenhuma letra reconhecida'
                  : 'Aguardando sinal'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">Dados do frame</p>
              <p className="mt-1 font-bold">
                {frameData ? '63 coordenadas + 16 features' : 'Nenhuma mão detectada'}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
