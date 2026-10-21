// Seleksi Beasiswa oleh Mesin — SMA/SMK (16–18 tahun), pembelajaran mesin dan bias.
// A decision tree learnt from last year's (biased) decisions, tested on new
// applicants with a confusion matrix, then rebuilt without the biased column.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const QS = [['rendah', 'Penghasilan rendah?'], ['nilai', 'Nilai ≥ 85?'], ['lomba', 'Prestasi lomba?'], ['jauh', 'Rumah jauh?']];
const row = (id, s, d) => ({ id, rendah: s[0] === 'Y', nilai: s[1] === 'Y', lomba: s[2] === 'Y', jauh: s[3] === 'Y', d: d === 'D' });
export const OLD = [['P01', 'YYTT', 'D'], ['P02', 'TYYY', 'X'], ['P03', 'YYYY', 'X'], ['P04', 'YTTY', 'X'], ['P05', 'TTTT', 'X'], ['P06', 'TYTT', 'X'], ['P07', 'YTYT', 'D'], ['P08', 'YYYT', 'D'], ['P09', 'TTYT', 'X'], ['P10', 'YTYY', 'X'], ['P11', 'YYTT', 'D'], ['P12', 'YYYT', 'D'], ['P13', 'TTTY', 'X'], ['P14', 'YTTT', 'X'], ['P15', 'YTYT', 'D'], ['P16', 'TYYT', 'X']].map((r) => row(...r));
export const NEW = [['B1', 'YYTT', 'D'], ['B2', 'YYYY', 'D'], ['B3', 'TYYT', 'X'], ['B4', 'YTTT', 'X'], ['B5', 'YTYY', 'D'], ['B6', 'YTYT', 'D'], ['B7', 'TTTY', 'X'], ['B8', 'YTTY', 'X']].map((r) => row(...r));
export const official = (r) => r.rendah && (r.nilai || r.lomba);
export const FIXED = OLD.map((r) => ({ ...r, d: official(r) }));

const count = (rows) => [rows.filter((r) => r.d).length, rows.filter((r) => !r.d).length];
const guess = (rows) => { const [a, b] = count(rows); return a > b; }; // ties guess "ditolak"
const errs = (rows) => Math.min(...count(rows));
export function splitInfo(rows, q) {
  const ya = rows.filter((r) => r[q]); const no = rows.filter((r) => !r[q]);
  return { ya: count(ya), no: count(no), eYa: errs(ya), eNo: errs(no), total: errs(ya) + errs(no) };
}
// Greedy tree as the worksheet describes it, then prune splits whose leaves agree.
export function buildTree(rows, qs = QS.map((q) => q[0])) {
  const grow = (rs, left) => {
    if (!errs(rs) || !left.length) return { leaf: guess(rs), rows: rs };
    let best = null;
    for (const q of left) { const s = splitInfo(rs, q).total; if (!best || s < best.s) best = { q, s }; }
    const rest = left.filter((x) => x !== best.q);
    const t = { q: best.q, rows: rs, ya: grow(rs.filter((r) => r[best.q]), rest), no: grow(rs.filter((r) => !r[best.q]), rest) };
    if ('leaf' in t.ya && 'leaf' in t.no && t.ya.leaf === t.no.leaf) return { leaf: t.ya.leaf, rows: rs };
    return t;
  };
  return grow(rows, qs);
}
export const predict = (t, r) => ('leaf' in t ? t.leaf : predict(r[t.q] ? t.ya : t.no, r));
export function evaluate(t, rows = NEW) {
  const m = { tp: 0, fn: 0, fp: 0, tn: 0 };
  for (const r of rows) { const p = predict(t, r); m[r.d ? (p ? 'tp' : 'fn') : (p ? 'fp' : 'tn')]++; }
  const ok = (g) => { const L = rows.filter((r) => r.d && r.jauh === g); return L.length ? Math.round((L.filter((r) => predict(t, r)).length / L.length) * 100) : null; };
  return { ...m, acc: Math.round(((m.tp + m.tn) / rows.length) * 100), dekat: ok(false), jauh: ok(true) };
}
export const TASKS = [['a', 'Menetapkan syarat siapa yang berhak menerima beasiswa', 'H'], ['b', 'Menghitung nilai rata-rata rapor dari data sekolah', 'M'], ['c', 'Memeriksa kelengkapan berkas pendaftaran', 'M'], ['d', 'Memutuskan pelamar yang keadaannya khusus, misalnya rumahnya baru terkena banjir', 'H'], ['e', 'Mengurutkan pelamar untuk dibahas panitia', 'M'], ['f', 'Menanggapi keberatan pelamar yang ditolak', 'H'], ['g', 'Menetapkan dan mengumumkan keputusan akhir', 'H'], ['h', 'Memeriksa apakah keputusan merugikan kelompok tertentu', 'H']];
const qName = (q) => QS.find((x) => x[0] === q)[1];
const yn = (b) => (b ? 'Y' : 'T');

