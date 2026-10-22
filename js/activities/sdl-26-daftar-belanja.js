// Daftar Belanja ke Pasar — SD Lanjut (10–12 tahun), daftar (list).
// A shopping list gains and loses items; later items move up one number when
// one is removed. Loops walk the list with UNTUK SETIAP or with a counter, and
// items a loop never looked at are marked when the program ends.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('id-ID') : n);
export const PRICE = {
  beras: 14000, telur: 15000, 'minyak goreng': 18000, 'bawang merah': 10000,
  cabai: 5000, tempe: 6000, garam: 3000, kangkung: 4000,
};
const ITEMS = Object.keys(PRICE);
const ICON = { beras: '🍚', telur: '🥚', 'minyak goreng': '🫗', 'bawang merah': '🧅', cabai: '🌶️', tempe: '🟫', garam: '🧂', kangkung: '🥬' };

// Statements. Expressions: a number, 'barang', { ke: n } (barang ke-n),
// { harga: name } (price of the item held in that name) or { hargaKe: 'urutan' }.
const B = () => ({ op: 'buat' });
const A = (x) => ({ op: 'tambahkan', x });
const H = (x) => ({ op: 'hapus', x });
const SET = (v, e) => ({ op: 'atur', v, e });
const INC = (v, e) => ({ op: 'tambah', v, e });
const EACH = (...body) => ({ op: 'setiap', body });
const RANGE = (from, to, ...body) => ({ op: 'urutan', from, to, body });
const IF = (l, cmp, r, ...body) => ({ op: 'jika', l, cmp, r, body });

const CMP = { '<': (a, b) => a < b, '>': (a, b) => a > b, '=': (a, b) => a === b };

// Runs a program on a starting list. Every statement makes a step that keeps
// the list and the boxes; `at` is the list number (from 0) being looked at.
export function runList(prog, start = null) {
  let list = start ? [...start] : null;
  const vars = {};
  const steps = [];
  const seen = new Set();
  let error = null;
  const need = () => { if (!list) error = 'Daftar belanja belum dibuat. Pakai BUAT DAFTAR dulu.'; return !error; };
  const value = (e, env) => {
    if (typeof e === 'number') return e;
    if (e === 'barang') return env.barang;
    if (e.ke !== undefined) {
      if (!need()) return null;
      if (e.ke < 1 || e.ke > list.length) { error = `Tidak ada barang ke-${e.ke}. Panjang daftar ${list.length}.`; return null; }
      return list[e.ke - 1];
    }
    if (e.harga) return PRICE[e.harga === 'barang' ? env.barang : vars[e.harga]];
    if (e.hargaKe) {
      const n = vars[e.hargaKe];
      if (n < 1 || n > list.length) { error = `Tidak ada barang ke-${n}. Panjang daftar ${list.length}.`; return null; }
      seen.add(n - 1);
      return PRICE[list[n - 1]];
    }
    return null;
  };
  const push = (path, extra = {}) => steps.push({ path, list: list ? [...list] : null, vars: { ...vars }, ...extra });
  const exec = (items, path, env) => {
    for (let i = 0; i < items.length && !error; i++) {
      const s = items[i];
      const p = [...path, i];
      if (steps.length > 300) { error = 'Program terlalu panjang, jadi dihentikan.'; return; }
      if (s.op === 'buat') { list = []; push(p, { ev: 'buat' }); }
      else if (s.op === 'tambahkan') { if (!need()) break; list.push(s.x); push(p, { ev: 'add' }); }
      else if (s.op === 'hapus') {
        if (!need()) break;
        const k = list.indexOf(s.x);
        if (k < 0) { error = `"${s.x}" tidak ada di daftar, jadi tidak bisa dihapus.`; push(p, { error }); break; }
        list.splice(k, 1); push(p, { ev: 'del', i: k });
      } else if (s.op === 'atur' || s.op === 'tambah') {
        const val = value(s.e, env);
        if (error) { push(p, { error }); break; }
        if (s.op === 'tambah' && !(s.v in vars)) { error = `Kotak ${s.v} belum diisi. Pakai ATUR dulu.`; push(p, { error }); break; }
        const old = vars[s.v];
        vars[s.v] = s.op === 'atur' ? val : old + val;
        push(p, { v: s.v, old, at: env.at });
      } else if (s.op === 'setiap') {
        if (!need()) break;
        for (let k = 0; k < list.length && !error; k++) {
          seen.add(k);
          vars.barang = list[k];
          push(p, { at: k, turn: k + 1 });
          exec(s.body, p, { barang: list[k], at: k });
        }
        delete vars.barang;
      } else if (s.op === 'urutan') {
        if (!need()) break;
        const to = s.to === 'P' ? list.length : s.to === 'P-1' ? list.length - 1 : s.to;
        for (let n = s.from; n <= to && !error; n++) {
          vars.urutan = n;
          push(p, { at: n - 1, turn: n - s.from + 1 });
          exec(s.body, p, { at: n - 1 });
        }
      } else if (s.op === 'jika') {
        const a = value(s.l, env), b = value(s.r, env);
        if (error) { push(p, { error }); break; }
        const ok = CMP[s.cmp](a, b);
        push(p, { check: ok, at: env.at, a, b });
        if (ok) exec(s.body, p, env);
      }
    }
  };
  exec(prog, [], {});
  const looped = prog.some((s) => s.body);
  return { steps, list, vars, error, seen, looped };
}

