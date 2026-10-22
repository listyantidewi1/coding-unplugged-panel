// Pengurutan Sisip dan Pencarian Biner dalam Python — SMA/SMK (16–18 tahun),
// coding. Queue numbers at a puskesmas: tracing insertion sort and binary
// search in mini-py, loop invariants, random versus nearly sorted data (fixed
// worksheet times), three off-by-one bugs, sorted() and bisect.
// Counting rule: a check is each evaluation of `a[j] > kunci`, a shift is each
// run of `a[j + 1] = a[j]`.

import { el, onTap, button } from '../core/util.js';
import { pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, pyTracer, stepper, fmtNum } from './smp-kit.js';
import { runPy, makePyRunner, pyRepr } from './mini-py.js';

export const SISIP = ['def urut_sisip(a):', '    for i in range(1, len(a)):', '        kunci = a[i]', '        j = i - 1', '        while j >= 0 and a[j] > kunci:', '            a[j + 1] = a[j]', '            j = j - 1', '        a[j + 1] = kunci', '    return a'];
export const CARI = ['def cari_biner(a, x):', '    kiri = 0', '    kanan = len(a) - 1', '    while kiri <= kanan:', '        tengah = (kiri + kanan) // 2', '        if a[tengah] == x:', '            return tengah', '        elif a[tengah] < x:', '            kiri = tengah + 1', '        else:', '            kanan = tengah - 1', '    return -1'];
export const MASUK = [104, 101, 105, 102, 106, 103];
export const ANTREAN = [101, 102, 104, 105, 107, 108, 109, 111, 112, 114, 115, 117, 118, 119, 120];
export const HAMPIR = [101, 102, 104, 103, 105, 107, 106, 108];
export const TERBALIK = [108, 107, 106, 105, 104, 103, 102, 101];
// Off-by-one versions: [id, label, which function, line index, new text].
export const VERSI = [['benar', 'versi benar', null, null, null], ['A', 'versi A: baris 2 range(1, len(a) - 1)', 'sisip', 1, '    for i in range(1, len(a) - 1):'], ['B', 'versi B: baris 5 j > 0', 'sisip', 4, '        while j > 0 and a[j] > kunci:'], ['C', 'versi C: baris 13 kiri < kanan', 'cari', 3, '    while kiri < kanan:'],
  ['K', 'baris 12 kanan = len(a)', 'cari', 2, '    kanan = len(a)'], ['R', 'baris 2 range(2, len(a))', 'sisip', 1, '    for i in range(2, len(a)):']];
const verOf = (id) => VERSI.find((v) => v[0] === id);
export const sisipOf = (id = 'benar') => { const v = verOf(id); return SISIP.map((x, i) => (v[2] === 'sisip' && v[3] === i ? v[4] : x)); };
export const cariOf = (id = 'benar') => { const v = verOf(id); return CARI.map((x, i) => (v[2] === 'cari' && v[3] === i ? v[4] : x)); };
const L1 = SISIP.map((_, i) => String(i + 1)); const L2 = CARI.map((_, i) => String(i + 10));
const frameVars = (st) => (st.frames.length ? st.frames[st.frames.length - 1].vars : st.vars);

// Run urut_sisip on a copy of `list`; count checks and shifts, and record each pass.
export function jalanSisip(list, id = 'benar') {
  const lines = [...sisipOf(id), `hasil = urut_sisip(${pyRepr(list)})`]; const r = makePyRunner(lines, { limit: 20000 });
  let cek = 0; let geser = 0; let g; const rows = []; let gi = 0; const strict = id === 'B';
  do { g = r.gen.next(); if (g.done) break; const v = frameVars(r.state); const L = g.value.line;
    if (L === 4 && (strict ? v.j > 0 : v.j >= 0)) cek++;
    if (L === 5) { geser++; gi++; }
    if (L === 7) { rows.push({ i: v.i, kunci: v.kunci, a: [...v.a], geser: gi }); gi = 0; }
  } while (!r.state.error);
  return { cek, geser, rows, hasil: r.state.vars.hasil, error: r.state.error };
}
// Run cari_biner on `a`; record kiri, kanan, tengah and a[tengah] for every round.
export function jalanCari(x, id = 'benar', a = ANTREAN) {
  const lines = [...cariOf(id), `hasil = cari_biner(${pyRepr(a)}, ${x})`]; const r = makePyRunner(lines, { limit: 20000 }); const rows = []; let g;
  do { g = r.gen.next(); if (g.done) break; const v = frameVars(r.state); if (g.value.line === 4) rows.push({ kiri: v.kiri, kanan: v.kanan, tengah: v.tengah, nilai: v.a[v.tengah] }); } while (!r.state.error);
  const e = r.state.error; return { rows, hasil: e ? null : r.state.vars.hasil, error: e, keluaran: e ? `${e.type}: ${e.message}` : pyRepr(r.state.vars.hasil) };
}
export const keluaranSisip = (list, id) => { const R = jalanSisip(list, id); return R.error ? `${R.error.type}: ${R.error.message}` : pyRepr(R.hasil); };

