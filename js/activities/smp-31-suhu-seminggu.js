// Data Suhu Seminggu — SMP (13–15 tahun), coding. Arrays (index from 1):
// pupils read boxes by index, trace the max/average program, watch Rudi's
// "SAMPAI 8" stop at a box that does not exist, find the maks ← 0 bug with
// the below-zero highland data, then write minimum and counting programs.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DATA = {
  suhu: [31, 33, 29, 30, 34, 32, 28],
  dingin: [-1, -2, -3, -1, -4, -2, -1],
  rusak: [30, 31, -99, 29, 32, 33, 31],
};
export const DNAME = { suhu: 'suhu (sekolah, 13.00)', dingin: 'dingin (dataran tinggi, 05.00)', rusak: 'minggu berikutnya (−99 = tidak ada data)', sendiri: 'larik sendiri' };
// Max/average program from the worksheet; n = 7, 8 or 'PANJANG'; init = '0' or 'first'.
export function maksProg({ arr = 'suhu', n = 7, init = '0' } = {}) {
  const len = n === 'PANJANG' ? `PANJANG(${arr})` : n;
  return [`maks ← ${init === '0' ? '0' : `${arr}[1]`}`, 'jumlah ← 0', `UNTUK i DARI 1 SAMPAI ${len}`, `    JIKA ${arr}[i] > maks MAKA`, `        maks ← ${arr}[i]`, `    jumlah ← jumlah + ${arr}[i]`, `rata ← jumlah / ${n === 'PANJANG' ? `PANJANG(${arr})` : 7}`, 'TAMPILKAN maks, rata'];
}
export const minProg = (arr = 'suhu', init = 'first') => [`terendah ← ${init === 'first' ? `${arr}[1]` : '0'}`, 'hari_min ← 1', `UNTUK i DARI ${init === 'first' ? 2 : 1} SAMPAI PANJANG(${arr})`, `    JIKA ${arr}[i] < terendah MAKA`, `        terendah ← ${arr}[i]`, '        hari_min ← i', 'TAMPILKAN terendah, hari_min'];
export const panasProg = (arr = 'suhu', op = '>') => ['panas ← 0', `UNTUK i DARI 1 SAMPAI PANJANG(${arr})`, `    JIKA ${arr}[i] ${op} 30 MAKA`, '        panas ← panas + 1', 'TAMPILKAN panas'];
export const validProg = (arr = 'data') => ['jumlah ← 0', 'banyak ← 0', `UNTUK i DARI 1 SAMPAI PANJANG(${arr})`, `    JIKA ${arr}[i] ≠ −99 MAKA`, '        banyak ← banyak + 1', '        JIKA banyak = 1 MAKA', `            maks ← ${arr}[i]`, `            terendah ← ${arr}[i]`, `        JIKA ${arr}[i] > maks MAKA`, `            maks ← ${arr}[i]`, `        JIKA ${arr}[i] < terendah MAKA`, `            terendah ← ${arr}[i]`, `        jumlah ← jumlah + ${arr}[i]`, 'rata ← jumlah / banyak', 'TAMPILKAN maks, terendah, rata'];
export const run = (lines, arr, data) => runAll(lines, { vars: { [arr]: data } });
// Values of maks/jumlah after each i of the max program.
export function maksRows(data) {
  const rows = []; let maks = 0; let jumlah = 0;
  data.forEach((v, k) => { const up = v > maks; if (up) maks = v; jumlah += v; rows.push([k + 1, v, up, maks, jumlah]); });
  return rows;
}

