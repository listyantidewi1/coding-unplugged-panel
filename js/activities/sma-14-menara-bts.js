// Menara BTS Dua Belas Desa — SMA/SMK (16–18 tahun), himpunan dominasi.
// A tower serves its own village and the villages one road away. Checking a
// proposal is quick; the greedy rule needs 4 towers, the only 3-tower answer
// is D, E, F, and covering every village twice needs 7.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const DESA = { A: [200, 110], B: [585, 190], C: [345, 125], D: [480, 320], E: [105, 225], F: [470, 75], G: [610, 330], H: [165, 345], I: [310, 380], J: [610, 60], K: [380, 255], L: [65, 85] };
export const JALAN = ['AC', 'AE', 'AL', 'BF', 'BG', 'BJ', 'CF', 'CK', 'DG', 'DI', 'DK', 'EH', 'EL', 'FJ', 'HI'];

export function makeMap(pos, roads) {
  const ids = Object.keys(pos).sort();
  const adj = Object.fromEntries(ids.map((v) => [v, new Set([v])]));
  for (const [a, b] of roads) { adj[a].add(b); adj[b].add(a); }
  return { pos, roads, ids, area: (v) => [...adj[v]].sort() };
}
export const PETA = makeMap(DESA, JALAN);

export const served = (m, towers) => new Set(towers.flatMap((t) => m.area(t)));
export const hits = (m, towers) => Object.fromEntries(m.ids.map((v) => [v, towers.filter((t) => m.area(t).includes(v)).length]));
export function greedy(m) {
  const have = new Set(); const steps = [];
  while (have.size < m.ids.length) {
    let best = null; let bestNew = [];
    for (const v of m.ids) { const nw = m.area(v).filter((x) => !have.has(x)); if (nw.length > bestNew.length) { best = v; bestNew = nw; } }
    bestNew.forEach((x) => have.add(x));
    steps.push({ v: best, nw: bestNew, left: m.ids.filter((x) => !have.has(x)) });
  }
  return steps;
}
function* combos(arr, k, start = 0, pre = []) {
  if (pre.length === k) { yield pre; return; }
  for (let i = start; i <= arr.length - (k - pre.length); i++) yield* combos(arr, k, i + 1, [...pre, arr[i]]);
}
// Fewest towers so that every village is served at least `need` times, and all such sets.
export function best(m, need = 1) {
  for (let k = 1; k <= m.ids.length; k++) {
    const sols = [];
    for (const c of combos(m.ids, k)) { const h = hits(m, c); if (m.ids.every((v) => h[v] >= need)) sols.push(c); }
    if (sols.length) return { k, sols };
  }
  return { k: m.ids.length, sols: [m.ids] };
}
export const choose = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return Math.round(r); };

export function randomMap(rand, n) {
  const ids = 'ABCDEFGHIJKLMNOPQRST'.slice(0, n).split('');
  const pos = {};
  for (const v of ids) for (;;) { const p = [rand.int(50, 650), rand.int(50, 380)]; if (Object.values(pos).every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > 95)) { pos[v] = p; break; } }
  const d = (a, b) => Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]);
  const roads = new Set();
  for (const v of ids) { const near = ids.filter((x) => x !== v).sort((a, b) => d(v, a) - d(v, b)); const k = rand.int(1, 2); for (const x of near.slice(0, k)) roads.add([v, x].sort().join('')); }
  return makeMap(pos, [...roads]);
}

