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
import { say, pickTeams, scoreBar, finishBoard, codeView, stepper } from './smp-kit.js';
import { misiHead, fill, codeView as kodeMk, rowsView, fillBoard, tileSlots } from './misi-kit.js';

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
  else { const batas = P.batas ?? (v === 'rina' ? 500 : 50); if (b !== P.last) P.waktuBerubah = t; if (t - P.waktuBerubah > batas && b !== P.stabil) { P.stabil = b; if (P.stabil) balik(); } P.last = b; }
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
const daftar = (xs) => (xs.length ? xs.join(', ') : 'tidak ada');

// ---------- Penjaga Pengering: the hands-on missions ----------
const PENIDUR = '😴 Si Penidur'; const MEMANTUL = '🏓 Si Tombol Memantul';
const HEAD56 = {
  bangun: ['Papan Bangun', 'Pasang kabel pin, lalu jalankan papan dan hitung putarannya.', PENIDUR, 'Papan cuma jalan sekali, kan?'],
  sensor: ['Sensor dan Kipas', 'Hitung kelembapan lima putaran dan nyalakan kipas tepat waktu.', PENIDUR, 'Bagi dulu baru kali, sama saja!'],
  batas: ['Dua Batas Kipas', 'Geser sensor ke bacaan terkecil yang menyalakan kipas, lalu yang mematikannya.', PENIDUR, 'Satu batas cukup, biar kipas joget!'],
  tidur: ['Papan yang Tertidur', 'Tandai saat LAMPU menyala, lalu saat tombol benar-benar terbaca.', PENIDUR, 'Selama delay, aku menutup telinga papan.'],
  tekan: ['Tekan Saat Papan Bangun', 'Tekan tombol 300 ms sepuluh kali. Berapa yang terbaca?', PENIDUR, 'Coba saja, kebanyakan kutelan!'],
  millis: ['Bangunkan Papan', 'Ganti delay dengan millis(), lalu tekan tombol dengan rapi.', PENIDUR, 'Tanpa delay, tombolmu dibaca 300 kali!'],
  dodi: ['Deteksi Perubahan', 'Pasang usulan Dodi, lalu hadapi tombol yang memantul.', MEMANTUL, 'Satu tekanan, empat pantulan!'],
  lambat: ['Jinakkan Si Tombol Memantul', 'Perlambat waktu dan tangkap saat versi 3 menerima tekanan.', MEMANTUL, 'Coba tangkap aku dalam gerak lambat!'],
  tebak: ['Tebak Keluaran Papan', 'Atur tebakan KIPAS, LAMPU, dan darurat, lalu jalankan papannya.', PENIDUR, 'Tebakanmu pasti meleset!'],
  bos: ['Meteran Waktu', 'Bongkar cara Rudi, lalu uji dua cara menghitung waktu di meteran empat angka.', MEMANTUL, 'Waktu juga bisa berputar ke nol, lho!'],
};
const msg56 = (t) => el('p', { class: 'reveal info' }, t);
const dua56 = (...k) => el('div', { class: 'pg56-dua' }, ...k);
const kol56 = (...k) => el('div', { class: 'pg56-kolom' }, ...k);
// The dryer box: fan, lamp, red button, the board's eyes and the variables.
function kotak56(S = {}) {
  return el('div', { class: 'pg56-kotak' },
    el('div', { class: 'pg56-alat' },
      el('span', { class: `pg56-kipas ${S.kipas ? 'nyala' : ''}`, title: 'KIPAS' }, '🌀', el('small', null, `KIPAS ${S.kipas ? 'HIGH' : 'LOW'}`)),
      el('span', { class: `pg56-lampu ${S.lampu ? 'nyala' : ''}` }, S.lampu ? '💡' : '⚫', el('small', null, `LAMPU ${S.lampu ? 'HIGH' : 'LOW'}`)),
      el('span', { class: `pg56-tombol ${S.tombol ? 'tekan' : ''}` }, '🔴', el('small', null, 'TOMBOL')),
      el('span', { class: 'pg56-mata' }, S.tidur ? '😴' : '👀', el('small', null, S.tidur ? 'delay' : 'papan'))),
    el('div', { class: 'pg56-var' }, S.lembap != null ? el('span', null, `lembap ${S.lembap}`) : null, el('span', null, `darurat ${S.darurat ? 'true' : 'false'}`), S.t != null ? el('span', null, `t = ${S.t} ms`) : null));
}
const LOOP56 = ['void loop() {', '  if (digitalRead(TOMBOL) == HIGH)', '    darurat = !darurat;', '  …baca sensor, atur kipas…', '  digitalWrite(LAMPU, HIGH);', '  delay(500);', '  digitalWrite(LAMPU, LOW);', '  delay(500);'];

