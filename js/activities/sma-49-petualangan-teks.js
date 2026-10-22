// Permainan Petualangan Teks — SMA/SMK (16–18 tahun), coding. A text adventure
// as a state machine: a transition dictionary, the game loop, case-sensitive
// commands (version 1) and .strip().lower() (version 2), Dodi's KeyError, the
// trap room, a locked gate, and maps that cannot be won. Every session is run by
// the worksheet program in mini-py with the commands fed to input().

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, pyTracer } from './smp-kit.js';
import { runPy, pyRepr, PyError } from './mini-py.js';

export const V1 = ['transisi = {', '    "pos": {"utara": "persemaian"},', '    "persemaian": {"selatan": "pos", "utara": "gua", "timur": "sungai"},', '    "gua": {"selatan": "persemaian"},', '    "sungai": {"barat": "persemaian", "utara": "bukit", "timur": "air terjun"},', '    "air terjun": {},', '    "bukit": {"selatan": "sungai"},', '}', 'barang = {"persemaian": "bibit", "gua": "senter"}', 'ruang = "pos"', 'tas = []', 'while True:', '    print("Kamu di", ruang)', '    if ruang == "bukit" and "bibit" in tas:', '        print("Bibit tertanam. Kamu menang!")', '        break', '    perintah = input("> ")', '    if perintah in transisi[ruang]:', '        ruang = transisi[ruang][perintah]', '    elif perintah == "ambil" and ruang in barang:', '        tas.append(barang[ruang])', '        del barang[ruang]', '    else:', '        print("Tidak bisa.")'];
export const V2 = ['transisi = {', '    "pos": {"utara": "persemaian"},', '    "persemaian": {"selatan": "pos", "utara": "gua", "timur": "sungai"},', '    "gua": {"selatan": "persemaian"},', '    "sungai": {"barat": "persemaian", "utara": "bukit", "timur": "air terjun"},', '    "air terjun": {"barat": "sungai"},', '    "bukit": {"selatan": "sungai"},', '}', 'barang = {"persemaian": "bibit", "gua": "senter", "air terjun": "kunci"}', 'terkunci = {"bukit": "kunci"}', 'ruang = "pos"', 'tas = []', 'while True:', '    print("Kamu di", ruang)', '    if ruang == "bukit" and "bibit" in tas:', '        print("Bibit tertanam. Kamu menang!")', '        break', '    perintah = input("> ").strip().lower()', '    if perintah in transisi[ruang]:', '        tujuan = transisi[ruang][perintah]', '        if tujuan in terkunci and terkunci[tujuan] not in tas:', '            print("Gerbang terkunci. Kamu perlu", terkunci[tujuan])', '        else:', '            ruang = tujuan', '    elif perintah == "ambil" and ruang in barang:', '        tas.append(barang[ruang])', '        del barang[ruang]', '    else:', '        print("Tidak bisa.")'];
export const V2_KOSONG = V2.map((x, i) => (i === 20 ? '        if tujuan in terkunci and ..............................:' : x));
export const SESI = ['utara', 'utara', 'ambil', 'selatan', 'timur', 'utara', 'selatan', 'barat', 'ambil', 'Timur', 'timur', 'utara'];
export const BUNTU = ['def ruang_buntu(transisi, tujuan):', '    hasil = []', '    for r in transisi:', '        if len(transisi[r]) == 0 and r != tujuan:', '            hasil.append(r)', '    return hasil', 'print(ruang_buntu(transisi, "bukit"))'];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));
const ARAH = ['utara', 'selatan', 'timur', 'barat'];

