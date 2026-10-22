// Target Tabungan Sepeda — SMP (13–15 tahun), coding. SELAMA loops: pupils
// trace Dimas's savings program until it stops, watch "tabungan ≠ harga" never
// stop at 450000 (and stop only by luck at 600000), find the off-by-one stop
// in Yoga's version, and choose between UNTUK and SELAMA.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

export const CONDS = { lt: 'tabungan < harga', ne: 'tabungan ≠ harga', plus: 'tabungan + 35000 < harga' };
export const LIMIT = 520; // about 100 rounds of the loop
export const dimas = ({ harga = 450000, cond = 'lt', iuran = false } = {}) => [
  `harga ← ${harga}`, 'tabungan ← 50000', 'minggu ← 0', `SELAMA ${CONDS[cond]}`, '    minggu ← minggu + 1', '    tabungan ← tabungan + 35000', '    JIKA minggu MOD 4 = 0 MAKA', '        tabungan ← tabungan + 20000',
  ...(iuran ? ['    JIKA minggu = 5 MAKA', '        tabungan ← tabungan − 30000'] : []), 'TAMPILKAN minggu, tabungan'];
export const untuk = (n) => ['tabungan ← 50000', `UNTUK minggu DARI 1 SAMPAI ${n}`, '    tabungan ← tabungan + 35000', '    JIKA minggu MOD 4 = 0 MAKA', '        tabungan ← tabungan + 20000', 'TAMPILKAN tabungan'];
export const go = (lines) => runAll(lines, { limit: LIMIT });
export const checks = (res) => res.trace.filter((t) => t.line === 3).length;
// savings after each week (no limit)
export function weeks(n, iuran = false) { const a = [50000]; let t = 50000; for (let m = 1; m <= n; m++) { t += 35000; if (m % 4 === 0) t += 20000; if (iuran && m === 5) t -= 30000; a.push(t); } return a; }
// stop week/savings for a price with the "<" rule
export function stopAt(harga) { const w = weeks(400); const m = w.findIndex((t) => t >= harga); return [m, w[m]]; }

// Savings chart: points per week and the price line.
function chart(series, harga, { w = 520, h = 260 } = {}) {
  const maxY = Math.max(harga ?? 0, ...series) * 1.08; const n = Math.max(12, series.length - 1);
  const X = (i) => 40 + (i / n) * (w - 60); const Y = (v) => h - 30 - (v / maxY) * (h - 50);
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, a, txt) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (txt != null) e.textContent = txt; return e; };
  const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, class: 'tt-grafik', role: 'img', 'aria-label': 'Grafik tabungan per minggu' });
  svg.append(s('line', { x1: 40, y1: h - 30, x2: w - 10, y2: h - 30, class: 'sumbu' }), s('line', { x1: 40, y1: 10, x2: 40, y2: h - 30, class: 'sumbu' }));
  if (harga != null) svg.append(s('line', { x1: 40, y1: Y(harga), x2: w - 10, y2: Y(harga), class: 'harga' }), s('text', { x: 48, y: Y(harga) - 6, 'text-anchor': 'start', class: 'label-harga' }, `harga ${harga}`));
  for (let i = 0; i <= n; i += n > 24 ? 4 : 2) svg.append(s('text', { x: X(i), y: h - 12, 'text-anchor': 'middle', class: 'label' }, String(i)));
  if (series.length > 1) svg.append(s('polyline', { points: series.map((v, i) => `${X(i)},${Y(v)}`).join(' '), class: 'garis' }));
  series.forEach((v, i) => svg.append(s('circle', { cx: X(i), cy: Y(v), r: 5, class: harga != null && v >= harga ? 'titik cukup' : 'titik' })));
  return svg;
}
function tabTracer(lines, harga, o = {}) {
  let hist = []; let marks = [];
  return tracer(lines, { opts: { limit: LIMIT }, counts: true, speed: 220, ...o,
    onStep: (y, st) => { if (!y) { hist = [st.vars.tabungan ?? 50000]; marks = []; return; } if (y.line === 3) marks.push(y.cond); if (y.note.startsWith('tabungan ←')) hist[st.vars.minggu ?? 0] = st.vars.tabungan; },
    extra: () => el('div', { class: 'tt-ekstra' }, el('div', { class: 'tt-celengan' }, el('span', null, '🐷'), el('b', null, fmt(hist[hist.length - 1] ?? 50000)), el('small', null, `putaran ${Math.max(0, hist.length - 1)}`)), chart(hist, harga),
      el('div', { class: 'tt-cek' }, el('small', null, 'Pemeriksaan baris 4:'), marks.slice(-30).map((m) => el('i', { class: m ? 'ya' : 'tidak' }, m ? '✓' : '✗')), marks.length > 30 ? el('small', null, ` (${marks.length} kali)`) : null)) });
}

