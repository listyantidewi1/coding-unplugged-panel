// Cara Kerja Mesin Pencari — SMP (13–15 tahun), literasi digital. Eight
// made-up tourism pages of Kabupaten Wanasari: build the word index, answer
// DAN / ATAU / "kutip" searches, rank by word matches plus 3 × inbound
// links, and see why the top result is not automatically the truth.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

export const PAGES = [
  { id: 'H1', title: 'Pantai Tanjung Wangi', body: 'Pantai Tanjung Wangi cocok untuk liburan keluarga. Tiket masuknya murah. Di tepi pantai ada warung sate ikan.', links: ['H4', 'H8'] },
  { id: 'H2', title: 'Air Terjun Lembah Kabut', body: 'Air terjun setinggi 40 meter di tengah hutan pinus. Tiketnya murah, tetapi jalan setapaknya licin dan kurang cocok untuk anak kecil.', links: ['H8'] },
  { id: 'H3', title: 'Museum Batik Wanasari', body: 'Museum ini menyimpan ratusan kain batik dan menceritakan sejarah batik Wanasari. Pengunjung bisa belajar membatik bersama keluarga.', links: ['H5', 'H8'] },
  { id: 'H4', title: 'Kuliner Malam Alun-Alun', body: 'Pusat kuliner dengan sate kambing, sate ayam, dan wedang jahe. Harganya murah dan tempatnya ramai oleh keluarga.', links: ['H1'] },
  { id: 'H5', title: 'Kampung Batik Kali Sari', body: 'Kampung para perajin batik. Pengunjung bisa membeli batik tulis langsung dari perajin dan melihat cara membatik.', links: ['H3'] },
  { id: 'H6', title: 'Blog Promo: Pantai Paling Keren!!!', body: 'Pantai terbaik! Pantai termurah! Klik di sini untuk promo pantai murah murah murah!', links: [] },
  { id: 'H7', title: 'Paralayang Bukit Angin', body: 'Rasakan serunya terjun dari bukit dengan parasut paralayang. Bawa air minum dan topi, karena puncak bukit sangat panas.', links: ['H8'] },
  { id: 'H8', title: 'Peta Wisata Wanasari (situs resmi)', body: 'Daftar tempat wisata: pantai, air terjun, museum, kampung batik, dan pusat kuliner, lengkap dengan jam buka dan harga tiket. Pengumuman 1 Oktober: Air Terjun Lembah Kabut ditutup sementara untuk perbaikan jalan.', links: ['H1', 'H2', 'H3', 'H4', 'H5'] },
];
export const IDS = PAGES.map((p) => p.id);
export const INDEX_WORDS = ['pantai', 'air', 'terjun', 'sate', 'batik', 'museum', 'keluarga', 'murah', 'sejarah'];
// Dodo's five empty pages, each linking to H6.
export const DODO = ['D1', 'D2', 'D3', 'D4', 'D5'].map((id) => ({ id, title: 'Halaman kosong', body: '', links: ['H6'] }));

export const words = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];
const parts = (p) => [words(p.title), words(p.body)];
// Occurrences of a phrase (array of words) in the page, title and body separately.
export function count(p, phrase) {
  let n = 0;
  for (const w of parts(p)) for (let i = 0; i + phrase.length <= w.length; i++) if (phrase.every((x, k) => w[i + k] === x)) n++;
  return n;
}
export function buildIndex(pages = PAGES) {
  const idx = {};
  for (const p of pages) for (const w of new Set(parts(p).flat())) (idx[w] ||= []).push([p.id, count(p, [w])]);
  return idx;
}
export function inbound(pages = PAGES) {
  const n = Object.fromEntries(pages.map((p) => [p.id, 0]));
  for (const p of pages) for (const l of p.links) n[l] = (n[l] || 0) + 1;
  return n;
}

