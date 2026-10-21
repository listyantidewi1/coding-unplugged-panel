// Fungsi dan Ruang Lingkup — SMA/SMK (16–18 tahun), coding. A class duty
// roster written as five copied blocks (with the Kamis copy-paste bug),
// refactored into a function, print versus return (the missing return gives
// None), the call stack of frames, local versus global (UnboundLocalError and
// two fixes), and judging code quality before and after refactoring.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyTracer, pyCode } from './smp-kit.js';
import { runPy, pyRepr, makePyRunner } from './mini-py.js';

export const SISWA = ['Ayu', 'Bima', 'Citra', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hana', 'Iwan', 'Joko'];
export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const S1 = `siswa = [${SISWA.map((s) => `"${s}"`).join(', ')}]`;
const hariLine = (sabtu) => `hari_sekolah = [${[...HARI, ...(sabtu ? ['Sabtu'] : [])].map((h) => `"${h}"`).join(', ')}]`;
// Versi awal: one block per day; kamis = the remainder written on line 16 (bug: 2).
export const ORIG = ({ kamis = 2, sabtu = false } = {}) => { const n = sabtu ? 6 : 5; const days = sabtu ? [...HARI, 'Sabtu'] : HARI;
  return [S1, ...days.flatMap((h, k) => [`print("== ${h} ==")`, 'for i in range(len(siswa)):', `    if i % ${n} == ${h === 'Kamis' ? kamis : k}:`, '        print("-", siswa[i])'])]; };
// Versi ringkas (R1–R8) with the four blanks filled.
export const RIGHT = { r2: 'urutan', r3: 'hari', r5: 'urutan', r8: 'hari_sekolah[u], u' };
export const RING = (b = RIGHT, sabtu = false) => [S1, hariLine(sabtu), `def tampilkan_piket(hari, ${b.r2}):`, `    print("==", ${b.r3}, "==")`, '    for i in range(len(siswa)):', `        if i % len(hari_sekolah) == ${b.r5}:`, '            print("-", siswa[i])', 'for u in range(len(hari_sekolah)):', `    tampilkan_piket(${b.r8})`];
export const RL = ['1', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
export const BLANKS = [['r2', 'R2: parameter kedua', ['urutan', 'u', 'siswa', 'i']], ['r3', 'R3: yang dicetak di antara ==', ['hari', '"hari"', 'hari_sekolah', 'urutan']], ['r5', 'R5: dibandingkan dengan sisa bagi', ['urutan', 'u', 'hari', 'i']], ['r8', 'R8: argumen pemanggilan', ['hari_sekolah[u], u', 'u, hari_sekolah[u]', 'hari, urutan', 'hari_sekolah, u']]];
export const PETUGAS = (ret = true) => [S1, hariLine(false), 'def petugas(urutan):', '    hasil = []', '    for i in range(len(siswa)):', '        if i % len(hari_sekolah) == urutan:', '            hasil.append(siswa[i])', ...(ret ? ['    return hasil'] : []), 'regu_kamis = petugas(3)', 'print(regu_kamis, len(regu_kamis))'];
export const KL = (ret = true) => ['1', 'R1', 'K1', 'K2', 'K3', 'K4', 'K5', ...(ret ? ['K6'] : []), 'K7', 'K8'];
export const POIN = ['def poin(tugas):', '    if tugas == "menyapu":', '        return 2', '    elif tugas == "mengepel":', '        return 3', '    else:', '        return 1', '', 'def poin_regu(daftar_tugas):', '    total = 0', '    for t in daftar_tugas:', '        total = total + poin(t)', '    return total', '', 'total = 100', 'hasil = poin_regu(["menyapu", "mengepel", "menghapus papan"])', 'print(hasil, total)'];
export const BL = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', '', 'B8', 'B9', 'B10', 'B11', 'B12', '', 'B13', 'B14', 'B15'];
export const GLOBAL = (ver = 'galat') => (ver === 'global' ? ['total_tugas = 0', 'def tambah_tugas(n):', '    global total_tugas', '    total_tugas = total_tugas + n', 'tambah_tugas(3)', 'tambah_tugas(2)', 'print(total_tugas)']
  : ver === 'return' ? ['def tambah(total_lama, n):', '    return total_lama + n', '', 'total_tugas = 0', 'total_tugas = tambah(total_tugas, 3)', 'total_tugas = tambah(total_tugas, 2)', 'print(total_tugas)']
    : ['total_tugas = 0', 'def tambah_tugas(n):', '    total_tugas = total_tugas + n', 'tambah_tugas(3)', 'tambah_tugas(2)', 'print(total_tugas)']);
export const GL = (ver = 'galat') => (ver === 'galat' ? ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'] : null);
export const JADWAL = [S1, hariLine(false), 'def buat_jadwal(siswa, hari_sekolah):', '    jadwal = {}', '    for hari in hari_sekolah:', '        jadwal[hari] = []', '    for i in range(len(siswa)):', '        hari = hari_sekolah[i % len(hari_sekolah)]', '        jadwal[hari].append(siswa[i])', '    return jadwal', '',
  'def semua_dapat_piket(jadwal, siswa):', '    for nama in siswa:', '        banyak = 0', '        for hari in jadwal:', '            if nama in jadwal[hari]:', '                banyak = banyak + 1', '        if banyak != 1:', '            return False', '    return True'];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, ...o });
// Day → names from a roster printout ("== Senin ==", "- Ayu", …).
export function parseJadwal(out) { const j = {}; let h = null; for (const t of out) { const m = t.match(/^== (\w+) ==$/); if (m) { h = m[1]; j[h] = []; } else if (h) j[h].push(t.slice(2)); } return j; }
export const dayText = (j, days) => days.map((h) => `${h} ${j[h].join(', ') || '-'}`).join('; ');
// Snapshot of the frame stack at the first time a given line runs.
export function stackAt(lines, line) { const ru = makePyRunner(lines, { limit: 20000 }); for (const y of ru.gen) if (y.line === line) return frames(ru.state); return null; }
export const frames = (st) => [...st.frames.map((f) => [f.name, Object.entries(f.vars)]).reverse(), ['program utama (global)', Object.entries(st.vars).filter(([, v]) => !(v && v.py === 'fn'))]];
const stackCards = (fr) => el('div', { class: 'fl-tumpukan' }, el('small', null, 'Tumpukan bingkai (paling atas = sedang berjalan)'), fr.map(([n, vs], k, a) => el('div', { class: `fl-bingkai ${k === a.length - 1 ? 'global' : ''} ${k === 0 && a.length > 1 ? 'atas' : ''}` }, el('b', null, n), el('div', null, vs.length ? vs.map(([v, x]) => el('span', null, `${v} = ${pyRepr(x, true)}`)) : el('em', null, 'belum ada variabel')))));
const stackView = (st) => stackCards(frames(st));
const stackTracer = (lines, labels, o = {}) => pyTracer(lines, { cls: 'fl-jejak', speed: 420, labels, opts: { limit: 20000 }, hideVars: Object.keys(run(lines).vars).concat(['siswa', 'hari_sekolah']), extra: stackView, ...o });

export default {
  id: 'sma-38-fungsi-lingkup',
  title: 'Fungsi dan Ruang Lingkup Variabel',
  topic: 'Fungsi Python dengan parameter dan return, None dari fungsi tanpa return, bingkai fungsi dan tumpukan pemanggilan, variabel lokal dan global, UnboundLocalError, serta refaktor kode yang berulang',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🧹',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Temukan bug salin-tempel di program jadwal piket, ringkas menjadi fungsi, bedakan menampilkan dan mengembalikan, telusuri tumpukan bingkai fungsi, lalu perbaiki galat variabel lokal dan global.',
  extraModes: [
    { id: 'tumpukan', icon: '📚', label: 'Tumpukan Pemanggilan', desc: 'Setiap pemanggilan fungsi menambah bingkai berisi parameter dan variabel lokal, dan bingkai hilang saat return', create: createStack },
    { id: 'ringkas', icon: '✂️', label: 'Peringkas Kode', desc: 'Warnai blok yang berulang, susun versi ringkas, lalu bandingkan keluaran dan banyak barisnya', create: createRingkas },
    { id: 'bug', icon: '🐞', label: 'Sakelar Bug', desc: 'Nyalakan bug Kamis, hapus K6, atau jalankan program lokal-global, dan lihat galat beserta barisnya', create: createBug },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Ringkas Program', desc: 'Setiap tim mendapat program berulang dan memilih versi ringkasnya. Poin untuk keluaran yang sama dan baris paling sedikit', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act fungsi-lingkup' });
    root.append(wrap);
    const O = run(ORIG()); const J = parseJadwal(O.out); const Ofix = run(ORIG({ kamis: 3 }));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const names = (h) => J[h].join(', ');
      if (r === 0) { wrap.append(pyCode(ORIG(), { cls: 'fl-kecil fl-kolom2' }));
        rowsChoose(wrap, ctx, { prompt: 'Program jadwal piket (versi awal): keluarannya', cls: 'fl-isi', rows: [['sn', 'Senin', [names('Senin'), 'Ayu, Bima', 'Ayu', 'Fajar, Ayu'].sort(), names('Senin')], ['rb', 'Rabu', [names('Rabu'), 'Dodi, Iwan', 'Citra', 'Eka, Joko'].sort(), names('Rabu')], ['km', 'Kamis', [names('Kamis'), 'Dodi, Iwan', 'Eka, Joko', 'tidak ada'].sort(), names('Kamis'), 'Sama dengan Rabu.']], done: next }); }
      else if (r === 1) { const all = Object.values(J).flat(); const never = SISWA.filter((s) => !all.includes(s)).join(' dan '); const twice = SISWA.filter((s) => all.filter((x) => x === s).length > 1).join(' dan ');
        wrap.append(pyCode(ORIG(), { cls: 'fl-kecil fl-kolom2' }));
        rowsChoose(wrap, ctx, { prompt: 'Bug salin-tempel', cls: 'fl-isi', rows: [['n', 'Tidak pernah piket', [never, 'Eka dan Joko', 'Citra dan Hana', 'semua dapat'], never], ['t', 'Piket dua kali', [twice, 'Dodi dan Iwan', 'Ayu dan Fajar', 'tidak ada'], twice], ['b', 'Baris penyebab', ['baris 16: seharusnya i % 5 == 3', 'baris 12: seharusnya i % 5 == 3', 'baris 14: seharusnya "== Rabu =="', 'baris 20: seharusnya i % 5 == 3'], 'baris 16: seharusnya i % 5 == 3', 'Blok Kamis disalin dari Rabu, tetapi angkanya lupa diganti.']], done: next }); }
      else if (r === 2) { wrap.append(pyCode(ORIG({ kamis: 3 }), { cls: 'fl-kecil fl-kolom2', hl: [3, 7, 11, 15, 19] }));
        rowsChoose(wrap, ctx, { prompt: 'Menambah piket hari Sabtu di versi awal', cls: 'fl-isi', rows: [['u', 'Baris yang diubah', ['baris 4, 8, 12, 16, 20: % 5 menjadi % 6', 'hanya baris 20', 'baris 1', 'baris 3, 7, 11, 15, 19'], 'baris 4, 8, 12, 16, 20: % 5 menjadi % 6'], ['t', 'Yang ditambah', ['satu blok empat baris untuk Sabtu dengan i % 6 == 5', 'satu baris print("== Sabtu ==")', 'satu blok dengan i % 5 == 5', 'tidak perlu menambah apa pun'], 'satu blok empat baris untuk Sabtu dengan i % 6 == 5', 'Sembilan tempat yang bisa salah ketik.']], done: next }); }
      else if (r === 3) { const R = run(RING()); const same = R.out.join('\n') === Ofix.out.join('\n');
        wrap.append(pyCode(RING({ r2: '……', r3: '……', r5: '……', r8: '……' }), { labels: RL, cls: 'fl-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Meringkas menjadi fungsi: isi bagian kosong', cls: 'fl-isi', rows: BLANKS.map(([k, t, o]) => [k, t, o, RIGHT[k]]), done: then(() => { wrap.append(el('p', { class: 'prompt' }, same ? 'Keluaran versi ringkas sama dengan versi awal yang diperbaiki' : 'Keluaran berbeda'), el('div', { class: 'fl-dua' }, el('div', null, el('small', null, `Versi awal (diperbaiki), ${ORIG().length} baris`), el('pre', { class: 'fl-keluaran' }, Ofix.out.join('\n'))), el('div', null, el('small', null, `Versi ringkas, ${RING().length} baris`), el('pre', { class: 'fl-keluaran' }, R.out.join('\n'))))); setTimeout(next, 2600); }) }); }
      else if (r === 4) { const S6 = parseJadwal(run(RING(RIGHT, true)).out); const days6 = [...HARI, 'Sabtu']; const right = dayText(S6, days6);
        rowsChoose(wrap, ctx, { prompt: 'Versi ringkas', cls: 'fl-isi', rows: [['n', 'Banyak pemanggilan tampilkan_piket', ['5 kali', '1 kali', '10 kali', '4 kali'], '5 kali'], ['4', 'Parameter pada pemanggilan keempat', ['hari = "Kamis", urutan = 3', 'hari = "Kamis", urutan = 4', 'hari = "Jumat", urutan = 3', 'hari = 3, urutan = "Kamis"'], 'hari = "Kamis", urutan = 3'], ['s', 'Menambah Sabtu: yang diubah', ['hanya R1', 'R1 dan R5', 'R5 dan R8', 'semua baris'], 'hanya R1'],
          ['j', 'Jadwal dengan Sabtu', [right, dayText(J, HARI) + '; Sabtu -', 'Senin Ayu, Gita; Selasa Bima, Hana; Rabu Citra, Iwan; Kamis Dodi, Joko; Jumat Eka, Fajar; Sabtu -', 'Senin Ayu, Fajar; Selasa Bima, Gita; Rabu Citra, Hana; Kamis Dodi, Iwan; Jumat Eka; Sabtu Joko'].sort(), right]], done: next }); }
      else if (r === 5) { const K = run(PETUGAS());
        wrap.append(pyCode(PETUGAS(), { labels: KL(), cls: 'fl-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Menampilkan atau mengembalikan', cls: 'fl-isi', rows: [['a', 'Keluaran K8', [K.out[0], "['Citra', 'Hana'] 2", "['Eka', 'Joko'] 2", "['Dodi'] 1"], K.out[0]], ['b', 'Mengapa tampilkan_piket tidak bisa dipakai menghitung?', ['ia hanya menampilkan ke layar dan tidak mengembalikan apa pun', 'ia memakai print dua kali', 'ia tidak punya parameter', 'ia memakai for'], 'ia hanya menampilkan ke layar dan tidak mengembalikan apa pun']], done: next }); }
      else if (r === 6) { const N = run(PETUGAS(false));
        const tr = stackTracer(PETUGAS(false), KL(false), { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Nadia lupa K6', cls: 'fl-isi', rows: [['g', 'Galatnya', [N.error.text, 'NameError: name \'hasil\' is not defined', 'SyntaxError: invalid syntax', 'tidak ada galat'], N.error.text], ['i', 'Isi regu_kamis', ['None', '[]', "['Dodi', 'Iwan']", '0'], pyRepr(N.vars.regu_kamis, true)], ['m', 'Mengapa galat baru di K8?', ['fungsi tanpa return diam-diam mengembalikan None; galat baru muncul saat len() dipakai pada None', 'Python membaca program dari bawah', 'K7 salah ketik', 'K6 masih dijalankan'], 'fungsi tanpa return diam-diam mengembalikan None; galat baru muncul saat len() dipakai pada None', 'Letak galat tidak selalu sama dengan letak bugnya.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Tanpa K6: jalankan sampai galat'), tr); }
      else if (r === 7) { const st = stackAt(POIN, 2);
        wrap.append(pyCode(POIN, { labels: BL, cls: 'fl-kecil', hl: [2] }));
        rowsChoose(wrap, ctx, { prompt: 'Tumpukan bingkai tepat saat B3 dijalankan pertama kali', cls: 'fl-isi', rows: [['p', 'poin (paling atas)', ['tugas = "menyapu"', 'tugas = "mengepel"', 'tugas = "menyapu", total = 0', 'daftar_tugas = [...]'], 'tugas = "menyapu"'], ['r', 'poin_regu', ['daftar_tugas = [...3 tugas], total = 0, t = "menyapu"', 'daftar_tugas = [...3 tugas], total = 2, t = "menyapu"', 'total = 100', 'daftar_tugas = [...3 tugas]'], 'daftar_tugas = [...3 tugas], total = 0, t = "menyapu"'], ['g', 'program utama (global)', ['total = 100 (hasil belum ada)', 'total = 100, hasil = 6', 'total = 0', 'kosong'], 'total = 100 (hasil belum ada)']],
          done: then(() => { wrap.append(el('p', { class: 'prompt' }, 'Begini tumpukannya saat B3'), stackCards(st)); setTimeout(next, 3200); }) }); }
      else if (r === 8) { const P = run(POIN); let b5 = null; let b12 = null; let made = 0; { const ru = makePyRunner(POIN, { limit: 20000 }); let depth = 0; for (const y of ru.gen) { const d = ru.state.frames.length; if (d === 2 && depth < 2) made++; depth = d; const pr = ru.state.frames.find((f) => f.name === 'poin_regu'); if (y.line === 4 && b5 === null) b5 = pr.vars.total; if (y.line === 12) b12 = pr.vars.total; } }
        const tr = stackTracer(POIN, BL, { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Bingkai fungsi', cls: 'fl-isi', rows: [['5', 'total di poin_regu saat B5', [String(b5), '0', '3', '100'], String(b5)], ['12', 'total di poin_regu saat B12', [String(b12), '100', '106', '3'], String(b12), '2 + 3 + 1.'], ['n', 'Bingkai poin dibuat', [`${made} kali`, '1 kali', '2 kali', '6 kali'], `${made} kali`, 'Sekali untuk setiap tugas, lalu hilang setelah return.'], ['o', 'Keluaran B15', [P.out[0], '6 6', '106 100', '6 0'], P.out[0]], ['w', 'Mengapa total global tetap 100?', ['total di poin_regu adalah variabel lokal di bingkainya sendiri, walaupun namanya sama', 'Python lupa mengubahnya', 'karena total ditulis sesudah fungsi', 'karena return menghapus semua variabel'], 'total di poin_regu adalah variabel lokal di bingkainya sendiri, walaupun namanya sama']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program poin piket: jalankan dan amati tumpukannya'), tr); }
      else { const G = run(GLOBAL()); const G1 = run(GLOBAL('global')); const G2 = run(GLOBAL('return'));
        wrap.append(pyCode(GLOBAL(), { labels: GL(), cls: 'fl-kecil', warn: [2] }), el('p', { class: 'fl-galat' }, G.error.text));
        rowsChoose(wrap, ctx, { prompt: 'Lokal dan global', cls: 'fl-isi', rows: [['a', 'Artinya', ['G3 memberi nilai kepada total_tugas, jadi ia lokal di seluruh fungsi; ruas kanan membacanya sebelum punya nilai', 'total_tugas global belum dibuat', 'n tidak dikirim', 'fungsi dipanggil dua kali'], 'G3 memberi nilai kepada total_tugas, jadi ia lokal di seluruh fungsi; ruas kanan membacanya sebelum punya nilai'], ['f1', 'Perbaikan dengan global (keluaran)', [`global total_tugas di awal fungsi → ${G1.out[0]}`, `global total_tugas di G1 → ${G1.out[0]}`, 'global total_tugas di awal fungsi → 3'], `global total_tugas di awal fungsi → ${G1.out[0]}`], ['f2', 'Perbaikan tanpa global (keluaran)', [`return total_lama + n, lalu total_tugas = tambah(total_tugas, 3) → ${G2.out[0]}`, 'return n saja → 2', 'print(total_tugas + n) → 5'], `return total_lama + n, lalu total_tugas = tambah(total_tugas, 3) → ${G2.out[0]}`], ['b', 'Yang lebih baik', ['parameter dan return: tidak diam-diam mengubah data di luar dan mudah diuji', 'global: lebih pendek', 'keduanya sama saja'], 'parameter dan return: tidak diam-diam mengubah data di luar dan mudah diuji']],
          done: then(() => { const T = run([...JADWAL, 'j = buat_jadwal(siswa, hari_sekolah)', 'ok = semua_dapat_piket(j, siswa)', `jb = {${HARI.map((h) => `"${h}": [${J[h].map((x) => `"${x}"`).join(', ')}]`).join(', ')}}`, 'bug = semua_dapat_piket(jb, siswa)']);
            rowsChoose(wrap, ctx, { prompt: 'Menilai kualitas kode dan Tantangan', cls: 'fl-isi', rows: [['l', 'Banyak baris: versi awal · versi ringkas', [`${ORIG().length} · ${RING().length}`, '21 · 8', '20 · 9', '9 · 21'], `${ORIG().length} · ${RING().length}`, 'Baris 1 ditambah R1–R8.'], ['s', 'Tempat diubah untuk Sabtu: awal · ringkas', ['5 baris diubah dan 4 ditambah · satu baris (R1)', '1 baris · 1 baris', '5 baris · 5 baris', '4 baris · R1 dan R8'], '5 baris diubah dan 4 ditambah · satu baris (R1)'], ['k', 'Kekurangan versi ringkas', ['tampilkan_piket membaca variabel global siswa dan hari_sekolah', 'terlalu pendek', 'tidak memakai for', 'memakai print'], 'tampilkan_piket membaca variabel global siswa dan hari_sekolah', 'Lebih baik keduanya menjadi parameter.'], ['t', 'semua_dapat_piket: jadwal benar · jadwal ber-bug', [`${pyRepr(T.vars.ok)} · ${pyRepr(T.vars.bug)}`, 'True · True', 'False · False', 'False · True'], `${pyRepr(T.vars.ok)} · ${pyRepr(T.vars.bug)}`, 'Citra muncul dua kali, Dodi tidak muncul.']], done: next }); }) }); }
    }
    render();
  },
};

