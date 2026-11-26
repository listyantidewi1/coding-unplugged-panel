// Kabel Internet Antardusun — SMA/SMK (16–18 tahun), pohon merentang minimum.
// Seven hamlets and twelve possible cables: Kruskal, Prim, cycle detection,
// a cost change, a backup cable for reliability, and Borůvka's parallel rounds.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

export function mapSvg({ chosen = [], red = [], cut = [], cost = {}, lit = [], tap = true, nodes = new Set(), color = null, dim = new Set(), tapNode = false, mark = new Set() } = {}) {
  const P = (d) => [DUSUN[d][1] * 6, DUSUN[d][2] * 4];
  const lines = KABEL.map((e, i) => {
    const [x1, y1] = P(e[0]); const [x2, y2] = P(e[1]);
    const on = chosen.includes(i); const bad = red.includes(i); const isCut = cut.includes(i); const hl = lit.includes(i);
    const col = bad ? '#dc2626' : isCut ? '#94a3b8' : on ? '#16a34a' : hl ? '#f97316' : '#cbd5e1';
    const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
    return `<g ${tap ? `data-e="${i}" class="kd-kabel"` : ''}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="26"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${on || bad || hl ? 7 : 4}" ${isCut ? 'stroke-dasharray="8 8"' : ''} stroke-linecap="round"/><circle cx="${mx}" cy="${my}" r="15" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${mx}" y="${my + 5}" font-size="14" font-weight="800" text-anchor="middle" fill="#111827">${cost[i] ?? e[2]}</text></g>`;
  });
  const dots = Object.entries(DUSUN).map(([d, [n]]) => { const [x, y] = P(d); return `<g${tapNode ? ` data-d="${d}" class="kd-kabel"` : ''}${dim.has(d) ? ' opacity="0.35"' : ''}>${tapNode ? `<circle cx="${x}" cy="${y}" r="26" fill="transparent"/>` : ''}<circle cx="${x}" cy="${y}" r="14" fill="${color ? color[d] : d === 'K' ? '#fde047' : nodes.has(d) ? '#bbf7d0' : '#e0e7ff'}" stroke="${mark.has(d) ? '#dc2626' : '#334155'}" stroke-width="${mark.has(d) ? 5 : 2.5}"/><text x="${x}" y="${y + 5}" font-size="13" font-weight="900" text-anchor="middle">${d}</text><text x="${x}" y="${y + (y > 300 ? 32 : -20)}" font-size="13" font-weight="700" text-anchor="middle" fill="#334155">${n}${d === 'K' ? ' (balai desa)' : ''}</text></g>`; });
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

// ---- Tender Kabel Desa: the missions ----

const WARNA9 = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#7dd3fc', '#c4b5fd', '#f9a8d4'];
const KODE9 = Object.keys(DUSUN);
const cname = (i) => `${KABEL[i][0]}–${KABEL[i][1]}`;
function groupColors(edges) {
  const u = uf();
  for (const i of edges) u.join(KABEL[i][0], KABEL[i][1]);
  const roots = {};
  return Object.fromEntries(KODE9.map((d) => { const r = u.find(d); roots[r] ??= WARNA9[KODE9.indexOf(r)]; return [d, roots[r]]; }));
}
function budget(max = 60) {
  const bar = el('i');
  const num = el('b');
  const node = el('div', { class: 'tk9-anggaran' }, el('small', null, '💰 Anggaran'), el('span', { class: 'tk9-pipa' }, bar), num);
  return { node, set(v) { bar.style.width = `${Math.min(100, (v / max) * 100)}%`; num.textContent = `${v} / ${max} juta`; node.classList.toggle('lewat', v > max); } };
}
const mapBox = (cls = '') => el('div', { class: `kd-peta ${cls}` });
const onMap = (box, sel, fn) => box.addEventListener('pointerdown', (e) => { const g = e.target.closest(sel); if (!g) return; e.preventDefault(); fn(g); });

// Misi Kruskal Berwarna: cables queue up from the cheapest; take or refuse each.
function kruskalRound(wrap, ctx, { cost = {}, done }) {
  const order = KABEL.map((_, i) => i).sort((a, b) => (cost[a] ?? KABEL[a][2]) - (cost[b] ?? KABEL[b][2]));
  const c = (i) => cost[i] ?? KABEL[i][2];
  let k = 0;
  const take = [];
  const refused = [];
  const box = mapBox();
  const queue = el('div', { class: 'tk9-antre' });
  const money = budget();
  const ctl = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' }, 'Kabel datang dari yang termurah. Dusun yang tersambung berbagi warna kelompok. Kabel di antara dua dusun sewarna membuat putaran.');
  const draw = () => {
    const cur = order[k];
    box.innerHTML = mapSvg({ chosen: take, cut: refused, lit: cur != null ? [cur] : [], cost, tap: false, color: groupColors(take) });
    fill(queue, order.map((i, j) => el('span', { class: j < k ? (take.includes(i) ? 'ambil' : 'tolak') : j === k ? 'kini' : '' }, `${cname(i)} ${c(i)}`)));
    money.set(take.reduce((s, i) => s + c(i), 0));
    fill(ctl, cur != null && take.length < 6 ? [
      onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'ambil' }, `✔ Ambil ${cname(cur)}`), () => judge(true)),
      onTap(el('button', { class: 'btn', type: 'button', 'data-aksi': 'tolak' }, '✖ Tolak: putaran'), () => judge(false))] : null);
  };
  function judge(yes) {
    const i = order[k];
    const col = groupColors(take);
    const loop = col[KABEL[i][0]] === col[KABEL[i][1]];
    if (yes === loop) { ctx.mistake(); shake(ctl); say(msg, 'bad', loop ? `${DUSUN[KABEL[i][0]][0]} dan ${DUSUN[KABEL[i][1]][0]} sudah sewarna: kabel ini membuat putaran.` : `${DUSUN[KABEL[i][0]][0]} dan ${DUSUN[KABEL[i][1]][0]} beda warna: kabel ini menggabungkan dua kelompok. Ambil!`); return; }
    (yes ? take : refused).push(i);
    k++;
    ctx.sound.tap();
    if (take.length === 6) {
      for (; k < order.length; k++) refused.push(order[k]);
      draw();
      const total = take.reduce((s, x) => s + c(x), 0);
      say(msg, '', `Satu warna setelah kabel ke-6: ${take.map(cname).join(', ')}. Biaya ${total} juta; memasang kedua belas kabel ${KABEL.reduce((s, _, x) => s + c(x), 0)} juta. Sisa kabel pasti membuat putaran.`);
      done(total);
      return;
    }
    draw();
  }
  draw();
  wrap.append(money.node, box, queue, ctl, msg);
}

