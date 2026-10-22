// Server Pendaftaran Murid Baru — SMA/SMK (16–18 tahun), kompleksitas algoritma.
// Finding a duplicate code three ways (all pairs, sort then neighbours, hash
// drawers), growth of n², n log n and n, step counts to seconds, Big-O order,
// and what a bad hash rule does.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const KODE = [4827, 1063, 7351, 2917, 6409, 3580, 8134, 5293, 9748, 6215, 2917, 3742];
export function allPairs(codes) {
  let k = 0;
  let first = null;
  for (let i = 0; i < codes.length; i++) for (let j = i + 1; j < codes.length; j++) { k++; if (!first && codes[i] === codes[j]) first = { k, i: i + 1, j: j + 1 }; }
  return { total: k, first };
}
export const RULES = {
  akhir: { label: 'Angka terakhir', n: 10, f: (c) => c % 10 },
  depan: { label: 'Dua angka pertama', n: 100, f: (c) => Math.floor(c / 100) },
  aduk: { label: 'Rumus pengaduk (sisa bagi 97)', n: 97, f: (c) => (c * 31 + 7) % 97 },
};
// Insert codes into drawers; returns drawers, comparisons and where the duplicate was found.
export function hashRun(codes, rule = RULES.akhir) {
  const drawers = Array.from({ length: rule.n }, () => []);
  let cmp = 0;
  let dup = null;
  codes.forEach((c, i) => {
    const d = drawers[rule.f(c)];
    for (const x of d) { cmp++; if (x === c && !dup) dup = i + 1; }
    d.push(c);
  });
  return { drawers, cmp, dup, steps: cmp + codes.length };
}
export const stepsA = (n) => (n * (n - 1)) / 2;
export const stepsB = (n) => n * Math.log2(n);
export const stepsC = (n) => n;
export const SPEED = 1e8;
export const GROWTH = [['1', () => 1], ['log₂ n', (n) => Math.log2(n)], ['n', (n) => n], ['n log₂ n', (n) => n * Math.log2(n)], ['n²', (n) => n * n], ['2ⁿ', (n) => 2 ** n]];
export const fmt = (x) => (x >= 1e15 ? x.toExponential(2).replace('.', ',') : x >= 100 ? Math.round(x).toLocaleString('id-ID') : fmtNum(x, x < 0.001 ? 6 : 3));
export function fmtTime(sec) {
  if (sec < 1) return `${fmt(sec)} detik`;
  if (sec < 120) return `${fmtNum(sec, 1)} detik`;
  if (sec < 7200) return `${fmtNum(sec / 60, 1)} menit`;
  if (sec < 172800) return `${fmtNum(sec / 3600, 1)} jam`;
  if (sec < 3.15e7 * 2) return `${fmtNum(sec / 86400, 1)} hari`;
  return `${fmt(sec / 3.15e7)} tahun`;
}

// Tap the items in the asked order.
function tapOrder(wrap, ctx, { prompt, items, order, hint, done, cls = '' }) {
  const got = [];
  const row = el('div', { class: `pd-kartu-baris ${cls}` });
  const out = el('div', { class: 'au-status pd-hasil' }, '…');
  const msg = el('p', { class: 'reveal info' }, hint);
  const draw = () => {
    row.replaceChildren(...items.map((it, i) => onTap(el('button', { class: `pd-kartu ${got.includes(i) ? 'dipakai' : ''}`, type: 'button', disabled: got.includes(i) }, it), () => {
      if (got.includes(i) || got.length >= order.length) return;
      if (items[i] !== order[got.length]) { ctx.mistake(); shake(row); say(msg, 'bad', `${items[i]} belum giliran. Cari yang paling kecil di antara sisanya.`); return; }
      got.push(i); ctx.sound.tap(); draw();
      if (got.length === order.length) done();
    })));
    out.textContent = got.map((i) => items[i]).join(' · ') || '…';
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), row, out, msg);
}

