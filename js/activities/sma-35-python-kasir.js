// Python di Atas Kertas: Kasir Koperasi — SMA/SMK (16–18 tahun), coding.
// Python 3 data types: int, float, str, bool; / always gives a float, // and
// %, round() rounding half to even, input() giving text, Rudi's "2" + "3"
// bug and the TypeError, change in notes and coins, and tax in whole rupiah.

import { el, onTap, button, shake } from '../core/util.js';
import { misiHead, valueCard, fill } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, pyCode, stepper } from './smp-kit.js';
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
    const wrap = el('div', { class: 'act python-kasir jp-main' });
    root.append(wrap);
    // Seeded variants (same in every race pane): a customer near the 25000 discount line, and a change amount.
    const near = ctx.rand.shuffle([[2, 5], [3, 4], [4, 2], [5, 1], [1, 7], [3, 3], [2, 6], [4, 3]]);
    const V1 = near[0]; const V2 = near[1];
    const uangFor = ([b, p]) => (4500 * b + 3000 * p > 25000 ? 50000 : 30000);
    const laciK = ctx.rand.int(21, 999) * 50;
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3000) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (no, judul, tujuan) => wrap.append(misiHead(no, judul, tujuan, '🧾'));
      if (r === 0 || r === 1) {
        head(1, 'Mesin Tipe', 'Ekspresi masuk ke mesin Python. Ketuk kartu hasil yang tepat: nilainya dan warna tipenya (biru int, hijau float, kuning str, merah bool).');
        typeMachine(wrap, ctx, r === 0 ? EXPR.slice(0, 6) : EXPR.slice(6), () => next());
      } else if (r === 2 || r === 3 || r === 7 || r === 9) {
        const [b, p, u] = r === 2 ? [3, 2, 20000] : r === 3 ? [5, 3, 50000] : r === 7 ? [...V1, uangFor(V1)] : [...V2, uangFor(V2)];
        head(2, 'Layani Pembeli', `Kalian adalah komputer kasir. Pembeli membeli ${b} buku dan ${p} pulpen, membayar dengan ${rupiah(u)}. Jalankan program baris demi baris: taruh kartu nilai di kotak variabel.`);
        serveCustomer(wrap, ctx, b, p, u, () => next(3600));
      } else if (r === 4 || r === 8) {
        const K = r === 4 ? 21650 : laciK;
        head(3, 'Laci Kembalian', `Kembalian ${rupiah(K)}. Ambil uang dari laci dengan // dan %: lembar terbesar dulu, sebanyak mungkin, lalu hitung sisanya.`);
        changeDrawer(wrap, ctx, K, () => next(3600));
      } else if (r === 5) {
        head(4, 'Sabotase Rudi', 'Rudi menghapus int() dari baris masukan. Pembeli mengetik 2 dan 3. Jadilah komputernya dan ramalkan apa yang terjadi.');
        playMachine(wrap, ctx, rudiSteps(), () => next(4200));
      } else {
        head(5, 'Pajak dan Struk', 'Koperasi menambah pajak 11% (angka contoh) pada bayar = 28350. Jalankan programnya: hati-hati dengan round() dan pembulatan ke genap.');
        playMachine(wrap, ctx, taxSteps(), () => next(4200));
      }
    }
    render();
  },
};

const rupiahPy = (v) => (pyType(v) === 'float' ? pyRepr(v) : String(v));
// A card is {text, kind}; kind is a Python type name, 'err', or 'out' (screen text).
const cardOf = (v) => ({ text: show(v), kind: pyType(v) });
function wrongCards(v) {
  const t = pyType(v); const s = show(v);
  if (t === 'int') return [{ text: `${s}.0`, kind: 'float' }, { text: `"${s}"`, kind: 'str' }, { text: String(v + (v % 2 ? -1 : 1)), kind: 'int' }];
  if (t === 'bool') return [{ text: s === 'True' ? 'False' : 'True', kind: 'bool' }, { text: `"${s}"`, kind: 'str' }, { text: s === 'True' ? '1' : '0', kind: 'int' }];
  if (t === 'float') {
    if (s.endsWith('.0')) { const n = s.slice(0, -2); return [{ text: n, kind: 'int' }, { text: `"${s}"`, kind: 'str' }, { text: n, kind: 'float' }]; }
    if (s.length > 8) return [{ text: '0.3', kind: 'float' }, { text: '"0.3"', kind: 'str' }, { text: '0', kind: 'int' }];
    const x = Number(s); return [{ text: String(Math.floor(x)), kind: 'int' }, { text: String(Math.ceil(x)), kind: 'int' }, { text: `"${s}"`, kind: 'str' }];
  }
  const inner = s.slice(1, -1);
  if (/^\d+$/.test(inner)) return [{ text: inner, kind: 'int' }, { text: `${inner}.0`, kind: 'float' }, { text: String([...inner].reduce((a, c) => a + Number(c), 0)), kind: inner.length > 1 && inner.length < 3 ? 'int' : 'str' }];
  return [{ text: inner, kind: 'int' }, { text: `${inner}.0`, kind: 'float' }, { text: `'${inner}'`, kind: 'err' }];
}
const KIND = { int: 'int', float: 'float', str: 'str', bool: 'bool', err: 'galat', out: 'layar' };

