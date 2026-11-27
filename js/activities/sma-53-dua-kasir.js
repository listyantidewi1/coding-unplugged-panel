// Dua Kasir, Satu Stok — SMA/SMK (16–18 tahun), coding. Two cashier programs
// that run one line at a time in whatever order the scheduler picks: shared
// stock versus each cashier's own copy s, race conditions and lost updates,
// a lock that makes lines 1–4 a critical section, Dodi's lock that is never
// released, and deadlock from two locks taken in a different order. One step
// is one line; waiting for a lock is not a step, so version 1 has 64 orders
// (4 correct), the lock version 2, the bundle with different lock order 6
// (2 deadlocked) and with the same order 2. Every count comes from the
// enumerator below, not from a table.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode } from './smp-kit.js';
import { dnd } from '../core/kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';

// ---- programs as shown on the worksheet ----
export const KODE = {
  v1: ['if stok >= 1:        # periksa stok', '    s = stok         # baca stok untuk dikurangi', '    stok = s - 1     # tulis stok baru', '    kirim(pembeli)   # catat pengiriman'],
  v2: ['ambil(kunci)         # tunggu bila kunci sedang dipegang kasir lain', 'if stok >= 1:', '    s = stok', '    stok = s - 1', '    kirim(pembeli)', 'lepas(kunci)         # dijalankan juga bila pesanan ditolak'],
  dodi: ['ambil(kunci)', 'if stok >= 1:', '    s = stok', '    stok = s - 1', '    kirim(pembeli)', '    lepas(kunci)     # Dodi: tidak dijalankan bila ditolak'],
  paketA: ['ambil(kunci_kain)', 'ambil(kunci_tas)', 'bila kain dan tas masih ada: kurangi keduanya, kirim paket', 'lepas(kunci_tas)', 'lepas(kunci_kain)'],
  paketB: ['ambil(kunci_tas)', 'ambil(kunci_kain)', 'bila kain dan tas masih ada: kurangi keduanya, kirim paket', 'lepas(kunci_kain)', 'lepas(kunci_tas)'],
};
export const VERSI = {
  v1: { nama: 'Versi 1, tanpa kunci', kasir: ['A', 'B'], mulai: 1 },
  v2: { nama: 'Versi 2, satu kunci', kasir: ['A', 'B'], mulai: 0 },
  dodi: { nama: 'Versi Dodi, tiga kasir', kasir: ['A', 'B', 'C'], mulai: 0 },
  beda: { nama: 'Paket, urutan kunci berbeda', kasir: ['A', 'B'], mulai: 1 },
  sama: { nama: 'Paket, urutan kunci sama', kasir: ['A', 'B'], mulai: 1 },
};
const paket = (v) => v === 'beda' || v === 'sama';
const kunciOf = (v) => (paket(v) ? ['kain', 'tas'] : v === 'v1' ? [] : ['stok']);
export const kodeOf = (v, k) => (paket(v) ? (v === 'beda' && k === 'B' ? KODE.paketB : KODE.paketA) : KODE[v]);
const labelOf = (v) => kodeOf(v, 'A').map((_, i) => String(i + VERSI[v].mulai));
const urutKunci = (v, k) => (v === 'beda' && k === 'B' ? ['tas', 'kain'] : ['kain', 'tas']);
const NAMA_KUNCI = { stok: 'kunci', kain: 'kunci_kain', tas: 'kunci_tas' };

// ---- the machine: one call of langkah runs one line ----
export function awal(v) {
  const K = VERSI[v].kasir;
  return { v, stok: 1, tas: 1, pc: Object.fromEntries(K.map((k) => [k, VERSI[v].mulai])), s: Object.fromEntries(K.map((k) => [k, null])), selesai: {}, pegang: {}, dikirim: [], ditolak: [], jejak: [] };
}
const salin = (S) => ({ ...S, pc: { ...S.pc }, s: { ...S.s }, selesai: { ...S.selesai }, pegang: { ...S.pegang }, dikirim: [...S.dikirim], ditolak: [...S.ditolak], jejak: [...S.jejak] });
export function butuh(S, k) {
  const pc = S.pc[k];
  if (S.v === 'v2' || S.v === 'dodi') return pc === 0 ? 'stok' : null;
  if (paket(S.v)) return pc === 1 || pc === 2 ? urutKunci(S.v, k)[pc - 1] : null;
  return null;
}
export const menunggu = (S, k) => { const L = butuh(S, k); return !S.selesai[k] && L != null && S.pegang[L] != null && S.pegang[L] !== k; };
export const bisa = (S, k) => !S.selesai[k] && !menunggu(S, k);
export const kasirOf = (S) => VERSI[S.v].kasir;
export const beres = (S) => kasirOf(S).every((k) => S.selesai[k]);
export const buntu = (S) => !beres(S) && kasirOf(S).every((k) => !bisa(S, k));
export function langkah(S0, k) {
  const S = salin(S0); const pc = S.pc[k]; const v = S.v;
  S.jejak.push(`${k}${pc}`);
  const tutup = () => { S.selesai[k] = true; };
  if (v === 'v1') {
    if (pc === 1) { if (S.stok >= 1) S.pc[k] = 2; else { S.ditolak.push(k); tutup(); } }
    else if (pc === 2) { S.s[k] = S.stok; S.pc[k] = 3; }
    else if (pc === 3) { S.stok = S.s[k] - 1; S.pc[k] = 4; }
    else { S.dikirim.push(k); tutup(); }
  } else if (v === 'v2' || v === 'dodi') {
    if (pc === 0) { S.pegang.stok = k; S.pc[k] = 1; }
    else if (pc === 1) { if (S.stok >= 1) S.pc[k] = 2; else { S.ditolak.push(k); if (v === 'dodi') tutup(); else S.pc[k] = 5; } }
    else if (pc === 2) { S.s[k] = S.stok; S.pc[k] = 3; }
    else if (pc === 3) { S.stok = S.s[k] - 1; S.pc[k] = 4; }
    else if (pc === 4) { S.dikirim.push(k); S.pc[k] = 5; }
    else { delete S.pegang.stok; tutup(); }
  } else {
    const u = urutKunci(v, k);
    if (pc === 1 || pc === 2) { S.pegang[u[pc - 1]] = k; S.pc[k] = pc + 1; }
    else if (pc === 3) { if (S.stok >= 1 && S.tas >= 1) { S.stok -= 1; S.tas -= 1; S.dikirim.push(k); } else S.ditolak.push(k); S.pc[k] = 4; }
    else if (pc === 4) { delete S.pegang[u[1]]; S.pc[k] = 5; }
    else { delete S.pegang[u[0]]; tutup(); }
  }
  return S;
}
// benar · minus (stok -1, two sold) · hilang (lost update: stok 0, two sold) · buntu · tertahan (Dodi: a cashier waits forever)
export function hasil(S) {
  if (buntu(S)) return S.v === 'dodi' ? 'tertahan' : 'buntu';
  if (!beres(S)) return null;
  if (S.dikirim.length > 1) return S.stok < 0 ? 'minus' : 'hilang';
  return 'benar';
}
export function semua(v, S0 = awal(v)) {
  const out = [];
  const go = (S) => { const h = hasil(S); if (h) { out.push({ urutan: S.jejak, hasil: h, S }); return; } for (const k of kasirOf(S)) if (bisa(S, k)) go(langkah(S, k)); };
  go(S0);
  return out;
}
export const jalankan = (v, urutan) => urutan.reduce((S, k) => langkah(S, k[0]), awal(v));
// The scheduler names A, B, A, B, …; a cashier that waits stays on its line and the wait is written down but not run.
export function bergantian(v) {
  let S = awal(v); const log = []; let t = 0; const K = kasirOf(S);
  while (!hasil(S) && t < 200) {
    const k = K[t % K.length]; t++;
    if (S.selesai[k]) continue;
    if (menunggu(S, k)) { log.push(`${k}${S.pc[k]} (menunggu)`); continue; }
    log.push(`${k}${S.pc[k]}`); S = langkah(S, k);
  }
  return { S, log };
}
// Random scheduler: a fair coin among the cashiers that can move.
export function acak(v, rand) {
  let S = awal(v);
  while (!hasil(S)) { const K = kasirOf(S).filter((k) => bisa(S, k)); S = langkah(S, K[Math.floor(rand.next() * K.length)]); }
  return S;
}
export const hitung = (v) => semua(v).reduce((c, r) => ({ ...c, [r.hasil]: (c[r.hasil] || 0) + 1 }), {});

