// Merapikan Kode Warisan — SMA/SMK (16–18 tahun), coding. Refactoring Kak
// Bayu's quiz-score program: characterization tests T1–T7, renaming, one
// rules table, small functions, versions that look the same but are not
// (Rudi, Rina, Dodi), the bug fix as a separate step, the Sama-atau-Beda
// cards, and why a random tester misses rare differences. Every version runs
// as real Python in mini-py; the random tester uses fast copies checked
// against mini-py.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
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
const aturanTabel = () => el('table', { class: 'rk-aturan' }, el('tr', null, ['Babak', 'Benar', 'Salah', 'Lewat'].map((h) => el('th', null, h))), [[1, '+10', '0', '0'], [2, '+20', '−5', '0'], [3, '+30', '−10', '0']].map((r) => el('tr', null, r.map((x) => el('td', null, String(x))))));

// ---------- Pemugar Kode Warisan: the hands-on missions ----------
// Kak Bayu's code shown with 2-space indent; line 22 breaks inside the bracket.
const BARIS54 = BAYU.flatMap((s, i) => {
  const t = s.replace(/^( +)/, (m) => ' '.repeat(m.length / 2));
  return i === 21 ? [{ no: 22, t: '  h = sorted(t.items(),' }, { no: 22, t: '    key=lambda x: x[1], reverse=True)', lanjut: true }] : [{ no: i + 1, t }];
});
const HEAD54 = {
  telusur: ['Telusuri Papan Skor Lama', 'Geser token regu ke skor barunya, catatan demi catatan.', 'Kodenya jalan, kan? Buat apa dipahami?'],
  ciri: ['Ciri Kode Warisan', 'Tempel stiker 🔢 di setiap baris angka poin, lalu namai cirinya.', 'Angka poinku tersebar. Temukan semuanya!'],
  foto: ['Abadikan Perilaku Lama', 'Potret keluaran T1–T7 apa adanya, lalu tandai yang melanggar aturan.', 'Langsung perbaiki saja, tak perlu foto!'],
  pugar: ['Pugar Langkah demi Langkah', 'Pasang nama baru dan tabel ATURAN. T1–T7 harus tetap hijau.', 'Satu langkah besar saja, lebih cepat!'],
  rudi: ['Kembar Palsu Rudi', 'Susun catatan yang membuat kode Kak Bayu dan versi Rudi berbeda.', 'Aku lulus T1–T7. Kita kembar, kan?'],
  bongkar: ['Bongkar Si Kembar Palsu', 'Tandai uji yang akan gagal, lalu jalankan T1–T7.', 'Versi Rina dan Dodi lebih baik, kok.'],
  babak4: ['Babak 4 Salah Ketik', 'Ramalkan keluaran kedua versi untuk ("Melati", 4, "B").', 'Diam-diam saja, tak ada yang tahu.'],
  perbaiki: ['Perbaiki Bug dengan Sengaja', 'Tambah poin lewat, perbarui harapan uji, lalu siapkan babak 4.', 'Bug lewat itu sudah tradisi!'],
  kartu: ['Sama atau Beda?', 'Cap setiap kartu perubahan. Cap Beda harus disertai catatan pembeda.', 'Semua kartu ini kelihatan sama.'],
  bos: ['Pengacak yang Rabun', 'Ramalkan versi yang lolos pengacak, lalu jadikan kasus langka uji T8.', 'Pengacakmu tak akan menemukanku!'],
};
const msg54 = (t) => el('p', { class: 'reveal info' }, t);
const dua54 = (...k) => el('div', { class: 'pk54-dua' }, ...k);
const kol54 = (...k) => el('div', { class: 'pk54-kolom' }, ...k);
const rec54 = ([r, b, j]) => `("${r}", ${b}, "${j}")`;
// Consecutive equal records are grouped: ("Mawar", 2, "S") ×7.
function ringkas54(list) {
  const g = [];
  for (const x of list) { const k = rec54(x); if (g.length && g[g.length - 1][0] === k) g[g.length - 1][1]++; else g.push([k, 1]); }
  return g.length ? g.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ') : '(kosong)';
}
const awalBlok = (b) => ({ 1: 3, 2: 7, 3: 14 }[b] || 1);

// Code ribbon: 8 rows of Kak Bayu's code, scrolled with ▲ ▼; hl/warn/stiker use line numbers.
function pita54({ onLine = null } = {}) {
  const N = 8; const maxS = BARIS54.length - N;
  const P = { start: 0, hl: [], warn: [], stiker: new Map() };
  const node = el('div', { class: 'pk54-pita' });
  const geser = (d) => { P.start = Math.max(0, Math.min(maxS, P.start + d)); draw(); };
  function draw() {
    const rows = BARIS54.slice(P.start, P.start + N);
    const idx = (nos) => rows.flatMap((r, i) => (nos.includes(r.no) ? [i] : []));
    fill(node,
      onTap(el('button', { class: 'pk54-gulir', type: 'button', 'data-arah': 'naik', disabled: P.start === 0 }, '▲'), () => geser(-4)),
      codeView(rows.map((r) => r.t), { labels: rows.map((r) => (r.lanjut ? '' : String(r.no))), hl: idx(P.hl), warn: idx(P.warn), cls: onLine ? 'ketuk' : '',
        onLine: onLine ? (i) => onLine(rows[i].no) : null, after: (i) => (P.stiker.has(rows[i].no) && !rows[i].lanjut ? el('span', { class: 'pk54-stiker' }, P.stiker.get(rows[i].no)) : null) }),
      onTap(el('button', { class: 'pk54-gulir', type: 'button', 'data-arah': 'turun', disabled: P.start >= maxS }, '▼'), () => geser(4)));
  }
  node.ke = (no) => { const k = BARIS54.findIndex((r) => r.no === no); P.start = Math.max(0, Math.min(maxS, k)); draw(); return node; };
  node.set = (o) => { Object.assign(P, o); draw(); return node; };
  node.P = P; draw();
  return node;
}

