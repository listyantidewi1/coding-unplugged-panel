// Satu Sandi Tidak Cukup — SMA/SMK (16–18 tahun), keamanan akun dan autentikasi dua langkah.
// Count password possibilities and guessing time, act out an account takeover with
// and without a one-time code, spot "minta kode OTP" scams, compare authentication
// modes, and set up a digital-wallet account. The calculator never takes typed passwords.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

// ---------- Jaga Dompet Sekar: the ten missions ----------
export const ONLINE_CHIPS = ['10⁶', '20', '50.000', '5,7', '10¹⁰', '0,0001', '200'];
export const ONLINE_WANT = ['10⁶', '20', '50.000', '5,7'];
export const TOY_CHIPS = ['37', '74', '11', '111', '47', '03'];
export const PODIUM = ['3', '2', '1'];
export const HABITS = [['h1', '🤐 Kode OTP, PIN, dan sandi tidak diberikan kepada siapa pun', true], ['h2', '🔐 Nyalakan dua langkah', true], ['h3', '🗝 Sandi berbeda untuk setiap akun, simpan di manajer kata sandi', true], ['h4', '🔍 Periksa alamat situs sebelum masuk', true], ['h5', '🔔 Pemberitahuan transaksi menyala', true], ['x1', '📝 Simpan PIN di catatan ponsel', false, 'Catatan biasa bisa dibaca siapa pun yang memegang ponsel.'], ['x2', '🎂 Pakai tanggal lahir sebagai PIN', false, 'Tanggal lahir mudah ditebak.'], ['x3', '🎁 Klik tautan hadiah untuk memastikan', false, 'Tautan hadiah adalah jalan masuk penipuan.']];
export const GRANNY = [['tutup', '📵 Tutup telepon', 0], ['buka', '📱 Buka aplikasi resmi sendiri', 1], ['cek', '🔍 Periksa transaksi, lalu ganti sandi bila perlu', 2], ['sebut', '🔢 Sebutkan kode supaya cepat selesai', -1, 'Kode tidak boleh diberikan kepada siapa pun, termasuk "petugas".'], ['balik', '☎️ Telepon balik nomor si penelepon', -1, 'Nomor itu milik penipu; hubungi layanan lewat aplikasi resmi.']];
const HEAD33 = {
  hitung: ['Hitung Waktu Bobol', 'Setel kalkulator sesuai kartu sandi (tanpa mengetik sandi), lalu uji di mesin pembobol.'],
  langsung: ['Tebakan Langsung', 'Di aplikasi penyerang hanya bisa 20 tebakan per jam. Seret angka ke rumus.'],
  drama: ['Drama Pencurian Akun', 'Jalankan skenario A dan B, lalu tunjuk langkah tempat serangan B berhenti.'],
  dramaC: ['Penelepon Misterius', 'Skenario C: apa yang dilakukan Sekar? Lalu hitung kode sekali pakai mainan.'],
  telepon: ['Telepon Berdering', 'Lima pesan masuk. Asli atau penipuan? Penipuan yang dipercaya menguras saldo.'],
  gembok: ['Pilih Gembok', 'Seret setiap moda ke penjelasannya, lalu susun podium yang paling tahan situs palsu.'],
  benteng: ['Atur Benteng Akun', 'Setiap pengaturan yang tepat menambah satu bata benteng.'],
  duel1: ['Duel Serangan I', 'Seret kartu pertahanan ke serangan sebelum waktunya habis.'],
  duel2: ['Duel Serangan II', 'Tiga serangan lagi. Seret pertahanannya sebelum waktunya habis.'],
  bos: ['Uji Nenek', 'Susun poster lima kebiasaan aman, lalu bantu Nenek menghadapi penelepon.'],
};
const msg33 = (t) => el('p', { class: 'reveal info' }, t);
function wallet() {
  let n = 300000; const b = el('b', null, ''); const node = el('div', { class: 'dl33-dompet' }, el('span', null, '👛 Saldo Sekar'), b);
  const draw = () => { b.textContent = `Rp${fmtNum(n)}`; node.classList.toggle('tipis', n < 200000); };
  draw();
  return { node, rob() { if (n > 0) n -= 50000; draw(); node.classList.remove('goyang'); void node.offsetWidth; node.classList.add('goyang'); } };
}

