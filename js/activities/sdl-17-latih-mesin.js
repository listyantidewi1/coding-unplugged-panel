// Melatih Mesin Penebak Buah — SD Lanjut (10–12 tahun), data latihan dan
// bias. The machine only knows colour, shape and size. It remembers every
// trait seen per fruit, gives a point for each trait a mystery card shares,
// and guesses the fruit with the most points. Lopsided examples or a fruit
// it never saw make it guess wrong.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';

const ex = (fruit, warna, bentuk, ukuran) => ({ fruit, warna, bentuk, ukuran });
export const EXAMPLES = [
  ex('rambutan', 'merah', 'bulat', 'kecil'), ex('rambutan', 'merah', 'bulat', 'kecil'),
  ex('salak', 'cokelat', 'bulat', 'kecil'), ex('salak', 'cokelat', 'bulat', 'kecil'),
  ex('mangga', 'hijau', 'lonjong', 'besar'), ex('mangga', 'kuning', 'lonjong', 'sedang'), ex('mangga', 'kuning', 'lonjong', 'besar'),
  ex('jeruk', 'hijau', 'bulat', 'sedang'), ex('jeruk', 'oranye', 'bulat', 'sedang'), ex('jeruk', 'kuning', 'bulat', 'sedang'),
];
// Soal 3: the helper picked young mangoes from one tree only.
export const YOUNG_MANGO = [EXAMPLES[0], EXAMPLES[1], EXAMPLES[2], EXAMPLES[3], ex('mangga', 'hijau', 'lonjong', 'besar'), ex('mangga', 'hijau', 'lonjong', 'besar'), ex('mangga', 'hijau', 'lonjong', 'besar'), EXAMPLES[7], EXAMPLES[8], EXAMPLES[9]];
export const MANGGIS = ex('manggis', 'ungu', 'bulat', 'sedang');
const mys = (id, warna, bentuk, ukuran, truth) => ({ id, warna, bentuk, ukuran, truth });
export const MYSTERY = [
  mys('M1', 'kuning', 'lonjong', 'sedang', 'mangga'), mys('M2', 'hijau', 'bulat', 'sedang', 'jeruk'), mys('M3', 'merah', 'bulat', 'kecil', 'rambutan'),
  mys('M4', 'cokelat', 'bulat', 'kecil', 'salak'), mys('M5', 'hijau', 'lonjong', 'besar', 'mangga'), mys('M6', 'ungu', 'bulat', 'sedang', 'manggis'),
];
const TRAITS = ['warna', 'bentuk', 'ukuran'];
const UNSURE = 'tidak yakin';

// The memory table: every trait seen for each fruit.
export function memory(examples) {
  const mem = new Map();
  for (const e of examples) {
    if (!mem.has(e.fruit)) mem.set(e.fruit, { warna: new Set(), bentuk: new Set(), ukuran: new Set() });
    for (const t of TRAITS) mem.get(e.fruit)[t].add(e[t]);
  }
  return mem;
}
export const score = (mem, card) => [...mem].map(([fruit, row]) => ({ fruit, pts: TRAITS.filter((t) => row[t].has(card[t])).length }));
export function guess(mem, card) {
  const s = score(mem, card);
  const top = Math.max(...s.map((x) => x.pts));
  const best = s.filter((x) => x.pts === top);
  return best.length === 1 ? best[0].fruit : UNSURE;
}

