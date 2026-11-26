// Bagasi Mudik Rani — SMA/SMK (16–18 tahun), optimasi: masalah ransel.
// Two greedy rules that fail, brute force over 2^n subsets, dynamic
// programming with a traceback, and the fractional bound.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const OLEH = [['Kue kering', 2, 9, '🍪'], ['Sirup satu dus', 7, 14, '🧃'], ['Gula pasir', 5, 6, '🍚'], ['Kopi bubuk', 3, 12, '☕'], ['Kerupuk', 1, 3, '🍘'], ['Sarung dan baju', 5, 13, '👕']];
export const CAP = 10;
export function greedy(items, cap, key) {
  const order = items.map((it, i) => i).sort((a, b) => key(items[b]) - key(items[a]) || a - b);
  let w = 0;
  const steps = order.map((i) => { const fit = w + items[i][1] <= cap; if (fit) w += items[i][1]; return [i, fit]; });
  const take = steps.filter((s) => s[1]).map((s) => s[0]);
  return { order, steps, take, w, v: take.reduce((s, i) => s + items[i][2], 0) };
}
export const byValue = (it) => it[2];
export const byRatio = (it) => it[2] / it[1];
export function dp(items, cap) {
  const T = [Array(cap + 1).fill(0)];
  items.forEach(([, w, v], i) => T.push(T[i].map((up, k) => (w <= k ? Math.max(up, v + T[i][k - w]) : up))));
  const take = [];
  for (let i = items.length, k = cap; i > 0; i--) if (T[i][k] !== T[i - 1][k]) { take.unshift(i - 1); k -= items[i - 1][1]; }
  return { T, best: T[items.length][cap], take };
}
export function brute(items, cap) {
  let valid = 0;
  let best = 0;
  const n = items.length;
  for (let m = 0; m < 1 << n; m++) { let w = 0; let v = 0; for (let i = 0; i < n; i++) if (m & (1 << (n - 1 - i))) { w += items[i][1]; v += items[i][2]; } if (w <= cap) { valid++; best = Math.max(best, v); } }
  return { total: 1 << n, valid, best };
}
export function fractional(items, cap) { let w = 0; let v = 0; for (const i of greedy(items, Infinity, byRatio).order) { const take = Math.min(items[i][1], cap - w); if (take <= 0) break; w += take; v += (items[i][2] * take) / items[i][1]; } return v; }

const card = (it, i, { on = false, faded = false, mark = '' } = {}) => el('button', { class: `bg-oleh ${on ? 'dibawa' : ''} ${faded ? 'lewat' : ''}`, type: 'button', 'data-i': i }, el('span', { class: 'bg-ikon' }, it[3] || '📦'), el('b', null, it[0]), el('small', null, `${it[1]} kg · nilai ${it[2]}`), mark ? el('em', null, mark) : null);
const scale = (w, v, cap) => el('div', { class: `bg-timbang ${w > cap ? 'lebih' : ''}` }, el('div', { class: 'bg-isi', style: { width: `${Math.min(100, (w / cap) * 100)}%` } }), el('span', null, `${w} / ${cap} kg · nilai ${v}`));

// Tap items in or out of the suitcase.
function suitcase(host, ctx, { items = OLEH, cap = CAP, onChange, locked = () => false }) {
  const inBag = new Set();
  const row = el('div', { class: 'bg-rak' });
  const meter = el('div');
  const w = () => [...inBag].reduce((s, i) => s + items[i][1], 0);
  const v = () => [...inBag].reduce((s, i) => s + items[i][2], 0);
  const s = { inBag, w, v, draw, set(list) { inBag.clear(); list.forEach((i) => inBag.add(i)); draw(); } };
  function draw() {
    row.replaceChildren(...items.map((it, i) => onTap(card(it, i, { on: inBag.has(i) }), () => {
      if (locked()) return;
      if (inBag.has(i)) inBag.delete(i); else inBag.add(i);
      ctx.sound.tap(); draw(); if (onChange) onChange(s);
    })));
    meter.replaceChildren(scale(w(), v(), cap));
  }
  host.append(row, meter);
  draw();
  return s;
}

// Fill DP rows from `from` (1-based item row) to the last, choosing take / skip per cell.
function dpBoard(host, ctx, { from = 6, onDone }) {
  const { T } = dp(OLEH, CAP);
  const mine = T.map((r, i) => (i < from ? [...r] : Array(CAP + 1).fill(null)));
  let row = from;
  let col = 0;
  const grid = el('div', { class: 'bg-dp' });
  const ask = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const [nm, w, v] = OLEH[row - 1] || [];
    const up = row <= OLEH.length ? mine[row - 1][col] : null;
    const left = row <= OLEH.length && w <= col ? mine[row - 1][col - w] : null;
    grid.replaceChildren(el('span', { class: 'bg-dp-kepala' }, 'kg →'), ...Array.from({ length: CAP + 1 }, (_, k) => el('span', { class: 'bg-dp-kepala' }, k)),
      ...mine.flatMap((r, i) => [el('span', { class: 'bg-dp-baris' }, i ? `${i}. ${OLEH[i - 1][0]} (${OLEH[i - 1][1]} kg, ${OLEH[i - 1][2]})` : '(tidak ada)'),
        ...r.map((x, k) => el('span', { class: ['bg-dp-sel', i === row && k === col ? 'kini' : '', i === row - 1 && k === col ? 'atas' : '', i === row - 1 && w <= col && k === col - w ? 'kiri' : ''].join(' ') }, x ?? ''))]));
    if (row > OLEH.length) { ask.replaceChildren(); return; }
    ask.replaceChildren(button(`Tidak bawa: ${up}`, () => pick(up), 'primary'), w <= col ? button(`Bawa: ${v} + ${left} = ${v + left}`, () => pick(v + left), 'primary') : button(`Bawa: tidak muat (${w} kg > ${col} kg)`, () => pick(null)));
    say(msg, 'info', `Baris ${row} (${nm}), bagasi ${col} kg: pilih yang lebih besar.`);
  }
  function pick(x) {
    const want = T[row][col];
    if (x !== want) { ctx.mistake(); shake(grid); say(msg, 'bad', x === null ? 'Tidak muat, jadi hanya bisa "tidak bawa".' : `Pilih yang lebih besar: ${want}.`); return; }
    mine[row][col] = x;
    ctx.sound.tap();
    col++;
    if (col > CAP) { col = 0; row++; }
    draw();
    if (row > OLEH.length) { say(msg, '', `Sel kanan bawah: ${T[OLEH.length][CAP]}.`); onDone(); }
  }
  host.append(el('div', { class: 'bg-dp-gulir' }, grid), ask, msg);
  draw();
}

