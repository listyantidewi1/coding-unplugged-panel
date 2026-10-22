// Proyek Aplikasi Pesan Kantin — SMP (13–15 tahun), coding. Decomposing Bu
// Sari's six requirements into functions over parallel arrays, completing
// PESAN, BATAL and HITUNG_TOTAL, planning normal, boundary and invalid test
// cases, testing Kenanga's program (four bugs) and peer testing.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, stepper, codeView } from './smp-kit.js';
import { runAll } from './pseudo.js';

export const NAMA = ['Nasi goreng', 'Mi ayam', 'Soto ayam', 'Gado-gado', 'Es teh', 'Jus jeruk'];
export const HARGA = [8000, 7000, 8000, 6000, 2000, 4000];
export const STOK = [20, 15, 10, 12, 40, 5];
const rp = (n) => `Rp${n.toLocaleString('id-ID')}`;
export const fresh = () => ({ nama: [...NAMA], harga: [...HARGA], stok: [...STOK], pesanan: [0, 0, 0, 0, 0, 0] });

// Blanks of the skeleton (first option is the right one).
export const BLANKS = {
  P2: ['nomor > 6', 'nomor ≥ 6', 'nomor > 7'],
  P6: ['>', '≥'],
  P8: ['pesanan[nomor] + jumlah', 'jumlah', 'pesanan[nomor] − jumlah'],
  P9: ['stok[nomor] − jumlah', 'stok[nomor] + jumlah', 'stok[nomor]'],
  B: ['stok dulu, lalu pesanan dikosongkan', 'pesanan dikosongkan dulu, lalu stok'],
  H4: ['total + harga[i] × pesanan[i]', 'harga[i] × pesanan[i]', 'total + harga[i]'],
  H5: ['total ≥ 20000', 'total > 20000'],
};
export const RIGHT = Object.fromEntries(Object.keys(BLANKS).map((k) => [k, BLANKS[k][0]]));
const show = (b, k) => (b[k] ?? '..........');
// Skeleton program with labels, filled from choices b (missing → dots).
export function kerangka(b = {}) {
  const L = [
    ['P1', 'FUNGSI PESAN(nomor, jumlah)'], ['P2', `    JIKA nomor < 1 ATAU ${show(b, 'P2')} MAKA`], ['P3', '        KEMBALIKAN "Nomor menu tidak ada"'], ['P4', '    JIKA jumlah < 1 MAKA'], ['P5', '        KEMBALIKAN "Jumlah minimal 1"'], ['P6', `    JIKA jumlah ${show(b, 'P6')} stok[nomor] MAKA`], ['P7', '        KEMBALIKAN "Stok tidak cukup, sisa " + TEKS(stok[nomor])'], ['P8', `    pesanan[nomor] ← ${show(b, 'P8')}`], ['P9', `    stok[nomor] ← ${show(b, 'P9')}`], ['P10', '    KEMBALIKAN "BERHASIL"'],
    ['B1', 'FUNGSI BATAL(nomor)'], ['B2', '    JIKA nomor < 1 ATAU nomor > 6 MAKA'], ['B3', '        KEMBALIKAN "Nomor menu tidak ada"'], ['B4', '    JIKA pesanan[nomor] = 0 MAKA'], ['B5', '        KEMBALIKAN "Menu ini belum dipesan"'],
    ...(b.B === BLANKS.B[1] ? [['B6', '    pesanan[nomor] ← 0'], ['B7', '    stok[nomor] ← stok[nomor] + pesanan[nomor]']] : b.B ? [['B6', '    stok[nomor] ← stok[nomor] + pesanan[nomor]'], ['B7', '    pesanan[nomor] ← 0']] : [['B6', '    ..........'], ['B7', '    ..........']]), ['B8', '    KEMBALIKAN "DIBATALKAN"'],
    ['H1', 'FUNGSI HITUNG_TOTAL()'], ['H2', '    total ← 0'], ['H3', '    UNTUK i DARI 1 SAMPAI 6'], ['H4', `        total ← ${show(b, 'H4')}`], ['H5', `    JIKA ${show(b, 'H5')} MAKA`], ['H6', '        total ← total − 2000'], ['H7', '    KEMBALIKAN total']];
  return L;
}
// Kenanga's program, with the four fixes as switches.
export function kenanga(fix = {}) {
  return [['K1', 'FUNGSI PESAN(nomor, jumlah)'], ...(fix.nomor ? [['+', '    JIKA nomor < 1 ATAU nomor > 6 MAKA'], ['+', '        KEMBALIKAN "Nomor menu tidak ada"']] : []), ['K2', '    JIKA jumlah < 1 MAKA'], ['K3', '        KEMBALIKAN "Jumlah minimal 1"'], ['K4', `    JIKA jumlah ${fix.k4 ? '>' : '≥'} stok[nomor] MAKA`], ['K5', '        KEMBALIKAN "Stok tidak cukup, sisa " + TEKS(stok[nomor])'], ['K6', '    pesanan[nomor] ← pesanan[nomor] + jumlah'], ['K7', '    stok[nomor] ← stok[nomor] − jumlah'], ['K8', '    KEMBALIKAN "BERHASIL"'],
    ['K9', 'FUNGSI BATAL(nomor)'], ['K10', '    JIKA nomor < 1 ATAU nomor > 6 MAKA'], ['K11', '        KEMBALIKAN "Nomor menu tidak ada"'], ['K12', '    JIKA pesanan[nomor] = 0 MAKA'], ['K13', '        KEMBALIKAN "Menu ini belum dipesan"'],
    ...(fix.batal ? [['K14', '    stok[nomor] ← stok[nomor] + pesanan[nomor]'], ['K15', '    pesanan[nomor] ← 0']] : [['K14', '    pesanan[nomor] ← 0'], ['K15', '    stok[nomor] ← stok[nomor] + pesanan[nomor]']]), ['K16', '    KEMBALIKAN "DIBATALKAN"'],
    ['K17', 'FUNGSI HITUNG_TOTAL()'], ['K18', '    total ← 0'], ['K19', '    UNTUK i DARI 1 SAMPAI 6'], ['K20', '        total ← total + harga[i] × pesanan[i]'], ['K21', `    JIKA total ${fix.k21 ? '≥' : '>'} 20000 MAKA`], ['K22', '        total ← total − 2000'], ['K23', '    KEMBALIKAN total']];
}
export const BENAR = kerangka(RIGHT);
const UBAH = ['FUNGSI UBAH(nomor, jumlah_baru)', '    BATAL(nomor)', '    KEMBALIKAN PESAN(nomor, jumlah_baru)'];
export const UTAMA = [['L1', 'PROSEDUR LIHAT_MENU()'], ['L2', '    UNTUK i DARI 1 SAMPAI 6'], ['L3', '        TAMPILKAN i, nama[i], harga[i], "sisa", stok[i]'], ['U1', 'pilihan ← 0'], ['U2', 'SELAMA pilihan ≠ 4'], ['U3', '    TAMPILKAN "1 Lihat menu, 2 Pesan, 3 Batal, 4 Selesai"'], ['U4', '    pilihan ← BACA()'], ['U5', '    JIKA pilihan = 1 MAKA'], ['U6', '        LIHAT_MENU()'], ['U7', '    SELAIN ITU JIKA pilihan = 2 MAKA'], ['U8', '        nomor ← BACA()'], ['U9', '        jumlah ← BACA()'], ['U10', '        TAMPILKAN PESAN(nomor, jumlah)'], ['U11', '    SELAIN ITU JIKA pilihan = 3 MAKA'], ['U12', '        nomor ← BACA()'], ['U13', '        TAMPILKAN BATAL(nomor)'],
  ['U14', 'UNTUK i DARI 1 SAMPAI 6'], ['U15', '    JIKA pesanan[i] > 0 MAKA'], ['U16', '        TAMPILKAN nama[i], pesanan[i], "×", harga[i], "=", pesanan[i] × harga[i]'], ['U17', 'TAMPILKAN "Total bayar:", HITUNG_TOTAL()']];
