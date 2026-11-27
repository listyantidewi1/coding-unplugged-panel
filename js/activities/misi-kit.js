// Mission frame for the SMA games: every round is a "misi" in a small world
// (a courier with a fuel tank, a route-finder machine, a cashier computer).
// The pieces here are shared: a mission header, a fuel/budget gauge, stars,
// and a tray of value cards that can be dropped into named boxes.

import { el, onTap } from '../core/util.js';

// "Misi 2 · Rute Hemat Bensin" plus one line saying what counts as done.
export function misiHead(no, judul, tujuan, ikon = '🎯') {
  return el('div', { class: 'misi-kepala' },
    el('span', { class: 'misi-no' }, `${ikon} Misi ${no}`),
    el('b', { class: 'misi-judul' }, judul),
    tujuan ? el('span', { class: 'misi-tujuan' }, tujuan) : null);
}

// A vertical gauge (fuel tank, budget). set(left) redraws; unit is shown after the number.
export function gauge(max, { label = '⛽ Bensin', unit = 'km' } = {}) {
  const fill = el('i', { class: 'misi-isi' });
  const num = el('b');
  const node = el('div', { class: 'misi-tangki' }, el('small', null, label), el('div', { class: 'misi-tabung' }, fill), num);
  const g = {
    node,
    set(left) {
      const p = Math.max(0, Math.min(1, left / max));
      fill.style.height = `${p * 100}%`;
      node.classList.toggle('tipis', p <= 0.2);
      node.classList.toggle('habis', left <= 0);
      num.textContent = `${Math.max(0, left)} / ${max} ${unit}`;
    },
  };
  g.set(max);
  return g;
}

export const stars = (n, of = 3) => el('span', { class: 'misi-bintang', 'aria-label': `${n} dari ${of} bintang` }, '★'.repeat(n), el('span', null, '★'.repeat(of - n)));

// Value cards coloured by Python type. kind: int | float | str | bool | err
export function valueCard(text, kind, extra = {}) {
  return el('button', { type: 'button', class: `misi-kartu t-${kind}`, ...extra }, text);
}
export const TYPE_NAME = { int: 'int', float: 'float', str: 'str', bool: 'bool', err: 'galat' };

// replaceChildren that skips null/false (Element.replaceChildren(null) would print "null").
export const fill = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
