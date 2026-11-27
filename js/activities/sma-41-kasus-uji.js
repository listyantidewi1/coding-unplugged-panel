// Kasus Uji Tiket Museum — SMA/SMK (16–18 tahun), coding. Testing a Python
// fare function: expected results from the rules (never from the code),
// equivalence classes, boundary values, two hidden bugs (age 60 and the
// holiday surcharge on free tickets), assert versus a table of cases, and
// writing tests first for the member discount. Team mode hunts mutants.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, layar, play, adeganDulu, grafikBatang } from './misi-kit.js';
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

// ---- Permainan: Pemburu Bug Mesin Tiket ----
// Test cards are shot at the cunning ticket machine; expectations always come
// from the rule board, never from the code.
const HEAD41 = {
  harapan: ['Kartu Harapan', 'Tulis harga yang benar menurut papan tarif untuk setiap pengunjung.', 'Mesin menunggu tanpa diuji…'],
  pita: ['Pita Kelas Umur', 'Taruh kartu wakil di pita kelasnya, lalu hitung kombinasinya.', '"Uji semua umur satu per satu saja!"'],
  batas: ['Jaga Perbatasan', 'Tancapkan bendera di kedua sisi setiap batas kelas.', 'Bug suka bersembunyi di perbatasan!'],
  tembak: ['Tembak Mesin Tiket', 'Tembakkan kartu batas, cap LULUS atau GAGAL, lalu bongkar bugnya.', 'Bug pertama bersembunyi di satu umur saja!'],
  kombi: ['Kombinasi Hari Libur', 'Uji gabungan kelas dan hari libur, lalu bongkar bug kedua.', 'Bug kedua menunggu hari libur…'],
  rudi: ['Uji Gaya Rudi', 'Ramalkan apa yang tampil saat assert gagal.', 'assert berhenti di kegagalan pertama!'],
  rina: ['Uji Gaya Rina', 'Ketuk kasus yang gagal di tabel Rina.', 'Menyembunyikan kegagalan kedua…'],
  dulu: ['Uji Lebih Dulu', 'Ajukan pertanyaan yang tepat, lalu tulis empat assert sebelum kodenya ada.', 'Aturan baru: anggota setengah harga!'],
  mutan: ['Berburu Mutan', 'Tembakkan kartu uji sampai mutan ketahuan, makin sedikit makin baik.', 'Satu karakter di mesin diam-diam diubah!'],
  bos: ['Umur Pecahan', 'Uji umur pecahan, lalu perbaiki kondisi batasnya.', 'Petugas mengetik umur 12.5!'],
};
const msg41 = (t) => el('p', { class: 'reveal info' }, t);
const papanTarif = () => el('table', { class: 'pb41-papan' }, el('tr', null, el('th', { colspan: '2' }, '🏛️ Papan tarif')), [['0–4 tahun', 'gratis'], ['5–12 tahun', 'Rp5.000'], ['13–59 tahun', 'Rp15.000'], ['13–59, kartu pelajar', 'Rp8.000'], ['60 tahun ke atas', 'Rp7.500'], ['hari libur, berbayar', '+ Rp2.000'], ['umur < 0 atau > 120', 'None']].map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, b))));
const half = (id, k, o = {}) => codeView(codeOf(id).slice(k * 8, k * 8 + 8), { labels: L16.slice(k * 8, k * 8 + 8), ...o });
export const H41 = { harapan: SOAL1.map(([, u, p, l]) => rp(aturan(u, p, l))) };

// Misi 1: expected prices from the rule board.
function harapanRound(area, ctx, { oops, done }) {
  const msg = msg41('Seret harga dari papan tarif ke setiap pengunjung, dari atas.');
  area.append(el('div', { class: 'pb41-dua' }, papanTarif(), fillBoard(ctx, { oops, msg, view: rowsView(SOAL1.map(([who]) => [`${who}: `, '_'])), chips: [...H41.harapan, 'Rp17.000', 'Rp5.000', 'Rp8.000'], want: H41.harapan,
    hints: ['Dewasa 41 tahun, hari biasa.', '38 tahun dengan kartu mahasiswa Rp8.000, ditambah Rp2.000 hari Sabtu.', 'Umur 12 masih tiket anak Rp5.000 (tarif pelajar hanya 13–59), ditambah Rp2.000 hari Minggu.', 'Lansia Rp7.500 ditambah Rp2.000 tanggal merah.', '2 tahun gratis.', 'Umur di atas 120 tidak valid: None.'],
    done: () => { say(msg, '', 'Harapan ditulis dari papan tarif, bukan dari kode. Kalau dari kode, bug ikut tersalin ke harapan.'); done(); } })), msg);
}

