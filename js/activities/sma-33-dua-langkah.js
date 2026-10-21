// Satu Sandi Tidak Cukup — SMA/SMK (16–18 tahun), keamanan akun dan autentikasi dua langkah.
// Count password possibilities and guessing time, act out an account takeover with
// and without a one-time code, spot "minta kode OTP" scams, compare authentication
// modes, and set up a digital-wallet account. The calculator never takes typed passwords.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const RATE = 1e10;          // tebakan per detik pada berkas curian
export const ONLINE = 20;          // tebakan per jam langsung di aplikasi
export const YEAR = 3.2e7;         // detik per tahun, seperti di lembar kerja
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const two = (x) => Number(x.toPrecision(2)).toLocaleString('id-ID');
export function sci(x) { if (x < 1e7) return fmtNum(Math.round(x)); const e = Math.floor(Math.log10(x)); return `${(x / 10 ** e).toLocaleString('id-ID', { maximumFractionDigits: 1 })} × 10${String(e).split('').map((c) => SUP[c]).join('')}`; }
export function fmtTime(s) {
  if (s < 1) return `${s.toLocaleString('id-ID', { maximumSignificantDigits: 2 })} detik`;
  if (s < 60) return `${Math.round(s)} detik`;
  if (s < 3600) return `${Math.round(s / 60)} menit`;
  if (s < 86400) return `${Math.round(s / 3600)} jam`;
  if (s < YEAR) return `${Math.round(s / 86400)} hari`;
  return `${two(s / YEAR)} tahun`;
}
export const onlineText = (space) => { const h = space / ONLINE; const y = h / 8760; return h < 24 ? `${fmtNum(h, 1)} jam` : `${h < 1e7 ? fmtNum(Math.round(h)) : sci(h)} jam ≈ ${y < 1e7 ? two(y) : sci(y)} tahun`; };
export const KINDS = [['pin', 'Angka saja', 10, 'karakter'], ['kecil', 'Huruf kecil', 26, 'karakter'], ['campur', 'Huruf besar, kecil, dan angka', 62, 'karakter'], ['simbol', 'Ditambah tanda baca', 94, 'karakter'], ['frasa', 'Frasa sandi dari 10.000 kata', 10000, 'kata']];
export const space = (kind, len) => KINDS.find((k) => k[0] === kind)[2] ** len;
export const CRACK = [['a', 'PIN 6 angka', 'pin', 6, '0,0001 detik'], ['b', '8 huruf kecil', 'kecil', 8, '21 detik'], ['c', '8 karakter dari 62 pilihan', 'campur', 8, '6 jam'], ['d', '12 karakter dari 62 pilihan', 'campur', 12, '10.000 tahun'], ['e', 'Frasa sandi 5 kata dari 10.000 kata', 'frasa', 5, '310 tahun']];
const CRACK_OPTS = ['0,0001 detik', '21 detik', '6 jam', '310 tahun', '10.000 tahun'];

export const toyCode = (secret, period) => String((secret * period) % 100).padStart(2, '0');

// [langkah, aktor, teks]; aktor: P penyerang, S server, H ponsel, K Sekar
export const SCEN = {
  A: [['P', 'Penyerang memasukkan surel dan kata sandi Sekar (dari data forum yang bocor)'], ['S', 'Server memeriksa: kata sandi cocok'], ['S', 'Server mengizinkan masuk'], ['P', 'Penyerang memindahkan saldo', 'bobol']],
  B: [['P', 'Penyerang memasukkan surel dan kata sandi Sekar'], ['S', 'Server memeriksa: kata sandi cocok'], ['S', 'Server mengirim kode sekali pakai ke ponsel Sekar dan meminta kode itu'], ['P', 'Penyerang tidak punya kodenya: serangan berhenti', 'aman'], ['H', 'Ponsel Sekar menerima kode yang tidak ia minta: tanda kata sandinya bocor']],
  C: [['P', 'Penyerang memasukkan surel dan kata sandi Sekar'], ['S', 'Server memeriksa: kata sandi cocok'], ['S', 'Server mengirim kode sekali pakai ke ponsel Sekar dan meminta kode itu'], ['P', 'Penyerang menelepon Sekar, mengaku petugas, dan meminta kodenya'], ['K', 'Sekar menyebutkan kodenya', 'pilih'], ['P', 'Penyerang masuk dan memindahkan saldo', 'bobol']],
};
export const ACTORS = [['P', '🕵', 'Penyerang'], ['S', '🖥', 'Server dompet digital'], ['H', '📱', 'Ponsel Sekar'], ['K', '👧', 'Sekar']];