// Misi Zona Sinyal (Prim): grow from Krajan; only the cheapest cable leaving the zone is accepted.
function zoneRound(wrap, ctx, { done }) {
  const host = el('div', { class: 'kd-papan' });
  const money = budget();
  const log = el('div', { class: 'tk9-antre' });
  const picked = [];
  wrap.append(money.node, host, log);
  money.set(0);
  const b = cableBoard(host, ctx, { rule: 'prim', onPick(i) { picked.push(i); money.set(picked.reduce((s, x) => s + KABEL[x][2], 0)); fill(log, picked.map((x) => el('span', { class: 'ambil' }, `${cname(x)} ${KABEL[x][2]}`))); }, onDone(total) { b.enabled = false; say(host.querySelector('.reveal'), '', `Zona sinyal menutup ketujuh dusun: ${picked.map(cname).join(', ')} = ${total} juta. Sama dengan Kruskal, urutannya saja yang beda.`); done(); } });
  say(host.querySelector('.reveal'), 'info', 'Dusun hijau ada di zona sinyal (mulai dari Krajan). Ketuk kabel termurah yang menyeberang keluar zona.');
}

// Misi Periksa Tawaran.
function offerRound(wrap, ctx, { kind, done }) {
  const box = mapBox();
  const money = budget();
  const ctl = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' });
  const idx = (a, b) => KABEL.findIndex((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  if (kind === 'kilat') {
    let offer = [idx('K', 'N'), idx('K', 'S'), idx('N', 'S'), idx('S', 'T'), idx('T', 'G'), idx('N', 'W'), idx('W', 'P')];
    const tot = () => offer.reduce((s, i) => s + KABEL[i][2], 0);
    const draw = (red = []) => { box.innerHTML = mapSvg({ chosen: offer, red, tap: true }); money.set(tot()); };
    say(msg, 'info', `Tawaran CV Kilat: 7 kabel, ${tot()} juta. Satu kabel bisa dibuang tanpa memutus dusun mana pun. Ketuk kabel yang dibuang supaya hemat sebanyak mungkin.`);
    onMap(box, '[data-e]', (g) => {
      const i = Number(g.dataset.e);
      if (!offer.includes(i) || offer.length < 7) return;
      const rest = offer.filter((x) => x !== i);
      if (reach(rest).size < 7) { ctx.mistake(); shake(box); say(msg, 'bad', `Tanpa ${cname(i)}, ada dusun yang terputus. Cari kabel di putaran.`); return; }
      if (i !== idx('K', 'N')) { ctx.mistake(); shake(box); say(msg, 'bad', `${cname(i)} memang di putaran Krajan–Sumberejo–Ngasem, tetapi bukan yang termahal di putaran itu.`); return; }
      offer = rest;
      ctx.sound.good();
      draw();
      say(msg, '', `Putaran K–S–N dipotong di kabel termahalnya (K–N 12): ${tot()} juta, sama dengan jaringan termurah.`);
      done();
    });
    draw();
  } else if (kind === 'irit') {
    const offer = [idx('K', 'N'), idx('K', 'S'), idx('N', 'S'), idx('S', 'T'), idx('T', 'G'), idx('N', 'W')];
    const want = { e: new Set([idx('K', 'N'), idx('K', 'S'), idx('N', 'S')]), d: new Set(['P']) };
    const selE = new Set();
    const selD = new Set();
    const draw = (ok = false) => { box.innerHTML = mapSvg({ chosen: offer, red: [...selE], mark: selD, tapNode: !ok, tap: !ok }); money.set(offer.reduce((s, i) => s + KABEL[i][2], 0)); };
    say(msg, 'info', 'Tawaran UD Irit: 6 kabel, 52 juta. Ada yang salah. Ketuk semua kabel yang membentuk putaran dan dusun yang terputus, lalu periksa.');
    onMap(box, '[data-e],[data-d]', (g) => {
      if (g.dataset.d) { const d = g.dataset.d; if (selD.has(d)) selD.delete(d); else selD.add(d); }
      else { const i = Number(g.dataset.e); if (!offer.includes(i)) return; if (selE.has(i)) selE.delete(i); else selE.add(i); }
      ctx.sound.tap();
      draw();
    });
    fill(ctl, onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'periksa' }, '🔍 Periksa'), () => {
      const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
      if (!same(selE, want.e) || !same(selD, want.d)) { ctx.mistake(); shake(box); say(msg, 'bad', !same(selD, want.d) ? 'Periksa dusun: ikuti kabel dari Krajan, dusun mana yang tidak tercapai?' : 'Periksa putaran: kabel mana yang bisa diikuti melingkar kembali ke dusun awal?'); return; }
      ctx.sound.good();
      fill(ctl);
      draw(true);
      say(msg, '', 'Ketemu: putaran K–S–N memboroskan satu kabel, dan Pandanwangi tidak tersambung. 6 kabel belum tentu pohon merentang: harus tanpa putaran dan menyambung semua.');
      done();
    }));
    draw();
  } else {
    const picked = [];
    const draw = () => { box.innerHTML = mapSvg({ chosen: picked, tap: true }); money.set(picked.reduce((s, i) => s + KABEL[i][2], 0)); };
    say(msg, 'info', 'PT Ajaib menawarkan 6 kabel seharga 43 juta, tetapi merahasiakan petanya. Ketuk enam kabel termurah di peta untuk menguji tawarannya.');
    onMap(box, '[data-e]', (g) => {
      const i = Number(g.dataset.e);
      if (picked.includes(i) || picked.length >= 6) return;
      const cheaper = KABEL.map((_, x) => x).filter((x) => !picked.includes(x) && KABEL[x][2] < KABEL[i][2]);
      if (cheaper.length) { ctx.mistake(); shake(box); say(msg, 'bad', `Masih ada kabel yang lebih murah dari ${KABEL[i][2]}: ${cheaper.map((x) => `${cname(x)} ${KABEL[x][2]}`).join(', ')}.`); return; }
      picked.push(i);
      ctx.sound.tap();
      draw();
      if (picked.length === 6) { say(msg, '', `Enam kabel termurah saja sudah ${picked.reduce((s, x) => s + KABEL[x][2], 0)} juta. Jaringan 6 kabel mana pun paling sedikit 45 juta, jadi tawaran 43 juta mustahil.`); done(); }
    });
    draw();
  }
  wrap.append(money.node, box, ctl, msg);
}

