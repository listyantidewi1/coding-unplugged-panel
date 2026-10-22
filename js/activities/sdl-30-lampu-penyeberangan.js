// Lampu Penyeberangan Sekolah — SD Lanjut (10–12 tahun), perulangan
// selamanya, menunggu, dan urutan perintah. A traffic light program runs
// forever; it waits for seconds or for the button. A timeline keeps the
// colour of both lights every second and marks two greens at once.

import { el, onTap, button, choice, shake } from '../core/kit.js';

// Statements inside ULANGI SELAMANYA.
const ON = (target) => ({ op: 'nyala', target });
const W = (n) => ({ op: 'tunggu', n });
const BTN = () => ({ op: 'tombol' });
const SET = (v, n) => ({ op: 'atur', v, n });
const DEC = (v, n) => ({ op: 'kurangi', v, n });
const SHOW = (v) => ({ op: 'tampil', v });
const U = (n, ...body) => ({ op: 'ulangi', n, body });

const TARGETS = ['hijau kendaraan', 'kuning kendaraan', 'merah kendaraan', 'hijau penyeberang', 'merah penyeberang'];
export const SCHOOL = [ON('hijau kendaraan'), ON('merah penyeberang'), BTN(), W(5), ON('kuning kendaraan'), W(3), ON('merah kendaraan'), ON('hijau penyeberang'), W(15)];
export const RAKA = [ON('hijau kendaraan'), BTN(), W(5), ON('kuning kendaraan'), W(3), ON('merah kendaraan'), ON('hijau penyeberang'), W(15)];
export const FIXED = [ON('merah penyeberang'), ...RAKA];
const COUNT = [SET('sisa', 15), U(15, SHOW('sisa'), W(1), DEC('sisa', 1))];
export const WITH_COUNT = [...SCHOOL.slice(0, -1), ...COUNT];

export const stmtText = (s) => ({
  nyala: () => `NYALAKAN ${s.target}`,
  tunggu: () => `TUNGGU ${s.n} detik`,
  tombol: () => 'TUNGGU SAMPAI tombol ditekan',
  atur: () => `ATUR ${s.v} MENJADI ${s.n}`,
  kurangi: () => `KURANGI ${s.v} ${s.n}`,
  tampil: () => `TAMPILKAN ${s.v}`,
  ulangi: () => `ULANGI ${s.n} KALI [`,
}[s.op]());

// Simulates until `until` seconds. `presses` are the seconds the button is
// pressed; a press is read only while the program waits at TUNGGU SAMPAI.
// `sample[t]` is the state during second t (after the instant commands at t).
export function simulate(prog, presses = [], until = 40, init = { kend: 'merah', peny: 'merah' }) {
  const st = { ...init };
  const vars = {};
  let t = 0, error = null, display = null;
  const sample = [];
  const flash = [];
  const read = new Set();
  const fill = (to, path) => {
    for (let k = t; k < Math.min(to, until + 1); k++) sample[k] = { kend: st.kend, peny: st.peny, path, display };
    t = to;
  };
  const exec = (items, path) => {
    for (let i = 0; i < items.length; i++) {
      if (error || t > until) return;
      const s = items[i];
      const p = [...path, i].join('.');
      if (s.op === 'nyala') {
        const [color, who] = s.target.split(' ');
        st[who === 'kendaraan' ? 'kend' : 'peny'] = color;
        if (st.kend === 'hijau' && st.peny === 'hijau') flash.push(t);
      } else if (s.op === 'tunggu') fill(t + s.n, p);
      else if (s.op === 'tombol') {
        const press = presses.filter((x) => x >= t && !read.has(x)).sort((a, b) => a - b)[0];
        if (press === undefined) { fill(until + 1, p); return; }
        read.add(press);
        fill(press, p);
      } else if (s.op === 'atur') vars[s.v] = s.n;
      else if (s.op === 'kurangi') {
        if (!(s.v in vars)) { error = `Variabel ${s.v} belum diisi. Pakai ATUR dulu.`; return; }
        vars[s.v] -= s.n;
      } else if (s.op === 'tampil') display = s.v in vars ? vars[s.v] : '?';
      else if (s.op === 'ulangi') for (let k = 0; k < s.n && !error && t <= until; k++) exec(s.body, [...path, i]);
    }
  };
  let guard = 0;
  while (t <= until && !error) {
    const before = t;
    exec(prog, []);
    if (t === before && ++guard > 3) { error = 'Satu putaran tidak memakai waktu sama sekali. Tambahkan TUNGGU di dalam perulangan.'; break; }
    if (t !== before) guard = 0;
    display = null;
  }
  for (let k = 0; k <= until; k++) if (!sample[k]) sample[k] = { kend: st.kend, peny: st.peny, path: null, display: null };
  const pressInfo = presses.map((x) => ({ t: x, read: read.has(x) }));
  // Flashes at a whole second where both stay green count as danger; other
  // flashes last only an instant.
  const danger = sample.map((s) => s.kend === 'hijau' && s.peny === 'hijau');
  return { sample, presses: pressInfo, flash: [...new Set(flash)], danger, error, until };
}
export const when = (r, pred) => r.sample.findIndex(pred);

