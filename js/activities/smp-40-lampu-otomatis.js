// Lampu Kelas Otomatis — SMP (13–15 tahun), coding. A main loop that reads a
// motion sensor and a light sensor once per simulated minute: input, process
// and output, the idle counter diam, the flicker caused by the lamp shining on
// its own sensor, a state-based fix, Bima's manual switch draft, and mode.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, stepper, codeView } from './smp-kit.js';

const HEAD = ['lampu ← MATI', 'diam ← 10', 'SELAMA BENAR', '    gerak ← BACA_GERAK()', '    cahaya ← BACA_CAHAYA()', '    JIKA gerak = ADA MAKA', '        diam ← 0', '    SELAIN ITU', '        diam ← diam + 1'];
const V2TAIL = (batas) => ['    JIKA lampu = MATI MAKA', '        JIKA cahaya < 40 DAN diam < 10 MAKA', '            lampu ← NYALA', '    SELAIN ITU', batas ? `        JIKA diam ≥ 10 ATAU cahaya ≥ ${batas} MAKA` : '        JIKA diam ≥ 10 MAKA', '            lampu ← MATI', '    TUNGGU 1 MENIT'];
const BIMA = ['    tombol ← BACA_TOMBOL()        // DITEKAN atau TIDAK', '    JIKA tombol = DITEKAN MAKA', '        JIKA lampu = NYALA MAKA', '            lampu ← MATI', '        SELAIN ITU', '            lampu ← NYALA'];
const v3 = (blank = false, tanpa20 = false) => ['lampu ← MATI', 'diam ← 10', 'mode ← OTOMATIS', 'SELAMA BENAR', '    gerak ← BACA_GERAK()', '    cahaya ← BACA_CAHAYA()', '    tombol ← BACA_TOMBOL()', '    JIKA gerak = ADA MAKA', '        diam ← 0', '    SELAIN ITU', '        diam ← diam + 1',
  '    JIKA tombol = DITEKAN MAKA', `        mode ← ${blank ? '..........' : 'MANUAL'}`, '        JIKA lampu = NYALA MAKA', '            lampu ← MATI', '        SELAIN ITU', '            lampu ← NYALA', '    SELAIN ITU JIKA diam ≥ 10 MAKA', '        lampu ← MATI',
  ...(tanpa20 ? [] : [`        mode ← ${blank ? '..........' : 'OTOMATIS'}`]), `    SELAIN ITU JIKA lampu = MATI DAN mode = ${blank ? '..........' : 'OTOMATIS'} DAN cahaya < 40 MAKA`, '        lampu ← NYALA', '    TUNGGU 1 MENIT'];
export const CODE = {
  v1: [...HEAD, '    JIKA cahaya < 40 DAN diam < 10 MAKA', '        lampu ← NYALA', '    SELAIN ITU', '        lampu ← MATI', '    TUNGGU 1 MENIT'],
  v2: [...HEAD, ...V2TAIL()],
  bima: [...HEAD, ...BIMA, ...V2TAIL()],
  v3: v3(),
};
export const codeOf = (ver, { batas = null, tanpa20 = false } = {}) => (ver === 'v2' && batas ? [...HEAD, ...V2TAIL(batas)] : ver === 'v3' && tanpa20 ? v3(false, true) : CODE[ver]);
export const start = (ver, o = {}) => ({ lampu: 'MATI', diam: 10, mode: 'OTOMATIS', ...o });

