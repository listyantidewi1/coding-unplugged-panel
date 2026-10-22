// Rekursi dan Memo — SMA/SMK (16–18 tahun), coding. Recursive Python
// functions: factorial (and the RecursionError of faktorial(-1)), digit sum,
// the library stairs cara(n) with its call tree and repeated calls, memoisation
// with a dict (and Dodi's local memo), and a turtle drawing a fractal tree.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy, pyRepr, PyDict } from './mini-py.js';

export const FAK = ['def faktorial(n):', '    if n == 0:', '        return 1', '    return n * faktorial(n - 1)'];
export const DIGIT = ['def jumlah_digit(n):', '    if n < 10:', '        return n', '    return n % 10 + jumlah_digit(n // 10)'];
export const CARA = ['def cara(n):', '    if n <= 2:', '        return n', '    return cara(n - 1) + cara(n - 2)'];
export const MEMO = (lokal = false) => [...(lokal ? [] : ['memo = {}']), 'def cara_memo(n):', ...(lokal ? ['    memo = {}'] : []), '    if n in memo:', '        return memo[n]', '    if n <= 2:', '        hasil = n', '    else:', '        hasil = cara_memo(n - 1) + cara_memo(n - 2)', '    memo[n] = hasil', '    return hasil'];
export const POHON = (no32 = false) => ['def pohon(t, panjang, kedalaman):', '    if kedalaman == 0:', '        return', '    t.forward(panjang)', '    t.left(30)', '    pohon(t, panjang / 2, kedalaman - 1)', '    t.right(60)', '    pohon(t, panjang / 2, kedalaman - 1)', '    t.left(30)', ...(no32 ? [] : ['    t.backward(panjang)'])];
const lab = (a, n) => Array.from({ length: n }, (_, i) => String(a + i));
export const FN = { fak: ['faktorial', FAK, lab(1, 4)], digit: ['jumlah_digit', DIGIT, lab(5, 4)], cara: ['cara', CARA, lab(9, 4)], memo: ['cara_memo', MEMO(), lab(13, 10)] };
export const run = (lines, o = {}) => runPy(lines, { limit: 200000, ...o });

// Call tree with call/return events in execution order.
export function build(fn, n, { lokal = false } = {}) {
  let id = 0; const events = []; const memo = new PyDict();
  function call(arg) {
    const node = { id: id++, arg, kids: [], ret: null, memo: false, op: '' }; events.push({ t: 'call', node });
    if (fn === 'fak') { if (arg === 0) node.ret = 1; else { const k = call(arg - 1); node.kids.push(k); node.ret = arg * k.ret; node.op = `${arg} × ${k.ret}`; } }
    else if (fn === 'digit') { if (arg < 10) node.ret = arg; else { const k = call(Math.floor(arg / 10)); node.kids.push(k); node.ret = (arg % 10) + k.ret; node.op = `${arg % 10} + ${k.ret}`; } }
    else if (fn === 'cara') { if (arg <= 2) node.ret = arg; else { const a = call(arg - 1); const b = call(arg - 2); node.kids.push(a, b); node.ret = a.ret + b.ret; node.op = `${a.ret} + ${b.ret}`; } }
    else if (!lokal && memo.has(arg)) { node.memo = true; node.ret = memo.get(arg); }
    else { if (arg <= 2) node.ret = arg; else { const a = call(arg - 1); const b = call(arg - 2); node.kids.push(a, b); node.ret = a.ret + b.ret; node.op = `${a.ret} + ${b.ret}`; } if (!lokal) memo.set(arg, node.ret); }
    events.push({ t: 'ret', node, memo: new PyDict(memo) });
    return node;
  }
  const root = call(n);
  return { root, events, count: id, memo };
}
// Call counts without building the tree (cara grows too fast to draw).
export function calls(fn, n, { lokal = false } = {}) {
  if (fn === 'cara' || (fn === 'memo' && lokal)) { if (n <= 2) return 1; let a = 1; let b = 1; for (let k = 3; k <= n; k++) [a, b] = [b, 1 + a + b]; return b; }
  if (fn === 'memo') return n <= 2 ? 1 : 2 * n - 3;
  if (fn === 'fak') return n + 1;
  return String(n).length;
}
export const caraVal = (n) => { if (n <= 2) return n; let a = 1; let b = 2; for (let k = 3; k <= n; k++) [a, b] = [b, a + b]; return b; };
export const argCount = (tree) => { const c = {}; for (const e of tree.events) if (e.t === 'call') c[e.node.arg] = (c[e.node.arg] || 0) + 1; return c; };
// All ways up n steps with steps of 1 or 2.
export function ways(n) { if (n === 0) return [[]]; const out = []; for (const s of [1, 2]) if (s <= n) for (const w of ways(n - s)) out.push([s, ...w]); return out; }

