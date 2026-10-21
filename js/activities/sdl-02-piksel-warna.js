// Piksel Wayang Berwarna — SD Lanjut (10–12 tahun), representasi gambar.
// Colour a gunungan from its colour codes, count the pixels, compare the
// same picture at three resolutions, and work out how many bits it needs.

import { el, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { paintGrid, swatches } from '../core/kisi.js';

const COLORS = ['#ffffff', '#1f2937', '#92400e', '#facc15'];
const NAMES = ['putih', 'hitam', 'cokelat', 'kuning'];
const BITS = ['0 0', '0 1', '1 0', '1 1'];

const parse = (rows) => rows.flatMap((r) => r.split('').map(Number));

// The worksheet's gunungan, 6 × 6.
const GUNUNGAN = ['001100', '013310', '133331', '132231', '012210', '022220'];
// The same gunungan drawn finer, 12 × 12.
const GUNUNGAN_12 = [
  '000001100000', '000011110000', '000113311000', '001133331100',
  '001333333100', '013333333310', '013332233310', '133322223331',
  '013322223310', '001122221100', '000122221000', '002222222200',
];
// Coarse 3 × 3: each pixel takes the colour most of its 2 × 2 block has.
const GUNUNGAN_3 = (() => {
  const g = parse(GUNUNGAN);
  const out = [];
  for (let r = 0; r < 3; r++) {
    let row = '';
    for (let c = 0; c < 3; c++) {
      const n = [0, 0, 0, 0];
      for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) n[g[(r * 2 + dr) * 6 + c * 2 + dc]]++;
      row += n.indexOf(Math.max(...n));
    }
    out.push(row);
  }
  return out;
})();

// More 6 × 6 pictures for later rounds.
const PICTURES = [
  { name: 'bunga', rows: ['030030', '333333', '032230', '333333', '001100', '011110'] },
  { name: 'rumah', rows: ['002200', '022220', '222222', '013310', '013210', '013210'] },
  { name: 'ikan', rows: ['000000', '033302', '333332', '313332', '033302', '000000'] },
  { name: 'payung', rows: ['003300', '033330', '333333', '001000', '001000', '011000'] },
];

const count = (rows, v) => rows.join('').split('').filter((x) => Number(x) === v).length;
const spaced = (row) => row.split('').join(' ');

// Colour a picture from its codes; each row turns green when it matches.
function paintRound(wrap, ctx, rows, name, next) {
  let done = false;
  const target = parse(rows);
  const msg = el('p', { class: 'reveal' });
  let pen = 1;
  const pal = swatches(COLORS, NAMES, (v) => { pen = v; });
  const grid = paintGrid({
    rows: rows.length, cols: rows[0].length, colors: COLORS,
    label: (r) => spaced(rows[r]),
    brush: () => pen,
    onChange() {
      if (done) return;
      grid.labels.forEach((l) => l.classList.remove('wrong', 'right'));
      if (grid.values.every((v, i) => v === target[i])) {
        done = true;
        grid.lock();
        grid.node.classList.add('solved');
        msg.textContent = `Jadi: ${name}! Putih ${count(rows, 0)}, hitam ${count(rows, 1)}, cokelat ${count(rows, 2)}, kuning ${count(rows, 3)} piksel.`;
        next();
      }
    },
  });
  const check = button('Periksa', () => {
    if (done) return;
    let wrong = 0;
    rows.forEach((code, r) => {
      const bad = grid.row(r).join('') !== code;
      grid.labels[r].classList.toggle('wrong', bad);
      grid.labels[r].classList.toggle('right', !bad);
      if (bad) wrong++;
    });
    if (wrong) { ctx.mistake(); shake(grid.node); }
  }, 'small');
  wrap.append(
    el('p', { class: 'prompt' }, 'Pilih warna, lalu warnai piksel sesuai kode di kiri.'),
    el('div', { class: 'pix-layout' }, grid.node, el('div', { class: 'pix-side' }, pal.node, legend(), check)),
    msg);
}

