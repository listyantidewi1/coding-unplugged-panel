// Aplikasi Web Nomor Antrean — SMA/SMK (16–18 tahun), coding. The Desa Sukamaju
// queue page: HTML ids, the DOM tree, getElementById returning null for the
// nomor_anda typo, click handlers that keep counting after the error, Sari's
// "A" + terakhir + 1, the Panggil button with the dipanggil < terakhir guard,
// Dodi's true, and <script> in <head> without defer. Worksheet programs run in a
// small page model (ids in source order, handlers, textContent); pupils' own code
// runs in a sandboxed iframe with a console that shows Chromium-style messages.

import { el, onTap, button } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots } from './misi-kit.js';

export const HTML1 = ['<!DOCTYPE html>', '<html lang="id">', '<head>', '  <meta charset="utf-8">', '  <title>Antrean Kantor Desa</title>', '</head>', '<body>', '  <h1>Antrean Pelayanan Kantor Desa Sukamaju</h1>', '  <p>Nomor Anda: <span id="nomor-anda">-</span></p>', '  <button id="tombol-ambil">Ambil nomor</button>', '  <p>Sedang dipanggil: <span id="nomor-dipanggil">-</span></p>', '  <script src="antrean.js"></script>', '</body>', '</html>'];
export const HTML2 = [...HTML1.slice(0, 11), '  <button id="tombol-panggil">Panggil berikutnya</button>', ...HTML1.slice(11)];
export const HTML_HEAD = [...HTML1.slice(0, 5), '  <script src="antrean.js"></script>', '</head>', ...HTML1.slice(6, 11), '</body>', '</html>'];
export const HTML_DEFER = HTML_HEAD.map((x) => (x.includes('<script') ? '  <script src="antrean.js" defer></script>' : x));
export const JS1 = ['let terakhir = 0;', 'const tombolAmbil = document.getElementById("tombol-ambil");', 'const layarNomor = document.getElementById("nomor_anda");', 'tombolAmbil.addEventListener("click", function () {', '  terakhir = terakhir + 1;', '  layarNomor.textContent = "A" + terakhir;', '});'];
export const JS2 = JS1.map((x, i) => (i === 2 ? 'const layarNomor = document.getElementById("nomor-anda");' : x));
export const JS_SARI = [...JS2.slice(0, 4), '  layarNomor.textContent = "A" + terakhir + 1;', '});'];
export const PANGGIL = ['let dipanggil = 0;', 'const tombolPanggil = document.getElementById("tombol-panggil");', 'const layarPanggil = document.getElementById("nomor-dipanggil");', 'tombolPanggil.addEventListener("click", function () {', '  if (dipanggil < terakhir) {', '    dipanggil = dipanggil + 1;', '    layarPanggil.textContent = "A" + dipanggil;', '  } else {', '    layarPanggil.textContent = "Tidak ada antrean";', '  }', '});'];
export const JS3 = [...JS2, ...PANGGIL];
export const JS_DODI = JS3.map((x, i) => (i === 11 ? '  if (true) {' : x));
export const PANGGIL_KOSONG = PANGGIL.map((x, i) => (i === 1 ? 'const tombolPanggil = document.getElementById(..............................);' : i === 3 ? 'tombolPanggil.addEventListener(.........., function () {' : i === 4 ? '  if (..............................) {' : x));
export const SEMBILAN = ['Ambil', 'Ambil', 'Panggil', 'Ambil', 'Panggil', 'Panggil', 'Panggil', 'Ambil', 'Panggil'];
const TOMBOL = { Ambil: 'tombol-ambil', Panggil: 'tombol-panggil' };

