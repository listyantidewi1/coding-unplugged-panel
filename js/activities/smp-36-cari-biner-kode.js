// Cari Biner dalam Kode — SMP (13–15 tahun), coding. Binary search over a
// Javanese ngoko word list: the kiri–kanan–tengah table, stopping when kiri
// passes kanan, Dimas's "kiri ← tengah" that loops forever on the right half,
// binary versus sequential comparisons, and where to insert a new word.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper } from './smp-kit.js';
import { runAll } from './pseudo.js';

export const KAMUS = [['adus', 'mandi'], ['banyu', 'air'], ['dalan', 'jalan'], ['endhog', 'telur'], ['gedhang', 'pisang'], ['iwak', 'ikan'], ['jaran', 'kuda'], ['kucing', 'kucing'], ['lawang', 'pintu'], ['mangan', 'makan'], ['omah', 'rumah'], ['pitik', 'ayam'], ['sega', 'nasi'], ['turu', 'tidur'], ['wedhus', 'kambing']];
export const WORDS = KAMUS.map((k) => k[0]);
export const cari = (dimas = false) => ['FUNGSI cariBiner(kamus, dicari)', '    kiri ← 1', '    kanan ← PANJANG(kamus)', '    SELAMA kiri ≤ kanan', '        tengah ← (kiri + kanan) DIV 2', '        JIKA kamus[tengah] = dicari MAKA', '            KEMBALIKAN tengah', '        SELAIN ITU JIKA kamus[tengah] < dicari MAKA', `            kiri ← ${dimas ? 'tengah' : 'tengah + 1'}`, '        SELAIN ITU', '            kanan ← tengah − 1', '    KEMBALIKAN 0'];
export const prog = (w, dimas = false) => [...cari(dimas), `hasil ← cariBiner(kamus, "${w}")`];
export const LIMIT = 300;
export const run = (w, dimas = false, words = WORDS) => runAll(prog(w, dimas), { vars: { kamus: words }, limit: LIMIT });
// Rounds: [kiri, kanan, tengah, word, decision]; plus the final kiri/kanan.
export function rounds(w, { dimas = false, words = WORDS, max = 40 } = {}) {
  let kiri = 1; let kanan = words.length; const out = [];
  while (kiri <= kanan && out.length < max) {
    const t = Math.floor((kiri + kanan) / 2); const x = words[t - 1];
    if (x === w) { out.push([kiri, kanan, t, x, 'ketemu']); return { out, found: t, kiri, kanan }; }
    if (x < w) { const nk = dimas ? t : t + 1; out.push([kiri, kanan, t, x, `ke kanan: kiri ← ${nk}`]); kiri = nk; } else { out.push([kiri, kanan, t, x, `ke kiri: kanan ← ${t - 1}`]); kanan = t - 1; }
  }
  return { out, found: kiri <= kanan ? null : 0, kiri, kanan, loop: kiri <= kanan };
}
export const seqCount = (w, words = WORDS) => { const i = words.indexOf(w); return i < 0 ? words.length : i + 1; };
export const binCount = (w, words = WORDS) => rounds(w, { words }).out.length;
export const maxRounds = (n) => Math.floor(Math.log2(n)) + 1;
export const insertAt = (w, words = WORDS) => rounds(w, { words }).kiri;
export const rowText = (r) => `${r[0]} · ${r[1]} · ${r[2]} · ${r[3]}`;