// Misi 1: wire the pins, then run setup() once and loop() again and again.
function bangunRound(area, ctx, { oops, done }) {
  const msg = msg56('Pasang setiap alat ke pinnya seperti di baris 1–4 program.');
  const kiri = kol56(kodeMk(['const int KIPAS = 8;', 'const int LAMPU = 13;', 'const int TOMBOL = 2;', 'const int SENSOR = A0;'])); const kanan = kol56();
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['🔴 tombol darurat → pin ', '_'], ['💧 sensor kelembapan → ', '_'], ['🌀 kipas → pin ', '_'], ['💡 lampu → pin ', '_']]), chips: ['2', 'A0', '8', '13', '5'], want: ['2', 'A0', '8', '13'],
    hints: ['Lihat const int TOMBOL.', 'Sensor analog memakai pin A.', 'Lihat const int KIPAS.', 'Lihat const int LAMPU.'], done: jalan }));
  function jalan() {
    say(msg, 'info', 'Kabel terpasang. Tekan Jalankan dan amati setup() dan loop().');
    const setup = kodeMk(['void setup() {', '  pinMode(KIPAS, OUTPUT);', '  pinMode(LAMPU, OUTPUT);', '  pinMode(TOMBOL, INPUT);', '}']);
    const hit = el('p', { class: 'pg56-tally' }, 'setup() ×0 · loop() ×0 · t = 0 ms'); const box = el('div');
    fill(kiri, setup, hit); fill(kanan, box, onTap(el('button', { class: 'btn primary pg56-jalan', type: 'button' }, '▶ Jalankan'), mulai)); fill(box, kotak56({}));
    let mulaiSudah = false;
    function mulai() {
      if (mulaiSudah) return; mulaiSudah = true; ctx.sound.tap(); setup.classList.add('pg56-nyala');
      let t = 0; let n = 0;
      const tick = () => {
        if (!box.isConnected) return;
        if (t === 0) { setup.classList.remove('pg56-nyala'); fill(kiri, setup, hit, kodeMk(LOOP56)); }
        const L = kiri.lastChild; if (t % 1000 === 0) n++;
        L.querySelectorAll('.mk-baris').forEach((r, i) => r.classList.toggle('hl', i === (t % 1000 < 500 ? 5 : 7)));
        hit.textContent = `setup() ×1 · loop() ×${n} · t = ${t} ms`; fill(box, kotak56({ lampu: t % 1000 < 500, tidur: true, t }));
        t += 250; if (t <= 3000) { setTimeout(tick, 260); return; }
        say(msg, 'info', 'setup() hanya sekali, loop() berulang selama listrik menyala. Berapa lama satu putaran?');
        fill(kanan, box, fillBoard(ctx, { oops, msg, view: rowsView([['satu putaran loop() = ', '_', ' ms'], ['loop() dalam 1 menit = ', '_', ' kali']]), chips: ['1000', '500', '60', '120', '1'], want: ['1000', '60'],
          hints: ['Hanya delay yang memakan waktu: 500 + 500.', '60.000 ms dibagi 1000 ms.'], done: () => { say(msg, '', 'Satu putaran 1000 ms, 60 kali per menit. Program pengendali tidak pernah selesai: ia terus mengawasi sensor dan tombol.'); done(); } }));
      };
      setTimeout(tick, 700);
    }
  }
  area.append(dua56(kiri, kanan), msg);
}

