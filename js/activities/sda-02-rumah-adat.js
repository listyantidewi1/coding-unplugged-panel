// Rumah Adat dari Bangun Datar — SD Awal (7–9 tahun), dekomposisi.
// Break a simplified traditional house into flat shapes: colour each shape
// by type while the count table fills in, find all shapes of one type, and
// build a house again from loose pieces.

import { el, onTap, button, shake } from '../core/kit.js';

const TYPES = {
  segitiga: { label: 'segitiga', sign: '▲', color: '#ef4444', colorName: 'merah' },
  persegi: { label: 'persegi', sign: '■', color: '#facc15', colorName: 'kuning' },
  panjang: { label: 'persegi panjang', sign: '▬', color: '#3b82f6', colorName: 'biru' },
  lingkaran: { label: 'lingkaran', sign: '●', color: '#22c55e', colorName: 'hijau' },
};
const TYPE_KEYS = Object.keys(TYPES);

// Houses as lists of shapes on a 200×140 drawing, back to front.
const tri = (pts) => ({ type: 'segitiga', tag: 'polygon', attrs: { points: pts } });
const rect = (x, y, w, h) => ({ type: w === h ? 'persegi' : 'panjang', tag: 'rect', attrs: { x, y, width: w, height: h } });
const circ = (cx, cy, r) => ({ type: 'lingkaran', tag: 'circle', attrs: { cx, cy, r } });

const HOUSES = {
  gadang: {
    name: 'Rumah Gadang', from: 'Sumatera Barat',
    shapes: [rect(40, 72, 120, 54), tri('40,72 60,20 80,72'), tri('80,72 100,10 120,72'), tri('120,72 140,20 160,72'),
      rect(55, 86, 18, 18), rect(127, 86, 18, 18), rect(88, 96, 24, 30), circ(100, 85, 7)],
  },
  joglo: {
    name: 'Joglo', from: 'Jawa Tengah dan DIY',
    shapes: [tri('70,40 100,14 130,40'), rect(40, 40, 120, 16), rect(50, 56, 100, 60), rect(88, 80, 24, 36),
      rect(60, 72, 16, 16), rect(124, 72, 16, 16), rect(35, 116, 130, 10)],
  },
  tongkonan: {
    name: 'Tongkonan', from: 'Sulawesi Selatan',
    shapes: [rect(50, 25, 100, 22), tri('18,12 50,25 50,47'), tri('182,12 150,25 150,47'), rect(60, 47, 80, 35),
      circ(100, 64, 8), rect(70, 57, 14, 14), rect(116, 57, 14, 14), rect(65, 82, 8, 40), rect(96, 82, 8, 40), rect(127, 82, 8, 40)],
  },
  honai: {
    name: 'Honai', from: 'Papua',
    shapes: [circ(100, 68, 46), tri('88,26 100,8 112,26'), rect(58, 76, 84, 46), rect(90, 92, 20, 30)],
  },
};

const counts = (house) => Object.fromEntries(TYPE_KEYS.map((t) => [t, house.shapes.filter((s) => s.type === t).length]));

// Draws a house; every shape is tappable. Returns the svg and its shapes.
function houseSvg(house, onShape) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 140');
  svg.setAttribute('class', 'house');
  const nodes = house.shapes.map((s) => {
    const n = document.createElementNS(NS, s.tag);
    for (const [k, v] of Object.entries(s.attrs)) n.setAttribute(k, v);
    n.setAttribute('class', 'bd');
    n.dataset.type = s.type;
    if (onShape) onTap(n, () => onShape(n, s));
    svg.append(n);
    return n;
  });
  return { svg, nodes };
}

function table(house, show) {
  const c = counts(house);
  const cells = {};
  const rows = TYPE_KEYS.map((t) => {
    cells[t] = el('td', { class: 'num' }, '');
    return el('tr', null, el('td', null, el('span', { class: 'sign', style: { color: TYPES[t].color } }, TYPES[t].sign), ` ${TYPES[t].label}`), cells[t]);
  });
  cells.all = el('td', { class: 'num' }, '');
  const node = el('table', { class: 'count-table' }, el('tbody', null, rows, el('tr', { class: 'total' }, el('td', null, 'Semua'), cells.all)));
  const found = Object.fromEntries(TYPE_KEYS.map((t) => [t, 0]));
  function bump(t) {
    found[t]++;
    cells[t].textContent = found[t];
    const all = Object.values(found).reduce((a, b) => a + b, 0);
    cells.all.textContent = all;
    if (found[t] === c[t]) cells[t].classList.add('full');
  }
  if (show) TYPE_KEYS.forEach((t) => { for (let i = 0; i < c[t]; i++) bump(t); });
  return { node, bump };
}

