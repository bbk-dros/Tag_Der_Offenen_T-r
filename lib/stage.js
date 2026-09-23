// Bühne für alle Module. Die Module importieren nur, was sie brauchen:
//   import { size, drawText, POSE, SIDES } from '../lib/stage.js';
import { setupCanvas } from './vision.js';

// ctx: Zeichenfläche (Canvas 2D), size: { width, height } in Pixeln.
export const { ctx, size } = setupCanvas(document.getElementById('stage'));

// Nummern der Körperpunkte (Landmarken) von MediaPipe Pose.
// Links und rechts aus Sicht der Person, nicht des Bildschirms.
export const POSE = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
};

// Die beiden Seiten im Duell: 0 = links, 1 = rechts.
export const SIDES = [
  { name: 'BLAU', color: '#3db8ff' },
  { name: 'ORANGE', color: '#ff9f1c' },
];

// Text mit dunklem Rand, gut lesbar auf dem Kamerabild.
export function drawText(text, x, y, fontSize, color = '#fff', { align = 'center', weight = 800 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, fontSize * 0.14);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
