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
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode } from './smp-kit.js';

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
    const wrap = el('div', { class: 'act dua-kasir' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        const S = jalankan('v1', ['A1', 'A2', 'A3', 'A4']); const T = langkah(S, 'B');
        wrap.append(kodeKecil('v1'));
        rowsChoose(wrap, ctx, { prompt: 'Satu pesanan. Mula-mula stok = 1.', cls: 'dk-isi', rows: [
          ['a', 'Kasir A menjalankan baris 1–4 tanpa disela: stok', ['-1', '0', '1'], String(S.stok)],
          ['k', 'Yang dikirimi barang', ['pembeli A', 'pembeli B', 'A dan B', 'tidak ada'], `pembeli ${S.dikirim[0]}`],
          ['b', 'Setelah itu Kasir B menjalankan programnya', ['ditolak di baris 1, karena stok >= 1 salah', 'dikirimi barang, stok menjadi -1', 'menunggu sampai stok bertambah', 'berhenti dengan galat'], T.ditolak.includes('B') ? 'ditolak di baris 1, karena stok >= 1 salah' : '?'],
        ], done: next });
      }
      else if (r === 1 || r === 2) {
        const U = r === 1 ? URUT_X : URUT_Y;
        wrap.append(kodeKecil('v1'), el('p', { class: 'dk-urutan' }, `Urutan ${r === 1 ? 'X' : 'Y'}: ${U.join(', ')}`));
        rowsChoose(wrap, ctx, { prompt: 'Setelah langkah ini: stok · s milik A · s milik B', cls: 'dk-isi dk-mono', rows: tabelRows(U), done: next, info: 'Mula-mula stok = 1. Kasir yang belum menjalankan baris 2 belum punya s, tulis "-".' });
      }
      else if (r === 3) {
        const X = jalankan('v1', URUT_X); const Y = jalankan('v1', URUT_Y);
        const opsi = ['stok -1, dikirim ke A dan B', 'stok 0, dikirim ke A dan B', 'stok 0, dikirim ke A saja', 'stok -1, dikirim ke A saja'];
        wrap.append(el('p', { class: 'dk-urutan' }, `X: ${URUT_X.join(', ')}`), el('p', { class: 'dk-urutan' }, `Y: ${URUT_Y.join(', ')}`));
        rowsChoose(wrap, ctx, { prompt: 'Keadaan akhir kedua urutan', cls: 'dk-isi', rows: [
          ['x', 'Urutan X', opsi, akhirTeks(X)],
          ['y', 'Urutan Y', opsi, akhirTeks(Y)],
          ['s', 'Kesalahan yang lebih sulit ketahuan dari catatan stok', ['Urutan Y: stok 0 tampak wajar, padahal dua barang terjual', 'Urutan X: stok -1 tampak wajar', 'keduanya sama mudah ketahuan', 'tidak ada yang salah'], 'Urutan Y: stok 0 tampak wajar, padahal dua barang terjual'],
          ['n', 'Nama masalah di urutan Y', ['pembaruan yang hilang: pengurangan oleh A ditimpa B yang menulis dari salinan lamanya', 'kebuntuan: kedua kasir saling menunggu', 'galat sintaks di baris 3', 'stok dibaca dua kali oleh A'], 'pembaruan yang hilang: pengurangan oleh A ditimpa B yang menulis dari salinan lamanya'],
        ], done: next });
      }
      else if (r === 4) {
        const H = hitung('v1'); const n = semua('v1').length; const benarLain = ['A1', 'A2', 'A3', 'B1', 'A4'];
        const contoh = [benarLain, ['A1', 'A2', 'B1', 'A3', 'A4'], ['A1', 'B1', 'A2', 'A3', 'A4'], ['B1', 'A1', 'B2', 'B3', 'B4']].map((u) => u.join(', '));
        rowsChoose(wrap, ctx, { prompt: `Penjadwal bisa memilih ${n} urutan langkah yang berbeda.`, cls: 'dk-isi', rows: [
          ['a', 'Urutan lain yang hasilnya tetap benar', contoh, contoh[hasil(jalankan('v1', benarLain)) === 'benar' ? 0 : 1]],
          ['n', `Banyak urutan yang benar dari ${n}`, ['2', '4', '8', '16'], String(H.benar)],
          ['r', 'Aturan urutan yang benar', ['salah satu kasir sudah menjalankan baris 3 sebelum kasir lain menjalankan baris 1', 'Kasir A selalu lebih dulu', 'kedua kasir menjalankan baris 1 berurutan', 'baris 4 dijalankan paling akhir'], 'salah satu kasir sudah menjalankan baris 3 sebelum kasir lain menjalankan baris 1'],
          ['m', `Dari ${n - H.benar} urutan yang salah: stok -1 · stok 0`, uniq([`${H.minus} · ${H.hilang}`, `${H.hilang} · ${H.minus}`, '30 · 30', '12 · 48']), `${H.minus} · ${H.hilang}`],
          ['c', 'Uji Rudi (memesan sendiri berkali-kali) selalu lolos, karena', ['pesanannya satu per satu, jadi tidak pernah ada dua program yang saling menyela; bug muncul saat banyak pembeli memesan pada detik yang sama', 'program Rudi sudah memakai kunci', 'komputer Rudi lebih cepat', 'stok Rudi selalu 0'], 'pesanannya satu per satu, jadi tidak pernah ada dua program yang saling menyela; bug muncul saat banyak pembeli memesan pada detik yang sama'],
        ], done: next });
      }
      else if (r === 5) {
        const G = bergantian('v2'); const iA5 = G.log.indexOf('A5'); const sesudah = G.log.slice(iA5 + 1).join(', ');
        wrap.append(kodeKecil('v2'));
        rowsChoose(wrap, ctx, { prompt: 'Memakai kunci. Penjadwal bergantian menunjuk A, B, A, B, …', cls: 'dk-isi', rows: [
          ['w', 'Selama A memegang kunci, setiap giliran B', ['B0 (menunggu): B tidak berpindah baris', 'B1: B memeriksa stok', 'B5: B melepas kunci', 'B ditolak'], 'B0 (menunggu): B tidak berpindah baris'],
          ['s', 'Langkah sesudah A5', uniq([sesudah, 'B0, B1, B2, B3, B4, B5', 'B1, B5', 'B0, B5']), sesudah, `Urutan lengkap: ${G.log.join(', ')}. B mengambil kunci, tetapi stok sudah 0, jadi B ditolak dan melepas kunci.`],
          ['k', 'Keadaan akhir', ['stok 0, dikirim ke A saja', 'stok -1, dikirim ke A dan B', 'stok 0, dikirim ke A dan B', 'stok 1, tidak ada yang dikirimi'], akhirTeks(G.S)],
          ['b', 'Hasilnya selalu benar, karena', ['baris 1–4 menjadi bagian kritis: hanya pemegang kunci yang menjalankannya, jadi tidak bisa disela', 'kunci membuat program lebih cepat', 'B selalu kalah cepat', 'stok dibaca dua kali'], 'baris 1–4 menjadi bagian kritis: hanya pemegang kunci yang menjalankannya, jadi tidak bisa disela'],
          ['n', 'Banyak urutan yang mungkin dengan kunci', ['1', '2', '4', '64'], String(semua('v2').length)],
        ], done: next });
      }
      else if (r === 6) {
        wrap.append(kodeKecil('dodi', [5]));
        rowsChoose(wrap, ctx, { prompt: 'Lupa melepas, bagian kritis, dan operasi atomik', cls: 'dk-isi', rows: [
          ['c', 'Dodi lupa lepas(kunci) bila ditolak. A, lalu B, lalu C, stok = 1. Nasib C', [`menunggu di baris 0 selamanya, padahal tidak ada yang memakai stok`, 'ditolak di baris 1', 'dikirimi barang', 'stok menjadi -1'], tertahanC()],
          ['w', 'Di Python, kunci dilepas otomatis ketika blok selesai dengan', ['with kunci:', 'if kunci:', 'for kunci in stok:', 'kunci = None'], 'with kunci:'],
          ['d', 'Baris 4 lama karena barang harus dikemas. Letakkan', ['sesudah lepas(kunci): pengemasan tidak mengubah stok, bagian kritis sependek mungkin', 'sebelum ambil(kunci)', 'di dalam bagian kritis supaya aman', 'dua kali, sebelum dan sesudah'], 'sesudah lepas(kunci): pengemasan tidak mengubah stok, bagian kritis sependek mungkin'],
          ['e', '"Kurangi 1 bila stok masih paling sedikit 1" sebagai operasi atomik mencegah soal 2, karena', ['memeriksa dan mengurangi terjadi dalam satu langkah yang tidak bisa disela', 'stok disimpan di dua tempat', 'kasir lain dimatikan', 'basis data selalu lebih cepat'], 'memeriksa dan mengurangi terjadi dalam satu langkah yang tidak bisa disela'],
        ], done: next });
      }
      else if (r === 7) {
        const B = jalankan('beda', ['A1', 'B1']); const H = hitung('beda');
        wrap.append(paketView('beda'));
        rowsChoose(wrap, ctx, { prompt: 'Dua kunci: kunci_kain dan kunci_tas. Kain 1, tas 1.', cls: 'dk-isi', rows: [
          ['a', 'Penjadwal memilih A1, B1, A2, B2', [buntu(B) ? 'kebuntuan: A memegang kunci_kain dan menunggu kunci_tas, B memegang kunci_tas dan menunggu kunci_kain' : '?', 'A mengirim paket', 'B mengirim paket', 'keduanya ditolak'], 'kebuntuan: A memegang kunci_kain dan menunggu kunci_tas, B memegang kunci_tas dan menunggu kunci_kain'],
          ['p', 'Pembeli lain yang ingin membeli kain saja', ['ikut tertahan, karena kunci_kain tidak pernah dilepas', 'tetap dilayani', 'mendapat paket', 'ditolak karena stok habis'], 'ikut tertahan, karena kunci_kain tidak pernah dilepas'],
          ['n', `Dari ${semua('beda').length} urutan, yang berakhir buntu`, ['0', '1', '2', '4'], String(H.buntu)],
          ['u', 'Urutan buntu dimulai dengan', ['A1, B1 atau B1, A1', 'A1, A2', 'B1, B2', 'A5, B5'], semua('beda').filter((x) => x.hasil === 'buntu').map((x) => x.urutan.join(', ')).join(' atau ')],
        ], done: next });
      }
      else if (r === 8) {
        const n = semua('sama').length; const H = hitung('sama');
        rowsChoose(wrap, ctx, { prompt: 'Mencegah kebuntuan, dan program Tantangan', cls: 'dk-isi', rows: [
          ['c', 'Ubah Kasir B supaya tidak mungkin buntu', ['ambil(kunci_kain) dulu, lalu ambil(kunci_tas), sama dengan A, seperti "ambil sendok dulu"', 'lepas(kunci_tas) lebih dulu', 'tunggu satu detik sebelum mengambil kunci', 'hapus kunci_kain'], 'ambil(kunci_kain) dulu, lalu ambil(kunci_tas), sama dengan A, seperti "ambil sendok dulu"'],
          ['n', 'Banyak urutan setelah diperbaiki · yang buntu', uniq([`${n} · ${H.buntu || 0}`, '6 · 2', '4 · 0', '2 · 1']), `${n} · ${H.buntu || 0}`],
          ['r', 'Usul Rina: satu kunci untuk seluruh stok', ['tidak mungkin buntu dan lebih sederhana, tetapi pesanan kain dan pesanan tas harus saling menunggu', 'lebih cepat dan tetap aman', 'bisa buntu', 'stok bisa menjadi -1'], 'tidak mungkin buntu dan lebih sederhana, tetapi pesanan kain dan pesanan tas harus saling menunggu'],
          ['t', 'Tantangan (threading, time.sleep(0.01), tanpa kunci): keluaran', [TANTANGAN.tanpa, "-1 ['A', 'B']", TANTANGAN.dengan, '1 []'], TANTANGAN.tanpa],
          ['k', 'Setelah memakai with kunci:', [TANTANGAN.dengan, TANTANGAN.tanpa, "-1 ['A']", "1 ['A']"], TANTANGAN.dengan],
        ], done: next, info: `Keluaran tanpa kunci sama dengan urutan Y. Dengan kunci, keluarannya ${TANTANGAN.dengan}, atau 0 ['B'] bila B lebih dulu mendapat kunci.` });
      }
      else {
        const S = acak('v1', ctx.rand); const h = hasil(S);
        const jenis = { benar: 'benar: satu terkirim, satu ditolak', minus: 'stok -1: terjual dua kali', hilang: 'pembaruan hilang: stok 0, terjual dua kali' };
        wrap.append(kodeKecil('v1'), el('p', { class: 'dk-urutan' }, `Penjadwal memilih: ${S.jejak.join(', ')}`));
        rowsChoose(wrap, ctx, { prompt: 'Babak penjadwal. Mula-mula stok = 1.', cls: 'dk-isi', rows: [
          ['s', 'Stok akhir', ['-1', '0', '1'], String(S.stok)],
          ['k', 'Yang dikirimi barang', ['A saja', 'B saja', 'A dan B', 'tidak ada'], S.dikirim.length > 1 ? 'A dan B' : `${S.dikirim[0]} saja`],
          ['h', 'Hasil babak', Object.values(jenis), jenis[h]],
        ], done: next });
      }
    }
    render();
  },
};

