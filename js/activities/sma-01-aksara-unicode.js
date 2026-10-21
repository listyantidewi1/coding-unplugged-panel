// Aksara Nusantara di Layar — SMA/SMK (16–18 tahun), representasi data.
// Unicode code points and UTF-8 bytes for Latin, aksara Jawa, Sunda, Bali,
// Makasar and emoji; two's complement on an 8-bit temperature sensor; and
// why 0,1 + 0,2 is not exactly 0,3 in binary.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

export const CHARS = [
  [0x41, 'A', 'huruf Latin A'], [0xe9, 'é', 'huruf e beraksen'], [0xa9b2, 'ꦲ', 'aksara Jawa HA'], [0xa9a4, 'ꦤ', 'aksara Jawa NA'],
  [0xa995, 'ꦕ', 'aksara Jawa CA'], [0xa9ab, 'ꦫ', 'aksara Jawa RA'], [0xa98f, 'ꦏ', 'aksara Jawa KA'], [0x1b33, 'ᬳ', 'aksara Bali HA'],
  [0x1ba0, 'ᮠ', 'aksara Sunda HA'], [0x11ee0, '𑻠', 'aksara Makasar KA'], [0x1f642, '🙂', 'emoji wajah tersenyum'],
];
export const RANGES = [[0x7f, 1, 7], [0x7ff, 2, 11], [0xffff, 3, 16], [0x10ffff, 4, 21]];
export const hex = (n, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');
export const cpName = (cp) => `U+${hex(cp, 4)}`;
export const nBytes = (cp) => RANGES.find(([max]) => cp <= max)[1];
export function encode(cp) {
  const n = nBytes(cp);
  if (n === 1) return [cp];
  const out = [];
  for (let i = n - 1; i > 0; i--) out.unshift(0x80 | ((cp >> (6 * (n - 1 - i))) & 0x3f));
  const lead = [0, 0, 0xc0, 0xe0, 0xf0][n];
  return [lead | (cp >> (6 * (n - 1))), ...out];
}
// Decode with error marking: [{ cp, bytes, start } | { bad, start, why }]
export function decode(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    const n = b < 0x80 ? 1 : (b & 0xe0) === 0xc0 ? 2 : (b & 0xf0) === 0xe0 ? 3 : (b & 0xf8) === 0xf0 ? 4 : 0;
    if (!n) { out.push({ bad: true, start: i, why: (b & 0xc0) === 0x80 ? 'byte lanjutan tanpa byte awal' : 'byte awal tidak sah' }); i++; continue; }
    const seq = bytes.slice(i, i + n);
    if (seq.length < n || seq.slice(1).some((x) => (x & 0xc0) !== 0x80)) { out.push({ bad: true, start: i, why: 'byte lanjutan kurang atau tidak diawali 10' }); i++; continue; }
    let cp = n === 1 ? b : b & (0xff >> (n + 1));
    for (const x of seq.slice(1)) cp = (cp << 6) | (x & 0x3f);
    const over = cp < [0, 0, 0x80, 0x800, 0x10000][n] || cp > 0x10ffff;
    out.push(over ? { bad: true, start: i, why: 'titik kode di luar rentang pola ini' } : { cp, bytes: seq, start: i });
    i += n;
  }
  return out;
}
export const codePoints = (s) => [...s].map((c) => c.codePointAt(0));
export const byteLength = (s) => codePoints(s).reduce((t, cp) => t + nBytes(cp), 0);
export const STATUS = 'Hanacaraka = ꦲꦤꦕꦫꦏ 🙂';
export const SUGENG = 'ꦱꦸꦒꦼꦁ';
export const FAMILY = '👨‍👩‍👧';
// Two's complement, 8 bit.
export const toBits = (v) => ((v + 256) % 256).toString(2).padStart(8, '0');
export const fromBits = (b) => { const u = parseInt(b, 2); return u > 127 ? u - 256 : u; };
export const add8 = (a, b) => fromBits(((((a + 256) % 256) + ((b + 256) % 256)) % 256).toString(2).padStart(8, '0'));
export function fracBits(x, n) { let s = ''; let f = x; for (let i = 0; i < n; i++) { f *= 2; s += f >= 1 ? '1' : '0'; if (f >= 1) f -= 1; } return s; }

