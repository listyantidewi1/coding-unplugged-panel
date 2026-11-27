// Seleksi Beasiswa oleh Mesin — SMA/SMK (16–18 tahun), pembelajaran mesin dan bias.
// Mesin Penyaring Beasiswa: a decision tree learnt from last year's (biased)
// decisions with question levers, walked by new applicants, a confusion matrix
// and a fairness report, a bias detective, relabelling, and a proxy variable.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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



// --- game data (Mesin Penyaring Beasiswa) ---
const QN = { ...Object.fromEntries(QS), smp: 'Asal SMP pegunungan?' };
const SLOTS = [
  ['Penghasilan rendah? Tidak →', (r) => !r.rendah, 'ditolak'],
  ['Penghasilan rendah? Ya →', (r) => r.rendah, 'Rumah jauh?'],
  ['Rumah jauh? Ya →', (r) => r.rendah && r.jauh, 'ditolak'],
  ['Nilai ≥ 85? Ya →', (r) => r.rendah && !r.jauh && r.nilai, 'diterima'],
  ['Prestasi lomba? Ya →', (r) => r.rendah && !r.jauh && !r.nilai && r.lomba, 'diterima'],
  ['Prestasi lomba? Tidak →', (r) => r.rendah && !r.jauh && !r.nilai && !r.lomba, 'ditolak'],
];
const PALETTE = ['diterima', 'ditolak', 'Rumah jauh?', 'Nilai ≥ 85?', 'Prestasi lomba?'];
export const FIXES = [
  [true, '🏷️ Perbaiki label data lama yang tidak adil (P03, P10)'],
  [true, '📋 Pakai hanya kolom yang sesuai syarat resmi'],
  [true, '🗺️ Periksa hasil model untuk setiap wilayah sebelum dipakai'],
  [true, '💻 Buat seleksi setara, misalnya wawancara daring'],
  [false, '➕ Tambah lebih banyak kolom tentang tempat tinggal', 'Kolom tempat tinggal lain hanya menjadi pengganti baru bagi "rumah jauh".'],
  [false, '🙈 Sembunyikan hasil per wilayah', 'Bila hasil per wilayah disembunyikan, biasnya tidak akan ketahuan.'],
];

const HEAD26 = {
  malas: ['Pertanyaan Pertama', 'Hitung kesalahan mesin malas, lalu pasang pertanyaan pertama yang paling sedikit salah.'],
  cabang: ['Tumbuhkan Cabang', 'Bagi sepuluh pelamar berpenghasilan rendah dengan pertanyaan terbaik.'],
  pohon: ['Pohon Lengkap', 'Isi setiap kotak pohon sampai kesalahan pada data tahun lalu 0.'],
  uji: ['Uji Pelamar Baru', 'Turunkan setiap pelamar baru dari puncak pohon sampai ke daun.'],
  matriks: ['Matriks dan Rapor Keadilan', 'Isi matriks kebingungan, lalu bandingkan pelamar rumah dekat dan jauh.'],
  detektif: ['Detektif Bias', 'Temukan siapa yang salah ditolak, ciri bersamanya, dan asal biasnya.'],
  duel: ['Pohon Tanpa Rumah Jauh', 'Bangun pohon tanpa pertanyaan "Rumah jauh?" sampai sama dengan syarat resmi.'],
  label: ['Perbaiki Label', 'Perbaiki keputusan lama yang tidak adil dan lihat pohonnya berubah.'],
  tugas: ['Mesin atau Manusia', 'Seret setiap tugas: boleh dibantu mesin, atau harus diputuskan manusia.'],
  bos: ['Variabel Pengganti', 'Kolom "rumah jauh" dihapus, tetapi ada kolom "asal SMP". Bongkar biasnya.'],
};

// --- game pieces ---
const msgLine = (t) => el('p', { class: 'reveal info' }, t);
const pc = (r, extra = '') => el('span', { class: `sb26-kartu ${r.d ? 'd' : 'x'} ${extra}`, 'data-id': r.id }, r.id, el('small', null, r.d ? 'D' : 'X'));
const attrs = (r, qs = QS.map((q) => q[0])) => el('span', { class: 'sb26-ciri' }, qs.map((q) => el('i', { class: r[q] ? 'ya' : '' }, `${{ rendah: '💰', nilai: '📝', lomba: '🏅', jauh: '🏔️', smp: '🏫' }[q]}${yn(r[q])}`)));
const legend = () => el('small', { class: 'sb26-legenda' }, '💰 penghasilan rendah · 📝 nilai ≥ 85 · 🏅 prestasi lomba · 🏔️ rumah jauh · Y ya, T tidak');