function tabelRows(U) {
  let S = awal('v1'); const out = [];
  U.forEach((x, i) => {
    S = langkah(S, x[0]);
    const t = [S.stok, nilai(S.s.A), nilai(S.s.B)];
    const right = t.join(' · ');
    if (i === 0) return;
    if (i === U.length - 1) { out.push([x, `Setelah ${x}: yang dikirimi`, ['A', 'B', 'A, B', 'belum ada'], S.dikirim.length ? S.dikirim.join(', ') : 'belum ada']); return; }
    if (i === U.length - 2) return;
    const salah = uniq([right, [t[0] - 1, t[1], t[2]].join(' · '), [t[0], t[2], t[1]].join(' · '), [t[0] === 1 ? 0 : 1, t[1], t[2]].join(' · '), [t[0], t[1], t[2] === '-' ? '1' : '-'].join(' · ')]).slice(0, 4);
    out.push([x, `Setelah ${x}`, salah, right]);
  });
  return out;
}
// Dodi with three cashiers served A, then B, then C.
function tertahanC() {
  let S = awal('dodi');
  while (!S.selesai.A) S = langkah(S, 'A');
  while (!S.selesai.B) S = langkah(S, 'B');
  return menunggu(S, 'C') && S.pc.C === 0 && buntu(S) ? 'menunggu di baris 0 selamanya, padahal tidak ada yang memakai stok' : '?';
}

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
