// Kartu Matahari–Bulan — PAUD (4–6 tahun), representasi data dengan dua tanda.
// Every object has a three-sign code (merah? bulat? bisa dimakan?) with
// ☀️ = ya and 🌙 = tidak. Children write codes and read them back.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const QUESTIONS = [['🔴', 'Merah?'], ['⚪', 'Bulat?'], ['😋', 'Bisa dimakan?']];
const YA = '☀️';
const TIDAK = '🌙';

// One object for each of the eight codes, so every code names exactly one thing.
const THINGS = [
  { icon: '🍎', label: 'apel', code: [1, 1, 1] },
  { icon: '🔴', label: 'bola merah', code: [1, 1, 0] },
  { icon: '🌶️', label: 'cabai merah', code: [1, 0, 1] },
  { icon: '🚗', label: 'mobil merah', code: [1, 0, 0] },
  { icon: '🍊', label: 'jeruk', code: [0, 1, 1] },
  { icon: '🔵', label: 'kelereng biru', code: [0, 1, 0] },
  { icon: '🍌', label: 'pisang', code: [0, 0, 1] },
  { icon: '🟦', label: 'kotak biru', code: [0, 0, 0] },
];
const byLabel = (l) => THINGS.find((t) => t.label === l);
const signs = (code) => code.map((b) => (b ? YA : TIDAK)).join(' ');

// The worksheet's own items come first.
const WORKSHEET = [
  { type: 'tulis', thing: 'bola merah' },
  { type: 'baca', code: [0, 1, 1], options: ['jeruk', 'mobil merah', 'pisang'] },
  { type: 'tulis', thing: 'pisang' },
  { type: 'baca', code: [1, 0, 0], options: ['jeruk', 'mobil merah', 'kotak biru'] },
  { type: 'tulis', thing: 'kotak biru' },
];

function header() {
  return el('div', { class: 'code-head' }, QUESTIONS.map(([icon, q]) => el('div', null, el('span', { class: 'opt-icon' }, icon), el('small', null, q))));
}

function writeRound(wrap, ctx, thing, next) {
  const marks = [null, null, null];
  const cells = marks.map((_, i) => onTap(el('button', { class: 'code-cell', type: 'button', 'aria-label': QUESTIONS[i][1] }), () => {
    marks[i] = marks[i] === 1 ? 0 : 1;
    cells[i].textContent = marks[i] ? YA : TIDAK;
    ctx.sound.tap();
    check.disabled = marks.includes(null);
  }));
  const check = button('Periksa', () => {
    const wrong = marks.map((m, i) => m !== thing.code[i]);
    cells.forEach((c, i) => c.classList.toggle('wrong', wrong[i]));
    if (wrong.some(Boolean)) { ctx.mistake(); shake(wrap.querySelector('.code-grid')); return; }
    cells.forEach((c) => c.classList.add('right'));
    next();
  }, 'primary');
  check.disabled = true;
  wrap.append(
    el('p', { class: 'prompt' }, `Tulis kode untuk ${thing.label}. Ketuk kotak: ${YA} ya, ${TIDAK} tidak.`),
    el('div', { class: 'code-layout' },
      el('div', { class: 'thing' }, el('span', { class: 'thing-icon' }, thing.icon), el('span', null, thing.label)),
      el('div', { class: 'code-grid' }, header(), el('div', { class: 'code-row' }, cells))),
    check);
}

function readRound(wrap, ctx, code, optionLabels, next) {
  const answer = THINGS.find((t) => t.code.join() === code.join());
  choice(wrap, {
    prompt: 'Tebak bendanya! Benda mana yang cocok dengan kode ini?',
    subject: el('div', { class: 'code-grid' }, header(), el('div', { class: 'code-row' }, code.map((b) => el('span', { class: 'code-cell' }, b ? YA : TIDAK)))),
    ctx, onRight: next, columns: 3,
    options: ctx.rand.shuffle(optionLabels.map((l) => byLabel(l)).map((t) => ({ icon: t.icon, label: t.label, correct: t === answer }))),
  });
}

export default {
  id: 'paud-09-ya-tidak',
  title: 'Kartu Matahari–Bulan',
  topic: 'Representasi data dengan dua tanda',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🌗',
  source: null,
  rounds: 6,
  maxPlayers: 4,
  goal: 'Anak menuliskan benda sebagai kode tiga tanda (☀️ ya, 🌙 tidak) dan menebak benda dari kodenya.',
  extraModes: [{ id: 'rahasia', icon: '🤫', label: 'Benda Rahasia', desc: 'Satu tim memilih diam-diam, tim lain menebak dari kode', create: createSecret }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act yatidak' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1100); };
      let item = WORKSHEET[r];
      if (!item) {
        const t = ctx.rand.pick(THINGS);
        item = r % 2 === 0 ? { type: 'tulis', thing: t.label }
          : { type: 'baca', code: t.code, options: [t.label, ...ctx.rand.shuffle(THINGS.filter((x) => x !== t)).slice(0, 2).map((x) => x.label)] };
      }
      if (item.type === 'tulis') writeRound(wrap, ctx, byLabel(item.thing), next);
      else readRound(wrap, ctx, item.code, item.options, next);
    }
    render();
  },
};

// Benda Rahasia: pick secretly, then only the code shows; the others guess.
function createSecret(root, ctx) {
  const wrap = el('div', { class: 'act yatidak' });
  root.append(wrap);
  function pickScreen() {
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim lain menutup mata! Pilih satu benda rahasia.'),
      el('div', { class: 'opts', style: { '--cols': 4 } }, THINGS.map((t) => onTap(el('button', { class: 'opt', type: 'button' },
        el('span', { class: 'opt-icon' }, t.icon), el('span', { class: 'opt-label' }, t.label)), () => guessScreen(t)))));
  }
  function guessScreen(secret) {
    wrap.replaceChildren();
    const result = el('p', { class: 'reveal' });
    choice(wrap, {
      prompt: 'Buka mata! Ini kode benda rahasianya. Benda apa?',
      subject: el('div', { class: 'code-grid' }, header(), el('div', { class: 'code-row' }, secret.code.map((b) => el('span', { class: 'code-cell' }, b ? YA : TIDAK)))),
      ctx, columns: 4,
      onRight() {
        ctx.sound.win();
        result.textContent = `Benar! Benda rahasianya ${secret.label}.`;
      },
      options: THINGS.map((t) => ({ icon: t.icon, label: t.label, correct: t === secret })),
    });
    wrap.append(result, button('Benda rahasia baru', pickScreen, 'primary'));
  }
  pickScreen();
}
