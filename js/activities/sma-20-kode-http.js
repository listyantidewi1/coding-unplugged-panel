// Di Balik Halaman Web — SMA/SMK (16–18 tahun), protokol HTTP, kode status, cookie, dan HTTPS.
// Order the journey of a page load, pick status codes, play the server that
// follows a rule book (including session cookies), see what an eavesdropper on
// public Wi-Fi reads over HTTP and HTTPS, count requests, and take a URL apart.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

const rulebook = (open = false) => el('details', { class: 'ht-buku', open }, el('summary', null, '📘 Buku aturan server'), el('table', { class: 'ht-tabel' },
  ...[['GET /jadwal, /pengumuman, /galeri, /masuk', '200 dan halamannya'], ['GET /pengumuman-lama', '301, pindah ke /pengumuman'], ['POST /masuk dengan sandi benar', '200, "Selamat datang", cookie sesi acak baru'], ['GET /pengurus dengan cookie sesi berlaku', '200 dan halaman pengurus'], ['GET /pengurus tanpa cookie atau cookie tidak berlaku', '403'], ['Alamat lain', '404']].map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, b)))));

// ---------- Permainan: Estafet Pesan Web ----------
// Three desks (Peramban, DNS, Server OSIS) and a courier who carries cards
// through the park where the eavesdropping team sits.

// A short courier run along the desk line.
function courier(host, { from = 0, to = 2, icon = '✉️', label = '', cb } = {}) {
  const st = [['📱', 'Peramban'], ['🕵️', 'Taman'], ['🗄️', 'Server OSIS']];
  const k = el('span', { class: 'wb20-kurir', style: { left: `${from * 50}%` } }, icon, label ? el('small', null, label) : null);
  fill(host, el('div', { class: 'wb20-jalur' }, st.map(([i, n], j) => el('span', { class: 'wb20-meja', style: { left: `${j * 50}%` } }, el('b', null, i), el('small', null, n))), k));
  requestAnimationFrame(() => requestAnimationFrame(() => { k.style.left = `${to * 50}%`; }));
  setTimeout(() => { if (host.isConnected) cb?.(); }, 900);
}

const STAMPS = [[200, 'OK'], [301, 'Pindah'], [403, 'Dilarang'], [404, 'Tak ada'], [500, 'Server rusak']];
const stampBtn = (c, n, fn) => onTap(el('button', { type: 'button', class: `wb20-cap k${String(c)[0]}` }, el('b', null, c), el('small', null, n)), fn);

// Misi 2: event cards; stamp the reply code. 404 and 500 also ask who fixes it.
function stampRound(wrap, ctx, { events, done }) {
  let n = 0;
  const area = el('div', { class: 'wb20-area' });
  wrap.append(el('div', { class: 'wb20-golongan' }, ['2xx berhasil', '3xx pindah', '4xx permintaan bermasalah', '5xx server bermasalah'].map((t, i) => el('span', { class: `k${i + 2}` }, t))), area);
  function show() {
    const [text, code] = events[n];
    const msg = el('p', { class: 'reveal info' }, 'Server menjawab dengan cap apa?');
    const tools = el('div', { class: 'wb20-cap-cap' });
    const reply = el('div', { class: 'wb20-balas' });
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `📨 Kejadian ${n + 1} dari ${events.length}`), el('b', null, text)), reply, tools, msg);
    let busy = false;
    fill(tools, STAMPS.map(([c, nm]) => stampBtn(c, nm, (e) => {
      if (busy) return;
      if (c !== code) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', c >= 500 ? 'Servernya baik-baik saja; lihat lagi permintaannya.' : code >= 500 ? 'Permintaannya wajar; ada yang rusak di sisi server.' : c === 404 && code === 403 ? 'Halamannya ada, tetapi peminta tidak berhak.' : c === 403 && code === 404 ? 'Peminta tidak dilarang; halamannya yang tidak ada.' : 'Bandingkan dengan golongan kodenya.'); return; }
      busy = true; ctx.sound.tap();
      fill(reply, el('span', { class: `wb20-stempel k${String(c)[0]}` }, `${c} ${CODES[c]}`));
      fill(tools);
      const next = () => { n++; if (n < events.length) setTimeout(() => { if (area.isConnected) show(); }, 1600); else { ctx.sound.good(); done(); } };
      if (code === 404 || code === 500) {
        say(msg, 'info', 'Siapa yang perlu memperbaikinya?');
        fill(tools, [['👧 Peminta atau pembuat tautan', 404], ['🛠️ Pengelola server', 500]].map(([l, w]) => button(l, (ev) => {
          if (w !== code) { ctx.mistake(); shake(ev?.currentTarget || tools); say(msg, 'bad', code === 404 ? 'Servernya benar: alamat yang diminta memang tidak ada.' : 'Peminta tidak berbuat salah.'); return; }
          fill(tools); say(msg, '', code === 404 ? `${code}: peminta memperbaiki alamatnya.` : `${code}: pengelola server memperbaiki programnya.`); next();
        })));
      } else { say(msg, '', `${c} ${CODES[c]}.`); next(); }
    })));
  }
  show();
}

