// Aplikasi Bank Sampah — SMA/SMK (16–18 tahun), design thinking.
// Sayembara Aplikasi Bank Sampah: visit the users, an empathy map, judge
// "Bagaimana kita…" statements, an impact–effort matrix with vote stickers,
// audit an AI camera, a confidence threshold with a human in the loop, a
// paper-prototype builder, cross testing, F/N requirements and a pitch.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const PRICE = { botol: 3000, gelas: 2000, kardus: 1500, kaleng: 6000 };
export const KIND = { botol: ['🧴', 'Botol plastik'], gelas: ['🥤', 'Gelas plastik'], kardus: ['📦', 'Kardus'], kaleng: ['🥫', 'Kaleng'] };
const rp = (x) => `Rp${Math.abs(x).toLocaleString('id-ID')}`;

export const PERSONAS = [
  { id: 'sumi', icon: '👵', name: 'Mbah Sumi', role: '68 tahun, nasabah', rows: ['Menyetor botol dan kardus setiap Sabtu', 'Ponsel layar sentuh pemberian cucu; hanya bisa menelepon dan membuka pesan', 'Penglihatan kurang; tidak suka mengetik', 'Ingin tahu saldonya tanpa harus datang ke balai'], need: 'Mengetahui saldo tanpa membaca tulisan kecil dan tanpa mengetik' },
  { id: 'arif', icon: '🧑', name: 'Mas Arif', role: '29 tahun, pengelola relawan', rows: ['Menimbang dan mencatat setoran setiap Sabtu pagi, lalu merekap di malam hari', 'Laptop tua dan ponsel; sinyal di balai dusun sering hilang', 'Sering salah hitung saat merekap 60 nasabah', 'Ingin rekap otomatis per nasabah dan per jenis sampah'], need: 'Mencatat cepat dan merekap otomatis, juga saat sinyal hilang' },
  { id: 'darmi', icon: '👩', name: 'Bu Darmi', role: '45 tahun, pengepul', rows: ['Membeli sampah terpilah setiap dua minggu dan mengirim mobil bak', 'Ponsel; lebih suka menelepon', 'Harus menebak berapa kilogram yang sudah terkumpul', 'Ingin tahu jumlah setiap jenis sampah sebelum mengirim mobil'], need: 'Mengetahui berat setiap jenis sampah yang sudah terkumpul' },
];

export const EMPATHY = [[1, '"Tulisan di buku tabungan terlalu kecil."', 'katakan'], [2, 'Selalu datang paling pagi membawa sampah yang sudah dicuci dan dipilah.', 'lakukan'], [3, 'Menduga catatan saldonya pernah keliru, tetapi tidak pernah menanyakannya.', 'pikirkan'], [4, 'Bangga karena sampahnya bisa menjadi tabungan untuk sekolah cucu.', 'rasakan'], [5, '"Saya ingin tahu saldo tanpa harus ke balai dusun."', 'katakan'], [6, 'Meminta cucunya membacakan pesan di ponsel.', 'lakukan'], [7, 'Cemas salah menekan tombol di ponsel.', 'rasakan'], [8, 'Mengira aplikasi ponsel hanya untuk anak muda.', 'pikirkan']];
const QUAD = [['katakan', '💬 Katakan'], ['pikirkan', '💭 Pikirkan'], ['lakukan', '🖐 Lakukan'], ['rasakan', '❤️ Rasakan']];
const EMPATHY_WHY = { katakan: 'Kutipan langsung yang ia ucapkan.', pikirkan: 'Tidak diucapkan, tetapi tersirat dari sikapnya.', lakukan: 'Tindakan yang terlihat.', rasakan: 'Perasaan: bangga, cemas, senang.' };

export const STATEMENTS = [['a', 'Bagaimana kita membuat aplikasi bank sampah?', 'luas'], ['b', 'Bagaimana kita membuat tombol hijau selebar 2 cm di halaman saldo?', 'sempit'], ['c', 'Bagaimana kita membantu Mbah Sumi mengetahui saldonya tanpa harus membaca tulisan kecil, supaya ia yakin tabungannya tercatat benar?', 'tepat']];
const RATING = [['luas', 'Terlalu luas'], ['sempit', 'Terlalu sempit'], ['tepat', 'Tepat']];

export const IDEAS = [['A', 'Saldo dan nota setoran dikirim sebagai pesan suara dan pesan berhuruf besar.', ['besar-mudah']], ['B', 'Kamera ponsel menebak jenis sampah dari foto (fitur KA).', ['besar-sulit']], ['C', 'Rekap otomatis berat setiap jenis sampah untuk pengepul.', ['besar-mudah']], ['D', 'Timbangan digital yang langsung tersambung ke aplikasi.', ['besar-sulit']], ['E', 'Aplikasi tetap bisa mencatat tanpa sinyal, lalu mengirim datanya ketika sinyal kembali.', ['besar-sulit', 'besar-mudah']], ['F', 'Papan peringkat nasabah yang paling banyak menyetor, ditampilkan untuk semua warga.', ['kecil-mudah']]];
const MATRIX = [['besar-mudah', 'Dampak besar · mudah dibuat'], ['besar-sulit', 'Dampak besar · sulit dibuat'], ['kecil-mudah', 'Dampak kecil · mudah dibuat'], ['kecil-sulit', 'Dampak kecil · sulit dibuat']];
const IDEA_WHY = { A: 'Pesan suara dan huruf besar menjawab kesulitan Mbah Sumi dan mudah dibuat.', B: 'KA pengenal gambar butuh banyak foto latihan dan pengujian: sulit.', C: 'Rekap otomatis menolong Mas Arif dan Bu Darmi, dan cukup dengan menjumlahkan data.', D: 'Butuh perangkat keras dan sambungan khusus: sulit dan mahal.', E: 'Penting di balai yang sinyalnya hilang; lebih mudah daripada B dan D.', F: 'Mudah dibuat, tetapi tidak menjawab kebutuhan siapa pun dan membuka data nasabah.' };

// The 20 test photos: actual kind, guessed kind, confidence (%). Matches the worksheet table.
export const PHOTOS = [['botol', 'botol', 96], ['botol', 'botol', 93], ['botol', 'botol', 90], ['botol', 'botol', 88], ['botol', 'botol', 85], ['botol', 'botol', 78], ['botol', 'botol', 66], ['botol', 'gelas', 55], ['gelas', 'botol', 62], ['gelas', 'botol', 71], ['gelas', 'gelas', 74], ['gelas', 'gelas', 58], ['kardus', 'kardus', 97], ['kardus', 'kardus', 95], ['kardus', 'kardus', 92], ['kardus', 'kardus', 89], ['kardus', 'kardus', 81], ['kaleng', 'kaleng', 98], ['kaleng', 'kaleng', 94], ['kaleng', 'kaleng', 91]];
export function camera(limit) {
  const asked = PHOTOS.filter((p) => p[2] < limit).length;
  const wrong = PHOTOS.filter((p) => p[2] >= limit && p[0] !== p[1]);
  const per = Object.keys(KIND).map((k) => { const all = PHOTOS.filter((p) => p[0] === k); return [k, all.filter((p) => p[1] === k).length, all.length]; });
  const extra = wrong.reduce((s, p) => s + PRICE[p[1]] - PRICE[p[0]], 0);
  const bank = wrong.filter((p) => PRICE[p[1]] > PRICE[p[0]]).reduce((s, p) => s + PRICE[p[1]] - PRICE[p[0]], 0);
  return { asked, wrong: wrong.length, per, extra, bank, nasabah: bank - extra };
}

export const NEEDS = [[1, 'Sistem dapat mencatat setoran: nama nasabah, jenis sampah, berat, dan tanggal.', 'F'], [2, 'Nasabah dapat mendengarkan saldonya melalui pesan suara.', 'F'], [3, 'Aplikasi tetap bisa dipakai di balai dusun yang sinyalnya sering hilang.', 'N', 'keandalan'], [4, 'Sistem menghitung rekap berat setiap jenis sampah untuk pengepul.', 'F'], [5, 'Huruf di layar nasabah besar, dan setiap tombol punya ikon serta tulisan.', 'N', 'kemudahan penggunaan'], [6, 'Saldo seorang nasabah hanya dapat dilihat oleh nasabah itu dan pengelola.', 'N', 'keamanan dan privasi'], [7, 'Mencatat satu setoran tidak lebih dari 30 detik.', 'N', 'kecepatan'], [8, 'Pengelola dapat mengubah harga per kilogram setiap minggu.', 'F']];

