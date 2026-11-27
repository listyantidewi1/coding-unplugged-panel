// Mencari Rute Angkot dengan BFS — SMA/SMK (16–18 tahun), coding. The Wanasari
// angkot network as an adjacency dictionary built from the route data, BFS with
// a queue and an asal record, rebuilding the path, BFS layers, Dodi's stack
// version, Rudi's version without the asal check (stopped by a step limit), and
// BFS limited to two rides. The JS search mirrors lines 10–37 exactly.

import { el, onTap, button, shake } from '../core/util.js';
import { misiHead, fill } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode } from './smp-kit.js';
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
    const wrap = el('div', { class: 'act bfs-angkot ba-utama bm-main' });
    root.append(wrap);
    const graf = bangunGraf();
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 2800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (no, judul, tujuan) => wrap.append(misiHead(no, judul, tujuan, '🚐'));
      if (r === 0 || r === 1) {
        const h = r === 0 ? 'Terminal' : 'Pasar';
        head(1, 'Kartu Tetangga', `Susun kartu tetangga ${h}: halte yang bisa dicapai dengan sekali naik. Ketuk halte di peta sesuai urutan program membangunnya (trayek A sampai F, halte sesuai urutan trayek).`);
        neighbourCard(wrap, ctx, graf, h, () => next());
      } else if (r === 2 || r === 3 || r === 5) {
        const [awal, tujuan] = r === 5 ? ['SMA', 'Kampus'] : ['Terminal', 'Desa'];
        head(2, 'Mesin BFS', r === 2 ? `Jadilah mesin BFS dari ${awal} ke ${tujuan}. Ambil kartu terdepan antrean, lalu masukkan tetangga barunya ke belakang dan pasang panah asal. Jalankan 5 putaran.`
          : r === 3 ? `Lanjutkan mesin BFS ${awal} → ${tujuan} dari putaran 6 sampai ${tujuan} diambil dari antrean.` : `Penumpang baru: dari ${awal} ke ${tujuan}. Jalankan mesin BFS sampai ${tujuan} diambil.`);
        bfsMachine(wrap, ctx, { graf, awal, tujuan, from: r === 3 ? 5 : 0, until: r === 2 ? 5 : Infinity, onEnd(e) {
          if (e.done) say(e.msg, '', `${tujuan} diambil pada pengambilan ke-${e.pops}. Mesin berhenti (baris 4). Panah asal kini menunjuk jalan pulang.`);
          else say(e.msg, '', `5 putaran selesai. Antrean: ${e.q.join(', ')}. Halte yang masuk lebih dulu diambil lebih dulu.`);
          next(3600);
        } });
      } else if (r === 4) {
        head(3, 'Ikuti Panah', 'Mesin BFS sudah selesai. Mulai dari Desa, ketuk halte yang ditunjuk panah asal sampai Terminal, lalu pilih angkot untuk setiap naik.');
        followArrows(wrap, ctx, graf, 'Terminal', 'Desa', () => next(4200));
      } else if (r === 6 || r === 7) {
        head(4, 'Dua Mesin Rusak', 'Mesin BFS ini rusak. Perhatikan mesinnya berjalan, lalu tebak kerusakannya: mesin Dodi atau mesin Rudi?');
        sabotage(wrap, ctx, graf, r === 6 ? 'dodi' : 'rudi', () => next(5200));
      } else if (r === 8) {
        head(5, 'Wilayah Sekali Pindah', 'Ketuk semua halte yang bisa dicapai dari Terminal dengan paling banyak dua kali naik (sekali pindah), lalu Periksa.');
        const H = dalamDuaNaik(graf, 'Terminal'); const on = new Set(); let fin = false;
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk halte untuk menandai atau membatalkan.');
        const box = el('div', { class: 'bm-peta' });
        const draw = () => fill(box, peta({ kelas: (h) => (h === 'Terminal' ? 'awal' : on.has(h) ? (fin && !H.includes(h) ? 'dodi' : 'jalur') : ''), onPick: fin ? null : (h) => { if (h === 'Terminal') return; on.has(h) ? on.delete(h) : on.add(h); ctx.sound.tap(); draw(); } }));
        draw();
        wrap.append(box, el('div', { class: 'kode-baris' }, button('Periksa', () => {
          if (fin) return;
          const miss = H.filter((h) => !on.has(h)); const extra = [...on].filter((h) => !H.includes(h));
          if (miss.length || extra.length) { ctx.mistake(); shake(box); say(msg, 'bad', `Belum tepat: ${extra.length ? `${extra.join(', ')} perlu lebih dari dua kali naik. ` : ''}${miss.length ? `Masih ada ${miss.length} halte yang terlewat.` : ''}`); return; }
          fin = true; ctx.sound.good(); draw(); say(msg, '', `Tepat: ${H.length} halte. Hanya Desa dan Taman yang perlu tiga kali naik. BFS menemukan halte lapis demi lapis: 1 naik, lalu 2 naik.`); next(4200);
        }, 'primary')), msg);
      } else {
        head(6, 'Hari Minggu', 'Trayek D libur. Tunjukkan rute Terminal ke Pelabuhan dengan naik paling sedikit: ketuk halte satu per satu, setiap ketukan = sekali naik angkot yang beroperasi.');
        sundayRoute(wrap, ctx, () => next(4200));
      }
    }
    render();
  },
};

