// Basis Data Toko Kerajinan Kelas — SMA/SMK (16–18 tahun), basis data relasional dan SQL.
// One big order table full of repeats is split into pelanggan, produk and pesanan
// with primary and foreign keys; queries run as cards (SARING, PILIH, GABUNG,
// KELOMPOKKAN, URUTKAN) and as SQL in a small interpreter inside the browser.
// The main mode is a game against the Pengacau Data: tap rows, drag columns,
// keys, query cards and SQL tiles; nothing is typed.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';
import { makeDb, SqlError } from './sql-mini.js';

// [no, tanggal, pelanggan, kontak, produk, harga, jumlah, total]
export const BIG = [
  [1, '6/10', 'Bu Rina', 'Ruang guru', 'Gantungan kunci batik', 8000, 3, 24000], [2, '6/10', 'Dimas', 'Kelas 10-1', 'Gantungan kunci batik', 8000, 2, 16000],
  [3, '7/10', 'Pak Joko', 'Pos satpam', 'Lilin aromaterapi', 15000, 1, 15000], [4, '8/10', 'Bu Sari', 'Lewat Nadia (11-2)', 'Tas anyaman pandan', 45000, 1, 45000],
  [5, '9/10', 'Pak Darto', 'Ruang guru', 'Kaos sablon kelas', 60000, 2, 120000], [6, '10/10', 'Bu Rina', 'R. Guru', 'Tas anyaman pandan', 45000, 1, 45000],
  [7, '13/10', 'Dimas', 'Kelas 10-1', 'Lilin aromaterapi', 15000, 2, 30000], [8, '14/10', 'Bu Sari', 'Lewat Nadia (11-2)', 'Gantungan kunci batik', 8000, 5, 40000],
  [9, '15/10', 'Pak Darto', 'Ruang guru', 'Tas anyaman pandan', 50000, 1, 50000], [10, '16/10', 'Bu Rina', 'Ruang guru', 'Lilin aromaterapi', 15000, 2, 30000],
  [11, '16/10', 'Bu Sari', 'Lewat Nadia (11-2)', 'Tas anyaman pandan', 45000, 2, 90000], [12, '17/10', 'Dimas', 'Kelas 11-1', 'Kaos sablon kelas', 60000, 1, 60000],
];
export const BAD_ROWS = { 6: 'Kontak Bu Rina ditulis "R. Guru", bukan "Ruang guru".', 11: 'Dipesan 16/10, jadi harga tas seharusnya Rp50.000, bukan Rp45.000.', 12: 'Kontak Dimas ditulis "Kelas 11-1", padahal di baris lain "Kelas 10-1".' };
export const SCHEMA = {
  pelanggan: { cols: ['id_pelanggan', 'nama', 'kontak'], pk: 'id_pelanggan', rows: [['C01', 'Bu Rina', 'Ruang guru'], ['C02', 'Pak Joko', 'Pos satpam'], ['C03', 'Dimas', 'Kelas 10-1'], ['C04', 'Bu Sari', 'Lewat Nadia (11-2)'], ['C05', 'Pak Darto', 'Ruang guru']] },
  produk: { cols: ['id_produk', 'nama_produk', 'harga'], pk: 'id_produk', rows: [['P01', 'Gantungan kunci batik', 8000], ['P02', 'Tas anyaman pandan', 50000], ['P03', 'Kaos sablon kelas', 60000], ['P04', 'Lilin aromaterapi', 15000]] },
  pesanan: { cols: ['id_pesanan', 'tanggal', 'id_pelanggan', 'id_produk', 'jumlah', 'harga_satuan'], pk: 'id_pesanan', fk: { id_pelanggan: 'pelanggan', id_produk: 'produk' }, rows: [[1, '6/10', 'C01', 'P01', 3, 8000], [2, '6/10', 'C03', 'P01', 2, 8000], [3, '7/10', 'C02', 'P04', 1, 15000], [4, '8/10', 'C04', 'P02', 1, 45000], [5, '9/10', 'C05', 'P03', 2, 60000], [6, '10/10', 'C01', 'P02', 1, 45000], [7, '13/10', 'C03', 'P04', 2, 15000], [8, '14/10', 'C04', 'P01', 5, 8000], [9, '15/10', 'C05', 'P02', 1, 50000], [10, '16/10', 'C01', 'P04', 2, 15000], [11, '16/10', 'C04', 'P02', 2, 50000], [12, '17/10', 'C03', 'P03', 1, 60000]] },
};
const JP = 'JOIN produk ON pesanan.id_produk = produk.id_produk';
const JC = 'JOIN pelanggan ON pesanan.id_pelanggan = pelanggan.id_pelanggan';
// Card queries: [id, title, [card, text, sql of the table after this card]]
export const CARDQ = [
  ['K1', 'Produk di bawah Rp20.000', [['', 'produk', 'SELECT * FROM produk'], ['SARING', 'harga < 20000', 'SELECT * FROM produk WHERE harga < 20000'], ['PILIH', 'nama_produk, harga', 'SELECT nama_produk, harga FROM produk WHERE harga < 20000']]],
  ['K2', 'Pesanan Bu Sari (C04)', [['', 'pesanan', 'SELECT * FROM pesanan'], ['SARING', "id_pelanggan = 'C04'", "SELECT * FROM pesanan WHERE id_pelanggan = 'C04'"], ['PILIH', 'id_pesanan, tanggal, jumlah', "SELECT id_pesanan, tanggal, jumlah FROM pesanan WHERE id_pelanggan = 'C04'"]]],
  ['K3', 'Pesanan tas anyaman pandan', [['GABUNG', 'pesanan dan produk lewat id_produk', `SELECT id_pesanan, pesanan.id_produk, nama_produk, jumlah, harga_satuan FROM pesanan ${JP}`], ['SARING', "nama_produk = 'Tas anyaman pandan'", `SELECT id_pesanan, pesanan.id_produk, nama_produk, jumlah, harga_satuan FROM pesanan ${JP} WHERE nama_produk = 'Tas anyaman pandan'`], ['PILIH', 'id_pesanan, jumlah, harga_satuan', `SELECT id_pesanan, jumlah, harga_satuan FROM pesanan ${JP} WHERE nama_produk = 'Tas anyaman pandan'`]]],
  ['K4', 'Banyak terjual per produk', [['', 'pesanan', 'SELECT id_pesanan, id_produk, jumlah FROM pesanan ORDER BY id_produk, id_pesanan'], ['KELOMPOKKAN', 'per id_produk, SUM(jumlah)', 'SELECT id_produk, SUM(jumlah) FROM pesanan GROUP BY id_produk']]],
  ['K5', 'Total belanja per pelanggan', [['GABUNG', 'pesanan dan pelanggan lewat id_pelanggan', `SELECT id_pesanan, nama, jumlah, harga_satuan, jumlah * harga_satuan AS subtotal FROM pesanan ${JC}`], ['KELOMPOKKAN', 'per nama, SUM(jumlah × harga_satuan)', `SELECT nama, SUM(jumlah * harga_satuan) AS total FROM pesanan ${JC} GROUP BY nama`], ['URUTKAN', 'dari yang terbesar', `SELECT nama, SUM(jumlah * harga_satuan) AS total FROM pesanan ${JC} GROUP BY nama ORDER BY total DESC`]]],
];
export const SQLQ = {
  K1: 'SELECT nama_produk, harga\nFROM produk\nWHERE harga < 20000;',
  K2: "SELECT id_pesanan, tanggal, jumlah\nFROM pesanan\nWHERE id_pelanggan = 'C04';",
  K3: `SELECT id_pesanan, jumlah, harga_satuan\nFROM pesanan\n${JP}\nWHERE nama_produk = 'Tas anyaman pandan';`,
  K4: 'SELECT id_produk, SUM(jumlah) AS total_terjual\nFROM pesanan\nGROUP BY id_produk;',
  K5: `SELECT pelanggan.nama, SUM(jumlah * harga_satuan) AS total\nFROM pesanan\n${JC}\nGROUP BY pelanggan.nama\nORDER BY total DESC;`,
  '4c': `SELECT pelanggan.nama, COUNT(*) AS banyak_pesanan\nFROM pesanan\n${JC}\nGROUP BY pelanggan.nama\nORDER BY banyak_pesanan DESC, pelanggan.nama;`,
  '4d': 'SELECT nama_produk, SUM(jumlah)\nFROM pesanan\nGROUP BY id_produk;',
  '4d✓': `SELECT produk.nama_produk, SUM(pesanan.jumlah) AS total_terjual\nFROM pesanan\n${JP}\nGROUP BY produk.nama_produk;`,
  '4e': "INSERT INTO produk (id_produk, nama_produk, harga)\nVALUES ('P05', 'Pembatas buku', 5000);\n\nDELETE FROM pesanan WHERE id_pesanan = 3;\n\nSELECT * FROM pelanggan;",
  '5a': "UPDATE produk SET harga = 18000 WHERE id_produk = 'P04';\n\nSELECT * FROM produk;",
  Tantangan: `SELECT pelanggan.nama, SUM(pesanan.jumlah * pesanan.harga_satuan) AS total_belanja\nFROM pesanan\n${JC}\nGROUP BY pelanggan.nama\nHAVING total_belanja > 100000\nORDER BY total_belanja DESC;`,
};
export const SPLIT = [['tanggal', 'Tanggal', 'pesanan'], ['pelanggan', 'Pelanggan (nama)', 'pelanggan'], ['kontak', 'Kontak', 'pelanggan'], ['produk', 'Produk (nama)', 'produk'], ['harga', 'Harga', 'dua'], ['jumlah', 'Jumlah', 'pesanan'], ['total', 'Total', 'tidak']];
const SPLIT_OPTS = [['pelanggan', 'pelanggan'], ['produk', 'produk'], ['pesanan', 'pesanan'], ['dua', 'produk dan pesanan'], ['tidak', 'tidak disimpan']];
const SPLIT_WHY = { tanggal: 'Tanggal milik setiap pesanan.', pelanggan: 'Nama cukup ditulis sekali di tabel pelanggan.', kontak: 'Kontak melekat pada pelanggan.', produk: 'Nama produk cukup ditulis sekali di tabel produk.', harga: 'Harga sekarang di produk, dan harga pada hari pesanan di pesanan.harga_satuan.', jumlah: 'Jumlah milik setiap pesanan.', total: 'Total dihitung dari jumlah × harga_satuan, jadi tidak perlu disimpan.' };
export const ANOMALY = [['b', 'b. Baris 6, 11, 12 bertentangan dengan baris lain', 'ubah'], ['c', 'c. Total tercatat Rp565.000, padahal seharusnya Rp575.000', 'ubah'], ['d', 'd. Pembatas buku belum bisa dicatat karena belum ada yang memesan', 'sisip'], ['e', 'e. Menghapus pesanan Pak Joko ikut menghapus kontaknya', 'hapus']];
const ANOM_OPTS = [['ubah', 'pembaruan'], ['sisip', 'penyisipan'], ['hapus', 'penghapusan']];

