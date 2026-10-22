// Sandi Berkunci — SMA/SMK (16–18 tahun), kriptografi klasik dan kriptanalisis.
// The Vigenère cipher on a Pramuka trail: encrypt and decrypt with a shifted
// alphabet strip, find repeated sequences and their distances, count letters
// per column to recover the key, the one-time pad, and password habits.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const only = (t) => t.toUpperCase().replace(/[^A-Z]/g, '');
const n = (c) => c.charCodeAt(0) - 65;
const ch = (i) => ABC[((i % 26) + 26) % 26];
// dir 1 encrypts, -1 decrypts.
export function vig(text, key, dir = 1) { const t = only(text); const k = only(key); return [...t].map((c, i) => ch(n(c) + dir * n(k[i % k.length]))).join(''); }
export const group = (t, g = 5) => t.replace(new RegExp(`(.{${g}})`, 'g'), '$1 ').trim();

export const PLAIN3 = 'PESAN UNTUK POS LIMA. DARI POHON BERINGIN BERJALANLAH KE ARAH TIMUR SAMPAI SUNGAI. IKUTI SUNGAI KE ARAH SELATAN SAMPAI JEMBATAN BAMBU. DI BAWAH JEMBATAN BAMBU ADA KOTAK KAYU. AMBIL BENDERA MERAH DAN SERAHKAN KEPADA PENJAGA POS ENAM.';
export const CIPHER3 = vig(PLAIN3, 'REGU');
export const TRACES = ['RHYI', 'JESJRM', 'PYDFGNRRHUDFA', 'VVGB'];
export function where(text, seq) { const out = []; for (let i = text.indexOf(seq); i >= 0; i = text.indexOf(seq, i + 1)) out.push(i + 1); return out; }
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const lcm = (a, b) => (a * b) / gcd(a, b);
export function columns(text, len) { const cols = Array.from({ length: len }, () => Array(26).fill(0)); [...text].forEach((c, i) => { cols[i % len][n(c)]++; }); return cols; }
export const top = (counts) => counts.indexOf(Math.max(...counts));
// Approximate letter frequencies of Indonesian text, in percent.
export const FREQ_ID = { A: 19.1, B: 2.7, C: 0.7, D: 4.1, E: 8.2, F: 0.2, G: 3.5, H: 2.6, I: 7.9, J: 0.9, K: 4.8, L: 3.5, M: 3.8, N: 9.4, O: 2.8, P: 2.6, Q: 0, R: 4.3, S: 4.1, T: 4.9, U: 4.9, V: 0.1, W: 0.5, X: 0, Y: 1.9, Z: 0.1 };
// Best shift for a column: the one whose decrypted counts match Indonesian best.
export function bestShift(counts) { let best = 0; let bs = -Infinity; for (let s = 0; s < 26; s++) { let sc = 0; for (let i = 0; i < 26; i++) sc += counts[(i + s) % 26] * FREQ_ID[ABC[i]]; if (sc > bs) { bs = sc; best = s; } } return best; }

export const MESSAGES = [
  'REGU MERPATI BERKUMPUL DI BAWAH POHON BERINGIN SETELAH MATAHARI TERBENAM. BAWA SENTER, TALI, DAN BENDERA MERAH. JANGAN LUPA MEMBAWA AIR MINUM DAN BEKAL MAKAN MALAM.',
  'API UNGGUN AKAN DINYALAKAN TEPAT PUKUL DELAPAN MALAM. SETIAP REGU MENYIAPKAN SATU PENAMPILAN SENI DAN SATU YEL YEL. PEMENANG MENDAPAT PANJI KEHORMATAN DARI KAKAK PEMBINA.',
  'PERJALANAN MALAM DIMULAI DARI GERBANG PERKEMAHAN. IKUTI TANDA JEJAK BERUPA BATU BERSUSUN SAMPAI PERSIMPANGAN, LALU BELOK KANAN MENUJU SUNGAI. DI SANA ADA PENJAGA POS TIGA.',
  'KAKAK PEMBINA MENYEMBUNYIKAN KOTAK HARTA KARUN DI DEKAT MENARA PANDANG. PETUNJUKNYA ADA DI BALIK PAPAN NAMA REGU ELANG. BUKA KOTAK ITU BERSAMA SAMA DAN BAGIKAN ISINYA SECARA ADIL.',
  'BESOK PAGI APEL DIMULAI PUKUL SETENGAH ENAM. SEMUA ANGGOTA MEMAKAI SERAGAM LENGKAP DENGAN KACU DAN TOPI. REGU YANG DATANG TERLAMBAT MEMBERSIHKAN DAPUR UMUM SETELAH SARAPAN.',
  'LATIHAN SEMAPHORE DIADAKAN DI LAPANGAN SEBELAH TIMUR. SETIAP REGU MEMBAWA DUA BENDERA DAN BERLATIH MENGIRIM PESAN PENDEK. PESAN TERCEPAT DAN TERTEPAT MENDAPAT NILAI TAMBAHAN.',
];

