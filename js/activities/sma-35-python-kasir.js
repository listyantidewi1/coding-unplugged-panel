// Python di Atas Kertas: Kasir Koperasi — SMA/SMK (16–18 tahun), coding.
// Python 3 data types: int, float, str, bool; / always gives a float, // and
// %, round() rounding half to even, input() giving text, Rudi's "2" + "3"
// bug and the TypeError, change in notes and coins, and tax in whole rupiah.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyTracer, pyCode, stepper } from './smp-kit.js';
import { runPy, pyRepr, pyType } from './mini-py.js';

export const KASIR = (fix = false) => ['harga_buku = 4500', 'harga_pulpen = 3000', 'jumlah_buku = int(input("Jumlah buku: "))', 'jumlah_pulpen = int(input("Jumlah pulpen: "))', 'total = harga_buku * jumlah_buku + harga_pulpen * jumlah_pulpen', 'dapat_diskon = total >= 25000', 'if dapat_diskon:',
  fix ? '    diskon = total // 10' : '    diskon = total * 0.1', 'else:', '    diskon = 0', 'bayar = total - diskon', 'uang = int(input("Uang pembeli: "))', 'kembalian = uang - bayar', 'print("Total:", total)', 'print("Diskon:", diskon)', 'print("Bayar:", bayar)', 'print("Kembalian:", kembalian)'];
export const PECAHAN = ['lembar_10000 = kembalian // 10000', 'sisa = kembalian % 10000', 'lembar_1000 = sisa // 1000', 'sisa = sisa % 1000', 'koin_500 = sisa // 500', 'sisa = sisa % 500', 'koin_100 = sisa // 100', 'sisa = sisa % 100', 'print(lembar_10000, lembar_1000, koin_500, koin_100, sisa)'];
export const RUDI = ['harga_buku = 4500', 'harga_pulpen = 3000', 'jumlah_buku = input("Jumlah buku: ")', 'jumlah_pulpen = input("Jumlah pulpen: ")', 'banyak = jumlah_buku + jumlah_pulpen', 'print("Banyak barang:", banyak)', 'total = harga_buku * jumlah_buku + harga_pulpen * jumlah_pulpen', 'dapat_diskon = total >= 25000'];
export const A = ['3', '2', '20000']; export const B = ['5', '3', '50000'];
export const EXPR = ['4500.0', '"4500"', '31500 >= 25000', '7 / 2', '8 / 4', '7 // 2', '7 % 2', 'round(7 / 2)', 'round(2.5)', '"2" + "3"', 'int("2") + int("3")', 'str(2) + str(3)', '0.1 + 0.2'];
// Value as the worksheet writes it: text in double quotes.
export const show = (v) => (typeof v === 'string' ? `"${v}"` : pyRepr(v));
export function evalExpr(src) { const r = runPy([`x = ${src}`]); if (r.error) throw r.error; return r.vars.x; }
export const run = (lines, input) => runPy(lines, { input: [...input], limit: 5000 });
export const varsOf = (input, fix = false) => run(KASIR(fix), input).vars;
export const pajak = (bayar) => evalExpr(`round(${bayar} * 0.11)`);
export const pajakBulat = (bayar) => Math.floor((bayar * 11 + 50) / 100);
const rupiah = (n) => `Rp${n.toLocaleString('id-ID')}`;
const VARS = ['jumlah_buku', 'total', 'dapat_diskon', 'diskon', 'bayar', 'kembalian'];
const TYPES = ['int', 'float', 'str', 'bool'];
// Options "value · type" around the right one.
function vtOpts(v) {
  const t = pyType(v); const s = show(v); const out = new Set([`${s} · ${t}`]);
  if (t === 'int') { out.add(`${s}.0 · float`); out.add(`"${s}" · str`); out.add(`${s} · float`); }
  else if (t === 'float') { out.add(`${s.replace(/\.0$/, '')} · int`); out.add(`${s} · int`); out.add(`"${s}" · str`); }
  else if (t === 'bool') { out.add(`${s === 'True' ? 'False' : 'True'} · bool`); out.add(`"${s}" · str`); out.add(`${s === 'True' ? 1 : 0} · int`); }
  else { out.add(`${s.slice(1, -1)} · int`); out.add(`${s} · int`); out.add(`${s.slice(1, -1)}.0 · float`); }
  return [...out].slice(0, 4);
}

