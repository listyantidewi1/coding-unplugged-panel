// Kode Paling Hemat — SMA/SMK (16–18 tahun), kompresi dan teori informasi.
// Letter frequencies in a pantun, building a Huffman tree by merging the two
// smallest cards, prefix codes, decoding bit by bit, and comparing with fixed
// codes, Morse and Shannon's bound.

import { el, onTap, button, shake } from '../core/util.js';
import { misiHead, fill } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const PANTUN = ['Anak kancil makan nanas,', 'Nanas manis di kala siang,', 'Kalau sudah lama malas,', 'Ilmu hilang kawan pun hilang.'];
export function countLetters(text) {
  const f = {};
  for (const c of text.toUpperCase()) if (/[A-Z0-9]/.test(c)) f[c] = (f[c] || 0) + 1;
  return f;
}
export const FREQ = countLetters(PANTUN.join(' '));
// Bu Guru's code (one valid Huffman code for the pantun).
export const CODE = { A: '10', I: '000', L: '001', N: '111', U: '0100', M: '0101', K: '0111', S: '1100', G: '01101', H: '11010', C: '011000', P: '011001', W: '110110', D: '110111' };
export const MESSAGE = ['0101101110001100', '00000101010100'];

let nextId = 1;
const leaf = (ch, w) => ({ id: nextId++, w, ch });
const join = (l, r) => ({ id: nextId++, w: l.w + r.w, l, r });
const byWeight = (a, b) => a.w - b.w || a.id - b.id;
export const leavesOf = (freq) => Object.entries(freq).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([c, w]) => leaf(c, w));

// Deterministic Huffman: always merge the two smallest (older node first on ties).
export function huffman(freq) {
  let roots = leavesOf(freq);
  if (roots.length === 1) return roots[0];
  while (roots.length > 1) {
    roots.sort(byWeight);
    const [a, b, ...rest] = roots;
    roots = [...rest, join(a, b)];
  }
  return roots[0];
}
export function codesOf(root, pre = '', out = {}) {
  if (root.ch) out[root.ch] = pre || '0';
  else { codesOf(root.l, `${pre}0`, out); codesOf(root.r, `${pre}1`, out); }
  return out;
}
export const totalBits = (freq, codes) => Object.entries(freq).reduce((t, [c, f]) => t + f * codes[c].length, 0);
export const isPrefixFree = (codes) => { const v = Object.values(codes); return v.every((a) => v.every((b) => a === b || !b.startsWith(a))); };
export const entropy = (freq) => { const n = Object.values(freq).reduce((a, b) => a + b, 0); return Object.values(freq).reduce((h, f) => h - (f / n) * Math.log2(f / n), 0); };
export const fixedBits = (k) => Math.max(1, Math.ceil(Math.log2(k)));
// Decode a bit string with a code table; returns { text, rest } (rest = undecodable tail).
export function decodeBits(bits, codes) {
  const inv = Object.fromEntries(Object.entries(codes).map(([c, b]) => [b, c]));
  let text = '';
  let cur = '';
  for (const b of bits) { cur += b; if (inv[cur]) { text += inv[cur]; cur = ''; } }
  return { text, rest: cur };
}
// Turn a code table into a tree (for the decoder).
export function trieOf(codes) {
  const root = { id: nextId++, w: 0 };
  for (const [c, bits] of Object.entries(codes)) {
    let n = root;
    for (const [i, b] of [...bits].entries()) {
      const k = b === '0' ? 'l' : 'r';
      if (!n[k]) n[k] = i === bits.length - 1 ? { id: nextId++, w: 0, ch: c } : { id: nextId++, w: 0 };
      n = n[k];
    }
  }
  const fill = (n) => { if (!n.ch) n.w = fill(n.l) + fill(n.r); else n.w = FREQ[n.ch] || 0; return n.w; };
  fill(root);
  return root;
}

