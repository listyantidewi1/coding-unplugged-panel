// Mesin Kembalian Warung — SMP (13–15 tahun), pseudocode dan tabel jejak.
// Dika's change program takes the largest note first (greedy). Pupils trace
// it line by line, find the bug hidden by writing JIKA instead of SELAMA,
// handle underpayment, count notes, and see greedy fail for coins 4, 3, 1.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const PECAHAN = [50000, 20000, 10000, 5000, 2000, 1000, 500];
export const rp = (n) => `Rp${n.toLocaleString('id-ID')}`;
const num = (n) => n.toLocaleString('id-ID');
export const CODE = [
  'BACA harga, bayar',
  'kembalian ← bayar − harga',
  'pecahan ← [50000, 20000, 10000, 5000, 2000, 1000, 500]',
  'UNTUK SETIAP p DALAM pecahan',
  '    SELAMA kembalian ≥ p',
  '        TAMPILKAN p',
  '        kembalian ← kembalian − p',
  'TAMPILKAN "selesai"',
];

// opts.jika: line 5 is JIKA (runs at most once); opts.stock: notes left per value.
export function greedy(k, coins = PECAHAN, { jika = false, stock = null } = {}) {
  const out = [];
  for (const p of coins) {
    let left = stock ? stock[p] ?? Infinity : Infinity;
    while (k >= p && left > 0) { out.push(p); k -= p; left--; if (jika) break; }
  }
  return out;
}
// Trace rows of the SELAMA checks: [p, ya, shown, after].
export function trace(k) {
  const rows = [];
  for (const p of PECAHAN) {
    while (k >= p) { k -= p; rows.push([p, true, p, k]); }
    rows.push([p, false, null, k]);
  }
  return rows;
}
export function optimal(k, coins) {
  const best = [[]];
  for (let v = 1; v <= k; v++) {
    best[v] = null;
    for (const c of coins) if (c <= v && best[v - c] && (!best[v] || best[v - c].length + 1 < best[v].length)) best[v] = [...best[v - c], c];
  }
  return best[k] ? best[k].sort((a, b) => b - a) : null;
}
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export function grouped(out) {
  const g = [];
  for (const p of out) { if (g.length && g.at(-1)[0] === p) g.at(-1)[1]++; else g.push([p, 1]); }
  return g;
}
// Step-by-step run for the tracer; yields { line, k, p, out, note }.
export function* steps(harga, bayar, { jika = false, check = false, stock = null } = {}) {
  const out = [];
  yield { line: 0, k: null, p: null, out, note: `harga = ${num(harga)}, bayar = ${num(bayar)}` };
  if (check && bayar < harga) { yield { line: 1, k: null, p: null, out, note: `Uang kurang ${num(harga - bayar)}`, short: true }; return; }
  let k = bayar - harga;
  yield { line: 1, k, p: null, out, note: `kembalian = ${num(bayar)} − ${num(harga)} = ${num(k)}` };
  yield { line: 2, k, p: null, out, note: 'daftar pecahan siap' };
  const left = stock ? { ...stock } : null;
  for (const p of PECAHAN) {
    yield { line: 3, k, p, out, note: `p = ${num(p)}` };
    for (;;) {
      const ok = k >= p && (!left || (left[p] ?? 1) > 0);
      yield { line: 4, k, p, out, note: `${num(k)} ≥ ${num(p)}${left ? ` dan stok ${left[p] ?? '∞'} > 0` : ''}? ${ok ? 'ya' : 'tidak'}` };
      if (!ok) break;
      out.push(p);
      yield { line: 5, k, p, out, note: `tampil ${num(p)}`, give: p };
      k -= p;
      if (left && left[p] !== undefined) left[p]--;
      yield { line: 6, k, p, out, note: `kembalian = ${num(k)}` };
      if (jika) break;
    }
  }
  yield { line: 7, k, p: null, out, note: k > 0 ? `selesai, tetapi masih kurang ${num(k)}` : 'selesai', end: true };
}

const noteEl = (p, extra = {}) => el('span', { class: `kb-uang ${p >= 1000 ? 'kertas' : 'koin'} u${p}`, ...extra }, p >= 1000 ? `${p / 1000}rb` : String(p));
function codeView(lines, at = -1, jika = false) {
  return el('pre', { class: 'kb-kode' }, ...lines.map((l, i) => el('span', { class: `kb-baris ${i === at ? 'nyala' : ''}` }, el('i', null, i + 1), jika && i === 4 ? '    JIKA kembalian ≥ p MAKA' : l)));
}

