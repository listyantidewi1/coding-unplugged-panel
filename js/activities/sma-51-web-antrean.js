// Aplikasi Web Nomor Antrean — SMA/SMK (16–18 tahun), coding. The Desa Sukamaju
// queue page: HTML ids, the DOM tree, getElementById returning null for the
// nomor_anda typo, click handlers that keep counting after the error, Sari's
// "A" + terakhir + 1, the Panggil button with the dipanggil < terakhir guard,
// Dodi's true, and <script> in <head> without defer. Worksheet programs run in a
// small page model (ids in source order, handlers, textContent); pupils' own code
// runs in a sandboxed iframe with a console that shows Chromium-style messages.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose } from './smp-kit.js';

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
    const wrap = el('div', { class: 'act web-antrean' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(el('div', { class: 'wa-dua' }, kode(HTML1, { cls: 'html' }), halamanView(muat(HTML1, JS1), { pasif: true })));
        rowsChoose(wrap, ctx, { prompt: 'Membaca halaman sebelum tombol diklik', cls: 'wa-isi', rows: [
          ['t', 'Tulisan di tab peramban', ['Antrean Kantor Desa', 'Antrean Pelayanan Kantor Desa Sukamaju', 'antrean.html', 'tidak ada'], 'Antrean Kantor Desa'],
          ['a', 'Nomor Anda', ['-', 'A0', 'A1', 'kosong'], '-'],
          ['i', 'Elemen yang punya id', ['span#nomor-anda, button#tombol-ambil, span#nomor-dipanggil', 'h1, button, script', 'semua elemen di body', 'hanya button#tombol-ambil'], 'span#nomor-anda, button#tombol-ambil, span#nomor-dipanggil'],
          ['h', 'Mengapa <h1> tidak perlu id', ['judul tidak pernah berubah dan tidak diklik, jadi tidak perlu dicari kode', 'h1 tidak boleh diberi id', 'id hanya untuk tombol', 'h1 sudah punya id otomatis'], 'judul tidak pernah berubah dan tidak diklik, jadi tidak perlu dicari kode'],
        ], done: next });
      }
      else if (r === 1) {
        wrap.append(el('div', { class: 'wa-dua' }, kode(HTML1, { cls: 'html' }), pohon(HTML1)));
        const opsi = ['html', 'head', 'body', 'p', 'button'];
        rowsChoose(wrap, ctx, { prompt: 'Pohon DOM: induk setiap elemen', cls: 'wa-isi wa-mono', rows: [['title', 'title'], ['meta', 'meta'], ['h1', 'h1'], ['span#nomor-anda', 'span#nomor-anda'], ['button#tombol-ambil', 'button#tombol-ambil'], ['script', 'script'], ['body', 'body']].map(([k, t]) => [k, t, opsi, induk(HTML1, k)]), done: next });
      }
      else if (r === 2) {
        const { S, rows } = urutan(HTML1, JS1, ['Ambil', 'Ambil', 'Ambil']); const buka = S.kejadian[0];
        const fmt = (k) => `baris ${k.langkah.map((x) => x.baris).join(', ')}${k.galat ? ` (galat di ${k.galat.baris})` : ''}`;
        wrap.append(el('div', { class: 'wa-dua' }, kode(JS1, { warn: [3, 6] }), kode(HTML1.slice(8, 11), { cls: 'html', dari: 9 })));
        rowsChoose(wrap, ctx, { prompt: 'Halaman dibuka, lalu "Ambil nomor" diklik tiga kali', cls: 'wa-isi wa-mono', rows: [
          ['b', 'Halaman dibuka', uniq([`${fmt(buka)} · terakhir 0 · "-"`, 'baris 1, 2, 3, 4, 5, 6 · terakhir 1 · "A1"', 'baris 1, 2, 3 · terakhir 0 · "-"', 'baris 1, 2, 3, 4 · terakhir 0 · "A0"']), `${fmt(buka)} · terakhir 0 · "-"`],
          ...rows.map((x, i) => { const right = `${fmt(S.kejadian[i + 1])} · terakhir ${x.terakhir} · "${x.anda}"`; return [`k${i}`, `Klik ${i + 1}`, uniq([right, `baris 5, 6 · terakhir ${x.terakhir} · "A${x.terakhir}"`, `baris 5, 6 (galat di 6) · terakhir 0 · "-"`, `baris 4, 5, 6 · terakhir ${x.terakhir - 1} · "-"`]), right]; }),
        ], done: next });
      }
      else if (r === 3) {
        const { S } = urutan(HTML1, JS1, ['Ambil']); const g = S.kejadian[1].galat;
        wrap.append(el('div', { class: 'wa-dua' }, kode(JS1, { warn: [g.baris] }), konsolView(S.konsol)));
        rowsChoose(wrap, ctx, { prompt: 'Konsol: tombolnya tampak rusak', cls: 'wa-isi', rows: [
          ['n', 'Yang bernilai null', ['layarNomor', 'tombolAmbil', 'terakhir', 'textContent'], 'layarNomor'],
          ['l', 'Baris galat', ['3', '4', '5', '6'], String(g.baris)],
          ['m', 'Pesan galat', uniq([g.pesan, "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')", 'Uncaught ReferenceError: layarNomor is not defined', "Uncaught TypeError: Cannot set properties of undefined (setting 'textContent')"]), g.pesan],
          ['t', 'Mengapa terakhir tetap bertambah', ['baris 5 berhasil lebih dulu; galat di baris 6 hanya menghentikan penangan pada klik itu', 'peramban mengulang klik otomatis', 'galat membuat terakhir bertambah dua kali', 'terakhir tidak bertambah'], 'baris 5 berhasil lebih dulu; galat di baris 6 hanya menghentikan penangan pada klik itu'],
        ], done: next });
      }
      else if (r === 4) {
        const sari = urutan(HTML1, JS_SARI, ['Ambil', 'Ambil']).rows;
        wrap.append(el('div', { class: 'wa-dua' }, kode(JS1.slice(2, 3), { dari: 3, warn: [3] }), kode(HTML1.slice(8, 9), { cls: 'html', dari: 9 })));
        rowsChoose(wrap, ctx, { prompt: 'Menemukan bug', cls: 'wa-isi wa-mono', rows: [
          ['f', 'Baris 3 yang benar', ['const layarNomor = document.getElementById("nomor-anda");', 'const layarNomor = document.getElementById("nomor anda");', 'const layarNomor = document.getElementById(nomor-anda);', 'const layar_nomor = document.getElementById("nomor_anda");'], 'const layarNomor = document.getElementById("nomor-anda");'],
          ['w', 'Mengapa galat baru muncul saat klik', ['getElementById diam-diam mengembalikan null; null baru dipakai di baris 6 saat tombol diklik', 'peramban menunda semua galat', 'baris 3 tidak pernah dijalankan', 'tombol belum dibuat saat halaman dibuka'], 'getElementById diam-diam mengembalikan null; null baru dipakai di baris 6 saat tombol diklik'],
          ['c', 'Pemeriksaan sesudah baris 3', ['if (layarNomor === null) { console.log("Elemen nomor-anda tidak ditemukan."); }', 'if (layarNomor === "nomor-anda") { ... }', 'if (terakhir === null) { ... }', 'layarNomor = "nomor-anda";'], 'if (layarNomor === null) { console.log("Elemen nomor-anda tidak ditemukan."); }'],
          ['s', 'Versi Sari: klik 1 dan klik 2', uniq([`${sari[0].anda} dan ${sari[1].anda}`, 'A1 dan A2', 'A1 dan A1', 'A01 dan A02']), `${sari[0].anda} dan ${sari[1].anda}`],
        ], done: next, info: 'Begitu ada teks di sebelah kiri, tanda + menyambung, bukan menjumlahkan: "A" + 0 + 1 menjadi "A01".' });
      }
      else if (r === 5) {
        wrap.append(kode(PANGGIL_KOSONG, { dari: 8, warn: [9, 11, 12] }));
        rowsChoose(wrap, ctx, { prompt: 'Tombol "Panggil berikutnya" untuk petugas', cls: 'wa-isi wa-mono', rows: [
          ['h', 'HTML sesudah baris 11', ['<button id="tombol-panggil">Panggil berikutnya</button>', '<button>tombol-panggil</button>', '<button id="tombolPanggil">Panggil berikutnya</button>', '<span id="tombol-panggil">Panggil berikutnya</span>'], '<button id="tombol-panggil">Panggil berikutnya</button>'],
          ['l9', 'Baris 9', ['"tombol-panggil"', 'tombol-panggil', '"tombolPanggil"', '"#tombol-panggil"'], '"tombol-panggil"'],
          ['l11', 'Baris 11', ['"click"', '"klik"', 'click', '"onclick"'], '"click"'],
          ['l12', 'Baris 12', ['dipanggil < terakhir', 'dipanggil <= terakhir', 'terakhir < dipanggil', 'dipanggil > 0'], 'dipanggil < terakhir'],
        ], done: next });
      }
      else if (r === 6 || r === 7) {
        const { rows } = urutan(HTML2, JS3, SEMBILAN); const part = r === 6 ? [0, 1, 2, 3, 4] : [5, 6, 7, 8];
        const sel = (x) => `${x.terakhir} · ${x.dipanggil} · ${x.anda} · ${x.panggil}`;
        const dodi = urutan(HTML2, JS_DODI, SEMBILAN).rows;
        wrap.append(el('div', { class: 'wa-dua' }, kode(JS3, { cls: 'kecil', warn: [12] }), el('p', { class: 'wa-ket' }, 'Kolom: terakhir · dipanggil · Nomor Anda · Sedang dipanggil')));
        const extra = r === 7 ? [['d', 'Dodi (syarat true): kejadian 7, 8, 9', uniq([`${dodi[6].panggil}, ${dodi[7].anda}, ${dodi[8].panggil}`, 'Tidak ada antrean, A4, A4', 'A3, A4, A4', 'A4, A5, A6']), `${dodi[6].panggil}, ${dodi[7].anda}, ${dodi[8].panggil}`],
          ['s', 'Sisa antrean (terakhir − dipanggil) untuk 9 kejadian', uniq([rows.map((x) => x.terakhir - x.dipanggil).join(', '), '1, 2, 1, 2, 1, 0, 1, 1, 0', '1, 2, 1, 2, 1, 0, 0, 0, 0', '1, 1, 1, 2, 1, 0, 0, 1, 0']), rows.map((x) => x.terakhir - x.dipanggil).join(', ')]] : [];
        rowsChoose(wrap, ctx, { prompt: r === 6 ? 'Sembilan kejadian: 1–5' : 'Sembilan kejadian: 6–9, lalu versi Dodi', cls: 'wa-isi wa-mono', rows: [...part.map((i) => { const x = rows[i]; const p = rows[i - 1] || { terakhir: 0, dipanggil: 0, anda: '-', panggil: '-' };
          const salah = [sel({ ...x, dipanggil: x.dipanggil + (x.b === 'Ambil' ? 1 : -1) }), sel({ ...p }), sel({ ...x, panggil: x.panggil === 'Tidak ada antrean' ? `A${x.dipanggil + 1}` : 'Tidak ada antrean' }), sel({ ...x, anda: `A${x.terakhir + 1}` })];
          return [`k${i}`, `${i + 1}. ${x.b}`, uniq([sel(x), ...salah]).slice(0, 4), sel(x)]; }), ...extra], done: next });
      }
      else if (r === 8) {
        const B = BUG[Math.floor(ctx.rand.next() * BUG.length)]; const S = muat(B.html, B.js); S.klik('tombol-ambil'); S.klik('tombol-ambil');
        wrap.append(el('div', { class: 'wa-tiga' }, kode(B.html.slice(2, 14).filter((x) => !x.includes('meta')), { cls: 'html kecil', dari: 3, lewati: B.html.findIndex((x) => x.includes('meta')) + 1 }), kode(B.js, { cls: 'kecil' }), el('div', null, el('p', { class: 'wa-ket' }, 'Tombol sudah diklik dua kali:'), halamanView(S, { pasif: true }), konsolView(S.konsol))));
        rowsChoose(wrap, ctx, { prompt: 'Bug tersembunyi: perbaiki halaman ini', cls: 'wa-isi', rows: [
          ['s', 'Penyebab', SEBAB, B.sebab],
          ['f', 'Perbaikan', [B.fix, ...FIXES.filter((f) => f !== B.fix)].slice(0, 4), B.fix],
        ], done: next });
      }
      else {
        const H = urutan(HTML_HEAD, JS2, ['Ambil']); const D = urutan(HTML_DEFER, JS2, ['Ambil']);
        rowsChoose(wrap, ctx, { prompt: 'Kapan kode dijalankan, dan di mana nomor disimpan?', cls: 'wa-isi', rows: [
          ['h', '<script> di <head> tanpa defer', uniq([`${H.S.konsol[0]?.s} · klik tidak berbuat apa-apa`, "Uncaught TypeError: Cannot set properties of null (setting 'textContent') · nomor tidak tampil", 'tidak ada galat · nomor tampil A1', 'Uncaught ReferenceError: tombolAmbil is not defined · halaman kosong']), `${H.S.konsol[0]?.s} · klik tidak berbuat apa-apa`],
          ['d', 'Dengan defer, klik pertama', uniq([D.rows[0].anda, '-', 'A0', 'A2']), D.rows[0].anda],
          ['r', 'A23 sudah diambil, halaman dimuat ulang', ['warga berikutnya mendapat A1, jadi ada nomor ganda A1–A23', 'warga berikutnya mendapat A24', 'tombol tidak bisa diklik lagi', 'nomor berlanjut dari server'], 'warga berikutnya mendapat A1, jadi ada nomor ganda A1–A23'],
          ['p', 'Ponsel warga membuka alamat yang sama', ['setiap perangkat menjalankan salinan kodenya sendiri; nomor bersama perlu disimpan di server', 'nomornya otomatis sama dengan tablet', 'ponsel tidak bisa menjalankan JavaScript', 'ponsel memakai nomor B'], 'setiap perangkat menjalankan salinan kodenya sendiri; nomor bersama perlu disimpan di server'],
          ['z', 'String(7).padStart(3, "0") dan String(1234).padStart(3, "0")', [`${String(7).padStart(3, '0')} dan ${String(1234).padStart(3, '0')}`, '007 dan 234', '700 dan 1234', '7 dan 123'], `${String(7).padStart(3, '0')} dan ${String(1234).padStart(3, '0')}`],
        ], done: next });
      }
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
