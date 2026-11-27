// Kurir Keliling Enam Kota — SMA/SMK (16–18 tahun), perjalanan pedagang keliling.
// A courier leaves the warehouse, visits five towns once and returns: count
// the routes, run nearest neighbour, find the shortest of 60, improve a route
// by undoing crossing legs (2-opt), and watch (n − 1)!/2 explode.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, gauge, stars } from './misi-kit.js';

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
    const wrap = el('div', { class: 'act kurir-keliling kr-main' });
    root.append(wrap);
    const NN = nearest(PETA);
    // Random variants: same seed in every race pane, so every team gets the same map.
    const acak = (k, needCross = false) => { for (let t = 0; t < 60; t++) { const m = randomMap(ctx.rand, k); if (!needCross || crossings(m, nearest(m)).length) return m; } return randomMap(ctx.rand, k); };
    const tankFor = (m) => Math.ceil(shortest(m).best * 1.08);
    const MAPS = { 7: acak(6), 8: acak(6, true), 9: acak(7) };
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 2600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (no, judul, tujuan) => wrap.append(misiHead(no, judul, tujuan, '🛵'));
      if (r === 0) {
        head(1, 'Kurir Malas', 'Kurir selalu ke kota terdekat yang belum didatangi. Ketuk kotanya satu per satu, lalu pulang ke Gudang.');
        courier(wrap, ctx, { map: PETA, tank: 70, rule: 'nn', onEnd(e) {
          if (e.stalled) say(e.msg, 'bad', `Mogok! Rute ${fmtRoute(e.route)} butuh ${tourLen(PETA, e.route)} km. Bensin habis di ruas ${e.at}, ${e.short} km sebelum ${e.home}.`);
          next(4200);
        } });
      } else if (r === 1 || r === 7 || r === 9) {
        const m = r === 1 ? PETA : MAPS[r]; const tank = r === 1 ? 70 : tankFor(m); const best = shortest(m).best;
        head(r === 1 ? 2 : r === 7 ? 6 : 8, 'Rute Hemat Bensin', `Susun rute sendiri. Tangki ${tank} km: pulang ke Gudang sebelum bensin habis.${r > 1 ? ' Peta baru!' : ''}`);
        courier(wrap, ctx, { map: m, tank, onEnd(e) {
          if (e.stalled) { ctx.mistake(); say(e.msg, 'bad', `Mogok di ruas ${e.at}! Coba rute lain.`); setTimeout(e.reset, 2200); return; }
          const n = e.len === best ? 3 : e.len - best <= 3 ? 2 : 1;
          e.msg.replaceChildren(stars(n), ` Sampai! ${e.len} km, sisa bensin ${tank - e.len} km.${n < 3 ? ` Rute terpendek ${best} km.` : ' Ini rute terpendek!'}`);
          e.msg.className = 'reveal';
          next(3800);
        } });
      } else if (r === 2 || r === 3) {
        const [a, z] = r === 2 ? ['A', 'E'] : ['D', 'E'];
        const best = r === 2 ? 65 : 68;
        head(r + 1, 'Bagi Tugas', `Kelasmu mencoba semua 60 rute. Timmu memegang kantong (${a}, ${z}): 6 rute yang kota keduanya ${a} dan kota terakhirnya ${z}. Temukan yang terpendek.`);
        const tried = new Map();
        const log = el('div', { class: 'kr-kantong' });
        const drawLog = () => log.replaceChildren(el('small', null, `Kantong (${a}, ${z}): ${tried.size} dari 6 rute dicoba`), ...[...tried].sort((p, q) => p[1] - q[1]).map(([k, v]) => el('span', { class: v === best ? 'terbaik' : '' }, `${k} = ${v} km`)));
        drawLog();
        courier(wrap, ctx, { map: PETA, pocket: [a, z], side: log, onEnd(e) {
          tried.set(fmtRoute(e.route), e.len); drawLog();
          if (e.len === best) { say(e.msg, '', `${e.len} km: terpendek di kantong (${a}, ${z}). Gabungkan hasil 10 kantong, dan kelas menemukan rute terpendek dari 60 rute.`); next(4200); return; }
          say(e.msg, 'bad', `${e.len} km. Masih ada rute lebih pendek di kantong ini.`); setTimeout(e.reset, 1600);
        } });
      } else if (r === 4 || r === 5) {
        const s = r === 4 ? 'D' : 'E';
        head(r + 1, 'Mulai dari Kota Lain', `Kurir malas kini berangkat dari ${PETA.kota[s][0]} (${s}). Tangki 70 km. Apakah lebih hemat daripada dari Gudang (86 km)?`);
        courier(wrap, ctx, { map: PETA, tank: 70, rule: 'nn', start: s, onEnd(e) {
          const len = tourLen(PETA, e.route);
          if (e.stalled) say(e.msg, 'bad', `Mogok ${e.short} km sebelum ${e.home}: rute ini ${len} km. Mulai dari kota lain tidak selalu menolong.`);
          else say(e.msg, '', `${len} km, sampai! Ditulis dari Gudang: ${fmtRoute(rotateTo(e.route))}. Sama dengan rute terpendek, tetapi itu kebetulan.`);
          next(4200);
        } });
      } else {
        const m = r === 6 ? PETA : MAPS[8];
        const route = nearest(m);
        head(r === 6 ? 7 : 9, 'Urai Simpul', `Rute kurir malas ${tourLen(m, route)} km punya ruas yang bersilangan. Ketuk dua ruas yang bersilangan untuk mengurainya.`);
        untangle(wrap, ctx, m, route, (len, before) => next(4200));
      }
    }
    render();
  },
};

