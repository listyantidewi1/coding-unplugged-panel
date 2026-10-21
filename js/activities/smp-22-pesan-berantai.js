// Pesan Berantai di Grup Keluarga — SMP (13–15 tahun), literasi digital.
// Sort eight family-group messages into fakta / opini / hoaks, find the
// warning signs, check P3 and P7 with five questions, compute how fast a
// chain message spreads, and choose a polite correction.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

// segs: [text, clue?]. Clue segments light up after the answer.
export const MSGS = [
  { id: 'P1', from: 'Om Bayu', label: 'opini', segs: [['Menurutku', 1], [' sate kambing buatan Bude Sri ', 0], ['paling enak sedunia!', 1]], why: '"Menurutku" dan "paling enak" adalah penilaian pribadi.' },
  { id: 'P2', from: 'Tante Rina', label: 'fakta', segs: [['Menurut Kementerian Kesehatan', 1], [', mencuci tangan dengan sabun dan air mengalir membantu mencegah diare.', 0]], attach: 'tautan ke situs resmi Kementerian Kesehatan', clueAttach: true, why: 'Menyebut lembaga resmi dan tautan yang bisa dicek.' },
  { id: 'P3', from: 'Pakde Joko', label: 'hoaks', segs: [['SEGERA SEBARKAN!!!', 1], [' Minum air garam hangat lima gelas sehari ', 0], ['bisa menyembuhkan SEMUA penyakit', 1], [', termasuk diabetes, ', 0], ['tanpa obat dokter.', 1], [' ', 0], ['Dokter tidak mau kamu tahu rahasia ini!', 1], [' ', 0], ['Kirim ke 10 grup supaya keluargamu selamat.', 1]], why: 'Huruf kapital, tanda seru, janji ajaib, tuduhan, menyuruh menyebarkan, tanpa sumber.' },
  { id: 'P4', from: 'Kak Dinda', label: 'fakta', segs: [['Pengumuman dari sekolahku: pembagian rapor hari Sabtu pukul 08.00 di aula.', 0]], attach: 'foto surat resmi bertanggal, bercap sekolah, dan ditandatangani kepala sekolah', clueAttach: true, why: 'Surat resmi bertanggal, bercap, dan bertanda tangan; bisa dicek ke wali kelas.' },
  { id: 'P5', from: 'Bude Sri', label: 'hoaks', segs: [['Penting!!', 1], [' Mulai besok, ', 0], ['akun yang tidak meneruskan pesan ini ke 20 orang', 1], [' ', 0], ['akan dihapus otomatis', 1], [' oleh pengelola aplikasi. ', 0], ['Jangan sampai akunmu hilang!!', 1]], why: 'Ancaman, menyuruh meneruskan, tanpa sumber. Aplikasi tidak menghapus akun karena itu.' },
  { id: 'P6', from: 'Mas Arif', label: 'opini', segs: [['Liburan ke gunung ', 0], ['jauh lebih menyenangkan', 1], [' daripada ke pantai.', 0]], why: '"Lebih menyenangkan" adalah selera pribadi.' },
  { id: 'P7', from: 'Om Bayu', label: 'fakta', segs: [['Info dari akun resmi perusahaan air minum daerah', 1], [': aliran air di kecamatan kita mati ', 0], ['hari Minggu pukul 08.00–14.00', 1], [' karena perbaikan pipa.', 0]], attach: 'tautan ke pengumuman di situs resmi perusahaan air minum daerah', clueAttach: true, why: 'Sumber resmi, tautan, waktu jelas, nada tenang.' },
  { id: 'P8', from: 'Tante Rina', label: 'hoaks', segs: [['Foto banjir besar di alun-alun kota kita kemarin sore! Ngeri sekali!', 0]], attach: 'foto', reply: ['Kak Dinda', 'Tante, foto ini sama persis dengan foto di sebuah berita lima tahun lalu tentang banjir di kota lain.'], why: 'Foto lama dari kota lain dipakai untuk kejadian baru: konteks menyesatkan.' },
];
export const LABELS = { fakta: 'Fakta', opini: 'Opini', hoaks: 'Hoaks' };
export const QUESTIONS = [['Siapa', 'pembuatnya lembaga resmi, media pers, atau ahli?'], ['Kapan', 'ada tanggal dan masih berlaku?'], ['Bukti', 'ada tautan ke sumber asli?'], ['Nada', 'tenang, tidak menakut-nakuti atau menyuruh menyebarkan?'], ['Bandingkan', 'sumber tepercaya lain menyampaikan hal yang sama?']];
export const FIVE = { P3: [false, false, false, false, false], P7: [true, true, true, true, true] };
export function spread(k, rounds) {
  const rows = [];
  let total = 0;
  for (let r = 1; r <= rounds; r++) { const fresh = k ** r; total += fresh; rows.push({ r, fresh, total }); }
  return rows;
}
export const PENDUDUK = 280_000_000;
export const firstOver = (k, limit) => spread(k, 40).find((x) => x.total > limit);
// Extra messages for the team mode.
export const POOL = [
  ['Grup Kelas 8B', 'BREAKING!!! Besok seluruh sekolah se-Indonesia libur karena gerhana. Sebarkan sebelum dihapus!!', 'hoaks', 'Tanpa sumber resmi, menyuruh menyebarkan sebelum "dihapus"'],
  ['Raka', 'Pelajaran Matematika itu paling seru dibanding pelajaran lain.', 'opini', 'Penilaian pribadi: "paling seru"'],
  ['Pak RT', 'Info BMKG: gempa magnitudo 4,2 pukul 03.15 WIB di laut selatan, tidak berpotensi tsunami. (tautan ke situs resmi BMKG)', 'fakta', 'Lembaga resmi, waktu jelas, tautan bisa dicek'],
  ['Nomor tak dikenal', 'Ada pembagian kuota internet gratis 100 GB dari pemerintah! Klik tautan ini dan isi nomor PIN-mu.', 'hoaks', 'Meminta PIN lewat tautan yang tidak resmi'],
  ['Sinta', 'Menurut saya film animasi lebih bagus daripada film aksi.', 'opini', '"Menurut saya" dan "lebih bagus": selera'],
  ['Bu Kader', 'Jadwal posyandu balita RW 05: Selasa, 4 November, pukul 08.00, di balai warga. (surat edaran ketua RW bertanggal dan bertanda tangan)', 'fakta', 'Surat edaran bertanggal dan bertanda tangan'],
  ['Om Hendra', 'Video ini membuktikan makan es setelah makan gorengan menyebabkan kanker! Dokter merahasiakannya!', 'hoaks', 'Klaim kesehatan berlebihan dan tuduhan "dirahasiakan"'],
  ['Tante Lia', 'Foto antrean panjang di SPBU kota kita pagi ini! (foto) — Balasan Dimas: foto ini dari berita tahun 2019 di negara lain.', 'hoaks', 'Foto lama dari tempat lain dipakai untuk kejadian baru'],
  ['Kak Nisa', 'Perpustakaan daerah buka Senin–Sabtu pukul 08.00–16.00. (tautan ke pengumuman di situs resmi pemerintah kabupaten)', 'fakta', 'Sumber resmi dan tautan yang bisa dibuka'],
  ['Adik Bima', 'Nasi goreng buatan Ibu adalah sarapan terbaik.', 'opini', 'Penilaian pribadi: "terbaik"'],
  ['"Bank Kita"', 'Rekeningmu diblokir! Kirim kode OTP sekarang supaya bisa dibuka kembali.', 'hoaks', 'Meminta kode OTP; bank tidak pernah meminta OTP'],
  ['Pak Lurah', 'Dinas Kesehatan kabupaten: imunisasi campak gratis di puskesmas pada 10–15 November. (tautan ke pengumuman resmi)', 'fakta', 'Lembaga resmi, tanggal jelas, tautan pengumuman'],
  ['Yoga', 'Menurutku, bersepeda ke sekolah lebih menyenangkan daripada naik angkot.', 'opini', '"Menurutku" dan "lebih menyenangkan"'],
  ['Grup Arisan', 'Menurut penelitian luar negeri, orang yang tidur siang pasti 50% lebih pintar!!! Bagikan!!!', 'hoaks', 'Penelitian tanpa nama, tautan, atau tanggal; angka berlebihan'],
  ['Wali kelas', 'Penilaian akhir semester dimulai Senin, 1 Desember. (surat edaran bercap sekolah, juga di papan pengumuman)', 'fakta', 'Surat edaran bercap, bisa dicek di papan pengumuman'],
  ['Mbak Ayu', 'Lagu daerah lebih enak didengar daripada lagu pop.', 'opini', '"Lebih enak didengar": selera pribadi'],
];
const fmt = (n) => n.toLocaleString('id-ID');

