// Merapikan Kode Warisan — SMA/SMK (16–18 tahun), coding. Refactoring Kak
// Bayu's quiz-score program: characterization tests T1–T7, renaming, one
// rules table, small functions, versions that look the same but are not
// (Rudi, Rina, Dodi), the bug fix as a separate step, the Sama-atau-Beda
// cards, and why a random tester misses rare differences. Every version runs
// as real Python in mini-py; the random tester uses fast copies checked
// against mini-py.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pairRound, pickSet, pyCode } from './smp-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const BAYU = [
  'def hitung(d):',
  '    t = {}',
  '    for r in d:',
  '        n = r[0]',
  '        if n not in t:',
  '            t[n] = 0',
  '        if r[1] == 1:',
  '            if r[2] == "B":',
  '                t[n] = t[n] + 10',
  '        if r[1] == 2:',
  '            if r[2] == "B":',
  '                t[n] = t[n] + 20',
  '            else:',
  '                t[n] = t[n] - 5',
  '        if r[1] == 3:',
  '            if r[2] == "B":',
  '                t[n] = t[n] + 30',
  '            else:',
  '                t[n] = t[n] - 10',
  '                if t[n] < 0:',
  '                    t[n] = 0',
  '    h = sorted(t.items(), key=lambda x: x[1], reverse=True)',
  '    return h',
];
const POIN = ['ATURAN = {1: (10, 0), 2: (20, -5), 3: (30, -10)}', '', 'def poin(babak, jawaban):', '    benar, lainnya = ATURAN[babak]', '    if jawaban == "B":', '        return benar', '    return lainnya', ''];
const RAPI_BODY = (o = {}) => ['def hitung_skor(catatan):', '    skor = {}', '    for regu, babak, jawaban in catatan:', '        if regu not in skor:', '            skor[regu] = 0',
  ...(o.rina ? ['        skor[regu] = max(0, skor[regu] + poin(babak, jawaban))'] : ['        skor[regu] = skor[regu] + poin(babak, jawaban)', `        if ${o.rudi ? 'babak == 3 and skor[regu] < 0' : 'babak == 3 and jawaban != "B" and skor[regu] < 0'}:`, '            skor[regu] = 0']),
  o.dodi ? '    return sorted(skor.items(), key=lambda pasangan: (-pasangan[1], pasangan[0]))' : '    return sorted(skor.items(), key=lambda pasangan: pasangan[1], reverse=True)'];
const FIXED = ['ATURAN = {1: (10, 0, 0), 2: (20, -5, 0), 3: (30, -10, 0)}', '# babak: (poin benar, poin salah, poin lewat)', '', 'def poin(babak, jawaban):', '    benar, salah, lewat = ATURAN[babak]', '    if jawaban == "B":', '        return benar', '    if jawaban == "L":', '        return lewat', '    return salah', '',
  'def hitung_skor(catatan):', '    skor = {}', '    for regu, babak, jawaban in catatan:', '        if regu not in skor:', '            skor[regu] = 0', '        skor[regu] = max(0, skor[regu] + poin(babak, jawaban))', '    return sorted(skor.items(), key=lambda pasangan: pasangan[1], reverse=True)'];

// The six change cards, applied to Kak Bayu's code.
const edit = (fn) => { const L = [...BAYU]; fn(L); return L; };
export const KARTU = {
  K1: { t: 'Ganti semua t dengan skor.', code: BAYU.map((s) => s.replace(/\bt\b/g, 'skor')), beda: false, why: 'Mengganti nama variabel di semua tempat tidak mengubah perhitungan.' },
  K2: { t: 'Ganti if di baris 10 dan 15 dengan elif.', code: edit((L) => { L[9] = '        elif r[1] == 2:'; L[14] = '        elif r[1] == 3:'; }), beda: false, why: 'Satu catatan hanya punya satu nomor babak, jadi paling banyak satu blok yang dijalankan.' },
  K3: { t: 'Ganti baris 22 dengan h = sorted(t.items(), key=lambda x: -x[1]).', code: edit((L) => { L[21] = '    h = sorted(t.items(), key=lambda x: -x[1])'; }), beda: false, why: 'sorted di Python stabil: regu yang skornya sama tetap berurutan seperti di catatan.' },
  K4: { t: 'Pindahkan baris 20–21 keluar dari blok babak 3, sehingga dijalankan setelah setiap catatan.', code: edit((L) => { L.splice(19, 2); L.splice(19, 0, '        if t[n] < 0:', '            t[n] = 0'); }), beda: true, why: 'T3: kode Kak Bayu memberi [(\'Mawar\', -5)], versi kartu [(\'Mawar\', 0)]. T5 juga berbeda.' },
  K5: { t: 'Hapus baris 5–6. Di baris 9, 12, 14, 17, dan 19, ganti t[n] di sebelah kanan = dengan t.get(n, 0).', code: edit((L) => { [8, 11, 13, 16, 18].forEach((i) => { L[i] = L[i].replace('= t[n]', '= t.get(n, 0)'); }); L.splice(4, 2); }), beda: true, why: 'T2: kode Kak Bayu memberi [(\'Melati\', 0)], versi kartu memberi [], karena regu yang hanya salah di babak 1 tidak pernah masuk ke kamus.' },
  K6: { t: 'Ganti angka 10, 20, dan 30 di baris 9, 12, dan 17 dengan 10 * r[1].', code: edit((L) => { [8, 11, 16].forEach((i) => { L[i] = L[i].replace(/\+ \d0$/, '+ 10 * r[1]'); }); }), beda: false, why: 'Di setiap blok r[1] bernilai 1, 2, atau 3, jadi 10 * r[1] sama dengan 10, 20, atau 30. Kodenya justru lebih sulit dibaca.' },
};

