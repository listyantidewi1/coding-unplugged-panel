// Small pieces shared by the SMA/SMK activities: a team picker, a score bar,
// a final scoreboard and a status line.

import { el, onTap, button } from '../core/util.js';

export function say(msg, kind, text) {
  msg.className = `reveal ${kind || ''}`.trim();
  msg.textContent = text;
}

// Ask for 2–4 teams, then call start(n).
export function pickTeams(wrap, title, start, n0 = 2) {
  let n = n0;
  const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, title),
    el('p', { class: 'reveal info' }, 'Berapa tim?'),
    el('div', { class: 'seg sk-tim' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; draw(); }))),
    el('div', { class: 'kode-baris' }, button('Mulai ➜', () => start(n), 'primary')));
  draw();
}

export const scoreBar = (pts, team, unit = '') => el('div', { class: 'pb-skor' }, pts.map((p, i) => el('span', { class: i === team ? 'giliran' : '' }, `Tim ${i + 1}: ${p}${unit}`)));

// Final board; `low` means the smallest score wins.
export function finishBoard(wrap, ctx, { title, pts, unit = 'poin', low = false, again }) {
  const best = low ? Math.min(...pts) : Math.max(...pts);
  ctx.sound.win();
  wrap.replaceChildren(el('p', { class: 'prompt' }, title),
    el('div', { class: 'ab-lapisan' }, pts.map((p, i) => el('div', { class: `ab-lap-baris ${p === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}`), el('b', null, `${p} ${unit}${p === best ? ' 🏆' : ''}`)))),
    el('div', { class: 'kode-baris' }, button('Main lagi', again, 'primary')));
}

export const fmtNum = (x, d = 2) => (Number.isInteger(x) ? x.toLocaleString('id-ID') : x.toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