// Misi 1: build each password on the calculator, then run the cracking machine.
function calcRound(area, ctx, { oops, done }) {
  const msg = msg33('Berkas kata sandi curian diuji 10 miliar (10¹⁰) tebakan per detik.');
  let i = 0; let kind = 'pin'; let len = 4; let over = false;
  const cards = CRACK.map(([k, t]) => el('div', { class: 'dl33-sandi', 'data-k': k }, el('b', null, `${k}.`), el('span', null, t), el('em', { class: 'dl33-cap' })));
  const calc = el('div', { class: 'dl33-kalku' });
  const draw = () => {
    const K = KINDS.find((x) => x[0] === kind); const n = space(kind, len);
    cards.forEach((c, j) => c.classList.toggle('aktif', j === i && !over));
    fill(calc, el('b', { class: 'dl33-kalku-judul' }, '🧮 Kalkulator kekuatan sandi'),
      el('div', { class: 'dl33-jenis' }, KINDS.map(([k, l, c]) => onTap(el('button', { class: `dl33-pil ${k === kind ? 'on' : ''}`, type: 'button', 'data-k': k }, el('span', null, l), el('small', null, fmtNum(c))), () => { if (over) return; kind = k; ctx.sound.tap(); draw(); }))),
      el('div', { class: 'dl33-panjang' }, onTap(el('button', { class: 'dl33-pil', type: 'button', 'data-d': '-1' }, '−'), () => { if (!over && len > 1) { len--; ctx.sound.tap(); draw(); } }), el('b', { 'data-len': len }, `${len} ${K[3]}`), onTap(el('button', { class: 'dl33-pil', type: 'button', 'data-d': '1' }, '+'), () => { if (!over && len < 16) { len++; ctx.sound.tap(); draw(); } })),
      el('div', { class: 'dl33-layar' }, el('span', null, `${fmtNum(K[2])} pilihan, ${len} ${K[3]}`), el('b', null, `${sci(n)} kemungkinan`)),
      button('💥 Uji di mesin pembobol', test, 'primary'));
  };
  function test() {
    if (over) return; const [k, t, wk, wl, ans] = CRACK[i];
    if (kind !== wk || len !== wl) { oops(); shake(calc); say(msg, 'bad', `Kalkulator belum sesuai kartu ${k}: "${t}".`); return; }
    const c = cards[i]; c.querySelector('.dl33-cap').textContent = `⏱ ${fmtTime(space(wk, wl) / RATE)}`; c.classList.add('beres', /tahun/.test(ans) ? 'kuat' : /detik/.test(ans) ? 'lemah' : 'sedang'); ctx.sound.tap(); i++;
    if (i < CRACK.length) { say(msg, '', `${t}: ${ans}.`); draw(); return; }
    over = true; draw(); say(msg, '', 'Panjang lebih penting daripada rumit: 12 karakter acak bertahan 10.000 tahun, dan frasa 5 kata 310 tahun.'); done();
  }
  draw();
  area.append(el('div', { class: 'dl33-dua' }, el('div', { class: 'dl33-sandi-sandi' }, cards), calc), msg);
}

// Formula with blanks, filled left to right from a chip tray.
function formulaRound(area, ctx, { oops, msg, lines, chips, want, hints, done }) {
  let k = 0; const blanks = [];
  const mk = () => { const b = el('span', { class: 'dl33-celah', 'data-drop': String(blanks.length) }, '?'); blanks.push(b); return b; };
  const rows = el('div', { class: 'dl33-rumus' }, lines.map((parts) => el('div', null, parts.map((p) => (p === '_' ? mk() : p)))));
  const tray = el('div', { class: 'dl33-angka-angka' }, ctx.rand.shuffle(chips.slice()).map((c) => el('div', { class: 'dl33-angka', 'data-drag': c }, c)));
  const host = el('div', { class: 'dl33-papan' }, rows, tray);
  dnd(host, (chip, blank) => {
    if (k >= want.length) return;
    if (+blank.dataset.drop !== k) { say(msg, 'info', 'Isi dari kiri ke kanan.'); return; }
    if (chip.dataset.drag !== want[k]) { oops(); shake(chip); say(msg, 'bad', hints[k]); return; }
    blank.textContent = want[k]; blank.classList.add('isi'); chip.remove(); ctx.sound.tap(); k++;
    if (k < want.length) { say(msg, '', 'Tepat.'); return; }
    done();
  });
  area.append(host, msg);
}

