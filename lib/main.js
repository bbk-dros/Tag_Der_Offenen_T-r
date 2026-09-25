// Unterbau des Früchte-Duells: Kamera, Körpererkennung, Maus-Modus, Hauptschleife.
// Diese Datei ändert kein Team. Sie verbindet die drei Module in module/.
// Zum Testen einzelner Teile:
//   http://localhost:8123/?nur=arena     Arena ohne Ablauf, Runde startet von selbst
//   http://localhost:8123/?nur=klingen   nur Skelette und Klingen, kein Spiel
import {
  createPoseLandmarker, startCamera, drawMirroredVideo, drawSkeleton,
  VideoDetector, POSE_CONNECTIONS, toggleFullscreen,
} from './vision.js';
import { ctx, size, drawText, SIDES } from './stage.js';
window.appReady = true;

const params = new URLSearchParams(location.search);
const CONFIG = {
  mouseFastSpeed: 1.0,     // Mausklinge ist "fast" ab so vielen Bildschirmhöhen pro Sekunde
  autoStartSeconds: 2,     // ?nur=arena: Pause zwischen zwei Runden
  model: params.get('modell') === 'full' ? 'full' : 'lite',
};
const only = params.get('nur');   // 'arena' | 'klingen' | null

// ── Module laden: eine kaputte Datei legt nicht alles lahm ────────────────
async function loadModule(path) {
  try {
    return (await import(path)).default;
  } catch (error) {
    console.error(`Fehler in ${path.replace('../', '')}:`, error);
    return null;
  }
}
const broken = [];
const blades = (await loadModule('../module/klingen.js')) ?? (broken.push('klingen.js'), { list: [], update() {} });
const arena = (await loadModule('../module/arena.js')) ?? (broken.push('arena.js'), {
  running: false, scores: [0, 0], events: [], start() {}, stop() {}, update() {}, draw() {},
});
const flow = only ? null : ((await loadModule('../module/ablauf.js')) ?? (broken.push('ablauf.js'), null));

const video = document.getElementById('video');
let detector = null;
let delegateUsed = '';
let mouseMode = false;
let debug = only === 'klingen';
let poses = [];
let lastDetection = 0;
const mouse = { x: 0, y: 0, px: 0, py: 0 };

// ── Fehler in einem Modul: anzeigen und weiterlaufen ──────────────────────
let lastError = null;
function safely(fn) {
  try {
    fn();
  } catch (error) {
    if (lastError?.message !== error.message) console.error(error);
    lastError = { message: error.message, until: performance.now() + 5000 };
  }
}
function drawErrors() {
  const W = size.width;
  const H = size.height;
  if (broken.length) {
    drawText(`Lädt nicht: ${broken.join(', ')} · Konsole (F12)`, W / 2, H * 0.04, H * 0.03, '#ff7a7a');
  }
  if (!lastError || performance.now() > lastError.until) return;
  ctx.fillStyle = 'rgba(120, 0, 0, 0.85)';
  ctx.fillRect(0, H - H * 0.14, W, H * 0.14);
  drawText(`Fehler: ${lastError.message}`, W / 2, H * 0.9, H * 0.03, '#fff');
  drawText('Datei und Zeile stehen in der Konsole (F12)', W / 2, H * 0.95, H * 0.025, '#ffd0d0', { weight: 600 });
}

// ── Kamera → poses: Landmarken gleich in Bildschirm-Pixeln ────────────────
function toPoses(result, toScreen) {
  return result.landmarks.map((landmarks) => landmarks.map((lm) => {
    const p = toScreen(lm);
    return { x: p.x, y: p.y, visibility: lm.visibility ?? 1 };
  }));
}

// Im Maus-Modus gibt es genau eine Klinge. Die Seite hängt von der Bildhälfte ab.
function mouseBlade(dt) {
  const speed = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py) / Math.max(dt, 0.001) / size.height;
  const blade = {
    side: mouse.x < size.width / 2 ? 0 : 1,
    x: mouse.x, y: mouse.y, px: mouse.px, py: mouse.py,
    fast: speed >= CONFIG.mouseFastSpeed,
  };
  mouse.px = mouse.x;
  mouse.py = mouse.y;
  return blade;
}

