// Simulasi Dadu — SMP (13–15 tahun), coding. Simulating two dice with a
// counter array: the 6 × 6 table of sums, tracing with a fixed "random"
// sequence, an 11-box array that fails on 12, Rudi's ACAK(2, 12) that gives a
// flat chart, seeds, and the 16-number generator x ← (5x + 3) MOD 16.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper, codeView } from './smp-kit.js';
import { runAll, fmt, PseudoError } from './pseudo.js';

export const DERET = [3, 5, 6, 6, 1, 2, 4, 3, 6, 1, 2, 5, 3, 3, 5, 4, 6, 4, 1, 1];
export const WAYS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]; // sums 2..12
export const sim = ({ n = 36, kotak = 12, andi = false, rudi = false } = {}) => [`pencacah ← larik ${kotak} kotak, semua berisi 0`, `UNTUK lempar DARI 1 SAMPAI ${n}`,
  ...(rudi ? ['    jumlah ← ACAK(2, 12)'] : ['    d1 ← ACAK(1, 6)', '    d2 ← ACAK(1, 6)', '    jumlah ← d1 + d2']),
  andi ? '    pencacah[jumlah − 1] ← pencacah[jumlah − 1] + 1' : '    pencacah[jumlah] ← pencacah[jumlah] + 1', 'UNTUK s DARI 2 SAMPAI 12', `    TAMPILKAN s, pencacah[${andi ? 's − 1' : 's'}]`];
// ACAK that takes the next number of a fixed sequence.
export const fromSeq = (seq) => { let k = 0; return { ACAK: (a, b) => { if (k >= seq.length) throw new PseudoError('Deret acak sudah habis.'); return seq[k++]; } }; };
export const runSeq = (lines, seq = DERET) => runAll(lines, { builtins: fromSeq(seq), limit: 20000 });
// The worksheet's tiny generator: x ← (5x + 3) MOD 16 from seed 7; die = x MOD 6 + 1.
export function lcg16(seed = 7, n = 16) { const out = []; let x = seed; for (let i = 0; i < n; i++) { x = (5 * x + 3) % 16; out.push(x); } return out; }
export const die = (x) => (x % 6) + 1;
// A good seeded generator for the big simulator (mulberry32).
export function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function throwMany(n, rnd, rudi = false) { const c = Array(13).fill(0); for (let i = 0; i < n; i++) { const s = rudi ? 2 + Math.floor(rnd() * 11) : 2 + Math.floor(rnd() * 6) + Math.floor(rnd() * 6); c[s]++; } return c; }
const FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Counter boxes 2..12 and a bar chart with the expected value per sum.
function counters(c, { hl = null } = {}) { return el('div', { class: 'sd-kotak-baris' }, Array.from({ length: 11 }, (_, k) => k + 2).map((s) => el('div', { class: `sd-kotak ${hl === s ? 'baru' : ''}` }, el('small', null, `[${s}]`), el('b', null, String(c[s] ?? 0))))); }
function bars(c, { rudi = false } = {}) {
  const total = c.reduce((a, b) => a + b, 0); const exp = (s) => (rudi ? total / 11 : (total * WAYS[s - 2]) / 36);
  const max = Math.max(1, ...c, ...Array.from({ length: 11 }, (_, k) => exp(k + 2)));
  return el('div', { class: 'sd-grafik', role: 'img', 'aria-label': 'Diagram batang banyak kemunculan setiap jumlah' }, Array.from({ length: 11 }, (_, k) => k + 2).map((s) => el('div', { class: 'sd-kolom' },
    el('div', { class: 'sd-wadah' }, el('i', { class: 'sd-batang', style: { height: `${((c[s] || 0) / max) * 100}%` } }), total ? el('span', { class: 'sd-harap', style: { bottom: `${(exp(s) / max) * 100}%` }, title: `harapan ${fmt(exp(s))}` }) : null),
    el('small', null, String(s)))), el('p', { class: 'sd-ket' }, total ? `${total} lemparan · garis jingga: banyak yang diharapkan menurut peluang ${rudi ? '(1/11 untuk setiap jumlah)' : '(1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 dari 36)'}` : 'Belum ada lemparan.'));
}
function grid() {
  return el('table', { class: 'sd-tabel' }, el('tr', null, el('th', null, '+'), [1, 2, 3, 4, 5, 6].map((b) => el('th', { class: 'biru' }, String(b)))), [1, 2, 3, 4, 5, 6].map((a) => el('tr', null, el('th', { class: 'merah' }, String(a)), [1, 2, 3, 4, 5, 6].map((b) => el('td', { class: a + b === 7 ? 'tujuh' : '' }, String(a + b))))));
}
function seqTracer(lines, seq, o = {}) {
  let used = 0; let lastSum = null;
  return tracer(lines, { opts: { builtins: { ACAK: (a, b) => { if (used >= seq.length) throw new PseudoError('Deret acak sudah habis: tambah angka atau kurangi lemparan.'); return seq[used++]; } }, limit: 3000 }, speed: 300, hideVars: ['pencacah'], ...o,
    onStep: (y, st) => { if (!y) { used = 0; lastSum = null; return; } if (/^jumlah ←/.test(y.note)) lastSum = st.vars.jumlah; },
    extra: (st) => el('div', { class: 'sd-ekstra' }, el('div', { class: 'sd-deret' }, el('small', null, 'Deret ACAK:'), seq.map((v, k) => el('span', { class: k < used ? 'pakai' : k === used ? 'berikut' : '' }, String(v)))),
      st.vars.pencacah ? el('div', { class: 'sd-kotak-baris' }, st.vars.pencacah.map((v, k) => el('div', { class: `sd-kotak ${k + 1 === lastSum || (lines.some((l) => l.includes('jumlah − 1')) && k + 2 === lastSum) ? 'baru' : ''}` }, el('small', null, `[${k + 1}]`), el('b', null, String(v))))) : null) });
}

