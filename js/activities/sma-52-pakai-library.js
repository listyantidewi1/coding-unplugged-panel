// Memakai Library: Kalender Pasaran — SMA/SMK (16–18 tahun), coding. Weton from
// the five-day pasaran cycle and the seven-day week: datetime's date, weekday,
// subtraction and timedelta (run in mini-py), Python's % that stays 0–4 for
// negative day differences, Rudi's hand-written day count that forgets the
// century rule (right only from 1 March 1900 to 28 February 2100), and choosing
// a third-party library. Day counts are whole days (proleptic Gregorian).

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, stepper, fmtNum } from './smp-kit.js';
import { runPy, ordinalOf, fromOrdinal, panjangBulan } from './mini-py.js';

export const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const PROGRAM = ['from datetime import date, timedelta', 'PASARAN = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"]', 'HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]', 'PATOKAN = date(1945, 8, 17)  # Jumat Legi', 'def pasaran(tanggal):', '    selisih = (tanggal - PATOKAN).days', '    return PASARAN[selisih % 5]', 'def weton(tanggal):', '    return HARI[tanggal.weekday()] + " " + pasaran(tanggal)', 'print(weton(date(2026, 10, 21)))'];
export const RUDI = ['def kabisat(t):', '    return t % 4 == 0', 'def hari_ke(t, b, h):', '    jumlah = 0', '    for th in range(1, t):', '        if kabisat(th):', '            jumlah = jumlah + 366', '        else:', '            jumlah = jumlah + 365', '    panjang = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]', '    if kabisat(t):', '        panjang[1] = 29', '    for i in range(b - 1):', '        jumlah = jumlah + panjang[i]', '    return jumlah + h', 'def pasaran_rudi(t, b, h):', '    return PASARAN[(hari_ke(t, b, h) - hari_ke(1945, 8, 17)) % 5]'];
const RUDI_LABEL = RUDI.map((_, i) => `R${i + 1}`);
const PATOKAN = ordinalOf(1945, 8, 17);
const AWAL26 = ordinalOf(2026, 1, 1);
const mod = (n, k) => ((n % k) + k) % k;