export const HASIL = {
  benar: { t: 'Benar', w: 'satu barang terkirim, kasir lain ditolak' },
  minus: { t: 'Stok -1', w: 'barang terjual dua kali, stok menjadi -1' },
  hilang: { t: 'Pembaruan hilang', w: 'stok tampak 0, padahal dua barang terjual' },
  buntu: { t: 'Kebuntuan', w: 'kedua kasir saling menunggu kunci selamanya' },
  tertahan: { t: 'Kunci tidak dilepas', w: 'seorang kasir menunggu kunci selamanya' },
};
const URUT_X = ['A1', 'B1', 'A2', 'A3', 'B2', 'B3', 'A4', 'B4'];
const URUT_Y = ['A1', 'B1', 'A2', 'B2', 'A3', 'B3', 'A4', 'B4'];
// Threading output from the worksheet (Python 3 run on a real machine, so it is data here).
const TANTANGAN = { tanpa: "0 ['A', 'B']", dengan: "0 ['A']" };

const uniq = (xs) => [...new Set(xs)];
const nilai = (x) => (x == null ? '-' : String(x));
const kirimTeks = (S) => (S.dikirim.length === 0 ? 'tidak ada yang dikirimi' : S.dikirim.length === 1 ? `dikirim ke ${S.dikirim[0]} saja` : `dikirim ke ${S.dikirim.join(' dan ')}`);
const akhirTeks = (S) => `stok ${S.stok}, ${kirimTeks(S)}`;
const kunciTeks = (S) => kunciOf(S.v).map((L) => `${NAMA_KUNCI[L]}: ${S.pegang[L] ? `dipegang ${S.pegang[L]}` : 'bebas'}`).join(' · ');

