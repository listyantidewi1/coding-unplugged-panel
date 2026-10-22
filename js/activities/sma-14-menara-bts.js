// Menara BTS Dua Belas Desa — SMA/SMK (16–18 tahun), himpunan dominasi.
// A tower serves its own village and the villages one road away. Checking a
// proposal is quick; the greedy rule needs 4 towers, the only 3-tower answer
// is D, E, F, and covering every village twice needs 7.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

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

export function mapSvg(m, { towers = [], backup = false, marks = [], cur = null, dark = false } = {}) {
  const lit = dark ? new Set() : served(m, towers); const h = hits(m, towers);
  const roads = m.roads.map(([a, b]) => { const [x1, y1] = m.pos[a]; const [x2, y2] = m.pos[b]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#a8a29e" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9"/>`; });
  const dots = m.ids.map((v) => {
    const [x, y] = m.pos[v]; const t = towers.includes(v); const on = backup ? h[v] >= 2 : lit.has(v); const half = backup && h[v] === 1;
    return `<g data-v="${v}" class="mb-desa"><circle cx="${x}" cy="${y}" r="34" fill="transparent"/><circle cx="${x}" cy="${y}" r="27" fill="${on ? '#fde047' : half ? '#fef3c7' : '#334155'}" stroke="${v === cur ? '#2563eb' : marks.includes(v) ? '#f97316' : '#1e293b'}" stroke-width="${v === cur || marks.includes(v) ? 7 : 3}"/><text x="${x}" y="${y + 8}" font-size="23" font-weight="900" text-anchor="middle" fill="${on || half ? '#111827' : '#f8fafc'}">${v}</text>${t ? `<text x="${x + 24}" y="${y - 16}" font-size="26" text-anchor="middle">📡</text>` : ''}${backup ? `<text x="${x - 26}" y="${y - 20}" font-size="18" font-weight="900" text-anchor="middle" fill="#b91c1c">${h[v]}</text>` : ''}</g>`;
  });
  return `<svg viewBox="20 20 660 400" role="img" aria-label="Peta desa">${roads.join('')}${dots.join('')}</svg>`;
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
    const wrap = el('div', { class: 'act menara-bts' });
    root.append(wrap);
    const m = PETA;
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const pic = (o = {}) => el('div', { class: 'mb-peta kecil', html: mapSvg(m, o) });
      const roads = el('p', { class: 'mb-jalan' }, `Jalan: ${m.roads.map((x) => x.split('').join('–')).join(', ')}`);
      if (r === 0) {
        const target = m.area('D'); const marks = [];
        const box = el('div', { class: 'mb-peta' });
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk desa yang terlayani: desa D sendiri dan desa yang terhubung langsung oleh jalan.');
        const draw = () => { box.innerHTML = mapSvg(m, { towers: ['D'], marks, dark: true }); };
        box.addEventListener('pointerdown', (e) => {
          const g = e.target.closest('[data-v]');
          if (!g || solved) return;
          e.preventDefault();
          const v = g.dataset.v;
          if (marks.includes(v)) return;
          if (!target.includes(v)) { ctx.mistake(); shake(box); say(msg, 'bad', `${v} tidak terhubung langsung dengan D.`); return; }
          marks.push(v); ctx.sound.tap(); draw();
          if (marks.length === target.length) { box.innerHTML = mapSvg(m, { towers: ['D'] }); say(msg, '', `Menara di D melayani ${target.join(', ')}: 4 desa.`); next(); }
        });
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Menara dibangun di D. Desa mana saja yang terlayani?'), box, roads, msg);
      } else if (r === 1) ask('Paling banyak berapa desa yang bisa dilayani satu menara, dan di desa mana saja?', [['4 desa; menara di A, B, C, D, E, atau F', true], ['3 desa; menara di G sampai L'], ['5 desa; hanya menara di D'], ['12 desa; menara di mana saja']], 1, pic());
      else if (r === 2) ask('Usulan Pak Kades: menara di A, D, F. Apakah semua desa terlayani?', [['Tidak: H belum terlayani', true], ['Ya, semua terlayani'], ['Tidak: G belum terlayani'], ['Tidak: B dan J belum terlayani']], 2, pic({ towers: ['A', 'D', 'F'] }));
      else if (r === 3) ask('Usulan karang taruna: menara di B, C, E, I. Sah? Berapa langkah untuk memeriksa satu usulan?', [['Sah, semua terlayani; cukup menandai daerah layanan (paling banyak 4 desa per menara) lalu memeriksa 12 desa sekali', true], ['Tidak sah: H belum terlayani; perlu 495 langkah'], ['Sah; perlu mencoba 220 pilihan dulu'], ['Tidak sah: G belum terlayani; perlu 12 × 12 langkah']], 1, pic({ towers: ['B', 'C', 'E', 'I'] }));
      else if (r === 4) {
        const steps = greedy(m);
        const msg = el('p', { class: 'reveal hint' }, 'Bangun menara di desa yang melayani paling banyak desa yang belum terlayani. Seri: huruf paling awal.');
        wrap.append(el('p', { class: 'prompt' }, 'Cara rakus: ketuk desa untuk menara berikutnya.'));
        towerBoard(wrap, ctx, {
          map: m,
          locked: () => solved,
          canTap(v, towers) {
            const s = steps[towers.length];
            if (towers.includes(v) || !s) return false;
            if (v !== s.v) { const have = served(m, towers); const nw = m.area(v).filter((x) => !have.has(x)).length; ctx.mistake(); shake(wrap); say(msg, 'bad', nw < s.nw.length ? `${v} hanya menambah ${nw} desa; ${s.v} menambah ${s.nw.length}.` : `${v} juga menambah ${nw}, tetapi seri dipilih huruf paling awal: ${s.v}.`); return false; }
            return true;
          },
          onChange(towers, all) { const s = steps[towers.length - 1]; say(msg, '', `Menara ${towers.length} di ${s.v}: desa baru ${s.nw.join(', ')}. Belum terlayani: ${s.left.join(', ') || '–'}.`); if (all) { say(msg, '', `Cara rakus: ${towers.length} menara (${towers.join(', ')}).`); next(); } },
        });
        wrap.append(msg);
      } else if (r === 5) ask('Satu menara paling banyak melayani 4 desa. Paling sedikit berapa menara untuk 12 desa, dan apa syaratnya supaya cukup?', [['3 menara (3 × 4 = 12; 2 menara paling banyak 8 desa); setiap menara harus melayani tepat 4 desa tanpa tumpang tindih', true], ['2 menara, asal letaknya di tengah'], ['4 menara, karena cara rakus memakai 4'], ['12 menara, satu per desa']]);
      else if (r === 6) {
        const msg = el('p', { class: 'reveal hint' }, 'Pilih tiga desa yang daerah layanannya masing-masing 4 desa dan tidak tumpang tindih.');
        wrap.append(el('p', { class: 'prompt' }, 'Layani semua desa dengan 3 menara saja.'));
        towerBoard(wrap, ctx, { map: m, max: 3, locked: () => solved, onChange(towers, all) { if (all) { say(msg, '', `${towers.sort().join(', ')}: semua 12 desa terlayani dengan 3 menara.`); next(); } else if (towers.length === 3) say(msg, 'bad', `Belum: ${m.ids.filter((v) => !served(m, towers).has(v)).join(', ')} belum terlayani. Bongkar satu menara dan coba lagi.`); } });
        wrap.append(msg);
      } else if (r === 7) ask('Mengapa cara rakus tidak menemukan susunan 3 menara D, E, F?', [['Cara rakus memilih A lebih dulu (seri, huruf awal). A tidak termasuk satu-satunya jawaban 3 menara, dan cara rakus tidak pernah memikirkan ulang pilihannya', true], ['Karena cara rakus selalu salah'], ['Karena D, E, F tidak melayani H'], ['Karena cara rakus memilih desa dengan derajat terkecil']], 1, pic({ towers: ['D', 'E', 'F'] }));
      else if (r === 8) ask('Banyak cara memilih 3 dari 12 desa dan 4 dari 12 desa? Dengan 10⁸ pemeriksaan per detik, berapa lama untuk 50 desa/10 menara (≈ 1,03 × 10¹⁰) dan 100 desa/20 menara (≈ 5,36 × 10²⁰)?', [['220 dan 495; sekitar 100 detik dan sekitar 170.000 tahun', true], ['36 dan 48; sekitar 1 detik dan 1 jam'], ['220 dan 495; sekitar 100 detik dan 200 detik'], ['1.320 dan 11.880; sekitar 10 menit dan 10 tahun']], 1,
        el('div', { class: 'au-status' }, `C(12, 3) = ${choose(12, 3)} · C(12, 4) = ${fmtNum(choose(12, 4))} · dari pilihan 3 desa hanya ${best(m).sols.length} yang sah`));
      else {
        const msg = el('p', { class: 'reveal hint' }, '12 desa × 2 layanan = 24; satu menara paling banyak 4 layanan, jadi paling sedikit 6 menara. Tetapi 6 ternyata tidak cukup.');
        wrap.append(el('p', { class: 'prompt' }, 'Tantangan: setiap desa harus dilayani paling sedikit dua menara. Susun 7 menara.'));
        towerBoard(wrap, ctx, { map: m, backup: true, max: 7, locked: () => solved, onChange(towers, all) { if (all) { say(msg, '', `${towers.sort().join(', ')}: setiap desa dilayani paling sedikit dua menara. Komputer memastikan 6 menara tidak cukup, jadi 7 paling sedikit.`); next(); } } });
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
