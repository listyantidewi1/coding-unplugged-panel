// Permainan Tangkap Mangga — SD Lanjut (10–12 tahun), pemrograman berbasis
// kejadian. Rule cards KETIKA … MAKA … run when an event happens; scores
// live in variables. Missing rules make the basket vanish or the game endless.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const EVENTS = {
  mulai: 'permainan dimulai',
  kiri: 'tombol ◀ ditekan',
  kanan: 'tombol ▶ ditekan',
  matang: 'mangga matang menyentuh keranjang',
  busuk: 'mangga busuk menyentuh keranjang',
  emas: 'mangga emas menyentuh keranjang',
  lewat: 'mangga matang terlewat',
  'busuk=3': 'busuk = 3',
  'skor=10': 'skor = 10',
  'nyawa=0': 'nyawa = 0',
};
export const ACTIONS = {
  'atur:skor:0': 'ATUR skor MENJADI 0',
  'atur:busuk:0': 'ATUR busuk MENJADI 0',
  'atur:nyawa:3': 'ATUR nyawa MENJADI 3',
  'letak:3': 'letakkan keranjang di lajur 3',
  'kiri?': 'JIKA lajur keranjang > 1 MAKA pindahkan keranjang ke kiri',
  'kanan?': 'JIKA lajur keranjang < 5 MAKA pindahkan keranjang ke kanan',
  kiri: 'pindahkan keranjang ke kiri',
  kanan: 'pindahkan keranjang ke kanan',
  'tambah:skor:1': 'TAMBAH skor 1',
  'tambah:skor:5': 'TAMBAH skor 5',
  'tambah:busuk:1': 'TAMBAH busuk 1',
  'kurangi:nyawa:1': 'KURANGI nyawa 1',
  'pesan:Permainan selesai': 'tampilkan "Permainan selesai"',
  'pesan:Kamu menang!': 'tampilkan "Kamu menang!"',
  selesai: 'abaikan semua kejadian sesudahnya',
};
const R = (when, ...acts) => ({ when, acts });
export const KELAS6 = [
  R('mulai', 'atur:skor:0', 'atur:busuk:0', 'letak:3'),
  R('kiri', 'kiri?'),
  R('kanan', 'kanan?'),
  R('matang', 'tambah:skor:1'),
  R('busuk', 'tambah:busuk:1'),
  R('busuk=3', 'pesan:Permainan selesai', 'selesai'),
];
export const DIKA = [KELAS6[0], R('kiri', 'kiri'), R('kanan', 'kanan'), KELAS6[3], KELAS6[4]];
export const NYAWA = [R('mulai', 'atur:skor:0', 'atur:busuk:0', 'atur:nyawa:3', 'letak:3'), ...KELAS6.slice(1),
  R('lewat', 'kurangi:nyawa:1'), R('nyawa=0', 'pesan:Permainan selesai', 'selesai')];

// A game made from rule cards. `emit(ev)` runs one event: { type: 'mulai' |
// 'kiri' | 'kanan' } or { type: 'jatuh', kind: 'matang' | 'busuk' | 'emas', lane }.
export function makeGame(rules) {
  const st = { lajur: null, vars: {}, over: false, msg: '' };
  const varTrue = (w) => { const [v, n] = w.split('='); return st.vars[v] === Number(n); };
  const run = (acts) => acts.forEach((a) => {
    if (st.over) return;
    const [op, v, n] = a.split(':');
    if (op === 'atur') st.vars[v] = Number(n);
    else if (op === 'tambah') st.vars[v] = (st.vars[v] ?? 0) + Number(n);
    else if (op === 'kurangi') st.vars[v] = (st.vars[v] ?? 0) - Number(n);
    else if (op === 'letak') st.lajur = Number(v);
    else if (op === 'kiri?' && st.lajur > 1) st.lajur--;
    else if (op === 'kanan?' && st.lajur < 5) st.lajur++;
    else if (op === 'kiri') st.lajur--;
    else if (op === 'kanan') st.lajur++;
    else if (op === 'pesan') st.msg = v;
    else if (op === 'selesai') st.over = true;
  });
  return {
    st,
    emit(ev) {
      if (st.over) return { ignored: true, fired: [], what: 'diabaikan' };
      let types = [ev.type], what = '';
      if (ev.type === 'jatuh') {
        const hit = ev.lane === st.lajur;
        types = hit ? [ev.kind] : ev.kind === 'matang' ? ['lewat'] : [];
        what = hit ? (ev.kind === 'busuk' ? 'busuk tertangkap' : 'tertangkap') : 'lewat';
      }
      const was = st.lajur;
      const before = rules.map((r) => r.when.includes('=') && varTrue(r.when));
      const fired = [];
      rules.forEach((r, i) => { if (!st.over && types.includes(r.when)) { run(r.acts); fired.push(i); } });
      // Rules on variables run when their condition becomes true.
      rules.forEach((r, i) => { if (!st.over && r.when.includes('=') && !before[i] && varTrue(r.when)) { run(r.acts); fired.push(i); } });
      if (!what && ev.type === 'mulai') what = 'permainan dimulai';
      else if (!what) what = st.lajur !== was ? `pindah ke ${ev.type} (aturan ${fired.map((i) => i + 1).join(', ')})` : `tetap di lajur ${st.lajur}${fired.length ? ` (aturan ${fired.map((i) => i + 1).join(', ')})` : ''}`;
      if (st.over && fired.length) what += ', permainan selesai';
      return { ignored: false, fired, what };
    },
  };
}