// Dendrogram: letters on the baseline, each merged card above its children.
export function forestSvg(roots, { sel = new Set(), path = new Set(), bits = false, clickable = false } = {}) {
  let x = 0;
  const pos = new Map();
  let maxH = 0;
  const place = (n) => {
    if (n.ch) { pos.set(n.id, { x: x++, h: 0 }); return 0; }
    const hl = place(n.l);
    const hr = place(n.r);
    const h = Math.max(hl, hr) + 1;
    pos.set(n.id, { x: (pos.get(n.l.id).x + pos.get(n.r.id).x) / 2, h });
    maxH = Math.max(maxH, h);
    return h;
  };
  roots.forEach((r) => { place(r); x += 0.35; });
  const W = 44;
  const H = Math.min(46, 260 / Math.max(1, maxH));
  const width = Math.max(1, x - 0.35) * W + 10;
  const height = maxH * H + 70;
  const P = (n) => { const p = pos.get(n.id); return [5 + W / 2 + p.x * W, height - 32 - p.h * H]; };
  const parts = [];
  const nodes = [];
  const rootIds = new Set(roots.map((r) => r.id));
  const draw = (n) => {
    const [px, py] = P(n);
    if (!n.ch) {
      for (const [k, c] of [['l', '0'], ['r', '1']]) {
        const [cx, cy] = P(n[k]);
        const on = path.has(n.id) && path.has(n[k].id);
        parts.push(`<path d="M${px} ${py} L${cx} ${py} L${cx} ${cy}" fill="none" stroke="${on ? '#f97316' : '#94a3b8'}" stroke-width="${on ? 4 : 2}"/>`);
        if (bits) parts.push(`<text x="${cx + (c === '0' ? -7 : 7)}" y="${py + 15}" font-size="12" font-weight="800" text-anchor="middle" fill="${c === '0' ? '#1d4ed8' : '#b91c1c'}">${c}</text>`);
        draw(n[k]);
      }
    }
    const isSel = sel.has(n.id);
    const canTap = clickable && rootIds.has(n.id);
    const fill = isSel ? '#fde68a' : path.has(n.id) ? '#fed7aa' : n.ch ? '#fff' : '#e0e7ff';
    const stroke = isSel ? '#d97706' : canTap ? '#1d4ed8' : '#94a3b8';
    const shape = n.ch
      ? `<rect x="${px - 18}" y="${py - 14}" width="36" height="40" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${canTap ? 3 : 2}"/><text x="${px}" y="${py + 4}" font-size="17" font-weight="900" text-anchor="middle" fill="#111827">${n.ch}</text><text x="${px}" y="${py + 21}" font-size="11" text-anchor="middle" fill="#475569">${n.w}</text>`
      : `<circle cx="${px}" cy="${py}" r="15" fill="${fill}" stroke="${stroke}" stroke-width="${canTap ? 3 : 2}"/><text x="${px}" y="${py + 5}" font-size="13" font-weight="800" text-anchor="middle" fill="#111827">${n.w}</text>`;
    nodes.push(`<g ${canTap ? `data-id="${n.id}" class="kh-ketuk"` : ''}>${shape}</g>`);
  };
  roots.forEach(draw);
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Pohon Huffman">${parts.join('')}${nodes.join('')}</svg>`;
}

// Tap two root cards to merge them. Only the two smallest are accepted.
function mergeBoard(host, { freq, onPick, onDone }) {
  let roots = leavesOf(freq);
  let sel = null;
  let total = 0;
  const board = { enabled: true, get roots() { return roots; }, get total() { return total; } };
  const pic = el('div', { class: 'kh-pohon' });
  pic.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-id]');
    if (!g || !board.enabled) return;
    e.preventDefault();
    tap(Number(g.dataset.id));
  });
  const info = el('p', { class: 'reveal info' });
  function draw() {
    pic.innerHTML = forestSvg(roots, { sel: new Set(sel ? [sel] : []), clickable: roots.length > 1, bits: roots.length === 1 });
    info.textContent = roots.length > 1 ? `${roots.length} kartu · ${leavesOf(freq).length - roots.length} penggabungan · bit sejauh ini: ${total}` : `Pohon selesai · total ${total} bit`;
  }
  function tap(id) {
    if (sel === null) { sel = id; draw(); return; }
    if (sel === id) { sel = null; draw(); return; }
    const a = roots.find((r) => r.id === sel);
    const b = roots.find((r) => r.id === id);
    sel = null;
    const sorted = [...roots].sort(byWeight);
    const want = [sorted[0].w, sorted[1].w];
    const got = [a.w, b.w].sort((x, y) => x - y);
    const ok = got[0] === want[0] && got[1] === want[1];
    if (ok) {
      const m = join(a, b);
      total += m.w;
      roots = [...roots.filter((r) => r !== a && r !== b), m].sort(byWeight);
    }
    draw();
    onPick(ok, got, want);
    if (ok && roots.length === 1) onDone(roots[0], total);
  }
  host.append(pic, info);
  draw();
  return board;
}

