// Pemeriksa Rima Pantun — SMA/SMK (16–18 tahun), coding. Python strings:
// indexes and slices, split/join/strip/lower, a first rhyme checker that is
// fooled by punctuation (and passes pantun 3 by luck), Rina's fix that trips
// on capitals and trailing spaces, cek_abab with bunyi_akhir, word counts,
// decoy pantun, and the last-vowel rhyme from the Tantangan.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots } from './misi-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const PANTUN = {
  p1: ['Burung pipit terbang ke sawah,', 'Hinggap sebentar di pohon jati.', 'Rajin belajar jangan menyerah,', 'Ilmu dicari sepenuh hati!'],
  p2: ['Burung pipit terbang ke sawah,', 'Hinggap sebentar di pohon jati.', 'RAJIN BELAJAR JANGAN MENYERAH,', 'Ilmu dicari sepenuh hati.'],
  p3: ['Kalau ada sumur di ladang,', 'Boleh kita menumpang mandi.', 'Kalau ada umur panjang,', 'Boleh kita berjumpa lagi.'],
  kecoh: ['Saya suka makan sawah,', 'Saya suka makan jati.', 'Saya suka makan sawah,', 'Saya suka makan jati.'],
};
export const NAMA = { p1: 'Pantun 1', p2: 'Pantun 2 (poster)', p3: 'Pantun 3', kecoh: 'Pantun pengecoh' };
const PUNCT = '.,!?;:';
// Program versions. v1 = lines 1–10, rina / rina2 change line 5, akhir = lines 11–21, vokal = Tantangan.
export const V1 = (b5 = 'b[-2:]') => ['def cek_rima(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', `        bunyi.append(${b5})`, '    print(bunyi)', '    if bunyi[0] == bunyi[2] and bunyi[1] == bunyi[3] and bunyi[0] != bunyi[1]:', '        print("Rima a-b-a-b")', '    else:', '        print("Bukan a-b-a-b")'];
export const RINA = 'b.rstrip(".,!?;:")[-2:]'; export const RINA2 = 'b.rstrip(".,!?;:").lower()[-2:]'; export const RINA3 = 'b.strip().rstrip(".,!?;:").lower()[-2:]';
const CEK = (fn) => ['def cek_abab(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', `        bunyi.append(${fn}(b))`, '    pola = "-".join(bunyi)', '    benar = len(baris) == 4 and bunyi[0] == bunyi[2] and bunyi[1] == bunyi[3] and bunyi[0] != bunyi[1]', '    return pola, benar'];
export const AKHIR = ['def bunyi_akhir(b):', '    b = b.strip().rstrip(".,!?;:").lower()', '    return b[-2:]', ...CEK('bunyi_akhir')];
export const VOKAL = ['def bunyi_vokal(b):', '    kata = b.strip().rstrip(".,!?;:").lower().split()[-1]', '    i = len(kata) - 1', '    while i >= 0 and kata[i] not in "aiueo":', '        i = i - 1', '    return kata[i:]', ...CEK('bunyi_vokal')];
export const KATA = ['def cek_kata(teks):', '    for b in teks.split("\\n"):', '        banyak = len(b.split())', '        if banyak < 4 or banyak > 6:', '            return False', '    return True'];
export const VERSI = [['v1', 'versi pertama', V1(), null], ['rina', 'versi Rina', V1(RINA), null], ['rina2', 'Rina + lower()', V1(RINA2), null], ['akhir', 'bunyi_akhir', AKHIR, ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']], ['vokal', 'bunyi_vokal (Tantangan)', VOKAL, null]];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, ...o });
// Run one version on a pantun text: { bunyi, pola, benar, out, error }.
export function periksa(ver, teks) {
  const v = VERSI.find((x) => x[0] === ver); const vars = { teks_masuk: teks };
  if (ver.startsWith('v1') || ver.startsWith('rina')) { const R = run([...v[2], 'cek_rima(teks_masuk)'], { vars }); if (R.error) return { error: R.error.text, out: R.out }; const bunyi = R.out[0]; return { bunyi, out: R.out, benar: R.out[1] === 'Rima a-b-a-b', pola: null }; }
  const fn = ver === 'akhir' ? 'bunyi_akhir' : 'bunyi_vokal';
  const R = run([...v[2], 'pola, benar = cek_abab(teks_masuk)', 'bunyi = []', 'for b in teks_masuk.split("\\n"):', `    bunyi.append(${fn}(b))`], { vars });
  if (R.error) return { error: R.error.text, out: R.out };
  return { bunyi: pyRepr(R.vars.bunyi, true), pola: R.vars.pola, benar: R.vars.benar, out: [] };
}
export const kata = (teks) => { const R = run([...KATA, 'ok = cek_kata(teks_masuk)', 'n = []', 'for b in teks_masuk.split("\\n"):', '    n.append(len(b.split()))'], { vars: { teks_masuk: teks } }); return { ok: R.vars.ok, n: R.vars.n }; };
export const evalS = (s, expr) => { const R = run([`x = ${expr}`], { vars: { s } }); return R.error ? R.error.text : pyRepr(R.vars.x, true); };
// Character range [a, b) of a line that a version takes as its ending sound.
export function ambil(ver, b) {
  if (ver === 'v1') return [Math.max(0, b.length - 2), b.length];
  let lo = 0; let hi = b.length;
  if (ver === 'akhir' || ver === 'vokal' || ver === 'rina3') { while (lo < hi && /\s/.test(b[lo])) lo++; while (hi > lo && /\s/.test(b[hi - 1])) hi--; }
  while (hi > lo && PUNCT.includes(b[hi - 1])) hi--;
  if (ver !== 'vokal') return [Math.max(lo, hi - 2), hi];
  let w = hi; while (w > lo && !/\s/.test(b[w - 1])) w--; let i = hi - 1; while (i >= w && !'aiueo'.includes(b[i].toLowerCase())) i--; return [Math.max(i, w), hi];
}
// Characters as boxes with positive and negative indexes; lit = [a, b) highlighted.
export function charBoxes(s, lit = null, { neg = true } = {}) {
  return el('div', { class: 'ri-kotak' }, [...s].map((c, i) => el('span', { class: `${lit && lit.includes(i) ? 'ambil' : ''} ${c === ' ' ? 'spasi' : ''}` }, el('small', null, String(i)), el('b', null, c === ' ' ? '␣' : c), neg ? el('small', null, String(i - s.length)) : null)));
}
// Indexes taken by a slice/index expression on s (for highlighting).
export function sliceIdx(s, expr) {
  const m = expr.match(/^s\[(-?\d*)(?::(-?\d*))?(?::(-?\d+))?\]$/); if (!m) return [];
  const n = s.length; const R = run(['x = list(range(n))', `y = x${expr.slice(1)}`], { vars: { n } }); const y = R.vars.y; return Array.isArray(y) ? y : typeof y === 'number' ? [y] : [];
}
const lit = (ls) => JSON.stringify(ls.join('\n'));
const pantunView = (key, ver = null) => el('div', { class: 'ri-pantun' }, el('small', null, NAMA[key]), PANTUN[key].map((b) => { const [a, z] = ver ? ambil(ver, b) : [b.length, b.length]; return el('p', null, b.slice(0, a), el('mark', null, b.slice(a, z)), b.slice(z)); }));

// ---- Permainan: Mesin Saring Pantun ----
// Letter cards with positive and negative indexes; Si Pengecoh slips in
// punctuation, capitals and invisible spaces.
const HEAD40 = {
  gunting: ['Gunting Kartu Huruf', 'Geser jendela potongan: ketuk kartu awal dan kartu akhir.', 'Menyembunyikan koma di ujung kata!'],
  method: ['Mesin Pengubah Teks', 'Seret hasil setiap method ke tempatnya.', 'Menukar hasil mesin!'],
  v1: ['Mesin Versi Pertama', 'Ambil dua kartu terakhir setiap baris, lalu jatuhkan putusan.', 'Tanda baca diselipkan di ujung baris!'],
  untung: ['Lulus karena Untung?', 'Jalankan mesin pada pantun 3, lalu periksa alasannya.', '"Mesinnya pasti sudah benar!"'],
  kapital: ['Serangan Huruf Kapital', 'Ramalkan bunyi baris kapital, lalu pasang perbaikannya.', 'Baris ketiga diubah jadi KAPITAL!'],
  spasi: ['Spasi Tak Terlihat', 'Temukan karakter tersembunyi, lalu pasang pembersihnya.', 'Menyelipkan spasi setelah koma!'],
  rakit: ['Rakit Mesin yang Lebih Baik', 'Susun baris 12 dan 18, lalu uji tiga pantun.', 'Menukar kartu baris!'],
  kata: ['Hitung Kata', 'Ketuk setiap kata untuk menghitungnya.', 'Menyelipkan kata tambahan!'],
  duel: ['Duel Pantun Pengecoh', 'Susun pantun yang lulus mesin padahal buruk.', 'Kini giliranmu menjadi pengecoh!'],
  bos: ['Bunyi yang Sesungguhnya', 'Jadilah bunyi_vokal: mundur sampai bertemu vokal.', '"Pantun 3 pasti ditolak lagi!"'],
};
const msg40 = (t) => el('p', { class: 'reveal info' }, t);
const S40 = 'menyerah,';
// Letter cards; tail > 0 shows only the last `tail` characters as cards.
function hurufView(s, { lit = [], tail = 0, onCard = null, neg = true } = {}) {
  const from = tail ? Math.max(0, s.length - tail) : 0;
  return el('div', { class: 'rp40-huruf' }, from ? el('span', { class: 'rp40-awal' }, s.slice(0, from)) : null, [...s.slice(from)].map((c, j) => {
    const i = from + j; const b = el('button', { type: 'button', class: `rp40-kartu ${lit.includes(i) ? 'ambil' : ''} ${c === ' ' ? 'spasi' : ''}`, 'data-i': String(i) }, el('small', null, String(i)), el('b', null, c === ' ' ? '␣' : c), neg ? el('small', null, String(i - s.length)) : null);
    return onCard ? onTap(b, () => onCard(i, b)) : b;
  }));
}
// Two taps choose a window [start, end]; a single index needs one tap.
function windowPicker(want, { oops, msg, onOk, start: hintStart, end: hintEnd }) {
  let a = null;
  return (i, b) => {
    if (want.length === 1 || a === null) {
      if (i !== want[0]) { oops(); shake(b); say(msg, 'bad', hintStart); return null; }
      if (want.length === 1) { onOk(); return [i]; }
      a = i; return [i];
    }
    if (i !== want[want.length - 1]) { oops(); shake(b); say(msg, 'bad', hintEnd); return [a]; }
    a = null; onOk(); return want;
  };
}
export const GUNTING = ['s[-1]', 's[-2:]', 's[-3:-1]', 's[:4]', 's[2:5]'];
function guntingRound(area, ctx, { oops, done }) {
  const msg = msg40('Ketuk kartu yang diambil s[-1].'); let k = 0; const log = el('div', { class: 'rp40-log' });
  const expr = el('code', { class: 'rp40-ekspr' }); const cards = el('div');
  const draw = (lit = []) => { expr.textContent = GUNTING[k] ?? ''; expr.dataset.e = GUNTING[k] ?? ''; fill(cards, hurufView(S40, { lit, onCard: (i, b) => tap(i, b) })); };
  let pick = null;
  const arm = () => { const want = sliceIdx(S40, GUNTING[k]); pick = windowPicker(want, { oops, msg, onOk: () => ok(want), start: `${GUNTING[k]}: kartu pertama yang diambil ada di indeks ${GUNTING[k].includes(':') ? 'sebelum titik dua (kosong berarti 0)' : 'di dalam kurung siku'}.`, end: 'Indeks sesudah titik dua tidak ikut diambil: berhenti tepat sebelumnya. Kosong berarti sampai ujung.' }); };
  function tap(i, b) { if (k >= GUNTING.length) return; const before = k; const lit = pick(i, b); if (lit && k === before) { ctx.sound.tap(); draw(lit); } }
  function ok(want) {
    const e = GUNTING[k]; log.append(el('span', null, `${e} → ${evalS(S40, e)}`)); ctx.sound.good(); k++;
    if (k < GUNTING.length) { say(msg, 'info', `Tepat: ${evalS(S40, e)}. Sekarang ${GUNTING[k]}.`); arm(); draw(); return; }
    draw(want); say(msg, '', 'Indeks negatif dihitung dari belakang; potongan berhenti tepat sebelum indeks akhirnya.'); done();
  }
  arm(); draw();
  area.append(el('div', { class: 'rp40-soal' }, el('code', null, `s = "${S40}"`), expr), cards, log, msg);
}

// Misi 1b: string methods.
export const METHOD = ['s.upper()', 's.rstrip(",")', '"hati! ".strip()', '"Ilmu dicari sepenuh hati".split()', '"-".join(["ah", "ti", "ah", "ti"])', 'len(s)'];
function methodRound(area, ctx, { oops, done }) {
  const msg = msg40('s = "menyerah,". Seret hasil ke setiap method, dari atas.');
  const want = METHOD.map((e) => evalS(S40, e));
  area.append(fillBoard(ctx, { oops, msg, view: codeFill(METHOD.map((e) => [e, '  →  ', '_'])), chips: [...want, "'MENYERAH'", "'hati'", "'ahtiahti'"], want,
    hints: ['upper() mengubah semua huruf menjadi kapital; koma tetap.', 'rstrip(",") membuang koma di ujung kanan.', 'strip() tanpa argumen hanya membuang spasi di kedua ujung; tanda seru tetap.', 'split() memecah di spasi menjadi list kata.', 'join menyambung isi list dengan "-" di antaranya.', 'Koma juga satu karakter.'],
    done: () => { say(msg, '', 'Method teks tidak mengubah s, tetapi membuat teks baru.'); done(); } }), msg);
}

// Misi 2: the first machine takes the last two cards of every line.
function mesinRound(area, ctx, { oops, done }, key) {
  const lines = PANTUN[key]; const R = periksa('v1', lines.join('\n')); const got = []; let li = 0;
  const msg = msg40('Mesin versi pertama: bunyi.append(b[-2:]). Ketuk dua kartu terakhir baris 1.');
  const box = el('div', { class: 'rp40-kolom' }); const bunyiBox = el('code', { class: 'rp40-bunyi' }); const side = el('div', { class: 'rp40-kolom' });
  const drawBunyi = () => { bunyiBox.textContent = `bunyi = [${got.map((x) => `'${x}'`).join(', ')}]`; };
  const draw = (lit = []) => fill(box, el('small', null, NAMA[key]), lines.map((b, i) => el('div', { class: `rp40-baris ${i === li ? 'aktif' : ''}`, 'data-b': String(i) }, el('small', null, String(i + 1)), i === li ? hurufView(b, { tail: 7, lit, onCard: (j, c) => tap(j, c) }) : el('span', null, b))));
  let pick = null;
  const arm = () => { const b = lines[li]; pick = windowPicker([b.length - 2, b.length - 1], { oops, msg, onOk: ok, start: 'b[-2:] mulai dari indeks −2: kartu kedua dari belakang.', end: 'Potongan sampai ujung: kartu terakhir ikut.' }); };
  function tap(j, c) { if (li >= 4) return; const before = li; const lit = pick(j, c); if (lit && li === before) { ctx.sound.tap(); draw(lit); } }
  function ok() {
    got.push(lines[li].slice(-2)); drawBunyi(); li++; ctx.sound.good();
    if (li < 4) { say(msg, 'info', `Ketuk dua kartu terakhir baris ${li + 1}.`); arm(); draw(); return; }
    draw(); say(msg, 'info', 'Bunyi terkumpul. Apa putusan mesin?');
    fill(side, bunyiBox, el('div', { class: 'rp40-tombol' }, ['Rima a-b-a-b', 'Bukan a-b-a-b'].map((v) => onTap(el('button', { type: 'button', class: 'rp40-pilih', 'data-v': v }, v), () => verdict(v)))));
  }
  function verdict(v) {
    if (!side.querySelector('.rp40-pilih')) return;
    if ((v === 'Rima a-b-a-b') !== R.benar) { oops(); say(msg, 'bad', 'Bandingkan bunyi[0] dengan bunyi[2], dan bunyi[1] dengan bunyi[3], persis karakter demi karakter.'); return; }
    ctx.sound.good();
    if (key === 'p1') { say(msg, 'info', 'Mesin menolak pantun yang berima! Ketuk karakter biang keroknya.'); fill(side, bunyiBox, el('div', { class: 'rp40-tombol' }, ['h', ',', 'i', '.', '!'].map((c) => onTap(el('button', { type: 'button', class: 'rp40-pilih', 'data-v': c }, c), () => culprit(c))))); }
    else { say(msg, 'info', 'Mesin meluluskannya. Karena rimanya, atau karena kebetulan?'); fill(side, bunyiBox, el('div', { class: 'rp40-tombol' }, [['rima', 'karena rimanya g dan i'], ['untung', 'kebetulan: koma, titik, koma, titik']].map(([k, t]) => onTap(el('button', { type: 'button', class: 'rp40-pilih', 'data-v': k }, t), () => luck(k))))); }
  }
  function culprit(c) {
    if (![',', '.', '!'].includes(c)) { oops(); say(msg, 'bad', `"${c}" memang bunyi akhir. Yang membuat "i." dan "i!" berbeda adalah karakter lain.`); return; }
    fill(side, bunyiBox); say(msg, '', 'Tanda baca ikut terpotong: "i." tidak sama dengan "i!". Mesin salah karena tanda baca.'); done();
  }
  function luck(k) {
    if (k !== 'untung') { oops(); say(msg, 'bad', '"g," dan "i." masih memuat tanda baca. Coba bayangkan baris 4 diakhiri tanda seru.'); return; }
    fill(side, bunyiBox); say(msg, '', 'Benar karena kebetulan: tanda bacanya berpola sama. Satu contoh yang lulus tidak membuktikan programnya benar.'); done();
  }
  arm(); draw(); drawBunyi(); fill(side, bunyiBox);
  area.append(el('div', { class: 'rp40-dua' }, box, side), msg);
}

// Misi 3a: Rina's version meets capitals.
function kapitalRound(area, ctx, { oops, done }) {
  const msg = msg40('Versi Rina membuang tanda baca dulu. Si Pengecoh mengubah baris 3 menjadi kapital. Ramalkan bunyinya.');
  const line = PANTUN.p2[2]; const box = el('div', { class: 'rp40-kolom' });
  fill(box, codeView([`bunyi.append(${RINA})`], { labels: ['5'] }), hurufView(line, { tail: 8 }), fillBoard(ctx, { oops, msg, view: rowsView([["bunyi = ['ah', 'ti', ", '_', ", 'ti']"], ['putusan: ', '_']]), chips: ["'AH'", "'ah'", "'H,'", 'Rima a-b-a-b', 'Bukan a-b-a-b'], want: ["'AH'", 'Bukan a-b-a-b'],
    hints: ['rstrip membuang koma, tetapi tidak mengubah huruf kapital.', '"AH" tidak sama dengan "ah" bagi Python.'], done: fix }));
  area.append(box, msg);
  function fix() {
    say(msg, 'info', 'Pasang method yang membuat semua huruf menjadi kecil.');
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill([['bunyi.append(b.rstrip(".,!?;:")', '_', '[-2:])']], { labels: ['5'] }), chips: ['.lower()', '.upper()', '.strip()', '.title()'], want: ['.lower()'], hints: ['Huruf kecil semua: lower().'],
      done: () => { const R = periksa('rina2', PANTUN.p2.join('\n')); fill(box, codeView([`bunyi.append(${RINA2})`], { labels: ['5'] }), el('code', { class: 'rp40-bunyi' }, `bunyi = ${R.bunyi}`)); say(msg, '', 'Sekarang AH menjadi ah, dan pantun 2 lulus.'); done(); } }));
  }
}