// Expressions roll in one by one; tap the result card.
function typeMachine(host, ctx, exprs, done) {
  let k = 0; const made = [];
  const msg = el('p', { class: 'reveal hint' }, 'Kartu yang sama nilainya tetapi beda warna adalah tipe yang berbeda.');
  const machine = el('div', { class: 'jp-mesin' }); const belt = el('div', { class: 'jp-sabuk' }); const tray = el('div', { class: 'jp-baki' });
  function draw() {
    const src = exprs[k]; const v = evalExpr(src); const right = cardOf(v);
    fill(machine, el('small', null, `ekspresi ${k + 1} dari ${exprs.length}`), el('code', null, src), el('span', { class: 'jp-panah' }, '⟶ ?'));
    fill(belt, ...made.map(([s, c]) => el('div', { class: 'jp-jadi' }, el('code', null, s), valueCard(c.text, c.kind, { disabled: true, tabindex: '-1' }))));
    const opts = ctx.rand.shuffle([right, ...wrongCards(v)]);
    fill(tray, ...opts.map((c) => onTap(valueCard(c.text, c.kind), () => {
      if (c.text !== right.text || c.kind !== right.kind) { ctx.mistake(); shake(tray); say(msg, 'bad', c.text === right.text ? `Nilainya benar, tetapi tipenya ${KIND[right.kind]}, bukan ${KIND[c.kind]}.` : `${src} bukan ${c.text}. ${hintFor(src)}`); return; }
      ctx.sound.good(); made.push([src, right]); k++; msg.className = 'reveal hint';
      if (k === exprs.length) { draw2(); say(msg, '', 'Semua ekspresi selesai! / selalu float, // dan % tetap int untuk int, round() membulatkan .5 ke genap, dan + pada teks menyambung.'); done(); return; }
      draw();
    })));
  }
  const draw2 = () => { fill(machine, el('code', null, '✓')); fill(tray, ); fill(belt, ...made.map(([s, c]) => el('div', { class: 'jp-jadi' }, el('code', null, s), valueCard(c.text, c.kind, { disabled: true, tabindex: '-1' })))); };
  draw();
  host.append(el('div', { class: 'jp-dua' }, el('div', { class: 'jp-kiri' }, machine, tray), belt), msg);
}
function hintFor(src) {
  if (src.includes('//')) return '// membuang sisa pembagian.';
  if (src.includes('/')) return '/ selalu menghasilkan float.';
  if (src.includes('%')) return '% memberi sisa pembagian.';
  if (src.startsWith('round')) return 'round() membulatkan .5 ke bilangan genap terdekat.';
  if (src.includes('"') && src.includes('+') && !src.includes('int(')) return '+ pada dua teks menyambungkannya.';
  if (src.includes('>=')) return 'Perbandingan menghasilkan True atau False.';
  if (src.includes('0.1')) return 'Float disimpan dalam biner, jadi 0,1 tidak tepat.';
  return 'Perhatikan tanda petik dan titik desimal.';
}

