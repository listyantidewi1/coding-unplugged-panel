// Membaca Pesan Galat — SMA/SMK (16–18 tahun), coding. Reading Python
// tracebacks from the bottom: error type, the line where Python stopped, the
// call order, and the line that really caused it. Six failing programs, then a
// bug with no error message found by halving the program with checkpoints.
// Screens are the worksheet's fixed text; fixed programs run in mini-py.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy, pyRepr } from './mini-py.js';

// Each program: code, the screen exactly as in the worksheet, lines pointed to
// by the traceback (0-based, outermost call first), accepted cause lines, and
// a fixed version that mini-py runs.
export const PROG = [
  { id: 'rapor', name: 'rapor.py', judul: 'Rekap rapor', jenis: 'TypeError',
    code: ['def cetak(data):', '    for nama in data:', '        nilai = data[nama]', '        print(nama + ": " + nilai)', '', 'siswa = {"Ayu": 85, "Bima": 78}', 'cetak(siswa)'],
    layar: ['Traceback (most recent call last):', '  File "rapor.py", line 7, in <module>', '    cetak(siswa)', '    ~~~~~^^^^^^^', '  File "rapor.py", line 4, in cetak', '    print(nama + ": " + nilai)', '          ~~~~~~~~~~~~^~~~~~~', 'TypeError: can only concatenate str (not "int") to str'],
    tunjuk: [6, 3], sebab: [3], fixLine: 3, fix: ['def cetak(data):', '    for nama in data:', '        nilai = data[nama]', '        print(nama + ": " + str(nilai))', '', 'siswa = {"Ayu": 85, "Bima": 78}', 'cetak(siswa)'] },
  { id: 'p1', name: 'program1.py', judul: 'Program 1: jadwal piket', jenis: 'IndexError',
    code: ['piket = ["Ayu", "Bima", "Citra", "Dodi", "Eka"]', 'hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]', 'for i in range(1, 6):', '    print(hari[i], piket[i])'],
    layar: ['Selasa Bima', 'Rabu Citra', 'Kamis Dodi', 'Jumat Eka', 'Traceback (most recent call last):', '  File "program1.py", line 4, in <module>', '    print(hari[i], piket[i])', '          ~~~~^^^', 'IndexError: list index out of range'],
    tunjuk: [3], sebab: [2], fixLine: 2, fix: ['piket = ["Ayu", "Bima", "Citra", "Dodi", "Eka"]', 'hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]', 'for i in range(5):', '    print(hari[i], piket[i])'],
    rows: [['p', 'Penjelasan', ['range(1, 6) menghasilkan 1 sampai 5, padahal list 5 anggota hanya punya indeks 0 sampai 4', 'list hari lebih pendek daripada list piket', 'print tidak bisa mencetak dua list sekaligus', 'nama "Eka" tidak ada di list hari']],
      ['f', 'Perbaikan baris 3', ['for i in range(5):', 'for i in range(1, 5):', 'for i in range(0, 6):', 'for i in range(1, 7):']],
      ['k', 'Selain galatnya, apa lagi yang salah?', ['Senin dan Ayu terlewat, karena perulangan mulai dari indeks 1', 'Jumat dicetak dua kali', 'urutan hari terbalik', 'tidak ada yang salah']]] },
  { id: 'p2', name: 'program2.py', judul: 'Program 2: kasir kantin', jenis: 'KeyError',
    code: ['harga = {"nasi goreng": 12000, "soto": 10000, "es teh": 3000}', 'pesanan = ["soto", "es teh", "Nasi goreng"]', 'total = 0', 'for menu in pesanan:', '    total = total + harga[menu]', 'print("Total:", total)'],
    layar: ['Traceback (most recent call last):', '  File "program2.py", line 5, in <module>', '    total = total + harga[menu]', '                    ~~~~~^^^^^^', "KeyError: 'Nasi goreng'"],
    tunjuk: [4], sebab: [1], fixLine: 1, fix: ['harga = {"nasi goreng": 12000, "soto": 10000, "es teh": 3000}', 'pesanan = ["soto", "es teh", "nasi goreng"]', 'total = 0', 'for menu in pesanan:', '    total = total + harga[menu]', 'print("Total:", total)'],
    rows: [['p', 'Penjelasan', ['"Nasi goreng" ditulis dengan N kapital, sedangkan kuncinya "nasi goreng"; kunci dictionary harus sama persis', 'harga nasi goreng belum diisi', 'total belum diberi nilai awal', 'dictionary hanya boleh berisi dua menu']],
      ['f', 'Perbaikan', ['tulis "nasi goreng" di baris 2, atau pakai harga[menu.lower()]', 'ganti baris 3 menjadi total = 12000', 'hapus "Nasi goreng" dari pesanan tanpa memberi tahu kasir', 'ganti harga[menu] menjadi harga[0]']]] },
  { id: 'p3', name: 'program3.py', judul: 'Program 3: stok koperasi', ket: 'petugas mengetik 12', jenis: 'TypeError', input: ['12'],
    code: ['stok = 40', 'masuk = input("Barang masuk: ")', 'stok = stok + masuk', 'print("Stok sekarang:", stok)'],
    layar: ['Barang masuk: 12', 'Traceback (most recent call last):', '  File "program3.py", line 3, in <module>', '    stok = stok + masuk', '           ~~~~~^~~~~~~', "TypeError: unsupported operand type(s) for +: 'int' and 'str'"],
    tunjuk: [2], sebab: [1], fixLine: 1, fix: ['stok = 40', 'masuk = int(input("Barang masuk: "))', 'stok = stok + masuk', 'print("Stok sekarang:", stok)'],
    rows: [['p', 'Penjelasan', ['input selalu menghasilkan teks, jadi masuk berisi "12", bukan 12', 'stok terlalu kecil untuk ditambah 12', 'tanda + hanya untuk teks', 'petugas salah mengetik angka']],
      ['f', 'Perbaikan baris 2', ['masuk = int(input("Barang masuk: "))', 'masuk = str(input("Barang masuk: "))', 'stok = str(stok) + masuk', 'masuk = input(int("Barang masuk: "))']]] },
  { id: 'p4', name: 'program4.py', judul: 'Program 4: rata-rata nilai kelas', jenis: 'ZeroDivisionError',
    code: ['def rata_rata(daftar):', '    return sum(daftar) / len(daftar)', '', 'nilai = {"X-1": [80, 75, 90], "X-2": []}', 'for kelas in nilai:', '    print(kelas, rata_rata(nilai[kelas]))'],
    layar: ['X-1 81.66666666666667', 'Traceback (most recent call last):', '  File "program4.py", line 6, in <module>', '    print(kelas, rata_rata(nilai[kelas]))', '                 ~~~~~~~~~^^^^^^^^^^^^^^', '  File "program4.py", line 2, in rata_rata', '    return sum(daftar) / len(daftar)', '           ~~~~~~~~~~~~^~~~~~~~~~~~~', 'ZeroDivisionError: division by zero'],
    tunjuk: [5, 1], sebab: [3], fixLine: 1, fix: ['def rata_rata(daftar):', '    if len(daftar) == 0:', '        return None', '    return sum(daftar) / len(daftar)', '', 'nilai = {"X-1": [80, 75, 90], "X-2": []}', 'for kelas in nilai:', '    print(kelas, rata_rata(nilai[kelas]))'],
    rows: [['p', 'Penjelasan', ['kelas X-2 belum punya nilai, jadi len(daftar) bernilai 0 dan terjadi pembagian dengan nol', 'sum tidak bisa menjumlahkan bilangan', 'rata-rata X-1 bukan bilangan bulat', 'kelas X-1 punya terlalu banyak nilai']],
      ['f', 'Perbaikan', ['di dalam fungsi, if len(daftar) == 0: return None sebelum pembagian', 'ganti / menjadi //', 'hapus baris 6', 'ganti len(daftar) menjadi len(nilai)']]] },
  { id: 'p5', name: 'program5.py', judul: 'Program 5: keterangan tuntas', ket: 'guru mengetik 60', jenis: 'NameError', input: ['60'],
    code: ['nilai = int(input("Nilai: "))', 'if nilai >= 75:', '    ket = "Tuntas"', 'print(nilai, ket)'],
    layar: ['Nilai: 60', 'Traceback (most recent call last):', '  File "program5.py", line 4, in <module>', '    print(nilai, ket)', '                 ^^^', "NameError: name 'ket' is not defined. Did you mean: 'set'?"],
    tunjuk: [3], sebab: [1, 2], fixLine: 2, fix: ['nilai = int(input("Nilai: "))', 'if nilai >= 75:', '    ket = "Tuntas"', 'else:', '    ket = "Belum tuntas"', 'print(nilai, ket)'],
    rows: [['p', 'Penjelasan', ['ket hanya diberi nilai bila nilai ≥ 75; dengan 60, baris 3 dilewati sehingga ket tidak pernah dibuat', 'ket salah ketik, seharusnya set', 'print tidak bisa mencetak teks', 'nilai 60 terlalu kecil untuk int']],
      ['f', 'Perbaikan', ['tambahkan else: ket = "Belum tuntas"', 'ganti ket menjadi set', 'ganti >= menjadi >', 'hapus baris 1']],
      ['d', 'Apakah tebakan Did you mean: \'set\'? membantu?', ['tidak: Python hanya mencari nama yang ejaannya mirip; masalahnya jalur program', 'ya: ket memang salah ketik dari set', 'ya: set adalah nama variabel yang benar', 'tidak: set bukan nama di Python']],
      ['e', 'Mengapa lancar bila guru mengetik 80?', ['baris 3 dijalankan, jadi ket sudah punya nilai', '80 adalah bilangan genap', 'Python melewati baris 4', 'int hanya menerima angka di atas 75']]] },
  { id: 'p6', name: 'program6.py', judul: 'Program 6: barang yang habis', jenis: 'IndentationError',
    code: ['stok = {"pensil": 3, "buku": 0, "penghapus": 5}', 'print("Barang yang habis:")', 'for barang in stok:', '    if stok[barang] == 0:', '    print(barang)'],
    layar: ['  File "program6.py", line 5', '    print(barang)', '    ^^^^^', "IndentationError: expected an indented block after 'if' statement on line 4"],
    tunjuk: [4], sebab: [4], fixLine: 4, fix: ['stok = {"pensil": 3, "buku": 0, "penghapus": 5}', 'print("Barang yang habis:")', 'for barang in stok:', '    if stok[barang] == 0:', '        print(barang)'],
    rows: [['p', 'Penjelasan', ['badan if harus menjorok ke dalam; keterangannya menyebut baris 4 karena if di sana menunggu badan', 'dictionary stok tidak boleh berisi 0', 'print tidak boleh dipakai di dalam for', 'baris 4 harus diakhiri titik koma']],
      ['f', 'Perbaikan', ['tambahkan empat spasi di awal baris 5', 'hapus titik dua di baris 4', 'pindahkan baris 5 ke atas baris 3', 'ganti == menjadi =']],
      ['b', 'Mengapa "Barang yang habis:" pun tidak tampil?', ['Python memeriksa tata tulis seluruh berkas sebelum menjalankan baris pertama', 'baris 2 juga salah indentasi', 'print hanya bekerja di dalam for', 'stok habis sebelum baris 2']]] },
];
export const progOf = (id) => PROG.find((p) => p.id === id);
export const runFix = (p) => runPy(p.fix, { limit: 5000, input: p.input || [] });
export const runOrig = (p) => runPy(p.code, { limit: 5000, input: p.input || [] });
const lineTxt = (p) => p.tunjuk.map((i) => i + 1).join(' lalu ');
const sebabTxt = (p) => p.sebab.map((i) => i + 1).join('–');