function onlineRound(area, ctx, { oops, done }) {
  const msg = msg33('Akun dikunci 15 menit setiap 5 kali salah, jadi hanya sekitar 20 tebakan per jam.');
  formulaRound(area, ctx, { oops, msg, chips: ONLINE_CHIPS, want: ONLINE_WANT,
    lines: [['PIN 6 angka: ', '_', ' kemungkinan'], ['÷ ', '_', ' tebakan per jam = ', '_', ' jam'], ['50.000 jam ÷ 8.760 jam setahun ≈ ', '_', ' tahun']],
    hints: ['Ada berapa PIN 6 angka? 10 × 10 × 10 × 10 × 10 × 10.', 'Berapa tebakan per jam langsung di aplikasi?', '1.000.000 ÷ 20.', '50.000 ÷ 8.760.'],
    done: () => { say(msg, '', 'Berkas curian: 0,0001 detik. Langsung di aplikasi: 5,7 tahun. Karena itu sandi yang bocor dari berkas jauh lebih berbahaya.'); done(); } });
}

// Misi 2: scenarios A and B on the stage, then point at the step where B stops.
function dramaRound(area, ctx, { oops, done }) {
  const msg = msg33('Skenario A: akun tanpa dua langkah. Jalankan langkah demi langkah.');
  const s1 = makeSim(ctx, { scen: 'A', onEnd: () => setTimeout(showB, 1600) });
  area.append(s1.el, msg);
  function showB() {
    say(msg, 'info', 'Skenario B: akun dengan dua langkah.');
    const s2 = makeSim(ctx, { scen: 'B', onEnd: () => setTimeout(pickStep, 1600) });
    area.replaceChildren(s2.el, msg);
  }
  function pickStep() {
    say(msg, 'info', 'Ketuk langkah tempat serangan B berhenti.'); let over = false;
    const list = el('div', { class: 'dl33-langkah' }, SCEN.B.map(([a, t], j) => onTap(el('button', { class: 'dl33-lk', type: 'button', 'data-j': j }, el('b', null, `${j + 1}`), el('span', null, `${ACTORS.find((x) => x[0] === a)[1]} ${t}`)), (e) => {
      if (over) return;
      if (j !== 3) { oops(); shake(e.currentTarget); say(msg, 'bad', j < 3 ? 'Di langkah ini penyerang masih maju.' : 'Serangan sudah berhenti sebelum langkah ini.'); return; }
      over = true; e.currentTarget.classList.add('on'); ctx.sound.tap(); say(msg, '', 'Langkah 4: penyerang tidak punya kodenya. Kode yang tidak diminta di langkah 5 adalah tanda kata sandi Sekar bocor.'); done();
    })));
    area.replaceChildren(list, msg);
  }
}

