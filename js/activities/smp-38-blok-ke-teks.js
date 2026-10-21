// Dari Blok ke Teks — SMP (13–15 tahun), coding. From block programs (the
// Kancil cards of sdl-12) to Python: matching blocks and lines, range() from
// 0, indentation that changes meaning, running Python on paper, Rani's three
// syntax errors and two logic errors, and a while loop that never stops.
// Python here is index-from-0 (range(3) gives 0, 1, 2).

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pairRound, pickSet, pyCode, pyTracer, stepper } from './smp-kit.js';
import { runPy } from './mini-py.js';

export const P = {
  kancil: ['for i in range(3):', '    maju()', 'belok_kiri()', 'for i in range(4):', '    if ada_buaya_di_depan():', '        lompat()', '    else:', '        maju()', 'print("Kancil sampai!")'],
  A: ['for i in range(3):', '    maju()', '    belok_kiri()'],
  B: ['for i in range(3):', '    maju()', 'belok_kiri()'],
  langkah: ['langkah = 0', 'for i in range(5):', '    langkah = langkah + 2', '    if langkah > 6:', '        print("Lompat!", langkah)', '    else:', '        print("Maju", langkah)', 'print("Total langkah:", langkah)'],
  rani: ['langkah = 0', 'for i in range(4)', '    maju()', 'langkah = langkah + 1', 'if langkah = 4:', 'print("Sampai")', 'belok_kiri'],
  raniSintaks: ['langkah = 0', 'for i in range(4):', '    maju()', 'langkah = langkah + 1', 'if langkah == 4:', '    print("Sampai")', 'belok_kiri'],
  raniBenar: ['langkah = 0', 'for i in range(4):', '    maju()', '    langkah = langkah + 1', 'if langkah == 4:', '    print("Sampai")', 'belok_kiri()'],
  q6: ['for i in range(2):', '    maju()', '    maju()', '    belok_kanan()', 'lompat()'],
  tepi: ['while not di_tepi_sungai():', '    maju()', 'print("Kancil di tepi sungai")'],
  lupa: ['while not di_tepi_sungai():', '    pass', 'print("Kancil di tepi sungai")'],
};
export const PNAME = { kancil: 'Program Kancil (soal 2)', A: 'Program A', B: 'Program B', langkah: 'Hitung langkah (soal 4)', rani: 'Program Rani', raniBenar: 'Rani sudah benar', q6: 'Soal 6', tepi: 'Tantangan: while', lupa: 'while tanpa maju()' };
export const BLOCKS = {
  kancil: [['ULANGI 3 KALI [ MAJU ]', [0, 1]], ['BELOK KIRI', [2]], ['ULANGI 4 KALI [', [3]], ['    JIKA ada buaya di depan MAKA LOMPAT', [4, 5]], ['    JIKA TIDAK MAJU', [6, 7]], [']', [3]], ['TAMPILKAN "Kancil sampai!"', [8]]],
  A: [['ULANGI 3 KALI [', [0]], ['    MAJU', [1]], ['    BELOK KIRI', [2]], [']', [0]]],
  B: [['ULANGI 3 KALI [ MAJU ]', [0, 1]], ['BELOK KIRI', [2]]],
  q6: [['ULANGI 2 KALI [', [0]], ['    MAJU', [1]], ['    MAJU', [2]], ['    BELOK KANAN', [3]], [']', [0]], ['LOMPAT', [4]]],
};
export const SENSOR = [false, true, false, true];

