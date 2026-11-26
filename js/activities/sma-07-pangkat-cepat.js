// Pangkat Cepat dan Tebak Akar — SMA/SMK (16–18 tahun), bagi-dan-taklukkan.
// Repeated squaring and addition chains, modular exponentiation with small
// remainders, and finding √2 by halving an interval.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

// ---- Mesin Pangkat Hemat: the missions ----

// A remainder clock with m positions; buttons turn the needle.
function remClock(m) {
  let v = 0;
  const svg = el('div', { class: 'mph-jam' });
  const num = el('b', { class: 'mph-jam-angka' });
  const draw = () => {
    const ticks = Array.from({ length: m }, (_, k) => { const a = (k / m) * 2 * Math.PI - Math.PI / 2; const r1 = k % 5 === 0 ? 40 : 43; return `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}" x2="${50 + 46 * Math.cos(a)}" y2="${50 + 46 * Math.sin(a)}" stroke="#94a3b8" stroke-width="${k % 5 === 0 ? 1.6 : 0.8}"/>`; }).join('');
    const a = (v / m) * 2 * Math.PI - Math.PI / 2;
    svg.innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="Jam sisa"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#7c3aed" stroke-width="2"/>${ticks}<text x="50" y="12" font-size="6" text-anchor="middle" fill="#64748b">0</text><line x1="50" y1="50" x2="${50 + 36 * Math.cos(a)}" y2="${50 + 36 * Math.sin(a)}" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="#dc2626"/></svg>`;
    num.textContent = String(v);
  };
  const turn = (d) => { v = (v + d + m * 10) % m; draw(); };
  const btns = el('div', { class: 'mph-putar' }, [-10, -1, 1, 10].map((d) => onTap(el('button', { class: 'btn', type: 'button', 'data-putar': d }, d > 0 ? `+${d}` : `−${-d}`), () => turn(d))));
  draw();
  return { node: el('div', { class: 'mph-jam-wrap' }, svg, el('div', { class: 'mph-jam-kanan' }, el('small', null, `jam ${m} angka`), num, btns)), get value() { return v; }, set(x) { v = x; draw(); } };
}

// The merging machine. Tap two cards you have (or the same card twice); the machine makes
// a new card whose power is the sum. With mod and dial, the player sets each new remainder.
function mesin(host, ctx, { base, target, limit = null, mod = null, dial = false, label = null, onReach }) {
  let have = [{ e: 1, r: mod ? base % mod : null }];
  let slots = [];
  let muls = 0;
  let pending = null;
  let done = false;
  const cards = el('div', { class: 'mph-kartu-baris' });
  const machine = el('div', { class: 'mph-mesin' });
  const side = el('div', { class: 'mph-jam-area' });
  const info = el('p', { class: 'reveal info' });
  const B = label || String(base);
  const val = (c) => (mod ? (c.r == null ? 'sisa ?' : `sisa ${c.r}`) : big(base, c.e));
  const card = (c, extra = {}) => el('span', { class: `mph-kartu ${c.e === target ? 'sasaran' : ''}`, ...extra }, el('b', null, `${B}${sup(c.e)}`), el('small', null, val(c)));
  const draw = () => {
    fill(cards, have.map((c) => onTap(el('button', { class: `mph-kartu ${c.e === target ? 'sasaran' : ''} ${slots.includes(c) ? 'pilih' : ''}`, type: 'button', 'data-e': c.e }, el('b', null, `${B}${sup(c.e)}`), el('small', null, val(c))), () => tap(c))));
    fill(machine,
      el('span', { class: 'mph-slot' }, slots[0] ? card(slots[0]) : '·'),
      el('b', null, '×'),
      el('span', { class: 'mph-slot' }, slots[1] ? card(slots[1]) : '·'),
      el('b', null, '⚙'),
      el('span', { class: 'mph-slot hasil' }, pending ? card(pending) : '?'),
      el('span', { class: 'mph-hitung' }, `perkalian ${muls}${limit ? ` / ${limit}` : ''}`));
  };
  function tap(c) {
    if (done || pending) return;
    slots.push(c);
    if (slots.length < 2) { ctx.sound.tap(); draw(); return; }
    const [a, b] = slots;
    const s = a.e + b.e;
    if (s > target) { ctx.mistake(); shake(machine); say(info, 'bad', `${B}${sup(a.e)} × ${B}${sup(b.e)} = ${B}${sup(s)}: melewati sasaran ${B}${sup(target)}. Mesin menolak.`); slots = []; setTimeout(draw, 300); return; }
    if (have.some((x) => x.e === s)) { say(info, 'bad', `Kartu ${B}${sup(s)} sudah ada. Pilih pasangan lain.`); slots = []; draw(); return; }
    muls++;
    ctx.sound.tap();
    const nc = { e: s, r: null, from: [a, b] };
    if (mod && dial) {
      pending = nc;
      draw();
      const prod = a.r * b.r;
      say(info, 'info', `Sisa ${B}${sup(a.e)} × sisa ${B}${sup(b.e)} = ${a.r} × ${b.r} = ${prod}. Putar jarum ke sisa bagi ${prod} oleh ${mod}.`);
      const clock = remClock(mod);
      fill(side, clock.node, onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'kunci' }, '🔒 Kunci sisa'), () => {
        const want = prod % mod;
        if (clock.value !== want) { ctx.mistake(); shake(side); say(info, 'bad', `Belum. ${prod} = ${Math.floor(prod / mod)} × ${mod} + ${want}: sisanya ${want}.`); return; }
        nc.r = want;
        ctx.sound.good();
        fill(side);
        pending = null;
        add(nc);
      }));
      return;
    }
    if (mod) nc.r = (a.r * b.r) % mod;
    add(nc);
  }
  function add(nc) {
    have = [...have, nc].sort((x, y) => x.e - y.e);
    slots = [];
    draw();
    if (nc.e === target) {
      done = true;
      if (onReach) onReach(muls, nc);
      return;
    }
    if (limit && muls >= limit) { ctx.mistake(); say(info, 'bad', `Sudah ${muls} perkalian tanpa sampai ${B}${sup(target)}. Ketuk Ulang dan cari jalan lain.`); return; }
    say(info, 'info', `Kartu baru ${B}${sup(nc.e)}${mod ? ` (sisa ${nc.r})` : ''}. Sasaran ${B}${sup(target)}.`);
  }
  const reset = () => { have = [{ e: 1, r: mod ? base % mod : null }]; slots = []; muls = 0; pending = null; done = false; fill(side); draw(); say(info, 'info', 'Mulai lagi dari satu kartu.'); };
  host.append(machine, cards, side, el('div', { class: 'kode-baris' }, button('Ulang', reset)), info);
  draw();
  say(info, 'info', `Ketuk dua kartu (atau satu kartu dua kali) untuk memasukkannya ke mesin. Cara biasa butuh ${target - 1} perkalian.`);
  return { info };
}