// The cashier computer: code on the left, memory boxes and screen on the right.
// steps: [{line, box, value: card, opts: [cards], why}]; box '?' = condition, 'layar' = print.
function playMachine(host, ctx, { lines, given, boxes, steps }, done) {
  const mem = Object.fromEntries(boxes.map((b) => [b, null])); for (const [n, c] of given) mem[n] = c;
  let k = 0; let cond = null; const screen = [];
  const msg = el('p', { class: 'reveal hint' }, 'Penunjuk baris ada di baris kuning. Ketuk kartu nilai untuk baris itu.');
  const left = el('div', { class: 'jp-kode' }); const right = el('div', { class: 'jp-memori' }); const tray = el('div', { class: 'jp-baki' });
  function draw() {
    const st = steps[k];
    fill(left, pyCode(lines, { hl: st ? [st.line] : [], warn: st?.warn ? [st.line] : [] }), cond ? el('div', { class: 'jp-kondisi' }, el('small', null, 'kondisi'), valueCard(cond.text, cond.kind, { disabled: true, tabindex: '-1' })) : null);
    fill(right, el('div', { class: 'jp-kotak-kotak' }, boxes.map((b) => el('div', { class: `jp-kotak ${st && st.box === b ? 'sasaran' : ''}` }, el('small', null, b), mem[b] ? valueCard(mem[b].text, mem[b].kind, { disabled: true, tabindex: '-1' }) : el('i', null, '…')))),
      el('div', { class: 'jp-layar' }, el('small', null, '🖥️ layar'), screen.length ? screen.map((s) => el('div', null, s)) : el('i', null, ' ')));
    fill(tray, ...(st ? ctx.rand.shuffle([st.value, ...st.opts]).map((c) => onTap(valueCard(c.text, c.kind), () => pick(c))) : []));
  }
  function pick(c) {
    const st = steps[k];
    if (c.text !== st.value.text || c.kind !== st.value.kind) { ctx.mistake(); shake(tray); say(msg, 'bad', st.bad ? st.bad(c) : c.text === st.value.text ? `Nilainya benar, tetapi tipenya bukan ${KIND[c.kind]}.` : `Bukan ${c.text}. Hitung lagi baris ${st.line + 1}.`); return; }
    ctx.sound.tap();
    if (st.box === '?') cond = c; else if (st.box === 'layar') screen.push(c.text); else mem[st.box] = c;
    if (st.why) say(msg, st.value.kind === 'err' ? 'bad' : '', st.why); else msg.className = 'reveal hint';
    k++;
    draw();
    if (k === steps.length) { ctx.sound.good(); done(); }
  }
  draw();
  host.append(el('div', { class: 'jp-dua' }, left, el('div', { class: 'jp-kanan' }, right, tray)), msg);
}

