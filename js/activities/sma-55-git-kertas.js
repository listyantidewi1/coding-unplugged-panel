// Kerja Tim dengan Git di Atas Kertas — SMA/SMK (16–18 tahun), coding. Commits
// as full snapshots with parents, author and message; branches as labels that
// move; three-way merge from the common ancestor (line-based diff3 whose output,
// conflict markers included, matches git merge for every merge shown here);
// resolving a conflict by both people's intent; finding the commit that
// introduced a bug by running each version of the quiz in mini-py; revert
// without rewriting history; and binary search over commits (git bisect).

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode } from './smp-kit.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy } from './mini-py.js';

// ---- the quiz history from the worksheet ----
const C1 = ['print("Kuis Klub Informatika")', 'skor = 0', 'jawab = input("Hasil 7 x 8? ")', 'if jawab == "56":', '    skor = skor + 10', 'jawab = input("Planet terbesar? ")', 'if jawab == "Jupiter":', '    skor = skor + 10', 'print("Skor kamu:", skor)'];
const SOAL3 = ['jawab = input("Rumus kimia air? ")', 'if jawab == "H2O":', '    skor = skor + 10'];
const C2 = [...C1.slice(0, 8), ...SOAL3, 'print("Skor kamu:", skor, "dari 30")'];
const C3 = C1.map((x, i) => (i === 5 ? 'jawab = input("Planet terbesar? ").strip().lower()' : x));
const C4 = C3.map((x, i) => (i === 8 ? 'print("Skor akhir:", skor, "dari 20")' : x));
const C6 = C2.map((x, i) => (i === 5 ? C3[5] : i === 11 ? 'print("Skor akhir:", skor, "dari 30")' : x));
const C7 = C6.map((x, i) => (i === 5 ? C1[5] : x));
export const COMMIT = {
  c1: { induk: [], penulis: 'Sari', pesan: 'Kuis dua soal', isi: C1 },
  c2: { induk: ['c1'], penulis: 'Dodi', pesan: 'Tambah soal ketiga', isi: C2 },
  c3: { induk: ['c1'], penulis: 'Rina', pesan: 'Jawaban planet tidak peka huruf besar', isi: C3 },
  c4: { induk: ['c3'], penulis: 'Rina', pesan: 'Ubah tulisan skor akhir', isi: C4 },
  c5: { induk: ['c1', 'c2'], penulis: 'Sari', pesan: 'Gabung cabang soal-tiga', isi: [...C2] },
  c6: { induk: ['c5', 'c4'], penulis: 'Sari', pesan: 'Gabung cabang jawaban-rapi', isi: C6 },
  c7: { induk: ['c6'], penulis: 'Sari', pesan: 'Revert "Jawaban planet tidak peka huruf besar"', isi: C7 },
};
const ID = Object.keys(COMMIT);
export const JAWAB = ['56', 'Jupiter', 'H2O'];

// ---- line diff and three-way merge ----
// Longest common subsequence of lines: pairs [i, j] with a[i] === b[j].
export function cocok(a, b) {
  const n = a.length; const m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0; let j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { out.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return out;
}
// diff3: lines kept by both sides are sync points; between them take the side that changed, or report a conflict.
export function gabung3(base, kita, mereka, { namaKita = 'HEAD', namaMereka = 'cabang' } = {}) {
  const ma = new Map(cocok(base, kita)); const mb = new Map(cocok(base, mereka));
  const hasil = []; const konflik = [];
  let i0 = 0; let a0 = 0; let b0 = 0;
  const sama = (x, y) => x.length === y.length && x.every((v, k) => v === y[k]);
  const flush = (i1, a1, b1) => {
    const O = base.slice(i0, i1); const A = kita.slice(a0, a1); const B = mereka.slice(b0, b1);
    if (sama(A, O)) hasil.push(...B); else if (sama(B, O) || sama(A, B)) hasil.push(...A);
    else { konflik.push({ base: O, kita: A, mereka: B, mulai: hasil.length }); hasil.push(`<<<<<<< ${namaKita}`, ...A, '=======', ...B, `>>>>>>> ${namaMereka}`); }
  };
  for (let i = 0; i < base.length; i++) {
    if (!(ma.has(i) && mb.has(i))) continue;
    const a = ma.get(i); const b = mb.get(i);
    if (i > i0 || a > a0 || b > b0) flush(i, a, b);
    hasil.push(base[i]); i0 = i + 1; a0 = a + 1; b0 = b + 1;
  }
  if (i0 < base.length || a0 < kita.length || b0 < mereka.length) flush(base.length, kita.length, mereka.length);
  return { hasil, konflik };
}
// Unified view of a change: [' ' | '+' | '-', line].
export function beda(lama, baru) {
  const M = cocok(lama, baru); const out = []; let i = 0; let j = 0;
  for (const [a, b] of [...M, [lama.length, baru.length]]) { while (i < a) out.push(['-', lama[i++]]); while (j < b) out.push(['+', baru[j++]]); if (a < lama.length) { out.push([' ', lama[a]]); i = a + 1; j = b + 1; } }
  return out;
}
const PENANDA = /^(<<<<<<<|=======|>>>>>>>)/;
export const M5 = gabung3(C1, C1, C2, { namaMereka: 'soal-tiga' });
export const M6 = gabung3(C1, COMMIT.c5.isi, C4, { namaMereka: 'jawaban-rapi' });

// Run a quiz version; the screen shows the last line, as the worksheet table does.
export function jalankan(isi, jawab = JAWAB) {
  const R = runPy(isi, { input: [...jawab], limit: 5000 });
  return R.error ? `${R.error.type}: ${R.error.message}` : R.out.at(-1) ?? '';
}
export const keluaran = (id) => jalankan(COMMIT[id].isi);

// ---- team features, all branched from c5 ----
const FITUR = {
  1: { nama: 'Tambah soal keempat', isi: [...C2.slice(0, 11), 'jawab = input("Hasil 12 x 12? ")', 'if jawab == "144":', '    skor = skor + 10', 'print("Skor kamu:", skor, "dari 40")'] },
  2: { nama: 'Tampilkan "Hebat, semua benar!"', isi: [...C2, 'if skor == 30:', '    print("Hebat, semua benar!")'] },
  3: { nama: 'Judul dengan nama klub', isi: C2.map((x, i) => (i === 0 ? 'print("Kuis Klub Informatika SMA Negeri 1 Wanasari")' : x)) },
};
// The file the team intends when a set of features is in main.
export function harapan(set) {
  let f = [...C2];
  if (set.has(3)) f[0] = FITUR[3].isi[0];
  if (set.has(1)) f = [...f.slice(0, 11), ...FITUR[1].isi.slice(11)];
  if (set.has(2)) f.push(`if skor == ${set.has(1) ? 40 : 30}:`, '    print("Hebat, semua benar!")');
  return f;
}
const JAWAB4 = ['56', 'Jupiter', 'H2O', '144'];
const keluaranPenuh = (isi) => { const R = runPy(isi, { input: [...JAWAB4], limit: 5000 }); return R.error ? [`${R.error.type}: ${R.error.message}`] : R.out; };
export const lolosUji = (isi, set) => !isi.some((x) => PENANDA.test(x)) && keluaranPenuh(isi).join('\n') === keluaranPenuh(harapan(set)).join('\n');

// Binary search over a linear history: tests needed in the worst case.
export const ujiBagiDua = (n) => Math.ceil(Math.log2(n));

const lab = (n, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));