export function mapSvg(m, { towers = [], backup = false, marks = [], cur = null, dark = false, labels = {}, cut = [], fresh = [] } = {}) {
  const lit = dark ? new Set() : served(m, towers); const h = hits(m, towers);
  const roads = m.roads.map(([a, b]) => { const [x1, y1] = m.pos[a]; const [x2, y2] = m.pos[b]; const isNew = fresh.some(([p, q]) => (p === a && q === b) || (p === b && q === a)); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isNew ? '#16a34a' : '#a8a29e'}" stroke-width="${isNew ? 8 : 5}" stroke-linecap="round" stroke-dasharray="${isNew ? 'none' : '2 9'}"/>`; });
  const cuts = cut.map(([a, b]) => { const [x1, y1] = m.pos[a]; const [x2, y2] = m.pos[b]; const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#dc2626" stroke-width="4" stroke-dasharray="10 10" opacity="0.7"/><text x="${mx}" y="${my + 10}" font-size="30" text-anchor="middle">⛔</text>`; });
  const dots = m.ids.map((v) => {
    const [x, y] = m.pos[v]; const t = towers.includes(v); const on = backup ? h[v] >= 2 : lit.has(v); const half = backup && h[v] === 1;
    return `<g data-v="${v}" class="mb-desa"><circle cx="${x}" cy="${y}" r="34" fill="transparent"/><circle cx="${x}" cy="${y}" r="27" fill="${on ? '#fde047' : half ? '#fef3c7' : '#334155'}" stroke="${v === cur ? '#2563eb' : marks.includes(v) ? '#f97316' : '#1e293b'}" stroke-width="${v === cur || marks.includes(v) ? 7 : 3}"/><text x="${x}" y="${y + 8}" font-size="23" font-weight="900" text-anchor="middle" fill="${on || half ? '#111827' : '#f8fafc'}">${v}</text>${t ? `<text x="${x + 24}" y="${y - 16}" font-size="26" text-anchor="middle">📡</text>` : ''}${backup ? `<text x="${x - 26}" y="${y - 20}" font-size="18" font-weight="900" text-anchor="middle" fill="#b91c1c">${h[v]}</text>` : ''}${labels[v] != null ? `<text x="${x - 30}" y="${y - 22}" font-size="20" font-weight="900" text-anchor="middle" fill="#9a3412" stroke="#fff" stroke-width="4" paint-order="stroke">${labels[v]}</text>` : ''}</g>`;
  });
  return `<svg viewBox="20 20 660 400" role="img" aria-label="Peta desa">${roads.join('')}${cuts.join('')}${dots.join('')}</svg>`;
}

// Tower board: tap a village to build or remove a tower.
function towerBoard(host, ctx, { map: m, backup = false, max = Infinity, onChange, canTap, locked = () => false }) {
  let towers = [];
  const box = el('div', { class: 'mb-peta' });
  const info = el('p', { class: 'reveal info' });
  const b = { get towers() { return towers; }, set(t) { towers = [...t]; draw(); }, reset() { towers = []; draw(); }, setBackup(x) { backup = x; draw(); }, draw, info };
  function draw() {
    box.innerHTML = mapSvg(m, { towers, backup });
    const h = hits(m, towers); const ok = m.ids.filter((v) => h[v] >= (backup ? 2 : 1)).length;
    info.textContent = `📡 ${towers.length} menara · ${ok} dari ${m.ids.length} desa terlayani${backup ? ' dua kali' : ''}${towers.length ? ` · menara: ${[...towers].sort().join(', ')}` : ''}`;
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-v]');
    if (!g || locked()) return;
    e.preventDefault();
    const v = g.dataset.v;
    if (canTap && !canTap(v, towers)) return;
    if (towers.includes(v)) towers = towers.filter((x) => x !== v);
    else if (towers.length >= max) { ctx.mistake(); shake(box); say(info, 'bad', `Paling banyak ${max} menara.`); return; }
    else towers = [...towers, v];
    ctx.sound.tap();
    draw();
    const h = hits(m, towers);
    if (onChange) onChange(towers, m.ids.every((x) => h[x] >= (backup ? 2 : 1)), v);
  });
  host.append(box, info);
  draw();
  return b;
}

// ---------- Permainan: Nyalakan Desa ----------
// Bottle-cap towers on a map of dark villages: measure each tower's reach,
// verify proposals at the desk, predict the greedy robot, beat it with three
// towers, adapt to field event cards, and build the backup network.

const tapMap = (box, fn) => box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-v]'); if (!g) return; e.preventDefault(); fn(g.dataset.v); });

