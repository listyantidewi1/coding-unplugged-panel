// Data Lomba Pramuka — SMA/SMK (16–18 tahun), coding. Python lists and dicts:
// reading values, totals and a ranking via tuples, the tie broken by name,
// best team per event, counting with a dict (Rudi's KeyError and .get), the
// alias bug b = a with arrows to one list, copying, and a nested design.
// The main mode is the game Sekretariat Lomba: envelopes, boxes, tuple cards
// and labels are tapped and dragged; nothing is typed.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, pyCode, stepper } from './smp-kit.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy, pyRepr, PyDict } from './mini-py.js';

export const REGU = ['Elang', 'Rajawali', 'Melati', 'Anggrek'];
export const LOMBA = ['semafor', 'pionering', 'sandi', 'P3K'];
export const NILAI = { Elang: [85, 78, 90, 70], Rajawali: [80, 92, 75, 91], Melati: [90, 70, 85, 80], Anggrek: [75, 85, 80, 88] };
export const DATA = (p3k = 80) => ['mata_lomba = ["semafor", "pionering", "sandi", "P3K"]', 'nilai = {', ...REGU.map((r) => `    ${`"${r}":`.padEnd(12)}[${(r === 'Melati' ? [...NILAI[r].slice(0, 3), p3k] : NILAI[r]).join(', ')}],`), '}'];
// Program nilai lomba, lines 1–16. rule: P3K as tiebreak (Tantangan); balik: tuple written (regu, total).
export const PROG = ({ p3k = 80, rule = false, balik = false } = {}) => [...DATA(p3k), 'total = {}', 'for regu in nilai:', '    total[regu] = sum(nilai[regu])', 'pasangan = []', 'for regu in total:',
  rule ? '    pasangan.append((total[regu], nilai[regu][3], regu))' : balik ? '    pasangan.append((regu, total[regu]))' : '    pasangan.append((total[regu], regu))', 'pasangan.sort(reverse=True)', 'for posisi in range(len(pasangan)):',
  balik ? '    print(posisi + 1, pasangan[posisi][0], pasangan[posisi][1])' : `    print(posisi + 1, pasangan[posisi][${rule ? 2 : 1}], pasangan[posisi][0])`];
export const JUARA = [...DATA(), 'juara_lomba = {}', 'for i in range(len(mata_lomba)):', '    terbaik = "Elang"', '    for regu in nilai:', '        if nilai[regu][i] > nilai[terbaik][i]:', '            terbaik = regu', '    juara_lomba[mata_lomba[i]] = terbaik', 'print(juara_lomba)'];
const JL = ['1', '2', '3', '4', '5', '6', '7', '17', '18', '19', '20', '21', '22', '23', '24'];
const UMUM = ['juara_umum = ["Anggrek", "Elang", "Anggrek", "Rajawali", "Anggrek",', '              "Melati", "Elang", "Anggrek", "Rajawali", "Elang"]', 'frekuensi = {}', 'for regu in juara_umum:'];
export const FREK = (ver = 'asli') => [...UMUM, ...(ver === 'rudi' ? ['    frekuensi[regu] = frekuensi[regu] + 1'] : ver === 'get' ? ['    frekuensi[regu] = frekuensi.get(regu, 0) + 1'] : ['    if regu in frekuensi:', '        frekuensi[regu] = frekuensi[regu] + 1', '    else:', '        frekuensi[regu] = 1']), 'print(frekuensi)'];
export const FL = (ver = 'asli') => (ver === 'asli' ? ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9'] : ['F1', 'F2', 'F3', 'F4', ver === 'rudi' ? 'F6' : 'F5', 'F9']);
export const ALIAS = (fix = '') => ['regu_putra = ["Elang", "Rajawali"]', 'regu_putri = ["Melati", "Anggrek"]', fix === 'copy' ? 'semua_regu = regu_putra.copy()' : fix === 'list' ? 'semua_regu = list(regu_putra)' : fix === 'plus' ? 'semua_regu = regu_putra + regu_putri' : 'semua_regu = regu_putra',
  ...(fix === 'plus' ? [] : ['for regu in regu_putri:', '    semua_regu.append(regu)']), 'print("Lapangan A (putra):", regu_putra)', 'print("Semua regu:", semua_regu)'];
const AL = (fix = '') => (fix === 'plus' ? ['A1', 'A2', 'A3', 'A6', 'A7'] : ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);
export const ANGKA = ['a = 5', 'b = a', 'b = b + 1', 'print(a, b)'];
export const SALIN = (copy = false) => ['total = {"Elang": 323, "Rajawali": 338}', `cadangan = total${copy ? '.copy()' : ''}`, 'cadangan["Elang"] = 0', 'print(total)'];
export const KEMAH = ['kemah = {', '    "Elang": {', '        "anggota": ["Adi", "Bima", "Candra", "Doni", "Eko", "Fajar", "Gilang", "Hadi"],', '        "nilai": [', '            {"semafor": 80, "pionering": 75, "sandi": 88},   # hari 1', '            {"semafor": 82, "pionering": 79, "sandi": 85},   # hari 2', '            {"semafor": 85, "pionering": 81, "sandi": 90},   # hari 3', '        ],', '        "pelanggaran": 2,', '    },', '}'];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, loopLimit: 200, ...o });
// Value of a Python expression over the contest data, or the error text.
export function evalExpr(src) { const r = run([...DATA(), `x = ${src}`]); return r.error ? r.error.text : pyRepr(r.vars.x, true); }
export const pasanganSebelum = (o = {}) => run(PROG(o).slice(0, 13)).vars.pasangan;
// terbaik after each team at event i (lines 19–22).
export function jejakTerbaik(i) { let t = 'Elang'; return REGU.map((r) => { if (NILAI[r][i] > NILAI[t][i]) t = r; return t; }); }

