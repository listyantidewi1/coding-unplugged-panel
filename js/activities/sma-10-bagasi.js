// Bagasi Mudik Rani — SMA/SMK (16–18 tahun), optimasi: masalah ransel.
// Two greedy rules that fail, brute force over 2^n subsets, dynamic
// programming with a traceback, and the fractional bound.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const OLEH = [['Kue kering', 2, 9, '🍪'], ['Sirup satu dus', 7, 14, '🧃'], ['Gula pasir', 5, 6, '🍚'], ['Kopi bubuk', 3, 12, '☕'], ['Kerupuk', 1, 3, '🍘'], ['Sarung dan baju', 5, 13, '👕']];
export const CAP = 10;
export function greedy(items, cap, key) {
  const order = items.map((it, i) => i).sort((a, b) => key(items[b]) - key(items[a]) || a - b);
  let w = 0;
  const steps = order.map((i) => { const fit = w + items[i][1] <= cap; if (fit) w += items[i][1]; return [i, fit]; });
  const take = steps.filter((s) => s[1]).map((s) => s[0]);
  return { order, steps, take, w, v: take.reduce((s, i) => s + items[i][2], 0) };
}
export const byValue = (it) => it[2];
export const byRatio = (it) => it[2] / it[1];
export function dp(items, cap) {
  const T = [Array(cap + 1).fill(0)];
  items.forEach(([, w, v], i) => T.push(T[i].map((up, k) => (w <= k ? Math.max(up, v + T[i][k - w]) : up))));
  const take = [];
  for (let i = items.length, k = cap; i > 0; i--) if (T[i][k] !== T[i - 1][k]) { take.unshift(i - 1); k -= items[i - 1][1]; }
  return { T, best: T[items.length][cap], take };
}
export function brute(items, cap) {
  let valid = 0;
  let best = 0;
  const n = items.length;
  for (let m = 0; m < 1 << n; m++) { let w = 0; let v = 0; for (let i = 0; i < n; i++) if (m & (1 << (n - 1 - i))) { w += items[i][1]; v += items[i][2]; } if (w <= cap) { valid++; best = Math.max(best, v); } }
  return { total: 1 << n, valid, best };
}
export function fractional(items, cap) { let w = 0; let v = 0; for (const i of greedy(items, Infinity, byRatio).order) { const take = Math.min(items[i][1], cap - w); if (take <= 0) break; w += take; v += (items[i][2] * take) / items[i][1]; } return v; }

const card = (it, i, { on = false, faded = false, mark = '' } = {}) => el('button', { class: `bg-oleh ${on ? 'dibawa' : ''} ${faded ? 'lewat' : ''}`, type: 'button', 'data-i': i }, el('span', { class: 'bg-ikon' }, it[3] || '📦'), el('b', null, it[0]), el('small', null, `${it[1]} kg · nilai ${it[2]}`), mark ? el('em', null, mark) : null);
const scale = (w, v, cap) => el('div', { class: `bg-timbang ${w > cap ? 'lebih' : ''}` }, el('div', { class: 'bg-isi', style: { width: `${Math.min(100, (w / cap) * 100)}%` } }), el('span', null, `${w} / ${cap} kg · nilai ${v}`));

// Tap items in or out of the suitcase.
function suitcase(host, ctx, { items = OLEH, cap = CAP, onChange, locked = () => false }) {
  const inBag = new Set();
  const row = el('div', { class: 'bg-rak' });
  const meter = el('div');
  const w = () => [...inBag].reduce((s, i) => s + items[i][1], 0);
  const v = () => [...inBag].reduce((s, i) => s + items[i][2], 0);
  const s = { inBag, w, v, draw, set(list) { inBag.clear(); list.forEach((i) => inBag.add(i)); draw(); } };
  function draw() {
    row.replaceChildren(...items.map((it, i) => onTap(card(it, i, { on: inBag.has(i) }), () => {
      if (locked()) return;
      if (inBag.has(i)) inBag.delete(i); else inBag.add(i);
      ctx.sound.tap(); draw(); if (onChange) onChange(s);
    })));
    meter.replaceChildren(scale(w(), v(), cap));
  }
  host.append(row, meter);
  draw();
  return s;
}

