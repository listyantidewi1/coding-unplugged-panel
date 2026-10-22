// Mencari Rute Angkot dengan BFS — SMA/SMK (16–18 tahun), coding. The Wanasari
// angkot network as an adjacency dictionary built from the route data, BFS with
// a queue and an asal record, rebuilding the path, BFS layers, Dodi's stack
// version, Rudi's version without the asal check (stopped by a step limit), and
// BFS limited to two rides. The JS search mirrors lines 10–37 exactly.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pickSet, pyCode } from './smp-kit.js';
import { pyRepr } from './mini-py.js';

export const TRAYEK = { A: ['Terminal', 'Pasar', 'Alun-alun', 'Stasiun'], B: ['Stasiun', 'SMA', 'Puskesmas'], C: ['Pasar', 'Kampus', 'Perumahan'], D: ['Alun-alun', 'Puskesmas', 'Pelabuhan'], E: ['Perumahan', 'Desa', 'Taman'], F: ['Pelabuhan', 'Taman', 'Desa'] };
export const WARNA = { A: ['kuning', '#eab308'], B: ['hijau', '#16a34a'], C: ['biru', '#2563eb'], D: ['merah', '#dc2626'], E: ['ungu', '#9333ea'], F: ['oranye', '#f97316'] };
export const HALTE = ['Terminal', 'Pasar', 'Alun-alun', 'Stasiun', 'Kampus', 'Perumahan', 'Puskesmas', 'Pelabuhan', 'SMA', 'Desa', 'Taman'];
const POS = { Terminal: [8, 24], Pasar: [24, 10], 'Alun-alun': [36, 30], Stasiun: [54, 14], SMA: [74, 8], Puskesmas: [64, 34], Pelabuhan: [88, 42], Kampus: [14, 44], Perumahan: [32, 54], Desa: [58, 54], Taman: [80, 56] };
const GESER = { A: 0, B: 0, C: 0, D: 0, E: -0.9, F: 0.9 };

export const KODE = ['from collections import deque', 'trayek = {', '    "A": ["Terminal", "Pasar", "Alun-alun", "Stasiun"],', '    "B": ["Stasiun", "SMA", "Puskesmas"],', '    "C": ["Pasar", "Kampus", "Perumahan"],', '    "D": ["Alun-alun", "Puskesmas", "Pelabuhan"],', '    "E": ["Perumahan", "Desa", "Taman"],', '    "F": ["Pelabuhan", "Taman", "Desa"],', '}',
  'graf = {}', 'for kode in trayek:', '    for h in trayek[kode]:', '        if h not in graf:', '            graf[h] = []', '        for lain in trayek[kode]:', '            if lain != h and lain not in graf[h]:', '                graf[h].append(lain)',
  'def cari_rute(awal, tujuan):', '    antrean = deque([awal])', '    asal = {awal: None}', '    while antrean:', '        sekarang = antrean.popleft()', '        if sekarang == tujuan:', '            break', '        for t in graf[sekarang]:', '            if t not in asal:', '                asal[t] = sekarang', '                antrean.append(t)', '    if tujuan not in asal:', '        return None', '    jalur = []', '    h = tujuan', '    while h is not None:', '        jalur.append(h)', '        h = asal[h]', '    jalur.reverse()', '    return jalur'];
export const DUA_NAIK = ['def dalam_dua_naik(awal):', '    jarak = {awal: 0}', '    antrean = deque([awal])', '    hasil = []', '    while antrean:', '        sekarang = antrean.popleft()', '        if jarak[sekarang] == 2:', '            continue', '        for t in graf[sekarang]:', '            if t not in jarak:', '                jarak[t] = jarak[sekarang] + 1', '                hasil.append(t)', '                antrean.append(t)', '    return hasil'];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));
const SEMUA = Object.keys(TRAYEK);

// Lines 10–17: every pair of stops on one route is joined, without duplicates.
export function bangunGraf(aktif = SEMUA) {
  const graf = {};
  for (const kode of SEMUA) {
    if (!aktif.includes(kode)) continue;
    for (const h of TRAYEK[kode]) { if (!graf[h]) graf[h] = []; for (const lain of TRAYEK[kode]) if (lain !== h && !graf[h].includes(lain)) graf[h].push(lain); }
  }
  return graf;
}