// ---- data-structure boxes: lists as indexed cells, dicts as key–value cards ----
const isObj = (v) => Array.isArray(v) || v instanceof PyDict;
function flatten(v, path, out) { out[path] = pyRepr(v); if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${path}/${i}`, out)); else if (v instanceof PyDict) for (const [k, x] of v) flatten(x, `${path}/${k}`, out); return out; }
function box(v, path, mark) {
  const inner = (x, p) => (isObj(x) ? box(x, p, mark) : el('b', null, pyRepr(x, true)));
  if (Array.isArray(v)) return el('span', { class: `dg-list ${v.tup ? 'tup' : ''}` }, v.length ? v.map((x, i) => el('span', { class: `dg-sel ${mark(`${path}/${i}`)}` }, el('small', null, String(i)), inner(x, `${path}/${i}`))) : el('em', null, v.tup ? '()' : '[ ]'));
  if (v instanceof PyDict) return el('span', { class: 'dg-dict' }, v.size ? [...v].map(([k, x]) => el('span', { class: `dg-pasang ${mark(`${path}/${k}`)}` }, el('small', null, pyRepr(k, true)), inner(x, `${path}/${k}`))) : el('em', null, '{ }'));
  return el('b', { class: `dg-skalar ${mark(path)}` }, pyRepr(v, true));
}
// Paths read by the line just run: name[k1][k2]… with literal or variable keys.
function readPaths(text, vars) {
  const got = [];
  const code = text.replace(/"[^"]*"(?!\s*\])/g, '""');
  for (const m of code.matchAll(/([A-Za-z_]\w*)((?:\[[^[\]]+\])+)/g)) {
    let o = vars[m[1]]; let p = m[1];
    for (const k of m[2].matchAll(/\[([^[\]]+)\]/g)) {
      const s = k[1].trim(); let key;
      if (/^-?\d+$/.test(s)) key = Number(s); else if (/^"(.*)"$/.test(s)) key = s.slice(1, -1); else if (/^[A-Za-z_]\w*$/.test(s) && !isObj(vars[s])) key = vars[s]; else break;
      if (Array.isArray(o)) { const i = key < 0 ? o.length + key : key; if (!(i in o)) break; p += `/${i}`; o = o[i]; } else if (o instanceof PyDict) { if (!o.has(key)) break; p += `/${key}`; o = o.get(key); } else break;
      got.push(p);
    }
  }
  return got;
}
// Hooks for pyTracer: the boxes light what the last line read (yellow) or changed (green).
export function structView(lines, { show = null } = {}) {
  let last = null; let prev = {};
  return {
    onStep: (l) => { last = l; if (!l) prev = {}; },
    extra: (st) => {
      const names = Object.keys(st.vars).filter((n) => (show ? show.includes(n) : isObj(st.vars[n])));
      const cur = {}; for (const n of names) flatten(st.vars[n], n, cur);
      const read = last ? readPaths(lines[last.line] || '', st.vars) : [];
      const mark = (p) => (prev[p] !== cur[p] && (prev[p] === undefined || !cur[p]?.match(/^[[{(]/)) && Object.keys(prev).length ? 'ubah' : read.includes(p) ? 'baca' : '');
      const view = el('div', { class: 'dg-struktur' }, names.map((n) => el('div', { class: 'dg-var' }, el('span', { class: 'dg-nama' }, n), box(st.vars[n], n, mark))));
      prev = cur;
      return view;
    },
  };
}
// Labels with arrows to the object they name; names sharing a list sit on one arrow.
export function aliasGroups(vars, hide = []) {
  const groups = new Map();
  for (const n of Object.keys(vars)) { if (hide.includes(n)) continue; const v = vars[n]; const k = isObj(v) ? v : `${typeof v}:${pyRepr(v)}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); }
  return [...groups].map(([k, ns]) => [ns, vars[ns[0]]]);
}
export const aliasView = (vars, hide = []) => el('div', { class: 'dg-alias' }, aliasGroups(vars, hide).map(([ns, v]) => el('div', { class: `dg-ikat ${ns.length > 1 ? 'dua' : ''}` }, el('div', { class: 'dg-label-label' }, ns.map((n) => el('span', { class: 'dg-label' }, n))), el('span', { class: 'dg-panah', 'aria-hidden': 'true' }), el('div', { class: 'dg-objek' }, box(v, ns[0], () => '')))));

const tracer = (lines, o = {}) => { const sv = structView(lines, o.show ? { show: o.show } : {}); return pyTracer(lines, { cls: 'dg-jejak', speed: 380, opts: { limit: 20000, loopLimit: 200 }, hideVars: o.hide ?? Object.entries(run(lines).vars).filter(([, v]) => isObj(v)).map(([n]) => n), onStep: sv.onStep, extra: sv.extra, ...o }); };
const aliasTracer = (lines, labels, o = {}) => pyTracer(lines, { cls: 'dg-jejak', speed: 450, labels, opts: { limit: 2000 }, hideVars: Object.keys(run(lines).vars), extra: (st) => aliasView(st.vars, ['regu']), ...o });

