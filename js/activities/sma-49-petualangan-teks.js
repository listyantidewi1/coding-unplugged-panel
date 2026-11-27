// Permainan Petualangan Teks — SMA/SMK (16–18 tahun), coding. A text adventure
// as a state machine: a transition dictionary, the game loop, case-sensitive
// commands (version 1) and .strip().lower() (version 2), Dodi's KeyError, the
// trap room, a locked gate, and maps that cannot be won. Every session is run by
// the worksheet program in mini-py with the commands fed to input().

import { el, onTap, button } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
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

// ---- Permainan: Ekspedisi Bibit ----
// The team is the program and the player at once: a pawn walks the forest
// map, the bag fills, and every answer is checked by running the worksheet
// program in mini-py. Careless designers Dodi, Riska and Rudi leave bugs, trap
// rooms and a key behind its own gate.
const HEAD49 = {
  peta: ['Peta dari Kode', 'Ketuk ruang tujuan yang ditulis dictionary transisi.', 'Petanya kusimpan di dalam kode, hihi.'],
  jalan1: ['Jalan-Jalan di Hutan: 1–6', 'Ramalkan setiap perintah: ketuk ruang tujuan, atau tombol hasilnya.', 'Ayo tersesat!'],
  jalan2: ['Jalan-Jalan di Hutan: 7–12', 'Lanjutkan sampai bibit tertanam di bukit.', 'Ada perintah berhuruf besar, lho.'],
  dodi: ['Bug Dodi dan Kebun Kopi', 'Jalankan versi Dodi, tunjuk bugnya, lalu tambah kebun kopi lewat data saja.', 'Dodi: ruang = perintah, beres!'],
  jebak: ['Ruang Jebakan', 'Masuk ke air terjun, lalu coba keluar.', 'Riska: air terjun tanpa pintu keluar!'],
  buntu: ['Buru Ruang Buntu', 'Lengkapi ruang_buntu, lalu periksa peta Riska.', 'Rawa dan semakku lolos pemeriksaan!'],
  gerbang: ['Gerbang Berkunci', 'Lengkapi pemeriksaan gerbang, lalu jalankan rute lama.', 'Gerbang bukit kukunci!'],
  cepat: ['Rute Tercepat', 'Menangkan versi 2 dengan perintah sesedikit mungkin.', 'Kuncinya jauh di air terjun!'],
  rudi: ['Taklukkan Peta Rudi', 'Temukan masalah peta Rudi, lalu pindahkan kuncinya.', 'Rudi: kunci di bukit, aman!'],
  bos: ['Berlomba dengan Matahari', 'Susun pemeriksaan menang dan kalah, lalu jalankan 15 perintah.', 'Matahari terbenam setelah 15 perintah!'],
};
const msg49 = (t) => el('p', { class: 'reveal info' }, t);

// The forest map with tappable rooms (data-r) and the current room.
function peta49(m, { kini = null, barang = null, onRoom = null, drop = false, cls = '' } = {}) {
  const mm = barang ? { ...m, barang } : m; const d = diagram(mm, { kini, cls: `ek49-peta ${cls}` });
  d.querySelectorAll('.tx-ruang').forEach((n, i) => { const r = m.ruang[i]; n.dataset.r = r; if (drop) n.dataset.drop = r; if (onRoom) { n.classList.add('ketuk'); onTap(n, () => onRoom(r)); } });
  return d;
}
const state49 = (kode, cmds) => { const R = jalankan(kode, cmds); const b = R.vars.barang; return { R, ruang: R.vars.ruang, tas: [...(R.vars.tas || [])], barang: b ? Object.fromEntries(b) : {} }; };
const layarText = (R, n = 5) => [...R.out.slice(-n), ...(R.error ? [`${R.error.type}: ${R.error.message}`] : [])].join('\n');

