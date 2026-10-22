// Proyek Aplikasi untuk UMKM — SMA/SMK (16–18 tahun), coding. One turn of the
// software engineering process for a home chips business: open interview
// questions, functional and non-functional needs, user stories with
// acceptance criteria and release priority, a kanban board, named constants,
// the core Python functions (total with the wholesale rule, belum_lunas,
// rekap) run in mini-py, boundary-value tests, code review of Rudi's total
// (line 6 counts flavours, line 7 uses > 10, line 8 a bare 2000), semantic
// versioning, triaging feedback, and the regression test for tandai_dikirim.
// Kanban cards live only on this screen and are never stored.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy } from './mini-py.js';

// ---- the worksheet program ----
const DATA = ['HARGA = {"balado": 15000, "gurih": 14000, "tempe": 12000}', 'GROSIR_MIN = 10      # pesanan grosir: paling sedikit 10 bungkus', 'POTONGAN = 2000      # potongan harga setiap bungkus pesanan grosir', '', 'pesanan = [', '    {"no": 1, "nama": "Bu Lina", "isi": {"balado": 6, "tempe": 4},', '     "lunas": False, "dikirim": True},', '    {"no": 2, "nama": "Pak Tono", "isi": {"gurih": 2},', '     "lunas": True, "dikirim": False},', '    {"no": 3, "nama": "Bu Lina", "isi": {"balado": 3, "gurih": 3, "tempe": 3},', '     "lunas": False, "dikirim": False},', '    {"no": 4, "nama": "Mbak Ayu", "isi": {"tempe": 1, "balado": 1},', '     "lunas": False, "dikirim": False},', ']'];
const TAMBAH = ['def tambah_pesanan(daftar, nama, isi):', '    no = len(daftar) + 1', '    daftar.append({"no": no, "nama": nama, "isi": isi,', '                   "lunas": False, "dikirim": False})', '    return no'];
const totalDengan = (b6, b7, b8) => ['def total(isi):', '    jumlah = 0', '    banyak = 0', '    for rasa in isi:', '        jumlah = jumlah + HARGA[rasa] * isi[rasa]', `        banyak = ${b6}`, `    if ${b7}:`, `        jumlah = ${b8}`, '    return jumlah'];
export const TOTAL = totalDengan('banyak + isi[rasa]', 'banyak >= GROSIR_MIN', 'jumlah - POTONGAN * banyak');
export const RUDI = totalDengan('banyak + 1', 'banyak > 10', 'jumlah - 2000 * banyak');
export const RUDI6 = totalDengan('banyak + isi[rasa]', 'banyak > 10', 'jumlah - 2000 * banyak');
const BELUM_LUNAS = ['def belum_lunas(daftar):', '    hasil = []', '    for p in daftar:', '        if not p["lunas"]:', '            hasil.append((p["no"], p["nama"], total(p["isi"])))', '    return hasil'];
export const TANDAI_100 = ['def tandai_dikirim(daftar, no):', '    daftar[no]["dikirim"] = True'];
export const TANDAI_101 = ['def tandai_dikirim(daftar, no):', '    for p in daftar:', '        if p["no"] == no:', '            p["dikirim"] = True', '            return True', '    return False'];
const REKAP = ['def rekap(daftar):', '    hasil = {}', '    for p in daftar:', '        if not p["dikirim"]:', '            for rasa in p["isi"]:', '                hasil[rasa] = hasil.get(rasa, 0) + p["isi"][rasa]', '    return hasil'];
export function py(lines) { const R = runPy([...DATA, ...lines], { limit: 20000 }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out.join('\n'); }
const isiPy = (isi) => `{${Object.entries(isi).map(([k, v]) => `"${k}": ${v}`).join(', ')}}`;
export const totalPy = (fn, isi) => py([...fn, `print(total(${isiPy(isi)}))`]);

export const UJI = [
  { id: 'U1', isi: { gurih: 1 }, alasan: 'satu bungkus, harga biasa' },
  { id: 'U2', isi: { balado: 9 }, alasan: 'tepat di bawah batas grosir' },
  { id: 'U3', isi: { balado: 10 }, alasan: 'tepat di batas grosir' },
  { id: 'U4', isi: { balado: 5, tempe: 5 }, alasan: 'batas grosir dari dua rasa yang digabung' },
  { id: 'U5', isi: { tempe: 11 }, alasan: 'di atas batas grosir' },
  { id: 'U6', isi: {}, alasan: 'pesanan kosong' },
];
const rp = (n) => `Rp${fmtNum(Number(n))}`;
const gagalPada = (fn) => UJI.filter((u) => totalPy(fn, u.isi) !== totalPy(TOTAL, u.isi));

// Feedback cards after release 1.0.0: M1–M4 from the worksheet, plus a pool for the race round.
const JENIS = ['bug', 'perubahan data', 'keputusan pemilik', 'fitur baru'];
const MASUKAN = [
  { id: 'M1', dari: 'Rahmat', t: 'Saya menandai pesanan nomor 3 sudah dikirim, tetapi yang berubah malah pesanan nomor 4. Waktu saya menandai nomor 4, aplikasinya berhenti dengan pesan galat.', jenis: 'bug', versi: '1.0.1' },
  { id: 'M2', dari: 'Bu Wartini', t: 'Harga keripik tempe naik menjadi Rp13.000 mulai besok.', jenis: 'perubahan data', versi: '1.0.1, setelah cara menyimpan harga diperbaiki' },
  { id: 'M3', dari: 'Bu Lina', t: 'Pesanan saya 9 bungkus tidak dapat harga grosir, padahal saya langganan.', jenis: 'keputusan pemilik', versi: 'belum ada perubahan kode sebelum Bu Wartini memutuskan' },
  { id: 'M4', dari: 'Bu Wartini', t: 'Saya ingin tahu berapa bungkus tiap rasa yang harus digoreng untuk pesanan yang belum dikirim.', jenis: 'fitur baru', versi: '1.1.0' },
];
const MASUKAN_LAIN = [
  { dari: 'Rahmat', t: 'Daftar belum dikirim masih menampilkan pesanan yang sudah saya antar dan tandai.', jenis: 'bug' },
  { dari: 'Bu Wartini', t: 'Mulai bulan depan potongan grosir menjadi Rp2.500 per bungkus.', jenis: 'perubahan data' },
  { dari: 'Pak Tono', t: 'Saya tetangga, boleh dapat harga grosir untuk 8 bungkus?', jenis: 'keputusan pemilik' },
  { dari: 'Bu Wartini', t: 'Setiap Sabtu saya ingin tahu berapa uang yang masuk minggu itu.', jenis: 'fitur baru' },
  { dari: 'Rahmat', t: 'Kalau saya menandai nomor 9 yang tidak ada, aplikasinya berhenti dengan pesan galat.', jenis: 'bug' },
  { dari: 'Bu Wartini', t: 'Keripik gurih sekarang Rp14.500 sebungkus.', jenis: 'perubahan data' },
  { dari: 'Bu Lina', t: 'Saya ingin bisa memesan sendiri lewat aplikasi.', jenis: 'fitur baru' },
];

const uniq = (xs) => [...new Set(xs)];
const lab = (n) => Array.from({ length: n }, (_, i) => String(i + 1));

export default {
  id: 'sma-57-proyek-aplikasi',
  title: 'Proyek Aplikasi untuk UMKM',
  topic: 'Proses rekayasa perangkat lunak dari kebutuhan sampai rilis: wawancara, kebutuhan fungsional dan nonfungsional, cerita pengguna, prioritas, kanban, rancangan data dan fungsi, kode inti Python, kasus uji, tinjauan kode, nomor versi, pemilahan masukan, dan uji regresi',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🥔',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Gali kebutuhan Bu Wartini, tulis cerita pengguna, telusuri fungsi total dan belum_lunas, uji nilai batas grosir, tinjau kode Rudi, lalu pilah masukan setelah rilis 1.0.0.',
  extraModes: [
    { id: 'kanban', icon: '🗂️', label: 'Papan Kanban', desc: 'Tulis cerita pengguna, beri prioritas, dan geser kartunya antarkolom; kartu Harus menjadi isi versi 1.0.0. Kartu tidak disimpan', create: createKanban },
    { id: 'penguji', icon: '🧪', label: 'Penguji Fungsi', desc: 'Susun pesanan uji dan harapannya, lalu jalankan total yang benar, total Rudi, dan total Rudi yang baris 6-nya diperbaiki', create: createPenguji },
    { id: 'giliran', icon: '🔍', label: 'Tinjauan Kode', desc: 'Setiap tim mendapat kode dengan bug tersembunyi, menunjuk baris yang salah, lalu memilih uji yang membuktikannya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act proyek-umkm' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(persona());
        const P = ['Bu Wartini', 'Rahmat', 'Bu Lina'];
        rowsChoose(wrap, ctx, { prompt: 'Wawancara: dari siapa kebutuhan ini muncul?', cls: 'ua-isi', rows: [
          ['q', 'Pertanyaan yang lebih membantu', ['"Apa yang paling sering salah saat mencatat pesanan?"', '"Ibu mau aplikasinya punya fitur apa?"', '"Ibu suka warna apa?"', '"Ibu setuju aplikasinya bagus?"'], '"Apa yang paling sering salah saat mencatat pesanan?"'],
          ['w', 'Alasannya', ['pertanyaan tentang masalah nyata memunculkan kebutuhan sebenarnya; pertanyaan fitur meminta pengguna menebak solusi', 'pertanyaan fitur terlalu pendek', 'pemilik usaha tidak boleh ditanya tentang fitur', 'jawabannya bisa ya atau tidak'], 'pertanyaan tentang masalah nyata memunculkan kebutuhan sebenarnya; pertanyaan fitur meminta pengguna menebak solusi'],
          ['a', 'Daftar pesanan yang belum dikirim, lalu menandainya', P, 'Rahmat'],
          ['b', 'Mengetahui total yang belum dibayar', P, 'Bu Lina'],
          ['c', 'Daftar pesanan yang belum lunas dan total otomatis', P, 'Bu Wartini'],
          ['d', 'Rekap bungkus per rasa sebelum menggoreng', P, 'Rahmat'],
        ], done: next });
      }
      else if (r === 1) {
        const F = ['fungsional', 'nonfungsional'];
        rowsChoose(wrap, ctx, { prompt: 'Kebutuhan fungsional (apa yang dikerjakan) atau nonfungsional (bagaimana bekerja)?', cls: 'ua-isi', rows: [
          ['a', 'Menghitung total dengan potongan grosir', F, 'fungsional'],
          ['b', 'Tulisannya harus besar dan tombolnya sedikit', F, 'nonfungsional'],
          ['c', 'Menandai pesanan yang sudah diantar', F, 'fungsional'],
          ['d', 'Bisa dipakai di ponsel', F, 'nonfungsional'],
          ['e', 'Data pesanan tidak boleh hilang', F, 'nonfungsional'],
          ['k', 'Kriteria penerimaan C1 yang baik', ['Bila pesanan dicatat, pesanan mendapat nomor urut dan muncul di daftar pesanan.', 'Aplikasinya mudah dipakai.', 'Pesanan dicatat dengan cepat.', 'Bu Wartini senang.'], 'Bila pesanan dicatat, pesanan mendapat nomor urut dan muncul di daftar pesanan.'],
        ], done: next, info: 'Kebutuhan nonfungsional ditulis di pinggir papan kanban supaya selalu terlihat.' });
      }
      else if (r === 2) {
        const t9 = totalPy(TOTAL, { balado: 9 }); const t10 = totalPy(TOTAL, { balado: 10 });
        rowsChoose(wrap, ctx, { prompt: 'Prioritas rilis dan aturan grosir', cls: 'ua-isi', rows: [
          ['b', 'Versi pertama hanya berisi cerita Harus, karena', ['rilis kecil cepat dipakai, masukan nyata lebih berharga, kesalahan kecil mudah diperbaiki', 'cerita lain pasti tidak berguna', 'Python tidak sanggup', 'supaya tim cepat libur'], 'rilis kecil cepat dipakai, masukan nyata lebih berharga, kesalahan kecil mudah diperbaiki'],
          ['n', 'Total 9 bungkus balado', uniq([rp(t9), rp(t10), rp(117000), rp(150000)]), rp(t9)],
          ['s', 'Total 10 bungkus balado', uniq([rp(t10), rp(t9), rp(150000), rp(148000)]), rp(t10)],
          ['a', 'Yang aneh', ['pembeli 9 bungkus membayar lebih mahal daripada pembeli 10 bungkus', 'harga 10 bungkus salah hitung', 'tidak ada yang aneh', 'potongannya terlalu kecil'], Number(t9) > Number(t10) ? 'pembeli 9 bungkus membayar lebih mahal daripada pembeli 10 bungkus' : '?'],
          ['d', 'Yang berhak memutuskan aturan ini diubah', ['Bu Wartini, pemilik usaha; tim memberi tahu akibatnya', 'tim pengembang', 'Bu Lina', 'guru'], 'Bu Wartini, pemilik usaha; tim memberi tahu akibatnya'],
        ], done: next });
      }
      else if (r === 3) {
        wrap.append(pyCode([...DATA.slice(0, 3)], { cls: 'ua-kode' }));
        const F = ['tambah_pesanan', 'total', 'belum_lunas (memakai total)', 'belum_dikirim dan tandai_dikirim'];
        rowsChoose(wrap, ctx, { prompt: 'Rancangan data dan fungsi', cls: 'ua-isi', rows: [
          ['k', 'HARGA, GROSIR_MIN, POTONGAN diberi nama, karena', ['bila aturan berubah cukup satu tempat diubah, dan namanya menjelaskan arti angka', 'Python mewajibkannya', 'supaya kode lebih panjang', 'angka tidak boleh ditulis di fungsi'], 'bila aturan berubah cukup satu tempat diubah, dan namanya menjelaskan arti angka'],
          ['u', 'Setiap pesanan diberi no, karena', ['nama tidak unik: Bu Lina punya pesanan nomor 1 dan 3', 'nama terlalu panjang', 'supaya urut abjad', 'nomor lebih mudah diketik'], 'nama tidak unik: Bu Lina punya pesanan nomor 1 dan 3'],
          ['c1', 'C1 mencatat pesanan baru', F, F[0]], ['c2', 'C2 total otomatis', F, F[1]], ['c3', 'C3 pesanan belum lunas', F, F[2]], ['c4', 'C4 belum dikirim lalu menandai', F, F[3]],
        ], done: next });
      }
      else if (r === 4) {
        const T = [1, 2, 3, 4].map((n) => py([...TOTAL, `print(total(pesanan[${n - 1}]["isi"]))`]));
        const bl = py([...TOTAL, ...BELUM_LUNAS, 'print(belum_lunas(pesanan))']);
        const lina = py([...TOTAL, ...BELUM_LUNAS, 'utang = 0', 'for p in belum_lunas(pesanan):', '    if p[1] == "Bu Lina":', '        utang = utang + p[2]', 'print(utang)']);
        wrap.append(el('div', { class: 'ua-dua' }, pyCode(TOTAL, { labels: lab(9), cls: 'ua-kode' }), pyCode(BELUM_LUNAS, { cls: 'ua-kode' })));
        rowsChoose(wrap, ctx, { prompt: 'Telusuri dengan pesanan di soal 3', cls: 'ua-isi ua-mono', rows: [
          ...T.map((x, i) => [`t${i}`, `Total pesanan ${i + 1}`, uniq([rp(x), rp(Number(x) + 20000), rp(Number(x) - 18000 > 0 ? Number(x) - 18000 : Number(x) + 2000), rp(Number(x) + 1000)]), rp(x)]),
          ['b', 'belum_lunas(pesanan)', uniq([bl, "[(1, 'Bu Lina', 138000), (3, 'Bu Lina', 123000), (4, 'Mbak Ayu', 27000)]", "[(2, 'Pak Tono', 28000)]", "[(1, 'Bu Lina', 118000), (3, 'Bu Lina', 105000), (4, 'Mbak Ayu', 27000)]"]), bl],
          ['l', 'Yang belum dibayar Bu Lina', uniq([rp(lina), rp(261000), rp(118000), rp(223000)]), rp(lina)],
        ], done: next, info: 'Pesanan 1 berisi tepat 10 bungkus, jadi mendapat potongan 10 × 2.000.' });
      }
      else if (r === 5) {
        rowsChoose(wrap, ctx, { prompt: 'Kasus uji: harapan dari aturan Bu Wartini', cls: 'ua-isi ua-mono', rows: [
          ...UJI.slice(1).map((u) => { const h = Number(totalPy(TOTAL, u.isi)); return [u.id, `${u.id} ${isiPy(u.isi)}`, uniq([String(h), String(h + 20000), String(Math.max(0, h - 22000)), String(h + 2000)]), String(h), `${u.id}: ${u.alasan}.`]; }),
          ['a', 'assert untuk U3', ['assert total({"balado": 10}) == 130000', 'assert total({"balado": 10}) == 150000', 'assert total({"balado": 10}) = 130000', 'assert {"balado": 10} == 130000'], `assert total({"balado": 10}) == ${totalPy(TOTAL, { balado: 10 })}`],
          ['p', 'Uji yang paling mungkin menemukan bug', ['U3 dan U4: bug sering bersembunyi tepat di batas', 'U1: paling sederhana', 'U6: pesanan kosong', 'U5: angkanya paling besar'], 'U3 dan U4: bug sering bersembunyi tepat di batas'],
        ], done: next });
      }
      else if (r === 6) {
        const G = gagalPada(RUDI); const G6 = gagalPada(RUDI6);
        wrap.append(pyCode(RUDI, { labels: lab(9), cls: 'ua-kode' }));
        rowsChoose(wrap, ctx, { prompt: 'Tinjauan kode: total buatan Rudi', cls: 'ua-isi ua-mono', rows: [
          ['g', 'Uji yang gagal', ['U3, U4, U5', 'U3, U4', 'U5', 'semua lulus'], G.map((u) => u.id).join(', ')],
          ...G.map((u) => [`h${u.id}`, `${u.id}: hasil Rudi`, uniq([totalPy(RUDI, u.isi), totalPy(TOTAL, u.isi), String(Number(totalPy(RUDI, u.isi)) - 2000)]), totalPy(RUDI, u.isi)]),
          ['b', 'Setelah baris 6 saja diperbaiki, yang masih gagal', ['U3, U4', 'U3, U4, U5', 'U5', 'tidak ada'], G6.map((u) => u.id).join(', ')],
          ['w', 'Penyebabnya', ['baris 7 memakai banyak > 10, jadi tepat 10 bungkus tidak mendapat potongan', 'baris 5 salah', 'baris 8 memakai 2000', 'U3 dan U4 salah tulis'], 'baris 7 memakai banyak > 10, jadi tepat 10 bungkus tidak mendapat potongan'],
        ], done: next });
      }
      else if (r === 7) {
        wrap.append(pyCode(RUDI, { labels: lab(9), cls: 'ua-kode', warn: [5, 6, 7] }));
        rowsChoose(wrap, ctx, { prompt: 'Komentar tinjauan yang santun dan jelas', cls: 'ua-isi', rows: [
          ['b6', 'Baris 6', ['banyak bertambah 1 untuk setiap rasa, padahal grosir menghitung bungkus; U3 gagal. Usul: banyak = banyak + isi[rasa]', 'Rudi tidak teliti.', 'Baris 6 salah, ganti saja.', 'Hapus baris 6.'], 'banyak bertambah 1 untuk setiap rasa, padahal grosir menghitung bungkus; U3 gagal. Usul: banyak = banyak + isi[rasa]'],
          ['b7', 'Baris 7', ['tepat 10 bungkus seharusnya grosir; U3 masih gagal setelah baris 6 diperbaiki. Usul: if banyak >= GROSIR_MIN:', 'Pakai if banyak > 9: saja.', 'Kode ini jelek.', 'Baris 7 tidak perlu.'], 'tepat 10 bungkus seharusnya grosir; U3 masih gagal setelah baris 6 diperbaiki. Usul: if banyak >= GROSIR_MIN:'],
          ['b8', 'Baris 8', ['gunakan POTONGAN, bukan 2000, supaya cukup satu tempat yang diubah', '2000 terlalu kecil', 'baris 8 menyebabkan U3 gagal', 'ganti menjadi 2500'], 'gunakan POTONGAN, bukan 2000, supaya cukup satu tempat yang diubah'],
          ['m', 'Tinjauan dimulai dengan', ['satu hal yang sudah baik, misalnya baris 5 benar menghitung harga setiap rasa', 'daftar semua kesalahan Rudi', 'nilai untuk Rudi', 'saran mengganti anggota tim'], 'satu hal yang sudah baik, misalnya baris 5 benar menghitung harga setiap rasa'],
        ], done: next, info: 'Sebut nomor baris, jelaskan masalahnya, beri usul. Komentari kodenya, bukan orangnya.' });
      }
      else if (r === 8) {
        const lain = ctx.rand.shuffle([...MASUKAN_LAIN]).slice(0, 2);
        rowsChoose(wrap, ctx, { prompt: 'Rilis 1.0.0 sudah dipakai seminggu. Pilah masukan: jenis · versi', cls: 'ua-isi', rows: [
          ...MASUKAN.map((m) => [m.id, `${m.id} (${m.dari}): "${m.t}"`, MASUKAN.map((x) => `${x.jenis} · ${x.versi}`), `${m.jenis} · ${m.versi}`]),
          ...lain.map((m, i) => [`x${i}`, `${m.dari}: "${m.t}"`, JENIS, m.jenis]),
        ], done: next, info: 'Angka ketiga naik untuk perbaikan bug, angka kedua untuk fitur baru, angka pertama untuk perubahan besar.' });
      }
      else {
        const sesudah = py([...TANDAI_100, 'tandai_dikirim(pesanan, 3)', 'for p in pesanan:', '    print(p["no"], p["dikirim"])']).split('\n');
        const berubah = sesudah.filter((x, i) => x.endsWith('True') && DATA[6 + 2 * i] && !DATA[6 + 2 * i].includes('"dikirim": True')).map((x) => x.split(' ')[0]);
        const galat = py([...TANDAI_100, 'tandai_dikirim(pesanan, 4)']);
        const naik = py([...TOTAL, ...BELUM_LUNAS, 'HARGA["tempe"] = 13000', 'print(belum_lunas(pesanan))']);
        const rk = py([...REKAP, 'print(rekap(pesanan))']);
        wrap.append(pyCode(TANDAI_100, { cls: 'ua-kode' }));
        rowsChoose(wrap, ctx, { prompt: 'Perbaikan, uji regresi, dan Tantangan', cls: 'ua-isi ua-mono', rows: [
          ['a', 'tandai_dikirim(pesanan, 3) di 1.0.0 mengubah pesanan nomor', ['2', '3', '4', 'tidak ada'], berubah.join(', ')],
          ['b', 'tandai_dikirim(pesanan, 4) di 1.0.0', uniq([galat, 'KeyError: 4', 'tidak terjadi apa-apa', 'pesanan nomor 4 ditandai']), galat],
          ['s', 'Penyebabnya', ['daftar[no] mengambil posisi (mulai 0), bukan nomor pesanan (mulai 1)', 'nomor pesanan ganda', 'dikirim bukan bool', 'daftar terlalu pendek'], 'daftar[no] mengambil posisi (mulai 0), bukan nomor pesanan (mulai 1)'],
          ['r', 'Semua uji lama dijalankan lagi sebelum rilis, karena', ['perbaikan di satu tempat bisa merusak bagian lain (uji regresi)', 'uji lama sudah kedaluwarsa', 'supaya nomor versi naik', 'aturan sekolah'], 'perbaikan di satu tempat bisa merusak bagian lain (uji regresi)'],
          ['h', 'HARGA["tempe"] = 13000, lalu belum_lunas(pesanan)', uniq([naik, py([...TOTAL, ...BELUM_LUNAS, 'print(belum_lunas(pesanan))']), "[(1, 'Bu Lina', 122000), (3, 'Bu Lina', 123000), (4, 'Mbak Ayu', 27000)]"]), naik],
          ['k', 'Rekap pesanan yang belum dikirim', uniq([rk, "{'balado': 10, 'tempe': 8, 'gurih': 5}", "{'gurih': 3, 'balado': 4, 'tempe': 4}"]), rk],
        ], done: next, info: 'Pesanan lama ikut berubah harganya: simpan total atau harga per rasa saat pesanan dicatat.' });
      }
    }
    render();
  },
};

