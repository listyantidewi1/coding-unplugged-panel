// Ular Tangga dalam Kode — SMP (13–15 tahun), coding. A game loop with a
// lookup array tujuan[] for ladders and snakes, a positions array and
// giliran MOD n + 1, Dodi's bug that walks past square 30 (index out of
// range), and new rules: throw again on 6, only when the piece moved, bounce.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, stepper, codeView } from './smp-kit.js';

export const DADU = [3, 6, 4, 4, 1, 3, 3, 6, 5, 4, 3, 2];
export const PAPAN = { 3: 12, 8: 16, 13: 22, 19: 27, 17: 5, 24: 11, 29: 18 };
const LABEL = { 3: 'membuang sampah di tempatnya', 8: 'menyiram tanaman kelas', 13: 'mencuci tangan sebelum makan', 19: 'piket kelas tanpa disuruh', 17: 'mencoret-coret meja', 24: 'membuang sampah ke selokan', 29: 'membiarkan keran terus mengalir' };
const ORDER = [3, 8, 13, 19, 17, 24, 29];

// Program text as [key, line] pairs, so the highlight follows the rules.
export function program({ papan = PAPAN, n = 2, dodi = 'tidak', lagi = 'tidak', pantul = false } = {}) {
  const size = dodi === '36' ? 36 : 30;
  const keys = Object.keys(papan).map(Number).sort((a, b) => (ORDER.indexOf(a) + 1 || 99 + a) - (ORDER.indexOf(b) + 1 || 99 + b));
  const L = [['u', `UNTUK k DARI 1 SAMPAI ${size}`], ['t', '    tujuan[k] ← k'], ...keys.map((k) => [`p${k}`, `tujuan[${k}] ← ${papan[k]}`]),
    ...Array.from({ length: n }, (_, i) => [`o${i}`, `posisi[${i + 1}] ← 0`]), ['g0', 'giliran ← 1'], ['w0', 'pemenang ← 0'], ['sel', 'SELAMA pemenang = 0'], ['dadu', '    dadu ← LEMPAR_DADU()'], ['baru', '    baru ← posisi[giliran] + dadu'],
    ...(pantul ? [['jp', '    JIKA baru > 30 MAKA'], ['pb', '        baru ← 30 − (baru − 30)'], ['p18', '    posisi[giliran] ← tujuan[baru]']] : dodi !== 'tidak' ? [['p18', '    posisi[giliran] ← tujuan[baru]']] : [['j17', '    JIKA baru ≤ 30 MAKA'], ['p18', '        posisi[giliran] ← tujuan[baru]']]),
    ['j19', '    JIKA posisi[giliran] = 30 MAKA'], ['w20', '        pemenang ← giliran'], ['e21', lagi === 'dadu' ? '    SELAIN ITU JIKA dadu ≠ 6 MAKA' : lagi === 'gerak' ? '    SELAIN ITU JIKA dadu ≠ 6 ATAU baru > 30 MAKA' : '    SELAIN ITU'], ['g22', `        giliran ← giliran MOD ${n} + 1`], ['out', 'TAMPILKAN "Pemenang: Pemain", pemenang']];
  return L;
}
export const lines = (o) => program(o).map(([, t]) => t);
export const hlOf = (o, keys) => { const p = program(o); return keys.map((k) => p.findIndex(([kk]) => kk === k)).filter((i) => i >= 0); };