// Misi 1: build test towers; each village shows how many villages its tower lights.
function reachRound(wrap, ctx, { map: m, done }) {
  const tried = {};
  const top = Math.max(...m.ids.map((v) => m.area(v).length));
  const goal = m.ids.filter((v) => m.area(v).length === top);
  let cur = null;
  let fin = false;
  const box = el('div', { class: 'mb-peta' });
  const msg = el('p', { class: 'reveal info' }, `Ketuk desa untuk mencoba menara di sana. Temukan semua desa yang menaranya menyalakan paling banyak desa.`);
  const tally = el('div', { class: 'nd14-hitung' });
  function draw() {
    box.innerHTML = mapSvg(m, { towers: cur ? [cur] : [], dark: !cur, labels: Object.fromEntries(Object.entries(tried).map(([v, n]) => [v, n === top ? `⭐${n}` : n])) });
    const found = goal.filter((v) => tried[v]);
    fill(tally, el('span', null, '🔦 Dicoba: ', el('b', null, Object.keys(tried).length)), el('span', null, `⭐ Menyalakan ${top} desa: `, el('b', null, found.length ? found.join(', ') : '–')));
  }
  tapMap(box, (v) => {
    if (fin) return;
    cur = v;
    tried[v] = m.area(v).length;
    ctx.sound.tap();
    draw();
    say(msg, 'info', `Menara di ${v} menyalakan ${m.area(v).join(', ')}: ${tried[v]} desa.`);
    if (goal.every((x) => tried[x])) { fin = true; say(msg, '', `Paling banyak ${top} desa, dari menara di ${goal.join(', ')}. Jadi 12 desa butuh paling sedikit 12 : ${top} = ${Math.ceil(m.ids.length / top)} menara.`); done(); }
  });
  wrap.append(tally, box, msg);
  draw();
}

// Misi 2: the verification desk. Tap every village that stays dark, or declare the proposal valid.
function verifyRound(wrap, ctx, { map: m, props, done }) {
  let n = 0;
  let marks = [];
  let wait = false;
  let shown = false;
  const card = el('div');
  const box = el('div', { class: 'mb-peta' });
  const tools = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const p = props[n];
    fill(card, el('div', { class: 'pp8-kejadian' }, el('small', null, `📋 Usulan ${n + 1} dari ${props.length}`), el('b', null, `${p.who}: menara di ${p.t.join(', ')}`)));
    box.innerHTML = mapSvg(m, { towers: p.t, dark: !shown, marks });
  }
  function finish(text) {
    shown = true; wait = true; draw(); ctx.sound.good(); say(msg, '', text); n++;
    if (n === props.length) { fill(tools); done(); return; }
    setTimeout(() => { if (!box.isConnected) return; marks = []; shown = false; wait = false; draw(); say(msg, 'info', 'Ketuk setiap desa yang masih gelap, atau nyatakan sah.'); }, 2800);
  }
  tapMap(box, (v) => {
    if (wait || marks.includes(v)) return;
    const p = props[n];
    const lit = served(m, p.t);
    if (lit.has(v)) { ctx.mistake(); shake(box); const by = p.t.filter((t) => m.area(t).includes(v)); say(msg, 'bad', `${v} dilayani menara ${by.join(', ')}.`); return; }
    marks.push(v); ctx.sound.tap(); draw();
    const dark = m.ids.filter((x) => !lit.has(x));
    if (marks.length === dark.length) finish(`Tidak sah: ${dark.join(', ')} gelap. Cukup periksa ${m.ids.length} desa sekali.`);
    else say(msg, 'info', `${v} gelap. Ada lagi?`);
  });
  fill(tools, button('✓ Sah, semua menyala', () => {
    if (wait) return;
    const p = props[n];
    const dark = m.ids.filter((x) => !served(m, p.t).has(x));
    if (dark.length) { ctx.mistake(); shake(box); say(msg, 'bad', 'Belum: masih ada desa yang gelap.'); return; }
    finish(`Sah: ${p.t.length} menara menyalakan semua ${m.ids.length} desa.`);
  }, 'primary'));
  wrap.append(card, box, tools, msg);
  say(msg, 'info', 'Ketuk setiap desa yang masih gelap, atau nyatakan sah.');
  draw();
}