function forgeRound(wrap, ctx, { target, limit, done }) {
  const host = el('div', { class: 'pk-papan' });
  wrap.append(host);
  const m = mesin(host, ctx, { base: 3, target, limit, onReach(muls, c) {
    if (limit && muls > limit) { ctx.mistake(); say(m.info, 'bad', `Sampai dengan ${muls} perkalian; bisa dengan ${limit}. Ketuk Ulang.`); return; }
    const q = squaringCost(target);
    say(m.info, '', `3${sup(target)} = ${big(3, target)} dengan ${muls} perkalian; cara biasa ${target - 1}. ${target} = ${binary(target)}₂: kuadrat berulang ${q.sq} + ${q.extra} = ${q.total}.`);
    done();
  } });
}

function clockRound(wrap, ctx, { base, target, mod, label, done, end }) {
  const host = el('div', { class: 'pk-papan' });
  wrap.append(host);
  const m = mesin(host, ctx, { base, target, mod, dial: true, label, onReach(muls, c) { say(m.info, '', end(c.r, muls)); done(); } });
}

function rootRound(wrap, ctx, { N, done }) {
  const { rows } = bisect(N);
  let k = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `t ada di tengah kedua penjepit. Jika t² lebih dari ${N}, akar ada di bawah t: pindahkan penjepit atas. Jika kurang, pindahkan penjepit bawah.`);
  const draw = () => {
    const r = rows[Math.min(k, rows.length - 1)];
    const lo = k < rows.length ? r.lo : r.up ? r.lo : r.t;
    const hi = k < rows.length ? r.hi : r.up ? r.t : r.hi;
    fill(stage, zoomLines(lo, hi, k < rows.length ? r.t : null, Math.floor(Math.sqrt(N))),
      el('div', { class: 'pk-akar' }, el('span', null, `Langkah ${Math.min(k + 1, rows.length)}`), el('span', null, `🗜 bawah ${dec(lo)}`), el('span', null, `🗜 atas ${dec(hi)}`), k < rows.length ? el('b', null, `t = ${dec(r.t)} · t² = ${dec(+r.t2.toFixed(4))}`) : null));
  };
  const pick = (up) => {
    if (k >= rows.length) return;
    if (rows[k].up !== up) { ctx.mistake(); shake(stage); say(msg, 'bad', `t² = ${dec(+rows[k].t2.toFixed(4))} ${rows[k].up ? 'lebih' : 'kurang'} dari ${N}, jadi penjepit ${rows[k].up ? 'atas' : 'bawah'} yang pindah ke t.`); return; }
    k++;
    ctx.sound.tap();
    draw();
    if (k === rows.length) { const last = rows.at(-1); const lo = last.up ? last.lo : last.t; say(msg, '', `√${N} ≈ ${dec(Math.floor(lo * 1000) / 1000)} setelah ${rows.length} langkah: kedua penjepit sama sampai tiga angka desimal. Setiap langkah membagi dua lebar selang.`); done(); }
  };
  draw();
  wrap.append(stage, el('div', { class: 'kode-baris' }, onTap(el('button', { class: 'btn primary', type: 'button', 'data-jepit': 'bawah' }, '🗜 Penjepit bawah ke t'), () => pick(false)), onTap(el('button', { class: 'btn primary', type: 'button', 'data-jepit': 'atas' }, '🗜 Penjepit atas ke t'), () => pick(true))), msg);
}

