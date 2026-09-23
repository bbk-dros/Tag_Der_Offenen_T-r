// Früchte und Treffer · Team Früchte
// Platzhalter aus dem Starter. Er erfüllt die Schnittstelle (SCHNITTSTELLE.md):
// Eine Zielscheibe steht still, ein schneller Schnitt durch sie gibt einen Punkt.
// Ohne Ablauf testen: http://localhost:8123/?nur=arena
import { size, drawText, SIDES } from '../lib/stage.js';

const CONFIG = {
  roundSeconds: 20,
  targetRadius: 0.08,   // Anteil der Bildschirmhöhe
};

export default {
  running: false,
  scores: [0, 0],
  events: [],   // was in diesem Bild passiert ist: [{ type: 'slice', side, x, y, color }]

  start(players) {
    this.players = players;
    this.scores = [0, 0];
    this.timeLeft = CONFIG.roundSeconds;
    this.running = true;
    this.moveTarget();
  },

  stop() {
    this.running = false;
  },

  moveTarget() {
    this.target = {
      x: size.width * (0.2 + Math.random() * 0.6),
      y: size.height * (0.3 + Math.random() * 0.4),
    };
  },

  update(dt, blades) {
    this.events = [];
    if (!this.running) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.running = false;
    const r = size.height * CONFIG.targetRadius;
    for (const blade of blades) {
      if (!blade.fast) continue;
      if (Math.hypot(blade.x - this.target.x, blade.y - this.target.y) > r) continue;
      const side = this.players === 2 ? blade.side : 0;
      this.scores[side] += 1;
      this.events.push({ type: 'slice', side, x: this.target.x, y: this.target.y, color: '#ff4d6d' });
      this.moveTarget();
    }
  },

  draw(ctx) {
    if (!this.running) return;
    const H = size.height;
    const r = H * CONFIG.targetRadius;
    ctx.fillStyle = 'rgba(255, 77, 109, 0.6)';
    ctx.beginPath();
    ctx.arc(this.target.x, this.target.y, r, 0, Math.PI * 2);
    ctx.fill();
    drawText('Platzhalter-Arena: schnell durch den Kreis', size.width / 2, H * 0.2, H * 0.035, '#ffe066');
    drawText(`${this.scores[0]}`, size.width * 0.05, H * 0.1, H * 0.08, SIDES[0].color);
    if (this.players === 2) drawText(`${this.scores[1]}`, size.width * 0.95, H * 0.1, H * 0.08, SIDES[1].color);
    drawText(`${Math.ceil(this.timeLeft)}`, size.width / 2, H * 0.1, H * 0.06);
  },
};