// ---------- Permainan: Sekretariat Lomba ----------
// The players run the contest office; the Panitia Ceroboh calls missing keys and makes aliases.
const HEAD37 = {
  amplop: ['Buka Amplop', 'Buka amplop kunci yang tepat, lalu ketuk kotak nilainya.', 'Ada yang memanggil amplop "Garuda"!'],
  isi: ['Kunci dan Isi', 'Lengkapi hasil setiap ekspresi dari kartu nilai.', 'Kunci dan isi dicampur aduk!'],
  peringkat: ['Papan Peringkat', 'Hitung total, lalu urutkan kartu tuple dari yang terbesar.', 'Papan peringkat masih kosong!'],
  seri: ['Nilai Seri', 'Urutkan tuple terbalik, lalu perbaiki nilai P3K Melati.', 'Tuple ditulis terbalik!'],
  juara: ['Juara Setiap Pos', 'Ketuk regu yang menjadi terbaik setelah setiap pemeriksaan.', 'Kartu terbaik tertukar!'],
  frek: ['Hitung Juara Umum', 'Masukkan setiap nama ke amplopnya, atau buat amplop baru.', 'Sepuluh nama datang sekaligus!'],
  rudi: ['Bug Rudi', 'Temukan galatnya, lalu ganti baris Rudi dengan get.', 'Rudi menghapus pemeriksaan in!'],
  alias: ['Jebakan Alias', 'Tempelkan label pada list yang tepat, lalu tambahkan regu putri.', 'Satu list diberi dua label!'],
  salin: ['Pakai .copy()', 'Pisahkan list dengan .copy(), lalu bandingkan dengan bilangan.', 'Lapangan putra kemasukan regu putri!'],
  bos: ['Lomba Kemah dan Penentu Seri', 'Ambil nilai dari struktur bersarang, lalu jadikan P3K penentu seri.', 'Nilai seri lagi di upacara penutupan!'],
};
const msg37 = (t) => el('p', { class: 'reveal info' }, t);
export const AMPLOP_Q = [['nilai["Melati"][2]', 'Melati-2'], ['mata_lomba[2]', 'ml-2'], ['nilai["Rajawali"][-1]', 'Rajawali-3'], ['mata_lomba.index("P3K")', 'ml-3'], ['max(nilai["Anggrek"])', 'Anggrek-3'], ['nilai["Garuda"]', 'KeyError']];
const KEYS = "['Elang', 'Rajawali', 'Melati', 'Anggrek']";
export const ISI_CHIPS = ['4', '16', KEYS, '[323, 338, 325, 328]', 'True', 'False'];
export const ISI_WANT = ['4', KEYS, 'True', 'False'];
export const TOTAL_CHIPS = ['323', '338', '325', '328', '330', '318'];
export const TOTAL_WANT = ['323', '338', '325', '328'];
const TOT = { Elang: 323, Rajawali: 338, Melati: 325, Anggrek: 328 };
export const RANK = ['Rajawali', 'Anggrek', 'Melati', 'Elang'];
export const RANK_BALIK = ['Rajawali', 'Melati', 'Elang', 'Anggrek'];
export const RANK_83 = ['Rajawali', 'Melati', 'Anggrek', 'Elang'];
export const JUARA_LAIN = [[1, 'Rajawali'], [2, 'Elang'], [3, 'Rajawali']];
export const JU = ['Anggrek', 'Elang', 'Anggrek', 'Rajawali', 'Anggrek', 'Melati', 'Elang', 'Anggrek', 'Rajawali', 'Elang'];
export const GET_TILES = [['get', 'frekuensi[regu] = frekuensi.get(regu, 0) + 1'], ['x1', 'frekuensi[regu] = frekuensi.get(regu) + 1', 'Tanpa nilai bawaan, get memberi None, dan None + 1 galat.'], ['x2', 'frekuensi[regu] = frekuensi[regu] + 1', 'Itu baris Rudi: KeyError lagi.'], ['x3', 'frekuensi.get(regu, 0) + 1', 'Hasilnya tidak disimpan ke dictionary.']];
export const COPY_TILES = [['copy', 'semua_regu = regu_putra.copy()'], ['x1', 'semua_regu = regu_putra', 'Itu alias lagi: label kedua pada list yang sama.'], ['x2', 'semua_regu == regu_putra', '== membandingkan, tidak membuat variabel.'], ['x3', 'semua_regu = regu_putra.append()', 'append menambah anggota dan memberi None, bukan list baru.']];
export const KEMAH_TILES = [['e', '["Elang"]'], ['n', '["nilai"]'], ['h', '[1]'], ['p', '["pionering"]'], ['x1', '[2]', 'Hari kedua berindeks 1, karena indeks list mulai dari 0.'], ['x2', '["anggota"]', 'Nilai lomba disimpan di kunci "nilai".'], ['x3', '["Melati"]', 'Yang ditanya regu Elang.']];
export const SERI_TILES = [['app', 'pasangan.append((total[regu],\n    nilai[regu][3], regu))'], ['prt', 'print(posisi + 1, pasangan[posisi][2],\n      pasangan[posisi][0])'], ['x1', 'pasangan.append((total[regu],\n    nilai[regu][0], regu))', 'Indeks 0 adalah semafor. Penentu seri lomba ini P3K, indeks 3.'], ['x2', 'print(posisi + 1, pasangan[posisi][1],\n      pasangan[posisi][0])', 'Tuple kini berisi tiga anggota: nama regu ada di indeks 2.']];
const tup = (a, b) => `(${typeof a === 'number' ? a : `'${a}'`}, ${typeof b === 'number' ? b : `'${b}'`})`;

// Envelopes (dict keys) holding indexed boxes, plus the mata_lomba list.
function envelopes({ open = null, all = false, onEnv = null, onBox = null, p3k = 80 } = {}) {
  const boxBtn = (v, key, i) => { const b = el('button', { class: 'pr37-kotak', type: 'button', 'data-v': `${key}-${i}` }, el('small', null, String(i)), el('b', null, typeof v === 'string' ? `"${v}"` : String(v))); return onBox ? onTap(b, () => onBox(`${key}-${i}`)) : b; };
  return el('div', { class: 'pr37-meja' },
    el('div', { class: 'pr37-ml' }, el('span', { class: 'pr37-nama' }, 'mata_lomba'), el('div', { class: 'pr37-kotak-kotak' }, LOMBA.map((v, i) => boxBtn(v, 'ml', i)))),
    el('div', { class: 'pr37-amplop-amplop' }, REGU.map((r) => {
      const isOpen = all || open === r; const vals = r === 'Melati' ? [...NILAI[r].slice(0, 3), p3k] : NILAI[r];
      const head = el('button', { class: 'pr37-amplop-kepala', type: 'button', 'data-k': r }, isOpen ? '📂' : '✉️', ` "${r}"`);
      if (onEnv) onTap(head, () => onEnv(r));
      return el('div', { class: `pr37-amplop ${isOpen ? 'buka' : ''}` }, head, isOpen ? el('div', { class: 'pr37-kotak-kotak' }, vals.map((v, i) => boxBtn(v, r, i))) : null);
    })));
}

// Misi 1a: open the right envelope and tap the right box, or call KeyError.
function amplopRound(area, ctx, { oops, done }) {
  const msg = msg37('Ketuk amplop untuk membukanya, lalu ketuk kotak hasil ekspresi.');
  let qi = 0; let open = null; const log = [];
  const view = el('div'); const expr = el('code', { class: 'pr37-ekspr' });
  const ke = onTap(el('button', { class: 'pr37-keyerror', type: 'button', 'data-v': 'KeyError' }, '💥 KeyError'), () => answer('KeyError'));
  const logBox = el('div', { class: 'pr37-log' });
  const draw = () => { expr.textContent = AMPLOP_Q[qi]?.[0] ?? ''; fill(view, envelopes({ open, onEnv: (r) => { open = open === r ? null : r; ctx.sound.tap(); draw(); }, onBox: answer })); fill(logBox, log.map((t) => el('span', null, t))); };
  function answer(v) {
    if (qi >= AMPLOP_Q.length) return; const [src, want] = AMPLOP_Q[qi];
    if (v !== want) {
      oops();
      const [wk] = want.split('-'); const [vk] = v.split('-');
      say(msg, 'bad', want === 'KeyError' ? 'Tidak ada amplop "Garuda". Panggil penjaga: KeyError.' : v === 'KeyError' ? 'Kunci itu ada, jadi tidak galat.' : wk !== vk ? (wk === 'ml' ? 'Ekspresi ini membaca list mata_lomba.' : `Buka amplop berkunci "${wk}".`) : src.includes('-1') ? 'Indeks −1 adalah kotak terakhir.' : src.includes('index') ? 'index mencari kotak berisi "P3K"; hasilnya nomor kotak itu.' : src.includes('max') ? 'max mengambil kotak dengan nilai terbesar.' : 'Indeks mulai dari 0: kotak ke-2 adalah kotak ketiga.');
      return;
    }
    ctx.sound.good(); const val = evalExpr(src); log.push(`${src} → ${val}`); qi++; open = null; draw();
    if (qi < AMPLOP_Q.length) { say(msg, 'info', `${val}. Ekspresi berikutnya.`); return; }
    say(msg, '', 'List dibaca dengan indeks (0, 1, 2, … atau −1 dari belakang); dictionary dibaca dengan kunci. Kunci yang tidak ada: KeyError.'); done();
  }
  draw();
  area.append(el('div', { class: 'pr37-soal' }, expr, ke), view, logBox, msg);
}