// ---------- Penjaga Riwayat: the hands-on missions ----------
const PENIMPA = '🧨 Si Penimpa'; const BUG55 = '🐛 Si Bug Penyusup';
const HEAD55 = {
  commit: ['Kartu Commit', 'Susun isi c2 buatan Dodi, lalu lengkapi kartunya.', PENIMPA, 'Untuk apa mencatat induk? Timpa saja!'],
  pesan: ['Pesan Commit', 'Urutkan pesan commit dari yang paling jelas sampai yang paling buruk.', PENIMPA, '"asdfgh" juga pesan, kan?'],
  label: ['Tempel Label Cabang', 'Tempel tiga label pada commit yang tepat, lalu buat c4.', PENIMPA, 'Pindahkan semua label sekaligus!'],
  gabung: ['Gabung Tanpa Bentrok', 'Cari leluhur bersama, gabungkan soal-tiga ke main, buat c5.', PENIMPA, 'Pilih saja yang lebih panjang.'],
  konflik: ['Anatomi Konflik', 'Bandingkan tiga kolom, lalu baca penanda konfliknya.', PENIMPA, 'Konflik? Hapus saja salah satu!'],
  selesai: ['Kalahkan Si Penimpa', 'Susun bagian akhir c6 yang menjaga maksud Dodi dan Rina.', PENIMPA, 'Pakai versi jawaban-rapi saja, cepat!'],
  buru: ['Buru Si Bug Penyusup', 'Uji commit dengan jawaban 56, Jupiter, H2O. Temukan tempat bug masuk.', BUG55, 'Aku masuk lewat satu commit kecil.'],
  revert: ['Revert atau Perbaiki Maju', 'Batalkan c3 dengan revert, lalu coba perbaikan maju.', BUG55, 'Hapus saja riwayatnya!'],
  tim: ['Tim dan Cabang', 'Gabungkan tiga cabang fitur ke main. Selesaikan konflik yang muncul.', PENIMPA, 'Cabang terakhir menimpa semuanya!'],
  bos: ['Pencarian Kilat', 'Temukan commit pertama yang rusak dari 16 commit dengan paling banyak 4 uji.', BUG55, '16 commit? Kau harus menguji semuanya!'],
};
const msg55 = (t) => el('p', { class: 'reveal info' }, t);
const dua55 = (...k) => el('div', { class: 'pr55-dua' }, ...k);
const kol55 = (...k) => el('div', { class: 'pr55-kolom' }, ...k);
const ind = (x) => x.replace(/^ {4}/, '  ');
const LABEL0 = { main: 'c1', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' };
const kartuMeta = (c, extra = null) => el('div', { class: 'pr55-kartu', 'data-c': c }, el('b', null, `📇 ${c}`), el('small', null, `induk: ${COMMIT[c].induk.join(' dan ') || 'tidak ada'} · ${COMMIT[c].penulis}`), el('span', null, `"${COMMIT[c].pesan}"`), extra);
// Small code window with real line numbers.
const potong = (isi, dari, sampai, o = {}) => codeView(isi.slice(dari - 1, sampai).map(ind), { labels: lab(sampai - dari + 1, dari), ...o });

// Misi 1: build c2 from line cards, then fill its card.
function commitRound(area, ctx, { oops, done }) {
  const msg = msg55('Dodi membuat c2 di cabang soal-tiga. Baris 1–8 sama dengan c1. Susun baris 9–12.');
  const kiri = kol55(kartuMeta('c1', potong(C1, 6, 9))); const kanan = kol55();
  fill(kanan, tileSlots(ctx, { oops, msg, build: ['# c2 · baris 1–8 sama dengan c1', ['a', 0], ['b', 0], ['c', 1], ['d', 0]],
    tiles: [['a', SOAL3[0]], ['b', SOAL3[1]], ['c', ind(SOAL3[2]).trim()], ['d', C2[11]], ['x', C1[8], 'Kini ada tiga soal, jadi skornya dari 30.']],
    order: 'Soal ketiga dulu: tanya, periksa, tambah skor. Tulisan skor paling akhir.', onFull: () => {
      say(msg, 'info', 'Isi c2 tersusun. Sekarang lengkapi kartu commitnya.');
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['📇 c2 · induk ', '_'], ['penulis ', '_', ' · ', '_', ' baris']]), chips: ['c1', 'c3', 'Dodi', 'Sari', '12', '9'], want: ['c1', 'Dodi', '12'],
        hints: ['c2 dibuat dari c1. Induk menunjuk ke commit sebelumnya.', 'Dodi yang menambah soal ketiga.', '8 baris dari c1 ditambah 4 baris baru.'],
        done: () => { say(msg, '', 'Commit menyimpan seluruh isi berkas, penulis, pesan, dan induk. Dengan induk, riwayat bisa ditelusuri ke belakang dan perubahan bisa dihitung.'); done(); } }));
    } }));
  area.append(dua55(kiri, kanan), msg);
}

// Misi 1b: rank the commit messages.
function pesanRound(area, ctx, { oops, done }) {
  const P = ['Tambah soal ketiga tentang rumus kimia air', 'perbaikan', 'update', 'asdfgh'];
  const msg = msg55('Tiga bulan lagi, pesan mana yang menolong orang membaca riwayat? Urutkan dari paling jelas.');
  const log = codeView(['$ git log --oneline', 'c2 ???', 'c1 Kuis dua soal']);
  area.append(dua55(kol55(kartuMeta('c2'), log), kol55(fillBoard(ctx, { oops, msg, view: rowsView([['1 paling jelas: ', '_'], ['2: ', '_'], ['3: ', '_'], ['4 paling buruk: ', '_']]), chips: P, want: P,
    hints: ['Pesan terbaik menyebut apa yang berubah.', '"perbaikan" masih memberi arah: ada yang diperbaiki.', '"update" hampir tidak memberi tahu apa pun.', '"asdfgh" tidak bermakna sama sekali.'],
    done: () => { say(msg, '', 'Pesan yang baik singkat, menyebut apa yang berubah, dan bila perlu mengapa. Si Penimpa senang dengan riwayat yang tidak bisa dibaca.'); done(); } }))), msg);
}

// Misi 2: place the branch labels by tapping a label, then a commit; then make c4.
function labelRound(area, ctx, { oops, done }) {
  const msg = msg55('Dodi membuat c2 di soal-tiga, Rina membuat c3 di jawaban-rapi. main belum berubah. Ketuk label, lalu ketuk commitnya.');
  const want = { main: 'c1', 'soal-tiga': 'c2', 'jawaban-rapi': 'c3' }; const pasang = {}; let pilih = null; let tahap = 1;
  const graf = el('div', { class: 'pr55-graf' }); const baki = el('div', { class: 'pr55-baki' });
  const draw = () => {
    fill(graf, grafSvg(tahap === 1 ? 3 : 4, { label: pasang, onPilih: tahap === 1 ? tempel : null, onLabel: tahap === 2 ? geser : null }));
    fill(baki, Object.keys(want).filter((l) => !(l in pasang)).map((l) => onTap(el('button', { class: `pr55-label ${l === 'main' ? 'utama' : ''} ${pilih === l ? 'on' : ''}`, type: 'button', 'data-l': l }, `🏷️ ${l}`), () => { pilih = l; ctx.sound.tap(); draw(); })));
  };
  function tempel(c) {
    if (!pilih) { say(msg, 'info', 'Ketuk label dulu, lalu commitnya.'); return; }
    if (want[pilih] !== c) { oops(); say(msg, 'bad', pilih === 'main' ? 'main tidak ikut berpindah saat orang lain membuat commit di cabangnya.' : `Label cabang menempel pada commit terbaru di cabang itu.`); return; }
    pasang[pilih] = c; pilih = null; ctx.sound.tap();
    if (Object.keys(pasang).length < 3) { draw(); say(msg, 'info', 'Tepat. Tempel label berikutnya.'); return; }
    tahap = 2; draw(); say(msg, 'info', 'Rina membuat c4 di cabang jawaban-rapi. Ketuk label yang ikut berpindah ke c4.');
  }
  function geser(l) {
    if (tahap !== 2) return;
    if (l !== 'jawaban-rapi') { oops(); say(msg, 'bad', `Label ${l} tidak berpindah: commit baru hanya menggeser label cabang tempat commit itu dibuat.`); return; }
    tahap = 3; pasang['jawaban-rapi'] = 'c4'; ctx.sound.tap(); draw();
    say(msg, '', 'Hanya jawaban-rapi yang berpindah ke c4. main tetap di c1, jadi kelas lain aman memakai main selama fitur baru belum diuji.'); done();
  }
  draw();
  area.append(graf, baki, msg);
}

