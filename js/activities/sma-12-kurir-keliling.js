// Kurir Keliling Enam Kota — SMA/SMK (16–18 tahun), perjalanan pedagang keliling.
// A courier leaves the warehouse, visits five towns once and returns: count
// the routes, run nearest neighbour, find the shortest of 60, improve a route
// by undoing crossing legs (2-opt), and watch (n − 1)!/2 explode.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const KOTA = { G: ['Gudang', 6, 9], A: ['Arjasari', 9, 8], B: ['Bumijaya', 17, 0], C: ['Cempakawangi', 30, 14], D: ['Dukuhsari', 14, 9], E: ['Endahrejo', 3, 4] };
export const JARAK = { GA: 3, GB: 14, GC: 25, GD: 8, GE: 6, AB: 11, AC: 22, AD: 5, AE: 7, BC: 19, BD: 9, BE: 15, CD: 17, CE: 29, DE: 12 };
const NAMA = { A: 'Arjasari', B: 'Bumijaya', C: 'Cempakawangi', D: 'Dukuhsari', E: 'Endahrejo', F: 'Fajarmulya', H: 'Harjosari', I: 'Indrakila', J: 'Jatiluhur', K: 'Karangsari' };

export function makeMap(kota, dist) {
  const ids = Object.keys(kota);
  return { kota, ids, d: (a, b) => (a === b ? 0 : dist(a, b)) };
}
export const PETA = makeMap(KOTA, (a, b) => JARAK[a + b] ?? JARAK[b + a]);

// Random map: the warehouse plus k towns on a 30 × 14 grid, straight-line km.
export function randomMap(rand, k) {
  const kota = {};
  const pts = [];
  const ids = ['G', ...Object.keys(NAMA).slice(0, k)];
  for (const id of ids) {
    for (;;) {
      const x = rand.int(0, 30); const y = rand.int(0, 14);
      if (pts.every(([u, v]) => Math.hypot(u - x, v - y) >= 4)) { pts.push([x, y]); kota[id] = [id === 'G' ? 'Gudang' : NAMA[id], x, y]; break; }
    }
  }
  return makeMap(kota, (a, b) => Math.max(1, Math.round(Math.hypot(kota[a][1] - kota[b][1], kota[a][2] - kota[b][2]))));
}

export const tourLen = (m, r) => r.reduce((s, c, i) => s + m.d(c, r[(i + 1) % r.length]), 0);
export const fmtRoute = (r, close = true) => [...r, ...(close ? [r[0]] : [])].join('–');
export const rotateTo = (r, c = 'G') => { const i = r.indexOf(c); return [...r.slice(i), ...r.slice(0, i)]; };
export const countRoutes = (n) => { let f = 1; for (let i = 2; i < n; i++) f *= i; return n < 3 ? 1 : f / 2; };