// --- pieces ---
// A shifted alphabet strip for one key letter: top = plain, bottom = cipher.
function strip(keyCh, onPick) {
  const s = n(keyCh);
  return el('div', { class: 'sv-strip' }, el('div', { class: 'sv-baris atas' }, el('b', null, 'Asli'), ...[...ABC].map((c) => el('span', null, c))),
    el('div', { class: 'sv-baris bawah' }, el('b', null, `Baris ${keyCh}`), ...[...ABC].map((c, i) => onTap(el('button', { class: 'sv-sel', type: 'button' }, ch(i + s)), () => onPick(i)))));
}

// Encrypt or decrypt letter by letter by tapping the strip.
function vigBoard(wrap, ctx, { text, key, dir, given = 0, need = Infinity, prompt, done }) {
  const t = only(text); const out = dir === 1 ? vig(t, key) : vig(t, key, -1);
  let k = given;
  const grid = el('div', { class: 'sv-grid' });
  const helper = el('div', { class: 'sv-bantu' });
  const msg = el('p', { class: 'reveal info' }, dir === 1 ? 'Cari huruf asli di baris atas; huruf di bawahnya pada baris kunci adalah sandinya.' : 'Cari huruf sandi di baris kunci; huruf di atasnya adalah huruf asli.');
  const draw = () => {
    const kk = only(key);
    grid.replaceChildren(...[[dir === 1 ? 'Pesan' : 'Sandi', (i) => t[i]], ['Kunci', (i) => kk[i % kk.length]], [dir === 1 ? 'Sandi' : 'Pesan', (i) => (i < k ? out[i] : '')]].map(([l, f], r) => el('div', { class: 'sv-grid-baris' }, el('b', null, l), ...[...t].map((_, i) => el('span', { class: `${i === k && k < t.length ? 'kini' : ''} ${r === 2 && i < given ? 'diberi' : ''}` }, f(i))))));
    if (k >= t.length) { helper.replaceChildren(); return; }
    const kc = kk[k % kk.length];
    helper.replaceChildren(el('p', { class: 'sv-catat' }, `Huruf ke-${k + 1}: ${dir === 1 ? `${t[k]} digeser ${n(kc)} (${kc})` : `${t[k]} digeser mundur ${n(kc)} (${kc})`}`), strip(kc, (i) => {
      const got = dir === 1 ? ch(i + n(kc)) : ABC[i];
      const ok = dir === 1 ? ABC[i] === t[k] : ch(i + n(kc)) === t[k];
      if (!ok) { ctx.mistake(); shake(helper); say(msg, 'bad', dir === 1 ? `Cari kolom huruf asli ${t[k]} pada baris atas.` : `Cari huruf sandi ${t[k]} pada baris ${kc}.`); return; }
      k++; ctx.sound.tap(); say(msg, 'info', `${dir === 1 ? t[k - 1] : t[k - 1]} → ${got}`);
      if (k - given >= need && k < t.length) { k = t.length; say(msg, 'info', 'Sisanya diisi otomatis.'); }
      draw();
      if (k >= t.length) { say(msg, '', `${dir === 1 ? 'Sandi' : 'Pesan'}: ${dir === 1 ? group(out) : out}`); done(out); }
    }));
  };
  wrap.append(el('p', { class: 'prompt' }, prompt), grid, helper, msg);
  draw();
}

