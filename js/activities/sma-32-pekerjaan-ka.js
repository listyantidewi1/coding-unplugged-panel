// KA dan Pekerjaan Masa Depan — SMA/SMK (16–18 tahun), dampak KA pada pekerjaan.
// Break six jobs into tasks and mark each P (berpola), E (empati), T (tangan);
// the rule sorts tasks into high, medium or low chance of AI help. Then a changing
// job, survey data, AI professions, a developer charter, and a debate scoreboard.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const JOBS = [['K', 'Kasir', '🛒'], ['N', 'Penerjemah', '📖'], ['W', 'Perawat', '🩺'], ['F', 'Petani', '🌶'], ['D', 'Desainer grafis', '🎨'], ['M', 'Montir', '🔧']];
// [kode, tugas, P, E, T]
export const TASKS = [
  ['K1', 'Memindai barang dan menghitung total belanja', 1, 0, 0], ['K2', 'Menerima pembayaran nontunai dan mencetak struk', 1, 0, 0], ['K3', 'Mencatat stok barang yang hampir habis', 1, 0, 0], ['K4', 'Membantu pelanggan lansia yang bingung memakai mesin bayar', 0, 1, 0],
  ['N1', 'Menerjemahkan buku petunjuk pemakaian pompa air', 1, 0, 0], ['N2', 'Menerjemahkan puisi dan cerita rakyat dengan rasa bahasa yang tepat', 0, 0, 0], ['N3', 'Menjadi juru bahasa bagi pasien di rumah sakit', 0, 1, 0], ['N4', 'Memeriksa istilah yang konsisten dalam dokumen panjang', 1, 0, 0],
  ['W1', 'Mencatat hasil pengukuran tanda vital ke rekam medis', 1, 0, 0], ['W2', 'Memasang infus pada pasien', 0, 0, 1], ['W3', 'Menenangkan pasien yang cemas sebelum operasi', 0, 1, 0], ['W4', 'Menyusun jadwal pemberian obat untuk satu bangsal', 1, 0, 0],
  ['F1', 'Memantau kelembapan tanah dan perkiraan cuaca', 1, 0, 0], ['F2', 'Mengenali penyakit daun cabai dari foto', 1, 0, 0], ['F3', 'Memanen cabai yang matangnya tidak bersamaan di lahan miring', 0, 0, 1], ['F4', 'Bermusyawarah dengan kelompok tani tentang pembagian air irigasi', 0, 1, 0],
  ['D1', 'Mengubah satu desain menjadi sepuluh ukuran untuk media sosial', 1, 0, 0], ['D2', 'Membuat beberapa pilihan sketsa awal logo', 0, 0, 0], ['D3', 'Mewawancarai pemilik UMKM untuk memahami cerita usahanya', 0, 1, 0], ['D4', 'Menghapus latar belakang foto produk', 1, 0, 0],
  ['M1', 'Membaca kode kerusakan dari alat diagnosis', 1, 0, 0], ['M2', 'Membongkar dan memasang mesin motor yang berkarat', 0, 0, 1], ['M3', 'Menjelaskan kerusakan dan biayanya kepada pelanggan dengan jujur', 0, 1, 0], ['M4', 'Mencatat riwayat servis dan mengingatkan jadwal ganti oli', 1, 0, 0],
];
export const chance = (p, e, t) => (e || t ? 'Rendah' : p ? 'Tinggi' : 'Sedang');
export const suggested = (task) => chance(task[2], task[3], task[4]);
export const reason = (task) => (task[3] ? 'Perlu empati dan kepercayaan secara langsung.' : task[4] ? 'Perlu keterampilan tangan di tempat yang berbeda-beda.' : task[2] ? 'Berulang dan berpola; banyak contoh data.' : 'Tidak berpola: perlu kreativitas dan rasa.');

export const JOKO = [['a', 'Memindai barang', 'ambil'], ['b', 'Menerima pembayaran', 'ambil'], ['c', 'Mencatat stok', 'ambil'], ['d', 'Membantu pelanggan dan menangani keluhan', 'tetap'], ['e', 'Menjaga kerapian area kasir', 'tetap'], ['f', 'Membantu pelanggan memakai mesin bayar mandiri', 'baru'], ['g', 'Mengawasi dan melaporkan gangguan mesin', 'baru'], ['h', 'Memeriksa kewajaran laporan stok buatan KA', 'baru']];
const JOKO_OPTS = [['ambil', 'Diambil alih mesin'], ['tetap', 'Tetap'], ['baru', 'Tugas baru']];

