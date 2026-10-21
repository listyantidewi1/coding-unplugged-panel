// Gambar Rahasia dari Kode Biner — SD Awal (7–9 tahun), topik Representasi
// gambar dan piksel. Concept inspired by CS Unplugged "Image Representation":
// colour the grid from each row's code (1 = hitam, 0 = putih).

import { el, onTap, button, shake } from '../core/util.js';

// Puzzles grow from 5×5 to 8×8 so the race starts gently.
const IMAGES = {
  5: [
    { name: 'hati', rows: ['01010', '11111', '11111', '01110', '00100'] },
    { name: 'panah', rows: ['00100', '01110', '10101', '00100', '00100'] },
    { name: 'tanda tambah', rows: ['00100', '00100', '11111', '00100', '00100'] },
    { name: 'senyum', rows: ['01010', '01010', '00000', '10001', '01110'] },
  ],
  6: [
    { name: 'perahu', rows: ['000100', '001100', '011100', '000100', '111111', '011110'] },
    { name: 'ikan', rows: ['000000', '101110', '111011', '111111', '101110', '000000'] },
    { name: 'pohon', rows: ['001100', '011110', '111111', '011110', '001100', '001100'] },
  ],
  8: [
    { name: 'wajah tersenyum', rows: ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'] },
    { name: 'kucing', rows: ['10000001', '11000011', '11111111', '10111101', '11111111', '11011011', '01100110', '00111100'] },
    { name: 'robot', rows: ['00011000', '01111110', '01011010', '01111110', '00111100', '11111111', '10111101', '00100100'] },
    { name: 'hati besar', rows: ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'] },
  ],
};
// The worksheet's secret picture is always the third puzzle.
const WORKSHEET_IMAGE = { name: 'rumah', rows: ['00011000', '00111100', '01111110', '11111111', '01000010', '01011010', '01011010', '01111110'] };
const SIZES = [5, 6, 8, 8];

function pickImage(rand, round) {
  if (round === 2) return WORKSHEET_IMAGE;
  return rand.pick(IMAGES[SIZES[Math.min(round, SIZES.length - 1)]]);
}

// A grid of n×n cells where touches toggle cells and dragging paints.
// Each finger keeps its own paint colour, so two children can paint at once.
function makeGrid(n, rowLabel, onChange) {
  const cells = [];
  const labels = [];
  const board = el('div', { class: 'pixel-board', style: { '--n': n } });
  for (let r = 0; r < n; r++) {
    const label = el('div', { class: 'row-code' }, rowLabel(r));
    labels.push(label);
    board.append(label);
    for (let c = 0; c < n; c++) {
      const cell = el('div', { class: 'cell', 'data-r': r, 'data-c': c });
      cells.push(cell);
      board.append(cell);
    }
  }
  const values = new Array(n * n).fill(0);
  const paint = new Map();

  function set(i, v) {
    if (values[i] === v) return;
    values[i] = v;
    cells[i].classList.toggle('on', v === 1);
    onChange();
  }
  function cellAt(x, y) {
    const t = document.elementFromPoint(x, y);
    return t && t.classList.contains('cell') && board.contains(t) ? cells.indexOf(t) : -1;
  }
  board.addEventListener('pointerdown', (e) => {
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const v = values[i] ? 0 : 1;
    paint.set(e.pointerId, v);
    set(i, v);
  });
  board.addEventListener('pointermove', (e) => {
    if (!paint.has(e.pointerId)) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i >= 0) set(i, paint.get(e.pointerId));
  });
  const end = (e) => paint.delete(e.pointerId);
  board.addEventListener('pointerup', end);
  board.addEventListener('pointercancel', end);

  return {
    board, labels, values,
    rowBits: (r) => values.slice(r * n, r * n + n).join(''),
    clear() { values.forEach((_, i) => set(i, 0)); },
  };
}

const spaced = (bits) => bits.split('').join(' ');

function createPuzzles(root, ctx) {
  const wrap = el('div', { class: 'act biner-img' });
  root.append(wrap);

  function render() {
    const img = pickImage(ctx.rand, ctx.round);
    const n = img.rows.length;
    let done = false;
    const reveal = el('p', { class: 'reveal' });
    const grid = makeGrid(n, (r) => spaced(img.rows[r]), () => {
      if (done) return;
      grid.labels.forEach((l) => l.classList.remove('wrong', 'right'));
      if (img.rows.every((bits, r) => grid.rowBits(r) === bits)) {
        done = true;
        grid.board.classList.add('solved');
        reveal.textContent = `Gambar rahasia: ${img.name}!`;
        if (ctx.solved()) setTimeout(render, 1800);
      }
    });
    // "Periksa" marks every row: green when it matches its code, red when not.
    const check = button('Periksa', () => {
      if (done) return;
      let wrong = 0;
      img.rows.forEach((bits, r) => {
        const bad = grid.rowBits(r) !== bits;
        grid.labels[r].classList.toggle('wrong', bad);
        grid.labels[r].classList.toggle('right', !bad);
        if (bad) wrong++;
      });
      if (wrong) { ctx.mistake(); shake(grid.board); }
    }, 'small');
    const erase = button('Hapus', () => { if (!done) grid.clear(); }, 'small ghost');

    wrap.replaceChildren(
      el('p', { class: 'prompt' }, '1 = hitam, 0 = putih. Warnai baris demi baris!'),
      grid.board,
      el('div', { class: 'row tools' }, check, erase, reveal));
  }
  render();
}

// "Buat gambarmu sendiri": blank 8×8, the code of each row updates live.
function createOwn(root) {
  const n = 8;
  const wrap = el('div', { class: 'act biner-img' });
  const grid = makeGrid(n, () => spaced('0'.repeat(n)), () => {
    grid.labels.forEach((l, r) => { l.textContent = spaced(grid.rowBits(r)); });
  });
  wrap.append(
    el('p', { class: 'prompt' }, 'Gambarlah karyamu sendiri. Kode setiap baris muncul di kiri.'),
    grid.board,
    el('div', { class: 'row tools' }, button('Hapus semua', () => grid.clear(), 'small ghost')));
  root.append(wrap);
}

// "Mode berpasangan": child A draws, hides the picture and sends only the
// code; child B redraws from the code; then both pictures are compared.
function createPair(root, ctx) {
  const n = 8;
  const wrap = el('div', { class: 'act pair' });
  root.append(wrap);

  const left = el('div', { class: 'pair-side', style: { '--player': '#2563eb' } });
  const right = el('div', { class: 'pair-side', style: { '--player': '#ea580c' } });
  wrap.append(left, right);

  let sentRows = null;
  const a = makeGrid(n, () => spaced('0'.repeat(n)), () => {
    a.labels.forEach((l, r) => { l.textContent = spaced(a.rowBits(r)); });
  });
  const b = makeGrid(n, () => '', () => {});
  const cover = el('div', { class: 'cover' }, '🙈 Gambar disembunyikan');
  const leftMsg = el('p', { class: 'prompt' }, 'Anak 1: buat gambar rahasia, lalu kirim kodenya.');
  const rightMsg = el('p', { class: 'prompt' }, 'Anak 2: tunggu kode dari temanmu.');
  const result = el('p', { class: 'reveal' });
  const sendBtn = button('Sembunyikan & kirim kode ➜', send, 'small primary');
  const compareBtn = button('Bandingkan', compare, 'small primary');
  const againBtn = button('Ulangi', reset, 'small ghost');
  compareBtn.hidden = true;
  againBtn.hidden = true;

  left.append(leftMsg, el('div', { class: 'board-wrap' }, a.board, cover), el('div', { class: 'row tools' }, sendBtn));
  right.append(rightMsg, b.board, el('div', { class: 'row tools' }, compareBtn, againBtn, result));
  b.board.classList.add('locked');
  cover.hidden = true;

  function send() {
    sentRows = a.labels.map((_, r) => a.rowBits(r));
    b.labels.forEach((l, r) => { l.textContent = spaced(sentRows[r]); });
    a.board.classList.add('locked');
    b.board.classList.remove('locked');
    cover.hidden = false;
    sendBtn.hidden = true;
    compareBtn.hidden = false;
    leftMsg.textContent = 'Kode sudah dikirim. Jangan intip!';
    rightMsg.textContent = 'Anak 2: warnai kisi sesuai kode.';
    ctx.sound.good();
  }
  function compare() {
    cover.hidden = true;
    b.board.classList.add('locked');
    let wrong = 0;
    sentRows.forEach((bits, r) => {
      const bad = b.rowBits(r) !== bits;
      b.labels[r].classList.toggle('wrong', bad);
      b.labels[r].classList.toggle('right', !bad);
      if (bad) wrong++;
    });
    result.textContent = wrong ? `${wrong} baris berbeda. Cari bug-nya!` : 'Sama persis! 🎉';
    result.classList.toggle('bad', wrong > 0);
    if (wrong) ctx.sound.bad(); else ctx.sound.win();
    compareBtn.hidden = true;
    againBtn.hidden = false;
  }
  function reset() {
    a.clear(); b.clear();
    b.labels.forEach((l) => { l.textContent = ''; l.classList.remove('wrong', 'right'); });
    a.board.classList.remove('locked');
    b.board.classList.add('locked');
    result.textContent = '';
    sendBtn.hidden = false;
    againBtn.hidden = true;
    leftMsg.textContent = 'Anak 1: buat gambar rahasia, lalu kirim kodenya.';
    rightMsg.textContent = 'Anak 2: tunggu kode dari temanmu.';
  }
}

export default {
  id: 'sda-09-gambar-rahasia',
  title: 'Gambar Rahasia dari Kode Biner',
  topic: 'Representasi gambar dan piksel',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🖼️',
  source: { name: 'CS Unplugged: Image Representation', url: 'https://www.csunplugged.org/en/topics/image-representation/' },
  rounds: 3,
  maxPlayers: 4,
  goal: 'Anak mewarnai kisi sesuai kode biner per baris dan memahami bahwa gambar disimpan komputer sebagai angka.',
  extraModes: [
    { id: 'pasangan', icon: '👫', label: 'Berpasangan', desc: 'Satu menggambar, satu menyalin dari kode', create: createPair },
    { id: 'kreasi', icon: '✏️', label: 'Buat Gambar', desc: 'Gambar sendiri, lihat kodenya', create: createOwn },
  ],
  create: createPuzzles,
};
