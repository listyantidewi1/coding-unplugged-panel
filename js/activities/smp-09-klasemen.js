// Klasemen Futsal Antarkelas — SMP (13–15 tahun), pengurutan. Fill a
// standings table from match results, rank by points, goal difference and
// goals scored, run bubble sort card by card (stop early when a pass has no
// swap), and sort by column three times with a stable sort.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const TEAMS = ['7A', '7B', '8A', '8B', '9A', '9B'];
export const MATCHES = [['7A', 2, 1, '7B'], ['7A', 0, 0, '8A'], ['7A', 1, 3, '8B'], ['7A', 2, 2, '9A'], ['7A', 3, 1, '9B'], ['7B', 1, 0, '8A'], ['7B', 2, 2, '8B'], ['7B', 0, 1, '9A'], ['7B', 4, 2, '9B'], ['8A', 2, 1, '8B'], ['8A', 1, 1, '9A'], ['8A', 3, 0, '9B'], ['8B', 2, 0, '9A'], ['8B', 1, 3, '9B'], ['9A', 2, 1, '9B']];
export const COLS = [['M', 'M'], ['Me', 'Me'], ['S', 'S'], ['K', 'K'], ['GM', 'GM'], ['GK', 'GK'], ['SG', 'SG'], ['P', 'Poin']];

export function standings(matches = MATCHES, teams = TEAMS) {
  const t = Object.fromEntries(teams.map((x) => [x, { tim: x, M: 0, Me: 0, S: 0, K: 0, GM: 0, GK: 0, SG: 0, P: 0 }]));
  for (const [a, ga, gb, b] of matches) {
    for (const [x, gx, gy] of [[a, ga, gb], [b, gb, ga]]) {
      const r = t[x];
      r.M++; r.GM += gx; r.GK += gy;
      if (gx > gy) { r.Me++; r.P += 3; } else if (gx === gy) { r.S++; r.P += 1; } else r.K++;
    }
  }
  for (const r of Object.values(t)) r.SG = r.GM - r.GK;
  return t;
}
// > 0 when a should be below b.
export const cmp = (a, b) => b.P - a.P || b.SG - a.SG || b.GM - a.GM;
export const ranking = (table) => Object.values(table).sort((a, b) => cmp(a, b) || a.tim.localeCompare(b.tim)).map((r) => r.tim);
// Bubble sort with early stop; every comparison as { pass, i, swap }.
export function bubble(order, table) {
  const a = [...order];
  const steps = [];
  for (let p = 0; p < a.length - 1; p++) {
    let swapped = false;
    for (let i = 0; i < a.length - 1 - p; i++) {
      const swap = cmp(table[a[i]], table[a[i + 1]]) > 0;
      steps.push({ pass: p, i, swap });
      if (swap) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swapped = true; }
    }
    if (!swapped) break;
  }
  return { steps, result: a };
}
// Stable sort, large to small, on one column.
export const sortBy = (order, table, col) => order.map((x, i) => [x, i]).sort((p, q) => table[q[0]][col] - table[p[0]][col] || p[1] - q[1]).map((p) => p[0]);
export const sg = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

export function randomTournament(rand) {
  const m = [];
  for (let i = 0; i < TEAMS.length; i++) for (let j = i + 1; j < TEAMS.length; j++) m.push([TEAMS[i], rand.int(0, 4), rand.int(0, 4), TEAMS[j]]);
  return m;
}

