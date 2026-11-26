// Mudah Dicek, Sulit Dicari — SMA/SMK (16–18 tahun), P dan NP.
// Splitting ten coffee sacks into two equally heavy trucks: checking a
// proposal is quick, searching takes up to 2^n tries. Greedy gets close, a
// 4×4 sudoku and a PIN show the same check-versus-search gap.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const KARUNG = [40, 64, 53, 36, 49, 68, 38, 45, 73, 72];
export const TANPA = [35, 36, 67, 40, 51, 72, 43, 42, 69, 37];
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export function greedySplit(ws) {
  const order = ws.map((w, i) => i).sort((a, b) => ws[b] - ws[a] || a - b);
  let A = 0; let B = 0;
  const steps = order.map((i) => { const toA = A <= B; if (toA) A += ws[i]; else B += ws[i]; return { i, truck: toA ? 'A' : 'B', A, B }; });
  return { steps, A, B };
}
// All fair splits (truck A always holds sack 1) and the smallest difference.
export function search(ws) {
  const n = ws.length; const tot = sum(ws);
  let best = Infinity; const fair = [];
  for (let m = 0; m < 1 << (n - 1); m++) { let a = ws[0]; for (let i = 1; i < n; i++) if (m & (1 << (i - 1))) a += ws[i]; const d = Math.abs(tot - 2 * a); if (d < best) best = d; if (d === 0) fair.push([0, ...Array.from({ length: n - 1 }, (_, i) => i + 1).filter((i) => m & (1 << (i - 1)))]); }
  return { fair, best, tried: 1 << (n - 1) };
}
export const RINA = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 1, 2]];
export function sudokuErrors(g) {
  const bad = new Set();
  const groups = [];
  for (let i = 0; i < 4; i++) { groups.push(g[i].map((_, c) => [i, c])); groups.push(g.map((_, r) => [r, i])); }
  for (const br of [0, 2]) for (const bc of [0, 2]) groups.push([[br, bc], [br, bc + 1], [br + 1, bc], [br + 1, bc + 1]]);
  for (const grp of groups) { const seen = {}; for (const [r, c] of grp) (seen[g[r][c]] ||= []).push([r, c]); for (const cells of Object.values(seen)) if (cells.length > 1) cells.forEach(([r, c]) => bad.add(`${r},${c}`)); }
  return { bad, groups: groups.length };
}
export const fmtSci = (x) => { if (x < 1e6) return fmtNum(x); const e = Math.floor(Math.log10(x)); return `${fmtNum(x / 10 ** e, 2)} × 10${String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}`; };
export function bruteTime(n) { const s = 2 ** n / 1e8; return s < 60 ? `${fmtNum(s, s < 1 ? 4 : 1)} detik` : s < 86400 * 2 ? `${fmtNum(s / 3600, 1)} jam` : s < 3.15e7 * 2 ? `${fmtNum(s / 86400, 0)} hari` : `${fmtSci(s / 3.15e7)} tahun`; }

// Two trucks: tap a sack to move it between A and B.
function trucks(host, ctx, { ws = KARUNG, onFair, onCheck, locked = () => false }) {
  const inA = new Set();
  const seen = new Set();
  const stage = el('div');
  const info = el('p', { class: 'reveal info' });
  const tot = sum(ws);
  const t = { inA, get tries() { return seen.size; }, set(list) { inA.clear(); list.forEach((i) => inA.add(i)); draw(); }, draw };
  const a = () => sum([...inA].map((i) => ws[i]));
  function draw() {
    const A = a(); const B = tot - A;
    const sack = (i) => onTap(el('button', { class: 'mc-karung', type: 'button', 'data-i': i }, el('small', null, `#${i + 1}`), el('b', null, ws[i])), () => { if (locked()) return; if (inA.has(i)) inA.delete(i); else inA.add(i); ctx.sound.tap(); seen.add([...inA].sort((x, y) => x - y).join()); draw(); check(); if (onCheck) onCheck(t.tries); });
    const truck = (name, list, w) => el('div', { class: `mc-truk ${A === B ? 'adil' : ''}` }, el('div', { class: 'mc-truk-kepala' }, `🚚 Truk ${name}`, el('b', null, `${w} kg`)), el('div', { class: 'mc-muatan' }, list.map(sack)));
    stage.replaceChildren(el('div', { class: 'mc-dua' }, truck('A', ws.map((_, i) => i).filter((i) => inA.has(i)), A), truck('B', ws.map((_, i) => i).filter((i) => !inA.has(i)), B)));
    info.textContent = `Selisih ${Math.abs(A - B)} kg · pembagian berbeda yang sudah dicoba: ${seen.size} dari ${2 ** ws.length}`;
  }
  function check() { const A = a(); if (A * 2 === tot && onFair) onFair(seen.size); }
  host.append(stage, info);
  draw();
  return t;
}

