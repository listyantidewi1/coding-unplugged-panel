// Resep Es Teh — SD Awal (7–9 tahun), urutan instruksi.
// Put Pak Joko's six recipe cards in order and press "Coba": the kitchen
// follows the cards exactly as placed, so a wrong order shows its result
// (gula mengendap, air putih, teh pahit, …). Some steps may move, some not.

import { el, button, choice, orderBoard, shake, onTap } from '../core/kit.js';

const STEPS = [
  { key: 'seduh', icon: '🫖', label: 'Seduh teh di teko, tunggu 3 menit' },
  { key: 'angkat', icon: '🏷️', label: 'Angkat kantong teh' },
  { key: 'gula', icon: '🥄', label: 'Masukkan gula, aduk sampai larut' },
  { key: 'es', icon: '🧊', label: 'Masukkan es batu ke gelas' },
  { key: 'tuang', icon: '🫗', label: 'Tuang teh ke gelas berisi es' },
  { key: 'sajikan', icon: '🥤', label: 'Sajikan untuk tamu' },
];
const SHORT = { seduh: 'seduh teh', angkat: 'angkat kantong', gula: 'gula', es: 'es batu', tuang: 'tuang', sajikan: 'sajikan' };

// Follows the cards in the given order. Returns the kitchen state after each
// card and, when something goes wrong, the step and what happened.
export function cook(order) {
  const s = { teko: 'kosong', kantong: false, manis: false, es: false, gelas: 'kosong', endap: false };
  const frames = [];
  for (let i = 0; i < order.length; i++) {
    const k = STEPS[order[i]].key;
    let oops = null;
    if (k === 'seduh') { s.teko = 'teh'; s.kantong = true; }
    if (k === 'angkat') {
      if (!s.kantong) oops = s.teko === 'kosong' ? 'Belum ada kantong teh yang bisa diangkat. Tehnya belum diseduh!' : 'Kantong teh sudah diangkat.';
      s.kantong = false;
    }
    if (k === 'gula') {
      if (s.gelas !== 'kosong') { s.endap = true; oops = 'Gula dimasukkan ke teh yang sudah dingin karena es. Gula tidak larut dan mengendap di dasar gelas!'; }
      else if (s.teko === 'kosong') oops = 'Gula masuk ke teko kosong. Belum ada teh panas!';
      else if (s.kantong) oops = 'Kantong teh masih di teko. Angkat dulu kantongnya, baru masukkan gula.';
      s.manis = true;
    }
    if (k === 'es') {
      if (s.gelas !== 'kosong') oops = 'Gelasnya sudah penuh teh. Es batu yang dimasukkan belakangan membuat teh tumpah!';
      s.es = true;
    }
    if (k === 'tuang') {
      if (s.teko === 'kosong') { s.gelas = 'air'; oops = 'Tehnya belum diseduh. Gelas hanya berisi air putih!'; }
      else if (s.kantong) { s.gelas = 'teh'; oops = 'Kantong teh masih di teko dan ikut tertuang ke gelas!'; }
      else s.gelas = 'teh';
      s.teko = 'kosong';
    }
    if (k === 'sajikan' && i < order.length - 1) oops = 'Gelasnya disajikan sebelum es teh selesai dibuat!';
    frames.push({ ...s, step: order[i] });
    if (oops) return { frames, oops, at: i };
  }
  return { frames, oops: null };
}

// Kitchen picture: teapot and glass that show the state.
function kitchen() {
  const pot = el('div', { class: 'pot' }, el('span', { class: 'pot-icon' }, '🫖'), el('span', { class: 'pot-bag' }, '🏷️'));
  const tea = el('div', { class: 'glass-tea' });
  const ice = el('div', { class: 'glass-ice' }, '🧊🧊');
  const sugar = el('div', { class: 'glass-sugar' });
  const glass = el('div', { class: 'glass' }, tea, ice, sugar);
  const say = el('div', { class: 'kitchen-say' });
  const node = el('div', { class: 'kitchen' }, el('div', { class: 'kitchen-row' }, pot, glass), say);
  return {
    node,
    show(f, text, mood) {
      pot.dataset.teko = f.teko;
      pot.classList.toggle('bag', f.kantong);
      glass.dataset.gelas = f.gelas;
      glass.classList.toggle('es', f.es);
      glass.classList.toggle('endap', f.endap);
      say.textContent = text;
      node.className = `kitchen ${mood || ''}`;
    },
    reset() {
      this.show({ teko: 'kosong', kantong: false, es: false, gelas: 'kosong', endap: false }, 'Dapur Pak Joko');
    },
  };
}

// Plays a cook() result in the kitchen; done(ok) at the end.
function playKitchen(k, result, done) {
  let t = 0;
  result.frames.forEach((f, i) => {
    setTimeout(() => k.show(f, `${i + 1}. ${STEPS[f.step].icon} ${SHORT[STEPS[f.step].key]}`), t);
    t += 900;
  });
  setTimeout(() => {
    const last = result.frames[result.frames.length - 1];
    if (result.oops) k.show(last, `😵 ${result.oops}`, 'bad');
    else k.show(last, '😋 Es teh manis siap! Tamu senang.', 'good');
    done(!result.oops);
  }, t);
}

