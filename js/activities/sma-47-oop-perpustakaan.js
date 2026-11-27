// Merancang Kelas Perpustakaan — SMA/SMK (16–18 tahun), coding. Designing
// classes from the library rules: nouns and verbs, a class diagram with
// "adalah" (inheritance) and "punya" (composition), the Python skeleton with
// encapsulated stock, polymorphism in batas_buku(), and the loan scenario of
// soal 5. Every result comes from running the worksheet classes in mini-py.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
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
const hasilText = (h) => (h == null ? '-' : /^\d+$|^None$/.test(h) ? h : `"${h}"`);
const opsi = (right, pool) => [right, ...[...new Set(pool)].filter((x) => x !== right)].slice(0, 4);
const HASIL_KEMBALI = ['0', '500', '1000', '2000', 'None'];

// Object cards: books with their stock, members with their loans.
export function kartu(S, { sorot = null, judul = true } = {}) {
  return el('div', { class: 'op-kartu-wrap' },
    el('div', { class: 'op-kolom' }, judul ? el('small', null, 'perpus.koleksi') : null, S.buku.map((b) => el('div', { class: `op-kartu buku ${b.ada === 0 ? 'habis' : ''} ${sorot === b.kode ? 'sorot' : ''}` }, el('b', null, `${b.kode} · ${b.kelas}`), el('span', null, b.judul), el('code', null, `_tersedia ${b.ada} dari ${b.jumlah}`)))),
    el('div', { class: 'op-kolom' }, judul ? el('small', null, 'anggota') : null, S.anggota.map((a) => el('div', { class: `op-kartu anggota ${sorot === a.k ? 'sorot' : ''}` }, el('b', null, `${a.nama} · ${a.kelas}`), el('code', null, `pinjaman: ${a.pinjaman.length ? a.pinjaman.map((p) => `${p.kode} (hari ke-${p.batas}${p.panjang ? ', diperpanjang' : ''})`).join(', ') : '[]'}`)))));
}

// ---- Permainan: Arsitek Perpustakaan ----
// The team designs the library program of SMA Negeri 1 Wanasari (rekaan):
// rule words become classes, blanks in the blueprint are filled, the stock is
// guarded from Hantu Stok Minus, and a busy day runs at the circulation desk.
const HEAD47 = {
  bedah: ['Bedah Aturan', 'Ketuk calon kelas dan calon metode, lalu seret atribut dan metode ke kartu kelasnya.', 'Aturannya panjang, pasti ada yang terlewat!'],
  buku: ['Cetak Biru: Buku dan Guru', 'Isi bagian kosong pada keluar() dan kelas Guru.', 'Aku suka stok yang bisa minus…'],
  pinjam: ['Cetak Biru: Peminjaman', 'Isi bagian kosong supaya setiap anggota memakai aturannya sendiri.', 'Tulis saja angka 7 dan 3, beres!'],
  hantu: ['Usir Hantu Stok Minus', 'Jalankan kode Rudi baris demi baris, lalu pakai pintu keluar() dan masuk().', 'Ubah langsung saja _tersedia-nya!'],
  panah: ['Adalah atau Punya?', 'Seret panah yang tepat ke setiap pasangan kelas.', 'Peminjaman adalah Buku, kan?'],
  staf: ['Kelas Baru: Staf TU', 'Telusuri kelas yang menjawab, lalu susun kelas Staf.', 'Kelas baru pasti merusak semuanya!'],
  sibuk1: ['Hari Sibuk: Perintah 1–6', 'Layani setiap perintah di meja sirkulasi.', 'Antreannya panjang hari ini!'],
  sibuk2: ['Hari Sibuk: Perintah 7–12', 'Lanjutkan sampai perintah 12, lalu hitung dendanya.', 'Ada yang mengembalikan buku dua kali!'],
  serang: ['Rancang dan Serang', 'Pilih tiga kartu uji di sekitar batas denda, lalu serang kode tim lain.', 'Kodeku sudah benar, coba saja!'],
  bos: ['Daftar Tunggu', 'Setiap Buku punya Antrean. Susun perubahannya, lalu telusuri perintah 3 dan 9.', 'Stok habis? Pulang saja!'],
};
const msg47 = (t) => el('p', { class: 'reveal info' }, t);

// Cards dropped into named class boxes; cards are [text, boxId or null, hint].
function sortBoard(ctx, { oops, msg, bins, cards, done, cls = '' }) {
  let left = cards.filter((c) => c[1]).length;
  const binEls = bins.map(([id, lab]) => el('div', { class: 'ap47-kelas', 'data-drop': id }, el('b', null, lab), el('div', { class: 'ap47-isi' })));
  const tray = el('div', { class: 'ap47-baki' }, ctx.rand.shuffle(cards.map((c, i) => el('div', { class: 'ap47-chip', 'data-drag': String(i) }, c[0]))));
  const host = el('div', { class: `ap47-sortir ${cls}` }, el('div', { class: 'ap47-kelas-kelas' }, binEls), tray);
  dnd(host, (chip, bin) => {
    if (!bin.classList.contains('ap47-kelas') || chip.classList.contains('locked')) return; const c = cards[+chip.dataset.drag];
    if (c[1] !== bin.dataset.drop) { oops(); shake(chip); say(msg, 'bad', c[2]); return; }
    if (bin.dataset.satu && bin.lastChild.childNodes.length) { say(msg, 'info', 'Kotak ini sudah terisi.'); return; }
    chip.classList.add('locked'); bin.lastChild.append(chip); ctx.sound.tap(); left--;
    if (left) { say(msg, 'info', 'Tepat.'); return; }
    tray.remove(); done();
  });
  return host;
}

