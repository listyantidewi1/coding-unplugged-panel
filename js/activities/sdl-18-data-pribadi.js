// Rahasiaku Aman — SD Lanjut (10–12 tahun), keamanan data pribadi. Sort
// information into green, yellow and red lights, spot the warning signs in
// made-up chat messages, and see why long pass-sentences beat short
// passwords. Nothing typed here is stored or sent anywhere.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

const LIGHTS = { H: { icon: '🟢', name: 'Hijau', desc: 'boleh dibagikan' }, K: { icon: '🟡', name: 'Kuning', desc: 'tanya orang tua dulu' }, M: { icon: '🔴', name: 'Merah', desc: 'rahasia, jangan dibagikan' } };
export const INFO = [
  { no: 1, icon: '🏷️', text: 'Nama panggilan', key: 'H', why: 'Nama panggilan saja tidak cukup untuk menemukanmu.' },
  { no: 2, icon: '⚽', text: 'Hobi, misalnya bermain bola', key: 'H', why: 'Hobi aman dibagikan dan bisa jadi bahan obrolan.' },
  { no: 3, icon: '🍜', text: 'Makanan favorit', key: 'H', why: 'Makanan favorit tidak bisa dipakai untuk mencarimu.' },
  { no: 4, icon: '🏫', text: 'Nama sekolah lengkap', key: 'K', why: 'Bisa dipakai orang untuk mencari tempatmu setiap hari.' },
  { no: 5, icon: '📸', text: 'Foto berseragam dengan nama sekolah', key: 'K', why: 'Menunjukkan wajahmu dan di mana kamu bisa ditemui.' },
  { no: 6, icon: '🏠', text: 'Alamat rumah', key: 'M', why: 'Alamat membahayakan keselamatanmu dan keluargamu.' },
  { no: 7, icon: '📱', text: 'Nomor HP', key: 'M', why: 'Orang asing bisa menghubungimu langsung, tanpa sepengetahuan orang tua.' },
  { no: 8, icon: '🔑', text: 'Kata sandi akun', key: 'M', why: 'Kata sandi adalah kunci akunmu. Tidak untuk siapa pun, termasuk teman.' },
  { no: 9, icon: '🔢', text: 'Kode OTP (kode yang masuk lewat SMS)', key: 'M', why: 'Kode OTP adalah kunci masuk akun. Jangan pernah dibagikan.' },
  { no: 10, icon: '🎂', text: 'Tanggal lahir lengkap', key: 'K', why: 'Bisa dipakai untuk menebak kata sandi atau berpura-pura menjadi dirimu.' },
  { no: 11, icon: '🚪', text: '"Aku sedang sendirian di rumah."', key: 'M', why: 'Memberi tahu orang asing bahwa kamu tidak dijaga. Berbahaya.' },
  { no: 12, icon: '📄', text: 'Foto kartu keluarga', key: 'M', why: 'Berisi data pribadi seluruh keluarga.' },
];

// Made-up chat messages: [text, label] where a label marks a warning sign
// and null marks an ordinary part.
const CHATS = [
  {
    from: 'Hadiah Gim 🎁',
    parts: [['Selamat! ', null], ['Kamu menang 5.000 berlian gratis!', 'Hadiah yang terlalu bagus'], [' ', null], ['Kirim kata sandi akunmu', 'Meminta kata sandi'], [' ke nomor ini ', null], ['dalam 10 menit, kalau tidak hadiahnya hangus.', 'Membuatmu terburu-buru']],
    act: [['Jangan dibalas dan jangan kirim apa pun, beri tahu orang tua, lalu blokir dan laporkan', true], ['Kirim cepat sebelum 10 menit habis'], ['Kirim kata sandi lama saja supaya aman']],
  },
  {
    from: 'Nomor tidak dikenal',
    parts: [['Hai, ', null], ['aku teman ibumu.', 'Mengaku kenal keluargamu'], [' Ibumu minta kamu mengirim ', null], ['foto kartu keluarga', 'Meminta data keluarga'], [' dan ', null], ['kode yang baru masuk ke HP-mu.', 'Meminta kode OTP']],
    act: [['Jangan kirim apa pun; tanyakan langsung kepada ibu dengan menelepon atau bertemu', true], ['Kirim saja karena dia kenal ibu'], ['Kirim kodenya saja tanpa foto']],
  },
  {
    from: 'Teman gim baru',
    parts: [['Kamu anak yang hebat. ', null], ['Jangan bilang orang tuamu, ya. Ini rahasia kita berdua.', 'Meminta merahasiakan dari orang tua'], [' ', null], ['Kamu tinggal di mana?', 'Menanyakan tempat tinggal']],
    act: [['Berhenti membalas, simpan tangkapan layar, dan segera cerita kepada orang tua atau guru', true], ['Simpan rahasianya karena sudah berjanji'], ['Sebutkan nama kampungnya saja']],
  },
];