// Misi 3: the request composer. Build the request card, predict the stamp, the server answers.
const GOALS = [
  { text: 'Dina ingin membuka halaman jadwal.', want: { method: 'GET', path: '/jadwal', cookie: null } },
  { text: 'Dina mengetuk tautan lama /pengumuman-lama di grup kelas.', want: { method: 'GET', path: '/pengumuman-lama', cookie: null } },
  { text: 'Dina salah ketik: /jadwl.', want: { method: 'GET', path: '/jadwl', cookie: null } },
  { text: 'Dina mencoba membuka halaman pengurus sebelum masuk.', want: { method: 'GET', path: '/pengurus', cookie: null } },
  { text: 'Dina masuk dengan nama pengguna dina dan kata sandi yang benar.', want: { method: 'POST', path: '/masuk', cookie: null } },
  { text: 'Dina membuka halaman pengurus dengan cookie dari dompetnya.', want: { method: 'GET', path: '/pengurus', cookie: 'sesi=7QK2MX' } },
  { text: 'Rudi mencoba cookie temuan sesi=AAAA11.', want: { method: 'GET', path: '/pengurus', cookie: 'sesi=AAAA11' } },
  { text: 'Dina sudah menekan "Keluar". Rudi mencoba sesi=7QK2MX yang sempat ia salin.', want: { method: 'GET', path: '/pengurus', cookie: 'sesi=7QK2MX' }, logout: true },
];
const PREDICT = [['200', (r) => r.code === 200 && !r.set], ['200 + cookie', (r) => r.code === 200 && !!r.set], ['301', (r) => r.code === 301], ['403', (r) => r.code === 403], ['404', (r) => r.code === 404]];
function relayRound(wrap, ctx, { goals, sessions, wallet, summary = '', paths = ['/jadwal', '/pengumuman-lama', '/jadwl', '/pengurus', '/masuk'], book = true, done }) {
  let n = 0; let q;
  const goalBox = el('div', { class: 'pp8-kejadian' });
  const comp = el('div', { class: 'wb20-susun' });
  const road = el('div', { class: 'wb20-jalan' });
  const tools = el('div', { class: 'wb20-cap-cap' });
  const msg = el('p', { class: 'reveal info' });
  const purse = el('div', { class: 'wb20-dompet' });
  const drawPurse = () => fill(purse, el('b', null, '👛 Dompet cookie'), wallet.length ? wallet.map((c) => el('code', null, c)) : el('small', null, '(kosong)'));
  function show() {
    const g = goals[n];
    if (g.logout) sessions.delete('7QK2MX');
    q = { method: 'GET', path: null, cookie: null };
    fill(goalBox, el('small', null, `🎯 Kartu tugas ${n + 1} dari ${goals.length}`), el('b', null, g.text));
    courier(road, { from: 0, to: 0, icon: '' }); fill(tools); drawPurse(); draw();
    say(msg, 'info', 'Susun kartu permintaannya, lalu kirim.');
  }
  function row(name, items, key) {
    return el('div', { class: 'wb20-baris' }, el('small', null, name), items.map(([v, l]) => onTap(el('button', { type: 'button', class: `wb20-chip ${q[key] === v ? 'on' : ''}` }, l), () => { q[key] = v; ctx.sound.tap(); draw(); })));
  }
  function draw() {
    fill(comp, row('Metode', [['GET', 'GET'], ['POST', 'POST']], 'method'), row('Jalur', paths.map((p) => [p, p]), 'path'),
      row('Cookie', [[null, 'tanpa'], ...[...new Set([...wallet, 'sesi=AAAA11'])].map((c) => [c, c === 'sesi=AAAA11' ? `${c} (temuan)` : c])], 'cookie'),
      el('div', { class: 'wb20-kartu-minta' }, el('code', null, `${q.method} ${q.path || '…'}${q.cookie ? `\nCookie: ${q.cookie}` : ''}`)),
      button('✉️ Kirim', (e) => send(e?.currentTarget), 'primary'));
  }
  function send(node) {
    const w = goals[n].want;
    if (!q.path) { shake(node); say(msg, 'info', 'Pilih jalurnya dulu.'); return; }
    if (q.method !== w.method || q.path !== w.path || q.cookie !== w.cookie) {
      ctx.mistake(); shake(comp);
      say(msg, 'bad', q.path !== w.path ? 'Jalurnya belum sesuai kartu tugas.' : q.method !== w.method ? (w.method === 'POST' ? 'Mengirim isian formulir memakai POST.' : 'Membuka halaman memakai GET.') : w.cookie ? `Sertakan cookie ${w.cookie}.` : 'Kartu tugas ini tidak memakai cookie.');
      return;
    }
    fill(comp, el('div', { class: 'wb20-kartu-minta kirim' }, el('code', null, `${q.method} ${q.path}${q.cookie ? `\nCookie: ${q.cookie}` : ''}`)));
    courier(road, { icon: '✉️', label: `${q.method} ${q.path}`, cb: () => predict() });
  }
  function predict() {
    const res = serve({ ...q, cookie: q.cookie }, sessions, () => '7QK2MX');
    say(msg, 'info', `Server menerima ${q.method} ${q.path}. Tebak capnya.`);
    let busy = false;
    fill(tools, PREDICT.map(([l, ok]) => onTap(el('button', { type: 'button', class: `wb20-cap k${l[0]}` }, el('b', null, l)), (e) => {
      if (busy) return;
      if (!ok(res)) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', q.cookie === 'sesi=AAAA11' ? 'Server tidak pernah membuat kode AAAA11.' : goals[n].logout ? 'Saat Dina keluar, server membatalkan kode itu.' : q.path === '/pengurus' && !q.cookie ? 'Tanpa cookie, server tidak tahu peminta adalah pengurus.' : 'Baca buku aturan server.'); return; }
      busy = true; ctx.sound.tap(); fill(tools);
      if (res.set && !wallet.includes(res.set)) wallet.push(res.set);
      const back = () => {
        const extra = res.loc ? serve({ method: 'GET', path: res.loc }, sessions) : null;
        say(msg, '', `${res.code} ${CODES[res.code]}${res.set ? `, Set-Cookie: ${res.set} disimpan di dompet` : ''}${res.loc ? `. Peramban otomatis mengirim GET ${res.loc} → ${extra.code}` : ''}.`);
        drawPurse(); n++;
        if (n < goals.length) setTimeout(() => { if (wrap.isConnected) show(); }, 2400); else { ctx.sound.good(); if (summary) say(msg, '', `${msg.textContent} ${summary}`); done(); }
      };
      courier(road, { from: 2, to: 0, icon: '📨', label: `${res.code}${res.set ? ' + cookie' : ''}`, cb: back });
    })));
  }
  wrap.append(book ? rulebook(false) : null, goalBox, el('div', { class: 'wb20-meja-kerja' }, comp, purse), road, tools, msg);
  show();
}