// Kancil's little world: moves, crocodiles found by the sensor, river edge.
export function world({ sensor = SENSOR, tepi = 4 } = {}) {
  const w = { x: 0, y: 0, d: 0, trail: [[0, 0]], moves: [], buaya: [], tepi, q: [...sensor] };
  const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const step = (n, name) => { w.moves.push(name); for (let k = 0; k < n; k++) { w.x += D[w.d][0]; w.y += D[w.d][1]; if (n === 1 || k === n - 1) w.trail.push([w.x, w.y]); } return null; };
  w.builtins = {
    maju: () => step(1, 'MAJU'), lompat: () => step(2, 'LOMPAT'),
    belok_kiri: () => { w.d = (w.d + 3) % 4; w.moves.push('BELOK KIRI'); return null; }, belok_kanan: () => { w.d = (w.d + 1) % 4; w.moves.push('BELOK KANAN'); return null; },
    ada_buaya_di_depan: () => { const v = w.q.length ? w.q.shift() : false; if (v) w.buaya.push([w.x + D[w.d][0], w.y + D[w.d][1]]); return v; },
    di_tepi_sungai: () => w.x >= w.tepi,
  };
  return w;
}
export function movesOf(lines, o = {}) { const w = world(o); const r = runPy(lines, { builtins: w.builtins, limit: 400 }); return { moves: w.moves, out: r.out, error: r.error, w, r }; }
export const mv = (lines, o) => movesOf(lines, o).moves.join(', ');

function worldView(w, { river = false } = {}) {
  const pts = [...w.trail, ...w.buaya, [w.x, w.y]]; const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  const x0 = Math.min(0, ...xs) - 1; const x1 = Math.max(river ? w.tepi + 1 : 0, ...xs) + 1; const y0 = Math.min(0, ...ys) - 1; const y1 = Math.max(0, ...ys) + 1;
  const visited = new Set(w.trail.map((p) => p.join(','))); const croc = new Set(w.buaya.map((p) => p.join(',')));
  const ARROW = ['→', '↓', '←', '↑'];
  const rows = []; for (let y = y0; y <= y1; y++) { const cells = []; for (let x = x0; x <= x1; x++) { const k = `${x},${y}`; const here = x === w.x && y === w.y;
    cells.push(el('div', { class: `kc-sel ${visited.has(k) ? 'jejak' : ''} ${river && x > w.tepi ? 'sungai' : ''} ${x === 0 && y === 0 ? 'mulai' : ''}` }, here ? el('span', { class: 'kc-kancil' }, '🦌', el('i', null, ARROW[w.d])) : croc.has(k) ? '🐊' : '')); }
    rows.push(el('div', { class: 'kc-baris' }, cells)); }
  return el('div', { class: 'kc-dunia' }, el('div', { class: 'kc-peta', style: { '--kolom': x1 - x0 + 1 } }, rows), el('p', { class: 'kc-gerak' }, w.moves.length ? w.moves.join(', ') : 'Kancil belum bergerak.'));
}
function kancilTracer(lines, o = {}) {
  let w = world(o.world);
  return pyTracer(lines, { opts: () => { w = world(o.world); return { builtins: w.builtins, limit: o.limit ?? 400 }; }, speed: 450, ...o, extra: () => worldView(w, { river: !!o.river }) });
}

