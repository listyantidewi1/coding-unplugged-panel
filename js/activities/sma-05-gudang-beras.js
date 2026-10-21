// Quicksort di Gudang Beras — SMA/SMK (16–18 tahun), algoritma pengurutan.
// Quicksort on rice sacks: first-element pivot, median of three, worst case on
// sorted data, the best-case recurrence T(n) and the log2(n!) lower bound.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const KARUNG = [33, 68, 47, 63, 26, 51, 42, 56, 21, 38];
export const URUT = [...KARUNG].sort((a, b) => a - b);

// Stable partition around the item at index p of the group.
export function partition(group, p) {
  const pv = group[p];
  const rest = group.filter((_, i) => i !== p);
  return { pivot: pv, left: rest.filter((x) => x < pv), right: rest.filter((x) => x > pv), cmp: group.length - 1 };
}
export function median3Index(g) {
  if (g.length < 3) return 0;
  const idx = [0, Math.floor((g.length - 1) / 2), g.length - 1];
  return [...idx].sort((a, b) => g[a] - g[b])[1];
}
export const pickFirst = () => 0;
// Run quicksort; returns rows and total comparisons.
export function quicksort(arr, pick = pickFirst) {
  const rows = [];
  const go = (g) => {
    if (g.length < 2) return g;
    const r = partition(g, pick(g));
    rows.push({ group: g, ...r });
    return [...go(r.left), r.pivot, ...go(r.right)];
  };
  const sorted = go(arr);
  return { sorted, rows, total: rows.reduce((t, r) => t + r.cmp, 0) };
}
const memo = [0, 0];
export function best(n) { if (memo[n] != null) return memo[n]; const l = Math.floor((n - 1) / 2); memo[n] = n - 1 + best(l) + best(n - 1 - l); return memo[n]; }
export const lowerBound = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return Math.ceil(s - 1e-9); };
export const worst = (n) => (n * (n - 1)) / 2;

// Board: rows of sacks; groups are processed left first. rule: 'bebas' | 'pertama' | 'tengah3'.
function board(host, ctx, { arr, rule = 'bebas', onDone, onRound, speed = 170 }) {
  let items = arr.map((w) => ({ w, fixed: false }));
  let stack = [[0, items.length]];
  let total = 0;
  let busy = false;
  let cmpI = -1;
  let pivotI = -1;
  const row = el('div', { class: 'gb-baris' });
  const info = el('p', { class: 'reveal info' });
  const max = Math.max(...arr);
  const b = { get total() { return total; }, enabled: true, auto: null };
  const cur = () => { while (stack.length) { const [lo, hi] = stack.at(-1); if (hi - lo < 2) { for (let i = lo; i < hi; i++) items[i].fixed = true; stack.pop(); } else return [lo, hi]; } return null; };
  function draw() {
    const g = cur();
    row.replaceChildren(...items.map((it, i) => {
      const inG = g && i >= g[0] && i < g[1];
      const cls = ['gb-karung', it.fixed ? 'tetap' : '', inG ? 'kelompok' : '', i === pivotI ? 'pivot' : '', i === cmpI ? 'banding' : '', it.side ? `ke-${it.side}` : ''].join(' ');
      return onTap(el('button', { class: cls, type: 'button', style: { '--h': `${30 + (it.w / max) * 70}%` }, 'data-i': i }, el('span', null, it.w)), () => tap(i));
    }));
    info.textContent = g ? `Kelompok: ${items.slice(g[0], g[1]).map((x) => x.w).join(', ')} · perbandingan: ${total}` : `Urut! Total ${total} perbandingan.`;
  }
  function tap(i) {
    const g = cur();
    if (!g || busy || !b.enabled || i < g[0] || i >= g[1]) return;
    const group = items.slice(g[0], g[1]).map((x) => x.w);
    const want = rule === 'pertama' ? 0 : rule === 'tengah3' ? median3Index(group) : null;
    if (want !== null && i - g[0] !== want) {
      ctx.mistake();
      shake(row);
      say(info, 'bad', rule === 'pertama' ? `Aturannya: pivot adalah karung pertama di kelompok (${group[0]}).` : group.length < 3 ? `Kelompok 2 karung memakai karung pertama (${group[0]}).` : `Lihat pertama, tengah, dan terakhir: ${[0, Math.floor((group.length - 1) / 2), group.length - 1].map((k) => group[k]).join(', ')}. Yang beratnya di tengah: ${group[want]}.`);
      return;
    }
    run(g, i - g[0]);
  }
  function run([lo, hi], p) {
    busy = true;
    const group = items.slice(lo, hi).map((x) => x.w);
    const r = partition(group, p);
    pivotI = lo + p;
    const others = group.map((w, k) => [w, k]).filter(([, k]) => k !== p);
    let k = 0;
    const step = () => {
      if (!host.isConnected) return;
      if (k < others.length) {
        const [w, idx] = others[k];
        cmpI = lo + idx;
        items[lo + idx].side = w < r.pivot ? 'kiri' : 'kanan';
        total++;
        ctx.sound.tap();
        draw();
        info.textContent = `${w} dibanding pivot ${r.pivot}: ${w < r.pivot ? 'lebih ringan → kiri' : 'lebih berat → kanan'} · perbandingan: ${total}`;
        k++;
        setTimeout(step, speed);
        return;
      }
      const next = [...r.left, r.pivot, ...r.right].map((w) => ({ w, fixed: false }));
      items.splice(lo, hi - lo, ...next);
      items[lo + r.left.length].fixed = true;
      items.forEach((x) => { delete x.side; });
      stack.pop();
      const mid = lo + r.left.length;
      stack.push([mid + 1, hi], [lo, mid]);
      cmpI = -1;
      pivotI = -1;
      busy = false;
      if (onRound) onRound({ group, ...r });
      draw();
      if (!cur()) { if (onDone) onDone(total); } else if (b.auto) setTimeout(autoStep, speed * 2);
    };
    step();
  }
  function autoStep() { const g = cur(); if (!g || !host.isConnected) return; const group = items.slice(g[0], g[1]).map((x) => x.w); run(g, b.auto === 'tengah3' ? median3Index(group) : 0); }
  b.start = (mode) => { b.auto = mode; if (!busy) autoStep(); };
  host.append(row, info);
  draw();
  return b;
}

