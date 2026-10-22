// Pipa Air Bersih Antardusun — SMA/SMK (16–18 tahun), pohon Steiner.
// Pipes may branch anywhere: drag branch points and watch the total length
// and the angles. Triangle 2√3, square 1 + √3, rectangle 2 + √3; three pipes
// meet at 120°, like a soap film.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

const R3 = Math.sqrt(3);
export const km = (x) => x.toFixed(2).replace('.', ',');
export const PETA = {
  segitiga: { label: 'Segitiga 2 km', best: 2 * R3, dusun: { K: ['Krajan', 0, 0], N: ['Ngasem', 2, 0], T: ['Tegal', 1, R3] }, cabang: { S: [0.5, 0.35] }, pipa: [['S', 'K'], ['S', 'N'], ['S', 'T']] },
  persegi: { label: 'Persegi 1 km', best: 1 + R3, dusun: { A: ['Asri', 0, 1], B: ['Banjar', 1, 1], C: ['Cikal', 1, 0], D: ['Dadap', 0, 0] }, cabang: { P: [0.4, 0.3], Q: [0.6, 0.75] }, pipa: [['P', 'A'], ['P', 'D'], ['Q', 'B'], ['Q', 'C'], ['P', 'Q']] },
  panjang: { label: 'Persegi panjang 2 × 1 km', best: 2 + R3, dusun: { A: ['Asri', 0, 1], B: ['Banjar', 2, 1], C: ['Cikal', 2, 0], D: ['Dadap', 0, 0] }, cabang: { P: [0.6, 0.25], Q: [1.3, 0.8] }, pipa: [['P', 'A'], ['P', 'D'], ['Q', 'B'], ['Q', 'C'], ['P', 'Q']] },
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const total = (pts, pipa) => pipa.reduce((s, [a, b]) => s + dist(pts[a], pts[b]), 0);
export function mst(pts, ids) {
  const inT = [ids[0]]; const out = [];
  while (inT.length < ids.length) {
    let best = null;
    for (const a of inT) for (const b of ids) if (!inT.includes(b) && (!best || dist(pts[a], pts[b]) < best[2])) best = [a, b, dist(pts[a], pts[b])];
    inT.push(best[1]); out.push([best[0], best[1]]);
  }
  return out;
}
export const connected = (ids, pipa) => { const seen = new Set([ids[0]]); let grow = true; while (grow) { grow = false; for (const [a, b] of pipa) if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grow = true; } } return ids.every((v) => seen.has(v)); };
// Angles between consecutive pipes at a point, in degrees.
export function angles(pts, pipa, v) {
  const dirs = pipa.filter((e) => e.includes(v)).map(([a, b]) => { const o = pts[a === v ? b : a]; return Math.atan2(o[1] - pts[v][1], o[0] - pts[v][0]); }).sort((x, y) => x - y);
  if (dirs.length < 2) return [];
  return dirs.map((d, i) => { let g = (i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 2 * Math.PI) - d; return (g * 180) / Math.PI; });
}
// Soap film: move each branch point toward the geometric median of its neighbours (Weiszfeld).
export function relax(pts, pipa, branch, rounds = 200) {
  const p = Object.fromEntries(Object.entries(pts).map(([k, v]) => [k, [...v]]));
  for (let r = 0; r < rounds; r++) for (const s of branch) {
    const nb = pipa.filter((e) => e.includes(s)).map(([a, b]) => p[a === s ? b : a]);
    if (nb.length < 2) continue;
    let wx = 0; let wy = 0; let w = 0;
    for (const q of nb) { const d = Math.max(1e-6, dist(p[s], q)); wx += q[0] / d; wy += q[1] / d; w += 1 / d; }
    p[s] = [wx / w, wy / w];
  }
  return p;
}

