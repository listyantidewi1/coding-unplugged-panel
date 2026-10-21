// Kode Paling Hemat — SMA/SMK (16–18 tahun), kompresi dan teori informasi.
// Letter frequencies in a pantun, building a Huffman tree by merging the two
// smallest cards, prefix codes, decoding bit by bit, and comparing with fixed
// codes, Morse and Shannon's bound.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
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

const pantunBox = (letter) => el('div', { class: 'kh-pantun' }, PANTUN.map((line) => el('div', null, [...line].map((c) => (letter && c.toUpperCase() === letter ? el('mark', null, c) : c)))));

function countRound(wrap, ctx, { done }) {
  const pool = ['I', 'K', 'L', 'M', 'S', 'U', 'G', 'H', 'D'];
  const letter = ctx.rand.pick(pool);
  const want = FREQ[letter];
  const opts = [...new Set([want - 2, want - 1, want, want + 1, want + 2].filter((v) => v > 0))].slice(0, 4);
  choice(wrap, { prompt: `Berapa kali huruf ${letter} muncul di pantun ini? Huruf besar dan kecil dianggap sama.`, subject: pantunBox(null), ctx, onRight: done, columns: opts.length, options: opts.map((v) => ({ label: String(v), correct: v === want })) });
}

function mergeRound(wrap, ctx, { done }) {
  const msg = el('p', { class: 'reveal info' }, 'Ketuk dua kartu dengan nilai terkecil untuk digabung. Kartu gabungan ikut dipilih lagi.');
  wrap.append(el('p', { class: 'prompt' }, 'Bangun pohon Huffman untuk pantun ini.'));
  const host = el('div', { class: 'kh-papan' });
  wrap.append(host, msg);
  mergeBoard(host, {
    freq: FREQ,
    onPick(ok, got, want) {
      if (ok) { ctx.sound.tap(); say(msg, 'info', `Gabung ${got[0]} + ${got[1]} = ${got[0] + got[1]}.`); return; }
      ctx.mistake();
      shake(host);
      say(msg, 'bad', `${got[0]} dan ${got[1]} bukan dua yang terkecil. Yang terkecil sekarang ${want[0]} dan ${want[1]}.`);
    },
    onDone(root, total) {
      const codes = codesOf(root);
      say(msg, '', `Selesai: 13 penggabungan, kartu teratas 84, total ${total} bit (kode tetap 5 bit: 420 bit).`);
      wrap.append(codeTable(codes));
      setTimeout(done, 400);
    },
  });
}