// Worksheet timing table (Python 3.13), milliseconds.
export const WAKTU = [[1000, 26, 0.12, 0.06], [2000, 81, 0.25, 0.2], [4000, 415, 0.56, 0.52]];
export const SOAL6 = ['import bisect', 'masuk = [104, 101, 105, 102, 106, 103]', 'urut = sorted(masuk)', 'print(masuk, urut)', 'print(bisect.bisect_left(antrean, 114))', 'bisect.insort(antrean, 113)', 'print(len(antrean), antrean.index(113))'];
export const POSISI = ['def posisi_sisip(a, x):', '    kiri = 0', '    kanan = len(a)', '    while kiri < kanan:', '        tengah = (kiri + kanan) // 2', '        if a[tengah] < x:', '            kiri = tengah + 1', '        else:', '            kanan = tengah', '    return kiri'];

export default {
  id: 'sma-44-urut-cari-kode',
  title: 'Pengurutan Sisip dan Pencarian Biner',
  topic: 'Pengurutan sisip dan pencarian biner dalam Python: menelusuri kode, invarian perulangan, data acak dan data hampir urut, kesalahan selisih satu, serta sorted() dan modul bisect',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎫',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri pengurutan sisip dan pencarian biner pada nomor antrean puskesmas, tuliskan invariannya, temukan tiga kesalahan selisih satu dengan masukan yang tepat, lalu pakai sorted() dan bisect.',
  extraModes: [
    { id: 'telusur', icon: '🔎', label: 'Penelusur dengan Sorotan List', desc: 'Jalankan urut_sisip atau cari_biner langkah demi langkah: kunci, penunjuk j, kiri, kanan, tengah, dan bagian yang sudah urut terlihat di list', create: createTracer },
    { id: 'versi', icon: '🆚', label: 'Versi Kode Berdampingan', desc: 'Jalankan masukan yang sama pada versi benar dan versi A, B, atau C, lalu bandingkan keluarannya', create: createCompare },
    { id: 'giliran', icon: '🐞', label: 'Bongkar Selisih Satu', desc: 'Satu tim memilih perubahan selisih satu secara diam-diam, tim lain mengetik masukan uji sampai keluarannya berbeda', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act urut-cari' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const sis = (extra = {}) => pyCode(SISIP, { labels: L1, cls: 'uc-kecil', ...extra });
      const car = (extra = {}) => pyCode(CARI, { labels: L2, cls: 'uc-kecil', ...extra });
      const S = jalanSisip(MASUK);
      if (r === 0) {
        wrap.append(sis(), listView(MASUK));
        const wrongA = (k) => { const p = S.rows[k]; return [[...p.a].sort((x, y) => x - y), MASUK, S.rows[(k + 1) % 5].a].map(pyRepr).filter((x) => x !== pyRepr(p.a)); };
        rowsChoose(wrap, ctx, { prompt: 'Telusuri urut_sisip([104, 101, 105, 102, 106, 103]): kunci · isi a setelah baris 8 · geseran', cls: 'uc-isi', rows: S.rows.map((p, k) => { const right = `${p.kunci} · ${pyRepr(p.a)} · ${p.geser}`; const ws = [...new Set(wrongA(k))].slice(0, 2).map((w, q) => `${p.kunci} · ${w} · ${q === 0 ? p.geser : p.geser + 1}`); return [`i${p.i}`, `i = ${p.i}`, [right, ...ws, `${MASUK[k]} · ${pyRepr(p.a)} · ${p.geser}`].slice(0, 4), right]; }), done: next });
      }
      else if (r === 1) {
        wrap.append(sis());
        rowsChoose(wrap, ctx, { prompt: 'Geseran, pemeriksaan, dan kunci', cls: 'uc-isi', rows: [
          ['g', 'Total geseran', ['5', '6', '10', '15'], String(S.geser)],
          ['c', 'a[j] > kunci diperiksa', ['6', '10', '11', '15'], String(S.cek)],
          ['w', 'Pada i = 1, setelah satu geseran', ['j menjadi -1, jadi j >= 0 salah dan a[j] > kunci tidak diperiksa lagi', 'a[j] > kunci diperiksa dengan a[-1]', 'perulangan for berhenti', 'kunci berubah menjadi 104'], 'j menjadi -1, jadi j >= 0 salah dan a[j] > kunci tidak diperiksa lagi'],
          ['k', 'Mengapa a[i] disimpan di kunci?', ['geseran pertama di baris 6 menimpa a[i]; tanpa kunci nilainya hilang', 'agar Python lebih cepat', 'karena a[i] tidak boleh dibaca dua kali', 'agar list tidak berubah'], 'geseran pertama di baris 6 menimpa a[i]; tanpa kunci nilainya hilang']], done: next });
      }
      else if (r === 2) {
        const at = (i) => { const p = S.rows.find((x) => x.i === i - 1); return pyRepr(p.a.slice(0, i)); };
        wrap.append(sis());
        rowsChoose(wrap, ctx, { prompt: 'Invarian: setiap kali baris 3 akan dijalankan, bagian a[0] sampai … sudah urut', cls: 'uc-isi', rows: [
          ['a', 'Bagian yang sudah urut', ['a[0] sampai a[i - 1]', 'a[0] sampai a[i]', 'a[i] sampai akhir', 'a[0] sampai a[j]'], 'a[0] sampai a[i - 1]'],
          ['b3', 'Tepat sebelum baris 3, i = 3', [at(3), '[101, 102, 104]', '[104, 101, 105]', '[101, 104, 105, 102]'], at(3)],
          ['b5', 'Tepat sebelum baris 3, i = 5', [at(5), '[101, 102, 103, 104, 105]', '[101, 102, 104, 105, 106, 103]', '[102, 104, 105, 106]'], at(5)],
          ['c', 'Bagian kanan mulai a[i] juga selalu urut?', ['tidak: untuk i = 3 bagian kanan [102, 106, 103] tidak urut', 'ya, selalu', 'ya, kecuali di akhir', 'tidak, bagian kanan selalu terbalik'], 'tidak: untuk i = 3 bagian kanan [102, 106, 103] tidak urut'],
          ['d', 'Mengapa invarian membuktikan list urut di akhir?', ['benar di awal (a[0] sendirian), tetap benar setiap putaran, dan di akhir mencakup a[0] sampai a[len(a) - 1]', 'karena perulangan selalu berhenti', 'karena sorted() dipanggil', 'karena kunci selalu terbesar'], 'benar di awal (a[0] sendirian), tetap benar setiap putaran, dan di akhir mencakup a[0] sampai a[len(a) - 1]']], done: next });
      }
      else if (r === 3) {
        const H = jalanSisip(HAMPIR); const T = jalanSisip(TERBALIK);
        wrap.append(timeTable());
        rowsChoose(wrap, ctx, { prompt: 'Data hampir urut dan data terbalik', cls: 'uc-isi', rows: [
          ['h', `${pyRepr(HAMPIR)} · geseran · pemeriksaan`, [`${H.geser} · ${H.cek}`, '0 · 8', '2 · 7', '4 · 11'], `${H.geser} · ${H.cek}`],
          ['t', `${pyRepr(TERBALIK)} · geseran · pemeriksaan`, [`${T.geser} · ${T.cek}`, '28 · 35', '56 · 56', '7 · 7'], `${T.geser} · ${T.cek}`],
          ['x', 'Bila n digandakan: data acak · data hampir urut', ['sekitar 4 kali · sekitar 2 kali lipat', 'sekitar 2 kali · sekitar 4 kali lipat', 'sekitar 2 kali · sekitar 2 kali lipat', 'sekitar 4 kali · sekitar 4 kali lipat'], 'sekitar 4 kali · sekitar 2 kali lipat'],
          ['c', 'Mengapa sisip cocok untuk nomor yang tiba hampir urut?', ['nomor biasanya sudah di tempatnya, jadi hampir tidak perlu digeser, dan nomor baru bisa disisipkan satu per satu', 'karena sisip lebih cepat daripada sorted()', 'karena data hampir urut tidak perlu diurutkan', 'karena sisip tidak memakai perulangan'], 'nomor biasanya sudah di tempatnya, jadi hampir tidak perlu digeser, dan nomor baru bisa disisipkan satu per satu']], done: next });
      }
      else if (r === 4 || r === 5) {
        const x = r === 4 ? 114 : 103; const C = jalanCari(x);
        wrap.append(el('div', { class: 'uc-dua' }, car(), listView(ANTREAN, { idx: true })));
        const rows = C.rows.map((p, k) => { const right = `${p.kiri} · ${p.kanan} · ${p.tengah} · ${p.nilai}`; const alt = [`${p.kiri} · ${p.kanan} · ${p.tengah + 1} · ${ANTREAN[p.tengah + 1] ?? '-'}`, `${p.kiri + 1} · ${p.kanan} · ${Math.floor((p.kiri + 1 + p.kanan) / 2)} · ${ANTREAN[Math.floor((p.kiri + 1 + p.kanan) / 2)]}`, `${p.kiri} · ${p.kanan + 1} · ${Math.floor((p.kiri + p.kanan + 1) / 2)} · ${ANTREAN[Math.floor((p.kiri + p.kanan + 1) / 2)]}`]; return [`p${k}`, `Putaran ${k + 1}`, [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4), right]; });
        rows.push(['h', `Hasil cari_biner(antrean, ${x})`, [C.keluaran, ...['9', '-1', '10', '3', '2'].filter((v) => v !== C.keluaran).slice(0, 3)], C.keluaran]);
        rowsChoose(wrap, ctx, { prompt: `cari_biner(antrean, ${x}): kiri · kanan · tengah · a[tengah]`, cls: 'uc-isi', rows, done: next });
      }
      else if (r === 6) {
        wrap.append(car());
        rowsChoose(wrap, ctx, { prompt: 'Invarian: bila x ada di list, x berada di antara a[kiri] dan a[kanan]', cls: 'uc-isi', rows: [
          ['b', 'Mengapa boleh mengembalikan -1 ketika kiri > kanan?', ['rentangnya kosong, padahal menurut invarian x harus di rentang itu, jadi x pasti tidak ada', 'karena -1 adalah indeks terakhir', 'karena perulangan sudah 4 kali', 'karena x lebih kecil dari a[0]'], 'rentangnya kosong, padahal menurut invarian x harus di rentang itu, jadi x pasti tidak ada'],
          ['c', 'Putaran paling banyak · 15 nomor · 1.000 nomor', ['4 · 10', '15 · 1.000', '8 · 500', '3 · 9'], '4 · 10'],
          ['w', 'Mengapa 10 untuk 1.000 nomor?', ['setiap putaran membuang separuh rentang, dan 2¹⁰ = 1.024', 'karena 1.000 dibagi 100', 'karena list dibagi 10 bagian', 'karena log₁₀ 1.000 = 3'], 'setiap putaran membuang separuh rentang, dan 2¹⁰ = 1.024']], done: next });
      }
      else if (r === 7) {
        const A = keluaranSisip(MASUK, 'A'); const B = keluaranSisip(MASUK, 'B'); const C120 = jalanCari(120, 'C').keluaran; const C101 = jalanCari(101, 'C').keluaran;
        wrap.append(el('div', { class: 'uc-dua' }, pyCode(SISIP.map((x, i) => (i === 1 ? `${x}  # A: range(1, len(a) - 1)` : i === 4 ? `${x}  # B: j > 0` : x)), { labels: L1, cls: 'uc-kecil', warn: [1, 4] }), pyCode(CARI.map((x, i) => (i === 3 ? `${x}  # C: kiri < kanan` : x)), { labels: L2, cls: 'uc-kecil', warn: [3] })));
        rowsChoose(wrap, ctx, { prompt: 'Tiga kesalahan selisih satu: keluaran yang salah dan penyebabnya', cls: 'uc-isi', rows: [
          ['a', `Versi A, urut_sisip(${pyRepr(MASUK)})`, [`${A} · i = 5 tidak pernah dijalankan, anggota terakhir tidak disisipkan`, `${B} · a[0] tidak pernah dibandingkan`, '[101, 102, 103, 104, 105, 106] · tidak ada bug', `${A} · kunci hilang`], `${A} · i = 5 tidak pernah dijalankan, anggota terakhir tidak disisipkan`],
          ['b', `Versi B, urut_sisip(${pyRepr(MASUK)})`, [`${B} · j > 0 tidak pernah membandingkan dengan a[0], jadi tidak ada nomor yang bisa ke depan`, `${A} · i = 5 tidak dijalankan`, '[101, 102, 103, 104, 105, 106] · tidak ada bug', `${B} · range berhenti terlalu cepat`], `${B} · j > 0 tidak pernah membandingkan dengan a[0], jadi tidak ada nomor yang bisa ke depan`],
          ['c', 'Versi C, cari_biner(antrean, 120) · cari_biner(antrean, 101)', [`${C120} · ${C101}: berhenti ketika kiri = kanan, padahal satu anggota itu belum diperiksa`, '14 · 0: tidak ada bug', '-1 · 0: hanya 120 yang salah', 'IndexError · -1: kanan terlalu besar'], `${C120} · ${C101}: berhenti ketika kiri = kanan, padahal satu anggota itu belum diperiksa`]], done: next });
      }
      else if (r === 8) {
        const R6 = runPy([`antrean = ${pyRepr(ANTREAN)}`, ...SOAL6], { limit: 2000 }); const E = runPy(['import bisect', `masuk = ${pyRepr(MASUK)}`, 'masuk = masuk.sort()', 'x = bisect.bisect_left(masuk, 103)'], { limit: 2000 });
        rowsChoose(wrap, ctx, { prompt: 'Menguji batas, sorted() dan list.sort()', cls: 'uc-isi', rows: [
          ['a', 'Versi C benar untuk 114. Mengapa uji itu tidak cukup?', ['114 ditemukan sebelum rentang menyusut menjadi satu anggota, jadi bugnya tidak sempat terlihat', 'karena 114 tidak ada di list', 'karena versi C memang benar', 'karena 114 terlalu besar'], '114 ditemukan sebelum rentang menyusut menjadi satu anggota, jadi bugnya tidak sempat terlihat'],
          ['b', 'Masukan yang selalu perlu ada di kasus uji list', ['anggota pertama dan terakhir, list kosong, list satu anggota, nilai di luar semua isi', 'hanya nilai di tengah list', 'hanya list yang panjang', 'hanya list yang sudah urut'], 'anggota pertama dan terakhir, list kosong, list satu anggota, nilai di luar semua isi'],
          ['o', 'Keluaran baris 25', [R6.out[0], `${pyRepr([...MASUK].sort((x, y) => x - y))} ${pyRepr([...MASUK].sort((x, y) => x - y))}`, `${pyRepr(MASUK)} ${pyRepr(MASUK)}`, `${pyRepr(MASUK)} None`], R6.out[0]],
          ['s', 'masuk = masuk.sort() lalu bisect.bisect_left(masuk, 103)', [`masuk berisi None · ${E.error.type}: ${E.error.message}`, 'masuk urut · 2', 'masuk berisi None · -1', `masuk urut · ${E.error.type}: ${E.error.message}`], `masuk berisi None · ${E.error.type}: ${E.error.message}`]], done: next });
      }
      else {
        const R6 = runPy([`antrean = ${pyRepr(ANTREAN)}`, ...SOAL6], { limit: 2000 }); const bl = (x) => runPy(['import bisect', `x = bisect.bisect_left(${pyRepr(ANTREAN)}, ${x})`]).vars.x;
        const P = [114, 103, 125, 101].map((x) => runPy([...POSISI, `x = posisi_sisip(${pyRepr(ANTREAN)}, ${x})`], { limit: 2000 }).vars.x);
        rowsChoose(wrap, ctx, { prompt: 'bisect pada daftar antrean', cls: 'uc-isi', rows: [
          ['c', 'bisect_left untuk 114 · 103 · 125', [[114, 103, 125].map(bl).join(' · '), '9 · -1 · -1', '9 · 2 · 14', '10 · 3 · 15'], [114, 103, 125].map(bl).join(' · ')],
          ['f', 'return pada fungsi ada(a, x)', ['i < len(a) and a[i] == x', 'a[i] == x', 'i != -1', 'x in a[i]'], 'i < len(a) and a[i] == x'],
          ['d', 'Keluaran baris 28', [R6.out[2], '15 9', '16 10', '16 8'], R6.out[2]],
          ['e', 'Kapan memakai sorted() dan bisect?', ['untuk program yang sungguh dipakai; menulis sendiri untuk belajar atau kebutuhan khusus', 'tidak pernah, selalu tulis sendiri', 'hanya untuk list pendek', 'hanya bila list belum urut'], 'untuk program yang sungguh dipakai; menulis sendiri untuk belajar atau kebutuhan khusus']],
        done: then(() => { wrap.append(pyCode(POSISI, { cls: 'uc-kecil' })); rowsChoose(wrap, ctx, { prompt: 'Tantangan: rentang setengah terbuka', cls: 'uc-isi', rows: [
          ['p', 'posisi_sisip untuk 114 · 103 · 125 · 101', [P.join(' · '), '9 · -1 · -1 · 0', '9 · 2 · 14 · 0', '10 · 3 · 15 · 1'], P.join(' · ')],
          ['w', 'Mengapa kanan = len(a) dan kiri < kanan benar di sini?', ['invariannya berbeda: jawaban di rentang kiri sampai sebelum kanan, jadi rentang kosong berarti kiri = kanan', 'karena bisect selalu benar', 'karena list antrean urut', 'karena tengah tidak pernah dikurangi'], 'invariannya berbeda: jawaban di rentang kiri sampai sebelum kanan, jadi rentang kosong berarti kiri = kanan']], done: next }); }) });
      }
    }
    render();
  },
};

