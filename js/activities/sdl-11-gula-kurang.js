// Satu Kantong Gula yang Kurang — SD Lanjut (10–12 tahun), dekomposisi dan
// strategi. One bag is lighter. A balance only says "seimbang", "kiri lebih
// ringan" or "kanan lebih ringan". Splitting into three equal groups finds
// it among 9 bags in 2 weighings, among 27 in 3.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

const NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nameOf = (i, n) => (n <= 26 ? NAMES[i] : String(i + 1));
export const minWeighings = (n) => Math.ceil(Math.log(n) / Math.log(3) - 1e-9);
const RESULT_TEXT = { '=': 'seimbang', L: 'kiri lebih ringan', R: 'kanan lebih ringan' };

// The secret keeper. Fair mode fixes the light bag at the start; "licik"
// mode keeps every bag possible and picks the answer that leaves the most.
export function keeper(n, { light = null, sly = false } = {}) {
  let possible = new Set(Array.from({ length: n }, (_, i) => i));
  return {
    possible: () => [...possible],
    weigh(left, right) {
      const inL = left.filter((b) => possible.has(b));
      const inR = right.filter((b) => possible.has(b));
      const out = [...possible].filter((b) => !left.includes(b) && !right.includes(b));
      let res;
      if (sly) {
        const opts = [['=', out], ['L', inL], ['R', inR]].sort((a, b) => b[1].length - a[1].length);
        res = opts[0][0];
      } else res = left.includes(light) ? 'L' : right.includes(light) ? 'R' : '=';
      possible = new Set(res === '=' ? out : res === 'L' ? inL : inR);
      return res;
    },
    light: () => (sly ? (possible.size === 1 ? [...possible][0] : null) : light),
  };
}

// The balance: bags in a tray, drag to the left or right pan, "Timbang".
function balance(wrap, ctx, { n, sly = false, light, prompt, limit = 0, next }) {
  const k = keeper(n, { light, sly });
  let count = 0;
  let done = false;
  const bags = Array.from({ length: n }, (_, i) => el('div', { class: 'bag', 'data-drag': '', 'data-i': i }, el('span', null, nameOf(i, n))));
  const zone = (key, label) => el('div', { class: `pan-zone ${key}`, 'data-drop': key }, el('small', null, label), el('div', { class: 'pan-bags' }));
  const left = zone('kiri', 'Lengan kiri');
  const right = zone('kanan', 'Lengan kanan');
  const out = zone('luar', 'Di luar');
  out.querySelector('.pan-bags').append(...bags);
  const beam = el('div', { class: 'scale-beam' });
  const counter = el('span', { class: 'open-count' }, 'Menimbang: 0');
  const msg = el('p', { class: 'reveal' });
  const rows = el('tbody');
  const ids = (z) => [...z.querySelectorAll('.bag')].map((b) => Number(b.dataset.i));
  dnd(wrap, (item, z) => {
    if (done) return;
    z.querySelector('.pan-bags').append(item);
    ctx.sound.tap();
    beam.style.setProperty('--tilt', '0deg');
  });
  const weigh = button('⚖️ Timbang', () => {
    if (done) return;
    const L = ids(left);
    const R = ids(right);
    if (!L.length || L.length !== R.length) {
      ctx.sound.bad();
      shake(beam);
      msg.className = 'reveal bad';
      msg.textContent = 'Jumlah kantong di kiri dan kanan harus sama banyak (dan tidak kosong).';
      return;
    }
    const res = k.weigh(L, R);
    count++;
    counter.textContent = `Menimbang: ${count}`;
    beam.style.setProperty('--tilt', res === '=' ? '0deg' : res === 'L' ? '8deg' : '-8deg');
    ctx.sound.tap();
    msg.className = 'reveal info';
    msg.textContent = `Hasil: ${RESULT_TEXT[res]}.`;
    const names = (a) => a.map((i) => nameOf(i, n)).join(' ');
    rows.append(el('tr', null, el('td', { class: 'num' }, count), el('td', null, names(L)), el('td', null, names(R)), el('td', null, names(ids(out))),
      el('td', null, RESULT_TEXT[res]), el('td', null, names(k.possible()))));
  }, 'primary');
  let pointing = false;
  const point = button('👉 Ini yang kurang!', () => { pointing = !pointing; point.classList.toggle('on', pointing); msg.className = 'reveal info'; msg.textContent = pointing ? 'Ketuk kantong yang kurang.' : ''; }, 'small');
  bags.forEach((b) => b.addEventListener('pointerup', () => {
    if (!pointing || done) return;
    const i = Number(b.dataset.i);
    const poss = k.possible();
    if (poss.length > 1 || poss[0] !== i) {
      ctx.mistake();
      shake(b);
      msg.className = 'reveal bad';
      msg.textContent = poss.length > 1 ? 'Belum pasti! Masih ada beberapa kantong yang mungkin. Timbang lagi.' : 'Bukan kantong itu. Lihat hasil timbanganmu.';
      return;
    }
    done = true;
    b.classList.add('found');
    point.classList.remove('on');
    const over = limit && count > limit;
    if (over) ctx.mistake();
    msg.className = over ? 'reveal bad' : 'reveal';
    msg.textContent = over ? `Ketemu ${nameOf(i, n)}, tetapi dengan ${count} kali menimbang. Bisa cukup ${limit} kali!` : `Ketemu: kantong ${nameOf(i, n)}, dengan ${count} kali menimbang.`;
    next?.(count);
  }));
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'scale-yard' }, el('div', { class: 'scale-top' }, left, el('div', { class: 'scale-mid' }, beam, el('i', { class: 'scale-post' })), right), out),
    el('div', { class: 'row' }, weigh, point, counter, sly ? el('small', { class: 'sly' }, '😈 Mode Licik') : null),
    msg,
    el('table', { class: 'count-table rounds gula-log' }, el('thead', null, el('tr', null, ['Ke-', 'Kiri', 'Kanan', 'Di luar', 'Hasil', 'Masih mungkin'].map((h) => el('td', null, h)))), rows));
}

