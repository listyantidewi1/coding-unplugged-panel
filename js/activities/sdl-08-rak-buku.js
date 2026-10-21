// Rak Buku Perpustakaan — SD Lanjut (10–12 tahun), algoritma pengurutan.
// Eight new books, call numbers hidden. Only two can be compared at a time.
// Cara A: find the smallest, again and again (selection sort).
// Cara B: insert each book into the shelf (insertion sort).
// Count the comparisons and see which way suits an almost tidy shelf.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

const TITLES = {
  641: 'Resep Jajanan Pasar', 398: 'Cerita Rakyat Nusantara', 912: 'Atlas Indonesia', 428: 'Bahasa Inggris untuk Anak',
  745: 'Kerajinan dari Barang Bekas', 372: 'Belajar di Sekolah', 595: 'Dunia Serangga', 520: 'Mengenal Bintang',
};
const ARRIVE = [641, 398, 912, 428, 745, 372, 595, 520];
const ALMOST = [372, 398, 428, 595, 520, 641, 745, 912];
const REVERSED = ARRIVE.slice().sort((a, b) => b - a);
const SPINE = ['#b91c1c', '#1d4ed8', '#15803d', '#a16207', '#7e22ce', '#0f766e', '#c2410c', '#be185d'];
const spineColor = (n) => SPINE[Object.keys(TITLES).indexOf(String(n)) % SPINE.length] || SPINE[n % SPINE.length];

// Comparisons each way needs.
export const countA = (a) => (a.length * (a.length - 1)) / 2;
export function countB(a) {
  const shelf = [];
  let n = 0;
  for (const x of a) {
    let i = shelf.length;
    while (i > 0) { n++; if (shelf[i - 1] > x) i--; else break; }
    shelf.splice(i, 0, x);
  }
  return n;
}

function book(n, { open = true, cls = '' } = {}) {
  return el('div', { class: `book-spine ${open ? '' : 'closed'} ${cls}`, 'data-n': n, style: { '--c': spineColor(n) } },
    el('b', null, open ? n : '?'), el('small', null, open ? (TITLES[n] || '') : ''));
}

// Cara A, guided: the book in hand meets each book on the table; tap
// "Tukar" when the table book is smaller, "Tidak" otherwise.
function caraA(wrap, ctx, data, next, prompt = 'Cara A: cari yang terkecil. Buku di tangan bertemu buku di meja.') {
  let table = data.slice();
  let shelf = [];
  let hand = table.shift();
  let k = 0;
  let count = 0;
  const handEl = el('div', { class: 'hand' });
  const tableEl = el('div', { class: 'book-row' });
  const shelfEl = el('div', { class: 'shelf' });
  const counter = el('span', { class: 'open-count' });
  const msg = el('p', { class: 'reveal' });
  const rows = el('tbody');
  let round = 1;
  let roundCount = 0;
  function draw() {
    handEl.replaceChildren(el('small', null, '✋ di tangan'), book(hand, { cls: 'pair' }));
    tableEl.replaceChildren(...table.map((n, i) => book(n, { open: i === k, cls: i === k ? 'pair' : '' })));
    shelfEl.replaceChildren(...shelf.map((n) => book(n, { cls: 'mini' })), ...Array.from({ length: data.length - shelf.length }, () => el('div', { class: 'book-slot' })));
    counter.textContent = `Perbandingan: ${count}`;
  }
  function advance() {
    k++;
    if (k < table.length) { draw(); return; }
    shelf.push(hand);
    rows.append(el('tr', null, el('td', { class: 'num' }, round), el('td', { class: 'num' }, roundCount), el('td', { class: 'num' }, hand)));
    round++;
    roundCount = 0;
    if (table.length === 0) { draw(); finish(); return; }
    hand = table.shift();
    k = 0;
    if (table.length === 0) {
      shelf.push(hand);
      rows.append(el('tr', null, el('td', { class: 'num' }, round), el('td', null, '—'), el('td', { class: 'num' }, hand)));
      draw();
      finish();
      return;
    }
    draw();
  }
  function finish() {
    tools.hidden = true;
    msg.textContent = `Rak rapi! Cara A memakai ${count} perbandingan.`;
    next(count);
  }
  function act(swap) {
    if (tools.hidden) return;
    const smaller = table[k] < hand;
    if (swap !== smaller) {
      ctx.mistake();
      shake(tableEl.children[k]);
      msg.className = 'reveal bad';
      msg.textContent = smaller ? `${table[k]} lebih kecil dari ${hand}: tukar!` : `${table[k]} lebih besar: tidak perlu ditukar.`;
      return;
    }
    msg.className = 'reveal';
    msg.textContent = '';
    count++;
    roundCount++;
    ctx.sound.tap();
    if (swap) [hand, table[k]] = [table[k], hand];
    advance();
  }
  const tools = el('div', { class: 'row' }, button('🔁 Tukar (buku meja lebih kecil)', () => act(true), 'primary'), button('➡️ Tidak tukar', () => act(false)), counter);
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'rak-layout' }, handEl, tableEl),
    tools, msg,
    el('div', { class: 'rak-layout' }, el('div', { class: 'shelf-wrap' }, el('small', null, 'Rak'), shelfEl),
      el('table', { class: 'count-table rounds' }, el('thead', null, el('tr', null, el('td', null, 'Putaran'), el('td', null, 'Turus'), el('td', null, 'Ke rak'))), rows)));
}

