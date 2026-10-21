// Cari Rumah Pak RT — SD Lanjut (10–12 tahun), pencarian berurutan dan biner.
// House numbers are covered; knock on a door to see its number. On Kampung
// Lama the numbers are in any order, on Perumahan Baru they go up, so you
// can start in the middle and rule out half the street with every knock.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

const LAMA = [8, 23, 4, 17, 31, 12, 26, 2, 19, 35, 6, 28, 14, 10, 21];
const BARU = [3, 5, 9, 11, 14, 18, 20, 24, 27, 30, 33, 36, 40, 42, 45];
const HOUSE_COLORS = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4'];

// Most knocks needed with "start in the middle" for n houses.
export const maxKnocks = (n) => Math.ceil(Math.log2(n + 1));

// A street of covered houses. `sorted` dims the houses that can no longer
// hold the target; "Tidak ada" ends the search when the target is absent.
function street(wrap, ctx, { numbers, target, sorted, name, next }) {
  const n = numbers.length;
  let lo = 0;
  let hi = n - 1;
  let knocks = 0;
  let done = false;
  const opened = new Set();
  const counter = el('span', { class: 'open-count' }, 'Ketukan: 0');
  const msg = el('p', { class: 'reveal' });
  const houses = numbers.map((num, i) => {
    const h = el('button', { class: `house ${sorted ? 'same' : ''}`, type: 'button', style: { '--h': sorted ? '#cbd5e1' : HOUSE_COLORS[(i * 3) % HOUSE_COLORS.length] }, 'aria-label': `rumah urutan ${i + 1}` },
      el('span', { class: 'roof' }), el('span', { class: 'plate' }, '?'), el('small', null, i + 1));
    return onTap(h, () => knock(i));
  });
  const absent = !numbers.includes(target);
  function finish(text) {
    done = true;
    msg.className = 'reveal';
    msg.textContent = text;
    next();
  }
  function knock(i) {
    if (done || opened.has(i)) return;
    if (sorted && (i < lo || i > hi)) { ctx.mistake(); shake(houses[i]); return; }
    opened.add(i);
    knocks++;
    counter.textContent = `Ketukan: ${knocks}`;
    houses[i].querySelector('.plate').textContent = numbers[i];
    houses[i].classList.add('open');
    ctx.sound.tap();
    if (numbers[i] === target) {
      houses[i].classList.add('found');
      finish(`Ketemu! Nomor ${target} ada di urutan ${i + 1}, dengan ${knocks} ketukan.`);
      return;
    }
    if (sorted) {
      if (target < numbers[i]) hi = Math.min(hi, i - 1); else lo = Math.max(lo, i + 1);
      houses.forEach((h, k) => h.classList.toggle('out', (k < lo || k > hi) && !opened.has(k)));
      msg.className = 'reveal';
      msg.textContent = target < numbers[i] ? `${numbers[i]} terlalu besar: cari ke kiri ⬅️` : `${numbers[i]} terlalu kecil: cari ke kanan ➡️`;
    }
  }
  const none = button('🚫 Nomor ini tidak ada', () => {
    if (done) return;
    const sure = sorted ? lo > hi : opened.size === n;
    if (!absent || !sure) {
      ctx.mistake();
      msg.className = 'reveal bad';
      msg.textContent = absent ? 'Belum bisa yakin: masih ada rumah yang mungkin.' : 'Nomor itu ada di jalan ini!';
      return;
    }
    finish(`Benar, nomor ${target} tidak ada. Yakin setelah ${knocks} ketukan.`);
  }, 'small');
  wrap.append(
    el('p', { class: 'prompt' }, `${name}: cari rumah nomor ${target}. Ketuk sesedikit mungkin!`),
    el('div', { class: `street ${n > 15 ? 'long' : ''}`, style: { '--n': Math.min(n, n > 31 ? 21 : n > 15 ? 16 : n) } }, houses),
    el('div', { class: 'row' }, counter, none, sorted ? el('small', { class: 'small-note' }, 'Nomor rumah urut dari kecil ke besar') : el('small', { class: 'small-note' }, 'Nomor rumah acak')),
    msg);
}