// Misi 4: Rudi guesses session codes.
function sessionGuess(wrap, ctx, { done }) {
  const secret = ctx.rand.int(0, 99);
  const tried = new Set();
  const grid = el('div', { class: 'wb20-papan-kode' });
  const msg = el('p', { class: 'reveal info' }, 'Kamu Tim Rudi. Kode sesi Dina hanya 2 angka. Ketuk 3 tebakan.');
  const area = el('div', { class: 'wb20-area' });
  const p2 = (x) => String(x).padStart(2, '0');
  const draw = (reveal = false) => fill(grid, Array.from({ length: 100 }, (_, i) => onTap(el('button', { type: 'button', class: `wb20-sel ${tried.has(i) ? (i === secret ? 'kena' : 'meleset') : ''} ${reveal && i === secret ? 'rahasia' : ''}` }, p2(i)), () => guess(i))));
  function guess(i) {
    if (tried.size >= 3 || tried.has(i)) return;
    tried.add(i); ctx.sound.tap(); draw(tried.size >= 3 || i === secret);
    if (i === secret) { say(msg, 'bad', `Tebakan ${p2(i)} kena! Rudi masuk sebagai Dina.`); setTimeout(() => { if (area.isConnected) wheels(); }, 2000); return; }
    if (tried.size === 3) { say(msg, 'info', `Kode Dina ${p2(secret)}. 3 tebakan dari 100 kemungkinan: peluang Rudi 3%, terlalu besar.`); setTimeout(() => { if (area.isConnected) wheels(); }, 2600); }
    else say(msg, 'info', `${p2(i)} salah. Sisa ${3 - tried.size} tebakan.`);
  }
  function wheels() {
    let base = 10; let len = 2;
    const out = el('div', { class: 'wb20-hitung' });
    const set = el('div', { class: 'wb20-roda' });
    const drawW = () => {
      const total = base ** len;
      fill(set, el('div', { class: 'wb20-baris' }, el('small', null, 'Karakter'), [[10, '0–9'], [26, 'A–Z'], [36, 'A–Z dan 0–9']].map(([v, l]) => onTap(el('button', { type: 'button', class: `wb20-chip ${base === v ? 'on' : ''}` }, `${l} (${v})`), () => { base = v; drawW(); }))),
        el('div', { class: 'wb20-baris' }, el('small', null, 'Panjang'), button('−', () => { len = Math.max(1, len - 1); drawW(); }), el('b', { class: 'wb20-angka' }, len), button('+', () => { len = Math.min(8, len + 1); drawW(); })));
      fill(out, el('code', null, `${base}`, el('sup', null, len), ` = ${total.toLocaleString('id-ID')} kemungkinan`));
    };
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, '🔧 Server diperbarui'), el('b', null, 'Kode sesi baru: 6 karakter dari A–Z dan 0–9, misalnya 7QK2MX.')), set, out,
      el('div', { class: 'wb20-cap-cap' }, button('✓ Ini ukuran kodenya', (e) => {
        if (base !== 36 || len !== 6) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', 'Atur roda sesuai kode baru: jenis karakter dan panjangnya.'); return; }
        ctx.sound.good(); fill(area.lastChild);
        say(msg, '', `36⁶ = 2.176.782.336 kemungkinan. 3 tebakan ≈ 1 banding 726 juta. Kode sesi harus acak dan panjang supaya tidak bisa ditebak.`);
        done();
      }, 'primary')));
    say(msg, 'info', 'Atur roda: berapa banyak kemungkinan kode sesi yang baru?');
    drawW();
  }
  wrap.append(grid, area, msg);
  draw();
}

