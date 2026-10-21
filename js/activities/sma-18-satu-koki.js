// Satu Koki, Banyak Pesanan — SMA/SMK (16–18 tahun), sistem komputer dan penjadwalan proses.
// One cook is the CPU: map the warung to a Von Neumann computer, build Gantt
// charts for first-come, shortest-first and 2-minute round robin, compare wait
// and response times, the cost of switching, waiting for I/O, and starvation.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const PESANAN = [['A', 'Nasi goreng spesial', 6, '🍛'], ['B', 'Es jeruk', 1, '🍹'], ['C', 'Mi rebus', 4, '🍜'], ['D', 'Telur dadar', 2, '🍳'], ['E', 'Pisang goreng', 3, '🍌']].map(([id, menu, dur, icon]) => ({ id, menu, dur, icon }));
const WARNA = { A: '#f97316', B: '#22d3ee', C: '#facc15', D: '#a3e635', E: '#c084fc', F: '#fb7185', G: '#60a5fa', H: '#34d399', S: '#fbbf24', T: '#a78bfa' };
export const PASANGAN = [['Buku nota tempat pelayan mencatat pesanan', 'Perangkat masukan'], ['Bu Sri yang memasak', 'Prosesor (CPU)'], ['Buku resep', 'Program (kumpulan instruksi)'], ['Meja kerja kecil di samping kompor', 'Memori utama (RAM)'], ['Kulkas dan rak gudang bahan', 'Penyimpanan (diska)'], ['Jendela saji tempat piring diletakkan', 'Perangkat keluaran'], ['Papan berisi pesanan yang menunggu', 'Antrean proses'], ['Aturan giliran yang ditempel di dinding', 'Penjadwal pada sistem operasi']];

// Schedule jobs; rule: 'fcfs' | 'sjf' | 'rr'. Returns Gantt blocks and per-job times.
export function schedule(jobs, rule, q = 2, cost = 0) {
  const left = Object.fromEntries(jobs.map((j) => [j.id, j.dur]));
  let board = jobs.map((j) => j.id);
  const blocks = []; const start = {}; const finish = {}; let t = 0; let last = null; let switches = 0; const boards = [];
  while (board.length) {
    let id;
    if (rule === 'sjf') id = [...board].sort((a, b) => left[a] - left[b] || board.indexOf(a) - board.indexOf(b))[0];
    else id = board[0];
    if (last && last !== id) { switches++; t += cost; }
    const run = rule === 'rr' ? Math.min(q, left[id]) : left[id];
    if (!(id in start)) start[id] = t;
    blocks.push([id, t, t + run]); t += run; left[id] -= run; last = id;
    board = board.filter((x) => x !== id);
    if (left[id] > 0) board.push(id); else finish[id] = t;
    boards.push([...board]);
  }
  const wait = Object.fromEntries(jobs.map((j) => [j.id, finish[j.id] - j.dur - (cost ? 0 : 0)]));
  const avg = (o) => jobs.reduce((s, j) => s + o[j.id], 0) / jobs.length;
  return { blocks, start, finish, wait, switches, boards, end: t, avgWait: avg(wait), avgResp: avg(start) };
}
export const fmt1 = (x) => x.toFixed(1).replace('.', ',');

export function gantt(blocks, span = 16) {
  const cells = Array(Math.ceil(span)).fill(null);
  for (const [id, a, b] of blocks) for (let m = Math.floor(a); m < Math.ceil(b) && m < cells.length; m++) cells[m] = id;
  return el('div', { class: 'sk-gantt' }, el('div', { class: 'sk-gantt-baris' }, cells.map((id, m) => el('span', { class: `sk-sel ${id ? 'isi' : ''}`, style: id ? { background: WARNA[id] } : {} }, id || ''))),
    el('div', { class: 'sk-gantt-baris angka' }, cells.map((_, m) => el('span', null, m))));
}
export function statsTable(jobs, r, { resp = false } = {}) {
  return el('table', { class: 'sk-tabel' }, el('tr', null, el('th', null, 'Pesanan'), ...jobs.map((j) => el('th', null, j.id)), el('th', null, 'Rata-rata')),
    el('tr', null, el('td', null, 'Selesai'), ...jobs.map((j) => el('td', null, r.finish[j.id] ?? '')), el('td', null, '')),
    el('tr', null, el('td', null, 'Tunggu'), ...jobs.map((j) => el('td', null, r.finish[j.id] != null ? fmtNum(r.wait[j.id]) : '')), el('td', null, Object.keys(r.finish).length === jobs.length ? fmt1(r.avgWait) : '')),
    resp ? el('tr', null, el('td', null, 'Tanggap'), ...jobs.map((j) => el('td', null, r.start[j.id] ?? '')), el('td', null, Object.keys(r.finish).length === jobs.length ? fmt1(r.avgResp) : '')) : null);
}
const orderCards = (jobs, left, onPick) => el('div', { class: 'sk-pesanan' }, jobs.map((j) => onTap(el('button', { class: `sk-kartu ${left[j.id] === 0 ? 'selesai' : ''}`, type: 'button', 'data-j': j.id, style: { '--w': WARNA[j.id] } }, el('b', null, `${j.icon} ${j.id}`), el('span', null, j.menu), el('small', null, left[j.id] === j.dur ? `${j.dur} menit` : left[j.id] === 0 ? 'selesai' : `sisa ${left[j.id]} dari ${j.dur} menit`)), () => onPick(j.id))));