// ---- Permainan: Promo Tengah Malam ----
// The team runs the shop server of Usaha Tenun Ikat Wanasari at midnight: two
// cashiers run one line each time the scheduler points at them, the lock card
// is dragged from cashier to cashier, and Si Penjadwal Jahil hunts for the
// worst order. Every state comes from langkah(), the same machine as the
// extra modes.
const HEAD53 = {
  pertama: ['Pesanan Pertama', 'Jalankan Kasir A sampai selesai, lalu Kasir B.', 'Satu pesanan? Membosankan.'],
  x: ['Urutan X', 'Tekan A dan B sesuai urutan penjadwal.', 'Sela di tengah, hehe!'],
  y: ['Urutan Y', 'Tekan A dan B sesuai urutan penjadwal.', 'Kali ini kesalahanku tak terlihat.'],
  buru: ['Berburu Urutan Celaka', 'Jadilah penjadwal: temukan urutan benar, stok −1, dan pembaruan hilang.', 'Ada 64 urutan, pilih yang terburuk!'],
  kunci: ['Kartu KUNCI STOK', 'Seret kartu kunci ke kasir yang menjalankan ambil(kunci).', 'Kunci? Aku tetap menunjuk B!'],
  dodi: ['Dodi Lupa Melepas', 'Jalankan A, lalu B, lalu C pada versi Dodi.', 'Kuncinya hilang di saku B!'],
  buntu: ['Paket dan Si Buntu', 'Jadilah penjadwal jahil: buat kedua kasir saling menunggu.', 'Kain dan tas, saling kunci!'],
  sama: ['Urutan Kunci yang Sama', 'Samakan urutan kunci, lalu coba buat buntu lagi.', 'Pasti masih bisa buntu…'],
  adu: ['Kasir lawan Penjadwal Jahil', 'Ramalkan hasil urutan pilihan penjadwal, lalu jalankan.', 'Urutan rahasiaku!'],
  bos: ['Balapan di Komputer Sungguhan', 'Susun program threading yang memakai kunci.', 'Di komputer, aku secepat kilat!'],
};
const msg53 = (t) => el('p', { class: 'reveal info' }, t);
const dua53 = (...k) => el('div', { class: 'pm53-dua' }, ...k);
const kol53 = (...k) => el('div', { class: 'pm53-kolom' }, ...k);
const kode53 = (v, k) => kodeOf(v, k).map((x) => x.replace(/\s+#.*$/, '').replace(/^ {4}/, '  ').replace('bila kain dan tas masih ada: kurangi keduanya, kirim paket', 'bila ada: kurangi, kirim paket'));
const KUNCI53 = { stok: '🔑 kunci', kain: '🧶 kunci_kain', tas: '👜 kunci_tas' };

// The stage: board, cashiers with their own s, programs and run buttons. strip = scheduler's order.
function jadwal53(ctx, { oops, msg, v, strip = null, seret = false, onStep = null, onEnd }) {
  let S = awal(v); let k = 0; const api = { jeda: false };
  const host = el('div', { class: 'pm53-panggung' });
  const tokenKasir = (t) => t[0]; const tunggu = (t) => t.includes('menunggu');
  const draw = () => {
    const nextT = strip && k < strip.length ? strip[k] : null; const K = nextT ? tokenKasir(nextT) : null;
    const pakaiSeret = nextT && seret && !tunggu(nextT) && butuh(S, K) && !S.pegang[butuh(S, K)];
    const bebasKunci = kunciOf(v).filter((L) => !S.pegang[L]);
    fill(host,
      el('div', { class: 'pm53-papan' }, el('div', { class: `pm53-stok ${S.stok < 0 ? 'minus' : ''}` }, el('small', null, paket(v) ? 'kain' : 'stok'), el('b', null, String(S.stok))),
        paket(v) ? el('div', { class: 'pm53-stok' }, el('small', null, 'tas'), el('b', null, String(S.tas))) : null,
        seret ? bebasKunci.map((L) => el('div', { class: 'pm53-kunci-kartu', 'data-drag': L }, KUNCI53[L])) : kunciOf(v).map((L) => el('span', { class: `pm53-kunci ${S.pegang[L] ? 'dipegang' : ''}` }, `${KUNCI53[L]} ${S.pegang[L] ? `→ ${S.pegang[L]}` : 'bebas'}`)),
        el('div', { class: 'pm53-kirim' }, el('small', null, 'dikirim'), el('b', null, S.dikirim.length ? S.dikirim.map((x) => `📦${x}`).join(' ') : '–'))),
      strip ? el('div', { class: 'pm53-strip', 'data-next': K || '', 'data-seret': pakaiSeret ? butuh(S, K) : '' }, strip.map((t, i) => el('code', { class: i === k ? 'aktif' : i < k ? 'beres' : '' }, t.replace(' (menunggu)', '⏸')))) : null,
      el('div', { class: 'pm53-kasir-kasir', 'data-jejak': S.jejak.join(',') }, kasirOf(S).map((c) => {
        const beku = menunggu(S, c); const idx = S.selesai[c] ? -1 : S.pc[c] - VERSI[v].mulai; const L = butuh(S, c);
        return el('div', { class: `pm53-kasir ${beku ? 'beku' : ''} ${S.selesai[c] ? 'beres' : ''}`, 'data-drop': c },
          el('div', { class: 'pm53-kepala' }, el('b', null, `${beku ? '🥶' : '🧑‍💼'} Kasir ${c}`), paket(v) ? null : el('span', { class: 'pm53-s' }, `s = ${nilai(S.s[c])}`),
            Object.keys(S.pegang).filter((x) => S.pegang[x] === c).map((x) => el('span', { class: 'pm53-pegang' }, KUNCI53[x].split(' ')[0]))),
          codeView(kode53(v, c), { labels: labelOf(v), hl: idx >= 0 ? [idx] : [] }),
          el('small', { class: 'pm53-status' }, statusKasir(S, c)),
          S.selesai[c] ? null : Object.assign(button(seret && L && !S.pegang[L] ? `seret ${KUNCI53[L].split(' ')[0]} ke ${c}` : `▶ ${c}${S.pc[c]}`, () => pilih(c), `pm53-jalan ${beku ? 'redup' : ''}`), { title: `Kasir ${c}` }));
      })),
      hasil(S) ? banner(S) : null);
    host.querySelectorAll('.pm53-kasir').forEach((x) => x.querySelector('.pm53-jalan')?.setAttribute('data-k', x.dataset.drop));
  };
  function pilih(c, dariSeret = false) {
    if (hasil(S)) return; if (api.jeda) { say(msg, 'info', 'Jawab dulu pertanyaannya.'); return; }
    if (strip) {
      const t = strip[k]; if (!t) return;
      if (tokenKasir(t) !== c) { say(msg, 'info', `Penjadwal menunjuk ${t.replace(' (menunggu)', '')}.`); return; }
      if (tunggu(t)) { k++; ctx.sound.tap(); draw(); say(msg, 'info', `${c} membeku: ${KUNCI53[butuh(S, c)]} dipegang ${S.pegang[butuh(S, c)]}. Langkah menunggu tidak dihitung.`); return; }
    } else if (menunggu(S, c)) { say(msg, 'info', `${c} membeku: ${KUNCI53[butuh(S, c)]} dipegang ${S.pegang[butuh(S, c)]}.`); return; }
    const L = butuh(S, c);
    if (seret && L && !S.pegang[L] && !dariSeret) { say(msg, 'info', `Baris ini ambil(kunci): seret kartu ${KUNCI53[L]} ke Kasir ${c}.`); return; }
    S = langkah(S, c); k++; ctx.sound.tap(); draw(); onStep?.(S);
    if (hasil(S)) onEnd(S);
  }
  dnd(host, (card, target) => {
    const c = target.closest('.pm53-kasir')?.dataset.drop; if (!c || hasil(S)) return; const L = card.dataset.drag;
    if (butuh(S, c) !== L) { oops(); shake(card); say(msg, 'bad', S.selesai[c] ? `Kasir ${c} sudah selesai.` : `Kasir ${c} belum sampai baris ambil(kunci).`); return; }
    pilih(c, true);
  });
  api.node = host; api.reset = () => { S = awal(v); k = 0; draw(); }; api.S = () => S; api.draw = draw;
  draw();
  return api;
}

// Misi 1: one order, then B.
function pertamaRound(area, ctx, { oops, done }) {
  const msg = msg53('Mula-mula stok = 1. Tekan A empat kali.'); const kanan = kol53();
  const J = jadwal53(ctx, { oops, msg, v: 'v1', strip: ['A1', 'A2', 'A3', 'A4', 'B1'],
    onStep: (S) => { if (S.jejak.length !== 4) return; J.jeda = true; say(msg, 'info', 'A selesai. Sebelum B jalan, ramalkan.');
      fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['stok = ', '_'], ['bila B jalan: ', '_']]), chips: ['0', '1', '-1', 'ditolak di baris 1', 'dikirimi barang'], want: [String(S.stok), 'ditolak di baris 1'],
        hints: ['A sudah mengurangi stok dari 1.', 'stok >= 1 bernilai False.'], done: () => { J.jeda = false; fill(kanan); say(msg, 'info', 'Tekan B.'); } })); },
    onEnd: (S) => { say(msg, '', `${akhirTeks(S)}. Tanpa sela, program ini benar.`); done(); } });
  area.append(dua53(J.node, kanan), msg);
}

