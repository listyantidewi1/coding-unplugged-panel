// Pola Ubin Teras Balai Desa — SD Lanjut (10–12 tahun), perulangan bersarang.
// A tile-painting robot starts at row 1, column 1. Cards: WARNAI, MAJU,
// PINDAH BARIS and ULANGI n [ … ], which may hold another ULANGI.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const CARD = {
  W: { icon: '🖌️', label: 'WARNAI' },
  M: { icon: '➡️', label: 'MAJU' },
  P: { icon: '↩️', label: 'PINDAH BARIS' },
};
const L = (n, ...body) => ({ n, body });
export const countCards = (prog) => prog.reduce((s, c) => s + (typeof c === 'string' ? 1 : 1 + countCards(c.body)), 0);
// Cards needed when every command is written one by one.
export const flatCount = (prog) => prog.reduce((s, c) => s + (typeof c === 'string' ? 1 : c.n * flatCount(c.body)), 0);

// Runs a program on an n × n terrace. Columns and rows count from 0 here;
// x = n or y = n is the selasar. With `stop`, WARNAI on the selasar stops
// the robot, as on the panel; without it the run goes on, as on paper.
export function runTiles(prog, n, { stop = false } = {}) {
  const st = { x: 0, y: 0, painted: new Set(), selasar: [], steps: [], error: null, runs: 0 };
  const exec = (items, path, iters) => {
    for (let i = 0; i < items.length && !st.error; i++) {
      const c = items[i];
      const p = [...path, i];
      if (typeof c !== 'string') {
        for (let k = 0; k < c.n && !st.error; k++) exec(c.body, p, [...iters, [k + 1, c.n]]);
        continue;
      }
      st.runs++;
      if (c === 'M') st.x++;
      else if (c === 'P') { st.x = 0; st.y++; }
      if (st.x > n + 2 || st.y > n + 1) {
        st.error = 'Robot keluar dari teras dan selasar, jadi robot berhenti.';
        st.steps.push({ x: Math.min(st.x, n), y: Math.min(st.y, n), path: p, iters, runs: st.runs, error: st.error });
        return;
      }
      let paint = false;
      if (c === 'W') {
        if (st.x >= n || st.y >= n) {
          st.selasar.push([st.x, st.y]);
          if (stop) {
            st.error = 'Robot akan mengecat selasar, jadi robot berhenti.';
            st.steps.push({ x: st.x, y: st.y, path: p, iters, runs: st.runs, error: st.error });
            return;
          }
        } else st.painted.add(`${st.x},${st.y}`);
        paint = true;
      }
      st.steps.push({ x: st.x, y: st.y, op: c, paint, path: p, iters, runs: st.runs });
    }
  };
  exec(prog, [], []);
  return st;
}

// Target patterns; each tells whether tile (x, y) is terracotta.
const PATTERNS = {
  tegak: { label: 'garis tegak', on: (x) => x % 2 === 0 },
  datar: { label: 'garis mendatar', on: (x, y) => y % 2 === 0 },
  catur: { label: 'papan catur', on: (x, y) => (x + y) % 2 === 0 },
  tepi: { label: 'tepi', on: (x, y, n) => x === 0 || x === n - 1 },
  lebar: { label: 'garis tegak lebar dua', on: (x, y, n) => n === 6 && [0, 1, 4, 5].includes(x) },
  baris1: { label: 'baris 1', on: (x, y) => y === 0 },
};
const patternSet = (key, n) => {
  const s = new Set();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (PATTERNS[key].on(x, y, n)) s.add(`${x},${y}`);
  return s;
};
const sameSet = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));

// A small picture of a pattern, for answer buttons.
function miniTiles(set, n = 6) {
  const g = el('span', { class: 'ubt-mini', style: { '--n': n } });
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) g.append(el('i', { class: set.has(`${x},${y}`) ? 'on' : '' }));
  return g;
}

