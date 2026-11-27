// Rekap Bazar Amal — SMA/SMK (16–18 tahun), coding. Python loops over a 2D
// list: predicting range(), nested for with an accumulator, Dodi's misplaced
// jumlah = 0, finding the best day and stall, Sari's while that never ends
// (indentation), IndexError past the last index, and a donation target loop.
// The main mode is the game Manusia Python: players tap cells, drag values,
// move lines and crowns, and assemble outputs; nothing is typed.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, pyCode, stepper } from './smp-kit.js';
import { misiHead, fill, codeView, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy, pyRepr, makePyRunner } from './mini-py.js';

export const HARI = ['Kamis', 'Jumat', 'Sabtu'];
export const STAN = ['Kue', 'Minuman', 'Kerajinan', 'Buku bekas'];
export const DATA = [[120, 85, 60, 45], [150, 95, 40, 35], [210, 130, 75, 55]];
const HEAD = ['hari = ["Kamis", "Jumat", "Sabtu"]', 'stan = ["Kue", "Minuman", "Kerajinan", "Buku bekas"]', 'penjualan = [[120, 85, 60, 45],', '             [150, 95, 40, 35],', '             [210, 130, 75, 55]]', 'total_hari = []'];
export const REKAP = (dodi = false) => [...HEAD, ...(dodi ? ['jumlah = 0', 'for h in range(len(hari)):'] : ['for h in range(len(hari)):', '    jumlah = 0']), '    for s in range(len(stan)):', '        jumlah = jumlah + penjualan[h][s]', '    total_hari.append(jumlah)', '    print(hari[h], jumlah)', 'print("Total bazar:", sum(total_hari))',
  'terlaris = 0', 'for h in range(1, len(hari)):', '    if total_hari[h] > total_hari[terlaris]:', '        terlaris = h', 'print("Hari terlaris:", hari[terlaris])'];
const PRE = ['hari = ["Kamis", "Jumat", "Sabtu"]', 'total_hari = [310, 320, 470]  # dari program rekap'];
export const SARI = ({ indent = false, batas = 400, and = false } = {}) => [...PRE, 'i = 0', and ? `while i < len(total_hari) and total_hari[i] < ${batas}:` : `while total_hari[i] < ${batas}:`, `    print(hari[i], "belum mencapai ${batas}")`, `${indent ? '    ' : ''}i = i + 1`, `print("Hari pertama mencapai ${batas}:", hari[i])`];
export const STANPROG = (wrong = false) => [...HEAD.slice(0, 5), 'total_stan = []', 'for s in range(len(stan)):', '    jumlah = 0', '    for h in range(len(hari)):', `        jumlah = jumlah + penjualan[${wrong ? 's][h' : 'h][s'}]`, '    total_stan.append(jumlah)', 'terbaik = 0', 'for s in range(1, len(stan)):', '    if total_stan[s] > total_stan[terbaik]:', '        terbaik = s', 'print("Stan terlaris:", stan[terbaik])'];
export const DONASI = (target = 300, persen = 30) => [...PRE, `target = ${target}`, 'terkumpul = 0', 'i = 0', 'while terkumpul < target and i < len(hari):', `    terkumpul = terkumpul + total_hari[i] * ${persen} // 100`, '    i = i + 1', 'if terkumpul >= target:', '    print("Target tercapai pada hari", hari[i - 1])', 'else:', '    print("Target belum tercapai, kurang", target - terkumpul)'];
export const NAIK = [...HEAD.slice(0, 5), 'for s in range(len(stan)):', '    naik = True', '    for h in range(1, len(hari)):', '        if penjualan[h][s] <= penjualan[h - 1][s]:', '            naik = False', '    if naik:', '        print(stan[s])'];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, loopLimit: 50, ...o });
export const RANGES = ['range(1, 4)', 'range(0, 10, 3)', 'range(5, 0, -1)', 'range(len(stan))', 'range(2, 2)', 'range(10, 0, -3)'];
export const rangeOf = (src) => pyRepr(runPy([...HEAD.slice(0, 2), `x = list(${src})`]).vars.x);
// Line counts for a run (how many times each line was reached).
export function counts(lines) { const c = {}; const ru = makePyRunner(lines, { limit: 20000 }); for (const y of ru.gen) c[y.line] = (c[y.line] || 0) + 1; return c; }

function grid(vars = {}, { lit = false, col = null } = {}) {
  const h = vars.h; const s = vars.s;
  return el('table', { class: 'rb-tabel' }, el('tr', null, el('th', null, ''), STAN.map((n, j) => el('th', { class: col === j ? 'kolom' : '' }, `${j}: ${n}`))),
    DATA.map((row, i) => el('tr', null, el('th', null, `${i}: ${HARI[i]}`), row.map((v, j) => el('td', { class: `${lit && i === h && j === s ? 'baca' : ''} ${col === j ? 'kolom' : ''}` }, String(v))))));
}
const loopTracer = (lines, o = {}) => pyTracer(lines, { counts: true, cls: 'rb-jejak', speed: 350, opts: { limit: 20000, loopLimit: 50 }, hideVars: ['hari', 'stan', 'penjualan'], extra: (st) => grid(st.vars, { lit: true }), ...o });