// Maps as data: rooms, exits, items, gates, start, goal and the item needed to win.
const salin = (o) => JSON.parse(JSON.stringify(o));
export const PETA = {
  v1: { nama: 'Versi 1', kode: 'v1', ruang: ['pos', 'persemaian', 'gua', 'sungai', 'air terjun', 'bukit'], jalan: { pos: { utara: 'persemaian' }, persemaian: { selatan: 'pos', utara: 'gua', timur: 'sungai' }, gua: { selatan: 'persemaian' }, sungai: { barat: 'persemaian', utara: 'bukit', timur: 'air terjun' }, 'air terjun': {}, bukit: { selatan: 'sungai' } }, barang: { persemaian: 'bibit', gua: 'senter' }, gerbang: {}, awal: 'pos', tujuan: 'bukit', syarat: 'bibit' },
  v2: { nama: 'Versi 2 (gerbang)', kode: 'v2', ruang: ['pos', 'persemaian', 'gua', 'sungai', 'air terjun', 'bukit'], jalan: { pos: { utara: 'persemaian' }, persemaian: { selatan: 'pos', utara: 'gua', timur: 'sungai' }, gua: { selatan: 'persemaian' }, sungai: { barat: 'persemaian', utara: 'bukit', timur: 'air terjun' }, 'air terjun': { barat: 'sungai' }, bukit: { selatan: 'sungai' } }, barang: { persemaian: 'bibit', gua: 'senter', 'air terjun': 'kunci' }, gerbang: { bukit: 'kunci' }, awal: 'pos', tujuan: 'bukit', syarat: 'bibit' },
  riska: { nama: 'Peta Riska', kode: 'gen', ruang: ['pos', 'persemaian', 'gua', 'sungai', 'air terjun', 'bukit', 'rawa', 'semak'], jalan: { pos: { utara: 'persemaian' }, persemaian: { selatan: 'pos', utara: 'gua', timur: 'sungai' }, gua: { selatan: 'persemaian' }, sungai: { barat: 'persemaian', utara: 'bukit', timur: 'air terjun', selatan: 'rawa' }, 'air terjun': { barat: 'sungai' }, bukit: { selatan: 'sungai' }, rawa: { timur: 'semak' }, semak: { barat: 'rawa' } }, barang: { persemaian: 'bibit', gua: 'senter' }, gerbang: {}, awal: 'pos', tujuan: 'bukit', syarat: 'bibit' },
  rudi: { nama: 'Kunci di bukit (Rudi)', kode: 'gen', ruang: ['pos', 'persemaian', 'gua', 'sungai', 'air terjun', 'bukit'], jalan: { pos: { utara: 'persemaian' }, persemaian: { selatan: 'pos', utara: 'gua', timur: 'sungai' }, gua: { selatan: 'persemaian' }, sungai: { barat: 'persemaian', utara: 'bukit', timur: 'air terjun' }, 'air terjun': { barat: 'sungai' }, bukit: { selatan: 'sungai' } }, barang: { persemaian: 'bibit', gua: 'senter', bukit: 'kunci' }, gerbang: { bukit: 'kunci' }, awal: 'pos', tujuan: 'bukit', syarat: 'bibit' },
};
const q = (s) => JSON.stringify(s);
// Python source for a map: the worksheet versions exactly, other maps in the shape of version 2.
export function kodePeta(m) {
  if (m.kode === 'v1') return V1; if (m.kode === 'v2') return V2;
  const ada = m.ruang.filter((r) => m.jalan[r]);
  return ['transisi = {', ...ada.map((r) => `    ${q(r)}: {${ARAH.filter((a) => m.jalan[r][a]).map((a) => `${q(a)}: ${q(m.jalan[r][a])}`).join(', ')}},`), '}', `barang = {${Object.entries(m.barang).map(([r, b]) => `${q(r)}: ${q(b)}`).join(', ')}}`, `terkunci = {${Object.entries(m.gerbang).map(([r, b]) => `${q(r)}: ${q(b)}`).join(', ')}}`, `ruang = ${q(m.awal)}`, 'tas = []', 'while True:', '    print("Kamu di", ruang)',
    m.syarat ? `    if ruang == ${q(m.tujuan)} and ${q(m.syarat)} in tas:` : `    if ruang == ${q(m.tujuan)}:`, '        print("Kamu menang!")', '        break', ...V2.slice(17)];
}
// Run a program with these commands; when they run out the program is waiting for the next one.
export function jalankan(lines, cmds, limit = 20000) {
  const qq = [...cmds]; let dipakai = 0;
  const R = runPy(lines, { limit, builtins: { input: () => { if (!qq.length) throw new PyError('Menunggu', 'menunggu perintah', null); dipakai++; return qq.shift(); } } });
  const err = R.error && R.error.type !== 'Menunggu' ? R.error : null;
  return { out: R.out, vars: R.vars, error: err, menunggu: R.error?.type === 'Menunggu', selesai: !R.error, dipakai };
}
// A session as a log: the output that follows each command.
export function sesi(lines, cmds) {
  const log = []; let prev = 0;
  for (let k = 0; k <= cmds.length; k++) {
    const R = jalankan(lines, cmds.slice(0, k)); if (k > 0) log.push({ cmd: cmds[k - 1], out: R.out.slice(prev) }); else log.push({ cmd: null, out: R.out });
    prev = R.out.length; if (!R.menunggu) { log.at(-1).akhir = R; return log; }
    if (k === cmds.length) log.at(-1).akhir = R;
  }
  return log;
}
// Analysis: rooms without exits, rooms that cannot reach the goal, and the shortest winning commands.
export const buntu = (m) => m.ruang.filter((r) => r !== m.tujuan && !Object.keys(m.jalan[r] || {}).length);
export function tidakSampai(m) {
  return m.ruang.filter((r) => { const seen = new Set([r]); const qq = [r]; while (qq.length) { const s = qq.shift(); if (s === m.tujuan) return false; for (const t of Object.values(m.jalan[s] || {})) if (!seen.has(t)) { seen.add(t); qq.push(t); } } return true; });
}
export function terpendek(m, lower = m.kode !== 'v1') {
  const key = (r, tas) => `${r}|${[...tas].sort().join(',')}`; const start = { r: m.awal, tas: [], cmds: [] }; const seen = new Set([key(m.awal, [])]); const qq = [start];
  while (qq.length) {
    const s = qq.shift(); if (s.r === m.tujuan && (!m.syarat || s.tas.includes(m.syarat))) return s.cmds;
    const opts = [];
    for (const a of ARAH) { const t = m.jalan[s.r]?.[a]; if (t && !(m.gerbang[t] && !s.tas.includes(m.gerbang[t]))) opts.push({ r: t, tas: s.tas, cmds: [...s.cmds, a] }); }
    const b = m.barang[s.r]; if (b && !s.tas.includes(b)) opts.push({ r: s.r, tas: [...s.tas, b], cmds: [...s.cmds, 'ambil'] });
    for (const o of opts) { const k = key(o.r, o.tas); if (!seen.has(k)) { seen.add(k); qq.push(o); } }
    if (s.cmds.length > 60) break;
  }
  void lower; return null;
}