const money = (v) => (typeof v === 'number' && v >= 1000 ? fmtNum(v) : String(v ?? 'NULL'));

// --- view pieces ---
function tableView(cols, rows, { cap = null, fmt = false, cls = '', hl = null, onRow = null, rowCls = null, rowAttr = null } = {}) {
  return el('div', { class: `sq-tabel-wadah ${cls}` }, cap ? el('b', { class: 'sq-cap' }, cap) : null, el('table', { class: 'sq-tabel' }, el('tr', null, cols.map((c) => el('th', null, c))), rows.length ? rows.map((r, i) => {
    const tr = el('tr', { class: `${hl && hl(r, i) ? 'hl' : ''} ${rowCls ? rowCls(r, i) : ''}`, ...(rowAttr ? rowAttr(r, i) : {}) }, r.map((v) => el('td', { class: typeof v === 'number' ? 'n' : '' }, fmt ? money(v) : String(v ?? 'NULL'))));
    return onRow ? onTap(tr, () => onRow(r, i, tr)) : tr;
  }) : el('tr', null, el('td', { colspan: cols.length, class: 'kosong' }, '(tidak ada baris)'))));
}
const resultView = (r, opts = {}) => (r.kind === 'rows' ? tableView(r.cols, r.rows, opts) : el('p', { class: 'sq-info' }, `✓ ${r.text}`));
const BIG_COLS = ['No.', 'Tanggal', 'Pelanggan', 'Kontak', 'Produk', 'Harga', 'Jumlah', 'Total'];

function cardText(q) { return q[2].map(([c, t]) => (c ? `${c} ${t}` : t)).join(' → '); }

// ---------- Permainan: Basis Data Antikacau ----------
// Every round is a mission against the Pengacau Data, who throws one chaos card.
const HEAD34 = {
  rina: ['Selidiki Tabel Besar', 'Hitung salinan Bu Rina, lalu temukan tiga baris yang bertentangan.', 'Catatan Nadia penuh salinan, dan ada yang tidak cocok!'],
  uang: ['Uang yang Hilang', 'Hitung uang yang seharusnya diterima, lalu beri nama setiap anomali.', 'Kas toko kurang Rp10.000!'],
  pecah: ['Pecah Tiga Tabel', 'Setiap fakta cukup disimpan di satu tabel.', 'Tabel besar terlalu kacau untuk ditambal.'],
  kunci: ['Pasang Kunci', 'Kunci primer di setiap tabel, kunci asing di tabel pesanan.', 'Ada pelanggan bernama sama? Nama tidak bisa jadi kunci!'],
  k12: ['Kueri Kartu K1 dan K2', 'Susun kartu; tabel antara muncul setelah setiap kartu.', 'Kartu kueri diacak dengan kartu jebakan.'],
  k34: ['Kueri Kartu K3 dan K4', 'Gabungkan tabel bila kolomnya ada di tabel lain.', 'Kolom yang dicari tersebar di dua tabel.'],
  k5: ['Kueri Kartu K5', 'Siapa pelanggan dengan belanja terbesar?', 'Pertanyaannya diganti di tengah jalan!'],
  sql: ['Terjemahkan ke SQL', 'Rakit SQL dari ubin, satu klausa per baris.', 'Ubin SQL palsu diselipkan.'],
  sabot: ['Kueri Disabotase', 'Temukan bagian yang salah, lalu perbaiki dengan ubin.', 'Satu baris kueri dihapus diam-diam!'],
  bos: ['Pelanggan Setia', 'Atasi harga lilin naik, lalu cari pelanggan yang belanja di atas Rp100.000.', 'Harga lilin naik menjadi Rp18.000!'],
};
const msg34 = (t) => el('p', { class: 'reveal info' }, t);

export const MONEY_CHIPS = ['45.000', '50.000', '90.000', '100.000', '565.000', '575.000', '585.000'];
export const MONEY_WANT = ['50.000', '100.000', '575.000'];
export const ANOM_CARDS = [['ubah', 'pembaruan'], ['ubah', 'pembaruan'], ['sisip', 'penyisipan'], ['hapus', 'penghapusan']];
// [key, card, target table, column name there]
export const SPLIT34 = [['tanggal', 'Tanggal', 'pesanan', 'tanggal'], ['nama', 'Nama pelanggan', 'pelanggan', 'nama'], ['kontak', 'Kontak', 'pelanggan', 'kontak'], ['produk', 'Nama produk', 'produk', 'nama_produk'], ['harga', 'Harga sekarang', 'produk', 'harga'], ['hsat', 'Harga saat dipesan', 'pesanan', 'harga_satuan'], ['jumlah', 'Jumlah', 'pesanan', 'jumlah'], ['total', 'Total', 'buang', '']];
const SPLIT_HINT = { pelanggan: 'Kolom ini menerangkan orangnya, jadi cukup ditulis sekali untuk setiap pelanggan.', produk: 'Kolom ini menerangkan barangnya, jadi cukup ditulis sekali untuk setiap produk.', pesanan: 'Kolom ini bisa berbeda di setiap pesanan.', buang: 'Total bisa dihitung dari jumlah × harga saat dipesan. Bila disimpan juga, keduanya bisa tidak cocok lagi.' };
export const KEY_CHIPS = ['id_pelanggan', 'id_pelanggan', 'id_produk', 'id_produk', 'id_pesanan', 'nama', 'tanggal'];
const KEY_TABLES = [['pelanggan', ['pk', 'nama', 'kontak']], ['produk', ['pk', 'nama_produk', 'harga']], ['pesanan', ['pk', 'tanggal', 'fk1', 'fk2', 'jumlah', 'harga_satuan']]];
export const PRICE_CHIPS = ['45000', '50000', '90000', '100000'];

const aggName = (c) => (c.fn === 'COUNT' ? 'banyak' : c.fn === 'SUBTOTAL' ? 'total' : `total_${c.of}`);
const usesCols = (c) => (c.k === 'SARING' || c.k === 'URUTKAN' ? [c.col] : c.k === 'PILIH' ? c.cols : c.k === 'GABUNG' ? [`id_${c.table}`] : c.k === 'KELOMPOKKAN' ? [c.col, ...(c.fn === 'SUM' ? [c.of] : c.fn === 'SUBTOTAL' ? ['jumlah', 'harga_satuan'] : [])] : []);
const lit = (v) => (typeof v === 'number' ? String(v) : `'${v}'`);
export const cardLabel = (c) => (c.k === 'SARING' ? `${c.col} ${c.op} ${lit(c.val)}` : c.k === 'PILIH' ? c.cols.join(', ') : c.k === 'GABUNG' ? `${c.table} lewat id_${c.table}` : c.k === 'KELOMPOKKAN' ? `per ${c.col}, ${c.fn === 'COUNT' ? 'COUNT(*)' : c.fn === 'SUBTOTAL' ? 'SUM(jumlah × harga_satuan)' : `SUM(${c.of})`}` : `${c.col} ${c.desc ? 'besar → kecil' : 'kecil → besar'}`);
function availCols(from, placed) {
  let cols = [...SCHEMA[from].cols];
  for (const c of placed) {
    if (c.k === 'GABUNG') cols = [...new Set([...cols, ...SCHEMA[c.table].cols])];
    else if (c.k === 'PILIH') cols = [...c.cols];
    else if (c.k === 'KELOMPOKKAN') cols = [c.col, aggName(c)];
  }
  return cols;
}