function codeTable(codes, freq, highlight = null) {
  const keys = Object.keys(codes).sort((a, b) => codes[a].length - codes[b].length || a.localeCompare(b));
  return el('div', { class: 'kh-kode' }, keys.map((c) => el('div', { class: `kh-sel ${highlight === c ? 'on' : ''}` }, el('b', null, c), el('code', null, codes[c]), freq ? el('small', null, `${freq[c]} × ${codes[c].length} = ${freq[c] * codes[c].length}`) : null)));
}


// ---------- Permainan: Chip Papan Berjalan ----------
// The team are technicians of the school's scrolling sign. Its chip holds 300
// bits for one pantun: build the Huffman tree with cards while a chip meter
// fills, walk the tree to read messages, write letters in bits, and find every
// way to read a code that needs separators.

export const SHORT = 'KAKAK MAKAN NANAS';
const WORDS = ['KAWAN', 'SIANG', 'NANAS', 'MALAS'];
const SECRET = ['KANCIL', 'HILANG', 'SIANG', 'KAWAN', 'MALAS', 'ILMU'];
export const RAKA = { A: '0', N: '1', L: '01' };
export const MORSE = { E: '•', T: '—', A: '•—', N: '—•', S: '•••', V: '•••—', I: '••', U: '••—' };
// Every way to split `bits` into codes.
export function parses(bits, codes, pre = []) {
  if (!bits) return [pre];
  return Object.entries(codes).filter(([, c]) => bits.startsWith(c)).flatMap(([ch, c]) => parses(bits.slice(c.length), codes, [...pre, ch]));
}

// Horizontal chip meter with marks: [[value, label, cls]].
function chipMeter(max, marks, limit = Infinity) {
  const bar = el('i', { class: 'kh-meter-isi' });
  const num = el('b');
  const node = el('div', { class: 'kh-meter' }, el('small', null, '📟 Meteran chip'),
    el('div', { class: 'kh-meter-skala' }, bar, marks.map(([v, l, cls]) => el('span', { class: `kh-tanda ${cls || ''}`, style: { left: `${(v / max) * 100}%` } }, el('small', null, l)))), num);
  return {
    node,
    set(v) { bar.style.width = `${Math.min(100, (v / max) * 100)}%`; num.textContent = `${v} bit`; node.classList.toggle('lewat', v > limit); },
  };
}

// Misi 1 · Gabung Kartu.
function chipRound(wrap, ctx, { freq, long, done }) {
  const n = Object.values(freq).reduce((a, b) => a + b, 0);
  const k = Object.keys(freq).length;
  const fb = fixedBits(k);
  const meter = long
    ? chipMeter(420, [[300, '🔴 batas chip 300', 'batas'], [336, 'kode 4 bit: 336'], [420, 'kode 5 bit: 420']], 300)
    : chipMeter(n * fb, [[n * fb, `kode ${fb} bit: ${n * fb}`]]);
  meter.set(0);
  const msg = el('p', { class: 'reveal info' }, 'Ketuk dua kartu dengan nilai terkecil. Nilai kartu gabungan masuk ke meteran chip.');
  const host = el('div', { class: 'kh-papan' });
  wrap.append(...[long ? null : el('div', { class: 'au-status' }, SHORT), meter.node, host, msg].filter(Boolean));
  const board = mergeBoard(host, {
    freq,
    onPick(ok, got, want) {
      if (ok) { ctx.sound.tap(); meter.set(board.total); say(msg, 'info', `Gabung ${got[0]} + ${got[1]} = ${got[0] + got[1]}. Meteran naik ${got[0] + got[1]} bit.`); return; }
      ctx.mistake(); shake(host);
      say(msg, 'bad', `${got[0]} dan ${got[1]} bukan dua yang terkecil. Yang terkecil sekarang ${want[0]} dan ${want[1]}.`);
    },
    onDone(rootNode, total) {
      meter.set(total);
      say(msg, '', long ? `Pohon selesai: ${total} bit, muat di chip 300 bit! Kode tetap 5 bit (420) dan 4 bit (336) tidak muat.` : `Pohon selesai: ${total} bit, lebih hemat dari kode tetap ${fb} bit (${n * fb}).`);
      done();
    },
  });
}