// Misi 2: five readings; integer division truncates, two thresholds drive the fan.
function sensorRound(area, ctx, { oops, done }) {
  const msg = msg56('Putaran 1: sensor membaca 818. Hitung lembap, lalu tentukan kipasNyala.'); let i = 0; let nyala = false;
  const kiri = kol56(kodeMk(['int lembap = bacaan * 100 / 1023;', 'if (lembap > 70) kipasNyala = true;', 'if (lembap < 60) kipasNyala = false;'])); const box = el('div'); const jejak = el('div', { class: 'pg56-jejak' }); const papanKerja = el('div'); const kanan = kol56(papanKerja);
  kiri.append(box, jejak);
  function putaran() {
    const b = BACAAN[i]; const l = lembapDari(b); const n = l > 70 ? true : l < 60 ? false : nyala;
    fill(box, kotak56({ kipas: nyala, lembap: i ? lembapDari(BACAAN[i - 1]) : null }));
    fill(papanKerja, fillBoard(ctx, { oops, msg, view: rowsView([[`📟 bacaan ${b}`], [`${b} * 100 / 1023 → `, '_'], ['kipasNyala → ', '_']]), chips: [String(l), String(l + 1), 'true', 'false'], want: [String(l), String(n)],
      hints: [`${b} × 100 = ${b * 100}. Pembagian int membuang pecahan, tidak membulatkan.`, l > 70 ? 'Di atas 70: kipas menyala.' : l < 60 ? 'Di bawah 60: kipas mati.' : 'Di antara 60 dan 70 tidak ada if yang berlaku: kipasNyala tetap seperti putaran sebelumnya.'],
      done: () => { nyala = n; jejak.append(el('span', { class: n ? 'nyala' : '' }, `${b}→${l} ${n ? '🌀' : '·'}`)); fill(box, kotak56({ kipas: nyala, lembap: l })); i++;
        if (i < BACAAN.length) { say(msg, 'info', `Putaran ${i + 1}: sensor membaca ${BACAAN[i]}.`); putaran(); return; }
        rudi(); } }));
  }
  function rudi() {
    say(msg, 'info', 'Rudi menulis bacaan / 1023 * 100. Apa hasilnya untuk 818?');
    fill(papanKerja, fillBoard(ctx, { oops, msg, view: rowsView([['818 / 1023 * 100 → ', '_']]), chips: ['0', '79', '80', '100'], want: ['0'], hints: ['818 / 1023 dihitung dulu: hasil int-nya 0, lalu 0 × 100.'],
      done: () => { say(msg, '', 'Cara Rudi memberi 0 kecuali untuk 1023: kipas tak pernah menyala dan gabah bisa berjamur. Kalikan dulu, baru bagi. Antara 60 dan 70 kipas mempertahankan keadaannya.'); done(); } }));
  }
  putaran();
  area.append(dua56(kiri, kanan), msg);
}

// Misi 2b: nudge the sensor to the two thresholds (hysteresis).
function batasRound(area, ctx, { oops, done }) {
  const msg = msg56('Geser sensor ke bacaan terkecil yang membuat kipas menyala (lembap > 70), lalu kunci.'); let b = 700; let tahap = 'on';
  const box = el('div'); const kanan = kol56(); const nilai = el('p', { class: 'pg56-tally' });
  const draw = () => { const l = lembapDari(b); nilai.textContent = `📟 bacaan ${b} → lembap ${l}`; fill(box, kotak56({ kipas: tahap === 'on' ? l > 70 : l >= 60, lembap: l })); };
  const geser = (d) => { b = Math.max(0, Math.min(1023, b + d)); ctx.sound.tap(); draw(); };
  fill(kanan, nilai, el('div', { class: 'pg56-geser' }, [-10, -1, 1, 10].map((d) => onTap(el('button', { class: 'pg56-tik-btn', type: 'button', 'data-d': String(d) }, d > 0 ? `+${d}` : String(d)), () => geser(d)))),
    onTap(el('button', { class: 'btn primary pg56-kunci', type: 'button' }, '🔒 Kunci bacaan ini'), kunci));
  function kunci() {
    if (tahap === 'on') {
      if (b !== 727) { oops(); say(msg, 'bad', lembapDari(b) > 70 ? 'Kipas menyala, tetapi masih ada bacaan lebih kecil yang juga menyalakannya.' : 'Kipas belum menyala: lembap harus lebih dari 70.'); return; }
      tahap = 'off'; b = 650; ctx.sound.good(); draw(); say(msg, 'info', '727 → 71: kipas menyala. Sekarang kipas sedang menyala. Geser ke bacaan terbesar yang mematikannya (lembap < 60).'); return;
    }
    if (tahap !== 'off') return;
    if (b !== 613) { oops(); say(msg, 'bad', lembapDari(b) < 60 ? 'Kipas mati, tetapi masih ada bacaan lebih besar yang juga mematikannya.' : 'Kipas masih menyala: lembap harus kurang dari 60.'); return; }
    tahap = 'selesai'; ctx.sound.good(); draw(); say(msg, '', '613 → 59: kipas mati. Di antara 614 dan 726 kipas mempertahankan keadaannya. Dua batas mencegah kipas menyala-mati setiap detik.'); done();
  }
  draw();
  area.append(dua56(kol56(box), kanan), msg);
}

