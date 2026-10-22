// Bintang dan Segi Banyak — SD Lanjut (10–12 tahun), perulangan dan sudut.
// A pen turtle knows MAJU and BELOK. The turn it needs is the outside angle:
// turns × sides = 360 closes a polygon, and 720 or more draws a star.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
export const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString('id-ID') : String(n).replace('.', ','));

const M = (n) => ({ op: 'maju', n });
const R = (n) => ({ op: 'kanan', n });
const Lt = (n) => ({ op: 'kiri', n });
const U = (n, ...body) => ({ op: 'ulangi', n, body });
const poly = (n, a, len = 5) => [U(n, M(len), R(a))];

// Runs the program. Heading 0 is up, turning right adds degrees. Every MAJU
// gives a segment; every BELOK gives a turn step.
export function turtle(prog, limit = 4000) {
  let x = 0, y = 0, h = 0, total = 0;
  const steps = [];
  let error = null;
  const exec = (items, path) => {
    for (let i = 0; i < items.length && !error; i++) {
      const s = items[i];
      const p = [...path, i];
      if (steps.length > limit) { error = 'Program terlalu panjang, jadi dihentikan.'; return; }
      if (s.op === 'ulangi') { for (let k = 0; k < s.n && !error; k++) exec(s.body, p); }
      else if (s.op === 'maju') {
        const r = (h * Math.PI) / 180;
        const nx = x + s.n * Math.sin(r), ny = y - s.n * Math.cos(r);
        steps.push({ path: p, seg: [x, y, nx, ny], x: nx, y: ny, h, total });
        x = nx; y = ny;
      } else {
        const d = s.op === 'kanan' ? s.n : -s.n;
        h += d; total += d;
        steps.push({ path: p, turn: d, x, y, h, total });
      }
    }
  };
  exec(prog, []);
  const home = Math.hypot(x, y) < 1e-6 * Math.max(1, ...steps.map((s) => Math.abs(s.x) + Math.abs(s.y)));
  const facing = ((h % 360) + 360) % 360;
  return { steps, x, y, h, total, error, closed: home && Math.abs(facing) < 1e-9 && steps.some((s) => s.seg), home, facing };
}
const FACING = { 0: 'atas', 90: 'kanan', 180: 'bawah', 270: 'kiri' };

export const progText = (prog) => prog.map((s) => (s.op === 'ulangi' ? `ULANGI ${fmt(s.n)} [ ${progText(s.body)} ]`
  : s.op === 'maju' ? `MAJU ${fmt(s.n)}` : `BELOK ${s.op === 'kanan' ? 'KANAN' : 'KIRI'} ${fmt(s.n)}`)).join(', ');

