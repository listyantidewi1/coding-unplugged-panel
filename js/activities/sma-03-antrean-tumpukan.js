// Antrean Loket dan Tumpukan Piring — SMA/SMK (16–18 tahun), struktur data.
// Stacks (plates, bracket checking, undo/redo), queues (ticket counter), a
// priority queue in a puskesmas, and a queue built from two stacks.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const WARNA = { merah: '#ef4444', biru: '#3b82f6', hijau: '#22c55e', kuning: '#eab308', putih: '#f8fafc', ungu: '#a855f7' };
export const NAMA = ['Ani', 'Budi', 'Citra', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hana'];

// Run stack (TARUH/AMBIL) or queue (DATANG/LAYANI) ops: [op, value?].
export function runOps(kind, ops) {
  const box = [];
  const out = [];
  for (const [op, v] of ops) {
    if (op === 'TARUH' || op === 'DATANG') box.push(v);
    else if (box.length) out.push(kind === 'tumpukan' ? box.pop() : box.shift());
  }
  return { box, out };
}
export const STACK_OPS = [['TARUH', 'merah'], ['TARUH', 'biru'], ['TARUH', 'hijau'], ['AMBIL'], ['TARUH', 'kuning'], ['AMBIL'], ['AMBIL'], ['TARUH', 'putih']];
export const QUEUE_OPS = [['DATANG', 'Ani'], ['DATANG', 'Budi'], ['DATANG', 'Citra'], ['LAYANI'], ['DATANG', 'Dodi'], ['LAYANI'], ['DATANG', 'Eka'], ['LAYANI']];

const PAIR = { ')': '(', ']': '[', '}': '{' };
// Bracket check with a stack. trace: stack after each bracket.
export function checkBrackets(s) {
  const st = [];
  const trace = [];
  for (const c of s) {
    if ('([{'.includes(c)) { st.push(c); trace.push(st.join('')); } else if (')]}'.includes(c)) {
      if (!st.length) return { ok: false, why: 'kosong', trace, at: c };
      if (st.at(-1) !== PAIR[c]) return { ok: false, why: 'pasangan', trace, at: c };
      st.pop();
      trace.push(st.join('') || 'kosong');
    }
  }
  return st.length ? { ok: false, why: 'terbuka', trace } : { ok: true, trace };
}
export const RUMUS = ['( [ 2 + 3 ] × { 4 − 1 } )', '( 2 + [ 3 × 4 ) ]', '( ( 5 + 2 ) × 3', '{ [ ( ) ] } ( )', ') 2 + 3 ('];
const WHY = { pasangan: 'Tidak sah: kurung tutup tidak cocok dengan puncak tumpukan', terbuka: 'Tidak sah: tumpukan belum kosong di akhir', kosong: 'Tidak sah: kurung tutup datang saat tumpukan kosong' };

export const PASIEN = [['Pak Ahmad', 0, 'hijau'], ['Bu Sinta', 2, 'kuning'], ['Dek Raffi', 5, 'hijau'], ['Pak Jono', 7, 'merah'], ['Nenek Ijah', 12, 'kuning'], ['Mas Bayu', 15, 'merah']];
const RANK = { merah: 0, kuning: 1, hijau: 2 };
// Who should be served next at time t (minutes after 08.00)?
export function nextPatient(list, served, t, rule = 'prioritas') {
  const waiting = list.filter((p) => !served.includes(p[0]) && p[1] <= t);
  if (!waiting.length) return null;
  return [...waiting].sort((a, b) => (rule === 'prioritas' ? RANK[a[2]] - RANK[b[2]] : 0) || a[1] - b[1])[0];
}
export function schedule(list, rule = 'prioritas', dur = 10) {
  const served = [];
  const rows = [];
  let t = 0;
  while (served.length < list.length) {
    let p = nextPatient(list, served, t, rule);
    if (!p) { t = Math.min(...list.filter((q) => !served.includes(q[0])).map((q) => q[1])); p = nextPatient(list, served, t, rule); }
    rows.push({ name: p[0], color: p[2], start: t, end: t + dur, wait: t - p[1] });
    served.push(p[0]);
    t += dur;
  }
  return rows;
}
export const jam = (m) => `${String(8 + Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
// Queue from two stacks.
export function twoStacks(ops) {
  const masuk = [];
  const keluar = [];
  const out = [];
  for (const [op, v] of ops) {
    if (op === 'DATANG') masuk.push(v);
    else { if (!keluar.length) while (masuk.length) keluar.push(masuk.pop()); if (keluar.length) out.push(keluar.pop()); }
  }
  return { masuk, keluar, out };
}

// --- drawing ---
const plate = (c, extra = '') => el('div', { class: `at-piring ${extra}`, style: { '--w': WARNA[c] || '#cbd5e1' } }, c);
const stackView = (items, label = 'Tumpukan') => el('div', { class: 'at-wadah' }, el('div', { class: 'at-tumpuk' }, items.length ? items.map((c, i) => plate(c, i === items.length - 1 ? 'puncak' : '')) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, `${label} (atas ↑)`));
const queueView = (items) => el('div', { class: 'at-wadah' }, el('div', { class: 'at-antre' }, el('span', { class: 'at-loket' }, '🪟 Loket'), items.length ? items.map((n, i) => el('span', { class: `at-orang ${i === 0 ? 'depan' : ''}` }, n)) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, 'Antrean (depan ← belakang)'));
const opsView = (ops) => el('div', { class: 'at-program' }, ops.map(([op, v], i) => el('span', { class: `at-op ${op === 'AMBIL' || op === 'LAYANI' ? 'keluar' : ''}` }, `${i + 1}. ${op}${v ? ` ${v}` : ''}`)));

// Build a stack-permutation target: plates arrive in order; tap TARUH/AMBIL.
function permRound(wrap, ctx, { done }) {
  const input = ['merah', 'biru', 'hijau', 'kuning'];
  const target = [];
  { const st = []; let i = 0; while (target.length < input.length) { if (i < input.length && (!st.length || ctx.rand.int(0, 1))) st.push(input[i++]); else target.push(st.pop()); } }
  let st = [];
  let i = 0;
  let out = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Piring datang berurutan dari dapur. TARUH piring berikutnya, atau AMBIL piring teratas.');
  const draw = () => stage.replaceChildren(el('div', { class: 'at-meja' },
    el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, input.slice(i).map((c) => plate(c))), el('small', null, 'Dari dapur')),
    stackView(st),
    el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, target.map((c, k) => plate(c, k < out.length ? '' : 'bayang'))), el('small', null, 'Urutan diambil yang diminta'))));
  const reset = () => { st = []; i = 0; out = []; draw(); };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Ambil piring tepat dalam urutan yang diminta.'), stage,
    el('div', { class: 'kode-baris' },
      button('TARUH', () => { if (finished || i >= input.length) return; st.push(input[i++]); ctx.sound.tap(); draw(); }, 'primary'),
      button('AMBIL', () => {
        if (finished || !st.length) return;
        const c = st.pop();
        if (c !== target[out.length]) { st.push(c); ctx.mistake(); shake(stage); say(msg, 'bad', `Piring teratas ${c}, padahal yang diminta ${target[out.length]}.${st.includes(target[out.length]) ? ' Piring itu sudah terkubur: ketuk Ulang.' : ''}`); return; }
        out.push(c); ctx.sound.tap(); draw();
        if (out.length === target.length) { finished = true; say(msg, '', 'Tepat! Yang terakhir ditaruh selalu yang pertama diambil (LIFO).'); done(); }
      }, 'primary'),
      button('Ulang', () => { if (!finished) reset(); })), msg);
}

function bracketTrace(s) {
  const r = checkBrackets(s);
  return el('div', { class: 'at-jejak' }, r.trace.map((t) => el('code', null, t)), el('b', { class: r.ok ? 'at-sah' : 'at-tidak' }, r.ok ? 'sah' : WHY[r.why]));
}

function clinicRound(wrap, ctx, { list = PASIEN, rule = 'prioritas', done, free = false }) {
  const served = [];
  const rows = [];
  let t = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, rule === 'prioritas' ? 'Merah dulu, lalu kuning, lalu hijau. Warna sama: yang datang lebih awal.' : 'Siapa datang dulu, dilayani dulu.');
  function arrivedAll() { return list.filter((p) => !served.includes(p[0]) && p[1] <= t); }
  function draw() {
    if (served.length < list.length && !arrivedAll().length) t = Math.min(...list.filter((q) => !served.includes(q[0])).map((q) => q[1]));
    const waiting = arrivedAll();
    const notYet = list.filter((p) => !served.includes(p[0]) && p[1] > t);
    stage.replaceChildren(el('div', { class: 'at-jam' }, `🕗 ${jam(t)}`),
      el('div', { class: 'at-ruang' },
        el('div', { class: 'at-tunggu' }, el('b', null, 'Ruang tunggu (ketuk pasien berikutnya)'), el('div', { class: 'at-pasien-baris' }, waiting.map((p) => onTap(el('button', { class: `at-pasien g-${p[2]}`, type: 'button' }, el('b', null, p[0]), el('small', null, `datang ${jam(p[1])}`)), () => pick(p))))),
        el('div', { class: 'at-tunggu' }, el('b', null, 'Belum datang'), el('div', { class: 'at-pasien-baris' }, notYet.length ? notYet.map((p) => el('span', { class: `at-pasien nanti g-${p[2]}` }, el('b', null, p[0]), el('small', null, jam(p[1])))) : el('small', null, '–')))),
      rows.length ? table(rows) : null);
  }
  function pick(p) {
    if (served.length >= list.length) return;
    const want = nextPatient(list, served, t, rule);
    if (want[0] !== p[0]) { ctx.mistake(); shake(stage); say(msg, 'bad', rule === 'prioritas' ? `Belum tepat: ${want[0]} (${want[2]}${want[2] === p[2] ? `, datang lebih awal` : ''}) didahulukan.` : `Belum tepat: ${want[0]} datang lebih dulu.`); return; }
    rows.push({ name: p[0], color: p[2], start: t, end: t + 10, wait: t - p[1] });
    served.push(p[0]);
    t += 10;
    ctx.sound.tap();
    say(msg, 'info', `${p[0]} diperiksa ${jam(t - 10)}–${jam(t)}, menunggu ${t - 10 - p[1]} menit.`);
    draw();
    if (served.length === list.length) {
      const avg = rows.reduce((a, r) => a + r.wait, 0) / rows.length;
      say(msg, '', `Selesai pukul ${jam(t)}. Rata-rata menunggu ${fmtNum(avg)} menit.`);
      if (done) done(rows);
    }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, free ? `Simulasi puskesmas (${rule === 'prioritas' ? 'antrean prioritas' : 'antrean biasa'}): satu dokter, 10 menit per pasien.` : 'Puskesmas Wanasari: satu dokter, 10 menit per pasien, mulai 08.00. Pilih pasien berikutnya.'), stage, msg);
}
const table = (rows) => el('div', { class: 'at-tabel' }, el('div', { class: 'at-baris kepala' }, ['', 'Pasien', 'Mulai', 'Selesai', 'Menunggu'].map((h) => el('span', null, h))),
  rows.map((r, k) => el('div', { class: `at-baris g-${r.color}` }, el('span', null, k + 1), el('span', null, r.name), el('span', null, jam(r.start)), el('span', null, jam(r.end)), el('span', null, `${r.wait} mnt`))));

export default {
  id: 'sma-03-antrean-tumpukan',
  title: 'Antrean Loket dan Tumpukan Piring',
  topic: 'Tumpukan (stack), antrean (queue), dan antrean prioritas',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🍽️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjalankan operasi tumpukan dan antrean, memeriksa pasangan kurung dan urungkan–ulangi dengan tumpukan, menjadwalkan pasien dengan antrean prioritas dan membandingkannya dengan antrean biasa, serta membangun antrean dari dua tumpukan.',
  extraModes: [
    { id: 'meja', icon: '🍽️', label: 'Meja Piring dan Loket', desc: 'Tekan TARUH, AMBIL, DATANG, dan LAYANI; piring dan orang bergerak di layar', create: createTable },
    { id: 'kurung', icon: '🧮', label: 'Pemeriksa Kurung', desc: 'Ketik rumus, lalu jalankan pemeriksaan langkah demi langkah dengan tumpukan yang tampak', create: createBrackets },
    { id: 'puskesmas', icon: '🏥', label: 'Simulasi Puskesmas', desc: 'Pasien acak berdatangan; pilih pasien berikutnya dengan aturan prioritas atau antrean biasa, lalu bandingkan lama menunggu', create: createClinic },
    { id: 'giliran', icon: '🔁', label: 'Tebak Isi Akhir', desc: 'Satu tim menyusun urutan perintah, tim berikutnya menebak isi akhir tumpukan atau antrean sebelum perintah dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act antrean-tumpukan' });
    root.append(wrap);
    const rumus = ctx.rand.shuffle([1, 2, 4]).slice(0, 2);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const bracketAsk = (k, onRight) => ask(`Rumus ${'abcde'[k]}: apakah pasangan kurungnya sah?`, [['Sah', checkBrackets(RUMUS[k]).ok], ...Object.entries(WHY).map(([w, l]) => [l, checkBrackets(RUMUS[k]).why === w])], 1, el('div', { class: 'au-status' }, RUMUS[k]), () => { wrap.append(bracketTrace(RUMUS[k])); onRight(); });
      if (r === 0) ask('Tumpukan piring hajatan, mulai kosong. Piring apa saja yang diambil, berurutan?', [['hijau, kuning, biru', true], ['merah, biru, hijau'], ['hijau, biru, merah'], ['kuning, hijau, biru']], 1, opsView(STACK_OPS),
        then(() => ask('Isi tumpukan di akhir, dari bawah ke atas?', [['merah, putih', true], ['putih, merah'], ['merah, biru, putih'], ['kuning, putih']], 2, el('div', null, opsView(STACK_OPS)),
          () => { wrap.append(stackView(runOps('tumpukan', STACK_OPS).box)); next(); })));
      else if (r === 1) ask('Antrean loket stasiun, mulai kosong. Siapa saja yang dilayani, berurutan, dan siapa yang masih mengantre?', [['Dilayani Ani, Budi, Citra; masih mengantre Dodi, Eka', true], ['Dilayani Citra, Dodi, Eka; masih mengantre Ani, Budi'], ['Dilayani Ani, Budi, Citra; masih mengantre Eka, Dodi'], ['Dilayani Citra, Budi, Ani; masih mengantre Dodi, Eka']], 1, opsView(QUEUE_OPS),
        then(() => ask('Mengapa loket memakai antrean, bukan tumpukan?', [['Antrean adil: yang datang dulu dilayani dulu. Dengan tumpukan, yang baru datang langsung dilayani dan yang pertama bisa menunggu sangat lama', true], ['Tumpukan lebih cepat, tetapi lebih mahal'], ['Tidak ada bedanya'], ['Karena loket hanya bisa melayani satu orang']], 1, queueView(runOps('antrean', QUEUE_OPS).box))));
      else if (r === 2) permRound(wrap, ctx, { done: next });
      else if (r === 3) bracketAsk(rumus[0], then(() => bracketAsk(rumus[1], next)));
      else if (r === 4) bracketAsk(0, then(() => bracketAsk(3, next)));
      else if (r === 5) ask('Tombol urungkan. Langkah: 1 ketik "Selamat", 2 ketik " pagi", 3 tebalkan "pagi", 4 URUNGKAN, 5 URUNGKAN. Setelah langkah 5, apa teks di layar dan isi tumpukan ulangi (bawah → atas)?', [['"Selamat"; ulangi: tebalkan, ketik " pagi"', true], ['"Selamat pagi"; ulangi: tebalkan'], ['"Selamat"; ulangi: ketik " pagi", tebalkan'], ['"" (kosong); ulangi: ketik "Selamat"']], 1, null,
        then(() => ask('Langkah 6: ketik " siang". Langkah 7: ULANGI. Apa yang terjadi?', [['Tidak terjadi apa-apa: aksi baru di langkah 6 mengosongkan tumpukan ulangi', true], ['Kata " pagi" kembali: "Selamat siang pagi"'], ['Teks menjadi tebal'], ['Kata " siang" terhapus']])));
      else if (r === 6) clinicRound(wrap, ctx, { done: next });
      else if (r === 7) ask('Dengan antrean biasa (FIFO): Ahmad, Sinta, Raffi, Jono, Ijah, Bayu. Berapa menit Pak Jono dan Mas Bayu menunggu, dan bagaimana rata-ratanya dibanding antrean prioritas?', [['Jono 23, Bayu 35; rata-rata keduanya sama 18,17 menit, tetapi dengan prioritas pasien gawat hanya menunggu 3 dan 5 menit', true], ['Jono 3, Bayu 5; FIFO lebih cepat'], ['Jono 23, Bayu 35; FIFO rata-ratanya jauh lebih kecil'], ['Jono 30, Bayu 50; prioritas rata-ratanya lebih kecil']], 1, table(schedule(PASIEN, 'fifo')));
      else if (r === 8) ask('Dek Raffi (hijau) menunggu paling lama. Aturan apa yang mencegah pasien hijau menunggu tanpa batas bila pasien merah dan kuning terus berdatangan?', [['Naikkan prioritas atau periksa ulang pasien yang sudah menunggu melewati batas waktu, atau tambah tenaga untuk pasien hijau', true], ['Hapus pasien hijau dari antrean'], ['Layani pasien hijau lebih dulu dari pasien merah'], ['Tidak perlu aturan apa pun']]);
      else ask('Tantangan: antrean dari dua tumpukan, MASUK dan KELUAR. DATANG 1, 2, 3, LAYANI, DATANG 4, LAYANI, LAYANI, LAYANI. Urutan yang dilayani?', [['1, 2, 3, 4: sama dengan antrean biasa', true], ['3, 2, 1, 4'], ['3, 4, 2, 1'], ['1, 4, 2, 3']], 1, null,
        () => { const t = twoStacks([['DATANG', '1'], ['DATANG', '2'], ['DATANG', '3'], ['LAYANI']]); wrap.append(el('div', { class: 'at-meja' }, stackView(t.masuk, 'MASUK'), stackView(t.keluar.map(String), 'KELUAR setelah LAYANI pertama'))); next(); });
    }
    render();
  },
};

function createTable(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  const st = [];
  const q = [];
  let taken = [];
  let served = [];
  let nameI = 0;
  const stage = el('div');
  const draw = () => stage.replaceChildren(el('div', { class: 'at-meja' },
    el('div', { class: 'at-kolom' }, stackView(st), el('div', { class: 'seg' }, Object.keys(WARNA).map((c) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: { '--w': WARNA[c] } }, `TARUH ${c}`), () => { if (st.length < 9) { st.push(c); ctx.sound.tap(); draw(); } })),
      onTap(el('button', { class: 'seg-btn on', type: 'button' }, 'AMBIL'), () => { if (st.length) { taken.push(st.pop()); ctx.sound.tap(); draw(); } })), el('small', null, `Diambil: ${taken.join(', ') || '–'}`)),
    el('div', { class: 'at-kolom' }, queueView(q), el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, `DATANG ${NAMA[nameI % NAMA.length]}`), () => { if (q.length < 8) { q.push(NAMA[nameI++ % NAMA.length]); ctx.sound.tap(); draw(); } }),
      onTap(el('button', { class: 'seg-btn on', type: 'button' }, 'LAYANI'), () => { if (q.length) { served.push(q.shift()); ctx.sound.tap(); draw(); } })), el('small', null, `Dilayani: ${served.join(', ') || '–'}`))));
  wrap.append(el('p', { class: 'prompt' }, 'Tumpukan: masuk dan keluar dari atas. Antrean: masuk di belakang, keluar di depan.'), stage,
    el('div', { class: 'kode-baris' }, button('Kosongkan', () => { st.length = 0; q.length = 0; taken = []; served = []; nameI = 0; draw(); })));
  draw();
}

function createBrackets(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  let text = RUMUS[1];
  let k = 0;
  const input = el('input', { class: 'kh-masukan', value: text, 'aria-label': 'Rumus' });
  input.addEventListener('input', () => { text = input.value; k = 0; draw(); });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  const out = el('div');
  function draw() {
    const chars = [...text];
    const idx = chars.map((c, i) => ('()[]{}'.includes(c) ? i : -1)).filter((i) => i >= 0);
    const st = [];
    let bad = null;
    for (const i of idx.slice(0, k)) {
      const c = chars[i];
      if ('([{'.includes(c)) st.push(c);
      else if (!st.length) { bad = 'kosong'; break; } else if (st.at(-1) !== PAIR[c]) { bad = 'pasangan'; break; } else st.pop();
    }
    const end = k >= idx.length;
    const verdict = bad ? WHY[bad] : end ? (st.length ? WHY.terbuka : 'Sah: semua kurung tutup cocok dan tumpukan kosong') : `Langkah ${k} dari ${idx.length}`;
    out.replaceChildren(el('div', { class: 'au-status at-rumus' }, chars.map((c, i) => el('span', { class: idx.indexOf(i) === k - 1 ? 'at-kini' : idx.indexOf(i) >= 0 && idx.indexOf(i) < k ? 'at-lewat' : '' }, c))),
      el('div', { class: 'at-tumpuk at-kurung' }, st.length ? st.map((c, i) => el('div', { class: `at-piring ${i === st.length - 1 ? 'puncak' : ''}`, style: { '--w': '#e0e7ff' } }, c)) : el('span', { class: 'at-kosong' }, 'kosong')),
      el('p', { class: bad || (end && st.length) ? 'reveal bad' : end ? 'reveal' : 'reveal info' }, verdict));
    return { done: bad || end };
  }
  wrap.append(el('p', { class: 'prompt' }, 'Pemeriksa kurung: kurung buka di-TARUH, kurung tutup harus cocok dengan puncak.'), input,
    el('div', { class: 'seg' }, RUMUS.map((r2, i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, 'abcde'[i]), () => { text = r2; input.value = r2; k = 0; draw(); }))),
    out, el('div', { class: 'kode-baris' }, button('Langkah ➜', () => { if (!draw().done) { k++; ctx.sound.tap(); draw(); } }, 'primary'), button('Jalankan semua', () => { k = 999; draw(); }), button('Ulang', () => { k = 0; draw(); })));
  draw();
}

function createClinic(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  const names = ['Pak Ahmad', 'Bu Sinta', 'Dek Raffi', 'Pak Jono', 'Nenek Ijah', 'Mas Bayu', 'Kak Lala', 'Om Teguh'];
  let rule = 'prioritas';
  let list = PASIEN;
  const results = {};
  function fresh() { const n = ctx.rand.int(6, 8); list = names.slice(0, n).map((nm) => [nm, ctx.rand.int(0, 40), ctx.rand.pick(['merah', 'kuning', 'hijau', 'hijau'])]).sort((a, b) => a[1] - b[1]); Object.keys(results).forEach((k) => delete results[k]); }
  function draw() {
    wrap.replaceChildren(el('div', { class: 'seg' }, [['prioritas', 'Antrean prioritas'], ['fifo', 'Antrean biasa']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${rule === k ? 'on' : ''}`, type: 'button' }, l), () => { rule = k; draw(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Pasien acak'), () => { fresh(); draw(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Pasien lembar kerja'), () => { list = PASIEN; Object.keys(results).forEach((k) => delete results[k]); draw(); })));
    clinicRound(wrap, ctx, { list, rule, free: true, done: (rows) => { results[rule] = rows; wrap.append(compare()); } });
  }
  const compare = () => el('div', { class: 'ab-lapisan' }, ['prioritas', 'fifo'].filter((k) => results[k]).map((k) => {
    const rows = results[k];
    const avg = (c) => { const w = rows.filter((r) => !c || r.color === c).map((r) => r.wait); return w.length ? fmtNum(w.reduce((a, b) => a + b, 0) / w.length) : '–'; };
    return el('div', { class: 'ab-lap-baris' }, el('span', null, k === 'prioritas' ? 'Prioritas' : 'Antrean biasa'), el('b', null, `rata-rata ${avg()} mnt · merah ${avg('merah')} · kuning ${avg('kuning')} · hijau ${avg('hijau')}`));
  }));
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  let n = 2;
  let pts = [];
  let turn = 0;
  const ROUNDS = 2;
  function start(k) { n = k; pts = Array(n).fill(0); turn = 0; compose(); }
  function compose() {
    if (turn >= n * ROUNDS) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Tebak Isi Akhir', start) });
    const maker = turn % n;
    const guesser = (maker + 1) % n;
    const kind = Math.floor(turn / n) % 2 ? 'antrean' : 'tumpukan';
    const ops = [];
    const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: susun 5–8 perintah. Tim ${guesser + 1} jangan dulu melihat jawabannya!`);
    const prog = el('div');
    const items = kind === 'tumpukan' ? ['merah', 'biru', 'hijau', 'kuning'] : NAMA.slice(0, 5);
    const drawProg = () => prog.replaceChildren(ops.length ? opsView(ops) : el('p', { class: 'reveal hint' }, 'Belum ada perintah.'));
    drawProg();
    const put = kind === 'tumpukan' ? 'TARUH' : 'DATANG';
    const take = kind === 'tumpukan' ? 'AMBIL' : 'LAYANI';
    wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Tim ${maker + 1} menyusun perintah ${kind}`), prog,
      el('div', { class: 'seg' }, items.map((v) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: kind === 'tumpukan' ? { '--w': WARNA[v] } : null }, `${put} ${v}`), () => { if (ops.length < 8) { ops.push([put, v]); drawProg(); } })),
        onTap(el('button', { class: 'seg-btn on', type: 'button' }, take), () => { if (ops.length < 8) { ops.push([take]); drawProg(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button' }, '⌫'), () => { ops.pop(); drawProg(); })),
      el('div', { class: 'kode-baris' }, button('Selesai, giliran menebak ➜', () => { if (ops.length < 5) { say(msg, 'bad', 'Butuh sedikitnya 5 perintah.'); return; } guess(kind, ops, items, maker, guesser); }, 'primary')), msg);
  }
  function guess(kind, ops, items, maker, guesser) {
    const want = runOps(kind, ops).box;
    const g = [];
    const msg = el('p', { class: 'reveal info' }, `Tim ${guesser + 1}: susun isi akhir ${kind === 'tumpukan' ? 'dari bawah ke atas' : 'dari depan ke belakang'}, lalu Kunci.`);
    const view = el('div');
    const drawG = () => view.replaceChildren(kind === 'tumpukan' ? stackView(g, 'Tebakan') : queueView(g));
    drawG();
    let locked = false;
    wrap.replaceChildren(scoreBar(pts, guesser), el('p', { class: 'prompt' }, `Tim ${guesser + 1} menebak isi akhir`), opsView(ops), view,
      el('div', { class: 'seg' }, items.map((v) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: kind === 'tumpukan' ? { '--w': WARNA[v] } : null }, v), () => { if (!locked && g.length < 8) { g.push(v); drawG(); } })),
        onTap(el('button', { class: 'seg-btn', type: 'button' }, '⌫'), () => { if (!locked) { g.pop(); drawG(); } })),
      el('div', { class: 'kode-baris' }, button('Kunci', () => {
        if (locked) return;
        locked = true;
        const ok = g.join() === want.join();
        if (ok) { pts[guesser]++; ctx.sound.good(); } else { pts[maker]++; ctx.sound.bad(); }
        view.append(el('div', { class: 'at-meja' }, el('b', null, 'Isi sebenarnya:'), kind === 'tumpukan' ? stackView(want) : queueView(want)));
        say(msg, ok ? '' : 'bad', ok ? `Tepat! Poin untuk Tim ${guesser + 1}.` : `Belum tepat. Poin untuk Tim ${maker + 1}.`);
        turn++;
        setTimeout(compose, 3200);
      }, 'primary')), msg);
  }
  pickTeams(wrap, 'Tebak Isi Akhir', start);
}
