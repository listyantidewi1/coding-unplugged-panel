// Robot Penjelajah Labirin — SD Lanjut (10–12 tahun), sensor, perulangan
// bersyarat dan percabangan. ULANGI SAMPAI tiba di pintu keluar [ JIKA … ].
// A robot that comes back to the same square facing the same way loops forever.

import { el, onTap, button, choice, shake } from '../core/kit.js';

// Facing: 0 right, 1 down, 2 left, 3 up. Turning right adds 1.
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const ARROW = ['➡️', '⬇️', '⬅️', '⬆️'];
const COLS = 'ABCDEFGH';

// '#' wall, '.' floor, 'E' exit. Labirin 3 has its wall row on top (row 0).
export const MAZES = {
  l1: { label: 'Labirin 1', rows: ['.....', '####.', '..E#.', '.###.', '.....'], start: [0, 0, 0], first: 1 },
  l2: { label: 'Labirin 2', rows: ['###E', '###.', '###.', '....'], start: [0, 3, 0], first: 1 },
  l3: { label: 'Labirin 3', rows: ['##E##', '.....', '.###.', '.###.', '.###.', '.....'], start: [0, 5, 0], first: 0 },
};
const cellAt = (m, x, y) => (y < 0 || y >= m.rows.length || x < 0 || x >= m.rows[y].length ? '#' : m.rows[y][x]);
const free = (m, x, y) => cellAt(m, x, y) !== '#';

// A program: { rules: [{ sensor: 'depan' | 'kanan', acts }], last: acts }.
// Acts are strings of M (MAJU), K (BELOK KANAN), L (BELOK KIRI).
export const PROG_A = { rules: [{ sensor: 'depan', acts: 'M' }], last: 'K' };
export const PROG_B = { rules: [{ sensor: 'kanan', acts: 'KM' }, { sensor: 'depan', acts: 'M' }], last: 'L' };
const ACT_TEXT = { M: 'MAJU', K: 'BELOK KANAN', L: 'BELOK KIRI' };

// Runs a program until the exit, a loop (same square and facing at the start
// of a turn) or 400 steps.
export function explore(maze, prog, start = maze.start) {
  let [x, y, d] = start;
  const seen = new Set(), steps = [];
  let maju = 0, kanan = 0, kiri = 0, loop = false, exit = false, bump = false;
  for (let turn = 0; turn < 400; turn++) {
    if (cellAt(maze, x, y) === 'E') { exit = true; break; }
    const key = `${x},${y},${d}`;
    if (seen.has(key)) { loop = true; break; }
    seen.add(key);
    let acts = prog.last;
    const checks = [];
    for (const r of prog.rules) {
      const dd = r.sensor === 'depan' ? d : (d + 1) % 4;
      const ok = free(maze, x + DIRS[dd][0], y + DIRS[dd][1]);
      checks.push({ sensor: r.sensor, at: [x + DIRS[dd][0], y + DIRS[dd][1]], ok });
      if (ok) { acts = r.acts; break; }
    }
    steps.push({ kind: 'cek', x, y, d, checks });
    for (const a of acts) {
      if (a === 'K') { d = (d + 1) % 4; kanan++; }
      else if (a === 'L') { d = (d + 3) % 4; kiri++; }
      else {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
        if (!free(maze, nx, ny)) { bump = true; break; }
        x = nx; y = ny; maju++;
      }
      steps.push({ kind: a, x, y, d, maju, belok: kanan + kiri });
    }
    if (bump) break;
  }
  return { steps, maju, kanan, kiri, belok: kanan + kiri, loop, exit, bump, end: [x, y, d] };
}