// ---------- Permainan: Gudang Kopi ----------
// Sack cards on two truck beds: check proposals against a stopwatch, race to
// find the fair split, predict the balancing robot, dial the universe
// calculator, check a sudoku group by group, and prove that no fair split exists.

const sack = (ws, i, extra = {}) => el('span', { class: 'mc-karung gk11-karung', 'data-i': i, ...extra }, el('small', null, `#${i + 1}`), el('b', null, ws[i]));

// A stopwatch that stops by itself once its node leaves the page.
function stopwatch() {
  const t0 = Date.now();
  const node = el('span', { class: 'gk11-jam' }, '⏱️ 0 detik');
  let stopped = null;
  const id = setInterval(() => { if (!node.isConnected && stopped == null) { clearInterval(id); return; } if (stopped == null) node.textContent = `⏱️ ${Math.floor((Date.now() - t0) / 1000)} detik`; }, 250);
  return { node, secs: () => Math.max(1, Math.round(((stopped ?? Date.now()) - t0) / 1000)), stop() { if (stopped == null) { stopped = Date.now(); clearInterval(id); node.textContent = `⏱️ ${this.secs()} detik`; } } };
}

// Misi 1: proposals laid out on the two trucks; tap Adil or Tidak adil.
function scaleRound(wrap, ctx, { ws, props, done }) {
  let n = 0;
  let wait = false;
  const times = [];
  const stage = el('div', { class: 'gk11-meja' });
  const tools = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' }, 'Jumlahkan berat kedua truk, lalu putuskan.');
  let clock;
  function draw(reveal = false) {
    const p = props[n];
    const A = sum(p.a.map((i) => ws[i]));
    const B = sum(ws) - A;
    const truck = (name, list, w) => el('div', { class: `mc-truk gk11-truk ${reveal ? (A === B ? 'adil' : 'timpang') : ''}` }, el('div', { class: 'mc-truk-kepala' }, `🚚 Truk ${name}`, el('b', null, reveal ? `${w} kg` : '? kg')), el('div', { class: 'mc-muatan' }, list.map((i) => sack(ws, i))));
    fill(stage, el('div', { class: 'gk11-usulan' }, el('b', null, `📋 Usulan ${p.who}`), el('small', null, `${n + 1} dari ${props.length}`), clock.node),
      el('div', { class: 'mc-dua' }, truck('A', p.a, A), truck('B', ws.map((_, i) => i).filter((i) => !p.a.includes(i)), B)));
  }
  function start() {
    clock = stopwatch();
    wait = false;
    draw();
    fill(tools, button('⚖️ Adil', () => judge(true), 'primary'), button('❌ Tidak adil', () => judge(false), 'primary'));
  }
  function judge(fair) {
    if (wait) return;
    const p = props[n];
    const A = sum(p.a.map((i) => ws[i]));
    const B = sum(ws) - A;
    if (fair !== (A === B)) { ctx.mistake(); shake(stage); say(msg, 'bad', fair ? 'Coba jumlahkan lagi: beratnya belum sama.' : 'Coba jumlahkan lagi: beratnya sama.'); return; }
    wait = true;
    clock.stop();
    times.push(clock.secs());
    ctx.sound.good();
    draw(true);
    fill(tools);
    n++;
    if (n < props.length) { say(msg, '', `${A} dan ${B} kg: ${A === B ? 'adil' : 'tidak adil'}. Diperiksa dalam ${clock.secs()} detik.`); setTimeout(() => { if (stage.isConnected) { say(msg, 'info', 'Jumlahkan berat kedua truk, lalu putuskan.'); start(); } }, 2600); return; }
    say(msg, '', `${A} dan ${B} kg: ${A === B ? 'adil' : 'tidak adil'}. Setiap usulan diperiksa dalam beberapa detik: ${ws.length} penjumlahan saja.`);
    done();
  }
  wrap.append(stage, tools, msg);
  start();
}

