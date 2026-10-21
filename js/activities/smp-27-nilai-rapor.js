// Rumus Nilai Rapor — SMP (13–15 tahun), coding. Variables, data types and
// order of operations: pupils trace Bayu's report-card pseudocode line by line,
// find why Rina's grade came out 114 (forgotten brackets), see rounding decide
// "tuntas", and use MOD and DIV to share out a cleaning rota.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper, codeView } from './smp-kit.js';
import { runAll, reduceSteps, fmt, PseudoError } from './pseudo.js';

export const program = ([t1, t2, t3], [u1, u2], uj, { nama = 'Rina', fix2 = true, fix5 = true, swap = false } = {}) => [
  `nama ← "${nama}"`,
  fix2 ? `tugas ← (${t1} + ${t2} + ${t3}) / 3` : `tugas ← ${t1} + ${t2} + ${t3} / 3`,
  `ulangan ← (${u1} + ${u2}) / 2`,
  `ujian ← ${uj}`,
  fix5 ? 'akhir ← (30 × tugas + 30 × ulangan + 40 × ujian) / 100' : 'akhir ← 30 × tugas + 30 × ulangan + 40 × ujian / 100',
  ...(swap ? ['tuntas ← akhir ≥ 75', 'akhir ← BULATKAN(akhir)'] : ['akhir ← BULATKAN(akhir)', 'tuntas ← akhir ≥ 75']),
  'TAMPILKAN nama, akhir, tuntas',
];
export const STUDENTS = { Rina: [[80, 90, 85], [70, 76], 82], Dimas: [[70, 65, 72], [60, 70], 74], Sari: [[70, 75, 80], [70, 74], 76] };
export function grade(name, o = {}) {
  const [t, u, j] = STUDENTS[name];
  const r = runAll(program(t, u, j, { nama: name, ...o }));
  const before = r.trace.filter((x) => x.note.startsWith('akhir ←'))[0].vars.akhir;
  return { tugas: r.vars.tugas, ulangan: r.vars.ulangan, before, akhir: r.vars.akhir, tuntas: r.vars.tuntas, out: r.out[0] };
}
export const OPS = [['2 + 3 × 4', 14], ['(2 + 3) × 4', 20], ['20 − 6 / 2', 17], ['(20 − 6) / 2', 7], ['17 MOD 5 + 1', 3], ['17 MOD (5 + 1)', 5]];
export const evalText = (s) => reduceSteps(s).value;
export const TYPES = [['82', '82', 'bulat'], ['rina', '"Rina"', 'teks'], ['802', '80,2 (sebelum dibulatkan)', 'desimal'], ['benar', 'BENAR', 'benar/salah'], ['8c', '"8C"', 'teks'], ['s82', '"82"', 'teks']];
export const DAYS = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 0: 'Jumat' };
export const piket = () => { const c = { Senin: 0, Selasa: 0, Rabu: 0, Kamis: 0, Jumat: 0 }; for (let a = 1; a <= 32; a++) c[DAYS[a % 5]]++; return c; };

const n = (x) => fmt(x);
function opsTree(src) {
  try {
    const { steps, value } = reduceSteps(src);
    return el('ol', { class: 'nr-urutan' }, steps.map(([before, part, v]) => el('li', null, el('span', { html: before.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace('⟦', '<mark>').replace('⟧', '</mark>') }), el('b', null, ` → ${part} = ${n(v)}`))),
      el('li', { class: 'akhir' }, `Hasil: ${n(value)}`));
  } catch (e) { if (!(e instanceof PseudoError)) throw e; return el('p', { class: 'sk-galat' }, `⚠ ${e.message}`); }
}

