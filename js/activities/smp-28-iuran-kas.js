// Iuran Kas Kelompok — SMP (13–15 tahun), coding. Nested loops, counters and
// accumulators: pupils trace Laras's weekly-dues program over a 4 × 5 table,
// count how often each line runs, see what happens when Wahyu moves the
// starting values to the wrong place, and swap the loops for a per-pupil recap.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

export const NAMES = ['Ani', 'Budi', 'Cici', 'Dedi', 'Eli'];
export const BAYAR = [[2000, 2000, 2000, 0, 2000], [2000, 0, 2000, 0, 2000], [2000, 2000, 0, 0, 2000], [2000, 2000, 2000, 8000, 2000]];
// where: semua 'atas' (benar) | 'minggu'; belum 'atas' | 'minggu' (benar)
export function laras({ semua = 'atas', belum = 'minggu', murid = 5 } = {}) {
  const L = [];
  if (semua === 'atas') L.push('semua ← 0');
  if (belum === 'atas') L.push('belum ← 0');
  L.push('UNTUK m DARI 1 SAMPAI 4');
  if (semua === 'minggu') L.push('    semua ← 0');
  L.push('    total ← 0');
  if (belum === 'minggu') L.push('    belum ← 0');
  L.push(`    UNTUK i DARI 1 SAMPAI ${murid}`, '        total ← total + bayar[m][i]', '        JIKA bayar[m][i] = 0 MAKA', '            belum ← belum + 1', '    TAMPILKAN "Minggu", m, total, belum', '    semua ← semua + total', 'TAMPILKAN "Seluruhnya", semua');
  return L;
}
export const REKAP = ['UNTUK i DARI 1 SAMPAI 5', '    jumlah ← 0', '    UNTUK m DARI 1 SAMPAI 4', '        jumlah ← jumlah + bayar[m][i]', '    JIKA jumlah < 8000 MAKA', '        TAMPILKAN nama[i], jumlah'];
export const KALI = (tri = false) => ['UNTUK b DARI 1 SAMPAI 5', `    UNTUK k DARI 1 SAMPAI ${tri ? 'b' : '5'}`, '        TAMPILKAN b × k', '    PINDAH BARIS'];
export const vars = (data = BAYAR) => ({ bayar: data, nama: NAMES });
export const run = (lines, data = BAYAR) => runAll(lines, { vars: vars(data) });
export const lineRuns = (res, lineIdx) => res.trace.filter((t) => t.line === lineIdx).length;
// Week-1 trace after each pupil: [total, belum]
export function week1() {
  const res = run(laras()); const rows = [];
  for (const t of res.trace) if (t.vars.m === 1 && t.line === 5 && t.note.startsWith('total')) rows.push([t.vars.i, t.vars.total]);
  const belum = []; let b = 0; for (let i = 0; i < 5; i++) { if (BAYAR[0][i] === 0) b++; belum.push(b); }
  return rows.map(([i, tot], k) => [i, tot, belum[k]]);
}

// Dues table with the cell being read lit up.
function duesView(data, { m = null, i = null, onCell = null } = {}) {
  return el('table', { class: 'ik-tabel' }, el('tr', null, el('th', null, ''), NAMES.map((nm, k) => el('th', null, `i = ${k + 1}`, el('br'), nm))),
    data.map((row, mi) => el('tr', null, el('th', null, `m = ${mi + 1}`), row.map((v, ii) => {
      const td = el('td', { class: `${mi + 1 === m && ii + 1 === i ? 'baca' : ''} ${v === 0 ? 'nol' : ''}` }, String(v));
      if (onCell) onTap(td, () => onCell(mi, ii));
      return td;
    }))));
}
function lasTracer(lines, data = BAYAR, o = {}) {
  let hist = [];
  return tracer(lines, { opts: { vars: vars(data) }, counts: true, hideVars: ['bayar', 'nama'], showTypes: false, speed: 260, ...o,
    onStep: (y, st) => { if (!y) { hist = []; return; } const v = st.vars; if (y.note.startsWith('total ←') && v.i) hist.push([v.m, v.i, data[v.m - 1][v.i - 1], v.total, v.belum]); else if (y.note.startsWith('belum ←') && hist.length && v.i) hist[hist.length - 1][4] = v.belum; },
    extra: (st) => el('div', { class: 'ik-ekstra' }, duesView(data, { m: st.vars.m, i: st.vars.i }),
      hist.length ? el('table', { class: 'ik-jejak' }, el('tr', null, ['m', 'i', 'bayar', 'total', 'belum'].map((h) => el('th', null, h))), hist.slice(-3).map((r) => el('tr', null, r.map((x) => el('td', null, fmt(x)))))) : null) });
}

