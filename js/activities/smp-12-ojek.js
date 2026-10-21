// Rute Ojek dan Truk Sampah — SMP (13–15 tahun), graf. Pak Ujang's district
// map is a weighted graph: Dijkstra finds the fastest route from the ojek
// base P to every place, closing a road changes the answer, and node
// degrees decide where a truck covering every road once must start and end.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const NODES = ['P', 'A', 'S', 'K', 'B', 'T', 'O', 'L'];
export const NAMA = { P: 'Pangkalan', A: 'Pasar', S: 'Sekolah', K: 'Puskesmas', B: 'Balai desa', T: 'Stasiun', O: 'Kantor pos', L: 'Lapangan' };
const POS = { P: [6, 30], S: [26, 20], A: [44, 6], B: [30, 52], K: [52, 32], O: [76, 10], T: [74, 52], L: [94, 32] };
// [a, b, menit, control point for a curved road, label position along the road]
export const EDGES = [['P', 'A', 4, [12, 2]], ['P', 'S', 2], ['P', 'B', 7, [12, 58]], ['A', 'S', 1], ['A', 'K', 5], ['S', 'B', 3], ['S', 'O', 9, null, 0.7], ['B', 'K', 2],
  ['B', 'T', 6], ['K', 'T', 3], ['K', 'O', 5], ['T', 'L', 2], ['O', 'L', 3], ['T', 'O', 4]];
export const key = (a, b) => (a < b ? a + b : b + a);
const label = (a, b) => `${a}–${b}`;
const weightOf = (edges, a, b) => edges.find((e) => key(e[0], e[1]) === key(a, b));

export function neighbours(edges, n, closed = new Set()) {
  return edges.filter((e) => (e[0] === n || e[1] === n) && !closed.has(key(e[0], e[1]))).map((e) => [e[0] === n ? e[1] : e[0], e[2]]);
}

// Start a step-by-step run: dist/prev maps, finished set and the rows so far.
export function start(src) {
  const dist = Object.fromEntries(NODES.map((n) => [n, Infinity]));
  dist[src] = 0;
  return { dist, prev: {}, done: new Set(), rows: [] };
}
export const candidates = (st) => {
  const open = NODES.filter((n) => !st.done.has(n) && st.dist[n] < Infinity);
  const min = Math.min(...open.map((n) => st.dist[n]));
  return open.filter((n) => st.dist[n] === min);
};
// Finish node n and relax its roads; returns the changes and the kept checks.
export function step(st, edges, n, closed) {
  st.done.add(n);
  const changes = [];
  const kept = [];
  for (const [m, w] of neighbours(edges, n, closed)) {
    if (st.done.has(m)) continue;
    const d = st.dist[n] + w;
    if (d < st.dist[m]) { changes.push([m, d, st.dist[m]]); st.dist[m] = d; st.prev[m] = n; } else kept.push([m, d, st.dist[m]]);
  }
  st.rows.push({ pick: n, at: st.dist[n], dist: { ...st.dist }, prev: { ...st.prev }, done: new Set(st.done), changes: changes.map((c) => c[0]) });
  return { changes, kept };
}
export function dijkstra(edges, src = 'P', closed = new Set()) {
  const st = start(src);
  for (let c = candidates(st); c.length; c = candidates(st)) step(st, edges, c[0], closed);
  return st;
}
export function route(st, to) {
  const r = [to];
  while (st.prev[r[0]]) r.unshift(st.prev[r[0]]);
  return r;
}
export function degrees(edges, closed = new Set()) {
  return Object.fromEntries(NODES.map((n) => [n, neighbours(edges, n, closed).length]));
}
export const total = (edges, closed = new Set()) => edges.filter((e) => !closed.has(key(e[0], e[1]))).reduce((s, e) => s + e[2], 0);
// A walk of node letters: every step must be an open road; returns its minutes or null.
export function walkTime(edges, walk, closed = new Set()) {
  let t = 0;
  for (let i = 1; i < walk.length; i++) {
    const e = weightOf(edges, walk[i - 1], walk[i]);
    if (!e || closed.has(key(walk[i - 1], walk[i]))) return null;
    t += e[2];
  }
  return t;
}
export function isTrail(edges, walk, closed = new Set()) {
  const used = walk.slice(1).map((n, i) => key(walk[i], n));
  return walkTime(edges, walk, closed) !== null && new Set(used).size === used.length && used.length === edges.filter((e) => !closed.has(key(e[0], e[1]))).length;
}
export const randomEdges = (rand) => EDGES.map(([a, b, , c, t]) => [a, b, rand.int(1, 9), c, t]);

