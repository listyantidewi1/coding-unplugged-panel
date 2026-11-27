// Rekursi dan Memo — SMA/SMK (16–18 tahun), coding. Recursive Python
// functions: factorial (and the RecursionError of faktorial(-1)), digit sum,
// the library stairs cara(n) with its call tree and repeated calls, memoisation
// with a dict (and Dodi's local memo), and a turtle drawing a fractal tree.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
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

// ---- Permainan: Pabrik Klon ----
// Every recursive call is a clone card; Si Pengulang scores whenever an
// answer that was already known gets computed again.
const HEAD39 = {
  fak: ['Klon Faktorial', 'Tumpuk klon sampai kasus dasar, lalu antar nilai kembalian naik.', 'Ingin klon menumpuk tanpa henti!'],
  runtuh: ['Menara Runtuh', 'Hitung urutan tampil, lalu cari mengapa faktorial(-1) runtuh.', 'Menyelinapkan faktorial(-1)…'],
  digit: ['Klon Pemecah Digit', 'Setiap klon melepas satu digit. Tumpuk, lalu antar nilainya naik.', 'Mengacak digit 2026!'],
  banyak: ['Rakit banyak_digit', 'Susun kasus dasar dan langkah rekursif dari kartu baris.', 'Menukar kartu baris!'],
  tangga: ['Naik Tangga', 'Temukan semua cara menaiki 4 anak tangga dengan langkah 1 atau 2.', '"Pasti cuma ada dua cara!"'],
  pohon: ['Pohon Klon', 'Tumbuhkan pohon cara(6), lalu hitung klon yang kembar.', 'Siap menghitung ulang cara(2)…'],
  memo: ['Papan Memo', 'Sebelum klon menghitung, periksa papan memo.', 'Menunggu klon yang lupa melihat memo!'],
  dodi: ['Memo Dodi', 'Bandingkan memo bersama dengan memo di dalam fungsi.', '"Taruh saja memo di dalam fungsi!"'],
  kura: ['Kura-Kura Fraktal', 'Jadilah kura-kura: ketuk perintah sesuai kode.', 'Mengacak arah kura-kura!'],
  bos: ['Tabel dari Bawah', 'Rakit cara_tabel tanpa rekursi, lalu isi tabelnya.', '"Tanpa klon, mana bisa?"'],
};
const msg39 = (t) => el('p', { class: 'reveal info' }, t);
const DIGIT_SCREEN = ['def jumlah_digit(n):', '    if n < 10:', '        return n', '    return (n % 10', '            + jumlah_digit(n // 10))'];
export const KLON = {
  fak: { name: 'faktorial', code: FAK, labels: lab(1, 4), chain: [4, 3, 2, 1, 0], push: ['3', '2', '1', '0', '-1', '5'], vals: ['1', '1', '2', '6', '24'], chips: ['1', '1', '2', '6', '24', '0', '4', '12'],
    hints: ['Kasus dasar: faktorial(0) langsung mengembalikan 1.', 'faktorial(1) = 1 × faktorial(0).', 'faktorial(2) = 2 × faktorial(1).', 'faktorial(3) = 3 × faktorial(2).', 'faktorial(4) = 4 × faktorial(3).'],
    wrong: (cur) => `n = ${cur}, jadi klon berikutnya faktorial(${cur} - 1).` },
  digit: { name: 'jumlah_digit', code: DIGIT_SCREEN, labels: ['5', '6', '7', '8', '8'], chain: [2026, 202, 20, 2], push: ['202', '20', '2', '6', '26', '226'], vals: ['2', '2', '4', '10'], chips: ['2', '2', '4', '10', '6', '0', '20'],
    hints: ['jumlah_digit(2) adalah kasus dasar: 2 < 10, jadi kembalikan 2.', '20 % 10 = 0, ditambah nilai dari klon di atasnya.', '202 % 10 = 2, ditambah nilai dari klon di atasnya.', '2026 % 10 = 6, ditambah nilai dari klon di atasnya.'],
    wrong: (cur) => `n // 10 membuang digit terakhir: ${cur} // 10 = ${Math.floor(cur / 10)}.` },
};
const klonCard = (name, arg, extra = null, cls = '') => el('div', { class: `kl39-klon ${cls}` }, el('b', null, `${name}(${arg})`), extra);