// Test lights T1–T7 (Penjaga Uji); run() lights them one by one.
function lampu54(ctx, keys = UJI.map((u) => u[0])) {
  const node = el('div', { class: 'pk54-lampu' });
  const draw = (st = {}) => fill(node, el('small', null, '🛡️ Penjaga Uji'), keys.map((k) => el('span', { class: `pk54-led ${st[k] || ''}`, 'data-k': k }, k)));
  node.run = (res, then) => {
    const st = {}; let j = 0;
    const tick = () => {
      if (!node.isConnected) return;
      if (j < keys.length) { st[keys[j]] = res[j] ? 'hijau' : 'merah'; j++; draw(st); setTimeout(tick, 130); return; }
      node.dataset.selesai = '1'; delete node.dataset.jalan; then?.();
    };
    delete node.dataset.selesai; node.dataset.jalan = '1'; ctx.sound.tap(); tick();
  };
  draw();
  return node;
}
// true per test when version id gives the expected output (old behaviour, or the rules after the fix).
const hasilUji = (id, baru = false) => UJI.map(([, cat]) => jalankan(id, cat) === (baru ? aturanBaru(cat) : jalankan('bayu', cat)));

// Record builder with regu, babak and jawaban buttons; Bandingkan runs both versions.
function pembeda54(ctx, { oops, msg, a, b, max = 12, hints = [], onFound }) {
  const st = { regu: 'Mawar', babak: 2, jawaban: 'S', list: [] }; let coba = 0; let fin = false;
  const node = el('div', { class: 'pk54-penyusun' }); const hasil = el('div', { class: 'pk54-banding' });
  const seg = (key, vals, fmt = String) => el('div', { class: 'pk54-seg' }, vals.map((v) => onTap(el('button', { class: `pk54-pil ${st[key] === v ? 'on' : ''}`, type: 'button', 'data-k': key, 'data-v': String(v) }, fmt(v)), () => { st[key] = v; draw(); })));
  const aksi = (k, label, fn) => onTap(el('button', { class: 'pk54-aksi', type: 'button', 'data-aksi': k }, label), () => { if (fin) return; fn(); fill(hasil); draw(); });
  function draw() {
    fill(node,
      seg('regu', REGU), seg('babak', [1, 2, 3], (v) => `babak ${v}`), seg('jawaban', ['B', 'S', 'L'], (v) => ({ B: 'B benar', S: 'S salah', L: 'L lewat' }[v])),
      el('div', { class: 'pk54-seg' },
        aksi('tambah', '+ Tambah', () => { if (st.list.length < max) st.list.push([st.regu, st.babak, st.jawaban]); else say(msg, 'info', `Paling banyak ${max} catatan.`); }),
        aksi('salin', '⧉ Salin terakhir', () => { if (st.list.length && st.list.length < max) st.list.push([...st.list[st.list.length - 1]]); }),
        aksi('hapus', '↶ Hapus', () => { st.list.pop(); }),
        aksi('kosong', '✕ Kosongkan', () => { st.list = []; })),
      el('code', { class: 'pk54-daftar', 'data-n': String(st.list.length) }, `catatan = [${ringkas54(st.list)}]`, el('small', null, ` · ${st.list.length} catatan`)),
      onTap(el('button', { class: 'btn primary pk54-bandingkan', type: 'button' }, 'Bandingkan ▶'), cek), hasil);
  }
  function cek() {
    if (fin) return;
    if (!st.list.length) { say(msg, 'info', 'Tambah catatan dulu.'); return; }
    const oa = jalankan(a, st.list); const ob = jalankan(b, st.list); const sama = oa === ob;
    fill(hasil, el('div', { class: `pk54-hasil ${sama ? 'sama' : 'beda'}` }, el('span', null, el('small', null, VERSI[a].nama), el('code', null, oa)), el('span', null, el('small', null, VERSI[b].nama), el('code', null, ob)), el('b', null, sama ? '= sama' : '≠ BEDA')));
    if (sama) { oops(); coba++; say(msg, 'bad', hints[Math.min(coba - 1, hints.length - 1)] || 'Keluarannya masih sama. Coba catatan lain.'); return; }
    fin = true; ctx.sound.good(); onFound(st.list.map((x) => [...x]));
  }
  draw();
  return node;
}

