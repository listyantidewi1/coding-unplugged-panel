// Boleh Naik Wahana? — SD Lanjut (10–12 tahun), syarat dengan DAN, ATAU, BUKAN.
// Ride gates read a visitor card and light green or red. Conditions are trees
// of comparisons and yes/no facts joined by DAN, ATAU and BUKAN; every part
// lights green (true) or red (false) when a visitor walks through.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const VISITORS = [
  { name: 'Ani', umur: 5, tinggi: 105, didampingi: false, makanan: false },
  { name: 'Budi', umur: 6, tinggi: 95, didampingi: true, makanan: true },
  { name: 'Citra', umur: 9, tinggi: 132, didampingi: false, makanan: false },
  { name: 'Dedi', umur: 11, tinggi: 128, didampingi: false, makanan: true },
  { name: 'Eka', umur: 12, tinggi: 140, didampingi: false, makanan: false },
  { name: 'Fajar', umur: 4, tinggi: 90, didampingi: false, makanan: false },
  { name: 'Gita', umur: 10, tinggi: 130, didampingi: true, makanan: true },
  { name: 'Hasan', umur: 8, tinggi: 120, didampingi: true, makanan: false },
];
const FACE = ['👧', '👦', '👧', '👦', '👧', '👦', '👧', '👦'];

// Condition nodes.
const C = (v, op, n) => ({ t: 'cmp', v, op, n });
const F = (f) => ({ t: 'flag', f });
const AND = (a, b) => ({ t: 'and', a, b });
const OR = (a, b) => ({ t: 'or', a, b });
const NOT = (a) => ({ t: 'not', a });
const HOLE = () => ({ t: 'hole' });

const OPS = { '≥': (x, n) => x >= n, '>': (x, n) => x > n, '≤': (x, n) => x <= n, '<': (x, n) => x < n, '=': (x, n) => x === n };
const FLAG_TEXT = { didampingi: 'didampingi', makanan: 'membawa makanan', minuman: 'membawa minuman', hujan: 'hujan' };

// Evaluates a condition for one visitor. `rec` gets the value of every part
// by its path, so the parts can light up.
export function test(c, v, env = {}, rec = null, path = 'r') {
  let val;
  if (c.t === 'hole') throw new Error('Masih ada bagian syarat yang kosong.');
  if (c.t === 'cmp') val = OPS[c.op](v[c.v], c.n);
  else if (c.t === 'flag') val = c.f === 'hujan' ? !!env.hujan : !!v[c.f];
  else if (c.t === 'not') val = !test(c.a, v, env, rec, `${path}.a`);
  else {
    const a = test(c.a, v, env, rec, `${path}.a`), b = test(c.b, v, env, rec, `${path}.b`);
    val = c.t === 'and' ? a && b : a || b;
  }
  if (rec) rec[path] = val;
  return val;
}
export const passers = (c, env = {}, list = VISITORS) => list.filter((v) => test(c, v, env)).map((v) => v.name);

export function ctext(c, parent = null) {
  if (c.t === 'hole') return '□';
  if (c.t === 'cmp') return `${c.v} ${c.op} ${c.n}`;
  if (c.t === 'flag') return FLAG_TEXT[c.f];
  if (c.t === 'not') return `BUKAN ${ctext(c.a, c)}`;
  const s = `${ctext(c.a, c)} ${c.t === 'and' ? 'DAN' : 'ATAU'} ${ctext(c.b, c)}`;
  return parent && (parent.t === 'not' || parent.t !== c.t) ? `(${s})` : s;
}