// Room diagram laid out by direction (utara up, timur right), with trap and unreachable marks.
const GER = { utara: [0, -1], selatan: [0, 1], timur: [1, 0], barat: [-1, 0] };
export function diagram(m, { kini = null, sorot = [], cls = '' } = {}) {
  const pos = {}; const used = new Set(); const put = (r, x, y) => { let k = 0; let [a, b] = [x, y]; while (used.has(`${a},${b}`)) { k++; [a, b] = [x + (k % 2 ? 1 : -1) * Math.ceil(k / 2), y + (k > 2 ? 1 : 0)]; } pos[r] = [a, b]; used.add(`${a},${b}`); };
  if (m.ruang.includes(m.awal)) put(m.awal, 0, 0); const qq = [m.awal];
  while (qq.length) { const s = qq.shift(); for (const a of ARAH) { const t = m.jalan[s]?.[a]; if (t && !pos[t] && m.ruang.includes(t)) { put(t, pos[s][0] + GER[a][0], pos[s][1] + GER[a][1]); qq.push(t); } } for (const r of m.ruang) for (const a of ARAH) if (m.jalan[r]?.[a] === s && !pos[r]) { put(r, pos[s][0] - GER[a][0], pos[s][1] - GER[a][1]); qq.push(r); } }
  let sisa = 0; const ys = Object.values(pos).map((p) => p[1]); const maxY = ys.length ? Math.max(...ys) : 0; for (const r of m.ruang) if (!pos[r]) put(r, sisa++, maxY + 1);
  const xs = Object.values(pos).map((p) => p[0]); const ys2 = Object.values(pos).map((p) => p[1]); const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys2), Math.max(...ys2)];
  const W = x1 - x0 + 1; const H = y1 - y0 + 1; const cx = (r) => ((pos[r][0] - x0 + 0.5) / W) * 100; const cy = (r) => ((pos[r][1] - y0 + 0.5) / H) * 100;
  const B = new Set(buntu(m)); const T = new Set(tidakSampai(m));
  const garis = []; for (const r of m.ruang) for (const a of ARAH) { const t = m.jalan[r]?.[a]; if (!t || !pos[t]) continue; const balik = Object.values(m.jalan[t] || {}).includes(r); if (balik && r > t) continue; garis.push(`<line x1="${cx(r)}" y1="${cy(r)}" x2="${cx(t)}" y2="${cy(t)}" class="${balik ? '' : 'satu'}" ${balik ? '' : 'marker-end="url(#tx-panah)"'}/>`); }
  const svg = el('div', { class: 'tx-garis' }); svg.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="tx-panah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>${garis.join('')}</svg>`;
  const node = (r) => el('div', { class: `tx-ruang ${r === kini ? 'kini' : ''} ${r === m.tujuan ? 'tujuan' : ''} ${r === m.awal ? 'awal' : ''} ${B.has(r) ? 'buntu' : T.has(r) ? 'jebak' : ''} ${sorot.includes(r) ? 'sorot' : ''}`, style: { left: `${cx(r)}%`, top: `${cy(r)}%` } }, el('b', null, r), m.barang[r] ? el('small', null, `🎒 ${m.barang[r]}`) : null, m.gerbang[r] ? el('small', null, `🔒 ${m.gerbang[r]}`) : null);
  return el('div', { class: `tx-diagram ${cls}`, style: { aspectRatio: `${Math.max(1.4, W * 1.25)} / ${H}` } }, svg, ...m.ruang.map(node));
}
const legenda = () => el('p', { class: 'tx-ket' }, '🟥 ruang buntu · 🟧 tidak bisa mencapai tujuan · ⭐ tujuan');
const opsi = (right, pool) => [right, ...[...new Set(pool)].filter((x) => x !== right)].slice(0, 4);