const MANGGA = { matang: '🥭', busuk: '🟤', emas: '🌟' };
const evText = (e) => (e.type === 'jatuh' ? `${MANGGA[e.kind]} jatuh di lajur ${e.lane}` : e.type === 'mulai' ? 'mulai' : `tombol ${e.type === 'kiri' ? '◀' : '▶'}`);
const E = (type, kind, lane) => ({ type, kind, lane });
export const SEQ2 = [E('mulai'), E('jatuh', 'matang', 3), E('kiri'), E('jatuh', 'matang', 2), E('jatuh', 'busuk', 2), E('kanan'), E('kanan'),
  E('jatuh', 'matang', 5), E('jatuh', 'busuk', 4), E('kanan'), E('kanan'), E('jatuh', 'matang', 5), E('jatuh', 'busuk', 5), E('jatuh', 'matang', 5)];
export const SEQ3 = [E('mulai'), E('kanan'), E('kanan'), E('kanan'), E('jatuh', 'matang', 5), E('kiri'), ...Array.from({ length: 4 }, () => E('jatuh', 'busuk', 5))];

// Runs a whole sequence and keeps the state after each event.
export function trace(rules, seq) {
  const g = makeGame(rules);
  return seq.map((e) => { const r = g.emit(e); return { e, ...r, lajur: g.st.lajur, vars: { ...g.st.vars }, over: g.st.over, msg: g.st.msg }; });
}

// Five lanes with the basket; a basket outside 1–5 is drawn off the screen.
function lanesView() {
  const lanes = Array.from({ length: 5 }, (_, i) => el('div', { class: 'tgm-lajur' }, el('small', null, i + 1)));
  const basket = el('span', { class: 'tgm-keranjang' }, '🧺');
  const off = el('div', { class: 'tgm-luar' });
  const msg = el('div', { class: 'tgm-pesan' });
  const node = el('div', { class: 'tgm-layar' }, el('div', { class: 'tgm-lajur-lajur' }, ...lanes), off, msg);
  return {
    node, lanes,
    show(st) {
      if (st.lajur >= 1 && st.lajur <= 5) { lanes[st.lajur - 1].append(basket); off.textContent = ''; }
      else { basket.remove(); off.textContent = st.lajur == null ? '' : `🧺 keranjang di lajur ${st.lajur}, di luar layar!`; }
      msg.textContent = st.msg ? st.msg : '';
      msg.style.display = st.msg ? '' : 'none';
    },
    drop(kind, lane, ms = 500) {
      if (lane < 1 || lane > 5) return;
      const m = el('span', { class: 'tgm-mangga', style: { animationDuration: `${ms}ms` } }, MANGGA[kind]);
      lanes[lane - 1].append(m);
      setTimeout(() => m.remove(), ms);
    },
  };
}

function varsView() {
  const node = el('div', { class: 'tgm-var' });
  return { node, show(vars) { node.replaceChildren(...Object.entries(vars).map(([k, v]) => el('div', { class: 'tgm-kotak' }, el('span', null, k), el('b', null, v)))); } };
}