// Misi 2: orders X and Y.
function urutRound(area, ctx, { oops, done }, U, nama) {
  const msg = msg53(`Penjadwal memilih urutan ${nama}. Tekan tombol sesuai urutan.`); const kanan = kol53();
  const J = jadwal53(ctx, { oops, msg, v: 'v1', strip: U, onEnd: (S) => {
    say(msg, 'info', 'Urutan selesai. Isi catatan akhirnya.');
    const board = nama === 'X' ? fillBoard(ctx, { oops, msg, view: rowsView([['stok = ', '_'], ['s milik A = ', '_'], ['s milik B = ', '_']]), chips: ['-1', '0', '1', '-'], want: [String(S.stok), nilai(S.s.A), nilai(S.s.B)],
      hints: ['B menulis paling akhir: s milik B dikurangi 1.', 'A membaca stok sebelum siapa pun menulis.', 'B membaca stok setelah A menulis.'], done: () => { say(msg, '', 'Stok −1: barang terjual dua kali, dan kesalahannya terlihat.'); done(); } })
      : fillBoard(ctx, { oops, msg, view: rowsView([['stok = ', '_'], ['barang terkirim = ', '_'], ['lebih sulit ketahuan: urutan ', '_']]), chips: ['0', '-1', '2', '1', 'X', 'Y'], want: [String(S.stok), String(S.dikirim.length), 'Y'],
        hints: ['Kedua kasir membaca stok 1, lalu sama-sama menulis 0.', 'Hitung kardus di papan.', 'Stok 0 tampak wajar, padahal dua terjual.'], done: () => { say(msg, '', 'Pembaruan yang hilang: tulisan A ditimpa B yang memakai salinan lamanya.'); done(); } });
    fill(kanan, board); } });
  area.append(dua53(J.node, kanan), msg);
}

// Misi 3: hunt for one order of each kind.
const CARI53 = { benar: '✅ benar (selain Misi 1)', minus: '❌ stok −1', hilang: '👻 pembaruan hilang' };
function buruRound(area, ctx, { oops, done }) {
  const msg = msg53('Jadilah penjadwal. Tekan A dan B bebas untuk menemukan ketiga hasil.'); const got = new Set(); const kanan = kol53();
  const H = hitung('v1'); const n = semua('v1').length;
  const daftar = () => el('div', { class: 'pm53-cari', 'data-cari': Object.keys(CARI53).filter((x) => !got.has(x)).join(',') }, Object.entries(CARI53).map(([x, t]) => el('span', { class: got.has(x) ? 'dapat' : '' }, t)));
  const J = jadwal53(ctx, { oops, msg, v: 'v1', onEnd: (S) => {
    const h = hasil(S); const serial = S.jejak.join(',') === 'A1,A2,A3,A4,B1' || S.jejak.join(',') === 'B1,B2,B3,B4,A1';
    if (h === 'benar' && serial) say(msg, 'info', 'Itu tanpa sela, seperti Misi 1. Cari urutan benar yang menyela.');
    else if (got.has(h)) say(msg, 'info', `${HASIL[h].t} sudah ketemu. Cari yang lain.`);
    else { got.add(h); ctx.sound.good?.(); say(msg, 'info', `Ketemu: ${HASIL[h].t} (${S.jejak.join(', ')}).`); }
    fill(kanan, daftar());
    if (got.size < 3) { setTimeout(() => J.reset(), 1400); return; }
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['urutan benar: ', '_', ` dari ${n}`], ['stok −1: ', '_', ', pembaruan hilang: ', '_']]), chips: uniq([String(H.benar), String(H.minus), String(H.hilang), '8', '30']), want: [String(H.benar), String(H.minus), String(H.hilang)],
      hints: ['Benar hanya bila satu kasir sudah menulis (baris 3) sebelum yang lain memeriksa (baris 1).', 'Stok −1 terjadi bila kasir kedua membaca stok setelah kasir pertama menulis.', 'Sisanya: keduanya membaca stok 1 sebelum ada yang menulis.'], done: () => { say(msg, '', `Hanya ${H.benar} dari ${n} urutan yang benar. Uji Rudi lolos karena ia memesan satu per satu.`); done(); } })); } });
  fill(kanan, daftar());
  area.append(dua53(J.node, kanan), msg);
}