// Misi 3: a clean merge. Ancestor, the three columns, then c5's parents.
function gabungRound(area, ctx, { oops, done }) {
  const msg = msg55('Sari ingin menggabungkan soal-tiga ke main. Ketuk leluhur bersama keduanya di graf.');
  const graf = el('div', { class: 'pr55-graf' }); const kanan = kol55();
  const drawGraf = (n, label, onPilih = null) => fill(graf, grafSvg(n, { label, onPilih }));
  drawGraf(4, LABEL0, (c) => {
    if (kanan.childElementCount) return;
    if (c !== 'c1') { oops(); say(msg, 'bad', 'Leluhur bersama adalah commit terakhir yang dimiliki kedua cabang. Telusuri panah induk dari c1 (main) dan c2 (soal-tiga).'); return; }
    ctx.sound.tap(); say(msg, 'info', 'c1. Bandingkan bagian akhir: leluhur, main, dan soal-tiga.');
    fill(kanan, el('div', { class: 'pr55-tiga' }, kol55(el('small', null, 'leluhur c1'), potong(C1, 9, 9)), kol55(el('small', null, 'main (c1)'), potong(C1, 9, 9)), kol55(el('small', null, 'soal-tiga (c2)'), potong(C2, 9, 12, { hl: [0, 1, 2, 3] }))),
      fillBoard(ctx, { oops, msg, view: rowsView([['bagian akhir → ambil dari ', '_']]), chips: ['soal-tiga', 'main', 'konflik!'], want: ['soal-tiga'], hints: ['main sama dengan leluhur. Hanya soal-tiga yang berubah, jadi perubahannya diambil.'], done: induk }));
  });
  function induk() {
    say(msg, 'info', 'Isi c5 sama dengan c2. Sekarang lengkapi kartu c5.');
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['📇 c5 · induk ', '_', ' dan ', '_']]), chips: ['c1', 'c2', 'c3', 'c4'], want: ['c1', 'c2'], hints: ['Induk pertama: commit tempat main berada.', 'Induk kedua: ujung cabang yang digabungkan.'],
      done: () => { drawGraf(5, { ...LABEL0, main: 'c5' }); say(msg, '', 'c5 punya dua induk, c1 dan c2, dan label main pindah ke c5. Tidak ada bentrok karena hanya satu pihak yang berubah.'); done(); } }));
  }
  area.append(dua55(graf, kanan), msg);
}

// Misi 4a: three columns for jawaban-rapi into main, then read the conflict markers.
function konflikRound(area, ctx, { oops, done }) {
  const msg = msg55('Sari menggabungkan jawaban-rapi ke main (c5). Leluhur bersama c1. Bandingkan baris 6 dan bagian akhir.');
  const C5 = COMMIT.c5.isi; const kiri = kol55(); const kanan = kol55();
  fill(kiri, el('div', { class: 'pr55-tiga' }, kol55(el('small', null, 'leluhur c1'), potong(C1, 6, 9)), kol55(el('small', null, 'main (c5)'), potong(C5, 6, 12, { hl: [3, 4, 5, 6] })), kol55(el('small', null, 'jawaban-rapi (c4)'), potong(C4, 6, 9, { hl: [0, 3] }))));
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['baris 6 → ', '_'], ['bagian akhir → ', '_']]), chips: ['ambil jawaban-rapi', 'ambil main', 'konflik!'], want: ['ambil jawaban-rapi', 'konflik!'],
    hints: ['Di baris 6 hanya Rina yang berubah dari leluhur, jadi otomatis.', 'Bagian akhir diubah oleh kedua pihak dengan cara berbeda.'], done: tanda }));
  function tanda() {
    say(msg, 'info', 'Git menulis kedua versi di antara penanda konflik. Dari mana asal setiap bagian?');
    fill(kiri, codeView(M6.hasil.slice(8).map(ind), { labels: lab(8, 9), warn: [0, 5, 7] }));
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['baris 10–13 → ', '_'], ['baris 15 → ', '_']]), chips: ['main (Dodi)', 'jawaban-rapi (Rina)', 'leluhur c1'], want: ['main (Dodi)', 'jawaban-rapi (Rina)'],
      hints: ['HEAD adalah cabang tempat kita berada: main.', 'Setelah ======= datang cabang yang digabungkan.'], done: () => { say(msg, '', 'Konflik bukan kesalahan Git: dua orang mengubah bagian yang sama, dan manusia yang harus memutuskan maksudnya.'); done(); } }));
  }
  area.append(dua55(kiri, kanan), msg);
}

// Misi 4b: resolve the conflict by both people's intent, and see what Si Penimpa's shortcut loses.
function selesaiRound(area, ctx, { oops, done }) {
  const msg = msg55('Susun bagian akhir c6: soal ketiga dari Dodi tetap ada, tulisan "Skor akhir" dari Rina dipakai.');
  const kiri = kol55(codeView(M6.hasil.slice(8).map(ind), { labels: lab(8, 9), warn: [0, 5, 7] })); const kanan = kol55();
  const BENAR = 'print("Skor akhir:", skor, "dari 30")';
  fill(kanan, tileSlots(ctx, { oops, msg, build: ['# baris 1–8 tergabung otomatis', ['a', 0], ['b', 0], ['c', 1], ['d', 0]],
    tiles: [['a', SOAL3[0]], ['b', SOAL3[1]], ['c', SOAL3[2].trim()], ['d', BENAR], ['x', C2[11], 'Rina mengganti tulisan menjadi "Skor akhir".'], ['y', C4[8], 'Kini ada tiga soal, jadi skornya dari 30.'], ['z', '<<<<<<< HEAD', 'Semua penanda konflik harus dihapus.']],
    order: 'Soal ketiga dulu, tulisan skor paling akhir.', onFull: () => {
      say(msg, 'info', 'Bandingkan dengan usul Rudi: pakai versi jawaban-rapi saja.');
      const rudi = [...M6.hasil.slice(0, 8), C4[8]]; const sari = [...M6.hasil.slice(0, 8), ...SOAL3, BENAR];
      const a = layar(); const b = layar();
      fill(kiri, kol55(el('small', null, '🧨 versi Rudi'), a), kol55(el('small', null, '✅ penyelesaianmu'), b));
      play(a, ['Hasil 7 x 8? 56', 'Planet terbesar? Jupiter', jalankan(rudi)], { gap: 380 });
      play(b, ['Hasil 7 x 8? 56', 'Planet terbesar? Jupiter', 'Rumus kimia air? H2O', jalankan(sari)], { gap: 380, end: () => { say(msg, '', 'Versi Rudi diam-diam menghapus soal ketiga Dodi: itulah ulah Si Penimpa. Penyelesaianmu tidak sama dengan versi mana pun, karena memadukan maksud keduanya. Tetapi skornya 20, bukan 30…'); done(); } });
    } }));
  area.append(dua55(kiri, kanan), msg);
}

