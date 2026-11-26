// Pohon Kamus Bahasa Daerah — SMA/SMK (16–18 tahun), struktur data.
// A binary search tree of Javanese words: inserting, searching with a
// comparison count, in-order traversal, skewed vs balanced trees, and deletion.

import { el, onTap, button, shake } from '../core/util.js';
import { say, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const ARTI = { alas: 'hutan', banyu: 'air', dalan: 'jalan', geni: 'api', iwak: 'ikan', jaran: 'kuda', kali: 'sungai', kebo: 'kerbau', lemah: 'tanah', lintang: 'bintang', manuk: 'burung', omah: 'rumah', sega: 'nasi', udan: 'hujan', watu: 'batu', segara: 'laut' };
export const URUTAN = ['lemah', 'dalan', 'sega', 'banyu', 'iwak', 'omah', 'watu', 'alas', 'geni', 'kali', 'manuk', 'udan', 'jaran', 'kebo', 'lintang'];

export function insert(root, w) {
  if (!root) return { w };
  let n = root;
  for (;;) {
    if (w === n.w) return root;
    const k = w < n.w ? 'l' : 'r';
    if (!n[k]) { n[k] = { w }; return root; }
    n = n[k];
  }
}
export const build = (words) => words.reduce((t, w) => insert(t, w), null);
// Nodes visited while searching; found = last node matches.
export function searchPath(root, w) {
  const path = [];
  let n = root;
  while (n) { path.push(n.w); if (w === n.w) return { path, found: true }; n = w < n.w ? n.l : n.r; }
  return { path, found: false };
}
export const height = (n) => (n ? 1 + Math.max(height(n.l), height(n.r)) : 0);
export const inorder = (n, out = []) => { if (n) { inorder(n.l, out); out.push(n.w); inorder(n.r, out); } return out; };
export function levels(root) { const c = []; const go = (n, d) => { if (!n) return; c[d] = (c[d] || 0) + 1; go(n.l, d + 1); go(n.r, d + 1); }; go(root, 0); return c; }
// Where a new word would go: parent word and side.
export function slotOf(root, w) { let n = root; for (;;) { const k = w < n.w ? 'l' : 'r'; if (!n[k]) return `${n.w}:${k}`; n = n[k]; } }
export function balancedOrder(sorted) { if (!sorted.length) return []; const m = Math.floor(sorted.length / 2); return [sorted[m], ...interleave(balancedOrder(sorted.slice(0, m)), balancedOrder(sorted.slice(m + 1)))]; }
const interleave = (a, b) => { const out = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (i < a.length) out.push(a[i]); if (i < b.length) out.push(b[i]); } return out; };
export function removeWord(root, w) {
  if (!root) return null;
  if (w < root.w) { root.l = removeWord(root.l, w); return root; }
  if (w > root.w) { root.r = removeWord(root.r, w); return root; }
  if (!root.l) return root.r;
  if (!root.r) return root.l;
  let m = root.r;
  while (m.l) m = m.l;
  root.w = m.w;
  root.r = removeWord(root.r, m.w);
  return root;
}
// Can the remaining words still fit within maxH levels?
export function feasible(root, remaining, maxH) {
  if (height(root) > maxH) return false;
  if (!root) return remaining.length <= 2 ** maxH - 1;
  const gaps = {};
  for (const w of remaining) { const k = slotOf(root, w); gaps[k] = gaps[k] || { n: 0, level: searchPath(root, w).path.length + 1 }; gaps[k].n++; }
  return Object.values(gaps).every((g) => g.n <= 2 ** (maxH - g.level + 1) - 1);
}
const clone = (n) => (n ? { w: n.w, l: clone(n.l), r: clone(n.r) } : null);