// Misi 3: tap the timeline where LAMPU is HIGH, then where the button is really read.
function tidurRound(area, ctx, { oops, done }) {
  const msg = msg56('Versi 1. Ketuk potongan 500 ms saat LAMPU menyala, lalu Periksa.');
  const J = simulasi('v1', SK_3B, 8000).jejak; const on = new Set();
  const kiri = kol56(kodeMk(LOOP56, { hl: [5, 7] })); const kanan = kol56();
  const segV = () => fill(kanan, el('div', { class: 'pg56-segmen' }, Array.from({ length: 8 }, (_, i) => onTap(el('button', { class: `pg56-seg ${on.has(i) ? 'on' : ''}`, type: 'button', 'data-i': String(i) }, on.has(i) ? '💡' : '·', el('small', null, `${i * 500}`)), () => { if (on.has(i)) on.delete(i); else on.add(i); ctx.sound.tap(); segV(); }))),
    onTap(el('button', { class: 'btn primary pg56-periksa', type: 'button' }, 'Periksa ✓'), cekLampu));
  function cekLampu() {
    const salah = Array.from({ length: 8 }, (_, i) => i).filter((i) => on.has(i) !== J[i * 500 + 250].lampu);
    if (salah.length) { oops(); say(msg, 'bad', 'Belum tepat. digitalWrite(LAMPU, HIGH) lalu delay(500); digitalWrite(LAMPU, LOW) lalu delay(500).'); return; }
    ctx.sound.good(); say(msg, 'info', 'Lampu berkedip per 500 ms, dan papan tertidur di baris delay. Pak Darto menekan tombol tiga kali. Ketuk saat tombol terbaca, lalu Periksa.'); tombol();
  }
  function tombol() {
    const tanda = new Set(); const T = 8000; const want = [3000, 5000, 6000, 7000];
    const draw = () => fill(kanan, el('div', { class: 'pg56-garis' },
      SK_3B.tombol.map((p) => el('i', { class: 'pg56-tekan', style: { left: `${(p.a / T) * 100}%`, width: `${((p.b - p.a) / T) * 100}%` } }, el('small', null, `${p.a}–${p.b}`))),
      Array.from({ length: 17 }, (_, k) => k * 500).map((t) => onTap(el('button', { class: `pg56-tik ${tanda.has(t) ? 'on' : ''}`, type: 'button', 'data-t': String(t), style: { left: `${(t / T) * 100}%` } }, el('small', null, t % 1000 ? '' : String(t / 1000))), () => { if (tanda.has(t)) tanda.delete(t); else tanda.add(t); ctx.sound.tap(); draw(); }))),
    el('small', { class: 'pg56-ket' }, 'detik ke- (tombol dibaca di baris 2, awal setiap putaran)'),
    onTap(el('button', { class: 'btn primary pg56-periksa', type: 'button' }, 'Periksa ✓'), () => {
      const ok = want.length === tanda.size && want.every((t) => tanda.has(t));
      if (!ok) { oops(); say(msg, 'bad', 'Tombol hanya dibaca di awal putaran (0, 1000, 2000, …) dan hanya terhitung bila saat itu sedang ditekan.'); return; }
      fill(kiri, kotak56({ darurat: J[8000].darurat }), el('p', { class: 'pg56-tally' }, `darurat dibalik pada ${want.join(', ')}: ${want.map((t) => J[t].darurat).join(', ')}`));
      say(msg, '', 'Tekanan 1200–1500 terlewat karena papan sedang tidur. Tekanan panjang 4800–7300 terbaca tiga kali, jadi darurat bolak-balik. Si Penidur membuat papan tuli.'); done();
    }));
    draw();
  }
  segV();
  area.append(dua56(kiri, kanan), msg);
}

