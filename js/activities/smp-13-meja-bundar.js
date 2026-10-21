// Makan Bersama di Meja Bundar — SMP (13–15 tahun), kebuntuan (deadlock).
// Four friends share 2 spoons and 2 forks placed between them. "Left first"
// can end with everyone holding one tool and waiting forever; "spoon first"
// (one global resource order) and a waiter admitting at most 3 never do.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const PEOPLE = ['Ani', 'Bayu', 'Citra', 'Dedi'];
export const SIDES = { Ani: ['S1', 'G1'], Bayu: ['G1', 'S2'], Citra: ['S2', 'G2'], Dedi: ['G2', 'S1'] };
export const RULES = {
  A: 'Ambil yang kiri dulu, lalu yang kanan',
  B: 'Ambil sendok dulu, baru garpu',
  C: 'Pelayan: paling banyak 3 orang mencoba; aturan A',
};
const spoon = (t) => t[0] === 'S';

// starts: start turn per person; order: priority for conflicts (default by name).
export function init(rule, starts = {}, order = PEOPLE) {
  return { rule, order, starts: Object.fromEntries(PEOPLE.map((p) => [p, starts[p] || 1])), turn: 0, holder: {}, has: Object.fromEntries(PEOPLE.map((p) => [p, []])), eaten: new Set(), admitted: new Set(), rows: [], waits: {}, stuck: false };
}
function wantOf(st, p) {
  const [l, r] = SIDES[p];
  if (st.rule === 'B') { const s = spoon(l) ? l : r; return st.has[p].includes(s) ? (s === l ? r : l) : s; }
  return st.has[p].includes(l) ? r : l;
}
export const finished = (st) => st.eaten.size === PEOPLE.length || st.stuck;

// Play one turn: returns the row of actions, e.g. { Ani: 'ambil S1', … }.
export function turn(st) {
  st.turn++;
  const t = st.turn;
  const row = {};
  const requests = {};
  const waits = {};
  let changed = false;
  const active = st.order.filter((p) => t >= st.starts[p] && !st.eaten.has(p));
  if (st.rule === 'C') {
    for (const p of active) {
      const inside = [...st.admitted].filter((q) => !st.eaten.has(q)).length;
      if (!st.admitted.has(p) && inside < 3) st.admitted.add(p);
    }
  }
  for (const p of PEOPLE) {
    if (!active.includes(p)) { row[p] = '–'; continue; }
    if (st.rule === 'C' && !st.admitted.has(p)) { row[p] = 'tunggu pelayan'; continue; }
    if (st.has[p].length === 2) { row[p] = 'makan'; continue; }
    const w = wantOf(st, p);
    if (st.holder[w]) { row[p] = `tunggu ${w}`; waits[p] = st.holder[w]; } else (requests[w] ||= []).push(p);
  }
  for (const [tool, ps] of Object.entries(requests)) {
    const win = st.order.find((p) => ps.includes(p));
    for (const p of ps) {
      if (p === win) { row[p] = `ambil ${tool}`; st.holder[tool] = p; st.has[p].push(tool); changed = true; } else { row[p] = `tunggu ${tool}`; waits[p] = win; }
    }
  }
  for (const p of PEOPLE) {
    if (row[p] !== 'makan') continue;
    for (const tool of st.has[p]) delete st.holder[tool];
    st.has[p] = [];
    st.eaten.add(p);
    changed = true;
  }
  st.waits = waits;
  st.rows.push(row);
  const later = PEOPLE.some((p) => st.starts[p] > t);
  if (!changed && !later && st.eaten.size < PEOPLE.length) st.stuck = true;
  return row;
}
// The waiting cycle (list of people) if there is one.
export function cycle(waits) {
  for (const s of Object.keys(waits)) {
    const seen = [s];
    let p = waits[s];
    while (p && !seen.includes(p)) { seen.push(p); p = waits[p]; }
    if (p === s) return seen;
  }
  return null;
}
export function run(rule, starts, order, max = 30) {
  const st = init(rule, starts, order);
  while (!finished(st) && st.turn < max) turn(st);
  return st;
}
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
// Every start turn 1–3 for each person and every priority order.
export function tryAll(rule) {
  let stuck = 0;
  let n = 0;
  for (const order of perms(PEOPLE)) {
    for (let k = 0; k < 81; k++) {
      const starts = Object.fromEntries(PEOPLE.map((p, i) => [p, 1 + (Math.floor(k / 3 ** i) % 3)]));
      n++;
      if (run(rule, starts, order).stuck) stuck++;
    }
  }
  return { stuck, n };
}

