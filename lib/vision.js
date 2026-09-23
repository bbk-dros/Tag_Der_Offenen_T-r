// Gemeinsame Bausteine: Kamera starten, MediaPipe-Modelle laden,
// Kamerabild gespiegelt zeichnen und Landmarken auf den Bildschirm umrechnen.
import {
  FilesetResolver,
  PoseLandmarker,
  GestureRecognizer,
} from '../vendor/mediapipe/vision_bundle.mjs';

const WASM_PATH = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL_PATH = new URL('../vendor/models/', import.meta.url).href;

let filesetPromise = null;
function loadFileset() {
  filesetPromise ??= FilesetResolver.forVisionTasks(WASM_PATH);
  return filesetPromise;
}

// Erst die Grafikkarte versuchen, bei Fehlern auf den Prozessor ausweichen.
async function createWithFallback(TaskClass, options, preferred = 'GPU') {
  const fileset = await loadFileset();
  const order = preferred === 'CPU' ? ['CPU'] : ['GPU', 'CPU'];
  let lastError;
  for (const delegate of order) {
    try {
      const task = await TaskClass.createFromOptions(fileset, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate },
      });
      return { task, delegate };
    } catch (error) {
      lastError = error;
      console.warn(`MediaPipe mit ${delegate} fehlgeschlagen`, error);
    }
  }
  throw lastError;
}

export function createPoseLandmarker({ model = 'lite', numPoses = 2, delegate } = {}) {
  return createWithFallback(PoseLandmarker, {
    baseOptions: { modelAssetPath: `${MODEL_PATH}pose_landmarker_${model}.task` },
    runningMode: 'VIDEO',
    numPoses,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  }, delegate);
}

export function createGestureRecognizer({ numHands = 1, delegate } = {}) {
  return createWithFallback(GestureRecognizer, {
    baseOptions: { modelAssetPath: `${MODEL_PATH}gesture_recognizer.task` },
    runningMode: 'VIDEO',
    numHands,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  }, delegate);
}

export async function startCamera(video, { width = 1280, height = 720 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Dieser Browser gibt keine Kamera frei. Seite über http://localhost öffnen, nicht als Datei.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: width }, height: { ideal: height }, facingMode: 'user' },
    audio: false,
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  if (!video.videoWidth) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }
  return stream;
}

// Zeichnet das Kamerabild bildschirmfüllend und gespiegelt ("wie ein Spiegel").
// Gibt die Umrechnung zurück: Landmarke (0..1) -> Bildschirmpunkt.
export function drawMirroredVideo(ctx, video, width, height, dim = 0) {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const scale = Math.max(width / vw, height / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const ox = (width - dw) / 2;
  const oy = (height - dh) / 2;

  if (video.readyState >= 2) {
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, ox, oy, dw, dh);
    ctx.restore();
  }
  if (dim > 0) {
    ctx.fillStyle = `rgba(8, 10, 24, ${dim})`;
    ctx.fillRect(0, 0, width, height);
  }
  return (landmark) => ({
    x: width - (ox + landmark.x * dw),
    y: oy + landmark.y * dh,
  });
}

// Zählt, wie oft pro Sekunde etwas passiert (gleitender Mittelwert).
export class RateMeter {
  constructor() {
    this.rate = 0;
    this.last = 0;
  }
  tick(now = performance.now()) {
    if (this.last) {
      const current = 1000 / Math.max(1, now - this.last);
      this.rate = this.rate ? this.rate * 0.9 + current * 0.1 : current;
    }
    this.last = now;
  }
}

// Ruft detect() nur auf, wenn die Kamera wirklich ein neues Bild geliefert hat.
export class VideoDetector {
  constructor(video, detect) {
    this.video = video;
    this.detect = detect;
    this.lastVideoTime = -1;
    this.lastTimestamp = 0;
    this.result = null;
    this.inferenceMs = 0;
    this.meter = new RateMeter();
  }
  update() {
    const { video } = this;
    if (video.readyState < 2 || video.currentTime === this.lastVideoTime) return false;
    this.lastVideoTime = video.currentTime;
    // MediaPipe verlangt streng steigende Zeitstempel.
    const timestamp = Math.max(performance.now(), this.lastTimestamp + 1);
    this.lastTimestamp = timestamp;
    const start = performance.now();
    this.result = this.detect(video, timestamp);
    const took = performance.now() - start;
    this.inferenceMs = this.inferenceMs ? this.inferenceMs * 0.9 + took * 0.1 : took;
    this.meter.tick();
    return true;
  }
}

export const POSE = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
};

export const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;
export const HAND_CONNECTIONS = GestureRecognizer.HAND_CONNECTIONS;

export function drawSkeleton(ctx, landmarks, toScreen, connections, color, lineWidth = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  for (const { start, end } of connections) {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!a || !b || (a.visibility ?? 1) < 0.4 || (b.visibility ?? 1) < 0.4) continue;
    const p = toScreen(a);
    const q = toScreen(b);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  for (const landmark of landmarks) {
    if ((landmark.visibility ?? 1) < 0.4) continue;
    const p = toScreen(landmark);
    ctx.beginPath();
    ctx.arc(p.x, p.y, lineWidth * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

// Bildschirmfüllende Leinwand, die bei Größenänderung mitwächst.
export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const size = { width: 0, height: 0, dpr: 1 };
  const resize = () => {
    size.dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    canvas.width = Math.round(size.width * size.dpr);
    canvas.height = Math.round(size.height * size.dpr);
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  };
  window.addEventListener('resize', resize);
  resize();
  return { ctx, size };
}
