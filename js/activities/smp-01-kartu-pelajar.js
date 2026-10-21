// Kartu Pelajar Digital — SMP (13–15 tahun), representasi data. A student
// card holds 23 bits in a fixed format of seven fields. Read cards from
// bits, write your own, reject cards whose data cannot be true, and see one
// byte read as a number, a letter and eight pixels.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

const CARA = ['jalan kaki', 'sepeda', 'angkutan umum', 'diantar'];
export const FIELDS = [
  { key: 'kelas', label: 'Kelas', bits: 2, opts: ['7', '8', '9'] },
  { key: 'rombel', label: 'Rombel', bits: 3, opts: [...'ABCDEFGH'] },
  { key: 'absen', label: 'Nomor absen', bits: 6, min: 1, max: 40 },
  { key: 'tanggal', label: 'Tanggal lahir', bits: 5, min: 1, max: 31 },
  { key: 'bulan', label: 'Bulan lahir', bits: 4, min: 1, max: 12 },
  { key: 'cara', label: 'Cara ke sekolah', bits: 2, opts: CARA },
  { key: 'ekskul', label: 'Ekstrakurikuler', bits: 1, opts: ['tidak', 'ya'] },
];
export const CUTS = FIELDS.reduce((a, f) => [...a, (a.at(-1) || 0) + f.bits], []).slice(0, -1); // 2,5,11,16,20,22
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const encode = (card) => FIELDS.map((f) => card[f.key].toString(2).padStart(f.bits, '0')).join('');
export function decode(bits) {
  const card = {};
  let at = 0;
  for (const f of FIELDS) { card[f.key] = parseInt(bits.slice(at, at + f.bits), 2); at += f.bits; }
  return card;
}
// What makes a card impossible even though the machine can read it.
export function problems(card) {
  const p = [];
  if (card.kelas === 3) p.push('Kode kelas 11 tidak dipakai');
  if (card.absen < 1 || card.absen > 40) p.push(`Nomor absen ${card.absen} di luar 1–40`);
  if (card.bulan < 1 || card.bulan > 12) p.push(`Bulan ${card.bulan} tidak ada`);
  else if (card.tanggal < 1 || card.tanggal > DAYS[card.bulan - 1]) p.push(`Tanggal ${card.tanggal} ${MONTHS[card.bulan - 1]} tidak ada`);
  return p;
}
const show = (f, v) => (f.opts ? f.opts[v] ?? `kode ${v.toString(2).padStart(f.bits, '0')}` : String(v));
export const describe = (c) => `kelas ${show(FIELDS[0], c.kelas)}${show(FIELDS[1], c.rombel)}, absen ${c.absen}, lahir ${c.tanggal} ${MONTHS[c.bulan - 1] || `bulan ${c.bulan}`}, ${CARA[c.cara]}, ${c.ekskul ? 'ikut' : 'tidak ikut'} ekstrakurikuler`;

export const DIMAS = '01010001101100011000011';
export const WULAN = '00101011001000101100100';
export const YOHANES = '10000011111111100110111';
export const ANEH = '01111000101111110100000';

function randomCard(rand, { bad = false } = {}) {
  const bulan = rand.int(1, 12);
  const c = { kelas: rand.int(0, 2), rombel: rand.int(0, 7), absen: rand.int(1, 40), tanggal: rand.int(1, DAYS[bulan - 1]), bulan, cara: rand.int(0, 3), ekskul: rand.int(0, 1) };
  if (bad) {
    const kind = rand.int(0, 2);
    if (kind === 0) c.kelas = 3;
    else if (kind === 1) { c.bulan = rand.pick([2, 4, 6, 9, 11]); c.tanggal = c.bulan === 2 ? rand.int(30, 31) : 31; }
    else c.bulan = rand.int(13, 15);
  }
  return c;
}
const fieldOf = (i) => { let at = 0; for (let k = 0; k < FIELDS.length; k++) { at += FIELDS[k].bits; if (i < at) return k; } return 0; };

