// Kancil Menyeberang Sungai — SD Lanjut (10–12 tahun), urutan, perulangan,
// kondisi, dan debugging. Kancil faces a direction; MAJU steps ahead,
// BELOK KIRI/KANAN turn on the spot (from Kancil's point of view), LOMPAT
// jumps one square. ULANGI repeats a group, JIKA chooses by what is ahead.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // up, right, down, left (y grows upward)
const DIR_ICON = ['⬆️', '➡️', '⬇️', '⬅️'];
const DIR_NAME = ['atas', 'kanan', 'bawah', 'kiri'];
const CARD = {
  maju: { icon: '⬆️', text: 'MAJU' },
  kiri: { icon: '↰', text: 'BELOK KIRI' },
  kanan: { icon: '↱', text: 'BELOK KANAN' },
  lompat: { icon: '⤴️', text: 'LOMPAT' },
};

// Maps. Rows are given top row first; x from the left, y from the bottom.
const MAP_A = {
  name: 'Peta A', rows: ['.T...', '..TTT', '...T.', '.T..G', '.T...'], start: [0, 0, 1], goal: 'tepi sungai (E2)',
};
const MAP_B = {
  name: 'Peta B', rows: ['gggGg', 'ww56w', 'w34ww', '12www', 'Sbbbb'], start: [0, 0, 0], goal: 'seberang (D5), injak buaya 1–6',
};
const lineMap = (crocs, name) => ({
  name, rows: [Array.from({ length: 10 }, (_, i) => (i === 9 ? 'G' : crocs.includes(i + 1) ? 'C' : '.')).join('')], start: [0, 0, 1], goal: 'hutan buah (kotak 10)', line: true,
});
const MAP_C1 = lineMap([4, 7], 'Peta C1');
const MAP_C2 = lineMap([3, 8], 'Peta C2');
// Random C map: crocs never side by side, never on 1, 2 or 10.
function randomC(rand, count = 2) {
  for (;;) {
    const crocs = rand.shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, count).sort((a, b) => a - b);
    if (crocs.every((c, i) => i === 0 || c - crocs[i - 1] > 1)) return lineMap(crocs, 'Peta C Acak');
  }
}

function cellOf(map, x, y) {
  const h = map.rows.length;
  if (y < 0 || y >= h || x < 0 || x >= map.rows[0].length) return null;
  return map.rows[h - 1 - y][x];
}
const isCroc = (c) => c === 'C' || /[1-9]/.test(c || '');
const blocked = (map, c) => c == null || c === 'T' || c === 'w' || (map.line && c === 'C');

// Runs a program; returns every step for the animation and how it ended.
export function runProgram(map, program, maxSteps = 200) {
  let [x, y, d] = map.start;
  const steps = [];
  const stepped = new Set();
  let end = null;
  const ahead = () => cellOf(map, x + DIRS[d][0], y + DIRS[d][1]);
  const atGoal = () => cellOf(map, x, y) === 'G';
  function act(op, path) {
    if (end) return;
    if (op === 'kiri') d = (d + 3) % 4;
    else if (op === 'kanan') d = (d + 1) % 4;
    else {
      const k = op === 'lompat' ? 2 : 1;
      const nx = x + DIRS[d][0] * k;
      const ny = y + DIRS[d][1] * k;
      const c = cellOf(map, nx, ny);
      if (blocked(map, c)) {
        steps.push({ x: nx, y: ny, d, path, crash: c == null ? 'keluar' : c === 'T' ? 'pohon' : c === 'w' ? 'air' : 'buaya' });
        end = c == null ? 'keluar' : c === 'T' ? 'pohon' : c === 'w' ? 'air' : 'buaya';
        return;
      }
      x = nx;
      y = ny;
      if (isCroc(c)) stepped.add(c);
    }
    steps.push({ x, y, d, path });
    if (steps.length > maxSteps) end = 'kebanyakan';
  }
  function exec(list, base) {
    list.forEach((card, i) => {
      if (end) return;
      const path = [...base, i];
      if (card.op === 'ulangi') for (let k = 0; k < card.n && !end; k++) exec(card.body, path);
      else if (card.op === 'sampai') { let guard = 0; while (!atGoal() && !end && guard++ < 30) exec(card.body, path); }
      else if (card.op === 'jika') act(isCroc(ahead()) ? card.then : card.else, path);
      else act(card.op, path);
    });
  }
  exec(program, []);
  if (!end) {
    const crocsNeeded = map.rows.join('').replace(/[^1-9]/g, '').length;
    if (!atGoal()) end = 'belum';
    else if (stepped.size < crocsNeeded) end = 'lewati-buaya';
    else end = 'sampai';
  }
  return { steps, end, x, y, d };
}
export const cardCount = (p) => p.reduce((n, c) => n + 1 + (c.body ? cardCount(c.body) : 0), 0);
const MESSAGES = {
  sampai: 'Kancil sampai! 🎉', belum: 'Program selesai, tetapi Kancil belum sampai.', pohon: 'Kancil menabrak pohon! 🌳',
  air: 'Kancil tercebur ke air! 🌊', buaya: 'Kancil menginjak buaya yang berjemur! 🐊', keluar: 'Kancil keluar dari peta!',
  'lewati-buaya': 'Kancil sampai, tetapi belum menginjak semua buaya untuk dihitung.', kebanyakan: 'Program terlalu panjang.',
};