// One pass of the main loop = one minute. The sensor reads the outside light,
// plus 50 when the lamp was NYALA at the end of the previous minute (pantul).
export function langkah(ver, s, ev, { pantul = true, batas = null, tanpa20 = false } = {}) {
  const bacaan = Math.min(100, ev.luar + (pantul && s.lampu === 'NYALA' ? 50 : 0));
  let { lampu, diam, mode } = s; const ex = [];
  const motion = (o) => { ex.push(o, o + 1, o + 2); if (ev.gerak) { diam = 0; ex.push(o + 3); } else { diam += 1; ex.push(o + 4, o + 5); } };
  const v2 = (o) => {
    ex.push(o);
    if (lampu === 'MATI') { ex.push(o + 1); if (bacaan < 40 && diam < 10) { lampu = 'NYALA'; ex.push(o + 2); } }
    else { ex.push(o + 3, o + 4); if (diam >= 10 || (batas && bacaan >= batas)) { lampu = 'MATI'; ex.push(o + 5); } }
    ex.push(o + 6);
  };
  if (ver === 'v1') { motion(3); ex.push(9); if (bacaan < 40 && diam < 10) { lampu = 'NYALA'; ex.push(10); } else { lampu = 'MATI'; ex.push(11, 12); } ex.push(13); }
  else if (ver === 'v2') { motion(3); v2(9); }
  else if (ver === 'bima') { motion(3); ex.push(9, 10); if (ev.tombol) { ex.push(11); if (lampu === 'NYALA') { lampu = 'MATI'; ex.push(12); } else { lampu = 'NYALA'; ex.push(13, 14); } } v2(15); }
  else {
    const d = tanpa20 ? 1 : 0;
    ex.push(4, 5, 6, 7); if (ev.gerak) { diam = 0; ex.push(8); } else { diam += 1; ex.push(9, 10); }
    ex.push(11);
    if (ev.tombol) { mode = 'MANUAL'; ex.push(12, 13); if (lampu === 'NYALA') { lampu = 'MATI'; ex.push(14); } else { lampu = 'NYALA'; ex.push(15, 16); } }
    else { ex.push(17); if (diam >= 10) { lampu = 'MATI'; ex.push(18); if (!tanpa20) { mode = 'OTOMATIS'; ex.push(19); } } else { ex.push(20 - d); if (lampu === 'MATI' && mode === 'OTOMATIS' && bacaan < 40) { lampu = 'NYALA'; ex.push(21 - d); } } }
    ex.push(22 - d);
  }
  return { lampu, diam, mode, bacaan, ex, dari: s.lampu };
}
export function jalankan(ver, s0, evs, o = {}) { let s = s0; return evs.map((ev) => { const r = langkah(ver, s, ev, o); s = r; return r; }); }

// The worksheet's timelines.
const ev = (gerak, luar, tombol = false) => ({ gerak, luar, tombol });
export const MEJA = [[0, 30], [1, 40], [1, 39], [0, 35], [1, 30], [0, 25], [0, 25], [0, 80], [0, 25], [0, 25], [0, 25], [0, 25], [0, 25], [0, 25], [0, 25], [1, 25]].map(([g, l]) => ev(!!g, l));
export const SENJA = [50, 40, 35, 35, 30, 30, 25, 25].map((l) => ev(true, l));
export const MALAM = [0, 1, 0, 0].map((t) => ev(true, 20, !!t));
export const FILM = [[1, 0], [1, 1], [1, 0], [0, 0], [1, 1], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0]].map(([g, t]) => ev(!!g, 20, !!t));
export const PAGI = [20, 30, 38, 42, 50].map((l) => ev(true, l));
export const runs = {
  meja: () => jalankan('v1', start('v1'), MEJA, { pantul: false }),
  senja: (ver) => jalankan(ver, start(ver, { diam: 0 }), SENJA),
  bima: () => jalankan('bima', start('bima', { lampu: 'NYALA', diam: 0 }), MALAM),
  film: (o) => jalankan('v3', start('v3', { lampu: 'NYALA', diam: 0 }), FILM, o),
  pagi: (batas) => jalankan('v2', start('v2', { lampu: 'NYALA', diam: 0 }), PAGI, { batas }),
};