// Misi 1: the scoreboard. Three lanes, one token per regu; tap the new score for the lit regu.
function telusurRound(area, ctx, { oops, done }) {
  const L = langkahBayu(CONTOH); const VALS = [-15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35]; const skor = {}; let i = 0;
  const msg = msg54('Catatan 1: ("Melati", 1, "B"). Ketuk skor baru Melati.');
  const pita = pita54(); const strip = el('div', { class: 'pk54-strip' }); const papan = el('div', { class: 'pk54-papan' }); const kanan = kol54(pita);
  const HINT = { 1: 'Babak 1: baris 8–9 hanya menambah 10 bila jawabannya "B".', 2: 'Babak 2: bila bukan "B", baris 13–14 mengurangi 5, juga untuk lewat.', 3: 'Babak 3: baris 19 mengurangi 10, lalu baris 20–21 memeriksa apakah skornya di bawah 0.' };
  const draw = () => {
    const cur = CONTOH[i];
    fill(strip, CONTOH.map((rec, k) => el('span', { class: `pk54-cat ${k < i ? 'sudah' : k === i ? 'aktif' : ''}` }, rec54(rec))));
    fill(papan, REGU.map((r) => {
      const aktif = cur && cur[0] === r;
      const sel = (v) => { const c = el('span', { class: `pk54-sel ${skor[r] === v ? 'ada' : ''}`, 'data-v': String(v) }, el('small', null, String(v).replace('-', '−')), skor[r] === v ? el('i', { class: `pk54-token r-${r}` }) : null); return aktif ? onTap(c, () => pilih(v)) : c; };
      return el('div', { class: `pk54-lajur ${aktif ? 'aktif' : ''}`, ...(aktif ? { 'data-want': String(L[i].skor[r]) } : {}) }, el('b', { class: `pk54-nama r-${r}` }, r),
        el('span', { class: 'pk54-sel belum' }, el('small', null, '-'), r in skor ? null : el('i', { class: `pk54-token r-${r}` })), VALS.map(sel));
    }));
  };
  function pilih(v) {
    const cur = CONTOH[i]; const want = L[i].skor[cur[0]];
    if (v !== want) { oops(); say(msg, 'bad', `${L[i].fresh ? 'Regu baru mulai dari 0 (baris 5–6). ' : ''}${HINT[cur[1]]}`); return; }
    skor[cur[0]] = v; ctx.sound.tap(); pita.set({ hl: L[i].lines.filter((n) => n >= 3) }).ke(awalBlok(cur[1]));
    say(msg, 'info', `${cur[0]} ${L[i].note}.`); i++; draw();
    if (i < CONTOH.length) { const nx = CONTOH[i]; msg.textContent += ` Berikutnya ${rec54(nx)}: ketuk skor ${nx[0]}.`; return; }
    say(msg, 'info', 'Semua catatan sudah. Baris 22 mengurutkan skor dari besar ke kecil. Susun keluarannya.');
    fill(kanan, codeView(BARIS54.slice(-3).map((r) => r.t), { labels: ['22', '', '23'], hl: [0, 1] }), fillBoard(ctx, { oops, msg, view: rowsView([['hitung(contoh) →'], ['[', '_', ', ', '_', ', ', '_', ']']]), chips: ["('Melati', 35)", "('Kenanga', 30)", "('Mawar', 0)", "('Mawar', -15)", "('Melati', 40)"], want: ["('Melati', 35)", "('Kenanga', 30)", "('Mawar', 0)"],
      hints: ['reverse=True: skor terbesar di depan. Lihat token di papan.', 'Skor terbesar kedua.', 'Mawar −15 sudah dikembalikan ke 0 oleh baris 20–21.'], done: () => { say(msg, '', `Keluaran: ${OUT_T7}. Perhatikan: Melati yang lewat di babak 2 malah kehilangan 5 poin.`); done(); } }));
  }
  draw(); pita.ke(awalBlok(1));
  area.append(strip, dua54(kol54(papan), kanan), msg);
}

// Misi 1c: line hunt for scattered point numbers, then name the smells.
function ciriRound(area, ctx, { oops, done }) {
  const ANGKA = [9, 12, 14, 17, 19]; const dapat = new Set();
  const msg = msg54('Gulir dengan ▲ ▼ dan ketuk setiap baris yang menyimpan angka poin.');
  const hitung = el('p', { class: 'pk54-tally' }); const kanan = kol54(hitung);
  const tally = () => { hitung.textContent = `🔢 angka poin: ${dapat.size} dari 5 baris`; };
  const pita = pita54({ onLine: (no) => {
    if (dapat.size === ANGKA.length) return;
    if (dapat.has(no)) return;
    if (!ANGKA.includes(no)) { if (no === 20 || no === 21) { say(msg, 'info', 'Angka 0 di sini batas skor, bukan poin jawaban.'); return; } oops(); say(msg, 'bad', 'Baris ini tidak memuat angka poin. Cari +10, +20, −5, dan seterusnya.'); return; }
    dapat.add(no); ctx.sound.tap(); pita.P.stiker.set(no, '🔢'); pita.set({ warn: [...dapat] }); tally();
    if (dapat.size < ANGKA.length) { say(msg, 'info', `Baris ${no}. Masih ada ${ANGKA.length - dapat.size} lagi.`); return; }
    say(msg, 'info', 'Lima baris, tersebar dari 9 sampai 19. Untuk babak baru, semuanya harus dicari lagi. Sekarang namai ciri yang lain.');
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['nama d, t, r, n, h → ', '_'], ['blok babak 1, 2, 3 → ', '_'], ['hitung, batasi, urutkan dalam satu def → ', '_']]),
      chips: ['nama satu huruf', 'blok berulang', 'satu fungsi untuk semua', 'ditulis dengan Python', 'kodenya terlalu pendek'], want: ['nama satu huruf', 'blok berulang', 'satu fungsi untuk semua'],
      hints: ['Apa isi d atau t? Namanya tidak memberi tahu.', 'Baris 7–21 berisi tiga blok yang hampir sama.', 'Satu fungsi mengerjakan tiga tugas sekaligus.'],
      done: () => { say(msg, '', 'Itulah ciri kode warisan: nama satu huruf, angka tersebar, blok berulang, dan satu fungsi untuk semuanya. Bahasanya dan panjangnya bukan masalah.'); done(); } }));
  } });
  tally(); pita.ke(1);
  area.append(dua54(kol54(pita), kanan), msg);
}