// One throw of the game loop.
export function lempar(g, dadu, { papan = PAPAN, n = 2, dodi = 'tidak', lagi = 'tidak', pantul = false } = {}) {
  const size = dodi === '36' ? 36 : 30; const tujuan = (k) => (k >= 1 && k <= size ? (papan[k] ?? k) : undefined);
  const gil = g.giliran; const dari = g.posisi[gil - 1]; let baru = dari + dadu; const ex = ['sel', 'dadu', 'baru']; let ket = ''; let pos = dari; let error = null;
  if (pantul) { ex.push('jp'); if (baru > 30) { ex.push('pb'); baru = 30 - (baru - 30); ket = 'pantul'; } ex.push('p18'); pos = tujuan(baru); }
  else if (dodi !== 'tidak') { ex.push('p18'); pos = tujuan(baru); if (pos === undefined) error = `galat: indeks ${baru} di luar larik (1 sampai ${size})`; }
  else { ex.push('j17'); if (baru <= 30) { ex.push('p18'); pos = tujuan(baru); } else ket = 'tidak bergerak'; }
  if (error) return { ...g, error, row: { giliran: gil, dadu, baru, pos: '–', ket: 'galat', ex, dari } };
  if (!ket || ket === 'pantul') ket = [ket, pos > baru ? 'tangga' : pos < baru ? 'ular' : ''].filter(Boolean).join(', ');
  const posisi = [...g.posisi]; posisi[gil - 1] = pos; let { pemenang } = g; let giliran = gil;
  ex.push('j19');
  if (pos === 30) { pemenang = gil; ex.push('w20'); ket = [ket, 'menang'].filter(Boolean).join(', '); }
  else { ex.push('e21'); const pindah = lagi === 'dadu' ? dadu !== 6 : lagi === 'gerak' ? dadu !== 6 || dari + dadu > 30 : true; if (pindah) { giliran = (gil % n) + 1; ex.push('g22'); } else ket = [ket, 'lempar lagi'].filter(Boolean).join(', '); }
  return { posisi, giliran, pemenang, error: null, row: { giliran: gil, dadu, baru, pos, ket, ex, dari } };
}
export const mulai = (n = 2) => ({ posisi: Array(n).fill(0), giliran: 1, pemenang: 0, error: null, row: null });
export function main(o = {}, dice = DADU) { let g = mulai(o.n || 2); const rows = []; for (const d of dice) { if (g.pemenang || g.error) break; g = lempar(g, d, o); rows.push(g.row); } return { g, rows }; }

// Board: 5 rows × 6 columns, zigzag from the bottom, with ladder/snake lines.
const cellAt = (k) => { const r = Math.floor((k - 1) / 6); const c = r % 2 === 0 ? (k - 1) % 6 : 5 - ((k - 1) % 6); return [c, 4 - r]; };
const WARNA = ['#dc2626', '#2563eb', '#16a34a', '#a855f7'];
export function board(papan = PAPAN, { posisi = [], hl = null, onCell = null, pick = null } = {}) {
  const cells = []; for (let row = 4; row >= 0; row--) for (let c = 0; c < 6; c++) { const k = row % 2 === 0 ? row * 6 + c + 1 : row * 6 + 6 - c; cells.push(k); }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 6 5'); svg.setAttribute('class', 'ut-garis'); svg.setAttribute('preserveAspectRatio', 'none');
  for (const [a, b] of Object.entries(papan)) { const [x1, y1] = cellAt(+a); const [x2, y2] = cellAt(b); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); const mx = (x1 + x2) / 2 + 0.5 + (b < a ? 0.6 : 0); const my = (y1 + y2) / 2 + 0.5;
    p.setAttribute('d', b > a ? `M${x1 + 0.5} ${y1 + 0.5} L${x2 + 0.5} ${y2 + 0.5}` : `M${x1 + 0.5} ${y1 + 0.5} Q${mx} ${my} ${x2 + 0.5} ${y2 + 0.5}`); p.setAttribute('class', b > a ? 'tangga' : 'ular'); svg.append(p); }
  return el('div', { class: 'ut-papan-wadah' }, el('div', { class: 'ut-papan' }, cells.map((k) => {
    const t = papan[k]; const here = posisi.map((p, i) => (p === k ? i : -1)).filter((i) => i >= 0);
    const c = el('div', { class: `ut-kotak ${t ? (t > k ? 'naik' : 'turun') : ''} ${k === 30 ? 'finis' : ''} ${hl === k ? 'hl' : ''} ${pick === k ? 'pilih' : ''}`, 'data-k': String(k) }, el('b', null, String(k)), t ? el('small', null, `${t > k ? '🪜' : '🐍'} ${t}`) : k === 30 ? el('small', null, 'FINIS') : null,
      here.length ? el('div', { class: 'ut-bidak-bidak' }, here.map((i) => el('i', { class: 'ut-bidak', style: { background: WARNA[i] } }, String(i + 1)))) : null);
    if (onCell) onTap(c, () => onCell(k));
    return c;
  }), svg), el('div', { class: 'ut-luar' }, el('small', null, 'kotak 0:'), posisi.map((p, i) => (p === 0 ? el('i', { class: 'ut-bidak', style: { background: WARNA[i] } }, String(i + 1)) : null))));
}
function table(rows, { n = 2 } = {}) {
  return el('div', { class: 'ut-tabel-wadah' }, el('table', { class: 'ut-tabel' }, el('tr', null, ['Lemparan', 'giliran', 'dadu', 'baru', 'posisi', 'Keterangan'].map((h) => el('th', null, h))),
    rows.map((r, i) => el('tr', { class: r.ket.includes('menang') ? 'menang' : r.ket === 'galat' ? 'galat' : '' }, el('td', null, String(i + 1)), el('td', null, el('i', { class: 'ut-bidak', style: { background: WARNA[r.giliran - 1] } }, String(r.giliran))), el('td', null, String(r.dadu)), el('td', null, String(r.baru)), el('td', null, String(r.pos)), el('td', null, r.ket)))));
}
const tujuanRow = (papan, size = 30) => el('div', { class: 'ut-larik' }, el('small', null, 'tujuan'), Array.from({ length: size }, (_, i) => i + 1).map((k) => el('span', { class: papan[k] ? (papan[k] > k ? 'naik' : 'turun') : '' }, el('small', null, String(k)), el('b', null, String(papan[k] ?? k)))));