// Misi 2: move sacks between trucks until both weigh the same; tries and time are shown.
function raceRound(wrap, ctx, { ws, done }) {
  const clock = stopwatch();
  const msg = el('p', { class: 'reveal hint' }, 'Ketuk karung untuk memindahkannya ke truk lain.');
  let fin = false;
  wrap.append(el('div', { class: 'gk11-usulan' }, el('b', null, `🏁 Lomba Cari · ${ws.length} karung, ${sum(ws)} kg`), clock.node));
  trucks(wrap, ctx, { ws, locked: () => fin, onFair(tries) { fin = true; clock.stop(); ctx.sound.good(); say(msg, '', `Adil: ${sum(ws) / 2} dan ${sum(ws) / 2} kg setelah ${tries} percobaan, ${clock.secs()} detik. Memeriksa cepat, mencari lama.`); done(); } });
  wrap.append(msg);
}

// Misi 3: the balancing robot. Tap the truck that gets the next (heaviest) sack.
function robotRound11(wrap, ctx, { ws, done }) {
  const g = greedySplit(ws);
  let k = 0;
  const stage = el('div', { class: 'gk11-meja' });
  const msg = el('p', { class: 'reveal info' }, 'Robot mengambil karung terberat dan menaruhnya di truk yang lebih ringan (sama berat: truk A). Ketuk truk tujuannya.');
  function draw() {
    const A = k ? g.steps[k - 1].A : 0;
    const B = k ? g.steps[k - 1].B : 0;
    const box = (name, w) => onTap(el('button', { class: `mc-truk gk11-truk gk11-tujuan ${k === g.steps.length && A === B ? 'adil' : ''}`, type: 'button', 'data-truk': name },
      el('div', { class: 'mc-truk-kepala' }, `🚚 Truk ${name}`, el('b', null, `${w} kg`)),
      el('div', { class: 'mc-muatan' }, g.steps.slice(0, k).filter((s) => s.truck === name).map((s) => sack(ws, s.i)))), () => put(name));
    const s = g.steps[k];
    fill(stage, el('div', { class: 'gk11-antre' }, el('span', { class: 'gk11-robot' }, '🤖'), s ? sack(ws, s.i, { class: 'mc-karung gk11-karung kini' }) : el('b', null, 'Selesai'),
      el('small', null, g.steps.slice(k + 1).map((t) => ws[t.i]).join(' · '))),
    el('div', { class: 'mc-dua' }, box('A', A), box('B', B)));
  }
  function put(name) {
    if (k >= g.steps.length) return;
    const s = g.steps[k];
    if (s.truck !== name) {
      const A = k ? g.steps[k - 1].A : 0; const B = k ? g.steps[k - 1].B : 0;
      ctx.mistake(); shake(stage);
      say(msg, 'bad', A === B ? 'Sama berat: robot memilih truk A.' : `Truk ${A < B ? 'A' : 'B'} lebih ringan (${Math.min(A, B)} kg).`);
      return;
    }
    k++;
    ctx.sound.tap();
    draw();
    if (k < g.steps.length) { say(msg, 'info', `Karung ${ws[s.i]} kg ke truk ${name}.`); return; }
    say(msg, '', `Truk A ${g.A} kg, truk B ${g.B} kg: ${g.A === g.B ? 'adil' : `selisih ${Math.abs(g.A - g.B)} kg, padahal pembagian adil ada`}. Robot cepat, tetapi tidak menjamin adil.`);
    done();
  }
  wrap.append(stage, msg);
  draw();
}