function cardsView(rules) {
  const cards = rules.map((r, i) => el('div', { class: 'tgm-kartu' }, el('b', { class: 'tgm-no' }, i + 1),
    el('div', null, el('span', { class: 'tgm-ketika' }, 'KETIKA '), EVENTS[r.when]), el('div', null, el('span', { class: 'tgm-maka' }, 'MAKA '), r.acts.map((a) => ACTIONS[a]).join(', '))));
  const node = el('div', { class: 'tgm-kartu-kartu' }, ...cards);
  return {
    node,
    light(list) {
      cards.forEach((c) => c.classList.remove('nyala'));
      list.forEach((i) => { const c = cards[i]; if (c) { void c.offsetWidth; c.classList.add('nyala'); } });
    },
  };
}

function seqTable(seq, rows) {
  const trs = seq.map((e, i) => el('tr', null, el('td', null, i === 0 ? '' : `K${i}`), el('td', null, evText(e)), el('td', { class: 'tgm-apa' }), el('td', null), el('td', null)));
  const node = el('div', { class: 'tgm-tabel-tempat' }, el('table', { class: 'tgm-tabel' },
    el('thead', null, el('tr', null, el('th', null, ''), el('th', null, 'Kejadian'), el('th', null, 'Apa yang terjadi'), el('th', null, 'Lajur'), el('th', null, rows))), el('tbody', null, ...trs)));
  return {
    node,
    fill(i, t) {
      trs.forEach((tr) => tr.classList.remove('nyala'));
      const tr = trs[i]; tr.classList.add('nyala');
      tr.children[2].textContent = t.what;
      tr.children[3].textContent = t.lajur ?? '–';
      tr.children[4].textContent = Object.values(t.vars).join(' · ');
      tr.scrollIntoView?.({ block: 'nearest' });
    },
  };
}

// Plays a sequence with its table, lanes, variables and cards.
function playSeq(parts, rules, seq, { speed = 450, done } = {}) {
  const tr = trace(rules, seq);
  let i = 0, t = null;
  const tick = () => {
    if (i >= tr.length) { done?.(tr); return; }
    const s = tr[i];
    if (s.e.type === 'jatuh') parts.lanes.drop(s.e.kind, s.e.lane, speed);
    parts.lanes.show(s); parts.vars.show(s.vars); parts.cards.light(s.fired); parts.table.fill(i, s);
    i++;
    t = setTimeout(tick, speed);
  };
  tick();
  return () => clearTimeout(t);
}

const opts = (right, wrongs) => [right, ...wrongs].map((x, i) => ({ label: String(x), correct: i === 0 }));
const T2 = trace(KELAS6, SEQ2), T3 = trace(DIKA, SEQ3);

// Worksheet questions in order.
const PLAN = [
  { rules: KELAS6, prompt: 'Soal 1a. Kejadian mana yang dipicu oleh pemain?', opts: opts(EVENTS.kiri, [EVENTS.matang, EVENTS.mulai, EVENTS['busuk=3']]) },
  { rules: KELAS6, prompt: 'Soal 1b. Kejadian mana yang tidak dipicu oleh pemain?', opts: opts(EVENTS['busuk=3'], [EVENTS.kanan, EVENTS.kiri]) },
  { rules: KELAS6, seq: SEQ2, upto: 1, prompt: 'Soal 2. K1: 🥭 jatuh di lajur 3. Apa yang terjadi?', opts: opts('tertangkap, skor menjadi 1', ['lewat, skor tetap 0', 'busuk menjadi 1']) },
  { rules: KELAS6, seq: SEQ2, upto: 4, prompt: 'Sesudah K4, berapa skor dan busuk?', opts: opts(`skor ${T2[4].vars.skor}, busuk ${T2[4].vars.busuk}`, ['skor 3, busuk 1', 'skor 2, busuk 0', 'skor 1, busuk 1']) },
  { rules: KELAS6, seq: SEQ2, upto: 7, prompt: 'K7: 🥭 jatuh di lajur 5 saat keranjang di lajur 4. Apa yang terjadi?', opts: opts('lewat, skor tetap', ['tertangkap', 'keranjang pindah ke lajur 5']) },
  { rules: KELAS6, seq: SEQ2, upto: 10, prompt: 'Pada K10 keranjang tidak berpindah. Aturan mana penyebabnya?', opts: opts('aturan 3 (lajur keranjang sudah 5)', ['aturan 2', 'aturan 6', 'aturan 4']) },
  { rules: KELAS6, seq: SEQ2, prompt: 'Skor akhir dan kapan permainan selesai?', opts: opts(`skor ${T2.at(-1).vars.skor}, selesai di K12`, ['skor 4, selesai di K13', 'skor 3, selesai di K13', 'skor 2, selesai di K12']) },
  { rules: DIKA, seq: SEQ3, upto: 3, prompt: 'Soal 3. Permainan Dika: sesudah tombol ▶ ketiga, keranjang di lajur berapa?', nums: [4, 5, 6], ans: T3[3].lajur },
  { rules: DIKA, seq: SEQ3, upto: 3, prompt: 'Apa yang dilihat pemain?', opts: opts('keranjangnya menghilang dari layar', ['keranjang berhenti di lajur 5', 'permainan selesai']) },
  { rules: DIKA, seq: SEQ3, prompt: 'Berapa busuk di akhir, dan apakah permainan selesai?', opts: opts(`busuk ${T3.at(-1).vars.busuk}, permainan tidak selesai`, ['busuk 3, permainan selesai', 'busuk 4, permainan selesai']) },
  { rules: DIKA, seq: SEQ3, prompt: 'Aturan apa yang perlu ditambahkan Dika?', opts: opts('JIKA batas pada kedua tombol, dan aturan 6 (busuk = 3)', ['aturan 4 saja', 'aturan permainan dimulai']) },
  { rules: KELAS6, prompt: 'Soal 4. Kartu aturan baru mana yang benar bentuknya?',
    opts: opts('KETIKA mangga emas menyentuh keranjang MAKA TAMBAH skor 5', ['KETIKA TAMBAH skor 5 MAKA mangga emas menyentuh keranjang', 'KETIKA skor MAKA 10']) },
];

