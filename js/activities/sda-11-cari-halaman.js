// Cari Halaman Secepatnya — SD Awal (7–9 tahun), pencarian (membagi dua).
// A 100-page book: tap its edge to open it there. The screen shows the page
// number and counts the openings; the part that cannot hold the page dims.

import { el, choice } from '../core/kit.js';

const PAGES = 100;

function searchRound(wrap, ctx, target, next) {
  let lo = 1;
  let hi = PAGES;
  let opens = 0;
  let found = false;
  const edges = Array.from({ length: PAGES }, (_, i) => el('i', { class: 'edge', 'data-p': i + 1 }));
  const strip = el('div', { class: 'book-edge' }, edges);
  const ticks = el('div', { class: 'book-ticks' }, Array.from({ length: 10 }, (_, i) => el('span', null, i * 10 + 1)));
  const page = el('div', { class: 'open-page' }, el('span', { class: 'page-num' }, '?'), el('small', null, 'Ketuk tepi buku untuk membukanya'));
  const log = el('ol', { class: 'open-log' });
  const counter = el('span', { class: 'open-count' }, 'Bukaan: 0');
  const msg = el('p', { class: 'reveal' });
  function dim() {
    edges.forEach((e, i) => e.classList.toggle('out', i + 1 < lo || i + 1 > hi));
  }
  function open(p) {
    if (found) return;
    // Opening a part that is already ruled out is a wasted opening.
    if (p < lo || p > hi) ctx.mistake();
    opens++;
    counter.textContent = `Bukaan: ${opens}`;
    edges.forEach((e) => e.classList.remove('now'));
    edges[p - 1].classList.add('now');
    ctx.sound.tap();
    let hint;
    if (p === target) {
      found = true;
      hint = 'ketemu!';
      page.className = 'open-page found';
    } else if (target < p) {
      hint = 'lebih depan ⬅️';
      hi = Math.min(hi, p - 1);
      page.className = 'open-page';
    } else {
      hint = 'lebih belakang ➡️';
      lo = Math.max(lo, p + 1);
      page.className = 'open-page';
    }
    page.replaceChildren(el('span', { class: 'page-num' }, p), el('small', null, hint));
    log.append(el('li', null, `${p}: ${hint}`));
    dim();
    if (found) {
      msg.textContent = `Ketemu dalam ${opens} bukaan! Kalau membalik satu per satu dari halaman 1, harus melewati ${target - 1} halaman.`;
      next();
    }
  }
  strip.addEventListener('pointerdown', (e) => {
    const r = strip.getBoundingClientRect();
    const p = Math.min(PAGES, Math.max(1, Math.floor(((e.clientX - r.left) / r.width) * PAGES) + 1));
    e.preventDefault();
    open(p);
  });
  wrap.append(
    el('p', { class: 'prompt' }, `Cari halaman ${target} dengan membuka buku sesedikit mungkin!`),
    el('div', { class: 'book' }, strip, ticks),
    el('div', { class: 'book-row' }, page, el('div', { class: 'book-side' }, counter, log)), msg);
}

const TARGETS = [12, 63, 88];

export default {
  id: 'sda-11-cari-halaman',
  title: 'Cari Halaman Secepatnya',
  topic: 'Pencarian (membagi dua)',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '📖',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid menemukan halaman dengan membuka buku di tengah, menentukan lebih depan atau lebih belakang, dan terus membagi dua bagian yang tersisa.',
  create(root, ctx) {
    const wrap = el('div', { class: 'act halaman' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2600); };
      if (r === 3) {
        choice(wrap, {
          prompt: 'Mengapa membuka di tengah lebih cepat daripada membalik satu per satu?',
          ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { icon: '✂️', label: 'Setiap bukaan membuang separuh buku yang tidak perlu dicari lagi', correct: true },
            { icon: '🍀', label: 'Karena kita beruntung' },
            { icon: '📕', label: 'Karena halaman di tengah lebih tebal' },
          ]),
        });
        return;
      }
      const target = TARGETS[r] ?? ctx.rand.int(2, PAGES - 1);
      searchRound(wrap, ctx, target, next);
    }
    render();
  },
};