// Build a schedule by tapping orders; the rule decides which tap is right.
function buildRound(wrap, ctx, { jobs = PESANAN, rule, q = 2, prompt, hint, done, showBoard = false }) {
  const ref = schedule(jobs, rule, q);
  const left = Object.fromEntries(jobs.map((j) => [j.id, j.dur]));
  let k = 0; let peek = showBoard;
  const blocks = [];
  const host = el('div', { class: 'sk-papan' });
  const msg = el('p', { class: 'reveal info' }, hint);
  const partial = () => { const fin = {}; const st = {}; for (const [id, a, b] of blocks) { if (!(id in st)) st[id] = a; } for (const [id, a, b] of blocks) if (left[id] === 0) fin[id] = Math.max(fin[id] ?? 0, b); const wait = Object.fromEntries(Object.keys(fin).map((id) => [id, fin[id] - jobs.find((j) => j.id === id).dur])); const n = jobs.length; return { finish: fin, start: st, wait, avgWait: Object.values(wait).reduce((s, x) => s + x, 0) / n, avgResp: Object.values(st).reduce((s, x) => s + x, 0) / n }; };
  const draw = () => host.replaceChildren(orderCards(jobs, left, pick), gantt(blocks),
    rule === 'rr' ? el('div', { class: 'sk-antre' }, el('b', null, 'Papan: '), peek ? (k < ref.blocks.length ? (k ? ref.boards[k - 1] : jobs.map((j) => j.id)).join(' ← ') || '–' : '–') : onTap(el('button', { class: 'seg-btn', type: 'button' }, '👁 Lihat papan'), () => { peek = true; draw(); })) : null,
    statsTable(jobs, partial(), { resp: rule === 'rr' }));
  function pick(id) {
    if (k >= ref.blocks.length) return;
    const [want, a, b] = ref.blocks[k];
    if (id !== want) {
      ctx.mistake(); shake(host);
      say(msg, 'bad', left[id] === 0 ? `${id} sudah selesai.` : rule === 'fcfs' ? `Yang datang dulu: ${want} lebih dulu tercatat.` : rule === 'sjf' ? `Masih ada yang lebih cepat: ${want} (${left[want]} menit).` : `Ambil pesanan terdepan di papan: ${want}. Pesanan yang belum selesai pindah ke ujung belakang.`);
      return;
    }
    blocks.push([id, a, b]); left[id] -= b - a; k++; ctx.sound.tap();
    if (rule === 'rr') peek = showBoard;
    draw();
    if (k === ref.blocks.length) { say(msg, '', `Selesai pada menit ${ref.end}. Rata-rata waktu tunggu ${fmt1(ref.avgWait)} menit${rule === 'rr' ? `, rata-rata waktu tanggap ${fmt1(ref.avgResp)} menit, ${ref.switches} pergantian` : ''}.`); done(ref); }
    else say(msg, 'info', `${id} dimasak menit ${a}–${b}${left[id] ? `, sisa ${left[id]} menit kembali ke belakang papan` : ', selesai'}.`);
  }
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
  draw();
}