export const VERSI = {
  bayu: { nama: 'Kak Bayu', fn: 'hitung', code: BAYU },
  rapi: { nama: 'Versi rapi (3c)', fn: 'hitung_skor', code: [...POIN, ...RAPI_BODY()] },
  rudi: { nama: 'Versi Rudi', fn: 'hitung_skor', code: [...POIN, ...RAPI_BODY({ rudi: true })] },
  rina: { nama: 'Versi Rina', fn: 'hitung_skor', code: [...POIN, ...RAPI_BODY({ rina: true })] },
  dodi: { nama: 'Versi Dodi', fn: 'hitung_skor', code: [...POIN, ...RAPI_BODY({ dodi: true })] },
  fix: { nama: 'Setelah perbaikan (5a)', fn: 'hitung_skor', code: FIXED },
  ...Object.fromEntries(Object.entries(KARTU).map(([k, c]) => [k, { nama: `Kartu ${k}`, fn: 'hitung', code: c.code }])),
};

export const REGU = ['Melati', 'Mawar', 'Kenanga'];
export const CONTOH = [['Melati', 1, 'B'], ['Mawar', 1, 'S'], ['Kenanga', 1, 'B'], ['Mawar', 2, 'S'], ['Melati', 2, 'L'], ['Kenanga', 2, 'B'], ['Mawar', 3, 'S'], ['Melati', 3, 'B']];
export const UJI = [['T1', []], ['T2', [['Melati', 1, 'S']]], ['T3', [['Mawar', 2, 'S']]], ['T4', [['Mawar', 3, 'S']]], ['T5', [['Melati', 2, 'L']]], ['T6', [['Melati', 1, 'B'], ['Kenanga', 1, 'B']]], ['T7', CONTOH]];
export const pyList = (cat) => `[${cat.map(([r, b, j]) => `("${r}", ${b}, "${j}")`).join(', ')}]`;
const pyListShort = (cat) => (cat === CONTOH ? 'contoh' : pyList(cat));

// Runs one version on a list of records; returns the repr of the result or the error text.
const cache = new Map();
export function jalankan(id, cat) {
  const key = `${id}|${pyList(cat)}`;
  if (cache.has(key)) return cache.get(key);
  const v = VERSI[id];
  const R = runPy([...v.code, `hasil = ${v.fn}(${pyList(cat)})`], { limit: 200000 });
  const out = R.error ? `${R.error.type}: ${R.error.message}` : pyRepr(R.vars.hasil);
  cache.set(key, out);
  return out;
}

// Fast copies for the random tester (checked against mini-py in testing).
const reprOut = (pairs) => `[${pairs.map(([n, s]) => `('${n}', ${s})`).join(', ')}]`;
export function cepat(id, cat) {
  const t = new Map();
  for (const [n, b, j] of cat) {
    if (!t.has(n)) t.set(n, 0);
    const P = { 1: [10, 0], 2: [20, -5], 3: [30, -10] }[b];
    if (!P) { if (id === 'bayu') continue; return 'KeyError: ' + b; }
    let s = t.get(n) + (j === 'B' ? P[0] : P[1]);
    if (id === 'rina') s = Math.max(0, s);
    else if (id === 'rudi') { if (b === 3 && s < 0) s = 0; }
    else if (b === 3 && j !== 'B' && s < 0) s = 0;
    t.set(n, s);
  }
  const arr = [...t.entries()];
  if (id === 'dodi') arr.sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : a[0] > c[0] ? 1 : 0));
  else arr.sort((a, c) => c[1] - a[1]);
  return reprOut(arr);
}
// Small seeded generator (mulberry32) so a run can be repeated.
export function acak(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return { int, pick: (xs) => xs[int(0, xs.length - 1)] };
}
export function daftarAcak(R) {
  const cat = [];
  for (let k = R.int(0, 12); k > 0; k--) cat.push([R.pick(REGU), R.int(1, 3), R.pick(['B', 'S', 'L'])]);
  return cat;
}
export function bandingkan(id, seed = 1, n = 1000) {
  const R = acak(seed); let beda = 0; let contohBeda = null;
  for (let i = 0; i < n; i++) { const c = daftarAcak(R); if (cepat('bayu', c) !== cepat(id, c)) { beda++; contohBeda ??= c; } }
  return { beda, contohBeda };
}