// Misi 2: photograph each test's current output, then stamp the ones that break the rules.
const FOTO54 = {
  T1: ['None', '{}'], T2: ['[]', "[('Melati', -5)]"], T3: ["[('Mawar', 0)]", '[]'], T4: ["[('Mawar', -10)]", "[('Mawar', -5)]"], T5: ["[('Melati', 0)]", '[]'],
  T6: ["[('Kenanga', 10), ('Melati', 10)]", "[('Melati', 20)]"], T7: ["[('Melati', 40), ('Kenanga', 30), ('Mawar', 0)]", "[('Melati', 35), ('Kenanga', 30), ('Mawar', -15)]"],
};
const PETUNJUK54 = {
  T1: 'Tanpa catatan, kamus t tetap kosong, jadi daftar yang diurutkan juga kosong.', T2: 'Baris 5–6 memasukkan Melati dengan 0. Babak 1 tidak punya baris untuk jawaban salah.',
  T3: 'Baris 14 mengurangi 5. Di babak 2 tidak ada pembatasan skor.', T4: 'Baris 19 membuat −10, lalu baris 20–21 mengembalikannya ke 0.', T5: 'Lewat di babak 2 masuk ke else di baris 13, jadi −5.',
  T6: 'Skornya sama. sorted stabil, jadi urutan munculnya dipertahankan.', T7: 'Ini keluaran Misi 1.',
};
function fotoRound(area, ctx, { oops, done }) {
  const out = Object.fromEntries(UJI.map(([k, cat]) => [k, jalankan('bayu', cat)])); const foto = {}; let i = 0; const langgar = new Set();
  const msg = msg54('Uji karakterisasi memotret keluaran kode saat ini, benar atau salah. Seret keluaran T1 ke bingkai.');
  const pita = pita54(); const rak = el('div', { class: 'pk54-rak' }); const kamera = el('div', { class: 'pk54-kamera' }); const kanan = kol54(rak, kamera);
  const drawRak = (onPilih = null) => fill(rak, UJI.map(([k]) => { const f = el('div', { class: `pk54-foto ${foto[k] ? 'ada' : ''} ${langgar.has(k) ? 'langgar' : ''}`, 'data-k': k }, el('b', null, k), el('code', null, foto[k] || '?'), langgar.has(k) ? el('span', { class: 'pk54-cap-kecil' }, '⚠ melanggar') : null); return onPilih ? onTap(f, () => onPilih(k)) : f; }));
  function potret() {
    const [k, cat] = UJI[i]; const blok = cat.length ? cat[0][1] : 0; pita.set({ hl: [] }).ke(k === 'T7' ? 1 : cat.length ? awalBlok(blok) : 1);
    fill(kamera, fillBoard(ctx, { oops, msg, view: rowsView([[`📷 ${k}: hitung(${k === 'T7' ? 'contoh' : pyList(cat)})`], ['→ ', '_']]), chips: [out[k], ...FOTO54[k]], want: [out[k]], hints: [PETUNJUK54[k]],
      done: () => { foto[k] = out[k]; drawRak(); i++; if (i < UJI.length) { say(msg, 'info', `${k} terpotret. Berikutnya ${UJI[i][0]}.`); potret(); return; } cap(); } }));
  }
  function cap() {
    fill(kiri, aturanTabel()); fill(kamera);
    say(msg, 'info', 'Tujuh foto lengkap. Bandingkan dengan aturan lomba, lalu ketuk foto yang keluarannya melanggar aturan.');
    const want = ['T3', 'T5', 'T7'];
    const tekan = (k) => {
      if (langgar.has(k)) return;
      if (!want.includes(k)) { oops(); say(msg, 'bad', `${k} sesuai aturan lomba. Cari skor negatif, lewat yang dikurangi, atau total yang keliru.`); return; }
      langgar.add(k); ctx.sound.tap();
      if (langgar.size < want.length) { drawRak(tekan); say(msg, 'info', `${k} melanggar aturan. Masih ada ${want.length - langgar.size} lagi.`); return; }
      drawRak(); say(msg, '', 'T3 negatif, T5 mengurangi regu yang lewat, T7 memberi Melati 35 (seharusnya 40). Foto tetap disimpan apa adanya: tugasnya mencatat perilaku lama.'); done();
    };
    drawRak(tekan);
  }
  const kiri = kol54(pita); drawRak(); potret();
  area.append(dua54(kiri, kanan), msg);
}