function sortRound(wrap, ctx, { arr, rule, prompt, hint, done, target }) {
  const host = el('div', { class: 'gb-papan' });
  const msg = el('p', { class: 'reveal hint' }, hint);
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
  const go = () => {
    host.replaceChildren();
    board(host, ctx, {
      arr,
      rule,
      onDone(total) {
        if (target != null && total > target) { ctx.mistake(); say(msg, 'bad', `${total} perbandingan, masih lebih dari ${target}. Coba lagi: pilih pivot yang membagi kelompok hampir sama besar.`); setTimeout(go, 2200); return; }
        say(msg, '', `Selesai dengan ${total} perbandingan.`);
        done(total);
      },
    });
  };
  go();
}

export default {
  id: 'sma-05-gudang-beras',
  title: 'Quicksort di Gudang Beras',
  topic: 'Quicksort, pemilihan pivot, kasus terbaik dan terburuk, batas bawah pengurutan',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjalankan quicksort dengan pivot pertama dan nilai tengah dari tiga sambil menghitung perbandingan, menjelaskan kasus terburuk pada data yang sudah urut, menghitung kasus terbaik T(n), dan memahami batas bawah log₂(n!) untuk semua cara mengurutkan dengan membandingkan.',
  extraModes: [
    { id: 'gudang', icon: '🏭', label: 'Lantai Gudang', desc: 'Pilih susunan karung (acak, urut, terbalik, lembar kerja, atau ketik sendiri), lalu pilih pivot sendiri atau jalankan otomatis; total dibandingkan dengan kasus terbaik dan batas bawah', create: createFloor },
    { id: 'giliran', icon: '🔁', label: 'Pivot Bergiliran', desc: 'Setiap tim mengurutkan susunan karung yang sama dengan memilih pivot sendiri; perbandingan paling sedikit menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gudang-beras' });
    root.append(wrap);
    const free = ctx.rand.shuffle([24, 29, 35, 40, 46, 53, 58, 64, 71].slice(0, 8));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const tbl = (rows) => el('div', { class: 'gb-tabel' }, rows.map((x, i) => el('div', null, `${i + 1}. [${x.group.join(', ')}] pivot ${x.pivot} → kiri [${x.left.join(', ')}] kanan [${x.right.join(', ')}] · ${x.cmp}`)));
      if (r === 0) sortRound(wrap, ctx, { arr: KARUNG, rule: 'pertama', prompt: 'Quicksort dengan pivot pertama: ketuk karung pivot di setiap kelompok.', hint: 'Pivot = karung pertama dalam kelompok yang menyala. Kelompok kiri dikerjakan lebih dulu.', done: next });
      else if (r === 1) ask('Tadi total 25 perbandingan: 9 + 1 + 6 + 5 + 1 + 2 + 1. Kelompok berisi k karung selalu membutuhkan berapa perbandingan?', [['k − 1, karena pivot dibandingkan dengan setiap karung lain tepat satu kali', true], ['k, karena semua karung dibandingkan'], ['k × k'], ['Tergantung beratnya']], 1, tbl(quicksort(KARUNG).rows));
      else if (r === 2) ask('Esok hari karung datang sudah urut: 21, 26, 33, …, 68. Dengan pivot pertama, apa yang terjadi dan berapa total perbandingannya?', [['Kelompok kiri selalu kosong; 9 + 8 + … + 1 = 45', true], ['Kelompok terbagi dua sama besar; 19'], ['Langsung selesai; 0 perbandingan'], ['Kelompok kanan selalu kosong; 25']], 1, el('div', { class: 'au-status' }, URUT.join(', ')),
        then(() => ask('Bagaimana jika karung datang urut terbalik (68 sampai 21), dan jika 1.000 karung datang sudah urut?', [['Juga 45 (kanan yang selalu kosong); 1.000 karung: 499.500', true], ['Terbalik 0; 1.000 karung: 1.000'], ['Terbalik 19; 1.000 karung: 10.000'], ['Terbalik 45; 1.000 karung: 45.000']])));
      else if (r === 3) sortRound(wrap, ctx, { arr: URUT, rule: 'tengah3', prompt: 'Pivot nilai tengah dari tiga pada karung yang sudah urut: ketuk pivotnya.', hint: 'Lihat karung pertama, tengah (yang kiri bila genap), dan terakhir; pilih yang beratnya di tengah. Kelompok 2 karung memakai karung pertama.', done: next });
      else if (r === 4) ask('Nilai tengah dari tiga pada susunan lembar kerja (33, 68, 47, …, 38). Berapa totalnya?', [['20, lebih sedikit dari 25', true], ['25, sama seperti pivot pertama'], ['19, sama seperti data urut'], ['45']], 1, tbl(quicksort(KARUNG, median3Index).rows));
      else if (r === 5) ask('Kasus terbaik: T(n) = (n − 1) + T(kiri) + T(kanan), dengan kiri dan kanan hampir sama besar. T(4) = 4, T(5) = 6. Berapa T(10)?', [['19 = 9 + T(4) + T(5)', true], ['45'], ['25'], ['10']], 1, el('div', { class: 'gb-tabel' }, `n: 0 1 2 3 4 5 6 7 8 9 10 · T(n): ${Array.from({ length: 11 }, (_, n) => (n <= 5 ? best(n) : '?')).join(' ')}`),
        then(() => ask('Untuk 10 karung, quicksort paling sedikit dan paling banyak butuh berapa perbandingan?', [['Paling sedikit 19, paling banyak 45', true], ['Paling sedikit 9, paling banyak 25'], ['Selalu 25'], ['Paling sedikit 22, paling banyak 100']])));
      else if (r === 6) ask('10 karung bisa tersusun dalam 10! = 3.628.800 cara. Setiap perbandingan punya dua jawaban, jadi c perbandingan memberi paling banyak 2ᶜ rangkaian jawaban. Nilai c terkecil supaya 2ᶜ ≥ 10!?', [['22, karena 2²¹ = 2.097.152 < 3.628.800 ≤ 4.194.304 = 2²²', true], ['21'], ['10'], ['3.628.800']], 1, null,
        then(() => ask('Mengapa banyak rangkaian jawaban harus paling sedikit sama dengan banyak susunan?', [['Jika dua susunan berbeda memberi jawaban yang sama, langkahnya sama persis, jadi salah satunya pasti tidak terurut', true], ['Karena komputer menyimpan semua susunan'], ['Karena setiap susunan dibandingkan sekali'], ['Supaya lebih cepat']])));
      else if (r === 7) ask('Di soal tadi quicksort hanya butuh 19 perbandingan, kurang dari batas bawah 22. Apakah ini bertentangan?', [['Tidak: batas bawah berlaku untuk kasus terburuk; selain itu perbandingan untuk memilih pivot tidak dihitung', true], ['Ya, batas bawahnya salah'], ['Ya, quicksort curang'], ['Tidak, karena 19 lebih besar dari 22']]);
      else if (r === 8) ask('1.000 karung acak: rata-rata sekitar 11.000 perbandingan; kasus terburuk 499.500. Jika satu perbandingan 1 detik, berapa lama kasus terburuk?', [['Sekitar 45 kali rata-rata: 138,75 jam, hampir 6 hari; rata-ratanya sekitar 3 jam', true], ['Sama dengan rata-rata, sekitar 3 jam'], ['Sekitar 2 kali rata-rata, 6 jam'], ['499.500 jam']], 1, null,
        then(() => ask('Saran untuk pemrogram aplikasi gudang yang datanya sering sudah urut?', [['Jangan memakai pivot pertama; pakai nilai tengah dari tiga, pivot acak, atau fungsi pengurutan bawaan', true], ['Tetap pakai pivot pertama karena paling mudah'], ['Acak dulu datanya lalu urutkan dengan tangan'], ['Jangan mengurutkan data sama sekali']])));
      else sortRound(wrap, ctx, { arr: free, rule: 'bebas', target: best(free.length), prompt: `Tantangan: urutkan 8 karung dengan paling banyak ${best(8)} perbandingan (kasus terbaik). Pilih pivot sendiri.`, hint: 'Ketuk karung mana saja di kelompok yang menyala sebagai pivot.', done: next });
    }
    render();
  },
};