// Misi 1: rule words, then members into class cards.
const ATURAN47 = [
  ['Setiap judul ', ['buku', 'k', 'Buku'], ' punya ', ['kode', 'x', 'kode adalah data milik buku: atribut, bukan kelas.'], ' dan satu atau beberapa ', ['eksemplar', 'x', 'Banyak eksemplar cukup disimpan sebagai angka di Buku: atribut.'], '. ', ['Buku referensi', 'k', 'BukuReferensi'], ', seperti ', ['kamus', 'x', 'Kamus adalah contoh buku referensi, bukan kelas baru.'], ', hanya boleh ', ['dibaca di tempat', 'm', 'boleh_dipinjam()'], '.'],
  [['Murid', 'k', 'Murid'], ' boleh ', ['meminjam', 'm', 'pinjam()'], ' paling banyak 3 buku selama 7 ', ['hari', 'x', 'Hari hanya angka: parameter, bukan kelas.'], '. Keterlambatan ', ['didenda', 'm', 'denda()'], ' Rp500 per buku per hari.'],
  [['Guru', 'k', 'Guru'], ' boleh meminjam paling banyak 5 buku selama 14 hari dan tidak didenda.'],
  ['Buku tidak bisa dipinjam bila semua eksemplarnya sedang dipinjam. Tanggal ', ['ditulis', 'x', 'ditulis hanya cara mencatat tanggal, bukan pekerjaan program.'], ' sebagai nomor hari.'],
];
function bedahRound(area, ctx, { oops, done }) {
  const msg = msg47('Ketuk empat kata benda yang menjadi calon kelas.'); const box = el('div', { class: 'ap47-kolom' });
  let fase = 'k'; const got = { k: [], m: [] }; const need = { k: 4, m: 3 };
  const kelasList = el('div', { class: 'ap47-calon' }); const metodeList = el('div', { class: 'ap47-calon' });
  const aturan = el('ul', { class: 'ap47-aturan', 'data-fase': fase }, ATURAN47.map((parts) => el('li', null, parts.map((p) => (typeof p === 'string' ? p
    : (() => { const b = el('button', { type: 'button', class: 'ap47-kata', 'data-jenis': p[1] }, p[0]); return onTap(b, () => tapKata(p, b)); })())))));
  const lists = el('div', { class: 'ap47-dua' }, el('div', { class: 'ap47-kolom' }, el('small', null, '📦 calon kelas'), kelasList), el('div', { class: 'ap47-kolom' }, el('small', null, '⚙️ calon metode'), metodeList));
  function tapKata(p, b) {
    if (!fase || b.classList.contains('isi')) return;
    if (p[1] === 'x') { oops(); say(msg, 'bad', p[2]); return; }
    if (p[1] !== fase) { oops(); say(msg, 'bad', fase === 'k' ? 'Itu kata kerja. Sekarang cari kata benda yang menjadi kelas.' : 'Itu calon kelas, sudah dicatat. Sekarang cari kata kerja.'); return; }
    b.classList.add('isi'); got[fase].push(p[2]); ctx.sound.tap();
    (fase === 'k' ? kelasList : metodeList).append(el('span', { class: 'ap47-token' }, p[2]));
    if (got[fase].length < need[fase]) { say(msg, 'info', `${p[0]} → ${p[2]}.`); return; }
    if (fase === 'k') { fase = 'm'; aturan.dataset.fase = 'm'; say(msg, 'info', 'Empat calon kelas. Sekarang ketuk tiga kata kerja yang menjadi calon metode.'); return; }
    fase = null; aturan.dataset.fase = '';
    kelasList.append(el('span', { class: 'ap47-token baru' }, 'Anggota'), el('span', { class: 'ap47-token baru' }, 'Peminjaman'), el('span', { class: 'ap47-token baru' }, 'Perpustakaan'));
    say(msg, 'info', 'Murid dan guru sama-sama anggota, setiap pinjaman tercatat, dan semuanya disimpan perpustakaan. Seret atribut dan metode ke kelasnya.');
    fill(box, lists, sortBoard(ctx, { oops, msg, bins: [['Buku', 'Buku'], ['Anggota', 'Anggota'], ['Peminjaman', 'Peminjaman'], ['Perpustakaan', 'Perpustakaan']],
      cards: [['_tersedia', 'Buku', 'Banyak eksemplar yang ada di rak adalah data buku.'], ['keluar()', 'Buku', 'keluar() mengurangi stok buku itu sendiri.'], ['pinjaman', 'Anggota', 'Daftar buku yang sedang dipinjam milik setiap anggota.'], ['batas_buku()', 'Anggota', 'Batas buku bergantung pada jenis anggota.'],
        ['batas_kembali', 'Peminjaman', 'Batas kembali berbeda untuk setiap peminjaman.'], ['denda()', 'Peminjaman', 'Denda dihitung dari satu peminjaman yang terlambat.'], ['koleksi', 'Perpustakaan', 'Perpustakaan menyimpan semua buku dalam koleksi.'], ['pinjam()', 'Perpustakaan', 'Meja sirkulasi perpustakaan yang menjalankan pinjam().']],
      done: () => { say(msg, '', 'Kata benda menjadi kelas atau atribut, kata kerja menjadi metode. Cetak biru siap digambar!'); done(); } }));
  }
  fill(box, aturan, lists);
  area.append(box, msg);
}

// Misi 2a: keluar() and the Guru class.
function bukuRound(area, ctx, { oops, done }) {
  const msg = msg47('keluar() harus menolak bila tidak ada eksemplar tersisa.'); const box = el('div', { class: 'ap47-kolom' });
  const guru = () => {
    say(msg, 'info', 'Murid hanya berisi pass: aturannya diwarisi dari Anggota. Guru menimpa tiga metode.');
    const T = runPy([...KELAS, 'g = Guru("Bu Ratna")', 'a = g.batas_buku()', 'b = g.lama_pinjam()', 'c = g.denda_per_hari()']).vars;
    fill(box, el('small', null, 'Aturan guru: 5 buku, 14 hari, tidak didenda'), fillBoard(ctx, { oops, msg, view: codeFill(['class Guru(Anggota):', '  def batas_buku(self):', ['    return ', '_'], '  def lama_pinjam(self):', ['    return ', '_'], '  def denda_per_hari(self):', ['    return ', '_']], { labels: ['34', '35', '36', '37', '38', '39', '40'] }),
      chips: ['5', '14', '0', '3', '7', '500'], want: ['5', '14', '0'], hints: ['Guru boleh meminjam paling banyak 5 buku.', 'Guru meminjam selama 14 hari.', 'Guru tidak didenda: Rp0 per hari.'],
      done: () => { say(msg, '', `Bu Ratna: ${T.a} buku, ${T.b} hari, Rp${T.c}. Sari (Murid) tetap 3 buku, 7 hari, Rp500.`); done(); } }));
  };
  fill(box, el('small', null, 'class Buku'), fillBoard(ctx, { oops, msg, view: codeFill(['def keluar(self):', ['  if ', '_', ':'], '    return False', '  self._tersedia = self._tersedia - 1', '  return True'], { labels: ['11', '12', '13', '14', '15'] }),
    chips: ['self._tersedia == 0', 'self._tersedia < 0', 'self._jumlah == 0'], want: ['self._tersedia == 0'], hints: ['Tolak sebelum stok menjadi minus: saat tersisa 0, jangan dikurangi lagi.'],
    done: () => setTimeout(guru, 900) }));
  area.append(box, msg);
}