export default {
  id: 'smp-38-blok-ke-teks',
  title: 'Dari Blok ke Teks',
  topic: 'Dari blok ke Python: perintah gerak, for dan range, if dan else, indentasi, print, kesalahan sintaks dan logika',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🐍',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Terjemahkan program blok Kancil ke Python, lihat bagaimana indentasi mengubah gerakan, jalankan Python di atas kertas, dan perbaiki program Rani sampai Kancil maju 4 kali, menampilkan "Sampai", lalu berbelok.',
  extraModes: [
    { id: 'pasang', icon: '🧩', label: 'Blok dan Baris Kode', desc: 'Program blok dan Python berdampingan; ketuk blok untuk menyorot baris Python yang sama artinya. Susun juga blok sendiri dan lihat Python-nya berubah', create: createPair },
    { id: 'jalan', icon: '▶️', label: 'Penjalan Python', desc: 'Jalankan Python langkah demi langkah sambil menggerakkan Kancil; geser baris ke kiri atau kanan dan lihat gerakannya berubah', create: createRunner },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Terjemahkan', desc: 'Tim bergiliran menerjemahkan program blok ke Python atau sebaliknya dan memeriksa apakah gerakan Kancil sama', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act blok-ke-teks' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const runFirst = (prompt, lines, after, o = {}) => { const tr = kancilTracer(lines, { ...o, onEnd: () => setTimeout(then(after), 1800) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      if (r === 0) pairRound(wrap, ctx, { prompt: 'Pasangkan blok dengan baris Python yang sama artinya', left: [['u', 'ULANGI 5 KALI [ MAJU ]', 'B'], ['k', 'BELOK KANAN', 'D'], ['j', 'JIKA ada buaya di depan MAKA', 'A'], ['t', 'TAMPILKAN "Sampai!"', 'C'], ['e', 'JIKA TIDAK', 'E']], texts: { A: 'if ada_buaya_di_depan():', B: 'for i in range(5):  maju()', C: 'print("Sampai!")', D: 'belok_kanan()', E: 'else:' }, done: next });
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Terjemahkan program blok Kancil ke Python', cls: 'kc-isi', info: 'ULANGI 3 KALI [ MAJU ] · BELOK KIRI · ULANGI 4 KALI [ JIKA ada buaya di depan MAKA LOMPAT, JIKA TIDAK MAJU ] · TAMPILKAN "Kancil sampai!"', rows: [['a', 'for i in range(…):', ['3', '2', '4', '1, 3'], '3', 'range(3) menghasilkan 0, 1, 2: tiga putaran.'], ['b', '    …', ['maju()', 'maju', 'MAJU', 'print(maju)'], 'maju()'], ['c', 'for i in range(…):  (kedua)', ['4', '3', '5'], '4'], ['d', '    if …:', ['ada_buaya_di_depan()', 'ada_buaya_di_depan', 'ada buaya di depan', 'buaya == True'], 'ada_buaya_di_depan()'], ['e', '    …  (sebelum maju() kedua)', ['else:', 'elif:', 'JIKA TIDAK:', 'if not:'], 'else:'], ['f', 'print(…)', ['"Kancil sampai!"', 'Kancil sampai!', "'Kancil sampai!", 'Kancil_sampai'], '"Kancil sampai!"']], done: next });
      else if (r === 2) runFirst('Jalankan: sensor menjawab tidak, ya, tidak, ya', P.kancil, () => rowsChoose(wrap, ctx, { prompt: 'Urutan gerakan Kancil', rows: [['g', 'Gerakan', [mv(P.kancil), 'MAJU, MAJU, MAJU, BELOK KIRI, LOMPAT, MAJU, LOMPAT, MAJU', 'MAJU, MAJU, MAJU, MAJU, BELOK KIRI, MAJU, LOMPAT, MAJU', 'MAJU, MAJU, MAJU, BELOK KIRI, MAJU, MAJU, MAJU, MAJU'], mv(P.kancil)]], done: next }));
      else if (r === 3) { wrap.append(el('div', { class: 'kc-dua' }, el('div', null, el('b', null, 'Program A'), pyCode(P.A)), el('div', null, el('b', null, 'Program B'), pyCode(P.B)))); rowsChoose(wrap, ctx, { prompt: 'Indentasi mengubah arti', rows: [['a', 'Gerakan Program A', [mv(P.A), mv(P.B), 'MAJU, BELOK KIRI'], mv(P.A), 'belok_kiri() ada di dalam perulangan.'], ['b', 'Gerakan Program B', [mv(P.A), mv(P.B), 'BELOK KIRI, MAJU, MAJU, MAJU'], mv(P.B), 'belok_kiri() di luar perulangan.'], ['c', 'Program A sebagai blok', ['ULANGI 3 KALI [ MAJU, BELOK KIRI ]', 'ULANGI 3 KALI [ MAJU ], lalu BELOK KIRI', 'MAJU, ULANGI 3 KALI [ BELOK KIRI ]'], 'ULANGI 3 KALI [ MAJU, BELOK KIRI ]'], ['d', 'Program B sebagai blok', ['ULANGI 3 KALI [ MAJU ], lalu BELOK KIRI', 'ULANGI 3 KALI [ MAJU, BELOK KIRI ]', 'BELOK KIRI, lalu ULANGI 3 KALI [ MAJU ]'], 'ULANGI 3 KALI [ MAJU ], lalu BELOK KIRI']], done: next }); }
      else if (r === 4) { const o = runPy(P.langkah).out; runFirst('Jalankan Python di atas kertas', P.langkah, () => rowsChoose(wrap, ctx, { prompt: 'Keluaran dan hitungan', rows: [['o', 'Keluaran', [o.join(' / '), 'Maju 2 / Maju 4 / Lompat! 6 / Lompat! 8 / Lompat! 10 / Total langkah: 10', 'Maju 2 / Maju 4 / Maju 6 / Lompat! 8 / Lompat! 10', 'Maju 0 / Maju 2 / Maju 4 / Maju 6 / Lompat! 8 / Total langkah: 8'], o.join(' / ')], ['n', 'langkah = langkah + 2 dijalankan', ['5 kali', '4 kali', '6 kali', '10 kali'], `${runPy(P.langkah).trace.filter((t) => t.line === 2).length} kali`, 'range(5) menghasilkan 0, 1, 2, 3, 4.'], ['t', 'print("Total langkah:", langkah) tampil sekali karena', ['tidak menjorok, jadi di luar perulangan', 'langkah sudah lebih dari 6', 'print hanya boleh dipakai sekali', 'ada else di atasnya'], 'tidak menjorok, jadi di luar perulangan']], done: next })); }
      else if (r === 5) runFirst('Jalankan program Rani', P.rani, () => rowsChoose(wrap, ctx, { prompt: 'Kesalahan pertama yang dilaporkan', info: 'Python berhenti di kesalahan pertama yang ditemukannya.', rows: [['b', 'Baris', ['2', '4', '5', '7'], String(runPy(P.rani).error.line + 1)], ['s', 'Sebab', ['titik dua di akhir for hilang', 'langkah belum dibuat', 'maju() tidak menjorok', 'range(4) harus range(1, 4)'], 'titik dua di akhir for hilang']], done: next }));
      else if (r === 6) { wrap.append(pyCode(P.rani)); pickSet(wrap, ctx, { prompt: 'Ketuk semua baris yang berisi kesalahan sintaks', items: P.rani.map((t, i) => [String(i + 1), `${i + 1}  ${t}`]), right: ['2', '5', '6'], why: 'Baris 2 butuh titik dua, baris 5 butuh ==, baris 6 harus menjorok di bawah if (IndentationError).', done: then(() => rowsChoose(wrap, ctx, { prompt: 'Perbaikannya', cls: 'kc-isi', rows: [['2', 'Baris 2', ['for i in range(4):', 'for i in range(4);', 'for i in range 4:'], 'for i in range(4):'], ['5', 'Baris 5', ['if langkah == 4:', 'if langkah = 4', 'if langkah := 4'], 'if langkah == 4:'], ['6', 'Baris 6', ['    print("Sampai")', 'print "Sampai"', 'print("Sampai"):'], '    print("Sampai")']], done: next })) }); }
      else if (r === 7) { const m = movesOf(P.raniSintaks); runFirst('Semua kesalahan sintaks sudah diperbaiki. Jalankan lagi', P.raniSintaks, () => rowsChoose(wrap, ctx, { prompt: 'Program berjalan tanpa galat, tetapi hasilnya salah', rows: [['a', 'Yang terjadi', ['Kancil maju 4 kali, tetapi "Sampai" tidak tampil dan Kancil tidak berbelok', 'Kancil maju sekali lalu berhenti', 'Program berhenti dengan galat', 'Kancil maju 4 kali, menampilkan "Sampai", dan berbelok'], m.out.length === 0 && !m.moves.includes('BELOK KIRI') ? 'Kancil maju 4 kali, tetapi "Sampai" tidak tampil dan Kancil tidak berbelok' : '?'], ['4', 'Baris 4 langkah = langkah + 1', ['harus menjorok: kini hanya dijalankan sekali, langkah = 1', 'harus dihapus', 'sudah benar'], 'harus menjorok: kini hanya dijalankan sekali, langkah = 1'], ['7', 'Baris 7 belok_kiri', ['harus belok_kiri(): tanpa tanda kurung fungsinya tidak dipanggil', 'harus BELOK KIRI', 'sudah benar'], 'harus belok_kiri(): tanpa tanda kurung fungsinya tidak dipanggil', 'Python tidak menganggap ini kesalahan.']],
        done: then(() => { wrap.append(el('p', { class: 'prompt' }, 'Program Rani yang sudah benar')); const tr = kancilTracer(P.raniBenar, { onEnd: () => setTimeout(next, 1500) }); wrap.append(tr); }) })); }
      else if (r === 8) { wrap.append(pyCode(P.q6)); rowsChoose(wrap, ctx, { prompt: 'Dari Python kembali ke blok', rows: [['b', 'Blok', ['ULANGI 2 KALI [ MAJU, MAJU, BELOK KANAN ], lalu LOMPAT', 'ULANGI 2 KALI [ MAJU, MAJU, BELOK KANAN, LOMPAT ]', 'ULANGI 2 KALI [ MAJU ], MAJU, BELOK KANAN, LOMPAT'], 'ULANGI 2 KALI [ MAJU, MAJU, BELOK KANAN ], lalu LOMPAT'], ['g', 'Gerakan', [mv(P.q6), 'MAJU, MAJU, BELOK KANAN, LOMPAT, MAJU, MAJU, BELOK KANAN, LOMPAT', 'MAJU, MAJU, MAJU, MAJU, BELOK KANAN, LOMPAT'], mv(P.q6)]], done: next }); }
      else runFirst('Tantangan: Kancil terus maju selama belum di tepi sungai', P.tepi, () => ask('Apa yang terjadi bila maju() lupa ditulis di dalam perulangan?', [['Kancil tidak pernah bergerak, sehingga di_tepi_sungai() selalu False dan perulangan tidak pernah berhenti', true], ['Kancil langsung sampai di tepi sungai'], ['Python melompati perulangan'], ['Kancil maju satu kali saja']], 1, el('div', null, el('small', null, 'Python juga menolak perulangan yang isinya kosong (IndentationError), jadi di sini maju() diganti pass:'), pyCode(P.lupa), el('p', { class: 'sk-galat batas' }, `⏱ ${movesOf(P.lupa).error.message}`))), { river: true });
    }
    render();
  },
};

// Block builder → Python.
export function toPy(items) { const L = []; for (const it of items) { if (it.t === 'rep') { L.push(`for i in range(${it.n}):`); for (const m of it.body) L.push(`    ${PYM[m]}`); if (!it.body.length) L.push('    pass'); } else L.push(PYM[it.m]); } return L; }
const PYM = { MAJU: 'maju()', 'BELOK KIRI': 'belok_kiri()', 'BELOK KANAN': 'belok_kanan()', LOMPAT: 'lompat()' };
function createPair(root, ctx) {
  const wrap = el('div', { class: 'act blok-ke-teks' });
  root.append(wrap);
  let prog = 'kancil'; let sel = null; let items = [{ t: 'rep', n: 3, body: ['MAJU'] }, { t: 'move', m: 'BELOK KIRI' }]; let target = null;
  const draw = () => {
    const head = el('div', { class: 'seg' }, [...Object.keys(BLOCKS), 'susun'].map((k) => onTap(el('button', { class: `seg-btn ${prog === k ? 'on' : ''}`, type: 'button' }, k === 'susun' ? 'Susun blok sendiri' : PNAME[k]), () => { prog = k; sel = null; draw(); })));
    if (prog !== 'susun') {
      const B = BLOCKS[prog]; const pyLines = P[prog]; const hlPy = sel?.side === 'b' ? B[sel.i][1] : sel?.side === 'p' ? [sel.i] : [];
      const hlB = sel?.side === 'p' ? B.map((b, i) => (b[1].includes(sel.i) ? i : -1)).filter((i) => i >= 0) : sel?.side === 'b' ? [sel.i] : [];
      const res = movesOf(pyLines);
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Blok dan baris kode'), head,
        el('div', { class: 'kc-dua' }, el('div', { class: 'kc-blok-daftar' }, B.map(([t], i) => onTap(el('button', { class: `kc-blok ${hlB.includes(i) ? 'hl' : ''} ${/^\s/.test(t) ? 'dalam' : ''}`, type: 'button' }, t.trim()), () => { sel = { side: 'b', i }; draw(); }))),
          pyCode(pyLines, { hl: hlPy, onLine: (i) => { sel = { side: 'p', i }; draw(); } })), worldView(res.w));
      return;
    }
    const py = toPy(items); const res = movesOf(py);
    const addMove = (m) => { if (target != null && items[target]?.t === 'rep') items[target].body.push(m); else items.push({ t: 'move', m }); draw(); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Susun blok sendiri'), head,
      el('div', { class: 'kc-palet' }, Object.keys(PYM).map((m) => button(m, () => addMove(m))), button('ULANGI 2 KALI [ ]', () => { items.push({ t: 'rep', n: 2, body: [] }); target = items.length - 1; draw(); }), button(target != null ? 'Keluar dari ULANGI' : '—', () => { target = null; draw(); }), button('⌫ Hapus terakhir', () => { const last = items[items.length - 1]; if (!last) return; if (last.t === 'rep' && last.body.length && target === items.length - 1) last.body.pop(); else { items.pop(); target = null; } draw(); }), button('Kosongkan', () => { items = []; target = null; draw(); })),
      el('div', { class: 'kc-dua' }, el('div', { class: 'kc-blok-daftar' }, items.length ? items.map((it, i) => (it.t === 'rep' ? el('div', { class: `kc-ulangi ${target === i ? 'pilih' : ''}` }, el('div', { class: 'kc-ulangi-kepala' }, onTap(el('span', null, 'ULANGI'), () => { target = i; draw(); }), stepper(it.n, (v) => { it.n = v; draw(); }, { min: 1, max: 9 }), el('span', null, 'KALI [')), it.body.map((m) => el('div', { class: 'kc-blok dalam' }, m)), el('span', null, target === i ? '] ← blok baru masuk ke sini' : ']')) : el('div', { class: 'kc-blok' }, it.m))) : el('small', null, 'Belum ada blok.')), pyCode(py)), worldView(res.w));
  };
  draw();
}

function createRunner(root, ctx) {
  const wrap = el('div', { class: 'act blok-ke-teks' });
  root.append(wrap);
  let name = 'B'; let lines = [...P.B]; let tr = null; let edit = false;
  const draw = () => {
    tr?.stop(); tr = kancilTracer(lines, { river: name === 'tepi' || name === 'lupa', limit: 400 });
    const editor = el('div', { class: 'kc-editor' }, lines.map((t, i) => { const inp = el('input', { type: 'text', value: t.trimStart(), 'aria-label': `baris ${i + 1}`, spellcheck: 'false', autocomplete: 'off' }); inp.addEventListener('change', () => { const sp = (lines[i].match(/^ */) || [''])[0]; lines[i] = sp + inp.value.trim(); draw(); });
      const sp = (t.match(/^ */) || [''])[0].length;
      return el('div', { class: 'kc-edit-baris' }, el('small', null, String(i + 1)), button('⇤', () => { lines[i] = lines[i].replace(/^ {1,4}/, ''); draw(); }), button('⇥', () => { lines[i] = `    ${lines[i]}`; draw(); }), el('span', { class: 'kc-jorok', style: { width: `${sp * 0.6}em` } }), inp, button('✕', () => { lines.splice(i, 1); draw(); })); }), button('+ Baris', () => { lines.push(''); draw(); }));
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Penjalan Python'),
      el('div', { class: 'seg' }, Object.keys(PNAME).map((k) => onTap(el('button', { class: `seg-btn ${name === k ? 'on' : ''}`, type: 'button' }, PNAME[k]), () => { name = k; lines = [...P[k]]; draw(); }))),
      onTap(el('button', { class: `seg-btn ${edit ? 'on' : ''}`, type: 'button' }, edit ? '☑ Ubah kode (geser baris dengan ⇤ ⇥)' : '☐ Ubah kode (geser baris dengan ⇤ ⇥)'), () => { edit = !edit; draw(); }),
      edit ? editor : null, tr].filter(Boolean));
  };
  draw();
}

