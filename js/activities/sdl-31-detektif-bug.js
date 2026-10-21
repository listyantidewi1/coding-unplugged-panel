// Detektif Bug — SD Lanjut (10–12 tahun), menelusuri dan memperbaiki bug.
// Four canteen robot programs go wrong. A bug detective writes the expected
// result, traces the program, finds the first line that differs, fixes it,
// and tests again with test cases chosen to catch the same kind of bug.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const BUGS = ['urutan tertukar', 'jumlah ulangan salah', 'syarat terbalik', 'variabel lupa diubah'];
const fmt = (n) => n.toLocaleString('id-ID');

// Case 1: the school corridor, columns A–C and rows 1–6. The robot starts
// at C1 facing up.
const COLS = 'ABC';
const PLACES = { C6: '📚 Perpustakaan', A4: '🏫 Kelas 5A', C1: '🍲 Kantin' };
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIR_TEXT = ['ke atas', 'ke kanan', 'ke bawah', 'ke kiri'];
const DIR_ARROW = ['⬆️', '➡️', '⬇️', '⬅️'];
const cell = (x, y) => `${COLS[x]}${y + 1}`;
export const ROBOT_BUG = [{ op: 'ambil' }, { op: 'maju', n: 3 }, { op: 'maju', n: 2 }, { op: 'kiri' }, { op: 'taruh' }];
export const ROBOT_FIX = [{ op: 'ambil' }, { op: 'maju', n: 3 }, { op: 'kiri' }, { op: 'maju', n: 2 }, { op: 'taruh' }];
const robotText = (s) => ({ ambil: 'AMBIL nampan', taruh: 'TARUH nampan', kiri: 'BELOK KIRI', kanan: 'BELOK KANAN', maju: `MAJU ${s.n}` }[s.op]);

export function runRobot(prog) {
  let x = 2, y = 0, d = 0, error = null, put = null;
  const rows = [];
  prog.forEach((s, i) => {
    if (error) return;
    const path = [[x, y]];
    if (s.op === 'maju') {
      for (let k = 0; k < s.n; k++) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
        if (nx < 0 || nx > 2 || ny < 0 || ny > 5) { error = `Baris ${i + 1}: robot menabrak dinding lorong.`; break; }
        x = nx; y = ny; path.push([x, y]);
      }
    } else if (s.op === 'kiri') d = (d + 3) % 4;
    else if (s.op === 'kanan') d = (d + 1) % 4;
    else if (s.op === 'taruh') put = cell(x, y);
    rows.push({ line: i + 1, at: cell(x, y), x, y, d, text: `${cell(x, y)}, ${DIR_TEXT[d]}`, path, put: s.op === 'taruh' ? cell(x, y) : null });
  });
  return { rows, put, error };
}
// First line whose position or direction differs from the expected run.
export const firstDiff = (got, want) => got.rows.findIndex((r, i) => !want.rows[i] || r.text !== want.rows[i].text);

// Case 2: four tables in a row, one bowl each.
export function runBowls(loops, { swap = false } = {}) {
  let carried = 4, at = 0;
  const rows = [], served = [];
  for (let k = 0; k < loops; k++) {
    if (swap) { carried--; served.push(at); at++; } else { at++; carried--; served.push(at); }
    rows.push({ k: k + 1, meja: at, carried });
  }
  const tables = [1, 2, 3, 4];
  return { rows, served, missed: tables.filter((t) => !served.includes(t)), back: carried };
}

// Case 3: the cashier.
const CMP = { '<': (a, b) => a < b, '≥': (a, b) => a >= b, '>': (a, b) => a > b, '=': (a, b) => a === b, '≤': (a, b) => a <= b };
export const pay = (op, money) => (CMP[op](money, 8000) ? 'serahkan soto' : '"Uang kurang"');