export default {
  id: 'sma-49-petualangan-teks',
  title: 'Permainan Petualangan Teks',
  topic: 'Mesin keadaan dalam kode: dictionary transisi, perulangan permainan, normalisasi masukan, ruang jebakan, gerbang berkunci, dan peta yang tidak bisa dimenangkan',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Baca peta Hutan Pendidikan Wanasari dari kode, telusuri satu sesi permainan, temukan ruang jebakan, tambahkan gerbang berkunci, lalu rancang petualanganmu sendiri.',
  extraModes: [
    { id: 'main', icon: '🗺️', label: 'Permainan dari Tabel', desc: 'Isi tabel ruang, arah, barang, dan gerbang, lalu mainkan permainannya; ruang buntu dan jebakan diberi tanda', create: createPlay },
    { id: 'telusur', icon: '🔎', label: 'Penelusur', desc: 'Setiap perintah menyorot baris kode yang dijalankan beserta isi ruang, tas, dan barang', create: createTrace },
    { id: 'giliran', icon: '🎲', label: 'Main Peta Tim Lain', desc: 'Satu tim merancang peta, tim lain memainkannya dengan perintah sesedikit mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act petualangan' });
    root.append(wrap);
    const LOG = sesi(V1, SESI);
    const step = (i) => { const e = LOG[i + 1]; const R = jalankan(V1, SESI.slice(0, i + 1)); return { ruang: R.vars.ruang, tas: pyRepr(R.vars.tas), lain: e.out.filter((x) => !x.startsWith('Kamu di')).join(' ') || '—' }; };
    const rowFor = (i) => { const s = step(i); const right = `${s.ruang} · ${s.tas} · ${s.lain}`; const p = i ? step(i - 1) : { ruang: 'pos', tas: '[]' };
      const alt = [`${p.ruang} · ${s.tas} · ${s.lain}`, `${s.ruang} · ${p.tas} · ${s.lain}`, `${s.ruang} · ${s.tas} · ${s.lain === '—' ? 'Tidak bisa.' : '—'}`, `${PETA.v1.jalan[s.ruang] ? Object.values(PETA.v1.jalan[s.ruang])[0] : s.ruang} · ${s.tas} · ${s.lain}`];
      return [`p${i}`, `${i + 1}. ${SESI[i]}`, opsi(right, alt), right]; };
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        const R = runPy([...V1.slice(0, 11), 'a = transisi["sungai"]["utara"]', 'b = transisi["gua"]', 'c = "barat" in transisi["pos"]', 'd = len(transisi["persemaian"])']).vars;
        wrap.append(el('div', { class: 'tx-dua' }, pyCode(V1.slice(0, 11), { labels: lab(1, 11), cls: 'tx-kecil' }), diagram(PETA.v1)));
        rowsChoose(wrap, ctx, { prompt: 'Membaca peta dari kode', cls: 'tx-isi tx-mono', rows: [
          ['a', 'transisi["sungai"]["utara"]', opsi(pyRepr(R.a, true), ["'air terjun'", "'persemaian'", "KeyError: 'utara'"]), pyRepr(R.a, true)],
          ['b', 'transisi["gua"]', opsi(pyRepr(R.b, true), ["{'utara': 'persemaian'}", "'persemaian'", '{}']), pyRepr(R.b, true)],
          ['c', '"barat" in transisi["pos"]', ['True', 'False'], pyRepr(R.c)],
          ['d', 'len(transisi["persemaian"])', ['1', '2', '3', '4'], pyRepr(R.d)]], done: next });
      }
      else if (r === 1) {
        wrap.append(diagram(PETA.v1, { kini: 'pos' }));
        rowsChoose(wrap, ctx, { prompt: 'Permainan sebagai mesin keadaan (seperti automata sma-17)', cls: 'tx-isi', rows: [
          ['awal', 'Keadaan awal', ['pos', 'bukit', 'persemaian', 'tas kosong'], 'pos'],
          ['masuk', 'Masukan', ['perintah yang diketik', 'isi tas', 'nama ruang', 'barang'], 'perintah yang diketik'],
          ['tabel', 'Tabel transisi', ['dictionary transisi', 'list tas', 'dictionary barang', 'perulangan while'], 'dictionary transisi'],
          ['terima', 'Keadaan terima', ['bukit dengan bibit di tas', 'bukit', 'persemaian', 'air terjun'], 'bukit dengan bibit di tas'],
          ['cukup', 'Apakah ruang saja cukup?', ['tidak: keadaan lengkapnya ruang, isi tas, dan barang yang tersisa', 'ya, ruang sudah cukup', 'tidak: perlu jam juga', 'ya, karena tas selalu kosong'], 'tidak: keadaan lengkapnya ruang, isi tas, dan barang yang tersisa']], done: next });
      }
      else if (r === 2 || r === 3) {
        const idx = r === 2 ? [2, 3, 4, 5, 6] : [7, 8, 9, 10, 11]; const n = LOG.reduce((a, e) => a + e.out.filter((x) => x.startsWith('Kamu di')).length, 0);
        wrap.append(el('div', { class: 'tx-dua' }, pyCode(V1.slice(11), { labels: lab(12, 13), cls: 'tx-kecil' }), diagram(PETA.v1)));
        rowsChoose(wrap, ctx, { prompt: `Sesi 12 perintah (versi 1): ruang · tas · keluaran selain "Kamu di …"${r === 2 ? '. Putaran 1–2: persemaian, gua, tas [].' : ''}`, cls: 'tx-isi tx-mono', rows: [...idx.map(rowFor), ...(r === 3 ? [['n', 'Berapa kali "Kamu di …" tercetak?', ['12', '13', '14', '11'], String(n)]] : [])], done: next });
      }
      else if (r === 4) {
        const best = terpendek(PETA.v1).join(', ');
        wrap.append(pyCode(V1.slice(11, 19), { labels: lab(12, 8), cls: 'tx-kecil', hl: [2, 5] }));
        rowsChoose(wrap, ctx, { prompt: 'Syarat menang dan masukan pemain', cls: 'tx-isi', rows: [
          ['b', 'Perintah 6 sudah di bukit. Mengapa belum menang?', ['bibit belum ada di tas; baru diambil pada perintah 9', 'karena bukit bukan tujuan', 'karena senter belum diambil', 'karena break belum dijalankan'], 'bibit belum ada di tas; baru diambil pada perintah 9'],
          ['c', 'Mengapa Timur ditolak?', ['kunci dictionary membedakan huruf besar dan kecil', 'karena timur tidak ada di persemaian', 'karena perintah ke-10 selalu ditolak', 'karena spasi'], 'kunci dictionary membedakan huruf besar dan kecil'],
          ['f', 'Perbaikan baris 17', ['perintah = input("> ").strip().lower()', 'perintah = input("> ").upper()', 'perintah = input("> ").split()', 'perintah = input("> ").title()'], 'perintah = input("> ").strip().lower()'],
          ['d', 'Urutan paling pendek untuk menang', opsi(best, ['utara, utara, ambil, timur, utara', 'utara, timur, utara', 'utara, ambil, timur, timur, utara']), best]], done: next });
      }
      else if (r === 5) {
        const dodi = V1.map((x, i) => (i === 18 ? '        ruang = perintah' : x)); const D = jalankan(dodi, ['utara', 'ambil']); const tercetak = D.out.join(' / ');
        wrap.append(el('div', { class: 'tx-dua' }, pyCode(dodi.slice(11), { labels: lab(12, 13), cls: 'tx-kecil', warn: [7] }), el('pre', { class: 'tx-layar' }, `${D.out.join('\n')}\n⚠ Baris ${D.error.line + 1} · ${D.error.type}: ${D.error.message}`)));
        rowsChoose(wrap, ctx, { prompt: 'Versi Dodi: ruang = perintah, lalu utara dan ambil', cls: 'tx-isi', rows: [
          ['o', 'Yang tercetak', opsi(tercetak, ['Kamu di pos / Kamu di persemaian', 'Kamu di pos / Tidak bisa.', 'Kamu di utara']), tercetak],
          ['e', 'Galat dan barisnya', opsi(`baris ${D.error.line + 1} · ${D.error.type}: ${D.error.message}`, ["baris 19 · KeyError: 'utara'", "baris 20 · KeyError: 'ambil'", 'baris 13 · NameError: utara']), `baris ${D.error.line + 1} · ${D.error.type}: ${D.error.message}`],
          ['k', 'Mengapa transisi[ruang][perintah]?', ['yang pertama mengambil dictionary jalan keluar ruang itu, yang kedua mengambil ruang tujuan', 'agar program lebih cepat', 'karena perintah berupa list', 'tidak ada alasan'], 'yang pertama mengambil dictionary jalan keluar ruang itu, yang kedua mengambil ruang tujuan'],
          ['c', 'Menambah kebun kopi berisi caping', ['tambah "barat" di baris 3, satu ruang baru di transisi, dan caping di barang; baris 12–24 tetap', 'ubah perulangan while', 'tambah if baru untuk kebun kopi', 'buat program baru'], 'tambah "barat" di baris 3, satu ruang baru di transisi, dan caping di barang; baris 12–24 tetap']], done: next });
      }
      else if (r === 6) {
        const B = runPy([...V1.slice(0, 8), ...BUNTU]).out[0]; const R = PETA.riska;
        wrap.append(el('div', { class: 'tx-dua' }, el('div', null, diagram(PETA.v1), legenda()), el('div', null, diagram(R, { cls: 'kecil' }), el('p', { class: 'tx-ket' }, 'Peta Riska'))));
        rowsChoose(wrap, ctx, { prompt: 'Ruang jebakan', cls: 'tx-isi', rows: [
          ['a', 'Ruang yang tidak bisa ditinggalkan', ['air terjun: setiap perintah dijawab "Tidak bisa." selamanya', 'gua', 'bukit', 'pos'], 'air terjun: setiap perintah dijawab "Tidak bisa." selamanya'],
          ['b', 'Perbaikan baris 6', ['"air terjun": {"barat": "sungai"},', '"air terjun": {"timur": "sungai"},', '"air terjun": {"barat": "bukit"},', '"air terjun": None,'], '"air terjun": {"barat": "sungai"},'],
          ['p', 'Baris P4', ['len(transisi[r]) == 0', 'transisi[r] == r', 'r not in transisi', 'len(transisi) == 0'], 'len(transisi[r]) == 0'],
          ['h', 'ruang_buntu(transisi, "bukit")', opsi(B, ["['air terjun', 'bukit']", '[]', "['gua']"]), B],
          ['d', 'Peta Riska: apakah pemain aman?', [`tidak: ${tidakSampai(R).filter((x) => !buntu(R).includes(x)).join(' dan ')} punya jalan keluar, tetapi tidak bisa mencapai bukit`, 'aman, karena ruang_buntu kosong', 'tidak, karena sungai punya 4 arah', 'aman, karena ada semak'], `tidak: ${tidakSampai(R).filter((x) => !buntu(R).includes(x)).join(' dan ')} punya jalan keluar, tetapi tidak bisa mencapai bukit`]], done: next });
      }
      else if (r === 7) {
        const S = sesi(V2, terpendek(PETA.v1)); const akhir = S.at(-1); const R = jalankan(V2, terpendek(PETA.v1));
        wrap.append(el('div', { class: 'tx-dua' }, pyCode(V2_KOSONG.slice(12), { labels: lab(13, 17), cls: 'tx-kecil', warn: [8] }), diagram(PETA.v2)));
        rowsChoose(wrap, ctx, { prompt: 'Gerbang berkunci', cls: 'tx-isi tx-mono', rows: [
          ['l', 'Baris 21', ['terkunci[tujuan] not in tas', 'terkunci[tujuan] in tas', 'tujuan not in tas', 'ruang in terkunci'], 'terkunci[tujuan] not in tas'],
          ['o', `Urutan ${terpendek(PETA.v1).join(', ')}: keluaran perintah terakhir`, opsi(akhir.out.filter((x) => !x.startsWith('Kamu di')).join(' ') || '—', ['Bibit tertanam. Kamu menang!', 'Tidak bisa.', 'Kamu di bukit']), akhir.out.filter((x) => !x.startsWith('Kamu di')).join(' ') || '—'],
          ['r', 'Ruang sesudahnya', ['sungai', 'bukit', 'air terjun', 'persemaian'], R.vars.ruang]], done: next });
      }
      else if (r === 8) {
        const best = terpendek(PETA.v2); const rudi = terpendek(PETA.rudi); const cek = jalankan(V2, best);
        wrap.append(el('div', { class: 'tx-dua' }, diagram(PETA.v2, { sorot: ['air terjun'] }), el('div', null, diagram(PETA.rudi, { cls: 'kecil' }), el('p', { class: 'tx-ket' }, 'Kunci dipindah ke bukit'))));
        rowsChoose(wrap, ctx, { prompt: 'Rute terpendek dengan gerbang', cls: 'tx-isi', rows: [
          ['c', 'Urutan paling pendek', opsi(`${best.join(', ')} (${best.length} perintah)${cek.selesai ? '' : ' ?'}`, ['utara, ambil, timur, utara (4 perintah)', 'utara, timur, timur, ambil, barat, utara (6 perintah)', 'utara, utara, ambil, selatan, timur, timur, ambil, barat, utara (9 perintah)']), `${best.join(', ')} (${best.length} perintah)${cek.selesai ? '' : ' ?'}`],
          ['d', 'Mengapa jebakan harus diperbaiki dulu?', ['pemain yang mengambil kunci akan terjebak di air terjun, jadi tidak mungkin menang', 'agar petanya simetris', 'karena kunci terlalu berat', 'tidak perlu diperbaiki'], 'pemain yang mengambil kunci akan terjebak di air terjun, jadi tidak mungkin menang'],
          ['e', 'Rudi memindahkan kunci ke bukit', [rudi ? 'tetap bisa menang' : 'tidak mungkin menang: kunci ada di balik gerbangnya sendiri', 'bisa menang lebih cepat', 'galat KeyError', 'gerbang terbuka sendiri'], rudi ? 'tetap bisa menang' : 'tidak mungkin menang: kunci ada di balik gerbangnya sendiri']], done: next });
      }
      else {
        const sisa = 15 - terpendek(PETA.v2).length; const T = tidakSampai(PETA.riska).join(', ');
        wrap.append(diagram(PETA.riska, { cls: 'kecil' }), legenda());
        rowsChoose(wrap, ctx, { prompt: 'Tantangan: kalah setelah 15 perintah, dan bisa_sampai', cls: 'tx-isi', rows: [
          ['p', 'Letak pemeriksaan kalah', ['sesudah pemeriksaan menang, sebelum input', 'sebelum pemeriksaan menang', 'di akhir perulangan setelah else', 'di luar perulangan'], 'sesudah pemeriksaan menang, sebelum input'],
          ['s', 'Rute terpendek 7 perintah: boleh salah berapa kali?', ['6', '7', '8', '15'], String(sisa)],
          ['b', 'Ruang di peta Riska yang tidak bisa mencapai bukit', opsi(T, ['air terjun', 'rawa', 'semak, sungai']), T]], done: next });
      }
    }
    render();
  },
};