const LAYANI = ['total = 4500*buku + 3000*pulpen', 'if total >= 25000:', '    diskon = total * 0.1', 'else:', '    diskon = 0', 'bayar = total - diskon', 'kembali = uang - bayar', 'print("Kembalian:", kembali)'];
function serveCustomer(host, ctx, b, p, u, done) {
  const V = runPy([`buku = ${b}`, `pulpen = ${p}`, `uang = ${u}`, ...LAYANI]).vars;
  const c = evalExpr(`${V.total} >= 25000`);
  const outText = `Kembalian: ${rupiahPy(V.kembali)}`;
  const alt = rupiahPy(V.kembali).endsWith('.0') ? rupiahPy(V.kembali).slice(0, -2) : `${rupiahPy(V.kembali)}.0`;
  const steps = [
    { line: 0, box: 'total', value: cardOf(V.total), opts: wrongCards(V.total) },
    { line: 1, box: '?', value: cardOf(c), opts: wrongCards(c), why: c ? 'True: penunjuk melompat ke baris 3.' : 'False: penunjuk melompat ke baris 5 (else).' },
    { line: c ? 2 : 4, box: 'diskon', value: cardOf(V.diskon), opts: wrongCards(V.diskon), why: c ? 'int dikali float menghasilkan float: kartu hijau muncul.' : '' },
    { line: 5, box: 'bayar', value: cardOf(V.bayar), opts: wrongCards(V.bayar), why: c ? 'Warna hijau menular: int dikurangi float menjadi float.' : '' },
    { line: 6, box: 'kembali', value: cardOf(V.kembali), opts: wrongCards(V.kembali) },
    { line: 7, box: 'layar', value: { text: outText, kind: 'out' }, opts: [{ text: `Kembalian: ${alt}`, kind: 'out' }, { text: `Kembalian:${rupiahPy(V.kembali)}`, kind: 'out' }, { text: `("Kembalian:", ${rupiahPy(V.kembali)})`, kind: 'out' }], why: `Layar: ${outText}. print memberi satu spasi di antara nilai.` },
  ];
  playMachine(host, ctx, { lines: LAYANI, given: [['buku', cardOf(b)], ['pulpen', cardOf(p)], ['uang', cardOf(u)]], boxes: ['buku', 'pulpen', 'uang', 'total', 'diskon', 'bayar', 'kembali'], steps }, done);
}
function rudiSteps() {
  const lines = ['harga_buku = 4500', 'harga_pulpen = 3000', 'jumlah_buku = input("Jumlah buku: ")', 'jumlah_pulpen = input("Jumlah pulpen: ")', 'banyak = jumlah_buku + jumlah_pulpen', 'print("Banyak barang:", banyak)', 'total = harga_buku * jumlah_buku + ...', 'dapat_diskon = total >= 25000'];
  const s = (t) => ({ text: t, kind: 'str' });
  return { lines, given: [['harga_buku', cardOf(4500)], ['harga_pulpen', cardOf(3000)]], boxes: ['harga_buku', 'harga_pulpen', 'jumlah_buku', 'jumlah_pulpen', 'banyak', 'total'], steps: [
    { line: 2, box: 'jumlah_buku', value: s('"2"'), opts: [{ text: '2', kind: 'int' }, { text: '2.0', kind: 'float' }, s('"jumlah_buku"')], why: 'input() selalu memberi teks: kartu kuning "2".' },
    { line: 3, box: 'jumlah_pulpen', value: s('"3"'), opts: [{ text: '3', kind: 'int' }, { text: '3.0', kind: 'float' }, s('"Jumlah pulpen: "')] },
    { line: 4, box: 'banyak', value: s('"23"'), opts: [{ text: '5', kind: 'int' }, s('"5"'), { text: '23', kind: 'int' }], why: '+ pada dua teks menyambung: "2" + "3" = "23".' },
    { line: 5, box: 'layar', value: { text: 'Banyak barang: 23', kind: 'out' }, opts: [{ text: 'Banyak barang: 5', kind: 'out' }, { text: 'Banyak barang: "23"', kind: 'out' }, { text: 'Banyak barang: 2 3', kind: 'out' }], why: 'Pembeli bingung: dua barang ditulis 23!' },
    { line: 6, box: 'total', value: s('teks 7.500 karakter'), opts: [{ text: '18000', kind: 'int' }, { text: '💥 TypeError', kind: 'err' }, s('"45003000"')], why: '4500 * "2" mengulang teks "2" sebanyak 4500 kali. total menjadi teks sepanjang 7.500 karakter.' },
    { line: 7, box: '?', warn: true, value: { text: '💥 TypeError', kind: 'err' }, opts: [{ text: 'True', kind: 'bool' }, { text: 'False', kind: 'bool' }, s('"True"')], why: 'Komputer macet: teks tidak bisa dibandingkan dengan bilangan (TypeError). Perbaikannya: int(input(...)).' },
  ] };
}
function taxSteps() {
  const lines = ['bayar = 28350', 'pajak = round(bayar * 0.11)', 'bulat = (bayar * 11 + 50) // 100', 'total_akhir = bayar + pajak', 'print("Total akhir:", total_akhir)'];
  const i = (n) => ({ text: String(n), kind: 'int' });
  return { lines, given: [['bayar', i(28350)]], boxes: ['bayar', 'pajak', 'bulat', 'total_akhir'], steps: [
    { line: 1, box: 'pajak', value: i(3118), opts: [i(3119), { text: '3118.5', kind: 'float' }, { text: '"3118"', kind: 'str' }], bad: (c) => (c.text === '3119' ? 'bayar * 0.11 = 3118.5, dan round() membulatkan .5 ke genap: 3118.' : 'round() memberi int.'), why: 'bayar * 0.11 = 3118.5, dan round() membulatkan .5 ke bilangan genap: 3118.' },
    { line: 2, box: 'bulat', value: i(3119), opts: [i(3118), { text: '3119.0', kind: 'float' }, { text: '3118.5', kind: 'float' }], why: 'Rumus bilangan bulat selalu membulatkan .5 ke atas: 3119. Tanpa float, tanpa kejutan.' },
    { line: 3, box: 'total_akhir', value: i(31468), opts: [i(31469), { text: '31468.0', kind: 'float' }, { text: '"283503118"', kind: 'str' }] },
    { line: 4, box: 'layar', value: { text: 'Total akhir: 31468', kind: 'out' }, opts: [{ text: 'Total akhir: 31469', kind: 'out' }, { text: 'Total akhir:31468', kind: 'out' }, { text: 'Total akhir: Rp31.468', kind: 'out' }], why: 'Di struk ditulis Rp31.468. Untuk uang, rumus bilangan bulat lebih aman daripada round() pada float.' },
  ] };
}

