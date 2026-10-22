// Uji Program — SMP (13–15 tahun), coding. Testing and debugging Fikri's
// grade program: syntax, logic and run-time errors, boundary and unusual test
// cases, running a whole test table, writing a bug report, and regression.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pickSet, tracer, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

// Fikri's program. quote: closing quote on line 7; fix80: ≥ 80; empty: check for an empty list; each: check every value.
export function fikri({ quote = false, fix80 = false, empty = false, each = false } = {}) {
  const body = [
    'jumlah ← 0', ...(each ? ['valid ← BENAR'] : []), 'UNTUK SETIAP n DALAM daftar_nilai', '    jumlah ← jumlah + n', ...(each ? ['    JIKA n < 0 ATAU n > 100 MAKA', '        valid ← SALAH'] : []),
    'rata ← jumlah / PANJANG(daftar_nilai)', `JIKA ${each ? 'TIDAK valid' : 'rata < 0 ATAU rata > 100'} MAKA`, `    TAMPILKAN "Nilai tidak valid${quote ? '"' : ''}`,
    'SELAIN ITU JIKA rata ≥ 90 MAKA', '    TAMPILKAN rata, "A"', `SELAIN ITU JIKA rata ${fix80 ? '≥' : '>'} 80 MAKA`, '    TAMPILKAN rata, "B"', 'SELAIN ITU JIKA rata ≥ 70 MAKA', '    TAMPILKAN rata, "C"', 'SELAIN ITU', '    TAMPILKAN rata, "D"'];
  return ['BACA daftar_nilai', ...(empty ? ['JIKA PANJANG(daftar_nilai) = 0 MAKA', '    TAMPILKAN "Belum ada nilai"', 'SELAIN ITU', ...body.map((l) => `    ${l}`)] : body)];
}
export const PROGS = {
  asli: ['Versi yang dikumpulkan', fikri()],
  kutip: ['Tanda kutip baris 7 diperbaiki', fikri({ quote: true })],
  semua: ['Ketiga kesalahan diperbaiki', fikri({ quote: true, fix80: true, empty: true })],
  setiap: ['Tantangan: setiap nilai diperiksa', fikri({ quote: true, fix80: true, empty: true, each: true })],
};
// Expected result by the rules (not by any program).
export function rule(d) {
  if (!d.length) return 'Belum ada nilai';
  const r = d.reduce((s, x) => s + x, 0) / d.length;
  if (r < 0 || r > 100) return 'Nilai tidak valid';
  return `${fmt(r)} ${r >= 90 ? 'A' : r >= 80 ? 'B' : r >= 70 ? 'C' : 'D'}`;
}
export function exec(lines, d) {
  const res = runAll(lines, { input: { daftar_nilai: d } });
  if (res.error) return { text: res.error.kind === 'sintaks' ? `tidak bisa dijalankan (baris ${res.error.line + 1})` : `berhenti di baris ${res.error.line + 1}: ${res.error.message}`, error: res.error };
  return { text: res.out.join(' / '), error: null };
}
export const CASES = [[[95], 'biasa'], [[60], 'biasa'], [[90], 'batas'], [[89], 'batas'], [[80], 'batas'], [[79], 'batas'], [[70], 'batas'], [[69], 'batas'], [[-5], 'tidak wajar'], [[105], 'tidak wajar'], [[], 'kosong'], [[85, 75], 'biasa, dua nilai']];
export const listText = (d) => `[${d.map((x) => fmt(x)).join(', ')}]`;
export function parseList(s) {
  const t = s.replace(/[[\]]/g, '').replace(/−/g, '-').trim(); if (!t) return [];
  const a = t.split(/[,;\s]+/).filter(Boolean).map((x) => Number(x.replace(',', '.'))); return a.every((x) => Number.isFinite(x)) ? a.slice(0, 8) : null;
}
const same = (a, b) => a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();
export const KINDS = { S: 'S (sintaks)', L: 'L (logika)', B: 'B (saat berjalan)' };