// Tree picture: x = alphabetical rank, y = depth. Empty slots sit in the gaps.
export function treeSvg(root, { lit = [], done = [], slots = false, tap = false, arti = true, dim = [], mark = {} } = {}) {
  const order = inorder(root);
  const rank = new Map(order.map((w, i) => [w, i]));
  const h = Math.max(1, height(root));
  const W = 74;
  const H = Math.min(64, 420 / h);
  const width = (order.length + 1) * W;
  const height2 = (h + (slots ? 1 : 0)) * H + 30;
  const X = (r) => W / 2 + (r + 0.5) * W;
  const Y = (d) => 26 + d * H;
  const lines = [];
  const nodes = [];
  const slotEls = [];
  const go = (n, d) => {
    const x = X(rank.get(n.w));
    const y = Y(d);
    for (const k of ['l', 'r']) {
      if (n[k]) { lines.push(`<line x1="${x}" y1="${y}" x2="${X(rank.get(n[k].w))}" y2="${Y(d + 1)}" stroke="${lit.includes(n.w) && lit.includes(n[k].w) ? '#f97316' : '#94a3b8'}" stroke-width="${lit.includes(n.w) && lit.includes(n[k].w) ? 5 : 2}"/>`); go(n[k], d + 1); } else if (slots) {
        const sx = X(rank.get(n.w) + (k === 'l' ? -0.5 : 0.5));
        lines.push(`<line x1="${x}" y1="${y}" x2="${sx}" y2="${Y(d + 1)}" stroke="#cbd5e1" stroke-dasharray="4 4" stroke-width="2"/>`);
        slotEls.push(`<g data-slot="${n.w}:${k}" class="pc-slot"><rect x="${sx - 16}" y="${Y(d + 1) - 13}" width="32" height="26" rx="6" fill="#f8fafc" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="4 3"/><text x="${sx}" y="${Y(d + 1) + 6}" font-size="16" text-anchor="middle" fill="#1d4ed8">+</text></g>`);
      }
    }
    const on = lit.includes(n.w);
    const ok = done.includes(n.w);
    const off = dim.includes(n.w);
    const tag = mark[n.w] ? `<circle cx="${x + 30}" cy="${y - 15}" r="11" fill="${mark[n.w] === '✓' ? '#16a34a' : '#1d4ed8'}"/><text x="${x + 30}" y="${y - 10}" font-size="13" font-weight="900" text-anchor="middle" fill="#fff">${mark[n.w]}</text>` : '';
    nodes.push(`<g ${tap ? `data-w="${n.w}" class="pc-ketuk"` : ''}${off ? ' opacity="0.35"' : ''}><rect x="${x - 34}" y="${y - 17}" width="68" height="${arti ? 36 : 30}" rx="8" fill="${ok ? '#bbf7d0' : on ? '#fed7aa' : off ? '#e5e7eb' : '#fff'}" stroke="${on ? '#f97316' : '#64748b'}" stroke-width="${on ? 3 : 2}"/><text x="${x}" y="${y + 1}" font-size="15" font-weight="800" text-anchor="middle" fill="#111827"${off ? ' text-decoration="line-through"' : ''}>${n.w}</text>${arti ? `<text x="${x}" y="${y + 14}" font-size="10" text-anchor="middle" fill="#64748b">${ARTI[n.w] || ''}</text>` : ''}${tag}</g>`);
  };
  if (root) go(root, 0);
  return `<svg viewBox="0 0 ${width} ${height2}" role="img" aria-label="Pohon pencarian biner">${lines.join('')}${nodes.join('')}${slotEls.join('')}</svg>`;
}
function svgBox(cls = 'pc-pohon') { return el('div', { class: cls }); }
function delegate(box, sel, fn) {
  box.addEventListener('pointerdown', (e) => { const g = e.target.closest(sel); if (!g) return; e.preventDefault(); fn(g); });
}

// ---- Kebun Pohon Kamus: the missions ----

const sisi = (k) => (k === 'l' ? 'kiri' : 'kanan');
const abjad = (a, b) => (a < b ? 'sebelum' : 'sesudah');

// Words per level, as chips: "Tingkat 1: 1 kata · …".
function tierBar(root) {
  const lv = root ? levels(root) : [];
  return el('div', { class: 'kk-tingkat' },
    ...lv.map((c, d) => el('span', null, el('small', null, `T${d + 1}`), el('b', null, String(c)))),
    el('span', { class: 'kk-tinggi' }, `${lv.length} tingkat`));
}