// Misi 2 · Turuni Pohon: follow the bits from the root; every leaf is a letter.
function descendRound(wrap, ctx, word, done) {
  const bits = [...word].map((c) => CODE[c]).join('');
  const tree = trieOf(CODE);
  let pos = 0;
  let node = tree;
  let path = [tree.id];
  let out = '';
  let busy = false;
  const pic = el('div', { class: 'kh-pohon' });
  const tape = el('div', { class: 'kh-bit kh-pita' });
  const word$ = el('div', { class: 'au-status kh-kata' });
  const msg = el('p', { class: 'reveal info' }, 'Token di puncak pohon. Baca bit berikutnya: 0 turun ke kiri, 1 turun ke kanan.');
  function draw() {
    pic.innerHTML = forestSvg([tree], { bits: true, path: new Set(path) });
    fill(tape, [...bits].map((b, i) => el('span', { class: i < pos ? 'kh-habis' : i === pos ? 'kh-kini' : '' }, b)));
    word$.textContent = out || '…';
  }
  function go(b) {
    if (busy || pos >= bits.length) return;
    if (b !== bits[pos]) { ctx.mistake(); say(msg, 'bad', `Bit berikutnya ${bits[pos]}, jadi turun ke ${bits[pos] === '0' ? 'kiri' : 'kanan'}.`); return; }
    node = b === '0' ? node.l : node.r; path.push(node.id); pos += 1; ctx.sound.tap();
    if (node.ch) {
      out += node.ch;
      say(msg, 'info', `Sampai di daun ${node.ch}. Token kembali ke puncak.`);
      if (pos === bits.length) { draw(); say(msg, '', `Pesannya: ${out}. Tidak perlu jeda, karena setiap huruf ada di ujung cabang.`); done(); return; }
      busy = true; draw();
      setTimeout(() => { node = tree; path = [tree.id]; busy = false; draw(); }, 650);
      return;
    }
    draw();
  }
  draw();
  wrap.append(pic, tape, el('div', { class: 'kh-turun' },
    onTap(el('button', { class: 'kpb-cap besar kh-nol', type: 'button', 'data-b': '0' }, '⬋ 0 kiri'), () => go('0')),
    word$,
    onTap(el('button', { class: 'kpb-cap besar kh-satu', type: 'button', 'data-b': '1' }, 'kanan 1 ⬊'), () => go('1'))), msg);
}