// Misi 2: representatives into age bands, then combinations.
const PITA = [['tidak valid', 'umur < 0', -5], ['gratis', '0–4', 3], ['anak', '5–12', 8], ['dewasa', '13–59', 30], ['lansia', '60–120', 70], ['tidak valid', 'umur > 120', 150]];
function pitaRound(area, ctx, { oops, done }) {
  const msg = msg41('Seret setiap kartu wakil ke pita kelas umurnya.'); let n = 0; const box = el('div', { class: 'pb41-kolom' });
  const line = el('div', { class: 'pb41-pita' }, PITA.map(([nm, rg], i) => el('div', { class: `pb41-kelas k${i}`, 'data-drop': String(i) }, el('b', null, nm), el('small', null, rg), el('div', { class: 'pb41-isi' }))));
  const tray = el('div', { class: 'pb41-baki' }, ctx.rand.shuffle(PITA.map(([, , u]) => u)).map((u) => el('div', { class: 'pb41-tag', 'data-drag': String(u) }, `umur ${u}`)));
  const host = el('div', { class: 'pb41-kolom' }, line, tray);
  dnd(host, (tag, band) => {
    if (!band.classList.contains('pb41-kelas')) return; const u = +tag.dataset.drag; const want = PITA.findIndex((x) => x[2] === u);
    if (+band.dataset.drop !== want) { oops(); shake(tag); say(msg, 'bad', `Umur ${u} masuk rentang ${PITA[want][1]}.`); return; }
    tag.classList.add('locked'); tag.append(el('code', null, ` → ${py(aturan(u, false, false))}`)); band.querySelector('.pb41-isi').append(tag); ctx.sound.tap(); n++;
    if (n < PITA.length) { say(msg, 'info', 'Tepat. Satu wakil mewakili seluruh pitanya.'); return; }
    tray.remove(); say(msg, 'info', 'Masukan pelajar dan libur juga punya kelas. Lengkapi hitungannya.');
    fill(box, fillBoard(ctx, { oops, msg, view: rowsView([['tarif(30, True, False) → ', '_'], ['tarif(30, False, True) → ', '_'], ['kombinasi kelas: 4 × 2 × 2 = ', '_'], ['semua umur 0–120: 121 × 2 × 2 = ', '_']]), chips: ['8000', '17000', '16', '484', '15000', '8', '242'], want: ['8000', '17000', '16', '484'],
      hints: ['Dewasa dengan kartu pelajar.', 'Dewasa pada hari libur: 15000 + 2000.', '4 kelas valid, pelajar ya/tidak, libur ya/tidak.', '121 umur, dikali 2 dan 2.'], done: () => { say(msg, '', '16 uji mewakili semua kelas, jauh lebih hemat daripada 484.'); done(); } }));
  });
  fill(box, host);
  area.append(box, msg);
}