export const MESSAGES = [
  ['1', 'Telepon: "Saya petugas dompet digital. Akun Anda akan diblokir karena ada transaksi mencurigakan. Untuk membatalkan, sebutkan kode 6 angka yang baru masuk ke SMS Anda."', 'P', 'Mengaku petugas, membuat panik dengan ancaman blokir, dan meminta kode. Tutup telepon dan hubungi layanan resmi lewat aplikasi.'],
  ['2', 'SMS: "Kode verifikasi Anda 482913. JANGAN BERIKAN KODE INI KEPADA SIAPA PUN, termasuk petugas kami." (Sekar tidak sedang masuk ke aplikasi.)', 'A', 'Pesannya asli, tetapi kode yang tidak diminta berarti ada orang lain yang memakai kata sandi Sekar. Jangan berikan kode, ganti kata sandi, periksa perangkat.'],
  ['3', 'Pesan dari akun teman: "Eh, aku salah memasukkan nomor, kode OTP-nya terkirim ke ponselmu. Tolong kirimkan ke aku, ya, cepat!"', 'P', 'Minta kode dan terburu-buru; akun teman mungkin dibajak. Jangan kirim; hubungi teman lewat telepon langsung.'],
  ['4', 'Pesan: "Selamat! Anda memenangkan saldo Rp5.000.000. Klik dompet-hadiah.example lalu masukkan nomor ponsel dan kode yang masuk."', 'P', 'Hadiah tidak masuk akal, situs bukan situs resmi, dan minta kode. Jangan klik; hapus dan laporkan.'],
  ['5', 'Penjual di loka pasar: "Transfer langsung ke rekening saya saja, di luar aplikasi, supaya dapat diskon 20%."', 'P', 'Bayar di luar sistem loka pasar dengan iming-iming diskon. Bayar hanya lewat sistem resmi, supaya uang tertahan sampai barang diterima.'],
];
export const AUTH = [['1', 'Kode lewat SMS', 'R'], ['2', 'Aplikasi autentikator', 'P'], ['3', 'Kunci keamanan fisik', 'S'], ['4', 'Biometrik (sidik jari atau wajah)', 'Q']];
export const AUTH_TEXT = { P: 'Kode 6 angka dibuat di ponsel setiap 30 detik dan bisa dipakai tanpa sinyal', Q: 'Mudah dan cepat, tetapi tidak bisa diganti bila bocor, sehingga sebaiknya tetap digabung dengan PIN', R: 'Kode dikirim operator seluler; penipu bisa membajak nomor dengan kartu SIM pengganti', S: 'Benda kecil yang dicolokkan atau ditempelkan ke perangkat dan hanya mau bekerja di situs asli' };
export const ATTACKS = [['1', 'Data situs lain bocor, dan kata sandimu sama', 'R'], ['2', 'Penyerang mencoba miliaran tebakan pada berkas kata sandi yang dicuri', 'T'], ['3', 'Penelepon mengaku petugas dan meminta kode OTP', 'Q'], ['4', 'Situs palsu yang tampak sama persis dengan situs asli', 'U'], ['5', 'Nomor ponselmu dibajak dengan kartu SIM pengganti', 'P'], ['6', 'Ponselmu hilang dalam keadaan tidak terkunci', 'S']];
export const DEFENSES = { P: 'Aplikasi autentikator atau kunci fisik, bukan SMS', Q: 'Tidak pernah memberikan kode, lalu menghubungi layanan resmi lewat aplikasi', R: 'Kata sandi berbeda untuk setiap akun, dibuat dan disimpan manajer kata sandi', S: 'Kunci layar, PIN aplikasi, dan mengeluarkan perangkat dari jarak jauh', T: 'Kata sandi panjang dan acak, misalnya frasa sandi lima kata', U: 'Kunci keamanan fisik, atau memeriksa alamat situs sebelum memasukkan apa pun' };
// [kunci, pengaturan, pilihan[], indeks benar, alasan]
export const SETTINGS = [
  ['a', 'PIN transaksi', ['123456', 'Tanggal lahir: 140309', '6 angka acak'], 2, '123456 dan tanggal lahir mudah ditebak.'],
  ['b', 'Dua langkah saat masuk dari perangkat baru', ['NYALA', 'MATI'], 0, 'Kata sandi yang bocor belum cukup untuk masuk.'],
  ['c', 'Pemberitahuan setiap transaksi', ['NYALA', 'MATI'], 0, 'Transaksi yang tidak dikenal segera ketahuan.'],
  ['d', 'Batas transaksi harian', ['Rp500.000', 'Rp20.000.000'], 0, 'Cukup untuk belanja Sekar dan membatasi kerugian bila dibobol.'],
  ['e', 'Tampilkan saldo di layar kunci', ['NYALA', 'MATI'], 1, 'Orang lain tidak perlu melihat saldo.'],
  ['f', 'Izinkan aplikasi membaca daftar kontak', ['NYALA', 'MATI'], 1, 'Tidak diperlukan untuk kebutuhan Sekar.'],
  ['g', 'Perangkat tidak dikenal, masuk 3 hari lalu', ['Biarkan', 'Keluarkan, lalu ganti kata sandi'], 1, 'Ada orang lain yang memegang akunnya.'],
  ['h', 'Tempat menyimpan kata sandi', ['Catatan biasa di ponsel', 'Manajer kata sandi'], 1, 'Catatan biasa bisa dibaca siapa pun yang memegang ponsel.'],
];