// The bus-fee program of soal 4; `fixed` uses the correct rounding up.
export const IURAN = (murid = 37, fixed = false) => [`murid = ${murid}`, 'guru = 3', 'harga_bus = 2400000', 'orang = murid + guru', fixed ? 'bus = (orang + 39) // 40' : 'bus = orang // 40 + 1', 'biaya_bus = bus * harga_bus', 'tiket_murid = murid * 8000', 'tiket_guru = guru * 15000', 'konsumsi = orang * 25000', 'total = biaya_bus + tiket_murid + tiket_guru + konsumsi', 'cadangan = total * 10 // 100', 'total = total + cadangan', 'subsidi = 1500000', 'ditanggung = total - subsidi', 'iuran = ditanggung // murid', 'iuran = (iuran + 999) // 1000 * 1000', 'print("Iuran per murid:", iuran)'];
// What each line defines and reads, for the "still suspected" shading.
export const DEF = [['murid', []], ['guru', []], ['harga_bus', []], ['orang', ['murid', 'guru']], ['bus', ['orang']], ['biaya_bus', ['bus', 'harga_bus']], ['tiket_murid', ['murid']], ['tiket_guru', ['guru']], ['konsumsi', ['orang']], ['total', ['biaya_bus', 'tiket_murid', 'tiket_guru', 'konsumsi']], ['cadangan', ['total']], ['total', ['total', 'cadangan']], ['subsidi', []], ['ditanggung', ['total', 'subsidi']], ['iuran', ['ditanggung', 'murid']], ['iuran', ['iuran']]];
// Lines (0-based) that the value of v after line L depends on.
export function deps(v, L) {
  let d = -1; for (let i = 0; i <= L; i++) if (DEF[i][0] === v) d = i;
  if (d < 0) return new Set();
  const s = new Set([d]); for (const u of DEF[d][1]) for (const x of deps(u, d - 1)) s.add(x);
  return s;
}
export const varsUpTo = (L) => [...new Set(DEF.slice(0, L + 1).map((x) => x[0]))];
// Value of v right after line L (0-based), in the buggy or fixed program.
export const nilaiSetelah = (L, v, { murid = 37, fixed = false } = {}) => runPy(IURAN(murid, fixed).slice(0, L + 1), { limit: 2000 }).vars[v];
// Narrow the suspects: a matching value clears the lines it depends on; a wrong one keeps only those.
export function curiga(cps, n = 16) {
  let s = new Set(Array.from({ length: n }, (_, i) => i));
  for (const c of cps) { const d = deps(c.v, c.L); s = c.ok ? new Set([...s].filter((i) => !d.has(i))) : new Set([...s].filter((i) => d.has(i))); }
  return [...s].sort((a, b) => a - b);
}