// Numbered boxes; cur = index being read, over = index past the end.
function boxes(data, { cur = null, over = null, edit = null, name = 'suhu' } = {}) {
  const cells = data.map((v, k) => el('div', { class: `sus-kotak ${cur === k + 1 ? 'baca' : ''}` }, el('small', null, `${name}[${k + 1}]`),
    edit ? (() => { const inp = el('input', { type: 'number', value: String(v), min: '-99', max: '60', 'aria-label': `${name}[${k + 1}]` }); inp.addEventListener('change', () => { const x = Math.round(Number(inp.value)); edit(k, Number.isFinite(x) ? Math.max(-99, Math.min(60, x)) : 0); }); return inp; })() : el('b', null, fmt(v)),
    el('i', null, HARI[k] ?? `hari ${k + 1}`)));
  if (over) cells.push(el('div', { class: 'sus-kotak luar' }, el('small', null, `${name}[${over}]`), el('b', null, '?'), el('i', null, 'tidak ada')));
  return el('div', { class: 'sus-larik' }, cells);
}
// Small thermometer from −10 to 40 °C.
function thermo(v, label = 'maks') {
  const has = typeof v === 'number'; const p = has ? Math.max(0, Math.min(100, ((v + 10) / 50) * 100)) : 0;
  return el('div', { class: 'sus-termo' }, el('div', { class: 'sus-tabung' }, el('span', { style: { height: `${p}%` }, class: has && v < 0 ? 'beku' : '' })), el('div', null, el('small', null, label), el('b', null, has ? `${fmt(v)} °C` : '–')));
}
function arrTracer(lines, arr, data, o = {}) {
  const watch = lines[0].startsWith('terendah') ? 'terendah' : lines[0].startsWith('panas') ? 'panas' : 'maks';
  return tracer(lines, { opts: { vars: { [arr]: data }, limit: 400 }, speed: 420, hideVars: [arr], ...o,
    extra: (st) => {
      const i = st.vars.i; const err = st.error && /batas larik/.test(st.error.message);
      return el('div', { class: 'sus-ekstra' }, boxes(data, { cur: !st.done && !st.error && Number.isInteger(i) ? i : null, over: err ? i : null, name: arr }), watch === 'panas' ? null : thermo(st.vars[watch], watch));
    } });
}