// ---------- Permainan: Konter Bagasi ----------
// Blocks whose length follows the weight, a 10-cell suitcase, two greedy
// robots to predict and beat, binary codes to check, the memory board
// (dynamic programming) with a traceback, event cards read off the board,
// and the fractional bound as the boss.

const KB_COL = ['#ea580c', '#7c3aed', '#0284c7', '#a16207', '#dc2626', '#16a34a', '#db2777'];
const nama = (items, list) => list.map((i) => items[i][0].toLowerCase()).join(', ');
const wOf = (items, list) => list.reduce((s, i) => s + items[i][1], 0);
const vOf = (items, list) => list.reduce((s, i) => s + items[i][2], 0);

function balok(it, i, { state = '', badge = '' } = {}) {
  return el('button', { class: `kb10-balok ${state}`, type: 'button', 'data-i': i, style: { '--kg': it[1], '--c': KB_COL[i % KB_COL.length] } },
    el('span', { class: 'kb10-nama' }, `${it[3] || '📦'} ${it[0]}`),
    el('span', { class: 'kb10-kg' }, `${it[1]} kg · nilai ${it[2]}`),
    badge ? el('em', null, badge) : null);
}

// The suitcase: cap cells, each item a coloured segment as long as its weight.
function koper(items, list, cap, cut = null) {
  const segs = list.map((i) => el('span', { class: 'kb10-isi', style: { '--kg': items[i][1], '--c': KB_COL[i % KB_COL.length] } }, items[i][3] || '📦'));
  if (cut) segs.push(el('span', { class: 'kb10-isi potong', style: { '--kg': cut[1], '--c': KB_COL[cut[0] % KB_COL.length] } }, `${items[cut[0]][3]}✂️`));
  const w = wOf(items, list) + (cut ? cut[1] : 0);
  const v = vOf(items, list) + (cut ? (items[cut[0]][2] * cut[1]) / items[cut[0]][1] : 0);
  return el('div', { class: 'kb10-koper-baris' },
    el('div', { class: 'kb10-koper', style: { '--cap': cap } }, segs),
    el('b', { class: 'kb10-angka' }, `🧳 ${w}/${cap} kg · nilai ${fmtNum(v, 1)}`));
}

// Misi 1: predict the robot's next pick; the robot then puts it in or rejects it.
function robotRound(wrap, ctx, { key, robot, rule, done }) {
  const items = OLEH;
  const g = greedy(items, CAP, key);
  let k = 0;
  const take = [];
  const out = [];
  const stage = el('div', { class: 'kb10-meja' });
  const msg = el('p', { class: 'reveal info' }, `Ketuk oleh-oleh yang akan diambil ${robot} berikutnya.`);
  const ratio = key === byRatio;
  function draw() {
    fill(stage, el('div', { class: 'kb10-robot' }, el('span', { class: 'kb10-robot-ikon' }, '🤖'), el('b', null, robot), el('small', null, rule)),
      el('div', { class: 'kb10-rak' }, items.map((it, i) => {
        const j = g.order.indexOf(i);
        const st = take.includes(i) ? 'masuk' : out.includes(i) ? 'tolak' : '';
        const b = balok(it, i, { state: st, badge: j < k ? (ratio ? `${fmtNum(it[2] / it[1], 1)}/kg` : `#${j + 1}`) : '' });
        if (!st) onTap(b, () => guess(i, b));
        return b;
      })), koper(items, take, CAP));
  }
  function guess(i, b) {
    if (k >= g.order.length) return;
    const want = g.order[k];
    if (i !== want) {
      ctx.mistake(); shake(b);
      say(msg, 'bad', ratio ? `${items[i][0]}: ${items[i][2]} : ${items[i][1]} = ${fmtNum(items[i][2] / items[i][1], 1)} per kg. Ada yang lebih besar.` : `${items[i][0]} bernilai ${items[i][2]}. Ada yang lebih besar.`);
      return;
    }
    const fit = g.steps[k][1];
    const w0 = wOf(items, take);
    if (fit) take.push(i); else out.push(i);
    k++;
    ctx.sound.tap();
    draw();
    if (k < g.order.length) say(msg, fit ? 'info' : 'bad', fit ? `${items[i][0]} masuk: ${w0 + items[i][1]} kg.` : `${items[i][0]} tidak muat: ${w0} + ${items[i][1]} > ${CAP}. Robot melewatinya.`);
    else { say(msg, '', `${robot}: ${nama(items, take)}. ${g.w} kg, nilai ${g.v}.`); done(); }
  }
  wrap.append(stage, msg);
  draw();
}