const txt = (L) => L.map(([, t]) => t); const lab = (L) => L.map(([l]) => l);
const view = (L, o = {}) => codeView(txt(L), { labels: lab(L), ...o });

// A step: ['PESAN', n, j] | ['BATAL', n] | ['TOTAL'] | ['STOK', n] | ['UBAH', n, j].
const callOf = (s) => (s[0] === 'TOTAL' ? 'TAMPILKAN HITUNG_TOTAL()' : s[0] === 'STOK' ? `TAMPILKAN stok[${s[1]}]` : `TAMPILKAN ${s[0]}(${s.slice(1).join(', ')})`);
const fmtRes = (s, v) => (s[0] === 'TOTAL' ? `total ${v}` : s[0] === 'STOK' ? `stok[${s[1]}] = ${v}` : `"${v}"`);
const errText = (e) => { const m = /Indeks (\S+) di luar batas larik/.exec(e.message); return m ? `galat: indeks ${m[1]} di luar larik` : `galat: ${e.message}`; };
// Run steps on a program from a freshly opened app (or from state).
export function exec(L, steps, state = fresh()) {
  const r = runAll([...txt(L), ...UBAH, ...steps.map(callOf)], { vars: state, limit: 5000 });
  const parts = r.out.map((v, i) => fmtRes(steps[i], v));
  if (r.error) parts.push(errText(r.error));
  return { text: parts.join(', '), error: r.error, vars: r.vars, out: r.out };
}
// Expected results by Bu Sari's rules, not by any program.
export function rule(steps) {
  const st = fresh(); const res = [];
  for (const s of steps) {
    const [f, n, j] = s; const ok = Number.isInteger(n) && n >= 1 && n <= 6; const k = n - 1;
    if (f === 'PESAN') res.push(`"${!ok ? 'Nomor menu tidak ada' : j < 1 ? 'Jumlah minimal 1' : j > st.stok[k] ? `Stok tidak cukup, sisa ${st.stok[k]}` : (st.pesanan[k] += j, st.stok[k] -= j, 'BERHASIL')}"`);
    else if (f === 'BATAL') res.push(`"${!ok ? 'Nomor menu tidak ada' : !st.pesanan[k] ? 'Menu ini belum dipesan' : (st.stok[k] += st.pesanan[k], st.pesanan[k] = 0, 'DIBATALKAN')}"`);
    else if (f === 'STOK') res.push(ok ? `stok[${n}] = ${st.stok[k]}` : 'galat: indeks di luar larik');
    else if (f === 'TOTAL') { const t = st.pesanan.reduce((a, p, i) => a + p * HARGA[i], 0); res.push(`total ${t >= 20000 ? t - 2000 : t}`); }
  }
  return res.join(', ');
}
export const CASES = [
  [[['PESAN', 1, 2], ['TOTAL']], 'biasa'], [[['PESAN', 7, 1]], 'tidak sah'], [[['PESAN', 0, 1]], 'tidak sah'], [[['PESAN', 2, 0]], 'tidak sah'], [[['PESAN', 6, 5], ['STOK', 6]], 'batas'],
  [[['PESAN', 6, 6]], 'batas'], [[['PESAN', 3, 2], ['BATAL', 3], ['STOK', 3]], 'biasa'], [[['BATAL', 4]], 'tidak sah'], [[['PESAN', 1, 1], ['PESAN', 4, 2], ['TOTAL']], 'batas'], [[['PESAN', 2, 1], ['PESAN', 4, 2], ['TOTAL']], 'batas']];
