// Celengan Bambu Nisa — SD Lanjut (10–12 tahun), variabel.
// Named boxes (variables) change with ATUR, TAMBAH and KURANGI, inside
// ULANGI and JIKA. A trace table shows the value after every step.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('id-ID') : n);
// Statements: { op: 'atur' | 'tambah' | 'kurangi', v, n, note? },
// { op: 'ulangi', n, body }, { op: 'jika', v, n, body }.
const S = (op, v, n, note) => ({ op, v, n, note });
const U = (n, ...body) => ({ op: 'ulangi', n, body });
const J = (v, n, ...body) => ({ op: 'jika', v, n, body });

// Runs a program. Every changed box makes one step; a JIKA check makes one
// too. `rounds` keeps the boxes at the end of each turn of the outer ULANGI.
export function runVars(prog) {
  const vars = {};
  const steps = [], rounds = [];
  let error = null;
  const exec = (items, path, depth) => {
    for (let i = 0; i < items.length && !error; i++) {
      const s = items[i];
      const p = [...path, i];
      if (steps.length > 400) { error = 'Program terlalu panjang, jadi dihentikan.'; return; }
      if (s.op === 'ulangi') {
        for (let k = 0; k < s.n && !error; k++) {
          exec(s.body, p, depth + 1);
          if (depth === 0) rounds.push({ k: k + 1, vars: { ...vars } });
        }
      } else if (s.op === 'jika') {
        const ok = (vars[s.v] ?? null) === s.n;
        steps.push({ path: p, check: ok, vars: { ...vars } });
        if (ok) exec(s.body, p, depth + 1);
      } else {
        if (s.op !== 'atur' && !(s.v in vars)) {
          error = `Kotak ${s.v} belum diisi. Pakai ATUR dulu.`;
          steps.push({ path: p, error, vars: { ...vars } });
          return;
        }
        const old = vars[s.v];
        vars[s.v] = s.op === 'atur' ? s.n : s.op === 'tambah' ? old + s.n : old - s.n;
        steps.push({ path: p, v: s.v, old, val: vars[s.v], vars: { ...vars } });
      }
    }
  };
  exec(prog, [], 0);
  return { steps, rounds, vars, error };
}

export const stmtText = (s, blank) => {
  if (s.op === 'ulangi') return `ULANGI ${blank ? '……' : s.n} KALI [`;
  if (s.op === 'jika') return `JIKA ${s.v} = ${fmt(s.n)} MAKA`;
  return `${s.op.toUpperCase()} ${s.v} ${s.op === 'atur' ? 'MENJADI ' : ''}${fmt(s.n)}`;
};

// The program as numbered lines, each with data-path for the highlight.
function progNode(prog, { blank, numbers } = {}) {
  const box = el('div', { class: 'clg-kode' });
  let line = 0;
  const walk = (items, path, depth) => items.forEach((s, i) => {
    const p = [...path, i];
    const row = el('div', { class: 'clg-baris', style: { '--d': depth }, 'data-path': p.join('.') },
      numbers ? el('span', { class: 'clg-no' }, ++line) : null,
      el('span', null, stmtText(s, blank)), s.note ? el('small', { class: 'clg-catatan' }, s.note) : null);
    box.append(row);
    if (s.body) {
      walk(s.body, p, depth + 1);
      if (s.op === 'ulangi') box.append(el('div', { class: 'clg-baris', style: { '--d': depth } }, ']'));
    }
  });
  walk(prog, [], 0);
  return box;
}

// Variable boxes: the old value is struck out before the new one shows.
function boxesView() {
  const node = el('div', { class: 'clg-kotak-kotak' });
  const boxes = {};
  const box = (v) => {
    if (!boxes[v]) {
      const val = el('b', { class: 'clg-isi' }, '–');
      const old = el('s', { class: 'clg-lama' });
      const b = el('div', { class: 'clg-kotak' }, el('span', { class: 'clg-nama' }, v), old, val);
      boxes[v] = { b, val, old };
      node.append(b);
    }
    return boxes[v];
  };
  return {
    node,
    reset(names = []) { node.replaceChildren(); Object.keys(boxes).forEach((k) => delete boxes[k]); names.forEach(box); },
    show(step) {
      if (!step.v) return;
      const b = box(step.v);
      b.old.textContent = step.old === undefined ? '' : fmt(step.old);
      b.val.textContent = fmt(step.val);
      b.b.classList.remove('baru'); void b.b.offsetWidth; b.b.classList.add('baru');
    },
  };
}