const KODE_MESIN = ['antrean = deque([awal])', 'while antrean:', '    s = antrean.popleft()', '    if s == tujuan: break', '    for t in graf[s]:', '        if t not in asal:', '            asal[t] = s', '            antrean.append(t)'];

// The queue lane: cards enter at the back (right) and leave from the front (left).
function lane(q, { onTap: tap = null, judul = 'antrean: ambil dari depan ⟵ masuk dari belakang' } = {}) {
  return el('div', { class: 'bm-lajur' }, el('small', null, judul),
    el('div', { class: 'bm-kartu-kartu' }, q.length ? q.map((h, i) => { const b = el('button', { type: 'button', class: `bm-kartu ${i === 0 ? 'depan' : ''}` }, h); if (tap) onTap(b, () => tap(h, i)); else b.disabled = true; return b; }) : el('i', null, 'kosong')));
}

// Tap the stops of graf[h] in the order the program appends them.
function neighbourCard(host, ctx, graf, h, done) {
  const want = graf[h]; const got = [];
  const msg = el('p', { class: 'reveal hint' }, `Program membaca trayek A, B, C, … dan menambahkan halte lain di trayek yang memuat ${h}.`);
  const box = el('div', { class: 'bm-peta' });
  const card = el('div', { class: 'bm-kartu-tetangga' });
  const legend = el('div', { class: 'bm-legenda' }, Object.keys(TRAYEK).map((k) => el('span', { style: { '--tr': WARNA[k][1] } }, el('b', null, k), ` ${TRAYEK[k].join(' – ')}`)));
  const draw = () => {
    fill(box, peta({ kelas: (x) => (x === h ? 'kini' : got.includes(x) ? 'jalur' : ''), onPick: got.length === want.length ? null : pick }));
    fill(card, el('b', null, `graf["${h}"] = `), el('span', { class: 'bm-daftar' }, '[', ...want.map((x, i) => el('span', { class: i < got.length ? 'isi' : 'kosong' }, i < got.length ? `"${x}"` : '___')), ']'));
  };
  function pick(x) {
    const nx = want[got.length];
    if (x === h || got.includes(x)) return;
    if (x !== nx) {
      ctx.mistake(); shake(box);
      if (!want.includes(x)) say(msg, 'bad', `${x} tidak satu trayek dengan ${h}.`);
      else { const k = Object.keys(TRAYEK).find((t) => TRAYEK[t].includes(h) && TRAYEK[t].includes(x)); say(msg, 'bad', `${x} memang tetangga (trayek ${k}), tetapi program belum sampai di sana. Baca trayek dari A dan halte dari kiri.`); }
      return;
    }
    got.push(x); ctx.sound.tap(); msg.className = 'reveal hint'; draw();
    if (got.length === want.length) { ctx.sound.good(); say(msg, '', `graf["${h}"] punya ${want.length} tetangga. Urutan ini menentukan urutan halte masuk antrean BFS nanti.`); done(); }
  }
  draw();
  host.append(el('div', { class: 'bm-dua' }, box, el('div', { class: 'bm-samping' }, card, legend)), msg);
}

