// Komputer dari Kertas — SMP (13–15 tahun), cara kerja CPU dan memori.
// A 16-box memory holds both instructions and numbers. The CPU repeats
// fetch, PC + 1, execute; a number or an empty box at PC is GALAT. Pupils
// trace programs, write their own, and see data overwrite the program.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const OPS = ['AMBIL', 'TAMBAH', 'KURANG', 'SIMPAN', 'LOMPAT', 'LOMPAT-JIKA-NOL', 'TAMPIL', 'BERHENTI'];
const NOARG = ['TAMPIL', 'BERHENTI'];
export const LIMIT = 500;
// Programs as { box: 'AMBIL 10' | number }.
export function load(prog) {
  const mem = Array(16).fill(null);
  for (const [k, v] of Object.entries(prog)) {
    if (typeof v === 'number') mem[k] = v;
    else { const [op, arg] = v.split(' '); mem[k] = { op, arg: arg === undefined ? null : Number(arg) }; }
  }
  return mem;
}
export const text = (c) => (c === null ? '' : typeof c === 'number' ? String(c) : c.arg === null ? c.op : `${c.op} ${c.arg}`);
export const init = (mem) => ({ mem: mem.map((c) => (c && typeof c === 'object' ? { ...c } : c)), A: 0, PC: 0, out: [], steps: 0, halted: false, galat: false, changed: null });
// One fetch–execute cycle; returns { pc, ins } or marks the state halted.
export function step(st) {
  if (st.halted) return null;
  const pc = st.PC;
  const c = st.mem[pc];
  st.changed = null;
  st.steps++;
  if (!c || typeof c !== 'object') { st.halted = true; st.galat = true; st.out.push('GALAT'); return { pc, ins: text(c) || '(kosong)' }; }
  st.PC = (pc + 1) % 16;
  const v = (x) => (typeof st.mem[x] === 'number' ? st.mem[x] : 0);
  switch (c.op) {
    case 'AMBIL': st.A = v(c.arg); break;
    case 'TAMBAH': st.A += v(c.arg); break;
    case 'KURANG': st.A -= v(c.arg); break;
    case 'SIMPAN': st.mem[c.arg] = st.A; st.changed = c.arg; break;
    case 'LOMPAT': st.PC = c.arg; break;
    case 'LOMPAT-JIKA-NOL': if (st.A === 0) st.PC = c.arg; break;
    case 'TAMPIL': st.out.push(st.A); break;
    default: st.halted = true;
  }
  return { pc, ins: text(c) };
}
export function run(mem, max = LIMIT) {
  const st = init(mem);
  while (!st.halted && st.steps < max) step(st);
  return st;
}

export const PROG1 = { 0: 'AMBIL 10', 1: 'TAMBAH 11', 2: 'SIMPAN 12', 3: 'TAMPIL', 4: 'BERHENTI', 10: 7, 11: 5, 12: 0 };
export const DOUBLE = { 0: 'AMBIL 12', 1: 'TAMBAH 12', 2: 'SIMPAN 12', 3: 'TAMPIL', 4: 'KURANG 13', 5: 'LOMPAT-JIKA-NOL 7', 6: 'LOMPAT 0', 7: 'BERHENTI', 12: 1, 13: 8 };
export const OVERWRITE = { 0: 'AMBIL 10', 1: 'SIMPAN 2', 2: 'TAMPIL', 3: 'BERHENTI', 10: 7 };
export const COUNTDOWN = { 0: 'AMBIL 13', 1: 'LOMPAT-JIKA-NOL 6', 2: 'TAMPIL', 3: 'KURANG 14', 4: 'LOMPAT 1', 6: 'BERHENTI', 13: 5, 14: 1 };
export const MULTIPLY = { 0: 'AMBIL 15', 1: 'TAMBAH 13', 2: 'SIMPAN 15', 3: 'AMBIL 14', 4: 'KURANG 12', 5: 'SIMPAN 14', 6: 'LOMPAT-JIKA-NOL 8', 7: 'LOMPAT 0', 8: 'AMBIL 15', 9: 'TAMPIL', 10: 'BERHENTI', 12: 1, 13: 4, 14: 3, 15: 0 };

