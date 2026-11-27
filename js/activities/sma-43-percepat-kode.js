// Mempercepat Kode — SMA/SMK (16–18 tahun), coding. Finding duplicate
// registration codes in Python: counting operations in nested loops, Rudi's
// range bug, rewriting with set, reading a fixed timing table, hidden loops
// (`in` on a list, count, sorted) and the two-schools question.
// Step model (worksheet): a comparison is 1; `in` on a list counts the members
// checked; count costs the list length; set `in`/add cost 1; sorted costs
// n·log2(n), rounded. Times are the worksheet's fixed data, never measured.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, pyTracer, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy, makePyRunner, pyRepr, PySet } from './mini-py.js';

export const KODE = [4827, 1063, 7351, 2917, 6409, 3580, 8134, 5293, 9748, 6215, 2917, 3742];
const KL = (data = KODE) => `kode = [${data.join(', ')}]`;
const lab = (pre, n, start = 3) => ['1–2', ...Array.from({ length: n }, (_, i) => `${pre}${i + start}`)];
const BODY = {
  bersarang: ['bandingkan = 0', 'ganda = []', 'for i in range(len(kode)):', '    for j in range(i + 1, len(kode)):', '        bandingkan = bandingkan + 1', '        if kode[i] == kode[j]:', '            ganda.append(kode[i])', 'print(ganda, bandingkan)'],
  set: ['sudah = set()', 'ganda = []', 'for k in kode:', '    if k in sudah:', '        ganda.append(k)', '    else:', '        sudah.add(k)', 'print(ganda)'],
  A: ['sudah = []', 'ganda = []', 'for k in kode:', '    if k in sudah:', '        ganda.append(k)', '    else:', '        sudah.append(k)'],
  B: ['ganda = set()', 'for k in kode:', '    if kode.count(k) > 1:', '        ganda.add(k)'],
  C: ['urut = sorted(kode)', 'ganda = set()', 'for i in range(len(urut) - 1):', '    if urut[i] == urut[i + 1]:', '        ganda.add(urut[i])'],
  D: ['ada_ganda = len(set(kode)) < len(kode)'],
};
BODY.rudi = BODY.bersarang.map((x, i) => (i === 3 ? '    for j in range(len(kode)):' : x));
BODY.rudi2 = BODY.rudi.map((x, i) => (i === 5 ? '        if i != j and kode[i] == kode[j]:' : x));
// [id, label, labels for the code lines, growth]
export const VERSI = [['bersarang', 'versi bersarang (soal 1)', lab('', 8), 'kuadrat'], ['rudi', 'bug Rudi (soal 2a)', lab('', 8), 'kuadrat'], ['rudi2', 'bug Rudi diubah (soal 2b)', lab('', 8), 'kuadrat'], ['set', 'versi set (soal 3)', lab('', 8), 'linear'],
  ['A', 'potongan A', ['kode', ...BODY.A.map((_, i) => `A${i + 1}`)], 'kuadrat'], ['B', 'potongan B', ['kode', ...BODY.B.map((_, i) => `B${i + 1}`)], 'kuadrat'], ['C', 'potongan C', ['kode', ...BODY.C.map((_, i) => `C${i + 1}`)], 'n log n'], ['D', 'potongan D', ['kode', 'D1'], 'linear']];
export const linesOf = (id, data = KODE) => [KL(data), ...BODY[id]];
const verOf = (id) => VERSI.find((v) => v[0] === id);