// 23 bit cells. `gaps` shows separators; `colored` paints the fields.
function bitStrip(bits, { gaps = null, onGap, colored = true, onBit } = {}) {
  const node = el('div', { class: 'bit-strip' });
  [...bits].forEach((b, i) => {
    const cell = el(onBit ? 'button' : 'span', { class: `bit-sel ${colored ? `f${fieldOf(i)}` : ''}`, type: onBit ? 'button' : null }, b);
    if (onBit) onTap(cell, () => onBit(i));
    node.append(cell);
    if (i < bits.length - 1) {
      if (onGap) node.append(onTap(el('button', { class: `bit-gap ${gaps?.has(i + 1) ? 'on' : ''}`, type: 'button', 'data-gap': i + 1 }), () => onGap(i + 1)));
      else if (gaps?.has(i + 1)) node.append(el('i', { class: 'bit-cut' }));
    }
  });
  return node;
}

// The card form: segmented choices and number boxes with a shared keypad.
function cardForm(ctx, { onChange } = {}) {
  const vals = {};
  let focus = null;
  const boxes = {};
  const rows = FIELDS.map((f, k) => {
    let ctl;
    if (f.opts) {
      ctl = el('div', { class: 'seg' }, f.opts.map((o, v) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-v': v }, o), () => { vals[f.key] = v; paint(); onChange?.(vals); })));
    } else {
      ctl = boxes[f.key] = onTap(el('button', { class: 'num-box', type: 'button' }, '…'), () => { focus = f.key; typed = ''; paint(); });
    }
    return el('div', { class: `form-baris f${k}`, 'data-key': f.key }, el('b', null, f.label), ctl);
  });
  let typed = '';
  const keypad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => {
    if (!focus) return;
    typed = (typed + d).slice(-2);
    vals[focus] = Number(typed);
    ctx.sound.tap();
    paint();
    onChange?.(vals);
  })));
  function paint() {
    for (const r of rows) {
      const f = FIELDS.find((x) => x.key === r.dataset.key);
      r.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', vals[f.key] === +b.dataset.v));
      if (boxes[f.key]) { boxes[f.key].textContent = vals[f.key] ?? '…'; boxes[f.key].classList.toggle('fokus', focus === f.key); }
    }
  }
  paint();
  return {
    node: el('div', { class: 'kartu-form' }, el('div', { class: 'form-kolom' }, rows), keypad),
    vals,
    set(c) { Object.assign(vals, c); paint(); },
    mark(wrong) { rows.forEach((r) => r.classList.toggle('salah', wrong.includes(r.dataset.key))); },
  };
}