const fmt = (d) => (d === Infinity ? '∞' : String(d));

function midpoint([a, b, , c, t = 0.5]) {
  const [x1, y1] = POS[a];
  const [x2, y2] = POS[b];
  if (!c) return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  return [0.25 * x1 + 0.5 * c[0] + 0.25 * x2, 0.25 * y1 + 0.5 * c[1] + 0.25 * y2];
}

// The district map: roads in SVG, road minutes and places as buttons.
// opts: closed, used (road keys in order), path (node letters), labels (dist
// shown under places), arrows (prev map), done, deg (degrees), hi, onNode, onEdge.
function mapView(edges, o = {}) {
  const closed = o.closed || new Set();
  const used = new Set(o.used || []);
  const pathKeys = new Set((o.path || []).slice(1).map((n, i) => key(o.path[i], n)));
  const arrowKeys = new Set(Object.entries(o.arrows || {}).map(([m, n]) => key(m, n)));
  const svg = el('div', { class: 'ojek-garis' });
  svg.innerHTML = `<svg viewBox="0 0 100 60" preserveAspectRatio="none">${edges.map((e) => {
    const [a, b, , c] = e;
    const k = key(a, b);
    const cls = closed.has(k) ? 'tutup' : used.has(k) ? 'pakai' : pathKeys.has(k) ? 'rute' : arrowKeys.has(k) ? 'panah' : '';
    const [x1, y1] = POS[a];
    const [x2, y2] = POS[b];
    return c ? `<path d="M${x1} ${y1} Q${c[0]} ${c[1]} ${x2} ${y2}" class="${cls}"/>` : `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  }).join('')}</svg>`;
  const roads = edges.map((e) => {
    const k = key(e[0], e[1]);
    const [x, y] = midpoint(e);
    const b = el('button', { class: `ojek-menit ${closed.has(k) ? 'tutup' : ''} ${used.has(k) ? 'pakai' : ''}`, type: 'button', 'data-e': k, style: `left:${x}%;top:${(y / 60) * 100}%`, 'aria-label': `jalan ${label(e[0], e[1])}` }, closed.has(k) ? '✕' : String(e[2]));
    return o.onEdge ? onTap(b, () => o.onEdge(e[0], e[1])) : b;
  });
  const places = NODES.map((n) => {
    const [x, y] = POS[n];
    const deg = o.deg ? o.deg[n] : null;
    const cls = ['ojek-tempat', o.done?.has(n) ? 'selesai' : '', o.hi?.includes(n) ? 'hi' : '', deg !== null && deg % 2 ? 'ganjil' : '', o.path?.at(-1) === n ? 'di-sini' : ''].join(' ');
    const sub = o.labels ? fmt(o.labels[n]) : deg !== null ? `derajat ${deg}` : NAMA[n];
    const b = el('button', { class: cls, type: 'button', 'data-n': n, style: `left:${x}%;top:${(y / 60) * 100}%` }, el('b', null, n), el('small', { class: o.labels ? 'angka' : '' }, sub));
    return o.onNode ? onTap(b, () => o.onNode(n)) : b;
  });
  return el('div', { class: 'ojek-peta' }, svg, ...roads, ...places);
}

// Dijkstra table: one row per finished place, cells show "waktu (asal)".
function table(st) {
  return el('div', { class: 'ojek-tabel-wadah' }, el('table', { class: 'kls-tabel ojek-tabel' },
    el('thead', null, el('tr', null, el('th', null, '#'), el('th', null, 'Dipilih'), ...NODES.map((n) => el('th', null, n)))),
    el('tbody', null, ...st.rows.map((r, i) => el('tr', null, el('td', null, i + 1), el('td', null, `${r.pick} (${r.at})`), ...NODES.map((n) => {
      const before = i ? st.rows[i - 1].done.has(n) : false;
      const txt = before ? '✓' : n === r.pick ? `✓ ${r.at}` : r.dist[n] === Infinity ? '∞' : `${r.dist[n]} (${r.prev[n] || '–'})`;
      return el('td', { class: r.changes.includes(n) ? 'ganti' : before ? 'lewat' : '' }, txt);
    }))))));
}

// Tap the places in Dijkstra order. turn(ok) lets team mode score each pick.
function dijkstraRound(wrap, ctx, { edges, src = 'P', closed = new Set(), done, turn }) {
  const st = start(src);
  let finished = false;
  const stage = el('div', { class: 'ojek-samping' });
  const msg = el('p', { class: 'reveal info' }, `Ketuk tempat yang belum selesai dengan waktu sementara terkecil. Mulai dari ${src}.`);
  function draw(hi = []) { stage.replaceChildren(mapView(edges, { closed, labels: st.dist, arrows: st.prev, done: st.done, hi, onNode: pick }), table(st)); }
  function pick(n) {
    if (finished) return;
    const c = candidates(st);
    if (!c.includes(n)) {
      msg.className = 'reveal bad';
      msg.textContent = st.done.has(n) ? `${n} sudah selesai.` : `${n} belum bisa dipilih: waktunya ${fmt(st.dist[n])}, padahal ${c.join(' atau ')} punya waktu sementara terkecil (${st.dist[c[0]]}).`;
      ctx.mistake();
      shake(stage);
      turn?.(false);
      draw(c);
      return;
    }
    const { changes, kept } = step(st, edges, n, closed);
    ctx.sound.tap();
    turn?.(true);
    const parts = [...changes.map(([m, d, old]) => `${m} ${fmt(old)} → ${d}`), ...kept.map(([m, d, old]) => `${m} tetap ${old} karena ${st.dist[n]} + ${d - st.dist[n]} = ${d}`)];
    if (!candidates(st).length) {
      finished = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = `Semua tempat selesai dalam ${st.rows.length} langkah. ${NODES.filter((m) => m !== src).map((m) => `${m} ${fmt(st.dist[m])}`).join(', ')}.`;
      done?.(st);
      return;
    }
    msg.className = 'reveal info';
    msg.textContent = `${n} selesai (${st.dist[n]}). ${parts.length ? parts.join('; ') : 'Tidak ada yang berubah'}.`;
    draw();
  }
  draw();
  wrap.append(stage, msg);
  return st;
}

// Tap places from the start to the target; the route must be a fastest one.
function routeRound(wrap, ctx, { edges, src = 'P', to, closed = new Set(), labels = false, prompt, done }) {
  const st = dijkstra(edges, src, closed);
  let path = [src];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `Ketuk tempat satu per satu dari ${src} sampai ${to}.`);
  function draw() {
    stage.replaceChildren(mapView(edges, { closed, path, labels: labels ? st.dist : null, arrows: labels ? st.prev : null, hi: [to], onNode: tap }),
      el('p', { class: 'ojek-jejak' }, `Rute: ${path.join('–')}  ·  ${walkTime(edges, path, closed)} menit`));
  }
  function tap(n) {
    if (finished) return;
    const last = path.at(-1);
    if (n === last && path.length > 1) { path.pop(); draw(); return; }
    const e = weightOf(edges, last, n);
    if (!e || closed.has(key(last, n))) { msg.className = 'reveal bad'; msg.textContent = e ? `Jalan ${label(last, n)} ditutup.` : `Tidak ada jalan langsung ${label(last, n)}.`; shake(stage); return; }
    path.push(n);
    ctx.sound.tap();
    if (n !== to) { msg.className = 'reveal info'; msg.textContent = 'Ketuk tempat terakhir untuk mundur satu langkah.'; draw(); return; }
    const t = walkTime(edges, path, closed);
    if (t > st.dist[to]) {
      msg.className = 'reveal bad';
      msg.textContent = `Rute ${path.join('–')} butuh ${t} menit. Ada rute yang lebih cepat. Coba lagi.`;
      ctx.mistake();
      path = [src];
      draw();
      return;
    }
    finished = true;
    draw();
    msg.className = 'reveal';
    msg.textContent = `Tercepat: ${path.join('–')}, ${t} menit.`;
    done();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, msg);
}

// Drive the truck: tap a start place, then roads or neighbouring places.
function truckRound(wrap, ctx, { edges, closed = new Set(), showDeg = true, done }) {
  let path = [];
  let finished = false;
  const open = edges.filter((e) => !closed.has(key(e[0], e[1])));
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tempat awal truk, lalu ketuk jalan satu per satu.');
  const usedKeys = () => path.slice(1).map((n, i) => key(path[i], n));
  function draw() {
    const used = usedKeys();
    stage.replaceChildren(mapView(edges, { closed, used, path: path.length ? [path.at(-1)] : [], deg: showDeg ? degrees(edges, closed) : null, onNode: node, onEdge: road }),
      el('p', { class: 'ojek-jejak' }, `Lintasan: ${path.join('–') || '…'}  ·  ${used.length}/${open.length} jalan  ·  ${path.length > 1 ? walkTime(edges, path, closed) : 0} menit`),
      el('div', { class: 'kode-baris' }, button('↶ Mundur', () => { if (!finished && path.length) { path.pop(); draw(); } }, 'small'), button('Ulangi', () => { if (!finished) { path = []; msg.className = 'reveal info'; msg.textContent = 'Ketuk tempat awal truk.'; draw(); } }, 'small')));
  }
  function move(n) {
    const last = path.at(-1);
    const k = key(last, n);
    if (!weightOf(edges, last, n) || closed.has(k)) { msg.className = 'reveal bad'; msg.textContent = `Tidak ada jalan ${label(last, n)} yang bisa dipakai.`; shake(stage); return; }
    if (usedKeys().includes(k)) { msg.className = 'reveal bad'; msg.textContent = `Jalan ${label(last, n)} sudah dilewati.`; ctx.mistake(); shake(stage); return; }
    path.push(n);
    ctx.sound.tap();
    const used = usedKeys();
    if (used.length === open.length) {
      finished = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = `Semua ${open.length} jalan dilewati tepat sekali: ${path.join('–')}, ${walkTime(edges, path, closed)} menit.`;
      done?.(path);
      return;
    }
    const left = neighbours(edges, n, closed).filter(([m]) => !used.includes(key(n, m)));
    if (!left.length) {
      msg.className = 'reveal bad';
      msg.textContent = `Buntu di ${n}: masih ada ${open.length - used.length} jalan, tetapi semua jalan dari ${n} sudah dipakai. Tekan Mundur atau Ulangi.`;
      ctx.mistake();
    } else { msg.className = 'reveal info'; msg.textContent = `Truk di ${n}. Sisa ${open.length - used.length} jalan.`; }
    draw();
  }
  function node(n) {
    if (finished) return;
    if (!path.length) { path = [n]; ctx.sound.tap(); msg.className = 'reveal info'; msg.textContent = `Truk mulai di ${n}.`; draw(); return; }
    move(n);
  }
  function road(a, b) {
    if (finished || !path.length) return;
    const last = path.at(-1);
    if (last !== a && last !== b) { msg.className = 'reveal bad'; msg.textContent = `Truk ada di ${last}; jalan ${label(a, b)} tidak terhubung ke sana.`; shake(stage); return; }
    move(last === a ? b : a);
  }
  draw();
  wrap.append(stage, msg);
}

// Number boxes per place, typed with a keypad.
function degreeRound(wrap, ctx, { edges, done }) {
  const want = degrees(edges);
  const vals = {};
  let focus = 'P';
  let finished = false;
  const row = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Hitung banyak jalan di setiap tempat. Ketuk kotak, lalu ketik angkanya.');
  function draw(wrong = []) {
    row.replaceChildren(el('table', { class: 'kls-tabel ojek-tabel' }, el('thead', null, el('tr', null, el('th', null, 'Tempat'), ...NODES.map((n) => el('th', null, n)))),
      el('tbody', null, el('tr', null, el('th', null, 'Derajat'), ...NODES.map((n) => el('td', null, onTap(el('button', { class: `ck-isi ${focus === n ? 'fokus' : ''} ${wrong.includes(n) ? 'salah' : ''}`, type: 'button', 'data-k': n }, vals[n] ?? '…'), () => { focus = n; draw(); })))))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => {
    if (finished) return;
    vals[focus] = Number(d);
    ctx.sound.tap();
    focus = NODES[(NODES.indexOf(focus) + 1) % NODES.length];
    draw();
  })));
  wrap.append(el('p', { class: 'prompt' }, 'Derajat tempat = banyak jalan yang terhubung dengannya.'), mapView(edges, {}), row, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const wrong = NODES.filter((n) => vals[n] !== want[n]);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} kotak belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Benar. Derajat ganjil: ${NODES.filter((n) => want[n] % 2).join(' dan ')}.`;
    done();
  }, 'primary')), msg);
}