// Cost of the statement just run, from its text and the variables before and after it.
const len = (x) => (x instanceof PySet ? x.size : x?.length ?? 0);
export function cost(text, before, after) {
  let m;
  if (/bandingkan = bandingkan \+ 1/.test(text)) return 1;
  if ((m = text.match(/^\s*if (\w+) in (\w+):/))) { const c = after[m[2]]; if (c instanceof PySet) return 1; const i = c.indexOf(after[m[1]]); return i >= 0 ? i + 1 : c.length; }
  if ((m = text.match(/(\w+)\.count\(/))) return len(after[m[1]]);
  if ((m = text.match(/sorted\((\w+)\)/))) { const n = len(after[m[1]]); return n > 1 ? Math.round(n * Math.log2(n)) : n; }
  if (/^\s*if urut\[i\] == urut\[i \+ 1\]/.test(text)) return 1;
  if ((m = text.match(/len\(set\((\w+)\)\)/))) return len(after[m[1]]);
  if ((m = text.match(/^\s*(\w+) = set\((\w+)\)/))) return len(before[m[2]] ?? after[m[2]]);
  if ((m = text.match(/list\(set\((\w+)\) & set\((\w+)\)\)/))) { const a = before[m[1]] ?? after[m[1]]; const b = before[m[2]] ?? after[m[2]]; return len(a) + len(b) + Math.min(new PySet(a).size, new PySet(b).size); }
  if (/hitung\[k\] = hitung\.get\(k, 0\) \+ 1/.test(text) || /^\s*if hitung\[k\] >= 2/.test(text)) return 1;
  return 0;
}
const scopeVars = (st) => (st.frames.length ? st.frames[st.frames.length - 1].vars : st.vars);
// Run a program and add up the step model.
export function runCounted(lines, { limit = 60000 } = {}) {
  const r = makePyRunner(lines, { limit }); let steps = 0; let before = {}; let g;
  do { g = r.gen.next(); if (!g.done) { const after = scopeVars(r.state); steps += cost(lines[g.value.line] || '', before, after); before = { ...after }; } } while (!g.done && !r.state.error);
  return { steps, R: r.state };
}

// Size of `sudah` when 2917 is checked the second time (read live, since sets change in place).
export function sizeAtSecond() {
  const lines = linesOf('set'); const r = makePyRunner(lines, { limit: 5000 }); let seen = 0; let g;
  do { g = r.gen.next(); if (!g.done && g.value.line === 4 && r.state.vars.k === 2917 && ++seen === 2) return r.state.vars.sudah.size; } while (!g.done);
  return null;
}

// Fictional 6-digit codes for big data, seeded so every screen shows the same counts.
export function acak(n, seed = n) {
  let s = seed >>> 0; const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return Array.from({ length: n }, () => 100000 + Math.floor(rnd() * 900000));
}
// The same step model in closed form, for data too big to step through.
export function langkah(id, data) {
  const n = data.length;
  if (id === 'bersarang') return (n * (n - 1)) / 2;
  if (id === 'rudi' || id === 'rudi2' || id === 'B') return n * n;
  if (id === 'set' || id === 'D') return n;
  if (id === 'C') return (n > 1 ? Math.round(n * Math.log2(n)) : n) + Math.max(0, n - 1);
  const pos = new Map(); let s = 0; for (const k of data) { if (pos.has(k)) s += pos.get(k) + 1; else { s += pos.size; pos.set(k, pos.size); } } return s;
}

// Worksheet timing table (Python 3.13 on one computer), in milliseconds.
export const WAKTU = [[1000, 15, 0.045], [2000, 62, 0.11], [4000, 261, 0.24], [8000, 1029, 0.49]];
export const WAKTU_A = [3.8, 8.7, 35, 151];
const fmt = (x) => fmtNum(x, 3);

// Two schools of soal 6: 3.000 and 4.000 fictional codes with some in common.
export function duaSekolah() {
  const pool = [...new Set(acak(9000, 4343))]; const a = pool.slice(0, 3000); const b = [...pool.slice(2880, 2940), ...pool.slice(3000, 6940)];
  return { a, b, sama: a.filter((x) => new Set(b).has(x)) };
}

// ---- Permainan: Balap Kode Pendaftaran ----
// The team is the code-racing machine and pays one token per step; the
// opponent is the announcement clock: 512.000 codes in one minute.
const HEAD43 = {
  jalan: ['Jalankan Si Bersarang', 'Jadilah mesinnya: bandingkan setiap pasangan kode, satu token per perbandingan.', '512.000 kode harus beres dalam 1 menit!'],
  menara: ['Menara Token', 'Hitung token untuk data yang makin besar.', 'Datanya akan jauh lebih besar…'],
  rudi: ['Bug Rudi', 'Temukan baris yang salah, ramalkan hasilnya, lalu jalankan versi Rudi.', 'Rudi mengetik ulang terburu-buru!'],
  laci: ['Laci Ajaib set', 'Masukkan setiap kode ke laci angka terakhirnya. Satu laci, satu token.', 'Masih membuka semua kartu?'],
  jam: ['Lawan Jam Pengumuman', 'Isi perkiraan waktu, lalu adu dengan Jam Pengumuman.', 'Waktu hanya 1 menit (60.000 ms)!'],
  cepat: ['Komputer 10 Kali Lebih Cepat', 'Bandingkan membeli komputer baru dengan mengganti algoritma.', '"Beli komputer baru saja!"'],
  buru: ['Buru Perulangan Tersembunyi', 'Ketuk bagian kode yang diam-diam memeriksa seluruh list.', 'Perulangan bisa bersembunyi di satu kata!'],
  urut: ['Urutan Balapan', 'Hitung langkah potongan C dan D, lalu urutkan dari yang tercepat.', 'Siapa juara untuk 512.000 kode?'],
  adu: ['Adu Versi Tercepat', 'Susun fungsi dua sekolah yang paling sedikit langkahnya.', 'SMA A 3.000 dan SMA B 4.000 pendaftar!'],
  bos: ['Penghitung Kemunculan', 'Jadilah dictionary hitung: catat setiap kode dalam sekali jalan.', 'Berapa kali setiap kode muncul?'],
};
const msg43 = (t) => el('p', { class: 'reveal info' }, t);
const bodyView = (id, o = {}) => codeView(BODY[id], { labels: verOf(id)[2].slice(1), ...o });
const kartu43 = ({ hl = [], redup = [] } = {}) => el('div', { class: 'bk43-kartu-kartu' }, KODE.map((k, n) => el('div', { class: `bk43-kk ${hl.includes(n) ? 'banding' : ''} ${redup.includes(n) ? 'redup' : ''}`, 'data-n': String(n) }, el('small', null, `[${n}]`), el('b', null, String(k)))));
export const PAIRS = []; for (let i = 0; i < KODE.length; i++) for (let j = i + 1; j < KODE.length; j++) PAIRS.push([i, j]);

// Misi 1: be the nested loop; the player takes over for i = 3.
function jalanRound(area, ctx, { oops, done }) {
  const msg = msg43('Mesin membandingkan pasangan untuk i = 0, 1, 2. Perhatikan tokennya.');
  const M0 = PAIRS.findIndex(([i]) => i === 3); const M1 = PAIRS.findIndex(([i]) => i === 4);
  let k = 0; let tok = 0; const ganda = []; let manual = false;
  const top = el('div', { class: 'bk43-kolom' }); const left = el('div', { class: 'bk43-kolom' }); const right = el('div', { class: 'bk43-kolom' });
  const draw = () => {
    const [i, j] = PAIRS[Math.min(k, PAIRS.length - 1)];
    fill(top, kartu43({ hl: k < PAIRS.length ? [i, j] : [] }));
    fill(left, bodyView('bersarang', { hl: k < PAIRS.length ? [4] : [7] }));
    fill(right, el('div', { class: 'bk43-var' }, k < PAIRS.length ? `i = ${i}   j = ${j}` : 'selesai'), el('div', { class: 'bk43-token' }, `🪙 bandingkan = ${tok}`), el('div', { class: 'bk43-var' }, `ganda = ${pyRepr(ganda)}`),
      manual ? el('div', { class: 'bk43-tombol', 'data-a': String(KODE[i]), 'data-b': String(KODE[j]) }, onTap(el('button', { type: 'button', class: 'bk43-pilih', 'data-v': 'beda' }, `${KODE[i]} ≠ ${KODE[j]}: lanjut`), () => tap('beda')), onTap(el('button', { type: 'button', class: 'bk43-pilih sama', 'data-v': 'sama' }, `${KODE[i]} = ${KODE[j]}: ganda.append`), () => tap('sama'))) : null);
  };
  const step = () => { const [i, j] = PAIRS[k]; tok++; if (KODE[i] === KODE[j]) ganda.push(KODE[i]); k++; };
  const auto = (until, then) => { const tick = () => { if (!area.isConnected) return; if (k >= until) { then(); return; } step(); draw(); setTimeout(tick, 60); }; tick(); };
  function tap(v) {
    if (!manual) return; const [i, j] = PAIRS[k]; const want = KODE[i] === KODE[j] ? 'sama' : 'beda';
    if (v !== want) { oops(); say(msg, 'bad', want === 'sama' ? 'Lihat lagi: kedua kartu sama!' : 'Kedua kode berbeda.'); return; }
    ctx.sound.tap(); step();
    if (want === 'sama') say(msg, 'info', `Baris 9 berjalan saat i = ${i} dan j = ${j}: perbandingan ke-${tok}!`);
    if (k < M1) { draw(); if (want !== 'sama') say(msg, 'info', 'Tepat. Pasangan berikutnya.'); return; }
    manual = false; draw(); say(msg, 'info', 'i = 3 selesai. Mesin menuntaskan sisanya…');
    auto(PAIRS.length, () => { draw(); say(msg, 'info', 'Selesai! Isi papan hasil balapan.');
      right.append(fillBoard(ctx, { oops, msg, view: rowsView([['print: [2917] ', '_'], ['2917 ketahuan di perbandingan ke-', '_'], ['token untuk n kode: ', '_']]), chips: ['66', '37', 'n(n − 1)/2', '144', '36', 'n²'], want: ['66', '37', 'n(n − 1)/2'],
        hints: ['Hitung token di akhir.', '11 + 10 + 9 untuk i = 0, 1, 2, lalu 7 lagi.', 'Kode pertama dibandingkan n − 1 kali, kedua n − 2 kali, dan seterusnya: setengah dari n(n − 1).'],
        done: () => { say(msg, '', '66 token untuk 12 kode. Setiap pasangan dibandingkan tepat sekali: n(n − 1)/2.'); done(); } })); });
  }
  draw();
  area.append(top, el('div', { class: 'bk43-dua' }, left, right), msg);
  auto(M0, () => { manual = true; draw(); say(msg, 'info', 'Giliranmu menjadi mesin untuk i = 3: ketuk "lanjut" bila kodenya beda, "ganda.append" bila sama.'); });
}

// Misi 1b: token towers for larger data.
export const MENARA = ['4.950', '499.500', '4.999.950.000', '124.999.750.000'];
function menaraRound(area, ctx, { oops, done }) {
  const msg = msg43('Seret banyak token n(n − 1)/2 ke setiap menara, dari atas.');
  area.append(el('div', { class: 'bk43-dua' }, bodyView('bersarang'), fillBoard(ctx, { oops, msg, view: rowsView([['n = 12 → ', '66', ' token'], ['n = 100 → ', '_'], ['n = 1.000 → ', '_'], ['n = 100.000 → ', '_'], ['n = 500.000 → ', '_']]),
    chips: [...MENARA, '10.000', '1.000.000', '250.000.000.000', '5.050'], want: MENARA, hints: ['100 × 99 / 2.', '1.000 × 999 / 2.', '100.000 × 99.999 / 2.', '500.000 × 499.999 / 2.'],
    done: () => { say(msg, '', 'Data 5.000 kali lebih banyak (100 → 500.000), token 25 juta kali lebih banyak. Itulah pertumbuhan kuadrat.'); done(); } })), msg);
}

// Misi 2: Rudi's range bug.
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg43('Rudi mengetik ulang versi bersarang. Ketuk baris yang berbeda dan salah.'); const left = el('div', { class: 'bk43-kolom' }); const right = el('div', { class: 'bk43-kolom' }); const out = layar();
  const A = runPy(linesOf('rudi'), { limit: 5000 }); const B = runPy(linesOf('rudi2'), { limit: 5000 });
  fill(left, el('small', null, 'Kode Rudi'), bodyView('rudi', { cls: 'ketuk', onLine: (i) => {
    if (left.dataset.ok) return;
    if (i !== 3) { oops(); say(msg, 'bad', 'Baris ini sama dengan versi bersarang. Lihat dari mana j mulai.'); return; }
    left.dataset.ok = '1'; ctx.sound.good(); fill(left, el('small', null, 'Kode Rudi'), bodyView('rudi', { warn: [3] }));
    say(msg, 'info', 'Baris 6: j mulai dari 0, jadi setiap kode dibandingkan dengan semua, termasuk dirinya sendiri. Ramalkan hasilnya.');
    fill(right, fillBoard(ctx, { oops, msg, view: rowsView([['bandingkan = ', '_'], ['isi ganda: ', '_', ' kode'], ['2917 muncul ', '_', ' kali']]), chips: ['144', '66', '14', '12', '4', '2'], want: ['144', '14', '4'],
      hints: ['12 × 12 pasangan.', 'Setiap kode sama dengan dirinya sendiri (12), ditambah 2917 dengan pasangannya dua kali.', '2917 di [3] dan [10]: (3,3), (3,10), (10,3), (10,10).'],
      done: () => { say(msg, 'info', 'Mesin menjalankan versi Rudi…'); fill(right, out); play(out, A.out, { end: () => {
        say(msg, 'info', 'Rudi menambah if i != j and … di baris 8. Ramalkan lagi.');
        right.append(fillBoard(ctx, { oops, msg, view: rowsView([['ganda = ', '_'], ['bandingkan = ', '_']]), chips: [pyRepr(B.vars.ganda), '[2917]', String(B.vars.bandingkan), '66'], want: [pyRepr(B.vars.ganda), String(B.vars.bandingkan)],
          hints: ['Pasangan (3, 10) dan (10, 3) sama-sama tercatat.', 'Perulangannya tidak berubah: tetap 12 × 12.'],
          done: () => { say(msg, '', 'range(i + 1, len(kode)) memeriksa setiap pasangan tepat sekali dan tidak membandingkan kode dengan dirinya: 66 token, bukan 144.'); done(); } }));
      } }); } }));
  } }));
  area.append(el('div', { class: 'bk43-dua' }, left, right), msg);
}

