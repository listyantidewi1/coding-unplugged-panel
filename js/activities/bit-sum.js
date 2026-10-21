// Two binary-number worksheets share one engine: a few items worth 1, 2, 4,
// 8, … are switched on or off until they add up to the target number, and
// the on/off row is the binary code.
//   sdl-01-lampu-gapura — lampu gapura 17-an (16 8 4 2 1)
//   sda-08-timbangan    — anak timbangan pedagang pasar (8 4 2 1 kg)

import { el, onTap } from '../core/util.js';
import { choice } from '../core/kit.js';

const popcount = (x) => x.toString(2).replace(/0/g, '').length;

// Fixed opening targets (the worksheet's own examples), then numbers that need
// at most two items, then anything.
function targets(rand, total, max, opening) {
  const all = Array.from({ length: max }, (_, i) => i + 1).filter((x) => !opening.includes(x));
  const easy = rand.shuffle(all.filter((x) => popcount(x) <= 2)).slice(0, 2);
  const rest = rand.shuffle(all.filter((x) => !easy.includes(x)));
  return [...opening, ...easy, ...rest].slice(0, total);
}

// Shared toggle row; `skin` draws one item and the scene around the row.
function makeRow(values, skin, onChange) {
  const on = values.map(() => false);
  const bitEls = values.map(() => el('span', { class: 'bit' }, '0'));
  const items = values.map((v, i) => onTap(skin.item(v), () => {
    on[i] = !on[i];
    items[i].classList.toggle('on', on[i]);
    items[i].setAttribute('aria-pressed', String(on[i]));
    bitEls[i].textContent = on[i] ? '1' : '0';
    onChange();
  }));
  return {
    row: el('div', { class: `bitrow ${skin.cls}`, style: { '--k': values.length } }, items),
    bits: el('div', { class: 'bits', style: { '--k': values.length } }, bitEls),
    sum: () => values.reduce((s, v, i) => s + (on[i] ? v : 0), 0),
    lock() { items.forEach((x) => x.classList.add('locked')); },
    // Shows the items for number n as switched on (for reading a code).
    show(n) {
      values.forEach((v, i) => {
        on[i] = (n & v) !== 0;
        items[i].classList.toggle('on', on[i]);
        bitEls[i].textContent = on[i] ? '1' : '0';
      });
    },
  };
}

// Opening items are numbers to build, or { baca: n } to read n's code back.
function bitSum({ values, skin, opening, prompt, readPrompt, freePrompt, extraModes = [], ...meta }) {
  const max = values.reduce((a, b) => a + b, 0);

  function scene(row, target, label) {
    return skin.scene ? skin.scene(row, target, label) : row.row;
  }

  // Build a number: switch items on until the sum is the target.
  function buildRound(wrap, ctx, vals, target, next) {
    let done = false;
    const row = makeRow(vals, skin, () => {
      ctx.sound.tap();
      update();
      if (!done && row.sum() === target) {
        done = true;
        row.lock();
        row.bits.classList.add('correct');
        next();
      }
    });
    const view = scene(row, target);
    const update = () => view.update?.(row.sum());
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, prompt),
      el('div', { class: 'target' }, skin.unit ? `${target} ${skin.unit}` : target),
      view.node || view, row.bits);
    update();
  }

  // Read a code: the items for n are already on; pick the number.
  function readRound(wrap, ctx, vals, n, next) {
    const top = vals.reduce((a, b) => a + b, 0);
    const row = makeRow(vals, skin, () => {});
    row.show(n);
    row.lock();
    const view = scene(row, n, '?');
    view.update?.(n);
    const near = [n, n + 1, n - 1, n + 2, n - 2, n + 4].filter((x) => x >= 1 && x <= top);
    const opts = ctx.rand.shuffle([...new Set(near)].slice(0, 4));
    wrap.replaceChildren();
    choice(wrap, {
      prompt: readPrompt,
      subject: el('div', { class: 'read-code' }, view.node || view, row.bits),
      ctx, columns: opts.length, onRight: next,
      options: opts.map((x) => ({ label: skin.unit ? `${x} ${skin.unit}` : String(x), correct: x === n })),
    });
  }

  // Endless practice with the given values, for extra modes.
  const practice = (vals, kind, min = 1) => (root, ctx) => {
    const wrap = el('div', { class: 'act bitsum' });
    root.append(wrap);
    const top = vals.reduce((a, b) => a + b, 0);
    const go = () => {
      const n = min + Math.floor(Math.random() * (top - min + 1));
      const next = () => { ctx.sound.good(); setTimeout(go, 1400); };
      if (kind === 'baca') readRound(wrap, ctx, vals, n, next);
      else buildRound(wrap, ctx, vals, n, next);
    };
    go();
  };

  return {
    ...meta,
    maxPlayers: 4,
    extraModes: [
      ...extraModes.map((m) => ({ ...m, create: practice(m.values || values, m.kind, m.min) })),
      { id: 'kreasi', icon: '🔎', label: 'Jelajah Bebas', desc: 'Coba sendiri, lihat angkanya', create: createFree },
    ],
    create(root, ctx) {
      const wrap = el('div', { class: 'act bitsum' });
      root.append(wrap);
      const fixed = opening.filter((x) => typeof x === 'number');
      const list = [...opening, ...targets(ctx.rand, ctx.total, max, fixed).filter((x) => !fixed.includes(x))];

      function render() {
        const item = list[ctx.round];
        const next = () => { if (ctx.solved()) setTimeout(render, 1400); };
        if (typeof item === 'object') readRound(wrap, ctx, values, item.baca, next);
        else buildRound(wrap, ctx, values, item, next);
      }
      render();
    },
  };

  function createFree(root, ctx) {
    const wrap = el('div', { class: 'act bitsum' });
    const total = el('div', { class: 'target' }, '0');
    const row = makeRow(values, skin, () => {
      ctx.sound.tap();
      total.textContent = skin.unit ? `${row.sum()} ${skin.unit}` : row.sum();
      view.update?.(row.sum());
    });
    const view = scene(row, null);
    wrap.append(el('p', { class: 'prompt' }, freePrompt), total, view.node || view, row.bits);
    root.append(wrap);
    view.update?.(0);
  }
}