// The terrace with its selasar on the right and below.
function terrace(n, { tap } = {}) {
  const cells = {};
  const grid = el('div', { class: 'ubt-teras', style: { '--n': n + 2 } });
  grid.append(el('span', { class: 'ubt-kepala' }),
    ...Array.from({ length: n }, (_, i) => el('span', { class: 'ubt-kepala' }, i + 1)), el('span', { class: 'ubt-kepala' }, ''));
  for (let y = 0; y <= n; y++) {
    grid.append(el('span', { class: 'ubt-kepala' }, y < n ? y + 1 : ''));
    for (let x = 0; x <= n; x++) {
      const c = el('span', { class: `ubt-ubin${x === n || y === n ? ' selasar' : ''}` });
      if (tap && x < n && y < n) { c.classList.add('ketuk'); onTap(c, () => tap(x, y, c)); }
      cells[`${x},${y}`] = c;
      grid.append(c);
    }
  }
  const robot = el('span', { class: 'ubt-robot' }, '🤖');
  const cell = (x, y) => cells[`${Math.min(x, n)},${Math.min(y, n)}`];
  const view = {
    node: grid, cells,
    reset() {
      Object.values(cells).forEach((c) => c.classList.remove('cat', 'salah', 'kedip'));
      view.robot(0, 0);
    },
    robot(x, y) { cell(x, y).append(robot); },
    paint(x, y) {
      const c = cell(x, y);
      c.classList.add(c.classList.contains('selasar') ? 'salah' : 'cat');
    },
    show(set, cls = 'cat') { set.forEach((k) => cells[k]?.classList.add(cls)); },
    flash(x, y) { const c = cell(x, y); c.classList.remove('kedip'); void c.offsetWidth; c.classList.add('kedip'); },
  };
  view.robot(0, 0);
  return view;
}