// The student is the BFS machine. Checks every pop and every append against the real run.
function bfsMachine(host, ctx, { graf, awal, tujuan, from = 0, until = Infinity, onEnd }) {
  const R = cariRute(graf, awal, tujuan); const J = jarakDari(graf, awal);
  let q = from ? [...R.steps[from - 1].q] : [awal];
  let asal = from ? { ...R.steps[from - 1].asal } : { [awal]: null };
  let pops = from; let s = null; let todo = []; let baru = []; let over = false;
  const msg = el('p', { class: 'reveal hint' }, 'Ketuk kartu terdepan antrean (paling kiri).');
  const box = el('div', { class: 'bm-peta' });
  const side = el('div', { class: 'bm-samping' });
  const line = () => (over ? 3 : !s ? 2 : todo.length ? 6 : 4);
  function draw() {
    fill(box, peta({ kelas: (h) => [h === awal ? 'awal' : '', h === tujuan ? 'tujuan' : '', h === s ? 'kini' : '', baru.includes(h) ? 'baru' : '', h in asal ? `lap${J[h]}` : ''].join(' '), sub: (h) => (h in asal ? (asal[h] ? `← ${asal[h]}` : 'awal') : ''), onPick: s && todo.length ? add : null }));
    fill(side, el('p', { class: 'bm-putaran' }, s ? `Putaran ${pops}: s = "${s}"` : `Putaran ${pops + 1}: ambil kartu`),
      lane(q, { onTap: s ? null : take }),
      s ? el('div', { class: 'bm-cek' }, el('small', null, `for t in graf["${s}"]:`), el('div', null, graf[s].map((t) => el('span', { class: t in asal && !baru.includes(t) ? 'lama' : baru.includes(t) ? 'baru' : 'tunggu' }, t)))) : null,
      pyCode(KODE_MESIN, { hl: [line()], cls: 'bm-kode' }));
  }
  function take(h, i) {
    if (over || s) return;
    if (i !== 0) { ctx.mistake(); shake(side); say(msg, 'bad', `Antrean melayani yang datang lebih dulu: ambil "${q[0]}" di depan, bukan "${h}".`); return; }
    q = q.slice(1); s = h; pops++; baru = []; ctx.sound.tap();
    if (s === tujuan) { over = true; draw(); ctx.sound.good(); onEnd({ done: true, pops, msg, q }); return; }
    todo = graf[s].filter((t) => !(t in asal));
    say(msg, 'hint', todo.length ? `Periksa tetangga "${s}" dari kiri. Ketuk di peta setiap halte yang belum punya panah asal.` : `Semua tetangga "${s}" sudah punya asal. Tidak ada yang masuk antrean.`);
    draw();
    if (!todo.length) setTimeout(endTurn, 1400);
  }
  function add(h) {
    if (!s || !todo.length || h === s) return;
    if (h === todo[0]) { asal[h] = s; q = [...q, h]; baru.push(h); todo.shift(); ctx.sound.tap(); msg.className = 'reveal hint'; draw(); if (!todo.length) setTimeout(endTurn, 700); return; }
    ctx.mistake(); shake(box);
    if (h in asal) say(msg, 'bad', `"${h}" sudah punya panah asal (${asal[h] ?? 'awal'}). Mesin melewatinya.`);
    else if (!graf[s].includes(h)) say(msg, 'bad', `"${h}" tidak bisa dicapai dengan sekali naik dari "${s}".`);
    else say(msg, 'bad', `Mesin membaca graf["${s}"] dari kiri: "${todo[0]}" dulu.`);
  }
  function endTurn() {
    s = null; baru = [];
    if (pops >= until) { over = true; draw(); onEnd({ done: false, pops, msg, q }); return; }
    say(msg, 'hint', 'Ketuk kartu terdepan antrean.'); draw();
  }
  draw();
  host.append(el('div', { class: 'bm-dua' }, box, side), msg);
}

