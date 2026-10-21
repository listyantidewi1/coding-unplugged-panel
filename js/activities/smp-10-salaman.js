// Semua Bersalaman — SMP (13–15 tahun), banyak langkah algoritma. Everyone
// shakes hands once: n(n − 1)/2 handshakes grows much faster than n. The
// same count appears when comparing every pair of birthdays (Cara 1),
// while a 366-box calendar board needs only n steps (Cara 2).

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const pairs = (n) => (n * (n - 1)) / 2;
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const DATA = [['Adi', 3, 12], ['Bela', 7, 5], ['Cici', 11, 21], ['Dodi', 7, 5], ['Eka', 1, 30], ['Fajar', 8, 12]];
const NAMA = ['Adi', 'Bela', 'Cici', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Intan', 'Joko', 'Kiki', 'Lina', 'Made', 'Nia', 'Oki', 'Putri', 'Rudi', 'Sari', 'Tono', 'Umi'];
const tgl = ([, m, d]) => `${d} ${BULAN[m - 1]}`;
// Cara 1 visits pairs (i, j) in order until a match: the list of pairs and the hit.
export function cara1(data) {
  const seen = [];
  for (let i = 0; i < data.length - 1; i++) for (let j = i + 1; j < data.length; j++) {
    seen.push([i, j]);
    if (data[i][1] === data[j][1] && data[i][2] === data[j][2]) return { seen, hit: [i, j] };
  }
  return { seen, hit: null };
}
export function cara2(data) {
  const board = new Map();
  for (let i = 0; i < data.length; i++) {
    const k = `${data[i][1]}-${data[i][2]}`;
    if (board.has(k)) return { steps: i + 1, hit: [board.get(k), i] };
    board.set(k, i);
  }
  return { steps: data.length, hit: null };
}

export default {
  id: 'smp-10-salaman',
  title: 'Semua Bersalaman',
  topic: 'Banyak langkah algoritma: n(n − 1)/2 lawan n',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🤝',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid menemukan rumus n(n − 1)/2, membandingkan pertumbuhannya dengan n, menjalankan dua algoritma pencari ulang tahun yang sama, dan menghitung banyak langkahnya.',
  extraModes: [
    { id: 'simulasi', icon: '🔵', label: 'Simulasi Salaman', desc: 'Pilih n; garis salaman digambar satu per satu dan grafiknya terbentuk', create: createSim },
    { id: 'penjejak', icon: '📜', label: 'Penjejak Pseudocode', desc: 'Jalankan Cara 1 dan Cara 2 berdampingan langkah demi langkah', create: createTracer },
    { id: 'kalender', icon: '📅', label: 'Papan Kalender', desc: 'Isi acak 36 murid berkali-kali; berapa persen yang menemukan tanggal sama?', create: createCalendar },
    { id: 'tim', icon: '🎯', label: 'Tebak Banyak Langkah', desc: 'Tim menebak banyak perbandingan Cara 1 untuk n tertentu; tebakan terdekat menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act salaman' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) shakeRound(wrap, ctx, { n: ctx.rand.int(4, 6), done: next });
      else if (r === 1) fillNumbers(wrap, ctx, { prompt: 'Berapa salaman untuk n orang?', heads: [3, 4, 5, 6, 10, 36].map(String), want: [3, 4, 5, 6, 10, 36].map(pairs), label: 'Salaman', done: next });
      else if (r === 2) ask('Setiap orang bersalaman dengan n − 1 orang, dan setiap salaman terhitung dua kali. Jadi banyak salaman = …', [['n(n − 1)/2', true], ['n(n − 1)'], ['2n − 1'], ['n²']], 2);
      else if (r === 3) ask('Apa perbedaan bentuk kedua grafik?', [['"Hanya dengan kakak OSIS" garis lurus; "semua bersalaman" melengkung ke atas makin curam', true], ['Keduanya garis lurus'], ['"Semua bersalaman" garis lurus, yang lain melengkung'], ['Keduanya melengkung ke bawah']], 1, graph(10));
      else if (r === 4) pairRound(wrap, ctx, { data: DATA, done: next });
      else if (r === 5) calendarRound(wrap, ctx, { data: DATA, done: next });
      else if (r === 6) fillNumbers(wrap, ctx, { prompt: 'Banyak langkah bila tidak ada tanggal yang sama.', heads: ['10', '36', '100', '1.000'], rows: [['Cara 1', [10, 36, 100, 1000].map(pairs)], ['Cara 2', [10, 36, 100, 1000]]], done: next });
      else if (r === 7) ask('Satu langkah 1 detik. Untuk 1.000 murid, Cara 1 butuh sekitar … , Cara 2 sekitar …', [['139 jam; 17 menit', true], ['17 menit; 139 jam'], ['1.000 detik; 1.000 detik'], ['8 jam; 17 menit']], 2);
      else ask('Cara 3: urutkan dulu menurut tanggal lahir, lalu bandingkan yang bersebelahan. Berapa perbandingan sesudah pengurutan?', [['n − 1', true], ['n(n − 1)/2'], ['366'], ['2n']], 2);
    }
    render();
  },
};

