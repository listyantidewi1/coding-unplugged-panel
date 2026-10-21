// Kalau Bel Berbunyi — PAUD (4–6 tahun), kejadian (event).
// Robi the cardboard robot waits for a sound and moves by its rules;
// a sound with no rule leaves Robi still.

import { el, onTap, button, choice, dnd, shake } from '../core/kit.js';

// A bamboo kentongan drawn inline, since there is no emoji for it.
function kentonganIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 40 48');
  svg.setAttribute('class', 'kbl-kentongan');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M20 1v7" stroke="#7c5a2a" stroke-width="2"/>'
    + '<rect x="11" y="8" width="18" height="38" rx="8" fill="#d6a756" stroke="#8a6326" stroke-width="2"/>'
    + '<rect x="18" y="16" width="4" height="22" rx="2" fill="#5b3d12"/>'
    + '<path d="M11 20h18M11 34h18" stroke="#8a6326" stroke-width="1.5"/>';
  return svg;
}

const SOUNDS = {
  bel: { icon: () => '🔔', label: 'bel berbunyi', short: 'bel', play: (s) => s.bell() },
  tepuk: { icon: () => '👏', label: 'tepuk tangan', short: 'tepuk', play: (s) => { s.clap(); setTimeout(() => s.clap(), 220); } },
  kentongan: { icon: kentonganIcon, label: 'kentongan dipukul', short: 'kentongan', play: (s) => s.kentongan() },
  peluit: { icon: () => '😗', label: 'peluit ditiup', short: 'peluit', play: (s) => s.whistle() },
};
const MOVES = {
  duduk: { icon: '🪑', label: 'duduk' },
  lompat: { icon: '🦘', label: 'melompat' },
  putar: { icon: '🔄', label: 'berputar' },
  lambai: { icon: '👋', label: 'melambai' },
  diam: { icon: '🧍', label: 'diam saja' },
};
const ROBI_RULES = { bel: 'duduk', tepuk: 'lompat', kentongan: 'putar' };

const soundIcon = (k) => el('span', { class: 'opt-icon' }, SOUNDS[k].icon());

// Robi on a small stage. `move(k)` plays one movement; `still()` shows that
// nothing happens.
function robi() {
  const body = el('span', { class: 'kbl-robi-body' }, '🤖');
  const note = el('div', { class: 'kbl-note' });
  const node = el('div', { class: 'kbl-robi' }, body, note);
  let t = null;
  const reset = () => { body.className = 'kbl-robi-body'; note.textContent = ''; };
  return {
    node,
    move(k) {
      clearTimeout(t); reset();
      void body.offsetWidth;
      body.classList.add(`kbl-${k}`);
      note.textContent = `${MOVES[k].icon} ${MOVES[k].label}`;
      t = setTimeout(reset, 2200);
    },
    still(text = 'Robi diam saja.') {
      clearTimeout(t); reset();
      note.textContent = `🧍 ${text}`;
      t = setTimeout(reset, 2200);
    },
    reset,
  };
}

function ruleTable(rules) {
  return el('div', { class: 'kbl-rules' }, Object.entries(rules).map(([s, m]) =>
    el('div', { class: 'kbl-rule' }, soundIcon(s), el('span', { class: 'kbl-arrow' }, '➡️'),
      el('span', { class: 'opt-icon' }, MOVES[m].icon), el('span', { class: 'kbl-rule-label' }, MOVES[m].label))));
}

// A big "listen again" button for the sound in a question.
function listen(ctx, k) {
  const b = onTap(el('button', { class: 'act-btn kbl-listen', type: 'button' }, soundIcon(k), el('span', null, `🔊 ${SOUNDS[k].label}`)),
    () => SOUNDS[k].play(ctx.sound));
  setTimeout(() => SOUNDS[k].play(ctx.sound), 300);
  return b;
}

// Worksheet question 1 (a–d), question 2, then "which sound made Robi move?"
// rounds, and a last round with other rules (like question 3).
const PLAN = [
  { q: 'gerak', s: 'tepuk' }, { q: 'gerak', s: 'bel' }, { q: 'gerak', s: 'kentongan' }, { q: 'gerak', s: 'tepuk' },
  { q: 'peluit' },
  { q: 'bunyi' }, { q: 'bunyi' },
  { q: 'baru' },
];
const OTHER_RULES = [
  { bel: 'lambai', tepuk: 'duduk', kentongan: 'lompat' },
  { bel: 'putar', tepuk: 'lambai', kentongan: 'duduk' },
  { bel: 'lompat', tepuk: 'putar', kentongan: 'lambai' },
];

function moveOptions(keys, answer) {
  return keys.map((k) => ({ icon: MOVES[k].icon, label: MOVES[k].label, correct: k === answer }));
}