// Misi 3: ten drawers keyed by the last digit.
function laciRound(area, ctx, { oops, done }) {
  const msg = msg43('Seret kartu kode, mulai dari [0], ke laci angka terakhirnya.'); let n = 0; let tok = 0; let atSecond = null; const ganda = [];
  const cards = el('div', { class: 'bk43-kartu-kartu' }, KODE.map((k, i) => el('div', { class: 'bk43-kk bk43-tarik', 'data-drag': String(i) }, el('small', null, `[${i}]`), el('b', null, String(k)))));
  const laci = Array.from({ length: 10 }, (_, d) => el('div', { class: 'bk43-laci', 'data-drop': String(d) }, el('small', null, `laci ${d}`), el('div', { class: 'bk43-isi' })));
  const gBox = el('div', { class: 'bk43-ganda' }, el('small', null, 'ganda'));
  const info = el('div', { class: 'bk43-token' }, '🪙 0'); const box = el('div', { class: 'bk43-kolom' });
  const host = el('div', { class: 'bk43-kolom' }, cards, el('div', { class: 'bk43-laci-laci' }, laci), el('div', { class: 'bk43-tombol' }, info, gBox));
  dnd(host, (card, d) => {
    if (!d.classList.contains('bk43-laci')) return; const i = +card.dataset.drag;
    if (i !== n) { say(msg, 'info', `Periksa sesuai urutan list: kartu [${n}] dulu.`); return; }
    const want = KODE[i] % 10;
    if (+d.dataset.drop !== want) { oops(); shake(card); say(msg, 'bad', `Lihat angka terakhir ${KODE[i]}: laci ${want}.`); return; }
    tok++; n++; ctx.sound.tap(); const isi = d.querySelector('.bk43-isi'); const sudah = laci.reduce((s, l) => s + l.querySelectorAll('.bk43-kk').length, 0);
    card.classList.add('locked');
    if ([...isi.children].some((c) => c.dataset.k === String(KODE[i]))) { atSecond = sudah; ganda.push(KODE[i]); card.remove(); gBox.append(el('b', null, String(KODE[i]))); say(msg, 'info', `${KODE[i]} sudah ada di laci ${want}! Cukup buka satu laci, tanpa membandingkan semua kartu.`); }
    else { card.dataset.k = String(KODE[i]); isi.append(card); if (n < KODE.length) say(msg, 'info', 'Tepat. Satu laci, satu token.'); }
    fill(info, `🪙 ${tok}`);
    if (n < KODE.length) return;
    cards.remove(); say(msg, 'info', 'Semua kode diperiksa. Isi papan hasil.');
    fill(box, el('div', { class: 'bk43-dua' }, bodyView('set', { hl: [3] }), fillBoard(ctx, { oops, msg, view: rowsView([['isi sudah saat 2917 kedua: ', '_', ' kode'], ['baris 6 berjalan: ', '_', ' kali'], ['yang dikorbankan: ', '_']]), chips: [String(atSecond), '11', String(tok), '66', 'memori', 'ketepatan'], want: [String(atSecond), String(tok), 'memori'],
      hints: ['Hitung kartu di laci sebelum 2917 kedua datang.', 'Satu kali untuk setiap kode: n kali.', 'Laci-laci set butuh tempat penyimpanan tambahan.'],
      done: () => { say(msg, '', `${tok} token, bukan 66: set langsung membuka satu laci (hash). Harganya memori tambahan.`); done(); } })));
  });
  fill(box, host);
  area.append(box, msg);
}