const q = (s) => JSON.stringify(s);
const uniq = (xs) => [...new Set(xs)];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// ---- page model: elements with id in source order, script tags, handlers ----
export function halaman(html) {
  const src = Array.isArray(html) ? html.join('\n') : html;
  const els = {}; const order = [];
  for (const m of src.matchAll(/<([A-Za-z][\w-]*)([^>]*)>([^<]*)/g)) { const id = (m[2].match(/\bid\s*=\s*"([^"]*)"/) || [])[1]; if (id !== undefined && !(id in els)) { els[id] = { tag: m[1].toLowerCase(), id, pos: m.index, awal: m[3] }; order.push(id); } }
  const sc = [...src.matchAll(/<script\b([^>]*)>\s*<\/script>/gi)].map((x) => ({ pos: x.index, src: (x[1].match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1], defer: /\bdefer\b/i.test(x[1]) }));
  return { src, els, order, sc };
}
// Errors as Chromium shows them, whatever engine runs the code; src is the failing source line.
export function chromify(type, msg, src = '') {
  msg = String(msg).replace(/^Uncaught\s+/, '').replace(new RegExp(`^${type}:\\s*`), '');
  if (type === 'TypeError' && !/^Cannot (read|set) properties of/.test(msg) && /(is (null|undefined)|is not an object|can't access property)/.test(msg)) {
    const nil = (msg.match(/\b(null|undefined)\b/) || [])[1] || 'null';
    const fx = msg.match(/can't access property "([^"]+)"/); const set = src.match(/\.([A-Za-z_$][\w$]*)\s*=(?!=)/); const rd = src.match(/\.([A-Za-z_$][\w$]*)/);
    msg = !fx && set ? `Cannot set properties of ${nil} (setting '${set[1]}')` : `Cannot read properties of ${nil} (reading '${fx ? fx[1] : rd ? rd[1] : '?'}')`;
  }
  if (type === 'ReferenceError') { const m = msg.match(/^Can't find variable: (.+)$/); if (m) msg = `${m[1]} is not defined`; }
  return `Uncaught ${type}: ${msg}`;
}
const nilai = (v) => (v === null ? 'null' : v === undefined ? 'undefined' : v && v.__el ? `<${v.tag}#${v.id}>` : typeof v === 'string' ? q(v) : String(v));
// Line-start markers so every executed statement reports its line number and the variables.
function instrumen(lines) {
  let prev = ';';
  return lines.map((x, i) => { const t = x.trim(); const ok = t && !t.startsWith('}') && !t.startsWith('//') && /[;{}]$/.test(prev); if (t) prev = t; return ok ? `__j(${i + 1});${x}` : x; }).join('\n');
}
// Run a worksheet program on a page: returns the model with klik(id), the console and a trace per event.
export function muat(html, js, { confirmJawab = true } = {}) {
  const H = halaman(html); const lines = Array.isArray(js) ? js : js.split('\n');
  const S = { H, lines, konsol: [], kejadian: [], teks: {}, loading: true, galat: null };
  for (const id of H.order) S.teks[id] = H.els[id].awal;
  const node = {};
  for (const id of H.order) { const e = H.els[id]; node[id] = { __el: true, tag: e.tag, id, _l: {}, addEventListener(type, f) { (this._l[type] = this._l[type] || []).push(f); }, get textContent() { return S.teks[id]; }, set textContent(v) { S.teks[id] = String(v); } }; }
  const sc = H.sc.find((s) => s.src === 'antrean.js');
  const batas = !sc ? -1 : sc.defer ? Infinity : sc.pos;
  const document = { getElementById: (id) => { const e = H.els[String(id)]; return e && !(S.loading && e.pos > batas) ? node[String(id)] : null; } };
  const nama = uniq([...lines.join('\n').matchAll(/\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  let cur = null; const vars = () => { const o = {}; try { Object.assign(o, S.get()); } catch (e) { /* not yet declared */ } return o; };
  const __j = (n) => { if (cur) cur.langkah.push({ baris: n, vars: vars() }); };
  const konsol = { log: (...a) => S.konsol.push({ k: 'log', s: a.map((x) => (typeof x === 'string' ? x : nilai(x))).join(' ') }) };
  konsol.error = konsol.log; konsol.warn = konsol.log; konsol.info = konsol.log;
  const jalan = (label, f) => {
    cur = { label, langkah: [], galat: null }; S.kejadian.push(cur);
    try { f(); } catch (e) { const n = cur.langkah.at(-1)?.baris ?? 0; cur.galat = { baris: n, pesan: chromify(e?.name || 'Error', e?.message ?? e, lines[n - 1] || '') }; S.konsol.push({ k: 'galat', s: cur.galat.pesan, baris: n }); }
    cur.akhir = vars(); const c = cur; cur = null; return c;
  };
  S.get = () => ({});
  const getter = `__g.f = function () { var o = {}; ${nama.map((n) => `try { o[${q(n)}] = ${n}; } catch (e) {}`).join(' ')} return o; };`;
  if (sc) {
    let fn = null;
    try { fn = new Function('document', 'console', 'confirm', '__j', '__g', `${getter}\n${instrumen(lines)}`); } catch (e) { S.konsol.push({ k: 'galat', s: chromify(e.name, e.message), baris: 0 }); }
    if (fn) { const g = {}; S.get = () => (g.f ? g.f() : {}); jalan('Halaman dibuka', () => fn(document, konsol, () => confirmJawab, __j, g)); }
  } else S.konsol.push({ k: 'log', s: 'antrean.js tidak dimuat oleh halaman ini.' });
  S.loading = false;
  S.klik = (id, label = id) => { const n = node[id]; const fs = n?._l.click || []; return jalan(label, () => { for (const f of fs) f.call(n, { type: 'click', target: n }); }); };
  S.vars = vars; S.node = node;
  return S;
}
// A click sequence: the table row after each event.
export function urutan(html, js, seq) {
  const S = muat(html, js); const rows = [];
  for (const b of seq) { const k = S.klik(TOMBOL[b] || b, b); rows.push({ b, baris: k.langkah.map((x) => x.baris), galat: k.galat, ...S.vars(), anda: S.teks['nomor-anda'], panggil: S.teks['nomor-dipanggil'], sisa: S.teks.sisa }); }
  return { S, rows };
}

// Hidden bugs for the race round (one per seed): what the page shows and what fixes it.
const SEBAB = ['id di JavaScript tidak sama dengan id di HTML', '<script> dijalankan sebelum tombol dibuat', 'nama kejadian salah tulis', 'nama properti salah tulis (huruf besar dan kecil dibedakan)'];
export const BUG = [
  { html: HTML1, js: JS1, sebab: SEBAB[0], fix: 'JavaScript baris 3: "nomor-anda"' },
  { html: HTML1.map((x) => x.replace('id="tombol-ambil"', 'id="tombol_ambil"')), js: JS2, sebab: SEBAB[0], fix: 'HTML baris 10: id="tombol-ambil"' },
  { html: HTML_HEAD, js: JS2, sebab: SEBAB[1], fix: 'tambahkan defer pada <script>, atau pindahkan ke akhir <body>' },
  { html: HTML1, js: JS2.map((x) => x.replace('"click"', '"klik"')), sebab: SEBAB[2], fix: 'JavaScript baris 4: "click"' },
  { html: HTML1, js: JS2.map((x) => x.replace('.textContent', '.textcontent')), sebab: SEBAB[3], fix: 'JavaScript baris 6: textContent' },
];
const FIXES = BUG.map((b) => b.fix);

// ---- Permainan: Teater Peramban ----
// The team plays the browser running the Desa Sukamaju queue page: it builds
// the DOM tree, clicks the live page, predicts what the handler writes, moves
// the script tag, reloads, and fights Si Null, who is handed over silently by
// getElementById and only explodes when used.
const HEAD51 = {
  pohon: ['Bangun Pohon DOM', 'Jadilah peramban: baca HTML dari atas dan tempelkan kartu elemen menjadi pohon.', 'Aku bersembunyi di balik id yang salah…'],
  klik: ['Tiga Klik Pertama', 'Buka halaman, lalu klik Ambil nomor tiga kali.', 'getElementById menyerahkanku tanpa protes!'],
  tangkap: ['Tangkap Si Null', 'Cari baris yang menghasilkan null, lalu perbaiki id-nya.', 'Garis bawah atau tanda hubung? Hihi.'],
  petugas: ['Tombol Petugas', 'Pasang tombol Panggil, lalu jalankan kejadian 1–5.', 'Panggil terus, walau antrean kosong!'],
  sisa: ['Antrean Habis', 'Jalankan kejadian 6–9, lalu uji versi Dodi.', 'Dodi menulis true, aku senang!'],
  bangun: ['Kapan Kode Bangun?', 'Pindahkan script ke head, lalu muat ulang halaman.', 'Tombolnya belum lahir saat kode jalan!'],
  ulang: ['Tombol Muat Ulang', 'Ambil nomor sampai A5, lalu muat ulang halaman.', 'Muat ulang, semua lupa!'],
  uji: ['Penulis lawan Penguji', 'Susun penangan Ulangi panggilan, lalu ujilah.', 'Ulangi sebelum ada panggilan? Coba saja!'],
  bug: ['Bug Tersembunyi', 'Halaman ini rusak. Temukan baris penyebabnya.', 'Satu huruf saja sudah cukup.'],
  bos: ['Nomor yang Tak Terlupa', 'Simpan nomor di localStorage agar selamat dari muat ulang.', 'Muat ulang menghapus semuanya!'],
};
const msg51 = (t) => el('p', { class: 'reveal info' }, t);
const dua51 = (...k) => el('div', { class: 'tp51-dua' }, ...k);
const kol51 = (...k) => el('div', { class: 'tp51-kolom' }, ...k);
const ID51 = { Ambil: 'tombol-ambil', Panggil: 'tombol-panggil', Ulangi: 'tombol-ulang' };

// Long JavaScript lines broken inside the statement (about 40 characters per row).
function pecah(lines, dari = 1) {
  const teks = []; const labels = []; const asal = [];
  lines.forEach((x, i) => {
    const ind = x.match(/^ */)[0]; let parts = [x];
    if (x.length > 44) {
      const d = x.indexOf(' = document'); const p = x.indexOf('('); const s = x.indexOf(' = ');
      if (d > 0) parts = [x.slice(0, d + 2), `${ind}  ${x.slice(d + 3)}`];
      else if (p > 0 && x.indexOf(' = ') < 0) parts = [x.slice(0, p + 1), `${ind}  ${x.slice(p + 1)}`];
      else if (s > 0) parts = [x.slice(0, s + 2), `${ind}  ${x.slice(s + 3)}`];
    }
    parts.forEach((t, j) => { teks.push(t); labels.push(j ? '' : String(dari + i)); asal.push(dari + i); });
  });
  return { teks, labels, asal };
}
function jsView(lines, { dari = 1, hl = [], warn = [], onLine = null, cls = '' } = {}) {
  const P = pecah(lines, dari); const idx = (ns) => P.asal.map((a, r) => (ns.includes(a) ? r : -1)).filter((r) => r >= 0);
  return codeView(P.teks, { labels: P.labels, hl: idx(hl), warn: idx(warn), cls: `${cls} ${onLine ? 'ketuk' : ''}`, onLine: onLine ? (r, row) => onLine(P.asal[r], row) : null });
}
function varKartu(S, keys) {
  const v = S.vars();
  return el('div', { class: 'tp51-vars' }, keys.map((k) => { const x = v[k]; return el('span', { class: `tp51-var ${x === null ? 'null' : ''}` }, el('b', null, k), x === null ? '👻 null' : x === undefined ? '?' : nilai(x)); }));
}
const konsol51 = (S, n = 2) => konsolView(S.konsol.slice(-n));
const halaman51 = (S, onKlik) => halamanView(S, onKlik ? { onKlik } : { pasif: true });
const muatBtn = (f) => button('🔄 Muat Ulang', f, 'tp51-muat');

// Misi 1: build the DOM tree, then answer getElementById as the tree keeper.
const NODE51 = [['html', '<html>', 0, 2], ['head', '<head>', 1, 3], ['meta', '<meta>', 2, 4], ['title', '<title>', 2, 5], ['body', '<body>', 1, 7], ['h1', '<h1>', 2, 8], ['p1', '<p> Nomor Anda:', 2, 9], ['sa', '<span id="nomor-anda">', 3, 9], ['btn', '<button id="tombol-ambil">', 2, 10], ['p2', '<p> Sedang dipanggil:', 2, 11], ['sd', '<span id="nomor-dipanggil">', 3, 11], ['script', '<script>', 2, 12]];
const IDS51 = { sa: 'nomor-anda', btn: 'tombol-ambil', sd: 'nomor-dipanggil' };
function pohonRound(area, ctx, { oops, done }) {
  const msg = msg51('Baca HTML dari atas. Tempelkan setiap kartu elemen ke tempatnya di pohon.'); const kiri = kol51(); const kanan = kol51(); const got = new Set();
  const htmlWin = (line) => { const s = Math.max(0, Math.min(HTML1.length - 8, line - 3)); return codeView(HTML1.slice(s, s + 8), { labels: lab(s + 1, 8), hl: [line - 1 - s], cls: 'html' }); };
  const susun = tileSlots(ctx, { oops, msg, build: NODE51.map(([id, , ind]) => [id, ind]), tiles: NODE51.map(([id, t]) => [id, t]), order: 'Peramban membaca HTML dari atas ke bawah: kartu ini muncul lebih belakang.',
    onFull: () => { say(msg, 'info', 'Pohon jadi! Sekarang jadilah Penjaga Pohon: ketuk elemen yang bisa ditemukan getElementById.'); fill(kiri, halaman51(muat(HTML1, JS2))); fill(kanan, pohonTap()); } });
  susun.classList.add('tp51-susun');
  new MutationObserver(() => { const n = susun.querySelectorAll('.mk-slot.isi').length; if (n < NODE51.length) fill(kiri, htmlWin(NODE51[n][3])); }).observe(susun, { subtree: true, childList: true });
  const pohonTap = () => el('div', { class: 'tp51-pohon' }, NODE51.map(([id, t, ind]) => onTap(el('button', { type: 'button', class: `tp51-node ${got.has(id) ? 'dapat' : ''}`, 'data-id': id, style: { marginLeft: `${ind * 1.4}em` } }, t), () => tap(id))));
  function tap(id) {
    if (got.size >= 3 || got.has(id)) return;
    if (!IDS51[id]) { oops(); say(msg, 'bad', `${NODE51.find((n) => n[0] === id)[1]} tidak punya id: getElementById tidak bisa menemukannya.`); return; }
    got.add(id); ctx.sound.tap(); fill(kanan, pohonTap());
    if (got.size < 3) { say(msg, 'info', `getElementById("${IDS51[id]}") → ketemu.`); return; }
    say(msg, '', 'Hanya dua span dan tombol yang punya id, karena hanya mereka yang diubah atau diklik kode. Si Null muncul bila id-nya salah tulis.'); done();
  }
  fill(kiri, htmlWin(2)); fill(kanan, susun);
  area.append(dua51(kiri, kanan), msg);
}

// Misi 2: open the page, then three clicks with Si Null inside layarNomor.
function klikRound(area, ctx, { oops, done }) {
  const msg = msg51('Halaman dibuka: baris 1–4 berjalan. Apa isi layarNomor?'); const S = muat(HTML1, JS1); let n = 0; let siap = false; let last = S.kejadian[0];
  const kiri = kol51(); const kanan = kol51();
  const draw = () => { fill(kiri, jsView(JS1.slice(2), { dari: 3, hl: last.langkah.map((x) => x.baris), warn: last.galat ? [last.galat.baris] : [] }), varKartu(S, siap ? ['terakhir', 'tombolAmbil', 'layarNomor'] : ['terakhir', 'tombolAmbil']));
    fill(kanan, halaman51(S, siap && n < 3 ? klik : null), siap ? konsol51(S) : null); };
  function klik(id) {
    if (id !== 'tombol-ambil' || n >= 3) return; last = S.klik(id); n++; ctx.sound.tap(); draw();
    if (n < 3) { say(msg, 'info', `Klik ${n}: terakhir menjadi ${S.vars().terakhir}, lalu baris 6 meledak. Klik lagi.`); return; }
    say(msg, 'info', 'Tiga klik. Apa yang terlihat?');
    fill(kanan, halaman51(S), fillBoard(ctx, { oops, msg, view: rowsView([['terakhir = ', '_'], ['Nomor Anda: ', '_'], ['galat di baris ', '_']]), chips: ['3', '0', '"-"', '"A3"', '6', '5'], want: ['3', '"-"', '6'],
      hints: ['Baris 5 tetap berjalan sebelum galat.', 'Baris 6 gagal, jadi tulisannya tidak pernah diganti.', 'Lihat baris merah dan konsol.'],
      done: () => { say(msg, '', 'Galat hanya menghentikan satu klik: terakhir terus bertambah, layar tetap "-". Si Null menang ronde ini!'); done(); } }));
  }
  draw();
  kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['layarNomor = ', '_']]), chips: ['null', '<span#nomor-anda>', '"-"'], want: ['null'], hints: ['Cari "nomor_anda" di HTML: tidak ada. getElementById mengembalikan null tanpa galat.'],
    done: () => { siap = true; draw(); say(msg, 'info', '👻 Si Null masuk ke layarNomor tanpa galat. Sekarang klik Ambil nomor tiga kali.'); } }));
  area.append(dua51(kiri, kanan), msg);
}

// Misi 3: find the null line, fix the id, then Sari's "A" + terakhir + 1.
function tangkapRound(area, ctx, { oops, done }) {
  const msg = msg51('Baris mana yang menyerahkan Si Null ke layarNomor? Ketuk.'); const kiri = kol51(); const kanan = kol51(); let fase = 0; let n = 0; let S = null;
  const sari = urutan(HTML1, JS_SARI, ['Ambil', 'Ambil']).rows; const jawabSari = `${sari[0].anda} dan ${sari[1].anda}`;
  const draw = () => {
    fill(kiri, jsView(JS1.slice(1, 6), { dari: 2, warn: fase > 0 ? [3] : [], onLine: fase === 0 ? jsTap : null }));
    fill(kanan, codeView(HTML1.slice(7, 11), { labels: lab(8, 4), cls: `html ${fase === 1 ? 'ketuk' : ''}`, hl: fase > 1 ? [1] : [], onLine: fase === 1 ? htmlTap : null }));
  };
  function jsTap(no) {
    if (fase !== 0) return;
    if (no !== 3) { oops(); say(msg, 'bad', no === 6 ? 'Baris 6 hanya tempat Si Null meledak. Dari mana layarNomor mendapat null?' : 'Baris ini tidak menghasilkan null.'); return; }
    fase = 1; ctx.sound.tap(); draw(); say(msg, 'info', 'Baris 3 mencari "nomor_anda". Ketuk baris HTML yang memuat id sebenarnya.');
  }
  function htmlTap(i) {
    if (fase !== 1) return;
    if (i !== 1) { oops(); say(msg, 'bad', i === 2 ? 'Itu id tombol. Cari span untuk Nomor Anda.' : 'Baris ini tidak memuat id untuk Nomor Anda.'); return; }
    fase = 2; ctx.sound.tap(); draw(); say(msg, 'info', 'Garis bawah lawan tanda hubung! Perbaiki baris 3.');
    kanan.append(fillBoard(ctx, { oops, msg, view: codeFill(['const layarNomor =', ['  document.getElementById(', '_', ');']], { labels: ['3', ''] }), chips: ['"nomor-anda"', '"nomor_anda"', 'nomor-anda', '"#nomor-anda"'], want: ['"nomor-anda"'], hints: ['Tulis id persis seperti di HTML, sebagai teks dalam tanda kutip, tanpa #.'],
      done: () => { fase = 3; S = muat(HTML1, JS2); say(msg, 'info', 'Si Null tertangkap. Klik Ambil nomor dua kali.'); live(); } }));
  }
  const live = () => { fill(kiri, jsView(JS2.slice(1, 6), { dari: 2, hl: [3] }), varKartu(S, ['terakhir', 'layarNomor'])); fill(kanan, halaman51(S, n < 2 ? klik : null)); };
  function klik(id) {
    if (fase !== 3 || id !== 'tombol-ambil' || n >= 2) return; S.klik(id); n++; ctx.sound.tap(); live();
    if (n < 2) { say(msg, 'info', `Nomor Anda: ${S.teks['nomor-anda']}. Klik sekali lagi.`); return; }
    say(msg, 'info', `Berhasil: ${S.teks['nomor-anda']}. Sari mencoba versinya sendiri…`);
    fill(kiri, jsView(JS_SARI.slice(3), { dari: 4, warn: [5] }));
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['versi Sari, klik 1 dan klik 2: ', '_']]), chips: [jawabSari, 'A1 dan A2', 'A01 dan A02', 'A11 dan A21'], want: [jawabSari],
      hints: ['Sari tidak menaikkan terakhir, dan "A" + 0 sudah menjadi teks sebelum + 1 disambung.'], done: () => { say(msg, '', `"A" + terakhir + 1 menyambung teks: ${sari[0].anda} selamanya. Tulis "A" + (terakhir + 1) bila perlu menjumlah dulu.`); done(); } }));
  }
  draw();
  area.append(dua51(kiri, kanan), msg);
}