// Misi 4: the universe calculator. Set the number of sacks, then pick the time.
const UMUR_SEMESTA = 1.38e10;
const CALC11 = [
  { n: 50, opts: [['sekitar 3 jam', false], ['sekitar 130 hari', true], ['sekitar 36 tahun', false]], a: '2⁵⁰ : 10⁸ ≈ 1,13 × 10⁷ detik ≈ 130 hari.' },
  { n: 100, opts: [['sekitar 260 hari', false], ['sekitar 4.000 tahun', false], ['sekitar 4 × 10¹⁴ tahun', true]], a: '2¹⁰⁰ : 10⁸ ≈ 1,27 × 10²² detik ≈ 4 × 10¹⁴ tahun, sekitar 29.000 kali umur alam semesta.' },
];
function calcRound(wrap, ctx, { done }) {
  let c = 0;
  let n = 10;
  let wait = false;
  let order = ctx.rand.shuffle(CALC11[0].opts);
  const card = el('div');
  const view = el('div', { class: 'gk11-mesin' });
  const dial = el('div', { class: 'kode-baris' });
  const opts = el('div', { class: 'kode-baris gk11-opsi' });
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const q = CALC11[c];
    fill(card, el('div', { class: 'pp8-kejadian' }, el('small', null, `🌌 Pesanan ${c + 1} dari ${CALC11.length}`), el('b', null, `Gudang dengan ${q.n} karung. Komputer memeriksa 10⁸ pembagian per detik.`), el('span', null, 'Berapa lama mencoba semua pembagian?')));
    fill(view, el('span', null, '📦 ', el('b', null, n), ' karung'), el('span', null, '🔢 2', el('sup', null, n), ' = ', el('b', null, fmtSci(2 ** n)), ' pembagian'), el('span', null, '✅ memeriksa satu: ', el('b', null, `${n} penjumlahan`)));
    fill(opts, order.map(([l, ok]) => button(l, (ev) => pick(ok, ev?.currentTarget), n === q.n ? 'primary' : '')));
  }
  const step = (d) => { if (wait) return; n = Math.max(1, Math.min(120, n + d)); ctx.sound.tap(); draw(); };
  function pick(ok, node) {
    if (wait) return;
    const q = CALC11[c];
    if (n !== q.n) { ctx.sound.bad(); say(msg, 'bad', `Atur dulu: ${q.n} karung.`); return; }
    if (!ok) { ctx.mistake(); shake(node || opts); say(msg, 'bad', `2^${q.n} : 10⁸ detik. Hitung lagi.`); return; }
    ctx.sound.good();
    say(msg, '', q.a);
    c++;
    wait = true;
    if (c === CALC11.length) { done(); return; }
    setTimeout(() => { if (!card.isConnected) return; wait = false; order = ctx.rand.shuffle(CALC11[c].opts); draw(); say(msg, 'info', 'Atur banyak karung, lalu pilih perkiraan waktunya.'); }, 3200);
  }
  fill(dial, button('−10', () => step(-10)), button('−1', () => step(-1)), button('+1', () => step(1)), button('+10', () => step(10)));
  wrap.append(card, view, dial, opts, msg);
  say(msg, 'info', 'Atur banyak karung, lalu pilih perkiraan waktunya.');
  draw();
}