// Misi 3: flags on both sides of every boundary.
const DEKAT = [-2, -1, 0, 1, 3, 4, 5, 6, 11, 12, 13, 14, 58, 59, 60, 61, 119, 120, 121, 122];
function batasRound(area, ctx, { oops, done }) {
  const msg = msg41('Ketuk umur di kedua sisi setiap batas kelas. Ada 10 bendera.'); const got = new Set(); const box = el('div', { class: 'pb41-kolom' });
  const draw = () => fill(box, el('div', { class: 'pb41-garis' }, DEKAT.map((u) => onTap(el('button', { type: 'button', class: `pb41-titik ${got.has(u) ? 'on' : ''}`, 'data-u': String(u) }, got.has(u) ? '🚩' : '', el('small', null, String(u))), () => tap(u)))), el('small', null, `Bendera: ${got.size} dari 10`));
  function tap(u) {
    if (got.size >= 10 || got.has(u)) return;
    if (!BATAS.includes(u)) { oops(); say(msg, 'bad', `Umur ${u} ada di tengah kelasnya, bukan tepat di sisi batas.`); return; }
    got.add(u); ctx.sound.tap(); draw();
    if (got.size < 10) { say(msg, 'info', 'Tepat.'); return; }
    say(msg, 'info', 'Sepuluh bendera! Tulis harapan di empat bendera yang paling rawan.');
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['59 → ', '_', '   60 → ', '_'], ['120 → ', '_', '   121 → ', '_']]), chips: ['Rp15.000', 'Rp7.500', 'Rp7.500', 'None', 'Rp0'], want: ['Rp15.000', 'Rp7.500', 'Rp7.500', 'None'],
      hints: ['59 masih dewasa.', '60 sudah lansia.', '120 masih valid dan lansia.', 'Di atas 120 tidak valid.'], done: () => { say(msg, '', 'Nilai batas: −1, 0, 4, 5, 12, 13, 59, 60, 120, 121. Bug salah tanda < dan <= hanya tertangkap di sini.'); done(); } }));
  }
  draw();
  area.append(box, msg);
}

// Stamp every shot as LULUS or GAGAL; then onEnd().
function stampBoard(ctx, { oops, msg, id, cases, onEnd }) {
  let k = 0; const log = el('div', { class: 'pb41-log' }); const cur = el('div', { class: 'pb41-kolom' });
  const draw = () => { const c = cases[k]; if (!c) { fill(cur); return; } const want = py(aturan(...c)); const got = hasil(id, ...c);
    fill(cur, el('div', { class: 'pb41-tembak', 'data-ok': String(want === got) }, el('code', null, call(...c)), el('span', null, `harapan ${want}`), el('span', null, `🎰 mesin ${got}`)),
      el('div', { class: 'pb41-tombol' }, onTap(el('button', { type: 'button', class: 'pb41-cap lulus', 'data-v': 'lulus' }, '✓ LULUS'), () => stamp(true)), onTap(el('button', { type: 'button', class: 'pb41-cap gagal', 'data-v': 'gagal' }, '✗ GAGAL'), () => stamp(false)))); };
  function stamp(v) {
    const c = cases[k]; if (!c) return; const ok = py(aturan(...c)) === hasil(id, ...c);
    if (v !== ok) { oops(); say(msg, 'bad', 'Bandingkan harapan dengan hasil mesin: sama berarti LULUS, beda berarti GAGAL.'); return; }
    log.append(el('span', { class: ok ? 'lulus' : 'gagal' }, `${call(...c)} ${ok ? '✓' : '✗'}`)); k++; ctx.sound.tap(); draw();
    if (k < cases.length) { say(msg, 'info', 'Kartu berikutnya.'); return; }
    onEnd();
  }
  draw();
  return el('div', { class: 'pb41-kolom' }, cur, log);
}

// Misi 4: shoot the boundary cards, find line 8, fix it.
function tembakRound(area, ctx, { oops, done }) {
  const msg = msg41('Mesin menjawab setiap kartu batas. Cap LULUS atau GAGAL.'); const right = el('div', { class: 'pb41-kolom' }); const left = el('div', { class: 'pb41-kolom' });
  fill(left, half('asli', 0));
  fill(right, stampBoard(ctx, { oops, msg, id: 'asli', cases: BATAS.map((u) => [u, false, false]), onEnd: () => {
    say(msg, 'info', 'Hanya umur 60 gagal: mesin menagih Rp15.000. Ketuk baris bugnya.');
    fill(left, half('asli', 0, { cls: 'ketuk', onLine: (i) => {
      if (i !== 7) { oops(); say(msg, 'bad', 'Cari baris yang memutuskan siapa lansia.'); return; }
      ctx.sound.good(); say(msg, 'info', 'Baris 8! Pasang tanda yang memasukkan 60 ke kelas lansia.');
      fill(left, fillBoard(ctx, { oops, msg, view: codeFill([['    elif umur ', '_', ' 60:'], '        harga = 7500'], { labels: ['8', '9'] }), chips: ['>=', '>', '<=', '=='], want: ['>='], hints: ['60 tahun ke atas, termasuk 60.'],
        done: () => { say(msg, '', 'umur >= 60. Bug "> lawan >=" hanya tertangkap oleh bendera di batas.'); done(); } }));
    } }));
  } }));
  area.append(el('div', { class: 'pb41-dua' }, left, right), msg);
}