export const RIDES = {
  komidi: { name: 'Komidi putar', icon: '🎠', board: 'Pengunjung setinggi minimal 100 cm, atau didampingi orang dewasa.', cond: OR(C('tinggi', '≥', 100), F('didampingi')) },
  kora: { name: 'Kora-kora', icon: '🚣', board: 'Tinggi minimal 130 cm dan umur minimal 10 tahun.', cond: AND(C('tinggi', '≥', 130), C('umur', '≥', 10)) },
  senggol: { name: 'Mobil senggol', icon: '🚗', board: 'Umur minimal 7 tahun dan tidak membawa makanan.', cond: AND(C('umur', '≥', 7), NOT(F('makanan'))) },
  bianglala: { name: 'Bianglala', icon: '🎡', board: 'Tidak beroperasi saat hujan. Pengunjung setinggi minimal 110 cm atau didampingi orang dewasa.', cond: AND(NOT(F('hujan')), OR(C('tinggi', '≥', 110), F('didampingi'))) },
  hantu: { name: 'Rumah hantu', icon: '👻', board: 'Umur minimal 8 tahun. Anak yang lebih muda boleh masuk bila didampingi orang dewasa.', cond: OR(C('umur', '≥', 8), F('didampingi')) },
  kereta: { name: 'Kereta mini', icon: '🚂', board: 'Khusus anak yang tingginya kurang dari 120 cm dan tidak membawa makanan.', cond: AND(C('tinggi', '<', 120), NOT(F('makanan'))) },
};

// A condition drawn as nested boxes. Every part carries data-path.
function condView(c, { onPick, selected, edit } = {}) {
  const draw = (n, path) => {
    let node;
    if (n.t === 'hole') node = el('span', { class: 'swh-lubang' }, '□');
    else if (n.t === 'cmp') {
      node = el('span', { class: 'swh-blok banding' },
        edit ? edit.chip(n, 'v', n.v) : el('b', null, n.v),
        edit ? edit.chip(n, 'op', n.op) : el('b', null, n.op),
        edit ? edit.chip(n, 'n', n.n) : el('b', null, n.n), el('small', null, n.v === 'tinggi' ? 'cm' : 'th'));
    } else if (n.t === 'flag') node = el('span', { class: 'swh-blok fakta' }, FLAG_TEXT[n.f]);
    else if (n.t === 'not') node = el('span', { class: 'swh-wadah bukan' }, el('i', null, 'BUKAN'), draw(n.a, `${path}.a`));
    else node = el('span', { class: `swh-wadah ${n.t}` }, draw(n.a, `${path}.a`), el('i', null, n.t === 'and' ? 'DAN' : 'ATAU'), draw(n.b, `${path}.b`));
    node.dataset.path = path;
    if (selected === path) node.classList.add('dipilih');
    if (onPick) node.addEventListener('click', (e) => { if (e.target.closest('[data-path]') === node && !e.target.closest('.swh-chip')) { e.stopPropagation(); onPick(path); } });
    return node;
  };
  return el('div', { class: 'swh-syarat' }, draw(c, 'r'));
}

function lightParts(view, rec) {
  view.querySelectorAll('[data-path]').forEach((n) => {
    n.classList.remove('benar', 'salah');
    if (rec && n.dataset.path in rec) n.classList.add(rec[n.dataset.path] ? 'benar' : 'salah');
  });
}

function card(v, { small } = {}) {
  return el('div', { class: `swh-kartu${small ? ' kecil' : ''}`, 'data-name': v.name },
    el('span', { class: 'swh-wajah' }, v.face ?? FACE[VISITORS.indexOf(v)] ?? '🧒'),
    el('b', null, v.name),
    el('span', null, `${v.umur} th · ${v.tinggi} cm`),
    el('span', null, `${v.didampingi ? '🧑‍🧒 didampingi' : '🚶 sendiri'}`),
    el('span', null, v.makanan ? '🍢 bawa makanan' : '— tanpa makanan'));
}

// All visitors as small cards; `mark` gives each a ✓ or ✗ in turn.
function crowd(list = VISITORS) {
  const node = el('div', { class: 'swh-orang' }, list.map((v) => card(v, { small: true })));
  return {
    node,
    mark(cond, env, done) {
      let i = 0;
      const tick = () => {
        if (i >= list.length) { done?.(); return; }
        const ok = test(cond, list[i], env);
        node.children[i].classList.add(ok ? 'boleh' : 'tolak');
        i++;
        setTimeout(tick, 220);
      };
      setTimeout(tick, 200);
    },
  };
}