// Word cards with KIRI / TENGAH / KANAN markers; outside the range is grey.
function cards(words, { kiri = null, kanan = null, tengah = null, mean = true } = {}) {
  return el('div', { class: 'bk-kartu-baris' }, words.map((w, k) => { const i = k + 1; const out = kiri != null && (i < kiri || i > kanan);
    return el('div', { class: `bk-kartu ${out ? 'buang' : ''} ${i === tengah ? 'tengah' : ''}` }, el('small', null, String(i)), el('b', null, w), mean && KAMUS[k] ? el('i', null, KAMUS[k][1]) : null,
      el('span', { class: 'bk-tanda' }, [i === kiri ? 'KIRI' : '', i === tengah ? 'TENGAH' : '', i === kanan ? 'KANAN' : ''].filter(Boolean).join(' · '))); }));
}
function table(rows) {
  return el('table', { class: 'bk-tabel' }, el('tr', null, ['Putaran', 'kiri', 'kanan', 'tengah', 'kamus[tengah]', 'Keputusan'].map((h) => el('th', null, h))), rows.slice(-8).map((r, k) => el('tr', null, el('td', null, String(rows.length > 8 ? rows.length - 8 + k + 1 : k + 1)), r.map((x) => el('td', null, String(x))))));
}
function searchTracer(w, { dimas = false, onEnd = null } = {}) {
  let rows = []; let warn = false; let ended = false; let tr = null;
  const end = () => { if (!ended) { ended = true; onEnd?.(); } };
  tr = tracer(prog(w, dimas), { opts: { vars: { kamus: WORDS }, limit: LIMIT }, speed: 420, hideVars: ['kamus'], onEnd: end,
    onStep: (y, st) => {
      if (!y) { rows = []; warn = false; ended = false; return; }
      const f = st.frames[st.frames.length - 1]; const v = f ? f.vars : st.vars;
      if (y.line === 4) rows.push([v.kiri, v.kanan, v.tengah, WORDS[v.tengah - 1], '…']);
      const last = rows[rows.length - 1];
      if (last && y.line === 8) last[4] = `ke kanan: kiri ← ${v.kiri}`;
      if (last && y.line === 10) last[4] = `ke kiri: kanan ← ${v.kanan}`;
      if (last && y.line === 6) last[4] = 'ketemu';
      const n = rows.length;
      if (!warn && n >= 4 && [2, 3, 4].every((d) => rows[n - d][0] === rows[n - 1][0] && rows[n - d][1] === rows[n - 1][1])) { warn = true; setTimeout(() => { tr?.stop(); end(); }, 0); }
    },
    extra: (st) => { const f = st.frames[st.frames.length - 1]; const v = f ? f.vars : st.vars;
      return el('div', { class: 'bk-ekstra' }, warn ? el('p', { class: 'sk-galat batas' }, '⏱ Penanda tidak bergerak selama tiga putaran: perulangan tidak berhenti.') : null, cards(WORDS, { kiri: v.kiri ?? null, kanan: v.kanan ?? null, tengah: v.tengah ?? null, mean: false }), table(rows)); } });
  return tr;
}