// Misi 2: pack the suitcase by hand and beat both robots with the best value.
function beatRound(wrap, ctx, { items = OLEH, cap = CAP, done }) {
  const best = dp(items, cap).best;
  const ra = greedy(items, cap, byValue).v;
  const rb = greedy(items, cap, byRatio).v;
  const bag = [];
  let finished = false;
  const stage = el('div', { class: 'kb10-meja' });
  const msg = el('p', { class: 'reveal info' }, `Ketuk oleh-oleh untuk memasukkan atau mengeluarkannya. Batas ${cap} kg.`);
  const chip = (who, v, me = false) => el('span', { class: `kb10-skor ${me ? 'aku' : ''} ${me && v > Math.max(ra, rb) ? 'menang' : ''}` }, who, el('b', null, v));
  function draw() {
    fill(stage, el('div', { class: 'kb10-papan-skor' }, chip('🤖 Robot A', ra), chip('🤖 Robot B', rb), chip('🧑 Tim kamu', vOf(items, bag), true)),
      el('div', { class: 'kb10-rak' }, items.map((it, i) => onTap(balok(it, i, { state: bag.includes(i) ? 'masuk' : '' }), (e) => tap(i, e.currentTarget)))),
      koper(items, bag, cap));
  }
  function tap(i, b) {
    if (finished) return;
    const at = bag.indexOf(i);
    if (at >= 0) bag.splice(at, 1);
    else if (wOf(items, bag) + items[i][1] > cap) { ctx.sound.bad(); shake(b); say(msg, 'bad', `Tidak muat: ${wOf(items, bag)} + ${items[i][1]} > ${cap} kg.`); return; }
    else bag.push(i);
    ctx.sound.tap();
    draw();
    const v = vOf(items, bag);
    if (v === best) { finished = true; say(msg, '', `Nilai ${best}: ${nama(items, bag)}. Robot A kalah ${best - ra}, Robot B kalah ${best - rb}.`); done(); }
    else if (v > Math.max(ra, rb)) say(msg, 'info', `Nilai ${v}: kedua robot sudah kalah. Bisakah lebih tinggi lagi?`);
    else say(msg, 'info', `Nilai ${v}, ${wOf(items, bag)} kg.`);
  }
  wrap.append(stage, el('div', { class: 'kode-baris' }, button('🧳 Serahkan koper', () => {
    if (finished) return;
    ctx.mistake(); shake(stage);
    const v = vOf(items, bag);
    say(msg, 'bad', v <= Math.max(ra, rb) ? `Nilai ${v}: robot masih menang.` : `Nilai ${v} belum yang terbaik.`);
  }, 'primary')), msg);
  draw();
}