// Lines 18–37. versi: 'bfs' (popleft), 'dodi' (pop), 'rudi' (no "if t not in asal").
export function cariRute(graf, awal, tujuan, versi = 'bfs', batas = 500) {
  const antrean = [awal]; const asal = { [awal]: null }; const steps = []; let maxQ = 1; let ambil = 0; let berhenti = null;
  while (antrean.length) {
    const s = versi === 'dodi' ? antrean.pop() : antrean.shift(); ambil++;
    if (s === tujuan) { steps.push({ s, baru: [], q: [...antrean], asal: { ...asal }, tujuan: true }); break; }
    const baru = [];
    for (const t of graf[s] || []) if (versi === 'rudi' || !(t in asal)) { asal[t] = s; antrean.push(t); baru.push(t); }
    maxQ = Math.max(maxQ, antrean.length);
    steps.push({ s, baru, q: [...antrean], asal: { ...asal } });
    if (ambil >= batas) { berhenti = 'antrean'; break; }
  }
  let jalur = null; let rantai = null;
  if (!berhenti && tujuan in asal) {
    jalur = []; let h = tujuan;
    while (h !== null) { jalur.push(h); if (jalur.length > 40) { rantai = jalur.slice(0, 8); jalur = null; berhenti = 'rantai'; break; } h = asal[h]; }
    if (jalur) jalur.reverse();
  }
  return { steps, jalur, ambil, maxQ, asal, berhenti, rantai };
}
// Fewest rides from a stop to every stop (the BFS layers).
export function jarakDari(graf, awal) {
  const jarak = { [awal]: 0 }; const q = [awal];
  while (q.length) { const s = q.shift(); for (const t of graf[s] || []) if (!(t in jarak)) { jarak[t] = jarak[s] + 1; q.push(t); } }
  return jarak;
}
export function dalamDuaNaik(graf, awal) {
  const jarak = { [awal]: 0 }; const q = [awal]; const hasil = [];
  while (q.length) { const s = q.shift(); if (jarak[s] === 2) continue; for (const t of graf[s] || []) if (!(t in jarak)) { jarak[t] = jarak[s] + 1; hasil.push(t); q.push(t); } }
  return hasil;
}
// The route letter of each ride: the first active route that passes both stops.
export const trayekAntara = (a, b, aktif = SEMUA) => SEMUA.find((k) => aktif.includes(k) && TRAYEK[k].includes(a) && TRAYEK[k].includes(b));
export function petunjuk(jalur, aktif = SEMUA) {
  if (!jalur) return 'Tidak ada rute.';
  if (jalur.length === 1) return 'Sudah di tujuan.';
  const naik = jalur.slice(1).map((h, i) => `${trayekAntara(jalur[i], h, aktif)} sampai ${h}`);
  return `Naik angkot ${naik[0].replace(' sampai', ` dari ${jalur[0]} sampai`)}${naik.slice(1).map((x, i, a) => `${i === a.length - 1 ? ', lalu pindah ke angkot ' : ', pindah ke angkot '}${x}`).join('')}.`;
}
export const pindahText = (jalur) => (jalur ? `${jalur.length - 1} kali naik, ${Math.max(0, jalur.length - 2)} kali pindah` : '-');
const L = (xs) => pyRepr(xs);