// The maze drawing. `show(step)` moves the robot, lights the sensed squares
// and draws the trail.
function mazeView(maze, { tap } = {}) {
  const cells = {};
  const n = maze.rows[0].length;
  const grid = el('div', { class: 'lbr-labirin', style: { '--n': n + 1 } });
  grid.append(el('span', { class: 'lbr-kepala' }), ...Array.from({ length: n }, (_, i) => el('span', { class: 'lbr-kepala' }, COLS[i])));
  maze.rows.forEach((row, y) => {
    grid.append(el('span', { class: 'lbr-kepala' }, maze.first === 0 && y === 0 ? '' : String(y + (maze.first === 0 ? 0 : 1))));
    [...row].forEach((c, x) => {
      const cell = el('span', { class: `lbr-kotak ${c === '#' ? 'dinding' : c === 'E' ? 'keluar' : 'lantai'}` }, c === 'E' ? '🚪' : '');
      if (tap) onTap(cell, () => tap(x, y));
      cells[`${x},${y}`] = cell;
      grid.append(cell);
    });
  });
  const robot = el('span', { class: 'lbr-robot' });
  const put = (x, y, d) => { robot.textContent = `🤖${ARROW[d]}`; cells[`${x},${y}`]?.append(robot); };
  put(...maze.start);
  return {
    node: grid, cells,
    reset() { Object.values(cells).forEach((c) => { c.classList.remove('jejak', 'ya', 'tidak'); c.style.removeProperty('--j'); }); put(...maze.start); },
    show(s) {
      Object.values(cells).forEach((c) => c.classList.remove('ya', 'tidak'));
      if (s.kind === 'cek') s.checks.forEach((c) => cells[c.at.join(',')]?.classList.add(c.ok ? 'ya' : 'tidak'));
      if (s.kind === 'M') {
        const c = cells[`${s.x},${s.y}`];
        c.classList.add('jejak'); c.style.setProperty('--j', Math.min(1, (Number(c.style.getPropertyValue('--j')) || 0) + 0.35));
      }
      put(s.x, s.y, s.d);
    },
  };
}

function play(view, result, { onStep, done, speed = 260, limit = Infinity } = {}) {
  let i = 0, t = null;
  view.reset();
  const steps = result.steps.slice(0, limit);
  const tick = () => {
    if (i >= steps.length) { done?.(); return; }
    const s = steps[i++];
    view.show(s); onStep?.(s);
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

// The program as nested JIKA … MAKA … JIKA TIDAK blocks.
function progLines(prog, blanks) {
  const out = ['ULANGI SAMPAI tiba di pintu keluar ['];
  const acts = (a) => [...a].map((c) => ACT_TEXT[c]);
  prog.rules.forEach((r, i) => {
    const pad = '    '.repeat(i + 1);
    out.push(`${pad}JIKA ${blanks ? '……' : r.sensor} kosong MAKA`, ...acts(r.acts).map((a) => `${pad}    ${blanks && a.startsWith('BELOK') ? 'BELOK ……' : a}`), `${pad}JIKA TIDAK`);
  });
  out.push(...acts(prog.last).map((a) => `${'    '.repeat(prog.rules.length + 1)}${blanks && a.startsWith('BELOK') ? 'BELOK ……' : a}`), ']');
  return out;
}
const progNode = (prog, blanks) => el('pre', { class: 'lbr-kode' }, progLines(prog, blanks).join('\n'));
const opts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));

const run = (m, p, start) => explore(MAZES[m], p, start);
const r1 = run('l1', PROG_A), rb2 = run('l2', PROG_B), rb3 = run('l3', PROG_B);
const tally = (r) => `${r.maju} MAJU, ${r.belok} belok`;