// Predict mode: for each scripted command, tap the room reached or the result button.
function ramalKonsol(ctx, { oops, msg, m, kode, cmds, from, to, onEnd }) {
  let i = from; const kiri = el('div', { class: 'ek49-kolom' }); const kanan = el('div', { class: 'ek49-kolom' });
  const want = (k) => { const a = state49(kode, cmds.slice(0, k)); const b = state49(kode, cmds.slice(0, k + 1)); const o = b.R.out.slice(a.R.out.length).join(' ');
    if (o.includes('Gerbang terkunci')) return 'gerbang'; if (o.includes('Tidak bisa')) return 'tidak'; if (b.ruang !== a.ruang) return `r:${b.ruang}`; if (b.tas.length > a.tas.length) return 'ambil'; return 'tidak'; };
  const draw = () => {
    const S = state49(kode, cmds.slice(0, i)); const w = i < to ? want(i) : '';
    fill(kiri, peta49(m, { kini: S.ruang, barang: S.barang, onRoom: i < to ? (r) => jawab(`r:${r}`) : null }));
    fill(kanan, el('div', { class: 'ek49-skrip' }, cmds.slice(from, to).map((c, k) => el('code', { class: from + k === i ? 'aktif' : from + k < i ? 'beres' : '' }, `${from + k + 1}. > ${c}`))),
      el('p', { class: 'ek49-tas' }, `🎒 tas = ${pyRepr(S.tas)}`), el('pre', { class: 'mk-layar ek49-layar' }, layarText(S.R)),
      i < to ? el('div', { class: 'ek49-tombol', 'data-want': w }, [['ambil', '🎒 ambil berhasil'], ['tidak', '🚫 Tidak bisa.'], ...(kode === V2 ? [['gerbang', '🔒 Gerbang terkunci']] : [])].map(([v, t]) => onTap(el('button', { type: 'button', class: 'ek49-pilih', 'data-v': v }, t), () => jawab(v)))) : null);
  };
  function jawab(v) {
    if (i >= to) return; const w = want(i); const S = state49(kode, cmds.slice(0, i)); const c = cmds[i];
    if (v !== w) { oops(); say(msg, 'bad', w === 'tidak' ? (c !== c.toLowerCase() ? `"${c}" berhuruf besar: tidak ada di transisi[ruang], jadi Tidak bisa.` : `Di ${S.ruang} tidak ada jalan "${c}" dan tidak ada barang: Tidak bisa.`) : w === 'ambil' ? `Ada ${S.barang[S.ruang]} di ${S.ruang}: ambil berhasil.` : w === 'gerbang' ? 'Bukit dikunci, dan kunci belum ada di tas.' : `Ikuti panah "${c}" dari ${S.ruang}.`); return; }
    i++; ctx.sound.tap(); draw();
    if (i < to) { say(msg, 'info', 'Tepat.'); return; }
    onEnd();
  }
  draw();
  return el('div', { class: 'ek49-dua' }, kiri, kanan);
}

// Free play: the player taps commands; the program runs them.
const sisi49 = (box) => box.querySelector('.ek49-dua > .ek49-kolom:last-child') || box;
const dua49 = (...k) => el('div', { class: 'ek49-dua' }, ...k);
function bebasKonsol(ctx, { msg, m, kode, tombol, onStep }) {
  const cmds = []; const kiri = el('div', { class: 'ek49-kolom' }); const kanan = el('div', { class: 'ek49-kolom' });
  const api = { cmds, reset: () => { cmds.length = 0; draw(); }, draw: () => draw() };
  const draw = () => { const S = state49(kode, cmds); api.S = S;
    fill(kiri, peta49(m, { kini: S.ruang, barang: S.barang }));
    fill(kanan, el('p', { class: 'ek49-tas' }, `🎒 tas = ${pyRepr(S.tas)} · perintah: ${cmds.length}`), el('pre', { class: 'mk-layar ek49-layar' }, layarText(S.R)),
      S.R.menunggu ? el('div', { class: 'ek49-tombol arah' }, tombol.map((c) => onTap(el('button', { type: 'button', class: 'ek49-pilih', 'data-v': c }, `> ${c}`), () => { if (!api.S.R.menunggu) return; cmds.push(c); ctx.sound.tap(); draw(); onStep(api); }))) : null);
  };
  draw();
  api.node = el('div', { class: 'ek49-dua' }, kiri, kanan);
  return api;
}

