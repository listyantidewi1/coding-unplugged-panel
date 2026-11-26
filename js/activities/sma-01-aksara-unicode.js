// Aksara Nusantara di Layar — SMA/SMK (16–18 tahun), representasi data.
// Unicode code points and UTF-8 bytes for Latin, aksara Jawa, Sunda, Bali,
// Makasar and emoji; two's complement on an 8-bit temperature sensor; and
// why 0,1 + 0,2 is not exactly 0,3 in binary.

import { el, onTap, button, shake } from '../core/util.js';
import { misiHead, fill } from './misi-kit.js';

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
function charBox(cp) {
  return el('div', { class: 'au-huruf' }, el('span', { class: 'aksara' }, cp === 0x11ee0 ? 'KA' : glyph(cp)), el('b', null, cpName(cp)), el('small', null, label(cp)));
}

function bitRow(bits, onBit, bad = false) {
  return el('div', { class: `au-bit-baris ${bad ? 'salah' : ''}` }, [...bits].map((b, i) => onBit ? onTap(el('button', { class: `au-bit ${b === '1' ? 'on' : ''}`, type: 'button', 'data-b': i }, b), () => onBit(i)) : el('span', { class: `au-bit ${b === '1' ? 'on' : ''}` }, b)));
}
// ---------- Permainan: Kantor Pos Byte ----------
// Each team runs a post-office counter that packs characters into UTF-8 byte
// boxes, opens parcels, weighs a message by bytes, sends temperatures on an
// 8-bit clock, and runs a fraction-doubling machine.

const PREFIX = ['', '0', '110', '1110', '11110'];
const slotSizes = (n) => (n === 1 ? [7] : [7 - n, ...Array(n - 1).fill(6)]);
const byteBits = (b) => b.toString(2).padStart(8, '0');
const prefixLen = (b) => (b < 0x80 ? 1 : (b & 0xe0) === 0xc0 ? 3 : (b & 0xf0) === 0xe0 ? 4 : (b & 0xf8) === 0xf0 ? 5 : 2);
const claimed = (b) => (b < 0x80 ? 1 : (b & 0xe0) === 0xc0 ? 2 : (b & 0xf0) === 0xe0 ? 3 : (b & 0xf8) === 0xf0 ? 4 : 0);
const cpBits = (cp, n) => cp.toString(2).padStart(RANGES[n - 1][2], '0');
const glyphOf = (cp) => (cp === 0x11ee0 ? 'KA' : cp === 0x200d ? 'ZWJ' : glyph(cp));
const PACK_POOL = [0xa9a4, 0xa995, 0xa9ab, 0xa98f, 0x1b33, 0x1ba0, 0x1f642, 0xe9, 0x11ee0];

// A cardboard byte box: prefix bits grey, payload coloured, empty slots dotted.
function parcel(bits, { pre = 0, color = 0, label = null, cls = '', closed = false, extra = {} } = {}) {
  const body = closed
    ? el('div', { class: 'kpb-tutup' }, '📦')
    : el('div', { class: 'kpb-slot' }, [...bits].map((b, i) => el('span', { class: i < pre ? 'awal' : b === '·' ? 'kosong' : `isi au-w${color}` }, b)));
  return el(extra.onTap ? 'button' : 'div', { class: `kpb-paket ${cls}`, ...(extra.onTap ? { type: 'button' } : {}) }, body, label != null ? el('b', { class: 'kpb-label' }, label) : null);
}
const sv = (v) => (v < 0 ? `−${-v}` : String(v));
const say = (msg, kind, text) => { msg.className = `reveal ${kind}`; msg.textContent = text; };

