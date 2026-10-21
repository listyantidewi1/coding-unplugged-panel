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

export const sound = {
  get muted() { return muted; },
  setMuted(v) {
    muted = v;
    try { localStorage.setItem('cu-muted', v ? '1' : '0'); } catch { /* storage blocked */ }
  },
  tap() { if (!muted) tone(660, 0, 0.06, 'triangle', 0.08); },
  good() { if (!muted) { tone(523, 0, 0.12); tone(784, 0.1, 0.18); } },
  bad() { if (!muted) tone(180, 0, 0.25, 'square', 0.06); },
  win() {
    if (muted) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.12));
  },
};