export const DATA = [['Kasir', 120, 90], ['Penerjemah dokumen', 15, 10], ['Petugas input data', 60, 35], ['Operator dan pengawas sistem KA', 4, 20], ['Teknisi perawatan mesin dan sensor', 18, 30], ['Pendamping digital UMKM', 6, 21]];
export const pct = (a, b) => Math.round(((b - a) / a) * 1000) / 10;
export const fmtPct = (x) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const PROFS = [['1', 'Ilmuwan data', 'R'], ['2', 'Insinyur pembelajaran mesin', 'T'], ['3', 'Pelabel data', 'P'], ['4', 'Auditor etika KA', 'Q'], ['5', 'Perancang interaksi KA', 'U'], ['6', 'Insinyur robotika', 'S']];
export const DUTIES = { P: 'Memberi label pada contoh data, misalnya menandai foto daun yang sakit, untuk melatih model', Q: 'Memeriksa apakah sistem KA adil, aman, dan sesuai aturan', R: 'Menganalisis data untuk menemukan pola dan membantu pengambilan keputusan', S: 'Merancang robot yang bergerak dan bekerja di dunia nyata', T: 'Membangun dan melatih model KA, lalu memasangnya di aplikasi', U: 'Merancang cara orang memakai KA supaya mudah dipahami dan hasilnya bisa dikoreksi' };

export const PRINCIPLES = [['sejahtera', 'kesejahteraan pengguna'], ['transparan', 'transparansi dan tanggung jawab manusia'], ['adil', 'keadilan'], ['privasi', 'privasi'], ['terjangkau', 'terjangkau oleh semua orang']];
export const FEEDBACK = [['1', '"Jadwal saya berubah mendadak lewat aplikasi pada malam hari, padahal saya harus mengatur antar-jemput anak."', 'sejahtera', 'Kami memastikan jadwal diumumkan paling lambat tiga hari sebelumnya, dan perubahan mendadak harus disetujui pegawai.'], ['2', '"Saya tidak tahu mengapa jam kerja saya dikurangi. Kepala toko menjawab, \'Itu keputusan sistem.\'"', 'transparan', 'Kami menampilkan alasan setiap perubahan jam kerja, dan keputusan akhir diambil kepala toko yang bisa dimintai penjelasan.'], ['3', '"Aplikasi menilai saya lambat karena saya sering membantu pelanggan lansia."', 'adil', 'Kami menyusun ukuran kinerja bersama pegawai supaya membantu pelanggan tidak dinilai lambat.'], ['4', '"Aplikasi meminta akses lokasi ponsel saya selama 24 jam."', 'privasi', 'Kami hanya meminta data yang diperlukan untuk jadwal dan tidak melacak lokasi pegawai.'], ['5', '"Pegawai yang tidak punya ponsel pintar tidak bisa melihat jadwalnya."', 'terjangkau', 'Kami menyediakan jadwal tercetak atau pesan singkat bagi pegawai tanpa ponsel pintar.']];
export const DEBATE = [['jelas', 'Klaimnya jelas', 1], ['data', 'Didukung data Misi 3', 1], ['contoh', 'Memakai contoh tugas Misi 1 atau 2', 1], ['tanggap', 'Menanggapi argumen tim lawan', 1], ['pribadi', 'Menyerang pribadi, bukan argumen', -1]];