// Misi 1 · Kemas Paket: choose the box count, cut the bit tape, put the pieces in, stamp hex labels.
function packRound(wrap, ctx, cp, done) {
  const want = encode(cp);
  const n0 = want.length;
  const sig = cp.toString(2);
  let n = 0;
  const cuts = new Set();
  let placed = false;
  const labels = [];
  const msg = el('p', { class: 'reveal info' }, `Pita bit ${cpName(cp)} panjangnya ${sig.length} bit. Kotak pertama memakai awalan, kotak lanjutan memakai 10, sisanya slot x untuk pita.`);
  const board = el('div', { class: 'kpb-meja' });
  const tape = () => (n ? cpBits(cp, n) : sig);
  const pieces = () => { const t = tape(); const out = []; let s = 0; for (let i = 1; i <= t.length; i++) if (i === t.length || cuts.has(i)) { out.push(t.slice(s, i)); s = i; } return out; };
  const pieceOf = (i) => [...cuts].filter((c) => c <= i).length;
  const opts = want.map((b, j) => {
    const piece = byteBits(b).slice(j ? 2 : 8 - slotSizes(n0)[0]);
    const cand = [hex(b), hex(parseInt(piece, 2)), hex(((b & 15) << 4) | (b >> 4)), hex(b ^ 0x10), hex(b ^ 0x01)];
    return ctx.rand.shuffle(cand.filter((c, i) => cand.indexOf(c) === i).slice(0, 3));
  });
  function pickN(k) {
    if (n) return;
    if (k !== n0) {
      ctx.mistake();
      say(msg, 'bad', k < n0 ? `${k} kotak hanya punya ${RANGES[k - 1][2]} slot x, padahal pita ${sig.length} bit.` : `${k} kotak memang muat, tetapi UTF-8 selalu memakai kotak sesedikit mungkin.`);
      return;
    }
    n = k; ctx.sound.good();
    say(msg, 'info', `Benar, ${k} kotak dengan ${RANGES[k - 1][2]} slot x.${RANGES[k - 1][2] > sig.length ? ` Pita ditambah ${RANGES[k - 1][2] - sig.length} nol di depan.` : ''} Hitung slot kosong tiap kotak, lalu ketuk ✂ untuk memotong pita.`);
    draw();
  }
  function insert() {
    if (!n || placed) return;
    const p = pieces();
    const sizes = slotSizes(n);
    if (p.length !== n) { ctx.mistake(); shake(board); say(msg, 'bad', `Pita harus jadi ${n} potongan, satu untuk tiap kotak. Sekarang ada ${p.length}.`); return; }
    const j = p.findIndex((x, i) => x.length !== sizes[i]);
    if (j >= 0) { ctx.mistake(); shake(board); say(msg, 'bad', `Potongan ${j + 1} berisi ${p[j].length} bit, tetapi kotak ${j + 1} punya ${sizes[j]} slot kosong.`); return; }
    placed = true; ctx.sound.good();
    say(msg, 'info', 'Pas! Sekarang baca tiap kotak sebagai heksadesimal (4 bit = 1 angka) dan tempel labelnya.');
    draw();
  }
  function stamp(j, h) {
    if (labels[j]) return;
    if (h !== hex(want[j])) { ctx.mistake(); say(msg, 'bad', `Kotak ${j + 1} berisi ${byteBits(want[j])}. Bagi jadi dua kelompok 4 bit, termasuk awalannya.`); draw(); return; }
    labels[j] = h; ctx.sound.tap();
    if (labels.filter(Boolean).length === n) { say(msg, '', `Paket siap dikirim: ${want.map((b) => hex(b)).join(' ')}.`); draw(); done(); return; }
    draw();
  }
  function draw() {
    const t = tape();
    const pad = n ? t.length - sig.length : 0;
    const p = placed ? pieces() : [];
    fill(board,
      el('div', { class: 'kpb-kiri' }, charBox(cp)),
      el('div', { class: 'kpb-kanan' },
        n ? null : el('div', { class: 'kpb-pilih' }, [1, 2, 3, 4].map((k) => onTap(el('button', { class: 'kpb-nampan', type: 'button', 'data-n': k }, el('b', null, `${k} kotak`), el('small', null, `${RANGES[k - 1][2]} slot x`)), () => pickN(k)))),
        placed ? null : el('div', { class: 'kpb-pita' }, el('small', null, n ? 'Pita bit: ketuk ✂ di antara bit untuk memotong' : 'Pita bit titik kode'),
          el('div', { class: 'kpb-pita-bit' }, [...t].flatMap((b, i) => [
            i > 0 && n ? onTap(el('button', { class: `kpb-gunting ${cuts.has(i) ? 'on' : ''}`, type: 'button', 'data-cut': i, 'aria-label': `potong sebelum bit ${i + 1}` }, cuts.has(i) ? '✂' : '·'), () => { if (cuts.has(i)) cuts.delete(i); else cuts.add(i); ctx.sound.tap(); draw(); }) : null,
            el('span', { class: `kpb-bit ${i < pad ? 'nol' : ''} au-w${n ? pieceOf(i) % 4 : 0}` }, b)]))),
        n ? el('div', { class: 'kpb-baris' }, slotSizes(n).map((s, j) => el('div', { class: 'kpb-kolom' },
          parcel((j ? '10' : PREFIX[n]) + (placed ? p[j] : '·'.repeat(s)), { pre: j ? 2 : PREFIX[n].length, color: j % 4, label: labels[j] || null, cls: labels[j] ? 'jadi' : '' }),
          placed && !labels[j] ? el('div', { class: 'kpb-opsi' }, opts[j].map((h) => onTap(el('button', { class: 'kpb-cap', type: 'button' }, h), () => stamp(j, h)))) : null))) : null,
        n && !placed ? button('📥 Masukkan ke kotak', insert, 'primary') : null));
  }
  draw();
  wrap.append(board, msg);
}