function treeView(t, { cur = null, path = [], onNode = null } = {}) {
  const node = (n, label) => {
    const leaf = 'leaf' in n;
    const cls = `${n === cur ? 'kini' : ''} ${path.includes(n) ? 'jejak' : ''}`;
    const box = leaf ? el('span', { class: `sb26-daun ${n.leaf ? 'd' : 'x'} ${cls}` }, n.leaf ? '✅ diterima' : '❌ ditolak')
      : onNode ? onTap(el('button', { class: `sb26-tanya ${cls}`, type: 'button', 'data-q': n.q }, `❓ ${QN[n.q]}`), (e) => onNode(n, e.currentTarget))
        : el('span', { class: `sb26-tanya ${cls}` }, `❓ ${QN[n.q]}`);
    return el('li', null, el('div', { class: 'sb26-simpul' }, label ? el('small', null, label) : null, box), leaf ? null : el('ul', null, node(n.ya, 'Ya'), node(n.no, 'Tidak')));
  };
  return el('ul', { class: 'sb26-pohon' }, node(t, null));
}

// Pull a lever: the cards fall into Ya/Tidak chutes; then install the best lever.
function sieveRound(area, ctx, { rows, qs, best, done }) {
  const tried = {}; let pick = null; let fin = false;
  const msg = msgLine('Tarik setiap tuas pertanyaan untuk membagi kartu pelamar. Kartu bergaris merah = tebakan salah.');
  const host = el('div', { class: 'sb26-papan' });
  const draw = () => {
    const s = pick && splitInfo(rows, pick);
    const chute = (l, rs, [d, x], e) => { const g = d > x; return el('div', { class: 'sb26-corong' }, el('b', null, `${l} → tebak ${g ? 'diterima' : 'ditolak'}`), el('div', { class: 'sb26-tumpuk' }, rs.map((r) => pc(r, r.d !== g ? 'salah' : ''))), el('small', null, `salah ${e}`)); };
    fill(host, el('div', { class: 'sb26-tuas-tuas' }, qs.map((q) => onTap(el('button', { class: `sb26-tuas ${pick === q ? 'on' : ''}`, type: 'button', 'data-q': q }, el('span', null, `🎚️ ${QN[q]}`), el('small', null, tried[q] ? `salah ${tried[q].total}` : 'belum dicoba')), () => { if (fin) return; pick = q; tried[q] = splitInfo(rows, q); ctx.sound.tap(); draw(); }))),
      pick ? el('div', { class: 'sb26-corong-corong' }, chute('Ya', rows.filter((r) => r[pick]), s.ya, s.eYa), chute('Tidak', rows.filter((r) => !r[pick]), s.no, s.eNo))
        : el('div', { class: 'sb26-tumpuk besar' }, rows.map((r) => pc(r))),
      el('div', { class: 'kode-baris' }, button(`📌 Pasang ${pick ? QN[pick] : 'tuas ini'}`, () => {
        if (fin || !pick) return;
        if (Object.keys(tried).length < qs.length) { ctx.mistake(); say(msg, 'bad', 'Coba semua tuas dulu, lalu bandingkan kesalahannya.'); return; }
        if (pick !== best) { ctx.mistake(); shake(host); say(msg, 'bad', `${QN[pick]} salah ${tried[pick].total} kali. Ada tuas yang lebih sedikit salahnya.`); return; }
        fin = true; ctx.sound.good(); say(msg, '', `Mesin memasang ${QN[pick]} dengan ${tried[pick].total} kesalahan.${best === 'jauh' ? ' Pertanyaan "rumah jauh" bukan syarat resmi, tetapi paling cocok dengan keputusan lama!' : ''}`); done();
      }, 'primary')));
  };
  draw();
  area.append(host, msg);
}