// Click events on the live page: predict what the handler writes, then click.
function acara51(ctx, { oops, msg, html, js, seq, from = 0, to = seq.length, ramal, pool, hint, layarId = 'nomor-dipanggil', kode = null, onEnd }) {
  const S = muat(html, js); for (let j = 0; j < from; j++) S.klik(ID51[seq[j]], seq[j]);
  let k = from; let tebak = false; let last = null; const kiri = kol51(); const kanan = kol51();
  const want = () => { const T = muat(html, js); for (let j = 0; j <= k; j++) T.klik(ID51[seq[j]], seq[j]); return T.teks[layarId]; };
  const antre = () => { const v = S.vars(); const a = v.terakhir || 0; const d = Math.min(v.dipanggil || 0, a);
    return el('div', { class: 'tp51-antre' }, el('b', null, 'menunggu'), a > d ? Array.from({ length: a - d }, (_, i) => el('span', { class: 'tp51-warga' }, `🧍A${d + i + 1}`)) : el('span', { class: 'tp51-kosong' }, 'kosong')); };
  const draw = () => {
    fill(kiri, kode ? kode(last) : null, varKartu(S, ['terakhir', 'dipanggil']), antre());
    const w = k < to && ramal(seq[k]) && !tebak ? want() : null;
    fill(kanan, el('div', { class: 'tp51-strip', 'data-tombol': k < to ? seq[k] : '' }, seq.slice(from, to).map((b, j) => el('code', { class: from + j === k ? 'aktif' : from + j < k ? 'beres' : '' }, `${from + j + 1}. ${b}`))),
      halaman51(S, k < to ? klik : null),
      w !== null ? el('div', { class: 'tp51-ramal', 'data-want': w }, el('b', null, 'Sedang dipanggil sesudah klik ini?'), el('div', { class: 'tp51-tombol' }, pool.map((o) => onTap(el('button', { type: 'button', class: 'tp51-pilih', 'data-v': o }, o), () => jawab(o, w))))) : null);
  };
  function jawab(o, w) { if (tebak) return; if (o !== w) { oops(); say(msg, 'bad', hint(S)); return; } tebak = true; ctx.sound.tap(); draw(); say(msg, 'info', `Ramalan dicatat: ${w}. Sekarang klik tombolnya.`); }
  function klik(id) {
    if (k >= to) return;
    if (id !== ID51[seq[k]]) { oops(); say(msg, 'bad', `Kejadian ${k + 1} adalah klik ${seq[k]}.`); return; }
    if (ramal(seq[k]) && !tebak) { say(msg, 'info', 'Ramalkan dulu tulisannya, baru klik.'); return; }
    last = S.klik(id, seq[k]); k++; tebak = false; ctx.sound.tap(); draw();
    if (k < to) { say(msg, 'info', `Kejadian ${k + 1}: ${seq[k]}.`); return; }
    onEnd(S);
  }
  draw();
  return dua51(kiri, kanan);
}
const POOL51 = ['A1', 'A2', 'A3', 'A4', 'A5', 'Tidak ada antrean'];
const hintPanggil = (S) => { const v = S.vars(); return v.dipanggil < v.terakhir ? 'Masih ada yang menunggu: dipanggil bertambah 1 dan nomornya tampil.' : 'dipanggil < terakhir bernilai false: antrean kosong.'; };
const kodePanggil = (last) => jsView(JS3.slice(11, 16), { dari: 12, hl: last ? last.langkah.map((x) => x.baris) : [] });

