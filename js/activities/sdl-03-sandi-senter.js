// Sandi Senter Pramuka — SD Lanjut (10–12 tahun), pengodean pesan.
// Two ways to flash a message at night: Morse (short/long) and the 5-lamp
// code (letter number in 16 8 4 2 1). Read, write and compare both.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};
const LETTERS = Object.keys(MORSE);
export const lampCode = (ch) => (ch.charCodeAt(0) - 64).toString(2).padStart(5, '0');
const showMorse = (code) => code.replace(/\./g, '•').replace(/-/g, '—').split('').join(' ');
const morseOf = (word) => word.split('').map((c) => (c === ' ' ? '|' : showMorse(MORSE[c]))).join('  /  ');
const lampOf = (word) => word.split('').map((c) => (c === ' ' ? '|' : lampCode(c))).join(' / ');
const morseFlashes = (word) => word.split('').reduce((n, c) => n + (MORSE[c] || '').length, 0);
const letterCount = (word) => word.replace(/ /g, '').length;

const WORDS = ['TENDA', 'API', 'REGU', 'KEMAH', 'PETA', 'TALI', 'BUMI', 'HUTAN', 'TOLONG', 'PULANG', 'MAKAN', 'BARU'];

// A flashlight that can play a Morse or 5-lamp sequence; `count` shows
// how many flashes or ticks have gone by.
function torch() {
  const glass = el('div', { class: 'torch-glass' });
  const count = el('span', { class: 'open-count' }, 'Kedipan: 0');
  const node = el('div', { class: 'torch' }, glass, el('div', { class: 'torch-body' }), count);
  let timers = [];
  let n = 0;
  const light = (on) => glass.classList.toggle('on', on);
  const stop = () => { timers.forEach(clearTimeout); timers = []; light(false); };
  const at = (ms, f) => timers.push(setTimeout(f, ms));
  const tick = (label) => { n++; count.textContent = `${label}: ${n}`; };
  return {
    node,
    stop,
    light,
    reset(label = 'Kedipan') { stop(); n = 0; count.textContent = `${label}: 0`; },
    flash(ms, label = 'Kedipan') { tick(label); light(true); at(ms, () => light(false)); },
    blank(label = 'Ketukan') { tick(label); glass.classList.add('blank'); at(300, () => glass.classList.remove('blank')); },
    // Morse: dot 300 ms, dash 900 ms, 300 ms between flashes, 1 s between letters.
    playMorse(word, done) {
      this.reset('Kedipan');
      let t = 300;
      for (const ch of word) {
        for (const s of MORSE[ch] || '') {
          const len = s === '.' ? 300 : 900;
          at(t, () => this.flash(len));
          t += len + 300;
        }
        t += 700;
      }
      at(t, () => done?.());
    },
    // 5-lamp: five 500 ms ticks per letter, light on for 1, dark for 0.
    playLamp(word, done) {
      this.reset('Ketukan');
      let t = 300;
      for (const ch of word.replace(/ /g, '')) {
        for (const b of lampCode(ch)) {
          at(t, () => (b === '1' ? this.flash(380, 'Ketukan') : this.blank('Ketukan')));
          t += 500;
        }
        t += 700;
      }
      at(t, () => done?.());
    },
  };
}

