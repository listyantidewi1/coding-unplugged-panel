// Proyek Aplikasi untuk UMKM — SMA/SMK (16–18 tahun), coding. One turn of the
// software engineering process for a home chips business: open interview
// questions, functional and non-functional needs, user stories with
// acceptance criteria and release priority, a kanban board, named constants,
// the core Python functions (total with the wholesale rule, belum_lunas,
// rekap) run in mini-py, boundary-value tests, code review of Rudi's total
// (line 6 counts flavours, line 7 uses > 10, line 8 a bare 2000), semantic
// versioning, triaging feedback, and the regression test for tandai_dikirim.
// Main mode "Dari Dapur ke Rilis": interview cards to sort, story tiles,
// a wholesale scale, order cards to tap, Rudi's tests to run, and a boss
// round where version 1.0.0 marks the wrong order. Kanban cards live only
// on this screen and are never stored.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy } from './mini-py.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots } from './misi-kit.js';

// ---- the worksheet program ----
const DATA = ['HARGA = {"balado": 15000, "gurih": 14000, "tempe": 12000}', 'GROSIR_MIN = 10      # pesanan grosir: paling sedikit 10 bungkus', 'POTONGAN = 2000      # potongan harga setiap bungkus pesanan grosir', '', 'pesanan = [', '    {"no": 1, "nama": "Bu Lina", "isi": {"balado": 6, "tempe": 4},', '     "lunas": False, "dikirim": True},', '    {"no": 2, "nama": "Pak Tono", "isi": {"gurih": 2},', '     "lunas": True, "dikirim": False},', '    {"no": 3, "nama": "Bu Lina", "isi": {"balado": 3, "gurih": 3, "tempe": 3},', '     "lunas": False, "dikirim": False},', '    {"no": 4, "nama": "Mbak Ayu", "isi": {"tempe": 1, "balado": 1},', '     "lunas": False, "dikirim": False},', ']'];
const totalDengan = (b6, b7, b8) => ['def total(isi):', '    jumlah = 0', '    banyak = 0', '    for rasa in isi:', '        jumlah = jumlah + HARGA[rasa] * isi[rasa]', `        banyak = ${b6}`, `    if ${b7}:`, `        jumlah = ${b8}`, '    return jumlah'];
export const TOTAL = totalDengan('banyak + isi[rasa]', 'banyak >= GROSIR_MIN', 'jumlah - POTONGAN * banyak');
export const RUDI = totalDengan('banyak + 1', 'banyak > 10', 'jumlah - 2000 * banyak');
export const RUDI6 = totalDengan('banyak + isi[rasa]', 'banyak > 10', 'jumlah - 2000 * banyak');
export const TANDAI_100 = ['def tandai_dikirim(daftar, no):', '    daftar[no]["dikirim"] = True'];
export const TANDAI_101 = ['def tandai_dikirim(daftar, no):', '    for p in daftar:', '        if p["no"] == no:', '            p["dikirim"] = True', '            return True', '    return False'];
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

const lab = (n) => Array.from({ length: n }, (_, i) => String(i + 1));