export const stepText = (s) => (s[0] === 'TOTAL' ? 'HITUNG_TOTAL()' : s[0] === 'STOK' ? `lihat stok[${s[1]}]` : `${s[0]}(${s.slice(1).join(', ')})`);
export const caseText = (steps) => steps.map(stepText).join(', ');
export const verdict = (L, steps) => { const want = rule(steps); const got = exec(L, steps).text; return { want, got, pass: want === got }; };
// The struk of question 3d, from the main program with BACA() inputs.
export const KETIK = [2, 1, 1, 2, 4, 2, 2, 5, 2, 4];
export function kiosk(L, inputs = KETIK) { let k = 0; return runAll([...txt(L), ...txt(UTAMA)], { vars: fresh(), builtins: { BACA: () => inputs[k++] ?? 4 }, limit: 20000 }); }

function tables(st) {
  return el('table', { class: 'kn-tabel' }, el('tr', null, ['No', 'Menu', 'Harga', 'stok', 'pesanan'].map((h) => el('th', null, h))),
    NAMA.map((n, i) => el('tr', { class: st.pesanan[i] ? 'ada' : '' }, el('td', null, String(i + 1)), el('td', null, n), el('td', null, rp(HARGA[i])), el('td', null, String(st.stok[i])), el('td', null, String(st.pesanan[i])))));
}
function testTable(L, cases) {
  return el('div', { class: 'kn-uji-wadah' }, el('table', { class: 'kn-uji' }, el('tr', null, ['No', 'Langkah', 'Diharapkan', 'Hasil program', 'Lulus?'].map((h) => el('th', null, h))),
    cases.map((c, i) => { const v = verdict(L, c); return el('tr', { class: v.pass ? 'lulus' : 'gagal' }, el('td', null, String(i + 1)), el('td', null, caseText(c)), el('td', null, v.want), el('td', null, v.got), el('td', null, v.pass ? '✓ lulus' : '✗ gagal')); })));
}