// Test table: cases [[list, expected]] run on lines.
function testTable(lines, cases, { onRemove = null } = {}) {
  const head = exec(lines, [95]);
  if (head.error?.kind === 'sintaks') return el('div', { class: 'up-hasil' }, el('p', { class: 'sk-galat' }, `⚠ Baris ${head.error.line + 1}: ${head.error.message}`), el('small', null, 'Tidak ada kasus uji yang berjalan.'));
  let pass = 0;
  const rows = cases.map(([d, want], k) => { const got = exec(lines, d); const ok = same(got.text, want); if (ok) pass++;
    return el('tr', { class: ok ? 'lolos' : 'gagal' }, el('td', null, String(k + 1)), el('td', null, el('code', null, listText(d))), el('td', null, want), el('td', null, got.text), el('td', null, ok ? '✓ lolos' : '✗ gagal'), onRemove ? el('td', null, onTap(el('button', { class: 'up-hapus', type: 'button', 'aria-label': 'Hapus kasus' }, '✕'), () => onRemove(k))) : null); });
  return el('div', { class: 'up-hasil' }, el('table', { class: 'up-tabel' }, el('tr', null, ['No', 'daftar_nilai', 'Harapan', 'Hasil program', 'Status', ...(onRemove ? [''] : [])].map((h) => el('th', null, h))), rows), el('p', { class: pass === cases.length ? 'sk-beres' : 'sk-galat batas' }, `${pass} dari ${cases.length} kasus lolos.`));
}

