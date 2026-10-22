// Tumpukan dan Antrean dalam Kode — SMA/SMK (16–18 tahun), coding. Stack and
// queue as Python classes: the OSIS minutes app with undo and redo, the
// puskesmas queue, a bracket checker, list.pop(0) versus deque.popleft() (fixed
// worksheet times), encapsulation, and a queue made of two stacks.
// All programs run in mini-py; an undo on an empty stack shows a message.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy, makePyRunner, pyRepr } from './mini-py.js';

export const TUMPUKAN = ['class Tumpukan:', '    def __init__(self):', '        self.isi = []', '    def taruh(self, x):', '        self.isi.append(x)', '    def ambil(self):', '        return self.isi.pop()', '    def puncak(self):', '        return self.isi[-1]', '    def kosong(self):', '        return len(self.isi) == 0'];
export const CATATAN = ['class Catatan:', '    def __init__(self):', '        self.teks = ""', '        self.riwayat = Tumpukan()', '    def ketik(self, kata):', '        self.riwayat.taruh(self.teks)', '        self.teks = self.teks + kata', '    def hapus(self, n):', '        self.riwayat.taruh(self.teks)', '        self.teks = self.teks[:-n]', '    def urungkan(self):', '        if not self.riwayat.kosong():', '            self.teks = self.riwayat.ambil()'];
export const PERINTAH = ['c = Catatan()', 'c.ketik("Rapat ")', 'c.ketik("OSIS ")', 'c.ketik("hari Senin")', 'c.hapus(5)', 'c.ketik("Rabu")', 'c.urungkan()', 'c.urungkan()', 'print(c.teks)'];
export const PROG1 = [...TUMPUKAN, ...CATATAN, ...PERINTAH];
// Undo and redo, as in the key of soal 2.
export const ULANGI = ['class Catatan:', '    def __init__(self):', '        self.teks = ""', '        self.riwayat = Tumpukan()', '        self.ulang = Tumpukan()', '    def ketik(self, kata):', '        self.riwayat.taruh(self.teks)', '        self.ulang = Tumpukan()', '        self.teks = self.teks + kata', '    def hapus(self, n):', '        self.riwayat.taruh(self.teks)', '        self.ulang = Tumpukan()', '        self.teks = self.teks[:-n]', '    def urungkan(self):', '        if not self.riwayat.kosong():', '            self.ulang.taruh(self.teks)', '            self.teks = self.riwayat.ambil()', '    def ulangi(self):', '        if not self.ulang.kosong():', '            self.riwayat.taruh(self.teks)', '            self.teks = self.ulang.ambil()'];
export const ANTREAN = ['class Antrean:', '    def __init__(self):', '        self.isi = []', '    def datang(self, x):', '        self.isi.append(x)', '    def layani(self):', '        return self.isi.pop(0)', '    def kosong(self):', '        return len(self.isi) == 0'];
export const KURUNG = ['PASANGAN = {")": "(", "]": "[", "}": "{"}', 'def kurung_seimbang(rumus):', '    t = Tumpukan()', '    for k in rumus:', '        if k in "([{":', '            t.taruh(k)', '        elif k in ")]}":', '            if t.kosong() or t.ambil() != PASANGAN[k]:', '                return False', '    return t.kosong()'];
export const KURUNG_DODI = KURUNG.map((x, i) => (i === 7 ? '            if t.ambil() != PASANGAN[k]:' : i === 9 ? '    return True' : x));
export const DUA = ['class AntreanDuaTumpukan:', '    def __init__(self):', '        self.masuk = Tumpukan()', '        self.keluar = Tumpukan()', '    def datang(self, x):', '        self.masuk.taruh(x)', '    def layani(self):', '        if self.keluar.kosong():', '            while not self.masuk.kosong():', '                self.keluar.taruh(self.masuk.ambil())', '        return self.keluar.ambil()', '    def kosong(self):', '        return self.masuk.kosong() and self.keluar.kosong()'];
export const RUMUS = ['(2 + 3]', '((2 + 3)', '2 + 3)', '{[()]}', '([)]', ''];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// Run a program and copy chosen values after given top-level lines (objects change in place, so read live).
export function potret(lines, at, read) {
  const r = makePyRunner(lines, { limit: 50000 }); const out = {}; let g;
  do { g = r.gen.next(); if (g.done) break; if (!r.state.frames.length && at.includes(g.value.line)) out[g.value.line] = read(r.state.vars); } while (!r.state.error);
  return { out, st: r.state };
}
const isi = (o) => [...o.attrs.isi];
const err = (st) => (st.error ? `${st.error.type}: ${st.error.message}` : null);
export const cekKurung = (rumus, dodi = false) => { const R = runPy([...TUMPUKAN, ...(dodi ? KURUNG_DODI : KURUNG), `x = kurung_seimbang(${JSON.stringify(rumus)})`], { limit: 20000 }); return R.error ? `${R.error.type}: ${R.error.message}` : pyRepr(R.vars.x); };
// Brackets step by step for the animation: [char, stack after, mismatch?].
export function langkahKurung(rumus, dodi = false) {
  const PAS = { ')': '(', ']': '[', '}': '{' }; const t = []; const steps = [];
  for (const k of rumus) {
    if ('([{'.includes(k)) { t.push(k); steps.push({ k, t: [...t], ok: true }); }
    else if (')]}'.includes(k)) {
      if (!dodi && !t.length) { steps.push({ k, t: [...t], ok: false, msg: 'tumpukan kosong saat bertemu kurung tutup' }); return { steps, hasil: 'False' }; }
      if (dodi && !t.length) { steps.push({ k, t: [...t], ok: false, msg: 'ambil() pada tumpukan kosong' }); return { steps, hasil: 'IndexError: pop from empty list' }; }
      const top = t.pop(); if (top !== PAS[k]) { steps.push({ k, t: [...t], ok: false, msg: `${top} tidak berpasangan dengan ${k}` }); return { steps, hasil: 'False' }; }
      steps.push({ k, t: [...t], ok: true });
    }
  }
  return { steps, hasil: dodi ? 'True' : t.length ? 'False' : 'True', sisa: t };
}

