// Senam Pagi Berulang — SD Awal (7–9 tahun), perulangan.
// Bu Guru's long exercise is shortened with "ulangi … kali ( … )" blocks.
// The figure on screen performs the child's program and counts the moves,
// so the class can exercise along.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const MOVES = {
  atas: { icon: '🙌', label: 'tangan ke atas', play: (s) => s.tap() },
  samping: { icon: '👐', label: 'tangan ke samping', play: (s) => s.tap() },
  jongkok: { icon: '🧎', label: 'jongkok', play: (s) => s.stomp() },
  lompat: { icon: '🦘', label: 'lompat', play: (s) => s.stomp() },
  tepuk: { icon: '👏', label: 'tepuk tangan', play: (s) => s.clap() },
};
const KEYS = Object.keys(MOVES);
const BEAT = 650;

export const expand = (blocks) => blocks.flatMap((b) => Array.from({ length: b.count }, () => b.moves).flat());
const cards = (blocks) => blocks.reduce((n, b) => n + b.moves.length, 0);

// The figure: shows each move big and counts "3 dari 8".
function gym() {
  const pose = el('span', { class: 'gym-pose' }, '🧍');
  const count = el('span', { class: 'gym-count' });
  const node = el('div', { class: 'gym' }, pose, count);
  let timers = [];
  return {
    node,
    perform(moves, sound, done) {
      timers.forEach(clearTimeout);
      timers = moves.map((m, i) => setTimeout(() => {
        pose.textContent = MOVES[m].icon;
        count.textContent = `${i + 1} dari ${moves.length}`;
        node.classList.remove('beat');
        void node.offsetWidth;
        node.classList.add('beat');
        MOVES[m].play(sound);
      }, i * BEAT));
      timers.push(setTimeout(() => { pose.textContent = '🧍'; done?.(); }, moves.length * BEAT + 300));
    },
    stop() { timers.forEach(clearTimeout); },
  };
}

// Program editor: one or more repeat blocks. The active block takes the
// moves tapped on the palette; tap a move in a block to remove it.
function programEditor(ctx, { maxBlocks = 2, maxMoves = 3, onChange }) {
  const blocks = [{ count: 2, moves: [] }];
  let active = 0;
  const list = el('div', { class: 'blocks' });
  function draw() {
    list.replaceChildren(...blocks.map((b, bi) => {
      const minus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'kurangi' }, '−'), () => { b.count = Math.max(1, b.count - 1); draw(); });
      const plus = onTap(el('button', { class: 'step-btn', type: 'button', 'aria-label': 'tambah' }, '+'), () => { b.count = Math.min(9, b.count + 1); draw(); });
      const slots = Array.from({ length: maxMoves }, (_, i) => (b.moves[i]
        ? onTap(el('button', { class: 'slot move-slot filled', type: 'button' }, MOVES[b.moves[i]].icon), () => { b.moves.splice(i, 1); draw(); })
        : el('span', { class: 'slot move-slot' })));
      const block = el('div', { class: `ublock ${bi === active ? 'on' : ''}` },
        el('span', { class: 'repeat-word' }, 'ulangi'), minus, el('b', { class: 'ucount' }, b.count), plus, el('span', { class: 'repeat-word' }, 'kali'),
        el('span', { class: 'paren' }, '('), slots, el('span', { class: 'paren' }, ')'));
      onTap(block, (e) => { if (!e.target.closest('button')) { active = bi; draw(); } });
      return block;
    }));
    if (blocks.length < maxBlocks) list.append(button('+ blok ulangi', () => { blocks.push({ count: 1, moves: [] }); active = blocks.length - 1; draw(); }, 'ghost small'));
    onChange?.(blocks);
  }
  const palette = el('div', { class: 'palette senam-palette' }, KEYS.map((k) => onTap(el('button', { class: 'move-btn', type: 'button', 'aria-label': MOVES[k].label },
    el('span', null, MOVES[k].icon), el('small', null, MOVES[k].label)), () => {
    const b = blocks[active];
    if (b.moves.length >= maxMoves) return;
    b.moves.push(k);
    MOVES[k].play(ctx.sound);
    draw();
  })));
  draw();
  return {
    list, palette, blocks,
    clear() { blocks.splice(0, blocks.length, { count: 2, moves: [] }); active = 0; draw(); },
  };
}

const longRow = (moves) => el('div', { class: 'chain long senam-long' }, moves.map((m) => el('span', null, MOVES[m].icon)));

// Shorten a long exercise. `best` is the fewest cards possible.
function shortenRound(wrap, ctx, { target, best, prompt, maxBlocks }, next) {
  const g = gym();
  const info = el('p', { class: 'small-note' });
  const ed = programEditor(ctx, { maxBlocks, onChange: (b) => { info.textContent = `${cards(b)} kartu di dalam kurung · ${expand(b).length} gerakan`; } });
  const msg = el('p', { class: 'reveal' });
  const go = button('▶ Senam!', () => {
    const mine = expand(ed.blocks);
    if (!mine.length) return;
    go.disabled = true;
    msg.textContent = '';
    g.perform(mine, ctx.sound, () => {
      go.disabled = false;
      if (mine.join() !== target.join()) {
        msg.textContent = `Belum sama. Senam Bu Guru ${target.length} gerakan, senammu ${mine.length} gerakan.`;
        msg.className = 'reveal bad';
        ctx.mistake();
        shake(ed.list);
        return;
      }
      const n = cards(ed.blocks);
      msg.className = 'reveal';
      msg.textContent = n <= best
        ? `Hebat! Versi panjang ${target.length} kartu, versi singkat hanya ${n} kartu.`
        : `Benar! Kamu memakai ${n} kartu. Bisa lebih singkat lagi, cukup ${best} kartu.`;
      next();
    });
  }, 'primary');
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    longRow(target),
    el('div', { class: 'senam-layout' }, g.node, el('div', { class: 'senam-side' }, ed.list, ed.palette, info, el('div', { class: 'row' }, go), msg)));
}