// Misi 5: test commits on the graph, then accuse the commit that let the bug in.
const lolos55 = (id) => Number((keluaran(id).match(/: (\d+)/) || [])[1]) === 10 * COMMIT[id].isi.filter((l) => l.startsWith('if jawab')).length;
function buruRound(area, ctx, { oops, done }) {
  const msg = msg55('Pak Guru menjawab 56, Jupiter, H2O di c6 dan mendapat 20. Ketuk commit di graf untuk mengujinya.');
  const uji = new Set(); const graf = el('div', { class: 'pr55-graf' }); const hasil = el('div', { class: 'pr55-hasil-uji' }); const tuduh = el('div', { class: 'pr55-baki' }); const kanan = kol55(hasil, tuduh); let tertangkap = false;
  const LBL = { main: 'c6', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' };
  const draw = () => {
    fill(graf, grafSvg(6, { label: LBL, onPilih: (c) => { if (tertangkap) return; uji.add(c); ctx.sound.tap(); draw(); } }));
    fill(hasil, ID.slice(0, 6).filter((c) => uji.has(c)).map((c) => el('div', { class: `pr55-uji ${lolos55(c) ? 'lolos' : 'gagal'}`, 'data-c': c }, el('b', null, c), el('code', null, keluaran(c)), el('span', null, lolos55(c) ? '✓' : '✗'))));
    fill(tuduh, el('small', null, '🐛 bug masuk di:'), ID.slice(0, 6).map((c) => onTap(el('button', { class: 'pr55-tuduh', type: 'button', 'data-c': c }, c), () => tunjuk(c))));
  };
  function tunjuk(c) {
    if (tertangkap) return;
    if (!uji.has(c) || COMMIT[c].induk.some((p) => !uji.has(p))) { say(msg, 'info', `Uji dulu ${c} dan induknya, supaya buktinya lengkap.`); return; }
    if (c !== 'c3') { oops(); say(msg, 'bad', lolos55(c) ? `${c} lolos uji, jadi bug belum ada di sana.` : `${c} memang gagal, tetapi induknya juga gagal. Bug masuk lebih awal.`); return; }
    tertangkap = true; ctx.sound.good(); draw();
    say(msg, 'info', 'c3 gagal, padahal induknya c1 lolos. Apa yang dilakukan c3?');
    fill(kanan, codeView([C3[5].replace('").strip', '")\n  .strip'), C3[6]].join('\n').split('\n'), { labels: ['6', '', '7'], warn: [0, 1, 2] }),
      fillBoard(ctx, { oops, msg, view: rowsView([['baris 6 mengubah jawaban menjadi ', '_'], ['baris 7 membandingkan dengan ', '_']]), chips: ['huruf kecil', 'huruf besar', '"Jupiter"', '"jupiter"'], want: ['huruf kecil', '"Jupiter"'],
        hints: ['.lower() membuat semua huruf kecil.', 'Lihat teks di baris 7.'], done: () => { say(msg, '', 'Si Bug Penyusup masuk lewat c3: "jupiter" tidak pernah sama dengan "Jupiter". Bug ini seharusnya ketahuan saat Rina menguji cabangnya, sebelum digabungkan.'); done(); } }));
  }
  draw();
  area.append(dua55(graf, kanan), msg);
}

// Misi 5b: revert c3, then the forward fix with answer cards.
function revertRound(area, ctx, { oops, done }) {
  const msg = msg55('Revert membuat commit baru yang membalik perubahan c3. Bagaimana baris 6 di c7?');
  const kiri = kol55(el('small', null, 'perubahan c3 (baris 6)'), codeView([C1[5], C3[5]], { labels: ['−', '+'], cls: 'pr55-diff' })); const kanan = kol55();
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['c7 = revert c3 → baris 6:'], ['_']]), chips: [C1[5], C3[5]], want: [C1[5]], hints: ['Revert membalik: baris yang ditambah c3 dibuang, baris lama dikembalikan.'],
    done: () => { const scr = layar(); kanan.append(scr); play(scr, ['>>> kuis c7: 56, Jupiter, H2O', keluaran('c7')], { end: maju }); } }));
  function maju() {
    say(msg, 'info', 'c7 lolos, tetapi fitur Rina ikut hilang. Coba perbaikan maju di c6: ganti baris 7.');
    fill(kiri, el('small', null, 'riwayat: c3 tetap ada, c7 mencatat pembatalannya'), potong(C6, 6, 6));
    fill(kanan, tileSlots(ctx, { oops, msg, build: ['jawab = input("Planet terbesar? ")', '  .strip().lower()', ['f', 0], '  skor = skor + 10'],
      tiles: [['f', 'if jawab == "jupiter":'], ['x', 'if jawab == "Jupiter":', 'Itu baris yang lama: jawaban sudah huruf kecil.'], ['y', 'if jawab == "JUPITER":', 'Setelah .lower() tidak ada huruf besar lagi.']], onFull: kartuJawab }));
  }
  function kartuJawab() {
    const F = C6.map((x, i) => (i === 6 ? 'if jawab == "jupiter":' : x)); const coba = new Set(); const JW = ['Jupiter', 'JUPITER', ' jupiter '];
    say(msg, 'info', 'Ketuk setiap kartu jawaban untuk menguji perbaikanmu.');
    const out = el('div', { class: 'pr55-hasil-uji' });
    const draw = () => fill(out, JW.filter((j) => coba.has(j)).map((j) => el('div', { class: 'pr55-uji lolos' }, el('b', null, `"${j}"`), el('code', null, jalankan(F, ['56', j, 'H2O'])))));
    kanan.append(el('div', { class: 'pr55-baki' }, JW.map((j) => onTap(el('button', { class: 'pr55-jawab', type: 'button', 'data-v': j }, `"${j}"`), () => {
      if (coba.has(j)) return; coba.add(j); ctx.sound.tap(); draw();
      if (coba.size < JW.length) return;
      say(msg, 'info', 'Semua diterima, dan fitur Rina tetap ada. Bolehkah jawaban kimia juga diberi .lower()?');
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['H2O juga diberi .lower()? ', '_']]), chips: ['tidak', 'ya'], want: ['tidak'], hints: ['Rumus kimia peka huruf besar: Co (kobalt) berbeda dengan CO (karbon monoksida).'],
        done: () => { say(msg, '', 'Tepat. Revert membatalkan tanpa menghapus riwayat, perbaikan maju menjaga fiturnya. Rumus kimia peka huruf besar, jadi tidak diberi .lower().'); done(); } }));
    }))), out);
  }
  area.append(dua55(kiri, kanan), msg);
}