// Misi 3 · Susun Surat: pick the bit piece for each letter; some pieces are decoys.
function composeRound(wrap, ctx, word, done) {
  const need = [...new Set(word)];
  const decoys = ctx.rand.shuffle(Object.keys(CODE).filter((c) => !need.includes(c))).slice(0, 3);
  const pieces = ctx.rand.shuffle([...need, ...decoys].map((c) => CODE[c]));
  let k = 0;
  const msg = el('p', { class: 'reveal info' }, `Tulis ${word} dalam bit: ketuk potongan kode huruf demi huruf. Ada potongan pengecoh.`);
  const board = el('div', { class: 'kh-surat' });
  function draw() {
    fill(board,
      el('div', { class: 'kh-slot-slot' }, [...word].map((c, i) => el('div', { class: `kh-slot ${i < k ? 'isi' : i === k ? 'kini' : ''}` }, el('b', null, c), el('code', null, i < k ? CODE[c] : '…')))),
      el('div', { class: 'kh-bit' }, [...word].slice(0, k).map((c) => CODE[c]).join('') || '…'),
      k < word.length ? el('div', { class: 'kpb-opsi' }, pieces.map((p) => onTap(el('button', { class: 'kpb-cap kh-potong', type: 'button', 'data-p': p }, p), () => put(p)))) : null);
  }
  function put(p) {
    if (k >= word.length) return;
    const want = word[k];
    if (p !== CODE[want]) {
      const who = Object.keys(CODE).find((c) => CODE[c] === p);
      ctx.mistake(); say(msg, 'bad', `${p} adalah kode ${who}, bukan ${want}.`); return;
    }
    k += 1; ctx.sound.tap();
    if (k === word.length) { draw(); say(msg, '', `${word} = ${[...word].map((c) => CODE[c]).join('')} (${[...word].map((c) => CODE[c]).join('').length} bit).`); done(); return; }
    say(msg, 'info', `Bagus. Sekarang huruf ${word[k]}.`); draw();
  }
  draw();
  wrap.append(codeTable(CODE), board, msg);
}

// Misi 4 · Banyak Cara Baca: place cut lines; every new valid reading joins the list.
function readingsRound(wrap, ctx, { bits, codes, done, end }) {
  const all = parses(bits, codes).map((p) => p.join(''));
  const cuts = new Set();
  const found = [];
  const msg = el('p', { class: 'reveal info' }, `Ketuk ✂ di antara simbol untuk memotong, lalu tekan Baca. Temukan semua ${all.length} cara baca.`);
  const board = el('div', { class: 'kh-surat' });
  const segs = () => { const out = []; let s = 0; for (let i = 1; i <= bits.length; i++) if (i === bits.length || cuts.has(i)) { out.push(bits.slice(s, i)); s = i; } return out; };
  const inv = Object.fromEntries(Object.entries(codes).map(([c, b]) => [b, c]));
  function read() {
    if (found.length === all.length) return;
    const s = segs();
    const bad = s.findIndex((x) => !inv[x]);
    if (bad >= 0) { ctx.mistake(); say(msg, 'bad', `Potongan "${s[bad]}" bukan kode huruf mana pun.`); return; }
    const w = s.map((x) => inv[x]).join('');
    if (found.includes(w)) { say(msg, 'info', `${w} sudah ada di daftar. Coba potongan lain.`); return; }
    found.push(w); ctx.sound.good(); cuts.clear();
    if (found.length === all.length) { draw(); say(msg, '', end); done(); return; }
    say(msg, 'info', `Cara baca baru: ${w}. ${all.length - found.length} lagi.`); draw();
  }
  function draw() {
    let piece = 0;
    fill(board,
      el('div', { class: 'kh-kode' }, Object.entries(codes).map(([c, b]) => el('div', { class: 'kh-sel' }, el('b', null, c), el('code', null, b)))),
      el('div', { class: 'kpb-pita' }, el('small', null, 'Pesan tanpa jeda'),
        el('div', { class: 'kpb-pita-bit' }, [...bits].flatMap((b, i) => {
          if (i && cuts.has(i)) piece += 1;
          return [i > 0 ? onTap(el('button', { class: `kpb-gunting ${cuts.has(i) ? 'on' : ''}`, type: 'button', 'data-cut': i, 'aria-label': `potong sebelum simbol ${i + 1}` }, cuts.has(i) ? '✂' : '╎'), () => { if (cuts.has(i)) cuts.delete(i); else cuts.add(i); ctx.sound.tap(); draw(); }) : null,
            el('span', { class: `kpb-bit au-w${piece % 4}` }, b)];
        }))),
      found.length < all.length ? button('📖 Baca', read, 'primary') : null,
      el('div', { class: 'kh-daftar' }, el('small', null, `Daftar cara baca: ${found.length} dari ${all.length}`), el('div', { class: 'kpb-kartu-kartu' }, found.map((w) => el('span', { class: 'kh-baca' }, w)))));
  }
  draw();
  wrap.append(board, msg);
}