// Misi 4b: holiday combinations on the fixed-line-8 version.
function kombiRound(area, ctx, { oops, done }) {
  const msg = msg41('Baris 8 sudah benar. Uji gabungan kelas dan hari libur.'); const right = el('div', { class: 'pb41-kolom' }); const left = el('div', { class: 'pb41-kolom' });
  fill(left, half('fix8', 1));
  fill(right, stampBoard(ctx, { oops, msg, id: 'fix8', cases: KOMBI, onEnd: () => {
    say(msg, 'info', 'Anak 3 tahun gratis, tetapi ditagih Rp2.000 di hari libur. Ketuk baris bugnya.');
    fill(left, half('fix8', 1, { cls: 'ketuk', onLine: (i) => {
      if (i !== 5) { oops(); say(msg, 'bad', 'Cari baris yang memutuskan kapan tambahan hari libur dikenakan.'); return; }
      ctx.sound.good(); say(msg, 'info', 'Baris 14! Tambahan hanya untuk tiket berbayar.');
      fill(left, fillBoard(ctx, { oops, msg, view: codeFill([['    if libur ', '_', ':'], '        harga = harga + 2000'], { labels: ['14', '15'] }), chips: ['and harga > 0', 'or harga > 0', 'and harga == 0', 'and umur > 0'], want: ['and harga > 0'], hints: ['Tiket gratis tidak boleh ditambah: harganya harus lebih dari 0.'],
        done: () => { say(msg, 'info', 'Ara (2 tahun) dan kakeknya (60 tahun) datang hari Minggu.');
          fill(right, fillBoard(ctx, { oops, msg, view: rowsView([['mesin lama menagih: ', '_'], ['seharusnya: ', '_']]), chips: ['Rp19.000', 'Rp9.500', 'Rp17.000', 'Rp7.500'], want: ['Rp19.000', 'Rp9.500'],
            hints: ['Mesin lama: Ara Rp2.000 dan kakek Rp17.000 (dianggap dewasa).', 'Ara gratis, kakek Rp7.500 + Rp2.000.'], done: () => { say(msg, '', 'Dua bug tertangkap. Kombinasi yang tidak pernah diuji adalah tempat bug bersembunyi.'); done(); } })); } }));
    } }));
  } }));
  area.append(el('div', { class: 'pb41-dua' }, left, right), msg);
}

// Misi 5a: Rudi's asserts.
const RUDI_LAB = ['17', '18', '19', '20', '21', '22'];
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg41('Rudi menjalankan uji() pada mesin asli. Seret apa yang tampil ke layar.'); const out = layar(); const left = el('div', { class: 'pb41-kolom' }); const right = el('div', { class: 'pb41-kolom' });
  const A = runWith('asli', RUDI); const B = runWith('fix8', RUDI);
  fill(left, codeView(RUDI, { labels: RUDI_LAB }));
  const opts = [['a', A.error.text], ['b', 'Semua uji lulus'], ['c', 'AssertionError'], ['d', 'GAGAL: 60 False False']];
  const host = el('div', { class: 'pb41-kolom' }, el('div', { class: 'pb41-layar', 'data-drop': 'layar' }, el('small', null, 'Layar'), out), el('div', { class: 'pb41-baki' }, opts.map(([k, t]) => el('div', { class: 'pb41-tag', 'data-drag': k }, t))));
  dnd(host, (tag, t) => {
    if (t.dataset.drop !== 'layar') return;
    if (tag.dataset.drag !== 'a') { oops(); shake(tag); say(msg, 'bad', tag.dataset.drag === 'b' ? 'Mesin asli menagih Rp15.000 untuk umur 60: assert baris 19 gagal.' : 'assert dengan pesan menampilkan pesannya, lalu program berhenti.'); return; }
    ctx.sound.good(); play(out, [], { err: A.error.text, end: () => { say(msg, 'info', 'Program berhenti di baris 19; baris 20 tidak pernah dijalankan. Rudi memperbaiki baris 8 lalu menjalankan lagi. Ketuk baris tempat uji berhenti sekarang.'); stop2(); } });
    host.querySelector('.pb41-baki').remove();
  });
  fill(right, host);
  area.append(el('div', { class: 'pb41-dua' }, left, right), msg);
  function stop2() {
    fill(left, codeView(RUDI, { labels: RUDI_LAB, cls: 'ketuk', onLine: (i) => {
      if (i !== B.error.line - 16) { oops(); say(msg, 'bad', i === 2 ? 'Baris 8 sudah diperbaiki, jadi assert umur 60 kini lulus.' : 'Uji mana yang masih memakai bug kedua?'); return; }
      ctx.sound.good(); play(out, [], { err: B.error.text, end: () => { say(msg, '', 'Baris 20 gagal dengan AssertionError tanpa pesan: tidak jelas apa yang salah. Gaya Rudi berhenti di kegagalan pertama.'); done(); } });
    } }));
  }
}