// The drawing board: an SVG fitted around the shape, the turtle, and a
// counter for the total turn.
function board() {
  const svg = svgEl('svg', { class: 'sgb-kanvas', viewBox: '-6 -6 12 12' });
  const lines = svgEl('g', { class: 'sgb-garis' });
  const bug = svgEl('g', { class: 'sgb-penyu' });
  bug.append(svgEl('path', { d: 'M0 -1.2 L0.8 0.8 L0 0.4 L-0.8 0.8 Z' }));
  const start = svgEl('circle', { class: 'sgb-mulai', r: 0.35, cx: 0, cy: 0 });
  svg.append(lines, start, bug);
  const count = el('b', { class: 'sgb-hitung' }, 'total putaran: 0°');
  const badge = el('span', { class: 'sgb-lencana' });
  const turnLabel = el('span', { class: 'sgb-belok' });
  const node = el('div', { class: 'sgb-papan' }, svg, el('div', { class: 'sgb-bawah' }, count, turnLabel, badge));
  let scale = 1, timer = null;
  const fit = (steps) => {
    const xs = [0, ...steps.map((s) => s.x)], ys = [0, ...steps.map((s) => s.y)];
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const size = Math.max(maxX - minX, maxY - minY, 4);
    const pad = size * 0.14;
    scale = size / 10;
    svg.setAttribute('viewBox', `${minX - pad - (size - (maxX - minX)) / 2} ${minY - pad - (size - (maxY - minY)) / 2} ${size + 2 * pad} ${size + 2 * pad}`);
    lines.setAttribute('stroke-width', 0.18 * scale);
    start.setAttribute('r', 0.3 * scale);
  };
  const place = (x, y, h) => bug.setAttribute('transform', `translate(${x} ${y}) rotate(${h}) scale(${scale})`);
  const reset = (steps = []) => {
    clearTimeout(timer);
    lines.replaceChildren(); fit(steps); place(0, 0, 0);
    count.textContent = 'total putaran: 0°'; badge.textContent = ''; badge.className = 'sgb-lencana'; turnLabel.textContent = '';
  };
  reset();
  return {
    node,
    reset,
    // Draws a run step by step; long runs draw many steps per tick.
    play(result, { speed = 160, done, instant } = {}) {
      reset(result.steps);
      const steps = result.steps;
      const per = instant ? steps.length : Math.max(1, Math.ceil(steps.length / 90));
      let i = 0;
      const tick = () => {
        for (let k = 0; k < per && i < steps.length; k++) {
          const s = steps[i++];
          if (s.seg) lines.append(svgEl('line', { x1: s.seg[0], y1: s.seg[1], x2: s.seg[2], y2: s.seg[3] }));
          else turnLabel.textContent = `↻ ${s.turn > 0 ? 'kanan' : 'kiri'} ${fmt(Math.abs(s.turn))}°`;
          place(s.x, s.y, s.h);
          count.textContent = `total putaran: ${fmt(Math.round(s.total * 1000) / 1000)}°`;
        }
        if (i < steps.length) { timer = setTimeout(tick, instant ? 0 : speed); return; }
        const turns = Math.round((result.total / 360) * 1000) / 1000;
        if (result.error) { badge.textContent = `⛔ ${result.error}`; badge.className = 'sgb-lencana buka'; }
        else if (result.closed) { badge.textContent = `✅ tertutup · ${fmt(turns)} putaran penuh`; badge.className = 'sgb-lencana tutup'; }
        else if (result.home) { badge.textContent = '↩ kembali ke titik awal, tetapi arahnya berbeda'; badge.className = 'sgb-lencana buka'; }
        else { badge.textContent = '✗ tidak kembali ke titik awal'; badge.className = 'sgb-lencana buka'; }
        done?.();
      };
      timer = setTimeout(tick, instant ? 0 : 150);
    },
    stop() { clearTimeout(timer); },
  };
}

const codeNode = (prog) => el('div', { class: 'sgb-kode' }, progText(prog));
const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });

// Worksheet questions in order. The turtle draws once the answer is right.
const PLAN = [
  { prog: poly(4, 90), prompt: 'Soal 1. Bangun apa yang tergambar?', opts: textOpts('persegi, sisi 5 cm', ['segitiga, sisi 5 cm', 'segi lima, sisi 5 cm', 'garis lurus 20 cm']) },
  { prog: poly(4, 90), prompt: 'Selama program berjalan, penyu berputar seluruhnya berapa derajat?', ...nums([90, 180, 270, 360], 360) },
  { prog: poly(4, 90), prompt: 'Ketika selesai, penyu menghadap ke mana?', opts: textOpts('atas', ['kanan', 'bawah', 'kiri']) },
  { prog: poly(3, 60), prompt: 'Soal 2. Program Raka. Apakah garisnya kembali ke titik awal?', opts: textOpts('Tidak. Terbentuk tiga sisi dari segi enam.', ['Ya. Terbentuk segitiga sama sisi.', 'Tidak. Terbentuk garis lurus.']) },
  { prog: poly(3, 60), prompt: 'b. Supaya kembali ke titik awal, setiap belokan segitiga berapa derajat? 360 : 3 = …', ...nums([60, 90, 120, 180], 120), play: poly(3, 120) },
  { prog: poly(5, '…'), prompt: 'Soal 3. Sudut belok untuk segi lima?', ...nums([60, 72, 90, 108], 72), play: poly(5, 72) },
  { prog: poly(6, '…'), prompt: 'Sudut belok untuk segi enam?', ...nums([45, 60, 90, 120], 60), play: poly(6, 60) },
  { prog: poly(8, '…'), prompt: 'Sudut belok untuk segi delapan?', ...nums([36, 40, 45, 135], 45), play: poly(8, 45) },
  { prog: poly(10, '…'), prompt: 'Sudut belok untuk segi sepuluh?', ...nums([30, 36, 60, 144], 36), play: poly(10, 36) },
  { prog: poly(6, 60), prompt: 'Pola yang kamu temukan: sudut belok × banyak sisi = …', ...nums([180, 270, 360, 720], 360) },
  { prog: poly(4, 72), prompt: 'Soal 4. Program Sari untuk segi lima. Apa yang salah dengan gambarnya?', opts: textOpts('Baru 4 sisi dan tidak tertutup, karena penyu baru berputar 288 derajat.', ['Sudutnya harus 90 derajat.', 'Sisinya terlalu panjang.']) },
  { prog: poly(4, 72), prompt: 'b. Perbaikannya?', opts: textOpts('ULANGI 5 [ MAJU 5, BELOK KANAN 72 ]', ['ULANGI 4 [ MAJU 5, BELOK KANAN 90 ]', 'ULANGI 4 [ MAJU 5, BELOK KANAN 108 ]', 'ULANGI 5 [ MAJU 5, BELOK KANAN 108 ]']), play: poly(5, 72) },
  { prog: poly(36, 10, 1), prompt: 'Soal 5. Bangun ini punya berapa sisi?', ...nums([10, 36, 72, 360], 36) },
  { prog: poly(36, 10, 1), prompt: 'b. Program mana yang lebih bulat tetapi tetap tertutup?', opts: textOpts('ULANGI 72 [ MAJU 0,5, BELOK KANAN 5 ]', ['ULANGI 72 [ MAJU 0,5, BELOK KANAN 4 ]', 'ULANGI 36 [ MAJU 0,5, BELOK KANAN 5 ]', 'ULANGI 18 [ MAJU 2, BELOK KANAN 10 ]']), play: poly(72, 5, 0.5) },
  { prog: poly(5, 144), prompt: 'Soal 6. Bentuk apa yang tergambar?', opts: textOpts('bintang lima', ['segi lima', 'segi sepuluh', 'segitiga']) },
  { prog: poly(5, 144), prompt: 'Penyu berputar seluruhnya 5 × 144 = …', ...nums([360, 576, 720, 1080], 720) },
  { prog: poly(5, 144), prompt: 'Itu berapa kali putaran penuh?', ...nums([1, 2, 3, 5], 2) },
  { prog: poly(5, 72), prompt: 'c. Dibandingkan BELOK KANAN 144, apa bedanya BELOK KANAN 72?', opts: textOpts('72 membentuk segi lima dengan 1 putaran. 144 melompati satu sudut, garisnya bersilangan, dan berputar 2 kali.', ['Tidak ada bedanya.', '72 membentuk bintang yang lebih kecil.']) },
  { prog: poly(8, '…'), prompt: 'Tantangan. Bintang berujung 8 dengan 3 putaran penuh: BELOK KANAN berapa?', ...nums([45, 108, 135, 150], 135), play: poly(8, 135) },
];

