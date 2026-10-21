// Pohon Kamus Bahasa Daerah — SMA/SMK (16–18 tahun), struktur data.
// A binary search tree of Javanese words: inserting, searching with a
// comparison count, in-order traversal, skewed vs balanced trees, and deletion.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, scoreBar, finishBoard } from './sma-kit.js';

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
export function treeSvg(root, { lit = [], done = [], slots = false, tap = false, arti = true } = {}) {
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
    nodes.push(`<g ${tap ? `data-w="${n.w}" class="pc-ketuk"` : ''}><rect x="${x - 34}" y="${y - 17}" width="68" height="${arti ? 36 : 30}" rx="8" fill="${ok ? '#bbf7d0' : on ? '#fed7aa' : '#fff'}" stroke="${on ? '#f97316' : '#64748b'}" stroke-width="${on ? 3 : 2}"/><text x="${x}" y="${y + 1}" font-size="15" font-weight="800" text-anchor="middle" fill="#111827">${n.w}</text>${arti ? `<text x="${x}" y="${y + 14}" font-size="10" text-anchor="middle" fill="#64748b">${ARTI[n.w] || ''}</text>` : ''}</g>`);
  };
  if (root) go(root, 0);
  return `<svg viewBox="0 0 ${width} ${height2}" role="img" aria-label="Pohon pencarian biner">${lines.join('')}${nodes.join('')}${slotEls.join('')}</svg>`;
}
function svgBox(cls = 'pc-pohon') { return el('div', { class: cls }); }
function delegate(box, sel, fn) {
  box.addEventListener('pointerdown', (e) => { const g = e.target.closest(sel); if (!g) return; e.preventDefault(); fn(g); });
}

// Place each arriving word by tapping its empty slot.
function insertRound(wrap, ctx, { start, words, done }) {
  let root = build(start);
  let i = 0;
  const box = svgBox();
  const head = el('div', { class: 'pc-datang' });
  const msg = el('p', { class: 'reveal info' }, 'Kiri: sebelum menurut abjad. Kanan: sesudahnya. Ketuk tempat kosong (+) yang tepat.');
  const draw = () => {
    box.innerHTML = treeSvg(root, { slots: i < words.length });
    head.replaceChildren(...words.map((w, k) => el('span', { class: `pc-kata ${k < i ? 'sudah' : k === i ? 'kini' : ''}` }, w)));
  };
  delegate(box, '[data-slot]', (g) => {
    if (i >= words.length) return;
    const w = words[i];
    const want = slotOf(root, w);
    if (g.dataset.slot !== want) {
      const [p, k] = g.dataset.slot.split(':');
      ctx.mistake(); shake(box);
      say(msg, 'bad', `${w} tidak bisa menjadi cabang ${k === 'l' ? 'kiri' : 'kanan'} ${p}. Mulai dari akar: ${searchPath(root, w).path.map((x) => `${x} → ${w < x ? 'kiri' : 'kanan'}`).join(', ')}.`);
      return;
    }
    root = insert(root, w);
    i++;
    ctx.sound.tap();
    say(msg, 'info', `${w} (${ARTI[w] || ''}) masuk.`);
    draw();
    if (i === words.length) { say(msg, '', `Pohon berisi ${inorder(root).length} kata, ${height(root)} tingkat.`); done(root); }
  });
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Sisipkan kata-kata yang datang ke pohon pencarian biner.'), head, box, msg);
}

