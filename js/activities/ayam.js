// The chick map (4×4 yard, start A1, coop D4) is used by two worksheets:
//   paud-04-antar-ayam   — algoritma: susun panah agar anak ayam pulang
//   paud-08-ayam-tersesat — debugging: temukan satu panah yang salah

import { el, onTap, button, choice, shake } from '../core/kit.js';

const N = 4;
const START = [0, 0];
const HOME = [3, 3];
const ARROWS = {
  up: { icon: '⬆️', d: [0, 1] },
  right: { icon: '➡️', d: [1, 0] },
  down: { icon: '⬇️', d: [0, -1] },
  left: { icon: '⬅️', d: [-1, 0] },
};
const HAZARDS = { kucing: '🐱', kolam: '💧' };
const key = ([x, y]) => `${x},${y}`;
const cellName = ([x, y]) => `${'ABCD'[x]}${y + 1}`;

// Map from cell names, e.g. { B2: 'kucing', C3: 'kucing' }.
function makeMap(spec) {
  const hazards = new Map();
  for (const [name, kind] of Object.entries(spec)) {
    hazards.set(key(['ABCD'.indexOf(name[0]), Number(name[1]) - 1]), kind);
  }
  return { hazards };
}

// Walks the program; returns every position and how the walk ended.
function run(map, program) {
  let p = START;
  const path = [p];
  for (const a of program) {
    const [dx, dy] = ARROWS[a].d;
    p = [p[0] + dx, p[1] + dy];
    path.push(p);
    if (p[0] < 0 || p[1] < 0 || p[0] >= N || p[1] >= N) return { path, end: 'keluar' };
    const h = map.hazards.get(key(p));
    if (h) return { path, end: h };
  }
  return { path, end: key(p) === key(HOME) ? 'pulang' : 'belum' };
}

const MESSAGES = {
  pulang: 'Hore, anak ayam sampai di kandang! 🏠',
  kucing: 'Ups! Anak ayam bertemu kucing! 🐱',
  kolam: 'Byur! Anak ayam tercebur ke kolam! 💧',
  keluar: 'Ups! Anak ayam keluar dari halaman.',
  belum: 'Anak ayam belum sampai di kandang.',
};

// Shortest program from start to home avoiding hazards (breadth-first).
function shortest(map) {
  const prev = new Map([[key(START), null]]);
  const queue = [START];
  while (queue.length) {
    const p = queue.shift();
    if (key(p) === key(HOME)) break;
    for (const [name, { d }] of Object.entries(ARROWS)) {
      const q = [p[0] + d[0], p[1] + d[1]];
      if (q[0] < 0 || q[1] < 0 || q[0] >= N || q[1] >= N) continue;
      if (map.hazards.has(key(q)) || prev.has(key(q))) continue;
      prev.set(key(q), [p, name]);
      queue.push(q);
    }
  }
  if (!prev.has(key(HOME))) return null;
  const prog = [];
  for (let k = key(HOME); prev.get(k); k = key(prev.get(k)[0])) prog.unshift(prev.get(k)[1]);
  return prog;
}

function randomMap(rand, kinds) {
  for (;;) {
    const free = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      const k = key([x, y]);
      if (k !== key(START) && k !== key(HOME)) free.push([x, y]);
    }
    const spots = rand.shuffle(free).slice(0, kinds.length);
    const map = { hazards: new Map(spots.map((p, i) => [key(p), kinds[i]])) };
    const prog = shortest(map);
    // Keep maps where the hazards actually get in the way of the obvious route.
    if (prog && prog.length === 6 && spots.some(([x, y]) => x === 0 || y === 0 || x === 3 || y === 3 || x === y)) return map;
  }
}

// Board with the chick; `show(p)` moves the chick, `onCell` for editing.
function makeBoard(map, onCell) {
  const cells = new Map();
  const grid = el('div', { class: 'yard' });
  for (let y = N - 1; y >= 0; y--) {
    grid.append(el('div', { class: 'yard-label' }, y + 1));
    for (let x = 0; x < N; x++) {
      const c = el('div', { class: 'yard-cell', 'aria-label': cellName([x, y]) });
      if (onCell) onTap(c, () => onCell([x, y]));
      cells.set(key([x, y]), c);
      grid.append(c);
    }
  }
  grid.append(el('div'), ...'ABCD'.split('').map((l) => el('div', { class: 'yard-label' }, l)));
  const chick = el('span', { class: 'chick' }, '🐥');
  function draw() {
    for (const [k, c] of cells) {
      c.replaceChildren();
      const h = map.hazards.get(k);
      if (h) c.append(el('span', { class: 'yard-thing' }, HAZARDS[h]));
      if (k === key(HOME)) c.append(el('span', { class: 'yard-thing' }, '🏠'));
    }
  }
  function show(p, mood) {
    chick.remove();
    chick.className = `chick ${mood || ''}`;
    cells.get(key(p))?.append(chick);
  }
  draw();
  show(START);
  return { node: grid, show, draw };
}