// Merge consecutive broken bytes into one "rusak" unit.
function units(bytes) {
  const out = [];
  for (const x of decode(bytes)) {
    const last = out.at(-1);
    if (x.bad && last && last.bad) { last.len += 1; continue; }
    out.push(x.bad ? { bad: true, start: x.start, len: 1, n: claimed(bytes[x.start]) } : { cp: x.cp, start: x.start, len: x.bytes.length, n: x.bytes.length });
  }
  return out;
}

// Misi 2 · Buka Paket: open the first box, read its prefix, open the rest, name the character.
function unpackRound(wrap, ctx, bytes, done, { broken = false } = {}) {
  const us = units(bytes);
  let u = 0;
  let phase = 'buka';
  const opened = new Set();
  const results = [];
  let options = [];
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kotak yang menyala untuk membukanya.');
  const board = el('div', { class: 'kpb-meja kolom' });
  const unit = () => us[u];
  function makeOptions() {
    const cur = unit();
    if (cur.bad) { options = ctx.rand.shuffle([{ bad: true }, ...ctx.rand.shuffle(CHARS.filter((c) => c[0] > 0x7f)).slice(0, 3).map((c) => ({ cp: c[0] }))]); return; }
    const others = ctx.rand.shuffle(CHARS.filter((c) => c[0] !== cur.cp)).slice(0, 3).map((c) => ({ cp: c[0] }));
    options = ctx.rand.shuffle([{ cp: cur.cp }, ...others, ...(broken ? [{ bad: true }] : [])]);
  }
  function open(i) {
    if (phase !== 'buka' || i !== unit().start) return;
    opened.add(i); phase = 'hitung'; ctx.sound.tap();
    say(msg, 'info', `Kotak ${hex(bytes[i])} = ${byteBits(bytes[i])}. Lihat awalannya: berapa kotak membentuk satu karakter?`);
    draw();
  }
  function count(k) {
    if (phase !== 'hitung') return;
    const cur = unit();
    if (k !== cur.n) { ctx.mistake(); say(msg, 'bad', 'Belum tepat. 0… = 1 kotak, 110… = 2, 1110… = 3, 11110… = 4.'); return; }
    for (let i = cur.start; i < cur.start + k && i < bytes.length; i++) opened.add(i);
    phase = 'pilih'; ctx.sound.good(); makeOptions();
    if (cur.bad) {
      const at = cur.start + cur.len;
      say(msg, 'bad', at < bytes.length ? `Awas: kotak ${hex(bytes[at])} = ${byteBits(bytes[at])} tidak diawali 10. Ada kotak yang hilang!` : 'Awas: kotaknya kurang. Ada kotak yang hilang!');
    } else say(msg, 'info', `Gabungkan bit berwarna: ${cpName(cur.cp)}. Karakter apakah ini?`);
    draw();
  }
  function choose(o) {
    if (phase !== 'pilih') return;
    const cur = unit();
    if (!!o.bad !== !!cur.bad || (!cur.bad && o.cp !== cur.cp)) { ctx.mistake(); say(msg, 'bad', cur.bad ? 'Kotak lanjutan harus diawali 10. Paket ini rusak.' : `Bukan itu. Cari karakter ${cpName(cur.cp)}.`); return; }
    results[u] = cur.bad ? '⚠' : glyphOf(cur.cp);
    for (let i = cur.start + cur.len; i < cur.start + cur.n; i++) opened.delete(i);
    for (let i = cur.start; i < cur.start + cur.len; i++) opened.add(i);
    ctx.sound.good(); u += 1; phase = 'buka';
    if (u === us.length) {
      say(msg, '', `Isi paket: ${results.join(' ')}. ${broken ? 'Berkat awalan 10, pembaca bisa melompati bagian rusak dan tetap membaca karakter berikutnya.' : 'Awalan kotak pertama memberi tahu panjang setiap karakter.'}`);
      draw(); done(); return;
    }
    say(msg, 'info', 'Karakter tercatat. Buka kotak berikutnya.');
    draw();
  }
  function payload() {
    const cur = unit();
    if (cur.bad) return null;
    const parts = [];
    for (let i = cur.start; i < cur.start + cur.len; i++) parts.push(byteBits(bytes[i]).slice(i === cur.start ? prefixLen(bytes[i]) : 2));
    return el('div', { class: 'kpb-rakit' }, parts.map((p, j) => el('span', { class: `au-w${j % 4}` }, p)), el('b', null, ` = ${cpName(cur.cp)}`));
  }
  function draw() {
    const owner = (i) => us.findIndex((x) => i >= x.start && i < x.start + x.len);
    const cur = unit();
    fill(board,
      el('div', { class: 'kpb-baris' }, bytes.map((b, i) => {
        const o = owner(i);
        const isNext = phase === 'buka' && cur && i === cur.start;
        const bad = cur && phase === 'pilih' && cur.bad && i === cur.start + cur.len;
        const node = opened.has(i)
          ? parcel(byteBits(b), { pre: prefixLen(b), color: o >= 0 ? (i - us[o].start) % 4 : 0, label: hex(b), cls: `${bad ? 'rusak' : ''} ${o < u ? 'selesai' : ''}` })
          : parcel('', { closed: true, label: hex(b), cls: isNext ? 'nyala' : '', extra: isNext ? { onTap: true } : {} });
        if (isNext) { onTap(node, () => open(i)); node.dataset.buka = i; }
        return el('div', { class: 'kpb-kolom' }, node, o >= 0 && o < u && i === us[o].start ? el('b', { class: `kpb-hasil ${us[o].bad ? 'rusak' : ''} aksara` }, results[o]) : null);
      })),
      phase === 'hitung' ? el('div', { class: 'kpb-pilih' }, [1, 2, 3, 4].map((k) => onTap(el('button', { class: 'kpb-nampan', type: 'button', 'data-n': k }, el('b', null, `${k} kotak`)), () => count(k)))) : null,
      phase === 'pilih' ? payload() : null,
      phase === 'pilih' ? el('div', { class: 'kpb-kartu-kartu' }, options.map((o) => onTap(el('button', { class: `kpb-kartu ${o.bad ? 'rusak' : ''}`, type: 'button', 'data-cp': o.bad ? 'rusak' : o.cp }, o.bad ? el('b', null, '⚠ Rusak') : el('b', { class: 'aksara' }, glyphOf(o.cp)), el('small', null, o.bad ? 'ada kotak hilang' : label(o.cp))), () => choose(o)))) : null);
  }
  draw();
  wrap.append(board, msg);
}