function lazyRound(area, ctx, { done }) {
  let hit = 0; const need = OLD.filter((r) => r.d).length;
  const msg = msgLine('Mesin malas menolak semua pelamar tanpa bertanya. Ketuk setiap kartu yang membuatnya salah.');
  const cards = OLD.map((r) => onTap(el('button', { class: `sb26-kartu tombol ${r.d ? 'd' : 'x'}`, type: 'button', 'data-id': r.id }, r.id, el('small', null, r.d ? 'D' : 'X')), (e) => {
    const b = e.currentTarget; if (b.classList.contains('salah') || hit === need) return;
    if (!r.d) { ctx.mistake(); shake(b); say(msg, 'bad', `${r.id} memang ditolak panitia (X), jadi tebakan "ditolak" benar.`); return; }
    b.classList.add('salah'); ctx.sound.tap(); hit++;
    if (hit < need) { say(msg, '', `Salah ${hit}.`); return; }
    say(msg, '', `Mesin malas salah ${need} kali dari 16. Ia perlu bertanya.`);
    setTimeout(() => { area.replaceChildren(); sieveRound(area, ctx, { rows: OLD, qs: QS.map((q) => q[0]), best: 'rendah', done }); }, 2600);
  }));
  area.append(el('p', { class: 'sb26-sub' }, '🗂️ 16 kartu pelamar tahun lalu · D diterima, X ditolak'), el('div', { class: 'sb26-tumpuk besar' }, cards), msg);
}

function growRound(area, ctx, { done }) {
  const filled = [];
  const msg = msgLine('Kotak yang menyala menunggu isian. Lihat pelamar yang sampai di kotak itu, lalu ketuk keping yang tepat.');
  const host = el('div', { class: 'sb26-papan' });
  const draw = () => {
    const k = filled.length; const slot = SLOTS[k];
    const f = (i) => el('span', { class: `sb26-isian ${i === k ? 'kini' : ''} ${i < k ? 'isi' : ''}` }, filled[i] ?? '……');
    const tree = el('div', { class: 'sb26-pohon-teks' },
      el('div', null, '❓ Penghasilan rendah?'), el('div', { class: 'l1' }, '├─ Tidak → ', f(0)), el('div', { class: 'l1' }, '└─ Ya → ', f(1)),
      el('div', { class: 'l2' }, '├─ Ya → ', f(2)), el('div', { class: 'l2' }, '└─ Tidak → ❓ Nilai ≥ 85?'),
      el('div', { class: 'l3' }, '├─ Ya → ', f(3)), el('div', { class: 'l3' }, '└─ Tidak → ❓ Prestasi lomba?'),
      el('div', { class: 'l4' }, '├─ Ya → ', f(4)), el('div', { class: 'l4' }, '└─ Tidak → ', f(5)));
    fill(host, el('div', { class: 'sb26-dua' }, tree, el('div', { class: 'sb26-sisi' },
      slot ? [el('small', null, `Pelamar di kotak "${slot[0]}"`), el('div', { class: 'sb26-tumpuk' }, OLD.filter(slot[1]).map((r) => pc(r))),
        el('div', { class: 'sb26-keping-keping' }, PALETTE.map((o) => onTap(el('button', { class: 'sb26-keping', type: 'button', 'data-o': o }, o), (e) => {
          if (filled.length !== k) return;
          if (o !== slot[2]) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', k === 1 ? 'Di cabang ini mesin memasang pertanyaan yang salahnya hanya 1 (Misi sebelumnya).' : 'Lihat kartu di kotak ini: keputusan mana yang terbanyak? Bila semuanya sama, kotak ini menjadi daun.'); return; }
          filled.push(o); ctx.sound.tap(); draw();
          if (filled.length === SLOTS.length) { say(msg, '', 'Pohon lengkap. Kesalahannya pada data tahun lalu 0: pohon meniru keputusan lama dengan sempurna.'); done(); }
          else say(msg, '', 'Tepat.');
        })))] : el('b', null, '🌳 Pohon selesai'))));
  };
  draw();
  area.append(host, msg);
}