// Weton by date arithmetic (the same day numbers datetime uses).
export const hariDari = (o) => HARI[(o + 6) % 7];
export const pasaranDari = (o) => PASARAN[mod(o - PATOKAN, 5)];
export const weton = (y, m, d) => { const o = ordinalOf(y, m, d); return `${hariDari(o)} ${pasaranDari(o)}`; };
export const sah = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= panjangBulan(y, m) && y >= 1 && y <= 9999;
// Rudi's day number: every fourth year is a leap year, no century rule.
export function hariKeRudi(t, b, h) { const k = (x) => x % 4 === 0; let n = (t - 1) * 365 + Math.floor((t - 1) / 4); const p = [31, k(t) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; for (let i = 0; i < b - 1; i++) n += p[i]; return n + h; }
export const pasaranRudi = (y, m, d) => PASARAN[mod(hariKeRudi(y, m, d) - hariKeRudi(1945, 8, 17), 5)];
const tgl = (y, m, d) => `${d} ${BULAN[m - 1]} ${y}`;
const tglO = (o) => tgl(...fromOrdinal(o));
// Ranges of dates (from..to ordinals) where Rudi's pasaran differs, between two years.
export function bedaRudi(y0, y1) {
  const out = []; let cur = null;
  for (let o = ordinalOf(y0, 1, 1); o <= ordinalOf(y1, 12, 31); o++) {
    const [y, m, d] = fromOrdinal(o); const beda = pasaranRudi(y, m, d) !== pasaranDari(o);
    if (beda && !cur) cur = [o, o]; else if (beda) cur[1] = o; else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
// Python runs: the worksheet program on any date, and Rudi's function.
export function pyWeton(y, m, d) { const R = runPy([...PROGRAM.slice(0, 9), `print(weton(date(${y}, ${m}, ${d})))`], { limit: 5000 }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out[0]; }
export function pyRudi(y, m, d) { const R = runPy([PROGRAM[1], ...RUDI, `print(pasaran_rudi(${y}, ${m}, ${d}))`], { limit: 200000 }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out[0]; }
export function pyEval(lines, limit = 5000) { const R = runPy(['from datetime import date, timedelta', 'import math', ...lines], { limit }); return R.error ? `${R.error.type}: ${R.error.message}` : R.out.join('\n'); }
// A random 2026 date for the guessing game (same seed, same date).
export function tanggal2026(rand) { const n = Math.floor(rand.next() * 365); const [y, m, d] = fromOrdinal(AWAL26 + n); return { y, m, d, n, hari: hariDari(AWAL26 + n), pasaran: pasaranDari(AWAL26 + n) }; }

const uniq = (xs) => [...new Set(xs)];

// ---- Permainan: Roda Weton ----
// The team keeps the Desa Wanasari calendar with a two-ring weton wheel (7 days
// outside, 5 pasaran inside), library cards, the weton machine, and a hunt for
// Si Kabisat Palsu: the fake 29 February 1900 and 2100 in Rudi's code.
const HEAD52 = {
  putar: ['Putar Roda Weton', 'Dari Jumat Legi, putar roda satu hari demi satu hari.', 'Roda pasaran? Biar kuacak!'],
  siklus: ['Siklus 35 Hari', 'Temukan kapan pasaran, hari, dan weton terulang, lalu lompat 100 hari.', '100 hari terlalu jauh untuk diputar!'],
  kartu: ['Kartu Pustaka yang Tepat', 'Seret kartu fungsi ke setiap kebutuhan.', 'Kartu palsuku mirip sekali!'],
  teliti: ['Baca Dokumentasi Teliti', 'Uji isoweekday di kalender, lalu tentukan batas randint.', 'Senin jadi Selasa, hehe.'],
  mesin: ['Mesin Weton', 'Ketuk tanggal, hitung sisa bagi, lalu baca wetonnya.', 'Tanggal sebelum patokan pasti rusak!'],
  buru: ['Buru Si Kabisat Palsu', 'Ramalkan tanggal mana yang dihitung benar oleh kode Rudi.', 'Aku 29 Februari 1900!'],
  perbaiki: ['Usir Si Kabisat Palsu', 'Perbaiki aturan kabisat Rudi.', 'Tahun abad selalu kabisat, kan?'],
  pustaka: ['Pustaka Mana yang Dipercaya?', 'Tempelkan setiap risiko pada baris Pustaka A yang menimbulkannya.', 'Pustaka gratis, ambil saja!'],
  adu: ['Adu Tebak Weton', 'Dari Kamis Pon, 1 Januari 2026, tebak weton tanggal ini.', 'Tanggalnya kuambil acak!'],
  bos: ['Pasar Pon Berikutnya', 'Susun pencari pasar, lalu jalankan dengan roda.', 'Pasar hewan tutup hari ini!'],
};
const msg52 = (t) => el('p', { class: 'reveal info' }, t);
const dua52 = (...k) => el('div', { class: 'rw52-dua' }, ...k);
const kol52 = (...k) => el('div', { class: 'rw52-kolom' }, ...k);
const iHari = (o) => (o + 6) % 7; const iPas = (o) => mod(o - PATOKAN, 5);

// The weton wheel: days on the outer ring, pasaran on the inner ring; hidden rings show '?' and can be tapped.
function rodaWeton(o, { hari = true, pasaran = true, onHari = null, onPasaran = null, label = null } = {}) {
  const ring = (nama, list, on, show, tap, r) => list.map((t, i) => {
    const a = (360 / list.length) * i; const cls = `rw52-takik ${nama} ${show && i === on ? 'on' : ''} ${tap ? 'ketuk' : ''}`;
    const st = { transform: `translate(-50%, -50%) rotate(${a}deg) translateY(-${r}em) rotate(${-a}deg)` };
    return tap ? onTap(el('button', { type: 'button', class: cls, 'data-ring': nama, 'data-v': t, style: st }, t.slice(0, 3)), () => tap(t)) : el('span', { class: cls, style: st }, t.slice(0, 3));
  });
  return el('div', { class: 'rw52-roda', 'data-o': String(o) }, el('div', { class: 'rw52-cincin luar' }), el('div', { class: 'rw52-cincin dalam' }),
    ...ring('hari', HARI, iHari(o), hari, onHari, 5.75), ...ring('pasaran', PASARAN, iPas(o), pasaran, onPasaran, 3.2),
    el('div', { class: 'rw52-pusat' }, el('small', null, label ?? tglO(o)), el('b', null, `${hari ? hariDari(o) : '?'} ${pasaran ? pasaranDari(o) : '?'}`)));
}
// A month calendar without pasaran (the machine computes them).
function kal52(y, m, onPilih) {
  const n = panjangBulan(y, m); const o1 = ordinalOf(y, m, 1);
  return el('div', { class: 'rw52-kal' }, el('b', { class: 'rw52-bulan' }, `${BULAN[m - 1]} ${y}`), el('div', { class: 'rw52-grid' }, HARI.map((h) => el('small', null, h.slice(0, 3))), Array.from({ length: iHari(o1) }, () => el('span')),
    Array.from({ length: n }, (_, i) => onTap(el('button', { type: 'button', class: 'rw52-sel', 'data-d': String(i + 1) }, String(i + 1)), () => onPilih(i + 1)))));
}
// Cards dropped into named boxes; cards are [text, boxId or null, hintIfWrong, okMsg].
function sortBoard52(ctx, { oops, msg, bins, cards, done, onPlace = null }) {
  let left = cards.filter((c) => c[1]).length;
  const binEls = bins.map(([id, lab]) => el('div', { class: `rw52-kotak ${id}`, 'data-drop': id }, el('b', null, lab), el('div', { class: 'rw52-isi' })));
  const tray = el('div', { class: 'rw52-baki' }, cards.map((c, i) => el('div', { class: 'rw52-kartu', 'data-drag': String(i) }, c[0])));
  const host = el('div', { class: 'rw52-kolom' }, tray, el('div', { class: 'rw52-kotak-kotak' }, binEls));
  dnd(host, (chip, bin) => {
    if (!bin.classList.contains('rw52-kotak') || chip.classList.contains('locked')) return; const c = cards[+chip.dataset.drag];
    if (c[1] !== bin.dataset.drop) { oops(); shake(chip); say(msg, 'bad', c[2]); return; }
    chip.classList.add('locked'); bin.lastChild.append(onPlace ? onPlace(c, chip) : chip); ctx.sound.tap(); left--;
    if (left) { say(msg, 'info', c[3] || 'Tepat.'); return; }
    tray.remove(); done();
  });
  return host;
}

// Misi 1: step the wheel from Jumat Legi.
function putarRound(area, ctx, { oops, done }) {
  const msg = msg52('17 Agustus 1945 jatuh pada Jumat Legi. Tekan +1 hari.'); let o = PATOKAN; let tahu = true; const catat = [];
  const kiri = kol52(); const kanan = kol52();
  const draw = () => { fill(kiri, rodaWeton(o, { pasaran: tahu, onPasaran: tahu ? null : tap }));
    fill(kanan, el('div', { class: 'rw52-catat' }, catat.map((t) => el('code', null, t))), tahu && o < PATOKAN + 5 ? button('+1 hari', maju, 'rw52-maju') : null); };
  function maju() { if (!tahu) return; o++; tahu = false; ctx.sound.tap(); draw(); say(msg, 'info', `${tglO(o)}: roda hari berputar ke ${hariDari(o)}. Ketuk pasarannya di roda dalam.`); }
  function tap(p) {
    if (tahu) return; if (p !== pasaranDari(o)) { oops(); say(msg, 'bad', 'Roda pasaran juga maju tepat satu takik setiap hari.'); return; }
    tahu = true; catat.push(`${tglO(o)} · ${hariDari(o)} ${p}`); ctx.sound.tap(); draw();
    if (o < PATOKAN + 5) { say(msg, 'info', 'Tepat. Tekan +1 hari lagi.'); return; }
    say(msg, '', 'Lima hari kemudian pasaran kembali ke Legi, tetapi harinya Rabu. Dua roda berputar dengan siklus berbeda.'); done();
  }
  draw();
  area.append(dua52(kiri, kanan), msg);
}

// Misi 1b: cycles of 5, 7 and 35, then jump 100 days.
function siklusRound(area, ctx, { oops, done }) {
  const msg = msg52('Kapan pasaran, hari, dan weton terulang?'); const box = kol52(); const o = PATOKAN + 100; let gotH = false; let gotP = false;
  const roda = () => rodaWeton(o, { hari: gotH, pasaran: gotP, onHari: gotH ? null : tapH, onPasaran: gotP ? null : tapP, label: `${tglO(PATOKAN)} + 100 hari` });
  const lompat = () => { say(msg, 'info', 'Lompat 100 hari! Ketuk hari di roda luar dan pasaran di roda dalam.'); ctx.sound.tap(); fill(box, dua52(roda(), kol52(el('code', null, '100 % 7 = ?'), el('code', null, '100 % 5 = ?')))); };
  function cek() { fill(box.querySelector('.rw52-dua'), roda(), kol52(el('code', null, `100 % 7 = ${100 % 7}`), el('code', null, `100 % 5 = ${100 % 5}`)));
    if (gotH && gotP) { say(msg, '', `${tglO(o)}: ${hariDari(o)} ${pasaranDari(o)}. Sisa bagi menggantikan 100 kali memutar roda.`); done(); } }
  function tapH(h) { if (gotH) return; if (h !== hariDari(o)) { oops(); say(msg, 'bad', '100 % 7 = 2: roda hari maju dua takik dari Jumat.'); return; } gotH = true; ctx.sound.tap(); say(msg, 'info', `${h}. Sekarang pasarannya.`); cek(); }
  function tapP(p) { if (gotP) return; if (p !== pasaranDari(o)) { oops(); say(msg, 'bad', '100 % 5 = 0: roda pasaran kembali ke tempat semula.'); return; } gotP = true; ctx.sound.tap(); say(msg, 'info', `${p}.`); cek(); }
  fill(box, dua52(rodaWeton(PATOKAN), fillBoard(ctx, { oops, msg, view: rowsView([['pasaran sama setiap ', '_', ' hari'], ['hari sama setiap ', '_', ' hari'], ['weton sama setiap math.lcm(5, 7) = ', '_']]), chips: ['5', '7', pyEval(['print(math.lcm(5, 7))']), '12'], want: ['5', '7', pyEval(['print(math.lcm(5, 7))'])],
    hints: ['Roda dalam punya 5 takik.', 'Roda luar punya 7 takik.', 'KPK 5 dan 7: kedua roda kembali bersamaan.'], done: () => { fill(box, dua52(rodaWeton(PATOKAN), button('⏩ +100 hari', lompat, 'rw52-maju'))); say(msg, 'info', 'Tekan +100 hari.'); } })));
  area.append(box, msg);
}

// Misi 2: library cards for six needs.
function kartuRound(area, ctx, { oops, done }) {
  const msg = msg52('Ambil kartu dokumentasi yang tepat untuk setiap kebutuhan.'); const box = kol52();
  fill(box, fillBoard(ctx, { oops, msg, view: rowsView([['tanggal 21 Oktober 2026: ', '_'], ['banyak hari antara d1 dan d2: ', '_'], ['35 hari setelah d: ', '_'], ['tanggal hari ini: ', '_'], ['weton terulang setiap: ', '_'], ['satu pasaran acak: ', '_']]),
    chips: ['date(2026, 10, 21)', '(d2 - d1).days', 'd + timedelta(days=35)', 'date.today()', 'math.lcm(5, 7)', 'random.choice(PASARAN)', 'date(21, 10, 2026)', 'd + 35', 'math.gcd(5, 7)', 'random.randint(PASARAN)'],
    want: ['date(2026, 10, 21)', '(d2 - d1).days', 'd + timedelta(days=35)', 'date.today()', 'math.lcm(5, 7)', 'random.choice(PASARAN)'],
    hints: ['Urutannya tahun, bulan, hari.', 'd2 - d1 memberi timedelta; banyak harinya dibaca dengan .days.', 'Tanggal tidak bisa ditambah bilangan biasa: pakai timedelta.', 'Menurut jam komputer.', 'KPK, bukan FPB.', 'randint untuk bilangan; choice untuk anggota daftar.'],
    done: () => { say(msg, '', 'Enam kebutuhan, enam kartu dari pustaka. Tidak perlu menulis kalender sendiri.'); done(); } }));
  area.append(box, msg);
}

// Misi 2b: isoweekday on the calendar, then the randint bound.
function telitiRound(area, ctx, { oops, done }) {
  const msg = msg52('Coba HARI[d.isoweekday()]: ketuk satu hari Senin dan satu hari Minggu di kalender.'); const out = layar(); const kanan = kol52(); const got = new Set(); const lines = [];
  const kiri = kol52(kal52(2026, 10, pilih));
  function pilih(d) {
    if (got.size >= 2) return; const o = ordinalOf(2026, 10, d); const h = hariDari(o); const iso = iHari(o) + 1;
    lines.push(`${d} Okt (${h}) → HARI[${iso}] → ${iso < 7 ? HARI[iso] : 'IndexError'}`); fill(out, lines.slice(-3).join('\n')); ctx.sound.tap();
    if (h === 'Senin' || h === 'Minggu') got.add(h);
    if (got.size < 2) { say(msg, 'info', got.size ? `Tercatat ${[...got][0]}. Cari yang satu lagi.` : `${h} terbaca ${iso < 7 ? HARI[iso] : 'galat'}. Coba Senin dan Minggu.`); return; }
    say(msg, 'info', 'Senin terbaca Selasa, dan Minggu meledak. Pilih fungsi yang benar.');
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['agar Senin → HARI[0]: ', '_'], ['tanggal acak 2026 = 1 Januari + randint(0, ', '_', ') hari']]), chips: ['d.weekday()', 'd.isoweekday()', '364', '365'], want: ['d.weekday()', '364'],
      hints: ['weekday(): Senin 0 … Minggu 6, cocok dengan urutan HARI.', `+365 hari sudah ${pyEval(['print(date(2026, 1, 1) + timedelta(days=365))'])}.`], done: () => { say(msg, '', 'Satu baris dokumentasi menentukan benar atau salahnya program.'); done(); } }));
  }
  fill(kanan, codeView(['def hari_iso(d):', '  return HARI[d.isoweekday()]']), out);
  area.append(dua52(kiri, kanan), msg);
}