export default {
  id: 'smp-42-aplikasi-kantin',
  title: 'Proyek Aplikasi Pesan Kantin',
  topic: 'Proyek: dekomposisi kebutuhan menjadi fungsi, larik sejajar, melengkapi pseudocode, kasus uji biasa, batas, dan tidak sah, serta menguji program kelompok lain',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🍜',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Uraikan kebutuhan Bu Sari menjadi fungsi, lengkapi PESAN, BATAL, dan HITUNG_TOTAL, susun kasus uji, lalu temukan empat bug di program Kelompok Kenanga.',
  extraModes: [
    { id: 'aplikasi', icon: '🍜', label: 'Kerangka dan Aplikasi', desc: 'Isi baris yang kosong dengan memilih, lalu "Coba aplikasi" seperti di komputer kantin, lengkap dengan tabel stok dan pesanan', create: createApp },
    { id: 'penguji', icon: '🧪', label: 'Penguji', desc: 'Kasus uji 1–10 dan kasus tambahan; "Uji semua" dari aplikasi yang baru dibuka. Muat program Kenanga, tandai baris yang dicurigai, perbaiki, uji ulang', create: createTester },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Buat dan Uji', desc: 'Satu tim menyusun program dari kerangka, tim lain memilih kasus uji; penguji mendapat poin untuk bug yang ditemukan, pembuat untuk kasus yang lulus', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act aplikasi-kantin' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const K = kenanga();
      if (r === 0) { wrap.append(tables(fresh())); rowsChoose(wrap, ctx, { prompt: 'Dekomposisi: uraikan setiap bagian', rows: [['p', 'Pesan: periksa nomor menu; …', ['periksa jumlah paling sedikit 1; periksa stok cukup; tambahkan ke pesanan; kurangi stok', 'kurangi stok; periksa stok cukup; tambahkan ke pesanan; hitung total', 'tambahkan ke pesanan; tampilkan struk; periksa jumlah; kurangi stok'], 'periksa jumlah paling sedikit 1; periksa stok cukup; tambahkan ke pesanan; kurangi stok'], ['b', 'Batal', ['periksa nomor menu; periksa menu sudah dipesan; kembalikan stok; kosongkan pesanan menu itu', 'kosongkan pesanan menu itu; kembalikan stok; periksa nomor menu; periksa menu sudah dipesan', 'periksa jumlah; kurangi stok; kosongkan pesanan; hitung total'], 'periksa nomor menu; periksa menu sudah dipesan; kembalikan stok; kosongkan pesanan menu itu'], ['s', 'Selesai dan bayar: hitung subtotal setiap menu; …', ['jumlahkan semua subtotal; beri potongan Rp2.000 bila total paling sedikit Rp20.000; tampilkan struk dan total bayar', 'kurangi stok; jumlahkan subtotal; tampilkan menu', 'beri potongan untuk setiap menu; tampilkan struk; kosongkan stok'], 'jumlahkan semua subtotal; beri potongan Rp2.000 bila total paling sedikit Rp20.000; tampilkan struk dan total bayar']], done: next }); }
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Kebutuhan Bu Sari yang dipenuhi setiap bagian', rows: [['l', 'Lihat menu', ['1', '2', '4 dan 5'], '1'], ['p', 'Pesan', ['2 dan 6', '2', '3 dan 6', '1 dan 2'], '2 dan 6'], ['b', 'Batal', ['3 (dan 6 untuk nomor yang salah)', '2', '4', '5'], '3 (dan 6 untuk nomor yang salah)'], ['s', 'Selesai dan bayar', ['4 dan 5', '4', '5 dan 6', '3 dan 4'], '4 dan 5']], done: next });
      else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Kartu fungsi: masukan, keluaran, larik yang diubah', rows: [['pk', 'PESAN(nomor, jumlah): keluaran', ['"BERHASIL" atau pesan galat', 'total bayar', 'tidak ada'], '"BERHASIL" atau pesan galat'], ['pl', 'PESAN: larik yang diubah', ['pesanan dan stok', 'tidak ada', 'harga', 'stok saja'], 'pesanan dan stok'], ['bm', 'BATAL: masukan', ['nomor', 'nomor, jumlah', 'tidak ada'], 'nomor'], ['bl', 'BATAL: keluaran · larik diubah', ['"DIBATALKAN" atau pesan galat · pesanan dan stok', 'total bayar · tidak ada', '"DIBATALKAN" · harga'], '"DIBATALKAN" atau pesan galat · pesanan dan stok'], ['h', 'HITUNG_TOTAL(): masukan · keluaran · larik diubah', ['tidak ada · total bayar sesudah potongan · tidak ada', 'pesanan · total · stok', 'tidak ada · struk · pesanan'], 'tidak ada · total bayar sesudah potongan · tidak ada']], done: next });
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Mengapa fungsinya dirancang seperti ini?', rows: [['a', 'PESAN memakai KEMBALIKAN, bukan TAMPILKAN, karena', ['bagian lain yang memutuskan cara menampilkan, dan kasus uji bisa memeriksa nilai yang dikembalikan', 'KEMBALIKAN lebih cepat', 'TAMPILKAN tidak boleh dipakai di fungsi'], 'bagian lain yang memutuskan cara menampilkan, dan kasus uji bisa memeriksa nilai yang dikembalikan', 'Fungsi yang langsung menampilkan sulit dipakai ulang dan sulit diuji.'], ['b', 'HITUNG_TOTAL tidak boleh mengubah stok atau pesanan, karena', ['memanggilnya dua kali (misalnya melihat total sebelum selesai) akan merusak data dan memberi hasil berbeda', 'larik tidak bisa diubah di dalam fungsi', 'total harus selalu 0'], 'memanggilnya dua kali (misalnya melihat total sebelum selesai) akan merusak data dan memberi hasil berbeda']], done: next });
      else if (r === 4) { wrap.append(view(kerangka().slice(0, 10), { hl: [1, 5, 7, 8] })); rowsChoose(wrap, ctx, { prompt: 'Lengkapi fungsi PESAN', rows: ['P2', 'P6', 'P8', 'P9'].map((k) => [k, k, [...BLANKS[k]].sort(), BLANKS[k][0]]), done: next }); }
      else if (r === 5) ask('Fungsi BATAL: urutan baris B6 dan B7 yang benar', [['B6 stok[nomor] ← stok[nomor] + pesanan[nomor], lalu B7 pesanan[nomor] ← 0', true], ['B6 pesanan[nomor] ← 0, lalu B7 stok[nomor] ← stok[nomor] + pesanan[nomor]'], ['Urutannya tidak penting']], 1, view(kerangka().slice(10, 18)), then(() => { wrap.append(view(kerangka().slice(18), { hl: [3, 4] })); rowsChoose(wrap, ctx, { prompt: 'Lengkapi fungsi HITUNG_TOTAL', rows: ['H4', 'H5'].map((k) => [k, k, [...BLANKS[k]].sort(), BLANKS[k][0]]), info: 'Stok harus dikembalikan sebelum pesanan dikosongkan.', done: next }); }));
      else if (r === 6) { const run = kiosk(BENAR); const struk = run.out.slice(run.out.findIndex((t) => /×/.test(t)));
        ask('Pembeli mengetik 2, 1, 1, lalu 2, 4, 2, lalu 2, 5, 2, lalu 4. Struk baris U14–U17:', [[struk.join(' / '), true], ['Nasi goreng 1 × 8000 = 8000 / Gado-gado 2 × 6000 = 12000 / Es teh 2 × 2000 = 4000 / Total bayar: 24000'], ['Nasi goreng 1 × 8000 = 8000 / Mi ayam 4 × 7000 = 28000 / Total bayar: 34000'], ['Nasi goreng 1 × 8000 = 8000 / Gado-gado 2 × 6000 = 12000 / Total bayar: 20000']], 1, view(UTAMA),
          then(() => { wrap.append(el('div', { class: 'kn-layar' }, el('small', null, 'Layar komputer kantin'), el('pre', null, run.out.join('\n'))), tables(run.vars)); rowsChoose(wrap, ctx, { prompt: 'Total belanja dan total bayar', rows: [['b', 'Total belanja', ['Rp24.000', 'Rp22.000', 'Rp20.000'], 'Rp24.000'], ['t', 'Total bayar', ['Rp22.000', 'Rp24.000', 'Rp26.000'], rp(Number(run.out.at(-1).split(' ').at(-1))), 'Paling sedikit Rp20.000, jadi mendapat potongan Rp2.000.']], done: next }); })); }
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Kasus uji: hasil yang diharapkan (dari aplikasi yang baru dibuka)', cls: 'kn-isi', rows: CASES.map(([c], i) => { const w = rule(c); const alt = [w, w.replace('BERHASIL', 'Stok tidak cukup, sisa 5'), w.replace(/total (\d+)/, (m, t) => `total ${Number(t) + 2000}`), w.replace(/stok\[(\d)\] = (\d+)/, (m, a, v) => `stok[${a}] = ${STOK[a - 1]}`), w.replace('Nomor menu tidak ada', 'galat: indeks di luar larik'), w.replace('Jumlah minimal 1', 'BERHASIL'), w.replace('Menu ini belum dipesan', 'DIBATALKAN'), w.replace('"Stok tidak cukup, sisa 5"', '"BERHASIL"'), w.replace('"Stok tidak cukup, sisa 5"', '"Stok tidak cukup, sisa 6"')];
        return [`c${i}`, `${i + 1}. ${caseText(c)}`, [...new Set(alt)].slice(0, 4).sort(), w]; }).filter((x) => x[2].length > 1), done: next });
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Jenis kasus uji: biasa, batas, atau tidak sah', cls: 'kn-isi', rows: CASES.map(([c, j], i) => [`j${i}`, `${i + 1}. ${caseText(c)}`, ['biasa', 'batas', 'tidak sah'], j, i === 3 ? 'Jumlah 0 tidak sah, sekaligus batas bawah jumlah.' : i === 4 ? 'Memesan tepat sebanyak stok.' : i === 8 ? 'Total tepat Rp20.000.' : 'Tepat.']), done: next });
      else { wrap.append(view(K, { cls: 'kn-kecil' }), testTable(K, CASES.map(([c]) => c)));
        const LN = ['K1–K4', 'K4', 'K14–K15', 'K21'];
        rowsChoose(wrap, ctx, { prompt: 'Laporan bug program Kenanga', rows: [['1', 'Kasus 2 dan 3 · baris', LN, 'K1–K4', 'Nomor menu tidak diperiksa sehingga K4 membaca stok[7] atau stok[0]. Tambahkan pemeriksaan nomor sebelum K4.'], ['2', 'Kasus 5 · baris', LN, 'K4', '≥ seharusnya >: memesan tepat sebanyak stok diperbolehkan.'], ['3', 'Kasus 7 · baris', LN, 'K14–K15', 'Pesanan dikosongkan lebih dulu sehingga stok ditambah 0. Tukar urutannya.'], ['4', 'Kasus 9 · baris', LN, 'K21', '> seharusnya ≥: total tepat Rp20.000 berhak mendapat potongan.']],
          done: then(() => { const u = exec(BENAR, [['PESAN', 6, 3], ['UBAH', 6, 8]]); const after = u.vars.pesanan[5];
            ask('Kasus 7 menampilkan "DIBATALKAN" tetapi tetap gagal. Mengapa?', [['Pesannya benar, tetapi keadaan datanya salah: stok soto tinggal 8. Kasus uji harus memeriksa data yang berubah, bukan hanya pesan di layar', true], ['Karena "DIBATALKAN" salah eja'], ['Karena BATAL tidak boleh dipanggil sesudah PESAN'], ['Karena kasus 7 termasuk kasus tidak sah']], 1, null,
              then(() => rowsChoose(wrap, ctx, { prompt: 'Tantangan: UBAH(nomor, jumlah_baru) memanggil BATAL lalu PESAN. Pembeli memesan 3 jus jeruk, lalu UBAH(6, 8)', rows: [['k', 'UBAH(6, 8) mengembalikan', ['Stok tidak cukup, sisa 5', 'BERHASIL', 'Stok tidak cukup, sisa 2', 'DIBATALKAN'], u.out[1]], ['p', 'Jus yang tercatat di pesanan sesudahnya', ['0', '3', '8', '5'], String(after), 'Tiga jus yang sudah dipesan ikut hilang. Periksa stok + pesanan dulu sebelum membatalkan.']], done: next }))); }) }); }
    }
    render();
  },
};

