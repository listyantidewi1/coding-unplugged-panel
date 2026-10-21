// Bertanya dengan Cerdas pada Chatbot — SMP (13–15 tahun), KA. A scripted
// "Teman Belajar" chatbot (no AI service): pupils check a confident but
// wrong answer against a local-history source, label the parts of a good
// question (Peran, Tugas, Konteks, Batasan), build one from cards, keep
// personal data out, and use chatbots honestly.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

export const SOURCE = 'Pasar Wanasari dibangun pada tahun 1921 atas prakarsa para pedagang setempat yang dipimpin Haji Umar Said. Pada 1948, pasar itu menjadi dapur umum bagi para pejuang. Pasar lama terbakar pada 1987 dan dibangun kembali pada 1990. Sejak 2015, pasar ini juga menjadi tempat Festival Kuliner Wanasari setiap bulan Juli.';
export const LABELS = { S: 'sesuai sumber', X: 'bertentangan dengan sumber', T: 'tidak ada di sumber', B: 'bias atau prasangka', P: 'sumber palsu' };
export const FIRST = [
  ['K1', 'Pasar Wanasari adalah pasar tertua di Indonesia.', 'T', 'Sumber tidak menyebut pasar tertua.'],
  ['K2', 'Pasar ini dibangun pada tahun 1912 oleh Gubernur Jenderal Belanda.', 'X', 'Dibangun 1921 atas prakarsa para pedagang setempat yang dipimpin Haji Umar Said.'],
  ['K3', 'Pada masa perjuangan kemerdekaan, pasar ini menjadi markas besar tentara.', 'X', 'Pada 1948 menjadi dapur umum bagi para pejuang.'],
  ['K4', 'Pasar Wanasari tidak pernah terbakar.', 'X', 'Pasar lama terbakar pada 1987 dan dibangun kembali pada 1990.'],
  ['K5', 'Dulu penduduk desa sekitar terkenal malas, sehingga pasar baru ramai setelah orang kota datang.', 'B', 'Tidak ada di sumber; prasangka terhadap warga desa.'],
  ['K6', 'Sejak 2015, pasar ini menjadi tempat Festival Kuliner Wanasari setiap bulan Juli.', 'S', 'Sesuai sumber.'],
  ['K7', 'Sumber: buku Jejak Pasar Nusantara (2010), halaman 45.', 'P', 'Buku itu tidak ditemukan di katalog mana pun.'],
];
export const PARTS = [['Pakai hanya informasi dari kutipan itu. Jika ada yang tidak tercantum, tulis "tidak ada di sumber". Paling banyak 80 kata.', 'Batasan'], ['Kamu adalah pemandu museum yang ramah.', 'Peran'], ['Ringkasan ini untuk murid kelas 8 yang baru pertama kali mendengar tentang pasar itu. Ini kutipan buku sejarah daerahnya: (kutipan halaman 12).', 'Konteks'], ['Buat ringkasan sejarah Pasar Wanasari dalam lima poin.', 'Tugas']];
export const PII = [['"Ringkas kutipan buku sejarah berikut."', 'A'], ['"Ini nama lengkap, alamat, dan nomor ponselku. Buatkan surat perkenalan."', 'J'], ['"Ini foto kartu pelajar temanku. Tolong baca datanya."', 'J'], ['"Jelaskan arti kata prakarsa."', 'A'], ['"Kata sandi akunku ini, apakah sudah kuat?"', 'J'], ['"Ini hasil pemeriksaan kesehatan ayahku lengkap dengan nama dan nomor rekam medisnya."', 'J']];