// Misi 1: read the map from the dictionary.
const TANYA49 = [['transisi["sungai"]["utara"]', 'bukit'], ['transisi["persemaian"]["timur"]', 'sungai'], ['transisi["gua"]["selatan"]', 'persemaian'], ['ruang tanpa panah keluar', 'air terjun']];
function petaRound(area, ctx, { oops, done }) {
  const msg = msg49('Ketuk ruang yang dihasilkan setiap ekspresi.'); const box = el('div', { class: 'ek49-kolom' }); let k = 0; const kanan = el('div', { class: 'ek49-kolom' }); const kiri = el('div', { class: 'ek49-kolom' });
  const tabel = el('div', { class: 'ek49-tabel' }, PETA.v1.ruang.map((r) => el('div', null, el('b', null, r), el('span', null, Object.entries(PETA.v1.jalan[r]).map(([a, t]) => `${a}→${t}`).join(', ') || '{ }'))));
  const draw = () => { fill(kiri, peta49(PETA.v1, { onRoom: k < TANYA49.length ? tap : null }));
    fill(kanan, el('small', null, 'transisi (baris 1–8)'), tabel, k < TANYA49.length ? el('code', { class: 'ek49-soal' }, TANYA49[k][0]) : null); };
  function tap(r) {
    if (k >= TANYA49.length) return; const [e, w] = TANYA49[k];
    if (r !== w) { oops(); say(msg, 'bad', k === 3 ? 'Cari ruang yang dictionary jalannya kosong: {}.' : `Buka ${e.split('"')[1]} di tabel, lalu ambil arah "${e.split('"')[3]}".`); return; }
    k++; ctx.sound.tap(); draw();
    if (k < TANYA49.length) { say(msg, 'info', `${e} → ${w}.`); return; }
    say(msg, 'info', 'Air terjun tidak punya jalan keluar. Dua ekspresi lagi.');
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['"barat" in transisi["pos"] → ', '_'], ['len(transisi["persemaian"]) → ', '_']]), chips: ['False', 'True', '3', '1'], want: ['False', '3'],
      hints: ['pos hanya punya jalan utara.', 'persemaian punya selatan, utara, dan timur.'], done: () => { say(msg, '', 'Peta adalah data. Keadaan permainan: ruang, isi tas, dan barang yang tersisa.'); done(); } }));
  }
  draw(); fill(box, el('div', { class: 'ek49-dua' }, kiri, kanan));
  area.append(box, msg);
}

// Misi 2: the session of 12 commands, in two halves.
function jalanRound(area, ctx, { oops, done }, from) {
  const msg = msg49(from ? 'Lanjutkan dari persemaian. Perhatikan perintah berhuruf besar.' : 'Kamu di pos. Ramalkan setiap perintah sebelum program menjalankannya.'); const box = el('div', { class: 'ek49-kolom' });
  fill(box, ramalKonsol(ctx, { oops, msg, m: PETA.v1, kode: V1, cmds: SESI, from, to: from + 6, onEnd: () => {
    if (!from) { say(msg, 'info', 'Enam perintah beres.'); sisi49(box).append(fillBoard(ctx, { oops, msg, view: rowsView([['senter masuk tas di perintah ', '_']]), chips: ['3', '2', '9'], want: ['3'], hints: ['Lihat kapan tas berubah.'], done: () => { say(msg, '', 'Tas bertambah hanya saat ambil di ruang yang punya barang.'); done(); } })); return; }
    const n = sesi(V1, SESI).reduce((s, e) => s + e.out.filter((x) => x.startsWith('Kamu di')).length, 0);
    say(msg, 'info', 'Bibit tertanam. Kamu menang!');
    sisi49(box).append(fillBoard(ctx, { oops, msg, view: rowsView([['"Kamu di" tercetak ', '_', ' kali'], ['agar "Timur" diterima: input("> ")', '_']]), chips: [String(n), '12', '.strip().lower()', '.upper()'], want: [String(n), '.strip().lower()'],
      hints: ['Sekali sebelum perintah pertama, lalu sekali setelah setiap perintah.', 'Buang spasi, lalu ubah menjadi huruf kecil.'], done: () => { say(msg, '', `Rute terpendek versi 1 hanya ${terpendek(PETA.v1).length} perintah: ${terpendek(PETA.v1).join(', ')}.`); done(); } }));
  } }));
  area.append(box, msg);
}