// Animates a run. `onStep(step)` lights the card and the counters.
function play(view, result, { onStep, done, speed = 200 } = {}) {
  let i = 0, t = null;
  view.reset();
  const tick = () => {
    if (i >= result.steps.length) { done?.(); return; }
    const s = result.steps[i++];
    view.robot(s.x, s.y);
    if (s.paint) view.paint(s.x, s.y);
    if (s.error) view.flash(s.x, s.y);
    onStep?.(s);
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

// Program text as on the worksheet, with indented ULANGI blocks.
function progLines(prog, depth = 0) {
  const pad = '    '.repeat(depth);
  const out = [];
  let run = [];
  const flush = () => { if (run.length) out.push(pad + run.join(', ')); run = []; };
  for (const c of prog) {
    if (typeof c === 'string') { run.push(CARD[c].label); continue; }
    flush();
    if (c.body.every((x) => typeof x === 'string')) out.push(`${pad}ULANGI ${c.n} [ ${c.body.map((x) => CARD[x].label).join(', ')} ]`);
    else out.push(`${pad}ULANGI ${c.n} [`, ...progLines(c.body, depth + 1), `${pad}]`);
  }
  flush();
  return out;
}
const progNode = (prog) => el('pre', { class: 'ubt-kode' }, progLines(prog).join('\n'));
const progText = (prog) => prog.map((c) => (typeof c === 'string' ? CARD[c].label : `ULANGI ${c.n} [ ${progText(c.body)} ]`)).join(', ');

const Q1 = [L(6, 'W', 'M')];
const Q2 = [L(6, L(3, 'W', 'M', 'M'), 'P')];
const Q3 = [L(3, L(3, 'W', 'M', 'M'), 'P', 'M', L(3, 'W', 'M', 'M'), 'P')];
const Q4A = [L(3, L(6, 'W', 'M'), 'P', 'P')];
const Q4B = [L(6, 'W', L(5, 'M'), 'W', 'P')];
const Q6 = [L(6, L(4, 'W', 'M', 'M'), 'P')];
const pic = (key) => miniTiles(patternSet(key, 6));

// Worksheet questions 1–6. After a right answer the robot runs the program.
const PLAN = [
  { prog: Q1, prompt: 'Soal 1. Ubin mana saja yang dicat?', pics: ['baris1', 'tegak', 'datar', 'tepi'] },
  { prog: Q1, prompt: 'Tanpa ULANGI, program ini perlu berapa kartu?', nums: [3, 6, 7, 12], ans: 12 },
  { prog: Q1, prompt: 'Dengan ULANGI, berapa kartunya? Kartu ULANGI dihitung satu.', nums: [2, 3, 6, 12], ans: 3 },
  { prog: Q2, prompt: 'Soal 2. Pola apa yang dicat robot?', pics: ['tegak', 'datar', 'catur', 'tepi'] },
  { prog: Q2, prompt: 'Berapa kali WARNAI dijalankan?', nums: [6, 9, 18, 36], ans: 18 },
  { prog: Q2, prompt: 'Berapa kartu di program ini?', nums: [4, 6, 10, 18], ans: 6 },
  { prog: Q2, prompt: 'Tanpa ULANGI, programnya perlu berapa kartu?', nums: [18, 36, 54, 60], ans: 60 },
  { prog: Q3, prompt: 'Soal 3. Pola apa yang dicat robot?', pics: ['catur', 'tegak', 'datar', 'lebar'] },
  { prog: Q3, prompt: 'Apa gunanya kartu MAJU sesudah PINDAH BARIS yang pertama?',
    texts: ['menggeser awal baris genap satu ubin ke kanan', 'membuat robot mengecat dua kali', 'membawa robot ke baris berikutnya'] },
  { target: 'datar', play: Q4A, prompt: 'Soal 4a. Program mana yang membuat pola garis mendatar ini?',
    progs: [Q4A, [L(6, L(6, 'W', 'M'), 'P')], [L(3, L(3, 'W', 'M', 'M'), 'P', 'P')], [L(3, L(6, 'W', 'M'), 'P')]] },
  { target: 'tepi', play: Q4B, prompt: 'Soal 4b. Program mana yang membuat pola tepi ini tanpa mengecat selasar?',
    progs: [Q4B, [L(6, 'W', L(6, 'M'), 'W', 'P')], [L(6, 'W', L(4, 'M'), 'W', 'P')], [L(5, 'W', L(5, 'M'), 'W', 'P')]] },
  { prog: Q3, prompt: 'Soal 5. Papan catur: 63 kartu tanpa ULANGI, 12 kartu dengan ULANGI. Berapa kartu yang dihemat?', nums: [45, 51, 53, 75], ans: 51 },
  { prog: Q4B, prompt: 'Pola tepi: berapa kartu tanpa ULANGI?', nums: [8, 36, 42, 48], ans: 48 },
  { prog: Q6, prompt: 'Soal 6. Program Raka mengecat selasar. Di kolom berapa?', nums: [5, 6, 7, 8], ans: 7 },
  { prog: Q6, prompt: 'Berapa kali robot mengecat selasar?', nums: [1, 3, 6, 18], ans: 6 },
  { prog: Q6, play: Q2, prompt: 'Bagaimana memperbaiki program Raka?',
    texts: ['ganti ULANGI 4 di dalam menjadi ULANGI 3', 'ganti ULANGI 6 di luar menjadi ULANGI 5', 'hapus satu MAJU'] },
];

function round(wrap, ctx, p, next) {
  const view = terrace(6);
  const head = p.target ? el('div', { class: 'ubt-target' }, el('b', null, 'Pola target'), miniTiles(patternSet(p.target, 6))) : progNode(p.prog);
  const subject = el('div', { class: 'ubt-soal' }, head, view.node);
  const after = () => play(view, runTiles(p.play ?? p.prog, 6), { speed: 90, done: next });
  let options, columns = 2;
  if (p.pics) { options = ctx.rand.shuffle(p.pics.map((k, i) => ({ icon: pic(k), label: PATTERNS[k].label, correct: i === 0 }))); columns = 4; }
  else if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else if (p.texts) { options = ctx.rand.shuffle(p.texts.map((t, i) => ({ label: t, correct: i === 0 }))); columns = 1; }
  else options = ctx.rand.shuffle(p.progs.map((pr, i) => ({ icon: progNode(pr), correct: i === 0 })));
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-19-ubin-teras',
  title: 'Pola Ubin Teras Balai Desa',
  topic: 'Perulangan bersarang',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🟫',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan dan menulis program dengan ULANGI di dalam ULANGI untuk pola ubin, menghitung perintah yang dijalankan dan kartu yang dihemat, serta memperbaiki program yang mengecat selasar.',
  extraModes: [
    { id: 'editor', icon: '🤖', label: 'Editor Robot', desc: 'Susun program bersarang dan lihat robot mengecat teras', create: createEditor },
    { id: 'pola', icon: '🎨', label: 'Pola Tim', desc: 'Satu tim mewarnai pola, tim lain menulis program terpendeknya', create: createTeamPattern },
    { id: 'target', icon: '🎯', label: 'Pola Target', desc: 'Buat program untuk pola target dengan kartu sesedikit mungkin', create: createTarget },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act ubin-teras' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// Block editor. New cards go into the ULANGI that is open; an ULANGI may be
// opened inside another. Tapping a card removes it; tapping a bracket opens it.
function editor(ctx) {
  const prog = [];
  let openPath = [];
  let locked = false;
  const list = el('div', { class: 'ubt-program' });
  const count = el('div', { class: 'ubt-hitung' });
  const at = (path) => path.reduce((items, i) => items[i].body, prog);
  const openLoop = () => (openPath.length ? at(openPath.slice(0, -1))[openPath.at(-1)] : null);
  const draw = () => {
    const open = openLoop();
    const card = (c, owner, i, path) => {
      if (typeof c === 'string') {
        return onTap(el('button', { class: 'ubt-kartu', type: 'button', 'data-path': path.join('.') }, el('span', null, CARD[c].icon), el('small', null, CARD[c].label)), () => {
          if (locked) return;
          owner.splice(i, 1); openPath = []; draw();
        });
      }
      const minus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'kurangi' }, '−'), () => { if (!locked) { c.n = Math.max(1, c.n - 1); draw(); } });
      const plus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'tambah' }, '+'), () => { if (!locked) { c.n = Math.min(9, c.n + 1); draw(); } });
      const del = onTap(el('button', { class: 'ubt-hapus', type: 'button', 'aria-label': 'hapus ULANGI' }, '✕'), () => {
        if (locked) return;
        owner.splice(i, 1); openPath = []; draw();
      });
      const box = el('div', { class: `ubt-ulangi d${path.length % 2}${open === c ? ' buka' : ''}`, 'data-path': path.join('.') },
        el('div', { class: 'ubt-ulangi-kepala' }, el('b', null, 'ULANGI'), minus, el('b', { class: 'ubt-n' }, c.n), plus, el('b', null, '['), del),
        el('div', { class: 'ubt-isi' }, ...(c.body.length ? c.body.map((x, j) => card(x, c.body, j, [...path, j])) : [el('span', { class: 'ubt-kosong' }, '…')])),
        el('b', null, ']'));
      box.addEventListener('click', (e) => {
        if (locked || e.target.closest('button')) return;
        e.stopPropagation();
        openPath = path; draw();
      });
      return box;
    };
    list.replaceChildren(...(prog.length ? prog.map((c, i) => card(c, prog, i, [i])) : [el('span', { class: 'ubt-kosong' }, 'Ketuk kartu di bawah untuk menyusun program.')]));
    count.textContent = `Kartu ditulis: ${countCards(prog)}`;
    closeBtn.disabled = !openPath.length;
  };
  const add = (c) => {
    if (locked) return;
    if (countCards(prog) >= 30) { shake(list); return; }
    const target = openPath.length ? openLoop().body : prog;
    if (c === 'U') {
      if (openPath.length >= 3) { shake(list); return; }
      target.push(L(2));
      openPath = [...openPath, target.length - 1];
    } else target.push(c);
    ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'ubt-palet' },
    ...['W', 'M', 'P'].map((c) => onTap(el('button', { class: 'ubt-kartu', type: 'button', 'data-c': c }, el('span', null, CARD[c].icon), el('small', null, CARD[c].label)), () => add(c))),
    onTap(el('button', { class: 'ubt-kartu ulangi', type: 'button', 'data-c': 'U' }, el('span', null, '🔁'), el('small', null, 'ULANGI')), () => add('U')));
  const closeBtn = button('Tutup kurung ]', () => { openPath = openPath.slice(0, -1); draw(); }, 'small');
  draw();
  return {
    node: el('div', { class: 'ubt-papan' }, list, el('div', { class: 'row' }, palette, closeBtn), count),
    prog,
    set(items) { prog.splice(0, prog.length, ...structuredClone(items)); openPath = []; draw(); },
    clear() { prog.length = 0; openPath = []; draw(); },
    lock(v) { locked = v; },
    light(path) {
      list.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
      for (let k = 1; k <= path.length; k++) list.querySelector(`[data-path="${path.slice(0, k).join('.')}"]`)?.classList.add('nyala');
    },
  };
}

