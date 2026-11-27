// Satu Koki, Banyak Pesanan — SMA/SMK (16–18 tahun), sistem komputer dan penjadwalan proses.
// Game "Dapur Satu Kompor": one cook is the CPU. Map the warung to a computer,
// cook token by token under first-come, shortest-first and round robin, predict
// kitchen event cards, keep the stove busy while soup boils, and stop starvation.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

// ---------- Permainan: Dapur Satu Kompor ----------
// The team runs Bu Sri's kitchen with tokens: each order card carries one token
// per minute of cooking, the timekeeper claps once per minute and fills the time
// tape, the cook moves one token from the stove to the MATANG bowl, and the
// scheduler picks the next order by the round's rule.

WARNA.J = '#22d3ee';
const ATURAN = { fcfs: 'yang datang dulu', sjf: 'yang tersingkat dulu', rr: 'bergiliran' };
const keping = (n, total) => el('span', { class: 'dk18-keping' }, Array.from({ length: total }, (_, i) => el('i', { class: i < n ? 'ada' : '' })));
function orderCard(j, { left, state, wait = null, prio = null, fin = null }) {
  return el('button', { type: 'button', class: `dk18-kartu ${state}`, 'data-j': j.id, style: { '--w': WARNA[j.id] || WARNA[j.id[0]] || '#94a3b8' } },
    el('b', null, `${j.icon} ${j.id}`), el('span', { class: 'dk18-menu' }, j.menu),
    keping(left, j.dur),
    el('small', null, fin != null ? `✅ selesai menit ${fmtNum(fin)}` : prio != null ? `prioritas ${prio}` : wait != null ? `⏳ menunggu ${wait} menit` : `${j.dur} menit`));
}
const tapeOf = (cells, span) => el('div', { class: 'dk18-pita' }, Array.from({ length: span }, (_, m) => el('span', { class: cells[m] ? 'isi' : '', style: cells[m] ? { background: WARNA[cells[m]] || '#e2e8f0' } : {} }, el('b', null, cells[m] === '·' ? '' : cells[m] || ''), el('small', null, m))));