// Card queries for the game: the needed cards in one valid order plus trap cards with a hint.
export const CQ = {
  K1: { from: 'produk', title: 'K1 · Produk di bawah Rp20.000', need: ['s', 'p'], win: 'K1: gantungan kunci batik (Rp8.000) dan lilin aromaterapi (Rp15.000).', cards: {
    s: { k: 'SARING', col: 'harga', op: '<', val: 20000 },
    p: { k: 'PILIH', cols: ['nama_produk', 'harga'] },
    x1: { k: 'SARING', col: 'harga', op: '>', val: 20000, hint: 'Tanda > menyisakan produk yang lebih mahal dari Rp20.000.' },
    x2: { k: 'URUTKAN', col: 'harga', desc: false, hint: 'Mengurutkan tidak membuang produk yang mahal; semua produk tetap ada.' } } },
  K2: { from: 'pesanan', title: 'K2 · Pesanan Bu Sari (C04)', need: ['s', 'p'], win: 'K2: pesanan 4, 8, dan 11.', cards: {
    s: { k: 'SARING', col: 'id_pelanggan', op: '=', val: 'C04' },
    p: { k: 'PILIH', cols: ['id_pesanan', 'tanggal', 'jumlah'] },
    x1: { k: 'SARING', col: 'id_pelanggan', op: '=', val: 'C01', hint: 'C01 adalah Bu Rina. Bu Sari C04.' },
    x2: { k: 'GABUNG', table: 'produk', hint: 'Pertanyaan ini tidak butuh nama produk; cukup tabel pesanan.' } } },
  K3: { from: 'pesanan', title: 'K3 · Pesanan tas anyaman pandan', need: ['g', 's', 'p'], view: ['id_pesanan', 'pesanan.id_produk', 'nama_produk', 'jumlah', 'harga_satuan'], win: 'K3: pesanan 4, 6, 9, dan 11.', cards: {
    g: { k: 'GABUNG', table: 'produk' },
    s: { k: 'SARING', col: 'nama_produk', op: '=', val: 'Tas anyaman pandan' },
    p: { k: 'PILIH', cols: ['id_pesanan', 'jumlah', 'harga_satuan'] },
    x1: { k: 'GABUNG', table: 'pelanggan', hint: 'Nama produk ada di tabel produk, bukan di tabel pelanggan.' },
    x2: { k: 'SARING', col: 'id_produk', op: '=', val: 'P01', hint: 'P01 adalah gantungan kunci batik; tas anyaman pandan P02.' } } },
  K4: { from: 'pesanan', title: 'K4 · Banyak terjual per produk', need: ['k'], win: 'K4: P01 10, P02 5, P03 3, P04 5.', cards: {
    k: { k: 'KELOMPOKKAN', col: 'id_produk', fn: 'SUM', of: 'jumlah' },
    x1: { k: 'KELOMPOKKAN', col: 'id_produk', fn: 'COUNT', hint: 'COUNT menghitung banyak pesanan, bukan banyak barang yang terjual.' },
    x2: { k: 'KELOMPOKKAN', col: 'id_pelanggan', fn: 'SUM', of: 'jumlah', hint: 'Yang ditanya per produk, bukan per pelanggan.' },
    x3: { k: 'SARING', col: 'jumlah', op: '>', val: 1, hint: 'Pesanan berisi 1 barang juga terjual; jangan dibuang.' } } },
  K5: { from: 'pesanan', title: 'K5 · Total belanja per pelanggan', need: ['g', 'k', 'u'], view: ['id_pesanan', 'nama', 'jumlah', 'harga_satuan'], win: 'K5: Bu Sari 185.000, Pak Darto 170.000, Dimas 106.000, Bu Rina 99.000, Pak Joko 15.000.', cards: {
    g: { k: 'GABUNG', table: 'pelanggan' },
    k: { k: 'KELOMPOKKAN', col: 'nama', fn: 'SUBTOTAL' },
    u: { k: 'URUTKAN', col: 'total', desc: true },
    x1: { k: 'URUTKAN', col: 'total', desc: false, hint: 'Yang diminta dari yang terbesar: besar → kecil.' },
    x2: { k: 'KELOMPOKKAN', col: 'nama', fn: 'SUM', of: 'jumlah', hint: 'SUM(jumlah) menghitung banyak barang, bukan rupiah.' },
    x3: { k: 'GABUNG', table: 'produk', hint: 'Nama pelanggan ada di tabel pelanggan.' } } },
};

export const COUNT_SQL = 'SELECT nama, COUNT(*) AS banyak\nFROM pesanan\nJOIN pelanggan ON pesanan.id_pelanggan\n  = pelanggan.id_pelanggan\nGROUP BY nama\nORDER BY nama;';
export const COUNT_WANT = ['3', '3', '3', '2', '1'];
export const COUNT_CHIPS = ['1', '2', '3', '3', '3', '4'];
// SQL tiles: [id, text, hint for a trap]; `slots` lists the wanted tile per line, strings are fixed lines.
export const SQLT = {
  K2: { slots: ['sel', 'from', 'where'], tiles: [['sel', 'SELECT id_pesanan, tanggal, jumlah'], ['from', 'FROM pesanan'], ['where', "WHERE id_pelanggan = 'C04';"], ['x1', 'FROM pelanggan', 'Kolom id_pesanan, tanggal, dan jumlah ada di tabel pesanan.'], ['x2', 'WHERE id_pelanggan = C04;', "Teks di SQL diapit petik tunggal: 'C04'. Tanpa petik, C04 dibaca sebagai nama kolom."], ['x3', 'ORDER BY id_pelanggan;', 'ORDER BY hanya mengurutkan; pesanan pelanggan lain tetap ada.']] },
  K4: { slots: ['sel', 'from', 'grp'], tiles: [['sel', 'SELECT id_produk, SUM(jumlah)'], ['from', 'FROM pesanan'], ['grp', 'GROUP BY id_produk;'], ['x1', 'SELECT id_produk, jumlah', 'Tanpa SUM, jumlah di setiap kelompok tidak dijumlahkan.'], ['x2', 'WHERE SUM(jumlah) > 0', 'SUM tidak bisa dipakai di WHERE; WHERE menyaring baris satu per satu.'], ['x3', 'GROUP BY jumlah;', 'Kelompokkan per produk, bukan per jumlah.']] },
  fix: { slots: ['SELECT nama_produk, SUM(jumlah)', 'FROM pesanan', 'join', 'GROUP BY nama_produk;'], tiles: [['join', 'JOIN produk ON pesanan.id_produk\n  = produk.id_produk'], ['x1', 'JOIN pelanggan ON pesanan.id_pelanggan\n  = pelanggan.id_pelanggan', 'nama_produk ada di tabel produk, bukan di tabel pelanggan.'], ['x2', 'FROM produk', 'Satu kueri hanya punya satu FROM; tabel kedua masuk lewat JOIN … ON.']] },
  ubah: { free: true, slots: [{ label: '🆕 Produk baru: pembatas buku Rp5.000, belum ada yang memesan' }, 'ins', 'val', { label: '❌ Pesanan 3 (Pak Joko, lilin) dibatalkan' }, 'del', 'whr'], tiles: [['ins', 'INSERT INTO produk'], ['val', "VALUES ('P05', 'Pembatas buku', 5000);"], ['del', 'DELETE FROM pesanan'], ['whr', 'WHERE id_pesanan = 3;'], ['x1', 'DELETE FROM pelanggan', 'Yang batal pesanannya, bukan pelanggannya. Pak Joko tetap pelanggan toko.'], ['x2', 'INSERT INTO pesanan', 'Belum ada yang memesan pembatas buku; yang baru adalah produknya.'], ['x3', "WHERE id_pelanggan = 'C02';", 'Hapus pesanan nomor 3 saja, bukan semua milik C02.']] },
  harga: { slots: ['upd', 'set', 'whr'], tiles: [['upd', 'UPDATE produk'], ['set', 'SET harga = 18000'], ['whr', "WHERE id_produk = 'P04';"], ['x1', 'UPDATE pesanan', 'Harga sekarang disimpan di tabel produk. Pesanan lama tetap memakai harga pada harinya.'], ['x2', 'SET harga_satuan = 18000', 'harga_satuan ada di tabel pesanan: harga pada hari pesanan.'], ['x3', "WHERE id_produk = 'P01';", 'P01 adalah gantungan kunci batik; lilin aromaterapi P04.']] },
  setia: { slots: ['sel', 'from', 'join', 'grp', 'hav', 'ord'], tiles: [['sel', 'SELECT nama,\n  SUM(jumlah * harga_satuan) AS total'], ['from', 'FROM pesanan'], ['join', 'JOIN pelanggan ON pesanan.id_pelanggan\n  = pelanggan.id_pelanggan'], ['grp', 'GROUP BY nama'], ['hav', 'HAVING total > 100000'], ['ord', 'ORDER BY total DESC;'], ['x1', 'WHERE total > 100000', 'WHERE menyaring baris sebelum dikelompokkan, saat total belum ada. Saring kelompok dengan HAVING.'], ['x2', 'ORDER BY total ASC;', 'ASC dari yang terkecil. Dari yang terbesar: DESC.'], ['x3', 'GROUP BY id_pesanan', 'Kelompokkan per pelanggan, bukan per pesanan.']] },
};
// Sabotaged query: tokens, the wrong ones marked.
const SABOT = [[['SELECT', 'kw'], ['nama_produk', 'salah'], [','], ['SUM(jumlah)', 'ok']], [['FROM', 'kw'], ['pesanan', 'tabel']], [['GROUP BY', 'kw'], ['nama_produk', 'salah'], [';']]];
const SABOT_SQL = 'SELECT nama_produk, SUM(jumlah)\nFROM pesanan\nGROUP BY nama_produk;';
const SABOT_HINT = { kw: 'Kata kunci ini benar.', tabel: 'Tabel pesanan memang sumbernya. Kolom mana yang tidak ada di tabel pesanan?', ok: 'Kolom jumlah ada di tabel pesanan, jadi SUM(jumlah) benar.' };
export const LILIN_CHIPS = ['3.000', '15.000', '18.000', '90.000'];

