// Membaca Pesan Galat — SMA/SMK (16–18 tahun), coding. Reading Python
// tracebacks from the bottom: error type, the line where Python stopped, the
// call order, and the line that really caused it. Six failing programs, then a
// bug with no error message found by halving the program with checkpoints.
// Screens are the worksheet's fixed text; fixed programs run in mini-py.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
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

// ---- Permainan: UGD Program ----
// Every crashed program is a patient and its traceback the medical record:
// read the symptom from the bottom, point at where Python stopped, trace the
// cause upwards, and write the prescription. One patient shows no symptoms.
const T42 = 'Seret kartu gejala, ketuk baris yang ditunjuk dan baris penyebab, lalu beri resep.';
const HEAD42 = {
  rapor: ['Baca Rekam Medis', 'Baca traceback dari bawah: gejala, baris berhenti, pemanggil, lalu resep.', 'Pasien pertama: rapor.py!'],
  p1: ['Pasien 1: Jadwal Piket', T42, 'Hari Jumat membuat program pingsan!'],
  p2: ['Pasien 2: Kasir Kantin', T42, '"Nasi goreng" tidak dikenali!'],
  p3: ['Pasien 3: Stok Koperasi', T42, 'Petugas mengetik 12…'],
  p4: ['Pasien 4: Rata-rata Kelas', T42, 'Kelas X-2 belum punya nilai!'],
  p5: ['Pasien 5: Keterangan Tuntas', T42, 'Guru mengetik 60…'],
  p6: ['Pasien 6: Barang Habis', T42, 'Tidak ada keluaran sama sekali!'],
  rapat: ['Rapat Dokter', 'Kelompokkan keenam pasien menurut pola penyakitnya.', 'Pola apa yang sama?'],
  sunyi: ['Pasien Tanpa Gejala', 'Pasang paling banyak tiga titik periksa untuk mengepung bug.', 'Iuran 143000, bendahara 71000. Tanpa pesan galat!'],
  bos: ['Pasien yang Bandel', 'Rakit program yang meminta ulang sampai petugas mengetik angka.', 'Petugas mengetik "dua belas"!'],
};
const msg42 = (t) => el('p', { class: 'reveal info' }, t);
export const JENIS = ['TypeError', 'IndexError', 'KeyError', 'ZeroDivisionError', 'NameError', 'IndentationError', 'ValueError', 'SyntaxError'];
const RESEP0 = ['print(nama + ": " + str(nilai))', 'print(nama + ": " + int(nilai))', 'print(str(nama) + ": " + nilai)', 'print(nama, ": ", + nilai)'];
const rowOf = (p, keys) => (p.rows || []).find((r) => keys.includes(r[0]));
const resepOf = (p) => (p.rows ? rowOf(p, ['f'])[2] : RESEP0);
const sebabOf = (p) => (p.rows ? rowOf(p, ['p'])[2][0] : 'teks (str) hanya bisa disambung dengan teks, bukan dengan bilangan bulat (int)');
export const konsulOf = (p) => rowOf(p, ['k', 'd', 'b']);
const jenisChips = (ctx, want) => ctx.rand.shuffle([want, ...ctx.rand.shuffle(JENIS.filter((j) => j !== want)).slice(0, 3)]);
const slot42 = (k) => el('span', { class: 'ug42-slot', 'data-drop': k }, '?');