// The bamboo money box fills with the value of tabungan.
function bamboo() {
  const fill = el('div', { class: 'clg-isi-bambu' });
  const label = el('b', { class: 'clg-rp' }, 'Rp0');
  const node = el('div', { class: 'clg-celengan' }, el('div', { class: 'clg-bambu' }, fill), label);
  return {
    node,
    set(n) {
      const v = typeof n === 'number' ? n : 0;
      fill.style.height = `${Math.max(0, Math.min(100, (v / 30000) * 100))}%`;
      label.textContent = `Rp${fmt(v)}`;
      node.classList.toggle('minus', v < 0);
    },
  };
}

function light(codeNode, path) {
  codeNode.querySelectorAll('.nyala, .ya, .tidak').forEach((n) => n.classList.remove('nyala', 'ya', 'tidak'));
  if (path) codeNode.querySelector(`[data-path="${path.join('.')}"]`)?.classList.add('nyala');
}

// Animates a run on a code node and the boxes.
function play(codeNode, boxes, result, { onStep, done, speed = 400 } = {}) {
  let i = 0, t = null;
  const tick = () => {
    if (i >= result.steps.length) { light(codeNode, null); done?.(); return; }
    const s = result.steps[i++];
    light(codeNode, s.path);
    if ('check' in s) codeNode.querySelector(`[data-path="${s.path.join('.')}"]`)?.classList.add(s.check ? 'ya' : 'tidak');
    boxes.show(s);
    onStep?.(s, i);
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

const P1 = [
  S('atur', 'tabungan', 0, 'celengan baru'),
  S('tambah', 'tabungan', 2000, 'Senin: menyisihkan uang jajan'),
  S('tambah', 'tabungan', 2000, 'Selasa: menyisihkan uang jajan'),
  S('tambah', 'tabungan', 3000, 'Rabu: menyisihkan lebih banyak'),
  S('kurangi', 'tabungan', 4000, 'Kamis: membeli pensil warna'),
  S('tambah', 'tabungan', 2000, 'Jumat: menyisihkan uang jajan'),
  S('tambah', 'tabungan', 10000, 'Sabtu: hadiah dari Nenek'),
  S('kurangi', 'tabungan', 5000, 'Minggu: membeli layang-layang'),
];
const P2A = [S('atur', 'kelereng', 5), S('tambah', 'kelereng', 3), S('tambah', 'kelereng', 3)];
const P2B = [S('atur', 'tabungan', 10000), S('kurangi', 'tabungan', 4000), S('atur', 'tabungan', 1000)];
const P2C = [S('atur', 'tabungan', 0), U(4, S('tambah', 'tabungan', 2500))];
const BUG = [U(7, S('atur', 'tabungan', 0), S('tambah', 'tabungan', 2000))];
const FIXED = [S('atur', 'tabungan', 0), U(7, S('tambah', 'tabungan', 2000))];
const BUKU = [S('atur', 'tabungan', 0), U(9, S('tambah', 'tabungan', 3000)), S('kurangi', 'tabungan', 25000, 'membeli buku cerita')];
const NENEK = [S('atur', 'tabungan', 0), S('atur', 'hari', 0), U(9, S('tambah', 'hari', 1), S('tambah', 'tabungan', 3000), J('hari', 5, S('tambah', 'tabungan', 5000)))];

const money = (list, ans) => ({ nums: list, ans });
const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));