// Misi 3: Dodi's bug, then the coffee garden added as data only.
export const DODI = V1.map((x, i) => (i === 18 ? '        ruang = perintah' : x));
function dodiRound(area, ctx, { oops, done }) {
  const msg = msg49('Versi Dodi. Ketik utara, lalu ambil.'); const box = el('div', { class: 'ek49-kolom' }); const urut = ['utara', 'ambil'];
  const ribbon = () => codeView(DODI.slice(16, 24).map((x) => x.replace(/^ {4}/, '').replace(/ {4}/g, '  ')), { labels: lab(17, 8), cls: 'ketuk', onLine: (k, row) => tunjuk(k, row) });
  let siap = false; let ketemu = false; let pita = null;
  const K = bebasKonsol(ctx, { msg, m: PETA.v1, kode: DODI, tombol: ['utara', 'ambil'], onStep: (api) => {
    const n = api.cmds.length; if (api.cmds[n - 1] !== urut[n - 1]) { api.cmds.pop(); ctx.mistake(); api.draw(); say(msg, 'bad', `Ketik ${urut[n - 1]}.`); return; }
    if (api.S.R.error) { siap = true; say(msg, 'info', `Kamu di ${api.S.ruang}?! Program berhenti. Ketuk baris yang salah.`); pita = ribbon(); fill(box, dua49(pita, K.node.lastChild)); } } });
  function tunjuk(k, row) {
    if (!siap || ketemu) return;
    if (k !== 2) { oops(); say(msg, 'bad', 'Baris ini benar. Cari baris yang mengisi ruang dengan arah, bukan nama ruang.'); return; }
    ketemu = true; row.classList.add('warn'); ctx.sound.tap(); say(msg, 'info', 'ruang berisi "utara". Perbaiki baris 19.');
    fill(box, dua49(pita, fillBoard(ctx, { oops, msg, view: codeFill([['    ruang = ', '_']], { labels: ['19'] }), chips: ['transisi[ruang][perintah]', 'transisi[perintah]', 'perintah'], want: ['transisi[ruang][perintah]'], hints: ['Ambil dictionary jalan dari ruang sekarang, lalu tujuan untuk arah itu.'], done: kopi })));
  }
  function kopi() {
    say(msg, 'info', 'Bu guru minta kebun kopi di barat persemaian, berisi caping. Ubah datanya saja.');
    const papan = fillBoard(ctx, { oops, msg, view: rowsView([['baris 3 ditambah ', '_'], ['transisi ditambah ', '_'], ['baris 9 ditambah ', '_'], ['baris 12–24: ', '_']]), chips: ['"barat": "kebun kopi"', '"kebun kopi": {"timur": "persemaian"}', '"kebun kopi": "caping"', 'tidak berubah', 'ditambah if baru'],
      want: ['"barat": "kebun kopi"', '"kebun kopi": {"timur": "persemaian"}', '"kebun kopi": "caping"', 'tidak berubah'], hints: ['Persemaian mendapat jalan baru ke barat.', 'Ruang baru dengan jalan pulang ke timur.', 'Barangnya ditulis di dictionary barang.', 'Perulangan hanya membaca data.'],
      done: () => { const m = salin(PETA.v1); m.ruang.push('kebun kopi'); m.jalan.persemaian.barat = 'kebun kopi'; m.jalan['kebun kopi'] = { timur: 'persemaian' }; m.barang['kebun kopi'] = 'caping';
        fill(box, dua49(papan, peta49(m, { cls: 'kecil' }))); say(msg, '', 'Kebun kopi muncul tanpa mengubah satu baris pun di perulangan permainan.'); done(); } });
    fill(box, papan);
  }
  fill(box, K.node);
  area.append(box, msg);
}