const glyph = (cp) => { const c = CHARS.find((x) => x[0] === cp); return c ? c[1] : String.fromCodePoint(cp); };
const label = (cp) => { const c = CHARS.find((x) => x[0] === cp); return c ? c[2] : cpName(cp); };

// Coloured bit mapping: code point bits → x positions in the byte pattern.
function mapping(cp) {
  const n = nBytes(cp);
  const width = RANGES[n - 1][2];
  const bits = cp.toString(2).padStart(width, '0');
  const sizes = n === 1 ? [7] : [7 - n - 0, ...Array(n - 1).fill(6)].map((s, i) => (i === 0 ? 8 - (n + 1) : s));
  const parts = [];
  let k = 0;
  sizes.forEach((s) => { parts.push(bits.slice(k, k + s)); k += s; });
  const prefix = n === 1 ? ['0'] : [['', '', '110', '1110', '11110'][n], ...Array(n - 1).fill('10')];
  return el('div', { class: 'au-peta' },
    el('div', { class: 'au-baris' }, el('small', null, `${cpName(cp)} dalam ${width} bit`), el('code', null, parts.map((p, i) => el('span', { class: `au-w${i}` }, p)))),
    el('div', { class: 'au-baris' }, el('small', null, `${n} byte UTF-8`), el('code', null, parts.map((p, i) => el('span', { class: 'au-byte' }, el('span', { class: 'au-awal' }, prefix[i]), el('span', { class: `au-w${i}` }, p))))),
    el('div', { class: 'au-baris' }, el('small', null, 'heksadesimal'), el('code', null, encode(cp).map((b) => hex(b)).join(' '))));
}
function rangeTable() {
  return el('table', { class: 'kls-tabel au-rentang' }, el('tbody', null,
    el('tr', null, ...['Rentang', 'Byte', 'Bit', 'Pola'].map((h) => el('th', null, h))),
    ...[['U+0000–U+007F', 1, 7, '0xxxxxxx'], ['U+0080–U+07FF', 2, 11, '110xxxxx 10xxxxxx'], ['U+0800–U+FFFF', 3, 16, '1110xxxx 10xxxxxx 10xxxxxx'], ['U+10000–U+10FFFF', 4, 21, '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx']].map((r) => el('tr', null, ...r.map((c, i) => el('td', null, i === 3 ? el('code', null, c) : String(c)))))));
}
function charBox(cp) {
  return el('div', { class: 'au-huruf' }, el('span', { class: 'aksara' }, cp === 0x11ee0 ? 'KA' : glyph(cp)), el('b', null, cpName(cp)), el('small', null, label(cp)));
}

