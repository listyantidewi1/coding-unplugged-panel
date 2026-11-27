// Server Pendaftaran Murid Baru — SMA/SMK (16–18 tahun), kompleksitas algoritma.
// Finding a duplicate code three ways (all pairs, sort then neighbours, hash
// drawers), growth of n², n log n and n, step counts to seconds, Big-O order,
// and what a bad hash rule does.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

const STOPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6];
// ---- Pemburu Kode Kembar: the missions ----

// Tally marks, grouped by five.
function tally(n) {
  const groups = [];
  for (let k = 0; k < Math.floor(n / 5); k++) groups.push(el('span', { class: 'pk6-lima' }, '||||'));
  if (n % 5) groups.push(el('span', null, '|'.repeat(n % 5)));
  return el('div', { class: 'pk6-turus' }, el('small', null, 'Turus'), groups, el('b', null, String(n)));
}

// Misi Mesin A / B: the machine compares one pair per step; the player is the
// machine's eye and calls "Kembar!" when the pair is equal. After a few manual
// steps the machine can run on its own and the player must catch the twin.
function scanRound(wrap, ctx, { codes, pairs, labels, done, end, manualFirst = 4 }) {
  let k = 0;
  let found = null;
  let timer = null;
  let grace = false;
  let finished = false;
  const row = el('div', { class: 'pd-kartu-baris pk6-baris' });
  const turus = el('div');
  const ctl = el('div', { class: 'kode-baris pk6-ctl' });
  const msg = el('p', { class: 'reveal info' }, 'Lihat dua kartu yang menyala. Beda: tekan ⚖ Bandingkan. Sama: tekan 🎯 Kembar!');
  const twin = (p) => codes[p[0]] === codes[p[1]];
  const stop = () => { clearInterval(timer); timer = null; };
  function draw() {
    const p = pairs[k] || [];
    fill(row, codes.map((c, i) => el('div', { class: `pk6-kartu ${p.includes(i) ? 'nyala' : ''} ${found && found.includes(i) ? 'kembar' : ''}` }, el('small', null, labels ? labels[i] : `#${i + 1}`), el('b', null, String(c)))));
    fill(turus, tally(k));
    if (finished) { fill(ctl); return; }
    fill(ctl,
      onTap(el('button', { class: 'btn', type: 'button', 'data-aksi': 'banding' }, '⚖ Bandingkan'), () => compare(false)),
      onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'kembar' }, '🎯 Kembar!'), () => compare(true)),
      k >= manualFirst && !found ? onTap(el('button', { class: `btn ${timer ? 'on' : ''}`, type: 'button', 'data-aksi': 'cepat' }, timer ? '⏸ Tahan' : '⏩ Jalan sendiri'), () => { if (timer) { stop(); draw(); } else { timer = setInterval(() => auto(), 450); draw(); } }) : null);
  }
  function auto() {
    if (!wrap.isConnected) { stop(); return; }
    if (twin(pairs[k]) && !grace) { grace = true; return; }
    if (twin(pairs[k])) { grace = false; stop(); ctx.mistake(); say(msg, 'bad', `Terlewat! Pasangan ${labels ? labels[pairs[k][0]] : `#${pairs[k][0] + 1}`} dan ${labels ? labels[pairs[k][1]] : `#${pairs[k][1] + 1}`} sama. Mesin mundur satu langkah: tekan 🎯 Kembar!`); draw(); return; }
    k++;
    ctx.sound.tap();
    draw();
  }
  function compare(saysTwin) {
    if (finished || k >= pairs.length) return;
    const p = pairs[k];
    if (saysTwin !== twin(p) || (found && saysTwin)) {
      ctx.mistake(); shake(row);
      say(msg, 'bad', saysTwin ? `${codes[p[0]]} dan ${codes[p[1]]} berbeda.` : `${codes[p[0]]} dan ${codes[p[1]]} sama! Tekan 🎯 Kembar!`);
      return;
    }
    stop();
    k++;
    ctx.sound.tap();
    if (saysTwin) {
      found = p;
      ctx.sound.good();
      say(msg, 'info', `Kembar di perbandingan ke-${k}: ${labels ? labels[p[0]] : `#${p[0] + 1}`} dan ${labels ? labels[p[1]] : `#${p[1] + 1}`} (${codes[p[0]]}). Mesin tetap memeriksa sisanya, siapa tahu ada kembar lain…`);
      draw();
      timer = setInterval(() => {
        if (!wrap.isConnected) { stop(); return; }
        if (k >= pairs.length) { stop(); finished = true; draw(); say(msg, '', end(k, found)); done(k); return; }
        k++;
        draw();
      }, Math.max(40, Math.min(220, 2600 / Math.max(1, pairs.length - k))));
      return;
    }
    draw();
    if (k >= pairs.length) { finished = true; draw(); say(msg, '', end(k, found)); done(k); }
  }
  draw();
  wrap.append(row, turus, ctl, msg);
}

// Misi Laci Hash: the arriving card goes to the drawer the rule names.
function drawerRound(wrap, ctx, { codes, labels, rule, explain, done, end, prompt }) {
  const drawers = labels.map(() => []);
  let i = 0;
  let cmp = 0;
  let dup = null;
  const stage = el('div', { class: 'pk6-laci-wrap' });
  const msg = el('p', { class: 'reveal info' }, prompt);
  const draw = (hit = null) => fill(stage,
    el('div', { class: 'pd-datang' }, i < codes.length ? el('span', { class: 'pk6-datang' }, `Pendaftar ${i + 1}: `, el('b', null, String(codes[i]))) : el('b', null, 'Semua kartu sudah masuk.'), tally(cmp + i)),
    el('div', { class: 'pd-laci' }, drawers.map((d, k) => onTap(el('button', { class: `pd-laci-1 ${hit === k ? 'kena' : ''} ${d.length > 3 ? 'penuh' : ''}`, type: 'button', 'data-laci': labels[k] },
      el('b', null, String(labels[k])), d.slice(0, 4).map((c) => el('span', { class: d.filter((x) => x === c).length > 1 ? 'ganda' : '' }, String(c))), d.length > 4 ? el('small', null, `+${d.length - 4}`) : null), () => put(k)))));
  function put(k) {
    if (i >= codes.length) return;
    const c = codes[i];
    const want = labels.indexOf(rule(c));
    if (k !== want) { ctx.mistake(); shake(stage); say(msg, 'bad', explain(c)); return; }
    const d = drawers[k];
    cmp += d.length;
    const isDup = d.includes(c);
    if (isDup && !dup) dup = i + 1;
    d.push(c);
    i++;
    ctx.sound.tap();
    draw(k);
    say(msg, isDup ? 'bad' : 'info', isDup ? `Kembar! ${c} sudah ada di laci ${labels[k]}. ${d.length - 1} perbandingan di laci ini.` : d.length > 1 ? `1 langkah memilih laci + ${d.length - 1} perbandingan dengan isi laci ${labels[k]}.` : `1 langkah memilih laci. Laci ${labels[k]} kosong: tanpa perbandingan.`);
    if (i === codes.length) { say(msg, '', end({ cmp, steps: cmp + codes.length, dup, drawers })); done(cmp); }
  }
  draw();
  wrap.append(stage, msg);
}

// Misi Mesin Waktu. pilih: n is fixed, tap the machines you predict make the deadline, then run.
// batas: slide n to the largest value machine A still makes the deadline.
const MESIN = [['A', 'semua pasangan', 'n(n − 1) : 2', stepsA], ['B', 'urutkan + tetangga', 'n log₂ n', stepsB], ['C', 'laci hash', 'n', stepsC]];
function timeRound(wrap, ctx, { mode, n0 = 1e6, deadline = 600, done }) {
  let k = STOPS.indexOf(n0);
  const pick = new Set();
  let shown = mode === 'batas';
  let finished = false;
  const head = el('div', { class: 'pk6-n' });
  const cards = el('div', { class: 'pk6-mesin' });
  const ctl = el('div', { class: 'kode-baris' });
  const dl = fmtTime(deadline);
  const msg = el('p', { class: 'reveal info' }, mode === 'pilih' ? `Server mengerjakan 10⁸ langkah per detik. Ketuk mesin yang kamu ramal lolos tenggat ${dl}, lalu jalankan.` : `Ubah n dengan − dan +. Cari n terbesar yang masih bisa diselesaikan Mesin A dalam ${dl}, lalu kunci.`);
  const draw = () => {
    const n = STOPS[k];
    fill(head, el('span', null, 'n = ', el('b', null, fmt(n)), ' pendaftar'),
      mode === 'batas' && !finished ? [onTap(el('button', { class: 'btn', type: 'button', 'data-n': '-' }, '−'), () => { if (k > 0) { k--; ctx.sound.tap(); draw(); } }), onTap(el('button', { class: 'btn', type: 'button', 'data-n': '+' }, '+'), () => { if (k < STOPS.length - 1) { k++; ctx.sound.tap(); draw(); } })] : null,
      el('small', null, `tenggat ${dl}`));
    fill(cards, MESIN.map(([id, name, f, fn]) => {
      const sec = fn(n) / SPEED;
      const ok = sec <= deadline;
      const bar = Math.max(2, Math.min(100, (Math.log10(Math.max(sec, 1e-6)) + 6) / (Math.log10(deadline) + 7) * 100));
      return onTap(el('button', { class: `pk6-m ${pick.has(id) ? 'pilih' : ''} ${shown ? (ok ? 'lolos' : 'gagal') : ''}`, type: 'button', 'data-mesin': id, disabled: mode !== 'pilih' || finished },
        el('b', null, `Mesin ${id}`), el('small', null, name), el('code', null, f),
        el('span', null, shown ? `${fmt(fn(n))} langkah` : '? langkah'),
        el('span', { class: 'pk6-waktu' }, shown ? fmtTime(sec) : '? detik'),
        el('i', { class: 'pk6-bar', style: { '--p': shown ? `${bar}%` : '0%' } }),
        el('em', null, shown ? (ok ? '✅ lolos' : '❌ gagal') : pick.has(id) ? '🔮 lolos?' : '')), () => { if (pick.has(id)) pick.delete(id); else pick.add(id); ctx.sound.tap(); draw(); });
    }));
    fill(ctl, finished ? null : mode === 'pilih' ? onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'jalan' }, '▶ Jalankan'), run) : onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'kunci' }, '🔒 Kunci n'), lock));
  };
  function run() {
    shown = true;
    const n = STOPS[k];
    const truth = MESIN.filter(([, , , fn]) => fn(n) / SPEED <= deadline).map(([id]) => id);
    const right = truth.length === pick.size && truth.every((id) => pick.has(id));
    draw();
    if (!right) { ctx.mistake(); say(msg, 'bad', `Ramalanmu belum tepat. Lihat waktunya: yang lolos ${truth.join(' dan ') || 'tidak ada'}. Ketuk ulang ramalanmu, lalu jalankan lagi.`); shown = false; setTimeout(draw, 2600); return; }
    finished = true;
    draw();
    say(msg, '', `Tepat: ${truth.join(' dan ')} lolos. Mesin A butuh ${fmt(stepsA(n))} langkah ≈ ${fmtTime(stepsA(n) / SPEED)}.`);
    done();
  }
  function lock() {
    const best = STOPS.filter((n) => stepsA(n) / SPEED <= deadline).at(-1);
    const n = STOPS[k];
    if (n !== best) { ctx.mistake(); shake(head); say(msg, 'bad', stepsA(n) / SPEED > deadline ? `Pada n = ${fmt(n)} Mesin A butuh ${fmtTime(stepsA(n) / SPEED)}: lewat tenggat.` : `Mesin A masih lolos pada n yang lebih besar. Naikkan lagi.`); return; }
    finished = true;
    ctx.sound.good();
    draw();
    const nx = STOPS[k + 1];
    say(msg, '', `Batas Mesin A: ${fmt(n)} pendaftar (${fmtTime(stepsA(n) / SPEED)}). Pada ${fmt(nx)} sudah ${fmtTime(stepsA(nx) / SPEED)}. n naik ${fmtNum(nx / n, 1)}×, waktu naik ${fmtNum(stepsA(nx) / stepsA(n), 1)}×.`);
    done();
  }
  draw();
  wrap.append(head, cards, ctl, msg);
}

