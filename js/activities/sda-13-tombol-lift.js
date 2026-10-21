// Desain Tombol Lift — SD Awal (7–9 tahun), interaksi manusia–komputer.
// Spot what makes a lift panel confusing, design a better one, test it
// with timed tasks, and improve it after the test.

import { el, onTap, button, choice, shake } from '../core/kit.js';
import { formatTime } from '../core/util.js';

const KINDS = {
  l1: { text: '1', name: 'lantai 1' },
  l2: { text: '2', name: 'lantai 2' },
  l3: { text: '3', name: 'lantai 3' },
  l4: { text: '4', name: 'lantai 4' },
  buka: { text: '◀ ▶', icon: '◀|▶', name: 'buka pintu' },
  tutup: { text: '▶ ◀', icon: '▶|◀', name: 'tutup pintu' },
  darurat: { text: '', icon: '🔔', name: 'darurat' },
};
const COLORS = { abu: '#94a3b8', biru: '#2563eb', hijau: '#16a34a', kuning: '#eab308', merah: '#dc2626' };

// A panel is a list of slots; each slot null or {kind, color, big, label}.
const BAD = [
  { kind: 'l3', color: 'abu' }, { kind: 'l1', color: 'abu' },
  { kind: 'l4', color: 'abu' }, { kind: 'l2', color: 'abu' },
  { kind: 'buka', color: 'abu' }, { kind: 'tutup', color: 'abu' },
  { kind: 'darurat', color: 'abu' }, null,
];
const GOOD = [
  { kind: 'l4', color: 'biru', label: true }, null,
  { kind: 'l3', color: 'biru', label: true }, null,
  { kind: 'l2', color: 'biru', label: true }, { kind: 'buka', color: 'hijau', label: true },
  { kind: 'l1', color: 'biru', label: true }, { kind: 'tutup', color: 'kuning', label: true },
  { kind: 'darurat', color: 'merah', big: true, label: true }, null,
];

function liftButton(b, onPress) {
  const k = KINDS[b.kind];
  // Floor buttons always show their number on a real panel; the "label"
  // option adds a picture and a word.
  const face = b.label
    ? [el('span', { class: 'lb-icon' }, k.icon || k.text), el('small', null, k.name)]
    : [el('span', { class: 'lb-icon' }, k.text)];
  const node = el('button', { class: `lift-btn ${b.big ? 'big' : ''}`, type: 'button', style: { '--c': COLORS[b.color] }, 'aria-label': k.name }, face);
  if (onPress) onTap(node, () => onPress(b, node));
  return node;
}

function panel(slots, onPress, { screen = '1' } = {}) {
  return el('div', { class: 'lift' },
    el('div', { class: 'lift-screen' }, screen),
    el('div', { class: 'lift-grid' }, slots.map((b, i) => (b ? liftButton(b, onPress) : el('span', { class: 'lift-empty', 'data-i': i })))));
}

// Round 1: find two confusing parts on the bad panel.
function spotRound(wrap, ctx, next) {
  const PARTS = [
    { key: 'urutan', why: 'Tombol lantai tidak berurutan (3, 1, 4, 2).', test: (b) => /^l/.test(b.kind) },
    { key: 'pintu', why: 'Tombol buka dan tutup pintu terlihat sama dan tanpa tulisan.', test: (b) => b.kind === 'buka' || b.kind === 'tutup' },
    { key: 'darurat', why: 'Tombol darurat tidak berbeda dari tombol lain dan tanpa tanda.', test: (b) => b.kind === 'darurat' },
  ];
  const found = new Set();
  const list = el('ol', { class: 'why-list' });
  const p = panel(BAD, (b, node) => {
    const part = PARTS.find((x) => x.test(b));
    if (found.has(part.key)) return;
    found.add(part.key);
    node.classList.add('circled');
    list.append(el('li', null, part.why));
    ctx.sound.tap();
    if (found.size === 2) next();
  });
  // The screen is not confusing: tapping it counts as a mistake.
  onTap(p.querySelector('.lift-screen'), () => { ctx.mistake(); shake(p.querySelector('.lift-screen')); });
  wrap.append(
    el('p', { class: 'prompt' }, 'Perpustakaan kota punya 4 lantai. Ketuk DUA hal yang membingungkan di panel lift ini.'),
    el('div', { class: 'lift-layout' }, p, el('div', { class: 'lift-side' }, el('div', { class: 'label' }, 'Yang membingungkan:'), list)));
}