// Misi 4: race the announcement clock with the timing table.
export const JAM = ['4.116', '0,98', '4.214.784', '31'];
function jamRound(area, ctx, { oops, done }) {
  const msg = msg43('Setiap n digandakan: bersarang kira-kira 4 kali, set 2 kali. Seret perkiraannya ke tabel.'); const box = el('div', { class: 'bk43-kolom' });
  const view = (mk) => el('table', { class: 'bk43-tabel' }, el('tr', null, ['n kode', 'bersarang (ms)', 'set (ms)'].map((h) => el('th', null, h))), WAKTU.map(([n, a, b]) => el('tr', null, el('td', null, fmtNum(n)), el('td', null, fmtNum(a, 3)), el('td', null, fmtNum(b, 3)))),
    [16000, 512000].map((n) => el('tr', { class: 'isi' }, el('td', null, fmtNum(n)), el('td', null, mk()), el('td', null, mk()))));
  fill(box, fillBoard(ctx, { oops, msg, view, chips: [...JAM, '2.058', '1,96', '65.856', '3,9'], want: JAM, hints: ['1.029 × 4.', '0,49 × 2.', '8.000 × 2⁶ = 512.000: 1.029 × 4⁶ = 1.029 × 4.096.', '0,49 × 2⁶ = 0,49 × 64.'],
    done: () => { say(msg, 'info', 'Jam Pengumuman mulai berdetak: 60.000 ms!'); race(); } }));
  area.append(box, msg);
  function race() {
    const bar = (nm, ms, cls) => el('div', { class: 'bk43-lintasan' }, el('span', null, nm), el('div', { class: 'bk43-jalur' }, el('div', { class: `bk43-isian ${cls}`, style: { width: '0%' } }), el('div', { class: 'bk43-garis-jam' })), el('b', null, ''));
    const L = [bar('bersarang', 4214784, 'lambat'), bar('set', 31, 'cepat')]; box.append(el('div', { class: 'bk43-balap' }, L));
    setTimeout(() => { if (!box.isConnected) return; L[1].querySelector('.bk43-isian').style.width = '1%'; L[1].lastChild.textContent = '31 ms ✓'; L[0].querySelector('.bk43-isian').style.width = '100%'; L[0].lastChild.textContent = '≈ 70 menit ✗';
      setTimeout(() => { if (!box.isConnected) return; say(msg, '', 'Hanya versi set yang mengalahkan Jam Pengumuman: 31 ms, sedangkan bersarang sekitar 70 menit.'); done(); }, 1200); }, 300);
  }
}

// Misi 4b: a faster computer against a better algorithm.
function cepatRound(area, ctx, { oops, done }) {
  const msg = msg43('Dodi ingin membeli komputer 10 kali lebih cepat. Seret hasilnya.');
  area.append(fillBoard(ctx, { oops, msg, view: rowsView([['bersarang, 512.000 kode, komputer lama ≈ ', '70 menit'], ['bersarang, 512.000 kode, komputer baru ≈ ', '_'], ['set, 512.000 kode, komputer lama ≈ ', '_'], ['n digandakan: waktu bersarang × ', '_', ', waktu set × ', '_']]),
    chips: ['7 menit', '0,03 detik', '4', '2', '70 menit', '7 detik', '8'], want: ['7 menit', '0,03 detik', '4', '2'], hints: ['70 menit dibagi 10.', '31 ms adalah 0,031 detik.', 'Pertumbuhan kuadrat.', 'Pertumbuhan linear.'],
    done: () => { say(msg, '', 'Komputer baru: 7 menit, masih kalah oleh Jam. Algoritma set di komputer lama: 0,03 detik. Mengganti algoritma jauh lebih ampuh.'); done(); } }), msg);
}