// Misi 6: three feature branches from c5, merged one by one; the second of soal-4 / pesan conflicts.
const FITUR55 = { 1: '4️⃣ Soal keempat', 2: '🎉 Pesan skor penuh', 3: '🏫 Judul baru' };
function timRound(area, ctx, { oops, done }) {
  const msg = msg55('Tiga tim membuat cabang dari c5. Ketuk kartu fitur untuk menggabungkannya ke main, satu per satu.');
  const set = new Set(); let main = [...C2]; const kiri = kol55(); const kanan = kol55();
  const drawKiri = () => fill(kiri, el('small', null, `main: ${set.size ? [...set].map((k) => FITUR55[k]).join(' + ') : 'c5'}`), codeView(main.slice(-6).map(ind), { labels: lab(6, main.length - 5) }));
  const kartu = () => fill(kanan, el('div', { class: 'pr55-baki' }, [1, 2, 3].map((k) => onTap(el('button', { class: `pr55-fitur ${set.has(k) ? 'masuk' : ''}`, type: 'button', 'data-k': String(k) }, FITUR55[k], set.has(k) ? ' ✓' : ''), () => gabung(k)))));
  function gabung(k) {
    if (set.has(k) || kanan.querySelector('.mk-susun')) return;
    const r = gabung3(C2, main, FITUR[k].isi); set.add(k); ctx.sound.tap();
    if (!r.konflik.length) { main = r.hasil; drawKiri(); kartu(); say(msg, 'info', `${FITUR55[k]} tergabung otomatis ${lolosUji(main, set) ? 'dan lolos uji' : ''}.`); return cek(); }
    say(msg, 'info', `⚠ ${FITUR55[k]} berkonflik di bagian akhir berkas! Susun akhir berkas yang menjaga kedua fitur.`);
    const K = r.konflik[0];
    fill(kiri, el('small', null, '⚠ konflik di akhir berkas'), el('div', { class: 'pr55-tiga pr55-konflik-tim' }, kol55(el('small', null, '<<<<<<< HEAD (main)'), codeView(K.kita.map(ind), { cls: 'pr55-kita' })), kol55(el('small', null, '>>>>>>> cabang'), codeView(K.mereka.map(ind), { cls: 'pr55-mereka' }))));
    const ekor = harapan(set).slice(11);
    fill(kanan, tileSlots(ctx, { oops, msg, build: ['# baris 1–11 tetap', ...ekor.map((x, i) => [`e${i}`, x.startsWith('    ') ? 1 : 0])],
      tiles: [...ekor.map((x, i) => [`e${i}`, x.trim()]), ['x', 'if skor == 30:', 'Dengan soal keempat, skor penuh menjadi 40.']],
      order: 'Soal keempat dulu, lalu tulisan skor, baru pesan skor penuh.', onFull: () => { main = harapan(set); drawKiri(); kartu(); say(msg, 'info', `Konflik selesai${lolosUji(main, set) ? ' dan lolos uji' : ''}: skor penuh kini 40.`); cek(); } }));
  }
  function cek() { if (set.size === 3 && lolosUji(main, set)) { say(msg, '', 'Ketiga fitur ada di main dan lolos uji. Judul baru tergabung otomatis; soal keempat dan pesan skor penuh bentrok di akhir berkas, dan maksud keduanya digabungkan: if skor == 40.'); done(); } }
  drawKiri(); kartu();
  area.append(dua55(kiri, kanan), msg);
}

// Misi Bos: binary search over 16 commits, then match the Git commands.
function bosRound55(area, ctx, { oops, done }) {
  const N = 16; const bug = 2 + Math.floor(ctx.rand.next() * (N - 1)); const hasil = { 1: true, [N]: false }; let n = 0; let fin = false;
  const msg = msg55(`c1 lolos uji, c${N} gagal. Ketuk commit untuk mengujinya. Paling banyak 4 uji!`);
  const pita = el('div', { class: 'pr55-pita' }); const kanan = kol55(); const hitung = el('p', { class: 'pr55-tally' });
  const batas = () => { const lo = Math.max(...Object.keys(hasil).filter((k) => hasil[k]).map(Number)); const hi = Math.min(...Object.keys(hasil).filter((k) => !hasil[k]).map(Number)); return [lo, hi]; };
  const draw = () => { const [lo, hi] = batas(); hitung.textContent = `🔍 uji: ${n} dari 4 · kemungkinan: c${lo + 1}–c${hi}`;
    fill(pita, Array.from({ length: N }, (_, i) => i + 1).map((k) => onTap(el('button', { class: `pr55-c ${k in hasil ? (hasil[k] ? 'lolos' : 'gagal') : k <= lo || k >= hi ? 'redup' : ''} ${fin && k === hi ? 'bug' : ''}`, type: 'button', 'data-n': String(k) }, `c${k}`, el('small', null, k in hasil ? (hasil[k] ? '✓' : '✗') : '·')), () => tes(k)))); };
  function tes(k) {
    if (fin || k in hasil) return; const [lo, hi] = batas();
    if (k < lo || k > hi) { oops(); say(msg, 'bad', `c${k} sudah pasti ${k < lo ? 'lolos' : 'gagal'}. Uji di antara c${lo} dan c${hi}.`); return; }
    n++; hasil[k] = k < bug; ctx.sound.tap();
    if (n > 4) oops();
    const [a, b] = batas(); draw();
    if (b - a > 1) { say(msg, n > 4 ? 'bad' : 'info', `c${k} ${hasil[k] ? 'lolos' : 'gagal'}. ${n > 4 ? 'Sudah lebih dari 4 uji. ' : ''}Uji di tengah sisa kemungkinan.`); return; }
    fin = true; draw();
    say(msg, 'info', `Commit pertama yang rusak: c${b}, ditemukan dengan ${n} uji. Itulah cara kerja git bisect. Sekarang pasangkan perintah Git.`);
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['simpan commit → ', '_'], ['gabungkan cabang → ', '_'], ['batalkan commit lama → ', '_'], ['cari commit bug → ', '_'], ['100 commit, paling banyak ', '_', ' uji']]),
      chips: ['git commit', 'git merge', 'git revert', 'git bisect', 'git switch', '7', '50'], want: ['git commit', 'git merge', 'git revert', 'git bisect', '7'],
      hints: ['Commit menyimpan potret berkas.', 'Merge menggabungkan cabang.', 'Revert membuat commit pembalik.', 'Bisect membagi dua riwayat.', '2⁷ = 128 ≥ 100: setiap uji membuang separuh kemungkinan.'],
      done: () => { say(msg, '', 'Si Bug Penyusup tertangkap. Membagi dua: 100 commit cukup 7 uji, karena 2⁷ = 128.'); done(); } }));
  }
  draw();
  area.append(dua55(kol55(hitung, pita), kanan), msg);
}