function bubble(m, { reveal = false, onSeg, picked = [], small = false } = {}) {
  return el('div', { class: `pb-gelembung ${small ? 'kecil' : ''}`, 'data-m': m.id },
    el('div', { class: 'pb-dari' }, el('b', null, m.id), ` · ${m.from}`),
    el('p', null, m.segs.map(([t, c], i) => {
      if (!onSeg) return reveal && c ? el('mark', null, t) : t;
      if (!t.trim()) return t;
      return onTap(el('span', { class: `pb-seg ${picked.includes(i) ? 'pilih' : ''}`, 'data-s': i }, t), () => onSeg(i));
    })),
    m.attach ? el('small', { class: `pb-lampiran ${reveal && m.clueAttach ? 'tanda' : ''}` }, `📎 ${m.attach}`) : null,
    m.reply ? el('div', { class: `pb-balas ${reveal ? 'tanda' : ''}` }, el('b', null, `${m.reply[0]}: `), m.reply[1]) : null);
}

export default {
  id: 'smp-22-pesan-berantai',
  title: 'Pesan Berantai di Grup Keluarga',
  topic: 'Fakta, opini, hoaks, memeriksa sumber, dan penyebaran pesan berantai',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '📲',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membedakan fakta, opini, dan hoaks dengan menunjuk petunjuknya, memeriksa pesan dengan lima pertanyaan, menghitung penyebaran pesan berantai, dan memilih cara menegur yang santun dengan sumber tepercaya.',
  extraModes: [
    { id: 'sebaran', icon: '🌳', label: 'Penghitung Penyebaran', desc: 'Atur diteruskan ke berapa orang dan berapa putaran; lihat pohon penyebaran dan bandingkan dengan penduduk Indonesia', create: createSpread },
    { id: 'giliran', icon: '🔁', label: 'Pilah Bergiliran', desc: 'Tim bergantian memilah 16 pesan tambahan; label benar beserta petunjuk yang tepat mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pesanberantai' });
    root.append(wrap);
    const clueMsg = ctx.rand.pick(['P3', 'P5']);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) sortRound(wrap, ctx, { done: next });
      else if (r === 1) clueRound(wrap, ctx, { m: MSGS.find((x) => x.id === clueMsg), done: next });
      else if (r === 2) fiveRound(wrap, ctx, { done: next });
      else if (r === 3) ask('Mengapa berita dari media pers lebih bisa dipercaya daripada pesan berantai tanpa nama pembuat?', [['Ada redaksi dan penanggung jawab, berita diperiksa sebelum terbit, dan pembaca tahu ke mana mengadu', true], ['Karena media pers tidak pernah salah'], ['Karena beritanya lebih panjang'], ['Karena dibagikan lebih banyak orang']]);
      else if (r === 4) ask('Media pers juga bisa salah. Apa yang dilakukan media pers yang baik bila beritanya keliru?', [['Memuat ralat atau koreksi dan memberi hak jawab kepada pihak yang dirugikan', true], ['Menghapus berita diam-diam tanpa penjelasan'], ['Membiarkan saja karena sudah terbit'], ['Menyalahkan pembaca']]);
      else if (r === 5) spreadRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Setiap penerima meneruskan ke 5 orang baru, 10 menit per putaran. Kapan total penerima pertama kali lebih dari 1 juta?', [['Putaran 9, yaitu 90 menit (2.441.405 orang)', true], ['Putaran 8, yaitu 80 menit'], ['Putaran 6, yaitu 60 menit'], ['Putaran 20, yaitu 200 menit']]);
      else if (r === 7) ask('Dalam kenyataan, penyebarannya lebih lambat dari hitungan itu. Mengapa?', [['Sebagian tidak meneruskan, banyak orang menerima pesan yang sama berkali-kali, dan orang tidak meneruskan secepat itu', true], ['Karena internet selalu lambat'], ['Karena pesan berantai tidak bisa diteruskan'], ['Karena hitungannya salah; seharusnya lebih cepat']]);
      else if (r === 8) ask('Balasan mana yang paling tepat untuk Pakde Joko (P3) di grup keluarga?', [['"Pakde, terima kasih sudah peduli. Saya cek di situs Kementerian Kesehatan: air garam tidak menyembuhkan semua penyakit, garam berlebihan malah berbahaya. Obat dokter tetap diminum ya, Pakde. Ini tautannya."', true], ['"HOAKS! Pakde jangan sebar berita bohong, bikin malu keluarga!"'], ['"Wah, terima kasih infonya, Pakde! Saya teruskan ke grup lain."'], ['"Pakde salah. Pokoknya itu tidak benar."']], 1, bubble(MSGS[2], { small: true }));
      else halfRound(wrap, ctx, { done: next, ask });
    }
    render();
  },
};

