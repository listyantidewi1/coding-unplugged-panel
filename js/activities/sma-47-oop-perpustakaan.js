// Merancang Kelas Perpustakaan — SMA/SMK (16–18 tahun), coding. Designing
// classes from the library rules: nouns and verbs, a class diagram with
// "adalah" (inheritance) and "punya" (composition), the Python skeleton with
// encapsulated stock, polymorphism in batas_buku(), and the loan scenario of
// soal 5. Every result comes from running the worksheet classes in mini-py.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper } from './smp-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const KOSONG = ["class Buku:", "    def __init__(self, kode, judul, jumlah):", "        self.kode = kode", "        self.judul = judul", "        self._jumlah = jumlah", "        self._tersedia = jumlah", "    def tersedia(self):", "        return self._tersedia", "    def boleh_dipinjam(self):", "        return True", "    def keluar(self):", "        if ..............................:", "            return False", "        self._tersedia = self._tersedia - 1", "        return True", "    def masuk(self):", "        if self._tersedia < self._jumlah:", "            self._tersedia = self._tersedia + 1", "class BukuReferensi(Buku):", "    def boleh_dipinjam(self):", "        return False", "class Anggota:", "    def __init__(self, nama):", "        self.nama = nama", "        self.pinjaman = []", "    def batas_buku(self):", "        return 3", "    def lama_pinjam(self):", "        return 7", "    def denda_per_hari(self):", "        return 500", "class Murid(Anggota):", "    pass", "class Guru(Anggota):", "    def batas_buku(self):", "        return ......", "    def lama_pinjam(self):", "        return ......", "    def denda_per_hari(self):", "        return ......", "class Peminjaman:", "    def __init__(self, buku, anggota, hari_pinjam):", "        self.buku = buku", "        self.anggota = anggota", "        self.batas_kembali = hari_pinjam + ..............................", "    def denda(self, hari_kembali):", "        terlambat = hari_kembali - self.batas_kembali", "        if terlambat <= 0:", "            return 0", "        return terlambat * ..............................", "class Perpustakaan:", "    def __init__(self):", "        self.koleksi = {}", "    def tambah(self, buku):", "        self.koleksi[buku.kode] = buku", "    def pinjam(self, kode, anggota, hari):", "        b = self.koleksi[kode]", "        if not b.boleh_dipinjam():", "            return \"Hanya dibaca di tempat\"", "        if len(anggota.pinjaman) >= ..............................:", "            return \"Batas pinjam tercapai\"", "        if not b.keluar():", "            return \"Stok habis\"", "        p = Peminjaman(b, anggota, hari)", "        anggota.pinjaman.append(p)", "        return \"Kembali paling lambat hari ke-\" + str(p.batas_kembali)", "    def kembalikan(self, kode, anggota, hari):", "        for p in anggota.pinjaman:", "            if p.buku.kode == kode:", "                anggota.pinjaman.remove(p)", "                p.buku.masuk()", "                return p.denda(hari)", "        return None"];
// The filled-in key of soal 2a, by worksheet line number.
export const ISIAN = { 12: ['self._tersedia == 0', 'if ', ':'], 36: ['5', 'return ', ''], 38: ['14', 'return ', ''], 40: ['0', 'return ', ''], 45: ['anggota.lama_pinjam()', 'self.batas_kembali = hari_pinjam + ', ''], 50: ['self.anggota.denda_per_hari()', 'return terlambat * ', ''], 60: ['anggota.batas_buku()', 'if len(anggota.pinjaman) >= ', ':'] };
export const KELAS = KOSONG.map((x, i) => (ISIAN[i + 1] ? x.replace(/\.{6,}/, ISIAN[i + 1][0]) : x));
export const SETUP = ['perpus = Perpustakaan()', 'perpus.tambah(Buku("B01", "Sejarah Wanasari", 2))', 'perpus.tambah(Buku("B02", "Dasar Hidroponik", 1))', 'perpus.tambah(Buku("B03", "Cerita Rakyat Nusantara", 3))', 'perpus.tambah(Buku("B04", "Atlas Kabupaten Wanasari", 1))', 'perpus.tambah(BukuReferensi("R01", "Kamus Bahasa Daerah Wanasari", 1))', 'sari = Murid("Sari")', 'dodi = Murid("Dodi")', 'ratna = Guru("Bu Ratna")'];
export const SKENARIO = ['perpus.pinjam("B01", sari, 1)', 'perpus.pinjam("B01", dodi, 1)', 'perpus.pinjam("B01", ratna, 2)', 'perpus.pinjam("B02", ratna, 2)', 'perpus.pinjam("R01", sari, 3)', 'perpus.pinjam("B03", sari, 3)', 'perpus.pinjam("B04", sari, 3)', 'perpus.pinjam("B03", sari, 3)', 'perpus.kembalikan("B01", dodi, 8)', 'perpus.kembalikan("B01", sari, 10)', 'perpus.kembalikan("B02", ratna, 20)', 'perpus.kembalikan("B02", ratna, 20)'];
export const RUDI = ['b = Buku("B09", "Contoh", 2)', 'b._tersedia = b._tersedia - 1', 'b._tersedia = b._tersedia - 1', 'b._tersedia = b._tersedia - 1', 'print(b._tersedia)'];
export const STAF = ['class Staf(Anggota):', '    def batas_buku(self):', '        return 4', '    def lama_pinjam(self):', '        return 10'];
export const KODE_BUKU = ['B01', 'B02', 'B03', 'B04', 'R01'];
export const ANGGOTA = [['sari', 'Sari'], ['dodi', 'Dodi'], ['ratna', 'Bu Ratna']];