// Worksheet timing table (Python 3.13), milliseconds.
export const WAKTU = [[50000, 214, 1.8], [100000, 874, 3.7], [200000, 3585, 8.0]];

export default {
  id: 'sma-45-tumpukan-kode',
  title: 'Tumpukan dan Antrean dalam Kode',
  topic: 'Tumpukan dan antrean sebagai kelas Python: fitur urungkan dan ulangi, antrean loket, pemeriksa tanda kurung, list.pop(0) dan deque.popleft(), serta enkapsulasi',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🥞',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri kelas Tumpukan pada fitur urungkan catatan rapat, tambahkan fitur ulangi, layani antrean puskesmas, periksa tanda kurung, lalu bandingkan list.pop(0) dengan deque.',
  extraModes: [
    { id: 'catatan', icon: '📝', label: 'Aplikasi Catatan', desc: 'Ketik, hapus, urungkan, dan ulangi, sambil melihat tumpukan riwayat dan ulang', create: createNotes },
    { id: 'kurung', icon: '🧮', label: 'Pemeriksa Tanda Kurung', desc: 'Ketik rumus dan lihat setiap tanda kurung masuk atau keluar dari tumpukan, juga pada versi Dodi', create: createBrackets },
    { id: 'geser', icon: '🚶', label: 'pop(0) dan popleft()', desc: 'Lihat semua pasien bergeser setiap kali pop(0) dijalankan, sedangkan popleft() hanya memindahkan penanda depan', create: createShift },
    { id: 'giliran', icon: '🔮', label: 'Tebak Isi Akhir', desc: 'Satu tim menyusun delapan operasi pada tumpukan atau antrean, tim lain menebak isi akhirnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tumpukan-kode' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const code1 = (extra = {}) => pyCode(PROG1, { cls: 'tk-kecil tk-kolom2', ...extra });
      if (r === 0) {
        const at = PERINTAH.map((_, i) => TUMPUKAN.length + CATATAN.length + i).slice(1, 8);
        const P = potret(PROG1, at, (v) => ({ teks: v.c.attrs.teks, isi: isi(v.c.attrs.riwayat) })).out;
        wrap.append(code1());
        rowsChoose(wrap, ctx, { prompt: 'Setelah setiap baris: c.teks · c.riwayat.isi (dari bawah ke atas)', cls: 'tk-isi', info: 'Baris 26: "Rapat " · [""]', rows: at.slice(1).map((L, k) => { const p = P[L]; const prev = P[at[k]]; const right = `${pyRepr(p.teks, true)} · ${pyRepr(p.isi)}`;
          const alt = [`${pyRepr(prev.teks, true)} · ${pyRepr(p.isi)}`, `${pyRepr(p.teks, true)} · ${pyRepr(prev.isi)}`, `${pyRepr(p.teks, true)} · ${pyRepr([...p.isi, p.teks])}`];
          return [`b${L}`, `Baris ${L + 1}`, [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4), right]; }), done: next });
      }
      else if (r === 1) {
        const out = runPy(PROG1, { limit: 20000 }).out[0];
        const noCheck = [...TUMPUKAN, ...CATATAN.map((x, i) => (i === 11 ? null : i === 12 ? '        self.teks = self.riwayat.ambil()' : x)).filter((x) => x !== null), ...PERINTAH.slice(0, 6), ...Array(6).fill('c.urungkan()')];
        const P = potret(noCheck, noCheck.map((_, i) => i).slice(-6), (v) => v.c.attrs.teks);
        const lima = Object.values(P.out).map((x) => pyRepr(x, true)).join(', ');
        wrap.append(code1({ warn: [TUMPUKAN.length + 11] }));
        rowsChoose(wrap, ctx, { prompt: 'Keluaran dan pemeriksaan kosong()', cls: 'tk-isi', rows: [
          ['o', 'Keluaran baris 33', [out, 'Rapat OSIS hari Rabu', 'Rapat OSIS hari ', 'Rapat OSIS '], out],
          ['u', 'Tanpa baris 23: lima urungkan pertama', [lima, '"Rapat OSIS hari Rabu", "Rapat OSIS hari ", "Rapat OSIS ", "Rapat ", ""', '"Rapat ", "Rapat OSIS ", "Rapat OSIS hari ", "Rapat OSIS hari Senin", "Rapat OSIS hari Rabu"', '"", "", "", "", ""'], lima],
          ['e', 'Tekanan keenam', [err(P.st), 'teks menjadi ""', 'tidak terjadi apa-apa', "IndexError: list index out of range"], err(P.st)],
          ['k', 'Mengapa kosong() diperiksa di dalam kelas Catatan?', ['setiap program yang memakai Catatan otomatis aman; cukup satu pemakai lupa, aplikasinya berhenti', 'agar programnya lebih pendek', 'karena Python melarang pemeriksaan di luar kelas', 'agar riwayat tidak pernah kosong'], 'setiap program yang memakai Catatan otomatis aman; cukup satu pemakai lupa, aplikasinya berhenti'],
          ['m', 'Kekurangan menyimpan salinan seluruh teks', ['memori: 500 aksi pada catatan panjang berarti 500 salinan; bisa disimpan aksinya saja', 'teksnya menjadi salah', 'urungkan menjadi lambat sekali', 'tidak ada kekurangan'], 'memori: 500 aksi pada catatan panjang berarti 500 salinan; bisa disimpan aksinya saja']], done: next });
      }
      else if (r === 2) {
        const lines = [...TUMPUKAN, ...ULANGI, ...PERINTAH.slice(0, 8), 'c.ulangi()', 'c.ketik("Kamis")', 'c.ulangi()'];
        const n = lines.length; const P = potret(lines, [n - 4, n - 3, n - 2, n - 1], (v) => ({ teks: v.c.attrs.teks, ulang: isi(v.c.attrs.ulang) })).out;
        wrap.append(pyCode(ULANGI, { cls: 'tk-kecil tk-kolom2', hl: [4, 7, 11, 15, 17, 18, 19, 20] }));
        rowsChoose(wrap, ctx, { prompt: 'Fitur ulangi: tumpukan kedua self.ulang', cls: 'tk-isi', rows: [
          ['s', 'Isi self.ulang setelah baris 32', [pyRepr(P[n - 4].ulang), '["Rapat OSIS hari "]', '[]', '["Rapat OSIS hari Senin", "Rapat OSIS "]'], pyRepr(P[n - 4].ulang)],
          ['a', 'c.ulangi()', [pyRepr(P[n - 3].teks, true), "'Rapat OSIS hari Rabu'", "'Rapat OSIS hari Senin'", "'Rapat OSIS '"], pyRepr(P[n - 3].teks, true)],
          ['b', 'c.ketik("Kamis")', [pyRepr(P[n - 2].teks, true), "'Rapat OSIS hari Rabu Kamis'", "'Rapat OSIS hari SeninKamis'", "'Kamis'"], pyRepr(P[n - 2].teks, true)],
          ['c', 'c.ulangi() sekali lagi', [`tidak berubah: ${pyRepr(P[n - 1].teks, true)}`, "'Rapat OSIS hari Rabu'", "'Rapat OSIS hari '", 'IndexError: pop from empty list'], `tidak berubah: ${pyRepr(P[n - 1].teks, true)}`],
          ['w', 'Mengapa aksi baru mengosongkan tumpukan ulangi?', ['isinya dari "masa depan" yang sudah ditinggalkan; ulangi bisa menimpa "Kamis" dengan "Rabu"', 'agar memori hemat saja', 'karena Tumpukan tidak bisa menyimpan teks', 'agar urungkan tidak bisa dipakai lagi'], 'isinya dari "masa depan" yang sudah ditinggalkan; ulangi bisa menimpa "Kamis" dengan "Rabu"']], done: next });
      }
      else if (r === 3) {
        const ops = ['q = Antrean()', 'q.datang(101)', 'q.datang(102)', 'q.datang(104)', 'x1 = q.layani()', 'q.datang(105)', 'x2 = q.layani()', 'q.datang(107)', 'x3 = q.layani()', 'x4 = q.layani()'];
        const R = runPy([...ANTREAN, ...ops], { limit: 5000 }); const served = [1, 2, 3, 4].map((i) => R.vars[`x${i}`]).join(', '); const sisa = pyRepr(isi(R.vars.q));
        wrap.append(el('div', { class: 'tk-dua' }, pyCode(ANTREAN, { labels: lab(34, 9), cls: 'tk-kecil' }), queueView([101, 102, 104], { judul: 'q.isi di awal' })));
        rowsChoose(wrap, ctx, { prompt: 'datang(101), datang(102), datang(104), layani(), datang(105), layani(), datang(107), layani(), layani()', cls: 'tk-isi', rows: [
          ['s', 'Urutan yang dilayani', [served, '104, 105, 107, 102', '101, 104, 105, 107', '107, 105, 104, 102'], served],
          ['q', 'Isi q.isi di akhir', [sisa, '[101]', '[]', '[105, 107]'], sisa],
          ['b', 'Beda baris 7 dan baris 40', ['pop() mengambil yang terakhir (tumpukan), pop(0) yang pertama (antrean); keduanya menaruh dengan append', 'pop(0) lebih cepat', 'baris 40 menghapus semua isi', 'tidak ada bedanya'], 'pop() mengambil yang terakhir (tumpukan), pop(0) yang pertama (antrean); keduanya menaruh dengan append']], done: next });
      }
      else if (r === 4) {
        const f = '(2 + 3) * [4 - (1 + 1)]'; const S = langkahKurung(f);
        wrap.append(pyCode(KURUNG, { labels: lab(43, 10), cls: 'tk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: `kurung_seimbang("${f}"): isi t.isi setelah setiap tanda kurung`, cls: 'tk-isi', rows: [
          ...S.steps.map((s, i) => { const right = pyRepr(s.t); const alt = [pyRepr([...s.t, s.k]), pyRepr(s.t.slice(0, -1)), pyRepr(['(', '[']), pyRepr(['[', '(', '('])]; return [`k${i}`, `Tanda ke-${i + 1}: ${s.k}`, [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4), right]; }),
          ['h', 'Hasil', [cekKurung(f), 'False', 'None', 'IndexError: pop from empty list'], cekKurung(f)]], done: next });
      }
      else if (r === 5) {
        wrap.append(pyCode(KURUNG, { labels: lab(43, 10), cls: 'tk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Hasil kurung_seimbang', cls: 'tk-isi', rows: RUMUS.map((f, i) => [`r${i}`, `"${f}"`, ['True', 'False'], cekKurung(f)]), done: next });
      }
      else if (r === 6) {
        const d1 = cekKurung('((2 + 3)', true); const d2 = cekKurung('2 + 3)', true);
        wrap.append(el('div', { class: 'tk-dua' }, pyCode(KURUNG, { labels: lab(43, 10), cls: 'tk-kecil', warn: [7, 9] }), pyCode(KURUNG_DODI, { labels: lab(43, 10), cls: 'tk-kecil', warn: [7, 9] })));
        rowsChoose(wrap, ctx, { prompt: 'Versi Dodi (kanan): baris 50 tanpa t.kosong(), baris 52 return True', cls: 'tk-isi', rows: [
          ['a', 'Versi Dodi untuk "((2 + 3)"', [`${d1}, padahal salah: sisa "(" tidak pernah diperiksa`, 'False, sama dengan versi benar', 'IndexError: pop from empty list', 'None'], `${d1}, padahal salah: sisa "(" tidak pernah diperiksa`],
          ['b', 'Versi Dodi untuk "2 + 3)"', [d2, 'False', 'True', 'KeyError: \')\''], d2],
          ['c', 'Mengapa urutan t.kosong() or t.ambil() … penting?', ['or berhenti bila bagian kiri benar, jadi ambil() tidak dijalankan pada tumpukan kosong; bila ditukar, galat yang sama muncul', 'agar lebih cepat saja', 'karena or selalu memeriksa kedua bagian', 'urutannya tidak penting'], 'or berhenti bila bagian kiri benar, jadi ambil() tidak dijalankan pada tumpukan kosong; bila ditukar, galat yang sama muncul']], done: next });
      }
      else if (r === 7) {
        wrap.append(timeTable());
        rowsChoose(wrap, ctx, { prompt: 'Setiap pop(0) menggeser semua anggota sisanya satu tempat ke kiri', cls: 'tk-isi', rows: [
          ['a', 'Total geseran untuk 6 pasien · untuk n pasien', [`${geserTotal(6)} · n(n − 1)/2`, '6 · n', '36 · n²', '21 · n(n + 1)/2'], `${geserTotal(6)} · n(n − 1)/2`],
          ['b', 'Bila n digandakan: list.pop(0) · deque.popleft()', ['sekitar 4 kali · sekitar 2 kali lipat', 'sekitar 2 kali · sekitar 2 kali lipat', 'sekitar 4 kali · sekitar 4 kali lipat', 'sekitar 2 kali · tetap'], 'sekitar 4 kali · sekitar 2 kali lipat'],
          ['p', 'Pertumbuhan list.pop(0) untuk seluruh antrean', ['kuadrat, seperti perulangan tersembunyi', 'linear', 'n log n', 'tetap'], 'kuadrat, seperti perulangan tersembunyi']], done: next });
      }
      else if (r === 8) {
        const D = ['from collections import deque', ...ANTREAN.map((x, i) => (i === 2 ? '        self.isi = deque()' : i === 6 ? '        return self.isi.popleft()' : x))];
        const R = runPy([...D, 'q = Antrean()', 'q.datang(101)', 'q.datang(102)', 'x = q.layani()', 'print(x, q.isi, q.kosong())'], { limit: 2000 });
        wrap.append(el('div', { class: 'tk-dua' }, pyCode(D, { labels: ['', ...lab(34, 9)], cls: 'tk-kecil', warn: [0, 3, 7] }), el('pre', { class: 'tk-keluaran' }, R.out.join('\n'))));
        rowsChoose(wrap, ctx, { prompt: 'Antrean dengan deque', cls: 'tk-isi', rows: [
          ['c', 'Baris yang berubah', ['import di awal, baris 36 (deque()), dan baris 40 (popleft())', 'semua baris', 'hanya baris 38', 'baris 38 dan 42'], 'import di awal, baris 36 (deque()), dan baris 40 (popleft())'],
          ['d', 'Mengapa program loket tidak perlu diubah?', ['program loket hanya memakai metode datang, layani, dan kosong (enkapsulasi)', 'karena deque sama dengan list', 'karena program loket tidak memakai kelas', 'program loket harus diubah'], 'program loket hanya memakai metode datang, layani, dan kosong (enkapsulasi)'],
          ['e', `150 pasien sehari: ${fmtNum(geserTotal(150))} geseran`, ['list sudah cukup; deque penting untuk antrean ratusan ribu, tetapi tetap kebiasaan baik', 'deque wajib dipakai', 'list akan berhenti dengan galat', 'deque lebih lambat untuk 150 pasien'], 'list sudah cukup; deque penting untuk antrean ratusan ribu, tetapi tetap kebiasaan baik']], done: next });
      }
      else {
        const lines = [...TUMPUKAN, ...DUA, 'q = AntreanDuaTumpukan()', 'q.datang(1)', 'q.datang(2)', 'q.datang(3)', 'a = q.layani()', 'q.datang(4)', 'b = q.layani()', 'c = q.layani()', 'd = q.layani()'];
        const at = lines.length - 5; const P = potret(lines, [at], (v) => ({ m: isi(v.q.attrs.masuk), k: isi(v.q.attrs.keluar) })).out[at]; const R = runPy(lines, { limit: 5000 });
        const served = ['a', 'b', 'c', 'd'].map((k) => R.vars[k]).join(', ');
        wrap.append(pyCode(DUA, { cls: 'tk-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Tantangan: antrean dari dua tumpukan', cls: 'tk-isi', info: 'datang(1), datang(2), datang(3), layani(), datang(4), lalu tiga kali layani()', rows: [
          ['s', 'Yang dilayani', [served, '3, 2, 1, 4', '1, 2, 4, 3', '4, 3, 2, 1'], served],
          ['m', 'Setelah layani() yang pertama: masuk · keluar', [`${pyRepr(P.m)} · ${pyRepr(P.k)} (2 di puncak)`, '[2, 3] · []', '[] · [2, 3] (3 di puncak)', '[1, 2, 3] · []'], `${pyRepr(P.m)} · ${pyRepr(P.k)} (2 di puncak)`],
          ['w', 'Mengapa rata-rata layani() tetap cepat?', ['setiap anggota dipindahkan dari masuk ke keluar paling banyak sekali', 'karena tumpukan selalu kosong', 'karena layani() tidak memakai perulangan', 'karena memakai deque'], 'setiap anggota dipindahkan dari masuk ke keluar paling banyak sekali']], done: next });
      }
    }
    render();
  },
};

export const geserTotal = (n) => (n * (n - 1)) / 2;
const timeTable = () => el('table', { class: 'tk-tabel' }, el('tr', null, ['n', 'list.pop(0)', 'deque.popleft()'].map((h) => el('th', null, h))), WAKTU.map(([n, a, b]) => el('tr', null, el('td', null, fmtNum(n)), el('td', null, `${fmtNum(a)} ms`), el('td', null, `${fmtNum(b, 1)} ms`))));

// A stack drawn upright like plates (top at the top), and a queue drawn towards the counter.
export const stackView = (items, { judul = '', kosong = 'kosong', salah = -1 } = {}) => el('div', { class: 'tk-tumpuk' }, el('small', null, judul), el('div', { class: 'tk-piring' }, items.length ? [...items].map((x, i) => el('div', { class: `tk-kotak ${i === salah ? 'salah' : ''} ${i === items.length - 1 ? 'puncak' : ''}` }, typeof x === 'string' ? pyRepr(x, true) : pyRepr(x))).reverse() : el('i', null, kosong)), el('code', null, pyRepr(items)));
export const queueView = (items, { judul = '', depan = 0 } = {}) => el('div', { class: 'tk-antre' }, el('small', null, judul), el('div', { class: 'tk-baris' }, el('span', { class: 'tk-loket' }, '🏥 loket'), items.length ? items.map((x, i) => el('div', { class: `tk-kotak ${i < depan ? 'pergi' : ''} ${i === depan ? 'depan' : ''}` }, pyRepr(x))) : el('i', null, 'kosong')), el('code', null, pyRepr(items.slice(depan))));

// Mock minutes app: the real class runs in mini-py after every button.
function createNotes(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  const KATA = ['Rapat ', 'OSIS ', 'hari Senin', 'Rabu', 'Kamis', '!'];
  let cmds = []; let n = 5; let msg = 'Ketuk kata untuk mengetik.';
  const run = (cs) => { const R = runPy([...TUMPUKAN, ...ULANGI, 'c = Catatan()', ...cs], { limit: 50000 }); const c = R.vars.c; return { teks: c.attrs.teks, riw: isi(c.attrs.riwayat), ul: isi(c.attrs.ulang), err: R.error }; };
  const draw = () => {
    const s = run(cmds);
    const act = (cmd, text) => { cmds.push(cmd); msg = text; ctx.sound.tap(); draw(); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Aplikasi catatan rapat OSIS'),
      el('div', { class: 'tk-tiga' }, stackView(s.riw, { judul: 'c.riwayat' }), el('div', { class: 'tk-app' },
        el('div', { class: 'tk-layar' }, s.teks || el('i', null, '(catatan kosong)'), el('span', { class: 'tk-kursor' }, '▏')),
        el('div', { class: 'seg tk-kata' }, KATA.map((k) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `Ketik "${k}"`), () => act(`c.ketik(${JSON.stringify(k)})`, `c.ketik(${JSON.stringify(k)})`)))),
        el('div', { class: 'tk-atur' }, stepper(n, (v) => { n = v; }, { min: 1, max: 10, label: 'n' }), button('⌫ Hapus n huruf', () => act(`c.hapus(${n})`, `c.hapus(${n})`)),
          button('↶ Urungkan', () => { if (!s.riw.length) { msg = 'Tidak ada yang bisa diurungkan: tumpukan riwayat kosong.'; ctx.sound.bad(); draw(); return; } act('c.urungkan()', 'c.urungkan()'); }),
          button('↷ Ulangi', () => { if (!s.ul.length) { msg = 'Tidak ada yang bisa diulangi: tumpukan ulang kosong.'; ctx.sound.bad(); draw(); return; } act('c.ulangi()', 'c.ulangi()'); }),
          button('↺ Mulai lagi', () => { cmds = []; msg = 'Catatan baru.'; draw(); })),
        el('pre', { class: 'tk-keluaran' }, cmds.slice(-6).join('\n') || ' ')), stackView(s.ul, { judul: 'c.ulang' })),
      el('p', { class: `reveal ${msg.startsWith('Tidak ada') ? 'bad' : 'info'}` }, msg));
  };
  draw();
}

