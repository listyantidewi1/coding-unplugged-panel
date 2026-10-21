// Penyiram Kebun Sekolah — SMP (13–15 tahun), sensor dan belajar dari
// contoh. A watering machine learns a moisture threshold from 14 days of
// Pak Darto's decisions, adds a second sensor to fix the missed day, and is
// tested on a new week that contains two impossible sensor readings.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

// [hari, kelembapan, suhu, cahaya, catatan, siram]
export const TRAIN = [[1, 55, 27, 'sedang', '', false], [2, 48, 29, 'tinggi', '', false], [3, 41, 31, 'tinggi', '', false], [4, 36, 32, 'tinggi', '', true], [5, 62, 25, 'rendah', 'semalam hujan', false], [6, 50, 28, 'sedang', '', false],
  [7, 38, 31, 'tinggi', 'daun cabai agak layu', true], [8, 33, 33, 'tinggi', '', true], [9, 44, 30, 'sedang', '', false], [10, 35, 26, 'rendah', 'mendung, sore hujan', false], [11, 30, 32, 'tinggi', 'tanah retak-retak', true],
  [12, 47, 29, 'sedang', '', false], [13, 39, 30, 'tinggi', '', true], [14, 42, 31, 'tinggi', 'daun masih segar', false]];
export const TEST = [[15, 37, 31, 'tinggi', '', true], [16, 52, 27, 'sedang', '', false], [17, 0, 30, 'tinggi', '', false], [18, 43, 85, 'sedang', '', false], [19, 34, 32, 'tinggi', '', true], [20, 39, 24, 'rendah', '', false], [21, 45, 31, 'tinggi', '', false]];
export const SECONDS = { none: 'tanpa syarat kedua', cahaya: 'cahaya bukan rendah', tinggi: 'cahaya tinggi', suhu: 'suhu minimal S °C' };
export const category = (v) => (v < 300 ? 'rendah' : v < 700 ? 'sedang' : 'tinggi');
export const broken = ([, m, t]) => m < 5 || t > 50;
// rule: { T, second: 'none'|'cahaya'|'tinggi'|'suhu', S, range }
export function water(day, r) {
  const [, m, t, c] = day;
  if (r.range && broken(day)) return false;
  if (!(m < r.T)) return false;
  if (r.second === 'cahaya') return c !== 'rendah';
  if (r.second === 'tinggi') return c === 'tinggi';
  if (r.second === 'suhu') return t >= r.S;
  return true;
}
export const score = (data, r) => data.filter((d) => water(d, r) === d[5]).length;
export const misses = (data, r) => data.filter((d) => water(d, r) !== d[5]).map((d) => d[0]);
export const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
export const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const dec = (x) => x.toLocaleString('id-ID', { maximumFractionDigits: 1 });
const ruleText = (r) => `siram jika kelembapan < ${r.T}${r.second === 'none' ? '' : ` DAN ${SECONDS[r.second].replace('S', r.S)}`}${r.range ? ' (bacaan mustahil diabaikan)' : ''}`;

// Data table with the rule's decision per day. opts: rule, onCell(day, col), hi (cells), blink.
function table(data, { rule = null, onCell, hi = [], blink = false, onRow } = {}) {
  const icon = { rendah: '☁️', sedang: '⛅', tinggi: '☀️' };
  return el('div', { class: 'ps-tabel-wadah' }, el('table', { class: 'kls-tabel ps-tabel' },
    el('thead', null, el('tr', null, ...['Hari', 'Kelembapan', 'Suhu', 'Cahaya', 'Pak Darto', ...(rule ? ['Mesin'] : [])].map((h) => el('th', null, h)))),
    el('tbody', null, ...data.map((d) => {
      const m = rule ? water(d, rule) : null;
      const row = el('tr', { class: rule ? (m === d[5] ? 'ps-cocok' : 'ps-meleset') : '', 'data-h': d[0] }, el('td', null, d[0]),
        ...[[1, `${d[1]}%`], [2, `${d[2]} °C`], [3, `${icon[d[3]]} ${d[3]}`]].map(([c, v]) => {
          const cell = el('td', { class: `${hi.includes(`${d[0]}-${c}`) ? 'hi' : ''} ${blink && broken(d) && ((c === 1 && d[1] < 5) || (c === 2 && d[2] > 50)) ? 'kedip' : ''}`, 'data-c': `${d[0]}-${c}` }, v);
          return onCell ? onTap(cell, () => onCell(d[0], c)) : cell;
        }),
        el('td', { title: d[4] }, d[5] ? '💧 ya' : 'tidak', d[4] ? el('small', null, ` (${d[4]})`) : null), ...(rule ? [el('td', null, m ? '💧 ya' : 'tidak')] : []));
      return onRow ? onTap(row, () => onRow(d[0])) : row;
    }))));
}