// Pipe board: drag branch points; in edit mode tap two points to add or remove a pipe.
function pipeBoard(host, ctx, { map, edit = false, onChange, onDrop, locked = () => false, showMst = false }) {
  const pts = {}; const name = {};
  for (const [k, [n, x, y]] of Object.entries(map.dusun)) { pts[k] = [x, y]; name[k] = n; }
  let branch = Object.keys(map.cabang || {});
  for (const k of branch) pts[k] = [...map.cabang[k]];
  let pipa = (map.pipa || []).map((e) => [...e]);
  const dusun = Object.keys(map.dusun);
  let sel = null; let mstOn = showMst;
  const xs = dusun.map((k) => pts[k][0]); const ys = dusun.map((k) => pts[k][1]);
  const x0 = Math.min(...xs); const y1 = Math.max(...ys);
  const w = Math.max(...xs) - x0 || 1; const h = y1 - Math.min(...ys) || 1;
  const S = Math.min(560 / w, 300 / h);
  const X = (x) => 70 + (x - x0) * S + (560 - w * S) / 2;
  const Y = (y) => 50 + (y1 - y) * S;
  const box = el('div', { class: 'pa-peta' });
  const info = el('p', { class: 'reveal info' });
  const b = { get pts() { return pts; }, get pipa() { return pipa; }, get branch() { return branch; }, total: () => total(pts, pipa), ok: () => connected(dusun, pipa), draw,
    set(p) { for (const k of Object.keys(p)) pts[k] = [...p[k]]; draw(); },
    addBranch() { if (branch.length >= dusun.length - 2) return false; const id = 'PQRST'[branch.length]; pts[id] = [x0 + w / 2 + (branch.length - 0.5) * 0.15, y1 - h / 2]; branch = [...branch, id]; draw(); return id; },
    clear() { pipa = []; for (const k of branch) delete pts[k]; branch = []; sel = null; draw(); },
    useMst() { b.clear(); pipa = mst(pts, dusun); draw(); },
    toggleMst() { mstOn = !mstOn; draw(); } };
  function draw() {
    const lines = pipa.map(([a, c]) => { const [ax, ay] = [X(pts[a][0]), Y(pts[a][1])]; const [cx, cy] = [X(pts[c][0]), Y(pts[c][1])]; const mx = (ax + cx) / 2; const my = (ay + cy) / 2; return `<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${cy}" stroke="#0284c7" stroke-width="9" stroke-linecap="round"/><rect x="${mx - 30}" y="${my - 14}" width="60" height="26" rx="8" fill="#fff" stroke="#0284c7" stroke-width="2"/><text x="${mx}" y="${my + 6}" font-size="17" font-weight="800" text-anchor="middle">${km(dist(pts[a], pts[c]))}</text>`; });
    const ghost = mstOn ? mst(pts, dusun).map(([a, c]) => `<line x1="${X(pts[a][0])}" y1="${Y(pts[a][1])}" x2="${X(pts[c][0])}" y2="${Y(pts[c][1])}" stroke="#a855f7" stroke-width="5" stroke-dasharray="10 8"/>`) : [];
    const dots = dusun.map((k) => { const x = X(pts[k][0]); const y = Y(pts[k][1]); return `<g data-p="${k}" class="pa-titik"><circle cx="${x}" cy="${y}" r="30" fill="transparent"/><rect x="${x - 20}" y="${y - 20}" width="40" height="40" rx="8" fill="${sel === k ? '#fed7aa' : '#dcfce7'}" stroke="#166534" stroke-width="3"/><text x="${x}" y="${y + 8}" font-size="22" font-weight="900" text-anchor="middle">${k}</text><text x="${x}" y="${y + (y > 260 ? 44 : -28)}" font-size="16" font-weight="700" text-anchor="middle" fill="#334155">${name[k]}</text></g>`; });
    const bs = branch.map((k) => { const x = X(pts[k][0]); const y = Y(pts[k][1]); const ang = angles(pts, pipa, k); return `<g data-p="${k}" data-drag="1" class="pa-cabang"><circle cx="${x}" cy="${y}" r="34" fill="transparent"/><circle cx="${x}" cy="${y}" r="17" fill="${sel === k ? '#fed7aa' : '#f97316'}" stroke="#7c2d12" stroke-width="3"/><text x="${x}" y="${y + 6}" font-size="17" font-weight="900" text-anchor="middle" fill="#fff">${k}</text>${ang.length === 3 ? `<text x="${x}" y="${y + 40}" font-size="15" font-weight="800" text-anchor="middle" fill="#7c2d12">${ang.map((a) => `${Math.round(a)}°`).join(' ')}</text>` : ''}</g>`; });
    box.innerHTML = `<svg viewBox="0 0 700 400" role="img" aria-label="Peta dusun dan pipa">${ghost.join('')}${lines.join('')}${dots.join('')}${bs.join('')}</svg>`;
    const ok = connected(dusun, pipa);
    info.textContent = `Total pipa ${km(total(pts, pipa))} km${ok ? '' : ' · belum semua dusun tersambung'}${mstOn ? ` · pohon merentang minimum (ungu) ${km(total(pts, mst(pts, dusun)))} km` : ''}`;
    info.className = `reveal ${ok ? 'info' : 'bad'}`;
  }
  let drag = null;
  const toKm = (e) => { const svg = box.querySelector('svg'); const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [x0 + (q.x - 70 - (560 - w * S) / 2) / S, y1 - (q.y - 50) / S]; };
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-p]');
    if (!g || locked()) return;
    e.preventDefault();
    drag = { id: g.dataset.p, can: !!g.dataset.drag, moved: false, start: [e.clientX, e.clientY], before: total(pts, pipa) };
    try { box.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag || !drag.can) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.start[0], e.clientY - drag.start[1]) < 6) return;
    drag.moved = true;
    const [x, y] = toKm(e);
    pts[drag.id] = [Math.min(x0 + w + 0.3, Math.max(x0 - 0.3, x)), Math.min(y1 + 0.3, Math.max(y1 - h - 0.3, y))];
    draw();
    if (onChange) onChange(total(pts, pipa));
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved) { if (onDrop) onDrop(total(pts, pipa), d.before); return; }
    if (!edit) return;
    if (!sel) { sel = d.id; draw(); return; }
    if (sel === d.id) { sel = null; draw(); return; }
    const i = pipa.findIndex(([a, c]) => (a === sel && c === d.id) || (a === d.id && c === sel));
    if (i >= 0) pipa.splice(i, 1); else pipa.push([sel, d.id]);
    sel = null; ctx.sound.tap(); draw();
    if (onChange) onChange(total(pts, pipa));
  };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
  host.append(box, info);
  draw();
  return b;
}