// Misi 4: the trap room.
export const JEBAK49 = ['utara', 'timur', 'timur', 'barat', 'selatan'];
function jebakRound(area, ctx, { oops, done }) {
  const msg = msg49('Riska merancang air terjun. Ramalkan setiap perintah.'); const box = el('div', { class: 'ek49-kolom' });
  fill(box, ramalKonsol(ctx, { oops, msg, m: PETA.v1, kode: V1, cmds: JEBAK49, from: 0, to: JEBAK49.length, onEnd: () => {
    say(msg, 'info', 'Terjebak selamanya! Beri air terjun jalan keluar.');
    box.append(fillBoard(ctx, { oops, msg, view: codeFill([['    "air terjun": {', '_', '},']], { labels: ['6'] }), chips: ['"barat": "sungai"', '"timur": "sungai"', '"barat": "bukit"'], want: ['"barat": "sungai"'], hints: ['Air terjun ada di timur sungai, jadi jalan pulangnya ke barat.'],
      done: () => { say(msg, '', 'Versi 2 memakai baris ini: setiap ruang selain tujuan punya jalan keluar.'); done(); } }));
  } }));
  area.append(box, msg);
}

// Misi 4b: ruang_buntu, then Riska's swamp.
function buntuRound(area, ctx, { oops, done }) {
  const msg = msg49('Lengkapi pemeriksa ruang buntu.'); const box = el('div', { class: 'ek49-kolom' }); const out = layar(); const R = PETA.riska; const T = tidakSampai(R); const got = [];
  const hasil = runPy([...V1.slice(0, 8), ...BUNTU]).out[0]; const hasilR = runPy([...kodePeta(R).slice(0, R.ruang.length + 2), ...BUNTU]).out[0];
  const riska = () => { say(msg, 'info', `Peta Riska lolos: ruang_buntu memberi ${hasilR}. Tetapi ketuk ruang yang tidak bisa mencapai bukit.`);
    const kanan = el('div', { class: 'ek49-kolom' }); const draw = () => fill(kanan, peta49(R, { onRoom: got.length < T.length ? tap : null, cls: 'riska' }), el('p', { class: 'ek49-tas' }, `tertangkap: ${got.join(', ') || '-'}`));
    function tap(r) { if (got.includes(r)) return; if (!T.includes(r)) { oops(); say(msg, 'bad', `Dari ${r} masih ada jalan ke bukit.`); return; } got.push(r); ctx.sound.tap(); draw(); if (got.length < T.length) { say(msg, 'info', `${r}: berputar tanpa jalan ke bukit. Masih ada satu.`); return; }
      say(msg, '', `${T.join(' dan ')} punya jalan keluar, tetapi tidak pernah sampai ke bukit. Perlu BFS, bukan hanya len(...) == 0.`); done(); }
    draw(); box.append(kanan); };
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['def ruang_buntu(transisi, tujuan):', '  hasil = []', '  for r in transisi:', ['    if (', '_'], '        and r != tujuan):', '      hasil.append(r)', '  return hasil'], { labels: ['P1', 'P2', 'P3', 'P4', '', 'P5', 'P6'] }),
    chips: ['len(transisi[r]) == 0', 'len(transisi) == 0', 'r == tujuan'], want: ['len(transisi[r]) == 0'], hints: ['Ruang buntu: dictionary jalannya kosong.'],
    done: () => { box.append(out); play(out, [`peta versi 1 → ${hasil}`], { end: () => setTimeout(() => { fill(box); riska(); }, 1300) }); } }));
  area.append(box, msg);
}

// Misi 5: the locked gate.
function gerbangRound(area, ctx, { oops, done }) {
  const msg = msg49('Versi 2 punya gerbang di bukit. Lengkapi baris 21.'); const box = el('div', { class: 'ek49-kolom' }); const out = layar(); const L = sesi(V2, SESI);
  const lines = []; L.forEach((e, k) => { if (k) lines.push(`> ${e.cmd}`); lines.push(...e.out); });
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['  if perintah in transisi[ruang]:', '    tujuan = transisi[ruang][perintah]', '    if (tujuan in terkunci', ['        and ', '_', '):'], '      print("Gerbang terkunci.",', '            terkunci[tujuan])', '    else:', '      ruang = tujuan'], { labels: ['19', '20', '21', '', '22', '', '23', '24'] }),
    chips: ['terkunci[tujuan] not in tas', 'terkunci[tujuan] in tas', 'tujuan not in tas'], want: ['terkunci[tujuan] not in tas'], hints: ['Gerbang menahan bila barang kuncinya belum ada di tas.'],
    done: () => { say(msg, 'info', 'Rute lama dijalankan di versi 2…'); const kn = el('div', { class: 'ek49-kolom' }, out); fill(box, dua49(box.firstChild, kn)); play(out, lines.slice(-7), { gap: 350, end: () => {
      kn.append(fillBoard(ctx, { oops, msg, view: rowsView([['rute lama tertahan di ', '_'], ['kunci ada di ', '_']]), chips: ['sungai', 'bukit', 'air terjun', 'gua'], want: ['sungai', 'air terjun'], hints: ['Perintah 6 (utara dari sungai) ditolak gerbang.', 'Lihat baris 9 versi 2.'],
        done: () => { say(msg, '', 'Kunci harus diambil dulu di air terjun. Sekarang cari rute tercepat!'); done(); } })); } }); } }));
  area.append(box, msg);
}