// Ciphertext laid out 20 letters per row; taps on letters report positions.
function cipherGrid(text, { marks = {}, onTap: tap } = {}) {
  const rows = [];
  for (let r = 0; r * 20 < text.length; r++) {
    const a = r * 20 + 1;
    rows.push(el('div', { class: 'sv-sb' }, el('small', null, `${a}–${Math.min(a + 19, text.length)}`), ...[...text.slice(r * 20, r * 20 + 20)].map((c, j) => {
      const p = a + j; const m = marks[p];
      const s = onTap(el('button', { class: `sv-h ${m || ''} ${j % 5 === 4 ? 'akhir' : ''}`, type: 'button', 'data-p': p }, c), () => tap?.(p));
      return s;
    })));
  }
  return el('div', { class: 'sv-sandi' }, rows);
}

function traceRound(wrap, ctx, { done }) {
  const T = CIPHER3; let k = 1; const found = {}; const dist = { RHYI: 8 };
  const host = el('div');
  const table = el('div', { class: 'sv-jejak' });
  const msg = el('p', { class: 'reveal info' });
  const marks = () => { const m = {}; for (const s of TRACES) for (const p of found[s] || []) for (let i = 0; i < s.length; i++) m[p + i] = s === TRACES[k] ? 'kena' : 'lama'; return m; };
  found.RHYI = where(T, 'RHYI');
  const draw = () => {
    host.replaceChildren(cipherGrid(T, { marks: marks(), onTap: (p) => {
      if (k >= TRACES.length) return;
      const s = TRACES[k]; const occ = where(T, s); const f = (found[s] ||= []);
      if (!occ.includes(p) || f.includes(p)) { ctx.mistake(); shake(host); say(msg, 'bad', `Huruf ke-${p} bukan awal deret ${s} yang belum ditemukan.`); return; }
      f.push(p); f.sort((a, b) => a - b); ctx.sound.tap();
      if (f.length === occ.length) { dist[s] = f[1] - f[0]; say(msg, 'info', `${s}: letak ${f[0]} dan ${f[1]}, jarak ${dist[s]}.`); k++; }
      draw();
      if (k >= TRACES.length) { say(msg, '', 'Jarak 8, 36, 20, 8.'); done(); }
    } }));
    table.replaceChildren(el('div', { class: 'sv-jejak-baris kepala' }, el('b', null, 'Deret'), el('b', null, 'Letak'), el('b', null, 'Jarak')),
      ...TRACES.map((s, i) => el('div', { class: `sv-jejak-baris ${i === k ? 'kini' : ''}` }, el('code', null, s), el('span', null, (found[s] || []).join(' dan ') || '?'), el('span', null, dist[s] ?? '?'))));
    if (k < TRACES.length && !(found[TRACES[k]] || []).length) say(msg, 'info', `Ketuk huruf pertama setiap kemunculan ${TRACES[k]}.`);
  };
  wrap.append(el('p', { class: 'prompt' }, 'Mencari jejak kunci: temukan deret yang berulang dan hitung jaraknya.'), el('div', { class: 'sv-dua' }, host, table), msg);
  draw();
}

// Bar chart of letter counts; shift s shows the counts as if decrypted with key letter s.
function bars(counts, { s = 0, ref = false, pick = null, mark = null } = {}) {
  const max = Math.max(...counts, 1);
  return el('div', { class: 'sv-batang' }, ...[...ABC].map((c, i) => {
    const v = counts[(i + s) % 26];
    const node = el(pick ? 'button' : 'div', { class: `sv-bt ${mark === i ? 'tanda' : ''}`, type: pick ? 'button' : null },
      ref ? el('i', { class: 'ref', style: { height: `calc((100% - 1.1em) * ${FREQ_ID[c] / 19.1})` } }) : null,
      el('i', { style: { height: `${(v / max) * 100}%` } }), el('small', null, s ? c : ch(i + s)));
    return pick ? onTap(node, () => pick(i)) : node;
  }));
}

