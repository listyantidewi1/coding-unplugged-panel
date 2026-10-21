// Isi Terus sampai Penuh — SD Lanjut (10–12 tahun), perulangan bersyarat.
// ULANGI n KALI against ULANGI SAMPAI syarat: a robot fills tubs with
// buckets, a mopping robot misses the last tile, and two loops never stop.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const GUARD = 100;
const rp = (n) => n.toLocaleString('id-ID');

// Fills an empty tub of `cap` litres with buckets of `ember` litres.
// `loop` is a number (ULANGI n KALI) or 'sampai' (ULANGI SAMPAI bak penuh).
export function fill(cap, ember, loop) {
  let water = 0, spill = 0, rounds = 0;
  const steps = [];
  const pour = () => {
    rounds++;
    const into = Math.min(cap - water, ember);
    water += into; spill += ember - into;
    steps.push({ kind: 'tuang', water, spill, rounds });
  };
  if (loop === 'sampai') {
    for (;;) {
      const full = water >= cap;
      steps.push({ kind: 'cek', full, water, spill, rounds });
      if (full) break;
      pour();
    }
  } else for (let k = 0; k < loop; k++) pour();
  return { water, spill, rounds, steps, full: water >= cap };
}

// ULANGI SAMPAI menyentuh dinding [ PEL ubin ini, MAJU ]; the wall is past
// tile `len`. `after` adds PEL ubin ini after the loop.
export function mop(len, { maju = true, after = false } = {}) {
  let pos = 1, rounds = 0, guard = false;
  const mopped = new Set(), steps = [];
  for (;;) {
    const touch = pos === len;
    steps.push({ kind: 'cek', touch, pos, rounds });
    if (touch) break;
    if (rounds >= GUARD) { guard = true; break; }
    rounds++;
    mopped.add(pos); steps.push({ kind: 'pel', pos, rounds });
    if (maju) { pos++; steps.push({ kind: 'maju', pos, rounds }); }
  }
  if (after && !guard) { mopped.add(pos); steps.push({ kind: 'pel', pos, rounds, after: true }); }
  return { rounds, mopped, steps, guard, missed: Array.from({ length: len }, (_, i) => i + 1).filter((t) => !mopped.has(t)) };
}

// ULANGI SAMPAI tabungan = / ≥ target [ TAMBAH tabungan step ].
export function save(op, target = 25000, step = 3000) {
  let tabungan = 0, rounds = 0, guard = false;
  const steps = [];
  for (;;) {
    const ok = op === '=' ? tabungan === target : tabungan >= target;
    steps.push({ kind: 'cek', ok, tabungan, rounds });
    if (ok) break;
    if (rounds >= GUARD) { guard = true; break; }
    rounds++; tabungan += step;
    steps.push({ kind: 'tambah', tabungan, rounds });
  }
  return { tabungan, rounds, steps, guard };
}

// The tub with its water, the spill on the floor, the round counter and
// the "periksa syarat" lamp.
function tubView(cap) {
  const water = el('div', { class: 'spn-air' });
  const level = el('b', { class: 'spn-level' }, `0 / ${cap} liter`);
  const puddle = el('div', { class: 'spn-tumpah' });
  const counter = el('div', { class: 'spn-putaran' }, 'Putaran: 0');
  const lamp = el('div', { class: 'spn-lampu' }, '💡 periksa syarat');
  const tub = el('div', { class: 'spn-bak', style: { '--tinggi': Math.max(0.35, cap / 100) } }, water);
  const node = el('div', { class: 'spn-tempat' }, el('div', { class: 'spn-kolom' }, tub, puddle, level), el('div', { class: 'spn-kolom' }, counter, lamp));
  const show = (s) => {
    water.style.height = `${(s.water / cap) * 100}%`;
    level.textContent = `${s.water} / ${cap} liter`;
    puddle.textContent = s.spill ? `💦 tumpah ${s.spill} liter` : '';
    counter.textContent = `Putaran: ${s.rounds}`;
    lamp.className = `spn-lampu${s.kind === 'cek' ? (s.full ? ' benar' : ' salah') : ''}`;
    lamp.textContent = s.kind === 'cek' ? (s.full ? '💡 bak penuh? ya → berhenti' : '💡 bak penuh? belum') : '💡 periksa syarat';
    if (s.kind === 'tuang') { tub.classList.remove('tuang'); void tub.offsetWidth; tub.classList.add('tuang'); }
  };
  show({ water: 0, spill: 0, rounds: 0 });
  return { node, show };
}

