// Klingen · Team Klingen
// Skelette und Klingen ansehen: http://localhost:8123/?nur=klingen
import { size, POSE } from '../lib/stage.js';

const CONFIG = {
  minVisibility: 0.5,     // unsichere Punkte nicht verwenden
  smoothing: 0.35,        // neue Position mit alter verrechnen
  fastThreshold: 1.2,     // Bildschirmhöhen pro Sekunde
  elbowOffset: 0.08,      // Klinge liegt etwas über dem Handgelenk in Richtung Ellbogen
  maxGapSeconds: 0.5,     // kurze Personenausfälle werden weich weitergeführt
};

// KI-Notiz:
// Weg und KI: Die Klingen kommen aus den Handgelenken, mit eigener Personen-Seite,
// weich geglättet und nur bei schneller Bewegung als Schnitt erkannt.
// Anfragen: Welche Werte vor der Kamera am stabilsten wirken.
// Was hat die KI gemacht? Die erste Version hat die Klingen direkt am Handgelenk gesetzt.
// Was mussten wir korrigieren? Smoothing, fast-Threshold und eine kurze Ghost-Phase.

function getShoulderSide(pose) {
  const left = pose[POSE.LEFT_SHOULDER];
  const right = pose[POSE.RIGHT_SHOULDER];
  const leftX = left?.x ?? Number.POSITIVE_INFINITY;
  const rightX = right?.x ?? Number.NEGATIVE_INFINITY;
  const centerX = Number.isFinite(leftX) && Number.isFinite(rightX)
    ? (leftX + rightX) / 2
    : pose[POSE.NOSE]?.x ?? size.width / 2;
  return centerX < size.width / 2 ? 0 : 1;
}

function bladePosition(pose, wristIndex, elbowIndex) {
  const wrist = pose[wristIndex];
  if (!wrist) return { x: size.width / 2, y: size.height / 2 };
  const elbow = pose[elbowIndex];
  const baseX = wrist.x;
  const baseY = wrist.y;

  if (elbow && elbow.visibility >= CONFIG.minVisibility) {
    const dx = wrist.x - elbow.x;
    const dy = wrist.y - elbow.y;
    const length = Math.hypot(dx, dy) || 1;
    const offset = Math.min(size.height * CONFIG.elbowOffset, length * 0.7);
    return {
      x: wrist.x + (dx / length) * offset,
      y: wrist.y + (dy / length) * offset,
    };
  }

  return { x: baseX, y: baseY };
}

export default {
  // Alle Klingen im aktuellen Bild: [{ side, x, y, px, py, fast }]
  list: [],
  tracked: new Map(),

  // Wird nur aufgerufen, wenn die Kamera ein neues Bild ausgewertet hat.
  // poses: je erkannter Person ein Array mit 33 Punkten { x, y, visibility },
  // x und y in Bildschirm-Pixeln. Die Nummern stehen in POSE.
  update(dt, now, poses) {
    const list = [];
    const seen = new Set();
    const tracked = this.tracked || new Map();

    for (let personIndex = 0; personIndex < poses.length; personIndex++) {
      const pose = poses[personIndex];
      if (!pose) continue;

      const side = getShoulderSide(pose);
      const wrists = [
        { key: `${personIndex}:LEFT_WRIST`, index: POSE.LEFT_WRIST, elbow: POSE.LEFT_ELBOW },
        { key: `${personIndex}:RIGHT_WRIST`, index: POSE.RIGHT_WRIST, elbow: POSE.RIGHT_ELBOW },
      ];

      for (const wristDef of wrists) {
        const wrist = pose[wristDef.index];
        const key = wristDef.key;
        const previous = tracked.get(key) || { x: 0, y: 0, px: 0, py: 0, lastSeen: 0, side };

        if (!wrist || wrist.visibility < CONFIG.minVisibility) {
          if (now - previous.lastSeen < CONFIG.maxGapSeconds) {
            const ghostX = previous.x + (previous.x - previous.px) * 0.25;
            const ghostY = previous.y + (previous.y - previous.py) * 0.25;
            const blade = {
              side: previous.side ?? side,
              x: ghostX,
              y: ghostY,
              px: previous.x,
              py: previous.y,
              fast: false,
            };
            list.push(blade);
            tracked.set(key, { ...previous, x: ghostX, y: ghostY, px: previous.x, py: previous.y });
          }
          continue;
        }

        const raw = bladePosition(pose, wristDef.index, wristDef.elbow);
        const prevX = Number.isFinite(previous.x) ? previous.x : raw.x;
        const prevY = Number.isFinite(previous.y) ? previous.y : raw.y;
        const x = prevX * (1 - CONFIG.smoothing) + raw.x * CONFIG.smoothing;
        const y = prevY * (1 - CONFIG.smoothing) + raw.y * CONFIG.smoothing;
        const speed = Math.hypot(x - prevX, y - prevY) / Math.max(dt, 1 / 120) / size.height;

        const blade = {
          side,
          x,
          y,
          px: prevX,
          py: prevY,
          fast: speed >= CONFIG.fastThreshold,
        };

        list.push(blade);
        seen.add(key);
        tracked.set(key, { x, y, px: prevX, py: prevY, lastSeen: now, side });
      }
    }

    for (const [key, previous] of tracked) {
      if (seen.has(key)) continue;
      if (now - (previous.lastSeen ?? 0) >= CONFIG.maxGapSeconds) {
        tracked.delete(key);
        continue;
      }

      const ghostX = previous.x + (previous.x - previous.px) * 0.25;
      const ghostY = previous.y + (previous.y - previous.py) * 0.25;
      list.push({
        side: previous.side,
        x: ghostX,
        y: ghostY,
        px: previous.x,
        py: previous.y,
        fast: false,
      });
      tracked.set(key, { ...previous, x: ghostX, y: ghostY, px: previous.x, py: previous.y });
    }

    this.list = list;
    this.tracked = tracked;
  },
};
