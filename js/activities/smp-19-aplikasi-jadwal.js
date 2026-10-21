// Uji Aplikasi Jadwal Pelajaran — SMP (13–15 tahun), interaksi manusia–
// komputer. Prototype A of the made-up JadwalKu app breaks six usability
// principles in seven places; prototype B fixes them. Pupils mark problems,
// read test data, run timed tasks on both prototypes, and see the colour-only
// day markers through a red–green colour-blindness filter.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const PRINCIPLES = ['Terlihat jelas', 'Bahasa pengguna', 'Konsisten', 'Mencegah kesalahan', 'Mudah kembali', 'Ramah untuk semua'];
// The seven problems of design A: [id, description, main principle, also accepted].
export const PROBLEMS = [
  ['judul', 'Judul "JDWL v2.0" tidak menjelaskan isi aplikasi', 2, []],
  ['warna', 'Hari hanya dibedakan dengan warna, tanpa nama hari', 6, [1]],
  ['teks', 'Nama pelajaran kecil dan abu-abu muda di atas putih', 1, [6]],
  ['hapus', '"Hapus Semua" di samping "Simpan", sama besar dan sewarna, tanpa konfirmasi', 4, []],
  ['kembali', 'Layar Ubah Jadwal tidak punya tombol kembali atau batal', 5, []],
  ['istilah', 'Pesan "Error 0x8F" dan istilah "Sinkronisasi Kalender Eksternal"', 2, []],
  ['rumah', 'Ikon rumah berarti Beranda di Layar 1, tetapi Pengaturan di Layar 2', 3, []],
];
export const accepts = (id, p) => { const pr = PROBLEMS.find((x) => x[0] === id); return !!pr && (pr[2] === p || pr[3].includes(p)); };
export const DATA = [[25, 1, 12, 0], [40, 2, 15, 1], [32, 1, 10, 0], [43, 2, 13, 0]];
export const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const DOTS = ['#e53935', '#43a047', '#8d6e63', '#fb8c00', '#4fc3f7'];
export const SUBJECTS = ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'Bahasa Inggris', 'PJOK', 'Informatika', 'Seni Budaya', 'Pendidikan Pancasila', 'Agama'];
export const SCHEDULE = [
  ['Upacara', 'Matematika', 'Matematika', 'IPA', 'IPA', 'Bahasa Indonesia', 'Bahasa Indonesia', 'IPS', 'Agama', 'Agama'],
  ['Bahasa Inggris', 'Bahasa Inggris', 'Informatika', 'Informatika', 'IPS', 'IPS', 'Matematika', 'Seni Budaya', 'Seni Budaya', 'PJOK'],
  ['IPA', 'IPA', 'Pendidikan Pancasila', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'Matematika', 'Bahasa Inggris', 'Agama', 'IPS'],
  ['PJOK', 'PJOK', 'Informatika', 'Bahasa Indonesia', 'Bahasa Indonesia', 'IPA', 'IPA', 'Seni Budaya', 'Matematika', 'Bahasa Inggris'],
  ['Senam', 'Agama', 'Agama', 'Matematika', 'IPS', 'Pendidikan Pancasila', 'Bahasa Inggris', 'Pramuka', 'Pramuka', 'Pramuka'],
];
export const DESIGN_A = { title: false, dayNames: false, bigText: false, safeDelete: false, backBtn: false, plainError: false, homeConsistent: false };
export const DESIGN_B = { title: true, dayNames: true, bigText: true, safeDelete: true, backBtn: true, plainError: true, homeConsistent: true };
export const TASKS = {
  T1: 'Cari pelajaran jam ke-3 hari Kamis.',
  T2: 'Ganti jam ke-2 hari Senin menjadi PJOK, lalu simpan.',
  T3: 'Kembali ke Beranda tanpa menyimpan perubahan.',
};
const copy = (s) => s.map((d) => [...d]);
const dec = (x) => x.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Red–green colour blindness (deuteranopia), approximate matrix.
const FILTER_SVG = '<svg width="0" height="0" style="position:absolute"><filter id="aj-deutan"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter></svg>';