// The corridor of tiles with the wall at the end.
function corridorView(len) {
  const tiles = Array.from({ length: len }, (_, i) => el('span', { class: 'spn-ubin' }, el('small', null, i + 1)));
  const robot = el('span', { class: 'spn-robot' }, '🤖');
  const counter = el('div', { class: 'spn-putaran' }, 'Putaran: 0');
  const lamp = el('div', { class: 'spn-lampu' }, '💡 menyentuh dinding?');
  const node = el('div', { class: 'spn-tempat kolom' }, el('div', { class: 'spn-lorong', style: { '--n': len + 1 } }, ...tiles, el('span', { class: 'spn-dinding' }, '🧱')),
    el('div', { class: 'row' }, counter, lamp));
  const at = (pos) => tiles[Math.min(pos, len) - 1].append(robot);
  at(1);
  return {
    node,
    reset() { tiles.forEach((t) => t.classList.remove('dipel', 'lewat')); at(1); },
    show(s) {
      at(s.pos);
      counter.textContent = `Putaran: ${s.rounds}`;
      if (s.kind === 'pel') tiles[s.pos - 1].classList.add('dipel');
      lamp.className = `spn-lampu${s.kind === 'cek' ? (s.touch ? ' benar' : ' salah') : ''}`;
      lamp.textContent = s.kind === 'cek' ? (s.touch ? '💡 menyentuh dinding? ya → berhenti' : '💡 menyentuh dinding? belum') : '💡 menyentuh dinding?';
    },
    missed(list) { list.forEach((t) => tiles[t - 1].classList.add('lewat')); },
  };
}

// A money box for the never-ending saving loop.
function savingView(op) {
  const val = el('b', { class: 'spn-isi' }, '0');
  const counter = el('div', { class: 'spn-putaran' }, 'Putaran: 0');
  const lamp = el('div', { class: 'spn-lampu' }, `💡 tabungan ${op} 25.000?`);
  const node = el('div', { class: 'spn-tempat' }, el('div', { class: 'spn-kotak' }, el('span', null, 'tabungan'), val), el('div', { class: 'spn-kolom' }, counter, lamp));
  return {
    node,
    show(s) {
      val.textContent = rp(s.tabungan);
      counter.textContent = `Putaran: ${s.rounds}`;
      lamp.className = `spn-lampu${s.kind === 'cek' ? (s.ok ? ' benar' : ' salah') : ''}`;
      lamp.textContent = s.kind === 'cek' ? `💡 tabungan ${op} 25.000? ${s.ok ? 'ya → berhenti' : 'belum'}` : `💡 tabungan ${op} 25.000?`;
    },
  };
}

// Plays steps; long runs speed up so the guard is reached quickly.
function play(steps, show, { done, speed = 380 } = {}) {
  let i = 0, t = null;
  const tick = () => {
    if (i >= steps.length) { done?.(); return; }
    show(steps[i++]);
    t = setTimeout(tick, i > 24 ? 8 : speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

const code = (lines) => el('pre', { class: 'spn-kode' }, lines.join('\n'));
const P = 'ULANGI 5 KALI [ TUANG 1 ember ]';
const Q = 'ULANGI SAMPAI bak penuh [ TUANG 1 ember ]';
const PEL = 'ULANGI SAMPAI menyentuh dinding [ PEL ubin ini, MAJU ]';
const TAB = ['ATUR tabungan MENJADI 0', 'ULANGI SAMPAI tabungan = 25.000 [ TAMBAH tabungan 3.000 ]'];
const opts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: String(t), correct: i === 0 }));
const KS = [
  ['a. Membunyikan bel tanda pulang tiga kali', 'K'],
  ['b. Memompa ban sepeda sampai keras', 'S'],
  ['c. Menyapu empat ruang kelas di satu lantai', 'K'],
  ['d. Menunggu di tepi jalan sampai lampu penyeberang hijau', 'S'],
  ['e. Mengaduk adonan kue sampai kalis', 'S'],
  ['f. Menyiram 12 pot bunga di depan kelas', 'K'],
];
const tub = (cap, loop) => ({ kind: 'bak', cap, loop });

