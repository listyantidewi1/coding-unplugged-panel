// Di Balik Halaman Web — SMA/SMK (16–18 tahun), protokol HTTP, kode status, cookie, dan HTTPS.
// Order the journey of a page load, pick status codes, play the server that
// follows a rule book (including session cookies), see what an eavesdropper on
// public Wi-Fi reads over HTTP and HTTPS, count requests, and take a URL apart.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const SITE = 'osis.sekolah.example';
export const IP = '198.51.100.20';
export const JOURNEY = [['H', 'Dina mengetik https://osis.sekolah.example/jadwal dan menekan Enter.'], ['B', 'Peramban bertanya ke server DNS: "Berapa alamat IP osis.sekolah.example?"'], ['C', 'Server DNS menjawab: "198.51.100.20".'], ['D', 'Peramban membuka sambungan aman ke 198.51.100.20 dan memeriksa sertifikat server.'], ['E', 'Peramban mengirim permintaan GET /jadwal.'], ['F', 'Server mencari halaman jadwal, lalu membalas 200 OK beserta HTML.'], ['G', 'Peramban membaca HTML, lalu meminta logo.png dan gaya.css.'], ['A', 'Peramban menampilkan halaman jadwal secara lengkap.']];
// Messages for the journey animation: [from, to, caption]
const HOPS = [['hp', 'dns', 'B · tanya DNS'], ['dns', 'hp', 'C · 198.51.100.20'], ['hp', 'web', 'D · buka sambungan aman'], ['web', 'hp', 'D · sertifikat'], ['hp', 'web', 'E · GET /jadwal'], ['web', 'hp', 'F · 200 OK + HTML'], ['hp', 'web', 'G · GET /logo.png, /gaya.css'], ['web', 'hp', 'G · 200 OK ×2']];

export const CODES = { 200: 'OK (berhasil)', 301: 'Pindah permanen', 403: 'Dilarang', 404: 'Tidak ditemukan', 500: 'Kesalahan server' };
export const EVENTS = [['Dina membuka /jadwal, dan halamannya ada.', 200], ['Dina membuka /pengumuman-lama, padahal halaman itu sudah dipindah ke /pengumuman.', 301], ['Dina salah ketik menjadi /jadwl.', 404], ['Program di server rusak setelah diperbarui, sehingga semua halaman gagal dibuat.', 500], ['Murid yang bukan pengurus mencoba membuka /pengurus.', 403], ['Dina membuka /galeri/pentas.jpg, dan fotonya ada.', 200]];
// More events for the quick-fire mode.
export const MORE_EVENTS = [['Situs perpustakaan pindah ke alamat baru untuk selamanya; alamat lama mengarahkan ke sana.', 301], ['Tautan di grup kelas menunjuk ke /pengumuman-2019 yang sudah dihapus.', 404], ['Server basis data OSIS mati, sehingga halaman jadwal gagal dibuat.', 500], ['Murid membuka /pengurus dengan cookie sesi yang sudah kedaluwarsa.', 403], ['Peramban meminta /gaya.css, dan berkasnya ada.', 200], ['Dina berhasil mengirim formulir masuk dengan kata sandi yang benar.', 200], ['Pengunjung membuka /admin yang hanya boleh dibuka pengelola, tanpa masuk.', 403], ['Pembuat situs salah menulis program setelah menambah fitur, semua halaman galat.', 500]];

