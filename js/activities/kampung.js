// The village map (6×6, columns A–F, rows 1–6 from the bottom) shared by two
// worksheets:
//   sda-03-rumah-nenek — algoritma: tulis panah dari rumah ke warung ke Nenek
//   sda-07-rute-salah  — debugging: cari dan perbaiki panah yang salah

import { el, onTap, button, choice, shake } from '../core/kit.js';
import { ARROWS, makeWorld, makeBoard, animate, arrowStrip, arrowPad, programmer, cellAt, cellName, key } from '../core/peta.js';

const KINDS = {
  sawah: { icon: '🌾', msg: 'Ups! Sari menginjak sawah.' },
  sungai: { icon: '🌊', msg: 'Byur! Sari tercebur ke sungai.' },
};
const PLACES = {
  A1: { icon: '🏠', label: 'rumah Sari' },
  D3: { icon: '🏪', label: 'warung' },
  E3: { icon: '🌉', label: 'jembatan' },
  F6: { icon: '🏡', label: 'Nenek' },
};
export const world = makeWorld({
  cols: 6,
  rows: 6,
  blocks: { C5: 'sawah', D5: 'sawah', B3: 'sawah', B2: 'sawah', E6: 'sungai', E5: 'sungai', E4: 'sungai', E2: 'sungai', E1: 'sungai' },
  kinds: KINDS,
  places: PLACES,
  walker: '👧',
});
const RUMAH = cellAt('A1');
const WARUNG = cellAt('D3');
const NENEK = cellAt('F6');
// Extra destinations for later rounds, on free cells.
const FRIENDS = [['🕌', 'masjid'], ['🏫', 'sekolah'], ['⚽', 'lapangan'], ['🏘️', 'rumah Rina'], ['🌳', 'taman']];

function messages(where) {
  return (r) => {
    if (r.end === 'sampai') return `Sari sampai di ${where}! 🎉`;
    if (r.end === 'keluar') return 'Ups! Sari keluar dari peta.';
    if (r.end === 'belum') return `Sari belum sampai di ${where}.`;
    return KINDS[r.end].msg;
  };
}

function trip(rand, round) {
  if (round === 0) return { from: RUMAH, to: WARUNG, where: 'warung', prompt: 'Ibu berpesan: mampir ke warung dulu. Tulis panah dari rumah Sari ke warung!' };
  if (round === 1) return { from: WARUNG, to: NENEK, where: 'rumah Nenek', prompt: 'Sekarang dari warung ke rumah Nenek. Sungai hanya bisa diseberangi lewat jembatan!' };
  for (;;) {
    const [from, to] = rand.shuffle(world.free());
    const best = world.shortest(from, to);
    if (best && best.length >= 5 && best.length <= 8) {
      const [icon, label] = rand.pick(FRIENDS);
      return { from, to, where: label, marks: { [key(from)]: { icon: '🚩', label: 'mulai' }, [key(to)]: { icon, label } }, prompt: `Sari mau ke ${label}. Tulis panahnya dari 🚩!` };
    }
  }
}

export const sdaRumahNenek = {
  id: 'sda-03-rumah-nenek',
  title: 'Jalan ke Rumah Nenek',
  topic: 'Algoritma',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🏡',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid menulis urutan panah agar Sari sampai tanpa menginjak sawah atau sungai, menghitung langkahnya, dan mencari jalan terpendek.',
  extraModes: [{ id: 'pasangan', icon: '👫', label: 'Berpasangan', desc: 'Satu menulis program, satu menjalankan dengan "Satu Langkah", lalu bertukar', create: createPair }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kampung' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1800); };
      if (r === 2) { kakakRound(wrap, ctx, next); return; }
      const t = trip(ctx.rand, r > 2 ? r - 1 : r);
      const best = world.shortest(t.from, t.to).length;
      programmer(wrap, world, ctx, {
        from: t.from, to: t.to, marks: t.marks, prompt: t.prompt, messages: messages(t.where),
        onResult(res, program, retry, msg) {
          if (res.end === 'sampai') {
            msg.textContent += program.length === best
              ? ` ${program.length} langkah, ini jalan terpendek! ⭐`
              : ` ${program.length} langkah. Jalan terpendek ${best} langkah.`;
            next();
            return;
          }
          ctx.mistake();
          shake(wrap.querySelector('.peta'));
          retry();
        },
      });
    }
    render();
  },
};

const KAKAK = ['up', 'up', 'up', 'right', 'right', 'right', 'down'];

