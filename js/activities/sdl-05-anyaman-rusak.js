// Anyaman yang Rusak — SD Lanjut (10–12 tahun), deteksi dan koreksi galat.
// Bu Siti adds a sixth row and column so every row and column has an even
// number of dark squares. One flipped square then shows up as the one odd
// row meeting the one odd column. Ends with the ISBN check digit.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

const N = 6;
const parse = (rows) => rows.flatMap((r) => r.split('').map((c) => (c === '■' ? 1 : 0)));

// The worksheet's mats (■ dark, □ light).
const MOTIF = ['■□■□□', '□■■■□', '■■□□□', '□□□■■', '■□■■■'];
const BROKEN_1 = ['□■□□■□', '■■■■□■', '□□■■□□', '■□□□■□', '□■□■□□', '□■□□□■'];
const BROKEN_2 = ['□■□□■□', '■■■□□■', '□□■■□□', '■□□□■□', '□■□■□□', '□□□□□■'];

// Add the balancing column and row to a 5 × 5 motif (flat array of 25).
export function withParity(m) {
  const out = new Array(N * N).fill(0);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) out[r * N + c] = m[r * 5 + c];
  for (let r = 0; r < 5; r++) out[r * N + 5] = [0, 1, 2, 3, 4].reduce((s, c) => s ^ out[r * N + c], 0);
  for (let c = 0; c < N; c++) out[5 * N + c] = [0, 1, 2, 3, 4].reduce((s, r) => s ^ out[r * N + c], 0);
  return out;
}
const rowSum = (v, r) => v.slice(r * N, r * N + N).reduce((a, b) => a + b, 0);
const colSum = (v, c) => [0, 1, 2, 3, 4, 5].reduce((a, r) => a + v[r * N + c], 0);
const balanced = (v) => [0, 1, 2, 3, 4, 5].every((k) => rowSum(v, k) % 2 === 0 && colSum(v, k) % 2 === 0);
export const oddCell = (v) => {
  const r = [0, 1, 2, 3, 4, 5].find((k) => rowSum(v, k) % 2);
  const c = [0, 1, 2, 3, 4, 5].find((k) => colSum(v, k) % 2);
  return r == null || c == null ? -1 : r * N + c;
};

// A 6 × 6 mat with optional dark-square counts at the end of each row and
// column. `onCell(i)` gets taps on cells the mat lets through.
function mat(values, { onCell, editable = () => false, counts = false } = {}) {
  const v = values.slice();
  const cells = v.map((_, i) => {
    const r = Math.floor(i / N);
    const c = i % N;
    const b = el('button', { class: `mat-cell ${r === 5 || c === 5 ? 'parity' : ''}`, type: 'button', 'aria-label': `baris ${r + 1} kolom ${c + 1}` });
    onTap(b, () => onCell?.(i, api));
    return b;
  });
  const rowCounts = Array.from({ length: N }, () => el('span', { class: 'mat-count' }));
  const colCounts = Array.from({ length: N }, () => el('span', { class: 'mat-count' }));
  const head = (t) => el('span', { class: 'mat-head' }, t);
  const node = el('div', { class: 'mat' },
    head(''), Array.from({ length: N }, (_, c) => head(`K${c + 1}`)), head('jml'),
    Array.from({ length: N }, (_, r) => [head(`B${r + 1}`), cells.slice(r * N, r * N + N), rowCounts[r]]),
    head('jml'), colCounts, head(''));
  const api = {
    node, values: v, cells,
    set(i, x) { v[i] = x; draw(); },
    flip(i) { v[i] = 1 - v[i]; draw(); },
    showCounts(on) { counts = on; draw(); },
    mark(i, cls) { cells[i].classList.add(cls); },
    draw,
  };
  function draw() {
    cells.forEach((b, i) => {
      b.classList.toggle('dark', v[i] === 1);
      b.classList.toggle('editable', editable(i));
    });
    rowCounts.forEach((s, r) => { const n = rowSum(v, r); s.textContent = counts ? n : ''; s.classList.toggle('odd', counts && n % 2 === 1); });
    colCounts.forEach((s, c) => { const n = colSum(v, c); s.textContent = counts ? n : ''; s.classList.toggle('odd', counts && n % 2 === 1); });
  }
  draw();
  return api;
}