// Misi 5: hidden loops in A and B.
function buruRound(area, ctx, { oops, done }) {
  const msg = msg43('Ketuk baris di setiap potongan yang diam-diam memeriksa seluruh list.'); const got = new Set();
  const HID = { A: 3, B: 2 }; const boxes = {};
  const draw = (id) => fill(boxes[id], el('b', null, `Potongan ${id}`), bodyView(id, { cls: got.has(id) ? '' : 'ketuk', warn: got.has(id) ? [HID[id]] : [], after: (i) => (got.has(id) && i === HID[id] ? el('span', { class: 'bk43-kaca' }, '🔍 perulangan tersembunyi') : null), onLine: got.has(id) ? null : (i) => tap(id, i) }));
  function tap(id, i) {
    if (got.has(id)) return;
    if (i !== HID[id]) { oops(); say(msg, 'bad', /for /.test(BODY[id][i]) ? 'Itu perulangan yang terlihat. Cari yang tersembunyi di dalamnya.' : 'Baris ini hanya satu langkah.'); return; }
    got.add(id); ctx.sound.good(); draw(id);
    say(msg, 'info', id === 'A' ? 'k in sudah pada list memeriksa isi sudah satu per satu!' : 'kode.count(k) memeriksa seluruh list setiap kali!');
    if (got.size < 2) return;
    area.append(fillBoard(ctx, { oops, msg, view: rowsView([['langkah A (12 kode): ', '_'], ['langkah B (12 kode): ', '_']]), chips: ['59', '144', '12', '66'], want: ['59', '144'],
      hints: ['Setiap k in sudah memeriksa sampai ketemu atau sampai habis: 0 + 1 + … + 10 + 4.', 'count memeriksa 12 kode, untuk 12 kode: 12 × 12.'],
      done: () => { say(msg, '', 'B tampak satu perulangan, padahal count menyembunyikan perulangan kedua: kuadrat. A juga kuadrat.'); done(); } }));
    area.append(msg);
  }
  boxes.A = el('div', { class: 'bk43-kolom' }); boxes.B = el('div', { class: 'bk43-kolom' }); draw('A'); draw('B');
  area.append(el('div', { class: 'bk43-dua' }, boxes.A, boxes.B), msg);
}

// Misi 5b: C, D and the race order.
export const URUT = ['54', '12', 'D', 'C', 'A', 'B'];
function urutRound(area, ctx, { oops, done }) {
  const msg = msg43('Sorted kira-kira n × log₂ n langkah (43 untuk 12 kode). Seret langkahnya, lalu urutan juara.');
  area.append(el('div', { class: 'bk43-dua' }, el('div', { class: 'bk43-kolom' }, el('b', null, 'Potongan C'), bodyView('C', { warn: [0] })), el('div', { class: 'bk43-kolom' }, el('b', null, 'Potongan D'), bodyView('D', { warn: [0] }))),
    fillBoard(ctx, { oops, msg, view: rowsView([['C: 43 + 11 = ', '_', ' langkah · D: ', '_', ' langkah'], ['512.000 kode, tercepat dulu: ', '_', ', ', '_', ', ', '_', ', ', '_']]), chips: [...URUT, '43', '66'], want: URUT,
      hints: ['Pengurutan 43, ditambah 11 perbandingan tetangga.', 'set(kode) memasukkan 12 kode: 12 langkah.', 'Linear paling cepat.', 'n log n sedikit di atas linear.', 'A dan B sama-sama kuadrat, tetapi in pada list berhenti begitu ketemu.', 'count selalu memeriksa seluruh list.'],
      done: () => { say(msg, '', `Potongan A: ${WAKTU_A.map((x) => fmtNum(x, 3)).join('; ')} ms, juga sekitar 4 kali lipat: ±10 menit untuk 512.000 kode. Ia lebih cepat daripada bersarang hanya karena in dikerjakan bagian Python yang ditulis dalam bahasa C.`); done(); } }), msg);
}

// Misi 6: build the two-schools function, then count its steps.
function aduRound(area, ctx, { oops, done }) {
  const msg = msg43('Susun fungsi yang mencari pendaftar di dua sekolah dengan langkah paling sedikit.'); const box = el('div', { class: 'bk43-kolom' }); const out = layar();
  fill(box, tileSlots(ctx, { oops, msg, build: ['def di_dua_sekolah(a, b):', ['sb', 1], ['h', 1], ['for', 1], ['if', 2], ['app', 3], ['ret', 1]],
    tiles: [['sb', 'b = set(b)'], ['h', 'hasil = []'], ['for', 'for x in a:'], ['if', 'if x in b:'], ['app', 'hasil.append(x)'], ['ret', 'return hasil'], ['sa', 'a = set(a)', 'Mengubah a menjadi set tidak mempercepat x in b, malah mengacak urutan hasil.'], ['forb', 'for x in b:', 'Telusuri a, lalu periksa ke dalam b.']],
    order: 'Ubah b menjadi set dulu, baru siapkan hasil dan telusuri a.',
    onFull: () => { const D = duaSekolah(); const L = cekSusun(S_CODE.slice(1), D); const S = cekSusun(['    b = set(b)', ...S_CODE.slice(1)], D);
      fill(box, out, fillBoard(ctx, { oops, msg, view: rowsView([['versi list paling banyak 3.000 × 4.000 = ', '_'], ['versi set: 4.000 + 3.000 = ', '_']]), chips: ['12.000.000', '7.000', '12.000', '7.000.000'], want: ['12.000.000', '7.000'],
        hints: ['Setiap x di a memeriksa seluruh b.', 'Membuat set 4.000 langkah, lalu 3.000 pemeriksaan satu langkah.'],
        done: () => { play(out, [`versi list: ${L.msg} · ${fmtNum(L.steps)} langkah`, `versi set : ${S.msg} · ${fmtNum(S.steps)} langkah`], { end: () => { say(msg, '', `Satu baris b = set(b) memangkas ${fmtNum(L.steps)} langkah menjadi ${fmtNum(S.steps)}.`); done(); } }); } }));
      say(msg, 'info', 'Fungsi tersusun. Berapa langkahnya?'); } }));
  area.append(box, msg);
}