// The board.
function board(map) {
  const w = map.rows[0].length;
  const h = map.rows.length;
  const cells = [];
  const node = el('div', { class: `kancil-map ${map.line ? 'jalur' : ''}`, style: { '--cols': w, '--rows': h } });
  for (let y = h - 1; y >= 0; y--) {
    if (!map.line) node.append(el('span', { class: 'map-label' }, y + 1));
    for (let x = 0; x < w; x++) {
      const c = cellOf(map, x, y);
      const icon = { T: '🌳', w: '🌊', G: map.line ? '🌳🍎' : map === MAP_B ? '🌿' : '🏞️', C: '🐊', g: '🌿', b: '🟫', S: '' }[c] || (isCroc(c) ? '🐊' : '');
      const cell = el('div', { class: `map-cell t-${/[1-9]/.test(c) ? 'n' : c === '.' ? 'e' : c}` }, el('span', { class: 'map-thing' }, icon), /[1-9]/.test(c) ? el('small', { class: 'croc-n' }, c) : null, map.line ? el('small', { class: 'croc-n' }, x + 1) : null);
      cells.push({ x, y, cell });
      node.append(cell);
    }
  }
  if (!map.line) node.append(el('span'), ...Array.from({ length: w }, (_, x) => el('span', { class: 'map-label' }, 'ABCDE'[x])));
  const kancil = el('div', { class: 'kancil' }, '🦌', el('i', { class: 'kancil-dir' }));
  const at = (x, y) => cells.find((c) => c.x === x && c.y === y)?.cell;
  function place(x, y, d, crash) {
    const cell = at(x, y);
    kancil.querySelector('.kancil-dir').textContent = DIR_ICON[d];
    kancil.classList.toggle('crash', !!crash);
    if (cell) cell.append(kancil);
  }
  place(...map.start);
  return { node, place, reset: () => place(...map.start) };
}