// Screen of a failed run; `tags` lists the parts to highlight.
function kind(line, i, all) {
  if (i === all.length - 1 && /^\w+Error/.test(line)) return 'jenis';
  if (/^Traceback/.test(line)) return 'judul';
  if (/^\s*File "/.test(line)) return 'lokasi';
  if (/^\s+[~^ ]+$/.test(line)) return 'caret';
  const tb = all.findIndex((x) => /^Traceback|^\s*File "/.test(x));
  return i < tb ? 'keluaran' : 'isi';
}
export function layarView(lines, tags = []) {
  return el('pre', { class: 'pg-layar' }, lines.map((t, i) => { const k = kind(t, i, lines); return el('span', { class: `${k} ${tags.includes(k) ? 'sorot' : ''}` }, t || ' '); }));
}
const outView = (R, p) => el('pre', { class: 'pg-layar ok' }, [...(p.input ? [`${p.fix[p.fix.findIndex((x) => x.includes('input('))].match(/input\("([^"]*)"\)/)[1]}${p.input[0]}`] : []), ...R.out].map((t) => el('span', { class: 'keluaran' }, t)));

export default {
  id: 'sma-42-pesan-galat',
  title: 'Membaca Pesan Galat',
  topic: 'Membaca traceback Python dari bawah (jenis galat, nomor baris, urutan pemanggilan), membedakan baris tempat Python berhenti dengan baris penyebab, galat sintaks dan galat saat berjalan, serta mencari bug tanpa pesan galat dengan titik periksa dan membagi dua',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🩺',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Baca traceback dari bawah, ketuk baris yang ditunjuk dan baris penyebabnya untuk enam program yang gagal, lalu temukan bug program iuran yang tidak memunculkan pesan galat dengan titik periksa.',
  extraModes: [
    { id: 'periksa', icon: '📍', label: 'Titik Periksa', desc: 'Ketuk baris program iuran untuk memasang titik periksa, bandingkan nilainya dengan catatan bendahara, dan persempit bagian yang dicurigai', create: createCheck },
    { id: 'giliran', icon: '🧯', label: 'Bank Program Bergalat', desc: 'Satu tim memilih program, tim lain menebak jenis galat, baris yang ditunjuk, dan baris penyebabnya sebelum traceback dibuka', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pesan-galat' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) {
        const p = PROG[0];
        wrap.append(el('div', { class: 'pg-dua' }, pyCode(p.code, { cls: 'pg-kecil' }), layarView(p.layar, ['jenis'])));
        rowsChoose(wrap, ctx, { prompt: 'Bagian-bagian traceback rapor.py (dibaca dari bawah)', cls: 'pg-isi', rows: [
          ['j', 'Jenis galat · artinya', ['TypeError · teks (str) hanya bisa disambung dengan teks, bukan dengan bilangan bulat (int)', 'TypeError · data siswa terlalu sedikit', 'SyntaxError · tanda + salah tulis', 'NameError · nama nilai belum dibuat'], 'TypeError · teks (str) hanya bisa disambung dengan teks, bukan dengan bilangan bulat (int)'],
          ['b', 'Python berhenti di', ['baris 4, di dalam fungsi cetak', 'baris 7, di dalam fungsi cetak', 'baris 4, di program utama', 'baris 1, di dalam fungsi cetak'], 'baris 4, di dalam fungsi cetak'],
          ['c', 'Baris program utama (<module>) yang memanggil fungsi itu', ['1', '6', '7', '4'], '7'],
          ['n', 'Isi nama dan nilai saat galat terjadi', ['"Ayu" dan 85 (bilangan bulat)', '"Bima" dan 78', '"Ayu" dan "85"', '"siswa" dan 2'], '"Ayu" dan 85 (bilangan bulat)'],
          ['f', 'Perbaikan baris 4', ['print(nama + ": " + str(nilai))', 'print(nama + ": " + int(nilai))', 'print(str(nama) + ": " + nilai)', 'print(nama, ": ", + nilai)'], 'print(nama + ": " + str(nilai))']],
        done: () => { wrap.querySelector('.pg-layar')?.replaceWith(layarView(p.layar, ['jenis', 'lokasi'])); wrap.append(el('p', { class: 'pg-ket' }, 'Setelah diperbaiki:'), outView(runFix(p), p)); next(); } });
      }
      else if (r >= 1 && r <= 6) programRound(wrap, ctx, PROG[r], next);
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Pola galat pada keenam program', cls: 'pg-isi', rows: [
        ['a', 'Ditemukan sebelum satu baris pun dijalankan', ['program 6', 'program 1', 'program 3', 'program 5'], 'program 6'],
        ['bk', 'Buktinya', ['tidak ada keluaran sama sekali, bahkan dari baris 2', 'pesannya paling pendek', 'nomor barisnya paling besar', 'tidak ada kata Error'], 'tidak ada keluaran sama sekali, bahkan dari baris 2'],
        ['b', 'Hanya muncul untuk data tertentu', ['program 2, 4, dan 5', 'program 1 dan 3', 'semua program', 'program 6 saja'], 'program 2, 4, dan 5'],
        ['c', 'Baris yang ditunjuk berbeda dengan baris yang diperbaiki', ['program 1 sampai 5', 'program 6 saja', 'tidak ada', 'program 4 saja'], 'program 1 sampai 5'],
        ['l', 'Pelajarannya', ['baris yang ditunjuk adalah tempat Python berhenti; telusuri ke atas mencari asal nilai yang salah', 'selalu perbaiki baris yang ditunjuk', 'pesan galat sering keliru', 'galat sintaks paling berbahaya']],
      ].map(([k, t, o, a]) => [k, t, o, a ?? o[0]]), done: next });
      else if (r === 8) {
        const L = IURAN(); const val = (l, v) => nilaiSetelah(l, v);
        wrap.append(el('div', { class: 'pg-dua' }, pyCode(L, { cls: 'pg-kecil' }), catatanView()));
        rowsChoose(wrap, ctx, { prompt: 'Program mencetak 143000, bendahara mendapat 71000. Cari bugnya dengan titik periksa', cls: 'pg-isi', rows: [
          ['a', `Dodi: print(konsumsi) setelah baris 9 = ${val(8, 'konsumsi')}, sama dengan catatan. Mengapa belum tentu bug di baris 10–16?`, ['konsumsi tidak bergantung pada bus; bus dan biaya_bus dari baris sebelumnya belum diperiksa', 'konsumsi seharusnya 925000', 'print mengubah nilai konsumsi', 'titik periksa hanya boleh di baris terakhir'], 'konsumsi tidak bergantung pada bus; bus dan biaya_bus dari baris sebelumnya belum diperiksa'],
          ['k1', `Titik 1: setelah baris 10, total = ${val(9, 'total')}`, ['tidak sesuai (catatan 3.741.000) → bug di baris 1–10', 'sesuai → bug di baris 11–16', 'tidak sesuai → bug di baris 11–16', 'sesuai → bug di baris 1–10'], 'tidak sesuai (catatan 3.741.000) → bug di baris 1–10'],
          ['k2', `Titik 2: setelah baris 5, orang = ${val(4, 'orang')} dan bus = ${val(4, 'bus')}`, ['bus tidak sesuai (catatan 1) → bug di baris 1–5', 'semua sesuai → bug di baris 6–10', 'orang tidak sesuai → bug di baris 1–4', 'bus sesuai → bug di baris 6–10'], 'bus tidak sesuai (catatan 1) → bug di baris 1–5'],
          ['k3', `Titik 3: setelah baris 4, orang = ${val(3, 'orang')}`, ['sesuai → bug di baris 5', 'tidak sesuai → bug di baris 1–4', 'sesuai → bug di baris 1–3', 'tidak sesuai → bug di baris 5']]].map(([k, t, o, a]) => [k, t, o, a ?? o[0]]), done: next });
      }
      else {
        const R = runPy(IURAN(37, true), { limit: 2000 });
        rowsChoose(wrap, ctx, { prompt: 'Bug baris 5', cls: 'pg-isi', rows: [
          ['c', 'Mengapa baris 5 salah · perbaikan', ['orang // 40 + 1 selalu menambah satu bus · bus = (orang + 39) // 40', 'pembagian harus memakai / · bus = orang / 40', 'harga bus salah · harga_bus = 1200000', 'bus harus dikali 2 · bus = orang // 20'], 'orang // 40 + 1 selalu menambah satu bus · bus = (orang + 39) // 40'],
          ['h', 'Keluaran setelah diperbaiki', [R.out[0], 'Iuran per murid: 70678', 'Iuran per murid: 143000', 'Iuran per murid: 72000'], R.out[0]],
          ['d', `Tahun lalu 32 murid dan 3 guru: 35 // 40 + 1 = ${runPy(['x = 35 // 40 + 1']).vars.x}`, ['1 bus, kebetulan benar', '2 bus, tetapi tidak ada yang sadar', '0 bus', '1 bus karena rumusnya benar untuk semua jumlah'], '1 bus, kebetulan benar'],
          ['k', 'Bug ini muncul bila banyak orang', ['tepat kelipatan 40 (40, 80, 120, …)', 'lebih dari 40', 'ganjil', 'kurang dari 40'], 'tepat kelipatan 40 (40, 80, 120, …)'],
          ['e', 'Titik periksa paling banyak · 16 baris · 1.000 baris', ['4 · sekitar 10 (2¹⁰ = 1.024)', '16 · 1.000', '8 · 500', '2 · 3'], '4 · sekitar 10 (2¹⁰ = 1.024)']],
        done: then(() => rowsChoose(wrap, ctx, { prompt: 'Tantangan: program 3 sudah memakai int(input(...)), petugas mengetik "dua belas"', cls: 'pg-isi', rows: [
          ['v', 'Yang terjadi', ["ValueError: invalid literal for int() with base 10: 'dua belas'", "TypeError: unsupported operand type(s) for +: 'int' and 'str'", 'Stok sekarang: 52', "NameError: name 'dua' is not defined"], "ValueError: invalid literal for int() with base 10: 'dua belas'"],
          ['w', 'Agar program meminta ulang', ['while True: lalu try: masuk = int(input(...)) dan break, except ValueError: cetak pesan', 'if masuk == "dua belas": masuk = 12', 'try: tanpa except', 'hapus int dari baris 2'], 'while True: lalu try: masuk = int(input(...)) dan break, except ValueError: cetak pesan'],
          ['x', 'Mengapa jangan except: tanpa nama galat?', ['menangkap semua galat, termasuk NameError karena salah ketik, sehingga bug lain tersembunyi', 'Python menolak except tanpa nama', 'programnya menjadi lebih lambat', 'except tanpa nama hanya menangkap SyntaxError'], 'menangkap semua galat, termasuk NameError karena salah ketik, sehingga bug lain tersembunyi']], done: next })) });
      }
    }
    render();
  },
};

