// Two binary-number worksheets share one engine: a few items worth 1, 2, 4,
// 8, … are switched on or off until they add up to the target number, and
// the on/off row is the binary code.
//   sdl-01-lampu-gapura — lampu gapura 17-an (16 8 4 2 1)
//   sda-08-timbangan    — anak timbangan pedagang pasar (8 4 2 1 kg)

import { el, onTap } from '../core/util.js';

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
  };
}

function bitSum({ values, skin, opening, prompt, freePrompt, ...meta }) {
  const max = values.reduce((a, b) => a + b, 0);

  function scene(row, target) {
    return skin.scene ? skin.scene(row, target) : row.row;
  }

  return {
    ...meta,
    maxPlayers: 4,
    extraModes: [{ id: 'kreasi', icon: '🔎', label: 'Jelajah Bebas', desc: 'Coba sendiri, lihat angkanya', create: createFree }],
    create(root, ctx) {
      const wrap = el('div', { class: 'act bitsum' });
      root.append(wrap);
      const list = targets(ctx.rand, ctx.total, max, opening);

      function render() {
        const target = list[ctx.round];
        let done = false;
        const row = makeRow(values, skin, () => {
          ctx.sound.tap();
          update();
          if (!done && row.sum() === target) {
            done = true;
            row.lock();
            row.bits.classList.add('correct');
            if (ctx.solved()) setTimeout(render, 1400);
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
  scene(row, target) {
    const onPan = el('span', { class: 'sack' });
    const beam = el('div', { class: 'beam' },
      el('div', { class: 'pan left' }, el('span', { class: 'sack' }, target == null ? '' : `🛍️ ${target} kg`)),
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
  opening: [],
  rounds: 5,
  prompt: 'Pembeli minta ditimbang. Pilih anak timbangan sampai seimbang:',
  freePrompt: 'Letakkan anak timbangan. Berapa kilogram jumlahnya?',
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
  freePrompt: 'Nyalakan dan matikan lampu. Angka berapa yang tampil?',
  goal: 'Lima lampu gapura bernilai 16, 8, 4, 2, 1. Anak menyalakan lampu untuk menampilkan tanggal 17 dan bulan 8, lalu menulis kodenya dengan 0 dan 1.',
});