// Misi 2b: Peminjaman and the limit check ask the member object.
function pinjamRound(area, ctx, { oops, done }) {
  const msg = msg47('Jangan tulis angka tetap. Tanyakan aturan kepada objek anggotanya.'); const box = el('div', { class: 'ap47-kolom' }); const out = layar();
  fill(box, el('small', null, 'Peminjaman (baris 41–50) · Perpustakaan.pinjam (baris 59–60)'), fillBoard(ctx, { oops, msg,
    view: codeFill(['class Peminjaman:', '    self.batas_kembali = (hari_pinjam', ['        + ', '_', ')'], '  def denda(self, hari_kembali):', ['    return terlambat * ', '_'], '  def pinjam(self, kode, anggota, hari):', '    if (len(anggota.pinjaman)', ['        >= ', '_', '):']], { labels: ['41', '45', '', '46', '50', '59', '60', ''] }),
    chips: ['anggota.lama_pinjam()', '7', 'self.anggota.denda_per_hari()', '500', 'anggota.batas_buku()', '3'], want: ['anggota.lama_pinjam()', 'self.anggota.denda_per_hari()', 'anggota.batas_buku()'],
    hints: ['Angka 7 hanya benar untuk murid. Tanyakan lama pinjam kepada objek anggota.', 'Guru tidak didenda. Tanyakan kepada anggota yang disimpan di self.anggota.', 'Batas murid 3, batas guru 5. Tanyakan kepada anggota.'],
    done: () => { const cmds = ['perpus.pinjam("B01", sari, 1)', 'perpus.pinjam("B02", ratna, 2)']; const R = jalankan(cmds);
      say(msg, 'info', 'Uji coba di meja sirkulasi…'); box.append(out); play(out, cmds.map((c, i) => `${c.replace('perpus.', '')} → ${R.hasil[i]}`), { gap: 700, end: () => { say(msg, '', 'Satu kode, dua aturan: murid 7 hari, guru 14 hari. Objeknya sendiri yang menjawab.'); done(); } }); } }));
  area.append(box, msg);
}

// Book object card with stock pips; the ghost appears below zero.
const bukuKartu = (kode, ada, jumlah, { hantu = false, cls = '' } = {}) => el('div', { class: `ap47-objek ${hantu ? 'hantu' : ''} ${cls}` }, el('b', null, `${kode} · Buku`),
  el('div', { class: 'ap47-pip' }, ada > 0 ? Array.from({ length: ada }, () => el('span', null, '📗')) : ada < 0 ? el('span', { class: 'ap47-boo' }, '👻') : el('i', null, 'rak kosong')),
  el('code', null, `_tersedia ${ada} dari ${jumlah}`));

// Misi 3: Rudi changes the stock directly; then the doors keluar() and masuk().
function hantuRound(area, ctx, { oops, done }) {
  const msg = msg47('Ketuk baris kode Rudi yang menyala untuk menjalankannya.'); const box = el('div', { class: 'ap47-kolom' }); const out = layar();
  const R5 = runPy([...KELAS, ...RUDI]).out[0];
  const T = runPy([...KELAS, 'b = Buku("B09", "Contoh", 2)', 'x0 = b.keluar()', 'x1 = b.keluar()', 'x2 = b.keluar()', 'b.masuk()', 's0 = b.tersedia()', 'b.masuk()', 's1 = b.tersedia()', 'b.masuk()', 's2 = b.tersedia()']).vars;
  let i = 0; let ada = null; const kiri = el('div', { class: 'ap47-kolom' }); const kanan = el('div', { class: 'ap47-kolom' });
  const drawRudi = () => {
    fill(kiri, el('small', null, 'Kode Rudi'), codeView(RUDI, { labels: ['R1', 'R2', 'R3', 'R4', 'R5'], hl: i < RUDI.length ? [i] : [], warn: i >= RUDI.length ? [1, 2, 3] : [], cls: 'ketuk', onLine: (k) => runLine(k) }));
    fill(kanan, ada == null ? el('i', null, 'belum ada objek') : bukuKartu('B09', ada, 2, { hantu: ada < 0 }));
  };
  function runLine(k) {
    if (i >= RUDI.length) return;
    if (k !== i) { oops(); say(msg, 'bad', `Jalankan dari atas: baris R${i + 1}.`); return; }
    if (i === 0) ada = 2; else if (i < 4) ada--; ctx.sound.tap(); i++; drawRudi();
    if (i < 4) { say(msg, 'info', i === 1 ? 'Objek B09 dibuat dengan 2 eksemplar.' : `_tersedia diubah langsung: ${ada}.`); return; }
    if (i === 4) { say(msg, 'info', 'Stok minus! Hantu Stok Minus muncul. Jalankan R5.'); return; }
    kanan.append(out); play(out, [R5], { end: () => setTimeout(pintu, 1200) });
  }
  // Phase 2: the same book, changed only through its methods.
  const CMD = [['keluar', T.x0], ['keluar', T.x1], ['keluar', T.x2], ['masuk', T.s0], ['masuk', T.s1], ['masuk', T.s2]].map(([m, v]) => [m, pyRepr(v)]);
  function pintu() {
    let k = 0; let stok = 2; say(msg, 'info', 'Sekarang ubah stok hanya lewat pintunya. keluar(): ketuk True atau False. masuk(): ketuk stok sesudahnya.');
    const draw = () => {
      fill(kiri, el('small', null, 'Lewat metode'), codeView(CMD.map(([m]) => (m === 'keluar' ? 'b.keluar()' : 'b.masuk(); b.tersedia()')), { hl: k < CMD.length ? [k] : [] }),
        codeView(KELAS.slice(10, 15).map((x) => x.replace(/^ {4}/, '').replace(/ {4}/g, '  ')), { labels: ['11', '12', '13', '14', '15'], cls: 'kecil' }));
      const isMasuk = k < CMD.length && CMD[k][0] === 'masuk';
      fill(kanan, bukuKartu('B09', stok, 2), k < CMD.length ? el('div', { class: 'ap47-tombol', 'data-want': CMD[k][1] }, (isMasuk ? ['0', '1', '2', '3'] : ['True', 'False']).map((v) => onTap(el('button', { type: 'button', class: 'ap47-pilih', 'data-v': v }, v), () => jawab(v)))) : null);
    };
    function jawab(v) {
      if (k >= CMD.length) return; const [m, want] = CMD[k];
      if (v !== want) { oops(); say(msg, 'bad', m === 'keluar' ? (stok === 0 ? 'Tersisa 0: baris 12 menolak dan mengembalikan False.' : 'Masih ada eksemplar, jadi keluar() berhasil.') : (stok === 2 ? 'masuk() hanya menambah bila _tersedia < _jumlah.' : 'Satu eksemplar kembali ke rak.')); return; }
      if (m === 'keluar' && v === 'True') stok--; if (m === 'masuk') stok = +v; ctx.sound.tap(); k++; draw();
      if (k < CMD.length) { say(msg, 'info', k === 3 ? 'Stok 0 dan tidak pernah minus. Sekarang tiga kali masuk().' : 'Tepat.'); return; }
      say(msg, 'info', 'Stok selalu di antara 0 dan 2. Satu pertanyaan lagi.');
      fill(kiri, el('small', null, 'Lewat metode'), codeView(CMD.map(([m]) => (m === 'keluar' ? 'b.keluar()' : 'b.masuk(); b.tersedia()'))));
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['garis bawah di _tersedia: ', '_']]), chips: ['kesepakatan; Python tidak melarang', 'Python melarang perubahan dari luar', 'atributnya hanya bisa dibaca'], want: ['kesepakatan; Python tidak melarang'],
        hints: ['Kode Rudi tadi tetap jalan, jadi Python tidak melarangnya.'], done: () => { say(msg, '', 'Hantu terusir: stok hanya diubah lewat keluar() dan masuk(). Itulah enkapsulasi.'); done(); } }));
    }
    draw();
  }
  drawRudi();
  fill(box, el('div', { class: 'ap47-dua' }, kiri, kanan));
  area.append(box, msg);
}