// ---------- Dari Dapur ke Rilis: the hands-on missions ----------
const KUTU = '🐜 Si Kutu Batas'; const ALAMAT = '📮 Si Salah Alamat';
const HEAD57 = {
  wartini: ['Wawancara Bu Wartini', 'Ajukan pertanyaan terbuka, lalu pilah jawabannya.', KUTU, 'Tanya saja "mau aplikasi?", pasti dijawab ya!'],
  dua: ['Wawancara Rahmat dan Bu Lina', 'Gali masalah, kebutuhan, dan batasan dua persona lain.', KUTU, 'Pengguna lain tidak penting.'],
  cerita: ['Kartu Cerita', 'Susun cerita pengguna, lalu tempel prioritas rilisnya.', KUTU, 'Kerjakan semua fitur sekaligus!'],
  grosir: ['Keanehan Grosir', 'Cari dua pesanan berurutan: yang lebih banyak justru lebih murah.', KUTU, 'Aku tinggal tepat di angka 10.'],
  cetak: ['Cetak Biru Data', 'Pasang kartu fungsi ke cerita Harus, lalu buktikan mengapa perlu nomor.', ALAMAT, 'Nama pelanggan sudah cukup sebagai alamat.'],
  program: ['Pemrogram lawan Penguji', 'Susun fungsi total, lalu tulis harapan U1–U6 tanpa melihat kode.', KUTU, 'Satu tanda > sudah cukup, kan?'],
  lunas: ['Siapa Belum Lunas?', 'Ketuk pesanan yang belum lunas, lalu hitung tagihannya.', ALAMAT, 'Tagihan Bu Lina kukirim ke orang lain!'],
  buru: ['Buru Si Kutu Batas', 'Jalankan U1–U6 pada kode Rudi dan tunjuk baris yang salah.', KUTU, 'Rudi bilang kodenya sudah dicoba.'],
  rilis: ['Rilis 1.0.0', 'Pilah masukan pengguna, lalu tentukan nomor versi berikutnya.', ALAMAT, 'Semua masukan itu bug, perbaiki semua!'],
  bos: ['Tangkap Si Salah Alamat', 'Ramalkan pesanan yang ditandai versi 1.0.0, lalu uji perbaikannya.', ALAMAT, 'Nomor 3? Kutandai yang keempat!'],
};
const msg57 = (t) => el('p', { class: 'reveal info' }, t);
const dua57 = (...k) => el('div', { class: 'dr57-dua' }, ...k);
const kol57 = (...k) => el('div', { class: 'dr57-kolom' }, ...k);
const ind2 = (x) => x.replace(/^( +)/, (m) => ' '.repeat(m.length / 2));
const PESANAN57 = [
  { no: 1, nama: 'Bu Lina', isi: { balado: 6, tempe: 4 }, lunas: false, dikirim: true },
  { no: 2, nama: 'Pak Tono', isi: { gurih: 2 }, lunas: true, dikirim: false },
  { no: 3, nama: 'Bu Lina', isi: { balado: 3, gurih: 3, tempe: 3 }, lunas: false, dikirim: false },
  { no: 4, nama: 'Mbak Ayu', isi: { tempe: 1, balado: 1 }, lunas: false, dikirim: false },
];
const kartuPesanan = (p, i, extra = {}) => el('button', { class: `dr57-pesanan ${extra.cls || ''}`, type: 'button', 'data-no': String(p.no), 'data-pos': String(i) },
  el('b', null, `#${p.no} ${p.nama}`), el('small', null, Object.entries(p.isi).map(([k, v]) => `${k} ${v}`).join(', ')), el('small', null, `${p.lunas ? '✓ lunas' : '✗ belum lunas'} · ${p.dikirim ? '🚚 dikirim' : '📦 belum'}`), extra.pos ? el('i', null, `posisi ${i}`) : null);

// Tap a card, then tap the pile it belongs to.
function pilah57(ctx, { oops, msg, kolom, kartu, onDone }) {
  const node = el('div', { class: 'dr57-pilah' }); const isi = Object.fromEntries(kolom.map(([k]) => [k, []])); let pilih = null;
  const sisa = () => kartu.filter((c) => !Object.values(isi).flat().includes(c.id) && !c.tersembunyi);
  function draw() {
    fill(node, el('div', { class: 'dr57-baki' }, sisa().map((c) => onTap(el('button', { class: `dr57-kartu ${pilih === c.id ? 'on' : ''}`, type: 'button', 'data-id': c.id }, c.t), () => { pilih = c.id; ctx.sound.tap(); draw(); }))),
      el('div', { class: 'dr57-tumpuk-tumpuk' }, kolom.map(([k, label]) => onTap(el('div', { class: 'dr57-tumpuk', 'data-k': k }, el('b', null, label), isi[k].map((id) => el('span', null, kartu.find((c) => c.id === id).t))), () => taruh(k)))));
  }
  function taruh(k) {
    if (!pilih) { say(msg, 'info', 'Ketuk kartu dulu, lalu tumpukannya.'); return; }
    const c = kartu.find((x) => x.id === pilih);
    if (c.want !== k) { oops(); say(msg, 'bad', c.why || 'Belum tepat. Baca lagi kartunya.'); return; }
    isi[k].push(c.id); pilih = null; ctx.sound.tap(); draw();
    if (!kartu.some((x) => !Object.values(isi).flat().includes(x.id))) onDone(); else say(msg, 'info', 'Tepat.');
  }
  node.buka = (ids) => { kartu.forEach((c) => { if (ids.includes(c.id)) c.tersembunyi = false; }); draw(); };
  draw();
  return node;
}