export default {
  id: 'smp-34-uji-program',
  title: 'Uji Program',
  topic: 'Pengujian dan debugging: kesalahan sintaks, logika, dan saat berjalan, kasus uji batas dan tidak wajar, laporan bug, dan uji regresi',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🧪',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Golongkan kesalahan program, susun kasus uji batas dan tidak wajar untuk program predikat Fikri, jalankan semuanya, tulis laporan bug, lalu perbaiki dan uji ulang.',
  extraModes: [
    { id: 'uji', icon: '🧪', label: 'Jalankan Kasus Uji', desc: 'Tambahkan kasus uji dan harapannya, lalu jalankan semuanya sekaligus; kasus lolos hijau, gagal merah', create: createRunner },
    { id: 'laporan', icon: '📝', label: 'Formulir Laporan Bug', desc: 'Isi laporan bug untuk kasus yang gagal dan tampilkan di layar untuk dibahas bersama', create: createReport },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Bug Tersembunyi', desc: 'Satu tim memilih program dengan bug tersembunyi, tim lain mencari bug itu dengan kasus uji sesedikit mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act uji-program' });
    root.append(wrap);
    const KO = Object.values(KINDS);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const code = () => codeView(fikri(), { cls: 'up-kode' });
      const caseRow = (k) => { const d = CASES[k][0]; return [`c${k}`, `${k + 1}. ${listText(d)}`, k < 8 ? ['A', 'B', 'C', 'D'].map((p) => `${d[0]} ${p}`) : ['Nilai tidak valid', 'Belum ada nilai', '80 B', '80 C'], rule(d)]; };
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Golongkan kesalahan: S, L, atau B', info: 'S: tidak bisa dijalankan sama sekali. L: berjalan sampai selesai, hasilnya salah. B: berhenti di tengah jalan dengan pesan galat.', rows: [['a', 'JIKA nilai ≥ 75 ditulis tanpa MAKA', KO, KINDS.S], ['b', 'Luas persegi dihitung dengan sisi + sisi', KO, KINDS.L], ['c', 'Membaca suhu[8] dari larik 7 kotak', KO, KINDS.B]], done: next });
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Golongkan kesalahan: S, L, atau B', rows: [['d', 'Potongan harga dihitung dua kali', KO, KINDS.L], ['e', 'TAMPILKAN "Halo tanpa tanda kutip penutup', KO, KINDS.S], ['f', 'Rata-rata dibagi jumlah murid yang ternyata 0', KO, KINDS.B]], done: next });
      else if (r === 2) { wrap.append(code()); rowsChoose(wrap, ctx, { prompt: 'Fikri hanya menguji dengan [95] dan [60]', rows: [['u', 'Predikat yang sudah diuji', ['A dan D', 'A dan B', 'semua predikat', 'B dan C'], 'A dan D'], ['b', 'Predikat yang belum pernah diuji', ['B dan C', 'A dan D', 'hanya B', 'tidak ada'], 'B dan C', 'Begitu pula batas-batasnya, nilai tidak wajar, dan daftar kosong.'], ['k', 'Kebiasaan setelah mengubah program', ['menguji ulang setelah setiap perubahan, sekecil apa pun', 'langsung mengumpulkan bila perubahannya kecil', 'menguji hanya baris yang diubah', 'meminta teman menebak hasilnya'], 'menguji ulang setelah setiap perubahan, sekecil apa pun']], done: next }); }
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Hasil yang diharapkan menurut aturan (A ≥ 90, B ≥ 80, C ≥ 70, selain itu D)', info: 'Tulis harapan menurut aturan, bukan menurut program Fikri.', rows: [2, 3, 4, 5, 6, 7].map(caseRow), done: next });
      else if (r === 4) rowsChoose(wrap, ctx, { prompt: 'Kasus tidak wajar, kosong, dan dua nilai', info: 'Untuk daftar kosong, harapannya pesan "Belum ada nilai".', rows: [8, 9, 10, 11].map(caseRow), done: next });
      else if (r === 5) { const tr = tracer(fikri(), { opts: { input: { daftar_nilai: [95] } }, onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Sebelum kasus uji mana pun dicoba', rows: [['b', 'Baris penyebab', ['1', '5', '7', '10'], '7'], ['j', 'Jenis kesalahan', KO, KINDS.S], ['p', 'Perbaikan', ['TAMPILKAN "Nilai tidak valid"', 'TAMPILKAN Nilai tidak valid', 'hapus baris 7', 'TAMPILKAN "Nilai tidak valid'], 'TAMPILKAN "Nilai tidak valid"']], done: next })), 1600) }); wrap.append(el('p', { class: 'prompt' }, 'Jalankan program Fikri dengan [95]'), tr); }
      else if (r === 6) { const lines = PROGS.kutip[1]; wrap.append(testTable(lines, CASES.map(([d]) => [d, rule(d)]))); pickSet(wrap, ctx, { prompt: 'Setelah tanda kutip diperbaiki: ketuk nomor kasus yang hasilnya berbeda dengan harapan', items: CASES.map(([d], k) => [String(k + 1), `${k + 1}. ${listText(d)}`]), right: ['5', '11', '12'], done: next, why: 'Kasus 5, 11, dan 12 gagal.' }); }
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Penyebab setiap kasus yang gagal', rows: [['5', `Kasus 5 [80] → ${exec(PROGS.kutip[1], [80]).text}`, ['baris 10 · logika', 'baris 5 · saat berjalan', 'baris 8 · logika', 'baris 7 · sintaks'], 'baris 10 · logika', 'rata > 80 seharusnya rata ≥ 80.'], ['12', `Kasus 12 [85, 75] → ${exec(PROGS.kutip[1], [85, 75]).text}`, ['baris 10 · logika', 'baris 5 · saat berjalan', 'baris 4 · logika', 'baris 12 · logika'], 'baris 10 · logika'], ['11', `Kasus 11 [ ] → ${exec(PROGS.kutip[1], []).text}`, ['baris 5 · saat berjalan', 'baris 10 · logika', 'baris 3 · sintaks', 'baris 6 · logika'], 'baris 5 · saat berjalan', 'PANJANG(daftar_nilai) = 0, jadi pembagian dengan nol.']], done: next });
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Laporan bug untuk kesalahan logika', cls: 'up-laporan', rows: [['j', 'Judul singkat', ['Rata-rata tepat 80 mendapat predikat C, seharusnya B', 'Program Fikri jelek', 'Ada bug', 'Fikri lupa menguji'], 'Rata-rata tepat 80 mendapat predikat C, seharusnya B', 'Laporan yang baik tidak menyalahkan orang.'], ['m', 'Langkah memunculkan bug', ['Jalankan dengan daftar_nilai [80] atau [85, 75]', 'Jalankan programnya', 'Coba beberapa nilai', 'Jalankan dengan [95]'], 'Jalankan dengan daftar_nilai [80] atau [85, 75]', 'Bisa diulang oleh orang lain.'], ['h', 'Harapan · sebenarnya', ['80 B · 80 C', '80 C · 80 B', '80 A · 80 B', 'B · salah'], '80 B · 80 C'], ['p', 'Baris, jenis, dan usul perbaikan', ['Baris 10, logika: ganti rata > 80 menjadi rata ≥ 80', 'Baris 8, logika: ganti ≥ 90 menjadi > 90', 'Baris 5, saat berjalan: bagi dengan 2', 'Baris 10, sintaks: tambah MAKA'], 'Baris 10, logika: ganti rata > 80 menjadi rata ≥ 80']], done: next });
      else { wrap.append(testTable(PROGS.semua[1], CASES.map(([d]) => [d, rule(d)]))); ask('Setelah memperbaiki, mengapa semua kasus uji harus dijalankan lagi, bukan hanya yang tadinya gagal?', [['Perbaikan bisa merusak bagian lain yang sebelumnya benar; menjalankan ulang semua kasus (uji regresi) memastikan tidak ada kesalahan baru', true], ['Supaya komputer mengingat kasus ujinya'], ['Karena kasus yang lolos bisa berubah sendiri tanpa perubahan program'], ['Tidak perlu, cukup kasus yang gagal']], 1, null,
        then(() => { const t = exec(PROGS.semua[1], [105, 95]).text; const u = exec(PROGS.semua[1], [-5, 85]).text; ask(`Tantangan: [105, 95] menghasilkan "${t}" dan [−5, 85] menghasilkan "${u}". Mengapa lolos, dan bagaimana memperbaikinya?`, [['Baris pemeriksaan hanya memeriksa rata-rata, bukan setiap nilai; periksa setiap n di dalam perulangan dan tolak bila ada n < 0 ATAU n > 100', true], ['Karena 105 dibulatkan menjadi 100; bulatkan setiap nilai lebih dulu'], ['Karena daftar berisi dua nilai; batasi daftar menjadi satu nilai'], ['Tidak ada masalah, rata-ratanya memang wajar']], 1, codeView(PROGS.setiap[1], { cls: 'up-kode' })); })); }
    }
    render();
  },
};

function caseInputs(onAdd) {
  const inp = el('input', { type: 'text', placeholder: 'misalnya 85, 75', 'aria-label': 'daftar_nilai', maxlength: '40' });
  const exp = el('input', { type: 'text', placeholder: 'misalnya 80 B', 'aria-label': 'hasil yang diharapkan', maxlength: '30' });
  const msg = el('small', null, 'Pisahkan nilai dengan koma. Kosongkan untuk daftar kosong [ ].');
  const add = button('+ Tambah kasus', () => { const d = parseList(inp.value); if (!d) { msg.textContent = 'daftar_nilai harus berisi bilangan.'; return; } if (!exp.value.trim()) { msg.textContent = 'Tulis hasil yang diharapkan menurut aturan.'; return; } onAdd(d, exp.value.trim()); inp.value = ''; exp.value = ''; });
  return el('div', { class: 'up-tambah' }, el('label', null, el('small', null, 'daftar_nilai'), inp), el('label', null, el('small', null, 'harapan'), exp), add, msg);
}

function createRunner(root, ctx) {
  const wrap = el('div', { class: 'act uji-program' });
  root.append(wrap);
  let prog = 'asli'; let cases = CASES.slice(0, 2).map(([d]) => [d, rule(d)]); let ran = false; const out = el('div');
  const draw = () => {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Jalankan dengan kasus uji'),
      el('div', { class: 'seg' }, Object.entries(PROGS).map(([k, [t]]) => onTap(el('button', { class: `seg-btn ${prog === k ? 'on' : ''}`, type: 'button' }, t), () => { prog = k; ran = false; draw(); }))),
      el('div', { class: 'up-kerja' }, codeView(PROGS[prog][1], { cls: 'up-kode' }),
        el('div', { class: 'up-samping' }, caseInputs((d, e) => { cases.push([d, e]); ran = false; draw(); }),
          el('div', { class: 'up-tombol' }, button('▶ Jalankan semua kasus', () => { ran = true; draw(); }, 'primary'), button('Muat 12 kasus lembar kerja', () => { cases = CASES.map(([d]) => [d, rule(d)]); ran = false; draw(); }), button('Kosongkan', () => { cases = []; ran = false; draw(); })),
          ran ? testTable(PROGS[prog][1], cases, { onRemove: (k) => { cases.splice(k, 1); draw(); } }) : el('ul', { class: 'up-daftar' }, cases.length ? cases.map(([d, e], k) => el('li', null, `${k + 1}. ${listText(d)} → harapan: ${e}`)) : el('li', null, 'Belum ada kasus uji.')))));
  };
  draw();
}

const REPORT = [['judul', 'Judul singkat', 'Rata-rata tepat 80 mendapat predikat C, seharusnya B'], ['langkah', 'Langkah memunculkan bug (masukan)', 'Jalankan program dengan daftar_nilai [80] atau [85, 75]'], ['harap', 'Hasil yang diharapkan', '80 B'], ['nyata', 'Hasil sebenarnya', '80 C'], ['baris', 'Baris dan jenis kesalahan', 'Baris 10, kesalahan logika'], ['usul', 'Usul perbaikan', 'Ganti rata > 80 menjadi rata ≥ 80']];
function createReport(root, ctx) {
  const wrap = el('div', { class: 'act uji-program' });
  root.append(wrap);
  const val = Object.fromEntries(REPORT.map(([k]) => [k, '']));
  const form = () => {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Formulir laporan bug'), el('small', null, 'Isian hanya tampil di layar ini dan tidak disimpan. Laporan yang baik bisa diulang orang lain, menyebut harapan dan hasil sebenarnya, dan tidak menyalahkan orang.'),
      el('div', { class: 'up-form' }, REPORT.map(([k, label]) => { const t = el('textarea', { rows: '2', 'aria-label': label, maxlength: '200' }); t.value = val[k]; t.addEventListener('input', () => { val[k] = t.value; }); return el('label', null, el('b', null, label), t); })),
      el('div', { class: 'up-tombol' }, button('Tampilkan di layar', show, 'primary'), button('Isi dengan contoh', () => { REPORT.forEach(([k, , ex]) => { val[k] = ex; }); form(); }), button('Kosongkan', () => { REPORT.forEach(([k]) => { val[k] = ''; }); form(); })));
  };
  const show = () => {
    const missing = REPORT.filter(([k]) => !val[k].trim()).map(([, l]) => l);
    wrap.replaceChildren(el('div', { class: 'up-kartu' }, el('h3', null, `🐞 ${val.judul || 'Laporan bug'}`), el('dl', null, REPORT.slice(1).map(([k, label]) => [el('dt', null, label), el('dd', null, val[k] || '–')]).flat())),
      missing.length ? el('p', { class: 'sk-galat batas' }, `Belum diisi: ${missing.join(', ')}.`) : el('p', { class: 'sk-beres' }, 'Laporan lengkap.'),
      el('div', { class: 'up-tombol' }, button('← Ubah laporan', form), button('🖨 Cetak', () => window.print())));
  };
  form();
}