// One patient: symptom card, pointed lines, cause line, prescription card.
function patientRound(area, ctx, { oops, done }, p, { rapor = false } = {}) {
  const msg = msg42('Baca dari bawah: seret kartu gejala (jenis galat) ke papan pasien.');
  let step = 'jenis'; const got = []; const cause = [];
  const bed = el('div', { class: 'ug42-ranjang', 'data-id': p.id, 'data-langkah': step }); const scr = el('div', { class: 'ug42-kolom' });
  const jSlot = slot42('jenis'); const rSlot = slot42('resep');
  const tray = el('div', { class: 'ug42-baki' }); const extra = el('div', { class: 'ug42-kolom' });
  const host = el('div', { class: 'ug42-kolom' }, el('div', { class: 'ug42-papan' }, el('span', null, '🤒 Gejala'), jSlot, el('span', null, '💊 Resep'), rSlot), tray);
  const tags = () => ['jenis', ...(got.length >= p.tunjuk.length ? ['lokasi'] : [])];
  const panah = (i) => [got.includes(i) ? el('span', { class: 'ug42-panah merah' }, '◀ ditunjuk') : null, cause.includes(i) ? el('span', { class: 'ug42-panah biru' }, '◀ penyebab') : null];
  const draw = () => {
    bed.dataset.langkah = step; const tapNow = step === 'lokasi' || step === 'sebab';
    fill(bed, el('div', { class: 'ug42-pasien' }, el('b', null, `🛏️ ${p.name}`), p.ket ? el('span', null, `(${p.ket})`) : null),
      codeView(p.code, { cls: tapNow ? 'ketuk' : '', hl: got, warn: cause, after: panah, onLine: tapNow ? tap : null }));
    if (step !== 'sembuh') fill(scr, layarView(p.layar, step === 'jenis' ? [] : tags()));
  };
  const chips = (list) => fill(tray, list.map(([k, t]) => el('div', { class: 'ug42-kartu', 'data-drag': k }, t)));
  dnd(host, (card, s) => {
    if (!s.classList.contains('ug42-slot') || s.classList.contains('isi')) return;
    if (s.dataset.drop !== step) { say(msg, 'info', step === 'jenis' ? 'Kartu ini untuk papan Gejala.' : 'Kartu ini untuk papan Resep.'); return; }
    if (step === 'jenis') {
      if (card.dataset.drag !== p.jenis) { oops(); shake(card); say(msg, 'bad', 'Baca baris paling bawah traceback: di sana tertulis jenis galatnya.'); return; }
      fill(jSlot, p.jenis); jSlot.classList.add('isi'); fill(tray); ctx.sound.tap(); step = 'lokasi'; draw();
      say(msg, 'info', rapor ? 'Ketuk baris yang ditunjuk traceback, mulai dari baris File paling atas: pemanggil dulu, lalu tempat Python berhenti.' : p.tunjuk.length > 1 ? 'Ketuk baris yang ditunjuk traceback, mulai dari baris File paling atas.' : 'Ketuk baris yang ditunjuk traceback (lihat "line …").');
      return;
    }
    const k = card.dataset.drag;
    if (k !== 'r0') { oops(); shake(card); say(msg, 'bad', `Resep ini tidak menyembuhkan. Ingat penyebabnya: ${sebabOf(p)}.`); return; }
    fill(rSlot, resepOf(p)[0]); rSlot.classList.add('isi'); tray.remove(); ctx.sound.good(); step = 'sembuh'; draw();
    fill(scr, el('small', null, 'Setelah diobati:'), outView(runFix(p), p));
    const ks = konsulOf(p);
    if (!ks) { say(msg, '', `Pasien sembuh. Penyebabnya: ${sebabOf(p)}.`); done(); return; }
    say(msg, 'info', `Pasien sembuh. Pertanyaan dokter konsulen: ${ks[1]}`);
    fill(extra, el('div', { class: 'ug42-tanya' }, ks[2].map((t, i) => onTap(el('button', { type: 'button', class: 'ug42-pilih', 'data-k': String(i) }, t), (e) => {
      const b = e.currentTarget || e.target.closest('button'); if (extra.dataset.beres) return;
      if (i !== 0) { oops(); shake(b); say(msg, 'bad', 'Belum tepat. Lihat lagi keluaran sebelum dan sesudah diobati.'); return; }
      extra.dataset.beres = '1'; b.classList.add('on'); ctx.sound.good(); say(msg, '', ks[2][0]); done();
    }))));
  });
  function tap(i) {
    if (step === 'lokasi') {
      const want = p.tunjuk[got.length];
      if (i !== want) { oops(); say(msg, 'bad', got.length === 0 && p.tunjuk.length > 1 ? `Baris ${i + 1} bukan. Baca baris "File …, line …" yang paling atas.` : `Baris ${i + 1} bukan. Cari "line …" pada baris File berikutnya.`); return; }
      got.push(i); ctx.sound.tap();
      if (got.length < p.tunjuk.length) { draw(); say(msg, 'info', 'Tepat. Sekarang baris File berikutnya.'); return; }
      if (rapor) {
        step = 'nilai'; draw(); say(msg, 'info', 'Python berhenti di baris 4, di dalam cetak, yang dipanggil baris 7. Isi nilai variabel saat galat terjadi.');
        fill(extra, fillBoard(ctx, { oops, msg, view: rowsView([['nama = ', '_'], ['nilai = ', '_']]), chips: ['"Ayu"', '85', '"85"', '"Bima"', '78'], want: ['"Ayu"', '85'],
          hints: ['Galat terjadi pada putaran pertama for: kunci pertama dictionary.', 'Nilai Ayu adalah bilangan bulat, tanpa tanda petik.'],
          done: () => { fill(extra); step = 'resep'; draw(); say(msg, 'info', 'nilai adalah int, sedangkan nama + ": " adalah teks. Seret resep untuk baris 4.'); chips(ctx.rand.shuffle(resepOf(p).map((t, j) => [`r${j}`, t]))); } }));
        return;
      }
      step = 'sebab'; draw(); say(msg, 'info', `Python berhenti di baris ${p.tunjuk.map((x) => x + 1).join(' lalu ')}. Sekarang telusuri ke atas: ketuk baris penyebab, yaitu baris yang harus diobati.`);
      return;
    }
    if (!p.sebab.includes(i)) { oops(); say(msg, 'bad', p.tunjuk.includes(i) ? `Baris ${i + 1} adalah tempat Python berhenti. Dari mana nilai yang salah berasal?` : `Baris ${i + 1} bukan penyebabnya. Telusuri nilai yang dipakai di baris yang ditunjuk.`); return; }
    cause.push(...p.sebab); ctx.sound.good(); step = 'resep'; draw();
    say(msg, 'info', `Penyebabnya baris ${p.sebab.map((x) => x + 1).join('–')}. Seret kartu resep yang menyembuhkan.`);
    chips(ctx.rand.shuffle(resepOf(p).map((t, j) => [`r${j}`, t])));
  }
  chips(jenisChips(ctx, p.jenis).map((j) => [j, j]));
  draw();
  area.append(el('div', { class: 'ug42-dua' }, bed, el('div', { class: 'ug42-kolom' }, scr, host, extra)), msg);
}

