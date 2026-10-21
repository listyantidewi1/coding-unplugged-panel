// Detektif Motif Batik — SD Awal (7–9 tahun), pola dan abstraksi.
// A strip of cloth has a torn part: patch it with the right shapes, then
// name the motif's rule with letters (A A B, A B B, A B C).

import { el, dnd, choice, button, onTap, shake } from '../core/kit.js';

// Simple motifs in batik colours; kawung-style and tumpal-style fills.
const MOTIF = {
  kawung: { label: 'lingkaran', svg: '<circle cx="50" cy="50" r="42" fill="#1e3a8a"/><g fill="#fde68a"><ellipse cx="50" cy="27" rx="10" ry="17"/><ellipse cx="50" cy="73" rx="10" ry="17"/><ellipse cx="27" cy="50" rx="17" ry="10"/><ellipse cx="73" cy="50" rx="17" ry="10"/></g><circle cx="50" cy="50" r="5" fill="#1e3a8a"/>' },
  wajik: { label: 'belah ketupat', svg: '<polygon points="50,4 96,50 50,96 4,50" fill="#92400e"/><polygon points="50,24 76,50 50,76 24,50" fill="#fde68a"/><polygon points="50,38 62,50 50,62 38,50" fill="#92400e"/>' },
  tumpal: { label: 'segitiga', svg: '<polygon points="50,6 95,92 5,92" fill="#9f1239"/><polygon points="50,34 76,84 24,84" fill="#fde68a"/><line x1="50" y1="40" x2="50" y2="84" stroke="#9f1239" stroke-width="5"/>' },
  turun: { label: 'segitiga terbalik', svg: '<polygon points="5,8 95,8 50,94" fill="#166534"/><polygon points="24,16 76,16 50,66" fill="#fde68a"/><line x1="50" y1="16" x2="50" y2="60" stroke="#166534" stroke-width="5"/>' },
  kotak: { label: 'persegi', svg: '<rect x="8" y="8" width="84" height="84" rx="4" fill="#0f766e"/><rect x="24" y="24" width="52" height="52" fill="#fde68a"/><circle cx="50" cy="50" r="12" fill="#0f766e"/>' },
  bunga: { label: 'bunga', svg: '<g fill="#be185d"><circle cx="50" cy="24" r="17"/><circle cx="75" cy="42" r="17"/><circle cx="65" cy="72" r="17"/><circle cx="35" cy="72" r="17"/><circle cx="25" cy="42" r="17"/></g><circle cx="50" cy="50" r="13" fill="#fde68a"/>' },
};
const NAMES = Object.keys(MOTIF);
const RULES = ['A A B', 'A B B', 'A B C', 'A B A'];

const svg = (name) => `<svg viewBox="0 0 100 100" aria-hidden="true">${MOTIF[name].svg}</svg>`;
const motif = (name, cls = 'motif') => el('div', { class: cls, 'aria-label': MOTIF[name].label, html: svg(name) });

// Letter rule of a repeating unit: first shape is A, the next new one B, …
export function ruleOf(unit) {
  const seen = [];
  return unit.map((n) => { if (!seen.includes(n)) seen.push(n); return 'ABC'[seen.indexOf(n)]; }).join(' ');
}

// The worksheet's puzzles first: torn cells are the `holes` indices.
const WORKSHEET = [
  { prompt: 'Kainnya sobek! Tambal dengan bentuk yang hilang.', seq: ['kawung', 'kawung', 'wajik', 'kawung', 'kawung', 'wajik', 'kawung', 'kawung', 'wajik'], holes: [7, 8], palette: ['kawung', 'wajik', 'tumpal'] },
  { prompt: 'Kainnya sobek di dua tempat! Gambar bentuk yang hilang.', seq: ['tumpal', 'kotak', 'kotak', 'tumpal', 'kotak', 'kotak', 'tumpal', 'kotak', 'kotak', 'tumpal'], holes: [7, 8], palette: ['tumpal', 'kotak', 'kawung'] },
  { type: 'sama' },
  { type: 'tingkat' },
];