export function nearest(m, start = 'G') {
  const r = [start];
  while (r.length < m.ids.length) {
    const last = r[r.length - 1];
    r.push(m.ids.filter((c) => !r.includes(c)).sort((a, b) => m.d(last, a) - m.d(last, b))[0]);
  }
  return r;
}
// Exact shortest tour from the first id (Held–Karp).
export function shortest(m) {
  const ids = m.ids; const n = ids.length; const full = 1 << n;
  const D = Array.from({ length: full }, () => new Float64Array(n).fill(Infinity));
  const P = Array.from({ length: full }, () => new Int8Array(n).fill(-1));
  D[1][0] = 0;
  for (let s = 1; s < full; s += 2) for (let j = 0; j < n; j++) {
    if (!(s & (1 << j)) || D[s][j] === Infinity) continue;
    for (let k = 1; k < n; k++) { if (s & (1 << k)) continue; const t = s | (1 << k); const v = D[s][j] + m.d(ids[j], ids[k]); if (v < D[t][k]) { D[t][k] = v; P[t][k] = j; } }
  }
  let best = Infinity; let last = 0;
  for (let j = 1; j < n; j++) { const v = D[full - 1][j] + m.d(ids[j], ids[0]); if (v < best) { best = v; last = j; } }
  const route = []; let s = full - 1; let j = last;
  while (j >= 0) { route.unshift(ids[j]); const p = P[s][j]; s &= ~(1 << j); j = p; }
  return { best, route };
}
// Best improving 2-opt move: reverse r[i+1..j].
export function twoOpt(m, r) {
  const n = r.length; let best = null;
  for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = r[i]; const b = r[i + 1]; const c = r[j]; const d = r[(j + 1) % n];
    const gain = m.d(a, b) + m.d(c, d) - m.d(a, c) - m.d(b, d);
    if (gain > 0 && (!best || gain > best.gain)) best = { i, j, gain, route: [...r.slice(0, i + 1), ...r.slice(i + 1, j + 1).reverse(), ...r.slice(j + 1)] };
  }
  return best;
}
// Pairs of legs (index of leg start) whose straight lines cross on the map.
export function crossings(m, r) {
  const P = (c) => [m.kota[c][1], m.kota[c][2]];
  const ccw = (a, b, c) => (c[1] - a[1]) * (b[0] - a[0]) - (b[1] - a[1]) * (c[0] - a[0]);
  const out = []; const n = r.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = P(r[i]); const b = P(r[i + 1]); const c = P(r[j]); const d = P(r[(j + 1) % n]);
    if (ccw(a, b, c) * ccw(a, b, d) < 0 && ccw(c, d, a) * ccw(c, d, b) < 0) out.push([i, j]);
  }
  return out;
}

const X = (x) => 40 + x * 20;
const Y = (y) => 40 + (14 - y) * 20;
export function mapSvg(m, { route = [], closed = false, legs = [], tapLegs = false, red = [] } = {}) {
  const P = (c) => [X(m.kota[c][1]), Y(m.kota[c][2])];
  const n = route.length;
  const lines = route.slice(0, closed ? n : n - 1).map((c, i) => {
    const e = route[(i + 1) % n];
    const [x1, y1] = P(c); const [x2, y2] = P(e);
    const col = red.includes(i) ? '#dc2626' : legs.includes(i) ? '#f97316' : '#2563eb';
    const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
    return `<g ${tapLegs ? `data-l="${i}" class="kk-ruas"` : ''}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="26"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${legs.includes(i) || red.includes(i) ? 8 : 5}" stroke-linecap="round"/><circle cx="${mx}" cy="${my}" r="16" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${mx}" y="${my + 6}" font-size="17" font-weight="800" text-anchor="middle" fill="#111827">${m.d(c, e)}</text></g>`;
  });
  const dots = m.ids.map((c) => {
    const [x, y] = P(c); const on = route.includes(c); const last = route[n - 1] === c && !closed;
    return `<g data-c="${c}" class="kk-kota"><circle cx="${x}" cy="${y}" r="22" fill="transparent"/><circle cx="${x}" cy="${y}" r="17" fill="${c === 'G' ? '#fde047' : last ? '#fb923c' : on ? '#bfdbfe' : '#fff'}" stroke="#334155" stroke-width="2.5"/><text x="${x}" y="${y + 6}" font-size="17" font-weight="900" text-anchor="middle">${c}</text><text x="${x}" y="${y + (y > 300 ? -24 : 38)}" font-size="17" font-weight="700" text-anchor="middle" fill="#334155">${m.kota[c][0]}</text></g>`;
  });
  return `<svg viewBox="0 0 730 370" role="img" aria-label="Peta kota">${lines.join('')}${dots.join('')}</svg>`;
}
export const distTable = (m) => el('table', { class: 'kk-tabel' },
  el('tr', null, el('th', null, 'km'), m.ids.map((c) => el('th', null, c))),
  m.ids.map((a) => el('tr', null, el('th', null, a), m.ids.map((b) => el('td', null, a === b ? '—' : m.d(a, b))))));