// Misi 1 and 2: push clones until the base case, then carry values up.
function klonRound(area, ctx, { oops, done }, kind) {
  const K = KLON[kind]; const msg = msg39(`${K.name}(${K.chain[0]}) dipanggil. Seret argumen klon berikutnya ke puncak menara.`);
  const stack = [K.chain[0]];
  const right = el('div', { class: 'kl39-kolom' });
  const live = el('div', { class: 'kl39-kolom' });
  const draw = () => fill(live, el('small', null, 'Menara klon (puncak = sedang berjalan)'), el('div', { class: 'kl39-menara', 'data-drop': 'menara', 'data-n': String(stack.length) }, stack.map((a, i) => klonCard(K.name, a, el('small', null, 'menunggu…'), i === stack.length - 1 ? 'atas' : '')).reverse()),
    el('div', { class: 'kl39-baki' }, K.push.map((v) => el('div', { class: 'kl39-tag', 'data-drag': v }, v))));
  dnd(live, (tag, t) => {
    if (t.dataset.drop !== 'menara' || stack.length >= K.chain.length) return;
    const want = K.chain[stack.length]; const cur = stack[stack.length - 1];
    if (tag.dataset.drag !== String(want)) { oops(); shake(tag); say(msg, 'bad', tag.dataset.drag === '-1' && cur === 0 ? 'n = 0 sudah kasus dasar: klon ini tidak memanggil lagi.' : K.wrong(cur)); return; }
    stack.push(want); ctx.sound.tap(); draw();
    if (stack.length < K.chain.length) { say(msg, 'info', `${K.name}(${want}) belum kasus dasar. Klon berikutnya?`); return; }
    say(msg, 'info', `${K.name}(${want}) adalah kasus dasar! Sekarang antar nilai kembalian naik, dari puncak ke bawah.`); setTimeout(carry, 1300);
  });
  function carry() {
    const view = (mk) => el('div', { class: 'kl39-menara' }, K.chain.slice().reverse().map((a, i) => klonCard(K.name, a, el('span', null, '→ ', mk()), i === 0 ? 'atas' : '')));
    fill(right, el('small', null, 'Nilai kembalian naik'), fillBoard(ctx, { oops, msg, view, chips: K.chips, want: K.vals, hints: K.hints,
      done: () => { ctx.sound.good(); say(msg, '', kind === 'fak' ? 'faktorial(4) = 24. Setiap klon menunggu klon di atasnya, lalu mengalikan.' : 'jumlah_digit(2026) = 2 + 0 + 2 + 6 = 10. Setiap klon melepas satu digit.'); done(); } }));
  }
  draw(); fill(right, live);
  area.append(el('div', { class: 'kl39-dua' }, codeView(K.code, { labels: K.labels }), right), msg);
}

// Misi 1b: choir orders, then faktorial(-1) collapses.
function runtuhRound(area, ctx, { oops, done }) {
  const msg = msg39('Paduan suara: berapa urutan tampil untuk 4 kelompok, dan untuk 5 kelompok?');
  const box = el('div', { class: 'kl39-kolom' }); const out = layar();
  fill(box, fillBoard(ctx, { oops, msg, view: rowsView([['4 kelompok: faktorial(4) = ', '_', ' urutan'], ['5 kelompok: faktorial(5) = ', '_', ' urutan']]), chips: ['24', '120', '16', '25', '20', '60'], want: ['24', '120'],
    hints: ['4 × 3 × 2 × 1.', '5 × faktorial(4) = 5 × 24.'], done: () => { say(msg, 'info', 'Si Pengulang menyelinapkan faktorial(-1). Tekan tombolnya dan amati menara klon.'); setTimeout(minus, 900); } }));
  area.append(el('div', { class: 'kl39-dua' }, codeView(FAK, { labels: lab(1, 4) }), box), msg);
  function minus() {
    const cnt = el('b', { class: 'kl39-hitung' }, '0 klon'); const bar = el('div', { class: 'kl39-tumpuk' }); let n = 0; let started = false;
    fill(box, onTap(el('button', { type: 'button', class: 'btn primary kl39-minus' }, '▶ faktorial(-1)'), () => {
      if (started) return; started = true; ctx.sound.tap();
      const tick = () => {
        if (!bar.isConnected) return;
        n = Math.min(1000, n + 25); cnt.textContent = `${n} klon: faktorial(-${n})`; bar.style.setProperty('--t', String(n / 1000));
        if (n < 1000) { setTimeout(tick, 30); return; }
        bar.classList.add('runtuh'); ctx.sound.bad();
        play(out, [], { err: run([...FAK, 'x = faktorial(-1)']).error.text, end: () => { say(msg, 'info', 'Menara runtuh di sekitar 1.000 klon. Ketuk baris yang seharusnya menghentikan klon.'); pickLine(); } });
      };
      tick();
    }), cnt, bar, out);
  }
  function pickLine() {
    area.querySelector('.kl39-dua > .mk-kode').replaceWith(codeView(FAK, { labels: lab(1, 4), cls: 'ketuk', onLine: (i) => {
      if (i !== 1) { oops(); say(msg, 'bad', i === 3 ? 'Baris 4 membuat klon baru. Baris mana yang seharusnya berkata cukup?' : 'Baris ini tidak memutuskan kapan berhenti.'); return; }
      ctx.sound.good(); say(msg, '', 'Kasus dasar n == 0 tidak pernah tercapai: -1, -2, -3, … terus menjauh dari 0. Python menghentikannya dengan RecursionError.'); done();
    } }));
  }
}