function randomPuzzle(rand) {
  const rule = rand.pick(['A A B', 'A B B', 'A B C']);
  const shapes = rand.shuffle(NAMES).slice(0, 3);
  const unit = rule.split(' ').map((l) => shapes['ABC'.indexOf(l)]);
  const seq = [...unit, ...unit, ...unit];
  const a = rand.int(3, 7);
  return { prompt: 'Kainnya sobek! Tambal dengan bentuk yang hilang.', seq, holes: [a, a + 1], palette: rand.shuffle([...new Set(unit), rand.pick(NAMES.filter((n) => !unit.includes(n)))]) };
}

// Cloth strip with holes; palette shapes are dragged (or tapped, then the
// hole tapped) onto the holes. `onFull(filled)` once every hole has a shape.
function patchStrip(seq, holes, palette, ctx, onFull) {
  const filled = new Map();
  const cells = seq.map((n, i) => (holes.includes(i)
    ? el('div', { class: 'motif hole', 'data-drop': i })
    : motif(n)));
  const cloth = el('div', { class: 'kain', style: { '--count': seq.length } }, cells);
  const pal = el('div', { class: 'palette' }, palette.map((n) => el('div', { class: 'motif-btn', 'data-drag': '', 'data-name': n, 'aria-label': MOTIF[n].label, html: svg(n) })));
  const area = el('div', { class: 'patch-area' }, cloth, pal);
  dnd(area, (item, hole) => {
    const i = Number(hole.dataset.drop);
    filled.set(i, item.dataset.name);
    hole.innerHTML = svg(item.dataset.name);
    hole.classList.add('patched');
    ctx.sound.tap();
    if (filled.size === holes.length) onFull(filled, cells);
  });
  return { node: area, palette: pal };
}

// After a patch, check it; wrong patches are torn open again.
function patchRound(wrap, ctx, p, next) {
  const unit = p.seq.slice(0, 3);
  const after = el('div', { class: 'after' });
  const strip = patchStrip(p.seq, p.holes, p.palette, ctx, (filled, cells) => {
    const wrong = [...filled].filter(([i, n]) => p.seq[i] !== n);
    if (wrong.length) {
      ctx.mistake();
      wrong.forEach(([i]) => { filled.delete(i); cells[i].innerHTML = ''; cells[i].classList.remove('patched'); shake(cells[i]); });
      return;
    }
    strip.palette.remove();
    choice(after, {
      prompt: 'Kainnya utuh lagi! Tulis aturannya dengan huruf. Bentuk pertama = A.',
      ctx, onRight: next, columns: 3,
      options: ['A A B', 'A B B', 'A B C'].map((r) => ({ label: r, correct: r === ruleOf(unit) })),
    });
  });
  wrap.append(el('p', { class: 'prompt' }, p.prompt), strip.node, after);
}

function sameRound(wrap, ctx, next) {
  const row = (label, icons) => el('div', { class: 'kain-row' }, el('span', { class: 'kain-name' }, label), el('span', { class: 'kain-emoji' }, icons));
  choice(wrap, {
    prompt: 'Bentuknya berbeda. Apakah aturannya sama? Pilih jawabanmu.',
    subject: el('div', { class: 'kain-two' }, row('Kain Ibu', '🌸 🍃 🍃 🌸 🍃 🍃'), row('Kain Nenek', '🔴 🔵 🔵 🔴 🔵 🔵')),
    ctx, onRight: next, columns: 3,
    options: ctx.rand.shuffle([
      { icon: '✅', label: 'sama: A B B', correct: true },
      { icon: '✅', label: 'sama: A A B' },
      { icon: '❌', label: 'tidak sama' },
    ]),
  });
}