// Interactive phone. task: 'T1'|'T2'|'T3'|null; onMistake(reason), onDone().
// mark(id) is called instead when the phone is used for spotting problems.
function phone(d, { task = null, onMistake = () => {}, onDone = () => {}, mark = null, still = false, filter = false, screen: start = 'home' } = {}) {
  const st = { screen: task === 'T3' ? 'edit' : start, day: 0, saved: copy(SCHEDULE), draft: copy(SCHEDULE), pick: null, msg: mark ? 'Error 0x8F' : null, confirm: false, menu: !!mark, done: false };
  if (task === 'T3') st.draft[0][0] = 'Seni Budaya';
  const box = el('div', { class: `aj-hp ${d.bigText ? 'besar' : 'kecil'} ${filter ? 'butawarna' : ''}` });
  const hot = (id, node) => (mark ? onTap(node, (e) => { e?.stopPropagation?.(); mark(id); }) : node);
  const go = (fn) => () => { if (mark || still || st.done) return; fn(); check(); draw(); };
  const wrong = (why) => { onMistake(why); };
  function check() {
    if (!task || st.done) return;
    const same = (a, b) => a.every((row, i) => row.every((v, j) => v === b[i][j]));
    let ok = false;
    if (task === 'T1') ok = st.screen === 'edit' && st.day === 3;
    if (task === 'T2') { const want = copy(SCHEDULE); want[0][1] = 'PJOK'; ok = same(st.saved, want); }
    if (task === 'T3') ok = st.screen === 'home' && same(st.saved, SCHEDULE);
    if (ok) { st.done = true; onDone(); }
  }
  function save() { st.saved = copy(st.draft); }
  function home() {
    const rows = DAYS.map((name, i) => hot('warna', onTap(el('div', { class: 'aj-hari', 'data-d': i }, el('span', { class: 'aj-titik', style: `background:${DOTS[i]}` }), d.dayNames ? el('b', null, name) : null,
      hot('teks', el('span', { class: 'aj-pel' }, st.saved[i].slice(0, 4).join(' · ') || '(kosong)'))), go(() => { st.screen = 'edit'; st.day = i; if (task === 'T1' && i !== 3) wrong('hari yang salah'); if (task === 'T2' && i !== 0) wrong('hari yang salah'); }))));
    const del = button('Hapus Semua', go(() => { if (d.safeDelete) { st.confirm = true; } else { st.saved = DAYS.map(() => []); st.draft = DAYS.map(() => []); wrong('jadwal terhapus'); } }), d.safeDelete ? 'aj-bahaya' : 'aj-biru');
    return [
      el('div', { class: 'aj-atas' }, hot('judul', el('b', { class: 'aj-judul' }, d.title ? 'Jadwal Pelajaran 8B' : 'JDWL v2.0')), hot('rumah', onTap(el('span', { class: 'aj-ikon', 'aria-label': 'Beranda' }, '🏠'), go(() => {})))),
      onTap(el('span', { class: 'aj-menu' }, '☰'), go(() => { st.menu = !st.menu; })),
      st.menu ? hot('istilah', el('div', { class: 'aj-menu-isi' }, ...[d.title ? 'Sambungkan ke kalender ponsel' : 'Sinkronisasi Kalender Eksternal', d.safeDelete ? del : null].filter(Boolean))) : null,
      ...rows,
      el('div', { class: 'aj-tombol' }, button('Simpan', go(() => { save(); }), 'aj-biru'), d.safeDelete ? null : hot('hapus', del)),
      st.confirm ? el('div', { class: 'aj-dialog' }, 'Yakin hapus semua jadwal?', el('div', null, button('Ya, hapus', go(() => { st.saved = DAYS.map(() => []); st.draft = DAYS.map(() => []); st.confirm = false; wrong('jadwal terhapus'); }), 'aj-bahaya'), button('Batal', go(() => { st.confirm = false; }), 'aj-biru'))) : null,
    ];
  }
  function edit() {
    const i = st.day;
    return [
      hot('kembali', el('div', { class: 'aj-atas' }, ...[d.backBtn ? onTap(el('span', { class: 'aj-ikon' }, '‹ Kembali'), go(() => { st.draft = copy(st.saved); st.screen = 'home'; })) : null,
        el('b', { class: 'aj-judul' }, d.dayNames ? `Ubah Jadwal ${DAYS[i]}` : 'Ubah Jadwal'), hot('rumah', onTap(el('span', { class: 'aj-ikon' }, '🏠'), go(() => { if (d.homeConsistent) { st.draft = copy(st.saved); st.screen = 'home'; } else { st.screen = 'settings'; wrong('ikon rumah membuka Pengaturan'); } })))].filter(Boolean))),
      el('div', { class: 'aj-jam-daftar' }, ...st.draft[i].map((s, j) => onTap(el('div', { class: `aj-jam ${st.pick === j ? 'pilih' : ''}`, 'data-j': j }, el('small', null, `Jam ${j + 1}`), hot('teks', el('span', { class: 'aj-pel' }, s))), go(() => { st.pick = st.pick === j ? null : j; })))),
      st.pick !== null ? el('div', { class: 'aj-pilihan' }, SUBJECTS.map((s) => onTap(el('span', { class: 'aj-subj', 'data-s': s }, s), go(() => { st.draft[i][st.pick] = s; if (task === 'T2' && !(i === 0 && st.pick === 1 && s === 'PJOK')) wrong('isian yang salah'); st.pick = null; })))) : null,
      onTap(el('span', { class: 'aj-tambah' }, '+ jam ke-11'), go(() => { st.msg = d.plainError ? 'Jam pelajaran hanya sampai jam ke-10.' : 'Error 0x8F'; wrong('pesan galat'); })),
      st.msg ? hot('istilah', el('div', { class: 'aj-pesan' }, st.msg)) : null,
      d.backBtn ? el('div', { class: 'aj-tombol' }, button('Batal', go(() => { st.draft = copy(st.saved); st.screen = 'home'; }), 'aj-abu'), button('Simpan', go(() => { save(); st.screen = 'home'; }), 'aj-biru')) : null,
    ];
  }
  function settings() {
    return [el('div', { class: 'aj-atas' }, el('b', { class: 'aj-judul' }, 'Pengaturan'), onTap(el('span', { class: 'aj-ikon' }, '🏠'), go(() => { st.screen = 'home'; }))),
      el('p', { class: 'aj-pel' }, 'Ukuran huruf · Notifikasi · Tentang'), el('p', { class: 'aj-pel' }, 'Ketuk 🏠 untuk ke Beranda.')];
  }
  function draw() {
    if (st.screen !== 'edit') st.msg = null;
    box.replaceChildren(...(st.screen === 'home' ? home() : st.screen === 'edit' ? edit() : settings()).filter(Boolean));
  }
  draw();
  return { el: box, setScreen(s) { st.screen = s; draw(); } };
}

