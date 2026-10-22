// Jadwal Ujian Tanpa Bentrok — SMA/SMK (16–18 tahun), pewarnaan graf.
// Nine students sit make-up exams in eight subjects: draw the conflict graph,
// colour it greedily in list order (5 sessions) and by degree (4), prove 4 is
// the minimum with a clique, then adapt when data or room limits change.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const MAPEL = ['Bio', 'Kim', 'Fis', 'MTL', 'Inf', 'Eko', 'Sos', 'Geo'];
export const NAMA = { Bio: 'Biologi', Kim: 'Kimia', Fis: 'Fisika', MTL: 'Matematika Tingkat Lanjut', Inf: 'Informatika', Eko: 'Ekonomi', Sos: 'Sosiologi', Geo: 'Geografi' };
export const MURID = { Ayu: ['Fis', 'Inf', 'Eko'], Bima: ['Bio', 'Inf', 'Sos'], Citra: ['Kim', 'Fis', 'Eko'], Dodi: ['Fis', 'Inf'], Eka: ['MTL', 'Inf', 'Sos'], Fajar: ['Fis', 'Geo'], Gita: ['Bio', 'Sos'], Hana: ['Fis', 'Inf', 'Sos'], Iwan: ['Eko', 'Sos'] };
export const SESI = ['#60a5fa', '#f472b6', '#facc15', '#4ade80', '#c084fc', '#fb923c'];
const POS = { Bio: [90, 230], Kim: [630, 230], Fis: [450, 130], MTL: [120, 50], Inf: [270, 130], Eko: [450, 320], Sos: [270, 320], Geo: [610, 50] };

export const key = (a, b) => (MAPEL.indexOf(a) < MAPEL.indexOf(b) ? `${a}|${b}` : `${b}|${a}`);
// Conflict edges: pair key -> students who sit both.
export function edges(murid = MURID) {
  const E = {};
  for (const [n, list] of Object.entries(murid)) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) (E[key(list[i], list[j])] ||= []).push(n);
  return E;
}
export const neighbours = (E, m) => MAPEL.filter((x) => x !== m && E[key(m, x)]);
export const degree = (E, m) => neighbours(E, m).length;
export const byDegree = (E) => [...MAPEL].sort((a, b) => degree(E, b) - degree(E, a) || MAPEL.indexOf(a) - MAPEL.indexOf(b));
export function greedy(E, order = MAPEL) {
  const col = {};
  const steps = order.map((m) => { const used = [...new Set(neighbours(E, m).filter((x) => col[x]).map((x) => col[x]))].sort((a, b) => a - b); let s = 1; while (used.includes(s)) s++; col[m] = s; return { m, used, s }; });
  return { col, steps, n: Math.max(...Object.values(col)) };
}
// Fewest sessions with at most `cap` subjects per session, and how many colourings use exactly k numbered colours.
export function fewest(E, cap = 8) {
  for (let k = 1; k <= 8; k++) { if (count(E, k, cap, 1)) return k; }
  return 8;
}
export function count(E, k, cap = 8, stop = Infinity) {
  const col = {}; const size = Array(k + 1).fill(0); let found = 0;
  const go = (i) => {
    if (found >= stop) return;
    if (i === MAPEL.length) { found++; return; }
    const m = MAPEL[i];
    for (let s = 1; s <= k; s++) {
      if (size[s] >= cap || neighbours(E, m).some((x) => col[x] === s)) continue;
      col[m] = s; size[s]++; go(i + 1); size[s]--; delete col[m];
    }
  };
  go(0);
  return found;
}
export const conflicts = (E, col) => Object.keys(E).filter((k) => { const [a, b] = k.split('|'); return col[a] && col[a] === col[b]; });