// Misi 4: "adalah" or "punya" arrows between class pairs.
export const PASANGAN47 = [['Guru', 'Anggota', 'adalah'], ['Peminjaman', 'Buku', 'punya'], ['BukuReferensi', 'Buku', 'adalah'], ['Perpustakaan', 'Buku', 'punya'], ['Anggota', 'Peminjaman', 'punya']];
const JANGGAL = { adalah: (a, b) => `"${a} adalah ${b}" janggal. Coba "${a} punya ${b}".`, punya: (a, b) => `"${a} punya ${b}"? Bukan: ${a} memang sejenis ${b}, jadi pewarisan.` };
function panahRound(area, ctx, { oops, done }) {
  const msg = msg47('Seret ▷ adalah atau ◆ punya ke celah di antara dua kelas. Bacakan kalimatnya!'); const box = el('div', { class: 'ap47-kolom' }); let got = 0;
  const rows = PASANGAN47.map(([a, b], i) => el('div', { class: 'ap47-pasang' }, el('span', { class: 'ap47-k' }, a), el('span', { class: 'ap47-celah', 'data-drop': String(i) }, '?'), el('span', { class: 'ap47-k' }, b)));
  const host = el('div', { class: 'ap47-kolom' }, el('div', { class: 'ap47-pasang-pasang' }, rows), el('div', { class: 'ap47-baki' }, el('div', { class: 'ap47-panah adalah', 'data-drag': 'adalah' }, '▷ adalah'), el('div', { class: 'ap47-panah punya', 'data-drag': 'punya' }, '◆ punya')));
  dnd(host, (card, s) => {
    if (!s.classList.contains('ap47-celah') || s.classList.contains('isi')) return; const [a, b, j] = PASANGAN47[+s.dataset.drop]; const pick = card.dataset.drag;
    if (pick !== j) { oops(); s.classList.add('salah'); setTimeout(() => s.classList.remove('salah'), 900); say(msg, 'bad', JANGGAL[pick](a, b)); return; }
    s.textContent = j === 'adalah' ? '▷ adalah' : '◆ punya'; s.classList.add('isi', j); ctx.sound.tap(); got++;
    if (got < PASANGAN47.length) { say(msg, 'info', `${a} ${j} ${b}: ${j === 'adalah' ? 'pewarisan' : 'komposisi'}.`); return; }
    host.querySelector('.ap47-baki').remove(); say(msg, 'info', 'Semua panah tepat. Dodi mengusulkan sesuatu…');
    box.append(codeView(['class Peminjaman(Buku, Anggota):'], { warn: [0], labels: ['D'] }), fillBoard(ctx, { oops, msg, view: rowsView([['usul Dodi berbunyi "peminjaman ', '_', ' buku"'], ['jadi usul itu ', '_']]), chips: ['adalah', 'punya', 'buruk', 'bagus'], want: ['adalah', 'buruk'],
      hints: ['Kelas di dalam kurung adalah induknya: pewarisan.', 'Peminjaman bukan sejenis buku; data buku akan tersalin dan stok bisa tidak cocok.'], done: () => { say(msg, '', 'Uji dengan kalimat: "adalah" untuk pewarisan, "punya" untuk komposisi. Bila ragu, pilih punya.'); done(); } }));
  });
  fill(box, host);
  area.append(box, msg);
}

