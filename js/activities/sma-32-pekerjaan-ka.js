// KA dan Pekerjaan Masa Depan — SMA/SMK (16–18 tahun), dampak KA pada pekerjaan.
// Break six jobs into tasks and mark each P (berpola), E (empati), T (tangan);
// the rule sorts tasks into high, medium or low chance of AI help. Then a changing
// job, survey data, AI professions, a developer charter, and a debate scoreboard.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say } from './sma-kit.js';

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
export const DEBATE = [['jelas', 'Klaimnya jelas', 1], ['data', 'Didukung data dari soal 3', 1], ['contoh', 'Memakai contoh tugas dari soal 1 atau 2', 1], ['tanggap', 'Menanggapi argumen tim lawan', 1], ['pribadi', 'Menyerang pribadi, bukan argumen', -1]];

// --- view pieces ---
function sorter(ctx, { tasks, onDone }) {
  const marks = Object.fromEntries(tasks.map((t) => [t[0], [0, 0, 0]])); let sorted = false;
  const host = el('div', { class: 'kj-pilah' });
  const draw = () => host.replaceChildren(...JOBS.filter((j) => tasks.some((t) => t[0][0] === j[0])).map(([jk, jn, ic]) => el('div', { class: 'kj-kerja' }, el('b', { class: 'kj-judul' }, `${ic} ${jn}`), tasks.filter((t) => t[0][0] === jk).map((t) => {
    const m = marks[t[0]]; const mine = chance(...m); const sug = suggested(t);
    return el('div', { class: `kj-tugas ${sorted ? `p-${mine.toLowerCase()}` : ''} ${sorted && mine !== sug ? 'beda' : ''}` }, el('span', { class: 'kj-kode' }, t[0]), el('span', { class: 'kj-teks' }, t[1]),
      el('div', { class: 'kj-tanda' }, ['P', 'E', 'T'].map((L, i) => onTap(el('button', { class: `kj-cek ${m[i] ? 'on' : ''}`, type: 'button', 'data-t': `${t[0]}${L}` }, `${m[i] ? '✓' : ''}${L}`), () => { if (sorted) return; m[i] = m[i] ? 0 : 1; ctx.sound.tap(); draw(); }))),
      sorted ? el('div', { class: 'kj-hasil' }, el('b', null, mine), mine !== sug ? el('small', null, `Disarankan: ${sug}. ${reason(t)} Diskusikan!`) : el('small', null, reason(t))) : null);
  }))));
  const msg = el('p', { class: 'reveal info' }, 'Tandai P (berpola), E (empati), dan T (tangan), lalu pilah. Rendah bila E atau T; Tinggi bila hanya P; Sedang bila tidak ada.');
  const go = button('Pilah ke Tinggi, Sedang, Rendah', () => {
    if (sorted) return; sorted = true; go.disabled = true; draw(); ctx.sound.good();
    const diff = tasks.filter((t) => chance(...marks[t[0]]) !== suggested(t)).length;
    const n = (c) => tasks.filter((t) => chance(...marks[t[0]]) === c).length;
    say(msg, diff ? 'bad' : '', `Pilahanmu: ${n('Tinggi')} tinggi, ${n('Sedang')} sedang, ${n('Rendah')} rendah. ${diff ? `${diff} tugas berbeda dari penilaian yang disarankan (bergaris): diskusikan alasannya.` : 'Sama dengan penilaian yang disarankan.'}`);
    onDone?.(diff);
  }, 'primary');
  draw();
  return el('div', { class: 'kj-wadah' }, host, go, msg);
}