function dramaC(area, ctx, { oops, rob, done }) {
  const msg = msg33('Skenario C: penyerang punya kata sandinya, lalu menelepon Sekar.');
  const run = () => {
    const s = makeSim(ctx, { scen: 'C', onEnd: (kind) => {
      if (kind === 'bobol') { rob(); ctx.mistake(); say(msg, 'bad', 'Saldo terkuras! Dua langkah tidak menolong bila kodenya diberikan. Ulangi skenario C.'); setTimeout(run, 2600); return; }
      say(msg, '', 'Sekar menutup telepon: kode tidak pernah diberikan.'); setTimeout(codes, 1800);
    } });
    area.replaceChildren(s.el, msg);
  };
  run();
  function codes() {
    say(msg, 'info', 'Kode mainan: rahasia 37, kode = dua angka terakhir dari 37 × nomor periode (satu periode 30 detik).');
    area.replaceChildren();
    formulaRound(area, ctx, { oops, msg, chips: TOY_CHIPS, want: ['37', '74', '11'],
      lines: [['Periode 1: 37 × 1 = 37 → kode ', '_'], ['Periode 2: 37 × 2 = 74 → kode ', '_'], ['Periode 3: 37 × 3 = 111 → kode ', '_']],
      hints: ['Dua angka terakhir dari 37.', 'Dua angka terakhir dari 74.', 'Dua angka terakhir dari 111.'],
      done: () => { say(msg, '', 'Kode periode 2 (74) tidak berlaku di periode 3. Aplikasi sungguhan memakai rumus rumit supaya rahasianya tidak bisa ditebak dari kodenya.'); done(); } });
  }
}

// Misi 3: five messages ring one by one.
function phoneRound(area, ctx, { oops, rob, done }) {
  const order = ctx.rand.shuffle(MESSAGES.slice()); let i = 0; let busy = false;
  const msg = msg33('Siapa yang meminta, apa yang diminta, dan seberapa terburu-buru?');
  const screen = el('div', { class: 'dl33-layar-hp' });
  const count = el('small', { class: 'dl33-hitung' });
  const show = () => {
    const [k, t] = order[i]; busy = false; count.textContent = `Pesan ${i + 1} dari ${order.length}`;
    fill(screen, el('div', { class: 'dl33-gelembung', 'data-k': k }, t), el('div', { class: 'dl33-vonis' }, [['A', '✅ Asli'], ['P', '🚨 Penipuan']].map(([v, l]) => onTap(el('button', { class: `dl33-tombol v-${v}`, type: 'button', 'data-v': v }, l), () => judge(v)))));
  };
  function judge(v) {
    if (busy) return; const [, , a, why] = order[i];
    if (v !== a) { if (a === 'P') { rob(); oops(); say(msg, 'bad', `Tertipu! Saldo berkurang Rp50.000. ${why}`); } else { oops(); say(msg, 'bad', why); } shake(screen); return; }
    busy = true; ctx.sound.tap(); screen.querySelector('.dl33-gelembung').classList.add(a === 'P' ? 'tipu' : 'asli'); say(msg, '', why); i++;
    setTimeout(() => { if (i < order.length) show(); else { say(msg, '', 'Aturannya satu kalimat: kode OTP, PIN, dan kata sandi tidak diberikan kepada siapa pun, termasuk yang mengaku petugas.'); done(); } }, 2600);
  }
  show();
  area.append(el('div', { class: 'dl33-hp' }, el('b', null, '📱 Ponsel Sekar'), count, screen), msg);
}

// Generic drag-to-row board.
function rowBoard(area, ctx, { oops, msg, items, rows, check, done, extra }) {
  let left = rows.length;
  const rowEls = rows.map(([k, t]) => el('div', { class: 'dl33-baris', 'data-drop': k }, el('span', { class: 'dl33-slot' }, '?'), el('span', null, t)));
  const tray = el('div', { class: 'dl33-baki' }, ctx.rand.shuffle(items.slice()).map(([k, t]) => el('div', { class: 'dl33-kartu', 'data-drag': k }, t)));
  const host = el('div', { class: 'dl33-papan' }, el('div', { class: 'dl33-baris-baris' }, rowEls), tray);
  dnd(host, (card, row) => {
    if (!left || row.classList.contains('isi') || !row.classList.contains('dl33-baris')) return;
    const why = check(card.dataset.drag, row.dataset.drop);
    if (why) { oops(); shake(card); say(msg, 'bad', why); return; }
    card.classList.add('locked'); row.querySelector('.dl33-slot').replaceWith(card); row.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    done(host);
  });
  area.append(host, msg);
}