// Cara B, guided: the next book walks left along the shelf; "Geser" while
// the shelf book is bigger, "Sisipkan" when it is not (or at the start).
function caraB(wrap, ctx, data, next, prompt = 'Cara B: sisipkan satu per satu. Bandingkan dengan buku di rak, dari kanan.') {
  const queue = data.slice();
  const shelf = [queue.shift()];
  let cur = queue.shift();
  let pos = shelf.length;
  let count = 0;
  let curCount = 0;
  const shelfEl = el('div', { class: 'shelf' });
  const queueEl = el('div', { class: 'book-row' });
  const counter = el('span', { class: 'open-count' });
  const msg = el('p', { class: 'reveal' });
  const rows = el('tbody', null, el('tr', null, el('td', { class: 'num' }, shelf[0]), el('td', null, '—'), el('td', null, shelf[0])));
  function draw() {
    const items = shelf.map((n, i) => book(n, { cls: i === pos - 1 ? 'pair' : '' }));
    items.splice(pos, 0, book(cur, { cls: 'pair inserting' }));
    shelfEl.replaceChildren(...items);
    queueEl.replaceChildren(...queue.map((n) => book(n, { open: false })));
    counter.textContent = `Perbandingan: ${count}`;
  }
  function place() {
    shelf.splice(pos, 0, cur);
    rows.append(el('tr', null, el('td', { class: 'num' }, cur), el('td', { class: 'num' }, curCount), el('td', null, shelf.join(' '))));
    ctx.sound.good();
    if (!queue.length) {
      tools.hidden = true;
      shelfEl.replaceChildren(...shelf.map((n) => book(n)));
      queueEl.replaceChildren();
      msg.className = 'reveal';
      msg.textContent = `Rak rapi! Cara B memakai ${count} perbandingan.`;
      next(count);
      return;
    }
    cur = queue.shift();
    pos = shelf.length;
    curCount = 0;
    draw();
  }
  function act(shift) {
    if (tools.hidden) return;
    if (pos === 0) {
      if (shift) { ctx.mistake(); msg.className = 'reveal bad'; msg.textContent = 'Sudah di ujung kiri: sisipkan!'; return; }
      place();
      return;
    }
    const bigger = shelf[pos - 1] > cur;
    if (shift !== bigger) {
      ctx.mistake();
      shake(shelfEl);
      msg.className = 'reveal bad';
      msg.textContent = bigger ? `${shelf[pos - 1]} lebih besar dari ${cur}: geser ke kiri.` : `${shelf[pos - 1]} lebih kecil: sisipkan di sini.`;
      return;
    }
    msg.textContent = '';
    count++;
    curCount++;
    ctx.sound.tap();
    if (shift) { pos--; draw(); } else place();
  }
  const tools = el('div', { class: 'row' }, button('⬅️ Geser (buku rak lebih besar)', () => act(true), 'primary'), button('📥 Sisipkan di sini', () => act(false)), counter);
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'rak-layout' }, el('div', { class: 'shelf-wrap' }, el('small', null, 'Rak'), shelfEl), el('div', { class: 'shelf-wrap' }, el('small', null, 'Belum disusun'), queueEl)),
    tools, msg,
    el('table', { class: 'count-table rounds' }, el('thead', null, el('tr', null, el('td', null, 'Disisipkan'), el('td', null, 'Turus'), el('td', null, 'Isi rak'))), rows));
}