// Misi 1: interview. Open questions reveal answer cards; closed ones get only "Ya." or "Tidak.".
const TANYA57 = {
  wartini: [
    { q: 'Apa yang paling sering salah saat mencatat pesanan?', a: ['w1', 'w2'] }, { q: 'Apa yang ingin Ibu ketahui setiap Sabtu?', a: ['w3'] }, { q: 'Ibu biasa memakai alat apa untuk mencatat?', a: ['w4'] },
    { q: 'Ibu mau aplikasi?', tutup: 'Ya.' }, { q: 'Ibu bisa memakai komputer?', tutup: 'Tidak.' }],
  dua: [
    { q: 'Rahmat: apa yang pernah membuatmu salah kemas?', a: ['r1'] }, { q: 'Rahmat: apa yang kamu butuhkan sebelum mengantar?', a: ['r2', 'r3'] },
    { q: 'Bu Lina: bagaimana pengalaman Ibu saat ditagih?', a: ['l1', 'l2'] }, { q: 'Bu Lina: kapan Ibu biasa membayar?', a: ['l3'] }, { q: 'Bu Lina: Ibu suka keripik balado?', tutup: 'Ya.' }],
};
const JAWAB57 = {
  w1: ['😟 Saya sering lupa siapa yang belum bayar.', 'masalah'], w2: ['😟 Harga grosir sering salah hitung.', 'masalah'], w3: ['📅 Uang yang masuk minggu ini.', 'butuh'], w4: ['📱 Hanya ponsel, tulisannya harus besar.', 'batas'],
  r1: ['😟 Tulisan di buku sulit dibaca.', 'masalah'], r2: ['🚚 Daftar pesanan yang belum dikirim.', 'butuh'], r3: ['🗒️ Daftarnya harus mudah dibaca.', 'batas'],
  l1: ['😟 Saya pernah ditagih harga biasa untuk 10 bungkus.', 'masalah'], l2: ['💰 Saya ingin tahu total yang belum dibayar.', 'butuh'], l3: ['🗓️ Saya membayar di akhir bulan.', 'batas'],
};
function wawancaraRound(area, ctx, { oops, done }, set) {
  const msg = msg57('Ketuk pertanyaan. Jawaban yang muncul dipilah ke Masalah, Kebutuhan, atau Batasan.'); const sudah = new Set();
  const T = TANYA57[set]; const ids = T.flatMap((x) => x.a || []);
  const why = { masalah: 'Ini sesuatu yang sekarang sering salah: masalah.', butuh: 'Ini sesuatu yang ingin bisa dilakukan: kebutuhan.', batas: 'Ini syarat cara aplikasi harus bekerja: batasan.' };
  const P = pilah57(ctx, { oops, msg, kolom: [['masalah', '😟 Masalah'], ['butuh', '✅ Kebutuhan'], ['batas', '📏 Batasan']], kartu: ids.map((id) => ({ id, t: JAWAB57[id][0], want: JAWAB57[id][1], why: `Belum tepat. ${why[JAWAB57[id][1]]}`, tersembunyi: true })),
    onDone: () => { say(msg, '', 'Pertanyaan terbuka tentang masalah nyata memunculkan kebutuhan sebenarnya. Pertanyaan ya atau tidak hanya memberi satu kata.'); done(); } });
  const tanya = el('div', { class: 'dr57-tanya' });
  const draw = () => fill(tanya, T.map((x, i) => onTap(el('button', { class: `dr57-q ${sudah.has(i) ? 'sudah' : ''} ${x.tutup ? 'tutup' : 'buka'}`, type: 'button', 'data-i': String(i) }, `❓ ${x.q}`), () => {
    if (sudah.has(i)) return; sudah.add(i); ctx.sound.tap(); draw();
    if (x.tutup) { say(msg, 'info', `Jawabannya hanya "${x.tutup}" Pertanyaan tertutup tidak memunculkan kebutuhan.`); return; }
    P.buka(x.a); say(msg, 'info', 'Jawaban baru muncul. Pilah ke tumpukannya.');
  })));
  draw();
  area.append(dua57(kol57(el('div', { class: 'dr57-persona' }, set === 'wartini' ? '👩‍🍳 Bu Wartini, 52 · pemilik usaha keripik' : '🛵 Rahmat, 19 · pengantar   🏪 Bu Lina, 40 · pemilik warung'), tanya), kol57(P)), msg);
}