// Misi 3: the weton machine for three dates and an impossible one.
const MESIN52 = [[2026, 10, 21], [1945, 8, 22], [1945, 8, 16]];
function mesinRound(area, ctx, { oops, done }) {
  const msg = msg52(''); let k = 0; const kiri = kol52(); const kanan = kol52(); const out = layar();
  const kode = codeView(['def pasaran(tanggal):', '  selisih = (tanggal - PATOKAN).days', '  return PASARAN[selisih % 5]', 'def weton(tanggal):', '  return (HARI[tanggal.weekday()]', '          + " " + pasaran(tanggal))'], { labels: ['5', '6', '7', '8', '9', ''] });
  const mulai = () => { const [y, m, d] = MESIN52[k]; say(msg, 'info', `Ketuk ${tgl(y, m, d)} di kalender.`); fill(kiri, kal52(y, m, pilih)); fill(kanan, kode, out); };
  function pilih(d) {
    const [y, m, dd] = MESIN52[k]; if (kanan.querySelector('.mk-papan')) return;
    if (d !== dd) { say(msg, 'info', `Itu ${d} ${BULAN[m - 1]}. Cari tanggal ${dd}.`); return; }
    const o = ordinalOf(y, m, d); const s = o - PATOKAN; ctx.sound.tap(); fill(out, `selisih = ${s}`);
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([[`${s} % 5 = `, '_']]), chips: uniq([String(mod(s, 5)), '0', '1', '4', '-1']), want: [String(mod(s, 5))],
      hints: [s < 0 ? 'Di Python, % dengan pembagi positif selalu memberi 0 sampai 4: -1 % 5 = 4.' : `${s} = 5 × ${Math.floor(s / 5)} + ${mod(s, 5)}.`],
      done: () => { fill(out, `selisih = ${s}\nselisih % 5 = ${mod(s, 5)} → ${pasaranDari(o)}\nweton → ${pyWeton(y, m, d)}`); kanan.querySelector('.mk-papan')?.remove(); k++;
        if (k < MESIN52.length) { say(msg, 'info', `${pyWeton(y, m, d)}.`); setTimeout(mulai, 1300); return; }
        say(msg, 'info', 'Satu lagi: tanggal yang tidak ada di kalender.');
        setTimeout(() => { fill(kiri, kal52(2026, 2, () => say(msg, 'info', 'Februari 2026 hanya 28 hari. Jawab di kanan.'))); fill(kanan, kode, fillBoard(ctx, { oops, msg, view: rowsView([['weton(date(2026, 2, 29)) → ', '_']]), chips: [pyEval(['print(date(2026, 2, 29))']), 'Minggu Wage', 'weton 1 Maret 2026'], want: [pyEval(['print(date(2026, 2, 29))'])],
          hints: ['2026 bukan tahun kabisat. date menolak tanggal yang tidak ada.'], done: () => { say(msg, '', 'Tanggal mustahil ditolak sejak awal, sebelum sempat menghasilkan weton palsu.'); done(); } })); }, 1300); } }));
  }
  mulai();
  area.append(dua52(kiri, kanan), msg);
}

