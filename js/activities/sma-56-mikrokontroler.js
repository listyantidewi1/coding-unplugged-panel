// Kode untuk Mikrokontroler — SMA/SMK (16–18 tahun), coding. A grain dryer
// board: setup() once and loop() forever, a humidity sensor read as 0–1023
// with int division that truncates (multiply first), a fan with two
// thresholds (on above 70, off below 60), and an emergency button. Version 1
// waits with delay (one loop = 1000 ms, button read only at loop start);
// versions 2 and 3 check millis() instead (one loop = 1 ms), Dodi detects the
// LOW→HIGH edge, version 3 debounces (> 50 ms), Rina's 500 ms never accepts
// the bouncing press, and Rudi's debounce accepts the release bounce. The
// simulator below runs every version millisecond by millisecond on virtual
// time; the worksheet's times and bounce pattern are data, never measured.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, codeView, stepper } from './smp-kit.js';

// ---- programs ----
export const KODE_V1 = ['const int KIPAS = 8;      // kipas pembuang udara lembap', 'const int LAMPU = 13;     // lampu indikator', 'const int TOMBOL = 2;     // tombol darurat', 'const int SENSOR = A0;    // sensor kelembapan udara', 'bool kipasNyala = false;', 'bool darurat = false;', '', 'void setup() {', '  pinMode(KIPAS, OUTPUT);', '  pinMode(LAMPU, OUTPUT);', '  pinMode(TOMBOL, INPUT);', '}', '', 'void loop() {', '  if (digitalRead(TOMBOL) == HIGH) {', '    darurat = !darurat;', '  }', '  int bacaan = analogRead(SENSOR);', '  int lembap = bacaan * 100 / 1023;', '  if (lembap > 70) kipasNyala = true;', '  if (lembap < 60) kipasNyala = false;', '  digitalWrite(KIPAS, kipasNyala && !darurat);', '  digitalWrite(LAMPU, HIGH);', '  delay(500);', '  digitalWrite(LAMPU, LOW);', '  delay(500);', '}'];
const TOMBOL_V2 = ['  if (digitalRead(TOMBOL) == HIGH) {', '    darurat = !darurat;', '  }'];
const TOMBOL_DODI = ['  int b = digitalRead(TOMBOL);', '  if (b == HIGH && bacaanTerakhir == LOW) {', '    darurat = !darurat;', '  }', '  bacaanTerakhir = b;'];
const tombolV3 = (batas) => ['  int b = digitalRead(TOMBOL);', '  if (b != bacaanTerakhir) {', '    waktuBerubah = sekarang;', '  }', `  if (sekarang - waktuBerubah > ${batas} && b != tombolStabil) {`, '    tombolStabil = b;', '    if (tombolStabil == HIGH) {', '      darurat = !darurat;', '    }', '  }', '  bacaanTerakhir = b;'];
const TOMBOL_RUDI = ['  int b = digitalRead(TOMBOL);', '  if (b == HIGH && bacaanTerakhir == LOW && sekarang - waktuDiterima > 50) {', '    darurat = !darurat;', '    waktuDiterima = sekarang;', '  }', '  bacaanTerakhir = b;'];
const loopTanpaTunggu = (kepala, tombol) => [...kepala, 'void loop() {', '  unsigned long sekarang = millis();', ...tombol, '  int bacaan = analogRead(SENSOR);', '  int lembap = bacaan * 100 / 1023;', '  if (lembap > 70) kipasNyala = true;', '  if (lembap < 60) kipasNyala = false;', '  digitalWrite(KIPAS, kipasNyala && !darurat);', '  if (sekarang - waktuKedip >= 500) {', '    waktuKedip = sekarang;', '    lampuNyala = !lampuNyala;', '    digitalWrite(LAMPU, lampuNyala);', '  }', '}'];
const KEPALA = ['unsigned long waktuKedip = 0;    // tambahan di atas setup()', 'bool lampuNyala = false;         // tambahan di atas setup()'];
const KEPALA_V3 = [...KEPALA, 'int tombolStabil = LOW;', 'int bacaanTerakhir = LOW;', 'unsigned long waktuBerubah = 0;'];
export const VERSI = {
  v1: { nama: 'Versi 1 (delay)', kode: KODE_V1 },
  v2: { nama: 'Versi 2 (millis)', kode: loopTanpaTunggu(KEPALA, TOMBOL_V2) },
  dodi: { nama: 'Usulan Dodi', kode: loopTanpaTunggu([...KEPALA, 'int bacaanTerakhir = LOW;'], TOMBOL_DODI) },
  v3: { nama: 'Versi 3 (debounce 50)', kode: loopTanpaTunggu(KEPALA_V3, tombolV3(50)) },
  rina: { nama: 'Usulan Rina (500)', kode: loopTanpaTunggu(KEPALA_V3, tombolV3(500)) },
  rudi: { nama: 'Cara Rudi', kode: loopTanpaTunggu([...KEPALA, 'int bacaanTerakhir = LOW;', 'unsigned long waktuDiterima = 0;'], TOMBOL_RUDI) },
};
const HL_BALIK = (v) => VERSI[v].kode.findIndex((x) => x.includes('darurat = !darurat'));