// Misi 3: predict the greedy robot (most dark villages, ties to the earliest letter).
function robotRound14(wrap, ctx, { map: m, done }) {
  const steps = greedy(m);
  const msg = el('p', { class: 'reveal info' }, '🤖 Robot membangun menara di desa yang menyalakan paling banyak desa gelap (seri: huruf paling awal). Ketuk pilihannya.');
  const b = towerBoard(wrap, ctx, {
    map: m,
    locked: () => b.done,
    canTap(v, towers) {
      const s = steps[towers.length];
      if (towers.includes(v) || !s) return false;
      if (v !== s.v) { const have = served(m, towers); const nw = m.area(v).filter((x) => !have.has(x)).length; ctx.mistake(); shake(wrap); say(msg, 'bad', nw < s.nw.length ? `${v} hanya menyalakan ${nw} desa gelap. Ada yang lebih banyak.` : `${v} juga ${nw}, tetapi seri dipilih huruf paling awal.`); return false; }
      return true;
    },
    onChange(towers, all) {
      const s = steps[towers.length - 1];
      if (!all) { say(msg, 'info', `Menara ${towers.length} di ${s.v}: menyalakan ${s.nw.join(', ')}. Masih gelap: ${s.left.join(', ')}.`); return; }
      b.done = true;
      const k = best(m).k;
      say(msg, '', `Robot: ${towers.length} menara (${towers.join(', ')}).${towers.length > k ? ` Paling sedikit ${k}: robot tidak pernah memikirkan ulang pilihannya.` : ''}`);
      done();
    },
  });
  wrap.append(msg);
}

// Misi 4 (and event cards): light every village with as few towers as possible.
function fewestRound(wrap, ctx, { map: m, max = Infinity, start = [], intro, win, done }) {
  const k = best(m).k;
  const msg = el('p', { class: 'reveal info' }, intro);
  let fin = false;
  const check = (towers, all) => {
    if (!all) { say(msg, towers.length >= max ? 'bad' : 'info', towers.length >= max ? `Masih gelap: ${m.ids.filter((v) => !served(m, towers).has(v)).join(', ')}. Bongkar satu menara dan coba lagi.` : intro); return; }
    if (towers.length > k) { say(msg, 'info', `Semua menyala dengan ${towers.length} menara. Bisa lebih hemat?`); return; }
    fin = true; ctx.sound.good(); say(msg, '', win([...towers].sort())); done();
  };
  const b = towerBoard(wrap, ctx, { map: m, max, locked: () => fin, onChange: (t, all) => check(t, all) });
  if (start.length) b.set(start);
  wrap.append(msg);
  return { now: () => { const h = hits(m, b.towers); check(b.towers, m.ids.every((v) => h[v] >= 1)); } };
}

