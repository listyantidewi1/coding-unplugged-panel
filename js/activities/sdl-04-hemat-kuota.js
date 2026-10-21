// Hemat Kuota — SD Lanjut (10–12 tahun), kompresi data.
// Every character sent costs one quota. Write each row of a woven motif
// the plain way (PPHH…) or the short way (2P2H…), find the row where the
// short way is worse, and pick the cheapest way for every row.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { paintGrid } from '../core/kisi.js';

const COLORS = ['#ffffff', '#1f2937'];
const CH = ['P', 'H'];
const COLS = 10;

// The worksheet's motif and Nenek's reply.
const MOTIF = ['PPPPPPPPPP', 'PPHHHHHHPP', 'PHPHPHPHPH', 'PPHHHHHHPP', 'PPPPPPPPPP'];
const REPLY = ['2H6P2H', '4P2H4P', '2H6P2H'];

export const short = (row) => row.replace(/(.)\1*/g, (run) => `${run.length}${run[0]}`);
// Short message → row of P/H, or null when it is not exactly COLS long.
export function expand(msg, len = COLS) {
  if (!/^(\d+[PH])+$/.test(msg)) return null;
  const row = msg.replace(/(\d+)([PH])/g, (_, n, c) => c.repeat(Number(n)));
  return row.length === len ? row : null;
}
const toVals = (rows) => rows.join('').split('').map((c) => CH.indexOf(c));
const rowOf = (grid, r) => grid.row(r).map((v) => CH[v]).join('');

// Live table: plain and short message and quota for every row.
function quotaTable(rowsFn) {
  const body = el('tbody');
  const foot = el('tfoot');
  const node = el('table', { class: 'count-table kuota-table' },
    el('thead', null, el('tr', null, ['Baris', 'Cara biasa', 'Cara ringkas', 'Biasa', 'Ringkas'].map((h) => el('td', null, h)))), body, foot);
  let best = false;
  function draw() {
    const rows = rowsFn();
    let a = 0;
    let b = 0;
    let m = 0;
    body.replaceChildren(...rows.map((row, r) => {
      const s = short(row);
      a += row.length;
      b += s.length;
      m += Math.min(row.length, s.length);
      const pick = best ? (s.length < row.length ? 'b' : 'a') : '';
      return el('tr', null, el('td', { class: 'num' }, r + 1), el('td', { class: `mono ${pick === 'a' ? 'pick' : ''}` }, row),
        el('td', { class: `mono ${pick === 'b' ? 'pick' : ''}` }, s), el('td', { class: 'num' }, row.length), el('td', { class: `num ${s.length > row.length ? 'worse' : ''}` }, s.length));
    }));
    foot.replaceChildren(el('tr', { class: 'total' }, el('td', null, 'Jumlah'), el('td', null, ''), el('td', null, best ? `Paling hemat: ${m}` : ''), el('td', { class: 'num' }, a), el('td', { class: 'num' }, b)));
  }
  return { node, draw, best(on) { best = on; draw(); } };
}

// Keypad for writing a short message: digits, P, H, delete.
function keypad(onChange, max = 24) {
  let msg = '';
  const out = el('div', { class: 'msg-out' }, '…');
  const quota = el('span', { class: 'open-count' }, 'Kuota: 0');
  const set = (m) => {
    msg = m;
    out.textContent = msg || '…';
    quota.textContent = `Kuota: ${msg.length}`;
    onChange(msg);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'P', 'H'].map((k) => onTap(el('button', { class: `key ${k === 'P' ? 'p' : k === 'H' ? 'h' : ''}`, type: 'button' }, k), () => { if (msg.length < max) set(msg + k); }));
  keys.push(onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => set(msg.slice(0, -1))));
  return {
    node: el('div', { class: 'keypad-wrap' }, el('div', { class: 'row' }, out, quota), el('div', { class: 'keys keypad' }, keys)),
    get: () => msg,
    set,
  };
}

// A static motif strip, highlighting one row.
function motifView(rows, hi = -1) {
  const g = paintGrid({ rows: rows.length, cols: COLS, colors: COLORS, values: toVals(rows), cls: 'view motif', label: (r) => `${r + 1}`, reserve: '58cqmin' });
  g.lock();
  if (hi >= 0) g.labels[hi].classList.add('hi');
  return g.node;
}