// Case 4: 20 portions of fried rice.
export function runPortions(orders, { dec = false, op = '>' } = {}) {
  let sisa = 20, served = 0, sorry = 0;
  for (let k = 0; k < orders; k++) {
    if (CMP[op](sisa, 0)) { served++; if (dec) sisa--; } else sorry++;
  }
  return { served, sorry, sisa };
}

// Question 5: 3 portions or more get Rp2.000 off.
const RULES = { benar: (n) => n >= 3, lebih: (n) => n > 3, terbalik: (n) => n < 3 };
export const caught = (tests, wrong) => tests.some((n) => RULES[wrong](n) !== RULES.benar(n));

// Program boxes with line numbers.
function code(lines) {
  return el('div', { class: 'dtb-kode' }, lines.map((l, i) => el('div', { class: 'dtb-baris', style: { '--d': l.d ?? 0 }, 'data-line': i + 1 },
    el('span', { class: 'dtb-no' }, i + 1), el('span', null, l.t ?? l))));
}
function light(box, line, cls = 'nyala') {
  box.querySelectorAll(`.${cls}`).forEach((n) => n.classList.remove(cls));
  if (line) box.querySelector(`[data-line="${line}"]`)?.classList.add(cls);
}

const L2 = (n, swap) => [`AMBIL 4 mangkuk`, { t: `ULANGI ${n} KALI [` }, ...(swap ? [{ t: 'TARUH 1 mangkuk', d: 1 }, { t: 'MAJU 1', d: 1 }] : [{ t: 'MAJU 1', d: 1 }, { t: 'TARUH 1 mangkuk', d: 1 }]), ']', 'KEMBALI ke kantin'];
const L3 = (op) => ['BACA uang', `JIKA uang ${op} 8.000 MAKA`, { t: 'SERAHKAN soto', d: 1 }, 'JIKA TIDAK', { t: 'TAMPILKAN "Uang kurang"', d: 1 }];
const L4 = (dec, op = '>') => ['ATUR sisa MENJADI 20', 'UNTUK SETIAP pesanan [', { t: `JIKA sisa ${op} 0 MAKA`, d: 1 }, { t: 'SERAHKAN nasi goreng', d: 2 }, ...(dec ? [{ t: 'KURANGI sisa 1', d: 2 }] : []), { t: 'JIKA TIDAK', d: 1 }, { t: 'TAMPILKAN "Maaf, habis"', d: 2 }, ']'];

// Views ---------------------------------------------------------------
function mapView() {
  const cells = {};
  const grid = el('div', { class: 'dtb-peta' });
  for (let y = 5; y >= 0; y--) {
    grid.append(el('b', { class: 'dtb-tepi' }, y + 1));
    for (let x = 0; x < 3; x++) { const c = el('div', { class: 'dtb-sel' }, PLACES[cell(x, y)] ?? ''); cells[cell(x, y)] = c; grid.append(c); }
  }
  grid.append(el('b'), ...[...COLS].map((c) => el('b', { class: 'dtb-tepi' }, c)));
  const bot = el('span', { class: 'dtb-robot' }, '🤖', el('small', null, DIR_ARROW[0]));
  const place = (x, y, d) => { cells[cell(x, y)].append(bot); bot.lastChild.textContent = DIR_ARROW[d]; };
  place(2, 0, 0);
  return {
    node: grid,
    reset() { Object.values(cells).forEach((c) => c.classList.remove('jejak', 'taruh', 'beda')); place(2, 0, 0); },
    step(r, wrong) {
      r.path.forEach(([x, y]) => cells[cell(x, y)].classList.add('jejak'));
      place(r.x, r.y, r.d);
      if (r.put) cells[r.put].classList.add('taruh');
      if (wrong) cells[r.at].classList.add('beda');
    },
  };
}