const etext = (e) => {
  if (typeof e === 'number') return fmt(e);
  if (typeof e === 'string') return e;
  if (e.ke !== undefined) return `barang ke-${e.ke} DARI belanja`;
  if (e.harga) return `harga(${e.harga})`;
  if (e.hargaKe) return 'harga(barang ke-urutan DARI belanja)';
  return '……';
};
const toText = (to) => (to === 'P' ? 'PANJANG belanja' : to === 'P-1' ? 'PANJANG belanja − 1' : to);
export const stmtText = (s) => {
  switch (s.op) {
    case 'buat': return 'BUAT DAFTAR belanja KOSONG';
    case 'tambahkan': return `TAMBAHKAN "${s.x}" KE belanja`;
    case 'hapus': return `HAPUS "${s.x}" DARI belanja`;
    case 'atur': return `ATUR ${s.v} MENJADI ${etext(s.e)}`;
    case 'tambah': return `TAMBAH ${s.v} ${etext(s.e)}`;
    case 'setiap': return 'UNTUK SETIAP barang DALAM belanja [';
    case 'urutan': return `UNTUK urutan DARI ${s.from} SAMPAI ${toText(s.to)} [`;
    case 'jika': return `JIKA ${etext(s.l)} ${s.cmp} ${etext(s.r)} MAKA`;
    default: return '';
  }
};

// The program as lines with data-path for the highlight.
function progNode(prog, { numbers } = {}) {
  const box = el('div', { class: 'dbl-kode' });
  let line = 0;
  const walk = (items, path, depth) => items.forEach((s, i) => {
    const p = [...path, i];
    box.append(el('div', { class: 'dbl-baris', style: { '--d': depth }, 'data-path': p.join('.') },
      numbers ? el('span', { class: 'dbl-no' }, ++line) : null, el('span', null, s.text ?? stmtText(s))));
    if (s.body) {
      walk(s.body, p, depth + 1);
      if (s.op !== 'jika') box.append(el('div', { class: 'dbl-baris', style: { '--d': depth } }, ']'));
    }
  });
  walk(prog, [], 0);
  return box;
}

function light(codeNode, step) {
  codeNode.querySelectorAll('.nyala, .ya, .tidak').forEach((n) => n.classList.remove('nyala', 'ya', 'tidak'));
  if (!step) return;
  const row = codeNode.querySelector(`[data-path="${step.path.join('.')}"]`);
  row?.classList.add('nyala');
  if ('check' in step) row?.classList.add(step.check ? 'ya' : 'tidak');
}