// Misi 5: the eavesdropper in the park sorts what the sealed envelope still shows.
function sniffGame(wrap, ctx, { done }) {
  const area = el('div', { class: 'wb20-area' });
  const msg = el('p', { class: 'reveal info' }, 'Kurir membawa kartu pos HTTP melewati taman. Kamu penyadapnya: semuanya terbaca. Ganti sakelar ke HTTPS.');
  const post = el('div', { class: 'wb20-pos' }, el('b', null, '📮 Kartu pos (HTTP)'), SNIFF.map(([t]) => el('span', null, `👁 ${t}`)));
  const sw = el('div', { class: 'wb20-cap-cap' }, button('🔒 Ganti ke HTTPS', () => { ctx.sound.tap(); fill(sw); post.remove(); sortIt(); }, 'primary'));
  wrap.append(area, msg);
  fill(area, post, sw);
  function sortIt() {
    say(msg, 'info', 'Kini amplop bersandi. Pilah: apa yang masih terlihat dari luar amplop?');
    sortCards(area, ctx, {
      cards: SNIFF.map(([t, vis], i) => ({ id: `s${i}`, label: t, bin: vis ? 'lihat' : 'tutup' })),
      bins: [{ id: 'lihat', label: '👁 Masih terlihat (luar amplop)' }, { id: 'tutup', label: '🔒 Tersembunyi (isi amplop)' }],
      msg,
      why: (c, b) => (b === 'tutup' ? 'Bagian luar amplop tetap terlihat: ke mana dan seberapa besar.' : 'Isi amplop HTTPS tersandi.'),
      win: 'HTTPS menyembunyikan isi percakapan, tetapi tidak menyembunyikan bahwa Dina membuka situs OSIS, kapan, dan seberapa banyak datanya.',
      done,
    });
  }
}
// Tap a card, then a bin (shared by several missions).
function sortCards(host, ctx, { cards, bins, msg, why, win, done }) {
  let sel = null; const placed = {};
  const tray = el('div', { class: 'wb20-baki' });
  const box = el('div', { class: 'wb20-kotak-kotak' });
  function draw() {
    fill(tray, cards.filter((c) => !(c.id in placed)).map((c) => onTap(el('button', { type: 'button', class: `wb20-kartu ${sel === c.id ? 'pilih' : ''}` }, c.label), () => { sel = c.id; ctx.sound.tap(); draw(); })));
    fill(box, bins.map((b) => onTap(el('div', { class: `wb20-kotak ${b.id}` }, el('b', null, b.label), el('div', { class: 'wb20-isi' }, cards.filter((c) => placed[c.id] === b.id).map((c) => el('span', null, c.label)))), (e) => {
      if (!sel) { say(msg, 'info', 'Ketuk kartu dulu, lalu kotaknya.'); return; }
      const c = cards.find((x) => x.id === sel);
      if (c.bin !== b.id) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', why(c, b.id)); return; }
      placed[c.id] = b.id; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(placed).length === cards.length) { ctx.sound.good(); say(msg, '', win); done(); }
    })));
  }
  host.append(tray, box);
  draw();
}