// --- pieces ---
function dataTable(rows, { hi = [], show = true } = {}) {
  return el('table', { class: 'sb-tabel' }, el('tr', null, el('th', null, 'Kode'), ...QS.map(([, l]) => el('th', null, l.replace('?', ''))), show ? el('th', null, 'Keputusan') : null),
    rows.map((r) => el('tr', { class: hi.includes(r.id) ? 'tanda' : '' }, el('td', null, r.id), ...QS.map(([q]) => el('td', { class: r[q] ? 'ya' : '' }, yn(r[q]))), show ? el('td', { class: r.d ? 'd' : 'x' }, r.d ? 'D' : 'X') : null)));
}
const chip = (r) => el('span', { class: `sb-chip ${r.d ? 'd' : 'x'}` }, r.id);

// Try every question on a set of applicants; pick the one with the fewest mistakes.
function splitRound(wrap, ctx, { rows, qs, title, best, done }) {
  const tried = {}; let pick = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk setiap pertanyaan untuk membagi pelamar. Lalu pilih pertanyaan dengan kesalahan paling sedikit.');
  const host = el('div', { class: 'sb-bagi' });
  const draw = () => {
    const s = pick && splitInfo(rows, pick);
    host.replaceChildren(el('div', { class: 'seg sb-tanya' }, qs.map((q) => onTap(el('button', { class: `seg-btn ${pick === q ? 'on' : ''}`, type: 'button' }, qName(q)), () => { pick = q; tried[q] = splitInfo(rows, q); ctx.sound.tap(); draw(); }))),
      pick ? el('div', { class: 'sb-cabang' }, [['Ya', rows.filter((r) => r[pick]), s.ya, s.eYa], ['Tidak', rows.filter((r) => !r[pick]), s.no, s.eNo]].map(([l, rs, [d, x], e]) => el('div', null, el('b', null, `${l}: ${d} D / ${x} X → tebak ${d > x ? 'diterima' : 'ditolak'}, salah ${e}`), el('div', { class: 'sb-chips' }, rs.map(chip)))))
        : el('div', { class: 'sb-chips besar' }, rows.map(chip)),
      el('table', { class: 'sb-tabel' }, el('tr', null, el('th', null, 'Pertanyaan'), el('th', null, 'Ya: D / X'), el('th', null, 'Salah Ya'), el('th', null, 'Tidak: D / X'), el('th', null, 'Salah Tidak'), el('th', null, 'Jumlah'), el('th', null, '')),
        qs.map((q) => { const t = tried[q]; return el('tr', { class: pick === q ? 'tanda' : '' }, el('td', null, qName(q)), ...(t ? [`${t.ya[0]} / ${t.ya[1]}`, t.eYa, `${t.no[0]} / ${t.no[1]}`, t.eNo].map((v) => el('td', null, v)) : [el('td', { colspan: 4 }, '…')]), el('td', null, el('b', null, t ? t.total : '')),
          el('td', null, t ? onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Pilih'), () => {
            if (Object.keys(tried).length < qs.length) { ctx.mistake(); say(msg, 'bad', 'Coba semua pertanyaan dulu sebelum memilih.'); return; }
            if (q !== best) { ctx.mistake(); shake(host); say(msg, 'bad', `${qName(q)} salah ${t.total} kali. Ada yang lebih sedikit.`); return; }
            ctx.sound.good(); say(msg, '', `Mesin memilih ${qName(q)} dengan ${t.total} kesalahan.`); done();
          }) : null)); })));
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, title), host, msg);
}