// Misi 5: check a 4 × 4 sudoku. Tap the groups (row, column, box) that are wrong.
function groupsOf() {
  const g = [];
  for (let i = 0; i < 4; i++) g.push({ id: `b${i}`, label: `Baris ${i + 1}`, cells: [0, 1, 2, 3].map((c) => [i, c]) });
  for (let i = 0; i < 4; i++) g.push({ id: `k${i}`, label: `Kolom ${i + 1}`, cells: [0, 1, 2, 3].map((r) => [r, i]) });
  ['kiri atas', 'kanan atas', 'kiri bawah', 'kanan bawah'].forEach((nm, j) => { const r0 = j < 2 ? 0 : 2; const c0 = j % 2 ? 2 : 0; g.push({ id: `t${j}`, label: `Kotak ${nm}`, cells: [[r0, c0], [r0, c0 + 1], [r0 + 1, c0], [r0 + 1, c0 + 1]] }); });
  return g;
}
function sudokuRound11(wrap, ctx, { grid: G, who, done }) {
  const groups = groupsOf();
  const wrong = (gr) => new Set(gr.cells.map(([r, c]) => G[r][c])).size < 4;
  const bad = groups.filter(wrong).map((g) => g.id);
  const found = new Set();
  let sel = null;
  let fin = false;
  const board = el('div', { class: 'gk11-sudoku' });
  const tabs = el('div', { class: 'gk11-kotak-tab' });
  const msg = el('p', { class: 'reveal info' }, `Periksa 4 baris, 4 kolom, dan 4 kotak. Ketuk kelompok yang salah.`);
  const tab = (g) => onTap(el('button', { class: `gk11-tab ${found.has(g.id) ? 'salah' : ''} ${sel === g.id ? 'pilih' : ''}`, type: 'button', 'data-g': g.id }, found.has(g.id) ? `✗ ${g.label}` : g.label), (ev) => tapGroup(g, ev.currentTarget));
  function draw() {
    const hi = new Set((groups.find((g) => g.id === sel)?.cells || []).map(([r, c]) => `${r},${c}`));
    const red = new Set(groups.filter((g) => found.has(g.id)).flatMap((g) => g.cells.map(([r, c]) => `${r},${c}`)));
    fill(board, el('span'), [0, 1, 2, 3].map((c) => tab(groups[4 + c])), [0, 1, 2, 3].flatMap((r) => [tab(groups[r]),
      ...[0, 1, 2, 3].map((c) => el('span', { class: `gk11-sel ${c === 1 ? 'kanan' : ''} ${r === 1 ? 'bawah' : ''} ${hi.has(`${r},${c}`) ? 'sorot' : ''} ${red.has(`${r},${c}`) ? 'merah' : ''}` }, G[r][c]))]));
    fill(tabs, groups.slice(8).map(tab));
  }
  function tapGroup(g, node) {
    if (fin || found.has(g.id)) return;
    sel = g.id;
    if (!bad.includes(g.id)) { ctx.mistake(); draw(); shake(node); say(msg, 'bad', `${g.label} berisi ${g.cells.map(([r, c]) => G[r][c]).join(', ')}: lengkap 1 sampai 4.`); return; }
    found.add(g.id);
    ctx.sound.tap();
    draw();
    const vals = g.cells.map(([r, c]) => G[r][c]);
    const dup = vals.find((v, i) => vals.indexOf(v) !== i);
    if (found.size < bad.length) { say(msg, 'bad', `${g.label} (${vals.join(', ')}): angka ${dup} muncul dua kali.`); return; }
    fin = true;
    const names = bad.map((id) => groups.find((x) => x.id === id).label.toLowerCase());
    say(msg, '', `Sudoku ${who} salah di ${names.slice(0, -1).join(', ')} dan ${names[names.length - 1]}. Cukup 12 kelompok diperiksa.`);
    done();
  }
  wrap.append(board, tabs, msg);
  draw();
}

// A valid 4 × 4 sudoku from a random relabelling, then two cells in one row swapped.
function randomSudoku(rand) {
  const base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
  const p = rand.shuffle([1, 2, 3, 4]);
  const g = base.map((row) => row.map((v) => p[v - 1]));
  const r = rand.int(0, 3);
  const [c1, c2] = rand.pick([[0, 2], [1, 3], [0, 3], [1, 2]]);
  [g[r][c1], g[r][c2]] = [g[r][c2], g[r][c1]];
  return g;
}