// Misi 2, 3 and their variations: cook minute by minute under one rule.
function kitchenRound(wrap, ctx, { jobs, rule, q = 2, arrive = null, win, done }) {
  const left = Object.fromEntries(jobs.map((j) => [j.id, j.dur]));
  const at = (id) => (arrive ? arrive[id] : 0);
  let board = jobs.filter((j) => at(j.id) === 0).map((j) => j.id);
  let pending = jobs.filter((j) => at(j.id) > 0).map((j) => j.id);
  const span = jobs.reduce((s, j) => s + j.dur, 0);
  let t = 0; let stove = null; let used = 0; let fin = false; let last = null; let switches = 0;
  const cells = []; const start = {}; const finish = {};
  const head = el('div', { class: 'dk18-aturan' });
  const boardBox = el('div', { class: 'dk18-papan' });
  const stoveBox = el('div', { class: 'dk18-kompor' });
  const bowl = el('div', { class: 'dk18-matang' });
  const tapeBox = el('div', { class: 'dk18-pita-wadah' });
  const tools = el('div', { class: 'dk18-tombol' });
  const msg = el('p', { class: 'reveal info' });
  const job = (id) => jobs.find((j) => j.id === id);
  const want = () => (rule === 'sjf' ? [...board].sort((a, b) => left[a] - left[b] || board.indexOf(a) - board.indexOf(b))[0] : board[0]);
  const expired = () => rule === 'rr' && stove && used >= q && left[stove] > 0;
  function draw() {
    fill(head, el('b', null, `📜 Aturan: ${ATURAN[rule]}${rule === 'rr' ? ` ${q} menit` : ''}`), el('span', null, `⏱️ menit ${t}`), rule === 'rr' && stove ? el('span', { class: expired() ? 'habis' : '' }, `⏰ giliran ${used}/${q}`) : null);
    fill(boardBox, el('small', null, '📋 Papan antrean (depan di kiri)'), el('div', { class: 'dk18-baris' }, board.length ? board.map((id) => onTap(orderCard(job(id), { left: left[id], state: 'siap', wait: t - at(id) - (job(id).dur - left[id]) }), (e) => pick(id, e.currentTarget))) : el('span', { class: 'dk18-kosong' }, 'kosong'),
      pending.map((id) => el('span', { class: 'dk18-datang' }, `${job(id).icon} ${id} datang menit ${at(id)}`))));
    fill(stoveBox, el('small', null, '🔥 Kompor'), stove ? onTap(orderCard(job(stove), { left: left[stove], state: expired() ? 'habis' : 'jalan' }), () => back()) : el('span', { class: 'dk18-kosong' }, 'kosong'));
    fill(bowl, el('small', null, '🥣 Matang'), el('div', { class: 'dk18-baris' }, Object.keys(finish).map((id) => orderCard(job(id), { left: 0, state: 'selesai', fin: finish[id] }))));
    fill(tapeBox, el('small', null, '🎞️ Pita waktu (diagram Gantt)'), tapeOf(cells, span));
  }
  function pick(id, node) {
    if (fin) return;
    if (stove) { shake(node); say(msg, 'info', expired() ? `Giliran ${stove} habis. Ketuk ${stove} di kompor untuk mengembalikannya ke belakang papan.` : `Kompor masih memasak ${stove}.`); return; }
    const w = want();
    if (id !== w) { ctx.mistake(); shake(node); say(msg, 'bad', rule === 'sjf' ? `Ada yang lebih singkat: lihat jumlah kepingnya.` : 'Ambil pesanan terdepan di papan.'); return; }
    board = board.filter((x) => x !== id); stove = id; used = 0;
    if (last && last !== id) switches++;
    last = id; if (!(id in start)) start[id] = t;
    ctx.sound.tap(); draw(); say(msg, 'info', `${id} di kompor. Penjaga waktu: tepuk "Menit berikutnya".`);
  }
  function back() {
    if (fin || !expired()) return;
    board.push(stove); ctx.sound.tap(); say(msg, 'info', `${stove} kembali ke belakang papan dengan sisa ${left[stove]} keping. Pilih pesanan terdepan.`); stove = null; draw();
  }
  function tick(node) {
    if (fin) return;
    if (!stove) { shake(node); say(msg, 'info', 'Kompor kosong: penjadwal pilih pesanan dulu.'); return; }
    if (expired()) { ctx.mistake(); shake(node); say(msg, 'bad', `Giliran ${stove} sudah ${q} menit. Kembalikan ke belakang papan.`); return; }
    cells[t] = stove; left[stove]--; used++; t++;
    for (const id of [...pending]) if (at(id) <= t) { board.push(id); pending = pending.filter((x) => x !== id); }
    ctx.sound.tap();
    if (left[stove] === 0) { finish[stove] = t; say(msg, 'info', `${stove} matang pada menit ${t}.`); stove = null; }
    else if (expired()) say(msg, 'info', `⏰ Giliran ${stove} habis. Ketuk kartunya di kompor untuk mengembalikannya ke belakang papan.`);
    draw();
    if (Object.keys(finish).length === jobs.length) end();
  }
  function end() {
    fin = true; fill(tools);
    const wait = Object.fromEntries(jobs.map((j) => [j.id, finish[j.id] - at(j.id) - j.dur]));
    const avg = (o) => jobs.reduce((s, j) => s + o[j.id], 0) / jobs.length;
    const resp = Object.fromEntries(jobs.map((j) => [j.id, start[j.id] - at(j.id)]));
    const r = { finish, wait, start: resp, avgWait: avg(wait), avgResp: avg(resp), switches };
    fill(tapeBox, el('small', null, '🎞️ Pita waktu (diagram Gantt)'), tapeOf(cells, span), statsTable(jobs, r, { resp: rule === 'rr' }));
    ctx.sound.good(); say(msg, '', win(r)); done(r);
  }
  fill(tools, button('👏 Menit berikutnya', (e) => tick(e?.currentTarget), 'primary'));
  wrap.append(head, el('div', { class: 'dk18-dapur' }, boardBox, stoveBox, bowl), tapeBox, tools, msg);
  draw();
  say(msg, 'info', `Penjadwal: ketuk pesanan yang masuk kompor menurut aturan ${ATURAN[rule]}.`);
}