// Program editor: palette of cards, the program board, run and step.
function editor(wrap, ctx, { map, palette = ['maju', 'kiri', 'kanan'], start = [], prompt, onRun, locked = false, maxCards = 30 }) {
  const program = JSON.parse(JSON.stringify(start));
  let open = null; // ULANGI or SAMPAI block taking new cards
  let selected = null; // [list, index] for debugging edits
  let stopAnim = null;
  const b = board(map);
  const progEl = el('div', { class: 'k-program' });
  const counter = el('span', { class: 'open-count' });
  const msg = el('p', { class: 'reveal' });
  const cardEl = (c, list, i, path) => {
    const sel = selected && selected[0] === list && selected[1] === i;
    let node;
    if (c.op === 'ulangi' || c.op === 'sampai') {
      node = el('div', { class: `k-card loop ${open === c ? 'open' : ''} ${sel ? 'sel' : ''}`, 'data-path': path.join('-') },
        el('span', { class: 'k-head' }, c.op === 'ulangi' ? `ULANGI ${c.n} KALI [` : 'ULANGI SAMPAI tiba ['),
        ...c.body.map((x, k) => cardEl(x, c.body, k, [...path, k])), el('span', { class: 'k-head' }, ']'));
      if (c.op === 'ulangi' && !locked) {
        node.querySelector('.k-head').append(
          onTap(el('button', { class: 'mini-btn', type: 'button' }, '−'), (e) => { e.stopPropagation?.(); c.n = Math.max(2, c.n - 1); draw(); }),
          onTap(el('button', { class: 'mini-btn', type: 'button' }, '+'), (e) => { e.stopPropagation?.(); c.n = Math.min(9, c.n + 1); draw(); }));
      }
    } else if (c.op === 'jika') {
      node = el('div', { class: `k-card jika ${sel ? 'sel' : ''}`, 'data-path': path.join('-') }, 'JIKA 🐊 di depan MAKA ',
        jikaSlot(c, 'then'), ' JIKA TIDAK ', jikaSlot(c, 'else'));
    } else {
      node = el('div', { class: `k-card ${sel ? 'sel' : ''}`, 'data-path': path.join('-') }, el('b', null, CARD[c.op].icon), ` ${CARD[c.op].text}`);
    }
    node.addEventListener('pointerdown', (e) => {
      if (locked || e.target.closest('.mini-btn, .jika-slot')) return;
      e.stopPropagation();
      if (c.op === 'ulangi' || c.op === 'sampai') { open = open === c ? null : c; selected = null; draw(); return; }
      selected = sel ? null : [list, i];
      draw();
    });
    return node;
  };
  function jikaSlot(c, key) {
    const s = el('button', { class: 'jika-slot', type: 'button' }, c[key] ? CARD[c[key]].text : '…');
    return onTap(s, () => { c[key] = c[key] === 'lompat' ? 'maju' : 'lompat'; draw(); });
  }
  function draw() {
    progEl.replaceChildren(...(program.length ? program.map((c, i) => cardEl(c, program, i, [i])) : [el('span', { class: 'small-note' }, 'Ketuk kartu di bawah untuk menyusun program')]));
    counter.textContent = `Kartu: ${cardCount(program)}`;
  }
  function add(op) {
    if (cardCount(program) >= maxCards) return;
    const card = op === 'ulangi' ? { op, n: 3, body: [] } : op === 'sampai' ? { op, body: [] } : op === 'jika' ? { op, then: null, else: null } : { op };
    if (selected && !card.body) { selected[0][selected[1]] = card; selected = null; }
    else if (open && !card.body) open.body.push(card);
    else { program.push(card); if (card.body) open = card; }
    ctx.sound.tap();
    draw();
  }
  const pal = palette.map((op) => {
    const label = op === 'ulangi' ? '🔁 ULANGI … KALI' : op === 'sampai' ? '🔁 ULANGI SAMPAI tiba' : op === 'jika' ? '❓ JIKA … MAKA … JIKA TIDAK …' : `${CARD[op].icon} ${CARD[op].text}`;
    return button(label, () => add(op), 'small card-btn');
  });
  const del = button('🗑️ Hapus', () => {
    if (selected) { selected[0].splice(selected[1], 1); selected = null; }
    else if (open && open.body.length) open.body.pop();
    else { const last = program.pop(); if (last === open) open = null; }
    draw();
  }, 'small ghost');
  const highlight = (path) => progEl.querySelectorAll('.k-card').forEach((n) => n.classList.toggle('now', path && n.dataset.path === path.join('-')));
  let stepState = null;
  function play(r, speed, done) {
    let k = 0;
    b.reset();
    const tick = () => {
      if (k >= r.steps.length) { highlight(null); done(); return; }
      const s = r.steps[k++];
      b.place(s.x, s.y, s.d, s.crash);
      highlight(s.path);
      ctx.sound.tap();
      stopAnim = setTimeout(tick, speed);
    };
    stopAnim = setTimeout(tick, 200);
  }
  function report(r) {
    const ok = r.end === 'sampai';
    msg.className = ok ? 'reveal' : 'reveal bad';
    msg.textContent = `${MESSAGES[r.end]}${ok ? ` Dengan ${cardCount(program)} kartu, menghadap ${DIR_NAME[r.d]}.` : ''}`;
    onRun?.(r, program, msg);
  }
  const runBtn = button('▶ Jalankan', () => {
    clearTimeout(stopAnim);
    stepState = null;
    if (program.some((c) => c.op === 'jika' && (!c.then || !c.else)) || JSON.stringify(program).includes('"then":null') || JSON.stringify(program).includes('"else":null')) {
      msg.className = 'reveal bad';
      msg.textContent = 'Lengkapi dulu kartu JIKA (ketuk titik-titiknya).';
      return;
    }
    const r = runProgram(map, program);
    msg.textContent = '';
    play(r, 450, () => report(r));
  }, 'primary');
  const stepBtn = button('⏯ Langkah demi langkah', () => {
    clearTimeout(stopAnim);
    if (!stepState) { stepState = { r: runProgram(map, program), k: 0 }; b.reset(); msg.textContent = ''; }
    const { r } = stepState;
    if (stepState.k >= r.steps.length) { highlight(null); report(r); stepState = null; return; }
    const s = r.steps[stepState.k++];
    b.place(s.x, s.y, s.d, s.crash);
    highlight(s.path);
  }, 'small');
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'kancil-layout' }, el('div', { class: 'kancil-board' }, el('small', { class: 'small-note' }, `${map.name} · tujuan: ${map.goal}`), b.node),
      el('div', { class: 'kancil-side' }, el('div', { class: 'row' }, counter), progEl, locked ? null : el('div', { class: 'row wrap palette-row' }, pal, del), el('div', { class: 'row' }, runBtn, stepBtn), msg)));
  return { program, destroy: () => clearTimeout(stopAnim) };
}