// Prototype components. good: helps the persona; bad: names the principle it breaks.
export const PARTS = {
  saldo: [
    ['angka', '💰 Angka saldo sangat besar: Rp48.500', { good: true }],
    ['dengar', '🔊 Tombol "Dengarkan saldo"', { good: true, btn: true }],
    ['riwayat', '🧾 Tiga setoran terakhir, huruf besar', { good: true }],
    ['kembali', '↩ Tombol "Kembali"', { good: true, btn: true, undo: true }],
    ['tabel', 'Tabel semua transaksi, huruf kecil', { bad: 'Huruf terlalu kecil untuk Mbah Sumi.' }],
    ['ikon', '☰ (tombol ikon tanpa tulisan)', { bad: 'Tombol tanpa tulisan membingungkan.', btn: true }],
    ['peringkat', '🏆 Papan peringkat nasabah', { bad: 'Membuka data setoran nasabah lain.' }],
    ['ketik', '⌨️ Kolom: ketik nomor nasabah', { bad: 'Mbah Sumi tidak suka mengetik.' }],
  ],
  catat: [
    ['nasabah', '👤 Pilih nasabah dari daftar', { good: true }],
    ['jenis', '🧴🥤📦🥫 Ikon besar jenis sampah', { good: true }],
    ['berat', '⚖️ Kolom berat (kg)', { good: true }],
    ['simpan', '✅ Tombol "Simpan" dengan konfirmasi', { good: true, btn: true, confirm: true }],
    ['batal', '↩ Tombol "Batalkan setoran terakhir"', { good: true, btn: true, undo: true }],
    ['luring', '📶 Tanda "tersimpan di ponsel, dikirim saat ada sinyal"', { good: true }],
    ['langsung', '💾 Simpan otomatis tanpa konfirmasi', { bad: 'Salah ketik langsung tersimpan.' }],
    ['form', '📝 Formulir 12 kolom (alamat, NIK, …)', { bad: 'Terlalu banyak ketukan dan data pribadi yang tidak perlu.' }],
  ],
  rekap: [
    ['jenis', '📊 Total kilogram setiap jenis, huruf besar', { good: true }],
    ['harga', '💵 Perkiraan harga setiap jenis', { good: true }],
    ['telepon', '📞 Tombol "Telepon pengelola"', { good: true, btn: true }],
    ['kembali', '↩ Tombol "Kembali"', { good: true, btn: true, undo: true }],
    ['nasabah', '📋 Daftar setoran setiap nasabah', { bad: 'Bu Darmi tidak perlu melihat setoran setiap warga.' }],
    ['ikon', '⚙ (tombol ikon tanpa tulisan)', { bad: 'Tombol tanpa tulisan membingungkan.', btn: true }],
    ['grafik', '📈 Grafik kecil tanpa angka', { bad: 'Huruf dan angka terlalu kecil.' }],
  ],
};
const SCREENS = [['saldo', '👵 Layar saldo Mbah Sumi'], ['catat', '🧑 Layar catat setoran Mas Arif'], ['rekap', '👩 Layar rekap Bu Darmi']];
export const PRINCIPLES = ['Huruf cukup besar dan kontras', 'Setiap tombol punya ikon dan tulisan', 'Tugas utama selesai dengan sedikit ketukan', 'Ada konfirmasi sebelum data disimpan atau diubah', 'Ada cara membatalkan bila salah tekan'];
const MAIN = { saldo: ['angka'], catat: ['nasabah', 'jenis', 'berat', 'simpan'], rekap: ['jenis'] };
// One mark per principle: true, false, or null (does not apply to this screen).
export function checkScreen(scr, ids) {
  const P = Object.fromEntries(PARTS[scr].map((p) => [p[0], p[2]]));
  if (!ids.length) return PRINCIPLES.map(() => null);
  const has = (f) => ids.some((i) => P[i][f]);
  return [
    !ids.some((i) => ['tabel', 'grafik'].includes(i)),
    has('btn') && !ids.includes('ikon'),
    MAIN[scr].every((m) => ids.includes(m)) && !ids.includes('form'),
    scr === 'catat' ? ids.includes('simpan') && !ids.includes('langsung') : null,
    has('undo'),
  ];
}

// A first-draft paper prototype with the usual flaws, used for scenario tests.
export const DRAFT = {
  beranda: { title: 'Bank Sampah Sukamakmur', body: ['Selamat datang'], go: [['☰', 'menu', 'ikon'], ['＋ Catat setoran', 'catat']] },
  menu: { title: 'Menu', body: [], go: [['Pengaturan', 'atur'], ['Saldo', 'saldo'], ['Rekap', 'rekap'], ['← Kembali', 'beranda']] },
  saldo: { title: 'Saldo', body: ['Mbah Sumi · Rp48.500', 'tgl 14/9 botol 3 kg Rp9.000 · tgl 7/9 kardus 2 kg Rp3.000'], small: true, go: [['← Kembali', 'menu']] },
  catat: { title: 'Catat setoran', body: ['Nasabah: Pak Wiryo', 'Jenis: kardus', 'Berat: 2,5 kg'], go: [['Simpan', 'tersimpan'], ['← Kembali', 'beranda']] },
  tersimpan: { title: 'Setoran tersimpan ✓', body: ['Pak Wiryo · kardus 2,5 kg · Rp3.750'], go: [['Selesai', 'beranda']] },
  rekap: { title: 'Rekap 2 minggu', body: ['Botol plastik 46 kg', 'Gelas plastik 18 kg', 'Kardus 52 kg', 'Kaleng 21 kg'], go: [['← Kembali', 'menu']] },
  atur: { title: 'Pengaturan', body: ['Harga per kg', 'Nama pengelola'], go: [['← Kembali', 'menu']] },
};
export const SCENARIOS = [
  { who: 'Mbah Sumi', task: 'ingin tahu saldo setelah menyetor 3 kg botol plastik Sabtu lalu.', start: 'beranda', goal: 'saldo', min: 2, find: [['Tombol ☰ tanpa tulisan; saldo tersembunyi di menu, dan hurufnya kecil', true], ['Warna tombolnya kurang cerah'], ['Aplikasinya terlalu cepat'], ['Tidak ada yang membingungkan']] },
  { who: 'Mas Arif', task: 'mencatat setoran 2,5 kg kardus atas nama Pak Wiryo, lalu sadar beratnya seharusnya 3,5 kg. Perbaiki!', start: 'beranda', goal: null, min: 2, find: [['Tidak ada cara mengubah setoran yang sudah tersimpan', true], ['Tombol Simpan terlalu besar'], ['Daftar jenis sampah terlalu panjang'], ['Mas Arif kurang teliti, jadi rancangannya sudah benar']] },
  { who: 'Bu Darmi', task: 'ingin tahu berapa kilogram kaleng yang sudah terkumpul dua minggu ini.', start: 'beranda', goal: 'rekap', min: 2, find: [['Rekap tersembunyi di balik menu ikon ☰ tanpa tulisan', true], ['Angka kilogramnya terlalu besar'], ['Bu Darmi seharusnya datang ke balai'], ['Tidak ada yang membingungkan']] },
];

// --- shared pieces (also used by the extra modes) ---
function photoStrip(limit) {
  return el('div', { class: 'bs-foto-foto' }, PHOTOS.map(([a, g, c]) => {
    const ask = c < limit; const wrong = a !== g;
    return el('div', { class: `bs-foto ${ask ? 'tanya' : wrong ? 'salah' : 'benar'}` }, el('span', { class: 'bs-f-ikon' }, KIND[a][0]), el('small', null, `${KIND[g][0]} ${c}%`), el('b', null, ask ? '❓ Konfirmasi' : wrong ? '✗ Salah' : '✓'));
  }));
}
function cameraPanel(limit) {
  const r = camera(limit);
  return el('div', { class: 'bs-kamera-hasil' }, photoStrip(limit), el('div', { class: 'bs-angka' },
    el('span', null, `Diminta konfirmasi: ${r.asked} foto`), el('span', { class: r.wrong ? 'buruk' : 'baik' }, `Salah tercatat: ${r.wrong} foto`),
    el('span', null, r.wrong ? `Bank rugi ${rp(r.bank)} · nasabah rugi ${rp(r.nasabah)}` : 'Tidak ada uang yang salah hitung')));
}

function phone(title, children, cls = '') { return el('div', { class: `bs-hp ${cls}` }, el('div', { class: 'bs-hp-atas' }, title), el('div', { class: 'bs-hp-layar' }, children)); }

// Run a scenario on the draft prototype; onEnd(taps, reached) when the goal screen opens or the user gives up.
function draftRun(host, ctx, sc, onEnd, { header = null } = {}) {
  let at = sc.start; let taps = 0; let over = false; const t0 = performance.now();
  const draw = () => {
    const S = DRAFT[at];
    host.replaceChildren(...[header, el('div', { class: 'bs-uji' },
      phone(S.title, [...S.body.map((b) => el('p', { class: S.small ? 'kecil' : '' }, b)), ...S.go.map(([l, to, k]) => onTap(el('button', { class: `bs-hp-btn ${k || ''}`, type: 'button' }, l), () => {
        if (over) return; taps++; at = to; ctx.sound.tap(); draw();
        if (sc.goal && at === sc.goal) { over = true; setTimeout(() => onEnd(taps, true, performance.now() - t0), 900); }
      }))], 'uji'),
      el('div', { class: 'bs-skenario' }, el('b', null, `🎭 ${sc.who}`), el('span', null, sc.task), el('div', { class: 'bs-hitung' }, `Ketukan: ${taps}`),
        sc.goal ? null : onTap(el('button', { class: 'seg-btn', type: 'button' }, '🙅 Tidak bisa diselesaikan'), () => { if (!over) { over = true; onEnd(taps, false, performance.now() - t0); } })))].filter(Boolean));
  };
  draw();
}