// Misi 4: which dates does Rudi get right?
const UJI52 = [[1850, 1, 1], [1900, 1, 1], [1900, 3, 1], [1945, 8, 17], [2000, 2, 29], [2100, 2, 28], [2100, 3, 1]];
function buruRound(area, ctx, { oops, done }) {
  const msg = msg52('Rudi menghitung hari sendiri dengan kabisat = t % 4 == 0. Ramalkan: benar atau salah?'); const box = kol52();
  const R = bedaRudi(1890, 2110); const dari = tglO(R[0][1] + 1); const sampai = tglO(R[1][0] - 1);
  const cards = UJI52.map(([y, m, d]) => { const ok = pasaranRudi(y, m, d) === pasaranDari(ordinalOf(y, m, d)); return [tgl(y, m, d), ok ? 'benar' : 'salah', ok ? 'Tidak ada 29 Februari palsu (1900 atau 2100) di antara tanggal ini dan 17 Agustus 1945.' : `Di antara tanggal ini dan patokan ada 29 Februari palsu, jadi hitungan Rudi bergeser satu hari.`, `Rudi ${pasaranRudi(y, m, d)} · datetime ${pasaranDari(ordinalOf(y, m, d))}`]; });
  fill(box, dua52(codeView(['def kabisat(t):', '  return t % 4 == 0', '# 1900 dan 2100: habis dibagi 4,', '# tetapi bukan kabisat!']), sortBoard52(ctx, { oops, msg, bins: [['benar', '✅ Rudi benar'], ['salah', '👻 Rudi salah']], cards,
    onPlace: (c, chip) => { chip.append(el('small', null, ` ${c[3]}`)); return chip; },
    done: () => { say(msg, 'info', 'Si Kabisat Palsu tertangkap di kedua ujung. Di mana batasnya?');
      fill(box, dua52(box.firstChild.lastChild, fillBoard(ctx, { oops, msg, view: rowsView([['Rudi selalu benar dari ', '_'], ['sampai ', '_']]), chips: [dari, sampai, '1 Januari 1900', '31 Desember 2099'], want: [dari, sampai],
        hints: ['Sehari sesudah 29 Februari 1900 yang palsu.', 'Sehari sebelum 29 Februari 2100 yang palsu.'], done: () => { say(msg, '', 'Uji Rudi lolos karena tanggal ujinya semua di rentang aman. Uji juga tanggal di sekitar batas!'); done(); } }))); } })));
  area.append(box, msg);
}