function hashRound(wrap, ctx, { done }) {
  const drawers = Array.from({ length: 10 }, () => []);
  let i = 0;
  let cmp = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk laci sesuai angka terakhir kode. Kode dibandingkan dengan isi laci itu.');
  const draw = (hit = null) => stage.replaceChildren(
    el('div', { class: 'pd-datang' }, i < KODE.length ? el('span', null, `Pendaftar ${i + 1}: `, el('b', null, KODE[i])) : el('b', null, 'Semua kode sudah masuk.'), el('span', { class: 'pd-hitung' }, `perbandingan: ${cmp}`)),
    el('div', { class: 'pd-laci' }, drawers.map((d, k) => onTap(el('button', { class: `pd-laci-1 ${hit === k ? 'kena' : ''}`, type: 'button' }, el('b', null, k), ...d.map((c) => el('span', { class: c === 2917 && d.filter((x) => x === c).length > 1 ? 'ganda' : '' }, c))), () => put(k)))));
  function put(k) {
    if (i >= KODE.length) return;
    const c = KODE[i];
    if (k !== c % 10) { ctx.mistake(); shake(stage); say(msg, 'bad', `Angka terakhir ${c} adalah ${c % 10}.`); return; }
    const d = drawers[k];
    cmp += d.length;
    const isDup = d.includes(c);
    d.push(c);
    i++;
    ctx.sound.tap();
    draw(k);
    say(msg, isDup ? 'bad' : 'info', isDup ? `Ganda! ${c} sudah ada di laci ${k} (pendaftar ${i}). ${d.length - 1} perbandingan di laci ini.` : d.length > 1 ? `Dibandingkan dengan ${d.length - 1} kode di laci ${k}.` : `Laci ${k} masih kosong: tanpa perbandingan.`);
    if (i === KODE.length) { say(msg, '', `Total ${cmp} perbandingan + 12 langkah menentukan laci = ${cmp + 12} langkah.`); done(); }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Cara C: masukkan kode ke laci 0–9 menurut angka terakhirnya.'), stage, msg);
}

const codeTable = () => el('div', { class: 'pd-kode' }, KODE.map((c, i) => el('span', null, el('small', null, i + 1), c)));

// Two curves, linear axes, n from 1 to nMax.
export function chartSvg(fns, nMax, { log = false, mark = null } = {}) {
  const W = 520; const H = 260; const P = 44;
  const xs = Array.from({ length: 80 }, (_, k) => (log ? 10 ** (1 + (k / 79) * (Math.log10(nMax) - 1)) : 1 + (k / 79) * (nMax - 1)));
  const ys = fns.map(([, f]) => xs.map(f));
  const yMax = Math.max(...ys.flat().filter(Number.isFinite));
  const yMin = log ? Math.max(1, Math.min(...ys.flat().filter((v) => v > 0))) : 0;
  const X = (x) => P + (log ? (Math.log10(x) - 1) / (Math.log10(nMax) - 1) : (x - 1) / (nMax - 1)) * (W - P - 10);
  const Y = (y) => H - 26 - (log ? (Math.log10(Math.max(y, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin) || 1) : Math.min(y, yMax) / yMax) * (H - 40);
  const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea'];
  const lines = ys.map((v, k) => `<polyline points="${v.map((y, i) => `${X(xs[i])},${Y(y)}`).join(' ')}" fill="none" stroke="${colors[k]}" stroke-width="3"/>`);
  const legend = fns.map(([l], k) => `<text x="${P + 8 + k * 120}" y="16" font-size="13" font-weight="800" fill="${colors[k]}">● ${l}</text>`);
  const m = mark ? `<line x1="${X(mark)}" y1="20" x2="${X(mark)}" y2="${H - 26}" stroke="#64748b" stroke-dasharray="5 4"/><text x="${X(mark)}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#334155">n = ${fmt(mark)}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik pertumbuhan"><line x1="${P}" y1="${H - 26}" x2="${W - 10}" y2="${H - 26}" stroke="#94a3b8"/><line x1="${P}" y1="20" x2="${P}" y2="${H - 26}" stroke="#94a3b8"/><text x="${P - 4}" y="${H - 8}" font-size="11" text-anchor="end" fill="#64748b">${log ? 10 : 1}</text><text x="${W - 10}" y="${H - 8}" font-size="11" text-anchor="end" fill="#64748b">${fmt(nMax)}</text>${m}${lines.join('')}${legend.join('')}</svg>`;
}

export default {
  id: 'sma-06-pendaftaran',
  title: 'Server Pendaftaran Murid Baru',
  topic: 'Kompleksitas algoritma: O(n²), O(n log n), O(n), dan tabel hash',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🖥️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membandingkan tiga cara mencari kode ganda (semua pasangan, urutkan lalu periksa tetangga, tabel hash), menghitung banyak langkah dan waktunya untuk data besar, mengurutkan laju pertumbuhan dengan notasi O, dan menjelaskan akibat aturan laci hash yang buruk.',
  extraModes: [
    { id: 'kalkulator', icon: '📈', label: 'Kalkulator Pertumbuhan', desc: 'Geser n dari 10 sampai 1.000.000; layar menghitung langkah dan waktu cara A, B, dan C serta menggambar grafiknya, dengan sumbu biasa atau logaritma', create: createCalc },
    { id: 'laci', icon: '🗄️', label: 'Laci Hash', desc: 'Kartu pendaftar masuk ke laci menurut aturan yang dipilih (angka terakhir, dua angka pertama, atau rumus pengaduk) dengan penghitung perbandingan', create: createDrawers },
    { id: 'giliran', icon: '🔁', label: 'Mana Lebih Besar?', desc: 'Setiap tim mendapat dua rumus dan menebak mana yang lebih besar untuk n yang disebut layar; grafiknya lalu ditampilkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pendaftaran' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) ask('Cara A: bandingkan semua pasangan dari 12 pendaftar (1 dengan 2–12, lalu 2 dengan 3–12, dan seterusnya). Berapa totalnya?', [['66 = 11 + 10 + … + 1, rumusnya n(n − 1) : 2', true], ['144 = 12 × 12'], ['12'], ['132 = 12 × 11']], 2, codeTable(),
        then(() => ask('Kode ganda ditemukan pada perbandingan ke berapa, dan mengapa server tetap melanjutkan?', [['Ke-37 (pendaftar 4 dan 11); tetap lanjut karena bisa ada pasangan ganda lain', true], ['Ke-11; lalu boleh berhenti'], ['Ke-37; lalu boleh berhenti'], ['Ke-66 (pendaftar 11 dan 12)']], 2, codeTable())));
      else if (r === 1) tapOrder(wrap, ctx, { prompt: 'Cara B: urutkan kode dari kecil ke besar. Ketuk satu per satu.', items: KODE.map(String), order: [...KODE].sort((a, b) => a - b).map(String), hint: 'Ketuk kode terkecil yang tersisa.', done: () => { wrap.replaceChildren(); ask('Sekarang bandingkan setiap kode dengan tetangga kanannya. Berapa perbandingan, dan mengapa kode ganda pasti bersebelahan?', [['11 perbandingan; setiap kode di antara dua kode yang sama pasti juga sama, jadi kembarannya bersebelahan', true], ['66 perbandingan; harus diperiksa semua'], ['12 perbandingan; kebetulan saja'], ['11 perbandingan; karena kodenya genap']], 1, el('div', { class: 'au-status' }, [...KODE].sort((a, b) => a - b).join(' · '))); } });
      else if (r === 2) hashRound(wrap, ctx, { done: next });
      else if (r === 3) ask('Untuk 12 pendaftar, berapa langkah setiap cara? (Mengurutkan 12 kode paling banyak 33 perbandingan.)', [['A 66, B paling banyak 44, C 16', true], ['A 66, B 11, C 4'], ['A 44, B 66, C 16'], ['A 12, B 12, C 12']]);
      else if (r === 4) ask('Untuk n = 1.000 pendaftar: cara A n(n − 1) : 2, cara B n × log₂ n (log₂ 1.000 ≈ 10), cara C n. Berapa langkahnya?', [['A 499.500; B 10.000; C 1.000', true], ['A 1.000.000; B 1.000; C 10'], ['A 499.500; B 1.000; C 10.000'], ['A 10.000; B 10.000; C 1.000']], 1, null,
        then(() => ask('Untuk n = 1.000.000 (log₂ n ≈ 20)?', [['A ≈ 500 miliar; B 20 juta; C 1 juta', true], ['A 1 juta; B 20 juta; C 1 juta'], ['A 20 juta; B 500 miliar; C 1 juta'], ['A 1 triliun; B 1 juta; C 20']])));
      else if (r === 5) ask('Server mengerjakan 10⁸ langkah per detik. Server provinsi (1.000.000 pendaftar) harus memeriksa data ganda setiap 10 menit. Cara mana yang memenuhi?', [['B (0,2 detik) dan C (0,01 detik); A butuh sekitar 83 menit', true], ['Hanya A, karena paling teliti'], ['A, B, dan C sama-sama memenuhi'], ['Tidak ada yang memenuhi']], 1, el('div', { class: 'pd-mini', html: chartSvg([['A', stepsA], ['B', stepsB], ['C', stepsC]], 1e6, { log: true }) }),
        then(() => ask('Apakah cara A masih masuk akal untuk satu sekolah (n = 1.000)?', [['Ya, sekitar 0,005 detik, dan paling mudah diprogram dengan benar', true], ['Tidak, butuh berjam-jam'], ['Tidak, karena O(n²) selalu salah'], ['Ya, karena lebih cepat dari cara C']])));
      else if (r === 6) { const items = ctx.rand.shuffle(GROWTH.map((g) => g[0])); tapOrder(wrap, ctx, { prompt: 'Notasi O: ketuk dari yang tumbuh paling lambat.', items, order: GROWTH.map((g) => g[0]), hint: 'Bayangkan n = 1.000.000.', cls: 'pd-rumus', done: next }); }
      else if (r === 7) ask('Jika n dikalikan 10, langkah setiap cara dikalikan berapa?', [['A ×100, C ×10, B sedikit lebih dari ×10', true], ['Semua ×10'], ['A ×20, B ×10, C ×10'], ['A ×100, B ×100, C ×10']]);
      else if (r === 8) ask('Program X butuh 100n langkah, program Y butuh n² langkah. Mulai n berapa X lebih cepat?', [['n lebih dari 100 (keduanya sama pada n = 100)', true], ['Selalu, karena 100n lebih kecil'], ['Tidak pernah'], ['n lebih dari 10']], 1, el('div', { class: 'pd-mini', html: chartSvg([['100n', (n) => 100 * n], ['n²', (n) => n * n]], 200, { mark: 100 }) }));
      else ask('Tantangan: laci dipilih dari dua angka pertama NIK, padahal di satu provinsi semua NIK diawali kode wilayah yang sama. Apa akibatnya untuk 1.000.000 pendaftar?', [['Semua masuk satu laci; perbandingannya ≈ 500 miliar seperti cara A (≈ 83 menit). Pakai rumus pengaduk, misalnya sisa bagi bilangan prima besar', true], ['Tidak ada akibatnya'], ['Lebih cepat karena lacinya sedikit'], ['Server langsung menolak semua pendaftar']], 1, el('div', { class: 'pd-laci kecil' }, [11, 12, 13].map((k) => el('div', { class: 'pd-laci-1' }, el('b', null, `${k}…`), el('span', null, k === 12 ? '1.000.000 kode' : 'kosong')))));
    }
    render();
  },
};

const STOPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6];
function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act pendaftaran' });
  root.append(wrap);
  let k = 6;
  let log = true;
  const out = el('div', { class: 'pd-kalk' });
  const lab = el('b');
  const sl = el('input', { type: 'range', min: 0, max: STOPS.length - 1, step: 1, value: k, class: 'pd-geser', 'aria-label': 'n' });
  sl.addEventListener('pointerdown', (e) => e.stopPropagation());
  sl.addEventListener('input', () => { k = Number(sl.value); draw(); });
  function draw() {
    const n = STOPS[k];
    lab.textContent = `n = ${fmt(n)}`;
    out.replaceChildren(el('div', { class: 'pd-mini besar', html: chartSvg([['A: n(n−1):2', stepsA], ['B: n log₂ n', stepsB], ['C: n', stepsC]], 1e6, { log, mark: n }) }),
      el('div', { class: 'ab-lapisan' }, [['A semua pasangan', stepsA], ['B urutkan + tetangga', stepsB], ['C tabel hash', stepsC]].map(([l, f]) => el('div', { class: 'ab-lap-baris' }, el('span', null, l), el('b', null, `${fmt(f(n))} langkah · ${fmtTime(f(n) / SPEED)}`)))));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Kalkulator pertumbuhan (10⁸ langkah per detik)'), el('div', { class: 'kode-baris' }, lab, sl,
    el('div', { class: 'seg' }, [[true, 'Skala logaritma'], [false, 'Skala biasa']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { log = v; draw(); })))), out);
  draw();
}

