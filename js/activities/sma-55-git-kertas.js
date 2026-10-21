// Kerja Tim dengan Git di Atas Kertas — SMA/SMK (16–18 tahun), coding. Commits
// as full snapshots with parents, author and message; branches as labels that
// move; three-way merge from the common ancestor (line-based diff3 whose output,
// conflict markers included, matches git merge for every merge shown here);
// resolving a conflict by both people's intent; finding the commit that
// introduced a bug by running each version of the quiz in mini-py; revert
// without rewriting history; and binary search over commits (git bisect).

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode } from './smp-kit.js';
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
const PESAN_ACAK = ['Tambah soal kelima', 'Rapikan teks pertanyaan', 'Tambah komentar', 'Ganti nama variabel', 'Tambah soal bonus', 'Perbaiki ejaan', 'Ubah urutan soal', 'Tambah ucapan selamat datang', 'Hitung waktu pengerjaan', 'Simpan skor tertinggi', 'Tambah petunjuk', 'Batasi tiga kali coba', 'Tampilkan jawaban benar', 'Ubah nilai tiap soal', 'Tambah soal acak'];

const uniq = (xs) => [...new Set(xs)];
const lab = (n, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));

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
    const wrap = el('div', { class: 'act git-kertas' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(pyCode(C1, { labels: lab(9), cls: 'gk-kode' }));
        const P = ['"Tambah soal ketiga tentang rumus kimia air"', '"perbaikan"', '"update"', '"asdfgh"'];
        rowsChoose(wrap, ctx, { prompt: 'Commit c1 (Sari, main, "Kuis dua soal"). Dodi membuat c2.', cls: 'gk-isi', rows: [
          ['n', 'Banyak baris isi c2', ['9', '10', '12', '13'], String(C2.length)],
          ['i', 'Induk c2', ['c1', 'tidak ada', 'c3', 'main'], COMMIT.c2.induk[0]],
          ['w', 'Kartu commit mencatat induknya, supaya', ['riwayat bisa ditelusuri ke belakang, perubahan bisa dihitung, dan leluhur bersama bisa dicari saat menggabungkan', 'berkasnya lebih kecil', 'penulisnya tidak bisa diganti', 'Git tahu jam pembuatannya'], 'riwayat bisa ditelusuri ke belakang, perubahan bisa dihitung, dan leluhur bersama bisa dicari saat menggabungkan'],
          ['p', 'Pesan commit paling berguna', P, P[0]],
          ['q', 'Pesan commit paling tidak berguna', P, P[3]],
        ], done: next, info: 'Pesan yang baik itu singkat, menyebut apa yang berubah, dan bila perlu mengapa.' });
      }
      else if (r === 1) {
        wrap.append(grafSvg(4, { label: { main: 'c1', 'soal-tiga': 'c2', 'jawaban-rapi': 'c4' }, sembunyiLabel: true }));
        const C = ['c1', 'c2', 'c3', 'c4'];
        rowsChoose(wrap, ctx, { prompt: 'Graf c1–c4. Tempel label cabang pada commit yang tepat.', cls: 'gk-isi', rows: [
          ['m', 'Label main', C, 'c1'],
          ['s', 'Label soal-tiga', C, 'c2'],
          ['j', 'Label jawaban-rapi', C, 'c4'],
          ['b', 'Saat Rina membuat c4', ['jawaban-rapi berpindah dari c3 ke c4; main dan soal-tiga tetap', 'semua label berpindah ke c4', 'main berpindah ke c4', 'tidak ada label yang berpindah'], 'jawaban-rapi berpindah dari c3 ke c4; main dan soal-tiga tetap'],
          ['c', 'Kelas lain aman memakai main, karena', ['commit di cabang tidak mengubah main; fitur yang belum diuji tetap di cabang', 'main dikunci kata sandi', 'cabang menghapus main sementara', 'Git menyalin kuis ke setiap kelas'], 'commit di cabang tidak mengubah main; fitur yang belum diuji tetap di cabang'],
        ], done: next });
      }
      else if (r === 2) {
        const same = M5.hasil.join('\n') === C2.join('\n') && !M5.konflik.length;
        rowsChoose(wrap, ctx, { prompt: 'Sari menggabungkan soal-tiga ke main → c5', cls: 'gk-isi', rows: [
          ['l', 'Leluhur bersama main dan soal-tiga', ['c1', 'c2', 'c3', 'tidak ada'], 'c1'],
          ['h', 'Isi c5', ['sama dengan isi c2 (12 baris)', 'sama dengan isi c1 (9 baris)', 'gabungan c1 dan c2 (21 baris)', 'konflik di baris 9'], same ? 'sama dengan isi c2 (12 baris)' : '?'],
          ['w', 'Alasannya', ['hanya soal-tiga yang berubah dari c1, jadi perubahan itu diambil', 'Git selalu memilih cabang yang lebih baru', 'Sari memilih versi Dodi', 'c2 lebih panjang'], 'hanya soal-tiga yang berubah dari c1, jadi perubahan itu diambil'],
          ['i', 'Induk c5', ['c1 dan c2', 'c2 saja', 'c1 saja', 'c2 dan c4'], COMMIT.c5.induk.join(' dan ')],
          ['b', 'Label main sesudahnya', ['c5', 'c1', 'c2', 'c4'], 'c5'],
        ], done: next });
      }
      else if (r === 3) {
        wrap.append(pyCode(M6.hasil, { labels: lab(M6.hasil.length), cls: 'gk-kode', warn: M6.hasil.map((x, i) => (PENANDA.test(x) ? i : -1)).filter((i) => i >= 0) }));
        const K = M6.konflik[0];
        rowsChoose(wrap, ctx, { prompt: 'Menggabungkan jawaban-rapi ke main: konflik', cls: 'gk-isi', rows: [
          ['l', 'Leluhur bersama', ['c1', 'c3', 'c4', 'c5'], 'c1'],
          ['o', 'Baris 6 digabung otomatis, karena', ['hanya Rina yang mengubahnya; main tidak menyentuhnya', 'kedua pihak mengubahnya dengan sama', 'baris 6 tidak penting', 'Git selalu memilih cabang'], 'hanya Rina yang mengubahnya; main tidak menyentuhnya'],
          ['k', 'Bagian akhir berkas konflik, karena', ['kedua pihak mengubah baris skor dengan cara berbeda', 'Dodi menghapus baris 9', 'Rina menambah soal', 'Git tidak bisa membaca print'], 'kedua pihak mengubah baris skor dengan cara berbeda'],
          ['h', `Baris ${K.mulai + 2}–${K.mulai + 1 + K.kita.length} (antara <<<<<<< HEAD dan =======) berasal dari`, ['main (perubahan Dodi)', 'jawaban-rapi', 'leluhur c1', 'Sari'], 'main (perubahan Dodi)'],
          ['j', 'Bagian antara ======= dan >>>>>>> jawaban-rapi berasal dari', ['cabang jawaban-rapi (perubahan Rina)', 'main', 'leluhur c1', 'Dodi'], 'cabang jawaban-rapi (perubahan Rina)'],
        ], done: next });
      }
      else if (r === 4) {
        const ok = 'jawab = input("Rumus kimia air? ") … print("Skor akhir:", skor, "dari 30")';
        rowsChoose(wrap, ctx, { prompt: 'Menyelesaikan konflik untuk c6', cls: 'gk-isi gk-mono', rows: [
          ['c', 'Bagian akhir yang benar', [ok, 'jawab = input("Rumus kimia air? ") … print("Skor kamu:", skor, "dari 30")', 'print("Skor akhir:", skor, "dari 20")', 'print("Skor akhir:", skor, "dari 30")'], ok],
          ['m', 'Penanda <<<<<<<, =======, dan >>>>>>>', ['dihapus semua', 'dibiarkan sebagai komentar', 'hanya ======= yang dihapus', 'diganti #'], 'dihapus semua'],
          ['d', 'Usul Rudi: pakai versi jawaban-rapi saja', ['soal ketiga buatan Dodi hilang tanpa ada yang sadar', 'tidak ada akibatnya', 'program galat', 'baris 6 hilang'], !C4.includes(SOAL3[0]) ? 'soal ketiga buatan Dodi hilang tanpa ada yang sadar' : '?'],
          ['s', 'Hasil yang benar itu', ['tidak sama dengan versi mana pun: memadukan maksud kedua pihak', 'sama dengan versi main', 'sama dengan versi jawaban-rapi', 'sama dengan leluhur c1'], 'tidak sama dengan versi mana pun: memadukan maksud kedua pihak'],
        ], done: next });
      }
      else if (r === 5) {
        const opsi = uniq(ID.slice(0, 6).map(keluaran));
        rowsChoose(wrap, ctx, { prompt: `Jawaban ${JAWAB.join(', ')}. Keluaran baris terakhir tiap commit`, cls: 'gk-isi gk-mono', rows: ID.slice(0, 6).map((id) => [id, `${id} · ${COMMIT[id].pesan}`, opsi, keluaran(id)]), done: next, info: 'Commit yang hanya punya dua soal mengabaikan jawaban ketiga.' });
      }
      else if (r === 6) {
        const pertama = ID.slice(0, 6).find((id) => !skorPenuh(id));
        rowsChoose(wrap, ctx, { prompt: 'Mencari bug dan membatalkannya', cls: 'gk-isi', rows: [
          ['c', 'Commit pertama yang memunculkan bug', ['c1', 'c2', 'c3', 'c4', 'c6'], pertama],
          ['p', 'Penyebabnya', ['baris 6 mengubah jawaban menjadi huruf kecil, tetapi baris 7 masih membandingkan dengan "Jupiter"', 'konflik yang salah diselesaikan', 'soal ketiga salah kunci', 'skor tidak dimulai dari 0'], 'baris 6 mengubah jawaban menjadi huruf kecil, tetapi baris 7 masih membandingkan dengan "Jupiter"'],
          ['r', 'c7 = revert c3: baris 6 dan keluarannya', uniq([`${C7[5]} → ${keluaran('c7')}`, `${C6[5]} → ${keluaran('c6')}`, `${C7[5]} → ${keluaran('c6')}`, `${C6[5]} → ${keluaran('c7')}`]), `${C7[5]} → ${keluaran('c7')}`],
          ['h', 'c3 tidak dihapus dari riwayat, karena', ['c4 dan c6 dibangun di atasnya dan tim sudah punya salinannya; revert mencatat kesalahan dan pembatalannya', 'Git tidak bisa menghapus apa pun', 'c3 masih benar', 'supaya bug tetap ada'], 'c4 dan c6 dibangun di atasnya dan tim sudah punya salinannya; revert mencatat kesalahan dan pembatalannya'],
        ], done: next });
      }
      else if (r === 7) {
        const maju = C6.map((x, i) => (i === 6 ? 'if jawab == "jupiter":' : x));
        rowsChoose(wrap, ctx, { prompt: 'Memperbaiki maju', cls: 'gk-isi', rows: [
          ['d', 'Baris 7 yang benar', ['if jawab == "jupiter":', 'if jawab == "Jupiter":', 'if jawab == "JUPITER":', 'if jawab.lower() == "Jupiter":'], ['if jawab == "jupiter":', 'if jawab == "Jupiter":', 'if jawab == "JUPITER":'].find((b) => jalankan(C6.map((x, i) => (i === 6 ? b : x))) === 'Skor akhir: 30 dari 30')],
          ['j', 'Dengan perbaikan itu, jawaban " JUPITER "', ['diterima', 'ditolak'], jalankan(maju, ['56', ' JUPITER ', 'H2O']) === 'Skor akhir: 30 dari 30' ? 'diterima' : 'ditolak'],
          ['k', 'Kelebihan dibandingkan revert', ['fitur Rina tetap ada; revert membuang fitur bersama bug-nya', 'riwayatnya lebih pendek', 'tidak perlu commit baru', 'c3 terhapus'], 'fitur Rina tetap ada; revert membuang fitur bersama bug-nya'],
          ['e', 'Jawaban rumus kimia juga diberi .lower()?', ['tidak: rumus kimia peka huruf besar, misalnya Co (kobalt) dan CO (karbon monoksida)', 'ya, supaya seragam', 'ya, karena h2o sama dengan H2O', 'tidak, karena Python tidak bisa'], 'tidak: rumus kimia peka huruf besar, misalnya Co (kobalt) dan CO (karbon monoksida)'],
          ['f', 'Bug Rina seharusnya ketahuan', ['saat Rina menguji cabangnya, misalnya di c3 atau c4, sebelum digabungkan', 'saat Pak Guru menguji c6', 'tidak mungkin ketahuan', 'saat c7 dibuat'], 'saat Rina menguji cabangnya, misalnya di c3 atau c4, sebelum digabungkan'],
        ], done: next });
      }
      else if (r === 8) {
        const G = [['commit', 'Membuat commit'], ['branch', 'Membuat cabang'], ['switch', 'Pindah ke cabang lain'], ['merge', 'Menggabungkan'], ['log --graph', 'Melihat graf riwayat'], ['revert', 'Membalik commit']];
        const perintah = G.map(([c]) => `git ${c}`);
        rowsChoose(wrap, ctx, { prompt: 'Tantangan: perintah Git dan pencarian biner', cls: 'gk-isi gk-mono', rows: [
          ...G.map(([c, t]) => [c, t, perintah, `git ${c}`]),
          ['b', '100 commit: paling banyak berapa uji dengan membagi dua?', ['6', '7', '10', '50'], String(ujiBagiDua(100))],
        ], done: next, info: '100, 50, 25, 13, 7, 4, 2, lalu 1: setiap uji membuang separuh kemungkinan. Git menyediakan git bisect untuk ini.' });
      }
      else {
        // Bisect a seeded 16-commit history: c1 passes, c16 fails.
        const N = 16; const bug = 2 + Math.floor(ctx.rand.next() * (N - 1));
        let lo = 1; let hi = N; const rows = []; let k = 1;
        while (hi - lo > 1) {
          const mid = Math.floor((lo + hi) / 2); const lolos = mid < bug;
          const opsi = uniq([`c${mid}`, `c${lo + 1}`, `c${hi - 1}`, `c${lo}`, `c${hi}`]).slice(0, 4);
          rows.push([`u${k}`, `Uji ke-${k}: di antara c${lo} (lolos) dan c${hi} (gagal), uji`, opsi, `c${mid}`, `c${mid} ${lolos ? 'lolos' : 'gagal'} diuji.`]);
          if (lolos) lo = mid; else hi = mid; k++;
        }
        rows.push(['p', `Hasil uji: ${rows.map((x) => x[4].replace(' diuji.', '')).join(', ')}. Commit pertama yang mengandung bug`, uniq([`c${hi}`, `c${lo}`, `c${Math.min(N, hi + 1)}`, `c${Math.max(1, lo - 1)}`]), `c${hi}`]);
        wrap.append(el('div', { class: 'gk-pita' }, ...Array.from({ length: N }, (_, i) => el('span', { class: i === 0 ? 'lolos' : i === N - 1 ? 'gagal' : '' }, `c${i + 1}`, el('small', null, i === 0 ? 'Kuis dua soal' : i === N - 1 ? 'skor salah' : PESAN_ACAK[(i + bug) % PESAN_ACAK.length])))));
        rowsChoose(wrap, ctx, { prompt: `Riwayat ${N} commit: c1 lolos uji, c${N} gagal. Cari dengan membagi dua.`, cls: 'gk-isi', rows, done: next });
      }
    }
    render();
  },
};
// Full marks for every right answer: 10 points per question in that version.
const skorPenuh = (id) => Number((keluaran(id).match(/: (\d+)/) || [])[1]) === 10 * COMMIT[id].isi.filter((l) => l.startsWith('if jawab')).length;

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
    const g = s('g', { class: `gk-simpul ${pilih === c ? 'on' : ''} ${COMMIT[c].induk.length > 1 ? 'gabung' : ''}`, tabindex: '0' }, s('circle', { cx: X(c), cy: Y(c), r: 20 }), s('text', { x: X(c), y: Y(c) + 6, 'text-anchor': 'middle' }, c));
    if (onPilih) g.addEventListener('click', () => onPilih(c));
    svg.append(g);
  }
  if (!sembunyiLabel) {
    const per = {};
    for (const [nama, c] of Object.entries(label)) { if (!ids.includes(c)) continue; const k = (per[c] = (per[c] || 0) + 1) - 1; const lebar = nama.length * 8.4 + 12; const x = X(c) - lebar / 2; const y = Y(c) + (POS[c][1] === 0 ? -48 - k * 22 : 26 + k * 22);
      const g = s('g', { class: `gk-label ${nama === 'main' ? 'utama' : ''} ${labelPilih === nama ? 'on' : ''}` }, s('rect', { x, y, width: lebar, height: 20, rx: 4 }), s('text', { x: X(c), y: y + 15, 'text-anchor': 'middle' }, nama));
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
