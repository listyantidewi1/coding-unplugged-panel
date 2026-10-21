// Menggambar dengan Perintah — SD Awal (7–9 tahun), perintah dengan angka.
// A pencil robot walks along a dot grid: "➡️ 3" draws 3 squares to the
// right; ANGKAT and TURUNKAN PENSIL stop and start drawing.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const DIR = { R: [1, 0, '➡️'], L: [-1, 0, '⬅️'], U: [0, 1, '⬆️'], D: [0, -1, '⬇️'] };
const PEN = { up: '✏️⬆️', down: '✏️⬇️' };

// A command is { d: 'R'|'L'|'U'|'D', n } or 'up' | 'down'.
const C = (s) => s.split(' ').map((t) => (t === 'up' || t === 'down' ? t : { d: t[0], n: Number(t.slice(1)) }));
const progText = (prog) => prog.map((c) => (typeof c === 'string' ? PEN[c] : `${DIR[c.d][2]} ${c.n}`)).join(' · ');
const edge = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? `${a}|${b}` : `${b}|${a}`);

// Runs the program one square at a time. Each step says whether it drew,
// moved with the pen up, or went over a line already drawn.
export function runDraw(prog, start = [0, 0], size = null) {
  let p = start.slice(), pen = true, out = false;
  const lines = new Set();
  const steps = [];
  for (let i = 0; i < prog.length && !out; i++) {
    const c = prog[i];
    if (typeof c === 'string') { pen = c === 'down'; steps.push({ i, pen }); continue; }
    for (let k = 0; k < c.n; k++) {
      const q = [p[0] + DIR[c.d][0], p[1] + DIR[c.d][1]];
      if (size && (q[0] < 0 || q[1] < 0 || q[0] >= size || q[1] >= size)) { out = true; steps.push({ i, from: p, to: p, out: true }); break; }
      const e = edge(p, q);
      const kind = !pen ? 'angkat' : lines.has(e) ? 'timpa' : 'garis';
      if (pen) lines.add(e);
      steps.push({ i, from: p, to: q, kind });
      p = q;
    }
  }
  return { lines, steps, end: p, out };
}
const sameDrawing = (a, b) => a.size === b.size && [...a].every((e) => b.has(e));

// Dot grid in SVG. `draw(result, upto)` paints the lines; the pencil sits at
// the last point.
function grid(size, start, { tapDot = null } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const n = document.createElementNS(ns, t); Object.entries(a).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const pad = 0.6, S = size - 1;
  const svg = mk('svg', { viewBox: `${-pad} ${-pad} ${S + 2 * pad} ${S + 2 * pad}`, class: 'gp-kisi' });
  const X = (x) => x, Y = (y) => S - y;
  const gLines = mk('g', {}), gDots = mk('g', {}), gPen = mk('g', {});
  svg.append(gLines, gDots, gPen);
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
    const d = mk('circle', { cx: X(x), cy: Y(y), r: 0.07, class: 'gp-titik' });
    if (tapDot) {
      const hit = mk('circle', { cx: X(x), cy: Y(y), r: 0.4, class: 'gp-ketuk' });
      hit.addEventListener('click', () => tapDot([x, y]));
      gDots.append(hit);
    }
    gDots.append(d);
  }
  let startDot = null;
  const api = {
    node: svg,
    setStart(s) {
      start = s;
      startDot?.remove();
      startDot = mk('circle', { cx: X(s[0]), cy: Y(s[1]), r: 0.17, class: 'gp-mulai' });
      gDots.append(startDot);
      api.pen(s, true);
    },
    pen(p, down) {
      gPen.replaceChildren(mk('text', { x: X(p[0]) + 0.08, y: Y(p[1]) - 0.08, class: `gp-pensil${down ? '' : ' naik'}` }));
      gPen.firstChild.textContent = '✏️';
    },
    clear() { gLines.replaceChildren(); api.pen(start, true); },
    line(a, b, kind) {
      const l = mk('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: `gp-garis ${kind}` });
      gLines.append(l);
      if (kind === 'angkat') setTimeout(() => l.remove(), 1400);
      if (kind === 'timpa') setTimeout(() => l.classList.remove('timpa'), 900);
    },
    // Draws a finished result at once (for pictures in questions).
    drawAll(res) { api.clear(); res.steps.forEach((s) => s.kind && s.kind !== 'angkat' && api.line(s.from, s.to, 'garis')); api.pen(res.end, true); },
  };
  api.setStart(start);
  return api;
}

