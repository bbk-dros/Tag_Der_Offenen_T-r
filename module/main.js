const CONFIG = Object.freeze({
  minDt: 1 / 120,
  maxDt: 1 / 15,
  bgColor: '#101820',
  textColor: '#f4f1de',
  accentColor: '#ffb703',
});

function createView() {
  return {
    dt: 0,
    now: 0,
    poses: [],
    blades: [],
    arena: {
      running: false,
      scores: [0, 0],
      events: [],
    },
  };
}

function createState() {
  return {
    started: false,
    debug: false,
    useMouse: false,
    lastTime: null,
    stage: null,
    ctx: null,
    video: null,
    loading: null,
    loadingText: null,
    loadingError: null,
    mouseButton: null,
    size: { width: 0, height: 0 },
    view: createView(),
  };
}

function resetRuntimeState(state) {
  state.started = false;
  state.debug = false;
  state.useMouse = false;
  state.lastTime = null;
  state.size.width = 0;
  state.size.height = 0;
  state.view = createView();
}

function setLoading(state, text, error = '') {
  if (state.loadingText) state.loadingText.textContent = text;
  if (state.loadingError) state.loadingError.textContent = error;
}

function resizeStage(state) {
  if (!state.stage) return;
  state.size.width = window.innerWidth;
  state.size.height = window.innerHeight;
  state.stage.width = state.size.width;
  state.stage.height = state.size.height;
}

function drawCenteredText(ctx, size, text, y, fontSize, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, size.width / 2, y);
}

const main = {
  config: CONFIG,
  state: createState(),

  init(elements = {}) {
    const state = this.state;
    resetRuntimeState(state);
    state.stage = elements.stage || null;
    state.ctx = state.stage ? state.stage.getContext('2d') : null;
    state.video = elements.video || null;
    state.loading = elements.loading || null;
    state.loadingText = elements.loadingText || null;
    state.loadingError = elements.loadingError || null;
    state.mouseButton = elements.mouseButton || null;
    resizeStage(state);
    this.reset(false);
    state.started = !!state.ctx;
    setLoading(state, state.started ? 'Grundstruktur geladen.' : 'Canvas fehlt.');
    return state.started;
  },

  reset(showStatus = true) {
    this.state.lastTime = null;
    this.state.view = createView();
    if (showStatus) {
      setLoading(this.state, 'Grundstruktur bereit.');
    }
  },

  toggleMouseMode() {
    const state = this.state;
    state.useMouse = !state.useMouse;
    setLoading(state, state.useMouse ? 'Mausmodus aktiv.' : 'Kameramodus vorbereitet.');
  },

  handleKey(key) {
    if (key === 'm' || key === 'M') this.toggleMouseMode();
    if (key === 'd' || key === 'D') this.state.debug = !this.state.debug;
    if (key === 'Escape') this.reset();
  },

  update(dt, now) {
    const state = this.state;
    state.view.now = now;
    state.view.dt = dt;
    if (!state.view.arena.running && state.started) {
      state.view.arena.running = true;
    }
  },

  draw() {
    const state = this.state;
    if (!state.ctx) return;
    state.ctx.fillStyle = CONFIG.bgColor;
    state.ctx.fillRect(0, 0, state.size.width, state.size.height);
    drawCenteredText(state.ctx, state.size, 'Früchte-Duell', state.size.height * 0.32, 48, CONFIG.textColor);
    drawCenteredText(state.ctx, state.size, 'main.js Grundstruktur aktiv', state.size.height * 0.42, 28, CONFIG.accentColor);
    drawCenteredText(state.ctx, state.size, 'M = Maus · D = Debug · Esc = Reset', state.size.height * 0.5, 20, CONFIG.textColor);
    if (state.debug) {
      drawCenteredText(state.ctx, state.size, `Klingen: ${state.view.blades.length} · Posen: ${state.view.poses.length}`, state.size.height * 0.6, 18, CONFIG.textColor);
    }
  },

  loop(timestamp) {
    const state = this.state;
    const now = timestamp / 1000;
    const hasLastTime = typeof state.lastTime === 'number';
    const rawDt = hasLastTime ? now - state.lastTime : CONFIG.minDt;
    const dt = hasLastTime ? Math.min(CONFIG.maxDt, Math.max(0, rawDt)) : CONFIG.minDt;
    state.lastTime = now;
    this.update(dt, now);
    this.draw();
  },
};

globalThis.gameMain = main;
