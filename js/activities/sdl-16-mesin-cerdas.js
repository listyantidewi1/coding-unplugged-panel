// Mesin Cerdas atau Bukan? — SD Lanjut (10–12 tahun), mengenal KA. Sort
// machines into fixed-rule machines and machines trained on many examples,
// match senses with sensors, and weigh stories where KA helps or harms.

import { el, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

export const MACHINES = [
  { icon: '🌀', name: 'Kipas angin', how: 'Berputar sesuai tombol kecepatan yang ditekan.', smart: false, why: 'Tombol yang sama selalu memberi putaran yang sama. Tidak ada yang dipelajari.' },
  { icon: '🧮', name: 'Kalkulator', how: 'Menghitung dengan aturan matematika.', smart: false, why: 'Sangat cepat, tetapi hanya menjalankan aturan hitung yang tetap.' },
  { icon: '🍚', name: 'Penanak nasi', how: 'Pindah ke "hangat" bila panasnya sudah cukup.', smart: false, why: 'Aturannya tetap: jika panas cukup, pindah ke hangat.' },
  { icon: '💡', name: 'Lampu jalan otomatis', how: 'Menyala bila sensor cahaya merasakan gelap.', smart: false, why: 'Punya sensor, tetapi hanya satu aturan: jika gelap, nyalakan lampu.' },
  { icon: '🚪', name: 'Pintu otomatis di toko', how: 'Terbuka bila sensor merasakan ada gerakan.', smart: false, why: 'Aturannya tetap: jika ada gerakan, buka pintu.' },
  { icon: '🎙️', name: 'Asisten suara di HP', how: 'Mengerti perintah lisan, misalnya "Telepon Ibu".', smart: true, why: 'Dilatih dengan sangat banyak contoh suara untuk mengenali kata-kata.' },
  { icon: '📱', name: 'Buka kunci HP dengan wajah', how: 'Mengenali wajah pemilik HP dari kamera.', smart: true, why: 'Dilatih mengenali pola wajah; tebakannya bisa salah.' },
  { icon: '🌐', name: 'Penerjemah otomatis', how: 'Menerjemahkan kalimat ke bahasa lain.', smart: true, why: 'Belajar dari sangat banyak contoh kalimat dan terjemahannya.' },
  { icon: '🎬', name: 'Rekomendasi video', how: 'Menyarankan video yang mungkin kamu sukai.', smart: true, why: 'Menebak dari pola tontonan banyak orang; tebakannya bisa meleset.' },
  { icon: '🗺️', name: 'Aplikasi peta', how: 'Memperkirakan jalan mana yang akan macet.', smart: true, why: 'Membuat perkiraan dari pola lalu lintas yang sangat banyak.' },
];
const SENSES = [
  { sense: '👁️ Mata', sensor: '📷 Kamera', tool: 'kamera HP, CCTV' },
  { sense: '👂 Telinga', sensor: '🎙️ Mikrofon', tool: 'asisten suara, alat perekam' },
  { sense: '✋ Kulit (merasakan panas)', sensor: '🌡️ Sensor suhu', tool: 'termometer digital, penanak nasi' },
  { sense: '👃 Hidung', sensor: '💨 Sensor gas atau asap', tool: 'detektor asap' },
];
export const STORIES = [
  { text: 'Aplikasi KA membantu dokter memeriksa foto rontgen sehingga penyakit lebih cepat ketahuan.', key: 'B', why: 'Dokter tetap memeriksa dan memutuskan; KA membantu dokter bekerja lebih cepat.' },
  { text: 'Rani memakai aplikasi pengubah wajah untuk membuat foto temannya terlihat jelek, lalu menyebarkannya di grup kelas.', key: 'R', why: 'Menyakiti teman dan tanpa izin. Rani sebaiknya menghapus foto itu dan meminta maaf.' },
  { text: 'Asisten suara membantu Kakek, yang matanya kurang awas, menelepon cucunya.', key: 'B', why: 'KA membantu orang yang punya keterbatasan.' },
  { text: 'Doni meminta aplikasi KA menuliskan seluruh karangannya, lalu mengakuinya sebagai tulisannya sendiri.', key: 'R', why: 'Tidak jujur dan Doni tidak belajar. Karangan ditulis sendiri; penggunaan KA disampaikan dengan jujur.' },
  { text: 'Kamera pengenal wajah di gerbang sekolah mencatat kehadiran murid tanpa memberi tahu orang tua.', key: 'H', why: 'Wajah adalah data pribadi. Sekolah perlu meminta izin, menjelaskan tujuannya, dan menyimpan datanya dengan aman.' },
  { text: 'Penerjemah otomatis salah menerjemahkan kata dari bahasa daerah sehingga seseorang tersinggung.', key: 'H', why: 'KA bisa salah. Terjemahan penting perlu diperiksa oleh orang yang mengerti bahasanya.' },
];
const BRH = { B: '👍 Membantu', R: '👎 Merugikan', H: '⚠️ Perlu hati-hati' };
const KEY_QUESTIONS = 'Dua pertanyaan kunci: (1) Apakah ia hanya menjalankan aturan tetap, hasilnya selalu sama? (2) Apakah ia dilatih dengan banyak contoh untuk mengenali pola dan menebak?';

function sortMachines(wrap, ctx, done) {
  const cards = ctx.rand.shuffle(MACHINES).map((m) => el('div', { class: 'mesin-kartu', 'data-drag': m.name }, el('span', { class: 'mesin-ikon' }, m.icon), el('b', null, m.name), el('small', null, m.how)));
  const bin = (smart) => el('div', { class: `mesin-kotak ${smart ? 'cerdas' : 'biasa'}`, 'data-drop': smart ? 'C' : 'N' }, el('b', null, smart ? '🧠 Mesin Cerdas (KA)' : '⚙️ Mesin Non-Cerdas'), el('div', { class: 'mesin-isi' }));
  const binC = bin(true);
  const binN = bin(false);
  const tray = el('div', { class: 'mesin-baki' }, cards);
  const info = el('p', { class: 'reveal info' }, KEY_QUESTIONS);
  let left = cards.length;
  const area = el('div', { class: 'mesin-area' }, binN, tray, binC);
  dnd(area, (item, target) => {
    const m = MACHINES.find((x) => x.name === item.dataset.drag);
    const box = target.closest('[data-drop]');
    if ((box.dataset.drop === 'C') !== m.smart) {
      shake(item);
      ctx.mistake();
      info.className = 'reveal bad';
      info.textContent = `${m.name}: coba pikirkan lagi. ${KEY_QUESTIONS}`;
      return;
    }
    item.classList.add('locked');
    item.removeAttribute('data-drag');
    box.querySelector('.mesin-isi').append(item);
    ctx.sound.good();
    info.className = 'reveal';
    info.textContent = `${m.name}: ${m.why}`;
    if (--left === 0) done();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Pilah Mesin: seret atau ketuk setiap kartu, lalu taruh di kotak yang tepat.'), area, info);
}

function matchSenses(wrap, ctx, done) {
  const rows = SENSES.map((s, i) => el('div', { class: 'indra-baris', 'data-drop': i }, el('b', null, s.sense), el('div', { class: 'indra-slot' }, '?'), el('small', { class: 'indra-alat' })));
  const chips = ctx.rand.shuffle(SENSES.map((s, i) => ({ s, i }))).map(({ s, i }) => el('div', { class: 'sensor-kartu', 'data-drag': i }, s.sensor));
  let left = SENSES.length;
  const area = el('div', { class: 'indra-area' }, el('div', { class: 'indra-kolom' }, rows), el('div', { class: 'sensor-baki' }, chips));
  dnd(area, (item, target) => {
    const row = target.closest('[data-drop]');
    if (row.dataset.drop !== item.dataset.drag) { shake(item); ctx.mistake(); return; }
    const s = SENSES[+row.dataset.drop];
    row.querySelector('.indra-slot').replaceChildren(s.sensor);
    row.querySelector('.indra-alat').textContent = `Contoh: ${s.tool}`;
    row.classList.add('pas');
    item.remove();
    ctx.sound.good();
    if (--left === 0) done();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Indra dan Sensor: jodohkan indra manusia dengan sensor mesin yang mirip.'), area);
}

// Pixel numbers: what a camera really hands the computer.
function pixelPicture() {
  const pic = ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'];
  return el('div', { class: 'kucing-angka' }, el('div', { class: 'kucing-kisi' }, pic.join('').split('').map((c) => el('span', { class: c === '1' ? 'gelap' : '' }, c === '1' ? '30' : '220'))), el('span', { class: 'kucing-ikon' }, '📷 ➜ 🐱?'));
}

export default {
  id: 'sdl-16-mesin-cerdas',
  title: 'Mesin Cerdas atau Bukan?',
  topic: 'Mengenal kecerdasan artifisial',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🧠',
  source: { name: 'Gagasan pembelajaran KA untuk anak', url: 'https://www.csunplugged.org/en/topics/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membedakan mesin yang menjalankan aturan tetap dan mesin yang dilatih dengan banyak contoh, menjodohkan indra dengan sensor, dan menimbang cerita pemakaian KA yang membantu atau merugikan.',
  extraModes: [
    { id: 'kelas', icon: '🗳️', label: 'Membantu atau Merugikan?', desc: 'Satu kartu cerita, kelas mengetuk B, R, atau H, lalu panel menampilkan jumlah pilihan untuk diskusi', create: createVote },
    { id: 'debat', icon: '⭐', label: 'Debat Dua Tim', desc: 'Tim bergantian mengambil kartu mesin atau cerita dan menyampaikan alasannya; guru memberi bintang', create: createDebate },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act cerdas' });
    root.append(wrap);
    const stories = ctx.rand.shuffle(STORIES);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2600); } };
      const ask = (prompt, opts, subject, columns = 1) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: ctx.rand.shuffle(opts).map(([label, correct]) => ({ label, correct })) });
      if (r === 0) sortMachines(wrap, ctx, next);
      else if (r === 1) ask('Lampu jalan otomatis punya sensor. Apakah punya sensor berarti cerdas?', [
        ['Tidak: lampu jalan hanya menjalankan satu aturan tetap, "jika gelap, nyalakan"', true], ['Ya: semua mesin yang punya sensor pasti cerdas'], ['Ya: karena lampunya menyala sendiri'],
      ]);
      else if (r === 2) matchSenses(wrap, ctx, next);
      else if (r === 3) ask('Ketika kamera "melihat" kucing, apa yang sebenarnya diterima komputer?', [
        ['Angka-angka, yaitu nilai warna setiap piksel', true], ['Seekor kucing kecil di dalam kamera'], ['Kata "kucing"'],
      ], pixelPicture());
      else if (r === 4) ask('Mana yang bisa dirasakan sensor tetapi TIDAK bisa dirasakan manusia?', [
        ['Panas tubuh di tempat gelap (kamera inframerah)', true], ['Warna baju teman'], ['Suara bel sekolah'],
      ]);
      else if (r === 5) ask('Mana yang mudah bagi manusia tetapi sulit bagi mesin?', [
        ['Memahami perasaan teman dan mengerti lelucon', true], ['Menghitung 4.567 × 89 dengan cepat'], ['Menyimpan seribu foto tanpa lupa'],
      ]);
      else {
        const s = stories[(r - 6) % stories.length];
        const why = el('p', { class: 'reveal' });
        choice(wrap, {
          prompt: `Cerita: ${s.text} Membantu, merugikan, atau perlu hati-hati?`, ctx, columns: 3,
          onRight() { why.textContent = s.why; wrap.append(why); next(); },
          options: Object.entries(BRH).map(([k, label]) => ({ label, correct: k === s.key })),
        });
      }
    }
    render();
  },
};