function pickRows(wrap, ctx, { prompt, rows, opts, why, done, info, cls = '' }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `kj-baris-baris ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, a, w]) => el('div', { class: `kj-baris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, opts.find((o) => o[0] === a)[1]) : el('div', { class: 'seg' }, opts.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', why ? why(k, a, false) : 'Belum tepat.'); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', w || (why ? why(k, a, true) : 'Tepat.')); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1500);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function dataChart(show = {}) {
  const mx = Math.max(...DATA.flatMap((d) => [d[1], d[2]]));
  return el('div', { class: 'kj-grafik' }, el('div', { class: 'kj-legenda' }, el('span', { class: 'th24' }, '2024'), el('span', { class: 'th26' }, '2026')), DATA.map(([n, a, b], i) => el('div', { class: 'kj-gbaris' }, el('span', null, n),
    el('div', { class: 'kj-batang-batang' }, el('div', { class: 'kj-batang th24' }, el('i', { style: { width: `${(a / mx) * 100}%` } }), el('b', null, String(a))), el('div', { class: 'kj-batang th26' }, el('i', { style: { width: `${(b / mx) * 100}%` } }), el('b', null, String(b)))),
    el('b', { class: `kj-ubah ${b < a ? 'turun' : 'naik'}` }, show[i] ? `${b - a > 0 ? '+' : '−'}${Math.abs(b - a)} (${fmtPct(pct(a, b))})` : '?'))));
}

function dataRound(wrap, ctx, { done }) {
  const show = {};
  const msg = el('p', { class: 'reveal info' }, 'Perubahan (%) = (2026 − 2024) : 2024 × 100%.');
  const chartBox = el('div');
  const area = el('div', { class: 'kj-baris-baris' });
  const draw = () => {
    chartBox.replaceChildren(dataChart(show));
    area.replaceChildren(...DATA.map(([n, a, b], i) => {
      const right = pct(a, b); const opts = [...new Set([right, pct(b, a), Math.round(((b - a) / b) * 1000) / 10, b - a])].sort((x, y) => x - y);
      return el('div', { class: `kj-baris ${i in show ? 'beres' : ''}` }, el('span', null, `${n}: ${a} → ${b}`), i in show ? el('b', null, fmtPct(right)) : el('div', { class: 'seg' }, opts.map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, fmtPct(v)), () => {
        if (v !== right) { ctx.mistake(); say(msg, 'bad', `${n}: bagi perubahannya (${b - a}) dengan angka 2024 (${a}), bukan 2026.`); return; }
        show[i] = true; ctx.sound.tap(); draw();
        if (Object.keys(show).length === DATA.length) { say(msg, '', 'Jumlah 223 → 206: berkurang 17 (−7,6%).'); setTimeout(done, 1500); }
      }))));
    }));
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Membaca data: hitung perubahan dalam persen'), el('div', { class: 'kj-dua' }, chartBox, area), msg);
}