// Bracket checker with a typed formula (shown on screen only).
function createBrackets(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  let rumus = '(2 + 3) * [4 - (1 + 1)]'; let dodi = false; let k = 0; let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const draw = () => {
    const S = langkahKurung(rumus, dodi); const s = k > 0 ? S.steps[k - 1] : null; const end = k >= S.steps.length;
    let pos = -1; if (k > 0) { let c = 0; for (let i = 0; i < rumus.length; i++) if ('()[]{}'.includes(rumus[i]) && ++c === k) { pos = i; break; } }
    const input = el('input', { class: 'tk-input', type: 'text', value: rumus, maxlength: 40, 'aria-label': 'rumus', autocomplete: 'off', onchange: (e) => { rumus = e.target.value; k = 0; stop(); draw(); } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pemeriksa tanda kurung'),
      el('div', { class: 'tk-atur' }, input, el('div', { class: 'seg' }, [['benar', false], ['versi Dodi', true]].map(([t, v]) => onTap(el('button', { class: `seg-btn ${dodi === v ? 'on' : ''}`, type: 'button' }, t), () => { dodi = v; k = 0; stop(); draw(); })))),
      el('div', { class: 'seg tk-kata' }, RUMUS.map((f) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `"${f}"`), () => { rumus = f; k = 0; stop(); draw(); }))),
      el('div', { class: 'tk-rumus' }, [...rumus].map((c, i) => el('span', { class: `${'()[]{}'.includes(c) ? 'kurung' : ''} ${i === pos ? (s?.ok ? 'kini' : 'salah') : ''}` }, c === ' ' ? ' ' : c))),
      el('div', { class: 'tk-dua' }, stackView(s ? s.t : [], { judul: 't (tumpukan)' }), el('div', { class: 'tk-samping' },
        el('div', { class: 'kode-baris' }, button('▶ Langkah', () => { if (k < S.steps.length) { k++; draw(); } }, 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', () => { if (timer) { stop(); draw(); return; } timer = setInterval(() => { if (k >= S.steps.length) { stop(); draw(); return; } k++; draw(); }, 700); draw(); }), button('↺ Ulang', () => { k = 0; stop(); draw(); })),
        el('p', { class: 'tk-ket' }, s ? (s.ok ? `${s.k} → ${'([{'.includes(s.k) ? 'taruh' : 'ambil, pasangannya cocok'}` : `${s.k}: ${s.msg}`) : 'Ketuk Langkah.'),
        end ? el('p', { class: `reveal ${S.hasil === 'True' ? 'good' : 'bad'}` }, `kurung_seimbang("${rumus}") → ${cekKurung(rumus, dodi)}`) : el('p', { class: 'tk-ket' }, `${k} dari ${S.steps.length} tanda kurung`))),
      el('p', { class: 'tk-ket' }, 'Rumus hanya tampil di layar dan tidak disimpan.'));
  };
  draw();
  return () => stop();
}

// pop(0) shifts everyone left; popleft() only moves the front marker.
function createShift(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  let n = 6; let served = 0; let geser = 0; let mode = 'list';
  const draw = () => {
    const all = Array.from({ length: n }, (_, i) => 101 + i);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'pop(0) dan popleft()'),
      el('div', { class: 'tk-atur' }, el('div', { class: 'seg' }, [['list', 'list.pop(0)'], ['deque', 'deque.popleft()']].map(([m, t]) => onTap(el('button', { class: `seg-btn ${mode === m ? 'on' : ''}`, type: 'button' }, t), () => { mode = m; served = 0; geser = 0; draw(); }))), stepper(n, (v) => { n = v; served = 0; geser = 0; draw(); }, { min: 2, max: 12, label: 'pasien' })),
      mode === 'list' ? queueView(all.slice(served), { judul: 'self.isi (list): setiap kotak bergeser ke kiri' }) : queueView(all, { judul: 'self.isi (deque): hanya penanda depan yang pindah', depan: served }),
      el('div', { class: 'pk-row tk-atur' }, button('Layani satu', () => { if (served >= n) return; if (mode === 'list') geser += n - served - 1; served++; ctx.sound.tap(); draw(); }, 'primary'), button('Layani semua', () => { while (served < n) { if (mode === 'list') geser += n - served - 1; served++; } draw(); }), button('↺ Ulang', () => { served = 0; geser = 0; draw(); })),
      el('div', { class: 'tk-hitung' }, el('small', null, 'total geseran'), el('b', null, fmtNum(geser)), el('small', null, served >= n ? (mode === 'list' ? `semua dilayani: ${n}(${n} − 1)/2 = ${geserTotal(n)}` : 'semua dilayani tanpa geseran') : `${served} dari ${n} dilayani`)));
  };
  draw();
}