// Misi 2: build a user story, then pin release priorities.
function ceritaRound(area, ctx, { oops, done }) {
  const msg = msg57('Susun cerita pengguna C2 dari tiga potongan.'); const kanan = kol57();
  fill(kanan, tileSlots(ctx, { oops, msg, build: ['Sebagai', ['a', 1], 'saya ingin', ['b', 1], 'supaya', ['c', 1]],
    tiles: [['a', 'Bu Wartini'], ['b', 'total pesanan dihitung otomatis'], ['c', 'harga grosir tidak salah hitung'], ['x', 'tombol berwarna merah', 'Cerita pengguna menyebut kebutuhan, bukan tampilan.'], ['y', 'tim pengembang', 'Cerita ditulis dari sudut pandang pengguna.']],
    order: 'Sebagai siapa, ingin apa, supaya apa.', onFull: () => {
      say(msg, 'info', 'Kriteria penerimaan C2: 9 bungkus balado Rp135.000, 10 bungkus Rp130.000. Sekarang tempel prioritas rilis 1.0.0.');
      const C = [['c2', 'C2 total otomatis', 'harus'], ['c3', 'C3 daftar belum lunas', 'harus'], ['c4', 'C4 belum dikirim dan menandai', 'harus'], ['c5', 'C5 rekap per rasa', 'sebaiknya'], ['c7', 'C7 total Bu Lina', 'bisa'], ['c8', 'Pelanggan memesan sendiri', 'tidak']];
      const why = { harus: 'Tanpa cerita ini aplikasi belum bisa menggantikan buku.', sebaiknya: 'Membantu, tetapi buku masih bisa dipakai tanpa fitur ini dulu.', bisa: 'Sudah tercakup sebagian oleh daftar belum lunas.', tidak: 'Fitur besar yang belum diminta pemilik.' };
      fill(kanan, pilah57(ctx, { oops, msg, kolom: [['harus', '🔴 Harus'], ['sebaiknya', '🟠 Sebaiknya'], ['bisa', '🟢 Bisa'], ['tidak', '⚪ Tidak sekarang']], kartu: C.map(([id, t, w]) => ({ id, t, want: w, why: `Belum tepat. ${why[w]}` })),
        onDone: () => { say(msg, '', 'Rilis 1.0.0 hanya berisi cerita Harus: cepat dipakai, dan masukan nyata datang lebih awal.'); done(); } }));
    } }));
  area.append(dua57(kol57(el('div', { class: 'dr57-persona' }, '📇 Kartu cerita'), codeView(['Kebutuhan nonfungsional:', '• tulisan besar, sedikit tombol', '• dipakai di ponsel', '• data tidak boleh hilang'])), kanan), msg);
}

// Misi 2b: the strange wholesale rule — more packs, lower total.
function grosirRound(area, ctx, { oops, done }) {
  const msg = msg57('Ubah banyak bungkus balado. Catat dua pesanan berurutan yang lebih banyak tetapi lebih murah.'); let n = 7; const catat = [];
  const nilai = el('div', { class: 'dr57-timbang' }); const log = el('div', { class: 'dr57-catat' }); const kanan = kol57();
  const harga = (k) => Number(totalPy(TOTAL, { balado: k }));
  const draw = () => fill(nilai, el('span', { class: 'dr57-bungkus' }, '🟥'.repeat(Math.min(n, 12))), el('b', null, `${n} bungkus balado`), el('code', null, `total → ${rp(harga(n))}`));
  fill(kanan, nilai, el('div', { class: 'dr57-geser' }, onTap(el('button', { class: 'dr57-btn', type: 'button', 'data-d': '-1' }, '− bungkus'), () => { n = Math.max(1, n - 1); ctx.sound.tap(); draw(); }), onTap(el('button', { class: 'dr57-btn', type: 'button', 'data-d': '1' }, '+ bungkus'), () => { n = Math.min(15, n + 1); ctx.sound.tap(); draw(); }),
    onTap(el('button', { class: 'btn primary dr57-catat-btn', type: 'button' }, '📌 Catat'), () => {
      if (kanan.querySelector('.mk-papan')) return;
      catat.push(n); log.append(el('span', null, `${n} → ${rp(harga(n))}`)); ctx.sound.tap();
      const [a, b] = catat.slice(-2);
      if (catat.length < 2 || Math.abs(a - b) !== 1) { say(msg, 'info', 'Tercatat. Catat juga pesanan tetangganya (satu bungkus lebih atau kurang).'); return; }
      const [k, l] = a < b ? [a, b] : [b, a];
      if (harga(l) >= harga(k)) { oops(); say(msg, 'bad', `${l} bungkus tidak lebih murah dari ${k}. Cari di sekitar batas grosir.`); return; }
      say(msg, 'info', `${l} bungkus ${rp(harga(l))} lebih murah daripada ${k} bungkus ${rp(harga(k))}! Siapa yang berhak memutuskan aturannya?`);
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['yang memutuskan: ', '_']]), chips: ['Bu Wartini', 'tim pengembang', 'Bu Lina'], want: ['Bu Wartini'], hints: ['Aturan harga adalah keputusan pemilik usaha. Tim memberi tahu akibatnya.'],
        done: () => { say(msg, '', 'Kode yang benar mengikuti aturan, walau aturannya aneh. Tim melaporkan keanehannya, dan pemilik usaha yang memutuskan.'); done(); } }));
    })), log);
  draw();
  area.append(dua57(kol57(codeView(['HARGA = {"balado": 15000, …}', 'GROSIR_MIN = 10', 'POTONGAN = 2000'])), kanan), msg);
}