// Animates a run; calls done(result) at the end.
function animate(board, result, done, speed = 450) {
  result.path.forEach((p, i) => setTimeout(() => board.show(p), i * speed));
  setTimeout(() => {
    const last = result.path[result.path.length - 1];
    board.show(result.end === 'keluar' ? result.path[result.path.length - 2] : last, result.end === 'pulang' ? 'happy' : 'sad');
    done(result);
  }, result.path.length * speed);
}

// Program editor: arrows palette, program strip, Jalan and Satu Langkah.
function programmer(wrap, map, ctx, { prompt, onResult, maxLen = 9 }) {
  const board = makeBoard(map, ctx.editCell);
  let program = [];
  let busy = false;
  let stepAt = 0;
  const msg = el('p', { class: 'reveal' });
  const strip = el('div', { class: 'prog' });
  function drawStrip() {
    strip.replaceChildren(...program.map((a, i) => onTap(el('button', { class: `prog-arrow ${i < stepAt ? 'done' : ''}`, type: 'button' }, ARROWS[a].icon), () => {
      if (busy) return;
      program.splice(i, 1);
      reset();
    })), ...Array.from({ length: Math.max(0, Math.min(maxLen, 6) - program.length) }, () => el('span', { class: 'prog-empty' })));
  }
  function reset() {
    stepAt = 0;
    msg.textContent = '';
    msg.className = 'reveal';
    board.show(START);
    drawStrip();
  }
  const palette = el('div', { class: 'arrow-pad' }, Object.entries(ARROWS).map(([name, a]) =>
    onTap(el('button', { class: 'arrow-btn', type: 'button', 'aria-label': name }, a.icon), () => {
      if (busy || program.length >= maxLen) return;
      program.push(name);
      ctx.sound.tap();
      reset();
    })));
  const go = button('▶ Jalan', () => {
    if (busy || !program.length) return;
    busy = true;
    stepAt = program.length;
    drawStrip();
    const result = run(map, program);
    animate(board, result, (r) => {
      msg.textContent = MESSAGES[r.end];
      msg.classList.toggle('bad', r.end !== 'pulang');
      busy = false;
      onResult(r, program.slice(), () => { setTimeout(reset, 1200); });
    });
  }, 'primary');
  const step = button('👣 Satu Langkah', () => {
    if (busy || !program.length) return;
    if (stepAt >= program.length) { reset(); return; }
    stepAt++;
    const r = run(map, program.slice(0, stepAt));
    board.show(r.path[r.path.length - 1]);
    drawStrip();
    if (r.end !== 'belum' || stepAt === program.length) {
      msg.textContent = MESSAGES[r.end];
      msg.classList.toggle('bad', r.end !== 'pulang');
      if (stepAt === program.length || r.end !== 'belum') onResult(r, program.slice(), () => setTimeout(reset, 1200));
    }
  });
  const clear = button('Hapus', () => { if (!busy) { program = []; reset(); } }, 'ghost');
  drawStrip();
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'yard-layout' }, board.node,
      el('div', { class: 'yard-side' }, el('div', { class: 'label' }, 'Program:'), strip, palette, el('div', { class: 'row' }, go, step, clear), msg)));
  return { board };
}

const WORKSHEET4 = makeMap({ B2: 'kucing', C3: 'kucing' });
const Q1 = ['right', 'right', 'right', 'up', 'up', 'up'];

export const paudAntarAyam = {
  id: 'paud-04-antar-ayam',
  title: 'Antar Anak Ayam Pulang',
  topic: 'Algoritma dan instruksi',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🐥',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Anak mengikuti dan menyusun urutan panah agar anak ayam sampai ke kandang tanpa melewati kucing.',
  extraModes: [{ id: 'pasangan', icon: '👫', label: 'Berpasangan', desc: 'Satu menyusun panah, satu menekan Satu Langkah. Ketuk kotak untuk memindah kucing.', create: createPair }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act ayam' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1300); };
      if (r === 0) {
        const board = makeBoard(WORKSHEET4);
        choice(wrap, {
          prompt: 'Ikuti panahnya dengan jarimu. Di mana anak ayam berhenti?',
          subject: el('div', { class: 'yard-layout' }, board.node, el('div', { class: 'prog big' }, Q1.map((a) => el('span', { class: 'prog-arrow' }, ARROWS[a].icon)))),
          ctx, columns: 2,
          onRight() { animate(board, run(WORKSHEET4, Q1), next); },
          options: [{ icon: '🏠', label: 'kandang', correct: true }, { icon: '🐱', label: 'kucing' }],
        });
        return;
      }
      const map = r === 1 ? WORKSHEET4 : randomMap(ctx.rand, ['kucing', 'kucing']);
      programmer(wrap, map, ctx, {
        prompt: r === 1 ? 'Susun panah supaya anak ayam pulang lewat jalan yang lain!' : 'Susun panah supaya anak ayam pulang. Jangan lewat kucing!',
        onResult(res, program, retry) {
          if (res.end === 'pulang' && !(r === 1 && program.join() === Q1.join())) { next(); return; }
          if (res.end === 'pulang') {
            wrap.querySelector('.reveal').textContent = 'Itu jalan yang tadi. Coba jalan yang lain!';
            retry();
            return;
          }
          ctx.mistake();
          shake(wrap.querySelector('.yard'));
          retry();
        },
      });
    }
    render();
  },
};