// Loop counters: outer and inner rounds and commands run (the board counts cards).
function counters() {
  const node = el('div', { class: 'ubt-counter' });
  const set = (iters, runs) => {
    const loops = iters.length ? iters.map(([k, n], i) => `${i === 0 ? 'Luar' : i === 1 ? 'Dalam' : 'Dalam lagi'} ${k}/${n}`).join(' · ') : 'Putaran: –';
    node.replaceChildren(el('span', null, `🔁 ${loops}`), el('span', null, `⚙️ ${runs} perintah dijalankan`));
  };
  set([], 0);
  return { node, set };
}

// Runs the editor's program on a view, with the counters and the report.
function runner(ctx, board, getView, getN, cnt, info, { check } = {}) {
  let stop = null;
  const go = button('▶ Jalankan', () => {
    if (!board.prog.length) { shake(board.node); return; }
    stop?.();
    const n = getN();
    const r = runTiles(board.prog, n, { stop: true });
    const cards = countCards(board.prog);
    board.lock(true); info.textContent = '';
    stop = play(getView(), r, {
      speed: n > 6 ? 70 : 150,
      onStep: (s) => { board.light(s.path); cnt.set(s.iters, s.runs); },
      done: () => {
        board.lock(false);
        if (!r.error) board.light([]);
        const parts = [`🟫 ${r.painted.size} ubin dicat. ${cards} kartu ditulis, ${r.runs} perintah dijalankan.`];
        if (!r.error) parts.push(`Tanpa ULANGI perlu ${r.runs} kartu, jadi ${Math.max(0, r.runs - cards)} kartu dihemat.`);
        if (r.error) parts.push(`⛔ ${r.error}`);
        info.textContent = parts.join(' ');
        if (check) check(r, cards);
        else if (r.error) ctx.sound.bad(); else ctx.sound.good();
      },
    });
  }, 'primary');
  return { go, stop: () => stop?.() };
}