// Kak Bayu's code record by record: scores after each record and the lines it ran.
export function langkahBayu(cat, { fix = false } = {}) {
  const t = {}; const rows = [];
  for (const [n, b, j] of cat) {
    const lines = [3, 4, 5]; const fresh = !(n in t);
    if (fresh) { t[n] = 0; lines.push(6); }
    let note = '';
    if (fix) {
      const P = { 1: [10, 0, 0], 2: [20, -5, 0], 3: [30, -10, 0] }[b];
      const d = j === 'B' ? P[0] : j === 'L' ? P[2] : P[1]; const raw = t[n] + d; t[n] = Math.max(0, raw);
      note = `${d >= 0 ? '+' : ''}${d}${raw < 0 ? `, ${raw} menjadi 0` : ''}`;
    } else {
      lines.push(7, 10, 15);
      if (b === 1) { lines.push(8); if (j === 'B') { lines.push(9); t[n] += 10; note = '+10'; } else note = '+0 (tidak ada baris untuk salah atau lewat)'; }
      if (b === 2) { lines.push(11); if (j === 'B') { lines.push(12); t[n] += 20; note = '+20'; } else { lines.push(13, 14); t[n] -= 5; note = j === 'L' ? '−5 (lewat diperlakukan seperti salah)' : '−5'; } }
      if (b === 3) { lines.push(16); if (j === 'B') { lines.push(17); t[n] += 30; note = '+30'; } else { lines.push(18, 19, 20); t[n] -= 10; note = j === 'L' ? '−10 (lewat diperlakukan seperti salah)' : '−10'; if (t[n] < 0) { note += `, ${String(t[n]).replace('-', '−')} menjadi 0 di baris 20–21`; lines.push(21); t[n] = 0; } } }
    }
    rows.push({ rec: [n, b, j], skor: { ...t }, lines, note, fresh });
  }
  return rows;
}

// ---------- shared views ----------
const kodeBayu = (hl = []) => pyCode(BAYU, { cls: 'rk-kode', hl });
// Card versions light the lines that are not in Kak Bayu's code.
const kodeVersi = (id, hl = []) => pyCode(VERSI[id].code, { cls: 'rk-kode', hl: id in KARTU && !hl.length ? VERSI[id].code.flatMap((t, i) => (BAYU.includes(t) ? [] : [i])) : hl });

function papanSkor(skor, sorot = null) {
  return el('div', { class: 'rk-papan' }, REGU.map((r) => el('div', { class: `rk-regu ${r === sorot ? 'sorot' : ''}` }, el('small', null, r), el('b', null, r in skor ? String(skor[r]) : '-'))));
}

// Record builder: regu, babak and jawaban buttons; onChange gets the list.
function penyusun(onChange, { babak4 = false, max = 16 } = {}) {
  const st = { regu: 'Mawar', babak: 2, jawaban: 'S', list: [] };
  const node = el('div', { class: 'rk-penyusun' });
  const seg = (vals, key, fmt = String) => el('div', { class: 'seg rk-seg' }, vals.map((v) => onTap(el('button', { class: `seg-btn ${st[key] === v ? 'on' : ''}`, type: 'button' }, fmt(v)), () => { st[key] = v; draw(); })));
  const draw = () => {
    node.replaceChildren(
      el('div', { class: 'rk-pilihan' }, seg(REGU, 'regu'), seg(babak4 ? [1, 2, 3, 4] : [1, 2, 3], 'babak', (b) => `babak ${b}`), seg(['B', 'S', 'L'], 'jawaban', (j) => ({ B: 'B benar', S: 'S salah', L: 'L lewat' }[j]))),
      el('div', { class: 'rk-aksi' },
        button('+ Tambah catatan', () => { if (st.list.length >= max) return; st.list.push([st.regu, st.babak, st.jawaban]); changed(); }, 'primary small'),
        button('Salin terakhir', () => { if (!st.list.length || st.list.length >= max) return; st.list.push([...st.list[st.list.length - 1]]); changed(); }, 'small'),
        button('↶ Hapus terakhir', () => { st.list.pop(); changed(); }, 'small'),
        button('Kosongkan', () => { st.list = []; changed(); }, 'small')),
      el('code', { class: 'rk-daftar' }, `catatan = ${pyList(st.list)}`, el('small', null, ` (${st.list.length} catatan${st.list.length >= max ? ', sudah maksimal' : ''})`)));
  };
  const changed = () => { draw(); onChange(st.list); };
  draw();
  node.set = (list) => { st.list = list.map((r) => [...r]); changed(); };
  return node;
}

// Two outputs side by side for one list of records.
function bandingView(a, b, cat) {
  const oa = jalankan(a, cat); const ob = jalankan(b, cat); const sama = oa === ob;
  return el('div', { class: `rk-banding ${sama ? 'sama' : 'beda'}` },
    el('div', null, el('small', null, VERSI[a].nama), el('code', null, oa)),
    el('div', null, el('small', null, VERSI[b].nama), el('code', null, ob)),
    el('b', null, sama ? '= sama' : '≠ BEDA'));
}

// T1–T7 on one version. Characterization: expected = Kak Bayu's output; after
// the fix the expectations come from the rules.
function ujiTabel(id) {
  const rows = UJI.map(([k, cat]) => { const want = id === 'fix' ? aturanBaru(cat) : jalankan('bayu', cat); const got = jalankan(id, cat); return { k, cat, want, got, ok: want === got }; });
  const lulus = rows.filter((r) => r.ok).length;
  return el('div', { class: 'rk-uji-wadah' },
    el('table', { class: 'rk-uji' }, el('tr', null, ['uji', 'catatan', id === 'fix' ? 'harapan (aturan lomba)' : 'harapan (perilaku lama)', 'keluaran', ''].map((h) => el('th', null, h))),
      rows.map((r) => el('tr', { class: r.ok ? 'lulus' : 'gagal' }, el('td', null, r.k), el('td', null, el('code', null, pyListShort(r.cat))), el('td', null, el('code', null, r.want)), el('td', null, el('code', null, r.got)), el('td', null, r.ok ? '✓ lulus' : '✗ gagal')))),
    el('p', { class: 'rk-ringkas' }, `${lulus} dari ${rows.length} uji lulus.`));
}
// Expected results from the competition rules (used after the fix).
export function aturanBaru(cat) {
  const t = new Map();
  for (const [n, b, j] of cat) { if (!t.has(n)) t.set(n, 0); const P = { 1: [10, 0, 0], 2: [20, -5, 0], 3: [30, -10, 0] }[b]; t.set(n, Math.max(0, t.get(n) + (j === 'B' ? P[0] : j === 'L' ? P[2] : P[1]))); }
  return reprOut([...t.entries()].sort((a, c) => c[1] - a[1]));
}