// Read a card: place separators (unless given), then fill the form.
function readRound(wrap, ctx, { bits, separated = false, allowReject = false, prompt, done }) {
  const card = decode(bits);
  const bad = problems(card).length > 0;
  const gaps = new Set(separated ? CUTS : []);
  const stage = el('div', { class: 'baca-kartu' });
  const msg = el('p', { class: 'reveal info' });
  const form = cardForm(ctx);
  const actions = el('div', { class: 'row' });
  function drawStrip(colored) {
    stage.replaceChildren(bitStrip(bits, { gaps, colored, onGap: colored ? null : (g) => { gaps.has(g) ? gaps.delete(g) : gaps.add(g); ctx.sound.tap(); drawStrip(false); } }));
  }
  function toForm() {
    drawStrip(true);
    msg.textContent = 'Isi ketujuh kolom, lalu Periksa.';
    actions.replaceChildren(...[button('Periksa', () => {
      if (bad) { msg.className = 'reveal bad'; msg.textContent = 'Lihat lagi: apakah isi kartu ini mungkin?'; ctx.mistake(); return; }
      const wrong = FIELDS.filter((f) => form.vals[f.key] !== card[f.key]).map((f) => f.key);
      form.mark(wrong);
      if (wrong.length) { msg.className = 'reveal bad'; msg.textContent = `${wrong.length} kolom belum tepat.`; ctx.mistake(); return; }
      msg.className = 'reveal';
      msg.textContent = `Benar: ${describe(card)}.`;
      done();
    }, 'primary'), allowReject ? button('🚫 Tolak kartu', () => {
      if (!bad) { msg.className = 'reveal bad'; msg.textContent = 'Kartu ini masuk akal. Baca isinya.'; ctx.mistake(); return; }
      msg.className = 'reveal';
      msg.textContent = `Tepat ditolak: ${problems(card).join('; ')}.`;
      done();
    }, 'small') : null].filter(Boolean));
    form.node.hidden = false;
  }
  form.node.hidden = true;
  if (separated) toForm();
  else {
    drawStrip(false);
    msg.textContent = 'Ketuk celah di antara bit untuk memasang 6 pemisah sesuai format (2, 3, 6, 5, 4, 2, 1 bit).';
    actions.replaceChildren(button('Periksa pemisah', () => {
      const wrong = [...gaps].filter((g) => !CUTS.includes(g));
      const missing = CUTS.filter((g) => !gaps.has(g));
      stage.querySelectorAll('.bit-gap').forEach((b) => b.classList.toggle('salah', wrong.includes(+b.dataset.gap)));
      if (wrong.length || missing.length) { msg.className = 'reveal bad'; msg.textContent = `${wrong.length} pemisah salah tempat, ${missing.length} belum dipasang.`; ctx.mistake(); return; }
      msg.className = 'reveal info';
      toForm();
    }, 'primary'));
  }
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, msg, actions, form.node);
}