// ---------- Permainan: Manusia Python ----------
// The players are the interpreter; the Bug Bazar slips one bug into every mission.
const HEAD36 = {
  ramal: ['Ramal range', 'Ketuk bilangan yang dihasilkan range, lalu tutup list-nya.', 'range-nya disamarkan!'],
  setel: ['Setel Mesin range', 'Atur a, b, dan langkah sampai hasilnya sama dengan target.', 'Targetnya diacak!'],
  jalan: ['Jalankan Perulangan Bersarang', 'Tunjuk sel yang dibaca, lalu hitung jumlah berikutnya.', 'Penunjuk h dan s hilang!'],
  hitung: ['Hitung Eksekusi', 'Berapa kali setiap baris dijalankan?', 'Penghitung baris rusak!'],
  dodi: ['Bug Dodi', 'Ramal keluaran program Dodi, lalu pindahkan baris yang salah tempat.', 'jumlah = 0 dipindah diam-diam!'],
  terlaris: ['Cari Hari Terlaris', 'Pindahkan mahkota ke calon terlaris di setiap putaran.', 'Mahkotanya tertukar!'],
  stan: ['Total Setiap Stan', 'Susun baris program dari kartu, lalu cari stan terlaris.', 'Baris program berserakan!'],
  henti: ['Putaran Tak Berujung', 'Jalankan program Sari, temukan baris yang lupa dijorokkan.', 'Satu jorokan dicuri!'],
  batas: ['Lewat Batas', 'Tunjuk kotak yang dibaca di setiap pemeriksaan, lalu perbaiki syaratnya.', 'Ambang dinaikkan ke 500!'],
  bos: ['Target Donasi dan Stan Naik Terus', 'Hitung donasi terkumpul, lalu cari stan yang penjualannya naik setiap hari.', 'Bug terakhir menunggu!'],
};
const msg36 = (t) => el('p', { class: 'reveal info' }, t);
const pyList = (lines) => runPy([`x = ${lines}`]).vars.x;

export const RANGE_Q = ['range(1, 4)', 'range(0, 10, 3)', 'range(5, 0, -1)'];
export const SETEL = [[[0, 1, 2, 3], 'indeks keempat stan'], [[], 'list kosong'], [[10, 7, 4, 1], 'hitung mundur']];
export const SETEL_SOL = [[0, 4, 1], [0, 0, 1], [10, 0, -3]];
export const CORE = ['total_hari = []', 'for h in range(len(hari)):', '    jumlah = 0', '    for s in range(len(stan)):', '        jumlah = jumlah + penjualan[h][s]', '    total_hari.append(jumlah)', '    print(hari[h], jumlah)', 'print("Total bazar:", sum(total_hari))'];
export const ACC_CHIPS = ['120', '205', '265', '310', '85', '60', '45', '180'];
export const TOT_CHIPS = ['320', '470', '630', '1100', '790', '150'];
export const COUNT_CHIPS = ['3', '3', '12', '30', '4', '11', '1'];
export const COUNT_WANT = ['3', '12', '3', '30'];
export const DODI = ['jumlah = 0', 'total_hari = []', 'for h in range(len(hari)):', '    for s in range(len(stan)):', '        jumlah = jumlah + penjualan[h][s]', '    total_hari.append(jumlah)', '    print(hari[h], jumlah)'];
export const DODI_CHIPS = ['310', '320', '470', '630', '790', '1100'];
export const DODI_WANT = ['310', '630', '1100'];
const DODI_GAPS = { g1: [2, 'Tepat: jumlah dinolkan setiap hari baru, sebelum perulangan stan.'], g2: [3, 'Di dalam perulangan stan, jumlah dinolkan setiap stan, jadi hanya berisi satu angka. Kamis menjadi 45.'], g3: [5, 'Terlambat: jumlah sudah ditambahkan ke total_hari sebelum dinolkan.'] };
export const TERLARIS = ['terlaris = 0', 'for h in range(1, len(hari)):', '    if total_hari[h] > total_hari[terlaris]:', '        terlaris = h', 'print("Hari terlaris:", hari[terlaris])'];
export const STAN_BUILD = ['total_stan = []', ['fs', 0], ['j0', 1], ['fh', 1], ['acc', 2], '    total_stan.append(jumlah)'];
export const STAN_TILES = [['fs', 'for s in range(len(stan)):'], ['j0', 'jumlah = 0'], ['fh', 'for h in range(len(hari)):'], ['acc', 'jumlah = jumlah + penjualan[h][s]'], ['x1', 'jumlah = jumlah + penjualan[s][h]', 'penjualan[s][h] membaca baris ke-s. Saat s = 3 tidak ada hari ke-3: IndexError.'], ['x2', 'for s in range(len(hari)):', 'Ada 4 stan, jadi s berjalan sebanyak len(stan).']];
export const SARI_OUT = [['k', 'Kamis belum mencapai 400'], ['j', 'Jumat belum mencapai 400'], ['s', 'Hari pertama mencapai 400: Sabtu'], ['x1', 'Sabtu belum mencapai 400', 'Sabtu 470, sudah mencapai 400, jadi syarat while False.'], ['x2', 'Hari pertama mencapai 400: Jumat', 'Jumat 320, belum mencapai 400.']];
const SARI_TAP = { 0: 'Baris ini dijalankan sekali sebelum perulangan.', 1: 'Baris ini dijalankan sekali sebelum perulangan.', 2: 'Baris ini dijalankan sekali sebelum perulangan.', 3: 'Syarat while-nya benar. Apa yang seharusnya mengubah i di setiap putaran?', 4: 'print ini sudah di dalam perulangan.', 6: 'Baris ini memang dijalankan sekali setelah perulangan selesai.' };
export const FIXED500 = ['i = 0', 'while i < len(total_hari) and total_hari[i] < 500:', '    print(hari[i], "belum mencapai 500")', '    i = i + 1', 'if i < len(hari):', '    print("Hari pertama mencapai 500:", hari[i])', 'else:', '    print("Tidak ada hari yang mencapai 500")'];
export const COND = [['cek', 'i < len(total_hari)'], ['nilai', 'total_hari[i] < 500'], ['x1', 'i <= len(total_hari)', 'Dengan <=, i = 3 masih lolos, lalu total_hari[3] dibaca dan galat.']];
export const DONASI_CORE = ['target = 300', 'terkumpul = 0', 'i = 0', 'while terkumpul < target and i < len(hari):', '    terkumpul = terkumpul + total_hari[i] * 30 // 100', '    i = i + 1'];
export const DON_CHIPS = ['93', '96', '141', '189', '330', '310'];
export const DON_WANT = ['93', '189', '330'];
export const HASIL_CHIPS = ['Kamis', 'Jumat', 'Sabtu', '70', '100', '30'];
export const HASIL_WANT = ['Sabtu', '70'];