// Proportional Gantt for replays with fractional washing time.
function bar(blocks, end) {
  const parts = []; let t = 0;
  for (const [id, a, b] of blocks) { if (a > t) parts.push(el('span', { class: 'cuci', style: { flex: `${a - t}` } }, '')); parts.push(el('span', { style: { flex: `${b - a}`, background: WARNA[id] } }, id)); t = b; }
  return el('div', { class: 'dk18-bar' }, parts, el('em', null, fmtNum(end)));
}
// Misi 4: event cards. Predict up, down or same, then the kitchen replays.
function eventRound18(wrap, ctx, { events, done }) {
  let n = 0;
  const area = el('div', { class: 'dk18-kejadian' });
  wrap.append(area);
  function show() {
    const ev = events[n];
    const dir = ev.after > ev.before ? 'naik' : ev.after < ev.before ? 'turun' : 'tetap';
    const msg = el('p', { class: 'reveal info' }, `Tebak: ${ev.metric} naik, turun, atau tetap?`);
    const tools = el('div', { class: 'dk18-tombol' });
    const replay = el('div', { class: 'dk18-ulang' });
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `🃏 Kartu kejadian dapur ${n + 1} dari ${events.length}`), el('b', null, ev.text), el('span', null, `Sebelumnya: ${ev.base}. ${ev.metric[0].toUpperCase()}${ev.metric.slice(1)}: ${fmtNum(ev.before)}.`)), replay, tools, msg);
    fill(replay, el('div', null, el('small', null, 'Sebelum'), bar(ev.r0.blocks, ev.r0.end)));
    fill(tools, [['⬆️ Naik', 'naik'], ['⬇️ Turun', 'turun'], ['➡️ Tetap', 'tetap']].map(([l, v]) => button(l, (e) => {
      if (tools.dataset.done) return;
      if (v !== dir) { ctx.mistake(); shake(e?.currentTarget || tools); say(msg, 'bad', ev.hint); return; }
      tools.dataset.done = '1'; ctx.sound.good(); fill(tools);
      replay.append(el('div', null, el('small', null, 'Sesudah'), bar(ev.r1.blocks, ev.r1.end)));
      say(msg, '', ev.why);
      n++;
      if (n < events.length) setTimeout(() => { if (area.isConnected) show(); }, 4200); else done();
    })));
  }
  show();
}

