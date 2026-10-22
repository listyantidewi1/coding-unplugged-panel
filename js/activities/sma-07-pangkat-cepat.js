// Pangkat Cepat dan Tebak Akar — SMA/SMK (16–18 tahun), bagi-dan-taklukkan.
// Repeated squaring and addition chains, modular exponentiation with small
// remainders, and finding √2 by halving an interval.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const binary = (n) => n.toString(2);
export function squaringCost(n) { const b = binary(n); return { sq: b.length - 1, extra: [...b].filter((c) => c === '1').length - 1, total: b.length - 2 + [...b].filter((c) => c === '1').length }; }
export function powMod(b, e, m) { let r = 1n; let x = BigInt(b) % BigInt(m); let k = BigInt(e); const M = BigInt(m); while (k > 0n) { if (k & 1n) r = (r * x) % M; x = (x * x) % M; k >>= 1n; } return Number(r); }
// Shortest addition chain length (number of multiplications), iterative deepening.
export function shortestChain(n) {
  if (n === 1) return { len: 0, chain: [1] };
  for (let L = 1; L <= 2 * Math.ceil(Math.log2(n)); L++) {
    const chain = [1];
    const dfs = () => {
      const top = chain.at(-1);
      if (top === n) return true;
      if (chain.length - 1 >= L) return false;
      if (top * 2 ** (L - (chain.length - 1)) < n) return false;
      const seen = new Set();
      for (let i = chain.length - 1; i >= 0; i--) for (let j = i; j >= 0; j--) {
        const s = chain[i] + chain[j];
        if (s <= top || s > n || seen.has(s)) continue;
        seen.add(s);
        chain.push(s);
        if (dfs()) return true;
        chain.pop();
      }
      return false;
    };
    if (dfs()) return { len: L, chain: [...chain] };
  }
  return null;
}
export function bisect(N, digits = 3) {
  let lo = Math.floor(Math.sqrt(N));
  let hi = lo + 1;
  const rows = [];
  const same = () => Math.floor(lo * 10 ** digits) === Math.floor(hi * 10 ** digits);
  while (!same() && rows.length < 60) { const t = (lo + hi) / 2; const t2 = t * t; rows.push({ lo, hi, t, t2, up: t2 > N }); if (t2 > N) hi = t; else lo = t; }
  return { rows, lo, hi };
}
const sup = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
const big = (b, e) => { const v = (BigInt(b) ** BigInt(e)).toString(); return v.length > 18 ? `${v.slice(0, 6)}… (${v.length} digit)` : BigInt(v).toLocaleString('id-ID'); };
const dec = (x) => String(+x.toFixed(12)).replace('.', ',');

// Build a power with multiplications: tap two exponents you already have.
function chainBoard(host, ctx, { base = 3, target, mod = null, limit = null, onReach, onMul }) {
  let have = [1];
  let sel = null;
  let muls = 0;
  const b = { enabled: true, get muls() { return muls; }, reset() { have = [1]; sel = null; muls = 0; draw(); } };
  const chips = el('div', { class: 'pk-chip-baris' });
  const log = el('div', { class: 'pk-log' });
  const info = el('p', { class: 'reveal info' });
  const lines = [];
  function draw() {
    chips.replaceChildren(...have.map((e) => onTap(el('button', { class: `pk-chip ${sel === e ? 'on' : ''} ${e === target ? 'sasaran' : ''}`, type: 'button', 'data-e': e }, el('b', null, `${base}${sup(e)}`), el('small', null, mod ? `sisa ${powMod(base, e, mod)}` : big(base, e))), () => tap(e))));
    log.replaceChildren(...lines.slice(-6).map((l) => el('div', null, l)));
    info.textContent = `Sasaran ${base}${sup(target)}${mod ? ` (sisa bagi ${mod})` : ''} · perkalian: ${muls}${limit ? ` dari paling banyak ${limit}` : ''} · cara biasa: ${target - 1}`;
  }
  function tap(e) {
    if (!b.enabled || have.includes(target)) return;
    if (sel === null) { sel = e; draw(); return; }
    const s = sel + e;
    const a = sel;
    sel = null;
    if (s > target) { ctx.mistake(); shake(chips); say(info, 'bad', `${base}${sup(a)} × ${base}${sup(e)} = ${base}${sup(s)}, melewati sasaran ${base}${sup(target)}.`); setTimeout(draw, 1600); return; }
    if (have.includes(s)) { say(info, 'bad', `${base}${sup(s)} sudah ada.`); setTimeout(draw, 1200); return; }
    have = [...have, s].sort((x, y) => x - y);
    muls++;
    lines.push(`${muls}. ${base}${sup(a)} × ${base}${sup(e)} = ${base}${sup(s)}${mod ? ` → sisa ${powMod(base, s, mod)}` : ''}`);
    ctx.sound.tap();
    draw();
    if (onMul) onMul(s, muls);
    if (s === target && onReach) onReach(muls);
  }
  host.append(chips, log, info);
  draw();
  return b;
}