// Route board: tap towns in order. rule: 'bebas' | 'nn' (nearest unvisited).
function routeBoard(host, ctx, { map: m, rule = 'bebas', start = 'G', table = true, onDone, onStep, onBad, locked = () => false }) {
  let route = [start];
  const box = el('div', { class: 'kk-peta' });
  const info = el('p', { class: 'reveal info' });
  const b = { get route() { return route; }, get done() { return route.length === m.ids.length; }, set(r) { route = [...r]; draw(); }, reset() { route = [start]; draw(); }, undo() { if (route.length > 1) { route = route.slice(0, -1); draw(); } }, draw };
  function draw() {
    const full = route.length === m.ids.length;
    box.innerHTML = mapSvg(m, { route, closed: full });
    const len = full ? tourLen(m, route) : route.slice(1).reduce((s, c, i) => s + m.d(route[i], c), 0);
    info.textContent = `${fmtRoute(route, full)} · ${len} km${full ? ' (kembali ke awal)' : ''}`;
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-c]');
    if (!g || locked() || route.length === m.ids.length) return;
    e.preventDefault();
    const c = g.dataset.c;
    const last = route[route.length - 1];
    if (route.includes(c)) { if (rule === 'bebas' && c === last && route.length > 1) b.undo(); return; }
    if (rule === 'nn') {
      const min = Math.min(...m.ids.filter((x) => !route.includes(x)).map((x) => m.d(last, x)));
      if (m.d(last, c) > min) {
        const best = m.ids.filter((x) => !route.includes(x) && m.d(last, x) === min);
        ctx.mistake(); shake(box);
        say(info, 'bad', `Dari ${last}, kota terdekat yang belum didatangi: ${best.join(' atau ')} (${min} km), bukan ${c} (${m.d(last, c)} km).`);
        if (onBad) onBad(c, m.d(last, c) - min);
        return;
      }
    }
    route = [...route, c];
    ctx.sound.tap();
    draw();
    if (onStep) onStep(c, m.d(last, c));
    if (route.length === m.ids.length && onDone) onDone(tourLen(m, route), route);
  });
  host.append(el('div', { class: 'kk-papan' }, box, table ? distTable(m) : null), info);
  draw();
  return b;
}