// ---------- main rounds (worksheet order) ----------
const OUT_T7 = "[('Melati', 35), ('Kenanga', 30), ('Mawar', 0)]";
const opts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));

function cariPembeda(wrap, ctx, { a, b, prompt, info, done }) {
  const msg = el('p', { class: 'reveal info' }, info);
  const hasil = el('div', { class: 'rk-hasil' });
  let cat = []; let fin = false;
  const ed = penyusun((c) => { cat = c; hasil.replaceChildren(); });
  wrap.append(el('p', { class: 'prompt' }, prompt), ed, el('div', { class: 'kode-baris' }, button('Bandingkan ▶', () => {
    if (fin) return;
    hasil.replaceChildren(bandingView(a, b, cat));
    if (jalankan(a, cat) === jalankan(b, cat)) { ctx.mistake(); shake(hasil); say(msg, 'bad', 'Keluarannya masih sama. Coba catatan lain.'); return; }
    fin = true; ctx.sound.good(); say(msg, 'good', `Catatan pembeda sah: ${cat.length} catatan.`); setTimeout(done, 2600);
  }, 'primary')), hasil, msg);
}

function round(wrap, ctx, r, done) {
  if (r === 0) {
    const L = langkahBayu(CONTOH); const v = (i, n) => (n in L[i].skor ? String(L[i].skor[n]) : '-');
    wrap.append(kodeBayu());
    rowsChoose(wrap, ctx, { prompt: 'Soal 1a. Telusuri hitung(contoh). Berapa skornya setelah catatan ini?', cls: 'rk-isi', rows: [
      ['a', 'Setelah ("Mawar", 1, "S"): skor Mawar', ['-', '0', '-5', '10'], v(1, 'Mawar'), 'Baris 6 memasukkan Mawar dengan 0, lalu babak 1 tidak punya baris untuk jawaban salah.'],
      ['b', 'Setelah ("Mawar", 2, "S"): skor Mawar', ['0', '-5', '-10', '20'], v(3, 'Mawar'), 'Baris 14: Mawar −5. Kode Kak Bayu tidak membatasi skor di babak 2.'],
      ['c', 'Setelah ("Melati", 2, "L"): skor Melati', ['10', '5', '0', '-5'], v(4, 'Melati'), 'Baris 13–14: lewat diperlakukan seperti salah, jadi Melati −5.'],
      ['d', 'Setelah ("Mawar", 3, "S"): skor Mawar', ['-15', '-5', '0', '-10'], v(6, 'Mawar'), 'Baris 19 membuat −15, lalu baris 20–21 mengembalikannya ke 0.'],
      ['e', 'Setelah ("Melati", 3, "B"): skor Melati', ['30', '35', '40', '45'], v(7, 'Melati')],
    ], done });
  } else if (r === 1) {
    choice(wrap, { prompt: 'Soal 1b. Apa keluaran hitung(contoh)?', subject: kodeBayu([21]), ctx, onRight: done, columns: 1, options: ctx.rand.shuffle(opts(OUT_T7, ["[('Melati', 40), ('Kenanga', 30), ('Mawar', 0)]", "[('Melati', 35), ('Kenanga', 30), ('Mawar', -15)]", "[('Kenanga', 30), ('Melati', 35), ('Mawar', 0)]"])) });
  } else if (r === 2) {
    pickSet(wrap, ctx, { prompt: 'Soal 1c. Mana yang membuat kode ini sulit dirawat? Pilih semua yang tepat.', subject: kodeBayu(), right: ['nama', 'angka', 'ulang', 'satu'],
      items: ctx.rand.shuffle([['nama', 'Nama satu huruf: d, t, r, n, h, x (baris 1–6, 22)'], ['angka', 'Angka poin tersebar di baris 9, 12, 14, 17, 19'], ['ulang', 'Blok yang mirip ditulis berulang untuk setiap babak (baris 7–21)'], ['satu', 'Satu fungsi menghitung, membatasi skor, dan mengurutkan sekaligus'], ['py', 'Ditulis dengan Python, bukan bahasa lain'], ['pendek', 'Panjangnya 23 baris']]),
      why: 'Tepat. Panjang kode dan bahasa pemrogramannya bukan masalah; nama, angka yang tersebar, dan blok berulanglah yang membuatnya sulit diubah.', done });
  } else if (r === 3) {
    wrap.append(kodeBayu());
    rowsChoose(wrap, ctx, { prompt: 'Soal 2a. Uji karakterisasi: keluaran hitung saat ini', cls: 'rk-isi rk-mono', rows: [
      ['t1', 'T1 hitung([])', ['[]', "[('', 0)]", 'None'], '[]'],
      ['t2', 'T2 [("Melati", 1, "S")]', ['[]', "[('Melati', 0)]", "[('Melati', -5)]"], jalankan('bayu', UJI[1][1])],
      ['t3', 'T3 [("Mawar", 2, "S")]', ["[('Mawar', 0)]", "[('Mawar', -5)]", '[]'], jalankan('bayu', UJI[2][1])],
      ['t4', 'T4 [("Mawar", 3, "S")]', ["[('Mawar', 0)]", "[('Mawar', -10)]", '[]'], jalankan('bayu', UJI[3][1])],
      ['t5', 'T5 [("Melati", 2, "L")]', ["[('Melati', 0)]", "[('Melati', -5)]", '[]'], jalankan('bayu', UJI[4][1])],
      ['t6', 'T6 [("Melati", 1, "B"), ("Kenanga", 1, "B")]', ["[('Melati', 10), ('Kenanga', 10)]", "[('Kenanga', 10), ('Melati', 10)]"], jalankan('bayu', UJI[5][1]), 'Skor sama: Melati tetap di depan karena lebih dulu muncul. sorted di Python stabil.'],
    ], done });
  } else if (r === 4) {
    pickSet(wrap, ctx, { prompt: 'Soal 2c. Keluaran uji mana yang melanggar aturan lomba?', subject: el('div', null, aturanTabel(), ujiTabel('bayu')), right: ['T3', 'T5', 'T7'],
      items: UJI.map(([k]) => [k, k]), why: 'T3 negatif, T5 mengurangi regu yang lewat, T7 memberi Melati 35 (seharusnya 40). Uji karakterisasi tetap mencatatnya apa adanya, supaya kita tahu bila perilaku berubah.', done });
  } else if (r === 5) {
    pairRound(wrap, ctx, { prompt: 'Soal 3a. Ganti nama: pasangkan nama lama dengan nama baru.', left: [['a', 'hitung', 'hs'], ['b', 'd', 'cat'], ['c', 't', 'sk'], ['d', 'n, r[1], r[2]', 'rbj'], ['e', 'h', 'per']],
      texts: { hs: 'hitung_skor', cat: 'catatan', sk: 'skor', rbj: 'regu, babak, jawaban', per: 'peringkat' }, finalMsg: 'Tepat. Nama yang jelas sudah menjelaskan isinya.', done });
  } else if (r === 6) {
    choice(wrap, { prompt: 'Soal 3b. Isi tabel ATURAN supaya perilakunya tetap sama dengan kode Kak Bayu. # babak: (poin bila benar, poin bila tidak benar)', subject: kodeBayu([8, 11, 13, 16, 18]), ctx, onRight: done, columns: 1,
      options: ctx.rand.shuffle(opts('ATURAN = {1: (10, 0), 2: (20, -5), 3: (30, -10)}', ['ATURAN = {1: (10, 0, 0), 2: (20, -5, 0), 3: (30, -10, 0)}', 'ATURAN = {1: (10, 0), 2: (20, 5), 3: (30, 10)}', 'ATURAN = {1: (10, -5), 2: (20, -5), 3: (30, -10)}'])) });
  } else if (r === 7) {
    wrap.append(kodeVersi('rapi', [12, 14, 16, 17]));
    rowsChoose(wrap, ctx, { prompt: 'Soal 3c. Lengkapi versi rapi supaya lulus T1–T7', cls: 'rk-isi rk-mono', rows: [
      ['p', 'poin(): bila jawaban == "B"', ['return benar', 'return lainnya', 'return 0'], 'return benar'],
      ['q', 'poin(): selain itu', ['return lainnya', 'return benar', 'return 0'], 'return lainnya'],
      ['s', 'skor[regu] = …', ['skor[regu] + poin(babak, jawaban)', 'poin(babak, jawaban)', 'max(0, skor[regu] + poin(babak, jawaban))'], 'skor[regu] + poin(babak, jawaban)'],
      ['c', 'if … : skor[regu] = 0', ['babak == 3 and jawaban != "B" and skor[regu] < 0', 'skor[regu] < 0', 'babak == 3 and skor[regu] < 0'], 'babak == 3 and jawaban != "B" and skor[regu] < 0', 'Syaratnya harus sama persis dengan baris 15–21 kode Kak Bayu.'],
    ], done });
  } else if (r === 8) {
    choice(wrap, { prompt: 'Soal 3d. Rudi menulis if babak == 3 and skor[regu] < 0: dan T1–T7 tetap lulus. Apakah perilakunya pasti sama?', subject: el('div', { class: 'rk-dua' }, kodeVersi('rudi', [16]), ujiTabel('rudi')), ctx, onRight: done, columns: 1,
      options: ctx.rand.shuffle(opts('Tidak pasti. Regu dengan skor −31 atau kurang yang lalu benar di babak 3 berbeda hasilnya.', ['Pasti sama, karena T1–T7 lulus.', 'Tidak pasti. Hasilnya berbeda untuk setiap catatan babak 3.', 'Pasti sama, karena babak 3 tetap dibatasi.'])) });
  } else if (r === 9) {
    cariPembeda(wrap, ctx, { a: 'bayu', b: 'rudi', prompt: 'Cari catatan pembeda: Kak Bayu dan versi Rudi', info: 'Petunjuk: skor harus turun sampai −35 di babak 2 dulu. "Salin terakhir" mempercepat.', done });
  } else if (r === 10) {
    wrap.append(el('div', { class: 'rk-dua' }, kodeVersi('rina', [14]), kodeVersi('dodi', [17])));
    rowsChoose(wrap, ctx, { prompt: 'Soal 4a–b. Versi rapi buatan teman', cls: 'rk-isi', rows: [
      ['rina', 'Uji yang gagal pada versi Rina', ['T3 dan T5', 'T3 saja', 'T5 dan T7', 'tidak ada'], 'T3 dan T5', 'Keduanya memberi 0, bukan −5.'],
      ['dodi', 'Uji yang gagal pada versi Dodi', ['T6', 'T7', 'T6 dan T7', 'tidak ada'], 'T6', "[('Kenanga', 10), ('Melati', 10)]: skor sama diurutkan menurut abjad."],
      ['jenis', 'Perubahan Rina termasuk', ['perbaikan bug, bukan perapian', 'perapian kode', 'uji karakterisasi'], 'perbaikan bug, bukan perapian', 'Rapikan dulu tanpa mengubah perilaku, lalu perbaiki bug sebagai langkah terpisah dengan harapan uji yang diperbarui.'],
    ], done });
  } else if (r === 11) {
    const cat = [['Melati', 4, 'B']];
    rowsChoose(wrap, ctx, { prompt: 'Soal 4c. Panitia salah mengetik babak 4: [("Melati", 4, "B")]', cls: 'rk-isi rk-mono', rows: [
      ['b', 'Kode Kak Bayu', [jalankan('bayu', cat), jalankan('rapi', cat), "[('Melati', 50)]"], jalankan('bayu', cat), 'Diam-diam diabaikan: Melati tercatat 0 tanpa pesan apa pun.'],
      ['r', 'Versi rapi', [jalankan('rapi', cat), jalankan('bayu', cat), "[('Melati', 50)]"], jalankan('rapi', cat), 'ATURAN tidak punya babak 4. Galat yang jelas biasanya lebih baik, tetapi tetap perubahan perilaku yang harus diputuskan dengan sengaja.'],
    ], done });
  } else if (r === 12) {
    wrap.append(kodeVersi('fix', [0, 7, 8, 16]));
    rowsChoose(wrap, ctx, { prompt: 'Soal 5. Setelah perbaikan bug, harapan uji yang berubah', cls: 'rk-isi rk-mono', rows: [
      ['t3', 'T3', ["[('Mawar', 0)]", "[('Mawar', -5)]"], aturanBaru(UJI[2][1])],
      ['t5', 'T5', ["[('Melati', 0)]", "[('Melati', -5)]"], aturanBaru(UJI[4][1])],
      ['t7', 'T7', ["[('Melati', 40), ('Kenanga', 30), ('Mawar', 0)]", OUT_T7], aturanBaru(CONTOH)],
      ['b4', 'Babak 4 (+50, −25, 0): baris yang diubah di versi baru', ['1', '3', '7'], '1', 'Cukup 4: (50, -25, 0) di ATURAN. Di kode Kak Bayu perlu blok baru 7 baris, dan bug lewat ikut tersalin.'],
    ], done });
  } else if (r === 13) {
    rowsChoose(wrap, ctx, { prompt: 'Soal 6. Sama atau Beda? (pasti sama untuk semua catatan, atau ada catatan yang berubah)', cls: 'rk-isi rk-kartu', rows: Object.entries(KARTU).map(([k, c]) => [k, `${k}. ${c.t}`, ['Sama', 'Beda'], c.beda ? 'Beda' : 'Sama', c.why]), done });
  } else if (r === 14) {
    cariPembeda(wrap, ctx, { a: 'bayu', b: 'K5', prompt: 'Cari catatan pembeda: Kak Bayu dan kartu K5', info: 'K5 menghapus baris 5–6 dan memakai t.get(n, 0).', done });
  } else {
    const R = { rapi: bandingkan('rapi'), rudi: bandingkan('rudi'), rina: bandingkan('rina'), dodi: bandingkan('dodi') };
    choice(wrap, { prompt: `Tantangan. Pengacak layar ini: rapi ${R.rapi.beda}, Rudi ${R.rudi.beda}, Rina ${R.rina.beda}, Dodi ${R.dodi.beda} beda dari 1.000 daftar. Mengapa versi Rudi hampir tidak pernah tertangkap?`, ctx, onRight: done, columns: 1,
      options: ctx.rand.shuffle(opts('Satu regu harus salah paling sedikit 7 kali di babak 2 sebelum benar di babak 3; daftar acak 12 catatan hampir tidak pernah begitu.', ['Karena versi Rudi sebenarnya sama dengan kode Kak Bayu.', 'Karena pengacak hanya membuat catatan babak 1.', 'Karena 1.000 daftar terlalu banyak.'])) });
  }
}
const RONDE = 16;
const aturanTabel = () => el('table', { class: 'rk-aturan' }, el('tr', null, ['Babak', 'Benar', 'Salah', 'Lewat'].map((h) => el('th', null, h))), [[1, '+10', '0', '0'], [2, '+20', '−5', '0'], [3, '+30', '−10', '0']].map((r) => el('tr', null, r.map((x) => el('td', null, String(x))))));