// Misi 1b: results of len, list, in.
function isiRound(area, ctx, { oops, done }) {
  const msg = msg37('Seret kartu hasil ke setiap ekspresi.');
  area.append(envelopes({ all: true }), fillBoard(ctx, { oops, msg, chips: ISI_CHIPS, want: ISI_WANT,
    view: rowsView([['len(nilai) → ', '_'], ['list(nilai) → ', '_'], ['"Elang" in nilai → ', '_'], ['85 in nilai → ', '_']]),
    hints: ['len dictionary menghitung banyak kuncinya.', 'list(dict) berisi kunci-kuncinya, sesuai urutan penulisan.', '"Elang" adalah salah satu kunci.', 'in pada dictionary hanya memeriksa kunci, dan 85 bukan kunci.'],
    done: () => { say(msg, '', 'Dictionary dilihat lewat kuncinya: len, list, dan in semuanya bekerja pada kunci.'); done(); } }), msg);
}

const rankBuild = (head, ids) => [head, ...ids.map((id) => [id, 0])];
const tupTiles = (f) => REGU.map((r) => [r, f(r)]);

// Misi 2a: totals, then the ranking from tuple cards.
function peringkatRound(area, ctx, { oops, done }) {
  const msg = msg37('total[regu] = sum(nilai[regu]). Hitung total setiap regu.');
  area.append(fillBoard(ctx, { oops, msg, chips: TOTAL_CHIPS, want: TOTAL_WANT,
    view: rowsView(REGU.map((r) => [`sum(${pyRepr(NILAI[r])}) = `, '_'])),
    hints: ['85 + 78 + 90 + 70.', '80 + 92 + 75 + 91.', '90 + 70 + 85 + 80.', '75 + 85 + 80 + 88.'],
    done: () => { say(msg, 'info', 'Setiap regu menjadi tuple (total, regu). Urutkan seperti pasangan.sort(reverse=True).'); setTimeout(rank, 2200); } }), msg);
  function rank() {
    const out = layar();
    fill(area, el('div', { class: 'pr37-dua' }, tileSlots(ctx, { oops, msg, build: rankBuild('pasangan.sort(reverse=True)', RANK), tiles: tupTiles((r) => tup(TOT[r], r)), order: 'reverse=True: tuple dengan total terbesar di depan.',
      onFull: () => play(out, run(PROG()).out, { end: () => { say(msg, '', 'Tuple diurutkan menurut anggota pertama, yaitu total. Rajawali juara.'); done(); } }) }), out), msg);
  }
}

// Misi 2b: reversed tuples, then fix Melati's P3K and rank the tie.
function seriRound(area, ctx, { oops, done }) {
  const msg = msg37('Panitia menulis tuple terbalik: (regu, total). Urutkan dengan sort(reverse=True).');
  area.append(tileSlots(ctx, { oops, msg, build: rankBuild('pasangan.sort(reverse=True)', RANK_BALIK), tiles: tupTiles((r) => tup(r, TOT[r])), order: 'Anggota pertama sekarang nama, jadi tuple diurutkan menurut abjad, dari belakang.',
    onFull: () => { say(msg, 'info', 'Urut abjad terbalik, bukan peringkat! Sekarang perbaiki nilai P3K Melati: seharusnya 83.'); setTimeout(fix, 2600); } }), msg);
  function fix() {
    let v = 80; let over = false;
    const num = el('b', { class: 'pr37-angka' }, String(v));
    const set = (d) => { if (over) return; v = Math.max(70, Math.min(90, v + d)); num.textContent = String(v); ctx.sound.tap(); fill(env, envelopes({ open: 'Melati', p3k: v })); if (v === 83) { over = true; say(msg, 'info', 'Total Melati 328, sama dengan Anggrek. Urutkan lagi.'); setTimeout(rank2, 1600); } };
    const env = el('div'); fill(env, envelopes({ open: 'Melati', p3k: v }));
    fill(area, env, el('div', { class: 'pr37-setel' }, el('code', null, 'nilai["Melati"][3] ='), onTap(el('button', { class: 'pr37-pm', type: 'button', 'data-d': '-1' }, '−'), () => set(-1)), num, onTap(el('button', { class: 'pr37-pm', type: 'button', 'data-d': '1' }, '+'), () => set(1))), msg);
  }
  function rank2() {
    const out = layar(); const T = { ...TOT, Melati: 328 };
    fill(area, el('div', { class: 'pr37-dua' }, tileSlots(ctx, { oops, msg, build: rankBuild('pasangan.sort(reverse=True)', RANK_83), tiles: tupTiles((r) => tup(T[r], r)), order: 'Total sama 328: Python membandingkan anggota kedua, yaitu nama. "Melati" > "Anggrek", jadi dengan reverse=True Melati di depan.',
      onFull: () => play(out, run(PROG({ p3k: 83 })).out, { end: () => { say(msg, '', 'Melati peringkat 2 hanya karena namanya. Tidak adil! Penentu seri yang sungguhan menunggu di Misi Bos.'); done(); } }) }), out), msg);
  }
}