// Misi 3: map function cards to the Harus stories; then show why orders need a number.
function cetakRound(area, ctx, { oops, done }) {
  const msg = msg57('Pasang kartu fungsi ke setiap cerita Harus.'); const kanan = kol57();
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['C1 mencatat pesanan → ', '_'], ['C2 total otomatis → ', '_'], ['C3 belum lunas → ', '_'], ['C4 belum dikirim → ', '_'], ['C4 menandai diantar → ', '_']]),
    chips: ['tambah_pesanan', 'total', 'belum_lunas', 'belum_dikirim', 'tandai_dikirim'], want: ['tambah_pesanan', 'total', 'belum_lunas', 'belum_dikirim', 'tandai_dikirim'],
    hints: ['Mencatat pesanan baru.', 'Menghitung harga satu pesanan.', 'Mencari pesanan yang belum dibayar (dan memakai total).', 'Mendaftar yang belum diantar.', 'Mengubah dikirim menjadi True.'],
    done: () => {
      say(msg, 'info', 'Setiap pesanan diberi no. Mengapa nama pelanggan tidak cukup? Ketuk dua pesanan yang tidak bisa dibedakan dengan nama.'); const pilih = new Set();
      const kartu = el('div', { class: 'dr57-pesanan-pesanan' }, PESANAN57.map((p, i) => onTap(kartuPesanan(p, i), (e) => {
        if (pilih.has(p.no)) return;
        if (p.nama !== 'Bu Lina') { oops(); say(msg, 'bad', `${p.nama} hanya punya satu pesanan.`); return; }
        pilih.add(p.no); ctx.sound.tap(); kartu.querySelector(`[data-no="${p.no}"]`).classList.add('on');
        if (pilih.size === 2) { say(msg, '', 'Bu Lina punya pesanan nomor 1 dan 3. Nama tidak unik, jadi setiap pesanan butuh nomor sendiri.'); done(); }
      })));
      fill(kanan, kartu);
    } }));
  area.append(dua57(kol57(codeView(['def tambah_pesanan(daftar, nama, isi):', 'def total(isi):', 'def belum_lunas(daftar):', 'def belum_dikirim(daftar):', 'def tandai_dikirim(daftar, no):'])), kanan), msg);
}

// Misi 4: the programmer builds total; the tester writes U1–U6 expectations blind; then the tests run.
function programRound(area, ctx, { oops, done }) {
  const msg = msg57('Pemrogram: susun isi fungsi total(isi). Awas tiga kartu pengecoh.'); const kiri = kol57(); const kanan = kol57();
  fill(kiri, el('small', { class: 'dr57-judul' }, 'def total(isi):'), tileSlots(ctx, { oops, msg, build: ['  jumlah = 0', '  banyak = 0', ['f', 1], ['j', 2], ['b', 2], ['g', 1], ['p', 2], '  return jumlah'],
    tiles: [['f', 'for rasa in isi:'], ['j', 'jumlah = jumlah + HARGA[rasa] * isi[rasa]'], ['b', 'banyak = banyak + isi[rasa]'], ['g', 'if banyak >= GROSIR_MIN:'], ['p', 'jumlah = jumlah - POTONGAN * banyak'],
      ['x1', 'banyak = banyak + 1', 'Grosir menghitung bungkus, bukan rasa.'], ['x2', 'if banyak > GROSIR_MIN:', 'Tepat 10 bungkus juga grosir: paling sedikit 10.'], ['x3', 'jumlah = jumlah - POTONGAN', 'Potongan berlaku untuk setiap bungkus.']],
    order: 'Ulangi setiap rasa dulu, baru periksa grosir setelah perulangan.', onFull: penguji }));
  function penguji() {
    kiri.hidden = true; say(msg, 'info', 'Kode disembunyikan. Penguji: tulis harapan U1–U6 dari aturan Bu Wartini, tanpa melihat kode.');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView(UJI.map((u) => [`${u.id} ${Object.entries(u.isi).map(([k, v]) => `${k} ${v}`).join(', ') || 'kosong'} → `, '_'])),
      chips: ['14000', '135000', '130000', '115000', '110000', '0', '150000'], want: UJI.map((u) => totalPy(TOTAL, u.isi)),
      hints: ['1 gurih: 14.000.', '9 bungkus: belum grosir, 9 × 15.000.', '10 bungkus: grosir, 10 × (15.000 − 2.000).', '10 bungkus dari dua rasa: 75.000 + 60.000 − 20.000.', '11 tempe: 11 × (12.000 − 2.000).', 'Pesanan kosong: 0.'],
      done: () => { const lampu = el('div', { class: 'dr57-lampu' }, UJI.map((u) => el('span', { class: 'hijau', 'data-k': u.id }, `${u.id} ✓`))); kanan.append(lampu);
        say(msg, '', 'Kode Pemrogram lulus keenam uji Penguji. U3 dan U4 menjaga batas grosir, tempat bug paling suka bersembunyi.'); done(); } }));
  }
  area.append(dua57(kiri, kanan), msg);
}