export default {
  id: 'smp-36-cari-biner-kode',
  title: 'Cari Biner dalam Kode',
  topic: 'Pencarian biner dalam pseudocode: kiri, kanan, dan tengah, syarat berhenti, bug perulangan yang tidak berhenti, perbandingan dengan pencarian berurutan, dan tempat penyisipan',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '📖',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri pencarian biner di kamus bahasa Jawa dengan tabel kiri–kanan–tengah, temukan mengapa program Dimas berputar terus, lalu bandingkan dengan pencarian berurutan.',
  extraModes: [
    { id: 'jejak', icon: '🔎', label: 'Kiri–Kanan–Tengah', desc: 'Lima belas kartu kata dengan penanda KIRI, TENGAH, dan KANAN; bagian yang dibuang menjadi abu-abu dan tabel terisi otomatis. Coba juga baris 9 program Dimas', create: createTrace },
    { id: 'lomba', icon: '🏁', label: 'Lomba Langkah', desc: 'Pencarian biner dan berurutan berdampingan dengan penghitung perbandingan untuk kamus 15, 31, dan 1.023 kata', create: createRace },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Kata Rahasia', desc: 'Satu tim memilih kata rahasia, tim lain menebaknya dari keputusan "ke kiri" dan "ke kanan" yang diumumkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act cari-biner-kode' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const runFirst = (prompt, w, dimas, after) => { const tr = searchTracer(w, { dimas, onEnd: () => setTimeout(then(after), 1800) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      const tupleOpts = (right, extra) => [...new Set([right, ...extra])].slice(0, 4).sort();
      if (r === 0) { const cmp = (a, b) => runAll([`x ← "${a}" < "${b}"`]).vars.x ? 'benar' : 'salah'; wrap.append(cards(WORDS)); rowsChoose(wrap, ctx, { prompt: 'Pemanasan: < berarti lebih dulu menurut abjad', rows: [['a', '"kidang" < "kucing"', ['benar', 'salah'], cmp('kidang', 'kucing'), 'i sebelum u.'], ['b', '"omah" < "mangan"', ['benar', 'salah'], cmp('omah', 'mangan')], ['c', '"sega" < "sapi"', ['benar', 'salah'], cmp('sega', 'sapi'), 'e sesudah a.']],
        done: then(() => ask('Mengapa pencarian biner hanya bisa dipakai bila larik sudah urut?', [['Setelah memeriksa kotak tengah, program membuang separuh larik dengan anggapan semua kata di situ lebih kecil atau lebih besar; anggapan itu hanya benar bila larik urut', true], ['Karena komputer tidak bisa membaca larik yang acak'], ['Karena kotak tengah hanya ada di larik urut'], ['Supaya kamus terlihat rapi']])) }); }
      else if (r === 1) { const R = rounds('pitik').out; runFirst('Jalankan cariBiner(kamus, "pitik")', 'pitik', false, () => rowsChoose(wrap, ctx, { prompt: 'Tabel untuk "pitik"', rows: [['2', 'Putaran 2: kiri · kanan · tengah · kamus[tengah]', tupleOpts(rowText(R[1]), ['8 · 15 · 11 · omah', '9 · 15 · 13 · sega', '9 · 14 · 11 · omah']), rowText(R[1])], ['h', 'Nilai kembalian · banyak putaran', ['12 · 2', '2 · 12', '12 · 3', '8 · 2'], `${run('pitik').vars.hasil} · ${R.length}`]], done: next })); }
      else if (r === 2) { const R = rounds('banyu').out; wrap.append(cards(WORDS, { mean: false })); rowsChoose(wrap, ctx, { prompt: 'cariBiner(kamus, "banyu"): kiri · kanan · tengah · kamus[tengah]', rows: [...R.map((x, k) => [`p${k}`, `Putaran ${k + 1}`, tupleOpts(rowText(x), ['1 · 15 · 8 · kucing', '1 · 7 · 4 · endhog', '1 · 3 · 2 · banyu', '1 · 7 · 3 · dalan', '1 · 3 · 1 · adus']), rowText(x)]), ['h', 'Nilai kembalian · banyak putaran', ['2 · 3', '3 · 2', '2 · 2', '1 · 3'], `${run('banyu').vars.hasil} · ${R.length}`]], done: next }); }
      else if (r === 3) { const R = rounds('kidang'); runFirst('Jalankan cariBiner(kamus, "kidang"): kidang belum ada di kamus', 'kidang', false, () => rowsChoose(wrap, ctx, { prompt: 'Pencarian "kidang"', rows: [['3', 'Putaran 3', tupleOpts(rowText(R.out[2]), ['5 · 7 · 6 · iwak', '4 · 7 · 5 · gedhang', '5 · 8 · 6 · iwak', '1 · 7 · 4 · endhog']), rowText(R.out[2])], ['4', 'Putaran 4', tupleOpts(rowText(R.out[3]), ['7 · 8 · 7 · jaran', '6 · 7 · 6 · iwak', '8 · 8 · 8 · kucing']), rowText(R.out[3])], ['s', 'Mengapa perulangan berhenti?', ['kiri (8) lebih besar dari kanan (7): tidak ada lagi kotak yang mungkin berisi kata itu', 'sudah 4 putaran', 'kamus[tengah] = "jaran"', 'kanan menjadi 0'], `kiri (${R.kiri}) lebih besar dari kanan (${R.kanan}): tidak ada lagi kotak yang mungkin berisi kata itu`], ['h', 'Nilai kembalian', ['0', '7', '8', 'galat'], String(run('kidang').vars.hasil)]], done: next })); }
      else if (r === 4) runFirst('Program Dimas (baris 9: kiri ← tengah) mencari "wedhus"', 'wedhus', true, () => ask('Apa pola yang kamu lihat?', [['Mulai putaran 5, kiri 14, kanan 15, tengah selalu (14 + 15) DIV 2 = 14; kiri tidak pernah berubah, jadi program berputar selamanya dan kotak 15 tidak pernah diperiksa', true], ['Program menemukan wedhus di putaran 4'], ['Program berhenti dengan nilai kembalian 0'], ['kanan terus mengecil sampai 0']]));
      else if (r === 5) runFirst('Program Dimas mencari "pitik"', 'pitik', true, () => ask('Apa yang terjadi untuk "pitik"?', [['Berputar selamanya di kiri 11, kanan 12, tengah 11 (omah), padahal program yang benar menemukannya dalam 2 putaran', true], ['Ditemukan di putaran 2 seperti program yang benar'], ['Berhenti dengan nilai kembalian 0'], ['Ditemukan di indeks 11']], 1, null,
        then(() => ask(`Program Dimas tetap benar untuk "banyu" (${run('banyu', true).vars.hasil}) dan "adus" (${run('adus', true).vars.hasil}). Mengapa bugnya tidak terlihat?`, [['Baris 9 hanya dijalankan saat pencarian bergerak ke kanan; pencarian banyu dan adus hanya bergerak ke kiri, jadi data uji harus mencakup kata di separuh kanan dan ujung kanan', true], ['Karena banyu dan adus kata pendek'], ['Karena bug hanya muncul untuk kata yang tidak ada'], ['Karena DIV membulatkan ke atas']]))));
      else if (r === 6) ask('Mengapa kiri ← tengah + 1 aman?', [['Kotak tengah sudah diperiksa dan pasti bukan jawabannya; dengan +1 bagian yang masih mungkin selalu mengecil, jadi perulangan pasti berhenti', true], ['Karena +1 membuat pencarian lebih cepat dua kali lipat'], ['Karena tengah selalu bilangan genap'], ['Karena kanan juga ditambah 1']]);
      else if (r === 7) rowsChoose(wrap, ctx, { prompt: 'Banyak kata yang dibandingkan: cariUrut · cariBiner', rows: ['pitik', 'banyu', 'kidang', 'wedhus'].map((w) => [w, w === 'kidang' ? 'kidang (tidak ada)' : w, ['12 · 2', '2 · 3', '15 · 4', '8 · 4'], `${seqCount(w)} · ${binCount(w)}`, w === 'banyu' ? 'Untuk banyu, pencarian berurutan justru lebih cepat.' : '']), done: next });
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Paling banyak berapa putaran cariBiner?', rows: [['15', '15 kata', ['4', '8', '15', '3'], String(maxRounds(15))], ['31', '31 kata', ['5', '16', '31', '6'], String(maxRounds(31))], ['1023', '1.023 kata (cariUrut paling banyak 1.023)', ['10', '512', '100', '11'], String(maxRounds(1023))], ['x2', 'Setiap kamus dilipatgandakan, putaran bertambah', ['1', '2', 'dua kali lipat', '10'], '1', 'Pencarian biner unggul untuk kasus terburuk dan data besar, bukan untuk setiap kata.']], done: next });
      else { const at = insertAt('cedhak'); rowsChoose(wrap, ctx, { prompt: 'Menambah kata cedhak (dekat)', rows: [['i', 'Disisipkan di indeks', ['2', '3', '4', '16'], String(at), 'Di antara banyu dan dalan.'], ['g', 'Kata yang digeser ke kanan', ['13', '12', '3', '15'], String(WORDS.length - at + 1)], ['k', 'Tantangan: "kidang" berhenti dengan kiri = …', ['8', '7', '0', '9'], String(insertAt('kidang')), 'kidang memang harus disisipkan di indeks 8, sebelum kucing.'], ['z', 'Tempat sisip cedhak · zaitun', ['3 · 16', '3 · 15', '2 · 16', '4 · 0'], `${at} · ${insertAt('zaitun')}`]],
        done: then(() => ask('Mengapa pencarian biner tetap menguntungkan walaupun menyisipkan kata baru butuh menggeser banyak kata?', [['Kamus jauh lebih sering dicari daripada ditambah: menggeser kata dilakukan sesekali, pencarian dilakukan ribuan kali', true], ['Karena menggeser kata tidak butuh waktu'], ['Karena kata baru selalu ditaruh di akhir'], ['Karena pencarian biner tidak butuh kamus yang urut']])) }); }
    }
    render();
  },
};

