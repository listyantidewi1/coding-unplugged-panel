// Sandi Geser dan Pantun Rahasia — SMP (13–15 tahun), kriptografi dasar.
// A shift cipher replaces each letter k places later; letter frequency
// (A is the most common letter in Bahasa Indonesia) cracks it fast. Counting
// key and password possibilities shows why length matters, and a pantun
// acrostic hides that a message exists at all.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const shift = (s, k) => s.replace(/[A-Z]/g, (c) => AZ[(AZ.indexOf(c) + k + 26 * 10) % 26]);
export function freq(s) {
  const f = Object.fromEntries([...AZ].map((c) => [c, 0]));
  for (const c of s) if (f[c] !== undefined) f[c]++;
  return f;
}
export const top = (s) => Object.entries(freq(s)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
export const keyFromTop = (s) => (AZ.indexOf(top(s)[0]) + 26) % 26;
// Approximate letter frequencies (%) in Bahasa Indonesia text.
export const INDO = { A: 19.2, B: 2.6, C: 0.7, D: 4.1, E: 7.8, F: 0.2, G: 3.6, H: 2.4, I: 8.0, J: 0.9, K: 5.4, L: 3.4, M: 4.1, N: 9.4, O: 2.3, P: 2.5, Q: 0, R: 4.7, S: 4.3, T: 4.9, U: 5.0, V: 0.2, W: 0.6, X: 0, Y: 1.8, Z: 0.1 };
export const CRACK = 'TKXQKX VEZK WOWLKGK LOUKV WKUKX CSKXQ NKX KSB WSXEW CKKD USDK LOBTKVKX UO KSB DOBTEX';
export const PANTUN = ['Air sungai mengalir tenang,', 'Udang kecil di balik batu,', 'Lekas datang jangan bimbang,', 'Aku menunggu di tempat itu.'];
const SENTENCES = ['KITA BERTEMU DI PERPUSTAKAAN SETELAH ISTIRAHAT', 'JANGAN LUPA MEMBAWA BUKU GAMBAR BESOK PAGI', 'LATIHAN PRAMUKA DIMULAI PUKUL TIGA SORE', 'TOLONG SIMPAN KUNCI LOKER DI TAS BIRU', 'KELAS KITA MENANG LOMBA KEBERSIHAN MINGGU INI'];
export const SPEED = 1e9;
export function humanTime(sec) {
  if (sec < 1) return `${sec.toLocaleString('id-ID', { maximumSignificantDigits: 2 })} detik (seketika)`;
  const units = [[31557600, 'tahun'], [86400, 'hari'], [3600, 'jam'], [60, 'menit'], [1, 'detik']];
  for (const [u, n] of units) if (sec >= u) { const v = sec / u; return `${v >= 1e6 ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} juta` : v.toLocaleString('id-ID', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${n}`; }
  return '';
}

// Cipher wheel: outer ring plain letters, inner ring cipher letters rotated
// by the key. Drag around the centre or use −/+ to turn it.
function wheel(getKey, setKey, { fixed = false } = {}) {
  const box = el('div', { class: 'sg-roda' });
  function draw() {
    const k = getKey();
    const ring = (r, rot, cls) => [...AZ].map((c, i) => { const a = ((i - rot) * 2 * Math.PI) / 26; return `<text x="${50 + r * Math.sin(a)}" y="${50 - r * Math.cos(a) + 1.6}" class="${cls}">${c}</text>`; }).join('');
    box.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" class="luar"/><circle cx="50" cy="50" r="37" class="dalam"/><circle cx="50" cy="50" r="27" class="tengah"/>${ring(42.5, 0, 'asli')}${ring(32, k, 'sandi')}<path d="M50 3 L50 22" class="penanda"/><text x="50" y="49" class="kunci-label">kunci</text><text x="50" y="60" class="kunci">${k}</text></svg>`;
  }
  if (!fixed) {
    let drag = null;
    const angle = (e) => { const r = box.getBoundingClientRect(); return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))); };
    box.addEventListener('pointerdown', (e) => { drag = { a: angle(e), k: getKey() }; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const steps = Math.round(((angle(e) - drag.a) * 26) / (2 * Math.PI));
      const k = (((drag.k + steps) % 26) + 26) % 26;
      if (k !== getKey()) { setKey(k); draw(); }
    });
    box.addEventListener('pointerup', () => { drag = null; });
  }
  draw();
  return { el: fixed ? box : el('div', { class: 'sg-roda-wadah' }, box, el('div', { class: 'kode-baris' }, button('−', () => { setKey((getKey() + 25) % 26); draw(); }, 'small'), button('+', () => { setKey((getKey() + 1) % 26); draw(); }, 'small'))), draw };
}

