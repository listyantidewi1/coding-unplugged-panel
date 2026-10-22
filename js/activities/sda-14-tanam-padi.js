// Robot Penanam Padi — SD Awal (7–9 tahun), perulangan dengan ULANGI.
// A rice-planting robot starts on the pematang left of plot 1, facing right.
// Cards: MAJU, TANAM, BELOK KANAN and ULANGI n KALI ( … ).

import { el, onTap, button, choice, shake } from '../core/kit.js';

const CARD = {
  M: { icon: '➡️', label: 'MAJU' },
  T: { icon: '🌱', label: 'TANAM' },
  K: { icon: '↪️', label: 'BELOK KANAN' },
};
// Facing: 0 right, 1 down, 2 left, 3 up (turning right adds 1).
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const FACE = ['➡️', '⬇️', '⬅️', '⬆️'];
const FIELDS = {
  s1: { label: 'Sawah 1', cols: 6, rows: 1 },
  s2: { label: 'Sawah 2', cols: 8, rows: 1 },
  dua: { label: 'Sawah dua baris', cols: 4, rows: 2 },
};

// A program is a list of items: 'M' | 'T' | 'K' | { n, body: [...] }.
const L = (n, ...body) => ({ n, body });
export const countCards = (prog) => prog.reduce((s, c) => s + (typeof c === 'string' ? 1 : 1 + countCards(c.body)), 0);

// Runs a program. Column 0 is the pematang (row A only), plots are 1..cols.
// Returns every step (for the animation) and the seeds in each plot.
export function runProgram(prog, field) {
  const st = { x: 0, y: 0, d: 0, seeds: {}, pematang: 0, steps: [], error: null };
  const exec = (items, path) => {
    for (let i = 0; i < items.length && !st.error; i++) {
      const c = items[i];
      const p = [...path, i];
      if (typeof c !== 'string') {
        for (let k = 0; k < c.n && !st.error; k++) exec(c.body, p);
        continue;
      }
      if (c === 'M') {
        const nx = st.x + DIRS[st.d][0], ny = st.y + DIRS[st.d][1];
        const onPematang = nx === 0 && ny === 0;
        if (nx < 0 || ny < 0 || ny >= field.rows || nx > field.cols || (nx === 0 && !onPematang)) {
          st.error = 'Robot akan keluar dari sawah, jadi robot berhenti.';
          st.steps.push({ ...pos(st), path: p, error: st.error });
          return;
        }
        st.x = nx; st.y = ny;
      } else if (c === 'K') st.d = (st.d + 1) % 4;
      else if (st.x === 0) st.pematang++;
      else { const k = `${st.x},${st.y}`; st.seeds[k] = (st.seeds[k] ?? 0) + 1; }
      st.steps.push({ ...pos(st), path: p, op: c });
    }
  };
  const pos = (s) => ({ x: s.x, y: s.y, d: s.d, seeds: { ...s.seeds }, pematang: s.pematang });
  exec(prog, []);
  const total = Object.values(st.seeds).reduce((a, b) => a + b, 0);
  const empty = [];
  for (let y = 0; y < field.rows; y++) for (let x = 1; x <= field.cols; x++) if (!st.seeds[`${x},${y}`]) empty.push([x, y]);
  return { ...st, total, empty };
}
const plotName = (field, [x, y]) => (field.rows > 1 ? `${'AB'[y]}${x}` : String(x));

// The field drawing. `show(step)` puts the robot and seeds of one step.
function fieldView(field) {
  const cells = {};
  const grid = el('div', { class: 'tp-sawah', style: { '--cols': field.cols + 1 } });
  grid.append(el('span', { class: 'tp-kepala' }, field.rows > 1 ? '' : 'pematang'),
    ...Array.from({ length: field.cols }, (_, i) => el('span', { class: 'tp-kepala' }, i + 1)));
  for (let y = 0; y < field.rows; y++) {
    for (let x = 0; x <= field.cols; x++) {
      const isPem = x === 0;
      const c = el('span', { class: `tp-petak${isPem ? ' tp-pematang' : ''}${isPem && y > 0 ? ' tp-luar' : ''}` });
      if (isPem && field.rows > 1) c.dataset.baris = 'AB'[y];
      cells[`${x},${y}`] = c;
      grid.append(c);
    }
  }
  const show = (s) => {
    Object.entries(cells).forEach(([k, c]) => {
      const [x, y] = k.split(',').map(Number);
      const n = x === 0 && y === 0 ? s.pematang : (s.seeds[k] ?? 0);
      const parts = [];
      if (field.rows > 1 && x === 0) parts.push(el('b', { class: 'tp-baris' }, 'AB'[y]));
      if (n) parts.push(el('span', { class: `tp-bibit${x === 0 ? ' jatuh' : ''}` }, n > 1 ? `🌱×${n}` : '🌱'));
      if (s.x === x && s.y === y) parts.push(el('span', { class: 'tp-robot' }, '🤖', el('small', null, FACE[s.d])));
      c.replaceChildren(...parts);
      c.classList.remove('kedip');
    });
  };
  show({ x: 0, y: 0, d: 0, seeds: {}, pematang: 0 });
  return { node: grid, show, cells };
}