function traceTable(heads) {
  const body = el('tbody');
  return {
    node: el('div', { class: 'dtb-jejak-tempat' }, el('table', { class: 'dtb-jejak' }, el('thead', null, el('tr', null, heads.map((h) => el('th', null, h)))), body)),
    add(cells, bad) { body.append(el('tr', { class: bad ? 'beda' : '' }, cells.map((c) => el('td', null, c)))); },
    clear() { body.replaceChildren(); },
  };
}

function tablesView() {
  const tables = [1, 2, 3, 4].map((k) => el('div', { class: 'dtb-meja' }, el('b', null, `meja ${k}`), el('span', { class: 'dtb-mangkuk' })));
  const bot = el('div', { class: 'dtb-robot-baris' }, '🤖', el('small', null, '🥣×4'));
  const lane = el('div', { class: 'dtb-lajur' }, el('div', { class: 'dtb-meja kantin' }, el('b', null, 'kantin')), ...tables);
  const node = el('div', { class: 'dtb-kantin' }, lane, bot);
  const move = (k) => { bot.style.setProperty('--k', k); };
  move(0);
  return {
    node,
    reset() { tables.forEach((t) => { t.classList.remove('dapat', 'kosong'); t.lastChild.textContent = ''; }); move(0); bot.lastChild.textContent = '🥣×4'; },
    serve(k, carried, at) { move(at); if (k >= 1 && k <= 4) { tables[k - 1].classList.add('dapat'); tables[k - 1].lastChild.textContent = '🥣'; } bot.lastChild.textContent = `🥣×${carried}`; },
    finish(missed, back) { missed.forEach((k) => tables[k - 1].classList.add('kosong')); move(0); bot.lastChild.textContent = `🥣×${back}`; },
  };
}