function grid36({ lit = null, col = null, onCell = null, onCol = null, foot = null } = {}) {
  return el('table', { class: 'rb36-meja' },
    el('tr', null, el('th', null, 'h \\ s'), STAN.map((n, j) => { const th = el('th', { class: col === j ? 'kolom' : '', 'data-col': j }, el('small', null, String(j)), ` ${n}`); return onCol ? onTap(th, () => onCol(j)) : th; })),
    DATA.map((row, i) => el('tr', null, el('th', null, el('small', null, String(i)), ` ${HARI[i]}`), row.map((v, j) => { const td = el('td', { class: `${lit && lit[0] === i && lit[1] === j ? 'baca' : ''} ${col === j ? 'kolom' : ''}`, 'data-h': i, 'data-s': j }, String(v)); return onCell ? onTap(td, () => onCell(i, j)) : td; }))),
    foot ? el('tr', { class: 'kaki' }, el('th', null, foot[0]), foot[1].map((v, j) => el('td', { class: col === j ? 'kolom' : '' }, v == null ? '' : String(v)))) : null);
}
const boxes36 = (arr, cls = '') => el('div', { class: `rb36-list ${cls}` }, el('b', null, '['), arr.length ? arr.map((x) => el('span', { class: 'rb36-kotak' }, String(x))) : el('span', { class: 'rb36-kosong' }, ' '), el('b', null, ']'));

// Misi 1a: build list(range(...)) by tapping numbers.
function ramalRound(area, ctx, { oops, done }) {
  const msg = msg36('Ketuk bilangan yang dihasilkan range satu per satu, lalu tutup list-nya.');
  let qi = 0;
  const go = () => {
    const src = RANGE_Q[qi]; const v = pyList(`list(${src})`); const [a, b, s = 1] = src.match(/-?\d+/g).map(Number);
    const got = []; let over = false;
    const box = el('div', { class: 'rb36-list besar' });
    const draw = () => fill(box, el('b', null, '['), got.map((x) => el('span', { class: 'rb36-kotak' }, String(x))), over ? el('b', null, ']') : el('span', { class: 'rb36-kursor' }, '▮'));
    const pick = (n) => {
      if (over) return; const k = got.length;
      if (n === null) { if (k < v.length) { oops(); say(msg, 'bad', `Belum selesai: masih ada bilangan sebelum mencapai ${b}.`); return; } over = true; draw(); ctx.sound.good(); qi++;
        if (qi < RANGE_Q.length) { say(msg, 'info', `list(${src}) = [${v.join(', ')}]. Berikutnya!`); setTimeout(go, 1800); } else { say(msg, '', 'range(a, b, langkah) mulai dari a, bertambah langkah, dan berhenti sebelum b. Langkah negatif menghitung mundur.'); done(); }
        return; }
      if (k >= v.length) { oops(); say(msg, 'bad', `${n} sudah mencapai atau melewati batas ${b}. range berhenti sebelum b: tutup list-nya.`); return; }
      if (n !== v[k]) { oops(); say(msg, 'bad', k === 0 ? `range mulai dari a = ${a}.` : `Tambahkan langkah ${s} ke bilangan terakhir.`); return; }
      got.push(n); ctx.sound.tap(); draw(); say(msg, 'info', 'Tepat.');
    };
    draw();
    fill(area, el('div', { class: 'rb36-mesin' }, el('small', null, `Ramalan ${qi + 1} dari ${RANGE_Q.length}`), el('code', { class: 'rb36-ekspr' }, `list(${src})`), box),
      el('div', { class: 'rb36-angka-angka' }, Array.from({ length: 11 }, (_, n) => onTap(el('button', { class: 'rb36-angka', type: 'button', 'data-n': n }, String(n)), () => pick(n))),
        onTap(el('button', { class: 'rb36-angka tutup', type: 'button', 'data-n': 'tutup' }, '] tutup'), () => pick(null))), msg);
  };
  go();
}

// Misi 1b: set a, b and step until the machine matches the target.
function setelRound(area, ctx, { oops, done }) {
  const msg = msg36('Atur a, b, dan langkah dengan tombol − dan +, lalu jalankan mesin.');
  let a = 0; let b = 5; let s = 1; let t = 0; let out = null; let busy = false;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const step = (k, v, set) => el('div', { class: 'rb36-stepper', 'data-k': k }, el('small', null, k), onTap(el('button', { class: 'rb36-pm', type: 'button', 'data-d': '-1' }, '−'), () => set(-1)), el('b', null, String(v)), onTap(el('button', { class: 'rb36-pm', type: 'button', 'data-d': '1' }, '+'), () => set(1)));
  const draw = () => fill(area,
    el('div', { class: 'rb36-target', 'data-t': t }, el('small', null, `Target ${t + 1} dari ${SETEL.length}: ${SETEL[t][1]}`), boxes36(SETEL[t][0])),
    el('div', { class: 'rb36-mesin' }, el('code', { class: 'rb36-ekspr' }, `list(range(${a}, ${b}, ${s}))`),
      el('div', { class: 'rb36-stepper-stepper' }, step('a', a, (d) => { a = clamp(a + d, -5, 12); out = null; draw(); }), step('b', b, (d) => { b = clamp(b + d, -5, 12); out = null; draw(); }), step('langkah', s, (d) => { s += d; if (s === 0) s += d; s = clamp(s, -5, 5); out = null; draw(); })),
      button('▶ Jalankan', runIt, 'primary'), out ? boxes36(out, 'hasil') : null), msg);
  function runIt() {
    if (busy) return; out = pyList(`list(range(${a}, ${b}, ${s}))`); const ok = JSON.stringify(out) === JSON.stringify(SETEL[t][0]);
    if (!ok) { oops(); draw(); say(msg, 'bad', `Hasilnya [${out.join(', ')}], belum sama dengan target.`); return; }
    ctx.sound.good(); busy = true; draw(); t++;
    if (t < SETEL.length) { say(msg, 'info', `Tepat: range(${a}, ${b}, ${s}). Target berikutnya!`); setTimeout(() => { busy = false; out = null; draw(); }, 1800); return; }
    say(msg, '', 'Satu list bisa dibuat dengan beberapa range. range(a, a) selalu kosong, dan langkah negatif butuh a > b.'); done();
  }
  draw();
}