// Misi Kartu Kejadian: one cable changes cost. Safe, or swap one cable out and one in.
function eventRound9(wrap, ctx, { events, done }) {
  const base = kruskal().take;
  let e = 0;
  let phase = 'tebak';
  let out = null;
  const box = mapBox();
  const card = el('div', { class: 'pp8-kejadian' });
  const money = budget();
  const ctl = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' });
  const draw = (net = base, red = [], lit = []) => {
    const [i, v] = events[e];
    box.innerHTML = mapSvg({ chosen: net, red, lit, cost: { [i]: v }, tap: phase === 'tukar' });
    money.set(net.reduce((s, x) => s + (x === i ? v : KABEL[x][2]), 0));
    fill(card, el('small', null, `Kartu kejadian ${e + 1} dari ${events.length}`), el('b', null, `${nama(KABEL[i])}: ${KABEL[i][2]} → ${v} juta`));
    fill(ctl, phase === 'tebak' ? [
      onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'aman' }, '✅ Jaringan tetap'), () => guess(true)),
      onTap(el('button', { class: 'btn', type: 'button', 'data-aksi': 'tukar' }, '🔁 Harus tukar kabel'), () => guess(false))] : null);
  };
  function guess(safe) {
    const [i, v] = events[e];
    const after = kruskal({ [i]: v }).take;
    const same = after.length === base.length && after.every((x) => base.includes(x));
    if (safe !== same) { ctx.mistake(); shake(ctl); say(msg, 'bad', same ? `Periksa lagi: ${base.includes(i) ? 'kabel di jaringan yang makin murah' : 'kabel di luar jaringan yang makin mahal'} tidak mengubah apa pun.` : `${base.includes(i) ? 'Kabel ini ada di jaringan dan makin mahal' : 'Kabel ini di luar jaringan dan makin murah'}: mungkin ada pengganti yang lebih murah.`); return; }
    ctx.sound.good();
    if (same) { say(msg, 'info', `Aman: jaringan tetap, ${after.reduce((s, x) => s + (x === i ? v : KABEL[x][2]), 0)} juta.`); return nextCard(); }
    phase = 'tukar';
    out = null;
    say(msg, 'info', base.includes(i) ? `Ketuk kabel jaringan yang keluar, lalu kabel pengganti termurah yang menyambung lagi.` : 'Kabel murah baru masuk. Ketuk dulu kabel yang masuk, lalu kabel termahal di putaran yang terbentuk untuk dikeluarkan.');
    draw();
  }
  onMap(box, '[data-e]', (g) => {
    if (phase !== 'tukar') return;
    const [i, v] = events[e];
    const after = kruskal({ [i]: v }).take;
    const leave = base.find((x) => !after.includes(x));
    const enter = after.find((x) => !base.includes(x));
    const t = Number(g.dataset.e);
    const first = base.includes(i) ? leave : enter;
    const second = base.includes(i) ? enter : leave;
    if (out == null) {
      if (t !== first) { ctx.mistake(); shake(box); say(msg, 'bad', base.includes(i) ? `Yang keluar adalah kabel yang biayanya berubah: ${cname(i)}.` : `Yang masuk adalah kabel yang kini murah: ${cname(i)}.`); return; }
      out = t;
      ctx.sound.tap();
      box.innerHTML = mapSvg({ chosen: base, red: base.includes(i) ? [t] : [], lit: base.includes(i) ? [] : [t], cost: { [i]: v }, tap: true });
      return;
    }
    if (t !== second) { ctx.mistake(); shake(box); say(msg, 'bad', base.includes(i) ? 'Pilih kabel termurah yang menyambung kembali kedua bagian yang terpisah.' : 'Pilih kabel termahal di putaran yang baru terbentuk.'); return; }
    ctx.sound.good();
    phase = 'lihat';
    draw(after, [], [enter]);
    say(msg, 'info', `Tukar: ${cname(leave)} keluar, ${cname(enter)} masuk. Biaya kini ${after.reduce((s, x) => s + (x === i ? v : KABEL[x][2]), 0)} juta.`);
    nextCard();
  });
  function nextCard() {
    e++;
    if (e === events.length) { setTimeout(() => { say(msg, '', 'Aturan cepat: kabel di luar jaringan yang naik, atau kabel di jaringan yang turun, pasti aman.'); done(); }, 1800); return; }
    setTimeout(() => { phase = 'tebak'; draw(); say(msg, 'info', 'Kartu berikutnya. Semua biaya lain kembali seperti semula.'); }, 2800);
  }
  draw();
  say(msg, 'info', 'Satu kabel berubah biaya. Apakah jaringan termurah tetap sama?');
  wrap.append(card, money.node, box, ctl, msg);
}