function freqRound(wrap, ctx, { done }) {
  const cols = columns(CIPHER3, 4); const key = [];
  const host = el('div', { class: 'sv-kolom-kolom dua' });
  const msg = el('p', { class: 'reveal info' }, 'Dengan panjang kunci 4, huruf sandi dibagi ke empat kolom. Ketuk batang huruf tersering di setiap kolom.');
  const draw = () => host.replaceChildren(...cols.map((c, j) => el('div', { class: `sv-kolom ${key[j] ? 'beres' : ''}` }, el('b', null, `Kolom ${j + 1}${key[j] ? `: ${key[j]} (${c[n(key[j])]} kali)` : ''}`), bars(c, { mark: key[j] ? n(key[j]) : null, pick: key[j] ? null : (i) => {
    if (i !== top(c)) { ctx.mistake(); shake(host); say(msg, 'bad', `Masih ada batang yang lebih tinggi dari ${ABC[i]}.`); return; }
    key[j] = ABC[i]; ctx.sound.tap(); draw();
    if (key.filter(Boolean).length === 4) { say(msg, '', `Huruf tersering: ${key.join(', ')}. Karena A digeser menjadi huruf kunci itu sendiri, kata kuncinya ${key.join('')}.`); done(); }
  } }))));
  wrap.append(el('p', { class: 'prompt' }, 'Membagi ke kolom: huruf tersering di setiap kolom.'), host, msg);
  draw();
}