// Prompt cards. 'none' means the part is left out.
export const CARDS = {
  peran: { label: 'Peran', opts: { none: '(tanpa peran)', pemandu: 'Kamu adalah pemandu museum yang ramah.', guru: 'Kamu adalah guru IPS yang sabar.' } },
  tugas: { label: 'Tugas', opts: { cerita: 'ceritakan sejarah pasar wanasari', ringkas: 'Buat ringkasan sejarah Pasar Wanasari dalam lima poin.', soal: 'Buat lima soal pilihan ganda tentang sejarah Pasar Wanasari, lengkap dengan kuncinya.' } },
  konteks: { label: 'Konteks', opts: { none: '(tanpa konteks)', kelas: 'Ini untuk murid kelas 8 yang baru pertama kali mendengar tentang pasar itu.', kutipan: 'Ini untuk murid kelas 8. Ini kutipan buku Sejarah Kabupaten Wanasari halaman 12: "…"' } },
  batasan: { label: 'Batasan', opts: { none: '(tanpa batasan)', kata: 'Paling banyak 80 kata.', ketat: 'Pakai hanya informasi dari kutipan itu. Jika ada yang tidak tercantum, tulis "tidak ada di sumber". Paling banyak 80 kata.' } },
};
export const PRIVATE = { none: '(tanpa catatan)', nama: 'Namaku Nadia Putri Lestari, kelas 8C SMP Negeri 5 Wanasari.', hp: 'Kalau sudah, kirim ke nomorku 0812-3456-7890.' };
export const MASK = { nama: 'Namaku [NAMA], kelas [KELAS] [SEKOLAH].', hp: 'Kalau sudah, kirim ke nomorku [NOMOR].' };

const TRUE_FACTS = ['Pasar Wanasari dibangun tahun 1921 atas prakarsa para pedagang setempat yang dipimpin Haji Umar Said.', 'Tahun 1948, pasar menjadi dapur umum bagi para pejuang.', 'Pasar lama terbakar pada 1987.', 'Pasar dibangun kembali pada 1990.', 'Sejak 2015, pasar menjadi tempat Festival Kuliner Wanasari setiap Juli.'];
const TRUE_QUIZ = ['Pada tahun berapa Pasar Wanasari dibangun? Kunci: 1921.', 'Siapa yang memimpin para pedagang yang memprakarsai pasar itu? Kunci: Haji Umar Said.', 'Pada 1948, pasar menjadi apa? Kunci: dapur umum bagi para pejuang.', 'Kapan pasar lama terbakar? Kunci: 1987.', 'Festival apa yang diadakan setiap Juli sejak 2015? Kunci: Festival Kuliner Wanasari.'];
const FALSE_QUIZ = [['Pada tahun berapa Pasar Wanasari dibangun? Kunci: 1912.', 'X'], ['Siapa yang membangun pasar itu? Kunci: Gubernur Jenderal Belanda.', 'X'], ['Pada masa perjuangan, pasar menjadi apa? Kunci: markas besar tentara.', 'X'], ['Pernahkah pasar itu terbakar? Kunci: tidak pernah.', 'X'], ['Sejak kapan ada Festival Kuliner Wanasari? Kunci: 2015.', 'S']];
const EXTRA = ['Pasar Wanasari juga pasar terbesar di Pulau Jawa.', 'T'];
const SRC_OK = ['Sumber: kutipan Sejarah Kabupaten Wanasari, halaman 12.', 'S'];

// Scripted answer for a combination: { opening, lines: [[text, label]], note }.
export function answer({ peran = 'none', tugas = 'cerita', konteks = 'none', batasan = 'none' }) {
  const opening = { none: '', pemandu: 'Halo, selamat datang di museum! ', guru: 'Baik, anak-anak, mari belajar. ' }[peran];
  const quote = konteks === 'kutipan';
  if (batasan === 'ketat' && !quote) return { opening, lines: [], note: 'Tidak ada kutipan yang diberikan, jadi semua informasinya: "tidak ada di sumber".' };
  let lines;
  if (!quote) lines = tugas === 'soal' ? [...FALSE_QUIZ, FIRST[6].slice(1, 3)] : tugas === 'ringkas' ? [0, 1, 2, 3, 5, 6].map((i) => FIRST[i].slice(1, 3)) : FIRST.map((k) => k.slice(1, 3));
  else {
    lines = (tugas === 'soal' ? TRUE_QUIZ : TRUE_FACTS).map((t) => [t, 'S']);
    if (batasan !== 'ketat') lines.splice(tugas === 'cerita' ? 0 : 2, 0, EXTRA);
    lines.push(SRC_OK);
  }
  return { opening, lines };
}
export const score = (a) => a.lines.filter(([, l]) => l === 'S').length;
export const complete = (c) => c.peran !== 'none' && c.konteks === 'kutipan' && c.batasan === 'ketat';