export default {
  id: 'smp-41-ular-tangga',
  title: 'Ular Tangga dalam Kode',
  topic: 'Perulangan permainan: larik penanda untuk ular dan tangga, larik posisi, giliran dengan sisa bagi, bug indeks di luar larik, dan aturan baru',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🐍',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Isi larik penanda dari papan, telusuri program ular tangga dengan urutan dadu tetap, temukan bug Dodi, lalu lihat bagaimana aturan "dapat 6, lempar lagi" mengubah pemenang.',
  extraModes: [
    { id: 'papan', icon: '🎲', label: 'Papan dan Program', desc: 'Papan 30 kotak dan program berjalan bersama. Pilih urutan dadu lembar kerja atau acak, program Dodi, aturan baru, dan ubah letak ular serta tangga', create: createBoard },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Kotak', desc: '2–4 tim menjadi pemain (giliran MOD n + 1). Sebelum bidak bergerak, tim menyebut kotak tujuannya menurut program', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act ular-tangga' });
    root.append(wrap);
    const A = main(); const H = main({ dodi: 'hapus' }); const S36 = main({ dodi: '36' }); const L6 = main({ lagi: 'dadu' }); const LG = main({ lagi: 'gerak' }); const P = main({ pantul: true });
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const gbp = (x) => `${x.giliran} · ${x.baru} · ${x.pos}`;
      const traceRows = (rows, idx) => idx.map((i) => { const x = rows[i]; const alt = [gbp(x), `${x.giliran % 2 + 1} · ${x.baru} · ${x.pos}`, `${x.giliran} · ${x.baru} · ${x.baru === x.pos ? x.pos + 1 : x.baru}`, `${x.giliran} · ${x.baru + 1} · ${x.pos}`]; return [`l${i}`, `Lemparan ${i + 1} · dadu ${x.dadu}`, [...new Set(alt)].sort(), gbp(x), x.ket ? `Keterangan: ${x.ket}.` : 'Tepat.']; });
      const code = (o, hl = []) => codeView(lines(o), { hl, cls: 'ut-kode' });
      if (r === 0) { wrap.append(board()); rowsChoose(wrap, ctx, { prompt: 'Larik penanda tujuan', rows: [['a7', 'Sesudah baris 1–2: tujuan[7] · tujuan[3]', ['7 · 3', '0 · 0', '7 · 12', '8 · 4'], '7 · 3'], ...ORDER.slice(1).map((k) => [`b${k}`, `Kotak ${k} (${LABEL[k]})`, [...new Set([`tujuan[${k}] ← ${PAPAN[k]}`, `tujuan[${PAPAN[k]}] ← ${k}`, `tujuan[${k}] ← ${k}`])].sort(), `tujuan[${k}] ← ${PAPAN[k]}`])], done: next }); }
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Raka ingin tanpa larik: JIKA baru = 3 MAKA baru ← 12 SELAIN ITU JIKA baru = 8 …', rows: [['c', 'Banyak cabang JIKA', ['7', '30', '4', '3'], '7'], ['o', 'Tangga baru 10 → 21 pada program OSIS', ['cukup tambah satu baris tujuan[10] ← 21; perulangan permainan tidak berubah', 'tambah satu cabang JIKA di dalam perulangan', 'ubah baris 18'], 'cukup tambah satu baris tujuan[10] ← 21; perulangan permainan tidak berubah'], ['r', '… pada program Raka', ['tambah satu cabang JIKA di dalam perulangan', 'cukup tambah satu baris tujuan[10] ← 21', 'tidak perlu diubah'], 'tambah satu cabang JIKA di dalam perulangan', 'Dengan larik, letak ular dan tangga adalah data yang terpisah dari aturan permainan.']], done: next });
      else if (r === 2) { wrap.append(code({})); const no = ['15', '16', '18', '19–20', '22']; rowsChoose(wrap, ctx, { prompt: 'Nomor baris untuk setiap bagian satu giliran', rows: [['d', 'Melempar dadu', no, '15'], ['b', 'Menghitung kotak baru', no, '16'], ['t', 'Naik tangga atau turun ular', no, '18'], ['m', 'Memeriksa pemenang', no, '19–20'], ['g', 'Berganti giliran', no, '22']], done: next }); }
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'giliran ← giliran MOD 2 + 1, dan baris 18', rows: [['1', 'giliran = 1 → 1 MOD 2 + 1', ['2', '1', '0', '3'], '2'], ['2', 'giliran = 2 → 2 MOD 2 + 1', ['1', '2', '3', '0'], '1', 'Giliran selalu bergantian 1, 2, 1, 2, …'], ['4', 'Untuk 4 pemain', ['tambah posisi[3] ← 0 dan posisi[4] ← 0; baris 22 menjadi giliran MOD 4 + 1', 'cukup ubah baris 22 menjadi giliran MOD 4', 'tambah dua perulangan SELAMA'], 'tambah posisi[3] ← 0 dan posisi[4] ← 0; baris 22 menjadi giliran MOD 4 + 1'], ['18', 'Baris 18 bekerja untuk semua jenis kotak karena', ['untuk kotak biasa tujuan[k] = k, untuk tangga dan ular larik memberi kotak ujungnya', 'baris 17 sudah memeriksa tangga', 'LEMPAR_DADU tidak pernah jatuh di ular'], 'untuk kotak biasa tujuan[k] = k, untuk tangga dan ular larik memberi kotak ujungnya']], done: next });
      else if (r === 4) { wrap.append(el('p', { class: 'ut-dadu-deret' }, `Urutan dadu: ${DADU.join(', ')}`), board(PAPAN, { posisi: [12, 0] })); rowsChoose(wrap, ctx, { prompt: 'Telusuri: giliran · baru · posisi sesudah baris 18 (lemparan 1: 1 · 3 · 12, tangga)', cls: 'ut-isi', rows: traceRows(A.rows, [1, 2, 3, 4, 5]), done: next }); }
      else if (r === 5) { const g6 = main({}, DADU.slice(0, 6)).g; wrap.append(el('p', { class: 'ut-dadu-deret' }, `Sesudah lemparan 6: Pemain 1 di ${g6.posisi[0]}, Pemain 2 di ${g6.posisi[1]}`), board(PAPAN, { posisi: g6.posisi }));
        rowsChoose(wrap, ctx, { prompt: 'Lanjutkan: giliran · baru · posisi', cls: 'ut-isi', rows: [...traceRows(A.rows, [6, 7, 8, 9, 10, 11]), ['w', 'Pemenang', ['Pemain 2, lemparan 12', 'Pemain 1, lemparan 11', 'Pemain 2, lemparan 10', 'belum ada'], `Pemain ${A.g.pemenang}, lemparan ${A.rows.length}`]], done: next }); }
      else if (r === 6) { wrap.append(table(A.rows)); const cnt = (p, w) => A.rows.filter((x) => x.giliran === p && x.ket.includes(w)).length;
        rowsChoose(wrap, ctx, { prompt: 'Membaca tabel jejak', rows: [['b', 'Baris 18 tidak dijalankan pada', ['lemparan 10: 28 + 4 = 32 lebih dari 30', 'lemparan 5: ada ular', 'lemparan 12: menang', 'lemparan 1: tangga'], 'lemparan 10: 28 + 4 = 32 lebih dari 30', 'Syarat baris 17 salah, jadi Pemain 2 tetap di kotak 28.'], ['p1', 'Pemain 1: tangga · ular', ['2 · 2', '2 · 1', '3 · 2', '1 · 2'], `${cnt(1, 'tangga')} · ${cnt(1, 'ular')}`], ['p2', 'Pemain 2: tangga · ular', ['1 · 0', '0 · 1', '1 · 1', '2 · 0'], `${cnt(2, 'tangga')} · ${cnt(2, 'ular')}`]], done: next }); }
      else if (r === 7) { wrap.append(el('p', { class: 'prompt' }, 'Program Dodi: baris 17 dihapus'), code({ dodi: 'hapus' }, hlOf({ dodi: 'hapus' }, ['p18'])), table(H.rows), el('p', { class: 'sk-galat' }, `⚠ Lemparan ${H.rows.length}: ${H.g.error}`));
        ask('Apa yang terjadi pada lemparan 10?', [['baru = 32 dan baris 18 membaca tujuan[32], padahal larik hanya 1 sampai 30: program berhenti dengan galat indeks di luar larik sebelum ada pemenang', true], ['Pemain 2 tetap di kotak 28 seperti biasa'], ['Pemain 2 menang karena melewati 30'], ['Pemain 2 kembali ke kotak 0']], 1, null, then(() => { wrap.append(table(S36.rows)); rowsChoose(wrap, ctx, { prompt: 'Dodi memperbesar larik: UNTUK k DARI 1 SAMPAI 36', rows: [['10', 'Lemparan 10 memindahkan Pemain 2 ke kotak', ['32', '28', '30', '34'], String(S36.rows[9].pos)], ['12', 'Sesudah lemparan 12, Pemain 2 di', ['34', '30', '32', '28'], String(S36.rows[11].pos)], ['m', 'Bisakah Pemain 2 menang?', ['tidak: posisinya sudah lewat 30 dan hanya bertambah', 'ya, bila dadu cukup kecil', 'ya, lewat ular'], 'tidak: posisinya sudah lewat 30 dan hanya bertambah'], ['c', 'Perbaikan yang benar', ['baris 17 yang asli: aturan "harus tepat" sekaligus menjaga indeks 1 sampai 30', 'larik 36 kotak', 'keduanya sama baiknya'], 'baris 17 yang asli: aturan "harus tepat" sekaligus menjaga indeks 1 sampai 30', 'Larik 36 kotak hanya menyembunyikan galatnya.']], done: next }); })); }
      else if (r === 8) ask('Aturan baru: dapat 6, lempar lagi. Lengkapi baris 21: SELAIN ITU JIKA … MAKA', [['dadu ≠ 6', true], ['dadu = 6'], ['baru ≠ 30'], ['giliran ≠ 6']], 2, code({}, [20, 21]), then(() => { wrap.append(code({ lagi: 'dadu' }, [20, 21])); rowsChoose(wrap, ctx, { prompt: 'Telusuri dengan aturan dapat 6, lempar lagi: giliran · baru · posisi', cls: 'ut-isi', rows: [...traceRows(L6.rows, [1, 2, 5, 7, 8, 10]), ['w', 'Pemenang sekarang', ['Pemain 1, lemparan 11', 'Pemain 2, lemparan 12', 'Pemain 2, lemparan 11'], `Pemain ${L6.g.pemenang}, lemparan ${L6.rows.length}`, 'Hasil dadu sama persis, tetapi satu aturan kecil mengubah pemenang.']], done: next }); }));
      else rowsChoose(wrap, ctx, { prompt: 'Lempar lagi hanya bila bergerak, dan tantangan pantul', rows: [['y', 'Lemparan 8: dadu 6 tetapi tidak bergerak. Menurut dadu ≠ 6, tetap lempar lagi?', ['ya', 'tidak'], 'ya'], ['s', 'Syarat baris 21 bila lempar lagi hanya saat bergerak', ['dadu ≠ 6 ATAU baru > 30', 'dadu ≠ 6 DAN baru > 30', 'dadu = 6 ATAU baru ≤ 30'], 'dadu ≠ 6 ATAU baru > 30'], ['w', 'Pemenang dengan aturan itu', ['Pemain 2, lemparan 11', 'Pemain 1, lemparan 11', 'Pemain 2, lemparan 12'], `Pemain ${LG.g.pemenang}, lemparan ${LG.rows.length}`],
        ['p4', 'Pantul: dari kotak 27 dengan dadu 4', ['31, pantul ke 29, ular ke 18', '27, tidak bergerak', '31, pantul ke 28', '30, menang'], `31, pantul ke 29, ular ke ${PAPAN[29]}`], ['pu', 'Dari kotak 27, turun lewat ular', ['pantul 2 dari 6 hasil dadu, tepat 1 dari 6', 'tepat 2 dari 6, pantul 1 dari 6', 'sama saja'], 'pantul 2 dari 6 hasil dadu, tepat 1 dari 6'], ['pw', 'Dengan urutan dadu soal 3 dan aturan pantul, pemenangnya', ['tidak berubah: Pemain 2, lemparan 12', 'berubah: Pemain 1, lemparan 11'], `tidak berubah: Pemain ${P.g.pemenang}, lemparan ${P.rows.length}`, 'Lemparan 10 (28 + 4 = 32) memantul ke 28, sama dengan tidak bergerak.']], done: next });
    }
    render();
  },
};