// Misi Bos: be the counting dictionary.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg43('Kartu yang menyala sedang dibaca. Ketuk barisnya di hitung, atau "+ kunci baru" bila belum ada.'); const hit = new Map(); let n = 0; let tok = 0; let fase = 1; const printed = []; const out = layar();
  const left = el('div', { class: 'bk43-kolom' }); const right = el('div', { class: 'bk43-kolom' }); const top = el('div', { class: 'bk43-kolom' });
  const draw = () => {
    fill(top, kartu43({ hl: fase === 1 && n < KODE.length ? [n] : [], redup: Array.from({ length: n }, (_, i) => i) }));
    fill(left, codeView(TANTANGAN, { hl: fase === 1 ? [2] : [4] }));
    fill(right, el('div', { class: 'bk43-token' }, `🪙 ${tok}`), el('div', { class: 'bk43-kamus', 'data-fase': String(fase) }, el('small', null, 'hitung = {'), [...hit].map(([k, v]) => onTap(el('button', { type: 'button', class: `bk43-entri ${printed.includes(k) ? 'on' : ''}`, 'data-k': String(k) }, `${k}: ${v}`), () => tapKey(k))), el('small', null, '}')),
      fase === 1 ? onTap(el('button', { type: 'button', class: 'bk43-pilih', 'data-k': 'baru' }, '+ kunci baru'), () => tapKey(null)) : null, fase === 2 ? out : null);
  };
  function tapKey(key) {
    if (fase === 1) {
      const k = KODE[n]; const has = hit.has(k);
      if (key === null ? has : key !== k) { oops(); say(msg, 'bad', has ? `${k} sudah ada di hitung: tambah nilainya.` : key === null ? 'Kunci ini belum ada.' : `${k} belum ada di hitung: buat kunci baru.`); return; }
      hit.set(k, (hit.get(k) || 0) + 1); tok++; n++; ctx.sound.tap();
      if (n < KODE.length) { draw(); say(msg, 'info', has ? `hitung[${k}] menjadi ${hit.get(k)}.` : 'Tepat.'); return; }
      fase = 2; draw(); say(msg, 'info', 'Perulangan kedua: periksa setiap kunci. Ketuk kunci yang dicetak (hitung[k] >= 2).'); return;
    }
    if (fase !== 2 || printed.includes(key)) return;
    if (hit.get(key) < 2) { oops(); say(msg, 'bad', `${key} hanya muncul sekali.`); return; }
    printed.push(key); ctx.sound.good(); fase = 3; draw(); play(out, [`${key} ${hit.get(key)}`]);
    say(msg, 'info', `Ada ${hit.size} kunci berbeda yang diperiksa. Hitung langkahnya.`);
    right.append(fillBoard(ctx, { oops, msg, view: rowsView([['12 + ', '_', ' = ', '_', ' langkah']]), chips: [String(hit.size), String(12 + hit.size), '12', '24'], want: [String(hit.size), String(12 + hit.size)],
      hints: ['Satu pemeriksaan untuk setiap kunci berbeda.', 'Jumlahkan.'], done: () => { say(msg, '', `Sekali lewat, ${12 + hit.size} langkah: linear. Dictionary menghitung kemunculan tanpa perulangan bersarang.`); done(); } }));
  }
  draw();
  area.append(top, el('div', { class: 'bk43-dua' }, left, right), msg);
}