// Trace table: answer each check with ya/tidak; after "ya" type the new value.
function traceRound(wrap, ctx, { harga, bayar, done }) {
  const want = trace(bayar - harga);
  let i = 0;
  let typing = false;
  let typed = '';
  let finished = false;
  const stage = el('div', { class: 'kb-samping' });
  const msg = el('p', { class: 'reveal info' });
  const out = () => want.slice(0, i).filter((r) => r[1]).map((r) => r[2]);
  function draw(note) {
    const cur = want[i];
    msg.className = note ? 'reveal bad' : finished ? 'reveal' : 'reveal info';
    msg.textContent = note || (finished ? `Keluaran: ${out().map(num).join(', ')}, selesai.` : typing ? `Tampil ${num(cur[0])}. kembalian sesudahnya = …` : `p = ${num(cur[0])}. Apakah kembalian ≥ p?`);
    stage.replaceChildren(codeView(CODE, finished ? 7 : typing ? 6 : 4),
      el('div', { class: 'kb-kanan' }, el('table', { class: 'kls-tabel kb-tabel' }, el('thead', null, el('tr', null, ...['p', 'kembalian ≥ p?', 'Ditampilkan', 'kembalian sesudahnya'].map((h) => el('th', null, h)))),
        el('tbody', null, ...want.slice(0, i).map((r) => el('tr', null, el('td', null, num(r[0])), el('td', null, r[1] ? 'ya' : 'tidak'), el('td', null, r[1] ? num(r[2]) : '–'), el('td', null, num(r[3])))),
          ...(finished ? [] : [el('tr', { class: 'kb-isi' }, el('td', null, num(cur[0])), el('td', null, typing ? 'ya' : '?'), el('td', null, typing ? num(cur[0]) : ''), el('td', null, typing ? typed || '…' : ''))]))),
      el('div', { class: 'kb-tangan' }, ...out().map((p) => noteEl(p)))));
  }
  function answer(ya) {
    if (finished || typing) return;
    const cur = want[i];
    if (ya !== cur[1]) { ctx.mistake(); shake(stage); draw(`Bandingkan: kembalian sekarang ${num(i ? want[i - 1][3] : bayar - harga)}, p = ${num(cur[0])}.`); return; }
    ctx.sound.tap();
    if (ya) { typing = true; typed = ''; draw(); return; }
    i++;
    if (i === want.length) { finished = true; draw(); done(); return; }
    draw();
  }
  function enter() {
    if (!typing) return;
    const cur = want[i];
    if (Number(typed) !== cur[3]) { ctx.mistake(); shake(stage); typed = ''; draw(`Hitung lagi: ${num(i ? want[i - 1][3] : bayar - harga)} − ${num(cur[0])}.`); return; }
    typing = false;
    i++;
    ctx.sound.good();
    draw();
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (typing && typed.length < 6) { typed += d; draw(); } })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { typed = typed.slice(0, -1); draw(); }));
  wrap.append(el('p', { class: 'prompt' }, `Harga ${rp(harga)}, bayar ${rp(bayar)}. kembalian awal = ${num(bayar - harga)}. Jalankan baris 4–7.`), stage,
    el('div', { class: 'kode-baris' }, button('ya', () => answer(true), 'primary'), button('tidak', () => answer(false), 'primary'), pad, button('OK', enter, 'primary')), msg);
}