export default {
  id: 'sma-35-python-kasir',
  title: 'Python di Atas Kertas: Kasir Koperasi',
  topic: 'Tipe data Python (int, float, str, bool), operator /, //, %, round, input() yang menghasilkan teks, konversi tipe, dan keluaran berformat rupiah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Tebak hasil dan tipe ekspresi Python, telusuri program kasir koperasi, hitung pecahan kembalian dengan // dan %, temukan bug "2" + "3", lalu hitung pajak dalam rupiah bulat.',
  extraModes: [
    { id: 'jejak', icon: '🔍', label: 'Penelusur Variabel', desc: 'Ketik masukan pembeli lalu jalankan program kasir baris demi baris; panel variabel menampilkan nilai dan tipe. Coba juga program Rudi tanpa int()', create: createTrace },
    { id: 'pajak', icon: '🧮', label: 'Pajak dan Pembulatan', desc: 'Geser nilai bayar: round() dan rumus bilangan bulat berdampingan, nilai yang berbeda disorot', create: createTax },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Keluaran', desc: 'Satu tim memilih masukan pembeli, tim lain menebak nilai dan tipe keluaran print', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act python-kasir' });
    root.append(wrap);
    const VA = varsOf(A); const VB = varsOf(B); const VF = varsOf(B, true);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const exprRow = (src) => { const v = evalExpr(src); return [src, src, vtOpts(v).sort(), `${show(v)} · ${pyType(v)}`]; };
      const varRows = (V) => VARS.map((n) => [n, n, vtOpts(V[n]).sort(), `${show(V[n])} · ${pyType(V[n])}`]);
      const traced = (input, label, V, extraRows = []) => { const tr = pyTracer(KASIR(), { opts: { input: [...input] }, cls: 'pk-jejak', onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: `${label}: nilai · tipe di akhir program`, cls: 'pk-isi', rows: [...varRows(V), ...extraRows], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, `${label}: masukan ${input.join(', ')}`), tr); };
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Tebak hasil dan tipenya (1)', cls: 'pk-isi', rows: EXPR.slice(0, 6).map(exprRow), info: '4500 → 4500 · int sudah diisi.', done: next });
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Tebak hasil dan tipenya (2)', cls: 'pk-isi', rows: [...EXPR.slice(6).map(exprRow), ['beda', 'Beda / dan //', ['/ selalu menghasilkan float; // membuang sisa (seperti DIV)', '/ dan // sama saja', '// selalu menghasilkan float', '/ membulatkan ke atas'], '/ selalu menghasilkan float; // membuang sisa (seperti DIV)', '0.1 + 0.2 tidak tepat 0,3 karena pecahan desimal disimpan dalam bentuk biner.']], done: next });
      else if (r === 2) traced(A, 'Pembeli A (3 buku, 2 pulpen, uang 20000)', VA);
      else if (r === 3) traced(B, 'Pembeli B (5 buku, 3 pulpen, uang 50000)', VB);
      else if (r === 4) { const out = run(KASIR(), B).out; ask('Keluaran program untuk pembeli B', [[out.join(' / '), true], ['Total: 31500 / Diskon: 3150 / Bayar: 28350 / Kembalian: 21650'], ['Total: 31500.0 / Diskon: 3150.0 / Bayar: 28350.0 / Kembalian: 21650.0'], ['Total: 31500 / Diskon: 0 / Bayar: 31500 / Kembalian: 18500']], 1, pyCode(KASIR()),
        then(() => rowsChoose(wrap, ctx, { prompt: 'Mengapa .0, dan bagaimana diskon selalu int?', rows: [['c', 'Pembeli B diakhiri .0 karena', ['total * 0.1 melibatkan float, dan int dengan float selalu menghasilkan float', 'uang 50000 lebih besar', 'print selalu menambah .0', 'jumlah_buku bertipe float'], 'total * 0.1 melibatkan float, dan int dengan float selalu menghasilkan float', 'Untuk pembeli A baris 10 yang dijalankan, dan 0 adalah int.'], ['r', 'Cara dengan round', ['diskon = round(total * 0.1)', 'diskon = int(total) * 0.1', 'diskon = round(total) * 0.1'], 'diskon = round(total * 0.1)'], ['d', 'Cara dengan //', ['diskon = total // 10', 'diskon = total // 0.1', 'diskon = total / 10'], 'diskon = total // 10', `Keduanya menghasilkan ${VF.diskon}.`]], done: next }))); }
      else if (r === 5) { const p = runPy([...KASIR(true), ...PECAHAN], { input: [...B] }); const q = runPy([...KASIR(), ...PECAHAN], { input: [...B] }); const v = p.vars;
        wrap.append(pyCode(PECAHAN)); rowsChoose(wrap, ctx, { prompt: 'Pecahan kembalian pembeli B (baris 8 sudah diperbaiki)', cls: 'pk-isi', rows: [['k', 'kembalian · lembar_10000 · lembar_1000', [`${v.kembalian} · ${v.lembar_10000} · ${v.lembar_1000}`, `${v.kembalian} · 2 · 2`, `21650.0 · 2 · 1`, `${v.kembalian} · 21 · 6`], `${v.kembalian} · ${v.lembar_10000} · ${v.lembar_1000}`], ['c', 'koin_500 · koin_100 · sisa', [`${v.koin_500} · ${v.koin_100} · ${v.sisa}`, '1 · 1 · 0', '0 · 6 · 50', '1 · 2 · 0'], `${v.koin_500} · ${v.koin_100} · ${v.sisa}`], ['b', 'Koperasi tidak punya koin 50', ['pembeli B menerima kembalian kurang Rp50; misalnya bulatkan bayar ke ratusan terdekat', 'tidak ada masalah', 'program galat'], 'pembeli B menerima kembalian kurang Rp50; misalnya bulatkan bayar ke ratusan terdekat'], ['f', 'Bila baris 8 belum diperbaiki, baris 26 menampilkan', [q.out.at(-1), '2 1 1 1 50', '2.0 1 1 1 50', '21650.0'], q.out.at(-1), '// dan % pada float menghasilkan float.']], done: next }); }
      else if (r === 6) { const tr = pyTracer(RUDI, { opts: { input: ['2', '3'] }, cls: 'pk-jejak', hideVars: ['total'], extra: (st) => (typeof st.vars.total === 'string' ? el('p', { class: 'pk-panjang' }, `total: teks "${st.vars.total.slice(0, 6)}…${st.vars.total.slice(-6)}", panjang ${st.vars.total.length.toLocaleString('id-ID')} karakter`) : null),
        onEnd: (st) => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Program Rudi tanpa int(): pembeli mengetik 2 dan 3', rows: [['a', 'Baris 6 menampilkan · tipe banyak', ['Banyak barang: 23 · str', 'Banyak barang: 5 · int', 'Banyak barang: 23 · int', 'Banyak barang: 2 3 · str'], `${run(RUDI, ['2', '3']).out[0]} · ${pyType(st.vars.banyak)}`], ['b', 'Isi total setelah baris 7', ['teks "222…2333…3" sepanjang 7.500 karakter', 'bilangan 18000', 'teks "18000"', 'galat'], `teks "222…2333…3" sepanjang ${st.vars.total.length.toLocaleString('id-ID')} karakter`], ['c', st.error ? `${st.error.type}: ${st.error.message}` : '', ['Python tidak bisa membandingkan teks dengan bilangan memakai >=', 'total terlalu besar', '25000 harus ditulis 25.000', 'variabel total belum dibuat'], 'Python tidak bisa membandingkan teks dengan bilangan memakai >=', 'Pesan galat menyebut operatornya dan kedua tipe yang bermasalah.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Rudi: lupa int() di baris 3 dan 4'), tr); }
      else if (r === 7) { const e1 = runPy(['jumlah_buku = int(input("Jumlah buku: "))'], { input: ['2.5'] }).error; const e2 = runPy(['jumlah_buku = int(input("Jumlah buku: "))'], { input: ['dua'] }).error;
        ask('Setelah int() ditambahkan lagi, pembeli mengetik 2.5 atau dua. Apa yang terjadi?', [[`Program berhenti dengan ${e1.text} (atau '${'dua'}'), karena teks itu tidak bisa diubah menjadi bilangan bulat`, true], ['jumlah_buku menjadi 2'], ['jumlah_buku menjadi 2.5 bertipe float'], ['jumlah_buku menjadi 0']], 1, el('pre', { class: 'pk-galat' }, `>>> int("2.5")\n${e1.text}\n>>> int("dua")\n${e2.text}`)); }
      else if (r === 8) { const bayar = VF.bayar; const x = evalExpr(`${bayar} * 0.11`); const pj = pajak(bayar);
        rowsChoose(wrap, ctx, { prompt: `Pajak 11% dari bayar (pembeli B, bayar = ${bayar})`, cls: 'pk-isi', rows: [['27', 'Baris 27: pajak =', ['round(bayar * 0.11)', 'bayar * 0.11', 'round(bayar) * 0.11', 'bayar // 0.11'], 'round(bayar * 0.11)'], ['28', 'Baris 28: total_akhir =', ['bayar + pajak', 'bayar * pajak', 'pajak', 'total + pajak'], 'bayar + pajak'], ['29', 'Baris 29: .replace(…, …)', ['",", "."', '".", ","', '"Rp", ""', '",", ""'], '",", "."', `Keluarannya Total akhir: ${rupiah(bayar + pj)}.`], ['x', 'bayar * 0.11', [pyRepr(x), '3119', '3118', '3118.0'], pyRepr(x)], ['g', `round(${pyRepr(x)}) = ${pj} dan round(2381.5) = ${evalExpr('round(2381.5)')}. Aturannya`, ['angka tepat .5 dibulatkan ke bilangan bulat genap terdekat', '.5 selalu dibulatkan ke atas', '.5 selalu dibulatkan ke bawah', 'acak'], 'angka tepat .5 dibulatkan ke bilangan bulat genap terdekat', 'Disebut juga pembulatan bankir.']], done: next }); }
      else { const xs = [28250, 28350, 19550, 19650]; const a = xs.map((x) => evalExpr(`round(${x}, -2)`)); const b = xs.map((x) => evalExpr(`(${x} + 50) // 100 * 100`));
        rowsChoose(wrap, ctx, { prompt: 'Pajak dengan bilangan bulat, dan tantangan pembulatan ratusan', rows: [['c', 'Pajak hanya dengan bilangan bulat, .5 ke atas', ['pajak = (bayar * 11 + 50) // 100', 'pajak = bayar * 11 // 100', 'pajak = (bayar + 50) * 11 // 100', 'pajak = round(bayar * 11 / 100)'], 'pajak = (bayar * 11 + 50) // 100', `Untuk pembeli B: ${pajakBulat(VF.bayar)}, total akhir ${rupiah(VF.bayar + pajakBulat(VF.bayar))}.`], ['r', 'round(x, -2) untuk 28250 · 28350 · 19550 · 19650', [a.join(' · '), b.join(' · '), '28300 · 28400 · 19600 · 19600'], a.join(' · ')], ['f', '(x + 50) // 100 * 100', [b.join(' · '), a.join(' · '), '28200 · 28300 · 19500 · 19600'], b.join(' · ')], ['s', 'Rumus yang sesuai pembulatan di sekolah (50 ke atas)', ['(x + 50) // 100 * 100', 'round(x, -2)', 'keduanya sama'], '(x + 50) // 100 * 100', 'round membulatkan ke ratusan yang genap bila tepat 50.']], done: next }); }
    }
    render();
  },
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act python-kasir' });
  root.append(wrap);
  const inp = ['5', '3', '50000']; let ver = 'asli'; let tr = null;
  const draw = () => {
    tr?.stop();
    const lines = ver === 'asli' ? KASIR() : ver === 'fix' ? [...KASIR(true), ...PECAHAN] : RUDI;
    tr = pyTracer(lines, { opts: () => ({ input: ver === 'rudi' ? inp.slice(0, 2) : [...inp] }), cls: 'pk-jejak', hideVars: ver === 'rudi' ? ['total'] : [], extra: (st) => (typeof st.vars.total === 'string' ? el('p', { class: 'pk-panjang' }, `total: teks panjang ${st.vars.total.length.toLocaleString('id-ID')} karakter`) : null) });
    const field = (i, label) => { const e = el('input', { type: 'text', value: inp[i], maxlength: '8', inputmode: 'decimal', 'aria-label': label }); e.addEventListener('change', () => { inp[i] = e.value.trim().slice(0, 8); draw(); }); return el('label', { class: 'pk-input' }, el('small', null, label), e); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur variabel'),
      el('div', { class: 'pk-atur' }, field(0, 'Jumlah buku'), field(1, 'Jumlah pulpen'), ver === 'rudi' ? null : field(2, 'Uang pembeli'),
        el('div', { class: 'seg' }, [['asli', 'program kasir'], ['fix', 'baris 8: total // 10, dengan pecahan uang'], ['rudi', 'Rudi: tanpa int()']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); })))), tr);
  };
  draw();
}