// Misi 5: soto boils by itself in the pot while the stove does other work.
const SOTO = [
  { id: 'S', icon: '🍲', menu: 'Soto', steps: [['siapkan', 1, 'kompor'], ['rebus kuah', 5, 'panci'], ['sajikan', 1, 'kompor']] },
  { id: 'T', icon: '🥘', menu: 'Tempe goreng', steps: [['goreng', 2, 'kompor']] },
  { id: 'G', icon: '🥗', menu: 'Gado-gado', steps: [['ulek', 4, 'kompor']] },
];
function sotoRound(wrap, ctx, { done }) {
  let st; let t; let stove; let pot; let cells; let fin = false;
  const head = el('div', { class: 'dk18-aturan' });
  const cards = el('div', { class: 'dk18-baris dk18-soto' });
  const tapeBox = el('div', { class: 'dk18-pita-wadah' });
  const tools = el('div', { class: 'dk18-tombol' });
  const msg = el('p', { class: 'reveal info' });
  function reset() { st = Object.fromEntries(SOTO.map((o) => [o.id, { k: 0, left: o.steps[0][1] }])); t = 0; stove = null; pot = null; cells = []; draw(); say(msg, 'info', 'Ketuk pesanan yang siap untuk dimasak di kompor, lalu tepuk "Menit berikutnya". Kuah soto direbus sendiri di panci.'); }
  const stepOf = (id) => SOTO.find((o) => o.id === id).steps[st[id].k];
  const stateOf = (id) => { if (st[id].k >= SOTO.find((o) => o.id === id).steps.length) return ['selesai', '✅ selesai']; if (stove === id) return ['jalan', '🔥 berjalan']; if (pot === id) return ['tunggu', '⏳ menunggu (kuah direbus)']; return ['siap', '🟢 siap']; };
  function draw() {
    fill(head, el('b', null, '🔥 Satu kompor, 🍲 satu panci'), el('span', null, `⏱️ menit ${t}`), pot ? el('span', null, `🍲 panci: sisa ${st[pot].left} menit`) : null);
    fill(cards, SOTO.map((o) => { const [cls2, label] = stateOf(o.id); const s = stepOf(o.id); return onTap(el('button', { type: 'button', class: `dk18-kartu ${cls2}`, style: { '--w': WARNA[o.id] } }, el('b', null, `${o.icon} ${o.menu}`), el('span', { class: 'dk18-langkah' }, o.steps.map(([n, d, w], i) => el('i', { class: i < st[o.id].k ? 'beres' : i === st[o.id].k ? 'kini' : '' }, `${n} ${d}${w === 'panci' ? ' 🍲' : ''}`))), el('small', null, s ? `${label}${cls2 === 'siap' ? ` · ${s[0]}` : ''}` : label)), (e) => pick(o.id, e.currentTarget)); }));
    fill(tapeBox, el('small', null, '🎞️ Pita waktu kompor'), tapeOf(cells, 13));
  }
  function pick(id, node) {
    if (fin) return;
    const s = stepOf(id);
    if (!s) return;
    if (stove) { shake(node); say(msg, 'info', `Kompor masih dipakai ${stove === 'S' ? 'soto' : stove === 'T' ? 'tempe' : 'gado-gado'}.`); return; }
    if (pot === id) { ctx.mistake(); shake(node); say(msg, 'bad', 'Soto sedang menunggu kuahnya mendidih: belum bisa disajikan.'); return; }
    stove = id; ctx.sound.tap(); draw(); say(msg, 'info', `${SOTO.find((o) => o.id === id).menu}: ${s[0]} di kompor. Tepuk "Menit berikutnya".`);
  }
  function advance(id) { st[id].k++; const s = stepOf(id); if (s) st[id].left = s[1]; return s; }
  function tick() {
    if (fin) return;
    const potWas = pot;
    cells[t] = stove || '·';
    if (stove) { const id = stove; st[id].left--; if (st[id].left === 0) { stove = null; const s = advance(id); if (s && s[2] === 'panci') pot = id; } }
    if (potWas) { st[potWas].left--; if (st[potWas].left === 0) { advance(potWas); pot = null; } }
    t++; ctx.sound.tap(); draw();
    if (SOTO.every((o) => st[o.id].k >= o.steps.length)) end();
  }
  function end() {
    fin = true;
    const work = cells.filter((c) => c && c !== '·').length;
    if (t > 8) {
      ctx.mistake();
      fill(tools, button('🔄 Coba lagi', () => { fin = false; reset(); fill(tools, button('👏 Menit berikutnya', () => tick(), 'primary')); }, 'primary'));
      say(msg, 'bad', `Semua selesai menit ${t}, padahal kompor hanya bekerja ${work} menit. Bisa lebih cepat: jangan menunggu di depan panci.`);
      return;
    }
    fill(tools); ctx.sound.good();
    say(msg, '', 'Selesai menit 8, kompor tidak pernah menganggur (menunggu di depan panci: menit 13). Saat kuah direbus dan tempe digoreng: soto menunggu, tempe berjalan, gado-gado siap. Begitulah sistem operasi memberi CPU ke proses lain saat satu proses menunggu.');
    done();
  }
  fill(tools, button('👏 Menit berikutnya', () => tick(), 'primary'));
  wrap.append(head, cards, tapeBox, tools, msg);
  reset();
}