// The courier game board: a map with a scooter token, a fuel tank, and the towns to tap.
// rule 'nn' only accepts the nearest unvisited town. pocket [a, z] fixes the
// second town and keeps z for last. onEnd gets {route, len, stalled, at, short, home, msg, reset}.
function courier(host, ctx, { map: m, tank = null, rule = 'bebas', start = 'G', pocket = null, side = null, onEnd }) {
  const svg = el('div', { class: 'kk-peta kr-peta' });
  const msg = el('p', { class: 'reveal hint' }, rule === 'nn' ? 'Garis putus-putus menunjukkan jarak ke kota yang belum didatangi.' : 'Ketuk kota berikutnya. Ketuk kota terakhir lagi untuk mundur.');
  const routeEl = el('p', { class: 'kr-rute' });
  const g = tank ? gauge(tank) : null;
  let route; let used; let over;
  const P = (c) => [X(m.kota[c][1]), Y(m.kota[c][2])];
  svg.innerHTML = '<svg viewBox="0 0 730 370" role="img" aria-label="Peta kota"><g class="kr-calon"></g><g class="kr-jejak"></g><g class="kr-kota"></g><g class="kr-motor"><text font-size="34" text-anchor="middle" y="-14">🛵</text></g></svg>';
  const [calon, jejak, kota, motor] = ['.kr-calon', '.kr-jejak', '.kr-kota', '.kr-motor'].map((s) => svg.querySelector(s));
  const moveTo = ([x, y], ms = 550) => { motor.style.transition = ms ? `transform ${ms}ms ease-in-out` : 'none'; motor.style.transform = `translate(${x}px, ${y}px)`; };
  const allowed = () => {
    const left = m.ids.filter((c) => !route.includes(c));
    if (!left.length) return [route[0]];
    if (pocket && left.length > 1) return left.filter((c) => c !== pocket[1]);
    return left;
  };
  const leg = (a, b, cls, label = true) => { const [x1, y1] = P(a); const [x2, y2] = P(b); const f = cls === 'kr-calon-garis' ? 0.62 : 0.5; const mx = x1 + (x2 - x1) * f; const my = y1 + (y2 - y1) * f;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>${label ? `<g class="${cls}-km"><circle cx="${mx}" cy="${my}" r="15"/><text x="${mx}" y="${my + 6}" text-anchor="middle">${m.d(a, b)}</text></g>` : ''}`; };
  function draw() {
    const here = route[route.length - 1];
    const closed = over === 'home';
    jejak.innerHTML = route.slice(1).map((c, i) => leg(route[i], c, 'kr-sudah')).join('') + (closed ? leg(here, route[0], 'kr-sudah') : '');
    calon.innerHTML = over ? '' : allowed().map((c) => leg(here, c, 'kr-calon-garis')).join('');
    kota.innerHTML = m.ids.map((c) => { const [x, y] = P(c); const cls = c === route[0] ? 'awal' : route.includes(c) ? 'sudah' : allowed().includes(c) && !over ? 'bisa' : '';
      return `<g data-c="${c}" class="kk-kota ${cls}"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle cx="${x}" cy="${y}" r="18" class="kr-titik"/><text x="${x}" y="${y + 6}" font-size="17" font-weight="900" text-anchor="middle">${c}</text><text x="${x}" y="${y + (y > 300 ? -26 : 40)}" font-size="16" font-weight="700" text-anchor="middle" fill="#334155">${m.kota[c][0]}</text></g>`; }).join('');
    const len = route.slice(1).reduce((s, c, i) => s + m.d(route[i], c), 0) + (closed ? m.d(here, route[0]) : 0);
    routeEl.textContent = `${fmtRoute(route, closed)} · ${len} km`;
    if (g) g.set(tank - used);
  }
  function reset() {
    route = [start]; used = 0; over = null;
    if (pocket) { route.push(pocket[0]); used = m.d(start, pocket[0]); }
    moveTo(P(route[route.length - 1]), 0); draw(); msg.className = 'reveal hint';
  }
  function go(c) {
    const here = route[route.length - 1]; const d = m.d(here, c); const home = c === route[0];
    if (tank && used + d > tank) {
      const left = tank - used; const [x1, y1] = P(here); const [x2, y2] = P(c); const f = left / d;
      used = tank; over = 'mogok'; moveTo([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f], 900); ctx.sound.bad(); draw();
      jejak.insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x1 + (x2 - x1) * f}" y2="${y1 + (y2 - y1) * f}" class="kr-sudah"/><line x1="${x1 + (x2 - x1) * f}" y1="${y1 + (y2 - y1) * f}" x2="${x2}" y2="${y2}" class="kr-sisa"/>`);
      if (!home) route.push(c);
      svg.classList.add('mogok');
      setTimeout(() => svg.classList.remove('mogok'), 900);
      const done = home ? route : [...route, ...m.ids.filter((x) => !route.includes(x))];
      setTimeout(() => onEnd({ route: done, len: tourLen(m, done), stalled: true, at: `${here}–${c}`, short: d - left, home: m.kota[c][0], msg, reset }), 950);
      return;
    }
    used += d; ctx.sound.tap(); moveTo(P(c));
    if (home) { over = 'home'; draw(); setTimeout(() => { ctx.sound.good(); onEnd({ route, len: used, stalled: false, msg, reset }); }, 650); return; }
    route.push(c); draw();
  }
  svg.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('[data-c]');
    if (!t || over) return;
    e.preventDefault();
    const c = t.dataset.c; const here = route[route.length - 1];
    if (c === here && rule === 'bebas' && route.length > (pocket ? 2 : 1)) { used -= m.d(route[route.length - 2], here); route.pop(); moveTo(P(route[route.length - 1]), 300); draw(); return; }
    const ok = allowed();
    if (!ok.includes(c)) {
      shake(svg);
      if (c === route[0]) say(msg, 'bad', 'Datangi semua kota dulu, baru pulang.');
      else if (pocket && c === pocket[1]) say(msg, 'bad', `${c} adalah kota terakhir di kantong ini. Datangi kota lain dulu.`);
      return;
    }
    if (rule === 'nn') {
      const min = Math.min(...ok.map((x) => m.d(here, x)));
      if (m.d(here, c) > min) { ctx.mistake(); shake(svg); say(msg, 'bad', `Kurir malas tidak ke ${c} (${m.d(here, c)} km). Kota terdekat dari ${here}: ${ok.filter((x) => m.d(here, x) === min).join(' atau ')} (${min} km).`); return; }
    }
    msg.className = 'reveal hint';
    go(c);
  });
  const tools = el('div', { class: 'kr-alat' }, g ? g.node : null, side, routeEl, onTap(el('button', { class: 'seg-btn', type: 'button' }, '🔄 Ulang'), () => { if (over !== 'home') reset(); }));
  host.append(el('div', { class: 'kr-papan' }, svg, tools), msg);
  reset();
  return { reset };
}