function versionMode(root, title, VERS, make) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  let ver = VERS[0][0]; let tr = null;
  const draw = () => { tr?.stop?.(); const v = VERS.find((x) => x[0] === ver); tr = make(v);
    wrap.replaceChildren(el('p', { class: 'prompt' }, title), el('div', { class: 'seg fl-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr); };
  draw();
}

function createStack(root) {
  versionMode(root, 'Tumpukan pemanggilan', [['poin', 'poin piket (B1–B15)', POIN, BL], ['k', 'petugas(3)', PETUGAS(), KL()], ['k6', 'petugas tanpa K6', PETUGAS(false), KL(false)], ['g', 'lokal-global (galat)', GLOBAL(), GL()], ['gg', 'dengan global', GLOBAL('global'), null], ['gr', 'dengan parameter dan return', GLOBAL('return'), null], ['r', 'versi ringkas', RING(), RL]], (v) => stackTracer(v[2], v[3]));
}

function createBug(root) {
  const OUT = (lines, labels) => { const R = run(lines); const e = R.error; return el('div', { class: 'fl-bug-hasil' }, pyCode(lines, { labels, cls: 'fl-kecil', warn: e ? [e.line] : [] }), el('div', null, el('small', null, 'Keluaran'), el('pre', { class: 'fl-keluaran' }, R.out.join('\n') || ' '), e ? el('p', { class: 'fl-galat' }, `Baris ${labels?.[e.line] ?? e.line + 1}: ${e.text}`) : el('p', { class: 'fl-beres' }, 'Tanpa galat.'))); };
  versionMode(root, 'Sakelar bug', [['kb', 'bug Kamis menyala', () => OUT(ORIG(), null)], ['kf', 'bug Kamis diperbaiki', () => OUT(ORIG({ kamis: 3 }), null)], ['k6', 'K6 dihapus', () => OUT(PETUGAS(false), KL(false))], ['k', 'dengan K6', () => OUT(PETUGAS(), KL())], ['g', 'soal 5: tanpa global', () => OUT(GLOBAL(), GL())], ['gg', 'soal 5: global', () => OUT(GLOBAL('global'), null)], ['gr', 'soal 5: return', () => OUT(GLOBAL('return'), null)]], (v) => v[2]());
}

function createRingkas(root, ctx) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  const pick = { r2: '……', r3: '……', r5: '……', r8: '……' }; let sabtu = false; let warna = {}; let hasil = null;
  const draw = () => {
    const orig = ORIG({ kamis: 3, sabtu });
    const code = pyCode(orig, { cls: 'fl-kecil', onLine: (i) => { if (i === 0) return; const b = Math.floor((i - 1) / 4); warna[b] = ((warna[b] ?? -1) + 1) % 3; draw(); } });
    [...code.children].forEach((li, i) => { if (i > 0) { const b = Math.floor((i - 1) / 4); if (warna[b] !== undefined) li.classList.add(`fl-warna${warna[b]}`); if ((i - 1) % 4 === 2) li.classList.add('fl-beda'); } });
    const filled = Object.values(pick).every((x) => x !== '……');
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Peringkas kode'),
      el('div', { class: 'seg fl-versi' }, [[false, 'lima hari'], [true, 'tambah Sabtu']].map(([v, t]) => onTap(el('button', { class: `seg-btn ${sabtu === v ? 'on' : ''}`, type: 'button' }, t), () => { sabtu = v; hasil = null; draw(); }))),
      el('div', { class: 'fl-dua' },
        el('div', null, el('small', null, `Versi awal (Kamis sudah diperbaiki): ${orig.length} baris. Ketuk blok untuk mewarnainya.`), code),
        el('div', null, el('small', null, `Versi ringkas: ${RING(pick, sabtu).length} baris`), pyCode(RING(pick, sabtu), { labels: RL, cls: 'fl-kecil', hl: sabtu ? [1] : [] }),
          el('div', { class: 'fl-kartu' }, BLANKS.map(([k, t, opts]) => el('div', { class: 'fl-pilih' }, el('small', null, t), el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: `seg-btn ${pick[k] === o ? 'on' : ''}`, type: 'button' }, o), () => { pick[k] = o; hasil = null; draw(); })))))),
          button('▶ Jalankan dan bandingkan', () => { const A = run(orig); const B = run(RING(pick, sabtu)); hasil = { a: A.out, b: B.out, e: B.error, same: !B.error && A.out.join('\n') === B.out.join('\n') }; if (hasil.same) ctx.sound.good(); else ctx.sound.bad(); draw(); }, filled ? 'primary' : ''))),
      ...(hasil ? [el('div', { class: 'fl-dua' }, el('pre', { class: 'fl-keluaran' }, hasil.a.join('\n')), el('pre', { class: 'fl-keluaran' }, hasil.b.join('\n') + (hasil.e ? `\n${hasil.e.text}` : '')))] : []),
      el('p', { class: `reveal ${hasil ? (hasil.same ? '' : 'bad') : 'info'}` }, hasil ? (hasil.same ? `Keluaran sama. ${orig.length} baris menjadi ${RING(pick, sabtu).length} baris.${sabtu ? ' Untuk Sabtu, versi ringkas hanya mengubah R1.' : ''}` : 'Keluaran berbeda. Periksa bagian kosongnya.') : 'Pilih isi setiap bagian kosong, lalu jalankan.'));
  };
  draw();
}