// Misi 3b: the invisible space after the comma.
function spasiRound(area, ctx, { oops, done }) {
  const line = `${PANTUN.p1[0]} `; const box = el('div', { class: 'rp40-kolom' });
  const msg = msg40('Si Pengecoh menyelipkan sesuatu. Ketuk dua kartu yang diambil b[-2:].');
  const pick = windowPicker([line.length - 2, line.length - 1], { oops, msg, onOk: () => { ctx.sound.good(); say(msg, 'info', 'Koma lalu spasi! rstrip(".,!?;:") berhenti di spasi, jadi komanya tidak terbuang. Pasang pembersih spasi lebih dulu.'); setTimeout(fix, 1600); }, start: 'Hitung dari ujung: kartu −2.', end: 'Kartu terakhir juga ikut, walaupun tidak terlihat.' });
  const draw = (lit = []) => fill(box, hurufView(line, { tail: 8, lit, onCard: (i, b) => { const l = pick(i, b); if (l) { ctx.sound.tap(); draw(l); } } }));
  draw();
  area.append(box, msg);
  function fix() {
    fill(box, hurufView(line, { tail: 8 }), fillBoard(ctx, { oops, msg, view: codeFill([['bunyi.append(b', '_', '.rstrip(".,!?;:")'], ['                .lower()[-2:])']], { labels: ['5', '5'] }), chips: ['.strip()', '.lower()', '.split()', '.upper()'], want: ['.strip()'], hints: ['Yang membuang spasi di kedua ujung adalah strip().'],
      done: () => { say(msg, '', `strip() membuang spasi, rstrip membuang koma, lower() mengecilkan huruf: bunyi "${line.trim().replace(/[.,!?;:]+$/, '').toLowerCase().slice(-2)}". Urutannya penting!`); done(); } }));
  }
}