// Colour every shape: pick a type, then tap its shapes.
function colourRound(wrap, ctx, house, next) {
  let pick = null;
  let left = house.shapes.length;
  const tab = table(house);
  const { svg } = houseSvg(house, (n, s) => {
    if (n.classList.contains('done')) return;
    if (!pick) { shake(tools); return; }
    if (s.type !== pick) { ctx.mistake(); shake(n); return; }
    n.classList.add('done');
    n.style.fill = TYPES[s.type].color;
    tab.bump(s.type);
    ctx.sound.tap();
    if (--left === 0) next();
  });
  const tools = el('div', { class: 'crayons' }, TYPE_KEYS.map((t) => onTap(el('button', { class: 'crayon', type: 'button', style: { '--c': TYPES[t].color } },
    el('span', { class: 'sign' }, TYPES[t].sign), el('span', null, TYPES[t].label)), (e) => {
    pick = t;
    tools.querySelectorAll('.crayon').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
  })));
  wrap.append(
    el('p', { class: 'prompt' }, `${house.name} dari ${house.from}. Pilih warna, lalu ketuk setiap bangun datar yang cocok.`),
    el('div', { class: 'house-layout' }, el('div', { class: 'house-frame' }, svg), el('div', { class: 'house-side' }, tools, tab.node)));
}

// Find all shapes of one type; other taps are mistakes.
function findRound(wrap, ctx, house, type, next) {
  let left = counts(house)[type];
  const { svg } = houseSvg(house, (n, s) => {
    if (n.classList.contains('done')) return;
    if (s.type !== type) { ctx.mistake(); shake(n); return; }
    n.classList.add('done');
    n.style.fill = TYPES[type].color;
    ctx.sound.tap();
    counter.textContent = `${counts(house)[type] - left + 1} ditemukan`;
    if (--left === 0) next();
  });
  const counter = el('p', { class: 'reveal' }, '');
  wrap.append(
    el('p', { class: 'prompt' }, `Temukan semua ${TYPES[type].label} ${TYPES[type].sign} di rumah ${house.name}!`),
    el('div', { class: 'house-layout' }, el('div', { class: 'house-frame' }, svg)), counter);
}

// Free building: pieces start in a tray and are dragged anywhere on the
// frame. `onChange(placed)` after every move.
function buildBoard(pieces, ctx, onChange) {
  const NS = 'http://www.w3.org/2000/svg';
  const frame = el('div', { class: 'build-frame' });
  const tray = el('div', { class: 'build-tray' });
  const shapeSvg = (type, w, h) => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    s.setAttribute('preserveAspectRatio', 'none');
    const n = type === 'segitiga' ? document.createElementNS(NS, 'polygon') : type === 'lingkaran' ? document.createElementNS(NS, 'ellipse') : document.createElementNS(NS, 'rect');
    if (type === 'segitiga') n.setAttribute('points', `${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`);
    else if (type === 'lingkaran') { n.setAttribute('cx', w / 2); n.setAttribute('cy', h / 2); n.setAttribute('rx', w / 2 - 2); n.setAttribute('ry', h / 2 - 2); }
    else { n.setAttribute('x', 2); n.setAttribute('y', 2); n.setAttribute('width', w - 4); n.setAttribute('height', h - 4); }
    n.setAttribute('fill', TYPES[type].color);
    n.setAttribute('stroke', '#334155');
    n.setAttribute('stroke-width', 3);
    s.append(n);
    return s;
  };
  // Sizes as % of the frame width.
  const SIZE = { segitiga: [30, 18], persegi: [14, 14], panjang: [34, 14], lingkaran: [10, 10] };
  const nodes = pieces.map((type, i) => {
    const [w, h] = SIZE[type];
    const p = el('div', { class: 'piece', 'data-type': type, style: { '--w': w, '--h': h } });
    p.append(shapeSvg(type, w * 10, h * 10));
    p.dataset.i = i;
    tray.append(p);
    return p;
  });
  const drags = new Map();
  const placed = () => nodes.filter((n) => n.parentElement === frame);
  const area = el('div', { class: 'build' }, frame, tray);
  area.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.piece');
    if (!p) return;
    e.preventDefault();
    p.setPointerCapture(e.pointerId);
    const r = p.getBoundingClientRect();
    drags.set(e.pointerId, { p, dx: e.clientX - r.left, dy: e.clientY - r.top });
    p.classList.add('moving');
  });
  area.addEventListener('pointermove', (e) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const f = frame.getBoundingClientRect();
    if (d.p.parentElement !== frame) frame.append(d.p);
    const x = ((e.clientX - d.dx - f.left) / f.width) * 100;
    const y = ((e.clientY - d.dy - f.top) / f.height) * 100;
    d.p.style.left = `${x}%`;
    d.p.style.top = `${y}%`;
  });
  const end = (e) => {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    d.p.classList.remove('moving');
    const f = frame.getBoundingClientRect();
    const r = d.p.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < f.left || cx > f.right || cy < f.top || cy > f.bottom) { d.p.style.left = ''; d.p.style.top = ''; tray.append(d.p); }
    ctx.sound.tap();
    onChange(placed());
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', end);
  return { node: area, frame, tray, add(type) { const i = nodes.length; pieces.push(type); const [w, h] = SIZE[type]; const p = el('div', { class: 'piece', 'data-type': type, style: { '--w': w, '--h': h, left: `${10 + (i % 6) * 12}%`, top: '6%' } }); p.append(shapeSvg(type, w * 10, h * 10)); nodes.push(p); frame.append(p); onChange(placed()); } };
}