// Blanks filled left to right from a chip tray. Returns the board.
function formula34(ctx, { oops, msg, lines, chips, want, hints, done, cls = '' }) {
  let k = 0; const blanks = [];
  const mk = () => { const b = el('span', { class: 'sq34-celah', 'data-drop': String(blanks.length) }, '?'); blanks.push(b); return b; };
  const rows = el('div', { class: `sq34-rumus ${cls}` }, lines.map((parts) => el('div', null, parts.map((p) => (p === '_' ? mk() : p)))));
  const tray = el('div', { class: 'sq34-angka-angka' }, ctx.rand.shuffle(chips.slice()).map((c) => el('div', { class: 'sq34-angka', 'data-drag': c }, c)));
  const host = el('div', { class: 'sq34-papan' }, rows, tray);
  dnd(host, (chip, blank) => {
    if (k >= want.length || !blank.classList.contains('sq34-celah')) return;
    if (+blank.dataset.drop !== k) { say(msg, 'info', 'Isi dari atas ke bawah, kiri ke kanan.'); return; }
    if (chip.dataset.drag !== want[k]) { oops(); shake(chip); say(msg, 'bad', hints[Math.min(k, hints.length - 1)]); return; }
    blank.textContent = want[k]; blank.classList.add('isi'); chip.remove(); ctx.sound.tap(); k++;
    if (k < want.length) { say(msg, 'info', 'Tepat.'); return; }
    done();
  });
  return host;
}

// Cards dropped onto rows; check(card, row) returns '' when right or a hint.
function rowBoard34(ctx, { oops, msg, items, rows, check, done }) {
  let left = rows.length;
  const rowEls = rows.map(([k, t]) => el('div', { class: 'sq34-baris', 'data-drop': k }, el('span', { class: 'sq34-slot' }, '?'), el('span', null, t)));
  const tray = el('div', { class: 'sq34-baki' }, ctx.rand.shuffle(items.slice()).map(([k, t]) => el('div', { class: 'sq34-kartu-nama', 'data-drag': k }, t)));
  const host = el('div', { class: 'sq34-papan' }, el('div', { class: 'sq34-baris-baris' }, rowEls), tray);
  dnd(host, (card, row) => {
    if (!left || row.classList.contains('isi') || !row.classList.contains('sq34-baris')) return;
    const why = check(card.dataset.drag, row.dataset.drop);
    if (why) { oops(); shake(card); say(msg, 'bad', why); return; }
    card.classList.add('locked'); row.querySelector('.sq34-slot').replaceWith(card); row.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, 'info', 'Tepat.'); return; }
    done();
  });
  return host;
}

// SQL tiles: lines are fixed text, a label, or a slot that wants one tile.
function tileBoard(ctx, { oops, msg, spec, onFull }) {
  const wants = spec.slots.filter((s) => typeof s === 'string' && spec.tiles.some((t) => t[0] === s));
  const slots = []; const got = [];
  const lines = spec.slots.map((s) => {
    if (typeof s === 'object') return el('div', { class: 'sq34-label' }, s.label);
    if (!wants.includes(s)) return el('div', { class: 'sq34-tetap' }, s);
    const d = el('div', { class: 'sq34-ubin-slot', 'data-drop': String(slots.length), 'data-want': s }, el('span', { class: 'sq34-ph' }, '?'));
    slots.push(d); return d;
  });
  const tray = el('div', { class: 'sq34-ubin-baki' }, ctx.rand.shuffle(spec.tiles.slice()).map(([id, t]) => el('div', { class: 'sq34-ubin', 'data-drag': id }, t)));
  const code = el('div', { class: 'sq34-kode-susun' }, lines);
  const host = el('div', { class: 'sq34-ubin-papan' }, code, tray);
  dnd(host, (tile, slot) => {
    if (!slot.classList.contains('sq34-ubin-slot') || slot.classList.contains('isi')) return;
    const j = +slot.dataset.drop; const id = tile.dataset.drag;
    if (!spec.free && j !== got.length) { say(msg, 'info', 'Isi dari baris paling atas.'); return; }
    if (id !== slot.dataset.want) {
      oops(); shake(tile);
      const t = spec.tiles.find((x) => x[0] === id);
      say(msg, 'bad', t[2] || (spec.free ? 'Ubin ini untuk baris yang lain.' : 'Ubin ini untuk baris yang lain. Urutan SQL: SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY.'));
      return;
    }
    tile.classList.add('locked'); slot.replaceChildren(tile); slot.classList.add('isi'); got.push(id); ctx.sound.tap();
    if (got.length < slots.length) { say(msg, 'info', 'Tepat.'); return; }
    host.classList.add('selesai'); tray.remove();
    onFull(spec.slots.map((s) => (typeof s === 'object' ? '' : wants.includes(s) ? spec.tiles.find((x) => x[0] === s)[1] : s)).filter(Boolean).join('\n'));
  });
  return host;
}

const runRows = (db, sql) => { const r = db.run(sql); return r[r.length - 1]; };
const codeBox = (s) => el('pre', { class: 'sq34-kode' }, s);

// Misi 1a: count Bu Rina, then find the three conflicting rows.
function rinaRound(area, ctx, { oops, done }) {
  const msg = msg34('Ketuk setiap baris Bu Rina. Berapa kali nama dan kontaknya ditulis ulang?');
  const rina = new Set(); const bad = new Set(); let phase = 0;
  const box = el('div', { class: 'sq34-meja' });
  const draw = () => fill(box, tableView(BIG_COLS, BIG, { fmt: true, cls: 'sq34-besar', rowAttr: (r) => ({ 'data-no': r[0] }), rowCls: (r) => `${rina.has(r[0]) ? 'hl' : ''} ${bad.has(r[0]) ? 'temu' : ''}`, onRow: tap }));
  function tap(r) {
    const no = r[0];
    if (phase === 0) {
      if (rina.has(no)) return;
      if (r[2] !== 'Bu Rina') { oops(); say(msg, 'bad', `Baris ${no} milik ${r[2]}, bukan Bu Rina.`); return; }
      rina.add(no); ctx.sound.tap(); draw();
      if (rina.size < 3) { say(msg, 'info', `Bu Rina ditemukan ${rina.size} kali.`); return; }
      phase = 1; say(msg, 'info', 'Bu Rina ditulis 3 kali. Sekarang ketuk tiga baris yang bertentangan. Petunjuk: harga tas naik menjadi Rp50.000 mulai 15/10.');
      return;
    }
    if (phase !== 1 || bad.has(no)) return;
    if (!BAD_ROWS[no]) { oops(); say(msg, 'bad', `Baris ${no} cocok dengan baris lain. Bandingkan kontak setiap nama, dan harga tas menurut tanggalnya.`); return; }
    bad.add(no); ctx.sound.good(); draw();
    if (bad.size < 3) { say(msg, 'info', `Baris ${no}: ${BAD_ROWS[no]}`); return; }
    phase = 2; say(msg, '', `Baris ${no}: ${BAD_ROWS[no]} Fakta yang ditulis berulang mudah bertentangan.`); done();
  }
  draw(); area.append(box, msg);
}

// Misi 1b: the missing money, then name each anomaly.
function uangRound(area, ctx, { oops, done }) {
  const msg = msg34('Kolom Total dijumlahkan: Rp565.000. Tapi baris 11 dipesan 16/10, setelah harga tas naik.');
  const board = formula34(ctx, { oops, msg, chips: MONEY_CHIPS, want: MONEY_WANT,
    lines: [['Baris 11: 2 × ', '_', ' = ', '_'], ['Seharusnya: 565.000 − 90.000 + 100.000 = ', '_']],
    hints: ['Berapa harga tas mulai 15/10?', '2 × 50.000.', '565.000 − 90.000 + 100.000.'],
    done: () => { say(msg, '', 'Toko seharusnya menerima Rp575.000. Satu harga yang lupa diperbarui membuat kas kurang Rp10.000.'); setTimeout(names, 2600); } });
  area.append(tableView(BIG_COLS, BIG.filter((r) => r[0] === 11), { fmt: true, cls: 'sq34-sebaris' }), board, msg);
  function names() {
    say(msg, 'info', 'Pembaruan: data yang sama harus diubah di banyak baris. Penyisipan: data baru tidak bisa dicatat. Penghapusan: menghapus satu hal ikut menghapus hal lain.');
    fill(area, rowBoard34(ctx, { oops, msg, items: ANOM_CARDS, rows: ANOMALY.map(([k, t]) => [k, t.slice(3)]),
      check: (card, row) => (ANOMALY.find((a) => a[0] === row)[2] === card ? '' : 'Masalahnya muncul saat data diubah, ditambah, atau dihapus?'),
      done: () => { say(msg, '', 'Dua anomali pembaruan, satu penyisipan, satu penghapusan. Obatnya: pecah tabel besar.'); done(); } }), msg);
  }
}