// Class vote on one story at a time.
function createVote(root, ctx) {
  const wrap = el('div', { class: 'act cerdas' });
  root.append(wrap);
  let k = 0;
  function show() {
    const s = STORIES[k];
    const votes = { B: 0, R: 0, H: 0 };
    const counts = {};
    const chart = el('div', { class: 'suara-grafik', hidden: true });
    const btns = Object.entries(BRH).map(([key, label]) => {
      counts[key] = el('b', null, '0');
      return button([label, ' ', counts[key]], () => { votes[key]++; counts[key].textContent = votes[key]; ctx.sound.tap(); }, `pilih-btn pilih-${key}`);
    });
    const reveal = button('📊 Tampilkan hasil', () => {
      const total = Math.max(1, votes.B + votes.R + votes.H);
      chart.hidden = false;
      chart.replaceChildren(...Object.entries(BRH).map(([key, label]) => el('div', { class: 'suara-baris' }, el('span', null, label), el('i', { class: `pilih-${key}`, style: { width: `${(votes[key] / total) * 100}%` } }), el('b', null, votes[key]))),
        el('p', { class: 'reveal info' }, `Bahan diskusi: ${BRH[s.key]}. ${s.why}`));
    }, 'small');
    wrap.replaceChildren(el('p', { class: 'small-note' }, `Kartu cerita ${k + 1} dari ${STORIES.length}`), el('div', { class: 'cerita-kartu' }, s.text), el('div', { class: 'row wrap' }, btns),
      el('div', { class: 'row' }, reveal, button('Kartu berikutnya ➜', () => { k = (k + 1) % STORIES.length; show(); }, 'small ghost')), chart);
  }
  show();
}

