const CONFIG = Object.freeze({
  minDt: 1 / 120,
  maxDt: 1 / 15,
  bgColor: '#101820',
  textColor: '#f4f1de',
  accentColor: '#ffb703',
});

const state = {
  started: false,
  debug: false,
  useMouse: false,
  lastTime: 0,
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

function createView() {
  return {
    poses: [],
    blades: [],
    arena: {
      running: false,
      scores: [0, 0],
      events: [],
    },
  };
}

function cacheElements() {
  state.stage = document.getElementById('stage');
  state.ctx = state.stage ? state.stage.getContext('2d') : null;
  state.video = document.getElementById('video');
  state.loading = document.getElementById('loading');
  state.loadingText = document.getElementById('loadingText');
  state.loadingError = document.getElementById('loadingError');
  state.mouseButton = document.getElementById('mouseButton');
}

function setLoading(text, error = '') {
  if (state.loadingText) state.loadingText.textContent = text;
  if (state.loadingError) state.loadingError.textContent = error;
}

function resizeStage() {
  if (!state.stage) return;
  state.size.width = window.innerWidth;
  state.size.height = window.innerHeight;
  state.stage.width = state.size.width;
  state.stage.height = state.size.height;
}

function toggleMouseMode() {
  state.useMouse = !state.useMouse;
  setLoading(state.useMouse ? 'Mausmodus aktiv.' : 'Kameramodus vorbereitet.');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    return;
  }
  document.exitFullscreen?.();
}

function resetGame() {
  state.view = createView();
  setLoading('Grundstruktur bereit.');
}

function bindEvents() {
  window.addEventListener('resize', resizeStage);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') toggleMouseMode();
    if (event.key === 'd' || event.key === 'D') state.debug = !state.debug;
    if (event.key === 'Escape') resetGame();
    if (event.key === 'f' || event.key === 'F') toggleFullscreen();
  });
  if (state.mouseButton) {
    state.mouseButton.hidden = false;
    state.mouseButton.addEventListener('click', toggleMouseMode);
  }
}

function update(dt, now) {
  state.view.now = now;
  state.view.dt = dt;
  if (!state.view.arena.running && state.started) {
    state.view.arena.running = true;
  }
}

function drawBackground() {
  state.ctx.fillStyle = CONFIG.bgColor;
  state.ctx.fillRect(0, 0, state.size.width, state.size.height);
}

function drawCenteredText(text, y, size, color) {
  state.ctx.fillStyle = color;
  state.ctx.font = `bold ${size}px sans-serif`;
  state.ctx.textAlign = 'center';
  state.ctx.fillText(text, state.size.width / 2, y);
}

function drawPlaceholder() {
  drawCenteredText('Früchte-Duell', state.size.height * 0.32, 48, CONFIG.textColor);
  drawCenteredText('main.js Grundstruktur aktiv', state.size.height * 0.42, 28, CONFIG.accentColor);
  drawCenteredText('M = Maus · D = Debug · F = Vollbild · Esc = Reset', state.size.height * 0.5, 20, CONFIG.textColor);
  if (state.debug) {
    drawCenteredText(`Klingen: ${state.view.blades.length} · Posen: ${state.view.poses.length}`, state.size.height * 0.6, 18, CONFIG.textColor);
  }
}

function draw() {
  if (!state.ctx) return;
  drawBackground();
  drawPlaceholder();
}

function loop(timestamp) {
  const now = timestamp / 1000;
  const rawDt = state.lastTime ? now - state.lastTime : CONFIG.minDt;
  const dt = Math.min(CONFIG.maxDt, Math.max(CONFIG.minDt, rawDt));
  state.lastTime = now;
  update(dt, now);
  draw();
  window.requestAnimationFrame(loop);
}

function init() {
  cacheElements();
  if (!state.stage || !state.ctx) {
    setLoading('Grundstruktur konnte nicht gestartet werden.', 'Canvas fehlt.');
    return;
  }
  resizeStage();
  bindEvents();
  resetGame();
  state.started = true;
  setLoading('Grundstruktur geladen.');
  window.requestAnimationFrame(loop);
}

init();
