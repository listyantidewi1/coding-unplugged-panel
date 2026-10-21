// Kalung Manik-Manik — PAUD (4–6 tahun), menjalankan dan memperbaiki program
// dengan perulangan. A necklace program is "ulangi n ( beads )".

import { el, onTap, button, choice, shake } from '../core/kit.js';

const BEADS = { m: { name: 'merah', emoji: '🔴' }, k: { name: 'kuning', emoji: '🟡' }, b: { name: 'biru', emoji: '🔵' } };
const CIRCLED = { 2: '②', 3: '③', 4: '④', 5: '⑤' };

const run = (unit, n) => Array.from({ length: n }, () => unit).flat();
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function bead(c, extra = '') {
  return el('span', { class: `km-bead km-${c}${extra}`, title: BEADS[c].name });
}
// A necklace drawn straight, so the order reads left to right.
function necklace(beads, { marks = null, cls = '' } = {}) {
  return el('div', { class: `km-string ${cls}` }, el('span', { class: 'km-end' }, '〰'),
    beads.map((c, i) => bead(c, marks && marks[i] ? ' km-beda' : '')), el('span', { class: 'km-end' }, '〰'));
}
// A program card: ulangi ③ ( 🔴 🟡 ).
function programCard(unit, n, cls = '') {
  return el('span', { class: `km-prog ${cls}` }, el('b', null, 'ulangi'), el('span', { class: 'km-num' }, CIRCLED[n]),
    el('span', { class: 'km-kurung' }, '(', unit.map((c) => bead(c)), ')'));
}

// Worksheet questions first, then the "siap tantangan" fix, then built rounds.
const PLAN = ['jalankan', 'hitung', 'cocok', 'dika', 'warna', 'susun', 'susun', 'susun'];

function round(wrap, ctx, kind, next) {
  if (kind === 'jalankan') {
    const unit = ['m', 'k'];
    choice(wrap, {
      prompt: 'Jalankan programnya. Kalung mana yang dibuat?',
      subject: programCard(unit, 3, 'besar'),
      ctx, onRight: next, columns: 1,
      options: ctx.rand.shuffle([
        { icon: necklace(run(unit, 3)), correct: true },
        { icon: necklace(['m', 'm', 'm', 'k', 'k', 'k']) },
        { icon: necklace(run(unit, 2)) },
      ]),
    });
    return;
  }
  if (kind === 'hitung') {
    choice(wrap, {
      prompt: 'Program ini membuat kalung. Ada berapa manik?',
      subject: el('div', { class: 'km-col' }, programCard(['m', 'k'], 3, 'besar'), necklace(run(['m', 'k'], 3))),
      ctx, onRight: next, columns: 4,
      options: [4, 5, 6, 7].map((x) => ({ label: String(x), correct: x === 6 })),
    });
    return;
  }
  if (kind === 'cocok') {
    choice(wrap, {
      prompt: 'Program mana yang membuat kalung ini?',
      subject: necklace(run(['m', 'm', 'k'], 3)),
      ctx, onRight: next, columns: 1,
      options: [
        { icon: programCard(['m', 'k'], 3), label: 'A' },
        { icon: programCard(['m', 'm', 'k'], 3), label: 'B', correct: true },
        { icon: programCard(['m', 'm', 'k'], 2), label: 'C' },
      ],
    });
    return;
  }
  if (kind === 'dika') {
    choice(wrap, {
      prompt: 'Kalung Dika terlalu pendek! Angka ulangannya harus diganti berapa?',
      subject: el('div', { class: 'km-col' },
        el('div', { class: 'km-cap' }, 'Contoh:'), necklace(run(['k', 'b'], 4)),
        el('div', { class: 'km-cap' }, 'Program Dika:'), programCard(['k', 'b'], 3),
        el('div', { class: 'km-cap' }, 'Kalung Dika:'), necklace(run(['k', 'b'], 3))),
      ctx, onRight: next, columns: 4,
      options: [2, 3, 4, 5].map((x) => ({ label: String(x), correct: x === 4 })),
    });
    return;
  }
  if (kind === 'warna') {
    choice(wrap, {
      prompt: 'Warnanya salah! Program mana yang benar untuk kalung contoh?',
      subject: el('div', { class: 'km-col' },
        el('div', { class: 'km-cap' }, 'Contoh:'), necklace(run(['m', 'b'], 3)),
        el('div', { class: 'km-cap' }, 'Program yang salah:'), programCard(['m', 'k'], 3)),
      ctx, onRight: next, columns: 1,
      options: ctx.rand.shuffle([
        { icon: programCard(['m', 'b'], 3), correct: true },
        { icon: programCard(['b', 'm'], 3) },
        { icon: programCard(['m', 'b'], 2) },
      ]),
    });
    return;
  }
  // Build the program for a target necklace.
  const target = randomProgram(ctx.rand, ctx.round);
  const goal = run(target.unit, target.n);
  const out = el('div', { class: 'km-hasil' });
  const ed = editor(ctx, { onRun: (unit, n) => {
    const got = run(unit, n);
    out.replaceChildren(el('div', { class: 'km-cap' }, 'Kalung dari programmu:'), necklace(got, { marks: goal.map((c, i) => got[i] !== c).concat(got.slice(goal.length).map(() => true)) }));
    if (same(got, goal)) { ed.lock(); ctx.sound.good(); next(); } else { ctx.mistake(); shake(out); }
  } });
  wrap.append(el('p', { class: 'prompt' }, 'Susun program yang membuat kalung ini, lalu tekan Ronce!'),
    el('div', { class: 'km-target', 'data-unit': target.unit.join(''), 'data-n': target.n }, necklace(goal)),
    ed.node, out);
}