const timeTable = () => el('table', { class: 'uc-tabel' }, el('tr', null, ['n', 'urut_sisip, data acak', 'urut_sisip, hampir urut', 'sorted(), data acak'].map((h) => el('th', null, h))), WAKTU.map(([n, ...t]) => el('tr', null, el('td', null, fmtNum(n)), ...t.map((x) => el('td', null, `${fmtNum(x, 2)} ms`)))));

// List as boxes; marks: sorted part, kunci above, pointers j / kiri / kanan / tengah, grey outside the search range.
export function listView(a, { idx = false, urut = -1, j = null, kunci = null, kiri = null, kanan = null, tengah = null, cari = false } = {}) {
  return el('div', { class: 'uc-list' }, a.map((v, i) => {
    const out = cari && kiri != null && kanan != null && (i < kiri || i > kanan);
    const ptr = [i === kiri ? 'kiri' : null, i === tengah ? 'tengah' : null, i === kanan ? 'kanan' : null, i === j ? 'j' : null].filter(Boolean);
    return el('div', { class: `uc-kotak ${i <= urut ? 'urut' : ''} ${out ? 'luar' : ''} ${i === tengah ? 'tengah' : ''}` }, el('small', null, ptr.join(' · ') || ' '), el('b', null, pyRepr(v)), idx || cari ? el('i', null, String(i)) : null);
  }), kunci != null ? el('div', { class: 'uc-kunci' }, el('small', null, 'kunci'), el('b', null, String(kunci))) : null);
}