function matchRound(wrap, ctx, { done }) {
  const got = {}; let sel = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk profesi, lalu ketuk tugasnya.');
  const host = el('div', { class: 'kj-pasang' });
  const letters = ctx.rand.shuffle(Object.keys(DUTIES));
  const draw = () => host.replaceChildren(el('div', { class: 'kj-kol' }, PROFS.map(([k, n, a]) => onTap(el('button', { class: `kj-item ${sel === k ? 'pilih' : ''} ${k in got ? 'beres' : ''}`, type: 'button' }, el('b', null, k), n, k in got ? el('em', null, `→ ${a}`) : null), () => { if (!(k in got)) { sel = k; draw(); } }))),
    el('div', { class: 'kj-kol' }, letters.map((L) => onTap(el('button', { class: `kj-item ${Object.values(got).includes(L) ? 'beres' : ''}`, type: 'button' }, el('b', null, L), DUTIES[L]), () => {
      if (!sel || Object.values(got).includes(L)) return; const want = PROFS.find((p) => p[0] === sel)[2];
      if (L !== want) { ctx.mistake(); shake(host); say(msg, 'bad', 'Belum cocok. Siapa yang membangun model, siapa yang memberi label, siapa yang memeriksa keadilan?'); return; }
      got[sel] = L; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === PROFS.length) { say(msg, '', '1–R, 2–T, 3–P, 4–Q, 5–U, 6–S.'); done(); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Profesi di bidang KA: pasangkan dengan tugasnya'), host, msg);
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
  goal: 'Bantu Sekar memahami pekerjaan masa depan: uraikan enam pekerjaan menjadi tugas, nilai mana yang bisa dibantu KA, baca data perubahan pekerjaan, kenali profesi KA, dan susun piagam pengembang KA.',
  extraModes: [
    { id: 'pilah', icon: '🗃', label: 'Pilah 24 Tugas', desc: 'Tandai P, E, dan T untuk 24 tugas dari enam pekerjaan, lalu pilah ke Tinggi, Sedang, dan Rendah; perbedaan dengan penilaian yang disarankan ditandai untuk didiskusikan', create: createSort },
    { id: 'debat', icon: '🎤', label: 'Papan Skor Debat', desc: 'Debat tim pro dan kontra: moderator mengetuk poin setiap argumen, dan pengatur waktu membatasi giliran bicara satu menit', create: createDebate },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pekerjaan-ka' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const sortRound = (jobs) => { wrap.append(el('p', { class: 'prompt' }, `Menguraikan pekerjaan: ${jobs.map((j) => JOBS.find((x) => x[0] === j)[1]).join(' dan ')}`), sorter(ctx, { tasks: TASKS.filter((t) => jobs.includes(t[0][0])), onDone: () => setTimeout(next, 1200) })); };
      if (r === 0) sortRound(['K', 'N']);
      else if (r === 1) sortRound(['W', 'F']);
      else if (r === 2) sortRound(['D', 'M']);
      else if (r === 3) ask('Menurut penilaian yang disarankan, pekerjaan mana yang paling banyak tugasnya berpeluang tinggi?', [['Kasir (3 dari 4 tugas)', true], ['Perawat'], ['Montir'], ['Petani']], 2, null,
        then(() => ask('Adakah pekerjaan yang semua tugasnya berpeluang tinggi?', [['Tidak ada: setiap pekerjaan masih punya tugas yang perlu empati, tangan, atau penilaian manusia; isinya berubah, jarang hilang seluruhnya', true], ['Ada: kasir akan hilang seluruhnya'], ['Ada: semua pekerjaan akan diganti KA'], ['Tidak ada, karena KA tidak bisa apa-apa']], 1, null,
          then(() => ask('Pada tugas N2 (puisi) dan D2 (sketsa logo), bagaimana KA dan manusia bekerja sama?', [['KA membuat draf atau pilihan dengan cepat; manusia memilih, memperbaiki rasa bahasa atau desainnya, dan bertanggung jawab atas hasil akhir', true], ['KA mengerjakan semuanya, manusia tidak perlu memeriksa'], ['Manusia tidak boleh memakai KA sama sekali'], ['KA memilih hasil terbaik dan menandatanganinya']])))));
      else if (r === 4) pickRows(wrap, ctx, { prompt: 'Pekerjaan yang berubah: tugas Pak Joko setelah ada mesin bayar mandiri dan KA pencatat stok', rows: JOKO.map(([k, t, a]) => [k, t, a]), opts: JOKO_OPTS, info: 'Tugas berpola diambil alih mesin; tugas yang perlu empati tetap; mesin dan KA memunculkan tugas baru.', why: (k, a, ok) => (ok ? ({ ambil: 'Berpola: dikerjakan mesin.', tetap: 'Tetap perlu manusia.', baru: 'Muncul karena ada mesin dan KA.' })[a] : 'Apakah tugas ini berpola, tetap perlu manusia, atau baru muncul karena mesin?'),
        done: then(() => ask('Keterampilan apa yang paling perlu dipelajari Pak Joko?', [['Memakai dan merawat sistem digital, membaca laporan data, dan melayani pelanggan dengan sabar', true], ['Memindai barang lebih cepat'], ['Menghitung uang tunai lebih cepat'], ['Tidak perlu belajar apa pun']])) });
      else if (r === 5) dataRound(wrap, ctx, { done: then(() => ask('Pekerjaan mana yang paling banyak berkurang dan paling banyak bertambah dalam persen?', [['Berkurang: petugas input data (−41,7%) · Bertambah: operator dan pengawas sistem KA (+400%)', true], ['Berkurang: kasir (−30) · Bertambah: pendamping digital UMKM (+15)'], ['Berkurang: penerjemah dokumen · Bertambah: teknisi perawatan'], ['Berkurang: kasir · Bertambah: operator sistem KA']], 1, dataChart({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }))) });
      else if (r === 6) ask('Berapa pekerjaan yang hilang dan berapa yang baru muncul di keenam jenis pekerjaan?', [['60 hilang dan 43 baru (berkurang 17)', true], ['17 hilang dan 0 baru'], ['43 hilang dan 60 baru'], ['30 hilang dan 16 baru']], 1, dataChart({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }),
        then(() => ask('Bisakah petugas input data yang kehilangan pekerjaan langsung menjadi operator sistem KA?', [['Tidak langsung: perlu keterampilan baru, pelatihan ulang, waktu, dan dukungan selama peralihan', true], ['Bisa langsung, karena keduanya memakai komputer'], ['Tidak bisa sama sekali, selamanya'], ['Bisa, asal mendaftar lebih dulu']], 1, null,
          then(() => ask('Cara mana membantu pekerja yang paling mungkin kesulitan?', [['Pelatihan ulang gratis, perusahaan melatih pegawai sebelum memasang KA, dan bantuan sementara bagi yang kehilangan pekerjaan', true], ['Melarang semua mesin bayar mandiri'], ['Membiarkan pasar mengatur sendiri tanpa bantuan'], ['Hanya merekrut pegawai muda']])))));
      else if (r === 7) matchRound(wrap, ctx, { done: next });
      else if (r === 8) pickRows(wrap, ctx, { prompt: 'Aplikasi "Atur Shift": prinsip apa yang dilanggar setiap masukan?', rows: FEEDBACK.map(([k, t, a]) => [k, `${k}. ${t}`, a]), opts: PRINCIPLES, cls: 'prinsip', info: 'Pilihan: kesejahteraan pengguna, transparansi dan tanggung jawab manusia, keadilan, privasi, terjangkau oleh semua orang.', why: (k, a, ok) => (ok ? FEEDBACK.find((f) => f[0] === k)[3] : 'Masukan ini merugikan pegawai dalam hal apa?'), done: next });
      else ask('Janji piagam mana yang menjawab masukan nomor 2 ("Itu keputusan sistem")?', [[FEEDBACK[1][3], true], [FEEDBACK[3][3]], [FEEDBACK[4][3]], ['Kami membuat aplikasi lebih cepat supaya jadwal keluar lebih awal.']], 1, null,
        then(() => ask('Debat: satu argumen klaimnya jelas, memakai data soal 3, dan menanggapi lawan, tetapi juga menyerang pribadi. Berapa poinnya?', [[1], [2, true], [3], [4]], 4, el('table', { class: 'kj-tabel' }, DEBATE.map(([, l, p]) => el('tr', null, el('td', null, l), el('td', null, p > 0 ? `+${p}` : `−${-p}`)))),
          then(() => ask('Argumen mana yang paling kuat untuk tim kontra?', [['"Data soal 3: 43 pekerjaan baru muncul, tetapi 60 hilang; dan tugas kasir K1–K3 berpola sehingga mudah diambil alih."', true], ['"Tim pro tidak mengerti apa-apa."'], ['"KA itu menakutkan."'], ['"Pokoknya pekerjaan akan hilang semua."']])))));
    }
    render();
  },
};

function createSort(root, ctx) {
  const wrap = el('div', { class: 'act pekerjaan-ka' });
  root.append(wrap);
  const start = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pilah 24 tugas dari enam pekerjaan'), sorter(ctx, { tasks: TASKS, onDone: () => wrap.append(el('div', { class: 'kode-baris' }, button('↺ Ulangi', start))) }));
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