// The change drawer: take notes for the current line, as many as fit, then compute the remainder.
function changeDrawer(host, ctx, K, done) {
  const lines = ['lembar_10000 = kembali // 10000', 'sisa = kembali % 10000', 'lembar_1000 = sisa // 1000', 'sisa = sisa % 1000', 'koin_500 = sisa // 500', 'sisa = sisa % 500', 'koin_100 = sisa // 100', 'sisa = sisa % 100'];
  const P = [10000, 1000, 500, 100]; const NAMA = ['lembar_10000', 'lembar_1000', 'koin_500', 'koin_100'];
  let d = 0; let sisa = K; let n = 0; const got = []; let fin = false;
  const msg = el('p', { class: 'reveal hint' }, `Baris 1: ambil lembar 10.000 sebanyak mungkin (${K} // 10000), lalu ketuk Hitung sisa.`);
  const left = el('div', { class: 'jp-kode' }); const right = el('div', { class: 'jp-memori' });
  const note = (p, extra = {}) => el('button', { type: 'button', class: `jp-uang u${p}`, ...extra }, p >= 1000 ? `${p / 1000}.000` : String(p));
  function draw() {
    fill(left, pyCode(lines, { hl: fin ? [] : [d * 2] }));
    fill(right, 
      el('div', { class: 'jp-kotak-kotak' }, el('div', { class: 'jp-kotak' }, el('small', null, 'kembali'), valueCard(String(K), 'int', { disabled: true, tabindex: '-1' })), el('div', { class: 'jp-kotak sasaran' }, el('small', null, 'sisa'), valueCard(String(sisa), 'int', { disabled: true, tabindex: '-1' })),
        ...NAMA.map((nm, i) => el('div', { class: 'jp-kotak' }, el('small', null, nm), i < got.length ? valueCard(String(got[i]), 'int', { disabled: true, tabindex: '-1' }) : i === d && !fin ? el('b', null, String(n)) : el('i', null, '…')))),
      el('div', { class: 'jp-laci' }, el('small', null, '🗄️ laci'), P.map((p, i) => onTap(note(p), () => take(i)))),
      el('div', { class: 'jp-tangan' }, el('small', null, '✋ untuk pembeli'), ...got.flatMap((c, i) => Array.from({ length: c }, () => note(P[i], { disabled: true, tabindex: '-1' }))), ...Array.from({ length: fin ? 0 : n }, () => note(P[d], { disabled: true, tabindex: '-1' }))),
      fin ? null : button('Hitung sisa (%) ➜', settle, 'primary'));
  }
  function take(i) {
    if (fin) return;
    if (i !== d) { ctx.mistake(); shake(right); say(msg, 'bad', `Penunjuk ada di baris ${d * 2 + 1}: ${NAMA[d]}. ${i < d ? 'Pecahan itu sudah selesai.' : 'Ambil pecahan yang lebih besar dulu.'}`); return; }
    if ((n + 1) * P[d] > sisa) { ctx.mistake(); shake(right); say(msg, 'bad', `Sisa ${sisa} tidak cukup untuk satu ${P[d]} lagi. ${sisa} // ${P[d]} = ${n}.`); return; }
    n++; ctx.sound.tap(); draw();
  }
  function settle() {
    const want = Math.floor(sisa / P[d]);
    if (n < want) { ctx.mistake(); shake(right); say(msg, 'bad', `Masih cukup untuk ${P[d]} lagi: // mengambil sebanyak mungkin.`); return; }
    got.push(n); sisa %= P[d]; n = 0; d++; ctx.sound.good();
    if (d === P.length) { fin = true; draw(); say(msg, sisa ? 'hint' : '', `Kembalian ${K}: ${got.map((c, i) => `${c} × ${P[i]}`).join(', ')}${sisa ? `, sisa ${sisa}: koperasi tidak punya koin ${sisa}, jadi pembeli perlu diberi tahu` : ''}.`); done(); return; }
    say(msg, 'hint', `sisa = ${sisa}. Baris ${d * 2 + 1}: ambil ${P[d] >= 1000 ? 'lembar' : 'koin'} ${P[d]} sebanyak mungkin.`); draw();
  }
  draw();
  host.append(el('div', { class: 'jp-dua' }, left, right), msg);
}

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