// Web variation: 8–10 sacks of 30–80 kg with exactly one fair split.
function randomSacks(rand) {
  for (let t = 0; t < 2000; t++) {
    const n = rand.int(8, 10);
    const ws = Array.from({ length: n }, () => rand.int(30, 80));
    if (sum(ws) % 2) continue;
    const s = search(ws);
    if (s.fair.length !== 1) continue;
    const g = greedySplit(ws);
    if (g.A === g.B) continue;
    return { ws, fair: s.fair[0] };
  }
  return { ws: KARUNG, fair: search(KARUNG).fair[0] };
}
// Three proposals for the random sacks: the fair one and two near misses.
function proposals(ws, fair, rand) {
  const others = ws.map((_, i) => i).filter((i) => !fair.includes(i));
  const pairs = fair.flatMap((a) => others.map((b) => [a, b])).filter(([a, b]) => ws[a] !== ws[b]).sort((x, y) => Math.abs(ws[x[0]] - ws[x[1]]) - Math.abs(ws[y[0]] - ws[y[1]]));
  const swap = ([a, b]) => fair.filter((i) => i !== a).concat(b).sort((x, y) => x - y);
  const list = [{ who: 'Bima', a: swap(pairs[0]) }, { who: 'Citra', a: [...fair] }, { who: 'Fajar', a: swap(pairs[Math.min(pairs.length - 1, 1)]) }];
  return rand.shuffle(list);
}

// Misi Bos: prove that the sacks cannot be split fairly.
function proofRound(wrap, ctx, { done }) {
  const ws = TANPA;
  const s = search(ws);
  let fin = false;
  let t;
  let best = Infinity;
  const msg = el('p', { class: 'reveal hint' }, `Total ${sum(ws)} kg. Ketua yakin tidak ada pembagian adil. Cari pembagian paling dekat, lalu nyatakan.`);
  const machine = el('div', { class: 'gk11-mesin' }, el('span', null, '💻 Komputer siap memeriksa semua pembagian.'));
  wrap.append(el('div', { class: 'gk11-usulan' }, el('b', null, '🔍 Tantangan Ketua'), el('small', null, 'Selisih terkecil yang kamu temukan: '), el('b', { class: 'gk11-terbaik' }, '–')));
  t = trucks(wrap, ctx, { ws, locked: () => fin, onCheck() { const A = sum([...t.inA].map((i) => ws[i])); const d = Math.abs(sum(ws) - 2 * A); if (d < best) { best = d; wrap.querySelector('.gk11-terbaik').textContent = `${d} kg`; } } });
  wrap.append(machine, el('div', { class: 'kode-baris' }, button('🚫 Nyatakan: tidak ada yang adil', () => {
    if (fin) return;
    fin = true;
    let k = 0;
    const id = setInterval(() => {
      k = Math.min(s.tried, k + 23);
      fill(machine, el('span', null, '💻 Memeriksa ', el('b', null, `${k} / ${s.tried}`), ' pembagian'), el('span', null, 'adil: ', el('b', null, '0')));
      if (!machine.isConnected) { clearInterval(id); return; }
      if (k < s.tried) return;
      clearInterval(id);
      fill(machine, el('span', null, '💻 Semua ', el('b', null, s.tried), ' pembagian gagal'), el('span', null, 'selisih terkecil ', el('b', null, `${s.best} kg`)));
      if (best > s.best) { fin = false; ctx.mistake(); say(msg, 'bad', `Benar, tidak ada. Tetapi kamu belum menemukan yang paling dekat (${s.best} kg). Cari dulu, lalu nyatakan lagi.`); return; }
      ctx.sound.good();
      say(msg, '', `Selisih ${s.best} kg sudah paling dekat. Membuktikan "ada" cukup satu contoh; membuktikan "tidak ada" butuh memeriksa semua ${s.tried} pembagian.`);
      done();
    }, 40);
  }, 'primary')), msg);
}

const HEAD11 = {
  timbang: ['Meja Timbang', 'Periksa setiap usulan pembagian karung secepatnya. Jam mencatat waktumu.'],
  cari: ['Lomba Cari', 'Pindahkan karung sampai kedua truk sama berat. Penghitung mencatat percobaanmu.'],
  robot: ['Robot Penyeimbang', 'Tebak truk tujuan setiap karung sebelum robot bergerak.'],
  semesta: ['Kalkulator Alam Semesta', 'Mencoba semua pembagian: berapa lama untuk gudang yang besar?'],
  sudoku: ['Periksa Sudoku', 'Memeriksa jawaban sudoku itu cepat. Temukan kelompok yang salah.'],
  boss: ['Buktikan Tidak Ada', 'Ketua yakin karung ini tidak bisa dibagi adil. Buktikan.'],
};