// Free sorting: books are closed; tap two to peek and compare, drag books
// onto the shelf. Solved when the shelf is full and in order.
function freeSort(wrap, ctx, data, next, prompt = 'Susun buku di rak dari nomor terkecil. Ketuk dua buku untuk membandingkan, lalu seret ke rak.') {
  let peek = [];
  let count = 0;
  let done = false;
  const counter = el('span', { class: 'open-count' }, 'Perbandingan: 0');
  const msg = el('p', { class: 'reveal' });
  const table = el('div', { class: 'book-row table-row' });
  const slots = data.map((_, i) => el('div', { class: 'book-slot', 'data-drop': i }));
  const shelf = el('div', { class: 'shelf' }, slots);
  const nodes = data.map((n) => {
    const b = book(n, { open: false });
    b.dataset.drag = '';
    b.addEventListener('pointerup', () => tapPeek(b));
    return b;
  });
  table.append(...nodes);
  let downAt = 0;
  function show(b, on) {
    const n = Number(b.dataset.n);
    b.replaceChildren(el('b', null, on ? n : '?'), el('small', null, on ? (TITLES[n] || '') : ''));
    b.classList.toggle('closed', !on);
  }
  function tapPeek(b) {
    if (done || b.classList.contains('dragging') || performance.now() - downAt > 400) return;
    if (peek.includes(b)) return;
    peek.push(b);
    show(b, true);
    if (peek.length === 2) {
      count++;
      counter.textContent = `Perbandingan: ${count}`;
      ctx.sound.tap();
      const pair = peek;
      peek = [];
      setTimeout(() => pair.forEach((x) => show(x, false)), 1300);
    }
  }
  wrap.addEventListener('pointerdown', () => { downAt = performance.now(); }, true);
  dnd(wrap, (item, slot) => {
    if (done) return;
    const old = slot.firstElementChild;
    const from = item.parentElement;
    slot.append(item);
    if (old && from) from.append(old);
    ctx.sound.tap();
    if (slots.every((s) => s.firstElementChild)) {
      const order = slots.map((s) => Number(s.firstElementChild.dataset.n));
      if (order.every((x, i) => i === 0 || order[i - 1] <= x)) {
        done = true;
        nodes.forEach((x) => { show(x, true); x.classList.add('locked'); });
        msg.className = 'reveal';
        msg.textContent = `Rak rapi dengan ${count} perbandingan!`;
        next(count);
      } else {
        ctx.mistake();
        shake(shelf);
        msg.className = 'reveal bad';
        msg.textContent = 'Rak sudah penuh tetapi belum urut. Bandingkan lagi dan tukar posisinya.';
      }
    }
  });
  wrap.append(el('p', { class: 'prompt' }, prompt), table, el('div', { class: 'shelf-wrap' }, el('small', null, 'Rak (kiri = terkecil)'), shelf), el('div', { class: 'row' }, counter), msg);
}