// The game screen: output log, command buttons and a typed command (shown only, never stored).
function layarMain(m, cmds, { onCmd, onReset, lines = kodePeta(m) } = {}) {
  const S = sesi(lines, cmds); const R = S.at(-1).akhir; const menang = R && R.selesai;
  const log = el('pre', { class: 'tx-layar' }, S.map((e) => `${e.cmd != null ? `> ${e.cmd}\n` : ''}${e.out.join('\n')}`).join('\n') + (R?.error ? `\n⚠ ${R.error.type}: ${R.error.message}` : ''));
  const input = el('input', { class: 'tx-input', type: 'text', maxlength: 20, placeholder: 'ketik perintah', 'aria-label': 'perintah', autocomplete: 'off', onkeydown: (e) => { if (e.key === 'Enter' && e.target.value) { onCmd(e.target.value); } } });
  const ruang = R?.vars?.ruang; const tas = R?.vars?.tas || [];
  return { R, menang, ruang, el: el('div', { class: 'tx-main' }, log, el('p', { class: 'tx-status' }, `ruang = ${pyRepr(ruang ?? m.awal, true)} · tas = ${pyRepr(tas)} · perintah = ${cmds.length}`),
    menang ? el('p', { class: 'reveal good' }, `Menang dengan ${cmds.length} perintah.`) : R?.error ? el('p', { class: 'reveal bad' }, 'Program berhenti karena galat.') : el('div', { class: 'tx-tombol' }, [...ARAH, 'ambil'].map((a) => button(a, () => onCmd(a))), input, button('Kirim', () => { if (input.value) onCmd(input.value); }, 'primary')),
    onReset ? button('↺ Main lagi', onReset) : null) };
}

