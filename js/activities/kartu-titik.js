// Kartu titik / kartu biner, concept inspired by CS Unplugged "Binary Numbers":
// flip dot cards (… 8 4 2 1) so the visible dots add up to the target number.
// One factory serves three worksheets: PAUD (3 kartu), SD Awal and SD Lanjut (5 kartu).

import { el, onTap } from '../core/util.js';

function dotsSvg(count) {
  // Lay dots out on a near-square grid inside a 100×140 card.
  const cols = Math.ceil(Math.sqrt(count * 0.7));
  const rows = Math.ceil(count / cols);
  const r = Math.min(80 / cols, 120 / rows) * 0.36;
  let out = '';
  for (let i = 0; i < count; i++) {
    const cx = 10 + (80 / cols) * ((i % cols) + 0.5);
    const cy = 10 + (120 / rows) * (Math.floor(i / cols) + 0.5);
    out += `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  }
  return `<svg viewBox="0 0 100 140" aria-hidden="true">${out}</svg>`;
}

const popcount = (x) => x.toString(2).replace(/0/g, '').length;

function targets(rand, total, max) {
  // Start with numbers that need at most two cards, then mix freely.
  const all = Array.from({ length: max }, (_, i) => i + 1);
  const easy = rand.shuffle(all.filter((x) => popcount(x) <= 2)).slice(0, 2);
  const rest = rand.shuffle(all.filter((x) => !easy.includes(x)));
  return [...easy, ...rest].slice(0, total);
}

function makeCards(values, onFlip) {
  const up = values.map(() => false);
  const bitEls = [];
  const cards = values.map((v, i) => {
    const card = el('div', { class: 'bcard', role: 'button', 'aria-label': `kartu ${v}` },
      el('div', { class: 'face front', html: dotsSvg(v) }, el('span', { class: 'num' }, v)),
      el('div', { class: 'face back' }));
    onTap(card, () => {
      up[i] = !up[i];
      card.classList.toggle('up', up[i]);
      bitEls[i].textContent = up[i] ? '1' : '0';
      onFlip();
    });
    return card;
  });
  values.forEach(() => bitEls.push(el('span', { class: 'bit' }, '0')));
  return {
    up,
    row: el('div', { class: 'bcards', style: { '--k': values.length } }, cards),
    bits: el('div', { class: 'bits', style: { '--k': values.length } }, bitEls),
    sum: () => values.reduce((s, v, i) => s + (up[i] ? v : 0), 0),
    lock() { cards.forEach((c) => c.classList.add('locked')); },
  };
}

function dotCards({ values, showBits, ...meta }) {
  const max = values.reduce((a, b) => a + b, 0);
  return {
    ...meta,
    source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
    maxPlayers: 4,
    extraModes: [{ id: 'kreasi', icon: '🔎', label: 'Jelajah Bebas', desc: 'Buka-tutup kartu sesukamu', create: createFree }],
    create(root, ctx) {
      const wrap = el('div', { class: 'act biner-card' });
      root.append(wrap);
      const list = targets(ctx.rand, ctx.total, max);

      function render() {
        const target = list[ctx.round];
        let done = false;
        const cards = makeCards(values, () => {
          ctx.sound.tap();
          if (!done && cards.sum() === target) {
            done = true;
            cards.lock();
            cards.bits.classList.add('correct');
            if (ctx.solved()) setTimeout(render, 1300);
          }
        });
        wrap.replaceChildren(
          el('p', { class: 'prompt' }, 'Buka kartu sampai jumlah titiknya tepat:'),
          el('div', { class: 'target' }, target),
          cards.row);
        if (showBits) wrap.append(cards.bits);
      }
      render();
    },
  };

  function createFree(root, ctx) {
    const wrap = el('div', { class: 'act biner-card' });
    const total = el('div', { class: 'target' }, '0');
    const cards = makeCards(values, () => { ctx.sound.tap(); total.textContent = cards.sum(); });
    wrap.append(
      el('p', { class: 'prompt' }, 'Buka dan tutup kartu. Berapa titik yang terlihat?'),
      total, cards.row);
    if (showBits) wrap.append(cards.bits);
    root.append(wrap);
  }
}

export const paudTitik = dotCards({
  id: 'paud-09-titik',
  title: 'Kartu Titik Buka-Tutup',
  topic: 'Representasi data sederhana',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🔵',
  values: [4, 2, 1],
  showBits: false,
  rounds: 5,
  goal: 'Anak membuka dan menutup tiga kartu titik untuk membuat jumlah 1 sampai 7.',
});

export const sdaKartuTitik = dotCards({
  id: 'sda-08-kartu-titik',
  title: 'Kartu Titik Ajaib',
  topic: 'Bilangan biner',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '✨',
  values: [16, 8, 4, 2, 1],
  showBits: false,
  rounds: 5,
  goal: 'Anak membuat bilangan 1 sampai 31 dengan lima kartu titik dan menemukan bahwa setiap kartu dua kali kartu di kanannya.',
});

export const sdlBiner = dotCards({
  id: 'sdl-01-biner',
  title: 'Kartu Biner',
  topic: 'Bilangan biner',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🃏',
  values: [16, 8, 4, 2, 1],
  showBits: true,
  rounds: 5,
  goal: 'Anak menyusun bilangan 1–31 dengan kartu titik dan menuliskannya sebagai bilangan biner 5 bit (kartu terbuka = 1, tertutup = 0).',
});
