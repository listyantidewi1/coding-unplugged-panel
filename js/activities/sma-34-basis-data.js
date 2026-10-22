// Basis Data Toko Kerajinan Kelas — SMA/SMK (16–18 tahun), basis data relasional dan SQL.
// One big order table full of repeats is split into pelanggan, produk and pesanan
// with primary and foreign keys; queries run as cards (SARING, PILIH, GABUNG,
// KELOMPOKKAN, URUTKAN) and as SQL in a small interpreter inside the browser.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
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
function tableView(cols, rows, { cap = null, fmt = false, cls = '', hl = null, onRow = null, rowCls = null } = {}) {
  return el('div', { class: `sq-tabel-wadah ${cls}` }, cap ? el('b', { class: 'sq-cap' }, cap) : null, el('table', { class: 'sq-tabel' }, el('tr', null, cols.map((c) => el('th', null, c))), rows.length ? rows.map((r, i) => {
    const tr = el('tr', { class: `${hl && hl(r, i) ? 'hl' : ''} ${rowCls ? rowCls(r, i) : ''}` }, r.map((v) => el('td', { class: typeof v === 'number' ? 'n' : '' }, fmt ? money(v) : String(v ?? 'NULL'))));
    return onRow ? onTap(tr, () => onRow(r, i, tr)) : tr;
  }) : el('tr', null, el('td', { colspan: cols.length, class: 'kosong' }, '(tidak ada baris)'))));
}
const resultView = (r, opts = {}) => (r.kind === 'rows' ? tableView(r.cols, r.rows, opts) : el('p', { class: 'sq-info' }, `✓ ${r.text}`));
const BIG_COLS = ['No.', 'Tanggal', 'Pelanggan', 'Kontak', 'Produk', 'Harga', 'Jumlah', 'Total'];

// Pipeline of card steps with the table after each card.
function pipeline(q, { upto = Infinity } = {}) {
  const db = makeDb(SCHEMA);
  return el('div', { class: 'sq-alur' }, q[2].slice(0, upto).map(([card, text, sql], i) => { const r = db.run(sql)[0]; return el('div', { class: 'sq-langkah' }, el('div', { class: 'sq-kartu-baris' }, card ? el('span', { class: `sq-kartu k-${card}` }, card) : el('span', { class: 'sq-kartu k-TABEL' }, 'TABEL'), el('span', null, text)), resultView(r, { cls: i === q[2].length - 1 ? 'akhir' : '' })); }));
}
function cardText(q) { return q[2].map(([c, t]) => (c ? `${c} ${t}` : t)).join(' → '); }