// Worksheet questions in order; `show` is what plays after a right answer.
const PLAN = [
  { lines: [P], show: tub(50, 5), prompt: 'Soal 1. Bak A (50 liter) dengan Program P. Air di bak dan air tumpah?', opts: opts('50 liter, tumpah 0', ['40 liter, tumpah 10 liter', '50 liter, tumpah 10 liter']) },
  { lines: [P], show: tub(80, 5), prompt: 'Bak B (80 liter) dengan Program P?', opts: opts('50 liter (belum penuh), tumpah 0', ['80 liter (penuh), tumpah 0', '80 liter, tumpah 30 liter']) },
  { lines: [P], show: tub(35, 5), prompt: 'Bak C (35 liter) dengan Program P?', opts: opts('35 liter (penuh), tumpah 15 liter', ['35 liter (penuh), tumpah 5 liter', '50 liter, tumpah 0']) },
  { lines: [Q], show: tub(80, 'sampai'), prompt: 'Bak B (80 liter) dengan Program Q. Berapa putaran?', nums: [5, 7, 8, 9], ans: 8 },
  { lines: [Q], show: tub(35, 'sampai'), prompt: 'Bak C (35 liter) dengan Program Q. Putaran dan air tumpah?', opts: opts('4 putaran, tumpah 5 liter', ['3 putaran, tumpah 0', '4 putaran, tumpah 0', '5 putaran, tumpah 15 liter']) },
  { lines: [`P: ${P}`, `Q: ${Q}`], prompt: 'Program mana yang mengisi penuh ketiga bak tanpa banyak tumpah?', opts: opts('Program Q', ['Program P', 'keduanya sama']) },
  { lines: [Q], show: tub(70, 'sampai'), prompt: 'Soal 2a. Berhenti setelah 7 putaran, tidak ada yang tumpah. Isi bak?', nums: [60, 70, 75, 80], ans: 70 },
  { lines: [Q], show: tub(26, 'sampai'), prompt: 'Soal 2b. Berhenti setelah 3 putaran, 4 liter tumpah. Isi bak?', nums: [26, 30, 34, 36], ans: 26 },
  { lines: [Q], prompt: 'Soal 2c. Bak sudah penuh sebelum robot mulai. Berapa putaran?', nums: [0, 1, 2, 10], ans: 0 },
  { lines: [PEL], show: { kind: 'pel', len: 7 }, prompt: 'Soal 3. Lorong 7 ubin. Berapa putaran yang dijalankan?', nums: [5, 6, 7, 8], ans: 6 },
  { lines: [PEL], show: { kind: 'pel', len: 7 }, prompt: 'Ubin mana yang tidak dipel?', nums: [1, 6, 7], ans: 7 },
  { lines: [PEL], show: { kind: 'pel', len: 7, after: true }, prompt: 'Bagaimana memperbaikinya?',
    opts: opts('tambah PEL ubin ini sesudah perulangan', ['tukar urutan menjadi MAJU, PEL ubin ini', 'ganti dengan ULANGI 6 KALI']) },
  { lines: TAB, show: { kind: 'tab', op: '=' }, prompt: 'Soal 4a. Isi tabungan setelah 8 putaran dan setelah 9 putaran?', opts: opts('24.000 dan 27.000', ['24.000 dan 25.000', '25.000 dan 28.000', '21.000 dan 24.000']) },
  { lines: TAB, show: { kind: 'tab', op: '≥' }, prompt: 'Tabungan tidak pernah tepat 25.000. Perbaikannya?',
    opts: opts('ULANGI SAMPAI tabungan ≥ 25.000', ['ULANGI SAMPAI tabungan = 24.000', 'TAMBAH tabungan 2.000']) },
  { lines: ['ULANGI SAMPAI menyentuh dinding [ PEL ubin ini ]'], prompt: 'Soal 4b. Mengapa program pengepel ini tidak pernah berhenti?',
    opts: opts('robot tidak pernah maju, jadi tidak pernah menyentuh dinding', ['lorongnya terlalu panjang', 'robot lupa mengepel ubin terakhir']) },
  ...KS.map(([t, a]) => ({ prompt: `Soal 5. ${t}: lebih cocok K (ULANGI n KALI) atau S (ULANGI SAMPAI)?`, ks: a })),
];