// Misi Tim Badai: the storm cuts N–W; add the cheapest backup, then play the storm yourself.
function stormRound(wrap, ctx, { done }) {
  const base = kruskal().take;
  const cut = KABEL.findIndex((e) => e[0] === 'N' && e[1] === 'W');
  let net = base.filter((x) => x !== cut);
  let phase = 'cadangan';
  let backup = null;
  const tries = new Set();
  const box = mapBox();
  const money = budget();
  const msg = el('p', { class: 'reveal info' }, 'Badai! Kabel Ngasem–Wonorejo putus. Ketuk kabel cadangan termurah yang menyambung lagi dusun yang padam.');
  const draw = (red = [], dark = null) => {
    const on = reach(dark ?? net);
    box.innerHTML = mapSvg({ chosen: dark ?? net, cut: phase === 'cadangan' ? [cut] : red, tap: true, dim: new Set(KODE9.filter((d) => !on.has(d))) });
    money.set((phase === 'cadangan' ? base : [...base, backup]).reduce((s, x) => s + KABEL[x][2], 0));
  };
  onMap(box, '[data-e]', (g) => {
    const t = Number(g.dataset.e);
    if (phase === 'cadangan') {
      if (net.includes(t) || t === cut) return;
      if (reach([...net, t]).size < 7) { ctx.mistake(); shake(box); say(msg, 'bad', `${cname(t)} tidak menyalakan Wonorejo dan Pandanwangi.`); return; }
      const better = KABEL.map((_, x) => x).filter((x) => x !== cut && !net.includes(x) && reach([...net, x]).size === 7 && KABEL[x][2] < KABEL[t][2]);
      if (better.length) { ctx.mistake(); shake(box); say(msg, 'bad', `${cname(t)} menyambung, tetapi ada yang lebih murah.`); return; }
      backup = t;
      phase = 'badai';
      net = [...base, t];
      ctx.sound.good();
      draw();
      say(msg, 'info', `Cadangan ${cname(t)} (${KABEL[t][2]}) dipasang di samping jaringan semula: ${[...base, t].reduce((s, x) => s + KABEL[x][2], 0)} juta. Kini kamu Tim Badai: putuskan satu kabel yang memadamkan dusun terbanyak.`);
      return;
    }
    if (phase !== 'badai' || !net.includes(t)) return;
    const left = net.filter((x) => x !== t);
    const dark = KODE9.filter((d) => !reach(left).has(d));
    tries.add(t);
    ctx.sound.tap();
    draw([t], left);
    const most = Math.max(...net.map((x) => KODE9.filter((d) => !reach(net.filter((y) => y !== x)).has(d)).length));
    if (dark.length < most) { say(msg, 'info', `Putus ${cname(t)}: ${dark.length ? `${dark.map((d) => DUSUN[d][0]).join(', ')} padam` : 'tidak ada yang padam, ada jalan lain'}. Coba kabel lain.`); return; }
    phase = 'selesai';
    say(msg, '', `Putus ${cname(t)}: ${dark.length} dusun padam (${dark.map((d) => DUSUN[d][0]).join(', ')}). Satu cadangan hanya melindungi kabel di putarannya. Makin andal, makin mahal.`);
    done();
  });
  draw();
  wrap.append(money.node, box, msg);
}