// Spot the seven problems on design A: tap a part, then pick a principle.
function spotRound(wrap, ctx, { done }) {
  const found = new Set();
  let cur = null;
  let finished = false;
  const side = el('div', { class: 'aj-kanan' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk bagian layar yang bermasalah, lalu pilih prinsip yang dilanggar.');
  const mark = (id) => { if (finished) return; cur = id; drawSide(); };
  const p1 = phone(DESIGN_A, { mark });
  const p2 = phone(DESIGN_A, { mark, screen: 'edit' });
  function drawSide() {
    side.replaceChildren(el('p', { class: 'aj-hitung' }, `Ditemukan ${found.size} dari ${PROBLEMS.length}`),
      ...(cur ? [el('p', { class: 'small-note' }, found.has(cur) ? 'Bagian ini sudah ditandai.' : 'Prinsip mana yang dilanggar?'), el('div', { class: 'aj-prinsip' }, PRINCIPLES.map((p, i) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-p': i + 1 }, `${i + 1}. ${p}`), () => principle(i + 1))))] : []),
      el('ol', { class: 'aj-temuan' }, ...PROBLEMS.filter(([id]) => found.has(id)).map(([, t, p]) => el('li', null, `${t} (prinsip ${p})`))));
  }
  function principle(p) {
    if (finished || !cur || found.has(cur)) return;
    if (!accepts(cur, p)) { msg.className = 'reveal bad'; msg.textContent = `Bagian ini memang bermasalah, tetapi bukan terutama soal "${PRINCIPLES[p - 1]}".`; ctx.mistake(); return; }
    found.add(cur);
    ctx.sound.good();
    msg.className = 'reveal info';
    msg.textContent = PROBLEMS.find((x) => x[0] === cur)[1];
    cur = null;
    if (found.size === PROBLEMS.length) { finished = true; msg.className = 'reveal'; msg.textContent = 'Ketujuh masalah ditemukan.'; done(); }
    drawSide();
  }
  drawSide();
  wrap.append(el('p', { class: 'prompt' }, 'Desain A: temukan tujuh masalah kegunaan.'), el('div', { class: 'aj-samping' }, el('div', { class: 'aj-dua' }, el('div', null, el('small', null, 'Layar 1, Beranda'), p1.el), el('div', null, el('small', null, 'Layar 2, Ubah Jadwal'), p2.el)), side), msg);
}

// Run one task on a prototype with a stopwatch and a mistake counter.
function taskRun(box, ctx, { design, label, task, onFinish }) {
  let mistakes = 0;
  const t0 = performance.now();
  const status = el('p', { class: 'aj-hitung' });
  const tick = () => { if (!box.isConnected || stopped) return; status.textContent = `${label} · ${dec(((performance.now() - t0) / 1000))} detik · kesalahan ${mistakes}`; requestAnimationFrame(tick); };
  let stopped = false;
  const p = phone(design, { task, onMistake: (why) => { mistakes++; ctx.sound.bad(); note.textContent = `Kesalahan: ${why}.`; }, onDone: () => { stopped = true; const sec = (performance.now() - t0) / 1000; status.textContent = `${label} selesai: ${dec(sec)} detik, ${mistakes} kesalahan`; ctx.sound.good(); onFinish({ sec, mistakes }); } });
  const note = el('p', { class: 'small-note' }, TASKS[task]);
  box.replaceChildren(status, p.el, note);
  tick();
}

export default {
  id: 'smp-19-aplikasi-jadwal',
  title: 'Uji Aplikasi Jadwal Pelajaran',
  topic: 'Interaksi manusia–komputer: prinsip kegunaan dan uji pengguna',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '📱',
  source: null,
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid menemukan masalah kegunaan beserta prinsip yang dilanggar, menentukan prioritas perbaikan, membaca data uji pengguna, dan menjalankan uji tugas pada dua desain.',
  extraModes: [
    { id: 'prototipe', icon: '⏱️', label: 'Dua Prototipe', desc: 'Kerjakan tugas T1–T3 pada desain A dan B; waktu dan kesalahan dicatat selama sesi saja', create: createPrototypes },
    { id: 'butawarna', icon: '👓', label: 'Simulasi Buta Warna', desc: 'Lihat desain A dan B seperti orang dengan buta warna merah-hijau', create: createColour },
    { id: 'susun', icon: '🧩', label: 'Susun Layar', desc: 'Tim A memilih komponen layar, tim B mengerjakan tugas dengan layar itu', create: createBuild },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act jadwal' });
    root.append(wrap);
    if (!document.getElementById('aj-deutan')) document.body.insertAdjacentHTML('beforeend', FILTER_SVG);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) spotRound(wrap, ctx, { done: next });
      else if (r === 1) ask('Tim hanya sempat memperbaiki tiga masalah minggu ini. Mana yang didahulukan?', [['"Hapus Semua" tanpa konfirmasi, tidak ada tombol kembali, dan hari yang hanya ditandai warna (tingkat 3)', true], ['Judul, istilah teknis, dan ikon rumah'], ['Judul, warna tombol, dan ukuran huruf'], ['Yang paling mudah diperbaiki saja']]);
      else if (r === 2) fixRound(wrap, ctx, { done: next });
      else if (r === 3) ask('Data uji: waktu A 25, 40, 32, 43 detik; waktu B 12, 15, 10, 13 detik. Rata-ratanya?', [['A 35 detik, B 12,5 detik', true], ['A 140 detik, B 50 detik'], ['A 32 detik, B 12 detik'], ['A 43 detik, B 10 detik']], 2, dataTable(),
        () => ask('Desain B kira-kira berapa kali lebih cepat, dan berapa jumlah kesalahan A dan B?', [['2,8 kali; A 6 kesalahan, B 1 kesalahan', true], ['22,5 kali; A 6, B 1'], ['2,8 kali; A 1,5, B 0,25'], ['3,5 kali; A 4, B 0']], 2, dataTable()));
      else if (r === 4) ask('Keempat penguji mencoba desain A lebih dulu. Mengapa hasilnya mungkin terlalu menguntungkan B?', [['Saat mencoba B mereka sudah belajar tugasnya; separuh penguji sebaiknya mencoba B lebih dulu', true], ['Karena desain B berwarna lebih cerah'], ['Karena empat penguji sudah cukup banyak'], ['Tidak ada masalah; urutan tidak berpengaruh']]);
      else if (r === 5) tryRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Begini desain A terlihat oleh orang dengan buta warna merah-hijau. Baris mana yang hari Senin?', [['Sulit ditentukan: merah, hijau, cokelat, dan jingga tampak mirip; tulis nama hari', true], ['Baris pertama, karena merah tetap terlihat merah'], ['Baris biru muda'], ['Semua orang melihat warna yang sama']], 1, phone(DESIGN_A, { filter: true, still: true }).el);
      else ask('Guru dengan huruf diperbesar dan murid tunanetra dengan pembaca layar ingin memakai JadwalKu. Apa yang harus dipastikan?', [['Tata letak tetap rapi saat huruf besar, setiap ikon punya label teks, dan informasi tidak hanya lewat warna', true], ['Ikon dibuat lebih kecil supaya muat'], ['Warna diganti lebih banyak'], ['Cukup tambahkan suara klik']]);
    }
    render();
  },
};

const dataTable = () => el('table', { class: 'kls-tabel aj-data' }, el('thead', null, el('tr', null, ...['Penguji', 'Waktu A', 'Kesalahan A', 'Waktu B', 'Kesalahan B'].map((h) => el('th', null, h)))),
  el('tbody', null, ...DATA.map((r, i) => el('tr', null, el('td', null, `P${i + 1}`), ...r.map((v) => el('td', null, v))))));

const FIXES = [['Nama hari ditulis lengkap di samping warna', 6], ['Tombol "Kembali" dan "Batal" di layar Ubah Jadwal', 5], ['"Hapus Semua" dipindah ke menu, merah, dan meminta konfirmasi', 4], ['Pesan "Jam pelajaran hanya sampai jam ke-10"', 2], ['Ikon rumah selalu berarti Beranda', 3], ['Teks pelajaran lebih besar dan berwarna gelap', 1]];
function fixRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih prinsip yang diperbaiki oleh setiap perubahan.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'ab-lapisan' }, FIXES.map(([f], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, f),
      el('div', { class: 'seg' }, PRINCIPLES.map((p, j) => onTap(el('button', { class: `seg-btn ${pick[i] === j + 1 ? 'on' : ''}`, type: 'button', title: p, 'data-i': i, 'data-p': j + 1 }, j + 1), () => { if (!finished) { pick[i] = j + 1; draw(); } })))))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Desain B memperbaiki desain A. Prinsip mana yang diperbaiki?'), el('p', { class: 'small-note aj-legenda' }, PRINCIPLES.map((p, i) => `${i + 1} ${p}`).join(' · ')), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = FIXES.map(([, p], i) => (pick[i] !== p && !(i === 5 && pick[i] === 6) && !(i === 0 && pick[i] === 1) ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} perubahan belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = 'Benar semua.';
    done();
  }, 'primary')), msg);
}