function walkRound(area, ctx, { tree, done }) {
  let k = 0; let at = tree; let path = []; const res = [];
  const msg = msgLine('Pelamar berdiri di puncak pohon. Jawab pertanyaan yang menyala sesuai ciri pelamar sampai tiba di daun.');
  const host = el('div', { class: 'sb26-papan' });
  const draw = () => {
    const r = NEW[k];
    fill(host, el('div', { class: 'sb26-dua' }, treeView(tree, { cur: at, path }),
      el('div', { class: 'sb26-sisi' }, r ? [el('div', { class: 'sb26-pelamar' }, el('b', null, `🧑‍🎓 ${r.id}`), attrs(r)), legend(),
        el('div', { class: 'sb26-yt' }, [[true, '✔ Ya'], [false, '✘ Tidak']].map(([v, l]) => onTap(el('button', { class: `sb26-jawab ${v ? 'ya' : 'tidak'}`, type: 'button', 'data-v': v ? '1' : '0' }, l), (e) => {
          if ('leaf' in at || !NEW[k]) return;
          if (r[at.q] !== v) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `Lihat ciri ${r.id}: ${QN[at.q]} ${yn(r[at.q]) === 'Y' ? 'Ya' : 'Tidak'}.`); return; }
          path.push(at); at = v ? at.ya : at.no; ctx.sound.tap();
          if ('leaf' in at) {
            res.push(at.leaf); say(msg, at.leaf === r.d ? '' : 'info', `${r.id} tiba di daun "${at.leaf ? 'diterima' : 'ditolak'}". Panitia: ${r.d ? 'diterima' : 'ditolak'}.`);
            draw();
            setTimeout(() => { k++; at = tree; path = []; draw(); if (k === NEW.length) { say(msg, '', 'B2 dan B5 seharusnya diterima, tetapi pohon menolak mereka.'); done(); } }, 1300);
            return;
          }
          draw();
        })))] : null,
        el('div', { class: 'sb26-hasil' }, NEW.map((x, i) => el('span', { class: i < res.length ? (res[i] === x.d ? 'cocok' : 'beda') : i === k ? 'kini' : '' }, x.id, el('small', null, i < res.length ? (res[i] ? 'D' : 'X') : '·')))))));
  };
  draw();
  area.append(host, msg);
}