const WEAK = [['Kunci yang terlalu pendek, cepat berulang dan mudah dicari', 'Memakai kata sandi yang pendek'], ['Kunci berupa kata yang mudah ditebak, misalnya TUNAS', 'Memakai kata biasa atau nama, misalnya nama hewan peliharaan'], ['Kunci sekali pakai yang dipakai lagi untuk pesan lain', 'Memakai satu kata sandi yang sama untuk banyak akun'], ['Kertas kunci dibiarkan tergeletak di meja pos', 'Menuliskan kata sandi di kertas yang ditempel di layar']];
function matchRound(wrap, ctx, { done }) {
  const right = ctx.rand.shuffle(WEAK.map((p) => p[1]));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'sv-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kelemahan sandi, lalu kebiasaan kata sandi yang mirip.');
  const draw = () => box.replaceChildren(el('div', { class: 'sv-kol' }, WEAK.map(([l], i) => onTap(el('button', { class: `sv-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button' }, `${i + 1}. ${l}`), () => { if (!ok.has(i)) { sel = i; draw(); } }))),
    el('div', { class: 'sv-kol' }, right.map((r) => { const i = WEAK.findIndex((p) => p[1] === r); return onTap(el('button', { class: `sv-item ${ok.has(i) ? 'cocok' : ''}`, type: 'button' }, r), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', 'Belum mirip. Pikirkan apa yang membuat keduanya lemah.'); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === WEAK.length) { say(msg, '', '1–S pendek, 2–P mudah ditebak, 3–R dipakai ulang, 4–Q tergeletak.'); done(); }
    }); })));
  wrap.append(el('p', { class: 'prompt' }, 'Dari sandi ke kata sandi: pasangkan kelemahan yang mirip.'), box, msg);
  draw();
}

export default {
  id: 'sma-21-sandi-berkunci',
  title: 'Sandi Berkunci',
  topic: 'Kriptografi: sandi Vigenère, analisis frekuensi, kunci sekali pakai, dan kata sandi yang kuat',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🗝️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menyandikan dan membaca pesan dengan sandi Vigenère, memecahkan sandi tanpa kunci dengan mencari deret berulang dan menghitung huruf per kolom, menjelaskan mengapa kunci sekali pakai tidak bisa dipecahkan, dan menghubungkan kelemahan sandi dengan kebiasaan kata sandi.',
  extraModes: [
    { id: 'tabel', icon: '🔠', label: 'Tabel Vigenère', desc: 'Ketuk huruf kunci dan huruf pesan untuk melihat persilangannya; ketik pesan dan kunci untuk menyandikan atau membaca', create: createTable },
    { id: 'pecah', icon: '📊', label: 'Penghitung per Kolom', desc: 'Pilih panjang kunci, lalu geser diagram setiap kolom sampai cocok dengan frekuensi huruf Bahasa Indonesia', create: createCracker },
    { id: 'sekali', icon: '🔥', label: 'Kunci Sekali Pakai', desc: 'Ketik kata lima huruf dan lihat kunci yang membuat sandi KQJDF terbaca sebagai kata itu', create: createPad },
    { id: 'giliran', icon: '🔁', label: 'Kirim dan Pecahkan', desc: 'Satu tim memilih pesan dan kunci, tim lain memecahkannya dengan penghitung per kolom; makin cepat makin besar poinnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act sandi-berkunci' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const code = (t) => el('code', { class: 'sv-kode' }, t);
      if (r === 0) vigBoard(wrap, ctx, { text: 'KUMPUL DI LAPANGAN', key: 'TUNAS', dir: 1, given: 5, prompt: 'Menyandikan KUMPUL DI LAPANGAN dengan kunci TUNAS. Lima huruf pertama sudah dikerjakan.', done: next });
      else if (r === 1) ask('Huruf A pada LAPANGAN disandikan menjadi apa saja?', [['S, U, dan S, tergantung huruf kunci di bawahnya', true], ['Selalu S'], ['Selalu A'], ['T, U, dan N']], 1, code('L A P A N G A N\nA S T U N A S T'),
        then(() => ask('Huruf ke-4, ke-9, dan ke-14 tidak berubah. Mengapa, dan apa pelajarannya?', [['Huruf kuncinya A (geser 0); kunci sebaiknya huruf acak, bukan kata biasa yang memuat A', true], ['Karena hurufnya vokal; vokal tidak disandikan'], ['Karena salah hitung; seharusnya berubah'], ['Karena kunci terlalu panjang']], 1, code('K U M P U L D I L A P A N G A N\nT U N A S T U N A S T U N A S T\nD O Z P M E X V L S I U A G S G'))));
      else if (r === 2) vigBoard(wrap, ctx, { text: 'TJVUFZAHNVBHLADTENNBTGQEDTJNN', key: 'TUNAS', dir: -1, need: 12, prompt: 'Membaca petunjuk Kak Laras: TJVUF ZAHNV BHLAD TENNB TGQED TJNN, kunci TUNAS.', done: next });
      else if (r === 3) traceRound(wrap, ctx, { done: then(() => ask('Jaraknya 8, 36, 20, dan 8. Panjang kunci harus membagi habis semuanya. Berapa panjang kunci kemungkinan besar?', [[4, true], [8], [12], [36]], 4, code('FPB(8, 36, 20, 8) = ?'))) });
      else if (r === 4) freqRound(wrap, ctx, { done: next });
      else if (r === 5) ask('Dengan kunci REGU, apa isi dua baris pertama (huruf 1–40)?', [['PESAN UNTUK POS LIMA DARI POHON BERINGIN BERJAL…', true], ['PESAN UNTUK POS ENAM DARI POHON BERINGIN BERJAL…'], ['API UNGGUN DINYALAKAN JAM DELAPAN…'], ['KUMPUL DI LAPANGAN SETELAH APEL PAGI…']], 1, code(group(CIPHER3.slice(0, 40))),
        then(() => ask('Mengapa cara menghitung huruf per kolom hanya berhasil bila pesannya cukup panjang?', [['Setiap kolom hanya berisi seperempat huruf; pada pesan pendek huruf tersering bisa bukan sandi A dan deret berulang mungkin tidak muncul', true], ['Karena kunci pendek hanya dipakai untuk pesan panjang'], ['Karena pesan pendek tidak bisa disandikan'], ['Karena huruf A hanya muncul di pesan panjang']])));
      else if (r === 6) ask('Kunci sekali pakai: sandi KQJDF, kuncinya QXJMF. Apa isi pesannya?', [['UTARA', true], ['BARAT'], ['TIMUR'], ['PUSAT']], 4, null,
        then(() => ask('Kunci apa yang membuat KQJDF terbaca BARAT, dan kunci apa yang membuatnya terbaca TIMUR?', [['JQSDM dan RIXJO', true], ['QXJMF dan QXJMF'], ['BARAT dan TIMUR'], ['JQSDM dan QXJMF']], 1, null,
          then(() => ask('Penyadap hanya punya sandi KQJDF. Bisakah ia tahu arah yang benar?', [['Tidak: untuk setiap kata lima huruf ada kunci yang cocok, dan semua kunci sama mungkin', true], ['Bisa, dengan menghitung huruf tersering'], ['Bisa, dengan mencari deret yang berulang'], ['Bisa, karena kuncinya hanya lima huruf']])))));
      else if (r === 7) ask('Kunci sekali pakai tidak bisa dipecahkan hanya jika kuncinya…', [['benar-benar acak, sama panjang dengan pesan, dan tidak pernah dipakai ulang', true], ['berupa kata yang mudah diingat, pendek, dan dipakai semua regu'], ['acak, pendek, dan dipakai ulang setiap hari'], ['rahasia, tetapi boleh berulang seperti TUNAS']], 1, null,
        then(() => ask('Mengapa kunci sekali pakai jarang dipakai untuk pesan sehari-hari di internet?', [['Kedua pihak harus lebih dulu bertukar kunci sepanjang semua pesannya lewat jalur aman; tidak praktis untuk miliaran pesan', true], ['Karena mudah dipecahkan komputer'], ['Karena hanya bisa dipakai untuk huruf kapital'], ['Karena dilarang untuk pesan internet']])));
      else if (r === 8) matchRound(wrap, ctx, { done: then(() => ask('Manajer kata sandi membuat kata sandi seperti q7#Vm2!pLx9@Tf4z, berbeda untuk setiap akun. Apa yang tetap harus kamu jaga sendiri?', [['Kata sandi utama brankasnya: panjang, unik, tidak dibagikan, ditambah autentikasi dua langkah', true], ['Semua kata sandi acak itu, dengan menghafalnya'], ['Tidak ada; manajer kata sandi menjaga semuanya'], ['Kertas berisi semua kata sandi di dekat layar']])) });
      else ask('Tantangan: disandikan dengan REGU, lalu dengan PELUIT. Sama dengan sekali menyandikan dengan kunci berapa huruf, dan apa kuncinya?', [['12 huruf: GIROZXVYCYON', true], ['10 huruf: REGUPELUIT'], ['6 huruf: GIROZX'], ['24 huruf: REGU dan PELUIT bergantian']], 1, code('R E G U R E G U R E G U\nP E L U I T P E L U I T'),
        then(() => ask('Berapa panjang kunci gabungan REGU dan TUNAS, dan apakah menyandikan dua kali membuat Vigenère tidak bisa dipecahkan?', [['20 (KPK 4 dan 5); tetap bisa dipecahkan karena kuncinya tetap berulang, hanya butuh pesan lebih panjang', true], ['9; tidak bisa dipecahkan lagi'], ['20; tidak bisa dipecahkan lagi'], ['5; tetap bisa dipecahkan']])));
    }
    render();
  },
};

function createTable(root, ctx) {
  const wrap = el('div', { class: 'act sandi-berkunci' });
  root.append(wrap);
  let row = 19; let col = 10; let dir = 1;
  const table = el('div', { class: 'sv-tabel' });
  const out = el('div', { class: 'sv-ketik' });
  const pesan = el('input', { class: 'sv-masuk', type: 'text', value: 'KUMPUL DI LAPANGAN', 'aria-label': 'Pesan', autocomplete: 'off', spellcheck: 'false' });
  const kunci = el('input', { class: 'sv-masuk pendek', type: 'text', value: 'TUNAS', 'aria-label': 'Kunci', autocomplete: 'off', spellcheck: 'false' });
  const res = el('code', { class: 'sv-kode' });
  const info = el('p', { class: 'reveal info' });
  const drawTable = () => {
    table.replaceChildren(el('div', { class: 'sv-tb kepala' }, el('span', null, ''), ...[...ABC].map((c, i) => onTap(el('button', { class: `sv-tc ${i === col ? 'on' : ''}`, type: 'button' }, c), () => { col = i; drawTable(); }))),
      ...[...ABC].map((k, r) => el('div', { class: 'sv-tb' }, onTap(el('button', { class: `sv-tc kunci ${r === row ? 'on' : ''}`, type: 'button' }, k), () => { row = r; drawTable(); }), ...[...ABC].map((_, i) => el('span', { class: `${r === row && i === col ? 'x' : r === row || i === col ? 'garis' : ''}` }, ch(r + i))))));
    say(info, 'info', `Kunci ${ABC[row]} (geser ${row}) + huruf asli ${ABC[col]} = sandi ${ch(row + col)}. Untuk membaca: cari ${ch(row + col)} di baris ${ABC[row]}, lalu lihat huruf di atas kolomnya.`);
  };
  const calc = () => { const k = only(kunci.value); res.textContent = k ? group(vig(pesan.value, k, dir)) : 'Isi kuncinya dulu.'; };
  pesan.addEventListener('input', calc); kunci.addEventListener('input', calc);
  const seg = el('div', { class: 'seg' });
  const drawSeg = () => seg.replaceChildren(...[[1, 'Menyandikan'], [-1, 'Membaca']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${dir === v ? 'on' : ''}`, type: 'button' }, l), () => { dir = v; drawSeg(); calc(); })));
  out.append(seg, el('label', { class: 'sv-label' }, 'Teks', pesan), el('label', { class: 'sv-label' }, 'Kunci', kunci), res);
  wrap.append(el('p', { class: 'prompt' }, 'Tabel Vigenère'), el('div', { class: 'sv-tabel-wadah' }, table, out), info);
  drawTable(); drawSeg(); calc();
}