// Misi Bos: shortest-first starves the fried rice; aging rescues it.
function starveRound(wrap, ctx, { done }) {
  const A = { id: 'A', icon: '🍛', menu: 'Nasi goreng', dur: 6 };
  let t = 0; let k = 1; let stove = null; let leftA = 6; let aging = false; let fin = false;
  let jeruk = [{ id: 'J1', icon: '🍹', menu: 'Es jeruk', dur: 1, at: 0 }];
  const cells = [];
  const head = el('div', { class: 'dk18-aturan' });
  const boardBox = el('div', { class: 'dk18-papan' });
  const stoveBox = el('div', { class: 'dk18-kompor' });
  const tapeBox = el('div', { class: 'dk18-pita-wadah' });
  const tools = el('div', { class: 'dk18-tombol' });
  const msg = el('p', { class: 'reveal info' }, 'Aturan: yang tersingkat dulu. Setiap menit datang satu es jeruk baru.');
  const prio = (j) => (j.id === 'A' ? leftA : 1) - (t - (j.at ?? 0) - (j.id === 'A' ? 6 - leftA : 0));
  const waiting = () => [...(stove === 'A' || leftA === 0 ? [] : [{ ...A, at: 0 }]), ...jeruk];
  const want = () => { const list = waiting(); return aging ? [...list].sort((a, b) => prio(a) - prio(b) || (a.at ?? 0) - (b.at ?? 0))[0] : [...list].sort((a, b) => (a.id === 'A' ? leftA : 1) - (b.id === 'A' ? leftA : 1) || (a.at ?? 0) - (b.at ?? 0))[0]; };
  function draw() {
    fill(head, el('b', null, aging ? '📜 Aturan: prioritas = lama masak − lama menunggu (aging)' : '📜 Aturan: yang tersingkat dulu'), el('span', null, `⏱️ menit ${t}`));
    fill(boardBox, el('small', null, '📋 Papan antrean'), el('div', { class: 'dk18-baris' }, waiting().map((j) => onTap(orderCard(j, { left: j.id === 'A' ? leftA : 1, state: j.id === 'A' && t >= 4 && !aging ? 'lapar' : 'siap', wait: aging ? null : t - j.at, prio: aging ? prio(j) : null }), (e) => pick(j.id, e.currentTarget)))));
    fill(stoveBox, el('small', null, '🔥 Kompor'), stove ? orderCard(stove === 'A' ? A : { id: stove, icon: '🍹', menu: 'Es jeruk', dur: 1 }, { left: stove === 'A' ? leftA : 1, state: 'jalan' }) : el('span', { class: 'dk18-kosong' }, 'kosong'));
    fill(tapeBox, el('small', null, '🎞️ Pita waktu'), tapeOf(cells.map((c) => (c && c[0] === 'J' ? 'J' : c)), 13));
  }
  function pick(id, node) {
    if (fin) return;
    if (stove) { shake(node); say(msg, 'info', 'Kompor masih dipakai. Tepuk "Menit berikutnya".'); return; }
    const w = want();
    if (id !== w.id) { ctx.mistake(); shake(node); say(msg, 'bad', aging ? 'Pilih angka prioritas terkecil.' : 'Yang tersingkat dulu: es jeruk hanya 1 menit.'); return; }
    stove = id; if (id !== 'A') jeruk = jeruk.filter((j) => j.id !== id);
    ctx.sound.tap(); draw(); say(msg, 'info', 'Tepuk "Menit berikutnya".');
  }
  function tick(node) {
    if (fin) return;
    if (!stove) { shake(node); say(msg, 'info', 'Kompor kosong: pilih pesanan dulu.'); return; }
    cells[t] = stove; t++;
    if (stove === 'A') { leftA--; if (leftA === 0) stove = null; } else stove = null;
    k++; jeruk.push({ id: `J${k}`, icon: '🍹', menu: 'Es jeruk', dur: 1, at: t });
    ctx.sound.tap(); draw();
    if (leftA === 0) { fin = true; fill(tools); ctx.sound.good(); say(msg, '', `Nasi goreng matang menit ${t} setelah menunggu ${t - 6} menit. Aging menaikkan prioritas pesanan yang lama menunggu, jadi tidak ada yang kelaparan. Sistem operasi sungguhan memakai cara serupa.`); done(); return; }
    if (!aging && t >= 6) {
      say(msg, 'bad', `Menit ${t}: nasi goreng sudah menunggu ${t} menit dan selalu kalah oleh es jeruk baru. Ia tidak akan pernah dimasak: kelaparan (starvation).`);
      fill(tools, button('📜 Pasang aturan aging', () => { aging = true; ctx.sound.tap(); draw(); fill(tools, button('👏 Menit berikutnya', (e) => tick(e?.currentTarget), 'primary')); say(msg, 'info', 'Setiap menit menunggu mengurangi angka prioritas 1. Pilih angka terkecil (seri: yang datang lebih dulu).'); }, 'primary'));
    }
  }
  fill(tools, button('👏 Menit berikutnya', (e) => tick(e?.currentTarget), 'primary'));
  wrap.append(head, el('div', { class: 'dk18-dapur' }, boardBox, stoveBox), tapeBox, tools, msg);
  draw();
}