// The worksheet tree with blanks, filled in order.
const BLANKS = [['Tidak →', 'ditolak'], ['Ya →', 'Rumah jauh?'], ['  Ya →', 'ditolak'], ['  Nilai ≥ 85? Ya →', 'diterima'], ['    Prestasi lomba? Ya →', 'diterima'], ['    Prestasi lomba? Tidak →', 'ditolak']];
function treeText(fill) {
  const f = (i) => el('span', { class: `sb-isian ${i === fill.length ? 'kini' : ''}` }, fill[i] ?? '……');
  return el('div', { class: 'sb-pohon-teks' },
    el('div', null, '❓ Penghasilan rendah?'),
    el('div', { class: 'l1' }, '├─ Tidak → ', f(0)),
    el('div', { class: 'l1' }, '└─ Ya → ', f(1)),
    el('div', { class: 'l2' }, '├─ Ya → ', f(2)),
    el('div', { class: 'l2' }, '└─ Tidak → ❓ Nilai ≥ 85?'),
    el('div', { class: 'l3' }, '├─ Ya → ', f(3)),
    el('div', { class: 'l3' }, '└─ Tidak → ❓ Prestasi lomba?'),
    el('div', { class: 'l4' }, '├─ Ya → ', f(4)),
    el('div', { class: 'l4' }, '└─ Tidak → ', f(5)));
}
function fillRound(wrap, ctx, { done }) {
  const fill = [];
  const msg = el('p', { class: 'reveal info' }, 'Isi kotak yang menyala. Mesin terus membagi sampai kesalahannya 0.');
  const host = el('div', { class: 'sb-dua' });
  const draw = () => host.replaceChildren(treeText(fill), fill.length < BLANKS.length ? el('div', { class: 'opts sb-opsi', style: { '--cols': 1 } }, ['diterima', 'ditolak', 'Rumah jauh?', 'Nilai ≥ 85?', 'Prestasi lomba?'].map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), () => {
    const want = BLANKS[fill.length][1];
    if (o !== want) { ctx.mistake(); shake(host); say(msg, 'bad', fill.length === 1 ? 'Di cabang ini, pertanyaan mana yang kesalahannya hanya 1?' : 'Lihat lagi pelamar yang sampai di kotak ini: keputusan mana yang terbanyak?'); return; }
    fill.push(o); ctx.sound.tap(); draw();
    if (fill.length === BLANKS.length) { say(msg, '', 'Pohon lengkap, dan kesalahannya pada data tahun lalu 0.'); done(); }
  }))) : null);
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pohon lengkap: isi setiap kotak.'), host, msg);
}