function round(wrap, ctx, p, next) {
  const cards = cardsView(p.rules);
  let parts = null, stop = null;
  const blocks = [cards.node];
  if (p.seq) {
    const seq = p.upto !== undefined ? p.seq.slice(0, p.upto + 1) : p.seq;
    parts = { cards, lanes: lanesView(), vars: varsView(), table: seqTable(seq, 'Skor · Busuk'), seq };
    blocks.push(el('div', { class: 'tgm-kanan' }, parts.table.node, el('div', { class: 'row' }, parts.lanes.node, parts.vars.node)));
    // Show the state just before the asked event.
    const tr = trace(p.rules, seq);
    tr.slice(0, -1).forEach((s, i) => parts.table.fill(i, s));
    const last = tr.at(-2);
    if (last) { parts.lanes.show(last); parts.vars.show(last.vars); }
  }
  const subject = el('div', { class: 'tgm-soal' }, ...blocks);
  const after = () => {
    if (!parts) { setTimeout(next, 500); return; }
    stop = playSeq(parts, p.rules, parts.seq, { speed: 220, done: () => setTimeout(next, 900) });
  };
  const options = p.nums ? p.nums.map((v) => ({ label: String(v), correct: v === p.ans })) : ctx.rand.shuffle(p.opts);
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns: p.nums ? 3 : 1, options });
  return () => stop?.();
}