// Repetitive programs for the team mode, each with three candidate refactors.
export const TUGAS = [
  ['Konversi suhu', ['c = 30', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")', 'c = 25', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")', 'c = 100', 'f = c * 9 // 5 + 32', 'print(c, "C =", f, "F")'],
    [['def ke_f(c):', '    print(c, "C =", c * 9 // 5 + 32, "F")', 'for c in [30, 25, 100]:', '    ke_f(c)'], ['def ke_f(c):', '    f = c * 9 // 5 + 32', '    print(c, "C =", f, "F")', 'ke_f(30)', 'ke_f(25)', 'ke_f(100)'], ['def ke_f(c):', '    f = c * 9 / 5 + 32', '    print(c, "C =", f, "F")', 'for c in [30, 25, 100]:', '    ke_f(c)']]],
  ['Rekap nilai', ['mtk = [80, 90, 70]', 'print("Matematika", sum(mtk) // len(mtk))', 'ipa = [85, 75, 95]', 'print("IPA", sum(ipa) // len(ipa))', 'ips = [60, 80, 70]', 'print("IPS", sum(ips) // len(ips))'],
    [['def rata(nama, nilai):', '    print(nama, sum(nilai) // len(nilai))', 'rata("Matematika", [80, 90, 70])', 'rata("IPA", [85, 75, 95])', 'rata("IPS", [60, 80, 70])'], ['def rata(nilai):', '    return sum(nilai) // len(nilai)', 'mtk = [80, 90, 70]', 'print("Matematika", rata(mtk))', 'ipa = [85, 75, 95]', 'print("IPA", rata(ipa))', 'ips = [60, 80, 70]', 'print("IPS", rata(ips))'], ['nilai = [80, 90, 70]', 'def rata(nama):', '    print(nama, sum(nilai) // len(nilai))', 'rata("Matematika")', 'rata("IPA")', 'rata("IPS")']]],
  ['Diskon kantin', ['harga = 12000', 'print("Nasi goreng", harga - harga * 10 // 100)', 'harga = 8000', 'print("Mi ayam", harga - harga * 10 // 100)', 'harga = 5000', 'print("Es teh", harga - harga * 10 // 100)'],
    [['def diskon(nama, harga):', '    print(nama, harga - harga * 10 // 100)', 'diskon("Nasi goreng", 12000)', 'diskon("Mi ayam", 8000)', 'diskon("Es teh", 5000)'], ['def potong(harga):', '    return harga * 10 // 100', 'harga = 12000', 'print("Nasi goreng", harga - potong(harga))', 'harga = 8000', 'print("Mi ayam", harga - potong(harga))', 'harga = 5000', 'print("Es teh", harga - potong(harga))'], ['def diskon(nama, harga):', '    print(nama, harga * 10 // 100)', 'diskon("Nasi goreng", 12000)', 'diskon("Mi ayam", 8000)', 'diskon("Es teh", 5000)']]],
  ['Presensi ekstrakurikuler', ['print("Pramuka: hadir", 25, "dari", 30)', 'print("Persen:", 25 * 100 // 30)', 'print("PMR: hadir", 18, "dari", 20)', 'print("Persen:", 18 * 100 // 20)', 'print("Paskibra: hadir", 12, "dari", 16)', 'print("Persen:", 12 * 100 // 16)'],
    [['def rekap(ekskul, hadir, anggota):', '    print(ekskul + ": hadir", hadir, "dari", anggota)', '    print("Persen:", hadir * 100 // anggota)', 'rekap("Pramuka", 25, 30)', 'rekap("PMR", 18, 20)', 'rekap("Paskibra", 12, 16)'], ['def persen(hadir, anggota):', '    print("Persen:", hadir * 100 // anggota)', 'print("Pramuka: hadir", 25, "dari", 30)', 'persen(25, 30)', 'print("PMR: hadir", 18, "dari", 20)', 'persen(18, 20)', 'print("Paskibra: hadir", 12, "dari", 16)', 'persen(12, 16)'], ['def rekap(ekskul, hadir, anggota):', '    print(ekskul + ": hadir", hadir, "dari", anggota)', '    print("Persen:", anggota * 100 // hadir)', 'rekap("Pramuka", 25, 30)', 'rekap("PMR", 18, 20)', 'rekap("Paskibra", 12, 16)']]],
];
// Points for a candidate: 1 when its output matches, +1 when it is also the shortest matching one.
export function nilaiRingkas(task, k) { const [, orig, cands] = task; const want = run(orig).out.join('\n'); const ok = cands.map((c) => { const R = run(c); return !R.error && R.out.join('\n') === want; }); const best = Math.min(...cands.filter((_, i) => ok[i]).map((c) => c.length)); return ok[k] ? 1 + (cands[k].length === best ? 1 : 0) : 0; }

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act fungsi-lingkup' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(4, nT * 2); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Ringkas Program selesai', pts, again: () => pickTeams(wrap, 'Ringkas Program', start) }); return; }
      const team = t % nT; const task = TUGAS[t % TUGAS.length]; const [name, orig, cands] = task; const order = ctx.rand.shuffle([0, 1, 2]);
      const msg = el('p', { class: 'reveal info' }, `Tim ${team + 1}: pilih versi ringkas yang keluarannya sama dan barisnya paling sedikit.`);
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `${name}: ${orig.length} baris berulang`), el('div', { class: 'fl-dua' }, el('div', null, pyCode(orig, { cls: 'fl-kecil' })), el('pre', { class: 'fl-keluaran' }, run(orig).out.join('\n'))),
        el('div', { class: 'fl-calon' }, order.map((k, j) => onTap(el('button', { class: 'fl-calon-btn', type: 'button' }, el('b', null, `Versi ${'ABC'[j]} · ${cands[k].length} baris`), pyCode(cands[k], { cls: 'fl-kecil' })), () => {
          if (wrap.querySelector('.fl-calon.beres')) return;
          const p = nilaiRingkas(task, k); pts[team] += p; if (p) ctx.sound.good(); else ctx.sound.bad();
          const R = run(cands[k]); wrap.querySelector('.fl-calon').classList.add('beres');
          wrap.querySelectorAll('.fl-calon-btn')[j].append(el('pre', { class: `fl-keluaran ${p ? '' : 'beda'}` }, R.out.join('\n')));
          say(msg, p ? '' : 'bad', p === 2 ? `Keluaran sama dan paling ringkas: Tim ${team + 1} +2.` : p === 1 ? `Keluaran sama, tetapi ada versi yang lebih ringkas: Tim ${team + 1} +1.` : 'Keluarannya berbeda, jadi refaktor ini mengubah hasil: 0 poin.');
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); t++; setTimeout(step, 3600);
        }))), msg);
    }
    step();
  }
  pickTeams(wrap, 'Ringkas Program', start);
}
