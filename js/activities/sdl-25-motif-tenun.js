// Motif Tenun dengan Prosedur — SD Lanjut (10–12 tahun), prosedur dan parameter.
// PROSEDUR ketupat(luar, tengah) colours one 3 × 3 block. Values fill the
// parameters in order; a call with too few or too many values is refused.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const COLORS = ['merah', 'kuning', 'biru', 'hitam', 'hijau'];
const BASE = 'dasar';

// A procedure has parameters and either a 3 × 3 grid (0 = base colour,
// otherwise a parameter name) or a body of calls repeated `times`.
export const PROCS = {
  ketupat: { params: ['luar', 'tengah'], grid: [[0, 'luar', 0], ['luar', 'tengah', 'luar'], [0, 'luar', 0]] },
  tumpal: { params: ['warna'], grid: [[0, 0, 0], [0, 'warna', 0], ['warna', 'warna', 'warna']] },
  kain: { params: ['warna1', 'warna2'], times: 2, body: [['ketupat', ['warna1', 'warna2']], ['ketupat', ['warna2', 'warna1']]] },
};
const C = (proc, ...args) => ({ proc, args });

// Runs calls. Every block keeps the call it came from (`from`, index in the
// program) and the values of the parameters. A wrong number of values stops.
export function weave(calls, procs = PROCS) {
  const blocks = [];
  let error = null;
  const expand = (proc, args, from, depth, outer) => {
    const p = procs[proc];
    if (!p) { error = { from, text: `Prosedur ${proc} belum ada.` }; return; }
    if (args.length !== p.params.length) {
      error = { from, text: `${proc} memerlukan ${p.params.length} nilai, tetapi diberi ${args.length}.` };
      return;
    }
    const env = Object.fromEntries(p.params.map((n, i) => [n, args[i]]));
    if (p.grid) {
      blocks.push({ from, proc, env, outer, cells: p.grid.map((row) => row.map((c) => (c ? env[c] : BASE))) });
      return;
    }
    if (depth > 4) { error = { from, text: 'Prosedur memanggil terlalu dalam.' }; return; }
    for (let k = 0; k < (p.times ?? 1) && !error; k++) {
      for (const [q, names] of p.body) { if (error) return; expand(q, names.map((n) => env[n] ?? n), from, depth + 1, outer ?? { proc, env }); }
    }
  };
  calls.forEach((c, i) => { if (!error) expand(c.proc, c.args, i, 0); });
  return { blocks, error };
}
export const countColors = (blocks) => {
  const out = {};
  blocks.forEach((b) => b.cells.flat().forEach((c) => { out[c] = (out[c] ?? 0) + 1; }));
  return out;
};
const callText = (c) => `${c.proc}(${c.args.join(', ')})`;

// The cloth: blocks of 3 × 3 side by side, `perRow` blocks in a row.
function clothView(n, perRow = 4, { small = false } = {}) {
  const rows = Math.max(1, Math.ceil(n / perRow));
  const node = el('div', { class: `tnn-kain${small ? ' kecil' : ''}`, style: { '--k': perRow * 3 } });
  const cells = [];
  for (let r = 0; r < rows * 3; r++) for (let c = 0; c < perRow * 3; c++) {
    const cell = el('i', { class: `tnn-kotak ${BASE}${Math.floor(c / 3) % 2 ? ' genap' : ''}` });
    cells.push(cell); node.append(cell);
  }
  const at = (b, r, c) => cells[(Math.floor(b / perRow) * 3 + r) * perRow * 3 + (b % perRow) * 3 + c];
  return {
    node,
    clear() { cells.forEach((c) => { c.className = `tnn-kotak ${BASE}`; }); },
    put(i, block) {
      if (i >= rows * perRow) return;
      block.cells.forEach((row, r) => row.forEach((color, c) => { const x = at(i, r, c); x.className = `tnn-kotak ${color} baru`; }));
    },
  };
}
const clothOf = (blocks, perRow = 4, opt) => { const v = clothView(blocks.length, perRow, opt); blocks.forEach((b, i) => v.put(i, b)); return v.node; };

