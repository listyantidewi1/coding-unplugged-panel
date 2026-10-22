// Gembok yang Dibagikan — SMA/SMK (16–18 tahun), kriptografi kunci publik.
// A box with two padlocks, agreeing on a key in public (Diffie–Hellman with
// p = 23, g = 5), mini RSA with n = 55, digital signatures, why the numbers
// must be huge, and the person in the middle.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const P = 23; export const G = 5;
export const RSA = { n: 55, e: 3, d: 27 };
export const BIG_P = 999999999989n;
const num = (x) => Number(x).toLocaleString('id-ID');
const sup = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

export function modpow(b, e, m) { let r = 1n; let x = BigInt(b) % BigInt(m); let k = BigInt(e); const M = BigInt(m); while (k > 0n) { if (k & 1n) r = (r * x) % M; x = (x * x) % M; k >>= 1n; } return Number(r); }
// Square-and-multiply steps: squares b^(2^i), then the product over the set bits.
export function steps(b, e, m) {
  const out = []; let x = b % m; let p = 1;
  const sq = [[1, x]];
  while (p * 2 <= e) { const y = (x * x) % m; out.push({ text: p === 1 ? `${b}² = ${num(x * x)}` : `${b}${sup(p * 2)} → ${x}² = ${num(x * x)}`, val: y }); x = y; p *= 2; sq.push([p, x]); }
  const parts = sq.filter(([q]) => e & q).reverse();
  let acc = parts[0][1]; let label = `${b}${sup(parts[0][0])}`;
  for (const [q, v] of parts.slice(1)) { const prod = acc * v; label += ` × ${b}${sup(q)}`; out.push({ text: `${label} → ${acc} × ${v} = ${num(prod)}`, val: prod % m }); acc = prod % m; }
  return { steps: out, result: acc };
}
export const POWERS = Array.from({ length: 22 }, (_, i) => modpow(G, i + 1, P));
export const BOX = [['Nadia memasukkan surat dan mengunci kotak dengan gemboknya.', 0, ['N']], ['Kurir membawa kotak bergembok Nadia kepada Fajar.', 2, ['N']], ['Fajar menambahkan gemboknya sendiri, lalu mengirim kotak kembali ke Nadia.', 1, ['N', 'F']], ['Nadia membuka gemboknya sendiri, lalu mengirim kotak yang kini hanya bergembok Fajar.', 1, ['F']], ['Fajar membuka gemboknya sendiri dan membaca surat.', 2, []]];

// --- pieces ---
function numPad(onEnter, { max = 4 } = {}) {
  let v = '';
  const disp = el('span', { class: 'kp-layar' }, '…');
  const set = (x) => { v = x; disp.textContent = v || '…'; };
  const pad = el('div', { class: 'kp-pad' }, disp, el('div', { class: 'kp-tombol' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => onTap(el('button', { class: `kp-t ${k === 'OK' ? 'ok' : ''}`, type: 'button' }, k), () => {
    if (k === '⌫') set(v.slice(0, -1)); else if (k === 'OK') { if (v) { const x = Number(v); set(''); onEnter(x); } } else if (v.length < max) set(v + k);
  }))));
  return pad;
}