// Misi Tanam Daun: the next word card waits at a gate; tap ◀ sebelum or sesudah ▶
// until the card drops into an empty place.
function plantRound(wrap, ctx, { start = [], words, done, end }) {
  let root = build(start);
  let i = 0;
  let at = root;
  let path = [];
  const box = svgBox();
  const queue = el('div', { class: 'pc-datang' });
  const tiers = el('div');
  const gate = el('div', { class: 'kk-gerbang' });
  const msg = el('p', { class: 'reveal info' }, 'Di setiap gerbang: kata yang menurut abjad lebih dulu belok kiri, yang lebih akhir belok kanan.');
  const draw = (fresh = null) => {
    box.innerHTML = treeSvg(root, { lit: [...path, ...(at ? [at.w] : [])], done: fresh ? [fresh] : [] });
    fill(queue, words.map((w, k) => el('span', { class: `pc-kata ${k < i ? 'sudah' : k === i ? 'kini' : ''}` }, w)));
    fill(tiers, tierBar(root));
    if (i >= words.length) { fill(gate); return; }
    const w = words[i];
    fill(gate,
      onTap(el('button', { class: 'kk-arah', type: 'button', 'data-arah': 'l' }, el('b', null, '◀'), el('span', null, `sebelum ${at.w}`)), () => step('l')),
      el('div', { class: 'kk-daun' }, el('small', null, `di gerbang ${at.w}`), el('b', null, w), el('span', null, ARTI[w] || '')),
      onTap(el('button', { class: 'kk-arah', type: 'button', 'data-arah': 'r' }, el('span', null, `sesudah ${at.w}`), el('b', null, '▶')), () => step('r')));
  };
  function land(w, note) {
    root = insert(root, w);
    i++;
    at = root;
    path = [];
    ctx.sound.good();
    if (i === words.length) {
      draw(w);
      say(msg, '', end ? end(root) : `Semua kata tertanam: ${inorder(root).length} kata, ${height(root)} tingkat.`);
      done(root);
      return;
    }
    say(msg, 'info', note);
    draw(w);
  }
  function step(k) {
    if (i >= words.length) return;
    const w = words[i];
    const want = w < at.w ? 'l' : 'r';
    if (k !== want) { ctx.mistake(); shake(gate); say(msg, 'bad', `${w} ${abjad(w, at.w)} ${at.w} menurut abjad, jadi belok ${sisi(want)}.`); return; }
    ctx.sound.tap();
    if (!at[k]) { land(w, `${w} (${ARTI[w] || ''}) mendarat di cabang ${sisi(k)} ${at.w}. Kartu berikutnya mulai lagi dari akar.`); return; }
    path.push(at.w);
    at = at[k];
    draw();
  }
  if (!root) { root = { w: words[0] }; i = 1; at = root; say(msg, 'info', `Kebun masih kosong: ${words[0]} menjadi akar. Tanam kata berikutnya.`); }
  wrap.append(queue, box, gate, tiers, msg);
  draw(i === 1 && !start.length ? words[0] : null);
}