// Misi 2a: column cards into three tables or the "computed" bin.
function pecahRound(area, ctx, { oops, done }) {
  const msg = msg34('Seret setiap kolom tabel besar ke tabel yang tepat. Kolom yang bisa dihitung tidak perlu disimpan.');
  let left = SPLIT34.length;
  const boxes = ['pelanggan', 'produk', 'pesanan'].map((t) => el('div', { class: 'sq34-wadah', 'data-drop': t }, el('b', null, `📁 ${t}`), el('div', { class: 'sq34-kolom-kolom' })));
  const bin = el('div', { class: 'sq34-wadah buang', 'data-drop': 'buang' }, el('b', null, '🧮 tidak disimpan, dihitung saja'), el('div', { class: 'sq34-kolom-kolom' }));
  const tray = el('div', { class: 'sq34-baki' }, ctx.rand.shuffle(SPLIT34.slice()).map(([k, t]) => el('div', { class: 'sq34-kartu-nama', 'data-drag': k }, t)));
  const host = el('div', { class: 'sq34-papan' }, el('div', { class: 'sq34-wadah-wadah' }, boxes, bin), tray);
  dnd(host, (card, box) => {
    box = box.closest('.sq34-wadah'); if (!box || !left) return;
    const [, t, want, col] = SPLIT34.find((s) => s[0] === card.dataset.drag);
    if (box.dataset.drop !== want) { oops(); shake(card); say(msg, 'bad', `${t}: ${SPLIT_HINT[want]}`); return; }
    card.remove(); box.querySelector('.sq34-kolom-kolom').append(el('span', { class: 'sq34-kolom' }, col || t)); ctx.sound.tap();
    if (--left) { say(msg, 'info', want === 'buang' ? SPLIT_HINT.buang : `${t} → ${want}.${col}`); return; }
    say(msg, '', 'Setiap tabel kini menyimpan satu jenis hal. Tapi bagaimana pesanan tahu siapa pemesannya? Itu tugas kunci.'); done();
  });
  area.append(host, msg);
}

// Misi 2b: primary and foreign keys, then the order-day price.
function kunciRound(area, ctx, { oops, done }) {
  const msg = msg34('Seret kunci: 🔑 kunci primer membuat setiap baris unik; 🔗 kunci asing menunjuk ke baris di tabel lain.');
  let left = 5; const fk = [];
  const slot = (t, c) => (c === 'pk' ? el('span', { class: 'sq34-kunci pk', 'data-drop': `pk-${t}` }, '🔑 ?') : /^fk/.test(c) ? el('span', { class: 'sq34-kunci fk', 'data-drop': c }, '🔗 ?') : el('span', { class: 'sq34-kolom' }, c));
  const tabs = el('div', { class: 'sq34-skema' }, KEY_TABLES.map(([t, cs]) => el('div', { class: 'sq34-skema-tabel' }, el('b', null, `📁 ${t}`), el('div', { class: 'sq34-kolom-kolom' }, cs.map((c) => slot(t, c))))));
  const tray = el('div', { class: 'sq34-angka-angka' }, ctx.rand.shuffle(KEY_CHIPS.slice()).map((c) => el('div', { class: 'sq34-angka kunci', 'data-drag': c }, c)));
  const host = el('div', { class: 'sq34-papan' }, tabs, tray);
  dnd(host, (chip, s) => {
    if (!left || !s.classList.contains('sq34-kunci') || s.classList.contains('isi')) return;
    const c = chip.dataset.drag; const d = s.dataset.drop; let why = '';
    if (c === 'nama') why = 'Dua pelanggan bisa bernama sama, dan nama bisa berubah. Kunci harus unik dan tetap.';
    else if (c === 'tanggal') why = 'Banyak pesanan terjadi pada tanggal yang sama; tanggal tidak unik.';
    else if (d.startsWith('pk-')) { const t = d.slice(3); if (c !== `id_${t}`) why = t === 'pesanan' ? 'Satu pelanggan bisa punya banyak pesanan, jadi kolom itu tidak unik di tabel pesanan. Setiap pesanan butuh nomornya sendiri.' : `Kunci primer tabel ${t} adalah nomor ${t} itu sendiri.`; }
    else if (c === 'id_pesanan') why = 'Kunci asing menunjuk ke tabel lain. id_pesanan adalah kunci primer pesanan sendiri.';
    else if (fk.includes(c)) why = 'Pesanan butuh dua penunjuk: satu ke pelanggan, satu ke produk.';
    if (why) { oops(); shake(chip); say(msg, 'bad', why); return; }
    if (!d.startsWith('pk-')) fk.push(c);
    chip.remove(); s.textContent = `${d.startsWith('pk-') ? '🔑' : '🔗'} ${c}`; s.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, 'info', 'Tepat.'); return; }
    say(msg, 'info', 'id_pelanggan di pesanan menunjuk ke baris pelanggan, id_produk ke baris produk. Nama cukup ditulis sekali.');
    setTimeout(price, 2800);
  });
  area.append(host, msg);
  function price() {
    say(msg, 'info', 'Harga tas naik menjadi 50000 mulai 15/10. Berapa harga_satuan pesanan 11?');
    fill(area, formula34(ctx, { oops, msg, chips: PRICE_CHIPS, want: ['50000'],
      lines: [['Pesanan 4 · 8/10 · P02 · harga_satuan 45000'], ['Pesanan 9 · 15/10 · P02 · harga_satuan 50000'], ['Pesanan 11 · 16/10 · P02 · harga_satuan ', '_']],
      hints: ['Pesanan 11 dibuat 16/10, sesudah harga naik.'],
      done: () => { say(msg, '', 'harga_satuan mencatat harga pada hari pesanan, jadi kenaikan harga nanti tidak mengubah pesanan lama.'); done(); } }), msg);
  }
}

// Misi 3: build a card query; the table after the last card shows on the right.
function cardQuery(area, ctx, { oops, msg, q, done }) {
  const placed = []; const ids = [];
  const now = el('div', { class: 'sq34-kini' });
  const show = () => {
    const db = makeDb(SCHEMA);
    let sql = buildSql({ from: q.from, cards: placed });
    if (q.view && placed.some((c) => c.k === 'GABUNG') && !placed.some((c) => c.k === 'PILIH' || c.k === 'KELOMPOKKAN')) sql = sql.replace('SELECT *', `SELECT ${q.view.join(', ')}`);
    const r = runRows(db, sql); const last = placed[placed.length - 1];
    fill(now, tableView(r.cols, r.rows, { fmt: true, cap: last ? `Setelah kartu ${placed.length}: ${last.k}` : `Tabel ${q.from}`, cls: `sq34-antara ${ids.length === q.need.length ? 'akhir' : ''}` }));
  };
  const slots = q.need.map((_, j) => el('div', { class: 'sq34-kartu-slot', 'data-drop': String(j) }, el('span', { class: 'sq34-ph' }, `Kartu ${j + 1}`)));
  const tray = el('div', { class: 'sq34-kartu-baki' }, ctx.rand.shuffle(Object.keys(q.cards)).map((id) => { const c = q.cards[id]; return el('div', { class: `sq34-kartu k-${c.k}`, 'data-drag': id }, el('b', null, c.k), el('span', null, cardLabel(c))); }));
  const left = el('div', { class: 'sq34-alur' }, el('b', { class: 'sq34-soal' }, q.title), el('div', { class: 'sq34-mulai' }, `📋 TABEL ${q.from}`), slots, tray);
  const host = el('div', { class: 'sq34-dua' }, left, now);
  const tableOf = (col) => Object.keys(SCHEMA).find((t) => SCHEMA[t].cols.includes(col));
  dnd(host, (card, slot) => {
    if (!slot.classList.contains('sq34-kartu-slot') || slot.classList.contains('isi') || ids.length >= q.need.length) return;
    if (+slot.dataset.drop !== ids.length) { say(msg, 'info', 'Pasang kartu dari atas ke bawah.'); return; }
    const id = card.dataset.drag; const c = q.cards[id];
    const no = (t) => { oops(); shake(card); say(msg, 'bad', t); };
    if (!q.need.includes(id)) return no(c.hint);
    const av = availCols(q.from, placed); const miss = usesCols(c).find((x) => !av.includes(x));
    if (miss) {
      if (placed.some((p) => p.k === 'KELOMPOKKAN')) return no(`Setelah dikelompokkan, tinggal kolom ${av.join(' dan ')}.`);
      if (placed.some((p) => p.k === 'PILIH')) return no(`Kolom ${miss} sudah dibuang oleh kartu PILIH.`);
      if (!tableOf(miss)) return no(`Kolom ${miss} baru ada setelah kartu KELOMPOKKAN.`);
      return no(`Kolom ${miss} ada di tabel ${tableOf(miss)}. Gabungkan dulu dengan kartu GABUNG.`);
    }
    const later = q.need.filter((x) => x !== id && !ids.includes(x)).flatMap((x) => usesCols(q.cards[x]));
    if (c.k === 'PILIH') { const lost = later.find((x) => !c.cols.includes(x)); if (lost) return no(`Kalau dipilih sekarang, kolom ${lost} hilang, padahal kartu lain masih membutuhkannya.`); }
    if (c.k === 'KELOMPOKKAN') { const lost = later.find((x) => x !== c.col && x !== aggName(c)); if (lost) return no(`Kalau dikelompokkan sekarang, kolom ${lost} hilang, padahal kartu lain masih membutuhkannya.`); }
    placed.push(c); ids.push(id); card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); ctx.sound.tap(); show();
    if (ids.length < q.need.length) { say(msg, 'info', `Kartu ${c.k} dipasang. Lihat tabelnya berubah.`); return; }
    tray.remove(); say(msg, '', q.win); done();
  });
  show();
  return host;
}

function cardPair(area, ctx, { oops, done }, a, b) {
  const msg = msg34('Seret kartu ke kotak Kartu 1, Kartu 2, dan seterusnya. Awas kartu jebakan.');
  area.append(cardQuery(area, ctx, { oops, msg, q: CQ[a], done: () => setTimeout(second, 2800) }), msg);
  function second() { say(msg, 'info', `Kueri berikutnya: ${CQ[b].title}.`); fill(area, cardQuery(area, ctx, { oops, msg, q: CQ[b], done }), msg); }
}