// Query: groups separated by ATAU; inside a group terms are joined by DAN
// (or a space); "…" is an exact phrase; TANPA excludes the next term.
export function parse(q) {
  const tokens = q.match(/"[^"]*"?|\S+/g) || [];
  const groups = [[]];
  let neg = false;
  for (const t of tokens) {
    const up = t.toUpperCase();
    if (up === 'ATAU') { groups.push([]); neg = false; continue; }
    if (up === 'DAN') continue;
    if (up === 'TANPA') { neg = true; continue; }
    const phrase = words(t);
    if (phrase.length) groups.at(-1).push({ phrase, neg, quoted: t.startsWith('"') });
    neg = false;
  }
  return groups.filter((g) => g.length);
}
export function results(q, pages = PAGES) {
  const groups = parse(q);
  const hit = (p, g) => g.every((t) => (count(p, t.phrase) > 0) !== t.neg);
  return pages.filter((p) => groups.some((g) => hit(p, g))).map((p) => p.id);
}
export function matchScore(p, q) {
  return parse(q).flat().filter((t) => !t.neg).reduce((s, t) => s + count(p, t.phrase), 0);
}
export function rank(q, { weight = 3, dodo = false } = {}) {
  const all = dodo ? [...PAGES, ...DODO] : PAGES;
  const inb = inbound(all);
  return results(q).map((id) => {
    const p = PAGES.find((x) => x.id === id);
    const m = matchScore(p, q);
    return { id, match: m, links: inb[id], total: m + weight * inb[id] };
  }).sort((a, b) => b.total - a.total || b.match - a.match || IDS.indexOf(a.id) - IDS.indexOf(b.id));
}
export const OPS = [['batik', ['H3', 'H5', 'H8']], ['batik DAN keluarga', ['H3']], ['sate ATAU museum', ['H1', 'H3', 'H4', 'H8']], ['air DAN terjun', ['H2', 'H7', 'H8']], ['"air terjun"', ['H2', 'H8']], ['murah DAN keluarga', ['H1', 'H4']]];
export const TARGETS = { H3: 'sejarah', H2: 'terjun DAN murah', H1: 'pantai DAN sate' };
const termCount = (q) => parse(q).flat().reduce((s, t) => s + t.phrase.length, 0);
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// Page cards. opts: lit (ids), picked (ids), onPick(id), mark (phrases to highlight), dim (ids not in result).
function cards({ lit = [], picked = [], onPick, mark = [], small = false } = {}) {
  const hl = (text) => {
    if (!mark.length) return text;
    const out = [];
    const re = /([A-Za-z0-9]+)|([^A-Za-z0-9]+)/g;
    const toks = [...text.matchAll(re)].map((m) => m[0]);
    const low = toks.map((t) => (/[A-Za-z0-9]/.test(t) ? t.toLowerCase() : null));
    const wordPos = low.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
    const on = new Set();
    for (const ph of mark) for (let k = 0; k + ph.length <= wordPos.length; k++) if (ph.every((x, j) => low[wordPos[k + j]] === x)) for (let j = wordPos[k]; j <= wordPos[k + ph.length - 1]; j++) on.add(j);
    toks.forEach((t, i) => out.push(on.has(i) ? el('mark', null, t) : t));
    return out;
  };
  return el('div', { class: `mp-kartu-grid ${small ? 'kecil' : ''}` }, PAGES.map((p) => {
    const c = el('div', { class: `mp-kartu ${lit.includes(p.id) ? 'nyala' : ''} ${picked.includes(p.id) ? 'pilih' : ''} ${p.id === 'H6' ? 'promo' : ''} ${p.id === 'H8' ? 'resmi' : ''}`, 'data-p': p.id },
      el('div', { class: 'mp-kartu-atas' }, el('b', null, p.id), el('span', null, hl(p.title))),
      el('p', null, hl(p.body)),
      el('small', null, `Menautkan ke: ${p.links.join(', ') || '–'}`));
    return onPick ? onTap(c, () => onPick(p.id)) : c;
  }));
}