// Tasks for pupil programs: each test sets data boxes and checks the result.
export const TASKS = {
  mundur: { prompt: 'Kotak 13 berisi 5 dan kotak 14 berisi 1. Tulis program yang menampilkan 5, 4, 3, 2, 1, lalu berhenti.', data: { 13: 5, 14: 1 }, tests: [5, 3, 1, 0].map((n) => ({ set: { 13: n, 14: 1 }, label: `kotak 13 = ${n}`, ok: (st) => st.halted && !st.galat && st.out.join() === Array.from({ length: n }, (_, i) => n - i).join() })) },
  jumlah: { prompt: 'Kotak 10, 11, 12 berisi 4, 9, 6. Simpan jumlahnya di kotak 13 dan tampilkan.', data: { 10: 4, 11: 9, 12: 6 }, tests: [[4, 9, 6], [1, 2, 3], [10, 0, -5]].map(([a, b, c]) => ({ set: { 10: a, 11: b, 12: c }, label: `${a} + ${b} + ${c}`, ok: (st) => st.halted && !st.galat && st.mem[13] === a + b + c && st.out.join() === String(a + b + c) })) },
  tiga: { prompt: 'Tampilkan bilangan di kotak 15 sebanyak tiga kali, lalu berhenti.', data: { 15: 7 }, tests: [7, 0, -2, 12].map((n) => ({ set: { 15: n }, label: `kotak 15 = ${n}`, ok: (st) => st.halted && !st.galat && st.out.join() === [n, n, n].join() })) },
};
export function check(mem, task) {
  return task.tests.map((t) => { const m = mem.map((c) => c); for (const [k, v] of Object.entries(t.set)) m[k] = v; const st = run(m); return { label: t.label, pass: t.ok(st), out: st.out, halted: st.halted }; });
}

// 16-box memory grid. opts: pc, sel, changed, onCell, overwritten.
function memoryView(mem, { pc = -1, sel = -1, changed = null, onCell, overwritten = [] } = {}) {
  return el('div', { class: 'kk-memori' }, mem.map((c, i) => {
    const b = el(onCell ? 'button' : 'div', { class: ['kk-kotak', typeof c === 'number' ? 'angka' : c ? 'instr' : 'kosong', i === pc ? 'pc' : '', i === sel ? 'pilih' : '', i === changed ? 'berubah' : '', overwritten.includes(i) ? 'timpa' : ''].join(' '), type: onCell ? 'button' : undefined, 'data-i': i }, el('small', null, i), el('span', null, text(c) || '·'));
    return onCell ? onTap(b, () => onCell(i)) : b;
  }));
}
const cpuView = (st) => el('div', { class: 'kk-cpu' }, el('div', null, el('small', null, 'A'), el('b', null, st.A)), el('div', null, el('small', null, 'PC'), el('b', null, st.PC)), el('div', { class: 'kk-layar' }, el('small', null, 'Layar'), el('b', null, (st.out.length > 10 ? '…, ' : '') + st.out.slice(-10).join(', ') || '…')));

// Editor: pick a box, then an instruction and its box number, or a number.
function editor(mem, onChange) {
  let sel = 0;
  let mode = 'arg';
  const box = el('div', { class: 'kk-editor' });
  function set(v) { mem[sel] = v; onChange(); draw(); }
  function digit(d) {
    const c = mem[sel];
    if (c && typeof c === 'object' && c.arg !== null && mode === 'arg') { const n = c.arg * 10 + d; set({ ...c, arg: n <= 15 ? n : d }); return; }
    if (typeof c === 'number' || mode === 'num') { const neg = typeof c === 'number' && (c < 0 || Object.is(c, -0)); const n = Math.min(9999, Math.abs(typeof c === 'number' ? c : 0) * 10 + d); set(neg ? -n : n); }
  }
  function draw() {
    box.replaceChildren(memoryView(mem, { sel, onCell: (i) => { sel = i; mode = typeof mem[i] === 'number' ? 'num' : 'arg'; draw(); } }),
      el('div', { class: 'kk-alat' }, el('p', { class: 'kk-sel' }, `Kotak ${sel}: ${text(mem[sel]) || '(kosong)'}`),
        el('div', { class: 'kk-ops' }, OPS.map((op) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-op': op }, op), () => { mode = 'arg'; const old = mem[sel]; set({ op, arg: NOARG.includes(op) ? null : old && typeof old === 'object' && old.arg !== null ? old.arg : 0 }); })),
          onTap(el('button', { class: 'seg-btn', type: 'button', 'data-op': 'num' }, 'Bilangan'), () => { mode = 'num'; set(typeof mem[sel] === 'number' ? mem[sel] : 0); }),
          onTap(el('button', { class: 'seg-btn', type: 'button', 'data-op': 'kosong' }, 'Kosong'), () => set(null))),
        el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => digit(Number(d)))),
          onTap(el('button', { class: 'key', type: 'button', 'aria-label': 'tanda minus' }, '±'), () => { if (typeof mem[sel] === 'number') set(mem[sel] === 0 ? -0 : -mem[sel]); }),
          onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { const c = mem[sel]; if (typeof c === 'number') set(Math.trunc(c / 10)); else if (c && c.arg !== null) set({ ...c, arg: Math.floor(c.arg / 10) }); }),
          onTap(el('button', { class: 'key wide', type: 'button' }, '◀'), () => { sel = (sel + 15) % 16; draw(); }), onTap(el('button', { class: 'key wide', type: 'button' }, '▶'), () => { sel = (sel + 1) % 16; draw(); }))));
  }
  draw();
  return box;
}