const RAKA = ['kiri', 'maju', 'maju', 'kanan', 'maju', 'maju', 'kiri', 'maju', 'kanan', 'maju', 'maju'].map((op) => ({ op }));
const SARI = ['kiri', 'maju', 'maju', 'kanan', 'maju', 'maju', 'kanan', 'maju', 'kiri', 'maju'].map((op) => ({ op }));

export default {
  id: 'sdl-12-kancil',
  title: 'Kancil Menyeberang Sungai',
  topic: 'Urutan, perulangan, kondisi, debugging',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🦌',
  source: { name: 'CS Unplugged: Kidbots', url: 'https://www.csunplugged.org/en/topics/kidbots/' },
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid menyusun program dengan kartu MAJU, BELOK, dan LOMPAT, meringkasnya dengan ULANGI, memakai JIKA agar program berhasil di peta yang berubah, dan memperbaiki program yang salah.',
  extraModes: [
    { id: 'editor', icon: '🧩', label: 'Editor Kartu', desc: 'Pilih Peta A, B, C1, C2, atau C Acak (1–3 buaya); kartu ULANGI SAMPAI tiba bisa dinyalakan', create: createEditor },
    { id: 'penguji', icon: '🐊', label: 'Pemrogram dan Penguji', desc: 'Satu tim menyusun program Peta C, tim lain meletakkan buaya untuk mengujinya', create: createTester },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kancil-act' });
    root.append(wrap);
    let ed = null;
    function render() {
      ed?.destroy();
      ed = null;
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2800); } };
      const onRun = (res) => { if (res.end === 'sampai') next(); else ctx.mistake(); };
      if (r === 0) ed = editor(wrap, ctx, { map: MAP_A, prompt: 'Bagian A: susun program agar Kancil sampai di tepi sungai (E2). Kartu sesedikit mungkin!', onRun });
      else if (r === 1) {
        choice(wrap, {
          prompt: 'Program terpendek ke E2: BELOK KIRI, MAJU, MAJU, BELOK KANAN, MAJU, MAJU, BELOK KANAN, MAJU, BELOK KIRI, MAJU, MAJU. Saat sampai, Kancil menghadap ke mana?',
          ctx, onRight: next, columns: 4, options: ['atas', 'bawah', 'kiri', 'kanan'].map((x) => ({ label: x, correct: x === 'kanan' })),
        });
      } else if (r === 2) ed = editor(wrap, ctx, { map: MAP_B, palette: ['maju', 'kiri', 'kanan', 'ulangi'], prompt: 'Bagian B: injak buaya 1 sampai 6, lalu sampai di D5. Coba pakai ULANGI!', onRun });
      else if (r === 3) ed = editor(wrap, ctx, { map: MAP_C1, palette: ['maju', 'lompat'], prompt: 'Bagian C1: lompati setiap buaya dan sampai di hutan buah (kotak 10).', onRun });
      else if (r === 4) {
        const start = [{ op: 'ulangi', n: 7, body: [{ op: 'jika', then: null, else: null }] }];
        ed = editor(wrap, ctx, {
          map: MAP_C2, palette: [], start, locked: false,
          prompt: 'Bagian C3: lengkapi kartu JIKA (ketuk titik-titiknya), lalu Jalankan di Peta C2.',
          onRun(res, program, msg) {
            if (res.end !== 'sampai') { ctx.mistake(); return; }
            const also = runProgram(MAP_C1, program).end === 'sampai';
            msg.textContent += also ? ' Program yang sama juga berhasil di Peta C1!' : '';
            next();
          },
        });
      } else if (r === 5) ed = editor(wrap, ctx, { map: MAP_A, start: RAKA, prompt: 'Bagian D1: program Raka salah. Jalankan langkah demi langkah, ketuk kartu yang salah lalu ketuk kartu penggantinya.', onRun });
      else if (r === 6) ed = editor(wrap, ctx, { map: MAP_A, start: SARI, prompt: 'Bagian D2: program Sari berhenti di D2. Perbaiki!', onRun });
      else {
        const map = randomC(ctx.rand, 2);
        ed = editor(wrap, ctx, { map, palette: ['maju', 'lompat', 'ulangi', 'jika'], prompt: 'Peta C Acak: buaya pindah-pindah. Buat program yang berhasil di mana pun buayanya!', onRun });
      }
    }
    render();
    return { destroy() { ed?.destroy(); } };
  },
};