// Write the short message for one row of the motif.
function writeRound(wrap, ctx, rows, r, next) {
  const want = short(rows[r]);
  let done = false;
  const msg = el('p', { class: 'reveal' });
  const pad = keypad(() => {});
  const send = button('Kirim ➜', () => {
    if (done) return;
    const m = pad.get();
    if (m !== want) {
      ctx.mistake();
      shake(pad.node);
      const got = expand(m);
      msg.className = 'reveal bad';
      msg.textContent = got ? 'Pesan itu menghasilkan motif lain. Periksa urutannya.' : 'Pesan harus berisi angka lalu warna, tepat 10 kotak.';
      return;
    }
    done = true;
    msg.className = 'reveal';
    msg.textContent = `Benar! ${want}: ${want.length} kuota, cara biasa ${COLS} kuota.`;
    next();
  }, 'primary');
  wrap.append(
    el('p', { class: 'prompt' }, `Tulis baris ${r + 1} dengan cara ringkas (banyak kotak lalu warnanya).`),
    el('div', { class: 'kuota-layout' }, motifView(rows, r), el('div', { class: 'kuota-side' }, pad.node, send)),
    msg);
}

// Colour a grid from short messages (Nenek's reply).
function readRound(wrap, ctx, msgs, next) {
  const rows = msgs.map((m) => expand(m));
  const target = toVals(rows);
  let done = false;
  const grid = paintGrid({
    rows: msgs.length, cols: COLS, colors: COLORS, label: (r) => msgs[r], brush: (v) => 1 - v, reserve: '40cqmin',
    onChange() {
      if (done || !grid.values.every((v, i) => v === target[i])) return;
      done = true;
      grid.lock();
      grid.node.classList.add('solved');
      next();
    },
  });
  const check = button('Periksa', () => {
    if (done) return;
    let wrong = 0;
    msgs.forEach((_, r) => {
      const bad = rowOf(grid, r) !== rows[r];
      grid.labels[r].classList.toggle('wrong', bad);
      grid.labels[r].classList.toggle('right', !bad);
      if (bad) wrong++;
    });
    if (wrong) { ctx.mistake(); shake(grid.node); }
  }, 'small');
  wrap.append(el('p', { class: 'prompt' }, 'Nenek membalas dengan cara ringkas. Ketuk kotak yang hitam (H).'), grid.node, check);
}

function randomRow(rand) {
  // Mostly long runs (cheap to shorten), sometimes a busy row.
  if (rand.next() < 0.25) return Array.from({ length: COLS }, () => rand.pick(CH)).join('');
  let row = '';
  let c = rand.pick(CH);
  while (row.length < COLS) {
    row += c.repeat(Math.min(COLS - row.length, rand.int(1, 5)));
    c = c === 'P' ? 'H' : 'P';
  }
  return row;
}

