// k-Tetangga Terdekat dalam Kode — SMA/SMK (16–18 tahun), coding. Pak Darman's
// twelve mangoes as training data, jarak/tetangga/tebak in Python, the trace for
// Q, why weight in grams swamps hardness, scaling by ÷50, Rudi forgetting to
// scale the new mango, and how k changes the vote. Distances are squared for
// ranking, the sort is stable, and a tied vote goes to the first-inserted label.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyTracer, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, tileSlots, layar, play } from './misi-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const DATA = [[240, 2, 'matang'], [290, 3, 'matang'], [310, 2, 'matang'], [360, 4, 'matang'], [400, 3, 'matang'], [330, 6, 'matang'], [220, 8, 'belum'], [260, 7, 'belum'], [350, 9, 'belum'], [380, 7, 'belum'], [420, 8, 'belum'], [280, 9, 'belum']];
export const NAMA = DATA.map((_, i) => `M${i + 1}`);
export const Q = [300, 8]; export const P = [325, 7];
export const KODE1 = ['import math', 'data = [', '    (240, 2, "matang"), (290, 3, "matang"), (310, 2, "matang"),', '    (360, 4, "matang"), (400, 3, "matang"), (330, 6, "matang"),', '    (220, 8, "belum"), (260, 7, "belum"), (350, 9, "belum"),', '    (380, 7, "belum"), (420, 8, "belum"), (280, 9, "belum"),', ']', 'def jarak(a, b):', '    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)', 'def tetangga(data, x, k):', '    urut = sorted(data, key=lambda d: jarak(d, x))', '    return urut[:k]', 'def tebak(data, x, k):', '    suara = {}', '    for d in tetangga(data, x, k):', '        label = d[2]', '        suara[label] = suara.get(label, 0) + 1', '    return max(suara, key=suara.get)', 'q = (300, 8)', 'print(tebak(data, q, 1), tebak(data, q, 3))'];
export const KOSONG = { 9: ['(a[1] - b[1]) ** 2', '    return math.sqrt((a[0] - b[0]) ** 2 + ..............................)'], 12: ['urut[:k]', '    return ..............................'], 17: ['suara.get(label, 0) + 1', '        suara[label] = ..............................'] };
export const KODE2 = ['def skala(data):', '    hasil = []', '    for (b, keras, label) in data:', '        hasil.append((b / 50, keras, label))', '    return hasil', 'data2 = skala(data)', 'q2 = (300 / 50, 8)', 'p2 = (325 / 50, 7)', 'print(tebak(data2, q2, 1), tebak(data2, q2, 3))'];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// The model in JS, operation for operation as lines 8–18.
export const skala = (d) => d.map(([b, k, l]) => [b / 50, k, l]);
export const jarak2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
export function urutkan(data, x) { return data.map((d, i) => ({ d, i, j: Math.sqrt(jarak2(d, x)), j2: jarak2(d, x) })).sort((u, v) => u.j - v.j); }
export function tebak(data, x, k) {
  const tet = urutkan(data, x).slice(0, k); const suara = new Map(); const jejak = [];
  for (const t of tet) { suara.set(t.d[2], (suara.get(t.d[2]) || 0) + 1); jejak.push({ nama: NAMA[t.i], label: t.d[2], suara: new Map(suara) }); }
  let best = null; for (const [l, v] of suara) if (best === null || v > suara.get(best)) best = l;
  return { hasil: best, tet, suara, jejak, seri: [...suara.values()].filter((v) => v === suara.get(best)).length > 1 };
}
const suaraText = (m) => `{${[...m].map(([k, v]) => `'${k}': ${v}`).join(', ')}}`;
const namaList = (tet) => tet.map((t) => NAMA[t.i]).join(', ');
const dec = (x, d = 2) => fmtNum(Math.round(x * 10 ** d) / 10 ** d, d);

