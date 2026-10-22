// Kabel Internet Antardusun — SMA/SMK (16–18 tahun), pohon merentang minimum.
// Seven hamlets and twelve possible cables: Kruskal, Prim, cycle detection,
// a cost change, a backup cable for reliability, and Borůvka's parallel rounds.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const DUSUN = { K: ['Krajan', 14, 42], N: ['Ngasem', 38, 12], S: ['Sumberejo', 40, 52], T: ['Tegalsari', 26, 86], W: ['Wonorejo', 72, 28], G: ['Gunungsari', 66, 80], P: ['Pandanwangi', 92, 54] };
export const KABEL = [['K', 'N', 12], ['K', 'S', 7], ['K', 'T', 15], ['N', 'S', 9], ['N', 'W', 10], ['W', 'P', 5], ['S', 'W', 11], ['S', 'T', 6], ['S', 'G', 14], ['T', 'G', 8], ['W', 'G', 13], ['G', 'P', 16]];
export const nama = (e) => `${DUSUN[e[0]][0]}–${DUSUN[e[1]][0]}`;

export function uf() { const p = {}; const f = (x) => (p[x] ??= x) === x ? x : (p[x] = f(p[x])); return { find: f, join: (a, b) => { p[f(a)] = f(b); }, same: (a, b) => f(a) === f(b) }; }
const withCost = (cost) => KABEL.map((e, i) => [e[0], e[1], cost[i] ?? e[2], i]);
export function kruskal(cost = {}) {
  const u = uf();
  const take = [];
  const log = [];
  for (const e of withCost(cost).sort((a, b) => a[2] - b[2])) { const ok = !u.same(e[0], e[1]); log.push([e[3], ok]); if (ok) { u.join(e[0], e[1]); take.push(e[3]); } }
  return { take, log, total: take.reduce((s, i) => s + (cost[i] ?? KABEL[i][2]), 0) };
}
export function primNext(have, inTree, cost = {}) {
  const cand = withCost(cost).filter((e) => !have.includes(e[3]) && inTree.has(e[0]) !== inTree.has(e[1]));
  return cand.sort((a, b) => a[2] - b[2])[0];
}
// Hamlets reachable from Krajan using the given cables.
export function reach(edges, from = 'K') { const seen = new Set([from]); let grow = true; while (grow) { grow = false; for (const i of edges) { const [a, b] = KABEL[i]; if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grow = true; } } } return seen; }
export function boruvkaFirst() { const pick = new Set(); for (const d of Object.keys(DUSUN)) pick.add(KABEL.map((e, i) => [e, i]).filter(([e]) => e[0] === d || e[1] === d).sort((a, b) => a[0][2] - b[0][2])[0][1]); return [...pick]; }
// Cycle path between a and b inside the chosen cables, as hamlet codes.
export function pathBetween(edges, a, b) {
  const prev = { [a]: null };
  const q = [a];
  while (q.length) { const x = q.shift(); if (x === b) break; for (const i of edges) { const [u, v] = KABEL[i]; const y = u === x ? v : v === x ? u : null; if (y && !(y in prev)) { prev[y] = x; q.push(y); } } }
  if (!(b in prev)) return null;
  const out = []; for (let x = b; x; x = prev[x]) out.unshift(x); return out;
}

export function mapSvg({ chosen = [], red = [], cut = [], cost = {}, lit = [], tap = true, nodes = new Set() } = {}) {
  const P = (d) => [DUSUN[d][1] * 6, DUSUN[d][2] * 4];
  const lines = KABEL.map((e, i) => {
    const [x1, y1] = P(e[0]); const [x2, y2] = P(e[1]);
    const on = chosen.includes(i); const bad = red.includes(i); const isCut = cut.includes(i); const hl = lit.includes(i);
    const col = bad ? '#dc2626' : isCut ? '#94a3b8' : on ? '#16a34a' : hl ? '#f97316' : '#cbd5e1';
    const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
    return `<g ${tap ? `data-e="${i}" class="kd-kabel"` : ''}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="26"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${on || bad || hl ? 7 : 4}" ${isCut ? 'stroke-dasharray="8 8"' : ''} stroke-linecap="round"/><circle cx="${mx}" cy="${my}" r="15" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${mx}" y="${my + 5}" font-size="14" font-weight="800" text-anchor="middle" fill="#111827">${cost[i] ?? e[2]}</text></g>`;
  });
  const dots = Object.entries(DUSUN).map(([d, [n]]) => { const [x, y] = P(d); return `<g><circle cx="${x}" cy="${y}" r="14" fill="${d === 'K' ? '#fde047' : nodes.has(d) ? '#bbf7d0' : '#e0e7ff'}" stroke="#334155" stroke-width="2.5"/><text x="${x}" y="${y + 5}" font-size="13" font-weight="900" text-anchor="middle">${d}</text><text x="${x}" y="${y + (y > 300 ? 32 : -20)}" font-size="13" font-weight="700" text-anchor="middle" fill="#334155">${n}${d === 'K' ? ' (balai desa)' : ''}</text></g>`; });
  return `<svg viewBox="40 10 540 370" role="img" aria-label="Peta dusun">${lines.join('')}${dots.join('')}</svg>`;
}