// Misi 3: the terbaik card, step by step for semafor, then the other events.
function juaraRound(area, ctx, { oops, done }) {
  const msg = msg37('Semafor (i = 0): terbaik mulai "Elang". Setelah memeriksa setiap regu, ketuk regu yang menjadi terbaik.');
  const steps = jejakTerbaik(0); let j = 0; let phase = 0; const champ = {};
  const board = el('div'); const dict = el('div', { class: 'pr37-dict' });
  const draw = () => {
    const i = phase === 0 ? 0 : JUARA_LAIN[Math.min(phase, JUARA_LAIN.length) - 1][0];
    fill(board, el('div', { class: 'pr37-pos' }, el('b', null, `🏁 ${LOMBA[i]} (i = ${i})`), phase === 0 && j < 4 ? el('small', null, `periksa ${REGU[j]}: ${NILAI[REGU[j]][0]} > ${NILAI[j ? steps[j - 1] : 'Elang'][0]} (terbaik)?`) : el('small', null, 'Siapa juaranya?')),
      el('div', { class: 'pr37-regu-regu' }, REGU.map((r, k) => onTap(el('button', { class: `pr37-regu ${phase === 0 && k === j ? 'periksa' : ''}`, type: 'button', 'data-r': r }, el('span', null, r), el('b', null, String(NILAI[r][i]))), () => tap(r)))));
    fill(dict, el('code', null, 'juara_lomba = {'), Object.entries(champ).map(([k, v]) => el('code', null, `  "${k}": "${v}",`)), el('code', null, '}'));
  };
  function tap(r) {
    if (phase === 0) {
      if (r !== steps[j]) { oops(); say(msg, 'bad', steps[j] === (j ? steps[j - 1] : 'Elang') ? `${NILAI[REGU[j]][0]} tidak lebih besar, jadi terbaik tetap ${steps[j]}.` : `${NILAI[REGU[j]][0]} lebih besar: terbaik = ${REGU[j]}.`); return; }
      ctx.sound.tap(); j++;
      if (j < 4) { say(msg, 'info', `terbaik = ${r}.`); draw(); return; }
      champ.semafor = r; phase = 1; say(msg, 'info', 'Juara semafor: Melati. Sekarang mata lomba lain: ketuk juaranya.'); draw(); return;
    }
    if (phase > JUARA_LAIN.length) return;
    const [i, w] = JUARA_LAIN[phase - 1];
    if (r !== w) { oops(); say(msg, 'bad', `Cari nilai ${LOMBA[i]} terbesar.`); return; }
    ctx.sound.tap(); champ[LOMBA[i]] = r; phase++; draw();
    if (phase <= JUARA_LAIN.length) { say(msg, 'info', `Juara ${LOMBA[i]}: ${r}.`); return; }
    say(msg, '', 'Rajawali juara dua mata lomba. Anggrek tidak juara satu pun, tetapi nilainya merata sehingga peringkat 2.'); done();
  }
  draw();
  area.append(el('div', { class: 'pr37-dua' }, board, dict), msg);
}

// Misi 4a: ten names into envelopes.
function frekRound(area, ctx, { oops, done }) {
  const msg = msg37('frekuensi = {}. Seret setiap nama ke amplopnya, atau ke amplop baru bila belum ada.');
  const freq = new Map(); let k = 0;
  const board = el('div'); const out = layar();
  const draw = () => fill(board,
    el('div', { class: 'pr37-antre' }, el('small', null, k < 10 ? `nama ke-${k + 1} dari 10` : 'semua nama sudah masuk'), k < 10 ? el('div', { class: 'pr37-tag', 'data-drag': JU[k] }, JU[k]) : null, el('small', { class: 'pr37-sisa' }, JU.slice(k + 1).join(' · '))),
    el('div', { class: 'pr37-amplop-amplop' }, [...freq].map(([r, n]) => el('div', { class: 'pr37-amplop buka', 'data-drop': r }, el('span', { class: 'pr37-amplop-kepala' }, `📂 "${r}"`), el('b', { class: 'pr37-angka' }, String(n)))),
      el('div', { class: 'pr37-amplop baru', 'data-drop': 'baru' }, '➕ amplop baru')));
  const host = el('div', { class: 'pr37-tumpuk' }, board, out);
  dnd(host, (card, t) => {
    if (k >= 10) return; const name = card.dataset.drag; const d = t.closest('[data-drop]')?.dataset.drop;
    if (d === 'baru') { if (freq.has(name)) { oops(); shake(card); say(msg, 'bad', `Amplop "${name}" sudah ada; satu kunci hanya sekali.`); return; } freq.set(name, 1); }
    else if (d !== name) { oops(); shake(card); say(msg, 'bad', freq.has(name) ? `Itu amplop "${d}". Cari amplop "${name}".` : `Belum ada amplop "${name}": buat amplop baru.`); return; }
    else freq.set(name, freq.get(name) + 1);
    ctx.sound.tap(); k++; draw();
    if (k < 10) { say(msg, 'info', `${name}: ${freq.get(name)}.`); return; }
    play(out, run(FREK()).out, { end: () => { say(msg, '', 'Anggrek juara umum 4 kali. Kunci baru dibuat dengan nilai 1, kunci lama ditambah 1.'); done(); } });
  });
  draw();
  area.append(host, msg);
}

// Misi 4b: Rudi's KeyError, then the get line.
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg37('Rudi menulis satu baris saja. Nama pertama "Anggrek" datang, frekuensi masih kosong. Apa yang terjadi?');
  const lines = ['frekuensi = {}', 'for regu in juara_umum:', '    frekuensi[regu] = frekuensi[regu] + 1', 'print(frekuensi)'];
  let over = false;
  const opts = [['baru', '➕ Amplop baru berisi 1'], ['tambah', '+1 di amplop "Anggrek"'], ['err', "💥 KeyError: 'Anggrek'"]];
  const pick = (k) => {
    if (over) return;
    if (k !== 'err') { oops(); say(msg, 'bad', k === 'baru' ? 'Baris Rudi tidak membuat kunci baru: ia membaca frekuensi["Anggrek"] dulu.' : 'Belum ada amplop "Anggrek" untuk ditambah.'); return; }
    over = true; ctx.sound.good(); say(msg, 'info', 'frekuensi["Anggrek"] dibaca sebelum kuncinya ada. Ganti baris Rudi dengan get.'); setTimeout(fix, 2200);
  };
  area.append(el('div', { class: 'pr37-dua' }, codeView(lines, { warn: [2] }), el('div', { class: 'pr37-tumpuk' }, el('div', { class: 'pr37-tag diam' }, 'Anggrek'), el('div', { class: 'pr37-pilih' }, opts.map(([k, t]) => onTap(el('button', { class: 'pr37-opsi', type: 'button', 'data-k': k }, t), () => pick(k)))))), msg);
  function fix() {
    const out = layar();
    fill(area, el('div', { class: 'pr37-dua' }, tileSlots(ctx, { oops, msg, build: ['frekuensi = {}', 'for regu in juara_umum:', ['get', 1], 'print(frekuensi)'], tiles: GET_TILES,
      onFull: () => play(out, run(FREK('get')).out, { end: () => { say(msg, '', 'get(regu, 0) memberi 0 bila kunci belum ada. Satu baris menggantikan if–else.'); done(); } }) }), out), msg);
  }
}