export default {
  id: 'smp-09-klasemen',
  title: 'Klasemen Futsal Antarkelas',
  topic: 'Pengurutan: aturan bertingkat, pengurutan gelembung, dan stabil',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '⚽',
  source: { name: 'CS Unplugged: Sorting Algorithms', url: 'https://www.csunplugged.org/en/topics/sorting-algorithms/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menyusun tabel klasemen, mengurutkan dengan aturan bertingkat, menjalankan pengurutan gelembung dan menghitung perbandingan, serta memakai pengurutan stabil berulang dengan urutan kolom yang benar.',
  extraModes: [
    { id: 'penghitung', icon: '🧮', label: 'Penghitung Klasemen', desc: 'Isi baris tim dari hasil pertandingan; tombol Turnamen baru membuat hasil acak', create: createCounter },
    { id: 'gelembung', icon: '🫧', label: 'Kartu Gelembung', desc: 'Putuskan tukar atau biarkan untuk setiap dua kartu yang menyala', create: createBubble },
    { id: 'kolom', icon: '↕️', label: 'Urutkan menurut Kolom', desc: 'Ketuk judul kolom untuk mengurutkan secara stabil; coba GM → SG → Poin dan sebaliknya', create: createColumns },
    { id: 'tim', icon: '🤝', label: 'Gelembung Bergiliran', desc: 'Tim bergantian memutuskan satu perbandingan; keputusan salah mengurangi skor', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act klasemen' });
    root.append(wrap);
    const table = standings();
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) rowRound(wrap, ctx, { team: '7B', matches: MATCHES, done: next });
      else if (r === 1) rowRound(wrap, ctx, { team: '8B', matches: MATCHES, done: next });
      else if (r === 2) rankRound(wrap, ctx, { table, done: next });
      else if (r === 3) bubbleRound(wrap, ctx, { table, start: TEAMS, done: next });
      else if (r === 4) ask('Pengurutan gelembung tadi butuh berapa perbandingan dan pertukaran?', [['12 perbandingan, 5 pertukaran', true], ['15 perbandingan, 5 pertukaran'], ['12 perbandingan, 3 pertukaran'], ['5 perbandingan, 12 pertukaran']], 2);
      else if (r === 5) ask('Mengapa putaran ke-2 cukup 4 perbandingan saja?', [['Sesudah putaran 1, kartu terbawah (9B) pasti sudah di ujung kanan', true], ['Karena putaran 2 selalu lebih cepat'], ['Karena 7A sudah di tempatnya'], ['Karena ada dua tim dengan poin sama']]);
      else if (r === 6) ask('Bila klasemen hanya memakai poin, tim mana yang tidak bisa dipisahkan?', [['7A, 8A, 9A (8 poin) serta 7B dan 8B (7 poin)', true], ['Hanya 7B dan 8B'], ['8A dan 9B'], ['Semua tim bisa dipisahkan']], 1, standingsView(table, TEAMS));
      else if (r === 7) columnRound(wrap, ctx, { table, done: next });
      else if (r === 8) ask('Pada pengurutan gelembung, kartu ditukar hanya bila kiri benar-benar harus di bawah. Bisakah dua tim yang nilainya persis sama bertukar tempat?', [['Tidak bisa, jadi pengurutan ini stabil', true], ['Bisa, jadi pengurutan ini stabil'], ['Bisa, jadi pengurutan ini tidak stabil'], ['Tidak bisa, jadi pengurutan ini tidak stabil']]);
      else ask('Liga 20 tim diurutkan dengan pengurutan gelembung. Paling banyak berapa perbandingan?', [[190, true], [400], [20], [380]], 4);
    }
    render();
  },
};

function standingsView(table, order, { hi = [], onHead } = {}) {
  return el('table', { class: 'kls-tabel' },
    el('thead', null, el('tr', null, el('th', null, 'Tim'), ...COLS.map(([k, l]) => el('th', null, onHead && ['GM', 'SG', 'P'].includes(k) ? onTap(el('button', { class: 'kls-kepala', type: 'button', 'data-col': k }, `${l} ↓`), () => onHead(k)) : l)))),
    el('tbody', null, order.map((x) => el('tr', { class: hi.includes(x) ? 'hi' : '' }, el('td', null, el('b', null, x)), ...COLS.map(([k]) => el('td', null, k === 'SG' ? sg(table[x][k]) : table[x][k]))))));
}
const matchList = (matches, team) => el('div', { class: 'kls-laga' }, matches.map(([a, ga, gb, b], i) => el('span', { class: team && (a === team || b === team) ? 'hi' : '' }, `${i + 1}. ${a} ${ga}–${gb} ${b}`)));