// Do task T2 on design A, then on design B, and compare.
function tryRound(wrap, ctx, { done }) {
  const res = [];
  const box = el('div', { class: 'aj-uji' });
  const result = el('p', { class: 'reveal info' }, `Tugas: ${TASKS.T2} Mulai dengan desain A.`);
  const runOne = (design, label) => taskRun(box, ctx, { design, label, task: 'T2', onFinish: (r) => {
    res.push(r);
    if (res.length === 1) { box.append(el('div', { class: 'kode-baris' }, button('Lanjut ke desain B ➜', () => runOne(DESIGN_B, 'Desain B'), 'primary'))); return; }
    result.className = 'reveal';
    result.textContent = `Desain A: ${dec(res[0].sec)} detik, ${res[0].mistakes} kesalahan. Desain B: ${dec(res[1].sec)} detik, ${res[1].mistakes} kesalahan.`;
    done();
  } });
  wrap.append(el('p', { class: 'prompt' }, 'Uji sendiri: kerjakan tugas yang sama di dua desain.'), box, result);
  runOne(DESIGN_A, 'Desain A');
}

function createPrototypes(root, ctx) {
  const wrap = el('div', { class: 'act jadwal' });
  root.append(wrap);
  let design = 'A';
  let task = 'T2';
  const log = [];
  const box = el('div', { class: 'aj-uji' });
  function draw() {
    const rows = (dsg) => log.filter((l) => l.design === dsg);
    const avg = (dsg, k) => (rows(dsg).length ? mean(rows(dsg).map((l) => l[k])).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '–');
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, ['A', 'B'].map((x) => onTap(el('button', { class: `seg-btn ${design === x ? 'on' : ''}`, type: 'button' }, `Desain ${x}`), () => { design = x; draw(); }))),
      el('div', { class: 'seg' }, Object.keys(TASKS).map((t) => onTap(el('button', { class: `seg-btn ${task === t ? 'on' : ''}`, type: 'button' }, t), () => { task = t; draw(); }))), button('Mulai tugas', start, 'primary')),
      el('div', { class: 'aj-samping' }, box, el('div', { class: 'aj-kanan' }, el('p', { class: 'small-note' }, `${task}: ${TASKS[task]}`),
        el('table', { class: 'kls-tabel aj-data' }, el('thead', null, el('tr', null, ...['#', 'Desain', 'Tugas', 'Detik', 'Kesalahan'].map((h) => el('th', null, h)))),
          el('tbody', null, ...log.map((l, i) => el('tr', null, el('td', null, `P${i + 1}`), el('td', null, l.design), el('td', null, l.task), el('td', null, dec(l.sec)), el('td', null, l.mistakes))))),
        el('p', { class: 'aj-hitung' }, `Rata-rata A: ${avg('A', 'sec')} detik, ${avg('A', 'mistakes')} kesalahan · B: ${avg('B', 'sec')} detik, ${avg('B', 'mistakes')} kesalahan`),
        el('p', { class: 'small-note' }, 'Hasil hanya ada selama sesi ini dan tidak dikirim ke mana pun. Selang-seling urutan desain antarpenguji.'))));
  }
  function start() {
    draw();
    taskRun(box, ctx, { design: design === 'A' ? DESIGN_A : DESIGN_B, label: `Desain ${design}`, task, onFinish: (r) => { log.push({ design, task, ...r }); setTimeout(draw, 1200); } });
  }
  draw();
}