export default {
  id: 'sdl-11-gula-kurang',
  title: 'Satu Kantong Gula yang Kurang',
  topic: 'Dekomposisi dan strategi',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '⚖️',
  source: null,
  rounds: 7,
  maxPlayers: 4,
  goal: 'Murid menemukan kantong yang lebih ringan dengan menimbang sesedikit mungkin, membandingkan cara dua kelompok dan tiga kelompok, dan menemukan pola kelipatan tiga.',
  extraModes: [
    { id: 'timbangan', icon: '⚖️', label: 'Timbangan Virtual', desc: 'Pilih 8, 9, 12, atau 27 kantong; nyalakan Mode Licik untuk menguji rencana terbaik', create: createFree },
    { id: 'rencana', icon: '📝', label: 'Rencana Jika–Maka', desc: 'Satu tim menyusun rencana 9 kantong, tim lain diam-diam memilih kantong yang kurang; layar menjalankan rencananya', create: createPlan },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gula' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2600); };
      if (r === 0) balance(wrap, ctx, { n: 3, light: ctx.rand.int(0, 2), limit: 1, prompt: 'Tiga kantong A, B, C. Temukan yang kurang dengan sekali menimbang.', next });
      else if (r === 1) balance(wrap, ctx, { n: 9, light: ctx.rand.int(0, 8), prompt: 'Cara Dua Kelompok: taruh A B C D di kiri dan E F G H di kanan, I di luar. Lanjutkan sampai ketemu.', next });
      else if (r === 2) balance(wrap, ctx, { n: 9, sly: true, limit: 2, prompt: 'Cara Tiga Kelompok: tiga kelompok sama banyak (kiri, kanan, luar). Penjaga rahasia licik! Bisakah kamu selesai dalam 2 kali?', next });
      else if (r === 3) {
        choice(wrap, {
          prompt: 'Gudang besar: 27 kantong. Paling sedikit berapa kali menimbang?', ctx, onRight: next, columns: 4,
          options: [2, 3, 9, 13].map((x) => ({ label: String(x), correct: x === minWeighings(27) })),
        });
      } else if (r === 4) {
        choice(wrap, {
          prompt: '3 kantong → 1 kali, 9 → 2, 27 → 3. Berapa kali untuk 81 kantong?', ctx, onRight: next, columns: 4,
          options: [4, 5, 9, 27].map((x) => ({ label: String(x), correct: x === minWeighings(81) })),
        });
      } else if (r === 5) {
        choice(wrap, {
          prompt: 'Bagaimana kalau kantongnya 8? Paling sedikit berapa kali menimbang?', ctx, onRight: next, columns: 4,
          options: [2, 3, 4, 8].map((x) => ({ label: String(x), correct: x === minWeighings(8) })),
        });
      } else {
        const n = ctx.rand.pick([9, 12, 27]);
        balance(wrap, ctx, { n, sly: true, limit: minWeighings(n), prompt: `${n} kantong, penjaga licik. Selesaikan dalam ${minWeighings(n)} kali menimbang!`, next });
      }
    }
    render();
  },
};