function decodeRound(wrap, ctx, { done }) {
  const all = MESSAGE.join('');
  let pos = 0;
  let out = '';
  let finished = false;
  const letters = Object.keys(CODE).sort();
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Cocokkan bit paling depan dengan tabel kode, lalu ketuk hurufnya.');
  const draw = () => stage.replaceChildren(
    el('div', { class: 'kh-bit' }, [...all].map((b, i) => [i === MESSAGE[0].length ? el('span', { class: 'kh-jeda' }, ' / ') : null, el('span', { class: i < pos ? 'kh-habis' : '' }, b)])),
    el('div', { class: 'au-status' }, out || '…'));
  draw();
  const keys = el('div', { class: 'keys keypad kh-huruf' }, letters.map((c) => onTap(el('button', { class: 'key', type: 'button' }, c), (e) => {
    if (finished) return;
    if (all.startsWith(CODE[c], pos)) {
      pos += CODE[c].length;
      out += c;
      if (pos === MESSAGE[0].length) out += ' ';
      ctx.sound.tap();
      draw();
      if (pos === all.length) { finished = true; say(msg, '', 'MANIS ILMU. Tidak perlu jeda: tidak ada kode yang menjadi awal kode lain.'); done(); }
    } else { ctx.mistake(); shake(e.currentTarget || keys); say(msg, 'bad', `Kode ${c} = ${CODE[c]}, tidak cocok dengan bit berikutnya.`); }
  })));
  wrap.append(el('p', { class: 'prompt' }, 'Uraikan pesan Bu Guru.'), codeTable(CODE), stage, keys, msg);
}

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
    const wrap = el('div', { class: 'act kode-hemat' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) countRound(wrap, ctx, { done: next });
      else if (r === 1) mergeRound(wrap, ctx, { done: next });
      else if (r === 2) ask('Pantun ini berisi 84 huruf. Dengan kode tetap 5 bit per huruf butuh berapa bit, dan berapa persen hematnya bila memakai kode Huffman (276 bit)?', [['420 bit; hemat sekitar 34%', true], ['420 bit; hemat sekitar 66%'], ['84 bit; tidak hemat'], ['336 bit; hemat sekitar 18%']], 1, codeTable(CODE, FREQ),
        then(() => ask('Pantun ini hanya memakai 14 huruf berbeda. Berapa bit per huruf cukup untuk kode tetap, dan berapa panjang rata-rata kode Huffman?', [['4 bit (2⁴ = 16 ≥ 14), total 336 bit; Huffman rata-rata 276 : 84 ≈ 3,29 bit', true], ['3 bit, total 252 bit; Huffman rata-rata 3,29 bit'], ['4 bit, total 336 bit; Huffman rata-rata 2 bit'], ['14 bit, total 1.176 bit; Huffman rata-rata 3,29 bit']])));
      else if (r === 3) ask('Kelompok Sinta dan kelompok Bayu mendapat kode yang berbeda untuk huruf yang sama, padahal keduanya membangun pohon dengan benar. Bagaimana total bitnya?', [['Sama-sama 276 bit: pilihan saat ada nilai sama dan letak kiri–kanan mengubah kode, bukan totalnya', true], ['Salah satu pasti salah karena kodenya berbeda'], ['Total bit berbeda, yang lebih kecil yang benar'], ['Total bit bergantung pada urutan huruf dalam abjad']]);
      else if (r === 4) ask('Raka membuat kode sendiri: A = 0, N = 1, L = 01. Apa arti 01?', [['Bisa AN, bisa L: maknanya ganda, jadi penerima butuh jeda', true], ['Pasti L'], ['Pasti AN'], ['Tidak berarti apa-apa']], 1, el('div', { class: 'au-status' }, 'A = 0 · N = 1 · L = 01'),
        then(() => ask('Mengapa kode Huffman tidak pernah bermasalah seperti kode Raka?', [['Setiap huruf ada di ujung cabang, jadi tidak ada kode yang menjadi awal kode lain', true], ['Karena kode Huffman selalu 5 bit'], ['Karena hurufnya diurutkan menurut abjad'], ['Karena kodenya selalu diawali 1']])));
      else if (r === 5) decodeRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Sandikan kata KANCIL dengan kode Bu Guru.', [['011110111011000000001', true], ['011110111011001000001'], ['01111011101100000001'], ['10011110111011000001']], 1, codeTable(CODE));
      else if (r === 7) ask('Dalam sandi Morse, E = · dan T = − mendapat kode paling pendek. Apakah keduanya sering muncul di pantun ini?', [['Tidak muncul sama sekali; Morse dirancang untuk bahasa Inggris, yang huruf tersering E dan T', true], ['Ya, E dan T paling sering muncul'], ['E sering, T jarang'], ['Morse disusun menurut abjad, bukan frekuensi']], 1, el('div', { class: 'au-status' }, 'E ·  T −  A · −  N − ·  S · · ·  V · · · −  I · ·  U · · −'),
        then(() => ask('Tanpa jeda, · · · − bisa dibaca V. Mana yang juga merupakan cara membacanya?', [['ST, IA, EU, atau EEET', true], ['Hanya V'], ['NA'], ['TTTE']], 1, null,
          then(() => ask('Mengapa Morse butuh jeda sedangkan kode Huffman tidak?', [['Banyak kode Morse menjadi awal kode lain (E = · adalah awal A = · −), jadi jeda dipakai sebagai simbol ketiga', true], ['Karena Morse lebih cepat'], ['Karena Morse memakai bunyi'], ['Karena Huffman memakai lebih banyak bit']])))));
      else if (r === 8) ask('Penerima harus tahu tabel kodenya. Kapan kode Huffman justru tidak menguntungkan?', [['Pesannya pendek sehingga tabel lebih besar dari bit yang dihemat, atau semua simbol muncul hampir sama sering', true], ['Pesannya sangat panjang'], ['Ada huruf yang sangat sering muncul'], ['Teksnya berbahasa Indonesia']]);
      else ask('Tantangan: batas Shannon untuk pantun ini H ≈ 3,25 bit per huruf, sedangkan Huffman rata-rata 3,29. Mengapa Huffman tidak bisa tepat mencapai H?', [['Setiap kode Huffman panjangnya bilangan bulat bit, padahal panjang ideal −log₂ p biasanya pecahan (A: ≈ 1,81 bit, kodenya 2)', true], ['Karena pohonnya dibangun salah'], ['Karena Shannon salah hitung'], ['Karena pantun terlalu pendek untuk dihitung']], 1, el('div', { class: 'au-status' }, 'H = −Σ p × log₂ p ≈ 3,25'));
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