// Misi 3c: press 300 ms at random moments while the board sleeps; count what it hears.
function tekanRound(area, ctx, { oops, done }) {
  const msg = msg56('Papan berjalan dengan versi 1. Tekan tombol kapan saja, sepuluh kali.'); let t = 0; const hasil = []; let henti = false;
  const box = el('div'); const strip = el('div', { class: 'pg56-hasil' }); const kanan = kol56();
  const tick = () => { if (!box.isConnected || henti) return; t = (t + 37) % 100000; fill(box, kotak56({ lampu: t % 1000 < 500, tidur: t % 1000 > 30, t })); setTimeout(tick, 45); };
  fill(kanan, onTap(el('button', { class: 'pg56-tombol-besar', type: 'button' }, '🔴 Tekan 300 ms'), () => {
    if (hasil.length >= 10) return;
    const a = t; const dengar = Math.ceil(a / 1000) * 1000 < a + 300; hasil.push(dengar); ctx.sound.tap();
    strip.append(el('span', { class: dengar ? 'dengar' : '' }, `${a % 1000} ms ${dengar ? '✓' : '✗'}`));
    if (hasil.length < 10) { say(msg, 'info', `${dengar ? 'Terbaca!' : 'Terlewat, papan sedang tidur.'} Tekanan ${hasil.length} dari 10.`); return; }
    henti = true; const n = hasil.filter(Boolean).length;
    say(msg, 'info', `${n} dari 10 terbaca. Tekanan hanya terbaca bila mencakup awal putaran. Berapa peluangnya?`);
    kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['tekanan 300 ms dalam putaran 1000 ms → ', '_']]), chips: ['30%', '3%', '50%', '100%'], want: ['30%'], hints: ['Tekanan terbaca bila dimulai dalam 300 ms sebelum awal putaran: 300 dari 1000.'],
      done: () => { say(msg, '', 'Sekitar 30%: tujuh dari sepuluh tekanan singkat hilang ditelan delay.'); done(); } }));
  }), strip);
  area.append(dua56(kol56(box), kanan), msg); tick();
}

// Misi 4: replace delay with millis(); a clean press now flips darurat 300 times.
function millisRound(area, ctx, { oops, done }) {
  const msg = msg56('Susun kedip lampu tanpa delay: periksa waktu, catat waktu, balik lampu, tulis ke pin.');
  const kiri = kol56(); const kanan = kol56();
  fill(kiri, tileSlots(ctx, { oops, msg, build: ['void loop() {', '  unsigned long sekarang = millis();', ['a', 1], ['b', 2], ['c', 2], ['d', 2], '  }', '}'],
    tiles: [['a', 'if (sekarang - waktuKedip >= 500) {'], ['b', 'waktuKedip = sekarang;'], ['c', 'lampuNyala = !lampuNyala;'], ['d', 'digitalWrite(LAMPU, lampuNyala);'], ['x', 'delay(500);', 'Itu ulah Si Penidur: papan tidak boleh tertidur lagi.']],
    order: 'Periksa dulu apakah 500 ms sudah lewat.', onFull: () => {
      say(msg, 'info', 'Satu putaran kini 1 ms. Tekan tombol dengan rapi dari 1200 sampai 1499.');
      const S = simulasi('v2', SK_RAPI, 2000); const box = el('div'); const hit = el('p', { class: 'pg56-tally' }); fill(kanan, box, hit);
      let t = 1150; const tick = () => { if (!box.isConnected) return; const j = S.jejak[t]; fill(box, kotak56({ lampu: j.lampu, tombol: j.tombol, darurat: j.darurat, t })); hit.textContent = `darurat dibalik: ${S.balik.filter((x) => x <= t).length} kali`; t += 10; if (t <= 1560) { setTimeout(tick, 40); return; }
        kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['dibalik ', '_', ' kali, akhirnya ', '_']]), chips: ['300', '1', 'false', 'true'], want: [String(S.balik.length), String(S.P.darurat)],
          hints: ['Tombol dibaca setiap milidetik selama 300 ms.', '300 kali dibalik: genap, kembali ke awal.'], done: () => { say(msg, '', 'Papan tidak tuli lagi, tetapi darurat dibalik selama tombol ditekan, bukan sekali saat mulai ditekan.'); done(); } })); };
      tick();
    } }));
  area.append(dua56(kiri, kanan), msg);
}