function drawBladePoints(list, lightsaberMode) {
  if (lightsaberMode) {
    ctx.lineWidth = size.height * 0.028;
    ctx.lineCap = 'round';
    for (let i = 1; i < list.length; i++) {
      const previous = list[i - 1];
      const blade = list[i];
      if (previous.side !== blade.side
        || Math.hypot(blade.x - previous.x, blade.y - previous.y) > size.height * 0.1) continue;
      ctx.strokeStyle = SIDES[blade.side]?.color ?? '#fff';
      ctx.globalAlpha = blade.fast ? 0.9 : 0.4;
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(blade.x, blade.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return;
  }
  for (const b of list) {
    ctx.fillStyle = SIDES[b.side]?.color ?? '#fff';
    ctx.globalAlpha = b.fast ? 0.9 : 0.4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, size.height * (b.fast ? 0.022 : 0.014), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Hauptschleife ──────────────────────────────────────────────────────────
let lastFrame = performance.now();
let idleTime = 0;

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (nowMs - lastFrame) / 1000);
  lastFrame = nowMs;
  const W = size.width;
  const H = size.height;

  ctx.fillStyle = '#080a18';
  ctx.fillRect(0, 0, W, H);
  const toScreen = drawMirroredVideo(ctx, video, W, H, arena.running ? 0.2 : 0.4);

  // Klingen nur neu berechnen, wenn die Kamera ein neues Bild ausgewertet hat.
  if (!mouseMode && detector && detector.update()) {
    poses = toPoses(detector.result, toScreen);
    const camDt = lastDetection ? Math.min(0.2, now - lastDetection) : 0.033;
    lastDetection = now;
    safely(() => blades.update(camDt, now, poses));
  }
  const bladeList = mouseMode ? [mouseBlade(dt)] : blades.list;

  if (only === 'arena') {
    idleTime = arena.running ? 0 : idleTime + dt;
    if (idleTime > CONFIG.autoStartSeconds) safely(() => arena.start(2));
  } else if (flow) {
    safely(() => flow.update(dt, now, { poses, blades: bladeList, arena }));
  }
  if (only !== 'klingen') {
    safely(() => arena.update(dt, bladeList));
    safely(() => arena.draw(ctx));
  }
  if (flow) safely(() => flow.draw(ctx));
  drawBladePoints(bladeList, !mouseMode && blades.lightsaberMode);

  if (debug) {
    poses.forEach((landmarks, i) => drawSkeleton(ctx, landmarks, (p) => p, POSE_CONNECTIONS, i ? '#ffffff' : '#7df9ff', 3));
    const lines = [
      `Erkennung: ${detector ? detector.meter.rate.toFixed(0) : '–'} /s · ${detector ? detector.inferenceMs.toFixed(0) : '–'} ms`,
      `Gerechnet auf: ${delegateUsed || '–'} · Modell: ${CONFIG.model}${mouseMode ? ' · Maus-Modus' : ''}`,
      `Personen: ${poses.length} · Klingen: ${bladeList.length} · schnell: ${bladeList.filter((b) => b.fast).length}`,
      `Arena läuft: ${arena.running} · Punkte: ${arena.scores?.join(' : ')}`,
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, H - 124, 440, 114);
    lines.forEach((line, i) => drawText(line, 22, H - 104 + i * 26, 18, '#fff', { align: 'left', weight: 600 }));
  }
  if (only) drawText(`Testmodus: nur ${only}`, W - 20, H * 0.03, H * 0.025, '#8f95c9', { align: 'right', weight: 600 });
  drawErrors();
  requestAnimationFrame(frame);
}

// ── Tasten und Maus ────────────────────────────────────────────────────────
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'f') toggleFullscreen();
  if (key === 'd') debug = !debug;
  if (key === 'm') toggleMouse();
  if (key === 'escape' && flow) safely(() => flow.reset());
});
window.addEventListener('pointermove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

function toggleMouse() {
  mouseMode = !mouseMode;
  poses = [];
  if (mouseMode) document.getElementById('loading').hidden = true;
}
document.getElementById('mouseButton').addEventListener('click', () => { if (!mouseMode) toggleMouse(); });

// ── Start ──────────────────────────────────────────────────────────────────
requestAnimationFrame(frame);
try {
  await startCamera(video, { width: 1280, height: 720 });
  document.getElementById('loadingText').textContent = 'KI-Modell wird geladen …';
  const { task, delegate } = await createPoseLandmarker({ model: CONFIG.model, numPoses: 2 });
  delegateUsed = delegate === 'GPU' ? 'Grafikkarte' : 'Prozessor';
  detector = new VideoDetector(video, (v, t) => task.detectForVideo(v, t));
  document.getElementById('loading').hidden = true;
} catch (error) {
  console.error(error);
  document.querySelector('#loading .spinner').hidden = true;
  document.getElementById('loadingText').textContent = 'Das hat nicht geklappt.';
  document.getElementById('loadingError').textContent =
    error.name === 'NotAllowedError' ? 'Der Kamerazugriff wurde verweigert. Im Browser oben links erlauben und neu laden.'
    : error.name === 'NotFoundError' ? 'Keine Kamera gefunden.'
    : error.message;
  document.getElementById('mouseButton').hidden = false;
}