// Dots on a circle; tap two dots to shake hands.
function circle(n, lines, { picked = null, onDot } = {}) {
  const pos = (i) => [50 + 40 * Math.sin((2 * Math.PI * i) / n), 50 - 40 * Math.cos((2 * Math.PI * i) / n)];
  const svg = el('div', { class: 'lingkar-garis' });
  svg.innerHTML = `<svg viewBox="0 0 100 100">${lines.map(([a, b]) => { const [x1, y1] = pos(a); const [x2, y2] = pos(b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join('')}</svg>`;
  return el('div', { class: 'lingkar' }, svg, ...Array.from({ length: n }, (_, i) => {
    const [x, y] = pos(i);
    const d = el('button', { class: `orang ${picked === i ? 'pilih' : ''}`, type: 'button', 'data-i': i, style: `left:${x}%;top:${y}%` }, n <= 12 ? NAMA[i][0] : '');
    return onDot ? onTap(d, () => onDot(i)) : d;
  }));
}

function graph(max, mark = null) {
  const W = 100;
  const H = 60;
  const top = pairs(max);
  const x = (n) => 8 + ((n - 0) / max) * (W - 12);
  const y = (v) => H - 6 - (v / top) * (H - 12);
  const pts = Array.from({ length: max - 1 }, (_, k) => k + 2);
  const g = el('div', { class: 'grafik-salam' });
  g.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><line x1="8" y1="${H - 6}" x2="${W - 2}" y2="${H - 6}" class="sumbu"/><line x1="8" y1="4" x2="8" y2="${H - 6}" class="sumbu"/>
    <polyline points="${pts.map((n) => `${x(n)},${y(n)}`).join(' ')}" class="lurus"/>
    <polyline points="${pts.map((n) => `${x(n)},${y(pairs(n))}`).join(' ')}" class="lengkung"/>
    ${pts.map((n) => `<circle cx="${x(n)}" cy="${y(pairs(n))}" r="${mark === n ? 1.8 : 1}" class="titik"/>`).join('')}
    <text x="${W - 2}" y="${H - 1}" text-anchor="end">n = ${max}</text><text x="10" y="7">${top} salaman</text></svg>`;
  return el('div', { class: 'grafik-wadah' }, g, el('p', { class: 'small-note grafik-ket' }, el('span', { class: 'k-lengkung' }, '● semua bersalaman'), '  ', el('span', { class: 'k-lurus' }, '— hanya dengan kakak OSIS (n)')));
}

function shakeRound(wrap, ctx, { n, done }) {
  const lines = [];
  let picked = null;
  let finished = false;
  const stage = el('div', { class: 'salam-panggung' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk dua orang untuk bersalaman. Setiap pasangan cukup sekali.');
  const has = (a, b) => lines.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
  function draw() { stage.replaceChildren(circle(n, lines, { picked, onDot: dot }), el('p', { class: 'salam-hitung' }, `${lines.length} salaman`)); }
  function dot(i) {
    if (finished) return;
    if (picked === null) { picked = i; draw(); return; }
    if (picked === i) { picked = null; draw(); return; }
    if (has(picked, i)) { msg.className = 'reveal bad'; msg.textContent = `${NAMA[picked]} dan ${NAMA[i]} sudah bersalaman.`; picked = null; draw(); return; }
    lines.push([picked, i]);
    picked = null;
    ctx.sound.tap();
    msg.className = 'reveal info';
    msg.textContent = `${lines.length} salaman.`;
    draw();
    if (lines.length === pairs(n)) {
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Semua sudah bersalaman: ${n} orang, ${pairs(n)} salaman = ${n} × ${n - 1} : 2.`;
      done();
    }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `${n} murid baru: semua bersalaman sekali.`), stage, msg);
}