function createBoard(root, ctx) {
  const wrap = el('div', { class: 'act ular-tangga' });
  root.append(wrap);
  let papan = { ...PAPAN }; let o = { n: 2, dodi: 'tidak', lagi: 'tidak', pantul: false }; let src = 'lk'; let g = mulai(2); let rows = []; let k = 0; let edit = false; let pick = null; let msg = ''; let dice = [...DADU];
  const opts = () => ({ ...o, papan });
  const reset = () => { g = mulai(o.n); rows = []; k = 0; msg = ''; dice = src === 'lk' ? [...DADU] : []; draw(); };
  const one = () => { if (g.pemenang || g.error) return false; let d; if (src === 'lk') { if (k >= dice.length) { msg = 'Urutan dadu lembar kerja sudah habis.'; return false; } d = dice[k]; } else d = 1 + Math.floor(Math.random() * 6); k++; g = lempar(g, d, opts()); rows.push(g.row); ctx.sound.tap(); return true; };
  const seg = (items, cur, set) => el('div', { class: 'seg' }, items.map(([v, t]) => onTap(el('button', { class: `seg-btn ${cur === v ? 'on' : ''}`, type: 'button' }, t), () => set(v))));
  const cell = (c) => {
    if (!edit) return;
    if (pick == null) { if (papan[c]) { delete papan[c]; msg = `Kotak ${c} kini kotak biasa: tujuan[${c}] ← ${c}.`; reset(); return; } if (c === 30) return; pick = c; msg = `Kotak awal ${c}. Ketuk kotak ujungnya.`; draw(); return; }
    if (c !== pick && !papan[c] && !Object.values(papan).includes(pick)) { papan[pick] = c; msg = `${c > pick ? 'Tangga' : 'Ular'} ${pick} → ${c}: cukup satu baris tujuan[${pick}] ← ${c}. Perulangan permainan tidak berubah.`; } else msg = 'Pilihan tidak bisa dipakai: ujung ular atau tangga tidak boleh di kotak awal ular atau tangga lain.';
    pick = null; reset();
  };
  function draw() {
    const last = g.row;
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Papan dan program'),
      el('div', { class: 'ut-atur' }, seg([['lk', 'urutan dadu lembar kerja'], ['acak', 'dadu acak']], src, (v) => { src = v; reset(); }), stepper(o.n, (v) => { o.n = v; reset(); }, { min: 2, max: 4, label: 'pemain' }),
        seg([['tidak', 'baris 17 asli'], ['hapus', 'Dodi: tanpa baris 17'], ['36', 'Dodi: larik 36']], o.dodi, (v) => { o.dodi = v; if (v !== 'tidak') o.pantul = false; reset(); })),
      el('div', { class: 'ut-atur' }, seg([['tidak', 'giliran biasa'], ['dadu', 'dapat 6, lempar lagi'], ['gerak', 'lempar lagi hanya bila bergerak']], o.lagi, (v) => { o.lagi = v; reset(); }),
        onTap(el('button', { class: `seg-btn ${o.pantul ? 'on' : ''}`, type: 'button' }, `${o.pantul ? '☑' : '☐'} pantul`), () => { o.pantul = !o.pantul; if (o.pantul) o.dodi = 'tidak'; reset(); }),
        onTap(el('button', { class: `seg-btn ${edit ? 'on' : ''}`, type: 'button' }, `✏️ ${edit ? 'selesai mengubah papan' : 'ubah papan'}`), () => { edit = !edit; pick = null; msg = edit ? 'Ketuk kotak awal lalu kotak ujung untuk menambah tangga atau ular. Ketuk kotak awal yang sudah ada untuk menghapusnya.' : ''; draw(); })),
      el('div', { class: 'ut-dua' },
        el('div', { class: 'ut-kiri' }, board(papan, { posisi: g.posisi, hl: last && !edit ? (typeof last.pos === 'number' ? last.pos : null) : null, onCell: cell, pick }),
          el('div', { class: 'ut-atur' }, button('🎲 Lempar', () => { one(); draw(); }, 'primary'), button('⏭ Sampai selesai', () => { for (let i = 0; i < 400 && one(); i++); draw(); }), button('↺ Ulang', reset)),
          g.error ? el('p', { class: 'sk-galat' }, `⚠ ${g.error}`) : g.pemenang ? el('p', { class: 'sk-beres' }, `Pemenang: Pemain ${g.pemenang} (lemparan ${rows.length})`) : null, msg ? el('p', { class: 'reveal info' }, msg) : null),
        el('div', { class: 'ut-kanan' }, codeView(lines(opts()), { hl: last ? hlOf(opts(), last.ex) : [], cls: 'ut-kode' }),
          el('div', { class: 'ut-var' }, el('span', null, el('small', null, 'dadu'), el('b', null, last ? String(last.dadu) : '–')), el('span', null, el('small', null, 'baru'), el('b', null, last ? String(last.baru) : '–')), el('span', null, el('small', null, 'giliran'), el('b', null, String(g.giliran))), el('span', null, el('small', null, 'posisi'), el('b', null, `[${g.posisi.join(', ')}]`))))),
      tujuanRow(papan, o.dodi === '36' ? 36 : 30), rows.length ? table(rows) : null].filter(Boolean));
  }
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act ular-tangga' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let g = mulai(nT); let throws = 0;
    function turn() {
      if (g.pemenang || throws >= 60) { if (g.pemenang) pts[g.pemenang - 1] += 3; finishBoard(wrap, ctx, { title: g.pemenang ? `Tim ${g.pemenang} tiba di kotak 30 (+3)` : 'Permainan selesai', pts, again: () => pickTeams(wrap, 'Tebak Kotak', start) }); return; }
      const t = g.giliran - 1; const d = 1 + Math.floor(Math.random() * 6); const after = lempar(g, d, { n: nT });
      const right = after.row.pos; const baru = after.row.baru; const dari = g.posisi[t];
      const cands = [...new Set([right, baru <= 30 ? baru : dari, dari, Math.min(30, baru + 1), Math.max(1, baru - 1)])].filter((x) => typeof x === 'number').slice(0, 4).sort((a, b) => a - b);
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1} di kotak ${dari} mendapat dadu ${d}. Menurut program, di kotak mana bidaknya berhenti?`);
      wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Giliran Tim ${t + 1} · giliran MOD ${nT} + 1 · dadu ${'⚀⚁⚂⚃⚄⚅'[d - 1]}`), board(PAPAN, { posisi: g.posisi }),
        el('div', { class: 'seg ut-tebak' }, cands.map((c) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `kotak ${c}`), () => {
          const ok = c === right; if (ok) { pts[t]++; ctx.sound.good(); } else ctx.sound.bad();
          g = after; throws++;
          wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: ${dari} + ${d} = ${baru}${after.row.ket ? ` (${after.row.ket})` : ''} → kotak ${right}`), board(PAPAN, { posisi: g.posisi, hl: right }), msg);
          say(msg, ok ? '' : 'bad', ok ? `Tepat, Tim ${t + 1} +1.` : `Belum tepat: ${baru > 30 ? 'lebih dari 30, jadi bidak tidak bergerak' : `tujuan[${baru}] = ${right}`}.`);
          setTimeout(turn, 3000);
        }))), msg);
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Kotak', start);
}
