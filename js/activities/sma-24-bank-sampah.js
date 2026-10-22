// Aplikasi Bank Sampah — SMA/SMK (16–18 tahun), design thinking.
// Personas, an empathy map, "Bagaimana kita…" statements, an impact–effort
// matrix, an AI camera with a confidence threshold, a paper-prototype builder,
// scenario testing and functional vs nonfunctional requirements.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

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

// --- pieces ---
// Sort cards into bins by drag or tap. right(item, bin) → true, or a hint string.
function sortBoard(wrap, ctx, { prompt, items, bins, right, why, cls = '', done, info = 'Seret kartu ke kotak yang tepat, atau ketuk kartu lalu ketuk kotaknya.' }) {
  const msg = el('p', { class: 'reveal info' }, info);
  const tray = el('div', { class: 'bs-baki' }, ctx.rand.shuffle(items.slice()).map((it) => el('div', { class: 'bs-kartu', 'data-drag': it.id }, it.tag ? el('b', null, it.tag) : null, el('span', null, it.label))));
  const boxes = bins.map(([id, name]) => el('div', { class: 'bs-kotak', 'data-drop': id }, el('b', null, name), el('div', { class: 'bs-isi' })));
  const area = el('div', { class: `bs-sortir ${cls}` }, el('div', { class: 'bs-kotak-kotak' }, boxes), tray);
  let left = items.length;
  dnd(area, (card, box) => {
    const it = items.find((x) => String(x.id) === card.dataset.drag);
    const res = right(it, box.dataset.drop);
    if (res !== true) { ctx.mistake(); shake(card); say(msg, 'bad', typeof res === 'string' ? res : 'Belum tepat. Baca lagi kartunya.'); return; }
    card.removeAttribute('data-drag'); card.classList.add('locked'); box.querySelector('.bs-isi').append(card); ctx.sound.tap();
    say(msg, '', why ? why(it) : 'Tepat.');
    if (--left === 0) setTimeout(done, 1600);
  });
  wrap.append(el('p', { class: 'prompt' }, prompt), area, msg);
}

function personaCard(p) {
  return el('div', { class: 'bs-persona' }, el('div', { class: 'bs-p-kepala' }, el('span', { class: 'bs-p-ikon' }, p.icon), el('div', null, el('b', null, p.name), el('small', null, p.role))), el('ul', null, p.rows.map((r) => el('li', null, r))));
}