// ---- the board, one millisecond at a time ----
export const lembapDari = (b) => Math.trunc((b * 100) / 1023);
// Button presses: [a, b) HIGH when pressed cleanly; a bouncing press follows the worksheet table
// (HIGH a..a+1, LOW a+2, HIGH a+3..a+4, LOW a+5, HIGH a+6..b-1, LOW b, HIGH b+1, LOW after).
export function tombolPada(sk, t) {
  for (const p of sk.tombol || []) {
    const d = t - p.a;
    if (d < 0) continue;
    if (!p.pantul) { if (t < p.b) return true; continue; }
    if (t < p.b) { if (d <= 1 || d === 3 || d === 4 || d >= 6) return true; continue; }
    if (t - p.b === 1) return true;
  }
  return false;
}
export function sensorPada(sk, t) { let v = sk.sensor?.[0]?.[1] ?? 0; for (const [a, x] of sk.sensor || []) if (t >= a) v = x; return v; }
export const papan = (versi) => ({ versi, kipasNyala: false, darurat: false, lampu: false, kipas: false, waktuKedip: 0, last: false, stabil: false, waktuBerubah: 0, waktuDiterima: 0, lembap: 0, baris: -1 });
export function langkah(P, t, tombol, bacaan) {
  const ev = { baca: false, balik: false };
  const balik = () => { P.darurat = !P.darurat; ev.balik = true; };
  const sensor = () => { const l = lembapDari(bacaan); P.lembap = l; if (l > 70) P.kipasNyala = true; if (l < 60) P.kipasNyala = false; P.kipas = P.kipasNyala && !P.darurat; };
  if (P.versi === 'v1') {
    if (t % 1000 === 0) { ev.baca = true; if (tombol) balik(); sensor(); P.lampu = true; }
    else if (t % 1000 === 500) P.lampu = false;
    P.baris = t % 1000 < 500 ? 24 : 26;
    return ev;
  }
  ev.baca = true; const b = tombol; const v = P.versi;
  if (v === 'v2') { if (b) balik(); }
  else if (v === 'dodi') { if (b && !P.last) balik(); P.last = b; }
  else if (v === 'rudi') { if (b && !P.last && t - P.waktuDiterima > 50) { balik(); P.waktuDiterima = t; } P.last = b; }
  else { const batas = v === 'rina' ? 500 : 50; if (b !== P.last) P.waktuBerubah = t; if (t - P.waktuBerubah > batas && b !== P.stabil) { P.stabil = b; if (P.stabil) balik(); } P.last = b; }
  sensor();
  if (t - P.waktuKedip >= 500) { P.waktuKedip = t; P.lampu = !P.lampu; }
  return ev;
}
export function simulasi(versi, sk, T) {
  const P = papan(versi); const jejak = []; const balik = []; const baca = [];
  for (let t = 0; t <= T; t++) {
    const tb = tombolPada(sk, t); const ev = langkah(P, t, tb, sensorPada(sk, t));
    if (ev.balik) balik.push(t); if (ev.baca && tb) baca.push(t);
    jejak.push({ t, tombol: tb, kipas: P.kipas, lampu: P.lampu, darurat: P.darurat, stabil: P.stabil, waktuBerubah: P.waktuBerubah });
  }
  return { jejak, balik, baca, P };
}
const HL = (x) => (x ? 'HIGH' : 'LOW');
// Four-digit water meter (challenge b): arithmetic mod 10000.
const meter = (x) => ((x % 10000) + 10000) % 10000;
export const caraPertama = (sekarang, wk) => meter(sekarang - wk) >= 500;
export const caraKedua = (sekarang, wk) => sekarang >= meter(wk + 500);

const SK_3B = { sensor: [[0, 760]], tombol: [{ a: 1200, b: 1500 }, { a: 2900, b: 3300 }, { a: 4800, b: 7300 }] };
const SK_RAPI = { sensor: [[0, 760]], tombol: [{ a: 1200, b: 1500 }] };
const SK_PANTUL = { sensor: [[0, 760]], tombol: [{ a: 100, b: 400, pantul: true }] };
const BACAAN = [818, 700, 600, 650, 740];
const uniq = (xs) => [...new Set(xs)];
const daftar = (xs) => (xs.length ? xs.join(', ') : 'tidak ada');