export default {
  id: 'sma-12-kurir-keliling',
  title: 'Kurir Keliling Enam Kota',
  topic: 'Perjalanan pedagang keliling: tetangga terdekat, mencoba semua rute, dan 2-opt',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🛵',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menghitung banyak rute dengan aturan perkalian, menjalankan heuristik tetangga terdekat, mencari rute terpendek, membandingkan hasil heuristik dengan rute terpendek, memperbaiki rute dengan membalik ruas yang bersilangan, dan menjelaskan pertumbuhan (n − 1)! : 2.',
  extraModes: [
    { id: 'peta', icon: '🗺️', label: 'Peta Rute', desc: 'Gambar rute sendiri, jalankan tetangga terdekat dari kota mana pun, perbaiki dengan 2-opt, tunjukkan rute terpendek, dan buat peta acak 5–10 kota', create: createMap },
    { id: 'giliran', icon: '🔁', label: 'Rute Bergiliran', desc: 'Tim bergantian menambah satu kota ke rute bersama; panjang ruas yang ditambahkan menjadi skor tim, skor terkecil menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kurir-keliling' });
    root.append(wrap);
    const NN = nearest(PETA);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const pic = (o = {}) => el('div', { class: 'kk-peta kecil', html: mapSvg(PETA, o) });
      const board = (prompt, hint, opts) => {
        const msg = el('p', { class: 'reveal hint' }, hint);
        wrap.append(el('p', { class: 'prompt' }, prompt));
        const b = routeBoard(wrap, ctx, { map: PETA, ...opts(msg) });
        wrap.append(msg);
        return b;
      };
      if (r === 0) ask('Kurir berangkat dari gudang, mendatangi A, B, C, D, E masing-masing sekali, lalu kembali. Berapa banyak urutan kota, dan berapa rute yang panjangnya mungkin berbeda?', [['120 urutan (5 × 4 × 3 × 2 × 1); 60 rute, karena setiap rute sama panjang dengan kebalikannya', true], ['25 urutan; 25 rute'], ['120 urutan; 120 rute'], ['15 urutan; 5 rute']], 1, pic());
      else if (r === 1) board('Cara tetangga terdekat: dari gudang, selalu ke kota terdekat yang belum didatangi.', 'Ketuk kota satu per satu. Lihat tabel jarak.', (msg) => ({ rule: 'nn', onDone(t) { say(msg, '', `Rute ${fmtRoute(NN)}: ${t} km. Ruas terakhir E–C (29) dan C–G (25) sangat panjang.`); next(); } }));
      else if (r === 2) {
        let tries = 0;
        const b = board('Cari rute terpendek dari gudang dan kembali.', 'Ketuk kota berurutan. Ketuk kota terakhir lagi untuk membatalkannya.', (msg) => ({
          onDone(t) {
            if (t === 65) { say(msg, '', `${fmtRoute(b.route)}: 65 km. Ini rute terpendek, satu-satunya (bersama kebalikannya).`); next(); return; }
            tries++; ctx.mistake();
            say(msg, 'bad', `${t} km. Masih ada rute yang lebih pendek.${tries >= 2 ? ' Petunjuk: mulai G–A–D, lalu ke kota terjauh dulu.' : ''}`);
            setTimeout(() => b.reset(), 1800);
          },
        }));
      } else if (r === 3) ask('Pasangan (A, E): kota kedua A, kota terakhir E. Dari enam rute ini, mana yang terpendek?', [['G–A–D–C–B–E–G: 3 + 5 + 17 + 19 + 15 + 6 = 65 km', true], ['G–A–B–C–D–E–G: 68 km'], ['G–A–C–B–D–E–G: 71 km'], ['G–A–B–D–C–E–G: 75 km']], 1, distTable(PETA));
      else if (r === 4) ask('Tetangga terdekat 86 km, rute terpendek 65 km. Berapa selisihnya, dan di mana cara tetangga terdekat "terjebak"?', [['21 km (sekitar 32 %); di akhir, karena C yang jauh tersisa sehingga harus E–C (29) lalu C–G (25)', true], ['21 km (sekitar 24 %); di awal, karena G–A terlalu pendek'], ['11 km (sekitar 17 %); di tengah'], ['Tidak ada selisih']], 1, pic({ route: NN, closed: true, legs: [4, 5] }));
      else if (r === 5) {
        board('Jalankan tetangga terdekat yang dimulai dari Dukuhsari (D).', 'Dari D, selalu ke kota terdekat yang belum didatangi.', (msg) => ({ rule: 'nn', start: 'D', onDone(t, rt) {
          say(msg, '', `${fmtRoute(rt)}: ${t} km. Ditulis dari gudang: ${fmtRoute(rotateTo(rt))}.`);
          setTimeout(then(() => ask('Mulai dari D memberi 65 km. Apakah "coba setiap kota awal lalu pilih yang terbaik" selalu menemukan rute terpendek?', [['Tidak: sering memperbaiki hasil, tetapi tidak dijamin. Di peta ini mulai dari A, B, atau E hanya memberi 71 km', true], ['Ya, selalu'], ['Ya, asal mulai dari gudang'], ['Tidak pernah memperbaiki hasil']], 1, pic({ route: rotateTo(nearest(PETA, 'D')), closed: true }))), 2200);
        } }));
      } else if (r === 6) ask('Untuk n kota (termasuk gudang) ada (n − 1)! : 2 rute. Komputer memeriksa 10⁸ rute per detik. Berapa rute untuk 10 kota, dan berapa lama mencoba semua untuk 15 dan 20 kota?', [['181.440 rute; 15 kota ≈ 7 menit; 20 kota ≈ 19 tahun', true], ['200 rute; 15 kota sekejap; 20 kota 1 detik'], ['181.440 rute; 15 kota ≈ 7 menit; 20 kota ≈ 9 menit'], ['3.628.800 rute; 15 kota ≈ 1 tahun; 20 kota ≈ 2 tahun']], 1,
        el('div', { class: 'au-status' }, [8, 10, 15, 20, 30].map((n) => `${n} kota: ${n < 15 ? fmtNum(countRoutes(n)) : '?'}`).join(' · ')));
      else if (r === 7) ask('Kurir di kota besar mengantar 40 paket sehari. Mengapa aplikasinya memakai cara seperti tetangga terdekat, bukan mencoba semua rute?', [['41 tempat memberi rute jauh lebih banyak dari 30 kota (≈ 10³⁰ tahun); heuristik cepat dan hasilnya cukup baik', true], ['Karena tetangga terdekat selalu terpendek'], ['Karena komputer tidak bisa menjumlah jarak'], ['Karena 40 paket hanya punya 40 rute']]);
      else if (r === 8) {
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk dua ruas yang bersilangan.');
        const box = el('div', { class: 'kk-peta' });
        const cross = crossings(PETA, NN)[0];
        let picked = [];
        const draw = () => { box.innerHTML = mapSvg(PETA, { route: NN, closed: true, tapLegs: true, legs: picked }); };
        box.addEventListener('pointerdown', (e) => {
          const g = e.target.closest('[data-l]');
          if (!g || solved || picked.length === 2) return;
          e.preventDefault();
          const i = Number(g.dataset.l);
          if (picked.includes(i)) return;
          if (!cross.includes(i)) { ctx.mistake(); shake(box); say(msg, 'bad', `Ruas ${NN[i]}–${NN[(i + 1) % 6]} tidak bersilangan dengan ruas lain.`); return; }
          picked.push(i); ctx.sound.tap(); draw();
          if (picked.length === 2) {
            const nr = [...NN.slice(0, cross[0] + 1), ...NN.slice(cross[0] + 1, cross[1] + 1).reverse(), ...NN.slice(cross[1] + 1)];
            setTimeout(() => { box.innerHTML = mapSvg(PETA, { route: nr, closed: true }); say(msg, '', `Balik urutan B–E: ${fmtRoute(nr)} = ${tourLen(PETA, nr)} km, 7 km lebih pendek dari 86 km.`); }, 900);
            setTimeout(then(() => ask('Mengapa rute yang ruasnya bersilangan hampir selalu bisa diperpendek?', [['Dua ruas yang bersilangan adalah diagonal segi empat; menggantinya dengan dua sisi yang berhadapan lebih pendek (ketaksamaan segitiga). Langkah ini disebut 2-opt', true], ['Karena kota di tengah dilewati dua kali'], ['Karena ruas bersilangan selalu lebih murah'], ['Tidak bisa; bersilangan justru lebih pendek']], 1, pic({ route: nr, closed: true }))), 3600);
          }
        });
        draw();
        wrap.append(el('p', { class: 'prompt' }, `Tantangan: rute tetangga terdekat ${fmtRoute(NN)} punya dua ruas yang bersilangan.`), box, msg);
      } else ask('Memeriksa "apakah rute ini kurang dari 70 km?" mudah. Mencari rute terpendek untuk banyak kota sulit. Persoalan ini mirip yang mana?', [['Pembagian karung adil (Mudah Dicek, Sulit Dicari): mudah diperiksa, sangat sulit dicari', true], ['Mengurutkan angka: mudah dicari dan mudah diperiksa'], ['Menjumlah dua bilangan'], ['Tidak ada persoalan lain yang mirip']]);
    }
    render();
  },
};