// Translation rounds: [blocks, right python, wrong pythons]
export const QUIZ = [
  ['ULANGI 3 KALI [ MAJU, BELOK KIRI ]', P.A, [P.B, ['for i in range(2):', '    maju()', '    belok_kiri()'], ['for i in range(3)', '    maju()', '    belok_kiri()']]],
  ['ULANGI 3 KALI [ MAJU ], lalu BELOK KIRI', P.B, [P.A, ['for i in range(3):', '    maju()', 'belok_kiri'], ['for i in range(4):', '    maju()', 'belok_kiri()']]],
  ['ULANGI 2 KALI [ MAJU, MAJU, BELOK KANAN ], lalu LOMPAT', P.q6, [['for i in range(2):', '    maju()', '    maju()', '    belok_kanan()', '    lompat()'], ['for i in range(2):', '    maju()', 'maju()', 'belok_kanan()', 'lompat()'], ['for i in range(1, 2):', '    maju()', '    maju()', '    belok_kanan()', 'lompat()']]],
  ['LOMPAT, lalu ULANGI 4 KALI [ MAJU ]', ['lompat()', 'for i in range(4):', '    maju()'], [['for i in range(4):', '    lompat()', '    maju()'], ['lompat()', 'for i in range(4):', 'maju()'], ['lompat()', 'for i in range(3):', '    maju()']]],
  ['ULANGI 2 KALI [ JIKA ada buaya di depan MAKA LOMPAT, JIKA TIDAK MAJU ]', ['for i in range(2):', '    if ada_buaya_di_depan():', '        lompat()', '    else:', '        maju()'], [['for i in range(2):', '    if ada_buaya_di_depan():', '        lompat()', 'else:', '    maju()'], ['for i in range(2):', '    if ada_buaya_di_depan:', '        lompat()', '    else:', '        maju()'], ['for i in range(2):', '    if ada_buaya_di_depan():', '        lompat()', '    maju()']]],
  ['BELOK KANAN, ULANGI 2 KALI [ MAJU ], BELOK KANAN', ['belok_kanan()', 'for i in range(2):', '    maju()', 'belok_kanan()'], [['belok_kanan()', 'for i in range(2):', '    maju()', '    belok_kanan()'], ['for i in range(2):', '    belok_kanan()', '    maju()', 'belok_kanan()'], ['belok_kanan()', 'for i in range(3):', '    maju()', 'belok_kanan()']]],
];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act blok-ke-teks' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Terjemahkan selesai', pts, again: () => pickTeams(wrap, 'Terjemahkan', start) }); return; }
      const team = k % nT; const [blk, right, wrongs] = QUIZ[k % QUIZ.length]; const toText = k % 2 === 0;
      const msg = el('p', { class: 'reveal info' }, `Tim ${team + 1}: ${toText ? 'pilih Python yang sama artinya dengan blok ini' : 'pilih blok yang sama artinya dengan Python ini'}.`);
      const host = el('div', { class: 'kc-giliran' });
      const opts = ctx.rand.shuffle([[right, true], ...wrongs.map((w) => [w, false])]);
      const blockOpts = ctx.rand.shuffle([[blk, true], ...QUIZ.filter((q) => q[0] !== blk).slice(0, 3).map((q) => [q[0], false])]);
      const pick = (ok, btn, shown) => { if (host.classList.contains('selesai')) return; host.classList.add('selesai'); if (ok) pts[team] += 2; btn.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        const a = movesOf(right); const b = shown ? movesOf(shown) : null;
        say(msg, ok ? '' : 'bad', `${ok ? `Tepat! Tim ${team + 1} +2.` : 'Belum tepat.'} Gerakan yang benar: ${a.moves.join(', ')}${b && !ok ? `. Pilihanmu: ${b.error ? `${b.error.type}: ${b.error.message}` : b.moves.join(', ') || 'tidak bergerak'}` : ''}.`);
        host.append(worldView(a.w)); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, team)); k++; setTimeout(turn, 5600); };
      if (toText) host.append(el('div', { class: 'kc-blok besar' }, blk), el('div', { class: 'kc-pilihan' }, opts.map(([lines, ok]) => onTap(el('button', { class: 'opt kc-opt', type: 'button' }, pyCode(lines)), (e) => pick(ok, e.currentTarget, lines)))));
      else host.append(pyCode(right, { cls: 'besar' }), el('div', { class: 'opts', style: { '--cols': 2 } }, blockOpts.map(([t, ok]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, t)), (e) => pick(ok, e.currentTarget, null)))));
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Ronde ${k + 1}: ${toText ? 'blok → Python' : 'Python → blok'}`), host, msg);
    }
    turn();
  }
  pickTeams(wrap, 'Terjemahkan', start);
}