// Misi Bos · Perbaiki kode Raka: change A so no code is the start of another, then the message has one reading.
function fixRound(wrap, ctx, done) {
  const opts = ctx.rand.shuffle(['00', '10', '11', '010']);
  const msg = el('p', { class: 'reveal info' }, 'N = 1 dan L = 01 tetap. Pilih kode baru untuk A supaya tidak ada kode yang menjadi awal kode lain.');
  const stage = el('div', { class: 'kh-surat' });
  fill(stage, el('div', { class: 'kh-kode' }, el('div', { class: 'kh-sel' }, el('b', null, 'A'), el('code', null, '?')), el('div', { class: 'kh-sel' }, el('b', null, 'N'), el('code', null, '1')), el('div', { class: 'kh-sel' }, el('b', null, 'L'), el('code', null, '01'))),
    el('div', { class: 'kpb-opsi' }, opts.map((o) => onTap(el('button', { class: 'kpb-cap kh-potong', type: 'button', 'data-p': o }, `A = ${o}`), () => {
      const codes = { ...RAKA, A: o };
      if (!isPrefixFree(codes)) {
        const [a, b] = Object.entries(codes).flatMap(([x, cx]) => Object.entries(codes).filter(([y, cy]) => x !== y && cy.startsWith(cx)).map(([y]) => [x, y]))[0];
        ctx.mistake(); say(msg, 'bad', `Masih ganda: kode ${a} (${codes[a]}) adalah awal kode ${b} (${codes[b]}).`); return;
      }
      ctx.sound.good(); wrap.replaceChildren(misiHead('Bos', 'Kode Raka Diperbaiki', 'A = 00, N = 1, L = 01. Coba lagi semua cara membaca 0101.', '📟'));
      readingsRound(wrap, ctx, { bits: '0101', codes, done, end: 'Sekarang 0101 hanya bisa dibaca LL. Kode prefiks tidak butuh jeda.' });
    }))));
  wrap.append(stage, msg);
}

const HEAD02 = {
  chip: ['Gabung Kartu', 'Kalian teknisi papan tulisan berjalan sekolah. Chipnya hanya muat 300 bit untuk satu pantun. Bangun pohon Huffman sambil mengawasi meteran chip.'],
  chipShort: ['Gabung Kartu', 'Bangun pohon Huffman untuk tulisan pendek ini sambil mengawasi meteran chip.'],
  down: ['Turuni Pohon', 'Bu Guru mengirim pesan berbit dengan pohon kodenya. Gerakkan token mengikuti bit sampai bertemu huruf.'],
  compose: ['Susun Surat', 'Balas Bu Guru dalam bit memakai tabel kode yang sama.'],
  raka: ['Banyak Cara Baca', 'Raka membuat kode sendiri: A = 0, N = 1, L = 01. Pesannya 0101 dikirim tanpa jeda.'],
  morse: ['Banyak Cara Baca: Morse', 'Sandi Morse untuk 8 huruf, dikirim tanpa jeda: • • • —'],
  boss: ['Perbaiki Kode Raka', 'Ubah satu kode saja supaya setiap pesan Raka hanya punya satu cara baca.'],
};

