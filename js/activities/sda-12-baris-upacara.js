// Baris Upacara — SD Awal (7–9 tahun), pengurutan (tukar yang bersebelahan).
// Monday morning line-up, shortest on the left. One rule: compare two
// neighbours from the left; if the left one is taller, swap; move on;
// repeat from the left until a whole round has no swap.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const LINE4 = [['Rina', 122], ['Sari', 117], ['Tono', 130], ['Udin', 119]];
const LINE6 = [['Budi', 128], ['Citra', 115], ['Dodi', 132], ['Ani', 120], ['Fajar', 125], ['Eka', 118]];
const NAMES = ['Ayu', 'Bima', 'Cici', 'Dani', 'Euis', 'Gilang', 'Hasan', 'Intan', 'Joko', 'Kiki'];

// A child in red-and-white school uniform, drawn to scale.
function kid([name, cm]) {
  const h = 45 + ((cm - 110) / 25) * 50;
  return el('div', { class: 'kid', 'data-name': name },
    el('div', { class: 'kid-fig', style: { height: `${h}%` } }, el('i', { class: 'kid-head' }), el('i', { class: 'kid-shirt' }), el('i', { class: 'kid-pants' })),
    el('b', null, name), el('small', null, `${cm} cm`));
}

// Swaps needed by the rule, for comparing in a race.
const swapsNeeded = (line) => {
  let n = 0;
  for (let i = 0; i < line.length; i++) for (let j = i + 1; j < line.length; j++) if (line[i][1] > line[j][1]) n++;
  return n;
};

function sortRound(wrap, ctx, start, next) {
  const line = start.slice();
  let i = 0;
  let end = line.length - 1;
  let round = 1;
  let swapsThisRound = 0;
  let swaps = 0;
  const row = el('div', { class: 'line' });
  const rows = el('tbody');
  const msg = el('p', { class: 'reveal' });
  const counter = el('span', { class: 'open-count' });
  function draw() {
    row.replaceChildren(...line.map((k, j) => {
      const n = kid(k);
      if (j === i || j === i + 1) n.classList.add('pair');
      if (j > end) n.classList.add('placed');
      if (j === i || j === i + 1) onTap(n, () => swap());
      return n;
    }));
    counter.textContent = `Putaran ${round} · Pertukaran: ${swaps}`;
  }
  function step() {
    i++;
    if (i >= end) {
      rows.append(el('tr', null, el('td', null, `Putaran ${round}`), el('td', null, line.map((k) => k[0]).join(' · ')), el('td', null, swapsThisRound)));
      if (swapsThisRound === 0 || end <= 1) {
        if (swapsThisRound > 0) rows.append(el('tr', null, el('td', null, `Putaran ${round + 1}`), el('td', null, line.map((k) => k[0]).join(' · ')), el('td', null, 0)));
        i = -1;
        draw();
        msg.className = 'reveal';
        msg.textContent = `Selesai! Tidak ada yang bertukar lagi. Semuanya ${swaps} pertukaran (aturan membutuhkan ${swapsNeeded(start)}).`;
        next();
        return;
      }
      round++;
      end--;
      i = 0;
      swapsThisRound = 0;
    }
    draw();
  }
  function swap() {
    if (i < 0) return;
    if (line[i][1] < line[i + 1][1]) {
      ctx.mistake();
      msg.className = 'reveal bad';
      msg.textContent = `${line[i][0]} sudah lebih pendek dari ${line[i + 1][0]}. Tidak perlu ditukar!`;
      shake(row.children[i]);
      return;
    }
    [line[i], line[i + 1]] = [line[i + 1], line[i]];
    swaps++;
    swapsThisRound++;
    ctx.sound.tap();
    msg.textContent = '';
    step();
  }
  function skip() {
    if (i < 0) return;
    if (line[i][1] > line[i + 1][1]) {
      ctx.mistake();
      msg.className = 'reveal bad';
      msg.textContent = `${line[i][0]} lebih tinggi dari ${line[i + 1][0]}. Harus ditukar!`;
      shake(row.children[i]);
      return;
    }
    msg.textContent = '';
    step();
  }
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, 'Bandingkan dua anak yang disorot. Kiri lebih tinggi? Tukar! Kalau tidak, lanjut.'),
    row,
    el('div', { class: 'row' }, button('🔁 Tukar', swap, 'primary'), button('➡️ Lanjut, tidak ditukar', skip), counter),
    msg,
    el('table', { class: 'count-table rounds' }, el('thead', null, el('tr', null, el('td', null, ''), el('td', null, 'Urutan setelah putaran'), el('td', null, 'Tukar'))), rows));
}