const TASKS = [
  { kind: 'l3', text: 'Pergi ke lantai 3' },
  { kind: 'buka', text: 'Tahan pintu supaya tetap terbuka' },
  { kind: 'darurat', text: 'Minta bantuan karena lift macet' },
];

// Timed test of a panel: one task at a time; `done(results)`.
function testPanel(wrap, ctx, slots, done) {
  const results = [];
  let t = 0;
  let started = performance.now();
  let wrong = 0;
  const task = el('div', { class: 'task-card' });
  const clock = el('span', { class: 'open-count' }, '0:00');
  const timer = setInterval(() => { clock.textContent = formatTime(performance.now() - started); }, 250);
  function show() {
    task.replaceChildren(el('small', null, `Tugas ${t + 1} dari ${TASKS.length}`), el('b', null, TASKS[t].text));
    started = performance.now();
    wrong = 0;
  }
  const p = panel(slots, (b, node) => {
    if (t >= TASKS.length) return;
    if (b.kind !== TASKS[t].kind) { wrong++; ctx.mistake(); shake(node); return; }
    ctx.sound.good();
    results.push({ task: TASKS[t].text, ms: performance.now() - started, wrong });
    t++;
    if (t < TASKS.length) { show(); return; }
    clearInterval(timer);
    done(results);
  });
  show();
  wrap.append(el('div', { class: 'lift-layout' }, p, el('div', { class: 'lift-side' }, task, clock)));
  return () => clearInterval(timer);
}

function resultTable(results) {
  return el('table', { class: 'count-table' }, el('tbody', null,
    el('tr', null, el('td', null, el('b', null, 'Tugas')), el('td', null, el('b', null, 'Waktu')), el('td', null, el('b', null, 'Salah tekan'))),
    results.map((r) => el('tr', null, el('td', null, r.task), el('td', { class: 'num' }, formatTime(r.ms)), el('td', { class: 'num' }, r.wrong)))));
}

export default {
  id: 'sda-13-tombol-lift',
  title: 'Desain Tombol Lift',
  topic: 'Interaksi manusia–komputer',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🛗',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Murid mengenali tampilan yang membingungkan, memilih rancangan yang lebih mudah dipakai, lalu merancang, menguji, dan memperbaiki panel lift.',
  extraModes: [{ id: 'rancang', icon: '✏️', label: 'Rancang dan Uji', desc: 'Satu tim merancang panel, tim lain menguji dengan tugas berwaktu, lalu panel diperbaiki', create: createDesign }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lift-act' });
    root.append(wrap);
    let stop = null;
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1600); };
      if (r === 0) spotRound(wrap, ctx, next);
      else if (r === 1) {
        choice(wrap, {
          prompt: 'Mana panel yang lebih mudah dipakai Nenek?', ctx, onRight: next, columns: 2,
          options: [{ icon: panel(BAD), label: 'Panel A' }, { icon: panel(GOOD), label: 'Panel B', correct: true }],
        });
      } else if (r === 2) {
        choice(wrap, {
          prompt: 'Bagaimana tombol darurat sebaiknya dibuat?', ctx, onRight: next, columns: 3,
          options: ctx.rand.shuffle([
            { icon: liftButton({ kind: 'darurat', color: 'merah', big: true, label: true }), label: 'merah, besar, ada gambar lonceng', correct: true },
            { icon: liftButton({ kind: 'darurat', color: 'abu' }), label: 'abu-abu seperti tombol lain' },
            { icon: liftButton({ kind: 'l1', color: 'kuning' }), label: 'kecil dan bertulisan angka' },
          ]),
        });
      } else {
        wrap.append(el('p', { class: 'prompt' }, 'Uji panel yang baik! Kerjakan setiap tugas secepat mungkin.'));
        stop = testPanel(wrap, ctx, GOOD, (results) => {
          wrap.append(resultTable(results));
          next();
        });
      }
    }
    render();
    return { destroy() { stop?.(); } };
  },
};