function createColour(root, ctx) {
  const wrap = el('div', { class: 'act jadwal' });
  root.append(wrap);
  if (!document.getElementById('aj-deutan')) document.body.insertAdjacentHTML('beforeend', FILTER_SVG);
  let on = true;
  function draw() {
    wrap.replaceChildren(el('div', { class: 'seg' }, [[false, 'Penglihatan biasa'], [true, 'Buta warna merah-hijau']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${on === v ? 'on' : ''}`, type: 'button' }, l), () => { on = v; draw(); }))),
      el('div', { class: 'aj-dua' }, el('div', null, el('small', null, 'Desain A'), phone(DESIGN_A, { filter: on, still: true }).el), el('div', null, el('small', null, 'Desain B'), phone(DESIGN_B, { filter: on, still: true }).el)),
      el('p', { class: 'reveal info' }, on ? 'Merah, hijau, cokelat, dan jingga tampak mirip. Desain B tetap bisa dibaca karena ada nama hari.' : 'Bandingkan dengan tampilan buta warna merah-hijau.'));
  }
  draw();
}

const PARTS = [['title', 'Judul', 'JDWL v2.0', 'Jadwal Pelajaran 8B'], ['dayNames', 'Penanda hari', 'warna saja', 'nama + warna'], ['bigText', 'Teks pelajaran', 'kecil abu-abu', 'besar gelap'], ['safeDelete', 'Hapus Semua', 'di samping Simpan', 'di menu + konfirmasi'], ['backBtn', 'Tombol kembali', 'tidak ada', 'ada'], ['plainError', 'Pesan galat', 'Error 0x8F', 'kalimat jelas'], ['homeConsistent', 'Ikon rumah', 'berubah arti', 'selalu Beranda']];
function createBuild(root, ctx) {
  const wrap = el('div', { class: 'act jadwal' });
  root.append(wrap);
  const d = { ...DESIGN_A };
  const results = [];
  function build() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim A: susun layar dari komponen.'), el('div', { class: 'aj-samping' }, el('div', { class: 'ab-lapisan' }, PARTS.map(([k, l, a, b]) => el('div', { class: 'ab-lap-baris' }, el('span', null, l),
      el('div', { class: 'seg' }, [[false, a], [true, b]].map(([v, t]) => onTap(el('button', { class: `seg-btn ${d[k] === v ? 'on' : ''}`, type: 'button' }, t), () => { d[k] = v; build(); })))))), phone(d, { still: true }).el),
      el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, Object.keys(TASKS).map((t) => button(`Tim B: ${t}`, () => test(t), 'primary')))),
      results.length ? el('div', { class: 'small-note' }, ...results.map((r) => el('div', null, `${r.task}: ${dec(r.sec)} detik, ${r.mistakes} kesalahan (${Object.values(r.d).filter(Boolean).length}/7 komponen baik)`))) : el('span'));
  }
  function test(task) {
    const box = el('div', { class: 'aj-uji' });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim B: ${TASKS[task]}`), box);
    taskRun(box, ctx, { design: { ...d }, label: 'Layar tim A', task, onFinish: (r) => { results.push({ task, d: { ...d }, ...r }); box.append(el('div', { class: 'kode-baris' }, button('Kembali ke susun layar', build, 'primary'))); } });
  }
  build();
}