// Misi 5b: win version 2 with the fewest commands.
function cepatRound(area, ctx, { oops, done }) {
  const best = terpendek(PETA.v2).length; const msg = msg49(`Menangkan versi 2. Target: ${best} perintah.`); const box = el('div', { class: 'ek49-kolom' });
  const K = bebasKonsol(ctx, { msg, m: PETA.v2, kode: V2, tombol: ['utara', 'selatan', 'timur', 'barat', 'ambil'], onStep: (api) => {
    const R = api.S.R; const n = api.cmds.length;
    if (!R.menunggu && R.out.some((x) => x.includes('menang'))) {
      if (n <= best) { say(msg, '', `Menang dalam ${n} perintah: ${api.cmds.join(', ')}. Rute tercepat!`); done(); return; }
      oops(); say(msg, 'bad', `Menang dalam ${n} perintah, tetapi bisa ${best}. Mulai lagi dari pos.`); setTimeout(() => api.reset(), 1600); return; }
    if (n >= best) { oops(); say(msg, 'bad', `Sudah ${n} perintah dan belum menang. Mulai lagi: ambil bibit dulu, lalu jemput kunci.`); setTimeout(() => api.reset(), 1600); return; }
    say(msg, 'info', R.out.at(-1)); } });
  fill(box, K.node);
  area.append(box, msg);
}

// Misi 6: Rudi's unwinnable map; move the key.
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg49('Pemeriksa layar: peta Rudi tidak bisa dimenangkan. Ketuk ruang penyebabnya.'); const box = el('div', { class: 'ek49-kolom' }); const m = salin(PETA.rudi); let fase = 'tunjuk';
  const kanan = el('div', { class: 'ek49-kolom' });
  const draw = () => { const host = el('div', { class: 'ek49-kolom' }, peta49(m, { onRoom: fase === 'tunjuk' ? tunjuk : null, drop: fase === 'pindah' }), fase === 'pindah' ? el('div', { class: 'ek49-baki' }, el('span', { class: 'ek49-barang', 'data-drag': 'kunci' }, '🔑 kunci')) : null);
    if (fase === 'pindah') dnd(host, (c, t) => pindah(t.dataset.drop)); fill(box, el('div', { class: 'ek49-dua' }, host, kanan)); };
  fill(kanan, el('p', { class: 'ek49-tas' }, `terpendek(peta Rudi) → ${pyRepr(terpendek(m))}`));
  function tunjuk(r) { if (r !== 'bukit') { oops(); say(msg, 'bad', 'Lihat di mana kunci disimpan dan ruang mana yang digembok.'); return; }
    fase = 'pindah'; ctx.sound.tap(); say(msg, 'info', 'Kunci ada di balik gerbangnya sendiri! Seret kunci ke ruang lain yang bisa dicapai.'); delete m.barang.bukit; draw(); }
  function pindah(r) { if (fase !== 'pindah' || !r) return;
    if (m.barang[r]) { oops(); say(msg, 'bad', `${r} sudah berisi ${m.barang[r]}. Satu ruang satu barang.`); return; }
    if (r === 'bukit') { oops(); say(msg, 'bad', 'Itu masalah yang sama.'); return; }
    m.barang[r] = 'kunci'; const t = terpendek(m); fase = 'beres'; ctx.sound.good(); fill(kanan, el('p', { class: 'ek49-tas' }, `terpendek → ${t.length} perintah`), el('code', { class: 'ek49-soal' }, t.join(', '))); draw();
    say(msg, '', `Kunci di ${r}: peta bisa dimenangkan dalam ${t.length} perintah. Tim lain siap menaklukkannya!`); done(); }
  draw();
  area.append(box, msg);
}

