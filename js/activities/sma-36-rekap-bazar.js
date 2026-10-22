// Rekap Bazar Amal — SMA/SMK (16–18 tahun), coding. Python loops over a 2D
// list: predicting range(), nested for with an accumulator, Dodi's misplaced
// jumlah = 0, finding the best day and stall, Sari's while that never ends
// (indentation), IndexError past the last index, and a donation target loop.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyTracer, pyCode, stepper } from './smp-kit.js';
import { runPy, pyRepr, makePyRunner } from './mini-py.js';

export const HARI = ['Kamis', 'Jumat', 'Sabtu'];
export const STAN = ['Kue', 'Minuman', 'Kerajinan', 'Buku bekas'];
export const DATA = [[120, 85, 60, 45], [150, 95, 40, 35], [210, 130, 75, 55]];
const HEAD = ['hari = ["Kamis", "Jumat", "Sabtu"]', 'stan = ["Kue", "Minuman", "Kerajinan", "Buku bekas"]', 'penjualan = [[120, 85, 60, 45],', '             [150, 95, 40, 35],', '             [210, 130, 75, 55]]', 'total_hari = []'];
export const REKAP = (dodi = false) => [...HEAD, ...(dodi ? ['jumlah = 0', 'for h in range(len(hari)):'] : ['for h in range(len(hari)):', '    jumlah = 0']), '    for s in range(len(stan)):', '        jumlah = jumlah + penjualan[h][s]', '    total_hari.append(jumlah)', '    print(hari[h], jumlah)', 'print("Total bazar:", sum(total_hari))',
  'terlaris = 0', 'for h in range(1, len(hari)):', '    if total_hari[h] > total_hari[terlaris]:', '        terlaris = h', 'print("Hari terlaris:", hari[terlaris])'];
const PRE = ['hari = ["Kamis", "Jumat", "Sabtu"]', 'total_hari = [310, 320, 470]  # dari program rekap'];
export const SARI = ({ indent = false, batas = 400, and = false } = {}) => [...PRE, 'i = 0', and ? `while i < len(total_hari) and total_hari[i] < ${batas}:` : `while total_hari[i] < ${batas}:`, `    print(hari[i], "belum mencapai ${batas}")`, `${indent ? '    ' : ''}i = i + 1`, `print("Hari pertama mencapai ${batas}:", hari[i])`];
export const STANPROG = (wrong = false) => [...HEAD.slice(0, 5), 'total_stan = []', 'for s in range(len(stan)):', '    jumlah = 0', '    for h in range(len(hari)):', `        jumlah = jumlah + penjualan[${wrong ? 's][h' : 'h][s'}]`, '    total_stan.append(jumlah)', 'terbaik = 0', 'for s in range(1, len(stan)):', '    if total_stan[s] > total_stan[terbaik]:', '        terbaik = s', 'print("Stan terlaris:", stan[terbaik])'];
export const DONASI = (target = 300, persen = 30) => [...PRE, `target = ${target}`, 'terkumpul = 0', 'i = 0', 'while terkumpul < target and i < len(hari):', `    terkumpul = terkumpul + total_hari[i] * ${persen} // 100`, '    i = i + 1', 'if terkumpul >= target:', '    print("Target tercapai pada hari", hari[i - 1])', 'else:', '    print("Target belum tercapai, kurang", target - terkumpul)'];
export const NAIK = [...HEAD.slice(0, 5), 'for s in range(len(stan)):', '    naik = True', '    for h in range(1, len(hari)):', '        if penjualan[h][s] <= penjualan[h - 1][s]:', '            naik = False', '    if naik:', '        print(stan[s])'];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, loopLimit: 50, ...o });
export const RANGES = ['range(1, 4)', 'range(0, 10, 3)', 'range(5, 0, -1)', 'range(len(stan))', 'range(2, 2)', 'range(10, 0, -3)'];
const DISTRACT = { 'range(1, 4)': ['[1, 2, 3, 4]', '[0, 1, 2, 3]', '[2, 3, 4]'], 'range(0, 10, 3)': ['[0, 3, 6, 9, 12]', '[3, 6, 9]', '[0, 3, 6]'], 'range(5, 0, -1)': ['[5, 4, 3, 2, 1, 0]', '[4, 3, 2, 1, 0]', '[]'], 'range(len(stan))': ['[1, 2, 3, 4]', '[0, 1, 2, 3, 4]', '[4]'], 'range(2, 2)': ['[2]', '[0, 1]', '[2, 2]'], 'range(10, 0, -3)': ['[10, 7, 4, 1, -2]', '[10, 7, 4]', '[9, 6, 3]'] };
export const rangeOf = (src) => pyRepr(runPy([...HEAD.slice(0, 2), `x = list(${src})`]).vars.x);
// Line counts for a run (how many times each line was reached).
export function counts(lines) { const c = {}; const ru = makePyRunner(lines, { limit: 20000 }); for (const y of ru.gen) c[y.line] = (c[y.line] || 0) + 1; return c; }