// Misi 3c: K5, then guess a COUNT result before it runs.
function k5Round(area, ctx, { oops, done }) {
  const msg = msg34('Siapa pelanggan dengan belanja terbesar? Susun kartunya.');
  area.append(cardQuery(area, ctx, { oops, msg, q: CQ.K5, done: () => setTimeout(count, 3000) }), msg);
  function count() {
    say(msg, 'info', 'Pertanyaan diganti: berapa kali setiap pelanggan memesan? Tebak hasil kueri ini sebelum dijalankan.');
    const db = makeDb(SCHEMA); const t = runRows(db, `SELECT id_pesanan, nama FROM pesanan ${JC}`);
    const names = runRows(db, COUNT_SQL).rows.map((r) => r[0]);
    const board = formula34(ctx, { oops, msg, chips: COUNT_CHIPS, want: COUNT_WANT, lines: names.map((n) => [`${n}: `, '_']), cls: 'jajar',
      hints: ['Hitung baris Bu Rina di tabel kiri.', 'Hitung baris Bu Sari.', 'Hitung baris Dimas.', 'Hitung baris Pak Darto.', 'Hitung baris Pak Joko.'],
      done: () => { say(msg, '', 'COUNT(*) menghitung baris di setiap kelompok. Bu Sari paling besar belanjanya, tapi Bu Rina dan Dimas sama seringnya memesan.'); done(); } });
    fill(area, el('div', { class: 'sq34-dua' }, tableView(t.cols, t.rows, { cap: 'pesanan + pelanggan', cls: 'sq34-antara' }), el('div', { class: 'sq34-tumpuk' }, codeBox(COUNT_SQL), board)), msg);
  }
}

// Misi 4: SQL from tiles for K2 and K4, run in the browser.
function sqlRound(area, ctx, { oops, done }) {
  const msg = msg34('Rakit SQL yang sama dengan kartu K2. Satu ubin satu baris.');
  const one = (key, after) => {
    const q = CQ[key]; const recipe = el('div', { class: 'sq34-resep' }, el('b', null, q.title), q.need.map((id) => { const c = q.cards[id]; return el('span', { class: `sq34-kartu kecil k-${c.k}` }, el('b', null, c.k), el('span', null, cardLabel(c))); }));
    const out = el('div', { class: 'sq34-keluar' });
    const board = tileBoard(ctx, { oops, msg, spec: SQLT[key], onFull: (sql) => { const r = runRows(makeDb(SCHEMA), sql); fill(out, tableView(r.cols, r.rows, { fmt: true, cap: '▶ hasil', cls: 'sq34-antara akhir' })); ctx.sound.good(); after(); } });
    fill(area, el('div', { class: 'sq34-dua' }, el('div', { class: 'sq34-tumpuk kiri' }, recipe, out), board), msg);
  };
  one('K2', () => { say(msg, '', 'Hasilnya sama dengan kartu K2: pesanan 4, 8, 11.'); setTimeout(() => { say(msg, 'info', 'Sekarang K4: banyak terjual per produk.'); one('K4', () => { say(msg, '', 'GROUP BY mengelompokkan, SUM menjumlahkan: P01 10, P02 5, P03 3, P04 5.'); done(); }); }, 2800); });
}

// Misi 5: tap the sabotaged part, add the missing JOIN, then INSERT and DELETE.
function sabotRound(area, ctx, { oops, done }) {
  const msg = msg34('Kueri ini galat. Ketuk bagian yang salah.');
  let found = false;
  const err = el('p', { class: 'sq34-galat' }, '⚠ Galat! Kueri tidak bisa dijalankan.');
  const code = el('div', { class: 'sq34-kode token' }, SABOT.map((line) => el('div', null, line.map(([t, kind]) => (kind ? onTap(el('button', { class: 'sq34-token', type: 'button', 'data-kind': kind }, t), (e) => {
    if (found) return;
    if (kind !== 'salah') { oops(); shake(e.currentTarget); say(msg, 'bad', SABOT_HINT[kind]); return; }
    found = true; e.currentTarget.classList.add('salah'); ctx.sound.tap();
    try { makeDb(SCHEMA).run(SABOT_SQL); } catch (x) { err.textContent = `⚠ ${x.message}`; }
    say(msg, 'info', 'Ketemu! Baris JOIN dihapus Pengacau Data. Pasang ubin yang hilang.'); setTimeout(fix, 1800);
  }) : el('span', null, t))))));
  const cols = el('p', { class: 'sq34-catatan' }, `Kolom pesanan: ${SCHEMA.pesanan.cols.join(', ')}`);
  area.append(el('div', { class: 'sq34-tumpuk' }, code, err, cols), msg);
  function fix() {
    const out = el('div', { class: 'sq34-keluar' });
    fill(area, el('div', { class: 'sq34-dua' }, tileBoard(ctx, { oops, msg, spec: SQLT.fix, onFull: (sql) => {
      const r = runRows(makeDb(SCHEMA), sql); err.remove(); fill(out, tableView(r.cols, r.rows, { cap: '▶ hasil', cls: 'sq34-antara akhir' })); ctx.sound.good();
      say(msg, '', 'Kueri jalan lagi: lilin dan tas sama-sama terjual 5.'); setTimeout(change, 3000);
    } }), el('div', { class: 'sq34-tumpuk' }, err, out)), msg);
  }
  function change() {
    say(msg, 'info', 'Dua kartu kekacauan lagi! Rakit SQL untuk setiap kartu.');
    const out = el('div', { class: 'sq34-keluar' });
    fill(area, el('div', { class: 'sq34-dua' }, tileBoard(ctx, { oops, msg, spec: SQLT.ubah, onFull: (sql) => {
      const db = makeDb(SCHEMA); db.run(sql);
      const pl = runRows(db, 'SELECT * FROM pelanggan;'); const pr = runRows(db, 'SELECT * FROM produk;');
      fill(out, tableView(pl.cols, pl.rows, { cap: 'pelanggan', cls: 'sq34-antara', hl: (r) => r[1] === 'Pak Joko' }), tableView(pr.cols, pr.rows, { fmt: true, cap: 'produk', cls: 'sq34-antara', hl: (r) => r[0] === 'P05' }));
      ctx.sound.good(); say(msg, '', 'Pembatas buku tercatat tanpa pesanan, dan Pak Joko tetap tersimpan walau pesanannya dihapus. Anomali penyisipan dan penghapusan teratasi.'); done();
    } }), out), msg);
  }
}

// Misi 6 and Bos: UPDATE the candle price, then the loyal-customer query.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg34('Harga lilin aromaterapi (P04) naik menjadi Rp18.000. Rakit SQL-nya.');
  const db = makeDb(SCHEMA); const out = el('div', { class: 'sq34-keluar' });
  fill(area, el('div', { class: 'sq34-dua' }, tileBoard(ctx, { oops, msg, spec: SQLT.harga, onFull: (sql) => {
    db.run(sql); const pr = runRows(db, 'SELECT * FROM produk;'); const ps = runRows(db, "SELECT id_pesanan, tanggal, jumlah, harga_satuan FROM pesanan WHERE id_produk = 'P04';");
    fill(out, tableView(pr.cols, pr.rows, { fmt: true, cap: 'produk', cls: 'sq34-antara', hl: (r) => r[0] === 'P04' }), tableView(ps.cols, ps.rows, { fmt: true, cap: 'pesanan lilin', cls: 'sq34-antara', hl: () => true }));
    ctx.sound.good(); say(msg, 'info', 'Harga di produk naik, tetapi pesanan 3, 7, dan 10 tetap Rp15.000 karena harga_satuan menyimpan harga pada hari pesanan.'); setTimeout(diff, 3200);
  } }), out), msg);
  function diff() {
    say(msg, 'info', 'Bagaimana kalau tidak ada harga_satuan dan total selalu dihitung dari harga di tabel produk?');
    fill(area, formula34(ctx, { oops, msg, chips: LILIN_CHIPS, want: ['15.000'], lines: [['5 lilin lama dihitung ulang:'], ['5 × (18.000 − 15.000) = ', '_']], hints: ['5 × 3.000.'],
      done: () => { say(msg, 'info', 'Laporan lama tiba-tiba bertambah Rp15.000, padahal uangnya tidak bertambah. Karena itu harga disimpan di setiap pesanan.'); setTimeout(boss, 3200); } }), msg);
  }
  function boss() {
    say(msg, 'info', 'Misi Bos: hadiah untuk pelanggan setia yang belanja lebih dari Rp100.000, urut dari yang terbesar.');
    const res = el('div', { class: 'sq34-keluar' });
    fill(area, el('div', { class: 'sq34-dua' }, tileBoard(ctx, { oops, msg, spec: SQLT.setia, onFull: (sql) => {
      const r = runRows(db, sql); fill(res, tableView(r.cols, r.rows, { fmt: true, cap: '🏆 pelanggan setia', cls: 'sq34-antara akhir' })); ctx.sound.good();
      say(msg, '', 'Pelanggan setia: Bu Sari 185.000, Pak Darto 170.000, Dimas 106.000. WHERE menyaring baris, HAVING menyaring kelompok.'); done();
    } }), res), msg);
  }
}