// Misi 4b: method lookup (polymorphism), then a new Staf class.
const METODE47 = { Anggota: ['batas_buku() → 3', 'lama_pinjam() → 7', 'denda_per_hari() → 500'], Murid: [], Guru: ['batas_buku() → 5', 'lama_pinjam() → 14', 'denda_per_hari() → 0'], Staf: ['batas_buku() → 4', 'lama_pinjam() → 10'] };
function stafRound(area, ctx, { oops, done }) {
  const msg = msg47(''); const box = el('div', { class: 'ap47-kolom' }); const out = layar(); let staf = false;
  const tanya = [['sari', 'Murid', 'batas_buku'], ['ratna', 'Guru', 'batas_buku'], ['sari', 'Murid', 'denda_per_hari']]; let qi = 0; let jalur = [];
  const pohon = el('div', { class: 'ap47-pohon' }); const soal = el('div', { class: 'ap47-soal' });
  const kelasBtn = (k) => onTap(el('button', { type: 'button', class: `ap47-kelasbtn ${jalur.includes(k) ? 'lewat' : ''}`, 'data-k': k }, el('b', null, k === 'Anggota' ? 'Anggota' : `${k} ▷ Anggota`), METODE47[k].length ? METODE47[k].map((m) => el('small', null, m)) : el('small', null, 'pass')), () => cari(k));
  const draw = () => {
    fill(pohon, el('div', { class: 'ap47-induk' }, kelasBtn('Anggota')), el('div', { class: 'ap47-anak' }, ['Murid', 'Guru', ...(staf ? ['Staf'] : [])].map(kelasBtn)));
    const [o, kls, m] = tanya[qi] || [];
    fill(soal, o ? el('code', null, `${o}.${m}()`) : null, o ? el('small', null, `${o} adalah objek ${kls}`) : null);
  };
  const owner = (kls, m) => (METODE47[kls].some((x) => x.startsWith(`${m}(`)) ? kls : 'Anggota');
  function cari(k) {
    if (qi >= tanya.length) return; const [o, kls, m] = tanya[qi];
    const path = owner(kls, m) === kls ? [kls] : [kls, 'Anggota']; const want = path[jalur.length];
    if (k !== want) { oops(); say(msg, 'bad', jalur.length ? `${kls} tidak punya ${m}(): naik ke kelas induknya.` : `Python mulai mencari di kelas objeknya sendiri: ${kls}.`); return; }
    jalur.push(k); ctx.sound.tap();
    if (jalur.length < path.length) { draw(); say(msg, 'info', `${k} tidak punya ${m}(). Naik ke induknya.`); return; }
    const v = METODE47[k].find((x) => x.startsWith(`${m}(`)).split('→ ')[1]; say(msg, 'info', `${o}.${m}() dijawab ${k}: ${v}.`); jalur = []; qi++; draw();
    if (qi < tanya.length) return;
    if (!staf) setTimeout(susun, 1000); else akhir();
  }
  function susun() {
    say(msg, 'info', 'Staf TU boleh meminjam 4 buku selama 10 hari, dendanya sama dengan murid. Susun kelas Staf.');
    fill(box, el('div', { class: 'ap47-dua' }, pohon, tileSlots(ctx, { oops, msg, build: ['class Staf(Anggota):', ['d1', 1], ['r1', 2], ['d2', 1], ['r2', 2]],
      tiles: [['d1', 'def batas_buku(self):'], ['r1', 'return 4'], ['d2', 'def lama_pinjam(self):'], ['r2', 'return 10'], ['x', 'def denda_per_hari(self):', 'Denda staf sama dengan Anggota: tidak perlu ditulis, cukup diwarisi.'], ['y', 'return 7', 'Staf TU boleh meminjam 10 hari.']],
      onFull: () => { staf = true; tanya.push(['joko', 'Staf', 'lama_pinjam'], ['joko', 'Staf', 'denda_per_hari']); draw(); fill(box, pohon, soal); say(msg, 'info', 'Kelas Staf berdiri. Telusuri dua pemanggilan untuk Pak Joko.'); } })));
  }
  function akhir() {
    {
      const joko = runPy([...KELAS, ...STAF, 'perpus = Perpustakaan()', 'perpus.tambah(Buku("B03", "Cerita Rakyat Nusantara", 3))', 'x = perpus.pinjam("B03", Staf("Pak Joko"), 5)']).vars.x;
      box.append(out); play(out, [`pinjam("B03", Staf("Pak Joko"), 5)`, `→ ${pyRepr(joko)}`], { gap: 600, end: () => {
        box.append(fillBoard(ctx, { oops, msg, view: rowsView([['kelas lain yang perlu diubah: ', '_']]), chips: ['tidak ada', 'Perpustakaan', 'Anggota'], want: ['tidak ada'],
          hints: ['Perpustakaan hanya memanggil batas_buku() dan lama_pinjam(); objek Staf menjawab sendiri.'], done: () => { say(msg, '', 'Polimorfisme: satu pemanggilan, jawaban sesuai jenis objek. Kelas baru tidak merusak kelas lama.'); done(); } })); } });
    }
  }
  say(msg, 'info', 'Ketuk kelas dalam urutan Python mencari metodenya.');
  draw(); fill(box, pohon, soal);
  area.append(box, msg);
}