// Misi 2b: assemble banyak_digit from line cards.
const BANYAK_TILES = [['if', 'if n < 10:'], ['base', 'return 1'], ['rec', 'return 1 + banyak_digit(n // 10)'],
  ['if0', 'if n == 0:', 'banyak_digit(7) harus 1. Kasus dasarnya bilangan satu digit.'], ['basen', 'return n', 'Bilangan satu digit punya 1 digit, bukan n digit.'], ['recm', 'return 1 + banyak_digit(n - 1)', 'n - 1 tidak melepas digit. Yang melepas digit terakhir adalah n // 10.']];
function banyakRound(area, ctx, { oops, done }) {
  const msg = msg39('Rakit banyak_digit dari kartu baris, dari atas ke bawah.'); const out = layar();
  area.append(el('div', { class: 'kl39-dua' }, tileSlots(ctx, { oops, msg, build: ['def banyak_digit(n):', ['if', 1], ['base', 2], ['rec', 1], 'print(banyak_digit(2026))'], tiles: BANYAK_TILES,
    onFull: () => play(out, run(['def banyak_digit(n):', '    if n < 10:', '        return 1', '    return 1 + banyak_digit(n // 10)', 'print(banyak_digit(2026))']).out, { end: () => { say(msg, '', 'Klon 2026, 202, 20, 2: empat klon, jadi 4 digit. Kasus dasar mengembalikan 1, setiap klon di bawahnya menambah 1.'); done(); } }) }),
  el('div', { class: 'kl39-kolom' }, el('small', null, 'Layar'), out)), msg);
}