export default {
  id: 'smp-21-mesin-pencari',
  title: 'Cara Kerja Mesin Pencari',
  topic: 'Perayap, indeks kata, operator pencarian, peringkat, dan menilai hasil',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🔎',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membuat indeks kata, menjawab pencarian dengan DAN, ATAU, dan tanda kutip, menghitung peringkat dari kecocokan kata dan tautan, memilih kata kunci yang jitu, dan menjelaskan mengapa hasil teratas belum tentu benar.',
  extraModes: [
    { id: 'mesin', icon: '🔎', label: 'Mesin Pencari Mini', desc: 'Ketik pencarian dengan DAN, ATAU, TANPA, dan tanda kutip; atur bobot tautan dan nyalakan halaman kosong buatan Dodo', create: createEngine },
    { id: 'sasaran', icon: '🎯', label: 'Kata Kunci Jitu', desc: 'Tim bergiliran menulis pencarian yang menemukan halaman sasaran dengan hasil sesedikit mungkin', create: createTarget },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mesinpencari' });
    root.append(wrap);
    const word = ctx.rand.pick(['murah', 'batik', 'pantai', 'keluarga']);
    const op = ctx.rand.pick(OPS.slice(1));
    const target = ctx.rand.pick(Object.keys(TARGETS));
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) pickRound(wrap, ctx, { prompt: `Perayap membuat indeks. Ketuk semua halaman yang memuat kata "${word}" (hanya kata yang persis sama).`, want: results(word), done: next,
        after: (w) => { const p = PAGES.find((x) => x.id === results(word)[0]); const n = count(p, [word]); choice(w, { prompt: `Berapa kali "${word}" muncul di ${p.id} (judul dan isi)?`, ctx, columns: 4, onRight: next, options: [1, 2, 3, 4].map((k) => ({ label: String(k), correct: k === n })) }); } });
      else if (r === 1) ask('Mengapa mesin pencari membuat indeks lebih dulu, bukan membaca semua halaman setiap kali ada yang mencari?', [['Membaca miliaran halaman setiap pencarian terlalu lama; indeks cukup dibuka seperti indeks buku', true], ['Supaya halaman web tidak rusak'], ['Karena halaman web tidak boleh dibaca'], ['Supaya hasilnya selalu benar']]);
      else if (r === 2) pickRound(wrap, ctx, { prompt: `Ketuk semua halaman hasil pencarian ${op[0]}`, want: op[1], done: next, legend: true });
      else if (r === 3) ask('Pencarian air DAN terjun memberi H2, H7, H8, tetapi "air terjun" hanya H2, H8. Mengapa H7 hilang?', [['H7 memuat "terjun dari bukit" dan "air minum": kedua kata ada, tetapi tidak berurutan', true], ['H7 tidak memuat kata air'], ['Tanda kutip membuang halaman yang panjang'], ['H7 tidak punya tautan masuk']], 1, cards({ mark: [['air'], ['terjun']], small: true }));
      else if (r === 4) ask('Dibandingkan pencarian satu kata, hasil DAN selalu … dan hasil ATAU selalu …', [['DAN lebih sedikit atau sama; ATAU lebih banyak atau sama', true], ['DAN lebih banyak; ATAU lebih sedikit'], ['Keduanya selalu sama banyak'], ['DAN selalu kosong; ATAU selalu semua halaman']]);
      else if (r === 5) linksRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Pencarian pantai murah (harus memuat kedua kata). Skor akhir = kecocokan + 3 × tautan masuk. Bagaimana peringkatnya?', [['Kecocokan saja: H6 (7), H1 (4). Skor akhir: H1 (10), H6 (7)', true], ['Kecocokan saja: H1, H6. Skor akhir: H6, H1'], ['Keduanya: H6 (7), H1 (4)'], ['Keduanya: H1, H8, H6']], 1, cards({ small: true }),
        () => { wrap.replaceChildren(); ask('Mengapa tautan membuat peringkat lebih baik untuk pencarian ini?', [['H6 hanya mengulang kata kunci dan tidak ditautkan siapa pun; H1 ditautkan halaman lain, termasuk situs resmi', true], ['Halaman dengan tautan selalu lebih pendek'], ['Tanda seru menurunkan skor'], ['H1 memuat kata pantai lebih banyak']]); });
      else if (r === 7) ask('Rani mencari "air terjun" DAN murah, hasilnya hanya H2, lalu langsung berangkat. Apa yang terlewat?', [['Pengumuman di H8 (situs resmi, bertanggal): Lembah Kabut ditutup sementara sejak 1 Oktober', true], ['H6 menawarkan promo lebih murah'], ['H7 juga air terjun'], ['Tidak ada; hasil satu-satunya pasti benar']], 1, cards({ lit: results('"air terjun" DAN murah'), small: true }));
      else if (r === 8) targetRound(wrap, ctx, { target, done: next });
      else dodoRound(wrap, ctx, { done: next });
    }
    render();
  },
};

