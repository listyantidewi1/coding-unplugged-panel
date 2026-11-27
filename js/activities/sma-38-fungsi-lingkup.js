// Fungsi dan Ruang Lingkup — SMA/SMK (16–18 tahun), coding. A class duty
// roster written as five copied blocks (with the Kamis copy-paste bug),
// refactored into a function, print versus return (the missing return gives
// None), the call stack of frames, local versus global (UnboundLocalError and
// two fixes), and judging code quality before and after refactoring.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, pyCode } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy, pyRepr, makePyRunner } from './mini-py.js';

export const SISWA = ['Ayu', 'Bima', 'Citra', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hana', 'Iwan', 'Joko'];
export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const S1 = `siswa = [${SISWA.map((s) => `"${s}"`).join(', ')}]`;
const hariLine = (sabtu) => `hari_sekolah = [${[...HARI, ...(sabtu ? ['Sabtu'] : [])].map((h) => `"${h}"`).join(', ')}]`;
// Versi awal: one block per day; kamis = the remainder written on line 16 (bug: 2).
export const ORIG = ({ kamis = 2, sabtu = false } = {}) => { const n = sabtu ? 6 : 5; const days = sabtu ? [...HARI, 'Sabtu'] : HARI;
  return [S1, ...days.flatMap((h, k) => [`print("== ${h} ==")`, 'for i in range(len(siswa)):', `    if i % ${n} == ${h === 'Kamis' ? kamis : k}:`, '        print("-", siswa[i])'])]; };
// Versi ringkas (R1–R8) with the four blanks filled.
export const RIGHT = { r2: 'urutan', r3: 'hari', r5: 'urutan', r8: 'hari_sekolah[u], u' };
export const RING = (b = RIGHT, sabtu = false) => [S1, hariLine(sabtu), `def tampilkan_piket(hari, ${b.r2}):`, `    print("==", ${b.r3}, "==")`, '    for i in range(len(siswa)):', `        if i % len(hari_sekolah) == ${b.r5}:`, '            print("-", siswa[i])', 'for u in range(len(hari_sekolah)):', `    tampilkan_piket(${b.r8})`];
export const RL = ['1', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
export const BLANKS = [['r2', 'R2: parameter kedua', ['urutan', 'u', 'siswa', 'i']], ['r3', 'R3: yang dicetak di antara ==', ['hari', '"hari"', 'hari_sekolah', 'urutan']], ['r5', 'R5: dibandingkan dengan sisa bagi', ['urutan', 'u', 'hari', 'i']], ['r8', 'R8: argumen pemanggilan', ['hari_sekolah[u], u', 'u, hari_sekolah[u]', 'hari, urutan', 'hari_sekolah, u']]];
export const PETUGAS = (ret = true) => [S1, hariLine(false), 'def petugas(urutan):', '    hasil = []', '    for i in range(len(siswa)):', '        if i % len(hari_sekolah) == urutan:', '            hasil.append(siswa[i])', ...(ret ? ['    return hasil'] : []), 'regu_kamis = petugas(3)', 'print(regu_kamis, len(regu_kamis))'];
export const KL = (ret = true) => ['1', 'R1', 'K1', 'K2', 'K3', 'K4', 'K5', ...(ret ? ['K6'] : []), 'K7', 'K8'];
export const POIN = ['def poin(tugas):', '    if tugas == "menyapu":', '        return 2', '    elif tugas == "mengepel":', '        return 3', '    else:', '        return 1', '', 'def poin_regu(daftar_tugas):', '    total = 0', '    for t in daftar_tugas:', '        total = total + poin(t)', '    return total', '', 'total = 100', 'hasil = poin_regu(["menyapu", "mengepel", "menghapus papan"])', 'print(hasil, total)'];
export const BL = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', '', 'B8', 'B9', 'B10', 'B11', 'B12', '', 'B13', 'B14', 'B15'];
export const GLOBAL = (ver = 'galat') => (ver === 'global' ? ['total_tugas = 0', 'def tambah_tugas(n):', '    global total_tugas', '    total_tugas = total_tugas + n', 'tambah_tugas(3)', 'tambah_tugas(2)', 'print(total_tugas)']
  : ver === 'return' ? ['def tambah(total_lama, n):', '    return total_lama + n', '', 'total_tugas = 0', 'total_tugas = tambah(total_tugas, 3)', 'total_tugas = tambah(total_tugas, 2)', 'print(total_tugas)']
    : ['total_tugas = 0', 'def tambah_tugas(n):', '    total_tugas = total_tugas + n', 'tambah_tugas(3)', 'tambah_tugas(2)', 'print(total_tugas)']);
export const GL = (ver = 'galat') => (ver === 'galat' ? ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'] : null);
export const JADWAL = [S1, hariLine(false), 'def buat_jadwal(siswa, hari_sekolah):', '    jadwal = {}', '    for hari in hari_sekolah:', '        jadwal[hari] = []', '    for i in range(len(siswa)):', '        hari = hari_sekolah[i % len(hari_sekolah)]', '        jadwal[hari].append(siswa[i])', '    return jadwal', '',
  'def semua_dapat_piket(jadwal, siswa):', '    for nama in siswa:', '        banyak = 0', '        for hari in jadwal:', '            if nama in jadwal[hari]:', '                banyak = banyak + 1', '        if banyak != 1:', '            return False', '    return True'];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, ...o });
// Day → names from a roster printout ("== Senin ==", "- Ayu", …).
export function parseJadwal(out) { const j = {}; let h = null; for (const t of out) { const m = t.match(/^== (\w+) ==$/); if (m) { h = m[1]; j[h] = []; } else if (h) j[h].push(t.slice(2)); } return j; }
export const dayText = (j, days) => days.map((h) => `${h} ${j[h].join(', ') || '-'}`).join('; ');
// Snapshot of the frame stack at the first time a given line runs.
export function stackAt(lines, line) { const ru = makePyRunner(lines, { limit: 20000 }); for (const y of ru.gen) if (y.line === line) return frames(ru.state); return null; }
export const frames = (st) => [...st.frames.map((f) => [f.name, Object.entries(f.vars)]).reverse(), ['program utama (global)', Object.entries(st.vars).filter(([, v]) => !(v && v.py === 'fn'))]];
const stackCards = (fr) => el('div', { class: 'fl-tumpukan' }, el('small', null, 'Tumpukan bingkai (paling atas = sedang berjalan)'), fr.map(([n, vs], k, a) => el('div', { class: `fl-bingkai ${k === a.length - 1 ? 'global' : ''} ${k === 0 && a.length > 1 ? 'atas' : ''}` }, el('b', null, n), el('div', null, vs.length ? vs.map(([v, x]) => el('span', null, `${v} = ${pyRepr(x, true)}`)) : el('em', null, 'belum ada variabel')))));
const stackView = (st) => stackCards(frames(st));
const stackTracer = (lines, labels, o = {}) => pyTracer(lines, { cls: 'fl-jejak', speed: 420, labels, opts: { limit: 20000 }, hideVars: Object.keys(run(lines).vars).concat(['siswa', 'hari_sekolah']), extra: stackView, ...o });

// ---- Permainan: Bengkel Fungsi ----
// The team are code mechanics; Si Salin-Tempel copies blocks carelessly, drops
// return lines and changes globals from inside functions.
const HEAD38 = {
  blok: ['Jalankan Lima Blok', 'Jadilah Python: ketuk setiap murid yang dicetak blok itu.', 'Blok Kamis disalin dari blok Rabu…'],
  bug: ['Buru Bug Salin-Tempel', 'Cari murid yang terlewat, ketuk baris bugnya, lalu perbaiki.', 'Ada yang piket dua kali, ada yang tidak pernah!'],
  sabtu: ['Tambah Sabtu Cara Lama', 'Ubah setiap % 5 menjadi % 6, lalu rakit blok Sabtu.', '"Sabtu? Tinggal salin satu blok lagi!"'],
  mesin: ['Rakit Mesin Piket', 'Isi empat lubang mesin fungsi, lalu jalankan.', 'Mesinnya ditinggal bolong!'],
  panggil: ['Panggilan Keempat', 'Isi parameter pemanggilan keempat, lalu tambah Sabtu.', '"Menambah Sabtu pasti mengubah banyak baris!"'],
  kurir: ['Kurir Return', 'Isi bingkai petugas(3) dan antar nilai kembaliannya.', 'Diam-diam menghapus baris K6…'],
  menara: ['Menara Bingkai', 'Naikkan bingkai saat fungsi dipanggil, ambil saat return.', 'Bingkai ditumpuk sembarangan!'],
  global: ['Penjaga Global', 'Tentukan bingkai pemilik total_tugas, lalu pasang dua perbaikan.', 'Mengubah variabel global dari dalam fungsi!'],
  tinjau: ['Tinjauan Kode', 'Isi tabel tinjauan dengan kartu nilai.', '"Kode panjang juga jalan, kok!"'],
  bos: ['Mesin Penguji', 'Rakit buat_jadwal yang mengembalikan jadwal, lalu uji tiga jadwal.', '"Periksa jadwal dengan mata saja, tidak usah mesin!"'],
};
const msg38 = (t) => el('p', { class: 'reveal info' }, t);
const LBL = (k) => [2, 3, 4, 5].map((x) => String(4 * k + x));
const blokLines = (h, n, num) => [`print("== ${h} ==")`, 'for i in range(len(siswa)):', `    if i % ${n} == ${num}:`, '        print("-", siswa[i])'];
const listCard = (name, items, extra = null) => el('div', { class: 'bf38-daftar' }, el('code', null, `${name} =`), el('div', null, items.map((x, i) => el('span', null, el('small', null, String(i)), x))), extra);
// Ten student buttons with their index; pick(name, index, button).
const muridBoard = (pick) => el('div', { class: 'bf38-murid' }, SISWA.map((s, i) => { const b = el('button', { type: 'button', class: 'bf38-nama', 'data-n': s }, el('small', null, String(i)), el('b', null, s)); return onTap(b, () => pick(s, i, b)); }));
const rekap = (j, days = HARI) => el('div', { class: 'bf38-rekap' }, days.map((h) => el('div', null, el('b', null, h), el('span', null, j[h].join(', ') || '–'))));
const BUG = () => parseJadwal(run(ORIG()).out);

// Misi 1a: run the five blocks by hand.
function blokRound(area, ctx, { oops, done }) {
  const J = BUG(); let k = 0; let got = []; const lines = [];
  const msg = msg38('Blok Senin berjalan. Ketuk setiap murid yang dicetaknya.');
  const out = layar(); const codeBox = el('div', { class: 'bf38-kolom' }); const names = el('div');
  const num = (d) => (d === 3 ? 2 : d);
  const draw = () => { fill(codeBox, el('small', null, `Blok ${k + 1} dari 5 · baris ${4 * k + 2}–${4 * k + 5}`), codeView(blokLines(HARI[k], 5, num(k)), { labels: LBL(k), hl: [2] })); fill(names, muridBoard(pick)); };
  function pick(s, i, b) {
    if (k >= 5 || b.classList.contains('on')) return;
    const want = J[HARI[k]];
    if (!want.includes(s)) { oops(); shake(b); say(msg, 'bad', `${s} berindeks ${i}: ${i} % 5 = ${i % 5}, bukan ${num(k)}.`); return; }
    b.classList.add('on'); got.push(s); ctx.sound.tap();
    if (got.length < want.length) { say(msg, 'info', 'Tepat. Masih ada lagi.'); return; }
    lines.push(`== ${HARI[k]} ==`, ...want.map((x) => `- ${x}`)); out.textContent = lines.join('\n'); out.scrollTop = out.scrollHeight;
    k++; got = [];
    if (k < 5) { say(msg, 'info', `Blok ${HARI[k]} berjalan. Ketuk murid yang dicetaknya.`); setTimeout(draw, 500); return; }
    ctx.sound.good(); say(msg, '', 'Lima blok selesai. Lihat layar: Rabu dan Kamis isinya sama!'); done();
  }
  draw();
  area.append(el('div', { class: 'bf38-dua' }, el('div', { class: 'bf38-kolom' }, listCard('siswa', SISWA), codeBox, names), el('div', { class: 'bf38-kolom' }, el('small', null, 'Layar'), out)), msg);
}

// Misi 1b: who was missed, which line, then fix the number.
function bugRound(area, ctx, { oops, done }) {
  const J = BUG(); const all = Object.values(J).flat();
  const never = SISWA.filter((s) => !all.includes(s)); const twice = SISWA.filter((s) => all.filter((x) => x === s).length > 1);
  const msg = msg38('Ketuk murid yang tidak pernah piket.');
  const left = el('div', { class: 'bf38-kolom' }); const right = el('div', { class: 'bf38-kolom' }, el('small', null, 'Hasil program versi awal'), rekap(J));
  let phase = 'never'; let got = 0; let val = 2;
  const pick = (s, i, b) => {
    if (b.classList.contains('on') || (phase !== 'never' && phase !== 'twice')) return;
    const want = phase === 'never' ? never : twice;
    if (!want.includes(s)) { oops(); shake(b); say(msg, 'bad', `${s} muncul ${all.filter((x) => x === s).length} kali di hasilnya.`); return; }
    b.classList.add('on', phase); ctx.sound.tap(); got++;
    if (got < want.length) { say(msg, 'info', 'Tepat. Masih ada satu lagi.'); return; }
    got = 0;
    if (phase === 'never') { phase = 'twice'; say(msg, 'info', `${never.join(' dan ')} tidak pernah piket. Sekarang ketuk murid yang piket dua kali.`); return; }
    phase = 'line'; say(msg, 'info', 'Ini bagian yang berbeda di setiap blok. Ketuk baris bugnya.'); setTimeout(drawCards, 700);
  };
  fill(left, muridBoard(pick));
  function drawCards() {
    fill(left, el('div', { class: 'bf38-beda' }, HARI.map((h, k) => el('div', { class: 'bf38-kartu' }, el('small', null, h), codeView([`print("== ${h} ==")`, `if i % 5 == ${k === 3 ? (phase === 'fix' ? '' : val) : k}:`], {
      labels: [String(4 * k + 2), String(4 * k + 4)], cls: phase === 'line' ? 'ketuk' : '', hl: phase === 'fix' && k === 3 ? [1] : [],
      line: phase === 'fix' && k === 3 ? (i) => (i === 1 ? el('code', { class: 'bf38-setel' }, 'if i % 5 == ', onTap(el('button', { type: 'button', class: 'bf38-pm', 'data-d': '-1' }, '−'), () => step(-1)), el('b', null, String(val)), onTap(el('button', { type: 'button', class: 'bf38-pm', 'data-d': '1' }, '+'), () => step(1)), ':') : null) : null,
      onLine: phase === 'line' ? (i) => tapLine(k, i) : null }))),
    phase === 'fix' ? button('▶ Jalankan lagi', runFix, 'primary') : null));
  }
  function tapLine(k, i) {
    if (phase !== 'line') return;
    if (k !== 3 || i !== 1) { oops(); say(msg, 'bad', k === 2 && i === 1 ? 'Rabu memang sisa 2 (Citra berindeks 2). Blok mana yang angkanya sama dengan Rabu?' : 'Baris ini benar untuk harinya. Bandingkan angka sisa bagi di setiap blok.'); return; }
    ctx.sound.good(); phase = 'fix'; say(msg, 'info', 'Baris 16! Blok Kamis disalin dari Rabu dan angkanya lupa diganti. Setel angkanya, lalu jalankan.'); drawCards();
  }
  function step(d) { val = (val + d + 5) % 5; ctx.sound.tap(); drawCards(); }
  function runFix() {
    if (phase !== 'fix') return;
    const R = parseJadwal(run(ORIG({ kamis: val })).out);
    fill(right, el('small', null, `Hasil dengan baris 16: i % 5 == ${val}`), rekap(R));
    if (val !== 3) { oops(); say(msg, 'bad', `Dodi berindeks 3 dan Iwan berindeks 8. Sisa baginya oleh 5 berapa?`); return; }
    phase = 'end'; ctx.sound.good(); fill(left, el('div', { class: 'bf38-beda' }, el('div', { class: 'bf38-hitung' }, '✓ 10 murid, masing-masing sekali')));
    say(msg, '', 'Kamis kini Dodi dan Iwan. Bug salin-tempel: blok disalin, tetapi satu angka lupa diganti.'); done();
  }
  area.append(el('div', { class: 'bf38-dua' }, left, right), msg);
}

// Misi 1c: Saturday in the long version: five edits and a new block.
const SABTU_TILES = [['h', 'print("== Sabtu ==")'], ['f', 'for i in range(len(siswa)):'], ['i', 'if i % 6 == 5:'], ['p', 'print("-", siswa[i])'],
  ['x5', 'if i % 5 == 5:', 'Sisa bagi oleh 5 tidak pernah 5. Pembaginya kini 6.'], ['x6', 'if i % 6 == 6:', 'Sisa bagi oleh 6 paling besar 5.'], ['xj', 'print("== Jumat ==")', 'Itu judul blok Jumat yang ikut tersalin!']];
function sabtuRound(area, ctx, { oops, done }) {
  const msg = msg38('Hari Sabtu masuk sekolah. Ketuk setiap % 5 yang harus menjadi % 6.');
  const changed = new Set(); const count = el('div', { class: 'bf38-hitung' });
  const box = el('div', { class: 'bf38-kolom' }); const out = layar();
  const setCount = (add = 0) => { count.textContent = `Diubah: ${changed.size} baris · Ditambah: ${add} baris`; };
  const draw = () => fill(box, el('div', { class: 'bf38-beda' }, HARI.map((h, k) => el('div', { class: 'bf38-kartu' }, el('small', null, `${h} · baris ${4 * k + 4}`), el('code', { class: 'bf38-tokbaris' }, 'if i % ',
    onTap(el('button', { type: 'button', class: `bf38-tok ${changed.has(k) ? 'on' : ''}`, 'data-t': `n${k}` }, changed.has(k) ? '6' : '5'), () => tok(k, 'n')), ' == ',
    onTap(el('button', { type: 'button', class: 'bf38-tok', 'data-t': `r${k}` }, String(k)), () => tok(k, 'r')), ':')))));
  function tok(k, t) {
    if (changed.size >= 5) return;
    if (t === 'r') { oops(); say(msg, 'bad', `Sisa bagi untuk ${HARI[k]} tetap ${k}. Yang berubah adalah pembaginya: banyak hari.`); return; }
    if (changed.has(k)) return;
    changed.add(k); ctx.sound.tap(); setCount(); draw();
    if (changed.size < 5) { say(msg, 'info', 'Tepat. Masih ada % 5 lain.'); return; }
    say(msg, 'info', 'Lima baris diubah. Sekarang rakit blok Sabtu baris 22–25.');
    setTimeout(() => fill(box, el('small', null, 'Blok baru untuk Sabtu (baris 22–25)'), tileSlots(ctx, { oops, msg, build: [['h', 0], ['f', 0], ['i', 1], ['p', 2]], tiles: SABTU_TILES,
      onFull: () => { setCount(4); count.classList.add('merah'); say(msg, 'info', '9 tempat yang bisa salah ketik, hanya untuk satu hari baru.'); play(out, run(ORIG({ kamis: 3, sabtu: true })).out, { gap: 110, end: () => { say(msg, '', 'Versi awal: 5 baris diubah dan 4 baris ditambah. Pasti ada cara yang lebih rapi.'); done(); } }); } })), 900);
  }
  setCount(); draw();
  area.append(count, el('div', { class: 'bf38-dua' }, box, el('div', { class: 'bf38-kolom' }, el('small', null, 'Layar'), out)), msg);
}

// Misi 2a: fill the function machine (R2–R8).
const MESIN = [['def tampilkan_piket(hari, ', '_', '):'], ['    print("==", ', '_', ', "==")'], '    for i in range(len(siswa)):', ['        if i % len(hari_sekolah) == ', '_', ':'], '            print("-", siswa[i])', 'for u in range(len(hari_sekolah)):', ['    tampilkan_piket(', '_', ')']];
const MESIN_CHIPS = ['urutan', 'hari', 'urutan', 'hari_sekolah[u], u', 'u, hari_sekolah[u]', '"hari"', 'i', 'siswa'];
const MESIN_HINT = ['Parameter kedua menampung nomor urut hari. Namanya dipakai lagi di R5.', 'Yang dicetak isi parameter hari, tanpa tanda kutip.', 'Sisa bagi dibandingkan dengan nomor urut hari: parameter urutan.', 'Argumen mengikuti urutan parameter: hari dulu, baru urutan.'];
function mesinRound(area, ctx, { oops, done }) {
  const msg = msg38('Seret kartu ke lubang mesin, dari atas ke bawah.'); const out = layar();
  area.append(el('div', { class: 'bf38-daftar-daftar' }, listCard('siswa', SISWA), listCard('hari_sekolah', HARI)), el('div', { class: 'bf38-dua' }, fillBoard(ctx, { oops, msg, view: codeFill(MESIN, { labels: RL.slice(2) }), chips: MESIN_CHIPS, want: [RIGHT.r2, RIGHT.r3, RIGHT.r5, RIGHT.r8], hints: MESIN_HINT,
    done: () => { say(msg, 'info', 'Mesin dinyalakan: R7 memanggilnya lima kali.'); play(out, run(RING()).out, { gap: 110, end: () => { say(msg, '', `Keluarannya sama dengan versi awal yang sudah diperbaiki: ${ORIG().length} baris menjadi ${RING().length} baris.`); done(); } }); } }), el('div', { class: 'bf38-kolom' }, el('small', null, 'Layar'), out)), msg);
}

// Misi 2b: the fourth call, then Saturday with one edit.
const R1 = (sabtu) => `hari_sekolah = ["Senin", …, "${sabtu ? 'Sabtu' : 'Jumat'}"]`;
function panggilRound(area, ctx, { oops, done }) {
  const msg = msg38('R7 memanggil mesin lima kali. Isi parameter pada pemanggilan keempat.');
  const calls = el('div', { class: 'bf38-panggil' }, HARI.map((h, u) => el('span', { class: u === 3 ? 'on' : '' }, `u = ${u}`)));
  const box = el('div', { class: 'bf38-kolom' });
  fill(box, el('small', null, 'Pemanggilan keempat: tampilkan_piket(hari_sekolah[u], u)'), fillBoard(ctx, { oops, msg, view: rowsView([['hari   = ', '_'], ['urutan = ', '_']]), chips: ['"Kamis"', '"Rabu"', '"Jumat"', '3', '4'], want: ['"Kamis"', '3'],
    hints: ['u = 3, dan hari_sekolah[3] adalah hari keempat karena indeks mulai 0.', 'Argumen kedua adalah u itu sendiri.'], done: () => { say(msg, 'info', 'Kepala sekolah menambah hari Sabtu. Ketuk satu-satunya baris yang perlu diubah.'); setTimeout(lineStep, 900); } }));
  area.append(calls, box, msg);
  function lineStep() {
    calls.remove();
    const lines = [R1(false), ...RING().slice(2)];
    fill(box, el('small', null, 'Versi ringkas (R1–R8)'), codeView(lines, { labels: RL.slice(1), cls: 'ketuk', onLine: (i) => {
      if (i !== 0) { oops(); say(msg, 'bad', i === 4 || i === 6 ? 'Baris ini memakai len(hari_sekolah), jadi ikut menyesuaikan sendiri.' : 'Baris ini tidak bergantung pada banyak hari.'); return; }
      ctx.sound.good(); say(msg, 'info', 'Cukup R1! Sekarang seret setiap murid ke hari piketnya yang baru (i % 6).'); sortStep();
    } }));
  }
  function sortStep() {
    const S = parseJadwal(run(RING(RIGHT, true)).out); const days = [...HARI, 'Sabtu']; const where = {}; days.forEach((h) => S[h].forEach((s) => { where[s] = h; }));
    let placed = 0;
    const bins = el('div', { class: 'bf38-hari' }, days.map((h) => el('div', { class: 'bf38-bin', 'data-drop': h }, el('b', null, h), el('div', { class: 'bf38-isi' }))));
    const tray = el('div', { class: 'bf38-baki' }, SISWA.map((s, i) => el('div', { class: 'bf38-tag', 'data-drag': s }, el('small', null, String(i)), s)));
    const host = el('div', { class: 'bf38-kolom' }, codeView([R1(true)], { labels: ['R1'], hl: [0] }), bins, tray);
    dnd(host, (tag, bin) => {
      const s = tag.dataset.drag; const h = bin.dataset.drop; if (!where[s] || !bin.classList.contains('bf38-bin')) return;
      const i = SISWA.indexOf(s);
      if (where[s] !== h) { oops(); shake(tag); say(msg, 'bad', `${s} berindeks ${i}: ${i} % 6 = ${i % 6}, jadi hari ke-${(i % 6) + 1}.`); return; }
      tag.classList.add('locked'); bin.querySelector('.bf38-isi').append(tag); ctx.sound.tap(); placed++;
      if (placed < SISWA.length) { say(msg, 'info', 'Tepat.'); return; }
      tray.remove(); ctx.sound.good(); say(msg, '', 'Satu baris diubah, jadwal enam hari langsung benar. Versi awal butuh sembilan perubahan.'); done();
    });
    fill(box, host);
  }
}

// Misi 3: fill the frame of petugas(3), deliver the return value, then lose K6.
const KODE_K = (ret = true) => PETUGAS(ret).slice(2);
const KLAB = (ret = true) => KL(ret).slice(2);
function kurirRound(area, ctx, { oops, done }) {
  const msg = msg38('K7 memanggil petugas(3). Ketuk murid yang masuk ke hasil, sesuai urutan perulangan.');
  const out = layar(); let ret = true; let hl = [4]; let phase = 'isi'; const hasil = [];
  const codeBox = el('div'); const frames = el('div', { class: 'bf38-kolom' }); const left = el('div', { class: 'bf38-kolom' });
  const drawCode = () => fill(codeBox, codeView(KODE_K(ret), { labels: KLAB(ret), hl, cls: phase === 'galat' ? 'ketuk' : '', onLine: phase === 'galat' ? tapLine : null }));
  let regu = '?';
  const drawFrames = (pkg = null) => fill(frames,
    phase === 'isi' || phase === 'antar' || phase === 'none' ? el('div', { class: 'bf38-bingkai' }, el('b', null, 'bingkai petugas(3)'), el('code', null, 'urutan = 3'), el('code', null, `hasil = [${hasil.map((x) => `'${x}'`).join(', ')}]`), pkg) : null,
    el('div', { class: 'bf38-bingkai global', 'data-drop': 'regu' }, el('b', null, 'program utama (global)'), el('code', null, `regu_kamis = ${regu}`)),
    el('div', { class: 'bf38-kolom', 'data-drop': 'layar' }, el('small', null, 'Layar'), out));
  const want = run(PETUGAS()).vars.regu_kamis.map((x) => x);
  const pick = (s, i, b) => {
    if (phase !== 'isi' || b.classList.contains('on')) return;
    const w = want[hasil.length];
    if (s !== w) { oops(); shake(b); say(msg, 'bad', want.includes(s) ? 'Perulangan mulai dari indeks 0. Siapa yang lebih dulu?' : `${s} berindeks ${i}: ${i} % 5 = ${i % 5}, bukan 3.`); return; }
    b.classList.add('on'); hasil.push(s); ctx.sound.tap(); drawFrames();
    if (hasil.length < want.length) { say(msg, 'info', 'Tepat. Lanjutkan perulangan.'); return; }
    phase = 'antar'; hl = [5]; drawCode(); fill(left, el('div', { class: 'bf38-hitung' }, 'K6: return hasil'));
    drawFrames(el('div', { class: 'bf38-paket', 'data-drag': 'list' }, `📦 ['Dodi', 'Iwan']`));
    say(msg, 'info', 'K6 mengembalikan hasil. Antar paketnya ke tempat yang memanggil.');
  };
  const host = el('div', { class: 'bf38-dua' }, el('div', { class: 'bf38-kolom' }, codeBox, left), frames);
  dnd(host, (pkg, target) => {
    const t = target.dataset.drop; const v = pkg.dataset.drag;
    if (phase === 'antar') {
      if (t === 'layar') { oops(); shake(pkg); say(msg, 'bad', 'return tidak menampilkan apa pun. Nilainya dikirim ke baris yang memanggil: K7.'); return; }
      if (t !== 'regu') return;
      regu = "['Dodi', 'Iwan']"; phase = 'cetak'; hl = [6]; ctx.sound.good(); drawCode(); drawFrames();
      play(out, run(PETUGAS()).out, { end: () => { say(msg, 'info', 'Bingkai hilang setelah return. Tapi lihat: Si Salin-Tempel menghapus K6!'); setTimeout(lose, 2200); } });
    } else if (phase === 'none') {
      if (t !== 'regu') return;
      if (v !== 'None') { oops(); shake(pkg); say(msg, 'bad', v === 'list' ? 'Tanpa K6, hasil tertinggal di bingkai dan ikut hilang.' : 'Tidak ada list yang dikirim sama sekali.'); return; }
      regu = 'None'; phase = 'galat'; hl = []; ctx.sound.good(); drawCode(); drawFrames(); out.textContent = ' ';
      say(msg, 'info', 'regu_kamis berisi None. Ketuk baris yang memunculkan galat.');
    }
  });
  function lose() {
    ret = false; phase = 'none'; regu = '?'; hl = [5]; drawCode();
    drawFrames(el('div', { class: 'bf38-baki' }, ['None', '[]', 'list'].map((v) => el('div', { class: 'bf38-paket', 'data-drag': v }, v === 'list' ? "['Dodi', 'Iwan']" : v))));
    say(msg, 'info', 'Tanpa return, apa yang diterima regu_kamis? Seret kartunya.');
  }
  function tapLine(i) {
    if (phase !== 'galat') return;
    const N = run(PETUGAS(false)); const at = N.error.line - 2;
    if (i !== at) { oops(); say(msg, 'bad', i === at - 1 ? 'K7 hanya menyimpan None ke regu_kamis. Itu belum galat.' : 'Baris ini berjalan tanpa masalah.'); return; }
    phase = 'end'; hl = [i]; drawCode(); fill(left, el('div', { class: 'bf38-hitung merah' }, 'Bug: K6 · Galat: K8'));
    play(out, [], { err: N.error.text, end: () => { say(msg, '', 'Bugnya di K6, galatnya baru muncul di K8. Letak galat tidak selalu sama dengan letak bug.'); done(); } });
  }
  drawCode(); drawFrames(); fill(left, muridBoard(pick));
  area.append(el('div', { class: 'bf38-daftar-daftar' }, listCard('siswa', SISWA)), host, msg);
}

// Misi 4: push and pop frames while poin_regu runs.
const TUGAS3 = ['menyapu', 'mengepel', 'menghapus papan'];
const POIN_A = [0, 1, 2, 3, 4, 5, 6]; const POIN_B = [8, 9, 10, 11, 12, 14, 15, 16];
function menaraRound(area, ctx, { oops, done }) {
  const msg = msg38('B14 memanggil poin_regu. Seret bingkainya ke puncak menara.');
  // poin_regu frame values; t is set when B11 runs.
  const pr = { total: 0, t: null }; const glob = { hasil: null };
  const stack = []; let s = 0; let made = 0;
  const STEPS = [
    { at: 'B14', act: 'push', f: 'poin_regu', say: 'B14 memanggil poin_regu. Seret bingkainya ke puncak menara.' },
    { at: 'B11', act: 'push', f: 'poin', t: 0, say: 'B11: t = "menyapu", lalu poin(t) dipanggil.' },
    { at: 'B3', act: 'isi', say: 'B3 berjalan pertama kali. Isi nilai di setiap bingkai.' },
    { at: 'B3', act: 'pop', ret: 2, say: 'B3: return 2. Ambil bingkai teratas.' },
    { at: 'B11', act: 'push', f: 'poin', t: 1, say: 'B11: t = "mengepel", lalu poin(t) dipanggil.' },
    { at: 'B5', act: 'pop', ret: 3, say: 'B5: return 3.' },
    { at: 'B11', act: 'push', f: 'poin', t: 2, say: 'B11: t = "menghapus papan", lalu poin(t) dipanggil.' },
    { at: 'B7', act: 'pop', ret: 1, say: 'B7: return 1.' },
    { at: 'B13', act: 'pop', ret: 'total', say: 'B13: return total. Ambil bingkai poin_regu.' },
    { at: 'B15', act: 'cetak', say: 'B15: print(hasil, total). Apa yang tampil?' },
  ];
  const codeBox = el('div', { class: 'bf38-kodedua' }); const tower = el('div', { class: 'bf38-kolom' }); const tray = el('div', { class: 'bf38-baki' });
  const counter = el('div', { class: 'bf38-hitung' }); const live = el('div', { class: 'bf38-kolom' }, tower, tray); const rc = el('div', { class: 'bf38-kolom bf38-menara-kol' });
  const cur = () => STEPS[s];
  const drawCode = () => { const at = cur()?.at; const part = (idx) => codeView(idx.map((i) => (i === 15 ? 'hasil = poin_regu(tugas_piket)' : POIN[i])), { labels: idx.map((i) => BL[i]), hl: idx.map((i, k) => (BL[i] === at ? k : -1)).filter((k) => k >= 0) }); fill(codeBox, part(POIN_A), part(POIN_B)); };
  const frameVars = (f) => (f.name === 'poin' ? [`tugas = "${f.tugas}"`] : [`daftar_tugas = [3 tugas]`, `total = ${pr.total}`, pr.t === null ? null : `t = "${pr.t}"`]);
  const drawTower = () => fill(tower, el('small', null, 'Menara bingkai (puncak = sedang berjalan)'), el('div', { class: 'bf38-menara', 'data-drop': 'menara' },
    stack.map((f, k) => el('div', { class: `bf38-bingkai ${k === stack.length - 1 ? 'atas' : ''}` }, el('b', null, `bingkai ${f.name}`), ...frameVars(f).filter(Boolean).map((v) => el('code', null, v)),
      k === stack.length - 1 ? onTap(el('button', { type: 'button', class: 'bf38-return' }, '⤴ return'), pop) : null)).reverse(),
    el('div', { class: 'bf38-bingkai global' }, el('b', null, 'program utama (global)'), el('code', null, 'total = 100'), el('code', null, `hasil = ${glob.hasil ?? '…'}`))));
  const drawCount = () => { counter.textContent = `Bingkai poin dibuat: ${made} kali`; };
  const advance = () => {
    s++; drawCode(); const st = cur(); say(msg, 'info', st.say);
    if (st.act === 'isi') setTimeout(isiB3, 600);
    if (st.act === 'cetak') setTimeout(cetak, 600);
  };
  function push(name) {
    const st = cur(); if (!st || (st.act !== 'push' && st.act !== 'pop')) return;
    if (st.act === 'pop') { oops(); say(msg, 'bad', `${st.at} menjalankan return: bingkai teratas selesai dan harus diambil dulu.`); return; }
    if (st.f !== name) { oops(); say(msg, 'bad', `${st.at} memanggil ${st.f}, bukan ${name}.`); return; }
    if (name === 'poin') { pr.t = TUGAS3[st.t]; made++; drawCount(); stack.push({ name, tugas: TUGAS3[st.t] }); } else stack.push({ name });
    ctx.sound.tap(); drawTower(); advance();
  }
  function pop() {
    const st = cur(); if (!st || (st.act !== 'push' && st.act !== 'pop')) return;
    if (st.act === 'push') { oops(); say(msg, 'bad', `${st.at} memanggil ${st.f}: bingkai baru harus naik, bukan diambil.`); return; }
    const f = stack.pop(); if (f.name === 'poin') pr.total += st.ret; else glob.hasil = pr.total;
    ctx.sound.tap(); drawTower(); advance();
  }
  function isiB3() {
    const snap = (mk) => el('div', { class: 'bf38-menara' },
      el('div', { class: 'bf38-bingkai atas' }, el('b', null, 'bingkai poin'), el('code', null, 'tugas = ', mk())),
      el('div', { class: 'bf38-bingkai' }, el('b', null, 'bingkai poin_regu'), el('code', null, 'daftar_tugas = [3 tugas]'), el('code', null, 'total = ', mk()), el('code', null, 't = ', mk())),
      el('div', { class: 'bf38-bingkai global' }, el('b', null, 'program utama (global)'), el('code', null, 'total = ', mk()), el('code', null, 'hasil = …')));
    fill(rc, counter, el('small', null, 'Saat B3 pertama kali'), fillBoard(ctx, { oops, msg, view: snap, chips: ['"menyapu"', '0', '"menyapu"', '100', '2', '6', '"mengepel"'], want: ['"menyapu"', '0', '"menyapu"', '100'],
      hints: ['Argumen pertama yang dikirim B11 adalah t = "menyapu".', 'Belum ada tugas yang dijumlahkan: total di poin_regu masih 0.', 'Perulangan B10 sedang di tugas pertama.', 'total milik program utama dibuat di B13 dan tidak disentuh fungsi.'],
      done: () => { ctx.sound.good(); setTimeout(() => { fill(rc, counter, live); advance(); }, 1400); } }));
  }
  function cetak() {
    fill(rc, counter, el('small', null, 'Layar'), fillBoard(ctx, { oops, msg, view: rowsView([['print(hasil, total) → ', '_', ' ', '_']]), chips: ['6', '100', '106', '0', '2'], want: ['6', '100'],
      hints: ['hasil menerima nilai yang dikembalikan poin_regu: 2 + 3 + 1.', 'total global tidak pernah diubah: total di poin_regu milik bingkainya sendiri.'],
      done: () => { say(msg, '', `Bingkai poin dibuat ${made} kali dan selalu hilang setelah return. total di poin_regu lokal, jadi total global tetap 100.`); done(); } }));
  }
  const drawTray = () => fill(tray, el('small', null, 'Bingkai baru:'), ['poin_regu', 'poin'].map((n) => el('div', { class: 'bf38-tag bingkai', 'data-drag': n }, `📦 ${n}`)));
  dnd(live, (card, target) => { if (target.dataset.drop === 'menara') push(card.dataset.drag); });
  drawCode(); drawTower(); drawTray(); drawCount(); fill(rc, counter, live);
  area.append(el('div', { class: 'bf38-daftar-daftar' }, listCard('tugas_piket', TUGAS3.map((t) => `"${t}"`))), el('div', { class: 'bf38-dua' }, codeBox, rc), msg);
}

// Misi 5: whose name is total_tugas, then two fixes.
const GLOBAL_TILES = [['g', 'global total_tugas'], ['z', 'total_tugas = 0', 'Ini membuat total_tugas lokal baru bernilai 0 setiap pemanggilan. Total global tetap 0.'], ['r', 'return total_tugas', 'return di awal fungsi menghentikan fungsi sebelum menambah apa pun.']];
const RETURN_FILL = ['def tambah(total_lama, n):', ['    return ', '_', ' + n'], 'total_tugas = 0', ['total_tugas = ', '_', '(total_tugas, 3)'], 'total_tugas = tambah(total_tugas, 2)', 'print(total_tugas)'];
function globalRound(area, ctx, { oops, done }) {
  const msg = msg38('G3 memberi nilai kepada total_tugas. Seret nama itu ke bingkai pemiliknya.');
  const out = layar(); let left = el('div', { class: 'bf38-kolom' }); const right = el('div', { class: 'bf38-kolom' });
  let lokal = null;
  const draw = () => fill(right, el('div', { class: 'bf38-bingkai', 'data-drop': 'lokal' }, el('b', null, 'bingkai tambah_tugas(3)'), el('code', null, 'n = 3'), lokal ? el('code', { class: 'merah' }, lokal) : null),
    el('div', { class: 'bf38-bingkai global', 'data-drop': 'global' }, el('b', null, 'program utama (global)'), el('code', null, 'total_tugas = 0')), el('small', null, 'Layar'), out);
  fill(left, codeView(GLOBAL(), { labels: GL(), hl: [2] }), el('div', { class: 'bf38-baki' }, el('div', { class: 'bf38-tag', 'data-drag': 'nama' }, '🏷️ total_tugas')));
  draw();
  const host = el('div', { class: 'bf38-dua' }, left, right);
  let phase = 'nama';
  dnd(host, (tag, t) => {
    if (phase !== 'nama' || tag.dataset.drag !== 'nama') return;
    if (t.dataset.drop === 'global') { oops(); shake(tag); say(msg, 'bad', 'Tanpa kartu izin global, nama yang diberi nilai di dalam fungsi menjadi milik bingkai fungsi itu.'); return; }
    if (t.dataset.drop !== 'lokal') return;
    phase = 'galat'; lokal = 'total_tugas = ❓ belum bernilai'; tag.remove(); ctx.sound.tap(); draw();
    const G = run(GLOBAL());
    play(out, G.out, { err: G.error.text, end: () => { say(msg, 'info', 'Ruas kanan G3 membaca total_tugas lokal yang belum bernilai: UnboundLocalError. Pasang kartu izin global.'); setTimeout(fixA, 2600); } });
  });
  area.append(host, msg);
  function fixA() {
    lokal = null; draw(); out.textContent = ' ';
    const l2 = el('div', { class: 'bf38-kolom' }); host.replaceWith(el('div', { class: 'bf38-dua' }, l2, right)); left = l2;
    fill(left, el('small', null, 'Perbaikan 1: kartu izin global'), tileSlots(ctx, { oops, msg, build: ['total_tugas = 0', 'def tambah_tugas(n):', ['g', 1], '    total_tugas = total_tugas + n', 'tambah_tugas(3)', 'tambah_tugas(2)', 'print(total_tugas)'], tiles: GLOBAL_TILES,
      onFull: () => play(out, run(GLOBAL('global')).out, { end: () => { say(msg, 'info', 'Keluaran 5. Sekarang perbaikan tanpa global: parameter dan return.'); setTimeout(fixB, 2200); } }) }));
  }
  function fixB() {
    fill(left, el('small', null, 'Perbaikan 2: parameter dan return'), fillBoard(ctx, { oops, msg, view: codeFill(RETURN_FILL), chips: ['total_lama', 'tambah', 'total_tugas', 'print', 'n'], want: ['total_lama', 'tambah'],
      hints: ['Di dalam fungsi, pakai nama parameternya: total_lama.', 'Panggil fungsi tambah, lalu simpan nilai kembaliannya.'],
      done: () => { out.textContent += `\n${run(GLOBAL('return')).out[0]}`; ctx.sound.good(); say(msg, '', 'Keduanya 5. Versi parameter dan return tidak diam-diam mengubah data di luar fungsi, jadi lebih mudah diuji.'); done(); } }));
  }
}

// Misi 6: code review table.
export const TINJAU = () => [['Banyak baris', String(ORIG().length), String(RING().length)], ['Blok yang mirip', 'lima', 'tidak ada'], ['Menambah Sabtu', '5 diubah + 4 ditambah', 'R1 saja'], ['Risiko salah salin', 'tinggi', 'tidak ada'], ['Bisa diuji sendiri', 'seluruh program', 'petugas(3)']];
const TINJAU_HINT = ['Hitung semua baris versi awal: baris 1 ditambah lima blok berisi 4 baris.', 'Versi ringkas: baris 1 ditambah R1–R8.', 'Senin sampai Jumat masing-masing punya blok sendiri yang mirip.', 'Versi ringkas hanya punya satu fungsi.', 'Ingat Misi 1: lima % 5 diubah dan satu blok empat baris ditambah.', 'Ingat Misi 2: hanya daftar hari yang berubah.', 'Bug Kamis lahir dari menyalin blok.', 'Tidak ada blok yang disalin di versi ringkas.', 'Versi awal tidak punya bagian yang bisa dipanggil sendiri.', 'Fungsi bisa dipanggil sendiri untuk diuji, misalnya untuk hari Kamis.'];
function tinjauRound(area, ctx, { oops, done }) {
  const msg = msg38('Isi tabel dari kiri ke kanan, atas ke bawah.');
  const T = TINJAU();
  const view = (mk) => el('table', { class: 'bf38-tabel' }, el('tr', null, el('th', null, 'Kriteria'), el('th', null, 'Versi awal'), el('th', null, 'Versi ringkas')), T.map(([k]) => el('tr', null, el('th', null, k), el('td', null, mk()), el('td', null, mk()))));
  area.append(fillBoard(ctx, { oops, msg, view, chips: [...T.flatMap(([, a, b]) => [a, b]), '8', 'R5 dan R8'], want: T.flatMap(([, a, b]) => [a, b]), hints: TINJAU_HINT,
    done: () => { say(msg, '', 'Versi ringkas lebih pendek, satu tempat untuk diubah, dan bisa diuji per bagian. Kekurangannya: fungsi masih membaca siswa dan hari_sekolah dari luar.'); done(); } }), msg);
}

// Misi Bos: build buat_jadwal, then test three schedules.
const BOS_TILES = [['init', 'jadwal[hari] = []'], ['add', 'jadwal[hari].append(siswa[i])'], ['ret', 'return jadwal'],
  ['print', 'print(jadwal)', 'Mesin penguji tidak bisa membaca layar. Jadwal harus dikembalikan dengan return.'], ['ret1', 'return jadwal[hari]', 'Yang dikembalikan seluruh jadwal, bukan list satu hari.'],
  ['add1', 'jadwal.append(siswa[i])', 'Dictionary tidak punya append. Tambahkan ke list hari itu: jadwal[hari].'], ['init1', 'jadwal = []', 'Ini mengganti dictionary dengan list kosong. Setiap hari butuh list kosongnya sendiri.']];
const BOS_BUILD = ['    jadwal = {}', '    for hari in hari_sekolah:', ['init', 2], '    for i in range(len(siswa)):', '        hari = hari_sekolah[', '            i % len(hari_sekolah)]', ['add', 2], ['ret', 1]];
export const UJI = () => {
  const J = BUG(); const lama = `{${HARI.map((h) => `"${h}": [${J[h].map((x) => `"${x}"`).join(', ')}]`).join(', ')}}`;
  const T = run([...JADWAL, 'baru = buat_jadwal(siswa, hari_sekolah)', 'sabtu = buat_jadwal(siswa, hari_sekolah + ["Sabtu"])', `lama = ${lama}`, 'a = semua_dapat_piket(baru, siswa)', 'b = semua_dapat_piket(lama, siswa)', 'c = semua_dapat_piket(sabtu, siswa)']);
  return { T, cards: [['baru', 'buat_jadwal, 5 hari', T.vars.a], ['lama', 'jadwal versi awal (bug Kamis)', T.vars.b], ['sabtu', 'buat_jadwal, 6 hari', T.vars.c]] };
};
function bosRound(area, ctx, { oops, done }) {
  const msg = msg38('Rakit isi mesin buat_jadwal. Mesin ini tidak boleh mencetak apa pun.');
  const U = UJI(); const out = layar(); const right = el('div', { class: 'bf38-kolom' }, el('small', null, 'Layar'), out);
  const left = el('div', { class: 'bf38-kolom' }, el('code', { class: 'bf38-mesin' }, 'def buat_jadwal(siswa, hari_sekolah):'), tileSlots(ctx, { oops, msg, build: BOS_BUILD, tiles: BOS_TILES,
    onFull: () => { const B = run([...JADWAL, 'j = buat_jadwal(siswa, hari_sekolah)']); out.textContent = B.out.length ? B.out.join('\n') : '(layar kosong)';
      right.append(el('div', { class: 'bf38-bingkai global' }, el('b', null, 'j = buat_jadwal(siswa, hari_sekolah)'), ...HARI.map((h) => el('code', null, `"${h}": ${pyRepr(B.vars.j.get ? B.vars.j.get(h) : B.vars.j[h], true)}`))));
      ctx.sound.good(); say(msg, 'info', 'Jadwal dikembalikan tanpa tampil di layar. Kini uji tiga jadwal dengan semua_dapat_piket.'); setTimeout(test, 2600); } }));
  area.append(el('div', { class: 'bf38-dua' }, left, right), msg);
  function test() {
    let n = 0;
    const lamp = (v) => el('div', { class: `bf38-lampu ${v ? 'ya' : 'tidak'}`, 'data-drop': v ? 'True' : 'False' }, el('b', null, v ? '✅ True' : '❌ False'), el('div', { class: 'bf38-isi' }));
    const tray = el('div', { class: 'bf38-baki' }, U.cards.map(([k, t]) => el('div', { class: 'bf38-paket', 'data-drag': k }, t)));
    const host = el('div', { class: 'bf38-kolom' }, el('code', { class: 'bf38-mesin' }, 'semua_dapat_piket(jadwal, siswa)'), el('div', { class: 'bf38-lampu-lampu' }, lamp(true), lamp(false)), tray);
    dnd(host, (card, bin) => {
      if (!bin.classList.contains('bf38-lampu')) return;
      const c = U.cards.find((x) => x[0] === card.dataset.drag); const want = c[2] ? 'True' : 'False';
      if (bin.dataset.drop !== want) { oops(); shake(card); say(msg, 'bad', c[0] === 'lama' ? 'Di versi awal Citra muncul dua kali dan Dodi tidak muncul: banyak != 1, jadi mesin mengembalikan False.' : 'Setiap murid muncul tepat satu kali di jadwal ini.'); return; }
      card.classList.add('locked'); bin.querySelector('.bf38-isi').append(card); ctx.sound.tap(); n++;
      if (n < U.cards.length) { say(msg, 'info', 'Tepat.'); return; }
      tray.remove(); say(msg, '', 'Mesin penguji memeriksa jadwal tanpa membaca layar. Itulah gunanya return: nilai bisa dipakai fungsi lain.'); done();
    });
    fill(left, host);
  }
}

export default {
  id: 'sma-38-fungsi-lingkup',
  title: 'Fungsi dan Ruang Lingkup Variabel',
  topic: 'Fungsi Python dengan parameter dan return, None dari fungsi tanpa return, bingkai fungsi dan tumpukan pemanggilan, variabel lokal dan global, UnboundLocalError, serta refaktor kode yang berulang',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧹',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Temukan bug salin-tempel di program jadwal piket, ringkas menjadi fungsi, bedakan menampilkan dan mengembalikan, telusuri tumpukan bingkai fungsi, lalu perbaiki galat variabel lokal dan global.',
  extraModes: [
    { id: 'tumpukan', icon: '📚', label: 'Tumpukan Pemanggilan', desc: 'Setiap pemanggilan fungsi menambah bingkai berisi parameter dan variabel lokal, dan bingkai hilang saat return', create: createStack },
    { id: 'ringkas', icon: '✂️', label: 'Peringkas Kode', desc: 'Warnai blok yang berulang, susun versi ringkas, lalu bandingkan keluaran dan banyak barisnya', create: createRingkas },
    { id: 'bug', icon: '🐞', label: 'Sakelar Bug', desc: 'Nyalakan bug Kamis, hapus K6, atau jalankan program lokal-global, dan lihat galat beserta barisnya', create: createBug },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Ringkas Program', desc: 'Setiap tim mendapat program berulang dan memilih versi ringkasnya. Poin untuk keluaran yang sama dan baris paling sedikit', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bf38-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'bf38-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD38[k];
        foe = el('div', { class: 'bf38-musuh' }, el('b', null, '✂️ Si Salin-Tempel'), el('span', null, ulah));
        wrap.append(el('div', { class: 'bf38-kepala' }, misiHead(no, judul, tujuan, '🔧'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Kodenya sudah dibereskan ✓'; next(ms); } });
      if (r === 0) { go('blok', 1); blokRound(area, ctx, fin(5000)); }
      else if (r === 1) { go('bug', 1); bugRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('sabtu', 1); sabtuRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('mesin', 2); mesinRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('panggil', 2); panggilRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('kurir', 3); kurirRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('menara', 4); menaraRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('global', 5); globalRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('tinjau', 6); tinjauRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

function versionMode(root, title, VERS, make) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  let ver = VERS[0][0]; let tr = null;
  const draw = () => { tr?.stop?.(); const v = VERS.find((x) => x[0] === ver); tr = make(v);
    wrap.replaceChildren(el('p', { class: 'prompt' }, title), el('div', { class: 'seg fl-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr); };
  draw();
}

function createStack(root) {
  versionMode(root, 'Tumpukan pemanggilan', [['poin', 'poin piket (B1–B15)', POIN, BL], ['k', 'petugas(3)', PETUGAS(), KL()], ['k6', 'petugas tanpa K6', PETUGAS(false), KL(false)], ['g', 'lokal-global (galat)', GLOBAL(), GL()], ['gg', 'dengan global', GLOBAL('global'), null], ['gr', 'dengan parameter dan return', GLOBAL('return'), null], ['r', 'versi ringkas', RING(), RL]], (v) => stackTracer(v[2], v[3]));
}

function createBug(root) {
  const OUT = (lines, labels) => { const R = run(lines); const e = R.error; return el('div', { class: 'fl-bug-hasil' }, pyCode(lines, { labels, cls: 'fl-kecil', warn: e ? [e.line] : [] }), el('div', null, el('small', null, 'Keluaran'), el('pre', { class: 'fl-keluaran' }, R.out.join('\n') || ' '), e ? el('p', { class: 'fl-galat' }, `Baris ${labels?.[e.line] ?? e.line + 1}: ${e.text}`) : el('p', { class: 'fl-beres' }, 'Tanpa galat.'))); };
  versionMode(root, 'Sakelar bug', [['kb', 'bug Kamis menyala', () => OUT(ORIG(), null)], ['kf', 'bug Kamis diperbaiki', () => OUT(ORIG({ kamis: 3 }), null)], ['k6', 'K6 dihapus', () => OUT(PETUGAS(false), KL(false))], ['k', 'dengan K6', () => OUT(PETUGAS(), KL())], ['g', 'soal 5: tanpa global', () => OUT(GLOBAL(), GL())], ['gg', 'soal 5: global', () => OUT(GLOBAL('global'), null)], ['gr', 'soal 5: return', () => OUT(GLOBAL('return'), null)]], (v) => v[2]());
}

function createRingkas(root, ctx) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  const pick = { r2: '……', r3: '……', r5: '……', r8: '……' }; let sabtu = false; let warna = {}; let hasil = null;
  const draw = () => {
    const orig = ORIG({ kamis: 3, sabtu });
    const code = pyCode(orig, { cls: 'fl-kecil', onLine: (i) => { if (i === 0) return; const b = Math.floor((i - 1) / 4); warna[b] = ((warna[b] ?? -1) + 1) % 3; draw(); } });
    [...code.children].forEach((li, i) => { if (i > 0) { const b = Math.floor((i - 1) / 4); if (warna[b] !== undefined) li.classList.add(`fl-warna${warna[b]}`); if ((i - 1) % 4 === 2) li.classList.add('fl-beda'); } });
    const filled = Object.values(pick).every((x) => x !== '……');
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Peringkas kode'),
      el('div', { class: 'seg fl-versi' }, [[false, 'lima hari'], [true, 'tambah Sabtu']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${sabtu === v ? 'on' : ''}`, type: 'button' }, t), () => { sabtu = v; hasil = null; draw(); }))),
      el('div', { class: 'fl-dua' },
        el('div', null, el('small', null, `Versi awal (Kamis sudah diperbaiki): ${orig.length} baris. Ketuk blok untuk mewarnainya.`), code),
        el('div', null, el('small', null, `Versi ringkas: ${RING(pick, sabtu).length} baris`), pyCode(RING(pick, sabtu), { labels: RL, cls: 'fl-kecil', hl: sabtu ? [1] : [] }),
          el('div', { class: 'fl-kartu' }, BLANKS.map(([k, t, opts]) => el('div', { class: 'fl-pilih' }, el('small', null, t), el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: `seg-btn ${pick[k] === o ? 'on' : ''}`, type: 'button' }, o), () => { pick[k] = o; hasil = null; draw(); })))))),
          button('▶ Jalankan dan bandingkan', () => { const A = run(orig); const B = run(RING(pick, sabtu)); hasil = { a: A.out, b: B.out, e: B.error, same: !B.error && A.out.join('\n') === B.out.join('\n') }; if (hasil.same) ctx.sound.good(); else ctx.sound.bad(); draw(); }, filled ? 'primary' : ''))),
      ...(hasil ? [el('div', { class: 'fl-dua' }, el('pre', { class: 'fl-keluaran' }, hasil.a.join('\n')), el('pre', { class: 'fl-keluaran' }, hasil.b.join('\n') + (hasil.e ? `\n${hasil.e.text}` : '')))] : []),
      el('p', { class: `reveal ${hasil ? (hasil.same ? '' : 'bad') : 'info'}` }, hasil ? (hasil.same ? `Keluaran sama. ${orig.length} baris menjadi ${RING(pick, sabtu).length} baris.${sabtu ? ' Untuk Sabtu, versi ringkas hanya mengubah R1.' : ''}` : 'Keluaran berbeda. Periksa bagian kosongnya.') : 'Pilih isi setiap bagian kosong, lalu jalankan.'));
  };
  draw();
}

// Repetitive programs for the team mode, each with three candidate refactors.
export const TUGAS = [
  ['Konversi suhu', ['c = 30', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")', 'c = 25', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")', 'c = 100', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")'],
    [['def ke_f(c):', '    print(c, "C =", c * 9 // 5 + 32, "F")', 'for c in [30, 25, 100]:', '    ke_f(c)'], ['def ke_f(c):', '    f = c * 9 // 5 + 32', '    print(c, "C =", f, "F")', 'ke_f(30)', 'ke_f(25)', 'ke_f(100)'], ['def ke_f(c):', '    f = c * 9 / 5 + 32', '    print(c, "C =", f, "F")', 'for c in [30, 25, 100]:', '    ke_f(c)']]],
  ['Rekap nilai', ['mtk = [80, 90, 70]', 'print("Matematika", sum(mtk) // len(mtk))', 'ipa = [85, 75, 95]', 'print("IPA", sum(ipa) // len(ipa))', 'ips = [60, 80, 70]', 'print("IPS", sum(ips) // len(ips))'],
    [['def rata(nama, nilai):', '    print(nama, sum(nilai) // len(nilai))', 'rata("Matematika", [80, 90, 70])', 'rata("IPA", [85, 75, 95])', 'rata("IPS", [60, 80, 70])'], ['def rata(nilai):', '    return sum(nilai) // len(nilai)', 'mtk = [80, 90, 70]', 'print("Matematika", rata(mtk))', 'ipa = [85, 75, 95]', 'print("IPA", rata(ipa))', 'ips = [60, 80, 70]', 'print("IPS", rata(ips))'], ['nilai = [80, 90, 70]', 'def rata(nama):', '    print(nama, sum(nilai) // len(nilai))', 'rata("Matematika")', 'rata("IPA")', 'rata("IPS")']]],
  ['Diskon kantin', ['harga = 12000', 'print("Nasi goreng", harga - harga * 10 // 100)', 'harga = 8000', 'print("Mi ayam", harga - harga * 10 // 100)', 'harga = 5000', 'print("Es teh", harga - harga * 10 // 100)'],
    [['def diskon(nama, harga):', '    print(nama, harga - harga * 10 // 100)', 'diskon("Nasi goreng", 12000)', 'diskon("Mi ayam", 8000)', 'diskon("Es teh", 5000)'], ['def potong(harga):', '    return harga * 10 // 100', 'harga = 12000', 'print("Nasi goreng", harga - potong(harga))', 'harga = 8000', 'print("Mi ayam", harga - potong(harga))', 'harga = 5000', 'print("Es teh", harga - potong(harga))'], ['def diskon(nama, harga):', '    print(nama, harga * 10 // 100)', 'diskon("Nasi goreng", 12000)', 'diskon("Mi ayam", 8000)', 'diskon("Es teh", 5000)']]],
  ['Presensi ekstrakurikuler', ['print("Pramuka: hadir", 25, "dari", 30)', 'print("Persen:", 25 * 100 // 30)', 'print("PMR: hadir", 18, "dari", 20)', 'print("Persen:", 18 * 100 // 20)', 'print("Paskibra: hadir", 12, "dari", 16)', 'print("Persen:", 12 * 100 // 16)'],
    [['def rekap(ekskul, hadir, anggota):', '    print(ekskul + ": hadir", hadir, "dari", anggota)', '    print("Persen:", hadir * 100 // anggota)', 'rekap("Pramuka", 25, 30)', 'rekap("PMR", 18, 20)', 'rekap("Paskibra", 12, 16)'], ['def persen(hadir, anggota):', '    print("Persen:", hadir * 100 // anggota)', 'print("Pramuka: hadir", 25, "dari", 30)', 'persen(25, 30)', 'print("PMR: hadir", 18, "dari", 20)', 'persen(18, 20)', 'print("Paskibra: hadir", 12, "dari", 16)', 'persen(12, 16)'], ['def rekap(ekskul, hadir, anggota):', '    print(ekskul + ": hadir", hadir, "dari", anggota)', '    print("Persen:", anggota * 100 // hadir)', 'rekap("Pramuka", 25, 30)', 'rekap("PMR", 18, 20)', 'rekap("Paskibra", 12, 16)']]],
];
// Points for a candidate: 1 when its output matches, +1 when it is also the shortest matching one.
export function nilaiRingkas(task, k) { const [, orig, cands] = task; const want = run(orig).out.join('\n'); const ok = cands.map((c) => { const R = run(c); return !R.error && R.out.join('\n') === want; }); const best = Math.min(...cands.filter((_, i) => ok[i]).map((c) => c.length)); return ok[k] ? 1 + (cands[k].length === best ? 1 : 0) : 0; }

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(4, nT * 2); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Ringkas Program selesai', pts, again: () => pickTeams(wrap, 'Ringkas Program', start) }); return; }
      const team = t % nT; const task = TUGAS[t % TUGAS.length]; const [name, orig, cands] = task; const order = ctx.rand.shuffle([0, 1, 2]);
      const msg = el('p', { class: 'reveal info' }, `Tim ${team + 1}: pilih versi ringkas yang keluarannya sama dan barisnya paling sedikit.`);
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `${name}: ${orig.length} baris berulang`), el('div', { class: 'fl-dua' }, el('div', null, pyCode(orig, { cls: 'fl-kecil' })), el('pre', { class: 'fl-keluaran' }, run(orig).out.join('\n'))),
        el('div', { class: 'fl-calon' }, order.map((k, j) => onTap(el('button', { class: 'fl-calon-btn', type: 'button' }, el('b', null, `Versi ${'ABC'[j]} · ${cands[k].length} baris`), pyCode(cands[k], { cls: 'fl-kecil' })), () => {
          if (wrap.querySelector('.fl-calon.beres')) return;
          const p = nilaiRingkas(task, k); pts[team] += p; if (p) ctx.sound.good(); else ctx.sound.bad();
          const R = run(cands[k]); wrap.querySelector('.fl-calon').classList.add('beres');
          wrap.querySelectorAll('.fl-calon-btn')[j].append(el('pre', { class: `fl-keluaran ${p ? '' : 'beda'}` }, R.out.join('\n')));
          say(msg, p ? '' : 'bad', p === 2 ? `Keluaran sama dan paling ringkas: Tim ${team + 1} +2.` : p === 1 ? `Keluaran sama, tetapi ada versi yang lebih ringkas: Tim ${team + 1} +1.` : 'Keluarannya berbeda, jadi refaktor ini mengubah hasil: 0 poin.');
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); t++; setTimeout(step, 3600);
        }))), msg);
    }
    step();
  }
  pickTeams(wrap, 'Ringkas Program', start);
}