// One failing program: tap the line(s) the traceback points to, then the cause, then explain and fix.
function programRound(wrap, ctx, p, next) {
  const msg = el('p', { class: 'reveal info' });
  let step = 0; let k = 0; const got = [];
  const draw = () => {
    const tags = ['jenis', ...(step >= 1 ? ['lokasi'] : [])];
    const ask = step === 0 ? (p.tunjuk.length > 1 ? `Ketuk baris yang ditunjuk traceback, mulai dari pemanggilan paling awal (${k} dari ${p.tunjuk.length})` : 'Ketuk baris yang ditunjuk traceback') : 'Ketuk baris penyebab: baris yang harus diperbaiki';
    const code = pyCode(p.code, { cls: 'pg-kecil', hl: got, warn: step >= 2 ? p.sebab : [], onLine: step < 2 ? tap : null });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `${p.judul}${p.ket ? ` (${p.ket})` : ''}`), el('div', { class: `pg-dua ${step < 2 ? 'pg-tap' : ''}`, 'data-langkah': `${step}-${k}` }, code, layarView(p.layar, tags)), ...(step < 2 ? [el('p', { class: 'pg-tanya' }, ask)] : []), msg);
  };
  function tap(i) {
    if (step === 0) {
      if (i !== p.tunjuk[k]) { ctx.mistake(); say(msg, 'bad', k === 0 && p.tunjuk.length > 1 ? `Baris ${i + 1} bukan. Baca baris "File …, line …" yang paling atas.` : `Baris ${i + 1} bukan. Cari "line …" pada baris File terakhir.`); return; }
      got.push(i); k++; ctx.sound.tap();
      if (k >= p.tunjuk.length) { step = 1; say(msg, '', `Tepat: Python berhenti di baris ${lineTxt(p)}.`); }
      draw(); return;
    }
    if (!p.sebab.includes(i)) { ctx.mistake(); say(msg, 'bad', p.tunjuk.includes(i) && !p.sebab.includes(i) ? `Baris ${i + 1} adalah tempat Python berhenti. Dari mana nilai yang salah berasal?` : `Baris ${i + 1} bukan penyebabnya. Telusuri nilai yang dipakai di baris yang ditunjuk.`); return; }
    step = 2; ctx.sound.good(); say(msg, '', `Tepat: penyebabnya di baris ${sebabTxt(p)}.`); draw();
    const rows = p.rows.map(([key, t, o]) => [key, t, o, o[0]]);
    rowsChoose(wrap, ctx, { prompt: `${p.jenis}: penjelasan dan perbaikan`, cls: 'pg-isi', rows, done: () => { const R = runFix(p); wrap.append(el('p', { class: 'pg-ket' }, 'Program yang sudah diperbaiki dijalankan:'), outView(R, p)); next(); } });
  }
  draw();
}