// Label all eight messages.
function sortRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Fakta: bisa diperiksa dan sesuai sumber tepercaya. Opini: pendapat atau perasaan. Hoaks: palsu atau menyesatkan.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'pb-grid' }, MSGS.map((m) => el('div', { class: `pb-baris ${bad.includes(m.id) ? 'salah' : ''} ${finished ? m.label : ''}` },
    bubble(m, { reveal: finished }),
    el('div', { class: 'seg pb-label' }, Object.entries(LABELS).map(([k, l]) => onTap(el('button', { class: `seg-btn ${pick[m.id] === k ? 'on' : ''}`, type: 'button', 'data-m': m.id, 'data-l': k }, l), () => { if (!finished) { pick[m.id] = k; ctx.sound.tap(); draw(); } }))),
    finished ? el('small', { class: 'pb-alasan' }, m.why) : null))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pilah delapan pesan di grup "Keluarga Besar Mbah Harjo".'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = MSGS.filter((m) => pick[m.id] !== m.label).map((m) => m.id);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} pesan belum tepat: ${bad.join(', ')}.`; ctx.mistake(); return; }
    finished = true; draw(); msg.className = 'reveal'; msg.textContent = 'Benar! Petunjuknya kini menyala di setiap pesan.'; done();
  }, 'primary')), msg);
}