// ---------- Bursa Kerja 2035: the ten missions ----------
export const PCT_DECOYS = ['+80,0%', '−71,4%', '+71,4%'];
export const PROMISE = [['1', '📅 Jadwal diumumkan 3 hari sebelumnya; perubahan mendadak perlu persetujuan pegawai'], ['2', '🧑‍⚖️ Alasan setiap perubahan ditampilkan; keputusan akhir di tangan kepala toko'], ['3', '⚖️ Ukuran kinerja disusun bersama pegawai'], ['4', '🔒 Hanya data yang perlu untuk jadwal; lokasi tidak dilacak'], ['5', '📄 Jadwal tercetak atau SMS bagi pegawai tanpa ponsel pintar'], ['x', '⚡ Aplikasi dibuat lebih cepat']];
export const TEACHER = [['g1', 'Memeriksa jawaban pilihan ganda ulangan harian', 'Tinggi', 'Berpola: kunci jawabannya jelas.'], ['g2', 'Merekap nilai dan kehadiran ke rapor', 'Tinggi', 'Berpola: angka dipindahkan dan dijumlahkan.'], ['g3', 'Menenangkan murid yang bertengkar di kelas', 'Rendah', 'Perlu empati dan kehadiran langsung.'], ['g4', 'Mendampingi praktik di bengkel sekolah', 'Rendah', 'Perlu tangan dan mata di tempat.'], ['g5', 'Merancang cerita pembuka pelajaran yang menarik', 'Sedang', 'Tidak berpola: KA bisa memberi draf, guru menimbang.']];
export const CHANCES = [['Tinggi', '🌊 Tinggi'], ['Sedang', '〰️ Sedang'], ['Rendah', '🏝 Rendah']];
export const SWING = [['kasir', 'Kasir', -30], ['terjemah', 'Penerjemah dokumen', -5], ['input', 'Petugas input data', -25], ['operator', 'Operator sistem KA', 16], ['teknisi', 'Teknisi mesin dan sensor', 12], ['pendamping', 'Pendamping digital UMKM', 15]];
export const NET = ['−17 (−7,6%)', '+17 (+7,6%)', '−103 (−46,2%)'];
// [kode, tim, kutipan, kriteria yang dipenuhi]
export const ARGS = [
  ['a1', 'Pro', '"Data Misi 3: operator sistem KA naik 400% dan pendamping digital UMKM naik 250%. Di toko Pak Joko juga muncul tugas baru: melaporkan gangguan mesin."', ['jelas', 'data', 'contoh']],
  ['a2', 'Kontra', '"Tim Pro anak kota, tahu apa soal pekerjaan di desa!"', ['pribadi']],
  ['a3', 'Kontra', '"Tim Pro menyebut +400%, padahal itu dari 4 menjadi 20 orang. Data yang sama: 60 pekerjaan hilang, hanya 43 yang baru."', ['jelas', 'data', 'tanggap']],
  ['a4', 'Pro', '"Kasir tidak hilang: Pak Joko tetap membantu pelanggan lansia (K4). Tim Kontra lupa bahwa tugas berubah, bukan hilang. Mereka memang selalu pesimis."', ['jelas', 'contoh', 'tanggap', 'pribadi']],
];
const HEAD32 = {
  gel1: ['Tebak Gelombang KA I', 'Tandai P, E, T pada tugas kasir, penerjemah, dan perawat, lalu lepaskan gelombang.'],
  gel2: ['Tebak Gelombang KA II', 'Tandai P, E, T pada tugas petani, desainer, dan montir, lalu lepaskan gelombang.'],
  joko: ['Kartu Kerja Baru Pak Joko', 'Seret setiap tugas: diambil mesin, tetap, atau tugas baru.'],
  papan: ['Papan Bursa Kerja', 'Seret persentase perubahan yang tepat ke setiap pekerjaan.'],
  neraca: ['Neraca Pekerjaan', 'Seret setiap perubahan ke piring Hilang atau Baru, lalu baca neracanya.'],
  profesi: ['Bursa Profesi KA', 'Seret setiap profesi ke tugasnya.'],
  prinsip: ['Sidang Atur Shift', 'Seret prinsip yang dilanggar ke setiap masukan pegawai.'],
  janji: ['Piagam Pengembang', 'Seret janji yang menjawab setiap masukan pegawai.'],
  pers: ['Konferensi Pers', 'Wartawan bertanya tentang tugas guru: seret setiap tugas ke peluangnya.'],
  bos: ['Debat Besar', 'Jadilah juri: ketuk kriteria yang dipenuhi setiap argumen, lalu ketok palu.'],
};
const msg32 = (t) => el('p', { class: 'reveal info' }, t);
const MARK_NAME = { P: 'berpola', E: 'perlu empati', T: 'perlu tangan' };