// Misi 5: a field event changes the map. Predict, then fix the towers.
function eventRound14(wrap, ctx, { events, done }) {
  let n = 0;
  const area = el('div', { class: 'nd14-area' });
  wrap.append(area);
  function show() {
    const ev = events[n];
    const k = best(ev.map).k;
    const dir = k > 3 ? 'naik' : k < 3 ? 'turun' : 'tetap';
    const msg = el('p', { class: 'reveal info' }, 'Tebak: menara paling sedikit naik, turun, atau tetap?');
    const tools = el('div', { class: 'kode-baris' });
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `🃏 Kartu kejadian ${n + 1} dari ${events.length}`), el('b', null, ev.text), el('span', null, 'Susunan lama: D, E, F (3 menara).')), el('div', { class: 'mb-peta kecil', html: mapSvg(ev.map, { towers: ['D', 'E', 'F'], cut: ev.cut || [], fresh: ev.fresh || [] }) }), tools, msg);
    fill(tools, [['⬆️ Naik', 'naik'], ['⬇️ Turun', 'turun'], ['➡️ Tetap', 'tetap']].map(([l, v]) => button(l, (e) => {
      if (v !== dir) { ctx.mistake(); shake(e?.currentTarget || tools); say(msg, 'bad', 'Periksa lagi desa yang terdampak. Coba lagi.'); return; }
      ctx.sound.good();
      fill(area);
      const after = () => { n++; if (n < events.length) setTimeout(() => { if (area.isConnected) show(); }, 3000); else done(); };
      const r = fewestRound(area, ctx, { map: ev.map, start: ['D', 'E', 'F'], intro: `Tebakan benar: ${k} menara. Atur ulang menaranya.`, win: (t) => `${t.join(', ')}: ${k} menara. ${ev.why}`, done: after });
      const h = hits(ev.map, ['D', 'E', 'F']);
      if (ev.map.ids.every((x) => h[x] >= 1) && k === 3) r.now();
    })));
  }
  show();
}

const PETA_LONGSOR = makeMap(DESA, JALAN.filter((x) => x !== 'EH'));
const PETA_HL = makeMap(DESA, [...JALAN, 'HL']);
const PETA_M = makeMap({ ...DESA, M: [640, 140] }, [...JALAN, 'JM']);
const KEJADIAN14 = {
  longsor: { text: 'Longsor memutus jalan E–H.', map: PETA_LONGSOR, cut: [['E', 'H']], why: 'H kini hanya terjangkau dari H atau I, jadi 3 menara tidak cukup lagi.' },
  hl: { text: 'Jalan baru dibuka antara H dan L.', map: PETA_HL, fresh: [['H', 'L']], why: 'D, E, F tetap menyalakan semua desa; kini D, F, L juga bisa.' },
  m: { text: 'Desa baru, M, berdiri di dekat J.', map: PETA_M, fresh: [['J', 'M']], why: '13 desa, dan satu menara paling banyak menyalakan 4, jadi 3 menara (12 desa) tidak cukup.' },
};

// Web variation: three proposals for a random map, one of them valid.
function proposals14(m, rand) {
  const good = best(m).sols[0];
  const g = greedy(m).map((s) => s.v);
  const drop = g.slice(0, -1);
  const swapIn = rand.pick(m.ids.filter((v) => !good.includes(v)));
  const swapped = [...good.slice(1), swapIn].sort();
  const list = [{ who: 'Pak Kades', t: drop }, { who: 'Karang taruna', t: [...good].sort() }];
  if (m.ids.some((v) => !served(m, swapped).has(v))) list.push({ who: 'Bu Camat', t: swapped });
  return rand.shuffle(list);
}

const HEAD14 = {
  jangkau: ['Peta Jangkauan', 'Coba menara di berbagai desa. Desa yang terlayani menyala.'],
  verifikasi: ['Meja Verifikasi', 'Periksa usulan: desa mana yang masih gelap?'],
  robot: ['Robot Rakus', 'Tebak desa tempat robot membangun menara berikutnya.'],
  tiga: ['Tantangan Hemat', 'Nyalakan semua desa dengan menara sesedikit mungkin.'],
  kejadian: ['Kartu Kejadian', 'Peta berubah di lapangan. Tebak arah perubahannya, lalu atur ulang menara.'],
  boss: ['Menara Cadangan', 'Setiap desa harus dilayani paling sedikit dua menara.'],
};

