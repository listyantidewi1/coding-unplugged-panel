// A painted grid of coloured cells, shared by the pixel, quota and woven-mat
// activities. Touch a cell to paint it with the brush; drag to keep painting.
// Each finger keeps the value it started with, so two children can paint
// at once. An optional label column sits left of every row.

import { el, onTap } from './util.js';

export function paintGrid({ rows, cols, colors, label, brush = () => 1, onChange = () => {}, values, cls = '', reserve }) {
  const vals = values ? values.slice() : new Array(rows * cols).fill(0);
  const cells = [];
  const labels = [];
  const node = el('div', { class: `kisi ${label ? 'labelled' : ''} ${cls}`, style: { '--rows': rows, '--cols': cols, '--lab': label ? 1 : 0, ...(reserve ? { '--reserve': reserve } : {}) } });
  for (let r = 0; r < rows; r++) {
    if (label) {
      const l = el('div', { class: 'kisi-label' });
      labels.push(l);
      node.append(l);
    }
    for (let c = 0; c < cols; c++) {
      const cell = el('div', { class: 'kisi-cell', 'data-i': r * cols + c });
      cells.push(cell);
      node.append(cell);
    }
  }
  const paint = new Map();
  let locked = false;

  function draw(i) {
    cells[i].style.background = colors[vals[i]];
    cells[i].dataset.v = vals[i];
  }
  function set(i, v, silent) {
    if (vals[i] === v) return;
    vals[i] = v;
    draw(i);
    if (!silent) onChange(i);
  }
  const relabel = () => labels.forEach((l, r) => { l.textContent = label(r, api); });
  function cellAt(x, y) {
    const t = document.elementFromPoint(x, y);
    return t && t.classList.contains('kisi-cell') && node.contains(t) ? Number(t.dataset.i) : -1;
  }
  node.addEventListener('pointerdown', (e) => {
    if (locked) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const v = brush(vals[i], i);
    paint.set(e.pointerId, v);
    set(i, v);
  });
  node.addEventListener('pointermove', (e) => {
    if (locked || !paint.has(e.pointerId)) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i >= 0) set(i, paint.get(e.pointerId));
  });
  const end = (e) => paint.delete(e.pointerId);
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);

  const api = {
    node, cells, labels, values: vals, rows, cols,
    get: (r, c) => vals[r * cols + c],
    row: (r) => vals.slice(r * cols, r * cols + cols),
    set,
    fill(arr) { arr.forEach((v, i) => set(i, v, true)); relabel(); },
    relabel,
    lock(on = true) { locked = on; node.classList.toggle('locked', on); },
  };
  vals.forEach((_, i) => draw(i));
  if (label) relabel();
  return api;
}

// Colour picker row; `onPick(v)` gets the chosen value.
export function swatches(colors, names, onPick, start = 1) {
  let current = start;
  const btns = colors.map((c, v) => el('button', { class: 'swatch-btn', type: 'button', style: { '--c': c }, 'aria-label': names[v] },
    el('i'), el('small', null, `${v} ${names[v]}`)));
  const pick = (v) => {
    current = v;
    btns.forEach((b, k) => b.classList.toggle('on', k === v));
    onPick(v);
  };
  btns.forEach((b, v) => onTap(b, () => pick(v)));
  pick(start);
  return { node: el('div', { class: 'swatches' }, btns), get: () => current, pick };
}