const HEAD07 = {
  kartu: ['Kartu Pangkat', 'Mesin mulai dengan kartu 3¹. Capai pangkat sasaran dengan kartu baru sesedikit mungkin.'],
  jam: ['Jam Sisa', 'Angka pangkatnya terlalu besar. Simpan hanya sisa baginya: putar jarum untuk setiap kartu baru.'],
  buka: ['Gembok Angka', 'Rahasia dikunci dengan pangkat 27 (sisa bagi 55). Buka dengan pangkat 3.'],
  akar: ['Pemburu Akar', 'Tanpa tombol √. Jepit akarnya di antara dua penjepit sampai tiga angka desimal sama.'],
  boss: ['Lebih Hemat dari Biner', 'Kuadrat berulang butuh 6 perkalian untuk 3¹⁵. Temukan cara dengan 5.'],
};

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
  goal: 'Murid menjalankan mesin penggabung kartu pangkat untuk mencapai pangkat sasaran dengan perkalian sesedikit mungkin, memutar jam sisa untuk menghitung sisa bagi pangkat besar dan membuka gembok angka, serta memburu akar dengan dua penjepit yang membagi dua selang.',
  extraModes: [
    { id: 'pangkat', icon: '✖️', label: 'Penghitung Langkah Pangkat', desc: 'Pilih bilangan pokok, pangkat sasaran, dan sisa bagi; bangun pangkatnya dengan mengalikan pangkat yang sudah ada dan bandingkan dengan cara biasa dan cara paling hemat', create: createPower },
    { id: 'akar', icon: '📏', label: 'Tebak Akar', desc: 'Garis bilangan dengan selang yang menyempit setiap kali memilih lebih atau kurang', create: createRoot },
    { id: 'giliran', icon: '🔁', label: 'Menuju Sasaran', desc: 'Tim bergantian menambah satu perkalian menuju pangkat sasaran; tim yang sampai tepat di sasaran mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pangkat-cepat mph-main' });
    root.append(wrap);
    const secret = ctx.rand.int(2, 54);
    const lock = powMod(secret, 27, 55);
    const N2 = ctx.rand.pick([3, 5, 7]);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD07[key], '⚡'));
      if (r === 0) { head('kartu', 1); forgeRound(wrap, ctx, { target: 16, limit: 4, done: () => next() }); }
      else if (r === 1) { head('kartu', 1); forgeRound(wrap, ctx, { target: 13, limit: 5, done: () => next() }); }
      else if (r === 2) { head('jam', 2); clockRound(wrap, ctx, { base: 5, target: 13, mod: 23, done: () => next(5200), end: (rem, m) => `5¹³ = 1.220.703.125, sisa bagi 23 = ${rem}. ${m} perkalian, dan angka yang dikalikan tidak pernah lebih dari 22.` }); }
      else if (r === 3) { head('akar', 3); rootRound(wrap, ctx, { N: 2, done: () => next(5200) }); }
      else if (r === 4) { head('kartu', 1); forgeRound(wrap, ctx, { target: 27, limit: 6, done: () => next() }); }
      else if (r === 5) { head('jam', 2); clockRound(wrap, ctx, { base: 7, target: 27, mod: 55, done: () => next(5200), end: (rem, m) => `7²⁷ bersisa ${rem} bila dibagi 55, dengan ${m} perkalian. Angka 28 ini adalah gembok untuk rahasia 7.` }); }
      else if (r === 6) { head('buka', 2); clockRound(wrap, ctx, { base: lock, target: 3, mod: 55, label: String(lock), done: () => next(5600), end: (rem) => `Gembok ${lock} terbuka: ${lock}³ bersisa ${rem}, rahasianya ${secret}! Pangkat 27 mengunci, pangkat 3 membuka: dasar sandi kunci publik (RSA).` }); }
      else if (r === 7) { head('akar', 3); rootRound(wrap, ctx, { N: N2, done: () => next(5200) }); }
      else if (r === 8) { head('kartu', 1); forgeRound(wrap, ctx, { target: 100, limit: 8, done: () => next() }); }
      else { head('boss', 'Bos'); forgeRound(wrap, ctx, { target: 15, limit: 5, done: () => next() }); }
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