// On-screen A–Z keyboard writing into a slot row; `onKey(ch)` returns false
// to refuse a letter.
function keyboard(onKey, onBack, space = false) {
  const keys = LETTERS.map((ch) => onTap(el('button', { class: 'key', type: 'button' }, ch), () => onKey(ch)));
  if (space) keys.push(onTap(el('button', { class: 'key wide space', type: 'button', 'aria-label': 'spasi' }, '␣'), () => onKey(' ')));
  if (onBack) keys.push(onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
  return el('div', { class: 'keys' }, keys);
}

function slots(word) {
  const boxes = word.split('').map(() => el('span', { class: 'slot-letter' }, ''));
  return { node: el('div', { class: 'slot-word' }, boxes), boxes };
}

// Receive: the code is shown and can be flashed; type the message.
function receiveRound(wrap, ctx, word, kind, next) {
  const lamp = torch();
  const s = slots(word);
  let i = 0;
  const play = button('▶ Kedipkan', () => (kind === 'morse' ? lamp.playMorse(word) : lamp.playLamp(word)), 'small');
  const kb = keyboard((ch) => {
    if (i >= word.length) return;
    if (ch !== word[i]) { ctx.mistake(); shake(s.boxes[i]); return; }
    s.boxes[i].textContent = ch;
    s.boxes[i].classList.add('right');
    ctx.sound.tap();
    if (++i === word.length) { lamp.stop(); next(); }
  });
  wrap.append(
    el('p', { class: 'prompt' }, kind === 'morse' ? 'Baca pesan Morse ini. Ketik hurufnya satu per satu.' : 'Baca pesan 5 lampu (16 8 4 2 1). Ketik hurufnya.'),
    el('div', { class: 'code-line' }, kind === 'morse' ? morseOf(word) : lampOf(word)),
    el('div', { class: 'senter-row' }, lamp.node, el('div', { class: 'senter-side' }, play, s.node, kind === 'lampu' ? numberHelp() : null)),
    kb);
  return lamp.stop;
}

function numberHelp() {
  return el('small', { class: 'small-note' }, 'A=1 B=2 C=3 … Z=26');
}

// Send: write each letter of the word in Morse with • and — keys.
function sendMorseRound(wrap, ctx, word, next) {
  let i = 0;
  let cur = '';
  const s = slots(word);
  const now = el('div', { class: 'code-line' }, '');
  const letter = el('div', { class: 'target' }, word[0]);
  const lamp = torch();
  const show = () => { now.textContent = cur ? showMorse(cur) : '…'; };
  const add = (sym) => {
    if (i >= word.length) return;
    cur += sym;
    lamp.flash(sym === '.' ? 250 : 700);
    show();
    const want = MORSE[word[i]];
    if (!want.startsWith(cur)) { ctx.mistake(); shake(now); cur = ''; show(); return; }
    if (cur === want) {
      s.boxes[i].textContent = word[i];
      s.boxes[i].classList.add('right');
      ctx.sound.good();
      cur = '';
      i++;
      if (i === word.length) { next(); return; }
      letter.textContent = word[i];
      setTimeout(show, 400);
    }
  };
  show();
  wrap.append(
    el('p', { class: 'prompt' }, `Kirim kata ${word} dengan Morse. Ketuk • dan — untuk setiap huruf.`),
    el('div', { class: 'senter-row' }, lamp.node, el('div', { class: 'senter-side' }, letter, now, s.node)),
    el('div', { class: 'row' }, button('•  pendek', () => add('.'), 'primary big-key'), button('—  panjang', () => add('-'), 'primary big-key')),
    morseTable());
}

// Send: switch five lamps for the letter's number, then send.
function sendLampRound(wrap, ctx, word, next) {
  let i = 0;
  const on = [0, 0, 0, 0, 0];
  const s = slots(word);
  const letter = el('div', { class: 'target' });
  const sum = el('div', { class: 'code-line' });
  const lamps = [16, 8, 4, 2, 1].map((v, k) => onTap(el('button', { class: 'lamp', type: 'button', 'aria-label': `lampu ${v}` }, el('span', { class: 'bulb' }), el('span', { class: 'val' }, v)), () => {
    on[k] = 1 - on[k];
    lamps[k].classList.toggle('on', !!on[k]);
    ctx.sound.tap();
    draw();
  }));
  function draw() {
    const n = on.reduce((t, b, k) => t + b * [16, 8, 4, 2, 1][k], 0);
    letter.textContent = `${word[i]} = ${word.charCodeAt(i) - 64}`;
    sum.textContent = `${on.join('')} = ${n}`;
  }
  const send = button('Kirim huruf ➜', () => {
    if (on.join('') !== lampCode(word[i])) { ctx.mistake(); shake(sum); return; }
    s.boxes[i].textContent = word[i];
    s.boxes[i].classList.add('right');
    ctx.sound.good();
    i++;
    on.fill(0);
    lamps.forEach((l) => l.classList.remove('on'));
    if (i === word.length) { send.disabled = true; next(); return; }
    draw();
  }, 'primary');
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, `Kirim kata ${word} dengan kode 5 lampu.`),
    el('div', { class: 'senter-row' }, el('div', { class: 'senter-side' }, letter, s.node), el('div', { class: 'bitrow lamps', style: { '--k': 5 } }, lamps)),
    sum, send);
}