function legend() {
  return el('table', { class: 'count-table legend' }, el('tbody', null,
    COLORS.map((c, v) => el('tr', null, el('td', null, el('i', { class: 'dot', style: { background: c } })), el('td', null, `${v} = ${NAMES[v]}`), el('td', { class: 'num' }, BITS[v])))));
}

// The gunungan at 3 × 3, 6 × 6 and 12 × 12, switched with a slider.
function resolutionView({ onSize } = {}) {
  const sizes = [GUNUNGAN_3, GUNUNGAN, GUNUNGAN_12];
  const box = el('div', { class: 'res-box' });
  const info = el('p', { class: 'res-info' });
  const slider = el('input', { type: 'range', min: 0, max: 2, step: 1, value: 1, class: 'res-slider', 'aria-label': 'Resolusi' });
  function show(k) {
    const rows = sizes[k];
    const n = rows.length;
    const g = paintGrid({ rows: n, cols: n, colors: COLORS, values: parse(rows), cls: 'view', reserve: '64cqmin' });
    g.lock();
    box.replaceChildren(g.node);
    info.textContent = `${n} × ${n} = ${n * n} piksel · ${n * n} angka · ${n * n * 2} bit`;
    onSize?.(n);
  }
  slider.addEventListener('input', () => show(Number(slider.value)));
  show(1);
  return el('div', { class: 'res-view' }, box, el('label', { class: 'res-label' }, 'Resolusi', slider), info);
}

const QUESTIONS = [
  { q: 'Berapa piksel kuning pada gunungan?', a: 8, opts: [6, 8, 10, 12] },
  { q: 'Geser resolusinya. Makin banyak piksel, gambar makin jelas, tetapi angka yang disimpan makin …', a: 'banyak', opts: ['banyak', 'sedikit', 'sama saja'], view: true },
  { q: 'Setiap piksel butuh 2 bit (lihat tabel). Berapa bit untuk gambar 6 × 6?', a: 72, opts: [12, 36, 72, 144], legend: true },
  { q: 'Kalau ingin 8 warna, berapa bit untuk setiap piksel?', a: 3, opts: [2, 3, 4, 8], legend: true },
];

export default {
  id: 'sdl-02-piksel-warna',
  title: 'Piksel Wayang Berwarna',
  topic: 'Representasi gambar dan warna',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🎨',
  source: { name: 'CS Unplugged: Image Representation', url: 'https://www.csunplugged.org/en/topics/image-representation/' },
  rounds: 6,
  maxPlayers: 4,
  goal: 'Murid mewarnai gambar dari kode warna, menghitung piksel, membandingkan resolusi, dan menghitung bit yang dibutuhkan sebuah gambar.',
  extraModes: [
    { id: 'pasangan', icon: '👫', label: 'Berpasangan', desc: 'Satu menggambar, hanya kodenya yang dikirim; teman menggambar ulang dari kode', create: createPair },
    { id: 'kreasi', icon: '✏️', label: 'Karyaku', desc: 'Gambar 6 × 6 dengan empat warna, kodenya muncul langsung', create: createOwn },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act piksel' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2200); };
      if (r === 0) { paintRound(wrap, ctx, GUNUNGAN, 'gunungan wayang', next); return; }
      const q = QUESTIONS[r - 1];
      if (q) {
        const subject = q.view ? resolutionView() : q.legend ? legend() : paintGrid({ rows: 6, cols: 6, colors: COLORS, values: parse(GUNUNGAN), cls: 'view', label: (k) => spaced(GUNUNGAN[k]) }).node;
        choice(wrap, { prompt: q.q, subject, ctx, onRight: next, columns: q.opts.length, options: q.opts.map((x) => ({ label: String(x), correct: x === q.a })) });
        return;
      }
      const pic = PICTURES[(r - 5 + ctx.rand.int(0, PICTURES.length - 1)) % PICTURES.length];
      paintRound(wrap, ctx, pic.rows, pic.name, next);
    }
    render();
  },
};