// Misi 4: the lock card, scheduler alternating.
function kunciRound(area, ctx, { oops, done }) {
  const msg = msg53('Penjadwal menunjuk bergantian. Baris ambil(kunci): seret kartu kunci ke kasir.'); const kanan = kol53(); const G = bergantian('v2');
  const J = jadwal53(ctx, { oops, msg, v: 'v2', strip: G.log, seret: true, onEnd: (S) => {
    say(msg, 'info', 'Selesai. Isi catatannya.');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['stok akhir = ', '_'], ['dikirim ke ', '_'], ['banyak urutan dengan kunci: ', '_']]), chips: ['0', '-1', 'A saja', 'A dan B', String(semua('v2').length), '64'], want: [String(S.stok), 'A saja', String(semua('v2').length)],
      hints: ['B baru memeriksa stok setelah A selesai.', 'B ditolak di baris 1.', 'Siapa pun yang lebih dulu memegang kunci menjalankan baris 1–4 tanpa disela.'], done: () => { say(msg, '', 'Baris 1–4 menjadi bagian kritis: hanya pemegang kunci yang boleh menjalankannya.'); done(); } })); } });
  area.append(dua53(J.node, kanan), msg);
}

// Misi 4b: Dodi forgets to release when the order is rejected.
function dodiRound(area, ctx, { oops, done }) {
  const msg = msg53('Versi Dodi, tiga kasir, stok 1. Jalankan A sampai selesai, lalu B.'); const kanan = kol53();
  let S = awal('dodi'); const strip = []; for (const c of ['A', 'B']) while (!S.selesai[c]) { strip.push(`${c}${S.pc[c]}`); S = langkah(S, c); }
  const J = jadwal53(ctx, { oops, msg, v: 'dodi', strip, seret: true, onEnd: () => {
    say(msg, 'info', 'B ditolak dan pergi sambil membawa kunci. C membeku di baris 0.');
    J.node.classList.add('pm53-ringkas');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['C menunggu kunci ', '_'], ['di Python, kunci selalu dilepas dengan ', '_'], ['kemas barang (lama) diletakkan ', '_']]), chips: ['selamanya', 'sampai B selesai', 'with kunci:', 'if kunci:', 'sesudah lepas(kunci)', 'sebelum lepas(kunci)'], want: ['selamanya', 'with kunci:', 'sesudah lepas(kunci)'],
      hints: ['B sudah selesai, tetapi tidak pernah menjalankan lepas.', 'Blok with melepas kunci saat blok selesai, bagaimanapun caranya.', 'Pengemasan tidak mengubah stok: bagian kritis sependek mungkin.'], done: () => { say(msg, '', 'Kunci harus dilepas di setiap jalan keluar, termasuk saat pesanan ditolak.'); done(); } })); } });
  area.append(dua53(J.node, kanan), msg);
}

// Misi 5: create the deadlock with two locks taken in different orders.
function buntuRound(area, ctx, { oops, done }) {
  const msg = msg53('A mengambil kunci_kain dulu, B mengambil kunci_tas dulu. Buat keduanya saling menunggu!'); const kanan = kol53(); const H = hitung('beda');
  const awalBuntu = semua('beda').filter((x) => x.hasil === 'buntu').map((x) => x.urutan.join(', ')).join(' atau ');
  const J = jadwal53(ctx, { oops, msg, v: 'beda', onEnd: (S) => {
    if (hasil(S) !== 'buntu') { say(msg, 'info', 'Paket terkirim dengan benar. Coba lagi: biarkan setiap kasir memegang satu kunci.'); setTimeout(() => J.reset(), 1500); return; }
    say(msg, 'info', '🥶🥶 Si Buntu muncul! Tidak ada yang bisa bergerak.');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([[`dari ${semua('beda').length} urutan, buntu: `, '_'], ['urutan buntu dimulai ', '_']]), chips: uniq([String(H.buntu), '0', '1', '4', awalBuntu, 'A1, A2', 'B1, B2']), want: [String(H.buntu), awalBuntu],
      hints: ['Buntu bila masing-masing sempat memegang satu kunci.', 'Kedua kasir mengambil kunci pertamanya sebelum yang lain mengambil kunci kedua.'], done: () => { say(msg, '', 'Kebuntuan: dua kasir saling menunggu kunci yang dipegang lawannya.'); done(); } })); } });
  area.append(dua53(J.node, kanan), msg);
}

// Misi 5b: same lock order, then try again.
function samaRound(area, ctx, { oops, done }) {
  const msg = msg53('Ubah urutan ambil Kasir B supaya sama dengan A.'); const box = kol53(); const n = semua('sama').length; const H = hitung('sama');
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill([['ambil(', '_', ')'], ['ambil(', '_', ')'], 'bila ada: kurangi, kirim paket', '…']), chips: ['kunci_kain', 'kunci_tas'], want: ['kunci_kain', 'kunci_tas'], hints: ['A mengambil kunci_kain dulu.', 'Lalu kunci_tas.'],
    done: () => { say(msg, 'info', 'Sekarang coba buat buntu: tekan A1, lalu B1.'); const kanan = kol53();
      const J = jadwal53(ctx, { oops, msg, v: 'sama', onEnd: () => { say(msg, 'info', 'Tidak bisa buntu! Siapa yang lebih dulu memegang kunci_kain menyelesaikan paketnya.');
        fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['banyak urutan sekarang: ', '_'], ['yang buntu: ', '_']]), chips: uniq([String(n), String(H.buntu || 0), '6', '2', '4']), want: [String(n), String(H.buntu || 0)],
          hints: ['Kasir kedua membeku di baris 1 sampai kasir pertama selesai.', 'Tidak ada yang bisa memegang kunci_tas tanpa kunci_kain.'], done: () => { say(msg, '', 'Semua kasir mengambil kunci dengan urutan yang sama: kebuntuan mustahil.'); done(); } })); } });
      fill(box, dua53(J.node, kanan)); } }));
  area.append(box, msg);
}