// Rancang dan Uji: place buttons on an empty panel, choose colour, size and
// picture, then another team tests it; improve and test again.
function createDesign(root, ctx) {
  const wrap = el('div', { class: 'act lift-act' });
  root.append(wrap);
  const slots = new Array(10).fill(null);
  let selected = -1;
  let stop = null;
  function design(note) {
    stop?.();
    wrap.replaceChildren();
    const missing = Object.keys(KINDS).filter((k) => !slots.some((b) => b?.kind === k));
    const grid = el('div', { class: 'lift' }, el('div', { class: 'lift-screen' }, '1'),
      el('div', { class: 'lift-grid' }, slots.map((b, i) => {
        const n = b ? liftButton(b) : el('span', { class: 'lift-empty' }, '+');
        if (i === selected) n.classList.add('circled');
        return onTap(n, () => { selected = i; design(note); });
      })));
    const tools = el('div', { class: 'lift-side' });
    if (selected >= 0) {
      const b = slots[selected];
      tools.append(el('div', { class: 'label' }, 'Tombol apa?'),
        el('div', { class: 'row wrap' }, Object.entries(KINDS).map(([k, v]) => button(v.name, () => {
          slots[selected] = { color: 'abu', ...b, kind: k };
          design(note);
        }, b?.kind === k ? 'small on' : 'small'))));
      if (b) {
        tools.append(
          el('div', { class: 'label' }, 'Warna'),
          el('div', { class: 'row' }, Object.entries(COLORS).map(([c, hex]) => onTap(el('button', { class: `swatch ${b.color === c ? 'on' : ''}`, type: 'button', style: { background: hex }, 'aria-label': c }), () => { b.color = c; design(note); }))),
          el('div', { class: 'row' },
            button(b.big ? 'Ukuran: besar' : 'Ukuran: kecil', () => { b.big = !b.big; design(note); }, 'small'),
            button(b.label ? 'Gambar: ada' : 'Gambar: tidak ada', () => { b.label = !b.label; design(note); }, 'small'),
            button('Hapus', () => { slots[selected] = null; design(note); }, 'small ghost')));
      }
    } else tools.append(el('p', { class: 'small-note' }, 'Ketuk kotak di panel untuk menaruh tombol.'));
    const test = button('▶ Uji panel', () => {
      selected = -1;
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim penguji: kerjakan setiap tugas secepat mungkin!'));
      stop = testPanel(wrap, ctx, slots.slice(), (results) => {
        ctx.sound.win();
        wrap.append(resultTable(results), el('div', { class: 'row' }, button('✏️ Perbaiki panel', () => design('Perbaiki bagian yang membuat penguji bingung, lalu uji ulang.'), 'primary')));
      });
    }, 'primary');
    test.disabled = missing.length > 0;
    wrap.append(
      el('p', { class: 'prompt' }, note || 'Rancang panel lift untuk gedung 4 lantai. Ingat urutan, ukuran, warna, dan gambar.'),
      el('div', { class: 'lift-layout' }, grid, tools),
      el('p', { class: 'small-note' }, missing.length ? `Belum ada: ${missing.map((k) => KINDS[k].name).join(', ')}` : 'Semua tombol sudah ada.'),
      test);
  }
  design();
  return { destroy() { stop?.(); } };
}