export default {
  id: 'sma-02-kode-hemat',
  title: 'Kode Paling Hemat',
  topic: 'Kode Huffman, kode prefiks, dan batas Shannon',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menghitung frekuensi huruf, membangun pohon Huffman dengan menggabungkan dua kartu terkecil, menghitung total bit dan penghematannya, menguraikan kode prefiks, serta menilai kode Huffman dibandingkan kode tetap dan sandi Morse.',
  extraModes: [
    { id: 'teks', icon: '🧮', label: 'Penghitung Frekuensi', desc: 'Tempelkan pantun atau teks sendiri; layar menghitung frekuensi, membangun pohon Huffman, dan membandingkan total bit dengan kode tetap dan batas Shannon', create: createCounter },
    { id: 'pengurai', icon: '🔍', label: 'Pengurai Bit', desc: 'Ketuk bit satu per satu dan lihat jalannya menuruni pohon sampai sebuah huruf ditemukan', create: createDecoder },
    { id: 'giliran', icon: '🔁', label: 'Gabung Bergiliran', desc: 'Tim bergantian memilih dua simpul untuk digabung; pilihan yang salah menambah bit tim itu, bit paling sedikit menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kode-hemat kh-main' });
    root.append(wrap);
    const solo = !ctx.mode || ctx.mode === 'solo';
    const word = ctx.rand.pick(WORDS);
    const secret = ctx.rand.pick(SECRET.filter((w) => w !== 'ILMU'));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD02[key], '📟'));
      if (r === 0 || r === 5) {
        const long = r === 0 && solo;
        head(long ? 'chip' : 'chipShort', 1);
        chipRound(wrap, ctx, { freq: long ? FREQ : countLetters(SHORT), long, done: () => next(4200) });
      } else if (r === 1 || r === 4 || r === 8) { head('down', 2); descendRound(wrap, ctx, r === 1 ? 'MANIS' : r === 4 ? 'ILMU' : secret, () => next()); }
      else if (r === 2 || r === 6) { head('compose', 3); composeRound(wrap, ctx, r === 2 ? 'KANCIL' : word, () => next()); }
      else if (r === 3) { head('raka', 4); readingsRound(wrap, ctx, { bits: '0101', codes: RAKA, done: () => next(4200), end: '0101 bisa dibaca ANAN, ANL, LAN, atau LL. Kode A = 0 adalah awal kode L = 01, jadi maknanya ganda.' }); }
      else if (r === 7) { head('morse', 4); readingsRound(wrap, ctx, { bits: '•••—', codes: MORSE, done: () => next(4200), end: '8 cara baca! Banyak kode Morse menjadi awal kode lain, jadi Morse butuh jeda sebagai simbol ketiga.' }); }
      else { head('boss', 'Bos'); fixRound(wrap, ctx, () => next(4200)); }
    }
    render();
  },
};

function createCounter(root, ctx) {
  const wrap = el('div', { class: 'act kode-hemat' });
  root.append(wrap);
  const area = el('textarea', { class: 'kh-masukan', rows: 3, 'aria-label': 'Teks' });
  area.value = PANTUN.join('\n');
  area.addEventListener('input', draw);
  area.addEventListener('pointerdown', (e) => e.stopPropagation());
  const out = el('div', { class: 'kh-hasil' });
  function draw() {
    const freq = countLetters(area.value);
    const k = Object.keys(freq).length;
    if (k < 2) { out.replaceChildren(el('p', { class: 'reveal info' }, 'Tulis teks dengan sedikitnya dua huruf berbeda.')); return; }
    const n = Object.values(freq).reduce((a, b) => a + b, 0);
    const tree = huffman(freq);
    const codes = codesOf(tree);
    const tot = totalBits(freq, codes);
    const fb = fixedBits(k);
    out.replaceChildren(
      el('div', { class: 'kh-pohon', html: forestSvg([tree], { bits: true }) }),
      el('div', { class: 'kh-ringkas' },
        el('span', null, `${n} huruf, ${k} berbeda`),
        el('span', null, `Kode tetap 5 bit: ${n * 5} bit`),
        el('span', null, `Kode tetap ${fb} bit: ${n * fb} bit`),
        el('b', null, `Huffman: ${tot} bit (hemat ${fmtNum(((n * 5 - tot) / (n * 5)) * 100, 1)}% dari 5 bit)`),
        el('span', null, `Rata-rata ${fmtNum(tot / n)} bit · batas Shannon ${fmtNum(entropy(freq))} bit`)),
      codeTable(codes, freq));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Penghitung frekuensi: ketik atau tempelkan teks (huruf dan angka dihitung).'), area,
    el('div', { class: 'seg' }, [['Pantun', PANTUN.join('\n')], ['KAKAK MAKAN NANAS', 'KAKAK MAKAN NANAS'], ['Kosongkan', '']].map(([l, t]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { area.value = t; draw(); }))), out);
  draw();
}

