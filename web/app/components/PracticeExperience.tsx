'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './Header';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { type Prediction, usePredictionSocket } from '../hooks/usePredictionSocket';
import { fetchDictionaryWords } from '../lib/dictionary';
import { drawHandLandmarks } from '../lib/mediapipe/handFeatures';
import {
  MINIMUM_PREDICTION_CONFIDENCE,
  isConfidentPrediction,
  normalizePredictionLetter,
} from '../lib/prediction';

type ActiveFeedback = 'waiting' | 'success' | 'error' | 'low-confidence';

type PracticeLetter = {
  expected: string;
  display: string;
};

type PracticeWord = {
  label: string;
  letters: PracticeLetter[];
};

const LETTER_RECOGNITION_DELAY_MS = 1000;

function formatWord(letters: PracticeLetter[]): string {
  return letters.map((letter) => letter.display).join('-');
}

function buildPracticeWord(word: string): PracticeWord | null {
  const normalizedWord = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  if (!normalizedWord) {
    return null;
  }

  return {
    label: normalizedWord,
    letters: Array.from(normalizedWord).map((letter) => ({
      expected: letter,
      display: letter,
    })),
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idle: 'aguardando',
    connecting: 'conectando',
    handshaking: 'validando modelo',
    connected: 'conectada',
    disconnected: 'desconectada',
    error: 'erro',
    loading: 'carregando',
    ready: 'pronta',
    detecting: 'mão detectada',
  };

  return labels[status] ?? status;
}

