// Ablauf und Wirkung · Team Ablauf
import { ctx, size, drawText, POSE, SIDES } from '../lib/stage.js';
import blades from './klingen.js';

const CONFIG = {
  resultSeconds: 9,
  countdownSeconds: 3,
  startHoldSeconds: 0.8,
};

const flow = {
  state: 'waiting',
  stateTime: 0,
  arena: null,
  players: 1,
  holdTime: 0,
  readyPose: null,
  trails: [],
  particles: [],
  shake: 0,
  record: null,
  newRecord: false,
  audioCtx: null,
  lastCountdown: null,
  winnerSoundPlayed: false,

  setState(state) {
    this.state = state;
    this.stateTime = 0;
    this.lastCountdown = null;
    this.winnerSoundPlayed = false;
    if (state === 'waiting') this.holdTime = 0;
    if (state === 'result') this.updateRecord();
  },

  begin(players) {
    if (this.state !== 'waiting' && this.state !== 'countdown') return;
    if (players !== 1 && players !== 2) players = 1;
    this.players = players;
    this.holdTime = 0;
    this.readyPose = null;
    this.setState('countdown');
    this.playTick(3);
  },

  detectPlayers(poses) {
    return poses?.length > 1 ? 2 : 1;
  },

  detectReadyPose(poses) {
    for (const pose of poses || []) {
      const nose = pose[POSE.NOSE];
      const left = pose[POSE.LEFT_WRIST];
      const right = pose[POSE.RIGHT_WRIST];
      if (!nose || !left || !right) continue;
      if (left.y < nose.y && right.y < nose.y) {
        return { x: nose.x, y: nose.y };
      }
    }
    return null;
  },

  ensureAudio() {
    if (typeof window === 'undefined') return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!this.audioCtx) this.audioCtx = new Ctor();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  },

  tone(frequency, duration, type = 'sine', volume = 0.05, endFrequency = frequency) {
    this.ensureAudio();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.linearRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },

  playTick(value) {
    const freq = value === 3 ? 660 : value === 2 ? 880 : 1040;
    this.tone(freq, 0.15, 'square', 0.04, freq + 120);
  },

  playEventSound(event) {
    if (event.type === 'slice') this.tone(220, 0.08, 'triangle', 0.04, 80);
    if (event.type === 'bomb') {
      this.tone(120, 0.22, 'sawtooth', 0.08, 40);
      this.tone(60, 0.28, 'square', 0.04, 20);
    }
  },

  playWinSound(side) {
    const freq = side === 0 ? 440 : 330;
    this.tone(freq, 0.18, 'triangle', 0.08, freq + 80);
    this.tone(freq * 1.5, 0.22, 'triangle', 0.06, freq * 2);
  },

  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  },

  updateRecord() {
    const scores = this.arena?.scores || [0, 0];
    const score = this.players === 2 ? Math.max(scores[0], scores[1]) : scores[0];
    const key = 'fruechte-duell-record';
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      const today = this.getTodayKey();
      const best = raw.day === today ? Number(raw.score || 0) : 0;
      const next = score > best ? score : best;
      this.record = next;
      this.newRecord = score > best;
      if (score > best || raw.day !== today) {
        localStorage.setItem(key, JSON.stringify({ day: today, score: next }));
      }
    } catch {
      this.record = score;
      this.newRecord = false;
    }
  },

  drawRecord() {
    const W = size.width;
    const H = size.height;
    const record = this.record ?? 0;
    drawText(`TAGESREKORD: ${record}`, W * 0.5, H * 0.84, H * 0.032, '#dfe6ff');
    if (this.newRecord) drawText('NEUER REKORD!', W * 0.5, H * 0.2, H * 0.07, '#ffe066');
  },

  // view: { poses, blades, arena }, dieselben Daten wie in lib/main.js
  update(dt, now, view) {
    this.arena = view.arena || this.arena;
    this.stateTime += dt;

    for (const blade of view.blades || []) {
      if (!blade.fast) continue;
      this.trails.push({
        side: blade.side,
        x: blade.x, y: blade.y,
        px: blade.px, py: blade.py,
        life: 0.22,
        glow: 1,
      });
    }
    this.trails = this.trails.filter((trail) => {
      trail.life -= dt;
      trail.glow *= 0.96;
      return trail.life > 0;
    });

    for (const event of view.arena?.events || []) {
      if (event.type === 'bomb') this.shake = Math.max(this.shake, 0.8);
      for (let i = 0; i < 12; i += 1) {
        this.particles.push({
          x: event.x + (Math.random() - 0.5) * 16,
          y: event.y + (Math.random() - 0.5) * 16,
          dx: (Math.random() - 0.5) * 160,
          dy: (Math.random() - 0.5) * 160,
          life: 0.55,
          color: event.color || (event.type === 'bomb' ? '#444' : SIDES[event.side]?.color || '#fff'),
          r: event.type === 'bomb' ? 4 : 3,
        });
      }
      this.playEventSound(event);
    }
    this.particles = this.particles.filter((p) => {
      p.x += p.dx * dt;
      p.y += p.dy * dt;
      p.life -= dt;
      return p.life > 0;
    });
    this.shake = Math.max(0, this.shake - dt * 1.7);

    if (this.state === 'waiting') {
      this.readyPose = this.detectReadyPose(view.poses || []);
      if (this.readyPose) {
        this.holdTime += dt;
        if (this.holdTime >= CONFIG.startHoldSeconds) {
          const players = this.detectPlayers(view.poses || []);
          this.begin(players);
        }
      } else {
        this.holdTime = 0;
      }
    }

    if (this.state === 'countdown') {
      const number = Math.max(1, 3 - Math.floor(this.stateTime));
      if (number !== this.lastCountdown && this.stateTime < CONFIG.countdownSeconds) {
        this.lastCountdown = number;
        this.playTick(number);
      }
      if (this.stateTime >= CONFIG.countdownSeconds) {
        this.arena.start(this.players);
        this.setState('playing');
      }
    }

    if (this.state === 'playing' && !this.arena.running) this.setState('result');
    if (this.state === 'result' && this.stateTime > CONFIG.resultSeconds) this.reset();
  },

  draw(ctx) {
    const W = size.width;
    const H = size.height;
    const offsetX = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 24 : 0;
    const offsetY = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 24 : 0;
    ctx.save();
    ctx.translate(offsetX, offsetY);

    if (this.state === 'waiting') {
      drawText('FRÜCHTE-DUELL', W / 2, H * 0.28, H * 0.12);
      drawText('Halte beide Handgelenke 0,8 s über die Nase, um zu starten.', W / 2, H * 0.45, H * 0.045, '#ffe066');
      if (this.readyPose) {
        const gy = this.readyPose.y - H * 0.12;
        const radius = H * 0.045;
        const progress = Math.min(1, this.holdTime / CONFIG.startHoldSeconds);
        ctx.strokeStyle = '#dfe6ff';
        ctx.lineWidth = H * 0.006;
        ctx.beginPath();
        ctx.arc(this.readyPose.x, gy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#7ef7c7';
        ctx.beginPath();
        ctx.arc(this.readyPose.x, gy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
      }
    }

    if (this.state === 'countdown') {
      const count = Math.max(1, 3 - Math.floor(this.stateTime));
      drawText(String(count), W / 2, H * 0.5, H * 0.18);
      drawText(this.players === 2 ? 'DUELL' : 'EINZEL', W / 2, H * 0.62, H * 0.05, '#dfe6ff');
    }

    if (this.state === 'result') {
      ctx.fillStyle = 'rgba(8, 10, 24, 0.6)';
      ctx.fillRect(0, 0, W, H);
      const [a, b] = this.arena.scores;
      if (this.players === 2) {
        const winner = a === b ? 'UNENTSCHIEDEN!' : a > b ? `${SIDES[0].name} GEWINNT!` : `${SIDES[1].name} GEWINNT!`;
        const side = a === b ? null : a > b ? 0 : 1;
        drawText(winner, W / 2, H * 0.45, H * 0.11, side === null ? '#eaf0ff' : SIDES[side].color);
        drawText(`${a} : ${b}`, W / 2, H * 0.58, H * 0.09, '#dfe6ff');
        if (side !== null && !this.winnerSoundPlayed) {
          this.playWinSound(side);
          this.winnerSoundPlayed = true;
        }
      } else {
        drawText(`${a} PUNKTE`, W / 2, H * 0.46, H * 0.12, '#ffe066');
      }
      this.drawRecord();
    } else {
      this.drawRecord();
    }

    for (const trail of this.trails) {
      const color = SIDES[trail.side]?.color || '#fff';
      const alpha = Math.max(0, trail.life / 0.22);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = H * 0.18;
      ctx.lineWidth = H * 0.024;
      ctx.globalAlpha = alpha * 1.0;
      ctx.beginPath();
      ctx.moveTo(trail.px, trail.py);
      ctx.lineTo(trail.x, trail.y);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = H * 0.26;
      ctx.lineWidth = H * 0.012;
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.moveTo(trail.px, trail.py);
      ctx.lineTo(trail.x, trail.y);
      ctx.stroke();

      ctx.restore();
    }

    for (const particle of this.particles) {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = Math.min(1, Math.max(0, particle.life * 1.6));
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  reset() {
    this.arena?.stop();
    this.holdTime = 0;
    this.readyPose = null;
    this.trails = [];
    this.particles = [];
    this.newRecord = false;
    this.setState('waiting');
  },
};

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') flow.reset();
  if (event.key === '1' && flow.state === 'waiting' && flow.arena) {
    blades.setLightsaberMode(false);
    flow.begin(1);
  }
  if (event.key === '2' && flow.state === 'waiting' && flow.arena) {
    blades.setLightsaberMode(false);
    flow.begin(2);
  }
  if (event.key === '3' && flow.state === 'waiting' && flow.arena) {
    blades.setLightsaberMode(true);
    flow.begin(1);
  }
  if (['1', '2', '3', 'Escape'].includes(event.key)) flow.ensureAudio();
});

flow.record = 0;
flow.updateRecord();

export default flow;