// Misi 4b–5a: Dodi's edge detection works for a clean press, then the bouncing button arrives.
function dodiRound(area, ctx, { oops, done }) {
  const msg = msg56('Usulan Dodi: balik darurat hanya saat tombol berubah dari LOW ke HIGH. Susun barisnya.');
  const kiri = kol56(); const kanan = kol56();
  fill(kiri, tileSlots(ctx, { oops, msg, build: ['  int b = digitalRead(TOMBOL);', ['a', 1], '    darurat = !darurat;', '  }', ['b', 1]],
    tiles: [['a', 'if (b == HIGH && bacaanTerakhir == LOW) {'], ['b', 'bacaanTerakhir = b;'], ['x', 'if (b == HIGH) {', 'Itu versi 2: dibalik setiap milidetik selama ditekan.'], ['y', 'bacaanTerakhir = LOW;', 'Simpan bacaan putaran ini, bukan selalu LOW.']],
    order: 'Periksa perubahan dulu, simpan bacaan di akhir.', onFull: () => {
      const R = simulasi('dodi', SK_RAPI, 2000); const P = simulasi('dodi', SK_PANTUL, 1000);
      say(msg, 'info', `Tekanan rapi: dibalik ${R.balik.length} kali pada t = ${R.balik.join(', ')}. Berhasil! Tetapi tombol asli memantul…`);
      fill(kanan, pantulView(), el('p', { class: 'pg56-tally' }, `Usulan Dodi membalik pada t = ${P.balik.join(', ')}`),
        fillBoard(ctx, { oops, msg, view: rowsView([['dibalik ', '_', ' kali, darurat akhirnya ', '_']]), chips: ['4', '1', 'false', 'true'], want: [String(P.balik.length), String(P.P.darurat)],
          hints: ['Hitung waktu yang tertulis di atas.', 'Empat kali dibalik: kembali ke false.'], done: () => { say(msg, '', 'Pantulan saat ditekan (103, 106) dan saat dilepas (401) dianggap tekanan baru. Si Tombol Memantul menang… untuk sementara.'); done(); } }));
    } }));
  area.append(dua56(kiri, kanan), msg);
}

// Misi 5: slow motion on version 3; stop the clock at the moment the press is accepted.
function lambatRound(area, ctx, { oops, done }) {
  const msg = msg56('Versi 3 menerima tekanan bila bacaan stabil lebih dari 50 ms. Gerakkan waktu dan tangkap saat darurat berbalik.');
  const S = simulasi('v3', SK_PANTUL, 1000); let t = 95; const terima = S.balik[0];
  const kiri = kol56(kodeMk(['if (b != bacaanTerakhir)', '  waktuBerubah = sekarang;', 'if (sekarang - waktuBerubah > 50', '    && b != tombolStabil) {', '  tombolStabil = b;', '  if (tombolStabil == HIGH)', '    darurat = !darurat;', '}'])); const kanan = kol56(); const tabel = el('div', { class: 'pg56-var-var' });
  const draw = () => { const j = S.jejak[t]; fill(tabel, [['sekarang', t], ['b', j.tombol ? 'HIGH' : 'LOW'], ['waktuBerubah', j.waktuBerubah], ['selisih', t - j.waktuBerubah], ['tombolStabil', j.stabil ? 'HIGH' : 'LOW'], ['darurat', String(j.darurat)]].map(([k, v]) => el('span', { class: k === 'selisih' && t - j.waktuBerubah > 50 ? 'lewat' : '' }, el('small', null, k), el('b', null, String(v))))); };
  fill(kanan, pantulView(), tabel, el('div', { class: 'pg56-geser' }, [-10, -1, 1, 10].map((d) => onTap(el('button', { class: 'pg56-tik-btn', type: 'button', 'data-d': String(d) }, d > 0 ? `+${d} ms` : `${d} ms`), () => { t = Math.max(95, Math.min(470, t + d)); ctx.sound.tap(); draw(); }))),
    onTap(el('button', { class: 'btn primary pg56-tangkap', type: 'button' }, '📸 Tangkap'), () => {
      if (kanan.querySelector('.mk-papan')) return;
      if (t !== terima) { oops(); say(msg, 'bad', t < terima ? 'Belum: darurat belum berbalik. Lihat selisih sejak perubahan terakhir.' : 'Sudah lewat. Mundur sampai milidetik pertama darurat berbalik.'); return; }
      ctx.sound.good(); kanan.querySelector('.pg56-geser').hidden = true; kanan.querySelector('.pg56-tangkap').hidden = true; say(msg, 'info', `Tertangkap! t = ${t}: tepat sekali, ${t - SK_PANTUL.tombol[0].a} ms setelah sentuhan pertama. Rina ingin batasnya 500 ms supaya lebih aman.`);
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['batas 500 ms → tekanan ', '_']]), chips: ['tidak pernah diterima', 'diterima pada t = 600'], want: [simulasi('rina', SK_PANTUL, 1000).balik.length ? 'diterima pada t = 600' : 'tidak pernah diterima'],
        hints: ['HIGH hanya stabil dari 106 sampai 399: 294 ms, kurang dari 500.'], done: () => { say(msg, '', 'Si Tombol Memantul jinak: versi 3 membalik tepat satu kali. Batas terlalu besar membuat tekanan tidak pernah diterima.'); done(); } }));
    }));
  draw();
  area.append(dua56(kiri, kanan), msg);
}