const lampSkin = {
  cls: 'lamps',
  item: (v) => el('button', { class: 'lamp', type: 'button', 'aria-pressed': 'false', 'aria-label': `lampu ${v}` },
    el('span', { class: 'bulb' }), el('span', { class: 'val' }, v)),
  scene: (row) => el('div', { class: 'gapura' }, el('div', { class: 'gapura-top' }, 'DIRGAHAYU RI'), row.row),
};

// Pan balance: goods on the left, chosen weights on the right; the beam tilts
// toward the heavier side.
const weightSkin = {
  cls: 'weights',
  unit: 'kg',
  item: (v) => el('button', { class: 'weight', type: 'button', 'aria-pressed': 'false', 'aria-label': `anak timbangan ${v} kilogram` },
    el('span', null, `${v} kg`)),
  scene(row, target, label = target) {
    const onPan = el('span', { class: 'sack' });
    const beam = el('div', { class: 'beam' },
      el('div', { class: 'pan left' }, el('span', { class: 'sack' }, target == null ? '' : `🛍️ ${label} kg`)),
      el('div', { class: 'pan right' }, onPan));
    const node = el('div', { class: 'scale-scene' }, el('div', { class: 'scale' }, beam, el('div', { class: 'post' })), row.row);
    return {
      node,
      update(sum) {
        onPan.textContent = sum ? `⚖️ ${sum} kg` : '';
        const diff = target == null ? 0 : sum - target;
        beam.style.setProperty('--tilt', `${Math.max(-12, Math.min(12, -diff * 2))}deg`);
      },
    };
  },
};

export const sdaTimbangan = bitSum({
  id: 'sda-08-timbangan',
  title: 'Anak Timbangan Ajaib',
  topic: 'Bilangan biner',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '⚖️',
  source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
  values: [8, 4, 2, 1],
  skin: weightSkin,
  // The worksheet: weigh 3, 6, 9, 12, 15 kg, then read Pak Darto's notes.
  opening: [3, 6, 9, 12, 15, { baca: 10 }, { baca: 7 }, { baca: 8 }],
  rounds: 8,
  prompt: 'Pembeli minta ditimbang. Pilih anak timbangan sampai seimbang:',
  readPrompt: 'Baca catatan Pak Darto. Berapa berat berasnya?',
  freePrompt: 'Letakkan anak timbangan. Berapa kilogram jumlahnya?',
  extraModes: [
    { id: 'kebalikan', icon: '🔁', label: 'Baca Catatan', desc: 'Catatan 1 dan 0 tampil, tebak berat berasnya', kind: 'baca' },
    { id: 'tantangan', icon: '🏋️', label: 'Tantangan 16 kg', desc: 'Tambah anak timbangan 16 kg untuk berat 16 sampai 31 kg', values: [16, 8, 4, 2, 1], min: 16 },
  ],
  goal: 'Pedagang hanya punya anak timbangan 1, 2, 4, dan 8 kg. Anak menimbang 1–15 kg dan mencatat timbangan yang dipakai (1) atau tidak (0).',
});

export const sdlLampuGapura = bitSum({
  id: 'sdl-01-lampu-gapura',
  title: 'Lampu Gapura 17-an',
  topic: 'Bilangan biner',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '💡',
  source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
  values: [16, 8, 4, 2, 1],
  skin: lampSkin,
  opening: [17, 8],
  rounds: 5,
  prompt: 'Nyalakan lampu gapura sampai jumlah nilainya tepat:',
  readPrompt: 'Lampu mana yang menyala? Angka berapa yang tampil?',
  freePrompt: 'Nyalakan dan matikan lampu. Angka berapa yang tampil?',
  goal: 'Lima lampu gapura bernilai 16, 8, 4, 2, 1. Anak menyalakan lampu untuk menampilkan tanggal 17 dan bulan 8, lalu menulis kodenya dengan 0 dan 1.',
});