function rateRound(wrap, ctx, { done }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, 'Rumusan yang baik menyebut siapa, apa yang ingin dilakukan, dan tujuannya, tanpa menyebut solusinya.');
  const rows = el('div', { class: 'bs-rumusan' });
  const draw = () => rows.replaceChildren(...STATEMENTS.map(([k, t, ans]) => el('div', { class: `bs-r-baris ${k in res ? 'beres' : ''}` }, el('span', null, `${k}. ${t}`),
    k in res ? el('b', null, RATING.find((x) => x[0] === ans)[1]) : el('div', { class: 'seg' }, RATING.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (v !== ans) { ctx.mistake(); say(msg, 'bad', k === 'a' ? 'Rumusan ini menyebut solusi (aplikasi) dan tidak menyebut siapa yang dibantu.' : k === 'b' ? 'Rumusan ini sudah menentukan solusi yang sangat rinci.' : 'Rumusan ini menyebut siapa, apa, dan tujuannya tanpa menyebut solusi.'); return; }
      res[k] = v; ctx.sound.tap(); draw();
      if (Object.keys(res).length === STATEMENTS.length) { say(msg, '', 'a terlalu luas dan b terlalu sempit; keduanya sudah menyebut solusi. c membuka banyak kemungkinan solusi.'); done(); }
    }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Merumuskan masalah: nilai setiap rumusan.'), rows, msg);
}

function cameraTable() {
  const kinds = Object.keys(KIND);
  return el('table', { class: 'bs-tabel' }, el('tr', null, el('th', null, 'Sebenarnya ↓ · ditebak →'), ...kinds.map((k) => el('th', null, KIND[k][0])), el('th', null, 'Foto')),
    ...kinds.map((a) => el('tr', null, el('th', null, `${KIND[a][0]} ${KIND[a][1]}`), ...kinds.map((g) => { const n = PHOTOS.filter((p) => p[0] === a && p[1] === g).length; return el('td', { class: a === g ? 'benar' : n ? 'salah' : '' }, n); }), el('td', null, PHOTOS.filter((p) => p[0] === a).length))));
}

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
function thresholdRound(wrap, ctx, { done }) {
  let limit = 50; let fin = false;
  const host = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Foto dengan keyakinan di bawah batas meminta konfirmasi pengelola. Cari batas terkecil (kelipatan 5) yang membuat tidak ada tebakan salah yang tercatat.');
  const draw = () => host.replaceChildren(el('div', { class: 'bs-batas' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '− 5'), () => { if (fin) return; limit = Math.max(50, limit - 5); draw(); }), el('b', null, `Batas keyakinan: ${limit}%`), onTap(el('button', { class: 'seg-btn', type: 'button' }, '+ 5'), () => { if (fin) return; limit = Math.min(100, limit + 5); draw(); }),
    button('Pakai batas ini', () => {
      if (fin) return;
      const r = camera(limit);
      if (r.wrong) { ctx.mistake(); say(msg, 'bad', `Masih ada ${r.wrong} tebakan salah yang langsung tercatat. Naikkan batasnya.`); return; }
      if (limit > 75) { ctx.mistake(); say(msg, 'bad', `Aman, tetapi ${r.asked} foto harus dikonfirmasi. Coba batas yang lebih kecil.`); return; }
      fin = true; say(msg, '', `Batas 75%: semua tebakan salah meminta konfirmasi, dan pengelola hanya memeriksa ${r.asked} dari 20 foto.`); done();
    }, 'primary')), cameraPanel(limit));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Simulasi kamera KA: kapan aplikasi harus bertanya?'), host, msg);
}

function phone(title, children, cls = '') { return el('div', { class: `bs-hp ${cls}` }, el('div', { class: 'bs-hp-atas' }, title), el('div', { class: 'bs-hp-layar' }, children)); }

function buildRound(wrap, ctx, { scr = 'saldo', done }) {
  const ids = [];
  const msg = el('p', { class: 'reveal info' }, 'Ketuk komponen untuk menaruhnya di layar; ketuk lagi di layar untuk membuangnya. Lalu periksa dengan daftar prinsip.');
  const host = el('div', { class: 'bs-rakit' });
  const P = PARTS[scr];
  const draw = () => host.replaceChildren(
    el('div', { class: 'bs-palet' }, P.map(([id, l]) => onTap(el('button', { class: `bs-komp ${ids.includes(id) ? 'pakai' : ''}`, type: 'button' }, l), () => { if (!ids.includes(id)) { ids.push(id); ctx.sound.tap(); draw(); } }))),
    phone(SCREENS.find((s) => s[0] === scr)[1], ids.length ? ids.map((id) => onTap(el('div', { class: `bs-hp-komp ${P.find((p) => p[0] === id)[2].btn ? 'tombol' : ''}` }, P.find((p) => p[0] === id)[1]), () => { ids.splice(ids.indexOf(id), 1); draw(); })) : el('small', { class: 'bs-kosong' }, 'Layar masih kosong')),
    el('div', { class: 'bs-cek' }, PRINCIPLES.map((t, i) => { const v = checkScreen(scr, ids)[i]; return el('div', { class: v === null ? 'na' : v ? 'ya' : 'tidak' }, el('b', null, v === null ? '–' : v ? '✓' : '✗'), t); })));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Prototipe kertas: susun layar saldo untuk Mbah Sumi.'), host, msg,
    el('div', { class: 'kode-baris' }, button('Periksa rancangan', () => {
      const bad = ids.map((id) => P.find((p) => p[0] === id)[2].bad).filter(Boolean);
      const miss = P.filter((p) => p[2].good && !ids.includes(p[0]));
      if (bad.length) { ctx.mistake(); shake(host); say(msg, 'bad', bad[0]); return; }
      if (miss.length) { ctx.mistake(); say(msg, 'bad', `Masih ada yang kurang untuk Mbah Sumi, misalnya: ${miss[0][1].replace(/^\S+ /, '')}.`); return; }
      say(msg, '', 'Semua prinsip terpenuhi: angka besar, tombol bergambar dan bertulisan, riwayat singkat, dan cara kembali.'); done();
    }, 'primary')));
}

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
  goal: 'Rancang aplikasi bank sampah dusun dari kebutuhan Mbah Sumi, Mas Arif, dan Bu Darmi: peta empati, rumusan masalah, pilih ide, uji fitur kamera KA, susun prototipe, dan uji dengan skenario.',
  extraModes: [
    { id: 'prototipe', icon: '📱', label: 'Pembuat Prototipe', desc: 'Susun tiga layar ponsel dari komponen, periksa dengan daftar prinsip, lalu uji dengan menghitung ketukan', create: createBuilder },
    { id: 'kamera', icon: '📷', label: 'Simulasi Kamera KA', desc: 'Atur batas keyakinan dan lihat foto yang meminta konfirmasi, ketepatan per jenis, dan selisih uang akibat salah tebak', create: createCamera },
    { id: 'giliran', icon: '🎭', label: 'Uji Skenario', desc: 'Tim bergiliran memerankan pengguna pada prototipe rancangan awal; aplikasi menghitung ketukan dan waktu, lalu tim menemukan bagian yang membingungkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bank-sampah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const personas = () => el('div', { class: 'bs-persona-persona' }, PERSONAS.map(personaCard));
      if (r === 0) sortBoard(wrap, ctx, { prompt: 'Kenali penggunanya: taruh kebutuhan utama di bawah persona yang tepat.', cls: 'persona', bins: PERSONAS.map((p) => [p.id, `${p.icon} ${p.name} · ${p.role}`]),
        items: PERSONAS.map((p) => ({ id: p.id, label: p.need })),
        right: (it, b) => it.id === b || `Baca lagi kartu persona ${PERSONAS.find((p) => p.id === b).name}: kesulitan dan harapannya.`,
        why: (it) => `${PERSONAS.find((p) => p.id === it.id).name}: ${PERSONAS.find((p) => p.id === it.id).rows[3].toLowerCase()}.`,
        done: then(() => ask('Kebutuhan siapa yang bisa saling bertentangan?', [['Mas Arif ingin mencatat banyak data dengan cepat, sedangkan Mbah Sumi butuh tampilan sangat sederhana; layar keduanya sebaiknya berbeda', true], ['Mbah Sumi dan Bu Darmi sama-sama ingin menelepon'], ['Tidak ada; ketiganya ingin hal yang sama'], ['Bu Darmi ingin harga murah, jadi aplikasi harus gratis']], 1, personas())) });
      else if (r === 1) sortBoard(wrap, ctx, { prompt: 'Peta empati Mbah Sumi: taruh setiap catatan wawancara di kotaknya.', cls: 'empati', bins: QUAD,
        items: EMPATHY.map(([n, t]) => ({ id: n, tag: n, label: t })),
        right: (it, b) => EMPATHY[it.id - 1][2] === b || (b === 'katakan' ? 'Katakan hanya untuk kutipan langsung.' : b === 'pikirkan' ? 'Pikirkan: tidak diucapkan, tetapi tersirat.' : b === 'lakukan' ? 'Lakukan: tindakan yang terlihat.' : 'Rasakan: perasaan seperti bangga atau cemas.'),
        why: (it) => EMPATHY_WHY[EMPATHY[it.id - 1][2]], done: next });
      else if (r === 2) ask('Kebutuhan Mbah Sumi apa yang tidak terlihat di kartu persona, tetapi muncul di peta empati?', [['Rasa yakin bahwa catatannya benar, misalnya nota setiap setoran, dan tampilan yang tidak menakutkan serta bisa dibatalkan', true], ['Ponsel yang lebih mahal'], ['Aplikasi berbahasa Inggris'], ['Papan peringkat supaya ia bersemangat']], 1,
        el('div', { class: 'bs-peta kecil' }, QUAD.map(([k, l]) => el('div', null, el('b', null, l), ...EMPATHY.filter((e) => e[2] === k).map((e) => el('small', null, `${e[0]}. ${e[1]}`))))));
      else if (r === 3) rateRound(wrap, ctx, { done: then(() => ask('Rumusan mana yang tepat untuk Mas Arif?', [['Bagaimana kita membantu Mas Arif mencatat 60 setoran setiap Sabtu supaya rekapnya tepat tanpa menghabiskan malam?', true], ['Bagaimana kita membuat Excel untuk Mas Arif?'], ['Bagaimana kita membuat tombol rekap berwarna biru?'], ['Bagaimana kita membuat bank sampah lebih modern?']])) });
      else if (r === 4) sortBoard(wrap, ctx, { prompt: 'Memilih ide: taruh setiap ide di matriks dampak–kemudahan.', cls: 'matriks', bins: MATRIX,
        items: IDEAS.map(([k, t]) => ({ id: k, tag: k, label: t })),
        right: (it, b) => IDEAS.find((x) => x[0] === it.id)[2].includes(b) || IDEA_WHY[it.id], why: (it) => IDEA_WHY[it.id],
        done: then(() => ask('Tiga ide mana yang paling masuk akal untuk prototipe pertama?', [['A, C, dan E: dampaknya besar dan bisa dibuat lebih dulu', true], ['B, D, dan F: paling canggih'], ['A, B, dan D'], ['C, D, dan F']], 1, null,
          then(() => ask('Apa risiko ide F (papan peringkat untuk semua warga)?', [['Data setoran nasabah terbuka untuk semua, yang sedikit menyetor bisa malu, dan orang bisa tergoda menyetor sampah yang bukan miliknya', true], ['Tidak ada risiko; semua orang suka peringkat'], ['Ponsel menjadi lambat'], ['Harga sampah naik']])))) });
      else if (r === 5) ask('Kamera KA diuji pada 20 foto. Berapa persen yang ditebak benar?', [80, 85, 90, 75].sort((a, b) => a - b).map((x) => [`${x}%`, x === 85]), 4, cameraTable(),
        then(() => ask('Jenis mana yang paling sering salah ditebak?', Object.keys(KIND).map((k) => [`${KIND[k][0]} ${KIND[k][1]}`, k === 'gelas']), 4, cameraTable(),
          then(() => ask('Setiap foto mewakili 1 kg. Apa akibat tebakan yang salah?', [['2 gelas tercatat botol: nasabah dibayar Rp2.000 lebih, bank sampah rugi. 1 botol tercatat gelas: nasabah dibayar Rp1.000 kurang, nasabah rugi', true], ['Tidak ada selisih uang, karena beratnya sama'], ['Nasabah selalu untung Rp3.000'], ['Bank sampah rugi Rp6.000']], 1, el('div', { class: 'bs-dua' }, cameraTable(), el('p', { class: 'bs-harga' }, 'Harga: 🧴 Rp3.000 · 🥤 Rp2.000 · 📦 Rp1.500 · 🥫 Rp6.000 per kg')))))));
      else if (r === 6) thresholdRound(wrap, ctx, { done: then(() => ask('Siapa yang sebaiknya memutuskan jenis sampah yang dicatat?', [['Pengelola. KA hanya mengusulkan, misalnya "Tebakan: botol plastik (yakin 80%). Benar?" dengan tombol Ya dan Ganti jenis', true], ['KA, karena 85% sudah cukup'], ['Nasabah, tanpa pemeriksaan'], ['Pengepul, dua minggu kemudian']], 1, phone('Catat setoran', [el('p', null, '📷 Tebakan: 🧴 botol plastik'), el('p', null, 'yakin 80%. Benar?'), el('div', { class: 'bs-hp-btn' }, '✓ Ya'), el('div', { class: 'bs-hp-btn' }, '🔁 Ganti jenis')]))) });
      else if (r === 7) buildRound(wrap, ctx, { done: next });
      else if (r === 8) {
        wrap.append(el('p', { class: 'prompt' }, 'Uji dengan skenario: jadilah Mbah Sumi pada rancangan awal kelompok lain.'));
        const host = el('div'); wrap.append(host, el('p', { class: 'reveal info' }, 'Ketuk tombol pada layar ponsel. Penguji tidak boleh membantu.'));
        draftRun(host, ctx, SCENARIOS[0], (taps) => { wrap.replaceChildren(); ask(`Selesai dalam ${taps} ketukan. Apa temuan pengujian ini?`, SCENARIOS[0].find, 1, null,
          then(() => ask('Mas Arif salah mencatat 2,5 kg; seharusnya 3,5 kg. Pada rancangan ini, apa yang bisa ia lakukan?', [['Tidak ada; rancangan tidak punya cara mengubah setoran. Perbaikan: tombol "Ubah setoran" yang mencatat perubahan dan alasannya', true], ['Mencatat setoran baru 1 kg kardus atas nama Pak Wiryo, tanpa catatan'], ['Menghapus aplikasi dan memasangnya lagi'], ['Membiarkannya; selisih 1 kg tidak penting']], 1, phone(DRAFT.tersimpan.title, [...DRAFT.tersimpan.body.map((b) => el('p', null, b)), el('div', { class: 'bs-hp-btn' }, 'Selesai')])))); });
      } else sortBoard(wrap, ctx, { prompt: 'Daftar kebutuhan sistem: fungsional atau nonfungsional?', cls: 'fn', bins: [['F', 'F · Fungsional: apa yang dapat dilakukan sistem'], ['N', 'N · Nonfungsional: seberapa baik sistem bekerja']],
        items: NEEDS.map(([n, t]) => ({ id: n, tag: n, label: t })),
        right: (it, b) => NEEDS[it.id - 1][2] === b || (b === 'F' ? 'Ini menyebut seberapa baik sistem bekerja.' : 'Ini menyebut sesuatu yang dapat dilakukan sistem.'),
        why: (it) => (NEEDS[it.id - 1][3] ? `Nonfungsional: ${NEEDS[it.id - 1][3]}.` : 'Fungsional: sesuatu yang dapat dilakukan sistem.'),
        done: then(() => ask('Tantangan: dalam presentasi dua menit untuk Karang Taruna, bagian mana yang wajib ada?', [['Masalah siapa yang diselesaikan, tiga layar prototipe, hasil uji dan perbaikannya, serta cara fitur KA tetap melibatkan pengelola', true], ['Daftar semua fitur canggih yang mungkin dibuat'], ['Harga ponsel terbaru'], ['Kode program aplikasinya']])) });
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