// Misi 4b: fix the leap rule and compare with date's ValueError.
function perbaikiRound(area, ctx, { oops, done }) {
  const msg = msg52('Ketuk baris Rudi yang memanggil Si Kabisat Palsu.'); const box = kol52(); const out = layar(); let ketemu = false;
  const sama = pyEval([...RUDI.slice(0, 15), 'print(hari_ke(2026, 2, 30) == hari_ke(2026, 3, 2))'], 200000);
  const pita = () => codeView(RUDI.slice(0, 8).map((x) => x.replace(/ {4}/g, '  ')), { labels: RUDI_LABEL.slice(0, 8), cls: ketemu ? '' : 'ketuk', warn: ketemu ? [1] : [], onLine: ketemu ? null : tunjuk });
  function tunjuk(i) {
    if (ketemu) return; if (i !== 1) { oops(); say(msg, 'bad', 'Baris ini hanya menjumlah. Siapa yang memutuskan tahun kabisat?'); return; }
    ketemu = true; ctx.sound.tap(); say(msg, 'info', 'R2 menganggap 1900 dan 2100 kabisat. Perbaiki.');
    fill(box, dua52(pita(), fillBoard(ctx, { oops, msg, view: codeFill(['def kabisat(t):', ['  return ', '_']], { labels: ['R1', 'R2'] }), chips: ['(t % 4 == 0 and t % 100 != 0) or t % 400 == 0', 't % 4 == 0 and t % 400 == 0', 't % 4 == 0 or t % 100 == 0'], want: ['(t % 4 == 0 and t % 100 != 0) or t % 400 == 0'],
      hints: ['Tahun abad bukan kabisat, kecuali habis dibagi 400.'], done: uji })));
  }
  function uji() {
    const K = (t) => (t % 4 === 0 && t % 100 !== 0) || t % 400 === 0; say(msg, 'info', 'Uji aturan baru…'); const kn = kol52(out); fill(box, dua52(pita(), kn));
    play(out, [1900, 2000, 2024, 2100].map((t) => `kabisat(${t}) → ${K(t) ? 'True' : 'False'}`), { gap: 350, end: () => {
      say(msg, 'info', 'Si Kabisat Palsu pergi. Satu ujian lagi: tanggal yang tidak ada.');
      kn.append(fillBoard(ctx, { oops, msg, view: rowsView([['hari_ke(2026, 2, 30) == hari_ke(2026, 3, 2) → ', '_'], ['date(2026, 2, 30) → ', '_']]), chips: ['True', 'False', 'ValueError'], want: [sama, 'ValueError'],
        hints: ['Rudi tidak memeriksa panjang bulan: 30 Februari dihitung sama dengan 2 Maret.', 'date menolak tanggal yang tidak ada.'], done: () => { say(msg, '', 'Kode Rudi diam-diam menerima 30 Februari; date langsung menolaknya. Pustaka yang teruji lebih aman.'); done(); } })); } });
  }
  fill(box, pita());
  area.append(box, msg);
}