function round(wrap, ctx, p, next) {
  const parts = [p.lines ? code(p.lines) : null];
  let view = null, run = null;
  if (p.show?.kind === 'bak') { view = tubView(p.show.cap); const r = fill(p.show.cap, 10, p.show.loop); run = (d) => play(r.steps, view.show, { speed: 260, done: d }); }
  else if (p.show?.kind === 'pel') {
    view = corridorView(p.show.len);
    const r = mop(p.show.len, { after: p.show.after });
    run = (d) => play(r.steps, view.show, { speed: 220, done: () => { view.missed(r.missed); d(); } });
  } else if (p.show?.kind === 'tab') { view = savingView(p.show.op); const r = save(p.show.op); run = (d) => play(r.steps, view.show, { speed: 200, done: d }); }
  if (view) parts.push(view.node);
  const subject = el('div', { class: 'spn-soal' }, ...parts.filter(Boolean));
  const after = () => (run ? run(() => setTimeout(next, 900)) : setTimeout(next, 500));
  let options, columns;
  if (p.ks) { options = ['K', 'S'].map((k) => ({ label: k === 'K' ? 'K · ULANGI n KALI' : 'S · ULANGI SAMPAI', correct: k === p.ks })); columns = 2; }
  else if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = p.nums.length; }
  else { options = ctx.rand.shuffle(p.opts); columns = 1; }
  choice(wrap, { prompt: p.prompt, subject: parts.some(Boolean) ? subject : null, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-22-sampai-penuh',
  title: 'Isi Terus sampai Penuh',
  topic: 'Perulangan bersyarat',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🪣',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid membandingkan ULANGI n KALI dengan ULANGI SAMPAI, menghitung putaran, menemukan kesalahan selisih satu, dan memperbaiki perulangan yang tidak pernah berhenti.',
  extraModes: [
    { id: 'bak', icon: '🛁', label: 'Pengisi Bak', desc: 'Atur isi bak dan ember, pilih jenis perulangan, lalu jalankan', create: createTub },
    { id: 'pel', icon: '🧹', label: 'Robot Pengepel', desc: 'Ubah panjang lorong dan programnya, lihat ubin yang terlewat', create: createMop },
    { id: 'penjaga', icon: '🛑', label: 'Penjaga Perulangan', desc: 'Program tabungan dengan "=" atau "≥" dan penjaga 100 putaran', create: createGuard },
    { id: 'rahasia', icon: '🤫', label: 'Bak Rahasia', desc: 'Satu tim memilih isi bak, tim lain menebak dari putaran dan tumpahan', create: createSecret },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act sampai-penuh' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// A − value + stepper.
function stepper(label, value, { min, max, step, fmt = String, onChange }) {
  const shown = el('b', { class: 'spn-nilai' }, fmt(value));
  const set = (v) => { value = Math.max(min, Math.min(max, v)); shown.textContent = fmt(value); onChange?.(value); };
  return {
    node: el('div', { class: 'row spn-stepper' }, el('span', { class: 'label' }, label),
      button('−', () => set(value - step), 'small'), shown, button('+', () => set(value + step), 'small')),
    get: () => value, set,
  };
}

function createTub(root, ctx) {
  const wrap = el('div', { class: 'act sampai-penuh' });
  root.append(wrap);
  let ember = 10, loop = 'sampai', stop = null;
  const holder = el('div');
  const info = el('p', { class: 'spn-info' });
  const prog = el('div');
  const fresh = () => { stop?.(); const v = tubView(cap.get()); holder.replaceChildren(v.node); info.textContent = ''; showProg(); return v; };
  const cap = stepper('Isi bak', 50, { min: 10, max: 100, step: 5, fmt: (v) => `${v} liter`, onChange: () => fresh() });
  const times = stepper('n', 5, { min: 1, max: 12, step: 1, onChange: () => showProg() });
  const showProg = () => prog.replaceChildren(code([loop === 'sampai' ? `ULANGI SAMPAI bak penuh [ TUANG 1 ember (${ember} liter) ]` : `ULANGI ${times.get()} KALI [ TUANG 1 ember (${ember} liter) ]`]));
  const pick = (row, attr, v) => row.querySelectorAll('.btn').forEach((b) => b.classList.toggle('on', b.dataset[attr] === String(v)));
  const emberRow = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Ember'), [5, 10].map((e) => {
    const b = button(`${e} liter`, () => { ember = e; pick(emberRow, 'e', e); fresh(); }, 'small'); b.dataset.e = e; return b;
  }));
  const loopRow = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Perulangan'),
    ...[['kali', 'ULANGI n KALI'], ['sampai', 'ULANGI SAMPAI penuh']].map(([k, l]) => {
      const b = button(l, () => { loop = k; pick(loopRow, 'k', k); times.node.style.display = k === 'kali' ? '' : 'none'; fresh(); }, 'small'); b.dataset.k = k; return b;
    }), times.node);
  pick(emberRow, 'e', 10); pick(loopRow, 'k', 'sampai'); times.node.style.display = 'none';
  const go = button('▶ Jalankan', () => {
    const v = fresh();
    const r = fill(cap.get(), ember, loop === 'sampai' ? 'sampai' : times.get());
    stop = play(r.steps, v.show, {
      speed: 320,
      done: () => {
        info.textContent = `${r.rounds} putaran. Air di bak ${r.water} dari ${cap.get()} liter${r.full ? ' (penuh)' : ' (belum penuh)'}, tumpah ${r.spill} liter.`;
        if (r.full && r.spill < ember) ctx.sound.good(); else ctx.sound.bad();
      },
    });
  }, 'primary');
  fresh();
  wrap.append(el('p', { class: 'prompt' }, 'Atur bak dan ember, pilih perulangannya, lalu jalankan robot pengisi.'),
    el('div', { class: 'row' }, cap.node, emberRow), loopRow, el('div', { class: 'spn-atas' }, holder, el('div', { class: 'spn-kolom' }, prog, go)), info);
  return { destroy() { stop?.(); } };
}