// Misi 6: gallery race. Place each request in a courier lane and time slot.
const BERKAS = [['dns', 'DNS'], ['html', 'HTML'], ['css', 'gaya.css'], ['f1', 'foto1'], ['f2', 'foto2'], ['f3', 'foto3']];
function galleryRace(wrap, ctx, { done }) {
  const area = el('div', { class: 'wb20-area' });
  const msg = el('p', { class: 'reveal info' });
  wrap.append(area, msg);
  function stage(lanes) {
    let sel = null; const at = {};
    const tray = el('div', { class: 'wb20-baki' });
    const board = el('div', { class: 'wb20-galeri', style: { '--jalur': lanes } });
    const tools = el('div', { class: 'wb20-cap-cap' });
    const slotOf = (id) => at[id]?.[1];
    function draw() {
      fill(tray, BERKAS.filter(([id]) => !(id in at)).map(([id, l]) => onTap(el('button', { type: 'button', class: `wb20-kartu ${sel === id ? 'pilih' : ''}` }, l), () => { sel = id; ctx.sound.tap(); draw(); })));
      fill(board, el('span', { class: 'wb20-sudut' }, ''), Array.from({ length: 6 }, (_, s) => el('small', { class: 'wb20-waktu' }, `${(s * 0.2).toFixed(1).replace('.', ',')}–${((s + 1) * 0.2).toFixed(1).replace('.', ',')} d`)),
        Array.from({ length: lanes }, (_, l) => [el('b', { class: 'wb20-nama-kurir' }, `🏃 Kurir ${l + 1}`), Array.from({ length: 6 }, (_, s) => {
          const here = Object.entries(at).find(([, [a, b]]) => a === l && b === s);
          return onTap(el('div', { class: `wb20-petak ${here ? 'isi' : ''}` }, here ? BERKAS.find((x) => x[0] === here[0])[1] : ''), (e) => put(l, s, e.currentTarget, here));
        })]).flat(2));
    }
    function put(l, s, node, here) {
      if (here) { delete at[here[0]]; ctx.sound.tap(); draw(); return; }
      if (!sel) { say(msg, 'info', 'Ketuk berkas dulu, lalu petaknya.'); return; }
      const need = sel === 'dns' ? null : sel === 'html' ? 'dns' : 'html';
      if (need && !(need in at)) { ctx.mistake(); shake(node); say(msg, 'bad', need === 'dns' ? 'Peramban belum tahu alamat server: DNS dulu.' : 'Peramban baru tahu ada foto dan gaya.css setelah membaca HTML.'); return; }
      if (need && s <= slotOf(need)) { ctx.mistake(); shake(node); say(msg, 'bad', `${BERKAS.find((x) => x[0] === sel)[1]} harus menunggu ${need === 'dns' ? 'jawaban DNS' : 'HTML tiba'}.`); return; }
      at[sel] = [l, s]; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(at).length === BERKAS.length) finish();
    }
    function finish() {
      const end = (Math.max(...Object.values(at).map(([, s]) => s)) + 1) * 0.2;
      const t = end.toFixed(1).replace('.', ',');
      if (lanes === 1) { say(msg, '', `Satu kurir: (1 DNS + 5 GET) × 0,2 = ${t} detik.`); ctx.sound.good(); setTimeout(() => { if (area.isConnected) stage(4); }, 2600); return; }
      if (end > 0.61) { ctx.mistake(); say(msg, 'bad', `Galeri tampil ${t} detik. Empat kurir bisa berangkat bersamaan setelah HTML tiba.`); fill(tools, button('🔄 Susun ulang', () => { for (const k of Object.keys(at)) if (k !== 'dns' && k !== 'html') delete at[k]; fill(tools); draw(); say(msg, 'info', 'Letakkan gaya.css dan foto di kurir yang berbeda.'); })); return; }
      ctx.sound.good(); say(msg, '', `Empat kurir: DNS 0,2 + HTML 0,2 + empat berkas bersamaan 0,2 = ${t} detik, separuh waktu satu kurir.`); done();
    }
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `🏁 Balapan galeri · ${lanes === 1 ? 'satu kurir' : 'empat kurir'}`), el('b', null, '1 HTML + 1 gaya.css + 3 foto. Setiap tanya-jawab 0,2 detik.')), tray, board, tools);
    say(msg, 'info', lanes === 1 ? 'Ketuk berkas, lalu petak waktunya. Satu kurir hanya membawa satu pesan setiap 0,2 detik.' : 'Kini ada empat kurir setelah HTML tiba. Buat galeri tampil secepat mungkin.');
    draw();
  }
  stage(1);
}

