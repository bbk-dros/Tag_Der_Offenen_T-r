// Früchte und Treffer · Team Früchte
// Ohne Ablauf testen: http://localhost:8123/?nur=arena
import { size, drawText, SIDES } from '../lib/stage.js';

const CONFIG = {
  roundSeconds: 60,
  gravity: 620,
  fruitRadius: 0.045,
  bombRadius: 0.05,
  spawnBase: 1.5,
  spawnMin: 0.8,
  bombChance: 0.14,
  throwLift: 760,
  throwSpread: 160,
  splitSpeed: 220,
  autoStartBuffer: 0.2,
};

const FRUITS = ['🍉', '🍎', '🍊', '🍋', '🍇', '🍏'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distanceToSegment(px, py, x, y, cx, cy) {
  const dx = x - px;
  const dy = y - py;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = clamp(((cx - px) * dx + (cy - py) * dy) / lengthSq, 0, 1);
  const nearX = px + dx * t;
  const nearY = py + dy * t;
  return Math.hypot(cx - nearX, cy - nearY);
}

function makeFruit(side, x, vx, vy, bomb) {
  return {
    kind: bomb ? 'bomb' : 'fruit',
    side,
    x,
    y: size.height + 40,
    vx,
    vy,
    radius: size.height * (bomb ? CONFIG.bombRadius : CONFIG.fruitRadius),
    emoji: bomb ? '💣' : FRUITS[Math.floor(Math.random() * FRUITS.length)],
    color: bomb ? '#444' : '#ff8a2b',
  };
}

function spawnWave() {
  if (this.players === 2) {
    const centerX = size.width / 2;
    const offset = size.width * (0.12 + Math.random() * 0.12);
    const leftX = centerX - offset;
    const rightX = centerX + offset;
    const drift = (Math.random() - 0.5) * CONFIG.throwSpread;
    const lift = -(CONFIG.throwLift + Math.random() * 80);
    const bombLeft = Math.random() < CONFIG.bombChance;
    const bombRight = Math.random() < CONFIG.bombChance;
    this.fruits.push(
      makeFruit(0, leftX, drift, lift, bombLeft),
      makeFruit(1, rightX, -drift, lift, bombRight),
    );
    return;
  }
  const x = size.width * (0.15 + Math.random() * 0.7);
  const drift = (Math.random() - 0.5) * CONFIG.throwSpread;
  const bomb = Math.random() < CONFIG.bombChance;
  this.fruits.push(makeFruit(0, x, drift, -(CONFIG.throwLift + Math.random() * 80), bomb));
}

export default {
  running: false,
  scores: [0, 0],
  events: [],
  fruits: [],
  pieces: [],

  start(players) {
    this.players = players;
    this.scores = [0, 0];
    this.events = [];
    this.fruits = [];
    this.pieces = [];
    this.timeLeft = CONFIG.roundSeconds;
    this.spawnTimer = CONFIG.autoStartBuffer;
    this.running = true;
  },

  stop() {
    this.running = false;
  },

  update(dt, blades) {
    this.events = [];
    if (!this.running) return;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      this.running = false;
      this.timeLeft = 0;
      return;
    }

    const progress = 1 - this.timeLeft / CONFIG.roundSeconds;
    const interval = Math.max(CONFIG.spawnMin, CONFIG.spawnBase - progress * 0.6);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const bursts = 1 + (Math.random() < 0.35 + progress * 0.5 ? 1 : 0);
      for (let i = 0; i < bursts; i++) spawnWave.call(this);
      this.spawnTimer = interval * (0.7 + Math.random() * 0.8);
    }

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.x += fruit.vx * dt;
      fruit.y += fruit.vy * dt;
      fruit.vy += CONFIG.gravity * dt;

      if (this.players === 2) {
        const limit = size.width / 2;
        if (fruit.side === 0) fruit.x = Math.min(fruit.x, limit - fruit.radius);
        if (fruit.side === 1) fruit.x = Math.max(fruit.x, limit + fruit.radius);
      }

      for (const blade of blades) {
        if (!blade.fast) continue;
        if (this.players === 2 && blade.side !== fruit.side) continue;

        const hit = distanceToSegment(blade.px, blade.py, blade.x, blade.y, fruit.x, fruit.y) <= fruit.radius + 10;
        if (!hit) continue;

        const side = this.players === 2 ? blade.side : 0;
        this.fruits.splice(i, 1);

        if (fruit.kind === 'bomb') {
          this.scores[side] = Math.max(0, this.scores[side] - 5);
          this.events.push({ type: 'bomb', side, x: fruit.x, y: fruit.y, color: '#444' });
        } else {
          this.scores[side] += 1;
          this.events.push({ type: 'slice', side, x: fruit.x, y: fruit.y, color: fruit.color });
          for (let s = 0; s < 2; s++) {
            const sign = s === 0 ? -1 : 1;
            this.pieces.push({
              x: fruit.x,
              y: fruit.y,
              vx: sign * (80 + Math.random() * CONFIG.splitSpeed * 0.5),
              vy: -(120 + Math.random() * 120),
              radius: fruit.radius * 0.65,
              color: fruit.color,
            });
          }
        }
        break;
      }

      if (fruit.y - fruit.radius > size.height + 12) {
        this.fruits.splice(i, 1);
      }
    }

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vy += CONFIG.gravity * dt * 0.8;
      if (piece.y - piece.radius > size.height + 12) this.pieces.splice(i, 1);
    }
  },

  draw(ctx) {
    const W = size.width;
    const H = size.height;

    for (const piece of this.pieces) {
      ctx.fillStyle = piece.color;
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const fruit of this.fruits) {
      const fontSize = Math.max(18, fruit.radius * 2.6);
      ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.emoji, fruit.x, fruit.y);
    }

    const threshold = this.timeLeft <= 10;
    drawText(`${Math.ceil(this.timeLeft)}`, W / 2, H * 0.1, H * 0.06, threshold ? '#ff5a5a' : '#fff');
    drawText(`${this.scores[0]}`, W * 0.06, H * 0.1, H * 0.08, SIDES[0].color);
    if (this.players === 2) drawText(`${this.scores[1]}`, W * 0.94, H * 0.1, H * 0.08, SIDES[1].color);
  },
};