// Misi 6: set a guess for KIPAS, LAMPU and darurat, then run the board to that moment.
function tebakRound(area, ctx, { oops, done }) {
  const v = ['v1', 'v2', 'v3'][Math.floor(ctx.rand.next() * 3)]; const bacaan = [520, 600, 680, 740, 800, 880][Math.floor(ctx.rand.next() * 6)];
  const a = 1000 + 100 * Math.floor(ctx.rand.next() * 30); const lama = [300, 800, 1600][Math.floor(ctx.rand.next() * 3)]; const pantul = v !== 'v1' && ctx.rand.next() < 0.5;
  const tanya = a + lama + 100 * (1 + Math.floor(ctx.rand.next() * 8)) + 50; const sk = { sensor: [[0, bacaan]], tombol: [{ a, b: a + lama, pantul }] };
  const S = simulasi(v, sk, tanya); const j = S.jejak[tanya]; const want = { kipas: j.kipas, lampu: j.lampu, darurat: j.darurat }; const tebak = { kipas: false, lampu: false, darurat: false };
  const msg = msg56('Atur tebakanmu, lalu tekan Jalankan.');
  const kiri = kol56(el('div', { class: 'pg56-kartu', 'data-want': JSON.stringify(want) }, el('b', null, `🃏 ${VERSI[v].nama}`), el('span', null, `sensor ${bacaan} (lembap ${lembapDari(bacaan)})`), el('span', null, `tombol ${pantul ? 'memantul' : 'rapi'} ${a}–${a + lama} ms`), el('span', null, `tanya: t = ${tanya}`)));
  const box = el('div'); kiri.append(box); fill(box, kotak56({}));
  const kanan = kol56(); let fin = false;
  const NAMA = { kipas: ['KIPAS', 'HIGH', 'LOW'], lampu: ['LAMPU', 'HIGH', 'LOW'], darurat: ['darurat', 'true', 'false'] };
  const draw = (cek = false) => fill(kanan, el('div', { class: 'pg56-tebak' }, Object.keys(tebak).map((k) => onTap(el('button', { class: `pg56-saklar ${tebak[k] ? 'on' : ''} ${cek ? (tebak[k] === want[k] ? 'benar' : 'salah') : ''}`, type: 'button', 'data-k': k }, el('small', null, NAMA[k][0]), el('b', null, tebak[k] ? NAMA[k][1] : NAMA[k][2])), () => { if (fin) return; tebak[k] = !tebak[k]; ctx.sound.tap(); draw(); }))),
    onTap(el('button', { class: 'btn primary pg56-jalan', type: 'button' }, '▶ Jalankan'), jalan));
  function jalan() {
    if (fin) return; fin = true; let t = Math.max(0, tanya - 1500);
    const tick = () => { if (!box.isConnected) return; const q = S.jejak[t]; fill(box, kotak56({ kipas: q.kipas, lampu: q.lampu, tombol: q.tombol, darurat: q.darurat, t, tidur: v === 'v1' && t % 1000 !== 0 })); if (t < tanya) { t = Math.min(tanya, t + 50); setTimeout(tick, 30); return; }
      const ok = Object.keys(want).every((k) => tebak[k] === want[k]); draw(true);
      if (!ok) { fin = false; oops(); say(msg, 'bad', 'Ada tebakan yang meleset (merah). Pikirkan lagi, ubah, lalu jalankan ulang.'); return; }
      say(msg, '', `Tebakan tepat pada t = ${tanya}! Menebak keluaran papan dari kode adalah cara menguji pemahamanmu sebelum alatnya dirakit.`); done(); };
    tick();
  }
  draw();
  area.append(dua56(kiri, kanan), msg);
}