function traceRound(wrap, ctx, { tree, done }) {
  let k = 0; const res = [];
  const msg = el('p', { class: 'reveal info' }, 'Jalankan pohon untuk setiap pelamar: ikuti jawaban Y/T dari atas.');
  const host = el('div', { class: 'sb-dua' });
  const draw = () => host.replaceChildren(treeText(BLANKS.map((b) => b[1])),
    el('div', { class: 'sb-kanan' }, el('table', { class: 'sb-tabel' }, el('tr', null, el('th', null, 'Kode'), ...QS.map(([, l]) => el('th', null, l.replace('?', ''))), el('th', null, 'Panitia'), el('th', null, 'Pohon')),
      NEW.map((r, i) => el('tr', { class: i === k ? 'tanda' : '' }, el('td', null, r.id), ...QS.map(([q]) => el('td', { class: r[q] ? 'ya' : '' }, yn(r[q]))), el('td', { class: r.d ? 'd' : 'x' }, r.d ? 'D' : 'X'), el('td', { class: i < k ? (res[i] === r.d ? 'cocok' : 'beda') : '' }, i < k ? (res[i] ? 'D' : 'X') : i === k ? '?' : '')))),
    k < NEW.length ? el('div', { class: 'seg' }, [[true, 'D · diterima'], [false, 'X · ditolak']].map(([v, l]) => onTap(el('button', { class: 'seg-btn besar', type: 'button' }, l), () => {
      const p = predict(tree, NEW[k]);
      if (v !== p) { ctx.mistake(); shake(host); say(msg, 'bad', `Ikuti pohonnya, bukan keputusan panitia. ${NEW[k].id}: penghasilan ${yn(NEW[k].rendah)}, rumah jauh ${yn(NEW[k].jauh)}…`); return; }
      res.push(p); k++; ctx.sound.tap(); draw();
      if (k === NEW.length) { say(msg, '', 'B2 dan B5 seharusnya diterima, tetapi pohon menolaknya.'); done(); }
    }))) : null));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Menguji pada delapan pelamar baru'), host, msg);
}