// Turtle: pohon(t, panjang, kedalaman) as moves; heading in degrees, 90 = up.
export function turtle(panjang, kedalaman, { no32 = false } = {}) {
  let x = 0; let y = 0; let h = 90; let nCalls = 0; const moves = [];
  const go = (d, back) => { const r = (h * Math.PI) / 180; const nx = x + (back ? -d : d) * Math.cos(r); const ny = y + (back ? -d : d) * Math.sin(r); moves.push({ back, x1: x, y1: y, x2: nx, y2: ny, d }); x = nx; y = ny; };
  function pohon(p, k) { nCalls++; if (k === 0) return; go(p, false); h += 30; pohon(p / 2, k - 1); h -= 60; pohon(p / 2, k - 1); h += 30; if (!no32) go(p, true); }
  pohon(panjang, kedalaman);
  const lines = moves.filter((m) => !m.back);
  return { moves, lines: lines.length, total: lines.reduce((s, m) => s + m.d, 0), calls: nCalls, end: { x: Math.round(x * 1000) / 1000 || 0, y: Math.round(y * 1000) / 1000 || 0, h: ((h % 360) + 360) % 360 } };
}
export function turtleView(T, step = T.moves.length, { cls = '' } = {}) {
  const pts = T.moves.flatMap((m) => [[m.x1, m.y1], [m.x2, m.y2]]).concat([[0, 0]]);
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]); const pad = 1;
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  const NS = 'http://www.w3.org/2000/svg'; const s = (tag, a) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v)); return e; };
  const W = x1 - x0; const H = y1 - y0; const svg = s('svg', { viewBox: `${x0} ${-y1} ${W} ${H}`, class: `rk-kertas ${cls}`, role: 'img', 'aria-label': 'Gambar kura-kura' });
  const grid = s('g', { class: 'rk-titik' }); for (let gx = Math.ceil(x0); gx <= x1; gx++) for (let gy = Math.ceil(y0); gy <= y1; gy++) grid.append(s('circle', { cx: gx, cy: -gy, r: Math.max(W, H) / 160 }));
  svg.append(grid);
  const sw = Math.max(W, H) / 110;
  T.moves.slice(0, step).forEach((m, i) => { if (!m.back) svg.append(s('line', { x1: m.x1, y1: -m.y1, x2: m.x2, y2: -m.y2, class: `rk-garis ${i === step - 1 ? 'baru' : ''}`, 'stroke-width': sw })); });
  const cur = step ? T.moves[step - 1] : null; const px = cur ? cur.x2 : 0; const py = cur ? cur.y2 : 0;
  svg.append(s('circle', { cx: px, cy: -py, r: sw * 2.2, class: 'rk-kura' }));
  return svg;
}