// Misi 4: three questions, tap every patient that fits.
export const RAPAT = [['Ketahuan sebelum satu baris pun berjalan', ['p6'], 'Program 6 tidak mencetak apa pun, bahkan baris 2: Python memeriksa tata tulis seluruh berkas dulu.'],
  ['Hanya sakit untuk data tertentu', ['p2', 'p4', 'p5'], 'Program 2, 4, 5 sehat untuk data lain: "nasi goreng", kelas yang punya nilai, nilai 80.'],
  ['Baris yang ditunjuk berbeda dengan baris yang diobati', ['p1', 'p2', 'p3', 'p4', 'p5'], 'Lima dari enam! Baris yang ditunjuk adalah tempat Python berhenti; penyebabnya sering di atasnya.']];
function rapatRound(area, ctx, { oops, done }) {
  const msg = msg42('Ketuk setiap pasien yang cocok dengan pertanyaan rapat.'); let q = 0; const on = new Set(); const box = el('div', { class: 'ug42-kolom' });
  const draw = () => fill(box, el('div', { class: 'ug42-soal' }, `Rapat ${q + 1} dari 3: ${RAPAT[q][0]}`), el('div', { class: 'ug42-pasien-pasien', 'data-papan': String(q) }, PROG.slice(1).map((p, n) => onTap(el('button', { type: 'button', class: `ug42-pk ${on.has(p.id) ? 'on' : ''}`, 'data-k': p.id },
    el('b', null, `🛏️ Pasien ${n + 1}`), el('span', null, p.judul.replace(/^Program \d: /, '')), el('code', null, p.jenis), el('small', null, `ditunjuk ${p.tunjuk.map((x) => x + 1).join(', ')} · penyebab ${p.sebab.map((x) => x + 1).join('–')}`)), () => tap(p.id)))));
  function tap(id) {
    if (q >= RAPAT.length || on.has(id)) return; const want = RAPAT[q][1];
    if (!want.includes(id)) { oops(); say(msg, 'bad', 'Pasien ini tidak cocok. Ingat lagi gejala dan penyebabnya.'); return; }
    on.add(id); ctx.sound.tap();
    if (on.size < want.length) { draw(); say(msg, 'info', 'Tepat. Masih ada?'); return; }
    const fact = RAPAT[q][2];
    if (q + 1 < RAPAT.length) { q++; on.clear(); draw(); say(msg, 'info', fact); return; }
    draw(); q++; say(msg, '', `${fact} Pelajarannya: telusuri ke atas mencari asal nilai yang salah.`); done();
  }
  draw();
  area.append(box, msg);
}