function animate(g, res, { onStep, done, speed = 260 } = {}) {
  let i = 0, t = null, down = true;
  g.clear();
  const tick = () => {
    if (i >= res.steps.length) { done?.(); return; }
    const s = res.steps[i++];
    onStep?.(s);
    if (s.pen !== undefined) down = s.pen;
    else if (!s.out) { g.line(s.from, s.to, s.kind); g.pen(s.to, down); }
    t = setTimeout(tick, s.pen !== undefined ? speed * 1.5 : speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

// A small picture of a drawing, for answer options.
function picture(prog, start, size = 7) {
  const g = grid(size, start);
  g.drawAll(runDraw(prog, start));
  g.node.classList.add('kecil');
  return g.node;
}

const FLAG = C('U4 R3 D2 L3');
// Worksheet questions 1–5. The grid plays the program after a right answer.
const PLAN = [
  { prog: C('R3 U3 L3 D3'), start: [0, 0], prompt: 'Jalankan programnya. Berapa kotak panjang setiap sisi persegi?', opts: [2, 3, 4, 6], ans: 3 },
  { prog: C('R3 U3 L3 D3'), start: [0, 0], prompt: 'Kalau setiap panah hanya boleh satu langkah, berapa panah yang diperlukan?', opts: [4, 9, 12, 16], ans: 12 },
  { prog: C('U1 R1 U1 R1 U1 R1'), start: [0, 0], prompt: 'Jalankan program tangga ini. Ada berapa anak tangga?', opts: [2, 3, 4, 6], ans: 3 },
  { prog: C('U1 R1 U1 R1 U1 R1'), start: [0, 0], prompt: 'Program mana yang membuat tangga sama, tetapi setiap anak tangga tinggi 2 dan lebar 2?',
    progOpts: [C('U2 R2 U2 R2 U2 R2'), C('U2 R1 U2 R1 U2 R1'), C('U1 R2 U1 R2 U1 R2'), C('U2 R2 U2 R2')], play: C('U2 R2 U2 R2 U2 R2') },
  { prog: C('D4 R2'), start: [0, 4], size: 5, prompt: 'Jalankan programnya. Huruf apa yang tergambar?', opts: ['L', 'J', 'T', 'V'], ans: 'L' },
  { prog: C('D4 U2 R3 U2 D4'), start: [0, 4], size: 5, prompt: 'Jalankan programnya. Huruf apa yang tergambar?', opts: ['H', 'A', 'N', 'M'], ans: 'H' },
  { prog: C('R3 up D2 L3 down R3'), start: [0, 2], size: 4, prompt: 'Pensil diangkat lalu diturunkan. Tanda apa yang tergambar?', opts: ['=', '+', '−', '÷'], ans: '=' },
  { prog: C('R3 D2 L3 R3'), start: [0, 2], size: 4, prompt: 'Raka lupa mengangkat pensil: ➡️ 3 · ⬇️ 2 · ⬅️ 3 · ➡️ 3. Gambar mana hasilnya?',
    picOpts: [C('R3 D2 L3 R3'), C('R3 up D2 L3 down R3'), C('R3 D2 L3 U2'), C('D2 R3 U2')] },
  { prog: FLAG, start: [0, 0], size: 5, blank: true, prompt: 'Program mana yang menggambar tiang setinggi 4 dan kain 3 × 2 di atasnya?', target: FLAG,
    progOpts: [FLAG, C('U4 R3 D4 L3'), C('U2 R3 D2 L3'), C('R3 U4 L3 D2')] },
  { prog: FLAG, start: [0, 0], size: 5, prompt: 'Program teman: ⬆️ 2 · ➡️ 3 · ⬆️ 2 · ⬅️ 3 · ⬇️ 4. Dibandingkan dengan program di atas …',
    opts: ['gambarnya sama, programnya berbeda', 'gambarnya berbeda, programnya sama', 'gambar dan programnya sama'], ans: 'gambarnya sama, programnya berbeda', play: C('U2 R3 U2 L3 D4') },
];

function round(wrap, ctx, p, next) {
  const size = p.size ?? 7;
  const g = grid(size, p.start);
  const subject = el('div', { class: 'gp-soal' }, el('div', { class: 'gp-prog-teks' }, progText(p.prog)), g.node);
  if (p.target) {
    subject.firstChild.remove();
    subject.prepend(picture(p.target, p.start, size));
    g.node.remove();
  }
  const after = () => {
    if (p.target) { next(); return; }
    animate(g, runDraw(p.play ?? p.prog, p.start), { speed: 160, done: next });
  };
  let options;
  if (p.progOpts) options = ctx.rand.shuffle(p.progOpts.map((prog, i) => ({ label: progText(prog), correct: i === 0 })));
  else if (p.picOpts) options = ctx.rand.shuffle(p.picOpts.map((prog, i) => ({ icon: picture(prog, p.start, size), correct: i === 0 })));
  else options = p.opts.map((o) => ({ label: String(o), correct: o === p.ans }));
  const cols = p.picOpts ? 4 : options.length > 3 && options.every((o) => (o.label ?? '').length < 12) ? 4 : options.length > 3 ? 2 : 1;
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns: cols, options });
}

export default {
  id: 'sda-15-gambar-perintah',
  title: 'Menggambar dengan Perintah',
  topic: 'Perintah dengan angka',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '✏️',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan perintah arah dengan angka di kisi titik, memakai kartu angkat dan turunkan pensil, dan menulis program untuk sebuah gambar.',
  extraModes: [
    { id: 'kisi', icon: '✏️', label: 'Kisi Pensil Robot', desc: 'Susun kartu arah dan angka, lalu pensil robot menggambar', create: createGrid },
    { id: 'target', icon: '🎯', label: 'Tiru Gambar', desc: 'Buat gambar yang sama persis dengan gambar target', create: createTarget },
    { id: 'dikte', icon: '🗣️', label: 'Program Dibacakan', desc: 'Satu tim membacakan program, tim lain menyusunnya, lalu gambar dibandingkan', create: createDictate },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gambar-perintah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// Program editor: arrow cards whose number is tapped to change (1 to 9),
// plus pen cards. Tapping ✕ on a card removes it.
function editor(ctx, { max = 16 } = {}) {
  const prog = [];
  let locked = false;
  const list = el('div', { class: 'gp-program' });
  const count = el('div', { class: 'gp-hitung' });
  const draw = () => {
    list.replaceChildren(...(prog.length ? prog.map((c, i) => {
      const del = onTap(el('button', { class: 'gp-hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { if (!locked) { prog.splice(i, 1); draw(); } });
      if (typeof c === 'string') return el('span', { class: 'gp-kartu pena', 'data-i': i }, PEN[c], del);
      const num = onTap(el('button', { class: 'gp-angka', type: 'button', 'aria-label': 'ubah angka' }, String(c.n)), () => {
        if (locked) return;
        c.n = c.n % 9 + 1; ctx.sound.tap(); draw();
      });
      return el('span', { class: 'gp-kartu', 'data-i': i }, DIR[c.d][2], num, del);
    }) : [el('span', { class: 'gp-kosong' }, 'Ketuk kartu di bawah. Ketuk angka pada kartu untuk mengubahnya.')]));
    count.textContent = `Banyak perintah: ${prog.length}`;
  };
  const add = (c) => {
    if (locked) return;
    if (prog.length >= max) { shake(list); return; }
    prog.push(c); ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'gp-palet' },
    ...Object.entries(DIR).map(([d, v]) => onTap(el('button', { class: 'gp-pilih', type: 'button', 'data-d': d }, v[2]), () => add({ d, n: 1 }))),
    ...Object.entries(PEN).map(([k, v]) => onTap(el('button', { class: 'gp-pilih pena', type: 'button', 'data-d': k }, v, el('small', null, k === 'up' ? 'angkat' : 'turunkan')), () => add(k))));
  draw();
  return {
    node: el('div', { class: 'gp-editor' }, list, palette, count),
    prog,
    set(items) { prog.splice(0, prog.length, ...structuredClone(items)); draw(); },
    clear() { prog.length = 0; draw(); },
    lock(v) { locked = v; },
    light(i) { list.querySelectorAll('.gp-kartu').forEach((n) => n.classList.toggle('nyala', Number(n.dataset.i) === i)); },
  };
}

function createGrid(root, ctx) {
  const wrap = el('div', { class: 'act gambar-perintah' });
  root.append(wrap);
  const SIZE = 11; // 10 × 10 squares
  let start = [1, 1];
  const ed = editor(ctx);
  const g = grid(SIZE, start, { tapDot: (p) => { if (!running) { start = p; g.setStart(p); g.clear(); } } });
  let stop = null, running = false;
  const info = el('p', { class: 'gp-info' }, 'Ketuk sebuah titik untuk memindahkan titik mulai ●.');
  const go = button('▶ Jalankan', () => {
    if (!ed.prog.length) { shake(ed.node); return; }
    stop?.(); running = true; ed.lock(true);
    const res = runDraw(ed.prog, start, SIZE);
    stop = animate(g, res, {
      onStep: (s) => ed.light(s.i),
      done: () => {
        running = false; ed.lock(false); ed.light(-1);
        const over = res.steps.filter((s) => s.kind === 'timpa').length;
        info.textContent = res.out ? '⛔ Pensil sampai di tepi kisi, jadi pensil berhenti.'
          : `Selesai: ${res.lines.size} garis kotak tergambar${over ? `, ${over} kali menimpa garis yang sudah ada` : ''}.`;
        ctx.sound.good();
      },
    });
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, 'Susun program, lalu pensil robot menggambar di kisi.'),
    el('div', { class: 'gp-tata' }, g.node, el('div', { class: 'gp-kanan' }, ed.node,
      el('div', { class: 'row' }, go, button('Hapus gambar', () => { stop?.(); running = false; ed.lock(false); g.clear(); }, 'small'), button('Kosongkan program', () => ed.clear(), 'small')),
      el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh:'),
        button('Persegi', () => ed.set(C('R3 U3 L3 D3')), 'small'), button('Tangga', () => ed.set(C('U1 R1 U1 R1 U1 R1')), 'small'), button('Bendera', () => ed.set(FLAG), 'small')),
      info)));
  return { destroy() { stop?.(); } };
}

const TARGETS = [
  { name: 'Bendera', prog: FLAG, start: [1, 1] },
  { name: 'Huruf L', prog: C('D4 R2'), start: [1, 6] },
  { name: 'Huruf H', prog: C('D4 U2 R3 U2 D4'), start: [1, 6] },
  { name: 'Tanda =', prog: C('R3 up D2 L3 down R3'), start: [1, 5] },
  { name: 'Tangga', prog: C('U2 R2 U2 R2 U2 R2'), start: [1, 1] },
  { name: 'Huruf T', prog: C('R4 up L2 down D4'), start: [1, 6] },
];

function createTarget(root, ctx) {
  const wrap = el('div', { class: 'act gambar-perintah' });
  root.append(wrap);
  let idx = 0, stop = null;
  function show() {
    const t = TARGETS[idx % TARGETS.length];
    const goal = runDraw(t.prog, t.start).lines;
    const ed = editor(ctx);
    const g = grid(8, t.start);
    const info = el('p', { class: 'gp-info' });
    const go = button('▶ Jalankan', () => {
      if (!ed.prog.length) { shake(ed.node); return; }
      stop?.(); ed.lock(true);
      const res = runDraw(ed.prog, t.start, 8);
      stop = animate(g, res, {
        onStep: (s) => ed.light(s.i),
        done: () => {
          ed.lock(false); ed.light(-1);
          const ok = !res.out && sameDrawing(res.lines, goal);
          info.textContent = ok ? `✅ Sama persis! Programmu memakai ${ed.prog.length} perintah. Contoh di lembar kerja memakai ${t.prog.length}.` : '✗ Gambarnya belum sama. Bandingkan dengan target.';
          if (ok) ctx.sound.win(); else ctx.sound.bad();
        },
      });
    }, 'primary');
    const tg = grid(8, t.start);
    tg.drawAll(runDraw(t.prog, t.start));
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Buat gambar yang sama dengan target: ${t.name}. Mulai dari titik ●.`),
      el('div', { class: 'gp-tata' }, el('div', { class: 'gp-target' }, el('div', { class: 'label' }, 'Target'), tg.node),
        el('div', { class: 'gp-target' }, el('div', { class: 'label' }, 'Gambarmu'), g.node),
        el('div', { class: 'gp-kanan' }, ed.node, el('div', { class: 'row' }, go, button('Target lain ▶', () => { stop?.(); idx++; show(); }, 'small')), info)));
  }
  show();
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A writes a program in secret and reads it out; team B
// builds the cards it heard; then both drawings are compared.
function createDictate(root, ctx) {
  const wrap = el('div', { class: 'act gambar-perintah' });
  root.append(wrap);
  let turn = 0;
  const start = [1, 1];
  function phaseA() {
    const a = turn % 2 + 1, b = 3 - a;
    const ed = editor(ctx);
    const g = grid(8, start);
    const preview = button('👁 Lihat gambar', () => { if (ed.prog.length) g.drawAll(runDraw(ed.prog, start, 8)); }, 'small');
    const hide = button(`Selesai, bacakan untuk Tim ${b} ▶`, () => {
      if (!ed.prog.length) { shake(ed.node); return; }
      phaseB(ed.prog.slice(), a, b);
    }, 'primary');
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${a}: susun program diam-diam. Tim ${b} jangan melihat layar!`),
      el('div', { class: 'gp-tata' }, g.node, el('div', { class: 'gp-kanan' }, ed.node, el('div', { class: 'row' }, preview, hide))));
  }
  function phaseB(progA, a, b) {
    const ed = editor(ctx);
    const read = el('div', { class: 'gp-prog-teks tutup' }, 'Program Tim ', String(a), ' tersembunyi. Tim ', String(a), ' membacakannya keras-keras.');
    const show = button('Bandingkan gambar', () => {
      if (!ed.prog.length) { shake(ed.node); return; }
      const ra = runDraw(progA, start, 8), rb = runDraw(ed.prog, start, 8);
      const ga = grid(8, start), gb = grid(8, start);
      ga.drawAll(ra); gb.drawAll(rb);
      const same = sameDrawing(ra.lines, rb.lines);
      const sameProg = progText(progA) === progText(ed.prog);
      wrap.replaceChildren(el('p', { class: 'prompt' }, same ? '✅ Gambarnya sama!' : '✗ Gambarnya berbeda. Cari perintah yang berbeda.'),
        el('div', { class: 'gp-tata' },
          el('div', { class: 'gp-target' }, el('div', { class: 'label' }, `Tim ${a}`), ga.node, el('div', { class: 'gp-prog-teks' }, progText(progA))),
          el('div', { class: 'gp-target' }, el('div', { class: 'label' }, `Tim ${b}`), gb.node, el('div', { class: 'gp-prog-teks' }, progText(ed.prog)))),
        el('p', { class: 'gp-info' }, same && !sameProg ? 'Gambarnya sama walaupun programnya berbeda.' : same ? 'Programnya juga sama persis.' : ''),
        button('🔁 Tukar peran', () => { turn++; phaseA(); }, 'primary'));
      if (same) ctx.sound.win(); else ctx.sound.bad();
    }, 'primary');
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${b}: dengarkan, lalu susun kartu sesuai program yang dibacakan.`), read, ed.node, show);
  }
  phaseA();
}