// Fill in the balancing squares until every row and column is even.
function fillRound(wrap, ctx, motif, next) {
  const start = withParity(motif).map((x, i) => (i % N === 5 || i >= 5 * N ? 0 : x));
  const want = withParity(motif);
  let done = false;
  const isParity = (i) => i % N === 5 || i >= 5 * N;
  const m = mat(start, {
    editable: (i) => !done && isParity(i),
    onCell(i, a) {
      if (done || !isParity(i)) return;
      a.flip(i);
      ctx.sound.tap();
      if (a.values.every((x, k) => x === want[k])) {
        done = true;
        a.showCounts(true);
        a.node.classList.add('solved');
        next();
      }
    },
  });
  wrap.append(
    el('p', { class: 'prompt' }, 'Isi kotak penyeimbang (bingkai putus-putus) supaya setiap baris dan kolom punya kotak gelap GENAP.'),
    m.node,
    el('div', { class: 'row' }, helpButton(m)));
}

function helpButton(m) {
  let on = false;
  const b = button('🔢 Hitung kotak gelap', () => { on = !on; m.showCounts(on); b.classList.toggle('on', on); }, 'small');
  return b;
}

// Find the one flipped square.
function findRound(wrap, ctx, values, next, prompt = 'Satu kotak rusak dan berubah warna. Ketuk kotak itu!') {
  const bad = oddCell(values);
  let done = false;
  const msg = el('p', { class: 'reveal' });
  const m = mat(values, {
    onCell(i, a) {
      if (done) return;
      if (i !== bad) { ctx.mistake(); shake(a.cells[i]); return; }
      done = true;
      a.mark(i, 'found');
      a.showCounts(true);
      const r = Math.floor(i / N) + 1;
      const c = (i % N) + 1;
      msg.textContent = `Ketemu: baris ${r} kolom ${c}, tempat baris ganjil bertemu kolom ganjil.`;
      next();
    },
  });
  wrap.append(el('p', { class: 'prompt' }, prompt), m.node, el('div', { class: 'row' }, helpButton(m), msg));
}

function randomMotif(rand) {
  return Array.from({ length: 25 }, () => (rand.next() < 0.45 ? 1 : 0));
}

// ISBN: digits × 1, 3, 1, 3, … summed; a right number gives a multiple of 10.
export const isbnSum = (digits) => digits.reduce((s, d, i) => s + d * (i % 2 ? 3 : 1), 0);
function isbnTable(digits, showSum) {
  const products = digits.map((d, i) => d * (i % 2 ? 3 : 1));
  return el('table', { class: 'count-table isbn-table' }, el('tbody', null,
    el('tr', null, el('td', null, 'Angka'), digits.map((d) => el('td', { class: 'num' }, d))),
    el('tr', null, el('td', null, 'Dikali'), digits.map((_, i) => el('td', { class: 'num' }, i % 2 ? 3 : 1))),
    el('tr', null, el('td', null, 'Hasil'), products.map((p) => el('td', { class: 'num' }, p))),
    showSum ? el('tr', { class: 'total' }, el('td', null, 'Jumlah'), el('td', { colspan: digits.length, class: 'num' }, isbnSum(digits))) : null));
}
const ISBN_OK = [9, 7, 8, 6, 2, 3, 0, 0, 1, 2, 3, 4, 1];
const ISBN_TYPO = [9, 7, 8, 6, 2, 3, 0, 0, 1, 2, 8, 4, 1];