export default {
  id: 'smp-31-suhu-seminggu',
  title: 'Data Suhu Seminggu',
  topic: 'Larik: indeks, menjelajah larik, maksimum, minimum, rata-rata, pencacah bersyarat, indeks di luar batas, dan nilai awal yang salah',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🌡️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Baca larik suhu dengan indeks, telusuri program suhu tertinggi dan rata-rata, temukan bug kotak yang tidak ada dan bug nilai awal 0, lalu cari suhu terendah dan banyak hari panas.',
  extraModes: [
    { id: 'jejak', icon: '🗃️', label: 'Kotak Larik', desc: 'Program berjalan langkah demi langkah di atas tujuh kotak bernomor; ganti program dan data, atau ketik larik sendiri', create: createTrace },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Larik Pengecoh', desc: 'Satu tim mengisi larik pengecoh, tim lain menebak apakah program memberi hasil yang benar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act suhu-seminggu' });
    root.append(wrap);
    const S = DATA.suhu; const D = DATA.dingin; const rows = maksRows(S);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      const both = () => el('div', { class: 'sus-dua' }, boxes(S, { name: 'suhu' }), boxes(D, { name: 'dingin' }));
      const runFirst = (prompt, lines, arr, data, after) => { const tr = arrTracer(lines, arr, data, { onEnd: () => setTimeout(then(after), 1600) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      if (r === 0) { wrap.append(both()); rowsChoose(wrap, ctx, { prompt: 'Membaca larik', rows: [['a', 'suhu[3]', opt(S[2], [33, 31, 30]), String(S[2])], ['b', 'suhu[7]', opt(S[6], [31, 32, 7]), String(S[6])], ['c', 'dingin[5]', opt(fmt(D[4]), ['−2', '−1', '5']), fmt(D[4])], ['d', 'Indeks yang berisi 34, dan harinya', opt('5 · Jumat', ['4 · Kamis', '34 · Jumat', '6 · Sabtu']), '5 · Jumat']], done: next }); }
      else if (r === 1) { wrap.append(boxes(S)); rowsChoose(wrap, ctx, { prompt: 'Hitung dulu yang di dalam kurung siku', rows: [['a', 'suhu[2] + suhu[6]', opt(S[1] + S[5], [8, 62, 64]), String(S[1] + S[5])], ['b', 'suhu[suhu[1] − 29]', opt(S[1], [31, 2, 29]), String(S[1]), 'suhu[1] − 29 = 31 − 29 = 2, lalu suhu[2] = 33.']], done: next }); }
      else if (r === 2) { const out = run(maksProg(), 'suhu', S).out[0]; runFirst('Jalankan program suhu tertinggi dan rata-rata', maksProg(), 'suhu', S, () => rowsChoose(wrap, ctx, { prompt: 'Isi tabel jejak', rows: [['m2', 'maks sesudah i = 2', opt(rows[1][3], [31, 64, 29]), String(rows[1][3])], ['j5', 'jumlah sesudah i = 5', opt(rows[4][4], [123, 189, 34]), String(rows[4][4])], ['o', 'Keluaran: maks, rata', opt(out, ['34 30', '28 31', '33 31']), out], ['k', 'Isi maks berubah …', opt('3 kali', ['7 kali', '2 kali', '4 kali']), `${rows.filter((x) => x[2]).length} kali`, 'Menjadi 31, 33, lalu 34.']], done: next })); }
      else if (r === 3) runFirst('Rudi menulis UNTUK i DARI 1 SAMPAI 8 "supaya aman". Jalankan!', maksProg({ n: 8 }), 'suhu', S, () => ask('Mengapa lebih baik program berhenti dengan galat daripada diam-diam membaca angka sembarang?', [['Angka sembarang membuat hasil salah tanpa ada yang tahu; galat langsung memberi tahu pemrogram bahwa ada bug', true], ['Galat membuat program lebih cepat'], ['Supaya suhu[8] otomatis diisi 0'], ['Tidak ada bedanya, hasilnya tetap sama']]));
      else if (r === 4) ask('Bagaimana menulis baris 3 supaya tetap benar bila larik berisi 30 hari?', [['UNTUK i DARI 1 SAMPAI PANJANG(suhu), dan baris 7 menjadi rata ← jumlah / PANJANG(suhu)', true], ['UNTUK i DARI 1 SAMPAI 30, baris 7 tetap dibagi 7'], ['UNTUK i DARI 0 SAMPAI 7'], ['UNTUK i DARI 1 SAMPAI 100 supaya pasti cukup']], 1, codeView(maksProg({ n: 'PANJANG' }), { hl: [2, 6] }));
      else if (r === 5) { const res = run(maksProg({ arr: 'dingin' }), 'dingin', D); runFirst('Jalankan program yang sama dengan larik dingin', maksProg({ arr: 'dingin' }), 'dingin', D, () => rowsChoose(wrap, ctx, { prompt: 'Hasil untuk larik dingin', rows: [['m', 'Keluaran maks', opt(fmt(res.vars.maks), ['−1', '−4', '−2']), fmt(res.vars.maks)], ['r', 'Keluaran rata', opt(fmt(res.vars.rata), ['−14', '0', '−1']), fmt(res.vars.rata)], ['s', 'Suhu tertinggi yang sebenarnya', opt(fmt(Math.max(...D)), ['0', '−4', '−2']), fmt(Math.max(...D)), 'Semua suhu di bawah 0, jadi dingin[i] > maks tidak pernah benar dan maks tetap 0. Angka 0 bahkan tidak ada di data.']], done: next })); }
      else if (r === 6) rowsChoose(wrap, ctx, { prompt: 'Perbaiki program untuk larik apa pun', rows: [['a', 'Baris 1: maks ← …', ['0', 'dingin[1]', '−100', 'dingin[7]'], 'dingin[1]', 'Nilai awal diambil dari kotak pertama larik.'], ['b', 'Apakah baris 3 juga perlu diubah?', ['tidak perlu', 'harus DARI 2', 'harus DARI 0'], 'tidak perlu', 'Membandingkan kotak 1 dengan dirinya sendiri tidak mengubah maks, dan jumlah tetap menjumlahkan ketujuh kotak.']],
        done: then(() => ask('Mengapa bug ini tidak terlihat saat program diuji dengan larik suhu?', [['Semua suhu di larik suhu lebih besar dari 0, sehingga nilai awal 0 kebetulan tidak berpengaruh', true], ['Karena larik suhu lebih panjang'], ['Karena bug hanya muncul di hari Jumat'], ['Karena larik suhu tidak punya rata-rata']], 1, codeView(maksProg({ arr: 'dingin', init: 'first' }), { hl: [0] }))) });
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Lengkapi program suhu terendah beserta harinya', cls: 'kode', rows: [['a', 'terendah ← …', ['0', 'suhu[1]', '100'], 'suhu[1]'], ['b', 'hari_min ← …', ['0', '1', '7'], '1'], ['c', 'UNTUK i DARI 2 SAMPAI …', ['7', 'PANJANG(suhu)', '8'], 'PANJANG(suhu)', 'Benar untuk larik sepanjang apa pun.'], ['d', '    JIKA suhu[i] … terendah MAKA', ['<', '>', '='], '<'], ['e', '        hari_min ← …', ['i', 'suhu[i]', 'terendah'], 'i', 'Yang disimpan adalah indeksnya, bukan suhunya.']],
        done: then(() => { const a = run(minProg(), 'suhu', S).out[0]; const b = run(minProg('dingin'), 'dingin', D).out[0]; rowsChoose(wrap, ctx, { prompt: 'Hasil program terendah', rows: [['s', 'Larik suhu: terendah · hari_min', opt(a.replace(' ', ' · '), ['0 · 1', '29 · 3', '28 · 1']), a.replace(' ', ' · '), 'Minggu (hari ke-7).'], ['d', 'Larik dingin: terendah · hari_min', opt(b.replace(' ', ' · '), ['−1 · 1', '−4 · 1', '0 · 1']), b.replace(' ', ' · '), 'Jumat (hari ke-5).'], ['z', 'Bila terendah ← 0, hasil untuk larik suhu', opt(run(minProg('suhu', '0'), 'suhu', S).vars.terendah, [28, 31, 34]), String(run(minProg('suhu', '0'), 'suhu', S).vars.terendah)]], done: next }); }) });
      else if (r === 8) { const g = run(panasProg(), 'suhu', S).out[0]; const ge = run(panasProg('suhu', '≥'), 'suhu', S).out[0]; runFirst('Program penghitung hari panas (di atas 30 °C)', panasProg(), 'suhu', S, () => rowsChoose(wrap, ctx, { prompt: 'Banyak hari panas', rows: [['g', 'suhu[i] > 30', opt(`${g} hari`, ['3 hari', '5 hari', '7 hari']), `${g} hari`, 'Senin 31, Selasa 33, Jumat 34, Sabtu 32.'], ['ge', 'suhu[i] ≥ 30 (30 °C atau lebih)', opt(`${ge} hari`, ['4 hari', '6 hari', '3 hari']), `${ge} hari`, 'Kamis (30) ikut terhitung.']], done: next })); }
      else { const R = DATA.rusak; const v = run(validProg(), 'data', R); const allMaks = Math.max(...R); const allMin = Math.min(...R); const allRata = R.reduce((s, x) => s + x, 0) / R.length;
        runFirst('Tantangan: −99 berarti "tidak ada data". Jalankan program yang melewatinya', validProg(), 'data', R, () => rowsChoose(wrap, ctx, { prompt: 'Bandingkan hasilnya', rows: [['v', 'Data valid: tertinggi · terendah · rata', opt(`${v.vars.maks} · ${v.vars.terendah} · ${fmt(v.vars.rata)}`, ['33 · −99 · 31', '33 · 29 · 26,57…', '31 · 29 · 31']), `${v.vars.maks} · ${v.vars.terendah} · ${fmt(v.vars.rata)}`, 'Rata-rata 186 / 6 = 31.'], ['a', '−99 ikut dihitung: tertinggi · terendah · rata', opt(`${allMaks} · ${fmt(allMin)} · ${fmt(allRata)}`, ['33 · 29 · 31', '33 · −99 · 31', '−99 · 29 · 12,43…']), `${allMaks} · ${fmt(allMin)} · ${fmt(allRata)}`, 'Rata-rata 87 / 7, sekitar 12,4: angka yang jelas tidak masuk akal.']], done: next })); }
    }
    render();
  },
};