// Misi 2a: be the pointer and the accumulator for h = 0, then read the totals.
function jalanRound(area, ctx, { oops, done }) {
  const msg = msg36('h = 0. Ketuk sel penjualan[h][s] yang dibaca program.');
  let s = 0; let jumlah = 0; let phase = 'tap'; const used = [];
  const vars = el('div', { class: 'rb36-var' }); const gridBox = el('div');
  const tray = el('div', { class: 'mk-chip-chip' }, ctx.rand.shuffle(ACC_CHIPS.slice()).map((c) => el('div', { class: 'mk-chip', 'data-drag': c }, c)));
  const draw = () => {
    fill(gridBox, grid36({ lit: phase === 'jumlah' ? [0, s] : null, onCell: phase === 'tap' ? cell : null }));
    fill(vars, el('span', null, 'h = ', el('b', null, '0')), el('span', null, 's = ', el('b', null, phase === 'tap' ? '?' : String(s))), el('span', null, 'jumlah = ', phase === 'jumlah' ? el('span', { class: 'mk-celah', 'data-drop': 'j' }, '?') : el('b', null, String(jumlah))));
  };
  const host = el('div', { class: 'rb36-dua' }, codeView(CORE, { hl: [4] }), el('div', { class: 'rb36-tumpuk' }, gridBox, vars, tray));
  function cell(h, j) {
    if (h !== 0 || j !== s) { oops(); say(msg, 'bad', h !== 0 ? 'h = 0: baris pertama, Kamis.' : `s berjalan 0, 1, 2, 3. Sekarang s = ${s}.`); return; }
    phase = 'jumlah'; ctx.sound.tap(); draw(); say(msg, 'info', `penjualan[0][${s}] = ${DATA[0][s]}. Seret nilai jumlah yang baru.`);
  }
  dnd(host, (chip, blank) => {
    if (phase !== 'jumlah' || blank.dataset.drop !== 'j') return;
    const want = jumlah + DATA[0][s];
    if (+chip.dataset.drag !== want) { oops(); shake(chip); say(msg, 'bad', `jumlah = jumlah + penjualan[0][${s}] = ${jumlah} + ${DATA[0][s]}.`); return; }
    chip.remove(); jumlah = want; used.push(want); s++; ctx.sound.tap();
    if (s < 4) { phase = 'tap'; draw(); say(msg, 'info', `jumlah = ${jumlah}. Ketuk sel berikutnya.`); return; }
    phase = 'auto'; draw(); say(msg, 'info', 'Kamis selesai: 310. Program menjalankan Jumat dan Sabtu…'); autoRun();
  });
  function autoRun() {
    const cells = []; for (let h = 1; h < 3; h++) for (let j = 0; j < 4; j++) cells.push([h, j]);
    let i = 0;
    const tick = () => {
      if (!host.isConnected) return;
      if (i < cells.length) { fill(gridBox, grid36({ lit: cells[i] })); i++; setTimeout(tick, 280); return; }
      fill(gridBox, grid36()); totals();
    };
    tick();
  }
  function totals() {
    say(msg, 'info', 'Lengkapi total_hari dan total bazar.');
    fill(area, el('div', { class: 'rb36-dua' }, codeView(CORE, { hl: [5, 7] }), el('div', { class: 'rb36-tumpuk' }, grid36(), fillBoard(ctx, { oops, msg, chips: TOT_CHIPS, want: ['320', '470', '1100'],
      view: rowsView([['total_hari = [310, ', '_', ', ', '_', ']'], ['Total bazar: ', '_']]),
      hints: ['Jumat: 150 + 95 + 40 + 35.', 'Sabtu: 210 + 130 + 75 + 55.', '310 + 320 + 470.'],
      done: () => { say(msg, '', 'Perulangan luar memilih hari, perulangan dalam menjumlahkan keempat stan. Total bazar Rp1.100 ribu.'); done(); } }))), msg);
  }
  draw();
  area.append(host, msg);
}

// Misi 2b: how many times each line runs.
function hitungRound(area, ctx, { oops, done }) {
  const msg = msg36('Seret angka ke penghitung di samping baris. 3 hari, 4 stan.');
  const at = { 2: 0, 4: 1, 6: 2 };
  area.append(fillBoard(ctx, { oops, msg, chips: COUNT_CHIPS, want: COUNT_WANT, cls: 'rb36-lebar',
    view: (mk) => el('div', { class: 'rb36-tumpuk' }, codeView(CORE, { after: (i) => (i in at ? el('span', { class: 'rb36-hitung' }, '×', mk()) : null) }), el('div', { class: 'mk-rumus' }, el('div', null, 'Bila 5 hari dan 6 stan, baris 5 dijalankan ', mk(), ' kali'))),
    hints: ['Baris ini ada di perulangan luar: sekali untuk setiap hari.', 'Di perulangan dalam: 3 hari × 4 stan.', 'print ada di perulangan luar.', '5 × 6.'],
    done: () => { say(msg, '', 'Baris di perulangan luar jalan 3 kali; baris di perulangan dalam jalan 3 × 4 = 12 kali. 5 hari × 6 stan = 30.'); done(); } }), msg);
}