export function graphSvg(E, { col = {}, red = [], lit = [], cur = null, pick = [], showEdges = true } = {}) {
  const lines = showEdges ? Object.keys(E).map((k) => { const [a, b] = k.split('|'); const [x1, y1] = POS[a]; const [x2, y2] = POS[b]; const bad = red.includes(k); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bad ? '#dc2626' : lit.includes(k) ? '#f97316' : '#94a3b8'}" stroke-width="${bad || lit.includes(k) ? 8 : 4}" stroke-linecap="round"/>`; }) : [];
  const dots = MAPEL.map((m) => { const [x, y] = POS[m]; const c = col[m]; return `<g data-m="${m}" class="ju-simpul"><circle cx="${x}" cy="${y}" r="38" fill="${c ? SESI[c - 1] : '#fff'}" stroke="${m === cur ? '#2563eb' : pick.includes(m) ? '#f97316' : '#334155'}" stroke-width="${m === cur || pick.includes(m) ? 7 : 3}"/><text x="${x}" y="${y + (c ? 0 : 7)}" font-size="22" font-weight="900" text-anchor="middle">${m}</text>${c ? `<text x="${x}" y="${y + 24}" font-size="16" font-weight="700" text-anchor="middle">Sesi ${c}</text>` : ''}</g>`; });
  return `<svg viewBox="30 0 660 370" role="img" aria-label="Graf bentrok">${lines.join('')}${dots.join('')}</svg>`;
}
const studentTable = (murid = MURID) => el('div', { class: 'ju-murid' }, Object.entries(murid).map(([n, l]) => el('span', null, el('b', null, n), l.join(', '))));
const sessionList = (col) => { const by = {}; for (const m of MAPEL) if (col[m]) (by[col[m]] ||= []).push(m); return Object.keys(by).sort().map((s) => `Sesi ${s}: ${by[s].join(', ')}`).join(' · '); };

// Colour board: pick a session, tap subjects. strict rejects clashes instead of showing them red.
function colorBoard(host, ctx, { murid = MURID, cap = 8, strict = false, sessions = 6, onChange, onBad, locked = () => false }) {
  let E = edges(murid);
  let col = {};
  let sel = 1;
  const box = el('div', { class: 'ju-graf' });
  const seg = el('div', { class: 'seg ju-sesi' });
  const info = el('p', { class: 'reveal info' });
  const b = { get col() { return col; }, set(c) { col = { ...c }; draw(); }, reset() { col = {}; draw(); }, setData(m) { murid = m; E = edges(m); draw(); }, setCap(c) { cap = c; draw(); }, get E() { return E; }, draw };
  function draw() {
    const red = conflicts(E, col);
    box.innerHTML = graphSvg(E, { col, red });
    seg.replaceChildren(...Array.from({ length: sessions }, (_, i) => onTap(el('button', { class: `seg-btn ju-warna ${sel === i + 1 ? 'on' : ''}`, type: 'button', style: { '--w': SESI[i] } }, `Sesi ${i + 1}`), () => { sel = i + 1; draw(); })));
    const used = new Set(Object.values(col)).size;
    info.textContent = red.length ? `Bentrok: ${red.map((k) => `${k.replace('|', '–')} (${E[k].join(', ')})`).join('; ')}` : `${Object.keys(col).length} dari 8 mata pelajaran · ${used} sesi${cap < 8 ? ` · paling banyak ${cap} per sesi` : ''}`;
    info.className = `reveal ${red.length ? 'bad' : 'info'}`;
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-m]');
    if (!g || locked()) return;
    e.preventDefault();
    const m = g.dataset.m;
    if (strict && col[m]) { say(info, 'info', `${m} sudah di Sesi ${col[m]}.`); return; }
    if (col[m] === sel) { delete col[m]; draw(); if (onChange) onChange(col, false); return; }
    if (MAPEL.filter((x) => x !== m && col[x] === sel).length >= cap) { ctx.mistake(); shake(box); say(info, 'bad', `Sesi ${sel} sudah berisi ${cap} mata pelajaran. Ruang hanya ${cap}.`); if (onBad) onBad(m, 'ruang'); return; }
    const clash = neighbours(E, m).filter((x) => col[x] === sel);
    if (strict && clash.length) { ctx.mistake(); shake(box); say(info, 'bad', `${m} bentrok dengan ${clash.map((x) => `${x} (${E[key(m, x)].join(', ')})`).join(', ')} di Sesi ${sel}.`); if (onBad) onBad(m, 'bentrok'); return; }
    col[m] = sel; ctx.sound.tap();
    if (clash.length) { ctx.mistake(); shake(box); }
    draw();
    const ok = Object.keys(col).length === 8 && !conflicts(E, col).length;
    if (onChange) onChange(col, ok, m);
  });
  host.append(seg, box, info);
  draw();
  return b;
}