export default {
  id: 'sdl-05-anyaman-rusak',
  title: 'Anyaman yang Rusak',
  topic: 'Deteksi galat (paritas)',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🧺',
  source: { name: 'CS Unplugged: Error Detection and Correction', url: 'https://www.csunplugged.org/en/topics/error-detection-and-correction/' },
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid melengkapi kotak penyeimbang agar setiap baris dan kolom genap, menemukan satu kotak yang rusak, dan memeriksa nomor ISBN dengan digit cek.',
  extraModes: [
    { id: 'kirim', icon: '📦', label: 'Tikar Sendiri', desc: 'Susun motif 5 × 5, lengkapi penyeimbang, lalu kirim: layar atau tim perajin membalik satu kotak, tim pemeriksa mencarinya', create: createOwn },
    { id: 'isbn', icon: '📚', label: 'Cek ISBN', desc: 'Ketik ISBN 13 angka; layar menampilkan perkalian 1 dan 3, jumlahnya, dan apakah nomornya benar', create: createIsbn },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act anyaman' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2400); };
      if (r === 0) fillRound(wrap, ctx, parse(MOTIF), next);
      else if (r === 1) findRound(wrap, ctx, parse(BROKEN_1), next);
      else if (r === 2) findRound(wrap, ctx, parse(BROKEN_2), next, 'Tikar lain, satu kotak rusak lagi. Ketuk kotak itu!');
      else if (r === 3) {
        const m = mat(parse(BROKEN_2), { counts: true });
        m.mark(5 * N + 1, 'found');
        choice(wrap, {
          prompt: 'Kotak rusak pada tikar tadi (baris 6, kolom 2) bagian dari …', subject: m.node, ctx, onRight: next, columns: 2,
          options: [{ label: 'kotak penyeimbang', correct: true }, { label: 'motif' }],
        });
      } else if (r === 4) {
        choice(wrap, {
          prompt: 'ISBN 978-623-00-1234-1. Jumlahkan baris "Hasil". Berapa jumlahnya?', subject: isbnTable(ISBN_OK), ctx, onRight: next, columns: 4,
          options: [86, 90, 96, 100].map((n) => ({ label: String(n), correct: n === isbnSum(ISBN_OK) })),
        });
      } else if (r === 5) {
        choice(wrap, {
          prompt: 'Salah ketik: 978-623-00-1284-1. Apakah jumlahnya kelipatan 10?', subject: isbnTable(ISBN_TYPO), ctx, onRight: next, columns: 2,
          options: [{ label: 'ya, nomornya benar' }, { label: 'tidak, ada yang salah', correct: true }],
        });
      } else {
        const v = withParity(randomMotif(ctx.rand));
        v[ctx.rand.int(0, N * N - 1)] ^= 1;
        findRound(wrap, ctx, v, next);
      }
    }
    render();
  },
};