// Misi 7 and Bos: label the URL parts, then decide where each goes.
function urlLabels(host, ctx, { parts, msg, done }) {
  let sel = null; const got = {};
  const tray = el('div', { class: 'wb20-baki' });
  const line = el('div', { class: 'wb20-url' });
  const names = parts.filter((p) => p[1]).map((p) => p[1]);
  function draw() {
    fill(tray, ctx.rand.shuffle(names.filter((n) => !Object.values(got).includes(n))).map((n) => onTap(el('button', { type: 'button', class: `wb20-kartu ${sel === n ? 'pilih' : ''}` }, n), () => { sel = n; ctx.sound.tap(); draw(); })));
    fill(line, parts.map(([t, name], i) => (name ? onTap(el('button', { type: 'button', class: `wb20-bagian ${got[i] ? 'kena' : ''}` }, el('code', null, t), el('small', null, got[i] || '?')), (e) => {
      if (got[i]) return;
      if (!sel) { say(msg, 'info', 'Ketuk label dulu, lalu bagian alamatnya.'); return; }
      if (sel !== name) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `"${t}" bukan ${sel}.`); return; }
      got[i] = name; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === names.length) done();
    }) : el('code', { class: 'wb20-pisah' }, t))));
  }
  host.append(line, tray);
  draw();
  return { clear: () => tray.remove() };
}
function urlRound20(wrap, ctx, { done }) {
  const area = el('div', { class: 'wb20-area' });
  const msg = el('p', { class: 'reveal info' }, 'Tempelkan label ke bagian alamat yang tepat.');
  wrap.append(area, msg);
  const u = urlLabels(area, ctx, { parts: URL_PARTS, msg, done: () => {
    u.clear(); ctx.sound.good();
    say(msg, 'info', 'Label lengkap. Sekarang: bagian mana dikirim ke DNS, ke server, atau tidak pernah dikirim?');
    sortCards(area, ctx, {
      cards: [['nama', SITE, 'dns'], ['jalur', '/galeri', 'server'], ['kueri', '?tahun=2026', 'server'], ['frag', '#foto3', 'tidak']].map(([id, label, bin]) => ({ id, label, bin })),
      bins: [{ id: 'dns', label: '📒 Ke meja DNS' }, { id: 'server', label: '🗄️ Ke server (di dalam GET)' }, { id: 'tidak', label: '🚫 Tidak pernah dikirim' }],
      msg,
      why: (c) => (c.id === 'frag' ? 'Fragmen hanya dipakai peramban untuk melompat ke bagian halaman.' : c.id === 'nama' ? 'Nama situs ditanyakan dulu untuk mendapat alamat IP.' : 'Server perlu tahu halaman dan kuerinya.'),
      win: 'DNS menerima nama situs; server menerima GET /galeri?tahun=2026; #foto3 tetap di peramban.',
      done,
    });
  } });
}
function bossUrl(wrap, ctx, { done }) {
  const parts = [['https', 'protokol'], ['://', null], ['coding-unplugged-panel.vercel.app', 'nama situs'], ['/', 'jalur'], ['#/sma-20-kode-http', 'fragmen']];
  const area = el('div', { class: 'wb20-area' });
  const msg = el('p', { class: 'reveal info' }, 'Alamat halaman yang sedang kamu buka. Tempelkan labelnya.');
  wrap.append(el('div', { class: 'pp8-kejadian' }, el('small', null, '🪞 Alamat aktivitas ini'), el('b', null, `Fragmen di peramban ini: ${(location.hash.split('?')[0] || '#/sma-20-kode-http')}`)), area, msg);
  const u = urlLabels(area, ctx, { parts, msg, done: () => {
    u.clear(); ctx.sound.good();
    say(msg, 'info', 'Kartu permintaan apa yang dibawa kurir ke server Vercel?');
    fill(area, area.firstChild, el('div', { class: 'wb20-cap-cap' }, ctx.rand.shuffle([['GET /', true], ['GET /sma-20-kode-http', 'Itu fragmen, bukan jalur.'], ['GET /#/sma-20-kode-http', 'Fragmen tidak pernah dikirim.']]).map(([l, ok]) => button(l, (e) => {
      if (ok !== true) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', ok); return; }
      ctx.sound.tap();
      const road = el('div', { class: 'wb20-jalan' });
      fill(area, area.firstChild, road);
      courier(road, { icon: '✉️', label: 'GET /', cb: () => courier(road, { from: 2, to: 0, icon: '📨', label: '200 + halaman utama', cb: who }) });
    }))));
  } });
  function who() {
    say(msg, 'info', 'Server mengirim halaman utama yang sama untuk semua aktivitas. Siapa yang memilih aktivitas sma-20?');
    area.append(el('div', { class: 'wb20-cap-cap' }, ctx.rand.shuffle([['🗄️ Server Vercel', false], ['🧠 Program di halaman, membaca fragmen', true], ['📒 Server DNS', false]]).map(([l, ok]) => button(l, (e) => {
      if (!ok) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', 'Pihak itu tidak pernah melihat fragmen.'); return; }
      ctx.sound.good(); fill(e.currentTarget.parentNode);
      say(msg, '', 'Server hanya menerima GET /. Program di halaman membaca #/sma-20-kode-http lalu memilih aktivitasnya, jadi semua aktivitas bisa dibuka tanpa server pintar.');
      done();
    }))));
  }
}