// Misi Bos: Rudi's debounce, then the four-digit meter that rolls over.
function bosRound56(area, ctx, { oops, done }) {
  const msg = msg56('Cara Rudi: terima perubahan LOW ke HIGH bila sudah lebih dari 50 ms sejak tekanan terakhir diterima.');
  const U = simulasi('rudi', SK_PANTUL, 1000); const kiri = kol56(); const kanan = kol56();
  fill(kiri, kodeMk(['if (b == HIGH && bacaanTerakhir == LOW', '    && sekarang - waktuDiterima > 50) {', '  darurat = !darurat;', '  waktuDiterima = sekarang;', '}', 'bacaanTerakhir = b;']), pantulView());
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['Rudi membalik pada t = 100 dan ', '_'], ['darurat akhirnya ', '_']]), chips: ['401', '157', '106', 'false', 'true'], want: [String(U.balik[1]), String(U.P.darurat)],
    hints: ['Pantulan saat dilepas (400 LOW, 401 HIGH) jauh lebih dari 50 ms setelah 100.', 'Dua kali dibalik: kembali ke false.'], done: meteran }));
  function meteran() {
    say(msg, 'info', 'Penghitung waktu juga bisa kembali ke nol. Di meteran empat angka, waktuKedip = 9800. Putar meterannya dan amati kedua cara.');
    let s = 9800; const wk = 9800; let n = 0; const angka = el('div', { class: 'pg56-meteran' }); const lampu = el('div', { class: 'pg56-cara' });
    const draw = () => { angka.textContent = String(s).padStart(4, '0'); fill(lampu, [['A', 'sekarang - waktuKedip >= 500', caraPertama(s, wk)], ['B', 'sekarang >= waktuKedip + 500', caraKedua(s, wk)]].map(([k, t, ok]) => onTap(el('button', { class: `pg56-cara-btn ${ok ? 'ya' : ''}`, type: 'button', 'data-k': k }, el('code', null, t), el('b', null, ok ? 'berganti' : 'belum')), () => pilih(k)))); };
    const putar = onTap(el('button', { class: 'btn pg56-putar', type: 'button' }, '⏩ +100 ms'), () => { s = (s + 100) % 10000; n++; ctx.sound.tap(); draw(); });
    fill(kiri, angka, putar, el('small', { class: 'pg56-ket' }, 'Lampu seharusnya berganti saat 500 ms sudah lewat, yaitu mulai 0300.')); fill(kanan, lampu, el('small', { class: 'pg56-ket' }, 'Putar meteran, lalu ketuk cara yang selalu benar.'));
    function pilih(k) {
      if (n >= 2) {
        if (k !== 'A') { oops(); say(msg, 'bad', 'Cara B sudah "berganti" pada 9800, 9900, dan 0000, padahal 500 ms belum lewat: waktuKedip + 500 terpotong menjadi 0300.'); return; }
        ctx.sound.good(); say(msg, 'info', 'Cara A selalu benar karena selisihnya ikut berputar. millis() juga kembali ke 0. Setelah berapa lama?');
        fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['millis() kembali ke 0 setelah 2³² ms ≈ ', '_', ' hari']]), chips: ['49,71', '4,97', '497'], want: ['49,71'], hints: ['2³² = 4.294.967.296 ms. Bagi dengan 86.400.000 ms per hari.'],
          done: () => { say(msg, '', 'Alat pengering bekerja berbulan-bulan, jadi pakai selalu sekarang - waktuKedip >= 500. Si Penidur dan Si Tombol Memantul kalah!'); done(); } }));
        return;
      }
      say(msg, 'info', 'Putar meteran beberapa kali dulu, lalu bandingkan kedua lampu.');
    }
    draw();
  }
  area.append(dua56(kiri, kanan), msg);
}

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
    const wrap = el('div', { class: 'act mikrokontroler pg56-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pg56-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, siapa, ulah] = HEAD56[k]; foe = el('div', { class: 'pg56-musuh' }, el('b', null, siapa), el('span', null, ulah)); wrap.append(el('div', { class: 'pg56-kepala' }, misiHead(no, judul, tujuan, '🌾'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Gabah aman ✓'; next(ms); } });
      if (r === 0) { go('bangun', 1); bangunRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('sensor', 2); sensorRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('batas', 2); batasRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('tidur', 3); tidurRound(area, ctx, fin(6500)); }
      else if (r === 4) { go('tekan', 3); tekanRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('millis', 4); millisRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('dodi', 4); dodiRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('lambat', 5); lambatRound(area, ctx, fin(6500)); }
      else if (r === 8) { go('tebak', 6); tebakRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound56(area, ctx, fin(7000)); }
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
