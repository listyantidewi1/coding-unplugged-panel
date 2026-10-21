// Kartu Data Kelasku — SD Lanjut (10–12 tahun), data: kelompok, urut, saring.
// Ten data cards of class 5B. Group them, sort them by distance, filter
// them with two conditions, see the pattern and guess from it.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

const WAYS = [
  { key: 'jalan kaki', icon: '🚶' },
  { key: 'sepeda', icon: '🚲' },
  { key: 'diantar motor', icon: '🛵' },
  { key: 'angkot', icon: '🚐' },
];
const FRUITS = ['mangga', 'rambutan', 'jeruk', 'salak'];
export const CARDS = [
  ['Adi', 'jalan kaki', 'mangga', 1], ['Bunga', 'sepeda', 'rambutan', 2], ['Candra', 'diantar motor', 'jeruk', 4],
  ['Desi', 'jalan kaki', 'mangga', 1], ['Eko', 'angkot', 'salak', 6], ['Fani', 'sepeda', 'mangga', 2],
  ['Gilang', 'diantar motor', 'rambutan', 3], ['Hana', 'jalan kaki', 'jeruk', 1], ['Indra', 'angkot', 'mangga', 5],
  ['Joko', 'diantar motor', 'salak', 4],
].map(([name, way, fruit, km]) => ({ name, way, fruit, km }));
const iconOf = (way) => WAYS.find((w) => w.key === way).icon;

function card(c, attrs = {}) {
  return el('div', { class: 'data-card', 'data-name': c.name, ...attrs },
    el('b', null, c.name), el('span', null, `${iconOf(c.way)} ${c.way}`), el('span', null, `🍽️ ${c.fruit}`), el('span', { class: 'km' }, `${c.km} km`));
}