// Tap the warning signs in a hoax.
function clueRound(wrap, ctx, { m, done }) {
  const picked = [];
  let finished = false;
  const clues = m.segs.map((s, i) => (s[1] ? i : -1)).filter((i) => i >= 0);
  const need = Math.min(3, clues.length);
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `Ketuk paling sedikit ${need} bagian yang mencurigakan.`);
  const draw = () => stage.replaceChildren(bubble(m, { onSeg: (i) => { if (finished) return; const k = picked.indexOf(i); if (k >= 0) picked.splice(k, 1); else picked.push(i); ctx.sound.tap(); draw(); }, picked, reveal: finished }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, `${m.id} adalah hoaks. Bagian mana yang menjadi tanda bahayanya?`), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const wrong = picked.filter((i) => !clues.includes(i));
    if (wrong.length) { msg.className = 'reveal bad'; msg.textContent = `"${m.segs[wrong[0]][0].trim()}" sendiri bukan tanda bahaya.`; ctx.mistake(); return; }
    if (picked.length < need) { msg.className = 'reveal bad'; msg.textContent = `Baru ${picked.length}. Cari ${need - picked.length} lagi.`; return; }
    finished = true;
    stage.replaceChildren(bubble(m, { reveal: true }));
    msg.className = 'reveal'; msg.textContent = `Benar. ${m.why}`; done();
  }, 'primary')), msg);
}