// Misi 5: a patient with no error message. Checkpoints narrow the suspects.
const PAGES42 = [[0, 8], [9, 16]];
function sunyiRound(area, ctx, { oops, done }) {
  const msg = msg42('Ketuk baris untuk memasang titik periksa, lalu pilih variabel yang diperiksa. Paling banyak 3 titik.'); const L = IURAN();
  let page = 0; let sel = null; let cps = []; let sus = Array.from({ length: 16 }, (_, i) => i);
  const left = el('div', { class: 'ug42-kolom' }); const log = el('div', { class: 'ug42-log' }); const pick = el('div', { class: 'ug42-kolom' }); const right = el('div', { class: 'ug42-kolom' }, el('small', null, '📍 Titik periksa · program | bendahara'), log, pick);
  const disp = () => { const [a, b] = PAGES42[page]; const out = []; for (let i = a; i <= b; i++) { if (i === 9) out.push([9, 'total = (biaya_bus + tiket_murid', '10'], [9, '         + tiket_guru + konsumsi)', '']); else out.push([i, L[i], String(i + 1)]); } return out; };
  const draw = () => {
    const D = disp(); const cv = codeView(D.map((d) => d[1]), { labels: D.map((d) => d[2]), cls: 'ketuk', hl: D.map((d, j) => (d[0] === sel ? j : -1)).filter((j) => j >= 0), after: (j) => (cps.some((c) => c.L === D[j][0]) && D[j][2] ? el('span', { class: 'ug42-panah biru' }, '📍') : null), onLine: (j) => tapLine(D[j][0]) });
    cv.querySelectorAll('.mk-baris').forEach((r, j) => { r.dataset.real = String(D[j][0]); if (!sus.includes(D[j][0])) r.classList.add('redup'); });
    fill(left, el('div', { class: 'ug42-pasien' }, el('b', null, '🛏️ iuran.py'), el('span', null, '(37 murid, 3 guru)')), cv,
      el('div', { class: 'ug42-tombol' }, PAGES42.map(([a, b], k) => onTap(el('button', { type: 'button', class: `ug42-hal ${k === page ? 'on' : ''}`, 'data-hal': String(k) }, `baris ${a + 1}–${b + 1}`), () => { page = k; draw(); }))));
  };
  function tapLine(i) {
    if (sus.length === 1 || i > 15) return;
    sel = i; ctx.sound.tap(); draw();
    fill(pick, el('small', null, `Periksa setelah baris ${i + 1}:`), el('div', { class: 'ug42-tombol', 'data-l': String(i) }, varsUpTo(i).slice(-5).map((v) => onTap(el('button', { type: 'button', class: 'ug42-pilih ug42-var', 'data-v': v }, v), () => check(i, v)))));
    say(msg, 'info', 'Pilih variabel yang nilainya ingin dibandingkan dengan catatan bendahara.');
  }
  function check(i, v) {
    if (sel !== i || sus.length === 1) return;
    const a = nilaiSetelah(i, v); const b = nilaiSetelah(i, v, { fixed: true }); const ok = a === b;
    cps.push({ L: i, v, ok }); sel = null; fill(pick); sus = curiga(cps);
    log.append(el('span', { class: `ug42-cp ${ok ? 'cocok' : 'beda'}` }, `setelah ${i + 1}: ${v} = ${fmtNum(a)} | ${fmtNum(b)} ${ok ? '✓' : '✗'}`)); ctx.sound.tap();
    if (sus.length === 1) { draw(); found(); return; }
    if (cps.length >= 3) { oops(); cps = []; sus = Array.from({ length: 16 }, (_, k) => k); fill(log); draw(); say(msg, 'bad', 'Tiga titik periksa habis, bug belum terkepung. Mulai lagi: periksa variabel yang bergantung pada bagian yang dicurigai.'); return; }
    draw(); say(msg, 'info', ok ? `Cocok: baris yang menentukan ${v} sehat. Tersangka tinggal ${sus.length} baris.` : `Beda! Bug ada di baris yang menentukan ${v}. Tersangka tinggal ${sus.length} baris.`);
  }
  function found() {
    say(msg, 'info', `Bug terkepung dengan ${cps.length} titik periksa: baris 5. orang // 40 + 1 selalu menambah satu bus. Tulis resepnya.`);
    fill(pick, fillBoard(ctx, { oops, msg, view: codeFill([['bus = (orang + ', '_', ') // 40']], { labels: ['5'] }), chips: ['39', '40', '1', '0'], want: ['39'], hints: ['Pembulatan ke atas: tambahkan 39 sebelum dibagi 40, jadi 40 orang tetap 1 bus dan 41 orang menjadi 2.'],
      done: () => { const R = runPy(IURAN(37, true), { limit: 2000 }); say(msg, 'info', `${R.out[0]}. Sama dengan bendahara! Mengapa tahun lalu tidak ketahuan?`);
        fill(pick, el('pre', { class: 'mk-layar' }, R.out[0]), fillBoard(ctx, { oops, msg, view: rowsView([['40 orang: 40 // 40 + 1 = ', '_', ' bus'], ['35 orang: 35 // 40 + 1 = ', '_', ' bus']]), chips: ['2', '1', '0'], want: ['2', '1'], hints: ['40 // 40 = 1, ditambah 1.', '35 // 40 = 0, ditambah 1: kebetulan benar.'],
          done: () => { say(msg, '', 'Bug hanya muncul untuk 40, 80, 120 orang. Membagi dua: 4 titik periksa cukup untuk 16 baris, sekitar 10 untuk 1.000 baris.'); done(); } })); } }));
  }
  draw();
  area.append(el('div', { class: 'ug42-dua' }, left, right), msg);
}