// Misi 1: mark P, E, T on twelve task cards, then release the AI wave.
function waveRound(area, ctx, { jobs, done }) {
  const tasks = TASKS.filter((t) => jobs.includes(t[0][0])); const marks = Object.fromEntries(tasks.map((t) => [t[0], [0, 0, 0]])); let over = false;
  const msg = msg32('P berpola · E perlu empati · T perlu keterampilan tangan. Tinggi bila hanya P, Rendah bila ada E atau T, Sedang bila tidak ada tanda.');
  const cards = {};
  const card = (t) => (cards[t[0]] = el('div', { class: 'kj32-tugas' }, el('div', { class: 'kj32-tugas-teks' }, el('b', null, t[0]), el('span', null, t[1])), el('div', { class: 'kj32-tanda' }, ['P', 'E', 'T'].map((L, i) => onTap(el('button', { class: 'kj32-cek', type: 'button', 'data-t': `${t[0]}${L}`, title: MARK_NAME[L] }, L), (e) => {
    if (over) return; const m = marks[t[0]]; m[i] = m[i] ? 0 : 1; e.currentTarget.classList.toggle('on', !!m[i]); ctx.sound.tap();
  }))), el('span', { class: 'kj32-label' })));
  const boards = el('div', { class: `kj32-papan-papan ${jobs.length > 3 ? 'enam' : ''}` }, jobs.map((jk) => { const [, name, ic] = JOBS.find((j) => j[0] === jk); return el('div', { class: 'kj32-papan' }, el('b', { class: 'kj32-judul' }, `${ic} ${name}`), tasks.filter((t) => t[0][0] === jk).map(card)); }));
  const go = button('🌊 Lepaskan Gelombang KA', () => {
    if (over) return; over = true; go.disabled = true; ctx.sound.good();
    let match = 0;
    for (const t of tasks) {
      const mine = chance(...marks[t[0]]); const sug = suggested(t); const c = cards[t[0]];
      c.classList.add(`p-${mine.toLowerCase()}`); if (mine === sug) match++; else c.classList.add('beda');
      c.querySelector('.kj32-label').textContent = mine === sug ? mine : `${mine} · saran ${sug}`;
    }
    setTimeout(() => { for (const t of tasks) if (chance(...marks[t[0]]) === 'Tinggi') cards[t[0]].classList.add('sapu'); }, 700);
    say(msg, '', `Kecocokan ${match}/${tasks.length} dengan penilaian yang disarankan.${match < tasks.length ? ' Kartu bergaris berbeda: diskusikan alasanmu.' : ''} Kartu Tinggi disapu gelombang: dibantu atau diambil alih KA, bukan berarti pekerjanya diberhentikan.`);
    done();
  }, 'primary');
  area.append(boards, go, msg);
}

// A drag board: cards into keyed bins (columns or rows).
function sortBoard(area, ctx, { oops, msg, items, need, bins, check, place, after, done, tray = 'kj32-baki', board = 'kj32-papan-bin' }) {
  let left = need ?? items.length;
  const trayEl = el('div', { class: tray }, ctx.rand.shuffle(items.slice()).map((it) => el('div', { class: 'kj32-kartu', 'data-drag': it[0] }, it[1])));
  const host = el('div', { class: board }, bins, trayEl);
  dnd(host, (card, bin) => {
    if (!left || bin.classList.contains('isi')) return;
    const it = items.find((x) => x[0] === card.dataset.drag); const why = check(it, bin.dataset.drop);
    if (why) { oops(); shake(card); say(msg, 'bad', why); return; }
    card.classList.add('locked'); (place ? place(card, bin) : bin.querySelector('.kj32-isi').append(card)); ctx.sound.tap(); left--;
    after?.(it, left); if (!left) done();
  });
  area.append(host, msg);
}
const colBin = (k, label, cls = '') => el('div', { class: `kj32-kolom ${cls}`, 'data-drop': k }, el('b', null, label), el('div', { class: 'kj32-isi' }));
const rowBin = (k, text, cls = '') => el('div', { class: `kj32-baris ${cls}`, 'data-drop': k }, el('span', { class: 'kj32-slot' }, '?'), el('span', null, text));
const toSlot = (card, bin) => { bin.querySelector('.kj32-slot').replaceWith(card); bin.classList.add('isi'); };

function jokoRound(area, ctx, { oops, done }) {
  const msg = msg32('Toko Pak Joko memasang mesin bayar mandiri dan KA pencatat stok. Tugas berpola diambil mesin, tugas yang perlu manusia tetap, dan mesin memunculkan tugas baru.');
  sortBoard(area, ctx, { oops, msg, items: JOKO, bins: el('div', { class: 'kj32-kolom-kolom' }, [['ambil', '🤖 Diambil mesin', 'ambil'], ['tetap', '🧑 Tetap', 'tetap'], ['baru', '✨ Tugas baru', 'baru']].map(([k, l, c]) => colBin(k, l, c))),
    check: (it, k) => (it[2] !== k ? 'Apakah tugas ini berpola, tetap perlu manusia, atau baru muncul karena ada mesin?' : ''),
    after: (it) => say(msg, '', ({ ambil: 'Berpola: dikerjakan mesin.', tetap: 'Tetap perlu manusia.', baru: 'Muncul karena ada mesin dan KA.' })[it[2]]),
    done: () => { say(msg, '', 'Pekerjaan Pak Joko tidak hilang, isinya berubah: ia perlu belajar merawat sistem digital dan membaca laporan data.'); done(); } });
}