function pickRows(wrap, ctx, { prompt, rows, opts, why, done, info, cls = '' }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `sq-baris-baris ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, a]) => el('div', { class: `sq-baris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, opts.find((o) => o[0] === a)[1]) : el('div', { class: 'seg' }, opts.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', why(k, a, false)); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', why(k, a, true)); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1600);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function badRowsRound(wrap, ctx, { done }) {
  const found = new Set(); let fin = false;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tiga baris yang bertentangan dengan baris lain atau dengan aturan harga (harga tas naik menjadi Rp50.000 mulai 15/10).');
  const box = el('div');
  const draw = () => box.replaceChildren(tableView(BIG_COLS, BIG, { fmt: true, cls: 'besar', rowCls: (r) => (found.has(r[0]) ? 'temu' : ''), onRow: (r) => {
    if (fin || found.has(r[0])) return;
    if (!BAD_ROWS[r[0]]) { ctx.mistake(); say(msg, 'bad', `Baris ${r[0]} tidak bertentangan. Bandingkan kontak setiap nama, dan harga tas sesuai tanggalnya.`); return; }
    found.add(r[0]); ctx.sound.good(); say(msg, '', `Baris ${r[0]}: ${BAD_ROWS[r[0]]}`); draw();
    if (found.size === 3) { fin = true; setTimeout(done, 1800); }
  } }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tabel besar catatan Nadia: temukan tiga baris yang bermasalah'), box, msg);
}

function cardRound(wrap, ctx, { q, opts, done }) {
  const db = makeDb(SCHEMA); const final = db.run(q[2][q[2].length - 1][2])[0];
  const show = el('div', { class: 'sq-alur-wadah' });
  wrap.append(el('p', { class: 'prompt' }, `Kueri ${q[0]}: ${q[1]}`), el('div', { class: 'sq-resep' }, q[2].map(([c, t]) => el('span', { class: `sq-kartu k-${c || 'TABEL'}` }, c ? `${c} ${t}` : t))), show);
  const area = el('div');
  show.append(area);
  choice(area, { prompt: 'Tebak tabel hasilnya', ctx, shuffle: true, columns: 1, options: opts.map(([l, c]) => ({ label: l, correct: !!c })), onRight: () => {
    ctx.sound.good(); area.replaceChildren(el('p', { class: 'reveal' }, `Hasil ${q[0]}: ${final.rows.map((r) => r.map(money).join(' ')).join(' · ')}`));
    show.append(pipeline(q)); setTimeout(done, 2600);
  } });
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
    const wrap = el('div', { class: 'act basis-data' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const code = (s) => el('pre', { class: 'sq-kode' }, s);
      if (r === 0) ask('Berapa kali nama dan kontak Bu Rina ditulis di tabel besar?', [[1], [2], [3, true], [4]], 4, tableView(BIG_COLS, BIG, { fmt: true, cls: 'besar', hl: (x) => x[2] === 'Bu Rina' }), then(() => badRowsRound(wrap, ctx, { done: next })));
      else if (r === 1) ask('Jumlah kolom Total di tabel besar, dan uang yang seharusnya diterima?', [['Tercatat Rp565.000; seharusnya Rp575.000 (baris 11 seharusnya 2 × 50.000)', true], ['Tercatat Rp575.000; seharusnya Rp565.000'], ['Tercatat Rp565.000; sudah benar'], ['Tercatat Rp520.000; seharusnya Rp575.000']], 1, tableView(BIG_COLS, BIG, { fmt: true, cls: 'besar', hl: (x) => x[0] === 11 }),
        then(() => pickRows(wrap, ctx, { prompt: 'Pasangkan setiap masalah dengan nama anomalinya', rows: ANOMALY, opts: ANOM_OPTS, info: 'Pembaruan: data yang sama harus diubah di banyak baris. Penyisipan: data baru tidak bisa dicatat sebelum ada data lain. Penghapusan: menghapus satu hal ikut menghapus hal lain.', why: (k, a, ok) => (ok ? `${k}: anomali ${ANOM_OPTS.find((o) => o[0] === a)[1]}.` : 'Masalahnya terjadi saat mengubah, menambah, atau menghapus data?'), done: next })));
      else if (r === 2) pickRows(wrap, ctx, { prompt: 'Memecah tabel: ke tabel mana setiap kolom tabel besar?', rows: SPLIT.map(([k, t, a]) => [k, t, a]), opts: SPLIT_OPTS, cls: 'pecah', info: 'Setiap fakta cukup disimpan sekali.', why: (k, a, ok) => (ok ? SPLIT_WHY[k] : 'Kolom ini menerangkan pelanggan, produk, atau satu pesanan? Atau bisa dihitung?'),
        done: then(() => ask('Kolom mana di tabel pesanan yang menjadi kunci asing?', [['id_pelanggan (ke tabel pelanggan) dan id_produk (ke tabel produk)', true], ['id_pesanan, karena nilainya berbeda di setiap baris'], ['jumlah dan harga_satuan'], ['tanggal']], 1, el('div', { class: 'sq-tiga' }, ...Object.entries(SCHEMA).map(([n, s]) => tableView(s.cols, s.rows.slice(0, 4), { cap: n, cls: 'kecil' }))))) });
      else if (r === 3) ask('Di tabel pesanan, berapa harga_satuan pesanan nomor 11 (tas, 16/10)?', [['50000, harga pada hari pesanan', true], ['45000, seperti di tabel besar'], ['90000'], ['100000']], 2, null,
        then(() => ask('Mengapa kolom Total tidak disimpan di tabel pesanan?', [['Total bisa dihitung dari jumlah × harga_satuan; bila disimpan juga, bisa tidak cocok seperti di tabel besar', true], ['Supaya tabelnya lebih pendek saja'], ['Karena total adalah kunci asing'], ['Karena SQL tidak bisa menyimpan angka besar']], 1, code(SCHEMA.pesanan.cols.join(' | ')))));
      else if (r === 4) cardRound(wrap, ctx, { q: CARDQ[0], opts: [['Gantungan kunci batik 8000 · Lilin aromaterapi 15000', true], ['Gantungan kunci batik 8000'], ['Tas anyaman pandan 50000 · Kaos sablon kelas 60000'], ['Semua produk']], done: then(() => cardRound(wrap, ctx, { q: CARDQ[1], opts: [['Pesanan 4, 8, 11 (jumlah 1, 5, 2)', true], ['Pesanan 4 dan 11'], ['Pesanan 1, 6, 10'], ['Pesanan 8 saja']], done: next })) });
      else if (r === 5) cardRound(wrap, ctx, { q: CARDQ[2], opts: [['Pesanan 4, 6, 9, 11', true], ['Pesanan 4, 6, 11'], ['Pesanan 9 dan 11'], ['Pesanan 4, 6, 9']], done: then(() => cardRound(wrap, ctx, { q: CARDQ[3], opts: [['P01 10 · P02 5 · P03 3 · P04 5', true], ['P01 3 · P02 4 · P03 2 · P04 3'], ['P01 10 · P02 4 · P03 3 · P04 5'], ['P01 5 · P02 5 · P03 3 · P04 10']], done: next })) });
      else if (r === 6) cardRound(wrap, ctx, { q: CARDQ[4], opts: [['Bu Sari 185.000 · Pak Darto 170.000 · Dimas 106.000 · Bu Rina 99.000 · Pak Joko 15.000', true], ['Bu Rina 99.000 · Bu Sari 185.000 · Dimas 106.000 · Pak Darto 170.000 · Pak Joko 15.000'], ['Pak Darto 170.000 · Bu Sari 135.000 · Dimas 106.000 · Bu Rina 99.000 · Pak Joko 15.000'], ['Bu Sari 8 · Dimas 5 · Bu Rina 6 · Pak Darto 3 · Pak Joko 1']],
        done: then(() => ask('Produk mana yang paling banyak terjual, dan siapa pelanggan dengan belanja terbesar?', [['Gantungan kunci batik (10 buah) · Bu Sari', true], ['Tas anyaman pandan · Pak Darto'], ['Kaos sablon kelas · Bu Sari'], ['Gantungan kunci batik · Bu Rina']])) });
      else if (r === 7) ask('SQL mana yang sama dengan kueri K2?', [[SQLQ.K2, true], ["SELECT id_pesanan, tanggal, jumlah\nFROM pelanggan\nWHERE id_pelanggan = 'C04';"], ['SELECT id_pesanan, tanggal, jumlah\nFROM pesanan\nWHERE id_pelanggan = C04;'], ["SELECT *\nFROM pesanan\nORDER BY id_pelanggan = 'C04';"]], 2, null,
        then(() => ask('Tebak hasil kueri ini', [['Bu Rina 3 · Bu Sari 3 · Dimas 3 · Pak Darto 2 · Pak Joko 1', true], ['Bu Sari 3 · Dimas 3 · Bu Rina 3 · Pak Darto 2 · Pak Joko 1'], ['Pak Joko 1 · Pak Darto 2 · Bu Rina 3 · Bu Sari 3 · Dimas 3'], ['Bu Sari 8 · Bu Rina 6 · Dimas 5 · Pak Darto 3 · Pak Joko 1']], 1, code(SQLQ['4c']))));
      else if (r === 8) {
        const db = makeDb(SCHEMA); const out = el('div', { class: 'sq-hasil' });
        let err = ''; try { db.run(SQLQ['4d']); } catch (e) { err = e.message; }
        out.append(el('p', { class: 'sq-galat' }, `⚠ Galat: ${err}`));
        ask('Kueri ini menghasilkan galat. Apa kesalahannya?', [['Kolom nama_produk tidak ada di tabel pesanan; tabel produk harus digabungkan dulu dengan JOIN', true], ['SUM tidak boleh dipakai bersama GROUP BY'], ['Tanda titik koma harus dihapus'], ['GROUP BY harus ditulis sebelum FROM']], 1, el('div', { class: 'sq-dua-kecil' }, code(SQLQ['4d']), out),
          then(() => ask('Perbaikan mana yang benar?', [[SQLQ['4d✓'], true], ['SELECT nama_produk, SUM(jumlah)\nFROM produk\nGROUP BY id_produk;'], ['SELECT nama_produk, SUM(jumlah)\nFROM pesanan, produk;'], ['SELECT id_produk, SUM(jumlah)\nFROM pesanan\nGROUP BY nama_produk;']], 2, null,
            then(() => { const res = makeDb(SCHEMA).run(SQLQ['4d✓'])[0]; ask('Kueri perbaikan dijalankan. Produk mana yang banyak terjualnya sama?', [['Lilin aromaterapi dan tas anyaman pandan (5 buah)', true], ['Gantungan kunci batik dan kaos sablon kelas'], ['Semua produk sama'], ['Tidak ada yang sama']], 1, el('div', { class: 'sq-dua-kecil' }, code(SQLQ['4d✓']), resultView(res))); }))));
      }
      else {
        const db = makeDb(SCHEMA); const res = db.run(SQLQ['4e']);
        ask('Setelah INSERT pembatas buku dan DELETE pesanan nomor 3, apakah data Pak Joko ikut hilang?', [['Tidak: Pak Joko tetap tersimpan di tabel pelanggan; anomali penyisipan dan penghapusan teratasi', true], ['Ya, nama dan kontaknya ikut terhapus'], ['Ya, karena C02 dihapus otomatis'], ['Tidak bisa diketahui']], 1, el('div', { class: 'sq-dua-kecil' }, code(SQLQ['4e']), el('div', null, ...res.map((x) => resultView(x, { cls: 'kecil', hl: (row) => row[1] === 'Pak Joko' }))))),
          then(() => ask('Mulai 20/10 harga lilin naik menjadi Rp18.000. SQL mana yang tepat, dan apakah total pesanan lilin lama ikut berubah?', [["UPDATE produk SET harga = 18000 WHERE id_produk = 'P04'; tidak berubah, karena harga lama tersimpan di harga_satuan", true], ["UPDATE pesanan SET harga_satuan = 18000 WHERE id_produk = 'P04'; tidak berubah"], ['UPDATE produk SET harga = 18000; semua total ikut naik'], ["DELETE FROM produk WHERE id_produk = 'P04'; lalu INSERT yang baru"]], 1, null,
            then(() => ask('Bila tidak ada kolom harga_satuan dan total selalu dihitung dari harga di tabel produk, berapa selisih pendapatan lilin (5 buah terjual) setelah harga naik?', [['Rp15.000', true], ['Rp3.000'], ['Rp18.000'], ['Rp90.000']], 2))));
      }
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