export default {
  id: 'sma-54-rapikan-kode',
  title: 'Merapikan Kode Warisan',
  topic: 'Merapikan kode (refactoring): ciri kode yang sulit dirawat, uji karakterisasi, nama bermakna, tabel aturan, memecah fungsi, perubahan yang tampak sama tetapi mengubah perilaku, batas uji acak, dan memisahkan perapian dari perbaikan bug',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧹',
  source: null,
  rounds: RONDE,
  maxPlayers: 4,
  goal: 'Telusuri kode skor lomba Kak Bayu, catat perilakunya dengan uji karakterisasi, rapikan langkah demi langkah, temukan versi teman yang diam-diam mengubah perilaku, lalu perbaiki bugnya sebagai langkah terpisah.',
  extraModes: [
    { id: 'dua', icon: '🪞', label: 'Dua Versi Berdampingan', desc: 'Kode Kak Bayu di samping versi rapi, Rudi, Rina, Dodi, atau setelah perbaikan. Jalankan uji T1–T7 pada keduanya', create: createDua },
    { id: 'papan', icon: '🏆', label: 'Papan Skor', desc: 'Jalankan catatan jawaban satu per satu dan lihat skor setiap regu berubah', create: createPapan },
    { id: 'pembeda', icon: '🔎', label: 'Pencari Pembeda', desc: 'Susun catatan sendiri atau jalankan pengacak, lalu bandingkan keluaran dua versi', create: createPembeda },
    { id: 'giliran', icon: '🃏', label: 'Sama atau Beda?', desc: 'Tim bergantian mengambil kartu K1–K6. Jawaban Beda harus disertai catatan pembeda yang diperiksa layar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rapikan-kode' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      let solved = false;
      round(wrap, ctx, ctx.round % RONDE, () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 900); } });
    }
    render();
  },
};