// Misi Kata Rahasia: tap a word; the machine only answers "ketemu", "ke kiri"
// (rahasia lebih dulu) or "ke kanan". Words that can no longer be it turn grey.
function secretRound(wrap, ctx, { root, target, known = false, done }) {
  let lo = '';
  let hi = '~';
  const guessed = [];
  const mark = {};
  let over = false;
  const box = svgBox();
  const count = el('div', { class: 'kk-tebak' });
  const msg = el('p', { class: 'reveal info' }, known ? `Buktikan apakah ${target} ada di kamus dengan tebakan sesedikit mungkin.` : 'Ketuk satu kata. Mesin menjawab: ketemu, rahasianya lebih dulu (kiri), atau lebih akhir (kanan) menurut abjad.');
  const all = inorder(root);
  const alive = () => all.filter((w) => w > lo && w < hi && !guessed.includes(w));
  const draw = () => {
    box.innerHTML = treeSvg(root, { tap: !over, lit: guessed, done: guessed.includes(target) ? [target] : [], dim: all.filter((w) => !(w > lo && w < hi) && !guessed.includes(w)), mark });
    fill(count,
      el('span', { class: 'kk-rahasia' }, known ? `🔎 ${target}` : guessed.includes(target) ? `🔓 ${target}` : '🂠 kata rahasia'),
      el('span', null, `Tebakan: `, el('b', null, String(guessed.length))),
      el('span', null, `Batas hemat: ${height(root)}`),
      known && !over ? onTap(el('button', { class: 'kk-tidak', type: 'button' }, '🚫 Tidak ada di kamus'), absent) : null);
  };
  function absent() {
    if (over) return;
    const left = alive();
    if (left.length) { ctx.mistake(); shake(count); say(msg, 'bad', `Belum pasti. Masih mungkin: ${left.join(', ')}.`); return; }
    over = true;
    ctx.sound.good();
    say(msg, 'info', `Benar: setelah ${guessed.length} tebakan (${guessed.join(', ')}) tidak ada kata yang tersisa. Sekarang tanam ${target} di tempatnya: ketuk tanda + yang tepat.`);
    box.innerHTML = treeSvg(root, { slots: true, lit: guessed, mark });
    draw2();
  }
  function draw2() {
    const want = slotOf(root, target);
    const handler = (e) => {
      const g = e.target.closest('[data-slot]');
      if (!g) return;
      e.preventDefault();
      if (g.dataset.slot !== want) { ctx.mistake(); shake(box); const [p, k] = want.split(':'); say(msg, 'bad', `Ikuti jawaban mesin: pencarian berhenti di ${p}, dan ${target} ${abjad(target, p)} ${p}, jadi cabang ${sisi(k)} ${p}.`); return; }
      box.removeEventListener('pointerdown', handler);
      root = insert(root, target);
      box.innerHTML = treeSvg(root, { done: [target], lit: guessed });
      say(msg, '', `${target} ditanam di cabang ${sisi(want.split(':')[1])} ${want.split(':')[0]}. Pencarian yang gagal sekaligus menunjukkan tempat menanam.`);
      ctx.sound.good();
      done(guessed.length);
    };
    box.addEventListener('pointerdown', handler);
    fill(count, el('span', { class: 'kk-rahasia' }, `🌱 ${target}`), el('span', null, `Tebakan: `, el('b', null, String(guessed.length))));
  }
  delegate(box, '[data-w]', (g) => {
    if (over) return;
    const w = g.dataset.w;
    if (guessed.includes(w)) return;
    if (!(w > lo && w < hi)) { ctx.mistake(); shake(box); say(msg, 'bad', `${w} sudah pasti bukan: jawaban mesin sebelumnya mencoretnya.`); return; }
    guessed.push(w);
    if (w === target) {
      over = true;
      mark[w] = '✓';
      ctx.sound.good();
      draw();
      const hemat = guessed.length <= height(root);
      say(msg, '', `Ketemu: ${target} (${ARTI[target] || ''}) setelah ${guessed.length} tebakan${hemat ? '. Hemat!' : `. Mulai dari akar dan ikuti cabang: ${searchPath(root, target).path.length} tebakan cukup.`}`);
      done(guessed.length);
      return;
    }
    ctx.sound.tap();
    if (target < w) { hi = w; mark[w] = '◀'; } else { lo = w; mark[w] = '▶'; }
    draw();
    say(msg, 'info', `${w}: ${known ? target : 'rahasianya'} ${target < w ? 'lebih dulu (ke kiri)' : 'lebih akhir (ke kanan)'}. ${alive().length} kata masih mungkin.`);
  });
  draw();
  wrap.append(count, box, msg);
}

