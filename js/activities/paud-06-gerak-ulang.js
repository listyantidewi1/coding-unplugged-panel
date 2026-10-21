// Gerak Berulang — PAUD (4–6 tahun), pengulangan.
// Spot the repeated part of a movement song, then squeeze a long rhythm into
// "ulangi ( … ) sebanyak n kali". A dancer on screen performs it with sound.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const MOVES = {
  tepuk: { icon: '👏', label: 'tepuk', play: (s) => s.clap() },
  hentak: { icon: '🦶', label: 'hentak', play: (s) => s.stomp() },
  putar: { icon: '🔄', label: 'putar', play: (s) => s.spin() },
};
const COUNTS = [2, 3, 4];

// Dancer that performs a list of moves, one every 600 ms.
function dancer() {
  const node = el('div', { class: 'dancer' }, el('span', { class: 'dancer-body' }, '🧒'), el('span', { class: 'dancer-move' }));
  let timers = [];
  return {
    node,
    perform(moves, sound, done) {
      timers.forEach(clearTimeout);
      timers = moves.map((m, i) => setTimeout(() => {
        node.dataset.move = m;
        node.querySelector('.dancer-move').textContent = MOVES[m].icon;
        node.classList.remove('beat');
        void node.offsetWidth;
        node.classList.add('beat');
        MOVES[m].play(sound);
      }, i * 600));
      timers.push(setTimeout(() => {
        node.querySelector('.dancer-move').textContent = '';
        done?.();
      }, moves.length * 600 + 200));
    },
    stop() { timers.forEach(clearTimeout); },
  };
}

const expand = (unit, n) => Array.from({ length: n }, () => unit).flat();

// Repeat block: `size` slots filled from the move palette, plus a count.
function repeatBlock(size, ctx, onChange) {
  const filled = new Array(size).fill(null);
  let count = null;
  const slots = filled.map((_, i) => onTap(el('div', { class: 'slot move-slot' }), () => {
    filled[i] = null;
    draw();
  }));
  const counts = COUNTS.map((n) => onTap(el('button', { class: 'count-btn', type: 'button' }, `${n}×`), () => {
    count = n;
    draw();
  }));
  const palette = el('div', { class: 'palette' }, Object.entries(MOVES).map(([k, m]) =>
    onTap(el('button', { class: 'move-btn', type: 'button', 'aria-label': m.label }, el('span', null, m.icon), el('small', null, m.label)), () => {
      const i = filled.indexOf(null);
      if (i < 0) return;
      filled[i] = k;
      m.play(ctx.sound);
      draw();
    })));
  function draw() {
    slots.forEach((s, i) => {
      s.textContent = filled[i] ? MOVES[filled[i]].icon : '';
      s.classList.toggle('filled', !!filled[i]);
    });
    counts.forEach((b, i) => b.classList.toggle('on', COUNTS[i] === count));
    onChange(filled.includes(null) || !count ? null : { unit: filled.slice(), count });
  }
  const node = el('div', { class: 'repeat' },
    el('span', { class: 'repeat-word' }, 'ulangi'),
    el('span', { class: 'paren' }, '('), ...slots, el('span', { class: 'paren' }, ')'),
    el('span', { class: 'repeat-word' }, 'sebanyak'), ...counts);
  return { node, palette, clear() { filled.fill(null); count = null; draw(); } };
}

function rhythmRound(wrap, ctx, unit, count, next) {
  const long = expand(unit, count);
  const d = dancer();
  let answer = null;
  const block = repeatBlock(unit.length, ctx, (a) => { answer = a; check.disabled = !a; });
  const listen = button('🔊 Dengar', () => d.perform(long, ctx.sound));
  const check = button('▶ Menari', () => {
    if (!answer) return;
    const mine = expand(answer.unit, answer.count);
    d.perform(mine, ctx.sound, () => {
      if (mine.join() === long.join()) next();
      else { ctx.mistake(); shake(block.node); }
    });
  }, 'primary');
  check.disabled = true;
  wrap.append(
    el('p', { class: 'prompt' }, 'Lihat gerakan ini. Bagian mana yang diulang? Isi kotak ulangi dan pilih berapa kali.'),
    el('div', { class: 'chain long' }, long.map((m, i) => el('span', { class: i % unit.length === unit.length - 1 ? 'gap-after' : '' }, MOVES[m].icon))),
    el('div', { class: 'dance-row' }, d.node, el('div', { class: 'dance-side' }, block.node, block.palette, el('div', { class: 'row' }, listen, check))));
}

export default {
  id: 'paud-06-gerak-ulang',
  title: 'Gerak Berulang',
  topic: 'Pengulangan',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '👏',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Anak menemukan bagian gerakan yang diulang dan menuliskannya sebagai "ulangi … sebanyak … kali".',
  extraModes: [{ id: 'kreasi', icon: '💃', label: 'Buat Tarian', desc: 'Susun gerakan, tokoh menari, kelas ikut bergerak', create: createDance }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gerak' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1300); };
      if (r % 4 === 0) {
        choice(wrap, {
          prompt: 'Lagu "Kepala Pundak Lutut Kaki". Dua gerakan muncul dua kali berturut-turut. Yang mana?',
          subject: '🙆 kepala · 🤷 pundak · 🦵 lutut · 🦶 kaki · 🦵 lutut · 🦶 kaki',
          ctx, onRight: next, columns: 3,
          options: ctx.rand.shuffle([
            { icon: '🦵🦶', label: 'lutut, kaki', correct: true },
            { icon: '🙆🤷', label: 'kepala, pundak' },
            { icon: '🤷🦵', label: 'pundak, lutut' },
          ]),
        });
      } else if (r % 4 === 1) {
        rhythmRound(wrap, ctx, ['tepuk', 'tepuk', 'hentak'], 3, next);
      } else {
        const len = ctx.rand.int(2, 3);
        const unit = Array.from({ length: len }, () => ctx.rand.pick(Object.keys(MOVES)));
        if (new Set(unit).size === 1) unit[len - 1] = unit[0] === 'tepuk' ? 'hentak' : 'tepuk';
        rhythmRound(wrap, ctx, unit, ctx.rand.pick(COUNTS), next);
      }
    }
    render();
  },
};

function createDance(root, ctx) {
  const wrap = el('div', { class: 'act gerak' });
  const d = dancer();
  let answer = null;
  const block = repeatBlock(3, ctx, (a) => { answer = a; go.disabled = !a; });
  const go = button('▶ Menari', () => { if (answer) d.perform(expand(answer.unit, answer.count), ctx.sound); }, 'primary');
  go.disabled = true;
  wrap.append(
    el('p', { class: 'prompt' }, 'Buat tarianmu! Pilih tiga gerakan dan berapa kali diulang, lalu menari bersama.'),
    el('div', { class: 'dance-row' }, d.node, el('div', { class: 'dance-side' }, block.node, block.palette,
      el('div', { class: 'row' }, go, button('Hapus', () => block.clear(), 'ghost')))));
  root.append(wrap);
}