// ---------- extra modes ----------
const PEMBANDING = ['rapi', 'rudi', 'rina', 'dodi', 'fix'];
function createDua(root, ctx) {
  const wrap = el('div', { class: 'act rapikan-kode' });
  root.append(wrap);
  let v = 'rapi'; let uji = false;
  const draw = () => wrap.replaceChildren(
    el('div', { class: 'seg rk-versi' }, PEMBANDING.map((x) => onTap(el('button', { class: `seg-btn ${x === v ? 'on' : ''}`, type: 'button' }, VERSI[x].nama), () => { v = x; uji = false; draw(); }))),
    el('div', { class: 'rk-dua' }, el('div', { class: 'rk-kolom' }, el('b', null, 'Kode Kak Bayu'), kodeBayu()), el('div', { class: 'rk-kolom' }, el('b', null, VERSI[v].nama), kodeVersi(v))),
    el('div', { class: 'kode-baris' }, button('▶ Jalankan uji T1–T7', () => { uji = true; ctx.sound.tap(); draw(); }, 'primary')),
    uji ? el('div', { class: 'rk-dua' }, el('div', { class: 'rk-kolom' }, el('b', null, 'Kak Bayu'), ujiTabel('bayu')), el('div', { class: 'rk-kolom' }, el('b', null, VERSI[v].nama), ujiTabel(v))) : null,
    uji && v === 'fix' ? el('p', { class: 'rk-ringkas' }, 'Setelah perbaikan, harapan T3, T5, dan T7 diganti dengan harapan dari aturan lomba. Kak Bayu gagal pada ketiganya, dan itu memang disengaja.') : null);
  draw();
}