// Greedy round: the screen offers subjects in order, players tap the smallest free session.
function greedyRound(wrap, ctx, { order, prompt, done }) {
  const E = edges();
  const g = greedy(E, order);
  const col = {};
  let k = 0;
  const box = el('div', { class: 'ju-graf' });
  const row = el('div', { class: 'ju-urut' });
  const msg = el('p', { class: 'reveal info' });
  const draw = () => {
    const cur = g.steps[k];
    box.innerHTML = graphSvg(E, { col, cur: cur?.m, lit: cur ? neighbours(E, cur.m).filter((x) => col[x]).map((x) => key(cur.m, x)) : [] });
    row.replaceChildren(...g.steps.map((s, j) => el('span', { class: `ju-kartu ${j === k ? 'kini' : ''}`, style: j < k ? { background: SESI[s.s - 1] } : {} }, s.m, j < k ? el('small', null, `Sesi ${s.s}`) : null)));
    if (cur) msg.textContent = `${cur.m}: ${cur.used.length ? `tetangganya sudah memakai Sesi ${cur.used.join(', ')}` : 'belum ada tetangga yang bersesi'}. Pilih nomor sesi terkecil yang belum dipakai.`;
  };
  const pick = (s) => {
    const cur = g.steps[k];
    if (!cur) return;
    if (s !== cur.s) { ctx.mistake(); shake(box); say(msg, 'bad', cur.used.includes(s) ? `Sesi ${s} sudah dipakai tetangga ${cur.m}.` : `Masih ada nomor yang lebih kecil: Sesi ${cur.s}.`); return; }
    col[cur.m] = s; k++; ctx.sound.tap(); draw();
    if (k === g.steps.length) { say(msg, '', `Selesai: ${g.n} sesi. ${sessionList(col)}`); done(g); }
  };
  wrap.append(el('p', { class: 'prompt' }, prompt), row, box, el('div', { class: 'seg ju-sesi' }, SESI.map((c, i) => onTap(el('button', { class: 'seg-btn ju-warna', type: 'button', style: { '--w': c } }, `Sesi ${i + 1}`), () => pick(i + 1)))), msg);
  draw();
}