// Cable board. rule: 'bebas' | 'kruskal' | 'prim'.
function cableBoard(host, ctx, { rule = 'bebas', cost = {}, onPick, onDone, onBad }) {
  let chosen = [];
  let red = [];
  const box = el('div', { class: 'kd-peta' });
  const info = el('p', { class: 'reveal info' });
  const b = { enabled: true, get chosen() { return chosen; }, reset() { chosen = []; red = []; draw(); } };
  const c = (i) => cost[i] ?? KABEL[i][2];
  const total = () => chosen.reduce((s, i) => s + c(i), 0);
  const inTree = () => reach(chosen);
  function draw() {
    box.innerHTML = mapSvg({ chosen, red, cost, nodes: rule === 'prim' ? inTree() : new Set() });
    info.textContent = `${chosen.length} kabel · biaya ${total()} juta${rule !== 'bebas' ? ` · aturan ${rule === 'kruskal' ? 'Kruskal' : 'Prim'}` : ''}`;
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-e]');
    if (!g || !b.enabled) return;
    e.preventDefault();
    tap(Number(g.dataset.e));
  });
  function tap(i) {
    if (chosen.includes(i)) { if (rule === 'bebas') { chosen = chosen.filter((x) => x !== i); red = []; draw(); } return; }
    const [a, d] = KABEL[i];
    const u = uf(); for (const x of chosen) u.join(KABEL[x][0], KABEL[x][1]);
    if (u.same(a, d)) {
      const loop = pathBetween(chosen, a, d);
      red = [i, ...chosen.filter((x) => loop.includes(KABEL[x][0]) && loop.includes(KABEL[x][1]) && Math.abs(loop.indexOf(KABEL[x][0]) - loop.indexOf(KABEL[x][1])) === 1)];
      draw(); ctx.mistake(); shake(box);
      say(info, 'bad', `${nama(KABEL[i])} membuat putaran: ${[...loop, loop[0]].map((x) => DUSUN[x][0]).join('–')}.`);
      if (onBad) onBad(i, 'putaran');
      setTimeout(() => { red = []; draw(); }, 1800);
      return;
    }
    let best = null;
    if (rule === 'kruskal') { const all = withCost(cost).filter((e) => !chosen.includes(e[3]) && !u.same(e[0], e[1])).sort((x, y) => x[2] - y[2]); best = all[0]; }
    if (rule === 'prim') { const tr = inTree(); best = primNext(chosen, tr, cost); if (!(tr.has(a) || tr.has(d))) { ctx.mistake(); shake(box); say(info, 'bad', `Cara Prim tumbuh dari dusun yang sudah tersambung (mulai Krajan). ${nama(KABEL[i])} belum menyentuhnya.`); if (onBad) onBad(i, 'jauh'); return; } }
    if (best && c(i) > best[2]) { ctx.mistake(); shake(box); say(info, 'bad', `Masih ada kabel lebih murah yang ${rule === 'prim' ? 'menyambung dusun baru' : 'tidak membuat putaran'}: ${nama(KABEL[best[3]])} (${best[2]}).`); if (onBad) onBad(i, 'mahal', c(i) - best[2]); return; }
    chosen = [...chosen, i];
    ctx.sound.tap();
    draw();
    if (onPick) onPick(i);
    if (chosen.length === 6 && onDone) onDone(total(), chosen);
  }
  host.append(box, info);
  draw();
  return b;
}

function boardRound(wrap, ctx, { rule, cost = {}, prompt, hint, done }) {
  const host = el('div', { class: 'kd-papan' });
  const msg = el('p', { class: 'reveal hint' }, hint);
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
  const b = cableBoard(host, ctx, { rule, cost, onDone(total) { b.enabled = false; say(msg, '', `Selesai: 6 kabel, ${total} juta rupiah.`); done(); } });
}
const costTable = (cost = {}) => el('div', { class: 'kd-tabel' }, KABEL.map((e, i) => el('span', null, nama(e), el('b', null, cost[i] ?? e[2]))));