function createPapan(root, ctx) {
  const wrap = el('div', { class: 'act rapikan-kode' });
  root.append(wrap);
  let fix = false; let i = 0; let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const draw = () => {
    const L = langkahBayu(CONTOH, { fix }); const cur = L[i - 1];
    const skor = cur ? cur.skor : {};
    wrap.replaceChildren(
      el('div', { class: 'seg rk-versi' }, [[false, 'Kode Kak Bayu'], [true, 'Setelah perbaikan']].map(([f, t]) => onTap(el('button', { class: `seg-btn ${fix === f ? 'on' : ''}`, type: 'button' }, t), () => { fix = f; i = 0; stop(); draw(); }))),
      el('div', { class: 'rk-dua' },
        fix ? kodeVersi('fix', cur ? [16] : []) : kodeBayu(cur ? cur.lines.map((n) => n - 1) : []),
        el('div', { class: 'rk-kolom' },
          papanSkor(skor, cur?.rec[0]),
          el('p', { class: 'rk-catatan' }, cur ? `Catatan ${i}: (${cur.rec.map((x) => JSON.stringify(x)).join(', ')}) → ${cur.rec[0]} ${cur.note}` : 'Ketuk Langkah untuk menjalankan catatan pertama.'),
          el('ol', { class: 'rk-jejak' }, CONTOH.map((rec, k) => el('li', { class: k < i ? 'sudah' : k === i ? 'berikut' : '' }, `(${rec.map((x) => JSON.stringify(x)).join(', ')})`))),
          i === CONTOH.length ? el('p', { class: 'rk-ringkas' }, `Keluaran: ${fix ? aturanBaru(CONTOH) : OUT_T7}`) : null,
          el('div', { class: 'kode-baris' },
            button('▶ Langkah', () => { if (i < CONTOH.length) { i++; ctx.sound.tap(); draw(); } }, 'primary'),
            button(timer ? '⏸ Berhenti' : '⏩ Otomatis', () => { if (timer) stop(); else timer = setInterval(() => { if (i >= CONTOH.length) { stop(); draw(); return; } i++; draw(); }, 1100); draw(); }),
            button('↺ Ulang', () => { stop(); i = 0; draw(); })))));
  };
  draw();
  return { destroy: stop };
}