// Misi 5: the circulation desk. Each command is done by hand on the object cards.
const PARSE47 = (c) => { const m = c.match(/\.(pinjam|kembalikan)\("(\w+)", (\w+), (\d+)\)/); return { aksi: m[1], kode: m[2], who: m[3], hari: +m[4] }; };
const STEMPEL = ['Hanya dibaca di tempat', 'Batas pinjam tercapai', 'Stok habis', 'None'];
const NAMA47 = { sari: 'Sari', dodi: 'Dodi', ratna: 'Bu Ratna' };
function mejaRound(area, ctx, { oops, done }, from) {
  const msg = msg47('Berhasil pinjam: seret 📗 dari buku ke anggota. Kembali: seret kartu pinjaman ke bukunya. Ditolak: ketuk stempelnya.');
  const box = el('div', { class: 'ap47-kolom' }); const H = jalankan(SKENARIO).hasil; let i = from; let fase = 'aksi'; let S = jalankan(SKENARIO.slice(0, from));
  const kiri = el('div', { class: 'ap47-kolom' }); const kanan = el('div', { class: 'ap47-meja' });
  const want = () => { const c = PARSE47(SKENARIO[i]); const h = H[i]; if (c.aksi === 'pinjam') return h.startsWith('Kembali') ? { ...c, jenis: 'pinjam', nilai: h.match(/\d+$/)[0] } : { ...c, jenis: 'stempel', nilai: h }; return h === 'None' ? { ...c, jenis: 'stempel', nilai: 'None' } : { ...c, jenis: 'kembali', nilai: h }; };
  const draw = () => {
    const w = i < from + 6 ? want() : null;
    const pilih = !w ? null : fase === 'hari' ? [w.hari + 7, w.hari + 14, w.hari + 3].map((n) => [String(n), `ke-${n}`]) : fase === 'denda' ? ['0', '500', '1000', '2000'].map((n) => [n, `Rp${n}`]) : STEMPEL.map((s) => [s, s === 'None' ? 'None' : `🚫 ${s}`]);
    fill(kiri, el('div', { class: 'ap47-perintah' }, SKENARIO.slice(from, from + 6).map((c, k) => el('code', { class: from + k === i ? 'aktif' : from + k < i ? 'beres' : '' }, `${from + k + 1}. ${c.replace('perpus.', '')}`))),
      codeView(['pinjam(): periksa berurutan', '1. b.boleh_dipinjam()?', '2. pinjaman < batas_buku()?', '3. b.keluar() berhasil?'], { cls: 'kecil', labels: ['', '', '', ''] }),
      w ? el('div', { class: `ap47-tombol ${fase}`, 'data-fase': fase }, el('small', null, fase === 'hari' ? 'kembali paling lambat hari' : fase === 'denda' ? 'denda dikembalikan' : 'stempel'), pilih.map(([v, t]) => onTap(el('button', { type: 'button', class: 'ap47-pilih', 'data-v': v }, t), () => tombol(v)))) : null);
    fill(kanan, el('div', { class: 'ap47-rak' }, S.buku.map((b) => el('div', { class: `ap47-objek kecil ${b.ada === 0 ? 'habis' : ''}`, 'data-drop': `b:${b.kode}` }, el('b', null, `${b.kode}${b.kelas === 'BukuReferensi' ? ' · Referensi' : ''}`), el('div', { class: 'ap47-pip' }, b.ada ? el('span', { class: 'ap47-eks', 'data-drag': `b:${b.kode}` }, `📗×${b.ada}`) : el('i', null, 'habis'))))),
      el('div', { class: 'ap47-rak' }, S.anggota.map((a) => el('div', { class: 'ap47-objek kecil anggota', 'data-drop': `m:${a.k}` }, el('b', null, `${a.nama} · ${a.kelas}`), el('div', { class: 'ap47-pip' }, a.pinjaman.length ? a.pinjaman.map((p) => el('span', { class: 'ap47-slip', 'data-drag': `s:${a.k}:${p.kode}` }, `${p.kode} · ke-${p.batas}`)) : el('i', null, 'pinjaman []'))))));
  };
  const hint = (w) => {
    if (w.jenis === 'pinjam') return `Ketiga pemeriksaan lolos untuk ${NAMA47[w.who]}: seret 📗 ${w.kode} ke kartunya.`;
    if (w.jenis === 'kembali') return `${NAMA47[w.who]} memang meminjam ${w.kode}: seret kartu pinjamannya ke rak ${w.kode}.`;
    const a = S.anggota.find((x) => x.k === w.who);
    return { 'Hanya dibaca di tempat': `${w.kode} adalah BukuReferensi: boleh_dipinjam() memberi False, ditolak paling awal.`, 'Batas pinjam tercapai': `${NAMA47[w.who]} sudah meminjam ${a.pinjaman.length} buku; batas_buku() murid 3.`, 'Stok habis': `Semua eksemplar ${w.kode} sedang dipinjam: keluar() memberi False.`, None: `${w.kode} tidak ada di daftar pinjaman ${NAMA47[w.who]}: kembalikan memberi None.` }[w.nilai];
  };
  function maju() { i++; fase = 'aksi'; S = jalankan(SKENARIO.slice(0, i)); ctx.sound.tap(); draw();
    if (i < from + 6) { say(msg, 'info', `Hasil: ${H[i - 1]}. Perintah ${i + 1}.`); return; }
    say(msg, 'info', `Hasil: ${H[i - 1]}. Satu pertanyaan penguji.`);
    const T = from === 0 ? { v: rowsView([['perintah 3 menguji ', '_']]), c: ['stok yang tepat habis', 'batas banyak buku', 'buku referensi'], w: ['stok yang tepat habis'], h: ['B01 punya 2 eksemplar, keduanya baru saja dipinjam.'] }
      : { v: rowsView([['perintah 8 menguji ', '_'], ['total denda hari ini: Rp', '_']]), c: ['batas banyak buku', 'stok yang tepat habis', fmtNum(1000), fmtNum(1500), fmtNum(500)], w: ['batas banyak buku', fmtNum(H.slice(8).filter((x) => /^\d+$/.test(x)).reduce((s, x) => s + +x, 0))], h: ['Sari mencoba buku keempat.', '0 + 1.000 + 0: Bu Ratna terlambat, tetapi guru tidak didenda.'] };
    box.append(fillBoard(ctx, { oops, msg, view: T.v, chips: T.c, want: T.w, hints: T.h, done: () => { say(msg, '', from === 0 ? 'Perintah 1–6 beres. Kartu objek berubah hanya lewat metode.' : 'Stok akhir B01 2, B02 1, B03 2, B04 0, R01 1. Sari masih meminjam B03 dan B04.'); done(); } }));
  }
  function tombol(v) {
    if (i >= from + 6) return; const w = want();
    if (fase === 'aksi') { if (w.jenis === 'stempel' && v === w.nilai) { maju(); return; } oops(); say(msg, 'bad', hint(w)); return; }
    if (v !== w.nilai) { oops(); say(msg, 'bad', fase === 'hari' ? `${NAMA47[w.who]} adalah ${S.anggota.find((a) => a.k === w.who).kelas}: hari ${w.hari} + lama_pinjam().` : 'Hitung hari terlambat × denda_per_hari() anggota itu.'); return; }
    maju();
  }
  const host = el('div', { class: 'ap47-dua' }, kiri, kanan);
  dnd(host, (card, s) => {
    if (i >= from + 6 || fase !== 'aksi') return; const w = want(); const d = card.dataset.drag; const t = s.dataset.drop;
    const ok = (w.jenis === 'pinjam' && d === `b:${w.kode}` && t === `m:${w.who}`) || (w.jenis === 'kembali' && d === `s:${w.who}:${w.kode}` && t === `b:${w.kode}`);
    if (!ok) { oops(); shake(card); say(msg, 'bad', hint(w)); return; }
    S = jalankan(SKENARIO.slice(0, i + 1)); fase = w.jenis === 'pinjam' ? 'hari' : 'denda'; ctx.sound.tap(); draw();
    say(msg, 'info', fase === 'hari' ? 'Buku keluar. Kembali paling lambat hari ke berapa?' : 'Buku kembali ke rak. Berapa dendanya?');
  });
  draw(); fill(box, host);
  area.append(box, msg);
}

