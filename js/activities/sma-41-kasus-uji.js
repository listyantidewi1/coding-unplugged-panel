// Kasus Uji Tiket Museum — SMA/SMK (16–18 tahun), coding. Testing a Python
// fare function: expected results from the rules (never from the code),
// equivalence classes, boundary values, two hidden bugs (age 60 and the
// holiday surcharge on free tickets), assert versus a table of cases, and
// writing tests first for the member discount. Team mode hunts mutants.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper, fmtNum } from './smp-kit.js';
import { runPy, pyRepr } from './mini-py.js';

// The rules, written independently of the code: expected result or null (None).
export function aturan(umur, pelajar, libur, anggota = false) {
  if (umur < 0 || umur >= 121) return null;
  const u = Math.floor(umur); let h = u < 5 ? 0 : u <= 12 ? 5000 : u >= 60 ? 7500 : pelajar ? 8000 : 15000;
  if (libur && h > 0) h += 2000; if (anggota) h = Math.floor(h / 2); return h;
}
const BODY = (o = {}) => [`def tarif(umur, pelajar, libur${o.anggota ? ', anggota=False' : ''}):`, `    if umur < 0 or ${o.l2 ?? 'umur > 120'}:`, '        return None', `    if ${o.l4 ?? 'umur < 5'}:`, '        harga = 0', `    elif ${o.l6 ?? 'umur <= 12'}:`, '        harga = 5000', `    elif ${o.l8 ?? 'umur >= 60'}:`, '        harga = 7500', '    elif pelajar:', '        harga = 8000', '    else:', '        harga = 15000', `    if ${o.l14 ?? 'libur and harga > 0'}:`, `        harga = harga + ${o.l15 ?? 2000}`, ...(o.anggota ? ['    if anggota:', '        harga = harga // 2'] : []), '    return harga'];
export const VERSI = [['asli', 'asli (dua bug)', BODY({ l8: 'umur > 60', l14: 'libur' })], ['fix8', 'baris 8 diperbaiki', BODY({ l14: 'libur' })], ['benar', 'kedua bug diperbaiki', BODY()], ['anggota', 'versi anggota (soal 6)', BODY({ anggota: true })]];
export const MUTAN = [['M1', 'batas gratis umur < 4', BODY({ l4: 'umur < 4' }), 3], ['M2', 'batas anak umur < 12', BODY({ l6: 'umur < 12' }), 5], ['M3', 'batas lansia umur > 60', BODY({ l8: 'umur > 60' }), 7], ['M4', 'tambahan libur untuk tiket gratis', BODY({ l14: 'libur' }), 13], ['M5', 'tambahan libur Rp200', BODY({ l15: 200 }), 14], ['M6', 'umur 120 ditolak', BODY({ l2: 'umur >= 120' }), 1], ['M7', 'umur 121 diterima', BODY({ l2: 'umur > 121' }), 1]];
export const codeOf = (id) => (VERSI.find((v) => v[0] === id) || MUTAN.find((v) => v[0] === id))[2];
const py = (v) => (v === null ? 'None' : String(v));
export const call = (u, p, l, a) => `tarif(${u}, ${p ? 'True' : 'False'}, ${l ? 'True' : 'False'}${a === undefined ? '' : `, ${a ? 'True' : 'False'}`})`;
// What a version actually returns (or its error text).
export function hasil(id, u, p, l, a) { const R = runPy([...codeOf(id), `x = ${call(u, p, l, a)}`], { limit: 2000 }); return R.error ? R.error.text : pyRepr(R.vars.x); }
export const SOAL1 = [['Pak Hendra, 41 tahun, hari Senin', 41, false, false], ['Bu Wulan, 38 tahun, kartu mahasiswa, hari Sabtu', 38, true, true], ['Dimas, 12 tahun, kartu pelajar, hari Minggu', 12, true, true], ['Mbah Karto, 75 tahun, tanggal merah', 75, false, true], ['Ara, 2 tahun, hari Rabu', 2, false, false], ['Petugas salah mengetik umur 210', 210, false, false]];
export const KELAS = [['tidak valid (terlalu kecil)', 'umur < 0', -5], ['gratis', '0–4', 3], ['anak', '5–12', 8], ['dewasa', '13–59', 30], ['lansia', '60–120', 70], ['tidak valid (terlalu besar)', 'umur > 120', 150]];
export const BATAS = [-1, 0, 4, 5, 12, 13, 59, 60, 120, 121];
export const UJI14 = [...SOAL1.map(([, u, p, l]) => [u, p, l]), ...KELAS.map(([, , u]) => [u, false, false]), [30, true, false], [30, false, true]];
export const KOMBI = [[3, false, true], [8, false, true], [30, true, true], [70, false, true]];
export const RUDI = ['def uji():', '    assert tarif(41, False, False) == 15000', '    assert tarif(60, False, False) == 7500, "lansia umur 60"', '    assert tarif(3, False, True) == 0', '    print("Semua uji lulus")', 'uji()'];
export const RINA = ['kasus = [', '    (41, False, False, 15000),', '    (60, False, False, 7500),', '    (3, False, True, 0),', '    (12, True, True, 7000),', ']', 'gagal = 0', 'for umur, pelajar, libur, harapan in kasus:', '    hasil = tarif(umur, pelajar, libur)', '    if hasil != harapan:', '        print("GAGAL:", umur, pelajar, libur, "hasil", hasil, "harapan", harapan)', '        gagal = gagal + 1', 'print(gagal, "dari", len(kasus), "uji gagal")'];
export const runWith = (id, lines) => runPy([...codeOf(id), ...lines], { limit: 20000 });
const rp = (v) => (v === null ? 'None' : `Rp${fmtNum(v)}`);
const NILAI = [null, 0, 2000, 5000, 7000, 7500, 8000, 9500, 10000, 15000, 17000];
const L16 = Array.from({ length: 16 }, (_, i) => String(i + 1));