function createPembeda(root, ctx) {
  const wrap = el('div', { class: 'act rapikan-kode' });
  root.append(wrap);
  let a = 'bayu'; let b = 'rudi'; let cat = []; let seed = 1; let acakHasil = null;
  const out = el('div', { class: 'rk-hasil' });
  const ed = penyusun((c) => { cat = c; showOut(); }, { babak4: true });
  const pilihan = ['bayu', 'rapi', 'rudi', 'rina', 'dodi', 'fix', ...Object.keys(KARTU)];
  const segV = (cur, set) => el('div', { class: 'seg rk-versi' }, pilihan.map((x) => onTap(el('button', { class: `seg-btn ${x === cur ? 'on' : ''}`, type: 'button' }, VERSI[x].nama.replace('Versi ', '').replace(' (3c)', '').replace(' (5a)', '')), () => { set(x); draw(); })));
  const showOut = () => out.replaceChildren(bandingView(a, b, cat));
  const runAcak = () => {
    acakHasil = ['rapi', 'rudi', 'rina', 'dodi'].map((x) => [x, bandingkan(x, seed)]);
    ctx.sound.tap(); draw();
  };
  const draw = () => wrap.replaceChildren(
    el('p', { class: 'rk-label' }, 'Versi A'), segV(a, (x) => { a = x; }), el('p', { class: 'rk-label' }, 'Versi B'), segV(b, (x) => { b = x; }),
    ed, out,
    el('div', { class: 'rk-pengacak' },
      el('b', null, 'Pengacak: Kak Bayu dibandingkan dengan versi lain pada 1.000 daftar acak (0–12 catatan)'),
      el('div', { class: 'kode-baris' }, button(`▶ Jalankan pengacak (benih ${seed})`, runAcak, 'primary'), button('Benih lain', () => { seed++; runAcak(); })),
      acakHasil ? el('div', { class: 'rk-acak' }, acakHasil.map(([x, h]) => el('div', { class: h.beda ? 'beda' : 'sama' }, el('small', null, VERSI[x].nama), el('b', null, `${h.beda} beda`),
        h.contohBeda ? onTap(el('button', { class: 'rk-contoh', type: 'button' }, 'pakai contoh'), () => { a = 'bayu'; b = x; ed.set(h.contohBeda); draw(); }) : null))) : null,
      acakHasil ? el('p', { class: 'rk-catatan' }, 'Angka di lembar kerja (0, 0, 478, 128) berasal dari pengacak Python dengan random.seed(1). Pengacak layar ini memakai bilangan acak lain, jadi hitungan Rina dan Dodi sedikit berbeda, tetapi versi rapi dan Rudi tetap 0.') : null));
  draw(); showOut();
}

// Sama atau Beda? Each turn a team draws a card; Beda answers need a record list that the screen checks.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rapikan-kode' });
  root.append(wrap);
  function start(nT) {
    const deck = ctx.rand.shuffle(Object.keys(KARTU)); const pts = Array(nT).fill(0); let t = 0;
    function step() {
      if (t >= deck.length) { finishBoard(wrap, ctx, { title: 'Sama atau Beda selesai', pts, again: () => pickTeams(wrap, 'Sama atau Beda?', start) }); return; }
      const team = t % nT; const k = deck[t]; const c = KARTU[k];
      const msg = el('p', { class: 'reveal info' }, 'Sama: perilakunya pasti tidak berubah untuk semua catatan. Beda: ada catatan yang hasilnya berubah.');
      const lanjut = () => wrap.append(el('div', { class: 'kode-baris' }, button('Lanjut ➜', () => { t++; step(); }, 'primary')));
      const kartu = el('div', { class: 'rk-kartu-besar' }, el('b', null, k), el('span', null, c.t));
      const jawab = (beda) => {
        if (!beda) {
          if (!c.beda) { pts[team] += 1; ctx.sound.good(); say(msg, 'good', `Benar, Sama. ${c.why} +1`); }
          else { ctx.mistake(); say(msg, 'bad', `Ternyata Beda. ${c.why}`); }
          wrap.replaceChildren(scoreBar(pts, team), kartu, el('div', { class: 'rk-dua' }, kodeBayu(), kodeVersi(k)), msg); lanjut(); return;
        }
        let cat = [];
        const hasil = el('div', { class: 'rk-hasil' });
        const ed = penyusun((x) => { cat = x; hasil.replaceChildren(); });
        wrap.replaceChildren(scoreBar(pts, team), kartu, el('p', { class: 'prompt' }, `Tim ${team + 1} menjawab Beda. Masukkan catatan pembeda.`), el('div', { class: 'rk-dua' }, kodeBayu(), kodeVersi(k)), ed,
          el('div', { class: 'kode-baris' }, button('Periksa ✓', () => {
            const ok = jalankan('bayu', cat) !== jalankan(k, cat);
            hasil.replaceChildren(bandingView('bayu', k, cat));
            if (c.beda) { pts[team] += ok ? 2 : 1; ok ? ctx.sound.good() : ctx.mistake(); say(msg, ok ? 'good' : 'bad', ok ? `Benar, Beda, dan catatan pembedanya sah. +2` : `Benar, Beda (+1), tetapi catatan ini belum membedakan. ${c.why}`); }
            else { ctx.mistake(); say(msg, 'bad', `Kartu ini Sama: tidak ada catatan pembeda. ${c.why}`); }
            wrap.querySelector('.rk-periksa')?.remove(); lanjut();
          }, 'primary rk-periksa')), hasil, msg);
      };
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Tim ${team + 1}: Sama atau Beda?`), kartu, el('div', { class: 'rk-dua' }, el('div', { class: 'rk-kolom' }, el('b', null, 'Kode Kak Bayu'), kodeBayu())),
        el('div', { class: 'kode-baris' }, button('Sama', () => jawab(false), 'primary'), button('Beda', () => jawab(true), 'primary')), msg);
    }
    step();
  }
  pickTeams(wrap, 'Sama atau Beda?', start);
}