// Misi 3: climb a 4-step stair with steps of 1 or 2.
export const TANGGA = ways(4).map((w) => w.join('+'));
function tanggaRound(area, ctx, { oops, done }) {
  const msg = msg39('Ketuk naik 1 atau naik 2 sampai puncak. Temukan semua urutan yang berbeda.');
  let path = []; const found = []; let busy = false;
  const stairs = el('div', { class: 'kl39-tangga' }); const log = el('div', { class: 'kl39-catat' });
  const draw = () => {
    const pos = path.reduce((a, b) => a + b, 0);
    fill(stairs, [0, 1, 2, 3, 4].map((k) => el('div', { class: `kl39-anak ${k === pos ? 'di' : ''}`, style: { height: `${1.2 + k * 1.1}em` } }, k === pos ? '🧑' : String(k))));
    stairs.dataset.jalan = path.join('+');
    fill(log, el('small', null, `Urutan tercatat (${found.length})`), found.map((f) => el('span', null, f)));
  };
  const step = (s) => {
    if (busy || found.length >= TANGGA.length) return;
    path.push(s); const pos = path.reduce((a, b) => a + b, 0); ctx.sound.tap(); draw();
    if (pos > 4) { oops(); say(msg, 'bad', 'Kelewatan! Tangganya hanya 4 anak tangga. Mulai lagi dari bawah.'); busy = true; setTimeout(() => { path = []; busy = false; draw(); }, 700); return; }
    if (pos < 4) return;
    const seq = path.join('+'); busy = true;
    if (found.includes(seq)) say(msg, 'info', `${seq} sudah tercatat. Coba urutan lain.`);
    else { found.push(seq); ctx.sound.good(); say(msg, 'info', `${seq} tercatat!`); }
    setTimeout(() => { path = []; busy = false; draw(); if (found.length === TANGGA.length) finish(); }, 700);
  };
  const btns = el('div', { class: 'kl39-tombol' }, [[1, '⬆ naik 1'], [2, '⏫ naik 2']].map(([k, t]) => onTap(el('button', { type: 'button', class: 'kl39-langkah', 'data-k': String(k) }, t), () => step(k))));
  const left = el('div', { class: 'kl39-kolom' }, stairs, btns);
  draw();
  area.append(el('div', { class: 'kl39-dua' }, left, el('div', { class: 'kl39-kolom' }, codeView(CARA, { labels: lab(9, 4) }), log)), msg);
  function finish() {
    say(msg, 'info', 'Lima cara! Langkah pertama naik 1 (sisa 3) atau naik 2 (sisa 2). Lengkapi hitungannya.');
    fill(left, el('small', null, 'cara(4) dari dua tangga yang lebih kecil'), fillBoard(ctx, { oops, msg, view: rowsView([['cara(3) = ', '_', ' cara'], ['cara(4) = cara(3) + cara(2) = ', '_', ' + ', '_']]), chips: ['3', '3', '2', '4', '5', '1'], want: ['3', '3', '2'],
      hints: ['Tangga 3: 1+1+1, 1+2, 2+1.', 'cara(3) yang baru dihitung.', 'Tangga 2: 1+1 atau 2.'], done: () => { say(msg, '', 'cara(4) = 3 + 2 = 5. Tangga besar dijawab dengan dua tangga yang lebih kecil.'); done(); } }));
  }
}

// Misi 4: grow the call tree of cara(6) by tapping, then count twins.
function pohonRound(area, ctx, { oops, done }) {
  const msg = msg39('Ketuk klon yang belum dijalankan untuk menumbuhkan dua klon anaknya.');
  const T = build('cara', 6); const open = new Set(); const internal = []; const walk = (n) => { if (n.kids.length) { internal.push(n.id); n.kids.forEach(walk); } }; walk(T.root);
  const treeBox = el('div', { class: 'kl39-pohon-wadah' }); const side = el('div', { class: 'kl39-kolom' });
  const node = (nd) => {
    const grown = open.has(nd.id); const leaf = !nd.kids.length; const all = open.size === internal.length;
    const card = el('button', { type: 'button', class: `kl39-simpul ${leaf ? 'daun' : grown ? '' : 'tumbuh'} ${all ? 'warna' : ''}`, 'data-id': String(nd.id), style: { '--h': String((nd.arg * 67) % 360) } }, el('b', null, `cara(${nd.arg})`), leaf || all ? el('small', null, `→ ${nd.ret}`) : el('small', null, grown ? '…' : '▶'));
    onTap(card, () => tap(nd, card));
    return el('div', { class: 'kl39-cabang' }, card, grown ? el('div', { class: 'kl39-anak-anak' }, nd.kids.map(node)) : null);
  };
  const draw = () => fill(treeBox, node(T.root));
  function tap(nd, card) {
    if (open.size === internal.length) return;
    if (!nd.kids.length) { say(msg, 'info', `cara(${nd.arg}) adalah kasus dasar: langsung mengembalikan ${nd.ret}.`); return; }
    if (open.has(nd.id)) return;
    open.add(nd.id); ctx.sound.tap(); draw();
    if (open.size < internal.length) { say(msg, 'info', `cara(${nd.arg}) memanggil cara(${nd.arg - 1}) dan cara(${nd.arg - 2}).`); return; }
    say(msg, 'info', 'Pohon lengkap. Klon berwarna sama punya argumen sama. Hitung kembarannya.');
    fill(side, fillBoard(ctx, { oops, msg, view: rowsView([['pemanggilan seluruhnya: ', '_'], ['cara(2): ', '_', ' kali'], ['cara(1): ', '_', ' kali'], ['cara(3): ', '_', ' kali'], ['cara(4): ', '_', ' kali'], ['cara(6) = ', '_']]),
      chips: ['15', '5', '3', '3', '2', '13', '8', '6'], want: ['15', '5', '3', '3', '2', '13'],
      hints: ['Hitung semua kotak di pohon.', 'Cari semua kotak cara(2) yang warnanya sama.', 'Cari semua kotak cara(1).', 'Cari semua kotak cara(3).', 'Cari semua kotak cara(4).', 'Nilai yang dikembalikan klon paling bawah: 8 + 5.'],
      done: () => { say(msg, '', `Hanya 6 argumen berbeda, tetapi ada 15 klon: Si Pengulang mendapat 15 − 6 = 9 poin. Untuk cara(30): ${fmtNum(calls('cara', 30))} klon!`); done(); } }));
  }
  draw();
  area.append(el('div', { class: 'kl39-dua' }, treeBox, side), msg);
}