// ---- Pengukur kalimat sandi ----
const COMMON = ['123456', '12345678', '123456789', '111111', '000000', 'password', 'qwerty', 'abc123', 'iloveyou', 'admin', 'sayang', 'rahasia', '654321'];
const WORDS = ['kucing', 'anjing', 'bola', 'sandi', 'rahasia', 'indonesia', 'sayang', 'merdeka', 'garuda', 'cinta', 'mama', 'papa', 'bunda', 'ayah'];
export function analyze(pw) {
  const sets = { 'huruf kecil': /[a-z]/.test(pw), 'huruf besar': /[A-Z]/.test(pw), angka: /\d/.test(pw), 'tanda baca': /[^a-zA-Z\d]/.test(pw) };
  const pool = (sets['huruf kecil'] ? 26 : 0) + (sets['huruf besar'] ? 26 : 0) + (sets.angka ? 10 : 0) + (sets['tanda baca'] ? 33 : 0);
  const log10 = pw.length && pool ? pw.length * Math.log10(pool) : 0;
  const warn = [];
  const low = pw.toLowerCase();
  if (COMMON.includes(low)) warn.push('Termasuk kata sandi yang paling sering dipakai, jadi paling dulu dicoba.');
  else if (/^(\d)\1+$/.test(pw) || '0123456789'.includes(pw) || '9876543210'.includes(pw)) { if (pw.length >= 3) warn.push('Angka berurutan atau berulang mudah ditebak.'); }
  if (/^[a-z]+\d{2,4}$/i.test(pw)) warn.push('Pola nama atau kata lalu tahun mudah ditebak oleh orang yang mengenalmu.');
  if (WORDS.includes(low)) warn.push('Hanya satu kata yang ada di kamus.');
  if (pw.length && pw.length < 8) warn.push('Terlalu pendek. Pakai paling sedikit 12 karakter, lebih baik kalimat sandi.');
  const level = !pw ? 0 : warn.length || log10 < 8 ? 1 : log10 < 14 ? 2 : 3;
  return { length: pw.length, sets, pool, log10, warn, level };
}
// Big numbers in words.
export function sayNumber(log10) {
  if (log10 < 6) return Math.round(10 ** log10).toLocaleString('id-ID');
  const names = [[12, 'triliun'], [9, 'miliar'], [6, 'juta']];
  if (log10 < 15) { const [e, n] = names.find(([x]) => log10 >= x); return `sekitar ${Math.round(10 ** (log10 - e)).toLocaleString('id-ID')} ${n}`; }
  return `angka 1 diikuti sekitar ${Math.floor(log10)} angka nol`;
}

export default {
  id: 'sdl-18-data-pribadi',
  title: 'Rahasiaku Aman',
  topic: 'Keamanan data pribadi',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🔐',
  source: { name: 'Gagasan pembelajaran keamanan digital', url: 'https://www.csunplugged.org/en/topics/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid memilah informasi yang boleh, perlu izin, dan tidak boleh dibagikan, mengenali tanda bahaya dalam pesan, dan memahami mengapa kalimat sandi yang panjang lebih kuat.',
  extraModes: [
    { id: 'sandi', icon: '🔑', label: 'Pengukur Kalimat Sandi', desc: 'Ketik contoh kata sandi dan lihat panjang, jenis karakter, dan banyak kemungkinannya. Tidak disimpan.', create: createMeter },
    { id: 'kuis', icon: '🚦', label: 'Kuis Dua Tim', desc: 'Kartu muncul di tengah; tim pertama yang mengetuk warna lampu yang tepat mendapat poin', create: createQuiz },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rahasia' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2600); } };
      const ask = (prompt, opts, subject, columns = 1, shuffle = true) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: (shuffle ? ctx.rand.shuffle(opts) : opts).map(([label, correct]) => ({ label, correct })) });
      if (r === 0) lightsRound(wrap, ctx, next);
      else if (r <= 3) chatRound(wrap, ctx, CHATS[r - 1], next);
      else if (r === 4) ask('PIN 4 angka: 10 × 10 × 10 × 10. Berapa banyak kemungkinannya?', [['10.000', true], ['40'], ['1.000'], ['4.000']], null, 4, false);
      else if (r === 5) ask('PIN 6 angka: berapa banyak kemungkinannya?', [['1.000.000', true], ['60'], ['100.000'], ['600.000']], null, 4, false);
      else if (r === 6) ask('Kata sandi 3 huruf kecil: 26 × 26 × 26. Berapa banyak kemungkinannya?', [['17.576', true], ['78'], ['2.600'], ['676']], null, 4, false);
      else if (r === 7) ask('Setiap tambahan satu angka pada PIN, banyak kemungkinannya menjadi …', [['10 kali lipat', true], ['bertambah 10'], ['2 kali lipat'], ['tetap sama']], null, 2, false);
      else if (r === 8) ask('Kata sandi mana yang paling kuat?', [['PayungKodok7SendokPelangi!', true], ['123456'], ['rina2015'], ['kucing']], null, 2);
      else ask('Mengapa "rina2015" lemah?', [
        ['Berisi nama dan tahun yang mudah ditebak oleh orang yang mengenalmu', true], ['Karena ada angkanya'], ['Karena terlalu panjang'],
      ]);
    }
    render();
  },
};