export default {
  id: 'sdl-24-tangkap-mangga',
  title: 'Permainan Tangkap Mangga',
  topic: 'Kejadian dan aturan permainan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🥭',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan permainan dari kartu aturan KETIKA … MAKA … dengan tabel skor, menemukan aturan yang hilang, dan membuat aturan baru beserta urutan kejadian untuk mengujinya.',
  extraModes: [
    { id: 'main', icon: '🎮', label: 'Susun dan Main', desc: 'Susun kartu aturan, lalu mainkan dengan tombol ◀ ▶', create: createPlay },
    { id: 'langkah', icon: '⏭', label: 'Kejadian Satu per Satu', desc: 'Putar urutan kejadian soal 2 dan 3 dengan tombol Langkah', create: createSteps },
    { id: 'giliran', icon: '🧺', label: 'Main Bergiliran', desc: 'Dua tim bermain dengan aturan dan urutan mangga yang sama', create: createTurns },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tangkap-mangga' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

// Rule card editor: tap the event or an action to change it.
function rulesEditor(ctx, start) {
  const rules = structuredClone(start);
  const node = el('div', { class: 'tgm-kartu-kartu edit' });
  const evKeys = Object.keys(EVENTS), actKeys = Object.keys(ACTIONS);
  let locked = false;
  const draw = () => {
    node.replaceChildren(...rules.map((r, i) => el('div', { class: 'tgm-kartu' }, el('b', { class: 'tgm-no' }, i + 1),
      el('div', null, el('span', { class: 'tgm-ketika' }, 'KETIKA '), onTap(el('button', { class: 'tgm-pilih', type: 'button' }, EVENTS[r.when], ' ▾'), () => { if (!locked) { r.when = cycle(evKeys, r.when); ctx.sound.tap(); draw(); } })),
      el('div', { class: 'tgm-aksi' }, el('span', { class: 'tgm-maka' }, 'MAKA '),
        ...r.acts.map((a, j) => onTap(el('button', { class: 'tgm-pilih aksi', type: 'button' }, ACTIONS[a], ' ▾'), () => { if (!locked) { r.acts[j] = cycle(actKeys, a); ctx.sound.tap(); draw(); } })),
        onTap(el('button', { class: 'tgm-kecil', type: 'button' }, '+'), () => { if (!locked && r.acts.length < 4) { r.acts.push('tambah:skor:1'); draw(); } }),
        r.acts.length > 1 ? onTap(el('button', { class: 'tgm-kecil', type: 'button' }, '−'), () => { if (!locked) { r.acts.pop(); draw(); } }) : null,
        onTap(el('button', { class: 'tgm-kecil hapus', type: 'button', 'aria-label': 'hapus kartu' }, '✕'), () => { if (!locked) { rules.splice(i, 1); draw(); } })))));
  };
  draw();
  return {
    node, rules,
    set(list) { rules.splice(0, rules.length, ...structuredClone(list)); draw(); },
    add() { if (rules.length >= 9) { shake(node); return; } rules.push(R('emas', 'tambah:skor:5')); draw(); },
    lock(v) { locked = v; node.classList.toggle('kunci', v); },
  };
}

// A real-time game from rule cards. Mangoes come from `next()`.
function liveGame(ctx, rules, { next, count = 20, speed = 1500, onEnd } = {}) {
  const game = makeGame(rules);
  const lanes = lanesView(), vars = varsView(), cards = cardsView(rules);
  const left = onTap(el('button', { class: 'tgm-tombol', type: 'button', 'aria-label': 'kiri' }, '◀'), () => press('kiri'));
  const right = onTap(el('button', { class: 'tgm-tombol', type: 'button', 'aria-label': 'kanan' }, '▶'), () => press('kanan'));
  const sisa = el('div', { class: 'tgm-sisa' });
  const node = el('div', { class: 'tgm-main' }, el('div', { class: 'tgm-kolom' }, el('div', { class: 'row' }, left, lanes.node, right), el('div', { class: 'row' }, vars.node, sisa)), cards.node);
  let timer = null, n = 0, ended = false;
  const show = (r) => { lanes.show(game.st); vars.show(game.st.vars); if (r) cards.light(r.fired); };
  const press = (type) => { if (ended) return; ctx.sound.tap(); show(game.emit({ type })); };
  const end = () => { if (ended) return; ended = true; clearTimeout(timer); onEnd?.(game.st); };
  const spawn = () => {
    if (game.st.over || n >= count) { end(); return; }
    n++; sisa.textContent = `Mangga ${n}/${count}`;
    const m = next();
    lanes.drop(m.kind, m.lane, speed * 0.9);
    timer = setTimeout(() => {
      const r = game.emit({ type: 'jatuh', ...m });
      if (r.what.includes('tertangkap')) (m.kind === 'busuk' ? ctx.sound.bad : ctx.sound.good)();
      show(r);
      timer = setTimeout(spawn, speed * 0.2);
    }, speed * 0.9);
  };
  show(game.emit({ type: 'mulai' }));
  timer = setTimeout(spawn, 600);
  return { node, stop() { ended = true; clearTimeout(timer); }, st: game.st };
}

const mangoMaker = (rand) => () => {
  const x = rand.next();
  return { kind: x < 0.65 ? 'matang' : x < 0.9 ? 'busuk' : 'emas', lane: 1 + Math.floor(rand.next() * 5) };
};
const summary = (st) => `${st.msg ? `${st.msg}. ` : ''}${Object.entries(st.vars).map(([k, v]) => `${k} ${v}`).join(', ')}.`;

function createPlay(root, ctx) {
  const wrap = el('div', { class: 'act tangkap-mangga' });
  root.append(wrap);
  let game = null;
  const editor = rulesEditor(ctx, KELAS6);
  const area = el('div');
  const info = el('p', { class: 'tgm-info' });
  const edit = () => {
    game?.stop(); game = null; editor.lock(false);
    area.replaceChildren(editor.node, el('div', { class: 'row' },
      el('span', { class: 'label' }, 'Contoh'), button('Kartu kelas 6', () => editor.set(KELAS6), 'small'), button('Aturan Dika', () => editor.set(DIKA), 'small'),
      button('Dengan nyawa', () => editor.set(NYAWA), 'small'), button('+ Kartu', () => editor.add(), 'small'), button('▶ Main', play, 'primary')));
    info.textContent = '';
  };
  const play = () => {
    game = liveGame(ctx, editor.rules, {
      next: mangoMaker(ctx.rand),
      onEnd: (st) => { info.textContent = `Permainan berakhir. ${summary(st)}`; ctx.sound.win(); },
    });
    area.replaceChildren(game.node, el('div', { class: 'row' }, button('✏️ Ubah aturan', edit, 'small')));
  };
  edit();
  wrap.append(el('p', { class: 'prompt' }, 'Ketuk kejadian atau aksi pada kartu untuk mengubahnya, lalu main.'), area, info);
  return { destroy() { game?.stop(); } };
}

function createSteps(root, ctx) {
  const wrap = el('div', { class: 'act tangkap-mangga' });
  root.append(wrap);
  const SETS = {
    s2: { label: 'Soal 2 (kartu kelas 6)', rules: KELAS6, seq: SEQ2 },
    s3: { label: 'Soal 3 (aturan Dika)', rules: DIKA, seq: SEQ3 },
    s4: { label: 'Tantangan (nyawa)', rules: NYAWA, seq: SEQ2 },
  };
  const holder = el('div');
  const pick = (k) => {
    const set = SETS[k];
    const cards = cardsView(set.rules);
    const parts = { cards, lanes: lanesView(), vars: varsView(), table: seqTable(set.seq, 'Variabel') };
    const tr = trace(set.rules, set.seq);
    let i = 0;
    const step = button('Langkah ⏭', () => {
      if (i >= tr.length) { shake(step); return; }
      const s = tr[i];
      if (s.e.type === 'jatuh') parts.lanes.drop(s.e.kind, s.e.lane, 600);
      parts.lanes.show(s); parts.vars.show(s.vars); cards.light(s.fired); parts.table.fill(i, s);
      ctx.sound.tap(); i++;
    }, 'primary');
    holder.replaceChildren(el('div', { class: 'tgm-soal' }, cards.node, el('div', { class: 'tgm-kanan' }, parts.table.node, el('div', { class: 'row' }, parts.lanes.node, parts.vars.node), step)));
    tabs.querySelectorAll('.btn').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
  };
  const tabs = el('div', { class: 'row' }, Object.entries(SETS).map(([k, s]) => { const b = button(s.label, () => pick(k), 'small'); b.dataset.k = k; return b; }));
  pick('s2');
  wrap.append(el('p', { class: 'prompt' }, 'Tekan Langkah untuk menjalankan kejadian satu per satu, lalu cocokkan dengan tabel di lembar kerja.'), tabs, holder);
}

// Bergiliran: both teams play the same rules and the same mangoes.
function createTurns(root, ctx) {
  const wrap = el('div', { class: 'act tangkap-mangga' });
  root.append(wrap);
  let game = null;
  const scores = [];
  const seq = Array.from({ length: 20 }, mangoMaker(ctx.rand));
  const info = el('p', { class: 'tgm-info' });
  const area = el('div');
  const turn = (t) => {
    let k = 0;
    area.replaceChildren(el('p', { class: 'prompt' }, `Tim ${t + 1} siap? Mangga jatuh dengan urutan yang sama untuk kedua tim.`), button(`▶ Tim ${t + 1} mulai`, () => {
      game = liveGame(ctx, KELAS6, {
        next: () => seq[k++],
        onEnd: (st) => {
          scores[t] = st.vars.skor ?? 0;
          info.textContent = `Tim ${t + 1}: ${summary(st)}`;
          if (t === 0) area.append(button('Giliran Tim 2 ▶', () => turn(1), 'primary'));
          else {
            const win = scores[0] === scores[1] ? 'Seri!' : `Tim ${scores[0] > scores[1] ? 1 : 2} menang!`;
            info.textContent = `Skor Tim 1: ${scores[0]} · Tim 2: ${scores[1]}. ${win}`;
            ctx.sound.win();
            area.append(button('🔁 Main lagi', () => { scores.length = 0; turn(0); }, 'primary'));
          }
        },
      });
      area.replaceChildren(el('p', { class: 'label' }, `Tim ${t + 1} bermain`), game.node);
    }, 'primary'));
  };
  turn(0);
  wrap.append(area, info);
  return { destroy() { game?.stop(); } };
}