// Misi 6: predict the scheduler's secret order, then run it.
function aduRound(area, ctx, { oops, done }) {
  const S0 = acak('v1', ctx.rand); const h = hasil(S0); const msg = msg53('Penjadwal Jahil memilih urutan ini. Ramalkan hasilnya sebelum menjalankan.'); const kanan = kol53();
  const J = jadwal53(ctx, { oops, msg, v: 'v1', strip: S0.jejak, onEnd: (S) => { say(msg, '', `${HASIL[hasil(S)].t}: ${akhirTeks(S)}. Ramalanmu tepat!`); done(); } });
  J.jeda = true;
  const PIL = [['benar', '✅ benar'], ['minus', '❌ stok −1'], ['hilang', '👻 pembaruan hilang']];
  fill(kanan, el('div', { class: 'pm53-ramal', 'data-want': h }, el('b', null, 'Hasilnya?'), el('div', { class: 'pm53-tombol' }, PIL.map(([x, t]) => onTap(el('button', { type: 'button', class: 'pm53-pilih', 'data-v': x }, t), () => {
    if (!J.jeda) return; if (x !== h) { oops(); say(msg, 'bad', 'Telusuri: apakah kasir kedua memeriksa stok sebelum kasir pertama menulis? Dan siapa yang membaca stok setelah ditulis?'); return; }
    J.jeda = false; ctx.sound.tap(); fill(kanan, el('p', { class: 'pm53-catat' }, `Ramalan: ${t}`)); say(msg, 'info', 'Ramalan dicatat. Jalankan urutannya.'); })))));
  area.append(dua53(J.node, kanan), msg);
}

// Misi Bos: threading with a lock.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg53('Susun fungsi pesan yang memakai kunci.'); const box = kol53(); const out = layar();
  fill(box, tileSlots(ctx, { oops, msg, build: ['kunci = threading.Lock()', 'def pesan(nama):', '  global stok', ['w', 1], ['i', 2], ['s', 3], '      time.sleep(0.01)', ['t', 3]],
    tiles: [['w', 'with kunci:'], ['i', 'if stok >= 1:'], ['s', 's = stok'], ['t', 'stok = s - 1; terjual.append(nama)'], ['x', 'kunci.lock()', 'Di Python, Lock dipakai dengan with kunci: agar pasti dilepas.']],
    order: 'Kunci dulu, periksa, baca, tunggu, lalu tulis.',
    onFull: () => { say(msg, 'info', 'Dua thread, A dan B, dijalankan 8 kali…'); const kn = kol53(out); fill(box, dua53(box.firstChild, kn));
      play(out, ['tanpa kunci:', ...Array.from({ length: 3 }, () => `  ${TANTANGAN.tanpa}`), '  … (8 dari 8 percobaan)', 'dengan kunci:', `  ${TANTANGAN.dengan}`], { gap: 380, end: () => {
        kn.append(fillBoard(ctx, { oops, msg, view: rowsView([['tanpa kunci, keluarannya seperti urutan ', '_'], ['dengan with kunci: ', '_']]), chips: ['Y', 'X', TANTANGAN.dengan, "-1 ['A', 'B']"], want: ['Y', TANTANGAN.dengan],
          hints: ['time.sleep membuat kedua thread membaca stok 1 sebelum ada yang menulis.', 'Hanya satu yang mendapat barang.'], done: () => { say(msg, '', 'Balapan di komputer sungguhan persis seperti di papan. with kunci: menutup celahnya.'); done(); } })); } }); } }));
  area.append(box, msg);
}