// Column-by-column cracker shared by the workbench and the team mode.
function cracker(host, ctx, { text, len: len0 = 4, maxLen = 8, onKey = null }) {
  let len = len0; let shifts = Array(len).fill(0);
  const top_ = el('div', { class: 'seg' });
  const cols = el('div', { class: 'sv-kolom-kolom' });
  const prev = el('code', { class: 'sv-kode kecil' });
  const draw = () => {
    top_.replaceChildren(...[el('span', { class: 'sv-n' }, 'Panjang kunci:'), ...Array.from({ length: maxLen }, (_, i) => i + 1).map((x) => onTap(el('button', { class: `seg-btn ${len === x ? 'on' : ''}`, type: 'button' }, x), () => { len = x; shifts = Array(x).fill(0); draw(); })),
      onKey ? null : onTap(el('button', { class: 'seg-btn', type: 'button' }, '💡 Geser otomatis'), () => { shifts = columns(text, len).map(bestShift); draw(); })].filter(Boolean));
    const cs = columns(text, len);
    cols.replaceChildren(...cs.map((c, j) => el('div', { class: 'sv-kolom' }, el('div', { class: 'sv-kol-atas' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '◀'), () => { shifts[j] = (shifts[j] + 25) % 26; ctx.sound.tap(); draw(); }), el('b', null, `Kolom ${j + 1} · kunci ${ABC[shifts[j]]}`), onTap(el('button', { class: 'seg-btn', type: 'button' }, '▶'), () => { shifts[j] = (shifts[j] + 1) % 26; ctx.sound.tap(); draw(); })),
      bars(c, { s: shifts[j], ref: true }))));
    const key = shifts.map((s) => ABC[s]).join('');
    prev.textContent = `Kunci ${key}: ${group(vig(text, key, -1)).slice(0, 120)}…`;
  };
  host.append(...[top_, el('p', { class: 'sv-catat' }, 'Batang biru: hitungan huruf di kolom setelah dibaca dengan huruf kunci itu. Garis jingga: perkiraan frekuensi huruf Bahasa Indonesia (A paling tinggi).'), cols, prev,
    onKey ? el('div', { class: 'kode-baris' }, button('Ini kuncinya!', () => onKey(shifts.map((s) => ABC[s]).join('')), 'primary')) : null].filter(Boolean));
  draw();
}