const PAGES = ['/jadwal', '/pengumuman', '/galeri', '/masuk'];
// The server's rule book. sessions: Set of valid session codes.
export function serve(req, sessions, newCode = () => '7QK2MX') {
  const { method, path, cookie = null, good = true } = req;
  if (method === 'POST' && path === '/masuk' && good) { const c = newCode(); sessions.add(c); return { code: 200, body: 'Halaman "Selamat datang, dina"', set: `sesi=${c}` }; }
  if (method === 'GET' && PAGES.includes(path)) return { code: 200, body: `Halaman ${path.slice(1)}` };
  if (method === 'GET' && path === '/pengumuman-lama') return { code: 301, body: 'Pindah ke /pengumuman', loc: '/pengumuman' };
  if (method === 'GET' && path === '/pengurus') return cookie && sessions.has(cookie.replace('sesi=', '')) ? { code: 200, body: 'Halaman pengurus' } : { code: 403, body: 'Dilarang: belum masuk' };
  return { code: 404, body: 'Halaman tidak ditemukan' };
}
export const CARDS = [{ method: 'GET', path: '/jadwal' }, { method: 'GET', path: '/pengumuman-lama' }, { method: 'GET', path: '/jadwl' }, { method: 'GET', path: '/pengurus' }, { method: 'POST', path: '/masuk', note: 'nama pengguna dina, kata sandi benar' }, { method: 'GET', path: '/pengurus', cookie: 'sesi=7QK2MX' }, { method: 'GET', path: '/pengurus', cookie: 'sesi=AAAA11' }];
export const REPLIES = [['200 + halaman', (r) => r.code === 200 && !r.set], ['301 → /pengumuman', (r) => r.code === 301], ['403', (r) => r.code === 403], ['404', (r) => r.code === 404], ['200 + halaman + cookie baru', (r) => r.code === 200 && !!r.set]];
const reqText = (q) => `${q.method} ${q.path}${q.note ? ` (${q.note})` : ''}${q.cookie ? ` · Cookie: ${q.cookie}` : ''}`;

// What an eavesdropper sees: [item, HTTPS visible?]
export const SNIFF = [['Nama situs osis.sekolah.example', true], ['Alamat IP server 198.51.100.20', true], ['Halaman yang diminta, misalnya /pengurus', false], ['Kata sandi pada POST /masuk', false], ['Cookie sesi', false], ['Isi halaman pengurus', false], ['Besar data dan waktu pengirimannya', true]];

// Page load timing: dns + html, then files one by one or `par` at once.
export function loadTime({ files = 4, par = 1, rtt = 0.2 } = {}) { return rtt * (2 + Math.ceil(files / par)); }
export const URL_PARTS = [['https', 'protokol'], ['://', null], [SITE, 'nama situs'], ['/galeri', 'jalur halaman'], ['?tahun=2026', 'kueri'], ['#foto3', 'fragmen']];