// Write a program for a task; tests run on Periksa.
function writeRound(wrap, ctx, { task, done }) {
  const mem = load(task.data);
  let finished = false;
  const res = el('div', { class: 'kk-uji' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kotak, pilih instruksi, lalu ketik nomor kotaknya.');
  wrap.append(el('p', { class: 'prompt' }, task.prompt), editor(mem, () => {}), res, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const r = check(mem, task);
    res.replaceChildren(...r.map((t) => el('span', { class: t.pass ? 'lulus' : 'gagal' }, `${t.label}: ${t.halted ? t.out.join(', ') || '(tanpa keluaran)' : `${t.out.slice(0, 6).join(', ')}… tidak berhenti`} ${t.pass ? '✓' : '✗'}`)));
    if (r.every((t) => t.pass)) { finished = true; msg.className = 'reveal'; msg.textContent = 'Lolos semua uji.'; done(); } else { msg.className = 'reveal bad'; msg.textContent = `${r.filter((t) => !t.pass).length} uji belum lolos.`; ctx.mistake(); }
  }, 'primary')), msg);
}

// Trace a program: type A after each step.
function traceRound(wrap, ctx, { prog, done }) {
  const st = init(load(prog));
  let typed = '';
  let neg = false;
  let finished = false;
  const stage = el('div', { class: 'kk-samping' });
  const rows = [];
  const msg = el('p', { class: 'reveal info' });
  function draw(note) {
    const c = st.mem[st.PC];
    msg.className = note ? 'reveal bad' : finished ? 'reveal' : 'reveal info';
    msg.textContent = note || (finished ? `Selesai dalam ${st.steps} langkah. Isi kotak 12: ${st.mem[12]}.` : `Langkah ${st.steps + 1}: PC = ${st.PC}, instruksi ${text(c)}. A sesudahnya = ${neg ? '−' : ''}${typed || '…'}`);
    stage.replaceChildren(memoryView(st.mem, { pc: finished ? -1 : st.PC, changed: st.changed }), el('div', { class: 'kk-kanan' }, cpuView(st),
      el('table', { class: 'kls-tabel kk-tabel' }, el('thead', null, el('tr', null, ...['#', 'PC', 'Instruksi', 'A', 'Layar'].map((h) => el('th', null, h)))), el('tbody', null, ...rows.map((r, i) => el('tr', null, el('td', null, i + 1), ...r.map((v) => el('td', null, v))))))));
  }
  function enter() {
    if (finished) return;
    const probe = structuredClone(st);
    step(probe);
    const want = probe.A;
    if (Number(typed || 'x') * (neg ? -1 : 1) !== want) { ctx.mistake(); shake(stage); typed = ''; neg = false; draw(`Belum tepat. Ingat: ${text(st.mem[st.PC])} memakai isi kotak, bukan nomor kotaknya.`); return; }
    const pc = st.PC;
    const r = step(st);
    rows.push([pc, r.ins, st.A, st.out.at(-1) !== undefined && r.ins === 'TAMPIL' ? st.out.at(-1) : '–']);
    typed = '';
    neg = false;
    ctx.sound.tap();
    if (st.halted) { finished = true; draw(); done(); return; }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Jalankan program dan isi A sesudah setiap langkah.'), stage,
    el('div', { class: 'kode-baris' }, el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (typed.length < 4) { typed += d; draw(); } })),
      onTap(el('button', { class: 'key', type: 'button' }, '±'), () => { neg = !neg; draw(); }), onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { typed = typed.slice(0, -1); draw(); })), button('OK', enter, 'primary')), msg);
}