// ---- tree view ----
const hue = (a) => (a * 47) % 360;
function treeView(tree, shown = Infinity, { memoBadge = true, name = '' } = {}) {
  const full = tree.count <= 15;
  const state = {}; tree.events.slice(0, shown).forEach((e) => { state[e.node.id] = e.t; });
  const node = (nd) => el('div', { class: `rk-simpul ${state[nd.id] ? '' : 'sembunyi'}` }, el('div', { class: `rk-kotak ${nd.memo ? 'memo' : ''} ${state[nd.id] ? '' : 'sembunyi'} ${state[nd.id] === 'call' ? 'tunggu' : ''}`, style: { '--h': hue(nd.arg) } }, el('b', null, full || nd.id === 0 ? `${name}(${nd.arg})` : String(nd.arg)), state[nd.id] === 'ret' ? el('small', null, `→ ${nd.ret}`) : el('small', null, '…'), nd.memo && memoBadge ? el('i', null, 'dari memo') : null),
    nd.kids.length ? el('div', { class: `rk-anak ${nd.kids.every((c) => state[c.id]) ? '' : 'sebagian'}` }, nd.kids.map(node)) : null);
  return el('div', { class: 'rk-pohon' }, node(tree.root));
}
// Step player for a call tree: buttons, counter, optional memo panel.
export function treePlayer(fn, n, { lokal = false, onEnd = null, speed = 350 } = {}) {
  const tree = build(fn, n, { lokal }); let k = 0; let timer = null;
  const host = el('div', { class: 'rk-pemain' });
  const draw = () => {
    const made = tree.events.slice(0, k).filter((e) => e.t === 'call').length; const lastRet = [...tree.events.slice(0, k)].reverse().find((e) => e.t === 'ret');
    host.replaceChildren(
      el('div', { class: 'sk-tombol' }, button('▶ Langkah', () => go(1), 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', toggle), button('⏭ Sampai selesai', () => { stop(); go(1e6); }), button('↺ Ulang', () => { stop(); k = 0; draw(); })),
      el('p', { class: 'rk-hitung' }, `${FN[fn][0]}(${n}) · pemanggilan: ${made}`, k >= tree.events.length ? el('b', null, ` · hasil ${tree.root.ret}`) : null),
      el('div', { class: 'rk-pohon-wadah' }, treeView(tree, k, { name: FN[fn][0] })),
      ...(fn === 'memo' ? [el('p', { class: 'rk-memo' }, el('small', null, lokal ? 'memo (lokal, dibuat baru setiap pemanggilan)' : 'memo'), el('code', null, lokal ? '{}' : pyRepr(lastRet ? lastRet.memo : new PyDict())))] : []),
      k >= tree.events.length ? el('p', { class: 'sk-beres' }, `✓ Selesai: ${tree.count} pemanggilan.`) : el('p', { class: 'rk-ket' }, 'Kotak kuning menunggu hasil; angka di bawahnya adalah nilai kembalian.'));
  };
  function go(d) { k = Math.min(tree.events.length, k + d); draw(); if (k >= tree.events.length) { stop(); onEnd?.(tree); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { if (timer) { stop(); draw(); } else { timer = setInterval(() => go(1), speed); draw(); } }
  host.stop = stop; draw();
  return host;
}

export default {
  id: 'sma-39-rekursi-memo',
  title: 'Rekursi dan Memoisasi',
  topic: 'Fungsi rekursif di Python: kasus dasar, nilai kembalian yang naik, RecursionError, pohon pemanggilan, pemanggilan berulang, memoisasi dengan dictionary, dan pohon fraktal dengan kura-kura',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri faktorial dan jumlah digit, tumbuhkan pohon pemanggilan tangga perpustakaan, hemat pemanggilan dengan memo, lalu gambar pohon fraktal sebagai kura-kura.',
  extraModes: [
    { id: 'pohon', icon: '🌲', label: 'Pohon Pemanggilan', desc: 'Pilih fungsi dan n: setiap pemanggilan menambah kotak, nilai kembalian naik, dan memo terisi', create: createTree },
    { id: 'kura', icon: '🐢', label: 'Kura-kura Fraktal', desc: 'Kura-kura menggambar pohon langkah demi langkah. Geser kedalaman 1–7 dan coba tanpa baris 32', create: createTurtle },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Banyak Pemanggilan', desc: 'Satu tim memilih fungsi dan n, tim lain menebak banyak pemanggilannya. Tebakan terdekat mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rekursi-memo' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const playThen = (title, fn, n, o, rows) => { const p = treePlayer(fn, n, { ...o, onEnd: (tree) => setTimeout(then(() => rows(tree)), 1600) }); wrap.append(el('p', { class: 'prompt' }, title), el('div', { class: 'rk-dua' }, pyCode(FN[fn][1], { labels: FN[fn][2], cls: 'rk-kecil' }), p)); };
      if (r === 0) playThen('Telusuri faktorial(4)', 'fak', 4, {}, (tree) => rowsChoose(wrap, ctx, { prompt: 'Tabel faktorial(4)', cls: 'rk-isi', rows: [3, 2, 1].map((m) => { const fk = (x) => (x <= 1 ? 1 : x * fk(x - 1)); return [`f${m}`, `faktorial(${m}): menunggu · mengembalikan`, [`faktorial(${m - 1}) · ${m} × ${fk(m - 1)} = ${fk(m)}`, `faktorial(${m + 1}) · ${m} × ${fk(m + 1)} = ${m * fk(m + 1)}`, `faktorial(${m - 1}) · ${m} × ${m - 1} = ${m * (m - 1)}`, `faktorial(${m}) · ${m}`].sort(), `faktorial(${m - 1}) · ${m} × ${fk(m - 1)} = ${fk(m)}`]; }).concat([['f4', 'faktorial(4) mengembalikan', [`4 × 6 = ${tree.root.ret}`, '4 × 3 = 12', '4 × 1 = 4', '4 + 6 = 10'], `4 × 6 = ${tree.root.ret}`]]), done: next }));
      else if (r === 1) { const E = run([...FAK, 'x = faktorial(-1)']); const f5 = build('fak', 5).root.ret;
        wrap.append(pyCode(FAK, { labels: FN.fak[2], cls: 'rk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Urutan tampil paduan suara', cls: 'rk-isi', rows: [['4', '4 kelompok', ['24', '16', '10', '4'], '24'], ['5', '5 kelompok', [String(f5), '25', '60', '15'], String(f5)], ['m', 'faktorial(-1)', [`tidak pernah mencapai n == 0; berhenti dengan ${E.error.text}`, 'mengembalikan 1', 'mengembalikan 0', 'mengembalikan -1'], `tidak pernah mencapai n == 0; berhenti dengan ${E.error.text}`, 'Python hanya mengizinkan sekitar 1.000 bingkai bertumpuk.']], done: next }); }
      else if (r === 2) playThen('Telusuri jumlah_digit(2026)', 'digit', 2026, {}, (tree) => { const chain = []; let nd = tree.root; while (nd) { chain.push(nd); nd = nd.kids[0]; } const up = chain.slice().reverse().map((x) => x.ret).join(', ');
        rowsChoose(wrap, ctx, { prompt: 'Jumlah digit', cls: 'rk-isi', rows: [['p', 'Pemanggilan berturut-turut', [chain.map((x) => x.arg).join(' → '), '2026 → 26 → 6', '2026 → 2 → 0 → 2 → 6', '2026 → 2025 → 2024'], chain.map((x) => x.arg).join(' → ')], ['n', 'Nilai yang naik', [up, '2, 0, 2, 6', '6, 2, 0, 2', '2, 2, 4, 6'], up, `jumlah_digit(2026) = ${tree.root.ret}.`],
          ['b', 'banyak_digit(n)', ['if n < 10: return 1 · return 1 + banyak_digit(n // 10)', 'if n < 10: return n · return 1 + banyak_digit(n // 10)', 'if n < 10: return 1 · return n % 10 + banyak_digit(n // 10)', 'if n == 0: return 0 · return 1 + banyak_digit(n - 1)'], 'if n < 10: return 1 · return 1 + banyak_digit(n // 10)', 'Contoh: banyak_digit(2026) = 4.']], done: next }); });
      else if (r === 3) { const w4 = ways(4).map((w) => w.join('+')).join(', ');
        wrap.append(pyCode(CARA, { labels: FN.cara[2], cls: 'rk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Tangga perpustakaan: n = 4', cls: 'rk-isi', rows: [['a', 'Semua cara', [w4, '1+1+1+1, 1+1+2, 2+2, 1+3', '1+1+1+1, 1+1+2, 1+2+1, 2+2', '1+1+1+1, 2+2'], w4], ['n', 'Banyaknya', [String(ways(4).length), '4', '6', '8'], String(ways(4).length)], ['b', 'Mengapa cara(n) = cara(n − 1) + cara(n − 2)?', ['langkah pertama naik 1 (sisa n − 1) atau naik 2 (sisa n − 2); keduanya tidak pernah sama, jadi dijumlahkan', 'karena n dikurangi dua kali', 'karena tangga selalu genap', 'karena Python menjumlahkan dua fungsi'], 'langkah pertama naik 1 (sisa n − 1) atau naik 2 (sisa n − 2); keduanya tidak pernah sama, jadi dijumlahkan', 'Barisan 1, 2, 3, 5, 8, 13 adalah barisan Fibonacci.']], done: next }); }
      else if (r === 4) playThen('Tumbuhkan pohon pemanggilan cara(6)', 'cara', 6, {}, (tree) => { const c = argCount(tree);
        rowsChoose(wrap, ctx, { prompt: 'Pohon cara(6)', cls: 'rk-isi', rows: [['n', 'Banyak pemanggilan seluruhnya', [String(tree.count), '6', '13', '11'], String(tree.count)], ['2', 'cara(2) dipanggil', [`${c[2]} kali`, '1 kali', '3 kali', '8 kali'], `${c[2]} kali`], ['3', 'cara(3) dipanggil', [`${c[3]} kali`, '1 kali', '2 kali', '5 kali'], `${c[3]} kali`], ['v', 'Nilai cara(6)', [String(tree.root.ret), '15', '8', '21'], String(tree.root.ret)]], done: next }); });
      else if (r === 5) { const n30 = calls('cara', 30);
        wrap.append(el('div', { class: 'rk-angka' }, el('small', null, 'cara(30)'), el('b', null, fmtNum(caraVal(30))), el('small', null, 'banyak pemanggilan'), el('b', null, fmtNum(n30))));
        ask(`cara(30) memanggil cara sebanyak ${fmtNum(n30)} kali. Mengapa begitu banyak?`, [['setiap pemanggilan bercabang dua dan bagian pohon yang sama dihitung ulang berkali-kali', true], ['karena 30 adalah bilangan besar sehingga Python lambat'], ['karena kasus dasarnya salah'], ['karena setiap pemanggilan mencetak hasil']]); }
      else if (r === 6) playThen('cara_memo(6): perhatikan memo', 'memo', 6, {}, (tree) => { const fromMemo = tree.events.filter((e) => e.t === 'call' && e.node.memo).map((e) => `cara_memo(${e.node.arg})`).join(', ');
        rowsChoose(wrap, ctx, { prompt: 'Memoisasi', cls: 'rk-isi', rows: [['n', 'Banyak pemanggilan', [String(tree.count), '15', '6', '12'], String(tree.count), '6 menghitung, 3 dari memo.'], ['m', 'Yang dijawab dari memo', [fromMemo, 'cara_memo(1), cara_memo(2)', 'cara_memo(5), cara_memo(4), cara_memo(3)', 'tidak ada'], fromMemo], ['d', 'Isi memo di akhir', [pyRepr(tree.memo), '{1: 1, 2: 2, 3: 3, 4: 5, 5: 8, 6: 13}', '{6: 13, 5: 8, 4: 5, 3: 3, 2: 2, 1: 1}', '{2: 2, 1: 1, 3: 3}'], pyRepr(tree.memo), 'Urutan kunci mengikuti urutan disimpan.']], done: next }); });
      else if (r === 7) { const m30 = calls('memo', 30); const lok = calls('memo', 6, { lokal: true });
        wrap.append(pyCode(MEMO(true), { labels: ['14', '13', '15', '16', '17', '18', '19', '20', '21', '22'], warn: [1], cls: 'rk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Memo untuk n = 30, dan memo Dodi', cls: 'rk-isi', rows: [['3', 'cara_memo(30) dipanggil', [`${m30} kali`, `${fmtNum(calls('cara', 30))} kali`, '30 kali', '29 kali'], `${m30} kali`], ['l', 'cara_memo(30) dipanggil lagi', ['1 kali', `${m30} kali`, '0 kali', '30 kali'], '1 kali', 'Jawabannya sudah ada di memo.'], ['d', 'Dodi: memo = {} di dalam fungsi. cara_memo(6) dipanggil', [`${lok} kali`, '9 kali', '6 kali', '1 kali'], `${lok} kali`], ['w', 'Mengapa tidak lebih cepat?', ['memo menjadi variabel lokal yang dibuat baru dan kosong setiap pemanggilan, lalu hilang', 'dictionary tidak bisa menyimpan bilangan', 'memo harus berupa list', 'n in memo selalu True'], 'memo menjadi variabel lokal yang dibuat baru dan kosong setiap pemanggilan, lalu hilang']], done: next }); }
      else if (r === 8) { const T = turtle(8, 3); let step = 0; const pic = el('div', { class: 'rk-gambar' }, turtleView(T, 0)); let timer = null;
        const end = () => { clearInterval(timer); setTimeout(then(() => { wrap.append(el('div', { class: 'rk-gambar kecil' }, turtleView(T))); rowsChoose(wrap, ctx, { prompt: 'pohon(t, 8, 3)', cls: 'rk-isi', rows: [['g', 'Banyak garis · panjang seluruhnya', [`${T.lines} · ${T.total}`, '7 · 14', '3 · 16', '15 · 24'], `${T.lines} · ${T.total}`, '8 + 2 × 4 + 4 × 2.'], ['p', 'pohon dipanggil (termasuk kedalaman 0)', [`${T.calls} kali`, '7 kali', '8 kali', '3 kali'], `${T.calls} kali`, '7 yang menggambar dan 8 yang langsung berhenti.'], ['e', 'Sesudah selesai, kura-kura', [T.end.x === 0 && T.end.y === 0 && T.end.h === 90 ? 'kembali ke titik awal, menghadap ke atas' : 'tidak kembali', 'di ujung ranting paling kanan', 'di ujung batang, menghadap ke kanan', 'di titik awal, menghadap ke bawah'], 'kembali ke titik awal, menghadap ke atas', 'Karena itu cabang kanan di baris 30 bisa digambar dari ujung batang.']], done: next }); }), 1200); };
        wrap.append(el('p', { class: 'prompt' }, 'Jadilah kura-kura: pohon(t, 8, 3)'), el('div', { class: 'rk-dua' }, pyCode(POHON(), { labels: lab(23, 10), cls: 'rk-kecil' }), el('div', null, el('div', { class: 'sk-tombol' }, button('⏩ Gambar', () => { if (timer) return; timer = setInterval(() => { step++; pic.replaceChildren(turtleView(T, step)); if (step >= T.moves.length) end(); }, 260); }, 'primary'), button('⏭ Sampai selesai', () => { clearInterval(timer); step = T.moves.length; pic.replaceChildren(turtleView(T, step)); end(); })), pic))); }
      else { const S = turtle(8, 3, { no32: true }); const seq = [1, 2, 3, 4].map((d) => turtle(8, d).lines); const tb = run(['def cara_tabel(n):', '    t = [0] * (n + 1)', '    t[1] = 1', '    if n >= 2:', '        t[2] = 2', '    for i in range(3, n + 1):', '        t[i] = t[i - 1] + t[i - 2]', '    return t', 'x = cara_tabel(6)']);
        wrap.append(el('div', { class: 'rk-dua' }, el('div', null, el('small', null, 'dengan baris 32'), el('div', { class: 'rk-gambar kecil' }, turtleView(turtle(8, 3)))), el('div', null, el('small', null, 'Sari: tanpa baris 32'), el('div', { class: 'rk-gambar kecil' }, turtleView(S)))));
        rowsChoose(wrap, ctx, { prompt: 'Sari, pola banyak garis, dan Tantangan', cls: 'rk-isi', rows: [['s', 'Tanpa baris 32', ['kura-kura tidak kembali ke pangkal; cabang kanan digambar dari ujung cabang kiri sehingga menjadi rantai berkelok', 'gambarnya sama saja', 'program berhenti dengan galat', 'pohon tergambar terbalik'], 'kura-kura tidak kembali ke pangkal; cabang kanan digambar dari ujung cabang kiri sehingga menjadi rantai berkelok'], ['e', `Kedalaman 1, 2, 3, 4: ${seq.slice(0, 3).join(', ')}, … · kedalaman d`, [`${seq[3]} · 2ᵈ − 1`, '15 · 2d − 1', '11 · 4d − 5', '16 · 2ᵈ'], `${seq[3]} · 2ᵈ − 1`], ['t', 'Tantangan: isi t untuk n = 6', [pyRepr(tb.vars.x), '[1, 2, 3, 5, 8, 13]', '[0, 1, 1, 2, 3, 5, 8]', '[0, 1, 2, 3, 4, 5, 6]'], pyRepr(tb.vars.x), 'Dihitung dari bawah ke atas, seperti tabel pemrograman dinamis di sma-10.']], done: next }); }
    }
    render();
  },
};

function createTree(root, ctx) {
  const wrap = el('div', { class: 'act rekursi-memo' });
  root.append(wrap);
  const RANGE = { fak: [0, 8], digit: null, cara: [1, 30], memo: [1, 30] }; const DIG = [7, 45, 2026, 98765, 1000000];
  let fn = 'cara'; let n = 6; let lokal = false; let p = null;
  const draw = () => {
    p?.stop(); const big = (fn === 'cara' || (fn === 'memo' && lokal)) ? n > 8 : fn === 'memo' ? n > 14 : false;
    p = big ? el('div', { class: 'rk-angka' }, el('small', null, `${FN[fn][0]}(${n})`), el('b', null, fmtNum(caraVal(n))), el('small', null, 'banyak pemanggilan'), el('b', null, fmtNum(calls(fn, n, { lokal }))), el('p', { class: 'rk-ket' }, 'Pohonnya terlalu besar untuk digambar, jadi hanya hitungannya yang ditampilkan.')) : treePlayer(fn, n, { lokal });
    const lines = fn === 'memo' ? MEMO(lokal) : FN[fn][1];
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pohon pemanggilan'),
      el('div', { class: 'seg rk-versi' }, Object.keys(FN).map((k) => onTap(el('button', { class: `seg-btn ${fn === k ? 'on' : ''}`, type: 'button' }, FN[k][0]), () => { fn = k; n = k === 'digit' ? 2026 : k === 'fak' ? 4 : 6; draw(); }))),
      el('div', { class: 'rk-atur' }, fn === 'digit' ? el('div', { class: 'seg' }, DIG.map((d) => onTap(el('button', { class: `seg-btn ${n === d ? 'on' : ''}`, type: 'button' }, String(d)), () => { n = d; draw(); }))) : stepper(n, (v) => { n = v; draw(); }, { min: RANGE[fn][0], max: RANGE[fn][1], label: 'n' }),
        fn === 'memo' ? onTap(el('button', { class: `seg-btn ${lokal ? 'on' : ''}`, type: 'button' }, 'memo di dalam fungsi'), () => { lokal = !lokal; draw(); }) : null),
      el('div', { class: 'rk-dua' }, pyCode(lines, { cls: 'rk-kecil' }), p));
  };
  draw();
}

function createTurtle(root, ctx) {
  const wrap = el('div', { class: 'act rekursi-memo' });
  root.append(wrap);
  let depth = 3; let no32 = false; let step = 0; let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const draw = () => {
    const T = turtle(8, depth, { no32 }); if (step > T.moves.length) step = T.moves.length;
    const drawn = T.moves.slice(0, step).filter((m) => !m.back);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Kura-kura fraktal: pohon(t, 8, ${depth})`),
      el('div', { class: 'rk-atur' }, el('label', { class: 'rk-geser' }, el('small', null, `kedalaman: ${depth}`), (() => { const i = el('input', { type: 'range', min: '1', max: '7', step: '1', value: String(depth), 'aria-label': 'kedalaman' }); i.addEventListener('input', () => { stop(); depth = Number(i.value); step = turtle(8, depth, { no32 }).moves.length; draw(); }); return i; })()),
        onTap(el('button', { class: `seg-btn ${no32 ? 'on' : ''}`, type: 'button' }, 'tanpa baris 32'), () => { stop(); no32 = !no32; step = turtle(8, depth, { no32 }).moves.length; draw(); }),
        button('▶ Langkah', () => { stop(); step = Math.min(T.moves.length, step + 1); draw(); }, 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Gambar', () => { if (timer) { stop(); draw(); return; } if (step >= T.moves.length) step = 0; timer = setInterval(() => { step++; if (step >= turtle(8, depth, { no32 }).moves.length) stop(); draw(); }, Math.max(30, 300 - depth * 40)); draw(); }), button('↺ Ulang', () => { stop(); step = 0; draw(); })),
      el('div', { class: 'rk-dua' }, pyCode(POHON(no32), { labels: lab(23, 10), cls: 'rk-kecil' }), el('div', null, el('div', { class: 'rk-gambar' }, turtleView(T, step)),
        el('p', { class: 'rk-hitung' }, `garis: ${drawn.length} dari ${T.lines} · panjang: ${fmtNum(Math.round(drawn.reduce((s, m) => s + m.d, 0) * 1000) / 1000)} · pemanggilan pohon: ${T.calls}`))));
  };
  step = turtle(8, depth).moves.length; draw();
  return { destroy: stop };
}

// Choices for the team mode: [fn, n].
export const PILIHAN = [['fak', 5], ['fak', 7], ['digit', 2026], ['digit', 98765], ['cara', 5], ['cara', 6], ['cara', 7], ['cara', 8], ['memo', 6], ['memo', 10], ['memo', 20], ['cara', 20]];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rekursi-memo' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(4, nT * 2); let t = 0; const used = new Set();
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tebak Banyak Pemanggilan selesai', pts, again: () => pickTeams(wrap, 'Tebak Banyak Pemanggilan', start) }); return; }
      const boss = t % nT; const offer = ctx.rand.shuffle(PILIHAN.map((_, i) => i).filter((i) => !used.has(i))).slice(0, 4);
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih fungsi dan n`), el('div', { class: 'seg rk-pilih' }, offer.map((i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${FN[PILIHAN[i][0]][0]}(${PILIHAN[i][1]})`), () => { used.add(i); ctx.sound.tap(); guess(boss, ...PILIHAN[i]); }))));
    }
    function guess(boss, fn, n) {
      const right = calls(fn, n); const g = {}; const others = Array.from({ length: nT }, (_, k) => k).filter((k) => k !== boss || nT === 1);
      others.forEach((k) => { g[k] = 1; });
      const big = (v) => (v >= 100 ? 10 : 1);
      const row = (k) => el('div', { class: 'rk-tebak' }, el('b', null, `Tim ${k + 1}`), button(`−${big(g[k]) * 10}`, () => { g[k] = Math.max(1, g[k] - big(g[k]) * 10); redraw(); }), button('−1', () => { g[k] = Math.max(1, g[k] - 1); redraw(); }), el('span', { class: 'rk-angka-kecil' }, String(g[k])), button('+1', () => { g[k]++; redraw(); }), button(`+${big(g[k]) * 10}`, () => { g[k] += big(g[k]) * 10; redraw(); }));
      const lines = fn === 'memo' ? MEMO() : FN[fn][1];
      function redraw() {
        wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, `Berapa kali ${FN[fn][0]} dipanggil untuk ${FN[fn][0]}(${n})?`), pyCode(lines, { cls: 'rk-kecil' }), el('div', { class: 'rk-tebakan' }, others.map(row)), button('Tumbuhkan pohonnya ➜', reveal, 'primary'));
      }
      function reveal() {
        const dist = others.map((k) => Math.abs(g[k] - right)); const best = Math.min(...dist);
        others.forEach((k, j) => { if (dist[j] === best) pts[k] += dist[j] === 0 ? 2 : 1; });
        ctx.sound.good();
        const winners = others.filter((k, j) => dist[j] === best).map((k) => `Tim ${k + 1}`).join(', ');
        const p = (fn === 'cara' && n > 8) ? el('div', { class: 'rk-angka' }, el('small', null, 'banyak pemanggilan'), el('b', null, fmtNum(right))) : treePlayer(fn, n);
        wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, `${FN[fn][0]}(${n}) memanggil ${fmtNum(right)} kali`), p, el('p', { class: 'reveal' }, `Paling dekat: ${winners}${best === 0 ? ' (tepat, +2)' : ' (+1)'}.`), button('Lanjut ➜', () => { p.stop?.(); t++; step(); }, 'primary'));
        if (p.querySelector) p.querySelector('.sk-tombol button:nth-child(3)')?.click();
      }
      redraw();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Banyak Pemanggilan', start);
}