// Misi Duel Kartu: for each n, tap the formula card that is larger (or "sama").
function duelRound(wrap, ctx, { a, b, ns, done }) {
  let s = 0;
  const board = el('div', { class: 'pk6-duel' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu rumus yang hasilnya lebih besar untuk n ini, atau "sama".');
  const draw = (tilt = 0, vals = null) => {
    const n = ns[Math.min(s, ns.length - 1)];
    fill(board,
      el('div', { class: 'pk6-n' }, el('span', null, 'n = ', el('b', null, fmt(n))), el('small', null, `ronde ${Math.min(s + 1, ns.length)} dari ${ns.length}`)),
      el('div', { class: 'pk6-jungkat', style: { '--t': `${tilt * 9}deg` } },
        onTap(el('button', { class: 'pk6-rumus', type: 'button', 'data-pilih': 'a' }, el('b', null, a[0]), el('span', null, vals ? fmt(vals[0]) : '?')), () => answer('a')),
        onTap(el('button', { class: 'pk6-sama', type: 'button', 'data-pilih': 'sama' }, '= sama'), () => answer('sama')),
        onTap(el('button', { class: 'pk6-rumus', type: 'button', 'data-pilih': 'b' }, el('b', null, b[0]), el('span', null, vals ? fmt(vals[1]) : '?')), () => answer('b'))));
  };
  function answer(p) {
    if (s >= ns.length) return;
    const n = ns[s];
    const va = a[1](n);
    const vb = b[1](n);
    const want = Math.abs(va - vb) < 1e-9 ? 'sama' : va > vb ? 'a' : 'b';
    if (p !== want) { ctx.mistake(); shake(board); say(msg, 'bad', `Hitung dulu: untuk n = ${fmt(n)}, ${a[0]} = ? dan ${b[0]} = ?`); return; }
    ctx.sound.good();
    draw(want === 'a' ? 1 : want === 'b' ? -1 : 0, [va, vb]);
    say(msg, 'info', `n = ${fmt(n)}: ${a[0]} = ${fmt(va)}, ${b[0]} = ${fmt(vb)}.`);
    s++;
    if (s === ns.length) { say(msg, '', `${a[0]} dan ${b[0]} bertukar tempat: untuk n kecil yang satu menang, untuk n besar yang tumbuh lebih cepat selalu menang. Notasi O melihat n besar.`); done(); return; }
    setTimeout(() => draw(), 1800);
  }
  draw();
  wrap.append(board, msg);
}

const digitSum = (c) => [...String(c)].reduce((t, d) => t + Number(d), 0);
const HEAD06 = {
  mesinA: ['Mesin A: Semua Pasangan', 'Pendaftar ke-1 dibandingkan dengan semua, lalu ke-2 dengan sisanya, dan seterusnya. Tangkap kode kembar!'],
  mesinB: ['Mesin B: Urutkan, Lalu Tetangga', 'Jajarkan kartu dari kode terkecil, lalu mesin hanya membandingkan tetangga.'],
  laci: ['Laci Hash', 'Kartu masuk laci menurut aturan. Kode hanya dibandingkan dengan isi laci yang sama.'],
  waktu: ['Mesin Waktu', 'Pendaftar se-provinsi: 1.000.000. Data ganda harus diperiksa setiap 10 menit.'],
  batas: ['Batas Mesin A', 'Seberapa besar n yang masih sanggup dilayani Mesin A?'],
  tumbuh: ['Kartu Pertumbuhan', 'Susun enam kartu dari yang tumbuh paling lambat. Bayangkan n = 1.000.000.'],
  duel: ['Duel Kartu', 'Dua rumus beradu. Mana yang lebih besar?'],
  boss: ['Laci Macet', 'Pendaftar dari satu wilayah. Aturan laci memakai dua angka pertama…'],
};

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
  goal: 'Murid menjadi tim server yang memburu kode kembar dengan tiga mesin (semua pasangan, urutkan lalu tetangga, laci hash) sambil memberi turus setiap langkah, memakai mesin waktu untuk melihat mesin mana yang lolos tenggat saat pendaftarnya sejuta, mengurutkan kartu pertumbuhan, dan memperbaiki aturan laci yang membuat semua kode masuk satu laci.',
  extraModes: [
    { id: 'kalkulator', icon: '📈', label: 'Kalkulator Pertumbuhan', desc: 'Geser n dari 10 sampai 1.000.000; layar menghitung langkah dan waktu cara A, B, dan C serta menggambar grafiknya, dengan sumbu biasa atau logaritma', create: createCalc },
    { id: 'laci', icon: '🗄️', label: 'Laci Hash', desc: 'Kartu pendaftar masuk ke laci menurut aturan yang dipilih (angka terakhir, dua angka pertama, atau rumus pengaduk) dengan penghitung perbandingan', create: createDrawers },
    { id: 'giliran', icon: '🔁', label: 'Mana Lebih Besar?', desc: 'Setiap tim mendapat dua rumus dan menebak mana yang lebih besar untuk n yang disebut layar; grafiknya lalu ditampilkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pendaftaran pk6-main' });
    root.append(wrap);
    const race = ctx.mode === 'race';
    const randCodes = (n) => { const out = new Set(); while (out.size < n - 1) out.add(ctx.rand.int(1000, 9999)); const a = [...out]; a.splice(ctx.rand.int(Math.floor(n / 2), n - 1), 0, a[ctx.rand.int(0, Math.floor(n / 3))]); return a; };
    const mix = randCodes(race ? 8 : 10);
    const region = (() => { const out = new Set(); while (out.size < 11) out.add(3200 + ctx.rand.int(0, 99)); const a = [...out]; a.splice(8, 0, a[2]); return a; })();
    const allPairsOf = (n) => { const p = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) p.push([i, j]); return p; };
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD06[key], '🖥️'));
      if (r === 0) { head('mesinA', 1); scanRound(wrap, ctx, { codes: KODE, pairs: allPairsOf(12), done: () => next(5200), end: (k, f) => `Selesai: ${k} perbandingan = 11 + 10 + … + 1 = n(n − 1) : 2. Kembar (#${f[0] + 1} dan #${f[1] + 1}) tertangkap di perbandingan ke-37.` }); }
      else if (r === 1) {
        head('mesinB', 1);
        const sorted = [...KODE].sort((x, y) => x - y);
        tapOrder(wrap, ctx, { prompt: 'Ketuk kartu dari kode terkecil.', items: KODE.map(String), order: sorted.map(String), hint: 'Mengurutkan 12 kartu butuh paling banyak 33 perbandingan.', done: () => {
          wrap.replaceChildren();
          head('mesinB', 1);
          scanRound(wrap, ctx, { codes: sorted, pairs: sorted.slice(1).map((_, i) => [i, i + 1]), labels: sorted.map((_, i) => `${i + 1}`), manualFirst: 99, done: () => next(5200), end: (k) => `${k} perbandingan tetangga. Kode kembar pasti bersebelahan setelah diurutkan. Total paling banyak 33 + 11 = 44, bukan 66.` });
        } });
      } else if (r === 2) { head('laci', 2); drawerRound(wrap, ctx, { codes: KODE, labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rule: (c) => c % 10, explain: (c) => `Aturan: angka terakhir. ${c} masuk laci ${c % 10}.`, prompt: 'Aturan laci: angka terakhir kode. Ketuk laci untuk kartu yang datang.', done: () => next(5200), end: ({ cmp, steps, dup }) => `${cmp} perbandingan + 12 langkah memilih laci = ${steps} langkah. Kembar tertangkap saat pendaftar ${dup} datang.` }); }
      else if (r === 3) { head('tumbuh', 4); tapOrder(wrap, ctx, { prompt: 'Ketuk dari yang tumbuh paling lambat.', items: ctx.rand.shuffle(GROWTH.map((g) => g[0])), order: GROWTH.map((g) => g[0]), hint: 'Untuk n = 1.000.000: log₂ n ≈ 20, n log₂ n ≈ 20 juta, n² = 10¹², dan 2ⁿ jauh lebih besar lagi.', cls: 'pd-rumus', done: () => next() }); }
      else if (r === 4) { head('waktu', 3); timeRound(wrap, ctx, { mode: 'pilih', n0: 1e6, deadline: 600, done: () => next(5600) }); }
      else if (r === 5) { head('laci', 2); drawerRound(wrap, ctx, { codes: mix, labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rule: (c) => digitSum(c) % 10, explain: (c) => `Rumus pengaduk: jumlahkan angkanya. ${[...String(c)].join(' + ')} = ${digitSum(c)}, angka terakhirnya ${digitSum(c) % 10}.`, prompt: 'Rumus pengaduk: jumlahkan keempat angka kode; laci = angka terakhir jumlahnya.', done: () => next(5200), end: ({ cmp, steps }) => `${cmp} perbandingan + ${mix.length} langkah memilih laci = ${steps} langkah. Semua pasangan butuh ${mix.length * (mix.length - 1) / 2}.` }); }
      else if (r === 6) { head('duel', 4); duelRound(wrap, ctx, { a: ['100n', (n) => 100 * n], b: ['n²', (n) => n * n], ns: [10, 100, 1000], done: () => next(5600) }); }
      else if (r === 7) { head('batas', 3); timeRound(wrap, ctx, { mode: 'batas', n0: 1000, deadline: 600, done: () => next(6000) }); }
      else if (r === 8) { head('duel', 4); duelRound(wrap, ctx, { a: ['5n', (n) => 5 * n], b: ['n log₂ n', (n) => n * Math.log2(n)], ns: [16, 32, 1024], done: () => next(5600) }); }
      else {
        head('boss', 'Bos');
        const fix = onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'perbaiki' }, '🔧 Ganti aturan: angka terakhir'), () => {
          wrap.replaceChildren();
          head('boss', 'Bos');
          drawerRound(wrap, ctx, { codes: region, labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rule: (c) => c % 10, explain: (c) => `Angka terakhir ${c} adalah ${c % 10}.`, prompt: 'Aturan baru: angka terakhir. Masukkan lagi kartu yang sama.', done: () => next(5600), end: ({ cmp, steps }) => `Kini hanya ${cmp} perbandingan (${steps} langkah). Aturan laci yang baik menyebar kode, sehingga hash tetap O(n).` });
        });
        drawerRound(wrap, ctx, { codes: region, labels: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39], rule: (c) => Math.floor(c / 100), explain: (c) => `Dua angka pertama ${c} adalah ${Math.floor(c / 100)}.`, prompt: 'Aturan laci: dua angka pertama kode. Semua pendaftar dari wilayah 32…', done: () => wrap.append(el('div', { class: 'kode-baris' }, fix)), end: ({ cmp, steps }) => `Semua masuk satu laci: ${cmp} perbandingan (${steps} langkah dengan memilih laci), sama buruknya dengan Mesin A. Untuk sejuta NIK: 499.999.500.000 perbandingan ≈ 83 menit.` });
      }
    }
    render();
  },
};

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