// Misi 4: wire the Panggil button, then events 1–5.
function petugasRound(area, ctx, { oops, done }) {
  const msg = msg51('HTML baris 12 sudah punya <button id="tombol-panggil">. Lengkapi kodenya.'); const box = kol51();
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['let dipanggil = 0;', 'const tombolPanggil =', ['  document.getElementById(', '_', ');'], ['tombolPanggil.addEventListener(', '_', ','], '  function () {', ['  if (', '_', ') {'], '    dipanggil = dipanggil + 1; …', '  } else { … "Tidak ada antrean" }'], { labels: ['8', '9', '', '11', '', '12', '13', '15'] }),
    chips: ['"tombol-panggil"', '"tombolPanggil"', '"click"', '"klik"', 'dipanggil < terakhir', 'dipanggil <= terakhir'], want: ['"tombol-panggil"', '"click"', 'dipanggil < terakhir'],
    hints: ['id persis seperti di HTML: tombol-panggil.', 'Nama kejadiannya click.', 'Panggil hanya bila masih ada yang menunggu: dipanggil harus lebih kecil.'],
    done: () => { say(msg, 'info', 'Tombol terpasang. Jalankan kejadian 1: Ambil.');
      fill(box, acara51(ctx, { oops, msg, html: HTML2, js: JS3, seq: SEMBILAN, from: 0, to: 5, ramal: (b) => b === 'Panggil', pool: POOL51, hint: hintPanggil, kode: kodePanggil,
        onEnd: () => { say(msg, '', 'Lima kejadian beres. Penangan Panggil hanya menaikkan dipanggil bila ada yang menunggu.'); done(); } })); } }));
  area.append(box, msg);
}

// Misi 4b: events 6–9, then Dodi's if (true).
function sisaRound(area, ctx, { oops, done }) {
  const msg = msg51('Lanjut dari kejadian 6. Antrean mulai habis.'); const box = kol51(); const dodi = urutan(HTML2, JS_DODI, SEMBILAN).rows;
  fill(box, acara51(ctx, { oops, msg, html: HTML2, js: JS3, seq: SEMBILAN, from: 5, to: 9, ramal: (b) => b === 'Panggil', pool: POOL51, hint: hintPanggil, kode: kodePanggil,
    onEnd: () => { say(msg, 'info', 'Sembilan kejadian beres. Dodi mengganti baris 12 menjadi if (true). Ramalkan!');
      fill(box, dua51(jsView(JS_DODI.slice(11, 15), { dari: 12, warn: [12] }), fillBoard(ctx, { oops, msg, view: rowsView([['versi Dodi, kejadian 7 → ', '_'], ['versi Dodi, kejadian 9 → ', '_']]),
        chips: uniq([dodi[6].panggil, dodi[8].panggil, 'Tidak ada antrean', 'A3']), want: [dodi[6].panggil, dodi[8].panggil], hints: ['true selalu benar: dipanggil naik walau antrean kosong.', 'Nomor yang belum diambil siapa pun ikut dipanggil.'],
        done: () => { say(msg, '', 'Dodi memanggil nomor hantu. Syarat dipanggil < terakhir menjaga antrean tetap jujur.'); done(); } }))); } }));
  area.append(box, msg);
}

// Misi 5: script in head, reload, then defer.
function bangunRound(area, ctx, { oops, done }) {
  const msg = msg51('Seret kartu script ke dalam head, lalu tekan Muat Ulang.'); const kiri = kol51(); const kanan = kol51(); let fase = 0; let S = muat(HTML1, JS2);
  const kartu = el('div', { class: 'tp51-script', 'data-drag': 'script' }, '<script src="antrean.js">');
  const zona = (id, t) => el('div', { class: 'tp51-zona', 'data-drop': id }, el('b', null, t));
  const zH = zona('head', '⬇ di dalam head'); const zB = zona('body', '⬇ akhir body'); zB.append(kartu);
  const outline = el('div', { class: 'tp51-outline' }, el('code', null, '<head>'), el('code', { class: 'in' }, '<meta charset="utf-8">'), el('code', { class: 'in' }, '<title>…</title>'), zH, el('code', null, '</head>'), el('code', null, '<body>'), el('code', { class: 'in' }, '<h1>, <p>, <button>, <p>'), zB, el('code', null, '</body>'));
  dnd(outline, (c, z) => { if (fase !== 0 || z.dataset.drop !== 'head') return; zH.append(c); c.classList.add('locked'); fase = 1; ctx.sound.tap(); say(msg, 'info', 'Script sekarang di head. Tekan Muat Ulang.'); kanan_(); });
  const kanan_ = (extra = null) => fill(kanan, muatBtn(muatUlang), extra ? null : halaman51(S, fase === 2 || fase === 5 ? klik : null), konsol51(S), extra);
  function muatUlang() {
    if (fase === 1) { S = muat(HTML_HEAD, JS2); fase = 2; ctx.sound.tap(); kanan_(); say(msg, 'info', 'Konsol merah saat halaman dibuka! Coba klik Ambil nomor.'); return; }
    if (fase === 4) { S = muat(HTML_DEFER, JS2); fase = 5; ctx.sound.tap(); kanan_(); say(msg, 'info', 'Tidak ada galat. Klik Ambil nomor.'); return; }
    say(msg, 'info', fase === 0 ? 'Pindahkan script ke head dulu.' : 'Selesaikan langkah ini dulu.');
  }
  function klik(id) {
    if (id !== 'tombol-ambil') return;
    if (fase === 2) { S.klik(id); fase = 3; ctx.sound.tap(); say(msg, 'info', 'Tidak terjadi apa-apa! Saat kode jalan di head, tombol belum dibuat, jadi addEventListener gagal. Tunda kodenya.');
      kanan_(fillBoard(ctx, { oops, msg, view: codeFill([['<script src="antrean.js" ', '_', '>']]), chips: ['defer', 'lang="id"', 'hidden'], want: ['defer'], hints: ['Atribut yang menunda skrip sampai seluruh HTML selesai dibaca.'],
        done: () => { fase = 4; say(msg, 'info', 'defer ditambahkan. Tekan Muat Ulang lagi.'); } })); return; }
    if (fase === 5) { S.klik(id); fase = 6; ctx.sound.tap(); kanan_(); say(msg, '', `Nomor Anda: ${S.teks['nomor-anda']}. defer menunda kode sampai seluruh HTML dibaca, jadi tombol sudah ada saat kode bangun.`); done(); }
  }
  fill(kiri, outline); kanan_();
  area.append(dua51(kiri, kanan), msg);
}