function createTax(root, ctx) {
  const wrap = el('div', { class: 'act python-kasir' });
  root.append(wrap);
  let bayar = 28350;
  const draw = () => {
    const x = evalExpr(`${bayar} * 0.11`); const a = pajak(bayar); const b = pajakBulat(bayar); const ra = evalExpr(`round(${bayar}, -2)`); const rb = evalExpr(`(${bayar} + 50) // 100 * 100`);
    const s = el('input', { type: 'range', min: '1000', max: '60000', step: '50', value: String(bayar), 'aria-label': 'bayar' });
    s.addEventListener('input', () => { bayar = Number(s.value); draw(); });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pajak dan pembulatan'), el('label', { class: 'pk-geser' }, el('small', null, `bayar = ${bayar}`), s),
      el('div', { class: 'pk-banding' },
        el('div', null, el('small', null, 'bayar * 0.11'), el('b', null, pyRepr(x))),
        el('div', { class: a !== b ? 'beda' : '' }, el('small', null, 'round(bayar * 0.11)'), el('b', null, String(a))),
        el('div', { class: a !== b ? 'beda' : '' }, el('small', null, '(bayar * 11 + 50) // 100'), el('b', null, String(b))),
        el('div', { class: ra !== rb ? 'beda' : '' }, el('small', null, 'round(bayar, -2)'), el('b', null, String(ra))),
        el('div', { class: ra !== rb ? 'beda' : '' }, el('small', null, '(bayar + 50) // 100 * 100'), el('b', null, String(rb)))),
      el('p', { class: 'pk-ket' }, `Total akhir dengan round: ${rupiah(bayar + a)} · dengan bilangan bulat: ${rupiah(bayar + b)}. Coba 28350, 21650, 28250, dan 19650.`),
      el('div', { class: 'pk-atur' }, [28350, 21650, 28250, 19650].map((v) => button(String(v), () => { bayar = v; draw(); }))));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act python-kasir' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let turn = 0; const total = Math.max(4, nT * 2);
    function step() {
      if (turn >= total) { finishBoard(wrap, ctx, { title: 'Tebak keluaran selesai', pts, again: () => pickTeams(wrap, 'Tebak Keluaran', start) }); return; }
      const maker = turn % nT; const guesser = (turn + 1) % nT; const inp = [3, 2, 50000];
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1} memilih masukan pembeli.`); const body = el('div');
      const make = () => body.replaceChildren(el('div', { class: 'pk-atur' }, stepper(inp[0], (v) => { inp[0] = v; }, { min: 0, max: 9, label: 'buku' }), stepper(inp[1], (v) => { inp[1] = v; }, { min: 0, max: 9, label: 'pulpen' }),
        el('div', { class: 'seg' }, [20000, 50000, 100000].map((u) => onTap(el('button', { class: `seg-btn ${inp[2] === u ? 'on' : ''}`, type: 'button' }, String(u)), () => { inp[2] = u; make(); })))), button('Masukan siap', guess, 'primary'));
      function guess() {
        const V = varsOf(inp.map(String)); let k = 0; let got = 0; const keys = ['diskon', 'kembalian'];
        say(msg, '', `Tim ${guesser + 1}: tebak nilai dan tipe ${keys.join(' dan ')} untuk ${inp[0]} buku, ${inp[1]} pulpen, uang ${inp[2]}.`);
        const ask1 = () => { if (k >= keys.length) return reveal(); const n = keys[k]; const right = `${show(V[n])} · ${pyType(V[n])}`;
          body.replaceChildren(pyCode(KASIR(), { cls: 'pk-kecil' }), el('p', { class: 'prompt' }, n), el('div', { class: 'seg pk-tebak' }, vtOpts(V[n]).sort().map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { if (o === right) { got++; ctx.sound.good(); } else ctx.sound.bad(); k++; ask1(); })))); };
        const reveal = () => { pts[guesser] += got; const out = run(KASIR(), inp.map(String)).out; body.replaceChildren(el('pre', { class: 'pk-keluaran' }, out.join('\n'))); say(msg, got === 2 ? '' : 'bad', `Tim ${guesser + 1} benar ${got} dari 2 (+${got}).`); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); turn++; setTimeout(step, 5200); };
        ask1();
      }
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Putaran ${turn + 1}`), body, msg);
      make();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Keluaran', start);
}