// Map table editor: rooms from a fixed list, exits, items, gates, start, goal and the item needed.
const NAMA_RUANG = ['pos', 'persemaian', 'gua', 'sungai', 'air terjun', 'bukit', 'rawa', 'semak', 'kebun kopi', 'menara pandang', 'jembatan', 'danau'];
const BARANG = ['bibit', 'senter', 'kunci', 'caping', 'tali', 'peta'];
function editor(m, onChange) {
  let pilih = m.ruang[0];
  const box = el('div', { class: 'tx-editor' });
  const ganti = (f) => { f(); onChange(); draw(); };
  const draw = () => {
    if (!m.ruang.includes(pilih)) pilih = m.ruang[0];
    const row = (r) => el('tr', { class: r === pilih ? 'pilih' : '' }, onTap(el('td', { class: 'nama' }, `${r === m.awal ? '▶ ' : ''}${r === m.tujuan ? '⭐ ' : ''}${r}`), () => { pilih = r; draw(); }), ...ARAH.map((a) => el('td', null, m.jalan[r]?.[a] || '')), el('td', null, m.barang[r] || ''), el('td', null, m.gerbang[r] || ''));
    const seg = (items, cur, f, none = true) => el('div', { class: 'seg tx-seg' }, [...(none ? ['—'] : []), ...items].map((x) => onTap(el('button', { class: `seg-btn ${(cur || '—') === x ? 'on' : ''}`, type: 'button' }, x), () => ganti(() => f(x === '—' ? null : x)))));
    const setJalan = (a, t) => { m.jalan[pilih] = m.jalan[pilih] || {}; if (t) m.jalan[pilih][a] = t; else delete m.jalan[pilih][a]; };
    const setObj = (o, v) => { if (v) o[pilih] = v; else delete o[pilih]; };
    box.replaceChildren(
      el('table', { class: 'tx-tabel' }, el('tr', null, ['Ruang', ...ARAH, 'Barang', 'Gerbang'].map((h) => el('th', null, h))), m.ruang.map(row)),
      el('div', { class: 'tx-ubah' }, el('b', null, `Ubah ${pilih}`),
        ...ARAH.map((a) => el('div', { class: 'tx-baris' }, el('small', null, a), seg(m.ruang.filter((x) => x !== pilih), m.jalan[pilih]?.[a], (t) => setJalan(a, t)))),
        el('div', { class: 'tx-baris' }, el('small', null, 'barang'), seg(BARANG, m.barang[pilih], (v) => setObj(m.barang, v))),
        el('div', { class: 'tx-baris' }, el('small', null, 'gerbang'), seg(BARANG, m.gerbang[pilih], (v) => setObj(m.gerbang, v))),
        el('div', { class: 'tx-baris' }, el('small', null, 'syarat menang'), seg(BARANG, m.syarat, (v) => { m.syarat = v; })),
        el('div', { class: 'tx-atur' }, button('▶ jadikan awal', () => ganti(() => { m.awal = pilih; })), button('⭐ jadikan tujuan', () => ganti(() => { m.tujuan = pilih; })),
          button('🗑 hapus ruang', () => { if (m.ruang.length <= 2 || pilih === m.awal || pilih === m.tujuan) return; ganti(() => { m.ruang = m.ruang.filter((x) => x !== pilih); delete m.jalan[pilih]; delete m.barang[pilih]; delete m.gerbang[pilih]; for (const r of m.ruang) for (const a of ARAH) if (m.jalan[r]?.[a] === pilih) delete m.jalan[r][a]; }); })),
        el('div', { class: 'tx-baris' }, el('small', null, 'tambah ruang'), el('div', { class: 'seg tx-seg' }, NAMA_RUANG.filter((x) => !m.ruang.includes(x)).map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `+ ${x}`), () => ganti(() => { m.ruang.push(x); m.jalan[x] = {}; pilih = x; })))))));
  };
  draw();
  return box;
}
const periksaPeta = (m) => { const B = buntu(m); const T = tidakSampai(m).filter((x) => !B.includes(x)); const best = terpendek(m); return { B, T, best, ok: !B.length && !T.length && !!best }; };
const laporan = (P) => el('div', { class: 'tx-lapor' }, el('p', { class: P.B.length ? 'bad' : 'good' }, P.B.length ? `Ruang buntu: ${P.B.join(', ')}` : 'Tidak ada ruang buntu.'), el('p', { class: P.T.length ? 'bad' : 'good' }, P.T.length ? `Tidak bisa mencapai tujuan: ${P.T.join(', ')}` : 'Semua ruang bisa mencapai tujuan.'), el('p', { class: P.best ? 'good' : 'bad' }, P.best ? `Bisa dimenangkan: paling sedikit ${P.best.length} perintah.` : 'Tidak mungkin dimenangkan (cek gerbang dan letak kunci).'));