// 1. Drag every card into its group.
function groupRound(wrap, ctx, next) {
  let left = CARDS.length;
  const tray = el('div', { class: 'card-tray' }, ctx.rand.shuffle(CARDS).map((c) => card(c, { 'data-drag': '' })));
  const bins = WAYS.map((w) => el('div', { class: 'data-col', 'data-drop': w.key },
    el('div', { class: 'data-head' }, `${w.icon} ${w.key}`), el('div', { class: 'data-items' }), el('div', { class: 'data-sum' }, 'Jumlah: 0')));
  const area = el('div', { class: 'data-area' }, tray, el('div', { class: 'data-table four' }, bins));
  dnd(area, (item, bin) => {
    const c = CARDS.find((x) => x.name === item.dataset.name);
    if (c.way !== bin.dataset.drop) { ctx.mistake(); shake(item); return; }
    item.classList.add('locked', 'mini');
    bin.querySelector('.data-items').append(item);
    bin.querySelector('.data-sum').textContent = `Jumlah: ${bin.querySelectorAll('.data-card').length}`;
    ctx.sound.tap();
    if (--left === 0) next();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Kelompokkan kartu menurut cara ke sekolah.'), area);
}

// 2. Tap the cards from the nearest home to the farthest.
function sortRound(wrap, ctx, next) {
  const left = CARDS.slice();
  const tray = el('div', { class: 'card-tray' });
  const body = el('tbody');
  const table = el('table', { class: 'count-table sorted-table' }, el('thead', null, el('tr', null, el('td', null, 'Jarak'), el('td', null, 'Nama'), el('td', null, 'Cara ke sekolah'))), body);
  tray.append(...ctx.rand.shuffle(CARDS).map((c) => onTap(card(c), (e) => {
    const node = e.currentTarget || tray.querySelector(`[data-name="${c.name}"]`);
    if (!left.includes(c)) return;
    const min = Math.min(...left.map((x) => x.km));
    if (c.km > min) { ctx.mistake(); shake(node); return; }
    left.splice(left.indexOf(c), 1);
    node.classList.add('used');
    body.append(el('tr', null, el('td', { class: 'num' }, `${c.km} km`), el('td', null, c.name), el('td', null, `${iconOf(c.way)} ${c.way}`)));
    ctx.sound.tap();
    if (!left.length) next();
  })));
  wrap.append(el('p', { class: 'prompt' }, 'Urutkan menurut jarak rumah: ketuk kartu dari yang TERDEKAT.'), el('div', { class: 'sort-layout' }, tray, table));
}

// 3. Pick every card that meets both conditions.
function filterRound(wrap, ctx, q, next) {
  const want = CARDS.filter(q.test).map((c) => c.name).sort().join();
  const picked = new Set();
  const msg = el('p', { class: 'reveal' });
  const tray = el('div', { class: 'card-tray' }, CARDS.map((c) => {
    const n = card(c);
    return onTap(n, () => {
      if (picked.has(c.name)) picked.delete(c.name); else picked.add(c.name);
      n.classList.toggle('picked', picked.has(c.name));
      ctx.sound.tap();
    });
  }));
  let done = false;
  const check = button('Periksa', () => {
    if (done) return;
    if ([...picked].sort().join() !== want) {
      ctx.mistake();
      shake(tray);
      msg.className = 'reveal bad';
      msg.textContent = 'Belum tepat. Ingat: kedua syarat harus terpenuhi.';
      return;
    }
    done = true;
    msg.className = 'reveal';
    msg.textContent = `Benar: ${[...picked].join(', ')}.`;
    next();
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, q.text), tray, el('div', { class: 'row' }, check, msg));
}

const FILTERS = [
  { text: 'Saring: siapa yang suka mangga DAN jalan kaki? Ketuk kartunya, lalu Periksa.', test: (c) => c.fruit === 'mangga' && c.way === 'jalan kaki' },
  { text: 'Saring: siapa yang rumahnya LEBIH DARI 3 km DAN diantar motor?', test: (c) => c.km > 3 && c.way === 'diantar motor' },
];

function randomFilter(rand) {
  const way = rand.pick(WAYS).key;
  const fruit = rand.pick(FRUITS);
  const km = rand.int(1, 4);
  const forms = [
    { text: `Saring: siapa yang ${way} DAN suka ${fruit}?`, test: (c) => c.way === way && c.fruit === fruit },
    { text: `Saring: siapa yang rumahnya LEBIH DARI ${km} km DAN suka ${fruit}?`, test: (c) => c.km > km && c.fruit === fruit },
    { text: `Saring: siapa yang rumahnya PALING JAUH ${km} km?`, test: (c) => c.km <= km },
  ];
  const ok = forms.filter((f) => CARDS.some(f.test));
  return rand.pick(ok.length ? ok : forms.slice(2));
}

// Guess from the pattern: the way most cards at the nearest distance use.
export function predict(km) {
  const by = new Map();
  const nearest = Math.min(...CARDS.map((c) => Math.abs(c.km - km)));
  CARDS.filter((c) => Math.abs(c.km - km) === nearest).forEach((c) => by.set(c.way, (by.get(c.way) || 0) + 1));
  return [...by.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function miniTable(cards) {
  return el('table', { class: 'count-table data-tbl' },
    el('thead', null, el('tr', null, ['Nama', 'Cara ke sekolah', 'Buah', 'Jarak'].map((h) => el('td', null, h)))),
    el('tbody', null, cards.map((c) => el('tr', null, el('td', null, c.name), el('td', null, `${iconOf(c.way)} ${c.way}`), el('td', null, c.fruit), el('td', { class: 'num' }, `${c.km} km`)))));
}
const sortedCards = () => CARDS.slice().sort((a, b) => a.km - b.km);

export default {
  id: 'sdl-06-kartu-data',
  title: 'Kartu Data Kelasku',
  topic: 'Data: mengelompokkan, mengurutkan, menyaring',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🗂️',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid mengelompokkan, mengurutkan, dan menyaring kartu data dengan dua syarat, menarik kesimpulan dari pola, dan menebak data baru.',
  extraModes: [
    { id: 'tabel', icon: '🧮', label: 'Tabel Data', desc: 'Tombol Kelompokkan, Urutkan, Saring dua syarat, dan Tebak untuk murid baru', create: createTable },
    { id: 'survei', icon: '📋', label: 'Survei Kelas', desc: 'Guru membuat tiga pertanyaan, murid bergiliran mengisi kartu; tabel dan diagram batang terbentuk langsung', create: createSurvey },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kartu' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2000); };
      if (r === 0) groupRound(wrap, ctx, next);
      else if (r === 1) sortRound(wrap, ctx, next);
      else if (r === 2 || r === 3) filterRound(wrap, ctx, FILTERS[r - 2], next);
      else if (r === 4) {
        choice(wrap, {
          prompt: 'Buah apa yang paling banyak disukai?', subject: miniTable(CARDS), ctx, onRight: next, columns: 4,
          options: FRUITS.map((f) => ({ label: f, correct: f === 'mangga' })),
        });
      } else if (r === 5) {
        choice(wrap, {
          prompt: 'Setelah diurutkan menurut jarak, apa polanya?', subject: miniTable(sortedCards()), ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { label: 'Makin jauh rumahnya, makin banyak yang naik kendaraan (motor atau angkot)', correct: true },
            { label: 'Makin jauh rumahnya, makin banyak yang jalan kaki' },
            { label: 'Jarak rumah tidak ada hubungannya dengan cara ke sekolah' },
          ]),
        });
      } else if (r === 6) {
        choice(wrap, {
          prompt: 'Murid baru, Kiki, rumahnya 5 km. Menurut pola kelas 5B, Kiki kemungkinan ke sekolah dengan …', subject: miniTable(sortedCards()), ctx, onRight: next, columns: 4,
          options: WAYS.map((w) => ({ icon: w.icon, label: w.key, correct: w.key === predict(5) })),
        });
      } else if (r === 7) {
        choice(wrap, {
          prompt: 'Apakah tebakan dari data pasti benar?', ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { label: 'Belum tentu. Tebakan dari pola hanya perkiraan; bisa saja Kiki naik sepeda.', correct: true },
            { label: 'Pasti benar, karena datanya sudah diurutkan.' },
            { label: 'Pasti salah, karena Kiki tidak ada di tabel.' },
          ]),
        });
      } else filterRound(wrap, ctx, randomFilter(ctx.rand), next);
    }
    render();
  },
};