// Misi 4: build lines 12 and 18, then test three pantun.
const RAKIT_TILES = [['b12', 'b = b.strip().rstrip(".,!?;:").lower()'], ['b18', 'bunyi.append(bunyi_akhir(b))'],
  ['x1', 'b = b.lower()', 'Tanda baca dan spasi masih tertinggal.'], ['x2', 'print(bunyi_akhir(b))', 'Hasilnya harus masuk list bunyi, bukan dicetak.'], ['x3', 'bunyi.append(bunyi_akhir)', 'Fungsinya harus dipanggil dengan b: bunyi_akhir(b).'], ['x4', 'b = b.rstrip(".,!?;:").strip()', 'Huruf kapital belum diubah.']];
function rakitRound(area, ctx, { oops, done }) {
  const msg = msg40('Rakit baris 12 dan 18 dari kartu.'); const box = el('div', { class: 'rp40-kolom' });
  fill(box, tileSlots(ctx, { oops, msg, build: ['def bunyi_akhir(b):', ['b12', 1], '    return b[-2:]', 'def cek_abab(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', ['b18', 2]], tiles: RAKIT_TILES, onFull: test }));
  area.append(box, msg);
  function test() {
    say(msg, 'info', 'Mesin baru siap. Seret setiap pantun ke lampu hasil cek_abab.');
    const res = Object.fromEntries(['p1', 'p2', 'p3'].map((k) => [k, periksa('akhir', PANTUN[k].join('\n'))])); let n = 0;
    const lamp = (v) => el('div', { class: `rp40-lampu ${v ? 'ya' : 'tidak'}`, 'data-drop': v ? 'True' : 'False' }, el('b', null, v ? '✅ True' : '❌ False'), el('div', { class: 'rp40-isi' }));
    const tray = el('div', { class: 'rp40-baki' }, ['p1', 'p2', 'p3'].map((k) => el('div', { class: 'rp40-kartu-pantun', 'data-drag': k }, el('b', null, NAMA[k]), el('small', null, PANTUN[k][1]))));
    const host = el('div', { class: 'rp40-kolom' }, el('div', { class: 'rp40-lampu-lampu' }, lamp(true), lamp(false)), tray);
    dnd(host, (c, bin) => {
      if (!bin.classList.contains('rp40-lampu')) return; const k = c.dataset.drag; const want = res[k].benar ? 'True' : 'False';
      if (bin.dataset.drop !== want) { oops(); shake(c); say(msg, 'bad', k === 'p3' ? 'Ambil dua huruf terakhir: "mandi" → "di", "lagi" → "gi". Samakah?' : 'Sesudah dibersihkan, tanda baca dan huruf kapital tidak lagi mengganggu.'); return; }
      c.classList.add('locked'); c.append(el('code', null, res[k].pola)); bin.querySelector('.rp40-isi').append(c); ctx.sound.tap(); n++;
      if (n < 3) { say(msg, 'info', 'Tepat.'); return; }
      tray.remove(); say(msg, '', 'Pantun 3 berima (mandi, lagi), tetapi ditolak: "di" dan "gi" berbeda. Dua huruf terakhir belum tentu bunyi akhir.'); done();
    });
    fill(box, host);
  }
}