function truthTable(rows) {
  return el('table', { class: 'swh-tabel' }, el('thead', null, el('tr', null, rows[0].map((h) => el('th', null, h)))),
    el('tbody', null, rows.slice(1).map((r) => el('tr', null, r.map((x) => el('td', { class: x === 'B' ? 'b' : x === 'S' ? 's' : '' }, x))))));
}
const BS = (x) => (x ? 'B' : 'S');
const TT = [['A', 'B', 'A DAN B', 'A ATAU B', 'BUKAN A'], ...[[1, 1], [1, 0], [0, 1], [0, 0]].map(([a, b]) => [BS(a), BS(b), BS(a && b), BS(a || b), BS(!a)])];
const TT_BLANK = TT.map((r, i) => (i === 0 ? r : [r[0], r[1], '', '', '']));
const DEMORGAN = [['makanan', 'minuman', 'BUKAN (makanan ATAU minuman)', 'BUKAN makanan DAN BUKAN minuman'],
  ...[[1, 1], [1, 0], [0, 1], [0, 0]].map(([a, b]) => [a ? 'ya' : 'tidak', b ? 'ya' : 'tidak', BS(!(a || b)), BS(!a && !b)])];

const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const WRONG_KOMIDI = AND(C('tinggi', '≥', 100), F('didampingi'));
const KORA_GT = AND(C('tinggi', '>', 130), C('umur', '≥', 10));