const PROGS = {
  maks0: ['maks ← 0 (lembar)', (a) => maksProg({ arr: a })],
  maks1: ['maks ← larik[1] (perbaikan)', (a) => maksProg({ arr: a, n: 'PANJANG', init: 'first' })],
  rudi: ['Rudi: SAMPAI 8', (a) => maksProg({ arr: a, n: 8 })],
  min: ['suhu terendah dan harinya', (a) => minProg(a)],
  panas: ['banyak hari di atas 30 °C', (a) => panasProg(a)],
  valid: ['lewati −99 (tantangan)', (a) => validProg(a)],
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act suhu-seminggu' });
  root.append(wrap);
  let prog = 'maks0'; let src = 'suhu'; let own = [...DATA.suhu]; let tr = null;
  const draw = () => {
    tr?.stop();
    const arr = src === 'dingin' ? 'dingin' : src === 'suhu' ? 'suhu' : 'data'; const data = src === 'sendiri' ? own : DATA[src];
    tr = arrTracer(PROGS[prog][1](arr), arr, data);
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Kotak larik bernomor'),
      el('div', { class: 'sus-pilih' }, el('div', { class: 'seg' }, Object.entries(PROGS).map(([k, [t]]) => onTap(el('button', { class: `seg-btn ${prog === k ? 'on' : ''}`, type: 'button' }, t), () => { prog = k; draw(); }))),
        el('div', { class: 'seg' }, Object.keys(DNAME).map((k) => onTap(el('button', { class: `seg-btn ${src === k ? 'on' : ''}`, type: 'button' }, DNAME[k]), () => { src = k; draw(); })))),
      src === 'sendiri' ? el('div', { class: 'sus-sendiri' }, el('small', null, 'Ketik suhu baru (−99 sampai 60), lalu tekan Enter atau pindah kotak:'), boxes(own, { name: 'data', edit: (k, v) => { own[k] = v; draw(); } })) : null, tr].filter(Boolean));
  };
  draw();
}

