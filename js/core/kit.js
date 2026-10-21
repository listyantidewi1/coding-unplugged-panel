// Building blocks shared by many activities: a multiple-choice question,
// drag-or-tap placement, and an ordering board.

import { el, onTap, button, shake } from './util.js';

// One question with big answer buttons. A wrong answer counts a mistake and
// greys that option out; the right one calls `onRight`.
export function choice(root, { prompt, subject, options, ctx, onRight, columns, shuffle = false }) {
  let done = false;
  // Mixed order so the right answer is not always on top; numbers stay in counting order.
  if (shuffle && ctx.rand && !options.every((o) => /^-?[\d.,]+$/.test(o.label ?? ''))) options = ctx.rand.shuffle(options);
  const buttons = options.map((o) => {
    const b = onTap(el('button', { class: 'opt', type: 'button' },
      o.icon ? el('span', { class: 'opt-icon' }, o.icon) : null,
      o.label ? el('span', { class: 'opt-label' }, o.label) : null), () => {
      if (done || b.disabled) return;
      if (o.correct) {
        done = true;
        b.classList.add('right');
        onRight();
      } else {
        b.disabled = true;
        b.classList.add('wrong');
        shake(b);
        ctx.mistake();
      }
    });
    return b;
  });
  root.append(...[
    el('p', { class: 'prompt' }, prompt),
    subject ? el('div', { class: 'subject' }, subject) : null,
    el('div', { class: 'opts', style: columns ? { '--cols': columns } : null }, buttons)].filter(Boolean));
}

// Drag-or-tap placement inside one pane. Items carry `data-drag`, targets
// `data-drop`. Each finger drags its own item, so children can work at the
// same time; a quick tap selects an item and a tap on a target places it.
export function dnd(root, onDrop) {
  let selected = null;
  const drags = new Map();
  const select = (item) => {
    selected?.classList.remove('selected');
    selected = item;
    item?.classList.add('selected');
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const item = e.target.closest('[data-drag]');
    if (item && root.contains(item) && !item.classList.contains('locked')) {
      e.preventDefault();
      item.setPointerCapture?.(e.pointerId);
      drags.set(e.pointerId, { item, x: e.clientX, y: e.clientY, ghost: null });
      return;
    }
    const target = e.target.closest('[data-drop]');
    if (target && root.contains(target) && selected) {
      e.preventDefault();
      const it = selected;
      select(null);
      onDrop(it, target);
    }
  });
  root.addEventListener('pointermove', (e) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    if (!d.ghost && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) {
      const r = d.item.getBoundingClientRect();
      d.ghost = d.item.cloneNode(true);
      d.ghost.classList.add('drag-ghost');
      Object.assign(d.ghost.style, { width: `${r.width}px`, height: `${r.height}px` });
      document.body.append(d.ghost);
      d.item.classList.add('dragging');
      if (selected === d.item) select(null);
    }
    if (d.ghost) {
      d.ghost.style.left = `${e.clientX - d.ghost.offsetWidth / 2}px`;
      d.ghost.style.top = `${e.clientY - d.ghost.offsetHeight / 2}px`;
    }
  });
  const end = (e) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    if (!d.ghost) {
      select(selected === d.item ? null : d.item);
      return;
    }
    d.ghost.remove();
    d.item.classList.remove('dragging');
    if (e.type === 'pointercancel') return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
    if (target && root.contains(target)) onDrop(d.item, target);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}

// Ordering board: shuffled step cards in a tray, numbered slots above.
// `steps` is the right order; `onFull(order)` gets the card indices placed.
// Returns the board node for the caller to place.
export function orderBoard({ steps, rand, onFull }) {
  const slots = steps.map((_, i) => el('div', { class: 'oslot', 'data-drop': 'slot' }, el('b', { class: 'onum' }, i + 1)));
  const cards = steps.map((s, i) => el('div', { class: 'ocard', 'data-drag': '', 'data-i': i },
    el('span', { class: 'ocard-icon' }, s.icon), el('span', { class: 'ocard-label' }, s.label)));
  const tray = el('div', { class: 'otray', 'data-drop': 'tray' }, rand.shuffle(cards));
  const board = el('div', { class: 'oboard', style: { '--n': steps.length } }, el('div', { class: 'oslots' }, slots), tray);

  const order = () => slots.map((s) => s.querySelector('.ocard'));
  dnd(board, (card, target) => {
    if (target.dataset.drop === 'tray') {
      tray.append(card);
    } else {
      const old = target.querySelector('.ocard');
      if (old && old !== card) (card.parentElement.classList.contains('oslot') ? card.parentElement : tray).append(old);
      target.append(card);
    }
    const placed = order();
    if (placed.every(Boolean)) onFull(placed.map((c) => Number(c.dataset.i)));
  });
  return {
    node: board,
    // Send cards that are not in their own slot back to the tray.
    returnWrong() {
      order().forEach((c, i) => { if (c && Number(c.dataset.i) !== i) tray.append(c); });
    },
    lock() { cards.forEach((c) => c.classList.add('locked')); },
  };
}

// Plays the placed steps one by one on a small stage, then reports whether the
// order was right. `say(i, stepIndex)` may return a custom "ups" message.
export function playSteps(stage, steps, placed, { ok, oops, done }) {
  let t = 0;
  const firstWrong = placed.findIndex((s, i) => s !== i);
  const upto = firstWrong < 0 ? placed.length : firstWrong + 1;
  for (let i = 0; i < upto; i++) {
    setTimeout(() => {
      const s = steps[placed[i]];
      stage.replaceChildren(el('span', { class: 'stage-icon' }, s.icon), el('span', null, s.label));
      stage.classList.remove('bad', 'good');
    }, t);
    t += 900;
  }
  setTimeout(() => {
    if (firstWrong < 0) {
      stage.replaceChildren(el('span', { class: 'stage-icon' }, '✅'), el('span', null, ok));
      stage.classList.add('good');
    } else {
      stage.replaceChildren(el('span', { class: 'stage-icon' }, '😵'), el('span', null, oops(placed[firstWrong])));
      stage.classList.add('bad');
    }
    done(firstWrong < 0);
  }, t);
}

export { button, onTap, el, shake };