// --- game data (Sayembara Aplikasi Bank Sampah) ---
const HOUSE = {
  sumi: ['🏡', 'Rumah Mbah Sumi', 'Penglihatan kurang, tidak suka mengetik', 'Saldo tanpa membaca tulisan kecil dan tanpa mengetik'],
  arif: ['🏛️', 'Balai dusun', 'Merekap 60 nasabah; sinyal sering hilang', 'Catat cepat, rekap otomatis, juga tanpa sinyal'],
  darmi: ['🚚', 'Gudang pengepul', 'Harus menebak berat sebelum mengirim mobil bak', 'Berat setiap jenis sampah yang terkumpul'],
};
const NOTE_SHORT = { 1: 'Tulisan terlalu kecil', 2: 'Datang paling pagi, sampah dicuci', 3: 'Menduga saldonya pernah keliru', 4: 'Bangga: tabungan sekolah cucu', 5: 'Ingin tahu saldo dari rumah', 6: 'Minta cucu membacakan pesan', 7: 'Cemas salah menekan tombol', 8: 'Mengira aplikasi untuk anak muda' };
const QUAD_HINT = { katakan: 'Katakan hanya untuk kutipan langsung.', pikirkan: 'Pikirkan: tidak diucapkan, tetapi tersirat.', lakukan: 'Lakukan: tindakan yang terlihat.', rasakan: 'Rasakan: perasaan seperti bangga atau cemas.' };
const INSIGHTS = [['yakin', '💡 Ingin yakin setorannya tercatat benar', [3]], ['tenang', '💡 Ingin tampilan yang tidak menakutkan dan bisa dibatalkan', [7, 8]]];

export const STATEMENTS2 = [...STATEMENTS,
  ['d', 'Bagaimana kita membantu Bu Darmi mengetahui berat setiap jenis sampah yang terkumpul, supaya ia mengirim mobil bak pada waktu yang tepat?', 'tepat'],
  ['e', 'Bagaimana kita membuat bank sampah lebih modern?', 'luas'],
  ['f', 'Bagaimana kita menambah tombol "Rekap" berwarna biru di pojok kanan atas?', 'sempit']];
const TRAYS = [['luas', '🔭', 'Terlalu luas'], ['tepat', '🎯', 'Tepat'], ['sempit', '🔬', 'Terlalu sempit']];
const RATE_HINT = { luas: 'Siapa yang dibantu, dan masalah apa? Rumusan ini tidak menyebutnya.', sempit: 'Rumusan ini sudah menentukan solusi yang sangat rinci (tombol, warna, letak).', tepat: 'Rumusan ini menyebut siapa, apa yang ingin dilakukan, dan tujuannya, tanpa menyebut solusi.' };
const SENTENCE = [['siapa', 'Bagaimana kita membantu'], ['apa', ''], ['tujuan', 'supaya']];
export const CHIPS = [['Mas Arif', 'siapa'], ['semua warga dusun', null, 'Terlalu luas: sebut satu pengguna yang jelas.'], ['mencatat 60 setoran setiap Sabtu', 'apa'], ['memakai aplikasi Excel', null, 'Itu sudah solusi. Rumusan belum boleh menyebut solusi.'], ['menekan tombol rekap biru', null, 'Terlalu sempit: sudah menentukan tombol dan warnanya.'], ['rekapnya tepat tanpa menghabiskan malam', 'tujuan'], ['aplikasinya terlihat modern', null, 'Tujuan itu untuk aplikasinya, bukan untuk Mas Arif.'], ['bank sampah juara lomba', null, 'Itu bukan kebutuhan Mas Arif.']];
const SLOT_NAME = { siapa: 'siapa yang dibantu', apa: 'apa yang ingin ia lakukan', tujuan: 'tujuannya' };

const IDEA_SHORT = { A: 'Saldo lewat pesan suara dan huruf besar', B: 'Kamera KA menebak jenis sampah', C: 'Rekap otomatis berat setiap jenis', D: 'Timbangan digital tersambung ke aplikasi', E: 'Tetap mencatat tanpa sinyal', F: 'Papan peringkat nasabah untuk semua warga' };
const GRID = [['besar-mudah', '⬆ Dampak besar', '👍 mudah dibuat'], ['besar-sulit', '⬆ Dampak besar', '🧗 sulit dibuat'], ['kecil-mudah', '⬇ Dampak kecil', '👍 mudah dibuat'], ['kecil-sulit', '⬇ Dampak kecil', '🧗 sulit dibuat']];
export const VOTE = ['A', 'C', 'E'];
const VOTE_WHY = { B: 'B butuh ribuan foto latihan dan pengujian: terlalu sulit untuk prototipe pertama.', D: 'D butuh perangkat keras khusus: sulit dan mahal untuk prototipe pertama.', F: 'F dampaknya kecil dan tidak menjawab kebutuhan siapa pun.' };

const N_SHORT = { 3: 'Tetap bisa dipakai saat sinyal hilang', 5: 'Huruf besar; tombol berikon dan bertulisan', 6: 'Saldo hanya dilihat nasabah dan pengelola', 7: 'Mencatat satu setoran ≤ 30 detik' };
const QUALITY = [['keandalan', '🛡️ Keandalan'], ['kemudahan penggunaan', '🙂 Kemudahan penggunaan'], ['keamanan dan privasi', '🔒 Keamanan dan privasi'], ['kecepatan', '⚡ Kecepatan']];

export const SLIDES = [
  ['masalah', '👵', 'Masalah: Mbah Sumi tidak bisa membaca saldonya, dan rumusan "Bagaimana kita membantu Mbah Sumi…"'],
  ['prototipe', '📱', 'Prototipe: layar saldo bersuara, layar catat setoran, layar rekap pengepul'],
  ['uji', '🧪', 'Hasil uji: saldo dari 2 ketukan menjadi 1; tombol "Ubah setoran" ditambah'],
  ['ka', '📷', 'Kamera KA hanya mengusulkan; di bawah 75% pengelola yang memutuskan'],
  [null, '✨', 'Daftar 20 fitur canggih yang mungkin dibuat', 'Juri menilai masalah dan hasil uji, bukan banyaknya fitur.'],
  [null, '📲', 'Harga ponsel terbaru', 'Tidak menjawab satu pun kriteria juri.'],
  [null, '💻', 'Kode program aplikasinya', 'Karang Taruna perlu tahu manfaat dan hasil uji, bukan kodenya.'],
];
const KRITERIA = [['masalah', 'Masalah jelas'], ['prototipe', 'Prototipe menjawab rumusan'], ['uji', 'Hasil uji dan perbaikan'], ['ka', 'Peran manusia pada KA']];

// The improved prototype after the cross test.
export const BETTER = {
  ...DRAFT,
  beranda: { title: 'Bank Sampah Sukamakmur', body: [], go: [['📒 Saldo saya', 'saldo'], ['＋ Catat setoran', 'catat'], ['📊 Rekap', 'rekap']] },
  saldo: { title: 'Saldo Mbah Sumi', body: ['Rp48.500', '🔊 Dengarkan saldo'], big: true, go: [['↩ Kembali', 'beranda']] },
  tersimpan: { ...DRAFT.tersimpan, go: [['✏️ Ubah setoran', 'ubah'], ['Selesai', 'beranda']] },
  ubah: { title: 'Ubah setoran', body: ['Pak Wiryo · kardus 2,5 kg'], go: [] },
};

const HEAD24 = {
  dusun: ['Kunjungan ke Dusun', 'Antar kartu kebutuhan ke rumah pemiliknya, lalu cari kebutuhan yang bisa bentrok.'],
  teras: ['Wawancara di Teras', 'Taruh catatan wawancara Mbah Sumi di peta empati, lalu temukan kebutuhan tersembunyi.'],
  juri: ['Meja Juri Rumusan', 'Nilai rumusan masalah, lalu rakit rumusan untuk Mas Arif.'],
  ide: ['Papan Ide', 'Taruh ide di matriks, tempel 3 stiker suara, lalu tandai risikonya.'],
  audit: ['Audit Kamera KA', 'Temukan tebakan yang salah dan hitung siapa yang rugi.'],
  batas: ['Batas Keyakinan', 'Atur kapan KA harus bertanya, lalu jadilah pengelola.'],
  rakit: ['Prototipe Kertas', 'Susun layar saldo Mbah Sumi yang memenuhi semua prinsip.'],
  uji: ['Uji Silang', 'Jalankan kartu skenario pada rancangan awal, tandai masalahnya, lalu coba perbaikannya.'],
  fn: ['Mesin Pemilah Kebutuhan', 'Pilah kartu kebutuhan: fungsional atau nonfungsional.'],
  bos: ['Presentasi Sayembara', 'Susun presentasi dua menit untuk juri Karang Taruna.'],
};

// --- game pieces ---
const msgLine = (t) => el('p', { class: 'reveal info' }, t);
const lock = (card) => { card.removeAttribute('data-drag'); card.classList.add('locked'); card.classList.remove('selected'); };