function kakakRound(wrap, ctx, next) {
  const board = makeBoard(world);
  board.show(RUMAH);
  const strip = arrowStrip({ numbered: true });
  strip.set(KAKAK);
  const msg = el('p', { class: 'reveal' });
  choice(wrap, {
    prompt: 'Kakak menulis program ini dari rumah Sari. Telusuri dengan jari: Sari sampai di mana?',
    subject: el('div', { class: 'peta-layout' }, board.node, el('div', { class: 'peta-side' }, strip.node, msg)),
    ctx, columns: 3,
    onRight() {
      animate(board, world.run(KAKAK, RUMAH, WARUNG), () => {
        msg.textContent = 'Benar, warung! 7 langkah. Programnya benar, tetapi 2 langkah lebih panjang dari jalan terpendek.';
        next();
      }, { onStep: (i) => strip.light(i) });
    },
    options: ctx.rand.shuffle([
      { icon: '🏪', label: 'warung', correct: true },
      { icon: '🏡', label: 'rumah Nenek' },
      { icon: '🌾', label: 'sawah' },
    ]),
  });
}

function createPair(root, ctx) {
  const wrap = el('div', { class: 'act kampung' });
  root.append(wrap);
  programmer(wrap, world, ctx, {
    from: RUMAH, to: NENEK, messages: messages('rumah Nenek'),
    prompt: 'Murid 1 menulis panah dari rumah Sari ke rumah Nenek. Murid 2 menekan "Satu Langkah". Lalu bertukar!',
    onResult(res, program, retry) {
      if (res.end === 'sampai') ctx.sound.win(); else ctx.sound.bad();
      retry();
    },
  });
}

// sda-07: the worksheet's three buggy programs, then generated ones.
const BUGS = [
  { who: 'Bayu', from: RUMAH, to: WARUNG, where: 'warung', program: ['right', 'up', 'up', 'up', 'right'] },
  { who: 'Citra', from: WARUNG, to: NENEK, where: 'rumah Nenek', program: ['up', 'right', 'up', 'up', 'up'] },
  { who: 'Dodi', from: RUMAH, to: WARUNG, where: 'warung', program: ['right', 'right', 'right', 'up'] },
];

function makeBug(rand) {
  for (;;) {
    const t = trip(rand, 2);
    const good = world.shortest(t.from, t.to);
    const i = rand.int(0, good.length - 2);
    const bad = good.slice();
    bad[i] = rand.pick(Object.keys(ARROWS).filter((a) => a !== good[i]));
    if (world.run(bad, t.from, t.to).end !== 'sampai') return { ...t, who: rand.pick(['Eka', 'Fajar', 'Gita', 'Hana']), program: bad };
  }
}

// Bug hunt: numbered program, Satu Langkah lights the running arrow, tap an
// arrow to change it, ➕ adds one at the end, Uji Ulang always starts over.
// `onFixed(stepsRun)` when the program reaches the goal.
function bugHunt(wrap, ctx, puzzle, { prompt, hint, onFixed, onFail }) {
  const board = makeBoard(world, { marks: puzzle.marks });
  board.show(puzzle.from);
  const msg = el('p', { class: hint ? 'reveal hint' : 'reveal' }, hint || '');
  const say = messages(puzzle.where);
  let busy = false;
  let stepAt = 0;
  let stepsRun = 0;
  let picking = -1;
  const picker = el('div', { class: 'picker' });
  const strip = arrowStrip({
    numbered: true,
    onArrow(i) {
      if (busy) return;
      picking = i;
      strip.pick(i);
      picker.hidden = false;
    },
  });
  strip.set(puzzle.program);
  function restart() {
    stepAt = 0;
    board.clear();
    board.show(puzzle.from);
    strip.light(-1);
  }
  picker.append(arrowPad((name) => {
    if (picking < 0) return;
    const p = strip.program.slice();
    p[picking] = name;
    picking = -1;
    strip.pick(-1);
    strip.set(p);
    picker.hidden = true;
    restart();
    msg.textContent = 'Panah diganti. Tekan "Uji Ulang".';
    msg.className = 'reveal';
  }), button('🗑️ Hapus panah ini', () => {
    if (picking < 0) return;
    const p = strip.program.slice();
    p.splice(picking, 1);
    picking = -1;
    strip.pick(-1);
    strip.set(p);
    picker.hidden = true;
    restart();
  }, 'ghost small'));
  picker.hidden = true;
  const add = button('➕ Tambah panah', () => {
    if (busy || strip.program.length >= 10) return;
    strip.set([...strip.program, 'up']);
    picking = strip.program.length - 1;
    strip.pick(picking);
    picker.hidden = false;
  }, 'ghost');
  const step = button('👣 Satu Langkah', () => {
    if (busy) return;
    if (stepAt >= strip.program.length) { restart(); msg.textContent = ''; return; }
    stepAt++;
    stepsRun++;
    const r = world.run(strip.program.slice(0, stepAt), puzzle.from, puzzle.to);
    strip.light(stepAt - 1);
    const p = r.path[r.path.length - 1];
    board.mark(p);
    board.show(r.end === 'keluar' ? r.path[r.path.length - 2] : p, r.end === 'sampai' || r.end === 'belum' ? '' : 'sad');
    msg.className = 'reveal';
    if (r.end !== 'belum' && r.end !== 'sampai') { msg.textContent = `Langkah ${stepAt}: ${say(r)}`; msg.classList.add('bad'); stepAt = strip.program.length; return; }
    msg.textContent = stepAt === strip.program.length ? say(r) : `Langkah ${stepAt}: Sari di ${cellName(p)}.`;
  });
  const test = button('🔁 Uji Ulang', () => {
    if (busy) return;
    busy = true;
    restart();
    const r = world.run(strip.program, puzzle.from, puzzle.to);
    animate(board, r, () => {
      busy = false;
      msg.textContent = say(r);
      msg.classList.toggle('bad', r.end !== 'sampai');
      if (r.end === 'sampai') onFixed(stepsRun, msg);
      else onFail?.();
    }, { onStep: (i) => strip.light(i) });
  }, 'primary');
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'peta-layout' }, board.node,
      el('div', { class: 'peta-side' }, el('div', { class: 'label' }, `Program ${puzzle.who}:`), strip.node, picker,
        el('div', { class: 'row' }, step, test, add), msg)));
}

