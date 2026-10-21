// Tombol Ini untuk Apa? — PAUD (4–6 tahun), interaksi manusia–komputer.
// Press a button on a pretend tablet to see what it does, then pick its
// meaning; compare an easy and a hard remote; design your own button.

import { el, onTap, button, choice } from '../core/kit.js';

// Each button shows its effect on the small screen when pressed.
const BUTTONS = [
  { icon: '▶️', meaning: ['📺', 'video mulai diputar'], effect: (s) => s.replaceChildren(el('span', { class: 'fx-ball' }, '⚽')) },
  { icon: '🔊', meaning: ['🔊', 'suaranya terdengar'], effect: (s, sound) => { s.replaceChildren(el('span', { class: 'fx-wave' }, '🎵')); sound.win(); } },
  { icon: '🏠', meaning: ['🏠', 'kembali ke awal'], effect: (s) => s.replaceChildren(el('span', { class: 'fx-home' }, '🏠 Layar awal')) },
  { icon: '❌', meaning: ['🚪', 'menutup'], effect: (s) => { s.replaceChildren(); s.classList.add('fx-closed'); } },
  { icon: '⏸️', meaning: ['✋', 'video berhenti sebentar'], effect: (s) => s.replaceChildren(el('span', null, '⚽ ⏸️')) },
  { icon: '🔍', meaning: ['🔎', 'mencari sesuatu'], effect: (s) => s.replaceChildren(el('span', { class: 'fx-search' }, '🔍 ...')) },
];

function tabletRound(wrap, ctx, b, next) {
  const screen = el('div', { class: 'fx-screen' }, el('span', { class: 'fx-idle' }, '🙂'));
  const press = onTap(el('button', { class: 'big-icon-btn', type: 'button', 'aria-label': 'tombol' }, b.icon), () => {
    screen.classList.remove('fx-closed');
    b.effect(screen, ctx.sound);
  });
  const others = ctx.rand.shuffle(BUTTONS.filter((x) => x !== b)).slice(0, 3);
  choice(wrap, {
    prompt: 'Tekan tombolnya dan lihat yang terjadi. Apa arti tombol ini?',
    subject: el('div', { class: 'tablet' }, screen, press),
    ctx, onRight: next, columns: 2,
    options: ctx.rand.shuffle([b, ...others].map((x) => ({ icon: x.meaning[0], label: x.meaning[1], correct: x === b }))),
  });
}

function remote(easy) {
  const keys = easy
    ? [['⏻', '#dc2626'], ['🔊', '#2563eb'], ['🔉', '#2563eb'], ['▶️', '#16a34a'], ['⏸️', '#ca8a04'], ['🏠', '#9333ea']]
    : Array.from({ length: 12 }, () => ['', '#94a3b8']);
  return el('div', { class: `remote ${easy ? 'easy' : 'hard'}` },
    keys.map(([icon, color]) => el('span', { class: 'rkey', style: { background: color } }, icon)));
}

export default {
  id: 'paud-10-tombol',
  title: 'Tombol Ini untuk Apa?',
  topic: 'Interaksi manusia–komputer',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🔘',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Anak mengenali arti ikon tombol, memilih tampilan yang mudah dipakai, dan merancang tombol yang bisa ditebak temannya.',
  extraModes: [{ id: 'rancang', icon: '✏️', label: 'Rancang Tombol', desc: 'Gambar tombol untuk tugas rahasia, tim lain menebak', create: createDesign }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tombol' });
    root.append(wrap);
    // The four worksheet buttons first, then the remote question, then more.
    const order = [0, 1, 2, 3];
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1100); };
      if (r === 4) {
        choice(wrap, {
          prompt: 'Mana remote yang lebih mudah dipakai?',
          ctx, onRight: next, columns: 2,
          options: [
            { icon: remote(false), label: 'A: tombol kecil abu-abu tanpa gambar' },
            { icon: remote(true), label: 'B: tombol besar, berwarna, bergambar', correct: true },
          ],
        });
        return;
      }
      const b = r < 4 ? BUTTONS[order[r]] : ctx.rand.pick(BUTTONS);
      tabletRound(wrap, ctx, b, next);
    }
    render();
  },
};

// Rancang Tombol: a secret task, a drawing canvas, then a guess.
const TASKS = [['💡', 'menyalakan lampu'], ['👩', 'memanggil Ibu'], ['🚪', 'membuka pintu'], ['🪴', 'menyiram tanaman'], ['🎵', 'memutar lagu'], ['📷', 'memotret']];

function createDesign(root, ctx) {
  const wrap = el('div', { class: 'act tombol' });
  root.append(wrap);
  function pickTask() {
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim lain menutup mata! Pilih tugas rahasia untuk tombolmu.'),
      el('div', { class: 'opts', style: { '--cols': 3 } }, TASKS.map((t) => onTap(el('button', { class: 'opt', type: 'button' },
        el('span', { class: 'opt-icon' }, t[0]), el('span', { class: 'opt-label' }, t[1])), () => draw(t)))));
  }
  function draw(task) {
    const canvas = el('canvas', { class: 'draw-canvas', width: 600, height: 600 });
    const g = canvas.getContext('2d');
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const last = new Map();
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
    };
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); last.set(e.pointerId, pos(e)); });
    canvas.addEventListener('pointermove', (e) => {
      const p0 = last.get(e.pointerId);
      if (!p0) return;
      const p1 = pos(e);
      g.strokeStyle = color;
      g.lineWidth = 18;
      g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
      last.set(e.pointerId, p1);
    });
    const end = (e) => last.delete(e.pointerId);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    let color = '#0f172a';
    const colors = el('div', { class: 'row' }, ['#0f172a', '#dc2626', '#2563eb', '#16a34a', '#eab308'].map((c) =>
      onTap(el('button', { class: 'swatch', type: 'button', style: { background: c }, 'aria-label': 'warna' }), () => { color = c; })));
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, `Gambar tombol untuk: ${task[1]}. Jangan beri tahu tim lain!`),
      el('div', { class: 'draw-layout' }, el('div', { class: 'draw-frame' }, canvas),
        el('div', { class: 'draw-side' }, colors,
          button('Hapus', () => g.clearRect(0, 0, canvas.width, canvas.height), 'ghost'),
          button('Selesai, tebak!', () => guess(task, canvas), 'primary'))));
  }
  function guess(task, canvas) {
    wrap.replaceChildren();
    const result = el('p', { class: 'reveal' });
    const img = el('img', { class: 'drawn', src: canvas.toDataURL(), alt: 'tombol buatan teman' });
    choice(wrap, {
      prompt: 'Tombol ini untuk apa?',
      subject: img, ctx, columns: 3,
      onRight() { ctx.sound.win(); result.textContent = 'Tebakan benar! Tombolnya mudah dimengerti.'; },
      options: TASKS.map((t) => ({ icon: t[0], label: t[1], correct: t === task })),
    });
    wrap.append(result, button('Tombol baru', pickTask, 'primary'));
  }
  pickTask();
}