export default {
  id: 'sdl-08-rak-buku',
  title: 'Rak Buku Perpustakaan',
  topic: 'Algoritma pengurutan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '📚',
  source: { name: 'CS Unplugged: Sorting Algorithms', url: 'https://www.csunplugged.org/en/topics/sorting-algorithms/' },
  rounds: 6,
  maxPlayers: 4,
  goal: 'Murid mengurutkan buku dengan dua cara (cari yang terkecil dan sisipkan satu per satu), menghitung perbandingan, dan memilih cara yang cocok untuk rak yang hampir rapi.',
  extraModes: [
    { id: 'bebas', icon: '📖', label: 'Rak Bebas', desc: 'Buku tertutup, bandingkan dua sekaligus lalu seret ke rak; pilih urutan datang, hampir rapi, atau terbalik', create: createFree },
    { id: 'duel', icon: '⚖️', label: 'Cara A lawan Cara B', desc: 'Dua tim merapikan rak yang sama, satu dengan Cara A dan satu dengan Cara B; bandingkan jumlah perbandingannya', create: createDuel },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rak' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2600); };
      if (r === 0) caraA(wrap, ctx, ARRIVE, next);
      else if (r === 1) caraB(wrap, ctx, ARRIVE, next);
      else if (r === 2) {
        choice(wrap, {
          prompt: 'Rak hampir rapi: 372 398 428 595 520 641 745 912. Berapa perbandingan dengan Cara B?', ctx, onRight: next, columns: 4,
          options: [8, 14, 21, 28].map((x) => ({ label: String(x), correct: x === countB(ALMOST) })),
        });
      } else if (r === 3) {
        choice(wrap, {
          prompt: `Rak hampir rapi: Cara A tetap ${countA(ALMOST)} perbandingan, Cara B hanya ${countB(ALMOST)}. Cara mana yang lebih cocok untuk rak yang hampir rapi?`, ctx, onRight: next, columns: 2,
          options: [{ label: 'Cara A: cari yang terkecil' }, { label: 'Cara B: sisipkan satu per satu', correct: true }],
        });
      } else {
        const nums = ctx.rand.shuffle(Array.from({ length: 90 }, (_, i) => 100 + i * 10)).slice(0, 6);
        if (r % 2) caraB(wrap, ctx, nums, next, 'Cara B dengan buku lain.');
        else caraA(wrap, ctx, nums, next, 'Cara A dengan buku lain.');
      }
    }
    render();
  },
};

function createFree(root, ctx) {
  const wrap = el('div', { class: 'act rak' });
  root.append(wrap);
  const sets = [['Urutan datang', ARRIVE], ['Hampir rapi', ALMOST], ['Terbalik', REVERSED]];
  function go(k) {
    wrap.replaceChildren(el('div', { class: 'row' }, sets.map(([label], j) => button(label, () => go(j), j === k ? 'small on' : 'small'))));
    const inner = el('div', { class: 'rak-inner' });
    wrap.append(inner);
    freeSort(inner, ctx, sets[k][1], () => { ctx.sound.win(); });
  }
  go(0);
}

function createDuel(root, ctx) {
  const wrap = el('div', { class: 'act rak duel' });
  root.append(wrap);
  const sets = [['Urutan datang', ARRIVE], ['Hampir rapi', ALMOST], ['Terbalik', REVERSED]];
  let k = 0;
  const result = el('p', { class: 'reveal' });
  function go() {
    const counts = [null, null];
    const left = el('div', { class: 'pair-side', style: { '--player': '#2563eb' } });
    const right = el('div', { class: 'pair-side', style: { '--player': '#ea580c' } });
    const report = () => {
      if (counts.includes(null)) return;
      ctx.sound.win();
      result.textContent = `Cara A: ${counts[0]} perbandingan · Cara B: ${counts[1]} perbandingan`;
    };
    caraA(left, ctx, sets[k][1], (n) => { counts[0] = n; report(); }, 'Tim A: cari yang terkecil');
    caraB(right, ctx, sets[k][1], (n) => { counts[1] = n; report(); }, 'Tim B: sisipkan satu per satu');
    result.textContent = '';
    wrap.replaceChildren(el('div', { class: 'duel-bar row' }, sets.map(([label], j) => button(label, () => { k = j; go(); }, j === k ? 'small on' : 'small')), result), el('div', { class: 'pair' }, left, right));
  }
  go();
}