// Write the long version of a short program in the empty slots.
function lengthenRound(wrap, ctx, block, next) {
  const target = expand([block]);
  const filled = [];
  const slots = el('div', { class: 'chain long senam-long' });
  const draw = () => slots.replaceChildren(...target.map((_, i) => (filled[i]
    ? onTap(el('button', { class: 'slot move-slot filled', type: 'button' }, MOVES[filled[i]].icon), () => { filled.splice(i, 1); draw(); })
    : el('span', { class: 'slot move-slot' }))));
  draw();
  const palette = el('div', { class: 'palette senam-palette' }, KEYS.map((k) => onTap(el('button', { class: 'move-btn', type: 'button', 'aria-label': MOVES[k].label },
    el('span', null, MOVES[k].icon), el('small', null, MOVES[k].label)), () => {
    if (filled.length >= target.length) return;
    filled.push(k);
    MOVES[k].play(ctx.sound);
    draw();
    if (filled.length === target.length) {
      if (filled.join() === target.join()) { g.perform(target, ctx.sound); next(); return; }
      ctx.mistake();
      shake(slots);
    }
  })));
  const g = gym();
  wrap.append(
    el('p', { class: 'prompt' }, 'Tulis versi panjangnya! Isi kotak dengan gerakan.'),
    el('div', { class: 'ublock static' }, el('span', { class: 'repeat-word' }, `ulangi ${block.count} kali (`), block.moves.map((m) => el('span', { class: 'slot move-slot filled' }, MOVES[m].icon)), el('span', { class: 'repeat-word' }, ')')),
    slots, el('div', { class: 'senam-layout' }, g.node, palette));
}

function randomTarget(rand) {
  const len = rand.int(2, 3);
  const unit = rand.shuffle(KEYS).slice(0, len);
  const count = rand.int(2, 4);
  const blocks = [{ count, moves: unit }];
  if (rand.next() < 0.5) {
    const m = rand.pick(KEYS.filter((k) => !unit.includes(k)));
    blocks.push({ count: rand.int(2, 3), moves: [m] });
  }
  return { target: expand(blocks), best: cards(blocks), maxBlocks: 2, prompt: 'Ringkas senam ini dengan blok ulangi!' };
}

const PLAN = [
  { kind: 'ringkas', target: expand([{ count: 4, moves: ['atas', 'samping'] }]), best: 2, maxBlocks: 1, prompt: 'Senam Bu Guru panjang sekali! Ringkas dengan blok ulangi.' },
  { kind: 'ringkas', target: expand([{ count: 3, moves: ['jongkok', 'lompat'] }, { count: 2, moves: ['tepuk'] }]), best: 3, maxBlocks: 2, prompt: 'Ringkas senam ini dengan DUA blok ulangi!' },
  { kind: 'panjang', block: { count: 2, moves: ['tepuk', 'tepuk', 'lompat'] } },
  { kind: 'hitung' },
];

export default {
  id: 'sda-05-senam-pagi',
  title: 'Senam Pagi Berulang',
  topic: 'Perulangan',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🤸',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid meringkas gerakan berulang dengan blok "ulangi … kali", menulis versi panjangnya, dan menghitung jumlah gerakan.',
  extraModes: [{ id: 'kreasi', icon: '💪', label: 'Buat Senam', desc: 'Tulis senam dengan blok ulangi, tokoh memimpin kelas bersenam', create: createFree }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act senam' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2400); };
      const p = PLAN[r] || { kind: 'ringkas', ...randomTarget(ctx.rand) };
      if (p.kind === 'ringkas') shortenRound(wrap, ctx, p, next);
      else if (p.kind === 'panjang') lengthenRound(wrap, ctx, p.block, next);
      else {
        choice(wrap, {
          prompt: 'Berapa gerakan semuanya?',
          subject: el('div', { class: 'ublock static' }, el('span', { class: 'repeat-word' }, 'ulangi 4 kali ('), el('span', { class: 'slot move-slot filled' }, '🦘'), el('span', { class: 'slot move-slot filled' }, '👏'), el('span', { class: 'repeat-word' }, ')')),
          ctx, onRight: next, columns: 3,
          options: ctx.rand.shuffle([{ label: '8 gerakan', correct: true }, { label: '6 gerakan' }, { label: '4 gerakan' }]),
        });
      }
    }
    render();
  },
};

function createFree(root, ctx) {
  const wrap = el('div', { class: 'act senam' });
  root.append(wrap);
  const g = gym();
  const info = el('p', { class: 'reveal' });
  const ed = programEditor(ctx, { maxBlocks: 3, onChange: (b) => { info.textContent = `Semuanya ${expand(b).length} gerakan`; } });
  wrap.append(
    el('p', { class: 'prompt' }, 'Buat senammu sendiri dengan blok ulangi, lalu bersenam bersama!'),
    el('div', { class: 'senam-layout' }, g.node, el('div', { class: 'senam-side' }, ed.list, ed.palette, info,
      el('div', { class: 'row' }, button('▶ Senam!', () => g.perform(expand(ed.blocks), ctx.sound), 'primary'), button('Hapus', () => ed.clear(), 'ghost')))));
  return { destroy() { g.stop(); } };
}