// Round table seen from above: people N, E, S, W; tools on the diagonals.
const SEAT = { Ani: [50, 12], Bayu: [88, 50], Citra: [50, 88], Dedi: [12, 50] };
const SPOT = { S1: [27, 27], G1: [73, 27], S2: [73, 73], G2: [27, 73] };
const ICON = { S1: '🥄', S2: '🥄', G1: '🍴', G2: '🍴' };
function tableView(st, { onPerson, mine } = {}) {
  const cyc = cycle(st.waits) || [];
  const arrows = Object.entries(st.waits).map(([a, b]) => {
    const [x1, y1] = SEAT[a];
    const [x2, y2] = SEAT[b];
    const k = 0.22;
    return `<line x1="${x1 + (x2 - x1) * k}" y1="${y1 + (y2 - y1) * k}" x2="${x2 - (x2 - x1) * k}" y2="${y2 - (y2 - y1) * k}" class="${cyc.includes(a) && cyc.includes(b) ? 'buntu' : ''}" marker-end="url(#mb-${cyc.includes(a) ? 'm' : 'b'})"/>`;
  }).join('');
  const svg = el('div', { class: 'mb-svg' });
  svg.innerHTML = `<svg viewBox="0 0 100 100"><defs><marker id="mb-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2563eb"/></marker><marker id="mb-m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#dc2626"/></marker></defs><circle cx="50" cy="50" r="30" class="meja"/>${arrows}</svg>`;
  const tools = Object.keys(SPOT).map((t) => {
    const h = st.holder[t];
    const [x, y] = h ? [(SPOT[t][0] * 3 + SEAT[h][0] * 2) / 5, (SPOT[t][1] * 3 + SEAT[h][1] * 2) / 5] : SPOT[t];
    return el('span', { class: `mb-alat ${h ? 'dipegang' : ''}`, style: `left:${x}%;top:${y}%` }, ICON[t], el('small', null, t));
  });
  const people = PEOPLE.map((p) => {
    const [x, y] = SEAT[p];
    const state = st.eaten.has(p) ? 'kenyang' : cyc.includes(p) ? 'buntu' : st.turn + 1 < st.starts[p] ? 'belum' : '';
    const b = el('button', { class: `mb-orang ${state} ${mine === p ? 'saya' : ''}`, type: 'button', 'data-p': p, style: `left:${x}%;top:${y}%` }, el('b', null, p), el('small', null, st.eaten.has(p) ? '😋 kenyang' : st.has[p].join(' + ') || '🍽️'));
    return onPerson ? onTap(b, () => onPerson(p)) : b;
  });
  return el('div', { class: 'mb-meja' }, svg, ...tools, ...people);
}

function rowsTable(st, extra = null) {
  return el('div', { class: 'mb-tabel-wadah' }, el('table', { class: 'kls-tabel mb-tabel' },
    el('thead', null, el('tr', null, el('th', null, 'Giliran'), ...PEOPLE.map((p) => el('th', null, p)))),
    el('tbody', null, ...st.rows.map((r, i) => el('tr', null, el('td', null, i + 1), ...PEOPLE.map((p) => el('td', { class: r[p] === 'makan' ? 'makan' : r[p].startsWith('ambil') ? 'ambil' : '' }, r[p])))), ...(extra ? [extra] : []))));
}
const optionsFor = (p) => ['–', `ambil ${SIDES[p][0]}`, `ambil ${SIDES[p][1]}`, `tunggu ${SIDES[p][0]}`, `tunggu ${SIDES[p][1]}`, 'makan'];