function lockRound(area, ctx, { oops, done }) {
  const msg = msg33('Mana yang dikirim operator, dibuat di ponsel, berupa benda kecil, atau memakai tubuh?');
  rowBoard(area, ctx, { oops, msg, items: AUTH.map(([k, n]) => [k, n]), rows: ctx.rand.shuffle(Object.entries(AUTH_TEXT)),
    check: (k, L) => (AUTH.find((a) => a[0] === k)[2] !== L ? 'Belum cocok.' : ''),
    done: () => setTimeout(podium, 1500) });
  function podium() {
    say(msg, 'info', 'Situs palsu meniru halaman masuk. Susun podium: moda mana yang paling tahan?'); let k = 0;
    const slots = ['🥇', '🥈', '🥉'].map((m, j) => el('div', { class: `dl33-podium p${j}`, 'data-drop': String(j) }, el('b', null, m)));
    const tray = el('div', { class: 'dl33-baki' }, ctx.rand.shuffle(PODIUM.slice()).map((x) => el('div', { class: 'dl33-kartu', 'data-drag': x }, AUTH.find((a) => a[0] === x)[1])));
    const host = el('div', { class: 'dl33-papan' }, el('div', { class: 'dl33-podium-podium' }, slots[1], slots[0], slots[2]), tray);
    dnd(host, (card, slot) => {
      if (k >= 3) return;
      const j = +slot.dataset.drop; if (j !== k) { say(msg, 'info', 'Mulai dari juara 1.'); return; }
      if (card.dataset.drag !== PODIUM[j]) { oops(); shake(card); say(msg, 'bad', 'Mana yang hanya mau bekerja di situs asli? Mana yang kodenya bisa diketik ke situs palsu atau dibajak lewat SIM?'); return; }
      card.classList.add('locked'); slot.append(card); slot.classList.add('isi'); ctx.sound.tap(); k++;
      if (k < 3) return;
      say(msg, '', 'Kunci fisik menolak situs palsu; kode aplikasi masih bisa diketik ke situs palsu; SMS bisa dibajak lewat SIM pengganti. Tetap saja, SMS jauh lebih baik daripada tanpa dua langkah.'); done();
    });
    area.replaceChildren(host, msg);
  }
}

// Misi 5: each right setting lays one brick.
function fortRound(area, ctx, { oops, done }) {
  const msg = msg33('Sekar belanja paling banyak Rp100.000 sehari. Pilih pengaturan yang paling aman.'); let left = SETTINGS.length;
  const bricks = el('div', { class: 'dl33-bata-bata' }, SETTINGS.map((_, j) => el('i', { class: 'dl33-bata' })));
  const rows = el('div', { class: 'dl33-setel' }, SETTINGS.map(([k, t, opts, right, why]) => el('div', { class: 'dl33-set', 'data-k': k }, el('span', null, t), el('div', { class: 'dl33-opsi' }, opts.map((o, j) => onTap(el('button', { class: 'dl33-pil', type: 'button', 'data-j': j }, o), (e) => {
    const row = e.currentTarget.closest('.dl33-set'); if (row.classList.contains('beres')) return;
    if (j !== right) { oops(); shake(row); say(msg, 'bad', `${t}: ${why}`); return; }
    row.classList.add('beres'); e.currentTarget.classList.add('on'); bricks.children[SETTINGS.length - left].classList.add('ada'); ctx.sound.tap(); left--;
    if (left) { say(msg, '', why); return; }
    say(msg, '', 'Benteng berdiri: delapan bata, delapan pengaturan aman.'); done();
  }))))));
  area.append(el('div', { class: 'dl33-dua' }, rows, el('div', { class: 'dl33-benteng' }, el('b', null, '🏰 Benteng akun'), bricks)), msg);
}

