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

// ---- Hands-on boards shared by the SMA games (sma-36 onwards) ----
// Colours come from --mk (accent), --mk-muda (light fill) and --mk-tua (text) on the activity root.
import { dnd } from '../core/kit.js';
import { shake } from '../core/util.js';
import { say } from './sma-kit.js';

// Code listing: after(i) appends a node to line i, line(i) replaces its text, onLine makes lines tappable.
// labels replaces the line numbers (K1, R2, …).
export function codeView(lines, { hl = [], warn = [], after = null, line = null, onLine = null, cls = '', labels = null } = {}) {
  return el('div', { class: `mk-kode ${cls}` }, lines.map((t, i) => {
    const custom = line ? line(i) : null;
    const row = el('div', { class: `mk-baris ${hl.includes(i) ? 'hl' : ''} ${warn.includes(i) ? 'warn' : ''}`, 'data-i': i }, el('span', { class: 'mk-no' }, labels ? labels[i] : String(i + 1)), custom || el('code', null, t), after ? after(i) : null);
    return onLine ? onTap(row, () => onLine(i, row)) : row;
  }));
}

// Lines of text with blanks: ['Kamis ', '_'] → "Kamis [?]". Use as fillBoard's view.
export const rowsView = (rows) => (mk) => el('div', { class: 'mk-rumus' }, rows.map((parts) => el('div', null, parts.map((p) => (p === '_' ? mk() : p)))));

// Code with blanks for fillBoard: a line is a string, or an array of parts where '_' is a blank.
export const codeFill = (lines, o = {}) => (mk) => codeView(lines.map((l) => (typeof l === 'string' ? l : '')), { ...o, line: (i) => (Array.isArray(lines[i]) ? el('code', null, lines[i].map((p) => (p === '_' ? mk() : p))) : null) });

// Blanks filled in order from a chip tray; view(mk) builds the body and calls mk() once per blank.
export function fillBoard(ctx, { oops, msg, view, chips, want, hints, done, cls = '' }) {
  let k = 0; const blanks = [];
  const mk = () => { const b = el('span', { class: 'mk-celah', 'data-drop': String(blanks.length) }, '?'); blanks.push(b); return b; };
  const body = view(mk);
  const tray = el('div', { class: 'mk-chip-chip' }, ctx.rand.shuffle(chips.slice()).map((c) => el('div', { class: 'mk-chip', 'data-drag': c }, c)));
  const host = el('div', { class: `mk-papan ${cls}` }, body, tray);
  dnd(host, (chip, blank) => {
    if (k >= want.length || !blank.classList.contains('mk-celah')) return;
    if (+blank.dataset.drop !== k) { say(msg, 'info', 'Isi dari atas ke bawah, kiri ke kanan.'); return; }
    if (chip.dataset.drag !== want[k]) { oops(); shake(chip); say(msg, 'bad', hints[Math.min(k, hints.length - 1)]); return; }
    blank.textContent = want[k]; blank.classList.add('isi'); chip.remove(); ctx.sound.tap(); k++;
    if (k < want.length) { say(msg, 'info', 'Tepat.'); return; }
    tray.remove(); done();
  });
  return host;
}

// Ordered code slots: build holds fixed strings or [wantId, indentLevel]; tiles are [id, text, hintIfWrong].
export function tileSlots(ctx, { oops, msg, build, tiles, onFull, order = 'Kartu ini untuk baris lain. Baca programnya dari atas.' }) {
  const slots = []; let got = 0;
  const rows = build.map((b) => {
    if (typeof b === 'string') return el('div', { class: 'mk-baris' }, el('code', null, b));
    const s = el('div', { class: 'mk-slot', 'data-drop': String(slots.length), 'data-want': b[0], style: { marginLeft: `${(b[1] || 0) * 2}em` } }, el('span', { class: 'mk-ph' }, '?'));
    slots.push(s); return s;
  });
  const tray = el('div', { class: 'mk-ubin-baki' }, ctx.rand.shuffle(tiles.slice()).map(([id, t]) => el('div', { class: 'mk-ubin', 'data-drag': id }, t)));
  const host = el('div', { class: 'mk-susun' }, el('div', { class: 'mk-kode' }, rows), tray);
  dnd(host, (tile, slot) => {
    if (!slot.classList.contains('mk-slot') || slot.classList.contains('isi')) return;
    if (+slot.dataset.drop !== got) { say(msg, 'info', 'Isi dari atas ke bawah.'); return; }
    const id = tile.dataset.drag;
    if (id !== slot.dataset.want) { oops(); shake(tile); const t = tiles.find((x) => x[0] === id); say(msg, 'bad', t[2] || order); return; }
    tile.classList.add('locked'); slot.replaceChildren(tile); slot.classList.add('isi'); got++; ctx.sound.tap();
    if (got < slots.length) { say(msg, 'info', 'Tepat.'); return; }
    tray.remove(); onFull();
  });
  return host;
}

// Output screen, and a player that prints lines one by one.
export const layar = () => el('pre', { class: 'mk-layar' }, ' ');
export function play(screen, lines, { gap = 260, end = null, err = null } = {}) {
  let i = 0; screen.textContent = '';
  const tick = () => {
    if (!screen.isConnected) return;
    if (i < lines.length) { screen.textContent += `${i ? '\n' : ''}${lines[i++]}`; screen.scrollTop = screen.scrollHeight; setTimeout(tick, gap); return; }
    if (err) { screen.append(el('b', { class: 'mk-galat' }, `\n${err}`)); screen.scrollTop = screen.scrollHeight; }
    end?.();
  };
  tick();
}