// Rule controls: threshold slider, second condition, optional range check.
function ruleControls(r, redraw, { second = true, range = false } = {}) {
  return el('div', { class: 'ps-atur' },
    slider('Ambang T = ', '', r.T, 20, 60, (v) => { r.T = v; redraw(); }),
    second ? el('div', { class: 'seg' }, Object.entries(SECONDS).map(([k, l]) => onTap(el('button', { class: `seg-btn ${r.second === k ? 'on' : ''}`, type: 'button', 'data-s': k }, l.replace('S', r.S)), () => { r.second = k; redraw(); }))) : null,
    second && r.second === 'suhu' ? slider('S = ', ' °C', r.S, 24, 34, (v) => { r.S = v; redraw(); }) : null,
    range ? onTap(el('button', { class: `seg-btn ${r.range ? 'on' : ''}`, type: 'button' }, 'Periksa rentang sensor'), () => { r.range = !r.range; redraw(); }) : null);
}
// The label follows the thumb while dragging; the table redraws when the thumb is released.
function slider(before, after, value, min, max, fn) {
  const shown = el('b', null, `${value}${after}`);
  const input = el('input', { type: 'range', min, max, value, class: 'ps-range' });
  input.addEventListener('input', () => { shown.textContent = `${input.value}${after}`; });
  input.addEventListener('change', () => fn(Number(input.value)));
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  return el('label', { class: 'ps-geser' }, el('span', null, before, shown), input);
}

export default {
  id: 'smp-20-penyiram',
  title: 'Penyiram Kebun Sekolah',
  topic: 'Sensor, ambang, belajar dari contoh, dan data uji',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🌱',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid memaknai bacaan sensor, mencari ambang yang paling cocok dengan contoh, menambah syarat dari sensor kedua, menguji aturan pada data baru, menemukan bacaan sensor yang rusak, dan membandingkan cara manusia dan mesin memutuskan.',
  extraModes: [
    { id: 'ambang', icon: '🎚️', label: 'Penggeser Ambang', desc: 'Geser T, tambah syarat kedua, lalu uji pada minggu ketiga dengan atau tanpa pemeriksaan rentang', create: createLab },
    { id: 'tim', icon: '🏆', label: 'Lomba Aturan', desc: 'Setiap tim membuat aturan dari 14 hari; pemenangnya ditentukan oleh skor pada data baru yang disembunyikan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act penyiram' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) categoryRound(wrap, ctx, { readings: [250, 640, 910], done: next });
      else if (r === 1) ask('Lihat hari-hari ketika Pak Darto menyiram. Apa persamaannya?', [['Kelembapan 30–39% (di bawah 40), cahaya tinggi, suhu 30–33 °C', true], ['Kelembapan di atas 50%'], ['Selalu hari genap'], ['Cahaya rendah dan suhu di bawah 27 °C']], 1, table(TRAIN));
      else if (r === 2) countRound(wrap, ctx, { done: next });
      else if (r === 3) sliderRound(wrap, ctx, { done: next });
      else if (r === 4) secondRound(wrap, ctx, { done: next });
      else if (r === 5) ask('Minggu ketiga. Aturan A: kelembapan < 40. Aturan B: kelembapan < 40 dan cahaya bukan rendah. Berapa yang cocok?', [['A 5 dari 7, B 6 dari 7', true], ['A 7 dari 7, B 7 dari 7'], ['A 6 dari 7, B 5 dari 7'], ['A 3 dari 7, B 4 dari 7']], 2, table(TEST));
      else if (r === 6) brokenRound(wrap, ctx, { done: next });
      else if (r === 7) ask(`Suhu minggu ketiga: ${TEST.map((d) => d[2]).join(', ')}. Rata-rata dan median, mana yang lebih menggambarkan?`, [[`Rata-rata ${dec(mean(TEST.map((d) => d[2])))} °C, median ${median(TEST.map((d) => d[2]))} °C; median, karena tidak terpengaruh bacaan rusak 85 °C`, true], ['Rata-rata 31 °C, median 37,1 °C; rata-rata lebih tepat'], ['Keduanya 31 °C'], ['Rata-rata, karena memakai semua data']]);
      else ask('Aturan B cocok 14 dari 14 pada data latihan, tetapi tidak sempurna pada minggu ketiga. Mengapa mesin harus diuji dengan data yang tidak dipakai untuk belajar?', [['Aturan bisa cocok dengan kebetulan di contoh; data baru memuat keadaan lain, seperti sensor rusak', true], ['Karena data latihan selalu salah'], ['Supaya skor latihan lebih tinggi'], ['Tidak perlu; 14 dari 14 berarti sempurna']]);
    }
    render();
  },
};