export default {
  id: 'sma-34-basis-data',
  title: 'Basis Data Toko Kerajinan Kelas',
  topic: 'Basis data relasional: anomali tabel tunggal, kunci primer dan asing, kueri pilih–saring–gabung–kelompokkan–urutkan, dan SQL',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🗄️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Rapikan catatan toko kerajinan kelas 11-2: temukan masalah tabel besar, pecah menjadi tabel pelanggan, produk, dan pesanan, jalankan kueri dengan kartu, lalu tulis dan perbaiki kueri SQL.',
  extraModes: [
    { id: 'kartu', icon: '🃏', label: 'Penyusun Kueri Visual', desc: 'Susun kartu SARING, PILIH, GABUNG, KELOMPOKKAN, dan URUTKAN; tabel antara tampil setelah setiap kartu, dan SQL setara muncul di sampingnya', create: createBuilder },
    { id: 'sql', icon: '⌨️', label: 'Penyunting SQL', desc: 'Ketik kueri SQL untuk tabel pelanggan, produk, dan pesanan; kueri dijalankan di dalam peramban, dan data bisa dikembalikan kapan saja', create: createEditor },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Hasil Kueri', desc: 'Satu tim memilih kueri kartu, tim lain menebak tabel hasilnya sebelum dijalankan; tebakan benar 2 poin, lalu peran bertukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act sq34-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'sq34-area' });
      let chaos = null;
      const go = (k, no) => {
        const [judul, tujuan, kacau] = HEAD34[k];
        chaos = el('div', { class: 'sq34-kacau' }, el('b', null, '🎭 Pengacau Data'), el('span', null, kacau));
        wrap.append(el('div', { class: 'sq34-kepala' }, misiHead(no, judul, tujuan, '🗄️'), chaos), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { chaos.classList.add('beres'); chaos.lastChild.textContent = 'Kekacauan teratasi ✓'; next(ms); } });
      if (r === 0) { go('rina', 1); rinaRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('uang', 1); uangRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('pecah', 2); pecahRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('kunci', 2); kunciRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('k12', 3); cardPair(area, ctx, fin(5500), 'K1', 'K2'); }
      else if (r === 5) { go('k34', 3); cardPair(area, ctx, fin(5500), 'K3', 'K4'); }
      else if (r === 6) { go('k5', 3); k5Round(area, ctx, fin(6000)); }
      else if (r === 7) { go('sql', 4); sqlRound(area, ctx, fin(5500)); }
      else if (r === 8) { go('sabot', 5); sabotRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

// --- Penyusun kueri visual ---
const COLS = Object.fromEntries(Object.entries(SCHEMA).map(([n, s]) => [n, s.cols]));
const JOINS = { pesanan: { produk: JP, pelanggan: JC }, produk: { pesanan: 'JOIN pesanan ON pesanan.id_produk = produk.id_produk' }, pelanggan: { pesanan: 'JOIN pesanan ON pesanan.id_pelanggan = pelanggan.id_pelanggan' } };
export function buildSql(st, upto = st.cards.length) {
  const cards = st.cards.slice(0, upto);
  const joins = cards.filter((c) => c.k === 'GABUNG').map((c) => c.table);
  const tables = [st.from, ...joins];
  const q = (c) => (tables.filter((t) => COLS[t].includes(c)).length > 1 ? `${tables.find((t) => COLS[t].includes(c))}.${c}` : c);
  const lit = (v) => (typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
  const wh = cards.filter((c) => c.k === 'SARING').map((c) => `${q(c.col)} ${c.op} ${lit(c.val)}`);
  const grp = cards.filter((c) => c.k === 'KELOMPOKKAN').pop();
  const pil = cards.filter((c) => c.k === 'PILIH').pop();
  const ord = cards.filter((c) => c.k === 'URUTKAN').pop();
  const aggExpr = grp ? (grp.fn === 'COUNT' ? 'COUNT(*)' : `SUM(${grp.fn === 'SUBTOTAL' ? 'jumlah * harga_satuan' : q(grp.of)})`) : null;
  const aggName = grp ? (grp.fn === 'COUNT' ? 'banyak' : grp.fn === 'SUBTOTAL' ? 'total' : `total_${grp.of}`) : null;
  let sel;
  if (grp) sel = [...new Set([q(grp.col), ...(pil ? pil.cols.filter((c) => c !== aggName && c !== grp.col).map(q) : [])])].concat(`${aggExpr} AS ${aggName}`);
  else sel = pil && pil.cols.length ? pil.cols.map(q) : ['*'];
  let sql = `SELECT ${sel.join(', ')}\nFROM ${st.from}`;
  for (const t of joins) sql += `\n${JOINS[tables[0]][t] || JOINS.pesanan[t]}`;
  if (wh.length) sql += `\nWHERE ${wh.join(' AND ')}`;
  if (grp) sql += `\nGROUP BY ${q(grp.col)}`;
  if (ord) sql += `\nORDER BY ${ord.col === aggName ? aggName : q(ord.col)} ${ord.desc ? 'DESC' : 'ASC'}`;
  return `${sql};`;
}

function createBuilder(root, ctx) {
  const wrap = el('div', { class: 'act basis-data' });
  root.append(wrap);
  const st = { from: 'pesanan', cards: [] }; let adding = null;
  const avail = () => { const t = [st.from, ...st.cards.filter((c) => c.k === 'GABUNG').map((c) => c.table)]; return [...new Set(t.flatMap((x) => COLS[x]))]; };
  const valuesOf = (col) => { const db = makeDb(SCHEMA); const T = db.tables(); const tab = Object.keys(T).find((t) => T[t].cols.includes(col)); return [...new Set(T[tab].rows.map((r) => r[col]))].sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b)))); };
  function draw() {
    const db = makeDb(SCHEMA);
    const steps = [el('div', { class: 'sq-langkah' }, el('div', { class: 'sq-kartu-baris' }, el('span', { class: 'sq-kartu k-TABEL' }, 'TABEL'), el('div', { class: 'seg' }, Object.keys(SCHEMA).map((t) => onTap(el('button', { class: `seg-btn ${t === st.from ? 'on' : ''}`, type: 'button' }, t), () => { st.from = t; st.cards = []; draw(); })))), tryRun(db, `SELECT * FROM ${st.from};`))];
    st.cards.forEach((c, i) => steps.push(el('div', { class: 'sq-langkah' }, el('div', { class: 'sq-kartu-baris' }, el('span', { class: `sq-kartu k-${c.k}` }, c.k), el('span', null, describe(c)), button('✕', () => { st.cards.splice(i, 1); draw(); })), tryRun(db, buildSql(st, i + 1)))));
    const sql = buildSql(st);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penyusun kueri visual'),
      el('div', { class: 'sq-penyusun' }, el('div', { class: 'sq-alur' }, steps, adder()), el('div', { class: 'sq-samping' }, el('b', null, 'SQL setara'), el('pre', { class: 'sq-kode' }, sql), el('div', { class: 'kode-baris' }, button('↺ Kosongkan', () => { st.cards = []; draw(); }), ...CARDQ.map((q) => button(q[0], () => { preset(q[0]); draw(); }))))));
  }
  function tryRun(db, sql) { try { const r = db.run(sql); return resultView(r[r.length - 1], { cls: 'kecil' }); } catch (e) { return el('p', { class: 'sq-galat' }, `⚠ ${e.message}`); } }
  function describe(c) { return c.k === 'SARING' ? `${c.col} ${c.op} ${c.val}` : c.k === 'PILIH' ? c.cols.join(', ') : c.k === 'GABUNG' ? `${c.table}` : c.k === 'KELOMPOKKAN' ? `per ${c.col}, ${c.fn === 'COUNT' ? 'COUNT(*)' : c.fn === 'SUBTOTAL' ? 'SUM(jumlah × harga_satuan)' : `SUM(${c.of})`}` : `${c.col} ${c.desc ? 'besar → kecil' : 'kecil → besar'}`; }
  function adder() {
    const box = el('div', { class: 'sq-tambah' });
    const kinds = ['GABUNG', 'SARING', 'KELOMPOKKAN', 'PILIH', 'URUTKAN'];
    box.append(el('div', { class: 'kode-baris' }, el('span', null, 'Tambah kartu:'), ...kinds.map((k) => onTap(el('button', { class: `sq-kartu k-${k} tombol ${adding?.k === k ? 'aktif' : ''}`, type: 'button' }, k), () => { adding = { k }; draw(); }))));
    if (!adding) return box;
    const a = adding; const cols = avail(); const grp = st.cards.find((c) => c.k === 'KELOMPOKKAN');
    const seg = (opts, cur, f, lab = (x) => String(x)) => el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: `seg-btn ${o === cur ? 'on' : ''}`, type: 'button' }, lab(o)), () => { f(o); draw(); })));
    const ok = (c) => button('Pasang kartu', () => { st.cards.push(c); adding = null; ctx.sound.tap(); draw(); }, 'primary');
    if (a.k === 'GABUNG') { const opts = Object.keys(SCHEMA).filter((t) => t !== st.from && !st.cards.some((c) => c.table === t) && (JOINS[st.from]?.[t] || (st.cards.some((c) => c.table === 'pesanan') && JOINS.pesanan[t]))); box.append(opts.length ? seg(opts, a.table, (t) => { a.table = t; }) : el('small', null, 'Tidak ada tabel lain yang bisa digabungkan.'), a.table ? ok({ k: 'GABUNG', table: a.table }) : null); }
    if (a.k === 'SARING') { box.append(seg(cols, a.col, (c) => { a.col = c; a.val = undefined; }), seg(['=', '<', '>', '<>'], a.op, (o) => { a.op = o; })); if (a.col) box.append(seg(valuesOf(a.col), a.val, (v) => { a.val = v; }, (v) => String(v))); if (a.col && a.op && a.val !== undefined) box.append(ok({ k: 'SARING', col: a.col, op: a.op, val: a.val })); }
    if (a.k === 'PILIH') { a.cols ||= []; box.append(el('div', { class: 'seg' }, cols.map((c) => onTap(el('button', { class: `seg-btn ${a.cols.includes(c) ? 'on' : ''}`, type: 'button' }, c), () => { if (a.cols.includes(c)) a.cols.splice(a.cols.indexOf(c), 1); else a.cols.push(c); draw(); }))), a.cols.length ? ok({ k: 'PILIH', cols: [...a.cols] }) : null); }
    if (a.k === 'KELOMPOKKAN') { box.append(el('small', null, 'Per kolom:'), seg(cols, a.col, (c) => { a.col = c; }), el('small', null, 'Hitung:'), seg(['COUNT', ...['jumlah', 'harga', 'harga_satuan'].filter((c) => cols.includes(c)), ...(cols.includes('harga_satuan') ? ['SUBTOTAL'] : [])], a.fn === 'SUM' ? a.of : a.fn, (f) => { if (f === 'COUNT' || f === 'SUBTOTAL') { a.fn = f; a.of = null; } else { a.fn = 'SUM'; a.of = f; } }, (f) => (f === 'COUNT' ? 'COUNT(*)' : f === 'SUBTOTAL' ? 'SUM(jumlah × harga_satuan)' : `SUM(${f})`))); if (a.col && a.fn) box.append(ok({ k: 'KELOMPOKKAN', col: a.col, fn: a.fn, of: a.of })); }
    if (a.k === 'URUTKAN') { const names = grp ? [grp.col, grp.fn === 'COUNT' ? 'banyak' : grp.fn === 'SUBTOTAL' ? 'total' : `total_${grp.of}`] : cols; box.append(seg(names, a.col, (c) => { a.col = c; }), seg(['kecil → besar', 'besar → kecil'], a.desc === undefined ? null : a.desc ? 'besar → kecil' : 'kecil → besar', (d) => { a.desc = d === 'besar → kecil'; })); if (a.col && a.desc !== undefined) box.append(ok({ k: 'URUTKAN', col: a.col, desc: a.desc })); }
    return box;
  }
  function preset(id) {
    const P = { K1: ['produk', [{ k: 'SARING', col: 'harga', op: '<', val: 20000 }, { k: 'PILIH', cols: ['nama_produk', 'harga'] }]], K2: ['pesanan', [{ k: 'SARING', col: 'id_pelanggan', op: '=', val: 'C04' }, { k: 'PILIH', cols: ['id_pesanan', 'tanggal', 'jumlah'] }]], K3: ['pesanan', [{ k: 'GABUNG', table: 'produk' }, { k: 'SARING', col: 'nama_produk', op: '=', val: 'Tas anyaman pandan' }, { k: 'PILIH', cols: ['id_pesanan', 'jumlah', 'harga_satuan'] }]], K4: ['pesanan', [{ k: 'KELOMPOKKAN', col: 'id_produk', fn: 'SUM', of: 'jumlah' }]], K5: ['pesanan', [{ k: 'GABUNG', table: 'pelanggan' }, { k: 'KELOMPOKKAN', col: 'nama', fn: 'SUBTOTAL' }, { k: 'URUTKAN', col: 'total', desc: true }]] };
    st.from = P[id][0]; st.cards = P[id][1].map((c) => ({ ...c })); adding = null;
  }
  draw();
}