// Misi Bos: racing the sunset. The win check must come before the lose check.
export function programMatahari(menangDulu) {
  const menang = ['    if ruang == "bukit" and "bibit" in tas:', '        print("Bibit tertanam. Kamu menang!")', '        break'];
  const kalah = ['    if langkah == 15:', '        print("Matahari terbenam. Kamu kalah.")', '        break'];
  return [...V2.slice(0, 12), 'langkah = 0', 'while True:', '    print("Kamu di", ruang)', ...(menangDulu ? [...menang, ...kalah] : [...kalah, ...menang]), V2[17], '    langkah = langkah + 1', ...V2.slice(18)];
}
export const SALAH8 = Array(8).fill('barat');
function bosRound(area, ctx, { oops, done }) {
  const msg = msg49('Matahari terbenam setelah 15 perintah. Susun urutan pemeriksaannya.'); const box = el('div', { class: 'ek49-kolom' }); const out = layar();
  const cmds = [...SALAH8, ...terpendek(PETA.v2)]; const A = jalankan(programMatahari(true), cmds); const B = jalankan(programMatahari(false), cmds);
  fill(box, tileSlots(ctx, { oops, msg, build: ['while True:', '  print("Kamu di", ruang)', ['m', 1], '    print("Bibit tertanam…"); break', ['k', 1], '    print("Matahari terbenam…"); break', '  perintah = input("> ")…', ['l', 1]],
    tiles: [['m', 'if ruang == "bukit" and "bibit" in tas:'], ['k', 'if langkah == 15:'], ['l', 'langkah = langkah + 1'], ['x', 'if langkah > 15:', 'Setelah perintah ke-15 matahari sudah terbenam: pakai == 15.']],
    order: 'Periksa kemenangan dulu: pemain yang tiba di perintah ke-15 tetap menang.',
    onFull: () => { say(msg, 'info', `Rina salah ketik 8 kali (barat di pos), lalu rute ${terpendek(PETA.v2).length} perintah…`); const kn = el('div', { class: 'ek49-kolom' }, out); fill(box, dua49(box.firstChild, kn));
      play(out, [`> barat ×8 → Tidak bisa.`, `> ${terpendek(PETA.v2).join(', ')}`, ...A.out.slice(-2)], { gap: 600, end: () => {
        kn.append(fillBoard(ctx, { oops, msg, view: rowsView([['bila pemeriksaan kalah ditaruh lebih dulu: ', '_']]), chips: [B.out.at(-1), A.out.at(-1)], want: [B.out.at(-1)], hints: ['Di perintah ke-15 langkah sudah 15 sebelum sempat diperiksa menang.'],
          done: () => { say(msg, '', 'Urutan pemeriksaan menentukan pemenang di detik terakhir. Ekspedisi selesai!'); done(); } })); } }); } }));
  area.append(box, msg);
}

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
    const wrap = el('div', { class: 'act petualangan ek49-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'ek49-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD49[k];
        foe = el('div', { class: 'ek49-musuh' }, el('b', null, '🙈 Perancang Ceroboh'), el('span', null, ulah));
        wrap.append(el('div', { class: 'ek49-kepala' }, misiHead(no, judul, tujuan, '🧭'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Petualangan aman ✓'; next(ms); } });
      if (r === 0) { go('peta', 1); petaRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('jalan1', 2); jalanRound(area, ctx, fin(5500), 0); }
      else if (r === 2) { go('jalan2', 2); jalanRound(area, ctx, fin(6000), 6); }
      else if (r === 3) { go('dodi', 3); dodiRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('jebak', 4); jebakRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('buntu', 4); buntuRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('gerbang', 5); gerbangRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('cepat', 5); cepatRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('rudi', 6); rudiRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
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