// Scatter plot of the data with optional new mango, neighbour lines and labels.
export function bidang({ x = null, k = 0, mode = 'gram', tet = null, onPick = null, cls = '' } = {}) {
  const sc = mode !== 'gram'; const xs = sc ? [4, 8.8] : [200, 440]; const W = 100; const H = 62;
  const px = (b) => 6 + ((b - xs[0]) / (xs[1] - xs[0])) * (W - 10); const py = (h) => H - 6 - (h / 10) * (H - 12);
  const D = sc ? skala(DATA) : DATA; const xv = x ? (mode === 'lupa' ? x : sc ? [x[0] / 50, x[1]] : x) : null;
  const near = tet || (xv && k ? urutkan(D, xv).slice(0, k) : []);
  const xpos = xv ? [Math.min(px(xv[0]), W - 2), py(xv[1])] : null; const off = xv && px(xv[0]) > W - 2;
  const grid = []; for (let b = xs[0]; b <= xs[1] + 1e-9; b += sc ? 0.4 : 20) grid.push(`<line class="g" x1="${px(b)}" y1="${py(0)}" x2="${px(b)}" y2="${py(10)}"/>`); for (let h = 0; h <= 10; h++) grid.push(`<line class="g" x1="${px(xs[0])}" y1="${py(h)}" x2="${px(xs[1])}" y2="${py(h)}"/>`);
  const ticks = []; for (let b = xs[0]; b <= xs[1] + 1e-9; b += sc ? 0.8 : 40) ticks.push(`<text x="${px(b)}" y="${H - 1.5}" class="t">${sc ? fmtNum(Math.round(b * 10) / 10, 1) : b}</text>`); for (let h = 0; h <= 10; h += 2) ticks.push(`<text x="3" y="${py(h) + 1}" class="t">${h}</text>`);
  const lines = xpos ? near.map((t) => `<line class="tet" x1="${xpos[0]}" y1="${xpos[1]}" x2="${px(t.d[0])}" y2="${py(t.d[1])}"/>`) : [];
  const svg = el('div', { class: 'mg-svg' }); svg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid.join('')}${lines.join('')}${ticks.join('')}</svg>`;
  const titik = D.map((d, i) => el('span', { class: `mg-titik ${d[2]} ${near.some((t) => t.i === i) ? 'dekat' : ''}`, style: { left: `${px(d[0])}%`, top: `${(py(d[1]) / H) * 100}%` } }, el('b', null, NAMA[i]), near.some((t) => t.i === i) && xv ? el('small', null, dec(jarak2(d, xv))) : null));
  const bintang = xpos ? el('span', { class: `mg-bintang ${off ? 'luar' : ''}`, style: { left: `${xpos[0]}%`, top: `${(xpos[1] / H) * 100}%` } }, off ? `★ (${xv[0]}, ${xv[1]}) →` : '★') : null;
  const box = el('div', { class: `mg-bidang ${cls}` }, svg, ...titik, bintang, el('small', { class: 'mg-sumbu x' }, sc ? 'berat ÷ 50' : 'berat (gram)'), el('small', { class: 'mg-sumbu y' }, 'kekerasan'));
  if (onPick) box.addEventListener('pointerdown', (e) => { const r = box.getBoundingClientRect(); const fx = ((e.clientX - r.left) / r.width) * W; const fy = ((e.clientY - r.top) / r.height) * H; let b = xs[0] + ((fx - 6) / (W - 10)) * (xs[1] - xs[0]); if (sc) b *= 50; const h = ((H - 6 - fy) / (H - 12)) * 10; onPick([Math.min(420, Math.max(220, Math.round(b / 5) * 5)), Math.min(10, Math.max(1, Math.round(h)))]); });
  return box;
}
const legenda = () => el('p', { class: 'mg-legenda' }, el('span', { class: 'mg-titik matang inline' }, '●'), ' matang  ', el('span', { class: 'mg-titik belum inline' }, '○'), ' belum  ★ mangga baru');

// ---- Permainan: Sidang Tetangga ----
// Every new mango is judged by the nearest sample mangoes, and the verdict is
// the majority vote. Si Gram Raksasa (weight in grams) swamps the distance,
// and Mangga Penyamar (M6) fools k = 1.
const HEAD48 = {
  peta: ['Peta Kebun', 'Tebak Q dan P dari gambar, temukan fitur pembeda, lalu tunjuk Mangga Penyamar.', 'Lihat beratku, ratusan gram!'],
  rakit: ['Rakit Mesin Tebak', 'Seret kartu ke bagian kosong jarak, tetangga, dan tebak.', 'Mesinmu pasti macet!'],
  sidang: ['Sidang Pertama untuk Q', 'Ukur jarak, dudukkan tiga tetangga terdekat, lalu ketuk putusannya.', 'Jarak ini milikku!'],
  jinak: ['Jinakkan Si Gram Raksasa', 'Bagi berat dengan 50, lalu ketuk tiga tetangga terdekat Q.', 'Jangan kecilkan aku!'],
  rudi: ['Rudi Lupa Menskalakan', 'Ketuk tetangga mangga baru Rudi, lalu perbaiki kodenya.', 'Mangga baru tetap pakai gram, hehe.'],
  k: ['Berapa Tetangga yang Didengar?', 'Adili P dengan k = 1, 3, 5, dan 7.', 'Aku M6, matang tapi agak keras…'],
  suara: ['Kotak Suara', 'Jatuhkan token setiap tetangga ke kotak suara, lalu ketuk putusan Hakim.', 'Kuncinya belum ada di dictionary!'],
  seri: ['Suara Seri', 'k = 2: dua tetangga, dua label. Siapa yang menang?', 'Seri! Hakim pasti bingung.'],
  duel: ['Duel Tebak k', 'Mangga baru (340, 5): tebak putusan sebelum layar menghitung.', 'Tebakanmu pasti meleset!'],
  bos: ['Ujian Tinggal Satu', 'Susun uji_tinggal_satu, lalu uji setiap mangga tanpa dirinya sendiri.', 'Ujiannya kubuat curang!'],
};
const msg48 = (t) => el('p', { class: 'reveal info' }, t);
const D2_48 = skala(DATA); const Q2 = [6, 8]; const P2 = [6.5, 7];

// The orchard field from bidang(), with tappable mangoes and optional marks.
function kebun({ x = null, mode = 'gram', pilih = [], tanda = {}, onTap: tap = null, k = 0 } = {}) {
  const D = mode === 'gram' ? DATA : D2_48;
  const box = bidang({ x, mode, k, tet: pilih.length || !k ? pilih.map((i) => ({ i, d: D[i] })) : null, cls: 'sn48-bidang' });
  box.querySelectorAll('.mg-titik').forEach((t, i) => { t.dataset.m = String(i); if (tanda[i]) t.classList.add(tanda[i]); if (tap) { t.classList.add('ketuk'); onTap(t, () => tap(i)); } });
  return box;
}
const palu = (opts, fn, want = '') => el('div', { class: 'sn48-tombol', 'data-want': want }, opts.map(([v, t]) => onTap(el('button', { type: 'button', class: 'sn48-pilih', 'data-v': v }, t), () => fn(v))));
const PUTUSAN = [['matang', '🔨 matang'], ['belum', '🔨 belum']];

// Cards dropped into named boxes; cards are [text, boxId or null, hint].
function sortBoard48(ctx, { oops, msg, bins, cards, done }) {
  let left = cards.filter((c) => c[1]).length;
  const binEls = bins.map(([id, lab]) => el('div', { class: 'sn48-kursi', 'data-drop': id }, el('b', null, lab), el('div', { class: 'sn48-isi' })));
  const tray = el('div', { class: 'sn48-baki' }, ctx.rand.shuffle(cards.map((c, i) => el('div', { class: 'sn48-kartu', 'data-drag': String(i) }, c[0]))));
  const host = el('div', { class: 'sn48-kolom' }, el('div', { class: 'sn48-kursi-kursi' }, binEls), tray);
  dnd(host, (chip, bin) => {
    if (!bin.classList.contains('sn48-kursi') || chip.classList.contains('locked')) return; const c = cards[+chip.dataset.drag];
    if (c[1] !== bin.dataset.drop) { oops(); shake(chip); say(msg, 'bad', c[2]); return; }
    chip.classList.add('locked'); bin.lastChild.append(chip); ctx.sound.tap(); left--;
    if (left) { say(msg, 'info', 'Tepat.'); return; }
    tray.remove(); done();
  });
  return host;
}

// Misi 1: the orchard map.
function petaRound(area, ctx, { oops, done }) {
  const msg = msg48('Lihat gambarnya saja. Q tampak matang atau belum?'); const box = el('div', { class: 'sn48-kolom' }); const kanan = el('div', { class: 'sn48-kolom' });
  let fase = 'Q';
  const draw = () => fill(box, el('div', { class: 'sn48-dua' }, el('div', { class: 'sn48-kolom' }, kebun({ x: fase === 'P' ? P : fase === 'Q' ? Q : null, onTap: fase === 'M6' ? tunjuk : null }), legenda()), kanan));
  const tebakan = () => fill(kanan, el('code', { class: 'sn48-bintang' }, fase === 'Q' ? '★ Q = (300, 8)' : '★ P = (325, 7)'), palu(PUTUSAN, jawab, 'belum'));
  function jawab(v) {
    if (v !== 'belum') { oops(); say(msg, 'bad', fase === 'Q' ? 'Q ada di tengah kelompok ○ di bagian atas.' : 'P dekat M6 yang matang, tetapi lebih banyak tetangga ○ di sekitarnya.'); return; }
    ctx.sound.tap();
    if (fase === 'Q') { fase = 'P'; draw(); tebakan(); say(msg, 'info', 'Belum. Sekarang P: ragu, tetapi cenderung apa?'); return; }
    fase = 'fitur'; draw(); say(msg, 'info', 'Belum, walaupun ragu. Fitur mana yang memisahkan kedua kelompok?');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['fitur pembeda: ', '_'], ['matang: kekerasan ', '_'], ['belum: kekerasan ', '_']]), chips: ['kekerasan', 'berat', '2–6', '7–9', '220–420'], want: ['kekerasan', '2–6', '7–9'],
      hints: ['Berat kedua kelompok sama-sama tersebar dari kiri ke kanan.', 'Lihat ketinggian titik ●.', 'Lihat ketinggian titik ○.'], done: () => { fase = 'M6'; draw(); fill(kanan, el('b', { class: 'sn48-cari' }, '🕵️ Ketuk Mangga Penyamar')); say(msg, 'info', 'Satu mangga matang berada paling dekat dengan kelompok belum. Ketuk dia!'); } }));
  }
  function tunjuk(i) {
    if (fase !== 'M6') return;
    if (i !== 5) { oops(); say(msg, 'bad', 'Cari titik ● yang kekerasannya paling tinggi.'); return; }
    fase = 'beres'; ctx.sound.tap(); say(msg, '', 'M6 (330 gram, kekerasan 6): matang tetapi agak keras. Mangga Penyamar ini akan mengecoh sidang nanti.'); done();
  }
  draw(); tebakan();
  area.append(box, msg);
}

// Misi 2: assemble jarak, tetangga, tebak.
function rakitRound(area, ctx, { oops, done }) {
  const msg = msg48('Juru Ukur dan Juru Urut dulu: lengkapi jarak dan tetangga.'); const box = el('div', { class: 'sn48-kolom' }); const out = layar();
  const tahapB = () => { say(msg, 'info', 'Sekarang Juru Suara: lengkapi tebak.');
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['def tebak(data, x, k):', '  suara = {}', '  for d in tetangga(data, x, k):', '    label = d[2]', '    suara[label] = (', ['      ', '_', ')'], '  return max(suara, key=suara.get)'], { labels: ['13', '14', '15', '16', '17', '', '18'] }),
      chips: ['suara.get(label, 0) + 1', 'suara[label] + 1', '1'], want: ['suara.get(label, 0) + 1'], hints: ['Label yang belum pernah muncul belum punya kunci: pakai get dengan nilai awal 0.'],
      done: () => { say(msg, 'info', 'Mesin dirakit. Sidang untuk q = (300, 8)…'); box.append(codeView(['q = (300, 8)', 'print(tebak(data, q, 1), tebak(data, q, 3))'], { labels: ['19', '20'] }), out);
        play(out, runPy(KODE1).out, { end: () => { say(msg, '', 'Keluarannya matang matang, padahal Q tampak belum! Sidang berikutnya akan membongkar sebabnya.'); done(); } }); } })); };
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['def jarak(a, b):', '  return math.sqrt(', '    (a[0] - b[0]) ** 2', ['    + ', '_', ')'], 'def tetangga(data, x, k):', '  urut = sorted(data,', '    key=lambda d: jarak(d, x))', ['  return ', '_']], { labels: ['8', '9', '', '', '10', '11', '', '12'] }),
    chips: ['(a[1] - b[1]) ** 2', '(a[1] - b[0]) ** 2', 'a[1] - b[1]', 'urut[:k]', 'urut[k]', 'data[:k]'], want: ['(a[1] - b[1]) ** 2', 'urut[:k]'],
    hints: ['Fitur kedua (kekerasan) ada di indeks 1, dan selisihnya dikuadratkan.', 'Ambil k contoh pertama dari list yang sudah diurutkan.'], done: () => setTimeout(tahapB, 800) }));
  area.append(box, msg);
}

// Misi 2b: the first trial for Q, without scaling.
function sidangRound(area, ctx, { oops, done }) {
  const msg = msg48('Juru Ukur: hitung kuadrat jarak M2 ke Q.'); const box = el('div', { class: 'sn48-kolom' });
  const U = urutkan(DATA, Q); const T = tebak(DATA, Q, 3);
  const putus = () => { say(msg, 'info', `Tiga tetangga duduk: ${namaList(T.tet)}. Hakim, ketuk putusannya!`);
    box.append(palu(PUTUSAN, (v) => { if (v !== T.hasil) { oops(); say(msg, 'bad', `Hitung suaranya: ${T.tet.map((t) => `${NAMA[t.i]} ${t.d[2]}`).join(', ')}.`); return; }
      ctx.sound.tap(); box.lastChild.remove(); say(msg, '', `Putusan ${T.hasil}, padahal Q tampak belum! Selisih berat ratusan gram menenggelamkan selisih kekerasan.`); done(); }, T.hasil)); };
  const bangku = () => { say(msg, 'info', 'Juru Urut: dudukkan tiga mangga dengan kuadrat jarak terkecil.');
    fill(box, sortBoard48(ctx, { oops, msg, bins: [['k1', '🥇 terdekat'], ['k2', '🥈 kedua'], ['k3', '🥉 ketiga']],
      cards: U.map((t, p) => [`${NAMA[t.i]} · ${fmtNum(t.j2)}`, p < 3 ? `k${p + 1}` : null, p < 3 ? 'Urutkan dari yang terkecil.' : 'Masih ada yang lebih dekat: cari kuadrat jarak terkecil.']), done: putus })); };
  fill(box, codeView(['kuadrat jarak = (berat − 300)² + (kekerasan − 8)²'], { labels: [''] }), fillBoard(ctx, { oops, msg, view: rowsView([['M2: (290 − 300)² + (3 − 8)²'], ['= ', '_', ' + ', '_', ' = ', '_']]), chips: ['100', '25', '125', '10', '5', '105'], want: ['100', '25', '125'],
    hints: ['(−10)² = 100.', '(−5)² = 25.', '100 + 25.'], done: () => setTimeout(bangku, 800) }));
  area.append(box, msg);
}

// Tap neighbours in order on a field; ends with onEnd().
function tetanggaTap(ctx, { oops, msg, host, x, mode, urut, n, draw, onEnd }) {
  const pilih = [];
  const tap = (i) => {
    if (pilih.length >= n) return;
    if (i !== urut[pilih.length].i) { oops(); say(msg, 'bad', pilih.includes(i) ? 'Sudah dipilih.' : 'Ada mangga lain yang lebih dekat ke ★.'); return; }
    pilih.push(i); ctx.sound.tap(); render();
    if (pilih.length < n) { say(msg, 'info', `${NAMA[i]}: ${dec(urut[pilih.length - 1].j2)}. Berikutnya?`); return; }
    onEnd(pilih);
  };
  const render = () => draw(kebun({ x, mode, pilih, onTap: pilih.length < n ? tap : null }));
  render();
}

// Misi 3: tame the giant gram.
function jinakRound(area, ctx, { oops, done }) {
  const msg = msg48('Bagi berat mangga baru dengan 50, sama seperti data latih.'); const box = el('div', { class: 'sn48-kolom' }); const out = layar();
  const fieldBox = el('div', { class: 'sn48-kolom' }); const kanan = el('div', { class: 'sn48-kolom' });
  fill(fieldBox, kebun({ x: Q }));
  const tap3 = () => { say(msg, 'info', 'Si Gram Raksasa jinak. Ketuk tiga tetangga terdekat Q, mulai dari yang paling dekat.');
    tetanggaTap(ctx, { oops, msg, x: Q, mode: 'skala', urut: urutkan(D2_48, Q2), n: 3, draw: (f) => fill(fieldBox, f), onEnd: () => {
      say(msg, 'info', 'Tiga tetangga, semuanya belum. Jalankan kodenya.'); fill(kanan, codeView(['data2 = skala(data)', 'q2 = (300 / 50, 8)', 'print(tebak(data2, q2, 1),', '      tebak(data2, q2, 3))'], { labels: ['26', '27', '29', ''] }), out);
      play(out, runPy([...KODE1.slice(0, 18), ...KODE2]).out, { end: () => { say(msg, '', 'belum belum: sekarang putusan kode sama dengan mata. Selisih 50 gram setara selisih kekerasan 1.'); done(); } }); } }); };
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['q2 = (300 / 50, 8) = (', '_', ', 8)'], ['p2 = (325 / 50, 7) = (', '_', ', 7)']]), chips: ['6.0', '6.5', '300', '7.0'], want: ['6.0', '6.5'], hints: ['300 ÷ 50.', '325 ÷ 50.'],
    done: () => { say(msg, 'info', 'Tarik tuas skala!'); kanan.append(onTap(el('button', { type: 'button', class: 'sn48-pilih sn48-tuas', 'data-v': 'skala' }, '⚖️ berat ÷ 50'), (e) => { const b = kanan.querySelector('.sn48-tuas'); if (!b) return; b.remove(); ctx.sound.good(); fill(kanan); tap3(); })); } }));
  fill(box, el('div', { class: 'sn48-dua' }, fieldBox, kanan));
  area.append(box, msg);
}

// Misi 3b: Rudi forgets to scale the new mango.
function rudiRound(area, ctx, { oops, done }) {
  const msg = msg48('Mangga baru Rudi sama persis dengan M1, tetapi beratnya tidak dibagi 50. ★ terlempar ke kanan!'); const box = el('div', { class: 'sn48-kolom' });
  const fieldBox = el('div', { class: 'sn48-kolom' }); const kanan = el('div', { class: 'sn48-kolom' }); const T = tebak(D2_48, [240, 2], 1); const B = tebak(D2_48, [240 / 50, 2], 1);
  fill(kanan, codeView(['data2 = skala(data)', 'q = (240, 2)', 'print(tebak(data2, q, 1))'], { warn: [1] }));
  tetanggaTap(ctx, { oops, msg, x: [240, 2], mode: 'lupa', urut: urutkan(D2_48, [240, 2]), n: 3, draw: (f) => fill(fieldBox, f), onEnd: (p) => {
    say(msg, 'info', `Tetangganya ${p.map((i) => NAMA[i]).join(', ')}: yang beratnya paling besar. Putusannya?`);
    kanan.append(palu(PUTUSAN, (v) => { if (!kanan.querySelector('.sn48-tombol')) return; if (v !== T.hasil) { oops(); say(msg, 'bad', 'Hitung label ketiga tetangga itu.'); return; } ctx.sound.tap(); kanan.querySelector('.sn48-tombol').remove();
      say(msg, 'info', `${T.hasil}, padahal sama dengan M1 yang matang! Perbaiki baris q.`);
      kanan.append(fillBoard(ctx, { oops, msg, view: codeFill([['q = (240 / ', '_', ', 2)']]), chips: ['50', '1', '2'], want: ['50'], hints: ['Olah data baru persis seperti data latih.'],
        done: () => { fill(fieldBox, kebun({ x: [240, 2], mode: 'skala', k: 1 })); say(msg, '', `Sekarang tetangganya M1 sendiri: ${B.hasil}. Uji program dengan contoh yang jawabannya sudah diketahui!`); done(); } })); }, T.hasil)); } });
  fill(box, el('div', { class: 'sn48-dua' }, fieldBox, kanan));
  area.append(box, msg);
}

// Misi 4: how many neighbours are heard.
function kRound(area, ctx, { oops, done }) {
  const msg = msg48('Ketuk putusan untuk P dengan k yang menyala.'); const box = el('div', { class: 'sn48-kolom' }); const KS = [1, 3, 5, 7]; let ki = 0; const hasil = [];
  const T11 = tebak(D2_48, P2, 11);
  const draw = () => {
    const k = KS[Math.min(ki, KS.length - 1)]; const T = tebak(D2_48, P2, k);
    fill(box, el('div', { class: 'sn48-dua' }, kebun({ x: P, mode: 'skala', k }), el('div', { class: 'sn48-kolom' }, el('div', { class: 'sn48-k' }, KS.map((x, j) => el('span', { class: j === ki ? 'aktif' : j < ki ? 'beres' : '' }, `k = ${x}`))),
      el('div', { class: 'sn48-catat' }, hasil.map((h) => el('code', null, h))), ki < KS.length ? palu(PUTUSAN, jawab, T.hasil) : null)));
  };
  function jawab(v) {
    if (ki >= KS.length) return; const k = KS[ki]; const T = tebak(D2_48, P2, k);
    if (v !== T.hasil) { oops(); say(msg, 'bad', `Hitung garis putus-putus: ${T.tet.map((t) => `${NAMA[t.i]} ${t.d[2]}`).join(', ')}.`); return; }
    const m = T.suara.get('matang') || 0; const b = T.suara.get('belum') || 0; hasil.push(`k = ${k}: ${m} lawan ${b} → ${T.hasil}`); ki++; ctx.sound.tap();
    if (ki < KS.length) { draw(); say(msg, 'info', k === 1 ? 'k = 1 hanya mendengar M6. Naikkan k.' : 'Tepat.'); return; }
    draw(); say(msg, 'info', 'Dua pertanyaan terakhir.');
    box.querySelector('.sn48-dua > .sn48-kolom:last-child').append(fillBoard(ctx, { oops, msg, view: rowsView([['k = 1 terkecoh oleh ', '_'], ['k = 11: ', '_', ' matang lawan ', '_', ' belum']]), chips: ['M6', 'M10', String(T11.suara.get('matang')), String(T11.suara.get('belum')), '4'], want: ['M6', String(T11.suara.get('matang')), String(T11.suara.get('belum'))],
      hints: ['Tetangga terdekat P yang matang.', 'Hanya satu mangga matang yang tidak ikut.', 'Hanya satu mangga belum yang tidak ikut.'], done: () => { say(msg, '', 'k = 1 mudah dikecoh satu contoh aneh. k = 3 atau 5 cukup kecil tetapi tidak terkecoh.'); done(); } }));
  }
  draw();
  area.append(box, msg);
}

// Ballot box: one token per neighbour, in order.
function kotakSuara(ctx, { oops, msg, T, onEnd }) {
  let j = 0; const suara = new Map(); const kiri = el('div', { class: 'sn48-kolom' });
  const host = el('div', { class: 'sn48-dua' }, kiri, el('div', { class: 'sn48-kolom' }, el('div', { class: 'sn48-baki' }, el('div', { class: 'sn48-token matang', 'data-drag': 'matang' }, '● matang'), el('div', { class: 'sn48-token belum', 'data-drag': 'belum' }, '○ belum')), el('div', { class: 'sn48-kotak', 'data-drop': 'kotak' }, el('b', null, '🗳️ suara'), el('code', null, '{}'))));
  const draw = () => fill(kiri, el('div', { class: 'sn48-antre' }, T.tet.map((t, k) => el('span', { class: `sn48-org ${t.d[2]} ${k === j ? 'aktif' : k < j ? 'beres' : ''}` }, `${NAMA[t.i]} · ${t.d[2]}`))));
  dnd(host, (tok, box) => {
    if (j >= T.tet.length || box.dataset.drop !== 'kotak') return; const lab = T.tet[j].d[2];
    if (tok.dataset.drag !== lab) { oops(); shake(tok); say(msg, 'bad', `${NAMA[T.tet[j].i]} berlabel ${lab}.`); return; }
    suara.set(lab, (suara.get(lab) || 0) + 1); j++; ctx.sound.tap(); box.lastChild.textContent = suaraText(suara); draw();
    if (j < T.tet.length) { say(msg, 'info', `suara = ${suaraText(suara)}`); return; }
    host.querySelector('.sn48-baki').remove(); onEnd(host);
  });
  draw();
  return host;
}

// Misi 5: the ballot box for tebak(data2, p2, 5).
function suaraRound(area, ctx, { oops, done }) {
  const msg = msg48('Seret token setiap tetangga ke kotak suara, berurutan dari yang terdekat.'); const box = el('div', { class: 'sn48-kolom' }); const T = tebak(D2_48, P2, 5);
  const ke = runPy([...KODE1.slice(0, 16), '        suara[label] = suara[label] + 1', ...KODE1.slice(17, 18), ...KODE2.slice(0, 8), 'x = tebak(data2, p2, 5)']).error; const KE = `${ke.type}: ${ke.message}`;
  fill(box, codeView(['tebak(data2, p2, 5)'], { labels: [''] }), kotakSuara(ctx, { oops, msg, T, onEnd: (host) => { say(msg, 'info', 'Kotak penuh. Hakim, max(suara, key=suara.get)?');
    host.lastChild.append(palu(PUTUSAN, (v) => { const p = host.querySelector('.sn48-tombol'); if (!p) return; if (v !== T.hasil) { oops(); say(msg, 'bad', 'max memilih kunci dengan suara terbanyak.'); return; } ctx.sound.tap(); p.remove();
      say(msg, 'info', `${T.hasil}. Bagaimana kalau baris 17 ditulis suara[label] = suara[label] + 1?`);
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['putaran pertama berhenti dengan ', '_']]), chips: [KE, "KeyError: 'belum'", 'ValueError'], want: [KE], hints: ['Dictionary masih kosong saat tetangga pertama (M6, matang) datang.'],
        done: () => { say(msg, '', 'get(label, 0) memberi 0 untuk label baru, jadi suara pertamanya tercatat 1.'); done(); } })); }, T.hasil)); } }));
  area.append(box, msg);
}

// Misi 5b: a tie at k = 2.
function seriRound(area, ctx, { oops, done }) {
  const msg = msg48('k = 2 untuk p2. Jatuhkan dua token ke kotak suara.'); const box = el('div', { class: 'sn48-kolom' }); const T = tebak(D2_48, P2, 2); const T12 = tebak(D2_48, P2, 12);
  fill(box, codeView(['tebak(data2, p2, 2)'], { labels: [''] }), kotakSuara(ctx, { oops, msg, T, onEnd: (host) => { say(msg, 'info', 'Seri! max mengembalikan kunci mana?');
    host.lastChild.append(palu(PUTUSAN, (v) => { const p = host.querySelector('.sn48-tombol'); if (!p) return; if (v !== T.hasil) { oops(); say(msg, 'bad', 'Saat seri, max memilih kunci pertama yang dimasukkan ke dictionary: label tetangga terdekat.'); return; } ctx.sound.tap(); p.remove();
      say(msg, 'info', `${T.hasil}: kunci pertama. Lalu k = 12, semua mangga ikut bersuara…`);
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['k = 12: selalu ', '_', ' lawan ', '_'], ['jadi hasilnya sama dengan k = ', '_']]), chips: [String(T12.suara.get('matang')), String(T12.suara.get('belum')), '1', '12', '5'], want: [String(T12.suara.get('matang')), String(T12.suara.get('belum')), '1'],
        hints: ['Ada 6 mangga matang di data.', 'Ada 6 mangga belum di data.', 'Saat seri, label tetangga terdekat yang menang.'], done: () => { say(msg, '', 'k besar tidak otomatis lebih baik. Pilih k ganjil yang cukup kecil.'); done(); } })); }, T.hasil)); } }));
  area.append(box, msg);
}

// Misi 6: duel, predict before the screen counts.
function duelRound(area, ctx, { oops, done }) {
  const msg = msg48('Tim lain menaruh mangga baru (340, 5). Skalakan dulu.'); const box = el('div', { class: 'sn48-kolom' }); const X = [340, 5]; const KS = [1, 3, 5]; let ki = 0; const U = urutkan(D2_48, [6.8, 5]);
  const fieldBox = el('div', { class: 'sn48-kolom' }); const kanan = el('div', { class: 'sn48-kolom' });
  const tanya = () => { const k = KS[ki]; const T = tebak(D2_48, [6.8, 5], k); fill(fieldBox, kebun({ x: X, mode: 'skala', k: ki ? KS[ki - 1] : 0 }));
    fill(kanan, el('div', { class: 'sn48-k' }, KS.map((x, j) => el('span', { class: j === ki ? 'aktif' : j < ki ? 'beres' : '' }, `k = ${x}`))), palu(PUTUSAN, (v) => {
      if (v !== T.hasil) { oops(); say(msg, 'bad', `Bayangkan ${k} mangga terdekat dari ★.`); fill(fieldBox, kebun({ x: X, mode: 'skala', k })); return; }
      ctx.sound.tap(); ki++; fill(fieldBox, kebun({ x: X, mode: 'skala', k }));
      if (ki < KS.length) { say(msg, 'info', `k = ${k}: ${T.hasil}. Tebak k = ${KS[ki]}.`); setTimeout(tanya, 900); return; }
      say(msg, 'info', 'Tiga tebakan tepat! Siapa tetangga terdekatnya?'); fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['terdekat: ', '_', ', kuadrat jarak ', '_']]), chips: [NAMA[U[0].i], NAMA[U[1].i], dec(U[0].j2), dec(U[1].j2)], want: [NAMA[U[0].i], dec(U[0].j2)],
        hints: ['Lihat angka di titik yang paling dekat.', '(6,6 − 6,8)² + (6 − 5)².'], done: () => { say(msg, '', 'Matang untuk k = 1, 3, dan 5: tebakan sebelum menghitung melatih intuisi jarak.'); done(); } })); }, T.hasil)); };
  fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['(340, 5) → (', '_', ', 5)']]), chips: ['6.8', '340', '6.5'], want: ['6.8'], hints: ['340 ÷ 50.'], done: () => { say(msg, 'info', 'Tebak putusannya sebelum garis muncul.'); tanya(); } }));
  fill(fieldBox, kebun({ x: X, mode: 'skala' }));
  fill(box, el('div', { class: 'sn48-dua' }, fieldBox, kanan));
  area.append(box, msg);
}

// Misi Bos: leave-one-out test.
export const LOO48 = (data, k) => data.filter((d, i) => tebak(data.filter((_, j) => j !== i), d, k).hasil === d[2]).length;
function bosRound(area, ctx, { oops, done }) {
  const msg = msg48('Ujian jujur: mangga yang diuji harus keluar dulu dari data latih.'); const box = el('div', { class: 'sn48-kolom' });
  const hasil = D2_48.map((d, i) => tebak(D2_48.filter((_, j) => j !== i), d, 1).hasil === d[2]); const tanda = {}; let n = 0;
  const benar = hasil.filter(Boolean).length; const salah = NAMA[hasil.indexOf(false)]; const mentah = LOO48(DATA, 1);
  const fieldBox = el('div', { class: 'sn48-kolom' }); const kanan = el('div', { class: 'sn48-kolom' });
  const uji = (i) => { if (tanda[i]) return; tanda[i] = hasil[i] ? 'lulus' : 'gagal'; n++; ctx.sound.tap(); fill(fieldBox, kebun({ mode: 'skala', tanda, onTap: n < 12 ? uji : null }));
    say(msg, 'info', hasil[i] ? `${NAMA[i]} keluar, tetangga terdekatnya menebak benar. (${n}/12)` : `${NAMA[i]} keluar… tebakannya salah! (${n}/12)`);
    if (n < 12) return;
    say(msg, 'info', 'Semua diuji. Catat hasilnya.');
    fill(kanan, fillBoard(ctx, { oops, msg, view: rowsView([['dengan skala, k = 1: ', '_', ' dari 12'], ['yang salah: ', '_'], ['tanpa skala, k = 1: ', '_', ' dari 12']]), chips: [String(benar), '12', salah, 'M2', String(mentah), '6'], want: [String(benar), salah, String(mentah)],
      hints: ['Hitung titik yang lulus.', 'Mangga Penyamar.', 'Si Gram Raksasa membuat model lebih buruk daripada menebak asal.'], done: () => { say(msg, '', `Tanpa mengeluarkan mangga uji, k = 1 tampak 12 dari 12: setiap mangga menjadi tetangga dirinya sendiri. Sidang adil!`); done(); } })); };
  fill(kanan, tileSlots(ctx, { oops, msg, build: ['def uji_tinggal_satu(data, k):', '  benar = 0', '  for i in range(len(data)):', ['l', 2], ['t', 2], ['b', 3], '  return benar'],
    tiles: [['l', 'latih = data[:i] + data[i + 1:]'], ['t', 'if tebak(latih, data[i], k) == data[i][2]:'], ['b', 'benar = benar + 1'], ['x', 'latih = data', 'Mangga yang diuji harus dikeluarkan dulu.'], ['y', 'if tebak(data, data[i], k) == data[i][2]:', 'Dengan data, mangga itu menjadi tetangga dirinya sendiri.']],
    onFull: () => { say(msg, 'info', 'Ketuk setiap mangga untuk mengujinya dengan 11 mangga lainnya (data2, k = 1).'); fill(fieldBox, kebun({ mode: 'skala', tanda, onTap: uji })); } }));
  fill(box, el('div', { class: 'sn48-dua' }, fieldBox, kanan));
  area.append(box, msg);
}

export default {
  id: 'sma-48-knn-kode',
  title: 'k-Tetangga Terdekat dalam Kode',
  topic: 'Model KA k-tetangga terdekat dalam Python: fitur, jarak, tetangga, pemungutan suara, penyamaan skala, dan pengaruh nilai k',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🥭',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Tebak kematangan mangga dari data Pak Darman dengan k-tetangga terdekat, telusuri kodenya, lalu selidiki mengapa skala dan nilai k mengubah tebakan.',
  extraModes: [
    { id: 'bidang', icon: '📈', label: 'Bidang Data', desc: 'Taruh mangga baru, pilih k, dan nyalakan skala atau kesalahan Rudi untuk melihat tetangga terdekat berubah', create: createField },
    { id: 'telusur', icon: '🔎', label: 'Penelusur Kode', desc: 'Jalankan tetangga dan tebak baris demi baris, lengkap dengan isi urut dan suara', create: createTrace },
    { id: 'giliran', icon: '🎯', label: 'Tim Memilih k', desc: 'Satu tim memilih mangga baru dan k, tim lain menebak hasilnya sebelum layar menghitung', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act knn-kode sn48-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'sn48-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD48[k];
        foe = el('div', { class: 'sn48-musuh' }, el('b', null, k === 'k' ? '🥭 Mangga Penyamar' : '🏋️ Si Gram Raksasa'), el('span', null, ulah));
        wrap.append(el('div', { class: 'sn48-kepala' }, misiHead(no, judul, tujuan, '⚖️'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Sidang adil ✓'; next(ms); } });
      if (r === 0) { go('peta', 1); petaRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('rakit', 2); rakitRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('sidang', 2); sidangRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('jinak', 3); jinakRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('rudi', 3); rudiRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('k', 4); kRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('suara', 5); suaraRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('seri', 5); seriRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('duel', 6); duelRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

const hasilView = (T) => el('div', { class: 'mg-hasil-box' }, el('p', { class: `mg-hasil ${T.hasil}` }, `tebak → '${T.hasil}'`), el('code', null, `suara = ${suaraText(T.suara)}`), T.seri ? el('p', { class: 'mg-ket' }, 'Suara seri: max mengembalikan kunci pertama yang nilainya terbesar, yaitu label tetangga terdekat.') : null);

// Field: place a mango, pick k, switch scaling or Rudi's mistake.
function createField(root, ctx) {
  const wrap = el('div', { class: 'act knn-kode' });
  root.append(wrap);
  let x = [...P]; let k = 3; let mode = 'gram';
  const draw = () => {
    const D = mode === 'gram' ? DATA : skala(DATA); const xv = mode === 'skala' ? [x[0] / 50, x[1]] : x; const T = tebak(D, xv, k);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Mangga baru (${x[0]} g, kekerasan ${x[1]}) dengan k = ${k}`),
      el('div', { class: 'mg-atur' }, el('div', { class: 'seg' }, [['gram', 'berat dalam gram'], ['skala', 'berat ÷ 50'], ['lupa', 'lupa menskalakan mangga baru']].map(([m, t]) => onTap(el('button', { class: `seg-btn ${mode === m ? 'on' : ''}`, type: 'button' }, t), () => { mode = m; draw(); }))),
        el('div', { class: 'seg' }, [1, 3, 5, 7, 12].map((v) => onTap(el('button', { class: `seg-btn ${k === v ? 'on' : ''}`, type: 'button' }, `k = ${v}`), () => { k = v; draw(); }))),
        stepper(x[0], (v) => { x = [v, x[1]]; draw(); }, { min: 220, max: 420, step: 5, label: 'berat' }), stepper(x[1], (v) => { x = [x[0], v]; draw(); }, { min: 1, max: 10, label: 'kekerasan' })),
      el('div', { class: 'mg-dua lebar' }, el('div', null, bidang({ x, k, mode, onPick: (v) => { x = v; draw(); } }), legenda()), el('div', { class: 'mg-samping' },
        el('table', { class: 'mg-tabel' }, el('tr', null, ['#', 'Mangga', 'Kuadrat jarak', 'Label'].map((h) => el('th', null, h))), T.tet.map((t, i) => el('tr', { class: t.d[2] }, el('td', null, i + 1), el('td', null, NAMA[t.i]), el('td', null, dec(t.j2)), el('td', null, t.d[2])))),
        hasilView(T), mode === 'lupa' ? el('p', { class: 'reveal bad' }, `Data sudah dibagi 50, tetapi (${x[0]}, ${x[1]}) tidak. Yang terdekat selalu mangga terberat.`) : null)),
      el('p', { class: 'mg-ket' }, 'Sentuh bidang untuk memindahkan mangga baru.'));
  };
  draw();
}