// Misi 5b: reload forgets everything; each device runs its own copy.
function ulangRound(area, ctx, { oops, done }) {
  const msg = msg51('Pagi di kantor desa. Klik Ambil nomor sampai A5.'); const kiri = kol51(); const kanan = kol51(); let fase = 0; let S = muat(HTML1, JS2); let hp = null;
  const draw = (extra = null) => { fill(kiri, varKartu(S, ['terakhir']), muatBtn(muatUlang), el('small', null, '📟 tablet petugas'), halaman51(S, fase === 0 || fase === 3 ? klik : null));
    fill(kanan, hp ? el('small', null, '📱 ponsel warga') : null, hp ? halaman51(hp, fase === 5 ? klikHp : null) : null, extra); };
  function klik(id) {
    if (id !== 'tombol-ambil') return; S.klik(id); ctx.sound.tap();
    if (fase === 0) { draw(); if (S.vars().terakhir < 5) return; fase = 1; say(msg, 'info', 'Sudah A5. Listrik berkedip: tekan Muat Ulang.'); return; }
    if (fase === 3) { fase = 4; say(msg, 'info', `${S.teks['nomor-anda']} lagi: nomor ganda! Bu Rina membuka alamat yang sama di ponselnya.`); hp = muat(HTML1, JS2);
      draw(fillBoard(ctx, { oops, msg, view: rowsView([['ponsel Bu Rina, klik pertama → ', '_'], ['nomor bersama harus disimpan di ', '_']]), chips: ['A1', 'A2', 'server', 'tablet petugas'], want: ['A1', 'server'],
        hints: ['Ponsel menjalankan salinan kodenya sendiri, mulai dari terakhir = 0.', 'Satu tempat yang dibaca semua perangkat.'], done: () => { fase = 5; say(msg, 'info', 'Buktikan: klik Ambil nomor di ponsel.'); draw(); } })); }
  }
  function klikHp(id) { if (fase !== 5 || id !== 'tombol-ambil') return; hp.klik(id); fase = 6; ctx.sound.tap(); draw(); say(msg, '', `Ponsel menampilkan ${hp.teks['nomor-anda']}. Variabel hidup di satu tab saja: muat ulang atau perangkat lain mulai dari nol.`); done(); }
  function muatUlang() {
    if (fase !== 1) { say(msg, 'info', fase === 0 ? 'Ambil nomor sampai A5 dulu.' : 'Halaman sudah dimuat ulang.'); return; }
    S = muat(HTML1, JS2); fase = 2; ctx.sound.tap(); say(msg, 'info', 'Halaman dimuat ulang. Ramalkan nomor warga keenam.');
    draw(fillBoard(ctx, { oops, msg, view: rowsView([['warga keenam mendapat ', '_']]), chips: ['A6', 'A1', 'A0'], want: ['A1'], hints: ['Muat ulang menjalankan kode dari baris 1 lagi: let terakhir = 0.'], done: () => { fase = 3; say(msg, 'info', 'Buktikan: klik Ambil nomor di tablet.'); draw(); } }));
  }
  draw();
  area.append(dua51(kiri, kanan), msg);
}

// Misi 6: write the Ulangi handler, then test it.
const UJI51 = [['Ulangi'], ['Ambil', 'Ambil', 'Panggil', 'Ulangi']];
function ujiRound(area, ctx, { oops, done }) {
  const msg = msg51('Susun penangan tombol Ulangi panggilan.'); const box = kol51(); const { html, js } = pasangTugas('ulang', []); let t = 0;
  const ujian = () => { const seq = UJI51[t]; say(msg, 'info', `Uji ${t + 1}: ${seq.join(', ')}. Klik sesuai urutan.`);
    fill(box, acara51(ctx, { oops, msg, html, js, seq, ramal: (b) => b === 'Ulangi', pool: ['-', 'Panggilan ulang: A0', 'Panggilan ulang: A1', 'Panggilan ulang: A2'],
      hint: (S) => (S.vars().dipanggil > 0 ? 'Ulangi menampilkan nomor yang terakhir dipanggil.' : 'dipanggil masih 0: syarat if salah, jadi tulisan tidak berubah.'),
      onEnd: () => { t++; if (t < UJI51.length) { setTimeout(ujian, 900); return; } say(msg, '', 'Kedua uji lolos. Penguji menang bila menemukan urutan yang membuat penangan salah.'); done(); } })); };
  fill(box, tileSlots(ctx, { oops, msg, build: ['const tombolUlang =', '  document.getElementById("tombol-ulang");', 'tombolUlang.addEventListener(', '  "click", function () {', ['c', 1], ['t', 2], '  }', '});'],
    tiles: [['c', 'if (dipanggil > 0) {'], ['t', 'layarPanggil.textContent =\n  "Panggilan ulang: A" + dipanggil;'], ['x1', 'if (dipanggil >= 0) {', 'Sebelum ada panggilan, dipanggil masih 0: belum ada yang bisa diulang.'], ['x2', 'layarPanggil.textContent =\n  "Panggilan ulang: A" + terakhir;', 'Yang diulang nomor yang terakhir dipanggil, bukan yang terakhir diambil.']],
    onFull: () => setTimeout(ujian, 700) }));
  area.append(box, msg);
}

// Misi 6b: a hidden bug; tap the line, name the cause and the fix.
function bugRound(area, ctx, { oops, done }) {
  const B = BUG[Math.floor(ctx.rand.next() * BUG.length)]; const S = muat(B.html, B.js); S.klik('tombol-ambil'); S.klik('tombol-ambil');
  const msg = msg51('Tombol sudah diklik dua kali dan Nomor Anda tetap "-". Ketuk baris penyebabnya.'); const kiri = kol51(); const kanan = kol51(); let ketemu = false;
  const jsT = B.js.findIndex((x, i) => x !== JS2[i]) + 1;
  const htT = B.html.length !== HTML1.length ? B.html.findIndex((x) => x.includes('<script')) + 1 : B.html.findIndex((x, i) => x !== HTML1[i]) + 1;
  const s = htT ? Math.max(0, htT - 3) : 7;
  kanan.dataset.target = jsT ? `js:${jsT}` : `html:${htT}`;
  const draw = () => fill(kanan, codeView(B.html.slice(s, s + 4), { labels: lab(s + 1, 4), cls: `html ${ketemu ? '' : 'ketuk'}`, warn: ketemu && htT ? [htT - 1 - s] : [], onLine: ketemu ? null : (i) => tap('html', s + i + 1) }),
    jsView(B.js.slice(1, 6), { dari: 2, warn: ketemu && jsT ? [jsT] : [], onLine: ketemu ? null : (n) => tap('js', n) }));
  function tap(kind, n) {
    if (ketemu) return;
    if (!((kind === 'js' && n === jsT) || (kind === 'html' && n === htT))) { oops(); say(msg, 'bad', 'Baris ini benar. Bandingkan id, nama kejadian, nama properti, dan letak script.'); return; }
    ketemu = true; ctx.sound.tap(); draw(); say(msg, 'info', 'Ketemu! Apa penyebabnya?');
    kiri.hidden = true;
    const merah = jsT ? jsView(B.js.slice(jsT - 1, jsT), { dari: jsT, warn: [jsT] }) : codeView(B.html.slice(htT - 1, htT), { labels: lab(htT, 1), cls: 'html', warn: [0] });
    const akhir = () => { const F = muat(HTML1, JS2); kiri.hidden = false; kanan.hidden = true; say(msg, 'info', 'Halaman diperbaiki. Klik Ambil nomor.'); fill(kiri, halaman51(F, (id) => { if (id !== 'tombol-ambil' || F.teks['nomor-anda'] !== '-') return; F.klik(id); ctx.sound.tap(); fill(kiri, halaman51(F)); say(msg, '', `Nomor Anda: ${F.teks['nomor-anda']}. Satu huruf bisa membuat Si Null lolos, dan konsol menunjukkan jejaknya.`); done(); })); };
    const perbaikan = () => { say(msg, 'info', 'Penyebabnya tepat. Sekarang pilih perbaikannya.'); fill(kanan, merah, fillBoard(ctx, { oops, msg, view: rowsView([['perbaikan: ', '_']]), chips: rand2(B.fix, FIXES.find((f) => f !== B.fix && !f.startsWith(B.fix.split(' ')[0]))), want: [B.fix], hints: ['Perbaikan yang mengubah baris merah itu.'], done: akhir })); };
    fill(kanan, merah, fillBoard(ctx, { oops, msg, view: rowsView([['penyebab: ', '_']]), chips: [...SEBAB], want: [B.sebab], hints: ['Bandingkan baris merah dengan pasangannya di HTML atau JavaScript.'], done: perbaikan }));
  }
  const rand2 = (a, b) => (ctx.rand.next() < 0.5 ? [a, b] : [b, a]);
  fill(kiri, halaman51(S), konsol51(S)); draw();
  area.append(dua51(kiri, kanan), msg);
}