export default {
  id: 'sma-11-mudah-dicek',
  title: 'Mudah Dicek, Sulit Dicari',
  topic: 'P dan NP: memeriksa jawaban lawan mencari jawaban',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🚚',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid memeriksa usulan pembagian karung ke dua truk, mencari pembagian yang adil, menghitung 2ⁿ kemungkinan dan waktunya, mencoba cara rakus, dan membandingkan memeriksa dengan mencari pada sudoku dan PIN sebagai pengantar P dan NP.',
  extraModes: [
    { id: 'truk', icon: '🚚', label: 'Dua Truk', desc: 'Pindahkan karung antartruk dengan pemeriksaan seketika dan penghitung percobaan; tombol cara rakus, pencarian komputer, dan kalkulator 2ⁿ', create: createTrucks },
    { id: 'giliran', icon: '🔁', label: 'Teka-teki Rahasia', desc: 'Satu tim diam-diam membagi karung; layar menambah karung penyeimbang. Tim berikutnya mencari pembagian adil dengan percobaan terbatas', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mudah-dicek gk11-main' });
    root.append(wrap);
    const R = randomSacks(ctx.rand);
    const props = proposals(R.ws, R.fair, ctx.rand);
    const cadangan = ctx.rand.shuffle([31, 47, 52, 58, 63, 66, 70, 77]);
    const sd = randomSudoku(ctx.rand);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD11[key], '☕'));
      if (r === 0) { head('timbang', 1); scaleRound(wrap, ctx, { ws: KARUNG, props: [{ who: 'Dimas', a: [0, 1, 2, 6, 8] }, { who: 'Sari', a: [1, 3, 4, 7, 9] }], done: () => next() }); }
      else if (r === 1) { head('cari', 2); raceRound(wrap, ctx, { ws: KARUNG, done: () => next() }); }
      else if (r === 2) { head('robot', 3); robotRound11(wrap, ctx, { ws: KARUNG, done: () => next(5200) }); }
      else if (r === 3) { head('semesta', 4); calcRound(wrap, ctx, { done: () => next(5200) }); }
      else if (r === 4) { head('sudoku', 5); sudokuRound11(wrap, ctx, { grid: RINA, who: 'Rina', done: () => next() }); }
      else if (r === 5) { head('timbang', 1); scaleRound(wrap, ctx, { ws: R.ws, props, done: () => next() }); }
      else if (r === 6) { head('cari', 2); raceRound(wrap, ctx, { ws: R.ws, done: () => next() }); }
      else if (r === 7) { head('robot', 3); robotRound11(wrap, ctx, { ws: cadangan, done: () => next(5200) }); }
      else if (r === 8) { head('sudoku', 5); sudokuRound11(wrap, ctx, { grid: sd, who: 'Joko', done: () => next() }); }
      else { head('boss', 'Bos'); proofRound(wrap, ctx, { done: () => next(5600) }); }
    }
    render();
  },
};