function chainRound(wrap, ctx, { target, limit, prompt, done }) {
  const host = el('div', { class: 'pk-papan' });
  const msg = el('p', { class: 'reveal hint' }, 'Ketuk dua pangkat yang sudah ada untuk mengalikannya. Ketuk pangkat yang sama dua kali untuk mengkuadratkan.');
  let board;
  wrap.append(el('p', { class: 'prompt' }, prompt), host, el('div', { class: 'kode-baris' }, button('Ulang', () => board.reset())), msg);
  board = chainBoard(host, ctx, {
    target,
    limit,
    onMul(s, m) { if (m >= limit && s !== target) { ctx.mistake(); say(msg, 'bad', `Sudah ${m} perkalian tanpa sampai ${target}. Ketuk Ulang dan coba jalan lain.`); } },
    onReach(m) {
      if (m > limit) { ctx.mistake(); say(msg, 'bad', `Sampai dengan ${m} perkalian; bisa dengan ${limit}. Ketuk Ulang.`); return; }
      say(msg, '', `Tepat! ${m} perkalian, cara biasa ${target - 1}.`);
      done();
    },
  });
}

function bisectRound(wrap, ctx, { N = 2, done }) {
  const { rows } = bisect(N);
  let k = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `Jika t² lebih dari ${N}, t menjadi batas atas; jika kurang, batas bawah.`);
  const draw = () => {
    const r = rows[Math.min(k, rows.length - 1)];
    const lo = k < rows.length ? r.lo : r.up ? r.lo : r.t;
    const hi = k < rows.length ? r.hi : r.up ? r.t : r.hi;
    stage.replaceChildren(...zoomLines(lo, hi, k < rows.length ? r.t : null, Math.floor(Math.sqrt(N))),
      el('div', { class: 'pk-akar' }, el('span', null, `Langkah ${Math.min(k + 1, rows.length)}`), el('span', null, `bawah ${dec(lo)}`), el('span', null, `atas ${dec(hi)}`), k < rows.length ? el('b', null, `t = ${dec(r.t)} · t² = ${dec(+r.t2.toFixed(4))}`) : null));
  };
  const pick = (up) => {
    if (k >= rows.length) return;
    if (rows[k].up !== up) { ctx.mistake(); shake(stage); say(msg, 'bad', `t² = ${dec(+rows[k].t2.toFixed(4))} ${rows[k].up ? 'lebih' : 'kurang'} dari ${N}.`); return; }
    k++;
    ctx.sound.tap();
    draw();
    if (k === rows.length) { const last = rows.at(-1); const lo = last.up ? last.lo : last.t; say(msg, '', `√${N} ≈ ${dec(Math.floor(lo * 1000) / 1000)} setelah ${rows.length} langkah: kedua batas sama sampai tiga angka desimal.`); done(); }
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Tebak √${N} tanpa tombol √: bagi dua selangnya.`), stage,
    el('div', { class: 'kode-baris' }, button(`t² > ${N}: t jadi batas atas`, () => pick(true), 'primary'), button(`t² < ${N}: t jadi batas bawah`, () => pick(false), 'primary')), msg);
}
function numberLine(lo, hi, t, a, from = a, to = a + 1) {
  const X = (x) => 20 + ((x - from) / (to - from)) * 460;
  const lab = (x) => String(+x.toFixed(10)).replace('.', ',');
  return el('div', { class: 'pk-garis', html: `<svg viewBox="0 0 500 70" role="img" aria-label="Garis bilangan"><line x1="20" y1="40" x2="480" y2="40" stroke="#94a3b8" stroke-width="2"/><rect x="${X(lo)}" y="30" width="${Math.max(1.5, X(hi) - X(lo))}" height="20" fill="#fde68a" stroke="#ca8a04"/>${t != null ? `<line x1="${X(t)}" y1="22" x2="${X(t)}" y2="58" stroke="#dc2626" stroke-width="3"/><text x="${X(t)}" y="16" font-size="12" text-anchor="middle" fill="#dc2626">t</text>` : ''}<text x="20" y="66" font-size="12" text-anchor="start">${lab(from)}</text><text x="480" y="66" font-size="12" text-anchor="end">${lab(to)}</text></svg>` });
}
const zoomLines = (lo, hi, t, a) => { const w = hi - lo; return w < 0.2 ? [numberLine(lo, hi, t, a), numberLine(lo, hi, t, a, lo - w / 2, hi + w / 2)] : [numberLine(lo, hi, t, a)]; };

export default {
  id: 'sma-07-pangkat-cepat',
  title: 'Pangkat Cepat dan Tebak Akar',
  topic: 'Bagi-dan-taklukkan: kuadrat berulang, sisa bagi pangkat, dan metode bagi dua',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '⚡',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menghitung pangkat dengan kuadrat berulang dan rantai perkalian, menurunkan aturan banyak perkalian dari bentuk biner, menghitung sisa bagi pangkat besar tanpa kalkulator, dan menebak akar dengan membagi dua selang.',
  extraModes: [
    { id: 'pangkat', icon: '✖️', label: 'Penghitung Langkah Pangkat', desc: 'Pilih bilangan pokok, pangkat sasaran, dan sisa bagi; bangun pangkatnya dengan mengalikan pangkat yang sudah ada dan bandingkan dengan cara biasa dan cara paling hemat', create: createPower },
    { id: 'akar', icon: '📏', label: 'Tebak Akar', desc: 'Garis bilangan dengan selang yang menyempit setiap kali memilih lebih atau kurang', create: createRoot },
    { id: 'giliran', icon: '🔁', label: 'Menuju Sasaran', desc: 'Tim bergantian menambah satu perkalian menuju pangkat sasaran; tim yang sampai tepat di sasaran mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pangkat-cepat' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) ask('3¹⁶ dengan cara biasa (3 × 3 × … × 3) dan dengan kuadrat berulang (3², 3⁴, 3⁸, 3¹⁶). Berapa perkalian masing-masing?', [['Cara biasa 15, kuadrat berulang 4; hasilnya 43.046.721', true], ['Cara biasa 16, kuadrat berulang 8'], ['Cara biasa 15, kuadrat berulang 15'], ['Cara biasa 4, kuadrat berulang 15']], 1, el('div', { class: 'au-status' }, '3² = 9 · 3⁴ = 81 · 3⁸ = 6.561 · 3¹⁶ = ?'));
      else if (r === 1) chainRound(wrap, ctx, { target: 13, limit: 5, prompt: 'Bangun 3¹³ (13 = 8 + 4 + 1 = 1101₂) dengan paling banyak 5 perkalian.', done: next });
      else if (r === 2) ask('100 = 1100100₂. Dengan kuadrat berulang, berapa perkalian untuk 3¹⁰⁰?', [['6 kuadrat + 2 perkalian tambahan = 8; cara biasa 99', true], ['7 kuadrat + 3 tambahan = 10'], ['100 kuadrat'], ['3 kuadrat + 6 tambahan = 9']], 1, el('div', { class: 'au-status' }, 'Kuadrat = banyak digit biner − 1 · Tambahan = banyak angka 1 − 1'),
        then(() => ask('1.000.000 = 11110100001001000000₂ (20 digit, tujuh angka 1). Total perkaliannya?', [['19 + 6 = 25, padahal cara biasa 999.999', true], ['20 + 7 = 27'], ['1.000.000'], ['19 + 7 = 26']])));
      else if (r === 3) ask('Sisa bagi 5¹³ oleh 23: 5² → 2, 5⁴ → 2² = 4. Berapa sisa 5⁸?', [['16', true], ['8'], ['2'], ['4']], 4, el('div', { class: 'au-status' }, 'Sisa bagi hasil kali = sisa bagi dari hasil kali sisa-sisanya'),
        then(() => ask('5¹³ = 5⁸ × 5⁴ × 5¹: 16 × 4 = 64 → sisa 18; 18 × 5 = 90 → sisa?', [['21', true], ['18'], ['13'], ['4']], 4, null,
          then(() => ask('Mengapa tidak menghitung 5¹³ = 1.220.703.125 lebih dulu?', [['Untuk pangkat ratusan digit bilangannya terlalu besar; dengan sisa bagi, angka yang dikalikan tidak pernah lebih dari 22', true], ['Karena hasilnya pasti salah'], ['Karena 23 bilangan prima'], ['Karena kalkulator tidak punya tombol pangkat']])))));
      else if (r === 4) ask('Sisa bagi 7²⁷ oleh 55 (27 = 16 + 8 + 2 + 1)? Lalu sisa bagi 28³ oleh 55?', [['7²⁷ → 28, lalu 28³ → 7: angka semula kembali', true], ['7²⁷ → 7, lalu 28³ → 28'], ['7²⁷ → 28, lalu 28³ → 28'], ['7²⁷ → 49, lalu 28³ → 14']], 1, el('div', { class: 'pk-log' }, ['7² → 49', '7⁴ → 49² = 2.401 → 36', '7⁸ → 36² = 1.296 → 31', '7¹⁶ → 31² = 961 → 26'].map((t) => el('div', null, t))),
        then(() => ask('Pasangan pangkat 27 dan 3 (sisa bagi 55) mengembalikan angka semula. Ini dasar dari apa?', [['Sandi kunci publik seperti RSA: satu pangkat untuk mengunci, pangkat lain untuk membuka', true], ['Kompresi berkas'], ['Mengurutkan data'], ['Mencari akar kuadrat']])));
      else if (r === 5) bisectRound(wrap, ctx, { N: 2, done: next });
      else if (r === 6) ask('Setiap langkah membagi dua lebar selang; setelah k langkah lebarnya 1 : 2ᵏ. Berapa langkah supaya lebar kurang dari 0,000001?', [['20, karena 2²⁰ = 1.048.576 > 1.000.000', true], ['6'], ['1.000.000'], ['10']], 2, null,
        then(() => ask('Banyak langkah kuadrat berulang dan metode bagi dua tumbuh seperti apa?', [['log₂ n: pangkat 1.000.000 cukup 25 perkalian; ketelitian sejuta kali cukup 20 langkah', true], ['n'], ['n²'], ['Tetap, tidak tumbuh']])));
      else if (r === 7) chainRound(wrap, ctx, { target: 15, limit: 5, prompt: 'Tantangan: kuadrat berulang butuh 6 perkalian untuk 3¹⁵. Temukan cara dengan 5 perkalian.', done: next });
      else if (r === 8) ask('Mengapa kuadrat berulang dan metode bagi dua disebut bagi-dan-taklukkan?', [['Masalah besar diubah menjadi masalah yang sama berukuran setengahnya, lalu hasilnya dipakai untuk masalah besar', true], ['Karena bilangannya dibagi dua orang'], ['Karena selalu memakai pembagian'], ['Karena hasilnya dibulatkan']]);
      else chainRound(wrap, ctx, { target: 100, limit: 8, prompt: 'Bangun 3¹⁰⁰ dengan paling banyak 8 perkalian.', done: next });
    }
    render();
  },
};

function createPower(root, ctx) {
  const wrap = el('div', { class: 'act pangkat-cepat' });
  root.append(wrap);
  let base = 3;
  let target = 27;
  let mod = null;
  const host = el('div', { class: 'pk-papan' });
  const best = el('p', { class: 'reveal hint' });
  function reset() {
    host.replaceChildren();
    const sc = shortestChain(target);
    const q = squaringCost(target);
    best.replaceChildren(`${target} = ${binary(target)}₂ · kuadrat berulang ${q.total} (${q.sq} kuadrat + ${q.extra} tambahan) · cara biasa ${target - 1} · `, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Tunjukkan cara paling hemat'), (e) => { e.currentTarget.replaceWith(`paling hemat ${sc.len}: ${sc.chain.join(' → ')}`); }));
    chainBoard(host, ctx, { base, target, mod, onReach: () => ctx.sound.win() });
  }
  const seg = (items, get, set) => { const box = el('div', { class: 'seg' }); const draw = () => box.replaceChildren(...items.map(([v, l]) => onTap(el('button', { class: `seg-btn ${get() === v ? 'on' : ''}`, type: 'button' }, l), () => { set(v); draw(); reset(); }))); draw(); return box; };
  wrap.append(el('p', { class: 'prompt' }, 'Penghitung langkah pangkat'),
    seg([[2, 'pokok 2'], [3, 'pokok 3'], [5, 'pokok 5'], [7, 'pokok 7']], () => base, (v) => { base = v; }),
    seg([13, 15, 16, 23, 27, 31, 63, 100, 127].map((t) => [t, `pangkat ${t}`]), () => target, (v) => { target = v; }),
    seg([[null, 'tanpa sisa bagi'], [23, 'sisa bagi 23'], [55, 'sisa bagi 55']], () => mod, (v) => { mod = v; }),
    host, best);
  reset();
}

function createRoot(root, ctx) {
  const wrap = el('div', { class: 'act pangkat-cepat' });
  root.append(wrap);
  const area = el('div');
  const go = (N) => { area.replaceChildren(); bisectRound(area, ctx, { N, done: () => ctx.sound.win() }); };
  wrap.append(el('div', { class: 'seg' }, [2, 3, 5, 7, 10, 20].map((N) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `√${N}`), () => go(N)))), area);
  go(2);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pangkat-cepat' });
  root.append(wrap);
  let pts = [];
  let team = 0;
  let ti = 0;
  const TARGETS = [15, 27, 100, 45];
  function start(n) { pts = Array(n).fill(0); team = 0; ti = 0; play(); }
  function play() {
    if (ti >= TARGETS.length) return finishBoard(wrap, ctx, { title: 'Semua sasaran tercapai.', pts, again: () => pickTeams(wrap, 'Menuju Sasaran', start) });
    const target = TARGETS[ti];
    const head = el('div');
    const host = el('div', { class: 'pk-papan' });
    const msg = el('p', { class: 'reveal hint' }, 'Satu perkalian per giliran. Yang perkaliannya tepat menghasilkan sasaran mendapat poin.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Sasaran 3${sup(target)} · giliran Tim ${team + 1}`));
    wrap.replaceChildren(head, host, msg);
    drawHead();
    const board = chainBoard(host, ctx, {
      target,
      onMul(s) { if (s !== target) { team = (team + 1) % pts.length; drawHead(); } },
      onReach(m) {
        pts[team]++;
        board.enabled = false;
        say(msg, '', `Tim ${team + 1} sampai di 3${sup(target)}! Seluruhnya ${m} perkalian (paling hemat ${shortestChain(target).len}).`);
        team = (team + 1) % pts.length;
        ti++;
        setTimeout(play, 3000);
      },
    });
  }
  pickTeams(wrap, 'Menuju Sasaran', start);
}
