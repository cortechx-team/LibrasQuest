export type Handedness = 'Left' | 'Right' | 'Unknown';

export type HandLandmark = {
  x: number;
  y: number;
  z: number;
};

export type HandPredictionPayload = {
  coordinates: number[];
  features: number[];
  handedness: Handedness;
  timestamp_ms: number;
};

export type HandFrameData = {
  landmarks: HandLandmark[];
  normalizedLandmarks: HandLandmark[];
  featureNames: readonly string[];
  payload: HandPredictionPayload;
};

export const HAND_FEATURE_NAMES = [
  'dist_polegar_pulso',
  'dist_indicador_pulso',
  'dist_medio_pulso',
  'dist_anelar_pulso',
  'dist_minimo_pulso',
  'dist_indicador_medio_pontas',
  'dist_indicador_medio_pip',
  'dist_indicador_medio_mcp',
  'dist_polegar_minimo_pontas',
  'dist_polegar_indicador_pontas',
  'dist_polegar_indicador_mcp',
  'dist_polegar_indicador_pip',
  'dist_polegar_indicador_dip',
  'dist_polegar_indicador_tip',
  'dist_indicador_anelar_pontas',
  'dist_medio_anelar_pontas',
] as const;

const FINGERTIP_INDICES = [4, 8, 12, 16, 20] as const;
const FEATURE_PAIRS = [
  [8, 12],
  [6, 10],
  [5, 9],
  [4, 20],
  [4, 8],
  [4, 5],
  [4, 6],
  [4, 7],
  [4, 8],
  [8, 16],
  [12, 16],
] as const;

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
] as const;

function flattenLandmarks(landmarks: HandLandmark[]): number[] {
  return landmarks.flatMap(({ x, y, z }) => [x, y, z]);
}

function distance(pointA: HandLandmark, pointB: HandLandmark): number {
  return Math.hypot(
    pointA.x - pointB.x,
    pointA.y - pointB.y,
    pointA.z - pointB.z,
  );
}

export function normalizeHandLandmarks(landmarks: HandLandmark[]): HandLandmark[] {
  if (landmarks.length !== 21) {
    throw new Error(`Esperados 21 landmarks da mão. Recebidos: ${landmarks.length}.`);
  }

  const wrist = landmarks[0];
  const translated = landmarks.map(({ x, y, z }) => ({
    x: x - wrist.x,
    y: y - wrist.y,
    z: z - wrist.z,
  }));

  const scale = Math.max(
    ...translated.flatMap(({ x, y, z }) => [Math.abs(x), Math.abs(y), Math.abs(z)]),
  );

  if (scale === 0) {
    return translated;
  }

  return translated.map(({ x, y, z }) => ({
    x: x / scale,
    y: y / scale,
    z: z / scale,
  }));
}

export function buildHandFeatures(normalizedLandmarks: HandLandmark[]): number[] {
  if (normalizedLandmarks.length !== 21) {
    throw new Error(`Esperados 21 landmarks normalizados. Recebidos: ${normalizedLandmarks.length}.`);
  }

  const wrist = normalizedLandmarks[0];
  const wristDistances = FINGERTIP_INDICES.map((index) =>
    distance(normalizedLandmarks[index], wrist),
  );
  const pairDistances = FEATURE_PAIRS.map(([indexA, indexB]) =>
    distance(normalizedLandmarks[indexA], normalizedLandmarks[indexB]),
  );

  return [...wristDistances, ...pairDistances];
}

export function buildHandFrameData(
  landmarks: HandLandmark[],
  handedness: Handedness,
  timestampMs: number,
  mirrorHorizontally = true,
): HandFrameData {
  const orientedLandmarks = landmarks.map(({ x, y, z }) => ({
    x: mirrorHorizontally ? 1 - x : x,
    y,
    z,
  }));
  const normalizedLandmarks = normalizeHandLandmarks(orientedLandmarks);

  return {
    landmarks: orientedLandmarks,
    normalizedLandmarks,
    featureNames: HAND_FEATURE_NAMES,
    payload: {
      coordinates: flattenLandmarks(normalizedLandmarks),
      features: buildHandFeatures(normalizedLandmarks),
      handedness,
      timestamp_ms: timestampMs,
    },
  };
}

export function drawHandLandmarks(
  canvas: HTMLCanvasElement,
  landmarks: HandLandmark[] | null,
): void {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) {
    return;
  }

  context.lineWidth = Math.max(2, canvas.width / 320);
  context.strokeStyle = '#42f5e3';
  context.fillStyle = '#ffffff';

  for (const [start, end] of HAND_CONNECTIONS) {
    context.beginPath();
    context.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
    context.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
    context.stroke();
  }

  for (const landmark of landmarks) {
    context.beginPath();
    context.arc(
      landmark.x * canvas.width,
      landmark.y * canvas.height,
      Math.max(3, canvas.width / 180),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}