function round(wrap, ctx, p, next) {
  if (p.q === 'gerak' || p.q === 'peluit') {
    const s = p.s ?? 'peluit';
    wrap.append(ruleTable(ROBI_RULES));
    choice(wrap, {
      prompt: p.q === 'peluit' ? 'Peluit tidak ada di aturan Robi. Apa yang dilakukan Robi?' : 'Dengarkan bunyinya. Apa yang dilakukan Robi?',
      subject: listen(ctx, s),
      ctx, onRight: next, columns: p.q === 'peluit' ? 4 : 3,
      options: moveOptions(p.q === 'peluit' ? ['duduk', 'lompat', 'putar', 'diam'] : ['duduk', 'lompat', 'putar'], ROBI_RULES[s] ?? 'diam'),
    });
    return;
  }
  if (p.q === 'bunyi') {
    const s = ctx.rand.pick(Object.keys(ROBI_RULES));
    const r = robi();
    const again = button('▶ Lihat lagi', () => r.move(ROBI_RULES[s]), 'small');
    wrap.append(ruleTable(ROBI_RULES));
    choice(wrap, {
      prompt: 'Robi bergerak! Bunyi apa yang tadi terdengar?',
      subject: el('div', { class: 'kbl-stage' }, r.node, again),
      ctx, onRight: () => { SOUNDS[s].play(ctx.sound); next(); }, columns: 4,
      options: ['bel', 'tepuk', 'kentongan', 'peluit'].map((k) => ({ icon: SOUNDS[k].icon(), label: SOUNDS[k].short, correct: k === s })),
    });
    setTimeout(() => r.move(ROBI_RULES[s]), 400);
    return;
  }
  // Other rules, like a friend's rules from question 3.
  const rules = ctx.rand.pick(OTHER_RULES);
  const s = ctx.rand.pick(Object.keys(rules));
  wrap.append(el('p', { class: 'kbl-sub' }, 'Ini aturan buatan teman. Aturannya berbeda!'), ruleTable(rules));
  choice(wrap, {
    prompt: 'Dengarkan bunyinya. Apa yang dilakukan robot teman?',
    subject: listen(ctx, s),
    ctx, onRight: next, columns: 4,
    options: moveOptions(['duduk', 'lompat', 'putar', 'lambai'], rules[s]),
  });
}

export default {
  id: 'paud-11-kalau-bel',
  title: 'Kalau Bel Berbunyi',
  topic: 'Kejadian (event)',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🔔',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Anak menjalankan aturan "kalau terdengar bunyi ini, maka bergerak begitu", tahu bahwa robot diam bila tidak ada aturan untuk bunyi itu, dan membuat aturannya sendiri.',
  extraModes: [
    { id: 'aturan', icon: '🤖', label: 'Aturan Robi', desc: 'Susun aturan, ketuk bunyi, dan kelas bergerak bersama Robi', create: createRules },
    { id: 'tebak', icon: '🙈', label: 'Tebak Aturan', desc: 'Satu anak menyusun aturan rahasia, teman menebak dari gerakan Robi', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kalau-bel' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 1200); });
    }
    render();
  },
};

// Rule board shared by both extra modes: a slot beside each sound takes a
// move card (drag or tap-then-tap). Two sounds may share a move.
function ruleBoard(ctx, { hidden = false, onChange = () => {} } = {}) {
  const rules = {};
  const slots = {};
  const r = robi();
  const soundRows = Object.keys(SOUNDS).map((k) => {
    const slot = el('div', { class: 'kbl-slot', 'data-drop': k }, el('span', { class: 'kbl-empty' }, 'kosong'));
    slots[k] = slot;
    const btn = onTap(el('button', { class: 'kbl-sound', type: 'button' }, soundIcon(k), el('span', null, SOUNDS[k].short)), () => {
      SOUNDS[k].play(ctx.sound);
      btn.classList.add('ring');
      setTimeout(() => btn.classList.remove('ring'), 600);
      // Robi only reacts once the sound has happened.
      setTimeout(() => (rules[k] ? r.move(rules[k]) : r.still('Tidak ada aturan, Robi diam saja.')), 450);
    });
    return el('div', { class: 'kbl-row', 'data-s': k }, btn, el('span', { class: 'kbl-arrow' }, '➡️'), slot);
  });
  const cards = ['duduk', 'lompat', 'putar', 'lambai'].map((m) =>
    el('div', { class: 'kbl-card', 'data-drag': '', 'data-m': m }, el('span', null, MOVES[m].icon), el('small', null, MOVES[m].label)));
  const tray = el('div', { class: 'kbl-tray' }, cards);
  const draw = () => {
    Object.entries(slots).forEach(([k, slot]) => {
      const m = rules[k];
      // Covered slots all look the same, so an empty one gives nothing away.
      const covered = board.classList.contains('tutup');
      slot.replaceChildren(covered ? el('span', { class: 'kbl-cover' }, '❓')
        : m ? el('span', { class: 'kbl-set' }, el('span', null, MOVES[m].icon), el('small', null, MOVES[m].label))
          : el('span', { class: 'kbl-empty' }, 'kosong'));
      slot.classList.toggle('on', covered || !!m);
    });
    onChange(rules);
  };
  const board = el('div', { class: `kbl-board${hidden ? ' tutup' : ''}` }, el('div', { class: 'kbl-rows' }, soundRows), el('div', { class: 'kbl-side' }, r.node, tray));
  dnd(board, (card, target) => {
    if (!card.dataset.m || !target.dataset.drop || !SOUNDS[target.dataset.drop]) return;
    rules[target.dataset.drop] = card.dataset.m;
    ctx.sound.tap();
    draw();
  });
  // Tapping a filled slot empties it again.
  Object.entries(slots).forEach(([k, slot]) => slot.addEventListener('click', () => {
    if (board.classList.contains('tutup')) return;
    if (rules[k] && !board.querySelector('.kbl-card.selected')) { delete rules[k]; draw(); }
  }));
  draw();
  return {
    node: board, rules, robi: r, rows: soundRows,
    clear() { Object.keys(rules).forEach((k) => delete rules[k]); draw(); },
    set(next) { Object.assign(rules, next); draw(); },
    hide(v) { board.classList.toggle('tutup', v); tray.style.display = v ? 'none' : ''; draw(); },
  };
}

