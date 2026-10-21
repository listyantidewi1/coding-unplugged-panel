// Jika Hujan, Maka... — SD Awal (7–9 tahun), percabangan.
// Before school Dimas passes three decision gates. Children move Dimas to
// the right branch at every gate for the day's situation, then work
// backwards: from what Dimas did, guess the situation.

import { el, onTap, button, dnd, shake } from '../core/kit.js';

// Gate questions with their YA and TIDAK actions. The first three are the
// worksheet's; the rest can be used in "Buat Gerbang".
const QUESTIONS = [
  { id: 'hujan', icon: '🌧️', q: 'Apakah hujan?', ya: ['☂️', 'bawa payung'], tidak: ['🧢', 'pakai topi'], fact: ['hujan', 'cerah'] },
  { id: 'sarapan', icon: '🍳', q: 'Apakah sudah sarapan?', ya: ['🚶', 'langsung berangkat'], tidak: ['🍞', 'makan roti dulu'], fact: ['sudah sarapan', 'belum sarapan'] },
  { id: 'jumat', icon: '🗓️', q: 'Apakah hari ini Jumat?', ya: ['👕', 'bawa baju olahraga'], tidak: ['📘', 'bawa buku gambar'], fact: ['hari Jumat', 'bukan hari Jumat'] },
  { id: 'pr', icon: '📝', q: 'Apakah ada PR?', ya: ['🎒', 'masukkan PR ke tas'], tidak: ['📚', 'bawa buku cerita'], fact: ['ada PR', 'tidak ada PR'] },
  { id: 'sepeda', icon: '🚲', q: 'Apakah naik sepeda?', ya: ['⛑️', 'pakai helm'], tidak: ['👟', 'pakai sepatu jalan'], fact: ['naik sepeda', 'jalan kaki'] },
  { id: 'panas', icon: '☀️', q: 'Apakah panas terik?', ya: ['💧', 'bawa botol minum'], tidak: ['🧥', 'pakai jaket'], fact: ['panas terik', 'sejuk'] },
  { id: 'piket', icon: '🧹', q: 'Apakah hari ini piket?', ya: ['⏰', 'berangkat lebih pagi'], tidak: ['🕖', 'berangkat seperti biasa'], fact: ['jadwal piket', 'tidak piket'] },
];
const BASE = QUESTIONS.slice(0, 3);

const factText = (gates, answers) => gates.map((g, i) => g.fact[answers[i] ? 0 : 1]).join(', ');

// The diagram: home → gate → gate → gate → school, each gate with a YA
// branch above and a TIDAK branch below. `onBranch(gate, yes)` when Dimas is
// dropped (or tapped) onto a branch.
function diagram(gates, { onBranch } = {}) {
  const dimas = el('div', { class: 'dimas', 'data-drag': '' }, '🧒');
  const cols = gates.map((g, i) => {
    const ya = el('div', { class: 'branch ya', 'data-drop': `${i}:1` }, el('span', { class: 'branch-icon' }, g.ya[0]), el('small', null, `YA: ${g.ya[1]}`));
    const tidak = el('div', { class: 'branch tidak', 'data-drop': `${i}:0` }, el('span', { class: 'branch-icon' }, g.tidak[0]), el('small', null, `TIDAK: ${g.tidak[1]}`));
    const gate = el('div', { class: 'gate' }, el('span', { class: 'gate-diamond' }, el('span', null, g.icon)), el('small', null, `${i + 1}. ${g.q}`));
    return { node: el('div', { class: 'gate-col' }, ya, gate, tidak), ya, tidak, gate };
  });
  const home = el('div', { class: 'end-cell' }, el('span', null, '🏠'), el('small', null, 'rumah'));
  const school = el('div', { class: 'end-cell' }, el('span', null, '🏫'), el('small', null, 'sekolah'));
  const node = el('div', { class: 'gates' }, home, cols.map((c) => c.node), school);
  home.append(dimas);
  if (onBranch) {
    // A branch can be tapped directly, or Dimas dragged onto it; one
    // touch must not count twice.
    let last = 0;
    const hit = (target) => {
      if (performance.now() - last < 300) return;
      last = performance.now();
      const [g, y] = target.dataset.drop.split(':').map(Number);
      onBranch(g, y === 1);
    };
    cols.forEach((c) => { onTap(c.ya, () => hit(c.ya)); onTap(c.tidak, () => hit(c.tidak)); });
    dnd(node, (item, target) => hit(target));
  }
  return {
    node, dimas, cols,
    at(gate, yes) { (yes ? cols[gate].ya : cols[gate].tidak).append(dimas); },
    arrive() { school.append(dimas); },
    home() { home.append(dimas); },
    light(gate, yes) { (yes ? cols[gate].ya : cols[gate].tidak).classList.add('taken'); },
    current(gate) { cols.forEach((c, i) => c.node.classList.toggle('now', i === gate)); },
  };
}