function createDecoder(root, ctx) {
  const wrap = el('div', { class: 'act kode-hemat' });
  root.append(wrap);
  const tree = trieOf(CODE);
  let cur = tree;
  let path = [tree.id];
  let bits = '';
  let out = '';
  const pic = el('div', { class: 'kh-pohon' });
  const stat = el('div');
  function step(b) {
    const nx = b === '0' ? cur.l : cur.r;
    bits += b;
    path.push(nx.id);
    cur = nx;
    draw();
    if (cur.ch) {
      ctx.sound.good();
      setTimeout(() => { out += cur.ch; cur = tree; path = [tree.id]; draw(); }, 700);
    } else ctx.sound.tap();
  }
  function draw() {
    pic.innerHTML = forestSvg([tree], { bits: true, path: new Set(path) });
    stat.replaceChildren(el('div', { class: 'kh-bit' }, bits || '…'), el('div', { class: 'au-status' }, out || '…'),
      el('p', { class: 'reveal info' }, cur === tree ? 'Mulai dari puncak pohon: 0 ke kiri, 1 ke kanan.' : cur.ch ? `Sampai di huruf ${cur.ch}. Kembali ke puncak.` : `Jalan sejauh ini: ${path.length - 1} bit.`));
  }
  let auto = null;
  const play = (s) => { clearInterval(auto); bits = ''; out = ''; cur = tree; path = [tree.id]; draw(); let i = 0; auto = setInterval(() => { if (!wrap.isConnected || i >= s.length) { clearInterval(auto); return; } if (!cur.ch) step(s[i++]); }, 420); };
  wrap.append(el('p', { class: 'prompt' }, 'Pengurai bit dengan kode Bu Guru'), pic, stat,
    el('div', { class: 'kode-baris' },
      button('0', () => { if (!cur.ch) { clearInterval(auto); step('0'); } }, 'primary kh-tombol'),
      button('1', () => { if (!cur.ch) { clearInterval(auto); step('1'); } }, 'primary kh-tombol'),
      button('Ulang', () => { clearInterval(auto); bits = ''; out = ''; cur = tree; path = [tree.id]; draw(); }),
      button('Putar pesan Bu Guru', () => play(MESSAGE.join(''))),
      button('Putar KANCIL', () => play([...'KANCIL'].map((c) => CODE[c]).join('')))));
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kode-hemat' });
  root.append(wrap);
  let pts = [];
  let team = 0;
  function start(n) {
    pts = Array(n).fill(0);
    team = 0;
    const host = el('div', { class: 'kh-papan' });
    const head = el('div');
    const msg = el('p', { class: 'reveal info' }, 'Ketuk dua kartu terkecil. Pilihan yang tepat tidak menambah bit; salah pilih menambah selisihnya ke bit timmu.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team, ' bit'), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head, host, msg);
    drawHead();
    const board = mergeBoard(host, {
      freq: FREQ,
      onPick(ok, got, want) {
        const sum = got[0] + got[1];
        if (ok) { ctx.sound.good(); say(msg, '', `Tim ${team + 1}: ${got[0]} + ${got[1]} = ${sum}. Tepat, tanpa tambahan bit.`); } else {
          const extra = sum - want[0] - want[1];
          pts[team] += extra;
          ctx.sound.bad();
          say(msg, 'bad', `Tim ${team + 1}: ${got[0]} + ${got[1]} bukan dua terkecil (${want[0]} dan ${want[1]}). Ditolak, +${extra} bit.`);
        }
        if (board.roots.length > 1) { team = (team + 1) % n; drawHead(); }
      },
      onDone(rootNode, total) {
        board.enabled = false;
        setTimeout(() => finishBoard(wrap, ctx, { title: `Pohon selesai: ${total} bit untuk seluruh pantun. Bit tim paling sedikit menang.`, pts, unit: 'bit', low: true, again: () => pickTeams(wrap, 'Gabung Bergiliran', start) }), 1600);
      },
    });
  }
  pickTeams(wrap, 'Gabung Bergiliran', start);
}