export default {
  id: 'smp-27-nilai-rapor',
  title: 'Rumus Nilai Rapor',
  topic: 'Variabel, tipe data, urutan operasi, pembulatan, serta sisa bagi (MOD) dan hasil bagi bulat (DIV)',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🧮',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri pseudocode nilai rapor Bayu baris demi baris, temukan tanda kurung yang membuat nilai Rina 114, kenali tipe data, lalu bagi jadwal piket dengan MOD dan DIV.',
  extraModes: [
    { id: 'jejak', icon: '🔎', label: 'Penelusur Variabel', desc: 'Jalankan pseudocode satu baris demi satu baris; kotak variabel yang berubah menyala dan tipe datanya diberi warna', create: createTrace },
    { id: 'urutan', icon: '🌳', label: 'Urutan Operasi', desc: 'Ketik ekspresi, lalu lihat bagian mana yang dihitung lebih dulu langkah demi langkah; tambah atau hapus tanda kurung', create: createOps },
    { id: 'bayu', icon: '🐞', label: 'Program Bayu yang Pertama', desc: 'Pasang tanda kurung yang terlupa di baris 2 dan 5, lalu bandingkan nilai 114, 4.773, dan 8.173 dengan nilai yang benar', create: createBayu },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Nilai Akhir', desc: 'Satu tim memilih nilai tugas, ulangan, dan ujian; tim lain menebak nilai akhir dan status tuntas sebelum program dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act nilai-rapor' });
    root.append(wrap);
    const R = grade('Rina'); const D = grade('Dimas'); const S = grade('Sari'); const Ssw = grade('Sari', { swap: true });
    const bug2 = grade('Rina', { fix2: false }); const bug5 = grade('Rina', { fix5: false }); const bug25 = grade('Rina', { fix2: false, fix5: false });
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const row = (k, t, right, wrong, w) => [k, t, [...new Set([right, ...wrong])].sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })), right, w];
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Hitung dengan aturan urutan operasi', info: 'Kurung lebih dulu, lalu ×, /, MOD, DIV dari kiri, lalu + dan −.', rows: OPS.map(([e, v], i) => row(i, e, n(v), [n(v + 3), n(v - 2), n(OPS[(i + 1) % 6][1])].filter((x) => x !== n(v)))), done: next });
      else if (r === 1) {
        const tr = tracer(program(...STUDENTS.Rina), { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Isi tabel jejak program Rina', rows: [row('t', 'tugas setelah baris 2', n(R.tugas), ['255', '85,3', '198,33…']), row('u', 'ulangan setelah baris 3', n(R.ulangan), ['146', '72', '74']), row('a5', 'akhir setelah baris 5', n(R.before), ['80', '8.020', '80,5']), row('a6', 'akhir setelah baris 6', n(R.akhir), ['81', '80,2', '79']), row('k', 'Keluaran baris 8', R.out, ['Rina 80,2 BENAR', 'Rina 80 SALAH', '"Rina" 80 tuntas'])], done: next })), 1500) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan program Bayu sampai selesai (Langkah atau Otomatis)'), tr);
      } else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Dimas: tugas 70, 65, 72 · ulangan 60, 70 · ujian 74', info: 'Ganti angka di baris 2–4, lalu hitung.', rows: [row('t', 'tugas', n(D.tugas), ['207', '68', '70']), row('u', 'ulangan', n(D.ulangan), ['130', '60', '70']), row('b', 'akhir sebelum dibulatkan', n(D.before), ['70', '69,5', '71,2']), row('a', 'akhir', n(D.akhir), ['69', '71', '75']), row('k', 'tuntas', fmt(D.tuntas), ['BENAR'])], done: next });
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Sari: tugas 70, 75, 80 · ulangan 70, 74 · ujian 76', rows: [row('b', 'akhir sebelum dibulatkan', n(S.before), ['75', '74', '75,5']), row('a', 'akhir', n(S.akhir), ['74', '76']), row('k', 'tuntas', fmt(S.tuntas), ['SALAH'])],
        done: then(() => ask('Bayu menukar baris 6 dan 7, sehingga tuntas dihitung sebelum pembulatan. Apakah hasil Sari berubah?', [[`Ya: yang diperiksa 74,5 ≥ 75, hasilnya ${fmt(Ssw.tuntas)}; Sari menjadi tidak tuntas hanya karena urutan baris`, true], ['Tidak: nilai akhirnya tetap 75, jadi tetap tuntas'], ['Ya: nilainya menjadi 74'], ['Tidak: BULATKAN tidak berpengaruh pada tuntas']], 1, codeView(program(...STUDENTS.Sari, { nama: 'Sari', swap: true }), { hl: [5, 6] }))) });
      else if (r === 4) {
        const tr = tracer(program(...STUDENTS.Rina, { fix2: false }), { onEnd: () => setTimeout(then(() => ask('Hanya baris 2 yang salah. Berapa nilai akhir Rina, dan bagian mana yang dihitung lebih dulu di baris 2?', [[`${n(bug2.akhir)}; 85 / 3 dihitung lebih dulu karena pembagian didahulukan, jadi hanya 85 yang dibagi 3`, true], [`${n(bug2.akhir)}; 80 + 90 dihitung lebih dulu karena paling kiri`], ['80; komputer tahu maksud Bayu'], ['255; tanda / diabaikan']], 1, opsTree('80 + 90 + 85 / 3'))), 1500) });
        wrap.append(el('p', { class: 'prompt' }, 'Program pertama Bayu: baris 2 tanpa tanda kurung. Jalankan!'), tr);
      } else if (r === 5) rowsChoose(wrap, ctx, { prompt: 'Bagaimana dengan baris 5 yang juga tanpa kurung?', info: 'Di baris 5 yang salah, hanya 40 × ujian yang dibagi 100.', rows: [row('b5', 'Hanya baris 5 salah: akhir', n(bug5.akhir), ['114', '80', '8.173']), row('b25', 'Kedua baris salah: akhir', n(bug25.akhir), ['114', '4.773', '80'])],
        done: then(() => ask('Lengkapi baris peringatan: JIKA akhir < … ATAU akhir > … MAKA TAMPILKAN "Periksa rumus"', [['0 dan 100', true], ['75 dan 100'], ['0 dan 75'], ['1 dan 114']], 2)) });
      else if (r === 6) rowsChoose(wrap, ctx, { prompt: 'Tentukan tipe data setiap nilai', info: 'Teks ditulis di antara tanda petik, walaupun isinya angka.', rows: TYPES.map(([k, t, a]) => [k, t, ['bulat', 'desimal', 'teks', 'benar/salah'], a]), done: next });
      else if (r === 7) ask('Mengapa "82" dan 82 berbeda?', [['"82" adalah teks yang kebetulan berisi angka, jadi tidak bisa dihitung seperti bilangan; 82 adalah bilangan', true], ['Tidak berbeda, komputer membaca keduanya sama'], ['"82" lebih besar dari 82'], ['82 adalah teks, "82" adalah bilangan']], 1, null,
        then(() => ask('"80" + "5" menghasilkan "805". Apa akibatnya bila nilai ujian dari formulir tersimpan sebagai teks?', [['Nilai-nilai digabung, bukan dijumlahkan, sehingga rata-ratanya salah atau program galat; data perlu diubah ke bilangan dulu', true], ['Tidak ada akibat'], ['Nilai otomatis dibulatkan'], ['Program menjadi lebih cepat']], 1, codeView(['TAMPILKAN "80" + "5"', 'TAMPILKAN 80 + 5', `→ ${runAll(['TAMPILKAN "80" + "5"', 'TAMPILKAN 80 + 5']).out.join('   dan   ')}`]))));
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Piket: hari ← absen MOD 5 (1 Senin … 4 Kamis, 0 Jumat)', rows: [7, 10, 23, 32].map((a) => [a, `absen ${a} → ${a} MOD 5 = ${a % 5}`, ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], DAYS[a % 5]]),
        done: then(() => { const c = piket(); ask('Berapa murid yang piket setiap hari (absen 1–32)?', [[`Senin ${c.Senin} · Selasa ${c.Selasa} · Rabu ${c.Rabu} · Kamis ${c.Kamis} · Jumat ${c.Jumat}`, true], ['Senin 6 · Selasa 6 · Rabu 6 · Kamis 7 · Jumat 7'], ['Semua hari 6 murid, sisa 2'], ['Senin 7 · Selasa 6 · Rabu 6 · Kamis 6 · Jumat 7']]); }) });
      else rowsChoose(wrap, ctx, { prompt: 'MOD dan DIV untuk nomor 1–5 dan kelompok', rows: [row('h10', '(10 − 1) MOD 5 + 1', n(evalText('(10 − 1) MOD 5 + 1')), ['0', '1', '2']), row('h7', '(7 − 1) MOD 5 + 1', n(evalText('(7 − 1) MOD 5 + 1')), ['1', '3', '7']), row('div', '32 DIV 5 (kelompok penuh)', n(evalText('32 DIV 5')), ['2', '7', '6,4']), row('mod', '32 MOD 5 (murid di kelompok terakhir)', n(evalText('32 MOD 5')), ['6', '3', '0']), row('kel', '(32 − 1) DIV 5 + 1 (kelompok absen 32)', n(evalText('(32 − 1) DIV 5 + 1')), ['6', '8', '5'])], done: next });
    }
    render();
  },
};