// Program rows; line numbers follow the worksheet (ULANGI SELAMANYA is 1).
function progNode(prog, { edit } = {}) {
  const box = el('div', { class: 'lpy-kode' });
  let no = 1;
  box.append(el('div', { class: 'lpy-baris' }, el('span', { class: 'lpy-no' }, no++), el('span', null, 'ULANGI SELAMANYA [')));
  const walk = (items, path, depth) => items.forEach((s, i) => {
    const p = [...path, i];
    const row = el('div', { class: 'lpy-baris', style: { '--d': depth }, 'data-path': p.join('.') },
      el('span', { class: 'lpy-no' }, no++), ...(edit ? edit(s, items, i, p) : [el('span', null, s.text ?? stmtText(s))]));
    box.append(row);
    if (s.body) {
      walk(s.body, p, depth + 1);
      if (edit && !s.body.length) box.append(el('div', { class: 'lpy-baris kosong', style: { '--d': depth + 1 } }, el('span', { class: 'lpy-no' }), '…'));
      box.append(el('div', { class: 'lpy-baris', style: { '--d': depth } }, el('span', { class: 'lpy-no' }, no++), ']'));
    }
  });
  walk(prog, [], 1);
  box.append(el('div', { class: 'lpy-baris' }, el('span', { class: 'lpy-no' }, no), ']'));
  return box;
}

function light(code, path) {
  code.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
  if (path) code.querySelector(`[data-path="${path}"]`)?.classList.add('nyala');
}

// The street: both light poles, the button, the countdown screen and a clock.
function scene(onPress) {
  const lamp = (cls) => el('i', { class: `lpy-lampu ${cls}` });
  const kend = { merah: lamp('merah'), kuning: lamp('kuning'), hijau: lamp('hijau') };
  const peny = { merah: lamp('merah lpy-orang'), hijau: lamp('hijau lpy-orang') };
  peny.merah.textContent = '🧍'; peny.hijau.textContent = '🚶';
  const clock = el('b', { class: 'lpy-jam' }, 'detik ke-0');
  const screen = el('b', { class: 'lpy-layar-kecil' }, '');
  const press = onTap(el('button', { class: 'lpy-tombol', type: 'button' }, 'TEKAN UNTUK MENYEBERANG'), () => onPress?.());
  const road = el('div', { class: 'lpy-jalan' }, el('span', { class: 'lpy-mobil' }, '🛵'), el('div', { class: 'lpy-zebra' }), el('span', { class: 'lpy-anak' }, '🧒'));
  const node = el('div', { class: 'lpy-adegan' }, road,
    el('div', { class: 'lpy-tiang-tiang' },
      el('div', { class: 'lpy-tiang' }, el('small', null, 'kendaraan'), kend.merah, kend.kuning, kend.hijau),
      el('div', { class: 'lpy-tiang' }, el('small', null, 'penyeberang'), peny.merah, peny.hijau, screen),
      onPress ? press : null),
    clock);
  return {
    node,
    set(t, s, danger) {
      Object.entries(kend).forEach(([c, n]) => n.classList.toggle('on', s.kend === c));
      Object.entries(peny).forEach(([c, n]) => n.classList.toggle('on', s.peny === c));
      clock.textContent = `detik ke-${t}`;
      screen.textContent = s.display ?? '';
      node.classList.toggle('bahaya', !!danger);
      node.classList.toggle('jalan-kendaraan', s.kend !== 'merah');
      node.classList.toggle('jalan-orang', s.peny === 'hijau');
    },
    press,
  };
}