function boxTrack(state) {
  const [pos, locks] = state ?? [0, []];
  return el('div', { class: 'kp-jalur' }, ...['Nadia', 'Kurir 👀', 'Fajar'].map((n, i) => el('div', { class: `kp-pos ${i === pos ? 'ada' : ''}` }, el('b', null, n), i === pos ? el('div', { class: 'kp-kotak' }, '📦', ...locks.map((l) => el('span', { class: `kp-gembok ${l}` }, '🔒'))) : el('div', { class: 'kp-kosong' }))));
}
function boxRound(wrap, ctx, { done }) {
  const cards = ctx.rand.shuffle(BOX.map((b, i) => [i, b[0]]));
  let k = 0;
  const track = el('div');
  const box = el('div', { class: 'kp-kartu-kartu' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk langkah sesuai urutan. Anak kunci tidak boleh dikirim.');
  const draw = () => {
    track.replaceChildren(boxTrack(k ? [BOX[k - 1][1], BOX[k - 1][2]] : null));
    box.replaceChildren(...cards.map(([i, t]) => onTap(el('button', { class: `kp-kartu ${i < k ? 'pakai' : ''}`, type: 'button' }, i < k ? `${i + 1}. ${t}` : t), () => {
      if (i < k) return;
      if (i !== k) { ctx.mistake(); shake(box); say(msg, 'bad', k === 0 ? 'Kotak harus dikunci dulu sebelum diserahkan ke kurir.' : 'Belum saatnya. Di mana kotak sekarang, dan gembok siapa yang terpasang?'); return; }
      k++; ctx.sound.tap(); draw();
      if (k === BOX.length) { say(msg, '', 'Selama di tangan kurir, kotak selalu terkunci oleh paling sedikit satu gembok.'); done(); }
    })));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Kotak dua gembok: urutkan langkahnya.'), track, box, msg);
  draw();
}

// Fill cells of the power table with the keypad.
function tableRound(wrap, ctx, { from = 5, to = 11, done }) {
  const vals = POWERS.slice(); let k = from;
  const host = el('div', { class: 'kp-tabel' });
  const msg = el('p', { class: 'reveal info' }, 'Setiap kotak = kotak sebelumnya × 5, lalu ambil sisa bagi 23.');
  const draw = () => host.replaceChildren(...[[1, 11], [12, 22]].map(([a, b]) => el('div', { class: 'kp-tabel-baris' }, el('b', null, 'k'), ...Array.from({ length: b - a + 1 }, (_, i) => el('span', { class: 'kepala' }, a + i)), el('b', null, '5ᵏ mod 23'), ...Array.from({ length: b - a + 1 }, (_, i) => { const kk = a + i; return el('span', { class: kk === k ? 'kini' : kk < k ? 'isi' : '' }, kk < k || kk < from ? vals[kk - 1] : kk === k ? '?' : ''); }))));
  const pad = numPad((x) => {
    const want = vals[k - 1];
    if (x !== want) { ctx.mistake(); shake(host); say(msg, 'bad', `${vals[k - 2]} × 5 = ${vals[k - 2] * 5}; sisa bagi 23 = ?`); return; }
    ctx.sound.tap(); k++;
    if (k > to) { k = 23; say(msg, '', 'Sisanya diisi otomatis. Setiap angka 1–22 muncul tepat sekali.'); draw(); pad.remove(); done(); return; }
    say(msg, 'info', `5${sup(k - 1)} → ${want}`); draw();
  }, { max: 2 });
  wrap.append(el('p', { class: 'prompt' }, 'Sisa bagi 5ᵏ oleh 23: lengkapi tabelnya.'), host, pad, msg);
  draw();
}
const powerTable = (mark = []) => el('div', { class: 'kp-tabel kecil' }, ...[[1, 11], [12, 22]].map(([a, b]) => el('div', { class: 'kp-tabel-baris' }, el('b', null, 'k'), ...Array.from({ length: b - a + 1 }, (_, i) => el('span', { class: 'kepala' }, a + i)), el('b', null, '5ᵏ mod 23'), ...Array.from({ length: b - a + 1 }, (_, i) => el('span', { class: mark.includes(a + i) ? 'tanda' : '' }, POWERS[a + i - 1])))));

// Work through square-and-multiply step by step with the keypad.
function stepRound(wrap, ctx, { b, e, m, prompt, done, after = '' }) {
  const { steps: S, result } = steps(b, e, m);
  let k = 0;
  const list = el('div', { class: 'kp-langkah' });
  const msg = el('p', { class: 'reveal info' }, `Ambil sisa bagi ${m} setelah setiap perkalian.`);
  const draw = () => list.replaceChildren(...S.map((s, i) => el('div', { class: `kp-l ${i === k ? 'kini' : i < k ? 'isi' : ''}` }, el('span', null, i <= k ? s.text : '…'), el('b', null, i < k ? `sisa ${s.val}` : i === k ? 'sisa ?' : ''))));
  const pad = numPad((x) => {
    if (x !== S[k].val) { ctx.mistake(); shake(list); say(msg, 'bad', `Bagi dengan ${m} dan ambil sisanya.`); return; }
    k++; ctx.sound.tap(); draw();
    if (k === S.length) { pad.remove(); say(msg, '', `Sisa bagi ${b}${sup(e)} oleh ${m} = ${result}. ${after}`); done(result); }
  }, { max: 3 });
  wrap.append(el('p', { class: 'prompt' }, prompt), list, pad, msg);
  draw();
}

function sigRound(wrap, ctx, { done }) {
  const cases = [[7, 28], [9, 30]]; const res = {}; const shown = {};
  const box = el('div', { class: 'kp-ttd' });
  const msg = el('p', { class: 'reveal info' }, 'Periksa dengan kunci publik Nadia (n = 55, e = 3): tanda tangan³ mod 55 harus sama dengan kode rapat.');
  const draw = () => box.replaceChildren(...cases.map(([code, sig], i) => { const v = modpow(sig, 3, 55); const ok = v === code; return el('div', { class: `kp-kasus ${i in res ? 'beres' : ''}` }, el('b', null, `"Kode rapat ${code}, tanda tangan ${sig}, dari Nadia"`),
    shown[i] ? el('code', { class: ok ? 'cocok' : 'beda' }, `${sig}³ = ${num(sig ** 3)} → sisa ${v}`) : onTap(el('button', { class: 'seg-btn', type: 'button' }, '🔓 Periksa dengan kunci publik'), () => { shown[i] = true; ctx.sound.tap(); draw(); }),
    i in res ? el('small', null, ok ? '✓ Sah' : '✗ Palsu') : el('div', { class: 'seg' }, [[true, 'Sah'], [false, 'Palsu']].map(([v2, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (!shown[i]) { shake(box); say(msg, 'bad', 'Periksa dulu dengan kunci publik.'); return; }
      if (v2 !== ok) { ctx.mistake(); shake(box); say(msg, 'bad', `Bandingkan ${v} dengan kode rapat ${code}.`); return; }
      res[i] = v2; ctx.sound.tap(); draw();
      if (Object.keys(res).length === cases.length) { say(msg, '', 'Tanda tangan 28 sah; tanda tangan 30 palsu (hasilnya 50, bukan 9).'); done(); }
    })))); }));
  wrap.append(el('p', { class: 'prompt' }, 'Tanda tangan digital: mana yang benar dari Nadia?'), box, msg);
  draw();
}

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
function factorRound(wrap, ctx, { n = 2491, done }) {
  const tried = [];
  const box = el('div', { class: 'kp-faktor' });
  const msg = el('p', { class: 'reveal info' }, `Coba bagi ${num(n)} dengan bilangan prima berurutan.`);
  const draw = () => box.replaceChildren(el('div', { class: 'seg' }, PRIMES.map((p) => onTap(el('button', { class: `seg-btn ${tried.includes(p) ? (n % p ? 'on' : 'kena') : ''}`, type: 'button' }, p), () => {
    if (tried.includes(p)) return;
    const next = PRIMES.find((q) => !tried.includes(q));
    if (p !== next) { ctx.mistake(); shake(box); say(msg, 'bad', `Coba berurutan: ${next} dulu.`); return; }
    tried.push(p); ctx.sound.tap(); draw();
    if (n % p === 0) { say(msg, '', `${num(n)} = ${p} × ${n / p}, ditemukan pada percobaan ke-${tried.length}. Cukup sampai √${num(n)} ≈ ${Math.sqrt(n).toFixed(1).replace('.', ',')}.`); done(); } else say(msg, 'info', `${num(n)} : ${p} = ${Math.floor(n / p)} sisa ${n % p}`);
  }))), el('div', { class: 'kp-coba' }, tried.map((p) => el('code', { class: n % p ? '' : 'cocok' }, `: ${p} → sisa ${n % p}`))));
  wrap.append(el('p', { class: 'prompt' }, `Mengapa bilangannya harus besar? Faktorkan ${num(n)}.`), box, msg);
  draw();
}

export default {
  id: 'sma-23-kunci-publik',
  title: 'Gembok yang Dibagikan',
  topic: 'Kriptografi kunci publik: pertukaran kunci Diffie–Hellman, RSA mini, tanda tangan digital, dan penyusup di tengah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjelaskan gagasan kotak dua gembok dan kunci publik, menghitung sisa bagi pangkat dengan kuadrat berulang, menyepakati kunci rahasia di depan umum, menyandikan dan membuka pesan dengan RSA mini, memeriksa tanda tangan digital, dan menjelaskan mengapa bilangannya harus sangat besar serta bahaya penyusup di tengah.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Pangkat Modular', desc: 'Masukkan bilangan pokok, pangkat, dan pembagi; lihat langkah kuadrat berulang dan sisa bagi setiap langkah', create: createCalc },
    { id: 'tukar', icon: '🤝', label: 'Pertukaran Kunci', desc: 'Dua pemain memilih angka rahasia di sisi masing-masing; papan umum hanya menampilkan p, g, dan angka yang ditukar', create: createSwap },
    { id: 'rsa', icon: '✍️', label: 'RSA Mini', desc: 'Kirim angka dengan kunci publik, buka dengan kunci privat, buat dan periksa tanda tangan digital', create: createRsa },
    { id: 'giliran', icon: '🕵️', label: 'Rudi Menebak', desc: 'Satu tim memilih angka rahasia, tim lain menjadi Rudi yang menebaknya dari papan umum; dengan p = 23 mudah, dengan p 12 digit tidak mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kunci-publik' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const board = (x = '?', y = '?') => el('div', { class: 'kp-papan' }, el('b', null, '📌 Papan umum'), el('span', null, `p = ${P}`), el('span', null, `g = ${G}`), el('span', null, `Nadia: ${x}`), el('span', null, `Fajar: ${y}`));
      if (r === 0) boxRound(wrap, ctx, { done: then(() => ask('Pernahkah kotak itu tidak terkunci selama di tangan kurir?', [['Tidak pernah: selalu ada paling sedikit satu gembok', true], ['Pernah, saat Fajar menambahkan gembok'], ['Pernah, saat Nadia membuka gemboknya di langkah 4'], ['Pernah, sebentar di tengah jalan']])) });
      else if (r === 1) ask('Bu Wati membagikan banyak gembok terbuka; anak kuncinya hanya ia pegang. Setelah mengunci kotak untuk Bu Wati, bisakah pengirim membukanya lagi, dan mengapa gembok boleh dibagikan?', [['Tidak bisa; gembok hanya bisa mengunci, sedangkan anak kunci membuka semuanya sehingga harus dirahasiakan', true], ['Bisa, karena ia yang mengunci'], ['Tidak bisa; gembok juga harus dirahasiakan'], ['Bisa, jika ia meminjam gembok lain']], 1, el('div', { class: 'kp-istilah' }, 'Gembok terbuka = kunci publik · anak kunci = kunci privat'));
      else if (r === 2) tableRound(wrap, ctx, { done: then(() => ask('Apa yang kamu perhatikan tentang angka-angka di baris bawah?', [['Setiap angka 1–22 muncul tepat sekali, jadi untuk tahu pangkatnya orang harus mencari letaknya', true], ['Angkanya selalu naik'], ['Hanya angka ganjil yang muncul'], ['Polanya berulang setiap 5 kotak']], 1, powerTable())) });
      else if (r === 3) ask('Nadia memilih angka rahasia 6. Angka berapa yang ia tempel di papan umum?', [8, 20, 17, 6, 11, 2].sort((a, b) => a - b).map((x) => [x, x === POWERS[5]]), 6, powerTable(),
        then(() => ask('Fajar memilih angka rahasia 9. Angka berapa yang ia tempel?', [11, 8, 9, 16, 18, 22].sort((a, b) => a - b).map((x) => [x, x === POWERS[8]]), 6, powerTable())));
      else if (r === 4) stepRound(wrap, ctx, { b: 11, e: 6, m: 23, prompt: 'Nadia mengambil 11 dari papan dan memangkatkannya dengan angka rahasianya: sisa bagi 11⁶ oleh 23.', done: then(() => stepRound(wrap, ctx, { b: 8, e: 9, m: 23, prompt: 'Fajar mengambil 8 dari papan: sisa bagi 8⁹ oleh 23.', after: 'Kunci bersama keduanya 9, dan angka ini tidak pernah ditempel.', done: next })) });
      else if (r === 5) ask('Rudi melihat papan: 23, 5, 8, 11. Bagaimana ia menemukan angka rahasia Nadia, dan mengapa itu mustahil bila p ratusan digit?', [['Mencari 8 di tabel dan menemukan k = 6; untuk p ratusan digit tabelnya lebih besar dari banyak atom di alam semesta', true], ['Membagi 8 dengan 5; untuk p besar pembagiannya terlalu lama'], ['Tidak bisa sama sekali, bahkan untuk p = 23'], ['Bertanya ke Fajar; untuk p besar Fajar tidak tahu']], 1, el('div', { class: 'kp-dua' }, board(8, 11), powerTable([6, 9])));
      else if (r === 6) ask('RSA mini: kunci publik Nadia n = 55, e = 3. Fajar mengirim jam berkumpul 14. Sandinya: 14³ = 2.744 → sisa?', [9, 14, 44, 49].map((x) => [x, x === 49]), 4, el('div', { class: 'kp-istilah' }, 'sandi = m³ mod 55'),
        then(() => ask('Raka mengirim angka 8. Sandinya?', [2, 8, 17, 24].map((x) => [x, x === 17]), 4, el('div', { class: 'kp-istilah' }, '8³ = 512'))));
      else if (r === 7) stepRound(wrap, ctx, { b: 17, e: 27, m: 55, prompt: 'Nadia menerima sandi 17 dan membukanya dengan kunci privat d = 27 (27 = 16 + 8 + 2 + 1).', after: 'Pesan aslinya 8, sama dengan angka Raka.', done: next });
      else if (r === 8) sigRound(wrap, ctx, { done: then(() => ask('Untuk menyandikan pesan kepada Nadia dipakai kunci…, sedangkan untuk menandatangani pesan dari Nadia dipakai kunci…', [['publik Nadia; privat Nadia', true], ['privat Nadia; publik Nadia'], ['publik pengirim; publik Nadia'], ['privat pengirim; privat pengirim']], 1, null,
        then(() => ask('Rudi tahu n = 55 dan e = 3. Ia memfaktorkan 55 = 5 × 11, menghitung 4 × 10 = 40, lalu mencari d dengan 3 × d bersisa 1 bila dibagi 40. Jadi keamanan RSA bergantung pada…', [['sulitnya memfaktorkan n yang sangat besar (di sini d = 27 langsung ketemu)', true], ['rahasianya angka e'], ['panjangnya pesan'], ['sulitnya menghitung pangkat']])))) });
      else factorRound(wrap, ctx, { done: then(() => ask('Kunci RSA perbankan memakai n sekitar 617 digit; mencoba membagi sampai √n ≈ 10³⁰⁸ dengan 10¹² pembagian per detik butuh berapa lama?', [['10²⁹⁶ detik, jauh melebihi umur alam semesta (4,4 × 10¹⁷ detik)', true], ['10³⁰⁸ detik, sedikit di bawah umur alam semesta'], ['10²⁹⁶ detik, kira-kira satu tahun'], ['10¹² detik, sekitar 30.000 tahun']], 1, null,
        then(() => ask('Tantangan: Rudi menukar kedua angka di papan dengan 10 (5³ mod 23). Kunci apa yang dihitung Nadia dan Fajar, dan apa akibatnya?', [['Nadia 6, Fajar 20; Rudi berbagi kunci dengan keduanya dan bisa membaca serta mengubah pesan tanpa ketahuan', true], ['Keduanya 9; Rudi tidak bisa apa-apa'], ['Nadia 20, Fajar 6; pesan rusak dan ketahuan'], ['Keduanya 10; Rudi hanya bisa membaca']], 1, board('10 (ditukar Rudi)', '10 (ditukar Rudi)'),
          then(() => ask('Bagaimana tanda tangan digital mencegah penyusup di tengah?', [['Angka di papan ditandatangani dengan kunci privat pemiliknya; tempelan Rudi tak punya tanda tangan sah. Inilah tugas sertifikat pada HTTPS', true], ['Dengan memakai p yang lebih kecil'], ['Dengan menempel angka dua kali'], ['Tidak bisa dicegah']])))))) });
    }
    render();
  },
};

function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  const inp = (v, l) => el('label', { class: 'kp-label' }, l, el('input', { class: 'kp-masuk', type: 'number', min: '0', value: String(v), 'aria-label': l }));
  const fb = inp(17, 'Bilangan pokok'); const fe = inp(27, 'Pangkat'); const fm = inp(55, 'Pembagi');
  const out = el('div', { class: 'kp-langkah' });
  const calc = () => {
    const [b, e, m] = [fb, fe, fm].map((f) => Math.floor(Number(f.querySelector('input').value)));
    if (!(b >= 0 && e >= 1 && m >= 2 && e <= 100000 && m <= 100000 && b <= 100000)) { out.replaceChildren(el('p', { class: 'kp-istilah' }, 'Pakai bilangan bulat: pangkat 1–100.000, pembagi 2–100.000.')); return; }
    const { steps: S, result } = steps(b, e, m);
    out.replaceChildren(...S.slice(0, 40).map((s) => el('div', { class: 'kp-l isi' }, el('span', null, s.text), el('b', null, `sisa ${s.val}`))), el('div', { class: 'kp-l hasil' }, el('span', null, `${b}${sup(e)} mod ${m}`), el('b', null, `= ${result}`)));
  };
  for (const f of [fb, fe, fm]) f.querySelector('input').addEventListener('input', calc);
  wrap.append(el('p', { class: 'prompt' }, 'Kalkulator pangkat modular'), el('div', { class: 'kp-baris-input' }, fb, fe, fm), out);
  calc();
}