export default {
  id: 'smp-17-komputer-kertas',
  title: 'Komputer dari Kertas',
  topic: 'CPU, memori, dan siklus ambil–jalankan',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🖥️',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid memasangkan komponen komputer dengan fungsinya, menjalankan siklus ambil–jalankan, membedakan nomor kotak dan isi kotak, menulis program yang lolos uji, dan menjelaskan akibat data yang menimpa program.',
  extraModes: [
    { id: 'simulator', icon: '🧮', label: 'Simulator 16 Kotak', desc: 'Ketik program dan bilangan, lalu jalankan langkah demi langkah atau sampai berhenti', create: createSim },
    { id: 'tim', icon: '🎯', label: 'Tebak Keluaran', desc: 'Tim A menulis program, tim B menebak keluarannya sebelum dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kertas' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) componentRound(wrap, ctx, { done: next });
      else if (r === 1) traceRound(wrap, ctx, { prog: PROG1, done: next });
      else if (r === 2) ask('Program penggandaan: apa keluarannya?', [['2, 4, 8', true], ['1, 2, 4, 8'], ['2, 4, 6, 8'], ['2, 4, 8, 16']], 2, memoryView(load(DOUBLE)), () => ask('Berapa langkah sampai BERHENTI?', [[21, true], [18], [24], [7]], 4));
      else if (r === 3) ask('Isi kotak 13 diganti menjadi 10. Apa yang terjadi?', [['Tidak pernah berhenti: 2, 4, 8, 16, … tidak pernah tepat 10, jadi A tidak pernah 0', true], ['Berhenti setelah menampilkan 2, 4, 8, 10'], ['GALAT di langkah pertama'], ['Berhenti setelah menampilkan 16']], 1, memoryView(load({ ...DOUBLE, 13: 10 })));
      else if (r === 4) writeRound(wrap, ctx, { task: TASKS.mundur, done: next });
      else if (r === 5) writeRound(wrap, ctx, { task: TASKS.jumlah, done: next });
      else if (r === 6) ask('Jalankan: AMBIL 10, SIMPAN 2, lalu CPU mengambil kotak 2. Apa yang terjadi?', [['Kotak 2 sekarang berisi bilangan 7, jadi CPU menulis GALAT dan berhenti', true], ['Layar menampilkan 7'], ['Program berhenti normal tanpa keluaran'], ['Kotak 10 terhapus']], 1, memoryView(load(OVERWRITE)));
      else writeRound(wrap, ctx, { task: TASKS.tiga, done: next });
    }
    render();
  },
};

