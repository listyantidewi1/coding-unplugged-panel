// Jika Lampu Merah — PAUD (4–6 tahun), kondisi (jika–maka).
// A traffic light changes colour; children press the matching action.
// Between lights come "jika … maka …" picture questions.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const ACTIONS = {
  berhenti: { icon: '🧍', label: 'berhenti' },
  jalan: { icon: '🚶', label: 'jalan' },
};
const LIGHT_RULE = { merah: 'berhenti', hijau: 'jalan' };

const PAIRS = [
  { when: ['🌧️', 'hujan'], then: [['☂️', 'pakai payung'], ['🧼', 'cuci tangan'], ['🛏️', 'tidur']] },
  { when: ['🤲', 'tangan kotor'], then: [['🧼', 'cuci tangan'], ['☂️', 'pakai payung'], ['🛏️', 'tidur']] },
  { when: ['😴', 'mengantuk'], then: [['🛏️', 'tidur'], ['☂️', 'pakai payung'], ['🧼', 'cuci tangan']] },
  { when: ['🥵', 'kepanasan'], then: [['💧', 'minum air'], ['🧥', 'pakai jaket'], ['🏃', 'lari-lari']] },
];

function trafficLight() {
  const red = el('i', { class: 'tl red' });
  const yellow = el('i', { class: 'tl yellow' });
  const green = el('i', { class: 'tl green' });
  return {
    node: el('div', { class: 'traffic' }, red, yellow, green),
    set(color) {
      red.classList.toggle('on', color === 'merah');
      yellow.classList.toggle('on', color === 'kuning');
      green.classList.toggle('on', color === 'hijau');
    },
  };
}

function lightRound(wrap, ctx, color, next) {
  const tl = trafficLight();
  tl.set('kuning');
  let ready = false;
  // A short yellow pause, so everyone watches before the colour shows.
  setTimeout(() => { tl.set(color); ready = true; }, 700 + Math.floor(ctx.rand.next() * 500));
  const buttons = Object.entries(ACTIONS).map(([k, a]) => onTap(el('button', { class: 'act-btn', type: 'button' },
    el('span', { class: 'opt-icon' }, a.icon), el('span', null, a.label)), (e) => {
    if (!ready) return;
    if (LIGHT_RULE[color] === k) {
      ready = false;
      e.currentTarget?.classList?.add('right');
      next();
    } else {
      ctx.mistake();
      shake(wrap.querySelector('.traffic'));
    }
  }));
  wrap.append(
    el('p', { class: 'prompt' }, 'Jika lampu merah, maka berhenti. Jika lampu hijau, maka jalan!'),
    tl.node,
    el('div', { class: 'row big-actions' }, buttons));
}

export default {
  id: 'paud-07-jika-lampu',
  title: 'Jika Lampu Merah',
  topic: 'Kondisi (jika–maka)',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🚦',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Anak menjalankan aturan "jika … maka …": lampu merah berarti berhenti, lampu hijau berarti jalan, dan keadaan lain dengan tindakannya.',
  extraModes: [{ id: 'aturan', icon: '✋', label: 'Buat Aturan', desc: 'Pilih tanda dan tindakan, lalu kelas bermain', create: createRules }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lampu' });
    root.append(wrap);
    // Pattern of rounds: lights with a question every third round.
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 900); };
      if (r % 3 === 2) {
        const p = PAIRS[Math.floor(r / 3) % PAIRS.length];
        choice(wrap, {
          prompt: `Jika ${p.when[1]}, maka …?`,
          subject: el('div', { class: 'when' }, el('span', { class: 'opt-icon' }, p.when[0]), el('span', null, `Jika ${p.when[1]}`)),
          ctx, onRight: next, columns: 3,
          options: ctx.rand.shuffle(p.then.map(([icon, label], i) => ({ icon, label, correct: i === 0 }))),
        });
      } else {
        lightRound(wrap, ctx, ctx.rand.pick(['merah', 'hijau']), next);
      }
    }
    render();
  },
};

// "Buat Aturan": choose up to three sign → action rules, then the panel
// shows random signs and the class acts. The teacher sets the speed.
const SIGNS = [['⭐', 'bintang'], ['🔔', 'lonceng'], ['✋', 'tangan'], ['🟡', 'bulatan kuning'], ['🐸', 'katak']];
const DOINGS = [['🦘', 'melompat'], ['🪑', 'duduk'], ['🤫', 'diam'], ['👏', 'tepuk tangan'], ['🙌', 'angkat tangan']];

function createRules(root, ctx) {
  const wrap = el('div', { class: 'act lampu' });
  root.append(wrap);
  const rules = [];
  let sign = null;
  const list = el('div', { class: 'rules' });
  const signRow = el('div', { class: 'palette' });
  const doRow = el('div', { class: 'palette' });
  function drawList() {
    list.replaceChildren(...(rules.length ? rules.map((r) => el('div', { class: 'rule' }, `Jika ${r.sign[0]} maka ${r.doing[0]} ${r.doing[1]}`))
      : [el('div', { class: 'rule empty' }, 'Belum ada aturan. Pilih tanda, lalu tindakannya.')]));
    play.disabled = !rules.length;
  }
  signRow.append(...SIGNS.map((s) => onTap(el('button', { class: 'move-btn', type: 'button' }, el('span', null, s[0]), el('small', null, s[1])), (e) => {
    sign = s;
    signRow.querySelectorAll('.move-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
  })));
  doRow.append(...DOINGS.map((d) => onTap(el('button', { class: 'move-btn', type: 'button' }, el('span', null, d[0]), el('small', null, d[1])), () => {
    if (!sign || rules.length >= 3) return;
    rules.splice(rules.findIndex((r) => r.sign === sign) >>> 0, rules.some((r) => r.sign === sign) ? 1 : 0);
    rules.push({ sign, doing: d });
    sign = null;
    signRow.querySelectorAll('.move-btn').forEach((b) => b.classList.remove('on'));
    drawList();
  })));

  let speed = 3000;
  const speeds = [['Lambat', 4000], ['Sedang', 3000], ['Cepat', 1800]];
  const speedRow = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Kecepatan:'), speeds.map(([l, ms]) => {
    const b = button(l, () => { speed = ms; speedRow.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === b)); }, ms === speed ? 'small on' : 'small');
    return b;
  }));
  let timer = null;
  const show = el('div', { class: 'sign-show' });
  const play = button('▶ Main', () => {
    if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Main'; show.textContent = ''; return; }
    play.textContent = '■ Berhenti';
    const tick = () => {
      const r = rules[Math.floor(Math.random() * rules.length)];
      show.replaceChildren(el('span', { class: 'sign-big' }, r.sign[0]));
      ctx.sound.tap();
      setTimeout(() => show.append(el('span', { class: 'sign-then' }, `maka ${r.doing[1]}!`)), speed * 0.5);
    };
    tick();
    timer = setInterval(tick, speed);
  }, 'primary');
  drawList();
  wrap.append(
    el('p', { class: 'prompt' }, 'Buat sampai tiga aturan "Jika … maka …". Pilih tanda, lalu tindakan.'),
    el('div', { class: 'rules-layout' },
      el('div', null, el('div', { class: 'label' }, 'Tanda'), signRow, el('div', { class: 'label' }, 'Tindakan'), doRow, list),
      el('div', { class: 'rules-play' }, show, speedRow, play)));
  return { destroy() { clearInterval(timer); } };
}