// Step through a greedy rule: the player says "masuk" or "lewati" each time.
function greedyRound(wrap, ctx, { key, label, done }) {
  const g = greedy(OLEH, CAP, key);
  let k = 0;
  let w = 0;
  const take = [];
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `Urutan: ${label}. Masukkan bila muat; lewati bila melebihi 10 kg.`);
  const draw = () => stage.replaceChildren(
    el('div', { class: 'bg-rak' }, g.order.map((i, j) => card(OLEH[i], i, { on: take.includes(i), faded: j < k && !take.includes(i), mark: j === k ? 'giliran' : `${j + 1}` }))),
    scale(w, take.reduce((s, i) => s + OLEH[i][2], 0), CAP));
  const act = (put) => {
    if (k >= g.order.length) return;
    const [i, fit] = g.steps[k];
    if (put !== fit) { ctx.mistake(); shake(stage); say(msg, 'bad', fit ? `${OLEH[i][0]} masih muat: ${w} + ${OLEH[i][1]} ≤ 10.` : `${OLEH[i][0]} tidak muat: ${w} + ${OLEH[i][1]} > 10.`); return; }
    if (put) { take.push(i); w += OLEH[i][1]; }
    k++;
    ctx.sound.tap();
    draw();
    if (k === g.order.length) { say(msg, '', `Cara rakus ini membawa ${take.map((x) => OLEH[x][0].toLowerCase()).join(', ')}: ${w} kg, nilai ${g.v}.`); done(); }
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Cara rakus: ${label} dulu.`), stage, el('div', { class: 'kode-baris' }, button('Masukkan', () => act(true), 'primary'), button('Lewati', () => act(false))), msg);
}

// Fill DP rows from `from` (1-based item row) to the last, choosing take / skip per cell.
function dpBoard(host, ctx, { from = 6, onDone }) {
  const { T } = dp(OLEH, CAP);
  const mine = T.map((r, i) => (i < from ? [...r] : Array(CAP + 1).fill(null)));
  let row = from;
  let col = 0;
  const grid = el('div', { class: 'bg-dp' });
  const ask = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const [nm, w, v] = OLEH[row - 1] || [];
    const up = row <= OLEH.length ? mine[row - 1][col] : null;
    const left = row <= OLEH.length && w <= col ? mine[row - 1][col - w] : null;
    grid.replaceChildren(el('span', { class: 'bg-dp-kepala' }, 'kg →'), ...Array.from({ length: CAP + 1 }, (_, k) => el('span', { class: 'bg-dp-kepala' }, k)),
      ...mine.flatMap((r, i) => [el('span', { class: 'bg-dp-baris' }, i ? `${i}. ${OLEH[i - 1][0]} (${OLEH[i - 1][1]} kg, ${OLEH[i - 1][2]})` : '(tidak ada)'),
        ...r.map((x, k) => el('span', { class: ['bg-dp-sel', i === row && k === col ? 'kini' : '', i === row - 1 && k === col ? 'atas' : '', i === row - 1 && w <= col && k === col - w ? 'kiri' : ''].join(' ') }, x ?? ''))]));
    if (row > OLEH.length) { ask.replaceChildren(); return; }
    ask.replaceChildren(button(`Tidak bawa: ${up}`, () => pick(up), 'primary'), w <= col ? button(`Bawa: ${v} + ${left} = ${v + left}`, () => pick(v + left), 'primary') : button(`Bawa: tidak muat (${w} kg > ${col} kg)`, () => pick(null)));
    say(msg, 'info', `Baris ${row} (${nm}), bagasi ${col} kg: pilih yang lebih besar.`);
  }
  function pick(x) {
    const want = T[row][col];
    if (x !== want) { ctx.mistake(); shake(grid); say(msg, 'bad', x === null ? 'Tidak muat, jadi hanya bisa "tidak bawa".' : `Pilih yang lebih besar: ${want}.`); return; }
    mine[row][col] = x;
    ctx.sound.tap();
    col++;
    if (col > CAP) { col = 0; row++; }
    draw();
    if (row > OLEH.length) { say(msg, '', `Sel kanan bawah: ${T[OLEH.length][CAP]}.`); onDone(); }
  }
  host.append(el('div', { class: 'bg-dp-gulir' }, grid), ask, msg);
  draw();
}

export default {
  id: 'sma-10-bagasi',
  title: 'Bagasi Mudik Rani',
  topic: 'Masalah ransel: cara rakus, mencoba semua, dan pemrograman dinamis',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mencoba dua cara rakus untuk mengisi bagasi 10 kg dan menemukan di mana keduanya gagal, menghitung banyak kemungkinan bila mencoba semua, mengisi tabel pemrograman dinamis dan menelusuri isinya, serta membandingkan ketiga cara.',
  extraModes: [
    { id: 'koper', icon: '🧳', label: 'Koper Virtual', desc: 'Masukkan atau keluarkan oleh-oleh, jalankan cara rakus langkah demi langkah, dan bandingkan dengan nilai terbaik; daftar lembar kerja atau acak', create: createSuitcase },
    { id: 'dp', icon: '📋', label: 'Tabel Pemrograman Dinamis', desc: 'Isi tabel baris demi baris; layar menyorot dua sel yang dibandingkan dan memeriksa jawabannya', create: createTable },
    { id: 'giliran', icon: '🔁', label: 'Koper Bergiliran', desc: 'Setiap tim punya koper sendiri dan bergantian memasukkan atau mengeluarkan satu oleh-oleh; setelah enam putaran nilai koper dibandingkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bagasi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const list = () => el('div', { class: 'bg-rak' }, OLEH.map((it, i) => card(it, i)));
      if (r === 0) greedyRound(wrap, ctx, { key: byValue, label: 'nilai terbesar', done: next });
      else if (r === 1) ask('Nilai per kg: kue kering 9 : 2 = 4,5. Bagaimana urutan dari nilai per kg terbesar?', [['Kue kering 4,5; kopi 4; kerupuk 3; sarung 2,6; sirup 2; gula 1,2', true], ['Sirup 2; sarung 2,6; kopi 4; kue 4,5; kerupuk 3; gula 1,2'], ['Kopi 4; kue kering 4,5; kerupuk 3; sirup 2; sarung 2,6; gula 1,2'], ['Kerupuk 3; kue kering 4,5; kopi 4; sarung 2,6; gula 1,2; sirup 2']], 1, list(),
        then(() => greedyRound(wrap, ctx, { key: byRatio, label: 'nilai per kg terbesar', done: next })));
      else if (r === 2) {
        const msg = el('p', { class: 'reveal hint' }, 'Cara rakus memberi 26 dan 24. Ketuk oleh-oleh untuk memasukkan atau mengeluarkannya.');
        let finished = false;
        wrap.append(el('p', { class: 'prompt' }, 'Cari isi bagasi bernilai 34 tanpa melebihi 10 kg.'));
        const s = suitcase(wrap, ctx, { locked: () => finished, onChange(st) { if (st.w() <= CAP && st.v() === 34) { finished = true; say(msg, '', 'Nilai 34: kue kering, kopi bubuk, sarung dan baju (10 kg).'); next(); } else if (st.w() > CAP) say(msg, 'bad', 'Lebih dari 10 kg!'); else say(msg, 'info', `Nilai ${st.v()}.`); } });
        wrap.append(el('div', { class: 'kode-baris' }, button('Periksa', () => { if (!finished) { ctx.mistake(); say(msg, 'bad', s.w() > CAP ? 'Terlalu berat.' : `Nilai ${s.v()}, masih bisa lebih baik.`); } })), msg);
      } else if (r === 3) ask('Mengapa kedua cara rakus gagal?', [['Pertama: sirup bernilai besar tetapi menghabiskan tempat. Kedua: kerupuk mengambil 1 kg yang dibutuhkan sarung, 4 kg sia-sia', true], ['Keduanya salah hitung'], ['Karena bagasi terlalu kecil'], ['Cara rakus tidak pernah salah']]);
      else if (r === 4) ask('Setiap isi bagasi bisa ditulis 6 angka biner (1 = dibawa). Ada berapa kemungkinan, berapa yang sah (≤ 10 kg), dan berapa nilai terbaiknya?', [['64 kemungkinan, 28 sah, terbaik 34', true], ['36 kemungkinan, 28 sah, terbaik 34'], ['64 kemungkinan, 64 sah, terbaik 57'], ['12 kemungkinan, 6 sah, terbaik 26']], 1, el('div', { class: 'au-status' }, '100101 = kue kering, kopi bubuk, sarung dan baju'),
        then(() => ask('Komputer memeriksa 10⁸ kemungkinan per detik. Untuk 30 dan 60 oleh-oleh?', [['2³⁰: sekitar 11 detik; 2⁶⁰: sekitar 365 tahun', true], ['30: 0,3 detik; 60: 0,6 detik'], ['2³⁰: 11 detik; 2⁶⁰: 22 detik'], ['Keduanya kurang dari 1 detik']])));
      else if (r === 5) { wrap.append(el('p', { class: 'prompt' }, 'Pemrograman dinamis: isi baris 6. Setiap sel memilih yang lebih besar antara tidak bawa (sel di atas) dan bawa (nilai + sel atas di kolom k − berat).')); dpBoard(wrap, ctx, { from: 6, onDone: next }); }
      else if (r === 6) ask('Telusuri dari sel kanan bawah (34): jika sama dengan sel di atasnya, barang itu tidak dibawa; jika berbeda, dibawa dan geser ke kiri sebanyak beratnya. Apa isinya?', [['Kue kering, kopi bubuk, sarung dan baju', true], ['Sirup dan kopi bubuk'], ['Kue kering, kopi bubuk, kerupuk'], ['Kopi bubuk, kerupuk, sarung dan baju']], 1, (() => { const box = el('div'); const { T } = dp(OLEH, CAP); box.append(el('div', { class: 'bg-dp' }, ...T.flatMap((r2, i) => [el('span', { class: 'bg-dp-baris' }, i ? `${i}. ${OLEH[i - 1][0]}` : '(tidak ada)'), ...r2.map((x, k) => el('span', { class: `bg-dp-sel ${i === 6 && k === 10 ? 'kini' : ''}` }, x))]))); return box; })());
      else if (r === 7) ask('Pemrograman dinamis untuk 6 oleh-oleh mengisi 6 × 11 = 66 sel. Untuk 30 oleh-oleh dan bagasi 10 kg?', [['330 sel, jauh lebih sedikit dari 1.073.741.824 kemungkinan', true], ['2³⁰ sel, sama saja'], ['30 sel'], ['3.300 sel, lebih banyak dari mencoba semua']]);
      else if (r === 8) ask('Kesimpulan mana yang tepat?', [['Rakus: cepat tetapi bisa gagal. Mencoba semua: pasti benar tetapi berlipat dua tiap tambah satu barang. Pemrograman dinamis: benar dan cepat bila batas beratnya bilangan bulat yang tidak terlalu besar', true], ['Rakus selalu terbaik'], ['Mencoba semua selalu paling cepat'], ['Pemrograman dinamis bisa salah']]);
      else ask('Tantangan: jika oleh-oleh boleh dibawa sebagian, cara rakus nilai per kg memberi kue, kopi, kerupuk, lalu 4 kg sarung (13 × 4 : 5). Berapa nilainya, dan apa artinya?', [['34,4; isi utuh tidak mungkin lebih dari itu, dan karena nilai bulat, 34 pasti terbaik', true], ['34; sama saja'], ['37; jadi 34 belum terbaik'], ['24; cara rakus tetap gagal']], 1, el('div', { class: 'au-status' }, `9 + 12 + 3 + 10,4 = ${fmtNum(fractional(OLEH, CAP), 1)}`));
    }
    render();
  },
};

function randomItems(ctx) {
  const pool = [['Bakpia', '🥮'], ['Dodol', '🍬'], ['Batik', '👘'], ['Keripik', '🥔'], ['Madu', '🍯'], ['Teh', '🍵'], ['Sambal', '🌶️'], ['Kain tenun', '🧵']];
  return ctx.rand.shuffle(pool).slice(0, 6).map(([n, ic]) => [n, ctx.rand.int(1, 7), ctx.rand.int(2, 16), ic]);
}

function createSuitcase(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  let items = OLEH;
  const host = el('div', { class: 'bg-papan' });
  const out = el('p', { class: 'reveal hint' });
  let s;
  function reset() {
    host.replaceChildren();
    s = suitcase(host, ctx, { items, onChange: () => { out.textContent = s.w() > CAP ? 'Lebih dari 10 kg!' : `Nilai ${s.v()}.`; } });
    out.textContent = '';
  }
  const showGreedy = (key, label) => { const g = greedy(items, CAP, key); s.set(g.take); out.textContent = `${label}: urutan ${g.order.map((i) => items[i][0]).join(', ')} → ${g.w} kg, nilai ${g.v}.`; };
  wrap.append(el('p', { class: 'prompt' }, 'Koper virtual (batas 10 kg)'),
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Daftar lembar kerja'), () => { items = OLEH; reset(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Daftar acak'), () => { items = randomItems(ctx); reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: nilai terbesar'), () => showGreedy(byValue, 'Rakus nilai')), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: nilai per kg'), () => showGreedy(byRatio, 'Rakus nilai per kg')),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '⭐ Terbaik'), () => { const d = dp(items, CAP); s.set(d.take); const b = brute(items, CAP); out.textContent = `Terbaik ${d.best} (pemrograman dinamis); dari ${b.total} kemungkinan ada ${b.valid} yang sah.`; })),
    host, out);
  reset();
}

function createTable(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  const area = el('div');
  const go = (from) => { area.replaceChildren(); dpBoard(area, ctx, { from, onDone: () => { ctx.sound.win(); const { take } = dp(OLEH, CAP); area.append(el('p', { class: 'reveal' }, `Isi terbaik: ${take.map((i) => OLEH[i][0].toLowerCase()).join(', ')}.`)); } }); };
  wrap.append(el('p', { class: 'prompt' }, 'Tabel pemrograman dinamis'), el('div', { class: 'seg' }, [2, 3, 4, 5, 6].map((f) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `Mulai dari baris ${f}`), () => go(f)))), area);
  go(2);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  const TURNS = 6;
  function start(n) {
    const bags = Array.from({ length: n }, () => new Set());
    let t = 0;
    const w = (b) => [...b].reduce((s, i) => s + OLEH[i][1], 0);
    const v = (b) => [...b].reduce((s, i) => s + OLEH[i][2], 0);
    function play() {
      if (t >= n * TURNS) return finishBoard(wrap, ctx, { title: 'Enam putaran selesai. Nilai terbaik yang mungkin: 34.', pts: bags.map(v), unit: 'nilai', again: () => pickTeams(wrap, 'Koper Bergiliran', start) });
      const team = t % n;
      const bag = bags[team];
      const msg = el('p', { class: 'reveal hint' }, 'Ketuk satu oleh-oleh untuk dimasukkan atau dikeluarkan.');
      let locked = false;
      wrap.replaceChildren(scoreBar(bags.map(v), team), el('p', { class: 'prompt' }, `Putaran ${Math.floor(t / n) + 1}/${TURNS} · koper Tim ${team + 1}`),
        el('div', { class: 'bg-rak' }, OLEH.map((it, i) => onTap(card(it, i, { on: bag.has(i) }), () => {
          if (locked) return;
          if (!bag.has(i) && w(bag) + it[1] > CAP) { ctx.sound.bad(); say(msg, 'bad', `Tidak muat: ${w(bag)} + ${it[1]} > 10 kg.`); return; }
          locked = true;
          if (bag.has(i)) bag.delete(i); else bag.add(i);
          ctx.sound.tap(); t++; setTimeout(play, 700);
        }))), scale(w(bag), v(bag), CAP), el('div', { class: 'kode-baris' }, button('Lewati giliran', () => { if (!locked) { locked = true; t++; play(); } })), msg);
    }
    play();
  }
  pickTeams(wrap, 'Koper Bergiliran', start);
}