// Labels with arrows: drag a label onto a list (or a new list), then append names.
function aliasBoard(ctx, { oops, msg, copy, done }) {
  const objs = [{ id: 'L1', items: ['Elang', 'Rajawali'], labels: ['regu_putra'] }, { id: 'L2', items: ['Melati', 'Anggrek'], labels: ['regu_putri'] }];
  let phase = 'label'; let k = 0;
  const board = el('div', { class: 'pr37-alias' });
  const codeBox = el('div');
  const lines = ['regu_putra = ["Elang", "Rajawali"]', 'regu_putri = ["Melati", "Anggrek"]', `semua_regu = regu_putra${copy ? '.copy()' : ''}`, 'for regu in regu_putri:', '    semua_regu.append(regu)'];
  const draw = () => {
    fill(codeBox, codeView(lines, { hl: phase === 'label' ? [2] : phase === 'append' ? [4] : [] }));
    fill(board, el('div', { class: 'pr37-antre' }, phase === 'label' ? el('div', { class: 'pr37-tag label', 'data-drag': 'semua_regu' }, '🏷️ semua_regu') : phase === 'append' ? el('div', { class: 'pr37-tag', 'data-drag': objs[1].items[k] }, objs[1].items[k]) : null),
      el('div', { class: 'pr37-objek-objek' }, objs.map((o) => el('div', { class: 'pr37-objek', 'data-drop': o.id }, el('div', { class: 'pr37-label-label' }, o.labels.map((l) => el('span', { class: 'pr37-label' }, `🏷️ ${l}`))), el('span', { class: 'pr37-panah' }, '↓'), el('div', { class: 'pr37-kotak-kotak' }, o.items.map((x, i) => el('span', { class: 'pr37-kotak' }, el('small', null, String(i)), el('b', null, `"${x}"`)))))),
        phase === 'label' ? el('div', { class: 'pr37-objek baru', 'data-drop': 'baru' }, '📦 list baru') : null));
  };
  const host = el('div', { class: 'pr37-dua' }, codeBox, board);
  dnd(host, (card, t) => {
    const d = t.closest('[data-drop]')?.dataset.drop;
    if (phase === 'label') {
      const want = copy ? 'baru' : 'L1';
      if (d !== want) { oops(); shake(card); say(msg, 'bad', copy ? '.copy() membuat list baru berisi anggota yang sama.' : d === 'baru' ? '= tidak menyalin list; ia menempelkan label kedua pada list yang sama.' : 'semua_regu = regu_putra: label ditempel pada list milik regu_putra.'); return; }
      if (copy) objs.push({ id: 'L3', items: [...objs[0].items], labels: ['semua_regu'] }); else objs[0].labels.push('semua_regu');
      phase = 'append'; ctx.sound.tap(); say(msg, 'info', 'A4–A5: semua_regu.append(regu). Seret setiap regu putri ke list yang ditunjuk semua_regu.'); draw(); return;
    }
    if (phase !== 'append') return;
    const o = objs.find((x) => x.id === d);
    if (!o || !o.labels.includes('semua_regu')) { oops(); shake(card); say(msg, 'bad', 'Ikuti panah label semua_regu.'); return; }
    o.items.push(card.dataset.drag); k++; ctx.sound.tap();
    if (k < 2) { say(msg, 'info', 'Tepat.'); draw(); return; }
    phase = 'end'; draw(); done(objs);
  });
  draw();
  return host;
}

// Misi 5a: the alias trap and its surprising print.
function aliasRound(area, ctx, { oops, done }) {
  const msg = msg37('A3: semua_regu = regu_putra. Seret label semua_regu ke tempat panahnya menunjuk.');
  area.append(aliasBoard(ctx, { oops, msg, copy: false, done: () => {
    say(msg, 'info', 'Tebak keluaran print("Lapangan A (putra):", regu_putra).');
    area.append(fillBoard(ctx, { oops, msg, chips: ["['Elang', 'Rajawali']", "['Elang', 'Rajawali', 'Melati', 'Anggrek']", "['Melati', 'Anggrek']"], want: ["['Elang', 'Rajawali', 'Melati', 'Anggrek']"],
      view: rowsView([['Lapangan A (putra): ', '_']]), hints: ['regu_putra menunjuk list yang sama dengan semua_regu, dan list itu sudah ditambah.'],
      done: () => { say(msg, '', 'Regu putri ikut masuk lapangan putra! Dua label, satu list: mengubah lewat satu label terlihat dari label lain.'); done(); } }));
    msg.remove(); area.append(msg);
  } }), msg);
}

// Misi 5b: fix with .copy(), replay, then the number example.
function salinRound(area, ctx, { oops, done }) {
  const msg = msg37('Ganti baris A3 supaya semua_regu mendapat list sendiri.');
  area.append(tileSlots(ctx, { oops, msg, build: ['regu_putra = ["Elang", "Rajawali"]', 'regu_putri = ["Melati", "Anggrek"]', ['copy', 0], 'for regu in regu_putri:', '    semua_regu.append(regu)'], tiles: COPY_TILES,
    onFull: () => { say(msg, 'info', 'Jalankan lagi: seret label semua_regu.'); setTimeout(replay, 1600); } }), msg);
  function replay() {
    fill(area, aliasBoard(ctx, { oops, msg, copy: true, done: () => { say(msg, 'info', 'regu_putra tetap [\'Elang\', \'Rajawali\']. Bagaimana dengan bilangan?'); setTimeout(angka, 2400); } }), msg);
  }
  function angka() {
    fill(area, el('div', { class: 'pr37-dua' }, codeView(ANGKA), fillBoard(ctx, { oops, msg, chips: ['5', '6', '0', '1'], want: ['5', '6'], view: rowsView([['print(a, b) → ', '_', ' ', '_']]),
      hints: ['b = b + 1 membuat bilangan baru untuk b; a tetap 5.', 'b = 5 + 1.'],
      done: () => { say(msg, '', 'Bilangan tidak bisa diubah isinya, jadi b = b + 1 membuat bilangan baru. Alias hanya terasa pada data yang bisa diubah, seperti list.'); done(); } })), msg);
  }
}

