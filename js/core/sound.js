// Tiny WebAudio sound effects: no audio files, works offline.

let ctx = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('cu-muted') === '1'; } catch { return false; }
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.15) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

// Short burst of noise, used for a hand clap.
function noise(dur, gain) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

export const sound = {
  get muted() { return muted; },
  setMuted(v) {
    muted = v;
    try { localStorage.setItem('cu-muted', v ? '1' : '0'); } catch { /* storage blocked */ }
  },
  tap() { if (!muted) tone(660, 0, 0.06, 'triangle', 0.08); },
  good() { if (!muted) { tone(523, 0, 0.12); tone(784, 0.1, 0.18); } },
  bad() { if (!muted) tone(180, 0, 0.25, 'square', 0.06); },
  clap() { if (!muted) noise(0.12, 0.5); },
  stomp() { if (!muted) { tone(90, 0, 0.18, 'sine', 0.5); tone(60, 0, 0.25, 'triangle', 0.3); } },
  spin() {
    if (muted) return;
    [440, 554, 659, 880].forEach((f, i) => tone(f, i * 0.06, 0.12, 'sine', 0.08));
  },
  // School bell, bamboo kentongan and whistle for the event activity.
  bell() {
    if (muted) return;
    [0, 0.28, 0.56].forEach((t) => { tone(1318, t, 0.5, 'sine', 0.12); tone(1976, t, 0.35, 'sine', 0.05); });
  },
  kentongan() {
    if (muted) return;
    [0, 0.22, 0.44].forEach((t) => { tone(420, t, 0.12, 'triangle', 0.4); tone(630, t, 0.06, 'square', 0.05); });
  },
  whistle() {
    if (muted) return;
    for (let i = 0; i < 8; i++) tone(i % 2 ? 2350 : 2150, i * 0.06, 0.07, 'sine', 0.1);
  },
  win() {
    if (muted) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.12));
  },
};
