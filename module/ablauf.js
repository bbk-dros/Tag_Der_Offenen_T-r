// Ablauf und Wirkung · Team Ablauf
// Platzhalter aus dem Starter. Er erfüllt die Schnittstelle (SCHNITTSTELLE.md):
// Taste 1 startet ein Einzelspiel, Taste 2 ein Duell. Nach der Runde steht kurz
// das Ergebnis da, dann geht es zurück zum Warten.
import { size, drawText, SIDES } from '../lib/stage.js';

const CONFIG = {
  resultSeconds: 5,
};

const flow = {
  state: 'waiting',   // 'waiting' | 'playing' | 'result'
  stateTime: 0,
  arena: null,

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  },

  begin(players) {
    this.players = players;
    this.arena.start(players);
    this.setState('playing');
  },

  // view: { poses, blades, arena }, dieselben Daten wie in lib/main.js
  update(dt, now, view) {
    this.arena = view.arena;
    this.stateTime += dt;
    if (this.state === 'playing' && !this.arena.running) this.setState('result');
    if (this.state === 'result' && this.stateTime > CONFIG.resultSeconds) this.reset();
  },

  draw(ctx) {
    const W = size.width;
    const H = size.height;
    if (this.state === 'waiting') {
      drawText('FRÜCHTE-DUELL', W / 2, H * 0.3, H * 0.12);
      drawText('Platzhalter: Taste 1 = allein, Taste 2 = zu zweit', W / 2, H * 0.45, H * 0.045, '#ffe066');
    } else if (this.state === 'result') {
      ctx.fillStyle = 'rgba(8, 10, 24, 0.6)';
      ctx.fillRect(0, 0, W, H);
      const [a, b] = this.arena.scores;
      if (this.players === 2) {
        drawText(`${a} : ${b}`, W / 2, H * 0.45, H * 0.15);
        drawText(`${SIDES[0].name} gegen ${SIDES[1].name}`, W / 2, H * 0.6, H * 0.045, '#c5c8e8');
      } else {
        drawText(`${a} Punkte`, W / 2, H * 0.45, H * 0.15);
      }
    }
  },

  reset() {
    this.arena?.stop();
    this.setState('waiting');
  },
};

window.addEventListener('keydown', (event) => {
  if (flow.state !== 'waiting' || !flow.arena) return;
  if (event.key === '1') flow.begin(1);
  if (event.key === '2') flow.begin(2);
});

export default flow;