// Timbangan Virtual: choose the number of bags and the keeper.
function createFree(root, ctx) {
  const wrap = el('div', { class: 'act gula' });
  root.append(wrap);
  let n = 9;
  let sly = false;
  function go() {
    wrap.replaceChildren(el('div', { class: 'row' },
      [8, 9, 12, 27].map((k) => button(`${k} kantong`, () => { n = k; go(); }, k === n ? 'small on' : 'small')),
      button(sly ? '😈 Mode Licik: nyala' : '😇 Mode Licik: mati', () => { sly = !sly; go(); }, sly ? 'small on' : 'small'),
      el('small', { class: 'small-note' }, `Paling sedikit ${minWeighings(n)} kali`)));
    const inner = el('div', { class: 'gula-inner' });
    wrap.append(inner);
    balance(inner, ctx, { n, sly, light: Math.floor(Math.random() * n), prompt: 'Seret kantong ke lengan kiri dan kanan, lalu Timbang.', next: () => { ctx.sound.win(); inner.append(button('Main lagi', go, 'primary')); } });
  }
  go();
}

// Rencana Jika–Maka for 9 bags: weigh A B C against D E F first; for each
// result the planning team picks the second weighing. Another team picks
// the light bag in secret; the screen runs the plan.
function createPlan(root, ctx) {
  const wrap = el('div', { class: 'act gula' });
  root.append(wrap);
  const n = 9;
  const OUTCOMES = [['L', 'Jika kiri lebih ringan'], ['R', 'Jika kanan lebih ringan'], ['=', 'Jika seimbang']];
  const plan = { L: [0, 1], R: [3, 4], '=': [6, 7] };
  const sel = (value, onChange) => {
    const s = el('select', { class: 'sel' }, Array.from({ length: n }, (_, i) => el('option', { value: i, selected: i === value }, NAMES[i])));
    s.addEventListener('change', () => onChange(Number(s.value)));
    return s;
  };
  function edit() {
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim perencana: penimbangan pertama A B C (kiri) dengan D E F (kanan). Lengkapi penimbangan kedua.'),
      el('div', { class: 'plan-cards' }, OUTCOMES.map(([key, label]) => el('div', { class: 'plan-card' }, el('b', null, label),
        el('div', { class: 'row' }, 'timbang', sel(plan[key][0], (v) => { plan[key][0] = v; }), 'dengan', sel(plan[key][1], (v) => { plan[key][1] = v; })),
        el('small', null, 'Jika seimbang: kantong yang tidak ditimbang dari kelompok itu. Jika tidak: yang lebih ringan.')))),
      button('Selesai, giliran tim penjaga ➜', pick, 'primary'));
  }
  function pick() {
    const cells = Array.from({ length: n }, (_, i) => onTap(el('button', { class: 'bag big', type: 'button' }, NAMES[i]), () => runPlan(i)));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim penjaga: tim perencana tutup mata! Ketuk kantong yang kurang.'), el('div', { class: 'row' }, cells));
  }
  function runPlan(light) {
    const steps = [];
    const first = [0, 1, 2].includes(light) ? 'L' : [3, 4, 5].includes(light) ? 'R' : '=';
    steps.push(`1. A B C dengan D E F: ${RESULT_TEXT[first]}.`);
    const group = first === 'L' ? [0, 1, 2] : first === 'R' ? [3, 4, 5] : [6, 7, 8];
    const [a, b] = plan[first];
    const second = light === a ? 'L' : light === b ? 'R' : '=';
    steps.push(`2. ${NAMES[a]} dengan ${NAMES[b]}: ${RESULT_TEXT[second]}.`);
    let answer;
    if (second === 'L') answer = a;
    else if (second === 'R') answer = b;
    else answer = group.find((x) => x !== a && x !== b);
    const ok = answer === light && a !== b && group.includes(a) && group.includes(b);
    if (ok) ctx.sound.win(); else ctx.sound.bad();
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Rencana dijalankan:'),
      el('ol', { class: 'why-list' }, steps.map((s) => el('li', null, s.replace(/^\d\. /, '')))),
      el('p', { class: ok ? 'reveal' : 'reveal bad' }, ok ? `Rencana berhasil: kantong ${NAMES[light]} ketemu dalam 2 kali menimbang!` : `Rencana gagal: kantong yang kurang ${NAMES[light]}, rencana menunjuk ${answer == null ? 'tidak ada' : NAMES[answer]}.`),
      el('div', { class: 'row' }, button('Coba kantong lain', pick, 'primary'), button('Ubah rencana', edit)));
  }
  edit();
}