// Misi 6: attacks arrive with a 20-second fuse; drag the matching defence onto them.
function duelRound(area, ctx, { oops, rob, attacks, done }) {
  const msg = msg33('Seret kartu pertahanan ke serangan. Waktu habis: saldo berkurang Rp50.000.'); let i = 0; let timer = null; let t0 = 0; let busy = false; let blocked = 0;
  const stage = el('div', { class: 'dl33-serangan' });
  const tray = el('div', { class: 'dl33-baki tiga' }, ctx.rand.shuffle(Object.keys(DEFENSES)).map((L) => el('div', { class: 'dl33-kartu tameng', 'data-drag': L }, `🛡 ${DEFENSES[L]}`)));
  const host = el('div', { class: 'dl33-papan' }, stage, tray);
  const fuse = el('i');
  function show() {
    const a = ATTACKS.find((x) => x[0] === attacks[i]); busy = false;
    fill(stage, el('div', { class: 'dl33-musuh', 'data-drop': a[0] }, el('b', null, `⚔️ Serangan ${i + 1} dari ${attacks.length}`), el('span', null, a[1]), el('div', { class: 'dl33-sumbu' }, fuse)));
    t0 = Date.now(); fuse.style.width = '100%';
    clearInterval(timer); timer = setInterval(() => {
      if (!host.isConnected) { clearInterval(timer); return; }
      const f = 1 - (Date.now() - t0) / 20000; fuse.style.width = `${Math.max(0, f * 100)}%`;
      if (f <= 0 && !busy) { busy = true; clearInterval(timer); rob(); ctx.mistake(); say(msg, 'bad', `Waktu habis! Pertahanannya: ${DEFENSES[a[2]]}.`); setTimeout(nextOne, 2600); }
    }, 200);
  }
  function nextOne() { i++; if (i < attacks.length) show(); else { say(msg, '', `${blocked} dari ${attacks.length} serangan tertangkis. Setiap serangan punya pertahanan yang tepat, bukan satu pertahanan untuk semua.`); done(); } }
  dnd(host, (card, target) => {
    if (busy || !target.classList.contains('dl33-musuh')) return;
    const a = ATTACKS.find((x) => x[0] === target.dataset.drop);
    if (card.dataset.drag !== a[2]) { rob(); oops(); shake(card); say(msg, 'bad', 'Pertahanan itu tidak menghentikan serangan ini. Saldo berkurang Rp50.000!'); return; }
    busy = true; blocked++; clearInterval(timer); target.classList.add('tangkis'); ctx.sound.good(); say(msg, '', `Tertangkis: ${DEFENSES[a[2]]}.`);
    setTimeout(nextOne, 1800);
  });
  show();
  area.append(host, msg);
}