function matrixFairRound(area, ctx, { tree, done }) {
  const placed = {}; let sel = null;
  const cell = (r) => (r.d ? (predict(tree, r) ? 'tp' : 'fn') : (predict(tree, r) ? 'fp' : 'tn'));
  const msg = msgLine('Ketuk kartu pelamar, lalu ketuk kotak matriks yang tepat.');
  const host = el('div', { class: 'sb26-papan' });
  const fair = () => {
    const L = NEW.filter((r) => r.d); const got = { dekat: [], jauh: [] }; let left = L.length;
    const bins = [['dekat', '🏠 Rumah dekat'], ['jauh', '🏔️ Rumah jauh']].map(([k, l]) => el('div', { class: 'sb26-wadah', 'data-drop': k }, el('b', null, l), el('div', { class: 'sb26-tumpuk' }), el('div', { class: 'sb26-batang' }, el('i'), el('span', null, '–'))));
    const tray = el('div', { class: 'sb26-baki' }, ctx.rand.shuffle(L.slice()).map((r) => el('div', { class: 'sb26-seret', 'data-drag': r.id }, `${r.id} · pohon ${predict(tree, r) ? 'D' : 'X'} `, attrs(r))));
    const board = el('div', { class: 'sb26-papan' }, el('p', { class: 'sb26-sub' }, '⚖️ Rapor keadilan: pelamar yang seharusnya diterima'), el('div', { class: 'sb26-wadah-wadah' }, bins), tray, legend());
    dnd(board, (card, box) => {
      const r = NEW.find((x) => x.id === card.dataset.drag); const k = r.jauh ? 'jauh' : 'dekat';
      if (box.dataset.drop !== k) { ctx.mistake(); shake(card); say(msg, 'bad', `Lihat 🏔️ pada kartu ${r.id}.`); return; }
      card.remove(); got[k].push(r); box.querySelector('.sb26-tumpuk').append(pc(r, predict(tree, r) ? '' : 'salah')); ctx.sound.tap();
      const p = Math.round((got[k].filter((x) => predict(tree, x)).length / got[k].length) * 100);
      box.querySelector('.sb26-batang i').style.width = `${p}%`; box.querySelector('.sb26-batang span').textContent = `${p}% diterima pohon`;
      if (--left) return;
      say(msg, '', 'Rumah dekat 2 dari 2 diterima (100%), rumah jauh 0 dari 2 (0%). Akurasi 75% menyembunyikan ketidakadilan ini.'); done();
    });
    fill(area, board, msg); say(msg, 'info', 'Seret setiap pelamar layak ke kelompok rumahnya. Persentase yang diterima pohon terhitung sendiri.');
  };
  const box = (k) => onTap(el('td', { class: `sb26-sel ${k === 'tp' || k === 'tn' ? 'benar' : 'salah'}`, 'data-c': k }, el('b', null, Object.values(placed).filter((x) => x === k).length), el('div', { class: 'sb26-tumpuk' }, NEW.filter((r) => placed[r.id] === k).map((r) => pc(r)))), () => {
    if (!sel) return; const r = NEW.find((x) => x.id === sel);
    if (cell(r) !== k) { ctx.mistake(); shake(host); say(msg, 'bad', `${r.id}: panitia ${r.d ? 'menerima' : 'menolak'}, pohon ${predict(tree, r) ? 'menerima' : 'menolak'}.`); return; }
    placed[sel] = k; sel = null; ctx.sound.tap(); draw();
    if (Object.keys(placed).length === NEW.length) { say(msg, '', 'Benar 6 dari 8: akurasi 6 : 8 = 75%. B2 dan B5 salah ditolak.'); setTimeout(fair, 3000); }
  });
  const draw = () => fill(host, el('div', { class: 'sb26-tumpuk' }, NEW.filter((r) => !(r.id in placed)).map((r) => onTap(el('button', { class: `sb26-kartu tombol ${r.d ? 'd' : 'x'} ${sel === r.id ? 'pilih' : ''}`, type: 'button', 'data-id': r.id }, r.id, el('small', null, `panitia ${r.d ? 'D' : 'X'} · pohon ${predict(tree, r) ? 'D' : 'X'}`)), () => { sel = r.id; draw(); }))),
    el('table', { class: 'sb26-matriks' }, el('tr', null, el('th', null, ''), el('th', null, 'Pohon: diterima'), el('th', null, 'Pohon: ditolak')), el('tr', null, el('th', null, 'Seharusnya diterima'), box('tp'), box('fn')), el('tr', null, el('th', null, 'Seharusnya ditolak'), box('fp'), box('tn'))));
  draw();
  area.append(host, msg);
}