function matchRound(wrap, ctx, { done }) {
  const right = ctx.rand.shuffle(PASANGAN.map((p) => p[1]));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'sk-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk bagian warung, lalu bagian komputer yang cocok.');
  const draw = () => box.replaceChildren(el('div', { class: 'sk-kolom' }, PASANGAN.map(([l], i) => onTap(el('button', { class: `sk-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button' }, `${i + 1}. ${l}`), () => { if (ok.has(i)) return; sel = i; draw(); }))),
    el('div', { class: 'sk-kolom' }, right.map((r) => { const i = PASANGAN.findIndex((p) => p[1] === r); return onTap(el('button', { class: `sk-item kanan ${ok.has(i) ? 'cocok' : ''}`, type: 'button' }, r), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', `"${PASANGAN[sel][0]}" bukan ${r.toLowerCase()}.`); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === PASANGAN.length) { say(msg, '', 'Semua cocok: masukan → proses (dengan program dan memori) → keluaran, diatur sistem operasi.'); done(); }
    }); })));
  wrap.append(el('p', { class: 'prompt' }, 'Warung sebagai komputer: pasangkan bagian warung dengan bagian komputer.'), box, msg);
  draw();
}

export default {
  id: 'sma-18-satu-koki',
  title: 'Satu Koki, Banyak Pesanan',
  topic: 'Sistem komputer: model Von Neumann, sistem operasi, dan penjadwalan proses',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '👩‍🍳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid memetakan bagian warung ke model Input–Proses–Output dan komponen Von Neumann, menyusun diagram Gantt untuk tiga aturan penjadwalan, menghitung waktu tunggu dan waktu tanggap, membandingkan aturan, dan menjelaskan peran sistem operasi ketika sebuah proses menunggu.',
  extraModes: [
    { id: 'sim', icon: '⏱️', label: 'Simulasi Penjadwal', desc: 'Jalankan yang datang dulu, yang tersingkat dulu, atau bergiliran langkah demi langkah; ubah panjang giliran dan ongkos pergantian; pakai pesanan acak', create: createSim },
    { id: 'giliran', icon: '🔁', label: 'Pilih Pesanan', desc: 'Tim bergantian memilih pesanan berikutnya untuk dimasak; memilih pesanan tersingkat yang menunggu mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act satu-koki' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) matchRound(wrap, ctx, { done: next });
      else if (r === 1) ask('Mengapa meja kerja dibuat kecil tetapi dekat kompor, sedangkan gudang besar tetapi jauh?', [['Memori utama kecil tetapi cepat dijangkau untuk bahan yang sedang dipakai; penyimpanan besar menampung semua tetapi lambat. Komputer menyalin data yang dipakai dari diska ke memori', true], ['Karena meja kerja lebih mahal dari gudang, tanpa alasan lain'], ['Supaya Bu Sri tidak perlu buku resep'], ['Gudang seharusnya di samping kompor']]);
      else if (r === 2) buildRound(wrap, ctx, { rule: 'fcfs', prompt: 'Aturan 1, yang datang dulu: ketuk pesanan sesuai urutan dimasak.', hint: 'Semua pesanan dicatat pada menit 0, urutan A sampai E.', done: next });
      else if (r === 3) buildRound(wrap, ctx, { rule: 'sjf', prompt: 'Aturan 2, yang tersingkat dulu: ketuk pesanan yang paling cepat dimasak di antara yang menunggu.', hint: 'Bandingkan lama dimasak setiap pesanan.', done: next });
      else if (r === 4) ask('Dengan yang tersingkat dulu, pesanan mana yang paling dirugikan, dan apa yang harus diketahui Bu Sri sebelum memakai aturan ini?', [['A (nasi goreng) menunggu 10 menit; ia harus tahu lama dimasak setiap pesanan, padahal komputer hanya bisa memperkirakannya', true], ['B (es jeruk); ia harus tahu harga pesanan'], ['A; tidak perlu tahu apa-apa'], ['Semua sama rugi; ia harus tahu nama pembeli']], 1, gantt(schedule(PESANAN, 'sjf').blocks));
      else if (r === 5) buildRound(wrap, ctx, { rule: 'rr', q: 2, prompt: 'Aturan 3, bergiliran 2 menit: ketuk pesanan terdepan di papan untuk setiap giliran.', hint: 'Paling lama 2 menit per giliran; yang belum selesai pindah ke ujung belakang papan.', done: next });
      else if (r === 6) ask('Bandingkan: rata-rata waktu tunggu dan tanggap, serta banyak pergantian. Aturan mana yang tunggunya terkecil, dan mana yang tanggapnya tercepat?', [['Tersingkat dulu (tunggu 4,0); bergiliran 2 menit (tanggap 3,4, tetapi 8 pergantian)', true], ['Yang datang dulu untuk keduanya'], ['Bergiliran untuk keduanya (tunggu 3,4)'], ['Tersingkat dulu untuk keduanya, dengan 8 pergantian']], 1,
        el('table', { class: 'sk-tabel' }, el('tr', null, el('th', null, 'Aturan'), el('th', null, 'Tunggu'), el('th', null, 'Tanggap'), el('th', null, 'Pergantian')), ...[['Yang datang dulu', 'fcfs'], ['Yang tersingkat dulu', 'sjf'], ['Bergiliran 2 menit', 'rr']].map(([n, k]) => { const s = schedule(PESANAN, k); return el('tr', null, el('td', null, n), el('td', null, '?'), el('td', null, k === 'rr' ? fmt1(s.avgResp) : '?'), el('td', null, s.switches)); })));
      else if (r === 7) ask('Setiap berganti pesanan Bu Sri perlu 0,5 menit mencuci wajan. Kapan semua selesai dengan yang datang dulu dan dengan bergiliran 2 menit? Apa untung-rugi giliran yang sangat pendek?', [['18 dan 20 menit; giliran pendek membuat tanggap cepat, tetapi waktu habis untuk berganti (ongkos pergantian konteks)', true], ['16 dan 16 menit; giliran pendek selalu lebih baik'], ['18 dan 18 menit; tidak ada ruginya'], ['20 dan 18 menit; giliran pendek mengurangi pergantian']], 1, el('div', { class: 'au-status' }, `4 pergantian × 0,5 · 8 pergantian × 0,5`));
      else if (r === 8) ask('Soto: siapkan 1 menit, kuah direbus sendiri 5 menit, sajikan 1 menit; tempe 2 menit; gado-gado 4 menit. Paling cepat selesai menit berapa, dan apa keadaan setiap pesanan saat kuah direbus dan tempe digoreng?', [['Menit 8 (siapkan soto, tempe, gado-gado, sajikan soto); soto menunggu, tempe berjalan, gado-gado siap', true], ['Menit 13; soto berjalan, tempe siap, gado-gado menunggu'], ['Menit 7; semuanya berjalan bersamaan'], ['Menit 8; soto siap, tempe menunggu, gado-gado berjalan']], 1,
        gantt([['S', 0, 1], ['T', 1, 3], ['G', 3, 7], ['S', 7, 8]], 13));
      else ask('Tantangan: tersingkat dulu; nasi goreng (6 menit) dan es jeruk masuk menit 0, lalu setiap menit datang es jeruk baru. Kapan nasi goreng dimasak, dan bagaimana mencegahnya?', [['Tidak pernah (kelaparan/starvation); naikkan prioritas pesanan yang sudah lama menunggu (aging)', true], ['Menit 6; tidak perlu perubahan'], ['Menit 1; es jeruk cukup sekali'], ['Tidak pernah; hapus pesanan nasi goreng']]);
    }
    render();
  },
};

function randomJobs(rand, n = 5) {
  const menu = [['Nasi goreng', '🍛'], ['Es teh', '🧋'], ['Mi goreng', '🍜'], ['Telur dadar', '🍳'], ['Pisang goreng', '🍌'], ['Soto ayam', '🍲'], ['Tempe goreng', '🥘'], ['Jus alpukat', '🥑']];
  return rand.shuffle(menu).slice(0, n).map(([m, icon], i) => ({ id: 'ABCDEFGH'[i], menu: m, dur: rand.int(1, 6), icon }));
}

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act satu-koki' });
  root.append(wrap);
  let jobs = PESANAN; let rule = 'rr'; let q = 2; let cost = 0; let k = 0; let timer = null;
  const tools = el('div', { class: 'seg' });
  const opts = el('div', { class: 'seg' });
  const host = el('div', { class: 'sk-papan' });
  const out = el('p', { class: 'reveal hint' });
  const draw = () => {
    const r = schedule(jobs, rule, q, cost);
    const shown = r.blocks.slice(0, k);
    const left = Object.fromEntries(jobs.map((j) => [j.id, j.dur - shown.filter((b) => b[0] === j.id).reduce((s, b) => s + b[2] - b[1], 0)]));
    const part = k >= r.blocks.length ? r : { ...r, finish: Object.fromEntries(Object.entries(r.finish).filter(([id]) => left[id] === 0)), start: Object.fromEntries(Object.entries(r.start).filter(([id]) => shown.some((b) => b[0] === id))) };
    tools.replaceChildren(...[['fcfs', 'Yang datang dulu'], ['sjf', 'Yang tersingkat dulu'], ['rr', 'Bergiliran']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${rule === v ? 'on' : ''}`, type: 'button' }, l), () => { rule = v; k = 0; clearInterval(timer); draw(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Pesanan lembar kerja'), () => { jobs = PESANAN; k = 0; draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Pesanan acak'), () => { jobs = randomJobs(ctx.rand, ctx.rand.int(4, 6)); k = 0; draw(); }));
    opts.replaceChildren(el('span', { class: 'ko-n' }, 'Giliran:'), ...[1, 2, 3].map((x) => onTap(el('button', { class: `seg-btn ${q === x ? 'on' : ''}`, type: 'button' }, `${x} menit`), () => { q = x; k = 0; draw(); })),
      el('span', { class: 'ko-n' }, 'Cuci wajan:'), ...[0, 0.5].map((x) => onTap(el('button', { class: `seg-btn ${cost === x ? 'on' : ''}`, type: 'button' }, x ? '0,5 menit' : 'tanpa'), () => { cost = x; k = 0; draw(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '⏭ Langkah'), () => { if (k < r.blocks.length) { k++; draw(); } }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '▶️ Jalankan'), () => { clearInterval(timer); k = 0; timer = setInterval(() => { if (!wrap.isConnected || k >= schedule(jobs, rule, q, cost).blocks.length) { clearInterval(timer); return; } k++; draw(); }, 700); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Ulang'), () => { clearInterval(timer); k = 0; draw(); }));
    host.replaceChildren(orderCards(jobs, left, () => {}), gantt(shown, Math.max(16, Math.ceil(r.end))), el('div', { class: 'sk-antre' }, el('b', null, 'Papan: '), (k ? r.boards[k - 1] : jobs.map((j) => j.id)).join(' ← ') || '–'), statsTable(jobs, part, { resp: true }));
    out.textContent = k >= r.blocks.length ? `Selesai menit ${fmtNum(r.end)} · tunggu ${fmt1(r.avgWait)} · tanggap ${fmt1(r.avgResp)} · ${r.switches} pergantian${cost ? ` (+${fmtNum(r.switches * cost)} menit cuci wajan)` : ''}` : `${k} dari ${r.blocks.length} blok`;
  };
  wrap.append(el('p', { class: 'prompt' }, 'Simulasi penjadwal'), tools, opts, host, out);
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act satu-koki' });
  root.append(wrap);
  function start(n) {
    const jobs = randomJobs(ctx.rand, n === 3 ? 6 : n === 4 ? 8 : 6);
    const pts = Array(n).fill(0);
    const left = Object.fromEntries(jobs.map((j) => [j.id, j.dur]));
    const blocks = []; let t = 0; let team = 0;
    const head = el('div');
    const host = el('div', { class: 'sk-papan' });
    const msg = el('p', { class: 'reveal hint' }, 'Pilih pesanan berikutnya untuk dimasak sampai selesai. Memilih yang tersingkat di antara yang menunggu +1.');
    const draw = () => { head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`)); host.replaceChildren(orderCards(jobs, left, pick), gantt(blocks, Math.max(16, jobs.reduce((s, j) => s + j.dur, 0)))); };
    function pick(id) {
      if (!left[id]) return;
      const min = Math.min(...jobs.filter((j) => left[j.id]).map((j) => left[j.id]));
      const good = left[id] === min;
      blocks.push([id, t, t + left[id]]); t += left[id]; left[id] = 0;
      if (good) { pts[team]++; ctx.sound.good(); say(msg, '', `Tim ${team + 1}: ${id} (${t - blocks[blocks.length - 1][1]} menit) tersingkat, +1.`); } else { ctx.sound.bad(); say(msg, 'bad', `Tim ${team + 1}: masih ada yang ${min} menit.`); }
      team = (team + 1) % n; draw();
      if (jobs.every((j) => !left[j.id])) {
        const mine = blocks.reduce((s, [, a]) => s + a, 0) / jobs.length; const best = schedule(jobs, 'sjf').avgWait;
        setTimeout(() => finishBoard(wrap, ctx, { title: `Rata-rata waktu tunggu ${fmt1(mine)} menit; terkecil ${fmt1(best)} menit.`, pts, again: () => pickTeams(wrap, 'Pilih Pesanan', start) }), 2600);
      }
    }
    wrap.replaceChildren(head, host, msg);
    draw();
  }
  pickTeams(wrap, 'Pilih Pesanan', start);
}