// Hidden-bug programs (mutants of the fixed program): [label, lines]
const FIXED = PROGS.semua[1];
const mut = (from, to) => FIXED.map((l) => (l.includes(from) ? l.replace(from, to) : l));
export const MUTANTS = [
  ['A untuk rata > 90', mut('rata ≥ 90', 'rata > 90')],
  ['C untuk rata > 70', mut('rata ≥ 70', 'rata > 70')],
  ['B mulai 85', mut('rata ≥ 80', 'rata ≥ 85')],
  ['100 ditolak', mut('rata > 100', 'rata ≥ 100')],
  ['nilai negatif tidak ditolak', mut('rata < 0 ATAU rata > 100', 'rata > 100')],
  ['jumlah mulai dari 1', mut('jumlah ← 0', 'jumlah ← 1')],
  ['selalu dibagi 2', mut('/ PANJANG(daftar_nilai)', '/ 2')],
  ['daftar kosong tidak diperiksa', PROGS.kutip[1].map((l) => l.replace('rata > 80', 'rata ≥ 80'))],
];
export const PRESET_CASES = [[90], [89], [80], [70], [100], [0], [], [85, 75], [-5], [105], [60, 90, 30], [71]];
export const found = (m, d) => !same(exec(MUTANTS[m][1], d).text, rule(d));
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act uji-program' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Bug tersembunyi selesai', pts, again: () => pickTeams(wrap, 'Bug Tersembunyi', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; let m = null;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih satu bug (tim lain jangan melihat), lalu Serahkan.`);
      const host = el('div', { class: 'up-giliran' }, el('div', { class: 'seg' }, MUTANTS.map(([t], i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, t), (e) => { m = i; e.currentTarget.parentNode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }))), button('Serahkan ke tim lawan', () => { if (m == null) { say(msg, 'bad', 'Pilih satu bug lebih dulu.'); return; } hunt(); }, 'primary'));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} menyembunyikan bug, Tim ${guesser + 1} mencarinya`), host, msg);
      function hunt() {
        const log = []; let over = false; const MAX = 8;
        const tryCase = (d) => {
          if (over) return; const got = exec(MUTANTS[m][1], d).text; const want = rule(d); const hit = !same(got, want); log.push([d, want, got, hit]); ctx.sound.tap();
          if (hit) { over = true; const gain = Math.max(1, 6 - log.length); pts[guesser] += gain; ctx.sound.good(); say(msg, '', `Bug ditemukan dengan ${log.length} kasus uji! Tim ${guesser + 1} +${gain}. Bugnya: ${MUTANTS[m][0]}.`); }
          else if (log.length >= MAX) { over = true; pts[maker] += 2; ctx.sound.bad(); say(msg, 'bad', `${MAX} kasus uji lolos semua. Tim ${maker + 1} +2. Bugnya: ${MUTANTS[m][0]}.`); }
          draw(); if (over) { wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 5200); }
        };
        const inp = el('input', { type: 'text', placeholder: 'misalnya 85, 75', 'aria-label': 'daftar_nilai', maxlength: '40' });
        const draw = () => host.replaceChildren(el('p', null, 'Program dengan bug tersembunyi berjalan; harapan dihitung dari aturan.'),
          el('div', { class: 'seg' }, PRESET_CASES.map((d) => onTap(el('button', { class: 'seg-btn', type: 'button' }, listText(d)), () => tryCase(d)))),
          el('div', { class: 'up-tambah' }, inp, button('Uji', () => { const d = parseList(inp.value); if (d) tryCase(d); })),
          el('table', { class: 'up-tabel' }, el('tr', null, ['daftar_nilai', 'Harapan', 'Hasil program', ''].map((h) => el('th', null, h))), log.map(([d, w, g, h]) => el('tr', { class: h ? 'gagal' : 'lolos' }, el('td', null, listText(d)), el('td', null, w), el('td', null, g), el('td', null, h ? '🐞 bug!' : '✓')))));
        say(msg, '', `Tim ${guesser + 1}: coba kasus uji satu per satu (paling banyak ${MAX}). Makin sedikit kasus, makin besar poinnya.`);
        draw();
      }
    }
    turn();
  }
  pickTeams(wrap, 'Bug Tersembunyi', start);
}