// Worksheet questions in order. `ride` shows a gate condition with the
// visitors; `table` shows a truth table.
const PLAN = [
  { table: TT_BLANK, prompt: 'Soal 1. A benar, B salah. Apa nilai A DAN B?', opts: textOpts('S (salah)', ['B (benar)']), cells: [[2, 2]] },
  { table: TT_BLANK, prompt: 'A salah, B benar. Apa nilai A ATAU B?', opts: textOpts('B (benar)', ['S (salah)']), cells: [[3, 3]] },
  { table: TT_BLANK, prompt: 'A benar. Apa nilai BUKAN A?', opts: textOpts('S (salah)', ['B (benar)']), cells: [[1, 4], [2, 4]] },
  { table: TT_BLANK, prompt: 'Kolom A DAN B, dari baris atas ke bawah?', opts: textOpts('B, S, S, S', ['B, B, B, S', 'S, S, S, B', 'B, S, S, B']), cells: [1, 2, 3, 4].map((r) => [r, 2]) },
  { table: TT_BLANK, prompt: 'Kolom A ATAU B, dari baris atas ke bawah?', opts: textOpts('B, B, B, S', ['B, S, S, S', 'S, B, B, S', 'B, B, S, S']), reveal: TT },
  { ride: 'komidi', prompt: 'Soal 2. Komidi putar: siapa yang lampunya merah?', opts: textOpts('Fajar', ['Ani', 'Budi', 'Hasan']) },
  { ride: 'kora', prompt: 'Kora-kora: siapa yang boleh naik?', opts: textOpts('Eka dan Gita', ['Citra, Eka, dan Gita', 'Eka saja', 'Citra dan Eka']) },
  { ride: 'senggol', prompt: 'Mobil senggol: siapa yang boleh naik?', opts: textOpts('Citra, Eka, dan Hasan', ['Citra, Dedi, Eka, dan Hasan', 'Eka dan Gita', 'Citra, Eka, Gita, dan Hasan']) },
  { ride: 'kora', prompt: 'a. Citra lebih tinggi daripada Gita, tetapi tidak boleh naik kora-kora. Mengapa?', opts: textOpts('Syaratnya DAN. Tinggi Citra cukup, tetapi umurnya baru 9 tahun.', ['Tinggi Citra kurang dari 130 cm.', 'Citra tidak didampingi orang dewasa.']) },
  { rides: ['komidi', 'kora', 'senggol'], prompt: 'b. Siapa yang boleh naik ketiga wahana?', opts: textOpts('Eka', ['Gita', 'Citra', 'Hasan']) },
  { cond: WRONG_KOMIDI, label: '🎠 Gerbang yang salah', prompt: 'Soal 3. Siapa saja yang lampunya hijau?', opts: textOpts('Gita dan Hasan', ['Budi, Gita, dan Hasan', 'Gita saja', 'semua kecuali Fajar']) },
  { cond: WRONG_KOMIDI, label: '🎠 Gerbang yang salah', prompt: 'b. Siapa yang ditolak padahal menurut papan aturan boleh naik?', opts: textOpts('Ani, Budi, Citra, Dedi, dan Eka', ['Ani, Citra, Dedi, dan Eka', 'Budi dan Fajar', 'Fajar saja']) },
  { cond: WRONG_KOMIDI, label: '🎠 Gerbang yang salah', prompt: 'c. Kata mana yang harus diganti?', opts: textOpts('DAN diganti ATAU', ['ATAU diganti DAN', '≥ diganti >', 'tambahkan BUKAN']), play: RIDES.komidi.cond },
  { ride: 'kora', only: 'Gita', prompt: 'Soal 4a. Gita tingginya tepat 130 cm dan umurnya tepat 10 tahun. Boleh naik kora-kora?', opts: textOpts('Ya, karena ≥ juga benar bila nilainya sama.', ['Tidak, karena 130 belum lebih dari 130.']) },
  { cond: KORA_GT, label: '🚣 Kora-kora dengan >', prompt: 'b. Petugas menulis tinggi > 130. Siapa saja yang boleh naik?', opts: textOpts('hanya Eka', ['Eka dan Gita', 'Citra dan Eka', 'tidak ada']) },
  { board: 'bianglala', prompt: 'Soal 5a. Syarat bianglala yang tepat?', conds: [RIDES.bianglala.cond, OR(AND(NOT(F('hujan')), C('tinggi', '≥', 110)), F('didampingi')), AND(F('hujan'), OR(C('tinggi', '≥', 110), F('didampingi'))), AND(NOT(F('hujan')), OR(C('tinggi', '≥', 100), F('didampingi')))] },
  { ride: 'bianglala', prompt: 'b. Malam ini tidak hujan. Siapa yang ditolak?', opts: textOpts('Ani dan Fajar', ['Fajar saja', 'Ani, Budi, dan Fajar', 'Ani, Fajar, dan Hasan']) },
  { ride: 'bianglala', env: { hujan: true }, prompt: 'c. Bila turun hujan, siapa yang boleh naik?', opts: textOpts('tidak ada', ['Budi, Gita, dan Hasan', 'semua kecuali Ani dan Fajar']) },
  { table: DEMORGAN.map((r, i) => (i ? [r[0], r[1], '', ''] : r)), reveal: DEMORGAN, prompt: 'Tantangan. Apakah kedua syarat selalu memberi hasil yang sama?', opts: textOpts('Ya, selalu sama.', ['Tidak, berbeda bila hanya membawa makanan.', 'Tidak, berbeda bila membawa keduanya.']) },
];