function createPair(root, ctx) {
  const wrap = el('div', { class: 'act ayam' });
  root.append(wrap);
  const map = makeMap({ B2: 'kucing', C3: 'kucing' });
  const pairCtx = {
    ...ctx,
    editCell(p) {
      const k = key(p);
      if (k === key(START) || k === key(HOME)) return;
      if (map.hazards.has(k)) map.hazards.delete(k); else map.hazards.set(k, 'kucing');
      ui.board.draw();
      ui.board.show(START);
    },
  };
  const ui = programmer(wrap, map, pairCtx, {
    prompt: 'Anak 1 menyusun panah. Anak 2 menekan "Satu Langkah". Lalu bertukar!',
    onResult(res, program, retry) {
      if (res.end === 'pulang') ctx.sound.win(); else ctx.sound.bad();
      retry();
    },
  });
}

// paud-08: the two worksheet bugs, then generated ones.
const WORKSHEET8 = makeMap({ B3: 'kolam', C2: 'kucing' });
const BUGS8 = [
  { program: ['up', 'up', 'right', 'right', 'right', 'right'], bug: 2 },
  { program: ['right', 'right', 'up', 'up', 'up', 'up'], bug: 2 },
];

function makeBug(rand) {
  for (;;) {
    const map = randomMap(rand, ['kucing', 'kolam']);
    const good = shortest(map);
    const i = rand.int(0, good.length - 1);
    const bad = good.slice();
    bad[i] = rand.pick(Object.keys(ARROWS).filter((a) => a !== good[i]));
    if (run(map, bad).end !== 'pulang') return { map, program: bad, bug: i };
  }
}

export const paudAyamTersesat = {
  id: 'paud-08-ayam-tersesat',
  title: 'Ups, Anak Ayam Tersesat',
  topic: 'Debugging',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🐛',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Anak menelusuri program panah langkah demi langkah, menemukan satu panah yang salah, dan memperbaikinya.',
  create(root, ctx) {
    const wrap = el('div', { class: 'act ayam' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1300); };
      const puzzle = r < BUGS8.length ? { map: WORKSHEET8, ...BUGS8[r] } : makeBug(ctx.rand);
      const program = puzzle.program.slice();
      const board = makeBoard(puzzle.map);
      const msg = el('p', { class: 'reveal' });
      let busy = false;
      let stepAt = 0;
      let picking = -1;
      const strip = el('div', { class: 'prog' });
      const picker = el('div', { class: 'arrow-pad' });
      function drawStrip() {
        strip.replaceChildren(...program.map((a, i) => onTap(el('button', {
          class: `prog-arrow numbered ${i < stepAt ? 'done' : ''} ${i === picking ? 'picking' : ''}`, type: 'button', 'data-n': i + 1,
        }, ARROWS[a].icon), () => {
          if (busy) return;
          picking = i;
          drawStrip();
          picker.hidden = false;
        })));
      }
      picker.append(...Object.entries(ARROWS).map(([name, a]) => onTap(el('button', { class: 'arrow-btn', type: 'button', 'aria-label': name }, a.icon), () => {
        if (picking < 0 || busy) return;
        const i = picking;
        const before = program[i];
        program[i] = name;
        picking = -1;
        picker.hidden = true;
        stepAt = 0;
        drawStrip();
        busy = true;
        const res = run(puzzle.map, program);
        animate(board, res, () => {
          busy = false;
          msg.textContent = MESSAGES[res.end];
          msg.classList.toggle('bad', res.end !== 'pulang');
          if (res.end === 'pulang') { next(); return; }
          ctx.mistake();
          program[i] = before;
          setTimeout(() => { board.show(START); drawStrip(); }, 1200);
        });
      })));
      picker.hidden = true;
      const go = button('▶ Jalan', () => {
        if (busy) return;
        busy = true;
        const res = run(puzzle.map, program);
        animate(board, res, () => {
          busy = false;
          msg.textContent = MESSAGES[res.end];
          msg.classList.toggle('bad', res.end !== 'pulang');
          setTimeout(() => board.show(START), 1200);
        });
      }, 'primary');
      const step = button('👣 Satu Langkah', () => {
        if (busy) return;
        if (stepAt >= program.length) { stepAt = 0; board.show(START); msg.textContent = ''; drawStrip(); return; }
        stepAt++;
        const res = run(puzzle.map, program.slice(0, stepAt));
        board.show(res.path[res.path.length - 1]);
        if (res.end !== 'belum') { msg.textContent = MESSAGES[res.end]; msg.classList.add('bad'); stepAt = program.length; }
        drawStrip();
      });
      drawStrip();
      wrap.append(
        el('p', { class: 'prompt' }, 'Ada satu panah yang salah. Telusuri, lalu ketuk panah itu dan pilih panah yang benar.'),
        el('div', { class: 'yard-layout' }, board.node,
          el('div', { class: 'yard-side' }, el('div', { class: 'label' }, 'Program teman:'), strip, picker, el('div', { class: 'row' }, go, step), msg)));
    }
    render();
  },
};