// Write a card: toggle the 23 bits until they say what the card should say.
function writeRound(wrap, ctx, { target, done }) {
  let bits = '0'.repeat(23);
  const stage = el('div', { class: 'baca-kartu' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk bit untuk mengubah 0 menjadi 1. Warna menunjukkan kolomnya.');
  const draw = () => stage.replaceChildren(bitStrip(bits, { gaps: new Set(CUTS), onBit: (i) => { bits = bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1); ctx.sound.tap(); draw(); } }), legend());
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Tulis kartu: ${describe(target)}.`), stage, msg, button('Periksa', () => {
    if (bits === encode(target)) { msg.className = 'reveal'; msg.textContent = `Tepat: ${bits}`; done(); return; }
    const got = decode(bits);
    const wrong = FIELDS.filter((f) => got[f.key] !== target[f.key]).map((f) => f.label);
    msg.className = 'reveal bad';
    msg.textContent = `Belum tepat: ${wrong.join(', ')}.`;
    ctx.mistake();
  }, 'primary'));
}
const legend = () => el('div', { class: 'bit-legenda' }, FIELDS.map((f, k) => el('span', { class: `f${k}` }, `${f.label} (${f.bits})`)));

export default {
  id: 'smp-01-kartu-pelajar',
  title: 'Kartu Pelajar Digital',
  topic: 'Representasi data: bit, format, dan makna',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🪪',
  source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
  rounds: 11,
  maxPlayers: 4,
  goal: 'Murid membaca dan menulis data 23 bit sesuai format, menolak kartu yang isinya tidak mungkin, menghitung bit paling sedikit, dan menyadari bahwa arti bit ditentukan formatnya.',
  extraModes: [
    { id: 'tulis', icon: '✏️', label: 'Tulis Kartu', desc: 'Pilih isi setiap kolom; 23 bit di bawah kartu langsung berubah', create: createWrite },
    { id: 'baca', icon: '🔍', label: 'Baca Kartu', desc: 'Kartu acak tanpa pemisah; sesekali kartu harus ditolak', create: createRead },
    { id: 'arti', icon: '🔀', label: 'Satu Deret, Banyak Arti', desc: '8 sakelar bit dibaca sebagai bilangan, huruf, dan piksel', create: createMeaning },
    { id: 'tim', icon: '🤝', label: 'Tim Menulis, Tim Membaca', desc: 'Tim A menulis kartu tokoh rekaan secara rahasia, tim B membacanya dari bit', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kartu-pelajar' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 4) => choice(wrap, { prompt, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) readRound(wrap, ctx, { bits: DIMAS, separated: true, prompt: 'Baca kartu Dimas. Bitnya sudah dipisah per kolom.', done: next });
      else if (r === 1) readRound(wrap, ctx, { bits: WULAN, prompt: 'Baca kartu Wulan. Pasang pemisahnya sendiri.', done: next });
      else if (r === 2) readRound(wrap, ctx, { bits: YOHANES, prompt: 'Baca kartu Yohanes.', done: next });
      else if (r === 3) {
        wrap.append(el('div', { class: 'baca-kartu' }, bitStrip(ANEH, { gaps: new Set(CUTS) })));
        ask('Kartu ini terbaca tanpa kesalahan: kelas 8, rombel H, absen 5, tanggal 31, bulan 4, jalan kaki, tidak ikut. Apa yang tidak mungkin?', [['Tanggal 31 April tidak ada', true], ['Rombel H tidak ada'], ['Absen 5 terlalu kecil'], ['Jalan kaki tidak boleh']], 1);
      } else if (r === 4) ask('Kolom Kelas punya 2 bit, tetapi hanya tiga kode yang dipakai. Kode mana yang tidak dipakai, dan apa yang sebaiknya dilakukan mesin?', [['11: tolak kartu atau beri peringatan (validasi data)', true], ['11: tebak saja kelas 10'], ['00: abaikan kolom kelas']], 1);
      else if (r === 5) writeRound(wrap, ctx, { target: randomCard(ctx.rand), done: next });
      else if (r === 6) ask('Ada 38 provinsi di Indonesia. Berapa bit paling sedikit untuk menulis provinsi?', [[5], [6, true], [7], [38]]);
      else if (r === 7) ask('Penduduk Indonesia sekitar 280 juta. Berapa bit paling sedikit agar setiap orang punya nomor sendiri?', [[28], [29, true], [30], [32]]);
      else if (r === 8) ask('Deretan 01001011 sebagai bilangan biner (128, 64, …, 1) bernilai …', [[75, true], [11], [74], [150]]);
      else if (r === 9) ask('Deretan yang sama, 01001011, sebagai kode huruf (A = 65, B = 66, …) adalah huruf …', [['J'], ['K', true], ['L'], ['M']]);
      else {
        const bad = r % 3 === 1;
        readRound(wrap, ctx, { bits: encode(randomCard(ctx.rand, { bad })), allowReject: true, prompt: 'Kartu acak. Baca isinya, atau tolak bila isinya tidak mungkin.', done: next });
      }
    }
    render();
  },
};

function createWrite(root, ctx) {
  const wrap = el('div', { class: 'act kartu-pelajar' });
  root.append(wrap);
  const stage = el('div', { class: 'baca-kartu' });
  const info = el('p', { class: 'reveal info' });
  const form = cardForm(ctx, { onChange: draw });
  form.set({ kelas: 0, rombel: 0, absen: 1, tanggal: 1, bulan: 1, cara: 0, ekskul: 0 });
  function draw() {
    const c = { ...form.vals };
    const ok = FIELDS.every((f) => !f.max || (c[f.key] >= f.min && c[f.key] <= f.max));
    if (!ok) { info.className = 'reveal bad'; info.textContent = 'Nomor absen 1–40, tanggal 1–31, bulan 1–12.'; return; }
    const bits = encode(c);
    stage.replaceChildren(bitStrip(bits, { gaps: new Set(CUTS) }), legend());
    const p = problems(c);
    info.className = p.length ? 'reveal bad' : 'reveal info';
    info.textContent = p.length ? `Mesin bisa menulisnya, tetapi: ${p.join('; ')}.` : `${bits.length} bit: ${bits}`;
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tulis kartu: pilih isi setiap kolom.'), stage, info, form.node);
}

function createRead(root, ctx) {
  const wrap = el('div', { class: 'act kartu-pelajar' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let n = 0;
  let score = 0;
  function go() {
    wrap.replaceChildren(el('p', { class: 'small-note' }, `Kartu ke-${++n} · benar ${score}`));
    readRound(wrap, ctx, { bits: encode(randomCard(rand, { bad: rand.int(1, 4) === 1 })), allowReject: true, prompt: 'Baca kartu, atau tolak bila isinya tidak mungkin.', done() { score++; ctx.sound.win(); wrap.append(button('Kartu berikutnya ➜', go, 'primary')); } });
  }
  go();
}

function createMeaning(root, ctx) {
  const wrap = el('div', { class: 'act kartu-pelajar' });
  root.append(wrap);
  let bits = [0, 1, 0, 0, 1, 0, 1, 1];
  function draw() {
    const v = parseInt(bits.join(''), 2);
    const letter = v >= 65 && v <= 90 ? String.fromCharCode(v) : '—';
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Satu deret, banyak arti: ketuk sakelar bit.'),
      el('div', { class: 'saklar-row' }, bits.map((b, i) => onTap(el('button', { class: `saklar ${b ? 'on' : ''}`, type: 'button' }, el('small', null, 2 ** (7 - i)), b), () => { bits[i] = 1 - bits[i]; ctx.sound.tap(); draw(); }))),
      el('div', { class: 'arti-grid' },
        el('div', { class: 'arti' }, el('small', null, 'Bilangan'), el('b', null, v)),
        el('div', { class: 'arti' }, el('small', null, 'Huruf (A = 65)'), el('b', null, letter)),
        el('div', { class: 'arti' }, el('small', null, '8 piksel (1 = hitam)'), el('div', { class: 'piksel-8' }, bits.map((b) => el('i', { class: b ? 'hitam' : '' }))))),
      el('p', { class: 'reveal info' }, 'Bit tidak punya arti sendiri. Artinya ditentukan oleh format atau kesepakatan cara membacanya.'));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kartu-pelajar' });
  root.append(wrap);
  const score = [0, 0];
  let writer = 0;
  function write() {
    const form = cardForm(ctx);
    form.set({ kelas: 0, rombel: 0, absen: 1, tanggal: 1, bulan: 1, cara: 0, ekskul: 0 });
    const msg = el('p', { class: 'reveal info' }, `Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${writer + 1}: tulis kartu tokoh rekaan secara rahasia. Tim ${2 - writer} jangan melihat!`), form.node, msg, button('Selesai, ubah jadi bit ➜', () => {
      const c = { ...form.vals };
      if (problems(c).length || FIELDS.some((f) => f.max && !(c[f.key] >= f.min && c[f.key] <= f.max))) { msg.className = 'reveal bad'; msg.textContent = 'Isi kartu belum masuk akal.'; shake(msg); return; }
      read(c);
    }, 'primary'));
  }
  function read(secret) {
    const reader = 1 - writer;
    const bits = encode(secret);
    const form = cardForm(ctx);
    const msg = el('p', { class: 'reveal info' }, 'Isi kolom dari bit ini. Satu poin untuk setiap kolom yang benar.');
    let checked = false;
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${reader + 1}: baca kartu ini.`), el('div', { class: 'baca-kartu' }, bitStrip(bits, { colored: false })), form.node, msg, button('Periksa', () => {
      if (checked) return;
      checked = true;
      const right = FIELDS.filter((f) => form.vals[f.key] === secret[f.key]);
      score[reader] += right.length;
      form.mark(FIELDS.filter((f) => !right.includes(f)).map((f) => f.key));
      msg.className = 'reveal';
      msg.textContent = `${right.length} dari 7 kolom benar. Kartu aslinya: ${describe(secret)}.`;
      ctx.sound.good();
      wrap.append(button('Tukar peran ➜', () => { writer = reader; write(); }, 'primary'));
    }, 'primary'));
  }
  write();
}