function round(wrap, ctx, p, next) {
  const holder = el('div', { class: 'swh-tempat' });
  let after;
  if (p.table) {
    holder.append(truthTable(p.table));
    // Only the asked cells are filled, so later questions keep their answers hidden.
    const filled = p.reveal ?? p.table.map((r, i) => r.map((x, j) => (p.cells.some(([a, b]) => a === i && b === j) ? TT[i][j] : x)));
    after = () => { holder.replaceChildren(truthTable(filled)); holder.querySelectorAll('td').forEach((td, k) => { const i = 1 + Math.floor(k / filled[0].length), j = k % filled[0].length; if (p.cells?.some(([a, b]) => a === i && b === j)) td.classList.add('baru'); }); setTimeout(next, 1400); };
  } else if (p.conds) {
    const r = RIDES[p.board];
    holder.append(el('p', { class: 'swh-papan' }, `${r.icon} ${r.name}: "${r.board}"`));
    after = () => {
      const cr = crowd();
      holder.append(condView(r.cond), cr.node);
      cr.mark(r.cond, {}, () => setTimeout(next, 900));
    };
  } else {
    const list = p.only ? VISITORS.filter((v) => v.name === p.only) : VISITORS;
    const gates = (p.rides ?? [p.ride]).filter(Boolean).map((k) => ({ label: `${RIDES[k].icon} ${RIDES[k].name}`, cond: RIDES[k].cond }));
    if (p.cond) gates.push({ label: p.label, cond: p.cond });
    gates.forEach((g) => holder.append(el('div', { class: 'swh-gerbang-teks' }, el('b', null, g.label), condView(g.cond))));
    if (p.env?.hujan) holder.append(el('p', { class: 'swh-hujan' }, '🌧️ Sedang hujan'));
    const cr = crowd(list);
    holder.append(cr.node);
    after = () => {
      const all = p.play ?? (gates.length > 1 ? gates.reduce((acc, g) => (acc ? AND(acc, g.cond) : g.cond), null) : gates[0].cond);
      if (p.play) holder.prepend(el('div', { class: 'swh-gerbang-teks' }, el('b', null, '✅ Sesudah diperbaiki'), condView(p.play)));
      if (list.length === 1) {
        const rec = {};
        test(all, list[0], p.env, rec);
        lightParts(holder.querySelector('.swh-syarat'), rec);
      }
      cr.mark(all, p.env ?? {}, () => setTimeout(next, 900));
    };
  }
  const options = p.conds
    ? ctx.rand.shuffle(p.conds.map((c, i) => ({ label: ctext(c), correct: i === 0 })))
    : ctx.rand.shuffle(p.opts);
  const columns = options.some((o) => o.label.length > 26) ? 1 : 2;
  choice(wrap, { prompt: p.prompt, subject: holder, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-27-syarat-wahana',
  title: 'Boleh Naik Wahana?',
  topic: 'Syarat DAN, ATAU, BUKAN',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🎡',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid mengisi tabel kebenaran, menguji syarat gerbang wahana untuk 8 pengunjung, memperbaiki DAN yang seharusnya ATAU, dan menyusun syarat untuk aturan baru.',
  extraModes: [
    { id: 'gerbang', icon: '🚦', label: 'Penyusun Syarat', desc: 'Susun syarat dari blok DAN, ATAU, BUKAN, lalu jalankan 8 pengunjung lewat gerbang', create: createGate },
    { id: 'pengecoh', icon: '🔁', label: 'Pengunjung Pengecoh', desc: 'Satu tim menyusun syarat, tim lain membuat kartu pengunjung untuk mengujinya', create: createTrick },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act syarat-wahana' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
const NUMS = { tinggi: [90, 95, 100, 105, 110, 120, 125, 130, 135, 140], umur: [4, 5, 6, 7, 8, 9, 10, 11, 12] };
const get = (root, path) => path.split('.').slice(1).reduce((n, k) => n[k], root);

// Condition builder: tap a part to pick it, then a block replaces it (or
// wraps it, for DAN, ATAU and BUKAN). Chips in a comparison change by tapping.
function builder(ctx, onChange) {
  const box = { c: HOLE() };
  let sel = 'r', locked = false;
  const area = el('div', { class: 'swh-susun' });
  const set = (path, node) => {
    if (path === 'r') box.c = node;
    else { const parts = path.split('.'); const key = parts.pop(); get(box.c, parts.join('.') === 'r' ? 'r' : parts.join('.'))[key] = node; }
  };
  const firstHole = (n, path) => {
    if (n.t === 'hole') return path;
    if (n.t === 'not') return firstHole(n.a, `${path}.a`);
    if (n.t === 'and' || n.t === 'or') return firstHole(n.a, `${path}.a`) ?? firstHole(n.b, `${path}.b`);
    return null;
  };
  const edit = {
    chip: (n, key, text) => onTap(el('button', { class: 'swh-chip', type: 'button' }, text), () => {
      if (locked) return;
      if (key === 'v') { n.v = n.v === 'tinggi' ? 'umur' : 'tinggi'; n.n = n.v === 'tinggi' ? 110 : 8; }
      else if (key === 'op') n.op = cycle(Object.keys(OPS), n.op);
      else n.n = cycle(NUMS[n.v], n.n);
      ctx.sound.tap(); draw();
    }),
  };
  const draw = () => {
    area.replaceChildren(condView(box.c, { onPick: (p) => { if (!locked) { sel = p; ctx.sound.tap(); draw(); } }, selected: sel, edit }));
    text.textContent = `Syarat: ${ctext(box.c)}`;
    onChange?.();
  };
  const put = (make) => {
    if (locked) return;
    const cur = get(box.c, sel);
    const node = make(cur.t === 'hole' ? HOLE() : cur);
    set(sel, node);
    sel = firstHole(box.c, 'r') ?? sel;
    ctx.sound.tap(); draw();
  };
  const text = el('p', { class: 'swh-teks' });
  const palette = el('div', { class: 'swh-palet' },
    onTap(el('button', { class: 'swh-blok banding', type: 'button' }, 'tinggi ≥ 110'), () => put(() => C('tinggi', '≥', 110))),
    onTap(el('button', { class: 'swh-blok banding', type: 'button' }, 'umur ≥ 8'), () => put(() => C('umur', '≥', 8))),
    ...['didampingi', 'makanan', 'hujan'].map((f) => onTap(el('button', { class: 'swh-blok fakta', type: 'button' }, FLAG_TEXT[f]), () => put(() => F(f)))),
    onTap(el('button', { class: 'swh-wadah and', type: 'button' }, el('i', null, 'DAN')), () => put((cur) => AND(cur, HOLE()))),
    onTap(el('button', { class: 'swh-wadah or', type: 'button' }, el('i', null, 'ATAU')), () => put((cur) => OR(cur, HOLE()))),
    onTap(el('button', { class: 'swh-wadah bukan', type: 'button' }, el('i', null, 'BUKAN')), () => put((cur) => NOT(cur))),
    button('🗑 Kosongkan bagian', () => { if (!locked) { set(sel, HOLE()); ctx.sound.tap(); draw(); } }, 'small'));
  draw();
  return {
    node: el('div', { class: 'swh-penyusun' }, area, text, palette),
    get cond() { return box.c; },
    load(c) { box.c = structuredClone(c); sel = firstHole(box.c, 'r') ?? 'r'; draw(); },
    clear() { box.c = HOLE(); sel = 'r'; draw(); },
    lock(v) { locked = v; area.classList.toggle('kunci', v); palette.classList.toggle('kunci', v); },
    complete: () => firstHole(box.c, 'r') === null,
    area,
  };
}

// The gate: visitors come one by one; the condition parts light and the lamp
// turns green or red. A table collects the results.
function gate(area, cond, env, list, { target, onDone }) {
  const view = area.querySelector('.swh-syarat');
  const lamp = el('div', { class: 'swh-lampu' });
  const spot = el('div', { class: 'swh-depan' });
  const body = el('tbody');
  const table = el('table', { class: 'swh-tabel hasil' }, el('thead', null, el('tr', null, el('th', null, 'Pengunjung'), el('th', null, 'Gerbang'), target ? el('th', null, 'Papan aturan') : null)), body);
  let i = 0, t = null, wrong = 0;
  const tick = () => {
    if (i >= list.length) { lightParts(view, null); onDone?.(wrong); return; }
    const v = list[i++];
    const rec = {};
    const ok = test(cond, v, env, rec);
    lightParts(view, rec);
    spot.replaceChildren(card(v));
    lamp.className = `swh-lampu ${ok ? 'hijau' : 'merah'}`;
    const want = target ? test(target, v, env) : null;
    if (target && want !== ok) wrong++;
    body.append(el('tr', { class: target && want !== ok ? 'beda' : '' }, el('td', null, v.name), el('td', null, ok ? '✓' : '✗'), target ? el('td', null, want ? '✓' : '✗') : null));
    t = setTimeout(tick, 700);
  };
  t = setTimeout(tick, 150);
  return { node: el('div', { class: 'swh-gerbang' }, el('div', { class: 'swh-pintu' }, spot, lamp), el('div', { class: 'swh-tabel-tempat' }, table)), stop: () => clearTimeout(t) };
}

function createGate(root, ctx) {
  const wrap = el('div', { class: 'act syarat-wahana' });
  root.append(wrap);
  const env = { hujan: false };
  let target = null, stop = null;
  const info = el('p', { class: 'swh-info' });
  const board = el('p', { class: 'swh-papan' }, 'Bebas: susun syarat apa saja.');
  const out = el('div', { class: 'swh-keluaran' });
  const b = builder(ctx, () => { info.textContent = ''; });
  const rainBtn = button('☀️ Tidak hujan', () => { env.hujan = !env.hujan; rainBtn.textContent = env.hujan ? '🌧️ Hujan' : '☀️ Tidak hujan'; ctx.sound.tap(); }, 'small');
  const pick = (k) => {
    target = k ? RIDES[k].cond : null;
    board.textContent = k ? `${RIDES[k].icon} ${RIDES[k].name}: "${RIDES[k].board}" Susun syaratnya.` : 'Bebas: susun syarat apa saja.';
    b.clear(); out.replaceChildren(); info.textContent = '';
  };
  const rides = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Papan aturan'),
    ...['komidi', 'kora', 'senggol', 'bianglala'].map((k) => button(`${RIDES[k].icon} ${RIDES[k].name}`, () => pick(k), 'small')),
    button('Bebas', () => pick(null), 'small'));
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Gerbang salah (soal 3)', () => { pick('komidi'); b.load(WRONG_KOMIDI); }, 'small'),
    button('Kora-kora >', () => { pick('kora'); b.load(KORA_GT); }, 'small'),
    button('Bianglala', () => { pick('bianglala'); b.load(RIDES.bianglala.cond); }, 'small'));
  const go = button('▶ Jalankan gerbang', () => {
    stop?.();
    if (!b.complete()) { info.textContent = '⛔ Masih ada bagian syarat yang kosong (□).'; shake(b.area); return; }
    b.lock(true); go.disabled = true;
    const g = gate(b.area, b.cond, { ...env }, VISITORS, {
      target,
      onDone: (wrong) => {
        b.lock(false); go.disabled = false;
        if (!target) { info.textContent = `Boleh naik: ${passers(b.cond, env).join(', ') || 'tidak ada'}.`; ctx.sound.good(); return; }
        // Both weather states and the boundary heights count for the check.
        const sameAll = [false, true].every((h) => VISITORS.every((v) => test(b.cond, v, { hujan: h }) === test(target, v, { hujan: h })));
        if (!wrong && sameAll) { info.textContent = '✅ Gerbang cocok dengan papan aturan untuk semua 8 pengunjung, saat hujan maupun tidak.'; ctx.sound.win(); }
        else if (!wrong) { info.textContent = '⚠️ Cocok untuk cuaca ini, tetapi tidak cocok saat cuaca berganti. Coba tombol hujan.'; ctx.sound.bad(); }
        else { info.textContent = `✗ ${wrong} pengunjung mendapat hasil yang berbeda dari papan aturan (baris merah).`; ctx.sound.bad(); }
      },
    });
    stop = g.stop;
    out.replaceChildren(g.node);
  }, 'primary');
  wrap.append(board, rides, examples, el('div', { class: 'swh-kerja' }, b.node, el('div', { class: 'swh-samping' }, el('div', { class: 'row' }, rainBtn, go), out)), info);
  return { destroy() { stop?.(); } };
}

// Bergiliran: team A writes the condition for a rule board; team B makes up
// to 3 visitor cards. Each card the gate gets wrong (against the board) is a
// point for team B; a gate that survives all 3 is 2 points for team A.
function createTrick(root, ctx) {
  const wrap = el('div', { class: 'act syarat-wahana' });
  root.append(wrap);
  const keys = ['hantu', 'kereta', 'komidi', 'kora', 'senggol'];
  const score = [0, 0];
  let turn = 0, stop = null;
  function start() {
    stop?.();
    const a = turn % 2, bTeam = 1 - a;
    const ride = RIDES[keys[turn % keys.length]];
    const info = el('p', { class: 'swh-info' });
    const b = builder(ctx);
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: susun syarat untuk papan aturan ini.`);
    const ready = button('Syarat siap ✓', () => {
      if (!b.complete()) { info.textContent = '⛔ Masih ada bagian syarat yang kosong (□).'; shake(b.area); return; }
      b.lock(true); ready.remove(); makeCards();
    }, 'primary');
    wrap.replaceChildren(head, el('p', { class: 'swh-papan' }, `${ride.icon} ${ride.name}: "${ride.board}"`), b.node, ready, info);

    function makeCards() {
      head.textContent = `Tim ${bTeam + 1}: buat 3 kartu pengunjung pengecoh, misalnya tepat di nilai batas.`;
      const cards = [0, 1, 2].map((i) => ({ name: `Tamu ${i + 1}`, umur: 8, tinggi: 120, didampingi: false, makanan: false, face: '🧒' }));
      const row = el('div', { class: 'swh-pengecoh' });
      const draw = () => row.replaceChildren(...cards.map((v) => el('div', { class: 'swh-kartu edit' },
        el('b', null, v.name),
        el('div', { class: 'row' }, button('−', () => { v.umur = Math.max(3, v.umur - 1); draw(); }, 'small'), el('span', null, `${v.umur} th`), button('+', () => { v.umur = Math.min(14, v.umur + 1); draw(); }, 'small')),
        el('div', { class: 'row' }, button('−', () => { v.tinggi = Math.max(85, v.tinggi - 5); draw(); }, 'small'), el('span', null, `${v.tinggi} cm`), button('+', () => { v.tinggi = Math.min(160, v.tinggi + 5); draw(); }, 'small')),
        button(v.didampingi ? '🧑‍🧒 didampingi' : '🚶 sendiri', () => { v.didampingi = !v.didampingi; draw(); }, 'small'),
        button(v.makanan ? '🍢 bawa makanan' : '— tanpa makanan', () => { v.makanan = !v.makanan; draw(); }, 'small'))));
      draw();
      const test3 = button('▶ Uji gerbang', () => {
        test3.remove(); row.classList.add('kunci');
        const g = gate(b.area, b.cond, {}, cards, {
          target: ride.cond,
          onDone: (wrong) => {
            if (wrong) { score[bTeam] += wrong; ctx.sound.win(); } else { score[a] += 2; ctx.sound.good(); }
            info.textContent = `${wrong ? `Tim ${bTeam + 1} menemukan ${wrong} pengunjung yang salah diperiksa gerbang.` : `Gerbang Tim ${a + 1} tahan uji.`} Syarat yang tepat: ${ctext(ride.cond)}. Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
        stop = g.stop;
        wrap.insertBefore(g.node, info);
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'swh-kerja' }, b.node, row), test3, info);
    }
  }
  start();
  return { destroy() { stop?.(); } };
}