// ---- views ----
function persona() {
  return el('div', { class: 'ua-persona' }, ...[['Bu Wartini, 52', 'pemilik usaha; mencatat pesanan di buku tulis'], ['Rahmat, 19', 'mengemas dan mengantar pesanan'], ['Bu Lina, 40', 'pemilik warung; membeli setiap minggu']].map(([n, t]) => el('div', null, el('b', null, n), el('small', null, t))));
}

// Kanban board: cards exist only while this screen is open.
const KOLOM = ['Perlu dikerjakan', 'Sedang dikerjakan', 'Diuji', 'Selesai'];
const PRIORITAS = ['Harus', 'Sebaiknya', 'Bisa', 'Tidak sekarang'];
const CONTOH = [
  ['Sebagai Bu Wartini, saya ingin mencatat pesanan baru supaya tidak ada pesanan yang terlupa.', 'Bila pesanan dicatat, pesanan mendapat nomor urut dan muncul di daftar pesanan.', 'Harus'],
  ['Sebagai Bu Wartini, saya ingin total harga dihitung otomatis supaya harga grosir tidak salah.', 'Bila pesanan berisi paling sedikit 10 bungkus, setiap bungkus dipotong Rp2.000.', 'Harus'],
  ['Sebagai Bu Wartini, saya ingin melihat pesanan yang belum lunas beserta totalnya supaya tidak ada tagihan yang terlupa.', 'Daftar hanya berisi pesanan yang belum lunas, lengkap dengan nomor, nama, dan total.', 'Harus'],
  ['Sebagai Rahmat, saya ingin melihat pesanan yang belum dikirim dan menandainya setelah diantar supaya tidak salah kemas.', 'Pesanan yang ditandai hilang dari daftar belum dikirim, dan pesanan lain tidak berubah.', 'Harus'],
  ['Sebagai Rahmat, saya ingin rekap bungkus per rasa supaya tahu berapa yang harus digoreng.', 'Rekap menjumlahkan bungkus setiap rasa dari semua pesanan yang belum dikirim.', 'Sebaiknya'],
  ['Sebagai Bu Wartini, saya ingin laporan uang masuk setiap Sabtu supaya tahu hasil usaha seminggu.', 'Laporan menjumlahkan pesanan yang dibayar dari Senin sampai Sabtu.', 'Sebaiknya'],
  ['Sebagai Bu Lina, saya ingin tahu total yang belum saya bayar supaya bisa melunasinya di akhir bulan.', 'Bila Bu Lina punya dua pesanan yang belum lunas, totalnya dijumlahkan.', 'Bisa'],
];
const NONFUNGSIONAL = ['tulisan besar', 'sedikit tombol', 'bisa dipakai di ponsel', 'data tidak boleh hilang'];
function createKanban(root, ctx) {
  const wrap = el('div', { class: 'act proyek-umkm' });
  root.append(wrap);
  let kartu = [{ no: 1, cerita: CONTOH[0][0], kriteria: CONTOH[0][1], prioritas: 'Harus', kolom: 0 }];
  let prio = 'Harus'; let pilih = null;
  const draw = () => {
    const cerita = el('input', { class: 'txt ua-teks', placeholder: 'Sebagai …, saya ingin … supaya …', 'aria-label': 'Cerita pengguna', maxlength: '160' });
    const kriteria = el('input', { class: 'txt ua-teks', placeholder: 'Kriteria penerimaan yang bisa diuji', 'aria-label': 'Kriteria penerimaan', maxlength: '160' });
    const msg = el('p', { class: 'reveal info' }, 'Kartu hanya ada di layar ini dan hilang ketika halaman ditutup.');
    const harus = kartu.filter((k) => k.prioritas === 'Harus'); const selesaiHarus = harus.filter((k) => k.kolom === 3).length;
    wrap.replaceChildren(
      el('div', { class: 'ua-form' }, cerita, kriteria,
        el('div', { class: 'seg' }, PRIORITAS.map((p) => onTap(el('button', { class: `seg-btn ${prio === p ? 'on' : ''}`, type: 'button' }, p), () => { prio = p; draw(); }))),
        button('Tambah kartu', () => {
          const c = cerita.value.trim(); const k = kriteria.value.trim();
          if (!c) { shake(cerita); say(msg, 'bad', 'Tulis cerita penggunanya dulu.'); return; }
          kartu = [...kartu, { no: Math.max(0, ...kartu.map((x) => x.no)) + 1, cerita: c, kriteria: k, prioritas: prio, kolom: 0 }]; ctx.sound.tap(); draw();
        }, 'primary'),
        button('Muat contoh C1–C7', () => { kartu = CONTOH.map(([c, k, p], i) => ({ no: i + 1, cerita: c, kriteria: k, prioritas: p, kolom: 0 })); draw(); })),
      el('p', { class: 'ua-nfr' }, el('b', null, 'Kebutuhan nonfungsional: '), NONFUNGSIONAL.join(' · ')),
      el('p', { class: `ua-rilis ${harus.length && selesaiHarus === harus.length ? 'siap' : ''}` }, `Versi 1.0.0 berisi ${harus.length} cerita Harus; ${selesaiHarus} sudah di kolom Selesai.${harus.length && selesaiHarus === harus.length ? ' Siap dirilis!' : ''}`),
      el('div', { class: 'ua-papan' }, ...KOLOM.map((nama, ki) => el('div', { class: 'ua-kolom' }, el('b', null, `${nama} (${kartu.filter((k) => k.kolom === ki).length})`),
        ...kartu.filter((k) => k.kolom === ki).map((k) => el('div', { class: `ua-kartu p${PRIORITAS.indexOf(k.prioritas)} ${pilih === k.no ? 'on' : ''}` },
          el('div', { class: 'ua-kepala' }, el('b', null, `C${k.no}`), el('span', null, k.prioritas), ...[k.prioritas === 'Harus' ? el('em', null, '1.0.0') : null].filter(Boolean)),
          el('p', null, k.cerita), ...[k.kriteria ? el('small', null, `✔ ${k.kriteria}`) : null].filter(Boolean),
          el('div', { class: 'ua-geser' }, button('◀', () => { k.kolom = Math.max(0, k.kolom - 1); pilih = k.no; draw(); }), button('▶', () => { k.kolom = Math.min(3, k.kolom + 1); pilih = k.no; ctx.sound.tap(); draw(); }), button('✕', () => { kartu = kartu.filter((x) => x !== k); draw(); }))))))),
      msg);
  };
  draw();
}