// New rules of soal 6 as patches to the worksheet classes.
export const ATURAN = [
  { id: 'panjang', label: 'Perpanjang sekali, 7 hari', desc: 'peminjaman boleh diperpanjang satu kali selama 7 hari bila belum terlambat' },
  { id: 'baru', label: 'Buku baru 3 hari', desc: 'buku baru (B02 Dasar Hidroponik) hanya boleh dipinjam 3 hari' },
  { id: 'maks', label: 'Denda maks Rp10.000', desc: 'denda paling banyak Rp10.000 per buku' },
];
export function program(aturan = []) {
  const on = (a) => aturan.includes(a); const out = [];
  KELAS.forEach((x, i) => {
    const n = i + 1;
    if (n === 45 && on('baru')) out.push('        lama = anggota.lama_pinjam()', '        if isinstance(buku, BukuBaru):', '            lama = min(lama, 3)', '        self.batas_kembali = hari_pinjam + lama');
    else if (n === 50 && on('maks')) out.push('        return min(terlambat * self.anggota.denda_per_hari(), 10000)');
    else out.push(x);
    if (n === 21 && on('baru')) out.push('class BukuBaru(Buku):', '    pass');
    if (n === 45 && on('panjang')) out.push('        self.diperpanjang = False');
  });
  if (on('panjang')) out.push('    def perpanjang(self, kode, anggota, hari):', '        for p in anggota.pinjaman:', '            if p.buku.kode == kode:', '                if p.diperpanjang or hari > p.batas_kembali:', '                    return "Tidak bisa diperpanjang"', '                p.batas_kembali = p.batas_kembali + 7', '                p.diperpanjang = True', '                return "Kembali paling lambat hari ke-" + str(p.batas_kembali)', '        return None');
  return out;
}
export const setupOf = (aturan = []) => SETUP.map((x) => (aturan.includes('baru') && x.includes('"B02"') ? x.replace('Buku(', 'BukuBaru(') : x));

// Run the classes, the setup and a list of commands; each result is kept in h0, h1, …
export function jalankan(cmds, aturan = []) {
  const R = runPy([...program(aturan), ...setupOf(aturan), ...cmds.map((c, i) => `h${i} = ${c}`)], { limit: 200000 });
  const v = R.vars; const hasil = cmds.map((_, i) => (`h${i}` in v ? pyRepr(v[`h${i}`]) : null));
  const buku = v.perpus ? [...v.perpus.attrs.koleksi.values()].map((b) => ({ kode: b.attrs.kode, judul: b.attrs.judul, kelas: b.cls.name, ada: b.attrs._tersedia, jumlah: b.attrs._jumlah })) : [];
  const anggota = ANGGOTA.filter(([k]) => v[k]).map(([k]) => { const a = v[k]; return { k, nama: a.attrs.nama, kelas: a.cls.name, pinjaman: a.attrs.pinjaman.map((p) => ({ kode: p.attrs.buku.attrs.kode, batas: p.attrs.batas_kembali, panjang: p.attrs.diperpanjang })) }; });
  return { hasil, buku, anggota, error: R.error ? `${R.error.type}: ${R.error.message}` : null, out: R.out };
}
// Which class supplies a method for an object of class `nama` (the lookup polymorphism uses).
export function pemilik(nama, metode, aturan = []) {
  const R = runPy([...program(aturan)], { limit: 20000 }); let c = R.vars[nama];
  while (c) { if (c.methods[metode]) return c.name; c = c.base; }
  return null;
}
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));
const hasilText = (h) => (h == null ? '-' : /^\d+$|^None$/.test(h) ? h : `"${h}"`);
const opsi = (right, pool) => [right, ...[...new Set(pool)].filter((x) => x !== right)].slice(0, 4);
const HASIL_PINJAM = ['"Stok habis"', '"Batas pinjam tercapai"', '"Hanya dibaca di tempat"', '"Kembali paling lambat hari ke-8"', '"Kembali paling lambat hari ke-10"', '"Kembali paling lambat hari ke-16"', '"Kembali paling lambat hari ke-15"'];
const HASIL_KEMBALI = ['0', '500', '1000', '2000', 'None'];
const poolFor = (cmd, i) => { const p = cmd.includes('.pinjam(') ? HASIL_PINJAM : HASIL_KEMBALI; return [...p.slice(i % p.length), ...p.slice(0, i % p.length)]; };