// Misi 5: the memo keeper decides for every call: memo or compute.
function memoRound(area, ctx, { oops, done }) {
  const msg = msg39('cara_memo(6) dipanggil. Periksa papan memo: ambil dari memo, atau hitung?');
  const T = build('memo', 6); const ev = T.events; let k = 0; let made = 0; let fromMemo = 0; let memo = new PyDict();
  const board = el('div', { class: 'kl39-kolom' }); const cur = el('div', { class: 'kl39-kolom' });
  const chain = [];
  const draw = () => {
    fill(board, el('small', null, 'Papan memo'), el('div', { class: 'kl39-memo' }, memo.size ? [...memo].map(([a, v]) => el('span', null, el('b', null, String(a)), `: ${v}`)) : el('em', null, 'kosong')),
      el('div', { class: 'kl39-skor' }, el('span', null, `klon: ${made}`), el('span', null, `dari memo: ${fromMemo}`), el('span', null, '🔁 Si Pengulang: 0')));
    const e = ev[k];
    fill(cur, el('small', null, 'Klon yang sedang berjalan'), el('div', { class: 'kl39-rantai' }, chain.map((a) => el('span', null, `cara_memo(${a})`))),
      e ? klonCard('cara_memo', e.node.arg, null, 'atas') : null,
      e ? el('div', { class: 'kl39-tombol' }, onTap(el('button', { type: 'button', class: 'kl39-langkah', 'data-k': 'memo' }, '📋 ambil dari memo'), () => pick('memo')), onTap(el('button', { type: 'button', class: 'kl39-langkah', 'data-k': 'hitung' }, '🔨 hitung'), () => pick('hitung'))) : null);
  };
  // Advance past return events to the next call, updating the memo board and the chain.
  const advance = () => { while (k < ev.length && ev[k].t === 'ret') { memo = ev[k].memo; chain.pop(); k++; } draw(); };
  function pick(c) {
    const e = ev[k]; if (!e) return; const a = e.node.arg;
    if (c === 'hitung' && e.node.memo) { oops(); say(msg, 'bad', `cara_memo(${a}) sudah ada di papan memo. Menghitungnya lagi memberi poin kepada Si Pengulang!`); return; }
    if (c === 'memo' && !e.node.memo) { oops(); say(msg, 'bad', `Belum ada kunci ${a} di papan memo, jadi harus dihitung.`); return; }
    made++; if (c === 'memo') fromMemo++; ctx.sound.tap();
    chain.push(a); k++;
    say(msg, 'info', c === 'memo' ? `memo[${a}] = ${memo.get(a)} langsung dikembalikan.` : a <= 2 ? `cara_memo(${a}) kasus dasar: ${a}, lalu disimpan di memo.` : `cara_memo(${a}) memanggil cara_memo(${a - 1}) dulu.`);
    advance();
    if (k >= ev.length) { say(msg, '', `${made} klon, ${fromMemo} di antaranya dari memo. Memo akhir ${pyRepr(memo)}. Si Pengulang tidak mendapat poin.`); done(); }
  }
  draw();
  area.append(el('div', { class: 'kl39-dua' }, el('div', { class: 'kl39-kolom' }, codeView(MEMO().slice(0, 5), { labels: lab(12, 5) }), board), cur), msg);
}