// Classroom picture: sky through the window, four lamps, sensors, people.
const sky = (luar) => { const t = Math.max(0, Math.min(100, luar)) / 100; const mix = (a, b) => Math.round(a + (b - a) * t); return `rgb(${mix(30, 140)}, ${mix(27, 200)}, ${mix(75, 250)})`; };
function kelas(s, { luar = 30, gerak = true, pantul = true, tombol = false } = {}) {
  const on = s.lampu === 'NYALA';
  return el('div', { class: `lo-kelas ${on ? 'nyala' : ''}`, style: { '--terang': String(Math.min(1, (luar + (on ? 60 : 0)) / 100)) }, role: 'img', 'aria-label': `Kelas, lampu ${s.lampu}` },
    el('div', { class: 'lo-langit-langit' }, [0, 1, 2, 3].map((k) => el('i', { class: `lo-lampu ${on ? 'on' : ''}` }, k === 1 && pantul && on ? el('span', { class: 'lo-sorot' }) : null)), el('i', { class: 'lo-sensor gerak', title: 'sensor gerak' }), el('i', { class: `lo-sensor cahaya ${pantul ? 'dekat' : ''}`, title: 'sensor cahaya' })),
    el('div', { class: 'lo-dinding' }, el('div', { class: 'lo-jendela', style: { background: sky(luar) } }, luar < 40 ? '🌙' : '☀️'), el('div', { class: 'lo-orang' }, gerak ? '👦 👧 🙋' : ''), el('div', { class: `lo-pintu ${tombol ? 'tekan' : ''}` }, el('small', null, 'Lampu Otomatis'), el('b', null, '⏻'))));
}
function diagram(s, last, ver = 'v2') {
  const up = ver === 'v2' ? 'cahaya < 40 DAN diam < 10 ⟶' : 'tombol, atau gelap DAN ada orang (OTOMATIS) ⟶'; const down = ver === 'v2' ? '⟵ diam ≥ 10' : '⟵ tombol, atau diam ≥ 10';
  const moved = last && last.dari !== last.lampu;
  return el('div', { class: 'lo-diagram', role: 'img', 'aria-label': `Diagram keadaan, sekarang ${s.lampu}` },
    el('span', { class: `lo-keadaan ${s.lampu === 'MATI' ? 'aktif' : ''}` }, 'MATI'),
    el('div', { class: 'lo-panah' }, el('small', { class: moved && last.lampu === 'NYALA' ? 'kedip' : '' }, up), el('small', { class: moved && last.lampu === 'MATI' ? 'kedip' : '' }, down)),
    el('span', { class: `lo-keadaan ${s.lampu === 'NYALA' ? 'aktif' : ''}` }, 'NYALA'));
}
const statBar = (s, last, ver) => el('div', { class: 'lo-stat' }, el('span', null, el('small', null, 'bacaan'), el('b', null, last ? String(last.bacaan) : '–')), el('span', null, el('small', null, 'diam'), el('b', null, String(s.diam))),
  ver === 'v3' ? el('span', null, el('small', null, 'mode'), el('b', null, s.mode)) : null, el('span', { class: s.lampu === 'NYALA' ? 'nyala' : '' }, el('small', null, 'lampu'), el('b', null, s.lampu)));
const pair = (...xs) => xs.join(' · ');
const opts4 = (right, ...wrong) => [...new Set([right, ...wrong])].slice(0, 4);