function dusunRound(area, ctx, { done }) {
  const msg = msgLine('Seret kartu kebutuhan ke rumah pemiliknya, atau ketuk kartu lalu ketuk rumahnya.');
  const houses = PERSONAS.map((p) => el('div', { class: 'bs24-rumah', 'data-drop': p.id, 'data-p': p.id },
    el('span', { class: 'bs24-atap' }, HOUSE[p.id][0]), el('b', null, `${p.icon} ${p.name}`), el('small', null, p.role), el('em', null, HOUSE[p.id][2]), el('span', { class: 'bs24-pin' })));
  const tray = el('div', { class: 'bs24-baki' }, ctx.rand.shuffle(PERSONAS.slice()).map((p) => el('div', { class: 'bs24-kartu', 'data-drag': p.id }, `📝 ${p.need}`)));
  const board = el('div', { class: 'bs24-papan' }, el('div', { class: 'bs24-jalan' }, houses), tray);
  let left = PERSONAS.length;
  const clash = () => {
    tray.remove();
    const pick = new Set(); let fin = false;
    say(msg, 'info', 'Kebutuhan dua pengguna bisa saling bertentangan. Ketuk dua rumah yang kebutuhannya paling mungkin bentrok.');
    houses.forEach((h) => { h.removeAttribute('data-drop'); h.classList.add('pilihan'); onTap(h, () => {
      if (fin) return;
      const id = h.dataset.p;
      if (pick.has(id)) { pick.delete(id); h.classList.remove('pilih'); return; }
      pick.add(id); h.classList.add('pilih'); ctx.sound.tap();
      if (pick.size < 2) return;
      if (pick.has('sumi') && pick.has('arif')) {
        fin = true; houses.forEach((x) => x.classList.toggle('bentrok', pick.has(x.dataset.p)));
        say(msg, '', 'Mas Arif butuh layar padat untuk mencatat 60 setoran dengan cepat; Mbah Sumi butuh layar sangat sederhana berhuruf besar. Jalan keluarnya: layar yang berbeda untuk setiap pengguna.');
        done(); return;
      }
      ctx.mistake(); shake(board);
      say(msg, 'bad', 'Bu Darmi hanya perlu rekap berat setiap jenis sampah; kebutuhannya tidak bertentangan dengan yang lain. Bandingkan dua pengguna yang memakai layar yang sama setiap Sabtu.');
      pick.clear(); houses.forEach((x) => x.classList.remove('pilih'));
    }); });
  };
  dnd(board, (card, box) => {
    const id = box.dataset.drop;
    if (card.dataset.drag !== id) { ctx.mistake(); shake(card); say(msg, 'bad', `Baca lagi petunjuk di ${HOUSE[id][1]}: ${HOUSE[id][2].toLowerCase()}.`); return; }
    card.remove(); box.classList.add('beres'); box.querySelector('.bs24-pin').textContent = `📌 ${HOUSE[id][3]}`; ctx.sound.tap();
    say(msg, '', `Tepat: itu kebutuhan ${PERSONAS.find((p) => p.id === id).name}.`);
    if (--left === 0) setTimeout(clash, 1500);
  });
  area.append(board, msg);
}