function progNode(calls) {
  const node = el('div', { class: 'tnn-kode' }, ...calls.map((c, i) => el('div', { class: 'tnn-panggil', 'data-i': i }, callText(c))));
  return node;
}

// Weaves block after block, lighting the call and showing its parameters.
function play(cloth, code, result, { done, speed = 420 } = {}) {
  let i = 0, t = null;
  cloth.clear();
  const tick = () => {
    if (i >= result.blocks.length) {
      code?.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
      if (result.error) code?.querySelector(`[data-i="${result.error.from}"]`)?.classList.add('salah');
      done?.(); return;
    }
    const b = result.blocks[i];
    cloth.put(i, b);
    if (code) {
      code.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
      const row = code.querySelector(`[data-i="${b.from}"]`);
      const vals = (env) => Object.entries(env).map(([k, v]) => `${k} = ${v}`).join(', ');
      if (row) { row.classList.add('nyala'); row.dataset.isi = b.outer ? `${vals(b.outer.env)} → ${b.proc}(${Object.values(b.env).join(', ')})` : vals(b.env); }
    }
    i++;
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

const P1 = [C('ketupat', 'merah', 'kuning'), C('ketupat', 'biru', 'merah'), C('ketupat', 'merah', 'kuning'), C('ketupat', 'biru', 'merah')];
const P3 = [C('ketupat', 'kuning', 'hitam'), C('ketupat', 'kuning', 'hitam'), C('ketupat', 'hitam', 'kuning'), C('ketupat', 'hitam', 'kuning')];
const P5 = [C('kain', 'hitam', 'kuning')];
const opts = (right, wrongs) => [right, ...wrongs].map((x, i) => ({ label: String(x), correct: i === 0 }));
const N1 = countColors(weave(P1).blocks);
const p5Calls = () => weave(P5).blocks.map((b) => `ketupat(${b.env.luar}, ${b.env.tengah})`).join(' · ');

const PROC_TEXT = ['PROSEDUR ketupat(luar, tengah):', '    warnai atas, kiri, kanan, bawah dengan luar', '    warnai tengah dengan tengah', '    pindah ke blok berikutnya'];

// Worksheet questions in order. `show` is the program woven after a right answer.
const PLAN = [
  { code: P1, show: P1, prompt: 'Soal 1. Kain mana yang dihasilkan program ini?',
    pics: [P1, [C('ketupat', 'kuning', 'merah'), C('ketupat', 'merah', 'biru'), C('ketupat', 'kuning', 'merah'), C('ketupat', 'merah', 'biru')], [C('ketupat', 'merah', 'kuning'), C('ketupat', 'merah', 'kuning'), C('ketupat', 'biru', 'merah'), C('ketupat', 'biru', 'merah')]] },
  { code: P1, show: P1, prompt: 'Banyak kotak merah, kuning, dan biru?', opts: opts(`merah ${N1.merah}, kuning ${N1.kuning}, biru ${N1.biru}`, ['merah 8, kuning 2, biru 10', 'merah 10, kuning 4, biru 8', 'merah 12, kuning 2, biru 8']) },
  { code: P1, show: P1, prompt: 'Program yang sama dengan ULANGI?', opts: opts('ULANGI 2 KALI [ ketupat(merah, kuning), ketupat(biru, merah) ]', ['ULANGI 4 KALI [ ketupat(merah, kuning) ]', 'ULANGI 2 KALI [ ketupat(merah, kuning) ]']) },
  { prompt: 'Soal 2a. Ada benang merah, kuning, dan biru. Berapa macam blok ketupat yang bisa dibuat?', nums: [3, 6, 9, 27], ans: 9 },
  { prompt: 'Tanpa parameter perlu berapa prosedur? Dengan parameter?', opts: opts('9 prosedur, dan cukup 1 dengan parameter', ['3 prosedur, dan 1 dengan parameter', '9 prosedur, dan 2 dengan parameter']) },
  { target: P3, show: P3, prompt: 'Soal 3. Program mana yang menghasilkan kain ini?',
    opts: opts(P3.map(callText).join(', '), [[C('ketupat', 'hitam', 'kuning'), C('ketupat', 'hitam', 'kuning'), C('ketupat', 'kuning', 'hitam'), C('ketupat', 'kuning', 'hitam')].map(callText).join(', '),
      [C('ketupat', 'kuning', 'hitam'), C('ketupat', 'hitam', 'kuning'), C('ketupat', 'kuning', 'hitam'), C('ketupat', 'hitam', 'kuning')].map(callText).join(', ')]) },
  { code: [C('ketupat', 'kuning', 'merah')], show: [C('ketupat', 'kuning', 'merah')], prompt: 'Soal 4a. Dika menulis ketupat(kuning, merah). Blok mana yang dihasilkan?',
    pics: [[C('ketupat', 'kuning', 'merah')], [C('ketupat', 'merah', 'kuning')], [C('tumpal', 'kuning')]] },
  { code: [C('ketupat', 'kuning', 'merah')], prompt: 'Mengapa hasilnya bukan ketupat merah bertengah kuning?', opts: opts('nilai diisi menurut urutan: pertama ke luar, kedua ke tengah', ['komputer memilih warna secara acak', 'kuning lebih kuat daripada merah']) },
  { code: [C('ketupat', 'merah')], show: [C('ketupat', 'merah')], prompt: 'Soal 4c. Mengapa ketupat(merah) tidak bisa dijalankan?', opts: opts('ketupat memerlukan dua nilai, warna tengah tidak diketahui', ['merah tidak boleh di luar', 'nama prosedurnya salah']) },
  { code: P5, show: P5, proc5: true, prompt: 'Soal 5. kain(hitam, kuning): empat panggilan ketupat yang dijalankan?', opts: opts(p5Calls(), ['ketupat(hitam, kuning) · ketupat(hitam, kuning) · ketupat(kuning, hitam) · ketupat(kuning, hitam)', 'ketupat(warna1, warna2) · ketupat(warna2, warna1) · ketupat(warna1, warna2) · ketupat(warna2, warna1)']) },
];

function round(wrap, ctx, p, next) {
  const parts = [];
  const code = p.code ? progNode(p.code) : null;
  if (p.code) parts.push(el('div', { class: 'tnn-kolom' }, el('pre', { class: 'tnn-prosedur' }, (p.proc5 ? ['PROSEDUR kain(warna1, warna2):', '    ULANGI 2 KALI [', '        ketupat(warna1, warna2)', '        ketupat(warna2, warna1)', '    ]'] : PROC_TEXT).join('\n')), code));
  let cloth = null;
  if (p.target) parts.push(el('div', { class: 'tnn-kolom' }, el('b', null, 'Kain jadi'), clothOf(weave(p.target).blocks)));
  if (p.show) { cloth = clothView(weave(p.show).blocks.length || 1); parts.push(cloth.node); }
  const subject = parts.length ? el('div', { class: 'tnn-soal' }, ...parts) : null;
  const after = () => {
    if (!cloth) { setTimeout(next, 500); return; }
    play(cloth, code, weave(p.show), { speed: 300, done: () => setTimeout(next, 900) });
  };
  let options, columns = 1;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else if (p.pics) { options = ctx.rand.shuffle(p.pics.map((calls, i) => ({ icon: clothOf(weave(calls).blocks, 4, { small: true }), correct: i === 0 }))); columns = p.pics.length; }
  else options = ctx.rand.shuffle(p.opts);
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-25-motif-tenun',
  title: 'Motif Tenun dengan Prosedur',
  topic: 'Prosedur dan parameter',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🧶',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan program kain yang memanggil prosedur dengan parameter, menebak program dari kain jadi, menemukan bug urutan parameter, dan membuat prosedur motif sendiri.',
  extraModes: [
    { id: 'studio', icon: '🧵', label: 'Studio Tenun', desc: 'Buat prosedur motif, susun panggilan, dan tenun kainnya', create: createStudio },
    { id: 'tebak', icon: '🔍', label: 'Kain Rahasia', desc: 'Satu tim menenun kain rahasia, tim lain menulis programnya', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act motif-tenun' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

// The motif editor: tap a square to choose the base colour or a parameter.
function motifEditor(ctx, procs, onChange) {
  const node = el('div', { class: 'tnn-editor' });
  const custom = procs.motifku;
  const draw = () => {
    const choices = [0, ...custom.params];
    const grid = el('div', { class: 'tnn-blok' }, ...custom.grid.flatMap((row, r) => row.map((c, k) => onTap(el('button', { class: `tnn-sel ${c ? 'p' + custom.params.indexOf(c) : BASE}`, type: 'button' }, c || '⬜'), () => {
      custom.grid[r][k] = cycle(choices, c); ctx.sound.tap(); draw(); onChange();
    }))));
    node.replaceChildren(el('b', null, `PROSEDUR motifku(${custom.params.join(', ')})`), grid,
      el('div', { class: 'row' }, button(custom.params.length === 1 ? '+ parameter' : '− parameter', () => {
        if (custom.params.length === 1) custom.params.push('b');
        else { custom.params.pop(); custom.grid.forEach((row) => row.forEach((c, k) => { if (c === 'b') row[k] = 0; })); }
        draw(); onChange();
      }, 'small')));
  };
  draw();
  return { node };
}

// Program editor: tap the procedure name or a colour to change it; + and −
// change how many values a call gives, so a wrong call can be tried.
function callsEditor(ctx, procs, calls) {
  const node = el('div', { class: 'tnn-kode edit' });
  let locked = false;
  const names = () => Object.keys(procs);
  const draw = () => {
    node.replaceChildren(...calls.map((c, i) => el('div', { class: 'tnn-panggil', 'data-i': i },
      onTap(el('button', { class: 'tnn-nama', type: 'button' }, c.proc), () => { if (!locked) { c.proc = cycle(names(), c.proc); c.args = procs[c.proc].params.map((_, k) => c.args[k] ?? COLORS[k]); ctx.sound.tap(); draw(); } }),
      '(', ...c.args.flatMap((a, k) => [k ? ', ' : null, onTap(el('button', { class: `tnn-warna ${a}`, type: 'button' }, a), () => { if (!locked) { c.args[k] = cycle(COLORS, a); ctx.sound.tap(); draw(); } })]).filter(Boolean), ')',
      el('span', { class: 'tnn-alat' },
        onTap(el('button', { class: 'tnn-kecil', type: 'button', 'aria-label': 'tambah nilai' }, '+'), () => { if (!locked && c.args.length < 3) { c.args.push('merah'); draw(); } }),
        onTap(el('button', { class: 'tnn-kecil', type: 'button', 'aria-label': 'kurangi nilai' }, '−'), () => { if (!locked && c.args.length > 0) { c.args.pop(); draw(); } }),
        onTap(el('button', { class: 'tnn-kecil hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { if (!locked) { calls.splice(i, 1); draw(); } })))));
  };
  draw();
  return {
    node, calls,
    add() { if (locked || calls.length >= 8) { shake(node); return; } calls.push(C('ketupat', 'merah', 'kuning')); draw(); },
    set(list) { calls.splice(0, calls.length, ...structuredClone(list)); draw(); },
    lock(v) { locked = v; node.classList.toggle('kunci', v); },
    redraw: draw,
  };
}

const freshProcs = () => ({ ...structuredClone(PROCS), motifku: { params: ['a', 'b'], grid: [['a', 0, 'a'], [0, 'b', 0], ['a', 0, 'a']] } });

function createStudio(root, ctx) {
  const wrap = el('div', { class: 'act motif-tenun' });
  root.append(wrap);
  const procs = freshProcs();
  let twoRows = false, stop = null;
  const prog = callsEditor(ctx, procs, structuredClone(P1));
  const motif = motifEditor(ctx, procs, () => prog.redraw());
  const holder = el('div');
  const info = el('p', { class: 'tnn-info' });
  const go = button('▶ Tenun', () => {
    stop?.();
    prog.node.querySelectorAll('.salah').forEach((n) => n.classList.remove('salah'));
    const r = weave(prog.calls, procs);
    const cloth = clothView(Math.max(twoRows ? 8 : 4, r.blocks.length), 4);
    holder.replaceChildren(cloth.node);
    prog.lock(true); info.textContent = '';
    stop = play(cloth, prog.node, r, {
      done: () => {
        prog.lock(false);
        const n = countColors(r.blocks);
        info.textContent = r.error ? `⛔ ${r.error.text} Panggilan itu tidak dijalankan.` : `Selesai: ${r.blocks.length} blok. ${COLORS.filter((c) => n[c]).map((c) => `${c} ${n[c]}`).join(', ')}.`;
        if (r.error) ctx.sound.bad(); else ctx.sound.good();
      },
    });
  }, 'primary');
  const rowsBtn = button('2 baris blok', () => { twoRows = !twoRows; rowsBtn.classList.toggle('on', twoRows); holder.replaceChildren(clothView(twoRows ? 8 : 4).node); }, 'small');
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Soal 1', () => prog.set(P1), 'small'), button('kain(hitam, kuning)', () => prog.set(P5), 'small'),
    button('Tumpal', () => prog.set([C('tumpal', 'merah'), C('tumpal', 'kuning'), C('tumpal', 'merah'), C('tumpal', 'kuning')]), 'small'),
    button('+ Panggilan', () => prog.add(), 'small'),
    rowsBtn);
  holder.append(clothView(4).node);
  wrap.append(el('p', { class: 'prompt' }, 'Ketuk kotak motifku untuk memilih parameter. Ketuk nama prosedur atau warna untuk mengubah panggilan.'), examples,
    el('div', { class: 'tnn-soal' }, motif.node, el('div', { class: 'tnn-kolom' }, prog.node, go, holder)), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A weaves a secret cloth; team B sees only the cloth and
// writes calls. Both cloths are compared.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act motif-tenun' });
  root.append(wrap);
  let turn = 0;
  const score = [0, 0];
  function start() {
    const a = turn % 2, b = 1 - a;
    const procs = freshProcs();
    const secret = callsEditor(ctx, procs, [C('ketupat', 'biru', 'kuning'), C('tumpal', 'merah'), C('ketupat', 'kuning', 'biru'), C('tumpal', 'merah')]);
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: susun program rahasia. Tim ${b + 1} jangan melihat layar.`);
    const info = el('p', { class: 'tnn-info' });
    const ready = button('Tenun rahasia ✓', () => {
      const target = weave(secret.calls, procs);
      if (target.error || !target.blocks.length) { info.textContent = target.error ? `⛔ ${target.error.text}` : 'Program masih kosong.'; shake(secret.node); return; }
      head.textContent = `Tim ${b + 1}: lihat kain ini, lalu tulis programnya dengan panggilan prosedur.`;
      const guess = callsEditor(ctx, procs, [C('ketupat', 'merah', 'kuning')]);
      const mine = el('div');
      const check = button('▶ Tenun dan bandingkan', () => {
        const r = weave(guess.calls, procs);
        const same = !r.error && JSON.stringify(r.blocks.map((x) => x.cells)) === JSON.stringify(target.blocks.map((x) => x.cells));
        mine.replaceChildren(el('b', null, `Kain Tim ${b + 1}`), clothOf(r.blocks.length ? r.blocks : [], Math.max(4, Math.min(8, r.blocks.length))));
        if (same) { score[b]++; ctx.sound.win(); check.remove(); wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary')); }
        else ctx.sound.bad();
        info.textContent = `${r.error ? `⛔ ${r.error.text} ` : ''}${same ? `✅ Sama persis dengan ${guess.calls.length} panggilan!` : '✗ Belum sama. Coba lagi.'} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'tnn-soal' }, el('div', { class: 'tnn-kolom' }, el('b', null, 'Kain rahasia'), clothOf(target.blocks, Math.max(4, Math.min(8, target.blocks.length)))), mine),
        el('div', { class: 'tnn-kolom' }, guess.node, el('div', { class: 'row' }, button('+ Panggilan', () => guess.add(), 'small'), check)), info);
    }, 'primary');
    wrap.replaceChildren(head, secret.node, el('div', { class: 'row' }, button('+ Panggilan', () => secret.add(), 'small'), ready), info);
  }
  start();
}