export default {
  id: 'smp-40-lampu-otomatis',
  title: 'Lampu Kelas Otomatis',
  topic: 'Perulangan utama pada perangkat: sensor gerak dan cahaya, masukan–proses–keluaran, pencacah waktu, umpan balik sensor, keadaan, dan mode manual',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '💡',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri perulangan utama lampu kelas menit demi menit, temukan mengapa lampu berkedip, perbaiki dengan keadaan, lalu tambahkan sakelar manual tanpa merusak aturan otomatis.',
  extraModes: [
    { id: 'kelas', icon: '🏫', label: 'Simulasi Kelas', desc: 'Geser langit dari terang ke gelap, beri gerakan, tekan sakelar, dan majukan jam menit demi menit untuk Versi 1, 2, 3 atau draf Bima. Baris program yang dijalankan menyala', create: createSim },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Lampu', desc: 'Satu tim menyusun kejadian menit berikutnya, tim lain menebak keadaan lampu dan nilai diam sebelum program berjalan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lampu-otomatis' });
    root.append(wrap);
    const meja = runs.meja(); const s1 = runs.senja('v1'); const s2 = runs.senja('v2'); const bm = runs.bima(); const fm = runs.film(); const fm20 = runs.film({ tanpa20: true });
    const p90 = runs.pagi(90); const p80 = runs.pagi(80);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const IPO = ['masukan', 'proses', 'keluaran'];
      const dl = (x) => pair(x.diam, x.lampu);
      const dlRow = (x, i, evs) => [`m${i}`, `Menit ${i + 1} · ${evs[i].gerak ? 'ADA' : 'TIDAK'} · ${evs[i].luar}`, opts4(dl(x), pair(x.diam, x.lampu === 'NYALA' ? 'MATI' : 'NYALA'), pair(x.diam === 0 ? 1 : 0, x.lampu), pair(x.diam + 1, x.lampu)).sort(), dl(x)];
      const blRow = (x, i, label) => [`m${i}`, label, opts4(pair(x.bacaan, x.lampu), pair(x.bacaan, x.lampu === 'NYALA' ? 'MATI' : 'NYALA'), pair(x.bacaan === SENJA[i]?.luar ? x.bacaan + 50 : x.bacaan - 50, x.lampu)).sort(), pair(x.bacaan, x.lampu)];
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Bagian-bagian alat: masukan, proses, atau keluaran?', rows: [['g', 'Sensor gerak (ADA atau TIDAK)', IPO, 'masukan'], ['c', 'Sensor cahaya (0 sampai 100)', IPO, 'masukan'], ['t', 'Tombol di dekat pintu', IPO, 'masukan'], ['m', 'Mikrokontroler (menjalankan program)', IPO, 'proses'], ['l', 'Lampu (NYALA atau MATI)', IPO, 'keluaran']], done: next });
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Komputer di laboratorium dan lampu yang lupa dimatikan', rows: [['k', 'Komputer: masukan · proses · keluaran', ['papan ketik · prosesor (CPU) · layar', 'layar · papan ketik · prosesor (CPU)', 'prosesor (CPU) · layar · tetikus'], 'papan ketik · prosesor (CPU) · layar'], ['j', 'Pukul 14.00 sampai 06.00', ['16 jam', '8 jam', '18 jam', '14 jam'], '16 jam'], ['e', 'Energi 4 lampu × 20 watt', ['1.280 watt-jam = 1,28 kWh', '320 watt-jam = 0,32 kWh', '1.280 watt-jam = 12,8 kWh', '80 watt-jam = 0,08 kWh'], '1.280 watt-jam = 1,28 kWh', '4 × 20 × 16 = 1.280.'], ['rp', '20 malam, Rp1.500 per kWh', ['Rp38.400', 'Rp1.920', 'Rp384.000', 'Rp25.600'], 'Rp38.400', '20 × 1,28 = 25,6 kWh; 25,6 × 1.500 = 38.400.']], done: next });
      else if (r === 2) { wrap.append(codeView(CODE.v1)); rowsChoose(wrap, ctx, { prompt: 'Versi 1 di meja percobaan: diam · lampu sesudah baris 13 (awal: diam 10, MATI)', cls: 'lo-tabel', rows: meja.slice(0, 8).map((x, i) => dlRow(x, i, MEJA)), done: next }); }
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Versi 1 di meja percobaan, menit 9 sampai 16 (menit 8: diam 3, MATI)', cls: 'lo-tabel', rows: [...meja.slice(8).map((x, k) => dlRow(x, k + 8, MEJA)), ['b', 'Lampu mati karena 10 menit tanpa gerakan di menit … ; gerakan terakhir di menit …', ['15 · 5', '16 · 5', '15 · 6', '14 · 4'], '15 · 5']], done: next });
      else if (r === 4) rowsChoose(wrap, ctx, { prompt: 'Senter, nilai awal, dan perulangan utama', rows: [['c', 'Menit 8 sensor disenter (bacaan 80)', ['menit 8 MATI karena terang, menit 9 NYALA lagi (bacaan 25, diam 4)', 'menit 8 dan 9 MATI', 'menit 8 tetap NYALA', 'lampu mati sampai ada gerakan lagi'], 'menit 8 MATI karena terang, menit 9 NYALA lagi (bacaan 25, diam 4)'], ['d', 'Bila diam awal 0, di menit 1', ['diam 1 dan bacaan 30 < 40, jadi lampu NYALA padahal tidak ada orang', 'lampu tetap MATI', 'program galat'], 'diam 1 dan bacaan 30 < 40, jadi lampu NYALA padahal tidak ada orang', 'Nilai awal 10 berarti "anggap kelas kosong saat alat baru dinyalakan".'], ['e', 'SELAMA BENAR berhenti', ['tidak pernah, selama alat mendapat listrik', 'sesudah 16 menit', 'saat lampu MATI', 'saat diam mencapai 10'], 'tidak pernah, selama alat mendapat listrik']], done: next });
      else if (r === 5) { wrap.append(el('p', { class: 'lo-ket' }, 'Kelas 8A: bacaan = cahaya dari luar + 50 bila lampu NYALA pada menit sebelumnya. Murid terus bergerak; sebelum menit 1 lampu MATI.'));
        rowsChoose(wrap, ctx, { prompt: 'Versi 1 di kelas 8A: bacaan · lampu', cls: 'lo-tabel', rows: s1.map((x, i) => blRow(x, i, `Menit ${i + 1} · luar ${SENJA[i].luar}`)), done: then(() => ask('Mengapa lampu berkedip, dan seperti apa di alat sungguhan yang mengulang ratusan kali per detik?', [['Cahaya lampu menaikkan bacaan sensor 50, jadi ruangan "terlihat" terang dan lampu dimatikan; begitu mati bacaan turun lagi dan lampu dinyalakan lagi (umpan balik). Di alat sungguhan lampu berkedip sangat cepat', true], ['Sensor gerak rusak sehingga diam terus bertambah'], ['Lampu berkedip karena TUNGGU 1 MENIT terlalu lama; di alat sungguhan tidak berkedip'], ['Cahaya dari luar naik turun setiap menit']], 1, kelas({ lampu: 'NYALA' }, { luar: 30 }))) }); }
      else if (r === 6) { wrap.append(codeView(CODE.v2, { hl: [9, 10, 11, 12, 13, 14, 15] }));
        rowsChoose(wrap, ctx, { prompt: 'Versi 2 di kelas 8A: bacaan · lampu', cls: 'lo-tabel', rows: s2.map((x, i) => blRow(x, i, `Menit ${i + 1} · luar ${SENJA[i].luar}`)), done: then(() => rowsChoose(wrap, ctx, { prompt: 'Diagram keadaan Versi 2', rows: [['p', 'Syarat panah NYALA → MATI', ['diam ≥ 10', 'cahaya ≥ 40', 'diam < 10', 'gerak = ADA'], 'diam ≥ 10'], ['b', 'Saat NYALA, bacaan sensor cahaya masih dipakai?', ['ya', 'tidak'], 'tidak', 'Cahaya lampu sendiri tidak bisa mematikan lampu. Versi 2 memakai keadaan lampu untuk memilih aturan.']], done: next })) }); }
      else if (r === 7) { wrap.append(codeView(CODE.bima, { hl: [9, 10, 11, 12, 13, 14] }));
        rowsChoose(wrap, ctx, { prompt: 'Draf Bima, malam (luar 20, murid bergerak, awal NYALA): bacaan · lampu', cls: 'lo-tabel', rows: bm.map((x, i) => blRow(x, i, `Menit ${i + 1} · tombol ${MALAM[i].tombol ? 'DITEKAN' : 'TIDAK'}`)), done: then(() => ask('Apa masalah draf Bima?', [['Lampu menyala lagi sendiri di menit 3: aturan otomatis melihat lampu MATI, gelap, dan ada gerakan, karena program tidak ingat bahwa lampu dimatikan oleh orang', true], ['Tombol tidak bisa mematikan lampu'], ['Lampu berkedip setiap menit seperti Versi 1'], ['Tidak ada masalah']])) }); }
      else if (r === 8) { wrap.append(codeView(v3(true), { hl: [12, 19, 20] }));
        rowsChoose(wrap, ctx, { prompt: 'Versi 3: isi titik-titik dengan OTOMATIS atau MANUAL', rows: [['13', 'Baris 13: mode ← …', ['MANUAL', 'OTOMATIS'], 'MANUAL'], ['20', 'Baris 20: mode ← …', ['MANUAL', 'OTOMATIS'], 'OTOMATIS'], ['21', 'Baris 21: … DAN mode = … DAN cahaya < 40', ['MANUAL', 'OTOMATIS'], 'OTOMATIS']], done: then(() => rowsChoose(wrap, ctx, { prompt: 'Telusuri Versi 3 (luar 20; awal diam 0, NYALA, OTOMATIS): bacaan · diam · lampu · mode', cls: 'lo-tabel', rows: fm.slice(0, 6).map((x, i) => { const right = pair(x.bacaan, x.diam, x.lampu, x.mode); const flip = x.lampu === 'NYALA' ? 'MATI' : 'NYALA'; return [`f${i}`, `Menit ${i + 1} · ${FILM[i].gerak ? 'ADA' : 'TIDAK'} · ${FILM[i].tombol ? 'DITEKAN' : 'TIDAK'}`, opts4(right, pair(x.bacaan, x.diam, flip, x.mode), pair(x.bacaan, x.diam, x.lampu, x.mode === 'MANUAL' ? 'OTOMATIS' : 'MANUAL'), pair(x.bacaan === 20 ? 70 : 20, x.diam, x.lampu, x.mode)).sort(), right]; }), done: next })) }); }
      else {
        const f = (x) => pair(x.diam, x.lampu, x.mode);
        rowsChoose(wrap, ctx, { prompt: 'Versi 3 sampai menit 16, baris 20, dan tantangan', rows: [['7', 'Menit 7–14 (kelas kosong): diam · lampu · mode', ['2 sampai 9 · NYALA · MANUAL', '2 sampai 9 · MATI · OTOMATIS', '2 sampai 9 · NYALA · OTOMATIS'], `2 sampai 9 · ${fm[13].lampu} · ${fm[13].mode}`], ['15', 'Menit 15', opts4(f(fm[14]), pair(10, 'NYALA', 'MANUAL'), pair(10, 'MATI', 'MANUAL')), f(fm[14]), 'Lampu mati sendiri dan mode kembali OTOMATIS.'], ['16', 'Menit 16 (penjaga sekolah masuk)', opts4(f(fm[15]), pair(0, 'MATI', 'OTOMATIS'), pair(0, 'NYALA', 'MANUAL')), f(fm[15])],
          ['d', 'Bila baris 20 dihapus, di menit 16', [`lampu tetap ${fm20[15].lampu} karena mode tetap ${fm20[15].mode} selamanya, esok pagi pun tidak menyala otomatis`, 'lampu tetap NYALA karena ada gerakan', 'tidak ada bedanya'], `lampu tetap ${fm20[15].lampu} karena mode tetap ${fm20[15].mode} selamanya, esok pagi pun tidak menyala otomatis`],
          ['90', `Tantangan: batas 90 → ${p90.map((x) => x.lampu).join(', ')}; batas 80 → ${p80.map((x) => x.lampu).join(', ')}. Batas mati paling kecil yang tidak membuat lampu berkedip`, ['90', '80', '50', '40'], '90', 'Sesudah menyala, bacaan paling banyak 39 + 50 = 89, jadi batas mati harus lebih dari 89. Jarak 40 sampai 90 disebut histeresis.']], done: next });
      }
    }
    render();
  },
};

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act lampu-otomatis' });
  root.append(wrap);
  let ver = 'v1'; let pantul = true; let luar = 60; let gerak = true; let tekan = false; let s = start('v1', { diam: 0 }); let last = null; let menit = 0; let log = []; let timer = null;
  const reset = () => { stop(); s = start(ver, { diam: 0 }); last = null; menit = 0; log = []; draw(); };
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  const tick = () => { last = langkah(ver, s, { gerak, luar, tombol: tekan && ver !== 'v1' && ver !== 'v2' }); s = last; menit++; tekan = false; log.unshift(`Menit ${menit}: ${gerak ? 'ADA' : 'TIDAK'}, bacaan ${last.bacaan}, diam ${s.diam}, ${s.lampu}${ver === 'v3' ? `, ${s.mode}` : ''}`); log = log.slice(0, 8); ctx.sound.tap(); draw(); };
  const seg = (items, cur, set) => el('div', { class: 'seg' }, items.map(([k, t]) => onTap(el('button', { class: `seg-btn ${cur === k ? 'on' : ''}`, type: 'button' }, t), () => set(k))));
  function draw() {
    const slider = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(luar), 'aria-label': 'cahaya dari luar' });
    slider.addEventListener('input', () => { luar = Number(slider.value); draw(); });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Simulasi kelas'),
      el('div', { class: 'lo-atur' }, seg([['v1', 'Versi 1'], ['v2', 'Versi 2'], ['bima', 'Draf Bima'], ['v3', 'Versi 3']], ver, (k) => { ver = k; reset(); }),
        onTap(el('button', { class: `seg-btn ${pantul ? 'on' : ''}`, type: 'button' }, `${pantul ? '☑' : '☐'} cahaya lampu mengenai sensor`), () => { pantul = !pantul; draw(); })),
      el('div', { class: 'lo-dua' },
        el('div', { class: 'lo-kiri' }, kelas(s, { luar, gerak, pantul, tombol: tekan }),
          el('div', { class: 'lo-atur' }, el('label', { class: 'lo-geser' }, el('small', null, `cahaya dari luar: ${luar}`), slider),
            onTap(el('button', { class: `seg-btn ${gerak ? 'on' : ''}`, type: 'button' }, `${gerak ? '☑' : '☐'} ada gerakan`), () => { gerak = !gerak; draw(); }),
            ver === 'bima' || ver === 'v3' ? onTap(el('button', { class: `seg-btn ${tekan ? 'on' : ''}`, type: 'button' }, tekan ? '⏻ tombol ditekan menit ini' : '⏻ tekan sakelar'), () => { tekan = !tekan; draw(); }) : null),
          el('div', { class: 'lo-atur' }, button('⏭ Maju 1 menit', tick, 'primary'), button(timer ? '⏸ Berhenti' : '▶ Jalan sendiri', () => { if (timer) stop(); else timer = setInterval(tick, 900); draw(); }), button('↺ Ulang', reset)),
          statBar(s, last, ver), ver === 'v1' ? null : diagram(s, last, ver)),
        el('div', { class: 'lo-kanan' }, codeView(CODE[ver], { hl: last ? last.ex : [] }), el('div', { class: 'lo-log' }, log.length ? log.map((t) => el('div', null, t)) : el('small', null, `Menit ${menit}. Tekan Maju 1 menit.`)))));
  }
  draw();
  return { destroy: stop };
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act lampu-otomatis' });
  root.append(wrap);
  function start2(nT) {
    const pts = Array(nT).fill(0); let turn = 0; const total = Math.max(4, nT * 2); let s = start('v3', { lampu: 'NYALA', diam: 0 }); const ver = 'v3';
    function step() {
      if (turn >= total) { finishBoard(wrap, ctx, { title: 'Tebak lampu selesai', pts, again: () => pickTeams(wrap, 'Tebak Lampu', start2) }); return; }
      const maker = turn % nT; const guesser = (turn + 1) % nT; const e = { gerak: true, luar: 20, tombol: false };
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1} menyusun kejadian menit ${turn + 1}.`);
      const body = el('div');
      const make = () => body.replaceChildren(el('div', { class: 'lo-atur' }, el('small', null, 'gerak'), el('div', { class: 'seg' }, [[true, 'ADA'], [false, 'TIDAK']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${e.gerak === v ? 'on' : ''}`, type: 'button' }, t), () => { e.gerak = v; make(); }))),
        el('small', null, 'cahaya luar'), el('div', { class: 'seg' }, [10, 20, 35, 50, 80].map((v) => onTap(el('button', { class: `seg-btn ${e.luar === v ? 'on' : ''}`, type: 'button' }, String(v)), () => { e.luar = v; make(); }))),
        el('small', null, 'tombol'), el('div', { class: 'seg' }, [[false, 'TIDAK'], [true, 'DITEKAN']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${e.tombol === v ? 'on' : ''}`, type: 'button' }, t), () => { e.tombol = v; make(); })))),
      button('Kejadian siap', guess, 'primary'));
      function guess() {
        const g = { lampu: s.lampu, diam: s.diam };
        say(msg, '', `Tim ${guesser + 1}: tebak lampu dan diam sesudah menit ini.`);
        const draw = () => body.replaceChildren(el('p', { class: 'lo-ket' }, `Kejadian: ${e.gerak ? 'ADA' : 'TIDAK'} gerakan, cahaya luar ${e.luar}, tombol ${e.tombol ? 'DITEKAN' : 'TIDAK'}`),
          el('div', { class: 'lo-atur' }, el('div', { class: 'seg' }, ['NYALA', 'MATI'].map((v) => onTap(el('button', { class: `seg-btn ${g.lampu === v ? 'on' : ''}`, type: 'button' }, v), () => { g.lampu = v; draw(); }))), stepper(g.diam, (v) => { g.diam = v; }, { min: 0, max: 30, label: 'diam' })),
          button('Jalankan program', reveal, 'primary'));
        draw();
        function reveal() {
          const r = langkah(ver, s, e); s = r; let p = 0; if (r.lampu === g.lampu) p++; if (r.diam === g.diam) p++; pts[guesser] += p;
          if (p === 2) ctx.sound.good(); else ctx.sound.bad();
          body.replaceChildren(kelas(s, { luar: e.luar, gerak: e.gerak }), statBar(s, r, ver), codeView(CODE.v3, { hl: r.ex }));
          say(msg, p === 2 ? '' : 'bad', `Bacaan ${r.bacaan}, diam ${r.diam}, lampu ${r.lampu}, mode ${r.mode}. Tim ${guesser + 1} +${p}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); turn++; setTimeout(step, 5200);
        }
      }
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Versi 3 · menit ${turn + 1} · sekarang: diam ${s.diam}, ${s.lampu}, ${s.mode}`), body, msg);
      make();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Lampu', start2);
}
