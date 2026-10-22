// Memakai Library: Kalender Pasaran — SMA/SMK (16–18 tahun), coding. Weton from
// the five-day pasaran cycle and the seven-day week: datetime's date, weekday,
// subtraction and timedelta (run in mini-py), Python's % that stays 0–4 for
// negative day differences, Rudi's hand-written day count that forgets the
// century rule (right only from 1 March 1900 to 28 February 2100), and choosing
// a third-party library. Day counts are whole days (proleptic Gregorian).

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, pyTracer, stepper, fmtNum } from './smp-kit.js';
import { runPy, ordinalOf, fromOrdinal, panjangBulan } from './mini-py.js';

export const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const PROGRAM = ['from datetime import date, timedelta', 'PASARAN = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"]', 'HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]', 'PATOKAN = date(1945, 8, 17)  # Jumat Legi', 'def pasaran(tanggal):', '    selisih = (tanggal - PATOKAN).days', '    return PASARAN[selisih % 5]', 'def weton(tanggal):', '    return HARI[tanggal.weekday()] + " " + pasaran(tanggal)', 'print(weton(date(2026, 10, 21)))'];
export const RUDI = ['def kabisat(t):', '    return t % 4 == 0', 'def hari_ke(t, b, h):', '    jumlah = 0', '    for th in range(1, t):', '        if kabisat(th):', '            jumlah = jumlah + 366', '        else:', '            jumlah = jumlah + 365', '    panjang = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]', '    if kabisat(t):', '        panjang[1] = 29', '    for i in range(b - 1):', '        jumlah = jumlah + panjang[i]', '    return jumlah + h', 'def pasaran_rudi(t, b, h):', '    return PASARAN[(hari_ke(t, b, h) - hari_ke(1945, 8, 17)) % 5]'];
const RUDI_LABEL = RUDI.map((_, i) => `R${i + 1}`);
const PATOKAN = ordinalOf(1945, 8, 17);
const AWAL26 = ordinalOf(2026, 1, 1);
const mod = (n, k) => ((n % k) + k) % k;