// Units with one to three beads, harder later. The round number is mixed in
// so the three build rounds differ.
function randomProgram(rand, r) {
  const size = r <= 5 ? 2 : 1 + Math.floor(rand.next() * 3);
  let unit;
  do { unit = Array.from({ length: Math.max(size, 1) }, () => rand.pick(['m', 'k', 'b'])); } while (unit.length > 1 && unit.every((c) => c === unit[0]));
  return { unit, n: 2 + Math.floor(rand.next() * 3) };
}

// The program editor: a palette of beads, the "ulangi" bracket with up to
// three bead slots, the repeat number and the Ronce! button.
function editor(ctx, { onRun, max = 3, show = null }) {
  const unit = [];
  let n = 3;
  let locked = false;
  const inside = el('span', { class: 'km-isi' });
  const nums = el('span', { class: 'km-angka' });
  const draw = () => {
    inside.replaceChildren(...(unit.length ? unit.map((c, i) => onTap(el('button', { class: 'km-slot', type: 'button', 'aria-label': `lepas ${BEADS[c].name}` }, bead(c)), () => {
      if (locked) return;
      unit.splice(i, 1); draw();
    })) : [el('span', { class: 'km-kosong' }, 'ketuk manik')]));
    nums.replaceChildren(...[2, 3, 4].map((x) => onTap(el('button', { class: `km-n${x === n ? ' on' : ''}`, type: 'button', 'data-n': x }, CIRCLED[x]), () => {
      if (locked) return;
      n = x; draw();
    })));
  };
  const palette = el('div', { class: 'km-palet' }, Object.keys(BEADS).map((c) => onTap(el('button', { class: 'km-pilih', type: 'button', 'data-c': c, 'aria-label': BEADS[c].name }, bead(c)), () => {
    if (locked) return;
    if (unit.length >= max) { shake(inside); return; }
    unit.push(c); ctx.sound.tap(); draw();
  })));
  const go = button('🧵 Ronce!', () => {
    if (locked) return;
    if (!unit.length) { shake(inside); return; }
    if (show) show(unit.slice(), n); else onRun(unit.slice(), n);
  }, 'primary');
  draw();
  return {
    node: el('div', { class: 'km-editor' }, palette,
      el('div', { class: 'km-prog besar' }, el('b', null, 'ulangi'), nums, el('span', { class: 'km-kurung' }, '(', inside, ')')), go),
    lock() { locked = true; },
    get unit() { return unit; },
    get n() { return n; },
  };
}

// Slides the beads onto the string one by one, counting aloud on screen.
function roncePlay(stage, beads, sound, done) {
  const str = necklace([]);
  const count = el('div', { class: 'km-hitung' });
  stage.replaceChildren(str, count);
  const endR = str.lastChild;
  let i = 0;
  const step = () => {
    if (i >= beads.length) { count.textContent = `${beads.length} manik!`; sound.win(); done?.(); return; }
    str.insertBefore(bead(beads[i], ' km-masuk'), endR);
    i++;
    count.textContent = String(i);
    sound.tap();
    t = setTimeout(step, 650);
  };
  let t = setTimeout(step, 300);
  return () => clearTimeout(t);
}

export default {
  id: 'paud-12-kalung-manik',
  title: 'Kalung Manik-Manik',
  topic: 'Program dengan perulangan',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '📿',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Anak menjalankan program kalung dengan kartu "ulangi", memilih program yang cocok dengan kalung, memperbaiki program yang salah, dan membuat programnya sendiri.',
  extraModes: [
    { id: 'ronce', icon: '🧵', label: 'Program Kalung', desc: 'Susun program, tekan Ronce!, dan hitung maniknya bersama', create: createRonce },
    { id: 'cocokkan', icon: '🔍', label: 'Cocokkan Kalung', desc: 'Susun program untuk kalung contoh, manik yang berbeda ditandai', create: createMatch },
    { id: 'teman', icon: '🤝', label: 'Kalung Teman', desc: 'Satu anak membuat kalung, teman menyusun programnya', create: createFriend },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kalung-manik' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 1300); });
    }
    render();
  },
};