// Misi 5b: Rina's table of cases.
function rinaRound(area, ctx, { oops, done }) {
  const msg = msg41('Rina menjalankan semua kasus pada mesin asli. Ketuk kasus yang GAGAL.'); const C = runWith('asli', RINA);
  const failIdx = [1, 2, 3, 4].filter((k) => { const m = RINA[k].match(/\((-?\d+), (\w+), (\w+), (\d+)\)/); return String(m[4]) !== hasil('asli', +m[1], m[2] === 'True', m[3] === 'True'); });
  const got = new Set(); const left = el('div', { class: 'pb41-kolom' }); const right = el('div', { class: 'pb41-kolom' });
  const draw = () => fill(left, codeView(RINA.slice(0, 6), { labels: RINA.slice(0, 6).map((_, i) => `T${i + 1}`), cls: 'ketuk', hl: [...got], onLine: (i) => tap(i) }));
  function tap(i) {
    if (got.size >= failIdx.length || got.has(i)) return;
    if (!failIdx.includes(i)) { oops(); say(msg, 'bad', i >= 1 && i <= 4 ? 'Kasus ini lulus: harapan sama dengan hasil mesin.' : 'Ketuk baris kasus (tuple).'); return; }
    got.add(i); ctx.sound.tap(); draw();
    if (got.size < failIdx.length) { say(msg, 'info', 'Tepat. Masih ada lagi.'); return; }
    say(msg, 'info', 'Dua kasus gagal. Lengkapi baris terakhir keluaran Rina.');
    fill(right, el('pre', { class: 'mk-layar' }, C.out.slice(0, -1).join('\n')), fillBoard(ctx, { oops, msg, view: rowsView([['', '_', ' dari ', '_', ' uji gagal']]), chips: ['2', '4', '1', '3'], want: ['2', '4'], hints: ['Hitung baris GAGAL.', 'len(kasus): ada empat tuple.'],
      done: () => { say(msg, '', 'Gaya Rina menjalankan semua kasus dan menunjukkan masukan, hasil, dan harapan setiap kegagalan.'); done(); } }));
  }
  draw();
  area.append(el('div', { class: 'pb41-dua' }, left, right), msg);
}