function orderRound(wrap, ctx, { prompt, extra }, next) {
  const k = kitchen();
  k.reset();
  let placed = null;
  const board = orderBoard({
    steps: STEPS, rand: ctx.rand,
    onFull(order) { placed = order; go.disabled = false; },
  });
  const go = button('▶ Coba', () => {
    if (!placed) return;
    go.disabled = true;
    board.lock();
    const result = cook(placed);
    playKitchen(k, result, (ok) => {
      const extraWrong = ok && extra && !extra.ok(placed);
      if (ok && !extraWrong) { next(); return; }
      if (extraWrong) k.show(result.frames[result.frames.length - 1], extra.msg, 'bad');
      ctx.mistake();
      setTimeout(() => {
        wrap.querySelectorAll('.ocard').forEach((c) => c.classList.remove('locked'));
        go.disabled = false;
      }, 900);
    });
  }, 'primary');
  go.disabled = true;
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'order-layout resep-layout' }, board.node, el('div', { class: 'order-side' }, k.node, go)));
}

const QUESTIONS = [
  {
    prompt: 'Apa yang terjadi jika gula dimasukkan SETELAH teh dituang ke gelas berisi es?',
    options: [['⬇️', 'gula mengendap di dasar gelas'], ['🍯', 'teh menjadi lebih manis'], ['💧', 'es batu langsung mencair']],
  },
  {
    prompt: 'Apa yang terjadi jika kantong teh TIDAK diangkat dan dibiarkan lama sekali?',
    options: [['😖', 'teh sangat pekat dan pahit'], ['🧊', 'teh menjadi dingin'], ['🍬', 'teh menjadi manis']],
  },
  {
    prompt: 'Langkah mana yang boleh dikerjakan lebih awal tanpa mengubah hasil?',
    options: [['🧊', 'masukkan es batu ke gelas'], ['🫗', 'tuang teh manis ke gelas berisi es']],
  },
];

const PLAN = [
  { kind: 'urut', prompt: 'Kartu resep Pak Joko tercampur! Seret kartu ke nomor 1 sampai 6, lalu tekan Coba.' },
  { kind: 'tanya', q: 0 },
  { kind: 'tanya', q: 1 },
  { kind: 'tanya', q: 2 },
  {
    kind: 'urut', prompt: 'Susun lagi, tetapi kali ini es batu dimasukkan di langkah pertama!',
    extra: { ok: (order) => STEPS[order[0]].key === 'es', msg: 'Es teh jadi, tetapi es batu belum di langkah pertama. Coba pindahkan!' },
  },
];

export default {
  id: 'sda-04-resep',
  title: 'Resep Es Teh',
  topic: 'Urutan instruksi',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🥤',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid mengurutkan langkah resep, melihat akibat urutan yang salah, dan membedakan langkah yang boleh ditukar dengan yang tidak.',
  extraModes: [{ id: 'tukar', icon: '🔀', label: 'Tukar Kartu', desc: 'Satu tim diam-diam menukar dua kartu, tim lain mencari dan memperbaikinya', create: createSwap }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act resep' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1600); };
      const p = PLAN[r] || PLAN[0];
      if (p.kind === 'urut') { orderRound(wrap, ctx, p, next); return; }
      const q = QUESTIONS[p.q];
      choice(wrap, {
        prompt: q.prompt, ctx, onRight: next, columns: q.options.length,
        options: ctx.rand.shuffle(q.options.map(([icon, label], i) => ({ icon, label, correct: i === 0 }))),
      });
    }
    render();
  },
};

// Tukar Kartu: the right recipe is shown; team 1 taps two cards to swap them
// in secret, team 2 runs it, finds the swapped pair and swaps it back.
function createSwap(root, ctx) {
  const wrap = el('div', { class: 'act resep' });
  root.append(wrap);
  function list(order, onPick, picked = []) {
    return el('div', { class: 'recipe-list' }, order.map((s, i) => onTap(el('button', { class: `recipe-card ${picked.includes(i) ? 'on' : ''}`, type: 'button' },
      el('b', null, i + 1), el('span', { class: 'ocard-icon' }, STEPS[s].icon), el('span', null, STEPS[s].label)), () => onPick(i))));
  }
  function hide() {
    const order = [0, 1, 2, 3, 4, 5];
    const picked = [];
    const msg = el('p', { class: 'reveal' });
    const holder = el('div');
    const draw = () => holder.replaceChildren(list(order, (i) => {
      if (picked.includes(i)) picked.splice(picked.indexOf(i), 1); else picked.push(i);
      if (picked.length === 2) {
        const swapped = order.slice();
        [swapped[picked[0]], swapped[picked[1]]] = [swapped[picked[1]], swapped[picked[0]]];
        if (!cook(swapped).oops) { msg.textContent = 'Urutannya masih benar setelah ditukar! Pilih dua kartu lain.'; picked.length = 0; draw(); return; }
        hunt(swapped);
        return;
      }
      draw();
    }, picked));
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim lain menutup mata! Ini resep yang benar. Ketuk dua kartu untuk menukarnya diam-diam.'), holder, msg);
  }
  function hunt(order) {
    const k = kitchen();
    k.reset();
    const picked = [];
    const holder = el('div');
    const draw = () => holder.replaceChildren(list(order, (i) => {
      if (picked.includes(i)) picked.splice(picked.indexOf(i), 1); else picked.push(i);
      if (picked.length === 2) {
        [order[picked[0]], order[picked[1]]] = [order[picked[1]], order[picked[0]]];
        picked.length = 0;
        ctx.sound.tap();
      }
      draw();
    }, picked));
    draw();
    const run = button('▶ Coba', () => {
      run.disabled = true;
      playKitchen(k, cook(order), (ok) => {
        run.disabled = false;
        if (ok) { ctx.sound.win(); wrap.append(button('Teka-teki baru', hide, 'primary')); } else shake(holder);
      });
    }, 'primary');
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Buka mata! Tekan Coba untuk melihat akibatnya. Lalu ketuk dua kartu yang tertukar untuk memperbaikinya.'),
      el('div', { class: 'order-layout resep-layout' }, holder, el('div', { class: 'order-side' }, k.node, run)));
  }
  hide();
}