// Misi Bos: localStorage keeps the number through a reload.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg51('Susun penangan yang menyimpan nomor di localStorage.'); const box = kol51(); let fase = 0; let mem = 0; let store = null; let tampil = '-';
  const pad = (n) => `A${String(n).padStart(3, '0')}`;
  const kiri = kol51(); const kanan = kol51();
  const page = () => el('div', { class: 'wa-peramban' }, el('div', { class: 'wa-tab' }, '🗂 Antrean Kantor Desa'), el('div', { class: 'wa-hal' }, el('h1', { class: 'wa-h1' }, 'Antrean Pelayanan Kantor Desa Sukamaju'), el('p', { class: 'wa-p' }, 'Nomor Anda: ', el('span', { class: 'wa-span' }, tampil)),
    onTap(el('button', { class: 'wa-btn', type: 'button' }, 'Ambil nomor'), ambil)));
  const draw = (extra = null) => { fill(kiri, el('div', { class: 'tp51-vars' }, el('span', { class: 'tp51-var' }, el('b', null, 'terakhir'), String(mem)), el('span', { class: 'tp51-var simpan' }, el('b', null, 'localStorage'), store === null ? '{ }' : `{"terakhir": "${store}"}`)), muatBtn(muatUlang), page());
    fill(kanan, codeView(['function perbaruiLayar() {', '  layarNomor.textContent =', '    "A" + String(terakhir)', '      .padStart(3, "0");', '}']), extra); };
  function ambil() {
    if (fase === 0 || fase === 2) { mem++; store = String(mem); tampil = pad(mem); ctx.sound.tap(); }
    else { say(msg, 'info', fase === 1 ? 'Sudah tiga. Tekan Muat Ulang.' : 'Ramalkan dulu.'); return; }
    if (fase === 0) { draw(); if (mem === 3) { fase = 1; say(msg, 'info', 'Tiga nomor diambil. Tekan Muat Ulang.'); } return; }
    fase = 3; say(msg, 'info', `${tampil}! Nomornya selamat. Satu pertanyaan tentang padStart.`);
    draw(fillBoard(ctx, { oops, msg, view: rowsView([['String(7).padStart(3, "0") → ', '_'], ['String(1234).padStart(3, "0") → ', '_']]), chips: ['"007"', '"1234"', '"234"', '"700"'], want: ['"007"', '"1234"'],
      hints: ['padStart menambah "0" di depan sampai panjangnya 3.', 'Teks yang sudah 4 karakter dibiarkan, tidak dipotong.'], done: () => { say(msg, '', 'Nomor selamat dari muat ulang dan selalu tiga angka. Antar-perangkat tetap perlu server.'); done(); } }));
  }
  function muatUlang() {
    if (fase !== 1) { say(msg, 'info', fase === 0 ? 'Ambil tiga nomor dulu.' : 'Halaman sudah dimuat ulang.'); return; }
    mem = Number(store || 0); tampil = '-'; fase = 4; ctx.sound.tap(); say(msg, 'info', 'Dimuat ulang. Baris 1 membaca localStorage. Ramalkan nomor berikutnya.');
    draw(fillBoard(ctx, { oops, msg, view: rowsView([['Ambil berikutnya → ', '_']]), chips: ['A004', 'A001', 'A4', 'A0031'], want: ['A004'], hints: ['terakhir dibaca lagi dari localStorage, lalu ditambah 1 dan diberi nol di depan.'],
      done: () => { fase = 2; say(msg, 'info', 'Buktikan: klik Ambil nomor.'); draw(); } }));
  }
  fill(box, tileSlots(ctx, { oops, msg, build: ['let terakhir = Number(', '  localStorage.getItem("terakhir") || 0);', 'tombolAmbil.addEventListener(', '  "click", function () {', ['t', 1], ['s', 1], ['p', 1], '});'],
    tiles: [['t', 'terakhir = terakhir + 1;'], ['s', 'localStorage.setItem("terakhir", terakhir);'], ['p', 'perbaruiLayar();'], ['x', 'terakhir = 0;', 'Itu menghapus nomor yang baru dibaca dari localStorage.']],
    order: 'Naikkan dulu, simpan, baru tampilkan.', onFull: () => { say(msg, 'info', 'Penangan siap. Klik Ambil nomor tiga kali.'); fill(box, dua51(kiri, kanan)); draw(); } }));
  area.append(box, msg);
}