// Drawn from the three traits only, the way the machine "sees" it.
function art(c) {
  return el('span', { class: `buah w-${c.warna} b-${c.bentuk} u-${c.ukuran}` });
}
const traitText = (c) => `${c.warna}, ${c.bentuk}, ${c.ukuran}`;
function exampleCard(e, attrs = {}) {
  return el('div', { class: 'contoh-kartu', ...attrs }, art(e), el('b', null, e.fruit), el('small', null, traitText(e)));
}
function mysteryCard(m, revealed = false) {
  return el('div', { class: 'contoh-kartu misteri' }, art(m), el('b', null, revealed ? `${m.id}: ${m.truth}` : `${m.id}: ?`), el('small', null, traitText(m)));
}
function memoryTable(mem, highlight) {
  return el('table', { class: 'tabel-ingatan' },
    el('thead', null, el('tr', null, ['Buah', 'Warna', 'Bentuk', 'Ukuran'].map((h) => el('th', null, h)))),
    el('tbody', null, [...mem].map(([fruit, row]) => el('tr', null, el('td', null, el('b', null, fruit)),
      TRAITS.map((t) => el('td', null, [...row[t]].map((v, k) => el('span', { class: highlight && highlight[t] === v ? 'cocok' : '' }, (k ? ', ' : '') + v))))))));
}
function scoreBars(mem, card) {
  const s = score(mem, card);
  const g = guess(mem, card);
  return el('div', { class: 'poin-buah' }, s.map(({ fruit, pts }) => el('div', { class: `poin-baris ${fruit === g ? 'menang' : ''}` }, el('span', null, fruit), el('i', { style: { width: `${(pts / 3) * 100}%` } }), el('b', null, pts))),
    el('p', { class: 'tebakan' }, `Tebakan mesin: ${g}`));
}
const brain = (...kids) => el('div', { class: 'otak-mesin', 'data-drop': 'otak' }, el('div', { class: 'otak-lampu' }, '💡💡💡'), el('b', null, 'Otak mesin'), el('div', { class: 'otak-isi' }, ...kids));

// Train: put example cards into the machine; the memory table fills up.
function trainRound(wrap, ctx, { cards, have = [], prompt, done }) {
  const inside = [...have];
  const table = el('div', { class: 'ingatan-wrap' }, memoryTable(memory(inside)));
  const isi = el('div', { class: 'otak-isi' });
  const box = brain();
  box.querySelector('.otak-isi').replaceWith(isi);
  const tray = el('div', { class: 'contoh-baki' }, cards.map((e, i) => exampleCard(e, { 'data-drag': i })));
  for (const e of have) isi.append(el('span', { class: 'chip-buah' }, art(e), e.fruit));
  let left = cards.length;
  const area = el('div', { class: 'latih-area' }, tray, box, table);
  dnd(area, (item, target) => {
    if (!target.closest('[data-drop="otak"]')) return;
    const e = cards[+item.dataset.drag];
    inside.push(e);
    item.remove();
    isi.append(el('span', { class: 'chip-buah' }, art(e), e.fruit));
    table.replaceChildren(memoryTable(memory(inside)));
    ctx.sound.tap();
    if (--left === 0) done(inside);
  });
  wrap.append(el('p', { class: 'prompt' }, prompt), area);
}

// The pupil plays the machine: which fruit gets the most points?
function guessRound(wrap, ctx, { examples, card, prompt, done }) {
  const mem = memory(examples);
  const answer = guess(mem, card);
  const fruits = [...mem.keys(), UNSURE];
  const after = el('div', { class: 'tebak-hasil' });
  const sub = el('div', { class: 'tebak-subjek' }, mysteryCard(card), el('div', { class: 'ingatan-wrap' }, memoryTable(mem, card)));
  choice(wrap, {
    prompt, subject: sub, ctx, columns: fruits.length,
    options: fruits.map((f) => ({ label: f, correct: f === answer })),
    onRight() {
      const right = answer === card.truth;
      sub.firstChild.replaceWith(mysteryCard(card, true));
      after.replaceChildren(scoreBars(mem, card), el('p', { class: right ? 'reveal' : 'reveal bad' }, `Buah sebenarnya: ${card.truth}. ${right ? 'Tebakan mesin benar.' : 'Tebakan mesin salah!'}`));
      wrap.append(after);
      done();
    },
  });
}