function detectiveRound(area, ctx, { tree, done }) {
  const msg = msgLine('Langkah 1: ketuk pelamar baru yang salah ditolak pohon.');
  let hit = 0;
  const stepC = () => {
    let got = 0;
    const cards = OLD.map((r) => onTap(el('button', { class: `sb26-kartu tombol lebar ${r.d ? 'd' : 'x'}`, type: 'button', 'data-id': r.id }, r.id, attrs(r), el('small', null, r.d ? 'D' : 'X')), (e) => {
      const b = e.currentTarget; if (b.classList.contains('kena') || got === 2) return;
      if (!(official(r) && !r.d)) { ctx.mistake(); shake(b); say(msg, 'bad', official(r) ? `${r.id} memenuhi syarat dan memang diterima.` : `${r.id} tidak memenuhi syarat resmi, jadi wajar ditolak.`); return; }
      b.classList.add('kena'); ctx.sound.tap();
      if (++got < 2) { say(msg, '', 'Satu lagi.'); return; }
      say(msg, '', 'P03 dan P10 memenuhi syarat resmi tetapi ditolak tahun lalu; keduanya tinggal jauh, mungkin tidak bisa datang ke wawancara di kota. Pohon belajar ketidakadilan itu dari data.'); done();
    }));
    fill(area, el('p', { class: 'sb26-sub' }, '📜 Syarat resmi: 💰 penghasilan rendah DAN (📝 nilai ≥ 85 ATAU 🏅 prestasi lomba)'), el('div', { class: 'sb26-tumpuk' }, cards), legend(), msg);
    say(msg, 'info', 'Langkah 3: di data tahun lalu, ketuk dua pelamar yang memenuhi syarat resmi tetapi ditolak.');
  };
  const stepB = () => {
    const rows = ['B1', 'B6', 'B2', 'B5'].map((id) => NEW.find((r) => r.id === id));
    let fin = false;
    const head = QS.map(([q, l]) => onTap(el('button', { class: 'sb26-kolom', type: 'button', 'data-q': q }, l), (e) => {
      if (fin) return;
      if (q !== 'jauh') { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `Kolom ini tidak memisahkan B2 dan B5 dari B1 dan B6.`); return; }
      fin = true; e.currentTarget.classList.add('kena'); ctx.sound.good(); say(msg, '', 'Rumah jauh! B2 dan B5 memenuhi syarat resmi, tetapi ditolak karena rumahnya jauh.'); setTimeout(stepC, 3000);
    }));
    fill(area, el('table', { class: 'sb26-tabel' }, el('tr', null, el('th', null, 'Pelamar'), head.map((h) => el('th', null, h)), el('th', null, 'Pohon')),
      rows.map((r) => el('tr', { class: predict(tree, r) ? '' : 'tanda' }, el('td', null, r.id), QS.map(([q]) => el('td', { class: r[q] ? 'ya' : '' }, yn(r[q]))), el('td', null, predict(tree, r) ? '✅ D' : '❌ X')))), msg);
    say(msg, 'info', 'Langkah 2: semua pelamar ini layak. Ketuk judul kolom yang membedakan yang ditolak (merah) dari yang diterima.');
  };
  const cards = NEW.map((r) => onTap(el('button', { class: `sb26-kartu tombol lebar ${r.d ? 'd' : 'x'}`, type: 'button', 'data-id': r.id }, r.id, el('small', null, `panitia ${r.d ? 'D' : 'X'} · pohon ${predict(tree, r) ? 'D' : 'X'}`)), (e) => {
    const b = e.currentTarget; if (b.classList.contains('kena') || hit === 2) return;
    if (!(r.d && !predict(tree, r))) { ctx.mistake(); shake(b); say(msg, 'bad', `${r.id}: pohon dan panitia sepakat.`); return; }
    b.classList.add('kena'); ctx.sound.tap();
    if (++hit < 2) { say(msg, '', 'Satu lagi.'); return; }
    say(msg, '', 'B2 dan B5 salah ditolak.'); setTimeout(stepB, 2200);
  }));
  area.append(el('div', { class: 'sb26-tumpuk' }, cards), msg);
}

function noFarRound(area, ctx, { done }) {
  const msg = msgLine('Ketuk pertanyaan di setiap kotak; angka "salah" membantu memilih. Kotak tanpa kesalahan otomatis menjadi daun.');
  let cur = null; let fin = false; const card = el('div');
  const b = treeBuilder(ctx, { rows: OLD, banned: ['jauh'], onChange: (t) => { cur = t; card.replaceChildren(scoreCard(t)); } });
  area.append(el('div', { class: 'sb26-dua lebar' }, b, card), msg, el('div', { class: 'kode-baris' }, button('Selesai membangun', () => {
    if (fin) return;
    if (!sameAsOfficial(cur)) { ctx.mistake(); say(msg, 'bad', 'Masih ada kotak yang bisa dibagi supaya kesalahannya berkurang.'); return; }
    fin = true; ctx.sound.good(); say(msg, '', 'Pohon ini sama dengan syarat resmi: salah 2 pada data lama (P03, P10), tetapi akurasi pelamar baru 100% dan rumah dekat maupun jauh sama-sama 100%.'); done();
  }, 'primary')));
  b.draw();
}