// Tap a blank to cycle through its options.
function blankPicker(b, onChange) {
  return el('div', { class: 'kn-isian' }, Object.keys(BLANKS).map((k) => el('div', { class: 'kn-isi-baris' }, el('small', null, k === 'B' ? 'B6–B7' : k), el('div', { class: 'seg' }, [...BLANKS[k]].sort().map((v) => onTap(el('button', { class: `seg-btn ${b[k] === v ? 'on' : ''}`, type: 'button' }, v), () => { b[k] = v; onChange(); }))))));
}
const complete = (b) => Object.keys(BLANKS).every((k) => b[k]);

function createApp(root, ctx) {
  const wrap = el('div', { class: 'act aplikasi-kantin' });
  root.append(wrap);
  const b = {}; let ver = 'kerangka'; let st = fresh(); let nomor = 1; let jumlah = 1; let msg = ''; let struk = null;
  const prog = () => (ver === 'kenanga' ? kenanga() : ver === 'benar' ? BENAR : kerangka(b));
  const act = (steps) => { if (ver === 'kerangka' && !complete(b)) { msg = 'Isi dulu semua baris yang kosong.'; draw(); return; } const r = exec(prog(), steps, st); if (!r.error) st = { ...st, stok: r.vars.stok, pesanan: r.vars.pesanan }; msg = r.text; ctx.sound[r.error ? 'bad' : 'tap'](); struk = steps[0][0] === 'TOTAL' && !r.error ? st.pesanan.map((p, i) => (p ? `${NAMA[i]} ${p} × ${HARGA[i]} = ${p * HARGA[i]}` : null)).filter(Boolean).concat(`Total bayar: ${r.out[0]}`) : null; draw(); };
  function draw() {
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Kerangka fungsi dan aplikasi'),
      el('div', { class: 'seg' }, [['kerangka', 'kerangka kelompokku'], ['kenanga', 'program Kenanga'], ['benar', 'kunci']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; st = fresh(); msg = ''; struk = null; draw(); }))),
      el('div', { class: 'kn-dua' },
        el('div', { class: 'kn-kiri' }, ver === 'kerangka' ? blankPicker(b, draw) : null, view(prog(), { cls: 'kn-kecil' })),
        el('div', { class: 'kn-kanan' }, el('div', { class: 'kn-layar' }, el('small', null, 'Komputer kantin: 1 Lihat menu, 2 Pesan, 3 Batal, 4 Selesai'),
          el('div', { class: 'kn-atur' }, stepper(nomor, (v) => { nomor = v; }, { min: 0, max: 7, label: 'nomor menu' }), stepper(jumlah, (v) => { jumlah = v; }, { min: -1, max: 9, label: 'jumlah' })),
          el('div', { class: 'kn-atur' }, button('2 Pesan', () => act([['PESAN', nomor, jumlah]]), 'primary'), button('3 Batal', () => act([['BATAL', nomor]])), button('4 Selesai', () => act([['TOTAL']])), button('↺ Aplikasi baru', () => { st = fresh(); msg = ''; struk = null; draw(); })),
          msg ? el('pre', { class: 'kn-pesan' }, msg) : null, struk ? el('pre', { class: 'kn-struk' }, struk.join('\n')) : null), tables(st)))].filter(Boolean));
  }
  draw();
}