// Step-by-step tracer with the list drawn as boxes.
function createTracer(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  let fn = 'sisip'; let data = MASUK; let x = 114;
  const LISTS = [['masuk', MASUK], ['hampir urut', HAMPIR], ['terbalik', TERBALIK]];
  const draw = () => {
    let cek = 0; let geser = 0;
    const lines = fn === 'sisip' ? [...SISIP, `hasil = urut_sisip(${pyRepr(data)})`] : [...CARI, `antrean = ${pyRepr(ANTREAN)}`, `hasil = cari_biner(antrean, ${x})`];
    const extra = (st) => { const v = frameVars(st); if (fn === 'sisip') { const a = v.a || data; const inLoop = v.i != null && !st.done; return el('div', { class: 'uc-samping' }, listView(a, { urut: inLoop ? v.i - 1 : st.done ? a.length - 1 : 0, j: inLoop ? v.j : null, kunci: inLoop ? v.kunci : null }), el('p', { class: 'uc-hitung' }, `geseran ${geser} · pemeriksaan a[j] > kunci ${cek}`)); }
      return el('div', { class: 'uc-samping' }, listView(ANTREAN, { cari: true, kiri: v.kiri, kanan: v.kanan, tengah: v.tengah })); };
    const tr = pyTracer(lines, { labels: fn === 'sisip' ? [...L1, ''] : [...L2, '', ''], cls: 'uc-jejak', speed: 500, hideVars: ['a', 'antrean'], extra, onStep: (g, st) => { if (!g) { cek = 0; geser = 0; return; } const v = frameVars(st); if (fn === 'sisip' && g.line === 4 && v.j >= 0) cek++; if (fn === 'sisip' && g.line === 5) geser++; } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur dengan sorotan list'),
      el('div', { class: 'seg uc-pilih' }, [['sisip', 'urut_sisip'], ['cari', 'cari_biner']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${fn === k ? 'on' : ''}`, type: 'button' }, t), () => { fn = k; draw(); }))),
      fn === 'sisip' ? el('div', { class: 'seg uc-pilih' }, LISTS.map(([t, l]) => onTap(el('button', { class: `seg-btn ${data === l ? 'on' : ''}`, type: 'button' }, t), () => { data = l; draw(); })))
        : el('div', { class: 'seg uc-pilih' }, [114, 103, 101, 120, 125].map((v) => onTap(el('button', { class: `seg-btn ${x === v ? 'on' : ''}`, type: 'button' }, `x = ${v}`), () => { x = v; draw(); }))),
      tr);
  };
  draw();
}

// Same input on the correct version and a chosen buggy version.
function createCompare(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  let ver = 'A'; let list = MASUK; let x = 120;
  const LISTS = [MASUK, [15, 12], [101], [], HAMPIR, TERBALIK];
  const draw = () => {
    const v = verOf(ver); const isCari = v[2] === 'cari';
    const out = (id) => (isCari ? jalanCari(x, id).keluaran : keluaranSisip(list, id));
    const a = out('benar'); const b = out(ver);
    const code = (id) => pyCode(isCari ? cariOf(id) : sisipOf(id), { labels: isCari ? L2 : L1, cls: 'uc-kecil', warn: id === 'benar' ? [] : [v[3]] });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Versi kode berdampingan'),
      el('div', { class: 'seg uc-pilih' }, VERSI.slice(1).map(([id, label]) => onTap(el('button', { class: `seg-btn ${ver === id ? 'on' : ''}`, type: 'button' }, label), () => { ver = id; draw(); }))),
      isCari ? el('div', { class: 'seg uc-pilih' }, [114, 103, 101, 120, 125, 100].map((q) => onTap(el('button', { class: `seg-btn ${x === q ? 'on' : ''}`, type: 'button' }, `cari_biner(antrean, ${q})`), () => { x = q; draw(); })))
        : el('div', { class: 'seg uc-pilih' }, LISTS.map((l) => onTap(el('button', { class: `seg-btn ${list === l ? 'on' : ''}`, type: 'button' }, pyRepr(l)), () => { list = l; draw(); }))),
      el('div', { class: 'uc-dua' }, el('div', null, el('p', { class: 'uc-judul' }, 'versi benar'), code('benar'), el('p', { class: 'uc-hasil' }, a)), el('div', null, el('p', { class: 'uc-judul' }, v[1]), code(ver), el('p', { class: `uc-hasil ${a === b ? '' : 'beda'}` }, b))),
      el('p', { class: `reveal ${a === b ? 'info' : 'bad'}` }, a === b ? 'Keluarannya sama: masukan ini belum membongkar bug.' : 'Keluarannya berbeda: masukan ini membongkar bug.'));
  };
  draw();
}

// Parse a typed list of whole numbers; nothing typed is stored.
export const parseList = (t) => { const m = String(t).trim().replace(/^\[|\]$/g, ''); if (!m.trim()) return []; const xs = m.split(/[\s,]+/).filter(Boolean); if (xs.length > 10 || !xs.every((s) => /^-?\d{1,4}$/.test(s))) return null; return xs.map(Number); };

// Team mode: one team hides an off-by-one change; the others test until an output differs.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  const BUGS = VERSI.slice(1); const MAX = 8;
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(3, nT); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Bongkar Selisih Satu selesai', pts, again: () => pickTeams(wrap, 'Bongkar Selisih Satu', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih perubahan diam-diam (tim lain jangan melihat)`), el('div', { class: 'uc-bank' }, BUGS.map(([id, label]) => onTap(el('button', { class: 'uc-kartu', type: 'button' }, el('b', null, label.split(':')[0]), el('small', null, label.split(': ')[1] || label)), () => { ctx.sound.tap(); hunt(boss, id); }))));
    }
    function hunt(boss, id) {
      const hunters = Array.from({ length: nT }, (_, i) => i).filter((i) => i !== boss); let turn = 0; let used = 0; const log = []; let x = 114; let teks = '104, 101, 105';
      const finish = (msg) => { const v = verOf(id); wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, v[1]), pyCode(v[2] === 'cari' ? cariOf(id) : sisipOf(id), { labels: v[2] === 'cari' ? L2 : L1, cls: 'uc-kecil', warn: [v[3]] }), el('p', { class: 'reveal' }, msg), button('Lanjut ➜', () => { t++; step(); }, 'primary')); };
      const test = (kind) => {
        const who = hunters[turn % hunters.length]; let call; let a; let b;
        if (kind === 'sisip') { const l = parseList(teks); if (!l) { draw('Tulis paling banyak 10 bilangan bulat dipisah koma, misalnya 104, 101, 105.', 'bad'); return; } call = `urut_sisip(${pyRepr(l)})`; a = keluaranSisip(l, 'benar'); b = keluaranSisip(l, id); }
        else { call = `cari_biner(antrean, ${x})`; a = jalanCari(x, 'benar').keluaran; b = jalanCari(x, id).keluaran; }
        used++; const beda = a !== b; log.push({ who, call, a, b, beda });
        if (beda) { const p = Math.max(1, 6 - used); pts[who] += p; ctx.sound.good(); return finish(`Bug terbongkar oleh Tim ${who + 1} setelah ${used} uji: +${p}.`); }
        if (used >= MAX) { pts[boss] += 3; return finish(`Bug lolos dari ${MAX} uji: Tim ${boss + 1} +3.`); }
        turn++; ctx.sound.tap(); draw('Keluarannya sama. Bug belum terbongkar.');
      };
      const draw = (msg = '', cls = 'info') => {
        const who = hunters[turn % hunters.length];
        const input = el('input', { class: 'uc-input', type: 'text', inputmode: 'numeric', value: teks, 'aria-label': 'masukan urut_sisip', autocomplete: 'off', oninput: (e) => { teks = e.target.value; } });
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: uji ke-${used + 1} dari ${MAX}`),
          el('div', { class: 'uc-dua' }, el('div', { class: 'uc-uji' }, el('small', null, 'urut_sisip( [ … ] )'), input, button('▶ Uji urut_sisip', () => test('sisip'), 'primary'), el('small', null, 'cari_biner(antrean, x)'), el('div', { class: 'uc-baris' }, stepper(x, (v) => { x = v; }, { min: 90, max: 130, label: 'x' }), button('▶ Uji cari_biner', () => test('cari'), 'primary'))),
            el('table', { class: 'uc-tabel' }, el('tr', null, ['tim', 'panggilan', 'versi benar', 'versi rahasia'].map((h) => el('th', null, h))), log.map((g) => el('tr', { class: g.beda ? 'beda' : '' }, el('td', null, `Tim ${g.who + 1}`), el('td', null, el('code', null, g.call)), el('td', null, g.a), el('td', null, g.b))))),
          listView(ANTREAN, { idx: true }), el('p', { class: `reveal ${cls}` }, msg || 'Masukan hanya tampil di layar dan tidak disimpan.'));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Bongkar Selisih Satu', start);
}
