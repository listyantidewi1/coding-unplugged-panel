// Kode Gelembung — SMP (13–15 tahun), coding. Bubble sort in pseudocode:
// swapping with a helper variable (Rina loses a value), tracing every
// comparison, counting comparisons n(n−1)/2, loop-bound bugs (Yoga runs off
// the array, Sari skips the last pair), the "sudah urut" flag, and a
// three-rule league table that moves team names along with the points.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, codeView, stepper } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';
import { TEAMS, standings } from './smp-09-klasemen.js';

export const POIN = [3, 9, 6, 12, 4];
export const TIM = ['7A', '7B', '8A', '8B', '9A'];
export const BOUND = { benar: 'n − i', yoga: 'n', sari: 'n − i − 1' };
export const BNAME = { benar: 'Baris 3 benar (n − i)', yoga: 'Yoga: SAMPAI n', sari: 'Sari: SAMPAI n − i − 1' };
export const bubble = (b = 'benar', n = 5) => [`n ← ${n}`, 'UNTUK i DARI 1 SAMPAI n − 1', `    UNTUK j DARI 1 SAMPAI ${BOUND[b]}`, '        JIKA poin[j] < poin[j + 1] MAKA', '            bantu ← poin[j]', '            poin[j] ← poin[j + 1]', '            poin[j + 1] ← bantu', 'TAMPILKAN poin'];
export const flagged = (n = 5) => [`n ← ${n}`, 'i ← 1', 'sudah_urut ← SALAH', 'SELAMA i ≤ n − 1 DAN sudah_urut = SALAH', '    sudah_urut ← BENAR', '    UNTUK j DARI 1 SAMPAI n − i', '        JIKA poin[j] < poin[j + 1] MAKA', '            tukar poin[j] dan poin[j + 1] dengan variabel bantu', '            sudah_urut ← SALAH', '    i ← i + 1'];
export const TUKAR = { re: /^tukar (.+) dan (.+) dengan variabel bantu$/, *run(m, api) { const a = yield* api.ev(m[1]); const b = yield* api.ev(m[2]); yield* api.assign(m[1], b); yield* api.assign(m[2], a); api.scope().bantu = a; return `tukar ${fmt(a)} dan ${fmt(b)}`; } };
export const RINA = ['poin[1] ← poin[2]', 'poin[2] ← poin[1]'];
export const go = (lines, poin = POIN, o = {}) => runAll(lines, { vars: { poin: [...poin] }, custom: [TUKAR], limit: 20000, ...o });
// comparisons = runs of the JIKA line, swaps = runs of the first swap line
export function count(res, lines) { const c = lines.findIndex((l) => l.trim().startsWith('JIKA poin')); return { cmp: res.trace.filter((t) => t.line === c).length, swap: res.trace.filter((t) => t.line === c + 1).length }; }
// [i, j, a, b, swapped, array after]
export function steps(poin = POIN, b = 'benar') {
  const p = [...poin]; const n = p.length; const out = [];
  for (let i = 1; i <= n - 1; i++) { const lim = b === 'sari' ? n - i - 1 : n - i; for (let j = 1; j <= lim; j++) { const [x, y] = [p[j - 1], p[j]]; const sw = x < y; if (sw) [p[j - 1], p[j]] = [y, x]; out.push([i, j, x, y, sw, [...p]]); } }
  return out;
}
export const afterPass = (poin, k) => { const s = steps(poin).filter((x) => x[0] === k); return s.length ? s[s.length - 1][5] : [...poin]; };
export function flagCount(poin) { const p = [...poin]; const n = p.length; let i = 1; let ok = false; let cmp = 0; let passes = 0; while (i <= n - 1 && !ok) { ok = true; passes++; for (let j = 1; j <= n - i; j++) { cmp++; if (p[j - 1] < p[j]) { [p[j - 1], p[j]] = [p[j], p[j - 1]]; ok = false; } } i++; } return { cmp, passes }; }
export const arrText = (a) => a.map((x) => fmt(x)).join(', ');