export default {
  id: 'sma-09-kabel-dusun',
  title: 'Kabel Internet Antardusun',
  topic: 'Pohon merentang minimum: cara Kruskal, Prim, dan Borůvka',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔌',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membangun jaringan kabel termurah yang menyambung tujuh dusun dengan cara Kruskal dan Prim, mengenali putaran, menjelaskan mengapa n titik butuh n − 1 sisi, melihat akibat perubahan biaya, dan menimbang biaya dengan keandalan.',
  extraModes: [
    { id: 'peta', icon: '🗺️', label: 'Peta Kabel', desc: 'Pasang kabel bebas atau dengan aturan Kruskal atau Prim; ubah biaya sebuah kabel dan putuskan kabel untuk melihat dusun yang terputus', create: createMap },
    { id: 'giliran', icon: '🔁', label: 'Kabel Bergiliran', desc: 'Tim bergantian memilih satu kabel; kabel yang membuat putaran atau lebih mahal dari pilihan terbaik menambah biaya tim itu', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kabel-dusun' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const pic = (o) => el('div', { class: 'kd-peta kecil', html: mapSvg({ tap: false, ...o }) });
      const mst = kruskal().take;
      if (r === 0) ask('Jika kedua belas kabel dipasang semua, berapa biayanya, dan paling sedikit berapa kabel supaya ketujuh dusun tersambung?', [['126 juta; paling sedikit 6 kabel, karena setiap kabel menggabungkan paling banyak dua kelompok', true], ['126 juta; paling sedikit 7 kabel'], ['45 juta; paling sedikit 12 kabel'], ['126 juta; paling sedikit 3 kabel']], 2, pic({}));
      else if (r === 1) boardRound(wrap, ctx, { rule: 'kruskal', prompt: 'Cara Kruskal: ketuk kabel termurah lebih dulu, tolak yang membuat putaran.', hint: 'Mulai dari kabel 5, lalu 6, 7, …', done: next });
      else if (r === 2) boardRound(wrap, ctx, { rule: 'prim', prompt: 'Cara Prim: tumbuh dari balai desa Krajan.', hint: 'Pilih kabel termurah yang menyambung dusun hijau (sudah tersambung) dengan dusun yang belum.', done: next });
      else if (r === 3) ask('Apakah cara Kruskal dan Prim memilih kabel yang sama? Mengapa pohon termurah tidak pernah punya putaran?', [['Ya, keenam kabelnya sama (45 juta); bila ada putaran, satu kabelnya bisa dibuang dan biaya berkurang', true], ['Tidak, Prim selalu lebih murah'], ['Ya, tetapi biaya Prim 52 juta'], ['Tidak; putaran membuat jaringan lebih murah']], 1, pic({ chosen: mst }));
      else if (r === 4) ask('Jaringan yang menyambung semua dusun tanpa putaran dengan n titik selalu punya berapa sisi? Untuk 50 dusun?', [['n − 1; 49 kabel', true], ['n; 50 kabel'], ['n + 1; 51 kabel'], ['2n; 100 kabel']], 2);
      else if (r === 5) boardRound(wrap, ctx, { rule: 'kruskal', cost: { 7: 17 }, prompt: 'Sumberejo–Tegalsari harus menyeberangi sungai: biayanya naik menjadi 17. Jalankan lagi cara Kruskal.', hint: 'Kabel termurah lebih dulu, tolak yang membuat putaran.', done: next });
      else if (r === 6) { const cut = [4]; ask('Kembali ke jaringan semula. Jika kabel Ngasem–Wonorejo putus tertimpa pohon, dusun mana yang terputus dari balai desa?', [['Wonorejo dan Pandanwangi', true], ['Hanya Wonorejo'], ['Ngasem'], ['Tidak ada']], 2, pic({ chosen: mst.filter((i) => !cut.includes(i)), cut, nodes: reach(mst.filter((i) => !cut.includes(i))) })); }
      else if (r === 7) ask('Desa menambah satu kabel cadangan supaya putusnya Ngasem–Wonorejo tidak memutus dusun mana pun. Kabel mana yang termurah, dan berapa biaya totalnya?', [['Sumberejo–Wonorejo (11); total 56 juta', true], ['Gunungsari–Pandanwangi (16); total 61 juta'], ['Krajan–Ngasem (12); total 57 juta'], ['Wonorejo–Gunungsari (13); total 58 juta']], 1, pic({ chosen: mst }),
        then(() => ask('Setelah kabel cadangan dipasang, apakah semua kabel lain juga punya cadangan?', [['Tidak: hanya kabel di putaran Sumberejo–Ngasem–Wonorejo yang terlindungi. Makin andal, makin mahal', true], ['Ya, satu cadangan melindungi semua kabel'], ['Ya, karena sekarang ada 7 kabel'], ['Tidak ada kabel yang terlindungi']], 1, pic({ chosen: [...mst, 6], lit: [6] }))));
      else if (r === 8) ask('Mengapa hasil Kruskal hanya ada satu untuk peta ini?', [['Semua biaya kabel berbeda, jadi pohon merentang minimumnya hanya satu', true], ['Karena Krajan adalah balai desa'], ['Karena ada 7 dusun'], ['Sebenarnya ada banyak hasil dengan biaya berbeda']]);
      else ask('Tantangan (Borůvka): setiap dusun bersamaan memilih kabel termurah yang menyentuhnya. Berapa kabel terpilih dan berapa kelompok terbentuk pada putaran pertama?', [['5 kabel, 2 kelompok; lalu Ngasem–Wonorejo (10) menyambung keduanya, hasilnya sama 45 juta', true], ['7 kabel, 1 kelompok'], ['6 kabel, 1 kelompok'], ['3 kabel, 4 kelompok']], 1, pic({ chosen: boruvkaFirst() }));
    }
    render();
  },
};