export default {
  id: 'smp-12-ojek',
  title: 'Rute Ojek dan Truk Sampah',
  topic: 'Graf: jalur tercepat (Dijkstra) dan lintasan Euler',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🛵',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid memodelkan peta sebagai graf, menjalankan algoritma Dijkstra, menelusuri rute tercepat, menghitung ulang saat jalan ditutup, dan memakai derajat simpul untuk mencari lintasan yang melewati setiap jalan tepat sekali.',
  extraModes: [
    { id: 'dijkstra', icon: '🗺️', label: 'Peta Dijkstra', desc: 'Pilih tempat awal, tutup atau buka jalan, lalu jalankan Dijkstra langkah demi langkah', create: createExplorer },
    { id: 'truk', icon: '🚛', label: 'Truk Sampah', desc: 'Gambar lintasan truk; tutup jalan dan lihat derajat ganjil berubah', create: createTruck },
    { id: 'tim', icon: '🎯', label: 'Dijkstra Bergiliran', desc: 'Dua tim bergantian memilih langkah Dijkstra di peta acak; salah pilih memberi poin ke lawan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act ojek' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) { wrap.append(el('p', { class: 'prompt' }, 'Jalankan Dijkstra dari Pangkalan (P).')); dijkstraRound(wrap, ctx, { edges: EDGES, done: next }); }
      else if (r === 1) { const to = ctx.rand.pick(['L', 'T', 'K', 'O']); routeRound(wrap, ctx, { edges: EDGES, to, labels: true, prompt: `Telusuri balik "lewat mana": rute tercepat P ke ${to} (${NAMA[to]}).`, done: next }); }
      else if (r === 2) ask('Ada jalan langsung P–A (4 menit) dan P–B (7 menit). Mengapa keduanya tidak dipakai?', [['Lewat Sekolah lebih cepat: P–S–A 3 menit, P–S–B 5 menit', true], ['Jalan langsung selalu lebih lambat'], ['Dijkstra tidak boleh memakai jalan panjang'], ['Karena P–A dan P–B ditutup']], 1, mapView(EDGES, { path: ['P', 'S', 'A'] }));
      else if (r === 3) routeRound(wrap, ctx, { edges: EDGES, to: 'L', closed: new Set(['BS']), prompt: 'Jembatan S–B diperbaiki, jalannya ditutup. Cari rute tercepat P ke L sekarang.', done: next });
      else if (r === 4) degreeRound(wrap, ctx, { edges: EDGES, done: next });
      else if (r === 5) ask('Tempat berderajat ganjil hanya P dan A. Jadi truk yang melewati setiap jalan tepat sekali harus …', [['Mulai di P dan berakhir di A (atau sebaliknya)', true], ['Mulai dan berakhir di P'], ['Mulai di tempat mana saja'], ['Tidak mungkin ada lintasannya']], 1, mapView(EDGES, { deg: degrees(EDGES) }));
      else if (r === 6) { wrap.append(el('p', { class: 'prompt' }, 'Truk sampah: lewati setiap jalan tepat satu kali.')); truckRound(wrap, ctx, { edges: EDGES, done: next }); }
      else if (r === 7) ask(`Pool truk ada di P, jadi truk harus kembali dari A ke P. Total semua jalan ${total(EDGES)} menit. Jalan mana yang dilewati dua kali, dan berapa totalnya?`, [['A–S–P (3 menit), total 59 menit', true], ['A–P langsung (4 menit), total 60 menit'], ['A–K–B–P (14 menit), total 70 menit'], ['Tidak ada, total 56 menit']], 1);
      else { const edges = randomEdges(ctx.rand); const to = ctx.rand.pick(['L', 'T', 'O', 'K', 'B']); routeRound(wrap, ctx, { edges, to, prompt: `Peta acak: waktu tempuh berubah karena macet. Rute tercepat P ke ${to}?`, done: next }); }
    }
    render();
  },
};