const FIXES = { K2: ['nomor'], K3: ['nomor'], K4: ['nomor', 'k4'], K14: ['batal'], K15: ['batal'], K21: ['k21'] };
const FIXTEXT = { nomor: 'tambahkan JIKA nomor < 1 ATAU nomor > 6 MAKA KEMBALIKAN "Nomor menu tidak ada" sebelum K4', k4: 'K4: ganti ≥ menjadi >', batal: 'tukar urutan K14 dan K15', k21: 'K21: ganti > menjadi ≥' };
function createTester(root, ctx) {
  const wrap = el('div', { class: 'act aplikasi-kantin' });
  root.append(wrap);
  let ver = 'kenanga'; const fix = {}; const extra = []; let shown = false; let mark = null; let draft = [['PESAN', 1, 1]]; let msg = '';
  const prog = () => (ver === 'kenanga' ? kenanga(fix) : BENAR);
  const stepEditor = () => el('div', { class: 'kn-kasus' }, draft.map((s, i) => el('div', { class: 'kn-atur' }, el('div', { class: 'seg' }, ['PESAN', 'BATAL', 'TOTAL', 'STOK'].map((f) => onTap(el('button', { class: `seg-btn ${s[0] === f ? 'on' : ''}`, type: 'button' }, f === 'TOTAL' ? 'HITUNG_TOTAL' : f === 'STOK' ? 'lihat stok' : f), () => { draft[i] = f === 'TOTAL' ? ['TOTAL'] : f === 'PESAN' ? ['PESAN', s[1] ?? 1, s[2] ?? 1] : [f, s[1] ?? 1]; draw(); }))),
    s.length > 1 ? stepper(s[1], (v) => { s[1] = v; }, { min: 0, max: 7, label: 'nomor' }) : null, s.length > 2 ? stepper(s[2], (v) => { s[2] = v; }, { min: -1, max: 41, label: 'jumlah' }) : null)),
  el('div', { class: 'kn-atur' }, draft.length < 4 ? button('+ langkah', () => { draft.push(['TOTAL']); draw(); }) : null, draft.length > 1 ? button('− langkah', () => { draft.pop(); draw(); }) : null, extra.length < 4 ? button('Simpan sebagai kasus baru', () => { extra.push(draft.map((s) => [...s])); draft = [['PESAN', 1, 1]]; msg = `Kasus ${10 + extra.length} disimpan.`; draw(); }, 'primary') : null));
  const onLine = (i) => { if (ver !== 'kenanga') return; const l = kenanga(fix)[i][0]; mark = l; const fx = (FIXES[l] || []).filter((f) => !fix[f]); msg = fx.length ? '' : FIXES[l] ? 'Baris ini sudah diperbaiki.' : `Baris ${l} sudah sesuai kebutuhan Bu Sari.`; draw(); };
  function draw() {
    const P = prog(); const fx = mark && ver === 'kenanga' ? (FIXES[mark] || []).filter((f) => !fix[f]) : [];
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Penguji'),
      el('div', { class: 'seg' }, [['kenanga', 'program Kenanga'], ['benar', 'program kunci']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; mark = null; draw(); }))),
      el('div', { class: 'kn-dua' },
        el('div', { class: 'kn-kiri' }, ver === 'kenanga' ? el('small', { class: 'kn-ket' }, 'Ketuk baris yang dicurigai untuk memperbaikinya.') : null, view(P, { cls: 'kn-kecil', onLine, warn: mark ? P.map(([l], i) => (l === mark ? i : -1)).filter((i) => i >= 0) : [] }),
          fx.length ? el('div', { class: 'kn-perbaiki' }, fx.map((f) => button(`🔧 ${FIXTEXT[f]}`, () => { fix[f] = true; mark = null; msg = 'Diperbaiki. Tekan Uji semua lagi.'; draw(); })), button('Batal', () => { mark = null; draw(); })) : null,
          ver === 'kenanga' ? button('↺ Muat ulang program Kenanga', () => { Object.keys(fix).forEach((k) => delete fix[k]); mark = null; draw(); }) : null),
        el('div', { class: 'kn-kanan' }, el('div', { class: 'kn-atur' }, button('▶ Uji semua', () => { shown = true; ctx.sound.tap(); draw(); }, 'primary')), msg ? el('p', { class: 'reveal info' }, msg) : null,
          shown ? testTable(P, [...CASES.map(([c]) => c), ...extra]) : el('ol', { class: 'kn-daftar' }, [...CASES.map(([c]) => c), ...extra].map((c) => el('li', null, caseText(c)))),
          el('small', { class: 'kn-ket' }, 'Kasus tambahan (11, 12, …):'), stepEditor()))].filter(Boolean));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act aplikasi-kantin' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let turn = 0;
    function step() {
      if (turn >= nT) { finishBoard(wrap, ctx, { title: 'Buat dan uji selesai', pts, again: () => pickTeams(wrap, 'Buat dan Uji', start) }); return; }
      const maker = turn; const tester = (turn + 1) % nT; const b = {};
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1} menyusun program. Tim lain jangan melihat dulu!`);
      const body = el('div');
      const build = () => body.replaceChildren(blankPicker(b, build), complete(b) ? button('Program siap', test, 'primary') : el('small', { class: 'kn-ket' }, 'Pilih isi setiap baris.'));
      function test() {
        const P = kerangka(b); const pick = new Set();
        say(msg, '', `Tim ${tester + 1}: pilih paling banyak 4 kasus uji untuk program Tim ${maker + 1}.`);
        const draw = () => body.replaceChildren(el('div', { class: 'kn-pilih-kasus' }, CASES.map(([c], i) => onTap(el('button', { class: `seg-btn ${pick.has(i) ? 'on' : ''}`, type: 'button' }, `${i + 1}. ${caseText(c)}`), () => { if (pick.has(i)) pick.delete(i); else if (pick.size < 4) pick.add(i); draw(); }))), pick.size ? button('Jalankan kasus', run, 'primary') : null);
        draw();
        function run() {
          const chosen = [...pick].sort((x, y) => x - y).map((i) => CASES[i][0]); const v = chosen.map((c) => verdict(P, c)); const fail = v.filter((x) => !x.pass).length; const pass = v.length - fail;
          pts[tester] += fail; pts[maker] += pass; ctx.sound[fail ? 'bad' : 'good']();
          const wrong = Object.keys(BLANKS).filter((k) => b[k] !== RIGHT[k]);
          body.replaceChildren(view(P, { cls: 'kn-kecil', warn: P.map(([l], i) => (wrong.some((k) => l === k || (k === 'B' && (l === 'B6' || l === 'B7'))) ? i : -1)).filter((i) => i >= 0) }), testTable(P, chosen));
          say(msg, fail ? 'bad' : '', `${pass} lulus, ${fail} gagal. Tim ${tester + 1} +${fail}, Tim ${maker + 1} +${pass}. ${wrong.length ? `Baris yang berbeda dari kunci: ${wrong.map((k) => (k === 'B' ? 'B6–B7' : k)).join(', ')}.` : 'Program sama dengan kunci.'}`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); turn++; setTimeout(step, 9000);
        }
      }
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Putaran ${turn + 1}: Tim ${maker + 1} membuat, Tim ${tester + 1} menguji`), msg, body);
      build();
    }
    step();
  }
  pickTeams(wrap, 'Buat dan Uji', start);
}