export default {
  id: 'sma-14-menara-bts',
  title: 'Menara BTS Dua Belas Desa',
  topic: 'Himpunan dominasi: memeriksa usulan, cara rakus, dan batas bawah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📡',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menentukan daerah layanan menara, memeriksa usulan dengan cepat, menjalankan cara rakus, membuktikan batas bawah dan menemukan susunan terbaik, menghitung banyak pilihan, serta menjelaskan sifat mudah diperiksa, sulit dicari.',
  extraModes: [
    { id: 'peta', icon: '🗺️', label: 'Peta Menara', desc: 'Bangun dan bongkar menara bebas, jalankan cara rakus langkah demi langkah, nyalakan mode cadangan, tunjukkan susunan terbaik, dan buat peta acak 12–20 desa', create: createMap },
    { id: 'giliran', icon: '🔁', label: 'Menara Bergiliran', desc: 'Tim bergantian membangun satu menara; setiap desa baru yang menyala menjadi poin tim, menara yang tidak menyalakan desa baru −1', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act menara-bts nd14-main' });
    root.append(wrap);
    const m = PETA;
    const acak = randomMap(ctx.rand, ctx.rand.int(12, 15));
    const acakProps = proposals14(acak, ctx.rand);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD14[k], '📡'));
      if (r === 0) { head('jangkau', 1); reachRound(wrap, ctx, { map: m, done: () => next(5200) }); }
      else if (r === 1) { head('verifikasi', 2); verifyRound(wrap, ctx, { map: m, props: [{ who: 'Pak Kades', t: ['A', 'D', 'F'] }, { who: 'Karang taruna', t: ['B', 'C', 'E', 'I'] }], done: () => next() }); }
      else if (r === 2) { head('robot', 3); robotRound14(wrap, ctx, { map: m, done: () => next(5200) }); }
      else if (r === 3) { head('tiga', 4); fewestRound(wrap, ctx, { map: m, max: 3, intro: 'Batas 3 menara: 2 menara paling banyak 8 desa, jadi 3 adalah batas bawah.', win: (t) => `${t.join(', ')}: 12 desa menyala. Dari ${choose(12, 3)} pilihan 3 desa, hanya ini yang berhasil.`, done: () => next(5600) }); }
      else if (r === 4) { head('kejadian', 5); eventRound14(wrap, ctx, { events: [KEJADIAN14.longsor], done: () => next(5600) }); }
      else if (r === 5) { head('kejadian', 5); eventRound14(wrap, ctx, { events: [KEJADIAN14.hl, KEJADIAN14.m], done: () => next(5600) }); }
      else if (r === 6) { head('verifikasi', 2); verifyRound(wrap, ctx, { map: acak, props: acakProps, done: () => next() }); }
      else if (r === 7) { head('robot', 3); robotRound14(wrap, ctx, { map: acak, done: () => next(5200) }); }
      else if (r === 8) { const k = best(acak).k; head('tiga', 4); fewestRound(wrap, ctx, { map: acak, max: k, intro: `Peta baru, ${acak.ids.length} desa. Batas ${k} menara.`, win: (t) => `${t.join(', ')}: semua menyala. Untuk 50 desa dan 10 menara ada sekitar 10¹⁰ pilihan (100 detik); 100 desa dan 20 menara sekitar 5 × 10²⁰ (170.000 tahun).`, done: () => next(5600) }); }
      else {
        head('boss', 'Bos');
        const msg = el('p', { class: 'reveal info' }, '12 desa × 2 layanan = 24, dan satu menara paling banyak 4 layanan: paling sedikit 6. Tetapi 6 ternyata tidak cukup. Susun 7 menara.');
        let fin = false;
        towerBoard(wrap, ctx, { map: m, backup: true, max: 7, locked: () => fin, onChange(towers, all) { if (all) { fin = true; ctx.sound.good(); say(msg, '', `${[...towers].sort().join(', ')}: setiap desa dilayani dua menara. 6 tidak cukup, jadi 7 paling sedikit; ada ${best(m, 2).sols.length} susunan seperti ini.`); next(5600); } } });
        wrap.append(msg);
      }
    }
    render();
  },
};