// Misi 3 · Ongkos Kirim: drop character cards onto 1/2/3/4-box trays, weigh, then pay.
function shipRound(wrap, ctx, { groups, after = [], done }) {
  const cards = groups.map(([t, show]) => { const cps = codePoints(t); return { t, show: show || t.replace(/ /g, '␣'), k: cps.length, n: nBytes(cps[0]) }; });
  const where = cards.map(() => 0);
  let sel = -1;
  let weighed = false;
  let ask = 0;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu, lalu ketuk nampan sesuai banyak kotak per karakter. Spasi dan tanda baca ikut dihitung.');
  const board = el('div', { class: 'kpb-meja kolom' });
  const card = (c, i) => onTap(el('button', { class: `kpb-kartu kecil ${sel === i ? 'pilih' : ''} ${weighed ? `t${c.n}` : ''}`, type: 'button', 'data-i': i }, el('b', { class: 'aksara' }, c.show), c.k > 1 ? el('small', null, `${c.k} karakter`) : null), () => {
    if (weighed) return;
    if (where[i]) { if (sel >= 0) return; where[i] = 0; ctx.sound.tap(); draw(); return; }
    sel = sel === i ? -1 : i; draw();
  });
  function put(tray) { if (weighed || sel < 0) return; where[sel] = tray; sel = -1; ctx.sound.tap(); draw(); }
  function weigh() {
    if (weighed) return;
    if (where.some((w) => !w)) { say(msg, 'bad', 'Masih ada kartu di meja.'); shake(board); return; }
    const wrong = cards.map((c, i) => (where[i] !== c.n ? i : -1)).filter((i) => i >= 0);
    if (wrong.length) { wrong.forEach((i) => { where[i] = 0; }); ctx.mistake(); say(msg, 'bad', `${wrong.length} kartu salah nampan dan kembali ke meja. Huruf Latin 1 kotak, aksara Nusantara 3, emoji 4.`); draw(); return; }
    weighed = true; ctx.sound.good();
    const total = cards.reduce((t, c) => t + c.k * c.n, 0);
    say(msg, 'info', `Timbangan: ${[1, 2, 3, 4].map((n) => [n, cards.filter((c) => c.n === n).reduce((t, c) => t + c.k, 0)]).filter(([, k]) => k).map(([n, k]) => `${k} × ${n}`).join(' + ')} kotak.`);
    if (!after.length) { say(msg, '', `Total ${total} byte.`); done(); }
    draw();
  }
  function answer(o) {
    const q = after[ask];
    if (!o[1]) { ctx.mistake(); say(msg, 'bad', q.hint); return; }
    ctx.sound.good(); ask += 1;
    if (ask === after.length) { say(msg, '', q.end); draw(); done(); return; }
    say(msg, 'info', q.end); draw();
  }
  function draw() {
    const shuffled = after[ask] ? after[ask].opts : [];
    fill(board,
      where.every(Boolean) ? null : el('div', { class: 'kpb-meja-kartu' }, el('small', null, '🗂 Meja'), el('div', { class: 'kpb-kartu-kartu' }, cards.map((c, i) => (where[i] ? null : card(c, i))))),
      el('div', { class: 'kpb-nampan-nampan' }, [1, 2, 3, 4].map((n) => {
        const inside = cards.map((c, i) => [c, i]).filter(([, i]) => where[i] === n);
        const k = inside.reduce((t, [c]) => t + c.k, 0);
        return onTap(el('div', { class: `kpb-baki ${sel >= 0 ? 'siap' : ''}`, 'data-baki': n, role: 'button' },
          el('b', null, `${'📦'.repeat(n)} ${n} kotak`),
          el('div', { class: 'kpb-kartu-kartu' }, inside.map(([c, i]) => card(c, i))),
          weighed && k ? el('small', null, `${k} titik kode × ${n} = ${k * n} byte`) : null), () => put(n));
      })),
      weighed ? null : button('⚖ Timbang', weigh, 'primary'),
      weighed && after[ask] ? el('div', { class: 'kpb-tanya' }, el('b', null, after[ask].q), el('div', { class: 'kpb-opsi' }, shuffled.map((o) => onTap(el('button', { class: 'kpb-cap', type: 'button' }, o[0]), () => answer(o))))) : null);
  }
  after.forEach((q) => { q.opts = ctx.rand.shuffle(q.opts); });
  draw();
  wrap.append(board, msg);
}