// Worksheet questions in order.
const PLAN = [
  { prog: P1, numbers: true, prompt: 'Soal 1. Isi tabungan sesudah baris 4 (Rabu)?', ...money([3000, 5000, 7000, 9000], 7000) },
  { prog: P1, numbers: true, prompt: 'Isi tabungan sesudah baris 5 (Kamis)?', ...money([3000, 4000, 7000, 11000], 3000) },
  { prog: P1, numbers: true, prompt: 'Isi tabungan di akhir minggu?', ...money([9000, 10000, 15000, 19000], 10000) },
  { prog: P1, numbers: true, prompt: 'Kapan isi tabungan paling banyak?', opts: textOpts('sesudah baris 7 (Sabtu): 15.000', ['sesudah baris 8 (Minggu): 10.000', 'sesudah baris 4 (Rabu): 7.000']) },
  { prog: P1, numbers: true, prompt: 'Berapa uang masuk dan uang keluar seluruhnya?', opts: textOpts('masuk 19.000, keluar 9.000', ['masuk 17.000, keluar 9.000', 'masuk 19.000, keluar 5.000', 'masuk 10.000, keluar 9.000']) },
  { prog: P2A, prompt: 'Soal 2a. Isi kotak kelereng di akhir?', ...money([5, 8, 11, 13], 11) },
  { prog: P2B, prompt: 'Soal 2b. Isi kotak tabungan di akhir?', ...money([1000, 6000, 7000, 11000], 1000) },
  { prog: P2C, prompt: 'Soal 2c. Isi kotak tabungan di akhir?', ...money([2500, 8000, 10000, 12500], 10000) },
  { prog: BUG, prompt: 'Soal 3. Program Nisa: isi tabungan di akhir putaran 3?', ...money([0, 2000, 6000, 14000], 2000), chart: true },
  { prog: BUG, prompt: 'Seharusnya tabungan 14.000. Program Nisa mencatat berapa?', ...money([0, 2000, 7000, 14000], 2000), chart: true },
  { prompt: 'Program mana yang sudah diperbaiki?', progs: [FIXED, [U(7, S('tambah', 'tabungan', 2000), S('atur', 'tabungan', 0))], [U(7, S('atur', 'tabungan', 2000))], [S('atur', 'tabungan', 0), U(7, S('atur', 'tabungan', 2000))]], play: FIXED },
  { prog: BUKU, blank: true, prompt: 'Soal 4. Buku harganya 25.000. ULANGI berapa KALI supaya uangnya cukup?', ...money([8, 9, 10, 25], 9) },
  { prog: BUKU, prompt: 'Isi tabungan setelah membeli buku?', ...money([0, 1000, 2000, 3000], 2000) },
  { prog: NENEK, prompt: 'Tantangan. Hari ke berapa tabungan pertama kali cukup untuk membeli buku 25.000?', ...money([5, 6, 7, 9], 7) },
];

// Bars of tabungan at the end of each turn of the outer ULANGI.
function chart(rounds) {
  const max = Math.max(1, ...rounds.map((r) => r.vars.tabungan ?? 0));
  return el('div', { class: 'clg-grafik' }, rounds.map((r) => el('div', { class: 'clg-batang' },
    el('i', { style: { height: `${((r.vars.tabungan ?? 0) / max) * 100}%` } }), el('small', null, r.k))));
}