function pctRound(area, ctx, { oops, done }) {
  const msg = msg32('Perubahan (%) = (2026 − 2024) ÷ 2024 × 100%. Bagi dengan angka 2024.');
  const mx = Math.max(...DATA.flatMap((d) => [d[1], d[2]])); let left = DATA.length;
  const rows = el('div', { class: 'kj32-grafik' }, el('div', { class: 'kj32-legenda' }, el('span', { class: 'th24' }, '2024'), el('span', { class: 'th26' }, '2026')), DATA.map(([n, a, b], i) => el('div', { class: 'kj32-gbaris' }, el('span', null, n),
    el('div', { class: 'kj32-batang-batang' }, el('div', { class: 'kj32-batang th24' }, el('i', { style: { width: `${(a / mx) * 100}%` } }), el('b', null, String(a))), el('div', { class: 'kj32-batang th26' }, el('i', { style: { width: `${(b / mx) * 100}%` } }), el('b', null, String(b)))),
    el('span', { class: 'kj32-celah', 'data-drop': String(i) }, '?'))));
  const chips = ctx.rand.shuffle([...DATA.map(([, a, b]) => fmtPct(pct(a, b))), ...PCT_DECOYS]);
  const tray = el('div', { class: 'kj32-angka-angka' }, chips.map((c) => el('div', { class: 'kj32-angka', 'data-drag': c }, c)));
  const host = el('div', { class: 'kj32-dua' }, rows, tray);
  dnd(host, (chip, blank) => {
    if (!left || blank.classList.contains('isi')) return;
    const [n, a, b] = DATA[+blank.dataset.drop]; const want = fmtPct(pct(a, b));
    if (chip.dataset.drag !== want) { oops(); shake(chip); say(msg, 'bad', `${n}: (${b} − ${a}) ÷ ${a} × 100%.`); return; }
    blank.textContent = want; blank.classList.add('isi', b < a ? 'turun' : 'naik'); chip.remove(); ctx.sound.tap();
    if (--left) { say(msg, '', `${n}: ${b - a > 0 ? '+' : '−'}${Math.abs(b - a)} orang, ${want}.`); return; }
    say(msg, '', 'Persen besar belum tentu orang banyak: +400% itu dari 4 menjadi 20 orang, sedangkan kasir −25% berarti 30 orang.'); done();
  });
  area.append(host, msg);
}