// Function tester: build an order with + and −, write the expectation, run three versions.
const VERSI_TOTAL = [['total yang benar', TOTAL], ['total Rudi', RUDI], ['Rudi, baris 6 diperbaiki', RUDI6]];
function createPenguji(root, ctx) {
  const wrap = el('div', { class: 'act proyek-umkm' });
  root.append(wrap);
  let isi = { balado: 0, gurih: 0, tempe: 0 }; let uji = [];
  const draw = () => {
    const harapan = el('input', { class: 'txt ua-angka', type: 'number', inputmode: 'numeric', min: '0', step: '1000', placeholder: 'harapan (rupiah)', 'aria-label': 'Harapan' });
    const msg = el('p', { class: 'reveal info' }, 'Hitung harapan dari aturan Bu Wartini, bukan dari keluaran fungsi.');
    const tambah = (h, nama) => {
      const x = Object.fromEntries(Object.entries(isi).filter(([, v]) => v > 0));
      const hasil = VERSI_TOTAL.map(([, fn]) => totalPy(fn, x));
      uji = [...uji, { nama: nama || `U${uji.length + 1}`, isi: x, harapan: h, hasil }]; ctx.sound.tap(); draw();
    };
    wrap.replaceChildren(
      el('div', { class: 'ua-dua' }, el('div', null, el('small', { class: 'ua-ket' }, 'total yang benar'), pyCode(TOTAL, { labels: lab(9), cls: 'ua-kode' })), el('div', null, el('small', { class: 'ua-ket' }, 'total Rudi'), pyCode(RUDI, { labels: lab(9), cls: 'ua-kode', warn: [] }))),
      el('div', { class: 'ua-pesan' }, ...Object.keys(isi).map((k) => stepper(isi[k], (v) => { isi[k] = v; }, { min: 0, max: 30, label: k })), harapan,
        button('Tambah uji', () => { const h = harapan.value.trim(); if (h === '' || !/^\d+$/.test(h)) { shake(harapan); say(msg, 'bad', 'Tulis harapan berupa bilangan bulat rupiah.'); return; } tambah(Number(h)); }, 'primary'),
        button('Muat U1–U6', () => { uji = []; for (const u of UJI) { isi = { balado: 0, gurih: 0, tempe: 0, ...u.isi }; tambah(Number(totalPy(TOTAL, u.isi)), u.id); } isi = { balado: 0, gurih: 0, tempe: 0 }; draw(); }),
        button('Kosongkan', () => { uji = []; draw(); })),
      el('div', { class: 'ua-tabel-wadah' }, el('table', { class: 'ua-tabel' },
        el('thead', null, el('tr', null, el('th', null, 'Uji'), el('th', null, 'Isi'), el('th', null, 'Harapan'), ...VERSI_TOTAL.map(([n]) => el('th', null, n)))),
        el('tbody', null, ...uji.map((u) => el('tr', null, el('td', null, u.nama), el('td', null, isiPy(u.isi)), el('td', null, String(u.harapan)), ...u.hasil.map((h) => el('td', { class: String(h) === String(u.harapan) ? 'lulus' : 'gagal' }, `${h} ${String(h) === String(u.harapan) ? '✓' : '✗'}`))))))),
      el('p', { class: 'ua-ket' }, uji.length ? `Gagal: ${VERSI_TOTAL.map(([n], i) => `${n} ${uji.filter((u) => String(u.hasil[i]) !== String(u.harapan)).length}`).join(' · ')}. Bila total yang benar ikut gagal, periksa lagi harapanmu.` : 'Belum ada uji.'),
      msg);
  };
  draw();
}