// Worksheet questions in order.
const PLAN = [
  { maze: 'l1', prog: PROG_A, prompt: 'Soal 1. Program A di Labirin 1. Apakah robot tiba di pintu keluar?', opts: opts(r1.exit ? 'ya' : 'tidak', [r1.exit ? 'tidak' : 'ya']) },
  { maze: 'l1', prog: PROG_A, prompt: 'Berapa MAJU dan BELOK KANAN?', opts: opts(`${r1.maju} MAJU, ${r1.kanan} BELOK KANAN`, ['12 MAJU, 4 BELOK KANAN', '16 MAJU, 3 BELOK KANAN', '14 MAJU, 5 BELOK KANAN']) },
  { maze: 'l2', prog: PROG_A, limit: 14, prompt: 'Soal 2. Robot tiba di D4. Ke mana robot menghadap setelah BELOK KANAN pertama, lalu kedua?', opts: opts('bawah, lalu kiri', ['atas, lalu kiri', 'bawah, lalu atas']) },
  { maze: 'l2', prog: PROG_A, prompt: 'Apa yang terjadi selanjutnya?', opts: opts('robot bolak-balik antara A4 dan D4 selamanya', ['robot naik ke pintu keluar', 'robot berhenti di D4']) },
  { maze: 'l3', prog: PROG_A, prompt: 'Soal 3. Program A di Labirin 3. Bagaimana jalannya robot?', opts: opts('berputar searah jarum jam mengelilingi dinding tengah', ['keluar lewat pintu di atas C1', 'bolak-balik di baris 5']) },
  { maze: 'l3', prog: PROG_A, prompt: 'Robot melewati C1, dan pintu keluar tepat di atasnya. Mengapa robot tidak keluar?',
    opts: opts('depan robot kosong, jadi robot terus maju; pintu ada di kiri robot', ['pintunya terkunci', 'robot terlalu cepat']) },
  { maze: 'l2', prog: PROG_B, blanks: true, prompt: 'Soal 4. Aturan tangan kanan. Isian Program B yang benar?',
    opts: opts('kanan · KANAN · depan · KIRI', ['depan · KANAN · kanan · KIRI', 'kanan · KIRI · depan · KANAN', 'depan · KIRI · kanan · KANAN']) },
  { maze: 'l2', prog: PROG_B, prompt: 'Program B di Labirin 2?', opts: opts(`keluar, ${tally(rb2)}`, ['keluar, 6 MAJU, 2 belok', 'berputar-putar', 'keluar, 5 MAJU, 1 belok']) },
  { maze: 'l3', prog: PROG_B, prompt: 'Program B di Labirin 3?', opts: opts(`keluar, ${tally(rb3)}`, ['keluar, 12 MAJU, 3 belok', 'keluar, 11 MAJU, 2 belok', 'berputar-putar']) },
  { maze: 'l1', prog: PROG_A, prompt: 'Soal 5. Program A di Labirin 1, 2, 3 berturut-turut?', opts: opts('✓ ✗ ✗', ['✓ ✓ ✗', '✗ ✗ ✗', '✓ ✓ ✓']) },
  { maze: 'l3', prog: PROG_B, start: [0, 3, 3], prompt: 'Tantangan. Program B di Labirin 3, robot mulai di A3 menghadap ke atas?',
    opts: opts('berputar-putar, tangan kanannya menyentuh dinding tengah', ['keluar lebih cepat', 'berhenti di A1']) },
];

function round(wrap, ctx, p, next) {
  const maze = { ...MAZES[p.maze], start: p.start ?? MAZES[p.maze].start };
  const view = mazeView(maze);
  const subject = el('div', { class: 'lbr-soal' }, progNode(p.prog, p.blanks), view.node);
  const after = () => {
    const r = explore(maze, p.prog);
    play(view, r, { speed: 120, limit: p.limit ?? 120, done: () => setTimeout(next, 700) });
  };
  const options = ctx.rand.shuffle(p.opts);
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns: options.some((o) => o.label.length > 24) ? 1 : 2, options });
}