// Five questions for P3 and P7, each ✓ or ✗.
function fiveRound(wrap, ctx, { done }) {
  const val = { P3: [], P7: [] };
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, '✓ meyakinkan, ✗ mencurigakan. Ketuk kotak untuk mengganti.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'pb-samping' },
    el('div', { class: 'pb-dua' }, bubble(MSGS[2], { small: true }), bubble(MSGS[6], { small: true })),
    el('table', { class: 'kls-tabel pb-lima' }, el('thead', null, el('tr', null, el('th', null, 'Pertanyaan'), el('th', null, 'P3'), el('th', null, 'P7'))),
      el('tbody', null, ...QUESTIONS.map(([q, d], i) => el('tr', null, el('td', null, el('b', null, q), el('small', null, ` ${d}`)),
        ...['P3', 'P7'].map((p) => el('td', null, onTap(el('button', { class: `ck-isi ${bad.includes(`${p}-${i}`) ? 'salah' : ''}`, type: 'button', 'data-p': p, 'data-i': i }, val[p][i] == null ? '…' : val[p][i] ? '✓' : '✗'), () => { if (finished) return; val[p][i] = val[p][i] == null ? true : !val[p][i]; ctx.sound.tap(); draw(); })))))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lima pertanyaan sebelum meneruskan: periksa P3 dan P7.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = [];
    for (const p of ['P3', 'P7']) FIVE[p].forEach((v, i) => { if (val[p][i] !== v) bad.push(`${p}-${i}`); });
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} kotak belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'P3 gagal di kelima pertanyaan; P7 lolos semuanya (setelah dicek di situs resmi).'; done();
  }, 'primary')), msg);
}

// Fill rounds 3–6 of the 5-person spread.
function spreadRound(wrap, ctx, { done }) {
  const rows = spread(5, 6);
  const cells = [];
  for (const kind of ['fresh', 'total']) for (let r = 3; r <= 6; r++) cells.push([kind, r]);
  const vals = {};
  let focus = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Penerima baru dikali 5 setiap putaran; total = total sebelumnya + penerima baru.');
  const cell = (kind, r, bad) => {
    const i = cells.findIndex(([k, x]) => k === kind && x === r);
    if (i < 0) return el('td', null, fmt(rows[r - 1][kind]));
    return el('td', null, onTap(el('button', { class: `ck-isi lebar ${focus === i ? 'fokus' : ''} ${bad.includes(i) ? 'salah' : ''}`, type: 'button', 'data-i': i }, vals[i] != null ? fmt(vals[i]) : '…'), () => { focus = i; draw(bad); }));
  };
  function draw(bad = []) {
    stage.replaceChildren(el('table', { class: 'kls-tabel pb-sebar' }, el('tbody', null,
      el('tr', null, el('th', null, 'Putaran'), ...rows.map((x) => el('th', null, x.r))),
      el('tr', null, el('th', null, 'Penerima baru'), ...rows.map((x) => cell('fresh', x.r, bad))),
      el('tr', null, el('th', null, 'Total penerima'), ...rows.map((x) => cell('total', x.r, bad))))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; const s = String(vals[focus] ?? ''); if (s.length < 6) vals[focus] = Number(s + d); draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { const s = String(vals[focus] ?? '').slice(0, -1); vals[focus] = s ? Number(s) : undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, 'Pakde Joko mengirim P3 ke 5 orang. Setiap penerima meneruskan ke 5 orang baru.'), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const bad = cells.map(([k, r], i) => (vals[i] !== rows[r - 1][k] ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} isian belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: dalam 60 menit sudah 19.530 orang.'; done();
  }, 'primary')), msg);
}