// Team mode (soal 6d): hidden bug in a snippet; point at the line, then choose the test that proves it.
const POTONGAN_KODE = [
  { id: 'b6', judul: 'total (tim Merah)', kode: totalDengan('banyak + 1', 'banyak >= GROSIR_MIN', 'jumlah - POTONGAN * banyak'), baris: 5, jenis: 'total' },
  { id: 'b7', judul: 'total (tim Biru)', kode: totalDengan('banyak + isi[rasa]', 'banyak > 10', 'jumlah - POTONGAN * banyak'), baris: 6, jenis: 'total' },
  { id: 'b8', judul: 'total (tim Hijau)', kode: totalDengan('banyak + isi[rasa]', 'banyak >= GROSIR_MIN', 'jumlah - 2000 * banyak'), baris: 7, jenis: 'total' },
  { id: 'bt', judul: 'tandai_dikirim 1.0.0', kode: TANDAI_100, baris: 1, jenis: 'tandai' },
];
const UJI_TANDAI = [
  { id: 'T1', t: 'tandai_dikirim(pesanan, 3), lalu periksa pesanan nomor 3', baris: ['tandai_dikirim(pesanan, 3)', 'print(pesanan[2]["dikirim"])'] },
  { id: 'T2', t: 'tandai_dikirim(pesanan, 4), lalu periksa pesanan nomor 4', baris: ['tandai_dikirim(pesanan, 4)', 'print(pesanan[3]["dikirim"])'] },
  { id: 'T3', t: 'tandai_dikirim(pesanan, 1), lalu periksa pesanan nomor 1', baris: ['tandai_dikirim(pesanan, 1)', 'print(pesanan[0]["dikirim"])'] },
];
// Does a test show a difference between the snippet and the correct code?
function buktikan(P, ujiId) {
  if (P.jenis === 'total') { const u = UJI.find((x) => x.id === ujiId); const a = totalPy(P.kode, u.isi); const b = totalPy(TOTAL, u.isi); return { gagal: a !== b, teks: `${u.id} ${isiPy(u.isi)}: hasil ${a}, harapan ${b}` }; }
  const u = UJI_TANDAI.find((x) => x.id === ujiId); const a = py([...P.kode, ...u.baris]); const b = py([...TANDAI_101, ...u.baris]);
  return { gagal: a !== b, teks: `${u.id}: hasil ${a.split('\n').pop()}, harapan ${b.split('\n').pop()}` };
}
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act proyek-umkm' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0; const urut = ctx.rand.shuffle([...POTONGAN_KODE]);
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tinjauan Kode selesai', pts, again: () => pickTeams(wrap, 'Tinjauan Kode', start) }); return; }
      const who = t % nT; const P = urut[t % urut.length]; let baris = null; let fin = false;
      const msg = el('p', { class: 'reveal info' }, 'Ketuk baris yang salah.');
      const ujiOpsi = P.jenis === 'total' ? UJI.map((u) => [u.id, `${u.id} ${isiPy(u.isi)}`]) : UJI_TANDAI.map((u) => [u.id, u.t]);
      const draw = () => wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tinjau ${P.judul}`),
        el('p', { class: 'ua-ket' }, P.jenis === 'total' ? 'Aturan: 10 bungkus atau lebih (semua rasa digabung) dipotong POTONGAN per bungkus.' : 'tandai_dikirim harus menandai pesanan bernomor no.'),
        pyCode(P.kode, { labels: lab(P.kode.length), cls: 'ua-kode', hl: baris === null ? [] : [baris], warn: fin ? [P.baris] : [], onLine: fin ? null : (i) => { baris = i; draw(); } }),
        ...(baris === null || fin ? [] : [el('p', { class: 'ua-ket' }, `Baris ${baris + 1} dipilih. Pilih uji yang membuktikannya:`), el('div', { class: 'ua-uji' }, ...ujiOpsi.map(([id, t2]) => button(t2, () => periksa(id))), button('Tidak ada uji yang gagal (temuan gaya)', () => periksa(null)))]),
        msg, ...[fin ? button('Lanjut ➜', () => { t++; step(); }, 'primary') : null].filter(Boolean));
      const periksa = (ujiId) => {
        fin = true; const benarBaris = baris === P.baris;
        const B = ujiId ? buktikan(P, ujiId) : null; let p = 0; let teks;
        if (!benarBaris) teks = `Baris yang salah adalah baris ${P.baris + 1}.`;
        else if (B && B.gagal) { p = 2; teks = `Terbukti dengan uji yang gagal: ${B.teks}.`; }
        else if (!B && P.id === 'b8') { p = 1; teks = 'Benar: angka 2000 seharusnya POTONGAN. Tidak ada uji yang gagal, jadi temuan ini bernilai 1 poin bila disetujui kedua tim.'; }
        else if (P.id === 'b8') teks = `Baris benar, tetapi uji ini lulus: ${B.teks}. Angka 2000 tidak membuat uji gagal; ini temuan gaya.`;
        else teks = B ? `Baris benar, tetapi uji ini lulus: ${B.teks}. Pilih uji di nilai batas.` : 'Baris benar, tetapi ada uji yang bisa membuktikannya.';
        pts[who] += p; p ? ctx.sound.good() : ctx.mistake(); say(msg, p ? 'good' : 'bad', `${teks} +${p} poin.`); draw();
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tinjauan Kode', start);
}