// Misi 5: tap every word.
function kataRound(area, ctx, { oops, done }) {
  const msg = msg40('Ketuk setiap kata pantun 1 untuk menghitungnya.'); const box = el('div', { class: 'rp40-kolom' }); const counts = [0, 0, 0, 0];
  const total = PANTUN.p1.reduce((s, b) => s + b.split(' ').length, 0); let n = 0;
  fill(box, el('small', null, 'Pantun 1'), PANTUN.p1.map((b, i) => el('div', { class: 'rp40-baris' }, el('small', null, String(i + 1)), el('div', { class: 'rp40-kata-kata' }, b.split(' ').map((w) => onTap(el('button', { type: 'button', class: 'rp40-kata', 'data-b': String(i) }, w), (e) => {
    const btn = e.currentTarget || e.target.closest('button'); if (btn.classList.contains('on')) return; counts[i]++; btn.classList.add('on'); btn.dataset.no = String(counts[i]); ctx.sound.tap(); n++;
    box.querySelectorAll('.rp40-jumlah')[i].textContent = `${counts[i]} kata`;
    if (n === total) { say(msg, 'info', `Pantun 1: ${counts.join(', ')} kata. Semua di antara 4 dan 6. Sekarang pantun 3.`); setTimeout(p3, 1200); }
  }))), el('span', { class: 'rp40-jumlah' }, '0 kata'))));
  area.append(el('div', { class: 'rp40-dua' }, box, codeView(KATA, { labels: lab40(22, 6) })), msg);
  function p3() {
    fill(box, el('small', null, 'Pantun 3'), PANTUN.p3.map((b, i) => el('div', { class: 'rp40-baris' }, el('small', null, String(i + 1)), el('span', null, b))),
      fillBoard(ctx, { oops, msg, view: rowsView([['banyak kata: ', '_', ', ', '_', ', ', '_', ', ', '_'], ['cek_kata: ', '_']]), chips: ['5', '4', '4', '4', '3', '6', 'True', 'False'], want: ['5', '4', '4', '4', 'True'],
        hints: ['Kalau ada sumur di ladang.', 'Boleh kita menumpang mandi.', 'Kalau ada umur panjang.', 'Boleh kita berjumpa lagi.', 'Semua baris punya 4 sampai 6 kata.'], done: () => { say(msg, '', 'split() memecah di spasi, jadi len(b.split()) adalah banyak kata. Kedua pantun lulus cek_kata.'); done(); } }));
  }
}
const lab40 = (a, n) => Array.from({ length: n }, (_, i) => String(a + i));