// Object cards: books with their stock, members with their loans.
export function kartu(S, { sorot = null, judul = true } = {}) {
  return el('div', { class: 'op-kartu-wrap' },
    el('div', { class: 'op-kolom' }, judul ? el('small', null, 'perpus.koleksi') : null, S.buku.map((b) => el('div', { class: `op-kartu buku ${b.ada === 0 ? 'habis' : ''} ${sorot === b.kode ? 'sorot' : ''}` }, el('b', null, `${b.kode} · ${b.kelas}`), el('span', null, b.judul), el('code', null, `_tersedia ${b.ada} dari ${b.jumlah}`)))),
    el('div', { class: 'op-kolom' }, judul ? el('small', null, 'anggota') : null, S.anggota.map((a) => el('div', { class: `op-kartu anggota ${sorot === a.k ? 'sorot' : ''}` }, el('b', null, `${a.nama} · ${a.kelas}`), el('code', null, `pinjaman: ${a.pinjaman.length ? a.pinjaman.map((p) => `${p.kode} (hari ke-${p.batas}${p.panjang ? ', diperpanjang' : ''})`).join(', ') : '[]'}`)))));
}

export default {
  id: 'sma-47-oop-perpustakaan',
  title: 'Merancang Kelas Perpustakaan',
  topic: 'Pemrograman berorientasi objek: merancang kelas dari aturan, diagram kelas, pewarisan dan komposisi, enkapsulasi stok, polimorfisme, dan pengujian dengan skenario',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📚',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Rancang kelas perpustakaan sekolah dari aturannya, lengkapi kerangka kelas Python, lindungi stok buku, bedakan "adalah" dan "punya", lalu uji rancangan dengan skenario peminjaman dan denda.',
  extraModes: [
    { id: 'diagram', icon: '🧩', label: 'Penyusun Diagram Kelas', desc: 'Isi atribut dan metode setiap kelas, lalu hubungkan kelas dengan panah "adalah" atau "punya"', create: createDiagram },
    { id: 'simulasi', icon: '🗂️', label: 'Simulasi Objek', desc: 'Jalankan pinjam dan kembalikan, lihat kartu objek berubah, dan lihat kelas mana yang menjawab batas_buku()', create: createSim },
    { id: 'giliran', icon: '🎯', label: 'Tim Merancang, Tim Menguji', desc: 'Satu tim menyalakan aturan baru, tim lain menyusun tiga perintah dan meramal hasilnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act oop-perpus' });
    root.append(wrap);
    const S = jalankan(SKENARIO); const H = S.hasil.map(hasilText);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const aturanBox = () => el('ul', { class: 'op-aturan' }, ['Setiap judul buku punya kode dan satu atau beberapa eksemplar. Buku referensi hanya boleh dibaca di tempat.', 'Murid boleh meminjam paling banyak 3 buku selama 7 hari. Keterlambatan didenda Rp500 per buku per hari.', 'Guru boleh meminjam paling banyak 5 buku selama 14 hari dan tidak didenda.', 'Buku tidak bisa dipinjam bila semua eksemplarnya sedang dipinjam.'].map((t) => el('li', null, t)));
      if (r === 0) {
        wrap.append(aturanBox());
        rowsChoose(wrap, ctx, { prompt: 'Kata benda menjadi calon kelas atau atribut, kata kerja menjadi calon metode', cls: 'op-isi', rows: [['buku', 'benda'], ['meminjam', 'kerja'], ['anggota', 'benda'], ['mengembalikan', 'kerja'], ['peminjaman', 'benda'], ['mendenda', 'kerja'], ['guru', 'benda'], ['dibaca di tempat', 'kerja']].map(([w, a]) => [w, w, ['kata benda', 'kata kerja'], `kata ${a}`]), done: next });
      }
      else if (r === 1) {
        wrap.append(el('p', { class: 'op-ket' }, 'Diagram kelas: lengkapi kolom yang kosong'));
        rowsChoose(wrap, ctx, { prompt: 'Diagram kelas', cls: 'op-isi', rows: [
          ['b', 'Buku · atribut selain kode, judul', ['_jumlah, _tersedia', 'peminjam, batas_kembali', 'nama, pinjaman', 'koleksi'], '_jumlah, _tersedia'],
          ['r', 'BukuReferensi · metode dan hubungan', ['boleh_dipinjam() yang ditimpa · adalah Buku', 'keluar() · punya Buku', 'denda() · adalah Buku', 'tidak ada · punya Buku'], 'boleh_dipinjam() yang ditimpa · adalah Buku'],
          ['a', 'Anggota · atribut selain nama', ['pinjaman (list Peminjaman)', '_tersedia', 'koleksi', 'batas_kembali'], 'pinjaman (list Peminjaman)'],
          ['g', 'Guru · metode dan hubungan', ['batas_buku(), lama_pinjam(), denda_per_hari() yang ditimpa · adalah Anggota', 'pinjam(), kembalikan() · punya Anggota', 'aturan umum · adalah Murid', 'denda() · punya Peminjaman'], 'batas_buku(), lama_pinjam(), denda_per_hari() yang ditimpa · adalah Anggota'],
          ['p', 'Peminjaman · atribut dan hubungan', ['buku, anggota, batas_kembali · punya satu Buku dan satu Anggota', 'kode, judul, _tersedia · adalah Buku', 'nama, pinjaman · adalah Anggota', 'koleksi · punya banyak Buku'], 'buku, anggota, batas_kembali · punya satu Buku dan satu Anggota'],
          ['k', 'Perpustakaan · metode dan hubungan', ['tambah(), pinjam(), kembalikan() · punya banyak Buku', 'denda() · adalah Buku', 'keluar(), masuk() · punya satu Buku', 'batas_buku() · adalah Anggota'], 'tambah(), pinjam(), kembalikan() · punya banyak Buku']], done: next });
      }
      else if (r === 2) {
        const blanks = Object.keys(ISIAN).map(Number);
        wrap.append(pyCode(KOSONG, { labels: lab(1, 73), cls: 'op-kecil op-kolom3', warn: blanks.map((n) => n - 1) }));
        const alt = { 12: ['self._tersedia < 0', 'self._jumlah == 0', 'self._tersedia == self._jumlah'], 36: ['3', '14', '0'], 38: ['7', '5', '0'], 40: ['500', '5', '14'], 45: ['7', 'anggota.batas_buku()', 'self.lama_pinjam()'], 50: ['500', 'self.denda_per_hari()', 'anggota.denda_per_hari()'], 60: ['3', 'anggota.lama_pinjam()', 'len(self.koleksi)'] };
        rowsChoose(wrap, ctx, { prompt: 'Lengkapi baris yang kosong', cls: 'op-isi', rows: blanks.map((n) => [`l${n}`, `Baris ${n}`, opsi(ISIAN[n][0], alt[n]), ISIAN[n][0]]), done: next });
      }
      else if (r === 3) {
        const pS = pemilik('Murid', 'batas_buku'); const pG = pemilik('Guru', 'batas_buku'); const T = runPy([...KELAS, 'a = Murid("Sari").batas_buku()', 'b = Guru("Bu Ratna").batas_buku()']).vars;
        wrap.append(el('div', { class: 'op-dua' }, pyCode(KELAS.slice(21, 40), { labels: lab(22, 19), cls: 'op-kecil', hl: [4, 10, 11, 13] }), el('div', { class: 'op-cari' }, el('code', null, 'anggota.batas_buku()'), el('div', null, el('b', null, 'sari'), ' → Murid → ', el('span', { class: 'op-pakai' }, `${pS}.batas_buku()`), ` → ${T.a}`), el('div', null, el('b', null, 'ratna'), ' → ', el('span', { class: 'op-pakai' }, `${pG}.batas_buku()`), ` → ${T.b}`))));
        rowsChoose(wrap, ctx, { prompt: 'Pewarisan dan polimorfisme', cls: 'op-isi', rows: [
          ['m', 'Murid hanya berisi pass. Dari mana batas_buku()?', ['diwarisi dari kelas induknya, Anggota', 'dari kelas Guru', 'dari Perpustakaan', 'Murid tidak punya batas_buku()'], 'diwarisi dari kelas induknya, Anggota'],
          ['s', 'sari.batas_buku() · ratna.batas_buku()', [`${T.a} · ${T.b}`, `${T.b} · ${T.a}`, '3 · 3', '5 · 5'], `${T.a} · ${T.b}`],
          ['c', 'Cara Python memilih', ['mencari metode di kelas objek itu dulu, lalu di kelas induknya', 'memeriksa nama anggota', 'memakai metode yang ditulis paling akhir', 'memeriksa if murid atau guru di baris 60'], 'mencari metode di kelas objek itu dulu, lalu di kelas induknya'],
          ['k', 'Nama konsep: satu pemanggilan, perilaku berbeda menurut jenis objek', ['polimorfisme', 'enkapsulasi', 'komposisi', 'rekursi'], 'polimorfisme']], done: next });
      }
      else if (r === 4) {
        const R1 = runPy([...KELAS, ...RUDI]).out[0]; const T = runPy([...KELAS, 'b = Buku("B09", "Contoh", 2)', 'x = b.keluar()', 'y = b.keluar()', 'z = b.keluar()', 's = b.tersedia()', 'b.masuk()', 'b.masuk()', 'b.masuk()', 't = b.tersedia()']).vars;
        const tiga = `${pyRepr(T.x)}, ${pyRepr(T.y)}, ${pyRepr(T.z)} · stok ${T.s}`;
        wrap.append(el('div', { class: 'op-dua' }, pyCode(RUDI, { labels: ['R1', 'R2', 'R3', 'R4', 'R5'], cls: 'op-kecil', warn: [1, 2, 3] }), pyCode(KELAS.slice(10, 18), { labels: lab(11, 8), cls: 'op-kecil' })));
        rowsChoose(wrap, ctx, { prompt: 'Melindungi stok', cls: 'op-isi', rows: [
          ['r', 'Keluaran R5', [R1, '0', '2', 'ValueError'], R1],
          ['k', 'Tiga kali b.keluar()', [tiga, 'True, True, True · stok -1', 'True, False, False · stok 1', 'False, False, False · stok 2'], tiga],
          ['m', `masuk() dipanggil berkali-kali: stok ${T.t}`, ['masuk() hanya menambah bila _tersedia < _jumlah', 'Python membatasi angka otomatis', 'masuk() mengurangi stok', 'karena _jumlah selalu 0'], 'masuk() hanya menambah bila _tersedia < _jumlah'],
          ['g', 'Arti garis bawah di _tersedia', ['kesepakatan "urusan dalam kelas"; Python tidak benar-benar melarang', 'Python melarang perubahan dari luar kelas', 'atributnya hanya bisa dibaca', 'atributnya otomatis disalin'], 'kesepakatan "urusan dalam kelas"; Python tidak benar-benar melarang']], done: next });
      }
      else if (r === 5) {
        rowsChoose(wrap, ctx, { prompt: 'Pewarisan ("adalah") atau komposisi ("punya")?', cls: 'op-isi', rows: [['Guru dan Anggota', 'adalah'], ['Peminjaman dan Buku', 'punya'], ['BukuReferensi dan Buku', 'adalah'], ['Perpustakaan dan Buku', 'punya'], ['Anggota dan Peminjaman', 'punya']].map(([p, a], i) => [`h${i}`, p, ['adalah (pewarisan)', 'punya (komposisi)'], a === 'adalah' ? 'adalah (pewarisan)' : 'punya (komposisi)']), done: next });
      }
      else if (r === 6) {
        const joko = runPy([...KELAS, ...STAF, 'perpus = Perpustakaan()', 'perpus.tambah(Buku("B03", "Cerita Rakyat Nusantara", 3))', 'x = perpus.pinjam("B03", Staf("Pak Joko"), 5)']).vars.x;
        wrap.append(el('div', { class: 'op-dua' }, pyCode(['class Peminjaman(Buku, Anggota):'], { cls: 'op-kecil', warn: [0] }), pyCode(STAF, { cls: 'op-kecil' })));
        rowsChoose(wrap, ctx, { prompt: 'Usul Dodi dan kelas Staf TU', cls: 'op-isi', rows: [
          ['a', 'Alasan usul Dodi buruk', ['"peminjaman adalah buku" janggal, dan data buku tersalin di banyak peminjaman sehingga stok bisa tidak cocok', 'Python tidak mengizinkan dua kelas induk', 'programnya menjadi lebih pendek', 'Peminjaman tidak bisa punya metode'], '"peminjaman adalah buku" janggal, dan data buku tersalin di banyak peminjaman sehingga stok bisa tidak cocok'],
          ['d', 'Mengapa Staf tidak menulis denda_per_hari()?', ['Rp500 sudah diwarisi dari Anggota', 'staf tidak didenda', 'karena ditulis di Perpustakaan', 'agar dendanya 0'], 'Rp500 sudah diwarisi dari Anggota'],
          ['u', 'Kelas yang perlu diubah', ['tidak ada; cukup menambah kelas Staf', 'Perpustakaan', 'Anggota dan Murid', 'Peminjaman'], 'tidak ada; cukup menambah kelas Staf'],
          ['j', 'perpus.pinjam("B03", Staf("Pak Joko"), 5)', opsi(hasilText(joko), ['"Kembali paling lambat hari ke-12"', '"Kembali paling lambat hari ke-10"', '"Batas pinjam tercapai"']), hasilText(joko)]], done: next });
      }
      else if (r === 7 || r === 8) {
        const from = r === 7 ? 0 : 6; const sebelum = jalankan(SKENARIO.slice(0, from));
        wrap.append(el('div', { class: 'op-dua' }, pyCode(SETUP, { labels: lab(74, 9), cls: 'op-kecil' }), kartu(sebelum)));
        rowsChoose(wrap, ctx, { prompt: r === 7 ? 'Skenario: perintah 1–6' : 'Skenario: perintah 7–12 (kartu menunjukkan keadaan setelah perintah 6)', cls: 'op-isi op-mono', rows: SKENARIO.slice(from, from + 6).map((c, i) => [`c${from + i}`, `${from + i + 1}. ${c}`, opsi(H[from + i], poolFor(c, i)), H[from + i]]), done: next });
      }
      else {
        const T = jalankan([...SKENARIO, 'perpus.kembalikan("B03", sari, 10)', 'perpus.kembalikan("B04", sari, 11)']);
        const stok = Object.fromEntries(S.buku.map((b) => [b.kode, String(b.ada)])); const sari = S.anggota.find((a) => a.k === 'sari');
        const pinj = sari.pinjaman.map((p) => p.kode).join(' dan ') + ` · hari ke-${sari.pinjaman[0].batas}`;
        wrap.append(kartu(S));
        rowsChoose(wrap, ctx, { prompt: 'Setelah perintah 12, lalu nilai batas', cls: 'op-isi', rows: [
          ...KODE_BUKU.map((k) => [`s${k}`, `Stok tersedia ${k}`, ['0', '1', '2', '3'], stok[k]]),
          ['p', 'Buku yang masih dipinjam Sari', [pinj, 'B01 dan B03 · hari ke-8', 'B03 dan B04 · hari ke-13', 'B04 saja · hari ke-10'], pinj],
          ['t', 'kembalikan("B03", sari, 10) · kembalikan("B04", sari, 11)', [`${T.hasil[12]} · ${T.hasil[13]}`, '500 · 1000', '0 · 0', '500 · 500'], `${T.hasil[12]} · ${T.hasil[13]}`]], done: next });
      }
    }
    render();
  },
};