function buildRound(wrap, ctx, next) {
  const pieces = ['segitiga', 'segitiga', 'persegi', 'panjang', 'panjang'];
  const done = button('Selesai', () => { done.disabled = true; next(); }, 'primary');
  done.disabled = true;
  const b = buildBoard(pieces, ctx, (placed) => { done.disabled = placed.length < pieces.length; });
  wrap.append(
    el('p', { class: 'prompt' }, 'Susun kembali! Seret semua potongan ke bingkai untuk membuat sebuah rumah.'),
    b.node, done);
}

const PLAN = [
  { kind: 'warna', house: 'gadang' },
  { kind: 'cari', house: 'joglo', type: 'panjang' },
  { kind: 'susun' },
  { kind: 'warna', house: 'tongkonan' },
  { kind: 'cari', house: 'honai', type: 'lingkaran' },
];

export default {
  id: 'sda-02-rumah-adat',
  title: 'Rumah Adat dari Bangun Datar',
  topic: 'Dekomposisi',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🏛️',
  source: null,
  rounds: 5,
  maxPlayers: 4,
  goal: 'Murid memecah gambar rumah adat menjadi bangun datar, menghitung setiap jenisnya, dan menyusun kembali bangun datar menjadi rumah.',
  extraModes: [{ id: 'susun', icon: '🧩', label: 'Rumah Adat Daerahku', desc: 'Susun rumah dari bangun datar sebanyak yang kamu mau; tabel menghitung otomatis', create: createFree }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rumah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1400); };
      const p = PLAN[r] || { kind: 'cari', house: ctx.rand.pick(Object.keys(HOUSES)), type: null };
      if (p.kind === 'warna') colourRound(wrap, ctx, HOUSES[p.house], next);
      else if (p.kind === 'susun') buildRound(wrap, ctx, next);
      else {
        const house = HOUSES[p.house];
        const type = p.type || ctx.rand.pick(TYPE_KEYS.filter((t) => counts(house)[t] > 0));
        findRound(wrap, ctx, house, type, next);
      }
    }
    render();
  },
};

function createFree(root, ctx) {
  const wrap = el('div', { class: 'act rumah' });
  root.append(wrap);
  const cells = {};
  const tab = el('table', { class: 'count-table' }, el('tbody', null, TYPE_KEYS.map((t) => {
    cells[t] = el('td', { class: 'num' }, '0');
    return el('tr', null, el('td', null, el('span', { class: 'sign', style: { color: TYPES[t].color } }, TYPES[t].sign), ` ${TYPES[t].label}`), cells[t]);
  })));
  const b = buildBoard([], ctx, (placed) => {
    TYPE_KEYS.forEach((t) => { cells[t].textContent = placed.filter((p) => p.dataset.type === t).length; });
  });
  const adders = el('div', { class: 'crayons' }, TYPE_KEYS.map((t) => onTap(el('button', { class: 'crayon', type: 'button', style: { '--c': TYPES[t].color } },
    el('span', { class: 'sign' }, TYPES[t].sign), el('span', null, `+ ${TYPES[t].label}`)), () => b.add(t))));
  // Pieces dragged out of the frame land in a hidden tray: they leave the drawing.
  b.tray.hidden = true;
  wrap.append(
    el('p', { class: 'prompt' }, 'Gambar rumah adat daerahmu! Tambah bangun datar, lalu seret ke tempatnya. Seret ke luar bingkai untuk membuang.'),
    el('div', { class: 'house-layout' }, b.node, el('div', { class: 'house-side' }, adders, tab)));
}