function createMap(root, ctx) {
  const wrap = el('div', { class: 'act kurir-keliling' });
  root.append(wrap);
  let m = PETA;
  let k = 7;
  const host = el('div', { class: 'kk-host' });
  const out = el('p', { class: 'reveal hint' });
  const tools = el('div', { class: 'seg' });
  const starts = el('div', { class: 'seg' });
  let b;
  function reset() {
    host.replaceChildren();
    b = routeBoard(host, ctx, { map: m, onDone: (t) => { const s = shortest(m).best; if (t === s) ctx.sound.win(); say(out, t === s ? '' : 'bad', `${t} km${t === s ? ': terpendek!' : `; terpendek ${s} km`}.`); } });
    out.textContent = `${m.ids.length} kota: ${fmtNum(countRoutes(m.ids.length))} rute berbeda.`;
    starts.replaceChildren('Tetangga terdekat dari: ', ...m.ids.map((c) => onTap(el('button', { class: 'seg-btn', type: 'button' }, c), () => { const r = rotateTo(nearest(m, c)); b.set(r); say(out, '', `Tetangga terdekat dari ${c}: ${tourLen(m, r)} km (ditulis dari gudang).`); })));
  }
  tools.append(
    onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Peta lembar kerja'), () => { m = PETA; reset(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Peta acak'), () => { m = randomMap(ctx.rand, k); reset(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { k = Math.max(4, k - 1); m = randomMap(ctx.rand, k); reset(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { k = Math.min(9, k + 1); m = randomMap(ctx.rand, k); reset(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Ulang'), () => { b.reset(); out.textContent = ''; }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🔧 Perbaiki (2-opt)'), () => {
      if (!b.done) { say(out, 'bad', 'Lengkapi rute dulu.'); return; }
      const mv = twoOpt(m, b.route);
      if (!mv) { say(out, '', `Tidak ada pembalikan yang memperpendek rute (${tourLen(m, b.route)} km). 2-opt berhenti di sini.`); return; }
      b.set(mv.route); say(out, '', `Balik ${b.route.slice(mv.i + 1, mv.j + 1).reverse().join('–')}: hemat ${mv.gain} km, sekarang ${tourLen(m, mv.route)} km.`);
    }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🏁 Terpendek'), () => { const s = shortest(m); b.set(s.route); say(out, '', `Terpendek: ${fmtRoute(s.route)} = ${s.best} km, dicari di antara ${fmtNum(countRoutes(m.ids.length))} rute.`); }));
  wrap.append(el('p', { class: 'prompt' }, 'Peta rute kurir'), tools, starts, host, out);
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kurir-keliling' });
  root.append(wrap);
  function start(n) {
    // k towns plus the return leg make k + 1 legs, shared evenly by n teams.
    const k = n === 3 ? 8 : 7;
    const m = randomMap(ctx.rand, k);
    const pts = Array(n).fill(0);
    let team = 0;
    const head = el('div');
    const msg = el('p', { class: 'reveal hint' }, 'Ketuk satu kota untuk ditambahkan ke rute. Panjang ruasnya menjadi skor timmu: makin kecil makin baik.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team, ' km'), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head);
    drawHead();
    routeBoard(wrap, ctx, {
      map: m,
      table: false,
      onStep(c, d) { pts[team] += d; team = (team + 1) % n; drawHead(); },
      onDone(t, rt) {
        const back = m.d(rt[rt.length - 1], 'G');
        pts[team] += back;
        const s = shortest(m).best;
        say(msg, '', `Tim ${team + 1} menempuh ruas kembali ke gudang (${back} km). Rute bersama ${t} km, terpendek ${s} km.`);
        setTimeout(() => finishBoard(wrap, ctx, { title: `Rute bersama ${t} km; terpendek ${s} km.`, pts, unit: 'km', low: true, again: () => pickTeams(wrap, 'Rute Bergiliran', start) }), 3200);
      },
    });
    wrap.append(msg);
  }
  pickTeams(wrap, 'Rute Bergiliran', start);
}