// Walk the asal arrows back from the goal, then name the angkot for each ride.
function followArrows(host, ctx, graf, awal, tujuan, done) {
  const R = cariRute(graf, awal, tujuan); const want = [...R.jalur].reverse();
  let back = [tujuan]; let rides = []; const msg = el('p', { class: 'reveal hint' }, `Panah asal "${tujuan}" menunjuk ke mana?`);
  const box = el('div', { class: 'bm-peta' }); const side = el('div', { class: 'bm-samping' });
  const jalur = () => [...back].reverse();
  function draw() {
    const walking = back[back.length - 1] !== awal;
    fill(box, peta({ jalur: back.length > 1 ? jalur() : null, kelas: (h) => [h === awal ? 'awal' : '', h === tujuan ? 'tujuan' : '', back.includes(h) ? 'jalur' : h in R.asal ? 'ditemu' : ''].join(' '), sub: (h) => (h in R.asal ? (R.asal[h] ? `← ${R.asal[h]}` : 'awal') : ''), onPick: walking ? step : null }));
    const legs = jalur().slice(1).map((h, i) => [jalur()[i], h]);
    fill(side, el('p', { class: 'bm-putaran' }, `jalur = ${pyRepr(back)}`),
      walking ? null : el('div', { class: 'bm-naik' }, legs.map(([a, b], i) => el('div', null, el('span', null, `${a} → ${b}`), rides[i] ? el('b', { class: 'bm-tr', style: { '--tr': WARNA[rides[i]][1] } }, rides[i])
        : i === rides.length ? el('div', { class: 'seg' }, Object.keys(TRAYEK).map((k) => onTap(el('button', { class: 'seg-btn ba-tr on', type: 'button', style: { '--tr': WARNA[k][1] } }, k), () => ride(k, a, b)))) : null))));
  }
  function step(h) {
    const at = back[back.length - 1];
    if (h !== R.asal[at]) { ctx.mistake(); shake(box); say(msg, 'bad', `Panah di "${at}" bertuliskan ← ${R.asal[at]}. Ikuti panahnya.`); return; }
    back.push(h); ctx.sound.tap();
    if (h === awal) say(msg, 'hint', `Sampai di awal. jalur.reverse() memberi ${pyRepr(jalur())}. Sekarang pilih angkot untuk setiap naik.`);
    draw();
  }
  function ride(k, a, b) {
    if (!(TRAYEK[k].includes(a) && TRAYEK[k].includes(b))) { ctx.mistake(); shake(side); say(msg, 'bad', `Angkot ${k} tidak lewat ${a} dan ${b} sekaligus.`); return; }
    rides.push(k); ctx.sound.tap(); draw();
    if (rides.length === jalur().length - 1) { ctx.sound.good(); say(msg, '', `${petunjuk(jalur())} ${pindahText(jalur())}.`); done(); }
  }
  draw();
  host.append(el('div', { class: 'bm-dua' }, box, side), msg);
}