// Misi 6: build a decoy that fools both checkers.
export const BANK = ['Saya suka makan sawah,', 'Saya suka makan jati.', 'Burung pipit terbang ke sawah,', 'Ilmu dicari sepenuh hati!', 'Kalau ada umur panjang,', 'Boleh kita berjumpa lagi.'];
function duelRound(area, ctx, { oops, done }) {
  const msg = msg40('Seret empat baris dari bank ke pantunmu. Buat pantun yang lulus mesin, padahal buruk.');
  const slots = [null, null, null, null]; const box = el('div', { class: 'rp40-kolom' });
  const draw = () => fill(box, el('div', { class: 'rp40-susun' }, slots.map((v, i) => el('div', { class: `rp40-slot ${v === null ? '' : 'isi'}`, 'data-drop': String(i) }, el('small', null, String(i + 1)), v === null ? '?' : BANK[v]))),
    el('div', { class: 'rp40-baki' }, BANK.map((b, i) => el('div', { class: 'rp40-tag', 'data-drag': String(i) }, b))),
    onTap(el('button', { type: 'button', class: 'rp40-pilih' }, '↺ kosongkan'), () => { slots.fill(null); draw(); }));
  dnd(box, (tag, slot) => {
    if (!slot.classList.contains('rp40-slot')) return; const i = +slot.dataset.drop; slots[i] = +tag.dataset.drag; ctx.sound.tap(); draw();
    if (slots.some((v) => v === null)) return;
    const lines = slots.map((v) => BANK[v]); const teks = lines.join('\n'); const P = periksa('akhir', teks); const K = kata(teks);
    if (!P.benar || !K.ok) { oops(); say(msg, 'bad', `Mesin menolaknya (${P.pola}, cek_kata ${pyRepr(K.ok)}). Pengecoh harus LULUS mesin. Ganti baris.`); return; }
    ctx.sound.good(); fill(box, el('div', { class: 'rp40-pantun' }, lines.map((b) => el('p', null, b))), el('code', { class: 'rp40-bunyi' }, `cek_abab → ('${P.pola}', True) · cek_kata → True`));
    say(msg, '', 'Pengecoh berhasil: rima dan banyak kata lulus, padahal tidak ada sampiran dan isi. Makna tetap harus dinilai manusia.'); done();
  });
  draw();
  area.append(box, msg);
}