export default {
  id: 'sma-01-aksara-unicode',
  title: 'Aksara Nusantara di Layar',
  topic: 'Unicode dan UTF-8, komplemen dua, dan pecahan biner',
  jenjang: 'sma',
  age: '16–18 th',
  icon: 'ꦲ',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mengubah titik kode Unicode ke byte UTF-8 dan sebaliknya, menghitung ukuran teks campuran aksara dan emoji, menyimpan bilangan negatif dengan komplemen dua dan mengenali luapan, serta menjelaskan mengapa 0,1 + 0,2 tidak tepat 0,3.',
  extraModes: [
    { id: 'pengurai', icon: '🔤', label: 'Pengurai UTF-8', desc: 'Pilih atau ketik karakter untuk melihat titik kode, bit, dan byte; atau masukkan byte heksadesimal untuk dibaca balik, lengkap dengan penanda byte tidak sah', create: createParser },
    { id: 'jam', icon: '🕛', label: 'Jam Komplemen Dua', desc: 'Lingkaran 256 posisi: nilai tanpa tanda dan bertanda untuk setiap pola 8 bit, dan penjumlahan sebagai langkah berputar', create: createClock },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act aksara-unicode' });
    root.append(wrap);
    const target = ctx.rand.pick([0xe9, 0xa9b2, 0x11ee0, 0x1ba0, 0x1f642]);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) encodeRound(wrap, ctx, { cp: target, done: next });
      else if (r === 1) ask('Sebuah berkas berisi byte E1 AE A0. Dari byte pertama, berapa byte yang membentuk karakter ini?', [['3 byte, karena E1 = 11100001 diawali 1110', true], ['1 byte, karena E1 kurang dari FF'], ['2 byte, karena diawali 11'], ['4 byte, karena diawali 1']], 1, rangeTable(),
        then(() => ask('Ambil bit x: 0001 + 101110 + 100000. Karakter apakah E1 AE A0?', [['U+1BA0, aksara Sunda HA', true], ['U+A9B2, aksara Jawa HA'], ['U+1B33, aksara Bali HA'], ['U+00E9, huruf é']], 1, null,
          then(() => ask('Mengapa setiap byte lanjutan selalu diawali 10?', [['Supaya komputer bisa mengenali awal setiap karakter, bahkan bila membaca dari tengah berkas atau ada byte rusak', true], ['Supaya berkas lebih kecil'], ['Karena 10 berarti sepuluh'], ['Supaya huruf Latin tetap 1 byte']])))));
      else if (r === 2) sizeRound(wrap, ctx, { done: next });
      else if (r === 3) ask(`Status "${STATUS}" berukuran 33 byte dalam UTF-8. Jika setiap titik kode disimpan 4 byte tetap (UTF-32), dan batas status 100 byte dalam UTF-8, bagaimana hasilnya?`, [['UTF-32: 80 byte. Dalam 100 byte UTF-8 muat 33 aksara Jawa atau 100 huruf Latin', true], ['UTF-32: 33 byte. Muat 100 aksara Jawa'], ['UTF-32: 132 byte. Muat 25 aksara Jawa atau 100 huruf Latin'], ['UTF-32: 80 byte. Muat 50 aksara Jawa atau 100 huruf Latin']], 1, el('div', { class: 'au-status aksara' }, STATUS));
      else if (r === 4) ask('Kata sugeng ditulis ꦱꦸꦒꦼꦁ: SA, sandhangan suku, GA, pepet, cecak. Berapa titik kode dan byte?', [['5 titik kode, 15 byte', true], ['2 titik kode, 6 byte'], ['3 titik kode, 9 byte'], ['5 titik kode, 10 byte']], 1, el('div', { class: 'au-status aksara besar' }, SUGENG),
        then(() => ask('Saat mengetik, tombol hapus bisa menghapus sandhangan saja tanpa menghapus aksaranya. Mengapa?', [['Sandhangan disimpan sebagai titik kode sendiri setelah aksaranya, walaupun di layar tampak menyatu', true], ['Karena ponselnya rusak'], ['Karena sandhangan lebih kecil'], ['Karena aksara Jawa tidak bisa dihapus']])));
      else if (r === 5) bitsRound(wrap, ctx, { prompt: 'Sensor mengirim suhu ruang pembeku −18 °C dalam 8 bit komplemen dua. Ketuk bit-bitnya.', want: toBits(-18), hint: '18 = 00010010, balik semua bit, lalu tambah 1.', done: next });
      else if (r === 6) ask('Sensor mengirim 11111011. Berapa suhunya? (rentang 8 bit bertanda: −128 sampai 127)', [['−5 °C', true], ['251 °C'], ['−4 °C'], ['−123 °C']], 2, el('code', { class: 'au-bit-besar' }, '11111011'),
        then(() => ask('Sensor rusak menjumlahkan 100 + 50 dalam 8 bit bertanda. Hasil yang terbaca?', [['−106, karena 150 di luar rentang −128 sampai 127 (luapan)', true], ['150'], ['127, karena dibatasi'], ['−150']], 1, null)));
      else if (r === 7) bitsRound(wrap, ctx, { prompt: 'Jumlahkan 11101110 (−18) dan 00011001 (25) seperti penjumlahan biner biasa, buang bit ke-9. Ketuk bit hasilnya.', want: toBits(add8(-18, 25)), hint: 'Hasilnya 7. Rangkaian penjumlah yang sama dipakai untuk bilangan negatif, tanpa aturan khusus.', show: ['11101110', '00011001'], done: next });
      else if (r === 8) fracRound(wrap, ctx, { done: () => { wrap.replaceChildren(); ask('0,1 dalam biner adalah 0,000110011001… Mengapa 0,1 + 0,2 tampil sebagai 0,30000000000000004?', [['0,1 dan 0,2 tidak bisa disimpan tepat dengan bit terbatas; keduanya dibulatkan, dan jumlahnya sedikit berbeda dari pembulatan 0,3', true], ['Karena komputer salah menjumlah'], ['Karena 0,3 terlalu besar'], ['Karena bahasa pemrogramannya rusak']], 1, null,
        then(() => ask('Mengapa aplikasi keuangan menyimpan uang sebagai bilangan bulat dalam satuan terkecil?', [['Bilangan bulat disimpan tepat, jadi selisih pembulatan tidak menumpuk pada ribuan transaksi', true], ['Supaya angkanya lebih pendek'], ['Karena uang tidak punya pecahan'], ['Supaya lebih cepat diketik']]))); } });
      else ask(`Tantangan: emoji keluarga ${FAMILY} tersusun dari U+1F468, U+200D, U+1F469, U+200D, U+1F467. Berapa byte UTF-8-nya, dan berapa yang muat bila nama grup dibatasi 10 titik kode?`, [['18 byte; 2 emoji muat', true], ['4 byte; 10 emoji muat'], ['20 byte; 2 emoji muat'], ['18 byte; 10 emoji muat']], 1, el('div', { class: 'au-status besar' }, FAMILY),
        then(() => ask('Titik kode saja belum cukup supaya orang bisa menulis aksara Jawa di ponsel. Apa lagi yang dibutuhkan?', [['Fon yang menampilkan aksara dan sandhangan, papan ketik, aturan tampilan, dukungan aplikasi, dan orang yang menulis konten', true], ['Tidak ada; titik kode sudah cukup'], ['Hanya ponsel yang lebih mahal'], ['Mengganti semua aksara dengan huruf Latin']])));
    }
    render();
  },
};