// Misi Mesin Cetak: tap the words in the order left subtree, node, right subtree.
function printRound(wrap, ctx, { root, done }) {
  const want = inorder(root);
  const got = [];
  const box = svgBox();
  const tape = el('div', { class: 'kk-pita' });
  const msg = el('p', { class: 'reveal info' }, 'Aturan mesin: cetak seluruh cabang kiri, lalu kata di simpul, lalu seluruh cabang kanan.');
  const draw = () => {
    box.innerHTML = treeSvg(root, { done: got, tap: true });
    fill(tape, el('small', null, '🖨'), got.length ? got.map((w) => el('span', null, w)) : el('span', { class: 'kosong' }, 'kertas masih kosong'));
  };
  delegate(box, '[data-w]', (g) => {
    if (got.length >= want.length) return;
    const w = g.dataset.w;
    if (got.includes(w)) return;
    if (w !== want[got.length]) {
      ctx.mistake(); shake(box);
      const left = inorder(findNode(root, w).l).filter((x) => !got.includes(x));
      say(msg, 'bad', left.length ? `Cabang kiri ${w} belum habis dicetak: ${left.join(', ')}.` : `${w} belum boleh: masih ada kata yang harus dicetak lebih dulu.`);
      return;
    }
    got.push(w);
    ctx.sound.tap();
    draw();
    if (got.length === want.length) { say(msg, '', 'Hasil cetakan urut abjad tanpa perlu diurutkan lagi: itulah kegunaan pohon kamus.'); done(); }
  });
  draw();
  wrap.append(box, tape, msg);
}
function findNode(n, w) { while (n && n.w !== w) n = w < n.w ? n.l : n.r; return n; }

// Misi Pohon Terpendek: choose the arrival order so the tree stays within maxH levels.
function shortRound(wrap, ctx, { words, maxH, done }) {
  const sorted = [...words].sort();
  let root = null;
  const used = [];
  const box = svgBox();
  const pool = el('div', { class: 'seg pc-pool' });
  const tiers = el('div');
  const msg = el('p', { class: 'reveal info' }, `Sasaran: ${sorted.length} kata dalam ${maxH} tingkat. Kata yang ditanam lebih dulu duduk lebih tinggi.`);
  const draw = () => {
    box.innerHTML = root ? treeSvg(root, { arti: false, done: used.slice(-1) }) : '';
    fill(tiers, tierBar(root));
    fill(pool, sorted.map((w) => onTap(el('button', { class: `seg-btn ${used.includes(w) ? 'pc-pakai' : ''}`, type: 'button', disabled: used.includes(w) }, w), () => add(w))));
  };
  function add(w) {
    if (used.includes(w) || used.length === sorted.length) return;
    const next = insert(clone(root), w);
    if (!feasible(next, sorted.filter((x) => x !== w && !used.includes(x)), maxH)) {
      ctx.mistake(); shake(box);
      say(msg, 'bad', height(next) > maxH ? `Jika ${w} ditanam sekarang, pohon menjadi ${height(next)} tingkat.` : `Jika ${w} ditanam sekarang, sisa kata tidak muat dalam ${maxH} tingkat. Pilih kata yang lebih di tengah.`);
      return;
    }
    root = next;
    used.push(w);
    ctx.sound.tap();
    draw();
    say(msg, 'info', `Urutan datang: ${used.join(', ')}`);
    if (used.length === sorted.length) { say(msg, '', `${sorted.length} kata dalam ${maxH} tingkat, penuh di setiap tingkat. Urutan: ${used.join(', ')}.`); done(); }
  }
  draw();
  wrap.append(box, pool, tiers, el('div', { class: 'kode-baris' }, button('Ulang', () => { root = null; used.length = 0; draw(); say(msg, 'info', 'Mulai lagi: kata tengah dulu.'); })), msg);
}