// Misi Bos: walk back to the last vowel.
export const BOS_KATA = ['panjang', 'lagi'];
function bosRound(area, ctx, { oops, done }) {
  const msg = msg40('bunyi_vokal("panjang"): i mulai dari huruf terakhir. Mundur sampai bertemu vokal.');
  let w = 0; let i = BOS_KATA[0].length - 1; const box = el('div', { class: 'rp40-kolom' }); const log = el('div', { class: 'rp40-log' });
  const draw = () => { const kt = BOS_KATA[w]; fill(box, el('code', { class: 'rp40-ekspr', 'data-kata': kt, 'data-i': String(i) }, `kata = "${kt}" · i = ${i} · kata[i] = "${kt[i]}"`), hurufView(kt, { lit: [i], neg: false }),
    el('div', { class: 'rp40-tombol' }, onTap(el('button', { type: 'button', class: 'rp40-pilih', 'data-v': 'mundur' }, '◀ bukan vokal: i = i - 1'), () => act('mundur')), onTap(el('button', { type: 'button', class: 'rp40-pilih', 'data-v': 'ambil' }, '✂ vokal: return kata[i:]'), () => act('ambil')))); };
  function act(a) {
    if (w >= BOS_KATA.length) return; const kt = BOS_KATA[w]; const vok = 'aiueo'.includes(kt[i]);
    if (a === 'mundur' && vok) { oops(); say(msg, 'bad', `"${kt[i]}" adalah vokal: perulangan while berhenti di sini.`); return; }
    if (a === 'ambil' && !vok) { oops(); say(msg, 'bad', `"${kt[i]}" bukan vokal (a, i, u, e, o): mundur lagi.`); return; }
    ctx.sound.tap();
    if (a === 'mundur') { i--; draw(); return; }
    const got = kt.slice(i); log.append(el('span', null, `bunyi_vokal("${kt}") → "${got}"`)); w++;
    if (w < BOS_KATA.length) { i = BOS_KATA[w].length - 1; say(msg, 'info', `Tepat: "${got}". Sekarang "${BOS_KATA[w]}".`); draw(); return; }
    const P = periksa('vokal', PANTUN.p3.join('\n'));
    fill(box, el('code', { class: 'rp40-bunyi' }, `pantun 3 → pola ${P.pola} · ${pyRepr(P.benar)}`));
    say(msg, '', 'Bunyi dihitung dari vokal terakhir: ang-i-ang-i. Pantun 1, 2, dan 3 kini lulus semua.'); done();
  }
  draw();
  area.append(el('div', { class: 'rp40-dua' }, codeView(['def bunyi_vokal(b):', '    kata = (b.strip().rstrip(".,!?;:")', '            .lower().split()[-1])', '    i = len(kata) - 1', '    while (i >= 0 and', '           kata[i] not in "aiueo"):', '        i = i - 1', '    return kata[i:]']), el('div', { class: 'rp40-kolom' }, box, log)), msg);
}