function createEditor(root, ctx) {
  const wrap = el('div', { class: 'act ubin-teras' });
  root.append(wrap);
  let n = 6, view;
  const holder = el('div', { class: 'ubt-tempat' });
  const info = el('p', { class: 'ubt-info' });
  const cnt = counters();
  const board = editor(ctx);
  const run = runner(ctx, board, () => view, () => n, cnt, info);
  const pickSize = (k) => {
    run.stop(); n = k;
    view = terrace(n);
    holder.replaceChildren(view.node);
    sizes.querySelectorAll('.btn').forEach((b) => b.classList.toggle('on', Number(b.dataset.n) === n));
    info.textContent = ''; cnt.set([], 0);
  };
  const sizes = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Teras'), [4, 6, 8].map((k) => {
    const b = button(`${k} × ${k}`, () => pickSize(k), 'small');
    b.dataset.n = k;
    return b;
  }));
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Garis tegak', () => board.set(Q2), 'small'),
    button('Papan catur', () => board.set(Q3), 'small'),
    button('Program Raka', () => board.set(Q6), 'small'),
    button('Kosongkan', () => board.clear(), 'small'));
  pickSize(6);
  wrap.append(el('p', { class: 'prompt' }, 'Susun program bersarang, lalu jalankan robot pengecat ubin.'), el('div', { class: 'row' }, sizes, examples),
    el('div', { class: 'ubt-atas' }, holder, el('div', { class: 'ubt-kanan' }, board.node, el('div', { class: 'row' }, run.go, cnt.node))), info);
  return { destroy() { run.stop(); } };
}