function sourceBox() {
  return el('div', { class: 'cb-sumber' }, el('b', null, '📖 Sejarah Kabupaten Wanasari, hlm. 12'), el('p', null, `"${SOURCE}"`), el('small', null, 'Katalog perpustakaan: buku Jejak Pasar Nusantara tidak ditemukan di mana pun.'));
}
function chatView(promptText, a, { marks = false } = {}) {
  return el('div', { class: 'cb-layar' }, el('div', { class: 'cb-judul' }, '💬 Teman Belajar', el('small', null, 'chatbot rekaan, jawaban sudah disiapkan')),
    promptText ? el('div', { class: 'cb-saya' }, promptText) : null,
    el('div', { class: 'cb-bot' }, a.opening ? el('p', null, a.opening) : null, a.note ? el('p', null, a.note) : null,
      ...a.lines.map(([t, l]) => el('p', { class: marks ? `cb-kal ${l === 'S' ? 'ok' : 'tidak'}` : '' }, marks ? el('b', null, `${l} `) : null, t))));
}

export default {
  id: 'smp-25-chatbot',
  title: 'Bertanya dengan Cerdas pada Chatbot',
  topic: 'Chatbot KA: halusinasi, bias, memeriksa sumber, menyusun pertanyaan, data pribadi, dan kejujuran',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '💬',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid memeriksa jawaban chatbot dengan sumber tepercaya, mengenali halusinasi dan bias, menyusun pertanyaan dengan Peran, Tugas, Konteks, dan Batasan, menjaga data pribadi, dan memakai chatbot dengan jujur.',
  extraModes: [
    { id: 'chatbot', icon: '💬', label: 'Chatbot Bernaskah', desc: 'Susun pertanyaan dari kartu, lihat jawaban yang sudah disiapkan, cocokkan dengan sumber, dan coba pemeriksa data pribadi', create: createLab },
    { id: 'giliran', icon: '🔁', label: 'Susun Bergiliran', desc: 'Tim bergantian menyusun pertanyaan dari kartu; skor dihitung dari banyak kalimat jawaban yang sesuai sumber', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act chatbot' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) labelRound(wrap, ctx, { done: next });
      else if (r === 1) ask('Apakah nada jawaban chatbot menunjukkan bahwa ia ragu? Apa pelajarannya?', [['Tidak, nadanya yakin walaupun banyak yang salah: kalimat rapi dan yakin bukan bukti kebenaran', true], ['Ya, chatbot selalu memberi tahu kalau ragu'], ['Tidak, jadi jawabannya pasti benar'], ['Ya, karena ada sumber di akhir']]);
      else if (r === 2) ask('Mengapa chatbot bisa menulis kalimat seperti K5 ("penduduk desa terkenal malas")?', [['Ia belajar dari sangat banyak teks buatan manusia, termasuk yang berisi prasangka, lalu bisa mengulangnya', true], ['Karena itu fakta sejarah'], ['Karena Nadia memintanya'], ['Karena chatbot membenci penduduk desa']], 1, null,
        then(() => ask('Mengapa chatbot bisa menyebut buku Jejak Pasar Nusantara yang tidak ada?', [['Ia tidak memeriksa katalog; ia menyusun kalimat yang terdengar seperti sumber sungguhan dari pola (halusinasi)', true], ['Karena bukunya sudah hilang dari perpustakaan'], ['Karena petugas perpustakaan salah mencari'], ['Karena chatbot sengaja berbohong untuk mengerjai Nadia']])));
      else if (r === 3) partsRound(wrap, ctx, { done: next });
      else if (r === 4) buildRound(wrap, ctx, { done: next });
      else if (r === 5) ask('Jawaban untuk pertanyaan baru Nadia: berapa poin yang sesuai sumber? Pada jawaban pertama, berapa kalimat yang sesuai sumber?', [['Baru: 5 dari 5. Pertama: 1 dari 7 (hanya K6)', true], ['Baru: 4 dari 5. Pertama: 3 dari 7'], ['Baru: 5 dari 5. Pertama: 0 dari 7'], ['Keduanya 5']], 1, chatView('', answer({ peran: 'pemandu', tugas: 'ringkas', konteks: 'kutipan', batasan: 'ketat' })),
        then(() => ask('Apakah jawaban kedua pasti benar?', [['Belum tentu: jawaban hanya sebaik sumber yang diberikan, dan chatbot masih bisa salah meringkas, jadi tetap cocokkan dengan sumber', true], ['Pasti benar, karena pertanyaannya lengkap'], ['Pasti benar, karena ada sumbernya'], ['Pasti salah, karena dibuat chatbot']])));
      else if (r === 6) piiRound(wrap, ctx, { done: next });
      else if (r === 7) ask('Aturan kelas yang tepat tentang data pribadi saat memakai chatbot adalah …', [['Jangan mengetik nama lengkap, alamat, nomor, kata sandi, foto dokumen, atau data kesehatan; jangan memasukkan data orang lain; pakai penanda seperti [NAMA]', true], ['Boleh mengetik apa saja karena chatbot bukan manusia'], ['Data teman boleh, asal bukan data sendiri'], ['Kata sandi boleh diketik supaya diperiksa kekuatannya']]);
      else if (r === 8) ask('Tugas: "Tulis sejarah Pasar Wanasari dengan kata-katamu sendiri." Cara jujur memakai chatbot adalah …', [['Untuk memahami kata sulit atau mencari ide kerangka, memeriksa fakta dengan sumber, menulis sendiri, dan menyebutkan bahwa chatbot dipakai', true], ['Menyalin jawaban chatbot lalu mengganti beberapa kata'], ['Menyalin jawaban chatbot tanpa menyebutkannya'], ['Meminta chatbot menulis, lalu mengaku menulis sendiri']]);
      else ask('Tantangan: pertanyaan mana yang paling baik untuk menguji apakah chatbot berani berkata "tidak tahu"?', [['"Ceritakan isi buku Jejak Pasar Nusantara (2010) halaman 45." Buku itu tidak ada, jadi jawaban yang baik adalah mengaku tidak tahu', true], ['"Berapa 2 + 2?"'], ['"Ceritakan sejarah Indonesia."'], ['"Apakah kamu pintar?"']]);
    }
    render();
  },
};

function labelRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'S sesuai sumber · X bertentangan · T tidak ada di sumber · B bias · P sumber palsu');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'cb-samping' },
    el('div', { class: 'cb-kiri' }, el('div', { class: 'cb-saya' }, 'ceritakan sejarah pasar wanasari'), sourceBox()),
    el('div', { class: 'ab-lapisan' }, FIRST.map(([k, t, l, why], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''} ${finished ? 'cb-selesai' : ''}` }, el('span', null, el('b', null, `${k} `), t, finished && l !== 'S' ? el('small', { class: 'cb-benar' }, ` → ${why}`) : null),
      el('div', { class: 'seg' }, Object.keys(LABELS).map((x) => onTap(el('button', { class: `seg-btn ${pick[i] === x ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-l': x, title: LABELS[x] }, x), () => { if (!finished) { pick[i] = x; draw(); } }))))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Nadia bertanya kepada chatbot "Teman Belajar". Periksa setiap kalimat jawabannya dengan sumber tepercaya.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = FIRST.map(([, , l], i) => (pick[i] !== l ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} label belum tepat.`; ctx.mistake(); return; }
    finished = true; draw(); msg.className = 'reveal'; msg.textContent = 'Hanya 1 dari 7 kalimat yang sesuai sumber, padahal semuanya terdengar yakin.'; done();
  }, 'primary')), msg);
}

function partsRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Peran: KA menjadi siapa. Tugas: apa yang dibuat. Konteks: keterangan dan bahan. Batasan: aturan yang dipatuhi.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'ab-lapisan' }, PARTS.map(([t], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, el('b', null, `${'i ii iii iv'.split(' ')[i]}. `), t),
    el('div', { class: 'seg' }, ['Peran', 'Tugas', 'Konteks', 'Batasan'].map((x) => onTap(el('button', { class: `seg-btn ${pick[i] === x ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-p': x }, x), () => { if (!finished) { pick[i] = x; draw(); } })))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pertanyaan baru Nadia punya empat bagian. Beri label setiap bagian.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = PARTS.map(([, p], i) => (pick[i] !== p ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} label belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: i Batasan, ii Peran, iii Konteks, iv Tugas.'; done();
  }, 'primary')), msg);
}

// Card picker shared by the build round, the lab, and the team mode.
function cardPicker(c, redraw, { fixed = {}, priv = null } = {}) {
  const rows = Object.entries(CARDS).filter(([k]) => !fixed[k]).map(([k, { label, opts }]) => el('div', { class: 'cb-kartu-baris' }, el('b', { class: `cb-tag ${k}` }, label),
    el('div', { class: 'seg' }, Object.entries(opts).map(([o, t]) => onTap(el('button', { class: `seg-btn cb-opsi ${c[k] === o ? 'on' : ''}`, type: 'button', 'data-k': k, 'data-o': o }, t), () => { c[k] = o; redraw(); })))));
  if (priv) rows.push(el('div', { class: 'cb-kartu-baris' }, el('b', { class: 'cb-tag pribadi' }, 'Catatan'), el('div', { class: 'seg' }, Object.entries(PRIVATE).map(([o, t]) => onTap(el('button', { class: `seg-btn cb-opsi ${priv.v === o ? 'on' : ''}`, type: 'button', 'data-k': 'catatan', 'data-o': o }, t), () => { priv.v = o; priv.masked = false; redraw(); })))));
  return el('div', { class: 'cb-kartu' }, rows);
}
export const promptText = (c) => ['peran', 'tugas', 'konteks', 'batasan'].map((k) => (c[k] === 'none' ? '' : CARDS[k].opts[c[k]])).filter(Boolean).join(' ');

function buildRound(wrap, ctx, { done }) {
  const c = { peran: 'none', tugas: 'soal', konteks: 'none', batasan: 'none' };
  let sent = null;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Lengkapi keempat bagian, lalu Kirim.');
  const draw = () => stage.replaceChildren(el('div', { class: 'cb-samping' }, cardPicker(c, () => { if (!finished) draw(); }, { fixed: { tugas: true } }), sent ? chatView(promptText(sent), answer(sent), { marks: true }) : el('div', { class: 'cb-layar kosong' }, 'Jawaban akan muncul di sini.')));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Nadia ingin chatbot membuat lima soal latihan tentang Pasar Wanasari. Tugas sudah dipilih; lengkapi Peran, Konteks, dan Batasan.'), stage, el('div', { class: 'kode-baris' }, button('Kirim', () => {
    if (finished) return;
    sent = { ...c };
    const a = answer(sent);
    draw();
    if (!complete(sent)) {
      const miss = [c.peran === 'none' ? 'Peran' : null, c.konteks !== 'kutipan' ? 'Konteks dengan kutipan sumber' : null, c.batasan !== 'ketat' ? 'Batasan "pakai hanya kutipan"' : null].filter(Boolean);
      msg.className = 'reveal bad'; msg.textContent = `Sesuai sumber: ${score(a)} dari ${a.lines.length || 0}. Yang belum: ${miss.join(', ')}.`; ctx.mistake(); return;
    }
    finished = true; msg.className = 'reveal'; msg.textContent = `Sesuai sumber: ${score(a)} dari ${a.lines.length}. Keempat bagian lengkap, dan konteksnya memuat bahan dari sumber tepercaya.`; done();
  }, 'primary')), msg);
}

function piiRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'A: aman diketik. J: jangan.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'ab-lapisan' }, PII.map(([t], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, t),
    el('div', { class: 'seg' }, [['A', 'Aman'], ['J', 'Jangan']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${pick[i] === k ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-k': k }, l), () => { if (!finished) { pick[i] = k; draw(); } })))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Jaga data pribadi. Mana yang aman diketik ke chatbot?'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = PII.map(([, k], i) => (pick[i] !== k ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar. Data pribadi, data orang lain, kata sandi, dan data kesehatan tidak diketik ke chatbot.'; done();
  }, 'primary')), msg);
}

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act chatbot' });
  root.append(wrap);
  const c = { peran: 'none', tugas: 'cerita', konteks: 'none', batasan: 'none' };
  const priv = { v: 'none', masked: false };
  let sent = null;
  let marks = false;
  let warn = null;
  const text = () => [promptText(c), priv.v === 'none' ? '' : priv.masked ? MASK[priv.v] : PRIVATE[priv.v]].filter(Boolean).join(' ');
  function send() {
    if (priv.v !== 'none' && !priv.masked) { warn = priv.v; draw(); return; }
    sent = { c: { ...c }, text: text() }; warn = null; draw();
  }
  function draw() {
    const a = sent ? answer(sent.c) : null;
    wrap.replaceChildren(...[el('div', { class: 'cb-samping' }, cardPicker(c, draw, { priv }),
      el('div', { class: 'cb-kiri' }, a ? chatView(sent.text, a, { marks }) : el('div', { class: 'cb-layar kosong' }, 'Pilih kartu lalu Kirim.'),
        a && a.lines.length ? el('p', { class: 'reveal info' }, `Sesuai sumber: ${score(a)} dari ${a.lines.length} kalimat.`) : null)),
    warn ? el('div', { class: 'cb-peringatan' }, el('b', null, '⚠️ Ada data pribadi rekaan: '), warn === 'nama' ? 'nama lengkap, kelas, dan sekolah.' : 'nomor ponsel.', ' Ganti dengan penanda seperti [NAMA] atau [NOMOR]?',
      el('div', { class: 'kode-baris' }, button('Ganti dengan penanda', () => { priv.masked = true; warn = null; send(); }, 'primary'), button('Batal', () => { warn = null; draw(); }))) : null,
    el('div', { class: 'kode-baris' }, button('Kirim', send, 'primary'), onTap(el('button', { class: `seg-btn ${marks ? 'on' : ''}`, type: 'button' }, '📖 Cocokkan dengan sumber'), () => { marks = !marks; draw(); })),
    marks ? sourceBox() : null].filter(Boolean));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act chatbot' });
  root.append(wrap);
  let n = 2;
  let turn = 0;
  let tugas = 'ringkas';
  const res = [];
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { turn = 0; res.length = 0; tugas = ctx.rand.pick(['cerita', 'ringkas', 'soal']); play(); }, 'primary')));
  }
  function play() {
    const c = { peran: 'none', tugas, konteks: 'none', batasan: 'none' };
    const box = el('div');
    const draw = () => box.replaceChildren(cardPicker(c, draw, { fixed: { tugas: true } }));
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${turn + 1}: susun pertanyaan untuk tugas "${CARDS.tugas.opts[tugas]}". Jawaban tim lain disembunyikan.`), box,
      el('div', { class: 'kode-baris' }, button(turn + 1 < n ? 'Kirim, tim berikutnya ➜' : 'Kirim dan bandingkan ➜', () => { const a = answer(c); res.push({ c: { ...c }, a, s: score(a), bad: a.lines.length - score(a) }); turn++; if (turn < n) play(); else reveal(); }, 'primary')));
  }
  function reveal() {
    const key = (x) => x.s * 10 - x.bad;
    const best = Math.max(...res.map(key));
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Hasil: banyak kalimat yang sesuai sumber (yang salah mengurangi).'),
      el('div', { class: 'ab-lapisan' }, res.map((x, i) => el('div', { class: `ab-lap-baris ${key(x) === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}: ${promptText(x.c)}`), el('b', null, `${x.s} sesuai · ${x.bad} keliru${key(x) === best ? ' 🏆' : ''}`)))),
      el('div', { class: 'kode-baris' }, button('Main lagi', setup, 'primary')));
  }
  setup();
}