export default {
  id: 'sma-55-git-kertas',
  title: 'Kerja Tim dengan Git di Atas Kertas',
  topic: 'Kendali versi: commit dengan induk dan pesan, graf commit, cabang, penggabungan tiga arah dari leluhur bersama, konflik dan penyelesaiannya, mencari commit yang memunculkan bug, dan revert tanpa menghapus riwayat',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌿',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Tulis commit, gambar graf dan label cabang, gabungkan cabang dari leluhur bersamanya, selesaikan konflik sesuai maksud Dodi dan Rina, lalu temukan commit yang memunculkan bug di kuis.',
  extraModes: [
    { id: 'graf', icon: '🌿', label: 'Graf Commit', desc: 'Putar ulang riwayat kuis commit demi commit; sentuh kartu commit untuk melihat isi, perubahan, dan perbandingan tiga kolom saat penggabungan', create: createGraf },
    { id: 'konflik', icon: '🧩', label: 'Penyelesai Konflik', desc: 'Sunting hasil gabungan yang berkonflik; layar menolak bila penanda konflik masih tertinggal, lalu menjalankan kuisnya', create: createKonflik },
    { id: 'uji', icon: '🧪', label: 'Penguji Versi', desc: 'Jalankan kuis versi mana pun dengan jawabanmu sendiri, dan cari commit pertama yang mengandung bug dari 100 commit dengan membagi dua', create: createUji },
    { id: 'giliran', icon: '🤝', label: 'Cabang Tim', desc: 'Setiap tim memilih fitur di cabangnya sendiri dari c5, lalu cabang digabungkan satu per satu; penggabungan yang lolos uji mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act git-kertas pr55-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pr55-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, siapa, ulah] = HEAD55[k]; foe = el('div', { class: 'pr55-musuh' }, el('b', null, siapa), el('span', null, ulah)); wrap.append(el('div', { class: 'pr55-kepala' }, misiHead(no, judul, tujuan, '🌿'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = foe.firstChild.textContent === PENIMPA ? 'Riwayat aman ✓' : 'Bug tertangkap ✓'; next(ms); } });
      if (r === 0) { go('commit', 1); commitRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('pesan', 1); pesanRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('label', 2); labelRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('gabung', 3); gabungRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('konflik', 4); konflikRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('selesai', 4); selesaiRound(area, ctx, fin(7000)); }
      else if (r === 6) { go('buru', 5); buruRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('revert', 5); revertRound(area, ctx, fin(6500)); }
      else if (r === 8) { go('tim', 6); timRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound55(area, ctx, fin(7000)); }
    }
    render();
  },
};

// ---- views ----
// Commit graph in three lanes; n = commits shown (in order c1..c7).
const POS = { c1: [0, 1], c2: [1, 2], c3: [2, 0], c4: [3, 0], c5: [4, 1], c6: [5, 1], c7: [6, 1] };
const LANE = ['jawaban-rapi', 'main', 'soal-tiga'];
function grafSvg(n, { label = {}, pilih = null, onPilih = null, sembunyiLabel = false, onLabel = null, labelPilih = null } = {}) {
  const ids = ID.slice(0, n); const X = (c) => 50 + POS[c][0] * 110; const Y = (c) => 70 + POS[c][1] * 75;
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.forEach((x) => e.append(x)); return e; };
  const W = 50 + Math.max(...ids.map((c) => POS[c][0])) * 110 + 70;
  const svg = s('svg', { viewBox: `0 0 ${Math.max(W, 300)} 290`, class: 'gk-graf', role: 'img', 'aria-label': 'Graf commit' });
  svg.append(s('defs', {}, s('marker', { id: 'gk-panah', viewBox: '0 0 10 10', refX: '10', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'gk-ujung' }))));
  for (const c of ids) for (const p of COMMIT[c].induk) {
    const x1 = X(p); const y1 = Y(p); const x2 = X(c); const y2 = Y(c); const dx = x2 - x1; const dy = y2 - y1; const L = Math.hypot(dx, dy);
    svg.append(s('line', { x1: x1 + (dx / L) * 22, y1: y1 + (dy / L) * 22, x2: x2 - (dx / L) * 24, y2: y2 - (dy / L) * 24, class: 'gk-garis', 'marker-end': 'url(#gk-panah)' }));
  }
  for (const c of ids) {
    const g = s('g', { class: `gk-simpul ${pilih === c ? 'on' : ''} ${COMMIT[c].induk.length > 1 ? 'gabung' : ''}`, tabindex: '0', 'data-c': c }, s('circle', { cx: X(c), cy: Y(c), r: 20 }), s('text', { x: X(c), y: Y(c) + 6, 'text-anchor': 'middle' }, c));
    if (onPilih) g.addEventListener('click', () => onPilih(c));
    svg.append(g);
  }
  if (!sembunyiLabel) {
    const per = {};
    for (const [nama, c] of Object.entries(label)) { if (!ids.includes(c)) continue; const k = (per[c] = (per[c] || 0) + 1) - 1; const lebar = nama.length * 8.4 + 12; const x = X(c) - lebar / 2; const y = Y(c) + (POS[c][1] === 0 ? -48 - k * 22 : 26 + k * 22);
      const g = s('g', { class: `gk-label ${nama === 'main' ? 'utama' : ''} ${labelPilih === nama ? 'on' : ''}`, 'data-l': nama }, s('rect', { x, y, width: lebar, height: 20, rx: 4 }), s('text', { x: X(c), y: y + 15, 'text-anchor': 'middle' }, nama));
      if (onLabel) g.addEventListener('click', (e) => { e.stopPropagation(); onLabel(nama); });
      svg.append(g); }
  }
  return el('div', { class: 'gk-graf-wadah' }, svg);
}
function kartu(c) {
  const C = COMMIT[c]; const induk = C.induk[0] ? COMMIT[C.induk[0]].isi : [];
  return el('div', { class: 'gk-kartu' },
    el('p', { class: 'gk-meta' }, el('b', null, c), ` · induk: ${C.induk.length ? C.induk.join(' dan ') : 'tidak ada'} · penulis: ${C.penulis} · pesan: "${C.pesan}"`),
    diffView(C.induk.length ? beda(induk, C.isi) : C.isi.map((x) => [' ', x]), C.induk.length ? `Perubahan dari ${C.induk[0]}` : 'Isi berkas'),
    el('p', { class: 'gk-keluar' }, `Jawaban ${JAWAB.join(', ')} → ${keluaran(c)}`));
}
function diffView(rows, judul) {
  return el('div', { class: 'gk-beda' }, el('small', null, judul), el('ol', { class: 'gk-diff' }, rows.map(([t, x]) => el('li', { class: t === '+' ? 'tambah' : t === '-' ? 'hapus' : '' }, el('span', null, t === ' ' ? ' ' : t), el('code', null, x || ' ')))));
}
function tigaKolom(base, kita, mereka, nama) {
  const tanda = (isi) => { const m = new Set(cocok(base, isi).map((x) => x[1])); return isi.map((x, i) => [m.has(i) ? ' ' : '+', x]); };
  return el('div', { class: 'gk-tiga' },
    diffView(base.map((x) => [' ', x]), 'Leluhur bersama c1'), diffView(tanda(kita), 'main'), diffView(tanda(mereka), nama));
}