// Misi 6: ask first, then write asserts before the code.
export const TANYA = [['ya1', 'Potongan dihitung sebelum atau sesudah tambahan hari libur?', true], ['ya2', 'Apakah potongan juga berlaku untuk tiket anak dan lansia?', true], ['no1', 'Apakah fungsinya boleh ditulis dengan Python?', false], ['no2', 'Tiketnya dicetak berwarna atau hitam putih?', false], ['no3', 'Berapa umur pengelola museum?', false]];
export const DULU = ['7500', '8500', '4750', '0'];
function duluRound(area, ctx, { oops, done }) {
  const msg = msg41('Ketuk dua pertanyaan yang perlu diajukan sebelum menulis harapan.'); let n = 0; const box = el('div', { class: 'pb41-kolom' }); const out = layar();
  fill(box, el('div', { class: 'pb41-tanya' }, TANYA.map(([k, t, ok]) => onTap(el('button', { type: 'button', class: 'pb41-pilih', 'data-k': k }, t), (e) => {
    const b = e.currentTarget || e.target.closest('button'); if (n >= 2 || b.classList.contains('on')) return;
    if (!ok) { oops(); shake(b); say(msg, 'bad', 'Jawabannya tidak mengubah angka harapan.'); return; }
    b.classList.add('on'); ctx.sound.tap(); n++;
    if (n < 2) { say(msg, 'info', 'Tepat. Satu lagi.'); return; }
    say(msg, 'info', 'Pengelola: "Potongan dari harga akhir, termasuk tambahan libur, untuk semua jenis tiket." Tulis harapannya.'); setTimeout(asserts, 1600);
  }))));
  area.append(box, msg);
  function asserts() {
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['assert tarif(41, False, False, True) == _', 'assert tarif(41, False, True, True) == _', 'assert tarif(70, False, True, True) == _', 'assert tarif(3, False, True, True) == _'].map((l) => [l.slice(0, -2), '_'])), chips: [...DULU, '9500', '17000', '3750'], want: DULU,
      hints: ['15000 dibagi 2.', '(15000 + 2000) dibagi 2.', '(7500 + 2000) dibagi 2.', 'Tiket gratis tetap 0.'], done: () => {
        say(msg, 'info', 'Uji dijalankan pada fungsi lama (tiga masukan)…'); fill(box, out);
        play(out, [], { err: hasil('benar', 41, false, false, true), end: () => setTimeout(() => { const R = runWith('anggota', ['assert tarif(41, False, False, True) == 7500', 'assert tarif(41, False, True, True) == 8500', 'assert tarif(70, False, True, True) == 4750', 'assert tarif(3, False, True, True) == 0', 'assert tarif(60, False, False) == 7500', 'print("Semua uji lulus")']);
          play(out, R.out, { end: () => { say(msg, '', 'Uji gagal dulu (fungsi belum siap), lalu lulus setelah anggota=False dan harga // 2 ditambahkan. Uji lama tetap lulus.'); done(); } }); }, 1200) });
      } }));
  }
}

// Misi mutan: shoot cards until the mutant shows itself.
export const MUTAN_RONDE = 'M2';
function mutanRound(area, ctx, { oops, done }) {
  const msg = msg41('Satu karakter mesin diubah diam-diam. Tembakkan kartu batas sampai ada yang GAGAL.'); let shots = 0; const box = el('div', { class: 'pb41-kolom' }); const log = el('div', { class: 'pb41-log' });
  const draw = () => fill(box, el('div', { class: 'pb41-garis' }, BATAS.map((u) => onTap(el('button', { type: 'button', class: 'pb41-titik', 'data-u': String(u) }, '🎯', el('small', null, String(u))), (e) => shoot(u, e.currentTarget || e.target.closest('button'))))), el('small', { class: 'pb41-hitung' }, `Tembakan: ${shots}`), log);
  let caught = false;
  function shoot(u, b) {
    if (caught || b.disabled) return; b.disabled = true; shots++; const want = py(aturan(u, false, false)); const got = hasil(MUTAN_RONDE, u, false, false); ctx.sound.tap();
    log.append(el('span', { class: want === got ? 'lulus' : 'gagal' }, `tarif(${u}) → ${got} ${want === got ? '✓' : `✗ (harapan ${want})`}`));
    box.querySelector('.pb41-hitung').textContent = `Tembakan: ${shots}`;
    if (want === got) { say(msg, 'info', 'Lulus. Mutan belum ketahuan.'); return; }
    caught = true; say(msg, 'info', `Ketahuan dengan ${shots} tembakan! Mutan yang mana?`);
    box.append(el('div', { class: 'pb41-tanya' }, MUTAN.filter((m) => ['M1', 'M2', 'M3'].includes(m[0])).map(([k, t]) => onTap(el('button', { type: 'button', class: 'pb41-pilih', 'data-k': k }, t), () => {
      if (k !== MUTAN_RONDE) { oops(); say(msg, 'bad', 'Lihat umur yang gagal: batas kelas mana yang ada di sana?'); return; }
      ctx.sound.good(); say(msg, '', 'Mutan "umur < 12" membuat anak 12 tahun membayar tarif dewasa. Hanya kartu batas 12 yang menangkapnya.'); done();
    }))));
  }
  draw();
  area.append(box, msg);
}