export default {
  id: 'sma-13-jadwal-ujian',
  title: 'Jadwal Ujian Tanpa Bentrok',
  topic: 'Pewarnaan graf: cara rakus, urutan derajat, dan batas bawah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🗓️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menggambar graf bentrok dari daftar murid, mewarnainya dengan cara rakus menurut urutan daftar dan menurut derajat, membuktikan banyak sesi paling sedikit dengan kelompok yang saling bentrok, dan menyesuaikan jadwal ketika data atau batas ruang berubah.',
  extraModes: [
    { id: 'papan', icon: '🗂️', label: 'Papan Jadwal', desc: 'Warnai bebas dengan pemeriksa bentrok, ubah data ujian setiap murid, jalankan cara rakus langkah demi langkah, dan batasi dua ruang per sesi', create: createBoard },
    { id: 'giliran', icon: '🔁', label: 'Warna Bergiliran', desc: 'Tim bergantian mewarnai satu mata pelajaran; warna yang bentrok ditolak dan mengurangi poin tim', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act jadwal-ujian' });
    root.append(wrap);
    const E = edges();
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const pic = (o = {}) => el('div', { class: 'ju-graf kecil', html: graphSvg(E, o) });
      if (r === 0) {
        const have = new Set();
        let first = null;
        const box = el('div', { class: 'ju-graf' });
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk dua mata pelajaran yang diikuti oleh satu murid yang sama.');
        const draw = () => { box.innerHTML = graphSvg(Object.fromEntries([...have].map((k) => [k, E[k]])), { pick: first ? [first] : [] }); };
        box.addEventListener('pointerdown', (e) => {
          const g = e.target.closest('[data-m]');
          if (!g || solved) return;
          e.preventDefault();
          const m = g.dataset.m;
          if (!first || first === m) { first = first === m ? null : m; draw(); return; }
          const k = key(first, m); first = null;
          if (!E[k]) { ctx.mistake(); shake(box); say(msg, 'bad', `Tidak ada murid yang mengikuti ${k.replace('|', ' dan ')}.`); draw(); return; }
          if (have.has(k)) { say(msg, 'info', `${k.replace('|', '–')} sudah ada.`); draw(); return; }
          have.add(k); ctx.sound.tap(); draw();
          say(msg, '', `${k.replace('|', '–')}: ${E[k].join(', ')}. ${have.size} dari 13 garis.`);
          if (have.size === 13) { say(msg, '', 'Lengkap: 13 garis. Satu murid dengan tiga ujian membuat tiga garis.'); next(); }
        });
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Gambar graf bentrok: hubungkan dua mata pelajaran bila ada murid yang mengikuti keduanya.'), studentTable(), box, msg);
      } else if (r === 1) ask('Derajat adalah banyak garis yang menyentuh sebuah mata pelajaran. Mana yang berderajat 5, dan berapa jumlah semua derajat?', [['Fis, Inf, dan Sos; jumlahnya 26 = 2 × 13', true], ['Fis dan Inf; jumlahnya 13'], ['Eko, Fis, Inf, dan Sos; jumlahnya 24'], ['Hanya Fis; jumlahnya 26']], 1, pic());
      else if (r === 2) greedyRound(wrap, ctx, { order: MAPEL, prompt: 'Cara rakus menurut urutan daftar: beri nomor sesi terkecil yang belum dipakai tetangga.', done: next });
      else if (r === 3) greedyRound(wrap, ctx, { order: byDegree(E), prompt: 'Cara rakus menurut derajat: Fis, Inf, Sos, Eko, Bio, Kim, MTL, Geo.', done: next });
      else if (r === 4) ask('Cara rakus tidak pernah butuh lebih dari (derajat terbesar + 1) sesi. Berapa batasnya untuk graf ini, dan mengapa?', [['6 sesi: tetangga paling banyak 5, jadi paling banyak 5 nomor terpakai dan nomor ke-6 pasti tersedia', true], ['5 sesi, karena ada 5 garis'], ['9 sesi, karena ada 9 murid'], ['8 sesi, karena ada 8 mata pelajaran']], 1, pic({ col: greedy(E).col }));
      else if (r === 5) {
        const pick = [];
        const box = el('div', { class: 'ju-graf' });
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk empat mata pelajaran.');
        const draw = () => { box.innerHTML = graphSvg(E, { pick, lit: pick.flatMap((a) => pick.filter((b) => E[key(a, b)]).map((b) => key(a, b))) }); };
        box.addEventListener('pointerdown', (e) => {
          const g = e.target.closest('[data-m]');
          if (!g || solved) return;
          e.preventDefault();
          const m = g.dataset.m;
          if (pick.includes(m)) { pick.splice(pick.indexOf(m), 1); draw(); return; }
          const miss = pick.filter((x) => !E[key(x, m)]);
          if (miss.length) { ctx.mistake(); shake(box); say(msg, 'bad', `${m} tidak bentrok dengan ${miss.join(', ')}.`); return; }
          pick.push(m); ctx.sound.tap(); draw();
          if (pick.length === 4) {
            say(msg, '', `${pick.join(', ')} saling bentrok: keempatnya harus di sesi berbeda.`);
            setTimeout(then(() => ask('Mengapa jadwal 3 sesi pasti mustahil, dan cara rakus mana yang menemukan jumlah paling sedikit?', [['Empat yang saling bentrok butuh 4 sesi berbeda; dengan 3 sesi dua di antaranya pasti bentrok. Cara menurut derajat menemukan 4 sesi', true], ['Karena ada 13 garis; cara menurut daftar menemukannya'], ['Sebenarnya 3 sesi bisa'], ['Karena Fis berderajat 5; kedua cara sama']], 1, pic({ lit: Object.keys(E).filter((k) => k.split('|').every((x) => pick.includes(x))) }))), 2200);
          }
        });
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Temukan empat mata pelajaran yang setiap pasangannya saling bentrok.'), box, msg);
      } else if (r === 6) {
        const murid = { ...MURID, Iwan: ['Eko'] };
        const msg = el('p', { class: 'reveal hint' }, 'Iwan hanya perlu susulan Ekonomi. Garis Eko–Sos hilang. Susun jadwal dengan sesi paling sedikit.');
        wrap.append(el('p', { class: 'prompt' }, 'Iwan berubah: susun jadwal tanpa bentrok dengan 3 sesi.'));
        colorBoard(wrap, ctx, { murid, sessions: 4, locked: () => solved, onChange(col, ok) { if (!ok) return; const n = new Set(Object.values(col)).size; if (n === 3) { say(msg, '', `Tanpa bentrok, 3 sesi: ${sessionList(col)}. Fis, Inf, Sos masih saling bentrok (Hana), jadi tidak bisa kurang.`); next(); } else say(msg, 'bad', `Tanpa bentrok, tetapi ${n} sesi. Bisa dengan 3.`); } });
        wrap.append(msg);
      } else if (r === 7) ask('Setelah Iwan hanya Ekonomi, mengapa jadwal tetap butuh paling sedikit 3 sesi?', [['Fis, Inf, dan Sos masih saling bentrok (misalnya karena Hana), jadi ketiganya harus di sesi berbeda', true], ['Karena masih ada 12 garis'], ['Karena Eko berderajat 3'], ['Sebenarnya 2 sesi cukup']], 1, pic({ lit: [key('Fis', 'Inf'), key('Fis', 'Sos'), key('Inf', 'Sos')] }));
      else if (r === 8) {
        const msg = el('p', { class: 'reveal hint' }, 'Hanya ada dua ruang: setiap sesi paling banyak 2 mata pelajaran.');
        wrap.append(el('p', { class: 'prompt' }, 'Tantangan: data awal, dua ruang. Susun jadwal dengan sesi paling sedikit.'));
        colorBoard(wrap, ctx, { cap: 2, sessions: 6, locked: () => solved, onChange(col, ok) { if (!ok) return; const n = new Set(Object.values(col)).size; if (n === 4) { say(msg, '', `4 sesi: ${sessionList(col)}. Tidak bisa kurang: 8 mata pelajaran, 2 per sesi, dan Fis, Inf, Eko, Sos saling bentrok.`); next(); } else say(msg, 'bad', `Tanpa bentrok, tetapi ${n} sesi. Bisa dengan 4.`); } });
        wrap.append(msg);
      } else ask('Mengapa hasil cara rakus bisa berbeda, dan apa yang tidak perlu ditulis di jadwal yang ditempel?', [['Hasilnya bergantung pada urutan dan tidak ada urutan sederhana yang selalu terbaik; alasan sakit murid adalah data pribadi, cukup mata pelajaran dan ruang', true], ['Karena komputer salah hitung; nama penyakit perlu ditulis'], ['Cara rakus selalu terbaik; semua data boleh ditempel'], ['Karena jumlah murid berubah; nomor induk murid wajib ditulis']]);
    }
    render();
  },
};