const CATATAN = [['Banyak orang', 40], ['Banyak bus', 1], ['Biaya bus', 2400000], ['Tiket murid dan tiket guru', '296.000 dan 45.000'], ['Konsumsi', 1000000], ['Total sebelum cadangan', 3741000], ['Cadangan', 374100], ['Total sesudah cadangan', 4115100], ['Ditanggung murid', 2615100], ['Iuran sebelum dibulatkan', 70678], ['Iuran', 71000]];
const catatanView = () => el('table', { class: 'pg-tabel' }, el('tr', null, el('th', null, 'Catatan bendahara'), el('th', null, 'Nilai')), CATATAN.map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, typeof b === 'number' ? fmtNum(b) : b))));

// Checkpoints on the bus-fee program: tap a line, pick a variable, compare with the treasurer.
function createCheck(root, ctx) {
  const wrap = el('div', { class: 'act pesan-galat' });
  root.append(wrap);
  let cps = []; let at = null; let fixed = false; let murid = 37;
  const draw = () => {
    const L = IURAN(murid, fixed); const sus = curiga(cps);
    const code = pyCode(L, { cls: 'pg-kecil', hl: at == null ? [] : [at], onLine: (i) => { if (i >= 16) return; at = i; ctx.sound.tap(); draw(); } });
    if (cps.length) [...code.children].forEach((li, i) => { if (i < 16) li.classList.add(sus.includes(i) ? 'pg-curiga' : 'pg-bersih'); });
    const R = runPy(L, { limit: 2000 }); const B = runPy(IURAN(murid, true), { limit: 2000 });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Titik periksa program iuran'),
      el('div', { class: 'pg-dua' }, el('div', null, code, el('p', { class: 'pg-ket' }, `Keluaran: ${R.out.join(' ')} · catatan bendahara: Iuran per murid: ${B.vars.iuran}`)),
        el('div', { class: 'pg-samping' },
          at == null ? el('p', { class: 'pg-tanya' }, 'Ketuk sebuah baris untuk memasang print setelahnya.') : el('div', { class: 'pg-pilih' }, el('small', null, `print(…) setelah baris ${at + 1}:`), el('div', { class: 'seg' }, varsUpTo(at).map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, v), () => {
            const got = nilaiSetelah(at, v, { murid, fixed }); const want = nilaiSetelah(at, v, { murid, fixed: true });
            cps.push({ L: at, v, got, want, ok: got === want }); at = null; ctx.sound.tap(); draw();
          })))),
          el('table', { class: 'pg-tabel' }, el('tr', null, ['#', 'setelah baris', 'variabel', 'di program', 'catatan', ''].map((h) => el('th', null, h))), cps.map((c, i) => el('tr', { class: c.ok ? 'lulus' : 'gagal' }, el('td', null, String(i + 1)), el('td', null, String(c.L + 1)), el('td', null, el('code', null, c.v)), el('td', null, pyRepr(c.got)), el('td', null, fmtNum(c.want)), el('td', null, c.ok ? '✓ sesuai' : '✗ tidak sesuai')))),
          el('p', { class: 'pg-ringkas' }, cps.length ? `Titik periksa: ${cps.length} · masih dicurigai: ${sus.length === 16 ? 'semua baris' : sus.length ? `baris ${sus.map((i) => i + 1).join(', ')}` : 'tidak ada'}` : 'Belum ada titik periksa. Semua baris 1–16 dicurigai.'),
          sus.length === 1 && !fixed ? el('p', { class: 'reveal good' }, `Tinggal baris ${sus[0] + 1} yang dicurigai.`) : null,
          el('div', { class: 'pg-atur' }, stepper(murid, (v) => { murid = v; cps = []; at = null; draw(); }, { min: 1, max: 160, label: 'murid' }), el('span', { class: 'pg-ket' }, `orang = ${murid + 3} · bus di program ${R.vars.bus} · seharusnya ${B.vars.bus}`)),
          el('div', { class: 'kode-baris' }, button(fixed ? '↩ Kembalikan baris 5 lama' : '🔧 Perbaiki baris 5', () => { fixed = !fixed; cps = []; at = null; draw(); }), button('↺ Ulang', () => { cps = []; at = null; draw(); })))));
  };
  draw();
}