// Misi 5: match risks to library A's rows, then choose.
function pustakaRound(area, ctx, { oops, done }) {
  const msg = msg52('Tempelkan setiap risiko pada baris Pustaka A yang menimbulkannya.'); const box = kol52();
  fill(box, sortBoard52(ctx, { oops, msg, bins: [['update', 'diperbarui terakhir 2016'], ['dok', 'dokumentasi tidak ada'], ['lis', 'lisensi tidak disebutkan'], ['lapor', '25 laporan masalah tidak dijawab']],
    cards: [['celah keamanan baru tidak ditambal', 'update', 'Siapa yang menambal celah bila pustakanya tidak pernah diperbarui?'], ['cara pakai harus ditebak', 'dok', 'Tanpa dokumentasi, fungsi dan argumennya harus ditebak.'], ['izin pakai dan jual tidak jelas', 'lis', 'Izin pakai diatur oleh lisensi.'], ['bug yang dilaporkan dibiarkan', 'lapor', 'Laporan yang tidak dijawab berarti bug tidak diperbaiki.'], ['terlalu banyak pengguna', null, 'Justru pengguna yang sedikit (40 proyek) menjadi tanda bahaya. Kartu ini bukan risiko.']],
    done: () => { say(msg, 'info', 'Empat risiko ketemu. Sekarang bandingkan dengan Pustaka B.');
      fill(box, dua52(tabelPustaka(), fillBoard(ctx, { oops, msg, view: rowsView([['antara A dan B: ', '_'], ['untuk kalender pasaran: ', '_']]), chips: ['Pustaka B', 'Pustaka A', 'datetime bawaan', 'tulis sendiri seperti Rudi'], want: ['Pustaka B', 'datetime bawaan'],
        hints: ['Dirawat, terdokumentasi, berlisensi jelas.', 'Pustaka bawaan Python sudah cukup: pasaran hanya perlu sisa bagi.'], done: () => { say(msg, '', 'Pakai pustaka yang dirawat dan jelas lisensinya; bila bawaan sudah cukup, tidak perlu menambah pustaka.'); done(); } }))); } }));
  area.append(box, msg);
}

// Misi 6: guess the weton of a random 2026 date.
function aduRound(area, ctx, { oops, done }) {
  const T = tanggal2026(ctx.rand); const o = AWAL26 + T.n; const msg = msg52(`Berapa hari dari 1 Januari sampai ${tgl(T.y, T.m, T.d)}?`); const box = kol52(); let gotH = false; let gotP = false;
  const roda = () => rodaWeton(o, { hari: gotH, pasaran: gotP, onHari: gotH ? null : tapH, onPasaran: gotP ? null : tapP, label: tgl(T.y, T.m, T.d) });
  const sisa = () => kol52(el('code', null, `1 Jan 2026 = Kamis Pon`), el('code', null, `+${T.n} hari`), el('code', null, `${T.n} % 7 = ${T.n % 7}`), el('code', null, `${T.n} % 5 = ${T.n % 5}`));
  function cek() { fill(box, dua52(roda(), sisa())); if (gotH && gotP) { say(msg, '', `${tgl(T.y, T.m, T.d)}: ${T.hari} ${T.pasaran}.`); done(); } }
  function tapH(h) { if (gotH) return; if (h !== T.hari) { oops(); say(msg, 'bad', `${T.n} % 7 = ${T.n % 7}: maju ${T.n % 7} takik dari Kamis.`); return; } gotH = true; ctx.sound.tap(); say(msg, 'info', 'Hari tepat. Sekarang pasaran.'); cek(); }
  function tapP(p) { if (gotP) return; if (p !== T.pasaran) { oops(); say(msg, 'bad', `${T.n} % 5 = ${T.n % 5}: maju ${T.n % 5} takik dari Pon.`); return; } gotP = true; ctx.sound.tap(); say(msg, 'info', 'Pasaran tepat.'); cek(); }
  fill(box, dua52(tabelBulan(), fillBoard(ctx, { oops, msg, view: rowsView([['1 Januari → ', `${T.d} ${BULAN[T.m - 1]}`, ': ', '_', ' hari']]), chips: uniq([String(T.n), String(T.n + 1), String(T.n - 1)]), want: [String(T.n)],
    hints: ['Jumlahkan panjang bulan-bulan sebelumnya, lalu tambah tanggalnya dikurangi 1.'], done: () => { say(msg, 'info', 'Ketuk hari di roda luar dan pasaran di roda dalam.'); cek(); } })));
  area.append(box, msg);
}

// Misi Bos: the next market day.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg52('Pasar hewan buka setiap Pon. Susun pencarinya.'); const box = kol52(); const o0 = ordinalOf(2026, 10, 21);
  const cari = (judul, cocok, after) => { let o = o0; let n = 0;
    const draw = () => fill(box, dua52(rodaWeton(o), kol52(el('code', { class: 'rw52-soal' }, judul), el('code', null, `langkah: ${n}`), el('div', { class: 'rw52-tombol' }, button('+1 hari', maju, 'rw52-maju'), button('✋ return tanggal', balik, 'rw52-balik')))));
    function maju() { if (cocok(o)) { oops(); say(msg, 'bad', 'Sudah cocok: syarat while bernilai False, perulangan berhenti.'); return; } o++; n++; ctx.sound.tap(); draw(); }
    function balik() { if (!cocok(o)) { oops(); say(msg, 'bad', 'Belum cocok: while masih berjalan.'); return; } ctx.sound.tap(); after(o, n); }
    draw(); };
  fill(box, tileSlots(ctx, { oops, msg, build: ['def pasar_berikutnya(tanggal, cari):', ['w', 1], ['t', 2], ['r', 1]],
    tiles: [['w', 'while pasaran(tanggal) != cari:'], ['t', 'tanggal = tanggal + timedelta(days=1)'], ['r', 'return tanggal'], ['x', 'if pasaran(tanggal) != cari:', 'if hanya memeriksa sekali; perlu mengulang sampai ketemu.']],
    order: 'Ulangi dulu, majukan satu hari di dalamnya, lalu kembalikan hasilnya.',
    onFull: () => { say(msg, 'info', 'Jadilah Python: dari Rabu Legi 21 Oktober 2026, cari Pon.');
      setTimeout(() => cari('pasar_berikutnya(…, "Pon")', (o) => pasaranDari(o) === 'Pon', (o1, n1) => { say(msg, 'info', `${tglO(o1)}, ${n1} langkah. Bu kepala desa minta Jumat Kliwon berikutnya.`);
        setTimeout(() => cari('weton(tanggal) != "Jumat Kliwon"', (o) => hariDari(o) === 'Jumat' && pasaranDari(o) === 'Kliwon', (o2, n2) => { say(msg, '', `Jumat Kliwon berikutnya ${tglO(o2)} (${n2} langkah). Pustaka mengurus tanggal, kodemu mengurus pasaran.`); done(); }), 900); }), 700); } }));
  area.append(box, msg);
}