// Table of test cases run on a version: [umur, pelajar, libur, (anggota)] → harapan, hasil, lulus.
export function testTable(id, cases, { anggota = false, harapan = null } = {}) {
  return el('table', { class: 'ku-tabel' }, el('tr', null, ['panggilan', 'harapan (aturan)', 'hasil fungsi', ''].map((h) => el('th', null, h))),
    cases.map((c, i) => { const want = harapan ? harapan[i] : aturan(...c); const got = hasil(id, ...c.slice(0, anggota ? 4 : 3)); const ok = got === py(want);
      return el('tr', { class: ok ? 'lulus' : 'gagal' }, el('td', null, el('code', null, call(...c.slice(0, anggota ? 4 : 3)))), el('td', null, py(want)), el('td', null, got), el('td', null, ok ? '✓ lulus' : '✗ gagal')); }));
}

export default {
  id: 'sma-41-kasus-uji',
  title: 'Kasus Uji Tiket Museum',
  topic: 'Pengujian program Python: hasil yang diharapkan dari aturan, kelas ekuivalensi, nilai batas, assert dan AssertionError, uji dalam bentuk tabel, uji kombinasi, uji regresi, dan menulis uji lebih dulu',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎟️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Hitung hasil yang diharapkan dari aturan tarif museum, pilih kelas ekuivalensi dan nilai batas, temukan dua bug fungsi tarif dengan uji, lalu tulis uji lebih dulu untuk potongan anggota.',
  extraModes: [
    { id: 'penguji', icon: '🧾', label: 'Penguji Otomatis', desc: 'Isi tabel kasus uji, pilih versi fungsi, lalu lihat kasus mana yang lulus dan gagal', create: createTester },
    { id: 'garis', icon: '📏', label: 'Garis Bilangan Umur', desc: 'Kelas ekuivalensi sebagai pita berwarna. Ketuk umur untuk menambah kasus uji dan lihat batas yang belum diuji', create: createLine },
    { id: 'giliran', icon: '🧬', label: 'Berburu Mutan', desc: 'Satu tim memilih fungsi mutan secara diam-diam, tim lain menulis kasus uji sampai ada yang gagal', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kasus-uji' });
    root.append(wrap);
    const rules = () => el('table', { class: 'ku-aturan' }, [['0–4 tahun', 'gratis'], ['5–12 tahun', 'Rp5.000'], ['13–59 tahun', 'Rp15.000'], ['13–59 dengan kartu pelajar/mahasiswa', 'Rp8.000'], ['60 tahun ke atas', 'Rp7.500'], ['hari libur, tiket berbayar', '+ Rp2.000'], ['umur < 0 atau > 120', 'None']].map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, b))));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opts = (want, extra = []) => [...new Set([py(want), ...extra.map(py)])].slice(0, 4);
      if (r === 0) { wrap.append(rules());
        rowsChoose(wrap, ctx, { prompt: 'Hasil yang diharapkan, dihitung dari aturan', cls: 'ku-isi', rows: SOAL1.map(([who, u, p, l], i) => { const w = aturan(u, p, l); const alt = { 0: [17000, 15000, 13000], 1: [8000, 17000, 15000], 2: [10000, 5000, 9500], 3: [7500, 17000, 9000], 4: [2000, 5000, null], 5: [0, 7500, 9500] }[i]; return [`s${i}`, `${who} · ${call(u, p, l)}`, opts(w, alt), py(w)]; }), done: next }); }
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Alasan di balik harapan', cls: 'ku-isi', rows: [['d', 'Mengapa Dimas bukan Rp10.000?', ['umur 12 masih tiket anak Rp5.000 (tarif pelajar hanya 13–59), ditambah Rp2.000 hari Minggu', 'kartu pelajar tidak berlaku hari Minggu', 'anak tidak bayar tambahan libur', 'Dimas mendapat potongan pelajar Rp3.000'], 'umur 12 masih tiket anak Rp5.000 (tarif pelajar hanya 13–59), ditambah Rp2.000 hari Minggu'], ['c', 'Mengapa harapan dihitung dari aturan, bukan dari program?', ['bila diambil dari keluaran program, uji selalu lulus karena program dibandingkan dengan dirinya sendiri', 'menjalankan program terlalu lama', 'program tidak bisa dijalankan sebelum diuji', 'aturan lebih mudah dibaca'], 'bila diambil dari keluaran program, uji selalu lulus karena program dibandingkan dengan dirinya sendiri']], done: next });
      else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Kelas ekuivalensi: rentang · harapan tarif(wakil, False, False)', cls: 'ku-isi', info: 'tidak valid (terlalu kecil): umur < 0 · None sudah diisi.', rows: KELAS.slice(1).map(([n, rg, u]) => { const w = aturan(u, false, false); const ranges = ['0–4', '5–12', '13–59', '60–120', 'umur > 120', '0–5', '13–60', '61–120']; const right = `${rg} · ${py(w)}`; const wrong = [`${ranges[(ranges.indexOf(rg) + 1) % 5]} · ${py(w)}`, `${rg} · ${py(w === null ? 0 : w + 2000)}`, `${{ '0–4': '0–5', '13–59': '13–60', '60–120': '61–120' }[rg] ?? '5–13'} · ${py(w)}`]; return [n, `${n} (wakil ${u})`, [...new Set([right, ...wrong])], right]; }), done: next });
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Kelas untuk masukan lain, dan banyak kombinasi', cls: 'ku-isi', rows: [['p', 'tarif(30, True, False)', opts(aturan(30, true, false), [15000, 10000, 5000]), py(aturan(30, true, false))], ['l', 'tarif(30, False, True)', opts(aturan(30, false, true), [15000, 10000, 2000]), py(aturan(30, false, true))], ['w', 'Mengapa satu wakil cukup?', ['semua umur dalam satu kelas diperlakukan sama oleh aturan, jadi kemungkinan besar kodenya juga', 'Python selalu benar untuk umur di tengah', 'karena menguji lebih banyak dilarang', 'karena wakil dipilih acak'], 'semua umur dalam satu kelas diperlakukan sama oleh aturan, jadi kemungkinan besar kodenya juga', '"Kemungkinan besar": anggapan ini runtuh bila batas di kode salah tulis.'], ['k', 'Kombinasi kelas valid × pelajar × libur · setiap umur 0–120', ['16 · 484', '8 · 121', '16 · 121', '6 · 484'], `${4 * 2 * 2} · ${121 * 2 * 2}`]], done: next });
      else if (r === 4) { const right = BATAS.join(', '); const hp = BATAS.map((u) => py(aturan(u, false, false))).join(', ');
        rowsChoose(wrap, ctx, { prompt: 'Nilai batas umur', cls: 'ku-isi', rows: [['u', 'Sepuluh nilai batas', [right, '-1, 0, 5, 6, 12, 13, 59, 60, 120, 121', '0, 4, 5, 12, 13, 59, 60, 120, 121, 122', '-5, 3, 8, 30, 70, 150, 0, 4, 5, 12'], right], ['h', 'Harapannya', [hp, 'None, 0, 0, 5000, 5000, 15000, 15000, 15000, 7500, None', 'None, 0, 5000, 5000, 15000, 15000, 7500, 7500, 7500, None', '0, 0, 0, 5000, 5000, 15000, 15000, 7500, 7500, 7500'], hp], ['b', 'Mengapa bug bersembunyi di batas?', ['"sampai" dan "ke atas" mudah tertukar menjadi < atau <=, dan salahnya hanya terlihat tepat di batas', 'nilai batas jarang dipakai pengunjung', 'Python menghitung batas dengan pecahan', 'batas selalu bernilai None'], '"sampai" dan "ke atas" mudah tertukar menjadi < atau <=, dan salahnya hanya terlihat tepat di batas']], done: next }); }
      else if (r === 5) { const fails = UJI14.filter((c) => hasil('asli', ...c) !== py(aturan(...c))).length;
        wrap.append(el('div', { class: 'ku-dua' }, pyCode(codeOf('asli'), { cls: 'ku-kecil' }), testTable('asli', UJI14)));
        rowsChoose(wrap, ctx, { prompt: 'Empat belas uji soal 1–2 pada fungsi asli', cls: 'ku-isi', rows: [['n', 'Uji yang gagal', ['0', '1', '2', '14'], String(fails)], ['b', 'Apakah fungsinya benar?', ['belum tentu: uji yang lulus hanya menunjukkan benar untuk masukan yang diuji', 'ya: semua uji lulus', 'tidak: fungsi pasti salah'], 'belum tentu: uji yang lulus hanya menunjukkan benar untuk masukan yang diuji', 'Pengujian dapat menunjukkan adanya bug, tetapi tidak pernah menunjukkan bahwa bug tidak ada.']], done: next }); }
      else if (r === 6) { const bad = BATAS.filter((u) => hasil('asli', u, false, false) !== py(aturan(u, false, false))); const u0 = bad[0];
        wrap.append(el('div', { class: 'ku-dua' }, pyCode(codeOf('asli'), { cls: 'ku-kecil', warn: [7] }), testTable('asli', BATAS.map((u) => [u, false, false]))));
        rowsChoose(wrap, ctx, { prompt: 'Sepuluh nilai batas pada fungsi asli', cls: 'ku-isi', rows: [['g', 'Uji yang gagal · hasil fungsi', [`tarif(${u0}, False, False) · ${hasil('asli', u0, false, false)}`, 'tarif(59, False, False) · 7500', 'tarif(120, False, False) · None', 'tarif(12, False, False) · 15000'], `tarif(${u0}, False, False) · ${hasil('asli', u0, false, false)}`], ['f', 'Baris bug · perbaikan', ['baris 8 · elif umur >= 60:', 'baris 8 · elif umur > 59.5:', 'baris 6 · elif umur < 12:', 'baris 2 · if umur < 0 or umur >= 120:'], 'baris 8 · elif umur >= 60:', 'Orang berumur tepat 60 dianggap dewasa.']], done: next }); }
      else if (r === 7) { const rows = KOMBI.map((c, i) => { const w = py(aturan(...c)); const g = hasil('fix8', ...c); const right = `${w} · ${g} · ${w === g ? 'ya' : 'tidak'}`; return [`k${i}`, call(...c), [...new Set([right, `${w} · ${w} · ya`, `${g} · ${g} · ya`, `${w} · ${Number(w) + 2000 || 2000} · tidak`])], right]; });
        wrap.append(pyCode(codeOf('fix8'), { cls: 'ku-kecil ku-kolom2' }));
        rowsChoose(wrap, ctx, { prompt: 'Uji kombinasi hari libur (baris 8 sudah diperbaiki): harapan · hasil · lulus', cls: 'ku-isi', rows,
          done: then(() => { const billed = Number(hasil('asli', 60, false, true)) + Number(hasil('asli', 2, false, true)); const should = aturan(60, false, true) + aturan(2, false, true);
            rowsChoose(wrap, ctx, { prompt: 'Bug kedua', cls: 'ku-isi', rows: [['b', 'Baris · perbaikan', ['baris 14 · if libur and harga > 0:', 'baris 15 · harga = harga + 0', 'baris 4 · if umur <= 5:', 'baris 14 · if not libur:'], 'baris 14 · if libur and harga > 0:'], ['w', 'Mengapa tidak tertangkap di soal 1–3?', ['tidak ada uji yang menggabungkan kelas gratis dengan hari libur', 'karena Ara datang hari Rabu dan itu sudah cukup', 'karena bug kedua hanya muncul untuk lansia', 'karena assert dimatikan'], 'tidak ada uji yang menggabungkan kelas gratis dengan hari libur'], ['e', 'Ara dan kakek (60) hari Minggu: ditagih · seharusnya', [`${rp(billed)} · ${rp(should)}`, `${rp(should)} · ${rp(should)}`, 'Rp17.000 · Rp9.500', 'Rp19.000 · Rp7.500'], `${rp(billed)} · ${rp(should)}`, 'Kakek dianggap dewasa (17.000) dan Ara ditagih 2.000.']], done: next }); }) }); }
      else if (r === 8) { const A = runWith('asli', RUDI); const B = runWith('fix8', RUDI); const C = runWith('asli', RINA);
        wrap.append(el('div', { class: 'ku-dua' }, pyCode(RUDI, { labels: ['17', '18', '19', '20', '21', '22'], cls: 'ku-kecil' }), pyCode(RINA, { labels: Array.from({ length: 13 }, (_, i) => `T${i + 1}`), cls: 'ku-kecil' })));
        rowsChoose(wrap, ctx, { prompt: 'Dua cara menulis uji (sebelum bug diperbaiki)', cls: 'ku-isi', rows: [['a', 'Rudi: baris terakhir yang tampil · baris 20 dijalankan?', [`${A.error.text} (baris ${(A.error.line + 1)}) · tidak`, `${A.error.text} (baris ${(A.error.line + 1)}) · ya`, 'Semua uji lulus · ya', 'AssertionError (baris 20) · ya'], `${A.error.text} (baris ${(A.error.line + 1)}) · tidak`], ['b', 'Bila baris 8 sudah diperbaiki', [`${B.error.text} di baris ${(B.error.line + 1)}, tanpa keterangan`, 'Semua uji lulus', `${A.error.text} di baris 19`, 'TypeError di baris 20'], `${B.error.text} di baris ${(B.error.line + 1)}, tanpa keterangan`],
          ['c', 'Keluaran program Rina', [C.out.join(' / '), `${C.out[0]} / 1 dari 4 uji gagal`, 'GAGAL: 60 False False hasil 15000 harapan 7500 / GAGAL: 12 True True hasil 7000 harapan 7000 / 2 dari 4 uji gagal', '0 dari 4 uji gagal'], C.out.join(' / ')], ['d', 'Kelebihan cara Rina', ['semua uji tetap dijalankan walaupun ada yang gagal, dan setiap kegagalan menampilkan masukan, hasil, dan harapan', 'lebih pendek', 'bisa dimatikan dengan python -O', 'tidak perlu harapan'], 'semua uji tetap dijalankan walaupun ada yang gagal, dan setiap kegagalan menampilkan masukan, hasil, dan harapan']], done: next }); }
      else { const T = runWith('benar', ['x = tarif(41, False, False, True)']); const N = ['assert tarif(41, False, False, True) == 7500', 'assert tarif(41, False, True, True) == 8500', 'assert tarif(70, False, True, True) == 4750', 'assert tarif(3, False, True, True) == 0']; const ok = runWith('anggota', [...N, 'assert tarif(60, False, False) == 7500', 'x = "lulus"']);
        rowsChoose(wrap, ctx, { prompt: 'Uji lebih dulu: potongan setengah harga untuk anggota', cls: 'ku-isi', rows: [['q', 'Pertanyaan yang perlu diajukan ke pengelola', ['apakah potongan dihitung sebelum atau sesudah tambahan hari libur?', 'apakah fungsi boleh ditulis dengan Python?', 'berapa umur pengelola museum?', 'apakah tiket dicetak berwarna?'], 'apakah potongan dihitung sebelum atau sesudah tambahan hari libur?'], ['a', 'assert yang benar menurut jawaban pengelola', [N[2], 'assert tarif(70, False, True, True) == 5750', 'assert tarif(70, False, True, True) == 9500', 'assert tarif(3, False, True, True) == 1000'], N[2], '(7.500 + 2.000) / 2 = 4.750.'], ['t', 'Dijalankan pada fungsi lama (tiga masukan)', [T.error.text, 'AssertionError', 'semua uji lulus', 'NameError: name \'anggota\' is not defined'], T.error.text, 'Uji yang gagal di awal memang diharapkan: uji itu menjadi target.'], ['d', 'Baris 1 yang membuat uji baru lulus dan uji lama tetap lulus', ['def tarif(umur, pelajar, libur, anggota=False):', 'def tarif(umur, pelajar, libur, anggota):', 'def tarif(anggota, umur, pelajar, libur):', 'def tarif(umur, pelajar, libur=False, anggota):'], 'def tarif(umur, pelajar, libur, anggota=False):', `Dengan harga = harga // 2: ${ok.error ? ok.error.text : 'semua uji baru dan uji lama lulus'} (uji regresi).`]],
          done: then(() => { const H = [4.5, 12.5, 59.5].map((u) => hasil('benar', u, false, false));
            rowsChoose(wrap, ctx, { prompt: 'Tantangan: umur pecahan pada fungsi yang sudah diperbaiki', cls: 'ku-isi', rows: [['h', 'tarif(4.5, …) · tarif(12.5, …) · tarif(59.5, …)', [H.join(' · '), '0 · 5000 · 15000', '5000 · 15000 · 7500', '0 · 5000 · 7500'], H.join(' · ')], ['k', 'Konsisten di setiap batas?', ['tidak: 12.5 ikut kelas lebih tua karena umur <= 12, sedangkan di batas lain pecahan ikut tahun penuhnya', 'ya: semua pecahan dibulatkan ke atas', 'ya: semua pecahan dibulatkan ke bawah'], 'tidak: 12.5 ikut kelas lebih tua karena umur <= 12, sedangkan di batas lain pecahan ikut tahun penuhnya', 'Perbaikan: elif umur < 13: dan umur >= 121.'], ['s', 'Umur dikirim sebagai teks "12"', [hasil('benar', '"12"', false, false), 'tarif mengembalikan 5000', 'tarif mengembalikan None', "ValueError: invalid literal for int() with base 10: '12'"], hasil('benar', '"12"', false, false)]], done: next }); }) }); }
    }
    render();
  },
};