function getInitializationMessage(
  handTrackingStatus: string,
  predictionStatus: string,
): string {
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

export default function PracticeExperience() {
  const { status, isLoading, error, stream, requestPermission } = useCameraPermission();
  const didRequestCamera = useRef(false);
  const completionTimeoutRef = useRef<number | null>(null);
  const lastHandledAtRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [practiceWords, setPracticeWords] = useState<PracticeWord[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<ActiveFeedback>('waiting');
  const [message, setMessage] = useState('Aguardando o gesto correto.');
  const [completedWords, setCompletedWords] = useState(0);
  const [isCompletingWord, setIsCompletingWord] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [failedHintImages, setFailedHintImages] = useState<Set<string>>(() => new Set());

  const currentWord = practiceWords[wordIndex] ?? null;
  const currentLetter = currentWord?.letters[activeIndex] ?? null;
  const formattedWord = useMemo(
    () => currentWord ? formatWord(currentWord.letters) : '',
    [currentWord],
  );

  const {
    status: handTrackingStatus,
    frameData,
    error: handTrackingError,
  } = useHandLandmarker({
    videoRef,
    enabled: Boolean(stream),
  });

  const resetActiveWord = useCallback((nextWordIndex: number) => {
    if (completionTimeoutRef.current !== null) {
      window.clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    setWordIndex(nextWordIndex);
    setActiveIndex(0);
    setActiveFeedback('waiting');
    setMessage('Aguardando o gesto correto.');
    setIsCompletingWord(false);
    setFailedHintImages(new Set());
    lastHandledAtRef.current = 0;
  }, []);

  const advanceWord = useCallback(() => {
    if (practiceWords.length === 0) {
      return;
    }

    setCompletedWords((current) => current + 1);
    setIsCompletingWord(true);
    setMessage('Palavra concluída. Preparando a próxima.');

    completionTimeoutRef.current = window.setTimeout(() => {
      resetActiveWord((wordIndex + 1) % practiceWords.length);
    }, 900);
  }, [practiceWords.length, resetActiveWord, wordIndex]);

  const handlePrediction = useCallback((nextPrediction: Prediction) => {
    if (!currentLetter || !currentWord || completionTimeoutRef.current !== null) {
      return;
    }

    const now = Date.now();
    if (now - lastHandledAtRef.current < LETTER_RECOGNITION_DELAY_MS) {
      return;
    }

    if (!isConfidentPrediction(nextPrediction)) {
      setActiveFeedback('low-confidence');
      setMessage('Nenhuma letra reconhecida');
      return;
    }

    lastHandledAtRef.current = now;
    const normalizedLetter = normalizePredictionLetter(nextPrediction.letter);

    if (normalizedLetter === currentLetter.expected) {
      setActiveFeedback('success');
      setMessage(`Letra ${currentLetter.display} reconhecida.`);

      const nextIndex = activeIndex + 1;
      if (nextIndex >= currentWord.letters.length) {
        advanceWord();
        return;
      }

      setActiveIndex(nextIndex);
      return;
    }

    setActiveFeedback('error');
    setMessage(`Sinal incorreto: tente a letra ${currentLetter.display}.`);
  }, [activeIndex, advanceWord, currentLetter, currentWord]);

  const {
    status: predictionStatus,
    prediction,
    error: predictionError,
    sendFrame,
  } = usePredictionSocket(Boolean(stream), handlePrediction);

  const isModelReady = handTrackingStatus === 'ready' || handTrackingStatus === 'detecting';
  const isSocketReady = predictionStatus === 'connected';
  const isConnectionError = predictionStatus === 'error' || handTrackingStatus === 'error';
  const isInitializing = Boolean(stream) && !isConnectionError && (!isModelReady || !isSocketReady);
  const recognizedLetter = isConfidentPrediction(prediction)
    ? normalizePredictionLetter(prediction.letter)
    : null;

  useEffect(() => {
    let active = true;

    async function loadWords() {
      setIsLoadingWords(true);
      setWordsError(null);

      try {
        const words = await fetchDictionaryWords();
        const preparedWords = words
          .map(buildPracticeWord)
          .filter((word): word is PracticeWord => Boolean(word));

        if (!active) {
          return;
        }

        setPracticeWords(preparedWords);
        setWordIndex(0);
        setActiveIndex(0);
        setActiveFeedback('waiting');
        setFailedHintImages(new Set());
        setMessage(
          preparedWords.length > 0
            ? 'Aguardando o gesto correto.'
            : 'Nenhuma palavra encontrada no dicionário.',
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setPracticeWords([]);
        setWordsError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as palavras do aprendizado.',
        );
      } finally {
        if (active) {
          setIsLoadingWords(false);
        }
      }
    }

    void loadWords();

    return () => {
      active = false;
    };
  }, []);

  const reloadWords = async () => {
    setIsLoadingWords(true);
    setWordsError(null);

    try {
      const words = await fetchDictionaryWords();
      const preparedWords = words
        .map(buildPracticeWord)
        .filter((word): word is PracticeWord => Boolean(word));

      setPracticeWords(preparedWords);
      setWordIndex(0);
      setActiveIndex(0);
      setActiveFeedback('waiting');
      setFailedHintImages(new Set());
      setMessage(
        preparedWords.length > 0
          ? 'Aguardando o gesto correto.'
          : 'Nenhuma palavra encontrada no dicionário.',
      );
    } catch (loadError) {
      setPracticeWords([]);
      setWordsError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as palavras do aprendizado.',
      );
    } finally {
      setIsLoadingWords(false);
    }
  };

  useEffect(() => {
    const confirmed = sessionStorage.getItem('librasquest-camera-confirmed') === 'true';

    if (confirmed && !didRequestCamera.current) {
      didRequestCamera.current = true;
      void requestPermission();
    }
  }, [requestPermission]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current !== null) {
        window.clearTimeout(completionTimeoutRef.current);
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
        // Alguns navegadores podem exigir nova interação antes de tocar o preview.
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

  const selectWord = (nextWordIndex: number) => {
    if (!practiceWords[nextWordIndex]) {
      return;
    }

    resetActiveWord(nextWordIndex);
  };

  const getLetterClassName = (index: number): string => {
    if (index < activeIndex || isCompletingWord) {
      return 'border-emerald-300 bg-emerald-400 text-emerald-950 shadow-[0_0_24px_rgba(52,211,153,0.35)]';
    }

    if (index === activeIndex && activeFeedback === 'error') {
      return 'border-red-300 bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)]';
    }

    if (index === activeIndex) {
      return 'border-yellow-200 bg-yellow-300 text-yellow-950 shadow-[0_0_26px_rgba(250,204,21,0.42)]';
    }

    return 'border-white/15 bg-white/8 text-white/65';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <Header autoHideOnScroll />

      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-5 px-5 py-28 lg:grid-cols-[280px_1fr_300px]">
        <aside className="rounded-2xl border border-white/10 bg-bg-dark/70 p-5 backdrop-blur-md">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">
            Aprendizado
          </p>
          <h1 className="mt-4 text-2xl font-bold">Pratique a palavra exibida</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Sinalize a letra destacada em amarelo. Use as dicas quando quiser apoio visual.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Dicas em Libras</p>
                <p className="mt-1 text-xs text-white/60">
                  {showHints ? 'Imagens visíveis' : 'Imagens ocultas'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showHints}
                onClick={() => setShowHints((current) => !current)}
                className={`relative h-8 w-14 rounded-full border transition-colors ${
                  showHints
                    ? 'border-primary-cyan bg-primary-cyan'
                    : 'border-white/20 bg-white/10'
                }`}
              >
                <span
                  className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                    showHints ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary-cyan/35 bg-primary-cyan/10 p-5">
            <p className="text-sm text-white/70">Palavra</p>
            <p className="mt-2 text-4xl font-bold text-primary-cyan">
              {isLoadingWords ? '...' : currentWord?.label ?? '--'}
            </p>
            <p className="mt-3 text-xl font-bold text-white">{formattedWord || 'Aguardando'}</p>
          </div>

          {wordsError && (
            <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-50">
              <p>{wordsError}</p>
              <button
                type="button"
                onClick={() => void reloadWords()}
                disabled={isLoadingWords}
                className="mt-3 rounded-full border border-amber-200/50 px-4 py-2 text-xs font-bold text-amber-50 transition-colors hover:bg-amber-200 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div className="mt-5 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {practiceWords.map((word, index) => (
              <button
                key={word.label}
                type="button"
                onClick={() => selectWord(index)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  index === wordIndex
                    ? 'border-primary-cyan bg-primary-cyan/15 text-primary-cyan'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
                }`}
              >
                {word.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col rounded-2xl border border-primary-cyan/30 bg-black/35 p-4 shadow-[0_0_40px_rgba(66,245,227,0.12)] backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">
                Aprendizado
              </p>
              <h2 className="mt-1 text-2xl font-bold">Câmera de reconhecimento</h2>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-primary-cyan hover:text-primary-cyan"
            >
              Voltar
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {currentWord ? currentWord.letters.map((letter, index) => (
              <div key={`${letter.expected}-${index}`} className="flex items-center gap-2">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-xl border text-2xl font-black transition-colors ${getLetterClassName(index)}`}
                >
                  {letter.display}
                </span>
                {index < currentWord.letters.length - 1 && (
                  <span className="text-xl font-bold text-white/35">-</span>
                )}
              </div>
            )) : (
              <p className="text-sm font-semibold text-white/65">
                {isLoadingWords ? 'Carregando palavras do dicionário...' : 'Nenhuma palavra disponível'}
              </p>
            )}
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
                        ? 'Carregando modelo'
                        : 'Mostre uma mão'}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/65 px-3 py-2">
                    API: {getStatusLabel(predictionStatus)}
                  </span>
                </div>

                {isInitializing && (
                  <div className="absolute inset-0 grid place-items-center bg-black/65 text-center backdrop-blur-sm">
                    <div>
                      <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary-cyan/25 border-t-primary-cyan animate-spin" />
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
                  Ative a câmera para iniciar o reconhecimento dos sinais.
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
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">Retenção</p>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-white/65">Letra atual</p>
            <p className="mt-1 text-5xl font-black text-yellow-300">{currentLetter?.display ?? '-'}</p>
          </div>

          <div
            className={`mt-4 rounded-xl border p-4 ${
              activeFeedback === 'error'
                ? 'border-red-300/35 bg-red-500/15'
                : activeFeedback === 'success'
                  ? 'border-emerald-300/35 bg-emerald-500/15'
                  : activeFeedback === 'low-confidence'
                    ? 'border-yellow-200/35 bg-yellow-400/15'
                    : 'border-white/10 bg-white/10'
            }`}
          >
            <p className="text-sm text-white/65">Feedback</p>
            <p className="mt-2 text-lg font-bold">{message}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">Palavras</p>
              <p className="mt-1 text-3xl font-bold">{completedWords}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/65">Progresso</p>
              <p className="mt-1 text-3xl font-bold">
                {currentWord ? `${activeIndex}/${currentWord.letters.length}` : '0/0'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white/10 p-4">
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

          {showHints && (
            <div className="mt-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">
                Dicas em Libras
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {currentWord?.letters.map((letter, index) => (
                  <div
                    key={`${letter.expected}-hint-${index}`}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/10"
                  >
                    <div className="relative aspect-square bg-white">
                      {failedHintImages.has(letter.expected) ? (
                        <div className="grid h-full w-full place-items-center bg-black/35 p-3 text-center">
                          <div>
                            <p className="text-4xl font-black text-primary-cyan">{letter.display}</p>
                            <p className="mt-2 text-xs font-semibold text-white/70">Imagem indisponível</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={`/Letras_LBQ/${letter.expected}.jpeg`}
                          alt={`Letra ${letter.display} em Libras`}
                          className="h-full w-full object-contain p-2"
                          loading="eager"
                          onError={() => {
                            setFailedHintImages((current) => {
                              const next = new Set(current);
                              next.add(letter.expected);
                              return next;
                            });
                          }}
                        />
                      )}
                    </div>
                    <p className="px-3 py-2 text-center text-sm font-bold text-white">
                      {letter.display}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