function relabelRound(area, ctx, { done }) {
  const data = OLD.map((r) => ({ ...r }));
  const msg = msgLine('Pohon A dilatih dengan keempat pertanyaan. Ketuk label keputusan yang tidak adil di data lama untuk memperbaikinya.');
  const host = el('div', { class: 'sb26-papan' }); let fixed = 0;
  const draw = () => {
    const t = buildTree(data);
    fill(host, el('div', { class: 'sb26-dua' }, el('div', { class: 'sb26-sisi' }, el('b', null, '🌳 Pohon A (dilatih ulang)'), treeView(t)),
      el('div', { class: 'sb26-sisi' }, el('small', null, '🗂️ Data tahun lalu: ketuk label D/X untuk membaliknya'), el('div', { class: 'sb26-tumpuk' }, data.map((r) => onTap(el('button', { class: `sb26-kartu tombol lebar ${r.d ? 'd' : 'x'} ${r.fix ? 'kena' : ''}`, type: 'button', 'data-id': r.id }, r.id, attrs(r), el('small', null, r.d ? 'D' : 'X')), (e) => {
        if (fixed === 2 || r.fix) return;
        if (!(official(r) && !r.d)) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `Label ${r.id} sudah sesuai syarat resmi.`); return; }
        r.d = true; r.fix = true; fixed++; ctx.sound.tap(); draw();
        if (fixed < 2) { say(msg, '', 'Satu lagi.'); return; }
        say(msg, '', 'Setelah label P03 dan P10 diperbaiki, pohon dengan empat pertanyaan pun tidak lagi memakai "rumah jauh": sama dengan syarat resmi. Memperbaiki data lebih penting daripada menyembunyikan kolom.'); done();
      }))), legend())));
  };
  draw();
  area.append(el('p', { class: 'sb26-sub' }, '📜 Syarat resmi: 💰 penghasilan rendah DAN (📝 nilai ≥ 85 ATAU 🏅 prestasi lomba)'), host, msg);
}

function taskRound(area, ctx, { done }) {
  const msg = msgLine('Seret setiap kartu tugas ke kotak yang tepat, atau ketuk kartu lalu ketuk kotaknya.');
  const bins = [['M', '🤖 M · boleh dibantu mesin'], ['H', '🧑‍⚖️ H · harus diputuskan manusia']].map(([k, l]) => el('div', { class: 'sb26-wadah', 'data-drop': k }, el('b', null, l), el('div', { class: 'sb26-tumpuk' })));
  const tray = el('div', { class: 'sb26-baki' }, ctx.rand.shuffle(TASKS.slice()).map(([k, t]) => el('div', { class: 'sb26-seret', 'data-drag': k }, el('b', null, k), t)));
  const board = el('div', { class: 'sb26-papan' }, el('div', { class: 'sb26-wadah-wadah' }, bins), tray);
  let left = TASKS.length;
  dnd(board, (card, box) => {
    const [k, , a] = TASKS.find((x) => x[0] === card.dataset.drag);
    if (box.dataset.drop !== a) { ctx.mistake(); shake(card); say(msg, 'bad', a === 'H' ? 'Tugas ini menyangkut penilaian, keadaan khusus, atau tanggung jawab: manusia yang memutuskan.' : 'Ini pekerjaan hitung atau menyaring yang boleh dibantu mesin, lalu diperiksa manusia.'); return; }
    card.remove(); box.querySelector('.sb26-tumpuk').append(el('span', { class: 'sb26-huruf' }, k)); ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    say(msg, '', 'Mesin membantu menghitung dan menyaring; syarat, keadaan khusus, keberatan, dan keputusan akhir dipegang manusia.'); done();
  });
  area.append(board, msg);
}