export default {
  id: 'sdl-23-robot-labirin',
  title: 'Robot Penjelajah Labirin',
  topic: 'Sensor, perulangan, dan percabangan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🧭',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menelusuri program robot bersensor di labirin, menemukan labirin yang membuat robot berputar-putar, dan memperbaikinya dengan aturan tangan kanan.',
  extraModes: [
    { id: 'jelajah', icon: '🤖', label: 'Jelajah Labirin', desc: 'Pilih labirin dan program A, B, atau buatanmu, lalu jalankan', create: createExplore },
    { id: 'pengecoh', icon: '🧱', label: 'Labirin Pengecoh', desc: 'Satu tim membuat labirin, tim lain menebak apakah robot keluar', create: createTrick },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act robot-labirin' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const ACT_CHOICES = ['M', 'K', 'L', 'KM', 'LM', 'KK'];
const actsLabel = (a) => [...a].map((c) => ACT_TEXT[c]).join(', ');
const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

// Rule editor: tap a sensor or an action to change it.
function ruleEditor(ctx, start) {
  const prog = structuredClone(start);
  let locked = false;
  const node = el('div', { class: 'lbr-editor' });
  const draw = () => {
    const rows = [el('div', { class: 'lbr-baris' }, 'ULANGI SAMPAI tiba di pintu keluar [')];
    const tapBtn = (cls, text, fn) => onTap(el('button', { class: cls, type: 'button' }, text, ' ▾'), () => { if (!locked) { fn(); ctx.sound.tap(); draw(); } });
    prog.rules.forEach((r, i) => {
      rows.push(el('div', { class: 'lbr-baris', style: { '--d': i + 1 } }, 'JIKA ', tapBtn('lbr-pilih', r.sensor, () => { r.sensor = r.sensor === 'depan' ? 'kanan' : 'depan'; }), ' kosong MAKA',
        prog.rules.length > 1 ? onTap(el('button', { class: 'lbr-hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { if (!locked) { prog.rules.splice(i, 1); draw(); } }) : null));
      rows.push(el('div', { class: 'lbr-baris', style: { '--d': i + 2 } }, tapBtn('lbr-aksi', actsLabel(r.acts), () => { r.acts = cycle(ACT_CHOICES, r.acts); })));
      rows.push(el('div', { class: 'lbr-baris', style: { '--d': i + 1 } }, 'JIKA TIDAK'));
    });
    rows.push(el('div', { class: 'lbr-baris', style: { '--d': prog.rules.length + 1 } }, tapBtn('lbr-aksi', actsLabel(prog.last), () => { prog.last = cycle(ACT_CHOICES, prog.last); })));
    rows.push(el('div', { class: 'lbr-baris' }, ']'));
    node.replaceChildren(...rows);
  };
  draw();
  return {
    node, prog,
    set(p) { Object.assign(prog, structuredClone(p)); draw(); },
    add() { if (locked || prog.rules.length >= 3) { shake(node); return; } prog.rules.push({ sensor: 'depan', acts: 'M' }); draw(); },
    lock(v) { locked = v; node.classList.toggle('kunci', v); },
  };
}

function report(r) {
  if (r.exit) return `✅ Robot tiba di pintu keluar dengan ${r.maju} MAJU dan ${r.belok} belok (kanan ${r.kanan}, kiri ${r.kiri}).`;
  if (r.loop) return `🔁 Robot berputar-putar: robot kembali ke kotak yang sama dengan arah yang sama. ${r.maju} MAJU, ${r.belok} belok sejauh ini.`;
  if (r.bump) return '⛔ Robot menabrak dinding karena MAJU tanpa memeriksa sensor.';
  return 'Robot belum tiba setelah 400 langkah.';
}

function createExplore(root, ctx) {
  const wrap = el('div', { class: 'act robot-labirin' });
  root.append(wrap);
  let mazeKey = 'l1', stop = null, view;
  const holder = el('div');
  const info = el('p', { class: 'lbr-info' });
  const counter = el('div', { class: 'lbr-hitung' }, 'MAJU 0 · BELOK 0');
  const board = ruleEditor(ctx, PROG_A);
  const fresh = () => { stop?.(); board.lock(false); view = mazeView(MAZES[mazeKey]); holder.replaceChildren(view.node); info.textContent = ''; counter.textContent = 'MAJU 0 · BELOK 0'; };
  const tabs = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Labirin'), Object.entries(MAZES).map(([k, m]) => {
    const b = button(m.label, () => { mazeKey = k; tabs.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === b)); fresh(); }, 'small');
    if (k === mazeKey) b.classList.add('on');
    return b;
  }));
  const progs = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Program'),
    button('Program A', () => { board.set(PROG_A); fresh(); }, 'small'), button('Program B', () => { board.set(PROG_B); fresh(); }, 'small'),
    button('+ JIKA', () => board.add(), 'small'));
  const go = button('▶ Jalankan', () => {
    fresh(); board.lock(true);
    const r = explore(MAZES[mazeKey], board.prog);
    stop = play(view, r, {
      speed: 220,
      onStep: (s) => { if (s.maju !== undefined) counter.textContent = `MAJU ${s.maju} · BELOK ${s.belok}`; },
      done: () => { board.lock(false); info.textContent = report(r); if (r.exit) ctx.sound.win(); else ctx.sound.bad(); },
    });
  }, 'primary');
  fresh();
  wrap.append(el('p', { class: 'prompt' }, 'Pilih labirin dan program. Ketuk sensor dan gerakan untuk membuat program sendiri.'), tabs, progs,
    el('div', { class: 'lbr-atas' }, el('div', { class: 'lbr-kolom' }, holder, counter), el('div', { class: 'lbr-kolom' }, board.node, go)), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A edits a maze to trick the robot; team B picks a
// program and predicts whether the robot gets out.
function createTrick(root, ctx) {
  const wrap = el('div', { class: 'act robot-labirin' });
  root.append(wrap);
  let turn = 0, stop = null;
  const score = [0, 0];
  function start() {
    stop?.();
    const a = turn % 2, b = 1 - a;
    const rows = MAZES.l3.rows.slice(1).map((r) => [...r]);
    rows[0][4] = 'E';
    const maze = { label: 'Labirin buatan', rows: [], start: [0, 4, 0], first: 1 };
    let tool = '#';
    const holder = el('div');
    const sync = () => { maze.rows = rows.map((r) => r.join('')); };
    const draw = () => {
      sync();
      const v = mazeView(maze, {
        tap: (x, y) => {
          if (tool === 'R') {
            if (rows[y][x] === '#') { shake(holder); return; }
            maze.start = maze.start[0] === x && maze.start[1] === y ? [x, y, (maze.start[2] + 1) % 4] : [x, y, 0];
          } else if (!(maze.start[0] === x && maze.start[1] === y)) {
            if (tool === 'E') rows.forEach((r) => r.forEach((c, i) => { if (c === 'E') r[i] = '.'; }));
            rows[y][x] = tool;
          }
          ctx.sound.tap(); draw();
        },
      });
      holder.replaceChildren(v.node);
      return v;
    };
    const tools = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Alat'),
      ...[['#', '🧱 Dinding'], ['.', '⬜ Lantai'], ['E', '🚪 Pintu'], ['R', '🤖 Robot (ketuk lagi untuk memutar)']].map(([t, l]) => {
        const btn = button(l, () => { tool = t; tools.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === btn)); }, 'small');
        if (t === tool) btn.classList.add('on');
        return btn;
      }));
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: ketuk kotak untuk membuat labirin pengecoh.`);
    const info = el('p', { class: 'lbr-info' });
    draw();
    const ready = button('Labirin siap ✓', () => {
      if (!maze.rows.some((r) => r.includes('E'))) { info.textContent = 'Pasang pintu keluar dulu.'; shake(holder); return; }
      head.textContent = `Tim ${b + 1}: pilih program, tebak apakah robot keluar, lalu jalankan.`;
      const view = draw();
      holder.style.pointerEvents = 'none';
      const board = ruleEditor(ctx, PROG_B);
      let guess = null;
      const guessRow = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Tebakan'),
        ...[['keluar', '🚪 Robot keluar'], ['putar', '🔁 Robot berputar-putar']].map(([k, l]) => {
          const btn = button(l, () => { guess = k; guessRow.querySelectorAll('.btn').forEach((x) => x.classList.toggle('on', x === btn)); }, 'small');
          return btn;
        }));
      const go = button('▶ Jalankan', () => {
        if (!guess) { shake(guessRow); return; }
        go.remove(); board.lock(true); guessRow.style.pointerEvents = 'none';
        const r = explore(maze, board.prog);
        stop = play(view, r, {
          speed: 160,
          done: () => {
            const right = (guess === 'keluar') === r.exit;
            if (right) { score[b]++; ctx.sound.win(); } else ctx.sound.bad();
            info.textContent = `${report(r)} ${right ? `✅ Tebakan Tim ${b + 1} tepat!` : `✗ Tebakan Tim ${b + 1} belum tepat.`} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'lbr-atas' }, holder, el('div', { class: 'lbr-kolom' },
        el('div', { class: 'row' }, button('Program A', () => board.set(PROG_A), 'small'), button('Program B', () => board.set(PROG_B), 'small')), board.node, guessRow, go)), info);
    }, 'primary');
    wrap.replaceChildren(head, tools, holder, ready, info);
  }
  start();
  return { destroy() { stop?.(); } };
}