// Misi Bos: keep asking until the clerk types a whole number.
const BANDEL_KODE = ['stok = 40', 'while True:', '    try:', '        masuk = int(input("Barang masuk: "))', '        break', '    except ValueError:', '        print("Ketik angka bulat!")', 'print("Stok sekarang:", stok + masuk)'];
export const BANDEL = ['stok = 40', 'while True:', ['try', 1], ['masuk', 2], ['break', 2], ['exc', 1], ['cetak', 2], 'print("Stok sekarang:", stok + masuk)'];
function bosRound(area, ctx, { oops, done }) {
  const msg = msg42('Program 3 sudah memakai int(input(...)). Petugas mengetik "dua belas". Seret gejalanya.');
  const left = el('div', { class: 'ug42-kolom' }); const scr = layar(); const jSlot = slot42('jenis'); const tray = el('div', { class: 'ug42-baki' }, jenisChips(ctx, 'ValueError').map((j) => el('div', { class: 'ug42-kartu', 'data-drag': j }, j)));
  fill(left, el('div', { class: 'ug42-pasien' }, el('b', null, '🛏️ program3.py'), el('span', null, '(sudah diobati)')), codeView(PROG[3].fix));
  scr.textContent = 'Barang masuk: dua belas';
  const host = el('div', { class: 'ug42-kolom' }, el('div', { class: 'ug42-papan' }, el('span', null, '🤒 Gejala'), jSlot), tray);
  dnd(host, (card, s) => {
    if (s.dataset.drop !== 'jenis' || s.classList.contains('isi')) return;
    if (card.dataset.drag !== 'ValueError') { oops(); shake(card); say(msg, 'bad', 'Jenis datanya sudah benar (teks ke int), tetapi isi teksnya bukan angka.'); return; }
    fill(jSlot, 'ValueError'); jSlot.classList.add('isi'); tray.remove(); ctx.sound.good();
    scr.append(el('b', { class: 'mk-galat' }, "\nValueError: invalid literal for int() with base 10: 'dua belas'"));
    say(msg, 'info', 'Rakit program yang meminta ulang: while True, try, break, dan except ValueError.');
    fill(left, tileSlots(ctx, { oops, msg, build: BANDEL, tiles: [['try', 'try:'], ['masuk', 'masuk = int(input("Barang masuk: "))'], ['break', 'break'], ['exc', 'except ValueError:'], ['cetak', 'print("Ketik angka bulat!")'],
      ['semua', 'except:', 'except tanpa nama galat menangkap semua galat, termasuk salah ketik, sehingga bug lain tersembunyi.'], ['lanjut', 'continue', 'continue mengulang dari atas; di sini kita perlu keluar dari perulangan.']],
      onFull: () => { say(msg, 'info', 'Petugas mengetik "dua belas", "12,5", lalu "12"…');
        const R = runPy(BANDEL_KODE, { limit: 5000, input: ['dua belas', '12,5', '12'] });
        play(scr, ['dua belas', '12,5', '12'].flatMap((x, i) => [`Barang masuk: ${x}`, R.out[i]]), { gap: 420, end: () => { say(msg, '', 'Pasien bandel sembuh: dua kali diminta ulang, lalu Stok sekarang: 52. Tangkap hanya galat yang kamu duga (ValueError).'); done(); } }); } }));
  });
  area.append(el('div', { class: 'ug42-dua' }, left, el('div', { class: 'ug42-kolom' }, scr, host)), msg);
}

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
    const wrap = el('div', { class: 'act ug42-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'ug42-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD42[k];
        foe = el('div', { class: 'ug42-musuh' }, el('b', null, '🚑 Gelombang Pasien'), el('span', null, ulah));
        wrap.append(el('div', { class: 'ug42-kepala' }, misiHead(no, judul, tujuan, '🩺'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Pasien sembuh ✓'; next(ms); } });
      if (r === 0) { go('rapor', 1); patientRound(area, ctx, fin(5500), PROG[0], { rapor: true }); }
      else if (r <= 6) { go(PROG[r].id, r <= 3 ? 2 : 3); patientRound(area, ctx, fin(6000), PROG[r]); }
      else if (r === 7) { go('rapat', 4); rapatRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('sunyi', 5); sunyiRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

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