// Misi 5b: n = 30 with a shared memo, and Dodi's local memo.
function dodiRound(area, ctx, { oops, done }) {
  const msg = msg39('Isi banyak klon untuk setiap pabrik.');
  const box = el('div', { class: 'kl39-kolom' });
  area.append(el('div', { class: 'kl39-dua' }, el('div', { class: 'kl39-kolom' }, el('small', null, 'Pabrik Dodi: memo di dalam fungsi'), codeView(MEMO(true).slice(0, 5), { labels: lab(13, 5), warn: [1] })), box), msg);
  fill(box, fillBoard(ctx, { oops, msg, view: rowsView([['cara_memo(30) pertama kali: ', '_', ' klon'], ['cara_memo(30) dipanggil lagi: ', '_', ' klon'], ['Dodi, cara_memo(6): ', '_', ' klon']]),
    chips: [String(calls('memo', 30)), '1', String(calls('memo', 6, { lokal: true })), '9', '30', fmtNum(calls('cara', 30))], want: [String(calls('memo', 30)), '1', String(calls('memo', 6, { lokal: true }))],
    hints: ['Setiap n dihitung sekali dan setiap n di atas 2 sekali lagi mengambil dari memo: 2 × 30 − 3.', 'Jawabannya sudah ada di papan memo sejak panggilan pertama.', 'memo = {} dibuat baru dan kosong di setiap klon, jadi tidak ada yang tersimpan: sama dengan cara(6).'],
    done: () => { say(msg, '', `Memo bersama: ${calls('memo', 30)} klon, bukan ${fmtNum(calls('cara', 30))}. Memo Dodi hilang bersama klonnya, jadi Si Pengulang tetap mendapat 9 poin.`); done(); } }));
}

// Misi 6: be the turtle for pohon(t, 8, 2), then predict depth 3.
export function turtleOps(p, d, out = [], depth = 0) {
  if (d === 0) return out;
  out.push(['maju', 1, depth], ['kiri', 2, depth]); turtleOps(p / 2, d - 1, out, depth + 1);
  out.push(['kanan', 4, depth]); turtleOps(p / 2, d - 1, out, depth + 1);
  out.push(['kiri', 6, depth], ['mundur', 7, depth]); return out;
}
const POHON_SCREEN = ['    if kedalaman == 0: return', '    t.forward(panjang)', '    t.left(30)', '    pohon(t, panjang / 2, kedalaman - 1)', '    t.right(60)', '    pohon(t, panjang / 2, kedalaman - 1)', '    t.left(30)', '    t.backward(panjang)'];
const OP_NAME = { maju: '⬆ maju', kiri: '↶ kiri 30', kanan: '↷ kanan 60', mundur: '⬇ mundur' };
function kuraRound(area, ctx, { oops, done }) {
  const msg = msg39('Kode memanggil pohon(t, 8, 2). Ketuk perintah kura-kura satu per satu.');
  const OPS = turtleOps(8, 2); const T = turtle(8, 2); let i = 0; let moved = 0;
  const pic = el('div', { class: 'kl39-gambar' }); const codeBox = el('div'); const side = el('div', { class: 'kl39-kolom' });
  const draw = () => {
    fill(codeBox, el('code', { class: 'kl39-mesin' }, 'def pohon(t, panjang, kedalaman):'), codeView(POHON_SCREEN, { labels: ['24', '26', '27', '28', '29', '30', '31', '32'], hl: OPS[i] ? [OPS[i][1]] : [] }));
    fill(pic, turtleView(T, moved));
  };
  const btns = el('div', { class: 'kl39-tombol' }, Object.entries(OP_NAME).map(([k, t]) => onTap(el('button', { type: 'button', class: 'kl39-langkah', 'data-k': k }, t), () => press(k))));
  function press(k) {
    if (i >= OPS.length) return;
    const [want, , d] = OPS[i];
    if (k !== want) { oops(); say(msg, 'bad', `Baris yang menyala: ${POHON_SCREEN[OPS[i][1]].trim()}. Perintah apa itu?`); return; }
    if (k === 'maju' || k === 'mundur') moved++;
    i++; ctx.sound.tap(); draw();
    if (i < OPS.length) { say(msg, 'info', `Kedalaman ${2 - d}${OPS[i][2] !== d ? ' (klon berganti)' : ''}. Lanjutkan.`); return; }
    say(msg, 'info', 'Kura-kura kembali ke titik awal, menghadap ke atas. Sekarang ramalkan pohon(t, 8, 3).'); btns.remove();
    setTimeout(() => fill(side, fillBoard(ctx, { oops, msg, view: rowsView([['pohon(t, 8, 3): ', '_', ' garis'], ['panjang seluruhnya: ', '_'], ['pohon dipanggil: ', '_', ' kali']]), chips: ['7', '24', '15', '3', '14', '8'], want: ['7', '24', '15'],
      hints: ['Kedalaman 2 punya 3 garis; kedalaman 3 menambah dua pohon kedalaman 2 di ujung batang: 1 + 3 + 3.', '8 + 2 × 4 + 4 × 2.', '7 klon yang menggambar ditambah 8 klon kedalaman 0 yang langsung berhenti.'],
      done: () => { fill(pic, turtleView(turtle(8, 3))); say(msg, '', 'Garis per kedalaman 1, 3, 7, 15: 2ᵈ − 1. Setiap klon menggambar batang lalu menyerahkan cabang kepada dua klon yang lebih kecil.'); done(); } })), 1200);
  }
  draw();
  fill(side, pic, btns);
  area.append(el('div', { class: 'kl39-dua' }, codeBox, side), msg);
}