// Three-rule league table program for the challenge (smp-09 data).
export function league() {
  const t = standings(); const order = [...TEAMS];
  const vars = { tim: order, poin: order.map((x) => t[x].P), sg: order.map((x) => t[x].SG), gm: order.map((x) => t[x].GM) };
  const lines = ['n ← 6', 'UNTUK i DARI 1 SAMPAI n − 1', '    UNTUK j DARI 1 SAMPAI n − i', '        JIKA poin[j] < poin[j + 1] ATAU (poin[j] = poin[j + 1] DAN sg[j] < sg[j + 1]) ATAU (poin[j] = poin[j + 1] DAN sg[j] = sg[j + 1] DAN gm[j] < gm[j + 1]) MAKA', '            tukar tim[j] dan tim[j + 1] dengan variabel bantu', '            tukar poin[j] dan poin[j + 1] dengan variabel bantu', '            tukar sg[j] dan sg[j + 1] dengan variabel bantu', '            tukar gm[j] dan gm[j + 1] dengan variabel bantu', 'TAMPILKAN tim'];
  return { lines, res: runAll(lines, { vars, custom: [TUKAR], limit: 5000 }) };
}

// Glasses with the compared pair lifted and the helper glass.
function glasses(poin, { j = null, bantu, names = null, over = false } = {}) {
  return el('div', { class: 'kg-meja' }, el('div', { class: 'kg-gelas-baris' }, poin.map((v, k) => el('div', { class: `kg-gelas ${j != null && (k + 1 === j || k + 1 === j + 1) ? 'angkat' : ''}` }, el('small', null, `poin[${k + 1}]`), el('b', null, fmt(v)), names ? el('i', null, names[k]) : null)),
    over ? el('div', { class: 'kg-gelas luar' }, el('small', null, `poin[${poin.length + 1}]`), el('b', null, '?'), el('i', null, 'tidak ada')) : null),
    el('div', { class: 'kg-gelas bantu' }, el('small', null, 'bantu'), el('b', null, bantu === undefined ? ' ' : fmt(bantu))));
}
function sortTracer(lines, poin, o = {}) {
  let cmp = 0; let swap = 0; const ci = lines.findIndex((l) => l.trim().startsWith('JIKA poin'));
  return tracer(lines, { opts: { vars: { poin: [...poin] }, custom: [TUKAR], limit: 3000 }, speed: 360, hideVars: ['poin', 'bantu'], ...o,
    onStep: (y) => { if (!y) { cmp = 0; swap = 0; return; } if (y.line === ci) cmp++; if (y.line === ci + 1) swap++; },
    extra: (st) => el('div', { class: 'kg-ekstra' }, glasses(st.vars.poin, { j: !st.done && Number.isInteger(st.vars.j) ? st.vars.j : null, bantu: st.vars.bantu, over: !!(st.error && /batas larik/.test(st.error.message)) }),
      el('div', { class: 'kg-hitung' }, el('span', null, `Perbandingan: ${cmp}`), el('span', null, `Pertukaran: ${swap}`))) });
}