// Misi 3: new names and the ATURAN table, each step checked by T1–T7.
function pugarRound(area, ctx, { oops, done }) {
  const msg = msg54('Langkah 1: seret kartu nama baru ke nama lama. Isi dari atas.');
  const pita = pita54(); const lampu = lampu54(ctx); const kerja = el('div', { class: 'pk54-kerja' }); const kanan = kol54(lampu, kerja);
  fill(kerja, fillBoard(ctx, { oops, msg, view: rowsView([['hitung → ', '_'], ['d → ', '_'], ['t → ', '_'], ['n, r[1], r[2] → ', '_'], ['h → ', '_']]),
    chips: ['hitung_skor', 'catatan', 'skor', 'regu, babak, jawaban', 'peringkat', 'data_lomba_final'], want: ['hitung_skor', 'catatan', 'skor', 'regu, babak, jawaban', 'peringkat'],
    hints: ['Fungsi ini menghitung skor.', 'd berisi daftar catatan jawaban.', 't menyimpan skor setiap regu.', 'r[0], r[1], r[2] adalah regu, babak, dan jawaban.', 'h adalah hasil yang sudah diurutkan.'],
    done: () => { say(msg, 'info', 'Penjaga Uji menjalankan T1–T7…'); lampu.run(hasilUji('rapi'), langkah2); } }));
  function langkah2() {
    say(msg, 'info', 'Semua hijau. Langkah 2: kumpulkan angka poin di tabel ATURAN, persis seperti yang dilakukan kode lama.');
    pita.set({ warn: [9, 12, 14, 17, 19] }).ke(7);
    fill(kerja, fillBoard(ctx, { oops, msg, view: codeFill(['# babak: (benar, tidak benar)', 'ATURAN = {', ['  1: (', '_', ', ', '_', '),'], ['  2: (', '_', ', ', '_', '),'], ['  3: (', '_', ', ', '_', '),'], '}']),
      chips: ['10', '0', '20', '-5', '30', '-10', '5', '-15'], want: ['10', '0', '20', '-5', '30', '-10'],
      hints: ['Baris 9: benar di babak 1.', 'Babak 1 tidak punya baris untuk jawaban tidak benar.', 'Baris 12.', 'Baris 14: semua yang bukan "B", termasuk lewat.', 'Baris 17.', 'Baris 19.'],
      done: () => { say(msg, 'info', 'Penjaga Uji menjalankan T1–T7 pada versi rapi…'); lampu.run(hasilUji('rapi'), () => {
        fill(kerja, codeView(['def poin(babak, jawaban):', '  benar, lainnya = ATURAN[babak]', '  if jawaban == "B":', '    return benar', '  return lainnya'], { hl: [1] }));
        say(msg, '', 'Versi rapi lulus T1–T7 di setiap langkah. Angka poin kini di satu tempat, dan poin() membacanya.'); done(); }); } }));
  }
  pita.ke(1);
  area.append(dua54(kol54(pita), kanan), msg);
}

// Misi 3d: Rudi's twin passes T1–T7; build the record list that tells them apart.
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg54('Versi Rudi membuang syarat jawaban != "B". Susun catatan pembeda, lalu tekan Bandingkan.');
  const lampu = lampu54(ctx);
  const kiri = kol54(codeView(['# versi rapi', 'if (babak == 3 and jawaban != "B"', '    and skor[regu] < 0):', '  skor[regu] = 0', '# versi Rudi', 'if babak == 3 and skor[regu] < 0:', '  skor[regu] = 0'], { hl: [1], warn: [5] }), lampu);
  const kanan = kol54(pembeda54(ctx, { oops, msg, a: 'bayu', b: 'rudi', hints: ['Masih sama. Bedanya hanya muncul bila jawabannya "B" di babak 3 dan skornya masih negatif.', 'Benar di babak 3 memberi +30. Skor sebelumnya harus di bawah −30.', 'Babak 2 salah: −5 setiap kali. Tujuh kali menjadi −35. "Salin terakhir" mempercepat.'],
    onFound: (list) => { say(msg, '', `Catatan pembeda sah: ${list.length} catatan${list.length === 8 ? ', dan itu yang terpendek' : ''}. Kak Bayu memberi −5, Rudi memberi 0. Lulus semua uji belum berarti sama.`); done(); } }));
  area.append(dua54(kiri, kanan), msg);
  lampu.run(hasilUji('rudi'), () => say(msg, 'info', 'Rudi lulus T1–T7. Tetapi apakah pasti sama? Susun catatan pembeda, lalu tekan Bandingkan.'));
}

// Misi 4: mark the tests that will fail on Rina's and Dodi's versions, then run them.
const BEDA54 = {
  rina: ['# versi Rina', 'skor[regu] = max(0,', '  skor[regu] + poin(babak, jawaban))', '# if pembatasan skor dihapus'],
  dodi: ['# versi Dodi', 'return sorted(skor.items(),', '  key=lambda pasangan:', '    (-pasangan[1], pasangan[0]))'],
};
function bongkarRound(area, ctx, { oops, done }) {
  const msg = msg54(''); const kiri = kol54(); const kanan = kol54();
  function tahap(v, then) {
    const gagal = UJI.filter(([, cat]) => jalankan(v, cat) !== jalankan('bayu', cat)).map(([k]) => k); const tanda = new Set();
    say(msg, 'info', `Ketuk kartu uji yang menurutmu gagal pada ${VERSI[v].nama}, lalu tekan Jalankan.`);
    const lampu = lampu54(ctx); const kartu = el('div', { class: 'pk54-ujikartu-kartu', 'data-v': v });
    const draw = () => fill(kartu, UJI.map(([k, cat]) => onTap(el('button', { class: `pk54-ujikartu ${tanda.has(k) ? 'tandai' : ''}`, type: 'button', 'data-k': k }, el('b', null, `${tanda.has(k) ? '✗ ' : ''}${k}`), el('small', null, k === 'T7' ? 'contoh' : ringkas54(cat))), () => { if (tanda.has(k)) tanda.delete(k); else tanda.add(k); ctx.sound.tap(); draw(); })));
    fill(kiri, codeView(BEDA54[v], { warn: [1, 2, 3] }), lampu);
    fill(kanan, kartu, onTap(el('button', { class: 'btn primary pk54-jalankan', type: 'button' }, '▶ Jalankan T1–T7'), () => {
      if (lampu.dataset.jalan) return;
      const cocok = gagal.length === tanda.size && gagal.every((k) => tanda.has(k));
      lampu.run(hasilUji(v), () => {
        if (!cocok) { oops(); say(msg, 'bad', `Lampu merah: ${gagal.join(', ')}. Tandaimu belum cocok. Lihat lampunya, perbaiki tanda, lalu jalankan lagi.`); return; }
        ctx.sound.good(); then();
      });
    }));
    draw();
  }
  tahap('rina', () => {
    say(msg, 'info', 'T3 dan T5 gagal: Rina memberi 0, bukan −5. "Versiku malah lebih benar," kata Rina. Perubahannya termasuk apa?');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['Perubahan Rina adalah ', '_']]), chips: ['perbaikan bug', 'perapian kode'], want: ['perbaikan bug'], hints: ['Perapian tidak boleh mengubah perilaku, dan T3 serta T5 berubah.'],
      done: () => { say(msg, 'info', 'Tepat. Rapikan dulu, simpan, lalu perbaiki bug sebagai langkah terpisah. Sekarang versi Dodi.'); setTimeout(() => tahap('dodi', () => { say(msg, '', "T6 gagal: Dodi memberi [('Kenanga', 10), ('Melati', 10)]. Regu dengan skor sama diurutkan menurut abjad. Si Kembar Palsu terbongkar."); done(); }), 1600); } }));
  });
  area.append(dua54(kiri, kanan), msg);
}