// Timeline: two coloured rows, one cell per second.
function timeline(until) {
  const cells = (cls) => Array.from({ length: until + 1 }, (_, k) => el('i', { class: `lpy-sel ${cls}`, 'data-t': k }));
  const marks = Array.from({ length: until + 1 }, (_, k) => el('i', { class: 'lpy-sel tanda', 'data-t': k }, k % 5 === 0 ? k : ''));
  const presses = Array.from({ length: until + 1 }, () => el('i', { class: 'lpy-sel tekan' }));
  const kend = cells('kend'), peny = cells('peny');
  const row = (label, list) => el('div', { class: 'lpy-pita', style: { '--n': until + 1 } }, el('span', { class: 'lpy-label' }, label), ...list);
  const node = el('div', { class: 'lpy-garis-waktu' }, row('tombol', presses), row('kendaraan', kend), row('penyeberang', peny), row('detik', marks));
  return {
    node,
    reset() { [...kend, ...peny].forEach((c) => { c.className = c.className.replace(/ (hijau|kuning|merah|bahaya|kini)/g, ''); }); presses.forEach((c) => { c.className = 'lpy-sel tekan'; }); },
    paint(t, s, danger) {
      kend[t].classList.add(s.kend); peny[t].classList.add(s.peny);
      if (danger) { kend[t].classList.add('bahaya'); peny[t].classList.add('bahaya'); }
      [...kend, ...peny].forEach((c) => c.classList.remove('kini'));
      kend[t].classList.add('kini'); peny[t].classList.add('kini');
    },
    press(t, isRead) { if (presses[t]) presses[t].className = `lpy-sel tekan ${isRead ? 'baca' : 'abaikan'}`; },
  };
}

function playRun(code, sc, tl, r, { speed = 60, done, from = 0 } = {}) {
  let t = from, timer = null;
  const tick = () => {
    if (t > r.until) { light(code, null); done?.(); return; }
    const s = r.sample[t];
    light(code, s.path);
    sc.set(t, s, r.danger[t]);
    tl.paint(t, s, r.danger[t]);
    r.presses.filter((x) => x.t === t).forEach((x) => tl.press(t, x.read));
    t++;
    timer = setTimeout(tick, speed);
  };
  timer = setTimeout(tick, 150);
  return () => clearTimeout(timer);
}

const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });
const RAKA_INIT = { kend: 'merah', peny: 'merah' };