// Tap the pages in a result set, then Periksa. Optional follow-up question.
function pickRound(wrap, ctx, { prompt, want, done, after, legend = false }) {
  const picked = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, legend ? 'DAN: kedua kata. ATAU: salah satu atau keduanya. "…": berurutan persis.' : 'Huruf besar dan kecil dianggap sama.');
  const draw = (lit = []) => stage.replaceChildren(cards({ picked, lit, onPick: (id) => { if (finished) return; const i = picked.indexOf(id); if (i >= 0) picked.splice(i, 1); else picked.push(id); ctx.sound.tap(); draw(); } }));
  draw();
  const check = el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    if (!same(picked, want)) {
      const extra = picked.filter((x) => !want.includes(x));
      msg.className = 'reveal bad';
      msg.textContent = extra.length ? `${extra.join(', ')} tidak termasuk. Baca lagi kata demi kata.` : `Masih ada ${want.length - picked.length} halaman yang terlewat.`;
      ctx.mistake();
      return;
    }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Benar: ${want.join(', ')}.`;
    draw(want);
    if (after) { check.remove(); after(wrap); } else done();
  }, 'primary'));
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, check, msg);
}

// Type the number of inbound links for every page.
function linksRound(wrap, ctx, { done }) {
  const want = inbound();
  const vals = {};
  let focus = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Hitung berapa halaman lain yang menautkan ke setiap halaman.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'mp-samping' }, cards({ small: true }),
      el('table', { class: 'kls-tabel mp-tautan' }, el('tbody', null,
        el('tr', null, el('th', null, 'Halaman'), ...IDS.map((id) => el('th', null, id))),
        el('tr', null, el('th', null, 'Tautan masuk'), ...IDS.map((id, i) => el('td', null, onTap(el('button', { class: `ck-isi ${focus === i ? 'fokus' : ''} ${bad.includes(i) ? 'salah' : ''}`, type: 'button', 'data-i': i }, vals[i] ?? '…'), () => { focus = i; draw(bad); }))))))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'0123456789'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished) return; vals[focus] = Number(d); focus = Math.min(focus + 1, 7); draw(); })));
  wrap.append(el('p', { class: 'prompt' }, 'Tautan bekerja seperti "suara" dari halaman lain.'), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const bad = IDS.map((id, i) => (vals[i] !== want[id] ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} isian belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: H8 paling banyak ditautkan (4). H6 dan H7 tidak ditautkan sama sekali.'; done();
  }, 'primary')), msg);
}

// Build a query from word chips and operators.
function queryBuilder(onChange, { extra = [] } = {}) {
  const toks = [];
  const shown = el('div', { class: 'mp-kueri' });
  const text = () => {
    let s = '';
    let open = false;
    for (const t of toks) {
      if (t === '"') { s += open ? '"' : `${s ? ' ' : ''}"`; open = !open; }
      else s += (s && !s.endsWith('"') ? ' ' : s.endsWith('"') && !open ? ' ' : '') + t;
    }
    return s;
  };
  function redraw() {
    shown.replaceChildren(el('span', { class: 'mp-kotak' }, text() || el('i', null, 'ketuk kata dan operator…')));
    onChange(text());
  }
  const add = (t) => { toks.push(t); redraw(); };
  const pool = [...INDEX_WORDS, ...extra];
  const box = el('div', { class: 'mp-pembangun' }, shown,
    el('div', { class: 'mp-chip-baris' }, pool.map((w) => onTap(el('button', { class: 'mp-chip', type: 'button', 'data-w': w }, w), () => add(w)))),
    el('div', { class: 'mp-chip-baris' },
      ...['DAN', 'ATAU', 'TANPA'].map((o) => onTap(el('button', { class: 'mp-chip op', type: 'button', 'data-w': o }, o), () => add(o))),
      onTap(el('button', { class: 'mp-chip op', type: 'button', 'data-w': '"' }, '"'), () => add('"')),
      onTap(el('button', { class: 'mp-chip hapus', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { toks.pop(); redraw(); }),
      onTap(el('button', { class: 'mp-chip hapus', type: 'button' }, 'Kosongkan'), () => { toks.length = 0; redraw(); })));
  box.set = (q) => { toks.length = 0; toks.push(...(q.match(/"|[^\s"]+/g) || [])); redraw(); };
  setTimeout(redraw);
  return box;
}