function round(wrap, ctx, p, next) {
  const b = board();
  const subject = el('div', { class: 'sgb-soal' }, codeNode(p.prog), b.node);
  const after = () => {
    const prog = p.play ?? p.prog;
    if (p.play) subject.prepend(el('div', { class: 'sgb-kode benar' }, `✓ ${progText(prog)}`));
    const r = turtle(prog);
    b.play(r, { speed: r.steps.length > 40 ? 30 : 140, done: () => setTimeout(next, 1100) });
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: fmt(v), correct: v === p.ans })); columns = 4; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.opts.some((o) => o.label.length > 28) ? 1 : 2; }
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-28-segi-banyak',
  title: 'Bintang dan Segi Banyak',
  topic: 'Perulangan dan sudut',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '⭐',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menemukan bahwa sudut belok penyu × banyak sisi = 360 untuk segi banyak, memperbaiki program yang belum tertutup, dan menemukan sudut untuk bintang.',
  extraModes: [
    { id: 'penyu', icon: '🐢', label: 'Penyu Gambar', desc: 'Susun MAJU, BELOK, dan ULANGI, lalu lihat penyu menggambar', create: createEditor },
    { id: 'sudut', icon: '🎚️', label: 'Penjelajah Sudut', desc: 'Geser banyak ulangan dan sudut belok, gambarnya berubah langsung', create: createSlider },
    { id: 'tebak', icon: '🔁', label: 'Tebak Bentuk', desc: 'Satu tim menulis program, tim lain menebak dan menggambar bentuknya', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act segi-banyak' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
const LENS = [0.1, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20];
const ANGLES = [1, 5, 10, 30, 36, 45, 60, 72, 90, 108, 120, 135, 144, 150, 180, 360];
const LOOPS = [2, 3, 4, 5, 6, 8, 10, 12, 18, 36, 72, 360];

// Block editor: cards go into the ULANGI that is open; tapping a number
// changes it; ✕ removes the line.
function createEditor(root, ctx) {
  const wrap = el('div', { class: 'act segi-banyak' });
  root.append(wrap);
  let prog = structuredClone(poly(4, 90));
  let openPath = [0];
  const b = board();
  const list = el('div', { class: 'sgb-program' });
  const at = (path) => path.reduce((items, i) => items[i].body, prog);
  const openBlock = () => (openPath.length ? at(openPath.slice(0, -1))[openPath.at(-1)] : null);
  const draw = () => {
    const open = openBlock();
    const rows = [];
    const walk = (items, path, depth) => items.forEach((s, i) => {
      const p = [...path, i];
      const act = (fn) => () => { fn(); ctx.sound.tap(); draw(); };
      const val = (listV) => onTap(el('button', { class: 'sgb-pilih', type: 'button' }, fmt(s.n)), act(() => { s.n = cycle(listV, s.n); }));
      const parts = s.op === 'ulangi' ? [el('b', null, 'ULANGI'), val(LOOPS), el('b', null, '[')]
        : s.op === 'maju' ? [el('b', null, 'MAJU'), val(LENS)]
          : [onTap(el('button', { class: 'sgb-pilih arah', type: 'button' }, s.op === 'kanan' ? 'BELOK KANAN' : 'BELOK KIRI'), act(() => { s.op = s.op === 'kanan' ? 'kiri' : 'kanan'; })), val(ANGLES)];
      parts.push(onTap(el('button', { class: 'sgb-hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), act(() => { items.splice(i, 1); openPath = []; })));
      const row = el('div', { class: `sgb-baris${s.body ? ' wadah' : ''}${open === s ? ' buka' : ''}`, style: { '--d': depth } }, ...parts);
      if (s.body) row.addEventListener('click', (e) => { if (!e.target.closest('button')) { openPath = p; draw(); } });
      rows.push(row);
      if (s.body) {
        walk(s.body, p, depth + 1);
        if (!s.body.length) rows.push(el('div', { class: 'sgb-baris kosong', style: { '--d': depth + 1 } }, '…'));
        rows.push(el('div', { class: 'sgb-baris', style: { '--d': depth } }, ']'));
      }
    });
    walk(prog, [], 0);
    list.replaceChildren(...(rows.length ? rows : [el('span', { class: 'sgb-kosong' }, 'Ketuk kartu di bawah untuk menyusun program.')]));
  };
  const add = (s) => {
    if (JSON.stringify(prog).split('"op"').length > 16) { shake(list); return; }
    const target = openPath.length ? openBlock().body : prog;
    target.push(s);
    if (s.body) openPath = [...openPath, target.length - 1];
    ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'sgb-palet' },
    onTap(el('button', { class: 'sgb-kartu', type: 'button' }, 'MAJU'), () => add(M(5))),
    onTap(el('button', { class: 'sgb-kartu', type: 'button' }, 'BELOK KANAN'), () => add(R(90))),
    onTap(el('button', { class: 'sgb-kartu', type: 'button' }, 'BELOK KIRI'), () => add(Lt(90))),
    onTap(el('button', { class: 'sgb-kartu ulangi', type: 'button' }, 'ULANGI'), () => add(U(4))),
    button('Tutup ]', () => { openPath = openPath.slice(0, -1); draw(); }, 'small'));
  const load = (p) => { prog = structuredClone(p); openPath = []; b.reset(); draw(); };
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Persegi', () => load(poly(4, 90)), 'small'), button('Program Raka', () => load(poly(3, 60)), 'small'),
    button('Segi lima', () => load(poly(5, 72)), 'small'), button('Bintang lima', () => load(poly(5, 144)), 'small'),
    button('Hampir lingkaran', () => load(poly(36, 10, 1)), 'small'),
    button('Bunga', () => load([U(12, U(4, M(4), R(90)), R(30))]), 'small'),
    button('Kosongkan', () => load([]), 'small'));
  const go = button('▶ Jalankan', () => {
    if (!prog.length) { shake(list); return; }
    const r = turtle(prog);
    b.play(r, { speed: r.steps.length > 60 ? 25 : 220, done: () => (r.closed ? ctx.sound.good() : ctx.sound.bad()) });
  }, 'primary');
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Susun program, lalu jalankan. Penyu mulai di titik ● dan menghadap ke atas.'), examples,
    el('div', { class: 'sgb-kerja' }, el('div', { class: 'sgb-kiri' }, list, palette, go), b.node));
  return { destroy() { b.stop(); } };
}

// Two sliders: repeats and the turn. The drawing follows at once.
function slider(label, min, max, value, onInput) {
  const out = el('b', null, value);
  const input = el('input', { type: 'range', min, max, value, class: 'sgb-geser' });
  input.addEventListener('input', () => { out.textContent = input.value; onInput(Number(input.value)); });
  return { node: el('label', { class: 'sgb-penggeser' }, el('span', null, label), input, out), set(v) { input.value = v; out.textContent = v; } };
}

function createSlider(root, ctx) {
  const wrap = el('div', { class: 'act segi-banyak' });
  root.append(wrap);
  const st = { n: 5, a: 72 };
  const b = board();
  const code = el('div', { class: 'sgb-kode' });
  const math = el('p', { class: 'sgb-info' });
  const redraw = () => {
    const prog = poly(st.n, st.a);
    code.textContent = progText(prog);
    const r = turtle(prog);
    b.play(r, { instant: true });
    math.textContent = `${st.n} × ${st.a} = ${fmt(st.n * st.a)} derajat = ${fmt(Math.round((st.n * st.a / 360) * 100) / 100)} putaran penuh.`;
  };
  const sn = slider('Banyak ulangan', 1, 36, st.n, (v) => { st.n = v; redraw(); });
  const sa = slider('Sudut belok', 1, 180, st.a, (v) => { st.a = v; redraw(); });
  const jump = (n, a) => () => { st.n = n; st.a = a; sn.set(n); sa.set(a); ctx.sound.tap(); redraw(); };
  wrap.append(el('p', { class: 'prompt' }, 'Geser sudutnya dari 72 ke 144 dan lihat segi lima berubah menjadi bintang.'),
    el('div', { class: 'row' }, el('span', { class: 'label' }, 'Coba'), button('Segi lima', jump(5, 72), 'small'), button('Bintang lima', jump(5, 144), 'small'),
      button('Segi delapan', jump(8, 45), 'small'), button('Bintang 8', jump(8, 135), 'small'), button('Program Raka', jump(3, 60), 'small')),
    el('div', { class: 'sgb-kerja' }, el('div', { class: 'sgb-kiri' }, sn.node, sa.node, code, math), b.node));
  redraw();
  return { destroy() { b.stop(); } };
}

// Shape families used for scoring a guess.
export function family(n, a) {
  const r = turtle(poly(n, a));
  if (!r.home) return 'buka';
  return n * a === 360 ? 'segi' : 'bintang';
}
const FAMILIES = [
  { id: 'segi', label: 'segi banyak (1 putaran penuh)' },
  { id: 'bintang', label: 'bintang atau garis bersilangan (lebih dari 1 putaran)' },
  { id: 'buka', label: 'tidak kembali ke titik awal' },
];

// A small sketch pad for the guess.
function sketch() {
  const canvas = el('canvas', { class: 'sgb-sketsa', width: 300, height: 300 });
  const g = canvas.getContext('2d');
  let down = false;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 300, ((e.clientY - r.top) / r.height) * 300]; };
  const clear = () => { g.clearRect(0, 0, 300, 300); g.fillStyle = '#334155'; g.beginPath(); g.arc(150, 150, 5, 0, 7); g.fill(); };
  canvas.addEventListener('pointerdown', (e) => { down = true; canvas.setPointerCapture(e.pointerId); const [x, y] = pos(e); g.beginPath(); g.moveTo(x, y); });
  canvas.addEventListener('pointermove', (e) => { if (!down) return; const [x, y] = pos(e); g.lineTo(x, y); g.strokeStyle = '#7c3aed'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke(); });
  canvas.addEventListener('pointerup', () => { down = false; });
  clear();
  return { node: canvas, clear };
}

// Bergiliran: team A sets a program with the sliders behind a curtain; team
// B sees only the program, sketches a guess and names the family.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act segi-banyak' });
  root.append(wrap);
  const score = [0, 0];
  let turn = 0;
  let b = null;
  function start() {
    b?.stop();
    const a = turn % 2, bt = 1 - a;
    const st = { n: 6, a: 60 };
    const code = el('div', { class: 'sgb-kode' }, progText(poly(st.n, st.a)));
    const upd = () => { code.textContent = progText(poly(st.n, st.a)); };
    const sn = slider('Banyak ulangan', 2, 20, st.n, (v) => { st.n = v; upd(); });
    const sa = slider('Sudut belok', 1, 180, st.a, (v) => { st.a = v; upd(); });
    const ready = button('Program siap ✓', guessStage, 'primary');
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${a + 1}: tulis program diam-diam. Gambarnya belum ditampilkan.`), el('div', { class: 'sgb-kiri' }, sn.node, sa.node, code), ready);

    function guessStage() {
      const pad = sketch();
      let pick = null;
      const info = el('p', { class: 'sgb-info' });
      const opts = el('div', { class: 'sgb-pilihan' }, FAMILIES.map((f) => onTap(el('button', { class: 'sgb-pilih besar', type: 'button', 'data-id': f.id }, f.label), () => {
        pick = f.id; opts.querySelectorAll('button').forEach((x) => x.classList.toggle('aktif', x.dataset.id === pick)); ctx.sound.tap();
      })));
      b = board();
      const run = button('▶ Jalankan', () => {
        if (!pick) { shake(opts); return; }
        run.remove(); opts.classList.add('kunci');
        const r = turtle(poly(st.n, st.a));
        b.play(r, {
          speed: 160,
          done: () => {
            const right = pick === family(st.n, st.a);
            if (right) { score[bt]++; ctx.sound.win(); } else ctx.sound.bad();
            info.textContent = `${right ? `✅ Tebakan Tim ${bt + 1} tepat!` : `✗ Bentuknya: ${FAMILIES.find((f) => f.id === family(st.n, st.a)).label}.`} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${bt + 1}: gambar perkiraan bentuknya dan pilih jenisnya, lalu jalankan.`), code,
        el('div', { class: 'sgb-kerja' }, el('div', { class: 'sgb-kiri' }, pad.node, button('Hapus gambar', pad.clear, 'small')), el('div', { class: 'sgb-kiri' }, opts, run), b.node), info);
    }
  }
  start();
  return { destroy() { b?.stop(); } };
}