// One editable test row: umur, pelajar, libur, (anggota), harapan chosen from chips.
function caseEditor(c, onChange, { anggota = false } = {}) {
  const tog = (k, label) => onTap(el('button', { class: `seg-btn ${c[k] ? 'on' : ''}`, type: 'button' }, `${label}: ${c[k] ? 'True' : 'False'}`), () => { c[k] = !c[k]; onChange(); });
  return el('div', { class: 'ku-baris' }, stepper(c.u, (v) => { c.u = v; onChange(true); }, { min: -5, max: 125, label: 'umur' }), tog('p', 'pelajar'), tog('l', 'libur'), anggota ? tog('a', 'anggota') : null,
    el('div', { class: 'ku-harapan' }, el('small', null, 'harapan'), el('div', { class: 'seg' }, [...NILAI, ...(anggota ? [2500, 3500, 3750, 4000, 4750, 8500] : [])].map((v) => onTap(el('button', { class: `seg-btn ${c.h === v && c.set ? 'on' : ''}`, type: 'button' }, py(v)), () => { c.h = v; c.set = true; onChange(); })))));
}

function createTester(root, ctx) {
  const wrap = el('div', { class: 'act kasus-uji' });
  root.append(wrap);
  let ver = 'asli'; const cases = [{ u: 41, p: false, l: false, a: false, h: 15000, set: true }, { u: 60, p: false, l: false, a: false, h: 7500, set: true }, { u: 3, p: false, l: true, a: false, h: 0, set: true }]; let edit = 0;
  const draw = () => {
    const ang = ver === 'anggota'; const id = ver;
    const rows = cases.map((c, i) => { const got = c.set ? hasil(id, c.u, c.p, c.l, ang ? c.a : undefined) : '…'; const ok = c.set && got === py(c.h); const rule = py(aturan(c.u, c.p, c.l, ang && c.a));
      return onTap(el('tr', { class: `${i === edit ? 'pilih' : ''} ${c.set ? (ok ? 'lulus' : 'gagal') : ''}` }, el('td', null, el('code', null, call(c.u, c.p, c.l, ang ? c.a : undefined))), el('td', null, c.set ? py(c.h) : '?', c.set && py(c.h) !== rule ? el('small', { class: 'ku-salah' }, ` (aturan: ${rule})`) : null), el('td', null, got), el('td', null, c.set ? (ok ? '✓' : '✗') : '')), () => { edit = i; draw(); }); });
    const failed = cases.filter((c) => c.set && hasil(id, c.u, c.p, c.l, ang ? c.a : undefined) !== py(c.h)).length;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penguji otomatis'), el('div', { class: 'seg ku-versi' }, VERSI.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'ku-dua' }, pyCode(codeOf(id), { cls: 'ku-kecil' }), el('div', null, el('table', { class: 'ku-tabel' }, el('tr', null, ['panggilan', 'harapan', 'hasil fungsi', ''].map((h) => el('th', null, h))), rows),
        el('p', { class: 'ku-ringkas' }, `${failed} dari ${cases.filter((c) => c.set).length} uji gagal`),
        cases[edit] ? caseEditor(cases[edit], (age) => { if (age) cases[edit].set = cases[edit].set; draw(); }, { anggota: ang }) : null,
        el('div', { class: 'sk-tombol' }, button('+ Kasus baru', () => { cases.push({ u: 30, p: false, l: false, a: false, h: null, set: false }); edit = cases.length - 1; draw(); }, 'primary'), button('Hapus kasus ini', () => { cases.splice(edit, 1); edit = Math.max(0, edit - 1); draw(); })))),
      el('p', { class: 'ku-ket' }, 'Harapan diisi dari aturan. Bila harapanmu berbeda dari aturan, layar memberi catatan.'));
  };
  draw();
}

