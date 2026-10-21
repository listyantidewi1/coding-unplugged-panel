// Pemeriksa Rima Pantun — SMA/SMK (16–18 tahun), coding. Python strings:
// indexes and slices, split/join/strip/lower, a first rhyme checker that is
// fooled by punctuation (and passes pantun 3 by luck), Rina's fix that trips
// on capitals and trailing spaces, cek_abab with bunyi_akhir, word counts,
// decoy pantun, and the last-vowel rhyme from the Tantangan.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pyCode, stepper } from './smp-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const PANTUN = {
  p1: ['Burung pipit terbang ke sawah,', 'Hinggap sebentar di pohon jati.', 'Rajin belajar jangan menyerah,', 'Ilmu dicari sepenuh hati!'],
  p2: ['Burung pipit terbang ke sawah,', 'Hinggap sebentar di pohon jati.', 'RAJIN BELAJAR JANGAN MENYERAH,', 'Ilmu dicari sepenuh hati.'],
  p3: ['Kalau ada sumur di ladang,', 'Boleh kita menumpang mandi.', 'Kalau ada umur panjang,', 'Boleh kita berjumpa lagi.'],
  kecoh: ['Saya suka makan sawah,', 'Saya suka makan jati.', 'Saya suka makan sawah,', 'Saya suka makan jati.'],
};
export const NAMA = { p1: 'Pantun 1', p2: 'Pantun 2 (poster)', p3: 'Pantun 3', kecoh: 'Pantun pengecoh' };
const PUNCT = '.,!?;:';
// Program versions. v1 = lines 1–10, rina / rina2 change line 5, akhir = lines 11–21, vokal = Tantangan.
export const V1 = (b5 = 'b[-2:]') => ['def cek_rima(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', `        bunyi.append(${b5})`, '    print(bunyi)', '    if bunyi[0] == bunyi[2] and bunyi[1] == bunyi[3] and bunyi[0] != bunyi[1]:', '        print("Rima a-b-a-b")', '    else:', '        print("Bukan a-b-a-b")'];
export const RINA = 'b.rstrip(".,!?;:")[-2:]'; export const RINA2 = 'b.rstrip(".,!?;:").lower()[-2:]'; export const RINA3 = 'b.strip().rstrip(".,!?;:").lower()[-2:]';
const CEK = (fn) => ['def cek_abab(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', `        bunyi.append(${fn}(b))`, '    pola = "-".join(bunyi)', '    benar = len(baris) == 4 and bunyi[0] == bunyi[2] and bunyi[1] == bunyi[3] and bunyi[0] != bunyi[1]', '    return pola, benar'];
export const AKHIR = ['def bunyi_akhir(b):', '    b = b.strip().rstrip(".,!?;:").lower()', '    return b[-2:]', ...CEK('bunyi_akhir')];
export const VOKAL = ['def bunyi_vokal(b):', '    kata = b.strip().rstrip(".,!?;:").lower().split()[-1]', '    i = len(kata) - 1', '    while i >= 0 and kata[i] not in "aiueo":', '        i = i - 1', '    return kata[i:]', ...CEK('bunyi_vokal')];
export const KATA = ['def cek_kata(teks):', '    for b in teks.split("\\n"):', '        banyak = len(b.split())', '        if banyak < 4 or banyak > 6:', '            return False', '    return True'];
export const VERSI = [['v1', 'versi pertama', V1(), null], ['rina', 'versi Rina', V1(RINA), null], ['rina2', 'Rina + lower()', V1(RINA2), null], ['akhir', 'bunyi_akhir', AKHIR, ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']], ['vokal', 'bunyi_vokal (Tantangan)', VOKAL, null]];
export const run = (lines, o = {}) => runPy(lines, { limit: 20000, ...o });
// Run one version on a pantun text: { bunyi, pola, benar, out, error }.
export function periksa(ver, teks) {
  const v = VERSI.find((x) => x[0] === ver); const vars = { teks_masuk: teks };
  if (ver.startsWith('v1') || ver.startsWith('rina')) { const R = run([...v[2], 'cek_rima(teks_masuk)'], { vars }); if (R.error) return { error: R.error.text, out: R.out }; const bunyi = R.out[0]; return { bunyi, out: R.out, benar: R.out[1] === 'Rima a-b-a-b', pola: null }; }
  const fn = ver === 'akhir' ? 'bunyi_akhir' : 'bunyi_vokal';
  const R = run([...v[2], 'pola, benar = cek_abab(teks_masuk)', 'bunyi = []', 'for b in teks_masuk.split("\\n"):', `    bunyi.append(${fn}(b))`], { vars });
  if (R.error) return { error: R.error.text, out: R.out };
  return { bunyi: pyRepr(R.vars.bunyi, true), pola: R.vars.pola, benar: R.vars.benar, out: [] };
}
export const kata = (teks) => { const R = run([...KATA, 'ok = cek_kata(teks_masuk)', 'n = []', 'for b in teks_masuk.split("\\n"):', '    n.append(len(b.split()))'], { vars: { teks_masuk: teks } }); return { ok: R.vars.ok, n: R.vars.n }; };
export const evalS = (s, expr) => { const R = run([`x = ${expr}`], { vars: { s } }); return R.error ? R.error.text : pyRepr(R.vars.x, true); };
// Character range [a, b) of a line that a version takes as its ending sound.
export function ambil(ver, b) {
  if (ver === 'v1') return [Math.max(0, b.length - 2), b.length];
  let lo = 0; let hi = b.length;
  if (ver === 'akhir' || ver === 'vokal' || ver === 'rina3') { while (lo < hi && /\s/.test(b[lo])) lo++; while (hi > lo && /\s/.test(b[hi - 1])) hi--; }
  while (hi > lo && PUNCT.includes(b[hi - 1])) hi--;
  if (ver !== 'vokal') return [Math.max(lo, hi - 2), hi];
  let w = hi; while (w > lo && !/\s/.test(b[w - 1])) w--; let i = hi - 1; while (i >= w && !'aiueo'.includes(b[i].toLowerCase())) i--; return [Math.max(i, w), hi];
}
// Characters as boxes with positive and negative indexes; lit = [a, b) highlighted.
export function charBoxes(s, lit = null, { neg = true } = {}) {
  return el('div', { class: 'ri-kotak' }, [...s].map((c, i) => el('span', { class: `${lit && lit.includes(i) ? 'ambil' : ''} ${c === ' ' ? 'spasi' : ''}` }, el('small', null, String(i)), el('b', null, c === ' ' ? '␣' : c), neg ? el('small', null, String(i - s.length)) : null)));
}
// Indexes taken by a slice/index expression on s (for highlighting).
export function sliceIdx(s, expr) {
  const m = expr.match(/^s\[(-?\d*)(?::(-?\d*))?(?::(-?\d+))?\]$/); if (!m) return [];
  const n = s.length; const R = run(['x = list(range(n))', `y = x${expr.slice(1)}`], { vars: { n } }); const y = R.vars.y; return Array.isArray(y) ? y : typeof y === 'number' ? [y] : [];
}
const lit = (ls) => JSON.stringify(ls.join('\n'));
const pantunView = (key, ver = null) => el('div', { class: 'ri-pantun' }, el('small', null, NAMA[key]), PANTUN[key].map((b) => { const [a, z] = ver ? ambil(ver, b) : [b.length, b.length]; return el('p', null, b.slice(0, a), el('mark', null, b.slice(a, z)), b.slice(z)); }));

export default {
  id: 'sma-40-rima-pantun',
  title: 'Pemeriksa Rima Pantun',
  topic: 'Teks di Python: indeks dan potongan, split, join, strip, lower, pemeriksa rima a-b-a-b, bug karena tanda baca, huruf kapital, dan spasi, fungsi yang mengembalikan nilai, serta batas pemeriksaan otomatis',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📜',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri potongan teks, jalankan pemeriksa rima pantun versi pertama, temukan bug tanda baca dan huruf kapital, lengkapi pemeriksa yang lebih baik, lalu buat pantun pengecoh.',
  extraModes: [
    { id: 'pemeriksa', icon: '🔎', label: 'Pemeriksa Pantun', desc: 'Ketik pantun: layar memecahnya menjadi baris dan kata, menyorot bunyi akhir, dan menampilkan pola serta banyak kata', create: createChecker },
    { id: 'string', icon: '🔤', label: 'Penelusur String', desc: 'Setiap karakter dalam kotak dengan indeks positif dan negatif; potongan yang diambil menyala', create: createString },
    { id: 'versi', icon: '🧪', label: 'Versi Program', desc: 'Bandingkan hasil versi pertama, versi Rina, bunyi_akhir, dan bunyi_vokal untuk pantun yang sama', create: createVersions },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Pantun Pengecoh', desc: 'Satu tim membuat pantun pengecoh, tim lain menebak hasil pemeriksa sebelum dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rima-pantun' });
    root.append(wrap);
    const s = 'menyerah,';
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const ex = (e, wrong, why) => { const v = evalS(s, e); return [e, e, [...new Set([v, ...wrong])].sort(), v, why]; };
      if (r === 0) { wrap.append(el('p', { class: 'ri-ket' }, `s = ${pyRepr(s, true)}`), charBoxes(s));
        rowsChoose(wrap, ctx, { prompt: 'Indeks dan potongan', cls: 'ri-isi', info: 's[0] → "m" sudah diisi.', done: next, rows: [ex('s[-1]', ["'h'", "'m'", "'h,'"], 'Indeks −1 adalah karakter terakhir, yaitu koma.'), ex('s[-2:]', ["'ah'", "','", "'menyerah'"]), ex('s[-3:-1]', ["'ah,'", "'rah'", "'h,'"], 'Dari indeks −3 sampai sebelum −1.'), ex('s[:4]', ["'meny'"].concat(["'menye'", "'enye'"])), ex('s[2:5]', ["'nyer'", "'eny'", "'yer'"]), ex('len(s)', ['8', '10', '7'], 'Koma juga dihitung.')] }); }
      else if (r === 1) { const E = (src, wrong, why) => { const v = evalS(s, src); return [src, src, [...new Set([v, ...wrong])].sort(), v, why]; };
        rowsChoose(wrap, ctx, { prompt: 'Method teks', cls: 'ri-isi', done: next, rows: [E('s.upper()', ["'Menyerah,'", "'MENYERAH'"]), E('s.rstrip(",")', ["'menyerah,'", "'enyerah'"]), E('"hati! ".strip()', ["'hati'", "'hati! '"], 'strip() tanpa argumen hanya membuang spasi di ujung.'), E('"Ilmu dicari sepenuh hati".split()', ["['Ilmu dicari sepenuh hati']", "['I', 'l', 'm', 'u']"]), E('"-".join(["ah", "ti", "ah", "ti"])', ["'ahtiahti'", "['ah-ti-ah-ti']"])] }); }
      else if (r === 2) { const R = run([...V1(), `cek_rima(${lit(PANTUN.p1)})`]);
        wrap.append(el('div', { class: 'ri-dua' }, pyCode(V1(), { cls: 'ri-kecil' }), pantunView('p1', 'v1')));
        rowsChoose(wrap, ctx, { prompt: 'Versi pertama untuk pantun 1', cls: 'ri-isi', rows: [['b', 'Isi bunyi', [R.out[0], "['ah', 'ti', 'ah', 'ti']", "['h', 'i', 'h', 'i']", "['h,', 'i.', 'h,', 'i.']"], R.out[0]], ['k', 'Keluaran', [R.out[1], 'Rima a-b-a-b'], R.out[1]], ['s', 'Apakah benar? Penyebabnya', ['salah: dua karakter terakhir memuat tanda baca, jadi "i." dan "i!" dianggap beda', 'benar: pantun 1 memang bukan a-b-a-b', 'salah: split("\\n") memecah per kata', 'salah: bunyi[0] != bunyi[1] terbalik'], 'salah: dua karakter terakhir memuat tanda baca, jadi "i." dan "i!" dianggap beda']], done: next }); }
      else if (r === 3) { const R = run([...V1(), `cek_rima(${lit(PANTUN.p3)})`]);
        wrap.append(pantunView('p3', 'v1'));
        rowsChoose(wrap, ctx, { prompt: 'Versi pertama untuk pantun 3', cls: 'ri-isi', rows: [['b', 'Isi bunyi', [R.out[0], "['ng', 'di', 'ng', 'gi']", "['ang', 'i', 'ang', 'i']", "['g', 'i', 'g', 'i']"], R.out[0]], ['k', 'Keluaran', [R.out[1], 'Bukan a-b-a-b'], R.out[1]], ['m', 'Benar-benar memeriksa rima?', ['tidak: lulus karena kebetulan tanda bacanya berpola koma, titik, koma, titik', 'ya: g dan i adalah bunyi akhir', 'ya: hasilnya benar, jadi programnya benar'], 'tidak: lulus karena kebetulan tanda bacanya berpola koma, titik, koma, titik', 'Satu contoh yang lulus tidak membuktikan program benar.']], done: next }); }
      else if (r === 4) { const A = run([...V1(RINA), `cek_rima(${lit(PANTUN.p1)})`]); const B = run([...V1(RINA), `cek_rima(${lit(PANTUN.p2)})`]);
        wrap.append(el('p', { class: 'ri-ket' }, `Baris 5 Rina: bunyi.append(${RINA})`), el('div', { class: 'ri-dua' }, pantunView('p1', 'rina'), pantunView('p2', 'rina')));
        rowsChoose(wrap, ctx, { prompt: 'Versi Rina', cls: 'ri-isi', rows: [['1', 'bunyi pantun 1', [A.out[0], B.out[0], "['h,', 'i.', 'h,', 'i!']"], A.out[0]], ['2', 'bunyi pantun 2', [B.out[0], A.out[0], "['AH', 'TI', 'AH', 'TI']"], B.out[0]], ['w', 'Mengapa pantun 2 gagal? Perbaikan baris 5', [`"AH" tidak sama dengan "ah" · bunyi.append(${RINA2})`, `"AH" tidak sama dengan "ah" · bunyi.append(b.lower().rstrip()[-2:])`, `tanda baca masih ada · bunyi.append(${RINA})`, `pantun 2 memang salah · tidak perlu diubah`], `"AH" tidak sama dengan "ah" · bunyi.append(${RINA2})`, 'Python membedakan huruf kapital dan huruf kecil.']], done: next }); }
      else if (r === 5) { const line = 'Burung pipit terbang ke sawah, '; const last = evalS(line, 's[-2:]');
        wrap.append(el('p', { class: 'ri-ket' }, 'Baris pertama dengan spasi tak sengaja'), charBoxes(line, [line.length - 2, line.length - 1], { neg: false }));
        rowsChoose(wrap, ctx, { prompt: 'Spasi yang tidak terlihat', cls: 'ri-isi', rows: [['c', 'Dua karakter terakhir', [last, "'h,'", "'ah'", "' '"], last, 'Koma lalu spasi.'], ['t', 'Yang ditambahkan di baris 5', ['strip() lebih dulu: b.strip().rstrip(".,!?;:").lower()[-2:]', 'rstrip(" ") di akhir: b.rstrip(".,!?;:").lower()[-2:].rstrip(" ")', 'upper(): b.upper()[-2:]', 'tidak perlu: rstrip(".,!?;:") sudah membuang spasi'], 'strip() lebih dulu: b.strip().rstrip(".,!?;:").lower()[-2:]', 'rstrip(".,!?;:") berhenti di spasi, jadi koma tidak terbuang.']], done: next }); }
      else if (r === 6) { wrap.append(pyCode(['def bunyi_akhir(b):', '    b = ……', '    return b[-2:]', 'def cek_abab(teks):', '    baris = teks.split("\\n")', '    bunyi = []', '    for b in baris:', '        bunyi.append(……)', '    pola = "-".join(bunyi)', '    benar = len(baris) == 4 and bunyi[0] == bunyi[2] and …', '    return pola, benar'], { labels: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'], cls: 'ri-kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Pemeriksa yang lebih baik: lengkapi', cls: 'ri-isi', rows: [['12', 'Baris 12', ['b.strip().rstrip(".,!?;:").lower()', 'b.rstrip(".,!?;:").strip().upper()', 'b.lower()', 'print(b.strip())'], 'b.strip().rstrip(".,!?;:").lower()'], ['18', 'Baris 18', ['bunyi_akhir(b)', 'bunyi_akhir', 'b[-2:]', 'print(bunyi_akhir(b))'], 'bunyi_akhir(b)', 'Fungsi mengembalikan nilai, lalu nilainya dimasukkan ke list.']], done: next }); }
      else if (r === 7) { const H = ['p1', 'p2', 'p3'].map((k) => periksa('akhir', PANTUN[k].join('\n'))); const human = [true, true, false];
        rowsChoose(wrap, ctx, { prompt: 'Hasil cek_abab', cls: 'ri-isi', rows: ['p1', 'p2', 'p3'].map((k, j) => [k, `${NAMA[k]}: pola · benar · sesuai penilaian manusia?`, [`${H[j].pola} · ${pyRepr(H[j].benar)} · ${human[j] ? 'ya' : 'tidak'}`, `${H[j].pola} · ${pyRepr(!H[j].benar)} · ${human[j] ? 'tidak' : 'ya'}`, `ah-i-ah-i · True · ya`, `h,-i.-h,-i! · False · ya`].filter((x, i, a) => a.indexOf(x) === i), `${H[j].pola} · ${pyRepr(H[j].benar)} · ${human[j] ? 'ya' : 'tidak'}`, k === 'p3' ? 'Pantun 3 rimanya benar, tetapi program menolaknya.' : 'Tepat.']), done: next }); }
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Mengapa pantun 3 ditolak, dan mengapa bunyi_akhir dipisah?', cls: 'ri-isi', rows: [['c', 'Pantun 3 ditolak karena', ['"mandi" dan "lagi" sama-sama berbunyi i, tetapi dua huruf terakhirnya "di" dan "gi"', 'pantun 3 memang tidak berima', 'tanda baca pantun 3 berbeda', 'pantun 3 lebih dari 4 baris'], '"mandi" dan "lagi" sama-sama berbunyi i, tetapi dua huruf terakhirnya "di" dan "gi"', 'Penyederhanaan "dua huruf terakhir" tidak sama dengan bunyi akhir.'], ['v', 'Versi pertama menerimanya karena', ['kebetulan tanda bacanya berpola sama', 'versi pertama lebih pintar', 'versi pertama memakai lower()'], 'kebetulan tanda bacanya berpola sama'], ['d', 'Manfaat fungsi bunyi_akhir tersendiri', ['aturan bunyi akhir ada di satu tempat: cukup ubah bunyi_akhir, dan fungsinya bisa diuji sendiri', 'program jadi lebih cepat', 'Python mewajibkan dua fungsi', 'agar tidak perlu return'], 'aturan bunyi akhir ada di satu tempat: cukup ubah bunyi_akhir, dan fungsinya bisa diuji sendiri', `Contoh uji: bunyi_akhir("Hati! ") = ${pyRepr(run([...AKHIR, 'x = bunyi_akhir("Hati! ")']).vars.x, true)}.`]], done: next });
      else { const K1 = kata(PANTUN.p1.join('\n')); const K3 = kata(PANTUN.p3.join('\n')); const KC = periksa('akhir', PANTUN.kecoh.join('\n')); const KK = kata(PANTUN.kecoh.join('\n')); const V = ['p1', 'p3'].map((k) => periksa('vokal', PANTUN[k].join('\n')).pola);
        rowsChoose(wrap, ctx, { prompt: 'Banyak kata dan pantun pengecoh', cls: 'ri-isi', rows: [['f', 'Isi cek_kata', ['banyak = len(b.split()) · if banyak < 4 or banyak > 6: return False', 'banyak = len(b) · if banyak < 4 or banyak > 6: return False', 'banyak = len(b.split()) · if banyak < 4 and banyak > 6: return False', 'banyak = len(teks.split()) · if banyak > 6: return False'], 'banyak = len(b.split()) · if banyak < 4 or banyak > 6: return False'], ['n', 'Banyak kata pantun 1 · pantun 3', [`${K1.n.join(', ')} · ${K3.n.join(', ')}`, `${K3.n.join(', ')} · ${K1.n.join(', ')}`, '5, 5, 5, 4 · 5, 4, 4, 4', '4, 4, 4, 4 · 4, 4, 4, 4'], `${K1.n.join(', ')} · ${K3.n.join(', ')}`]],
          done: then(() => { wrap.append(pantunView('kecoh', 'akhir'), el('p', { class: 'ri-ket' }, `cek_abab → ('${KC.pola}', ${pyRepr(KC.benar)}) · cek_kata → ${pyRepr(KK.ok)}`));
            rowsChoose(wrap, ctx, { prompt: 'Pengecoh dan Tantangan', cls: 'ri-isi', rows: [['p', 'Yang tidak bisa diperiksa program', ['makna: apakah sampiran dan isi masuk akal dan barisnya tidak sekadar diulang', 'banyak kata setiap baris', 'pola a-b-a-b', 'banyak baris'], 'makna: apakah sampiran dan isi masuk akal dan barisnya tidak sekadar diulang', 'Penilaian makna tetap pekerjaan juri.'], ['t', 'Tantangan bunyi_vokal: pantun 1 · pantun 3', [`${V[0]} · ${V[1]}`, 'ah-ti-ah-ti · ng-di-ng-gi', 'ah-i-ah-i · ng-i-ng-i', 'a-i-a-i · a-i-a-i'], `${V[0]} · ${V[1]}`, 'Ketiga pantun kini lulus.']], done: next }); }) }); }
    }
    render();
  },
};

// Pantun editor shared by the checker and the team mode: four inputs, nothing stored.
function editor(lines, onChange) {
  return el('div', { class: 'ri-editor' }, lines.map((b, i) => { const inp = el('input', { type: 'text', value: b, 'aria-label': `Baris ${i + 1}`, spellcheck: 'false', autocomplete: 'off' }); inp.addEventListener('input', () => { lines[i] = inp.value; onChange(); }); return el('label', null, el('small', null, String(i + 1)), inp); }));
}
function report(lines, ver) {
  const teks = lines.join('\n'); const P = periksa(ver, teks); const K = kata(teks);
  return el('div', { class: 'ri-laporan' },
    lines.map((b, i) => { const [a, z] = ambil(ver, b); const words = b.split(/\s+/).filter(Boolean); return el('div', { class: 'ri-baris' }, el('small', null, `${i + 1}`), el('code', null, b.slice(0, a).replace(/ /g, '␣'), el('mark', null, b.slice(a, z).replace(/ /g, '␣')), b.slice(z).replace(/ /g, '␣')), el('span', { class: `ri-kata ${words.length < 4 || words.length > 6 ? 'luar' : ''}` }, `${words.length} kata`)); }),
    P.error ? el('p', { class: 'ri-galat' }, P.error) : el('p', { class: 'ri-hasil' }, el('span', null, `bunyi = ${P.bunyi}`), P.pola !== null ? el('span', null, `pola: ${P.pola}`) : null, el('b', { class: P.benar ? 'ok' : 'no' }, P.benar ? 'Rima a-b-a-b' : 'Bukan a-b-a-b')),
    el('p', { class: 'ri-hasil' }, el('span', null, `cek_kata: ${pyRepr(K.ok)}`), el('span', null, `banyak kata: ${(K.n || []).join(', ')}`)));
}

function createChecker(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let lines = [...PANTUN.p1]; let ver = 'akhir';
  const out = el('div');
  const upd = () => out.replaceChildren(report(lines, ver));
  const draw = () => {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pemeriksa pantun'),
      el('div', { class: 'seg ri-versi' }, Object.keys(PANTUN).map((k) => onTap(el('button', { class: 'seg-btn', type: 'button' }, NAMA[k]), () => { lines = [...PANTUN[k]]; draw(); })), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'kosongkan'), () => { lines = ['', '', '', '']; draw(); })),
      el('div', { class: 'seg ri-versi' }, VERSI.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'ri-dua' }, editor(lines, upd), out), el('p', { class: 'ri-ket' }, 'Pantun yang diketik hanya tampil di layar ini dan tidak disimpan.'));
    upd();
  };
  draw();
}

export const EXPRS = ['s[0]', 's[-1]', 's[-2:]', 's[-3:-1]', 's[:4]', 's[2:5]', 's[::-1]', 's[::2]', 'len(s)', 's.upper()', 's.lower()', 's.strip()', 's.rstrip(".,!?;:")', 's.split()', '"-".join(s.split())'];
function createString(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let s = 'menyerah,'; let expr = 's[-3:-1]'; let a = -3; let b = -1;
  const SAMPLE = ['menyerah,', 'hati! ', 'Ilmu dicari sepenuh hati', 'RAJIN BELAJAR,', 'ladang'];
  const draw = () => {
    const v = evalS(s, expr);
    const inp = el('input', { type: 'text', value: s, class: 'ri-input', 'aria-label': 's', spellcheck: 'false', autocomplete: 'off' });
    inp.addEventListener('change', () => { s = inp.value; draw(); });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur string'),
      el('div', { class: 'ri-atur' }, el('label', null, el('small', null, 's = '), inp), el('div', { class: 'seg' }, SAMPLE.map((x) => onTap(el('button', { class: `seg-btn ${s === x ? 'on' : ''}`, type: 'button' }, pyRepr(x, true)), () => { s = x; draw(); })))),
      charBoxes(s, sliceIdx(s, expr)),
      el('div', { class: 'seg ri-versi' }, EXPRS.map((x) => onTap(el('button', { class: `seg-btn ${expr === x ? 'on' : ''}`, type: 'button' }, x), () => { expr = x; draw(); }))),
      el('div', { class: 'ri-atur' }, stepper(a, (x) => { a = x; expr = `s[${a}:${b}]`; draw(); }, { min: -20, max: 20, label: 'awal' }), stepper(b, (x) => { b = x; expr = `s[${a}:${b}]`; draw(); }, { min: -20, max: 20, label: 'akhir' })),
      el('p', { class: 'ri-ekspresi' }, el('code', null, expr), ' → ', el('b', null, v)));
  };
  draw();
}