// --- pieces ---
function orderRound(wrap, ctx, { done }) {
  const cards = ctx.rand.shuffle(JOURNEY.slice());
  const got = [];
  const row = el('div', { class: 'ht-urut' });
  const box = el('div', { class: 'ht-kartu-kartu' });
  const anim = el('div', { class: 'ht-anim' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu sesuai urutan, mulai dari Dina menekan Enter.');
  const draw = () => {
    row.replaceChildren(...JOURNEY.map((_, i) => el('span', { class: `ht-slot ${got[i] ? 'isi' : ''}` }, got[i] || '?')));
    box.replaceChildren(...cards.map(([id, t]) => onTap(el('button', { class: `ht-kartu ${got.includes(id) ? 'pakai' : ''}`, type: 'button' }, el('b', null, id), el('span', null, t)), () => {
      if (got.includes(id) || got.length === JOURNEY.length) return;
      const want = JOURNEY[got.length][0];
      if (id !== want) { ctx.mistake(); shake(box); say(msg, 'bad', got.length === 0 ? 'Semuanya dimulai dari Dina.' : id === 'G' ? 'Peramban baru tahu berkas lain setelah membaca HTML.' : ['D', 'E', 'F'].includes(id) && got.length < 3 ? 'Peramban harus tahu alamat IP dulu sebelum membuka sambungan.' : `Kartu ${id} belum saatnya.`); return; }
      got.push(id); ctx.sound.tap(); draw();
      if (got.length === JOURNEY.length) { say(msg, '', 'H → B → C → D → E → F → G → A. Lihat pesannya berjalan.'); box.hidden = true; journeyAnim(anim, done); }
    })));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Perjalanan sebuah halaman: urutkan kartunya.'), row, box, anim, msg);
  draw();
}
function journeyAnim(host, done) {
  const P = { hp: [120, 150, '📱', 'Ponsel Dina'], dns: [620, 60, '📒', 'Server DNS'], web: [620, 240, '🗄️', SITE] };
  host.innerHTML = `<svg viewBox="0 0 760 300" role="img" aria-label="Pesan berjalan">${['dns', 'web'].map((k) => `<line x1="${P.hp[0]}" y1="${P.hp[1]}" x2="${P[k][0]}" y2="${P[k][1]}" stroke="#94a3b8" stroke-width="4" stroke-dasharray="8 8"/>`).join('')}${Object.values(P).map(([x, y, ic, n]) => `<g><circle cx="${x}" cy="${y}" r="42" fill="#fff" stroke="#1e293b" stroke-width="3"/><text x="${x}" y="${y + 13}" font-size="38" text-anchor="middle">${ic}</text><text x="${x}" y="${y + 70}" font-size="20" font-weight="800" text-anchor="middle" fill="#0f172a">${n}</text></g>`).join('')}<circle class="ht-dot" r="14" fill="#f97316" stroke="#fff" stroke-width="3" cx="${P.hp[0]}" cy="${P.hp[1]}"/><text class="ht-cap" x="380" y="160" font-size="26" font-weight="900" text-anchor="middle" fill="#1d4ed8"></text></svg>`;
  const dot = host.querySelector('.ht-dot'); const cap = host.querySelector('.ht-cap');
  let i = 0; let t0 = null; const dur = 650;
  const step = (now) => {
    if (!host.isConnected) return;
    if (i >= HOPS.length) { cap.textContent = 'A · halaman tampil'; done?.(); return; }
    const [a, b, c] = HOPS[i]; t0 ??= now; const f = Math.min(1, (now - t0) / dur);
    cap.textContent = c;
    dot.setAttribute('cx', P[a][0] + (P[b][0] - P[a][0]) * f); dot.setAttribute('cy', P[a][1] + (P[b][1] - P[a][1]) * f);
    if (f >= 1) { i++; t0 = null; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Play the server: reply to each request card with the rule book.
function serverRound(wrap, ctx, { done }) {
  const sessions = new Set(); const ans = {};
  const res = CARDS.map((q) => serve(q, sessions));
  const box = el('div', { class: 'ht-server' });
  const msg = el('p', { class: 'reveal info' }, 'Kamu servernya. Pilih balasan untuk setiap kartu menurut buku aturan.');
  const draw = () => box.replaceChildren(...CARDS.map((q, i) => el('div', { class: `ht-minta ${i in ans ? 'beres' : ''}` }, el('b', null, `${i + 1}`), el('code', null, reqText(q)),
    i in ans ? el('span', { class: `ht-kode k${String(res[i].code)[0]}` }, `${res[i].code} ${res[i].set ? `· Set-Cookie: ${res[i].set}` : res[i].loc ? `→ ${res[i].loc}` : ''}`)
      : el('span', { class: 'seg' }, REPLIES.map(([l, ok]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
        if (!ok(res[i])) { ctx.mistake(); shake(box); say(msg, 'bad', q.cookie === 'sesi=AAAA11' ? 'Kode AAAA11 tidak pernah dibuat server.' : q.path === '/pengurus' && !q.cookie ? 'Tanpa cookie, server tidak tahu peminta adalah pengurus.' : `Periksa baris buku aturan untuk ${q.method} ${q.path}.`); return; }
        ans[i] = true; ctx.sound.tap(); draw();
        if (Object.keys(ans).length === CARDS.length) { say(msg, '', 'Balasan: 200, 301, 404, 403, 200 dengan cookie, 200, 403.'); done(); }
      }))))));
  wrap.append(el('p', { class: 'prompt' }, 'Bermain peran: peramban mengirim kartu permintaan, kamu menjadi server.'), rulebook(true), box, msg);
  draw();
}
const rulebook = (open = false) => el('details', { class: 'ht-buku', open }, el('summary', null, '📘 Buku aturan server'), el('table', { class: 'ht-tabel' },
  ...[['GET /jadwal, /pengumuman, /galeri, /masuk', '200 dan halamannya'], ['GET /pengumuman-lama', '301, pindah ke /pengumuman'], ['POST /masuk dengan sandi benar', '200, "Selamat datang", cookie sesi acak baru'], ['GET /pengurus dengan cookie sesi berlaku', '200 dan halaman pengurus'], ['GET /pengurus tanpa cookie atau cookie tidak berlaku', '403'], ['Alamat lain', '404']].map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, b)))));

function sniffRound(wrap, ctx, { done }) {
  const ans = {};
  const box = el('div', { class: 'ht-sadap' });
  const msg = el('p', { class: 'reveal info' }, 'HTTP seperti kartu pos; HTTPS seperti amplop bersandi yang hanya bagian luarnya terlihat.');
  const cell = (i, proto) => {
    const k = `${i}${proto}`; const vis = proto === 'http' ? true : SNIFF[i][1];
    if (k in ans) return el('span', { class: `ht-sel ${vis ? 'lihat' : 'tutup'}` }, vis ? '👁 terlihat' : '🔒 tersembunyi');
    return el('span', { class: 'seg' }, [[true, '👁'], [false, '🔒']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button', title: v ? 'terlihat' : 'tersembunyi' }, l), () => {
      if (v !== vis) { ctx.mistake(); shake(box); say(msg, 'bad', proto === 'http' ? 'Pada HTTP semua pesan bisa dibaca seperti kartu pos.' : vis ? 'Bagian luar amplop tetap terlihat: ke mana dan seberapa besar.' : 'Isi amplop HTTPS tersandi.'); return; }
      ans[k] = v; ctx.sound.tap(); draw();
      if (Object.keys(ans).length === SNIFF.length * 2) { say(msg, '', 'HTTPS menyembunyikan isi percakapan, tetapi tidak menyembunyikan bahwa Dina membuka situs OSIS.'); done(); }
    })));
  };
  const draw = () => box.replaceChildren(el('div', { class: 'ht-sadap-baris kepala' }, el('b', null, 'Yang dikirim atau diterima Dina'), el('b', null, 'HTTP'), el('b', null, 'HTTPS')),
    ...SNIFF.map(([t], i) => el('div', { class: 'ht-sadap-baris' }, el('span', null, t), cell(i, 'http'), cell(i, 'https'))));
  wrap.append(el('p', { class: 'prompt' }, 'Penyadap di Wi-Fi taman: apa yang terlihat (👁) dan tersembunyi (🔒)?'), box, msg);
  draw();
}