// The list as numbered boxes. A removed box shrinks away so the boxes below
// slide up, then the numbers are written again.
function listView() {
  const rows = el('ol', { class: 'dbl-daftar' });
  const node = el('div', { class: 'dbl-kertas' }, el('b', { class: 'dbl-judul' }, '📝 belanja'), rows);
  let shown = null, timer = null;
  const draw = (list) => {
    shown = list ? [...list] : null;
    if (!list) { rows.replaceChildren(el('li', { class: 'dbl-belum' }, 'belum dibuat')); return; }
    if (!list.length) { rows.replaceChildren(el('li', { class: 'dbl-belum' }, '(kosong)')); return; }
    rows.replaceChildren(...list.map((x, i) => el('li', { class: 'dbl-isi' },
      el('span', { class: 'dbl-nomor' }, i + 1), el('span', { class: 'dbl-ikon' }, ICON[x] ?? '🛒'),
      el('span', { class: 'dbl-nama' }, x), el('small', { class: 'dbl-harga' }, fmt(PRICE[x])))));
  };
  return {
    node,
    set(list, step = {}) {
      clearTimeout(timer);
      if (step.ev === 'del' && shown && rows.children[step.i]) {
        rows.children[step.i].classList.add('keluar');
        timer = setTimeout(() => draw(list), 380);
        return;
      }
      draw(list);
      if (step.ev === 'add') rows.lastElementChild?.classList.add('masuk');
    },
    visit(k) {
      [...rows.children].forEach((r, i) => r.classList.toggle('periksa', i === k));
      if (k !== null && k !== undefined) [...rows.children].forEach((r, i) => { if (i === k) r.classList.add('sudah'); });
    },
    mark(seen) {
      [...rows.children].forEach((r, i) => { r.classList.remove('periksa'); if (r.classList.contains('dbl-isi') && !seen.has(i)) r.classList.add('lewat'); });
    },
  };
}

// Named boxes such as total or termurah.
function varsView() {
  const node = el('div', { class: 'dbl-kotak-kotak' });
  const boxes = {};
  return {
    node,
    reset() { node.replaceChildren(); Object.keys(boxes).forEach((k) => delete boxes[k]); },
    show(step) {
      for (const [k, v] of Object.entries(step.vars)) {
        if (!boxes[k]) {
          const val = el('b', { class: 'dbl-nilai' });
          boxes[k] = { b: el('div', { class: 'dbl-kotak' }, el('span', { class: 'dbl-var' }, k), val), val };
          node.append(boxes[k].b);
        }
        const text = fmt(v);
        if (boxes[k].val.textContent !== text) {
          boxes[k].val.textContent = text;
          boxes[k].b.classList.remove('baru'); void boxes[k].b.offsetWidth; boxes[k].b.classList.add('baru');
        }
      }
      Object.keys(boxes).forEach((k) => { if (!(k in step.vars)) { boxes[k].b.remove(); delete boxes[k]; } });
    },
  };
}

function showStep(code, view, vars, s) {
  light(code, s);
  if (s.ev) view.set(s.list, s);
  view.visit(s.at);
  vars.show(s);
}

function play(code, view, vars, result, { done, speed = 420 } = {}) {
  let i = 0, t = null;
  const tick = () => {
    if (i >= result.steps.length) {
      light(code, null);
      if (result.looped && result.list) view.mark(result.seen);
      vars.show({ vars: result.vars });
      done?.(); return;
    }
    const s = result.steps[i++];
    showStep(code, view, vars, s);
    t = setTimeout(tick, s.ev === 'del' ? Math.max(speed, 650) : speed);
  };
  t = setTimeout(tick, 200);
  return () => clearTimeout(t);
}

const P1 = [B(), A('beras'), A('telur'), A('tempe'), A('cabai'), H('telur'), A('kangkung'), A('minyak goreng')];
const FINAL = ['beras', 'tempe', 'cabai', 'kangkung', 'minyak goreng'];
const SUM = [SET('total', 0), EACH(INC('total', { harga: 'barang' }))];
const raka = (from, to) => [SET('total', 0), RANGE(from, to, INC('total', { hargaKe: 'urutan' }))];
const MIN = [SET('termurah', { ke: 1 }), EACH(IF({ harga: 'barang' }, '<', { harga: 'termurah' }, SET('termurah', 'barang')))];
const MIN_BLANK = [SET('termurah', { ke: 1 }), EACH({ ...IF({ harga: 'barang' }, '<', { harga: 'termurah' }), text: 'JIKA harga(barang) …… harga(termurah) MAKA', body: [{ ...SET('termurah', 'barang'), text: 'ATUR termurah MENJADI ……' }] })];
const COUNT = [SET('banyak', 0), EACH(IF({ harga: 'barang' }, '>', 10000, INC('banyak', 1)))];