// Animates a run on a field view; `onStep(step)` highlights the card.
function play(view, field, result, { onStep, done, speed = 420 } = {}) {
  let i = 0, t = null;
  const tick = () => {
    if (i >= result.steps.length) {
      result.empty.forEach((p) => view.cells[p.join(',')].classList.add('kedip'));
      done?.(); return;
    }
    const s = result.steps[i++];
    view.show(s);
    onStep?.(s);
    t = setTimeout(tick, speed);
  };
  view.show({ x: 0, y: 0, d: 0, seeds: {}, pematang: 0 });
  t = setTimeout(tick, 250);
  return () => clearTimeout(t);
}

// Program text, for questions: ULANGI 4 KALI ( ➡️ 🌱 🌱 ).
function progText(prog) {
  return prog.map((c) => (typeof c === 'string' ? CARD[c].icon : `ULANGI ${c.n} KALI ( ${progText(c.body)} )`)).join(', ');
}
const progNode = (prog) => el('div', { class: 'tp-prog-teks' }, progText(prog));

const LONG = Array.from({ length: 6 }, () => ['M', 'T']).flat();
const Q5 = [L(4, 'M', 'T'), 'K', 'M', 'K', 'T', L(3, 'M', 'T')];

// Worksheet questions 1–5, in order. After a right answer the field plays
// the program so the class sees why.
const PLAN = [
  { f: 's1', prog: LONG, prompt: 'Program panjang tanpa ULANGI untuk Sawah 1 ini. Berapa kartunya?', opts: [6, 8, 12, 14], ans: 12 },
  { f: 's1', prompt: 'Program singkat mana yang sama dengan program panjang tadi?', subject: () => progNode(LONG),
    progOpts: [[L(6, 'M', 'T')], [L(6, 'T', 'M')], [L(12, 'M', 'T')], [L(3, 'M', 'T')]], playAns: [L(6, 'M', 'T')] },
  { f: 's1', prog: [L(6, 'M', 'T')], prompt: 'Berapa kartu program singkat ini? Kartu ULANGI dihitung satu.', opts: [2, 3, 4, 7], ans: 3 },
  { f: 's1', prog: [L(4, 'M', 'T', 'T')], prompt: 'Jalankan di Sawah 1. Berapa bibit yang ditanam?', opts: [4, 6, 8, 12], ans: 8 },
  { f: 's1', prog: [L(3, 'M', 'M', 'T')], prompt: 'Petak mana saja yang ditanami?', opts: ['1, 3, 5', '2, 4, 6', '1, 2, 3', '3 dan 6'], ans: '2, 4, 6' },
  { f: 's2', prog: [L(7, 'M', 'T')], prompt: 'Program Raka untuk Sawah 2. Petak nomor berapa yang tidak ditanami?', opts: ['1', '7', '8', 'tidak ada'], ans: '8' },
  { f: 's2', prog: [L(7, 'M', 'T')], prompt: 'Perbaiki program Raka: ULANGI berapa KALI ( ➡️ 🌱 )?', opts: [6, 7, 8, 9], ans: 8, playAns: [L(8, 'M', 'T')] },
  { f: 's2', prog: [L(8, 'T', 'M')], prompt: 'Program Sari: ULANGI 8 KALI ( 🌱 ➡️ ). Bibit pertama ditanam di mana?', opts: ['di pematang', 'di petak 1'], ans: 'di pematang' },
  { f: 's2', prog: [L(8, 'T', 'M')], prompt: 'Bagaimana memperbaiki program Sari?', opts: ['tukar urutan kartu menjadi ( ➡️ 🌱 )', 'ganti angkanya menjadi 9', 'tambah satu ➡️ di akhir'], ans: 'tukar urutan kartu menjadi ( ➡️ 🌱 )', playAns: [L(8, 'M', 'T')] },
  { f: 'dua', prog: Q5, prompt: 'Tantangan sawah dua baris. Berapa bibit seluruhnya?', opts: [6, 7, 8, 9], ans: 8 },
  { f: 'dua', prog: Q5, prompt: 'Di akhir program, robot menghadap ke mana?', opts: ['➡️ kanan', '⬇️ bawah', '⬅️ kiri', '⬆️ atas'], ans: '⬅️ kiri' },
];

