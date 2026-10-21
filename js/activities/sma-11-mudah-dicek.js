// Mudah Dicek, Sulit Dicari — SMA/SMK (16–18 tahun), P dan NP.
// Splitting ten coffee sacks into two equally heavy trucks: checking a
// proposal is quick, searching takes up to 2^n tries. Greedy gets close, a
// 4×4 sudoku and a PIN show the same check-versus-search gap.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

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

function greedyRound(wrap, ctx, { done }) {
  const g = greedySplit(KARUNG);
  let k = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ambil karung dari yang terberat. Masukkan ke truk yang saat itu lebih ringan (sama berat: truk A).');
  const draw = () => {
    const A = k ? g.steps[k - 1].A : 0; const B = k ? g.steps[k - 1].B : 0;
    stage.replaceChildren(el('div', { class: 'mc-urut' }, g.steps.map((s, j) => el('span', { class: `mc-karung kecil ${j < k ? `di-${s.truck}` : j === k ? 'kini' : ''}` }, el('small', null, `#${s.i + 1}`), el('b', null, KARUNG[s.i]), j < k ? el('em', null, s.truck) : null))),
      el('div', { class: 'mc-skor' }, el('span', null, `Truk A: ${A} kg`), el('span', null, `Truk B: ${B} kg`)));
  };
  const put = (truck) => {
    if (k >= g.steps.length) return;
    const s = g.steps[k];
    if (s.truck !== truck) { ctx.mistake(); shake(stage); say(msg, 'bad', `Truk ${s.truck} sedang lebih ringan${k && g.steps[k - 1].A === g.steps[k - 1].B ? ' (sama berat: truk A)' : ''}.`); return; }
    k++; ctx.sound.tap(); draw();
    if (k === g.steps.length) { say(msg, '', `Truk A ${g.A} kg, truk B ${g.B} kg: hampir, tetapi tidak adil. Cepat, tetapi tidak menjamin tepat sama.`); done(); }
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Cara rakus: karung terberat ke truk yang lebih ringan.'), stage, el('div', { class: 'kode-baris' }, button('Truk A', () => put('A'), 'primary'), button('Truk B', () => put('B'), 'primary')), msg);
}

function sudokuRound(wrap, ctx, { done }) {
  const { bad } = sudokuErrors(RINA);
  const found = new Set();
  const msg = el('p', { class: 'reveal info' }, 'Periksa setiap baris, kolom, dan kotak 2 × 2. Ketuk angka yang bentrok.');
  const grid = el('div', { class: 'mc-sudoku' });
  const draw = () => grid.replaceChildren(...RINA.flatMap((row, r) => row.map((v, c) => onTap(el('button', { class: `mc-sd ${found.has(`${r},${c}`) ? 'salah' : ''} ${c === 1 ? 'kanan' : ''} ${r === 1 ? 'bawah' : ''}`, type: 'button', 'data-rc': `${r},${c}` }, v), () => {
    const key = `${r},${c}`;
    if (found.has(key)) return;
    if (!bad.has(key)) { ctx.mistake(); shake(grid); say(msg, 'bad', `Baris, kolom, dan kotak untuk angka ${v} ini tidak bentrok.`); return; }
    found.add(key); ctx.sound.tap(); draw();
    if (found.size === bad.size) { say(msg, '', 'Salah: kolom 3 berisi 3, 1, 4, 1 dan kolom 4 berisi 4, 2, 3, 2. Baris dan kotak benar.'); done(); }
  }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Sudoku 4 × 4 jawaban Rina: benar atau salah?'), grid, msg);
}

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
    const wrap = el('div', { class: 'act mudah-dicek' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const table = el('div', { class: 'pd-kode' }, KARUNG.map((w, i) => el('span', null, el('small', null, `#${i + 1}`), w)));
      if (r === 0) ask('Usulan Dimas: truk A berisi karung 1, 2, 3, 7, 9; sisanya truk B. Adil?', [['Tidak: A 268 kg, B 270 kg', true], ['Ya: keduanya 269 kg'], ['Tidak: A 270 kg, B 268 kg'], ['Tidak: A 250 kg, B 288 kg']], 1, table,
        then(() => ask('Usulan Sari: truk A berisi karung 2, 4, 5, 8, 10. Adil? Berapa langkah untuk memeriksa satu usulan?', [['Tidak (266 dan 272); hanya sekitar 10 langkah menjumlah dan membandingkan', true], ['Ya (269 dan 269); sekitar 1.024 langkah'], ['Tidak (266 dan 272); sekitar 1.024 langkah'], ['Ya; tidak perlu diperiksa']], 1, el('div', { class: 'pd-kode' }, KARUNG.map((w, i) => el('span', null, el('small', null, `#${i + 1}`), w))))));
      else if (r === 1) {
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk karung untuk memindahkannya. Truk yang adil menyala hijau.');
        let fin = false;
        wrap.append(el('p', { class: 'prompt' }, 'Cari pembagian yang adil: kedua truk sama berat.'));
        trucks(wrap, ctx, { locked: () => fin, onFair(tries) { fin = true; say(msg, '', `Adil! 269 kg dan 269 kg, setelah mencoba ${tries} pembagian. Memeriksa cepat, mencarinya lama.`); next(); } });
        wrap.append(msg);
      } else if (r === 2) ask('Setiap karung bisa masuk truk A atau B. Berapa cara membagi, berapa yang benar-benar berbeda, dan berapa kg per truk?', [['1.024 cara; 512 berbeda (tukar truk sama saja); total 538 kg, jadi 269 kg per truk', true], ['20 cara; 10 berbeda; 269 kg'], ['100 cara; 50 berbeda; 538 kg'], ['1.024 cara; 1.024 berbeda; 538 kg']]);
      else if (r === 3) greedyRound(wrap, ctx, { done: next });
      else if (r === 4) ask('Komputer memeriksa 10⁸ pembagian per detik. Berapa lama mencoba semua pembagian 50 karung dan 100 karung?', [['50 karung ≈ 130 hari; 100 karung ≈ 4 × 10¹⁴ tahun, sekitar 29.000 kali umur alam semesta', true], ['50 karung 5 detik; 100 karung 10 detik'], ['50 karung 130 hari; 100 karung 260 hari'], ['Keduanya kurang dari sedetik']], 1, el('div', { class: 'au-status' }, '2⁵⁰ ≈ 1,13 × 10¹⁵ · 2¹⁰⁰ ≈ 1,27 × 10³⁰'),
        then(() => ask('Berapa lama memeriksa satu usulan untuk 100 karung?', [['Sangat cepat: sekitar 100 penjumlahan', true], ['2¹⁰⁰ langkah'], ['Sekitar 130 hari'], ['Tidak bisa diperiksa']])));
      else if (r === 5) sudokuRound(wrap, ctx, { done: () => { setTimeout(() => { wrap.replaceChildren(); ask('Berapa kelompok yang harus diperiksa pada sudoku 4 × 4?', [['12: 4 baris, 4 kolom, 4 kotak', true], ['16 kotak'], ['4'], ['24']], 4); }, 1600); } });
      else if (r === 6) ask('PIN 6 angka: server memeriksa berapa kali, dan penebak tanpa petunjuk mungkin harus mencoba sampai berapa kali?', [['Server 1 kali mencocokkan; penebak sampai 1.000.000 kali', true], ['Server 1.000.000 kali; penebak 1 kali'], ['Keduanya 6 kali'], ['Keduanya 1.000.000 kali']], 1, el('div', { class: 'au-status' }, '🔒 • • • • • •'));
      else if (r === 7) ask('Persoalan yang jawabannya mudah diperiksa termasuk NP; yang mudah dicari termasuk P. Apa status pertanyaan "apakah setiap persoalan NP juga P?"', [['Belum ada yang bisa membuktikannya; termasuk tujuh Masalah Milenium berhadiah 1 juta dolar', true], ['Sudah terbukti ya'], ['Sudah terbukti tidak'], ['Pertanyaan itu tidak ada artinya']]);
      else if (r === 8) ask('Mengapa keamanan kata sandi justru butuh persoalan yang mudah diperiksa tetapi sulit dicari?', [['Pemilik masuk cepat karena server memeriksa sekejap, sedangkan penyerang harus mencari di antara sangat banyak kemungkinan', true], ['Supaya server bekerja lebih keras'], ['Supaya kata sandi bisa ditebak'], ['Tidak ada hubungannya']]);
      else ask('Tantangan: karung 35, 36, 67, 40, 51, 72, 43, 42, 69, 37 (total 492). Ketua yakin tidak ada pembagian adil. Bagaimana meyakinkan orang lain?', [['Harus menunjukkan semua 512 pembagian gagal (atau alasan khusus); membuktikan "ada" cukup menunjukkan satu pembagian', true], ['Cukup menunjukkan satu pembagian yang gagal'], ['Totalnya genap, jadi pasti ada'], ['Cukup menjalankan cara rakus']], 1, el('div', { class: 'au-status' }, `Komputer: ${search(TANPA).tried} pembagian dicek, selisih terkecil ${search(TANPA).best} kg`));
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