// Two teams take turns; the teacher gives stars for the clearest reason.
function createDebate(root, ctx) {
  const wrap = el('div', { class: 'act cerdas' });
  root.append(wrap);
  const stars = [0, 0];
  let team = 0;
  const deck = [...MACHINES.map((m) => ({ m })), ...STORIES.map((s) => ({ s }))].sort(() => Math.random() - 0.5);
  let k = -1;
  function show() {
    k = (k + 1) % deck.length;
    const c = deck[k];
    const card = c.m
      ? el('div', { class: 'cerita-kartu' }, el('span', { class: 'mesin-ikon' }, c.m.icon), el('b', null, c.m.name), el('p', null, c.m.how), el('p', { class: 'small-note' }, 'Cerdas atau non-cerdas? Mengapa?'))
      : el('div', { class: 'cerita-kartu' }, c.s.text, el('p', { class: 'small-note' }, 'Membantu, merugikan, atau perlu hati-hati? Apa yang sebaiknya dilakukan?'));
    const hint = el('p', { class: 'reveal info', hidden: true }, c.m ? `${c.m.smart ? '🧠 Cerdas' : '⚙️ Non-cerdas'}: ${c.m.why}` : `${BRH[c.s.key]}: ${c.s.why}`);
    const score = el('div', { class: 'row' }, [0, 1].map((t) => el('span', { class: `tim-skor t${t} ${t === team ? 'giliran' : ''}` }, `Tim ${t + 1}: ${'⭐'.repeat(stars[t]) || '0'}`)));
    wrap.replaceChildren(score, el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}: sampaikan alasanmu. Tim lain boleh menanggapi.`), card,
      el('div', { class: 'row wrap' }, button('⭐ Tim 1', () => { stars[0]++; ctx.sound.good(); show2(); }, 'small'), button('⭐ Tim 2', () => { stars[1]++; ctx.sound.good(); show2(); }, 'small'),
        button('Lihat pembahasan', () => { hint.hidden = false; }, 'small ghost'), button('Kartu berikutnya ➜', () => { team = 1 - team; show(); }, 'primary')), hint);
    function show2() { score.replaceChildren(...[0, 1].map((t) => el('span', { class: `tim-skor t${t} ${t === team ? 'giliran' : ''}` }, `Tim ${t + 1}: ${'⭐'.repeat(stars[t]) || '0'}`))); }
  }
  show();
}