function createSwap(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  const start = () => {
    const sec = [null, null]; const hidden = [true, true];
    const draw = () => {
      const post = sec.map((s) => (s == null ? '?' : modpow(G, s, P)));
      const side = (i) => {
        const name = ['Nadia', 'Fajar'][i]; const s = sec[i]; const other = post[1 - i];
        return el('div', { class: 'kp-sisi' }, el('b', null, name),
          s == null ? el('div', null, el('p', { class: 'kp-istilah' }, 'Pilih angka rahasia (2–21). Lawan berpaling!'), el('div', { class: 'kp-angka' }, Array.from({ length: 20 }, (_, j) => j + 2).map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, x), () => { sec[i] = x; ctx.sound.tap(); draw(); }))))
            : el('div', null, el('p', { class: 'kp-istilah' }, hidden[i] ? 'Angka rahasia: 🔒' : `Angka rahasia: ${s}`), onTap(el('button', { class: 'seg-btn', type: 'button' }, hidden[i] ? '👁 Intip' : '🙈 Tutup'), () => { hidden[i] = !hidden[i]; draw(); }),
              el('p', { class: 'kp-istilah' }, hidden[i] ? `Tempel: 5^🔒 mod 23 = ${post[i]}` : `Tempel: 5${sup(s)} mod 23 = ${post[i]}`), other !== '?' ? el('p', { class: 'kp-kunci' }, hidden[i] ? `Kunci bersama: ${other}^🔒 mod 23 = 🔒` : `Kunci bersama: ${other}${sup(s)} mod 23 = ${modpow(other, s, P)}`) : null));
      };
      const both = sec.every((s) => s != null);
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pertukaran kunci di depan umum'), el('div', { class: 'kp-tukar' }, side(0), el('div', { class: 'kp-papan' }, el('b', null, '📌 Papan umum'), el('span', null, `p = ${P}`), el('span', null, `g = ${G}`), el('span', null, `Nadia: ${post[0]}`), el('span', null, `Fajar: ${post[1]}`)), side(1)),
        both ? el('p', { class: 'reveal' }, `Keduanya mendapat kunci yang sama, ${modpow(G, sec[0] * sec[1], P)}, tanpa pernah mengirim angka rahasia. Papan umum tidak pernah memuat kunci itu.`) : el('p', { class: 'reveal info' }, 'Setiap pemain memilih angka rahasia di sisinya.'),
        el('div', { class: 'kode-baris' }, button('Ulang', start)));
    };
    draw();
  };
  start();
}

