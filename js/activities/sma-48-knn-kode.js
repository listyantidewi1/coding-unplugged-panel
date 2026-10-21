// k-Tetangga Terdekat dalam Kode — SMA/SMK (16–18 tahun), coding. Pak Darman's
// twelve mangoes as training data, jarak/tetangga/tebak in Python, the trace for
// Q, why weight in grams swamps hardness, scaling by ÷50, Rudi forgetting to
// scale the new mango, and how k changes the vote. Distances are squared for
// ranking, the sort is stable, and a tied vote goes to the first-inserted label.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, pyTracer, stepper, fmtNum } from './smp-kit.js';
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
const opsi = (right, pool) => [right, ...[...new Set(pool)].filter((x) => x !== right)].slice(0, 4);

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
    const wrap = el('div', { class: 'act knn-kode' });
    root.append(wrap);
    const D2 = skala(DATA); const q2 = [6, 8]; const p2 = [6.5, 7];
    const kodeKosong = KODE1.map((x, i) => (KOSONG[i + 1] ? KOSONG[i + 1][1] : x));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(el('div', { class: 'mg-dua' }, el('div', null, bidang({ x: Q }), legenda()), bidang({ x: P })));
        rowsChoose(wrap, ctx, { prompt: 'Dengan melihat gambar saja (kiri Q, kanan P)', cls: 'mg-isi', rows: [
          ['q', 'Q (300 g, kekerasan 8)', ['belum', 'matang', 'tidak bisa ditebak'], 'belum'],
          ['p', 'P (325 g, kekerasan 7)', ['belum, walaupun ragu karena dekat M6 yang matang', 'matang, pasti', 'belum, pasti'], 'belum, walaupun ragu karena dekat M6 yang matang'],
          ['f', 'Fitur yang lebih membedakan', ['kekerasan: matang 2–6, belum 7–9; berat tersebar di kedua kelompok', 'berat: mangga matang lebih ringan', 'keduanya sama kuat', 'tidak ada'], 'kekerasan: matang 2–6, belum 7–9; berat tersebar di kedua kelompok'],
          ['m', 'Mangga matang yang dekat kelompok belum', ['M6: mungkin varietas yang agak keras, alat ditekan di bagian keras, atau salah catat', 'M1: karena paling ringan', 'M5: karena paling berat', 'M9: karena paling keras'], 'M6: mungkin varietas yang agak keras, alat ditekan di bagian keras, atau salah catat']], done: next });
      }
      else if (r === 1) {
        wrap.append(pyCode(kodeKosong, { labels: lab(1, 20), cls: 'mg-kecil', warn: [8, 11, 16] }));
        rowsChoose(wrap, ctx, { prompt: 'Lengkapi baris 9, 12, dan 17', cls: 'mg-isi mg-mono', rows: [
          ['l9', 'Baris 9', ['(a[1] - b[1]) ** 2', '(a[1] - b[0]) ** 2', '(a[2] - b[2]) ** 2', 'a[1] - b[1]'], '(a[1] - b[1]) ** 2'],
          ['l12', 'Baris 12', ['urut[:k]', 'urut[k]', 'urut[k:]', 'data[:k]'], 'urut[:k]'],
          ['l17', 'Baris 17', ['suara.get(label, 0) + 1', 'suara[label] + 1', '1', 'suara.get(label) + 1'], 'suara.get(label, 0) + 1'],
          ['b', 'Baris 11 dan list data', ['semua contoh, dari yang terdekat ke x; data tidak berubah karena sorted membuat list baru', 'data diurutkan menurut berat dan ikut berubah', 'hanya k contoh, menurut label', 'data diurutkan menurut kekerasan'], 'semua contoh, dari yang terdekat ke x; data tidak berubah karena sorted membuat list baru'],
          ['c', 'd punya 3 nilai, q hanya 2', ['jarak hanya memakai indeks 0 dan 1; label di indeks 2 tidak dihitung', 'Python mengisi nilai ketiga dengan 0', 'q otomatis diberi label', 'jarak tidak bisa dihitung'], 'jarak hanya memakai indeks 0 dan 1; label di indeks 2 tidak dihitung']], done: next });
      }
      else if (r === 2) {
        const isi = [1, 2, 5, 7, 11];
        wrap.append(el('div', { class: 'mg-dua' }, pyCode(KODE1.slice(7, 12), { labels: lab(8, 5), cls: 'mg-kecil' }), el('p', { class: 'mg-ket' }, 'Kuadrat jarak = (berat − 300)² + (kekerasan − 8)². Contoh M1: (−60)² + (−6)² = 3.636.')));
        rowsChoose(wrap, ctx, { prompt: 'Kuadrat jarak ke Q', cls: 'mg-isi', rows: isi.map((i) => { const d = DATA[i]; const a = d[0] - 300; const b = d[1] - 8; const right = fmtNum(a * a + b * b);
          return [`d${i}`, `${NAMA[i]} (${d[0]}, ${d[1]})`, opsi(right, [fmtNum(a * a - b * b), fmtNum(a * a), fmtNum((a + b) ** 2), fmtNum(a * a + b * b + 100)]), right]; }), done: next });
      }
      else if (r === 3) {
        const U = urutkan(DATA, Q); const out = runPy(KODE1).out[0];
        wrap.append(el('div', { class: 'mg-dua' }, bidang({ x: Q, k: 3 }), el('table', { class: 'mg-tabel' }, el('tr', null, ['Mangga', 'Kuadrat jarak'].map((h) => el('th', null, h))), DATA.map((d, i) => el('tr', null, el('td', null, NAMA[i]), el('td', null, fmtNum(jarak2(d, Q))))))));
        rowsChoose(wrap, ctx, { prompt: 'Peringkat dan tebakan untuk Q tanpa skala', cls: 'mg-isi', rows: [
          ...[0, 1, 2, 3].map((p) => [`r${p}`, `Peringkat ${p + 1}`, opsi(NAMA[U[p].i], [NAMA[U[(p + 1) % 12].i], NAMA[U[(p + 2) % 12].i], NAMA[U[p + 4].i]]), NAMA[U[p].i]]),
          ['o', 'Keluaran baris 20', [out, 'belum belum', 'matang belum', 'belum matang'], out],
          ['c', 'Mengapa model keliru?', ['kuadrat selisih berat ratusan sampai belasan ribu, kekerasan paling besar 36; jarak dikuasai berat', 'karena k terlalu kecil', 'karena data latih salah semua', 'karena math.sqrt tidak tepat'], 'kuadrat selisih berat ratusan sampai belasan ribu, kekerasan paling besar 36; jarak dikuasai berat']], done: next });
      }
      else if (r === 4) {
        const R = runPy([...KODE1.slice(0, 18), ...KODE2.slice(0, 8)]).vars;
        wrap.append(el('div', { class: 'mg-dua' }, pyCode(KODE2, { labels: lab(21, 9), cls: 'mg-kecil' }), el('table', { class: 'mg-tabel' }, el('tr', null, ['Mangga', 'Berat ÷ 50', 'Kekerasan'].map((h) => el('th', null, h))), D2.map((d, i) => el('tr', null, el('td', null, NAMA[i]), el('td', null, fmtNum(d[0], 1)), el('td', null, d[1]))))));
        rowsChoose(wrap, ctx, { prompt: 'Setelah diskalakan: kuadrat jarak ke q2', cls: 'mg-isi', rows: [
          ['q', 'q2 · p2', [`${pyRepr(R.q2)} · ${pyRepr(R.p2)}`, '(300, 8) · (325, 7)', '(6, 0.16) · (6.5, 0.14)', '(6.0, 0.16) · (6.5, 7)'], `${pyRepr(R.q2)} · ${pyRepr(R.p2)}`],
          ...[1, 2, 7, 11].map((i) => { const right = dec(jarak2(D2[i], q2)); return [`d${i}`, `${NAMA[i]} (${fmtNum(D2[i][0], 1)}; ${D2[i][1]})`, opsi(right, [dec(Math.abs(D2[i][0] - 6) + Math.abs(D2[i][1] - 8)), dec((D2[i][0] - 6) ** 2), dec(jarak2(D2[i], q2) + 1), dec(jarak2(D2[i], p2))]), right]; })], done: next });
      }
      else if (r === 5) {
        const T = tebak(D2, q2, 3); const out = runPy([...KODE1.slice(0, 18), ...KODE2]).out[0];
        wrap.append(el('div', { class: 'mg-dua' }, bidang({ x: Q, k: 3, mode: 'skala' }), bidang({ x: Q, k: 3 })));
        rowsChoose(wrap, ctx, { prompt: 'Kiri: setelah skala. Kanan: sebelum skala.', cls: 'mg-isi', rows: [
          ['t', 'Tiga tetangga terdekat q2', opsi(namaList(T.tet), ['M2, M3, M12', 'M12, M8, M6', 'M9, M10, M11']), namaList(T.tet)],
          ['o', 'Keluaran baris 29', [out, 'matang matang', 'belum matang', 'matang belum'], out],
          ['w', 'Mengapa berat dibagi 50?', ['rentang berat 200 menjadi 4, sebanding dengan rentang kekerasan 7', 'agar berat menjadi kilogram', 'agar angkanya bulat', 'agar mangga ringan dianggap matang'], 'rentang berat 200 menjadi 4, sebanding dengan rentang kekerasan 7']], done: next });
      }
      else if (r === 6) {
        const a = tebak(D2, Q, 1).hasil; const b = tebak(D2, [240, 2], 1); const sem = [[220, 1], [240, 2], [330, 2]].every((x) => [1, 3].every((k) => tebak(D2, x, k).hasil === 'belum'));
        wrap.append(el('div', { class: 'mg-dua' }, bidang({ x: [240, 2], k: 3, mode: 'lupa' }), pyCode(['data2 = skala(data)', 'q = (300, 8)', 'print(tebak(data2, q, 1))', 'print(tebak(data2, (240, 2), 1))'], { cls: 'mg-kecil', warn: [1, 3] })));
        rowsChoose(wrap, ctx, { prompt: 'Rudi lupa menskalakan mangga baru', cls: 'mg-isi', rows: [
          ['a', 'tebak(data2, q, 1)', [a, 'matang', 'KeyError', 'None'].filter((v, i, z) => z.indexOf(v) === i), a],
          ['b', 'tebak(data2, (240, 2), 1), padahal sama dengan M1', [b.hasil, 'matang', 'None', 'ValueError'].filter((v, i, z) => z.indexOf(v) === i), b.hasil],
          ['t', 'Tetangga terdekatnya', opsi(namaList(urutkan(D2, [240, 2]).slice(0, 3)), ['M1, M2, M3', 'M7, M8, M12', 'M6, M9, M10']), namaList(urutkan(D2, [240, 2]).slice(0, 3))],
          ['w', 'Mengapa program Rudi salah?', [`selisih berat lebih dari 200, jadi yang terdekat selalu mangga terberat; jawabannya ${sem ? 'selalu "belum"' : 'kacau'}, hasil pertama benar karena kebetulan`, 'karena k = 1 terlalu kecil', 'karena data2 salah', 'program Rudi benar'], `selisih berat lebih dari 200, jadi yang terdekat selalu mangga terberat; jawabannya ${sem ? 'selalu "belum"' : 'kacau'}, hasil pertama benar karena kebetulan`]], done: next });
      }
      else if (r === 7) {
        wrap.append(bidang({ x: P, k: 7, mode: 'skala' }));
        rowsChoose(wrap, ctx, { prompt: 'Pengaruh k untuk p2 = (6.5, 7)', cls: 'mg-isi', rows: [
          ['m6', 'Kuadrat jarak M6 · M10', [`${dec(jarak2(D2[5], p2))} · ${dec(jarak2(D2[9], p2))}`, '1,21 · 1,01', '0,01 · 1,21', '1,01 · 0,21'], `${dec(jarak2(D2[5], p2))} · ${dec(jarak2(D2[9], p2))}`],
          ...[1, 3, 5, 7].map((k) => { const T = tebak(D2, p2, k); const m = T.suara.get('matang') || 0; const b = T.suara.get('belum') || 0; const right = `${m} · ${b} · ${T.hasil}`; return [`k${k}`, `k = ${k}: suara matang · belum · tebakan`, opsi(right, [`${b} · ${m} · ${T.hasil === 'matang' ? 'belum' : 'matang'}`, `${m} · ${b} · ${T.hasil === 'matang' ? 'belum' : 'matang'}`, `${m + 1} · ${Math.max(0, b - 1)} · matang`]), right]; }),
          ['c', 'Mengapa k = 1 mudah terkecoh?', ['hanya mendengar M6, satu contoh tak biasa yang langsung menentukan', 'karena k = 1 selalu menjawab matang', 'karena jaraknya dihitung salah', 'k = 1 tidak pernah terkecoh'], 'hanya mendengar M6, satu contoh tak biasa yang langsung menentukan']], done: next });
      }
      else if (r === 8) {
        const T = tebak(D2, p2, 5);
        wrap.append(el('div', { class: 'mg-dua' }, pyCode(KODE1.slice(12, 18), { labels: lab(13, 6), cls: 'mg-kecil', hl: [4] }), el('p', { class: 'mg-ket' }, `tebak(data2, p2, 5): tetangga ${namaList(T.tet)}`)));
        const pool = (j) => [suaraText(T.jejak[j].suara), suaraText(T.jejak[Math.max(0, j - 1)].suara), suaraText(new Map([...T.jejak[j].suara].reverse())), j ? `{'${T.jejak[j].label}': 1}` : "{'belum': 1}", `{'matang': ${j + 1}}`];
        const ke = runPy([...KODE1.slice(0, 16), '        suara[label] = suara[label] + 1', ...KODE1.slice(17, 18), ...KODE2.slice(0, 8), 'x = tebak(data2, p2, 5)']).error;
        rowsChoose(wrap, ctx, { prompt: 'Isi suara setiap kali baris 17 selesai', cls: 'mg-isi mg-mono', rows: [
          ...T.jejak.map((s, j) => [`s${j}`, `Putaran ${j + 1}: ${s.nama} (${s.label})`, opsi(suaraText(s.suara), pool(j)), suaraText(s.suara)]),
          ['h', 'Nilai yang dikembalikan', [`'${T.hasil}'`, "'matang'", '4', "{'belum': 4}"].filter((v, i, z) => z.indexOf(v) === i), `'${T.hasil}'`],
          ['g', 'Bila baris 17 ditulis suara[label] = suara[label] + 1', [`${ke.type}: ${ke.message}`, "KeyError: 'belum'", 'suara menjadi kosong', 'tidak ada bedanya'], `${ke.type}: ${ke.message}`]], done: next });
      }
      else {
        const T2 = tebak(D2, p2, 2); const T12 = tebak(D2, p2, 12); const sama = [[220, 1], [300, 8], [325, 7], [420, 10], [340, 5], [260, 4]].every((x) => { const y = [x[0] / 50, x[1]]; return tebak(D2, y, 12).hasil === tebak(D2, y, 1).hasil; });
        wrap.append(pyCode(['    return max(suara, key=suara.get)'], { labels: ['18'], cls: 'mg-kecil', hl: [0] }));
        rowsChoose(wrap, ctx, { prompt: 'Suara seri dan memilih k', cls: 'mg-isi', rows: [
          ['a', `k = 2: ${suaraText(T2.suara)}`, [`'${T2.hasil}': kunci pertama yang nilainya terbesar, yaitu label tetangga terdekat`, "'belum': karena paling banyak di data", 'ValueError karena seri', 'acak'], `'${T2.hasil}': kunci pertama yang nilainya terbesar, yaitu label tetangga terdekat`],
          ['b', 'k = 12: suara matang · belum', [`${T12.suara.get('matang')} · ${T12.suara.get('belum')}`, '12 · 0', '7 · 5', '5 · 7'], `${T12.suara.get('matang')} · ${T12.suara.get('belum')}`],
          ['c', 'tebak(data2, x, 12) dibanding tebak(data2, x, 1)', [sama ? 'selalu sama, karena suara selalu seri dan max memilih label tetangga terdekat' : 'berbeda', 'selalu berlawanan', 'selalu matang', 'selalu belum'], sama ? 'selalu sama, karena suara selalu seri dan max memilih label tetangga terdekat' : 'berbeda'],
          ['d', 'Pelajaran memilih k', ['k ganjil yang cukup kecil agar tetangganya mirip dan cukup besar agar satu contoh aneh tidak menentukan, misalnya 3 atau 5', 'semakin besar k semakin baik', 'k = 1 selalu terbaik', 'k harus sama dengan banyak data'], 'k ganjil yang cukup kecil agar tetangganya mirip dan cukup besar agar satu contoh aneh tidak menentukan, misalnya 3 atau 5']], done: next });
      }
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