function createMap(root, ctx) {
  const wrap = el('div', { class: 'act kabel-dusun' });
  root.append(wrap);
  let rule = 'bebas';
  const cost = {};
  const host = el('div', { class: 'kd-papan' });
  const out = el('p', { class: 'reveal hint' });
  let board;
  let mode = 'pasang';
  let selEdit = 7;
  function reset() {
    host.replaceChildren();
    board = cableBoard(host, ctx, { rule, cost, onDone: (t) => { ctx.sound.win(); say(out, '', `Tersambung semua: ${t} juta (termurah ${kruskal(cost).total} juta).`); } });
    out.textContent = `Termurah untuk biaya ini: ${kruskal(cost).total} juta.`;
    seg();
  }
  const segBox = el('div', { class: 'seg' });
  const edit = el('div', { class: 'kd-ubah' });
  function seg() {
    segBox.replaceChildren(...[['bebas', 'Bebas'], ['kruskal', 'Kruskal'], ['prim', 'Prim']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${rule === v ? 'on' : ''}`, type: 'button' }, l), () => { rule = v; reset(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🌲 Tunjukkan termurah'), () => { host.querySelector('.kd-peta').innerHTML = mapSvg({ chosen: kruskal(cost).take, cost, tap: false }); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '✂️ Putuskan Ngasem–Wonorejo'), () => { const left = board.chosen.filter((i) => i !== 4); const r2 = reach(left); host.querySelector('.kd-peta').innerHTML = mapSvg({ chosen: left, cut: [4], cost, nodes: r2, tap: false }); say(out, r2.size < 7 ? 'bad' : '', r2.size < 7 ? `Terputus: ${Object.keys(DUSUN).filter((d) => !r2.has(d)).map((d) => DUSUN[d][0]).join(', ')}.` : 'Semua dusun masih tersambung.'); }));
    edit.replaceChildren('Ubah biaya: ', el('select', { class: 'kd-pilih', onchange: (e) => { selEdit = Number(e.target.value); seg(); } }, KABEL.map((e, i) => el('option', { value: i, selected: i === selEdit }, nama(e)))),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { cost[selEdit] = Math.max(1, (cost[selEdit] ?? KABEL[selEdit][2]) - 1); reset(); }),
      el('b', null, ` ${cost[selEdit] ?? KABEL[selEdit][2]} `),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { cost[selEdit] = Math.min(30, (cost[selEdit] ?? KABEL[selEdit][2]) + 1); reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Biaya semula'), () => { for (const k of Object.keys(cost)) delete cost[k]; reset(); }));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Peta kabel antardusun'), segBox, edit, host, out);
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kabel-dusun' });
  root.append(wrap);
  let pts = [];
  let team = 0;
  function start(n) {
    pts = Array(n).fill(0);
    team = 0;
    const head = el('div');
    const host = el('div', { class: 'kd-papan' });
    const msg = el('p', { class: 'reveal hint' }, 'Pilih kabel termurah yang tidak membuat putaran. Salah pilih menambah biaya tim.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team, ' jt'), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head, host, msg);
    drawHead();
    const turn = () => { team = (team + 1) % n; drawHead(); };
    cableBoard(host, ctx, {
      rule: 'kruskal',
      onPick() { ctx.sound.good(); turn(); },
      onBad(i, why, extra) { pts[team] += why === 'mahal' ? extra : KABEL[i][2]; say(msg, 'bad', `Tim ${team + 1} +${why === 'mahal' ? extra : KABEL[i][2]} juta.`); turn(); },
      onDone() { setTimeout(() => finishBoard(wrap, ctx, { title: 'Jaringan selesai: 45 juta. Tambahan biaya paling kecil menang.', pts, unit: 'juta', low: true, again: () => pickTeams(wrap, 'Kabel Bergiliran', start) }), 1500); },
    });
  }
  pickTeams(wrap, 'Kabel Bergiliran', start);
}