// Waterfall of requests: each bar is one question-and-answer of 0.2 s.
export function waterfall(par = 1) {
  const rows = [['DNS', 0], ['HTML', 1]]; const files = ['gaya.css', 'foto1.jpg', 'foto2.jpg', 'foto3.jpg'];
  files.forEach((f, i) => rows.push([f, 2 + Math.floor(i / par)]));
  return el('div', { class: 'ht-air' }, ...rows.map(([n, s]) => el('div', { class: 'ht-air-baris' }, el('span', null, n), el('div', { class: 'ht-air-jalur' }, el('i', { style: { left: `${(s / 6) * 100}%`, width: `${100 / 6}%` } })))),
    el('div', { class: 'ht-air-baris' }, el('span', null, 'detik'), el('div', { class: 'ht-air-jalur skala' }, ...[0, 1, 2, 3, 4, 5, 6].map((x) => el('small', { style: { left: `${(x / 6) * 100}%` } }, (x * 0.2).toFixed(1).replace('.', ','))))));
}

function urlRound(wrap, ctx, { done }) {
  const ask = URL_PARTS.filter((p) => p[1]).map((p) => p[1]);
  let k = 0; const got = new Set();
  const box = el('div', { class: 'ht-url' });
  const msg = el('p', { class: 'reveal info' });
  const draw = () => {
    box.replaceChildren(...URL_PARTS.map(([t, name], i) => (name ? onTap(el('button', { class: `ht-bagian ${got.has(i) ? 'kena' : ''}`, type: 'button' }, t, got.has(i) ? el('small', null, name) : null), () => {
      if (got.has(i) || k >= ask.length) return;
      if (name !== ask[k]) { ctx.mistake(); shake(box); say(msg, 'bad', `"${t}" bukan ${ask[k]}.`); return; }
      got.add(i); k++; ctx.sound.tap(); draw();
      if (k === ask.length) { say(msg, '', 'Protokol https, nama situs, jalur /galeri, kueri ?tahun=2026, fragmen #foto3.'); done(); }
    }) : el('span', { class: 'ht-pisah' }, t))));
    if (k < ask.length) say(msg, 'info', `Ketuk bagian: ${ask[k]}.`);
  };
  wrap.append(el('p', { class: 'prompt' }, 'Tantangan: tandai bagian-bagian alamat ini.'), box, msg);
  draw();
}