// Misi 4c: a mistyped round number. The old code stays silent, the tidy version raises an error.
function babak4Round(area, ctx, { oops, done }) {
  const cat = [['Melati', 4, 'B']]; const ob = jalankan('bayu', cat); const or = jalankan('rapi', cat);
  const msg = msg54('Panitia salah mengetik babak 4. Ramalkan keluaran kode Kak Bayu dan versi rapi.');
  const pita = pita54().set({ hl: [7, 10, 15] }); const scr = layar();
  const kanan = kol54(el('div', { class: 'pk54-kartu-besar' }, el('b', null, '📝 catatan'), el('code', null, rec54(cat[0]))),
    fillBoard(ctx, { oops, msg, view: rowsView([['hitung → ', '_'], ['hitung_skor → ', '_']]), chips: [ob, or, "[('Melati', 50)]", '[]'], want: [ob, or],
      hints: ['Baris 7, 10, dan 15 semuanya salah untuk babak 4, tetapi baris 5–6 sudah memasukkan Melati.', 'poin() membaca ATURAN[babak], dan ATURAN tidak punya kunci 4.'],
      done: () => { kanan.append(scr); play(scr, [`>>> hitung(${pyList(cat)})`, ob, `>>> hitung_skor(${pyList(cat)})`], { err: or, end: () => { say(msg, '', 'Kode lama diam-diam memberi 0. Versi rapi berhenti dengan galat yang jelas. Perubahan perilaku seperti ini harus diputuskan dengan sengaja dan dicatat sebagai uji, bukan terjadi tanpa diketahui.'); done(); } }); } }));
  pita.ke(3);
  area.append(dua54(kol54(pita), kanan), msg);
}

// Misi 5: the deliberate fix — a lewat column, new expectations for T3, T5 and T7, then babak 4.
function perbaikiRound(area, ctx, { oops, done }) {
  const msg = msg54('Langkah 1: lengkapi poin() supaya lewat memakai kolom baru di ATURAN.');
  const kiri = kol54(codeView(['ATURAN = {', '  1: (10, 0, 0),', '  2: (20, -5, 0),', '  3: (30, -10, 0),', '}', '# (benar, salah, lewat)', 'skor[regu] = max(0,', '  skor[regu] + poin(babak, jawaban))'], { hl: [1, 2, 3, 6] }));
  const lampu = lampu54(ctx); const kanan = kol54();
  fill(kanan, tileSlots(ctx, { oops, msg, build: ['def poin(babak, jawaban):', '  benar, salah, lewat =', '    ATURAN[babak]', '  if jawaban == "B":', '    return benar', ['L1', 1], ['L2', 2], '  return salah'],
    tiles: [['L1', 'if jawaban == "L":'], ['L2', 'return lewat'], ['x', 'return 0', 'Lewat harus bernilai sesuai tabel, jadi ambil dari ATURAN.'], ['y', 'if jawaban == "S":', 'Salah sudah ditangani baris terakhir. Yang belum ada adalah lewat.']],
    order: 'Periksa dulu jawabannya, baru kembalikan nilainya.', onFull: harapan }));
  function harapan() {
    say(msg, 'info', 'Langkah 2: perilaku berubah dengan sengaja, jadi harapan uji yang melanggar aturan harus diganti. Seret harapan barunya.');
    fill(kanan, lampu, fillBoard(ctx, { oops, msg, view: rowsView([['T3 → ', '_'], ['T5 → ', '_'], ['T7 → ', '_']]),
      chips: ["[('Mawar', 0)]", "[('Melati', 0)]", "[('Melati', 40), ('Kenanga', 30), ('Mawar', 0)]", "[('Mawar', -5)]", OUT_T7], want: ["[('Mawar', 0)]", "[('Melati', 0)]", "[('Melati', 40), ('Kenanga', 30), ('Mawar', 0)]"],
      hints: ['Skor tidak pernah kurang dari 0.', 'Lewat di babak 2 bernilai 0.', 'Melati 10 + 0 + 30 = 40.'],
      done: () => { say(msg, 'info', 'Penjaga Uji menjalankan T1–T7 dengan harapan baru…'); lampu.run(hasilUji('fix', true), babak4); } }));
  }
  function babak4() {
    say(msg, 'info', 'Semua hijau. Langkah 3: panitia menambah babak 4 (benar +50, salah −25, lewat 0). Tambahkan barisnya.');
    fill(kiri, tileSlots(ctx, { oops, msg, build: ['ATURAN = {', '  1: (10, 0, 0),', '  2: (20, -5, 0),', '  3: (30, -10, 0),', ['b4', 1], '}'],
      tiles: [['b4', '4: (50, -25, 0),'], ['x1', '4: (50, -25),', 'ATURAN kini punya tiga kolom: benar, salah, lewat.'], ['x2', '4: (-25, 50, 0),', 'Urutannya benar, salah, lewat.']],
      onFull: () => { say(msg, '', 'Babak 4 cukup satu baris. Di kode Kak Bayu perlu blok baru tujuh baris, dan bug lewat ikut tersalin. Perapian dan perbaikan disimpan sebagai dua commit terpisah.'); done(); } }));
  }
  area.append(dua54(kiri, kanan), msg);
}