// Misi 3: one team member checks the 16 codes that start with `member`.
function codeRound(wrap, ctx, { member, done }) {
  const items = OLEH;
  const codes = Array.from({ length: 16 }, (_, m) => {
    const c = member + m.toString(2).padStart(4, '0');
    const list = [...c].map((b, i) => (b === '1' ? i : -1)).filter((i) => i >= 0);
    return { c, list, w: wOf(items, list), v: vOf(items, list) };
  });
  const heavy = codes.filter((x) => x.w > CAP).length;
  const best = Math.max(...codes.filter((x) => x.w <= CAP).map((x) => x.v));
  const crossed = new Set();
  const peek = new Set();
  let phase = heavy ? 'coret' : 'pilih';
  let finished = false;
  const grid = el('div', { class: 'kb10-kode-grid' });
  const msg = el('p', { class: 'reveal info' }, heavy ? `Ada ${heavy} kode yang lebih dari ${CAP} kg. Coret semuanya.` : 'Ketuk kode bernilai terbesar.');
  const legend = el('div', { class: 'kb10-legenda' }, items.map((it, i) => el('span', { style: { '--c': KB_COL[i] } }, el('b', null, i + 1), `${it[3]} ${it[1]} kg · ${it[2]}`)));
  const who = `Kode diawali ${member}: kue kering ${member[0] === '1' ? 'dibawa' : 'tidak dibawa'}, sirup ${member[1] === '1' ? 'dibawa' : 'tidak dibawa'}.`;
  function draw() {
    fill(grid, codes.map((x, n) => {
      const st = crossed.has(n) ? 'coret' : finished && x.v === best && x.w <= CAP ? 'juara' : '';
      const t = el('button', { class: `kb10-kode ${st}`, type: 'button', 'data-c': x.c },
        el('b', null, el('span', { class: 'kb10-awal' }, x.c.slice(0, 2)), x.c.slice(2)),
        el('span', { class: 'kb10-ikon' }, x.list.length ? x.list.map((i) => items[i][3]).join('') : '—'),
        finished || peek.has(n) || crossed.has(n) ? el('small', null, `${x.w} kg · ${x.v}`) : null);
      return onTap(t, () => tap(n, t));
    }));
  }
  function tap(n, t) {
    if (finished || crossed.has(n)) return;
    const x = codes[n];
    if (phase === 'coret') {
      if (x.w <= CAP) { ctx.mistake(); shake(t); peek.add(n); draw(); say(msg, 'bad', `${x.c}: ${x.w} kg, masih sah.`); return; }
      crossed.add(n); ctx.sound.tap(); draw();
      if (crossed.size < heavy) { say(msg, 'info', `${x.c}: ${x.w} kg, dicoret. Sisa ${heavy - crossed.size}.`); return; }
      phase = 'pilih';
      say(msg, 'info', `${16 - heavy} kode sah. Sekarang ketuk yang nilainya terbesar.`);
      return;
    }
    if (x.v !== best) { ctx.mistake(); shake(t); peek.add(n); draw(); say(msg, 'bad', `${x.c}: nilai ${x.v}. Ada yang lebih besar.`); return; }
    finished = true; ctx.sound.good(); draw();
    say(msg, '', `${16 - heavy} sah, terbaik ${best} (${nama(items, x.list)}). Empat anggota tim: 64 kode, 28 sah.`);
    done();
  }
  wrap.append(el('p', { class: 'kb10-siapa' }, who), legend, grid, msg);
  draw();
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sci = (x) => { const e = Math.floor(Math.log10(x)); return `${fmtNum(x / 10 ** e, 1)} × 10${String(e).split('').map((d) => SUP[d]).join('')}`; };
function lama(s) {
  if (s < 1) return 'kurang dari 1 detik';
  if (s < 60) return `${fmtNum(s, 1)} detik`;
  if (s < 3600) return `${fmtNum(s / 60, 1)} menit`;
  if (s < 86400) return `${fmtNum(s / 3600, 1)} jam`;
  if (s < 3.156e7) return `${fmtNum(Math.round(s / 86400), 0)} hari`;
  const y = s / 3.156e7;
  return y < 1e5 ? `${fmtNum(y, y < 10 ? 1 : 0)} tahun` : `${sci(y)} tahun`;
}

// Misi 3 lanjutan: the checking machine. Find the fewest items that need more than a year.
function machineRound(wrap, ctx, { done }) {
  const RATE = 1e8;
  const YEAR = 3.156e7;
  const goal = Math.ceil(Math.log2(YEAR * RATE));
  let n = 6;
  let finished = false;
  const view = el('div', { class: 'kb10-mesin' });
  const msg = el('p', { class: 'reveal info' }, 'Mesin memeriksa 10⁸ kode per detik. Cari banyak oleh-oleh paling sedikit yang membuat mesin bekerja lebih dari setahun.');
  const draw = () => {
    const codes = 2 ** n;
    fill(view, el('span', null, '📦 ', el('b', null, n), ' oleh-oleh'), el('span', null, '🔢 2', el('sup', null, n), ' = ', el('b', null, codes < 1e7 ? fmtNum(codes) : sci(codes)), ' kode'), el('span', { class: codes / RATE > YEAR ? 'lewat' : '' }, '⏱️ ', el('b', null, lama(codes / RATE))));
  };
  const step = (d) => { if (finished) return; n = Math.max(1, Math.min(80, n + d)); ctx.sound.tap(); draw(); };
  wrap.append(view, el('div', { class: 'kode-baris' }, button('−5', () => step(-5)), button('−1', () => step(-1)), button('+1', () => step(1)), button('+5', () => step(5)),
    button('🔒 Kunci', () => {
      if (finished) return;
      if (n === goal) { finished = true; ctx.sound.good(); say(msg, '', `${goal} oleh-oleh: ${lama(2 ** goal / RATE)}. Tambah satu oleh-oleh, waktunya berlipat dua: 30 butuh 11 detik, 60 butuh 365 tahun.`); done(); return; }
      ctx.mistake(); shake(view);
      say(msg, 'bad', 2 ** n / RATE <= YEAR ? 'Belum setahun.' : `Sudah lebih dari setahun, tetapi ${n - 1} oleh-oleh juga.`);
    }, 'primary')), msg);
  draw();
}

// Misi 4: the memory board. Rows `from`..`to` are filled by tapping the larger of two
// highlighted cells; `trace` adds the walk back from the bottom-right cell.
function memoryRound(wrap, ctx, { items = OLEH, cap = CAP, from, to, trace = false, done }) {
  const { T } = dp(items, cap);
  const mine = T.map((r, i) => (i < from ? [...r] : Array(cap + 1).fill(null)));
  let row = from;
  let col = 0;
  let phase = 'isi';
  let ti = items.length;
  let tk = cap;
  const path = [[ti, tk]];
  const taken = [];
  const grid = el('div', { class: 'kb10-papan', style: { '--kol': cap + 1 } });
  const msg = el('p', { class: 'reveal info' });
  function copyForced() {
    while (row <= to) {
      const w = items[row - 1][1];
      while (col <= cap && col < w) { mine[row][col] = mine[row - 1][col]; col++; }
      if (col <= cap) return;
      row++; col = 0;
    }
  }
  function cands() {
    if (phase === 'isi' && row <= to) { const w = items[row - 1][1]; return { atas: [row - 1, col], kiri: w <= col ? [row - 1, col - w] : null, v: items[row - 1][2], cur: [row, col] }; }
    if (phase === 'jejak' && ti > 0) { const w = items[ti - 1][1]; return { atas: [ti - 1, tk], kiri: w <= tk ? [ti - 1, tk - w] : null, v: items[ti - 1][2], cur: [ti, tk] }; }
    return null;
  }
  function draw() {
    const c = cands();
    const is = (p, i, k) => p && p[0] === i && p[1] === k;
    fill(grid, el('span', { class: 'kb10-p-kepala' }, 'kg →'), Array.from({ length: cap + 1 }, (_, k) => el('span', { class: 'kb10-p-kepala' }, k)),
      mine.flatMap((r, i) => [
        el('span', { class: `kb10-p-baris ${taken.includes(i - 1) ? 'dibawa' : ''}`, style: i ? { '--c': KB_COL[(i - 1) % KB_COL.length] } : null },
          i ? el('b', null, `${i}. ${items[i - 1][3]} ${items[i - 1][0]}`) : el('b', null, '0. (kosong)'), i ? el('small', null, `${items[i - 1][1]} kg · ${items[i - 1][2]}`) : null),
        ...r.map((x, k) => {
          const cls = ['kb10-sel', c && is(c.cur, i, k) ? 'kini' : '', c && is(c.atas, i, k) ? 'atas' : '', c && is(c.kiri, i, k) ? 'kiri' : '', path.some((p) => is(p, i, k)) && phase !== 'isi' ? 'jejak' : '', i > to && x == null ? 'nanti' : ''].join(' ');
          const cell = el('span', { class: cls, 'data-sel': `${i},${k}` }, x ?? '', c && is(c.kiri, i, k) ? el('em', null, `+${c.v}`) : null);
          if (c && (is(c.atas, i, k) || is(c.kiri, i, k))) onTap(cell, () => pick(is(c.atas, i, k) ? 'atas' : 'kiri', cell));
          return cell;
        })]));
  }
  function prompt() {
    if (phase === 'isi') { const [nm, w, v] = items[row - 1]; say(msg, 'info', `Baris ${row}, ${nm}, kolom ${col} kg: tidak bawa (biru) atau bawa (hijau, +${v})?${col === w ? ` Kolom 0 sampai ${w - 1} disalin dari atas karena ${w} kg tidak muat.` : ''}`); }
    else say(msg, 'info', `Telusuri dari ${T[ti][tk]}: sama dengan sel atas berarti ${items[ti - 1][0].toLowerCase()} tidak dibawa; berbeda berarti dibawa.`);
  }
  function pick(kind, cell) {
    const c = cands();
    if (phase === 'isi') {
      const up = mine[row - 1][col];
      const val = kind === 'atas' ? up : c.v + mine[c.kiri[0]][c.kiri[1]];
      if (val !== T[row][col]) { ctx.mistake(); shake(cell); say(msg, 'bad', `${val} lebih kecil. Pilih yang lebih besar.`); return; }
      mine[row][col] = val;
      ctx.sound.tap();
      col++;
      if (col > cap) { row++; col = 0; }
      copyForced();
      if (row > to) {
        if (trace) { phase = 'jejak'; draw(); prompt(); return; }
        draw(); say(msg, '', `Baris ${from} sampai ${to} terisi. Sel ${to}, ${cap} kg = ${T[to][cap]}.`); done(); return;
      }
      draw(); prompt();
      return;
    }
    const keep = T[ti][tk] === T[ti - 1][tk];
    if ((kind === 'atas') !== keep) { ctx.mistake(); shake(cell); say(msg, 'bad', keep ? `${T[ti][tk]} sama dengan sel di atasnya, jadi ${items[ti - 1][0].toLowerCase()} tidak dibawa.` : `${T[ti][tk]} berbeda dari ${T[ti - 1][tk]} di atasnya, jadi ${items[ti - 1][0].toLowerCase()} dibawa: geser ${items[ti - 1][1]} kg ke kiri.`); return; }
    ctx.sound.tap();
    if (!keep) { taken.push(ti - 1); tk -= items[ti - 1][1]; }
    ti--;
    path.push([ti, tk]);
    draw();
    if (ti === 0) { taken.sort((a, b) => a - b); say(msg, '', `Isi terbaik: ${nama(items, taken)}. ${wOf(items, taken)} kg, nilai ${T[items.length][cap]}.`); done(); return; }
    prompt();
  }
  copyForced();
  wrap.append(el('div', { class: 'kb10-papan-gulir' }, grid), msg);
  draw(); prompt();
}

// Misi 5: event cards answered by tapping one cell of the finished board.
const KARTU10 = [
  { q: 'Petugas bandara: batas bagasi turun jadi 6 kg.', sel: [6, 6], a: '24: kue kering, kopi bubuk, kerupuk.' },
  { q: 'Troli bandara hanya kuat 9 kg. Batas jadi 9 kg.', sel: [6, 9], a: '28: kopi bubuk, kerupuk, sarung dan baju.' },
  { q: 'Sarung dan baju tertinggal di rumah. Batas tetap 10 kg.', sel: [5, 10], a: '27: kue kering, gula pasir, kopi bubuk.' },
  { q: 'Kue kering habis di toko. Batas tetap 10 kg.', sel: null, a: 'Setiap sel boleh memakai kue kering di baris 1, jadi papan tidak tahu nilai tanpa kue. Perlu papan baru: 28.' },
];
function eventRound10(wrap, ctx, { done }) {
  const items = OLEH;
  const { T } = dp(items, CAP);
  let n = 0;
  let wait = false;
  let hit = null;
  const cardBox = el('div');
  const grid = el('div', { class: 'kb10-papan', style: { '--kol': CAP + 1 } });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk sel yang menjawab kartu ini.');
  function draw() {
    const e = KARTU10[n];
    fill(cardBox, el('div', { class: 'pp8-kejadian' }, el('small', null, `🃏 Kartu kejadian ${n + 1} dari ${KARTU10.length}`), el('b', null, e.q), el('span', null, 'Berapa nilai terbaiknya?')));
    fill(grid, el('span', { class: 'kb10-p-kepala' }, 'kg →'), Array.from({ length: CAP + 1 }, (_, k) => el('span', { class: 'kb10-p-kepala' }, k)),
      T.flatMap((r, i) => [
        el('span', { class: 'kb10-p-baris', style: i ? { '--c': KB_COL[i - 1] } : null }, i ? el('b', null, `${i}. ${items[i - 1][3]} ${items[i - 1][0]}`) : el('b', null, '0. (kosong)'), i ? el('small', null, `${items[i - 1][1]} kg · ${items[i - 1][2]}`) : null),
        ...r.map((x, k) => onTap(el('span', { class: `kb10-sel ketuk ${hit && hit[0] === i && hit[1] === k ? 'juara' : ''}`, 'data-sel': `${i},${k}` }, x), (ev) => answer([i, k], ev.currentTarget)))]));
  }
  function answer(p, node) {
    if (wait || n >= KARTU10.length) return;
    const e = KARTU10[n];
    const ok = p ? e.sel && e.sel[0] === p[0] && e.sel[1] === p[1] : !e.sel;
    if (!ok) {
      ctx.mistake(); shake(node);
      say(msg, 'bad', p ? `Sel itu (${T[p[0]][p[1]]}) menjawab: ${p[0]} oleh-oleh pertama, batas ${p[1]} kg.` : 'Jawabannya ada di papan.');
      return;
    }
    ctx.sound.good();
    hit = p;
    draw();
    say(msg, '', e.a);
    n++;
    wait = true;
    if (n === KARTU10.length) { done(); return; }
    setTimeout(() => { wait = false; hit = null; draw(); say(msg, 'info', 'Ketuk sel yang menjawab kartu ini.'); }, 3200);
  }
  wrap.append(cardBox, el('div', { class: 'kb10-papan-gulir' }, grid), el('div', { class: 'kode-baris' }, button('🚫 Tidak bisa dibaca dari papan', (ev) => answer(null, ev?.currentTarget || grid))), msg);
  draw();
}

// Misi Bos: items may be cut. Fill by value per kg, cut the first item that does not fit.
function knifeRound(wrap, ctx, { done }) {
  const items = OLEH;
  const order = greedy(items, Infinity, byRatio).order;
  const take = [];
  let cutIdx = null;
  let cutKg = 1;
  let phase = 'isi';
  const stage = el('div', { class: 'kb10-meja' });
  const tools = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' }, 'Robot B kini boleh memotong. Ketuk oleh-oleh dari nilai per kg terbesar.');
  function draw() {
    fill(stage, el('div', { class: 'kb10-rak' }, items.map((it, i) => {
      const b = balok(it, i, { state: take.includes(i) ? 'masuk' : i === cutIdx && phase !== 'potong' ? 'masuk' : '', badge: `${fmtNum(it[2] / it[1], 1)}/kg` });
      if (!take.includes(i)) onTap(b, () => tap(i, b));
      return b;
    })), koper(items, take, CAP, cutIdx != null && phase !== 'potong' ? [cutIdx, cutKg] : null));
    if (phase === 'potong') {
      const it = items[cutIdx];
      fill(tools, button('−', () => { cutKg = Math.max(1, cutKg - 1); ctx.sound.tap(); draw(); }), el('span', { class: 'kb10-pisau' }, `✂️ ${it[0]}: `, el('b', null, `${cutKg} kg`), ` = ${it[2]} × ${cutKg} : ${it[1]} = ${fmtNum((it[2] * cutKg) / it[1], 1)}`), button('+', () => { cutKg = Math.min(it[1], cutKg + 1); ctx.sound.tap(); draw(); }),
        button('Masukkan potongan', () => {
          const room = CAP - wOf(items, take);
          if (cutKg !== room) { ctx.mistake(); shake(stage); say(msg, 'bad', cutKg > room ? `Tidak muat: sisa ruang ${room} kg.` : `Masih ada ruang ${room - cutKg} kg.`); return; }
          phase = 'tanya'; ctx.sound.good(); draw(); ask();
        }, 'primary'));
    } else if (phase === 'isi') fill(tools);
  }
  function tap(i, b) {
    if (phase !== 'isi') return;
    const want = order[take.length];
    if (i !== want) { ctx.mistake(); shake(b); say(msg, 'bad', `${items[i][0]}: ${fmtNum(items[i][2] / items[i][1], 1)} per kg. Ada yang lebih besar.`); return; }
    ctx.sound.tap();
    const room = CAP - wOf(items, take);
    if (items[i][1] <= room) { take.push(i); draw(); say(msg, 'info', `${items[i][0]} masuk. Sisa ruang ${CAP - wOf(items, take)} kg.`); return; }
    cutIdx = i; cutKg = 1; phase = 'potong'; draw();
    say(msg, 'info', `${items[i][0]} ${items[i][1]} kg tidak muat utuh di sisa ${room} kg. Potong secukupnya.`);
  }
  function ask() {
    const v = vOf(items, take) + (items[cutIdx][2] * cutKg) / items[cutIdx][1];
    say(msg, 'info', `Nilai ${fmtNum(v, 1)}: tidak ada koper, utuh atau dipotong, yang lebih dari ini. Apa artinya untuk koper utuh bernilai 34 di Misi 2?`);
    const opts = ctx.rand.shuffle([
      ['34 pasti terbaik: nilai koper utuh selalu bulat, dan 35 > 34,4', true],
      ['Belum pasti: mungkin ada koper utuh bernilai 35', false],
      ['34 kalah: 34,4 lebih besar, jadi ada isi utuh yang lebih baik', false],
    ]);
    fill(tools, opts.map(([l, ok]) => button(l, (ev) => {
      if (phase !== 'tanya') return;
      if (!ok) { ctx.mistake(); shake(ev?.currentTarget || tools); say(msg, 'bad', 'Koper utuh tidak bisa melebihi 34,4, dan nilainya bilangan bulat.'); return; }
      phase = 'selesai'; ctx.sound.good(); fill(tools);
      say(msg, '', 'Batas atas 34,4 dan nilai bulat: 34 pasti terbaik. Pemotongan memberi bukti tanpa mencoba 64 kode.');
      done();
    })));
  }
  wrap.append(stage, tools, msg);
  draw();
}

// Web variation: 5–7 random items and a 8–12 kg limit where the best fill is unique
// and both greedy robots lose.
function randomShop(rand) {
  const pool = [['Bakpia', '🥮'], ['Dodol', '🍬'], ['Batik', '👘'], ['Keripik', '🥔'], ['Madu', '🍯'], ['Teh', '🍵'], ['Sambal', '🌶️'], ['Kain tenun', '🧵'], ['Pempek', '🐟'], ['Jeruk', '🍊']];
  for (let t = 0; t < 500; t++) {
    const n = rand.int(5, 7);
    const cap = rand.int(8, 12);
    const items = rand.shuffle(pool).slice(0, n).map(([nm, ic]) => [nm, rand.int(1, 7), rand.int(2, 16), ic]);
    const best = dp(items, cap).best;
    if (greedy(items, cap, byValue).v >= best || greedy(items, cap, byRatio).v >= best) continue;
    let count = 0;
    for (let m = 0; m < 1 << n; m++) {
      let w = 0; let v = 0;
      for (let i = 0; i < n; i++) if (m & (1 << i)) { w += items[i][1]; v += items[i][2]; }
      if (w <= cap && v === best) count++;
    }
    if (count === 1) return { items, cap };
  }
  return { items: OLEH, cap: CAP };
}

const HEAD10 = {
  robot: ['Robot Rakus', 'Tebak oleh-oleh yang diambil robot berikutnya, sebelum robot bergerak.'],
  lawan: ['Kalahkan Robot', 'Isi koper tanpa melewati batas dengan nilai lebih tinggi dari kedua robot. Cari yang terbaik.'],
  semua: ['Periksa Semua', 'Setiap anggota tim memeriksa 16 kode. Coret yang terlalu berat, lalu ketuk yang terbaik.'],
  mesin: ['Mesin Pemeriksa', 'Mencoba semua kode: berapa oleh-oleh sampai mesin bekerja lebih dari setahun?'],
  papan: ['Papan Ingatan', 'Setiap sel memilih yang lebih besar: tidak bawa (sel biru) atau bawa (sel hijau ditambah nilainya).'],
  jejak: ['Papan Ingatan', 'Isi baris terakhir, lalu telusuri dari sel kanan bawah untuk menemukan isi koper.'],
  kejadian: ['Kartu Kejadian', 'Jawab setiap kartu dengan mengetuk satu sel papan, atau nyatakan tidak bisa dibaca.'],
  boss: ['Boleh Dipotong', 'Jika oleh-oleh boleh dipotong, berapa nilai tertinggi? Apa artinya bagi koper utuh?'],
};

export default {
  id: 'sma-10-bagasi',
  title: 'Bagasi Mudik Rani',
  topic: 'Masalah ransel: cara rakus, mencoba semua, dan pemrograman dinamis',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mencoba dua cara rakus untuk mengisi bagasi 10 kg dan menemukan di mana keduanya gagal, menghitung banyak kemungkinan bila mencoba semua, mengisi tabel pemrograman dinamis dan menelusuri isinya, serta membandingkan ketiga cara.',
  extraModes: [
    { id: 'koper', icon: '🧳', label: 'Koper Virtual', desc: 'Masukkan atau keluarkan oleh-oleh, jalankan cara rakus langkah demi langkah, dan bandingkan dengan nilai terbaik; daftar lembar kerja atau acak', create: createSuitcase },
    { id: 'dp', icon: '📋', label: 'Tabel Pemrograman Dinamis', desc: 'Isi tabel baris demi baris; layar menyorot dua sel yang dibandingkan dan memeriksa jawabannya', create: createTable },
    { id: 'giliran', icon: '🔁', label: 'Koper Bergiliran', desc: 'Setiap tim punya koper sendiri dan bergantian memasukkan atau mengeluarkan satu oleh-oleh; setelah enam putaran nilai koper dibandingkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bagasi kb10-main' });
    root.append(wrap);
    const shop = randomShop(ctx.rand);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD10[key], '🧳'));
      if (r === 0) { head('robot', 1); robotRound(wrap, ctx, { key: byValue, robot: 'Robot A', rule: 'nilai terbesar dulu', done: () => next() }); }
      else if (r === 1) { head('robot', 1); robotRound(wrap, ctx, { key: byRatio, robot: 'Robot B', rule: 'nilai per kg terbesar dulu', done: () => next() }); }
      else if (r === 2) { head('lawan', 2); beatRound(wrap, ctx, { done: () => next() }); }
      else if (r === 3) { head('semua', 3); codeRound(wrap, ctx, { member: '10', done: () => next(5200) }); }
      else if (r === 4) { head('papan', 4); memoryRound(wrap, ctx, { from: 2, to: 4, done: () => next() }); }
      else if (r === 5) { head('jejak', 4); memoryRound(wrap, ctx, { from: 5, to: 6, trace: true, done: () => next(5200) }); }
      else if (r === 6) { head('kejadian', 5); eventRound10(wrap, ctx, { done: () => next(5200) }); }
      else if (r === 7) { head('lawan', 2); beatRound(wrap, ctx, { items: shop.items, cap: shop.cap, done: () => next() }); }
      else if (r === 8) {
        head('semua', 3);
        codeRound(wrap, ctx, { member: '00', done: () => setTimeout(() => { if (solved) return; wrap.replaceChildren(); head('mesin', 3); machineRound(wrap, ctx, { done: () => next(5600) }); }, 3200) });
      } else { head('boss', 'Bos'); knifeRound(wrap, ctx, { done: () => next(5600) }); }
    }
    render();
  },
};