function createMop(root, ctx) {
  const wrap = el('div', { class: 'act sampai-penuh' });
  root.append(wrap);
  let variant = 'awal', stop = null;
  const VARIANTS = {
    awal: { label: 'PEL, MAJU', lines: [PEL], opt: {} },
    perbaikan: { label: '+ PEL sesudahnya', lines: [PEL, 'PEL ubin ini'], opt: { after: true } },
    tanpa: { label: 'PEL saja (tanpa MAJU)', lines: ['ULANGI SAMPAI menyentuh dinding [ PEL ubin ini ]'], opt: { maju: false } },
  };
  const holder = el('div'), prog = el('div');
  const info = el('p', { class: 'spn-info' });
  let view;
  const fresh = () => { stop?.(); view = corridorView(len.get()); holder.replaceChildren(view.node); prog.replaceChildren(code(VARIANTS[variant].lines)); info.textContent = ''; };
  const len = stepper('Panjang lorong', 7, { min: 3, max: 12, step: 1, fmt: (v) => `${v} ubin`, onChange: fresh });
  const row = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Program'), Object.entries(VARIANTS).map(([k, v]) => {
    const b = button(v.label, () => { variant = k; row.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === b)); fresh(); }, 'small');
    if (k === variant) b.classList.add('on');
    return b;
  }));
  const go = button('▶ Jalankan', () => {
    fresh();
    const r = mop(len.get(), VARIANTS[variant].opt);
    stop = play(r.steps, view.show, {
      speed: 260,
      done: () => {
        view.missed(r.missed);
        if (r.guard) { info.textContent = `🛑 Perulangan tidak pernah berhenti? Sudah ${GUARD} putaran dan robot masih di ubin 1, jadi syarat "menyentuh dinding" tidak pernah benar.`; ctx.sound.bad(); return; }
        info.textContent = `${r.rounds} putaran. ${r.missed.length ? `Ubin terlewat: ${r.missed.join(', ')}.` : 'Semua ubin dipel!'}`;
        if (r.missed.length) ctx.sound.bad(); else ctx.sound.win();
      },
    });
  }, 'primary');
  fresh();
  wrap.append(el('p', { class: 'prompt' }, 'Robot pengepel berhenti ketika menyentuh dinding. Apakah semua ubin dipel?'),
    el('div', { class: 'row' }, len.node), row, prog, holder, go, info);
  return { destroy() { stop?.(); } };
}