function matrixRound(wrap, ctx, { tree, done }) {
  const placed = {}; let sel = null;
  const cell = (r) => (r.d ? (predict(tree, r) ? 'tp' : 'fn') : (predict(tree, r) ? 'fp' : 'tn'));
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu pelamar, lalu ketuk kotak matriks yang tepat.');
  const host = el('div', { class: 'sb-dua' });
  const box = (k) => onTap(el('td', { class: `sb-sel ${k === 'tp' || k === 'tn' ? 'benar' : 'salah'}` }, el('b', null, Object.values(placed).filter((x) => x === k).length), el('div', { class: 'sb-chips' }, NEW.filter((r) => placed[r.id] === k).map(chip))), () => {
    if (!sel) return; const r = NEW.find((x) => x.id === sel);
    if (cell(r) !== k) { ctx.mistake(); shake(host); say(msg, 'bad', `${r.id}: panitia ${r.d ? 'menerima' : 'menolak'}, pohon ${predict(tree, r) ? 'menerima' : 'menolak'}.`); return; }
    placed[sel] = k; sel = null; ctx.sound.tap(); draw();
    if (Object.keys(placed).length === NEW.length) { say(msg, '', 'Benar 6 dari 8: B2 dan B5 salah ditolak.'); done(); }
  });
  const draw = () => host.replaceChildren(el('div', { class: 'sb-chips besar' }, NEW.filter((r) => !(r.id in placed)).map((r) => onTap(el('button', { class: `sb-chip tombol ${r.d ? 'd' : 'x'} ${sel === r.id ? 'pilih' : ''}`, type: 'button' }, `${r.id} · panitia ${r.d ? 'D' : 'X'} · pohon ${predict(tree, r) ? 'D' : 'X'}`), () => { sel = r.id; draw(); }))),
    el('table', { class: 'sb-matriks' }, el('tr', null, el('th', null, ''), el('th', null, 'Pohon: diterima'), el('th', null, 'Pohon: ditolak')), el('tr', null, el('th', null, 'Seharusnya diterima'), box('tp'), box('fn')), el('tr', null, el('th', null, 'Seharusnya ditolak'), box('fp'), box('tn'))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Matriks kebingungan'), host, msg);
}

// Free tree builder. Each open box offers the unused questions (with their mistakes) or stays a leaf.
function treeBuilder(ctx, { rows, banned = [], onChange }) {
  const root = { rows };
  const host = el('div', { class: 'sb-pembangun' });
  const used = (path) => path.map((n) => n.q);
  const toTree = (n) => (n.q ? { q: n.q, ya: toTree(n.ya), no: toTree(n.no) } : { leaf: guess(n.rows) });
  const node = (n, path) => {
    const [d, x] = count(n.rows); const left = QS.map((q) => q[0]).filter((q) => !used(path).includes(q) && !banned.includes(q));
    return el('div', { class: `sb-node ${n.q ? '' : guess(n.rows) ? 'daun d' : 'daun x'}` },
      el('div', { class: 'sb-n-kepala' }, el('span', null, `${d} D / ${x} X`), n.q ? el('b', null, `❓ ${qName(n.q)}`) : el('b', null, `🍃 ${guess(n.rows) ? 'diterima' : 'ditolak'} · salah ${errs(n.rows)}`),
        n.q ? onTap(el('button', { class: 'seg-btn', type: 'button' }, '✂ jadikan daun'), () => { delete n.q; delete n.ya; delete n.no; draw(); }) : null),
      n.q ? el('div', { class: 'sb-n-anak' }, el('div', null, el('small', null, 'Ya'), node(n.ya, [...path, n])), el('div', null, el('small', null, 'Tidak'), node(n.no, [...path, n])))
        : n.rows.length && errs(n.rows) && left.length ? el('div', { class: 'seg sb-n-pilih' }, left.map((q) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${qName(q)} · salah ${splitInfo(n.rows, q).total}`), () => { n.q = q; n.ya = { rows: n.rows.filter((r) => r[q]) }; n.no = { rows: n.rows.filter((r) => !r[q]) }; ctx.sound.tap(); draw(); }))) : null);
  };
  function draw() { host.replaceChildren(node(root, [])); onChange?.(toTree(root)); }
  host.reset = (rs) => { for (const k of Object.keys(root)) delete root[k]; root.rows = rs; draw(); };
  host.auto = () => { const t = buildTree(root.rows, QS.map((q) => q[0]).filter((q) => !banned.includes(q))); const copy = (src, n) => { if ('leaf' in src) return; n.q = src.q; n.ya = { rows: n.rows.filter((r) => r[src.q]) }; n.no = { rows: n.rows.filter((r) => !r[src.q]) }; copy(src.ya, n.ya); copy(src.no, n.no); }; for (const k of Object.keys(root)) if (k !== 'rows') delete root[k]; copy(t, root); draw(); };
  host.draw = draw;
  return host;
}
function scoreCard(t, { rows = NEW, nums = true } = {}) {
  const e = evaluate(t, rows); const old = OLD.filter((r) => predict(t, r) !== r.d);
  return el('div', { class: 'sb-skor' },
    el('table', { class: 'sb-matriks kecil' }, el('tr', null, el('th', null, ''), el('th', null, 'Pohon D'), el('th', null, 'Pohon X')), el('tr', null, el('th', null, 'Seharusnya D'), el('td', { class: 'benar' }, e.tp), el('td', { class: 'salah' }, e.fn)), el('tr', null, el('th', null, 'Seharusnya X'), el('td', { class: 'salah' }, e.fp), el('td', { class: 'benar' }, e.tn))),
    nums && el('div', { class: 'sb-angka' }, el('span', null, `Akurasi pelamar baru: ${e.acc}%`), el('span', null, `Pelamar layak diterima · rumah dekat ${e.dekat}% · rumah jauh ${e.jauh}%`), el('span', null, `Salah pada data tahun lalu: ${old.length}${old.length ? ` (${old.map((r) => r.id).join(', ')})` : ''}`)));
}
const sameAsOfficial = (t) => [...OLD, ...NEW].every((r) => predict(t, r) === official(r));

export default {
  id: 'sma-26-seleksi-beasiswa',
  title: 'Seleksi Beasiswa oleh Mesin',
  topic: 'Pohon keputusan, matriks kebingungan, dan bias data',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌳',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Bangun pohon keputusan dari keputusan beasiswa tahun lalu, uji pada pelamar baru, temukan bias yang terbawa dari data, lalu tentukan bagian yang harus diputuskan manusia.',
  extraModes: [
    { id: 'pohon', icon: '🌳', label: 'Pembangun Pohon', desc: 'Bangun pohon sendiri atau otomatis, uji pada pelamar baru, perbaiki label data lama, dan bandingkan kelompok rumah dekat dan jauh', create: createBuilder },
    { id: 'giliran', icon: '⚖️', label: 'Pohon Antartim', desc: 'Tim bergiliran membangun pohon dengan pertanyaan pilihannya; skor dari akurasi pada pelamar baru dan keadilan antarkelompok', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act seleksi-beasiswa' });
    root.append(wrap);
    const biased = buildTree(OLD);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) ask('Syarat resmi: penghasilan rendah DAN (nilai ≥ 85 ATAU prestasi lomba). Tanpa bertanya apa pun, mesin menebak "ditolak" untuk semua. Berapa kali ia salah?', [4, 6, 10, 16].map((x) => [x, x === 6]), 4, dataTable(OLD),
        then(() => splitRound(wrap, ctx, { rows: OLD, qs: QS.map((q) => q[0]), best: 'rendah', title: 'Pertanyaan pertama: bagi keenam belas pelamar.', done: next })));
      else if (r === 1) splitRound(wrap, ctx, { rows: OLD.filter((x) => x.rendah), qs: ['nilai', 'lomba', 'jauh'], best: 'jauh', title: 'Cabang "penghasilan rendah": bagi sepuluh pelamar itu.', done: next });
      else if (r === 2) fillRound(wrap, ctx, { done: next });
      else if (r === 3) traceRound(wrap, ctx, { tree: biased, done: next });
      else if (r === 4) matrixRound(wrap, ctx, { tree: biased, done: then(() => ask('Akurasi = tebakan benar : banyak pelamar. Berapa akurasinya?', [['6 : 8 = 75%', true], ['4 : 8 = 50%'], ['8 : 8 = 100%'], ['2 : 4 = 50%']], 2, scoreCard(biased, { nums: false }),
        then(() => ask('Dari pelamar yang seharusnya diterima, berapa persen diterima pohon bila rumahnya dekat, dan bila rumahnya jauh?', [['Dekat 100% (2 dari 2), jauh 0% (0 dari 2)', true], ['Dekat 50%, jauh 50%'], ['Dekat 75%, jauh 75%'], ['Dekat 0%, jauh 100%']], 1, el('div', { class: 'sb-dua' }, scoreCard(biased, { nums: false }), dataTable(NEW.filter((x) => x.d))))))) });
      else if (r === 5) ask('Apa persamaan semua pelamar yang salah ditolak pohon (B2 dan B5)?', [['Rumahnya jauh, padahal mereka memenuhi syarat resmi', true], ['Nilainya di bawah 85'], ['Penghasilan keluarganya tinggi'], ['Tidak punya prestasi lomba']], 1, dataTable(NEW.filter((x) => ['B2', 'B5'].includes(x.id))),
        then(() => ask('P03 dan P10 memenuhi syarat resmi. Mengapa mereka ditolak tahun lalu?', [['Kemungkinan tidak bisa datang ke wawancara di kota yang jauh; data mencatat hambatan itu seolah-olah "tidak layak"', true], ['Mereka tidak memenuhi syarat'], ['Mesin yang menolak mereka'], ['Kuotanya sudah penuh']], 1, dataTable(OLD, { hi: ['P03', 'P10'] }),
          then(() => ask('Mengapa pohon yang kesalahannya 0 pada data tahun lalu justru tidak adil?', [['Ia meniru keputusan lama dengan sempurna, termasuk ketidakadilannya: bias terbawa dari data', true], ['Karena mesin membenci desa'], ['Karena datanya terlalu sedikit untuk dihitung'], ['Pohon itu adil; kesalahan 0 berarti benar']])))));
      else if (r === 6) {
        const msg = el('p', { class: 'reveal info' }, 'Bangun pohon tanpa pertanyaan "Rumah jauh". Pilih pertanyaan di setiap kotak; angka "salah" membantu memilih.');
        let cur = null; const card = el('div');
        const b = treeBuilder(ctx, { rows: OLD, banned: ['jauh'], onChange: (t) => { cur = t; } });
        wrap.append(el('p', { class: 'prompt' }, 'Pohon tanpa pertanyaan "rumah jauh"'), el('div', { class: 'sb-dua' }, b, card), msg, el('div', { class: 'kode-baris' }, button('Selesai membangun', () => {
          if (!sameAsOfficial(cur)) { ctx.mistake(); say(msg, 'bad', 'Masih ada kotak yang bisa dibagi supaya kesalahannya berkurang.'); return; }
          say(msg, '', 'Pohon ini sama dengan syarat resmi.'); setTimeout(then(() => ask('Berapa kesalahannya pada data tahun lalu, dan berapa akurasinya pada pelamar baru?', [['2 kesalahan (P03, P10); akurasi 100%', true], ['0 kesalahan; akurasi 75%'], ['2 kesalahan (B2, B5); akurasi 75%'], ['4 kesalahan; akurasi 50%']], 1, el('div', { class: 'sb-dua' }, scoreCard(cur, { nums: false }), dataTable(OLD, { hi: ['P03', 'P10'] })))), 1600);
        }, 'primary')));
        b.draw();
      } else if (r === 7) ask('Pohon mana yang lebih baik, dan apa pelajarannya tentang angka akurasi?', [['Pohon tanpa "rumah jauh": akurasi pada data lama hanya mengukur kemiripan dengan keputusan lama; bila keputusan lama berbias, akurasi tinggi berarti meniru biasnya', true], ['Pohon pertama, karena kesalahannya 0 pada data lama'], ['Keduanya sama baiknya'], ['Tidak perlu pohon; pilih acak saja']], 1,
        el('div', { class: 'sb-dua' }, el('div', null, el('b', null, 'Pohon dengan rumah jauh'), scoreCard(biased)), el('div', null, el('b', null, 'Pohon tanpa rumah jauh'), scoreCard(buildTree(OLD, ['rendah', 'nilai', 'lomba'])))));
      else if (r === 8) {
        const res = {};
        const msg = el('p', { class: 'reveal info' }, 'M: boleh dibantu mesin. H: harus diputuskan manusia.');
        const rows = el('div', { class: 'sb-tugas' });
        const draw = () => rows.replaceChildren(...TASKS.map(([k, t, a]) => el('div', { class: `sb-t-baris ${k in res ? 'beres' : ''}` }, el('span', null, `${k}. ${t}`), k in res ? el('b', null, a === 'M' ? 'M · mesin membantu' : 'H · manusia') : el('div', { class: 'seg' }, [['M', 'M · mesin'], ['H', 'H · manusia']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
          if (v !== a) { ctx.mistake(); say(msg, 'bad', a === 'H' ? 'Tugas ini menyangkut penilaian, keadaan khusus, atau tanggung jawab: manusia yang memutuskan.' : 'Ini pekerjaan hitung atau menyaring yang boleh dibantu mesin, lalu diperiksa manusia.'); return; }
          res[k] = v; ctx.sound.tap(); draw();
          if (Object.keys(res).length === TASKS.length) { say(msg, '', 'Mesin membantu hitung dan menyaring; syarat, keadaan khusus, keberatan, dan keputusan akhir dipegang manusia.'); next(); }
        }))))));
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Mesin membantu, manusia memutuskan'), rows, msg);
      } else ask('Tantangan: kolom "rumah jauh" dihapus, tetapi ditambah kolom "asal SMP". Semua pelamar dari SMP pegunungan juga tinggal jauh. Apa yang bisa terjadi?', [['Pohon memilih "asal SMP" sebagai pengganti; biasnya kembali, hanya lebih tersembunyi (variabel pengganti)', true], ['Bias hilang karena kolomnya sudah dihapus'], ['Pohon tidak bisa dibangun'], ['Semua pelamar diterima']], 1, null,
        then(() => ask('Cara mana yang membantu mengatasinya?', [['Memperbaiki label data lama yang tidak adil dan memeriksa hasil model untuk setiap kelompok wilayah sebelum dipakai', true], ['Menambah lebih banyak kolom tentang tempat tinggal'], ['Menyembunyikan hasil per kelompok'], ['Memakai data tahun lalu apa adanya']])));
    }
    render();
  },
};

// --- extra modes ---
function createBuilder(root, ctx) {
  const wrap = el('div', { class: 'act seleksi-beasiswa' });
  root.append(wrap);
  let fixed = false; const banned = [];
  const card = el('div');
  let b;
  function setup() {
    b = treeBuilder(ctx, { rows: fixed ? FIXED : OLD, banned, onChange: (t) => card.replaceChildren(scoreCard(t)) });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pembangun pohon keputusan'),
      el('div', { class: 'kode-baris' }, el('div', { class: 'seg' }, [[false, 'Data tahun lalu'], [true, 'Data diperbaiki (P03, P10 = D)']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${fixed === v ? 'on' : ''}`, type: 'button' }, l), () => { fixed = v; setup(); }))),
        el('div', { class: 'seg' }, QS.map(([q, l]) => onTap(el('button', { class: `seg-btn ${banned.includes(q) ? '' : 'on'}`, type: 'button' }, `${banned.includes(q) ? '🚫' : '✓'} ${l}`), () => { if (banned.includes(q)) banned.splice(banned.indexOf(q), 1); else banned.push(q); setup(); }))),
        button('⚙ Bangun otomatis', () => b.auto(), 'primary'), button('Mulai dari awal', () => setup())),
      el('div', { class: 'sb-dua' }, b, card), el('details', { class: 'sb-data' }, el('summary', null, 'Lihat data'), dataTable(fixed ? FIXED : OLD, { hi: ['P03', 'P10'] }), dataTable(NEW)));
    b.draw();
  }
  setup();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act seleksi-beasiswa' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0;
    function turn() {
      if (k >= nT) { finishBoard(wrap, ctx, { title: 'Pohon antartim selesai', pts, again: () => pickTeams(wrap, 'Pohon Antartim', start) }); return; }
      let cur = null; const card = el('div');
      const b = treeBuilder(ctx, { rows: OLD, onChange: (t) => { cur = t; card.replaceChildren(scoreCard(t)); } });
      const msg = el('p', { class: 'reveal info' }, 'Skor = banyak pelamar baru yang ditebak benar (0–8) + 2 bila pelamar layak dari rumah dekat dan jauh diterima sama besar.');
      wrap.replaceChildren(scoreBar(pts, k), el('p', { class: 'prompt' }, `Tim ${k + 1}: bangun pohonmu`), el('div', { class: 'sb-dua' }, b, card), msg, el('div', { class: 'kode-baris' }, button('Kunci pohon ini', () => {
        const e = evaluate(cur); const right = e.tp + e.tn; const fair = e.dekat === e.jauh ? 2 : 0;
        pts[k] += right + fair; ctx.sound.good();
        say(msg, '', `Tim ${k + 1}: ${right} benar${fair ? ' + 2 karena adil' : `, selisih kelompok ${Math.abs(e.dekat - e.jauh)}%`} = ${right + fair} poin.`);
        k++; setTimeout(turn, 3000);
      }, 'primary')));
      b.draw();
    }
    turn();
  }
  pickTeams(wrap, 'Pohon Antartim', start);
}