export default {
  id: 'sda-12-baris-upacara',
  title: 'Baris Upacara',
  topic: 'Pengurutan',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🧑‍🤝‍🧑',
  source: null,
  rounds: 4,
  maxPlayers: 4,
  goal: 'Murid mengurutkan barisan dengan aturan "bandingkan dua yang bersebelahan, tukar bila salah urutan", mencatat setiap putaran, dan tahu kapan berhenti.',
  extraModes: [{ id: 'kelas', icon: '🙋', label: 'Kelas Bersama', desc: 'Delapan tokoh; murid menukar dua tokoh bersebelahan bersama-sama sambil menyebut aturannya', create: createClass }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act baris' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2600); };
      if (r === 0) sortRound(wrap, ctx, LINE4, next);
      else if (r === 1) sortRound(wrap, ctx, LINE6, next);
      else if (r === 2) {
        choice(wrap, {
          prompt: 'Mengapa anak paling tinggi selalu sampai di ujung kanan setelah putaran pertama?',
          ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { icon: '➡️', label: 'Ia lebih tinggi dari siapa pun di sebelahnya, jadi terus bertukar ke kanan', correct: true },
            { icon: '🎲', label: 'Karena kebetulan' },
            { icon: '⬅️', label: 'Karena ia berdiri paling kiri sejak awal' },
          ]),
        });
      } else {
        const names = ctx.rand.shuffle(NAMES).slice(0, 5);
        const cms = ctx.rand.shuffle(Array.from({ length: 21 }, (_, k) => 112 + k)).slice(0, 5);
        sortRound(wrap, ctx, names.map((n, k) => [n, cms[k]]), next);
      }
    }
    render();
  },
};

// Kelas Bersama: free swaps of any two neighbours, then check.
function createClass(root, ctx) {
  const wrap = el('div', { class: 'act baris' });
  root.append(wrap);
  let line;
  let picked = -1;
  let swaps = 0;
  const row = el('div', { class: 'line' });
  const msg = el('p', { class: 'reveal' });
  function fresh() {
    const names = NAMES.slice(0, 8);
    const cms = Array.from({ length: 8 }, () => 112 + Math.floor(Math.random() * 22));
    line = names.map((n, k) => [n, cms[k]]).sort(() => Math.random() - 0.5);
    swaps = 0;
    picked = -1;
    msg.textContent = 'Ketuk dua anak yang bersebelahan untuk menukarnya.';
    draw();
  }
  function draw() {
    row.replaceChildren(...line.map((k, j) => onTap(kid(k), () => {
      if (picked < 0) { picked = j; draw(); return; }
      if (Math.abs(picked - j) === 1) {
        [line[picked], line[j]] = [line[j], line[picked]];
        swaps++;
        ctx.sound.tap();
      }
      picked = -1;
      draw();
    })));
    if (picked >= 0) row.children[picked].classList.add('pair');
    msg.dataset.swaps = swaps;
  }
  const check = button('Periksa', () => {
    const ok = line.every((k, j) => j === 0 || line[j - 1][1] <= k[1]);
    msg.textContent = ok ? `Urut! ${swaps} pertukaran.` : 'Belum urut. Masih ada yang kiri lebih tinggi dari kanannya.';
    if (ok) ctx.sound.win(); else ctx.sound.bad();
  }, 'primary');
  wrap.append(
    el('p', { class: 'prompt' }, 'Urutkan barisan bersama-sama: paling pendek di kiri, paling tinggi di kanan.'),
    row, el('div', { class: 'row' }, check, button('Barisan baru', fresh)), msg);
  fresh();
}