// Tabel Data: group, sort and filter the cards with buttons; guess for a
// new pupil from the distance.
function createTable(root) {
  const wrap = el('div', { class: 'act kartu' });
  root.append(wrap);
  let view = 'semua';
  let sortBy = null;
  const cond = [{ field: 'way', value: 'jalan kaki' }, { field: 'none', value: '' }];
  const out = el('div', { class: 'tbl-out' });
  const condRow = el('div', { class: 'row' });
  const FIELDS = { none: '—', way: 'cara ke sekolah', fruit: 'buah', far: 'jarak lebih dari', near: 'jarak paling jauh' };
  const valuesOf = (f) => (f === 'way' ? WAYS.map((w) => w.key) : f === 'fruit' ? FRUITS : f === 'none' ? [''] : ['1', '2', '3', '4', '5']);
  const testOf = ({ field, value }) => ({
    none: () => true, way: (c) => c.way === value, fruit: (c) => c.fruit === value,
    far: (c) => c.km > Number(value), near: (c) => c.km <= Number(value),
  })[field];
  function select(options, value, onChange) {
    const s = el('select', { class: 'sel' }, options.map(([v, label]) => el('option', { value: v, selected: v === value }, label)));
    s.addEventListener('change', () => onChange(s.value));
    return s;
  }
  function drawCond() {
    condRow.replaceChildren(...cond.flatMap((c, k) => [
      k ? el('b', null, 'DAN') : el('b', null, 'Syarat'),
      select(Object.entries(FIELDS).filter(([f]) => k || f !== 'none'), c.field, (f) => { c.field = f; c.value = valuesOf(f)[0]; drawCond(); draw(); }),
      c.field === 'none' ? null : select(valuesOf(c.field).map((v) => [v, c.field === 'far' || c.field === 'near' ? `${v} km` : v]), c.value, (v) => { c.value = v; draw(); }),
    ]));
  }
  function draw() {
    let cards = CARDS.slice();
    if (sortBy === 'km') cards.sort((a, b) => a.km - b.km);
    if (sortBy === 'name') cards.sort((a, b) => a.name.localeCompare(b.name));
    if (view === 'saring') cards = cards.filter((c) => cond.every((x) => testOf(x)(c)));
    if (view === 'kelompok') {
      out.replaceChildren(el('div', { class: 'data-table four' }, WAYS.map((w) => {
        const list = cards.filter((c) => c.way === w.key);
        return el('div', { class: 'data-col' }, el('div', { class: 'data-head' }, `${w.icon} ${w.key}`),
          el('div', { class: 'data-items' }, list.map((c) => card(c, { class: 'data-card mini' }))), el('div', { class: 'data-sum' }, `Jumlah: ${list.length}`));
      })));
    } else out.replaceChildren(miniTable(cards), el('p', { class: 'small-note' }, `${cards.length} kartu`));
    condRow.hidden = view !== 'saring';
    btns.forEach((b) => b.classList.toggle('on', b.dataset.v === view || b.dataset.v === `urut-${sortBy}`));
  }
  const mk = (label, v, f) => { const b = button(label, f, 'small'); b.dataset.v = v; return b; };
  const btns = [
    mk('Semua', 'semua', () => { view = 'semua'; sortBy = null; draw(); }),
    mk('Kelompokkan', 'kelompok', () => { view = 'kelompok'; draw(); }),
    mk('Urutkan jarak', 'urut-km', () => { if (view === 'kelompok') view = 'semua'; sortBy = 'km'; draw(); }),
    mk('Urutkan nama', 'urut-name', () => { if (view === 'kelompok') view = 'semua'; sortBy = 'name'; draw(); }),
    mk('Saring', 'saring', () => { view = 'saring'; draw(); }),
  ];
  const guessOut = el('span', { class: 'reveal' });
  const guess = select([1, 2, 3, 4, 5, 6].map((k) => [String(k), `${k} km`]), '5', (v) => { guessOut.textContent = `Tebakan: ${iconOf(predict(Number(v)))} ${predict(Number(v))}`; });
  guessOut.textContent = `Tebakan: ${iconOf(predict(5))} ${predict(5)}`;
  wrap.append(
    el('div', { class: 'row' }, btns), condRow, out,
    el('div', { class: 'row guess' }, el('b', null, 'Tebak murid baru, jarak rumah'), guess, guessOut));
  drawCond();
  draw();
}