// --- Penyunting SQL ---
function createEditor(root, ctx) {
  const wrap = el('div', { class: 'act basis-data' });
  root.append(wrap);
  const db = makeDb(SCHEMA);
  const area = el('textarea', { class: 'sq-masukan', rows: 7, 'aria-label': 'Kueri SQL', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off' });
  area.value = SQLQ.K1;
  const out = el('div', { class: 'sq-hasil' });
  const tabs = el('div', { class: 'sq-tiga' });
  const drawTables = (hl = null) => tabs.replaceChildren(...Object.entries(db.tables()).map(([n, t]) => tableView(t.cols, t.rows.map((r) => t.cols.map((c) => r[c])), { cap: `${n} (${t.rows.length} baris)`, cls: `kecil ${n === hl ? 'berubah' : ''}` })));
  const runIt = () => {
    try { const res = db.run(area.value); out.replaceChildren(...res.map((r) => resultView(r))); ctx.sound.good(); drawTables(res.filter((r) => r.kind === 'info').pop()?.table); }
    catch (e) { if (!(e instanceof SqlError)) throw e; out.replaceChildren(el('p', { class: 'sq-galat' }, `⚠ Galat: ${e.message}`)); ctx.sound.bad(); }
  };
  const insert = (t) => { const s = area.selectionStart ?? area.value.length; const e = area.selectionEnd ?? s; const pre = area.value.slice(0, s); const add = (pre && !/\s$/.test(pre) ? ' ' : '') + t + ' '; area.value = pre + add + area.value.slice(e); area.focus(); area.selectionStart = area.selectionEnd = s + add.length; };
  const words = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'DESC', 'HAVING', 'SUM(', 'COUNT(*)', 'AS', 'AND', '=', '<', '>', ',', '(', ')', '*', ';', "'"];
  const names = ['pelanggan', 'produk', 'pesanan', ...new Set(Object.values(SCHEMA).flatMap((s) => s.cols))];
  wrap.replaceChildren(
    el('p', { class: 'prompt' }, 'Penyunting SQL'),
    el('div', { class: 'sq-penyusun' },
      el('div', { class: 'sq-alur' }, area,
        el('div', { class: 'sq-palet' }, words.map((w) => onTap(el('button', { class: 'sq-kata kw', type: 'button' }, w), () => insert(w)))),
        el('div', { class: 'sq-palet' }, names.map((w) => onTap(el('button', { class: 'sq-kata', type: 'button' }, w), () => insert(w)))),
        el('div', { class: 'kode-baris' }, button('▶ Jalankan', runIt, 'primary'), button('⌫ Hapus teks', () => { area.value = ''; area.focus(); }), button('↺ Kembalikan data awal', () => { db.reset(); drawTables(); out.replaceChildren(el('p', { class: 'sq-info' }, '✓ Data kembali ke keadaan awal.')); })),
        out),
      el('div', { class: 'sq-samping' }, el('b', null, 'Contoh kueri'), el('div', { class: 'sq-palet' }, Object.keys(SQLQ).map((k) => onTap(el('button', { class: 'sq-kata contoh', type: 'button' }, k), () => { area.value = SQLQ[k]; out.replaceChildren(); }))), tabs)));
  drawTables();
}

// --- Tebak hasil kueri (bergiliran) ---
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act basis-data' });
  root.append(wrap);
  const EXTRA = [
    ['Q1', 'Pelanggan di ruang guru', [['', 'pelanggan', 'SELECT * FROM pelanggan'], ['SARING', "kontak = 'Ruang guru'", "SELECT * FROM pelanggan WHERE kontak = 'Ruang guru'"], ['PILIH', 'nama', "SELECT nama FROM pelanggan WHERE kontak = 'Ruang guru'"]]],
    ['Q2', 'Pesanan dengan jumlah lebih dari 2', [['', 'pesanan', 'SELECT * FROM pesanan'], ['SARING', 'jumlah > 2', 'SELECT * FROM pesanan WHERE jumlah > 2'], ['PILIH', 'id_pesanan, jumlah', 'SELECT id_pesanan, jumlah FROM pesanan WHERE jumlah > 2']]],
    ['Q3', 'Banyak pesanan per tanggal 16/10', [['', 'pesanan', 'SELECT * FROM pesanan'], ['SARING', "tanggal = '16/10'", "SELECT * FROM pesanan WHERE tanggal = '16/10'"], ['PILIH', 'id_pesanan, id_pelanggan', "SELECT id_pesanan, id_pelanggan FROM pesanan WHERE tanggal = '16/10'"]]],
  ];
  const deckAll = [...CARDQ, ...EXTRA];
  const db = makeDb(SCHEMA);
  const resText = (q) => { const r = db.run(q[2][q[2].length - 1][2])[0]; return r.rows.map((x) => `(${x.map(money).join(', ')})`).join('  ') || '(kosong)'; };
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Tebak hasil kueri selesai', pts, again: () => pickTeams(wrap, 'Tebak Hasil Kueri', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih satu kueri kartu untuk ditebak Tim ${guesser + 1}.`);
      const area = el('div', { class: 'sq-pilih-kueri' }, deckAll.map((q) => onTap(el('button', { class: 'sq-kueri-btn', type: 'button' }, el('b', null, q[0]), el('span', null, q[1]), el('small', null, cardText(q))), () => guess(q))));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} menyusun, Tim ${guesser + 1} menebak`), area, msg);
      function guess(q) {
        const right = resText(q); const others = ctx.rand.shuffle(deckAll.filter((x) => x !== q).map(resText).filter((t) => t !== right)).slice(0, 2);
        const opts = ctx.rand.shuffle([right, ...others]); let done = false;
        say(msg, '', `Tim ${guesser + 1}: tebak tabel hasilnya sebelum kueri dijalankan.`);
        area.className = 'sq-tebak';
        area.replaceChildren(el('div', { class: 'sq-resep' }, q[2].map(([c, t]) => el('span', { class: `sq-kartu k-${c || 'TABEL'}` }, c ? `${c} ${t}` : t))), el('div', { class: 'opts', style: { '--cols': 1 } }, opts.map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), (e) => {
          if (done) return; done = true; const ok = o === right; if (ok) pts[guesser] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', ok ? `Tepat! Tim ${guesser + 1} +2.` : `Belum tepat. Hasilnya: ${right}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker));
          const fin = db.run(q[2][q[2].length - 1][2])[0]; area.append(tableView(fin.cols, fin.rows, { cap: 'Hasil kueri', cls: 'akhir' })); k++; setTimeout(turn, 5200);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Hasil Kueri', start);
}