function keyboard(onKey, onBack) {
  return el('div', { class: 'keys' }, [...AZ].map((ch) => onTap(el('button', { class: 'key', type: 'button' }, ch), () => onKey(ch))),
    onTap(el('button', { class: 'key wide space', type: 'button', 'aria-label': 'spasi' }, '␣'), () => onKey(' ')),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}

// Type an answer text; the wheel shows a given key for help.
function typeRound(wrap, ctx, { prompt, given, subject, want, key, done, note }) {
  let typed = '';
  let finished = false;
  let k = key ?? 0;
  const line = el('p', { class: 'sg-ketik' });
  const msg = el('p', { class: 'reveal info' }, note || 'Ketik jawabannya dengan papan huruf.');
  const draw = () => { line.textContent = `${typed}${finished ? '' : '▌'}`; };
  const w = key === null ? null : wheel(() => k, (v) => { k = v; });
  draw();
  wrap.append(...[el('p', { class: 'prompt' }, prompt), given ? el('p', { class: 'sg-pesan' }, given) : null, subject, w ? el('div', { class: 'sg-samping' }, w.el, line) : line,
    keyboard((ch) => { if (!finished && typed.length < 60) { typed += ch; ctx.sound.tap(); draw(); } }, () => { if (!finished) { typed = typed.slice(0, -1); draw(); } }),
    el('div', { class: 'kode-baris' }, button('Periksa', () => {
      if (finished) return;
      if (typed.trim().replace(/\s+/g, ' ') !== want) {
        const right = [...want].filter((c, i) => typed[i] === c).length;
        msg.className = 'reveal bad'; msg.textContent = `Belum tepat (${right} dari ${want.length} karakter sudah benar).`; ctx.mistake(); shake(line); return;
      }
      finished = true; draw(); msg.className = 'reveal'; msg.textContent = `Benar: ${want}.`; done();
    }, 'primary')), msg].filter(Boolean));
}

// Turn the wheel until the cipher text reads as a sentence.
function crackRound(wrap, ctx, { cipher, want, prompt, done }) {
  let k = 0;
  let finished = false;
  const plain = el('p', { class: 'sg-pesan terbuka' });
  const msg = el('p', { class: 'reveal info' }, 'Putar roda (seret atau −/+) sampai pesannya bermakna, lalu tekan Periksa.');
  const show = () => { plain.textContent = shift(cipher, -k); };
  const w = wheel(() => k, (v) => { k = v; show(); });
  show();
  wrap.append(el('p', { class: 'prompt' }, prompt), el('p', { class: 'sg-pesan' }, cipher), el('div', { class: 'sg-samping' }, w.el, el('div', { class: 'sg-kanan' }, freqBars(cipher, 0, { small: true }), plain)),
    el('div', { class: 'kode-baris' }, button('Periksa', () => {
      if (finished) return;
      if (k !== want) { msg.className = 'reveal bad'; msg.textContent = `Kunci ${k} belum membuat pesan bermakna. Lihat huruf tersering.`; ctx.mistake(); shake(plain); return; }
      finished = true; msg.className = 'reveal'; msg.textContent = `Kunci ${k}: ${shift(cipher, -k)}`; done();
    }, 'primary')), msg);
}

// Bars of the message's letter counts, optionally beside the Indonesian
// frequencies shifted by k (so the peaks line up at the right key).
function freqBars(text, k = null, { small = false } = {}) {
  const f = freq(text);
  const max = Math.max(...Object.values(f), 1);
  return el('div', { class: `sg-batang ${small ? 'kecil' : ''}` }, [...AZ].map((c, i) => {
    const ref = k === null ? null : INDO[AZ[(i - k + 26) % 26]];
    return el('div', { class: 'sg-kolom' }, el('div', { class: 'sg-tinggi' }, el('span', { class: 'pesan', style: `height:${(100 * f[c]) / max}%` }), ref === null ? null : el('span', { class: 'indo', style: `height:${(100 * ref) / 19.2}%` })), el('small', null, f[c] || ''), el('b', null, c));
  }));
}

export default {
  id: 'smp-18-sandi-geser',
  title: 'Sandi Geser dan Pantun Rahasia',
  topic: 'Kriptografi: sandi geser, frekuensi huruf, kata sandi, steganografi',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🔏',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menyandikan dan membaca pesan dengan sandi geser, memecahkan sandi dengan frekuensi huruf, menghitung banyak kemungkinan kata sandi, menjelaskan kata sandi yang aman, dan membedakan kriptografi dari steganografi.',
  extraModes: [
    { id: 'roda', icon: '🎡', label: 'Roda Sandi', desc: 'Putar cakram dalam; ketik pesan dan lihat sandinya langsung', create: createWheel },
    { id: 'frekuensi', icon: '📊', label: 'Penghitung Huruf', desc: 'Diagram frekuensi pesan di samping frekuensi Bahasa Indonesia; geser sampai puncaknya cocok', create: createFreq },
    { id: 'katasandi', icon: '🔑', label: 'Penghitung Kemungkinan', desc: 'Pilih panjang dan jenis karakter; lihat banyak kemungkinan dan waktu menebak (tanpa memasukkan kata sandi)', create: createPassword },
    { id: 'tim', icon: '🎯', label: 'Pecahkan Sandi Lawan', desc: 'Tim A menulis pesan dan memilih kunci; tim B memecahkannya secepat mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act sandi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) typeRound(wrap, ctx, { prompt: 'Sandikan dengan kunci 3 (huruf asli di luar, sandi di dalam).', given: 'SAYA SUKA MEMBACA', want: shift('SAYA SUKA MEMBACA', 3), key: 3, done: next });
      else if (r === 1) typeRound(wrap, ctx, { prompt: 'Sinta mengirim pesan dengan kunci 5. Apa isinya?', given: 'YJRZN FPZ IN PFSYNS', want: 'TEMUI AKU DI KANTIN', key: 5, done: next, note: 'Cari huruf sandi di cakram dalam, lalu baca huruf asli di luarnya.' });
      else if (r === 2) ask('Hitung huruf pesan ini. Huruf mana yang paling sering muncul?', [['K (17 kali)', true], ['X (8 kali)'], ['O (5 kali)'], ['A (0 kali)']], 2, el('p', { class: 'sg-pesan' }, CRACK),
        () => ask('Jika K adalah sandi untuk A, berapa kuncinya?', [[10, true], [11], [17], [3]], 4));
      else if (r === 3) crackRound(wrap, ctx, { cipher: CRACK, want: 10, prompt: 'Pecahkan pesan Raka.', done: next });
      else if (r === 4) ask('Berapa banyak kunci sandi geser yang benar-benar mengubah pesan? Jika satu kunci dicoba 10 detik, berapa lama paling lama?', [['25 kunci, 250 detik (sekitar 4 menit)', true], ['26 kunci, 260 detik'], ['25 kunci, 25 detik'], ['Tak terhingga']]);
      else if (r === 5) ask('Komputer penebak mencoba 1 miliar kata sandi per detik. PIN 4 angka dan 8 huruf kecil ditebak paling lama dalam …', [['PIN: 10.000 kemungkinan, seketika; 8 huruf kecil: sekitar 209 detik (3,5 menit)', true], ['PIN: 40 kemungkinan; 8 huruf kecil: 15 juta tahun'], ['PIN: 10.000 detik; 8 huruf kecil: 208 hari'], ['Keduanya sekitar 15 juta tahun']]);
      else if (r === 6) ask('Kata sandi "rahasia" punya lebih dari 8 miliar kemungkinan untuk 7 huruf kecil. Mengapa tetap mudah ditebak?', [['Penebak mencoba kata umum dan kata sandi yang pernah bocor lebih dulu (serangan kamus)', true], ['Karena huruf kecil lebih mudah'], ['Karena 7 adalah bilangan ganjil'], ['Tidak mudah; 8 miliar sudah aman']]);
      else if (r === 7) typeRound(wrap, ctx, { prompt: 'Baca huruf pertama setiap baris. Di mana Sinta menunggu?', subject: el('blockquote', { class: 'sg-pantun' }, ...PANTUN.map((l) => el('div', null, el('b', null, l[0]), l.slice(1)))), want: 'AULA', key: null, done: next, note: 'Ketik nama tempatnya.' });
      else if (r === 8) ask('Sandi geser menyembunyikan … pesan; pantun rahasia menyembunyikan … pesan.', [['arti; keberadaan (kriptografi dan steganografi)', true], ['keberadaan; arti'], ['panjang; rima'], ['pengirim; penerima']]);
      else { const text = ctx.rand.pick(SENTENCES); const k = ctx.rand.int(3, 23); crackRound(wrap, ctx, { cipher: shift(text, k), want: k, prompt: 'Pesan sandi baru. Temukan kuncinya!', done: next }); }
    }
    render();
  },
};

function createWheel(root, ctx) {
  const wrap = el('div', { class: 'act sandi' });
  root.append(wrap);
  let k = 3;
  let text = 'SAYA SUKA MEMBACA';
  let dir = 1;
  const out = el('p', { class: 'sg-pesan terbuka' });
  const inp = el('p', { class: 'sg-ketik' });
  const show = () => { inp.textContent = `${text}▌`; out.textContent = shift(text, dir * k); };
  const w = wheel(() => k, (v) => { k = v; show(); });
  const seg = el('div', { class: 'seg' });
  const drawSeg = () => seg.replaceChildren(...[[1, 'Sandikan'], [-1, 'Baca sandi']].map(([d, l]) => onTap(el('button', { class: `seg-btn ${dir === d ? 'on' : ''}`, type: 'button' }, l), () => { dir = d; drawSeg(); show(); })));
  drawSeg();
  show();
  wrap.append(seg, el('div', { class: 'sg-samping' }, w.el, el('div', { class: 'sg-kanan' }, el('small', null, 'Pesan'), inp, el('small', null, 'Hasil'), out)),
    keyboard((ch) => { if (text.length < 60) { text += ch; ctx.sound.tap(); show(); } }, () => { text = text.slice(0, -1); show(); }),
    el('div', { class: 'kode-baris' }, button('Hapus semua', () => { text = ''; show(); }, 'small')));
}

function createFreq(root, ctx) {
  const wrap = el('div', { class: 'act sandi' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let cipher = CRACK;
  let k = 0;
  function draw() {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('Pesan Raka', () => { cipher = CRACK; k = 0; draw(); }, 'small'), button('Pesan acak', () => { cipher = shift(rand.pick(SENTENCES), rand.int(1, 25)); k = 0; draw(); }, 'small')),
      el('p', { class: 'sg-pesan' }, cipher), freqBars(cipher, k),
      el('p', { class: 'small-note' }, el('span', { class: 'sg-kunci-pesan' }, '■ pesan'), '  ', el('span', { class: 'sg-kunci-indo' }, '■ Bahasa Indonesia (perkiraan), digeser sesuai kunci')),
      el('div', { class: 'kode-baris' }, button('−', () => { k = (k + 25) % 26; draw(); }, 'small'), el('b', { class: 'sg-k' }, `kunci ${k}`), button('+', () => { k = (k + 1) % 26; draw(); }, 'small'), button('Puncak ke huruf tersering', () => { k = keyFromTop(cipher); draw(); }, 'small')),
      el('p', { class: 'sg-pesan terbuka' }, shift(cipher, -k)));
  }
  draw();
}

const SETS = [['angka', 10, '0–9'], ['kecil', 26, 'a–z'], ['besar', 26, 'A–Z'], ['simbol', 32, '!@#…']];
function createPassword(root, ctx) {
  const wrap = el('div', { class: 'act sandi' });
  root.append(wrap);
  let len = 8;
  const on = new Set(['kecil']);
  function draw() {
    const n = SETS.filter(([id]) => on.has(id)).reduce((s, [, c]) => s + c, 0);
    const total = n ** len;
    const t = total / SPEED;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Kata sandi rekaan: pilih panjang dan jenis karakter. Layar tidak meminta kata sandi apa pun.'),
      el('div', { class: 'seg' }, SETS.map(([id, c, l]) => onTap(el('button', { class: `seg-btn ${on.has(id) ? 'on' : ''}`, type: 'button' }, `${l} (${c})`), () => { if (on.has(id) && on.size > 1) on.delete(id); else on.add(id); draw(); }))),
      el('div', { class: 'kode-baris' }, button('−', () => { len = Math.max(1, len - 1); draw(); }, 'small'), el('b', { class: 'sg-k' }, `${len} karakter`), button('+', () => { len = Math.min(24, len + 1); draw(); }, 'small')),
      el('div', { class: 'sg-hitung' }, el('div', null, el('small', null, 'Banyak kemungkinan'), el('b', null, `${n}^${len} ≈ ${total < 1e15 ? Math.round(total).toLocaleString('id-ID') : total.toExponential(2).replace('e+', ' × 10^')}`)),
        el('div', null, el('small', null, 'Waktu paling lama (1 miliar tebakan/detik)'), el('b', null, humanTime(t)))),
      el('p', { class: 'reveal info' }, 'Ingat: kata umum, nama, dan tanggal lahir ditebak lebih dulu, jadi panjang saja tidak cukup. Pakai kata sandi yang berbeda untuk setiap akun.'));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act sandi' });
  root.append(wrap);
  const score = [0, 0];
  let maker = 0;
  function makePhase() {
    let text = '';
    let k = 7;
    const line = el('p', { class: 'sg-ketik' });
    const show = () => { line.textContent = `${text}▌`; };
    const w = wheel(() => k, (v) => { k = v; });
    show();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${maker + 1}: tulis pesan rahasia dan pilih kunci (tim lain jangan melihat). Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`),
      el('div', { class: 'sg-samping' }, w.el, line), keyboard((ch) => { if (text.length < 50) { text += ch; show(); } }, () => { text = text.slice(0, -1); show(); }),
      el('div', { class: 'kode-baris' }, button('Sandikan dan serahkan ➜', () => { if (text.replace(/ /g, '').length < 8 || k === 0) { shake(line); return; } solvePhase(shift(text.trim(), k), k); }, 'primary')),
      el('p', { class: 'small-note' }, 'Pesan minimal 8 huruf; kunci tidak boleh 0.'));
  }
  function solvePhase(cipher, key) {
    const solver = 1 - maker;
    const t0 = performance.now();
    wrap.replaceChildren();
    crackRound(wrap, ctx, { cipher, want: key, prompt: `Tim ${solver + 1}: pecahkan sandi ini secepat mungkin!`, done: () => {
      const sec = Math.round((performance.now() - t0) / 1000);
      score[solver] += sec <= 60 ? 3 : sec <= 120 ? 2 : 1;
      ctx.sound.win();
      maker = solver;
      wrap.append(el('p', { class: 'reveal' }, `Terpecahkan dalam ${sec} detik.`), el('div', { class: 'kode-baris' }, button('Giliran berikutnya ➜', makePhase, 'primary')));
    } });
  }
  makePhase();
}