// Choose the byte count, then type the hex bytes.
function encodeRound(wrap, ctx, { cp, done }) {
  const want = encode(cp);
  let n = 0;
  let vals = [];
  let focus = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih banyak byte menurut rentang titik kodenya.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'au-samping' }, el('div', { class: 'au-kiri' }, charBox(cp), rangeTable()),
      el('div', { class: 'au-kanan' },
        el('div', { class: 'seg' }, [1, 2, 3, 4].map((k) => onTap(el('button', { class: `seg-btn ${n === k ? 'on' : ''}`, type: 'button', 'data-n': k }, `${k} byte`), () => pickN(k)))),
        n ? el('div', { class: 'au-sel' }, Array.from({ length: n }, (_, i) => onTap(el('button', { class: `ck-isi lebar ${focus === i ? 'fokus' : ''} ${bad.includes(i) ? 'salah' : ''}`, type: 'button', 'data-i': i }, vals[i] || '··'), () => { focus = i; draw(bad); }))) : null,
        n ? el('div', { class: 'keys keypad au-hex' }, [...'0123456789ABCDEF'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; const v = (vals[focus] || '') + d; vals[focus] = v.length > 2 ? d : v; if (vals[focus].length === 2 && focus < n - 1) focus++; draw(); })),
          onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { vals[focus] = (vals[focus] || '').slice(0, -1); draw(); })) : null,
        finished ? mapping(cp) : null)));
  }
  function pickN(k) {
    if (finished || n === want.length) return;
    if (k !== want.length) { msg.className = 'reveal bad'; msg.textContent = `${cpName(cp)} tidak di rentang ${k} byte.`; ctx.mistake(); return; }
    n = k; vals = []; focus = 0; ctx.sound.good();
    msg.className = 'reveal info'; msg.textContent = `Benar, ${k} byte. Tulis titik kodenya dalam ${RANGES[k - 1][2]} bit, isikan ke posisi x, lalu ketik byte-nya dalam heksadesimal.`;
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Dari titik kode ke byte UTF-8'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished || !n) return;
    const bad = want.map((b, i) => (vals[i] !== hex(b) ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} byte belum tepat.`; ctx.mistake(); return; }
    finished = true; draw(); msg.className = 'reveal'; msg.textContent = `Benar: ${want.map((b) => hex(b)).join(' ')}. Warna menunjukkan bit mana masuk ke byte mana.`; done();
  }, 'primary')), msg);
}

function sizeRound(wrap, ctx, { done }) {
  const want = [codePoints(STATUS).length, byteLength(STATUS)];
  const vals = [];
  let focus = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Spasi dan tanda sama dengan ikut dihitung. Huruf Latin 1 byte, aksara Jawa 3 byte, emoji 4 byte.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'au-status aksara' }, STATUS),
    el('div', { class: 'au-dua' }, ...['Banyak titik kode', 'Banyak byte UTF-8'].map((t, i) => el('label', null, t, onTap(el('button', { class: `ck-isi lebar ${focus === i ? 'fokus' : ''} ${bad.includes(i) ? 'salah' : ''}`, type: 'button', 'data-i': i }, vals[i] ?? '…'), () => { focus = i; draw(bad); })))),
    finished ? el('div', { class: 'au-pecah' }, [...STATUS].map((c) => el('span', { class: `au-b${nBytes(c.codePointAt(0))}` }, el('b', { class: 'aksara' }, c === ' ' ? '␣' : c), el('small', null, nBytes(c.codePointAt(0)))))) : null);
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; const s = String(vals[focus] ?? ''); vals[focus] = s.length >= 2 ? Number(d) : Number(s + d); draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { vals[focus] = undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, 'Dimas mengirim status ini. Berapa ukurannya?'), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const bad = want.map((w, i) => (vals[i] !== w ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Hitung per karakter.'; ctx.mistake(); return; }
    finished = true; draw(); msg.className = 'reveal'; msg.textContent = '20 titik kode, 33 byte: 13 karakter Latin × 1 + 5 aksara × 3 + 1 spasi + emoji 4.'; done();
  }, 'primary')), msg);
}

function bitRow(bits, onBit, bad = false) {
  return el('div', { class: `au-bit-baris ${bad ? 'salah' : ''}` }, [...bits].map((b, i) => onBit ? onTap(el('button', { class: `au-bit ${b === '1' ? 'on' : ''}`, type: 'button', 'data-b': i }, b), () => onBit(i)) : el('span', { class: `au-bit ${b === '1' ? 'on' : ''}` }, b)));
}
function bitsRound(wrap, ctx, { prompt, want, hint, show = null, done }) {
  let bits = '00000000';
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, hint);
  const draw = (bad = false) => stage.replaceChildren(el('div', { class: 'au-jumlah' },
    ...(show ? show.map((s, i) => el('div', { class: 'au-jumlah-baris' }, el('b', null, i ? '+' : ''), bitRow(s), el('small', null, String(fromBits(s))))) : []),
    show ? el('hr') : null,
    el('div', { class: 'au-jumlah-baris' }, el('b', null, show ? '=' : ''), bitRow(bits, (i) => { if (finished) return; bits = bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1); ctx.sound.tap(); draw(); }, bad), el('small', null, `tanpa tanda ${parseInt(bits, 2)} · bertanda ${fromBits(bits)}`))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    if (bits !== want) { draw(true); msg.className = 'reveal bad'; msg.textContent = `Belum tepat. ${hint}`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = `Benar: ${want} = ${fromBits(want)}.`; done();
  }, 'primary')), msg);
}

function fracRound(wrap, ctx, { done }) {
  let s = '';
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Kalikan dengan 2, catat bagian bulatnya, ulangi dengan bagian pecahannya.');
  const steps = () => { const out = []; let f = 0.625; for (let i = 0; i < s.length && i < 3; i++) { const g = f * 2; out.push(`${String(f).replace('.', ',')} × 2 = ${String(g).replace('.', ',')} → ${g >= 1 ? 1 : 0}`); f = g >= 1 ? g - 1 : g; } return out; };
  const draw = (bad = false) => stage.replaceChildren(el('div', { class: `au-status ${bad ? 'salah' : ''}` }, `0,625 = 0,${s || '…'}₂`), el('ol', { class: 'au-langkah' }, steps().map((t) => el('li', null, t))));
  draw();
  const pad = el('div', { class: 'keys keypad' }, ['0', '1'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished || s.length >= 6) return; s += d; draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { s = s.slice(0, -1); draw(); }));
  wrap.append(el('p', { class: 'prompt' }, 'Pecahan dalam biner: 0,1₂ = ½, 0,01₂ = ¼, 0,001₂ = ⅛. Tulis 0,625 dalam biner.'), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    if (s !== fracBits(0.625, 3)) { draw(true); msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. ½ + ⅛ = 0,625.'; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: 0,101₂ = ½ + ⅛. Sekarang coba 0,1…'; setTimeout(done, 1800);
  }, 'primary')), msg);
}

function createParser(root, ctx) {
  const wrap = el('div', { class: 'act aksara-unicode' });
  root.append(wrap);
  let text = 'ꦲꦤ 🙂';
  let bytesIn = 'E1 AE A0 EA A6 A4 80 41';
  let view = 'teks';
  const input = el('input', { class: 'au-masukan aksara', value: text, 'aria-label': 'Teks' });
  input.addEventListener('input', () => { text = input.value; draw(); });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  const out = el('div');
  function draw() {
    if (view === 'teks') {
      const cps = codePoints(text);
      out.replaceChildren(...[el('p', { class: 'reveal info' }, `${cps.length} titik kode · ${byteLength(text)} byte UTF-8 · ${cps.length * 4} byte UTF-32`),
        el('div', { class: 'au-daftar' }, cps.slice(0, 12).map((cp) => el('div', { class: 'au-kartu' }, charBox(cp), mapping(cp)))),
        cps.length > 12 ? el('p', { class: 'reveal info' }, `… dan ${cps.length - 12} titik kode lagi.`) : null].filter(Boolean));
    } else {
      const bytes = bytesIn.trim().split(/\s+/).filter(Boolean).map((h) => parseInt(h, 16)).filter((b) => b >= 0 && b <= 255);
      const res = decode(bytes);
      out.replaceChildren(el('div', { class: 'au-status' }, bytesIn || '…'),
        el('div', { class: 'au-daftar' }, res.map((x) => (x.bad
          ? el('div', { class: 'au-kartu salah' }, el('b', null, `byte ${x.start + 1}: ${hex(bytes[x.start])}`), el('small', null, `tidak sah: ${x.why}`))
          : el('div', { class: 'au-kartu' }, charBox(x.cp), el('code', null, x.bytes.map((b) => hex(b)).join(' ')))))));
    }
  }
  const hexPad = el('div', { class: 'keys keypad au-hex' }, [...'0123456789ABCDEF'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { const last = bytesIn.split(' ').at(-1); bytesIn = last.length >= 2 || !bytesIn ? `${bytesIn}${bytesIn ? ' ' : ''}${d}` : bytesIn + d; draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { bytesIn = bytesIn.slice(0, -1).trimEnd(); draw(); }));
  function frame() {
    wrap.replaceChildren(el('div', { class: 'seg' }, [['teks', 'Karakter → byte'], ['byte', 'Byte → karakter']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${view === k ? 'on' : ''}`, type: 'button' }, l), () => { view = k; frame(); }))),
      view === 'teks' ? el('div', { class: 'au-alat' }, input, el('div', { class: 'au-palet' }, [...CHARS.map((c) => c[0]), ...codePoints(SUGENG), ...codePoints(FAMILY)].filter((cp, i, a) => a.indexOf(cp) === i).map((cp) => onTap(el('button', { class: 'au-pilih aksara', type: 'button' }, cp === 0x11ee0 ? 'Mks' : cp === 0x200d ? 'ZWJ' : String.fromCodePoint(cp)), () => { text += String.fromCodePoint(cp); input.value = text; draw(); })),
        onTap(el('button', { class: 'au-pilih', type: 'button' }, '⌫'), () => { text = [...text].slice(0, -1).join(''); input.value = text; draw(); }), onTap(el('button', { class: 'au-pilih', type: 'button' }, 'Kosongkan'), () => { text = ''; input.value = ''; draw(); })))
        : hexPad, out);
    draw();
  }
  frame();
}