// Misi Bos: fractional ages.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg41('Petugas mengetik umur pecahan. Ramalkan hasil fungsi yang sudah diperbaiki.'); const box = el('div', { class: 'pb41-kolom' });
  const H = [4.5, 12.5, 59.5].map((u) => hasil('benar', u, false, false));
  fill(box, half('benar', 0), fillBoard(ctx, { oops, msg, view: rowsView([['tarif(4.5, False, False) → ', '_'], ['tarif(12.5, False, False) → ', '_'], ['tarif(59.5, False, False) → ', '_']]), chips: [...H, '5000', '7500'], want: H,
    hints: ['4.5 < 5: gratis, ikut tahun penuhnya 4.', '12.5 <= 12 salah, jadi ia jatuh ke dewasa, padahal tahun penuhnya 12!', '59.5 >= 60 salah: dewasa, ikut tahun penuhnya 59. Konsisten.'],
    done: () => { say(msg, 'info', 'Batas 12/13 tidak konsisten. Ubah kondisi supaya pecahan ikut tahun penuhnya.'); setTimeout(fix, 1600); } }));
  area.append(box, msg);
  function fix() {
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill([['    if umur < 0 or umur ', '_', ' 121:'], '        return None', '    if umur < 5:', '        harga = 0', ['    elif umur ', '_', ' 13:'], '        harga = 5000']), chips: ['>=', '<', '>', '<='], want: ['>=', '<'],
      hints: ['120.5 masih umur 120: tolak mulai 121.', '12.5 masih umur 12: anak kalau kurang dari 13.'], done: () => {
        const F = BODY({ l2: 'umur >= 121', l6: 'umur < 13' }); const r = (u) => { const R = runPy([...F, `x = tarif(${u}, False, False)`], { limit: 2000 }); return R.error ? R.error.text : pyRepr(R.vars.x); };
        fill(box, el('pre', { class: 'mk-layar' }, [`tarif(12.5, …) → ${r(12.5)}`, `tarif(120.5, …) → ${r(120.5)}`, `tarif("12", …) → ${r('"12"')}`].join('\n')));
        say(msg, '', 'Pecahan kini ikut tahun penuhnya. Teks "12" tetap ditolak dengan TypeError: kasus uji untuk masukan yang salah jenis juga perlu.'); done();
      } }));
  }
}

// The ticket board as a queue at the museum gate, before the tariff table.
const adegan41 = () => ({ judul: 'Antrean di gerbang museum', ket: 'Tinggi batang = harga tiket. Hari libur, setiap tiket berbayar naik Rp2.000. Umur yang mustahil tidak punya harga.',
  isi: grafikBatang([['0–4 th', '👶', 0, 'gratis'], ['5–12 th', '🧒', 5000, 'Rp5.000'], ['13–59 th', '🧑', 15000, 'Rp15.000'], ['13–59, pelajar', '🎒', 8000, 'Rp8.000'], ['60 th ke atas', '👵', 7500, 'Rp7.500'], ['umur < 0 atau > 120', '🚫', 0, 'None']]
    .map(([label, ikon, nilai, teks], i) => ({ label, ikon, nilai, teks, warna: ['#a8a29e', '#f59e0b', '#ea580c', '#0d9488', '#7c3aed', '#9ca3af'][i] })), { tinggi: 6 }) });

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
    const wrap = el('div', { class: 'act pb41-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pb41-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD41[k];
        foe = el('div', { class: 'pb41-musuh' }, el('b', null, '🎰 Mesin Tiket Licik'), el('span', null, ulah));
        wrap.append(el('div', { class: 'pb41-kepala' }, misiHead(no, judul, tujuan, '🎟️'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Bug tertangkap ✓'; next(ms); } });
      if (r === 0) { go('harapan', 1); harapanRound(area, ctx, fin(5000)); adeganDulu(ctx, area, adegan41()); }
      else if (r === 1) { go('pita', 2); pitaRound(area, ctx, fin(5000)); }
      else if (r === 2) { go('batas', 3); batasRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('tembak', 4); tembakRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('kombi', 4); kombiRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('rudi', 5); rudiRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('rina', 5); rinaRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('dulu', 6); duluRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('mutan', 6); mutanRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
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