// Drag round: reach the shortest length within 0,01 km.
function dragRound(wrap, ctx, { map, prompt, hint, done }) {
  const msg = el('p', { class: 'reveal hint' }, hint);
  let fin = false;
  wrap.append(el('p', { class: 'prompt' }, prompt));
  const b = pipeBoard(wrap, ctx, { map, locked: () => fin, onDrop(t) { if (t - map.best < 0.01) { fin = true; say(msg, '', `${km(t)} km: terpendek (tepatnya ${km(map.best)} km). Sudut di setiap titik cabang 120°.`); done(); } else say(msg, 'info', `${km(t)} km. Masih bisa lebih pendek: lihat sudut di titik cabang.`); } });
  wrap.append(el('div', { class: 'kode-baris' }, button('🧼 Bantuan selaput sabun', () => { if (fin) return; ctx.mistake(); b.set(relax(b.pts, b.pipa, b.branch, 3)); say(msg, 'info', `Selaput sabun menarik titik cabang sedikit: ${km(b.total())} km. Seret lagi.`); })), msg);
  return b;
}

export default {
  id: 'sma-15-pipa-air',
  title: 'Pipa Air Bersih Antardusun',
  topic: 'Pohon Steiner: titik cabang, sudut 120°, dan perbandingan dengan pohon merentang minimum',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🚰',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menghitung panjang jaringan dengan teorema Pythagoras, menunjukkan bahwa titik cabang bisa memperpendek jaringan, mengenali aturan tiga pipa bersudut 120°, membandingkan pohon Steiner dengan pohon merentang minimum, dan menjelaskan mengapa persoalan ini sulit untuk banyak titik.',
  extraModes: [
    { id: 'peta', icon: '🗺️', label: 'Papan Pipa', desc: 'Pilih segitiga, persegi, persegi panjang, atau peta acak 5 dusun; tambah titik cabang, sambung pipa dengan mengetuk, seret, dan bandingkan dengan pohon merentang minimum', create: createBoard },
    { id: 'giliran', icon: '🔁', label: 'Geser Bergiliran', desc: 'Tim bergantian menggeser titik cabang sekali; geseran yang memperpendek jaringan mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pipa-air' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const pic = (map, cabang, pipa) => { const h = el('div', { class: 'pa-kecil' }); pipeBoard(h, ctx, { map: { ...map, cabang, pipa }, locked: () => true }); return h; };
      const T = PETA.segitiga; const Q = PETA.persegi;
      if (r === 0) ask('Segitiga sama sisi 2 km. Jika pipa hanya boleh dari dusun ke dusun, berapa panjang terpendeknya, dan berapa tinggi segitiga?', [['4 km (dua sisi); tinggi √3 ≈ 1,73 km', true], ['6 km (tiga sisi); tinggi 2 km'], ['4 km; tinggi 1 km'], ['3,46 km; tinggi 1,73 km']], 1, pic(T, {}, [['K', 'N'], ['N', 'T']]));
      else if (r === 1) dragRound(wrap, ctx, { map: T, prompt: 'Seret titik cabang S supaya total pipa sependek mungkin.', hint: 'Perhatikan total panjang dan sudut di antara tiga pipa.', done: next });
      else if (r === 2) ask('Titik cabang di tengah alas memberi 1 + 1 + 1,73 = 3,73 km; di titik berat 3 × 1,15 = 3,46 km. Berapa penghematan titik berat dibanding 4 km?', [['0,54 km, sekitar 13 %, sekitar Rp43 juta', true], ['0,27 km, sekitar 7 %, sekitar Rp22 juta'], ['0,54 km, sekitar 54 %, sekitar Rp54 juta'], ['1 km, sekitar 25 %, sekitar Rp80 juta']], 1, pic(T, { S: [1, R3 / 3] }, T.pipa));
      else if (r === 3) ask('Persegi 1 km. Berapa panjang pohon merentang minimum, dan berapa jaringan berbentuk X dengan satu titik cabang di pusat?', [['3 km; X ≈ 4 × 0,71 = 2,83 km', true], ['4 km; X = 2 km'], ['3 km; X ≈ 4 × 0,5 = 2 km'], ['2,83 km; X = 3 km']], 1, pic(Q, { P: [0.5, 0.5] }, [['P', 'A'], ['P', 'B'], ['P', 'C'], ['P', 'D']]));
      else if (r === 4) dragRound(wrap, ctx, { map: Q, prompt: 'Dua titik cabang: P ke dua dusun kiri, Q ke dua dusun kanan, lalu P–Q. Seret keduanya.', hint: 'Targetnya lebih pendek dari 2,83 km.', done: next });
      else if (r === 5) ask('Urutkan jaringan persegi dari yang terpendek, dan apa aturan di setiap titik cabang jaringan terpendek?', [['Dua titik cabang 2,73 < X 2,83 < pohon merentang minimum 3; tiga pipa bertemu dengan sudut 120°', true], ['X 2,83 < dua titik cabang 2,73 < 3; empat pipa bersudut 90°'], ['Pohon merentang minimum paling pendek; sudut 60°'], ['Semuanya sama panjang']], 1, pic(Q, { P: [0.5 / R3, 0.5], Q: [1 - 0.5 / R3, 0.5] }, Q.pipa));
      else if (r === 6) ask('Paling banyak berapa titik cabang untuk n dusun, dan mengapa pohon merentang minimum (sma-09) tidak menemukan jaringan ini?', [['n − 2; pohon merentang minimum hanya menyambung di dusun, padahal jaringan terpendek butuh titik baru yang bukan dusun', true], ['n; karena pohon merentang minimum salah hitung'], ['n − 1; karena pipa lebih mahal dari kabel'], ['1; karena titik cabang hanya satu']]);
      else if (r === 7) ask('Untuk 50 dusun, mengapa mencari jaringan terpendek sulit, padahal memeriksa sebuah usulan mudah?', [['Banyak titik cabang, letak, dan cara menghubungkan meledak; memeriksa cukup menjumlah panjang pipa dan melihat semua dusun tersambung', true], ['Karena pipa tidak bisa diukur'], ['Karena 50 dusun selalu butuh 50 titik cabang'], ['Karena memeriksa usulan butuh mencoba semua susunan']]);
      else if (r === 8) ask('Paku di antara dua lembar plastik dicelup ke air sabun. Mengapa selaput sabun "menghitung" jaringan terpendek?', [['Tegangan permukaan membuat luas selaput sekecil mungkin; di antara dua lembar plastik luas sebanding dengan panjang garis, jadi garisnya bertemu bertiga dengan sudut 120°', true], ['Karena sabun mengikuti garis lurus antarpaku'], ['Karena selaput selalu membentuk lingkaran'], ['Karena air sabun lebih berat di tengah']], 1, pic(Q, { P: [0.5 / R3, 0.5], Q: [1 - 0.5 / R3, 0.5] }, Q.pipa));
      else {
        dragRound(wrap, ctx, { map: PETA.panjang, prompt: 'Tantangan: persegi panjang 2 × 1 km. Satu titik cabang di pusat memberi 4,47 km, lebih buruk dari pohon merentang minimum 4 km. Seret P dan Q.', hint: 'Pipa tengah sejajar sisi panjang.', done: next });
      }
    }
    render();
  },
};