// Class diagram builder: members into boxes, then "adalah"/"punya" arrows.
export const KOTAK = ['Buku', 'BukuReferensi', 'Anggota', 'Murid', 'Guru', 'Peminjaman', 'Perpustakaan'];
const KPOS = { Buku: [16, 22], BukuReferensi: [16, 72], Perpustakaan: [50, 22], Peminjaman: [50, 72], Anggota: [84, 22], Murid: [70, 78], Guru: [89, 78] };
export const ANGGOTA_KELAS = { Buku: ['kode', 'judul', '_jumlah', '_tersedia', 'tersedia()', 'boleh_dipinjam()', 'keluar()', 'masuk()'], BukuReferensi: ['boleh_dipinjam()'], Anggota: ['nama', 'pinjaman', 'batas_buku()', 'lama_pinjam()', 'denda_per_hari()'], Murid: [], Guru: ['batas_buku()', 'lama_pinjam()', 'denda_per_hari()'], Peminjaman: ['buku', 'anggota', 'batas_kembali', 'denda()'], Perpustakaan: ['koleksi', 'tambah()', 'pinjam()', 'kembalikan()'] };
export const HUBUNGAN = [['BukuReferensi', 'Buku', 'adalah'], ['Murid', 'Anggota', 'adalah'], ['Guru', 'Anggota', 'adalah'], ['Peminjaman', 'Buku', 'punya'], ['Peminjaman', 'Anggota', 'punya'], ['Anggota', 'Peminjaman', 'punya'], ['Perpustakaan', 'Buku', 'punya']];
export const cekPanah = (a, b, jenis) => { const k = HUBUNGAN.find(([x, y]) => x === a && y === b); if (k && k[2] === jenis) return { ok: true }; if (jenis === 'adalah') return { ok: false, msg: `Kalimat "${a} adalah ${b}" janggal.${k ? ` Yang tepat: ${a} punya ${b}.` : ''}` }; return { ok: false, msg: k ? `${a} adalah ${b}: pakai pewarisan, bukan komposisi.` : `${a} tidak menyimpan objek ${b} sebagai atribut.` }; };
function createDiagram(root, ctx) {
  const wrap = el('div', { class: 'act oop-perpus' });
  root.append(wrap);
  const isi = Object.fromEntries(KOTAK.map((k) => [k, ['Buku', 'Anggota', 'Perpustakaan'].includes(k) ? [ANGGOTA_KELAS[k][0]] : []]));
  const BANK = [...new Set(Object.values(ANGGOTA_KELAS).flat())];
  let pilih = 'Buku'; let mode = 'isi'; let dari = null; let jenis = 'adalah'; let panah = []; let msg = 'Ketuk kelas, lalu ketuk atribut atau metodenya.'; let bad = false;
  const draw = () => {
    const svg = el('div', { class: 'op-garis' });
    svg.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="op-seg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="none" stroke="currentColor"/></marker><marker id="op-isi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 5L5 0L10 5L5 10z" fill="currentColor"/></marker></defs>${panah.map(([a, b, j]) => { const [x1, y1] = KPOS[a]; const [x2, y2] = KPOS[b]; const ok = cekPanah(a, b, j).ok; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${j} ${ok ? '' : 'salah'}" marker-end="url(#${j === 'adalah' ? 'op-seg' : 'op-isi'})"/>`; }).join('')}</svg>`;
    const labels = panah.map(([a, b, j]) => { const [x1, y1] = KPOS[a]; const [x2, y2] = KPOS[b]; return el('span', { class: `op-label ${j} ${cekPanah(a, b, j).ok ? '' : 'salah'}`, style: { left: `${(x1 + x2) / 2}%`, top: `${(y1 + y2) / 2}%` } }, j); });
    const boxes = KOTAK.map((k) => onTap(el('button', { class: `op-kotak ${pilih === k && mode === 'isi' ? 'pilih' : ''} ${dari === k ? 'dari' : ''}`, type: 'button', style: { left: `${KPOS[k][0]}%`, top: `${KPOS[k][1]}%` } }, el('b', null, k), el('small', null, isi[k].filter((x) => !x.endsWith('()')).join(', ') || ' '), el('small', { class: 'metode' }, isi[k].filter((x) => x.endsWith('()')).join(', ') || ' ')), () => {
      if (mode === 'isi') { pilih = k; msg = `Kelas ${k}: ketuk atribut atau metode di bawah.`; bad = false; }
      else if (!dari) { dari = k; msg = `${k} ${jenis} …? Ketuk kelas tujuan.`; bad = false; }
      else if (dari !== k) { const c = cekPanah(dari, k, jenis); panah = panah.filter(([a, b]) => !(a === dari && b === k)); panah.push([dari, k, jenis]); msg = c.ok ? `${dari} ${jenis} ${k}: tepat.` : c.msg; bad = !c.ok; c.ok ? ctx.sound.good() : ctx.sound.bad(); dari = null; }
      draw(); }));
    const benar = HUBUNGAN.filter(([a, b, j]) => panah.some(([x, y, z]) => x === a && y === b && z === j)).length;
    const cocok = KOTAK.filter((k) => ANGGOTA_KELAS[k].length === isi[k].length && ANGGOTA_KELAS[k].every((x) => isi[k].includes(x))).length;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penyusun diagram kelas'),
      el('div', { class: 'op-atur' }, el('div', { class: 'seg' }, [['isi', 'Isi kelas'], ['panah', 'Tarik panah']].map(([m, t]) => onTap(el('button', { class: `seg-btn ${mode === m ? 'on' : ''}`, type: 'button' }, t), () => { mode = m; dari = null; msg = m === 'isi' ? 'Ketuk kelas, lalu ketuk atribut atau metodenya.' : 'Pilih jenis panah, ketuk kelas asal, lalu kelas tujuan.'; bad = false; draw(); }))),
        ...(mode === 'panah' ? [el('div', { class: 'seg' }, [['adalah', '▷ adalah (pewarisan)'], ['punya', '◆ punya (komposisi)']].map(([j, t]) => onTap(el('button', { class: `seg-btn ${jenis === j ? 'on' : ''}`, type: 'button' }, t), () => { jenis = j; draw(); }))), button('⌫ Hapus panah terakhir', () => { panah.pop(); draw(); })] : [])),
      el('div', { class: 'op-diagram' }, svg, ...labels, ...boxes),
      ...(mode === 'isi' ? [el('div', { class: 'seg op-bank' }, BANK.map((x) => onTap(el('button', { class: `seg-btn ${isi[pilih].includes(x) ? 'on' : ''}`, type: 'button' }, x), () => { isi[pilih] = isi[pilih].includes(x) ? isi[pilih].filter((y) => y !== x) : [...isi[pilih], x]; ctx.sound.tap(); draw(); })))] : []),
      el('p', { class: `reveal ${bad ? 'bad' : 'info'}` }, msg),
      el('p', { class: 'op-ket' }, `Hubungan kunci: ${benar} dari ${HUBUNGAN.length} · kelas yang isinya sama dengan kunci: ${cocok} dari ${KOTAK.length}`));
  };
  draw();
}