// Misi 4b: tap unpaid orders, then compute the bills.
function lunasRound(area, ctx, { oops, done }) {
  const msg = msg57('Ketuk setiap pesanan yang belum lunas.'); const pilih = new Set(); const kanan = kol57();
  const T = PESANAN57.map((p) => totalPy(TOTAL, p.isi));
  const kartu = el('div', { class: 'dr57-pesanan-pesanan' }, PESANAN57.map((p, i) => onTap(kartuPesanan(p, i), () => {
    if (pilih.has(p.no) || kanan.childElementCount) return;
    if (p.lunas) { oops(); say(msg, 'bad', `Pesanan ${p.no} sudah lunas.`); return; }
    pilih.add(p.no); ctx.sound.tap(); kartu.querySelector(`[data-no="${p.no}"]`).classList.add('on');
    if (pilih.size < 3) return;
    say(msg, 'info', 'Tiga pesanan belum lunas. Hitung total setiap pesanan dan tagihan Bu Lina.');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['#1 Bu Lina → ', '_'], ['#3 Bu Lina → ', '_'], ['#4 Mbak Ayu → ', '_'], ['tagihan Bu Lina → ', '_']]), chips: [T[0], T[2], T[3], String(Number(T[0]) + Number(T[2])), '138000', '28000'], want: [T[0], T[2], T[3], String(Number(T[0]) + Number(T[2]))],
      hints: ['6 balado + 4 tempe = 10 bungkus: grosir! 90.000 + 48.000 − 20.000.', '9 bungkus: belum grosir. 45.000 + 42.000 + 36.000.', '12.000 + 15.000.', 'Jumlahkan pesanan 1 dan 3.'],
      done: () => { say(msg, '', `belum_lunas memberi [(1, 'Bu Lina', ${T[0]}), (3, 'Bu Lina', ${T[2]}), (4, 'Mbak Ayu', ${T[3]})]. Tagihan Bu Lina ${rp(Number(T[0]) + Number(T[2]))}.`); done(); } }));
  })));
  area.append(dua57(kol57(kartu), kanan), msg);
}