// Misi Bos: pull out words that have two branches; tap the replacement
// (the first word of the right branch), then the tree is checked by printing.
function bossRound(wrap, ctx, done) {
  let root = build(URUTAN);
  const steps = ['dalan', 'sega'];
  let s = 0;
  const box = svgBox();
  const tape = el('div', { class: 'kk-pita' });
  const msg = el('p', { class: 'reveal info' });
  const draw = (extra = {}) => {
    box.innerHTML = treeSvg(root, { tap: s < steps.length, ...extra });
    fill(tape, el('small', null, '🖨'), inorder(root).map((w) => el('span', null, w)));
  };
  const ask = () => {
    const w = steps[s];
    const n = findNode(root, w);
    draw({ lit: [w], dim: [] });
    say(msg, 'info', `Cabut ${w}: ia punya dua cabang (${n.l.w} dan ${n.r.w}). Ketuk kata yang naik menggantikannya, yaitu kata terkecil di cabang kanannya.`);
  };
  delegate(box, '[data-w]', (g) => {
    if (s >= steps.length) return;
    const w = steps[s];
    const n = findNode(root, w);
    let m = n.r;
    while (m.l) m = m.l;
    const pick = g.dataset.w;
    if (pick === w) return;
    if (pick !== m.w) {
      let p = n.l;
      while (p.r) p = p.r;
      if (pick === p.w) { say(msg, 'info', `${pick} adalah kata terbesar di cabang kiri: itu juga menjaga urutan, tetapi aturan kebun ini memakai kata terkecil di cabang kanan.`); return; }
      ctx.mistake(); shake(box);
      say(msg, 'bad', inorder(n.r).includes(pick) ? `${pick} memang di cabang kanan ${w}, tetapi bukan yang terkecil. Dari ${n.r.w}, turun ke kiri terus sampai mentok.` : `${pick} tidak di cabang kanan ${w}. Pengganti harus lebih akhir dari semua kata kiri dan lebih dulu dari semua kata kanan.`);
      return;
    }
    root = removeWord(root, w);
    ctx.sound.good();
    s++;
    if (s < steps.length) { draw({ done: [m.w] }); say(msg, 'info', `${m.w} naik menggantikan ${w}. Cetakan di bawah tetap urut abjad.`); setTimeout(ask, 2200); return; }
    draw({ done: [m.w] });
    say(msg, '', `${m.w} naik menggantikan ${w}. Kedua kata tercabut dan cetakan masih urut abjad: aturan pohon tetap terjaga.`);
    done();
  });
  wrap.append(box, tape, msg);
  ask();
}

const HEAD04 = {
  tanam: ['Tanam Daun', 'Antar setiap kartu kata dari akar melewati gerbang sampai mendarat.'],
  rahasia: ['Kata Rahasia', 'Temukan kata yang disembunyikan mesin dengan tebakan sesedikit mungkin.'],
  segara: ['Kata yang Hilang', 'Kata segara (laut) belum dikenal. Buktikan tidak ada, lalu tanam di tempatnya.'],
  cetak: ['Mesin Cetak', 'Cetak kamus: ketuk kata sesuai aturan kiri, simpul, kanan.'],
  miring: ['Kiriman Urut Abjad', 'Hari ini kartu datang sudah urut abjad. Tanam dan lihat bentuk pohonnya.'],
  pendek: ['Pohon Terpendek', 'Atur urutan datang supaya pohon serendah mungkin.'],
  boss: ['Cabut Kata Bercabang Dua', 'Dua kata harus dicabut tanpa merusak urutan kamus.'],
};