function createRonce(root, ctx) {
  const wrap = el('div', { class: 'act kalung-manik' });
  root.append(wrap);
  const stage = el('div', { class: 'km-panggung' }, el('span', { class: 'km-cap' }, 'Kalungnya muncul di sini.'));
  let stop = null;
  const ed = editor(ctx, { show: (unit, n) => { stop?.(); stop = roncePlay(stage, run(unit, n), ctx.sound); } });
  wrap.append(el('p', { class: 'prompt' }, 'Ketuk manik untuk mengisi kurung, pilih angka ulangan, lalu tekan Ronce!'), ed.node, stage,
    el('p', { class: 'km-cap' }, 'Ketuk manik di dalam kurung untuk melepasnya. Setiap Ronce! membuat kalung baru dari awal.'));
  return { destroy() { stop?.(); } };
}

// Example necklaces for matching, from the worksheet and the guide.
const EXAMPLES = [
  { unit: ['m', 'k'], n: 3 }, { unit: ['m', 'm', 'k'], n: 3 }, { unit: ['k', 'b'], n: 4 },
  { unit: ['m', 'b'], n: 3 }, { unit: ['b'], n: 4 }, { unit: ['k', 'm', 'b'], n: 2 },
];

function createMatch(root, ctx) {
  const wrap = el('div', { class: 'act kalung-manik' });
  root.append(wrap);
  let idx = 0;
  function show() {
    const ex = EXAMPLES[idx % EXAMPLES.length];
    const goal = run(ex.unit, ex.n);
    const out = el('div', { class: 'km-hasil' });
    const ed = editor(ctx, { onRun: (unit, n) => {
      const got = run(unit, n);
      const marks = Array.from({ length: Math.max(got.length, goal.length) }, (_, i) => got[i] !== goal[i]);
      const ok = same(got, goal);
      out.replaceChildren(el('div', { class: 'km-cap' }, 'Kalung dari programmu:'), necklace(got, { marks }),
        el('div', { class: `km-pesan ${ok ? 'ok' : 'beda'}` }, ok ? '✅ Cocok! Programmu membuat kalung yang sama.'
          : got.length < goal.length ? '✗ Kalungnya terlalu pendek. Manik yang bertanda berbeda.'
            : got.length > goal.length ? '✗ Kalungnya terlalu panjang. Manik yang bertanda berbeda.'
              : '✗ Ada manik yang berbeda. Lihat tandanya.'));
      if (ok) ctx.sound.win(); else ctx.sound.bad();
    } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Susun program untuk kalung contoh ini.'),
      el('div', { class: 'km-target' }, el('div', { class: 'km-cap' }, 'Kalung contoh:'), necklace(goal)), ed.node, out,
      button('Kalung lain ▶', () => { idx++; show(); }, 'small'));
  }
  show();
}

// Bergiliran: one child strings a necklace bead by bead, a friend then
// writes the program for it.
function createFriend(root, ctx) {
  const wrap = el('div', { class: 'act kalung-manik' });
  root.append(wrap);
  let turn = 0;
  function start() {
    const maker = turn % 2 + 1, writer = 3 - maker;
    const beads = [];
    const str = el('div', { class: 'km-target' });
    const draw = () => str.replaceChildren(necklace(beads));
    const palette = el('div', { class: 'km-palet' }, Object.keys(BEADS).map((c) => onTap(el('button', { class: 'km-pilih', type: 'button', 'aria-label': BEADS[c].name }, bead(c)), () => {
      if (beads.length >= 12) return;
      beads.push(c); ctx.sound.tap(); draw();
    })));
    const undo = button('↩ Lepas satu', () => { beads.pop(); draw(); }, 'small');
    const done = button('Selesai, giliran teman ▶', () => {
      if (beads.length < 2) { shake(str); return; }
      writePhase();
    }, 'primary');
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${maker}: buat kalung dengan mengetuk manik satu per satu (sampai 12 manik).`),
      palette, str, el('div', { class: 'row' }, undo, done));
    function writePhase() {
      const out = el('div', { class: 'km-hasil' });
      const ed = editor(ctx, { onRun: (unit, n) => {
        const got = run(unit, n);
        const ok = same(got, beads);
        out.replaceChildren(necklace(got, { marks: Array.from({ length: Math.max(got.length, beads.length) }, (_, i) => got[i] !== beads[i]) }),
          el('div', { class: `km-pesan ${ok ? 'ok' : 'beda'}` }, ok ? `✅ Tim ${writer} berhasil menulis program kalung ini!` : '✗ Belum cocok. Coba lagi.'));
        if (ok) { ed.lock(); ctx.sound.win(); out.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary')); } else ctx.sound.bad();
      } });
      wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${writer}: susun program dengan "ulangi" untuk kalung Tim ${maker}.`),
        el('div', { class: 'km-target' }, necklace(beads)), ed.node, out,
        el('p', { class: 'km-cap' }, 'Ada kalung yang tidak bisa dibuat dengan satu "ulangi". Kalau begitu, bicarakan bersama mengapa.'),
        button('Lewati, tukar peran', () => { turn++; start(); }, 'small'));
    }
  }
  start();
}