// Survei Kelas: three questions from the teacher; each pupil adds a card.
// Data stays in memory only and is gone when the page closes.
function createSurvey(root, ctx) {
  const wrap = el('div', { class: 'act kartu' });
  root.append(wrap);
  const qs = [
    { q: 'Cara ke sekolah', opts: 'jalan kaki, sepeda, motor, angkot, mobil' },
    { q: 'Hobi', opts: 'olahraga, membaca, menggambar, musik, bermain game' },
    { q: 'Jam tidur', opts: 'sebelum 20.00, 20.00–21.00, setelah 21.00' },
  ];
  const rows = [];
  function setup() {
    const inputs = qs.map((x) => ({ q: el('input', { class: 'txt', value: x.q, 'aria-label': 'pertanyaan' }), o: el('input', { class: 'txt wide', value: x.opts, 'aria-label': 'pilihan jawaban' }) }));
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Guru: tulis tiga pertanyaan dan pilihan jawabannya (pisahkan dengan koma).'),
      el('div', { class: 'survey-setup' }, inputs.map((x, k) => el('div', { class: 'row' }, el('b', null, `${k + 1}.`), x.q, x.o))),
      el('p', { class: 'small-note' }, 'Data hanya ada di layar ini dan hilang saat halaman ditutup.'),
      button('Mulai survei ➜', () => {
        inputs.forEach((x, k) => { qs[k].q = x.q.value.trim() || `Pertanyaan ${k + 1}`; qs[k].opts = x.o.value; });
        rows.length = 0;
        fill();
      }, 'primary'));
  }
  const optsOf = (k) => qs[k].opts.split(',').map((s) => s.trim()).filter(Boolean);
  function fill() {
    const ans = [null, null, null];
    let name = '';
    const nameEl = el('input', { class: 'txt', placeholder: 'Nama (boleh dikosongkan)', 'aria-label': 'nama' });
    nameEl.addEventListener('input', () => { name = nameEl.value; });
    const groups = qs.map((x, k) => el('div', { class: 'survey-q' }, el('b', null, x.q), el('div', { class: 'row' }, optsOf(k).map((o) => {
      const b = button(o, () => { ans[k] = o; groups[k].querySelectorAll('.btn').forEach((y) => y.classList.toggle('on', y === b)); }, 'small');
      return b;
    }))));
    const save = button('Simpan kartuku', () => {
      if (ans.some((a) => !a)) { ctx.sound.bad(); shake(save); return; }
      rows.push({ name: name.trim() || `Murid ${rows.length + 1}`, ans: ans.slice() });
      ctx.sound.good();
      fill();
    }, 'primary');
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, `Kartu ke-${rows.length + 1}: maju dan isi kartumu.`),
      el('div', { class: 'survey-layout' }, el('div', { class: 'survey-form' }, nameEl, groups, el('div', { class: 'row' }, save, button('Ubah pertanyaan', setup, 'small ghost'))), results()));
  }
  function results() {
    if (!rows.length) return el('div', { class: 'survey-out' }, el('p', { class: 'small-note' }, 'Belum ada kartu.'));
    return el('div', { class: 'survey-out' }, qs.map((x, k) => {
      const opts = optsOf(k);
      const n = opts.map((o) => rows.filter((r) => r.ans[k] === o).length);
      const top = Math.max(1, ...n);
      return el('div', { class: 'bars' }, el('b', null, x.q), opts.map((o, j) => el('div', { class: 'bar-row' },
        el('span', { class: 'bar-label' }, o), el('span', { class: 'bar', style: { width: `${(n[j] / top) * 100}%` } }), el('span', { class: 'bar-n' }, n[j]))));
    }), el('p', { class: 'small-note' }, `${rows.length} kartu`));
  }
  setup();
}