const LANGKAH = [
  { n: 1, label: { main: 'c1' }, t: 'Sari membuat c1 di main: kuis dua soal.' },
  { n: 2, label: { main: 'c1', 'soal-tiga': 'c2' }, t: 'Dodi membuat cabang soal-tiga dari c1, lalu c2. Label soal-tiga ikut berpindah ke c2; main tetap di c1.' },
  { n: 3, label: { main: 'c1', 'soal-tiga': 'c2', 'jawaban-rapi': 'c3' }, t: 'Rina membuat cabang jawaban-rapi dari c1, lalu c3.' },
  { n: 4, label: { main: 'c1', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' }, t: 'Rina membuat c4. Hanya label jawaban-rapi yang berpindah.' },
  { n: 5, label: { main: 'c5', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' }, t: 'Sari menggabungkan soal-tiga ke main. Leluhur bersama c1; hanya soal-tiga yang berubah, jadi c5 sama dengan c2. c5 punya dua induk.', gabung: ['c1', 'c1', 'c2', 'soal-tiga'] },
  { n: 6, label: { main: 'c6', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' }, t: 'Sari menggabungkan jawaban-rapi. Baris 6 tergabung otomatis, bagian akhir berkas konflik dan diselesaikan dengan tangan menjadi c6.', gabung: ['c1', 'c5', 'c4', 'jawaban-rapi'] },
  { n: 7, label: { main: 'c7', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' }, t: 'Sari membuat c7 dengan revert c3: commit baru yang membalik baris 6. c3 tetap ada di riwayat.' },
];
function createGraf(root, ctx) {
  const wrap = el('div', { class: 'act git-kertas' });
  root.append(wrap);
  let k = 0; let pilih = 'c1'; let geser = null; let label = { ...LANGKAH[0].label }; let tiga = false;
  const ke = (i) => { k = i; label = { ...LANGKAH[k].label }; pilih = ID[LANGKAH[k].n - 1]; geser = null; tiga = !!LANGKAH[k].gabung; draw(); };
  const draw = () => {
    const L = LANGKAH[k]; const g = L.gabung;
    wrap.replaceChildren(
      el('p', { class: 'gk-narasi' }, el('b', null, `Langkah ${k + 1} dari ${LANGKAH.length}. `), L.t),
      grafSvg(L.n, { label, pilih, onPilih: (c) => { if (geser) { label = { ...label, [geser]: c }; geser = null; ctx.sound.tap(); } else { pilih = c; tiga = false; } draw(); }, onLabel: (nama) => { geser = geser === nama ? null : nama; draw(); }, labelPilih: geser }),
      el('p', { class: 'gk-ket' }, geser ? `Sentuh commit tujuan untuk memindahkan label ${geser}.` : 'Sentuh commit untuk melihat kartunya. Sentuh label cabang untuk menggesernya.'),
      el('div', { class: 'gk-kontrol' },
        button('◀ Sebelumnya', () => ke(Math.max(0, k - 1))), button('Berikutnya ▶', () => ke(Math.min(LANGKAH.length - 1, k + 1)), 'primary'),
        button('Kembalikan label', () => { label = { ...L.label }; geser = null; draw(); }),
        ...[g ? button(tiga ? 'Kartu commit' : 'Perbandingan tiga kolom', () => { tiga = !tiga; draw(); }) : null].filter(Boolean)),
      tiga && g ? el('div', { class: 'gk-panel' }, tigaKolom(COMMIT[g[0]].isi, COMMIT[g[1]].isi, COMMIT[g[2]].isi, g[3]), el('p', { class: 'gk-ket' }, gabung3(COMMIT[g[0]].isi, COMMIT[g[1]].isi, COMMIT[g[2]].isi).konflik.length ? 'Kedua pihak mengubah bagian akhir berkas dengan cara berbeda → konflik.' : 'Hanya satu pihak yang berubah → diambil otomatis.'))
        : kartu(pilih));
  };
  draw();
}

const KONFLIK = {
  c6: { judul: 'jawaban-rapi ke main (c6)', m: M6, jawab: JAWAB, cek: [['Soal ketiga dari Dodi tetap ada', (t) => t.includes('Rumus kimia air')], ['Tulisan "Skor akhir" dari Rina dipakai', (t) => /print\("Skor akhir:", skor, "dari 30"\)/.test(t)], ['Skor penuh 30, karena ada tiga soal', (t) => t.includes('"dari 30"') && !t.includes('"dari 20"')], ['Baris 6 versi Rina (tergabung otomatis) tetap ada', (t) => t.includes('.strip().lower()')]] },
  tim: { judul: 'Tim: soal keempat dan "Hebat" (tim-2 ke main)', m: gabung3(C2, FITUR[1].isi, FITUR[2].isi, { namaMereka: 'tim-2' }), jawab: JAWAB4, cek: [['Soal keempat tetap ada', (t) => t.includes('Hasil 12 x 12')], ['"Hebat, semua benar!" tetap ada', (t) => t.includes('Hebat, semua benar!')], ['Skor penuh 40 di baris skor', (t) => t.includes('"dari 40"') && !t.includes('"dari 30"')], ['Syarat skor penuh ikut menjadi 40', (t) => /if skor == 40:/.test(t)]] },
};
function createKonflik(root, ctx) {
  const wrap = el('div', { class: 'act git-kertas' });
  root.append(wrap);
  let pilih = 'c6';
  const draw = () => {
    const K = KONFLIK[pilih]; const k0 = K.m.konflik[0];
    const ta = el('textarea', { class: 'gk-sunting', spellcheck: 'false', 'aria-label': 'Hasil gabungan', rows: String(K.m.hasil.length + 1) });
    ta.value = K.m.hasil.join('\n');
    const msg = el('p', { class: 'reveal info' }, 'Sunting bagian yang berkonflik, lalu Periksa.');
    const hasilBox = el('div', { class: 'gk-cek' });
    const ganti = (isi) => { ta.value = [...K.m.hasil.slice(0, k0.mulai), ...isi, ...K.m.hasil.slice(k0.mulai + k0.kita.length + k0.mereka.length + 3)].join('\n'); };
    wrap.replaceChildren(
      el('div', { class: 'seg gk-pilih' }, Object.entries(KONFLIK).map(([id, x]) => onTap(el('button', { class: `seg-btn ${id === pilih ? 'on' : ''}`, type: 'button' }, x.judul), () => { pilih = id; draw(); }))),
      el('div', { class: 'gk-kontrol' }, button('Pakai HEAD', () => ganti(k0.kita)), button(`Pakai ${K.m.hasil[k0.mulai + k0.kita.length + k0.mereka.length + 2].slice(8)}`, () => ganti(k0.mereka)), button('Ambil keduanya', () => ganti([...k0.kita, ...k0.mereka])), button('Kembalikan', () => { ta.value = K.m.hasil.join('\n'); })),
      ta,
      button('Periksa', () => {
        const baris = ta.value.replace(/\r/g, '').split('\n'); const sisa = baris.findIndex((x) => PENANDA.test(x));
        if (sisa >= 0) { ctx.mistake(); shake(ta); say(msg, 'bad', `Ditolak: penanda konflik masih tertinggal di baris ${sisa + 1} (${baris[sisa].slice(0, 7)}).`); hasilBox.replaceChildren(); return; }
        const R = runPy(baris, { input: [...K.jawab], limit: 5000 }); const teks = baris.join('\n');
        const hasil = K.cek.map(([t, f]) => [t, f(teks)]); const semua = hasil.every((x) => x[1]) && !R.error;
        hasilBox.replaceChildren(el('ul', null, hasil.map(([t, ok]) => el('li', { class: ok ? 'ok' : 'tidak' }, `${ok ? '✓' : '✗'} ${t}`))),
          el('p', { class: 'gk-keluar' }, `Jawaban ${K.jawab.join(', ')} → ${R.error ? `${R.error.type}: ${R.error.message}` : R.out.join(' · ')}`));
        if (semua) { ctx.sound.good(); say(msg, 'good', pilih === 'c6' ? 'Konflik selesai sesuai maksud Dodi dan Rina. Skornya masih 20 dari 30: itu bug c3, bukan konflik. Cari di Penguji Versi.' : 'Konflik selesai. Syarat skor penuh juga ikut disesuaikan: konflik makna seperti ini tidak dilaporkan Git.'); }
        else { ctx.mistake(); say(msg, 'bad', 'Penanda sudah hilang, tetapi hasilnya belum memadukan maksud kedua pihak.'); }
      }, 'primary'),
      msg, hasilBox);
  };
  draw();
}

function createUji(root, ctx) {
  const wrap = el('div', { class: 'act git-kertas' });
  root.append(wrap);
  let pilih = 'c6'; const jawab = [...JAWAB];
  // 100-commit bisect: first failing commit hidden at 2..100.
  let N = 100; let bug = 0; let diuji = {};
  const baru = () => { bug = 2 + Math.floor(ctx.rand.next() * (N - 1)); diuji = { 1: true, [N]: false }; };
  baru();
  const draw = () => {
    const isi = COMMIT[pilih].isi; const ins = jawab.map((v, i) => { const x = el('input', { class: 'txt gk-jawab', 'aria-label': `jawaban ${i + 1}` }); x.value = v; x.addEventListener('input', () => { jawab[i] = x.value; }); return x; });
    const out = el('p', { class: 'gk-keluar' }, `→ ${jalankan(isi, jawab)}`);
    const k = Object.keys(diuji).length - 2; const batas = Object.entries(diuji).map(([a, b]) => [Number(a), b]).sort((a, b) => a[0] - b[0]);
    let lo = 1; let hi = N; for (const [a, b] of batas) { if (b && a > lo) lo = a; if (!b && a < hi) hi = a; }
    const ketemu = hi - lo === 1;
    wrap.replaceChildren(
      el('p', { class: 'prompt gk-kecil' }, 'Jalankan versi kuis'),
      el('div', { class: 'seg gk-pilih' }, ID.map((c) => onTap(el('button', { class: `seg-btn ${c === pilih ? 'on' : ''}`, type: 'button' }, c), () => { pilih = c; draw(); }))),
      el('p', { class: 'gk-ket' }, `${pilih} · ${COMMIT[pilih].penulis} · "${COMMIT[pilih].pesan}"`),
      el('div', { class: 'gk-uji' }, pyCode(isi, { labels: lab(isi.length), cls: 'gk-kode' }), el('div', { class: 'gk-masuk' }, ...ins.map((x, i) => el('label', null, ['Hasil 7 x 8?', 'Planet terbesar?', 'Rumus kimia air?'][i], x)), button('Jalankan', () => { out.textContent = `→ ${jalankan(isi, jawab)}`; ctx.sound.tap(); }, 'primary'), out)),
      el('p', { class: 'prompt gk-kecil' }, `Cari commit pertama yang bug dari ${N} commit: c1 lolos, c${N} gagal. Sentuh commit untuk mengujinya.`),
      el('div', { class: 'gk-seratus' }, ...Array.from({ length: N }, (_, i) => { const c = i + 1; const st = c in diuji ? (diuji[c] ? 'lolos' : 'gagal') : c > lo && c < hi ? '' : 'luar';
        return onTap(el('button', { class: `gk-sel ${st}`, type: 'button', title: `c${c}` }, String(c)), () => { if (ketemu || c in diuji) return; diuji[c] = c < bug; ctx.sound.tap(); draw(); }); })),
      el('p', { class: `gk-ket ${ketemu ? 'gk-ketemu' : ''}` }, ketemu ? `Ketemu: c${hi} commit pertama yang bug, dengan ${k} uji (paling banyak ${ujiBagiDua(N)} bila selalu membagi dua).` : `${k} uji. Tersisa c${lo + 1} sampai c${hi}: ${hi - lo} kemungkinan. Uji di tengah: c${Math.floor((lo + hi) / 2)}.`),
      el('div', { class: 'gk-kontrol' }, button('Riwayat baru', () => { baru(); draw(); })));
  };
  draw();
}

// Team mode: each team picks a feature on its own branch from c5, then the branches are merged one by one.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act git-kertas' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const fitur = []; let main = [...C2]; const set = new Set();
    const pilihFitur = () => {
      const t = fitur.length;
      if (t >= nT) { gabung(0); return; }
      wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: buat cabang tim-${t + 1} dari c5 dan pilih fitur`),
        el('div', { class: 'gk-fitur' }, ...Object.entries(FITUR).map(([f, F]) => onTap(el('button', { class: 'gk-pilihan', type: 'button' }, el('b', null, `(${f}) ${F.nama}`), diffView(beda(C2, F.isi).filter((x) => x[0] !== ' '), 'Perubahan dari c5')), () => { fitur.push(Number(f)); ctx.sound.tap(); pilihFitur(); }))));
    };
    const gabung = (i) => {
      if (i >= nT) { finishBoard(wrap, ctx, { title: 'Cabang Tim selesai', pts, again: () => pickTeams(wrap, 'Cabang Tim', start) }); return; }
      const f = fitur[i]; const M = gabung3(C2, main, FITUR[f].isi, { namaMereka: `tim-${i + 1}` }); const target = new Set([...set, f]);
      const msg = el('p', { class: 'reveal info' }, '');
      const uji = (isi, catatan) => {
        const ok = lolosUji(isi, target);
        if (ok) { main = isi; set.add(f); pts[i] += 1; ctx.sound.good(); say(msg, 'good', `${catatan} Uji lolos: tim-${i + 1} tergabung ke main. +1 untuk Tim ${i + 1}.`); }
        else { ctx.mistake(); say(msg, 'bad', `${catatan} Uji gagal (${keluaranPenuh(isi).join(' · ')}), jadi penggabungan dibatalkan dan main tetap.`); }
        tampil(true);
      };
      const opsi = () => {
        if (!M.konflik.length) return [];
        const k0 = M.konflik[0]; const pre = M.hasil.slice(0, k0.mulai); const post = M.hasil.slice(k0.mulai + k0.kita.length + k0.mereka.length + 3);
        const o = [['Pakai bagian main', [...pre, ...k0.kita, ...post]], [`Pakai bagian tim-${i + 1}`, [...pre, ...k0.mereka, ...post]], ['Ambil keduanya', [...pre, ...k0.kita, ...k0.mereka, ...post]], ['Ambil keduanya dan sesuaikan skor penuh', harapan(target)]];
        const lihat = new Set(); return ctx.rand.shuffle(o.filter(([, x]) => { const s = x.join('\n'); if (lihat.has(s)) return false; lihat.add(s); return true; }));
      };
      const O = opsi();
      const tampil = (selesai) => wrap.replaceChildren(scoreBar(pts, i), el('p', { class: 'prompt' }, `Menggabungkan tim-${i + 1} (${FITUR[f].nama}) ke main`),
        el('div', { class: 'gk-dua' }, pyCode(M.hasil, { labels: lab(M.hasil.length), cls: 'gk-kode', warn: M.hasil.map((x, j) => (PENANDA.test(x) ? j : -1)).filter((j) => j >= 0) }),
          el('div', { class: 'gk-aksi' }, el('p', { class: 'gk-ket' }, M.konflik.length ? `Konflik di baris ${M.konflik[0].mulai + 1}. Tim ${i + 1}, pilih penyelesaiannya. Uji memakai jawaban ${JAWAB4.join(', ')}.` : 'Tergabung otomatis tanpa konflik.'),
            ...(selesai ? [] : M.konflik.length ? O.map(([t, isi]) => button(t, () => uji(isi, `${t}.`))) : [button('Jalankan uji', () => uji(M.hasil, 'Tanpa konflik.'), 'primary')]),
            msg, ...[selesai ? button('Lanjut ➜', () => gabung(i + 1), 'primary') : null].filter(Boolean))));
      tampil(false);
    };
    pilihFitur();
  }
  pickTeams(wrap, 'Cabang Tim', start);
}