export default {
  id: 'sdl-04-hemat-kuota',
  title: 'Hemat Kuota',
  topic: 'Kompresi data',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '📶',
  source: { name: 'CS Unplugged: Image Representation', url: 'https://www.csunplugged.org/en/topics/image-representation/' },
  rounds: 7,
  maxPlayers: 4,
  goal: 'Murid meringkas motif dengan menulis banyak kotak lalu warnanya, menghitung kuota, menemukan baris yang justru lebih boros, dan memilih cara paling hemat untuk setiap baris.',
  extraModes: [
    { id: 'motif', icon: '🧵', label: 'Motif dan Kuota', desc: 'Warnai motif 10 × 5, lihat pesan biasa dan ringkas setiap baris, lalu tekan Paling Hemat', create: createExplore },
    { id: 'nenek', icon: '📨', label: 'Kirim ke Nenek', desc: 'Tulis pesan ringkas 3 baris; layar menguraikannya menjadi motif untuk diperiksa', create: createSend },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kuota' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2000); };
      if (r === 0) writeRound(wrap, ctx, MOTIF, 1, next);
      else if (r === 1) {
        choice(wrap, {
          prompt: 'Baris mana yang justru lebih boros dengan cara ringkas?', subject: motifView(MOTIF), ctx, onRight: next, columns: 5,
          options: [1, 2, 3, 4, 5].map((n) => ({ label: `Baris ${n}`, correct: n === 3 })),
        });
      } else if (r === 2) {
        const t = quotaTable(() => MOTIF);
        t.draw();
        choice(wrap, {
          prompt: 'Boleh pilih cara biasa atau ringkas untuk setiap baris. Berapa kuota paling sedikit untuk seluruh motif?', subject: t.node, ctx, onRight: next, columns: 4,
          options: [28, 30, 38, 50].map((n) => ({ label: String(n), correct: n === 28 })),
        });
      } else if (r === 3) readRound(wrap, ctx, REPLY, next);
      else if (r % 2 === 0) {
        const rows = Array.from({ length: 3 }, () => randomRow(ctx.rand));
        writeRound(wrap, ctx, rows, ctx.rand.int(0, 2), next);
      } else {
        readRound(wrap, ctx, Array.from({ length: 3 }, () => short(randomRow(ctx.rand))), next);
      }
    }
    render();
  },
};

// Motif dan Kuota: free motif with the live table and "Paling Hemat".
function createExplore(root) {
  const wrap = el('div', { class: 'act kuota' });
  root.append(wrap);
  const grid = paintGrid({ rows: 5, cols: COLS, colors: COLORS, values: toVals(MOTIF), brush: (v) => 1 - v, reserve: '62cqmin', onChange: () => table.draw() });
  const table = quotaTable(() => Array.from({ length: 5 }, (_, r) => rowOf(grid, r)));
  let best = false;
  const bestBtn = button('⭐ Paling Hemat', () => { best = !best; table.best(best); bestBtn.classList.toggle('on', best); }, 'small');
  table.draw();
  wrap.append(
    el('p', { class: 'prompt' }, 'Ketuk kotak untuk mengubah motif. Amati kuotanya.'),
    grid.node, table.node,
    el('div', { class: 'row' }, bestBtn, button('Kosongkan', () => { grid.fill(new Array(5 * COLS).fill(0)); table.draw(); }, 'small ghost')));
}

// Kirim ke Nenek: three short messages are expanded into a motif.
function createSend(root, ctx) {
  const wrap = el('div', { class: 'act kuota' });
  root.append(wrap);
  const msgs = ['', '', ''];
  let row = 0;
  const lines = msgs.map((_, r) => onTap(el('button', { class: 'msg-line', type: 'button' }), () => { row = r; pad.set(msgs[r]); draw(); }));
  const pad = keypad((m) => { msgs[row] = m; draw(); });
  const out = el('div', { class: 'nenek-out' });
  const note = el('p', { class: 'reveal' });
  function draw() {
    lines.forEach((l, r) => { l.textContent = `Baris ${r + 1}: ${msgs[r] || '…'}`; l.classList.toggle('on', r === row); });
  }
  const send = button('📨 Kirim ke Nenek', () => {
    const rows = msgs.map((m) => expand(m));
    const bad = rows.findIndex((x) => !x);
    if (bad >= 0) {
      ctx.sound.bad();
      note.className = 'reveal bad';
      note.textContent = `Pesan baris ${bad + 1} belum tepat 10 kotak (angka lalu P atau H).`;
      out.replaceChildren();
      return;
    }
    ctx.sound.win();
    const total = msgs.reduce((t, m) => t + m.length, 0);
    note.className = 'reveal';
    note.textContent = `Nenek menerima motif ini. Kuota: ${total} (cara biasa ${3 * COLS}).`;
    out.replaceChildren(motifView(rows));
  }, 'primary');
  draw();
  wrap.append(
    el('p', { class: 'prompt' }, 'Rancang motif 3 baris yang sangat hemat. Pilih baris, tulis pesannya, lalu kirim.'),
    el('div', { class: 'kuota-layout' }, el('div', { class: 'kuota-side' }, lines, pad.node), el('div', { class: 'kuota-side' }, send, out)),
    note);
}