function morseTable() {
  return el('div', { class: 'morse-table' }, LETTERS.map((ch) => el('span', null, el('b', null, ch), ` ${showMorse(MORSE[ch])}`)));
}

export default {
  id: 'sdl-03-sandi-senter',
  title: 'Sandi Senter Pramuka',
  topic: 'Pengodean pesan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🔦',
  source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
  rounds: 7,
  maxPlayers: 4,
  goal: 'Murid membaca dan menulis pesan dengan sandi Morse dan kode 5 lampu, lalu membandingkan panjang dan kemudahan kedua sandi.',
  extraModes: [
    { id: 'pasangan', icon: '👫', label: 'Berpasangan', desc: 'Pengirim mengetuk sandi, penerima hanya melihat kedipan lalu menulis pesannya', create: createPair },
    { id: 'kamus', icon: '⌨️', label: 'Ketik dan Kedipkan', desc: 'Ketik pesan, lihat dan kedipkan Morse serta kode 5 lampu beserta hitungannya', create: createDictionary },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act senter' });
    root.append(wrap);
    let stop = null;
    function render() {
      stop?.();
      stop = null;
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1800); };
      if (r === 0) stop = receiveRound(wrap, ctx, 'PRAMUKA', 'morse', next);
      else if (r === 1) stop = receiveRound(wrap, ctx, 'SIAGA', 'lampu', next);
      else if (r === 2) sendMorseRound(wrap, ctx, 'KITA', next);
      else if (r === 3) sendLampRound(wrap, ctx, 'KITA', next);
      else if (r === 4) {
        choice(wrap, {
          prompt: `Kata SAYA: Morse butuh berapa kedipan? (5 lampu butuh 4 × 5 = 20 ketukan)`,
          subject: el('div', { class: 'code-line' }, morseOf('SAYA')), ctx, onRight: next, columns: 4,
          options: [9, 11, 13, 20].map((x) => ({ label: String(x), correct: x === morseFlashes('SAYA') })),
        });
      } else if (r === 5) {
        choice(wrap, {
          prompt: 'Huruf A paling sering muncul dalam bahasa Indonesia. Kalau kamu merancang sandi, huruf apa yang sebaiknya paling pendek?',
          ctx, onRight: next, columns: 4,
          options: ctx.rand.shuffle(['A', 'E', 'Z', 'Q']).map((x) => ({ label: x, correct: x === 'A' })),
        });
      } else {
        const word = ctx.rand.pick(WORDS);
        stop = receiveRound(wrap, ctx, word, ctx.rand.next() < 0.5 ? 'morse' : 'lampu', next);
      }
    }
    render();
    return { destroy() { stop?.(); } };
  },
};

// Ketik dan Kedipkan: type a message; both codes and their counts update.
function createDictionary(root) {
  const wrap = el('div', { class: 'act senter' });
  root.append(wrap);
  let text = '';
  const lamp = torch();
  const shown = el('div', { class: 'target' }, '');
  const morse = el('div', { class: 'code-line' });
  const lamps = el('div', { class: 'code-line' });
  const counts = el('p', { class: 'reveal' });
  function draw() {
    shown.textContent = text || '…';
    morse.textContent = text ? morseOf(text) : 'Morse';
    lamps.textContent = text ? lampOf(text) : '5 lampu';
    counts.textContent = text.trim() ? `Morse: ${morseFlashes(text)} kedipan · 5 lampu: ${letterCount(text) * 5} ketukan` : '';
  }
  const kb = keyboard((ch) => { if (text.length < 16) { text += ch; draw(); } }, () => { text = text.slice(0, -1); draw(); }, true);
  wrap.append(
    el('p', { class: 'prompt' }, 'Ketik pesan, lalu kedipkan dengan senter.'),
    el('div', { class: 'senter-row' }, lamp.node, el('div', { class: 'senter-side' }, shown, morse, lamps, counts,
      el('div', { class: 'row' }, button('▶ Morse', () => text.trim() && lamp.playMorse(text), 'small'), button('▶ 5 lampu', () => text.trim() && lamp.playLamp(text), 'small')))),
    kb);
  draw();
  return { destroy: lamp.stop };
}

