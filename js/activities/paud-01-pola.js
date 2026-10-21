// Lanjutkan Polanya! — PAUD (4–6 tahun), topik Pengenalan Pola.
// Two puzzle types from the worksheet: fill the two next shapes of a
// repeating pattern, and find the one shape that breaks the pattern.

import { el, onTap, shake } from '../core/util.js';

// Each shape differs in both form and colour so colour-blind children can play.
const SHAPES = {
  lingkaran: { label: 'lingkaran', svg: '<circle cx="50" cy="50" r="40" fill="#ef4444"/>' },
  segitiga: { label: 'segitiga', svg: '<polygon points="50,8 93,88 7,88" fill="#3b82f6"/>' },
  persegi: { label: 'persegi', svg: '<rect x="12" y="12" width="76" height="76" rx="6" fill="#22c55e"/>' },
  bintang: { label: 'bintang', svg: '<polygon points="50,5 61,37 95,37 68,58 78,92 50,72 22,92 32,58 5,37 39,37" fill="#eab308"/>' },
  hati: { label: 'hati', svg: '<path d="M50 88 C20 65 6 48 6 30 a22 22 0 0 1 44 -6 a22 22 0 0 1 44 6 c0 18 -14 35 -44 58z" fill="#ec4899"/>' },
};
const NAMES = Object.keys(SHAPES);

// Pattern units, easiest first. Letters map to distinct shapes.
const UNITS = [['AB', 'AB'], ['AB', 'AAB'], ['ABB', 'ABC'], ['AABB', 'ABC']];