export default {
  id: 'sma-40-rima-pantun',
  title: 'Pemeriksa Rima Pantun',
  topic: 'Teks di Python: indeks dan potongan, split, join, strip, lower, pemeriksa rima a-b-a-b, bug karena tanda baca, huruf kapital, dan spasi, fungsi yang mengembalikan nilai, serta batas pemeriksaan otomatis',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📜',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri potongan teks, jalankan pemeriksa rima pantun versi pertama, temukan bug tanda baca dan huruf kapital, lengkapi pemeriksa yang lebih baik, lalu buat pantun pengecoh.',
  extraModes: [
    { id: 'pemeriksa', icon: '🔎', label: 'Pemeriksa Pantun', desc: 'Ketik pantun: layar memecahnya menjadi baris dan kata, menyorot bunyi akhir, dan menampilkan pola serta banyak kata', create: createChecker },
    { id: 'string', icon: '🔤', label: 'Penelusur String', desc: 'Setiap karakter dalam kotak dengan indeks positif dan negatif; potongan yang diambil menyala', create: createString },
    { id: 'versi', icon: '🧪', label: 'Versi Program', desc: 'Bandingkan hasil versi pertama, versi Rina, bunyi_akhir, dan bunyi_vokal untuk pantun yang sama', create: createVersions },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Pantun Pengecoh', desc: 'Satu tim membuat pantun pengecoh, tim lain menebak hasil pemeriksa sebelum dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rp40-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'rp40-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD40[k];
        foe = el('div', { class: 'rp40-musuh' }, el('b', null, '🃏 Si Pengecoh'), el('span', null, ulah));
        wrap.append(el('div', { class: 'rp40-kepala' }, misiHead(no, judul, tujuan, '📜'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Pengecoh tertangkap ✓'; next(ms); } });
      if (r === 0) { go('gunting', 1); guntingRound(area, ctx, fin(5000)); }
      else if (r === 1) { go('method', 1); methodRound(area, ctx, fin(5000)); }
      else if (r === 2) { go('v1', 2); mesinRound(area, ctx, fin(5500), 'p1'); }
      else if (r === 3) { go('untung', 2); mesinRound(area, ctx, fin(5500), 'p3'); }
      else if (r === 4) { go('kapital', 3); kapitalRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('spasi', 3); spasiRound(area, ctx, fin(5500)); }
      else if (r === 6) { go('rakit', 4); rakitRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('kata', 5); kataRound(area, ctx, fin(5500)); }
      else if (r === 8) { go('duel', 6); duelRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

// Pantun editor shared by the checker and the team mode: four inputs, nothing stored.
function editor(lines, onChange) {
  return el('div', { class: 'ri-editor' }, lines.map((b, i) => { const inp = el('input', { type: 'text', value: b, 'aria-label': `Baris ${i + 1}`, spellcheck: 'false', autocomplete: 'off' }); inp.addEventListener('input', () => { lines[i] = inp.value; onChange(); }); return el('label', null, el('small', null, String(i + 1)), inp); }));
}
function report(lines, ver) {
  const teks = lines.join('\n'); const P = periksa(ver, teks); const K = kata(teks);
  return el('div', { class: 'ri-laporan' },
    lines.map((b, i) => { const [a, z] = ambil(ver, b); const words = b.split(/\s+/).filter(Boolean); return el('div', { class: 'ri-baris' }, el('small', null, `${i + 1}`), el('code', null, b.slice(0, a).replace(/ /g, '␣'), el('mark', null, b.slice(a, z).replace(/ /g, '␣')), b.slice(z).replace(/ /g, '␣')), el('span', { class: `ri-kata ${words.length < 4 || words.length > 6 ? 'luar' : ''}` }, `${words.length} kata`)); }),
    P.error ? el('p', { class: 'ri-galat' }, P.error) : el('p', { class: 'ri-hasil' }, el('span', null, `bunyi = ${P.bunyi}`), P.pola !== null ? el('span', null, `pola: ${P.pola}`) : null, el('b', { class: P.benar ? 'ok' : 'no' }, P.benar ? 'Rima a-b-a-b' : 'Bukan a-b-a-b')),
    el('p', { class: 'ri-hasil' }, el('span', null, `cek_kata: ${pyRepr(K.ok)}`), el('span', null, `banyak kata: ${(K.n || []).join(', ')}`)));
}

function createChecker(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let lines = [...PANTUN.p1]; let ver = 'akhir';
  const out = el('div');
  const upd = () => out.replaceChildren(report(lines, ver));
  const draw = () => {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pemeriksa pantun'),
      el('div', { class: 'seg ri-versi' }, Object.keys(PANTUN).map((k) => onTap(el('button', { class: 'seg-btn', type: 'button' }, NAMA[k]), () => { lines = [...PANTUN[k]]; draw(); })), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'kosongkan'), () => { lines = ['', '', '', '']; draw(); })),
      el('div', { class: 'seg ri-versi' }, VERSI.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'ri-dua' }, editor(lines, upd), out), el('p', { class: 'ri-ket' }, 'Pantun yang diketik hanya tampil di layar ini dan tidak disimpan.'));
    upd();
  };
  draw();
}

export const EXPRS = ['s[0]', 's[-1]', 's[-2:]', 's[-3:-1]', 's[:4]', 's[2:5]', 's[::-1]', 's[::2]', 'len(s)', 's.upper()', 's.lower()', 's.strip()', 's.rstrip(".,!?;:")', 's.split()', '"-".join(s.split())'];
function createString(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let s = 'menyerah,'; let expr = 's[-3:-1]'; let a = -3; let b = -1;
  const SAMPLE = ['menyerah,', 'hati! ', 'Ilmu dicari sepenuh hati', 'RAJIN BELAJAR,', 'ladang'];
  const draw = () => {
    const v = evalS(s, expr);
    const inp = el('input', { type: 'text', value: s, class: 'ri-input', 'aria-label': 's', spellcheck: 'false', autocomplete: 'off' });
    inp.addEventListener('change', () => { s = inp.value; draw(); });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur string'),
      el('div', { class: 'ri-atur' }, el('label', null, el('small', null, 's = '), inp), el('div', { class: 'seg' }, SAMPLE.map((x) => onTap(el('button', { class: `seg-btn ${s === x ? 'on' : ''}`, type: 'button' }, pyRepr(x, true)), () => { s = x; draw(); })))),
      charBoxes(s, sliceIdx(s, expr)),
      el('div', { class: 'seg ri-versi' }, EXPRS.map((x) => onTap(el('button', { class: `seg-btn ${expr === x ? 'on' : ''}`, type: 'button' }, x), () => { expr = x; draw(); }))),
      el('div', { class: 'ri-atur' }, stepper(a, (x) => { a = x; expr = `s[${a}:${b}]`; draw(); }, { min: -20, max: 20, label: 'awal' }), stepper(b, (x) => { b = x; expr = `s[${a}:${b}]`; draw(); }, { min: -20, max: 20, label: 'akhir' })),
      el('p', { class: 'ri-ekspresi' }, el('code', null, expr), ' → ', el('b', null, v)));
  };
  draw();
}

function createVersions(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let ver = 'v1';
  const draw = () => {
    const v = VERSI.find((x) => x[0] === ver); const keys = Object.keys(PANTUN);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Versi program'), el('div', { class: 'seg ri-versi' }, VERSI.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'ri-dua' }, pyCode(v[2], { labels: v[3], cls: 'ri-kecil' }),
        el('table', { class: 'ri-tabel' }, el('tr', null, el('th', null, 'versi'), keys.map((k) => el('th', null, NAMA[k]))),
          VERSI.map(([k, t]) => el('tr', { class: k === ver ? 'pilih' : '' }, el('th', null, t), keys.map((pk) => { const P = periksa(k, PANTUN[pk].join('\n')); return el('td', { class: P.benar ? 'ok' : 'no' }, el('code', null, P.pola ?? P.bunyi), el('b', null, P.benar ? '✓ a-b-a-b' : '✗')); }))))),
      el('p', { class: 'ri-ket' }, 'Pantun 1, 2, dan 3 sebenarnya berima a-b-a-b. Pantun pengecoh lulus padahal buruk.'));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  const TEMPLATE = [['Pergi ke pasar membeli roti,', 'Roti dibeli di ujung jalan.', 'Hati gembira sepenuh hati,', 'Belajar bersama setiap bulan.'], ['Ada kucing di atas meja,', 'Meja kayu di dalam rumah.', 'Ada kucing di atas meja,', 'Meja kayu di dalam rumah.'], ['Buah mangga buah delima,', 'Dimakan bersama teman sekelas.', 'Mari kita belajar bersama,', 'Supaya ilmu makin luas.']];
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(3, nT); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Pantun Pengecoh selesai', pts, again: () => pickTeams(wrap, 'Pantun Pengecoh', start) }); return; }
      const author = t % nT; const lines = [...TEMPLATE[t % TEMPLATE.length]]; let klaim = null;
      const draw = () => wrap.replaceChildren(scoreBar(pts, author), el('p', { class: 'prompt' }, `Tim ${author + 1}: buat pantun pengecoh`), editor(lines, () => {}),
        el('p', { class: 'ri-ket' }, 'Menurut tim kalian, pantun ini…'), el('div', { class: 'seg' }, [[true, 'pantun yang baik'], [false, 'pantun yang buruk']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${klaim === v ? 'on' : ''}`, type: 'button' }, l), () => { klaim = v; draw(); }))),
        button('Serahkan ke tim lain ➜', () => { if (klaim === null) { say(wrap.querySelector('.reveal'), 'bad', 'Pilih dulu: baik atau buruk.'); return; } guess(author, lines, klaim); }, 'primary'), el('p', { class: 'reveal info' }, 'Pantun hanya tampil di layar dan tidak disimpan.'));
      draw();
    }
    function guess(author, lines, klaim) {
      const others = Array.from({ length: nT }, (_, k) => k).filter((k) => k !== author); const g = {};
      const teks = lines.join('\n'); const P = periksa('akhir', teks); const K = kata(teks); const lulus = !!P.benar && !!K.ok;
      const draw = () => wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, 'Tebak: apakah pantun ini lulus cek_abab dan cek_kata?'), el('div', { class: 'ri-pantun' }, lines.map((b) => el('p', null, b))),
        el('div', { class: 'ri-tebakan' }, others.map((k) => el('div', { class: 'ri-tebak' }, el('b', null, `Tim ${k + 1}`), el('div', { class: 'seg' }, [[true, 'lulus'], [false, 'gagal']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${g[k] === v ? 'on' : ''}`, type: 'button' }, l), () => { g[k] = v; draw(); })))))),
        button('Jalankan pemeriksa ➜', () => { if (others.some((k) => g[k] === undefined)) { say(wrap.querySelector('.reveal'), 'bad', 'Semua tim menebak dulu.'); return; } reveal(); }, 'primary'), el('p', { class: 'reveal info' }, ' '));
      function reveal() {
        const right = others.filter((k) => g[k] === lulus); right.forEach((k) => { pts[k]++; }); const tipu = lulus !== klaim; if (tipu) pts[author]++;
        ctx.sound.good();
        wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, lulus ? 'Pemeriksa: lulus' : 'Pemeriksa: gagal'), report(lines, 'akhir'),
          el('p', { class: 'reveal' }, `${tipu ? `Pengecoh berhasil: pemeriksa berkata ${lulus ? 'lulus' : 'gagal'}, padahal Tim ${author + 1} menilainya ${klaim ? 'baik' : 'buruk'}. Tim ${author + 1} +1. ` : 'Pemeriksa sependapat dengan penilaian tim pembuat. '}${right.length ? `Tebakan tepat: ${right.map((k) => `Tim ${k + 1}`).join(', ')} +1.` : 'Tidak ada tebakan yang tepat.'}`),
          button('Lanjut ➜', () => { t++; step(); }, 'primary'));
      }
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Pantun Pengecoh', start);
}