function randomItems(ctx) {
  const pool = [['Bakpia', '🥮'], ['Dodol', '🍬'], ['Batik', '👘'], ['Keripik', '🥔'], ['Madu', '🍯'], ['Teh', '🍵'], ['Sambal', '🌶️'], ['Kain tenun', '🧵']];
  return ctx.rand.shuffle(pool).slice(0, 6).map(([n, ic]) => [n, ctx.rand.int(1, 7), ctx.rand.int(2, 16), ic]);
}

function createSuitcase(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  let items = OLEH;
  const host = el('div', { class: 'bg-papan' });
  const out = el('p', { class: 'reveal hint' });
  let s;
  function reset() {
    host.replaceChildren();
    s = suitcase(host, ctx, { items, onChange: () => { out.textContent = s.w() > CAP ? 'Lebih dari 10 kg!' : `Nilai ${s.v()}.`; } });
    out.textContent = '';
  }
  const showGreedy = (key, label) => { const g = greedy(items, CAP, key); s.set(g.take); out.textContent = `${label}: urutan ${g.order.map((i) => items[i][0]).join(', ')} → ${g.w} kg, nilai ${g.v}.`; };
  wrap.append(el('p', { class: 'prompt' }, 'Koper virtual (batas 10 kg)'),
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Daftar lembar kerja'), () => { items = OLEH; reset(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Daftar acak'), () => { items = randomItems(ctx); reset(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: nilai terbesar'), () => showGreedy(byValue, 'Rakus nilai')), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: nilai per kg'), () => showGreedy(byRatio, 'Rakus nilai per kg')),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '⭐ Terbaik'), () => { const d = dp(items, CAP); s.set(d.take); const b = brute(items, CAP); out.textContent = `Terbaik ${d.best} (pemrograman dinamis); dari ${b.total} kemungkinan ada ${b.valid} yang sah.`; })),
    host, out);
  reset();
}

