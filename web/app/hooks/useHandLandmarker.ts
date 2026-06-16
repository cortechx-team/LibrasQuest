'use client';

import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  buildHandFrameData,
  type HandFrameData,
  type HandLandmark,
  type Handedness,
} from '../lib/mediapipe/handFeatures';

type HandLandmarkerStatus = 'idle' | 'loading' | 'ready' | 'detecting' | 'error';

type UseHandLandmarkerOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  maxFramesPerSecond?: number;
  mirrorHorizontally?: boolean;
};

const MEDIAPIPE_VERSION = '0.10.35';
const MEDIAPIPE_WASM_URL =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const HAND_MODEL_URL = '/models/hand_landmarker.task';

function toHandLandmarks(landmarks: NormalizedLandmark[]): HandLandmark[] {
  return landmarks.map(({ x, y, z }) => ({ x, y, z }));
}

function parseHandedness(value: string | undefined): Handedness {
  if (value === 'Left' || value === 'Right') {
    return value;
  }

  return 'Unknown';
}

export function useHandLandmarker({
  videoRef,
  enabled,
  maxFramesPerSecond = 8,
  mirrorHorizontally = true,
}: UseHandLandmarkerOptions) {
  const [status, setStatus] = useState<HandLandmarkerStatus>('idle');
  const [frameData, setFrameData] = useState<HandFrameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const frameCallbackRef = useRef<number | null>(null);
  const scheduledVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setFrameData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let lastProcessedAt = 0;
    const frameInterval = 1000 / maxFramesPerSecond;

    async function initialize() {
      setStatus('loading');
      setError(null);

      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setStatus('ready');
        scheduleNextFrame();
      } catch (initializationError) {
        if (!cancelled) {
          setStatus('error');
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : 'Não foi possível iniciar o MediaPipe.',
          );
        }
      }
    }

    function scheduleNextFrame() {
      const video = videoRef.current;
      if (cancelled || !video) {
        return;
      }

      scheduledVideoRef.current = video;
      frameCallbackRef.current = video.requestVideoFrameCallback(processVideoFrame);
    }

    function processVideoFrame(now: number) {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (cancelled || !video || !landmarker) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && now - lastProcessedAt >= frameInterval) {
        lastProcessedAt = now;

        try {
          const result = landmarker.detectForVideo(video, now);
          const firstHand = result.landmarks[0];

          if (firstHand) {
            setFrameData(
              buildHandFrameData(
                toHandLandmarks(firstHand),
                parseHandedness(result.handedness[0]?.[0]?.categoryName),
                now,
                mirrorHorizontally,
              ),
            );
            setStatus('detecting');
          } else {
            setFrameData(null);
            setStatus('ready');
          }
        } catch (detectionError) {
          setStatus('error');
          setError(
            detectionError instanceof Error
              ? detectionError.message
              : 'Falha ao analisar o frame da câmera.',
          );
        }
      }

      scheduleNextFrame();
    }

    void initialize();

    return () => {
      cancelled = true;

      const scheduledVideo = scheduledVideoRef.current;
      if (scheduledVideo && frameCallbackRef.current !== null) {
        scheduledVideo.cancelVideoFrameCallback(frameCallbackRef.current);
      }

      frameCallbackRef.current = null;
      scheduledVideoRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [enabled, maxFramesPerSecond, mirrorHorizontally, videoRef]);

  return {
    status,
    frameData,
    error,
  };
}