// Search by tapping the nodes visited.
function searchRound(wrap, ctx, { root, target, done }) {
  const want = searchPath(root, target).path;
  const lit = [];
  const box = svgBox();
  const msg = el('p', { class: 'reveal info' }, 'Mulai dari akar. Ketuk simpul yang diperiksa, satu per satu.');
  const draw = () => { box.innerHTML = treeSvg(root, { lit, tap: true }); };
  delegate(box, '[data-w]', (g) => {
    if (lit.length >= want.length) return;
    const w = g.dataset.w;
    if (w !== want[lit.length]) { ctx.mistake(); shake(box); say(msg, 'bad', lit.length ? `Dari ${lit.at(-1)}, ${target} ${target < lit.at(-1) ? 'sebelum' : 'sesudah'} ${lit.at(-1)}: ke ${target < lit.at(-1) ? 'kiri' : 'kanan'}.` : 'Pencarian selalu dimulai dari akar.'); return; }
    lit.push(w);
    ctx.sound.tap();
    draw();
    say(msg, 'info', `${lit.length} perbandingan.`);
    if (lit.length === want.length) { say(msg, '', `${target} ditemukan setelah ${want.length} perbandingan: ${want.join(' → ')}.`); done(); }
  });
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Cari kata ${target} (${ARTI[target]}).`), box, msg);
}

// Tap the nodes in traversal order (left, node, right).
function traverseRound(wrap, ctx, { root, done }) {
  const want = inorder(root);
  const got = [];
  const box = svgBox();
  const out = el('div', { class: 'au-status pc-cetak' }, '…');
  const msg = el('p', { class: 'reveal info' }, 'Telusuri cabang kiri, tulis kata di simpul, lalu telusuri cabang kanan.');
  const draw = () => { box.innerHTML = treeSvg(root, { done: got, tap: true }); out.textContent = got.join(', ') || '…'; };
  delegate(box, '[data-w]', (g) => {
    if (got.length >= want.length) return;
    if (g.dataset.w !== want[got.length]) { ctx.mistake(); shake(box); say(msg, 'bad', `Belum. Simpul ${g.dataset.w} ditulis setelah seluruh cabang kirinya selesai.`); return; }
    got.push(g.dataset.w);
    ctx.sound.tap();
    draw();
    if (got.length === want.length) { say(msg, '', 'Hasilnya urut abjad: kamus bisa dicetak tanpa diurutkan ulang.'); done(); }
  });
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Cetak kamus: ketuk kata sesuai urutan penelusuran.'), box, out, msg);
}

// Choose the arrival order to get a tree of 4 levels.
function shortRound(wrap, ctx, { done }) {
  const words = [...URUTAN].sort();
  let root = null;
  let used = [];
  const box = svgBox();
  const pool = el('div', { class: 'seg pc-pool' });
  const msg = el('p', { class: 'reveal info' }, 'Petunjuk: masukkan kata tengah lebih dulu.');
  const draw = () => {
    box.innerHTML = root ? treeSvg(root, { arti: false }) : '';
    pool.replaceChildren(...words.map((w) => onTap(el('button', { class: `seg-btn ${used.includes(w) ? 'pc-pakai' : ''}`, type: 'button', disabled: used.includes(w) }, w), () => add(w))));
  };
  function add(w) {
    if (used.includes(w)) return;
    const next = insert(clone(root), w);
    if (!feasible(next, words.filter((x) => x !== w && !used.includes(x)), 4)) { ctx.mistake(); shake(box); say(msg, 'bad', height(next) > 4 ? `Jika ${w} masuk sekarang, pohon menjadi ${height(next)} tingkat. Pilih kata lain.` : `Jika ${w} masuk sekarang, kata-kata sisanya tidak akan muat dalam 4 tingkat. Pilih kata yang lebih di tengah.`); return; }
    root = next;
    used.push(w);
    ctx.sound.tap();
    draw();
    say(msg, 'info', `Urutan datang: ${used.join(', ')}`);
    if (used.length === words.length) { say(msg, '', `Pohon 4 tingkat dengan 15 kata: penuh, 1 + 2 + 4 + 8. Urutan: ${used.join(', ')}.`); done(); }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pilih urutan datang supaya pohon hanya 4 tingkat.'), box, pool, el('div', { class: 'kode-baris' }, button('Ulang', () => { root = null; used = []; draw(); })), msg);
}

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
  goal: 'Murid menyisipkan kata ke pohon pencarian biner, mencari kata sambil menghitung perbandingan, menelusuri pohon untuk mencetak kamus urut abjad, membandingkan pohon miring dengan pohon seimbang, dan menghapus kata yang punya dua cabang.',
  extraModes: [
    { id: 'kamus', icon: '📖', label: 'Kamus Sendiri', desc: 'Ketik kata-kata bahasa daerah setempat dan artinya; pohon dibangun menurut urutan datang, lalu cari kata dan telusuri pohonnya', create: createOwn },
    { id: 'giliran', icon: '🔁', label: 'Pendek lawan Tinggi', desc: 'Dua tim bergantian memilih kata berikutnya: satu tim berusaha membuat pohon terpendek, tim lain tertinggi, lalu peran ditukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pohon-cari' });
    root.append(wrap);
    const full = build(URUTAN);
    const targets = ctx.rand.shuffle(['watu', 'alas', 'kebo', 'jaran', 'lintang', 'udan']);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const pic = (t, o) => el('div', { class: 'pc-pohon kecil', html: treeSvg(t, o) });
      if (r === 0) insertRound(wrap, ctx, { start: ['lemah'], words: URUTAN.slice(1, 7), done: next });
      else if (r === 1) insertRound(wrap, ctx, { start: URUTAN.slice(0, 7), words: URUTAN.slice(7), done: next });
      else if (r === 2) searchRound(wrap, ctx, { root: full, target: targets[0], done: next });
      else if (r === 3) ask('Kata segara (laut) belum ada. Berapa perbandingan sampai yakin tidak ada, dan di mana segara disisipkan?', [['4 perbandingan (lemah, sega, watu, udan); cabang kiri udan', true], ['2 perbandingan; cabang kiri sega'], ['4 perbandingan; cabang kanan sega'], ['15 perbandingan; di akhir daftar']], 1, pic(full, { lit: searchPath(full, 'segara').path, arti: false }));
      else if (r === 4) ask('Banyak kata per tingkat: 1, 2, 4, 5, 3. Berapa rata-rata perbandingan di pohon, dibanding mencari di daftar menurut urutan datang?', [['Pohon 52 : 15 ≈ 3,47; daftar 120 : 15 = 8', true], ['Pohon 15 : 5 = 3; daftar 15'], ['Pohon 5; daftar 8'], ['Pohon 3,47; daftar 3,47']], 1, pic(full, { arti: false }));
      else if (r === 5) traverseRound(wrap, ctx, { root: full, done: next });
      else if (r === 6) ask('Kini kata-kata datang sudah urut abjad: alas, banyu, dalan, …, watu. Seperti apa pohonnya?', [['Garis miring ke kanan, 15 tingkat; mencari watu butuh 15 perbandingan, sama saja dengan daftar', true], ['Pohon seimbang 4 tingkat'], ['Garis miring ke kiri, 15 tingkat'], ['Pohon 5 tingkat, sama seperti soal 1']], 1, pic(build([...URUTAN].sort().slice(0, 5)), { arti: false }));
      else if (r === 7) shortRound(wrap, ctx, { done: next });
      else if (r === 8) ask('Pohon seimbang dengan t tingkat memuat paling banyak 2ᵗ − 1 kata. Kamus 1.000 kata dan 1.000.000 kata butuh paling sedikit berapa tingkat?', [['10 tingkat dan 20 tingkat', true], ['100 tingkat dan 1.000 tingkat'], ['10 tingkat dan 100 tingkat'], ['500 tingkat dan 500.000 tingkat']], 1, null,
        then(() => ask('Mencari satu kata dari 1.000.000 kata satu per satu di daftar butuh rata-rata berapa perbandingan?', [['Sekitar 500.000, sedangkan di pohon seimbang paling banyak 20', true], ['20, sama dengan pohon'], ['1.000'], ['Sekitar 10']])));
      else {
        const after = removeWord(clone(full), 'dalan');
        ask('Tantangan: dalan punya dua cabang dan akan dihapus. Ganti dengan kata terkecil di cabang kanannya. Kata penggantinya?', [['geni', true], ['banyu'], ['iwak'], ['alas']], 2, pic(full, { lit: ['dalan', 'iwak', 'geni'], arti: false }),
          () => { wrap.append(pic(after, { lit: ['geni'], arti: false }), el('p', { class: 'reveal' }, `Penelusuran: ${inorder(after).join(', ')}. Masih urut abjad.`)); next(); });
      }
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