export default {
  id: 'sma-53-dua-kasir',
  title: 'Dua Kasir, Satu Stok',
  topic: 'Konkurensi: dua program yang berjalan bergantian, data bersama dan data milik sendiri, kondisi balapan, pembaruan yang hilang, bagian kritis dengan kunci, operasi atomik, serta kebuntuan karena urutan kunci yang berbeda',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧵',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Jalankan dua program kasir bergantian baris demi baris, temukan urutan yang menjual satu kain kepada dua pembeli, perbaiki dengan kunci, lalu temukan dan cegah kebuntuan.',
  extraModes: [
    { id: 'penjadwal', icon: '🎛️', label: 'Penjadwal Langkah', desc: 'Dua program kasir berdampingan: tekan A atau B untuk menjalankan satu baris dan lihat stok, s, kunci, dan pengiriman berubah', create: createJadwal },
    { id: 'jelajah', icon: '🌳', label: 'Penjelajah Urutan', desc: 'Telusuri pohon semua urutan yang mungkin, dengan warna untuk hasil benar, stok -1, pembaruan hilang, dan kebuntuan', create: createJelajah },
    { id: 'giliran', icon: '😈', label: 'Penjadwal Jahat', desc: 'Satu tim memilih versi program dan urutan kunci, tim berikutnya menjadi penjadwal yang berusaha mengacaukannya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act dua-kasir pm53-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pm53-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, ulah] = HEAD53[k]; foe = el('div', { class: 'pm53-musuh' }, el('b', null, '😈 Si Penjadwal Jahil'), el('span', null, ulah)); wrap.append(el('div', { class: 'pm53-kepala-misi' }, misiHead(no, judul, tujuan, '🛒'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Stok jujur ✓'; next(ms); } });
      if (r === 0) { go('pertama', 1); pertamaRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('x', 2); urutRound(area, ctx, fin(5500), URUT_X, 'X'); }
      else if (r === 2) { go('y', 2); urutRound(area, ctx, fin(6000), URUT_Y, 'Y'); }
      else if (r === 3) { go('buru', 3); buruRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('kunci', 4); kunciRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('dodi', 4); dodiRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('buntu', 5); buntuRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('sama', 5); samaRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('adu', 6); aduRound(area, ctx, fin(5500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};


// ---- views ----
function kodeKecil(v, warn = []) { return pyCode(kodeOf(v, 'A'), { labels: labelOf(v), cls: 'dk-kode', warn }); }
function paketView(v) {
  return el('div', { class: 'dk-dua' }, ...['A', 'B'].map((k) => el('div', { class: 'dk-kolom' }, el('b', null, `Kasir ${k}`), pyCode(kodeOf(v, k), { labels: labelOf(v), cls: 'dk-kode' }))));
}
function papan(S) {
  const p = paket(S.v);
  return el('div', { class: 'dk-papan' },
    el('div', { class: `dk-stok ${S.stok < 0 ? 'minus' : ''}` }, el('small', null, p ? 'kain' : 'stok'), el('b', null, String(S.stok))),
    ...[p ? el('div', { class: 'dk-stok' }, el('small', null, 'tas'), el('b', null, String(S.tas))) : null].filter(Boolean),
    ...kunciOf(S.v).map((L) => el('div', { class: `dk-kunci ${S.pegang[L] ? 'dipegang' : ''}` }, el('small', null, NAMA_KUNCI[L]), el('b', null, S.pegang[L] ? `🔒 ${S.pegang[L]}` : '🔓'))),
    el('div', { class: 'dk-kirim' }, el('small', null, 'dikirimi'), el('b', null, S.dikirim.length ? S.dikirim.join(', ') : '–')));
}
function statusKasir(S, k) {
  if (S.selesai[k]) return S.dikirim.includes(k) ? 'selesai: barang dikirim' : 'selesai: pesanan ditolak';
  if (menunggu(S, k)) return `menunggu ${NAMA_KUNCI[butuh(S, k)]} (dipegang ${S.pegang[butuh(S, k)]})`;
  return `baris berikutnya: ${S.pc[k]}`;
}
function banner(S) {
  const h = hasil(S);
  if (!h) return el('p', { class: 'dk-hasil' }, `${kunciOf(S.v).length ? `${kunciTeks(S)} · ` : ''}pilih kasir yang menjalankan satu baris berikutnya`);
  let w = HASIL[h].w;
  if (h === 'buntu') w = kasirOf(S).filter((k) => menunggu(S, k)).map((k) => `${k} memegang ${Object.keys(S.pegang).filter((L) => S.pegang[L] === k).map((L) => NAMA_KUNCI[L]).join(', ')} dan menunggu ${NAMA_KUNCI[butuh(S, k)]}`).join('; ');
  if (h === 'tertahan') w = kasirOf(S).filter((k) => menunggu(S, k)).map((k) => `${k} menunggu ${NAMA_KUNCI[butuh(S, k)]} selamanya, padahal ${S.pegang[butuh(S, k)]} sudah selesai`).join('; ');
  return el('p', { class: `dk-hasil ${h}` }, `${['buntu', 'tertahan'].includes(h) ? '⚠️ ' : h === 'benar' ? '✅ ' : '❌ '}${HASIL[h].t}: ${w}. Akhir: ${akhirTeks(S)}.`);
}
// Scheduler stage: one column per cashier with its program and its own s.
function panggung(S, { onPilih, log }) {
  return el('div', { class: 'dk-panggung' }, papan(S),
    el('div', { class: `dk-dua k${kasirOf(S).length}` }, ...kasirOf(S).map((k) => {
      const tunggu = menunggu(S, k); const idx = S.selesai[k] ? -1 : S.pc[k] - VERSI[S.v].mulai;
      return el('div', { class: `dk-kolom ${tunggu ? 'tunggu' : ''} ${S.selesai[k] ? 'beres' : ''}` },
        el('div', { class: 'dk-kepala' }, el('b', null, `Kasir ${k}`), ...[paket(S.v) ? null : el('span', { class: 'dk-s' }, `s = ${nilai(S.s[k])}`)].filter(Boolean)),
        pyCode(kodeOf(S.v, k), { labels: labelOf(S.v), cls: 'dk-kode', hl: idx >= 0 ? [idx] : [] }),
        el('p', { class: 'dk-status' }, statusKasir(S, k)),
        onPilih ? button(S.selesai[k] ? `${k} selesai` : `Jalankan ${k}${S.pc[k]}`, () => onPilih(k), `dk-jalan ${tunggu || S.selesai[k] ? 'redup' : 'primary'}`) : null);
    })),
    el('p', { class: 'dk-jejak' }, log.length ? log.join(', ') : 'Belum ada langkah.'), banner(S));
}

function createJadwal(root, ctx) {
  const wrap = el('div', { class: 'act dua-kasir' });
  root.append(wrap);
  let v = 'v1'; let S = awal(v); let log = []; let riwayat = [];
  const pilih = (k) => {
    if (hasil(S) || S.selesai[k]) return;
    if (menunggu(S, k)) { log = [...log, `${k}${S.pc[k]} (menunggu)`]; ctx.mistake(); draw(); shake(wrap.querySelector('.dk-dua')); return; }
    riwayat.push({ S, log }); log = [...log, `${k}${S.pc[k]}`]; S = langkah(S, k); ctx.sound.tap();
    const h = hasil(S); if (h) (h === 'benar' ? ctx.sound.good() : ctx.mistake());
    draw();
  };
  const muat = (urutan) => { S = awal(v); riwayat = []; log = []; urutan.forEach((x) => { riwayat.push({ S, log }); log = [...log, x]; if (!/menunggu/.test(x)) S = langkah(S, x[0]); }); draw(); };
  const CEPAT = {
    v1: [['Urutan X', URUT_X], ['Urutan Y', URUT_Y]],
    v2: [['Bergantian A, B', () => bergantian('v2').log]],
    dodi: [['A, lalu B, lalu C', () => { let T = awal('dodi'); const L = []; for (const k of ['A', 'B']) while (!T.selesai[k]) { L.push(`${k}${T.pc[k]}`); T = langkah(T, k); } return L; }]],
    beda: [['A1, B1, A2, B2', ['A1', 'B1', 'A2 (menunggu)', 'B2 (menunggu)']]],
    sama: [['Bergantian A, B', () => bergantian('sama').log]],
  };
  const draw = () => wrap.replaceChildren(
    el('div', { class: 'seg dk-versi' }, Object.keys(VERSI).map((x) => onTap(el('button', { class: `seg-btn ${x === v ? 'on' : ''}`, type: 'button' }, VERSI[x].nama), () => { v = x; S = awal(v); log = []; riwayat = []; draw(); }))),
    panggung(S, { onPilih: pilih, log }),
    el('div', { class: 'dk-kontrol' },
      button('↶ Mundur', () => { const p = riwayat.pop(); if (p) { ({ S, log } = p); draw(); } }),
      button('Ulang', () => { S = awal(v); log = []; riwayat = []; draw(); }),
      ...CEPAT[v].map(([t, u]) => button(t, () => muat(typeof u === 'function' ? u() : u)))));
  draw();
}

// Tree explorer: walk down the branches; each branch shows how its orders end.
function createJelajah(root, ctx) {
  const wrap = el('div', { class: 'act dua-kasir' });
  root.append(wrap);
  let v = 'v1'; let jalan = [];
  const bar = (rs) => { const c = {}; rs.forEach((x) => { c[x.hasil] = (c[x.hasil] || 0) + 1; }); return el('span', { class: 'dk-bar' }, ...Object.keys(HASIL).filter((h) => c[h]).map((h) => el('i', { class: h, style: `flex:${c[h]}`, title: HASIL[h].t }, String(c[h])))); };
  const draw = () => {
    const S = jalankan(v, jalan); const daun = semua(v, S); const total = semua(v);
    const anak = hasil(S) ? [] : kasirOf(S).filter((k) => bisa(S, k)).map((k) => { const T = langkah(S, k); return { k: `${k}${S.pc[k]}`, rs: semua(v, T) }; });
    wrap.replaceChildren(
      el('div', { class: 'seg dk-versi' }, Object.keys(VERSI).map((x) => onTap(el('button', { class: `seg-btn ${x === v ? 'on' : ''}`, type: 'button' }, VERSI[x].nama), () => { v = x; jalan = []; draw(); }))),
      el('p', { class: 'dk-ringkas' }, `${VERSI[v].nama}: ${total.length} urutan. `, ...Object.keys(HASIL).filter((h) => total.some((x) => x.hasil === h)).map((h) => el('span', { class: `dk-tanda ${h}` }, `${HASIL[h].t} ${total.filter((x) => x.hasil === h).length}`))),
      el('div', { class: 'dk-jalur' }, onTap(el('button', { class: `dk-simpul akar ${jalan.length ? '' : 'on'}`, type: 'button' }, 'Mulai'), () => { jalan = []; draw(); }),
        ...jalan.map((x, i) => onTap(el('button', { class: `dk-simpul ${i === jalan.length - 1 ? 'on' : ''}`, type: 'button' }, x), () => { jalan = jalan.slice(0, i + 1); draw(); }))),
      el('div', { class: 'dk-pohon' },
        el('div', { class: 'dk-keadaan' }, papan(S), el('p', { class: 'dk-status' }, kasirOf(S).map((k) => `${k}: ${statusKasir(S, k)}${paket(v) ? '' : `, s = ${nilai(S.s[k])}`}`).join(' · '))),
        anak.length ? el('div', { class: 'dk-cabang' }, ...anak.map((a) => onTap(el('button', { class: 'dk-anak', type: 'button' }, el('b', null, a.k), el('small', null, `${a.rs.length} urutan`), bar(a.rs)), () => { jalan = [...jalan, a.k]; ctx.sound.tap(); draw(); })))
          : banner(S)),
      el('p', { class: 'prompt dk-kecil' }, `Semua urutan di cabang ini (${daun.length})`),
      el('div', { class: 'dk-daun' }, ...daun.map((x) => onTap(el('button', { class: `dk-urut ${x.hasil}`, type: 'button', title: HASIL[x.hasil].t }, x.urutan.join(' ')), () => { jalan = x.urutan; draw(); }))),
      el('p', { class: 'dk-legenda' }, ...Object.keys(HASIL).map((h) => el('span', { class: `dk-tanda ${h}` }, `${HASIL[h].t}: ${HASIL[h].w}`))));
  };
  draw();
}

// Team mode, as in soal 6: the cashier team picks the program, the next team schedules and tries to break it.
const PILIHAN = [['v1', 'Tanpa kunci'], ['v2', 'Satu kunci'], ['beda', 'Dua kunci, urutan berbeda'], ['sama', 'Dua kunci, urutan sama']];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act dua-kasir' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Penjadwal Jahat selesai', pts, again: () => pickTeams(wrap, 'Penjadwal Jahat', start) }); return; }
      const kasir = t % nT; const jadwal = (t + 1) % nT; let v = null; let S = null; let log = [];
      const msg = el('p', { class: 'reveal info' }, '');
      const pilihVersi = () => wrap.replaceChildren(scoreBar(pts, kasir), el('p', { class: 'prompt' }, `Tim ${kasir + 1} (kasir): pilih versi program dan urutan kunci`),
        el('p', { class: 'dk-ket' }, `Tim ${jadwal + 1} lalu menjadi penjadwal yang berusaha menjual barang dua kali atau membuat kebuntuan. Penjadwal +1 bila berhasil mengacaukan; kasir +1 bila hasilnya benar, ditambah +1 untuk pengiriman yang sah.`),
        el('div', { class: 'dk-pilih' }, ...PILIHAN.map(([x, t2]) => onTap(el('button', { class: 'dk-anak', type: 'button' }, el('b', null, t2), x === 'v1' ? kodeKecil('v1') : x === 'v2' ? kodeKecil('v2') : paketView(x)), () => { v = x; S = awal(v); ctx.sound.tap(); main(); }))));
      const main = () => {
        const h = hasil(S);
        wrap.replaceChildren(scoreBar(pts, jadwal), el('p', { class: 'prompt' }, h ? 'Babak selesai' : `Tim ${jadwal + 1} (penjadwal): pilih kasir yang melangkah`),
          panggung(S, { log, onPilih: h ? null : (k) => {
            if (menunggu(S, k)) { log = [...log, `${k}${S.pc[k]} (menunggu)`]; ctx.mistake(); main(); return; }
            if (S.selesai[k]) return;
            log = [...log, `${k}${S.pc[k]}`]; S = langkah(S, k); ctx.sound.tap();
            const h2 = hasil(S);
            if (h2) {
              if (h2 === 'benar') { pts[kasir] += 2; ctx.sound.good(); say(msg, 'good', `Program Tim ${kasir + 1} bertahan: +1 karena benar, +1 untuk pengiriman yang sah.`); }
              else { pts[jadwal] += 1; ctx.mistake(); say(msg, 'bad', `Tim ${jadwal + 1} berhasil mengacaukan: ${HASIL[h2].t}. +1 untuk penjadwal.`); }
            }
            main();
          } }),
          msg, ...[h ? button('Lanjut ➜', () => { t++; step(); }, 'primary') : null].filter(Boolean));
      };
      pilihVersi();
    }
    step();
  }
  pickTeams(wrap, 'Penjadwal Jahat', start);
}