function createBoard(root, ctx) {
  const wrap = el('div', { class: 'act jadwal-ujian' });
  root.append(wrap);
  const murid = Object.fromEntries(Object.entries(MURID).map(([n, l]) => [n, [...l]]));
  let cap = 8;
  const out = el('p', { class: 'reveal hint' });
  const tools = el('div', { class: 'seg' });
  const data = el('div', { class: 'ju-data' });
  const host = el('div', { class: 'ju-host' });
  let timer = null;
  const b = colorBoard(host, ctx, { murid, onChange(col, ok) { if (ok) { const n = new Set(Object.values(col)).size; const best = fewest(b.E, cap); say(out, n === best ? '' : 'info', `Tanpa bentrok: ${n} sesi${n === best ? ', paling sedikit!' : `; paling sedikit ${best}`}.`); if (n === best) ctx.sound.win(); } } });
  const run = (order, label) => {
    clearInterval(timer); b.reset();
    const g = greedy(b.E, order); let k = 0;
    timer = setInterval(() => { if (!wrap.isConnected || k >= g.steps.length) { clearInterval(timer); if (wrap.isConnected) say(out, '', `${label}: ${g.n} sesi (paling sedikit ${fewest(b.E, 8)}).`); return; } const s = g.steps[k++]; b.set({ ...b.col, [s.m]: s.s }); say(out, 'info', `${s.m}: tetangga memakai ${s.used.length ? s.used.join(', ') : '–'} → Sesi ${s.s}`); }, 900);
  };
  function drawData() {
    data.replaceChildren(...Object.entries(murid).map(([n, l]) => el('div', { class: 'ju-baris' }, el('b', null, n), ...MAPEL.map((m) => onTap(el('button', { class: `ju-cek ${l.includes(m) ? 'on' : ''}`, type: 'button' }, m), () => { const i = l.indexOf(m); if (i >= 0) l.splice(i, 1); else l.push(m); clearInterval(timer); b.setData(murid); drawData(); out.textContent = `${Object.keys(b.E).length} garis · paling sedikit ${fewest(b.E, cap)} sesi.`; })))));
  }
  function drawTools() {
    tools.replaceChildren(
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: urutan daftar'), () => run(MAPEL, 'Urutan daftar')),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: derajat'), () => run(byDegree(b.E), 'Menurut derajat')),
      onTap(el('button', { class: `seg-btn ${cap === 2 ? 'on' : ''}`, type: 'button' }, '🚪 2 ruang per sesi'), () => { cap = cap === 2 ? 8 : 2; b.setCap(cap); b.reset(); drawTools(); out.textContent = `Paling sedikit ${fewest(b.E, cap)} sesi.`; }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Hapus warna'), () => { clearInterval(timer); b.reset(); out.textContent = ''; }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '📋 Data awal'), () => { clearInterval(timer); for (const [n, l] of Object.entries(MURID)) murid[n] = [...l]; b.setData(murid); b.reset(); drawData(); out.textContent = ''; }));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Papan jadwal ujian susulan'), tools, el('div', { class: 'ju-dua' }, host, data), out);
  drawTools();
  drawData();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act jadwal-ujian' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0);
    let team = 0;
    const best = fewest(edges());
    const head = el('div');
    const msg = el('p', { class: 'reveal hint' }, `Pilih sesi lalu ketuk satu mata pelajaran. Warna tanpa bentrok +1, bentrok −1. Usahakan ${best} sesi saja.`);
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head);
    drawHead();
    let fin = false;
    colorBoard(wrap, ctx, {
      strict: true,
      sessions: 6,
      locked: () => fin,
      onBad() { pts[team]--; say(msg, 'bad', `Bentrok! Tim ${team + 1} −1.`); team = (team + 1) % n; drawHead(); },
      onChange(col, ok, m) {
        if (!m) return;
        pts[team]++; ctx.sound.good(); team = (team + 1) % n; drawHead();
        if (Object.keys(col).length === 8) {
          fin = true;
          const used = new Set(Object.values(col)).size;
          say(msg, '', `Semua terwarnai: ${used} sesi (paling sedikit ${best}).`);
          setTimeout(() => finishBoard(wrap, ctx, { title: `Jadwal ${used} sesi; paling sedikit ${best}.`, pts, again: () => pickTeams(wrap, 'Warna Bergiliran', start) }), 3000);
        }
      },
    });
    wrap.append(msg);
  }
  pickTeams(wrap, 'Warna Bergiliran', start);
}