function arrangement(kind, ctx, n = 10) {
  if (kind === 'lembar') return [...KARUNG];
  const base = kind === 'acak' ? ctx.rand.shuffle(Array.from({ length: 70 }, (_, i) => 20 + i)).slice(0, n) : [...URUT];
  if (kind === 'urut') return [...base].sort((a, b) => a - b);
  if (kind === 'terbalik') return [...base].sort((a, b) => b - a);
  return base;
}

function createFloor(root, ctx) {
  const wrap = el('div', { class: 'act gudang-beras' });
  root.append(wrap);
  let arr = [...KARUNG];
  let mode = 'bebas';
  const host = el('div', { class: 'gb-papan' });
  const sum = el('p', { class: 'reveal info' });
  const input = el('input', { class: 'kh-masukan gb-ketik', placeholder: 'ketik berat, pisahkan dengan koma', 'aria-label': 'Berat karung' });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('change', () => { const v = [...new Set(input.value.split(/[ ,;]+/).map(Number).filter((x) => x > 0))].slice(0, 16); if (v.length >= 2) { arr = v; reset(); } });
  function reset() {
    host.replaceChildren();
    const n = arr.length;
    sum.textContent = `${n} karung · kasus terbaik ${best(n)} · batas bawah ⌈log₂ ${n}!⌉ = ${lowerBound(n)} · pivot pertama: ${quicksort(arr).total} · tengah dari tiga: ${quicksort(arr, median3Index).total} · terburuk ${worst(n)}`;
    const b = board(host, ctx, { arr, onDone: (t) => { ctx.sound.win(); } });
    if (mode !== 'bebas') b.start(mode);
  }
  wrap.append(el('p', { class: 'prompt' }, 'Lantai gudang: urutkan karung dengan quicksort.'),
    el('div', { class: 'seg' }, [['lembar', 'Lembar kerja'], ['acak', '🎲 Acak'], ['urut', 'Sudah urut'], ['terbalik', 'Urut terbalik']].map(([k, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { arr = arrangement(k, ctx); reset(); })), input),
    el('div', { class: 'seg' }, [['bebas', 'Pilih pivot sendiri'], ['pertama', '▶ Pivot pertama'], ['tengah3', '▶ Nilai tengah dari tiga']].map(([k, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { mode = k; reset(); }))),
    host, sum);
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act gudang-beras' });
  root.append(wrap);
  let pts = [];
  let arr = [];
  function start(n) { pts = Array(n).fill(null); arr = arrangement('acak', ctx, 10); turn(0); }
  function turn(t) {
    if (t >= pts.length) return finishBoard(wrap, ctx, { title: `Semua tim selesai. Kasus terbaik untuk 10 karung: ${best(10)} perbandingan.`, pts, unit: 'perbandingan', low: true, again: () => pickTeams(wrap, 'Pivot Bergiliran', start) });
    const host = el('div', { class: 'gb-papan' });
    wrap.replaceChildren(scoreBar(pts.map((p) => (p == null ? '–' : p)), t), el('p', { class: 'prompt' }, `Giliran Tim ${t + 1}: urutkan dengan perbandingan sesedikit mungkin.`), host);
    board(host, ctx, { arr, onDone: (total) => { pts[t] = total; ctx.sound.good(); setTimeout(() => turn(t + 1), 2000); } });
  }
  pickTeams(wrap, 'Pivot Bergiliran', start);
}