// Pengecoh programs for the team mode: [label, lines(arr), right answer(data)]
export const TRAPS = [
  ['Suhu tertinggi dengan maks ← 0', (a) => ['maks ← 0', `UNTUK i DARI 1 SAMPAI PANJANG(${a})`, `    JIKA ${a}[i] > maks MAKA`, `        maks ← ${a}[i]`, 'TAMPILKAN maks'], (d) => Math.max(...d)],
  ['Suhu terendah dengan terendah ← 0', (a) => ['terendah ← 0', `UNTUK i DARI 1 SAMPAI PANJANG(${a})`, `    JIKA ${a}[i] < terendah MAKA`, `        terendah ← ${a}[i]`, 'TAMPILKAN terendah'], (d) => Math.min(...d)],
  ['Suhu tertinggi yang berhenti di kotak 6', (a) => [`maks ← ${a}[1]`, 'UNTUK i DARI 2 SAMPAI 6', `    JIKA ${a}[i] > maks MAKA`, `        maks ← ${a}[i]`, 'TAMPILKAN maks'], (d) => Math.max(...d)],
];
export const trapRight = (k, data) => { const [, lines, want] = TRAPS[k]; return run(lines('data'), 'data', data).out[0] === fmt(want(data)); };

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act suhu-seminggu' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Larik pengecoh selesai', pts, again: () => pickTeams(wrap, 'Larik Pengecoh', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; const t = k % TRAPS.length; const data = [...DATA.suhu];
      const [label, lines] = TRAPS[t];
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: isi larik pengecoh (misalnya semua negatif, semua sama, atau nilai terbesar di kotak terakhir), lalu Serahkan.`);
      const host = el('div', { class: 'sus-giliran' });
      const fill = () => host.replaceChildren(codeView(lines('data')), boxes(data, { name: 'data', edit: (i, v) => { data[i] = v; } }), button('Serahkan ke tim lawan', guess, 'primary'));
      fill();
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: ${label}. Tim ${maker + 1} membuat larik, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const ok = trapRight(t, data); const res = run(lines('data'), 'data', data);
        say(msg, '', `Tim ${guesser + 1}: apakah program ini memberi hasil yang benar untuk larik ini?`);
        host.replaceChildren(codeView(lines('data')), boxes(data, { name: 'data' }), el('div', { class: 'opts', style: { '--cols': 2 } }, [['ya', 'Ya, hasilnya benar'], ['tidak', 'Tidak, hasilnya salah']].map(([v, txt]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, txt)), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          const hit = (v === 'ya') === ok; if (hit) pts[guesser] += 2; else pts[maker] += 1;
          e.currentTarget.classList.add(hit ? 'right' : 'wrong'); ctx.sound[hit ? 'good' : 'bad']();
          const want = TRAPS[t][2](data);
          say(msg, hit ? '' : 'bad', `${hit ? `Tepat! Tim ${guesser + 1} +2.` : `Pengecoh berhasil, Tim ${maker + 1} +1.`} Keluaran program: ${res.out[0]}; jawaban sebenarnya: ${fmt(want)}. ${ok ? 'Hasilnya benar.' : 'Hasilnya salah.'}`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 5200);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Larik Pengecoh', start);
}