// Mark the fact and the misleading part, then explain.
function halfRound(wrap, ctx, { done, ask }) {
  const parts = [['Kementerian Kesehatan menyarankan cuci tangan pakai sabun.', 'fakta'], ['Karena itu, rendamlah sayuran dengan sabun cuci piring supaya kumannya mati!', 'sesat']];
  const mark = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk setiap kalimat untuk berganti: garis bawah (fakta) atau lingkaran (menyesatkan).');
  const draw = () => stage.replaceChildren(el('div', { class: 'pb-gelembung' }, el('div', { class: 'pb-dari' }, el('b', null, 'Pesan'), ' · Tante Rina'),
    el('p', null, parts.map(([t], i) => onTap(el('span', { class: `pb-seg ${mark[i] || ''}`, 'data-s': i }, t, ' '), () => { if (finished) return; mark[i] = mark[i] === 'fakta' ? 'sesat' : 'fakta'; ctx.sound.tap(); draw(); })))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tantangan: pesan setengah benar.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    if (parts.some(([, k], i) => mark[i] !== k)) { msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Bagian mana yang benar-benar disarankan Kementerian Kesehatan?'; ctx.mistake(); return; }
    finished = true;
    wrap.replaceChildren();
    ask('Sayuran cukup dicuci dengan air mengalir. Mengapa pesan yang mencampur fakta dan hoaks lebih mudah dipercaya?', [['Bagian awalnya benar dan menyebut lembaga resmi, sehingga pembaca ikut percaya pada bagian berikutnya', true], ['Karena pesannya pendek'], ['Karena memakai tanda seru'], ['Karena semua isinya fakta']], 1, stage);
  }, 'primary')), msg);
}