export default {
  id: 'sdl-17-latih-mesin',
  title: 'Melatih Mesin Penebak Buah',
  topic: 'Data latihan dan bias',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🍊',
  source: { name: 'Gagasan pembelajaran KA untuk anak', url: 'https://www.csunplugged.org/en/topics/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid melatih mesin dengan kartu contoh, menebak seperti mesin dengan menghitung poin ciri, dan melihat bahwa contoh yang berat sebelah atau buah yang belum pernah dicontohkan membuat tebakan salah.',
  extraModes: [
    { id: 'lab', icon: '🧪', label: 'Lab Latih dan Uji', desc: 'Tambah atau buang kartu contoh kapan saja dan lihat tebakan mesin langsung berubah', create: createLab },
    { id: 'tim', icon: '🕵️', label: 'Melatih dan Menguji', desc: 'Satu tim diam-diam memilih contoh; tim lain menguji dan menebak apa yang salah', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act latih' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 3000); } };
      const ask = (prompt, opts, subject) => choice(wrap, { prompt, subject, ctx, onRight: next, columns: 1, options: ctx.rand.shuffle(opts).map(([label, correct]) => ({ label, correct })) });
      if (r === 0) trainRound(wrap, ctx, { cards: ctx.rand.shuffle(EXAMPLES), prompt: 'Latih: seret (atau ketuk) setiap kartu contoh ke otak mesin. Lihat Tabel Ingatan terisi.', done: next });
      else if (r === 1) ask('Lihat Tabel Ingatan. Warna apa saja yang diingat mesin untuk mangga?', [['hijau dan kuning', true], ['kuning saja'], ['hijau, kuning, dan oranye']], el('div', { class: 'ingatan-wrap' }, memoryTable(memory(EXAMPLES))));
      else if (r <= 4) {
        const card = MYSTERY[[0, 1, 5][r - 2]];
        guessRound(wrap, ctx, { examples: EXAMPLES, card, prompt: `Jadilah mesin: beri 1 poin untuk setiap ciri ${card.id} yang ada di baris buah. Buah mana yang poinnya terbanyak?`, done: next });
      } else if (r === 5) ask('Mengapa tebakan mesin untuk M6 (ungu, bulat, sedang) salah?', [
        ['Manggis belum pernah ada di kartu contoh, jadi mesin memilih buah paling mirip yang ia kenal', true], ['Mesin lupa menghitung warna'], ['Manggis sebenarnya sejenis jeruk'],
      ]);
      else if (r === 6) guessRound(wrap, ctx, { examples: YOUNG_MANGO, card: MYSTERY[0], prompt: 'Contoh mangga diganti tiga mangga muda: hijau, lonjong, besar. Tebak ulang M1!', done: next });
      else if (r === 7) ask('Mengapa M1 sekarang ditebak salah?', [
        ['Semua contoh mangga hijau dan besar, jadi mesin "mengira" mangga selalu hijau dan besar. Data latihan perlu beragam', true],
        ['Karena mangga kuning sudah tidak ada di dunia'], ['Karena mesin rusak'],
      ]);
      else if (r === 8) {
        let step = 0;
        trainRound(wrap, ctx, {
          cards: [MANGGIS], have: EXAMPLES, prompt: 'Ajari mesin buah baru: seret kartu manggis ke otak mesin.',
          done(inside) {
            if (step++) return;
            setTimeout(() => { wrap.replaceChildren(); guessRound(wrap, ctx, { examples: inside, card: MYSTERY[5], prompt: 'Sekarang tebak ulang M6 (ungu, bulat, sedang).', done: next }); }, 900);
          },
        });
      } else ask('Aplikasi pengenal suara hanya dilatih dengan suara satu logat. Apa yang mungkin terjadi pada pengguna dari daerah lain, dan bagaimana memperbaikinya?', [
        ['Sering salah mengerti; latih dengan contoh suara dari banyak daerah dan logat', true],
        ['Tidak ada masalah, semua logat sama saja'], ['Pengguna harus mengubah logatnya sendiri'],
      ]);
    }
    render();
  },
};

// The lab: examples in and out at any time, guesses update live.
const POOL = [...EXAMPLES, MANGGIS, ex('mangga', 'hijau', 'lonjong', 'besar')];
function createLab(root, ctx) {
  const wrap = el('div', { class: 'act latih' });
  root.append(wrap);
  let inside = [...EXAMPLES];
  let pick = 0;
  const revealed = new Set();
  function draw() {
    const mem = memory(inside);
    const pool = el('div', { class: 'contoh-baki kecil' }, POOL.map((e, i) => onTap(exampleCard(e, { class: 'contoh-kartu tambah' }), () => { inside.push(POOL[i]); ctx.sound.tap(); draw(); })));
    const isi = el('div', { class: 'otak-isi' }, inside.map((e, i) => onTap(el('button', { class: 'chip-buah', type: 'button', title: 'buang' }, art(e), e.fruit, ' ✕'), () => { inside.splice(i, 1); draw(); })));
    const box = brain();
    box.querySelector('.otak-isi').replaceWith(isi);
    const card = MYSTERY[pick];
    const tests = el('div', { class: 'row wrap' }, MYSTERY.map((m, i) => button(m.id, () => { pick = i; draw(); }, i === pick ? 'small on' : 'small')));
    const test = el('div', { class: 'uji-panel' }, tests, el('div', { class: 'row' }, mysteryCard(card, revealed.has(card.id)), mem.size ? scoreBars(mem, card) : el('p', { class: 'small-note' }, 'Otak mesin masih kosong.')),
      revealed.has(card.id) ? el('p', { class: guess(mem, card) === card.truth ? 'reveal' : 'reveal bad' }, `Buah sebenarnya: ${card.truth}. Tebakan mesin ${guess(mem, card) === card.truth ? 'benar' : 'salah'}.`) : button('Buka buah sebenarnya', () => { revealed.add(card.id); draw(); }, 'small'),
      el('p', { class: 'small-note' }, `Tebakan benar: ${MYSTERY.filter((m) => guess(mem, m) === m.truth).length} dari ${MYSTERY.length} kartu misteri`));
    const presets = el('div', { class: 'row wrap' },
      button('Set awal', () => { inside = [...EXAMPLES]; draw(); }, 'small ghost'), button('Mangga muda saja', () => { inside = [...YOUNG_MANGO]; draw(); }, 'small ghost'),
      button('+ Manggis', () => { inside.push(MANGGIS); draw(); }, 'small ghost'), button('Kosongkan', () => { inside = []; draw(); }, 'small ghost'));
    wrap.replaceChildren(el('div', { class: 'lab-grid' },
      el('div', { class: 'lab-kiri' }, el('small', { class: 'small-note' }, 'Ketuk kartu untuk menambah contoh; ketuk ✕ di otak mesin untuk membuang.'), pool, presets, box),
      el('div', { class: 'lab-kanan' }, el('div', { class: 'ingatan-wrap' }, memoryTable(mem)), test)));
  }
  draw();
}

// Teams: one team secretly trains, the other tests and diagnoses.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act latih' });
  root.append(wrap);
  let trainer = 1;
  let chosen = [];
  function train() {
    const tray = el('div', { class: 'contoh-baki' }, POOL.map((e, i) => onTap(exampleCard(e, { class: 'contoh-kartu tambah' }), () => { chosen.push(POOL[i]); ctx.sound.tap(); count.textContent = `${chosen.length} kartu contoh dipilih`; })));
    const count = el('p', { class: 'reveal info' }, `${chosen.length} kartu contoh dipilih`);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${trainer}: pilih kartu contoh diam-diam (boleh sengaja berat sebelah). Tim ${3 - trainer} jangan melihat!`), tray, count,
      el('div', { class: 'row' }, button('Ulangi pilihan', () => { chosen = []; count.textContent = '0 kartu contoh dipilih'; }, 'small ghost'),
        button(`Selesai, serahkan ke Tim ${3 - trainer} ➜`, () => { if (chosen.length) test(); else shake(count); }, 'primary')));
  }
  function test() {
    const mem = memory(chosen);
    const results = el('div', { class: 'uji-daftar' });
    const tests = el('div', { class: 'row wrap' }, MYSTERY.map((m) => button(`Uji ${m.id}`, () => {
      const g = guess(mem, m);
      results.append(el('div', { class: `uji-baris ${g === m.truth ? '' : 'salah'}` }, mysteryCard(m, true), el('span', null, `Tebakan mesin: ${g} ${g === m.truth ? '✓' : '✗'}`)));
    }, 'small')));
    const diag = el('div', { class: 'col' });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${3 - trainer}: uji mesin Tim ${trainer} dengan kartu misteri. Apa yang salah dengan contoh latihannya?`), tests, results, diag,
      el('div', { class: 'row' }, button('Buka contoh latihannya', () => {
        diag.replaceChildren(el('div', { class: 'ingatan-wrap' }, memoryTable(mem)), el('div', { class: 'contoh-baki kecil' }, chosen.map((e) => exampleCard(e))));
      }, 'small'), button('Tukar peran', () => { trainer = 3 - trainer; chosen = []; train(); }, 'primary')));
  }
  train();
}