// Object simulation: build commands, run the classes, and watch the cards.
function createSim(root, ctx) {
  const wrap = el('div', { class: 'act oop-perpus' });
  root.append(wrap);
  let cmds = []; let aksi = 'pinjam'; let kode = 'B01'; let siapa = 'sari'; let hari = 1; let aturan = []; let sorot = null;
  const draw = () => {
    const S = jalankan(cmds, aturan); const last = cmds.length ? S.hasil[cmds.length - 1] : null;
    const lastCmd = cmds[cmds.length - 1] || ''; const who = ANGGOTA.find(([k]) => lastCmd.includes(`, ${k},`)); const kelasWho = who ? S.anggota.find((a) => a.k === who[0])?.kelas : null;
    const poli = lastCmd.includes('.pinjam(') && kelasWho ? `anggota.batas_buku() → ${pemilik(kelasWho, 'batas_buku', aturan)}.batas_buku() untuk objek ${kelasWho}` : lastCmd.includes('.kembalikan(') && kelasWho ? `p.denda() memanggil self.anggota.denda_per_hari() → ${pemilik(kelasWho, 'denda_per_hari', aturan)}.denda_per_hari()` : '';
    const AKSI = ['pinjam', 'kembalikan', ...(aturan.includes('panjang') ? ['perpanjang'] : [])];
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Simulasi objek perpustakaan'),
      el('div', { class: 'op-atur' }, el('div', { class: 'seg' }, AKSI.map((a) => onTap(el('button', { class: `seg-btn ${aksi === a ? 'on' : ''}`, type: 'button' }, a), () => { aksi = a; draw(); }))),
        el('div', { class: 'seg' }, KODE_BUKU.map((k) => onTap(el('button', { class: `seg-btn ${kode === k ? 'on' : ''}`, type: 'button' }, k), () => { kode = k; draw(); }))),
        el('div', { class: 'seg' }, ANGGOTA.map(([k]) => onTap(el('button', { class: `seg-btn ${siapa === k ? 'on' : ''}`, type: 'button' }, k), () => { siapa = k; draw(); }))),
        stepper(hari, (v) => { hari = v; }, { min: 1, max: 60, label: 'hari' }),
        button('▶ Jalankan', () => { cmds.push(`perpus.${aksi}("${kode}", ${siapa}, ${hari})`); sorot = kode; ctx.sound.tap(); draw(); }, 'primary')),
      el('div', { class: 'op-atur' }, button('📋 Skenario soal 5', () => { cmds = [...SKENARIO]; sorot = null; draw(); }), button('⌫ Batalkan perintah terakhir', () => { cmds.pop(); draw(); }), button('↺ Mulai lagi', () => { cmds = []; sorot = null; draw(); }),
        el('div', { class: 'seg' }, ATURAN.map((a) => onTap(el('button', { class: `seg-btn ${aturan.includes(a.id) ? 'on' : ''}`, type: 'button', title: a.desc }, a.label), () => { aturan = aturan.includes(a.id) ? aturan.filter((x) => x !== a.id) : [...aturan, a.id]; if (!aturan.includes('panjang')) { cmds = cmds.filter((c) => !c.includes('.perpanjang(')); if (aksi === 'perpanjang') aksi = 'pinjam'; } draw(); })))),
      el('div', { class: 'op-dua lebar' }, kartu(S, { sorot }), el('div', { class: 'op-samping' },
        el('pre', { class: 'op-log' }, cmds.length ? cmds.map((c, i) => `${c}\n   → ${hasilText(S.hasil[i])}`).slice(-6).join('\n') : 'Belum ada perintah.'),
        last != null ? el('p', { class: 'reveal good' }, `${lastCmd} → ${hasilText(last)}`) : null, poli ? el('p', { class: 'op-poli' }, poli) : null, S.error ? el('p', { class: 'reveal bad' }, S.error) : null,
        aturan.length ? el('p', { class: 'op-ket' }, `Aturan baru: ${aturan.map((a) => ATURAN.find((x) => x.id === a).desc).join('; ')}`) : null)));
  };
  draw();
}