function infoCard(it, attrs = {}) {
  return el('div', { class: 'info-kartu', ...attrs }, el('span', { class: 'info-ikon' }, it.icon), el('span', null, it.text));
}

function lightsRound(wrap, ctx, done) {
  const tray = el('div', { class: 'info-baki' }, ctx.rand.shuffle(INFO).map((it) => infoCard(it, { 'data-drag': it.no })));
  const lamps = Object.entries(LIGHTS).map(([k, l]) => el('div', { class: `lampu lampu-${k}`, 'data-drop': k }, el('b', null, `${l.icon} ${l.name}`), el('small', null, l.desc), el('div', { class: 'lampu-isi' })));
  const info = el('p', { class: 'reveal info' }, 'Seret atau ketuk kartu, lalu taruh di lampu yang sesuai.');
  let left = INFO.length;
  const area = el('div', { class: 'lampu-area' }, tray, el('div', { class: 'lampu-tiang' }, lamps));
  dnd(area, (item, target) => {
    const it = INFO.find((x) => x.no === +item.dataset.drag);
    const lamp = target.closest('[data-drop]');
    if (lamp.dataset.drop !== it.key) { shake(item); ctx.mistake(); info.className = 'reveal bad'; info.textContent = `${it.text}: coba pikirkan lagi. Bisakah orang memakainya untuk mencarimu atau masuk ke akunmu?`; return; }
    item.removeAttribute('data-drag');
    item.classList.add('locked');
    lamp.querySelector('.lampu-isi').append(item);
    ctx.sound.good();
    info.className = 'reveal';
    info.textContent = `${LIGHTS[it.key].icon} ${it.text}: ${it.why}`;
    if (--left === 0) done();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Lampu Lalu Lintas Informasi: kamu mengobrol dengan teman baru di gim daring yang belum pernah kamu temui.'), area, info);
}

function chatRound(wrap, ctx, chat, done) {
  const need = chat.parts.filter(([, lab]) => lab).length;
  let found = 0;
  const signs = el('ul', { class: 'tanda-daftar' });
  const q = el('div');
  const bubble = el('div', { class: 'gelembung' }, chat.parts.map(([text, lab]) => {
    const s = onTap(el('span', { class: 'bagian' }, text), () => {
      if (!text.trim() || s.classList.contains('curiga') || found === need) return;
      if (!lab) { if (!/hebat/.test(text)) { shake(s); ctx.mistake(); } else { signs.append(el('li', { class: 'catatan' }, 'Pujian bisa dipakai untuk membuatmu cepat percaya. Perhatikan permintaannya.')); s.classList.add('pujian'); } return; }
      s.classList.add('curiga');
      found++;
      ctx.sound.good();
      signs.append(el('li', null, `⚠️ ${lab}`));
      if (found === need) choice(q, { prompt: 'Apa yang akan kamu lakukan?', ctx, onRight: done, columns: 1, options: ctx.rand.shuffle(chat.act).map(([label, correct]) => ({ label, correct })) });
    });
    return s;
  }));
  wrap.append(el('p', { class: 'prompt' }, `Tanda Bahaya: ketuk bagian pesan yang mencurigakan (${need} bagian).`),
    el('div', { class: 'hp-layar' }, el('div', { class: 'hp-atas' }, `💬 ${chat.from}`), bubble, el('small', { class: 'small-note' }, 'Pesan rekaan untuk latihan.')), signs, q);
}

function createMeter(root, ctx) {
  const wrap = el('div', { class: 'act rahasia' });
  root.append(wrap);
  const input = el('input', { class: 'txt wide sandi-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'contoh kata sandi', placeholder: 'Ketik contoh, bukan kata sandi aslimu' });
  const out = el('div', { class: 'sandi-hasil' });
  const meter = el('div', { class: 'sandi-meter' }, el('i'));
  const show = () => {
    const a = analyze(input.value);
    meter.className = `sandi-meter level-${a.level}`;
    out.replaceChildren(
      el('div', { class: 'sandi-baris' }, el('b', null, 'Panjang'), el('span', null, `${a.length} karakter`)),
      el('div', { class: 'sandi-baris' }, el('b', null, 'Jenis karakter'), el('span', null, Object.entries(a.sets).map(([k, on]) => el('span', { class: on ? 'ada' : 'tidak' }, `${on ? '✓' : '·'} ${k}`)))),
      el('div', { class: 'sandi-baris' }, el('b', null, 'Banyak kemungkinan'), el('span', null, a.length ? `${a.pool}^${a.length} = ${sayNumber(a.log10)}` : '–')),
      el('p', { class: `reveal ${a.level === 3 ? '' : a.level ? 'bad' : 'info'}` }, ['Ketik contoh kata sandi.', 'Lemah', 'Sedang', 'Kuat: panjang dan sulit ditebak'][a.level]),
      el('ul', { class: 'tanda-daftar' }, a.warn.map((w) => el('li', null, `⚠️ ${w}`))));
  };
  input.addEventListener('input', show);
  const examples = el('div', { class: 'row wrap' }, ['123456', 'rina2015', 'kucing', 'PayungKodok7SendokPelangi!'].map((x) => button(x, () => { input.value = x; show(); }, 'small ghost')),
    button('Hapus', () => { input.value = ''; show(); }, 'small ghost'));
  wrap.append(el('p', { class: 'peringatan' }, '🔒 Pakai contoh saja, jangan kata sandi aslimu. Ketikan tidak disimpan dan tidak dikirim ke mana pun.'), input, examples, meter, out);
  show();
  return { destroy() { input.value = ''; } };
}

// Two teams race to tap the right light for each card.
function createQuiz(root, ctx) {
  const wrap = el('div', { class: 'act rahasia' });
  root.append(wrap);
  const score = [0, 0];
  const deck = [...INFO].sort(() => Math.random() - 0.5);
  let k = 0;
  function show() {
    const it = deck[k % deck.length];
    const locked = [false, false];
    let over = false;
    const msg = el('p', { class: 'reveal info' }, 'Siapa cepat? Ketuk warna lampu yang tepat!');
    const side = (t) => el('div', { class: `kuis-sisi t${t}` }, el('b', null, `Tim ${t + 1}: ${score[t]}`), Object.entries(LIGHTS).map(([key, l]) => {
      const b = onTap(el('button', { class: `kuis-lampu lampu-${key}`, type: 'button' }, l.icon, el('small', null, l.name)), () => {
        if (over || locked[t]) return;
        if (key !== it.key) { locked[t] = true; b.classList.add('salah'); shake(b); ctx.sound.bad(); if (locked[0] && locked[1]) finish(null); return; }
        score[t]++;
        finish(t);
      });
      return b;
    }));
    const finish = (t) => {
      over = true;
      t == null ? ctx.sound.bad() : ctx.sound.good();
      msg.className = 'reveal';
      msg.textContent = `${t == null ? 'Belum ada yang tepat.' : `Tim ${t + 1} dapat poin!`} ${LIGHTS[it.key].icon} ${LIGHTS[it.key].name}: ${it.why}`;
      wrap.querySelector('.kuis-tengah').append(button('Kartu berikutnya ➜', () => { k++; show(); }, 'primary'));
    };
    wrap.replaceChildren(el('div', { class: 'kuis-grid' }, side(0), el('div', { class: 'kuis-tengah' }, el('small', { class: 'small-note' }, `Kartu ${(k % deck.length) + 1} dari ${deck.length}`), infoCard(it, { class: 'info-kartu besar' }), msg), side(1)));
  }
  show();
}