export default {
  id: 'sma-56-mikrokontroler',
  title: 'Kode untuk Mikrokontroler',
  topic: 'Pemrograman mikrokontroler: setup() dan loop(), pin masukan dan keluaran, sensor analog dan pembagian bilangan bulat, dua batas untuk kipas, garis waktu, delay yang membuat program tidak tanggap, millis(), deteksi perubahan tombol, debounce, dan penghitung waktu yang kembali ke nol',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri program pengering gabah dengan garis waktu, hitung bacaan sensor, temukan mengapa delay membuat tombol tidak terdengar, lalu buat satu tekanan tombol terhitung tepat satu kali.',
  extraModes: [
    { id: 'simulator', icon: '🔌', label: 'Simulator Papan', desc: 'Jalankan versi 1, 2, 3, usulan Dodi, Rina, atau Rudi; geser sensor, tekan tombol rapi atau memantul, dan lihat garis waktunya sampai per milidetik', create: createSim },
    { id: 'giliran', icon: '🎯', label: 'Tebak Keluaran Papan', desc: 'Satu tim menyusun kejadian sensor dan tombol, tim lain menebak KIPAS, LAMPU, dan darurat sebelum simulasi dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mikrokontroler' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(kode('v1', { kecil: true }));
        const per = simulasi('v1', { sensor: [[0, 0]] }, 59999).jejak.filter((j) => j.t % 1000 === 0).length;
        rowsChoose(wrap, ctx, { prompt: 'Mengenal setup() dan loop(). Hanya delay yang memakan waktu.', cls: 'mcu-isi', rows: [
          ['a', 'Satu putaran loop()', ['500 ms', '1000 ms', '1 ms', '2000 ms'], '1000 ms'],
          ['s', 'setup() dijalankan', ['sekali, saat papan dinyalakan', 'setiap putaran', 'dua kali', 'tidak pernah'], 'sekali, saat papan dinyalakan'],
          ['l', 'loop() dalam satu menit', ['1', '2', '60', '120'], String(per)],
          ['m', 'Pin masukan', ['TOMBOL (pin 2) dan SENSOR (A0)', 'KIPAS (pin 8) dan LAMPU (pin 13)', 'TOMBOL dan LAMPU', 'SENSOR dan KIPAS'], 'TOMBOL (pin 2) dan SENSOR (A0)'],
          ['k', 'Pin keluaran', ['KIPAS (pin 8) dan LAMPU (pin 13)', 'TOMBOL (pin 2) dan SENSOR (A0)', 'TOMBOL dan KIPAS', 'SENSOR dan LAMPU'], 'KIPAS (pin 8) dan LAMPU (pin 13)'],
          ['d', 'Program pengendali tidak pernah berhenti, karena', ['alat harus terus mengawasi sensor dan tombol selama listrik menyala', 'papan tidak punya baris terakhir', 'supaya baterai awet', 'Python tidak bisa berhenti'], 'alat harus terus mengawasi sensor dan tombol selama listrik menyala'],
        ], done: next });
      }
      else if (r === 1) {
        let nyala = false;
        const baris = BACAAN.map((b, i) => { const l = lembapDari(b); if (l > 70) nyala = true; if (l < 60) nyala = false; return [`p${i}`, `Putaran ${i + 1}: bacaan ${b}`, null, `${l} · ${nyala} · ${HL(nyala)}`, l]; });
        rowsChoose(wrap, ctx, { prompt: 'lembap · kipasNyala · pin KIPAS (mula-mula false, darurat false)', cls: 'mcu-isi mcu-mono', rows: baris.map(([k, t, , a, l]) => { const [, n] = a.split(' · '); const lain = n === 'true' ? 'false' : 'true'; return [k, t, uniq([a, `${l} · ${lain} · ${HL(lain === 'true')}`, `${l + 1} · ${n} · ${HL(n === 'true')}`, `${Math.round((BACAAN[Number(k[1])] * 100) / 1023)} · ${n} · ${HL(n === 'true')}`]), a]; }), done: next, info: 'Contoh: 818 × 100 = 81.800, lalu 81.800 / 1023 = 79,96, dan pecahannya dibuang.' });
      }
      else if (r === 2) {
        let on = null; let off = null; for (let b = 0; b <= 1023; b++) { if (on === null && lembapDari(b) > 70) on = b; if (lembapDari(b) < 60) off = b; }
        const rudi = (b) => Math.trunc(b / 1023) * 100;
        rowsChoose(wrap, ctx, { prompt: 'Dua batas dan urutan operasi', cls: 'mcu-isi', rows: [
          ['b', 'Dengan satu batas, kelembapan berkisar 70%–71%', ['kipas menyala dan mati setiap detik: cepat aus, boros, berisik', 'kipas selalu mati', 'kipas selalu menyala', 'tidak ada bedanya'], 'kipas menyala dan mati setiap detik: cepat aus, boros, berisik'],
          ['r', 'Rudi: bacaan / 1023 * 100 untuk bacaan 818', ['0', '79', '80', '100'], String(rudi(818))],
          ['n', 'Cara Rudi memberi hasil bukan 0 hanya untuk bacaan', ['1023', '1000 ke atas', '512 ke atas', 'tidak ada'], [...Array(1024).keys()].filter((b) => rudi(b) !== 0).join(', ')],
          ['g', 'Akibatnya bagi gabah', ['kipas tidak pernah menyala, udara lembap tidak terbuang, gabah bisa berjamur', 'kipas selalu menyala', 'gabah terlalu kering', 'tidak ada akibatnya'], 'kipas tidak pernah menyala, udara lembap tidak terbuang, gabah bisa berjamur'],
          ['o', 'Bacaan terkecil yang membuat kipas menyala', ['716', '726', '727', '728'], String(on)],
          ['f', 'Bacaan terbesar yang membuat kipas mati', ['603', '612', '613', '614'], String(off)],
        ], done: next });
      }
      else if (r === 3) {
        const J = simulasi('v1', { sensor: [[0, 760]] }, 3000).jejak;
        const sel = [0, 500, 1000, 1500, 2000, 2500];
        rowsChoose(wrap, ctx, { prompt: 'Garis waktu versi 1: LAMPU · baris yang sedang dijalankan', cls: 'mcu-isi mcu-mono', rows: [
          ...sel.map((a) => { const p = papan('v1'); const L = J[a + 250].lampu; langkah(p, a + 250, false, 0); return [`s${a}`, `${a}–${a + 500} ms`, ['HIGH · 24', 'LOW · 26', 'HIGH · 26', 'LOW · 24'], `${HL(L)} · ${p.baris}`]; }),
          ['t', 'Tombol dibaca pada t =', ['0, 1000, 2000, 3000', '0, 500, 1000, 1500, …', 'setiap milidetik', '500, 1500, 2500'], J.filter((j) => j.t % 1000 === 0).map((j) => j.t).join(', ')],
        ], done: next });
      }
      else if (r === 4) {
        const S = simulasi('v1', SK_3B, 8000); const baca = (p) => S.baca.filter((t) => t >= p.a && t < p.b);
        const dar = (ts) => ts.map((t) => S.jejak[t].darurat).join(', ');
        const [p1, p2, p3] = SK_3B.tombol;
        rowsChoose(wrap, ctx, { prompt: 'Pak Darto menekan tombol darurat tiga kali (versi 1)', cls: 'mcu-isi', rows: [
          ['a', 'Tekanan 1 (1200–1500): terbaca · darurat', ['tidak terbaca · false', '1200 · true', '1000 · true', '1500 · true'], baca(p1).length ? '?' : `tidak terbaca · ${S.jejak[1500].darurat}`],
          ['b', 'Tekanan 2 (2900–3300): terbaca · darurat', ['3000 · true', '2900 · true', 'tidak terbaca · false', '3000 · false'], `${daftar(baca(p2))} · ${dar(baca(p2))}`],
          ['c', 'Tekanan 3 (4800–7300): terbaca · darurat', ['5000, 6000, 7000 · false, true, false', '5000 · true', '4800 · true', '5000, 6000, 7000 · true, false, true'], `${daftar(baca(p3))} · ${dar(baca(p3))}`],
          ['p', 'Tekanan 300 ms pada waktu acak terbaca kira-kira', ['3%', '30%', '50%', '100%'], '30%'],
          ['d', 'Yang membuat program "tuli" terhadap tombol', ['delay: selama menunggu papan tidak membaca tombol', 'analogRead', 'pinMode', 'digitalWrite'], 'delay: selama menunggu papan tidak membaca tombol'],
        ], done: next, info: 'Tombol hanya dibaca di baris 15, sekali setiap putaran.' });
      }
      else if (r === 5) {
        const S = simulasi('v2', SK_RAPI, 2000); const ganti = []; for (let t = 1; t <= 2000; t++) if (S.jejak[t].lampu !== S.jejak[t - 1].lampu) ganti.push(t);
        rowsChoose(wrap, ctx, { prompt: 'Versi 2 tanpa delay: satu putaran = 1 ms', cls: 'mcu-isi', rows: [
          ['g', 'Lampu berganti pada sekarang =', ['500, 1000, 1500, 2000', '0, 500, 1000, 1500', '499, 999, 1499, 1999', 'setiap milidetik'], ganti.join(', ')],
          ['n', 'Lampu menyala pada', ['500–999 dan 1500–1999', '0–499 dan 1000–1499', '0–2000', '1000–1999'], S.jejak[700].lampu && S.jejak[1700].lampu && !S.jejak[200].lampu ? '500–999 dan 1500–1999' : '?'],
          ['b', 'Tombol dibaca dalam satu detik', ['1', '2', '500', '1000'], '1000'],
          ['c', 'Tekanan rapi 1200–1499: darurat dibalik · keadaan akhir', ['300 kali · false', '1 kali · true', '299 kali · true', '0 kali · false'], `${S.balik.length} kali · ${S.jejak[2000].darurat}`],
          ['m', 'Masalahnya', ['darurat dibalik selama tombol ditekan, bukan sekali saat mulai ditekan; hasilnya bergantung pada ganjil-genap', 'tombol tidak terbaca', 'lampu berhenti berkedip', 'kipas rusak'], 'darurat dibalik selama tombol ditekan, bukan sekali saat mulai ditekan; hasilnya bergantung pada ganjil-genap'],
          ['d', 'Usulan Dodi: darurat dibalik bila', ['b == HIGH && bacaanTerakhir == LOW, lalu bacaanTerakhir = b setiap putaran', 'b == HIGH saja', 'b == LOW && bacaanTerakhir == HIGH', 'bacaanTerakhir == HIGH'], 'b == HIGH && bacaanTerakhir == LOW, lalu bacaanTerakhir = b setiap putaran'],
        ], done: next });
      }
      else if (r === 6) {
        wrap.append(pantulView());
        const A = simulasi('v2', SK_PANTUL, 1000); const D = simulasi('dodi', SK_PANTUL, 1000);
        rowsChoose(wrap, ctx, { prompt: 'Tombol yang memantul. Mula-mula darurat = false.', cls: 'mcu-isi', rows: [
          ['a', 'Versi 2: darurat dibalik · keadaan akhir', ['299 kali · true', '300 kali · false', '4 kali · false', '1 kali · true'], `${A.balik.length} kali · ${A.P.darurat}`],
          ['k', 'Hasil versi 2 itu benar karena', ['kebetulan: 299 ganjil', 'versi 2 sudah memakai debounce', 'tombol hanya dibaca sekali', 'lampu berkedip'], 'kebetulan: 299 ganjil'],
          ['b', 'Usulan Dodi: dibalik pada t =', ['100, 103, 106, 401', '100', '100, 106', '100, 103, 106'], D.balik.join(', ')],
          ['d', 'Usulan Dodi: keadaan akhir', ['false', 'true'], String(D.P.darurat)],
          ['w', 'Penyebabnya', ['pantulan saat ditekan (103, 106) dan saat dilepas (401) dianggap tekanan baru', 'Dodi lupa bacaanTerakhir = b', 'tombol rusak', 'kipas mengganggu tombol'], 'pantulan saat ditekan (103, 106) dan saat dilepas (401) dianggap tekanan baru'],
        ], done: next });
      }
      else if (r === 7) {
        const S = simulasi('v3', SK_PANTUL, 500);
        const T = [102, 103, 105, 106, 157, 400, 401, 402, 453];
        rowsChoose(wrap, ctx, { prompt: 'Versi 3 (debounce): b · waktuBerubah · tombolStabil · darurat', cls: 'mcu-isi mcu-mono', rows: T.map((t) => {
          const j = S.jejak[t]; const a = `${HL(j.tombol)} · ${j.waktuBerubah} · ${HL(j.stabil)} · ${j.darurat}`;
          const prev = S.jejak[t - 1];
          return [`t${t}`, `t = ${t}`, uniq([a, `${HL(j.tombol)} · ${prev.waktuBerubah === j.waktuBerubah ? t : prev.waktuBerubah} · ${HL(j.stabil)} · ${j.darurat}`, `${HL(j.tombol)} · ${j.waktuBerubah} · ${HL(!j.stabil)} · ${!j.darurat}`, `${HL(!j.tombol)} · ${j.waktuBerubah} · ${HL(j.stabil)} · ${j.darurat}`]), a];
        }), done: next, info: 't = 100: HIGH · 100 · LOW · false. Nilai pada akhir putaran.' });
      }
      else if (r === 8) {
        const S = simulasi('v3', SK_PANTUL, 1000); const R = simulasi('rina', SK_PANTUL, 1000); const U = simulasi('rudi', SK_PANTUL, 1000);
        const hari = (2 ** 32 / 86400000).toFixed(2).replace('.', ',');
        rowsChoose(wrap, ctx, { prompt: 'Debounce, usulan Rina, dan Tantangan', cls: 'mcu-isi', rows: [
          ['n', 'Versi 3: darurat dibalik · jeda sejak sentuhan pertama', ['1 kali · 57 ms', '1 kali · 51 ms', '2 kali · 57 ms', '4 kali · 0 ms'], `${S.balik.length} kali · ${S.balik[0] - SK_PANTUL.tombol[0].a} ms`],
          ['r', 'Rina mengganti 50 dengan 500', ['tekanan tidak pernah diterima: HIGH hanya stabil 294 ms', 'lebih aman tanpa kerugian', 'darurat dibalik dua kali', 'darurat dibalik pada t = 600'], R.balik.length === 0 ? 'tekanan tidak pernah diterima: HIGH hanya stabil 294 ms' : '?'],
          ['u', 'Cara Rudi: dibalik pada t =', ['100 dan 401', '100', '157', '100, 103, 106, 401'], U.balik.join(' dan ')],
          ['m', 'Meteran 4 angka, waktuKedip = 9800, sekarang = 9900: cara pertama · cara kedua', ['belum berganti · berganti', 'berganti · berganti', 'belum berganti · belum berganti', 'berganti · belum berganti'], `${caraPertama(9900, 9800) ? 'berganti' : 'belum berganti'} · ${caraKedua(9900, 9800) ? 'berganti' : 'belum berganti'}`],
          ['s', 'Cara yang selalu benar', ['sekarang - waktuKedip >= 500', 'sekarang >= waktuKedip + 500', 'keduanya', 'tidak ada'], 'sekarang - waktuKedip >= 500'],
          ['h', 'millis() kembali ke 0 setelah 2³² ms, sekitar', ['49,71 hari', '4,97 hari', '497 hari', '24,86 hari'], `${hari} hari`],
        ], done: next });
      }
      else {
        // Seeded board question: same events on every screen in a race.
        const v = ['v1', 'v2', 'v3'][Math.floor(ctx.rand.next() * 3)];
        const bacaan = [520, 600, 680, 740, 800, 880][Math.floor(ctx.rand.next() * 6)];
        const a = 1000 + 100 * Math.floor(ctx.rand.next() * 30); const lama = [300, 800, 1600][Math.floor(ctx.rand.next() * 3)]; const pantul = v !== 'v1' && ctx.rand.next() < 0.5;
        const tanya = a + lama + 100 * (1 + Math.floor(ctx.rand.next() * 8)) + 50;
        const sk = { sensor: [[0, bacaan]], tombol: [{ a, b: a + lama, pantul }] };
        const j = simulasi(v, sk, tanya).jejak[tanya];
        wrap.append(el('p', { class: 'mcu-kejadian' }, `${VERSI[v].nama}; sejak t = 0 bacaan sensor ${bacaan} (lembap ${lembapDari(bacaan)}); tombol ditekan ${pantul ? 'dan memantul ' : 'rapi '}dari t = ${a} sampai ${a + lama}.`));
        rowsChoose(wrap, ctx, { prompt: `Keadaan pada t = ${tanya}`, cls: 'mcu-isi', rows: [
          ['k', 'KIPAS', ['HIGH', 'LOW'], HL(j.kipas)],
          ['l', 'LAMPU', ['HIGH', 'LOW'], HL(j.lampu)],
          ['d', 'darurat', ['true', 'false'], String(j.darurat)],
        ], done: next });
      }
    }
    render();
  },
};

