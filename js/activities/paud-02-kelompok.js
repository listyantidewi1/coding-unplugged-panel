// Keranjang Mainan — PAUD (4–6 tahun), klasifikasi dan abstraksi.
// Sort toys into two baskets by one rule, then by another rule; find the
// odd one out; guess the rule behind a basket.

import { el, dnd, choice, shake } from '../core/kit.js';

const TOYS = [
  { id: 'bola', label: 'bola', icon: '⚽', rolls: true },
  { id: 'mobil', label: 'mobil', icon: '🚗', rolls: true },
  { id: 'balok', label: 'balok', icon: '🧱', rolls: false },
  { id: 'boneka', label: 'boneka', icon: '🧸', rolls: false },
];
const COLORS = { merah: '#dc2626', biru: '#2563eb' };
const ALL = TOYS.flatMap((t) => Object.keys(COLORS).map((c) => ({ ...t, color: c, name: `${t.label} ${c}` })));

const RULES = {
  warna: {
    prompt: 'Kelompokkan menurut warna!',
    bins: [{ key: 'merah', label: 'Keranjang MERAH', icon: '🟥' }, { key: 'biru', label: 'Keranjang BIRU', icon: '🟦' }],
    of: (t) => t.color,
  },
  gelinding: {
    prompt: 'Sekarang dengan cara lain: mana yang bisa menggelinding?',
    bins: [{ key: 'ya', label: 'BISA menggelinding', icon: '⚽' }, { key: 'tidak', label: 'TIDAK BISA menggelinding', icon: '🧱' }],
    of: (t) => (t.rolls ? 'ya' : 'tidak'),
  },
};

// Odd-one-out sets: the first item breaks the shared property.
const ODD = [
  { prompt: 'Semua benda ini bulat, kecuali satu. Mana yang tidak cocok?', items: [['📦', 'kotak'], ['⚽', 'bola'], ['🍊', 'jeruk'], ['🔵', 'kelereng']] },
  { prompt: 'Semua benda ini bisa dimakan, kecuali satu. Mana yang tidak cocok?', items: [['👟', 'sepatu'], ['🍌', 'pisang'], ['🍚', 'nasi'], ['🍉', 'semangka']] },
  { prompt: 'Semua hewan ini bisa terbang, kecuali satu. Mana yang tidak cocok?', items: [['🐟', 'ikan'], ['🐦', 'burung'], ['🦋', 'kupu-kupu'], ['🐝', 'lebah']] },
];

// "Tebak aturanku": the first rule is the right one.
const GUESS = [
  { items: '🍎 🚗 🧢', note: 'apel merah, mobil merah, topi merah', rules: [['🟥', 'semuanya merah'], ['⚪', 'semuanya bulat'], ['😋', 'semuanya bisa dimakan']] },
  { items: '🍊 ⚽ 🌕', note: 'jeruk, bola, bulan purnama', rules: [['⚪', 'semuanya bulat'], ['🟥', 'semuanya merah'], ['🐾', 'semuanya hewan']] },
  { items: '🐱 🐶 🐔', note: 'kucing, anjing, ayam', rules: [['🐾', 'semuanya hewan'], ['🌊', 'semuanya hidup di air'], ['⚪', 'semuanya bulat']] },
];

function sortRound(wrap, ctx, ruleKey, next) {
  const rule = RULES[ruleKey];
  const toys = ctx.rand.shuffle(ALL);
  let left = toys.length;
  const tray = el('div', { class: 'toy-tray' }, toys.map((t) => el('div', {
    class: 'toy', 'data-drag': '', 'data-name': t.name, style: { '--toy': COLORS[t.color] },
  }, el('span', { class: 'toy-icon' }, t.icon), el('span', { class: 'toy-label' }, t.name))));
  const bins = rule.bins.map((b) => el('div', { class: 'bin', 'data-drop': b.key },
    el('div', { class: 'bin-head' }, el('span', null, b.icon), ' ', b.label), el('div', { class: 'bin-items' })));
  const area = el('div', { class: 'sort-area' }, tray, el('div', { class: 'bins' }, bins));

  dnd(area, (item, bin) => {
    const toy = ALL.find((t) => t.name === item.dataset.name);
    if (rule.of(toy) !== bin.dataset.drop) {
      ctx.mistake();
      shake(item);
      return;
    }
    item.classList.add('locked');
    bin.querySelector('.bin-items').append(item);
    ctx.sound.tap();
    if (--left === 0) next();
  });
  wrap.append(el('p', { class: 'prompt' }, `${rule.prompt} Seret mainan ke keranjang.`), area);
}

export default {
  id: 'paud-02-kelompok',
  title: 'Keranjang Mainan',
  topic: 'Klasifikasi dan abstraksi',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🧺',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Anak mengelompokkan mainan menurut warna, lalu menurut aturan lain, menemukan benda yang tidak cocok, dan menebak aturan sebuah kelompok.',
  create(root, ctx) {
    const wrap = el('div', { class: 'act paud-kelompok' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1100); };
      const kind = r % 4;
      const pass = Math.floor(r / 4);
      if (kind === 0) sortRound(wrap, ctx, 'warna', next);
      else if (kind === 1) sortRound(wrap, ctx, 'gelinding', next);
      else if (kind === 2) {
        const set = ODD[pass % ODD.length];
        choice(wrap, {
          prompt: set.prompt, ctx, onRight: next,
          options: ctx.rand.shuffle(set.items.map(([icon, label], i) => ({ icon, label, correct: i === 0 }))),
        });
      } else {
        const g = GUESS[pass % GUESS.length];
        choice(wrap, {
          prompt: 'Tebak aturanku! Mengapa benda-benda ini ada di keranjang yang sama?',
          subject: el('div', { class: 'guess' }, el('div', { class: 'guess-items' }, g.items), el('small', null, g.note)),
          ctx, onRight: next, columns: 3,
          options: ctx.rand.shuffle(g.rules.map(([icon, label], i) => ({ icon, label, correct: i === 0 }))),
        });
      }
    }
    render();
  },
};