export default {
  id: 'sma-20-kode-http',
  title: 'Di Balik Halaman Web',
  topic: 'Protokol HTTP: permintaan dan balasan, kode status, cookie sesi, HTTPS, dan bagian alamat web',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mengurutkan perjalanan sebuah halaman web, memilih kode status yang tepat, memerankan server yang mengikuti buku aturan termasuk cookie sesi, membandingkan yang terlihat oleh penyadap pada HTTP dan HTTPS, menghitung waktu memuat halaman, dan menguraikan bagian-bagian alamat web.',
  extraModes: [
    { id: 'lab', icon: '🧪', label: 'Peramban, Server, dan Penyadap', desc: 'Susun permintaan sendiri, lihat balasan server dan cookie yang tersimpan, lalu nyalakan HTTP atau HTTPS untuk melihat layar penyadap', create: createLab },
    { id: 'kode', icon: '🔢', label: 'Tebak Kode Balasan', desc: 'Kejadian acak muncul satu per satu; pilih kode 200, 301, 403, 404, atau 500 secepatnya', create: createQuiz },
    { id: 'giliran', icon: '🔁', label: 'Peramban lawan Server', desc: 'Satu tim menjadi peramban yang memilih permintaan, tim lain menjadi server yang memilih balasan; balasan benar mendapat poin, lalu peran bertukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kode-http' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const codes = (i) => (i < EVENTS.length ? ask(`Kode balasan: ${EVENTS[i][0]}`, Object.keys(CODES).map((c) => [c, Number(c) === EVENTS[i][1]]), 5, el('div', { class: 'ht-golongan' }, '2xx berhasil · 3xx pindah · 4xx permintaan bermasalah · 5xx server bermasalah'), then(() => codes(i + 1)))
        : ask('Siapa yang perlu memperbaiki salah ketik /jadwl (404), dan siapa yang memperbaiki program server yang rusak (500)?', [['404: peminta (atau pembuat tautan); 500: pengelola server', true], ['Keduanya pengelola server'], ['Keduanya peminta'], ['404: pengelola server; 500: peminta']]));
      if (r === 0) orderRound(wrap, ctx, { done: next });
      else if (r === 1) codes(0);
      else if (r === 2) serverRound(wrap, ctx, { done: next });
      else if (r === 3) ask('Setelah menerima 301 untuk kartu 2, apa yang dikirim peramban berikutnya?', [['GET /pengumuman, otomatis', true], ['GET /pengumuman-lama sekali lagi'], ['POST /masuk'], ['Tidak ada; Dina harus mengetik alamat baru']], 1, el('code', { class: 'ht-pesan' }, '301 Moved Permanently · Location: /pengumuman'),
        then(() => ask('Kartu 4 dan kartu 6 sama-sama GET /pengurus. Mengapa balasannya 403 dan 200?', [['Kartu 6 membawa cookie sesi yang dibuat server saat Dina masuk; kartu 4 belum', true], ['Server sedang sibuk saat kartu 4'], ['Kartu 6 memakai HTTPS'], ['Server mengingat permintaan sebelumnya tanpa cookie']])));
      else if (r === 4) ask('Server tidak mengingat permintaan sebelumnya. Tanpa cookie, apa yang harus dilakukan Dina setiap kali membuka halaman pengurus?', [['Mengirim nama pengguna dan kata sandi lagi', true], ['Tidak perlu apa-apa'], ['Menunggu 301'], ['Mengganti alamat IP']], 1, null,
        then(() => ask('Mengapa kode sesi dibuat acak dan panjang, bukan sesi=dina?', [['Kode yang mudah ditebak bisa dipalsukan siapa pun untuk masuk sebagai Dina', true], ['Supaya mudah diingat Dina'], ['Supaya halaman lebih cepat'], ['Karena cookie harus berupa huruf kapital']], 1, el('code', { class: 'ht-pesan' }, 'GET /pengurus · Cookie: sesi=dina  →  ?'),
          then(() => ask('Mengapa Dina sebaiknya menekan "Keluar" setelah memakai komputer perpustakaan?', [['Server membatalkan kode sesinya, sehingga orang berikutnya tidak bisa membuka halaman pengurus sebagai Dina', true], ['Supaya komputernya mati'], ['Supaya kata sandinya berubah'], ['Tidak perlu; cookie hilang sendiri saat Dina berdiri']])))));
      else if (r === 5) sniffRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Situs memakai HTTP dan penyadap mendapat cookie sesi Dina. Apa yang bisa ia lakukan?', [['Masuk sebagai Dina tanpa tahu kata sandinya, sampai sesinya berakhir', true], ['Tidak ada, cookie tidak berguna tanpa kata sandi'], ['Mengubah kata sandi Dina tanpa masuk'], ['Hanya melihat nama situsnya']], 1, null,
        then(() => ask('hadiah-pulsa.example memakai HTTPS dan menampilkan gembok. Apakah situsnya bisa dipercaya?', [['Belum tentu: gembok hanya berarti sambungan tersandi ke pemilik nama itu; penipu pun bisa punya sertifikat', true], ['Ya, gembok berarti situs diperiksa pemerintah'], ['Ya, karena memakai HTTPS'], ['Tidak, semua situs HTTPS adalah penipuan']], 1, null,
          then(() => ask('Di Wi-Fi taman muncul "Sambungan tidak aman: sertifikat tidak sah" saat membuka dompet digital. Apa yang sebaiknya Dina lakukan?', [['Jangan dilanjutkan; putuskan Wi-Fi itu dan pakai jaringan tepercaya seperti data seluler', true], ['Tekan "Lanjutkan saja", karena biasa terjadi'], ['Masukkan PIN lebih cepat sebelum disadap'], ['Matikan peringatan di pengaturan peramban']])))));
      else if (r === 7) ask('Galeri: 1 HTML, 1 gaya.css, dan 3 foto, masing-masing satu GET. Berapa permintaan GET?', [[5, true], [4], [6], [3]], 4, null,
        then(() => ask('Setiap tanya-jawab 0,2 detik, termasuk satu DNS di awal. Jika berkas diminta satu per satu, berapa detik sampai galeri tampil?', [['1,2', true], ['1,0'], ['0,6'], ['1,4']], 4, waterfall(1),
          then(() => ask('Setelah HTML dibaca, peramban boleh meminta empat berkas sekaligus. Berapa detik sekarang?', [['0,6', true], ['0,4'], ['0,8'], ['1,2']], 4, waterfall(4))))));
      else if (r === 8) ask('Mengapa situs dengan puluhan foto besar terasa lambat pada sinyal lemah, dan apa yang bisa dilakukan pembuatnya?', [['Banyak dan besar berkas memperlama kiriman; perkecil foto, kurangi berkas, muat foto saat akan dilihat, izinkan cache', true], ['Karena HTTPS; ganti ke HTTP'], ['Karena DNS; tambah server DNS di ponsel'], ['Karena kode 301; hapus semua pengalihan']]);
      else urlRound(wrap, ctx, { done: then(() => ask('Bagian mana yang dikirim ke server dalam GET, dan mana yang tidak pernah dikirim?', [['Dikirim: GET /galeri?tahun=2026; tidak pernah: #foto3', true], ['Dikirim: semuanya'], ['Dikirim: GET /galeri; tidak pernah: ?tahun=2026 dan #foto3'], ['Dikirim: osis.sekolah.example; tidak pernah: /galeri']], 1, el('code', { class: 'ht-pesan' }, 'https://osis.sekolah.example/galeri?tahun=2026#foto3'),
        then(() => ask('Halaman ini dibuka di alamat dengan fragmen #/sma-20-kode-http. Permintaan GET apa yang diterima servernya, dan bagaimana aktivitas ini dipilih?', [['GET /, halaman utama yang sama; program di halaman membaca fragmen dan memilih aktivitasnya', true], ['GET /sma-20-kode-http; server memilih aktivitasnya'], ['GET /#/sma-20-kode-http; server membaca fragmen'], ['Tidak ada GET; halaman dibuat oleh DNS']], 1, el('code', { class: 'ht-pesan' }, `Fragmen di peramban ini sekarang: ${location.hash.split('?')[0] || '#/sma-20-kode-http'}`))))) });
    }
    render();
  },
};

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act kode-http' });
  root.append(wrap);
  const sessions = new Set(); let jar = null; let https = true; let path = '/jadwal'; let method = 'GET'; let fake = false; const log = [];
  const newCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[ctx.rand.int(0, 31)]).join('');
  const form = el('div', { class: 'ht-susun' });
  const out = el('div', { class: 'ht-log' });
  const spy = el('div', { class: 'ht-penyadap' });
  const msg = el('p', { class: 'reveal hint' }, 'Susun permintaan, lalu kirim. Peramban otomatis menyertakan cookie yang tersimpan.');
  const send = () => {
    const cookie = fake ? 'sesi=AAAA11' : jar;
    let req = { method, path, cookie };
    let res = serve(req, sessions, newCode);
    log.unshift([req, res]);
    if (res.set) jar = res.set;
    if (res.loc) { req = { method: 'GET', path: res.loc, cookie }; res = serve(req, sessions, newCode); log.unshift([req, res]); }
    ctx.sound[res.code < 400 ? 'good' : 'bad']();
    draw();
  };
  const draw = () => {
    const seg = (items, cur, set) => el('div', { class: 'seg' }, items.map(([v, l]) => onTap(el('button', { class: `seg-btn ${cur === v ? 'on' : ''}`, type: 'button' }, l), () => { set(v); draw(); })));
    form.replaceChildren(el('b', null, 'Permintaan'),
      seg([['GET', 'GET'], ['POST', 'POST']], method, (v) => { method = v; if (v === 'POST') path = '/masuk'; }),
      seg([...['/jadwal', '/pengumuman', '/pengumuman-lama', '/galeri', '/masuk', '/pengurus', '/jadwl'].map((p) => [p, p])], path, (v) => { path = v; if (v !== '/masuk') method = 'GET'; }),
      seg([[false, `Cookie: ${jar || '(belum ada)'}`], [true, 'Cookie palsu sesi=AAAA11']], fake, (v) => { fake = v; }),
      el('div', { class: 'kode-baris' }, button('Kirim ➜', send, 'primary'), button('Keluar (hapus sesi)', () => { if (jar) sessions.delete(jar.replace('sesi=', '')); jar = null; draw(); say(msg, 'info', 'Server membatalkan sesi dan peramban menghapus cookie.'); })),
      seg([[false, '📮 HTTP (kartu pos)'], [true, '🔒 HTTPS (amplop bersandi)']], https, (v) => { https = v; }));
    out.replaceChildren(...log.slice(0, 6).map(([q, s]) => el('div', { class: 'ht-catat' }, el('code', null, `${q.method} ${q.path}${q.method === 'POST' ? ' (dina, sandi benar)' : ''}${q.cookie ? ` · Cookie: ${q.cookie}` : ''}`), el('span', { class: `ht-kode k${String(s.code)[0]}` }, `${s.code} ${CODES[s.code]}`), el('small', null, `${s.body}${s.set ? ` · Set-Cookie: ${s.set}` : ''}`))));
    const last = log[0];
    const hide = (t) => (https ? el('span', { class: 'ht-tutup' }, '▒▒▒▒ tersandi') : el('span', null, t));
    spy.replaceChildren(el('b', null, `👀 Layar penyadap · ${https ? 'HTTPS (amplop bersandi)' : 'HTTP (kartu pos)'}`), ...(last ? [
      el('div', null, el('small', null, 'Nama situs'), el('span', null, SITE)), el('div', null, el('small', null, 'Alamat IP'), el('span', null, IP)),
      el('div', null, el('small', null, 'Permintaan'), hide(`${last[0].method} ${last[0].path}`)), el('div', null, el('small', null, 'Kata sandi'), last[0].method === 'POST' ? hide('dina / rahasia-osis-2026') : el('span', null, '–')),
      el('div', null, el('small', null, 'Cookie'), last[0].cookie ? hide(last[0].cookie) : el('span', null, '–')), el('div', null, el('small', null, 'Isi balasan'), hide(`${last[1].code} · ${last[1].body}`)),
      el('div', null, el('small', null, 'Besar dan waktu'), el('span', null, `${120 + last[0].path.length * 37} bita · ${new Date().toLocaleTimeString('id-ID')}`))] : [el('span', null, 'Belum ada pesan.')]));
  };
  wrap.append(el('p', { class: 'prompt' }, `Peramban, server ${SITE}, dan penyadap`), el('div', { class: 'ht-lab' }, el('div', { class: 'ht-kiri' }, form, out), spy), msg);
  draw();
}