// Misi 2c: predict Dodi's output, then drag jumlah = 0 to the right place.
function dodiRound(area, ctx, { oops, done }) {
  const msg = msg36('Program Dodi menolkan jumlah di atas. Ramal keluarannya.');
  area.append(el('div', { class: 'rb36-dua' }, codeView(DODI, { warn: [0] }), el('div', { class: 'rb36-tumpuk' }, grid36(), fillBoard(ctx, { oops, msg, chips: DODI_CHIPS, want: DODI_WANT,
    view: rowsView([['Kamis ', '_'], ['Jumat ', '_'], ['Sabtu ', '_']]),
    hints: ['Kamis: 120 + 85 + 60 + 45.', 'jumlah tidak dinolkan lagi: 310 + 150 + 95 + 40 + 35.', '630 + 210 + 130 + 75 + 55.'],
    done: () => { say(msg, 'info', 'Angkanya menumpuk: 310, 630, 1100. Seret baris jumlah = 0 ke tempat yang benar.'); setTimeout(fixIt, 2400); } }))), msg);
  function fixIt() {
    let over = false; const card = el('div', { class: 'mk-ubin', 'data-drag': 'nol' }, 'jumlah = 0');
    const rest = DODI.slice(1); const gapAt = { 1: 'g1', 2: 'g2', 4: 'g3' };
    const rows = []; rest.forEach((t, i) => { rows.push(el('div', { class: 'mk-baris' }, el('code', null, t))); if (gapAt[i]) rows.push(el('div', { class: 'rb36-celah-baris', 'data-drop': gapAt[i], style: { marginLeft: `${(DODI_GAPS[gapAt[i]][0] === 3 ? 2 : 1) * 2}em` } }, '⤷ taruh di sini')); });
    const screen = layar();
    const host = el('div', { class: 'rb36-dua' }, el('div', { class: 'rb36-tumpuk' }, el('div', { class: 'rb36-baki-satu' }, card), el('div', { class: 'mk-kode' }, rows)), screen);
    dnd(host, (c, gap) => {
      if (over || !gap.classList.contains('rb36-celah-baris')) return;
      if (gap.dataset.drop !== 'g1') { oops(); shake(c); say(msg, 'bad', DODI_GAPS[gap.dataset.drop][1]); return; }
      over = true; c.classList.add('locked'); gap.replaceChildren(c); gap.classList.add('isi'); ctx.sound.tap(); host.querySelectorAll('.rb36-celah-baris:not(.isi)').forEach((g) => g.remove()); say(msg, 'info', DODI_GAPS.g1[1]);
      play(screen, run(REKAP()).out.slice(0, 3), { end: () => { say(msg, '', 'Kamis 310, Jumat 320, Sabtu 470. Akumulator dinolkan di dalam perulangan luar, tepat sebelum perulangan dalam.'); done(); } });
    });
    fill(area, host, msg);
  }
}

// Misi 3a: move the crown along total_hari.
function terlarisRound(area, ctx, { oops, done }) {
  const msg = msg36('terlaris = 0: mahkota mulai di Kamis.');
  const T = [310, 320, 470]; let h = 1; let cur = 0;
  const crown = el('div', { class: 'rb36-mahkota', 'data-drag': 'mahkota' }, '👑');
  const boxesEl = T.map((v, i) => el('div', { class: 'rb36-podium', 'data-drop': String(i) }, el('small', null, `[${i}] ${HARI[i]}`), el('b', null, String(v))));
  boxesEl[0].append(crown);
  const codeBox = el('div');
  const info = el('div', { class: 'rb36-var' });
  const draw = () => { fill(codeBox, codeView(TERLARIS, { hl: h < 3 ? [2] : [4] })); fill(info, el('span', null, 'h = ', el('b', null, h < 3 ? String(h) : '–')), el('span', null, 'terlaris = ', el('b', null, String(cur))), h < 3 ? el('span', null, `${T[h]} > ${T[cur]}?`) : null); };
  const host = el('div', { class: 'rb36-dua' }, codeBox, el('div', { class: 'rb36-tumpuk' }, el('div', { class: 'rb36-podium-podium' }, boxesEl), info));
  say(msg, 'info', 'h = 1. Seret mahkota ke calon terlaris setelah putaran ini.');
  dnd(host, (c, box) => {
    if (h >= 3) return; const j = +box.dataset.drop; const want = T[h] > T[cur] ? h : cur;
    if (j !== want) { oops(); shake(c); say(msg, 'bad', want === cur ? `${T[h]} tidak lebih besar dari ${T[cur]}, jadi terlaris tetap.` : `${T[h]} > ${T[cur]}: terlaris = h = ${h}.`); return; }
    boxesEl[j].append(crown); cur = j; h++; ctx.sound.tap(); draw();
    if (h < 3) { say(msg, 'info', `h = ${h}. Seret mahkota lagi.`); return; }
    say(msg, 'info', 'Perulangan selesai. Lengkapi keluaran print.');
    host.lastChild.append(fillBoard(ctx, { oops, msg, chips: ['Kamis', 'Jumat', 'Sabtu', '2', '470'], want: ['Sabtu'], view: rowsView([['Hari terlaris: ', '_']]), hints: ['print menampilkan hari[terlaris], yaitu nama harinya.'],
      done: () => { say(msg, '', 'Hari terlaris: Sabtu. Calon awal indeks 0, jadi perulangan cukup mulai dari 1.'); done(); } }));
  });
  draw(); area.append(host, msg);
}

// Misi 3b: build the per-stall program from cards, then tap the best stall.
function stanRound(area, ctx, { oops, done }) {
  const msg = msg36('Susun program total setiap stan. Perulangan luar per stan, dalam per hari.');
  const gridBox = el('div');
  fill(gridBox, grid36());
  const board = tileSlots(ctx, { oops, msg, build: STAN_BUILD, tiles: STAN_TILES, onFull: () => {
    say(msg, 'info', 'Program jalan: kolom demi kolom.'); const tot = run(STANPROG()).vars.total_stan; const shown = [null, null, null, null];
    let j = 0;
    const tick = () => {
      if (!gridBox.isConnected) return;
      if (j < 4) { shown[j] = tot[j]; fill(gridBox, grid36({ col: j, foot: ['total_stan', shown] })); j++; setTimeout(tick, 600); return; }
      fill(gridBox, grid36({ foot: ['total_stan', tot], onCol: pick })); say(msg, 'info', 'Ketuk kolom stan terlaris.');
    };
    tick();
  } });
  let over = false;
  function pick(j) {
    if (over) return;
    if (j !== 0) { oops(); say(msg, 'bad', 'Bandingkan baris total_stan: mana yang terbesar?'); return; }
    over = true; ctx.sound.good(); fill(gridBox, grid36({ col: 0, foot: ['total_stan', [480, 310, 175, 135]] }));
    say(msg, '', 'Stan terlaris: Kue (480). Keempat total stan berjumlah 1100, sama dengan total bazar.'); done();
  }
  area.append(el('div', { class: 'rb36-tumpuk' }, board, gridBox), msg);
}