// Build the program's output from the note tray.
function outputRound(wrap, ctx, { harga, bayar, want, prompt, done }) {
  const out = [];
  let finished = false;
  const tray = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk uang sesuai urutan keluaran program, lalu tekan Periksa.');
  function draw() {
    tray.replaceChildren(el('div', { class: 'kb-laci' }, PECAHAN.map((p) => onTap(noteEl(p, { role: 'button', 'data-p': p }), () => { if (!finished && out.length < 12) { out.push(p); ctx.sound.tap(); draw(); } }))),
      el('div', { class: 'kb-tangan' }, ...(out.length ? out.map((p) => noteEl(p)) : [el('span', { class: 'small-note' }, 'keluaran: …')])),
      el('p', { class: 'kb-jumlah' }, `Jumlah ${rp(sum(out))} · ${out.length} lembar`));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt || `Harga ${rp(harga)}, bayar ${rp(bayar)}. Apa keluaran program Dika?`), tray,
    el('div', { class: 'kode-baris' }, button('↶ Hapus satu', () => { if (!finished) { out.pop(); draw(); } }, 'small'), button('Periksa', () => {
      if (finished) return;
      if (out.join() !== want.join()) { msg.className = 'reveal bad'; msg.textContent = sum(out) !== bayar - harga ? `Jumlahnya ${rp(sum(out))}, kembalian seharusnya ${rp(bayar - harga)}.` : 'Jumlahnya benar, tetapi program Dika selalu mengambil pecahan terbesar dulu.'; ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Benar: ${want.map(num).join(', ')}, selesai. ${want.length} lembar.`;
      done();
    }, 'primary')), msg);
}

// Fill the blanks of the counting version (soal 6).
function blanksRound(wrap, ctx, { done }) {
  const BLANKS = [['banyak ← …', ['0', '1', 'p', 'kembalian'], '0'], ['banyak ← …', ['banyak + 1', 'banyak − 1', 'p', '1'], 'banyak + 1'], ['JIKA … MAKA', ['banyak > 0', 'kembalian > 0', 'p > 0', 'banyak = 1'], 'banyak > 0']];
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih isian untuk setiap titik-titik.');
  const show = (i) => pick[i] ?? '……';
  function draw(bad = []) {
    stage.replaceChildren(el('pre', { class: 'kb-kode' }, `UNTUK SETIAP p DALAM pecahan\n    banyak ← ${show(0)}\n    SELAMA kembalian ≥ p\n        banyak ← ${show(1)}\n        kembalian ← kembalian − p\n    JIKA ${show(2)} MAKA\n        TAMPILKAN p, "×", banyak`),
      el('div', { class: 'ab-lapisan' }, BLANKS.map(([label, opts], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, `${i + 1}. ${label}`),
        el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: `seg-btn ${pick[i] === o ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-o': o }, o), () => { if (!finished) { pick[i] = o; draw(); } })))))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Bu Wati ingin tampilan "20000 × 2". Lengkapi pseudocode.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = BLANKS.map(([, , w], i) => (pick[i] !== w ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} isian belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Keluaran untuk 93.000: ${grouped(greedy(93000)).map(([p, n]) => `${p} × ${n}`).join(', ')}.`;
    done();
  }, 'primary')), msg);
}

export default {
  id: 'smp-15-kembalian',
  title: 'Mesin Kembalian Warung',
  topic: 'Pseudocode, tabel jejak, pengujian, dan algoritma rakus',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🧾',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid menjalankan pseudocode dengan tabel jejak, menemukan bug dengan data uji yang tepat, menangani uang kurang, menghitung banyak lembar, dan melihat kapan algoritma rakus gagal.',
  extraModes: [
    { id: 'penjejak', icon: '👣', label: 'Penjejak Pseudocode', desc: 'Masukkan harga dan bayar, lalu jalankan baris demi baris; ganti program dengan versi teman yang berbug', create: createTracer },
    { id: 'khayalan', icon: '🪙', label: 'Negeri Khayalan', desc: 'Atur nilai koin sendiri dan bandingkan cara rakus dengan jawaban terbaik', create: createCoins },
    { id: 'tim', icon: '🎯', label: 'Tebak Keluaran', desc: 'Tim A memilih harga dan bayar, tim B menebak keluarannya; lalu bertukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kembalian' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) traceRound(wrap, ctx, { harga: 13500, bayar: 50000, done: next });
      else if (r === 1) outputRound(wrap, ctx, { harga: 7000, bayar: 100000, want: greedy(93000), done: next });
      else if (r === 2) outputRound(wrap, ctx, { harga: 18500, bayar: 20000, want: greedy(1500), done: next });
      else if (r === 3) ask('Teman Dika menulis JIKA di baris 5, bukan SELAMA. Untuk kembalian 93.000, keluarannya …', [['50000, 20000, 10000, 5000, 2000, 1000, 500: jumlahnya 88.500, kurang 4.500', true], ['50000, 20000, 20000, 2000, 1000: benar'], ['50000 saja'], ['Tidak ada keluaran']], 1, codeView(CODE, 4, true));
      else if (r === 4) ask('Dengan kembalian 36.500, program yang memakai JIKA kebetulan benar. Mengapa uji itu saja tidak cukup?', [['Setiap pecahan hanya dibutuhkan paling banyak sekali; bug baru terlihat bila pecahan dibutuhkan dua kali, seperti dua lembar Rp20.000', true], ['Karena 36.500 terlalu besar'], ['Karena program dengan JIKA selalu benar'], ['Karena komputer salah menghitung']]);
      else if (r === 5) ask('Harga Rp25.000, pembeli membayar Rp20.000. Apa yang ditampilkan program Dika?', [['Hanya "selesai": kembalian −5.000 tidak pernah ≥ p, tanpa pesan uang kurang', true], ['"Uang kurang 5000"'], ['−5000'], ['Program berhenti dengan galat']]);
      else if (r === 6) blanksRound(wrap, ctx, { done: next });
      else if (r === 7) ask('Di negeri khayalan koinnya 4, 3, dan 1. Kembalian 6 dengan cara rakus dan dengan koin paling sedikit?', [['Rakus 4 + 1 + 1 (3 koin); terbaik 3 + 3 (2 koin)', true], ['Rakus 3 + 3 (2 koin); terbaik 4 + 1 + 1'], ['Keduanya 4 + 1 + 1'], ['Keduanya 3 + 3']]);
      else {
        const bayar = ctx.rand.pick([20000, 50000, 100000]);
        const harga = ctx.rand.int(1, bayar / 500 - 1) * 500;
        outputRound(wrap, ctx, { harga, bayar, want: greedy(bayar - harga), done: next });
      }
    }
    render();
  },
};