// Karyaku: free drawing; the code of each row updates live.
function createOwn(root) {
  const wrap = el('div', { class: 'act piksel' });
  let pen = 1;
  const pal = swatches(COLORS, NAMES, (v) => { pen = v; });
  const grid = paintGrid({ rows: 6, cols: 6, colors: COLORS, label: (r, g) => g.row(r).join(' '), brush: () => pen, onChange: () => grid.relabel() });
  wrap.append(
    el('p', { class: 'prompt' }, 'Buat gambar 6 × 6 dengan keempat warna. Kode setiap baris muncul di kiri.'),
    el('div', { class: 'pix-layout' }, grid.node, el('div', { class: 'pix-side' }, pal.node,
      button('Hapus semua', () => grid.fill(new Array(36).fill(0)), 'small ghost'),
      el('p', { class: 'small-note' }, '36 piksel × 2 bit = 72 bit'))));
  root.append(wrap);
}

// Berpasangan: A draws and sends only the code; B redraws from the code.
function createPair(root, ctx) {
  const wrap = el('div', { class: 'act pair' });
  root.append(wrap);
  const left = el('div', { class: 'pair-side', style: { '--player': '#2563eb' } });
  const right = el('div', { class: 'pair-side', style: { '--player': '#ea580c' } });
  wrap.append(left, right);
  let penA = 1;
  let penB = 1;
  let sent = null;
  const palA = swatches(COLORS, NAMES, (v) => { penA = v; });
  const palB = swatches(COLORS, NAMES, (v) => { penB = v; });
  const a = paintGrid({ rows: 6, cols: 6, colors: COLORS, label: (r, g) => g.row(r).join(' '), brush: () => penA, onChange: () => a.relabel() });
  const b = paintGrid({ rows: 6, cols: 6, colors: COLORS, label: (r) => (sent ? sent[r].join(' ') : ''), brush: () => penB });
  b.lock();
  const cover = el('div', { class: 'cover' }, '🙈 Gambar disembunyikan');
  cover.hidden = true;
  const leftMsg = el('p', { class: 'prompt' }, 'Anak 1: buat gambar, lalu kirim kodenya saja.');
  const rightMsg = el('p', { class: 'prompt' }, 'Anak 2: tunggu kode dari temanmu.');
  const result = el('p', { class: 'reveal' });
  const sendBtn = button('Sembunyikan & kirim kode ➜', () => {
    sent = Array.from({ length: 6 }, (_, r) => a.row(r));
    b.relabel();
    a.lock();
    b.lock(false);
    cover.hidden = false;
    sendBtn.hidden = true;
    compareBtn.hidden = false;
    leftMsg.textContent = 'Kode sudah dikirim. Jangan intip!';
    rightMsg.textContent = 'Anak 2: warnai sesuai kode.';
    ctx.sound.good();
  }, 'small primary');
  const compareBtn = button('Bandingkan', () => {
    cover.hidden = true;
    b.lock();
    let wrong = 0;
    sent.forEach((row, r) => {
      const bad = b.row(r).join('') !== row.join('');
      b.labels[r].classList.toggle('wrong', bad);
      b.labels[r].classList.toggle('right', !bad);
      if (bad) wrong++;
    });
    result.textContent = wrong ? `${wrong} baris berbeda. Kode mana yang salah dibaca?` : 'Sama persis! 🎉';
    result.classList.toggle('bad', wrong > 0);
    if (wrong) ctx.sound.bad(); else ctx.sound.win();
    compareBtn.hidden = true;
    againBtn.hidden = false;
  }, 'small primary');
  const againBtn = button('Ulangi', () => {
    sent = null;
    a.fill(new Array(36).fill(0));
    b.fill(new Array(36).fill(0));
    b.labels.forEach((l) => l.classList.remove('wrong', 'right'));
    a.lock(false);
    b.lock();
    result.textContent = '';
    sendBtn.hidden = false;
    againBtn.hidden = true;
    leftMsg.textContent = 'Anak 1: buat gambar, lalu kirim kodenya saja.';
    rightMsg.textContent = 'Anak 2: tunggu kode dari temanmu.';
  }, 'small ghost');
  compareBtn.hidden = true;
  againBtn.hidden = true;
  left.append(leftMsg, el('div', { class: 'board-wrap' }, a.node, cover), palA.node, sendBtn);
  right.append(rightMsg, b.node, palB.node, el('div', { class: 'row tools' }, compareBtn, againBtn, result));
}