function createCracker(root, ctx) {
  const wrap = el('div', { class: 'act sandi-berkunci' });
  root.append(wrap);
  const load = (text, label) => {
    const host = el('div', { class: 'sv-pecah' });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Penghitung huruf per kolom · ${label}`), el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Teks soal 3'), () => load(CIPHER3, 'teks soal 3')),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Pesan acak'), () => { const k = Array.from({ length: ctx.rand.int(2, 5) }, () => ABC[ctx.rand.int(1, 25)]).join(''); load(vig(ctx.rand.pick(MESSAGES), k), `pesan acak, kunci ${k.length} huruf`); })), host);
    cracker(host, ctx, { text, len: 4 });
  };
  load(CIPHER3, 'teks soal 3');
}

function createPad(root, ctx) {
  const wrap = el('div', { class: 'act sandi-berkunci' });
  root.append(wrap);
  const word = el('input', { class: 'sv-masuk pendek', type: 'text', value: 'BARAT', maxlength: '5', 'aria-label': 'Kata lima huruf', autocomplete: 'off', spellcheck: 'false' });
  const out = el('div', { class: 'sv-pad' });
  const calc = () => {
    const w = only(word.value).slice(0, 5);
    out.replaceChildren(...(w.length === 5 ? [el('div', { class: 'sv-pad-baris' }, el('b', null, 'Sandi'), ...[...'KQJDF'].map((c) => el('span', null, c))), el('div', { class: 'sv-pad-baris' }, el('b', null, 'Kunci'), ...[...vig('KQJDF', w, -1)].map((c) => el('span', { class: 'kunci' }, c))), el('div', { class: 'sv-pad-baris' }, el('b', null, 'Pesan'), ...[...w].map((c) => el('span', null, c))),
      el('p', { class: 'sv-catat' }, `Kunci ${vig('KQJDF', w, -1)} membuat KQJDF terbaca ${w}. Setiap kata lima huruf punya kuncinya sendiri, jadi penyadap tidak bisa tahu pesan yang benar.`)] : [el('p', { class: 'sv-catat' }, 'Ketik kata lima huruf.')]));
  };
  word.addEventListener('input', calc);
  wrap.append(el('p', { class: 'prompt' }, 'Kunci sekali pakai: sandi KQJDF'), el('label', { class: 'sv-label' }, 'Kata lima huruf', word),
    el('div', { class: 'seg' }, ['UTARA', 'BARAT', 'TIMUR', 'PULAU', 'KABUR'].map((w) => onTap(el('button', { class: 'seg-btn', type: 'button' }, w), () => { word.value = w; calc(); }))), out);
  calc();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act sandi-berkunci' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const turns = nT * 2;
    function setup() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Kirim dan Pecahkan selesai', pts, again: () => pickTeams(wrap, 'Kirim dan Pecahkan', start) }); return; }
      const a = k % nT; const b = (k + 1) % nT; let key = ''; let m = 0;
      const show = el('div');
      const draw = () => show.replaceChildren(el('p', { class: 'sv-catat' }, 'Pilih pesan:'), el('div', { class: 'seg' }, MESSAGES.map((t, i) => onTap(el('button', { class: `seg-btn ${m === i ? 'on' : ''}`, type: 'button' }, t.slice(0, 26) + '…'), () => { m = i; draw(); }))),
        el('p', { class: 'sv-catat' }, `Kunci (2–3 huruf, bukan A): ${key || '…'}`), el('div', { class: 'sv-abjad' }, [...ABC.slice(1)].map((c) => onTap(el('button', { class: 'seg-btn', type: 'button' }, c), () => { if (key.length < 3) { key += c; ctx.sound.tap(); draw(); } }))),
        el('div', { class: 'kode-baris' }, button('Hapus kunci', () => { key = ''; draw(); }), button(`Kirim ke Tim ${b + 1} ➜`, () => { if (key.length >= 2) crack(vig(MESSAGES[m], key), key, b); }, 'primary')));
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1} memilih pesan dan kunci. Tim ${b + 1} berpaling dulu!`), show);
      draw();
    }
    function crack(text, key, b) {
      const t0 = performance.now(); let wrong = 0;
      const host = el('div', { class: 'sv-pecah' });
      const msg = el('p', { class: 'reveal hint' }, `Panjang kuncinya ${key.length} huruf. Cari kuncinya secepat mungkin.`);
      wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1}: pecahkan pesan ini`), el('code', { class: 'sv-kode kecil' }, group(text)), host, msg);
      cracker(host, ctx, { text, len: key.length, maxLen: 3, onKey: (g) => {
        if (g !== key) { wrong++; ctx.mistake(); say(msg, 'bad', `Kunci ${g} belum tepat. Periksa lagi kolom yang huruf A-nya belum tertinggi.`); return; }
        const sec = Math.round((performance.now() - t0) / 1000); const p = Math.max(1, 5 - Math.floor(sec / 45) - wrong);
        pts[b] += p; ctx.sound.good(); say(msg, '', `Benar! Kunci ${key} dalam ${sec} detik: +${p}. ${MESSAGES[MESSAGES.findIndex((x) => vig(x, key) === text)]}`);
        k++; setTimeout(setup, 4000);
      } });
    }
    setup();
  }
  pickTeams(wrap, 'Kirim dan Pecahkan', start);
}