function createGuard(root, ctx) {
  const wrap = el('div', { class: 'act sampai-penuh' });
  root.append(wrap);
  let op = '=', stop = null;
  const holder = el('div'), prog = el('div');
  const info = el('p', { class: 'spn-info' });
  let view;
  const fresh = () => { stop?.(); view = savingView(op); holder.replaceChildren(view.node); prog.replaceChildren(code(['ATUR tabungan MENJADI 0', `ULANGI SAMPAI tabungan ${op} 25.000 [ TAMBAH tabungan 3.000 ]`])); info.textContent = ''; };
  const row = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Syarat'), ['=', '≥'].map((o) => {
    const b = button(`tabungan ${o} 25.000`, () => { op = o; row.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === b)); fresh(); }, 'small');
    if (o === op) b.classList.add('on');
    return b;
  }));
  const go = button('▶ Jalankan', () => {
    fresh();
    const r = save(op);
    stop = play(r.steps, view.show, {
      speed: 300,
      done: () => {
        if (r.guard) { info.textContent = `🛑 Perulangan tidak pernah berhenti? Sudah ${GUARD} putaran, tabungan ${rp(r.tabungan)}. Tabungan selalu kelipatan 3.000, jadi tidak pernah tepat 25.000.`; ctx.sound.bad(); return; }
        info.textContent = `Berhenti setelah ${r.rounds} putaran dengan tabungan ${rp(r.tabungan)}.`;
        ctx.sound.win();
      },
    });
  }, 'primary');
  fresh();
  wrap.append(el('p', { class: 'prompt' }, 'Penjaga perulangan menghentikan program setelah 100 putaran.'), row, prog, holder, go, info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A sets a secret tub; team B sees only the rounds and the
// spill (buckets of 10 litres) and guesses the size.
function createSecret(root, ctx) {
  const wrap = el('div', { class: 'act sampai-penuh' });
  root.append(wrap);
  let turn = 0, stop = null;
  const score = [0, 0];
  function start() {
    stop?.();
    const a = turn % 2, b = 1 - a;
    const secret = stepper('Isi bak rahasia', 50, { min: 10, max: 100, step: 1, fmt: (v) => `${v} liter` });
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: pilih isi bak rahasia. Tim ${b + 1} jangan melihat layar.`);
    const info = el('p', { class: 'spn-info' });
    const ready = button('Rahasia siap ✓', () => {
      const cap = secret.get();
      const r = fill(cap, 10, 'sampai');
      head.textContent = `Tim ${b + 1}: robot memakai ${Q} dengan ember 10 liter. Tebak isi baknya.`;
      const clue = el('div', { class: 'spn-petunjuk' }, el('b', null, `🔁 ${r.rounds} putaran`), el('b', null, `💦 tumpah ${r.spill} liter`));
      const guess = stepper('Tebakan', 50, { min: 10, max: 100, step: 1, fmt: (v) => `${v} liter` });
      const check = button('Buka bak', () => {
        check.remove(); guess.node.classList.add('kunci');
        const view = tubView(cap);
        wrap.insertBefore(view.node, info);
        stop = play(r.steps, view.show, {
          speed: 200,
          done: () => {
            const right = guess.get() === cap;
            if (right) { score[b]++; ctx.sound.win(); } else ctx.sound.bad();
            info.textContent = `Isi bak ${cap} liter. ${right ? `✅ Tebakan Tim ${b + 1} tepat!` : `✗ Tebakan Tim ${b + 1}: ${guess.get()} liter.`} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.replaceChildren(head, clue, guess.node, check, info);
    }, 'primary');
    wrap.replaceChildren(head, secret.node, ready, info);
  }
  start();
  return { destroy() { stop?.(); } };
}