// Misi 6: stamp change cards Sama or Beda; a Beda stamp needs a record list the screen checks.
const DIFF54 = {
  K1: [['t = {}', 't[n] = t[n] + 10'], ['skor = {}', 'skor[n] = skor[n] + 10'], 'di semua baris'],
  K2: [['if r[1] == 2:', 'if r[1] == 3:'], ['elif r[1] == 2:', 'elif r[1] == 3:'], 'baris 10 dan 15'],
  K3: [['h = sorted(t.items(),', '  key=lambda x: x[1], reverse=True)'], ['h = sorted(t.items(),', '  key=lambda x: -x[1])'], 'baris 22'],
  K4: [['    else:', '      t[n] = t[n] - 10', '      if t[n] < 0:', '        t[n] = 0'], ['    else:', '      t[n] = t[n] - 10', '  if t[n] < 0:', '    t[n] = 0'], 'baris 20–21 keluar dari blok babak 3'],
  K5: [['if n not in t:', '  t[n] = 0', 't[n] = t[n] - 5'], ['(baris 5–6 dihapus)', 't[n] = t.get(n, 0) - 5'], 'juga baris 9, 12, 17, 19'],
  K6: [['t[n] = t[n] + 20'], ['t[n] = t[n] + 10 * r[1]'], 'juga baris 9 dan 17'],
};
function kartuRound(area, ctx, { oops, done }) {
  const beda = ctx.rand.shuffle(['K4', 'K5'])[0]; const deck = ctx.rand.shuffle([beda, ...ctx.rand.shuffle(['K1', 'K2', 'K3', 'K6']).slice(0, 2)]); let t = 0;
  const msg = msg54(''); const kiri = kol54(); const kanan = kol54();
  function step() {
    const k = deck[t]; const c = KARTU[k]; const [lama, baru, ket] = DIFF54[k];
    say(msg, 'info', `Kartu ${t + 1} dari ${deck.length}. Sama: perilakunya pasti tidak berubah untuk semua catatan. Beda: ada catatan yang hasilnya berubah.`);
    fill(kiri, el('div', { class: 'pk54-kartu-besar', 'data-kartu': k }, el('b', null, `🃏 ${k}`), el('span', null, c.t)),
      el('div', { class: 'pk54-diff' }, codeView(lama, { labels: lama.map(() => '−'), cls: 'lama' }), codeView(baru, { labels: baru.map(() => '+'), cls: 'baru' }), el('small', null, ket)));
    const lanjut = () => { t++; if (t < deck.length) { kanan.append(onTap(el('button', { class: 'btn primary pk54-lanjut', type: 'button' }, 'Kartu berikutnya ➜'), step)); return; } say(msg, '', `${msg.textContent} Tiga kartu tercap dengan benar.`); done(); };
    fill(kanan, el('div', { class: 'pk54-cap-cap' }, ['Sama', 'Beda'].map((v) => onTap(el('button', { class: `pk54-cap ${v.toLowerCase()}`, type: 'button', 'data-v': v }, v === 'Sama' ? '🟰 Sama' : '≠ Beda'), () => {
      if ((v === 'Beda') !== c.beda) { oops(); say(msg, 'bad', v === 'Sama' ? 'Ada catatan yang hasilnya berubah. Coba satu catatan saja.' : `Kartu ini Sama. ${c.why}`); return; }
      ctx.sound.tap();
      if (!c.beda) { fill(kanan, el('p', { class: 'pk54-cap-hasil sama' }, '🟰 SAMA')); say(msg, 'info', `Sama. ${c.why}`); lanjut(); return; }
      say(msg, 'info', 'Beda! Susun catatan pembedanya supaya cap ini sah.');
      fill(kanan, el('p', { class: 'pk54-cap-hasil beda' }, '≠ BEDA'), pembeda54(ctx, { oops, msg, a: 'bayu', b: k, hints: [k === 'K4' ? 'Kartu ini membatasi skor setelah setiap catatan. Kapan kode Kak Bayu membiarkan skor negatif?' : 'Tanpa baris 5–6, kapan sebuah regu tidak pernah masuk ke kamus t?'],
        onFound: () => { say(msg, 'info', `Cap Beda sah. ${c.why}`); lanjut(); } }));
    }))));
  }
  step();
  area.append(dua54(kiri, kanan), msg);
}