export default {
  id: 'sma-52-pakai-library',
  title: 'Memakai Library: Kalender Pasaran',
  topic: 'Memakai pustaka Python dengan membaca dokumentasinya: datetime, math, dan random, siklus dengan sisa bagi, membandingkan pustaka dengan kode buatan sendiri, dan menilai pustaka pihak ketiga',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📅',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Hitung weton dengan siklus lima hari pasaran, baca dokumentasi datetime, telusuri programnya, temukan kesalahan kode buatan Rudi, lalu nilai kapan sebaiknya memakai pustaka.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Pasaran', desc: 'Pilih tanggal dan lihat weton beserta langkah hitungnya, lengkap dengan kalender satu bulan', create: createCalc },
    { id: 'telusur', icon: '🔎', label: 'Pustaka atau Rudi', desc: 'Jalankan program datetime dan program Rudi berdampingan, lalu cari tanggal yang hasilnya berbeda', create: createTrace },
    { id: 'giliran', icon: '🎲', label: 'Adu Tebak Weton', desc: 'Layar memilih tanggal acak di 2026, tim bergantian menebak hari dan pasarannya dari Kamis Pon, 1 Januari 2026', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pasaran rw52-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'rw52-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, ulah] = HEAD52[k]; foe = el('div', { class: 'rw52-musuh' }, el('b', null, '📅 Si Kabisat Palsu'), el('span', null, ulah)); wrap.append(el('div', { class: 'rw52-kepala' }, misiHead(no, judul, tujuan, '🎡'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Weton tepat ✓'; next(ms); } });
      if (r === 0) { go('putar', 1); putarRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('siklus', 1); siklusRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('kartu', 2); kartuRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('teliti', 2); telitiRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('mesin', 3); mesinRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('buru', 4); buruRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('perbaiki', 4); perbaikiRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('pustaka', 5); pustakaRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('adu', 6); aduRound(area, ctx, fin(5500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// ---- views ----
function tabelPustaka() {
  const R = [['Terakhir diperbarui', '2016', 'bulan lalu'], ['Dokumentasi', 'tidak ada', 'lengkap, dengan contoh'], ['Lisensi', 'tidak disebutkan', 'terbuka, menyebut sumber'], ['Pengguna', 'sekitar 40 proyek', 'ribuan proyek'], ['Laporan masalah', '25 tidak dijawab', 'dijawab dan diperbaiki']];
  return el('table', { class: 'ps-dok' }, el('tr', null, ['', 'Pustaka A', 'Pustaka B'].map((h) => el('th', null, h))), R.map((r) => el('tr', null, r.map((x) => el('td', null, x)))));
}
function tabelBulan() {
  return el('div', { class: 'ps-bulan' }, BULAN.map((b, i) => el('span', null, el('small', null, b.slice(0, 3)), el('b', null, String(panjangBulan(2026, i + 1))))));
}
function kalender(y, m, { pilih = null, onPilih = null } = {}) {
  const n = panjangBulan(y, m); const o1 = ordinalOf(y, m, 1); const geser = (o1 + 6) % 7;
  const sel = [...HARI.map((h) => el('div', { class: 'ps-kepala' }, h.slice(0, 3))), ...Array.from({ length: geser }, () => el('div', { class: 'ps-kosong' }))];
  for (let d = 1; d <= n; d++) { const o = o1 + d - 1; const p = pasaranDari(o); const c = el('div', { class: `ps-sel ${d === pilih ? 'pilih' : ''} ${p === 'Pon' || p === 'Kliwon' ? 'pasar' : ''}` }, el('b', null, String(d)), el('small', null, p)); sel.push(onPilih ? onTap(c, () => onPilih(d)) : c); }
  return el('div', { class: 'ps-kalender' }, sel);
}

// ---- Kalkulator Pasaran ----
function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  let y = 2026; let m = 10; let d = 21; let pat = 'proklamasi';
  const PAT = { proklamasi: { nama: '17 Agustus 1945 (Jumat Legi)', o: PATOKAN, h: 'Jumat', p: 'Legi' }, t2026: { nama: '1 Januari 2026 (Kamis Pon)', o: AWAL26, h: 'Kamis', p: 'Pon' } };
  const draw = () => {
    const ok = sah(y, m, d); const P = PAT[pat]; const o = ok ? ordinalOf(y, m, d) : null; const s = ok ? o - P.o : null;
    const langkah = ok ? [`selisih = ${fmtNum(s)} hari sejak ${P.nama}`, `selisih % 7 = ${mod(s, 7)} → ${mod(s, 7)} hari sesudah ${P.h} = ${hariDari(o)}`, `selisih % 5 = ${mod(s, 5)} → ${mod(s, 5)} pasaran sesudah ${P.p} = ${pasaranDari(o)}`] : [];
    const py = pyWeton(y, m, d);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Kalkulator hari pasaran'),
      el('div', { class: 'ps-kontrol' }, stepper(d, (v) => { d = v; draw(); }, { min: 1, max: 31, label: 'tanggal' }), stepper(m, (v) => { m = v; d = Math.min(d, 31); draw(); }, { min: 1, max: 12, label: 'bulan' }), stepper(y, (v) => { y = v; draw(); }, { min: 1, max: 9999, label: 'tahun' }),
        el('div', { class: 'seg' }, Object.entries(PAT).map(([k, x]) => onTap(el('button', { class: `seg-btn ${pat === k ? 'on' : ''}`, type: 'button' }, `patokan ${x.nama}`), () => { pat = k; draw(); })))),
      el('div', { class: 'ps-dua' }, el('div', { class: 'ps-hasil' }, el('p', { class: 'ps-tanggal' }, ok ? tgl(y, m, d) : `${d}/${m}/${y}`), ok ? el('p', { class: 'ps-weton' }, `${hariDari(o)} ${pasaranDari(o)}`) : el('p', { class: 'ps-galat' }, py),
        ...langkah.map((x) => el('p', { class: 'ps-langkah' }, x)), el('p', { class: 'ps-py' }, `Python: print(weton(date(${y}, ${m}, ${d}))) → ${py}`)),
        el('div', null, el('p', { class: 'ps-ket' }, `${BULAN[m - 1]} ${y} · Pon dan Kliwon disorot (hari pasar hewan)`), kalender(y, m, { pilih: ok ? d : null, onPilih: (v) => { d = v; draw(); } }))));
  };
  draw();
}

// ---- Pustaka atau Rudi: two programs side by side, and where they differ ----
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  let y = 1900; let m = 1; let d = 1; let a = null; let b = null;
  const beda = bedaRudi(1700, 2300);
  const draw = () => {
    a?.stop?.(); b?.stop?.();
    const ok = sah(y, m, d);
    a = pyTracer([...PROGRAM.slice(0, 9), `print(weton(date(${y}, ${m}, ${d})))`], { labels: lab(1, 10), cls: 'ps-kecil', hideVars: ['PASARAN', 'HARI', 'date', 'timedelta', 'pasaran', 'weton'], opts: { limit: 5000 } });
    b = pyTracer([PROGRAM[1], ...RUDI, `print(pasaran_rudi(${y}, ${m}, ${d}))`], { labels: ['2', ...RUDI_LABEL, 'R18'], cls: 'ps-kecil', hideVars: ['PASARAN', 'kabisat', 'hari_ke', 'pasaran_rudi', 'panjang'], opts: { limit: 200000 } });
    const pw = pyWeton(y, m, d); const pr = ok ? pyRudi(y, m, d) : '—'; const sama = ok && pw.split(' ')[1] === pr;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pustaka datetime atau kode Rudi?'),
      el('div', { class: 'ps-kontrol' }, stepper(d, (v) => { d = v; draw(); }, { min: 1, max: 31, label: 'tanggal' }), stepper(m, (v) => { m = v; draw(); }, { min: 1, max: 12, label: 'bulan' }), stepper(y, (v) => { y = v; draw(); }, { min: 1600, max: 2400, label: 'tahun' }),
        ...[[1900, 2, 28], [1900, 3, 1], [2100, 2, 28], [2100, 3, 1], [2026, 10, 21]].map(([yy, mm, dd]) => button(`${dd}/${mm}/${yy}`, () => { y = yy; m = mm; d = dd; draw(); }))),
      el('p', { class: `ps-banding ${ok ? (sama ? 'sama' : 'beda') : 'beda'}` }, ok ? `datetime: ${pw} · Rudi: ${pr} → ${sama ? 'sama' : 'BERBEDA'}` : `datetime menolak: ${pw}; kode Rudi tetap menghitung hari_ke = ${fmtNum(hariKeRudi(y, m, d))}`),
      el('div', { class: 'ps-dua' }, a, b),
      el('div', { class: 'ps-pita' }, el('b', null, 'Tanggal yang pasarannya berbeda (1700–2300):'), beda.map(([o0, o1]) => el('span', null, `${tglO(o0)} – ${tglO(o1)}`))));
  };
  draw();
  return () => { a?.stop?.(); b?.stop?.(); };
}