function createClock(root, ctx) {
  const wrap = el('div', { class: 'act aksara-unicode' });
  root.append(wrap);
  let bits = toBits(-18);
  let add = 25;
  let path = null;
  function svg() {
    const R = 120;
    const pos = (u) => { const a = (u / 256) * 2 * Math.PI - Math.PI / 2; return [150 + Math.cos(a) * R, 150 + Math.sin(a) * R]; };
    const ticks = [];
    for (let u = 0; u < 256; u += 16) { const [x, y] = pos(u); const [x2, y2] = [150 + (x - 150) * 1.16, 150 + (y - 150) * 1.16]; ticks.push(`<line x1="${x}" y1="${y}" x2="${(x + x2) / 2}" y2="${(y + y2) / 2}" stroke="#94a3b8"/><text x="${x2}" y="${y2}" font-size="8.5" text-anchor="middle" dominant-baseline="middle" fill="${u >= 128 ? '#b91c1c' : '#1d4ed8'}">${u >= 128 ? u - 256 : u}</text>`); }
    const u = parseInt(bits, 2);
    const [px, py] = pos(u);
    let arc = '';
    if (path) {
      const [a, b] = path;
      const pts = [];
      const steps = Math.abs(b);
      for (let k = 0; k <= steps; k += Math.max(1, Math.floor(steps / 60))) pts.push(pos(((a + 256) % 256 + Math.sign(b) * k + 256) % 256).map((v) => (v - 150) * 0.85 + 150).join(','));
      pts.push(pos((((a + b) % 256) + 256) % 256).map((v) => (v - 150) * 0.85 + 150).join(','));
      arc = `<polyline points="${pts.join(' ')}" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 300 300" role="img" aria-label="Jam komplemen dua"><circle cx="150" cy="150" r="${R}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M150 ${150 - R} A ${R} ${R} 0 0 1 150 ${150 + R}" fill="none" stroke="#1d4ed8" stroke-width="5" opacity=".35"/><path d="M150 ${150 + R} A ${R} ${R} 0 0 1 150 ${150 - R}" fill="none" stroke="#b91c1c" stroke-width="5" opacity=".35"/>${ticks.join('')}${arc}<line x1="150" y1="150" x2="${px}" y2="${py}" stroke="#111827" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="150" r="6" fill="#111827"/><text x="150" y="190" text-anchor="middle" font-size="12" font-weight="800">${u} / ${fromBits(bits)}</text></svg>`;
  }
  function draw() {
    const v = fromBits(bits);
    const sum = add8(v, add);
    const wrapAround = v + add > 127 || v + add < -128;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Jam komplemen dua: 256 posisi, biru 0 sampai 127, merah −128 sampai −1.'),
      el('div', { class: 'au-samping' }, el('div', { class: 'au-jam', html: svg() }),
        el('div', { class: 'au-kanan' },
          el('b', null, 'Pola 8 bit (ketuk untuk membalik bit)'),
          bitRow(bits, (i) => { bits = bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1); path = null; draw(); }),
          el('p', { class: 'reveal info' }, `Tanpa tanda: ${parseInt(bits, 2)} · Bertanda: ${v}`),
          el('div', { class: 'seg' }, [['−n: balik dan tambah 1', () => { bits = toBits(-v === 128 ? -128 : -v); path = null; }], ['Nol', () => { bits = '00000000'; path = null; }]].map(([l, fn]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { fn(); draw(); }))),
          el('b', null, `Tambahkan ${add >= 0 ? '+' : ''}${add}`),
          el('div', { class: 'seg' }, [-50, -10, -1, 1, 10, 25, 50, 100].map((x) => onTap(el('button', { class: `seg-btn ${add === x ? 'on' : ''}`, type: 'button' }, `${x > 0 ? '+' : ''}${x}`), () => { add = x; draw(); }))),
          button('Putar ➜', () => { path = [parseInt(bits, 2), add, v, sum, wrapAround]; bits = toBits(sum); draw(); }, 'primary'),
          path ? el('p', { class: path[4] ? 'reveal bad' : 'reveal' }, `${path[2]} ${path[1] >= 0 ? '+' : '−'} ${Math.abs(path[1])} = ${path[3]}${path[4] ? ' (luapan: melewati batas 127/−128)' : ''}`) : null)));
  }
  draw();
}