const HEAD20 = {
  urut: ['Perjalanan Halaman', 'Urutkan perjalanan halaman dari Enter sampai tampil.'],
  kode: ['Tebak Kode Balasan', 'Server menjawab dengan cap kode. Pilih capnya.'],
  estafet: ['Estafet Peramban dan Server', 'Susun kartu permintaan, kirim lewat kurir, tebak cap balasannya.'],
  sesi: ['Cap Tangan Digital', 'Tim Rudi menebak kode sesi. Seberapa sulit?'],
  sadap: ['Penyadap di Taman', 'Kartu pos atau amplop bersandi: apa yang terbaca penyadap?'],
  galeri: ['Balapan Galeri', 'Bawa semua berkas galeri secepat mungkin.'],
  alamat: ['Bedah Alamat', 'Tempelkan label pada bagian alamat web.'],
  boss: ['Alamat Aktivitas Ini', 'Apa yang diterima server saat halaman ini dibuka?'],
};

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
    const wrap = el('div', { class: 'act kode-http wb20-main' });
    root.append(wrap);
    const acak = ctx.rand.shuffle([...MORE_EVENTS]).slice(0, 6);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD20[k], '🌐'));
      if (r === 0) { head('urut', 1); orderRound(wrap, ctx, { done: () => next(3000) }); }
      else if (r === 1) { head('kode', 2); stampRound(wrap, ctx, { events: EVENTS, done: () => next(3000) }); }
      else if (r === 2) { head('estafet', 3); relayRound(wrap, ctx, { goals: GOALS.slice(0, 4), sessions: new Set(), wallet: [], summary: 'Empat kartu: 200, 301 lalu 200, 404, 403.', done: () => next(4000) }); }
      else if (r === 3) { head('estafet', 3); relayRound(wrap, ctx, { goals: GOALS.slice(4), sessions: new Set(), wallet: [], summary: 'Sesi yang dibatalkan saat keluar tidak berlaku lagi, walau kodenya disalin.', done: () => next(5000) }); }
      else if (r === 4) { head('sesi', 4); sessionGuess(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 5) { head('sadap', 5); sniffGame(wrap, ctx, { done: () => next(6400) }); }
      else if (r === 6) { head('galeri', 6); galleryRace(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 7) { head('alamat', 7); urlRound20(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 8) { head('kode', 2); stampRound(wrap, ctx, { events: acak, done: () => next(3000) }); }
      else { head('boss', 'Bos'); bossUrl(wrap, ctx, { done: () => next(7000) }); }
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