// Misi Bos: a five-habit poster, then Granny's phone call.
function grannyBoss(area, ctx, { oops, done }) {
  const msg = msg33('Pilih lima kebiasaan aman untuk poster. Tiga kartu adalah kebiasaan buruk.'); let left = 5;
  const poster = el('div', { class: 'dl33-poster', 'data-drop': 'poster' }, el('b', null, '📜 Lima Kebiasaan Aman Dompet Digital'), el('ol', { class: 'dl33-poster-isi' }));
  const tray = el('div', { class: 'dl33-baki' }, ctx.rand.shuffle(HABITS.slice()).map(([k, t]) => el('div', { class: 'dl33-kartu', 'data-drag': k }, t)));
  const host = el('div', { class: 'dl33-dua' }, poster, tray);
  dnd(host, (card) => {
    if (!left) return;
    const h = HABITS.find((x) => x[0] === card.dataset.drag);
    if (!h[2]) { oops(); shake(card); say(msg, 'bad', h[3]); return; }
    poster.querySelector('ol').append(el('li', null, h[1])); card.remove(); ctx.sound.tap();
    if (--left) return;
    setTimeout(call, 1500);
  });
  area.append(host, msg);
  function call() {
    say(msg, 'info', 'Telepon Nenek berdering: "Saya petugas dompet digital. Sebutkan kode yang baru masuk ke SMS Ibu." Ketuk tindakan Nenek secara berurutan.'); let k = 0;
    const steps = el('ol', { class: 'dl33-urut' });
    const opts = el('div', { class: 'dl33-opsi lebar' }, ctx.rand.shuffle(GRANNY.slice()).map(([key, t, pos, why]) => onTap(el('button', { class: 'dl33-pil', type: 'button', 'data-k': key }, t), (e) => {
      if (k >= 3 || e.currentTarget.classList.contains('on')) return;
      if (pos !== k) { oops(); shake(e.currentTarget); say(msg, 'bad', why || 'Belum urutannya.'); return; }
      e.currentTarget.classList.add('on'); steps.append(el('li', null, t)); ctx.sound.tap(); k++;
      if (k < 3) return;
      say(msg, '', 'Nenek lulus uji: tutup telepon, buka aplikasi resmi sendiri, periksa. Dompet Sekar dan Nenek aman!'); done();
    })));
    area.replaceChildren(el('div', { class: 'dl33-dua' }, el('div', { class: 'dl33-nenek' }, el('b', null, '👵 Nenek'), steps), opts), msg);
  }
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
  goal: 'Jaga Dompet Sekar: saldo Rp300.000 diincar penipu dari segala arah. Hitung waktu bobol sandi, peragakan pencurian akun, tangkis pesan penipuan, pilih gembok, bangun benteng akun, dan menangkan duel serangan.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Kekuatan Sandi', desc: 'Pilih jenis karakter dan panjang (tanpa mengetik kata sandi) untuk melihat banyak kemungkinan dan waktu menebaknya', create: createCalc },
    { id: 'simulasi', icon: '📲', label: 'Simulasi Masuk Akun', desc: 'Jalankan skenario A, B, dan C langkah demi langkah; di skenario C pilih apakah Sekar menyebutkan kodenya', create: createSim },
    { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan Akun', desc: 'Layar pengaturan dompet digital rekaan dengan delapan pengaturan dan skor keamanan', create: createSettings },
    { id: 'giliran', icon: '⚔️', label: 'Serangan dan Pertahanan', desc: 'Tim penyerang memilih kartu serangan, tim pembela memilih pertahanan dalam 20 detik; peran bergantian', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act dl33-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const w = wallet(); const area = el('div', { class: 'dl33-area' });
      const go = (k, no) => wrap.append(el('div', { class: 'dl33-kepala' }, misiHead(no, ...HEAD33[k], '🔐'), w.node), area);
      const fin = (ms) => ({ oops: () => ctx.mistake(), rob: w.rob, done: () => next(ms) });
      if (r === 0) { go('hitung', 1); calcRound(area, ctx, fin(6000)); }
      else if (r === 1) { go('langsung', 1); onlineRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('drama', 2); dramaRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('dramaC', 2); dramaC(area, ctx, fin(6500)); }
      else if (r === 4) { go('telepon', 3); phoneRound(area, ctx, fin(5000)); }
      else if (r === 5) { go('gembok', 4); lockRound(area, ctx, fin(7000)); }
      else if (r === 6) { go('benteng', 5); fortRound(area, ctx, fin(5000)); }
      else if (r === 7) { go('duel1', 6); duelRound(area, ctx, { attacks: ['1', '2', '3'], ...fin(4000) }); }
      else if (r === 8) { go('duel2', 6); duelRound(area, ctx, { attacks: ['4', '5', '6'], ...fin(4000) }); }
      else { go('bos', 'Bos'); grannyBoss(area, ctx, fin(7000)); }
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
        area.replaceChildren(el('div', { class: 'dl-item serang pilih' }, el('b', null, a[0]), el('span', null, a[1])), clock, el('div', { class: 'dl33-baki dua' }, ctx.rand.shuffle(Object.keys(DEFENSES)).map((L) => onTap(el('button', { class: 'dl-item', type: 'button' }, el('b', null, L), el('span', null, DEFENSES[L])), () => finish(L)))));
        say(msg, '', `Tim ${def + 1} (pembela): pilih pertahanan dalam 20 detik.`);
        timer = setInterval(() => { if (!wrap.isConnected) { clearInterval(timer); return; } left--; clock.textContent = String(left); if (left <= 0) finish(null); }, 1000);
      }
    }
    turn();
  }
  pickTeams(wrap, 'Serangan dan Pertahanan', start);
}