function round(wrap, ctx, p, next) {
  const field = FIELDS[p.f];
  const view = fieldView(field);
  const subject = el('div', { class: 'tp-soal' }, p.subject ? p.subject() : progNode(p.prog), view.node);
  const after = () => {
    const prog = p.playAns ?? p.prog;
    play(view, field, runProgram(prog, field), { speed: 260, done: next });
  };
  let options;
  if (p.progOpts) {
    options = p.progOpts.map((prog, i) => ({ label: progText(prog), correct: i === 0 }));
    options = ctx.rand.shuffle(options);
  } else options = p.opts.map((o) => ({ label: String(o), correct: o === p.ans }));
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns: options.length > 3 && options.every((o) => o.label.length < 14) ? 4 : options.length > 3 ? 2 : options.length, options });
}

export default {
  id: 'sda-14-tanam-padi',
  title: 'Robot Penanam Padi',
  topic: 'Perulangan',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🌾',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menulis program robot dengan kartu MAJU, TANAM, dan BELOK KANAN, meringkasnya dengan ULANGI, menghitung bibit, dan memperbaiki program yang melewatkan petak.',
  extraModes: [
    { id: 'program', icon: '🤖', label: 'Papan Program', desc: 'Pilih sawah, susun kartu, dan jalankan robotnya', create: createBoard },
    { id: 'tebak', icon: '🔎', label: 'Tebak Petak Terlewat', desc: 'Satu tim menulis program berkesalahan, tim lain menebak petak kosong', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tanam-padi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// Program board: cards go into the main program, or into the ULANGI bracket
// that is open. Tapping a card in the program removes it.
function programBoard(ctx, { onChange } = {}) {
  const prog = [];
  let open = null; // the ULANGI item that takes new cards
  let locked = false;
  const list = el('div', { class: 'tp-program' });
  const count = el('div', { class: 'tp-hitung' });
  const draw = () => {
    const card = (c, owner, i, path) => {
      if (typeof c === 'string') {
        return onTap(el('button', { class: 'tp-kartu', type: 'button', 'data-path': path.join('.') }, el('span', null, CARD[c].icon), el('small', null, CARD[c].label)), () => {
          if (locked) return;
          owner.splice(i, 1); draw();
        });
      }
      const minus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'kurangi' }, '−'), () => { if (!locked) { c.n = Math.max(1, c.n - 1); draw(); } });
      const plus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'tambah' }, '+'), () => { if (!locked) { c.n = Math.min(9, c.n + 1); draw(); } });
      const del = onTap(el('button', { class: 'tp-hapus', type: 'button', 'aria-label': 'hapus ULANGI' }, '✕'), () => {
        if (locked) return;
        owner.splice(i, 1); if (open === c) open = null; draw();
      });
      const box = el('div', { class: `tp-ulangi${open === c ? ' buka' : ''}`, 'data-path': path.join('.') },
        el('b', null, 'ULANGI'), minus, el('b', { class: 'tp-n' }, c.n), plus, el('b', null, 'KALI ('),
        ...c.body.map((x, j) => card(x, c.body, j, [...path, j])),
        c.body.length ? null : el('span', { class: 'tp-kosong' }, '…'),
        el('b', null, ')'), del);
      box.addEventListener('click', (e) => { if (e.target === box && !locked) { open = c; draw(); } });
      return box;
    };
    list.replaceChildren(...(prog.length ? prog.map((c, i) => card(c, prog, i, [i])) : [el('span', { class: 'tp-kosong' }, 'Ketuk kartu di bawah untuk menyusun program.')]));
    count.textContent = `Banyak kartu: ${countCards(prog)}`;
    closeBtn.disabled = !open;
    onChange?.(prog);
  };
  const add = (c) => {
    if (locked) return;
    if (countCards(prog) >= 24) { shake(list); return; }
    (open ? open.body : prog).push(c);
    ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'tp-palet' },
    ...['M', 'T', 'K'].map((c) => onTap(el('button', { class: 'tp-kartu', type: 'button', 'data-c': c }, el('span', null, CARD[c].icon), el('small', null, CARD[c].label)), () => add(c))),
    onTap(el('button', { class: 'tp-kartu ulangi', type: 'button', 'data-c': 'U' }, el('span', null, '🔁'), el('small', null, 'ULANGI')), () => {
      if (locked || open) { shake(list); return; }
      const loop = L(2);
      prog.push(loop); open = loop; draw();
    }));
  const closeBtn = button('Tutup kurung )', () => { open = null; draw(); }, 'small');
  draw();
  return {
    node: el('div', { class: 'tp-papan' }, list, el('div', { class: 'row' }, palette, closeBtn), count),
    prog,
    set(items) { prog.splice(0, prog.length, ...structuredClone(items)); open = null; draw(); },
    clear() { prog.length = 0; open = null; draw(); },
    lock(v) { locked = v; },
    // Lights the card that is running.
    light(path) {
      list.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
      for (let k = 1; k <= path.length; k++) list.querySelector(`[data-path="${path.slice(0, k).join('.')}"]`)?.classList.add('nyala');
    },
  };
}