// Misi 5: run U1–U6 on Rudi's code, find line 6, let Rudi fix it, then catch Si Kutu Batas on line 7.
function buruRound57(area, ctx, { oops, done }) {
  const msg = msg57('Jalankan U1–U6 pada kode Rudi.'); let kode = RUDI; let tahap = 0;
  const kiri = kol57(); const kanan = kol57(); const lampu = el('div', { class: 'dr57-lampu' });
  const drawKode = (warn = []) => fill(kiri, el('small', { class: 'dr57-judul' }, tahap >= 2 ? 'def total(isi): · Rudi, baris 6 diperbaiki' : 'def total(isi): · Rudi'), codeView(kode.slice(1).map(ind2), { labels: lab(8).map((x) => String(+x + 1)), cls: tahap === 1 || tahap === 3 ? 'ketuk' : '', warn, onLine: tahap === 1 || tahap === 3 ? (i) => tunjuk(i + 2) : null }));
  const jalan = () => fill(lampu, UJI.map((u) => { const h = totalPy(kode, u.isi); const ok = h === totalPy(TOTAL, u.isi); return el('span', { class: ok ? 'hijau' : 'merah', 'data-k': u.id }, `${u.id} ${ok ? '✓' : `✗ ${h}`}`); }));
  const tombol = (label, cls, fn) => onTap(el('button', { class: `btn primary ${cls}`, type: 'button' }, label), fn);
  fill(kanan, lampu, tombol('▶ Jalankan U1–U6', 'dr57-jalan', () => { if (tahap !== 0) return; tahap = 1; jalan(); ctx.sound.tap(); drawKode(); say(msg, 'info', 'U3, U4, dan U5 gagal. Ketuk baris yang salah.'); }));
  function tunjuk(no) {
    if (tahap === 1) {
      if (no !== 6) { oops(); say(msg, 'bad', no === 7 ? 'Baris 7 memang mencurigakan, tetapi U5 (11 tempe) juga gagal. Lihat dulu cara menghitung banyak.' : 'Baris ini benar. Lihat bagaimana banyak dihitung.'); return; }
      tahap = 2; ctx.sound.good(); drawKode([4]); say(msg, 'info', 'Baris 6 menambah 1 per rasa, bukan per bungkus. Minta Rudi memperbaikinya.');
      kanan.append(tombol('🔧 Rudi memperbaiki baris 6', 'dr57-perbaiki', () => { if (tahap !== 2) return; tahap = 3; kode = RUDI6; jalan(); drawKode(); kanan.querySelector('.dr57-perbaiki')?.remove(); say(msg, 'info', 'U5 kini lulus, tetapi U3 dan U4 masih gagal. Di mana Si Kutu Batas bersembunyi?'); }));
      return;
    }
    if (tahap !== 3) return;
    if (no !== 7) { oops(); say(msg, 'bad', 'U3 dan U4 tepat 10 bungkus. Baris mana yang memeriksa batas?'); return; }
    tahap = 4; ctx.sound.good(); drawKode([5, 6]);
    say(msg, 'info', 'Si Kutu Batas ada di baris 7! Tulis usul perbaikan.');
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['baris 7 → if ', '_', ':'], ['baris 8 → jumlah - ', '_', ' * banyak']]), chips: ['banyak >= GROSIR_MIN', 'banyak > 9', 'banyak > GROSIR_MIN', 'POTONGAN', '2000'], want: ['banyak >= GROSIR_MIN', 'POTONGAN'],
      hints: ['Paling sedikit 10 bungkus: >=, dan pakai nama aturannya.', 'Pakai nama POTONGAN supaya cukup satu tempat yang diubah.'], done: () => { say(msg, '', 'Si Kutu Batas tertangkap. Kode Rudi dulu menagih pesanan nomor 1 milik Bu Lina Rp138.000, bukan Rp118.000.'); done(); } }));
  }
  drawKode();
  area.append(dua57(kiri, kanan), msg);
}

const PENDEK57 = { M1: 'tandai nomor 3, yang berubah nomor 4; tandai nomor 4, aplikasinya galat.', M2: 'harga tempe naik jadi Rp13.000 mulai besok.', M3: '9 bungkus saya tidak dapat harga grosir, padahal saya langganan.', M4: 'ingin tahu berapa bungkus tiap rasa yang harus digoreng.' };
// Misi 6: triage feedback after release 1.0.0, then choose the next versions.
function rilisRound(area, ctx, { oops, done }) {
  const msg = msg57('Rilis 1.0.0 sudah dipakai seminggu. Pilah setiap masukan ke tumpukannya.'); const kanan = kol57();
  const why = { bug: 'Aplikasi tidak bekerja seperti seharusnya: bug.', 'perubahan data': 'Aturannya tetap, hanya angkanya yang berubah.', 'keputusan pemilik': 'Ini meminta aturan diubah: pemilik usaha yang memutuskan.', 'fitur baru': 'Ini kemampuan yang belum ada.' };
  const lain = ctx.rand.shuffle(MASUKAN_LAIN.slice()).slice(0, 2).map((m, i) => ({ id: `x${i}`, t: `${m.dari}: ${m.t}`, want: m.jenis, why: `Belum tepat. ${why[m.jenis]}` }));
  const P = pilah57(ctx, { oops, msg, kolom: JENIS.map((j) => [j, j]), kartu: [...MASUKAN.map((m) => ({ id: m.id, t: `${m.id} ${m.dari}: ${PENDEK57[m.id]}`, want: m.jenis, why: `Belum tepat. ${why[m.jenis]}` })), ...lain],
    onDone: () => {
      say(msg, 'info', 'Sekarang tentukan nomor versi berikutnya.');
      fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['M1 bug → ', '_'], ['M3 aturan grosir → ', '_'], ['M4 fitur rekap → ', '_']]), chips: ['1.0.1', 'Tunggu keputusan', '1.1.0', '2.0.0'], want: ['1.0.1', 'Tunggu keputusan', '1.1.0'],
        hints: ['Perbaikan bug menaikkan angka ketiga.', 'Belum ada perubahan kode sebelum Bu Wartini memutuskan.', 'Fitur baru menaikkan angka kedua.'], done: () => { say(msg, '', 'Angka ketiga untuk perbaikan bug, angka kedua untuk fitur baru, angka pertama untuk perubahan besar. Keputusan pemilik tidak mengubah kode.'); done(); } }));
    } });
  fill(kanan, P);
  area.append(kanan, msg);
}