// Misi Bos: predict which versions slip past the random tester, run it, then turn the rare case into T8.
function bosRound(area, ctx, { oops, done }) {
  const V = ['rapi', 'rudi', 'rina', 'dodi']; const hit = Object.fromEntries(V.map((v) => [v, bandingkan(v).beda])); const nol = new Set();
  const msg = msg54('Pengacak membandingkan kode Kak Bayu dengan versi lain pada 1.000 daftar acak (0–12 catatan). Ketuk versi yang menurutmu menghasilkan 0 beda.');
  const kiri = kol54(); const kanan = kol54();
  const nama = { rapi: 'Versi rapi', rudi: 'Rudi', rina: 'Rina', dodi: 'Dodi' };
  const drawV = (buka = false) => fill(kiri, el('div', { class: 'pk54-versi-versi' }, V.map((v) => onTap(el('button', { class: `pk54-versi ${nol.has(v) ? 'nol' : ''} ${buka ? (hit[v] ? 'beda' : 'lolos') : ''}`, type: 'button', 'data-v': v }, el('b', null, nama[v]), el('small', null, buka ? `${hit[v]} beda` : nol.has(v) ? 'ramalan: 0' : 'ramalan: ada beda')), () => { if (kiri.dataset.kunci) return; if (nol.has(v)) nol.delete(v); else nol.add(v); ctx.sound.tap(); drawV(); }))),
    onTap(el('button', { class: 'btn primary pk54-acak', type: 'button' }, '🎲 Jalankan pengacak'), jalan));
  function jalan() {
    if (kiri.dataset.kunci) return;
    const benar = V.every((v) => nol.has(v) === (hit[v] === 0)); drawV(true);
    if (!benar) { oops(); say(msg, 'bad', `Hasil: ${V.map((v) => `${nama[v]} ${hit[v]}`).join(', ')}. Ramalanmu belum tepat. Ubah ramalan, lalu jalankan lagi.`); return; }
    kiri.dataset.kunci = '1'; ctx.sound.good(); drawV(true);
    say(msg, 'info', 'Ramalan tepat. Versi rapi memang sama, tetapi Rudi juga lolos padahal berbeda. Mengapa pengacak rabun?');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['Rudi baru berbeda bila satu regu tidak benar di babak 2'], ['paling sedikit ', '_', ' kali, lalu ', '_', ' di babak 3.']]), chips: ['7', '3', '12', 'benar', 'salah'], want: ['7', 'benar'],
      hints: ['−5 setiap kali. Skor harus di bawah −30 sebelum +30.', 'Pembatasan Rudi baru berbeda bila jawabannya "B".'], done: t8 }));
  }
  function t8() {
    const cat = [...Array(7).fill(['Mawar', 2, 'S']), ['Mawar', 3, 'B']]; const lampu = lampu54(ctx, ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);
    say(msg, 'info', 'Daftar acak 12 catatan hampir tidak pernah begitu. Kasus langka harus ditemukan dengan menalar, lalu dijadikan uji T8. Penjaga Uji menjalankan T1–T8 pada versi Rudi…');
    fill(kanan, el('div', { class: 'pk54-kartu-besar' }, el('b', null, '🛡️ T8 baru'), el('code', null, `[${ringkas54(cat)}]`), el('small', null, `harapan ${jalankan('bayu', cat)}, Rudi ${jalankan('rudi', cat)}`)), lampu);
    lampu.run([...hasilUji('rudi'), jalankan('rudi', cat) === jalankan('bayu', cat)], () => { say(msg, '', 'T8 merah: Si Kembar Palsu Rudi tertangkap. Uji acak membantu, tetapi kasus langka perlu dinalar dan dicatat sebagai uji.'); done(); });
  }
  drawV();
  area.append(dua54(kiri, kanan), msg);
}

export default {
  id: 'sma-54-rapikan-kode',
  title: 'Merapikan Kode Warisan',
  topic: 'Merapikan kode (refactoring): ciri kode yang sulit dirawat, uji karakterisasi, nama bermakna, tabel aturan, memecah fungsi, perubahan yang tampak sama tetapi mengubah perilaku, batas uji acak, dan memisahkan perapian dari perbaikan bug',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧹',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri kode skor lomba Kak Bayu, catat perilakunya dengan uji karakterisasi, rapikan langkah demi langkah, temukan versi teman yang diam-diam mengubah perilaku, lalu perbaiki bugnya sebagai langkah terpisah.',
  extraModes: [
    { id: 'dua', icon: '🪞', label: 'Dua Versi Berdampingan', desc: 'Kode Kak Bayu di samping versi rapi, Rudi, Rina, Dodi, atau setelah perbaikan. Jalankan uji T1–T7 pada keduanya', create: createDua },
    { id: 'papan', icon: '🏆', label: 'Papan Skor', desc: 'Jalankan catatan jawaban satu per satu dan lihat skor setiap regu berubah', create: createPapan },
    { id: 'pembeda', icon: '🔎', label: 'Pencari Pembeda', desc: 'Susun catatan sendiri atau jalankan pengacak, lalu bandingkan keluaran dua versi', create: createPembeda },
    { id: 'giliran', icon: '🃏', label: 'Sama atau Beda?', desc: 'Tim bergantian mengambil kartu K1–K6. Jawaban Beda harus disertai catatan pembeda yang diperiksa layar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rapikan-kode pk54-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pk54-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, ulah] = HEAD54[k]; foe = el('div', { class: 'pk54-musuh' }, el('b', null, '👯 Si Kembar Palsu'), el('span', null, ulah)); wrap.append(el('div', { class: 'pk54-kepala' }, misiHead(no, judul, tujuan, '🏛️'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Perilaku terjaga ✓'; next(ms); } });
      if (r === 0) { go('telusur', 1); telusurRound(area, ctx, fin(6000)); }
      else if (r === 1) { go('ciri', 1); ciriRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('foto', 2); fotoRound(area, ctx, fin(6500)); }
      else if (r === 3) { go('pugar', 3); pugarRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('rudi', 3); rudiRound(area, ctx, fin(6500)); }
      else if (r === 5) { go('bongkar', 4); bongkarRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('babak4', 4); babak4Round(area, ctx, fin(7000)); }
      else if (r === 7) { go('perbaiki', 5); perbaikiRound(area, ctx, fin(6500)); }
      else if (r === 8) { go('kartu', 6); kartuRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
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