function grid(vars = {}, { lit = false, col = null } = {}) {
  const h = vars.h; const s = vars.s;
  return el('table', { class: 'rb-tabel' }, el('tr', null, el('th', null, ''), STAN.map((n, j) => el('th', { class: col === j ? 'kolom' : '' }, `${j}: ${n}`))),
    DATA.map((row, i) => el('tr', null, el('th', null, `${i}: ${HARI[i]}`), row.map((v, j) => el('td', { class: `${lit && i === h && j === s ? 'baca' : ''} ${col === j ? 'kolom' : ''}` }, String(v))))));
}
const loopTracer = (lines, o = {}) => pyTracer(lines, { counts: true, cls: 'rb-jejak', speed: 350, opts: { limit: 20000, loopLimit: 50 }, hideVars: ['hari', 'stan', 'penjualan'], extra: (st) => grid(st.vars, { lit: true }), ...o });

export default {
  id: 'sma-36-rekap-bazar',
  title: 'Rekap Bazar Amal',
  topic: 'Perulangan for dan while di Python, range, list dua dimensi, perulangan bersarang, akumulator, nilai terbesar, perulangan yang tidak berhenti, dan IndexError',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎪',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Ramal isi range, telusuri perulangan bersarang pada data penjualan bazar, cari hari dan stan terlaris, perbaiki perulangan while Sari, lalu lengkapi program target donasi.',
  extraModes: [
    { id: 'jejak', icon: '🔁', label: 'Penelusur Perulangan', desc: 'Kode dan tabel penjualan berdampingan: sel yang dibaca menyala dan setiap baris punya penghitung. Coba program Dodi dan Sari', create: createTrace },
    { id: 'range', icon: '🔢', label: 'Peramal range', desc: 'Atur a, b, dan langkah, tebak isinya, lalu lihat bilangannya sebagai kotak', create: createRange },
    { id: 'donasi', icon: '💝', label: 'Target Donasi', desc: 'Geser target dan persen donasi; grafik batang terkumpul bertambah setiap hari', create: createDonasi },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak print Berikutnya', desc: 'Sebelum layar maju, tim yang mendapat giliran menebak keluaran print berikutnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rekap-bazar' });
    root.append(wrap);
    const R = run(REKAP()); const D = run(REKAP(true)); const C = counts(REKAP());
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const totals = R.vars.total_hari;
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Meramal range: isi list(…)', cls: 'rb-isi', rows: RANGES.map((src) => { const v = rangeOf(src); return [src, `list(${src})`, [...new Set([v, ...DISTRACT[src]])].sort(), v, src === 'range(2, 2)' ? 'Kosong: mulai dari 2 sampai sebelum 2.' : 'Tepat.']; }), info: 'list(range(3)) = [0, 1, 2] sudah diisi.', done: next });
      else if (r === 1) { const tr = loopTracer(REKAP(), { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Jejak saat h = 0: penjualan[h][s] · jumlah sesudah baris 10', cls: 'rb-isi', rows: [1, 2, 3].map((s) => { const p = DATA[0][s]; const j = DATA[0].slice(0, s + 1).reduce((a, b) => a + b, 0); return [`s${s}`, `h = 0, s = ${s}`, [`${p} · ${j}`, `${p} · ${p}`, `${DATA[1][0]} · ${j}`, `${p} · ${j + 120}`].sort(), `${p} · ${j}`]; }).concat([['e', 'jumlah di akhir putaran h = 0 · 1 · 2', [totals.join(' · '), '310 · 630 · 1100', '480 · 310 · 175', '120 · 150 · 210'], totals.join(' · ')]]), done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program rekap: perulangan bersarang'), tr); }
      else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Keluaran dan banyak eksekusi', rows: [['b', 'Keluaran baris 12 dan 13', [R.out.slice(0, 4).join(' / '), D.out.slice(0, 4).join(' / '), 'Kamis 120 / Jumat 150 / Sabtu 210 / Total bazar: 480', 'Kamis 310 / Jumat 320 / Sabtu 470 / Total bazar: 470'], R.out.slice(0, 4).join(' / ')], ['8', 'Baris 8 dijalankan', ['3 kali', '1 kali', '4 kali', '12 kali'], `${C[7]} kali`], ['10', 'Baris 10 dijalankan', ['12 kali', '7 kali', '4 kali', '3 kali'], `${C[9]} kali`, '3 × 4.'], ['56', '5 hari dan 6 stan: baris 10 dijalankan', ['30 kali', '11 kali', '36 kali', '25 kali'], '30 kali']], done: next });
      else if (r === 3) { const tr = loopTracer(REKAP(true), { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Dodi memindahkan jumlah = 0 ke atas baris 7', rows: [['k', 'Keluaran baris 12', [D.out.slice(0, 3).join(' / '), R.out.slice(0, 3).join(' / '), 'Kamis 0 / Jumat 0 / Sabtu 0'], D.out.slice(0, 3).join(' / ')], ['m', 'Mengapa?', ['jumlah hanya dinolkan sekali, jadi penjualan hari berikutnya ditambahkan ke jumlah hari sebelumnya', 'range salah', 'append tidak berjalan'], 'jumlah hanya dinolkan sekali, jadi penjualan hari berikutnya ditambahkan ke jumlah hari sebelumnya', 'Akumulator dinolkan di dalam perulangan luar, tepat sebelum perulangan dalam.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Dodi'), tr); }
      else if (r === 4) { wrap.append(pyCode(REKAP().slice(13)), el('p', { class: 'rb-ket' }, `total_hari = ${pyRepr(totals)}`)); rowsChoose(wrap, ctx, { prompt: 'Hari terlaris (baris 14–18)', rows: [['1', 'terlaris setelah h = 1', ['1', '0', '2'], '1', '320 > 310.'], ['2', 'terlaris setelah h = 2', ['2', '1', '0'], '2', '470 > 320.'], ['o', 'Keluaran baris 18', ['Hari terlaris: Sabtu', 'Hari terlaris: 2', 'Hari terlaris: Kamis', 'Hari terlaris: 470'], R.out.at(-1)], ['b', 'Mengapa range(1, len(hari))? Dengan range(len(hari))', ['indeks 0 sudah calon awal; hasilnya tidak berubah, hanya satu perbandingan sia-sia', 'hasilnya menjadi Kamis', 'program galat IndexError'], 'indeks 0 sudah calon awal; hasilnya tidak berubah, hanya satu perbandingan sia-sia']], done: next }); }
      else if (r === 5) { const S = run(STANPROG()); const W = run(STANPROG(true));
        ask('Program mana yang menghitung total setiap stan?', [['Perulangan luar for s, dalam for h, dengan penjualan[h][s]', true], [`Perulangan luar for s, dalam for h, dengan penjualan[s][h] (berhenti dengan ${W.error?.text})`], ['Perulangan luar for h, dalam for s, tanpa jumlah = 0'], ['Satu perulangan for s dengan penjualan[s]']], 1, pyCode(STANPROG(), { cls: 'rb-kecil' }),
          then(() => { wrap.append(grid({}, { col: S.vars.terbaik })); rowsChoose(wrap, ctx, { prompt: 'Hasil program total stan', rows: [['t', 'Isi total_stan', [pyRepr(S.vars.total_stan), '[310, 320, 470]', '[480, 310, 175]', '[480, 310, 175, 135, 1100]'], pyRepr(S.vars.total_stan), 'Jumlah keempatnya 1100, sama dengan total bazar.'], ['s', 'Stan terlaris', ['Kue', 'Minuman', 'Sabtu', 'Buku bekas'], S.out.at(-1).replace('Stan terlaris: ', '')]], done: next }); })); }
      else if (r === 6) { const tr = loopTracer(SARI(), { hideVars: ['hari'], extra: null, onEnd: () => setTimeout(then(() => ask('Program Sari: apa yang terjadi, dan kapan program berhenti?', [['"Kamis belum mencapai 400" tampil terus dan tidak pernah berhenti: W4 tidak menjorok sehingga berada di luar perulangan, i tetap 0, dan 310 < 400 selalu benar', true], ['Kamis, Jumat, lalu Sabtu mencapai 400'], ['Program galat IndexError'], ['Program tidak menampilkan apa-apa']], 1, pyCode(SARI(), { warn: [5] }))), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Sari: hari pertama yang mencapai 400'), tr); }
      else if (r === 7) { const F = run(SARI({ indent: true })); const E = run(SARI({ indent: true, batas: 500 }));
        rowsChoose(wrap, ctx, { prompt: 'W4 dijorokkan, lalu ambang diganti 500', rows: [['k', 'Keluaran setelah diperbaiki', [F.out.join(' / '), 'Kamis belum mencapai 400 / Hari pertama mencapai 400: Jumat', 'Hari pertama mencapai 400: Sabtu', 'Kamis belum mencapai 400 / Jumat belum mencapai 400 / Sabtu belum mencapai 400'], F.out.join(' / ')], ['e', `Ambang 500: ${E.error?.text}. Nilai i saat itu`, ['3', '2', '4', '0'], String(E.vars.i), 'Setelah tiga putaran, pemeriksaan syarat yang keempat membaca total_hari[3], padahal indeks terakhir 2.']], done: next }); wrap.prepend(pyCode(SARI({ indent: true, batas: 500 }))); }
      else if (r === 8) { const G = run(SARI({ indent: true, batas: 500, and: true }));
        rowsChoose(wrap, ctx, { prompt: 'Perbaiki W2 dengan and', rows: [['w', 'Baris W2', ['while i < len(total_hari) and total_hari[i] < 500:', 'while total_hari[i] < 500 and i < len(total_hari):', 'while i < len(total_hari) or total_hari[i] < 500:', 'while i <= len(total_hari) and total_hari[i] < 500:'], 'while i < len(total_hari) and total_hari[i] < 500:'], ['u', 'Apakah urutan kedua syarat penting?', ['ya: and diperiksa dari kiri dan berhenti di False pertama, jadi total_hari[3] tidak dibaca', 'tidak: and bersifat tukar-menukar', 'ya: syarat kanan diperiksa dulu'], 'ya: and diperiksa dari kiri dan berhenti di False pertama, jadi total_hari[3] tidak dibaca'], ['p', `Sesudah perulangan, i = ${G.vars.i}. Lalu W5`, [`${G.error?.text ?? 'tidak galat'}: perlu memeriksa i < 3 dulu`, 'menampilkan Sabtu', 'menampilkan Kamis'], `${G.error?.text ?? 'tidak galat'}: perlu memeriksa i < 3 dulu`]], done: next }); }
      else { const T3 = run(DONASI(300)); const T4 = run(DONASI(400)); const N = run(NAIK); const steps = []; { let t = 0; for (const x of totals) { t += Math.floor((x * 30) / 100); steps.push(t); } }
        rowsChoose(wrap, ctx, { prompt: 'Program target donasi (30% setiap hari)', cls: 'rb-isi', rows: [['d4', 'D4: while … and …', ['terkumpul < target · i < len(hari)', 'terkumpul > target · i < len(hari)', 'terkumpul < target · i <= len(hari)', 'terkumpul <= target · i < 3 - 1'], 'terkumpul < target · i < len(hari)'], ['d6', 'D6 · D8 · D10', ['i + 1 · hari[i - 1] · target - terkumpul', 'i + 1 · hari[i] · terkumpul - target', 'i - 1 · hari[i - 1] · target - terkumpul'], 'i + 1 · hari[i - 1] · target - terkumpul', 'Sesudah putaran terakhir, i sudah bertambah satu.']],
          done: then(() => rowsChoose(wrap, ctx, { prompt: 'Jalankan programnya', rows: [['a', 'terkumpul tiap putaran · keluaran (target 300)', [`${steps.join(', ')} · ${T3.out[0]}`, `93, 189, 330 · Target tercapai pada hari Jumat`, `93, 96, 141 · Target belum tercapai, kurang 0`], `${steps.join(', ')} · ${T3.out[0]}`], ['b', 'Target 400', [T4.out[0], 'Target tercapai pada hari Sabtu', 'Target belum tercapai, kurang 0', 'IndexError: list index out of range'], T4.out[0], 'Perulangan berhenti karena i mencapai 3, bukan karena target tercapai.'], ['c', 'Mengapa * 30 // 100, bukan * 0.3?', ['hanya bilangan bulat: hasilnya int tanpa galat pecahan (* 0.3 memberi float, misalnya 93.0)', '* 0.3 tidak bisa dijalankan', '// lebih cepat daripada *'], 'hanya bilangan bulat: hasilnya int tanpa galat pecahan (* 0.3 memberi float, misalnya 93.0)'], ['t', 'Tantangan: stan yang naik setiap hari', [N.out.join(' dan '), 'Kue', 'Kue, Minuman, dan Kerajinan', 'Buku bekas'], N.out.join(' dan ')]], done: next })) }); }
    }
    render();
  },
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let ver = 'rekap'; let tr = null;
  const VERS = [['rekap', 'program rekap', () => REKAP()], ['dodi', 'Dodi: jumlah = 0 di luar', () => REKAP(true)], ['stan', 'total setiap stan', () => STANPROG()], ['sari', 'Sari: W4 tidak menjorok', () => SARI()], ['sari2', 'W4 dijorokkan', () => SARI({ indent: true })], ['500', 'ambang 500', () => SARI({ indent: true, batas: 500 })], ['and', '500 dengan and', () => SARI({ indent: true, batas: 500, and: true })], ['naik', 'tantangan: naik setiap hari', () => NAIK]];
  const draw = () => { tr?.stop(); tr = loopTracer(VERS.find((v) => v[0] === ver)[2](), ver.startsWith('sari') || ver === '500' || ver === 'and' ? { extra: null, hideVars: ['hari'] } : {});
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur perulangan'), el('div', { class: 'seg rb-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr); };
  draw();
}

function createRange(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let a = 0; let b = 10; let s = 3; let shown = false;
  const draw = () => {
    const src = `range(${a}, ${b}, ${s})`; const v = runPy([`x = list(${src})`]).vars.x || [];
    const wrongs = [[...v, b], v.slice(1), v.map((x) => x + 1)].map((w) => pyRepr(w));
    const opts = [...new Set([pyRepr(v), ...wrongs])].sort();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `list(${src})`), el('div', { class: 'rb-atur' }, stepper(a, (x) => { a = x; shown = false; draw(); }, { min: -10, max: 20, label: 'a' }), stepper(b, (x) => { b = x; shown = false; draw(); }, { min: -10, max: 20, label: 'b' }), stepper(s, (x) => { s = x === 0 ? (s > 0 ? -1 : 1) : x; shown = false; draw(); }, { min: -5, max: 5, label: 'langkah' })),
      shown ? el('div', { class: 'rb-kotak-kotak' }, v.length ? v.map((x) => el('span', null, String(x))) : el('em', null, 'kosong: []')) : el('div', { class: 'seg rb-tebak' }, opts.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { if (o === pyRepr(v)) ctx.sound.good(); else ctx.sound.bad(); shown = true; draw(); say(wrap.querySelector('.reveal'), o === pyRepr(v) ? '' : 'bad', o === pyRepr(v) ? 'Tepat.' : `Belum tepat: isinya ${pyRepr(v)}. Ingat, berhenti sebelum b.`); }))),
      el('p', { class: 'reveal info' }, 'Tebak isinya dulu.'));
  };
  draw();
}

function createDonasi(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let target = 300; let persen = 30;
  const draw = () => {
    const R = run(DONASI(target, persen)); const tot = [310, 320, 470]; const acc = []; let t = 0; for (const x of tot) { t += Math.floor((x * persen) / 100); acc.push(t); }
    const max = Math.max(target, acc.at(-1)) * 1.1;
    const sl = (v, min, max2, step, set, label) => { const i = el('input', { type: 'range', min: String(min), max: String(max2), step: String(step), value: String(v), 'aria-label': label }); i.addEventListener('input', () => { set(Number(i.value)); draw(); }); return el('label', { class: 'rb-geser' }, el('small', null, `${label}: ${v}`), i); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Target donasi'), el('div', { class: 'rb-atur' }, sl(target, 50, 600, 10, (v) => { target = v; }, 'target'), sl(persen, 5, 60, 5, (v) => { persen = v; }, 'persen')),
      el('div', { class: 'rb-grafik', role: 'img', 'aria-label': 'Grafik terkumpul per hari' }, el('i', { class: 'rb-target', style: { bottom: `${(target / max) * 100}%` } }, el('small', null, `target ${target}`)),
        HARI.map((h, k) => el('div', { class: 'rb-kolom' }, el('div', { class: 'rb-wadah' }, el('b', { class: `rb-batang ${acc[k] >= target ? 'capai' : ''}`, style: { height: `${(acc[k] / max) * 100}%` } }, String(acc[k]))), el('small', null, h)))),
      pyCode(DONASI(target, persen).slice(2), { cls: 'rb-kecil' }), el('pre', { class: 'rb-keluaran' }, R.out.join('\n')));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const progs = [REKAP(), REKAP(true), SARI({ indent: true }), DONASI(400)]; let p = 0; let k = 0; let team = 0;
    function step() {
      if (p >= progs.length) { finishBoard(wrap, ctx, { title: 'Tebak print selesai', pts, again: () => pickTeams(wrap, 'Tebak print Berikutnya', start) }); return; }
      const lines = progs[p]; const out = run(lines).out; if (k >= out.length) { p++; k = 0; step(); return; }
      const right = out[k]; const pool = [...new Set([right, ...run(REKAP()).out, ...run(REKAP(true)).out, ...run(SARI({ indent: true })).out, ...run(DONASI(300)).out, ...run(DONASI(400)).out].filter((x) => x.split(' ')[0] === right.split(' ')[0]))];
      const opts = [right, ...pool.filter((x) => x !== right).slice(0, 3)].sort();
      const msg = el('p', { class: 'reveal info' }, `Tim ${team + 1}: keluaran print ke-${k + 1}?`);
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Program ${p + 1} dari ${progs.length}`), pyCode(lines, { cls: 'rb-kecil' }), el('pre', { class: 'rb-keluaran' }, out.slice(0, k).join('\n') || ' '),
        el('div', { class: 'seg rb-tebak' }, (opts.length > 1 ? opts : [right, `${right}0`]).map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => {
          const ok = o === right; if (ok) { pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
          say(msg, ok ? '' : 'bad', ok ? `Tepat, Tim ${team + 1} +1.` : `Belum tepat: ${right}`); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); wrap.querySelector('.rb-tebak')?.remove();
          k++; team = (team + 1) % nT; setTimeout(step, 2600);
        }))), msg);
    }
    step();
  }
  pickTeams(wrap, 'Tebak print Berikutnya', start);
}