export default {
  id: 'sma-43-percepat-kode',
  title: 'Mempercepat Kode',
  topic: 'Efisiensi kode Python: variabel penghitung, perulangan bersarang dan pertumbuhan kuadrat, set untuk pemeriksaan cepat, membaca tabel waktu terhadap ukuran data, perulangan tersembunyi (in pada list, count, sorted), serta menukar memori dengan waktu',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '⚡',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Hitung perbandingan pada pemeriksa NIK ganda yang bersarang, perbaiki bug Rudi, tulis ulang dengan set, baca tabel waktu, buru perulangan tersembunyi, lalu percepat fungsi dua sekolah.',
  extraModes: [
    { id: 'penghitung', icon: '🔢', label: 'Penghitung Operasi', desc: 'Pilih versi kode dan ukuran data. Untuk 12 kode, jalankan langkah demi langkah dan lihat penghitungnya', create: createCounter },
    { id: 'grafik', icon: '📈', label: 'Grafik Pertumbuhan', desc: 'Banyak langkah setiap versi untuk 1.000 sampai 8.000 kode: garis kuadrat dan garis lurus', create: createChart },
    { id: 'giliran', icon: '🕵️', label: 'Tebak Versi', desc: 'Satu tim diam-diam memilih versi kode, tim lain menebak pola dan versinya dari banyak langkah untuk 1.000 dan 2.000 kode', create: createTeams },
    { id: 'susun', icon: '🧩', label: 'Susun Fungsi Dua Sekolah', desc: 'Susun fungsi dari potongan kode, lalu layar memeriksa hasilnya dan menghitung langkahnya. Hasil benar dengan langkah paling sedikit menang', create: createBuild },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bk43-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'bk43-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD43[k];
        foe = el('div', { class: 'bk43-musuh' }, el('b', null, '⏱️ Jam Pengumuman'), el('span', null, ulah));
        wrap.append(el('div', { class: 'bk43-kepala' }, misiHead(no, judul, tujuan, '🏎️'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Jam terkalahkan ✓'; next(ms); } });
      if (r === 0) { go('jalan', 1); jalanRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('menara', 1); menaraRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('rudi', 2); rudiRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('laci', 3); laciRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('jam', 4); jamRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('cepat', 4); cepatRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('buru', 5); buruRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('urut', 5); urutRound(area, ctx, fin(7000)); }
      else if (r === 8) { go('adu', 6); aduRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

export const S_CODE = ['def di_dua_sekolah(a, b):', '    hasil = []', '    for x in a:', '        if x in b:', '            hasil.append(x)', '    return hasil'];
export const TANTANGAN = ['hitung = {}', 'for k in kode:', '    hitung[k] = hitung.get(k, 0) + 1', 'for k in hitung:', '    if hitung[k] >= 2:', '        print(k, hitung[k])'];


// Step counter: 12 worksheet codes step by step, or big fictional data counted at once.
function createCounter(root, ctx) {
  const wrap = el('div', { class: 'act percepat-kode' });
  root.append(wrap);
  let ver = 'bersarang'; let n = 12; let steps = 0; let before = {};
  const counter = el('div', { class: 'pk-hitung' }); const showCount = (done) => counter.replaceChildren(el('small', null, 'banyak langkah menurut lembar kerja'), el('b', null, fmtNum(steps)), el('small', null, done ? `✓ selesai · pola: ${verOf(ver)[3]}` : 'ketuk Langkah atau Otomatis'));
  const draw = () => {
    const pickV = el('div', { class: 'seg pk-versi' }, VERSI.map(([id, label]) => onTap(el('button', { class: `seg-btn ${id === ver ? 'on' : ''}`, type: 'button' }, label), () => { ver = id; draw(); })));
    const pickN = el('div', { class: 'seg pk-versi' }, [12, 100, 1000, 2000, 4000, 8000].map((x) => onTap(el('button', { class: `seg-btn ${x === n ? 'on' : ''}`, type: 'button' }, x === 12 ? '12 kode lembar kerja' : `${fmtNum(x)} kode acak`), () => { n = x; draw(); })));
    let body;
    if (n === 12) {
      const lines = linesOf(ver);
      body = el('div', { class: 'pk-kecil-wrap' }, counter, pyTracer(lines, { labels: verOf(ver)[2], cls: 'pk-jejak', speed: 260, hideVars: ['kode'], onEnd: () => showCount(true), onStep: (g, st) => { if (!g) { steps = 0; before = {}; showCount(false); return; } const after = scopeVars(st); steps += cost(lines[g.line] || '', before, after); before = { ...after }; showCount(st.done); } }));
    } else {
      const data = acak(n); const s = langkah(ver, data);
      body = el('div', { class: 'pk-besar' }, pyCode([`kode = [ … ${fmtNum(n)} kode acak rekaan … ]`, ...BODY[ver]], { labels: verOf(ver)[2], cls: 'pk-kecil' }),
        el('div', { class: 'pk-hitung' }, el('small', null, `banyak langkah untuk ${fmtNum(n)} kode`), el('b', null, fmtNum(s)), el('small', null, `pola: ${verOf(ver)[3]}`)));
    }
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penghitung operasi'), pickV, pickN, body);
  };
  draw();
}

// Growth chart: steps for 1.000–8.000 codes; tap a legend chip to hide a line.
export const GRAFIK = ['bersarang', 'A', 'B', 'C', 'set', 'D'];
const WARNA = { bersarang: '#dc2626', A: '#f59e0b', B: '#7c3aed', C: '#0891b2', set: '#16a34a', D: '#2563eb' };
function createChart(root, ctx) {
  const wrap = el('div', { class: 'act percepat-kode' });
  root.append(wrap);
  const NS = [1000, 2000, 4000, 8000]; const data = Object.fromEntries(GRAFIK.map((id) => [id, NS.map((n) => langkah(id, acak(n)))]));
  const show = new Set(GRAFIK);
  const draw = () => {
    const W = 640; const H = 360; const P = { l: 92, r: 120, t: 16, b: 40 };
    const max = Math.max(1, ...[...show].flatMap((id) => data[id]));
    const x = (n) => P.l + ((n - 0) / 8000) * (W - P.l - P.r); const y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
    const svg = (tag, a = {}, ...c) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...c); return e; };
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
    // End labels pushed apart so lines that end together stay readable.
    const labY = {}; let lastY = Infinity; for (const id of [...show].sort((a, b) => data[a][3] - data[b][3])) { labY[id] = Math.min(y(data[id][3]), lastY - 16); lastY = labY[id]; }
    const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pk-grafik', role: 'img', 'aria-label': 'Grafik banyak langkah terhadap banyak kode' },
      ...ticks.map((v) => svg('g', {}, svg('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'pk-grid' }), svg('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'pk-sumbu' }, fmtNum(Math.round(v))))),
      ...NS.map((n) => svg('text', { x: x(n), y: H - P.b + 20, 'text-anchor': 'middle', class: 'pk-sumbu' }, fmtNum(n))),
      svg('text', { x: (P.l + W - P.r) / 2, y: H - 4, 'text-anchor': 'middle', class: 'pk-sumbu' }, 'banyak kode'),
      ...[...show].map((id) => svg('g', {}, svg('polyline', { points: [[0, 0], ...NS.map((n, i) => [n, data[id][i]])].map(([a, b]) => `${x(a)},${y(b)}`).join(' '), fill: 'none', stroke: WARNA[id], 'stroke-width': 3 }), ...NS.map((n, i) => svg('circle', { cx: x(n), cy: y(data[id][i]), r: 4, fill: WARNA[id] })), svg('text', { x: x(8000) + 8, y: labY[id] + 4, class: 'pk-label', fill: WARNA[id] }, verOf(id)[1].replace(' (soal 1)', '').replace(' (soal 3)', '')))));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Grafik pertumbuhan'),
      el('div', { class: 'seg pk-versi' }, GRAFIK.map((id) => onTap(el('button', { class: `seg-btn ${show.has(id) ? 'on' : ''}`, type: 'button', style: { '--c': WARNA[id] } }, verOf(id)[1]), () => { if (show.has(id)) { if (show.size > 1) show.delete(id); } else show.add(id); draw(); }))),
      g, el('table', { class: 'pk-tabel' }, el('tr', null, el('th', null, 'versi'), ...NS.map((n) => el('th', null, `${fmtNum(n)} kode`))), [...show].map((id) => el('tr', null, el('td', null, verOf(id)[1]), ...data[id].map((v) => el('td', null, fmtNum(v)))))),
      el('p', { class: 'pk-ket' }, 'Sembunyikan versi kuadrat untuk melihat garis lurus versi set dan potongan D lebih jelas.'));
  };
  draw();
}

// Team mode: one team picks a version in secret; the others see only the steps for 1.000 and 2.000 codes.
export const TEBAK = ['bersarang', 'A', 'B', 'C', 'set'];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act percepat-kode' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tebak Versi selesai', pts, again: () => pickTeams(wrap, 'Tebak Versi', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih versi diam-diam (tim lain jangan melihat)`), el('div', { class: 'pk-bank' }, TEBAK.map((id) => onTap(el('button', { class: 'pk-kartu', type: 'button' }, el('b', null, verOf(id)[1])), () => { ctx.sound.tap(); guess(boss, id); }))));
    }
    function guess(boss, id) {
      const who = (boss + 1) % nT; const s1 = langkah(id, acak(1000)); const s2 = langkah(id, acak(2000)); const ans = {};
      const draw = () => {
        const all = 'p' in ans && 'v' in ans;
        const row = (k, label, opts, right, pt) => el('div', { class: `sk-baris ${k in ans ? `beres ${ans[k] === right ? '' : 'pk-baris-salah'}` : ''}` }, el('span', null, label), k in ans ? el('b', { class: ans[k] === right ? 'pk-benar' : 'pk-salah' }, ans[k] === right ? `${right} ✓ +${pt}` : `${ans[k]} ✗ (${right})`) : el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { ans[k] = o; if (o === right) { pts[who] += pt; ctx.sound.good(); } else ctx.sound.bad(); draw(); }))));
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tebak versi Tim ${boss + 1}`),
          el('table', { class: 'pk-tabel pk-besar-tabel' }, el('tr', null, el('th', null, 'banyak kode'), el('th', null, 'banyak langkah')), el('tr', null, el('td', null, '1.000'), el('td', null, fmtNum(s1))), el('tr', null, el('td', null, '2.000'), el('td', null, fmtNum(s2))), el('tr', null, el('td', null, 'perbandingan'), el('td', null, `${fmtNum(s2 / s1, 2)} kali lipat`))),
          el('div', { class: 'sk-baris-baris pk-isi' }, row('p', 'Pola pertumbuhan (+1)', ['kuadrat', 'n log n', 'linear'], verOf(id)[3], 1), row('v', 'Versinya (+2)', TEBAK.map((x) => verOf(x)[1]), verOf(id)[1], 2)),
          ...(all ? [pyCode(BODY[id], { cls: 'pk-kecil' }), el('div', { class: 'kode-baris' }, button('Lanjut ➜', () => { t++; step(); }, 'primary'))] : []));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Versi', start);
}