// Misi 6: boundary tests against the "denda maks Rp10.000" rule.
export const KODE_B47 = ['terlambat = (hari_kembali', '  - self.batas_kembali)', 'if terlambat <= 0:', '  return 0', 'if terlambat > 18:', '  return 10000', 'h = self.anggota.denda_per_hari()', 'return terlambat * h'];
const dendaB = (d, n = 18) => runPy(['def f(terlambat, h):', ...KODE_B47.slice(2, 6).map((x) => (x.startsWith('  ') ? `        ${x.trim()}` : `    ${x.replace('18', String(n))}`)), '    return terlambat * h', `x = f(${d}, 500)`]).vars.x;
function serangRound(area, ctx, { oops, done }) {
  const msg = msg47('Aturan baru Tim B: denda paling banyak Rp10.000 per buku.'); const box = el('div', { class: 'ap47-kolom' }); const out = layar();
  const benar = (d) => runPy([...program(['maks']), 'a = Murid("Sari")', 'p = Peminjaman(Buku("B01", "x", 1), a, 1)', `x = p.denda(${8 + d})`]).vars.x;
  const UJI = [19, 20, 30]; const E = UJI.map(benar); const G = UJI.map(dendaB);
  const serang = () => {
    say(msg, 'info', 'Kartu uji dijalankan pada kode Tim B…'); fill(box, el('div', { class: 'ap47-dua' }, el('div', { class: 'ap47-kolom' }, el('small', null, 'denda() versi Tim B'), codeView(KODE_B47, { cls: 'ketuk', labels: ['47', '', '48', '49', '50', '51', '52', '53'], onLine: (k, row) => tunjuk(k, row) })), out));
    play(out, UJI.map((d, k) => `${d} hari: harap ${fmtNum(E[k])}, dapat ${fmtNum(G[k])} ${E[k] === G[k] ? '✓' : '✗'}`), { gap: 700, end: () => { siap = true; say(msg, 'info', 'Serangan berhasil! Ketuk baris yang salah.'); } });
  };
  let ketemu = false; let siap = false;
  function tunjuk(k, row) {
    if (ketemu || !siap) return;
    if (k !== 4) { oops(); say(msg, 'bad', 'Baris ini benar. Pada 19 hari dendanya sudah dipotong terlalu cepat.'); return; }
    ketemu = true; row.classList.add('warn'); ctx.sound.tap(); say(msg, 'info', 'Batasnya salah. Perbaiki angkanya.');
    box.append(fillBoard(ctx, { oops, msg, view: codeFill([['if terlambat > ', '_', ':'], '  return 10000'], { labels: ['51', '52'] }), chips: ['20', '18', '17'], want: ['20'],
      hints: ['Rp10.000 tercapai tepat pada hari ke-20.'], done: () => { say(msg, '', `Diperbaiki: ${UJI.map((d) => `${d} hari Rp${fmtNum(dendaB(d, 20))}`).join(', ')}. Nilai batas menangkap kesalahan.`); done(); } }));
  }
  const ramal = () => { say(msg, 'info', 'Ramalkan denda yang benar untuk setiap kartu uji.');
    box.append(fillBoard(ctx, { oops, msg, view: rowsView(UJI.map((d) => [`${d} hari → Rp`, '_'])), chips: [fmtNum(E[0]), fmtNum(E[1]), fmtNum(E[2]), fmtNum(15000), fmtNum(9000)], want: E.map(fmtNum),
      hints: ['19 × 500.', '20 × 500 tepat Rp10.000.', '30 × 500 = 15.000, tetapi paling banyak 10.000.'], done: () => setTimeout(serang, 900) })); };
  const pilihKartu = () => { say(msg, 'info', 'Penguji licik menyerang di sekitar batas. Seret tiga kartu uji ke tempatnya.');
    const sb = sortBoard(ctx, { oops, msg, bins: [['bawah', 'tepat sebelum batas'], ['batas', 'tepat di batas'], ['atas', 'jauh lewat batas']],
      cards: [['19 hari', 'bawah', 'Kartu ini bukan untuk kotak itu.'], ['20 hari', 'batas', 'Kartu ini bukan untuk kotak itu.'], ['30 hari', 'atas', 'Kartu ini bukan untuk kotak itu.'], ['1 hari', null, 'Terlalu jauh dari batas: kesalahan di sekitar 20 tidak akan ketahuan.'], ['10 hari', null, 'Terlalu jauh dari batas: kesalahan di sekitar 20 tidak akan ketahuan.']],
      done: ramal });
    sb.querySelectorAll('.ap47-kelas').forEach((b) => { b.dataset.satu = '1'; });
    box.append(sb); };
  fill(box, fillBoard(ctx, { oops, msg, view: rowsView([['Rp10.000 ÷ Rp500 per hari = ', '_', ' hari terlambat']]), chips: ['20', '10', '50'], want: ['20'], hints: ['10.000 ÷ 500.'], done: pilihKartu }));
  area.append(box, msg);
}