export default {
  id: 'smp-28-iuran-kas',
  title: 'Iuran Kas Kelompok',
  topic: 'Perulangan bersarang, pencacah dan akumulator, serta letak nilai awal variabel',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '💰',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri program iuran kas Laras dengan dua perulangan bersarang, hitung berapa kali setiap baris dijalankan, temukan akibat nilai awal di tempat yang salah, lalu buat rekap per murid.',
  extraModes: [
    { id: 'jejak', icon: '🔎', label: 'Tabel Jejak Otomatis', desc: 'Program berjalan langkah demi langkah; sel iuran yang dibaca menyala, tabel jejak terisi, dan setiap baris program punya penghitung', create: createTrace },
    { id: 'pindah', icon: '↕️', label: 'Pindahkan Baris', desc: 'Pindahkan baris semua ← 0 atau belum ← 0, jalankan ulang, lalu bandingkan keluarannya dengan yang benar', create: createMove },
    { id: 'data', icon: '✏️', label: 'Ubah Data', desc: 'Ganti isi tabel iuran, tebak keluaran, lalu jalankan program', create: createData },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Ubah dan Tebak', desc: 'Satu tim mengubah satu sel iuran, tim lain menebak total "Seluruhnya" sebelum program dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act iuran-kas' });
    root.append(wrap);
    const ok = run(laras()); const w1 = week1();
    const bugS = run(laras({ semua: 'minggu' })); const bugB = run(laras({ belum: 'atas' }));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([right, ...wrong])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Tabel jejak minggu 1: total dan belum setelah setiap murid', info: 'Baris 6 menambah total; baris 8 menambah belum bila bayar = 0.', rows: w1.map(([i, t, b]) => [i, `i = ${i} ${NAMES[i - 1]} (bayar ${BAYAR[0][i - 1]})`, opt(`${t} · ${b}`, [`${t} · ${b ? 0 : 1}`, `${t + 2000} · ${b}`, `${BAYAR[0][i - 1]} · ${b}`]), `${t} · ${b}`]), done: then(() => ask('Apa keluaran baris 9 untuk minggu 1?', [[ok.out[0], true], ['Minggu 1 10000 0'], ['Minggu 1 8000 4'], ['Minggu 1 2000 1']], 2, duesView(BAYAR, { m: 1 }))) });
      else if (r === 1) {
        const tr = lasTracer(laras(), BAYAR, { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Tulis semua keluaran program', rows: [...ok.out.slice(0, 4).map((o, k) => [k, `Minggu ${k + 1}`, opt(o.replace(`Minggu ${k + 1} `, ''), ['8000 1', '6000 2', '16000 0', '10000 0', '8000 2'].filter((w) => w !== o.replace(`Minggu ${k + 1} `, '')).slice(0, 3)), o.replace(`Minggu ${k + 1} `, '')]), ['s', 'Seluruhnya', opt(ok.out[4].replace('Seluruhnya ', ''), ['40000', '16000', '34000']), ok.out[4].replace('Seluruhnya ', '')]], done: next })), 1400) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan program Laras (Otomatis atau Sampai selesai)'), tr);
      } else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Uang yang seharusnya, kekurangan, dan berapa kali baris dijalankan', rows: [['a', 'Seharusnya terkumpul (5 murid × 4 minggu × Rp2.000)', opt('40000', ['36000', '20000', '10000']), '40000'], ['k', 'Kekurangan', opt('4000', ['8000', '2000', '0']), '4000'], ['b6', 'Baris 6 (total ← total + …) dijalankan', opt(`${lineRuns(ok, 5)} kali`, ['4 kali', '5 kali', '9 kali']), `${lineRuns(ok, 5)} kali`], ['b9', 'Baris 9 (TAMPILKAN "Minggu" …) dijalankan', opt(`${lineRuns(ok, 8)} kali`, ['5 kali', '20 kali', '1 kali']), `${lineRuns(ok, 8)} kali`]], done: next });
      else if (r === 3) { const big = runAll(laras({ murid: 32 }), { vars: { bayar: Array.from({ length: 4 }, () => Array(32).fill(2000)) } }); rowsChoose(wrap, ctx, { prompt: 'Seluruh kelas: baris 5 menjadi UNTUK i DARI 1 SAMPAI 32', rows: [['b6', 'Baris 6 dijalankan', opt(`${lineRuns(big, 5)} kali`, ['32 kali', '36 kali', '64 kali']), `${lineRuns(big, 5)} kali`], ['u', 'Uang bila semua membayar tepat waktu', opt(big.out[4].replace('Seluruhnya ', ''), ['64000', '128000', '40000']), big.out[4].replace('Seluruhnya ', '')]], done: next }); }
      else if (r === 4) rowsChoose(wrap, ctx, { prompt: 'Pencacah atau akumulator?', info: 'Pencacah bertambah 1; akumulator bertambah sebesar suatu nilai.', rows: [['semua', 'semua ← semua + total', ['pencacah', 'akumulator'], 'akumulator'], ['total', 'total ← total + bayar[m][i]', ['pencacah', 'akumulator'], 'akumulator'], ['belum', 'belum ← belum + 1', ['pencacah', 'akumulator'], 'pencacah']],
        done: then(() => ask('Apa beda cara pencacah dan akumulator bertambah?', [['Pencacah bertambah 1 setiap kali sesuatu terjadi; akumulator bertambah sebesar suatu nilai, misalnya uang yang dibayar', true], ['Pencacah selalu dimulai dari 1, akumulator dari 0'], ['Tidak ada bedanya'], ['Akumulator hanya dipakai di luar perulangan']])) });
      else if (r === 5) {
        const tr = lasTracer(laras({ semua: 'minggu' }), BAYAR, { onEnd: () => setTimeout(then(() => ask('Wahyu memindahkan semua ← 0 ke dalam perulangan minggu. Apa yang tampil untuk "Seluruhnya", dan mengapa?', [[`${bugS.vars.semua}: semua dikosongkan setiap awal minggu, sehingga uang minggu 1–3 terhapus`, true], ['36000: tidak ada bedanya'], ['0: semua tidak pernah bertambah'], ['144000: semua dijumlahkan empat kali']])), 1400) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Wahyu: semua ← 0 di dalam perulangan minggu'), tr);
      } else if (r === 6) {
        const tr = lasTracer(laras({ belum: 'atas' }), BAYAR, { onEnd: () => setTimeout(then(() => ask('belum ← 0 dipindah ke atas, di luar kedua perulangan. Nilai belum minggu 1–4, dan benarkah?', [[`${bugB.out.slice(0, 4).map((o) => o.split(' ').pop()).join(', ')}: tidak benar, belum menumpuk dari minggu sebelumnya (seharusnya 1, 2, 2, 0)`, true], ['1, 2, 2, 0: benar'], ['1, 3, 5, 5: benar, karena Dedi belum membayar'], ['0, 0, 0, 0: belum tidak pernah bertambah']])), 1400) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Wahyu yang lain: belum ← 0 di luar kedua perulangan'), tr);
      } else if (r === 7) ask('Di mana nilai awal sebuah akumulator atau pencacah harus diletakkan?', [['Tepat sebelum perulangan yang menjumlahkan atau menghitungnya: semua sebelum perulangan minggu; total dan belum di dalam perulangan minggu, sebelum perulangan murid', true], ['Selalu di baris paling atas program'], ['Di dalam perulangan yang paling dalam'], ['Di mana saja, hasilnya sama']], 1, codeView(laras(), { hl: [0, 2, 3] }));
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Rekap per murid: lengkapi program dengan perulangan murid di luar', rows: [['a', 'jumlah ← …', ['0', '2000', 'bayar[m][i]'], '0'], ['b', 'UNTUK m DARI 1 SAMPAI …', ['4', '5', '32'], '4'], ['c', 'jumlah ← …', ['jumlah + bayar[m][i]', 'jumlah + 1', 'bayar[m][i]'], 'jumlah + bayar[m][i]'], ['d', 'JIKA jumlah … 8000 MAKA', ['<', '>', '='], '<']],
        done: then(() => { const rek = run(REKAP); ask('Apa keluaran program rekap?', [[rek.out.join(' · '), true], ['Dedi 8000'], ['Budi 6000 · Cici 6000 · Dedi 0'], ['Ani 8000 · Budi 6000 · Cici 6000 · Dedi 8000 · Eli 8000']], 1, codeView(REKAP)); }) });
      else {
        const k5 = run(KALI()); const k3 = run(KALI(true));
        ask('Tabel perkalian: apa keluaran baris ketiga, dan berapa kali TAMPILKAN b × k dijalankan?', [[`${k5.out[2]} · ${lineRuns(k5, 2)} kali`, true], [`3 6 9 12 15 · 5 kali`], ['1 2 3 4 5 · 25 kali'], ['3 4 5 6 7 · 25 kali']], 1, codeView(KALI()),
          then(() => ask('Baris kedua diubah menjadi UNTUK k DARI 1 SAMPAI b. Bentuk keluarannya?', [[`Segitiga: baris 1 berisi 1 angka sampai baris 5 berisi 5 angka; TAMPILKAN dijalankan ${lineRuns(k3, 2)} kali`, true], ['Persegi 5 × 5, 25 kali'], ['Satu baris berisi 15 angka'], ['Segitiga terbalik, 10 kali']], 1, el('pre', { class: 'ik-keluaran' }, k3.out.join('\n')))));
      }
    }
    render();
  },
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act iuran-kas' });
  root.append(wrap);
  wrap.append(el('p', { class: 'prompt' }, 'Tabel jejak otomatis'), lasTracer(laras()));
}

function createMove(root, ctx) {
  const wrap = el('div', { class: 'act iuran-kas' });
  root.append(wrap);
  let semua = 'atas'; let belum = 'minggu'; let tr = null;
  const right = run(laras()).out;
  const draw = () => {
    tr?.stop();
    const lines = laras({ semua, belum }); const got = run(lines).out;
    tr = lasTracer(lines);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pindahkan baris, lalu bandingkan keluarannya'),
      el('div', { class: 'ik-pilih' },
        el('div', { class: 'sk-baris' }, el('span', null, 'semua ← 0'), el('div', { class: 'seg' }, [['atas', 'sebelum perulangan minggu'], ['minggu', 'di dalam perulangan minggu']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${semua === v ? 'on' : ''}`, type: 'button' }, l), () => { semua = v; draw(); })))),
        el('div', { class: 'sk-baris' }, el('span', null, 'belum ← 0'), el('div', { class: 'seg' }, [['atas', 'sebelum perulangan minggu'], ['minggu', 'di dalam perulangan minggu']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${belum === v ? 'on' : ''}`, type: 'button' }, l), () => { belum = v; draw(); }))))),
      el('div', { class: 'ik-banding' }, el('div', null, el('b', null, 'Keluaran yang benar'), el('pre', { class: 'ik-keluaran' }, right.join('\n'))), el('div', null, el('b', null, 'Keluaran program ini'), el('pre', { class: 'ik-keluaran' }, got.map((g, i) => el('span', { class: g === right[i] ? '' : 'beda' }, g === right[i] ? `${g}\n` : `${g}   ✗\n`))))),
      tr);
  };
  draw();
}