function round(wrap, ctx, p, next) {
  const prog = p.prog ?? p.play;
  const code = p.progs ? null : progNode(prog, { blank: p.blank, numbers: p.numbers });
  const boxes = boxesView();
  const side = el('div', { class: 'clg-samping' }, boxes.node);
  const subject = p.progs ? el('div', { class: 'clg-soal' }, side) : el('div', { class: 'clg-soal' }, code, side);
  const after = () => {
    const shown = code ?? progNode(p.play);
    if (!code) subject.prepend(shown);
    const r = runVars(p.play ?? prog);
    play(shown, boxes, r, {
      speed: r.steps.length > 12 ? 160 : 320,
      done: () => { if (p.chart) side.append(chart(r.rounds)); setTimeout(next, p.chart ? 1500 : 500); },
    });
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: fmt(v), correct: v === p.ans })); columns = 4; }
  else if (p.progs) { options = ctx.rand.shuffle(p.progs.map((pr, i) => ({ icon: progNode(pr), correct: i === 0 }))); columns = 2; }
  else { options = ctx.rand.shuffle(p.opts); columns = 1; }
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-21-celengan',
  title: 'Celengan Bambu Nisa',
  topic: 'Variabel',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🎋',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan program dengan kotak bernama (variabel) memakai tabel jejak, menemukan bug ATUR di dalam perulangan, dan menulis program untuk mencapai target tabungan.',
  extraModes: [
    { id: 'editor', icon: '🧮', label: 'Kotak Variabel', desc: 'Susun program ATUR, TAMBAH, KURANGI, ULANGI, JIKA dan lihat isi kotaknya', create: createEditor },
    { id: 'minggu', icon: '📅', label: 'Tebak Akhir Minggu', desc: 'Satu tim memilih kejadian 7 hari, tim lain menebak isi tabungan', create: createWeek },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act celengan' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const VARS = ['tabungan', 'hari', 'kelereng'];
const VALUES = {
  tabungan: [0, 500, 1000, 2000, 2500, 3000, 4000, 5000, 10000, 25000],
  hari: [0, 1, 2, 3, 4, 5, 6, 7],
  kelereng: [0, 1, 2, 3, 4, 5, 10],
};
const LOOPS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

// Block editor. Cards go into the ULANGI or JIKA that is open. Tapping the
// box name, the number or the count changes it; ✕ removes a line.
function editor(ctx) {
  const prog = [];
  let openPath = [];
  let locked = false;
  const names = ['tabungan'];
  const list = el('div', { class: 'clg-program' });
  const at = (path) => path.reduce((items, i) => items[i].body, prog);
  const openBlock = () => (openPath.length ? at(openPath.slice(0, -1))[openPath.at(-1)] : null);
  const draw = () => {
    const open = openBlock();
    const rows = [];
    const walk = (items, path, depth) => items.forEach((s, i) => {
      const p = [...path, i];
      const act = (fn) => () => { if (!locked) { fn(); ctx.sound.tap(); draw(); } };
      const parts = [];
      if (s.op === 'ulangi') parts.push(el('b', null, 'ULANGI'), onTap(el('button', { class: 'clg-pilih', type: 'button' }, s.n), act(() => { s.n = cycle(LOOPS, s.n); })), el('b', null, 'KALI ['));
      else {
        parts.push(el('b', null, s.op === 'jika' ? 'JIKA' : s.op.toUpperCase()),
          onTap(el('button', { class: 'clg-pilih nama', type: 'button' }, s.v), act(() => { s.v = cycle(names, s.v); if (!VALUES[s.v].includes(s.n)) s.n = VALUES[s.v][0]; })),
          el('b', null, s.op === 'atur' ? 'MENJADI' : s.op === 'jika' ? '=' : ''),
          onTap(el('button', { class: 'clg-pilih', type: 'button' }, fmt(s.n)), act(() => { s.n = cycle(VALUES[s.v], s.n); })),
          s.op === 'jika' ? el('b', null, 'MAKA') : null);
      }
      parts.push(onTap(el('button', { class: 'clg-hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), act(() => { items.splice(i, 1); openPath = []; })));
      const row = el('div', { class: `clg-baris${s.body ? ' wadah' : ''}${open === s ? ' buka' : ''}`, style: { '--d': depth }, 'data-path': p.join('.') }, ...parts.filter(Boolean));
      if (s.body) row.addEventListener('click', (e) => { if (!locked && !e.target.closest('button')) { openPath = p; draw(); } });
      rows.push(row);
      if (s.body) {
        walk(s.body, p, depth + 1);
        if (!s.body.length) rows.push(el('div', { class: 'clg-baris kosong', style: { '--d': depth + 1 } }, '…'));
        if (s.op === 'ulangi') rows.push(el('div', { class: 'clg-baris', style: { '--d': depth } }, ']'));
      }
    });
    walk(prog, [], 0);
    list.replaceChildren(...(rows.length ? rows : [el('span', { class: 'clg-kosong' }, 'Ketuk kartu di bawah untuk menyusun program.')]));
    closeBtn.disabled = !openPath.length;
  };
  const add = (op) => {
    if (locked) return;
    if (JSON.stringify(prog).split('"op"').length > 20) { shake(list); return; }
    const target = openPath.length ? openBlock().body : prog;
    const v = names.at(-1);
    let s;
    if (op === 'ulangi') s = U(3);
    else if (op === 'jika') s = J(names.includes('hari') ? 'hari' : v, 5);
    else s = S(op, v, op === 'atur' ? 0 : VALUES[v][2]);
    if (s.op === 'jika' && !VALUES[s.v].includes(s.n)) s.n = VALUES[s.v][1];
    target.push(s);
    if (s.body) openPath = [...openPath, target.length - 1];
    ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'clg-palet' },
    ...['atur', 'tambah', 'kurangi', 'ulangi', 'jika'].map((op) => onTap(el('button', { class: 'clg-kartu', type: 'button', 'data-op': op }, op.toUpperCase()), () => add(op))));
  const closeBtn = button('Tutup ]', () => { openPath = openPath.slice(0, -1); draw(); }, 'small');
  const newBox = button('+ Kotak baru', () => {
    const next = VARS.find((v) => !names.includes(v));
    if (!next) { shake(newBox); return; }
    names.push(next); newBox.textContent = `+ Kotak baru (sekarang: ${names.join(', ')})`; ctx.sound.tap();
  }, 'small');
  draw();
  return {
    node: el('div', { class: 'clg-papan' }, list, el('div', { class: 'row' }, palette, closeBtn), newBox),
    prog,
    set(items) {
      prog.splice(0, prog.length, ...structuredClone(items)); openPath = [];
      const walk = (xs) => xs.forEach((s) => { if (s.v && !names.includes(s.v)) names.push(s.v); if (s.body) walk(s.body); });
      walk(prog);
      newBox.textContent = `+ Kotak baru (sekarang: ${names.join(', ')})`;
      draw();
    },
    clear() { prog.length = 0; openPath = []; draw(); },
    lock(v) { locked = v; },
    list,
  };
}

function traceTable() {
  const body = el('tbody');
  const node = el('div', { class: 'clg-jejak-tempat' }, el('table', { class: 'clg-jejak' },
    el('thead', null, el('tr', null, el('th', null, 'Langkah'), el('th', null, 'Perintah'), el('th', null, 'Isi kotak sesudahnya'))), body));
  return {
    node,
    add(i, stmt, s) {
      const isi = s.v ? `${s.v} = ${fmt(s.val)}` : s.error ? `⛔ ${s.error}` : s.check ? 'ya, jalankan isinya' : 'tidak';
      body.append(el('tr', null, el('td', null, i), el('td', null, stmtText(stmt)), el('td', null, isi)));
      node.scrollTop = node.scrollHeight;
    },
  };
}
const stmtAt = (prog, path) => path.reduce((acc, i, k) => (k === 0 ? acc[i] : acc.body[i]), prog);

function createEditor(root, ctx) {
  const wrap = el('div', { class: 'act celengan' });
  root.append(wrap);
  const board = editor(ctx);
  const boxes = boxesView();
  const tube = bamboo();
  const info = el('p', { class: 'clg-info' });
  const extra = el('div', { class: 'clg-ekstra' });
  let result = null, idx = 0, stop = null, trace = null;
  const begin = () => {
    stop?.();
    if (!board.prog.length) { shake(board.node); return false; }
    result = runVars(board.prog); idx = 0;
    boxes.reset(); tube.set(0); trace = traceTable();
    extra.replaceChildren(trace.node); info.textContent = '';
    board.lock(true);
    return true;
  };
  const finish = () => {
    board.lock(false); light(board.list, null);
    const vals = Object.entries(result.vars).map(([k, v]) => `${k} = ${fmt(v)}`).join(', ');
    info.textContent = result.error ? `⛔ ${result.error}` : `Selesai. Isi akhir: ${vals || '–'}.`;
    if (result.rounds.length > 1 && 'tabungan' in result.vars) extra.prepend(el('div', { class: 'clg-samping' }, el('small', { class: 'label' }, 'tabungan di akhir putaran'), chart(result.rounds)));
    if (result.error) ctx.sound.bad(); else ctx.sound.good();
    result = null;
  };
  const stepOnce = () => {
    const s = result.steps[idx++];
    light(board.list, s.path);
    if ('check' in s) board.list.querySelector(`[data-path="${s.path.join('.')}"]`)?.classList.add(s.check ? 'ya' : 'tidak');
    boxes.show(s);
    if (s.v === 'tabungan') tube.set(s.val);
    trace.add(idx, stmtAt(board.prog, s.path), s);
  };
  const stepBtn = button('Langkah ⏭', () => {
    if (!result && !begin()) return;
    if (idx < result.steps.length) stepOnce();
    if (idx >= result.steps.length) finish();
  }, 'small');
  const go = button('▶ Jalankan', () => {
    if (!result && !begin()) return;
    const tick = () => {
      if (!result) return;
      if (idx >= result.steps.length) { finish(); return; }
      stepOnce();
      const t = setTimeout(tick, result.steps.length > 30 ? 160 : 380);
      stop = () => clearTimeout(t);
    };
    tick();
  }, 'primary');
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Soal 1', () => board.set(P1), 'small'),
    button('Program Nisa (bug)', () => board.set(BUG), 'small'),
    button('Target buku', () => board.set(BUKU), 'small'),
    button('Hadiah Nenek', () => board.set(NENEK), 'small'),
    button('Kosongkan', () => board.clear(), 'small'));
  wrap.append(el('p', { class: 'prompt' }, 'Susun program, lalu jalankan langkah demi langkah dan lihat isi kotaknya.'), examples,
    el('div', { class: 'clg-atas' }, board.node,
      el('div', { class: 'clg-samping' }, el('div', { class: 'row' }, boxes.node, tube.node), el('div', { class: 'row' }, go, stepBtn), extra)), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A picks one event for each of 7 days; team B guesses the
// money box at the end of the week before the program runs.
const EVENTS = [
  { label: 'menyisihkan uang jajan', s: ['tambah', 2000] },
  { label: 'menyisihkan lebih banyak', s: ['tambah', 3000] },
  { label: 'hadiah dari Nenek', s: ['tambah', 5000] },
  { label: 'membeli jajanan', s: ['kurangi', 1000] },
  { label: 'membeli pensil warna', s: ['kurangi', 4000] },
  { label: 'tidak menabung', s: null },
];
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function createWeek(root, ctx) {
  const wrap = el('div', { class: 'act celengan' });
  root.append(wrap);
  let turn = 0, stop = null;
  const score = [0, 0];
  function start() {
    stop?.();
    const a = turn % 2, b = 1 - a;
    const picks = DAYS.map(() => 0);
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: ketuk kejadian setiap hari untuk mengubahnya. Uang tidak boleh kurang dari 0.`);
    const info = el('p', { class: 'clg-info' });
    const rows = el('div', { class: 'clg-minggu' });
    const program = () => [S('atur', 'tabungan', 0, 'awal minggu'),
      ...picks.map((k, d) => (EVENTS[k].s ? S(EVENTS[k].s[0], 'tabungan', EVENTS[k].s[1], `${DAYS[d]}: ${EVENTS[k].label}`) : null)).filter(Boolean)];
    const draw = () => {
      rows.replaceChildren(...DAYS.map((d, i) => onTap(el('button', { class: 'clg-hari', type: 'button' }, el('b', null, d), el('span', null, EVENTS[picks[i]].label),
        el('small', null, EVENTS[picks[i]].s ? `${EVENTS[picks[i]].s[0] === 'tambah' ? '+' : '−'}${fmt(EVENTS[picks[i]].s[1])}` : '0')), () => {
        picks[i] = (picks[i] + 1) % EVENTS.length; ctx.sound.tap(); draw();
      })));
    };
    draw();
    const ready = button('Minggu siap ✓', () => {
      const r = runVars(program());
      if (r.steps.some((s) => s.val < 0)) { info.textContent = '⛔ Uangnya akan kurang dari 0. Ganti salah satu belanja.'; shake(rows); return; }
      info.textContent = '';
      ready.remove(); rows.classList.add('kunci');
      head.textContent = `Tim ${b + 1}: tebak isi tabungan di akhir minggu, lalu jalankan.`;
      let guess = 0;
      const shown = el('b', { class: 'clg-tebak' }, '0');
      const set = (d) => { guess = Math.max(0, guess + d); shown.textContent = fmt(guess); ctx.sound.tap(); };
      const guessRow = el('div', { class: 'row' }, button('−1.000', () => set(-1000), 'small'), shown, button('+1.000', () => set(1000), 'small'), button('+5.000', () => set(5000), 'small'));
      const code = progNode(r.steps.length ? program() : [], { numbers: true });
      const boxes = boxesView();
      const runBtn = button('▶ Jalankan', () => {
        runBtn.remove(); guessRow.classList.add('kunci');
        stop = play(code, boxes, r, {
          speed: 450,
          done: () => {
            const right = guess === r.vars.tabungan;
            if (right) { score[b]++; ctx.sound.win(); } else ctx.sound.bad();
            info.textContent = `Isi tabungan di akhir minggu: ${fmt(r.vars.tabungan)}. ${right ? `✅ Tebakan Tim ${b + 1} tepat!` : `✗ Tebakan Tim ${b + 1}: ${fmt(guess)}.`} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'clg-atas' }, code, el('div', { class: 'clg-samping' }, boxes.node, guessRow, runBtn)), info);
    }, 'primary');
    wrap.replaceChildren(head, rows, ready, info);
  }
  start();
  return { destroy() { stop?.(); } };
}