function createTable(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  const area = el('div');
  const go = (from) => { area.replaceChildren(); dpBoard(area, ctx, { from, onDone: () => { ctx.sound.win(); const { take } = dp(OLEH, CAP); area.append(el('p', { class: 'reveal' }, `Isi terbaik: ${take.map((i) => OLEH[i][0].toLowerCase()).join(', ')}.`)); } }); };
  wrap.append(el('p', { class: 'prompt' }, 'Tabel pemrograman dinamis'), el('div', { class: 'seg' }, [2, 3, 4, 5, 6].map((f) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `Mulai dari baris ${f}`), () => go(f)))), area);
  go(2);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act bagasi' });
  root.append(wrap);
  const TURNS = 6;
  function start(n) {
    const bags = Array.from({ length: n }, () => new Set());
    let t = 0;
    const w = (b) => [...b].reduce((s, i) => s + OLEH[i][1], 0);
    const v = (b) => [...b].reduce((s, i) => s + OLEH[i][2], 0);
    function play() {
      if (t >= n * TURNS) return finishBoard(wrap, ctx, { title: 'Enam putaran selesai. Nilai terbaik yang mungkin: 34.', pts: bags.map(v), unit: 'nilai', again: () => pickTeams(wrap, 'Koper Bergiliran', start) });
      const team = t % n;
      const bag = bags[team];
      const msg = el('p', { class: 'reveal hint' }, 'Ketuk satu oleh-oleh untuk dimasukkan atau dikeluarkan.');
      let locked = false;
      wrap.replaceChildren(scoreBar(bags.map(v), team), el('p', { class: 'prompt' }, `Putaran ${Math.floor(t / n) + 1}/${TURNS} · koper Tim ${team + 1}`),
        el('div', { class: 'bg-rak' }, OLEH.map((it, i) => onTap(card(it, i, { on: bag.has(i) }), () => {
          if (locked) return;
          if (!bag.has(i) && w(bag) + it[1] > CAP) { ctx.sound.bad(); say(msg, 'bad', `Tidak muat: ${w(bag)} + ${it[1]} > 10 kg.`); return; }
          locked = true;
          if (bag.has(i)) bag.delete(i); else bag.add(i);
          ctx.sound.tap(); t++; setTimeout(play, 700);
        }))), scale(w(bag), v(bag), CAP), el('div', { class: 'kode-baris' }, button('Lewati giliran', () => { if (!locked) { locked = true; t++; play(); } })), msg);
    }
    play();
  }
  pickTeams(wrap, 'Koper Bergiliran', start);
}