// --- view pieces ---
function rowsChoose(wrap, ctx, { prompt, rows, done, info, cls = '', sorted = false }) {
  // rows: [k, label, options[], right, explain]
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `dl-baris-baris ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, opts, a, w]) => el('div', { class: `dl-baris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, a) : el('div', { class: 'seg' }, (sorted ? opts : opts).map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, v), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', `${t}: belum tepat.`); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', w || 'Tepat.'); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1600);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function pairRound(wrap, ctx, { prompt, left, texts, done, finalMsg, hint }) {
  const got = {}; let sel = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu kiri, lalu pasangannya di kanan.');
  const host = el('div', { class: 'dl-pasang' });
  const letters = ctx.rand.shuffle(Object.keys(texts));
  const draw = () => host.replaceChildren(el('div', { class: 'dl-kol' }, left.map(([k, n, a]) => onTap(el('button', { class: `dl-item ${sel === k ? 'pilih' : ''} ${k in got ? 'beres' : ''}`, type: 'button' }, el('b', null, k), el('span', null, n), k in got ? el('em', null, `→ ${a}`) : null), () => { if (!(k in got)) { sel = k; draw(); } }))),
    el('div', { class: 'dl-kol' }, letters.map((L) => onTap(el('button', { class: `dl-item ${Object.values(got).includes(L) ? 'beres' : ''}`, type: 'button' }, el('b', null, L), el('span', null, texts[L])), () => {
      if (!sel || Object.values(got).includes(L)) return; const want = left.find((p) => p[0] === sel)[2];
      if (L !== want) { ctx.mistake(); shake(host); say(msg, 'bad', hint); return; }
      got[sel] = L; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === left.length) { say(msg, '', finalMsg); done(); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
}

// Login simulation: lanes for the four actors, one step at a time.
function makeSim(ctx, { scen, onEnd, choose = true }) {
  const steps = SCEN[scen]; let i = 0; let ended = false; let period = 1;
  const lanes = Object.fromEntries(ACTORS.map(([k, ic, n]) => [k, el('div', { class: `dl-aktor a-${k}` }, el('span', { class: 'dl-ikon' }, ic), el('b', null, n), el('div', { class: 'dl-isi' }))]));
  const log = el('ol', { class: 'dl-log' });
  const otp = el('div', { class: 'dl-otp' });
  const drawOtp = () => otp.replaceChildren(el('span', null, `Periode ${period}`), el('b', null, toyCode(37, period)), el('small', null, 'kode mainan = dua angka terakhir dari 37 × periode'));
  const root = el('div', { class: 'dl-sim' }, el('div', { class: 'dl-panggung' }, ...ACTORS.map(([k]) => lanes[k])), el('div', { class: 'dl-bawah' }, log, otp));
  const ctrl = el('div', { class: 'kode-baris' });
  const end = (kind, text) => { ended = true; root.classList.add(kind); log.append(el('li', { class: `akhir ${kind}` }, text)); onEnd?.(kind); ctrl.replaceChildren(); };
  function step() {
    if (ended || i >= steps.length) return;
    const [a, text, flag] = steps[i];
    for (const L of Object.values(lanes)) L.classList.remove('aktif');
    lanes[a].classList.add('aktif');
    if (flag === 'pilih' && choose) {
      ctrl.replaceChildren(button('Sekar menyebutkan kodenya', () => { log.append(el('li', null, text)); lanes.K.querySelector('.dl-isi').textContent = `"${toyCode(37, period)}"`; i++; ctx.sound.bad(); step(); }), button('Sekar menutup telepon', () => { log.append(el('li', null, 'Sekar menutup telepon dan menghubungi layanan resmi lewat aplikasi')); ctx.sound.good(); end('aman', 'Serangan gagal: kode tidak pernah diberikan.'); }, 'primary'));
      return;
    }
    log.append(el('li', null, text));
    if (a === 'S' && /kode/.test(text)) { drawOtp(); lanes.H.querySelector('.dl-isi').textContent = `🔔 kode ${toyCode(37, period)}`; }
    if (a === 'P' && i === 0) lanes.P.querySelector('.dl-isi').textContent = 'sekar@… / ••••••••';
    i++;
    if (flag === 'bobol') { ctx.sound.bad(); end('bobol', 'Akun dibobol: saldo dipindahkan.'); return; }
    if (flag === 'aman' && i >= steps.length) { end('aman', 'Serangan gagal.'); return; }
    if (i >= steps.length) { end('aman', 'Serangan gagal di langkah 4: penyerang tidak punya kodenya. Kode yang tidak diminta adalah tanda bahaya.'); return; }
    ctrl.replaceChildren(button(`▶ Langkah ${i + 1}`, step, 'primary'));
  }
  ctrl.replaceChildren(button('▶ Langkah 1', step, 'primary'));
  otp.replaceChildren(el('small', null, 'Kode sekali pakai muncul saat server memintanya.'));
  return { el: el('div', { class: 'dl-sim-wadah' }, root, ctrl), next: () => { period++; if (otp.querySelector('b')) drawOtp(); } };
}

function settingsScreen(ctx, { check = true, onDone } = {}) {
  const pick = {}; let locked = false;
  const msg = el('p', { class: 'reveal info' }, 'Pilih pengaturan untuk Sekar, yang setiap hari belanja paling banyak Rp100.000.');
  const meter = el('div', { class: 'dl-meter' });
  const host = el('div', { class: 'dl-setelan' });
  const score = () => SETTINGS.filter((s) => pick[s[0]] === s[3]).length;
  const draw = () => {
    const sc = score();
    meter.replaceChildren(el('span', null, 'Skor keamanan'), el('div', { class: 'dl-batang' }, el('i', { style: { width: `${(sc / SETTINGS.length) * 100}%` }, class: sc === SETTINGS.length ? 'penuh' : '' })), el('b', null, `${sc}/${SETTINGS.length}`));
    host.replaceChildren(...SETTINGS.map(([k, t, opts, right, why]) => el('div', { class: `dl-set ${locked && pick[k] !== right ? 'salah' : ''}` }, el('span', null, `${k}. ${t}`), el('div', { class: 'seg' }, opts.map((o, j) => onTap(el('button', { class: `seg-btn ${pick[k] === j ? 'on' : ''}`, type: 'button' }, o), () => { if (locked) return; pick[k] = j; ctx.sound.tap(); draw(); }))), locked ? el('small', null, why) : null)));
  };
  draw();
  const save = button('Simpan pengaturan', () => {
    if (Object.keys(pick).length < SETTINGS.length) { say(msg, 'bad', 'Masih ada pengaturan yang belum dipilih.'); shake(host); return; }
    const wrong = SETTINGS.filter((s) => pick[s[0]] !== s[3]);
    if (check && wrong.length) { ctx.mistake(); shake(host); say(msg, 'bad', `${wrong.length} pengaturan belum paling aman: ${wrong.map((w) => w[0]).join(', ')}.`); return; }
    locked = true; save.disabled = true; draw(); ctx.sound.good(); say(msg, wrong.length ? 'bad' : '', wrong.length ? `Skor ${score()}/8. Baca alasan di baris merah.` : 'Skor 8/8: akun Sekar terlindungi.'); onDone?.();
  }, 'primary');
  return el('div', { class: 'dl-ponsel-wadah' }, el('div', { class: 'dl-ponsel' }, el('b', { class: 'dl-ponsel-judul' }, '⚙ Pengaturan Keamanan · Dompet Digital (rekaan)'), meter, host), save, msg);
}

export default {
  id: 'sma-33-dua-langkah',
  title: 'Satu Sandi Tidak Cukup',
  topic: 'Keamanan akun: kekuatan kata sandi, manajer kata sandi, autentikasi dua langkah, modus minta kode OTP, dan dompet digital',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Lindungi dompet digital Sekar setelah kata sandinya bocor dari forum permainan: hitung kekuatan kata sandi, peragakan pencurian akun, kenali modus minta kode OTP, dan atur keamanan akunnya.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Kekuatan Sandi', desc: 'Pilih jenis karakter dan panjang (tanpa mengetik kata sandi) untuk melihat banyak kemungkinan dan waktu menebaknya', create: createCalc },
    { id: 'simulasi', icon: '📲', label: 'Simulasi Masuk Akun', desc: 'Jalankan skenario A, B, dan C langkah demi langkah; di skenario C pilih apakah Sekar menyebutkan kodenya', create: createSim },
    { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan Akun', desc: 'Layar pengaturan dompet digital rekaan dengan delapan pengaturan dan skor keamanan', create: createSettings },
    { id: 'giliran', icon: '⚔️', label: 'Serangan dan Pertahanan', desc: 'Tim penyerang memilih kartu serangan, tim pembela memilih pertahanan dalam 20 detik; peran bergantian', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act dua-langkah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Berkas kata sandi dicuri: 10 miliar (10¹⁰) tebakan per detik. Berapa lama mencoba semuanya?', rows: CRACK.map(([k, t, kind, len, ans]) => [k, `${k}. ${t} · ${sci(space(kind, len))} kemungkinan`, CRACK_OPTS, ans, `${t}: ${sci(space(kind, len))} : 10¹⁰ ≈ ${ans}.`]), info: 'Waktu = banyak kemungkinan : 10¹⁰ detik. 1 jam = 3.600 detik; 1 tahun ≈ 3,2 × 10⁷ detik.', cls: 'waktu', done: next });
      else if (r === 1) ask('Kini penyerang menebak langsung di aplikasi: hanya 20 tebakan per jam karena akun dikunci setiap 5 kali salah. Berapa lama untuk semua PIN 6 angka?', [['50.000 jam, kira-kira 5,7 tahun', true], ['0,0001 detik'], ['50 jam'], ['20 jam']], 1, null,
        then(() => ask('"Wanasari2009!" panjangnya 13 karakter. Mengapa tetap lemah?', [['Polanya mudah ditebak: nama tempat, tahun, lalu tanda seru; penyerang mencoba pola seperti ini lebih dulu', true], ['Karena terlalu panjang'], ['Karena memakai huruf besar'], ['Tidak lemah; 13 karakter pasti aman']], 1, null,
          then(() => ask('Sekar punya 15 akun. Mengapa manajer kata sandi lebih aman, dan kata sandi mana yang harus paling kuat?', [['Setiap akun mendapat kata sandi acak yang berbeda; yang harus paling kuat adalah kata sandi utama manajer itu (frasa sandi panjang + dua langkah)', true], ['Karena manajer kata sandi memakai satu kata sandi untuk semua akun'], ['Kata sandi dompet digital saja yang perlu kuat'], ['Manajer kata sandi tidak lebih aman']])))));
      else if (r === 2) {
        const table = () => el('table', { class: 'dl-tabel' }, el('tr', null, el('th', null, 'Langkah'), el('th', null, 'A: tanpa dua langkah'), el('th', null, 'B: dua langkah'), el('th', null, 'C: dua langkah, Sekar tertipu')), [0, 1, 2, 3, 4, 5].map((j) => el('tr', null, el('td', null, String(j + 1)), ['A', 'B', 'C'].map((s) => el('td', null, SCEN[s][j]?.[1] || '')))));
        const finalAsk = then(() => ask('Pada skenario mana serangan berhasil, dan di langkah berapa skenario B dihentikan?', [['Berhasil di A dan C; B dihentikan di langkah 4 karena penyerang tidak punya kodenya', true], ['Berhasil di A saja; B dihentikan di langkah 2'], ['Berhasil di semua skenario'], ['Berhasil di B dan C; A dihentikan di langkah 3']], 1, table()));
        const showB = then(() => { const s2 = makeSim(ctx, { scen: 'B', onEnd: () => setTimeout(finalAsk, 1800) }); wrap.append(el('p', { class: 'prompt' }, 'Skenario B: dengan dua langkah'), s2.el); });
        const s1 = makeSim(ctx, { scen: 'A', onEnd: () => setTimeout(showB, 1800) });
        wrap.append(el('p', { class: 'prompt' }, 'Skenario A: tanpa dua langkah'), s1.el);
      }
      else if (r === 3) ask('Skenario B: apa yang harus segera dilakukan Sekar setelah menerima kode yang tidak ia minta?', [['Tidak memberikan kode itu kepada siapa pun, mengganti kata sandi di semua akun yang memakai sandi sama, dan memeriksa perangkat yang sedang masuk', true], ['Mengirim kode itu ke nomor pengirim untuk memastikan'], ['Mengabaikannya saja'], ['Mematikan ponsel selama sehari']], 1, null,
        then(() => ask('Mengapa kebocoran data di forum permainan bisa membuat dompet digital Sekar ikut dibobol?', [['Penyerang mencoba pasangan surel dan kata sandi yang bocor di situs lain, dan Sekar memakai kata sandi yang sama', true], ['Forum permainan dan dompet digital milik perusahaan yang sama'], ['Karena dompet digital tidak punya kata sandi'], ['Karena ponsel Sekar terkena virus dari forum']])));
      else if (r === 4) rowsChoose(wrap, ctx, { prompt: 'Kode sekali pakai mainan: rahasia 37, kode = dua angka terakhir dari 37 × nomor periode', rows: [1, 2, 3].map((p) => [String(p), `Periode ${p}: 37 × ${p} = ${37 * p}`, ['11', '37', '74', '111'], toyCode(37, p), `Periode ${p}: kode ${toyCode(37, p)}.`]), info: 'Setiap 30 detik disebut satu periode.', cls: 'otp',
        done: then(() => ask('Penyerang mencuri kode periode 2 (74). Bisakah ia memakainya pada periode 3? Mengapa aplikasi sungguhan memakai rumus yang jauh lebih rumit?', [['Tidak bisa, kodenya sudah berganti; rumus mainan terlalu mudah karena dari kode periode 1 saja rahasianya (37) langsung ketahuan', true], ['Bisa, kode berlaku selamanya'], ['Tidak bisa, karena 74 lebih besar dari 11'], ['Bisa, asal dipakai cepat-cepat']])) });
      else if (r === 5) rowsChoose(wrap, ctx, { prompt: 'Modus "minta kode OTP": asli (A) atau penipuan (P)?', rows: MESSAGES.map(([k, t, a, w]) => [k, `${k}. ${t}`, ['A', 'P'], a, w]), info: 'Perhatikan siapa yang meminta, apa yang diminta, dan seberapa terburu-buru.', cls: 'pesan',
        done: then(() => ask('Aturan satu kalimat mana yang menjawab pesan 1, 3, dan 4?', [['Kode OTP, PIN, dan kata sandi tidak boleh diberikan kepada siapa pun, termasuk orang yang mengaku petugas resmi', true], ['Kode boleh diberikan kepada teman dekat'], ['Kode boleh diberikan kepada petugas yang menelepon'], ['Kode boleh dimasukkan di situs hadiah resmi']])) });
      else if (r === 6) pairRound(wrap, ctx, { prompt: 'Moda autentikasi: pasangkan dengan penjelasannya', left: AUTH, texts: AUTH_TEXT, finalMsg: '1–R, 2–P, 3–S, 4–Q.', hint: 'Mana yang dikirim operator, dibuat di ponsel, berupa benda kecil, atau memakai tubuh?', done: next });
      else if (r === 7) ask('Urutkan dari yang paling tahan terhadap situs palsu', [['Kunci keamanan fisik, aplikasi autentikator, kode SMS', true], ['Kode SMS, aplikasi autentikator, kunci keamanan fisik'], ['Aplikasi autentikator, kode SMS, kunci keamanan fisik'], ['Ketiganya sama kuat']], 1, null,
        then(() => ask('Moda apa yang cocok untuk nenek dengan ponsel sederhana, dan untuk bendahara OSIS yang mengelola dana kegiatan?', [['Nenek: kode SMS (tetap jauh lebih aman daripada tanpa dua langkah) · Bendahara: kunci keamanan fisik atau aplikasi autentikator', true], ['Nenek: kunci fisik · Bendahara: tanpa dua langkah'], ['Keduanya cukup memakai kata sandi saja'], ['Nenek: tanpa dua langkah · Bendahara: kode SMS']])));
      else if (r === 8) { wrap.append(el('p', { class: 'prompt' }, 'Mengatur akun dompet digital Sekar')); wrap.append(settingsScreen(ctx, { onDone: () => setTimeout(next, 1500) })); }
      else pairRound(wrap, ctx, { prompt: 'Serangan dan pertahanan: pasangkan', left: ATTACKS, texts: DEFENSES, finalMsg: '1–R, 2–T, 3–Q, 4–U, 5–P, 6–S.', hint: 'Pertahanan mana yang langsung menghentikan serangan itu?', done: next });
    }
    render();
  },
};

function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act dua-langkah' });
  root.append(wrap);
  let kind = 'campur'; let len = 8;
  function draw() {
    const K = KINDS.find((k) => k[0] === kind); const n = space(kind, len); const off = n / RATE;
    const lg = Math.log10(Math.max(off, 1e-4)) + 4; const full = Math.log10(YEAR * 1e6) + 4;
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Kalkulator kekuatan sandi'),
      el('p', { class: 'dl-catatan' }, '🔒 Kalkulator ini tidak menerima kata sandi yang diketik. Jangan pernah mengetik kata sandi aslimu di aplikasi mana pun selain aplikasi resminya.'),
      el('div', { class: 'seg dl-jenis' }, KINDS.map(([k, l, c]) => onTap(el('button', { class: `seg-btn ${k === kind ? 'on' : ''}`, type: 'button' }, `${l} (${fmtNum(c)})`), () => { kind = k; len = k === 'frasa' ? 5 : k === 'pin' ? 6 : 8; ctx.sound.tap(); draw(); }))),
      el('div', { class: 'dl-panjang' }, button('−', () => { if (len > 1) { len--; draw(); } }), el('b', null, `${len} ${K[3]}`), button('+', () => { if (len < (kind === 'frasa' ? 8 : 24)) { len++; draw(); } })),
      el('div', { class: 'dl-hasil' },
        el('div', null, el('span', null, 'Banyak kemungkinan'), el('b', null, `${fmtNum(K[2])}${SUP_POW(len)} ≈ ${sci(n)}`)),
        el('div', null, el('span', null, 'Berkas curian (10¹⁰ tebakan/detik)'), el('b', { class: off > YEAR * 100 ? 'kuat' : off < 86400 ? 'lemah' : 'sedang' }, fmtTime(off)), el('div', { class: 'dl-batang' }, el('i', { style: { width: `${Math.min(100, Math.max(2, (lg / full) * 100))}%` } }))),
        el('div', null, el('span', null, 'Langsung di aplikasi (20 tebakan/jam)'), el('b', null, onlineText(n)))),
      el('small', { class: 'dl-catatan' }, 'Waktu untuk mencoba semua kemungkinan; rata-rata penyerang menemukannya sekitar separuh waktu itu. Kata sandi berpola (nama, tahun, tanda seru) ditebak jauh lebih cepat.'));
  }
  draw();
}
const SUP_POW = (n) => String(n).split('').map((c) => SUP[c]).join('');

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act dua-langkah' });
  root.append(wrap);
  let scen = 'A';
  function draw() {
    const sim = makeSim(ctx, { scen });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Simulasi masuk akun'), el('div', { class: 'seg' }, [['A', 'A · tanpa dua langkah'], ['B', 'B · dengan dua langkah'], ['C', 'C · dua langkah, ada penelepon']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${k === scen ? 'on' : ''}`, type: 'button' }, l), () => { scen = k; draw(); }))), sim.el, el('div', { class: 'kode-baris' }, button('⏱ Periode berikutnya (30 detik)', () => { sim.next(); ctx.sound.tap(); }), button('↺ Ulang', draw)));
  }
  draw();
}

function createSettings(root, ctx) {
  const wrap = el('div', { class: 'act dua-langkah' });
  root.append(wrap);
  const go = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pengaturan akun dompet digital'), settingsScreen(ctx, { check: false, onDone: () => wrap.append(el('div', { class: 'kode-baris' }, button('↺ Ulangi', go))) }));
  go();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act dua-langkah' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2); let timer = null;
    function turn() {
      clearInterval(timer);
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Serangan dan pertahanan selesai', pts, again: () => pickTeams(wrap, 'Serangan dan Pertahanan', start) }); return; }
      const att = k % nT; const def = (k + 1) % nT;
      const msg = el('p', { class: 'reveal info' }, `Tim ${att + 1} (penyerang): pilih satu kartu serangan.`);
      const area = el('div', { class: 'dl-kol' });
      wrap.replaceChildren(scoreBar(pts, def), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${att + 1} menyerang, Tim ${def + 1} bertahan`), area, msg);
      area.replaceChildren(...ATTACKS.map(([n, t, d]) => onTap(el('button', { class: 'dl-item serang', type: 'button' }, el('b', null, n), el('span', null, t)), () => defend([n, t, d]))));
      function defend(a) {
        let left = 20; let done = false;
        const clock = el('b', { class: 'dl-jam' }, '20');
        const finish = (L) => {
          if (done) return; done = true; clearInterval(timer);
          const ok = L === a[2]; if (ok) pts[def] += 2; else pts[att] += 1; ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', `${ok ? `Pertahanan tepat: Tim ${def + 1} +2.` : `${L ? 'Belum tepat' : 'Waktu habis'}: Tim ${att + 1} +1.`} Pertahanan untuk "${a[1]}": ${DEFENSES[a[2]]}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, def)); k++; setTimeout(turn, 3600);
        };
        area.replaceChildren(el('div', { class: 'dl-item serang pilih' }, el('b', null, a[0]), el('span', null, a[1])), clock, ...ctx.rand.shuffle(Object.keys(DEFENSES)).map((L) => onTap(el('button', { class: 'dl-item', type: 'button' }, el('b', null, L), el('span', null, DEFENSES[L])), () => finish(L))));
        say(msg, '', `Tim ${def + 1} (pembela): pilih pertahanan dalam 20 detik.`);
        timer = setInterval(() => { if (!wrap.isConnected) { clearInterval(timer); return; } left--; clock.textContent = String(left); if (left <= 0) finish(null); }, 1000);
      }
    }
    turn();
  }
  pickTeams(wrap, 'Serangan dan Pertahanan', start);
}