function createExplorer(root, ctx) {
  const wrap = el('div', { class: 'act ojek' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let edges = EDGES;
  let src = 'P';
  const closed = new Set();
  let st;
  let mode = 'mulai';
  function reset() { st = start(src); draw(); }
  function draw(note) {
    const finished = !candidates(st).length;
    wrap.replaceChildren(
      el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, ...[['mulai', 'Ketuk tempat: jadi awal'], ['tutup', 'Ketuk jalan: tutup/buka']].map(([m, l]) => onTap(el('button', { class: `seg-btn ${mode === m ? 'on' : ''}`, type: 'button' }, l), () => { mode = m; draw(); })))),
      el('div', { class: 'ojek-samping' }, mapView(edges, { closed, labels: st.dist, arrows: st.prev, done: st.done, hi: finished ? [] : candidates(st),
        onNode: (n) => { if (mode === 'mulai') { src = n; reset(); } },
        onEdge: (a, b) => { if (mode === 'tutup') { const k = key(a, b); if (closed.has(k)) closed.delete(k); else closed.add(k); reset(); } } }), table(st)),
      el('p', { class: 'reveal info' }, note || (finished ? `Selesai. Dari ${src}: ${NODES.filter((m) => m !== src).map((m) => `${m} ${fmt(st.dist[m])}`).join(', ')}.` : `Berikutnya: ${candidates(st).join(' atau ')} (waktu sementara terkecil).`)),
      el('div', { class: 'kode-baris' },
        button('Langkah ➜', () => { const c = candidates(st); if (!c.length) return; const { changes } = step(st, edges, c[0], closed); ctx.sound.tap(); draw(`${c[0]} selesai. ${changes.length ? changes.map(([m, d]) => `${m} → ${d}`).join(', ') : 'Tidak ada yang berubah.'}`); }, 'primary'),
        button('Sampai selesai', () => { for (let c = candidates(st); c.length; c = candidates(st)) step(st, edges, c[0], closed); draw(); }, 'small'),
        button('Ulangi', reset, 'small'),
        button('Waktu acak', () => { edges = randomEdges(rand); reset(); }, 'small'),
        button('Peta asli', () => { edges = EDGES; closed.clear(); src = 'P'; reset(); }, 'small')));
  }
  reset();
}