// Team mode: one team picks a failing program, the next team diagnoses it before the traceback is shown.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pesan-galat' });
  root.append(wrap);
  const JENIS = [...new Set(PROG.map((p) => p.jenis)), 'SyntaxError', 'ValueError'];
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * Math.floor(PROG.length / nT); let t = 0; const used = new Set();
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Bank Program Bergalat selesai', pts, again: () => pickTeams(wrap, 'Bank Program Bergalat', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih program untuk Tim ${(boss + 1) % nT + 1}`), el('div', { class: 'pg-bank' }, PROG.map((p, k) => onTap(el('button', { class: `pg-kartu ${used.has(k) ? 'dipakai' : ''}`, type: 'button', disabled: used.has(k) }, el('b', null, p.name), el('small', null, p.judul)), () => { if (used.has(k)) return; used.add(k); ctx.sound.tap(); diagnose((boss + 1) % nT, p); }))));
    }
    function diagnose(who, p) {
      const n = p.code.length; const nums = Array.from({ length: n }, (_, i) => String(i + 1)).filter((x) => p.code[+x - 1].trim());
      const opt = (right, pool) => { const r = ctx.rand?.shuffle ? ctx.rand.shuffle([...pool.filter((x) => x !== right)]) : pool.filter((x) => x !== right); return [right, ...r.slice(0, 3)].sort((a, b) => (/^\d+$/.test(a) && /^\d+$/.test(b) ? a - b : 0)); };
      const tunjuk = String(p.tunjuk[p.tunjuk.length - 1] + 1); const sebab = String(p.sebab[0] + 1);
      const Q = [['j', 'Jenis galat', ctx.rand?.shuffle ? ctx.rand.shuffle(opt(p.jenis, JENIS)) : opt(p.jenis, JENIS), p.jenis], ['t', p.tunjuk.length > 1 ? 'Baris terakhir yang ditunjuk' : 'Baris yang ditunjuk', opt(tunjuk, nums), tunjuk], ['s', 'Baris penyebab', opt(sebab, nums), sebab]];
      const ans = {};
      const okA = (k, v, right) => (k === 's' ? p.sebab.map((x) => String(x + 1)).includes(v) : v === right);
      const draw = () => {
        const all = Q.every(([k]) => k in ans);
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: diagnosis ${p.name}${p.ket ? ` (${p.ket})` : ''}`),
          el('div', { class: 'pg-dua' }, pyCode(p.code, { cls: 'pg-kecil', warn: all ? p.sebab : [] }), all ? layarView(p.layar, ['jenis', 'lokasi']) : el('p', { class: 'pg-tutup' }, 'Traceback masih ditutup')),
          el('div', { class: 'sk-baris-baris pg-isi' }, Q.map(([k, label, o, right]) => el('div', { class: `sk-baris ${k in ans ? `beres ${okA(k, ans[k], right) ? '' : 'pg-baris-salah'}` : ''}` }, el('span', null, label), k in ans ? el('b', { class: okA(k, ans[k], right) ? 'pg-benar' : 'pg-salah' }, okA(k, ans[k], right) ? `${ans[k]} ✓` : `${ans[k]} ✗ (${right}${k === 's' && p.sebab.length > 1 ? `–${p.sebab[1] + 1}` : ''})`) : el('div', { class: 'seg' }, o.map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, v), () => { ans[k] = v; if (okA(k, v, right)) { pts[who]++; ctx.sound.good(); } else ctx.sound.bad(); draw(); })))))),
          ...(all ? [el('div', { class: 'kode-baris' }, button('Lanjut ➜', () => { t++; step(); }, 'primary'))] : []));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Bank Program Bergalat', start);
}