function createPlay(root, ctx) {
  const wrap = el('div', { class: 'act petualangan' });
  root.append(wrap);
  let key = 'v1'; let m = salin(PETA.v1); let cmds = []; let tab = 'main';
  const draw = () => {
    const P = periksaPeta(m); let ruang = m.awal;
    const main = tab === 'main' ? layarMain(m, cmds, { onCmd: (c) => { cmds.push(c); ctx.sound.tap(); draw(); }, onReset: () => { cmds = []; draw(); } }) : null; if (main) ruang = main.ruang ?? m.awal;
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Petualangan: ${m.nama || 'peta buatanmu'}`),
      el('div', { class: 'tx-atur' }, el('div', { class: 'seg' }, Object.entries(PETA).map(([k, p]) => onTap(el('button', { class: `seg-btn ${key === k ? 'on' : ''}`, type: 'button' }, p.nama), () => { key = k; m = salin(p); cmds = []; draw(); }))),
        el('div', { class: 'seg' }, [['main', '🎮 main'], ['tabel', '✏️ ubah tabel']].map(([t, l]) => onTap(el('button', { class: `seg-btn ${tab === t ? 'on' : ''}`, type: 'button' }, l), () => { tab = t; draw(); })))),
      el('div', { class: 'tx-dua lebar' }, tab === 'main' ? main.el : editor(m, () => { key = null; m.kode = 'gen'; m.nama = 'peta buatanmu'; cmds = []; }), el('div', null, diagram(m, { kini: ruang }), legenda(), laporan(P),
        m.kode === 'v1' ? el('p', { class: 'tx-ket' }, 'Versi 1 membedakan huruf besar dan kecil.') : el('p', { class: 'tx-ket' }, 'Perintah diproses dengan .strip().lower() seperti versi 2.'))));
  };
  draw();
}

// Tracer: the commands are queued, and the program waits at input() when they run out.
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act petualangan' });
  root.append(wrap);
  let versi = 'v2'; let cmds = ['utara', 'ambil', 'timur', 'utara']; let tr = null;
  const draw = () => {
    tr?.stop?.(); const lines = versi === 'v1' ? V1 : V2;
    tr = pyTracer(lines, { labels: lab(1, lines.length), cls: 'tx-kecil', hideVars: ['transisi'], opts: () => { const qq = [...cmds]; return { limit: 20000, builtins: { input: () => { if (!qq.length) throw new PyError('Batas', 'Program menunggu perintah berikutnya di input(). Tambahkan perintah di atas.', null); return qq.shift(); } } }; } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur permainan'),
      el('div', { class: 'tx-atur' }, el('div', { class: 'seg' }, [['v1', 'versi 1'], ['v2', 'versi 2 (gerbang)']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${versi === v ? 'on' : ''}`, type: 'button' }, t), () => { versi = v; draw(); }))),
        el('div', { class: 'seg' }, [...ARAH, 'ambil', 'Timur'].map((a) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `+ ${a}`), () => { cmds.push(a); draw(); }))), button('⌫', () => { cmds.pop(); draw(); }), button('Kosongkan', () => { cmds = []; draw(); })),
      el('p', { class: 'tx-status' }, `Perintah: ${cmds.join(', ') || '(belum ada)'}`), tr);
  };
  draw();
  return () => tr?.stop?.();
}