// Misi 6 and Bos: a nested lookup, then the P3K tiebreak.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg37('Ambil nilai pionering Elang pada hari kedua. Rakit ekspresinya dari kartu.');
  const hari = [{ semafor: 80, pionering: 75, sandi: 88 }, { semafor: 82, pionering: 79, sandi: 85 }, { semafor: 85, pionering: 81, sandi: 90 }];
  const tree = el('div', { class: 'pr37-pohon' }, el('b', null, 'kemah'), el('div', { class: 'pr37-cabang' }, el('span', { class: 'pr37-kunci' }, '"Elang"'), el('div', { class: 'pr37-cabang' },
    el('div', null, el('span', { class: 'pr37-kunci' }, '"anggota"'), ' [Adi, Bima, … 8 nama]'),
    el('div', null, el('span', { class: 'pr37-kunci' }, '"nilai"'), el('div', { class: 'pr37-kotak-kotak' }, hari.map((h, i) => el('span', { class: 'pr37-kotak lebar' }, el('small', null, `${i} · hari ${i + 1}`), el('b', null, Object.entries(h).map(([k, v]) => `${k} ${v}`).join(' · ')))))),
    el('div', null, el('span', { class: 'pr37-kunci' }, '"pelanggaran"'), ' 2'))));
  area.append(el('div', { class: 'pr37-dua' }, tree, tileSlots(ctx, { oops, msg, build: ['kemah', ['e', 1], ['n', 1], ['h', 1], ['p', 1]], tiles: KEMAH_TILES,
    onFull: () => { say(msg, 'info', 'kemah["Elang"]["nilai"][1]["pionering"] → 79. Misi Bos: penentu seri!'); setTimeout(seri, 2600); } })), msg);
  function seri() {
    say(msg, 'info', 'P3K Melati 83: Melati dan Anggrek sama 328. Jadikan nilai P3K anggota kedua tuple.');
    const out = layar();
    fill(area, el('div', { class: 'pr37-dua' }, tileSlots(ctx, { oops, msg, build: ['pasangan = []', 'for regu in total:', ['app', 1], 'pasangan.sort(reverse=True)', 'for posisi in range(len(pasangan)):', ['prt', 1]], tiles: SERI_TILES,
      onFull: () => play(out, run(PROG({ p3k: 83, rule: true })).out, { end: () => { say(msg, '', 'Total sama, lalu P3K dibandingkan: Anggrek 88 > Melati 83. Anggrek peringkat 2 karena nilainya, bukan namanya.'); done(); } }) }), out), msg);
  }
}

