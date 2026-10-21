// Grid maps walked by arrow programs. Columns are letters from the left,
// rows are numbers from the bottom, as on the worksheets. Used by the
// "peta kampung" activities (sda-03, sda-07).

import { el, onTap, button } from './util.js';

export const ARROWS = {
  up: { icon: '⬆️', d: [0, 1] },
  right: { icon: '➡️', d: [1, 0] },
  down: { icon: '⬇️', d: [0, -1] },
  left: { icon: '⬅️', d: [-1, 0] },
};
const LETTERS = 'ABCDEFGH';
export const key = ([x, y]) => `${x},${y}`;
export const cellName = ([x, y]) => `${LETTERS[x]}${y + 1}`;
export const cellAt = (name) => [LETTERS.indexOf(name[0]), Number(name.slice(1)) - 1];

// `blocks` maps a cell name to a kind in `kinds` ({icon, msg}); walking onto
// it ends the walk. `places` are passable cells with an icon and a label.
export function makeWorld({ cols, rows, blocks = {}, kinds, places = {}, walker }) {
  const blocked = new Map(Object.entries(blocks).map(([n, k]) => [key(cellAt(n)), k]));
  const placeAt = new Map(Object.entries(places).map(([n, p]) => [key(cellAt(n)), p]));
  const inside = ([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows;
  return {
    cols, rows, kinds, walker, blocked, placeAt, inside,
    // Walks `program` from `from`; `end` is 'sampai', 'belum', 'keluar' or a kind.
    run(program, from, to) {
      let p = from;
      const path = [p];
      for (const a of program) {
        const [dx, dy] = ARROWS[a].d;
        p = [p[0] + dx, p[1] + dy];
        path.push(p);
        if (!inside(p)) return { path, end: 'keluar' };
        const k = blocked.get(key(p));
        if (k) return { path, end: k };
      }
      return { path, end: to && key(p) === key(to) ? 'sampai' : 'belum' };
    },
    // Shortest arrow program between two cells (breadth-first), or null.
    shortest(from, to) {
      const prev = new Map([[key(from), null]]);
      const queue = [from];
      while (queue.length) {
        const p = queue.shift();
        if (key(p) === key(to)) break;
        for (const [name, { d }] of Object.entries(ARROWS)) {
          const q = [p[0] + d[0], p[1] + d[1]];
          if (!inside(q) || blocked.has(key(q)) || prev.has(key(q))) continue;
          prev.set(key(q), [p, name]);
          queue.push(q);
        }
      }
      if (!prev.has(key(to))) return null;
      const prog = [];
      for (let k = key(to); prev.get(k); k = key(prev.get(k)[0])) prog.unshift(prev.get(k)[1]);
      return prog;
    },
    free() {
      const cells = [];
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
        if (!blocked.has(key([x, y])) && !placeAt.has(key([x, y]))) cells.push([x, y]);
      }
      return cells;
    },
  };
}

// The board: labelled grid, things on it, and the walker. `marks` adds extra
// icons for one puzzle (e.g. a flag on the goal).
export function makeBoard(world, { onCell, marks = {} } = {}) {
  const cells = new Map();
  const grid = el('div', { class: 'peta', style: { '--cols': world.cols, '--rows': world.rows } });
  for (let y = world.rows - 1; y >= 0; y--) {
    grid.append(el('div', { class: 'peta-label' }, y + 1));
    for (let x = 0; x < world.cols; x++) {
      const c = el('div', { class: 'peta-cell', 'aria-label': cellName([x, y]) });
      if (onCell) onTap(c, () => onCell([x, y]));
      cells.set(key([x, y]), c);
      grid.append(c);
    }
  }
  grid.append(el('div'), ...LETTERS.slice(0, world.cols).split('').map((l) => el('div', { class: 'peta-label' }, l)));
  const walker = el('span', { class: 'walker' }, world.walker);
  const trail = new Set();
  function draw() {
    for (const [k, c] of cells) {
      c.replaceChildren();
      c.className = 'peta-cell';
      const b = world.blocked.get(k);
      if (b) { c.classList.add(`kind-${b}`); c.append(el('span', { class: 'peta-thing' }, world.kinds[b].icon)); }
      const p = world.placeAt.get(k) || marks[k];
      if (p) {
        c.classList.add('place');
        c.append(el('span', { class: 'peta-thing' }, p.icon));
        if (p.label) c.append(el('small', { class: 'peta-name' }, p.label));
      }
      if (trail.has(k)) c.classList.add('trail');
    }
  }
  function show(p, mood) {
    walker.remove();
    walker.className = `walker ${mood || ''}`;
    cells.get(key(p))?.append(walker);
  }
  draw();
  return {
    node: grid,
    draw,
    show,
    // Path dots behind the walker; `clear` wipes them.
    mark(p) { trail.add(key(p)); cells.get(key(p))?.classList.add('trail'); },
    clear() { trail.clear(); cells.forEach((c) => c.classList.remove('trail')); },
  };
}

// Animates a walk. `onStep(i)` is told which arrow is running.
export function animate(board, result, done, { speed = 420, onStep } = {}) {
  board.clear();
  const timers = result.path.map((p, i) => setTimeout(() => {
    if (i > 0) onStep?.(i - 1);
    board.mark(p);
    board.show(p);
  }, i * speed));
  timers.push(setTimeout(() => {
    const last = result.path[result.path.length - 1];
    const stay = result.end === 'keluar' ? result.path[result.path.length - 2] : last;
    board.show(stay, result.end === 'sampai' ? 'happy' : result.end === 'belum' ? '' : 'sad');
    onStep?.(-1);
    done(result);
  }, result.path.length * speed));
  return () => timers.forEach(clearTimeout);
}

// Arrow strip. Arrows are numbered; `onArrow(i)` fires when one is tapped.
export function arrowStrip({ numbered = false, onArrow, slots = 0 }) {
  const node = el('div', { class: 'prog' });
  let program = [];
  let lit = -1;
  let picking = -1;
  function draw() {
    node.replaceChildren(...program.map((a, i) => onTap(el('button', {
      class: `prog-arrow ${numbered ? 'numbered' : ''} ${i === lit ? 'lit' : ''} ${i === picking ? 'picking' : ''}`,
      type: 'button', 'data-n': i + 1,
    }, ARROWS[a].icon), () => onArrow?.(i))),
    ...Array.from({ length: Math.max(0, slots - program.length) }, () => el('span', { class: 'prog-empty' })));
  }
  draw();
  return {
    node,
    get program() { return program; },
    set(p) { program = p.slice(); draw(); },
    light(i) { lit = i; draw(); },
    pick(i) { picking = i; draw(); },
  };
}

export function arrowPad(onArrow) {
  return el('div', { class: 'arrow-pad' }, Object.entries(ARROWS).map(([name, a]) =>
    onTap(el('button', { class: 'arrow-btn', type: 'button', 'aria-label': name }, a.icon), () => onArrow(name))));
}

// Write-a-program puzzle: palette, strip, Jalan and Satu Langkah.
// `onResult(result, program, retry)` runs after Jalan, or after the last
// single step.
export function programmer(wrap, world, ctx, { from, to, marks, prompt, messages, onResult, maxLen = 12, onCell }) {
  const board = makeBoard(world, { marks, onCell });
  board.show(from);
  let busy = false;
  let stepAt = 0;
  let stop = null;
  const msg = el('p', { class: 'reveal' });
  const strip = arrowStrip({
    slots: 6,
    onArrow(i) {
      if (busy) return;
      const p = strip.program.slice();
      p.splice(i, 1);
      strip.set(p);
      reset();
    },
  });
  const count = el('span', { class: 'step-count' });
  function reset() {
    stepAt = 0;
    stop?.();
    msg.textContent = '';
    msg.className = 'reveal';
    board.clear();
    board.show(from);
    strip.light(-1);
    count.textContent = strip.program.length ? `${strip.program.length} panah` : '';
  }
  function finish(r) {
    msg.textContent = messages(r);
    msg.classList.toggle('bad', r.end !== 'sampai');
    busy = false;
    onResult(r, strip.program.slice(), () => setTimeout(reset, 1400), msg);
  }
  const pad = arrowPad((name) => {
    if (busy || strip.program.length >= maxLen) return;
    strip.set([...strip.program, name]);
    ctx.sound.tap();
    reset();
  });
  const go = button('▶ Jalan', () => {
    if (busy || !strip.program.length) return;
    busy = true;
    reset();
    busy = true;
    const r = world.run(strip.program, from, to);
    stop = animate(board, r, finish, { onStep: (i) => strip.light(i) });
  }, 'primary');
  const step = button('👣 Satu Langkah', () => {
    if (busy || !strip.program.length) return;
    if (stepAt >= strip.program.length) { reset(); return; }
    stepAt++;
    const r = world.run(strip.program.slice(0, stepAt), from, to);
    strip.light(stepAt - 1);
    const p = r.path[r.path.length - 1];
    board.mark(p);
    board.show(r.end === 'keluar' ? r.path[r.path.length - 2] : p);
    if (r.end !== 'belum' && r.end !== 'sampai') { stepAt = strip.program.length; finish(r); return; }
    if (stepAt === strip.program.length) finish(r);
  });
  const clear = button('Hapus', () => { if (!busy) { strip.set([]); reset(); } }, 'ghost');
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'peta-layout' }, board.node,
      el('div', { class: 'peta-side' }, el('div', { class: 'label' }, 'Program: ', count), strip.node, pad,
        el('div', { class: 'row' }, go, step, clear), msg)));
  return { board, strip, reset };
}