const COMPONENTS = [['CPU', 'A'], ['Memori utama (RAM)', 'B'], ['Penyimpanan (SSD, kartu memori)', 'C'], ['Perangkat masukan', 'D'], ['Perangkat keluaran', 'E']];
const FUNCS = { A: 'Menjalankan instruksi satu per satu dan menghitung', B: 'Menyimpan program dan data yang sedang dipakai; hilang saat listrik padam', C: 'Menyimpan berkas jangka panjang walaupun listrik padam', D: 'Memasukkan data dari pengguna atau lingkungan', E: 'Menampilkan atau mengeluarkan hasil' };
function componentRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih huruf fungsi untuk setiap komponen.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'kk-fungsi' }, Object.entries(FUNCS).map(([k, f]) => el('div', null, el('b', null, k), ` ${f}`))),
      el('div', { class: 'ab-lapisan' }, COMPONENTS.map(([c], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, c),
        el('div', { class: 'seg' }, Object.keys(FUNCS).map((k) => onTap(el('button', { class: `seg-btn ${pick[i] === k ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-k': k }, k), () => { if (!finished) { pick[i] = k; draw(); } })))))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pasangkan komponen komputer dengan fungsinya.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = COMPONENTS.map(([, k], i) => (pick[i] !== k ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} pasangan belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = 'Benar. Pada Komputer dari Kertas: CPU memegang A dan PC, Memori menjaga 16 kotak, Layar adalah perangkat keluaran.';
    done();
  }, 'primary')), msg);
}

const PRESETS = [['Program 1', PROG1], ['Penggandaan', DOUBLE], ['Hitung mundur', COUNTDOWN], ['Data menimpa', OVERWRITE], ['Perkalian', MULTIPLY], ['Kosong', {}]];
function createSim(root, ctx) {
  const wrap = el('div', { class: 'act kertas' });
  root.append(wrap);
  let mem = load(PROG1);
  let st = null;
  let base = null;
  let note = '';
  const reset = () => { st = null; note = ''; draw(); };
  function overwritten() { return st && base ? st.mem.map((c, i) => (base[i] && typeof base[i] === 'object' && typeof c === 'number' ? i : -1)).filter((i) => i >= 0) : []; }
  function begin() { if (!st) { base = mem.map((c) => c); st = init(mem); } }
  function draw() {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, ...PRESETS.map(([n, p]) => button(n, () => { mem = load(p); reset(); }, 'small'))),
      st ? el('div', { class: 'kk-samping' }, memoryView(st.mem, { pc: st.halted ? -1 : st.PC, changed: st.changed, overwritten: overwritten() }), el('div', { class: 'kk-kanan' }, cpuView(st), el('p', { class: 'kk-catatan' }, note), el('p', { class: 'small-note' }, `Langkah: ${st.steps}`)))
        : el('div', { class: 'kk-samping' }, editor(mem, () => {})),
      el('div', { class: 'kode-baris' },
        button('Langkah ➜', () => { begin(); if (st.halted) return; const pc = st.PC; const r = step(st); note = `Ambil kotak ${pc}: ${r.ins}${st.galat ? ' → GALAT' : ''}${st.changed !== null ? ` → kotak ${st.changed} = ${st.mem[st.changed]}` : ''}`; ctx.sound.tap(); draw(); }, 'primary'),
        button('Jalankan', () => { begin(); while (!st.halted && st.steps < LIMIT) step(st); note = st.halted ? (st.galat ? 'GALAT: kotak yang diambil bukan instruksi.' : 'Program berhenti.') : `${LIMIT} langkah tanpa BERHENTI: program mungkin tidak pernah berhenti.`; if (st.halted && !st.galat) ctx.sound.win(); else ctx.sound.bad(); draw(); }, 'small'),
        button(st ? 'Ubah program' : 'Reset', reset, 'small')));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kertas' });
  root.append(wrap);
  const score = [0, 0];
  let writer = 0;
  function writePhase() {
    const mem = load({ 0: 'AMBIL 15', 1: 'TAMPIL', 2: 'BERHENTI', 15: 3 });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${writer + 1} menulis program. Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`), editor(mem, () => {}),
      el('div', { class: 'kode-baris' }, button('Serahkan ke lawan ➜', () => guessPhase(mem), 'primary')));
  }
  function guessPhase(mem) {
    const guesser = 1 - writer;
    const guess = [];
    let typed = '';
    let neg = false;
    const box = el('div');
    const draw = () => box.replaceChildren(el('p', { class: 'kk-catatan' }, `Tebakan: ${[...guess, (neg ? '−' : '') + typed].filter(Boolean).join(', ') || '…'}`),
      el('div', { class: 'kode-baris' }, el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { typed += d; draw(); })),
        onTap(el('button', { class: 'key', type: 'button' }, '±'), () => { neg = !neg; draw(); }), onTap(el('button', { class: 'key wide', type: 'button' }, 'koma'), () => { if (typed) { guess.push((neg ? -1 : 1) * Number(typed)); typed = ''; neg = false; draw(); } }),
        onTap(el('button', { class: 'key wide', type: 'button' }, '⌫'), () => { if (typed) typed = typed.slice(0, -1); else guess.pop(); draw(); })),
        button('Jalankan!', () => {
          if (typed) guess.push((neg ? -1 : 1) * Number(typed));
          const st = run(mem, 60);
          const real = st.halted ? st.out.join(', ') || '(tanpa keluaran)' : `${st.out.slice(0, 8).join(', ')}… (tidak berhenti)`;
          const ok = st.halted && guess.join(', ') === st.out.join(', ');
          if (ok) { score[guesser]++; ctx.sound.win(); } else ctx.sound.bad();
          writer = guesser;
          wrap.append(el('p', { class: `reveal ${ok ? '' : 'bad'}` }, `Keluaran: ${real}. ${ok ? `Tebakan Tim ${guesser + 1} tepat!` : 'Tebakan belum tepat.'}`), el('div', { class: 'kode-baris' }, button('Giliran berikutnya ➜', writePhase, 'primary')));
        }, 'primary')));
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${guesser + 1}: tebak keluarannya (pisahkan dengan "koma").`), memoryView(mem), box);
    draw();
  }
  writePhase();
}