function proxyRound(area, ctx, { done }) {
  const data = OLD.map((r) => ({ ...r, smp: r.jauh }));
  const t = buildTree(data, ['rendah', 'nilai', 'lomba', 'smp']);
  const msg = msgLine('Mesin dilatih ulang tanpa "rumah jauh", tetapi dengan kolom "asal SMP". Ketuk simpul pohon yang membawa biasnya kembali.');
  let fin = false;
  const fixes = () => {
    const bins = [['ya', '✅ Membantu mengatasi'], ['tidak', '❌ Tidak membantu']].map(([k, l]) => el('div', { class: 'sb26-wadah', 'data-drop': k }, el('b', null, l), el('div', { class: 'sb26-tumpuk' })));
    const tray = el('div', { class: 'sb26-baki' }, ctx.rand.shuffle(FIXES.map((f, i) => i)).map((i) => el('div', { class: 'sb26-seret', 'data-drag': i }, FIXES[i][1])));
    const board = el('div', { class: 'sb26-papan' }, el('div', { class: 'sb26-wadah-wadah' }, bins), tray);
    let left = FIXES.length;
    dnd(board, (card, box) => {
      const f = FIXES[+card.dataset.drag];
      if ((box.dataset.drop === 'ya') !== f[0]) { ctx.mistake(); shake(card); say(msg, 'bad', f[0] ? 'Cara ini justru membantu: pikirkan lagi.' : f[2]); return; }
      card.remove(); box.querySelector('.sb26-tumpuk').append(el('span', { class: 'sb26-cara' }, f[1])); ctx.sound.tap();
      if (--left) { say(msg, '', 'Tepat.'); return; }
      say(msg, '', 'Menghapus satu kolom tidak cukup. Perbaiki labelnya, pakai kolom sesuai syarat, periksa hasil per wilayah, dan buat proses seleksinya setara.'); done();
    });
    fill(area, board, msg); say(msg, 'info', 'Seret setiap cara ke kotak yang tepat.');
  };
  area.append(el('div', { class: 'sb26-dua' }, treeView(t, { onNode: (n, b) => {
    if (fin) return;
    if (n.q !== 'smp') { ctx.mistake(); shake(b); say(msg, 'bad', `${QN[n.q]} adalah syarat resmi. Cari pertanyaan yang bukan syarat.`); return; }
    fin = true; b.classList.add('bias'); ctx.sound.good();
    say(msg, '', 'Semua pelamar dari SMP pegunungan juga tinggal jauh, jadi "asal SMP" menjadi pengganti "rumah jauh". Biasnya kembali, hanya lebih tersembunyi: variabel pengganti.');
    setTimeout(fixes, 4200);
  } }), el('div', { class: 'sb26-sisi' }, el('small', null, '🏫 Kolom baru: asal SMP pegunungan'), el('div', { class: 'sb26-tumpuk' }, data.filter((r) => r.rendah).map((r) => el('span', { class: 'sb26-kartu lebar' }, r.id, attrs(r, ['smp', 'jauh'])))))), msg);
}

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
  goal: 'Mesin Penyaring Beasiswa: bangun pohon keputusan dari keputusan tahun lalu, uji pada pelamar baru, bongkar bias yang terbawa dari data, perbaiki labelnya, lalu tentukan bagian yang harus diputuskan manusia.',
  extraModes: [
    { id: 'pohon', icon: '🌳', label: 'Pembangun Pohon', desc: 'Bangun pohon sendiri atau otomatis, uji pada pelamar baru, perbaiki label data lama, dan bandingkan kelompok rumah dekat dan jauh', create: createBuilder },
    { id: 'giliran', icon: '⚖️', label: 'Duel Dua Pohon', desc: 'Tim bergiliran membangun pohon dengan pertanyaan pilihannya; skor dari akurasi pada pelamar baru dan keadilan antarkelompok', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act sb26-main' });
    root.append(wrap);
    const biased = buildTree(OLD);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'sb26-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD26[k], '🌳'), area); };
      const fin = (ms) => ({ done: () => next(ms) });
      if (r === 0) { go('malas', 1); lazyRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('cabang', 2); sieveRound(area, ctx, { rows: OLD.filter((x) => x.rendah), qs: ['nilai', 'lomba', 'jauh'], best: 'jauh', ...fin(6000) }); }
      else if (r === 2) { go('pohon', 2); growRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('uji', 3); walkRound(area, ctx, { tree: biased, ...fin(5500) }); }
      else if (r === 4) { go('matriks', 3); matrixFairRound(area, ctx, { tree: biased, ...fin(6500) }); }
      else if (r === 5) { go('detektif', 4); detectiveRound(area, ctx, { tree: biased, ...fin(7000) }); }
      else if (r === 6) { go('duel', 5); noFarRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('label', 5); relabelRound(area, ctx, fin(7000)); }
      else if (r === 8) { go('tugas', 6); taskRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); proxyRound(area, ctx, fin(7500)); }
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
      if (k >= nT) { finishBoard(wrap, ctx, { title: 'Pohon antartim selesai', pts, again: () => pickTeams(wrap, 'Duel Dua Pohon', start) }); return; }
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
  pickTeams(wrap, 'Duel Dua Pohon', start);
}