// Editor Kartu: free editor with the map picker.
function createEditor(root, ctx) {
  const wrap = el('div', { class: 'act kancil-act' });
  root.append(wrap);
  let ed = null;
  let which = 'A';
  let crocs = 2;
  let until = false;
  const rand = { shuffle: (a) => a.slice().sort(() => Math.random() - 0.5) };
  function go() {
    ed?.destroy();
    const maps = { A: MAP_A, B: MAP_B, C1: MAP_C1, C2: MAP_C2, Acak: randomC(rand, crocs) };
    wrap.replaceChildren(el('div', { class: 'row' },
      Object.keys(maps).map((k) => button(k === 'Acak' ? 'C Acak' : `Peta ${k}`, () => { which = k; go(); }, k === which ? 'small on' : 'small')),
      which === 'Acak' ? [1, 2, 3].map((n) => button(`${n} 🐊`, () => { crocs = n; go(); }, n === crocs ? 'small on' : 'small')) : null,
      button(until ? 'ULANGI SAMPAI: nyala' : 'ULANGI SAMPAI: mati', () => { until = !until; go(); }, until ? 'small on' : 'small')));
    const palette = ['maju', 'kiri', 'kanan', 'lompat', 'ulangi', 'jika', ...(until ? ['sampai'] : [])];
    ed = editor(wrap, ctx, { map: maps[which], palette, prompt: 'Susun program, lalu Jalankan.', onRun: (r) => (r.end === 'sampai' ? ctx.sound.win() : ctx.sound.bad()) });
  }
  go();
  return { destroy() { ed?.destroy(); } };
}

// Pemrogram dan Penguji: the programmers write a program for line C; the
// testers tap squares to place crocodiles, then the program runs.
function createTester(root, ctx) {
  const wrap = el('div', { class: 'act kancil-act' });
  root.append(wrap);
  let crocs = [4, 7];
  let ed = null;
  let saved = null;
  function program() {
    ed?.destroy();
    wrap.replaceChildren();
    ed = editor(wrap, ctx, {
      map: lineMap(crocs, 'Peta C'), palette: ['maju', 'lompat', 'ulangi', 'jika', 'sampai'], start: saved || [],
      prompt: 'Tim pemrogram: buat program yang berhasil di mana pun buayanya.',
    });
    wrap.append(button('Selesai, giliran tim penguji ➜', () => { saved = JSON.parse(JSON.stringify(ed.program)); test(); }, 'primary'));
  }
  function test() {
    ed?.destroy();
    const cells = Array.from({ length: 10 }, (_, i) => onTap(el('button', { class: `map-cell t-${i === 9 ? 'G' : crocs.includes(i + 1) ? 'C' : 'e'} tap-cell`, type: 'button' }, i === 0 ? '🦌' : i === 9 ? '🌳🍎' : crocs.includes(i + 1) ? '🐊' : '', el('small', { class: 'croc-n' }, i + 1)), () => {
      if (i < 2 || i === 9) { shake(cells[i]); return; }
      crocs = crocs.includes(i + 1) ? crocs.filter((c) => c !== i + 1) : [...crocs, i + 1];
      test();
    }));
    const r = runProgram(lineMap(crocs, 'Peta C'), saved);
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim penguji: ketuk kotak untuk meletakkan atau mengangkat buaya, lalu uji programnya.'),
      el('div', { class: 'kancil-map jalur', style: { '--cols': 10, '--rows': 1 } }, cells),
      el('div', { class: 'row' }, button('▶ Uji program', () => {
        ed?.destroy();
        wrap.replaceChildren();
        ed = editor(wrap, ctx, { map: lineMap(crocs, 'Peta C'), palette: [], start: saved, locked: true, prompt: `Program tim pemrogram (${cardCount(saved)} kartu) diuji.`, onRun: (res) => (res.end === 'sampai' ? ctx.sound.win() : ctx.sound.bad()) });
        wrap.append(el('div', { class: 'row' }, button('Letakkan buaya lagi', test), button('Ubah program', program, 'ghost')));
        wrap.querySelector('.btn.primary')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      }, 'primary'), el('small', { class: 'small-note' }, r.end === 'sampai' ? '' : '')));
  }
  program();
  return { destroy() { ed?.destroy(); } };
}