export default {
  id: 'sma-51-web-antrean',
  title: 'Aplikasi Web Nomor Antrean',
  topic: 'Aplikasi web sederhana dengan HTML dan JavaScript: id, pohon DOM, getElementById, penangan kejadian, textContent, keadaan aplikasi, letak <script>, dan pesan galat di konsol',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎫',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri aplikasi nomor antrean kantor desa klik demi klik, temukan mengapa nomornya tidak tampil, tambahkan tombol untuk petugas, lalu selidiki kapan kode JavaScript dijalankan.',
  extraModes: [
    { id: 'tiruan', icon: '🖥️', label: 'Halaman Tiruan', desc: 'Sunting HTML dan JavaScript, tekan Jalankan, lalu klik tombol di halaman; konsol dan pohon DOM menunjukkan apa yang terjadi', create: createSandbox },
    { id: 'telusur', icon: '🔎', label: 'Penelusur Kejadian', desc: 'Setiap klik menyorot baris penangan yang dijalankan, lengkap dengan nilai terakhir dan dipanggil', create: createTrace },
    { id: 'giliran', icon: '🧪', label: 'Penulis dan Penguji', desc: 'Satu tim menyusun penangan tombol baru, tim lain menyusun urutan klik untuk mengujinya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act web-antrean tp51-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'tp51-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, ulah] = HEAD51[k]; foe = el('div', { class: 'tp51-musuh' }, el('b', null, '👻 Si Null'), el('span', null, ulah)); wrap.append(el('div', { class: 'tp51-kepala' }, misiHead(no, judul, tujuan, '🌐'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Antrean jalan ✓'; next(ms); } });
      if (r === 0) { go('pohon', 1); pohonRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('klik', 2); klikRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('tangkap', 3); tangkapRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('petugas', 4); petugasRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('sisa', 4); sisaRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('bangun', 5); bangunRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('ulang', 5); ulangRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('uji', 6); ujiRound(area, ctx, fin(5500)); }
      else if (r === 8) { go('bug', 6); bugRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

// ---- views ----
// Code with line numbers (HTML or JavaScript); hl and warn are 1-based line numbers.
function kode(lines, { hl = [], warn = [], cls = '', dari = 1, lewati = 0 } = {}) {
  return el('pre', { class: `wa-kode ${cls}` }, lines.map((x, i) => { let n = dari + i; if (lewati && n >= lewati) n++; return el('span', { class: `wa-l ${hl.includes(n) ? 'hl' : ''} ${warn.includes(n) ? 'warn' : ''}` }, el('i', null, String(n)), x || ' '); }));
}
function konsolView(list) {
  return el('div', { class: 'wa-konsol' }, el('b', null, 'Konsol'), list.length ? list.map((m) => el('p', { class: m.k === 'galat' ? 'galat' : '' }, m.s, m.baris ? el('small', null, ` antrean.js:${m.baris}`) : null)) : el('p', { class: 'kosong' }, '(kosong)'));
}
// The page as the browser shows it, drawn from the model's texts; buttons click through the model.
function halamanView(S, { pasif = false, onKlik = null } = {}) {
  const title = (S.H.src.match(/<title>([^<]*)<\/title>/) || [])[1] || 'antrean.html';
  const body = (S.H.src.split(/<body[^>]*>/)[1] || '').split('</body>')[0];
  const isi = [];
  for (const m of body.matchAll(/<(h1|p|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const id = (m[2].match(/\bid="([^"]*)"/) || [])[1];
    if (m[1] === 'button') isi.push(pasif ? el('span', { class: 'wa-btn' }, m[3]) : onTap(el('button', { class: 'wa-btn', type: 'button' }, m[3]), () => onKlik?.(id)));
    else {
      const parts = []; let last = 0;
      for (const s of m[3].matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)) { const sid = (s[1].match(/\bid="([^"]*)"/) || [])[1]; parts.push(m[3].slice(last, s.index), el('span', { class: 'wa-span' }, sid in S.teks ? S.teks[sid] : s[2])); last = s.index + s[0].length; }
      parts.push(m[3].slice(last));
      isi.push(el(m[1], { class: `wa-${m[1]}` }, ...parts.filter((x) => x !== '')));
    }
  }
  return el('div', { class: 'wa-peramban' }, el('div', { class: 'wa-tab' }, `🗂 ${title}`), el('div', { class: 'wa-hal' }, ...isi));
}
// DOM tree from the HTML text (elements only), with optional highlights by id.
function pohonData(html) {
  const src = Array.isArray(html) ? html.join('\n') : html; const root = { tag: '#', kids: [] }; const stack = [root];
  const VOID = ['meta', 'br', 'img', 'input', 'link', 'hr'];
  for (const m of src.matchAll(/<(\/?)([A-Za-z][\w-]*)([^>]*)>/g)) {
    const tag = m[2].toLowerCase(); if (tag === 'doctype' || m[0].startsWith('<!')) continue;
    if (m[1]) { while (stack.length > 1) { const t = stack.pop(); if (t.tag === tag) break; } continue; }
    const n = { tag, id: (m[3].match(/\bid\s*=\s*"([^"]*)"/) || [])[1], kids: [] }; stack.at(-1).kids.push(n);
    if (!VOID.includes(tag) && !m[3].endsWith('/')) stack.push(n);
  }
  return root.kids[0] || { tag: 'html', kids: [] };
}
export function induk(html, label) {
  const find = (n, p) => { const nm = n.id ? `${n.tag}#${n.id}` : n.tag; if (nm === label || n.tag === label) return p; for (const k of n.kids) { const r = find(k, n); if (r) return r; } return null; };
  const p = find(pohonData(html), null); return p ? p.tag : null;
}
function pohon(html, { dicari = {} } = {}) {
  const node = (n) => el('li', null, el('span', { class: `wa-node ${n.id && n.id in dicari ? 'cari' : ''}` }, n.tag, n.id ? el('small', null, `#${n.id}`) : null), n.kids.length ? el('ul', null, n.kids.map(node)) : null);
  const hilang = Object.entries(dicari).filter(([, ok]) => !ok).map(([id]) => el('p', { class: 'wa-null' }, `getElementById("${id}") → null`));
  return el('div', { class: 'wa-pohon' }, el('ul', null, node(pohonData(html))), ...hilang);
}

// ---- Halaman tiruan: pupils' code in a sandboxed iframe ----
export function srcdoc(html, js) {
  const shim = '<script>(function(){var P=function(d){d.cu=1;parent.postMessage(d,"*")};var F=function(a){try{return typeof a==="string"?a:a===null?"null":a===undefined?"undefined":a instanceof Element?"<"+a.tagName.toLowerCase()+(a.id?"#"+a.id:"")+">":JSON.stringify(a)}catch(e){return String(a)}};["log","error","warn","info"].forEach(function(k){console[k]=function(){P({t:"log",s:[].map.call(arguments,F).join(" ")})}});addEventListener("error",function(e){P({t:"err",m:e.message,l:e.lineno,n:e.error&&e.error.name})});var g=document.getElementById.bind(document);document.getElementById=function(id){var r=g(id);P({t:"id",id:String(id),ok:!!r});return r};})();</script>';
  let doc = html; const hilang = [];
  const re = /<script\b([^>]*)>\s*<\/script>/gi; let utama = null;
  doc = doc.replace(re, (all, attrs) => { const src = (attrs.match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1]; if (src === 'antrean.js' && !utama) { utama = { defer: /\bdefer\b/i.test(attrs) }; return utama.defer ? '' : '\u0000JS\u0000'; } if (src) hilang.push(src); return ''; });
  if (utama?.defer) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, '\u0000JS\u0000</body>') : `${doc}\u0000JS\u0000`;
  doc = /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => h + shim) : shim + doc;
  const at = doc.indexOf('\u0000JS\u0000');
  let mulai = 0;
  if (at >= 0) { const before = doc.slice(0, at); mulai = before.split('\n').length + 1; doc = `${before}<script>\n${js}\n</script>${doc.slice(at + 4)}`; }
  return { doc, mulai, dimuat: !!utama, hilang };
}
const CONTOH = { 'lembar kerja': [HTML1, JS1], 'id diperbaiki': [HTML1, JS2], 'tombol Panggil': [HTML2, JS3], 'Dodi (true)': [HTML2, JS_DODI], '<script> di head': [HTML_HEAD, JS2], 'head + defer': [HTML_DEFER, JS2], 'Sari': [HTML1, JS_SARI] };
function createSandbox(root, ctx) {
  const wrap = el('div', { class: 'act web-antrean' });
  root.append(wrap);
  let frame = null; let info = null; let logs = []; let dicari = {};
  const taH = el('textarea', { class: 'wa-area', rows: 14, spellcheck: 'false', 'aria-label': 'antrean.html' });
  const taJ = el('textarea', { class: 'wa-area', rows: 14, spellcheck: 'false', 'aria-label': 'antrean.js' });
  const host = el('div', { class: 'wa-frame' }); const kon = el('div'); const tree = el('div');
  const gambar = () => { kon.replaceChildren(konsolView(logs)); tree.replaceChildren(pohon(taH.value, { dicari })); };
  const onMsg = (e) => {
    if (!frame || e.source !== frame.contentWindow || !e.data || !e.data.cu) return; const d = e.data;
    if (d.t === 'log') logs.push({ k: 'log', s: d.s });
    else if (d.t === 'err') { const n = d.l ? d.l - info.mulai + 1 : 0; const lines = taJ.value.split('\n'); const ok = n >= 1 && n <= lines.length; logs.push({ k: 'galat', s: chromify(d.n || (String(d.m).match(/(\w+Error)/) || [])[1] || 'Error', d.m, ok ? lines[n - 1] : ''), baris: ok ? n : 0 }); }
    else if (d.t === 'id') { if (!(d.id in dicari) || d.ok) dicari[d.id] = d.ok; }
    gambar();
  };
  window.addEventListener('message', onMsg);
  const jalankan = () => {
    logs = []; dicari = {}; info = srcdoc(taH.value, taJ.value);
    if (!info.dimuat) logs.push({ k: 'log', s: 'Halaman ini tidak memuat antrean.js.' });
    for (const s of info.hilang) logs.push({ k: 'galat', s: `GET ${s} net::ERR_FILE_NOT_FOUND` });
    frame = el('iframe', { class: 'wa-iframe', sandbox: 'allow-scripts allow-modals', title: 'halaman antrean tiruan', srcdoc: info.doc });
    host.replaceChildren(frame); gambar(); ctx.sound.tap();
  };
  const pakai = ([h, j]) => { taH.value = h.join('\n'); taJ.value = j.join('\n'); jalankan(); };
  wrap.append(el('p', { class: 'prompt' }, 'Halaman tiruan: antrean.html dan antrean.js'),
    el('div', { class: 'wa-atur' }, el('div', { class: 'seg' }, Object.entries(CONTOH).map(([k, v]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, k), () => pakai(v)))), button('▶ Jalankan', jalankan, 'primary')),
    el('div', { class: 'wa-tiga lebar' }, el('div', { class: 'wa-sunting' }, el('small', null, 'antrean.html'), taH, el('small', null, 'antrean.js'), taJ),
      el('div', { class: 'wa-kanan' }, host, kon), tree),
    el('p', { class: 'wa-ket' }, 'Kode berjalan di bingkai terkunci yang tidak bisa menyentuh aplikasi ini dan tidak menyimpan apa pun.'));
  pakai(CONTOH['lembar kerja']);
  return () => window.removeEventListener('message', onMsg);
}

// ---- Penelusur kejadian: the worksheet programs in the page model, step by step ----
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act web-antrean' });
  root.append(wrap);
  const VERSI = { v1: ['lembar kerja (id salah)', HTML1, JS1], v2: ['id diperbaiki', HTML1, JS2], v3: ['dengan tombol Panggil', HTML2, JS3], dodi: ['Dodi (true)', HTML2, JS_DODI], head: ['<script> di head', HTML_HEAD, JS2] };
  let v = 'v1'; let S = null; let k = null; let i = 0; let timer = null;
  const reset = () => { S = muat(VERSI[v][1], VERSI[v][2]); k = S.kejadian[0] || null; i = 0; play(); };
  const play = () => { clearInterval(timer); i = 0; draw(); if (!k) return; timer = setInterval(() => { if (i >= k.langkah.length) { clearInterval(timer); return; } i++; draw(); }, 550); };
  const klik = (id) => { if (!S) return; k = S.klik(id, id === 'tombol-ambil' ? 'Klik Ambil' : 'Klik Panggil'); ctx.sound.tap(); play(); };
  function draw() {
    const st = k && i > 0 ? k.langkah[i - 1] : null; const selesai = k && i >= k.langkah.length;
    const vars = selesai ? k.akhir : st ? st.vars : {};
    const tampil = Object.entries(vars).filter(([n]) => /terakhir|dipanggil/.test(n));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur kejadian'),
      el('div', { class: 'seg' }, Object.entries(VERSI).map(([key, [t]]) => onTap(el('button', { class: `seg-btn ${v === key ? 'on' : ''}`, type: 'button' }, t), () => { v = key; reset(); }))),
      el('div', { class: 'wa-tiga' }, kode(VERSI[v][2], { cls: 'kecil', hl: st && !selesai ? [st.baris] : [], warn: selesai && k.galat ? [k.galat.baris] : [] }),
        el('div', { class: 'wa-kanan' }, el('p', { class: 'wa-status' }, k ? `${k.label}: ${selesai ? (k.galat ? `berhenti di baris ${k.galat.baris}` : `selesai, baris ${k.langkah.map((x) => x.baris).join(', ')}`) : st ? `baris ${st.baris}` : '…'}` : 'Belum ada kejadian.'),
          el('div', { class: 'wa-vars' }, tampil.length ? tampil.map(([n, x]) => el('span', null, el('small', null, n), el('b', null, String(x)))) : el('small', null, 'terakhir belum dibuat')),
          halamanView(S, { onKlik: klik }), konsolView(S.konsol)),
        el('div', { class: 'wa-riwayat' }, el('b', null, 'Kejadian'), S.kejadian.map((x) => el('p', { class: x.galat ? 'galat' : '' }, `${x.label}: ${x.langkah.map((y) => y.baris).join(', ') || '(tidak ada penangan)'}${x.galat ? ` ⚠ ${x.galat.baris}` : ''}`)))));
  }
  reset();
  return () => clearInterval(timer);
}

// ---- Team mode: the writers assemble a handler for a new button, the testers choose click orders ----
const TUGAS = {
  ulang: { nama: 'Ulangi panggilan', id: 'tombol-ulang', layar: 'nomor-dipanggil', html: '  <button id="tombol-ulang">Ulangi panggilan</button>', baris: [
    ['const tombolUlang = document.getElementById("tombol-ulang");'], ['tombolUlang.addEventListener("click", function () {'],
    ['  if (dipanggil > 0) {', '  if (dipanggil >= 0) {', '  if (terakhir > 0) {'],
    ['    layarPanggil.textContent = "Panggilan ulang: A" + dipanggil;', '    layarPanggil.textContent = "Panggilan ulang: A" + terakhir;', '    layarPanggil.textContent = "Panggilan ulang: A" + (dipanggil + 1);'], ['  }'], ['});']] },
  baru: { nama: 'Mulai hari baru', id: 'tombol-baru', layar: null, html: '  <button id="tombol-baru">Mulai hari baru</button>', baris: [
    ['const tombolBaru = document.getElementById("tombol-baru");'], ['tombolBaru.addEventListener("click", function () {'], ['  if (confirm("Mulai hari baru?")) {'],
    ['    terakhir = 0;', '    terakhir = 1;', '    // terakhir tidak diubah'], ['    dipanggil = 0;', '    dipanggil = terakhir;', '    // dipanggil tidak diubah'],
    ['    layarNomor.textContent = "-";', '    layarNomor.textContent = "A0";', '    // layarNomor tidak diubah'], ['    layarPanggil.textContent = "-";', '    layarPanggil.textContent = "Tidak ada antrean";', '    // layarPanggil tidak diubah'], ['  }'], ['});']] },
  sisa: { nama: 'Sisa antrean', id: 'tombol-sisa', layar: 'sisa', html: '  <button id="tombol-sisa">Sisa antrean</button>\n  <p>Sisa antrean: <span id="sisa">-</span></p>', baris: [
    ['const tombolSisa = document.getElementById("tombol-sisa");'], ['const layarSisa = document.getElementById("sisa");'], ['tombolSisa.addEventListener("click", function () {'],
    ['  layarSisa.textContent = terakhir - dipanggil;', '  layarSisa.textContent = dipanggil - terakhir;', '  layarSisa.textContent = terakhir - dipanggil - 1;', '  layarSisa.textContent = terakhir;'], ['});']] },
};
export function pasangTugas(key, pilihan) {
  const T = TUGAS[key]; const js = [...JS3, ...T.baris.map((opts, i) => opts[pilihan[i] || 0])];
  const html = [...HTML2.slice(0, 12), ...T.html.split('\n'), ...HTML2.slice(12)];
  return { html, js, T };
}
export function ujiTugas(key, pilihan, seq) {
  const ids = { Ambil: 'tombol-ambil', Panggil: 'tombol-panggil', Baru: TUGAS[key].id };
  const jalan = (p) => { const { html, js } = pasangTugas(key, p); const S = muat(html, js); for (const b of seq) S.klik(ids[b], b); return { anda: S.teks['nomor-anda'], panggil: S.teks['nomor-dipanggil'], sisa: S.teks.sisa, galat: S.konsol.find((x) => x.k === 'galat')?.s || null }; };
  const harap = jalan([]); const hasil = jalan(pilihan);
  return { harap, hasil, lolos: JSON.stringify(harap) === JSON.stringify(hasil) };
}
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act web-antrean' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let t = 0;
    function step() {
      if (t >= nT) { finishBoard(wrap, ctx, { title: 'Penulis dan Penguji selesai', pts, again: () => pickTeams(wrap, 'Penulis dan Penguji', start) }); return; }
      const penulis = t % nT; let key = ['ulang', 'baru', 'sisa'][t % 3]; let pilih = [];
      const draw = () => {
        const T = TUGAS[key];
        wrap.replaceChildren(scoreBar(pts, penulis), el('p', { class: 'prompt' }, `Tim ${penulis + 1}: susun penangan tombol baru (tim lain jangan melihat)`),
          el('div', { class: 'seg' }, Object.entries(TUGAS).map(([k2, x]) => onTap(el('button', { class: `seg-btn ${key === k2 ? 'on' : ''}`, type: 'button' }, x.nama), () => { key = k2; pilih = []; draw(); }))),
          el('div', { class: 'wa-susun' }, T.baris.map((opts, i) => (opts.length === 1 ? el('pre', { class: 'wa-tetap' }, opts[0]) : el('div', { class: 'seg wa-seg' }, opts.map((o, j) => onTap(el('button', { class: `seg-btn ${(pilih[i] || 0) === j ? 'on' : ''}`, type: 'button' }, o.trim()), () => { pilih[i] = j; draw(); })))))),
          el('p', { class: 'wa-ket' }, key === 'baru' ? 'Di layar ini petugas selalu menjawab "ya" pada confirm.' : 'Variabel terakhir, dipanggil, layarNomor, dan layarPanggil dari kode lembar kerja sudah ada.'),
          button('Selesai ➜ tim lain menguji', () => uji(penulis, key, [...pilih]), 'primary'));
      };
      draw();
    }
    function uji(penulis, key, pilih) {
      const penguji = (penulis + 1) % nT; let seq = []; const hasil = []; const T = TUGAS[key];
      const draw = () => {
        wrap.replaceChildren(...[scoreBar(pts, penguji), el('p', { class: 'prompt' }, `Tim ${penguji + 1}: uji tombol "${T.nama}" dengan urutan klik (${hasil.length}/3 uji)`),
          hasil.length < 3 ? el('div', { class: 'wa-atur' }, ...['Ambil', 'Panggil', 'Baru'].map((b) => button(`+ ${b === 'Baru' ? T.nama : b}`, () => { if (seq.length < 8) { seq.push(b); draw(); } })), button('⌫', () => { seq.pop(); draw(); })) : null,
          hasil.length < 3 ? el('p', { class: 'wa-status' }, `Urutan: ${seq.map((b) => (b === 'Baru' ? T.nama : b)).join(' → ') || '(belum ada)'}`) : null,
          hasil.length < 3 ? button('▶ Jalankan uji', () => { if (!seq.length) return; const U = ujiTugas(key, pilih, seq); hasil.push({ seq: [...seq], ...U }); if (U.lolos) pts[penulis] += 1; else pts[penguji] += 1; ctx.sound.tap(); seq = []; draw(); }, 'primary') : null,
          el('div', { class: 'wa-riwayat' }, hasil.map((h) => el('p', { class: h.lolos ? '' : 'galat' }, `${h.seq.map((b) => (b === 'Baru' ? T.nama : b)).join(' → ')}: ${h.lolos ? `lolos (+1 Tim ${penulis + 1})` : `bug ditemukan (+1 Tim ${penguji + 1})`} · harapan ${tampil(h.harap)} · hasil ${tampil(h.hasil)}`))),
          hasil.length >= 3 ? el('div', null, el('p', { class: 'wa-ket' }, 'Kode tim penulis:'), kode(pasangTugas(key, pilih).js.slice(JS3.length), { cls: 'kecil', dari: JS3.length + 1 }), button('Lanjut ➜', () => { t++; step(); }, 'primary')) : null].filter(Boolean));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Penulis dan Penguji', start);
}
const tampil = (x) => `[Nomor Anda ${x.anda} · dipanggil ${x.panggil}${x.sisa !== undefined ? ` · sisa ${x.sisa}` : ''}${x.galat ? ' · galat' : ''}]`;