// Move Dimas through every gate for a given day.
function walkRound(wrap, ctx, gates, answers, title, next) {
  let gate = 0;
  const done = [];
  const log = el('div', { class: 'did' });
  const d = diagram(gates, {
    onBranch(g, yes) {
      if (g !== gate) { shake(d.cols[g].node); return; }
      if (yes !== answers[g]) { ctx.mistake(); shake(d.cols[g].gate); return; }
      d.at(g, yes);
      d.light(g, yes);
      done.push(yes ? gates[g].ya : gates[g].tidak);
      log.replaceChildren(el('b', null, 'Dimas: '), done.map(([i, t]) => el('span', { class: 'did-item' }, `${i} ${t}`)));
      ctx.sound.tap();
      gate++;
      d.current(gate);
      if (gate === gates.length) { setTimeout(() => d.arrive(), 400); next(); }
    },
  });
  d.current(0);
  wrap.append(
    el('p', { class: 'prompt' }, `${title}: ${factText(gates, answers)}. Seret Dimas (atau ketuk cabang) yang benar di setiap gerbang.`),
    d.node, log);
}

// From what Dimas did, choose YA or TIDAK for each question.
function guessRound(wrap, ctx, gates, answers, next) {
  const marks = gates.map(() => null);
  const d = diagram(gates);
  d.arrive();
  const rows = gates.map((g, i) => {
    const yes = button('ya', () => set(i, true), 'small');
    const no = button('tidak', () => set(i, false), 'small');
    return { node: el('div', { class: 'guess-row' }, el('span', null, `${g.icon} ${g.q}`), yes, no), yes, no };
  });
  function set(i, v) {
    marks[i] = v;
    rows[i].yes.classList.toggle('on', v === true);
    rows[i].no.classList.toggle('on', v === false);
    check.disabled = marks.includes(null);
  }
  const check = button('Periksa', () => {
    const wrong = marks.map((m, i) => m !== answers[i]);
    if (wrong.some(Boolean)) { ctx.mistake(); wrong.forEach((w, i) => w && shake(rows[i].node)); return; }
    gates.forEach((g, i) => d.light(i, answers[i]));
    next();
  }, 'primary');
  check.disabled = true;
  const did = gates.map((g, i) => (answers[i] ? g.ya : g.tidak));
  wrap.append(
    el('p', { class: 'prompt' }, 'Tebak harinya! Dimas sudah sampai di sekolah. Lihat apa yang Dimas lakukan.'),
    el('div', { class: 'did big' }, el('b', null, 'Dimas: '), did.map(([i, t]) => el('span', { class: 'did-item' }, `${i} ${t}`))),
    d.node, el('div', { class: 'guess-rows' }, rows.map((r) => r.node)), check);
}

const PLAN = [
  { kind: 'jalan', title: 'Hari Senin', answers: [true, true, false] },
  { kind: 'jalan', title: 'Hari Jumat', answers: [false, false, true] },
  { kind: 'tebak', answers: [false, true, false] },
];

export default {
  id: 'sda-06-jika-hujan',
  title: 'Jika Hujan, Maka...',
  topic: 'Percabangan (jika–maka–jika tidak)',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '☂️',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid mengikuti aturan "jika … maka …, jika tidak …" di tiga gerbang keputusan dan menebak keadaan dari hasil akhirnya.',
  extraModes: [
    { id: 'koin', icon: '🪙', label: 'Lempar Koin', desc: 'Setiap tim melempar koin di setiap gerbang dan mencatat perjalanan Dimas', create: createCoin },
    { id: 'gerbang', icon: '🛠️', label: 'Buat Gerbang', desc: 'Ganti pertanyaan di setiap gerbang untuk membuat aturan baru', create: createGates },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hujan' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1800); };
      const p = PLAN[r] || { kind: r % 2 ? 'jalan' : 'tebak', title: 'Hari ini', answers: BASE.map(() => ctx.rand.next() < 0.5) };
      if (p.kind === 'jalan') walkRound(wrap, ctx, BASE, p.answers, p.title, next);
      else guessRound(wrap, ctx, BASE, p.answers, next);
    }
    render();
  },
};