// Build the two-schools function from pieces; the screen checks the result and counts steps.
export const POTONGAN = ['    hasil = []', '    b = set(b)', '    a = set(a)', '    for x in a:', '    for x in b:', '        if x in b:', '        if x in a:', '            hasil.append(x)', '    return hasil', '    return list(set(a) & set(b))'];
export function cekSusun(body, D = duaSekolah()) {
  const lines = ['def di_dua_sekolah(a, b):', ...body, 'hasil_akhir = di_dua_sekolah(data_a, data_b)'];
  const r = makePyRunner(lines, { limit: 60000, vars: { data_a: [...D.a], data_b: [...D.b] } }); let steps = 0; let before = {}; let g;
  do { g = r.gen.next(); if (!g.done) { const after = scopeVars(r.state); steps += cost(lines[g.value.line] || '', before, after); before = { ...after }; } } while (!g.done && !r.state.error);
  const st = r.state; if (st.error) return { ok: false, steps, msg: `${st.error.type}: ${st.error.message}` };
  const h = st.vars.hasil_akhir; const items = Array.isArray(h) ? h : h instanceof PySet ? h.items() : null;
  if (!items) return { ok: false, steps, msg: `hasilnya ${pyRepr(h)}, bukan list` };
  const want = new Set(D.sama); const ok = items.length === want.size && items.every((x) => want.has(x));
  return { ok, steps, msg: ok ? `${items.length} pendaftar di dua sekolah` : `${items.length} pendaftar, seharusnya ${want.size}` };
}
function createBuild(root, ctx) {
  const wrap = el('div', { class: 'act percepat-kode' });
  root.append(wrap);
  const D = duaSekolah();
  function start(nT) {
    const res = Array(nT).fill(null); let who = 0; let body = [];
    const draw = (info = '') => {
      wrap.replaceChildren(scoreBar(res.map((x) => (x ? (x.ok ? fmtNum(x.steps) : 'salah') : '-')), who), el('p', { class: 'prompt' }, `Tim ${who + 1}: susun fungsi dua sekolah`),
        el('div', { class: 'pk-dua' }, pyCode(['def di_dua_sekolah(a, b):', ...body], { cls: 'pk-kecil' }),
          el('div', { class: 'pk-samping' }, el('small', { class: 'pk-ket' }, 'Ketuk potongan untuk menambah baris'), el('div', { class: 'pk-potongan' }, POTONGAN.map((p) => onTap(el('button', { class: 'pk-pot', type: 'button' }, el('code', null, p.replace(/^ +/, (m) => '·'.repeat(m.length)))), () => { if (body.length < 8) { body.push(p); ctx.sound.tap(); draw(); } }))),
            el('div', { class: 'kode-baris' }, button('⌫ Hapus baris terakhir', () => { body.pop(); draw(); }), button('▶ Jalankan', () => {
              const c = cekSusun(body, D); res[who] = c; if (c.ok) ctx.sound.good(); else ctx.sound.bad();
              draw(`${c.ok ? '✓ Benar' : '✗ Belum benar'}: ${c.msg} · ${fmtNum(c.steps)} langkah.`);
            }, 'primary')))),
        el('p', { class: `reveal ${info.startsWith('✓') ? 'good' : info ? 'bad' : 'info'}` }, info || `SMA A ${fmtNum(D.a.length)} pendaftar, SMA B ${fmtNum(D.b.length)} pendaftar (kode rekaan).`),
        ...(res[who] ? [el('div', { class: 'kode-baris' }, button(who + 1 < nT ? `Giliran Tim ${who + 2} ➜` : 'Lihat hasil ➜', () => { if (who + 1 < nT) { who++; body = []; draw(); } else finish(); }, 'primary'))] : []));
    };
    const finish = () => {
      const best = Math.min(...res.filter((x) => x?.ok).map((x) => x.steps));
      ctx.sound.win();
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Adu versi tercepat'), el('div', { class: 'ab-lapisan' }, res.map((x, i) => el('div', { class: `ab-lap-baris ${x?.ok && x.steps === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}`), el('b', null, x?.ok ? `${fmtNum(x.steps)} langkah${x.steps === best ? ' 🏆' : ''}` : 'hasil salah')))),
        el('div', { class: 'kode-baris' }, button('Main lagi', () => pickTeams(wrap, 'Adu Versi Tercepat', start), 'primary')));
    };
    draw();
  }
  pickTeams(wrap, 'Adu Versi Tercepat', start);
}