// Misi Bos: predict which card version 1.0.0 marks, watch the IndexError, then test the fix.
function bosRound57(area, ctx, { oops, done }) {
  const msg = msg57('Versi 1.0.0 menjalankan tandai_dikirim(pesanan, 3). Ketuk kartu yang akan berubah.'); let tahap = 0; const dikirim = PESANAN57.map((p) => p.dikirim);
  const kiri = kol57(); const kanan = kol57();
  const drawKode = (v) => fill(kiri, codeView((v === '100' ? TANDAI_100 : TANDAI_101).map(ind2), { hl: v === '100' ? [1] : [] }));
  const kartu = el('div', { class: 'dr57-pesanan-pesanan' });
  const drawKartu = () => fill(kartu, PESANAN57.map((p, i) => onTap(kartuPesanan({ ...p, dikirim: dikirim[i] }, i, { pos: true, cls: dikirim[i] && !p.dikirim ? 'on' : '' }), () => tebak(i))), tahap === 1 ? onTap(el('button', { class: 'dr57-galat', type: 'button' }, '💥 galat'), () => tebak('galat')) : null);
  function tebak(x) {
    if (tahap === 0) {
      if (x !== 3) { oops(); say(msg, 'bad', 'daftar[no] memakai posisi (mulai 0), bukan nomor pesanan. Posisi 3 itu kartu yang mana?'); return; }
      dikirim[3] = true; tahap = 1; ctx.sound.tap(); drawKartu(); say(msg, 'info', 'Pesanan nomor 4 yang berubah! Sekarang tandai_dikirim(pesanan, 4). Apa yang terjadi?'); return;
    }
    if (tahap === 1) {
      if (x !== 'galat') { oops(); say(msg, 'bad', 'Posisi 4 tidak ada: daftar hanya punya posisi 0–3.'); return; }
      tahap = 2; ctx.sound.tap(); drawKartu(); say(msg, 'info', 'IndexError: list index out of range. Pasang perbaikan: cari pesanan dengan nomor yang sama.');
      fill(kanan, tileSlots(ctx, { oops, msg, build: ['def tandai_dikirim(daftar, no):', ['a', 1], ['b', 2], ['c', 3], '      return True', '  return False'],
        tiles: [['a', 'for p in daftar:'], ['b', 'if p["no"] == no:'], ['c', 'p["dikirim"] = True'], ['x', 'daftar[no]["dikirim"] = True', 'Itu kode lama: posisi, bukan nomor.']],
        order: 'Telusuri setiap pesanan, bandingkan nomornya, baru tandai.', onFull: () => { tahap = 3; dikirim.splice(0, 4, ...PESANAN57.map((p) => p.dikirim)); drawKode('101'); drawKartu(); fill(kanan, kartu); say(msg, 'info', 'Uji regresi: versi perbaikan menjalankan tandai_dikirim(pesanan, 3). Ketuk kartu yang akan berubah.'); } }));
      return;
    }
    if (tahap !== 3) return;
    if (x !== 2) { oops(); say(msg, 'bad', 'Versi perbaikan mencari p["no"] == 3.'); return; }
    dikirim[2] = true; tahap = 4; ctx.sound.good(); drawKartu();
    say(msg, '', 'Versi 1.0.1 menandai pesanan nomor 3 saja. Si Salah Alamat tertangkap, dan semua uji lama dijalankan lagi sebelum rilis.'); done();
  }
  drawKode('100'); drawKartu(); fill(kanan, kartu);
  area.append(dua57(kiri, kanan), msg);
}

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
    const wrap = el('div', { class: 'act proyek-umkm dr57-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'dr57-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, siapa, ulah] = HEAD57[k]; foe = el('div', { class: 'dr57-musuh' }, el('b', null, siapa), el('span', null, ulah)); wrap.append(el('div', { class: 'dr57-kepala' }, misiHead(no, judul, tujuan, '🥔'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Rilis aman ✓'; next(ms); } });
      if (r === 0) { go('wartini', 1); wawancaraRound(area, ctx, fin(5500), 'wartini'); }
      else if (r === 1) { go('dua', 1); wawancaraRound(area, ctx, fin(5500), 'dua'); }
      else if (r === 2) { go('cerita', 2); ceritaRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('grosir', 2); grosirRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('cetak', 3); cetakRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('program', 4); programRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('lunas', 4); lunasRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('buru', 5); buruRound57(area, ctx, fin(6500)); }
      else if (r === 8) { go('rilis', 6); rilisRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound57(area, ctx, fin(7000)); }
    }
    render();
  },
};

// ---- views ----
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