function createSpread(root, ctx) {
  const wrap = el('div', { class: 'act pesanberantai' });
  root.append(wrap);
  let k = 5;
  let R = 9;
  const out = el('div', { class: 'pb-lab' });
  const slider = (label, min, max, get, set) => {
    const shown = el('b', null, String(get()));
    const input = el('input', { type: 'range', min, max, value: get(), class: 'ps-range' });
    input.addEventListener('input', () => { set(Number(input.value)); shown.textContent = String(get()); draw(); });
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    return el('label', { class: 'ps-geser' }, el('span', null, label, shown), input);
  };
  function tree() {
    const W = 600;
    const H = 170;
    const levels = [];
    for (let d = 0; d <= Math.min(3, R); d++) levels.push(k ** d);
    const shownLevels = levels.filter((n) => n <= 400);
    const svg = [];
    const pos = shownLevels.map((n, d) => Array.from({ length: n }, (_, i) => [((i + 0.5) / n) * W, 18 + d * ((H - 30) / Math.max(1, shownLevels.length - 1))]));
    for (let d = 1; d < pos.length; d++) pos[d].forEach(([x, y], i) => { const [px, py] = pos[d - 1][Math.floor(i / k)]; svg.push(`<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" />`); });
    pos.forEach((lv, d) => lv.forEach(([x, y]) => svg.push(`<circle cx="${x}" cy="${y}" r="${d === 0 ? 9 : Math.max(1.4, 7 - d * 1.8)}" class="${d === 0 ? 'akar' : ''}" />`)));
    const s = el('div', { class: 'pb-pohon', html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pohon penyebaran">${svg.join('')}</svg>` });
    return s;
  }
  function draw() {
    const rows = spread(k, R);
    const over = rows.find((x) => x.total > PENDUDUK);
    const last = rows.at(-1);
    const frac = Math.min(1, Math.log10(last.total) / Math.log10(PENDUDUK));
    out.replaceChildren(tree(),
      el('div', { class: 'pb-tabel-wadah' }, el('table', { class: 'kls-tabel pb-sebar' }, el('tbody', null,
        el('tr', null, el('th', null, 'Putaran'), ...rows.map((x) => el('th', { class: over && x.r >= over.r ? 'lewat' : '' }, x.r))),
        el('tr', null, el('th', null, 'Menit'), ...rows.map((x) => el('td', null, x.r * 10))),
        el('tr', null, el('th', null, 'Total'), ...rows.map((x) => el('td', { class: over && x.r >= over.r ? 'lewat' : '' }, fmt(x.total))))))),
      el('div', { class: 'pb-batang' }, el('div', { style: { width: `${frac * 100}%` } }), el('span', null, `${fmt(last.total)} dari ±280 juta penduduk (skala log)`)),
      el('p', { class: 'reveal info' }, over ? `Diteruskan ke ${k} orang: melewati penduduk Indonesia pada putaran ${over.r} (${over.r * 10} menit).` : `Dengan ${k} orang per putaran, ${R} putaran belum melewati penduduk Indonesia. Putaran ke-${firstOver(k, PENDUDUK).r} akan melewatinya.`));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Penghitung penyebaran pesan berantai'),
    el('div', { class: 'ps-atur' }, slider('Diteruskan ke ', 2, 10, () => k, (v) => { k = v; }), slider('Putaran ', 1, 12, () => R, (v) => { R = v; })), out);
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pesanberantai' });
  root.append(wrap);
  let n = 2;
  let deck = [];
  let turn = 0;
  const pts = [];
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { deck = ctx.rand.shuffle(POOL); turn = 0; pts.length = 0; for (let i = 0; i < n; i++) pts.push(0); play(); }, 'primary')));
  }
  function play() {
    if (turn >= deck.length) return finish();
    const [from, text, label, clue] = deck[turn];
    const team = turn % n;
    const others = ctx.rand.shuffle(POOL.filter((p) => p[2] !== label)).slice(0, 2).map((p) => p[3]);
    const clues = ctx.rand.shuffle([clue, ...others]);
    let lab = null;
    let cl = null;
    let locked = false;
    const msg = el('p', { class: 'reveal info' }, 'Pilih label dan satu petunjuk, lalu Kunci.');
    const stage = el('div');
    const draw = () => stage.replaceChildren(
      el('div', { class: 'pb-gelembung' }, el('div', { class: 'pb-dari' }, el('b', null, `Pesan ${turn + 1}/16`), ` · ${from}`), el('p', null, text)),
      el('div', { class: 'seg pb-label' }, Object.entries(LABELS).map(([k, l]) => onTap(el('button', { class: `seg-btn ${lab === k ? 'on' : ''}`, type: 'button', 'data-l': k }, l), () => { if (!locked) { lab = k; draw(); } }))),
      el('div', { class: 'pb-petunjuk' }, clues.map((c) => onTap(el('button', { class: `seg-btn ${cl === c ? 'on' : ''}`, type: 'button' }, c), () => { if (!locked) { cl = c; draw(); } }))));
    draw();
    wrap.replaceChildren(el('div', { class: 'pb-skor' }, pts.map((p, i) => el('span', { class: i === team ? 'giliran' : '' }, `Tim ${i + 1}: ${p}`))),
      el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`), stage, el('div', { class: 'kode-baris' }, button('Kunci', () => {
        if (locked) return;
        if (!lab || !cl) { msg.className = 'reveal bad'; msg.textContent = 'Pilih label dan petunjuk dulu.'; return; }
        locked = true;
        const ok = lab === label && cl === clue;
        if (ok) { pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
        msg.className = ok ? 'reveal' : 'reveal bad';
        msg.textContent = ok ? `Poin untuk Tim ${team + 1}! ${LABELS[label]}: ${clue}.` : `Jawabannya ${LABELS[label]}: ${clue}.`;
        turn++;
        setTimeout(play, 2600);
      }, 'primary')), msg);
  }
  function finish() {
    const best = Math.max(...pts);
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Semua 16 pesan sudah dipilah.'),
      el('div', { class: 'ab-lapisan' }, pts.map((p, i) => el('div', { class: `ab-lap-baris ${p === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}`), el('b', null, `${p} poin${p === best ? ' 🏆' : ''}`)))),
      el('div', { class: 'kode-baris' }, button('Main lagi', setup, 'primary')));
  }
  setup();
}