const L = (...xs) => xs.map((x, i) => `${i + 1}. ${x}`).join(', ');
const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });

// Worksheet questions in order. `upto` runs only the first lines.
const PLAN = [
  { prog: P1, numbers: true, upto: 4, prompt: 'Soal 1. Apa isi daftar sesudah baris 4?', opts: textOpts(L('beras', 'telur', 'tempe'), [L('tempe', 'telur', 'beras'), L('beras', 'tempe'), L('beras', 'telur', 'tempe', 'cabai')]) },
  { prog: P1, numbers: true, upto: 6, prompt: 'Apa isi daftar sesudah baris 6 (HAPUS "telur")?', opts: textOpts(L('beras', 'tempe', 'cabai'), [L('beras', '(kosong)', 'tempe', 'cabai'), L('beras', 'cabai', 'tempe'), L('telur', 'tempe', 'cabai')]) },
  { prog: P1, numbers: true, prompt: 'Apa isi daftar di akhir program?', opts: textOpts(L(...FINAL), [L('beras', 'telur', 'tempe', 'cabai', 'kangkung', 'minyak goreng'), L('minyak goreng', 'kangkung', 'cabai', 'tempe', 'beras'), L('beras', 'tempe', 'cabai', 'kangkung')]) },
  { prog: P1, numbers: true, prompt: 'a. Berapa PANJANG belanja di akhir program?', ...nums([4, 5, 6, 7], 5) },
  { prog: P1, numbers: true, prompt: 'b. Apa barang ke-3 DARI belanja di akhir program?', opts: textOpts('cabai', ['tempe', 'kangkung', 'telur']) },
  { prog: P1, numbers: true, upto: 5, prompt: 'c. Apa barang ke-2 DARI belanja sesudah baris 5?', opts: textOpts('telur', ['tempe', 'beras', 'cabai']) },
  { prog: P1, numbers: true, upto: 6, prompt: 'Apa barang ke-2 sesudah baris 6?', opts: textOpts('tempe', ['telur', 'cabai', 'tidak ada (kosong)']) },
  { prog: P1, numbers: true, upto: 6, prompt: 'Mengapa barang ke-2 berubah?', opts: textOpts('Telur dihapus, jadi semua isi sesudahnya naik satu nomor.', ['Tempe ditambahkan di nomor 2.', 'Nomor 2 menjadi kosong, lalu diisi tempe.']) },
  { prog: SUM, start: FINAL, prompt: 'Soal 2. Berapa isi total sesudah putaran 3?', ...nums([20000, 25000, 29000, 33000], 25000) },
  { prog: SUM, start: FINAL, prompt: 'Berapa total belanja?', ...nums([43000, 45000, 47000, 51000], 47000) },
  { prog: SUM, start: FINAL, prompt: 'Ibu memberi Sari Rp50.000. Berapa uang kembaliannya?', ...nums([3000, 7000, 13000, 47000], 3000) },
  { prog: raka(2, 'P'), start: FINAL, prompt: 'Soal 3. Berapa total menurut program Raka?', ...nums([29000, 33000, 41000, 47000], 33000) },
  { prog: raka(2, 'P'), start: FINAL, prompt: 'Barang mana yang terlewat?', opts: textOpts('beras', ['minyak goreng', 'tempe', 'tidak ada yang terlewat']) },
  { start: FINAL, prompt: 'b. Program mana yang sudah diperbaiki?', progs: [raka(1, 'P'), raka(2, 'P-1'), raka(1, 'P-1'), raka(3, 'P')] },
  { prog: raka(1, 'P-1'), start: FINAL, prompt: 'c. Kalau Raka menulis DARI 1 SAMPAI PANJANG belanja − 1, barang mana yang terlewat?', opts: textOpts('minyak goreng', ['beras', 'kangkung', 'tidak ada yang terlewat']) },
  { prog: MIN, show: MIN_BLANK, start: FINAL, prompt: 'Soal 4. Tanda apa yang tepat di titik-titik pertama?', opts: textOpts('<', ['>', '=']), columns: 3 },
  { prog: MIN, show: MIN_BLANK, start: FINAL, prompt: 'ATUR termurah MENJADI apa?', opts: textOpts('barang', ['harga(barang)', '0', 'barang ke-1 DARI belanja']) },
  { prog: MIN, start: FINAL, prompt: 'Putaran 3 (cabai). Apakah cabai lebih murah dari termurah?', opts: textOpts('ya, 5.000 < 6.000, jadi termurah menjadi cabai', ['tidak, termurah tetap beras', 'ya, jadi termurah menjadi tempe']) },
  { prog: MIN, start: FINAL, prompt: 'Barang termurah apa?', opts: textOpts('kangkung', ['garam', 'cabai', 'minyak goreng']) },
  { prog: COUNT, start: FINAL, prompt: 'Tantangan. Berapa barang yang harganya lebih dari Rp10.000?', ...nums([1, 2, 3, 5], 2) },
];