// ---- Adu Tebak Weton ----
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pasaran' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Adu Tebak Weton selesai', pts, again: () => pickTeams(wrap, 'Adu Tebak Weton', start) }); return; }
      const who = t % nT; const T = tanggal2026(ctx.rand); let h = null; let p = null; let fin = false;
      const msg = el('p', { class: 'reveal info' }, 'Pilih hari dan pasaran, lalu Periksa.');
      const draw = () => {
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: weton ${tgl(T.y, T.m, T.d)}?`), el('p', { class: 'ps-ket' }, 'Patokan: 1 Januari 2026 = Kamis Pon. Hitung hari sejak 1 Januari, lalu sisa bagi 7 dan 5.'), tabelBulan(),
          el('div', { class: 'seg ps-pilih' }, HARI.map((x) => onTap(el('button', { class: `seg-btn ${h === x ? 'on' : ''}`, type: 'button' }, x), () => { if (!fin) { h = x; draw(); } }))),
          el('div', { class: 'seg ps-pilih' }, PASARAN.map((x) => onTap(el('button', { class: `seg-btn ${p === x ? 'on' : ''}`, type: 'button' }, x), () => { if (!fin) { p = x; draw(); } }))),
          msg, fin ? button('Lanjut ➜', () => { t++; step(); }, 'primary') : button('Periksa', () => {
            if (!h || !p) return; fin = true; const skor = (h === T.hari) + (p === T.pasaran); pts[who] += skor; skor ? ctx.sound.tap() : ctx.mistake();
            say(msg, skor === 2 ? 'good' : skor ? '' : 'bad', `${T.n} hari sejak 1 Januari; ${T.n} % 7 = ${T.n % 7} → ${T.hari}; ${T.n} % 5 = ${T.n % 5} → ${T.pasaran}. +${skor} poin.`); draw();
          }, 'primary'));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Adu Tebak Weton', start);
}