function createDrawers(root, ctx) {
  const wrap = el('div', { class: 'act pendaftaran' });
  root.append(wrap);
  let rule = 'akhir';
  let data = 'lembar';
  let shown = 0;
  let timer = null;
  const region = () => { const r = []; for (let i = 0; i < 40; i++) r.push(3200 + ctx.rand.int(0, 99)); return r; };
  let codes = KODE;
  const stage = el('div');
  function draw() {
    const rl = RULES[rule];
    const run = hashRun(codes.slice(0, shown), rl);
    const used = run.drawers.map((d, i) => [i, d]).filter(([, d]) => d.length);
    stage.replaceChildren(el('div', { class: 'pd-datang' }, el('span', null, `${shown}/${codes.length} kode · ${used.length} laci terisi dari ${rl.n}`), el('span', { class: 'pd-hitung' }, `perbandingan: ${run.cmp}`), run.dup ? el('b', { class: 'ganda' }, ` ganda di pendaftar ${run.dup}`) : null),
      el('div', { class: 'pd-laci bebas' }, used.map(([i, d]) => el('div', { class: `pd-laci-1 ${d.length > 3 ? 'penuh' : ''}` }, el('b', null, i), ...d.slice(0, 6).map((c) => el('span', null, c)), d.length > 6 ? el('small', null, `+${d.length - 6}`) : null))));
  }
  const play = () => { clearInterval(timer); shown = 0; draw(); timer = setInterval(() => { if (!wrap.isConnected || shown >= codes.length) { clearInterval(timer); return; } shown++; ctx.sound.tap(); draw(); }, 350); };
  wrap.append(el('p', { class: 'prompt' }, 'Laci hash: pilih data dan aturan laci.'),
    el('div', { class: 'seg' }, [['lembar', '12 kode lembar kerja'], ['wilayah', '40 kode satu wilayah (diawali 32)']].map(([k, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { data = k; codes = k === 'lembar' ? KODE : region(); play(); }))),
    el('div', { class: 'seg' }, Object.entries(RULES).map(([k, r]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, r.label), () => { rule = k; play(); }))),
    stage, el('div', { class: 'kode-baris' }, button('▶ Masukkan lagi', play, 'primary'), button('Langsung semua', () => { clearInterval(timer); shown = codes.length; draw(); })));
  play();
}

