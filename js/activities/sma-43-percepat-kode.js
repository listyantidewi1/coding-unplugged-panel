// Mempercepat Kode — SMA/SMK (16–18 tahun), coding. Finding duplicate
// registration codes in Python: counting operations in nested loops, Rudi's
// range bug, rewriting with set, reading a fixed timing table, hidden loops
// (`in` on a list, count, sorted) and the two-schools question.
// Step model (worksheet): a comparison is 1; `in` on a list counts the members
// checked; count costs the list length; set `in`/add cost 1; sorted costs
// n·log2(n), rounded. Times are the worksheet's fixed data, never measured.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, pyTracer, fmtNum } from './smp-kit.js';
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
    const wrap = el('div', { class: 'act percepat-kode' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const code = (id, extra = {}) => pyCode(linesOf(id), { labels: verOf(id)[2], cls: 'pk-kecil', ...extra });
      if (r === 0) {
        const T = runPy(linesOf('bersarang'), { limit: 5000 }).trace; const hit = T.find((t) => t.line === 7);
        wrap.append(code('bersarang'));
        rowsChoose(wrap, ctx, { prompt: 'Versi pertama: saat baris 9 dijalankan', cls: 'pk-isi', rows: [
          ['ij', 'Nilai i dan j', [`i = ${hit.vars.i} dan j = ${hit.vars.j}`, 'i = 4 dan j = 11', 'i = 10 dan j = 3', 'i = 3 dan j = 11'], `i = ${hit.vars.i} dan j = ${hit.vars.j}`],
          ['ke', 'Perbandingan ke-', ['37', '30', '33', '44'], String(hit.vars.bandingkan)],
          ['why', 'Karena', ['11 + 10 + 9 perbandingan untuk i = 0, 1, 2, lalu perbandingan ketujuh untuk i = 3', '3 × 10 + 7', 'pendaftar ke-4 dibandingkan 37 kali', '12 × 3 + 1']]].map(([k, t, o, a]) => [k, t, o, a ?? o[0]]), done: next });
      }
      else if (r === 1) {
        const R = runPy(linesOf('bersarang'), { limit: 5000 }); const f = (n) => fmtNum((n * (n - 1)) / 2);
        wrap.append(code('bersarang'));
        rowsChoose(wrap, ctx, { prompt: 'Keluaran dan rumus banyak perbandingan', cls: 'pk-isi', rows: [
          ['o', 'Keluaran baris 10', [R.out[0], '[2917, 2917] 66', '[2917] 144', '[2917] 12'], R.out[0]],
          ['r', 'Rumus untuk n kode', ['n(n − 1)/2', 'n²', 'n − 1', '2n'], 'n(n − 1)/2'],
          ...[100, 1000, 100000, 500000].map((n) => [`n${n}`, `n = ${fmtNum(n)}`, [f(n), fmtNum(n * n), fmtNum((n * (n + 1)) / 2), fmtNum(n * (n - 1))], f(n)])], done: next });
      }
      else if (r === 2) {
        const A = runPy(linesOf('rudi'), { limit: 5000 }); const B = runPy(linesOf('rudi2'), { limit: 5000 });
        wrap.append(el('div', { class: 'pk-dua' }, code('rudi', { warn: [4] }), code('rudi2', { warn: [4, 6] })));
        const g = A.vars.ganda;
        rowsChoose(wrap, ctx, { prompt: 'Bug Rudi: baris 6 menjadi for j in range(len(kode)):', cls: 'pk-isi', rows: [
          ['b', 'bandingkan di akhir', ['144', '66', '132', '12'], String(A.vars.bandingkan)],
          ['g', 'Banyak isi ganda · 2917 muncul', [`${g.length} · ${g.filter((x) => x === 2917).length} kali`, '2 · 2 kali', '1 · 1 kali', '12 · 2 kali'], `${g.length} · ${g.filter((x) => x === 2917).length} kali`],
          ['h', 'Dengan if i != j and …: ganda · perbandingan', [`${pyRepr(B.vars.ganda)} · ${B.vars.bandingkan}`, '[2917] · 66', '[2917] · 144', `${pyRepr(B.vars.ganda)} · 66`], `${pyRepr(B.vars.ganda)} · ${B.vars.bandingkan}`],
          ['w', 'Mengapa range(i + 1, len(kode)) lebih baik?', ['setiap pasangan diperiksa tepat sekali dan kode tidak dibandingkan dengan dirinya sendiri', 'Python lebih suka angka 1', 'agar indeks tidak pernah 0', 'agar kode terakhir tidak diperiksa'], 'setiap pasangan diperiksa tepat sekali dan kode tidak dibandingkan dengan dirinya sendiri']], done: next });
      }
      else if (r === 3) {
        const at = sizeAtSecond();
        const C = runCounted(linesOf('set'));
        wrap.append(code('set'));
        rowsChoose(wrap, ctx, { prompt: 'Versi kedua: memakai set', cls: 'pk-isi', rows: [
          ['a', 'Isi sudah ketika 2917 diperiksa kedua kali', ['10', '11', '3', '12'], String(at)],
          ['b', 'Baris 6 dijalankan · untuk n kode', [`${C.steps} kali · n kali`, '66 kali · n(n − 1)/2 kali', '11 kali · n − 1 kali', '144 kali · n² kali'], `${C.steps} kali · n kali`],
          ['c', 'Mengapa k in sudah tidak membandingkan dengan semua isi?', ['set menyimpan kode di laci yang ditentukan nilai kodenya (hash), jadi Python langsung membuka lacinya', 'set selalu terurut, jadi cukup cari biner', 'set hanya menyimpan 10 kode', 'Python menebak secara acak'], 'set menyimpan kode di laci yang ditentukan nilai kodenya (hash), jadi Python langsung membuka lacinya'],
          ['d', 'Yang dikorbankan', ['memori: sudah menyimpan salinan setiap kode, ditambah laci kosong', 'ketepatan: kadang kode ganda terlewat', 'urutan keluaran', 'tidak ada'], 'memori: sudah menyimpan salinan setiap kode, ditambah laci kosong']], done: next });
      }
      else if (r === 4) {
        wrap.append(timeTable());
        const nest = (k) => WAKTU[3][1] * 4 ** k; const st = (k) => WAKTU[3][2] * 2 ** k;
        rowsChoose(wrap, ctx, { prompt: 'Tabel ukuran data: bila n digandakan', cls: 'pk-isi', rows: [
          ['a', 'Waktu bersarang · waktu set menjadi kira-kira', ['4 kali · 2 kali lipat', '2 kali · 2 kali lipat', '4 kali · 4 kali lipat', '2 kali · 1 kali lipat'], '4 kali · 2 kali lipat'],
          ['p', 'Sesuai rumus', ['n(n − 1)/2 tumbuh kuadrat · n tumbuh linear', 'keduanya linear', 'keduanya kuadrat', 'n tumbuh kuadrat · n(n − 1)/2 linear'], 'n(n − 1)/2 tumbuh kuadrat · n tumbuh linear'],
          ['x', '16.000 kode: bersarang · set', [`sekitar ${fmt(Math.round(nest(1) / 100) * 100)} ms · sekitar ${fmt(Math.round(st(1)))} ms`, 'sekitar 2.058 ms · sekitar 0,49 ms', 'sekitar 16.464 ms · sekitar 4 ms', 'sekitar 1.029 ms · sekitar 0,98 ms'], `sekitar ${fmt(Math.round(nest(1) / 100) * 100)} ms · sekitar ${fmt(Math.round(st(1)))} ms`],
          ['y', '512.000 kode (8.000 × 2⁶): bersarang · set', [`sekitar ${fmt(Math.round(nest(6) / 100000) * 100000)} ms (70 menit) · sekitar ${fmt(Math.round(st(6)))} ms`, 'sekitar 65.856 ms (1 menit) · sekitar 31 ms', 'sekitar 4.200.000 ms (70 menit) · sekitar 2.007 ms', 'sekitar 6.174 ms · sekitar 3 ms'], `sekitar ${fmt(Math.round(nest(6) / 100000) * 100000)} ms (70 menit) · sekitar ${fmt(Math.round(st(6)))} ms`]], done: next });
      }
      else if (r === 5) {
        wrap.append(timeTable());
        rowsChoose(wrap, ctx, { prompt: 'Dodi: "Beli saja komputer yang 10 kali lebih cepat."', cls: 'pk-isi', rows: [
          ['k', 'Versi bersarang, 512.000 kode, komputer baru', ['sekitar 7 menit', 'sekitar 7 detik', 'sekitar 70 menit', 'sekitar 0,03 detik'], 'sekitar 7 menit'],
          ['s', 'Versi set, komputer lama', ['sekitar 0,03 detik', 'sekitar 7 menit', 'sekitar 3 detik', 'sekitar 31 detik'], 'sekitar 0,03 detik'],
          ['l', 'Pelajarannya', ['memperbaiki algoritma memberi percepatan jauh lebih besar daripada membeli komputer baru', 'komputer baru selalu cukup', 'set hanya cepat di komputer lama', 'waktu tidak bergantung pada kode'], 'memperbaiki algoritma memberi percepatan jauh lebih besar daripada membeli komputer baru']], done: next });
      }
      else if (r === 6) {
        const res = Object.fromEntries(['A', 'B', 'C', 'D'].map((id) => { const C = runCounted(linesOf(id)); const v = C.R.vars; return [id, { hasil: pyRepr(id === 'D' ? v.ada_ganda : v.ganda), steps: C.steps }]; }));
        wrap.append(el('div', { class: 'pk-empat' }, ['A', 'B', 'C', 'D'].map((id) => code(id))));
        const row = (id, wrong) => [id, `Potongan ${id}: hasil · langkah (12 kode) · pola`, [`${res[id].hasil} · ${res[id].steps} · ${verOf(id)[3]}`, ...wrong], `${res[id].hasil} · ${res[id].steps} · ${verOf(id)[3]}`];
        rowsChoose(wrap, ctx, { prompt: 'Perulangan tersembunyi: anggota list yang diperiksa dihitung satu langkah', cls: 'pk-isi', info: 'Pengurutan sekitar n × log₂ n langkah; memasukkan satu kode ke set satu langkah.', rows: [
          row('A', ['[2917] · 12 · linear', '[2917] · 66 · kuadrat', '[2917] · 45 · n log n']),
          row('B', ['{2917} · 12 · linear', '{2917} · 24 · linear', '{2917} · 66 · kuadrat']),
          row('C', ['{2917} · 11 · linear', '{2917} · 144 · kuadrat', '{2917} · 43 · kuadrat']),
          row('D', ['True · 1 · linear', 'False · 12 · linear', 'True · 66 · kuadrat'])], done: next });
      }
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Perulangan tersembunyi dan tabel potongan A', cls: 'pk-isi', info: `Potongan A: ${WAKTU_A.map((x, i) => `${fmt(WAKTU[i][0])} kode ${fmt(x)} ms`).join(' · ')}`, rows: [
        ['b', 'Tampak satu perulangan, padahal ada perulangan tersembunyi', ['A dan B', 'C dan D', 'B saja', 'A, B, dan C'], 'A dan B'],
        ['c', 'Urutan dari yang paling cepat untuk 512.000 kode', ['D, C, A, B', 'A, B, C, D', 'D, A, C, B', 'C, D, B, A'], 'D, C, A, B'],
        ['d', 'Pola waktu potongan A', ['sekitar 4 kali lipat: kuadrat', 'sekitar 2 kali lipat: linear', 'tetap', 'sekitar 8 kali lipat'], 'sekitar 4 kali lipat: kuadrat'],
        ['e', 'Mengapa A tetap lebih cepat daripada versi bersarang?', ['pemeriksaan in dikerjakan bagian Python yang ditulis dalam bahasa C, jadi setiap langkah lebih murah', 'A memeriksa lebih sedikit kode', 'A memakai set', 'A tidak punya perulangan'], 'pemeriksaan in dikerjakan bagian Python yang ditulis dalam bahasa C, jadi setiap langkah lebih murah'],
        ['f', 'Potongan A untuk 512.000 kode', [`sekitar ${fmt(Math.round((WAKTU_A[3] * 4096) / 60000))} menit`, 'sekitar 1 detik', 'sekitar 70 menit', 'sekitar 31 milidetik'], `sekitar ${fmt(Math.round((WAKTU_A[3] * 4096) / 60000))} menit`]], done: next });
      else if (r === 8) {
        wrap.append(pyCode(S_CODE, { labels: S_CODE.map((_, i) => `S${i + 1}`), cls: 'pk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'SMA A 3.000 pendaftar, SMA B 4.000 pendaftar', cls: 'pk-isi', rows: [
          ['a', 'Langkah paling banyak', [fmtNum(3000 * 4000), fmtNum(3000 + 4000), fmtNum(3000), fmtNum(4000 * 4000)], fmtNum(3000 * 4000)],
          ['b', 'Satu baris tambahan setelah S1 · langkahnya', [`b = set(b) · sekitar ${fmtNum(4000 + 3000)}`, `a = set(a) · sekitar ${fmtNum(3000 * 4000)}`, `b = sorted(b) · sekitar ${fmtNum(4000)}`, `hasil = set() · sekitar ${fmtNum(3000)}`], `b = set(b) · sekitar ${fmtNum(4000 + 3000)}`],
          ['c', 'set(a) & set(b)', ['benar dan ringkas, tetapi urutan hasilnya tidak lagi mengikuti list mana pun', 'salah, karena & hanya untuk bilangan', 'benar dan urutannya sama dengan a', 'paling lambat'], 'benar dan ringkas, tetapi urutan hasilnya tidak lagi mengikuti list mana pun']], done: next });
      }
      else {
        const C = runCounted([KL(), ...TANTANGAN]);
        wrap.append(pyCode([KL(), ...TANTANGAN], { cls: 'pk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Tantangan: menghitung kemunculan dengan dictionary', cls: 'pk-isi', rows: [
          ['o', 'Keluaran', [C.R.out.join(' / '), '2917 1', '2917 2 / 3742 1', '{2917: 2}'], C.R.out.join(' / ')],
          ['s', 'Langkah untuk 12 kode', [`sekitar ${C.steps}: 12 untuk menghitung dan 11 untuk memeriksa setiap kode berbeda`, 'sekitar 144: setiap kode dihitung dengan count', 'sekitar 12: hanya perulangan pertama', 'sekitar 66: seperti versi bersarang'], `sekitar ${C.steps}: 12 untuk menghitung dan 11 untuk memeriksa setiap kode berbeda`],
          ['p', 'Pola pertumbuhan', ['linear', 'kuadrat', 'n log n', 'tetap'], 'linear']], done: next });
      }
    }
    render();
  },
};

export const S_CODE = ['def di_dua_sekolah(a, b):', '    hasil = []', '    for x in a:', '        if x in b:', '            hasil.append(x)', '    return hasil'];
export const TANTANGAN = ['hitung = {}', 'for k in kode:', '    hitung[k] = hitung.get(k, 0) + 1', 'for k in hitung:', '    if hitung[k] >= 2:', '        print(k, hitung[k])'];

const timeTable = () => el('table', { class: 'pk-tabel' }, el('tr', null, ['n', 'versi bersarang', 'versi set'].map((h) => el('th', null, h))), WAKTU.map(([n, a, b]) => el('tr', null, el('td', null, fmt(n)), el('td', null, `${fmt(a)} ms`), el('td', null, `${fmt(b)} ms`))));

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