export default {
  id: 'smp-29-target-tabungan',
  title: 'Target Tabungan Sepeda',
  topic: 'Perulangan SELAMA: syarat berhenti, perulangan yang tidak pernah berhenti, kesalahan selisih satu, dan memilih UNTUK atau SELAMA',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🚲',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri program tabungan Dimas sampai berhenti, temukan syarat yang membuat perulangan tidak pernah berhenti atau berhenti terlalu cepat, lalu pilih UNTUK atau SELAMA dengan tepat.',
  extraModes: [
    { id: 'jejak', icon: '🐷', label: 'Penelusur Perulangan', desc: 'Program berjalan langkah demi langkah; celengan terisi, grafik tabungan tergambar dengan garis harga, dan setiap pemeriksaan syarat ditandai', create: createTrace },
    { id: 'untuk', icon: '⚖️', label: 'UNTUK dan SELAMA', desc: 'Dua versi program berdampingan; ubah target dan banyak minggu lalu bandingkan hasilnya', create: createCompare },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Harga Rahasia', desc: 'Satu tim memilih harga rahasia, tim lain hanya melihat minggu dan tabungan saat program berhenti lalu menebak rentang harganya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act target-tabungan' });
    root.append(wrap);
    const ok = go(dimas()); const w = weeks(12);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      const runFirst = (prompt, lines, harga, after) => { const tr = tabTracer(lines, harga, { onEnd: () => setTimeout(then(after), 1500) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      if (r === 0) runFirst('Jalankan program Dimas sampai berhenti', dimas(), 450000, () => rowsChoose(wrap, ctx, { prompt: 'Isi tabel jejak', info: 'Bonus Rp20.000 datang setiap minggu ke-4, 8, 12, …', rows: [['m4', 'tabungan sesudah minggu 4', opt(w[4], [190000, 175000, 230000]), String(w[4])], ['m8', 'tabungan sesudah minggu 8', opt(w[8], [350000, 330000, 390000]), String(w[8])], ['m10', 'tabungan sesudah minggu 10', opt(w[10], [450000, 420000, 460000]), String(w[10])], ['out', 'Keluaran program', opt(ok.out[0], ['10 440000', '12 510000', '11 450000']), ok.out[0]]], done: next }));
      else if (r === 1) { const [m4, t4] = stopAt(400000); rowsChoose(wrap, ctx, { prompt: 'Pemeriksaan syarat, sisa uang, dan harga yang lebih murah', rows: [['c', 'Syarat baris 4 diperiksa', opt(`${checks(ok)} kali`, ['11 kali', '10 kali', '13 kali']), `${checks(ok)} kali`], ['s', 'Sisa uang setelah membeli sepeda Rp450.000', opt(ok.vars.tabungan - 450000, [0, 35000, 15000]), String(ok.vars.tabungan - 450000)], ['h', 'Harga Rp400.000: berhenti di minggu … dengan tabungan …', opt(`${m4} · ${t4}`, ['8 · 370000', '10 · 440000', '9 · 400000']), `${m4} · ${t4}`]], done: next }); }
      else if (r === 2) runFirst('Kakak Dimas menulis SELAMA tabungan ≠ harga. Jalankan!', dimas({ cond: 'ne' }), 450000, () => ask('Apakah program berhenti dengan harga 450000? Mengapa?', [['Tidak: tabungan melompat dari 440000 ke 475000, tidak pernah tepat 450000, lalu makin jauh, sehingga syarat ≠ selalu benar', true], ['Ya, di minggu 11 seperti program Dimas'], ['Tidak, karena 450000 bukan kelipatan 35000 saja'], ['Ya, karena komputer berhenti sendiri']], 1, el('p', { class: 'sk-galat batas' }, 'Program berhenti karena batas langkah, bukan karena syaratnya.')));
      else if (r === 3) { const t6 = go(dimas({ harga: 600000, cond: 'ne' })); ask(`Dengan harga 600000, program ≠ berhenti: ${t6.out[0]}. Apakah ini membuktikan programnya benar?`, [['Tidak: 600000 kebetulan tepat tercapai di minggu 14; untuk harga lain seperti 450000 program tetap tidak berhenti. Satu uji berhasil tidak membuktikan program benar', true], ['Ya, karena hasilnya tepat'], ['Ya, karena berhenti lebih cepat'], ['Tidak, karena 14 minggu terlalu lama']], 1, null,
        then(() => ask('Selain syarat yang salah, apa lagi yang bisa membuat SELAMA tidak pernah berhenti?', [['Baris 6 hilang atau ditulis tabungan ← 35000, sehingga tabungan tidak pernah mencapai harga', true], ['Baris TAMPILKAN di akhir program'], ['Variabel minggu dimulai dari 0'], ['Bonus ditambahkan setiap minggu ke-4']]))); }
      else if (r === 4) { const y = go(dimas({ cond: 'plus' })); runFirst('Yoga menulis SELAMA tabungan + 35000 < harga. Jalankan!', dimas({ cond: 'plus' }), 450000, () => rowsChoose(wrap, ctx, { prompt: 'Hasil program Yoga', rows: [['o', 'Berhenti di minggu … dengan tabungan …', opt(y.out[0].replace(' ', ' · '), ['11 · 475000', '9 · 405000', '10 · 450000']), y.out[0].replace(' ', ' · ')], ['c', 'Cukup untuk sepeda Rp450.000?', ['ya', 'tidak'], 'tidak'], ['k', 'Kurang', opt(450000 - y.vars.tabungan, [35000, 25000, 0]), String(450000 - y.vars.tabungan)]],
        done: then(() => ask('Mengapa disebut kesalahan selisih satu?', [['Hasilnya meleset tepat satu putaran dari yang benar: 10 minggu, padahal seharusnya 11', true], ['Karena tabungannya kurang Rp1'], ['Karena hanya satu baris yang salah'], ['Karena syaratnya diperiksa satu kali']])) })); }
      else if (r === 5) { const u10 = go(untuk(10)); ask(`Tebakan teman: "rata-rata Rp40.000 per minggu, cukup 10 minggu". UNTUK 10 minggu menghasilkan ${u10.out[0]}. Cukup, dan mengapa meleset?`, [['Tidak cukup: bonus tidak datang setiap minggu; sampai minggu 10 baru ada 2 bonus (minggu 4 dan 8)', true], ['Cukup, tepat 450000'], ['Tidak cukup, karena UNTUK lebih lambat dari SELAMA'], ['Cukup, karena 10 × 40000 = 400000 ditambah 50000']], 1, codeView(untuk(10))); }
      else if (r === 6) rowsChoose(wrap, ctx, { prompt: 'Libur semester 8 minggu: lengkapi program dengan UNTUK', rows: [['a', 'tabungan ← …', ['0', '50000', '35000'], '50000'], ['b', 'UNTUK minggu DARI 1 SAMPAI …', ['4', '8', '11'], '8'], ['c', '    tabungan ← …', ['tabungan + 35000', '35000', 'tabungan + 20000'], 'tabungan + 35000'], ['d', '    JIKA … MAKA tabungan ← tabungan + 20000', ['minggu MOD 4 = 0', 'minggu = 4', 'tabungan MOD 4 = 0'], 'minggu MOD 4 = 0']],
        done: then(() => ask('Berapa hasilnya?', [...opt(go(untuk(8)).out[0], ['330000', '350000', '405000']).map((x) => [x, x === go(untuk(8)).out[0]])], 4, codeView(untuk(8)))) });
      else if (r === 7) ask('Lengkapi aturan: pakai UNTUK bila …, pakai SELAMA bila …', [['UNTUK bila banyak putarannya sudah diketahui sebelum perulangan dimulai; SELAMA bila yang diketahui hanya syarat berhentinya', true], ['UNTUK untuk uang, SELAMA untuk waktu'], ['UNTUK bila programnya pendek; SELAMA bila panjang'], ['Keduanya selalu bisa saling menggantikan tanpa perubahan']]);
      else if (r === 8) ask('Program Dimas dengan harga rahasia berhenti di minggu 7 dengan tabungan 315000. Harga rahasia itu …', [['lebih dari 280000 dan paling banyak 315000', true], ['tepat 315000'], ['lebih dari 315000'], ['antara 245000 dan 280000']], 1, chart(weeks(7), null));
      else { const t = go(dimas({ iuran: true })); ask('Di minggu ke-5 Dimas memakai Rp30.000 untuk iuran (baris tambahan di dalam perulangan). Kapan sepeda bisa dibeli?', [[`Minggu ${t.vars.minggu} dengan tabungan ${t.vars.tabungan}`, true], ['Minggu 11 dengan tabungan 445000'], ['Minggu 11 dengan tabungan 475000'], ['Minggu 13 dengan tabungan 535000']], 1, codeView(dimas({ iuran: true }), { hl: [8, 9] })); }
    }
    render();
  },
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act target-tabungan' });
  root.append(wrap);
  let harga = 450000; let cond = 'lt'; let tr = null;
  const draw = () => {
    tr?.stop(); tr = tabTracer(dimas({ harga, cond }), harga);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur perulangan'),
      el('div', { class: 'tt-pilih' }, stepper(harga, (v) => { harga = v; draw(); }, { min: 100000, max: 900000, step: 25000, label: 'harga' }),
        el('div', { class: 'seg' }, Object.entries(CONDS).map(([k, t]) => onTap(el('button', { class: `seg-btn ${cond === k ? 'on' : ''}`, type: 'button' }, `SELAMA ${t}`), () => { cond = k; draw(); })))), tr);
  };
  draw();
}

function createCompare(root, ctx) {
  const wrap = el('div', { class: 'act target-tabungan' });
  root.append(wrap);
  let harga = 450000; let n = 8;
  const draw = () => {
    const a = go(dimas({ harga })); const b = go(untuk(n));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'UNTUK dan SELAMA berdampingan'),
      el('div', { class: 'tt-dua' },
        el('div', null, stepper(harga, (v) => { harga = v; draw(); }, { min: 100000, max: 900000, step: 25000, label: 'target' }), codeView(dimas({ harga })), el('p', { class: 'tt-hasil' }, `Keluaran: ${a.out[0]}`), el('small', null, 'SELAMA: berhenti saat syaratnya salah, banyak putarannya ditentukan oleh data.')),
        el('div', null, stepper(n, (v) => { n = v; draw(); }, { min: 1, max: 30, label: 'banyak minggu' }), codeView(untuk(n)), el('p', { class: 'tt-hasil' }, `Keluaran: ${b.out[0]}`), el('small', null, 'UNTUK: banyak putarannya sudah diketahui sebelum perulangan dimulai.'))));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act target-tabungan' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Harga rahasia selesai', pts, again: () => pickTeams(wrap, 'Harga Rahasia', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; let harga = 300000;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih harga rahasia (tim lain jangan melihat), lalu Serahkan.`);
      const host = el('div', { class: 'tt-pilih' }, stepper(harga, (v) => { harga = v; }, { min: 60000, max: 900000, step: 5000, label: 'harga rahasia' }), button('Serahkan ke tim lawan', guess, 'primary'));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih harga, Tim ${guesser + 1} menebak rentangnya`), host, msg);
      function guess() {
        const [m, t] = stopAt(harga); const w = weeks(m + 3); const lo = w[m - 1]; const right = `lebih dari ${lo} dan paling banyak ${t}`;
        const opts = ctx.rand.shuffle([right, `lebih dari ${t} dan paling banyak ${w[m + 1]}`, `tepat ${t}`, m >= 2 ? `lebih dari ${w[m - 2]} dan paling banyak ${lo}` : `lebih dari ${w[m + 1]} dan paling banyak ${w[m + 2]}`]);
        say(msg, '', `Program berhenti di minggu ${m} dengan tabungan ${t}. Tim ${guesser + 1}: harga rahasianya …`);
        host.replaceChildren(chart(w.slice(0, m + 1), null), el('div', { class: 'opts', style: { '--cols': 2 } }, opts.map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          const okk = o === right; if (okk) pts[guesser] += 2; e.currentTarget.classList.add(okk ? 'right' : 'wrong'); ctx.sound[okk ? 'good' : 'bad']();
          say(msg, okk ? '' : 'bad', `${okk ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} Harga rahasia: ${harga} (${right}).`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4600);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Harga Rahasia', start);
}