export default {
  id: 'sma-04-pohon-cari',
  title: 'Pohon Kamus Bahasa Daerah',
  topic: 'Pohon pencarian biner: sisip, cari, telusur, dan keseimbangan',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌲',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menanam kata ke pohon pencarian biner melewati gerbang kiri–kanan, menemukan kata rahasia dengan tebakan sesedikit mungkin, mencetak kamus urut abjad dengan penelusuran kiri–simpul–kanan, membandingkan pohon miring dengan pohon terpendek, dan mencabut kata yang punya dua cabang.',
  extraModes: [
    { id: 'kamus', icon: '📖', label: 'Kamus Sendiri', desc: 'Ketik kata-kata bahasa daerah setempat dan artinya; pohon dibangun menurut urutan datang, lalu cari kata dan telusuri pohonnya', create: createOwn },
    { id: 'giliran', icon: '🔁', label: 'Pendek lawan Tinggi', desc: 'Dua tim bergantian memilih kata berikutnya: satu tim berusaha membuat pohon terpendek, tim lain tertinggi, lalu peran ditukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pohon-cari kk-main' });
    root.append(wrap);
    const full = () => build(URUTAN);
    const race = ctx.mode === 'race';
    const mix = ctx.rand.shuffle([...URUTAN]).slice(0, race ? 8 : 10);
    const secret = ctx.rand.pick(['alas', 'kebo', 'jaran', 'lintang', 'geni', 'banyu', 'manuk']);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD04[key], '🌳'));
      if (r === 0) { head('tanam', 1); plantRound(wrap, ctx, { start: ['lemah'], words: URUTAN.slice(1, 7), done: () => next() }); }
      else if (r === 1) { head('tanam', 1); plantRound(wrap, ctx, { start: URUTAN.slice(0, 7), words: URUTAN.slice(7), done: () => next(5000), end: (t) => `Kebun penuh: 15 kata dalam ${height(t)} tingkat (${levels(t).join(', ')} kata per tingkat). Kata mana pun ditemukan dengan paling banyak ${height(t)} perbandingan.` }); }
      else if (r === 2) { head('rahasia', 2); secretRound(wrap, ctx, { root: full(), target: 'watu', done: () => next(4200) }); }
      else if (r === 3) { head('cetak', 3); printRound(wrap, ctx, { root: full(), done: () => next(4200) }); }
      else if (r === 4) { head('segara', 2); secretRound(wrap, ctx, { root: full(), target: 'segara', known: true, done: () => next(4600) }); }
      else if (r === 5) { head('tanam', 1); plantRound(wrap, ctx, { words: mix, done: () => next(4600), end: (t) => `${mix.length} kata, ${height(t)} tingkat. Urutan datang yang berbeda menumbuhkan pohon yang berbeda.` }); }
      else if (r === 6) { head('rahasia', 2); secretRound(wrap, ctx, { root: full(), target: secret, done: () => next(4200) }); }
      else if (r === 7) { head('miring', 4); plantRound(wrap, ctx, { words: [...URUTAN].sort().slice(0, 6), done: () => next(6000), end: (t) => `Pohon miring: 6 kata, ${height(t)} tingkat, seperti daftar biasa. Jika 15 kata datang urut abjad, pohonnya 15 tingkat dan mencari watu butuh 15 perbandingan.` }); }
      else if (r === 8) { head('pendek', 4); shortRound(wrap, ctx, race ? { words: ['alas', 'dalan', 'iwak', 'kali', 'lemah', 'omah', 'udan'], maxH: 3, done: () => next(4600) } : { words: URUTAN, maxH: 4, done: () => next(4600) }); }
      else { head('boss', 'Bos'); bossRound(wrap, ctx, () => next(4600)); }
    }
    render();
  },
};

function parseWords(text) {
  return text.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => { const [w, a] = s.split(/\s*[=:]\s*/); return [w.toLowerCase(), a || '']; });
}