function randomStreet(rand, n, sorted) {
  const pool = rand.shuffle(Array.from({ length: n * 3 }, (_, i) => i + 1)).slice(0, n);
  return sorted ? pool.sort((a, b) => a - b) : pool;
}
function randomTarget(rand, numbers) {
  if (rand.next() < 0.2) {
    const missing = Array.from({ length: Math.max(...numbers) }, (_, i) => i + 1).filter((x) => !numbers.includes(x));
    if (missing.length) return rand.pick(missing);
  }
  return rand.pick(numbers);
}

export default {
  id: 'sdl-07-cari-rumah',
  title: 'Cari Rumah Pak RT',
  topic: 'Pencarian berurutan dan biner',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🏘️',
  source: { name: 'CS Unplugged: Searching Algorithms', url: 'https://www.csunplugged.org/en/topics/searching-algorithms/' },
  rounds: 7,
  maxPlayers: 4,
  goal: 'Murid mencari rumah satu per satu pada nomor acak, lalu mulai dari tengah pada nomor yang urut, dan menemukan pola banyaknya ketukan.',
  extraModes: [{ id: 'jalan', icon: '🛣️', label: 'Pilih Jalan', desc: 'Pilih 7, 15, 31, atau 63 rumah, acak atau urut, lalu cari nomor yang ditentukan layar', create: createStreet }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rumah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2400); };
      if (r === 0) street(wrap, ctx, { numbers: LAMA, target: 26, sorted: false, name: 'Jalan Kampung Lama', next });
      else if (r === 1) street(wrap, ctx, { numbers: BARU, target: 33, sorted: true, name: 'Jalan Perumahan Baru', next });
      else if (r === 2) street(wrap, ctx, { numbers: BARU, target: 7, sorted: true, name: 'Perumahan Baru. Kalau nomornya tidak ada, tekan "tidak ada"', next });
      else if (r === 3) {
        choice(wrap, {
          prompt: 'Mengapa cara "mulai dari tengah" tidak bisa dipakai di Kampung Lama?', ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { label: 'Nomornya acak, jadi satu nomor tidak memberi tahu harus ke kiri atau ke kanan', correct: true },
            { label: 'Rumahnya terlalu banyak' },
            { label: 'Rumah di tengah selalu kosong' },
          ]),
        });
      } else if (r === 4) {
        choice(wrap, {
          prompt: '1 rumah: 1 ketukan · 3: 2 · 7: 3 · 15: 4. Dengan cara "mulai dari tengah", 31 rumah paling banyak berapa ketukan?', ctx, onRight: next, columns: 4,
          options: [5, 8, 16, 31].map((x) => ({ label: String(x), correct: x === maxKnocks(31) })),
        });
      } else {
        // Race panes alternate streets and swap every round.
        const sorted = (r + ctx.player) % 2 === 1;
        const nums = randomStreet(ctx.rand, 15, sorted);
        street(wrap, ctx, { numbers: nums, target: randomTarget(ctx.rand, nums), sorted, name: sorted ? 'Perumahan Baru' : 'Kampung Lama', next });
      }
    }
    render();
  },
};

// Pilih Jalan: choose length and street type; search a random number.
function createStreet(root, ctx) {
  const wrap = el('div', { class: 'act rumah' });
  root.append(wrap);
  let n = 15;
  let sorted = true;
  function go() {
    wrap.replaceChildren(el('div', { class: 'row' },
      [7, 15, 31, 63].map((k) => button(`${k} rumah`, () => { n = k; go(); }, k === n ? 'small on' : 'small')),
      button('Acak', () => { sorted = false; go(); }, sorted ? 'small' : 'small on'),
      button('Urut', () => { sorted = true; go(); }, sorted ? 'small on' : 'small'),
      el('small', { class: 'small-note' }, sorted ? `Paling banyak ${maxKnocks(n)} ketukan` : `Paling banyak ${n} ketukan`)));
    const nums = randomStreet({ shuffle: (a) => a.sort(() => Math.random() - 0.5) }, n, sorted);
    const target = Math.random() < 0.2 ? Math.max(...nums) + 1 : nums[Math.floor(Math.random() * n)];
    street(wrap, ctx, { numbers: nums, target, sorted, name: sorted ? 'Perumahan Baru' : 'Kampung Lama', next: () => { ctx.sound.win(); wrap.append(button('Cari lagi', go, 'primary')); } });
  }
  go();
}