export const sdaRuteSalah = {
  id: 'sda-07-rute-salah',
  title: 'Rute yang Salah',
  topic: 'Debugging',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🐞',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Murid menjalankan program langkah demi langkah, menemukan panah yang salah (yang kadang terletak sebelum masalahnya terlihat), memperbaikinya, dan menguji ulang dari awal.',
  extraModes: [{ id: 'tukar', icon: '🔀', label: 'Tukar Teka-teki', desc: 'Satu tim menulis program dan menyelipkan bug, tim lain memburunya', create: createSwap }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kampung' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1800); };
      const puzzle = BUGS[r] || makeBug(ctx.rand);
      const hint = r === 2 ? 'Sari tidak tercebur, tetapi tidak sampai. Apa yang kurang?'
        : r === 1 ? 'Hati-hati: panah yang salah tidak selalu panah tempat Sari tercebur!'
          : 'Jalankan satu per satu dan berhenti di langkah pertama yang salah.';
      bugHunt(wrap, ctx, puzzle, {
        prompt: `Program ${puzzle.who} ke ${puzzle.where} punya bug. Ketuk panah yang salah dan ganti.`,
        hint,
        onFixed: next,
        onFail: () => ctx.mistake(),
      });
    }
    render();
  },
};

// Tukar Teka-teki: write a right program, break one arrow in secret, then
// the other team hunts it. The screen counts the steps they ran.
function createSwap(root, ctx) {
  const wrap = el('div', { class: 'act kampung' });
  root.append(wrap);
  function write() {
    wrap.replaceChildren();
    programmer(wrap, world, ctx, {
      from: RUMAH, to: WARUNG, messages: messages('warung'),
      prompt: 'Tim 1: tulis program yang benar dari rumah Sari ke warung, lalu tekan Jalan.',
      onResult(res, program, retry) {
        if (res.end !== 'sampai') { ctx.sound.bad(); retry(); return; }
        ctx.sound.good();
        setTimeout(() => hide(program), 1200);
      },
    });
  }
  function hide(program) {
    wrap.replaceChildren();
    const strip = arrowStrip({
      numbered: true,
      onArrow(i) {
        const p = program.slice();
        const pad = arrowPad((name) => {
          p[i] = name;
          if (world.run(p, RUMAH, WARUNG).end === 'sampai') { shake(strip.node); return; }
          hunt(p);
        });
        wrap.querySelector('.picker').replaceChildren(pad);
      },
    });
    strip.set(program);
    wrap.append(
      el('p', { class: 'prompt' }, 'Tim lain menutup mata! Ketuk satu panah dan ganti supaya programnya salah.'),
      el('div', { class: 'peta-side wide' }, strip.node, el('div', { class: 'picker' })));
  }
  function hunt(program) {
    wrap.replaceChildren();
    bugHunt(wrap, ctx, { who: 'Tim 1', from: RUMAH, to: WARUNG, where: 'warung', program }, {
      prompt: 'Tim 2: buka mata! Ada satu bug. Jalankan satu per satu, lalu perbaiki.',
      onFixed(steps, msg) {
        ctx.sound.win();
        msg.textContent += ` Bug ditemukan setelah ${steps} langkah dijalankan.`;
        wrap.append(button('Teka-teki baru', write, 'primary'));
      },
    });
  }
  write();
}