// Worksheet questions in order. Each run starts with all lights red.
const PLAN = [
  { prog: SCHOOL, presses: [12], prompt: 'Soal 1a. Mengapa program memakai ULANGI SELAMANYA, bukan ULANGI 10 KALI?', opts: textOpts('Lampu harus bekerja terus-menerus tanpa berhenti.', ['Supaya lampu berganti lebih cepat.', 'Supaya tombol tidak perlu ditekan.']) },
  { prog: SCHOOL, presses: [12], prompt: 'b. Apa gunanya TUNGGU 5 detik di baris 5?', opts: textOpts('Memberi waktu kendaraan supaya tidak mengerem mendadak, dan memberi jarak antar penyeberangan.', ['Supaya lampu penyeberang hijau lebih lama.', 'Menunggu tombol ditekan.']) },
  { prog: SCHOOL, presses: [12], prompt: 'Soal 2. Sari menekan tombol pada detik ke-12. Lampu kendaraan pada detik ke-18?', opts: textOpts('kuning', ['hijau', 'merah']), columns: 3 },
  { prog: SCHOOL, presses: [12], prompt: 'Pada detik ke-21, lampu kendaraan dan lampu penyeberang?', opts: textOpts('merah dan hijau', ['kuning dan merah', 'hijau dan merah', 'merah dan merah']) },
  { prog: SCHOOL, presses: [12], prompt: 'Pada detik ke-36?', opts: textOpts('hijau dan merah', ['merah dan hijau', 'kuning dan merah', 'hijau dan hijau']) },
  { prog: SCHOOL, presses: [12], prompt: 'a. Pada detik ke berapa lampu penyeberang menjadi hijau?', ...nums([12, 17, 20, 25], 20) },
  { prog: SCHOOL, presses: [12], prompt: 'Berapa detik Sari menunggu?', ...nums([3, 5, 8, 20], 8) },
  { prog: SCHOOL, presses: [12], prompt: 'b. Berapa detik lampu penyeberang hijau?', ...nums([5, 8, 15, 20], 15) },
  { prog: SCHOOL, presses: [12], prompt: 'c. Pada detik ke berapa program kembali ke baris 2?', ...nums([30, 35, 36, 40], 35) },
  { prog: SCHOOL, presses: [12, 25, 40], until: 50, prompt: 'Soal 3a. Dedi menekan tombol pada detik ke-25. Apakah tekanannya membuat putaran baru?', opts: textOpts('Tidak. Program sedang di baris 10, bukan baris 4, jadi tekanannya tidak terbaca.', ['Ya, lampu langsung berganti.', 'Ya, lampu berganti 8 detik kemudian.']) },
  { prog: SCHOOL, presses: [12, 25, 40], until: 50, prompt: 'b. Budi menekan tombol pada detik ke-40. Pada detik ke berapa lampu penyeberang hijau untuk Budi?', ...nums([40, 45, 48, 55], 48) },
  { prog: SCHOOL, presses: [12, 25, 40], until: 50, prompt: 'c. Bila program sedang di baris 4, berapa detik penyeberang selalu menunggu?', ...nums([3, 5, 8, 15], 8) },
  { prog: RAKA, presses: [12], prompt: 'Soal 4. Program Raka. Pada detik ke-30, lampu kendaraan dan penyeberang?', opts: textOpts('merah dan hijau', ['hijau dan merah', 'merah dan merah']) },
  { prog: RAKA, presses: [12], prompt: 'b. Pada detik ke-36?', opts: textOpts('hijau dan hijau. Berbahaya!', ['hijau dan merah', 'merah dan hijau']) },
  { prog: RAKA, presses: [12], prompt: 'c. Mengapa putaran pertama tampak benar?', opts: textOpts('Saat dinyalakan, lampu penyeberang sudah merah. Tidak ada perintah yang mengembalikannya menjadi merah.', ['Tombol ditekan terlalu cepat.', 'TUNGGU 5 detik terlalu pendek.']) },
  { prog: RAKA, presses: [12], prompt: 'd. Di mana NYALAKAN merah penyeberang harus diletakkan?', opts: textOpts('Di awal isi perulangan, sebelum NYALAKAN hijau kendaraan.', ['Setelah NYALAKAN hijau penyeberang.', 'Setelah TUNGGU SAMPAI tombol ditekan.', 'Di luar perulangan, sebelum ULANGI SELAMANYA.']), play: FIXED },
  { prog: [...SCHOOL.slice(0, -1), SET('sisa', 15), { op: 'ulangi', n: 15, body: [{ op: 'tunggu', n: 1, text: '……' }] }], presses: [12], prompt: 'Tantangan. Hitung mundur 15 sampai 1. Isi ULANGI 15 KALI yang benar?', opts: textOpts('TAMPILKAN sisa, TUNGGU 1 detik, KURANGI sisa 1', ['KURANGI sisa 1, TAMPILKAN sisa, TUNGGU 1 detik', 'TAMPILKAN sisa, KURANGI sisa 1', 'TUNGGU 15 detik, TAMPILKAN sisa']), play: WITH_COUNT },
];