// Misi 4: run Sari's endless loop, indent the line, predict the output.
function hentiRound(area, ctx, { oops, done }) {
  const msg = msg36('Jalankan program Sari: hari pertama yang mencapai 400.');
  const lines = SARI(); let ran = false; let fixed = false; let busy = false;
  const codeBox = el('div'); const screen = layar(); const count = el('small', { class: 'rb36-putaran' }, 'putaran: 0');
  const draw = () => fill(codeBox, codeView(fixed ? SARI({ indent: true }) : lines, { warn: ran && !fixed ? [5] : [], onLine: ran && !fixed ? tap : null, cls: ran && !fixed ? 'ketuk' : '' }));
  const runBtn = button('▶ Jalankan', () => {
    if (busy || ran) return; busy = true;
    const R = run(lines); let n = 0;
    play(screen, R.out, { gap: 45, err: `⛔ ${R.error?.message || 'Perulangan tidak berhenti'}`, end: () => { busy = false; ran = true; runBtn.remove(); draw(); oopsFree(); } });
    const iv = setInterval(() => { if (!screen.isConnected || n >= R.out.length) { clearInterval(iv); return; } n++; count.textContent = `putaran: ${n}`; }, 45);
  }, 'primary');
  function oopsFree() { say(msg, 'info', 'Program tidak berhenti! Ketuk baris yang seharusnya ikut berulang (dijorokkan).'); }
  function tap(i) {
    if (fixed) return;
    if (i !== 5) { oops(); say(msg, 'bad', SARI_TAP[i]); return; }
    fixed = true; ctx.sound.tap(); draw(); say(msg, 'info', 'i = i + 1 sekarang di dalam perulangan. Susun keluarannya sebelum dijalankan.'); setTimeout(predict, 1600);
  }
  function predict() {
    const out = layar();
    fill(area, el('div', { class: 'rb36-dua' }, codeBox, el('div', { class: 'rb36-tumpuk' }, tileSlots(ctx, { oops, msg, build: [['k', 0], ['j', 0], ['s', 0]], tiles: SARI_OUT, onFull: () => {
      play(out, run(SARI({ indent: true })).out, { end: () => { say(msg, '', 'Ramalanmu cocok dengan layar. Tanpa jorokan, i tidak pernah berubah dan syarat while selalu True.'); done(); } });
    } }), out)), msg);
  }
  draw();
  area.append(el('div', { class: 'rb36-dua' }, codeBox, el('div', { class: 'rb36-tumpuk' }, runBtn, screen, count)), msg);
}

// Misi 5: tap the box read at each check, find the IndexError, fix the order of conditions.
function batasRound(area, ctx, { oops, done }) {
  const msg = msg36('Ambang 500. Setiap pemeriksaan syarat while membaca total_hari[i]. Ketuk kotak yang dibaca.');
  const T = [310, 320, 470]; let i = 0; let over = false;
  const screen = layar();
  const cells = [...T.map((v, k) => el('button', { class: 'rb36-podium', type: 'button', 'data-k': k }, el('small', null, `[${k}]`), el('b', null, String(v)))), el('button', { class: 'rb36-podium hantu', type: 'button', 'data-k': 3 }, el('small', null, '[3]'), el('b', null, '?'))];
  cells.forEach((c, k) => onTap(c, () => pick(k)));
  const info = el('div', { class: 'rb36-var' });
  const drawInfo = () => fill(info, el('span', null, 'pemeriksaan ke-', el('b', null, String(i + 1))), el('span', null, 'i = ', el('b', null, String(i))));
  function pick(k) {
    if (over) return;
    if (k !== i) { oops(); say(msg, 'bad', `i = ${i}, jadi yang dibaca total_hari[${i}].`); return; }
    cells[k].classList.add('baca'); ctx.sound.tap();
    if (k < 3) { screen.textContent = `${i ? `${screen.textContent}\n` : ''}${HARI[k]} belum mencapai 500`; i++; drawInfo(); say(msg, 'info', `${T[k]} < 500 benar: print, lalu i = ${i}.`); return; }
    over = true; cells[3].classList.add('meledak'); screen.append(el('b', { class: 'mk-galat' }, '\nIndexError: list index out of range'));
    say(msg, 'info', 'Pemeriksaan keempat membaca total_hari[3], padahal indeks terakhir 2. Perbaiki syaratnya.'); setTimeout(fixIt, 2600);
  }
  drawInfo();
  area.append(el('div', { class: 'rb36-dua' }, codeView(SARI({ indent: true, batas: 500 }), { hl: [3] }), el('div', { class: 'rb36-tumpuk' }, el('div', { class: 'rb36-podium-podium empat' }, cells), info, screen)), msg);
  function fixIt() {
    let got = 0; const out = layar();
    const slots = [el('span', { class: 'mk-slot sebaris', 'data-drop': '0' }, '?'), el('span', { class: 'mk-slot sebaris', 'data-drop': '1' }, '?')];
    const view = codeView(FIXED500, { line: (k) => (k === 1 ? el('code', null, 'while ', slots[0], ' and ', slots[1], ':') : null) });
    const tray = el('div', { class: 'mk-ubin-baki' }, ctx.rand.shuffle(COND.slice()).map(([id, t]) => el('div', { class: 'mk-ubin', 'data-drag': id }, t)));
    const host = el('div', { class: 'rb36-dua' }, el('div', { class: 'rb36-tumpuk' }, view, tray), out);
    dnd(host, (card, slot) => {
      if (!slot.classList.contains('mk-slot') || slot.classList.contains('isi')) return;
      if (+slot.dataset.drop !== got) { say(msg, 'info', 'Isi syarat kiri dulu.'); return; }
      const id = card.dataset.drag; const want = got === 0 ? 'cek' : 'nilai';
      if (id !== want) { oops(); shake(card); say(msg, 'bad', COND.find((c) => c[0] === id)[2] || (got === 0 ? 'and memeriksa dari kiri. Bila total_hari[i] di kiri, saat i = 3 ia dibaca dulu dan galat.' : 'Syarat ini sudah dipakai di kiri.')); return; }
      card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); got++; ctx.sound.tap();
      if (got < 2) { say(msg, 'info', 'Tepat. Sekarang syarat kanan.'); return; }
      tray.remove();
      play(out, runPy([...PRE, ...FIXED500]).out, { end: () => { say(msg, '', 'and berhenti di False pertama: saat i = 3, i < len(total_hari) sudah False, jadi total_hari[3] tidak pernah dibaca.'); done(); } });
    });
    say(msg, 'info', 'Seret dua syarat ke while … and …. Urutannya penting.');
    fill(area, host, msg);
  }
}