function createVersions(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  let ver = 'v1';
  const draw = () => {
    const v = VERSI.find((x) => x[0] === ver); const keys = Object.keys(PANTUN);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Versi program'), el('div', { class: 'seg ri-versi' }, VERSI.map(([k, t]) => onTap(el('button', { class: `seg-btn ${ver === k ? 'on' : ''}`, type: 'button' }, t), () => { ver = k; draw(); }))),
      el('div', { class: 'ri-dua' }, pyCode(v[2], { labels: v[3], cls: 'ri-kecil' }),
        el('table', { class: 'ri-tabel' }, el('tr', null, el('th', null, 'versi'), keys.map((k) => el('th', null, NAMA[k]))),
          VERSI.map(([k, t]) => el('tr', { class: k === ver ? 'pilih' : '' }, el('th', null, t), keys.map((pk) => { const P = periksa(k, PANTUN[pk].join('\n')); return el('td', { class: P.benar ? 'ok' : 'no' }, el('code', null, P.pola ?? P.bunyi), el('b', null, P.benar ? '✓ a-b-a-b' : '✗')); }))))),
      el('p', { class: 'ri-ket' }, 'Pantun 1, 2, dan 3 sebenarnya berima a-b-a-b. Pantun pengecoh lulus padahal buruk.'));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rima-pantun' });
  root.append(wrap);
  const TEMPLATE = [['Pergi ke pasar membeli roti,', 'Roti dibeli di ujung jalan.', 'Hati gembira sepenuh hati,', 'Belajar bersama setiap bulan.'], ['Ada kucing di atas meja,', 'Meja kayu di dalam rumah.', 'Ada kucing di atas meja,', 'Meja kayu di dalam rumah.'], ['Buah mangga buah delima,', 'Dimakan bersama teman sekelas.', 'Mari kita belajar bersama,', 'Supaya ilmu makin luas.']];
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(3, nT); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Pantun Pengecoh selesai', pts, again: () => pickTeams(wrap, 'Pantun Pengecoh', start) }); return; }
      const author = t % nT; const lines = [...TEMPLATE[t % TEMPLATE.length]]; let klaim = null;
      const draw = () => wrap.replaceChildren(scoreBar(pts, author), el('p', { class: 'prompt' }, `Tim ${author + 1}: buat pantun pengecoh`), editor(lines, () => {}),
        el('p', { class: 'ri-ket' }, 'Menurut tim kalian, pantun ini…'), el('div', { class: 'seg' }, [[true, 'pantun yang baik'], [false, 'pantun yang buruk']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${klaim === v ? 'on' : ''}`, type: 'button' }, l), () => { klaim = v; draw(); }))),
        button('Serahkan ke tim lain ➜', () => { if (klaim === null) { say(wrap.querySelector('.reveal'), 'bad', 'Pilih dulu: baik atau buruk.'); return; } guess(author, lines, klaim); }, 'primary'), el('p', { class: 'reveal info' }, 'Pantun hanya tampil di layar dan tidak disimpan.'));
      draw();
    }
    function guess(author, lines, klaim) {
      const others = Array.from({ length: nT }, (_, k) => k).filter((k) => k !== author); const g = {};
      const teks = lines.join('\n'); const P = periksa('akhir', teks); const K = kata(teks); const lulus = !!P.benar && !!K.ok;
      const draw = () => wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, 'Tebak: apakah pantun ini lulus cek_abab dan cek_kata?'), el('div', { class: 'ri-pantun' }, lines.map((b) => el('p', null, b))),
        el('div', { class: 'ri-tebakan' }, others.map((k) => el('div', { class: 'ri-tebak' }, el('b', null, `Tim ${k + 1}`), el('div', { class: 'seg' }, [[true, 'lulus'], [false, 'gagal']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${g[k] === v ? 'on' : ''}`, type: 'button' }, l), () => { g[k] = v; draw(); })))))),
        button('Jalankan pemeriksa ➜', () => { if (others.some((k) => g[k] === undefined)) { say(wrap.querySelector('.reveal'), 'bad', 'Semua tim menebak dulu.'); return; } reveal(); }, 'primary'), el('p', { class: 'reveal info' }, ' '));
      function reveal() {
        const right = others.filter((k) => g[k] === lulus); right.forEach((k) => { pts[k]++; }); const tipu = lulus !== klaim; if (tipu) pts[author]++;
        ctx.sound.good();
        wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, lulus ? 'Pemeriksa: lulus' : 'Pemeriksa: gagal'), report(lines, 'akhir'),
          el('p', { class: 'reveal' }, `${tipu ? `Pengecoh berhasil: pemeriksa berkata ${lulus ? 'lulus' : 'gagal'}, padahal Tim ${author + 1} menilainya ${klaim ? 'baik' : 'buruk'}. Tim ${author + 1} +1. ` : 'Pemeriksa sependapat dengan penilaian tim pembuat. '}${right.length ? `Tebakan tepat: ${right.map((k) => `Tim ${k + 1}`).join(', ')} +1.` : 'Tidak ada tebakan yang tepat.'}`),
          button('Lanjut ➜', () => { t++; step(); }, 'primary'));
      }
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Pantun Pengecoh', start);
}