// Map: route lines in SVG, stops as positioned buttons.
export function peta({ aktif = SEMUA, kelas = () => '', sub = () => '', onPick = null, jalur = null, cls = '' } = {}) {
  const svg = el('div', { class: 'ba-garis' });
  const seg = (a, b, d) => { const [x1, y1] = POS[a]; const [x2, y2] = POS[b]; const dx = x2 - x1; const dy = y2 - y1; const n = Math.hypot(dx, dy) || 1; return [x1 - (dy / n) * d, y1 + (dx / n) * d, x2 - (dy / n) * d, y2 + (dx / n) * d]; };
  const lines = SEMUA.map((k) => TRAYEK[k].slice(1).map((h, i) => { const [x1, y1, x2, y2] = seg(TRAYEK[k][i], h, GESER[k]); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WARNA[k][1]}" class="${aktif.includes(k) ? '' : 'mati'}"/>`; }).join('')).join('');
  const path = jalur && jalur.length > 1 ? `<polyline class="jalur" points="${jalur.map((h) => POS[h].join(',')).join(' ')}"/>` : '';
  svg.innerHTML = `<svg viewBox="0 0 100 64" preserveAspectRatio="none">${lines}${path}</svg>`;
  const labels = SEMUA.map((k) => { const [x1, y1] = POS[TRAYEK[k][0]]; const [x2, y2] = POS[TRAYEK[k][1]]; return el('span', { class: `ba-kode ${aktif.includes(k) ? '' : 'mati'}`, style: { left: `${(x1 + x2) / 2}%`, top: `${((y1 + y2) / 2 / 64) * 100}%`, background: WARNA[k][1] } }, k); });
  const nodes = HALTE.map((h) => { const n = el('button', { class: `ba-halte ${kelas(h)}`, type: 'button', style: { left: `${POS[h][0]}%`, top: `${(POS[h][1] / 64) * 100}%` } }, el('b', null, h), sub(h) ? el('small', null, sub(h)) : null); if (onPick) onTap(n, () => onPick(h)); else n.disabled = true; return n; });
  return el('div', { class: `ba-peta ${cls}` }, svg, ...labels, ...nodes);
}
const antreView = (q, judul = 'antrean') => el('div', { class: 'ba-antre' }, el('small', null, judul), el('div', { class: 'ba-kartu-baris' }, q.length ? q.map((h, i) => el('span', { class: `ba-kartu ${i === 0 ? 'depan' : ''}` }, h)) : el('i', null, 'kosong')));

export default {
  id: 'sma-46-bfs-angkot',
  title: 'Mencari Rute Angkot dengan BFS',
  topic: 'Graf dalam kode: dictionary daftar ketetanggaan, BFS dengan antrean dan catatan asal, menyusun jalur, lapisan BFS, serta akibat bug pada pencatatan simpul',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🚐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Bangun graf trayek angkot Wanasari, telusuri BFS dari Terminal ke Desa, susun rutenya, lalu selidiki versi tumpukan Dodi dan versi Rudi tanpa pemeriksaan asal.',
  extraModes: [
    { id: 'bfs', icon: '🌊', label: 'BFS Langkah demi Langkah', desc: 'Pilih halte awal dan tujuan, matikan trayek, lalu lihat antrean, asal, dan lapisan setiap halte', create: createSteps },
    { id: 'versi', icon: '🧪', label: 'Versi Kode', desc: 'Bandingkan BFS dengan antrean, versi tumpukan Dodi, dan versi Rudi tanpa pemeriksaan asal', create: createVersions },
    { id: 'giliran', icon: '🗺️', label: 'Tim Memilih Tujuan', desc: 'Satu tim memilih awal dan tujuan, tim lain mengetuk rute dengan pindah paling sedikit', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bfs-angkot ba-utama' });
    root.append(wrap);
    const graf = bangunGraf(); const R = cariRute(graf, 'Terminal', 'Desa'); const J = jarakDari(graf, 'Terminal');
    const stepRow = (k) => { const st = R.steps[k - 1]; const right = `${st.s} · ${st.baru.join(', ') || '—'}`; const other = R.steps[k] || R.steps[k - 2];
      const alt = [`${st.s} · ${graf[st.s].join(', ')}`, `${other.s} · ${st.baru.join(', ') || '—'}`, `${st.s} · ${st.baru.length ? '—' : graf[st.s].slice(-2).join(', ')}`];
      return [`p${k}`, `Putaran ${k}`, [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4), right]; };
    const qRow = (k) => { const q = R.steps[k - 1].q; const right = q.join(', ') || 'kosong'; const alt = [[R.steps[k - 1].s, ...q].join(', '), [...q].reverse().join(', '), q.slice(0, -1).join(', ') || 'kosong'];
      return [`q${k}`, `Isi antrean setelah putaran ${k}`, [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4), right]; };
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const layer = (h) => (h in J ? `lap${J[h]}` : '');
      if (r === 0) {
        wrap.append(el('div', { class: 'ba-dua' }, pyCode(KODE.slice(0, 17), { labels: lab(1, 17), cls: 'ba-kecil', hl: [15] }), peta({})));
        const dist = (h) => { const g = graf[h]; return [L(g), L([...g].reverse()), L([...g].sort()), L(g.slice(0, -1))]; };
        rowsChoose(wrap, ctx, { prompt: 'Membangun graf (baris 10–17)', cls: 'ba-isi', rows: [
          ...['Terminal', 'Pasar', 'Desa'].map((h) => [`g${h}`, `graf["${h}"]`, [...new Set(dist(h))], L(graf[h])]),
          ['b', 'Yang mencegah Taman tercatat dua kali di graf["Desa"]', ['lain not in graf[h]', 'lain != h', 'if h not in graf', 'for kode in trayek'], 'lain not in graf[h]'],
          ['c', 'Mengapa satu garis = satu kali naik?', ['semua halte di satu trayek saling terhubung langsung; untuk menghitung halte, hubungkan hanya halte yang bersebelahan', 'karena setiap trayek hanya punya dua halte', 'karena graf mencatat jarak dalam kilometer', 'karena BFS menghitung halte yang dilewati'], 'semua halte di satu trayek saling terhubung langsung; untuk menghitung halte, hubungkan hanya halte yang bersebelahan']], done: next });
      }
      else if (r === 1 || r === 2) {
        const upTo = r === 1 ? 5 : 10; const st = R.steps[upTo - 1];
        wrap.append(el('div', { class: 'ba-dua' }, peta({ kelas: (h) => (h in st.asal ? 'ditemu' : '') }), el('div', { class: 'ba-samping' }, pyCode(KODE.slice(17, 28), { labels: lab(18, 11), cls: 'ba-kecil' }), el('p', { class: 'ba-ket' }, 'Putaran 1: Terminal · Pasar, Alun-alun, Stasiun'))));
        rowsChoose(wrap, ctx, { prompt: `cari_rute("Terminal", "Desa"): sekarang · halte baru yang dicatat di asal`, cls: 'ba-isi', rows: r === 1 ? [2, 3, 4, 5].map(stepRow).concat([qRow(3)]) : [6, 7, 8, 9].map(stepRow).concat([qRow(6), ['t', 'Putaran 10', [`${R.steps[9].s} · tujuan, berhenti di baris 24`, `${R.steps[9].s} · Taman`, 'Taman · tujuan, berhenti di baris 24', `${R.steps[9].s} · Perumahan`], `${R.steps[9].s} · tujuan, berhenti di baris 24`]]), done: next });
      }
      else if (r === 3) {
        const pre = [...R.jalur].reverse();
        wrap.append(el('div', { class: 'ba-dua' }, peta({ kelas: (h) => (h === 'Terminal' ? 'awal' : h === 'Desa' ? 'tujuan' : '') }), pyCode(KODE.slice(28, 37), { labels: lab(29, 9), cls: 'ba-kecil' })));
        rowsChoose(wrap, ctx, { prompt: 'Menyusun rute dari catatan asal', cls: 'ba-isi', rows: [
          ...['Desa', 'Perumahan', 'Pasar'].map((h) => [`a${h}`, `asal["${h}"]`, [...new Set([pyRepr(R.asal[h], true), "'Taman'", "'Kampus'", "'Terminal'", "'Pelabuhan'", "'Pasar'"])].slice(0, 4), pyRepr(R.asal[h], true)]),
          ['s', 'jalur sebelum baris 36', [L(pre), L(R.jalur), L(['Desa', 'Taman', 'Pelabuhan', 'Terminal']), L(['Desa', 'Perumahan', 'Kampus', 'Pasar', 'Terminal'])], L(pre)],
          ['d', 'jalur sesudah baris 36', [L(R.jalur), L(pre), L(['Terminal', 'Alun-alun', 'Pelabuhan', 'Desa']), L(['Terminal', 'Desa'])], L(R.jalur)]], done: next });
      }
      else if (r === 4) {
        const lain = ['Terminal', 'Alun-alun', 'Pelabuhan', 'Desa'];
        wrap.append(peta({ jalur: R.jalur, kelas: (h) => (R.jalur.includes(h) ? 'jalur' : lain.includes(h) ? 'lain' : '') }));
        rowsChoose(wrap, ctx, { prompt: 'Petunjuk perjalanan Terminal → Desa', cls: 'ba-isi', rows: [
          ['p', 'Petunjuk', [petunjuk(R.jalur), 'Naik angkot A dari Terminal sampai Alun-alun, pindah ke angkot D sampai Pelabuhan, lalu pindah ke angkot F sampai Desa.', 'Naik angkot A dari Terminal sampai Pasar, lalu pindah ke angkot E sampai Desa.', 'Naik angkot C dari Terminal sampai Perumahan, lalu pindah ke angkot E sampai Desa.'], petunjuk(R.jalur)],
          ['n', 'Banyak naik dan pindah', [pindahText(R.jalur), '3 kali naik, 3 kali pindah', '4 kali naik, 3 kali pindah', '2 kali naik, 1 kali pindah'], pindahText(R.jalur)],
          ['l', 'Rute lain dengan banyak naik yang sama', ['Terminal – Alun-alun (A) – Pelabuhan (D) – Desa (F)', 'Terminal – Stasiun (A) – Puskesmas (B) – Pelabuhan (D) – Desa (F)', 'Terminal – Kampus (C) – Desa (E)', 'tidak ada rute lain'], 'Terminal – Alun-alun (A) – Pelabuhan (D) – Desa (F)'],
          ['w', 'Mengapa BFS memilih lewat Perumahan?', ['Pasar masuk antrean lebih dulu daripada Alun-alun, jadi Perumahan diambil sebelum Pelabuhan dan pertama menemukan Desa', 'karena rute lewat Perumahan lebih pendek dalam kilometer', 'karena BFS memilih nama halte menurut abjad', 'karena Pelabuhan tidak terhubung dengan Desa'], 'Pasar masuk antrean lebih dulu daripada Alun-alun, jadi Perumahan diambil sebelum Pelabuhan dan pertama menemukan Desa']], done: next });
      }
      else if (r === 5) {
        wrap.append(peta({ kelas: layer }));
        rowsChoose(wrap, ctx, { prompt: 'Banyak naik paling sedikit dari Terminal (Terminal = 0)', cls: 'ba-isi ba-angka', rows: HALTE.slice(1).map((h) => [`j${h}`, h, ['1', '2', '3', '4'], String(J[h])]), done: next });
      }
      else if (r === 6) {
        const D = cariRute(graf, 'Terminal', 'Desa', 'dodi');
        wrap.append(el('div', { class: 'ba-dua' }, peta({ jalur: D.jalur, kelas: (h) => (D.jalur.includes(h) ? 'dodi' : '') }), el('div', { class: 'ba-samping' }, pyCode(['        sekarang = antrean.pop()'], { labels: ['22'], cls: 'ba-kecil', warn: [0] }), el('p', { class: 'ba-hasil' }, L(D.jalur)))));
        rowsChoose(wrap, ctx, { prompt: 'Versi Dodi: pop() menggantikan popleft()', cls: 'ba-isi', rows: [
          ['n', 'Banyak naik rute Dodi', [`${D.jalur.length - 1} kali naik (${D.jalur.length - 2} kali pindah)`, '3 kali naik (2 kali pindah)', '5 kali naik (4 kali pindah)', '2 kali naik (1 kali pindah)'], `${D.jalur.length - 1} kali naik (${D.jalur.length - 2} kali pindah)`],
          ['w', 'Mengapa antrean menjamin naik paling sedikit?', ['antrean mengambil semua halte berjarak 1 sebelum berjarak 2, dan seterusnya; tumpukan mengambil yang terakhir ditemukan dan menyelam ke satu arah', 'antrean selalu lebih cepat daripada tumpukan', 'tumpukan tidak bisa menyimpan nama halte', 'pop() menghapus halte tujuan'], 'antrean mengambil semua halte berjarak 1 sebelum berjarak 2, dan seterusnya; tumpukan mengambil yang terakhir ditemukan dan menyelam ke satu arah']], done: next });
      }
      else if (r === 7) {
        const U = cariRute(graf, 'Terminal', 'Desa', 'rudi'); const t2 = pyRepr(cariRute(graf, 'Terminal', 'Desa', 'rudi', 2).asal.Terminal, true);
        wrap.append(el('div', { class: 'ba-dua' }, pyCode(KODE.slice(24, 35), { labels: lab(25, 11), cls: 'ba-kecil', warn: [1, 8, 9, 10] }), el('div', { class: 'ba-samping' }, el('p', { class: 'ba-ket' }, 'Versi Rudi: baris 26 dihapus'), el('p', { class: 'ba-hasil salah' }, `rantai asal: ${U.rantai.join(' → ')} → …`))));
        rowsChoose(wrap, ctx, { prompt: 'Versi Rudi tanpa if t not in asal:', cls: 'ba-isi', rows: [
          ['t', 'asal["Terminal"] setelah putaran 2', [t2, 'None', "'Alun-alun'", "'Stasiun'"], t2],
          ['l', 'Akibat bagi baris 33–35', ['rantai asal membentuk lingkaran, tidak pernah sampai None, perulangan berputar selamanya', 'jalur menjadi kosong', 'IndexError: pop from an empty deque', 'jalur tetap benar, hanya lebih lambat'], 'rantai asal membentuk lingkaran, tidak pernah sampai None, perulangan berputar selamanya'],
          ['a', 'Desa diambil pada pengambilan ke- · antrean terpanjang', [`${U.ambil} · ${U.maxQ} halte`, '10 · 5 halte', `${U.ambil} · 11 halte`, `10 · ${U.maxQ} halte`], `${U.ambil} · ${U.maxQ} halte`]], done: next });
      }
      else if (r === 8) {
        const H = dalamDuaNaik(graf, 'Terminal');
        wrap.append(el('div', { class: 'ba-dua' }, pyCode(DUA_NAIK, { cls: 'ba-kecil', hl: [1, 6, 7, 10] }), peta({ kelas: layer, sub: (h) => (h in J ? `naik ${J[h]}` : '') })));
        pickSet(wrap, ctx, { prompt: 'dalam_dua_naik("Terminal"): halte dengan paling banyak satu kali pindah', items: HALTE.slice(1).map((h) => [h, h]), right: H, why: `${L(H)}: ${H.length} halte. Hanya Desa dan Taman yang perlu dua kali pindah.`, done: next });
      }
      else {
        const aktif = SEMUA.filter((k) => k !== 'D'); const g2 = bangunGraf(aktif); const biasa = cariRute(graf, 'Terminal', 'Pelabuhan').jalur; const minggu = cariRute(g2, 'Terminal', 'Pelabuhan').jalur;
        wrap.append(peta({ aktif, jalur: minggu, kelas: (h) => (minggu.includes(h) ? 'jalur' : '') }));
        rowsChoose(wrap, ctx, { prompt: 'Tantangan: hari Minggu angkot D tidak beroperasi', cls: 'ba-isi', rows: [
          ['u', 'Yang perlu diubah di program', ['hapus baris 6 (trayek D) lalu bangun ulang graf; fungsi lain tetap', 'ubah fungsi cari_rute', 'hapus Pelabuhan dari graf', 'ganti deque dengan list'], 'hapus baris 6 (trayek D) lalu bangun ulang graf; fungsi lain tetap'],
          ['b', 'Hari biasa: Terminal → Pelabuhan', [L(biasa), L(minggu), L(['Terminal', 'Stasiun', 'Puskesmas', 'Pelabuhan']), L(['Terminal', 'Pelabuhan'])], L(biasa)],
          ['m', 'Hari Minggu: Terminal → Pelabuhan', [L(minggu), L(biasa), L(['Terminal', 'Pasar', 'Perumahan', 'Taman', 'Pelabuhan']), 'None'], L(minggu)],
          ['o', 'Bila ongkos trayek berbeda', ['BFS tidak menjamin termurah; pakai Dijkstra dengan ongkos sebagai bobot', 'BFS tetap memberi rute termurah', 'pakai versi tumpukan Dodi', 'tambahkan halte baru'], 'BFS tidak menjamin termurah; pakai Dijkstra dengan ongkos sebagai bobot']], done: next });
      }
    }
    render();
  },
};

// Pick start and goal, switch routes off, and step through the search.
function createSteps(root, ctx) {
  const wrap = el('div', { class: 'act bfs-angkot' });
  root.append(wrap);
  let aktif = [...SEMUA]; let awal = 'Terminal'; let tujuan = 'Desa'; let pilih = null; let k = 0; let versi = 'bfs'; let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const reset = () => { k = 0; stop(); };
  const draw = () => {
    const graf = bangunGraf(aktif); const R = cariRute(graf, awal, tujuan, versi, 60); const J = jarakDari(graf, awal); const n = R.steps.length; const st = k ? R.steps[k - 1] : null; const end = k >= n;
    const asal = st ? st.asal : { [awal]: null }; const q = st ? st.q : [awal];
    const kelas = (h) => [h === awal ? 'awal' : '', h === tujuan ? 'tujuan' : '', st && h === st.s ? 'kini' : '', st && st.baru.includes(h) ? 'baru' : '', h in asal && versi === 'bfs' && h in J ? `lap${J[h]}` : h in asal ? 'ditemu' : '', end && R.jalur?.includes(h) ? 'jalur' : ''].join(' ');
    const sub = (h) => (h in asal ? `asal: ${asal[h] ?? 'None'}` : '');
    const status = !st ? `antrean = deque(['${awal}'])` : st.tujuan ? `Putaran ${k}: ${st.s} adalah tujuan, berhenti di baris 24.` : `Putaran ${k}: ambil ${st.s}; baru: ${st.baru.join(', ') || '—'}`;
    let akhir = null;
    if (end) akhir = R.jalur ? el('p', { class: 'reveal good' }, `${L(R.jalur)} · ${pindahText(R.jalur)}. ${petunjuk(R.jalur, aktif)}`)
      : R.berhenti ? el('p', { class: 'reveal bad' }, R.berhenti === 'rantai' ? `Dihentikan oleh batas langkah: rantai asal berputar ${R.rantai.join(' → ')} → …` : `Dihentikan oleh batas langkah: sudah ${R.ambil} pengambilan dan antrean masih berisi ${R.steps[n - 1].q.length} halte.`)
        : el('p', { class: 'reveal bad' }, `${tujuan} tidak bisa dicapai: cari_rute mengembalikan None.`);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `BFS: ${awal} → ${tujuan}`),
      el('div', { class: 'ba-atur' }, el('div', { class: 'seg' }, SEMUA.map((t) => onTap(el('button', { class: `seg-btn ba-tr ${aktif.includes(t) ? 'on' : ''}`, type: 'button', style: { '--tr': WARNA[t][1] } }, t), () => { aktif = aktif.includes(t) ? aktif.filter((x) => x !== t) : SEMUA.filter((x) => x === t || aktif.includes(x)); reset(); draw(); }))),
        el('div', { class: 'seg' }, [['bfs', 'popleft()'], ['dodi', 'pop() Dodi'], ['rudi', 'tanpa cek Rudi']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${versi === v ? 'on' : ''}`, type: 'button' }, t), () => { versi = v; reset(); draw(); }))),
        button(pilih ? `Ketuk halte ${pilih}…` : '📍 Pilih awal dan tujuan', () => { pilih = 'awal'; reset(); draw(); })),
      el('div', { class: 'ba-dua lebar' }, peta({ aktif, kelas, sub, jalur: end ? R.jalur : null, onPick: pilih ? (h) => { if (pilih === 'awal') { awal = h; pilih = 'tujuan'; } else { tujuan = h; pilih = null; } reset(); draw(); } : null }),
        el('div', { class: 'ba-samping' }, antreView(q, versi === 'dodi' ? 'antrean (dipakai sebagai tumpukan, diambil dari kanan)' : 'antrean (diambil dari kiri)'), el('p', { class: 'ba-ket' }, status),
          el('div', { class: 'kode-baris' }, button('▶ Langkah', () => { if (k < n) { k++; draw(); } }, 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', () => { if (timer) { stop(); draw(); return; } timer = setInterval(() => { if (k >= n) { stop(); draw(); return; } k++; draw(); }, 800); draw(); }), button('↺ Ulang', () => { reset(); draw(); })),
          el('p', { class: 'ba-ket' }, `${k} dari ${n} pengambilan`), akhir)));
  };
  draw();
  return () => stop();
}

// Three versions side by side for the same start and goal.
function createVersions(root, ctx) {
  const wrap = el('div', { class: 'act bfs-angkot' });
  root.append(wrap);
  let awal = 'Terminal'; let tujuan = 'Desa'; let pilih = null;
  const VERSI = [['bfs', 'Antrean (BFS)', 'sekarang = antrean.popleft()'], ['dodi', 'Tumpukan (Dodi)', 'sekarang = antrean.pop()'], ['rudi', 'Tanpa pemeriksaan asal (Rudi)', 'baris 26 dihapus']];
  const draw = () => {
    const graf = bangunGraf();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Versi kode: ${awal} → ${tujuan}`),
      el('div', { class: 'ba-atur' }, button(pilih ? `Ketuk halte ${pilih}…` : '📍 Pilih awal dan tujuan', () => { pilih = 'awal'; draw(); })),
      ...(pilih ? [peta({ kelas: (h) => (h === awal ? 'awal' : h === tujuan ? 'tujuan' : ''), onPick: (h) => { if (pilih === 'awal') { awal = h; pilih = 'tujuan'; } else { tujuan = h; pilih = null; } draw(); } })] : []),
      el('div', { class: 'ba-tiga' }, VERSI.map(([v, judul, ubah]) => { const R = cariRute(graf, awal, tujuan, v, 300);
        return el('div', { class: `ba-versi ${R.jalur ? '' : 'salah'}` }, el('b', null, judul), el('code', null, ubah), peta({ jalur: R.jalur, kelas: (h) => (R.jalur?.includes(h) ? (v === 'bfs' ? 'jalur' : 'dodi') : ''), cls: 'mini' }),
          el('p', { class: 'ba-hasil' }, R.jalur ? L(R.jalur) : R.berhenti === 'rantai' ? `Dihentikan oleh batas langkah: rantai asal berputar ${R.rantai.slice(0, 6).join(' → ')} → …` : 'Dihentikan oleh batas langkah'),
          el('small', null, R.jalur ? pindahText(R.jalur) : ''), el('small', null, `${R.ambil} pengambilan · antrean terpanjang ${R.maxQ}`)); })));
  };
  draw();
}

// Team mode: one team picks start and goal, the next taps a route stop by stop.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act bfs-angkot' });
  root.append(wrap);
  const graf = bangunGraf();
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tim Memilih Tujuan selesai', pts, again: () => pickTeams(wrap, 'Tim Memilih Tujuan', start) }); return; }
      const boss = t % nT; let awal = null; let tujuan = null;
      const draw = () => wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, !awal ? `Tim ${boss + 1}: ketuk halte awal` : `Tim ${boss + 1}: ketuk halte tujuan`),
        peta({ kelas: (h) => (h === awal ? 'awal' : ''), onPick: (h) => { if (!awal) { awal = h; draw(); } else if (h !== awal) { tujuan = h; guess(boss, awal, tujuan); } } }));
      draw();
    }
    function guess(boss, awal, tujuan) {
      const who = (boss + 1) % nT; const best = cariRute(graf, awal, tujuan); const min = best.jalur.length - 1; let rute = [awal]; let fin = false;
      const msg = el('p', { class: 'reveal info' }, 'Ketuk halte satu per satu sesuai rute. Setiap halte harus bisa dicapai dengan sekali naik dari halte sebelumnya.');
      const draw = () => wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: rute ${awal} → ${tujuan} dengan pindah paling sedikit`),
        el('div', { class: 'ba-dua lebar' }, peta({ jalur: rute, kelas: (h) => [h === awal ? 'awal' : '', h === tujuan ? 'tujuan' : '', rute.includes(h) ? 'jalur' : ''].join(' '), onPick: fin ? null : (h) => { const last = rute[rute.length - 1]; if (h === last) return; if (!graf[last].includes(h)) { ctx.sound.bad(); say(msg, 'bad', `${h} tidak bisa dicapai dengan sekali naik dari ${last}.`); return; } rute.push(h); ctx.sound.tap(); draw(); } }),
          el('div', { class: 'ba-samping' }, el('p', { class: 'ba-hasil' }, rute.join(' – ')), el('p', { class: 'ba-ket' }, rute.length > 1 ? petunjuk(rute) : ' '),
            el('div', { class: 'kode-baris' }, button('⌫', () => { if (!fin && rute.length > 1) { rute.pop(); draw(); } }), button('Periksa', () => {
              if (fin) return; if (rute[rute.length - 1] !== tujuan) { say(msg, 'bad', `Rute belum sampai ${tujuan}.`); return; }
              fin = true; const naik = rute.length - 1; const ok = naik === min; if (ok) { pts[who] += 2; ctx.sound.good(); } else { ctx.mistake(); ctx.sound.bad(); }
              say(msg, ok ? 'good' : 'bad', ok ? `Tepat: ${naik} kali naik, paling sedikit. BFS memberi ${best.jalur.join(' – ')}. +2` : `Rutemu ${naik} kali naik, padahal bisa ${min} kali: ${best.jalur.join(' – ')}.`); draw();
            }, 'primary'), ...(fin ? [button('Lanjut ➜', () => { t++; step(); }, 'primary')] : [])), msg)));
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tim Memilih Tujuan', start);
}