// Weton by date arithmetic (the same day numbers datetime uses).
export const hariDari = (o) => HARI[(o + 6) % 7];
export const pasaranDari = (o) => PASARAN[mod(o - PATOKAN, 5)];
export const weton = (y, m, d) => { const o = ordinalOf(y, m, d); return `${hariDari(o)} ${pasaranDari(o)}`; };
export const sah = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= panjangBulan(y, m) && y >= 1 && y <= 9999;
// Rudi's day number: every fourth year is a leap year, no century rule.
export function hariKeRudi(t, b, h) { const k = (x) => x % 4 === 0; let n = (t - 1) * 365 + Math.floor((t - 1) / 4); const p = [31, k(t) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; for (let i = 0; i < b - 1; i++) n += p[i]; return n + h; }
export const pasaranRudi = (y, m, d) => PASARAN[mod(hariKeRudi(y, m, d) - hariKeRudi(1945, 8, 17), 5)];
const tgl = (y, m, d) => `${d} ${BULAN[m - 1]} ${y}`;
const tglO = (o) => tgl(...fromOrdinal(o));
// Ranges of dates (from..to ordinals) where Rudi's pasaran differs, between two years.
export function bedaRudi(y0, y1) {
  const out = []; let cur = null;
  for (let o = ordinalOf(y0, 1, 1); o <= ordinalOf(y1, 12, 31); o++) {
    const [y, m, d] = fromOrdinal(o); const beda = pasaranRudi(y, m, d) !== pasaranDari(o);
    if (beda && !cur) cur = [o, o]; else if (beda) cur[1] = o; else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
// Python runs: the worksheet program on any date, and Rudi's function.
export function pyWeton(y, m, d) { const R = runPy([...PROGRAM.slice(0, 9), `print(weton(date(${y}, ${m}, ${d})))`], { limit: 5000 }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out[0]; }
export function pyRudi(y, m, d) { const R = runPy([PROGRAM[1], ...RUDI, `print(pasaran_rudi(${y}, ${m}, ${d}))`], { limit: 200000 }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out[0]; }
export function pyEval(lines, limit = 5000) { const R = runPy(['from datetime import date, timedelta', 'import math', ...lines], { limit }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out.join('\n'); }
// A random 2026 date for the guessing game (same seed, same date).
export function tanggal2026(rand) { const n = Math.floor(rand.next() * 365); const [y, m, d] = fromOrdinal(AWAL26 + n); return { y, m, d, n, hari: hariDari(AWAL26 + n), pasaran: pasaranDari(AWAL26 + n) }; }

const uniq = (xs) => [...new Set(xs)];

export default {
  id: 'sma-52-pakai-library',
  title: 'Memakai Library: Kalender Pasaran',
  topic: 'Memakai pustaka Python dengan membaca dokumentasinya: datetime, math, dan random, siklus dengan sisa bagi, membandingkan pustaka dengan kode buatan sendiri, dan menilai pustaka pihak ketiga',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📅',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Hitung weton dengan siklus lima hari pasaran, baca dokumentasi datetime, telusuri programnya, temukan kesalahan kode buatan Rudi, lalu nilai kapan sebaiknya memakai pustaka.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Pasaran', desc: 'Pilih tanggal dan lihat weton beserta langkah hitungnya, lengkap dengan kalender satu bulan', create: createCalc },
    { id: 'telusur', icon: '🔎', label: 'Pustaka atau Rudi', desc: 'Jalankan program datetime dan program Rudi berdampingan, lalu cari tanggal yang hasilnya berbeda', create: createTrace },
    { id: 'giliran', icon: '🎲', label: 'Adu Tebak Weton', desc: 'Layar memilih tanggal acak di 2026, tim bergantian menebak hari dan pasarannya dari Kamis Pon, 1 Januari 2026', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pasaran' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(roda(PATOKAN, { sorot: 5 }));
        rowsChoose(wrap, ctx, { prompt: '17 Agustus 1945 jatuh pada Jumat Legi. Weton hari-hari berikutnya?', cls: 'ps-isi', rows: [18, 19, 20, 21, 22].map((d) => { const o = ordinalOf(1945, 8, d); return [`d${d}`, `${hariDari(o)}, ${d} Agustus 1945`, PASARAN, pasaranDari(o)]; }), done: next });
      }
      else if (r === 1) {
        const o = PATOKAN + 100;
        rowsChoose(wrap, ctx, { prompt: 'Siklus lima hari dan tujuh hari', cls: 'ps-isi', rows: [
          ['p', 'Pasaran yang sama terulang setiap', ['5', '7', '12', '35'], '5'],
          ['h', 'Hari yang sama terulang setiap', ['5', '7', '12', '35'], '7'],
          ['w', 'Weton yang sama terulang setiap (KPK 5 dan 7)', ['5', '7', '12', '35'], pyEval(['print(math.lcm(5, 7))'])],
          ['c', '100 hari sesudah Jumat Legi 17 Agustus 1945', uniq([`${hariDari(o)} ${pasaranDari(o)}, ${tglO(o)}`, `Jumat ${pasaranDari(o)}, ${tglO(o)}`, `${hariDari(o)} Pahing, ${tglO(o - 1)}`, `Selasa Legi, ${tglO(o)}`]), `${hariDari(o)} ${pasaranDari(o)}, ${tglO(o)}`],
        ], done: next, info: '100 dibagi 5 bersisa 0, dan 100 dibagi 7 bersisa 2.' });
      }
      else if (r === 2) {
        wrap.append(dokumentasi());
        const OP = ['date(2026, 10, 21)', 'd.weekday()', '(d2 - d1).days', 'd + timedelta(days=35)', 'date.today()', 'math.lcm(5, 7)', 'random.choice(PASARAN)'];
        rowsChoose(wrap, ctx, { prompt: 'Pilih fungsi atau operasi dari dokumentasi', cls: 'ps-isi ps-mono', rows: [
          ['a', 'Membuat tanggal 21 Oktober 2026', ['date(2026, 10, 21)', 'date(21, 10, 2026)', 'date("21-10-2026")'], OP[0]],
          ['b', 'Hari dalam minggu, Senin = 0', ['d.weekday()', 'd.isoweekday()', 'd.toordinal()'], OP[1]],
          ['c', 'Banyak hari antara dua tanggal', ['(d2 - d1).days', 'd2 - d1', 'd2.days - d1.days'], OP[2]],
          ['d', 'Tanggal 35 hari lagi', ['d + timedelta(days=35)', 'd + 35', 'timedelta(d, 35)'], OP[3]],
          ['e', 'Tanggal hari ini', ['date.today()', 'date()', 'today(date)'], OP[4]],
          ['f', 'Setelah berapa hari weton terulang', ['math.lcm(5, 7)', 'math.gcd(5, 7)', '5 + 7'], OP[5]],
          ['g', 'Satu nama pasaran acak', ['random.choice(PASARAN)', 'random.randint(PASARAN)', 'PASARAN[random]'], OP[6]],
        ], done: next });
      }
      else if (r === 3) {
        const e = pyEval(['print(date(2026, 2, 29))']); const akhir = pyEval(['print(date(2026, 1, 1) + timedelta(days=364))', 'print(date(2026, 1, 1) + timedelta(days=365))']).split('\n');
        rowsChoose(wrap, ctx, { prompt: 'Membaca dokumentasi dengan teliti', cls: 'ps-isi', rows: [
          ['w', 'HARI cocok dengan weekday(), bukan isoweekday()', ['HARI[0] adalah Senin dan weekday() memberi 0 untuk Senin; isoweekday() memberi 7 untuk Minggu → IndexError', 'isoweekday() lebih lambat', 'weekday() dimulai dari Minggu', 'keduanya sama saja'], 'HARI[0] adalah Senin dan weekday() memberi 0 untuk Senin; isoweekday() memberi 7 untuk Minggu → IndexError'],
          ['b', 'Batas randint 364, bukan 365', uniq([`+364 hari = ${akhir[0]}; +365 hari sudah ${akhir[1]}`, `+364 hari = ${akhir[0]}; 365 menimbulkan galat`, '2026 tahun kabisat', 'randint tidak menerima 365']), `+364 hari = ${akhir[0]}; +365 hari sudah ${akhir[1]}`],
          ['e', 'weton(date(2026, 2, 29))', uniq([e, 'Minggu Wage', 'menghasilkan weton 1 Maret 2026', 'IndexError: list index out of range']), e],
          ['g', 'Galat itu', ['berguna: tanggal mustahil ditolak sejak awal', 'merugikan: program berhenti tanpa alasan', 'tidak penting', 'tanda datetime rusak'], 'berguna: tanggal mustahil ditolak sejak awal'],
        ], done: next });
      }
      else if (r === 4) {
        wrap.append(pyCode(PROGRAM, { labels: lab(1, 10), cls: 'ps-kecil' }));
        const baris = [[2026, 10, 21], [1945, 8, 22], [1945, 8, 16]].map(([y, m, d]) => { const s = Number(pyEval([`print((date(${y}, ${m}, ${d}) - date(1945, 8, 17)).days)`])); return { y, m, d, s, md: mod(s, 5), w: pyWeton(y, m, d) }; });
        rowsChoose(wrap, ctx, { prompt: 'Telusuri: selisih · selisih % 5 · weton', cls: 'ps-isi ps-mono', rows: baris.map((x, i) => { const right = `${x.s} · ${x.md} · ${x.w}`; return [`b${i}`, `date(${x.y}, ${x.m}, ${x.d})`, uniq([right, `${x.s} · ${x.s % 5} · ${x.w.split(' ')[0]} ${PASARAN[(x.md + 1) % 5]}`, `${-x.s} · ${mod(-x.s, 5)} · ${x.w.split(' ')[0]} ${PASARAN[mod(-x.s, 5)]}`, `${x.s + 1} · ${mod(x.s + 1, 5)} · ${x.w}`]), right]; }), done: next });
      }
      else if (r === 5) {
        const py = pyEval(['print(-1 % 5, -6 % 5, 29650 % 5)']).split(' ');
        rowsChoose(wrap, ctx, { prompt: 'Sisa bagi untuk tanggal sebelum patokan', cls: 'ps-isi', rows: [
          ['a', '-1 % 5 di Python', ['-1', '1', '4', '0'], py[0]],
          ['b', '-6 % 5 di Python', ['-1', '1', '4', '0'], py[1]],
          ['c', '-1 % 5 di JavaScript', ['-1', '1', '4', '0'], String(-1 % 5)],
          ['d', 'Mengapa 16 Agustus 1945 tetap benar', ['% dengan pembagi positif selalu memberi 0 sampai 4 di Python, jadi -1 menjadi 4 (Kliwon, sehari sebelum Legi)', 'Python membuang tanda minus', 'selisih tidak pernah negatif', 'kebetulan saja'], '% dengan pembagi positif selalu memberi 0 sampai 4 di Python, jadi -1 menjadi 4 (Kliwon, sehari sebelum Legi)'],
        ], done: next });
      }
      else if (r === 6) {
        const a = pyRudi(1900, 1, 1); const b = pyRudi(2100, 3, 1); const A = pyWeton(1900, 1, 1).split(' ')[1]; const B = pyWeton(2100, 3, 1).split(' ')[1];
        wrap.append(pyCode(RUDI, { labels: RUDI_LABEL, cls: 'ps-kecil', warn: [1] }));
        rowsChoose(wrap, ctx, { prompt: 'Kode buatan Rudi', cls: 'ps-isi ps-mono', rows: [
          ['a', '1 Januari 1900: Rudi · datetime', uniq([`${a} · ${A}`, `${A} · ${A}`, `${a} · ${a}`, `${A} · ${a}`]), `${a} · ${A}`],
          ['b', '1 Maret 2100: Rudi · datetime', uniq([`${b} · ${B}`, `${B} · ${B}`, `${b} · ${b}`, `${B} · ${b}`]), `${b} · ${B}`],
          ['c', 'Aturan yang dilupakan', ['tahun abad bukan kabisat, kecuali habis dibagi 400', 'Februari punya 29 hari', 'tahun 0 tidak ada', 'pasaran dimulai dari Pahing'], 'tahun abad bukan kabisat, kecuali habis dibagi 400'],
          ['d', 'Baris R2 yang benar', ['return (t % 4 == 0 and t % 100 != 0) or t % 400 == 0', 'return t % 4 == 0 and t % 400 == 0', 'return t % 100 == 0', 'return t % 4 == 0 or t % 100 == 0'], 'return (t % 4 == 0 and t % 100 != 0) or t % 400 == 0'],
        ], done: next });
      }
      else if (r === 7) {
        const R = bedaRudi(1890, 2110); const tengah = R.length > 1 ? `${tglO(R[0][1] + 1)} sampai ${tglO(R[1][0] - 1)}` : '';
        const sama = pyEval([...RUDI.slice(0, 15), 'print(hari_ke(2026, 2, 30) == hari_ke(2026, 3, 2))'], 200000);
        rowsChoose(wrap, ctx, { prompt: 'Mengapa uji pertama Rudi lolos?', cls: 'ps-isi', rows: [
          ['r', 'Rentang tanggal yang selalu benar', uniq([tengah, '1 Januari 1900 sampai 31 Desember 2099', '1 Januari 1901 sampai 31 Desember 2100', '1 Maret 2000 sampai 28 Februari 2100']), tengah],
          ['w', 'Alasannya', ['kesalahan tahun abad terhitung di kedua tanggal dan saling menghapus, kecuali 29 Februari palsu 1900 atau 2100 ada di antaranya', 'Rudi menguji dengan komputer yang berbeda', 'tahun 2000 bukan kabisat', 'pasaran tidak bergantung pada tahun kabisat'], 'kesalahan tahun abad terhitung di kedua tanggal dan saling menghapus, kecuali 29 Februari palsu 1900 atau 2100 ada di antaranya'],
          ['f', 'hari_ke(2026, 2, 30) == hari_ke(2026, 3, 2)', ['True', 'False', 'ValueError'], sama],
          ['s', 'Lebih aman', ['date menolak 30 Februari dengan ValueError, jadi salah ketik langsung ketahuan', 'kode Rudi, karena tidak pernah berhenti', 'keduanya sama aman', 'kode Rudi, karena lebih pendek'], 'date menolak 30 Februari dengan ValueError, jadi salah ketik langsung ketahuan'],
        ], done: next });
      }
      else if (r === 8) {
        wrap.append(tabelPustaka());
        rowsChoose(wrap, ctx, { prompt: 'Kapan memakai pustaka?', cls: 'ps-isi', rows: [
          ['a', 'Lebih layak dipakai', ['Pustaka B', 'Pustaka A', 'keduanya sama', 'tidak keduanya'], 'Pustaka B'],
          ['r', 'Risiko pustaka A', ['bug dan celah keamanan tidak diperbaiki, cara pakai harus ditebak, status hukumnya tidak jelas', 'terlalu banyak pengguna', 'terlalu sering diperbarui', 'lisensinya terlalu terbuka'], 'bug dan celah keamanan tidak diperbaiki, cara pakai harus ditebak, status hukumnya tidak jelas'],
          ['l', 'Lisensi tidak disebutkan', ['tidak ada izin yang jelas, jadi sebaiknya tidak dipakai, terutama untuk aplikasi yang dibagikan atau dijual', 'boleh dipakai bebas', 'otomatis milik umum', 'cukup menyebut nama pembuatnya'], 'tidak ada izin yang jelas, jadi sebaiknya tidak dipakai, terutama untuk aplikasi yang dibagikan atau dijual'],
          ['d', 'Untuk kalender pasaran', ['datetime: pustaka bawaan yang dirawat bersama Python; pasaran cukup dengan sisa bagi', 'Pustaka B, karena paling baru', 'Pustaka A, karena khusus kalender Jawa', 'menulis semuanya sendiri seperti Rudi'], 'datetime: pustaka bawaan yang dirawat bersama Python; pasaran cukup dengan sisa bagi'],
        ], done: next });
      }
      else {
        const T = tanggal2026(ctx.rand); const sisa7 = T.n % 7; const sisa5 = T.n % 5;
        wrap.append(tabelBulan());
        rowsChoose(wrap, ctx, { prompt: `Patokan: 1 Januari 2026 = Kamis Pon. Weton ${tgl(T.y, T.m, T.d)}?`, cls: 'ps-isi', rows: [
          ['n', 'Banyak hari sejak 1 Januari 2026', uniq([String(T.n), String(T.n + 1), String(T.n - 1), String(T.n + (T.m > 2 ? 2 : 3))]), String(T.n)],
          ['s', 'Sisa bagi 7 · sisa bagi 5', uniq([`${sisa7} · ${sisa5}`, `${(sisa7 + 1) % 7} · ${(sisa5 + 1) % 5}`, `${sisa5} · ${sisa7}`, `${sisa7} · ${(sisa5 + 4) % 5}`]), `${sisa7} · ${sisa5}`],
          ['h', 'Hari', HARI, T.hari],
          ['p', 'Pasaran', PASARAN, T.pasaran],
        ], done: next });
      }
    }
    render();
  },
};

const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// ---- views ----
function roda(o0, { sorot = 0 } = {}) {
  return el('div', { class: 'ps-roda' }, Array.from({ length: sorot + 1 }, (_, i) => { const o = o0 + i; const [, m, d] = fromOrdinal(o); return el('div', { class: `ps-hari ${i === 0 ? 'awal' : 'tanya'}` }, el('small', null, `${d} ${BULAN[m - 1].slice(0, 3)}`), el('b', null, hariDari(o)), el('span', null, i === 0 ? pasaranDari(o) : '?')); }));
}
function dokumentasi() {
  const R = [['date(tahun, bulan, hari)', 'objek tanggal; tanggal yang tidak ada → ValueError'], ['date.today()', 'tanggal hari ini menurut jam komputer'], ['d.weekday()', 'Senin 0 … Minggu 6'], ['d.isoweekday()', 'Senin 1 … Minggu 7'], ['d.toordinal()', 'nomor urut hari; 1 Januari tahun 1 = 1'], ['d2 - d1', 'timedelta; banyak hari dibaca dengan .days'], ['d + timedelta(days=n)', 'tanggal n hari sesudah d'], ['math.lcm(a, b) · math.gcd(a, b)', 'KPK · FPB'], ['random.randint(a, b) · random.choice(daftar)', 'bilangan bulat acak a..b · satu anggota acak']];
  return el('table', { class: 'ps-dok' }, R.map(([f, k]) => el('tr', null, el('td', null, el('code', null, f)), el('td', null, k))));
}
function tabelPustaka() {
  const R = [['Terakhir diperbarui', '2016', 'bulan lalu'], ['Dokumentasi', 'tidak ada', 'lengkap, dengan contoh'], ['Lisensi', 'tidak disebutkan', 'terbuka, menyebut sumber'], ['Pengguna', 'sekitar 40 proyek', 'ribuan proyek'], ['Laporan masalah', '25 tidak dijawab', 'dijawab dan diperbaiki']];
  return el('table', { class: 'ps-dok' }, el('tr', null, ['', 'Pustaka A', 'Pustaka B'].map((h) => el('th', null, h))), R.map((r) => el('tr', null, r.map((x) => el('td', null, x)))));
}
function tabelBulan() {
  return el('div', { class: 'ps-bulan' }, BULAN.map((b, i) => el('span', null, el('small', null, b.slice(0, 3)), el('b', null, String(panjangBulan(2026, i + 1))))));
}
function kalender(y, m, { pilih = null, onPilih = null } = {}) {
  const n = panjangBulan(y, m); const o1 = ordinalOf(y, m, 1); const geser = (o1 + 6) % 7;
  const sel = [...HARI.map((h) => el('div', { class: 'ps-kepala' }, h.slice(0, 3))), ...Array.from({ length: geser }, () => el('div', { class: 'ps-kosong' }))];
  for (let d = 1; d <= n; d++) { const o = o1 + d - 1; const p = pasaranDari(o); const c = el('div', { class: `ps-sel ${d === pilih ? 'pilih' : ''} ${p === 'Pon' || p === 'Kliwon' ? 'pasar' : ''}` }, el('b', null, String(d)), el('small', null, p)); sel.push(onPilih ? onTap(c, () => onPilih(d)) : c); }
  return el('div', { class: 'ps-kalender' }, sel);
}

// ---- Kalkulator Pasaran ----
function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  let y = 2026; let m = 10; let d = 21; let pat = 'proklamasi';
  const PAT = { proklamasi: { nama: '17 Agustus 1945 (Jumat Legi)', o: PATOKAN, h: 'Jumat', p: 'Legi' }, t2026: { nama: '1 Januari 2026 (Kamis Pon)', o: AWAL26, h: 'Kamis', p: 'Pon' } };
  const draw = () => {
    const ok = sah(y, m, d); const P = PAT[pat]; const o = ok ? ordinalOf(y, m, d) : null; const s = ok ? o - P.o : null;
    const langkah = ok ? [`selisih = ${fmtNum(s)} hari sejak ${P.nama}`, `selisih % 7 = ${mod(s, 7)} → ${mod(s, 7)} hari sesudah ${P.h} = ${hariDari(o)}`, `selisih % 5 = ${mod(s, 5)} → ${mod(s, 5)} pasaran sesudah ${P.p} = ${pasaranDari(o)}`] : [];
    const py = pyWeton(y, m, d);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Kalkulator hari pasaran'),
      el('div', { class: 'ps-kontrol' }, stepper(d, (v) => { d = v; draw(); }, { min: 1, max: 31, label: 'tanggal' }), stepper(m, (v) => { m = v; d = Math.min(d, 31); draw(); }, { min: 1, max: 12, label: 'bulan' }), stepper(y, (v) => { y = v; draw(); }, { min: 1, max: 9999, label: 'tahun' }),
        el('div', { class: 'seg' }, Object.entries(PAT).map(([k, x]) => onTap(el('button', { class: `seg-btn ${pat === k ? 'on' : ''}`, type: 'button' }, `patokan ${x.nama}`), () => { pat = k; draw(); })))),
      el('div', { class: 'ps-dua' }, el('div', { class: 'ps-hasil' }, el('p', { class: 'ps-tanggal' }, ok ? tgl(y, m, d) : `${d}/${m}/${y}`), ok ? el('p', { class: 'ps-weton' }, `${hariDari(o)} ${pasaranDari(o)}`) : el('p', { class: 'ps-galat' }, py),
        ...langkah.map((x) => el('p', { class: 'ps-langkah' }, x)), el('p', { class: 'ps-py' }, `Python: print(weton(date(${y}, ${m}, ${d}))) → ${py}`)),
        el('div', null, el('p', { class: 'ps-ket' }, `${BULAN[m - 1]} ${y} · Pon dan Kliwon disorot (hari pasar hewan)`), kalender(y, m, { pilih: ok ? d : null, onPilih: (v) => { d = v; draw(); } }))));
  };
  draw();
}

// ---- Pustaka atau Rudi: two programs side by side, and where they differ ----
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  let y = 1900; let m = 1; let d = 1; let a = null; let b = null;
  const beda = bedaRudi(1700, 2300);
  const draw = () => {
    a?.stop?.(); b?.stop?.();
    const ok = sah(y, m, d);
    a = pyTracer([...PROGRAM.slice(0, 9), `print(weton(date(${y}, ${m}, ${d})))`], { labels: lab(1, 10), cls: 'ps-kecil', hideVars: ['PASARAN', 'HARI', 'date', 'timedelta', 'pasaran', 'weton'], opts: { limit: 5000 } });
    b = pyTracer([PROGRAM[1], ...RUDI, `print(pasaran_rudi(${y}, ${m}, ${d}))`], { labels: ['2', ...RUDI_LABEL, 'R18'], cls: 'ps-kecil', hideVars: ['PASARAN', 'kabisat', 'hari_ke', 'pasaran_rudi', 'panjang'], opts: { limit: 200000 } });
    const pw = pyWeton(y, m, d); const pr = ok ? pyRudi(y, m, d) : '—'; const sama = ok && pw.split(' ')[1] === pr;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pustaka datetime atau kode Rudi?'),
      el('div', { class: 'ps-kontrol' }, stepper(d, (v) => { d = v; draw(); }, { min: 1, max: 31, label: 'tanggal' }), stepper(m, (v) => { m = v; draw(); }, { min: 1, max: 12, label: 'bulan' }), stepper(y, (v) => { y = v; draw(); }, { min: 1600, max: 2400, label: 'tahun' }),
        ...[[1900, 2, 28], [1900, 3, 1], [2100, 2, 28], [2100, 3, 1], [2026, 10, 21]].map(([yy, mm, dd]) => button(`${dd}/${mm}/${yy}`, () => { y = yy; m = mm; d = dd; draw(); }))),
      el('p', { class: `ps-banding ${ok ? (sama ? 'sama' : 'beda') : 'beda'}` }, ok ? `datetime: ${pw} · Rudi: ${pr} → ${sama ? 'sama' : 'BERBEDA'}` : `datetime menolak: ${pw}; kode Rudi tetap menghitung hari_ke = ${fmtNum(hariKeRudi(y, m, d))}`),
      el('div', { class: 'ps-dua' }, a, b),
      el('div', { class: 'ps-pita' }, el('b', null, 'Tanggal yang pasarannya berbeda (1700–2300):'), beda.map(([o0, o1]) => el('span', null, `${tglO(o0)} – ${tglO(o1)}`))));
  };
  draw();
  return () => { a?.stop?.(); b?.stop?.(); };
}