function createRules(root, ctx) {
  const wrap = el('div', { class: 'act kalau-bel' });
  root.append(wrap);
  const board = ruleBoard(ctx);
  board.set(ROBI_RULES);
  wrap.append(
    el('p', { class: 'prompt' }, 'Seret kartu gerak ke samping bunyi. Ketuk bunyinya, lalu bergerak bersama Robi!'),
    board.node,
    el('div', { class: 'row' },
      button('Aturan Robi', () => { board.clear(); board.set(ROBI_RULES); }, 'small'),
      button('Kosongkan aturan', () => board.clear(), 'small')),
    el('p', { class: 'kbl-sub' }, 'Ketuk kartu di samping bunyi untuk melepasnya. Bunyi tanpa aturan membuat Robi diam.'));
}

// Bergiliran: one child hides the rules, a friend taps sounds, watches Robi,
// then guesses each rule. Cards open after the guess and roles swap.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act kalau-bel' });
  root.append(wrap);
  const score = [0, 0];
  let turn = 0;
  function start() {
    wrap.replaceChildren();
    const maker = turn % 2, guesser = 1 - maker;
    const head = el('p', { class: 'prompt' }, `Tim ${maker + 1}: susun aturan rahasia. Tim ${guesser + 1} jangan melihat!`);
    const board = ruleBoard(ctx);
    const ready = button('🙈 Tutup kartu', () => {
      if (!Object.keys(board.rules).length) { shake(board.node); return; }
      board.hide(true);
      head.textContent = `Tim ${guesser + 1}: ketuk bunyi, lihat Robi, lalu tebak aturannya.`;
      ready.remove();
      wrap.querySelector('.kbl-actions').append(guessRow());
    }, 'primary');
    const scoreLine = el('p', { class: 'kbl-sub' }, `Skor tebakan · Tim 1: ${score[0]} · Tim 2: ${score[1]}`);
    // The guess buttons sit in each sound's row, after the covered card.
    function guessRow() {
      const guess = {};
      board.node.classList.add('tebak');
      board.rows.forEach((row) => {
        const k = row.dataset.s;
        const opts = ['duduk', 'lompat', 'putar', 'lambai', 'diam'].map((m) => {
          const b = onTap(el('button', { class: 'move-btn', type: 'button', 'data-m': m }, el('span', null, MOVES[m].icon), el('small', null, MOVES[m].label)), () => {
            guess[k] = m;
            b.parentElement.querySelectorAll('.move-btn').forEach((x) => x.classList.toggle('on', x === b));
          });
          return b;
        });
        row.append(el('div', { class: 'kbl-guess-opts' }, opts));
      });
      const open = button('Buka kartu', () => {
        let right = 0;
        board.rows.forEach((row) => {
          const k = row.dataset.s;
          const truth = board.rules[k] ?? 'diam';
          const ok = guess[k] === truth;
          if (ok) right++;
          row.classList.add(ok ? 'benar' : 'salah');
          row.querySelectorAll('.move-btn').forEach((b) => b.classList.toggle('kunci', b.dataset.m === truth));
        });
        score[guesser] += right;
        board.hide(false);
        head.textContent = `Tim ${guesser + 1} menebak ${right} dari 4 aturan dengan benar.`;
        scoreLine.textContent = `Skor tebakan · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
        if (right === 4) ctx.sound.win(); else ctx.sound.good();
        open.replaceWith(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
      }, 'primary');
      return open;
    }
    wrap.append(head, board.node, el('div', { class: 'row kbl-actions' }, ready), scoreLine);
  }
  start();
}