// Plays case animations; each returns a stop function.
function playRobot(map, codeBox, trace, prog, { done, speed = 650, compare = true } = {}) {
  const got = runRobot(prog), want = runRobot(ROBOT_FIX);
  const first = firstDiff(got, want);
  map.reset(); trace?.clear();
  let i = 0, t = null;
  const tick = () => {
    if (i >= got.rows.length) { light(codeBox, null); if (compare && first >= 0) light(codeBox, first + 1, 'beda'); done?.(got, first); return; }
    const r = got.rows[i];
    const bad = compare && first >= 0 && i >= first;
    light(codeBox, r.line); map.step(r, bad && i === first);
    trace?.add([r.line, r.text, compare ? want.rows[i]?.text ?? '–' : '', bad ? '✗' : '✓'], bad);
    i++; t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

function playBowls(view, codeBox, trace, loops, { swap, done, speed = 600 } = {}) {
  const r = runBowls(loops, { swap });
  view.reset(); trace?.clear();
  let i = 0, t = null;
  const tick = () => {
    if (i >= r.rows.length) { light(codeBox, 6); view.finish(r.missed, r.back); setTimeout(() => light(codeBox, null), 500); done?.(r); return; }
    const row = r.rows[i++];
    light(codeBox, swap ? 3 : 4); view.serve(swap ? row.meja - 1 : row.meja, row.carried, row.meja);
    trace?.add([row.k, swap ? `${row.meja - 1 || 'kantin'}` : `meja ${row.meja}`, row.carried]);
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

function cashierTable(op, tests, { fixed = '≥' } = {}) {
  const tr = traceTable(['Kasus uji: uang', 'Diharapkan', 'Hasil program', 'Sesuai?']);
  tests.forEach((m) => { const want = pay(fixed, m), got = pay(op, m); tr.add([fmt(m), want, got, want === got ? '✓' : '✗'], want !== got); });
  return tr.node;
}

function portionsView(orders, opts) {
  const r = runPortions(orders, opts), want = runPortions(orders, { dec: true });
  const bar = (n, cls) => el('div', { class: `dtb-batang ${cls}` }, Array.from({ length: n }, () => el('i')));
  return {
    r,
    node: el('div', { class: 'dtb-porsi' },
      el('div', null, el('b', null, `🍛 diserahkan: ${r.served}`), bar(r.served, 'serah')),
      el('div', null, el('b', null, `🙏 "Maaf, habis": ${r.sorry}`), bar(r.sorry, 'maaf')),
      el('div', null, el('b', null, `sisa = ${r.sisa}`)),
      el('small', null, `Diharapkan: ${want.served} diserahkan dan ${want.sorry} kali "Maaf, habis".`)),
  };
}

function rulesTable(tests) {
  const tr = traceTable(['Kasus uji: porsi', 'Diharapkan', 'Bug > ketahuan?', 'Bug terbalik ketahuan?']);
  tests.forEach((n) => tr.add([n, RULES.benar(n) ? 'potongan Rp2.000' : 'tanpa potongan', RULES.lebih(n) !== RULES.benar(n) ? '✓ ya' : '–', RULES.terbalik(n) !== RULES.benar(n) ? '✓ ya' : '–']));
  return tr.node;
}

const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });
const bugOpts = (right) => textOpts(right, BUGS.filter((b) => b !== right));

// Worksheet questions in order.
const PLAN = [
  { kasus: 1, prompt: 'Kasus 1. Di mana robot sesudah baris 3?', opts: textOpts('C6, ke atas', ['C4, ke atas', 'A4, ke kiri', 'C5, ke atas']) },
  { kasus: 1, prompt: 'Nampan ditaruh di mana?', opts: textOpts('perpustakaan (C6)', ['Kelas 5A (A4)', 'kantin (C1)', 'B6']) },
  { kasus: 1, prompt: 'Baris pertama yang berbeda dari harapan?', ...nums([2, 3, 4, 5], 3) },
  { kasus: 1, prompt: 'Jenis bugnya?', opts: bugOpts('urutan tertukar') },
  { kasus: 1, prompt: 'Perbaikannya?', opts: textOpts('Tukar baris 3 dan 4: BELOK KIRI, lalu MAJU 2.', ['Ganti MAJU 2 menjadi MAJU 1.', 'Ganti BELOK KIRI menjadi BELOK KANAN.']), fix: true },
  { kasus: 2, prompt: 'Kasus 2. Meja mana yang tidak kebagian soto?', opts: textOpts('meja 4', ['meja 1', 'meja 3', 'semua kebagian']) },
  { kasus: 2, prompt: 'Berapa mangkuk dibawa kembali ke kantin?', ...nums([0, 1, 2, 3], 1) },
  { kasus: 2, prompt: 'Baris yang salah dan jenis bugnya?', opts: textOpts('baris 2, jumlah ulangan salah', ['baris 4, urutan tertukar', 'baris 6, variabel lupa diubah']) },
  { kasus: 2, prompt: 'Perbaikannya?', opts: textOpts('ULANGI 4 KALI', ['AMBIL 3 mangkuk', 'MAJU 2']), fix: true },
  { kasus: 3, prompt: 'Kasus 3. Uang pas 8.000. Apa hasil program?', opts: textOpts('"Uang kurang"', ['serahkan soto']) },
  { kasus: 3, prompt: 'Baris yang salah dan jenis bugnya?', opts: textOpts('baris 2, syarat terbalik', ['baris 3, urutan tertukar', 'baris 5, jumlah ulangan salah']) },
  { kasus: 3, prompt: 'Perbaikannya?', opts: textOpts('JIKA uang ≥ 8.000 MAKA', ['JIKA uang > 8.000 MAKA', 'JIKA uang = 8.000 MAKA', 'JIKA uang ≤ 8.000 MAKA']), fix: '≥' },
  { kasus: 3, prompt: 'Teman menyarankan JIKA uang > 8.000. Kasus uji mana yang membuktikan saran itu masih salah?', opts: textOpts('8.000', ['10.000', '5.000']), fix: '>', columns: 3 },
  { kasus: 4, orders: 5, prompt: 'Kasus 4a. Uji dengan 5 pesanan. Berapa yang diserahkan? Apakah bug terlihat?', opts: textOpts('5 diserahkan, bug tidak terlihat', ['5 diserahkan, bug terlihat', '20 diserahkan, bug tidak terlihat']) },
  { kasus: 4, orders: 22, prompt: 'b. Uji dengan 22 pesanan. Apa hasil program?', opts: textOpts('22 diserahkan, 0 kali "Maaf, habis"', ['20 diserahkan, 2 kali "Maaf, habis"', '0 diserahkan, 22 kali "Maaf, habis"']) },
  { kasus: 4, orders: 22, prompt: 'c. Isi sisa di akhir program dan jenis bugnya?', opts: textOpts('20, variabel lupa diubah', ['0, variabel lupa diubah', '−2, syarat terbalik']) },
  { kasus: 4, orders: 22, prompt: 'd. Perbaikannya?', opts: textOpts('Tambah KURANGI sisa 1 tepat setelah SERAHKAN nasi goreng.', ['Tambah KURANGI sisa 1 setelah TAMPILKAN "Maaf, habis".', 'Ganti JIKA sisa > 0 menjadi JIKA sisa ≥ 0.']), fix: true },
  { kasus: 5, tests: [2, 3, 4], prompt: 'Soal 5. Aturan: 3 porsi atau lebih dapat potongan. Kasus uji mana yang menemukan bug > sebagai ganti ≥?', opts: textOpts('3 porsi', ['2 porsi', '4 porsi', '10 porsi']) },
  { kasus: 5, tests: [2, 3, 4], prompt: 'Tiga kasus uji mana yang terbaik?', opts: textOpts('2, 3, dan 4 porsi', ['1, 2, dan 10 porsi', '4, 5, dan 6 porsi', '3, 3, dan 3 porsi']) },
];

function round(wrap, ctx, p, next) {
  const holder = el('div', { class: 'dtb-soal' });
  let after;
  if (p.kasus === 1) {
    const box = code((p.fix ? ROBOT_BUG : ROBOT_BUG).map(robotText));
    const map = mapView();
    const tr = traceTable(['Baris', 'Posisi dan arah', 'Harapan', '']);
    holder.append(el('div', { class: 'dtb-kiri' }, el('p', { class: 'dtb-tugas' }, 'Antar nampan dari kantin (C1) ke Kelas 5A (A4).'), box), map.node, tr.node);
    after = () => {
      const prog = p.fix ? ROBOT_FIX : ROBOT_BUG;
      const shown = p.fix ? code(prog.map(robotText)) : box;
      if (p.fix) box.replaceWith(shown);
      playRobot(map, shown, tr, prog, { speed: 450, done: () => setTimeout(next, 1000) });
    };
  } else if (p.kasus === 2) {
    const box = code(L2(3));
    const view = tablesView();
    const tr = traceTable(['Putaran', 'Robot di', 'Mangkuk dibawa']);
    holder.append(box, el('div', { class: 'dtb-kiri' }, view.node, tr.node));
    after = () => {
      const shown = p.fix ? code(L2(4)) : box;
      if (p.fix) box.replaceWith(shown);
      playBowls(view, shown, tr, p.fix ? 4 : 3, { speed: 450, done: () => setTimeout(next, 1000) });
    };
  } else if (p.kasus === 3) {
    const box = code(L3('<'));
    const slot = el('div', { class: 'dtb-kiri' }, cashierTable('<', [10000, 8000, 5000]));
    holder.append(box, slot);
    after = () => {
      if (p.fix) { box.replaceWith(code(L3(p.fix))); slot.replaceChildren(cashierTable(p.fix, [10000, 8000, 5000])); }
      setTimeout(next, 1500);
    };
    holder.querySelectorAll('td:nth-child(3), td:nth-child(4)').forEach((td) => td.classList.add('tutup'));
    const reveal = after;
    after = () => { holder.querySelectorAll('.tutup').forEach((td) => td.classList.remove('tutup')); reveal(); };
  } else if (p.kasus === 4) {
    const box = code(L4(false));
    const slot = el('div', { class: 'dtb-kiri' }, el('p', { class: 'dtb-tugas' }, `Hari ini 20 porsi. Ada ${p.orders} pesanan.`));
    holder.append(box, slot);
    after = () => {
      if (p.fix) box.replaceWith(code(L4(true)));
      slot.append(portionsView(p.orders, { dec: !!p.fix }).node);
      setTimeout(next, 1700);
    };
  } else {
    holder.append(el('p', { class: 'dtb-tugas' }, 'Aturan baru: pembeli 3 porsi atau lebih mendapat potongan Rp2.000.'));
    after = () => { holder.append(rulesTable(p.tests)); setTimeout(next, 1800); };
  }
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.columns ?? (p.opts.some((o) => o.label.length > 26) ? 1 : 2); }
  choice(wrap, { prompt: p.prompt, subject: holder, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-31-detektif-bug',
  title: 'Detektif Bug',
  topic: 'Menelusuri dan memperbaiki bug',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🔍',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menelusuri program dengan tabel jejak, menemukan baris pertama yang berbeda dari harapan, menamai jenis bug, memperbaikinya, dan merancang kasus uji di nilai batas.',
  extraModes: [
    { id: 'jejak', icon: '🔎', label: 'Penjejak Langkah', desc: 'Jalankan keempat kasus baris demi baris dan uji dengan nilai pilihanmu', create: createTracer },
    { id: 'selipkan', icon: '🔁', label: 'Selipkan Bug', desc: 'Satu tim menyelipkan bug, tim lain menemukan baris dan jenisnya', create: createPlant },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act detektif-bug' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const stepper = (ctx, label, value, steps, min, max, onChange, show = String) => {
  let v = value;
  const out = el('b', { class: 'dtb-angka' }, show(v));
  const set = (d) => { v = Math.max(min, Math.min(max, v + d)); out.textContent = show(v); onChange(v); ctx.sound.tap(); };
  return el('div', { class: 'row' }, el('span', { class: 'label' }, label), ...steps.map((d) => button(d > 0 ? `+${show(d)}` : `−${show(-d)}`, () => set(d), 'small')).slice(0, steps.length / 2), out, ...steps.map((d) => button(d > 0 ? `+${show(d)}` : `−${show(-d)}`, () => set(d), 'small')).slice(steps.length / 2));
};

// Step tracer for the four cases, with own test cases for cases 3 and 4.
function createTracer(root, ctx) {
  const wrap = el('div', { class: 'act detektif-bug' });
  root.append(wrap);
  let kasus = 1, fixed = false, stop = null;
  const host = el('div', { class: 'dtb-soal' });
  const info = el('p', { class: 'dtb-info' });
  const tabs = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Kasus'),
    ...[1, 2, 3, 4].map((k) => button(`${k}`, () => { kasus = k; fixed = false; show(); }, 'small')));
  const fixBtn = button('🔧 Perbaiki', () => { fixed = !fixed; show(); }, 'small');
  function show() {
    stop?.(); info.textContent = '';
    fixBtn.textContent = fixed ? '↩ Kembalikan bug' : '🔧 Perbaiki';
    tabs.querySelectorAll('button').forEach((b, i) => b.classList.toggle('aktif', i + 1 === kasus));
    if (kasus === 1) {
      const prog = fixed ? ROBOT_FIX : ROBOT_BUG;
      const box = code(prog.map(robotText));
      const map = mapView();
      const tr = traceTable(['Baris', 'Posisi dan arah', 'Harapan', '']);
      const got = runRobot(prog), want = runRobot(ROBOT_FIX);
      const first = firstDiff(got, want);
      let i = 0;
      const stepBtn = button('Langkah ⏭', () => {
        if (i >= got.rows.length) { map.reset(); tr.clear(); i = 0; light(box, null, 'beda'); }
        const r = got.rows[i];
        const bad = first >= 0 && i >= first;
        light(box, r.line); map.step(r, bad && i === first);
        tr.add([r.line, r.text, want.rows[i]?.text ?? '–', bad ? '✗' : '✓'], bad);
        i++;
        if (i >= got.rows.length) { light(box, null); if (first >= 0) light(box, first + 1, 'beda'); info.textContent = first >= 0 ? `Nampan ditaruh di ${PLACES[got.put] ?? got.put}. Baris pertama yang berbeda: baris ${first + 1}.` : `✅ Nampan sampai di ${PLACES[got.put]}.`; if (first >= 0) ctx.sound.bad(); else ctx.sound.good(); }
      }, 'primary');
      host.replaceChildren(el('div', { class: 'dtb-kiri' }, box, el('div', { class: 'row' }, stepBtn, fixBtn)), map.node, tr.node);
    } else if (kasus === 2) {
      const n = fixed ? 4 : 3;
      const box = code(L2(n));
      const view = tablesView();
      const tr = traceTable(['Putaran', 'Robot di', 'Mangkuk dibawa']);
      const go = button('▶ Jalankan', () => { stop = playBowls(view, box, tr, n, { done: (r) => { info.textContent = r.missed.length ? `Meja ${r.missed.join(', ')} tidak kebagian. ${r.back} mangkuk dibawa kembali.` : '✅ Semua meja kebagian.'; } }); }, 'primary');
      host.replaceChildren(el('div', { class: 'dtb-kiri' }, box, el('div', { class: 'row' }, go, fixBtn)), el('div', { class: 'dtb-kiri' }, view.node, tr.node));
    } else if (kasus === 3) {
      const op = fixed ? '≥' : '<';
      const tests = [];
      let money = 8000;
      const tr = traceTable(['Kasus uji: uang', 'Diharapkan', 'Hasil program', 'Sesuai?']);
      const add = button('+ Uji', () => {
        const want = pay('≥', money), got = pay(op, money);
        if (tests.includes(money)) { shake(add); return; }
        tests.push(money); tr.add([fmt(money), want, got, want === got ? '✓' : '✗ bug ketahuan'], want !== got);
        if (want !== got) ctx.sound.bad(); else ctx.sound.good();
      }, 'primary');
      host.replaceChildren(el('div', { class: 'dtb-kiri' }, code(L3(op)), fixBtn),
        el('div', { class: 'dtb-kiri' }, stepper(ctx, 'uang', money, [-1000, -500, 500, 1000], 0, 20000, (v) => { money = v; }, fmt), add, tr.node));
    } else {
      let orders = 22;
      const slot = el('div', { class: 'dtb-kiri' });
      const go = button('▶ Uji', () => { const v = portionsView(orders, { dec: fixed }); slot.replaceChildren(v.node); const want = runPortions(orders, { dec: true }); info.textContent = v.r.served === want.served ? 'Hasil sesuai harapan untuk kasus uji ini.' : '✗ Bug ketahuan: hasil berbeda dari harapan.'; }, 'primary');
      host.replaceChildren(el('div', { class: 'dtb-kiri' }, code(L4(fixed)), fixBtn),
        el('div', { class: 'dtb-kiri' }, stepper(ctx, 'pesanan', orders, [-5, -1, 1, 5], 1, 40, (v) => { orders = v; }), go, slot));
    }
  }
  show();
  wrap.append(el('p', { class: 'prompt' }, 'Tulis harapan, jalankan baris demi baris, lalu cari baris pertama yang berbeda.'), tabs, host, info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A picks a correct program and slips in one bug; team B
// runs it, then names the line and the kind of bug.
const robotTest = (prog) => () => { const map = mapView(); const box = el('div'); setTimeout(() => playRobot(map, box, null, prog, { compare: false, speed: 400 }), 50); return map.node; };
const bowlTest = (n, swap) => () => { const v = tablesView(); setTimeout(() => playBowls(v, el('div'), null, n, { swap, speed: 400 }), 50); return v.node; };
const POOL = [
  { name: 'Antar ke Kelas 5A', ok: ROBOT_FIX.map(robotText), bugs: [{ type: 'urutan tertukar', line: 3, lines: ROBOT_BUG.map(robotText), run: robotTest(ROBOT_BUG) }] },
  { name: 'Soto untuk 4 meja', ok: L2(4), bugs: [{ type: 'jumlah ulangan salah', line: 2, lines: L2(3), run: bowlTest(3) }, { type: 'urutan tertukar', line: 3, lines: L2(4, true), run: bowlTest(4, true) }] },
  { name: 'Kasir soto', ok: L3('≥'), bugs: [{ type: 'syarat terbalik', line: 2, lines: L3('<'), run: () => cashierTable('<', [10000, 8000, 5000]) }] },
  { name: 'Nasi goreng 20 porsi', ok: L4(true), bugs: [{ type: 'variabel lupa diubah', line: 4, lines: L4(false), run: () => portionsView(22, {}).node }, { type: 'syarat terbalik', line: 3, lines: L4(true, '≤'), run: () => portionsView(22, { dec: true, op: '≤' }).node }] },
];

function createPlant(root, ctx) {
  const wrap = el('div', { class: 'act detektif-bug' });
  root.append(wrap);
  const score = [0, 0];
  let turn = 0;
  function start() {
    const a = turn % 2, b = 1 - a;
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: pilih program lalu selipkan satu bug. Tim ${b + 1} jangan melihat.`);
    const list = el('div', { class: 'dtb-pilihan' }, POOL.flatMap((p) => p.bugs.map((bug) => onTap(el('button', { class: 'dtb-pilih', type: 'button' }, el('b', null, p.name), el('span', null, `bug: ${bug.type}`)), () => { ctx.sound.tap(); hunt(p, bug); }))));
    wrap.replaceChildren(head, list);
    function hunt(p, bug) {
      head.textContent = `Tim ${b + 1}: program "${p.name}" punya satu bug. Ketuk baris bugnya, lalu pilih jenisnya.`;
      let line = null, type = null;
      const box = code(bug.lines);
      box.querySelectorAll('[data-line]').forEach((r) => onTap(r, () => { line = Number(r.dataset.line); light(box, line, 'dipilih'); ctx.sound.tap(); }));
      const kinds = el('div', { class: 'dtb-pilihan baris' }, BUGS.map((k) => onTap(el('button', { class: 'dtb-pilih', type: 'button', 'data-k': k }, k), () => { type = k; kinds.querySelectorAll('button').forEach((x) => x.classList.toggle('aktif', x.dataset.k === k)); ctx.sound.tap(); })));
      const info = el('p', { class: 'dtb-info' });
      const out = el('div', { class: 'dtb-kiri' });
      const test = button('▶ Uji program', () => { out.replaceChildren(bug.run()); ctx.sound.tap(); }, 'small');
      const ok = button('Periksa ✓', () => {
        if (!line || !type) { shake(line ? kinds : box); return; }
        const right = line === bug.line && type === bug.type;
        if (right) { score[b] += 2; ctx.sound.win(); } else { if (line === bug.line || type === bug.type) score[b] += 1; ctx.sound.bad(); }
        light(box, bug.line, 'beda');
        info.textContent = `${right ? '✅ Tepat!' : `Jawaban: baris ${bug.line}, ${bug.type}.`} Program yang benar: ${p.ok.map((l) => l.t ?? l).join(' · ')}. Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
        ok.remove();
        wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'dtb-soal' }, el('div', { class: 'dtb-kiri' }, box, test), out, el('div', { class: 'dtb-kiri' }, kinds, ok)), info);
    }
  }
  start();
  return { destroy() {} };
}