// ---- Adu Tebak Weton ----
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Adu Tebak Weton selesai', pts, again: () => pickTeams(wrap, 'Adu Tebak Weton', start) }); return; }
      const who = t % nT; const T = tanggal2026(ctx.rand); let h = null; let p = null; let fin = false;
      const msg = el('p', { class: 'reveal info' }, 'Pilih hari dan pasaran, lalu Periksa.');
      const draw = () => {
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: weton ${tgl(T.y, T.m, T.d)}?`), el('p', { class: 'ps-ket' }, 'Patokan: 1 Januari 2026 = Kamis Pon. Hitung hari sejak 1 Januari, lalu sisa bagi 7 dan 5.'), tabelBulan(),
          el('div', { class: 'seg ps-pilih' }, HARI.map((x) => onTap(el('button', { class: `seg-btn ${h === x ? 'on' : ''}`, type: 'button' }, x), () => { if (!fin) { h = x; draw(); } }))),
          el('div', { class: 'seg ps-pilih' }, PASARAN.map((x) => onTap(el('button', { class: `seg-btn ${p === x ? 'on' : ''}`, type: 'button' }, x), () => { if (!fin) { p = x; draw(); } }))),
          msg, fin ? button('Lanjut ➜', () => { t++; step(); }, 'primary') : button('Periksa', () => {
            if (!h || !p) return; fin = true; const skor = (h === T.hari) + (p === T.pasaran); pts[who] += skor; skor ? ctx.sound.tap() : ctx.mistake();
            say(msg, skor === 2 ? 'good' : skor ? '' : 'bad', `${T.n} hari sejak 1 Januari; ${T.n} % 7 = ${T.n % 7} → ${T.hari}; ${T.n} % 5 = ${T.n % 5} → ${T.pasaran}. +${skor} poin.`); draw();
          }, 'primary'));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Adu Tebak Weton', start);
}