// Lempar Koin: at each gate press the coin (gambar = YA, angka = TIDAK);
// every finished trip is written to the team's log.
function createCoin(root, ctx, gates = BASE) {
  const wrap = el('div', { class: 'act hujan' });
  root.append(wrap);
  const logs = el('ol', { class: 'coin-log' });
  let d;
  let gate = 0;
  let did = [];
  let trip = 0;
  const coin = el('div', { class: 'coin' }, '🪙');
  const say = el('p', { class: 'reveal' });
  const flip = button('🪙 Lempar koin', () => {
    if (gate >= gates.length) { fresh(); return; }
    flip.disabled = true;
    coin.classList.remove('spin');
    void coin.offsetWidth;
    coin.classList.add('spin');
    ctx.sound.spin();
    const yes = Math.random() < 0.5;
    setTimeout(() => {
      coin.textContent = yes ? '🦅' : '1️⃣';
      say.textContent = `${yes ? 'Gambar: YA' : 'Angka: TIDAK'}, maka ${(yes ? gates[gate].ya : gates[gate].tidak)[1]}.`;
      d.at(gate, yes);
      d.light(gate, yes);
      did.push(yes ? gates[gate].ya : gates[gate].tidak);
      gate++;
      d.current(gate);
      flip.disabled = false;
      if (gate === gates.length) {
        d.arrive();
        logs.append(el('li', null, el('b', null, `Tim ${(trip % 4) + 1}: `), did.map(([i]) => i).join(' ')));
        trip++;
        flip.textContent = '🔁 Perjalanan baru';
      }
    }, 700);
  }, 'primary');
  function fresh() {
    gate = 0;
    did = [];
    d = diagram(gates);
    d.current(0);
    stageHolder.replaceChildren(d.node);
    coin.textContent = '🪙';
    say.textContent = '';
    flip.textContent = '🪙 Lempar koin';
  }
  const stageHolder = el('div', { class: 'gates-holder' });
  wrap.append(
    el('p', { class: 'prompt' }, 'Lempar koin di setiap gerbang: gambar = YA, angka = TIDAK. Catat perjalanan Dimas untuk setiap tim!'),
    stageHolder, el('div', { class: 'coin-row' }, coin, flip, say), logs);
  fresh();
}

// Buat Gerbang: choose a question for each gate, then play the coin game
// or ask the class to walk Dimas through a random day.
function createGates(root, ctx) {
  const wrap = el('div', { class: 'act hujan' });
  root.append(wrap);
  const chosen = BASE.slice();
  function edit() {
    const preview = el('div', { class: 'gates-holder' }, diagram(chosen).node);
    const pickers = chosen.map((g, i) => el('div', { class: 'gate-pick' }, el('b', null, `Gerbang ${i + 1}`),
      el('div', { class: 'row' }, QUESTIONS.map((q) => onTap(el('button', { class: `move-btn ${chosen[i] === q ? 'on' : ''}`, type: 'button', disabled: chosen.includes(q) && chosen[i] !== q },
        el('span', null, q.icon), el('small', null, q.q)), () => { chosen[i] = q; edit(); })))));
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Pilih pertanyaan untuk setiap gerbang. Aturan "jika … maka …, jika tidak …" ikut berubah.'),
      preview, el('div', { class: 'gate-picks' }, pickers),
      el('div', { class: 'row' },
        button('🪙 Main lempar koin', () => { wrap.remove(); createCoin(root, ctx, chosen.slice()); }, 'primary'),
        button('🧒 Main antar Dimas', () => play(), 'primary')));
  }
  function play() {
    const answers = chosen.map(() => Math.random() < 0.5);
    wrap.replaceChildren();
    walkRound(wrap, ctx, chosen, answers, 'Hari ini', () => {
      ctx.sound.win();
      wrap.append(el('div', { class: 'row' }, button('Hari lain', play, 'primary'), button('Ubah gerbang', edit)));
    });
  }
  edit();
}