function distinctJobs(rand) {
  const menu = [['Nasi goreng', '🍛'], ['Es teh', '🧋'], ['Mi goreng', '🍜'], ['Telur dadar', '🍳'], ['Pisang goreng', '🍌'], ['Soto ayam', '🍲'], ['Tempe goreng', '🥘'], ['Jus alpukat', '🥑']];
  const durs = rand.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 5);
  return rand.shuffle(menu).slice(0, 5).map(([m, icon], i) => ({ id: 'ABCDE'[i], menu: m, dur: durs[i], icon }));
}

const HEAD18 = {
  peta: ['Peta Dapur', 'Pasangkan bagian warung dengan bagian komputer.'],
  kompor: ['Dapur Satu Kompor', 'Pilih pesanan menurut aturan, tepuk setiap menit, isi pita waktu.'],
  giliran: ['Bergiliran', 'Setiap pesanan paling lama satu giliran, lalu kembali ke belakang papan.'],
  kejadian: ['Kartu Kejadian Dapur', 'Tebak arah perubahannya, lalu dapur memutar ulang.'],
  soto: ['Kuah Soto', 'Kuah direbus sendiri. Jangan biarkan kompor menganggur.'],
  boss: ['Nasi Goreng yang Terlupa', 'Es jeruk datang terus. Selamatkan nasi goreng.'],
};

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
    const wrap = el('div', { class: 'act satu-koki dk18-main' });
    root.append(wrap);
    const P = PESANAN;
    const rj = distinctJobs(ctx.rand);
    const rj2 = distinctJobs(ctx.rand);
    const q7 = ctx.rand.pick([1, 3, 4]);
    const rr2 = schedule(P, 'rr', 2);
    const EVENTS = [
      { text: 'Setiap berganti pesanan, Bu Sri mencuci wajan 0,5 menit.', base: 'bergiliran 2 menit', metric: 'menit semua pesanan selesai', before: 16, after: 20, r0: rr2, r1: schedule(P, 'rr', 2, 0.5), hint: 'Setiap pergantian menambah waktu yang tidak dipakai memasak.', why: '8 pergantian × 0,5 menit: selesai menit 20 (yang datang dulu hanya 4 pergantian, selesai menit 18). Inilah ongkos pergantian konteks.' },
      { text: 'Giliran dipendekkan menjadi 1 menit.', base: 'bergiliran 2 menit', metric: 'rata-rata waktu tanggap', before: 3.4, after: 2, r0: rr2, r1: schedule(P, 'rr', 1), hint: 'Waktu tanggap: kapan pesanan pertama kali menyentuh kompor.', why: 'Tanggap 2,0 menit, tetapi pergantian naik dari 8 menjadi 14 dan tunggu rata-rata 7,2.' },
      { text: 'Giliran dipanjangkan menjadi 3 menit.', base: 'bergiliran 2 menit', metric: 'banyak pergantian', before: 8, after: 6, r0: rr2, r1: schedule(P, 'rr', 3), hint: 'Giliran panjang berarti pesanan lebih jarang dipotong.', why: '6 pergantian, tetapi tanggap naik menjadi 4,6 dan tunggu 8,0. Makin panjang gilirannya, makin mirip yang datang dulu.' },
    ];
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD18[k], '👩‍🍳'));
      const rrWin = (x) => `Tanggap rata-rata ${fmt1(x.avgResp)} menit dan tunggu rata-rata ${fmt1(x.avgWait)} menit, dengan ${x.switches} pergantian.`;
      if (r === 0) { head('peta', 1); matchRound(wrap, ctx, { done: () => next() }); }
      else if (r === 1) { head('kompor', 2); kitchenRound(wrap, ctx, { jobs: P, rule: 'fcfs', win: (x) => `Tunggu rata-rata ${fmt1(x.avgWait)} menit. Es jeruk yang cuma 1 menit ikut menunggu nasi goreng 6 menit.`, done: () => next(6400) }); }
      else if (r === 2) { head('kompor', 2); kitchenRound(wrap, ctx, { jobs: P, rule: 'sjf', win: (x) => `Tunggu rata-rata ${fmt1(x.avgWait)} menit: dari 120 urutan, hanya B, D, E, C, A yang serendah ini (terburuk 8,8). Tetapi A menunggu 10 menit.`, done: () => next(6400) }); }
      else if (r === 3) { head('giliran', 3); kitchenRound(wrap, ctx, { jobs: P, rule: 'rr', q: 2, win: (x) => `${rrWin(x)} Setiap pesanan cepat tersentuh kompor.`, done: () => next(6400) }); }
      else if (r === 4) { head('kejadian', 4); eventRound18(wrap, ctx, { events: EVENTS, done: () => next(6000) }); }
      else if (r === 5) { head('soto', 5); sotoRound(wrap, ctx, { done: () => next(7000) }); }
      else if (r === 6) { head('kompor', 2); kitchenRound(wrap, ctx, { jobs: rj, rule: 'sjf', win: (x) => `Tunggu rata-rata ${fmt1(x.avgWait)} menit. Yang datang dulu: ${fmt1(schedule(rj, 'fcfs').avgWait)} menit.`, done: () => next(6400) }); }
      else if (r === 7) { head('giliran', 3); kitchenRound(wrap, ctx, { jobs: rj2, rule: 'rr', q: q7, win: rrWin, done: () => next(6400) }); }
      else if (r === 8) { head('giliran', 3); kitchenRound(wrap, ctx, { jobs: P, rule: 'rr', q: 2, arrive: { A: 0, B: 1, C: 2, D: 3, E: 4 }, win: (x) => `Pesanan datang bergantian, menit 0 sampai 4. Tunggu rata-rata ${fmt1(x.avgWait)} menit, dihitung dari saat datang.`, done: () => next(6400) }); }
      else { head('boss', 'Bos'); starveRound(wrap, ctx, { done: () => next(7000) }); }
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