function randomMap(rand) {
  const dusun = {}; const names = ['Asri', 'Banjar', 'Cikal', 'Dadap', 'Embung'];
  for (const [i, k] of ['A', 'B', 'C', 'D', 'E'].entries()) for (;;) { const p = [rand.int(0, 30) / 10, rand.int(0, 18) / 10]; if (Object.values(dusun).every(([, x, y]) => Math.hypot(x - p[0], y - p[1]) > 0.7)) { dusun[k] = [names[i], ...p]; break; } }
  return { label: 'Peta acak', dusun, cabang: {}, pipa: [] };
}

function createBoard(root, ctx) {
  const wrap = el('div', { class: 'act pipa-air' });
  root.append(wrap);
  let map = PETA.segitiga;
  const host = el('div', { class: 'pa-host' });
  const maps = el('div', { class: 'seg' });
  const tools = el('div', { class: 'seg' });
  const out = el('p', { class: 'reveal hint' }, 'Seret titik cabang oranye. Ketuk dua titik untuk menambah atau menghapus pipa.');
  let b;
  function reset(m) {
    map = m; host.replaceChildren();
    b = pipeBoard(host, ctx, { map, edit: true, onDrop(t) { if (map.best && b.ok() && t - map.best < 0.01) { ctx.sound.win(); say(out, '', `${km(t)} km: terpendek!`); } } });
    if (!map.pipa.length) b.useMst();
    out.textContent = map.best ? `Terpendek untuk peta ini: ${km(map.best)} km.` : 'Mulai dari pohon merentang minimum. Tambah titik cabang lalu sambung ulang pipanya.';
    maps.replaceChildren(...Object.values(PETA).map((p) => onTap(el('button', { class: `seg-btn ${p === map ? 'on' : ''}`, type: 'button' }, p.label), () => reset(p))),
      onTap(el('button', { class: `seg-btn ${!map.best ? 'on' : ''}`, type: 'button' }, '🎲 Peta acak 5 dusun'), () => reset(randomMap(ctx.rand))));
  }
  tools.append(
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '➕ Titik cabang'), () => { const id = b.addBranch(); say(out, id ? 'info' : 'bad', id ? `Titik cabang ${id} ditambahkan. Ketuk ${id} lalu sebuah dusun untuk memasang pipa.` : 'Paling banyak n − 2 titik cabang.'); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🧼 Selaput sabun'), () => { b.set(relax(b.pts, b.pipa, b.branch)); say(out, 'info', `Titik cabang ditarik ke letak terbaik untuk sambungan ini: ${km(b.total())} km.`); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🟣 Pohon merentang minimum'), () => b.toggleMst()),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Ulang'), () => reset(map)));
  wrap.append(el('p', { class: 'prompt' }, 'Papan pipa air'), maps, tools, host, out);
  reset(map);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pipa-air' });
  root.append(wrap);
  const order = [PETA.persegi, PETA.segitiga, PETA.panjang];
  let game = 0;
  function start(n) {
    const map = order[game++ % order.length];
    const pts = Array(n).fill(0);
    let team = 0; let turns = 0; let fin = false;
    const head = el('div');
    const msg = el('p', { class: 'reveal hint' }, 'Seret satu titik cabang sekali. Jika jaringan menjadi lebih pendek +1; mencapai terpendek +2.');
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1} · ${map.label}`));
    wrap.replaceChildren(head);
    drawHead();
    const end = (title) => { fin = true; setTimeout(() => finishBoard(wrap, ctx, { title, pts, again: () => pickTeams(wrap, 'Geser Bergiliran', start) }), 2400); };
    pipeBoard(wrap, ctx, {
      map,
      locked: () => fin,
      onDrop(t, before) {
        turns++;
        if (t - map.best < 0.01) { pts[team] += 2; ctx.sound.win(); say(msg, '', `Tim ${team + 1} mencapai ${km(t)} km, terpendek! +2.`); drawHead(); end(`Terpendek ${km(map.best)} km tercapai.`); return; }
        if (t < before - 0.005) { pts[team]++; ctx.sound.good(); say(msg, '', `Tim ${team + 1}: ${km(before)} → ${km(t)} km, +1.`); } else { ctx.sound.bad(); say(msg, 'bad', `Tim ${team + 1}: ${km(before)} → ${km(t)} km, tidak lebih pendek.`); }
        team = (team + 1) % n; drawHead();
        if (turns >= n * 4) end(`Waktu habis: ${km(t)} km; terpendek ${km(map.best)} km.`);
      },
    });
    wrap.append(msg);
  }
  pickTeams(wrap, 'Geser Bergiliran', start);
}