const BANDS = [[-5, -1, 'tidak valid', '#94a3b8'], [0, 4, 'gratis', '#22c55e'], [5, 12, 'anak', '#3b82f6'], [13, 59, 'dewasa', '#f59e0b'], [60, 120, 'lansia', '#a855f7'], [121, 125, 'tidak valid', '#94a3b8']];
function createLine(root, ctx) {
  const wrap = el('div', { class: 'act kasus-uji' });
  root.append(wrap);
  const ages = new Set([3, 8, 30, 70]); let at = 30;
  const pos = (u) => `${((u + 5) / 130) * 100}%`;
  const draw = () => {
    const tested = (lo, hi) => [...ages].some((u) => u >= lo && u <= hi);
    const missing = BATAS.filter((u) => !ages.has(u));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Garis bilangan umur'),
      el('div', { class: 'ku-garis' }, BANDS.map(([lo, hi, n, c]) => el('div', { class: `ku-pita ${tested(lo, hi) ? 'diuji' : ''}`, style: { left: pos(lo - 0.5), width: `${((hi - lo + 1) / 130) * 100}%`, '--c': c } }, el('small', null, n))),
        [...ages].map((u) => el('i', { class: `ku-titik ${BATAS.includes(u) ? 'batas' : ''}`, style: { left: pos(u) }, title: `umur ${u}` })), [-5, 0, 5, 13, 60, 120, 125].map((u) => el('b', { class: 'ku-skala', style: { left: pos(u) } }, String(u)))),
      el('div', { class: 'ku-atur' }, stepper(at, (v) => { at = v; }, { min: -5, max: 125, label: 'umur' }), button('+ Tambah kasus uji', () => { ages.add(at); ctx.sound.tap(); draw(); }, 'primary'), button('Tambah semua nilai batas', () => { BATAS.forEach((u) => ages.add(u)); draw(); }), button('↺ Ulang', () => { ages.clear(); draw(); })),
      el('p', { class: 'ku-ringkas' }, `Kasus uji: ${[...ages].sort((a, b) => a - b).join(', ') || '-'}`),
      el('p', { class: `reveal ${missing.length ? 'info' : ''}` }, missing.length ? `Nilai batas yang belum diuji: ${missing.join(', ')}` : 'Semua kelas dan semua nilai batas sudah diuji.'),
      testTable('asli', [...ages].sort((a, b) => a - b).map((u) => [u, false, false])));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kasus-uji' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(3, nT); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Berburu Mutan selesai', pts, again: () => pickTeams(wrap, 'Berburu Mutan', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih mutan diam-diam (tim lain jangan melihat)`), el('div', { class: 'ku-mutan' }, MUTAN.map(([id, desc], k) => onTap(el('button', { class: 'ku-kartu', type: 'button' }, el('b', null, id), el('small', null, desc)), () => { ctx.sound.tap(); hunt(boss, k); }))));
    }
    function hunt(boss, k) {
      const [id, desc, code, line] = MUTAN[k]; const hunters = Array.from({ length: nT }, (_, i) => i).filter((i) => i !== boss); let turn = 0; let used = 0; const log = []; const c = { u: 30, p: false, l: false, h: null, set: false };
      const MAX = 8;
      const draw = (msg = '', cls = 'info') => {
        const who = hunters[turn % hunters.length];
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tulis kasus uji (${used} dari ${MAX})`), el('div', { class: 'ku-dua' }, pyCode(codeOf('benar').map((x, i) => (i === 0 ? x : '    ……')).slice(0, 1).concat(['    # isi fungsi disembunyikan: salah satu mutan']), { cls: 'ku-kecil' }),
          el('table', { class: 'ku-tabel' }, el('tr', null, ['tim', 'panggilan', 'harapan', 'hasil', ''].map((h) => el('th', null, h))), log.map((g) => el('tr', { class: g.ok ? 'lulus' : 'gagal' }, el('td', null, `Tim ${g.who + 1}`), el('td', null, el('code', null, g.call)), el('td', null, g.h), el('td', null, g.got), el('td', null, g.ok ? '✓' : '✗'))))),
          caseEditor(c, () => draw()), button('▶ Jalankan uji', () => {
            if (!c.set) { draw('Pilih harapan dulu.', 'bad'); return; }
            const rule = py(aturan(c.u, c.p, c.l)); if (py(c.h) !== rule) { ctx.sound.bad(); draw(`Harapanmu tidak sesuai aturan (seharusnya ${rule}). Hitung lagi dari aturan; uji ini tidak dihitung.`, 'bad'); return; }
            used++; const got = hasil(id, c.u, c.p, c.l); const ok = got === rule; log.push({ who, call: call(c.u, c.p, c.l), h: rule, got, ok });
            if (!ok) { const p = Math.max(1, 6 - used); pts[who] += p; ctx.sound.good(); return done(`Mutan tertangkap oleh Tim ${who + 1} setelah ${used} uji: +${p}.`); }
            if (used >= MAX) { pts[boss] += 3; return done(`Mutan lolos dari ${MAX} uji: Tim ${boss + 1} +3.`); }
            turn++; c.set = false; ctx.sound.tap(); draw('Lulus. Mutan belum tertangkap.');
          }, 'primary'), el('p', { class: `reveal ${cls}` }, msg || 'Harapan dihitung dari aturan tarif.'));
      };
      const done = (msg) => { wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, `Mutan ${id}: ${desc}`), pyCode(code, { cls: 'ku-kecil', warn: [line] }), el('p', { class: 'reveal' }, msg), button('Lanjut ➜', () => { t++; step(); }, 'primary')); };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Berburu Mutan', start);
}