function report(field, r) {
  const parts = [`🌱 ${r.total} bibit di sawah.`];
  if (r.pematang) parts.push(`⚠️ ${r.pematang} bibit jatuh di pematang.`);
  parts.push(r.empty.length ? `Petak kosong: ${r.empty.map((p) => plotName(field, p)).join(', ')}.` : 'Semua petak ditanami!');
  if (r.error) parts.push(`⛔ ${r.error}`);
  return parts.join(' ');
}

function createBoard(root, ctx) {
  const wrap = el('div', { class: 'act tanam-padi' });
  root.append(wrap);
  let fieldKey = 's1';
  let stop = null;
  const holder = el('div', { class: 'tp-tempat' });
  const info = el('p', { class: 'tp-info' });
  const counter = el('div', { class: 'tp-counter' }, '🌱 0');
  const board = programBoard(ctx);
  let view;
  const pickField = (k) => {
    stop?.(); fieldKey = k;
    view = fieldView(FIELDS[k]);
    holder.replaceChildren(view.node);
    tabs.querySelectorAll('.btn').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
    info.textContent = ''; counter.textContent = '🌱 0';
  };
  const tabs = el('div', { class: 'row' }, Object.entries(FIELDS).map(([k, f]) => {
    const b = button(f.label, () => pickField(k), 'small');
    b.dataset.k = k;
    return b;
  }));
  const go = button('▶ Jalankan', () => {
    if (!board.prog.length) { shake(board.node); return; }
    stop?.();
    const field = FIELDS[fieldKey];
    const r = runProgram(board.prog, field);
    board.lock(true); info.textContent = '';
    stop = play(view, field, r, {
      onStep: (s) => { board.light(s.path); counter.textContent = `🌱 ${Object.values(s.seeds).reduce((a, b) => a + b, 0)}${s.pematang ? ` · pematang ${s.pematang}` : ''}`; },
      done: () => {
        board.lock(false); board.light([]);
        info.textContent = report(field, r);
        if (!r.empty.length && !r.pematang && !r.error) ctx.sound.win(); else ctx.sound.bad();
      },
    });
  }, 'primary');
  pickField('s1');
  wrap.append(el('p', { class: 'prompt' }, 'Pilih sawah, susun kartu, lalu jalankan robotnya.'), tabs,
    el('div', { class: 'tp-atas' }, holder, counter), board.node,
    el('div', { class: 'row' }, go, button('Contoh: ULANGI 6 KALI ( ➡️ 🌱 )', () => board.set([L(6, 'M', 'T')]), 'small'), button('Kosongkan', () => board.clear(), 'small')), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A writes a program with one mistake; team B taps the
// plots they think stay empty, then the robot runs.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act tanam-padi' });
  root.append(wrap);
  let turn = 0;
  const score = [0, 0];
  function start() {
    const a = turn % 2, b = 1 - a;
    const field = FIELDS.s2;
    const board = programBoard(ctx);
    board.set([L(7, 'M', 'T')]);
    const view = fieldView(field);
    const lockBtn = button('Program siap ▶', () => {
      if (!board.prog.length) { shake(board.node); return; }
      board.lock(true);
      lockBtn.remove();
      head.textContent = `Tim ${b + 1}: ketuk petak yang menurutmu tidak ditanami, lalu jalankan.`;
      const guess = new Set();
      Object.entries(view.cells).forEach(([k, c]) => {
        if (k.startsWith('0,')) return;
        c.classList.add('tp-pilih');
        c.addEventListener('click', () => { if (guess.has(k)) guess.delete(k); else guess.add(k); c.classList.toggle('tebak', guess.has(k)); });
      });
      const run = button('▶ Jalankan', () => {
        run.remove();
        const r = runProgram(board.prog, field);
        const truth = new Set(r.empty.map((p) => p.join(',')));
        play(view, field, r, {
          onStep: (s) => board.light(s.path),
          done: () => {
            const right = [...guess].every((k) => truth.has(k)) && guess.size === truth.size;
            if (right) score[b]++;
            info.textContent = `${report(field, r)} ${right ? `✅ Tebakan Tim ${b + 1} tepat!` : `✗ Tebakan Tim ${b + 1} belum tepat.`} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            if (right) ctx.sound.win(); else ctx.sound.bad();
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.append(run);
    }, 'primary');
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: ubah program untuk Sawah 2 supaya ada satu kesalahan. Tim ${b + 1} boleh melihat programnya.`);
    const info = el('p', { class: 'tp-info' });
    wrap.replaceChildren(head, view.node, board.node, lockBtn, info);
  }
  start();
}