// Fill the turn table: choose each person's action, turn by turn.
function fillRound(wrap, ctx, { rule, starts, given = 0, turns, prompt, done }) {
  const st = init(rule, starts);
  for (let i = 0; i < given; i++) turn(st);
  const total = turns || run(rule, starts).rows.length;
  const pick = {};
  let finishedFlag = false;
  const stage = el('div', { class: 'mb-samping' });
  const msg = el('p', { class: 'reveal info' }, 'Pilih aksi setiap orang untuk giliran ini, lalu tekan Periksa.');
  function draw(wrong = []) {
    const row = finishedFlag ? null : el('tr', { class: 'mb-isi' }, el('td', null, st.turn + 1), ...PEOPLE.map((p) => el('td', { class: wrong.includes(p) ? 'salah' : '' },
      el('div', { class: 'seg mb-pilih' }, optionsFor(p).map((o) => onTap(el('button', { class: `seg-btn ${pick[p] === o ? 'on' : ''}`, type: 'button', 'data-p': p, 'data-o': o }, o), () => { pick[p] = o; ctx.sound.tap(); draw(); }))))));
    stage.replaceChildren(tableView(st), rowsTable(st, row));
  }
  function check() {
    if (finishedFlag) return;
    const want = turn(structuredClone(st));
    const wrong = PEOPLE.filter((p) => pick[p] !== want[p]);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.join(', ')} belum tepat. Ingat: alat yang dipegang orang lain tidak bisa diambil, dan bila berebut, yang namanya lebih dulu menurut abjad menang.`; ctx.mistake(); shake(stage); return; }
    turn(st);
    for (const p of PEOPLE) delete pick[p];
    ctx.sound.good();
    if (st.rows.length >= total) {
      finishedFlag = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = st.eaten.size === PEOPLE.length ? `Semua sudah makan dalam ${st.rows.length} giliran.` : 'Semua menunggu dan tidak ada yang bisa makan: kebuntuan.';
      done();
      return;
    }
    msg.className = 'reveal info';
    msg.textContent = `Giliran ${st.turn} benar. Lanjut ke giliran ${st.turn + 1}.`;
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, el('div', { class: 'kode-baris' }, button('Periksa', check, 'primary')), msg);
}

export default {
  id: 'smp-13-meja-bundar',
  title: 'Makan Bersama di Meja Bundar',
  topic: 'Kebuntuan (deadlock) dan aturan urutan sumber daya',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🍽️',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid menjalankan simulasi giliran, mengenali kebuntuan sebagai lingkaran saling menunggu, dan menjelaskan mengapa aturan urutan sumber daya mencegahnya.',
  extraModes: [
    { id: 'simulasi', icon: '▶️', label: 'Simulasi Meja', desc: 'Pilih aturan A, B, atau C dan giliran mulai setiap orang, lalu jalankan giliran demi giliran', create: createSim },
    { id: 'semua', icon: '🔁', label: 'Coba Semua Urutan', desc: 'Jalankan semua kombinasi giliran mulai dan urutan prioritas; berapa persen yang buntu?', create: createAll },
    { id: 'empat', icon: '👥', label: 'Empat Pemain', desc: 'Empat murid di empat sisi panel, masing-masing mengendalikan satu tokoh; usahakan semua bisa makan', create: createFour },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mejabundar' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) fillRound(wrap, ctx, { rule: 'A', turns: 3, prompt: `Aturan A: "${RULES.A}". Semua mulai pada giliran 1.`, done: next });
      else if (r === 1) { const st = run('A'); ask('Panah menunjuk ke orang yang memegang alat yang ditunggu. Bentuk apa yang terbentuk?', [['Lingkaran: Ani → Bayu → Citra → Dedi → Ani, semua menunggu selamanya', true], ['Garis lurus: Ani menunggu, yang lain makan'], ['Tidak ada panah, semua makan'], ['Dua pasangan yang saling menunggu']], 1, tableView(st)); }
      else if (r === 2) fillRound(wrap, ctx, { rule: 'A', starts: { Dedi: 2 }, given: 1, prompt: 'Aturan A, tetapi Dedi datang terlambat (mulai giliran 2). Lanjutkan sampai semua makan.', done: next });
      else if (r === 3) ask('Aturan yang sama bisa buntu (semua mulai bersamaan) atau lancar (Dedi terlambat). Apa pelajarannya tentang menguji program?', [['Kebuntuan hanya muncul pada urutan waktu tertentu, jadi program bisa lolos uji lalu buntu di lain waktu', true], ['Bila sekali lolos uji, program pasti benar'], ['Kebuntuan selalu terjadi pada percobaan pertama'], ['Program yang buntu cukup dijalankan ulang']]);
      else if (r === 4) fillRound(wrap, ctx, { rule: 'B', prompt: `Aturan B: "${RULES.B}". Semua mulai pada giliran 1.`, done: next });
      else if (r === 5) ask('Mengapa aturan B tidak pernah buntu? Orang yang memegang garpu pasti sudah memegang …', [['sendok, jadi ia segera makan dan mengembalikan alatnya; lingkaran menunggu tidak terbentuk', true], ['garpu lain, jadi ia bisa makan dengan dua garpu'], ['tidak ada apa-apa, jadi ia menunggu'], ['piring, jadi pelayan membantunya']]);
      else if (r === 6) ask('Aturan C (pelayan): 3 orang masing-masing memegang satu alat. Berapa alat yang masih di meja, dan paling banyak berapa orang bisa makan bersamaan?', [['1 alat tersisa, jadi seseorang bisa melengkapi alatnya; paling banyak 2 orang makan bersamaan', true], ['Tidak ada alat tersisa; 4 orang bisa makan bersamaan'], ['2 alat tersisa; 3 orang makan bersamaan'], ['1 alat tersisa; tetapi tetap buntu']]);
      else if (r === 7) ask('Komputer TU memakai printer dan menunggu pemindai. Komputer Perpustakaan memakai pemindai dan menunggu printer. Aturan apa yang mencegah kebuntuan ini?', [['Semua komputer meminta printer dulu, baru pemindai (urutan yang sama untuk semua)', true], ['Setiap komputer memakai alat yang paling dekat dulu'], ['Komputer yang menunggu cukup menunggu lebih lama'], ['Tambah satu komputer lagi']]);
      else {
        const starts = Object.fromEntries(PEOPLE.map((p) => [p, ctx.rand.int(1, 3)]));
        const st = run('A', starts);
        const info = el('p', { class: 'small-note' }, `Giliran mulai: ${PEOPLE.map((p) => `${p} ${starts[p]}`).join(', ')}. Aturan A.`);
        ask('Tebak tanpa mensimulasikan di layar: apakah meja ini akan buntu?', [['Ya, buntu', st.stuck], ['Tidak, semua makan', !st.stuck]], 2, info);
        wrap.append(el('details', { class: 'mb-detail' }, el('summary', null, 'Lihat simulasi'), rowsTable(st)));
      }
    }
    render();
  },
};

function startPicker(starts, redraw) {
  return el('div', { class: 'mb-mulai' }, ...PEOPLE.map((p) => el('div', { class: 'mb-mulai-baris' }, el('b', null, p),
    el('div', { class: 'seg' }, [1, 2, 3].map((t) => onTap(el('button', { class: `seg-btn ${starts[p] === t ? 'on' : ''}`, type: 'button' }, `mulai ${t}`), () => { starts[p] = t; redraw(); }))))));
}

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act mejabundar' });
  root.append(wrap);
  let rule = 'A';
  const starts = Object.fromEntries(PEOPLE.map((p) => [p, 1]));
  let st;
  const reset = () => { st = init(rule, starts); draw(); };
  function draw() {
    const cyc = cycle(st.waits);
    wrap.replaceChildren(
      el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, Object.keys(RULES).map((k) => onTap(el('button', { class: `seg-btn ${rule === k ? 'on' : ''}`, type: 'button' }, `Aturan ${k}`), () => { rule = k; reset(); })))),
      el('p', { class: 'small-note' }, `Aturan ${rule}: ${RULES[rule]}`),
      el('div', { class: 'mb-samping' }, tableView(st), el('div', null, startPicker(starts, reset), rowsTable(st))),
      el('p', { class: `reveal ${st.stuck ? 'bad' : 'info'}` }, st.stuck ? `Kebuntuan! ${cyc ? cyc.concat(cyc[0]).join(' → ') : 'Semua menunggu'}.` : st.eaten.size === 4 ? `Semua makan dalam ${st.turn} giliran.` : `Giliran ${st.turn}.`),
      el('div', { class: 'kode-baris' }, button('Giliran berikutnya ➜', () => { if (!finished(st)) { turn(st); if (st.stuck) ctx.sound.bad(); else ctx.sound.tap(); if (st.eaten.size === 4) ctx.sound.win(); draw(); } }, 'primary'),
        button('Sampai selesai', () => { while (!finished(st) && st.turn < 30) turn(st); draw(); }, 'small'), button('Ulangi', reset, 'small')));
  }
  reset();
}

function createAll(root, ctx) {
  const wrap = el('div', { class: 'act mejabundar' });
  root.append(wrap);
  const res = {};
  function draw() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Setiap orang mulai pada giliran 1, 2, atau 3 (81 kombinasi), dengan 24 urutan prioritas: 1.944 percobaan per aturan.'),
      el('div', { class: 'mb-hasil' }, ...Object.keys(RULES).map((k) => el('div', { class: 'mb-hasil-kartu' }, el('b', null, `Aturan ${k}`), el('small', null, RULES[k]),
        res[k] ? [el('div', { class: 'mb-batang' }, el('span', { style: `width:${(100 * res[k].stuck) / res[k].n}%` })), el('p', null, `${res[k].stuck} dari ${res[k].n.toLocaleString('id-ID')} buntu (${((100 * res[k].stuck) / res[k].n).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%)`)] : el('p', null, '…')))),
      el('div', { class: 'kode-baris' }, button('Coba semua urutan', () => { for (const k of Object.keys(RULES)) res[k] = tryAll(k); ctx.sound.win(); draw(); }, 'primary')));
  }
  draw();
}

// Four players: each taps their own person's action buttons; the turn runs
// when all four have chosen.
function createFour(root, ctx) {
  const wrap = el('div', { class: 'act mejabundar empat' });
  root.append(wrap);
  let st;
  let pick;
  const reset = () => { st = init('free'); pick = {}; draw(); };
  function legal(p) {
    if (st.eaten.has(p)) return ['–'];
    if (st.has[p].length === 2) return ['makan'];
    return [...SIDES[p].filter((t) => !st.has[p].includes(t)).map((t) => (st.holder[t] ? `tunggu ${t}` : `ambil ${t}`)), 'tunggu'];
  }
  function resolve() {
    st.turn++;
    const row = {};
    const req = {};
    st.waits = {};
    for (const p of PEOPLE) {
      row[p] = pick[p];
      if (pick[p].startsWith('ambil')) (req[pick[p].slice(6)] ||= []).push(p);
      if (pick[p].startsWith('tunggu ')) st.waits[p] = st.holder[pick[p].slice(7)];
    }
    for (const [tool, ps] of Object.entries(req)) {
      const win = PEOPLE.find((p) => ps.includes(p));
      for (const p of ps) if (p === win) { st.holder[tool] = p; st.has[p].push(tool); } else { row[p] = `tunggu ${tool}`; st.waits[p] = win; }
    }
    for (const p of PEOPLE) if (row[p] === 'makan') { for (const t of st.has[p]) delete st.holder[t]; st.has[p] = []; st.eaten.add(p); }
    st.rows.push(row);
    st.stuck = PEOPLE.every((p) => st.eaten.has(p) || (st.has[p].length === 1 && SIDES[p].every((t) => st.holder[t])));
    if (st.stuck && st.eaten.size < 4) { st.waits = Object.fromEntries(PEOPLE.filter((p) => !st.eaten.has(p)).map((p) => [p, st.holder[SIDES[p].find((t) => st.holder[t] !== p)]])); ctx.sound.bad(); } else st.stuck = false;
    if (st.eaten.size === 4) ctx.sound.win();
    pick = {};
    draw();
  }
  function draw() {
    const pads = PEOPLE.map((p) => el('div', { class: `mb-pad mb-pad-${p.toLowerCase()}` }, el('b', null, p),
      el('div', { class: 'seg' }, legal(p).map((o) => onTap(el('button', { class: `seg-btn ${pick[p] === o ? 'on' : ''}`, type: 'button', 'data-p': p }, o), () => {
        if (st.stuck || st.eaten.size === 4) return;
        pick[p] = o;
        ctx.sound.tap();
        if (PEOPLE.every((q) => pick[q])) resolve(); else draw();
      })))));
    const status = st.eaten.size === 4 ? `Hebat! Semua makan dalam ${st.turn} giliran.` : st.stuck ? 'Kebuntuan! Setiap orang memegang satu alat dan menunggu alat yang dipegang tetangganya.' : `Giliran ${st.turn + 1}: setiap pemain memilih aksi. Sudah memilih: ${PEOPLE.filter((p) => pick[p]).join(', ') || 'belum ada'}.`;
    wrap.replaceChildren(pads[0], el('div', { class: 'mb-tengah' }, pads[3], tableView(st), pads[1]), pads[2],
      el('p', { class: `reveal ${st.stuck ? 'bad' : 'info'}` }, status), el('div', { class: 'kode-baris' }, button('Mulai lagi', reset, 'small')));
  }
  reset();
}