function createOwn(root, ctx) {
  const wrap = el('div', { class: 'act pohon-cari' });
  root.append(wrap);
  const area = el('textarea', { class: 'kh-masukan', rows: 2, 'aria-label': 'Kata dan arti' });
  area.value = URUTAN.map((w) => `${w}=${ARTI[w]}`).join(', ');
  area.addEventListener('pointerdown', (e) => e.stopPropagation());
  const find = el('input', { class: 'kh-masukan pc-cari', placeholder: 'kata yang dicari', 'aria-label': 'Cari' });
  find.addEventListener('pointerdown', (e) => e.stopPropagation());
  const box = svgBox();
  const info = el('p', { class: 'reveal info' });
  let tree = null;
  let timer = null;
  function rebuild() {
    clearInterval(timer);
    const list = parseWords(area.value);
    for (const [w, a] of list) if (a) ARTI[w] = a;
    tree = build(list.map((x) => x[0]));
    box.innerHTML = tree ? treeSvg(tree) : '';
    const lv = tree ? levels(tree) : [];
    info.textContent = tree ? `${inorder(tree).length} kata · ${height(tree)} tingkat · rata-rata ${(lv.reduce((s, c, d) => s + c * (d + 1), 0) / inorder(tree).length).toFixed(2).replace('.', ',')} perbandingan` : 'Tulis kata, pisahkan dengan koma. Arti boleh ditulis kata=arti.';
  }
  area.addEventListener('input', rebuild);
  find.addEventListener('input', () => {
    if (!tree) return;
    const w = find.value.trim().toLowerCase();
    if (!w) { box.innerHTML = treeSvg(tree); return; }
    const { path, found } = searchPath(tree, w);
    box.innerHTML = treeSvg(tree, { lit: path });
    info.textContent = found ? `${w} ditemukan: ${path.length} perbandingan (${path.join(' → ')}).` : `${w} tidak ada: ${path.length} perbandingan. Akan disisipkan sebagai cabang ${slotOf(tree, w).endsWith(':l') ? 'kiri' : 'kanan'} ${path.at(-1)}.`;
  });
  function walk() {
    clearInterval(timer);
    if (!tree) return;
    const seq = inorder(tree);
    let k = 0;
    timer = setInterval(() => {
      if (!wrap.isConnected || k > seq.length) { clearInterval(timer); return; }
      box.innerHTML = treeSvg(tree, { done: seq.slice(0, k), lit: k < seq.length ? [seq[k]] : [] });
      info.textContent = seq.slice(0, k).join(', ') || '…';
      k++;
    }, 650);
  }
  wrap.append(el('p', { class: 'prompt' }, 'Kamus sendiri: kata dimasukkan menurut urutan tulis.'), area,
    el('div', { class: 'kode-baris' }, find, button('Telusuri berurutan', walk, 'primary'), button('Acak urutan', () => { area.value = ctx.rand.shuffle(parseWords(area.value)).map(([w, a]) => (a ? `${w}=${a}` : w)).join(', '); rebuild(); }), button('Urut abjad', () => { area.value = parseWords(area.value).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([w, a]) => (a ? `${w}=${a}` : w)).join(', '); rebuild(); })),
    box, info);
  rebuild();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pohon-cari' });
  root.append(wrap);
  const pts = [0, 0];
  let game = 0;
  function play() {
    if (game >= 2) return finishBoard(wrap, ctx, { title: 'Dua babak selesai. Poin: tinggi pohon saat menjadi Tim Tinggi, ditambah 16 − tinggi saat menjadi Tim Pendek.', pts, again: () => { pts[0] = 0; pts[1] = 0; game = 0; play(); } });
    const tall = game % 2;
    const words = [...URUTAN].sort();
    let tree = null;
    const used = [];
    let turn = 0;
    const box = svgBox();
    const pool = el('div', { class: 'seg pc-pool' });
    const head = el('div');
    const msg = el('p', { class: 'reveal info' }, `Babak ${game + 1}: Tim ${tall + 1} ingin pohon setinggi mungkin, Tim ${2 - tall} sependek mungkin.`);
    const draw = () => {
      head.replaceChildren(scoreBar(pts, turn % 2), el('p', { class: 'prompt' }, `Giliran Tim ${(turn % 2) + 1} (${turn % 2 === tall ? 'Tinggi' : 'Pendek'}) memilih kata berikutnya · tinggi sekarang ${height(tree)}`));
      box.innerHTML = tree ? treeSvg(tree, { arti: false }) : '';
      pool.replaceChildren(...words.map((w) => onTap(el('button', { class: `seg-btn ${used.includes(w) ? 'pc-pakai' : ''}`, type: 'button', disabled: used.includes(w) }, w), () => {
        if (used.includes(w)) return;
        tree = insert(tree, w); used.push(w); turn++; ctx.sound.tap(); draw();
        if (used.length === words.length) {
          const h = height(tree);
          pts[tall] += h; pts[1 - tall] += 16 - h;
          say(msg, '', `Tinggi akhir ${h}. Tim ${tall + 1} +${h}, Tim ${2 - tall} +${16 - h}.`);
          game++;
          setTimeout(play, 3200);
        }
      })));
    };
    wrap.replaceChildren(head, box, pool, msg);
    draw();
  }
  play();
}