// Team mode: the designers edit a map, the players try to win it with as few commands as possible.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act petualangan' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Main Peta Tim Lain selesai', pts, again: () => pickTeams(wrap, 'Main Peta Tim Lain', start) }); return; }
      const boss = t % nT; const m = salin(PETA.v2); m.kode = 'gen'; m.nama = `peta Tim ${boss + 1}`;
      const draw = () => { const P = periksaPeta(m);
        wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: ubah peta (tim lain jangan melihat)`),
          el('div', { class: 'tx-dua lebar' }, editor(m, () => draw()), el('div', null, diagram(m), laporan(P), button('Selesai ➜ tim lain bermain', () => main(boss, m, P), 'primary')))); };
      draw();
    }
    function main(boss, m, P) {
      const who = (boss + 1) % nT; if (P.ok) pts[boss] += 2; let cmds = [];
      const msg = el('p', { class: `reveal ${P.ok ? 'good' : 'bad'}` }, P.ok ? `Peta Tim ${boss + 1} bisa dimenangkan dan tanpa jebakan: +2.` : `Peta Tim ${boss + 1} punya masalah, tidak mendapat poin perancang.`);
      const draw = () => { const L = layarMain(m, cmds, { onCmd: (c) => { cmds.push(c); ctx.sound.tap(); draw(); } });
        if (L.menang && !draw.done) { draw.done = true; pts[who] += 2; const hemat = P.best && cmds.length === P.best.length; if (hemat) pts[who] += 1; ctx.sound.win?.(); say(msg, 'good', `Menang dengan ${cmds.length} perintah${hemat ? ', paling sedikit: +3' : `; paling sedikit ${P.best?.length}: +2`}.`); }
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: mainkan peta Tim ${boss + 1}`), el('div', { class: 'tx-dua lebar' }, L.el, el('div', null, el('p', { class: 'tx-ket' }, `Kamu di ${L.ruang ?? m.awal}. Peta tidak ditampilkan saat bermain.`), msg, button(L.menang ? 'Lanjut ➜' : 'Menyerah ➜', () => { t++; step(); }, L.menang ? 'primary' : '')))); };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Main Peta Tim Lain', start);
}