function categoryRound(wrap, ctx, { readings, done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Kurang dari 300 rendah, 300–699 sedang, 700 atau lebih tinggi.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'ab-lapisan' }, readings.map((v, i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, `Bacaan sensor cahaya: ${v}`),
    el('div', { class: 'seg' }, ['rendah', 'sedang', 'tinggi'].map((c) => onTap(el('button', { class: `seg-btn ${pick[i] === c ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-c': c }, c), () => { if (!finished) { pick[i] = c; draw(); } })))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Komputer mengubah angka sensor cahaya (0–1000) menjadi kategori.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = readings.map((v, i) => (pick[i] !== category(v) ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar. Komputer hanya tahu angka dan kategori ini, bukan penyebabnya.'; done();
  }, 'primary')), msg);
}

// Type the number of matching days for T = 30, 35, 40, 45.
function countRound(wrap, ctx, { done }) {
  const Ts = [30, 35, 40, 45];
  const vals = {};
  let focus = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Aturan: siram jika kelembapan < T. Hitung hari yang keputusannya sama dengan Pak Darto.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'ps-samping' }, table(TRAIN), el('table', { class: 'kls-tabel ps-skor' }, el('thead', null, el('tr', null, el('th', null, 'T'), el('th', null, 'Cocok (dari 14)'))),
      el('tbody', null, ...Ts.map((T, i) => el('tr', null, el('td', null, T), el('td', null, onTap(el('button', { class: `ck-isi ${focus === i ? 'fokus' : ''} ${bad.includes(i) ? 'salah' : ''}`, type: 'button', 'data-i': i }, vals[i] ?? '…'), () => { focus = i; draw(); }))))))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; const v = Number(String(vals[focus] ?? '') + d); vals[focus] = v > 14 ? Number(d) : v; draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { vals[focus] = undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, 'Mesin belajar dari contoh: coba beberapa ambang T.'), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const bad = Ts.map((T, i) => (vals[i] !== score(TRAIN, { T, second: 'none' }) ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} isian belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: 9, 11, 13, 10. Ambang terbaik T = 40 (T = 41 sama baiknya).'; done();
  }, 'primary')), msg);
}

// Slide T to the best score, then tap the day that still misses.
function sliderRound(wrap, ctx, { done }) {
  const r = { T: 30, second: 'none', S: 28, range: false };
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const s = score(TRAIN, r);
    msg.className = finished ? 'reveal' : 'reveal info';
    if (!finished) msg.textContent = `T = ${r.T}: cocok ${s} dari 14. Geser sampai skornya terbaik, lalu ketuk baris hari yang masih meleset.`;
    stage.replaceChildren(ruleControls(r, draw, { second: false }), table(TRAIN, { rule: r, onRow: tap }));
  }
  function tap(h) {
    if (finished) return;
    if (score(TRAIN, r) < 13) { msg.className = 'reveal bad'; msg.textContent = 'Geser dulu ambangnya sampai skornya terbaik.'; return; }
    if (h !== 10) { msg.className = 'reveal bad'; msg.textContent = `Hari ${h} sudah cocok.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Hari 10: mendung, cahaya rendah, dan sore hujan. Pak Darto tahu tanah akan basah.`;
    draw();
    done();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Penggeser ambang: cari T terbaik.'), stage, msg);
}

// Add a second condition until the rule matches all 14 days.
function secondRound(wrap, ctx, { done }) {
  const r = { T: 40, second: 'none', S: 28, range: false };
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    const s = score(TRAIN, r);
    if (!finished) { msg.className = 'reveal info'; msg.textContent = `${ruleText(r)}: cocok ${s} dari 14.`; }
    stage.replaceChildren(ruleControls(r, draw), table(TRAIN, { rule: r }));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tambahkan syarat dari sensor kedua supaya hari 10 juga cocok.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    if (r.second === 'none' || score(TRAIN, r) < 14) { msg.className = 'reveal bad'; msg.textContent = `Baru ${score(TRAIN, r)} dari 14. Coba syarat lain.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = `${ruleText(r)}: cocok 14 dari 14.`; done();
  }, 'primary')), msg);
}

// Tap the two impossible readings in the test week.
function brokenRound(wrap, ctx, { done }) {
  const want = ['17-1', '18-2'];
  const got = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk dua bacaan yang berasal dari sensor rusak.');
  function draw() { stage.replaceChildren(table(TEST, { onCell: tap, hi: got })); }
  function tap(h, c) {
    if (finished || got.includes(`${h}-${c}`)) return;
    if (!want.includes(`${h}-${c}`)) { msg.className = 'reveal bad'; msg.textContent = 'Bacaan itu masih masuk akal.'; ctx.mistake(); return; }
    got.push(`${h}-${c}`);
    ctx.sound.good();
    if (got.length === 2) { finished = true; msg.className = 'reveal'; msg.textContent = 'Hari 17 kelembapan 0% (kemarin 52%, Pak Darto tidak menyiram) dan hari 18 suhu 85 °C: mustahil untuk kebun.'; done(); }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Minggu ketiga: dua bacaan berasal dari sensor yang rusak.'), stage, msg);
}

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act penyiram' });
  root.append(wrap);
  const r = { T: 40, second: 'none', S: 28, range: false };
  let week = 'latihan';
  function draw() {
    const data = week === 'latihan' ? TRAIN : TEST;
    wrap.replaceChildren(el('div', { class: 'seg' }, [['latihan', 'Data latihan (hari 1–14)'], ['uji', 'Minggu ketiga (hari 15–21)']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${week === k ? 'on' : ''}`, type: 'button' }, l), () => { week = k; draw(); }))),
      ruleControls(r, draw, { range: true }), table(data, { rule: r, blink: r.range }),
      el('p', { class: 'reveal info' }, `${ruleText(r)} · latihan ${score(TRAIN, r)}/14 · minggu ketiga ${score(TEST, r)}/7${misses(data, r).length ? ` · meleset: hari ${misses(data, r).join(', ')}` : ''}`));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act penyiram' });
  root.append(wrap);
  let n = 2;
  let k = 0;
  const rules = [];
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { k = 0; rules.length = 0; make(); }, 'primary')));
  }
  function make() {
    const r = { T: 40, second: 'none', S: 28, range: false };
    const box = el('div');
    const draw = () => box.replaceChildren(ruleControls(r, draw, { range: true }), table(TRAIN, { rule: r }), el('p', { class: 'reveal info' }, `${ruleText(r)} · latihan ${score(TRAIN, r)}/14`));
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${k + 1}: buat aturan dari data 14 hari. Data uji disembunyikan.`), box,
      el('div', { class: 'kode-baris' }, button(k + 1 < n ? 'Simpan aturan, tim berikutnya ➜' : 'Simpan aturan dan uji semua ➜', () => { rules.push({ ...r }); k++; if (k < n) make(); else reveal(); }, 'primary')));
  }
  function reveal() {
    const best = Math.max(...rules.map((r) => score(TEST, r)));
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Hasil pada data baru (minggu ketiga):'), table(TEST),
      el('div', { class: 'ab-lapisan' }, rules.map((r, i) => el('div', { class: `ab-lap-baris ${score(TEST, r) === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}: ${ruleText(r)}`), el('b', null, `latihan ${score(TRAIN, r)}/14 · uji ${score(TEST, r)}/7${score(TEST, r) === best ? ' 🏆' : ''}`)))),
      el('p', { class: 'reveal info' }, 'Pemenang ditentukan oleh skor pada data uji, bukan data latihan.'), el('div', { class: 'kode-baris' }, button('Main lagi', setup, 'primary')));
  }
  setup();
}