// Write a search whose result is only the target page.
function targetRound(wrap, ctx, { target, done }) {
  let q = '';
  let finished = false;
  const msg = el('p', { class: 'reveal info' }, 'Pakai kata sesedikit mungkin.');
  const stage = el('div');
  const draw = () => stage.replaceChildren(cards({ lit: q ? results(q) : [], small: true }));
  const qb = queryBuilder((t) => { q = t; if (!finished) draw(); });
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Tulis pencarian yang hasilnya hanya ${target}.`), qb, stage, el('div', { class: 'kode-baris' }, button('Cari', () => {
    if (finished) return;
    const res = results(q);
    if (!same(res, [target])) { msg.className = 'reveal bad'; msg.textContent = res.length ? `Hasilnya ${res.join(', ')}. Harus hanya ${target}.` : 'Tidak ada hasil.'; ctx.mistake(); return; }
    const n = termCount(q);
    const best = termCount(TARGETS[target]);
    finished = true; msg.className = 'reveal';
    msg.textContent = n <= best ? `Jitu! ${q} hanya menemukan ${target} dengan ${n} kata.` : `Benar, hasilnya hanya ${target}. Bisa lebih pendek: ${TARGETS[target]}.`;
    done();
  }, 'primary')), msg);
}

function dodoRound(wrap, ctx, { done }) {
  let finished = false;
  let val = '';
  const msg = el('p', { class: 'reveal info' }, 'H6: kecocokan 7. Skor akhir = kecocokan + 3 × tautan masuk.');
  const shown = el('span', { class: 'ck-isi fokus lebar' }, '…');
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished || val.length >= 2) return; val += d; shown.textContent = val; })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { val = val.slice(0, -1); shown.textContent = val || '…'; }));
  wrap.append(el('p', { class: 'prompt' }, 'Tantangan: Dodo membuat lima halaman kosong yang semuanya menautkan ke H6. Berapa skor akhir H6 untuk pencarian pantai murah?'),
    el('div', { class: 'mp-dodo' }, ...DODO.map((d) => el('span', { class: 'mp-kosong' }, `${d.id} ➜ H6`))),
    el('div', { class: 'kode-baris' }, el('b', null, 'Skor H6 = '), shown, pad, button('Periksa', () => {
      if (finished) return;
      if (Number(val) !== rank('pantai murah', { dodo: true })[0].total) { msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Hitung tautan masuk H6 yang baru.'; ctx.mistake(); return; }
      finished = true; msg.className = 'reveal';
      msg.textContent = '7 + 3 × 5 = 22: H6 naik ke peringkat pertama. Tidak adil! Perbaikan: tautan dari halaman tanpa tautan masuk tidak dihitung, tautan dari halaman penting bernilai lebih besar.';
      done();
    }, 'primary')), msg);
}

function createEngine(root, ctx) {
  const wrap = el('div', { class: 'act mesinpencari' });
  root.append(wrap);
  let q = '';
  let weight = 3;
  let dodo = false;
  let showIndex = false;
  const out = el('div', { class: 'mp-hasil-wadah' });
  function draw() {
    const res = q ? rank(q, { weight, dodo }) : [];
    const terms = parse(q).flat().filter((t) => !t.neg).map((t) => t.phrase);
    const idx = buildIndex();
    const indexWords = [...new Set(terms.flat())].filter((w) => idx[w]);
    out.replaceChildren(el('div', { class: 'mp-samping' }, cards({ lit: res.map((x) => x.id), mark: terms, small: true }),
      el('div', { class: 'mp-kanan' },
        el('ol', { class: 'mp-hasil' }, res.length ? res.map((x) => { const p = PAGES.find((y) => y.id === x.id); return el('li', null, el('b', null, `${x.id} · ${p.title}`), el('small', null, `cocok ${x.match} + ${weight} × ${x.links} tautan = ${x.total}`)); }) : el('li', { class: 'kosong' }, q ? 'Tidak ada hasil.' : 'Belum ada pencarian.')),
        showIndex ? el('table', { class: 'kls-tabel mp-indeks' }, el('tbody', null, ...(indexWords.length ? indexWords : INDEX_WORDS).map((w) => el('tr', null, el('th', null, w), el('td', null, (idx[w] || []).map(([id, n]) => `${id} (${n})`).join(', ') || '–'))))) : null)));
  }
  const qb = queryBuilder((t) => { q = t; draw(); }, { extra: ['tiket', 'anak', 'hutan', 'bukit', 'kuliner', 'resmi', 'ditutup'] });
  const wSlider = el('input', { type: 'range', min: 0, max: 5, value: weight, class: 'ps-range' });
  const wLabel = el('b', null, String(weight));
  wSlider.addEventListener('input', () => { weight = Number(wSlider.value); wLabel.textContent = String(weight); draw(); });
  wSlider.addEventListener('pointerdown', (e) => e.stopPropagation());
  const toggles = el('div', { class: 'mp-atur' },
    el('label', { class: 'ps-geser' }, el('span', null, 'Bobot tautan ', wLabel), wSlider),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '🧱 Halaman kosong Dodo'), (e) => { dodo = !dodo; e.currentTarget.classList.toggle('on', dodo); draw(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, '📇 Indeks'), (e) => { showIndex = !showIndex; e.currentTarget.classList.toggle('on', showIndex); draw(); }),
    onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Contoh: pantai murah'), () => qb.set('pantai murah')));
  wrap.append(qb, toggles, out);
  draw();
}

function createTarget(root, ctx) {
  const wrap = el('div', { class: 'act mesinpencari' });
  root.append(wrap);
  let n = 2;
  let target = null;
  let turn = 0;
  const best = [];
  const pts = [];
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { pts.length = 0; for (let i = 0; i < n; i++) pts.push(0); newTarget(); }, 'primary')));
  }
  function newTarget() { target = ctx.rand.pick(IDS.filter((x) => x !== target)); turn = 0; best.length = 0; play(); }
  function play() {
    let q = '';
    const msg = el('p', { class: 'reveal info' }, 'Hasil harus memuat sasaran. Semakin sedikit hasil, semakin baik.');
    const stage = el('div');
    const draw = () => stage.replaceChildren(cards({ lit: q ? results(q) : [], picked: [target], small: true }));
    const qb = queryBuilder((t) => { q = t; draw(); }, { extra: ['tiket', 'anak', 'hutan', 'bukit', 'kuliner', 'resmi', 'ditutup', 'kampung', 'parasut'] });
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${turn + 1}: temukan ${target} (bingkai biru).`), qb, stage, el('div', { class: 'kode-baris' }, button('Cari', () => {
      const res = results(q);
      if (!res.includes(target)) { msg.className = 'reveal bad'; msg.textContent = res.length ? `Hasil ${res.join(', ')} tidak memuat ${target}.` : 'Tidak ada hasil.'; ctx.mistake(); return; }
      best[turn] = { q, n: res.length };
      ctx.sound.good();
      turn++;
      if (turn < n) play(); else score();
    }, 'primary')), msg);
  }
  function score() {
    const min = Math.min(...best.map((b) => b.n));
    best.forEach((b, i) => { if (b.n === min) pts[i]++; });
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Sasaran ${target}: hasil paling sedikit ${min}.`),
      el('div', { class: 'ab-lapisan' }, best.map((b, i) => el('div', { class: `ab-lap-baris ${b.n === min ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}: ${b.q}`), el('b', null, `${b.n} hasil · poin ${pts[i]}${b.n === min ? ' 🏆' : ''}`)))),
      el('div', { class: 'kode-baris' }, button('Sasaran berikutnya ➜', newTarget, 'primary'), button('Selesai', setup)));
  }
  setup();
}