// Keypad-typed rupiah amount.
function amountPad(get, set, redraw) {
  return el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { set(Math.min(999999, Number(String(get()) + d))); redraw(); })),
    onTap(el('button', { class: 'key', type: 'button' }, '000'), () => { set(Math.min(999999, get() * 1000)); redraw(); }),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { set(Math.floor(get() / 10)); redraw(); }));
}

function createTracer(root, ctx) {
  const wrap = el('div', { class: 'act kembalian' });
  root.append(wrap);
  let harga = 13500;
  let bayar = 50000;
  let field = 'harga';
  const opt = { jika: false, check: false, stock: null };
  let gen;
  let st;
  const found = [];
  const reset = () => { gen = steps(harga, bayar, opt); st = gen.next().value; draw(); };
  function finish() {
    const k = bayar - harga;
    const right = k < 0 ? 'uang kurang' : greedy(k).join(',');
    const got = st.short ? 'uang kurang' : st.out.join(',');
    if (got !== right && !found.some((f) => f.h === harga && f.b === bayar)) found.push({ h: harga, b: bayar, got, right });
  }
  function draw() {
    const lines = opt.check ? ['BACA harga, bayar', 'JIKA bayar < harga MAKA TAMPILKAN "Uang kurang" SELAIN ITU kembalian ← bayar − harga', ...CODE.slice(2)] : CODE;
    wrap.replaceChildren(
      el('div', { class: 'ab-pilihan' }, el('span', null, 'Program'), el('div', { class: 'seg' },
        onTap(el('button', { class: `seg-btn ${opt.jika ? 'on' : ''}`, type: 'button' }, 'Baris 5: JIKA (teman)'), () => { opt.jika = !opt.jika; reset(); }),
        onTap(el('button', { class: `seg-btn ${opt.check ? 'on' : ''}`, type: 'button' }, 'Cek uang kurang'), () => { opt.check = !opt.check; reset(); }),
        onTap(el('button', { class: `seg-btn ${opt.stock ? 'on' : ''}`, type: 'button' }, 'Stok Rp20.000 habis'), () => { opt.stock = opt.stock ? null : { 20000: 0 }; reset(); }))),
      el('div', { class: 'kb-samping' }, codeView(lines, st.line, opt.jika), el('div', { class: 'kb-kanan' },
        el('div', { class: 'kb-var' }, ...[['harga', harga], ['bayar', bayar]].map(([n, v]) => onTap(el('button', { class: `ck-isi lebar ${field === n ? 'fokus' : ''}`, type: 'button' }, `${n} = ${num(v)}`), () => { field = n; draw(); })),
          el('span', null, `kembalian = ${st.k === null ? '?' : num(st.k)}`), el('span', null, `p = ${st.p === null ? '?' : num(st.p)}`)),
        el('p', { class: 'kb-catatan' }, st.note),
        el('div', { class: 'kb-tangan' }, ...st.out.map((p) => noteEl(p))),
        found.length ? el('div', { class: 'small-note kb-temuan' }, el('b', null, 'Uji yang menemukan bug:'), ...found.map((f) => el('div', null, `${rp(f.h)} / ${rp(f.b)}: keluar ${f.got || '(kosong)'}, seharusnya ${f.right}`))) : null)),
      el('div', { class: 'kode-baris' }, amountPad(() => (field === 'harga' ? harga : bayar), (v) => { if (field === 'harga') harga = v; else bayar = v; }, reset),
        button('Langkah ➜', () => { if (st.end || st.short) return; const n = gen.next(); if (!n.done) { st = n.value; ctx.sound.tap(); if (st.end || st.short) finish(); } draw(); }, 'primary'),
        button('Sampai selesai', () => { for (let n = gen.next(); !n.done; n = gen.next()) st = n.value; finish(); draw(); }, 'small'), button('Ulangi', reset, 'small')));
  }
  reset();
}