// Misi Bos: every Buku has an Antrean (composition).
export const ANTREAN47 = ['class Antrean:', '    def __init__(self):', '        self.isi = []', '    def datang(self, x):', '        self.isi.append(x)', '    def layani(self):', '        return self.isi.pop(0)', '    def kosong(self):', '        return len(self.isi) == 0'];
export function programTunggu() {
  const out = [...ANTREAN47];
  KELAS.forEach((x, k) => { const n = k + 1;
    if (n === 63) { out.push('            b.tunggu.datang(anggota)', '            return "Masuk daftar tunggu"'); return; }
    out.push(x);
    if (n === 6) out.push('        self.tunggu = Antrean()');
    if (n === 71) out.push('                if not p.buku.tunggu.kosong():', '                    berikut = p.buku.tunggu.layani()', '                    print("Untuk", berikut.nama)'); });
  return out;
}
function bosRound(area, ctx, { oops, done }) {
  const msg = msg47('Bila stok habis, anggota masuk daftar tunggu. Susun bagian pertama.'); const box = el('div', { class: 'ap47-kolom' }); const out = layar();
  const R = runPy([...programTunggu(), ...SETUP, ...SKENARIO.slice(0, 9).map((c, k) => `h${k} = ${c}`)], { limit: 200000 });
  const h3 = pyRepr(R.vars.h2); const kata = R.out[0] || '';
  const lajur = (isi, cls = '') => el('div', { class: `ap47-lajur ${cls}`, 'data-drop': 'tunggu' }, el('small', null, 'B01.tunggu'), isi.length ? isi.map((n, k) => el('span', { class: `ap47-token ${k === 0 ? 'depan' : ''}`, 'data-depan': k === 0 ? '1' : null }, n)) : el('i', null, '[]'));
  const tahap2 = () => {
    say(msg, 'info', 'Perintah 9: Dodi mengembalikan B01. Susun bagian kembalikan.');
    const kanan = el('div', { class: 'ap47-kolom' }); const ts = tileSlots(ctx, { oops, msg, build: ['# kembalikan, setelah p.buku.masuk()', ['t4', 0], ['t5', 1], ['t6', 1]],
      tiles: [['t4', 'if not p.buku.tunggu.kosong():'], ['t5', 'berikut = p.buku.tunggu.layani()'], ['t6', 'print("Untuk", berikut.nama)'], ['z', 'berikut = p.buku.tunggu.datang()', 'Mengambil yang paling depan memakai layani().']],
      onFull: () => { say(msg, 'info', 'Jalankan perintah 9: ketuk anggota paling depan di daftar tunggu B01.');
        const scene = el('div', { class: 'ap47-dua' }, bukuKartu('B01', 1, 2), lajur([NAMA47.ratna]));
        kanan.append(scene); fill(box, el('div', { class: 'ap47-dua' }, ts, kanan)); onTap(scene.querySelector('[data-depan]'), () => {
          if (scene.dataset.beres) return; scene.dataset.beres = '1'; ctx.sound.tap(); fill(scene, bukuKartu('B01', 1, 2, { cls: 'sorot' }), lajur([]));
          kanan.append(out); play(out, [kata, `→ ${pyRepr(R.vars.h8)}`], { gap: 700, end: () => {
            kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['setiap Buku ', '_', ' sebuah Antrean']]), chips: ['punya', 'adalah'], want: ['punya'], hints: ['Buku bukan sejenis antrean: komposisi.'],
              done: () => { say(msg, '', `${kata}: buku B01 dari Dodi disiapkan untuk Bu Ratna. Hantu Stok Minus kalah total!`); done(); } })); } }); }); } });
    fill(box, ts);
  };
  const ts1 = tileSlots(ctx, { oops, msg, build: ['class Buku:  # di __init__', ['t1', 1], '# pinjam: if not b.keluar():', ['t2', 1], ['t3', 1]],
    tiles: [['t1', 'self.tunggu = Antrean()'], ['t2', 'b.tunggu.datang(anggota)'], ['t3', 'return "Masuk daftar tunggu"'], ['x', 'class Buku(Antrean):', 'Buku bukan sejenis antrean. Buku punya antrean: buat atributnya.'], ['y', 'return "Stok habis"', 'Catat anggotanya dulu di daftar tunggu.']],
    onFull: () => { say(msg, 'info', 'Perintah 3: Bu Ratna meminjam B01 yang stoknya 0. Seret Bu Ratna ke daftar tunggu B01.');
      const scene = el('div', { class: 'ap47-dua' }, bukuKartu('B01', 0, 2), lajur([]), el('div', { class: 'ap47-baki' }, Object.entries(NAMA47).map(([k, n]) => el('span', { class: 'ap47-token', 'data-drag': k }, n))));
      const kanan1 = el('div', { class: 'ap47-kolom' }, scene); fill(box, el('div', { class: 'ap47-dua' }, ts1, kanan1));
      dnd(scene, (t, s) => { if (s.dataset.drop !== 'tunggu' || scene.dataset.beres) return;
        if (t.dataset.drag !== 'ratna') { oops(); shake(t); say(msg, 'bad', 'Perintah 3 dijalankan Bu Ratna.'); return; }
        scene.dataset.beres = '1'; ctx.sound.tap(); fill(scene, bukuKartu('B01', 0, 2), lajur([NAMA47.ratna])); kanan1.append(out); play(out, [`→ ${h3}`], { end: () => setTimeout(tahap2, 1400) }); }); } });
  fill(box, ts1);
  area.append(box, msg);
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
    const wrap = el('div', { class: 'act ap47-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'ap47-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD47[k];
        foe = el('div', { class: 'ap47-musuh' }, el('b', null, '👻 Hantu Stok Minus'), el('span', null, ulah));
        wrap.append(el('div', { class: 'ap47-kepala' }, misiHead(no, judul, tujuan, '📚'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Stok aman ✓'; next(ms); } });
      if (r === 0) { go('bedah', 1); bedahRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('buku', 2); bukuRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('pinjam', 2); pinjamRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('hantu', 3); hantuRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('panah', 4); panahRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('staf', 4); stafRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('sibuk1', 5); mejaRound(area, ctx, fin(5500), 0); }
      else if (r === 7) { go('sibuk2', 5); mejaRound(area, ctx, fin(6000), 6); }
      else if (r === 8) { go('serang', 6); serangRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
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