function createQuiz(root, ctx) {
  const wrap = el('div', { class: 'act kode-http' });
  root.append(wrap);
  const bank = [...EVENTS, ...MORE_EVENTS];
  let streak = 0; let best = 0; let order = ctx.rand.shuffle(bank.slice()); let k = 0;
  const show = () => {
    if (k >= order.length) { order = ctx.rand.shuffle(bank.slice()); k = 0; }
    const [t, code] = order[k];
    wrap.replaceChildren(el('div', { class: 'pb-skor' }, el('span', null, `Beruntun: ${streak}`), el('span', null, `Terbaik: ${best}`)));
    choice(wrap, { prompt: t, ctx, columns: 5, subject: el('div', { class: 'ht-golongan' }, '2xx berhasil · 3xx pindah · 4xx permintaan bermasalah · 5xx server bermasalah'), options: Object.entries(CODES).map(([c, n]) => ({ label: `${c} ${n}`, correct: Number(c) === code })), onRight: () => { streak++; best = Math.max(best, streak); k++; setTimeout(show, 900); } });
  };
  wrap.addEventListener('pointerdown', (e) => { if (e.target.closest('.opt.wrong')) streak = 0; });
  show();
}

// Teams: the browser team picks a request, the next team answers as the server.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kode-http' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0); const turns = n * 3; let k = 0;
    const sessions = new Set(); let issued = null;
    const opts = [{ method: 'GET', path: '/jadwal' }, { method: 'GET', path: '/galeri' }, { method: 'GET', path: '/pengumuman-lama' }, { method: 'GET', path: '/jadwl' }, { method: 'GET', path: '/kantin' }, { method: 'GET', path: '/pengurus' }, { method: 'POST', path: '/masuk', note: 'nama pengguna dina, kata sandi benar' }, { method: 'GET', path: '/pengurus', cookie: 'cookie dari masuk' }, { method: 'GET', path: '/pengurus', cookie: 'sesi=AAAA11' }];
    function browser() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Peramban lawan Server selesai', pts, again: () => pickTeams(wrap, 'Peramban lawan Server', start) }); return; }
      const b = k % n; const s = (k + 1) % n;
      wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1} (peramban): pilih kartu permintaan untuk server Tim ${s + 1}.`), rulebook(),
        el('div', { class: 'opts', style: { '--cols': 3 } }, opts.map((q) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, reqText(q.cookie === 'cookie dari masuk' ? { ...q, cookie: issued || 'sesi=(belum ada)' } : q))), () => { ctx.sound.tap(); server(q.cookie === 'cookie dari masuk' ? { ...q, cookie: issued } : q, s); }))));
    }
    function server(q, s) {
      const res = serve(q, sessions, () => (issued = `sesi=${Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[ctx.rand.int(0, 31)]).join('')}`).slice(5));
      const msg = el('p', { class: 'reveal hint' }, `Tim ${s + 1} (server): balasan apa menurut buku aturan?`);
      let over = false;
      wrap.replaceChildren(scoreBar(pts, s), el('p', { class: 'prompt' }, el('code', null, reqText(q))), rulebook(true),
        el('div', { class: 'opts', style: { '--cols': 3 } }, REPLIES.map(([l, ok]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), (e) => {
          if (over) return; over = true; const right = ok(res);
          e.currentTarget.classList.add(right ? 'right' : 'wrong');
          if (right) { pts[s]++; ctx.sound.good(); } else ctx.sound.bad();
          say(msg, right ? '' : 'bad', `${right ? `Benar, +1 untuk Tim ${s + 1}` : 'Belum tepat'}: ${res.code} ${CODES[res.code]}${res.set ? ` dengan Set-Cookie ${res.set}` : ''}${res.loc ? `, pindah ke ${res.loc}` : ''}.`);
          k++; setTimeout(browser, 2600);
        }))), msg);
    }
    browser();
  }
  pickTeams(wrap, 'Peramban lawan Server', start);
}