// Code tracer for tetangga and tebak on a chosen mango and k.
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act knn-kode' });
  root.append(wrap);
  let pilih = 'p2'; let k = 5; let tr = null;
  const PIL = { q: ['q', '(300, 8)', 'data'], q2: ['q2', '(300 / 50, 8)', 'data2'], p2: ['p2', '(325 / 50, 7)', 'data2'] };
  const lines = () => [...KODE1.slice(0, 18), ...KODE2.slice(0, 6), `x = ${PIL[pilih][1]}`, `hasil = tebak(${PIL[pilih][2]}, x, ${k})`, 'print(hasil)'];
  const nm = (st, t) => { const v = st.vars; const i = (v.data2 || []).indexOf(t); const j = (v.data || []).indexOf(t); return i >= 0 ? NAMA[i] : j >= 0 ? NAMA[j] : '?'; };
  const extra = (st) => { const f = st.frames[st.frames.length - 1]; const v = f ? f.vars : {}; const urut = v.urut; const suara = v.suara;
    return el('div', { class: 'mg-ekstra' }, urut ? el('p', null, el('b', null, 'urut: '), urut.map((t) => nm(st, t)).join(', ')) : null, suara ? el('p', null, el('b', null, 'suara: '), pyRepr(suara)) : null,
      suara && suara.size > 1 && new Set(suara.values()).size === 1 ? el('p', { class: 'mg-ket' }, 'Seri: max memilih kunci pertama yang dimasukkan, yaitu label tetangga terdekat.') : null); };
  const draw = () => {
    tr?.stop?.();
    tr = pyTracer(lines(), { labels: [...lab(1, 18), ...lab(21, 6), '30', '31', '32'], cls: 'mg-kecil', hideVars: ['data', 'data2', 'math'], extra, opts: { limit: 20000 } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Penelusur: tebak(${PIL[pilih][2]}, ${PIL[pilih][0]}, ${k})`),
      el('div', { class: 'mg-atur' }, el('div', { class: 'seg' }, Object.keys(PIL).map((p) => onTap(el('button', { class: `seg-btn ${pilih === p ? 'on' : ''}`, type: 'button' }, `${PIL[p][0]} = ${PIL[p][1]}`), () => { pilih = p; draw(); }))),
        el('div', { class: 'seg' }, [1, 2, 3, 5, 12].map((v) => onTap(el('button', { class: `seg-btn ${k === v ? 'on' : ''}`, type: 'button' }, `k = ${v}`), () => { k = v; draw(); })))),
      tr);
  };
  draw();
  return () => tr?.stop?.();
}

// Team mode: one team picks a mango and k, the next guesses before the screen computes.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act knn-kode' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tim Memilih k selesai', pts, again: () => pickTeams(wrap, 'Tim Memilih k', start) }); return; }
      const boss = t % nT; let x = [300, 5]; let k = 3;
      const draw = () => wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih mangga baru dan k`),
        el('div', { class: 'mg-atur' }, stepper(x[0], (v) => { x = [v, x[1]]; draw(); }, { min: 220, max: 420, step: 10, label: 'berat' }), stepper(x[1], (v) => { x = [x[0], v]; draw(); }, { min: 1, max: 10, label: 'kekerasan' }),
          el('div', { class: 'seg' }, [1, 3, 5].map((v) => onTap(el('button', { class: `seg-btn ${k === v ? 'on' : ''}`, type: 'button' }, `k = ${v}`), () => { k = v; draw(); })))),
        el('div', null, bidang({ x, onPick: (v) => { x = [Math.round(v[0] / 10) * 10, v[1]]; draw(); } }), legenda()),
        button('Selesai ➜ giliran menebak', () => guess(boss, x, k), 'primary'));
      draw();
    }
    function guess(boss, x, k) {
      const who = (boss + 1) % nT; const T = tebak(skala(DATA), [x[0] / 50, x[1]], k); const msg = el('p', { class: 'reveal info' }, 'Tebak dulu, lalu layar menghitung dengan berat ÷ 50.');
      const draw = (pick = null) => wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tebak(data2, (${x[0]} / 50, ${x[1]}), ${k})`),
        el('div', { class: 'mg-dua lebar' }, bidang({ x, k: pick ? k : 0, mode: 'skala' }), el('div', { class: 'mg-samping' },
          pick == null ? el('div', { class: 'seg mg-pilih' }, ['matang', 'belum'].map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { const ok = o === T.hasil; if (ok) { pts[who] += 1; ctx.sound.good(); } else ctx.sound.bad(); say(msg, ok ? 'good' : 'bad', ok ? `Tepat: '${T.hasil}'. +1` : `Belum tepat: hasilnya '${T.hasil}'.`); draw(o); })))
            : el('div', { class: 'mg-samping' }, el('p', null, `Tetangga: ${T.tet.map((u) => `${NAMA[u.i]} (${dec(u.j2)}, ${u.d[2]})`).join(', ')}`), hasilView(T), button('Lanjut ➜', () => { t++; step(); }, 'primary')), msg)));
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tim Memilih k', start);
}