const EXTRA = ['kidang', 'cedhak', 'zaitun'];
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act cari-biner-kode' });
  root.append(wrap);
  let w = 'pitik'; let dimas = false; let tr = null;
  const draw = () => {
    tr?.stop(); tr = searchTracer(w, { dimas });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur kiri–kanan–tengah'),
      el('div', { class: 'seg bk-pilih' }, [...WORDS, ...EXTRA].map((k) => onTap(el('button', { class: `seg-btn ${w === k ? 'on' : ''}`, type: 'button' }, EXTRA.includes(k) ? `${k} (tidak ada)` : k), () => { w = k; draw(); }))),
      el('div', { class: 'seg' }, [['baris 9: kiri ← tengah + 1', false], ['Dimas: kiri ← tengah', true]].map(([t, v]) => onTap(el('button', { class: `seg-btn ${dimas === v ? 'on' : ''}`, type: 'button' }, t), () => { dimas = v; draw(); }))), tr);
  };
  draw();
}

// Synthetic sorted word lists for bigger dictionaries.
export const bigWords = (n) => (n === 15 ? WORDS : Array.from({ length: n }, (_, k) => `kata${String(k + 1).padStart(4, '0')}`));
function createRace(root, ctx) {
  const wrap = el('div', { class: 'act cari-biner-kode' });
  root.append(wrap);
  let n = 15; let pos = 12;
  const draw = () => {
    const words = bigWords(n); pos = Math.min(pos, n + 1); const w = pos > n ? 'zzz' : words[pos - 1];
    const s = pos > n ? n : seqCount(w, words); const b = rounds(w, { words }).out.length; const max = Math.max(s, b, 1);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Lomba langkah: biner atau berurutan?'),
      el('div', { class: 'seg' }, [15, 31, 1023].map((k) => onTap(el('button', { class: `seg-btn ${n === k ? 'on' : ''}`, type: 'button' }, `${k === 1023 ? '1.023' : k} kata`), () => { n = k; pos = Math.min(pos, n); draw(); }))),
      el('div', { class: 'bk-atur' }, stepper(pos, (v) => { pos = v; draw(); }, { min: 1, max: n + 1, step: n > 100 ? 31 : 1, label: 'posisi kata dicari' }), el('b', null, pos > n ? 'kata yang tidak ada (setelah kata terakhir)' : `kata ke-${pos}: ${w}`)),
      el('div', { class: 'kg-grafik' }, [['cariUrut', s], ['cariBiner', b]].map(([k, v]) => el('div', { class: 'kg-batang-baris' }, el('span', null, k), el('div', { class: 'kg-batang' }, el('i', { style: { width: `${(v / max) * 100}%` } }), el('b', null, `${v} perbandingan`))))),
      el('p', { class: 'kg-catatan' }, `Untuk ${n === 1023 ? '1.023' : n} kata: cariUrut paling banyak ${n === 1023 ? '1.023' : n}, cariBiner paling banyak ${maxRounds(n)} putaran.`), ...(n === 15 ? [cards(WORDS, { mean: false, tengah: pos <= n ? pos : null })] : []));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act cari-biner-kode' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Kata rahasia selesai', pts, again: () => pickTeams(wrap, 'Kata Rahasia', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; let secret = null;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih kata rahasia (tim lain jangan melihat), lalu Serahkan.`);
      const host = el('div', { class: 'bk-giliran' }, el('div', { class: 'seg bk-pilih' }, WORDS.map((w) => onTap(el('button', { class: 'seg-btn', type: 'button' }, w), (e) => { secret = w; e.currentTarget.parentNode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }))), button('Serahkan ke tim lawan', () => { if (!secret) { say(msg, 'bad', 'Pilih kata lebih dulu.'); return; } guess(); }, 'primary'));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih kata, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const R = rounds(secret).out; const dec = R.slice(0, -1); const last = R[R.length - 1];
        const near = [last[2] - 1, last[2] + 1, last[0], last[1], last[2] - 2, last[2] + 2].filter((i) => i >= 1 && i <= 15 && i !== last[2]).map((i) => WORDS[i - 1]);
        const opts = ctx.rand.shuffle([...new Set([secret, ...near])].slice(0, 4));
        say(msg, '', `Tim ${guesser + 1}: kata rahasianya ditemukan di putaran berikutnya. Kata apa?`);
        host.replaceChildren(el('ol', { class: 'bk-umum' }, dec.length ? dec.map((x) => el('li', null, `kiri ${x[0]}, kanan ${x[1]}, tengah ${x[2]} (${x[3]}) → ${x[4]}`)) : el('li', null, 'Belum ada keputusan: kata ditemukan di putaran pertama.')), cards(WORDS, { mean: false }),
          el('div', { class: 'opts', style: { '--cols': 2 } }, opts.map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), (e) => {
            if (host.classList.contains('selesai')) return; host.classList.add('selesai');
            const ok = o === secret; if (ok) pts[guesser] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
            say(msg, ok ? '' : 'bad', `${ok ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} Kata rahasia: ${secret}, ditemukan di putaran ${R.length} (tengah ${last[2]}).`);
            wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 5200);
          }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Kata Rahasia', start);
}
