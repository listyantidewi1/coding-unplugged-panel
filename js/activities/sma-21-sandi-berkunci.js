// Sandi Berkunci — SMA/SMK (16–18 tahun), kriptografi klasik dan kriptanalisis.
// The Vigenère cipher on a Pramuka trail: encrypt and decrypt with a shifted
// alphabet strip, find repeated sequences and their distances, count letters
// per column to recover the key, the one-time pad, and password habits.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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
// Bars of letter counts; shift s shows the counts as if read with key letter s.
function bars(counts, { s = 0, ref = false, pick = null, mark = null } = {}) {
  const max = Math.max(...counts, 1);
  return el('div', { class: 'sv-batang' }, ...[...ABC].map((c, i) => {
    const v = counts[(i + s) % 26];
    const node = el(pick ? 'button' : 'div', { class: `sv-bt ${mark === i ? 'tanda' : ''}`, type: pick ? 'button' : null, 'data-i': i },
      ref ? el('i', { class: 'ref', style: { height: `calc((100% - 1.1em) * ${FREQ_ID[c] / 19.1})` } }) : null,
      el('i', { style: { height: `${(v / max) * 100}%` } }), el('small', null, c));
    return pick ? onTap(node, () => pick(i)) : node;
  }));
}

// The sliding strip: a fixed A–Z on top, and below it a strip of A–Z twice that
// slides so the key letter sits under A. set(s) slides it; mark(i) lights column i.
function pita({ onTop = null, onBottom = null } = {}) {
  const cell = (tag, c, cb, extra = {}) => { const b = el(tag, { class: 'jm21-sel', type: tag === 'button' ? 'button' : null, ...extra }, c); return cb ? onTap(b, cb) : b; };
  const tops = [...ABC].map((c, i) => cell(onTop ? 'button' : 'span', c, onTop && (() => onTop(i)), { 'data-i': i }));
  const lows = Array.from({ length: 26 }, (_, i) => cell(onBottom ? 'button' : 'span', ch(i), onBottom && (() => onBottom(Number(lows[i].dataset.j))), { 'data-j': i }));
  const track = el('div', { class: 'jm21-rel' }, lows);
  const node = el('div', { class: 'jm21-pita' },
    el('b', null, 'Asli'), el('div', { class: 'jm21-atas' }, tops),
    el('b', null, 'Pita'), el('div', { class: 'jm21-jendela' }, track));
  let s = 0;
  const api = {
    node,
    get s() { return s; },
    set(v) {
      const d = ((v - s + 39) % 26) - 13; s = v; node.dataset.s = v;
      lows.forEach((b, i) => { b.textContent = ch(i + v); b.dataset.j = i + v; });
      if (d && track.animate) track.animate([{ transform: `translateX(${(d * 100) / 26}%)` }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
      api.mark(null);
    },
    mark(i) { tops.forEach((t, k) => t.classList.toggle('sorot', k === i)); lows.forEach((t, k) => t.classList.toggle('sorot', k === i)); },
  };
  api.set(0);
  return api;
}

// Encrypt (dir 1) or decrypt (dir -1) letter by letter: tap the key letter to
// slide the strip, then tap the letter on the strip.
function pitaBoard(host, ctx, { text, key, dir, given = 0, need = Infinity, labels = null, done }) {
  const t = only(text); const kk = only(key); const out = vig(t, kk, dir);
  let k = given;
  const L = labels || (dir === 1 ? ['Pesan', 'Kunci', 'Sandi'] : ['Sandi', 'Kunci', 'Pesan']);
  const grid = el('div', { class: 'jm21-grid' });
  const tabs = el('div', { class: 'jm21-tab' });
  const msg = el('p', { class: 'reveal info' });
  const p = pita(dir === 1 ? { onTop: (i) => tapLetter(i, i + pp.s) } : { onBottom: (j) => tapLetter(j - pp.s, j) });
  const pp = p;
  const drawGrid = () => {
    grid.replaceChildren(...[(i) => t[i], (i) => kk[i % kk.length], (i) => (i < k ? out[i] : '')].map((f, r) => el('div', { class: 'jm21-grid-baris' }, el('b', null, L[r]),
      ...[...t].map((_, i) => el('span', { class: `${i === k && k < t.length ? 'kini' : ''} ${r === 2 && i < given ? 'diberi' : ''} ${r === 1 && kk[i % kk.length] === 'A' ? 'nol' : ''}`, 'data-i': i }, f(i))))));
  };
  const keyNow = () => kk[k % kk.length];
  const uniq = [...new Set(kk)];
  tabs.append(el('small', null, 'Geser pita ke huruf kunci:'), ...uniq.map((c) => onTap(el('button', { class: 'jm21-tab-btn', type: 'button', 'data-k': c }, c), () => {
    if (k >= t.length) return;
    if (c !== keyNow()) { ctx.mistake(); shake(tabs); say(msg, 'bad', `Huruf kunci di bawah huruf ke-${k + 1} adalah ${keyNow()}, bukan ${c}.`); return; }
    ctx.sound.tap(); p.set(n(c)); tabs.querySelectorAll('.jm21-tab-btn').forEach((b) => b.classList.toggle('on', b.dataset.k === c));
    say(msg, 'info', dir === 1 ? `Pita bergeser: ${c} kini di bawah A. Ketuk huruf asli ${t[k]} di baris atas.` : `Pita bergeser: ${c} kini di bawah A. Ketuk huruf sandi ${t[k]} di pita.`);
  })));
  function tapLetter(i, j) {
    if (k >= t.length) return;
    if (p.s !== n(keyNow())) { ctx.mistake(); shake(tabs); say(msg, 'bad', `Geser pitanya dulu: ketuk huruf kunci ${keyNow()}.`); return; }
    const ok = dir === 1 ? ABC[i] === t[k] : i >= 0 && i < 26 && ch(j) === t[k];
    if (!ok) { ctx.mistake(); shake(p.node); say(msg, 'bad', dir === 1 ? `Cari huruf asli ${t[k]} di baris atas.` : `Cari huruf sandi ${t[k]} di pita, lalu lihat huruf di atasnya.`); return; }
    p.mark(i); ctx.sound.tap();
    say(msg, 'info', dir === 1 ? `${t[k]} → ${ch(j)}` : `${t[k]} ← ${ABC[i]}`);
    k++;
    if (k - given >= need && k < t.length) { k = t.length; say(msg, 'info', 'Caranya sudah lancar. Sisanya diisi otomatis.'); }
    drawGrid();
    if (k >= t.length) { tabs.remove(); done(out); }
  }
  say(msg, 'info', dir === 1 ? 'Langkah: ketuk huruf kunci (pita bergeser), lalu ketuk huruf asli di baris atas. Huruf di bawahnya adalah sandinya.' : 'Langkah: ketuk huruf kunci (pita bergeser), lalu ketuk huruf sandi di pita. Huruf di atasnya adalah huruf asli.');
  host.append(grid, tabs, p.node, msg);
  drawGrid();
  return { grid, msg, pita: p };
}

// Tap the cipher letters that are the same as the plain letters.
function sameStep(host, ctx, { grid, msg }, t, out, done) {
  const want = [...t].map((c, i) => (c === out[i] ? i : -1)).filter((i) => i >= 0);
  const got = new Set();
  const row = grid.lastElementChild;
  say(msg, 'info', `Sandi: ${group(out)}. Ada ${want.length} huruf yang tidak berubah. Ketuk semuanya di baris Sandi.`);
  [...row.querySelectorAll('span')].forEach((sp) => {
    const i = Number(sp.dataset.i);
    const b = el('button', { class: 'jm21-sama', type: 'button', 'data-i': i }, sp.textContent);
    sp.replaceWith(onTap(b, () => {
      if (got.has(i)) return;
      if (!want.includes(i)) { ctx.mistake(); shake(b); say(msg, 'bad', `Huruf ke-${i + 1}: ${t[i]} menjadi ${out[i]}. Itu berubah.`); return; }
      got.add(i); b.classList.add('kena'); ctx.sound.tap();
      if (got.size === want.length) {
        grid.querySelectorAll('.jm21-grid-baris:nth-child(2) span.nol').forEach((s) => s.classList.add('kena'));
        say(msg, '', `Huruf ke-${want.map((x) => x + 1).join(', ')} tetap karena kuncinya A (geser 0). Tiga huruf A pada LAPANGAN malah menjadi S, U, S. Pelajaran: kunci sebaiknya huruf acak, bukan kata biasa yang memuat A.`);
        done();
      }
    }));
  });
}

// Ciphertext laid out 20 letters per row; taps on letters report positions.
function cipherGrid(text, { marks = {}, onTap: tap } = {}) {
  const rows = [];
  for (let r = 0; r * 20 < text.length; r++) {
    const a = r * 20 + 1;
    rows.push(el('div', { class: 'sv-sb' }, el('small', null, `${a}–${Math.min(a + 19, text.length)}`), ...[...text.slice(r * 20, r * 20 + 20)].map((c, j) => {
      const p = a + j; const m = marks[p];
      return onTap(el('button', { class: `sv-h ${m || ''} ${j % 5 === 4 ? 'akhir' : ''}`, type: 'button', 'data-p': p }, c), () => tap?.(p));
    })));
  }
  return el('div', { class: 'sv-sandi jm21-sandi' }, rows);
}

function traceRound(host, ctx, { done }) {
  const T = CIPHER3; let k = 1; const found = {}; const dist = { RHYI: 8 };
  const box = el('div');
  const table = el('div', { class: 'sv-jejak' });
  const msg = el('p', { class: 'reveal info' });
  const marks = () => { const m = {}; for (const s of TRACES) for (const p of found[s] || []) for (let i = 0; i < s.length; i++) m[p + i] = s === TRACES[k] ? 'kena' : 'lama'; return m; };
  found.RHYI = where(T, 'RHYI');
  const draw = () => {
    box.replaceChildren(cipherGrid(T, { marks: marks(), onTap: (p) => {
      if (k >= TRACES.length) return;
      const s = TRACES[k]; const occ = where(T, s); const f = (found[s] ||= []);
      if (!occ.includes(p) || f.includes(p)) { ctx.mistake(); shake(box); say(msg, 'bad', `Huruf ke-${p} bukan awal deret ${s} yang belum ditemukan.`); return; }
      f.push(p); f.sort((a, b) => a - b); ctx.sound.tap();
      if (f.length === occ.length) { dist[s] = f[1] - f[0]; say(msg, 'info', `${s}: letak ${f[0]} dan ${f[1]}, jarak ${dist[s]}.`); k++; }
      draw();
      if (k >= TRACES.length) { box.remove(); sieve(host, ctx, { dists: TRACES.map((x) => dist[x]), msg, done }); }
    } }));
    table.replaceChildren(el('div', { class: 'sv-jejak-baris kepala' }, el('b', null, 'Deret'), el('b', null, 'Letak'), el('b', null, 'Jarak')),
      ...TRACES.map((s, i) => el('div', { class: `sv-jejak-baris ${i === k ? 'kini' : ''}` }, el('code', null, s), el('span', null, (found[s] || []).join(' dan ') || '?'), el('span', null, dist[s] ?? '?'))));
    if (k < TRACES.length && !(found[TRACES[k]] || []).length) say(msg, 'info', `Ketuk huruf pertama setiap kemunculan ${TRACES[k]} (dua kali muncul).`);
  };
  host.append(el('div', { class: 'sv-dua jm21-dua' }, box, table), msg);
  draw();
}

// Test candidate key lengths against all the distances.
function sieve(host, ctx, { dists, msg, done }) {
  const lens = [2, 3, 4, 5, 6, 7, 8, 9];
  const out = el('div', { class: 'jm21-saring' });
  let cur = null; let fin = false;
  const draw = () => out.replaceChildren(
    el('div', { class: 'jm21-saring-btn' }, el('small', null, 'Coba panjang kunci:'), ...lens.map((x) => onTap(el('button', { class: `jm21-tab-btn ${cur === x ? 'on' : ''}`, type: 'button', 'data-n': x }, x), () => test(x)))),
    el('div', { class: 'jm21-saring-jarak' }, ...dists.map((d) => el('span', { class: cur ? (d % cur ? 'tidak' : 'ya') : '' }, cur ? `${d} : ${cur} = ${Math.floor(d / cur)}${d % cur ? ` sisa ${d % cur}` : ' ✓'}` : `jarak ${d}`))));
  function test(x) {
    if (fin) return;
    cur = x; ctx.sound.tap(); draw();
    const all = dists.every((d) => d % x === 0);
    if (!all) say(msg, 'info', `${x} tidak membagi habis semua jarak. Kunci ${x} huruf tidak cocok.`);
    else if (x === 2) say(msg, 'info', '2 membagi habis semuanya, tetapi kunci sepanjang 2 berarti kunci sepanjang 4 pun berulang. Cari bilangan terbesar yang membagi semuanya.');
    else { fin = true; say(msg, '', `Panjang kunci ${x}: FPB(${dists.join(', ')}) = ${x}. Deret yang sama muncul lagi karena huruf yang sama bertemu huruf kunci yang sama.`); done(); }
  }
  say(msg, 'info', 'Jarak 8, 36, 20, 8. Panjang kunci harus membagi habis semua jarak. Coba-coba!');
  host.append(out);
  draw();
}

// Column cracker: pick the key length (or it is given), tap a bar to slide it
// under A, nudge with ◀ ▶, and watch the preview until the message reads.
function crackGame(host, ctx, { text, plain, len: fixed = null, lens = [2, 3, 4, 5], hint = null, done }) {
  let len = fixed; let shifts = fixed ? Array(fixed).fill(0) : []; let fin = false;
  const top_ = el('div', { class: 'jm21-saring-btn' });
  const cols = el('div', { class: 'sv-kolom-kolom jm21-kolom' });
  const prev = el('code', { class: 'jm21-baca' });
  const msg = el('p', { class: 'reveal info' }, hint || 'Ketuk batang tertinggi di setiap kolom: huruf itu kemungkinan sandi dari A.');
  const key = () => shifts.map((s) => ABC[s]).join('');
  const check = () => {
    if (fin || !len) return;
    if (vig(text, key(), -1) === plain) { fin = true; ctx.sound.good(); say(msg, '', `Terbaca! Kuncinya ${key()}.`); draw(); done(key()); }
  };
  const draw = () => {
    if (!fixed) top_.replaceChildren(el('small', null, 'Panjang kunci:'), ...lens.map((x) => onTap(el('button', { class: `jm21-tab-btn ${len === x ? 'on' : ''}`, type: 'button', 'data-n': x }, x), () => { if (fin) return; len = x; shifts = Array(x).fill(0); ctx.sound.tap(); draw(); })));
    if (!len) { cols.replaceChildren(); prev.textContent = 'Pilih panjang kunci dulu.'; return; }
    cols.dataset.n = len;
    cols.replaceChildren(...columns(text, len).map((c, j) => el('div', { class: `sv-kolom ${fin ? 'beres' : ''}`, 'data-j': j },
      el('div', { class: 'sv-kol-atas' }, onTap(el('button', { class: 'jm21-geser', type: 'button', 'aria-label': 'geser kiri' }, '◀'), () => nudge(j, 25)), el('b', null, `Kolom ${j + 1} · kunci ${ABC[shifts[j]]}`), onTap(el('button', { class: 'jm21-geser', type: 'button', 'aria-label': 'geser kanan' }, '▶'), () => nudge(j, 1))),
      bars(c, { s: shifts[j], ref: true, mark: fin ? 0 : null, pick: fin ? null : (i) => { shifts[j] = (shifts[j] + i) % 26; ctx.sound.tap(); draw(); check(); } }))));
    const r = vig(text, key(), -1);
    prev.replaceChildren(el('small', null, `Kunci ${key()}: `), ...[...r.slice(0, 60)].map((c, i) => el('span', { class: `k${i % len}` }, c)), r.length > 60 ? '…' : '');
  };
  const nudge = (j, d) => { if (fin) return; shifts[j] = (shifts[j] + d) % 26; ctx.sound.tap(); draw(); check(); };
  host.append(...[fixed ? null : top_, cols, prev, msg].filter(Boolean));
  draw();
  return { msg };
}

// The trail map: follow the decrypted instructions.
const PETA = [
  { id: 'beringin', ikon: '🌳', nama: 'Pohon Beringin', x: 0, y: 0 },
  { id: 'menara', ikon: '🗼', nama: 'Menara Pandang', x: 1, y: 0 },
  { id: 'sungai', ikon: '🌊', nama: 'Sungai', x: 2, y: 0 },
  { id: 'pos3', ikon: '⛺', nama: 'Pos Tiga', x: 3, y: 0 },
  { id: 'dapur', ikon: '🍳', nama: 'Dapur Umum', x: 0, y: 1 },
  { id: 'aliran', ikon: '🌊', nama: '', x: 2, y: 1, hias: true },
  { id: 'gerbang', ikon: '🚪', nama: 'Gerbang', x: 3, y: 1 },
  { id: 'pos6', ikon: '🚩', nama: 'Pos Enam', x: 0, y: 2 },
  { id: 'batu', ikon: '🪨', nama: 'Batu Bersusun', x: 1, y: 2 },
  { id: 'jembatan', ikon: '🎋', nama: 'Jembatan Bambu', x: 2, y: 2 },
];
const RUTE = ['sungai', 'jembatan', 'kotak', 'pos6'];
function mapRound(host, ctx, { done }) {
  let k = 0;
  const kertas = el('div', { class: 'jm21-kertas' }, ...PLAIN3.split('. ').map((s) => el('span', null, s.replace(/\.$/, '') + '.')));
  const peta = el('div', { class: 'jm21-peta' });
  const tas = el('div', { class: 'jm21-tas' }, '🎒 Tas regu: kosong');
  const msg = el('p', { class: 'reveal info' }, 'Regu berdiri di Pohon Beringin. Ketuk tempat tujuan satu per satu sesuai isi pesan. Utara di atas.');
  const draw = () => peta.replaceChildren(el('div', { class: 'jm21-mata', style: { gridColumn: 4, gridRow: 3 } }, el('b', null, '🧭'), el('small', null, '⬆ Utara')), ...PETA.map((p) => {
    const step = RUTE.indexOf(p.id);
    const kids = [el('b', null, p.ikon), p.nama ? el('small', null, p.nama) : null, step >= 0 && step < k ? el('i', { class: 'jm21-no' }, step + 1) : null].filter(Boolean);
    if (p.id === 'jembatan' && k >= 2) kids.push(onTap(el('button', { class: `jm21-kotak ${k > 2 ? 'buka' : ''}`, type: 'button', 'data-id': 'kotak' }, k > 2 ? '📦 terbuka' : '📦 Kotak Kayu'), (e) => { e.stopPropagation?.(); go('kotak'); }));
    const attrs = { class: `jm21-tempat ${p.id === 'beringin' ? 'mulai' : ''} ${step >= 0 && step < k ? 'jejak' : ''} ${p.hias ? 'hias' : ''}`, style: { gridColumn: p.x + 1, gridRow: p.y + 1 }, 'data-id': p.id };
    return p.hias ? el('div', attrs, ...kids) : onTap(el('div', { ...attrs, role: 'button', tabindex: 0 }, ...kids), () => go(p.id));
  }));
  function go(id) {
    if (k >= RUTE.length) return;
    if (id === 'beringin' || (id === 'kotak' && k > 2)) return;
    if (id !== RUTE[k]) { ctx.mistake(); shake(peta); say(msg, 'bad', k === 0 ? 'Dari pohon beringin, ke arah timur (kanan) sampai ...' : k === 1 ? 'Ikuti sungai ke arah selatan (bawah).' : k === 2 ? 'Apa yang ada di bawah jembatan bambu?' : 'Bendera merah diserahkan kepada penjaga pos berapa?'); return; }
    k++; ctx.sound.tap();
    if (id === 'kotak') tas.textContent = '🎒 Tas regu: 🟥 bendera merah';
    if (id === 'pos6') tas.textContent = '🎒 Bendera merah sudah diserahkan ✓';
    draw();
    say(msg, 'info', ['Sampai di sungai.', 'Sampai di jembatan bambu. Ada sesuatu di bawahnya!', 'Bendera merah diambil dari kotak kayu.', ''][k - 1]);
    if (k === RUTE.length) { say(msg, '', 'Tugas Pos Lima selesai! Pesan sepanjang 191 huruf ini memuat 41 huruf A (21%). Karena A begitu sering, huruf tersering di setiap kolom hampir pasti sandi dari A.'); done(); }
  }
  host.append(el('div', { class: 'jm21-peta-wadah' }, kertas, el('div', { class: 'jm21-peta-kanan' }, peta, tas)), msg);
  draw();
}

// One-time pad: read KQJDF with the pad, then let the eavesdropper try words.
function padRound(host, ctx, { done }) {
  const step1 = el('div', { class: 'jm21-langkah' });
  host.append(el('div', { class: 'jm21-lembar' }, el('b', null, '🔥 Lembar kunci sekali pakai'), el('code', null, 'QXJMF'), el('small', null, 'dibuat dengan dadu, hanya untuk satu pesan')), step1);
  pitaBoard(step1, ctx, { text: 'KQJDF', key: 'QXJMF', dir: -1, done: (out) => {
    const m = step1.querySelector('.reveal');
    say(m, '', `Pesannya ${out}: regu berangkat ke utara.`);
    setTimeout(() => { step1.replaceChildren(); spy(step1); }, 1600);
  } });
  function spy(area) {
    const tried = new Map();
    const words = ctx.rand.shuffle(['BARAT', 'TIMUR', 'PULAU', 'SELAT', 'KABUR']);
    const table = el('div', { class: 'jm21-coba' });
    const msg = el('p', { class: 'reveal info' }, 'Tim Rudi hanya punya sandi KQJDF. Ketuk kata tebakan: layar menunjukkan kunci yang membuat KQJDF terbaca kata itu. Coba BARAT dan TIMUR.');
    const verdict = el('div', { class: 'jm21-putus' });
    const draw = () => table.replaceChildren(el('div', { class: 'jm21-coba-baris kepala' }, el('b', null, 'Tebakan'), el('b', null, 'Kunci yang cocok')),
      el('div', { class: 'jm21-coba-baris asli' }, el('code', null, 'UTARA'), el('code', null, 'QXJMF')),
      ...[...tried].map(([w, k]) => el('div', { class: 'jm21-coba-baris' }, el('code', null, w), el('code', null, k))));
    area.append(el('div', { class: 'jm21-kartu-kata' }, words.map((w) => onTap(el('button', { class: 'jm21-tab-btn', type: 'button', 'data-w': w }, w), (e) => {
      if (tried.has(w)) return;
      tried.set(w, vig('KQJDF', w, -1)); ctx.sound.tap(); e.currentTarget.classList.add('on'); draw();
      if (tried.has('BARAT') && tried.has('TIMUR') && !verdict.childElementCount) ask();
    }))), table, verdict, msg);
    draw();
    function ask() {
      say(msg, 'info', 'Semua kunci itu tampak sama acaknya. Apa kesimpulan Tim Rudi?');
      verdict.replaceChildren(...ctx.rand.shuffle([['Semua arah sama mungkin: tidak bisa ditebak', true], ['Arah yang benar adalah kunci yang paling acak', false]]).map(([l, ok]) => button(l, () => {
        if (!ok) { ctx.mistake(); shake(verdict); say(msg, 'bad', 'Kunci dibuat dengan dadu: QXJMF, JQSDM, dan RIXJO sama mungkinnya.'); return; }
        verdict.replaceChildren(button('🔥 Bakar lembar kunci', () => {
          host.querySelector('.jm21-lembar')?.classList.add('bakar'); verdict.replaceChildren();
          say(msg, '', 'Kunci sekali pakai tidak bisa dipecahkan bila kuncinya benar-benar acak, sepanjang pesan, dan tidak pernah dipakai lagi. Setelah dipakai, lembarnya dibakar.');
          done();
        }, 'primary'));
        ctx.sound.good(); say(msg, 'info', 'Benar. Sekarang musnahkan lembar kuncinya supaya tidak dipakai lagi.');
      }, 'jm21-putus-btn')));
    }
  }
}

// The same pad used twice: one right guess opens the other message.
function reuseRound(host, ctx, { done }) {
  const A = 'KQJDF'; const B = vig('TIMUR', 'QXJMF');
  const words = ctx.rand.shuffle(['BARAT', 'TIMUR', 'UTARA', 'PULAU', 'KABUR', 'SELAT']);
  const rows = el('div', { class: 'jm21-coba' });
  const msg = el('p', { class: 'reveal info' }, `Regu Merpati malas membuat kunci baru: lembar yang sama dipakai untuk pesan Senin ${A} dan pesan Selasa ${B}. Tim Rudi menebak isi pesan Senin. Ketuk tebakan.`);
  let fin = false; const tried = [];
  const draw = () => rows.replaceChildren(el('div', { class: 'jm21-coba-baris tiga kepala' }, el('b', null, `Senin ${A}`), el('b', null, 'Kunci'), el('b', null, `Selasa ${B}`)),
    ...tried.map(([w, k, b]) => el('div', { class: `jm21-coba-baris tiga ${b === 'TIMUR' ? 'asli' : ''}` }, el('code', null, w), el('code', null, k), el('code', null, b))));
  host.append(el('div', { class: 'jm21-kartu-kata' }, words.map((w) => onTap(el('button', { class: 'jm21-tab-btn', type: 'button', 'data-w': w }, w), (e) => {
    if (fin || tried.some((x) => x[0] === w)) return;
    const k = vig(A, w, -1); const b = vig(B, k, -1);
    tried.push([w, k, b]); e.currentTarget.classList.add('on'); ctx.sound.tap(); draw();
    if (b === 'TIMUR') { fin = true; ctx.sound.good(); host.querySelectorAll('.jm21-kartu-kata button').forEach((x) => { x.disabled = true; }); say(msg, '', 'Tebakan UTARA memberi kunci QXJMF, dan kunci itu membuka pesan Selasa: TIMUR. Kunci sekali pakai yang dipakai dua kali bisa dibongkar dengan satu tebakan.'); setTimeout(() => { host.replaceChildren(); matchRound(host, ctx, { done }); }, 3800); }
    else say(msg, 'info', `Dengan tebakan ${w}, pesan Selasa terbaca ${b}. Bukan kata. Coba lagi.`);
  }))), rows, msg);
  draw();
}

const WEAK = [['Kunci yang terlalu pendek, cepat berulang dan mudah dicari', 'Memakai kata sandi yang pendek'], ['Kunci berupa kata yang mudah ditebak, misalnya TUNAS', 'Memakai kata biasa atau nama, misalnya nama hewan peliharaan'], ['Kunci sekali pakai yang dipakai lagi untuk pesan lain', 'Memakai satu kata sandi yang sama untuk banyak akun'], ['Kertas kunci dibiarkan tergeletak di meja pos', 'Menuliskan kata sandi di kertas yang ditempel di layar']];
function matchRound(host, ctx, { done }) {
  const right = ctx.rand.shuffle(WEAK.map((p) => p[1]));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'sv-cocok jm21-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Dari sandi ke kata sandi: ketuk kelemahan sandi, lalu kebiasaan kata sandi yang mirip.');
  const draw = () => box.replaceChildren(el('div', { class: 'sv-kol' }, WEAK.map(([l], i) => onTap(el('button', { class: `sv-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button', 'data-l': i }, `${i + 1}. ${l}`), () => { if (!ok.has(i)) { sel = i; draw(); } }))),
    el('div', { class: 'sv-kol' }, right.map((r) => { const i = WEAK.findIndex((p) => p[1] === r); return onTap(el('button', { class: `sv-item ${ok.has(i) ? 'cocok' : ''}`, type: 'button', 'data-r': i }, r), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', 'Belum mirip. Pikirkan apa yang membuat keduanya lemah.'); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === WEAK.length) { say(msg, '', 'Pendek, mudah ditebak, dipakai ulang, tergeletak: kelemahan sandi kuno sama dengan kelemahan kata sandi zaman sekarang.'); done(); }
    }); })));
  host.append(box, msg);
  draw();
}

// Boss: two keys stacked. Tap where both keys start over together.
function gearRound(host, ctx, { done }) {
  const SLOTS = 24;
  const area = el('div', { class: 'jm21-roda' });
  const msg = el('p', { class: 'reveal info' });
  const verdict = el('div', { class: 'jm21-putus' });
  host.append(area, verdict, msg);
  const stage = (a, b, then) => {
    const L = lcm(a.length, b.length);
    let fin = false;
    const row = (lbl, f, cls = '') => el('div', { class: `jm21-roda-baris ${cls}` }, el('b', null, lbl), ...Array.from({ length: SLOTS }, (_, i) => f(i)));
    const comb = vig(a.repeat(L / a.length), b.repeat(L / b.length));
    const draw = () => fill(area,
      row(a, (i) => el('span', { class: i % a.length === 0 ? 'awal' : '' }, a[i % a.length])),
      row(b, (i) => el('span', { class: i % b.length === 0 ? 'awal' : '' }, b[i % b.length])),
      row('Ketuk', (i) => onTap(el('button', { class: `jm21-slot ${fin && i === L ? 'kena' : ''}`, type: 'button', 'data-i': i }, i + 1), () => tap(i)), 'no'),
      fin ? row('Gabungan', (i) => el('span', { class: `gabung ${i >= L ? 'ulang' : ''}` }, comb[i % L])) : null);
    function tap(i) {
      if (fin) return;
      if (i === 0) { say(msg, 'info', 'Di huruf pertama keduanya baru mulai. Cari kapan keduanya mulai lagi bersamaan.'); return; }
      if (i % a.length || i % b.length) { ctx.mistake(); shake(area); say(msg, 'bad', `Di huruf ke-${i + 1}, ${i % a.length ? `${a} sedang di huruf ${a[i % a.length]}` : `${a} mulai lagi`}, ${i % b.length ? `${b} sedang di huruf ${b[i % b.length]}` : `${b} mulai lagi`}. Belum bersamaan.`); return; }
      fin = true; ctx.sound.good(); draw(); then(L, comb);
    }
    say(msg, 'info', `Sandi disandikan dengan ${a}, lalu sandinya disandikan lagi dengan ${b}. Ketuk nomor huruf tempat kedua kunci mulai dari awal bersamaan.`);
    draw();
  };
  stage('REGU', 'PELUIT', (L, comb) => {
    say(msg, 'info', `Keduanya mulai lagi di huruf ke-${L + 1}: kunci gabungannya ${L} huruf (KPK 4 dan 6), yaitu ${comb}.`);
    setTimeout(() => stage('REGU', 'TUNAS', (L2) => {
      say(msg, 'info', `REGU dan TUNAS: kunci gabungan ${L2} huruf (KPK 4 dan 5). Jadi, apakah sandi dua lapis ini aman?`);
      verdict.replaceChildren(...ctx.rand.shuffle([['Tetap bisa dipecahkan: kuncinya masih berulang, hanya butuh pesan lebih panjang', true], ['Tidak bisa dipecahkan lagi karena dua kunci', false]]).map(([l, ok]) => button(l, () => {
        if (!ok) { ctx.mistake(); shake(verdict); say(msg, 'bad', `Lihat baris Gabungan: setelah ${L2} huruf kuncinya berulang lagi. Penghitung kolom tetap bisa dipakai.`); return; }
        verdict.replaceChildren(); ctx.sound.good();
        say(msg, '', `Dua kunci berulang tetap menjadi satu kunci berulang sepanjang KPK-nya (12 dan 20). Pencari jejak dan penghitung kolom tetap bisa memecahkannya, asal pesannya cukup panjang. Yang benar-benar aman hanya kunci acak yang tidak berulang.`);
        done();
      }, 'jm21-putus-btn')));
    }), 4200);
  });
}

// Short trap messages: too few letters per column for "tallest bar = A".
export const PENDEK = [
  'SIMPAN SENTER DI BAWAH BATU BESAR DEKAT SUMUR',
  'TEMUI KAKAK PEMBINA DI DEPAN TENDA KESEHATAN',
  'BESOK PAGI KITA BERANGKAT LEWAT JEMBATAN TUA',
  'JANGAN BUKA KOTAK SEBELUM SEMUA REGU TIBA',
  'SEMUA PESERTA BERKUMPUL DI DEPAN DAPUR UMUM',
];
const randKey = (ctx, len) => Array.from({ length: len }, () => ABC[ctx.rand.int(1, 25)]).join('');
// Repeated three-letter runs in a ciphertext, as hints for the key length.
function repeats(text) {
  const seen = {}; const out = [];
  for (let i = 0; i + 3 <= text.length; i++) { const s = text.slice(i, i + 3); if (s in seen && !out.some((o) => o.s === s)) out.push({ s, a: seen[s] + 1, b: i + 1 }); else if (!(s in seen)) seen[s] = i; }
  return out;
}
const uniqTop = (c) => c.filter((v) => v === Math.max(...c)).length === 1;

const HEAD21 = {
  tabel: ['Tabel dan Pita Geser', 'Geser pita ke huruf kunci, lalu sandikan pesan untuk Pos 1.'],
  baca: ['Petunjuk Kak Laras', 'Baca sandi dengan pita geser, mundur dari huruf kunci.'],
  jejak: ['Pencari Jejak', 'Temukan deret yang berulang, lalu tebak panjang kuncinya.'],
  kolom: ['Penghitung Kolom', 'Geser diagram setiap kolom sampai pesannya terbaca.'],
  peta: ['Ikuti Petunjuk Pos Lima', 'Jalankan isi pesan di peta perkemahan.'],
  sekali: ['Kunci Sekali Pakai', 'Baca sandi KQJDF, lalu lihat penyadap mencoba.'],
  ulang: ['Kunci Dipakai Lagi', 'Satu lembar kunci untuk dua pesan: apa akibatnya?'],
  regu: ['Duel Pemecah Sandi', 'Pesan sadapan dari regu lain. Panjang kunci pun belum tahu.'],
  jebakan: ['Pesan Pendek', 'Huruf tersering belum tentu A. Tetap pecahkan!'],
  boss: ['Sandi Dua Lapis', 'REGU lalu PELUIT: seberapa panjang kunci gabungannya?'],
};

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
    const wrap = el('div', { class: 'act sandi-berkunci jm21-main' });
    root.append(wrap);
    // The duel message and the short trap message are fixed per pane.
    const duel = (() => {
      for (let t = 0; t < 80; t++) {
        const orig = ctx.rand.pick(MESSAGES); const plain = only(orig); const L = ctx.rand.int(2, 4); const key = randKey(ctx, L); const text = vig(plain, key);
        if (columns(text, L).every((c, j) => uniqTop(c) && top(c) === n(key[j]))) return { orig, plain, text, key };
      }
      const orig = MESSAGES[2]; const plain = only(orig); return { orig, plain, text: vig(plain, 'KR'), key: 'KR' };
    })();
    const trap = (() => { const plain = only(ctx.rand.pick(PENDEK)); const key = randKey(ctx, 3); return { plain, text: vig(plain, key), key }; })();
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD21[k], '🗝️'));
      const area = el('div', { class: 'jm21-area' });
      const go = (k, no) => { head(k, no); wrap.append(area); };
      if (r === 0) {
        go('tabel', 1);
        const t = 'KUMPULDILAPANGAN';
        const b = pitaBoard(area, ctx, { text: t, key: 'TUNAS', dir: 1, given: 5, need: 8, done: (out) => sameStep(area, ctx, b, t, out, () => next(6500)) });
      } else if (r === 1) {
        go('baca', 1);
        const b = pitaBoard(area, ctx, { text: 'TJVUFZAHNVBHLADTENNBTGQEDTJNN', key: 'TUNAS', dir: -1, need: 10, done: () => {
          area.insertBefore(el('div', { class: 'jm21-api' }, el('b', null, '🔥'), el('span', null, 'API UNGGUN DINYALAKAN JAM DELAPAN')), b.grid);
          say(b.msg, '', 'Membaca berarti menggeser mundur sebanyak huruf kunci. Sandi yang sama dengan kunci yang sama selalu kembali ke pesan aslinya.'); next(5600);
        } });
      } else if (r === 2) { go('jejak', 2); traceRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 3) {
        go('kolom', 3);
        const g = crackGame(area, ctx, { text: CIPHER3, plain: only(PLAIN3), len: 4, hint: 'Panjang kunci 4, jadi huruf sandi dibagi ke empat kolom. Ketuk batang tertinggi di setiap kolom untuk menggesernya ke bawah A, lalu lihat pesannya.', done: () => {
          say(g.msg, '', 'Huruf tersering kolom 1–4: R (10), E (11), G (11), U (9). Karena A digeser menjadi huruf kunci itu sendiri, kata kuncinya REGU.'); next(6000);
        } });
      } else if (r === 4) { go('peta', 3); mapRound(area, ctx, { done: () => next(6500) }); }
      else if (r === 5) { go('sekali', 4); padRound(area, ctx, { done: () => next(7000) }); }
      else if (r === 6) { go('ulang', 5); reuseRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 7) {
        go('regu', 6);
        const L = duel.key.length;
        const rep = repeats(duel.text).filter((o) => (o.b - o.a) % L === 0).slice(0, 2);
        const hint = rep.length ? `Jejak dari Misi 2: ${rep.map((o) => `${o.s} di huruf ${o.a} dan ${o.b} (jarak ${o.b - o.a})`).join('; ')}. Pilih panjang kunci, lalu ketuk batang tertinggi tiap kolom.` : 'Kuncinya 2 sampai 4 huruf. Pilih panjang kunci, lalu ketuk batang tertinggi tiap kolom.';
        const g = crackGame(area, ctx, { text: duel.text, plain: duel.plain, lens: [2, 3, 4, 5], hint, done: (k) => { say(g.msg, '', `Kunci ${k}: ${duel.orig.split('. ')[0]}.`); next(6000); } });
      } else if (r === 8) {
        go('jebakan', 6);
        const g = crackGame(area, ctx, { text: trap.text, plain: trap.plain, len: 3, hint: `Pesan pendek ${trap.plain.length} huruf, kunci 3 huruf. Ketuk batang tertinggi, lalu baca hasilnya: bila setiap huruf ketiga masih kacau, kolom itu salah. Geser dengan ◀ ▶.`, done: () => {
          const a = [...trap.plain].filter((c) => c === 'A').length;
          say(g.msg, '', `Terbaca: ${trap.plain}. Hanya ${a} huruf A dari ${trap.plain.length}, jadi di kolom pendek huruf tersering belum tentu A. Penghitung kolom butuh pesan yang panjang.`); next(7000);
        } });
      } else { go('boss', 'Bos'); gearRound(area, ctx, { done: () => next(7500) }); }
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