function levelRound(wrap, ctx, next) {
  const r1 = ['tumpal', 'turun', 'tumpal', 'turun', 'tumpal', 'turun'];
  const r2 = ['turun', 'tumpal', 'turun', 'tumpal', 'turun', 'tumpal'];
  const strip = patchStrip(r1, [0, 1, 2, 3, 4, 5], ['tumpal', 'turun'], ctx, (filled, cells) => {
    const wrong = [...filled].filter(([i, n]) => r1[i] !== n);
    if (wrong.length) {
      ctx.mistake();
      wrong.forEach(([i]) => { filled.delete(i); cells[i].innerHTML = ''; cells[i].classList.remove('patched'); shake(cells[i]); });
      return;
    }
    next();
  });
  wrap.append(
    el('p', { class: 'prompt' }, 'Motif bertingkat! Lengkapi baris ketiga.'),
    el('div', { class: 'kain', style: { '--count': 6 } }, r1.map((n) => motif(n))),
    el('div', { class: 'kain', style: { '--count': 6 } }, r2.map((n) => motif(n))),
    strip.node);
}

export default {
  id: 'sda-01-motif-batik',
  title: 'Detektif Motif Batik',
  topic: 'Pola dan abstraksi',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🧵',
  source: null,
  rounds: 6,
  maxPlayers: 4,
  goal: 'Murid menambal motif yang sobek, menuliskan aturannya dengan huruf, dan mengenali aturan yang sama pada bentuk yang berbeda.',
  extraModes: [{ id: 'rancang', icon: '🎨', label: 'Rancang Motif', desc: 'Satu tim menyusun sembilan bentuk, tim lain menebak aturannya', create: createDesign }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act batik' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1200); };
      const p = WORKSHEET[r] || randomPuzzle(ctx.rand);
      if (p.type === 'sama') sameRound(wrap, ctx, next);
      else if (p.type === 'tingkat') levelRound(wrap, ctx, next);
      else patchRound(wrap, ctx, p, next);
    }
    render();
  },
};

// Rancang Motif: nine slots; the app checks the motif repeats every three,
// then the other team picks the rule.
function createDesign(root, ctx) {
  const wrap = el('div', { class: 'act batik' });
  root.append(wrap);
  function compose() {
    const picked = [];
    const cloth = el('div', { class: 'kain', style: { '--count': 9 } });
    const msg = el('p', { class: 'reveal' });
    function draw() {
      cloth.replaceChildren(...Array.from({ length: 9 }, (_, i) => (picked[i]
        ? onTap(motif(picked[i]), () => { picked.splice(i, 1); draw(); })
        : el('div', { class: 'motif hole' }))));
      done.disabled = picked.length < 9;
    }
    const pal = el('div', { class: 'palette' }, NAMES.map((n) => onTap(el('button', { class: 'motif-btn', type: 'button', 'aria-label': MOTIF[n].label, html: svg(n) }), () => {
      if (picked.length < 9) { picked.push(n); ctx.sound.tap(); draw(); }
    })));
    const done = button('Selesai, tebak!', () => {
      const unit = picked.slice(0, 3);
      const repeats = picked.every((n, i) => n === unit[i % 3]);
      if (!repeats) { msg.textContent = 'Motifmu belum berulang. Tiga bentuk pertama harus diulang tiga kali.'; shake(cloth); return; }
      if (!RULES.includes(ruleOf(unit))) { msg.textContent = 'Pakai paling sedikit dua bentuk yang berbeda.'; shake(cloth); return; }
      guess(picked);
    }, 'primary');
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim lain menutup mata! Susun sembilan bentuk yang berulang. Ketuk bentuk di kain untuk menghapusnya.'),
      cloth, pal, el('div', { class: 'row' }, done, button('Hapus semua', () => { picked.length = 0; draw(); msg.textContent = ''; }, 'ghost')), msg);
    draw();
  }
  function guess(picked) {
    wrap.replaceChildren();
    const result = el('p', { class: 'reveal' });
    const rule = ruleOf(picked.slice(0, 3));
    choice(wrap, {
      prompt: 'Buka mata! Apa aturan motif ini?',
      subject: el('div', { class: 'kain', style: { '--count': 9 } }, picked.map((n) => motif(n))),
      ctx, columns: 4,
      onRight() { ctx.sound.win(); result.textContent = `Benar! Aturannya ${rule}.`; },
      options: RULES.map((r) => ({ label: r, correct: r === rule })),
    });
    wrap.append(result, button('Motif baru', compose, 'primary'));
  }
  compose();
}