// Fill one team's row from the match list.
function rowRound(wrap, ctx, { team, matches, done }) {
  const want = standings(matches)[team];
  const vals = {};
  let focus = 'M';
  let finished = false;
  const row = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Menang 3 poin, seri 1, kalah 0. SG = GM − GK.');
  function draw(wrong = []) {
    row.replaceChildren(el('table', { class: 'kls-tabel' }, el('thead', null, el('tr', null, el('th', null, 'Tim'), ...COLS.map(([, l]) => el('th', null, l)))),
      el('tbody', null, el('tr', null, el('td', null, el('b', null, team)), ...COLS.map(([k]) => el('td', null, onTap(el('button', { class: `ck-isi ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] === undefined ? '…' : k === 'SG' ? sg(vals[k]) : vals[k]), () => { focus = k; draw(); })))))));
  }
  draw();
  const type = (d) => {
    if (finished) return;
    if (d === '−') { vals[focus] = -(vals[focus] || 0); draw(); return; }
    const neg = (vals[focus] || 0) < 0 || Object.is(vals[focus], -0);
    const v = Number(String(Math.abs(vals[focus] || 0)) + d) % 100;
    vals[focus] = neg ? -v : v;
    ctx.sound.tap();
    draw();
  };
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => type(d))),
    onTap(el('button', { class: 'key', type: 'button', 'aria-label': 'minus' }, '±'), () => type('−')),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { vals[focus] = undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, `Lengkapi baris ${team} dari hasil pertandingan.`), matchList(matches, team), row,
    el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
      if (finished) return;
      const wrong = COLS.map(([k]) => k).filter((k) => vals[k] !== want[k]);
      if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} sel belum tepat.`; ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Benar: ${team} main ${want.M}, menang ${want.Me}, seri ${want.S}, kalah ${want.K}, SG ${sg(want.SG)}, ${want.P} poin.`;
      done();
    }, 'primary')), msg);
}

// Tap teams from rank 1 to 6.
function rankRound(wrap, ctx, { table, done }) {
  const want = ranking(table);
  let picked = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Poin dulu; bila sama, selisih gol; bila masih sama, gol memasukkan.');
  function draw() {
    stage.replaceChildren(standingsView(table, TEAMS),
      el('div', { class: 'kls-peringkat' }, ...want.map((_, k) => el('span', { class: 'kls-slot' }, el('small', null, k + 1), picked[k] || ''))),
      el('div', { class: 'kode-baris' }, ...TEAMS.map((x) => button(x, () => { if (finished || picked.includes(x)) return; picked.push(x); ctx.sound.tap(); draw(); check(); }, picked.includes(x) ? 'small' : 'primary small')), button('Ulang', () => { if (!finished) { picked = []; draw(); } }, 'small')));
  }
  function check() {
    if (picked.length < 6) return;
    if (picked.join() !== want.join()) { msg.className = 'reveal bad'; msg.textContent = `Belum tepat: ${picked.join(', ')}. Ketuk Ulang.`; ctx.mistake(); shake(stage); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Benar: ${want.join(', ')}.`;
    done();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Susun klasemen: ketuk tim dari peringkat 1 sampai 6.'), stage, msg);
}

const card = (table, x, cls = '') => el('div', { class: `kls-kartu t${TEAMS.indexOf(x)} ${cls}` }, el('b', null, x), el('small', null, `${table[x].P} poin`), el('small', null, `SG ${sg(table[x].SG)}`), el('small', null, `GM ${table[x].GM}`));

// Bubble sort card by card: decide swap or keep for the lit pair.
function bubbleRound(wrap, ctx, { table, start, done, decide }) {
  const { steps } = bubble(start, table);
  const order = [...start];
  let k = 0;
  let swaps = 0;
  let passSwaps = [0];
  let finished = false;
  const stage = el('div', { class: 'kls-gelembung' });
  const info = el('p', { class: 'kls-hitung' });
  const msg = el('p', { class: 'reveal info' }, 'Tukar bila kartu kiri seharusnya di bawah kartu kanan.');
  function draw() {
    const s = steps[k];
    stage.replaceChildren(el('div', { class: 'kls-baris' }, order.map((x, i) => card(table, x, s && (i === s.i || i === s.i + 1) ? 'nyala' : s && i >= order.length - s.pass ? 'tetap' : ''))),
      s ? el('div', { class: 'kode-baris' }, button('⇄ Tukar', () => pick(true), 'primary'), button('Biarkan', () => pick(false), 'primary')) : null);
    info.textContent = `Putaran ${s ? s.pass + 1 : steps.at(-1).pass + 1} · perbandingan ${k} · pertukaran ${swaps}`;
  }
  function pick(swap) {
    if (finished) return;
    const s = steps[k];
    if (decide && !decide(swap === s.swap)) { draw(); return; }
    if (swap !== s.swap) { msg.className = 'reveal bad'; msg.textContent = s.swap ? `${order[s.i]} seharusnya di bawah ${order[s.i + 1]}: tukar.` : `${order[s.i]} sudah benar di atas ${order[s.i + 1]}: biarkan.`; ctx.mistake(); shake(stage); if (!decide) return; }
    if (s.swap) { [order[s.i], order[s.i + 1]] = [order[s.i + 1], order[s.i]]; swaps++; passSwaps[s.pass] = (passSwaps[s.pass] || 0) + 1; }
    k++;
    ctx.sound.tap();
    if (swap === s.swap) { msg.className = 'reveal info'; msg.textContent = steps[k] && steps[k].pass !== s.pass ? `Putaran ${s.pass + 1} selesai: ${order.join(', ')} (${passSwaps[s.pass] || 0} pertukaran).` : 'Tepat.'; }
    if (k === steps.length) {
      finished = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = `Putaran ${s.pass + 1} tanpa pertukaran, jadi berhenti. ${k} perbandingan, ${swaps} pertukaran: ${order.join(', ')}.`;
      done({ comparisons: k, swaps });
      return;
    }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pengurutan gelembung: mulai dari urutan abjad.'), info, stage, msg);
}

// Sort by columns (stable) until the table matches the ranking.
function columnRound(wrap, ctx, { table, done, free }) {
  const want = ranking(table);
  let order = [...TEAMS];
  const hist = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk judul kolom untuk mengurutkan (besar ke kecil, stabil). Coba GM, lalu SG, lalu Poin.');
  function draw() {
    stage.replaceChildren(standingsView(table, order, { onHead: (c) => sortCol(c) }),
      el('div', { class: 'kode-baris' }, el('span', { class: 'small-note' }, hist.length ? `Langkah: ${hist.join(' → ')}` : 'Mulai dari urutan abjad.'), button('Mulai ulang', () => { order = [...TEAMS]; hist.length = 0; msg.className = 'reveal info'; msg.textContent = 'Kembali ke urutan abjad.'; draw(); }, 'small')));
  }
  function sortCol(c) {
    if (finished) return;
    order = sortBy(order, table, c);
    hist.push(c === 'P' ? 'Poin' : c);
    ctx.sound.tap();
    draw();
    const ok = order.join() === want.join();
    msg.className = ok ? 'reveal' : 'reveal info';
    msg.textContent = `${order.join(', ')}${ok ? ' — sama dengan klasemen!' : ''}`;
    if (ok && hist.length >= 3 && !free) {
      finished = true;
      msg.textContent = `${order.join(', ')}: sama dengan klasemen. Aturan terpenting (Poin) diurutkan paling akhir.`;
      done();
    } else if (!ok && hist.length >= 3 && !free) { msg.className = 'reveal bad'; msg.textContent = `${order.join(', ')}: belum sama dengan klasemen. Pengurutan terakhir paling menentukan. Mulai ulang.`; ctx.mistake(); }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Urutkan tabel tiga kali sampai sama dengan klasemen.'), stage, msg);
}

function createCounter(root, ctx) {
  const wrap = el('div', { class: 'act klasemen' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let matches = MATCHES;
  let team = '7B';
  function go() {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, ...TEAMS.map((x) => button(x, () => { team = x; go(); }, x === team ? 'primary small' : 'small')), button('Turnamen baru', () => { matches = randomTournament(rand); go(); }, 'small'), button('Turnamen lembar kerja', () => { matches = MATCHES; go(); }, 'small')));
    rowRound(wrap, ctx, { team, matches, done() { ctx.sound.win(); } });
  }
  go();
}

function createBubble(root, ctx) {
  const wrap = el('div', { class: 'act klasemen' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go(random) {
    const matches = random ? randomTournament(rand) : MATCHES;
    const table = standings(matches);
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('Turnamen lembar kerja', () => go(false), 'small'), button('Turnamen acak', () => go(true), 'small')));
    bubbleRound(wrap, ctx, { table, start: TEAMS, done() { ctx.sound.win(); } });
  }
  go(false);
}

function createColumns(root, ctx) {
  const wrap = el('div', { class: 'act klasemen' });
  root.append(wrap);
  columnRound(wrap, ctx, { table: standings(), free: true, done() {} });
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act klasemen' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const score = [0, 0];
  let turn = 0;
  const board = el('p', { class: 'reveal info' });
  const paint = () => { board.textContent = `Giliran Tim ${turn + 1} · Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`; };
  function go() {
    const table = standings(randomTournament(rand));
    wrap.replaceChildren(board);
    paint();
    bubbleRound(wrap, ctx, {
      table, start: TEAMS,
      decide(right) { score[turn] += right ? 1 : -1; turn = 1 - turn; paint(); return true; },
      done() { ctx.sound.win(); board.textContent = `Selesai! Tim 1 ${score[0]} · Tim 2 ${score[1]}. ${score[0] === score[1] ? 'Seri!' : `Tim ${score[0] > score[1] ? 1 : 2} menang!`}`; wrap.append(button('Turnamen lain ➜', go, 'primary')); },
    });
  }
  go();
}