export default {
  id: 'smp-35-kode-gelembung',
  title: 'Kode Gelembung',
  topic: 'Pengurutan gelembung dalam pseudocode: menukar dengan variabel bantu, perulangan bersarang, banyak perbandingan, bug batas perulangan, dan tanda sudah urut',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🫧',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Tukar dua nilai dengan benar, telusuri pengurutan gelembung pada poin tim voli, hitung perbandingannya, temukan bug batas perulangan, dan hemat langkah dengan tanda sudah urut.',
  extraModes: [
    { id: 'jejak', icon: '🥛', label: 'Gelas dan Kode', desc: 'Pseudocode berjalan langkah demi langkah; dua gelas yang dibandingkan terangkat, gelas bantu dipakai saat menukar, dan perbandingan serta pertukaran dihitung', create: createTrace },
    { id: 'urut', icon: '📊', label: 'Tanda Sudah Urut', desc: 'Bandingkan banyak perbandingan dengan dan tanpa tanda sudah urut untuk larik acak, hampir urut, dan terbalik', create: createFlag },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Putaran', desc: 'Satu tim memilih larik awal dan nomor putaran, tim lain menebak isi larik setelah putaran itu', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kode-gelembung' });
    root.append(wrap);
    const S = steps(); const full = go(bubble()); const cnt = count(full, bubble());
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])];
      const runFirst = (prompt, lines, poin, after) => { const tr = sortTracer(lines, poin, { onEnd: () => setTimeout(then(after), 1600) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      const stepRow = (i, j) => { const s = S.find((x) => x[0] === i && x[1] === j); const wrongs = [s[4] ? arrText(S[S.indexOf(s) - 1]?.[5] ?? POIN) : arrText([...s[5]].reverse()), arrText([...s[5]].sort((a, b) => b - a)), arrText(s[5].map((v, k, a) => (k === j - 1 ? a[j] : k === j ? a[j - 1] : v)))]; return [`${i}-${j}`, `i = ${i}, j = ${j}: ${s[2]} dan ${s[3]}`, opt(arrText(s[5]), wrongs.filter((w) => w !== arrText(s[5]))).sort(), arrText(s[5])]; };
      if (r === 0) { const res = runAll(RINA, { vars: { poin: [...POIN] } }); const tr = tracer(RINA, { opts: { vars: { poin: [...POIN] } }, hideVars: ['poin'], extra: (st) => glasses(st.vars.poin, {}), onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Cara Rina menukar', rows: [['a', 'poin[1]', ['3', '9', '6'], String(res.vars.poin[0])], ['b', 'poin[2]', ['3', '9', '6'], String(res.vars.poin[1])], ['c', 'Apa yang salah?', ['Nilai 3 hilang karena tertimpa sebelum sempat dipindahkan', 'Indeksnya terbalik', 'Tidak ada yang salah', 'Larik menjadi lebih pendek'], 'Nilai 3 hilang karena tertimpa sebelum sempat dipindahkan']], done: next })), 1400) }); wrap.append(el('p', { class: 'prompt' }, 'Rina ingin menukar poin[1] dan poin[2]'), tr); }
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Lengkapi cara menukar dengan variabel bantu', cls: 'kode', rows: [['a', 'bantu ← …', ['poin[1]', 'poin[2]', '0'], 'poin[1]'], ['b', 'poin[1] ← …', ['poin[2]', 'bantu', 'poin[1]'], 'poin[2]'], ['c', 'poin[2] ← …', ['bantu', 'poin[1]', 'poin[2]'], 'bantu', 'Seperti menukar isi dua gelas dengan gelas ketiga.']], done: next });
      else if (r === 2) runFirst('Jalankan pengurutan gelembung pada poin tim voli', bubble(), POIN, () => rowsChoose(wrap, ctx, { prompt: 'Isi larik sesudah perbandingan', cls: 'kg-baris', rows: [[1, 2], [1, 4], [2, 2], [3, 1]].map(([i, j]) => stepRow(i, j)), done: next }));
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Hasil pengurutan', rows: [['o', 'Keluaran', ['[12, 9, 6, 4, 3]', '[3, 4, 6, 9, 12]', '[12, 9, 6, 3, 4]', '[9, 6, 12, 4, 3]'], fmt(full.vars.poin), '8B, 7B, 8A, 9A, 7A.'], ['c', 'Perbandingan · pertukaran', ['10 · 6', '10 · 10', '16 · 6', '6 · 10'], `${cnt.cmp} · ${cnt.swap}`], ['p', 'Sudah di tempat akhir setelah putaran 1', ['3', '12', '9', '4'], String(S.filter((x) => x[0] === 1).pop()[5][4]), 'Nilai terkecil sudah di kotak terakhir.'], ['b', 'Putaran ke-i cukup sampai pasangan ke-…', ['n − i', 'n', 'i', 'n − 1'], 'n − i']], done: next });
      else if (r === 4) { const rev = [3, 4, 6, 9, 12]; const c = count(go(bubble(), rev), bubble()); rowsChoose(wrap, ctx, { prompt: 'Banyak perbandingan: n × (n − 1) / 2', rows: [['5', '5 angka', ['10', '15', '25', '5'], '10'], ['6', '6 angka', ['15', '21', '30', '12'], String((6 * 5) / 2)], ['32', '32 murid', ['496', '1024', '992', '465'], String((32 * 31) / 2)], ['w', 'Pertukaran untuk [3, 4, 6, 9, 12]', ['10', '6', '0', '5'], String(c.swap), 'Larik terbalik: setiap perbandingan berakhir dengan pertukaran.']], done: next }); }
      else if (r === 5) runFirst('Yoga menulis baris 3: UNTUK j DARI 1 SAMPAI n', bubble('yoga'), POIN, () => ask('Apa yang terjadi saat i = 1 dan j = 5?', [['Program membandingkan poin[5] dengan poin[6], padahal kotak ke-6 tidak ada, lalu berhenti dengan galat indeks di luar batas larik', true], ['Program membandingkan poin[5] dengan poin[1]'], ['Program melewati j = 5 tanpa pesan'], ['Program mengurutkan dengan benar, hanya lebih lambat']]));
      else if (r === 6) { const s = go(bubble('sari')); runFirst('Sari menulis baris 3: UNTUK j DARI 1 SAMPAI n − i − 1', bubble('sari'), POIN, () => rowsChoose(wrap, ctx, { prompt: 'Program Sari', rows: [['o', 'Keluaran', ['[12, 9, 6, 3, 4]', '[12, 9, 6, 4, 3]', '[9, 12, 6, 4, 3]', '[3, 9, 6, 12, 4]'], fmt(s.vars.poin)], ['b', 'Benar?', ['ya', 'tidak'], 'tidak'], ['m', 'Perbandingan yang terlewat di putaran 1', ['pasangan ke-4: poin[4] dan poin[5] (3 dan 4)', 'pasangan ke-1: poin[1] dan poin[2]', 'tidak ada yang terlewat', 'pasangan ke-5'], 'pasangan ke-4: poin[4] dan poin[5] (3 dan 4)', `Program Sari hanya melakukan ${count(s, bubble('sari')).cmp} perbandingan. Pada [4, 9, 6, 12, 3] bug ini kebetulan tidak terlihat, jadi larik uji harus beragam.`]], done: next })); }
      else if (r === 7) { wrap.append(codeView(flagged(), { cls: 'kg-kode' })); rowsChoose(wrap, ctx, { prompt: 'Dengan tanda sudah urut: putaran · perbandingan (tanpa tanda: 10)', rows: [[12, 9, 6, 3, 4], [12, 9, 6, 4, 3], [3, 9, 6, 12, 4]].map((a) => { const f = flagCount(a); return [a.join(''), `[${arrText(a)}]`, ['1 · 4', '2 · 7', '4 · 10', '3 · 9'], `${f.passes} · ${f.cmp}`]; }), done: next }); }
      else if (r === 8) ask('Kapan tanda "sudah urut" paling menghemat?', [['Bila larik sudah atau hampir terurut, misalnya klasemen yang hanya berubah sedikit setelah satu pertandingan', true], ['Bila larik sangat acak'], ['Bila larik terbalik dari kecil ke besar'], ['Selalu menghemat sama banyak']], 1, el('p', { class: 'kg-catatan' }, 'Putaran terakhir yang tanpa pertukaran tetap harus dijalankan untuk memastikan larik sudah urut.'));
      else { const { res } = league(); rowsChoose(wrap, ctx, { prompt: 'Tantangan: klasemen enam tim smp-09 dengan tiga aturan', cls: 'kg-baris', rows: [['s', 'Baris 4: tukar bila …', ['poin lebih kecil, ATAU poin sama DAN sg lebih kecil, ATAU poin dan sg sama DAN gm lebih kecil', 'poin lebih kecil saja', 'poin, sg, dan gm semuanya lebih kecil', 'poin lebih kecil DAN sg lebih kecil'], 'poin lebih kecil, ATAU poin sama DAN sg lebih kecil, ATAU poin dan sg sama DAN gm lebih kecil'], ['t', 'Baris 5–7: yang ditukar', ['tim, poin, sg, dan gm sekaligus', 'poin saja', 'tim dan poin saja', 'poin, sg, dan gm tanpa tim'], 'tim, poin, sg, dan gm sekaligus', 'Nama tim harus pindah bersama datanya.'], ['h', 'Hasil', ['8A, 7A, 9A, 8B, 7B, 9B', '7A, 8A, 9A, 7B, 8B, 9B', '8B, 7B, 8A, 9A, 7A, 9B', '8A, 9A, 7A, 8B, 7B, 9B'], res.vars.tim.join(', ')]], done: next }); }
    }
    render();
  },
};

export const PRESETS = { acak: [3, 9, 6, 12, 4], hampir: [12, 9, 6, 3, 4], urut: [12, 9, 6, 4, 3], terbalik: [3, 4, 6, 9, 12], lain: [4, 9, 6, 12, 3] };
const PNAME = { acak: 'acak (lembar)', hampir: 'hampir urut', urut: 'sudah urut', terbalik: 'terbalik', lain: '[4, 9, 6, 12, 3]' };
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act kode-gelembung' });
  root.append(wrap);
  let ver = 'benar'; let data = 'acak'; let tr = null;
  const draw = () => {
    tr?.stop(); const lines = ver === 'tanda' ? flagged() : bubble(ver);
    tr = sortTracer(lines, PRESETS[data]);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Gelas dan kode'),
      el('div', { class: 'seg' }, [...Object.entries(BNAME), ['tanda', 'Dengan tanda sudah urut']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'seg' }, Object.entries(PNAME).map(([k, t]) => onTap(el('button', { class: `seg-btn ${data === k ? 'on' : ''}`, type: 'button' }, t), () => { data = k; draw(); }))), tr);
  };
  draw();
}

// Comparisons with/without the flag for three kinds of arrays of length n.
export function kinds(n) {
  const desc = Array.from({ length: n }, (_, k) => (n - k) * 3);
  const hampir = [...desc]; [hampir[n - 2], hampir[n - 1]] = [hampir[n - 1], hampir[n - 2]];
  let x = 7; const acak = n === 5 ? [3, 9, 6, 12, 4] : desc.map((v) => { x = (x * 5 + 3) % 97; return [x, v]; }).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const terbalik = [...desc].reverse();
  const full = (n * (n - 1)) / 2;
  return [['acak', acak], ['hampir urut', hampir], ['terbalik', terbalik]].map(([k, a]) => [k, a, full, flagCount(a).cmp]);
}
function createFlag(root, ctx) {
  const wrap = el('div', { class: 'act kode-gelembung' });
  root.append(wrap);
  let n = 5; let flag = true;
  const draw = () => {
    const rows = kinds(n); const max = rows[0][2];
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tanda sudah urut'),
      el('div', { class: 'kg-atur' }, stepper(n, (v) => { n = v; draw(); }, { min: 3, max: 32, label: 'banyak angka' }), onTap(el('button', { class: `seg-btn ${flag ? 'on' : ''}`, type: 'button' }, `${flag ? '☑' : '☐'} tanda sudah urut`), () => { flag = !flag; draw(); })),
      el('div', { class: 'kg-grafik' }, rows.map(([k, a, full, f]) => { const v = flag ? f : full; return el('div', { class: 'kg-batang-baris' }, el('span', null, k), el('div', { class: 'kg-batang' }, el('i', { style: { width: `${(v / max) * 100}%` } }), el('b', null, `${v} perbandingan`)), el('small', null, n <= 10 ? `[${arrText(a)}]` : `${n} angka`)); })),
      el('p', { class: 'kg-catatan' }, `Tanpa tanda: selalu ${max} perbandingan (n × (n − 1) / 2). Dengan tanda, program berhenti setelah satu putaran tanpa pertukaran.`));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kode-gelembung' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Tebak putaran selesai', pts, again: () => pickTeams(wrap, 'Tebak Putaran', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; const arr = [...[[3, 9, 6, 12, 4], [5, 1, 8, 2, 7], [10, 4, 11, 2, 6], [1, 2, 3, 4, 5]][k % 4]]; let pass = 1 + (k % 3);
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: atur larik awal dan nomor putaran, lalu Serahkan.`);
      const host = el('div', { class: 'kg-giliran' });
      const fill = () => host.replaceChildren(el('div', { class: 'kg-atur' }, arr.map((v, i) => stepper(v, (x) => { arr[i] = x; }, { min: 0, max: 20, label: `poin[${i + 1}]` }))), stepper(pass, (x) => { pass = x; }, { min: 1, max: 4, label: 'setelah putaran' }), button('Serahkan ke tim lawan', guess, 'primary'));
      fill();
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih larik, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const right = arrText(afterPass(arr, pass));
        const cand = [afterPass(arr, pass - 1), afterPass(arr, pass + 1), [...arr].sort((a, b) => b - a), [...arr].sort((a, b) => a - b), [...afterPass(arr, pass)].reverse(), arr.map((v, i, a) => a[(i + 1) % a.length])].map(arrText);
        const opts = ctx.rand.shuffle([...new Set([right, ...cand])].slice(0, 4));
        say(msg, '', `Tim ${guesser + 1}: isi larik setelah putaran ${pass}?`);
        host.replaceChildren(glasses(arr, {}), el('div', { class: 'opts', style: { '--cols': 2 } }, opts.map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, `[${o}]`)), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          const ok = o === right; if (ok) pts[guesser] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', `${ok ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} Setelah putaran ${pass}: [${right}].`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4800);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Putaran', start);
}