// Tap the two crossing legs; the towns between them are reversed (2-opt).
function untangle(host, ctx, m, route, done) {
  const box = el('div', { class: 'kk-peta kr-peta' });
  const msg = el('p', { class: 'reveal hint' }, 'Ketuk satu ruas, lalu ruas yang menyilanginya.');
  const before = tourLen(m, route);
  const cross = crossings(m, route);
  let picked = []; let r = route; let finished = false;
  const draw = () => { box.innerHTML = mapSvg(m, { route: r, closed: true, tapLegs: !finished, legs: picked }); };
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-l]');
    if (!g || finished || picked.length === 2) return;
    e.preventDefault();
    const i = Number(g.dataset.l);
    if (picked.includes(i)) { picked = []; draw(); return; }
    if (picked.length === 1 && !cross.some(([a, b]) => (a === picked[0] && b === i) || (b === picked[0] && a === i))) { ctx.mistake(); shake(box); say(msg, 'bad', `Ruas ${r[i]}–${r[(i + 1) % r.length]} tidak menyilangi ruas yang kamu pilih.`); picked = []; draw(); return; }
    if (picked.length === 0 && !cross.some((p) => p.includes(i))) { ctx.mistake(); shake(box); say(msg, 'bad', `Ruas ${r[i]}–${r[(i + 1) % r.length]} tidak bersilangan dengan ruas mana pun.`); return; }
    picked.push(i); ctx.sound.tap(); draw();
    if (picked.length === 2) {
      const [a, b] = picked.sort((x, y) => x - y);
      setTimeout(() => {
        r = [...r.slice(0, a + 1), ...r.slice(a + 1, b + 1).reverse(), ...r.slice(b + 1)];
        finished = !crossings(m, r).length; picked = [];
        const len = tourLen(m, r);
        draw();
        if (finished) { ctx.sound.good(); say(msg, '', `Terurai! ${fmtRoute(r)} = ${len} km, hemat ${before - len} km. Membalik urutan kota di antara dua ruas yang bersilangan disebut 2-opt.`); done(len, before); }
        else { say(msg, '', `${len} km. Masih ada ruas yang bersilangan: urai lagi.`); cross.splice(0, cross.length, ...crossings(m, r)); }
      }, 700);
    }
  });
  draw();
  host.append(el('div', { class: 'kr-papan' }, box), msg);
}

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