// Team mode: one team builds eight operations, the next team guesses the final contents.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tebak Isi Akhir selesai', pts, again: () => pickTeams(wrap, 'Tebak Isi Akhir', start) }); return; }
      const boss = t % nT; let jenis = 'tumpukan'; let ops = []; let nomor = 1;
      const draw = () => {
        const put = jenis === 'tumpukan' ? 'taruh' : 'datang'; const take = jenis === 'tumpukan' ? 'ambil' : 'layani';
        const hasil = simulate(jenis, ops);
        wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: susun ${ops.length} dari 8 operasi (tim lain jangan melihat)`),
          el('div', { class: 'seg' }, ['tumpukan', 'antrean'].map((j) => onTap(el('button', { class: `seg-btn ${jenis === j ? 'on' : ''}`, type: 'button' }, j), () => { jenis = j; ops = []; nomor = 1; draw(); }))),
          el('div', { class: 'tk-atur' }, button(`${put}(${nomor})`, () => { if (ops.length < 8) { ops.push(['+', nomor]); nomor++; draw(); } }, 'primary'), button(`${take}()`, () => { if (ops.length < 8 && hasil.isi.length) { ops.push(['-']); draw(); } }), button('⌫', () => { const o = ops.pop(); if (o && o[0] === '+') nomor--; draw(); })),
          el('pre', { class: 'tk-keluaran' }, opsText(jenis, ops) || ' '),
          ...(ops.length === 8 ? [button('Selesai ➜ giliran menebak', () => guess(boss, jenis, ops), 'primary')] : []));
      };
      draw();
    }
    function guess(boss, jenis, ops) {
      const who = (boss + 1) % nT; const S = simulate(jenis, ops); const right = pyRepr(S.isi);
      const nums = ops.filter((o) => o[0] === '+').map((o) => o[1]); const alt = [pyRepr(simulate(jenis === 'tumpukan' ? 'antrean' : 'tumpukan', ops).isi), pyRepr(nums.slice(0, S.isi.length)), pyRepr(nums.slice(-S.isi.length || nums.length)), pyRepr([...S.isi].reverse())];
      const opts = [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4); const shuffled = ctx.rand?.shuffle ? ctx.rand.shuffle(opts) : opts;
      const draw = (pick = null) => wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tebak isi akhir ${jenis} Tim ${boss + 1}`), el('pre', { class: 'tk-keluaran' }, opsText(jenis, ops)),
        pick == null ? el('div', { class: 'seg tk-kata' }, shuffled.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { if (o === right) { pts[who] += 2; ctx.sound.good(); } else ctx.sound.bad(); draw(o); })))
          : el('div', { class: 'tk-dua' }, jenis === 'tumpukan' ? stackView(S.isi, { judul: 'isi akhir' }) : queueView(S.isi, { judul: 'isi akhir' }), el('div', { class: 'tk-samping' }, el('p', { class: `reveal ${pick === right ? 'good' : 'bad'}` }, pick === right ? `Tepat: ${right}. +2` : `Belum tepat: ${pick}. Isi akhirnya ${right}.`), el('p', { class: 'tk-ket' }, `Yang diambil: ${S.keluar.join(', ') || '-'}`), button('Lanjut ➜', () => { t++; step(); }, 'primary'))));
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Isi Akhir', start);
}
const opsText = (jenis, ops) => ops.map((o) => (o[0] === '+' ? `${jenis === 'tumpukan' ? 't.taruh' : 'q.datang'}(${o[1]})` : `${jenis === 'tumpukan' ? 't.ambil' : 'q.layani'}()`)).join('\n');
// Runs the class from soal 1 or 3 in mini-py.
export function simulate(jenis, ops) {
  const lines = jenis === 'tumpukan' ? [...TUMPUKAN, 'w = Tumpukan()'] : [...ANTREAN, 'w = Antrean()']; const keluar = [];
  ops.forEach((o, i) => lines.push(o[0] === '+' ? `w.${jenis === 'tumpukan' ? 'taruh' : 'datang'}(${o[1]})` : `k${i} = w.${jenis === 'tumpukan' ? 'ambil' : 'layani'}()`));
  const R = runPy(lines, { limit: 5000 }); ops.forEach((o, i) => { if (o[0] === '-' && `k${i}` in R.vars) keluar.push(R.vars[`k${i}`]); });
  return { isi: R.vars.w ? isi(R.vars.w) : [], keluar };
}