// Bergiliran: one team taps tiles to make a pattern, the other team writes
// the shortest program for it; the robot runs and the two are compared.
function createTeamPattern(root, ctx) {
  const wrap = el('div', { class: 'act ubin-teras' });
  root.append(wrap);
  let turn = 0;
  const score = [0, 0];
  let run = null;
  function start() {
    run?.stop();
    const a = turn % 2, b = 1 - a;
    const pattern = new Set();
    const view = terrace(6, {
      tap: (x, y, c) => {
        if (fixed) return;
        const k = `${x},${y}`;
        if (pattern.has(k)) pattern.delete(k); else pattern.add(k);
        c.classList.toggle('target', pattern.has(k));
        ctx.sound.tap();
      },
    });
    let fixed = false;
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: ketuk ubin untuk membuat pola. Tim ${b + 1} jangan melihat programnya, cukup polanya.`);
    const info = el('p', { class: 'ubt-info' });
    const lockBtn = button('Pola siap ✓', () => {
      if (!pattern.size) { shake(view.node); return; }
      fixed = true;
      lockBtn.remove();
      head.textContent = `Tim ${b + 1}: tulis program terpendek untuk pola ini, lalu jalankan.`;
      const goal = miniTiles(pattern);
      const cnt = counters();
      const board = editor(ctx);
      const runView = terrace(6);
      run = runner(ctx, board, () => runView, () => 6, cnt, info, {
        check: (r, cards) => {
          const right = !r.error && sameSet(r.painted, pattern);
          if (right) { score[b]++; ctx.sound.win(); } else ctx.sound.bad();
          info.textContent += ` ${right ? `✅ Pola sama persis dengan ${cards} kartu!` : '✗ Pola belum sama. Coba perbaiki programnya.'} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
          if (right && !wrap.querySelector('.ubt-tukar')) wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary ubt-tukar'));
        },
      });
      wrap.replaceChildren(head, el('div', { class: 'ubt-atas' },
        el('div', { class: 'ubt-target' }, el('b', null, `Pola Tim ${a + 1}`), goal, runView.node),
        el('div', { class: 'ubt-kanan' }, board.node, cnt.node, el('div', { class: 'row' }, run.go))), info);
    }, 'primary');
    wrap.replaceChildren(head, view.node, lockBtn, info);
  }
  start();
  return { destroy() { run?.stop(); } };
}

// Target patterns with the number of cards in the key's program.
const TARGETS = [
  { key: 'tegak', best: 6 },
  { key: 'datar', best: 6 },
  { key: 'tepi', best: 6 },
  { key: 'catur', best: 12 },
  { key: 'lebar', best: 8 },
];

function createTarget(root, ctx) {
  const wrap = el('div', { class: 'act ubin-teras' });
  root.append(wrap);
  let idx = 0;
  let run = null;
  function start() {
    run?.stop();
    const t = TARGETS[idx % TARGETS.length];
    const goal = patternSet(t.key, 6);
    const view = terrace(6);
    view.show(goal, 'target');
    const info = el('p', { class: 'ubt-info' });
    const cnt = counters();
    const board = editor(ctx);
    run = runner(ctx, board, () => view, () => 6, cnt, info, {
      check: (r, cards) => {
        view.show(goal, 'target');
        const right = !r.error && sameSet(r.painted, goal);
        if (right) ctx.sound.win(); else ctx.sound.bad();
        info.textContent += right
          ? ` ✅ Benar! ${cards <= t.best ? `⭐ Bintang tambahan: ${cards} kartu, sama hemat dengan kunci atau lebih.` : `Program di kunci hanya ${t.best} kartu. Bisakah lebih hemat?`}`
          : ' ✗ Pola belum sama dengan target.';
      },
    });
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, `Pola target: ${PATTERNS[t.key].label}. Ubin bergaris adalah target. Buat programnya dengan kartu sesedikit mungkin.`),
      el('div', { class: 'ubt-atas' }, view.node, el('div', { class: 'ubt-kanan' }, board.node, cnt.node,
        el('div', { class: 'row' }, run.go, button('Pola berikutnya ⏭', () => { idx++; start(); }, 'small')))), info);
  }
  start();
  return { destroy() { run?.stop(); } };
}