export default {
  id: 'sma-37-data-lomba',
  title: 'Data Lomba Pramuka',
  topic: 'List dan dictionary di Python: indeks, kunci, in, get, KeyError, tuple untuk mengurutkan, menghitung frekuensi, alias dan menyalin list, serta struktur data bersarang',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '⚜️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Ambil data nilai lomba dari list dan dictionary, susun peringkat dengan tuple, cari juara setiap mata lomba, hitung frekuensi juara umum, lalu temukan dan perbaiki bug alias.',
  extraModes: [
    { id: 'struktur', icon: '🗃️', label: 'Kotak Struktur Data', desc: 'List tampil sebagai kotak bernomor indeks dan dictionary sebagai kartu kunci–nilai; kotak yang dibaca atau diubah menyala', create: createStruktur },
    { id: 'alias', icon: '🏷️', label: 'Panah Alias', desc: 'Setiap variabel adalah label dengan panah ke objeknya. Bandingkan b = a dengan .copy()', create: createAlias },
    { id: 'peringkat', icon: '🏆', label: 'Pengurut Peringkat', desc: 'Tuple setiap regu sebelum dan sesudah diurutkan. Ubah nilai P3K Melati dan nyalakan P3K sebagai penentu', create: createPeringkat },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Perintah dan Tebakan', desc: 'Satu tim memilih perintah, tim berikutnya menebak isi struktur data sesudahnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pr37-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pr37-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD37[k];
        foe = el('div', { class: 'pr37-ceroboh' }, el('b', null, '📋 Panitia Ceroboh'), el('span', null, ulah));
        wrap.append(el('div', { class: 'pr37-kepala' }, misiHead(no, judul, tujuan, '⚜️'), foe, el('span', { class: 'pr37-jam' }, `⏰ upacara: ${10 - r} misi lagi`)), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Kekacauan dibereskan ✓'; next(ms); } });
      if (r === 0) { go('amplop', 1); amplopRound(area, ctx, fin(5000)); }
      else if (r === 1) { go('isi', 1); isiRound(area, ctx, fin(5000)); }
      else if (r === 2) { go('peringkat', 2); peringkatRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('seri', 2); seriRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('juara', 3); juaraRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('frek', 4); frekRound(area, ctx, fin(5500)); }
      else if (r === 6) { go('rudi', 4); rudiRound(area, ctx, fin(5500)); }
      else if (r === 7) { go('alias', 5); aliasRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('salin', 5); salinRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

function createStruktur(root, ctx) {
  const wrap = el('div', { class: 'act data-lomba' });
  root.append(wrap);
  const VERS = [['nilai', 'nilai lomba (1–16)', () => PROG(), null, {}], ['juara', 'juara mata lomba (17–24)', () => JUARA, JL, { show: ['nilai', 'juara_lomba'] }], ['frek', 'frekuensi (F1–F9)', () => FREK(), FL(), {}], ['rudi', 'frekuensi Rudi', () => FREK('rudi'), FL('rudi'), {}], ['get', 'frekuensi dengan get', () => FREK('get'), FL('get'), {}], ['alias', 'lapangan (A1–A7)', () => ALIAS(), AL(), {}], ['kemah', 'lomba kemah', () => [...KEMAH, 'x = kemah["Elang"]["nilai"][1]["pionering"]', 'kemah["Elang"]["pelanggaran"] = 3'], null, {}]];
  let ver = 'nilai'; let tr = null;
  const draw = () => { tr?.stop(); const v = VERS.find((x) => x[0] === ver); tr = tracer(v[2](), { labels: v[3], ...v[4] });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Kotak struktur data: kuning dibaca, hijau diubah'), el('div', { class: 'seg dg-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr); };
  draw();
}

function createAlias(root, ctx) {
  const wrap = el('div', { class: 'act data-lomba' });
  root.append(wrap);
  const VERS = [['', 'semua_regu = regu_putra', () => ALIAS(''), AL('')], ['copy', 'pakai .copy()', () => ALIAS('copy'), AL('copy')], ['list', 'pakai list()', () => ALIAS('list'), AL('list')], ['plus', 'pakai +', () => ALIAS('plus'), AL('plus')], ['angka', 'bilangan: a = 5, b = a', () => ANGKA, null], ['dict', 'dictionary: cadangan = total', () => SALIN(), null], ['dictc', 'dictionary dengan .copy()', () => SALIN(true), null]];
  let ver = ''; let tr = null;
  const draw = () => { tr?.stop(); const v = VERS.find((x) => x[0] === ver); tr = aliasTracer(v[2](), v[3], { onEnd: () => { const R = run(v[2]()); const same = aliasGroups(R.vars, ['regu']).some(([ns]) => ns.length > 1 && ver !== 'angka'); say(wrap.querySelector('.reveal'), same ? 'bad' : '', same ? 'Dua label menunjuk satu objek: mengubah lewat satu nama ikut mengubah yang lain.' : 'Setiap label menunjuk objeknya sendiri.'); } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Panah alias'), el('div', { class: 'seg dg-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr, el('p', { class: 'reveal info' }, 'Jalankan langkah demi langkah dan perhatikan panahnya.')); };
  draw();
}

function createPeringkat(root, ctx) {
  const wrap = el('div', { class: 'act data-lomba' });
  root.append(wrap);
  let p3k = 80; let rule = false;
  const draw = () => {
    const o = { p3k, rule }; const lines = PROG(o); const B = pasanganSebelum(o); const R = run(lines);
    const tot = (t) => t[0]; const ties = new Set(R.vars.pasangan.map(tot).filter((x, i, a) => a.indexOf(x) !== i));
    const col = (title, list, rank) => el('div', { class: 'dg-kolom' }, el('small', null, title), el('ol', { class: `dg-urut ${rank ? 'rank' : ''}` }, list.map((t) => el('li', { class: ties.has(tot(t)) ? 'seri' : '' }, box(t, 't', () => '')))));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pengurut peringkat'),
      el('div', { class: 'dg-atur' }, stepper(p3k, (x) => { p3k = x; draw(); }, { min: 60, max: 100, label: 'P3K Melati' }), el('div', { class: 'seg' }, [[false, 'urut total, lalu nama'], [true, 'P3K sebagai penentu']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${rule === v ? 'on' : ''}`, type: 'button' }, t), () => { rule = v; draw(); })))),
      pyCode(lines.slice(10), { cls: 'dg-kecil', hl: rule ? [2, 5] : [] }),
      el('div', { class: 'dg-dua' }, col('pasangan sebelum sort', B, false), col('sesudah sort(reverse=True)', R.vars.pasangan, true)),
      el('pre', { class: 'dg-keluaran' }, R.out.join('\n')),
      el('p', { class: 'reveal info' }, ties.size ? (rule ? 'Total sama: nilai P3K menentukan, baru nama bila P3K juga sama.' : 'Total sama: nama regu yang menentukan (abjad terbalik). Adilkah?') : 'Tidak ada total yang sama.'));
  };
  draw();
}

// Commands for the team mode: [code lines, expression to guess].
export const BASE = ['nilai = {"Elang": [85, 78, 90, 70], "Melati": [90, 70, 85, 80]}', 'regu_putra = ["Elang", "Rajawali"]', 'semua = regu_putra', 'skor = {"Elang": 323, "Melati": 325}'];
export const PERINTAH = [[['nilai["Melati"][3] = 83'], 'nilai["Melati"]'], [['regu_putra.append("Garuda")'], 'semua'], [['semua = semua + ["Kenari"]'], 'regu_putra'], [['skor["Anggrek"] = skor.get("Anggrek", 0) + 5'], 'skor'], [['skor["Melati"] = skor["Melati"] + 3'], 'skor'],
  [['cadangan = skor', 'cadangan["Elang"] = 0'], 'skor'], [['regu_putra.insert(0, "Kijang")'], 'semua'], [['nilai["Elang"].append(88)'], 'len(nilai["Elang"])'], [['x = nilai["Elang"]', 'x[0] = 100'], 'nilai["Elang"]'], [['salin = regu_putra.copy()', 'salin.append("Kancil")'], 'regu_putra'], [['semua.sort()'], 'regu_putra'], [['skor["Elang"] = sum(nilai["Elang"])'], 'skor']];
export const guess = (done, cmd, expr) => { const R = run([...BASE, ...done.flat(), ...cmd, `jawab = ${expr}`]); return R.error ? R.error.text : pyRepr(R.vars.jawab, true); };

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act data-lomba' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.min(8, Math.max(6, nT * 2)); const used = new Set(); const done = []; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Perintah dan Tebakan selesai', pts, again: () => pickTeams(wrap, 'Perintah dan Tebakan', start) }); return; }
      const boss = t % nT; const guesser = (t + 1) % nT;
      const offer = ctx.rand.shuffle(PERINTAH.map((_, i) => i).filter((i) => !used.has(i))).slice(0, 3);
      const state = run([...BASE, ...done.flat()]).vars;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1} memberi perintah`), el('div', { class: 'dg-struktur' }, ['nilai', 'regu_putra', 'semua', 'skor'].map((n) => el('div', { class: 'dg-var' }, el('span', { class: 'dg-nama' }, n), box(state[n], n, () => '')))),
        el('div', { class: 'seg dg-perintah' }, offer.map((i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, PERINTAH[i][0].join('\n')), () => { used.add(i); ctx.sound.tap(); ask(i); }))));
      function ask(i) {
        const [cmd, expr] = PERINTAH[i]; const right = guess(done, cmd, expr);
        const before = guess(done, [], expr); const others = offer.filter((k) => k !== i).map((k) => guess(done, PERINTAH[k][0], expr));
        let opts = [...new Set([right, before, ...others])];
        if (opts.length < 3) opts = [...new Set([...opts, ...(/^\d+$/.test(right) ? [String(Number(right) + 1), String(Number(right) - 1)] : [guess([], cmd, expr), pyRepr(run(BASE).vars[expr] ?? null)])])];
        opts = opts.slice(0, 4).sort();
        const msg = el('p', { class: 'reveal info' }, `Tim ${guesser + 1}: berapa isi ${expr} sesudahnya?`);
        wrap.replaceChildren(scoreBar(pts, guesser), el('p', { class: 'prompt' }, `Perintah Tim ${boss + 1}`), pyCode([...done.flat().slice(-4), ...cmd], { hl: cmd.map((_, k) => Math.min(4, done.flat().length) + k), cls: 'dg-kecil' }), el('p', { class: 'dg-ket' }, `Tebak: ${expr}`),
          el('div', { class: 'seg dg-tebak' }, opts.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => {
            const ok = o === right; if (ok) { pts[guesser]++; ctx.sound.good(); } else ctx.sound.bad();
            say(msg, ok ? '' : 'bad', ok ? `Tepat, Tim ${guesser + 1} +1.` : `Belum tepat: ${expr} = ${right}`); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); wrap.querySelector('.dg-tebak')?.remove();
            done.push(cmd); t++; setTimeout(step, 2600);
          }))), msg);
      }
    }
    step();
  }
  pickTeams(wrap, 'Perintah dan Tebakan', start);
}