// Misi Bos: the bottom-up table.
const TABEL_TILES = [['for', 'for i in range(3, n + 1):'], ['isi', 't[i] = t[i - 1] + t[i - 2]'], ['ret', 'return t'],
  ['forn', 'for i in range(n):', 't[0], t[1], dan t[2] sudah diisi. Mulai dari 3 sampai n.'], ['rek', 't[i] = cara(i - 1) + cara(i - 2)', 'Tanpa klon! Ambil jawaban kecil dari tabel t.'], ['prt', 'print(t)', 'Fungsi harus mengembalikan tabelnya, bukan mencetak.']];
function bosRound(area, ctx, { oops, done }) {
  const msg = msg39('Rakit cara_tabel dari kartu baris. Tanpa rekursi!');
  const box = el('div', { class: 'kl39-kolom' });
  fill(box, tileSlots(ctx, { oops, msg, build: ['def cara_tabel(n):', '    t = [0] * (n + 1)', '    t[1] = 1', '    if n >= 2:', '        t[2] = 2', ['for', 1], ['isi', 2], ['ret', 1]], tiles: TABEL_TILES,
    onFull: () => { say(msg, 'info', 'cara_tabel(6) berjalan. Isi tabel dari kiri ke kanan.'); setTimeout(table, 1000); } }));
  area.append(box, msg);
  function table() {
    const view = (mk) => el('div', { class: 'kl39-tabel' }, ['0', '1', '2', null, null, null, null].map((v, i) => el('div', null, el('small', null, `t[${i}]`), v ?? mk())));
    fill(box, fillBoard(ctx, { oops, msg, view, chips: ['3', '5', '8', '13', '4', '6', '7'], want: ['3', '5', '8', '13'], hints: ['t[3] = t[2] + t[1].', 't[4] = t[3] + t[2].', 't[5] = t[4] + t[3].', 't[6] = t[5] + t[4].'],
      done: () => { say(msg, '', 't = [0, 1, 2, 3, 5, 8, 13]. Tabel dihitung dari bawah, setiap nilai sekali: tidak ada klon, tidak ada poin untuk Si Pengulang.'); done(); } }));
  }
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
    const wrap = el('div', { class: 'act kl39-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'kl39-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD39[k];
        foe = el('div', { class: 'kl39-musuh' }, el('b', null, '🔁 Si Pengulang'), el('span', null, ulah));
        wrap.append(el('div', { class: 'kl39-kepala' }, misiHead(no, judul, tujuan, '🧬'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Pabrik klon menang ✓'; next(ms); } });
      if (r === 0) { go('fak', 1); klonRound(area, ctx, fin(5000), 'fak'); }
      else if (r === 1) { go('runtuh', 1); runtuhRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('digit', 2); klonRound(area, ctx, fin(5000), 'digit'); }
      else if (r === 3) { go('banyak', 2); banyakRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('tangga', 3); tanggaRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('pohon', 4); pohonRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('memo', 5); memoRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('dodi', 5); dodiRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('kura', 6); kuraRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
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