function createCoins(root, ctx) {
  const wrap = el('div', { class: 'act kembalian' });
  root.append(wrap);
  const coins = [4, 3, 1];
  let k = 6;
  function draw() {
    const c = [...new Set(coins)].sort((a, b) => b - a);
    const g = greedy(k, c);
    const o = optimal(k, c);
    const fails = [];
    for (let v = 1; v <= 60 && fails.length < 12; v++) { const gv = greedy(v, c); const ov = optimal(v, c); if (ov && (sum(gv) !== v || gv.length > ov.length)) fails.push(v); }
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Negeri khayalan: atur nilai koin dan kembaliannya.'),
      el('div', { class: 'kb-koin-atur' }, ...coins.map((v, i) => el('div', { class: 'kb-koin-satu' }, button('−', () => { coins[i] = Math.max(1, v - 1); draw(); }, 'small'), el('span', { class: 'kb-uang koin' }, String(v)), button('+', () => { coins[i] = Math.min(25, v + 1); draw(); }, 'small'))),
        el('div', { class: 'kb-koin-satu' }, el('b', null, 'Kembalian'), button('−', () => { k = Math.max(1, k - 1); draw(); }, 'small'), el('b', { class: 'kb-k' }, String(k)), button('+', () => { k = Math.min(60, k + 1); draw(); }, 'small'))),
      el('div', { class: 'salam-dua' },
        el('div', { class: 'salam-cara' }, el('b', null, 'Cara rakus'), el('div', { class: 'kb-tangan' }, ...g.map((v) => el('span', { class: 'kb-uang koin' }, String(v)))), el('p', null, sum(g) === k ? `${g.length} koin` : `macet: sisa ${k - sum(g)}`)),
        el('div', { class: 'salam-cara' }, el('b', null, 'Paling sedikit'), el('div', { class: 'kb-tangan' }, ...(o || []).map((v) => el('span', { class: 'kb-uang koin' }, String(v)))), el('p', null, o ? `${o.length} koin` : 'tidak mungkin'))),
      el('p', { class: `reveal ${fails.length ? 'bad' : ''}` }, fails.length ? `Cara rakus gagal untuk kembalian: ${fails.join(', ')}${fails.length === 12 ? ', …' : ''} (diperiksa 1–60).` : 'Untuk koin ini, cara rakus selalu terbaik (diperiksa 1–60).'));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kembalian' });
  root.append(wrap);
  const score = [0, 0];
  let setter = 0;
  function pickRound() {
    let harga = 0;
    let bayar = 50000;
    const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${setter + 1} memilih harga dan bayar. Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`),
      el('p', { class: 'kb-jumlah' }, `Harga ${rp(harga)} · Bayar ${rp(bayar)}`),
      el('div', { class: 'seg' }, [20000, 50000, 100000].map((b) => onTap(el('button', { class: `seg-btn ${bayar === b ? 'on' : ''}`, type: 'button' }, rp(b)), () => { bayar = b; draw(); }))),
      el('div', { class: 'kode-baris' }, amountPad(() => harga, (v) => { harga = v; }, draw), button('Serahkan ke lawan ➜', () => {
        if (harga % 500 || harga <= 0 || harga >= bayar) { shake(wrap); return; }
        wrap.replaceChildren();
        const guesser = 1 - setter;
        outputRound(wrap, ctx, { harga, bayar, want: greedy(bayar - harga), prompt: `Tim ${guesser + 1}: harga ${rp(harga)}, bayar ${rp(bayar)}. Tebak keluarannya!`, done: () => { score[guesser]++; ctx.sound.win(); setter = guesser; wrap.append(el('div', { class: 'kode-baris' }, button('Giliran berikutnya ➜', pickRound, 'primary'))); } });
        wrap.append(el('div', { class: 'kode-baris' }, button('Menyerah: lihat jawaban', () => { score[setter]++; setter = 1 - setter; wrap.append(el('p', { class: 'reveal' }, `Jawaban: ${greedy(bayar - harga).map(num).join(', ')}.`), el('div', { class: 'kode-baris' }, button('Giliran berikutnya ➜', pickRound, 'primary'))); }, 'small')));
      }, 'primary')), el('p', { class: 'small-note' }, 'Harga harus kelipatan Rp500 dan lebih kecil dari bayar.'));
    draw();
  }
  pickRound();
}