export const PAIRS = [['100n', (n) => 100 * n, 'n²', (n) => n * n], ['n log₂ n', (n) => n * Math.log2(n), '10n', (n) => 10 * n], ['2ⁿ', (n) => 2 ** n, 'n³', (n) => n ** 3], ['1.000 log₂ n', (n) => 1000 * Math.log2(n), 'n', (n) => n], ['n²', (n) => n * n, '50 n log₂ n', (n) => 50 * n * Math.log2(n)], ['5n', (n) => 5 * n, 'n log₂ n', (n) => n * Math.log2(n)]];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pendaftaran' });
  root.append(wrap);
  let pts = [];
  let t = 0;
  const TURNS = 3;
  function start(n) { pts = Array(n).fill(0); t = 0; play(); }
  function play() {
    if (t >= pts.length * TURNS) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Mana Lebih Besar?', start) });
    const team = t % pts.length;
    const [la, fa, lb, fb] = ctx.rand.pick(PAIRS);
    let n;
    do n = ctx.rand.pick([4, 8, 10, 16, 20, 50, 100, 1000, 10000, 1e5]); while (Math.abs(fa(n) - fb(n)) < 1e-9 || (fa(n) > 1e15 && fb(n) > 1e15));
    let locked = false;
    const msg = el('p', { class: 'reveal info' }, `n = ${fmt(n)}`);
    const pic = el('div', { class: 'pd-mini' });
    const opt = (l, f, g) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), () => {
      if (locked) return;
      locked = true;
      const ok = f(n) > g(n);
      if (ok) { pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
      say(msg, ok ? '' : 'bad', `n = ${fmt(n)}: ${la} = ${fmt(fa(n))}, ${lb} = ${fmt(fb(n))}. ${ok ? 'Tepat!' : 'Belum tepat.'}`);
      pic.innerHTML = chartSvg([[la, fa], [lb, fb]], Math.max(n * 2, 10), { mark: n });
      t++;
      setTimeout(play, 3600);
    });
    wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Tim ${team + 1}: untuk n = ${fmt(n)}, mana yang lebih besar?`), el('div', { class: 'opts', style: { '--cols': 2 } }, opt(la, fa, fb), opt(lb, fb, fa)), msg, pic);
  }
  pickTeams(wrap, 'Mana Lebih Besar?', start);
}