// Misi Bos Rapat Serentak (Borůvka).
function boruvkaRound(wrap, ctx, { done }) {
  let k = 0;
  let take = [];
  let phase = 1;
  const box = mapBox();
  const money = budget();
  const msg = el('p', { class: 'reveal info' });
  const touch = (d) => KABEL.map((_, i) => i).filter((i) => KABEL[i][0] === d || KABEL[i][1] === d);
  const cheapest = (d) => touch(d).sort((a, b) => KABEL[a][2] - KABEL[b][2])[0];
  const draw = () => {
    const d = KODE9[k];
    box.innerHTML = mapSvg({ chosen: take, tap: true, color: groupColors(take), lit: phase === 1 && d ? touch(d).filter((i) => !take.includes(i)) : [], mark: new Set(phase === 1 && d ? [d] : []) });
    money.set(take.reduce((s, x) => s + KABEL[x][2], 0));
  };
  const ask = () => say(msg, 'info', `Babak 1: wakil ${DUSUN[KODE9[k]][0]} menunjuk kabel termurah yang menyentuh dusunnya.`);
  onMap(box, '[data-e]', (g) => {
    const t = Number(g.dataset.e);
    if (phase === 1) {
      const d = KODE9[k];
      if (t !== cheapest(d)) { ctx.mistake(); shake(box); say(msg, 'bad', touch(d).includes(t) ? `Ada kabel lebih murah yang menyentuh ${DUSUN[d][0]}.` : `Kabel itu tidak menyentuh ${DUSUN[d][0]}.`); return; }
      if (!take.includes(t)) take.push(t);
      ctx.sound.tap();
      k++;
      if (k < KODE9.length) { draw(); ask(); return; }
      phase = 2;
      draw();
      say(msg, 'info', `Babak 1 selesai serentak: ${take.length} kabel, 2 kelompok warna. Babak 2: ketuk kabel termurah yang menghubungkan kedua kelompok.`);
      return;
    }
    if (phase !== 2) return;
    const col = groupColors(take);
    const between = KABEL.map((_, i) => i).filter((i) => col[KABEL[i][0]] !== col[KABEL[i][1]]).sort((a, b) => KABEL[a][2] - KABEL[b][2]);
    if (t !== between[0]) { ctx.mistake(); shake(box); say(msg, 'bad', col[KABEL[t][0]] === col[KABEL[t][1]] ? 'Kabel itu di dalam satu kelompok: putaran.' : 'Ada kabel antarkelompok yang lebih murah.'); return; }
    take.push(t);
    phase = 3;
    ctx.sound.good();
    draw();
    say(msg, '', `${cname(t)} menyatukan semuanya: ${take.reduce((s, x) => s + KABEL[x][2], 0)} juta, sama dengan Kruskal dan Prim. Rapat serentak cocok untuk banyak komputer yang bekerja bersamaan.`);
    done();
  });
  draw();
  ask();
  wrap.append(money.node, box, msg);
}