function createMap(root, ctx) {
  const wrap = el('div', { class: 'act menara-bts' });
  root.append(wrap);
  let m = PETA;
  let n = 12;
  let backup = false;
  let timer = null;
  const host = el('div', { class: 'mb-host' });
  const tools = el('div', { class: 'seg' });
  const out = el('p', { class: 'reveal hint' });
  let b;
  function reset() {
    clearInterval(timer);
    host.replaceChildren();
    b = towerBoard(host, ctx, { map: m, backup, onChange(towers, all) { if (all) { const k = best(m, backup ? 2 : 1).k; say(out, towers.length === k ? '' : 'info', `Semua terlayani dengan ${towers.length} menara${towers.length === k ? ': paling sedikit!' : `; paling sedikit ${k}`}.`); if (towers.length === k) ctx.sound.win(); } } });
    out.textContent = '';
    drawTools();
  }
  function drawTools() {
    tools.replaceChildren(
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Peta lembar kerja'), () => { m = PETA; reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, `🎲 Peta acak (${n} desa)`), () => { m = randomMap(ctx.rand, n); reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { n = Math.max(12, n - 2); drawTools(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { n = Math.min(20, n + 2); drawTools(); }),
      onTap(el('button', { class: `seg-btn ${backup ? 'on' : ''}`, type: 'button' }, '🛟 Mode cadangan'), () => { backup = !backup; b.setBackup(backup); drawTools(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '▶️ Cara rakus'), () => {
        clearInterval(timer); b.reset();
        const steps = greedy(m); let k = 0;
        timer = setInterval(() => { if (!wrap.isConnected || k >= steps.length) { clearInterval(timer); if (wrap.isConnected) say(out, '', `Cara rakus: ${steps.length} menara (${steps.map((s) => s.v).join(', ')}); paling sedikit ${best(m).k}.`); return; } const s = steps[k++]; b.set([...b.towers, s.v]); say(out, 'info', `Menara ${k} di ${s.v}: desa baru ${s.nw.join(', ')}.`); }, 1000);
      }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🏁 Terbaik'), () => { clearInterval(timer); const r = best(m, backup ? 2 : 1); b.set(r.sols[0]); say(out, '', `Paling sedikit ${r.k} menara; ada ${r.sols.length} susunan seperti ini (dari ${fmtNum(choose(m.ids.length, r.k))} pilihan ${r.k} desa).`); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Bongkar semua'), () => { clearInterval(timer); b.reset(); out.textContent = ''; }));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Peta menara BTS'), tools, host, out);
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act menara-bts' });
  root.append(wrap);
  let game = 0;
  function start(n) {
    const m = game++ ? randomMap(ctx.rand, 14) : PETA;
    const pts = Array(n).fill(0);
    let team = 0;
    let fin = false;
    const head = el('div');
    const msg = el('p', { class: 'reveal hint' }, 'Ketuk satu desa untuk membangun menara. Setiap desa baru yang menyala +1; menara yang tidak menyalakan desa baru −1.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head);
    drawHead();
    towerBoard(wrap, ctx, {
      map: m,
      locked: () => fin,
      canTap: (v, towers) => !towers.includes(v),
      onChange(towers, all, v) {
        const before = served(m, towers.filter((x) => x !== v));
        const nw = m.area(v).filter((x) => !before.has(x)).length;
        pts[team] += nw || -1;
        say(msg, nw ? '' : 'bad', nw ? `Tim ${team + 1}: ${nw} desa baru, +${nw}.` : `Tim ${team + 1}: tidak ada desa baru, −1.`);
        if (nw) ctx.sound.good(); else ctx.sound.bad();
        team = (team + 1) % n; drawHead();
        if (all) {
          fin = true;
          const k = best(m).k;
          setTimeout(() => finishBoard(wrap, ctx, { title: `Semua desa terlayani dengan ${towers.length} menara; paling sedikit ${k}.`, pts, again: () => pickTeams(wrap, 'Menara Bergiliran', start) }), 2600);
        }
      },
    });
    wrap.append(msg);
  }
  pickTeams(wrap, 'Menara Bergiliran', start);
}