function createRsa(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  let m = 14; let c = 17; let code = 7; let sig = 28;
  const stepper = (get, set, lo, hi) => el('span', { class: 'kp-stepper' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { set(Math.max(lo, get() - 1)); draw(); }), el('b', null, get()), onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { set(Math.min(hi, get() + 1)); draw(); }));
  const draw = () => {
    const enc = modpow(m, 3, 55); const dec = modpow(c, 27, 55); const made = modpow(code, 27, 55); const chk = modpow(sig, 3, 55);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'RSA mini · kunci publik n = 55, e = 3 · kunci privat d = 27'), el('div', { class: 'kp-rsa' },
      el('div', { class: 'kp-sisi' }, el('b', null, '📨 Kirim ke Nadia (kunci publik)'), el('div', null, 'Pesan m: ', stepper(() => m, (v) => { m = v; }, 0, 54)), el('code', null, `${m}³ mod 55 = ${enc}`), button('Kirim sandinya ke kotak buka ➜', () => { c = enc; draw(); })),
      el('div', { class: 'kp-sisi' }, el('b', null, '🔓 Nadia membuka (kunci privat)'), el('div', null, 'Sandi c: ', stepper(() => c, (v) => { c = v; }, 0, 54)), el('code', null, `${c}²⁷ mod 55 = ${dec}`)),
      el('div', { class: 'kp-sisi' }, el('b', null, '✍️ Nadia menandatangani (kunci privat)'), el('div', null, 'Kode: ', stepper(() => code, (v) => { code = v; }, 0, 54)), el('code', null, `${code}²⁷ mod 55 = ${made}`), button('Pakai tanda tangan ini ➜', () => { sig = made; draw(); })),
      el('div', { class: 'kp-sisi' }, el('b', null, '🔍 Siapa pun memeriksa (kunci publik)'), el('div', null, 'Tanda tangan: ', stepper(() => sig, (v) => { sig = v; }, 0, 54)), el('code', { class: chk === code ? 'cocok' : 'beda' }, `${sig}³ mod 55 = ${chk} → ${chk === code ? `sah untuk kode ${code}` : `bukan ${code}, palsu`}`))));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0); let k = 0; const turns = n * 2;
    function pick() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Rudi Menebak selesai', pts, again: () => pickTeams(wrap, 'Rudi Menebak', start) }); return; }
      const a = k % n; const b = (k + 1) % n; const big = k >= n;
      if (big) { guess(BigInt(ctx.rand.int(100000, 999999)) * 1000003n + BigInt(ctx.rand.int(0, 999)), b, true); return; }
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: pilih angka rahasia 2–21. Tim ${b + 1} berpaling!`), el('div', { class: 'kp-angka' }, Array.from({ length: 20 }, (_, j) => j + 2).map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, x), () => { ctx.sound.tap(); guess(BigInt(x), b, false); }))));
    }
    function guess(secret, b, big) {
      const p = big ? BIG_P : BigInt(P);
      const pub = modpowBig(5n, secret, p);
      let tries = 0; const max = big ? 5 : 3;
      const msg = el('p', { class: 'reveal hint' }, big ? `p sekarang ${num(Number(BIG_P))}. Tabelnya punya hampir satu triliun kotak. Coba tebak angka rahasia (${max} kesempatan).` : `Tim ${b + 1} menjadi Rudi: cari ${pub} di tabel (${max} kesempatan).`);
      const log = el('div', { class: 'kp-coba' });
      const finish = (ok) => { const g = ok ? (big ? 5 : 2) : 0; pts[b] += g; say(msg, ok ? '' : 'bad', ok ? `Ketemu! +${g}.` : `Gagal. Angka rahasianya ${secret.toLocaleString('id-ID')}.${big ? ' Tanpa tabel, menebak hampir pasti gagal: inilah yang melindungi kunci.' : ''}`); k++; setTimeout(pick, 3200); };
      const pad = numPad((x) => {
        tries++; const v = modpowBig(5n, BigInt(x), p);
        log.append(el('code', { class: v === pub ? 'cocok' : '' }, `5^${x} mod p = ${v.toLocaleString('id-ID')}`));
        if (v === pub) { pad.remove(); finish(true); } else if (tries >= max) { pad.remove(); finish(false); }
      }, { max: big ? 12 : 2 });
      wrap.replaceChildren(...[scoreBar(pts, b), el('p', { class: 'prompt' }, `Papan umum: p = ${num(Number(p))}, g = 5, angka tempelan = ${pub.toLocaleString('id-ID')}`), big ? null : powerTable(), pad, log, msg].filter(Boolean));
    }
    pick();
  }
  pickTeams(wrap, 'Rudi Menebak', start);
}
function modpowBig(b, e, m) { let r = 1n; let x = b % m; let k = e; while (k > 0n) { if (k & 1n) r = (r * x) % m; x = (x * x) % m; k >>= 1n; } return r; }