// --- Penelusur variabel ---
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act nilai-rapor' });
  root.append(wrap);
  let who = 'Rina'; let swap = false; let tr = null;
  const draw = () => {
    tr?.stop();
    tr = tracer(program(...STUDENTS[who], { nama: who, swap }));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur variabel'),
      el('div', { class: 'nr-pilih' }, el('div', { class: 'seg' }, Object.keys(STUDENTS).map((k) => onTap(el('button', { class: `seg-btn ${who === k ? 'on' : ''}`, type: 'button' }, k), () => { who = k; draw(); }))),
        el('div', { class: 'seg' }, [[false, 'Urutan benar'], [true, 'Baris 6 dan 7 ditukar']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${swap === v ? 'on' : ''}`, type: 'button' }, l), () => { swap = v; draw(); })))),
      tr, el('p', { class: 'nr-legenda' }, el('span', { class: 't-bulat' }, 'bulat'), el('span', { class: 't-desimal' }, 'desimal'), el('span', { class: 't-teks' }, 'teks'), el('span', { class: 't-benar-salah' }, 'benar/salah')));
  };
  draw();
}

// --- Urutan operasi ---
export const PRESETS = ['2 + 3 × 4', '(2 + 3) × 4', '20 − 6 / 2', '17 MOD 5 + 1', '80 + 90 + 85 / 3', '(80 + 90 + 85) / 3', '30 × 85 + 30 × 73 + 40 × 82 / 100', '(30 × 85 + 30 × 73 + 40 × 82) / 100', '(32 − 1) DIV 5 + 1'];
function createOps(root, ctx) {
  const wrap = el('div', { class: 'act nilai-rapor' });
  root.append(wrap);
  const input = el('input', { type: 'text', class: 'nr-masukan', value: PRESETS[4], 'aria-label': 'Ekspresi', autocomplete: 'off', spellcheck: 'false' });
  const out = el('div', { class: 'nr-hasil' });
  const show = () => out.replaceChildren(opsTree(input.value));
  input.addEventListener('input', show);
  const add = (t) => { input.value += t; show(); };
  wrap.append(el('p', { class: 'prompt' }, 'Urutan operasi langkah demi langkah'), input,
    el('div', { class: 'sk-tombol nr-papan' }, ['(', ')', '+', '−', '×', '/', 'MOD', 'DIV'].map((t) => button(t, () => add(` ${t} `.replace(/ \( $/, '(').replace(/^ \) /, ')')))), button('⌫', () => { input.value = input.value.trimEnd().slice(0, -1); show(); }), button('Hapus semua kurung', () => { input.value = input.value.replace(/[()]/g, ''); show(); })),
    el('div', { class: 'sk-tombol' }, PRESETS.map((p) => button(p, () => { input.value = p; show(); }))), out);
  show();
}

// --- Program Bayu yang pertama ---
function createBayu(root, ctx) {
  const wrap = el('div', { class: 'act nilai-rapor' });
  root.append(wrap);
  let fix2 = false; let fix5 = false; let tr = null;
  const draw = () => {
    tr?.stop();
    tr = tracer(program(...STUDENTS.Rina, { fix2, fix5 }), { cls: 'ringkas' });
    const tbl = el('table', { class: 'nr-tabel' }, el('tr', null, el('th', null, 'Kurung baris 2'), el('th', null, 'Kurung baris 5'), el('th', null, 'akhir')),
      [[false, false], [true, false], [false, true], [true, true]].map(([a, b]) => el('tr', { class: a === fix2 && b === fix5 ? 'hl' : '' }, el('td', null, a ? '✓' : '✗'), el('td', null, b ? '✓' : '✗'), el('td', { class: 'n' }, n(grade('Rina', { fix2: a, fix5: b }).akhir)))));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pasang tanda kurung yang terlupa'),
      el('div', { class: 'nr-pilih' }, button(fix2 ? '✓ Kurung di baris 2' : '＋ Pasang kurung di baris 2', () => { fix2 = !fix2; draw(); }, fix2 ? 'primary' : ''), button(fix5 ? '✓ Kurung di baris 5' : '＋ Pasang kurung di baris 5', () => { fix5 = !fix5; draw(); }, fix5 ? 'primary' : '')),
      el('div', { class: 'nr-dua' }, tr, tbl));
  };
  draw();
}

// --- Bergiliran ---
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act nilai-rapor' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Tebak nilai akhir selesai', pts, again: () => pickTeams(wrap, 'Tebak Nilai Akhir', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT;
      const t = [75, 75, 75]; const u = [75, 75]; let j = 75;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih nilai (kelipatan 1), lalu ketuk Serahkan.`);
      const host = el('div', { class: 'nr-pilih kolom' },
        el('div', { class: 'sk-tombol' }, t.map((v, i) => stepper(v, (x) => { t[i] = x; }, { min: 0, max: 100, label: `tugas ${i + 1}` }))),
        el('div', { class: 'sk-tombol' }, u.map((v, i) => stepper(v, (x) => { u[i] = x; }, { min: 0, max: 100, label: `ulangan ${i + 1}` })), stepper(j, (x) => { j = x; }, { min: 0, max: 100, label: 'ujian' })),
        button('Serahkan ke tim lawan', guess, 'primary'));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih nilai, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const res = runAll(program(t, u, j, { nama: 'Murid' })); const akhir = res.vars.akhir; const tuntas = res.vars.tuntas;
        const cand = [...new Set([akhir, akhir - 1, akhir + 1, akhir + 2, akhir - 2].filter((x) => x >= 0 && x <= 100))].slice(0, 4);
        const opts = ctx.rand.shuffle(cand).sort((a, b) => a - b).flatMap((a) => [[a, true], [a, false]]).map(([a, tt]) => [`${a} · ${tt ? 'BENAR' : 'SALAH'}`, a === akhir && tt === tuntas]);
        say(msg, '', `Tim ${guesser + 1}: berapa nilai akhir dan apakah tuntas?`);
        host.replaceChildren(codeView(program(t, u, j, { nama: 'Murid' })), el('div', { class: 'opts', style: { '--cols': 4 } }, opts.map(([o, ok]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          if (ok) pts[guesser] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', `${ok ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} Keluaran: ${res.out[0]} (sebelum dibulatkan ${n(res.trace.find((x) => x.line === 4).vars.akhir)}).`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4200);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Nilai Akhir', start);
}