// ---- views ----
function kode(v, { hl = [], kecil = false } = {}) {
  const K = VERSI[v].kode;
  return codeView(K, { labels: v === 'v1' ? K.map((_, i) => String(i + 1)) : null, hl, cls: `mcu-kode ${kecil ? 'kecil' : ''}` });
}
function pantulView() {
  const sel = [['0–99', 'LOW'], ['100–101', 'HIGH'], ['102', 'LOW'], ['103–104', 'HIGH'], ['105', 'LOW'], ['106–399', 'HIGH'], ['400', 'LOW'], ['401', 'HIGH'], ['402 …', 'LOW']];
  return el('div', { class: 'mcu-pantul' }, ...sel.map(([t, b]) => el('span', { class: b === 'HIGH' ? 'tinggi' : '' }, el('small', null, `t ${t}`), el('b', null, b))));
}

// Simulator: virtual time advances a fixed number of ms per animation frame.
const SKENARIO = {
  bebas: { nama: 'Bebas', sk: null },
  s3b: { nama: 'Soal 3b: tiga tekanan', sk: SK_3B, T: 8000, versi: 'v1' },
  s4c: { nama: 'Soal 4c: tekanan rapi', sk: SK_RAPI, T: 2000, versi: 'v2' },
  s5: { nama: 'Soal 5: tombol memantul', sk: SK_PANTUL, T: 600, versi: 'v3' },
};
const KECEPATAN = [['1×', 16], ['1/10×', 1.6], ['1/100×', 0.16]];
const ZOOM = [['5 dtk', 5000], ['1 dtk', 1000], ['100 ms', 100]];
const BATAS_T = 120000;
function createSim(root, ctx) {
  const wrap = el('div', { class: 'act mikrokontroler' });
  root.append(wrap);
  let versi = 'v1'; let pilih = 'bebas'; let sk = { sensor: [[0, 760]], tombol: [] }; let pantul = false;
  let laju = 0; let jalan = false; let sisa = 0; let zoom = 1; let raf = 0;
  let P; let t; let rek; // records per ms
  const ulang = () => { P = papan(versi); t = -1; rek = { tombol: [], kipas: [], lampu: [], darurat: [], baca: [], balik: [] }; };
  const maju = (sampai) => {
    sampai = Math.min(sampai, BATAS_T);
    while (t < sampai) { t++; const tb = tombolPada(sk, t); const ev = langkah(P, t, tb, sensorPada(sk, t)); rek.tombol.push(tb); rek.kipas.push(P.kipas); rek.lampu.push(P.lampu); rek.darurat.push(P.darurat); if (ev.baca && P.versi === 'v1') rek.baca.push(t); if (ev.balik) rek.balik.push(t); }
  };
  const S = SKENARIO;
  const muat = (k) => { pilih = k; if (S[k].sk) { sk = JSON.parse(JSON.stringify(S[k].sk)); versi = S[k].versi; zoom = k === 's5' ? 1 : 0; } else sk = { sensor: [[0, 760]], tombol: [] }; ulang(); maju(0); bangun(); };
  // Static parts are rebuilt on choices; the live parts are refreshed every frame.
  const kanvas = el('canvas', { class: 'mcu-garis', height: '170' });
  const live = {};
  const gambar = () => {
    const now = Math.max(t, 0); const W = ZOOM[zoom][1]; const t1 = Math.max(W, now); const t0 = t1 - W;
    const c = kanvas; const w = c.clientWidth || 600; if (c.width !== w) c.width = w; const g = c.getContext('2d'); g.clearRect(0, 0, w, c.height);
    const cs = getComputedStyle(wrap); const fg = cs.getPropertyValue('--ink').trim() || '#111827'; const muted = cs.getPropertyValue('--muted').trim() || '#64748b';
    const baris = [['tombol', rek.tombol, '#dc2626'], ['darurat', rek.darurat, '#7c3aed'], ['KIPAS', rek.kipas, '#0ea5e9'], ['LAMPU', rek.lampu, '#f59e0b']];
    const L = 64; const X = (x) => L + ((x - t0) / W) * (w - L - 6);
    g.font = '12px ui-monospace, monospace';
    baris.forEach(([n, arr, col], i) => {
      const y = 12 + i * 34; g.fillStyle = fg; g.fillText(n, 4, y + 16);
      g.strokeStyle = muted; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(L, y + 22); g.lineTo(w, y + 22); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = col; let a = null;
      for (let x = Math.max(0, Math.floor(t0)); x <= now + 1; x++) { const on = x <= now && arr[x]; if (on && a === null) a = x; if (!on && a !== null) { g.fillRect(X(a), y + 4, Math.max(1, X(x) - X(a)), 18); a = null; } }
    });
    g.fillStyle = '#16a34a'; for (const x of rek.baca) if (x >= t0 && x <= now) g.fillRect(X(x) - 1, 8, 2, 30);
    g.fillStyle = '#7c3aed'; for (const x of rek.balik) if (x >= t0 && x <= now) { g.beginPath(); g.arc(X(x), 46 + 4, 4, 0, 7); g.fill(); }
    g.fillStyle = muted; const langkahSkala = W >= 5000 ? 1000 : W >= 1000 ? 100 : 10;
    for (let x = Math.ceil(t0 / langkahSkala) * langkahSkala; x <= t1; x += langkahSkala) { g.fillRect(X(x), 150, 1, 6); if (W / langkahSkala <= 10 || x % (langkahSkala * 5) === 0) g.fillText(String(x), X(x) + 2, 166); }
  };
  const segar = () => {
    if (!live.t) return;
    const now = Math.max(t, 0);
    live.t.textContent = `t = ${now} ms`; live.kipas.className = `mcu-kipas ${P.kipas ? 'nyala' : ''}`; live.lampu.className = `mcu-lampu ${P.lampu ? 'nyala' : ''}`;
    live.dar.textContent = `darurat = ${P.darurat}`; live.dar.className = `mcu-dar ${P.darurat ? 'aktif' : ''}`; live.lembap.textContent = `bacaan ${sensorPada(sk, now)} → lembap ${lembapDari(sensorPada(sk, now))} · kipasNyala = ${P.kipasNyala}`;
    live.tombol.className = `mcu-tombol ${rek.tombol[now] ? 'ditekan' : ''}`;
    const hl = []; if (versi === 'v1') hl.push(P.baris - 1); if (rek.balik.length && now - rek.balik.at(-1) < (versi === 'v1' ? 300 : 30)) hl.push(HL_BALIK(versi));
    live.kode.querySelectorAll('li').forEach((li, i) => li.classList.toggle('hl', hl.includes(i)));
    live.ringkas.textContent = `darurat dibalik ${rek.balik.length} kali${rek.balik.length ? `: t = ${rek.balik.slice(-6).join(', ')}${rek.balik.length > 6 ? ', …' : ''}` : ''}`;
    if (live.geser) live.geser.value = String(now);
    gambar();
  };
  const putar = () => {
    cancelAnimationFrame(raf);
    const frame = () => {
      if (!wrap.isConnected) return;
      if (jalan) { sisa += KECEPATAN[laju][1]; const n = Math.floor(sisa); sisa -= n; const batas = S[pilih].sk ? S[pilih].T : BATAS_T; maju(Math.min(t + n, batas)); if (t >= batas) { jalan = false; live.main && (live.main.textContent = '▶ Jalan'); } segar(); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
  const tekan = (on) => {
    if (S[pilih].sk) return;
    if (on) sk.tombol.push({ a: t + 1, b: Infinity, pantul }); else { const p = sk.tombol.at(-1); if (p && p.b === Infinity) p.b = Math.max(p.a + 1, t + 1); }
    segar();
  };
  const bangun = () => {
    const tetap = !!S[pilih].sk;
    const kipas = el('div', { class: 'mcu-kipas' }, '🌀'); const lampu = el('div', { class: 'mcu-lampu' }); const dar = el('p', { class: 'mcu-dar' });
    const tombol = el('button', { class: 'mcu-tombol', type: 'button', 'aria-label': 'Tombol darurat' }, 'DARURAT');
    if (!tetap) { tombol.addEventListener('pointerdown', (e) => { e.preventDefault(); tombol.setPointerCapture?.(e.pointerId); tekan(true); }); ['pointerup', 'pointercancel'].forEach((n) => tombol.addEventListener(n, () => tekan(false))); }
    const slider = el('input', { type: 'range', min: '0', max: '1023', step: '1', class: 'mcu-range', 'aria-label': 'Bacaan sensor' }); slider.value = String(sensorPada(sk, Math.max(t, 0))); slider.disabled = tetap;
    slider.addEventListener('input', () => { sk.sensor.push([t + 1, Number(slider.value)]); segar(); });
    const kodeEl = kode(versi, { kecil: true });
    const geser = tetap ? el('input', { type: 'range', min: '0', max: String(S[pilih].T), step: '1', class: 'mcu-range lebar', 'aria-label': 'Waktu' }) : null;
    if (geser) geser.addEventListener('input', () => { const x = Number(geser.value); if (x < t) ulang(); maju(x); jalan = false; segar(); });
    Object.assign(live, { t: el('b', { class: 'mcu-waktu' }), kipas, lampu, dar, lembap: el('small', null), tombol, kode: kodeEl, ringkas: el('p', { class: 'mcu-ket' }), geser, main: null });
    live.main = button(jalan ? '⏸ Jeda' : '▶ Jalan', () => { jalan = !jalan; live.main.textContent = jalan ? '⏸ Jeda' : '▶ Jalan'; });
    wrap.replaceChildren(
      el('div', { class: 'seg mcu-pilih' }, Object.entries(VERSI).map(([k, V]) => onTap(el('button', { class: `seg-btn ${k === versi ? 'on' : ''}`, type: 'button' }, V.nama), () => { versi = k; const x = t; ulang(); maju(Math.max(0, x)); bangun(); }))),
      el('div', { class: 'seg mcu-pilih' }, Object.entries(S).map(([k, x]) => onTap(el('button', { class: `seg-btn ${k === pilih ? 'on' : ''}`, type: 'button' }, x.nama), () => muat(k)))),
      el('div', { class: 'mcu-meja' },
        el('div', { class: 'mcu-papan' }, live.t, el('div', { class: 'mcu-alat' }, el('div', null, kipas, el('small', null, 'KIPAS (8)')), el('div', null, lampu, el('small', null, 'LAMPU (13)')), el('div', null, tombol, el('small', null, 'TOMBOL (2)'))),
          dar, el('label', { class: 'mcu-sensor' }, el('span', null, 'SENSOR (A0)'), slider), live.lembap,
          ...[tetap ? null : el('div', { class: 'seg mcu-jenis' }, [['rapi', false], ['memantul', true]].map(([n, v]) => onTap(el('button', { class: `seg-btn ${pantul === v ? 'on' : ''}`, type: 'button' }, `tombol ${n}`), () => { pantul = v; bangun(); })))].filter(Boolean)),
        el('div', { class: 'mcu-kodebox' }, kodeEl)),
      el('div', { class: 'mcu-kontrol' }, live.main, button('+1 ms', () => { maju(t + 1); segar(); }), button('+100 ms', () => { maju(t + 100); segar(); }), button('⟲ Ulang', () => { if (!tetap) sk = { sensor: [[0, Number(slider.value)]], tombol: [] }; ulang(); maju(0); jalan = false; bangun(); }),
        el('div', { class: 'seg' }, KECEPATAN.map(([n], i) => onTap(el('button', { class: `seg-btn ${i === laju ? 'on' : ''}`, type: 'button' }, n), () => { laju = i; bangun(); }))),
        el('div', { class: 'seg' }, ZOOM.map(([n], i) => onTap(el('button', { class: `seg-btn ${i === zoom ? 'on' : ''}`, type: 'button' }, n), () => { zoom = i; bangun(); })))),
      ...[geser].filter(Boolean), kanvas, live.ringkas,
      el('p', { class: 'mcu-ket' }, versi === 'v1' ? 'Garis hijau: tombol dibaca (baris 15). Titik ungu: darurat dibalik.' : 'Versi ini membaca tombol setiap milidetik. Titik ungu: darurat dibalik.'));
    segar();
  };
  ulang(); maju(0); bangun(); putar();
}

// Team mode (soal 6): one team sets events and asks three times, the other guesses KIPAS, LAMPU, darurat.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act mikrokontroler' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let n = 0;
    function babak() {
      if (n >= turns) { finishBoard(wrap, ctx, { title: 'Tebak Keluaran Papan selesai', pts, again: () => pickTeams(wrap, 'Tebak Keluaran Papan', start) }); return; }
      const susun = n % nT; const tebak = (n + 1) % nT;
      const A = { versi: 'v1', bacaan: 760, ubah: false, tUbah: 2300, bacaan2: 500, tekan: true, a: 2300, b: 2600, pantul: false, tanya: [2200, 3100, 4500] };
      const susunan = () => {
        const set = (k) => (v) => { A[k] = v; };
        wrap.replaceChildren(scoreBar(pts, susun), el('p', { class: 'prompt' }, `Tim ${susun + 1} menyusun kejadian`),
          el('div', { class: 'seg mcu-pilih' }, ['v1', 'v2', 'v3'].map((k) => onTap(el('button', { class: `seg-btn ${A.versi === k ? 'on' : ''}`, type: 'button' }, VERSI[k].nama), () => { A.versi = k; susunan(); }))),
          el('div', { class: 'mcu-atur' },
            stepper(A.bacaan, set('bacaan'), { min: 0, max: 1023, step: 10, label: 'bacaan sensor sejak t = 0' }),
            el('div', { class: 'seg' }, [['tanpa perubahan sensor', false], ['sensor berubah', true]].map(([t2, v]) => onTap(el('button', { class: `seg-btn ${A.ubah === v ? 'on' : ''}`, type: 'button' }, t2), () => { A.ubah = v; susunan(); }))),
            ...(A.ubah ? [stepper(A.tUbah, set('tUbah'), { min: 100, max: 7900, step: 100, label: 'berubah pada t =' }), stepper(A.bacaan2, set('bacaan2'), { min: 0, max: 1023, step: 10, label: 'menjadi' })] : []),
            el('div', { class: 'seg' }, [['tombol tidak ditekan', false], ['tombol ditekan', true]].map(([t2, v]) => onTap(el('button', { class: `seg-btn ${A.tekan === v ? 'on' : ''}`, type: 'button' }, t2), () => { A.tekan = v; susunan(); }))),
            ...(A.tekan ? [stepper(A.a, set('a'), { min: 0, max: 7800, step: 100, label: 'ditekan dari t =' }), stepper(A.b, set('b'), { min: 100, max: 8000, step: 100, label: 'sampai t =' }),
              el('div', { class: 'seg' }, [['rapi', false], ['memantul', true]].map(([t2, v]) => onTap(el('button', { class: `seg-btn ${A.pantul === v ? 'on' : ''}`, type: 'button' }, t2), () => { A.pantul = v; susunan(); })))] : []),
            ...A.tanya.map((x, i) => stepper(x, (v) => { A.tanya[i] = v; }, { min: 0, max: 8000, step: 100, label: `waktu ditanya ${i + 1}` }))),
          button('Selesai menyusun ➜', () => { if (A.tekan && A.b <= A.a) { shake(wrap); return; } ctx.sound.tap(); tebakan(); }, 'primary'));
      };
      const skOf = () => ({ sensor: [[0, A.bacaan], ...(A.ubah ? [[A.tUbah, A.bacaan2]] : [])], tombol: A.tekan ? [{ a: A.a, b: A.b, pantul: A.pantul }] : [] });
      const teks = () => `${VERSI[A.versi].nama}; sejak t = 0 bacaan ${A.bacaan}${A.ubah ? `, menjadi ${A.bacaan2} pada t = ${A.tUbah}` : ''}; ${A.tekan ? `tombol ditekan ${A.pantul ? 'dan memantul' : 'rapi'} dari t = ${A.a} sampai ${A.b}` : 'tombol tidak ditekan'}.`;
      const tebakan = () => {
        const G = A.tanya.map(() => ({ kipas: null, lampu: null, darurat: null })); const msg = el('p', { class: 'reveal info' }, 'Pilih semua tebakan, lalu Jalankan simulasi.');
        const draw = () => wrap.replaceChildren(scoreBar(pts, tebak), el('p', { class: 'prompt' }, `Tim ${tebak + 1} menebak`), el('p', { class: 'mcu-kejadian' }, teks()), kode(A.versi, { kecil: true }),
          el('div', { class: 'mcu-tebak' }, ...A.tanya.map((x, i) => el('div', { class: 'mcu-baris' }, el('b', null, `t = ${x}`), ...[['kipas', 'KIPAS', ['HIGH', 'LOW']], ['lampu', 'LAMPU', ['HIGH', 'LOW']], ['darurat', 'darurat', ['true', 'false']]].map(([k, n2, o]) => el('div', { class: 'seg' }, el('small', null, n2), ...o.map((v) => onTap(el('button', { class: `seg-btn ${G[i][k] === v ? 'on' : ''}`, type: 'button' }, v), () => { G[i][k] = v; draw(); }))))))),
          button('Jalankan simulasi', () => {
            if (G.some((g) => Object.values(g).some((v) => v === null))) { say(msg, 'bad', 'Masih ada tebakan yang kosong.'); return; }
            const S = simulasi(A.versi, skOf(), Math.max(...A.tanya)); let benar = 0; let salah = 0;
            const hasil = A.tanya.map((x, i) => { const j = S.jejak[x]; const asli = { kipas: HL(j.kipas), lampu: HL(j.lampu), darurat: String(j.darurat) }; for (const k of Object.keys(asli)) (asli[k] === G[i][k] ? benar++ : salah++); return el('li', null, `t = ${x}: KIPAS ${asli.kipas}, LAMPU ${asli.lampu}, darurat ${asli.darurat}${A.versi === 'v1' ? ` (putaran mulai t = ${x - (x % 1000)})` : ''}`); });
            pts[tebak] += benar; pts[susun] += salah; benar ? ctx.sound.good() : ctx.mistake();
            wrap.replaceChildren(scoreBar(pts, tebak), el('p', { class: 'prompt' }, 'Hasil penelusuran'), el('p', { class: 'mcu-kejadian' }, teks()), el('ul', { class: 'mcu-hasil' }, ...hasil),
              el('p', { class: 'mcu-ket' }, `darurat dibalik pada t = ${daftar(S.balik.slice(0, 8))}${S.balik.length > 8 ? ', …' : ''}.`),
              el('p', { class: 'reveal good' }, `Tim ${tebak + 1} +${benar}, Tim ${susun + 1} +${salah} (tim penyusun menjelaskan jawaban yang benar).`), button('Lanjut ➜', () => { n++; babak(); }, 'primary'));
          }, 'primary'), msg);
        draw();
      };
      susunan();
    }
    babak();
  }
  pickTeams(wrap, 'Tebak Keluaran Papan', start);
}