// The 8-bit clock: 256 positions, 00000000 at the top, blue 0..127, red −128..−1.
function dial(u, trail) {
  const R = 120;
  const pos = (v, r = R) => { const a = (v / 256) * 2 * Math.PI - Math.PI / 2; return [150 + Math.cos(a) * r, 150 + Math.sin(a) * r]; };
  const ticks = [];
  for (let v = 0; v < 256; v += 16) { const [x, y] = pos(v); const [x2, y2] = pos(v, R * 1.15); ticks.push(`<line x1="${x}" y1="${y}" x2="${(x + x2) / 2}" y2="${(y + y2) / 2}" stroke="#94a3b8"/><text x="${x2}" y="${y2}" font-size="9" text-anchor="middle" dominant-baseline="middle" fill="${v >= 128 ? '#b91c1c' : '#1d4ed8'}">${v}</text>`); }
  let arc = '';
  if (trail && trail.steps) {
    const pts = [];
    const sgn = Math.sign(trail.steps);
    for (let k = 0; k <= Math.abs(trail.steps); k++) pts.push(pos((((trail.from + sgn * k) % 256) + 256) % 256, R * 0.86).join(','));
    arc = `<polyline points="${pts.join(' ')}" fill="none" stroke="#f97316" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const [px, py] = pos(u, R * 0.98);
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Jam 8 bit, token di posisi ${u}"><circle cx="150" cy="150" r="${R}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M150 ${150 - R} A ${R} ${R} 0 0 1 150 ${150 + R}" fill="none" stroke="#1d4ed8" stroke-width="6" opacity=".35"/><path d="M150 ${150 + R} A ${R} ${R} 0 0 1 150 ${150 - R}" fill="none" stroke="#b91c1c" stroke-width="6" opacity=".35"/><text x="212" y="154" text-anchor="middle" font-size="11" fill="#1d4ed8" font-weight="800">0 … 127</text><text x="88" y="154" text-anchor="middle" font-size="11" fill="#b91c1c" font-weight="800">−128 … −1</text>${ticks.join('')}${arc}<line x1="150" y1="150" x2="${px}" y2="${py}" stroke="#334155" stroke-width="2" stroke-dasharray="3 3"/><circle cx="${px}" cy="${py}" r="11" fill="#f59e0b" stroke="#78350f" stroke-width="3"/><circle cx="150" cy="150" r="5" fill="#334155"/></svg>`;
}

// Misi 4 · Jam 8 Bit. tasks: { kind: 'kirim', target } | { kind: 'baca', at, opts } | { kind: 'jumlah', at, add, opts? }
function clockRound(wrap, ctx, tasks, done) {
  let t = 0;
  let u = 0;
  let moved = 0;
  let from = 0;
  let stage = 'putar';
  const msg = el('p', { class: 'reveal info' });
  const board = el('div', { class: 'kpb-meja' });
  function begin() {
    const task = tasks[t];
    u = task.kind === 'kirim' ? 0 : task.at; from = u; moved = 0;
    stage = task.kind === 'baca' ? 'pilih' : 'putar';
    if (task.opts) task.opts = ctx.rand.shuffle(task.opts);
    say(msg, 'info', task.kind === 'kirim' ? `Kirim ${task.label}: putar token ke pola yang tepat. Nilai bertanda disembunyikan; mulai dari 00000000.`
      : task.kind === 'baca' ? `Sensor mengirim ${toBits(task.at)}. Berapa suhunya?`
        : `${sv(fromBits(toBits(task.at)))} + ${task.add}: putar token searah jarum jam tepat ${task.add} langkah.`);
    draw();
  }
  function turn(d) {
    if (stage !== 'putar') return;
    const before = u;
    u = (((u + d) % 256) + 256) % 256; moved += d; ctx.sound.tap();
    if (d > 0 && before + d >= 256) say(msg, 'info', 'Token melewati 11111111 → 00000000: bit ke-9 dibuang, putaran dimulai lagi.');
    else if (d > 0 && before <= 127 && before + d >= 128) say(msg, 'bad', 'Token melewati 01111111 → 10000000: dari 127 melompat ke −128. Itulah luapan.');
    draw();
  }
  function next() {
    t += 1;
    if (t === tasks.length) { draw(); done(); return; }
    setTimeout(begin, 1600);
  }
  function send() {
    const task = tasks[t];
    if (stage !== 'putar') return;
    if (task.kind === 'kirim') {
      if (u !== task.target) { ctx.mistake(); shake(board); say(msg, 'bad', `Pola ${toBits(u)} belum ${task.label}. Bilangan negatif ada di bagian merah: −1 satu langkah mundur dari 00000000.`); return; }
      stage = 'selesai'; ctx.sound.good(); say(msg, '', `Terkirim: ${toBits(u)} (posisi ${u}) = ${task.label}. Posisi ${u} = 256 − ${256 - u}.`); draw(); next(); return;
    }
    if (moved !== task.add) { ctx.mistake(); say(msg, 'bad', `Token baru berputar ${moved} langkah, seharusnya ${task.add}.`); return; }
    if (task.opts) { stage = 'pilih'; ctx.sound.good(); say(msg, 'info', `Token berhenti di ${toBits(u)}. Berapa nilai yang dibaca sensor?`); draw(); return; }
    stage = 'selesai'; ctx.sound.good(); say(msg, '', `${sv(fromBits(toBits(from)))} + ${task.add} = ${sv(fromBits(toBits(u)))}, yaitu ${toBits(u)}. Penjumlah biasa langsung benar untuk bilangan negatif.`); draw(); next();
  }
  function pick(o) {
    if (stage !== 'pilih') return;
    if (!o[1]) { ctx.mistake(); say(msg, 'bad', 'Belum tepat. Pola dengan bit pertama 1 bernilai negatif: nilai tanpa tanda − 256.'); return; }
    stage = 'selesai'; ctx.sound.good(); say(msg, '', o[2]); draw(); next();
  }
  function draw() {
    const task = tasks[t] || tasks.at(-1);
    const hide = task.kind === 'kirim' && stage === 'putar';
    const showSigned = !hide && !(stage === 'pilih');
    fill(board,
      el('div', { class: 'kpb-jam', html: dial(u, task.kind === 'jumlah' ? { from, steps: moved } : null) }),
      el('div', { class: 'kpb-kanan' },
        el('div', { class: 'kpb-sensor' }, el('small', null, `Tugas ${Math.min(t + 1, tasks.length)} dari ${tasks.length}`), bitRow(toBits(u)),
          el('span', null, `tanpa tanda ${u} · bertanda ${showSigned ? sv(fromBits(toBits(u))) : '?'}`),
          task.kind === 'jumlah' && stage === 'putar' ? el('b', null, `langkah: ${moved >= 0 ? '+' : ''}${moved}`) : null),
        stage === 'putar' ? el('div', { class: 'kpb-putar' }, [[-10, '⟲ 10'], [-1, '⟲ 1'], [1, '⟳ 1'], [10, '⟳ 10']].map(([d, l]) => onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-d': d }, l), () => turn(d)))) : null,
        stage === 'putar' ? button(task.kind === 'kirim' ? '📡 Kirim' : '✔ Selesai memutar', send, 'primary') : null,
        stage === 'pilih' ? el('div', { class: 'kpb-opsi' }, task.opts.map((o) => onTap(el('button', { class: 'kpb-cap', type: 'button' }, o[0]), () => pick(o)))) : null));
  }
  begin();
  wrap.append(board, msg);
}

// Misi 5 · Mesin Pengganda: ×2, take the bit that falls out, repeat with the rest; stop at 0 or on a repeat.
const dec = (m) => `${Math.floor(m / 1000)},${String(m % 1000).padStart(3, '0').replace(/0+$/, '') || '0'}`;
function doublerRound(wrap, ctx, num, done) {
  let rest = num;
  let product = null;
  const bits = [];
  const seen = [num];
  let over = false;
  const msg = el('p', { class: 'reveal info' }, 'Tekan ×2. Bila hasilnya 1 atau lebih, bit 1 keluar; bila kurang dari 1, bit 0 keluar.');
  const board = el('div', { class: 'kpb-meja' });
  const repeatAt = () => seen.indexOf(rest) < seen.length - 1;
  function times() {
    if (over || product !== null) return;
    if (repeatAt()) { ctx.mistake(); say(msg, 'bad', `Lihat catatan sisa: ${dec(rest)} sudah pernah muncul. Apa artinya?`); return; }
    product = rest * 2; ctx.sound.tap();
    say(msg, 'info', `${dec(rest)} × 2 = ${dec(product)}. Bit mana yang keluar?`); draw();
  }
  function bit(b) {
    if (over || product === null) return;
    const want = product >= 1000 ? 1 : 0;
    if (b !== want) { ctx.mistake(); say(msg, 'bad', `${dec(product)} ${want ? 'sudah' : 'belum'} mencapai 1.`); return; }
    bits.push(b); rest = product % 1000; product = null; seen.push(rest); ctx.sound.good();
    if (rest === 0) { over = true; say(msg, '', `Sisa 0, mesin berhenti: ${dec(num)} = 0,${bits.join('')}₂ dalam ${bits.length} langkah.`); draw(); done(); return; }
    say(msg, 'info', `Sisa ${dec(rest)}. Lanjutkan, atau tekan 🔁 bila sisa ini pernah muncul.`); draw();
  }
  function repeat() {
    if (over || product !== null) return;
    if (!repeatAt()) { ctx.mistake(); say(msg, 'bad', `Sisa ${dec(rest)} belum pernah muncul. Lanjutkan ×2.`); return; }
    over = true; ctx.sound.good();
    const k = seen.indexOf(rest);
    say(msg, '', `Sisa ${dec(rest)} muncul lagi, jadi bit langkah ${k + 1}–${bits.length} berulang selamanya: 0,${bits.slice(0, k).join('')}(${bits.slice(k).join('')})₂. Komputer harus memotongnya, jadi ${dec(num)} tersimpan tidak tepat.`);
    draw(); done();
  }
  function draw() {
    const k = over && rest !== 0 ? seen.indexOf(rest) : -1;
    fill(board,
      el('div', { class: `kpb-mesin ${over ? (rest ? 'merah' : 'hijau') : ''}` },
        el('small', null, '⚙ Mesin Pengganda'),
        el('code', { class: 'kpb-layar' }, product === null ? dec(rest) : `${dec(rest)} × 2 = ${dec(product)}`),
        el('div', { class: 'kpb-putar' }, onTap(el('button', { class: 'kpb-cap besar', type: 'button', 'data-act': 'x2' }, '×2'), times),
          onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-act': 'b0' }, '0 keluar'), () => bit(0)), onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-act': 'b1' }, '1 keluar'), () => bit(1)),
          onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-act': 'ulang' }, '🔁 Berulang'), repeat)),
        el('div', { class: 'kpb-deret' }, el('b', null, '0,'), bits.map((b, i) => el('span', { class: k >= 0 && i >= k ? 'ulang' : '' }, String(b))), el('b', null, '₂'))),
      el('ol', { class: 'kpb-catat' }, seen.slice(1).map((s, i) => el('li', { class: k >= 0 && (i + 1 === k || i + 1 === seen.length - 1) ? 'ulang' : '' }, `bit ${bits[i]} · sisa ${dec(s)}`))));
  }
  draw();
  wrap.append(board, msg);
}

const ROUND_HEAD = {
  pack: ['Kemas Paket', 'Kalian petugas loket Kantor Pos Byte. Kemas karakter ini ke kotak byte UTF-8: pilih banyak kotak, potong pita bit, masukkan, lalu tempel label heksa.'],
  unpack: ['Buka Paket', 'Paket datang hanya berlabel heksa. Buka kotak pertama, baca awalannya untuk tahu berapa kotak satu karakter, lalu tebak karakternya.'],
  lost: ['Paket Hilang', 'Satu kotak hilang di perjalanan. Buka paket satu per satu; bila kotak lanjutan tidak diawali 10, tandai rusak dan lanjutkan.'],
  ship: ['Ongkos Kirim', 'Dimas mengirim status ini. Taruh kartu karakter di nampan 1, 2, 3, atau 4 kotak, lalu timbang. Ongkos dihitung per byte.'],
  clock: ['Jam 8 Bit', 'Sensor ruang pembeku mengirim suhu sebagai 8 bit komplemen dua. Putar token di jam 256 posisi.'],
  sum: ['Jam 8 Bit: Penjumlahan', 'Menjumlah di jam berarti memutar token ke depan. Amati apa yang terjadi saat token melewati puncak dan dasar jam.'],
  frac: ['Mesin Pengganda', 'Ubah pecahan desimal ke biner: tekan ×2, ambil bit yang keluar, ulangi dengan sisanya.'],
  boss: ['Emoji Keluarga', 'Emoji keluarga tampil satu gambar, tetapi tersusun dari 5 titik kode yang direkatkan ZWJ (penyambung tak terlihat). Timbang paketnya.'],
};

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
    const wrap = el('div', { class: 'act aksara-unicode kpb-main' });
    root.append(wrap);
    // Seeded variant (same in every race pane): another character to pack.
    const packVar = ctx.rand.pick(PACK_POOL);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...ROUND_HEAD[key], '📮'));
      if (r === 0 || r === 5) { head('pack', 1); packRound(wrap, ctx, r === 0 ? 0xa9b2 : packVar, () => next()); }
      else if (r === 1) { head('unpack', 2); unpackRound(wrap, ctx, [0xe1, 0xae, 0xa0, 0xea, 0xa6, 0xa4], () => next()); }
      else if (r === 6) { head('lost', 2); unpackRound(wrap, ctx, [0x41, 0xea, 0xa6, 0xc3, 0xa9], () => next(), { broken: true }); }
      else if (r === 2) {
        head('ship', 3);
        wrap.append(el('div', { class: 'au-status aksara' }, STATUS));
        shipRound(wrap, ctx, {
          groups: [['Hanacaraka'], [' = '], ['ꦲ'], ['ꦤ'], ['ꦕ'], ['ꦫ'], ['ꦏ'], [' '], ['🙂']],
          after: [
            { q: 'Berapa byte UTF-8 status ini?', opts: [['33 byte', true], ['20 byte'], ['80 byte'], ['24 byte']], hint: 'Jumlahkan isi nampan: karakter × kotak.', end: '33 byte untuk 20 titik kode. Dalam UTF-32 setiap titik kode 4 byte: 20 × 4 = 80 byte.' },
            { q: 'Batas status 100 byte. Berapa yang muat?', opts: [['33 aksara Jawa atau 100 huruf Latin', true], ['100 aksara Jawa'], ['25 aksara Jawa atau 100 huruf Latin'], ['50 aksara Jawa atau 50 huruf Latin']], hint: 'Aksara Jawa 3 byte, huruf Latin 1 byte.', end: '100 ÷ 3 = 33 aksara Jawa, atau 100 huruf Latin. Batas dalam byte merugikan aksara Nusantara.' },
          ],
          done: () => next(4200),
        });
      } else if (r === 3) {
        head('clock', 4);
        clockRound(wrap, ctx, [
          { kind: 'kirim', target: 238, label: '−18 °C' },
          { kind: 'baca', at: 251, opts: [['−5 °C', true, '11111011 = 251 − 256 = −5 °C.'], ['251 °C'], ['−4 °C'], ['−123 °C']] },
        ], () => next());
      } else if (r === 7) {
        head('sum', 4);
        clockRound(wrap, ctx, [
          { kind: 'jumlah', at: 238, add: 25 },
          { kind: 'jumlah', at: 100, add: 50, opts: [['−106', true, '100 + 50 = 150 tidak muat di −128..127, jadi terbaca 150 − 256 = −106. Luapan!'], ['150'], ['127'], ['−150']] },
        ], () => next(4200));
      } else if (r === 4) { head('frac', 5); doublerRound(wrap, ctx, 625, () => next()); }
      else if (r === 8) { head('frac', 5); doublerRound(wrap, ctx, 100, () => next(5200)); }
      else {
        head('boss', 'Bos');
        wrap.append(el('div', { class: 'au-status besar' }, FAMILY));
        shipRound(wrap, ctx, {
          groups: [['👨'], ['‍', 'ZWJ'], ['👩'], ['‍', 'ZWJ'], ['👧']],
          after: [
            { q: 'Berapa byte UTF-8 emoji keluarga ini?', opts: [['18 byte', true], ['4 byte'], ['20 byte'], ['12 byte']], hint: 'Tiga emoji × 4 kotak + dua ZWJ × 3 kotak.', end: '3 × 4 + 2 × 3 = 18 byte untuk satu gambar.' },
            { q: 'Nama grup dibatasi 10 titik kode. Berapa emoji keluarga yang muat?', opts: [['2', true], ['10'], ['1'], ['3']], hint: 'Satu emoji keluarga = 5 titik kode.', end: '10 ÷ 5 = 2. Batas 10 titik kode hanya memuat 2 emoji keluarga, walaupun tampak seperti 2 gambar saja.' },
          ],
          done: () => next(4600),
        });
      }
    }
    render();
  },
};

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