// Berpasangan: the sender types a secret word, then taps it out; the
// receiver's side only shows the flashes and writes what it reads.
function createPair(root, ctx) {
  const wrap = el('div', { class: 'act pair senter' });
  root.append(wrap);
  const left = el('div', { class: 'pair-side', style: { '--player': '#2563eb' } });
  const right = el('div', { class: 'pair-side', style: { '--player': '#ea580c' } });
  wrap.append(left, right);
  let way = 'morse';
  let secret = '';
  let got = '';
  const lamp = torch();
  const secretEl = el('div', { class: 'code-line' });
  const gotEl = el('div', { class: 'target' });
  const result = el('p', { class: 'reveal' });
  const draw = () => { secretEl.textContent = secret ? `Pesan: ${secret}` : 'Ketik pesan rahasia (maks. 3 kata pendek)'; gotEl.textContent = got || '…'; };
  const sendKeys = el('div', { class: 'row' });
  function setWay(w) {
    way = w;
    lamp.reset(w === 'morse' ? 'Kedipan' : 'Ketukan');
    sendKeys.replaceChildren(...(w === 'morse'
      ? [button('•', () => lamp.flash(300), 'primary big-key'), button('—', () => lamp.flash(900), 'primary big-key'), button('jeda huruf', () => ctx.sound.tap(), 'small')]
      : [button('nyala (1)', () => lamp.flash(380, 'Ketukan'), 'primary big-key'), button('mati (0)', () => lamp.blank('Ketukan'), 'big-key')]));
    wayBtns.forEach((b) => b.classList.toggle('on', b.dataset.w === w));
  }
  const wayBtns = [['morse', 'Morse'], ['lampu', '5 lampu']].map(([w, label]) => {
    const b = button(label, () => setWay(w), 'small');
    b.dataset.w = w;
    return b;
  });
  const leftKb = keyboard((ch) => { if (secret.length < 20) { secret += ch; draw(); } }, () => { secret = secret.slice(0, -1); draw(); }, true);
  const lock = button('Simpan pesan & mulai kirim', () => {
    if (!secret.trim()) return;
    leftKb.hidden = true;
    lock.hidden = true;
    secretEl.classList.add('hidden-text');
    sendKeys.hidden = false;
  }, 'small primary');
  sendKeys.hidden = true;
  const rightKb = keyboard((ch) => { if (got.length < 20) { got += ch; draw(); } }, () => { got = got.slice(0, -1); draw(); }, true);
  const compare = button('Cocokkan', () => {
    if (!secret) return;
    secretEl.classList.remove('hidden-text');
    const same = got.trim() === secret.trim();
    result.textContent = same ? `Cocok! Pesannya: ${secret} 🎉` : `Belum cocok. Pesan asli: ${secret}`;
    result.classList.toggle('bad', !same);
    if (same) ctx.sound.win(); else ctx.sound.bad();
  }, 'small primary');
  const again = button('Pesan baru', () => {
    secret = '';
    got = '';
    result.textContent = '';
    leftKb.hidden = false;
    lock.hidden = false;
    sendKeys.hidden = true;
    secretEl.classList.remove('hidden-text');
    lamp.reset(way === 'morse' ? 'Kedipan' : 'Ketukan');
    draw();
  }, 'small ghost');
  left.append(el('p', { class: 'prompt' }, 'Pengirim'), el('div', { class: 'row' }, wayBtns), secretEl, leftKb, lock, sendKeys);
  right.append(el('p', { class: 'prompt' }, 'Penerima: amati senter, tulis pesannya'), lamp.node, gotEl, rightKb, el('div', { class: 'row' }, compare, again), result);
  setWay('morse');
  draw();
  return { destroy: lamp.stop };
}