export default {
  id: 'smp-37-simulasi-dadu',
  title: 'Simulasi Dadu',
  topic: 'Simulasi dengan bilangan acak: dua dadu, larik pencacah, peluang, deret acak tetap untuk menguji, ukuran larik, dan benih',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🎲',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Hitung peluang jumlah dua dadu, telusuri program simulasi dengan deret acak tetap, temukan bug ukuran larik, dan bandingkan simulasi yang mirip dadu dengan yang tidak.',
  extraModes: [
    { id: 'simulasi', icon: '🎲', label: 'Simulator Dadu', desc: 'Lempar dua dadu 1, 36, 360, atau 3.600 kali; diagram batang tumbuh dengan garis peluang sebagai pembanding. Coba benih, deret sendiri, dan program Rudi', create: createSim },
    { id: 'jejak', icon: '🔢', label: 'Deret Tetap', desc: 'Program berjalan langkah demi langkah dengan deret acak tetap yang bisa diketik sendiri; coba juga larik 11 kotak milik Andi', create: createTrace },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Terbanyak', desc: 'Sebelum 36 lemparan, setiap tim menebak jumlah yang paling sering muncul dan banyaknya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act simulasi-dadu' });
    root.append(wrap);
    const ten = runSeq(sim({ n: 10 })); const cnt = ten.vars.pencacah;
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const way = (s) => String(WAYS[s - 2]);
      const throws = []; for (let i = 0; i < 10; i++) throws.push([DERET[2 * i], DERET[2 * i + 1], DERET[2 * i] + DERET[2 * i + 1]]);
      const tri = (t) => `${t[0]} · ${t[1]} · ${t[2]}`;
      if (r === 0) { wrap.append(grid()); rowsChoose(wrap, ctx, { prompt: 'Jumlah mata dadu merah (baris) dan biru (kolom)', rows: [['p', 'Banyak pasangan yang mungkin', ['12', '36', '11', '21'], '36'], ['c', 'Banyak cara jumlah 7', ['6', '1', '7', '5'], way(7), '1+6, 2+5, 3+4, 4+3, 5+2, 6+1.'], ['l', 'Peluang jumlah 7', ['6/36', '1/11', '7/36', '1/36'], '6/36', '6/36 = 1/6.']], done: next }); }
      else if (r === 1) { wrap.append(grid()); rowsChoose(wrap, ctx, { prompt: 'Banyak cara untuk setiap jumlah (1)', rows: [2, 3, 4, 5, 6].map((s) => [`s${s}`, `Jumlah ${s}`, ['1', '2', '3', '4', '5', '6'], way(s)]), done: next }); }
      else if (r === 2) { wrap.append(grid()); rowsChoose(wrap, ctx, { prompt: 'Banyak cara untuk setiap jumlah (2)', rows: [...[8, 9, 10, 11, 12].map((s) => [`s${s}`, `Jumlah ${s}`, ['1', '2', '3', '4', '5', '6'], way(s)]), ['360', 'Dilempar 360 kali, jumlah 7 kira-kira muncul', ['60 kali', '36 kali', '7 kali', '33 kali'], `${(360 * 6) / 36} kali`, '360 × 6/36 = 60.']], done: next }); }
      else if (r === 3) { const tr = seqTracer(sim({ n: 10 }), DERET, { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Isi tabel lemparan: d1 · d2 · jumlah', rows: [1, 4, 5, 8].map((i) => [`l${i}`, `Lemparan ${i + 1}`, [...new Set([tri(throws[i]), tri([throws[i][1], throws[i][0], throws[i][2]]), tri(throws[(i + 1) % 10]), tri(throws[(i + 9) % 10])])].sort(), tri(throws[i])]), done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan program untuk 10 lemparan dengan deret acak tetap'), tr); }
      else if (r === 4) { wrap.append(codeView(sim({ n: 10 }))); rowsChoose(wrap, ctx, { prompt: 'Isi larik pencacah setelah 10 lemparan', rows: [['7', 'pencacah[7]', ['3', '2', '1', '0'], String(cnt[6])], ['4', 'pencacah[4]', ['0', '1', '3'], String(cnt[3])], ['12', 'pencacah[12]', ['0', '1', '2'], String(cnt[11])], ['t', 'Jumlah semua isi pencacah', ['10', '20', '11', '36'], String(cnt.reduce((a, b) => a + b, 0)), 'Sama dengan banyak lemparan.']], done: next }); }
      else if (r === 5) { const tr = seqTracer(sim({ n: 10, kotak: 11 }), DERET, { onEnd: () => setTimeout(then(() => ask('Andi membuat larik 11 kotak. Apa yang terjadi pada lemparan ke-2?', [['Jumlahnya 12, sehingga program mencoba menambah pencacah[12] padahal kotaknya hanya sampai 11: galat indeks di luar batas larik', true], ['Jumlah 12 dicatat di kotak 11'], ['Lemparan ke-2 dilewati'], ['Program berjalan biasa karena 12 adalah jumlah terbesar']], 1, null,
        then(() => ask('Bagaimana memperbaiki baris 6 tanpa menambah ukuran larik?', [['pencacah[jumlah − 1] ← pencacah[jumlah − 1] + 1, dan baris 8 menjadi TAMPILKAN s, pencacah[s − 1]', true], ['pencacah[jumlah + 1] ← pencacah[jumlah + 1] + 1'], ['UNTUK lempar DARI 1 SAMPAI 11'], ['jumlah ← d1 + d2 − 2 tanpa mengubah baris lain']], 1, codeView(sim({ n: 10, kotak: 11, andi: true }), { hl: [5, 7] }))))), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Andi: pencacah ← larik 11 kotak'), tr); }
      else if (r === 6) { const c = throwMany(360, seeded(37), true); wrap.append(bars(c, { rudi: true })); rowsChoose(wrap, ctx, { prompt: 'Rudi menulis jumlah ← ACAK(2, 12)', rows: [['7', 'Peluang jumlah 7', ['1/11', '6/36', '1/6', '7/11'], '1/11'], ['2', 'Peluang jumlah 2', ['1/11', '1/36', '2/36', '0'], '1/11'], ['36', 'Dalam 36 lemparan, setiap jumlah kira-kira', ['3 kali', '6 kali', '1 kali', '11 kali'], '3 kali', '36 / 11 ≈ 3,3. Diagramnya rata, bukan bukit dengan puncak di 7.']], done: next }); }
      else if (r === 7) ask('Mengapa program Rudi tidak bisa dipakai panitia?', [['Jumlah 2 dan 12 menjadi terlalu sering dan 7 terlalu jarang; dua dadu menghasilkan 36 pasangan yang sama mungkin, tetapi jumlah-jumlahnya tidak sama mungkin', true], ['Karena ACAK(2, 12) bisa menghasilkan 13'], ['Karena programnya terlalu pendek'], ['Karena hasilnya selalu sama']], 1, el('div', { class: 'sd-dua' }, bars(throwMany(3600, seeded(7))), bars(throwMany(3600, seeded(7), true), { rudi: true })));
      else if (r === 8) { const a = throwMany(36, seeded(11)); const b = throwMany(3600, seeded(11)); ask('Hasil 36 lemparan berbeda-beda, tetapi 3.600 lemparan makin mirip pola 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1. Lalu, mengapa benih yang sama berguna bagi pemrogram yang mencari bug?', [['Benih yang sama selalu menghasilkan deret yang sama, sehingga bug yang muncul pada deret tertentu bisa diulang persis, diselidiki, dan dipastikan sudah diperbaiki', true], ['Supaya hasil simulasi selalu adil'], ['Supaya komputer tidak perlu membuat bilangan acak'], ['Supaya setiap kelompok mendapat hasil yang berbeda']], 1, el('div', { class: 'sd-dua' }, bars(a), bars(b))); }
      else { const x = lcg16(); rowsChoose(wrap, ctx, { prompt: 'Tantangan: x ← (5 × x + 3) MOD 16, benih x = 7', cls: 'sd-lcg', rows: [['d', '16 bilangan pertama', [x.join(', '), lcg16(7, 17).slice(1).join(', '), [...x].sort((p, q) => p - q).join(', '), lcg16(3).join(', ')], x.join(', ')], ['u', 'Setelah bilangan ke-16', ['deretnya berulang: bilangan ke-16 adalah 7, sama dengan benih', 'deretnya berhenti', 'muncul bilangan 16', 'deretnya makin besar'], 'deretnya berulang: bilangan ke-16 adalah 7, sama dengan benih'], ['m', 'Mata dadu x MOD 6 + 1 untuk 8 bilangan pertama', [x.slice(0, 8).map(die).join(', '), x.slice(0, 8).map((v) => v % 6).join(', '), x.slice(1, 9).map(die).join(', ')], x.slice(0, 8).map(die).join(', ')], ['a', 'Apakah dadu buatan ini adil?', ['tidak: mata 1–4 muncul 3 kali, mata 5 dan 6 hanya 2 kali dari 16', 'ya: setiap mata muncul sama sering', 'tidak: mata 6 tidak pernah muncul'], 'tidak: mata 1–4 muncul 3 kali, mata 5 dan 6 hanya 2 kali dari 16']], done: next }); }
    }
    render();
  },
};

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act simulasi-dadu' });
  root.append(wrap);
  let rudi = false; let src = 'acak'; let seed = 7; let seqText = DERET.join(', '); let c = Array(13).fill(0); let rnd = seeded(Date.now() % 100000); let seqPos = 0; let last = null; let timer = null; let msg = '';
  const seqNums = () => seqText.split(/[,\s]+/).map(Number).filter((v) => Number.isInteger(v) && v >= 1 && v <= 6);
  const reset = () => { stop(); c = Array(13).fill(0); last = null; seqPos = 0; msg = ''; rnd = src === 'benih' ? seeded(seed) : seeded((Date.now() % 100000) + 1); draw(); };
  const roll6 = () => { if (src === 'deret') { const s = seqNums(); if (seqPos >= s.length) return null; return s[seqPos++]; } return 1 + Math.floor(rnd() * 6); };
  const one = () => { if (rudi) { if (src === 'deret') { msg = 'Program Rudi tidak memakai deret dadu.'; return false; } const s = 2 + Math.floor(rnd() * 11); c[s]++; last = [null, null, s]; return true; } const a = roll6(); const b = a == null ? null : roll6(); if (a == null || b == null) { msg = 'Deret habis. Tambah angka atau tekan Ulang.'; return false; } c[a + b]++; last = [a, b, a + b]; return true; };
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  const many = (n) => { stop(); if (n <= 36) { let k = 0; timer = setInterval(() => { if (k++ >= n || !one()) { stop(); } draw(); }, n === 1 ? 10 : 70); } else { for (let i = 0; i < n; i++) if (!one()) break; draw(); } };
  const seedInput = () => { const i = el('input', { type: 'number', min: '1', max: '99999', value: String(seed), 'aria-label': 'benih' }); i.addEventListener('change', () => { seed = Math.max(1, Math.round(Number(i.value)) || 1); reset(); }); return el('label', { class: 'sd-input' }, el('small', null, 'benih'), i); };
  const seqInput = () => { const i = el('input', { type: 'text', value: seqText, 'aria-label': 'deret angka 1 sampai 6', maxlength: '200' }); i.addEventListener('change', () => { seqText = i.value; reset(); }); return el('label', { class: 'sd-input lebar' }, el('small', null, 'deret angka 1–6'), i); };
  function draw() {
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Simulator dadu'),
      el('div', { class: 'sd-atur' }, el('div', { class: 'seg' }, [['acak', 'acak'], ['benih', 'dengan benih'], ['deret', 'deret sendiri']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${src === k ? 'on' : ''}`, type: 'button' }, t), () => { src = k; reset(); }))),
        src === 'benih' ? seedInput() : null, src === 'deret' ? seqInput() : null,
        onTap(el('button', { class: `seg-btn ${rudi ? 'on' : ''}`, type: 'button' }, `${rudi ? '☑' : '☐'} program Rudi: ACAK(2, 12)`), () => { rudi = !rudi; reset(); })),
      el('div', { class: 'sd-atur' }, [1, 36, 360, 3600].map((n) => button(`Lempar ${n === 3600 ? '3.600' : n}×`, () => many(n), n === 36 ? 'primary' : '')), button('↺ Ulang', reset)),
      el('div', { class: 'sd-dadu' }, last && last[0] ? [el('span', { class: 'merah' }, FACE[last[0]]), el('span', { class: 'biru' }, FACE[last[1]])] : null, last ? el('b', null, `jumlah ${last[2]}`) : el('small', null, 'Tekan Lempar.')),
      msg ? el('p', { class: 'sk-galat batas' }, msg) : null, counters(c, { hl: last?.[2] }), bars(c, { rudi })].filter(Boolean));
  }
  draw();
}

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act simulasi-dadu' });
  root.append(wrap);
  let n = 10; let andi = 'benar'; let seqText = DERET.join(', '); let tr = null;
  const draw = () => {
    tr?.stop(); const seq = seqText.split(/[,\s]+/).map(Number).filter((v) => Number.isInteger(v) && v >= 1 && v <= 6);
    const lines = andi === 'benar' ? sim({ n }) : andi === 'andi' ? sim({ n, kotak: 11 }) : sim({ n, kotak: 11, andi: true });
    tr = seqTracer(lines, seq);
    const inp = el('input', { type: 'text', value: seqText, 'aria-label': 'deret angka 1 sampai 6', maxlength: '200' }); inp.addEventListener('change', () => { seqText = inp.value; draw(); });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Deret acak tetap'),
      el('div', { class: 'sd-atur' }, el('label', { class: 'sd-input lebar' }, el('small', null, 'deret ACAK (angka 1–6)'), inp), stepper(n, (v) => { n = v; draw(); }, { min: 1, max: 20, label: 'lemparan' }),
        el('div', { class: 'seg' }, [['benar', 'larik 12 kotak'], ['andi', 'Andi: larik 11 kotak'], ['geser', '11 kotak, indeks digeser']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${andi === k ? 'on' : ''}`, type: 'button' }, t), () => { andi = k; draw(); })))), tr);
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act simulasi-dadu' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let round = 0; const total = 4;
    function turn() {
      if (round >= total) { finishBoard(wrap, ctx, { title: 'Tebak terbanyak selesai', pts, again: () => pickTeams(wrap, 'Tebak Terbanyak', start) }); return; }
      const guesses = Array.from({ length: nT }, () => [7, 6]);
      const msg = el('p', { class: 'reveal info' }, 'Setiap tim menebak jumlah yang paling sering muncul dan banyaknya dalam 36 lemparan.');
      wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, `Putaran ${round + 1}: tebak sebelum 36 lemparan`),
        el('div', { class: 'sd-tebak' }, guesses.map((g, t) => el('div', { class: 'sd-tim' }, el('b', null, `Tim ${t + 1}`), stepper(g[0], (v) => { g[0] = v; }, { min: 2, max: 12, label: 'jumlah' }), stepper(g[1], (v) => { g[1] = v; }, { min: 0, max: 36, label: 'banyaknya' })))),
        button('🎲 Lempar 36 kali', play, 'primary'), msg);
      function play() {
        const c = Array(13).fill(0); const rnd = seeded((Date.now() % 100000) + round); let k = 0;
        const stage = el('div'); wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, `Putaran ${round + 1}: 36 lemparan`), stage, msg);
        const timer = setInterval(() => {
          const s = 2 + Math.floor(rnd() * 6) + Math.floor(rnd() * 6); c[s]++; k++; ctx.sound.tap();
          stage.replaceChildren(counters(c, { hl: s }), bars(c));
          if (k >= 36) {
            clearInterval(timer); const top = Math.max(...c); const best = c.map((v, s2) => (v === top && s2 >= 2 ? s2 : null)).filter((x) => x != null);
            const dist = guesses.map((g) => Math.abs(g[1] - top)); const minD = Math.min(...dist); const res = [];
            guesses.forEach((g, t) => { let p = 0; if (best.includes(g[0])) p += 2; if (dist[t] === minD) p += 1; pts[t] += p; res.push(`Tim ${t + 1} +${p}`); });
            ctx.sound.good(); say(msg, '', `Terbanyak: jumlah ${best.join(' dan ')} (${top} kali). ${res.join(', ')}.`);
            wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); round++; setTimeout(turn, 5600);
          }
        }, 80);
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Terbanyak', start);
}