const HEAD09 = {
  kruskal: ['Kruskal Berwarna', 'Pasang kabel dari yang termurah. Tolak kabel yang menutup putaran.'],
  prim: ['Zona Sinyal', 'Sinyal tumbuh dari balai desa Krajan, satu kabel termurah setiap kali.'],
  tawaran: ['Periksa Tawaran', 'Kontraktor lain mengajukan tawaran. Bongkar kelemahannya.'],
  kejadian: ['Kartu Kejadian', 'Harga satu kabel berubah. Apakah jaringan termurah ikut berubah?'],
  badai: ['Tim Badai', 'Badai memutus kabel. Pasang cadangan, lalu uji jaringan sebagai Tim Badai.'],
  boss: ['Rapat Serentak', 'Semua dusun memilih bersamaan, lalu kelompok-kelompok disatukan.'],
};

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
  goal: 'Murid menjadi tim teknis tender kabel desa: memasang kabel termurah dengan kartu warna kelompok (Kruskal) dan zona sinyal (Prim), membongkar tawaran kontraktor lain, menghadapi kartu kejadian yang mengubah biaya, memasang cadangan saat badai, dan menjalankan rapat serentak (Borůvka).',
  extraModes: [
    { id: 'peta', icon: '🗺️', label: 'Peta Kabel', desc: 'Pasang kabel bebas atau dengan aturan Kruskal atau Prim; ubah biaya sebuah kabel dan putuskan kabel untuk melihat dusun yang terputus', create: createMap },
    { id: 'giliran', icon: '🔁', label: 'Kabel Bergiliran', desc: 'Tim bergantian memilih satu kabel; kabel yang membuat putaran atau lebih mahal dari pilihan terbaik menambah biaya tim itu', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kabel-dusun tk9-main' });
    root.append(wrap);
    const costs = ctx.rand.shuffle(Array.from({ length: 16 }, (_, i) => i + 4)).slice(0, KABEL.length);
    const randCost = Object.fromEntries(costs.map((v, i) => [i, v]));
    const pool = [[0, 20], [6, 3], [9, 4], [1, 17], [5, 18]];
    const extra = ctx.rand.shuffle(pool).slice(0, 2);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD09[key], '🔌'));
      if (r === 0) { head('kruskal', 1); kruskalRound(wrap, ctx, { done: () => next(5600) }); }
      else if (r === 1) { head('prim', 2); zoneRound(wrap, ctx, { done: () => next(5200) }); }
      else if (r === 2) { head('tawaran', 3); offerRound(wrap, ctx, { kind: 'kilat', done: () => next(5200) }); }
      else if (r === 3) { head('kejadian', 4); eventRound9(wrap, ctx, { events: [[7, 17], [0, 20]], done: () => next(5200) }); }
      else if (r === 4) { head('tawaran', 3); offerRound(wrap, ctx, { kind: 'irit', done: () => next(5600) }); }
      else if (r === 5) { head('kruskal', 1); kruskalRound(wrap, ctx, { cost: randCost, done: () => next(5600) }); }
      else if (r === 6) { head('kejadian', 4); eventRound9(wrap, ctx, { events: [[11, 4], [3, 18], ...extra.slice(0, 1)], done: () => next(5200) }); }
      else if (r === 7) { head('badai', 5); stormRound(wrap, ctx, { done: () => next(5600) }); }
      else if (r === 8) { head('tawaran', 3); offerRound(wrap, ctx, { kind: 'ajaib', done: () => next(5600) }); }
      else { head('boss', 'Bos'); boruvkaRound(wrap, ctx, { done: () => next(5600) }); }
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