function balanceRound(area, ctx, { oops, done }) {
  const msg = msg32('Seret setiap perubahan jumlah pekerja ke piring yang tepat.'); let left = SWING.length; const sum = { hilang: 0, baru: 0 };
  const beam = el('div', { class: 'kj32-tuas' });
  const pans = [['hilang', '📉 Hilang'], ['baru', '📈 Baru']].map(([k, l]) => el('div', { class: `kj32-piring ${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'kj32-isi' }), el('strong', null, '0')));
  const tilt = () => { scale.style.setProperty('--m', Math.max(-10, Math.min(10, (sum.baru - sum.hilang) / 3))); pans.forEach((p) => { p.querySelector('strong').textContent = String(sum[p.dataset.drop]); }); };
  const scale = el('div', { class: 'kj32-neraca' }, beam, el('div', { class: 'kj32-piring-piring' }, pans));
  const tray = el('div', { class: 'kj32-angka-angka' }, ctx.rand.shuffle(SWING.slice()).map(([k, n, d]) => el('div', { class: 'kj32-angka lebar', 'data-drag': k }, el('small', null, n), el('b', null, `${d > 0 ? '+' : '−'}${Math.abs(d)}`))));
  const host = el('div', { class: 'kj32-papan-bin' }, scale, tray);
  let stage = 1;
  dnd(host, (chip, pan) => {
    if (stage === 2) {
      if (!pan.classList.contains('kj32-hasil')) return;
      if (chip.dataset.drag !== NET[0]) { oops(); shake(chip); say(msg, 'bad', 'Baru dikurangi hilang: 43 − 60. Persennya dibagi jumlah pekerja 2024 (223).'); return; }
      stage = 3; pan.textContent = NET[0]; pan.classList.add('isi'); chip.remove(); ctx.sound.tap();
      say(msg, '', 'Jumlah pekerja 223 → 206: berkurang 17 (−7,6%). Tetapi 60 orang kehilangan pekerjaan lama dan 43 pekerjaan baru butuh keterampilan lain.'); done(); return;
    }
    if (stage !== 1 || !pan.classList.contains('kj32-piring')) return;
    const s = SWING.find((x) => x[0] === chip.dataset.drag); const want = s[2] < 0 ? 'hilang' : 'baru';
    if (pan.dataset.drop !== want) { oops(); shake(chip); say(msg, 'bad', `${s[1]}: ${s[2] < 0 ? 'berkurang' : 'bertambah'}.`); return; }
    chip.classList.add('locked'); pan.querySelector('.kj32-isi').append(chip); sum[want] += Math.abs(s[2]); tilt(); ctx.sound.tap();
    if (--left) return;
    stage = 2; say(msg, 'info', 'Hilang 60, baru 43. Seret perubahan totalnya ke papan hasil.');
    const res = el('div', { class: 'kj32-hasil', 'data-drop': 'net' }, '? total');
    scale.append(res); fill(tray, ctx.rand.shuffle(NET.slice()).map((t) => el('div', { class: 'kj32-angka', 'data-drag': t }, t)));
  });
  tilt();
  area.append(host, msg);
}

function profRound(area, ctx, { oops, done }) {
  const msg = msg32('Siapa yang membangun model, memberi label, memeriksa keadilan, atau merancang robot?');
  const want = Object.fromEntries(PROFS.map(([k, , a]) => [a, k]));
  sortBoard(area, ctx, { oops, msg, items: PROFS.map(([k, n]) => [k, n]), bins: el('div', { class: 'kj32-baris-baris' }, ctx.rand.shuffle(Object.keys(DUTIES)).map((L) => rowBin(L, DUTIES[L]))),
    check: (it, L) => (want[L] !== it[0] ? `${it[1]} tidak terutama bertugas seperti ini.` : ''), place: toSlot,
    after: (it) => say(msg, '', `${it[1]}: tepat.`), done: () => { say(msg, '', 'Enam profesi baru di sekitar KA, dari pelabel data sampai auditor etika.'); done(); } });
}

function principleRound(area, ctx, { oops, done }) {
  const msg = msg32('Aplikasi "Atur Shift" menyusun jadwal pegawai toko. Lima pegawai mengirim masukan.');
  sortBoard(area, ctx, { oops, msg, items: PRINCIPLES, tray: 'kj32-baki baris', bins: el('div', { class: 'kj32-baris-baris' }, FEEDBACK.map(([k, t]) => rowBin(k, t, 'kutip'))),
    check: (it, k) => (FEEDBACK.find((f) => f[0] === k)[2] !== it[0] ? 'Masukan ini merugikan pegawai dalam hal apa?' : ''), place: toSlot,
    after: (it) => say(msg, '', `Prinsip ${it[1]}.`), done: () => { say(msg, '', 'Lima prinsip pengembang yang bertanggung jawab: kesejahteraan, transparansi, keadilan, privasi, dan keterjangkauan.'); done(); } });
}

function promiseRound(area, ctx, { oops, done }) {
  const msg = msg32('Setiap masukan dijawab satu janji. Satu kartu janji adalah pengecoh.');
  const pn = Object.fromEntries(PRINCIPLES);
  sortBoard(area, ctx, { oops, msg, items: PROMISE, need: 5, tray: 'kj32-baki baris', bins: el('div', { class: 'kj32-baris-baris' }, FEEDBACK.map(([k, t, p]) => rowBin(k, `${t} · ${pn[p]}`, 'kutip'))),
    check: (it, k) => (it[0] === 'x' ? 'Lebih cepat tidak menjawab keluhan pegawai mana pun.' : it[0] !== k ? 'Janji ini menjawab masukan lain.' : ''), place: toSlot,
    after: () => say(msg, '', 'Masuk piagam.'), done: () => { area.querySelector('.pengecoh')?.remove(); say(msg, '', 'Piagam selesai. "Itu keputusan sistem" tidak boleh lagi menjadi jawaban: selalu ada manusia yang bertanggung jawab.'); done(); } });
  area.querySelector('[data-drag="x"]')?.classList.add('pengecoh');
}

function pressRound(area, ctx, { oops, done }) {
  const msg = msg32('Wartawan: "Apakah KA akan menggantikan guru?" Jawab dengan memilah tugas guru.');
  sortBoard(area, ctx, { oops, msg, items: TEACHER, bins: el('div', { class: 'kj32-kolom-kolom' }, CHANCES.map(([k, l]) => colBin(k, l, k.toLowerCase()))),
    check: (it, k) => (it[2] !== k ? 'Berpola saja? Perlu empati atau tangan? Atau tidak berpola?' : ''), after: (it) => say(msg, '', it[3]),
    done: () => { say(msg, '', 'Juru Bicara: "KA bisa membantu memeriksa dan merekap, tetapi menenangkan murid, mendampingi praktik, dan menimbang ide tetap tugas guru."'); done(); } });
}

function debateBoss(area, ctx, { oops, done }) {
  const msg = msg32('Mosi: "KA akan lebih banyak menciptakan pekerjaan daripada menghilangkannya di Wanasari dalam sepuluh tahun." Nilai setiap argumen.');
  const score = { Pro: 0, Kontra: 0 }; let i = 0; let sel = new Set();
  const board = el('div', { class: 'kj32-skor' });
  const drawScore = () => fill(board, ['Pro', 'Kontra'].map((t) => el('div', { class: `kj32-tim t-${t}` }, el('span', null, `Tim ${t}`), el('b', null, String(score[t])))));
  const stage = el('div', { class: 'kj32-debat' });
  function show() {
    const [k, team, quote] = ARGS[i]; sel = new Set();
    const crit = el('div', { class: 'kj32-kriteria' }, DEBATE.map(([c, l, p]) => onTap(el('button', { class: `kj32-poin ${p < 0 ? 'minus' : ''}`, type: 'button', 'data-c': c }, el('b', null, p > 0 ? `+${p}` : `−${-p}`), l), (e) => {
      if (sel.has(c)) sel.delete(c); else sel.add(c); e.currentTarget.classList.toggle('on', sel.has(c)); ctx.sound.tap();
    })));
    fill(stage, el('div', { class: `kj32-kutip t-${team}`, 'data-k': k }, el('b', null, `🎤 Tim ${team}`), el('span', null, quote)), crit, button('🔨 Ketok palu', judge, 'primary'));
  }
  function judge() {
    if (stage.classList.contains('sibuk') || i >= ARGS.length) return;
    const want = ARGS[i][3];
    if (want.length !== sel.size || want.some((c) => !sel.has(c))) { oops(); shake(stage); say(msg, 'bad', 'Belum tepat. Periksa lagi: ada data angka? contoh tugas? menanggapi lawan? menyerang pribadi?'); return; }
    const pts = want.reduce((a, c) => a + DEBATE.find((d) => d[0] === c)[2], 0); score[ARGS[i][1]] += pts; drawScore(); ctx.sound.good();
    say(msg, '', `${pts >= 0 ? '+' : '−'}${Math.abs(pts)} poin untuk Tim ${ARGS[i][1]}.`);
    i++;
    if (i < ARGS.length) { stage.classList.add('sibuk'); setTimeout(() => { stage.classList.remove('sibuk'); show(); }, 1600); return; }
    fill(stage); say(msg, '', `Tim Pro ${score.Pro}, Tim Kontra ${score.Kontra}. Skor menilai mutu argumen, bukan benar-salahnya mosi: data, contoh, dan tanggapan menang; serangan pribadi kalah.`); done();
  }
  drawScore(); show();
  area.append(board, stage, msg);
}

export default {
  id: 'sma-32-pekerjaan-ka',
  title: 'KA dan Pekerjaan Masa Depan',
  topic: 'Dampak KA pada pekerjaan, tugas yang berubah, data perubahan pekerjaan, profesi KA, dan tanggung jawab pengembang',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧑‍🔧',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Bursa Kerja 2035: jadilah biro konsultan karier. Tebak tugas yang disapu Gelombang KA, ubah kartu kerja Pak Joko, baca papan bursa kerja, kenali profesi KA, susun piagam pengembang, dan jadilah juri debat.',
  extraModes: [
    { id: 'pilah', icon: '🗃', label: 'Pilah 24 Tugas', desc: 'Tandai P, E, dan T untuk 24 tugas dari enam pekerjaan, lalu pilah ke Tinggi, Sedang, dan Rendah; perbedaan dengan penilaian yang disarankan ditandai untuk didiskusikan', create: createSort },
    { id: 'debat', icon: '🎤', label: 'Papan Skor Debat', desc: 'Debat tim pro dan kontra: moderator mengetuk poin setiap argumen, dan pengatur waktu membatasi giliran bicara satu menit', create: createDebate },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kj32-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'kj32-area' });
      const go = (k, no) => wrap.append(misiHead(no, ...HEAD32[k], '🧑‍🔧'), area);
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => next(ms) });
      if (r === 0) { go('gel1', 1); waveRound(area, ctx, { jobs: ['K', 'N', 'W'], ...fin(7500) }); }
      else if (r === 1) { go('gel2', 1); waveRound(area, ctx, { jobs: ['F', 'D', 'M'], ...fin(7500) }); }
      else if (r === 2) { go('joko', 2); jokoRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('papan', 3); pctRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('neraca', 3); balanceRound(area, ctx, fin(6500)); }
      else if (r === 5) { go('profesi', 4); profRound(area, ctx, fin(5500)); }
      else if (r === 6) { go('prinsip', 5); principleRound(area, ctx, fin(5500)); }
      else if (r === 7) { go('janji', 5); promiseRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('pers', 6); pressRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); debateBoss(area, ctx, fin(7500)); }
    }
    render();
  },
};

function createSort(root, ctx) {
  const wrap = el('div', { class: 'act kj32-main' });
  root.append(wrap);
  const start = () => {
    const area = el('div', { class: 'kj32-area' });
    wrap.replaceChildren(el('div', { class: 'misi-kepala' }, el('b', { class: 'misi-judul' }, '🗃 Pilah 24 Tugas')), area);
    waveRound(area, ctx, { jobs: JOBS.map((j) => j[0]), done: () => area.append(button('↺ Ulangi', start)) });
  };
  start();
}

function createDebate(root, ctx) {
  const wrap = el('div', { class: 'act pekerjaan-ka' });
  root.append(wrap);
  const pts = [0, 0]; const log = []; let turn = 0; let left = 60; let timer = null;
  const NAMES = ['Tim Pro', 'Tim Kontra'];
  const clock = el('b', { class: 'kj-jam' });
  const tickDraw = () => { clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; clock.classList.toggle('habis', left <= 0); clock.classList.toggle('jalan', !!timer); };
  const stop = () => { clearInterval(timer); timer = null; tickDraw(); };
  const run = () => { if (timer) { stop(); return; } if (left <= 0) left = 60; timer = setInterval(() => { if (!wrap.isConnected) { stop(); return; } left--; if (left <= 0) { left = 0; stop(); ctx.sound.bad(); } tickDraw(); }, 1000); tickDraw(); };
  function draw() {
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Mosi: "Dalam sepuluh tahun ke depan, KA akan lebih banyak menciptakan pekerjaan daripada menghilangkannya di Kabupaten Wanasari."'),
      el('div', { class: 'kj-skor' }, NAMES.map((n, i) => onTap(el('button', { class: `kj-tim ${i === turn ? 'giliran' : ''} t${i}`, type: 'button' }, el('span', null, n), el('b', null, String(pts[i]))), () => { turn = i; left = 60; stop(); draw(); }))),
      el('div', { class: 'kj-jam-baris' }, clock, button(timer ? '⏸ Jeda' : '▶ Mulai bicara 1 menit', () => { run(); draw(); }, 'primary'), button('↻ Ganti giliran', () => { turn = 1 - turn; left = 60; stop(); draw(); })),
      el('div', { class: 'kj-kriteria' }, DEBATE.map(([k, l, p]) => onTap(el('button', { class: `kj-poin ${p < 0 ? 'minus' : ''}`, type: 'button' }, el('b', null, p > 0 ? `+${p}` : `−${-p}`), l), () => { pts[turn] += p; log.unshift(`${NAMES[turn]}: ${l} (${p > 0 ? '+' : '−'}${Math.abs(p)})`); ctx.sound[p > 0 ? 'good' : 'bad'](); draw(); }))),
      el('div', { class: 'kj-log' }, log.length ? log.slice(0, 6).map((l) => el('div', null, l)) : el('small', null, 'Ketuk poin untuk setiap argumen tim yang sedang bicara.')),
      el('div', { class: 'kode-baris' }, button('↺ Debat baru', () => { pts[0] = pts[1] = 0; log.length = 0; turn = 0; left = 60; stop(); draw(); })));
    tickDraw();
  }
  draw();
}
