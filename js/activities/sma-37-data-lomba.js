// Data Lomba Pramuka — SMA/SMK (16–18 tahun), coding. Python lists and dicts:
// reading values, totals and a ranking via tuples, the tie broken by name,
// best team per event, counting with a dict (Rudi's KeyError and .get), the
// alias bug b = a with arrows to one list, copying, and a nested design.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyTracer, pyCode, stepper } from './smp-kit.js';
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
    const wrap = el('div', { class: 'act data-lomba' });
    root.append(wrap);
    const R = run(PROG()); const J = run(JUARA); const F = run(FREK());
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const ex = (src, wrong, why) => { const v = evalExpr(src); return [src, src, [...new Set([v, ...wrong])].sort(), v, why]; };
      const dataCode = () => pyCode(DATA(), { cls: 'dg-kecil' });
      if (r === 0) { wrap.append(dataCode()); rowsChoose(wrap, ctx, { prompt: 'Mengambil data: hasil setiap ekspresi', cls: 'dg-isi', info: 'nilai["Melati"] → [90, 70, 85, 80] sudah diisi.', done: next, rows: [
        ex('nilai["Melati"][2]', ['90', '70', '80'], 'Indeks mulai dari 0: anggota ketiga.'), ex('mata_lomba[2]', ["'pionering'", "'P3K'", 'IndexError: list index out of range']), ex('nilai["Rajawali"][-1]', ['80', '75', 'IndexError: list index out of range'], 'Indeks −1 adalah anggota terakhir.'),
        ex('mata_lomba.index("P3K")', ['4', "'P3K'", '-1']), ex('len(nilai)', ['16', '5', '20'], 'Banyak kunci dictionary.')] }); }
      else if (r === 1) { wrap.append(dataCode()); rowsChoose(wrap, ctx, { prompt: 'Mengambil data: lanjutan', cls: 'dg-isi', rows: [
        ex('list(nilai)', ['[[85, 78, 90, 70], [80, 92, 75, 91], [90, 70, 85, 80], [75, 85, 80, 88]]', '[323, 338, 325, 328]'], 'list(dict) berisi kuncinya, sesuai urutan penulisan.'), ex('"Elang" in nilai', ['False', "KeyError: 'Elang'"]), ex('85 in nilai', ['True', 'KeyError: 85']),
        ex('max(nilai["Anggrek"])', ['85', '75', "'Anggrek'"]), ex('nilai["Garuda"]', ['None', '0', 'IndexError: list index out of range'], 'Kunci "Garuda" tidak ada.'),
        ['w', 'Mengapa 85 in nilai tidak True?', ['in pada dictionary hanya memeriksa kunci, dan 85 bukan kunci', 'karena 85 ada di dua regu', 'karena in hanya untuk list', 'karena 85 harus ditulis "85"'], 'in pada dictionary hanya memeriksa kunci, dan 85 bukan kunci']], done: next }); }
      else if (r === 2) { const tr = tracer(PROG(), { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Total dan pasangan', cls: 'dg-isi', rows: [
        ['a', 'Isi total setelah baris 10', [pyRepr(R.vars.total), "{'Elang': 70, 'Rajawali': 91, 'Melati': 80, 'Anggrek': 88}", "{'Elang': 323}", '[323, 338, 325, 328]'], pyRepr(R.vars.total)],
        ['b', 'pasangan sebelum baris 14', [pyRepr(pasanganSebelum()), "[('Elang', 323), ('Rajawali', 338), ('Melati', 325), ('Anggrek', 328)]", pyRepr(R.vars.pasangan)].sort(), pyRepr(pasanganSebelum())],
        ['c', 'pasangan sesudah baris 14', [pyRepr(R.vars.pasangan), pyRepr(pasanganSebelum()), "[(323, 'Elang'), (325, 'Melati'), (328, 'Anggrek'), (338, 'Rajawali')]"].sort(), pyRepr(R.vars.pasangan), 'reverse=True: dari total terbesar.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program nilai lomba: lihat kotak struktur datanya'), tr); }
      else if (r === 3) { const B = run(PROG({ balik: true })); wrap.append(pyCode(PROG().slice(11), { cls: 'dg-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Peringkat', cls: 'dg-isi', rows: [
          ['c', 'Keluaran baris 15–16', [R.out.join(' / '), B.out.join(' / '), '1 Rajawali 338 / 2 Melati 325 / 3 Anggrek 328 / 4 Elang 323', '0 Rajawali 338 / 1 Anggrek 328 / 2 Melati 325 / 3 Elang 323'], R.out.join(' / ')],
          ['d', 'Mengapa (total[regu], regu), bukan (regu, total[regu])?', ['tuple diurutkan menurut anggota pertama, jadi total harus di depan', 'tuple tidak bisa berisi teks di depan', 'agar print lebih pendek'], 'tuple diurutkan menurut anggota pertama, jadi total harus di depan'],
          ['e', 'Bila ditulis terbalik, keluarannya', [B.out.join(' / '), R.out.join(' / '), '1 Anggrek 328 / 2 Elang 323 / 3 Melati 325 / 4 Rajawali 338'], B.out.join(' / '), 'Urut menurut nama secara terbalik, jelas bukan peringkat.']], done: next }); }
      else if (r === 4) { const E = run(PROG({ p3k: 83 })); const second = E.out[1].split(' ')[1];
        wrap.append(el('p', { class: 'dg-ket' }, 'Nilai P3K Melati menjadi 83, jadi total Melati = total Anggrek = 328'));
        rowsChoose(wrap, ctx, { prompt: 'Total sama: siapa di peringkat 2?', cls: 'dg-isi', rows: [
          ['p', 'Peringkat 2 menurut program', ['Melati', 'Anggrek', 'Rajawali', 'keduanya'], second],
          ['m', 'Mengapa?', ['tuple (328, …) sama, lalu nama dibandingkan; dengan reverse=True "Melati" di depan "Anggrek"', 'Melati ditulis lebih dulu di nilai', 'nilai P3K Melati lebih tinggi'], 'tuple (328, …) sama, lalu nama dibandingkan; dengan reverse=True "Melati" di depan "Anggrek"'],
          ['a', 'Apakah adil?', ['tidak: peringkat ditentukan abjad nama regu', 'ya: abjad selalu adil', 'ya: Melati memang lebih baik'], 'tidak: peringkat ditentukan abjad nama regu']], done: next }); }
      else if (r === 5) { const tr = tracer(JUARA, { labels: JL, show: ['nilai', 'juara_lomba'], onEnd: () => setTimeout(then(() => { const t0 = jejakTerbaik(0).join(' · ');
        rowsChoose(wrap, ctx, { prompt: 'Juara setiap mata lomba', cls: 'dg-isi', rows: [
          ['a', 'i = 0: terbaik setelah Elang · Rajawali · Melati · Anggrek', [t0, 'Elang · Rajawali · Melati · Anggrek', 'Elang · Elang · Melati · Anggrek', 'Elang · Rajawali · Rajawali · Rajawali'], t0, '80 < 85, 90 > 85, 75 < 90.'],
          ['b', 'Keluaran baris 24', [J.out[0], "{'semafor': 'Melati', 'pionering': 'Rajawali', 'sandi': 'Elang', 'P3K': 'Anggrek'}", "{'semafor': 'Elang', 'pionering': 'Rajawali', 'sandi': 'Elang', 'P3K': 'Rajawali'}", "{'Melati': 'semafor', 'Rajawali': 'P3K', 'Elang': 'sandi'}"].sort(), J.out[0]],
          ['c', 'Juara di dua mata lomba', ['Rajawali', 'Melati', 'Elang', 'Anggrek'], 'Rajawali'],
          ['d', 'Tidak juara satu pun tetapi masuk dua besar', ['Anggrek, karena nilainya merata', 'Elang', 'Melati', 'tidak ada'], 'Anggrek, karena nilainya merata']], done: next }); }), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Juara setiap mata lomba (baris 17–24)'), tr); }
      else if (r === 6) { const tr = tracer(FREK(), { labels: FL(), show: ['frekuensi'], onEnd: () => setTimeout(then(() => { const four = [1, 2, 3, 4].map((k) => pyRepr(run([...FREK().slice(0, 3), `for regu in juara_umum[:${k}]:`, ...FREK().slice(4, 8)]).vars.frekuensi)); const four2 = four.join(' → ');
        rowsChoose(wrap, ctx, { prompt: 'Menghitung frekuensi', cls: 'dg-isi', rows: [
          ['a', 'Isi frekuensi setelah 1, 2, 3, 4 putaran', [four2, "{'Anggrek': 1} → {'Elang': 1} → {'Anggrek': 2} → {'Rajawali': 1}", "{'Anggrek': 1} → {'Anggrek': 1, 'Elang': 1} → {'Anggrek': 1, 'Elang': 1, 'Anggrek': 2} → {'Anggrek': 2, 'Elang': 1, 'Rajawali': 1}", "{'Anggrek': 0} → {'Anggrek': 0, 'Elang': 0} → {'Anggrek': 1, 'Elang': 0} → {'Anggrek': 1, 'Elang': 0, 'Rajawali': 0}"].sort(), four2, 'Satu kunci hanya ada sekali; nilainya bertambah.'],
          ['b', 'Keluaran baris F9', [F.out[0], "{'Anggrek': 4, 'Elang': 3, 'Melati': 1, 'Rajawali': 2}", "{'Anggrek': 4, 'Rajawali': 2, 'Elang': 3, 'Melati': 1}", "{'Anggrek': 3, 'Elang': 3, 'Rajawali': 2, 'Melati': 1}"].sort(), F.out[0], 'Urutan kunci mengikuti kemunculan pertama.']], done: next }); }), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Juara umum sepuluh tahun terakhir'), tr); }
      else if (r === 7) { const U = run(FREK('rudi')); const G = run(FREK('get'));
        wrap.append(pyCode(FREK('rudi'), { labels: FL('rudi'), warn: [4], cls: 'dg-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Rudi menghapus F5, F7, F8', cls: 'dg-isi', rows: [
          ['c', 'Putaran pertama', [`berhenti: ${U.error.text}`, "frekuensi menjadi {'Anggrek': 1}", "frekuensi menjadi {'Anggrek': 0}", 'berhenti: IndexError: list index out of range'], `berhenti: ${U.error.text}`, 'frekuensi["Anggrek"] dibaca sebelum kunci itu ada.'],
          ['d', 'Satu baris pengganti F5–F8', ['frekuensi[regu] = frekuensi.get(regu, 0) + 1', 'frekuensi[regu] = frekuensi.get(regu) + 1', 'frekuensi.get(regu, 0) = frekuensi[regu] + 1', 'frekuensi[regu] = frekuensi[regu].get(0) + 1'], 'frekuensi[regu] = frekuensi.get(regu, 0) + 1', `get memberi 0 bila kunci belum ada. Hasilnya sama: ${G.out[0]}`]], done: next }); }
      else if (r === 8) { const A = run(ALIAS()); const tr = aliasTracer(ALIAS(), AL(), { onEnd: () => setTimeout(then(() => { const out = A.out.join(' / ');
        wrap.append(aliasView(A.vars, ['regu']));
        rowsChoose(wrap, ctx, { prompt: 'Bug alias', cls: 'dg-isi', rows: [
          ['a', 'Keluaran A6 dan A7', [out, run(ALIAS('copy')).out.join(' / '), "Lapangan A (putra): ['Elang', 'Rajawali'] / Semua regu: ['Melati', 'Anggrek']"], out, 'Regu putri ikut masuk ke lapangan putra.'],
          ['b', 'Panah setelah A5', ['regu_putra dan semua_regu menunjuk satu list; regu_putri list sendiri', 'setiap variabel menunjuk list sendiri', 'semua_regu menunjuk regu_putri', 'ketiganya menunjuk satu list'], 'regu_putra dan semua_regu menunjuk satu list; regu_putri list sendiri', 'A3 hanya menempelkan nama kedua pada list yang sama.']], done: next }); }), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Pembagian lapangan: perhatikan panahnya'), tr); }
      else { const C = run(ALIAS('copy')); const N = run(ANGKA);
        wrap.append(pyCode(ALIAS(), { labels: AL(), warn: [2], cls: 'dg-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Perbaiki baris A3', cls: 'dg-isi', rows: [
          ['c1', 'Cara 1 (method)', ['semua_regu = regu_putra.copy()', 'semua_regu = regu_putra.append()', 'semua_regu == regu_putra', 'semua_regu = regu_putra[0]'], 'semua_regu = regu_putra.copy()', `Keluaran A6 menjadi ${C.out[0]}`],
          ['c2', 'Cara 2 (fungsi bawaan)', ['semua_regu = list(regu_putra)', 'semua_regu = len(regu_putra)', 'semua_regu = str(regu_putra)', 'semua_regu = regu_putra()'], 'semua_regu = list(regu_putra)', 'list() membuat list baru berisi anggota yang sama.'],
          ['d', 'a = 5, b = a, b = b + 1. Nilai a', [String(N.vars.a), String(N.vars.b), '0', 'galat'], String(N.vars.a)],
          ['w', 'Mengapa tidak terjadi alias?', ['b = b + 1 membuat bilangan baru 6; bilangan tidak bisa diubah isinya', 'Python menyalin semua bilangan', 'karena a ditulis lebih dulu'], 'b = b + 1 membuat bilangan baru 6; bilangan tidak bisa diubah isinya', 'Alias hanya terasa pada data yang bisa diubah, seperti list.']],
          done: then(() => { const K = run([...KEMAH, 'x = kemah["Elang"]["nilai"][1]["pionering"]']); const T = run(PROG({ p3k: 83, rule: true }));
            wrap.append(pyCode(KEMAH, { cls: 'dg-kecil' }));
            rowsChoose(wrap, ctx, { prompt: 'Rancangan lomba kemah dan Tantangan', cls: 'dg-isi', rows: [
              ['1', 'Nilai pionering Elang hari kedua', ['kemah["Elang"]["nilai"][1]["pionering"]', 'kemah["Elang"]["nilai"][2]["pionering"]', 'kemah["nilai"]["Elang"][1]["pionering"]', 'kemah["Elang"]["pionering"][1]'], 'kemah["Elang"]["nilai"][1]["pionering"]', `Hasilnya ${K.vars.x}. Hari kedua berindeks 1.`],
              ['2', 'Banyak anggota Melati', ['len(kemah["Melati"]["anggota"])', 'len(kemah["Melati"])', 'kemah["Melati"]["anggota"].len()', 'len(kemah)'], 'len(kemah["Melati"]["anggota"])'],
              ['13', 'Tantangan: baris 13', ['pasangan.append((total[regu], nilai[regu][3], regu))', 'pasangan.append((nilai[regu][3], total[regu], regu))', 'pasangan.append((total[regu], regu, nilai[regu][3]))'], 'pasangan.append((total[regu], nilai[regu][3], regu))', 'Urut menurut total, lalu P3K, lalu nama.'],
              ['16', 'Tantangan: baris 16 dan keluarannya (P3K Melati 83)', [`pasangan[posisi][2] · ${T.out.join(' / ')}`, `pasangan[posisi][1] · ${T.out.join(' / ')}`, `pasangan[posisi][2] · ${run(PROG({ p3k: 83 })).out.join(' / ')}`], `pasangan[posisi][2] · ${T.out.join(' / ')}`, 'Anggrek kini di peringkat 2 karena P3K-nya 88.']], done: next }); }) }); }
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