function createTrucks(root, ctx) {
  const wrap = el('div', { class: 'act mudah-dicek' });
  root.append(wrap);
  let ws = KARUNG;
  const host = el('div');
  const out = el('p', { class: 'reveal hint' });
  let t;
  let n = 30;
  const calc = el('div', { class: 'kode-baris mc-kalk' });
  function drawCalc() { calc.replaceChildren(el('span', null, `n = ${n} karung: 2ⁿ = ${fmtSci(2 ** n)} pembagian · ${bruteTime(n)} pada 10⁸ per detik · memeriksa: ${n} penjumlahan`), onTap(el('button', { class: 'seg-btn', type: 'button' }, '−10'), () => { n = Math.max(10, n - 10); drawCalc(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '+10'), () => { n = Math.min(200, n + 10); drawCalc(); })); }
  function reset() { host.replaceChildren(); t = trucks(host, ctx, { ws, onFair: () => { ctx.sound.win(); out.textContent = 'Adil!'; } }); out.textContent = `Total ${sum(ws)} kg.`; }
  const random = () => { const k = ctx.rand.int(10, 12); for (;;) { const w = Array.from({ length: k }, () => ctx.rand.int(30, 80)); if (sum(w) % 2 === 0 && search(w).fair.length) return w; } };
  wrap.append(el('p', { class: 'prompt' }, 'Dua truk kopi'),
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Karung lembar kerja'), () => { ws = KARUNG; reset(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Karung tantangan'), () => { ws = TANPA; reset(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Karung acak'), () => { ws = random(); reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Cara rakus'), () => { const g = greedySplit(ws); t.set(g.steps.filter((s) => s.truck === 'A').map((s) => s.i)); out.textContent = `Cara rakus: A ${g.A} kg, B ${g.B} kg.`; }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '💻 Cari semua'), () => { const s = search(ws); if (s.fair.length) t.set(s.fair[0]); out.textContent = `Komputer mencoba ${s.tried} pembagian: ${s.fair.length ? `${s.fair.length} pembagian adil` : `tidak ada yang adil, selisih terkecil ${s.best} kg`}.`; })),
    host, out, calc);
  reset();
  drawCalc();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act mudah-dicek' });
  root.append(wrap);
  const LIMIT = 25;
  function start(n) {
    const pts = Array(n).fill(0);
    let turn = 0;
    function make() {
      if (turn >= n * 2) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Teka-teki Rahasia', start) });
      const maker = turn % n; const solver = (maker + 1) % n;
      const base = Array.from({ length: 7 }, () => ctx.rand.int(20, 70));
      const msg = el('p', { class: 'reveal hint' }, `Tim ${maker + 1}: pilih karung untuk truk A secara rahasia (Tim ${solver + 1} jangan melihat), lalu ketuk Kunci. Makin mirip berat kedua truk, makin kecil karung penyeimbangnya dan makin sulit teka-tekinya.`);
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Tim ${maker + 1} membuat teka-teki`));
      const t = trucks(wrap, ctx, { ws: base });
      wrap.append(el('div', { class: 'kode-baris' }, button('Kunci', () => {
        const A = sum([...t.inA].map((i) => base[i])); const B = sum(base) - A;
        if (!t.inA.size || t.inA.size === base.length) { say(msg, 'bad', 'Setiap truk perlu sedikitnya satu karung.'); return; }
        const ws = ctx.rand.shuffle([...base, Math.max(1, Math.abs(A - B))].map((w, i) => [w, i])).map((x) => x[0]);
        if (A === B) ws.splice(ws.indexOf(1), 1);
        solve(ws, maker, solver);
      }, 'primary')), msg);
    }
    function solve(ws, maker, solver) {
      const msg = el('p', { class: 'reveal hint' }, `Layar menambah karung penyeimbang, lalu mengacak urutannya. Tim ${solver + 1}: temukan pembagian adil dalam ${LIMIT} percobaan.`);
      let fin = false;
      wrap.replaceChildren(scoreBar(pts, solver), el('p', { class: 'prompt' }, `Tim ${solver + 1} mencari pembagian adil`));
      const lose = (text) => { fin = true; pts[maker]++; ctx.sound.bad(); say(msg, 'bad', text); turn++; setTimeout(make, 2200); };
      trucks(wrap, ctx, {
        ws,
        locked: () => fin,
        onCheck(tries) { if (!fin && tries >= LIMIT) lose(`${LIMIT} percobaan habis. Poin untuk Tim ${maker + 1}.`); },
        onFair() { fin = true; pts[solver]++; ctx.sound.good(); say(msg, '', `Ditemukan! Poin untuk Tim ${solver + 1}.`); turn++; setTimeout(make, 2600); },
      });
      wrap.append(el('div', { class: 'kode-baris' }, button('Menyerah', () => { if (!fin) lose(`Poin untuk Tim ${maker + 1}.`); })), msg);
    }
    make();
  }
  pickTeams(wrap, 'Teka-teki Rahasia', start);
}