// Misi 6 and Bos: donation loop, then the stalls that rise every day.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg36('30% penjualan setiap hari didonasikan. Hitung terkumpul setelah setiap putaran.');
  area.append(el('div', { class: 'rb36-dua' }, codeView(DONASI_CORE, { hl: [4] }), fillBoard(ctx, { oops, msg, chips: DON_CHIPS, want: DON_WANT,
    view: rowsView([['total_hari = [310, 320, 470]'], ['Kamis: terkumpul ', '_'], ['Jumat: terkumpul ', '_'], ['Sabtu: terkumpul ', '_']]),
    hints: ['310 × 30 // 100.', '93 + 320 × 30 // 100 = 93 + 96.', '189 + 470 × 30 // 100 = 189 + 141.'],
    done: () => { say(msg, 'info', 'Terkumpul 93, 189, 330. Sekarang keluarannya.'); setTimeout(result, 2200); } })), msg);
  function result() {
    fill(area, el('div', { class: 'rb36-dua' }, codeView(DONASI(300).slice(8), {}), fillBoard(ctx, { oops, msg, chips: HASIL_CHIPS, want: HASIL_WANT,
      view: rowsView([['Target 300: tercapai pada hari ', '_'], ['Target 400: belum tercapai, kurang ', '_']]),
      hints: ['330 ≥ 300 baru tercapai setelah putaran Sabtu.', 'Perulangan berhenti karena i mencapai 3: 400 − 330.'],
      done: () => { say(msg, 'info', 'Misi Bos: stan mana yang penjualannya naik setiap hari?'); setTimeout(naik, 2400); } })), msg);
  }
  function naik() {
    let left = 4; const want = run(NAIK).out;
    const bins = [['ya', '📈 naik setiap hari'], ['tidak', '📉 pernah turun']].map(([k, t]) => el('div', { class: 'rb36-wadah', 'data-drop': k }, el('b', null, t), el('div', { class: 'rb36-wadah-isi' })));
    const tray = el('div', { class: 'mk-chip-chip' }, ctx.rand.shuffle(STAN.slice()).map((n) => el('div', { class: 'mk-chip', 'data-drag': n }, n)));
    const out = el('div', { class: 'rb36-tumpuk' });
    const host = el('div', { class: 'rb36-dua' }, el('div', { class: 'rb36-tumpuk' }, grid36(), tray), el('div', { class: 'rb36-tumpuk' }, el('div', { class: 'rb36-wadah-wadah' }, bins), out));
    dnd(host, (chip, bin) => {
      bin = bin.closest('.rb36-wadah'); if (!bin || !left) return;
      const n = chip.dataset.drag; const j = STAN.indexOf(n); const ok = want.includes(n) === (bin.dataset.drop === 'ya');
      if (!ok) { oops(); shake(chip); say(msg, 'bad', `${n}: ${DATA.map((r) => r[j]).join(' → ')}. ${want.includes(n) ? 'Setiap hari lebih besar dari kemarin.' : 'Ada hari yang tidak lebih besar dari kemarin.'}`); return; }
      chip.remove(); bin.querySelector('.rb36-wadah-isi').append(el('span', { class: 'mk-chip locked' }, n)); ctx.sound.tap();
      if (--left) { say(msg, 'info', 'Tepat.'); return; }
      const scr = layar(); fill(out, codeView(NAIK.slice(5), { cls: 'kecil' }), scr);
      play(scr, want, { end: () => { say(msg, '', 'naik dimulai True untuk setiap stan dan menjadi False begitu ada hari yang tidak naik. Keluaran: Kue dan Minuman.'); done(); } });
    });
    fill(area, host, msg);
  }
}