// Tikar Sendiri: build a motif, balance it, then one square is flipped by
// the screen ("Kirim") or by a crafter team in secret; the checkers find it.
function createOwn(root, ctx) {
  const wrap = el('div', { class: 'act anyaman' });
  root.append(wrap);
  const isParity = (i) => i % N === 5 || i >= 5 * N;
  let stage = 'motif';
  let flipped = -1;
  const msg = el('p', { class: 'reveal' });
  const prompt = el('p', { class: 'prompt' });
  const tools = el('div', { class: 'row' });
  const m = mat(new Array(N * N).fill(0), {
    editable: (i) => (stage === 'motif' ? !isParity(i) : stage === 'imbang' ? isParity(i) : stage === 'perajin'),
    onCell(i, a) {
      if (stage === 'motif' && !isParity(i)) { a.flip(i); ctx.sound.tap(); }
      else if (stage === 'imbang' && isParity(i)) {
        a.flip(i);
        ctx.sound.tap();
        if (balanced(a.values)) go('siap');
      } else if (stage === 'perajin') {
        a.flip(i);
        flipped = i;
        ctx.sound.tap();
        go('periksa');
      } else if (stage === 'periksa') {
        if (i === flipped) {
          a.mark(i, 'found');
          a.showCounts(true);
          ctx.sound.win();
          msg.className = 'reveal';
          msg.textContent = `Ketemu! Baris ${Math.floor(i / N) + 1} kolom ${(i % N) + 1}.`;
          go('selesai');
        } else { ctx.sound.bad(); shake(a.cells[i]); }
      }
    },
  });
  const help = helpButton(m);
  function go(s) {
    stage = s;
    m.draw();
    msg.textContent = '';
    const texts = {
      motif: 'Ketuk kotak 5 × 5 untuk membuat motif tikar.',
      imbang: 'Sekarang isi kotak penyeimbang supaya setiap baris dan kolom genap.',
      siap: 'Tikar siap! Kirim lewat jalan (layar membalik satu kotak) atau biarkan tim perajin membalik satu kotak diam-diam.',
      perajin: 'Tim perajin: ketuk SATU kotak untuk membaliknya. Tim lain tutup mata!',
      periksa: 'Tim pemeriksa: kotak mana yang rusak? Ketuk kotak itu.',
      selesai: 'Hebat! Buat tikar baru atau kirim lagi.',
    };
    prompt.textContent = texts[s];
    const btns = {
      motif: [button('Lanjut: isi penyeimbang ➜', () => go('imbang'), 'primary')],
      imbang: [help],
      siap: [button('📦 Kirim', () => { flipped = Math.floor(Math.random() * N * N); m.flip(flipped); go('periksa'); }, 'primary'), button('🤫 Perajin membalik', () => go('perajin'))],
      perajin: [],
      periksa: [help],
      selesai: [button('Kirim lagi', () => { m.cells.forEach((c) => c.classList.remove('found')); m.flip(flipped); m.showCounts(false); go('siap'); }), button('Tikar baru', () => { m.cells.forEach((c) => c.classList.remove('found')); m.values.fill(0); m.showCounts(false); go('motif'); }, 'ghost')],
    }[s];
    tools.replaceChildren(...btns);
    if (s === 'imbang' && balanced(m.values)) go('siap');
  }
  wrap.append(prompt, m.node, tools, msg);
  go('motif');
}

// Cek ISBN: type 13 digits; the table and the verdict update live.
function createIsbn(root) {
  const wrap = el('div', { class: 'act anyaman' });
  root.append(wrap);
  let digits = [];
  const shown = el('div', { class: 'msg-out' });
  const table = el('div');
  const verdict = el('p', { class: 'reveal' });
  function draw() {
    const s = digits.join('');
    shown.textContent = s ? `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6, 8)}-${s.slice(8, 12)}-${s.slice(12)}`.replace(/-+$/, '') : 'Ketik 13 angka ISBN';
    table.replaceChildren(digits.length ? isbnTable(digits, true) : '');
    if (digits.length === 13) {
      const ok = isbnSum(digits) % 10 === 0;
      verdict.className = ok ? 'reveal' : 'reveal bad';
      verdict.textContent = ok ? `Jumlah ${isbnSum(digits)} adalah kelipatan 10: nomornya benar ✓` : `Jumlah ${isbnSum(digits)} bukan kelipatan 10: ada angka yang salah ✗`;
    } else verdict.textContent = digits.length ? `${13 - digits.length} angka lagi` : '';
  }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) => onTap(el('button', { class: 'key', type: 'button' }, k), () => { if (digits.length < 13) { digits.push(Number(k)); draw(); } }));
  keys.push(onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { digits.pop(); draw(); }));
  wrap.append(
    el('p', { class: 'prompt' }, 'Ketik ISBN dari sampul belakang buku.'),
    shown, el('div', { class: 'keys keypad' }, keys), table, verdict,
    el('div', { class: 'row' }, button('Contoh 978-623-00-1234-1', () => { digits = ISBN_OK.slice(); draw(); }, 'small ghost')));
  draw();
}