function shapeSvg(name) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${SHAPES[name].svg}</svg>`;
}

function shapeNode(name, extra = {}) {
  return el('div', { class: 'shape', 'aria-label': SHAPES[name].label, html: shapeSvg(name), ...extra });
}

function makeSequence(rand, round) {
  const unit = rand.pick(UNITS[Math.min(round >> 1, UNITS.length - 1)]);
  const letters = [...new Set(unit)];
  const chosen = rand.shuffle(NAMES).slice(0, letters.length);
  const map = Object.fromEntries(letters.map((l, i) => [l, chosen[i]]));
  const reps = Math.max(2, Math.ceil(6 / unit.length));
  const seq = [];
  for (let r = 0; r < reps + 1; r++) for (const l of unit) seq.push(map[l]);
  return { seq, used: chosen };
}

// The first three puzzles are the ones printed on the worksheet, so the
// class can check the paper answers on the panel.
const WORKSHEET = [
  { type: 'lanjut', shown: ['lingkaran', 'segitiga', 'lingkaran', 'segitiga', 'lingkaran', 'segitiga'], answer: ['lingkaran', 'segitiga'], palette: ['segitiga', 'persegi', 'lingkaran'] },
  { type: 'beda', shown: ['lingkaran', 'segitiga', 'lingkaran', 'lingkaran', 'lingkaran', 'segitiga'], pos: 3 },
  { type: 'lanjut', shown: ['bintang', 'bintang', 'persegi', 'bintang', 'bintang', 'persegi', 'bintang'], answer: ['bintang', 'persegi'], palette: ['persegi', 'lingkaran', 'bintang'] },
];

function puzzle(rand, round) {
  if (round < WORKSHEET.length) return WORKSHEET[round];
  const { seq, used } = makeSequence(rand, round);
  if (round % 2 === 0) {
    // "Lanjutkan": show the first items, the last two are blanks.
    const shown = seq.slice(0, Math.min(seq.length, 8));
    const answer = shown.splice(shown.length - 2, 2);
    const extra = rand.shuffle(NAMES.filter((n) => !used.includes(n))).slice(0, Math.max(0, 3 - used.length));
    return { type: 'lanjut', shown, answer, palette: rand.shuffle([...used, ...extra]) };
  }
  // "Temukan yang berbeda": replace one item (not the first two) with a wrong shape.
  const shown = seq.slice(0, Math.min(seq.length, 8));
  const pos = rand.int(2, shown.length - 1);
  const wrong = rand.pick(NAMES.filter((n) => n !== shown[pos]));
  shown[pos] = wrong;
  return { type: 'beda', shown, pos };
}

function renderLanjut(body, p, ctx, next) {
  const filled = [null, null];
  const slots = p.answer.map((_, i) => onTap(el('div', { class: 'slot', 'aria-label': `kotak ${i + 1}` }), () => {
    if (filled[i] == null) return;
    filled[i] = null;
    ctx.sound.tap();
    draw();
  }));
  const row = el('div', { class: 'seq', style: { '--count': p.shown.length + 2 } }, p.shown.map((n) => shapeNode(n)), slots);

  const palette = el('div', { class: 'palette' }, p.palette.map((name) =>
    onTap(el('button', { class: 'shape-btn', type: 'button', 'aria-label': SHAPES[name].label, html: shapeSvg(name) }), () => {
      const i = filled.indexOf(null);
      if (i < 0) return;
      filled[i] = name;
      ctx.sound.tap();
      draw();
      if (!filled.includes(null)) check();
    })));

  function draw() {
    slots.forEach((s, i) => {
      s.innerHTML = filled[i] ? shapeSvg(filled[i]) : '';
      s.classList.toggle('filled', !!filled[i]);
    });
  }

  function check() {
    const ok = filled.every((f, i) => f === p.answer[i]);
    if (ok) {
      slots.forEach((s) => s.classList.add('correct'));
      next();
    } else {
      ctx.mistake();
      shake(row);
      setTimeout(() => {
        filled.forEach((f, i) => { if (f !== p.answer[i]) filled[i] = null; });
        draw();
      }, 500);
    }
  }

  body.append(
    el('p', { class: 'prompt' }, 'Lanjutkan polanya! Pilih dua bentuk berikutnya.'),
    row, palette);
}

function renderBeda(body, p, ctx, next) {
  let locked = false;
  const items = p.shown.map((n, i) => onTap(shapeNode(n, { class: 'shape tappable', role: 'button' }), () => {
    if (locked) return;
    if (i === p.pos) {
      locked = true;
      items[i].classList.add('found');
      next();
    } else {
      ctx.mistake();
      shake(items[i]);
    }
  }));
  body.append(
    el('p', { class: 'prompt' }, 'Ada satu bentuk yang tidak sesuai. Sentuh bentuk itu!'),
    el('div', { class: 'seq', style: { '--count': items.length } }, items));
}

// "Buat polamu sendiri": six slots; the panel says whether the row repeats.
function createOwn(root, ctx) {
  const wrap = el('div', { class: 'act pola' });
  const filled = new Array(6).fill(null);
  const msg = el('p', { class: 'reveal' });
  const slots = filled.map((_, i) => onTap(el('div', { class: 'slot', 'aria-label': `kotak ${i + 1}` }), () => {
    filled[i] = null;
    draw();
  }));
  const palette = el('div', { class: 'palette' }, NAMES.map((name) =>
    onTap(el('button', { class: 'shape-btn', type: 'button', 'aria-label': SHAPES[name].label, html: shapeSvg(name) }), () => {
      const i = filled.indexOf(null);
      if (i < 0) return;
      filled[i] = name;
      ctx.sound.tap();
      draw();
    })));

  function repeatUnit(seq) {
    for (let len = 2; len <= 3; len++) {
      const unit = seq.slice(0, len);
      if (new Set(unit).size > 1 && seq.every((x, i) => x === unit[i % len])) return len;
    }
    return 0;
  }
  function draw() {
    slots.forEach((s, i) => {
      s.innerHTML = filled[i] ? shapeSvg(filled[i]) : '';
      s.classList.toggle('filled', !!filled[i]);
      s.classList.remove('correct');
    });
    msg.className = 'reveal';
    if (filled.includes(null)) { msg.textContent = ''; return; }
    if (repeatUnit(filled)) {
      slots.forEach((s) => s.classList.add('correct'));
      msg.textContent = 'Hebat! Polamu berulang dengan teratur.';
      ctx.sound.good();
    } else {
      msg.classList.add('bad');
      msg.textContent = 'Belum berulang teratur. Sentuh bentuk untuk mengganti.';
    }
  }
  wrap.append(
    el('p', { class: 'prompt' }, 'Buat polamu sendiri! Pilih enam bentuk yang berulang.'),
    el('div', { class: 'seq', style: { '--count': 6 } }, slots), msg, palette);
  root.append(wrap);
}

export default {
  id: 'paud-01-pola',
  title: 'Lanjutkan Polanya!',
  topic: 'Pengenalan Pola',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🔺',
  source: null, // orisinal, dari draf buku
  rounds: 6,
  maxPlayers: 4,
  goal: 'Anak melanjutkan pola berulang, menemukan bentuk yang tidak sesuai, dan membuat pola sendiri.',
  extraModes: [{ id: 'kreasi', icon: '✏️', label: 'Buat Pola', desc: 'Susun enam bentuk sendiri', create: createOwn }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pola' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const p = puzzle(ctx.rand, ctx.round);
      const next = () => { if (ctx.solved()) setTimeout(render, 900); };
      (p.type === 'lanjut' ? renderLanjut : renderBeda)(wrap, p, ctx, next);
    }
    render();
  },
};