// Team mode: one team switches a new rule on, the next writes three commands and predicts each result.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act oop-perpus' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tim Merancang, Tim Menguji selesai', pts, again: () => pickTeams(wrap, 'Tim Merancang, Tim Menguji', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih aturan baru untuk dinyalakan`),
        el('div', { class: 'op-pilihan' }, ATURAN.map((a) => onTap(el('button', { class: 'op-kartu-btn', type: 'button' }, el('b', null, a.label), el('small', null, a.desc)), () => uji(boss, a)))));
    }
    function uji(boss, a) {
      const who = (boss + 1) % nT; const aturan = [a.id]; const cmds = []; let aksi = 'pinjam'; let kode = 'B02'; let siapa = 'sari'; let hari = 1; let tebak = null;
      const AKSI = ['pinjam', 'kembalikan', ...(a.id === 'panjang' ? ['perpanjang'] : [])];
      const draw = () => {
        const S = jalankan(cmds.map((c) => c.cmd), aturan); const n = cmds.length;
        const body = n >= 3 ? [el('p', { class: 'reveal info' }, `Ramalan tepat: ${cmds.filter((c) => c.ok).length} dari 3.`), button('Lanjut ➜', () => { t++; step(); }, 'primary')]
          : tebak ? (() => { const cmd = `perpus.${aksi}("${kode}", ${siapa}, ${hari})`; const R = jalankan([...cmds.map((c) => c.cmd), cmd], aturan); const right = hasilText(R.hasil[n]); const pool = cmd.includes('.kembalikan(') ? HASIL_KEMBALI : [`"Kembali paling lambat hari ke-${hari + 7}"`, `"Kembali paling lambat hari ke-${hari + 3}"`, `"Kembali paling lambat hari ke-${hari + 14}"`, '"Stok habis"', '"Batas pinjam tercapai"', '"Tidak bisa diperpanjang"', '"Hanya dibaca di tempat"'];
            const opts = ctx.rand.shuffle(opsi(right, pool.filter((x) => x !== right).slice(0, 3)));
            return [el('pre', { class: 'op-log' }, cmd), el('div', { class: 'seg op-bank' }, opts.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { const ok = o === right; if (ok) { pts[who] += 1; ctx.sound.good(); } else ctx.sound.bad(); cmds.push({ cmd, ok, pick: o, right }); tebak = null; draw(); })))]; })()
            : [el('div', { class: 'op-atur' }, el('div', { class: 'seg' }, AKSI.map((x) => onTap(el('button', { class: `seg-btn ${aksi === x ? 'on' : ''}`, type: 'button' }, x), () => { aksi = x; draw(); }))), el('div', { class: 'seg' }, KODE_BUKU.map((k) => onTap(el('button', { class: `seg-btn ${kode === k ? 'on' : ''}`, type: 'button' }, k), () => { kode = k; draw(); }))), el('div', { class: 'seg' }, ANGGOTA.map(([k]) => onTap(el('button', { class: `seg-btn ${siapa === k ? 'on' : ''}`, type: 'button' }, k), () => { siapa = k; draw(); }))), stepper(hari, (v) => { hari = v; }, { min: 1, max: 60, label: 'hari' })),
              button(`Perintah ${n + 1}: ramal hasilnya ➜`, () => { tebak = true; draw(); }, 'primary')];
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: uji aturan "${a.label}" dengan 3 perintah (sertakan satu nilai batas)`),
          el('div', { class: 'op-dua lebar' }, kartu(S), el('div', { class: 'op-samping' }, el('pre', { class: 'op-log' }, cmds.length ? cmds.map((c) => `${c.cmd}\n   → ${c.right} ${c.ok ? '✓' : `✗ (ramalan ${c.pick})`}`).join('\n') : 'Belum ada perintah.'), ...body)));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tim Merancang, Tim Menguji', start);
}