const VALUES = [0, 2000, 4000, 6000, 8000];
function createData(root, ctx) {
  const wrap = el('div', { class: 'act iuran-kas' });
  root.append(wrap);
  const data = BAYAR.map((r) => [...r]); let tr = null;
  const draw = () => {
    tr?.stop(); tr = lasTracer(laras(), data);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ketuk sel untuk mengganti iuran, tebak keluarannya, lalu jalankan'),
      duesView(data, { onCell: (m, i) => { data[m][i] = VALUES[(VALUES.indexOf(data[m][i]) + 1) % VALUES.length]; draw(); } }),
      el('div', { class: 'sk-tombol' }, button('↺ Data awal', () => { BAYAR.forEach((r, m) => { data[m] = [...r]; }); draw(); })), tr);
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act iuran-kas' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Ubah dan tebak selesai', pts, again: () => pickTeams(wrap, 'Ubah dan Tebak', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT;
      const data = BAYAR.map((r) => [...r]); let changed = null;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: ketuk satu sel untuk mengganti nilainya, lalu Serahkan.`);
      const host = el('div', { class: 'ik-pilih' });
      const draw = () => host.replaceChildren(duesView(data, { onCell: (m, i) => { if (changed && (changed[0] !== m || changed[1] !== i)) { data[changed[0]][changed[1]] = BAYAR[changed[0]][changed[1]]; } changed = [m, i]; data[m][i] = VALUES[(VALUES.indexOf(data[m][i]) + 1) % VALUES.length]; draw(); }, m: changed ? changed[0] + 1 : null, i: changed ? changed[1] + 1 : null }), button('Serahkan ke tim lawan', guess, 'primary'));
      draw();
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} mengubah data, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const res = run(laras(), data); const right = res.vars.semua;
        const cand = [...new Set([right, right + 2000, right - 2000, right + 4000, 36000].filter((x) => x >= 0))].slice(0, 4).sort((a, b) => a - b);
        say(msg, '', `Tim ${guesser + 1}: berapa yang tampil untuk "Seluruhnya"?`);
        host.replaceChildren(duesView(data, { m: changed ? changed[0] + 1 : null, i: changed ? changed[1] + 1 : null }), el('div', { class: 'opts', style: { '--cols': 4 } }, cand.map((c) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, String(c))), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          const okk = c === right; if (okk) pts[guesser] += 2; e.currentTarget.classList.add(okk ? 'right' : 'wrong'); ctx.sound[okk ? 'good' : 'bad']();
          say(msg, okk ? '' : 'bad', `${okk ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} Keluaran: ${res.out.join(' · ')}`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4600);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Ubah dan Tebak', start);
}