function stage(prog, start, numbers) {
  const code = progNode(prog, { numbers });
  const view = listView();
  const vars = varsView();
  view.set(start ?? null);
  const node = el('div', { class: 'dbl-soal' }, code, el('div', { class: 'dbl-samping' }, view.node, vars.node));
  return { code, view, vars, node };
}

function round(wrap, ctx, p, next) {
  const shown = p.progs ? null : stage(p.show ?? p.prog, p.start, p.numbers);
  const holder = el('div', { class: 'dbl-tempat' }, shown ? shown.node : null);
  if (p.progs) { const v = listView(); v.set(p.start); holder.append(v.node); }
  const after = () => {
    const prog = p.prog ?? p.progs[0];
    const st = shown && !p.show ? shown : stage(prog, p.start, p.numbers);
    if (st !== shown) holder.replaceChildren(st.node);
    const r = runList(p.upto ? prog.slice(0, p.upto) : prog, p.start);
    play(st.code, st.view, st.vars, r, { speed: r.steps.length > 14 ? 200 : 330, done: () => setTimeout(next, 900) });
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: fmt(v), correct: v === p.ans })); columns = 4; }
  else if (p.progs) { options = ctx.rand.shuffle(p.progs.map((pr, i) => ({ icon: progNode(pr), correct: i === 0 }))); columns = 2; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.columns ?? (p.opts.some((o) => o.label.length > 30) ? 1 : 2); }
  choice(wrap, { prompt: p.prompt, subject: holder, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-26-daftar-belanja',
  title: 'Daftar Belanja ke Pasar',
  topic: 'Daftar (list)',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🧺',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menelusuri daftar yang ditambah dan dihapus, menjelajah daftar untuk menjumlahkan dan mencari yang termurah, serta menemukan barang yang terlewat karena hitungan dimulai dari nomor yang salah.',
  extraModes: [
    { id: 'pasar', icon: '🧺', label: 'Daftar Pasar', desc: 'Ubah daftar belanja dan program penjelajahnya, lalu lihat kotak-kotaknya bergeser', create: createMarket },
    { id: 'tebak', icon: '🔁', label: 'Tebak Daftar', desc: 'Satu tim memberi 5–8 perintah, tim lain menebak panjang daftar dan barang ke-n', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act daftar-belanja' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
const SCANS = [
  { id: 'jumlah', label: 'Jumlahkan' },
  { id: 'urutan', label: 'Jumlahkan dengan nomor urut' },
  { id: 'min', label: 'Cari termurah' },
  { id: 'hitung', label: 'Hitung yang mahal' },
  { id: 'tidak', label: 'Tanpa penjelajah' },
];

// Free play: list lines and one loop program, both changed by tapping.
function createMarket(root, ctx) {
  const wrap = el('div', { class: 'act daftar-belanja' });
  root.append(wrap);
  const state = { lines: P1.slice(1).map((s) => ({ ...s })), scan: { id: 'jumlah', from: 1, to: 'P', cmp: '<', n: 10000 } };
  let locked = false, result = null, idx = 0, stop = null;
  const view = listView();
  const vars = varsView();
  const info = el('p', { class: 'dbl-info' });
  const code = el('div', { class: 'dbl-kode dbl-program' });
  const program = () => {
    const sc = state.scan;
    const tail = sc.id === 'jumlah' ? SUM : sc.id === 'urutan' ? raka(sc.from, sc.to)
      : sc.id === 'min' ? [SET('termurah', { ke: 1 }), EACH(IF({ harga: 'barang' }, sc.cmp, { harga: 'termurah' }, SET('termurah', 'barang')))]
        : sc.id === 'hitung' ? [SET('banyak', 0), EACH(IF({ harga: 'barang' }, '>', sc.n, INC('banyak', 1)))] : [];
    return [B(), ...state.lines, ...tail];
  };
  const act = (fn) => () => { if (!locked) { fn(); ctx.sound.tap(); draw(); } };
  const chip = (text, fn, cls = '') => onTap(el('button', { class: `dbl-pilih ${cls}`, type: 'button' }, text), act(fn));
  const draw = () => {
    const prog = program();
    const rows = [];
    const k = state.lines.length;
    const walk = (items, path, depth) => items.forEach((s, i) => {
      const p = [...path, i];
      let parts;
      if (depth === 0 && i >= 1 && i <= k) {
        const line = state.lines[i - 1];
        parts = [chip(line.op === 'tambahkan' ? 'TAMBAHKAN' : 'HAPUS', () => { line.op = line.op === 'tambahkan' ? 'hapus' : 'tambahkan'; }, 'op'),
          chip(`"${line.x}"`, () => { line.x = cycle(ITEMS, line.x); }),
          el('span', null, line.op === 'tambahkan' ? 'KE belanja' : 'DARI belanja'),
          onTap(el('button', { class: 'dbl-hapus', type: 'button', 'aria-label': 'hapus baris' }, '✕'), act(() => { state.lines.splice(i - 1, 1); }))];
      } else if (s.op === 'urutan') {
        parts = [el('span', null, 'UNTUK urutan DARI'), chip(s.from, () => { state.scan.from = cycle([1, 2, 3], state.scan.from); }),
          el('span', null, 'SAMPAI'), chip(toText(s.to), () => { state.scan.to = cycle(['P', 'P-1'], state.scan.to); }), el('span', null, '[')];
      } else if (s.op === 'jika' && state.scan.id === 'min') {
        parts = [el('span', null, 'JIKA harga(barang)'), chip(s.cmp, () => { state.scan.cmp = cycle(['<', '>'], state.scan.cmp); }), el('span', null, 'harga(termurah) MAKA')];
      } else if (s.op === 'jika' && state.scan.id === 'hitung') {
        parts = [el('span', null, 'JIKA harga(barang) >'), chip(fmt(s.r), () => { state.scan.n = cycle([5000, 10000, 15000], state.scan.n); }), el('span', null, 'MAKA')];
      } else parts = [el('span', null, stmtText(s))];
      rows.push(el('div', { class: 'dbl-baris', style: { '--d': depth }, 'data-path': p.join('.') }, ...parts));
      if (s.body) {
        walk(s.body, p, depth + 1);
        if (s.op !== 'jika') rows.push(el('div', { class: 'dbl-baris', style: { '--d': depth } }, ']'));
      }
      if (depth === 0 && i === k) rows.push(el('div', { class: 'row dbl-tambah-baris' }, chip('+ TAMBAHKAN', () => { if (state.lines.length < 10) state.lines.push(A(ITEMS[state.lines.length % ITEMS.length])); }, 'kecil'), chip('+ HAPUS', () => { if (state.lines.length < 10) state.lines.push(H(state.lines.at(-1)?.x ?? 'beras')); }, 'kecil')));
    });
    walk(prog, [], 0);
    code.replaceChildren(...rows);
    scanRow.querySelectorAll('button').forEach((b) => b.classList.toggle('aktif', b.dataset.id === state.scan.id));
  };
  const scanRow = el('div', { class: 'row dbl-jelajah' }, el('span', { class: 'label' }, 'Penjelajah'),
    ...SCANS.map((s) => onTap(el('button', { class: 'dbl-pilih', type: 'button', 'data-id': s.id }, s.label), act(() => { state.scan.id = s.id; }))));
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Soal 1–2', act(() => { state.lines = P1.slice(1).map((s) => ({ ...s })); state.scan = { ...state.scan, id: 'jumlah' }; }), 'small'),
    button('Program Raka', act(() => { state.lines = P1.slice(1).map((s) => ({ ...s })); state.scan = { ...state.scan, id: 'urutan', from: 2, to: 'P' }; }), 'small'),
    button('Termurah', act(() => { state.lines = P1.slice(1).map((s) => ({ ...s })); state.scan = { ...state.scan, id: 'min', cmp: '<' }; }), 'small'),
    button('Kosongkan', act(() => { state.lines = []; state.scan = { ...state.scan, id: 'tidak' }; }), 'small'));
  const begin = () => {
    stop?.();
    result = runList(program()); idx = 0;
    view.set(null); vars.reset(); info.textContent = '';
    locked = true; wrap.classList.add('jalan');
  };
  const finish = () => {
    locked = false; wrap.classList.remove('jalan');
    light(code, null);
    if (result.error) { info.textContent = `⛔ ${result.error}`; ctx.sound.bad(); result = null; return; }
    if (result.looped) view.mark(result.seen);
    vars.show({ vars: result.vars });
    const missed = result.list.filter((_, i) => !result.seen.has(i));
    const vals = Object.entries(result.vars).map(([k, v]) => `${k} = ${fmt(v)}`).join(', ');
    info.textContent = `Selesai. PANJANG belanja = ${result.list.length}.${vals ? ` ${vals}.` : ''}${result.looped && missed.length ? ` Tidak diperiksa: ${missed.join(', ')}.` : ''}`;
    ctx.sound.good();
    result = null;
  };
  const stepOnce = () => showStep(code, view, vars, result.steps[idx++]);
  const stepBtn = button('Langkah ⏭', () => {
    if (!result) begin();
    if (idx < result.steps.length) stepOnce();
    if (idx >= result.steps.length) finish();
  }, 'small');
  const go = button('▶ Jalankan', () => {
    if (!result) begin();
    const tick = () => {
      if (!result) return;
      if (idx >= result.steps.length) { finish(); return; }
      const s = result.steps[idx];
      stepOnce();
      const t = setTimeout(tick, s.ev === 'del' ? 650 : result.steps.length > 30 ? 220 : 400);
      stop = () => clearTimeout(t);
    };
    tick();
  }, 'primary');
  draw();
  view.set(null);
  wrap.append(el('p', { class: 'prompt' }, 'Ketuk perintah untuk mengubahnya, pilih penjelajah, lalu jalankan.'), examples, scanRow,
    el('div', { class: 'dbl-soal' }, code, el('div', { class: 'dbl-samping' }, view.node, vars.node, el('div', { class: 'row' }, go, stepBtn))), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: one team gives 5 to 8 list commands; the other guesses the
// length and item n before the program runs.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act daftar-belanja' });
  root.append(wrap);
  let turn = 0, stop = null;
  const score = [0, 0];
  function start() {
    stop?.();
    const a = turn % 2, b = 1 - a;
    const lines = [];
    let mode = 'tambahkan';
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: beri 5 sampai 8 perintah daftar. Tim ${b + 1} jangan dulu melihat jawabannya.`);
    const info = el('p', { class: 'dbl-info' });
    const code = el('div', { class: 'dbl-kode' });
    const listNow = () => runList([B(), ...lines]).list;
    const draw = () => {
      code.replaceChildren(progNode([B(), ...lines], { numbers: true }));
      ready.disabled = lines.length < 5;
      modeBtns.forEach((m) => m.classList.toggle('aktif', m.dataset.op === mode));
    };
    const modeBtns = ['tambahkan', 'hapus'].map((op) => onTap(el('button', { class: 'dbl-pilih op', type: 'button', 'data-op': op }, op.toUpperCase()), () => { mode = op; ctx.sound.tap(); draw(); }));
    const shelf = el('div', { class: 'dbl-lapak' }, ITEMS.map((x) => onTap(el('button', { class: 'dbl-barang', type: 'button' }, el('span', null, ICON[x]), el('b', null, x)), (e) => {
      if (lines.length >= 8) { info.textContent = 'Sudah 8 perintah.'; shake(code); return; }
      if (mode === 'hapus' && !listNow().includes(x)) { info.textContent = `"${x}" belum ada di daftar, jadi tidak bisa dihapus.`; shake(e.currentTarget ?? shelf); return; }
      if (mode === 'tambahkan' && listNow().length >= 7) { info.textContent = 'Daftar sudah 7 barang. Pakai HAPUS.'; shake(shelf); return; }
      info.textContent = '';
      lines.push(mode === 'tambahkan' ? A(x) : H(x)); ctx.sound.tap(); draw();
    })));
    const undo = button('↩ Batal', () => { lines.pop(); draw(); }, 'small');
    const ready = button('Perintah siap ✓', () => {
      const list = listNow();
      if (!list.length) { info.textContent = 'Daftar akhirnya kosong. Tambahkan barang lagi.'; shake(code); return; }
      const n = 1 + Math.floor(ctx.rand.next() * list.length);
      guessStage(lines, list, n);
    }, 'primary');
    draw();
    wrap.replaceChildren(head, el('div', { class: 'row' }, ...modeBtns, undo), shelf, code, ready, info);

    function guessStage(prog, list, n) {
      let len = 0, item = null;
      head.textContent = `Tim ${b + 1}: tebak PANJANG belanja dan barang ke-${n} di akhir program, lalu jalankan.`;
      const lenShown = el('b', { class: 'dbl-tebak' }, '0');
      const setLen = (d) => { len = Math.max(0, Math.min(8, len + d)); lenShown.textContent = len; ctx.sound.tap(); };
      const pick = el('div', { class: 'dbl-lapak kecil' }, ITEMS.map((x) => onTap(el('button', { class: 'dbl-barang', type: 'button', 'data-x': x }, el('span', null, ICON[x]), el('b', null, x)), () => {
        item = x; pick.querySelectorAll('button').forEach((bt) => bt.classList.toggle('aktif', bt.dataset.x === x)); ctx.sound.tap();
      })));
      const full = [B(), ...prog];
      const st = stage(full, null, true);
      const guessBox = el('div', { class: 'dbl-tebakan' },
        el('div', { class: 'row' }, el('span', { class: 'label' }, 'PANJANG'), button('−', () => setLen(-1), 'small'), lenShown, button('+', () => setLen(1), 'small')),
        el('span', { class: 'label' }, `barang ke-${n}`), pick);
      const runBtn = button('▶ Jalankan', () => {
        if (!item) { shake(pick); return; }
        runBtn.remove(); guessBox.classList.add('kunci');
        stop = play(st.code, st.view, st.vars, runList(full), {
          speed: 480,
          done: () => {
            const pts = (len === list.length ? 1 : 0) + (item === list[n - 1] ? 1 : 0);
            score[b] += pts;
            if (pts === 2) ctx.sound.win(); else if (pts) ctx.sound.good(); else ctx.sound.bad();
            st.view.visit(n - 1);
            info.textContent = `PANJANG ${list.length}, barang ke-${n}: ${list[n - 1]}. Tim ${b + 1} mendapat ${pts} poin. Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'dbl-soal' }, st.node, el('div', { class: 'dbl-samping' }, guessBox, runBtn)), info);
    }
  }
  start();
  return { destroy() { stop?.(); } };
}
