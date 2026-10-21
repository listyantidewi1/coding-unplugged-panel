// Koreksi Ujian Gotong Royong — SMP (13–15 tahun), bagi-dan-taklukkan.
// Merge two sorted piles by always taking the smaller top sheet (one
// comparison each; leftovers move free). Merge sort 16 exam sheets stage by
// stage, compare with bubble sort, and see how many workers save time.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const SHEETS = [11, 3, 14, 7, 1, 16, 9, 5, 12, 2, 8, 15, 6, 13, 4, 10];
export function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  let comps = 0;
  while (i < a.length && j < b.length) { comps++; out.push(a[i] < b[j] ? a[i++] : b[j++]); }
  return { result: [...out, ...a.slice(i), ...b.slice(j)], comps };
}
// Bottom-up stages: each stage merges neighbouring piles.
export function stages(sheets) {
  let piles = sheets.map((x) => [x]);
  const out = [{ piles, comps: [] }];
  while (piles.length > 1) {
    const next = [];
    const comps = [];
    for (let k = 0; k < piles.length; k += 2) { const m = merge(piles[k], piles[k + 1]); next.push(m.result); comps.push(m.comps); }
    piles = next;
    out.push({ piles, comps });
  }
  return out;
}
// Time of a stage with w workers: merges dealt round-robin, the slowest worker counts.
export const stageTime = (comps, w) => Math.max(...Array.from({ length: Math.min(w, comps.length) }, (_, k) => comps.filter((_, i) => i % w === k).reduce((a, b) => a + b, 0)));
const bubbleCount = (n) => (n * (n - 1)) / 2;