function terasRound(area, ctx, { done }) {
  const msg = msgLine('Catatan wawancara datang satu per satu. Seret ke kotak peta empati yang tepat.');
  const quads = QUAD.map(([k, l]) => el('div', { class: `bs24-kuadran q-${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'bs24-isi' })));
  const slot = el('div', { class: 'bs24-rekam' });
  const board = el('div', { class: 'bs24-papan' }, slot, el('div', { class: 'bs24-empati' }, quads));
  const order = ctx.rand.shuffle(EMPATHY.map((e) => e[0]));
  let i = 0; let phase = 1; let found = 0;
  const show = () => fill(slot, el('small', null, `👵 Mbah Sumi · 🎙 catatan ${i + 1} dari ${order.length}`),
    el('div', { class: 'bs24-kartu besar', 'data-drag': order[i] }, el('b', null, order[i]), EMPATHY[order[i] - 1][1]));
  const insights = () => {
    phase = 2;
    quads.forEach((q) => q.removeAttribute('data-drop'));
    board.querySelectorAll('.bs24-chip').forEach((c) => c.setAttribute('data-drop', c.dataset.n));
    fill(slot, el('small', null, '💡 Kebutuhan yang tidak tertulis di kartu persona'), INSIGHTS.map(([k, t]) => el('div', { class: 'bs24-kartu ide', 'data-drag': k }, t)));
    say(msg, 'info', 'Seret setiap kebutuhan tersembunyi ke catatan wawancara yang mengungkapkannya.');
  };
  dnd(board, (card, box) => {
    if (phase === 1) {
      const n = +card.dataset.drag; const k = box.dataset.drop;
      if (EMPATHY[n - 1][2] !== k) { ctx.mistake(); shake(card); say(msg, 'bad', QUAD_HINT[k]); return; }
      box.querySelector('.bs24-isi').append(el('span', { class: 'bs24-chip', 'data-n': n }, el('b', null, n), NOTE_SHORT[n]));
      ctx.sound.tap(); say(msg, '', EMPATHY_WHY[k]);
      if (++i < order.length) show(); else { fill(slot); setTimeout(insights, 1400); }
      return;
    }
    const ins = INSIGHTS.find((x) => x[0] === card.dataset.drag); const n = +box.dataset.drop;
    if (!ins[2].includes(n)) { ctx.mistake(); shake(card); say(msg, 'bad', 'Cari catatan yang menunjukkan rasa ragu atau takut: tidak ia ucapkan, tetapi tersirat atau terasa.'); return; }
    lock(card); card.remove(); box.classList.add('kunci'); box.removeAttribute('data-drop'); box.append(' 💡'); ctx.sound.tap();
    if (++found === INSIGHTS.length) { board.querySelectorAll('.bs24-chip[data-drop]').forEach((c) => c.removeAttribute('data-drop')); say(msg, '', 'Kebutuhan tersembunyi Mbah Sumi: nota untuk setiap setoran supaya ia yakin, dan tombol yang tidak menakutkan serta bisa dibatalkan.'); done(); }
    else say(msg, '', 'Tepat. Satu lagi.');
  });
  show();
  area.append(board, msg);
}

function juriRound(area, ctx, { done }) {
  const msg = msgLine('Kalian juri sayembara. Seret setiap kartu rumusan ke baki penilaiannya.');
  const trays = TRAYS.map(([k, ic, l]) => el('div', { class: `bs24-nampan t-${k}`, 'data-drop': k }, el('b', null, `${ic} ${l}`), el('div', { class: 'bs24-isi' })));
  const slot = el('div', { class: 'bs24-rekam' });
  const board = el('div', { class: 'bs24-papan' }, slot, el('div', { class: 'bs24-nampan-nampan' }, trays));
  const order = ctx.rand.shuffle(STATEMENTS2.slice()); let i = 0;
  const show = () => fill(slot, el('small', null, `📄 Kartu rumusan ${i + 1} dari ${order.length}`), el('div', { class: 'bs24-kartu besar', 'data-drag': order[i][0] }, order[i][1]));
  const build = () => {
    const filled = [];
    const spans = SENTENCE.map(([k]) => el('span', { class: 'bs24-rumpang', 'data-s': k }, '…'));
    const line = el('p', { class: 'bs24-kalimat' }, SENTENCE.map(([, w], j) => [w ? `${w} ` : '', spans[j], ' ']).flat(), '?');
    const chips = ctx.rand.shuffle(CHIPS.slice()).map(([t, s, why]) => onTap(el('button', { class: 'bs24-keping', type: 'button' }, t), (e) => {
      const b = e.currentTarget; if (b.disabled || filled.length === SENTENCE.length) return;
      const want = SENTENCE[filled.length][0];
      if (s !== want) { ctx.mistake(); shake(b); say(msg, 'bad', s ? `Isi dulu bagian ${SLOT_NAME[want]}.` : why); return; }
      b.disabled = true; b.classList.add('pakai'); spans[filled.length].textContent = t; spans[filled.length].classList.add('isi'); filled.push(t); ctx.sound.tap();
      if (filled.length < SENTENCE.length) { say(msg, '', `Bagus. Sekarang ${SLOT_NAME[SENTENCE[filled.length][0]]}.`); return; }
      say(msg, '', 'Rumusan tepat: siapa (Mas Arif), apa (mencatat 60 setoran), dan tujuan (rekap tepat), tanpa menyebut solusinya.'); done();
    }));
    fill(area, el('p', { class: 'bs24-sub' }, '🧩 Rakit rumusan untuk Mas Arif: ketuk keping sesuai urutan kalimat.'), line, el('div', { class: 'bs24-keping-keping' }, chips), msg);
    say(msg, 'info', `Mulai dari ${SLOT_NAME.siapa}.`);
  };
  dnd(board, (card, box) => {
    const st = STATEMENTS2.find((x) => x[0] === card.dataset.drag);
    if (st[2] !== box.dataset.drop) { ctx.mistake(); shake(card); say(msg, 'bad', RATE_HINT[st[2]]); return; }
    box.querySelector('.bs24-isi').append(el('span', { class: 'bs24-huruf' }, st[0])); ctx.sound.tap();
    say(msg, '', RATE_HINT[st[2]]);
    if (++i < order.length) show(); else { fill(slot); setTimeout(build, 2200); }
  });
  show();
  area.append(board, msg);
}

function ideRound(area, ctx, { done }) {
  const msg = msgLine('Seret setiap kartu ide ke kotak matriks dampak–kemudahan.');
  const bins = GRID.map(([k, a, b]) => el('div', { class: `bs24-sel s-${k}`, 'data-drop': k }, el('b', null, a, el('br'), b), el('div', { class: 'bs24-isi' })));
  const tray = el('div', { class: 'bs24-baki' }, ctx.rand.shuffle(IDEAS.slice()).map(([k]) => el('div', { class: 'bs24-kartu', 'data-drag': k }, el('b', null, k), IDEA_SHORT[k])));
  const board = el('div', { class: 'bs24-papan' }, el('div', { class: 'bs24-matriks' }, bins), tray);
  const chips = {}; let left = IDEAS.length;
  const flag = () => {
    let fin = false;
    say(msg, 'info', 'Ide mana yang berisiko bagi privasi nasabah? Ketuk untuk menempel 🚩.');
    Object.entries(chips).forEach(([k, c]) => onTap(c, () => {
      if (fin) return;
      if (k !== 'F') { ctx.mistake(); shake(c); say(msg, 'bad', 'Ide ini tidak membuka data nasabah lain.'); return; }
      fin = true; c.classList.add('risiko'); c.append(' 🚩'); ctx.sound.good();
      say(msg, '', 'F membuka data setoran semua nasabah: yang sedikit menyetor bisa malu, dan orang bisa tergoda menyetor sampah yang bukan miliknya.'); done();
    }));
  };
  const vote = () => {
    tray.remove();
    say(msg, 'info', 'Tempel 3 stiker suara 🟢: ketuk ide yang dibuat lebih dulu untuk prototipe pertama.');
    let phase = 'vote';
    Object.entries(chips).forEach(([k, c]) => onTap(c, () => {
      if (phase !== 'vote' || c.classList.contains('suara-ok')) return;
      c.classList.toggle('suara'); ctx.sound.tap();
      const on = Object.keys(chips).filter((x) => chips[x].classList.contains('suara'));
      if (on.length < 3) return;
      const bad = on.filter((x) => !VOTE.includes(x));
      on.filter((x) => VOTE.includes(x)).forEach((x) => chips[x].classList.add('suara-ok'));
      if (bad.length) { ctx.mistake(); bad.forEach((x) => { chips[x].classList.remove('suara'); shake(chips[x]); }); say(msg, 'bad', VOTE_WHY[bad[0]]); return; }
      phase = 'flag'; say(msg, '', 'A, C, dan E: dampaknya besar, dan bisa dibuat lebih dulu. E penting karena sinyal di balai sering hilang.');
      setTimeout(flag, 2600);
    }));
  };
  dnd(board, (card, box) => {
    const k = card.dataset.drag; const idea = IDEAS.find((x) => x[0] === k);
    if (!idea[2].includes(box.dataset.drop)) { ctx.mistake(); shake(card); say(msg, 'bad', IDEA_WHY[k]); return; }
    card.remove();
    const c = el('button', { class: 'bs24-ide', type: 'button' }, el('b', null, k), IDEA_SHORT[k]); chips[k] = c;
    box.querySelector('.bs24-isi').append(c); ctx.sound.tap(); say(msg, '', IDEA_WHY[k]);
    if (--left === 0) setTimeout(vote, 2200);
  });
  area.append(board, msg);
}

function auditRound(area, ctx, { done }) {
  const msg = msgLine('Kamera KA sudah menebak 20 foto. Ketuk foto yang tebakannya salah.');
  let found = 0; const kinds = Object.keys(KIND);
  const order = ctx.rand.shuffle(PHOTOS.map((_, i) => i));
  const money = () => {
    const tot = { bank: 0, nasabah: 0 };
    const pockets = [['bank', '🏦 Bank sampah rugi'], ['nasabah', '👵 Nasabah rugi']].map(([k, l]) => el('div', { class: 'bs24-saku', 'data-drop': k }, el('b', null, l), el('span', { class: 'bs24-uang' }, rp(0)), el('div', { class: 'bs24-isi' })));
    const wrong = PHOTOS.map((p, i) => [p, i]).filter(([p]) => p[0] !== p[1]);
    const tray = el('div', { class: 'bs24-baki' }, ctx.rand.shuffle(wrong).map(([[a, g], i]) => el('div', { class: 'bs24-kartu', 'data-drag': i }, `${KIND[a][0]} ${KIND[a][1]} 1 kg dicatat ${KIND[g][0]} ${KIND[g][1]}`)));
    const board = el('div', { class: 'bs24-papan' }, el('p', { class: 'bs24-sub' }, 'Harga per kg: 🧴 Rp3.000 · 🥤 Rp2.000 · 📦 Rp1.500 · 🥫 Rp6.000'), el('div', { class: 'bs24-saku-saku' }, pockets), tray);
    let left = wrong.length;
    dnd(board, (card, box) => {
      const [a, g] = PHOTOS[+card.dataset.drag]; const d = PRICE[g] - PRICE[a]; const who = d > 0 ? 'bank' : 'nasabah';
      if (box.dataset.drop !== who) { ctx.mistake(); shake(card); say(msg, 'bad', `Dicatat ${KIND[g][1].toLowerCase()} (${rp(PRICE[g])}/kg) padahal ${KIND[a][1].toLowerCase()} (${rp(PRICE[a])}/kg): nasabah dibayar ${rp(d)} ${d > 0 ? 'lebih' : 'kurang'}. Siapa yang menanggung selisihnya?`); return; }
      tot[who] += Math.abs(d); card.remove(); box.querySelector('.bs24-uang').textContent = rp(tot[who]); box.querySelector('.bs24-isi').append(el('span', { class: 'bs24-chip' }, `${KIND[a][0]}→${KIND[g][0]}`)); ctx.sound.tap();
      if (--left) { say(msg, '', `Tepat: selisih ${rp(Math.abs(d))}.`); return; }
      say(msg, '', 'Dua gelas tercatat botol: nasabah dibayar Rp2.000 lebih, bank sampah rugi. Satu botol tercatat gelas: nasabah dibayar Rp1.000 kurang, nasabah yang rugi.'); done();
    });
    fill(area, board, msg);
    say(msg, 'info', 'Setiap foto mewakili 1 kg. Seret setiap tebakan salah ke pihak yang rugi.');
  };
  const bars = () => {
    let fin = false;
    const rows = kinds.map((k) => { const all = PHOTOS.filter((p) => p[0] === k); const ok = all.filter((p) => p[1] === k).length;
      return onTap(el('button', { class: 'bs24-batang', type: 'button', 'data-k': k }, el('span', null, `${KIND[k][0]} ${KIND[k][1]}`), el('i', { style: { '--p': `${(ok / all.length) * 100}%` } }), el('b', null, `${ok}/${all.length}`)), (e) => {
        if (fin) return;
        if (k !== 'gelas') { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `${KIND[k][1]}: ${ok} dari ${all.length} benar. Cari batang yang paling pendek.`); return; }
        fin = true; e.currentTarget.classList.add('kena'); ctx.sound.good();
        say(msg, '', 'Gelas plastik hanya 2 dari 4 benar (50%), padahal ketepatan keseluruhan 85%. Angka rata-rata bisa menyembunyikan jenis yang sering salah.');
        setTimeout(money, 3600);
      }); });
    fill(area, el('p', { class: 'bs24-sub' }, '📷 Benar 17 dari 20 foto = 85%. Ketuk jenis yang paling sering salah ditebak.'), el('div', { class: 'bs24-batang-batang' }, rows), msg);
    say(msg, 'info', 'Ketepatan per jenis sampah.');
  };
  const grid = el('div', { class: 'bs24-foto-foto' }, order.map((i) => { const [a, g, c] = PHOTOS[i];
    return onTap(el('button', { class: 'bs24-foto', type: 'button', 'data-i': i }, el('span', { class: 'bs24-f-ikon' }, KIND[a][0]), el('small', null, `KA: ${KIND[g][0]} ${c}%`)), (e) => {
      const b = e.currentTarget; if (b.classList.contains('salah') || found === 3) return;
      if (a === g) { ctx.mistake(); shake(b); say(msg, 'bad', `Foto ini ${KIND[a][1].toLowerCase()} dan KA menebak ${KIND[g][1].toLowerCase()}: benar.`); return; }
      b.classList.add('salah'); ctx.sound.tap(); found++;
      if (found < 3) { say(msg, '', `Ketemu ${found} dari 3: ${KIND[a][1].toLowerCase()} ditebak ${KIND[g][1].toLowerCase()}.`); return; }
      say(msg, '', 'Tiga tebakan salah. 17 dari 20 benar = 85%.'); setTimeout(bars, 2200);
    }); }));
  area.append(el('div', { class: 'bs24-papan' }, el('p', { class: 'bs24-sub' }, '🔍 Foto asli di atas, tebakan KA di bawah.'), grid), msg);
}

function batasRound(area, ctx, { done }) {
  let limit = 50; let fin = false;
  const msg = msgLine('Foto yang keyakinannya di bawah batas akan ditanyakan ke pengelola. Cari batas terkecil (kelipatan 5) yang membuat tidak ada tebakan salah yang langsung tercatat.');
  const host = el('div', { class: 'bs24-papan' });
  const tile = ([a, g, c]) => el('span', { class: `bs24-mini ${a !== g ? 'keliru' : ''}` }, KIND[a][0], el('small', null, `${c}%`));
  const human = () => {
    const ask = ctx.rand.shuffle(PHOTOS.filter((p) => p[2] < 75)); let j = 0;
    const step = () => {
      const [a, g, c] = ask[j]; let doneStep = false;
      const pickKind = (k, b) => {
        if (doneStep) return;
        if (k !== a) { ctx.mistake(); shake(b); say(msg, 'bad', `Lihat fotonya: ini ${KIND[a][1].toLowerCase()}.`); return; }
        doneStep = true; ctx.sound.tap(); b.classList.add('kena');
        if (++j < ask.length) { say(msg, '', a === g ? 'Dikonfirmasi.' : `Diganti menjadi ${KIND[a][1].toLowerCase()}.`); setTimeout(step, 900); return; }
        say(msg, '', `Pengelola memeriksa ${ask.length} dari 20 foto, dan semuanya tercatat benar, termasuk 3 tebakan KA yang salah. KA mengusulkan, manusia yang memutuskan.`); done();
      };
      fill(host, el('p', { class: 'bs24-sub' }, `🧑 Kamu pengelola · foto ${j + 1} dari ${ask.length}`),
        phone('Catat setoran', [el('span', { class: 'bs24-f-ikon besar' }, KIND[a][0]), el('p', null, `📷 Tebakan: ${KIND[g][0]} ${KIND[g][1].toLowerCase()}`), el('p', null, `yakin ${c}%. Benar?`),
          onTap(el('button', { class: 'bs-hp-btn', type: 'button', 'data-ya': '' }, '✓ Ya'), (e) => pickKind(g, e.currentTarget)),
          el('div', { class: 'bs24-ganti' }, el('small', null, '🔁 Ganti jenis:'), Object.keys(KIND).filter((k) => k !== g).map((k) => onTap(el('button', { class: 'bs-hp-btn', type: 'button', 'data-k': k }, KIND[k][0]), (e) => pickKind(k, e.currentTarget))))], 'bs24-hp'));
    };
    say(msg, 'info', 'Setiap foto di bawah 75% sekarang bertanya. Tekan Ya bila tebakannya benar, atau ganti jenisnya.');
    step();
  };
  const draw = () => {
    const direct = PHOTOS.filter((p) => p[2] >= limit).sort((x, y) => y[2] - x[2]); const asked = PHOTOS.filter((p) => p[2] < limit).sort((x, y) => y[2] - x[2]);
    const bad = direct.filter((p) => p[0] !== p[1]).length;
    fill(host, el('div', { class: 'bs24-tuas' }, onTap(el('button', { class: 'seg-btn', type: 'button', 'data-d': '-' }, '− 5'), () => { if (fin) return; limit = Math.max(50, limit - 5); ctx.sound.tap(); draw(); }),
      el('b', null, `Batas keyakinan: ${limit}%`), onTap(el('button', { class: 'seg-btn', type: 'button', 'data-d': '+' }, '+ 5'), () => { if (fin) return; limit = Math.min(100, limit + 5); ctx.sound.tap(); draw(); }),
      button('Pakai batas ini', () => {
        if (fin) return;
        if (bad) { ctx.mistake(); shake(host); say(msg, 'bad', `Masih ada ${bad} tebakan salah yang langsung tercatat (merah). Naikkan batasnya.`); return; }
        if (limit > 75) { ctx.mistake(); say(msg, 'bad', `Aman, tetapi pengelola harus memeriksa ${asked.length} foto. Coba batas yang lebih kecil.`); return; }
        fin = true; say(msg, '', `Batas 75%: semua tebakan salah bertanya dulu, dan pengelola hanya memeriksa ${asked.length} dari 20 foto.`); setTimeout(human, 3200);
      }, 'primary')),
    el('div', { class: 'bs24-lajur-lajur' },
      el('div', { class: `bs24-lajur ${bad ? 'bahaya' : ''}` }, el('b', null, `✅ Langsung dicatat (${direct.length})${bad ? ` · ${bad} salah!` : ''}`), el('div', { class: 'bs24-mini-mini' }, direct.map(tile))),
      el('div', { class: 'bs24-lajur tanya' }, el('b', null, `❓ Tanya pengelola (${asked.length})`), el('div', { class: 'bs24-mini-mini' }, asked.map(tile)))));
  };
  draw();
  area.append(host, msg);
}

function rakitRound(area, ctx, { scr = 'saldo', done }) {
  const ids = []; let fin = false;
  const msg = msgLine('Ketuk komponen untuk menaruhnya di layar; ketuk lagi di layar untuk membuangnya. Daftar prinsip ikut menyala.');
  const host = el('div', { class: 'bs24-rakit' });
  const P = PARTS[scr];
  const draw = () => fill(host,
    el('div', { class: 'bs24-palet' }, P.map(([id, l]) => onTap(el('button', { class: `bs24-komp ${ids.includes(id) ? 'pakai' : ''}`, type: 'button', 'data-id': id }, l), () => { if (!fin && !ids.includes(id)) { ids.push(id); ctx.sound.tap(); draw(); } }))),
    phone(SCREENS.find((s) => s[0] === scr)[1], ids.length ? ids.map((id) => onTap(el('div', { class: `bs-hp-komp ${P.find((p) => p[0] === id)[2].btn ? 'tombol' : ''}`, 'data-id': id }, P.find((p) => p[0] === id)[1]), () => { if (fin) return; ids.splice(ids.indexOf(id), 1); draw(); })) : el('small', { class: 'bs-kosong' }, 'Layar masih kosong'), 'bs24-hp'),
    el('div', { class: 'bs24-cek' }, PRINCIPLES.map((t, i) => { const v = checkScreen(scr, ids)[i]; return el('div', { class: v === null ? 'na' : v ? 'ya' : 'tidak' }, el('b', null, v === null ? '–' : v ? '✓' : '✗'), t); })));
  draw();
  area.append(host, msg, el('div', { class: 'kode-baris' }, button('Periksa rancangan', () => {
    if (fin) return;
    const bad = ids.map((id) => P.find((p) => p[0] === id)[2].bad).filter(Boolean);
    const miss = P.filter((p) => p[2].good && !ids.includes(p[0]));
    if (bad.length) { ctx.mistake(); shake(host); say(msg, 'bad', bad[0]); return; }
    if (miss.length) { ctx.mistake(); say(msg, 'bad', `Masih ada yang kurang untuk Mbah Sumi, misalnya: ${miss[0][1].replace(/^\S+ /, '')}.`); return; }
    fin = true; say(msg, '', 'Semua prinsip terpenuhi: angka besar, tombol bergambar dan bertulisan, riwayat singkat, dan cara kembali.'); done();
  }, 'primary')));
}

// Run a scenario on a paper prototype (a map of screens); onEnd(taps, reached, ms).
function protoRun(host, ctx, screens, sc, onEnd) {
  let at = sc.start; let taps = 0; let over = false; const t0 = performance.now();
  const draw = () => {
    const S = screens[at];
    fill(host, el('div', { class: 'bs24-uji' },
      phone(S.title, [...S.body.map((b, j) => el('p', { class: S.small && j ? 'kecil' : S.big && !j ? 'besar' : '' }, b)), ...S.go.map(([l, to, k]) => onTap(el('button', { class: `bs-hp-btn ${k || ''}`, type: 'button', 'data-to': to }, l), () => {
        if (over) return; taps++; at = to; ctx.sound.tap(); draw();
        if (sc.goal && at === sc.goal) { over = true; setTimeout(() => onEnd(taps, true, performance.now() - t0), 1100); }
      }))], 'bs24-hp uji'),
      el('div', { class: 'bs24-skenario' }, el('b', null, `🎭 ${sc.who}`), el('span', null, sc.task), el('div', { class: 'bs24-hitung' }, `👆 Ketukan: ${taps}`),
        sc.goal ? null : onTap(el('button', { class: 'seg-btn bs24-nyerah', type: 'button' }, '🙅 Tidak bisa diselesaikan'), (e) => {
          if (over) return;
          if (taps < (sc.minTry || 0)) { shake(e.currentTarget); sc.nudge?.(); return; }
          over = true; onEnd(taps, false, performance.now() - t0);
        }))));
  };
  draw();
}

function ujiRound(area, ctx, { done }) {
  const msg = msgLine('Kamu memerankan Mbah Sumi pada rancangan awal tim lain. Ketuk tombol di layar ponsel; penguji tidak boleh membantu.');
  const host = el('div', { class: 'bs24-papan' });
  area.append(host, msg);
  let first = 0;
  const fixArif = () => {
    let kg = 25; let fin = false;
    const draw = () => fill(host, el('div', { class: 'bs24-uji' }, phone('Ubah setoran', [el('p', null, 'Pak Wiryo · kardus'),
      el('div', { class: 'bs24-stepper' }, onTap(el('button', { class: 'bs-hp-btn', type: 'button', 'data-d': '-' }, '−'), () => { if (!fin && kg > 5) { kg -= 5; ctx.sound.tap(); draw(); } }), el('b', null, `${(kg / 10).toLocaleString('id-ID')} kg`), onTap(el('button', { class: 'bs-hp-btn', type: 'button', 'data-d': '+' }, '+'), () => { if (!fin && kg < 60) { kg += 5; ctx.sound.tap(); draw(); } })),
      el('p', { class: 'kecil' }, 'Alasan: salah timbang'),
      onTap(el('button', { class: 'bs-hp-btn', type: 'button', 'data-simpan': '' }, '✅ Simpan perubahan'), (e) => {
        if (fin) return;
        if (kg !== 35) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `Beratnya seharusnya 3,5 kg, bukan ${(kg / 10).toLocaleString('id-ID')} kg.`); return; }
        fin = true; ctx.sound.good(); say(msg, '', 'Perbaikan berhasil: setoran Pak Wiryo menjadi 3,5 kg (Rp5.250), dan perubahan beserta alasannya tercatat.'); done();
      })], 'bs24-hp uji'), el('div', { class: 'bs24-skenario' }, el('b', null, '🎭 Mas Arif'), el('span', null, 'Rancangan baru punya tombol "Ubah setoran". Ubah beratnya menjadi 3,5 kg.'))));
    say(msg, 'info', 'Coba rancangan yang sudah diperbaiki.'); draw();
  };
  const arif = () => {
    say(msg, 'info', 'Sekarang kamu Mas Arif. Catat setoran Pak Wiryo, lalu perbaiki beratnya. Bila tidak bisa, tekan "Tidak bisa diselesaikan".');
    const nudge = () => say(msg, 'info', 'Coba dulu: catat setoran Pak Wiryo dan simpan, lalu cari cara mengubah beratnya.');
    protoRun(host, ctx, DRAFT, { ...SCENARIOS[1], minTry: 2, nudge }, (taps) => {
      say(msg, 'info', `📝 Kartu masalah (setelah ${taps} ketukan): rancangan awal tidak punya cara mengubah setoran yang sudah tersimpan.`);
      setTimeout(() => protoRun(host, ctx, BETTER, { who: 'Mas Arif', task: 'Rancangan baru: buka tombol "Ubah setoran".', start: 'tersimpan', goal: 'ubah' }, fixArif), 3200);
    });
  };
  const retry = () => {
    say(msg, 'info', 'Tim pembuat memasang tombol "📒 Saldo saya" di beranda dan memperbesar angkanya. Uji lagi sebagai Mbah Sumi.');
    protoRun(host, ctx, BETTER, SCENARIOS[0], (taps) => { say(msg, '', `Sekarang ${taps} ketukan (tadi ${first}), dan angkanya besar.`); setTimeout(arif, 2800); });
  };
  const stickers = () => {
    let hit = 0;
    const part = (t, bad, extra = '') => onTap(el('button', { class: `bs24-tempel ${extra}`, type: 'button', 'data-bad': bad ? '1' : '' }, t), (e) => {
      const b = e.currentTarget; if (b.classList.contains('stiker')) return;
      if (!bad) { ctx.mistake(); shake(b); say(msg, 'bad', 'Bagian ini jelas bagi Mbah Sumi. Ingat: ia sempat bingung di mana?'); return; }
      b.classList.add('stiker'); ctx.sound.tap();
      if (++hit < 2) { say(msg, '', 'Ditandai 🔴. Satu lagi.'); return; }
      say(msg, '', 'Temuan: tombol ☰ tanpa tulisan menyembunyikan saldo, dan riwayatnya berhuruf kecil.'); setTimeout(retry, 2600);
    });
    fill(host, el('p', { class: 'bs24-sub' }, '🔴 Tempel stiker merah pada dua bagian yang membuat Mbah Sumi bingung.'),
      el('div', { class: 'bs24-uji' },
        phone(DRAFT.beranda.title, [part('Selamat datang', false), part('☰', true, 'ikon'), part('＋ Catat setoran', false)], 'bs24-hp'),
        phone(DRAFT.saldo.title, [part(DRAFT.saldo.body[0], false), part(DRAFT.saldo.body[1], true, 'kecil'), part('← Kembali', false)], 'bs24-hp')));
  };
  protoRun(host, ctx, DRAFT, SCENARIOS[0], (taps) => { first = taps; say(msg, '', `Selesai dalam ${taps} ketukan, tetapi Mbah Sumi sempat bingung.`); setTimeout(stickers, 2400); });
}

function fnRound(area, ctx, { done }) {
  const msg = msgLine('Kartu kebutuhan datang di ban berjalan. Ketuk gerbang yang tepat.');
  const host = el('div', { class: 'bs24-papan' });
  const order = ctx.rand.shuffle(NEEDS.map((x) => x[0])); let i = 0; const cnt = { F: 0, N: 0 };
  const label = () => {
    const ns = NEEDS.filter((x) => x[2] === 'N'); let left = ns.length;
    const cards = ns.map(([n]) => el('div', { class: 'bs24-butuh', 'data-drop': n }, el('b', null, n), el('span', null, N_SHORT[n]), el('span', { class: 'bs24-label' })));
    const chips = el('div', { class: 'bs24-baki' }, ctx.rand.shuffle(QUALITY.slice()).map(([k, l]) => el('div', { class: 'bs24-kartu', 'data-drag': k }, l)));
    const board = el('div', { class: 'bs24-papan' }, el('div', { class: 'bs24-butuh-butuh' }, cards), chips);
    dnd(board, (card, box) => {
      const need = NEEDS[+box.dataset.drop - 1];
      if (need[3] !== card.dataset.drag) { ctx.mistake(); shake(card); say(msg, 'bad', 'Belum cocok. Tanyakan: mutu apa yang dijaga kartu ini?'); return; }
      card.remove(); box.removeAttribute('data-drop'); box.classList.add('beres'); box.querySelector('.bs24-label').textContent = QUALITY.find((q) => q[0] === need[3])[1]; ctx.sound.tap();
      if (--left) { say(msg, '', 'Tepat.'); return; }
      say(msg, '', 'Kebutuhan nonfungsional menyebut mutu: keandalan, kemudahan, keamanan, dan kecepatan. Semuanya bisa diuji, misalnya "≤ 30 detik".'); done();
    });
    fill(area, board, msg); say(msg, 'info', 'Beri setiap kebutuhan nonfungsional label mutunya.');
  };
  const draw = () => {
    const [n, t, k] = NEEDS[order[i] - 1];
    const gate = (g, ic, l) => onTap(el('button', { class: `bs24-gerbang g-${g}`, type: 'button', 'data-g': g }, el('b', null, `${ic} ${g}`), el('span', null, l), el('em', null, `${cnt[g]} kartu`)), (e) => {
      if (g !== k) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', k === 'F' ? 'Kartu ini menyebut sesuatu yang dapat dilakukan sistem (fungsi).' : 'Kartu ini menyebut seberapa baik sistem bekerja (mutu), bukan fungsi baru.'); return; }
      cnt[g]++; ctx.sound.tap(); say(msg, '', k === 'F' ? 'Fungsional: sesuatu yang dapat dilakukan sistem.' : `Nonfungsional: ${NEEDS[n - 1][3]}.`);
      if (++i < order.length) draw(); else { fill(host, el('p', { class: 'bs24-sub' }, `⚙️ F: ${cnt.F} kartu · 📏 N: ${cnt.N} kartu`)); setTimeout(label, 1800); }
    });
    fill(host, el('p', { class: 'bs24-sub' }, `📦 Kartu ${i + 1} dari ${order.length}`), el('div', { class: 'bs24-ban' }, gate('F', '⚙️', 'Fungsional: apa yang dapat dilakukan sistem'), el('div', { class: 'bs24-kartu besar' }, el('b', null, n), t), gate('N', '📏', 'Nonfungsional: seberapa baik sistem bekerja')));
  };
  draw();
  area.append(host, msg);
}

function bosRound(area, ctx, { done }) {
  const msg = msgLine('Seret empat kartu slide ke garis waktu dua menit. Juri menyala saat kriterianya terpenuhi.');
  const judges = KRITERIA.map(([k, l]) => el('div', { class: 'bs24-juri', 'data-k': k }, el('span', null, '🧑‍⚖️'), el('small', null, l)));
  const slots = ['0:00', '0:30', '1:00', '1:30'].map((t, j) => el('div', { class: 'bs24-slot', 'data-drop': j }, el('b', null, t)));
  const tray = el('div', { class: 'bs24-baki' }, ctx.rand.shuffle(SLIDES.map((s, i) => i)).map((i) => el('div', { class: 'bs24-kartu slide', 'data-drag': i }, el('b', null, SLIDES[i][1]), SLIDES[i][2])));
  const bar = el('div', { class: 'bs24-waktu' }, el('i'));
  const board = el('div', { class: 'bs24-papan' }, el('div', { class: 'bs24-juri-juri' }, judges), el('div', { class: 'bs24-garis' }, slots), bar, tray);
  let filled = 0;
  dnd(board, (card, box) => {
    const s = SLIDES[+card.dataset.drag]; const j = +box.dataset.drop;
    if (!s[0]) { ctx.mistake(); shake(card); say(msg, 'bad', s[3]); return; }
    if (box.querySelector('.bs24-kartu')) { ctx.mistake(); say(msg, 'bad', 'Slot ini sudah terisi.'); return; }
    if ((j === 0) !== (s[0] === 'masalah')) { ctx.mistake(); shake(card); say(msg, 'bad', j === 0 ? 'Buka dengan masalahnya: juri perlu tahu dulu siapa yang dibantu.' : 'Masalah dibuka paling awal, di 0:00.'); return; }
    lock(card); box.append(card); judges.find((x) => x.dataset.k === s[0]).classList.add('nyala'); ctx.sound.tap();
    if (++filled < 4) { say(msg, '', `Juri "${KRITERIA.find((x) => x[0] === s[0])[1]}" mengangkat ✓.`); return; }
    tray.remove(); bar.classList.add('jalan'); say(msg, 'info', '⏱ Presentasi berjalan…');
    setTimeout(() => { say(msg, '', '🏆 Empat juri mengangkat ✓: masalah jelas, prototipe menjawab rumusan, hasil uji dan perbaikan, dan pengelola tetap memutuskan pada fitur KA.'); done(); }, 2400);
  });
  area.append(board, msg);
}

export default {
  id: 'sma-24-bank-sampah',
  title: 'Aplikasi Bank Sampah',
  topic: 'Design thinking: merancang sistem dari kebutuhan pengguna',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '♻️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Sayembara aplikasi bank sampah dusun: kunjungi pengguna, susun peta empati, nilai rumusan masalah, pilih ide, audit kamera KA, susun prototipe, uji silang, pilah kebutuhan, dan presentasikan di depan juri.',
  extraModes: [
    { id: 'prototipe', icon: '📱', label: 'Pembuat Prototipe', desc: 'Susun tiga layar ponsel dari komponen, periksa dengan daftar prinsip, lalu uji dengan menghitung ketukan', create: createBuilder },
    { id: 'kamera', icon: '📷', label: 'Simulasi Kamera KA', desc: 'Atur batas keyakinan dan lihat foto yang meminta konfirmasi, ketepatan per jenis, dan selisih uang akibat salah tebak', create: createCamera },
    { id: 'giliran', icon: '🎭', label: 'Uji Silang', desc: 'Tim bergiliran memerankan pengguna pada prototipe rancangan awal; aplikasi menghitung ketukan dan waktu, lalu tim menemukan bagian yang membingungkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bs24-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'bs24-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD24[k], '♻️'), area); };
      const fin = (ms) => ({ done: () => next(ms) });
      if (r === 0) { go('dusun', 1); dusunRound(area, ctx, fin(6500)); }
      else if (r === 1) { go('teras', 1); terasRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('juri', 2); juriRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('ide', 3); ideRound(area, ctx, fin(6500)); }
      else if (r === 4) { go('audit', 4); auditRound(area, ctx, fin(6500)); }
      else if (r === 5) { go('batas', 4); batasRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('rakit', 5); rakitRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('uji', 5); ujiRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('fn', 6); fnRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7500)); }
    }
    render();
  },
};

// --- extra modes ---
function createBuilder(root, ctx) {
  const wrap = el('div', { class: 'act bank-sampah' });
  root.append(wrap);
  const ids = { saldo: [], catat: [], rekap: [] };
  let scr = 'saldo'; let test = false; let taps = 0; let t0 = 0;
  const NAV = { saldo: '📒 Ke layar saldo', catat: '➕ Ke layar catat', rekap: '📊 Ke layar rekap' };
  function draw() {
    const P = PARTS[scr];
    const nav = Object.keys(NAV).filter((k) => k !== scr).map((k) => onTap(el('button', { class: 'bs-hp-btn', type: 'button' }, NAV[k]), () => { if (test) { taps++; ctx.sound.tap(); } scr = k; draw(); }));
    const screen = phone(SCREENS.find((s) => s[0] === scr)[1], [...(ids[scr].length ? ids[scr].map((id) => onTap(el('div', { class: `bs-hp-komp ${P.find((p) => p[0] === id)[2].btn ? 'tombol' : ''}` }, P.find((p) => p[0] === id)[1]), () => { if (test) { taps++; ctx.sound.tap(); draw(); return; } ids[scr].splice(ids[scr].indexOf(id), 1); draw(); })) : [el('small', { class: 'bs-kosong' }, 'Layar masih kosong')]), ...(test ? nav : [])], test ? 'uji' : '');
    const checks = el('table', { class: 'bs-tabel cek' }, el('tr', null, el('th', null, 'Prinsip'), ...SCREENS.map(([k]) => el('th', null, k === 'saldo' ? 'Layar 1' : k === 'catat' ? 'Layar 2' : 'Layar 3'))),
      ...PRINCIPLES.map((t, i) => el('tr', null, el('td', null, t), ...SCREENS.map(([k]) => { const v = checkScreen(k, ids[k])[i]; return el('td', { class: v === null ? '' : v ? 'benar' : 'salah' }, v === null ? '–' : v ? '✓' : '✗'); }))));
    wrap.replaceChildren(el('p', { class: 'prompt' }, test ? 'Mode uji: ketuk seperti pengguna' : 'Pembuat prototipe'),
      el('div', { class: 'seg' }, SCREENS.map(([k, l]) => onTap(el('button', { class: `seg-btn ${scr === k ? 'on' : ''}`, type: 'button' }, l), () => { if (test) { taps++; } scr = k; draw(); }))),
      el('div', { class: 'bs-rakit' }, test ? el('div', { class: 'bs-skenario' }, el('b', null, '⏱ Uji'), el('span', null, 'Pengguna mengetuk; penguji mencatat bagian yang membingungkan.'), el('div', { class: 'bs-hitung' }, `Ketukan: ${taps} · ${Math.round((performance.now() - t0) / 1000)} detik`))
        : el('div', { class: 'bs-palet' }, P.map(([id, l]) => onTap(el('button', { class: `bs-komp ${ids[scr].includes(id) ? 'pakai' : ''}`, type: 'button' }, l), () => { if (!ids[scr].includes(id)) { ids[scr].push(id); ctx.sound.tap(); draw(); } }))),
        screen, checks),
      el('div', { class: 'kode-baris' }, button(test ? '✏️ Kembali menyusun' : '▶ Mode uji', () => { test = !test; taps = 0; t0 = performance.now(); draw(); }, 'primary'), test ? null : button('Kosongkan layar ini', () => { ids[scr] = []; draw(); })));
  }
  draw();
}

function createCamera(root, ctx) {
  const wrap = el('div', { class: 'act bank-sampah' });
  root.append(wrap);
  let limit = 0;
  function draw() {
    const r = camera(limit);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Simulasi kamera KA pengenal sampah'),
      el('div', { class: 'bs-batas' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '− 5'), () => { limit = Math.max(0, limit - 5); draw(); }), el('b', null, limit ? `Minta konfirmasi bila yakin < ${limit}%` : 'Tanpa konfirmasi: KA memutuskan sendiri'), onTap(el('button', { class: 'seg-btn', type: 'button' }, '+ 5'), () => { limit = Math.min(100, limit + 5); draw(); })),
      cameraPanel(limit),
      el('div', { class: 'bs-per-jenis' }, r.per.map(([k, ok, n]) => el('span', null, `${KIND[k][0]} ${KIND[k][1]}: ${ok}/${n} benar (${Math.round((ok / n) * 1000) / 10}%)`)), el('span', null, `Total: 17/20 = 85%`)),
      el('p', { class: 'reveal info' }, 'Ketepatan keseluruhan 85% menyembunyikan gelas plastik yang hanya 50% benar. Makin tinggi batasnya, makin aman, tetapi pengelola makin sering memeriksa.'));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act bank-sampah' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const turns = nT * 2;
    const order = ctx.rand.shuffle([0, 1, 2]);
    function turn() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Uji skenario selesai', pts, again: () => pickTeams(wrap, 'Uji Skenario', start) }); return; }
      const a = k % nT; const sc = SCENARIOS[order[k % 3]];
      const msg = el('p', { class: 'reveal info' }, `Tim ${a + 1} memerankan ${sc.who}. Tim lain mengamati tanpa membantu.`);
      const host = el('div');
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: kartu skenario`), host, msg);
      draftRun(host, ctx, sc, (taps, reached, ms) => {
        const fast = reached && taps <= sc.min + 1; if (fast) pts[a]++;
        say(msg, '', `${reached ? `Selesai dalam ${taps} ketukan` : `Berhenti setelah ${taps} ketukan`}, ${Math.round(ms / 1000)} detik.${fast ? ' +1 poin karena cepat.' : ''} Sekarang: apa yang membingungkan?`);
        setTimeout(() => {
          let doneQ = false;
          const area = el('div', { class: 'opts', style: { '--cols': 2 } }, ctx.rand.shuffle(sc.find.slice()).map(([l, ok]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), (e) => {
            if (doneQ) return; doneQ = true; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
            if (ok) pts[a] += 2;
            say(msg, ok ? '' : 'bad', ok ? `Tepat, +2 poin. Usul perbaikan dicatat untuk tim pembuat.` : `Temuan utamanya: ${sc.find[0][0].toLowerCase()}.`);
            k++; setTimeout(turn, 3000);
          })));
          wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: bagian mana yang membingungkan ${sc.who}?`), area, msg);
        }, 2200);
      }, { header: null });
    }
    turn();
  }
  pickTeams(wrap, 'Uji Skenario', start);
}