function createTruck(root, ctx) {
  const wrap = el('div', { class: 'act ojek' });
  root.append(wrap);
  const closed = new Set();
  let editing = false;
  function draw() {
    wrap.replaceChildren();
    const deg = degrees(EDGES, closed);
    const odd = NODES.filter((n) => deg[n] % 2);
    wrap.append(el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, ...[[false, 'Jalankan truk'], [true, 'Tutup/buka jalan']].map(([m, l]) => onTap(el('button', { class: `seg-btn ${editing === m ? 'on' : ''}`, type: 'button' }, l), () => { editing = m; draw(); })))),
      el('p', { class: 'reveal info' }, `Tempat ganjil: ${odd.join(', ') || 'tidak ada'} (${odd.length}). ${odd.length === 0 ? 'Truk bisa mulai di mana saja dan kembali ke tempat awal.' : odd.length === 2 ? `Truk harus mulai di ${odd[0]} atau ${odd[1]}.` : 'Lebih dari 2 tempat ganjil: tidak ada lintasan yang melewati setiap jalan tepat sekali.'}`));
    if (editing) wrap.append(mapView(EDGES, { closed, deg, onEdge: (a, b) => { const k = key(a, b); if (closed.has(k)) closed.delete(k); else closed.add(k); draw(); } }));
    else truckRound(wrap, ctx, { edges: EDGES, closed, done: () => ctx.sound.win() });
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act ojek' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const score = [0, 0];
  let who = 0;
  function round() {
    wrap.replaceChildren();
    const head = el('p', { class: 'prompt' });
    const show = () => { head.textContent = `Giliran Tim ${who + 1}. Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`; };
    show();
    wrap.append(head);
    dijkstraRound(wrap, ctx, {
      edges: randomEdges(rand),
      src: rand.pick(NODES),
      turn: (ok) => { score[ok ? who : 1 - who]++; who = 1 - who; show(); },
      done: () => { ctx.sound.win(); wrap.append(el('div', { class: 'kode-baris' }, button('Peta berikutnya ➜', round, 'primary'))); },
    });
  }
  round();
}