export default {
  id: 'sma-36-rekap-bazar',
  title: 'Rekap Bazar Amal',
  topic: 'Perulangan for dan while di Python, range, list dua dimensi, perulangan bersarang, akumulator, nilai terbesar, perulangan yang tidak berhenti, dan IndexError',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎪',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Ramal isi range, telusuri perulangan bersarang pada data penjualan bazar, cari hari dan stan terlaris, perbaiki perulangan while Sari, lalu lengkapi program target donasi.',
  extraModes: [
    { id: 'jejak', icon: '🔁', label: 'Penelusur Perulangan', desc: 'Kode dan tabel penjualan berdampingan: sel yang dibaca menyala dan setiap baris punya penghitung. Coba program Dodi dan Sari', create: createTrace },
    { id: 'range', icon: '🔢', label: 'Peramal range', desc: 'Atur a, b, dan langkah, tebak isinya, lalu lihat bilangannya sebagai kotak', create: createRange },
    { id: 'donasi', icon: '💝', label: 'Target Donasi', desc: 'Geser target dan persen donasi; grafik batang terkumpul bertambah setiap hari', create: createDonasi },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak print Berikutnya', desc: 'Sebelum layar maju, tim yang mendapat giliran menebak keluaran print berikutnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rb36-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'rb36-area' });
      let bug = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD36[k];
        bug = el('div', { class: 'rb36-bug' }, el('b', null, '🐛 Bug Bazar'), el('span', null, ulah));
        wrap.append(el('div', { class: 'rb36-kepala' }, misiHead(no, judul, tujuan, '🐍'), bug), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { bug.classList.add('beres'); bug.lastChild.textContent = 'Bug dibasmi ✓'; next(ms); } });
      if (r === 0) { go('ramal', 1); ramalRound(area, ctx, fin(5000)); }
      else if (r === 1) { go('setel', 1); setelRound(area, ctx, fin(5000)); }
      else if (r === 2) { go('jalan', 2); jalanRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('hitung', 2); hitungRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('dodi', 2); dodiRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('terlaris', 3); terlarisRound(area, ctx, fin(5000)); }
      else if (r === 6) { go('stan', 3); stanRound(area, ctx, fin(5500)); }
      else if (r === 7) { go('henti', 4); hentiRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('batas', 5); batasRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let ver = 'rekap'; let tr = null;
  const VERS = [['rekap', 'program rekap', () => REKAP()], ['dodi', 'Dodi: jumlah = 0 di luar', () => REKAP(true)], ['stan', 'total setiap stan', () => STANPROG()], ['sari', 'Sari: W4 tidak menjorok', () => SARI()], ['sari2', 'W4 dijorokkan', () => SARI({ indent: true })], ['500', 'ambang 500', () => SARI({ indent: true, batas: 500 })], ['and', '500 dengan and', () => SARI({ indent: true, batas: 500, and: true })], ['naik', 'tantangan: naik setiap hari', () => NAIK]];
  const draw = () => { tr?.stop(); tr = loopTracer(VERS.find((v) => v[0] === ver)[2](), ver.startsWith('sari') || ver === '500' || ver === 'and' ? { extra: null, hideVars: ['hari'] } : {});
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur perulangan'), el('div', { class: 'seg rb-versi' }, VERS.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))), tr); };
  draw();
}

function createRange(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let a = 0; let b = 10; let s = 3; let shown = false;
  const draw = () => {
    const src = `range(${a}, ${b}, ${s})`; const v = runPy([`x = list(${src})`]).vars.x || [];
    const wrongs = [[...v, b], v.slice(1), v.map((x) => x + 1)].map((w) => pyRepr(w));
    const opts = [...new Set([pyRepr(v), ...wrongs])].sort();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `list(${src})`), el('div', { class: 'rb-atur' }, stepper(a, (x) => { a = x; shown = false; draw(); }, { min: -10, max: 20, label: 'a' }), stepper(b, (x) => { b = x; shown = false; draw(); }, { min: -10, max: 20, label: 'b' }), stepper(s, (x) => { s = x === 0 ? (s > 0 ? -1 : 1) : x; shown = false; draw(); }, { min: -5, max: 5, label: 'langkah' })),
      shown ? el('div', { class: 'rb-kotak-kotak' }, v.length ? v.map((x) => el('span', null, String(x))) : el('em', null, 'kosong: []')) : el('div', { class: 'seg rb-tebak' }, opts.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { if (o === pyRepr(v)) ctx.sound.good(); else ctx.sound.bad(); shown = true; draw(); say(wrap.querySelector('.reveal'), o === pyRepr(v) ? '' : 'bad', o === pyRepr(v) ? 'Tepat.' : `Belum tepat: isinya ${pyRepr(v)}. Ingat, berhenti sebelum b.`); }))),
      el('p', { class: 'reveal info' }, 'Tebak isinya dulu.'));
  };
  draw();
}

function createDonasi(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  let target = 300; let persen = 30;
  const draw = () => {
    const R = run(DONASI(target, persen)); const tot = [310, 320, 470]; const acc = []; let t = 0; for (const x of tot) { t += Math.floor((x * persen) / 100); acc.push(t); }
    const max = Math.max(target, acc.at(-1)) * 1.1;
    const sl = (v, min, max2, step, set, label) => { const i = el('input', { type: 'range', min: String(min), max: String(max2), step: String(step), value: String(v), 'aria-label': label }); i.addEventListener('input', () => { set(Number(i.value)); draw(); }); return el('label', { class: 'rb-geser' }, el('small', null, `${label}: ${v}`), i); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Target donasi'), el('div', { class: 'rb-atur' }, sl(target, 50, 600, 10, (v) => { target = v; }, 'target'), sl(persen, 5, 60, 5, (v) => { persen = v; }, 'persen')),
      el('div', { class: 'rb-grafik', role: 'img', 'aria-label': 'Grafik terkumpul per hari' }, el('i', { class: 'rb-target', style: { bottom: `${(target / max) * 100}%` } }, el('small', null, `target ${target}`)),
        HARI.map((h, k) => el('div', { class: 'rb-kolom' }, el('div', { class: 'rb-wadah' }, el('b', { class: `rb-batang ${acc[k] >= target ? 'capai' : ''}`, style: { height: `${(acc[k] / max) * 100}%` } }, String(acc[k]))), el('small', null, h)))),
      pyCode(DONASI(target, persen).slice(2), { cls: 'rb-kecil' }), el('pre', { class: 'rb-keluaran' }, R.out.join('\n')));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rekap-bazar' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const progs = [REKAP(), REKAP(true), SARI({ indent: true }), DONASI(400)]; let p = 0; let k = 0; let team = 0;
    function step() {
      if (p >= progs.length) { finishBoard(wrap, ctx, { title: 'Tebak print selesai', pts, again: () => pickTeams(wrap, 'Tebak print Berikutnya', start) }); return; }
      const lines = progs[p]; const out = run(lines).out; if (k >= out.length) { p++; k = 0; step(); return; }
      const right = out[k]; const pool = [...new Set([right, ...run(REKAP()).out, ...run(REKAP(true)).out, ...run(SARI({ indent: true })).out, ...run(DONASI(300)).out, ...run(DONASI(400)).out].filter((x) => x.split(' ')[0] === right.split(' ')[0]))];
      const opts = [right, ...pool.filter((x) => x !== right).slice(0, 3)].sort();
      const msg = el('p', { class: 'reveal info' }, `Tim ${team + 1}: keluaran print ke-${k + 1}?`);
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Program ${p + 1} dari ${progs.length}`), pyCode(lines, { cls: 'rb-kecil' }), el('pre', { class: 'rb-keluaran' }, out.slice(0, k).join('\n') || ' '),
        el('div', { class: 'seg rb-tebak' }, (opts.length > 1 ? opts : [right, `${right}0`]).map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => {
          const ok = o === right; if (ok) { pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
          say(msg, ok ? '' : 'bad', ok ? `Tepat, Tim ${team + 1} +1.` : `Belum tepat: ${right}`); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); wrap.querySelector('.rb-tebak')?.remove();
          k++; team = (team + 1) % nT; setTimeout(step, 2600);
        }))), msg);
    }
    step();
  }
  pickTeams(wrap, 'Tebak print Berikutnya', start);
}