function round(wrap, ctx, p, next) {
  const until = p.until ?? 40;
  const code = progNode(p.prog);
  const sc = scene();
  const tl = timeline(until);
  sc.set(0, RAKA_INIT, false);
  const marks = el('p', { class: 'lpy-catatan' }, `Tombol ditekan pada detik ke-${p.presses.join(', ')}.`);
  const subject = el('div', { class: 'lpy-soal' }, el('div', { class: 'lpy-atas' }, code, el('div', { class: 'lpy-kanan' }, sc.node, marks)), tl.node);
  const after = () => {
    const prog = p.play ?? p.prog;
    const shown = p.play ? progNode(prog) : code;
    if (p.play) code.replaceWith(shown);
    const r = simulate(prog, p.presses, until, RAKA_INIT);
    playRun(shown, sc, tl, r, { speed: 55, done: () => setTimeout(next, 900) });
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.columns ?? (p.opts.some((o) => o.label.length > 28) ? 1 : 2); }
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-30-lampu-penyeberangan',
  title: 'Lampu Penyeberangan Sekolah',
  topic: 'Perulangan selamanya dan menunggu',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🚦',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan program lampu yang berulang selamanya dengan garis waktu, menghitung lama menunggu, menemukan bug dua lampu hijau, dan memperbaiki urutan perintahnya.',
  extraModes: [
    { id: 'simpang', icon: '🚦', label: 'Persimpangan', desc: 'Susun program lampu, jalankan, dan tekan tombolnya sendiri', create: createLive },
    { id: 'tebak', icon: '🔁', label: 'Penyeberang dan Pengendara', desc: 'Satu tim memilih kapan menekan tombol, tim lain menebak kapan lampu kendaraan merah', create: createGuess },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lampu-penyeberangan' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
const WAITS = [1, 2, 3, 5, 8, 10, 15];
const LOOPS = [2, 3, 5, 10, 15];

// Live crossing: block editor, the street with a real button, speed control
// and a timeline that grows each second.
function createLive(root, ctx) {
  const wrap = el('div', { class: 'act lampu-penyeberangan' });
  root.append(wrap);
  const until = 60;
  let prog = structuredClone(SCHOOL);
  let openPath = [];
  let running = false, t = 0, timer = null, speed = 400, presses = [];
  const sc = scene(() => {
    if (!running) { shake(sc.press); return; }
    if (!presses.includes(t)) presses.push(t);
    ctx.sound.tap();
  });
  let tl = timeline(until);
  const tlHost = el('div', { class: 'lpy-garis-tempat' }, tl.node);
  const info = el('p', { class: 'lpy-info' });
  const codeHost = el('div', { class: 'lpy-kode-tempat' });
  const at = (path) => path.reduce((items, i) => items[i].body, prog);
  const openBlock = () => (openPath.length ? at(openPath.slice(0, -1))[openPath.at(-1)] : null);
  const draw = () => {
    const open = openBlock();
    const act = (fn) => () => { if (!running) { fn(); ctx.sound.tap(); draw(); } };
    const chip = (text, fn) => onTap(el('button', { class: 'lpy-pilih', type: 'button' }, text), act(fn));
    const edit = (s, items, i, p) => {
      const parts = s.op === 'nyala' ? [el('b', null, 'NYALAKAN'), chip(s.target, () => { s.target = cycle(TARGETS, s.target); })]
        : s.op === 'tunggu' ? [el('b', null, 'TUNGGU'), chip(s.n, () => { s.n = cycle(WAITS, s.n); }), el('b', null, 'detik')]
          : s.op === 'ulangi' ? [el('b', null, 'ULANGI'), chip(s.n, () => { s.n = cycle(LOOPS, s.n); }), el('b', null, 'KALI [')]
            : [el('span', null, stmtText(s))];
      parts.push(el('span', { class: 'lpy-aksi' },
        i > 0 ? onTap(el('button', { class: 'lpy-geser', type: 'button', 'aria-label': 'naikkan' }, '▲'), act(() => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; openPath = []; })) : null,
        onTap(el('button', { class: 'lpy-hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), act(() => { items.splice(i, 1); openPath = []; }))));
      return parts;
    };
    const node = progNode(prog, { edit });
    node.querySelectorAll('[data-path]').forEach((row) => {
      const path = row.dataset.path.split('.').map(Number);
      const s = path.reduce((acc, k, j) => (j === 0 ? acc[k] : acc.body[k]), prog);
      if (s.body) { row.classList.add('wadah'); if (s === open) row.classList.add('buka'); row.addEventListener('click', (e) => { if (!e.target.closest('button') && !running) { openPath = path; draw(); } }); }
    });
    codeHost.replaceChildren(node);
  };
  const add = (s) => {
    if (running) return;
    if (JSON.stringify(prog).split('"op"').length > 18) { shake(codeHost); return; }
    const target = openPath.length ? openBlock().body : prog;
    target.push(s);
    if (s.body) openPath = [...openPath, target.length - 1];
    ctx.sound.tap(); draw();
  };
  const palette = el('div', { class: 'lpy-palet' },
    ...[['NYALAKAN', () => ON('merah penyeberang')], ['TUNGGU n detik', () => W(5)], ['TUNGGU SAMPAI tombol', BTN], ['ULANGI n KALI', () => U(3)],
      ['ATUR sisa 15', () => SET('sisa', 15)], ['KURANGI sisa 1', () => DEC('sisa', 1)], ['TAMPILKAN sisa', () => SHOW('sisa')]]
      .map(([label, make]) => onTap(el('button', { class: 'lpy-kartu', type: 'button' }, label), () => add(make()))),
    button('Tutup ]', () => { openPath = openPath.slice(0, -1); draw(); }, 'small'));
  const stop = () => { clearTimeout(timer); running = false; startBtn.textContent = '▶ Mulai'; light(codeHost, null); };
  const reset = () => { stop(); t = 0; presses = []; tl = timeline(until); tlHost.replaceChildren(tl.node); sc.set(0, { kend: 'merah', peny: 'merah' }, false); info.textContent = ''; };
  const tick = () => {
    if (t > until) { stop(); info.textContent = 'Garis waktu penuh (60 detik). Tekan Ulang untuk mulai lagi.'; return; }
    const r = simulate(prog, presses, t, { kend: 'merah', peny: 'merah' });
    if (r.error) { stop(); info.textContent = `⛔ ${r.error}`; ctx.sound.bad(); return; }
    const s = r.sample[t];
    light(codeHost, s.path); sc.set(t, s, r.danger[t]); tl.paint(t, s, r.danger[t]);
    r.presses.forEach((x) => tl.press(x.t, x.read));
    if (r.danger[t]) { info.textContent = `⚠️ Detik ke-${t}: lampu kendaraan dan penyeberang sama-sama hijau!`; ctx.sound.bad(); }
    else if (r.flash.includes(t)) info.textContent = `⚠️ Detik ke-${t}: sekejap kedua lampu hijau. Periksa urutan perintahnya.`;
    t++;
    timer = setTimeout(tick, speed);
  };
  const startBtn = button('▶ Mulai', () => {
    if (running) { stop(); return; }
    if (!prog.length) { shake(codeHost); return; }
    if (t > until) reset();
    running = true; startBtn.textContent = '⏸ Jeda'; tick();
  }, 'primary');
  const speeds = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Kecepatan'),
    ...[['lambat', 900], ['biasa', 400], ['cepat', 120]].map(([l, ms]) => button(l, () => { speed = ms; ctx.sound.tap(); }, 'small')));
  const load = (p) => { reset(); prog = structuredClone(p); openPath = []; draw(); };
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Program sekolah', () => load(SCHOOL), 'small'), button('Program Raka (bug)', () => load(RAKA), 'small'),
    button('Dengan hitung mundur', () => load(WITH_COUNT), 'small'), button('Kosongkan', () => load([]), 'small'));
  draw(); reset();
  wrap.append(examples, el('div', { class: 'lpy-atas' }, el('div', { class: 'lpy-kiri' }, codeHost, palette),
    el('div', { class: 'lpy-kanan' }, sc.node, el('div', { class: 'row' }, startBtn, button('⟲ Ulang', reset, 'small')), speeds)), tlHost, info);
  return { destroy() { stop(); } };
}

// Bergiliran: the crosser picks up to two press times; the rider guesses
// the second the car light turns red. Both see the program.
function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act lampu-penyeberangan' });
  root.append(wrap);
  const score = [0, 0];
  let turn = 0, stopRun = null;
  const stepper = (label, value, min, max, onChange) => {
    let v = value;
    const out = el('b', { class: 'lpy-angka' }, v);
    const set = (d) => { v = Math.max(min, Math.min(max, v + d)); out.textContent = v; onChange(v); ctx.sound.tap(); };
    return el('div', { class: 'row' }, el('span', { class: 'label' }, label), button('−5', () => set(-5), 'small'), button('−1', () => set(-1), 'small'), out, button('+1', () => set(1), 'small'), button('+5', () => set(5), 'small'));
  };
  function start() {
    stopRun?.();
    const a = turn % 2, b = 1 - a;
    const press = [8, 30];
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1} (penyeberang): pilih dua waktu menekan tombol. Tim ${b + 1} tidak boleh mengubahnya.`);
    const code = progNode(SCHOOL);
    const ready = button('Waktu siap ✓', () => {
      const presses = [...new Set(press)].sort((x, y) => x - y);
      let guess = 20;
      head.textContent = `Tim ${b + 1} (pengendara): tombol ditekan pada detik ke-${presses.join(' dan ')}. Kapan lampu kendaraan pertama kali merah?`;
      const sc = scene();
      const tl = timeline(50);
      sc.set(0, { kend: 'merah', peny: 'merah' }, false);
      const run = button('▶ Uji bersama', () => {
        run.remove(); guessRow.classList.add('kunci');
        const r = simulate(SCHOOL, presses, 50, { kend: 'merah', peny: 'merah' });
        const red = r.sample.findIndex((s, k) => k > 0 && s.kend === 'merah' && r.sample[k - 1].kend !== 'merah');
        stopRun = playRun(code, sc, tl, r, {
          speed: 70,
          done: () => {
            const right = guess === red;
            score[right ? b : a]++;
            if (right) ctx.sound.win(); else ctx.sound.bad();
            const ignored = r.presses.filter((x) => !x.read).map((x) => x.t);
            info.textContent = `Lampu kendaraan merah pada detik ke-${red}. ${right ? `✅ Tim ${b + 1} tepat.` : `✗ Tebakan Tim ${b + 1}: ${guess}. Poin untuk Tim ${a + 1}.`}${ignored.length ? ` Tekanan pada detik ke-${ignored.join(', ')} tidak terbaca.` : ''} Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      const guessRow = stepper('Tebakan detik ke-', guess, 0, 50, (v) => { guess = v; });
      const info = el('p', { class: 'lpy-info' });
      wrap.replaceChildren(head, el('div', { class: 'lpy-atas' }, code, el('div', { class: 'lpy-kanan' }, sc.node, guessRow, run)), tl.node, info);
    }, 'primary');
    wrap.replaceChildren(head, el('div', { class: 'lpy-atas' }, code, el('div', { class: 'lpy-kanan' },
      stepper('Tekan pertama, detik ke-', press[0], 0, 40, (v) => { press[0] = v; }),
      stepper('Tekan kedua, detik ke-', press[1], 0, 40, (v) => { press[1] = v; }), ready)));
  }
  start();
  return { destroy() { stopRun?.(); } };
}