export default {
  id: 'smp-11-gotong-royong',
  title: 'Koreksi Ujian Gotong Royong',
  topic: 'Bagi-dan-taklukkan: pengurutan gabung dan kerja paralel',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '📚',
  source: { name: 'CS Unplugged: Sorting Algorithms', url: 'https://www.csunplugged.org/en/topics/sorting-algorithms/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menggabungkan dua tumpukan urut sambil menghitung perbandingan, menjalankan pengurutan gabung tahap demi tahap, membandingkannya dengan pengurutan gelembung, dan menghitung waktu bila dikerjakan bersama.',
  extraModes: [
    { id: 'penggabung', icon: '🔀', label: 'Penggabung', desc: 'Dua tumpukan urut acak; ketuk tumpukan dengan lembar teratas yang lebih kecil', create: createMerger },
    { id: 'pohon', icon: '🌳', label: 'Pohon Bagi-dan-Taklukkan', desc: '16 kartu acak digabung tahap demi tahap; bandingkan dengan pengurutan gelembung', create: createTree },
    { id: 'gotong', icon: '⏱️', label: 'Gotong Royong', desc: 'Berapa detik setiap tahap dengan 1, 2, 4, atau 8 pekerja?', create: createWorkers },
    { id: 'tim', icon: '🤝', label: 'Gabung Bergiliran', desc: 'Tim bergantian mengerjakan satu penggabungan; kesalahan menambah waktu', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gotong' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      const st = stages(SHEETS);
      if (r === 0) mergeRound(wrap, ctx, { a: [2, 5, 9, 14], b: [3, 7, 8, 16], done: next });
      else if (r === 1) mergeRound(wrap, ctx, { a: [1, 2, 3, 4], b: [5, 6, 7, 8], done: next });
      else if (r === 2) ask('Menggabungkan dua tumpukan berisi 4 lembar butuh paling sedikit … dan paling banyak … perbandingan.', [['4 dan 7', true], ['4 dan 8'], ['1 dan 7'], ['8 dan 16']], 2);
      else if (r === 3) treeRound(wrap, ctx, { sheets: SHEETS, from: 0, to: 2, done: next });
      else if (r === 4) treeRound(wrap, ctx, { sheets: SHEETS, from: 2, to: 4, done: next });
      else if (r === 5) ask('Pengurutan gabung tadi butuh 49 perbandingan. Pengurutan gelembung untuk 16 lembar butuh …', [['15 + 14 + … + 1 = 120', true], ['16 × 16 = 256'], ['16 + 15 = 31'], ['49, sama saja']], 2, treeView(st, 4));
      else if (r === 6) ask('Delapan murid bekerja bersamaan, 1 detik per perbandingan. Tahap 1–4 butuh 1, 3, 7, 15 detik. Total waktunya?', [['26 detik (sendirian 49, gelembung 120)', true], ['49 detik'], ['8 detik'], ['6 detik']], 2, workersView(st, 8));
      else if (r === 7) ask('Tahap mana yang tidak bisa dipercepat dengan menambah orang?', [['Tahap 4: penggabungan terakhir harus dikerjakan satu orang yang melihat kedua tumpukan', true], ['Tahap 1: terlalu banyak tumpukan'], ['Tahap 2: tumpukannya berisi 2'], ['Semua tahap bisa dipercepat']]);
      else if (r === 8) ask('16 lembar bisa dibagi dua 4 kali sampai tinggal 1 lembar. 1.024 lembar bisa dibagi dua … kali, jadi kerjanya kira-kira n × banyak tahap.', [[10, true], [512], [32], [1024]], 4);
      else ask('Lengkapi resepnya: "Untuk mengurutkan satu tumpukan: jika isinya 1 lembar, … . Jika lebih, bagi dua, … , lalu … ."', [['selesai; urutkan setiap bagian dengan resep yang sama; gabungkan keduanya', true], ['buang; urutkan dengan gelembung; tumpuk saja'], ['bagi lagi; gabungkan; urutkan dengan gelembung'], ['selesai; tukar kedua bagian; hitung lembarnya']]);
    }
    render();
  },
};

const pile = (cards, cls = '') => el('div', { class: `tumpuk ${cls}` }, cards.map((x) => el('span', null, x)));

// Merge two sorted piles: tap the pile whose top sheet is smaller.
function merger(holder, ctx, { a, b, onDone, onWrong, prompt }) {
  const A = [...a];
  const B = [...b];
  const out = [];
  let comps = 0;
  let finished = false;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tumpukan yang lembar teratasnya lebih kecil.');
  const box = el('div', { class: 'gabung' });
  function flush() {
    if (A.length && B.length) return;
    out.push(...A.splice(0), ...B.splice(0));
    finished = true;
  }
  function draw() {
    box.replaceChildren(el('div', { class: 'gabung-asal' },
      ...[[A, 0], [B, 1]].map(([P, s]) => onTap(el('button', { class: 'gabung-tumpuk', type: 'button', 'data-s': s, disabled: finished || !P.length }, P.length ? P.map((x, i) => el('span', { class: i === 0 ? 'atas' : '' }, x)) : el('em', null, 'habis')), () => take(s)))),
      el('div', { class: 'gabung-hasil' }, el('small', null, 'Tumpukan baru'), pile(out, 'hasil')), el('p', { class: 'gabung-hitung' }, `${comps} perbandingan`));
  }
  function take(s) {
    if (finished) return;
    const right = A[0] < B[0] ? 0 : 1;
    if (s !== right) { msg.className = 'reveal bad'; msg.textContent = `${A[0]} atau ${B[0]}: ambil yang lebih kecil.`; shake(box); onWrong?.(); return; }
    comps++;
    out.push((s ? B : A).shift());
    ctx.sound.tap();
    flush();
    draw();
    if (finished) { msg.className = 'reveal'; msg.textContent = `Selesai: ${out.join(' ')} · ${comps} perbandingan${A.length + B.length === 0 && comps < a.length + b.length - 1 ? '; sisa tumpukan dipindah tanpa perbandingan' : ''}.`; onDone({ result: out, comps }); return; }
    msg.className = 'reveal info';
    msg.textContent = `Perbandingan ke-${comps}: ambil ${out.at(-1)}.`;
  }
  draw();
  holder.append(...[prompt ? el('p', { class: 'prompt' }, prompt) : null, box, msg].filter(Boolean));
}

function mergeRound(wrap, ctx, { a, b, done }) {
  merger(wrap, ctx, { a, b, prompt: `Gabungkan ${a.join(' ')} dan ${b.join(' ')}.`, onWrong: () => ctx.mistake(), onDone: () => done() });
}

function treeView(st, upto, current = null) {
  return el('div', { class: 'pohon' }, st.slice(0, upto + 1).map((s, k) => el('div', { class: 'pohon-tahap' }, el('small', null, `Tahap ${k}${k ? ` · ${s.comps.reduce((x, y) => x + y, 0)} perbandingan` : ''}`),
    el('div', { class: 'pohon-baris' }, s.piles.map((p, i) => pile(p, current && current[0] === k && (i === current[1] || i === current[1] + 1) ? 'aktif' : ''))))));
}

// Merge sort stage by stage: every merge from stage `from` to `to`.
function treeRound(wrap, ctx, { sheets, from, to, done, onWrong, onMerge }) {
  const st = stages(sheets);
  const area = el('div');
  const tree = el('div');
  let stage = from;
  let k = 0;
  let total = 0;
  const built = st.map((s, i) => (i <= from ? s : { piles: [], comps: [] }));
  function step() {
    if (stage >= to) {
      tree.replaceChildren(treeView(built, to));
      area.replaceChildren(el('p', { class: 'reveal' }, `Tahap ${from + 1}–${to} selesai: ${total} perbandingan.${to === st.length - 1 ? ` Total pengurutan gabung ${st.slice(1).flatMap((s) => s.comps).reduce((x, y) => x + y, 0)}; gelembung ${bubbleCount(sheets.length)}.` : ''}`));
      done();
      return;
    }
    const src = built[stage].piles;
    tree.replaceChildren(treeView(built, stage, [stage, k]));
    area.replaceChildren();
    merger(area, ctx, {
      a: src[k], b: src[k + 1], onWrong: onWrong || (() => ctx.mistake()),
      onDone({ result, comps }) {
        built[stage + 1].piles.push(result);
        built[stage + 1].comps.push(comps);
        total += comps;
        k += 2;
        onMerge?.();
        if (k >= src.length) { stage++; k = 0; }
        setTimeout(step, 500);
      },
    });
  }
  wrap.append(el('p', { class: 'prompt' }, `Pengurutan gabung, tahap ${from + 1} sampai ${to}.`), tree, area);
  step();
}

function workersView(st, w) {
  const times = st.slice(1).map((s) => stageTime(s.comps, w));
  const max = Math.max(...st.slice(1).map((s) => stageTime(s.comps, 1)));
  return el('div', { class: 'pekerja' }, ...times.map((t, k) => el('div', { class: 'pekerja-baris' }, el('small', null, `Tahap ${k + 1}`), el('div', { class: 'pekerja-batang', style: `--w:${(100 * t) / max}%` }), el('b', null, `${t} detik`))),
    el('p', { class: 'pekerja-total' }, `${w} pekerja: ${times.reduce((a, b) => a + b, 0)} detik`));
}

function createMerger(root, ctx) {
  const wrap = el('div', { class: 'act gotong' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go() {
    const n = rand.int(3, 6);
    const all = rand.shuffle(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, 2 * n);
    const a = all.slice(0, n).sort((x, y) => x - y);
    const b = all.slice(n).sort((x, y) => x - y);
    wrap.replaceChildren();
    merger(wrap, ctx, { a, b, prompt: `Gabungkan dua tumpukan berisi ${n}.`, onDone() { ctx.sound.win(); wrap.append(button('Tumpukan lain ➜', go, 'primary')); } });
  }
  go();
}

function createTree(root, ctx) {
  const wrap = el('div', { class: 'act gotong' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go(sheets) {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('Data soal', () => go(SHEETS), 'small'), button('16 kartu acak', () => go(rand.shuffle(Array.from({ length: 16 }, (_, i) => i + 1))), 'small')));
    treeRound(wrap, ctx, { sheets, from: 0, to: 4, onWrong() {}, done() { ctx.sound.win(); } });
  }
  go(SHEETS);
}

function createWorkers(root, ctx) {
  const wrap = el('div', { class: 'act gotong' });
  root.append(wrap);
  const st = stages(SHEETS);
  let w = 1;
  function draw() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Gotong royong: 1 detik setiap perbandingan.'),
      el('div', { class: 'kode-baris' }, ...[1, 2, 4, 8].map((v) => button(`${v} pekerja`, () => { w = v; draw(); }, w === v ? 'primary small' : 'small'))),
      workersView(st, w),
      el('p', { class: 'reveal info' }, `Sendirian: pengurutan gabung 49 detik, gelembung 120 detik. Tahap 4 tetap 15 detik berapa pun pekerjanya.`));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act gotong' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const penalty = [0, 0];
  let turn = 0;
  const board = el('p', { class: 'reveal info' });
  const paint = () => { board.textContent = `Giliran Tim ${turn + 1} · Tambahan waktu karena salah: Tim 1 ${penalty[0]} · Tim 2 ${penalty[1]}`; };
  function go() {
    wrap.replaceChildren(board);
    paint();
    const sheets = rand.shuffle(Array.from({ length: 16 }, (_, i) => i + 1));
    const holder = el('div');
    wrap.append(holder);
    treeRound(holder, ctx, {
      sheets, from: 0, to: 4,
      onWrong() { penalty[turn] += 5; paint(); },
      onMerge() { turn = 1 - turn; paint(); },
      done() { ctx.sound.win(); board.textContent = `Selesai! Tambahan waktu: Tim 1 ${penalty[0]} detik · Tim 2 ${penalty[1]} detik. ${penalty[0] === penalty[1] ? 'Seri!' : `Tim ${penalty[0] < penalty[1] ? 1 : 2} lebih teliti!`}`; wrap.append(button('Main lagi ➜', go, 'primary')); },
    });
  }
  go();
}