// Watch a broken machine run (Dodi: pop(), Rudi: no asal check), then name it.
function sabotage(host, ctx, graf, versi, done) {
  const R = cariRute(graf, 'Terminal', 'Desa', versi, 14);
  const box = el('div', { class: 'bm-peta' }); const side = el('div', { class: 'bm-samping' }); const msg = el('p', { class: 'reveal hint' }, 'Mesin berjalan sendiri…');
  const cards = el('div', { class: 'bm-sabot' });
  let k = 0; let fin = false;
  const show = () => {
    const st = R.steps[k - 1]; const asal = st ? st.asal : { Terminal: null };
    const end = k >= R.steps.length;
    fill(box, peta({ jalur: end && R.jalur ? R.jalur : null, kelas: (h) => [h === 'Terminal' ? 'awal' : '', h === 'Desa' ? 'tujuan' : '', st && h === st.s ? 'kini' : '', end && R.jalur?.includes(h) ? 'dodi' : h in asal ? 'ditemu' : ''].join(' '), sub: (h) => (h in asal ? (asal[h] ? `← ${asal[h]}` : 'awal') : '') }));
    fill(side, el('p', { class: 'bm-putaran' }, st ? `Pengambilan ${k}: "${st.s}"` : 'Mulai'), lane(st ? st.q : ['Terminal'], { judul: 'antrean' }),
      end ? el('p', { class: 'ba-hasil salah' }, R.jalur ? `Hasil: ${R.jalur.join(' – ')} (${pindahText(R.jalur)})` : `Mesin dihentikan: ${R.ambil} pengambilan, antrean ${R.steps[R.steps.length - 1].q.length} kartu. asal["Terminal"] = "${R.asal.Terminal}"`) : null);
  };
  const OPT = [['dodi', '🔧 Mesin Dodi', 's = antrean.pop()  (ambil dari belakang)'], ['rudi', '🔧 Mesin Rudi', 'tanpa baris  if t not in asal:'], ['bersih', '✅ Tidak rusak', 'mesin BFS biasa']];
  const timer = setInterval(() => { k++; show(); if (k >= R.steps.length) { clearInterval(timer); offer(); } }, 650);
  function offer() {
    say(msg, 'hint', R.jalur ? 'Mesin menemukan rute, tetapi naiknya lebih banyak dari BFS biasa (3 kali naik). Mesin siapa ini?' : 'Mesin tidak berhenti sendiri dan rantai asalnya berputar. Mesin siapa ini?');
    fill(cards, ...OPT.map(([v, t, d]) => onTap(el('button', { type: 'button', class: 'bm-sabot-kartu' }, el('b', null, t), el('code', null, d)), () => {
      if (fin) return;
      if (v !== versi) { ctx.mistake(); shake(cards); say(msg, 'bad', v === 'bersih' ? 'Mesin BFS biasa memberi Terminal – Pasar – Perumahan – Desa (3 kali naik) dan berhenti sendiri.' : 'Bukan. Perhatikan dari mana kartu diambil dan apakah halte bisa mendapat panah asal dua kali.'); return; }
      fin = true; ctx.sound.good();
      say(msg, '', versi === 'dodi' ? 'Tepat! pop() mengambil kartu terakhir, jadi mesin menyelam ke satu arah (seperti DFS) dan tidak menjamin naik paling sedikit.' : 'Tepat! Tanpa pemeriksaan asal, halte yang sudah ditemukan dimasukkan lagi dan panah asalnya ditimpa: asal["Terminal"] menjadi "Pasar", rantai asal berputar, antrean tidak pernah habis.');
      done();
    })));
  }
  show();
  host.append(el('div', { class: 'bm-dua' }, box, side), cards, msg);
  return () => clearInterval(timer);
}

// Sunday: route D is off. Tap stops ride by ride; fewest rides wins.
function sundayRoute(host, ctx, done) {
  const aktif = Object.keys(TRAYEK).filter((k) => k !== 'D'); const g2 = bangunGraf(aktif); const best = cariRute(g2, 'Terminal', 'Pelabuhan').jalur;
  let rute = ['Terminal']; let fin = false;
  const msg = el('p', { class: 'reveal hint' }, 'Garis putus-putus: trayek D tidak beroperasi.');
  const box = el('div', { class: 'bm-peta' }); const info = el('p', { class: 'bm-putaran' });
  const draw = () => { fill(box, peta({ aktif, jalur: rute.length > 1 ? rute : null, kelas: (h) => [h === 'Terminal' ? 'awal' : '', h === 'Pelabuhan' ? 'tujuan' : '', rute.includes(h) ? 'jalur' : ''].join(' '), onPick: fin ? null : pick })); info.textContent = `${rute.join(' – ')} · ${rute.length - 1} kali naik`; };
  function pick(h) {
    const last = rute[rute.length - 1];
    if (h === last) { if (rute.length > 1) { rute.pop(); draw(); } return; }
    if (!g2[last]?.includes(h)) { ctx.mistake(); shake(box); say(msg, 'bad', `Tidak ada angkot yang beroperasi langsung dari ${last} ke ${h} hari ini.`); return; }
    rute.push(h); ctx.sound.tap(); draw();
    if (h !== 'Pelabuhan') return;
    if (rute.length === best.length) { fin = true; ctx.sound.good(); say(msg, '', `Tepat, ${rute.length - 1} kali naik! Hari biasa cukup 2 kali (lewat Alun-alun dengan angkot D). Programnya cukup membangun ulang graf tanpa trayek D; fungsi BFS tidak berubah.`); done(); return; }
    ctx.mistake(); say(msg, 'bad', `Sampai dengan ${rute.length - 1} kali naik, tetapi bisa lebih sedikit. Coba lagi.`); setTimeout(() => { rute = ['Terminal']; draw(); }, 1800);
  }
  draw();
  host.append(box, info, msg);
}

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