// Number boxes (one row, or several labelled rows) typed with a keypad.
function fillNumbers(wrap, ctx, { prompt, heads, want, label, rows, done }) {
  const R = rows || [[label, want]];
  const keys = R.flatMap(([, w], r) => w.map((_, c) => `${r}-${c}`));
  const target = Object.fromEntries(R.flatMap(([, w], r) => w.map((v, c) => [`${r}-${c}`, v])));
  const vals = {};
  let focus = keys[0];
  let finished = false;
  const table = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kotak, lalu ketik angkanya.');
  function draw(wrong = []) {
    table.replaceChildren(el('table', { class: 'kls-tabel salam-tabel' }, el('thead', null, el('tr', null, el('th', null, 'n'), ...heads.map((h) => el('th', null, h)))),
      el('tbody', null, ...R.map(([l, w], r) => el('tr', null, el('th', null, l), ...w.map((_, c) => {
        const k = `${r}-${c}`;
        return el('td', null, onTap(el('button', { class: `ck-isi lebar ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] === undefined ? '…' : vals[k].toLocaleString('id-ID')), () => { focus = k; draw(); }));
      }))))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; vals[focus] = Number(String(vals[focus] ?? '') + d) % 1e7; ctx.sound.tap(); draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { const v = String(vals[focus] ?? ''); vals[focus] = v.length > 1 ? Number(v.slice(0, -1)) : undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, prompt), table, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const wrong = keys.filter((k) => vals[k] !== target[k]);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} kotak belum tepat. Rumusnya n × (n − 1) : 2.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = 'Benar semua.';
    done();
  }, 'primary')), msg);
}

const dataTable = (data, hi = []) => el('div', { class: 'salam-data' }, data.map((p, i) => el('span', { class: hi.includes(i) ? 'hi' : '' }, el('small', null, i + 1), el('b', null, p[0]), tgl(p))));

// Cara 1: tap the pairs (i, j) in pseudocode order until the match.
function pairRound(wrap, ctx, { data, done }) {
  const { seen, hit } = cara1(data);
  let k = 0;
  let finished = false;
  const n = data.length;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk pasangan (i, j) sesuai urutan pseudocode.');
  function draw() {
    const done2 = new Set(seen.slice(0, k).map(([i, j]) => `${i}-${j}`));
    stage.replaceChildren(dataTable(data, finished ? hit : []), el('div', { class: 'salam-kode' }, el('pre', null, 'UNTUK i ← 1 SAMPAI n − 1\n    UNTUK j ← i + 1 SAMPAI n\n        JIKA tanggal[i] = tanggal[j] MAKA\n            TAMPILKAN nama[i], nama[j]'),
      el('div', { class: 'pasangan', style: `--n:${n}` }, el('span'), ...Array.from({ length: n }, (_, j) => el('span', { class: 'pas-kepala' }, `j=${j + 1}`)),
        ...Array.from({ length: n }, (_, i) => [el('span', { class: 'pas-kepala' }, `i=${i + 1}`), ...Array.from({ length: n }, (_, j) => (j <= i ? el('span', { class: 'pas-mati' })
          : onTap(el('button', { class: `pas ${done2.has(`${i}-${j}`) ? 'sudah' : ''} ${finished && hit[0] === i && hit[1] === j ? 'kena' : ''}`, type: 'button', 'data-p': `${i}-${j}` }, done2.has(`${i}-${j}`) ? seen.findIndex(([a, b]) => a === i && b === j) + 1 : ''), () => tap(i, j))))]).flat())));
  }
  function tap(i, j) {
    if (finished) return;
    const [wi, wj] = seen[k];
    if (i !== wi || j !== wj) { msg.className = 'reveal bad'; msg.textContent = `Perbandingan berikutnya adalah (${wi + 1}, ${wj + 1}).`; ctx.mistake(); shake(stage); return; }
    k++;
    ctx.sound.tap();
    if (k === seen.length) {
      finished = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = `Perbandingan ke-${k} menemukan ${data[hit[0]][0]} dan ${data[hit[1]][0]} (${tgl(data[hit[0]])}). Tanpa berhenti ada ${pairs(n)} perbandingan.`;
      done();
      return;
    }
    msg.className = 'reveal info';
    msg.textContent = `(${i + 1}, ${j + 1}): ${tgl(data[i])} ≠ ${tgl(data[j])}. Lanjut.`;
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Jalankan Cara 1: bandingkan setiap pasangan.'), stage, msg);
}

function calendarBoard(marks, { hi = [], onCell } = {}) {
  return el('div', { class: 'kalender' }, ...BULAN.map((b, m) => [el('span', { class: 'kal-bulan' }, b.slice(0, 3)), ...Array.from({ length: 31 }, (_, d) => {
    if (d >= HARI[m]) return el('span', { class: 'kal-mati' });
    const key = `${m + 1}-${d + 1}`;
    const who = marks.get(key);
    const c = el('button', { class: `kal ${who ? 'isi' : ''} ${hi.includes(key) ? 'hi' : ''}`, type: 'button', 'data-k': key, title: `${d + 1} ${b}` }, who ? who[0] : '');
    return onCell ? onTap(c, () => onCell(m + 1, d + 1)) : c;
  })]).flat());
}

// Cara 2: write each student into the calendar board in order.
function calendarRound(wrap, ctx, { data, done }) {
  const marks = new Map();
  let i = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' });
  function draw(hi = []) {
    if (!finished) msg.textContent = `Murid ke-${i + 1}: ${data[i][0]}, ${tgl(data[i])}. Ketuk kotaknya di papan.`;
    stage.replaceChildren(dataTable(data, finished ? cara2(data).hit : [i]), calendarBoard(marks, { hi, onCell: cell }));
  }
  function cell(m, d) {
    if (finished) return;
    const [name, wm, wd] = data[i];
    if (m !== wm || d !== wd) { msg.className = 'reveal bad'; msg.textContent = `Kotak ${data[i][0]} adalah ${tgl(data[i])}.`; ctx.mistake(); shake(stage); return; }
    const key = `${m}-${d}`;
    ctx.sound.tap();
    if (marks.has(key)) {
      finished = true;
      draw([key]);
      msg.className = 'reveal';
      msg.textContent = `Murid ke-${i + 1}: kotak ${tgl(data[i])} sudah berisi ${marks.get(key)}. ${marks.get(key)} dan ${name} berulang tahun sama.`;
      done();
      return;
    }
    marks.set(key, name);
    i++;
    msg.className = 'reveal info';
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Jalankan Cara 2: tulis nama di papan kalender.'), msg, stage);
}

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act salaman' });
  root.append(wrap);
  let n = 6;
  let timer = null;
  function run() {
    clearTimeout(timer);
    const all = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b]);
    let k = 0;
    const stage = el('div', { class: 'salam-samping' });
    const step = () => {
      if (!wrap.isConnected) return;
      stage.replaceChildren(el('div', { class: 'salam-panggung' }, circle(n, all.slice(0, k)), el('p', { class: 'salam-hitung' }, `${k} salaman`)), graph(20, n));
      if (k++ < all.length) timer = setTimeout(step, Math.max(25, 900 / all.length * 3));
    };
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('−', () => { n = Math.max(2, n - 1); run(); }, 'small'), el('b', { class: 'salam-n' }, `n = ${n}`), button('+', () => { n = Math.min(20, n + 1); run(); }, 'small'), button('Ulangi', run, 'small')), stage,
      el('p', { class: 'reveal info' }, `${n} orang: ${n} × ${n - 1} : 2 = ${pairs(n)} salaman, sedangkan hanya dengan kakak OSIS cukup ${n}.`));
    step();
  }
  run();
}

function createTracer(root, ctx) {
  const wrap = el('div', { class: 'act salaman' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let data = DATA;
  let t = 0;
  function randomData() {
    const n = rand.int(6, 10);
    return Array.from({ length: n }, (_, i) => { const m = rand.int(1, 12); return [NAMA[i], m, rand.int(1, HARI[m - 1] === 29 ? 28 : HARI[m - 1])]; });
  }
  function draw() {
    const c1 = cara1(data);
    const c2 = cara2(data);
    const s1 = Math.min(t, c1.seen.length);
    const s2 = Math.min(t, c2.steps);
    const cur = c1.seen[s1 - 1];
    wrap.replaceChildren(dataTable(data, cur || []),
      el('div', { class: 'salam-dua' },
        el('div', { class: 'salam-cara' }, el('b', null, 'Cara 1: setiap pasangan'), el('p', null, cur ? `i = ${cur[0] + 1}, j = ${cur[1] + 1}` : 'belum mulai'), el('p', { class: 'salam-langkah' }, `${s1} perbandingan`), el('p', null, s1 === c1.seen.length ? (c1.hit ? `Ketemu: ${data[c1.hit[0]][0]} & ${data[c1.hit[1]][0]}` : 'Tidak ada yang sama') : '…')),
        el('div', { class: 'salam-cara' }, el('b', null, 'Cara 2: papan kalender'), el('p', null, s2 ? `i = ${s2}: ${data[s2 - 1][0]}` : 'belum mulai'), el('p', { class: 'salam-langkah' }, `${s2} langkah`), el('p', null, s2 === c2.steps ? (c2.hit ? `Ketemu: ${data[c2.hit[0]][0]} & ${data[c2.hit[1]][0]}` : 'Tidak ada yang sama') : '…'))),
      el('div', { class: 'kode-baris' }, button('Langkah ➜', () => { t++; ctx.sound.tap(); draw(); }, 'primary'), button('Sampai selesai', () => { t = 999; draw(); }, 'small'), button('Data contoh', () => { data = DATA; t = 0; draw(); }, 'small'), button('Data acak', () => { data = randomData(); t = 0; draw(); }, 'small')));
  }
  draw();
}

function createCalendar(root, ctx) {
  const wrap = el('div', { class: 'act salaman' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let trials = 0;
  let hits = 0;
  let marks = new Map();
  let hi = [];
  function once() {
    marks = new Map();
    hi = [];
    let found = false;
    for (let i = 0; i < 36; i++) {
      const m = rand.int(1, 12);
      const d = rand.int(1, m === 2 ? 28 : HARI[m - 1]);
      const key = `${m}-${d}`;
      if (marks.has(key)) { hi.push(key); found = true; } else marks.set(key, NAMA[i % NAMA.length]);
    }
    trials++;
    if (found) hits++;
  }
  function draw() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Papan kalender: 36 murid dengan tanggal lahir acak.'), calendarBoard(marks, { hi }),
      el('p', { class: 'reveal info' }, trials ? `${hi.length ? `Ada tanggal yang sama (${hi.length} kotak menyala).` : 'Tidak ada tanggal yang sama.'} Percobaan: ${trials}, menemukan tanggal sama: ${hits} (${Math.round((100 * hits) / trials)}%).` : 'Tekan Isi acak.'),
      el('div', { class: 'kode-baris' }, button('Isi acak 36 murid', () => { once(); ctx.sound.tap(); draw(); }, 'primary'), button('Ulangi 100 kali', () => { for (let k = 0; k < 100; k++) once(); draw(); }, 'small'), button('Reset', () => { trials = 0; hits = 0; marks = new Map(); hi = []; draw(); }, 'small')));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act salaman' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const score = [0, 0];
  function round() {
    const n = rand.pick([8, 12, 15, 20, 25, 30, 40, 50]);
    const guesses = ['', ''];
    let who = 0;
    const draw = (result) => wrap.replaceChildren(el('p', { class: 'prompt' }, `n = ${n} murid. Berapa perbandingan Cara 1 bila semua pasangan dibandingkan?`),
      el('div', { class: 'kop-jawab' }, ...[0, 1].map((t) => el('label', { class: 'kop-kotak' }, `Tim ${t + 1}`, onTap(el('button', { class: `ck-isi lebar ${who === t ? 'fokus' : ''}`, type: 'button' }, guesses[t] || '…'), () => { who = t; draw(); })))),
      el('div', { class: 'kode-baris' }, el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (!result) { guesses[who] = (guesses[who] + d).slice(0, 5); draw(); } })), onTap(el('button', { class: 'key wide', type: 'button' }, '⌫'), () => { guesses[who] = guesses[who].slice(0, -1); draw(); })),
        result ? button('Soal berikutnya ➜', round, 'primary') : button('Buka jawaban', () => {
          if (!guesses[0] || !guesses[1]) return;
          const d = guesses.map((g) => Math.abs(Number(g) - pairs(n)));
          if (d[0] !== d[1]) score[d[0] < d[1] ? 0 : 1]++;
          ctx.sound.win();
          draw(`Jawaban: ${n} × ${n - 1} : 2 = ${pairs(n)}. Selisih Tim 1: ${d[0]}, Tim 2: ${d[1]}.`);
        }, 'primary')),
      el('p', { class: 'reveal info' }, `${result || ''} Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`));
    draw();
  }
  round();
}
