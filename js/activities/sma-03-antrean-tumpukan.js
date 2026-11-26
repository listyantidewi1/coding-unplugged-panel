// Antrean Loket dan Tumpukan Piring — SMA/SMK (16–18 tahun), struktur data.
// Stacks (plates, bracket checking, undo/redo), queues (ticket counter), a
// priority queue in a puskesmas, and a queue built from two stacks.

import { el, onTap, button, shake } from '../core/util.js';
import { misiHead, fill } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const WARNA = { merah: '#ef4444', biru: '#3b82f6', hijau: '#22c55e', kuning: '#eab308', putih: '#f8fafc', ungu: '#a855f7' };
export const NAMA = ['Ani', 'Budi', 'Citra', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hana'];

// Run stack (TARUH/AMBIL) or queue (DATANG/LAYANI) ops: [op, value?].
export function runOps(kind, ops) {
  const box = [];
  const out = [];
  for (const [op, v] of ops) {
    if (op === 'TARUH' || op === 'DATANG') box.push(v);
    else if (box.length) out.push(kind === 'tumpukan' ? box.pop() : box.shift());
  }
  return { box, out };
}
export const STACK_OPS = [['TARUH', 'merah'], ['TARUH', 'biru'], ['TARUH', 'hijau'], ['AMBIL'], ['TARUH', 'kuning'], ['AMBIL'], ['AMBIL'], ['TARUH', 'putih']];
export const QUEUE_OPS = [['DATANG', 'Ani'], ['DATANG', 'Budi'], ['DATANG', 'Citra'], ['LAYANI'], ['DATANG', 'Dodi'], ['LAYANI'], ['DATANG', 'Eka'], ['LAYANI']];

const PAIR = { ')': '(', ']': '[', '}': '{' };
// Bracket check with a stack. trace: stack after each bracket.
export function checkBrackets(s) {
  const st = [];
  const trace = [];
  for (const c of s) {
    if ('([{'.includes(c)) { st.push(c); trace.push(st.join('')); } else if (')]}'.includes(c)) {
      if (!st.length) return { ok: false, why: 'kosong', trace, at: c };
      if (st.at(-1) !== PAIR[c]) return { ok: false, why: 'pasangan', trace, at: c };
      st.pop();
      trace.push(st.join('') || 'kosong');
    }
  }
  return st.length ? { ok: false, why: 'terbuka', trace } : { ok: true, trace };
}
export const RUMUS = ['( [ 2 + 3 ] × { 4 − 1 } )', '( 2 + [ 3 × 4 ) ]', '( ( 5 + 2 ) × 3', '{ [ ( ) ] } ( )', ') 2 + 3 ('];
const WHY = { pasangan: 'Tidak sah: kurung tutup tidak cocok dengan puncak tumpukan', terbuka: 'Tidak sah: tumpukan belum kosong di akhir', kosong: 'Tidak sah: kurung tutup datang saat tumpukan kosong' };

export const PASIEN = [['Pak Ahmad', 0, 'hijau'], ['Bu Sinta', 2, 'kuning'], ['Dek Raffi', 5, 'hijau'], ['Pak Jono', 7, 'merah'], ['Nenek Ijah', 12, 'kuning'], ['Mas Bayu', 15, 'merah']];
const RANK = { merah: 0, kuning: 1, hijau: 2 };
// Who should be served next at time t (minutes after 08.00)?
export function nextPatient(list, served, t, rule = 'prioritas') {
  const waiting = list.filter((p) => !served.includes(p[0]) && p[1] <= t);
  if (!waiting.length) return null;
  return [...waiting].sort((a, b) => (rule === 'prioritas' ? RANK[a[2]] - RANK[b[2]] : 0) || a[1] - b[1])[0];
}
export function schedule(list, rule = 'prioritas', dur = 10) {
  const served = [];
  const rows = [];
  let t = 0;
  while (served.length < list.length) {
    let p = nextPatient(list, served, t, rule);
    if (!p) { t = Math.min(...list.filter((q) => !served.includes(q[0])).map((q) => q[1])); p = nextPatient(list, served, t, rule); }
    rows.push({ name: p[0], color: p[2], start: t, end: t + dur, wait: t - p[1] });
    served.push(p[0]);
    t += dur;
  }
  return rows;
}
export const jam = (m) => `${String(8 + Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
// Queue from two stacks.
export function twoStacks(ops) {
  const masuk = [];
  const keluar = [];
  const out = [];
  for (const [op, v] of ops) {
    if (op === 'DATANG') masuk.push(v);
    else { if (!keluar.length) while (masuk.length) keluar.push(masuk.pop()); if (keluar.length) out.push(keluar.pop()); }
  }
  return { masuk, keluar, out };
}

// --- drawing ---
const plate = (c, extra = '') => el('div', { class: `at-piring ${extra}`, style: { '--w': WARNA[c] || '#cbd5e1' } }, c);
const stackView = (items, label = 'Tumpukan') => el('div', { class: 'at-wadah' }, el('div', { class: 'at-tumpuk' }, items.length ? items.map((c, i) => plate(c, i === items.length - 1 ? 'puncak' : '')) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, `${label} (atas ↑)`));
const queueView = (items) => el('div', { class: 'at-wadah' }, el('div', { class: 'at-antre' }, el('span', { class: 'at-loket' }, '🪟 Loket'), items.length ? items.map((n, i) => el('span', { class: `at-orang ${i === 0 ? 'depan' : ''}` }, n)) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, 'Antrean (depan ← belakang)'));
const opsView = (ops) => el('div', { class: 'at-program' }, ops.map(([op, v], i) => el('span', { class: `at-op ${op === 'AMBIL' || op === 'LAYANI' ? 'keluar' : ''}` }, `${i + 1}. ${op}${v ? ` ${v}` : ''}`)));

function clinicRound(wrap, ctx, { list = PASIEN, rule = 'prioritas', done, free = false }) {
  const served = [];
  const rows = [];
  let t = 0;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, rule === 'prioritas' ? 'Merah dulu, lalu kuning, lalu hijau. Warna sama: yang datang lebih awal.' : 'Siapa datang dulu, dilayani dulu.');
  function arrivedAll() { return list.filter((p) => !served.includes(p[0]) && p[1] <= t); }
  function draw() {
    if (served.length < list.length && !arrivedAll().length) t = Math.min(...list.filter((q) => !served.includes(q[0])).map((q) => q[1]));
    const waiting = arrivedAll();
    const notYet = list.filter((p) => !served.includes(p[0]) && p[1] > t);
    stage.replaceChildren(...[el('div', { class: 'at-jam' }, `🕗 ${jam(t)}`),
      el('div', { class: 'at-ruang' },
        el('div', { class: 'at-tunggu' }, el('b', null, 'Ruang tunggu (ketuk pasien berikutnya)'), el('div', { class: 'at-pasien-baris' }, waiting.map((p) => onTap(el('button', { class: `at-pasien g-${p[2]}`, type: 'button' }, el('b', null, p[0]), el('small', null, `datang ${jam(p[1])}`)), () => pick(p))))),
        el('div', { class: 'at-tunggu' }, el('b', null, 'Belum datang'), el('div', { class: 'at-pasien-baris' }, notYet.length ? notYet.map((p) => el('span', { class: `at-pasien nanti g-${p[2]}` }, el('b', null, p[0]), el('small', null, jam(p[1])))) : el('small', null, '–')))),
      rows.length ? table(rows) : null].filter(Boolean));
  }
  function pick(p) {
    if (served.length >= list.length) return;
    const want = nextPatient(list, served, t, rule);
    if (want[0] !== p[0]) { ctx.mistake(); shake(stage); say(msg, 'bad', rule === 'prioritas' ? `Belum tepat: ${want[0]} (${want[2]}${want[2] === p[2] ? `, datang lebih awal` : ''}) didahulukan.` : `Belum tepat: ${want[0]} datang lebih dulu.`); return; }
    rows.push({ name: p[0], color: p[2], start: t, end: t + 10, wait: t - p[1] });
    served.push(p[0]);
    t += 10;
    ctx.sound.tap();
    say(msg, 'info', `${p[0]} diperiksa ${jam(t - 10)}–${jam(t)}, menunggu ${t - 10 - p[1]} menit.`);
    draw();
    if (served.length === list.length) {
      const avg = rows.reduce((a, r) => a + r.wait, 0) / rows.length;
      say(msg, '', `Selesai pukul ${jam(t)}. Rata-rata menunggu ${fmtNum(avg)} menit.`);
      if (done) done(rows);
    }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, free ? `Simulasi puskesmas (${rule === 'prioritas' ? 'antrean prioritas' : 'antrean biasa'}): satu dokter, 10 menit per pasien.` : 'Puskesmas Wanasari: satu dokter, 10 menit per pasien, mulai 08.00. Pilih pasien berikutnya.'), stage, msg);
}
const table = (rows) => el('div', { class: 'at-tabel' }, el('div', { class: 'at-baris kepala' }, ['', 'Pasien', 'Mulai', 'Selesai', 'Menunggu'].map((h) => el('span', null, h))),
  rows.map((r, k) => el('div', { class: `at-baris g-${r.color}` }, el('span', null, k + 1), el('span', null, r.name), el('span', null, jam(r.start)), el('span', null, jam(r.end)), el('span', null, `${r.wait} mnt`))));

// ---------- Permainan: Mesin Puskesmas ----------
// The team is the puskesmas app under test: cards really are stacked in a
// tube and lined up in a lane, and every command is carried out by hand.

const itemView = (v, cls = '', attrs = {}) => (WARNA[v]
  ? el('button', { type: 'button', class: `at-piring ${cls}`, style: { '--w': WARNA[v] }, ...attrs }, v)
  : el('button', { type: 'button', class: `at-orang ${cls}`, ...attrs }, v));
const progView = (ops, k) => el('div', { class: 'at-program' }, ops.map(([op, v], i) => el('span', { class: `at-op ${op === 'AMBIL' || op === 'LAYANI' ? 'keluar' : ''} ${i < k ? 'lewat' : i === k ? 'kini' : ''}` }, `${i + 1}. ${op}${v ? ` ${v}` : ''}`)));

// Misi 1 and 2 · carry out TARUH/AMBIL (stack) or DATANG/LAYANI (queue) by tapping the cards themselves.
function boxGame(wrap, ctx, { kind, ops, label, done, end }) {
  const source = ops.filter(([op]) => op === 'TARUH' || op === 'DATANG').map(([, v]) => v);
  const box = [];
  const out = [];
  let k = 0;
  const stack = kind === 'tumpukan';
  const msg = el('p', { class: 'reveal info' }, stack ? 'TARUH: ketuk benda yang disebut. AMBIL: ketuk benda yang bisa diambil dari tumpukan.' : 'DATANG: ketuk orang yang datang. LAYANI: ketuk orang yang dilayani loket.');
  const board = el('div', { class: 'at-papan' });
  const isIn = ([op]) => op === 'TARUH' || op === 'DATANG';
  function tapSource(v) {
    if (k >= ops.length) return;
    const [op, want] = ops[k];
    if (!isIn(ops[k])) { ctx.mistake(); say(msg, 'bad', `Perintah sekarang ${op}, bukan menaruh.`); return; }
    if (v !== want) { ctx.mistake(); say(msg, 'bad', `Perintahnya ${op} ${want}.`); return; }
    box.push(v); source.splice(source.indexOf(v), 1); step();
  }
  function tapBox(i) {
    if (k >= ops.length) return;
    const [op] = ops[k];
    if (isIn(ops[k])) { ctx.mistake(); say(msg, 'bad', `Perintah sekarang ${op} ${ops[k][1]}.`); return; }
    const want = stack ? box.length - 1 : 0;
    if (i !== want) { ctx.mistake(); shake(board); say(msg, 'bad', stack ? 'Tumpukan hanya terbuka di atas: ambil yang paling atas.' : 'Loket melayani orang paling depan.'); return; }
    out.push(stack ? box.pop() : box.shift()); step();
  }
  function step() {
    k += 1; ctx.sound.tap();
    if (k === ops.length) { draw(); say(msg, '', end); done(); return; }
    say(msg, 'info', `Perintah ${k + 1}: ${ops[k].filter(Boolean).join(' ')}.`); draw();
  }
  function draw() {
    const boxView = stack
      ? el('div', { class: 'at-wadah' }, el('div', { class: 'at-tumpuk' }, box.length ? box.map((v, i) => onTap(itemView(v, i === box.length - 1 ? 'puncak' : '', { 'data-box': i }), () => tapBox(i))) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, `${label} (atas ↑)`))
      : el('div', { class: 'at-wadah' }, el('div', { class: 'at-antre' }, el('span', { class: 'at-loket' }, '🪟 Loket'), box.length ? box.map((v, i) => onTap(itemView(v, i === 0 ? 'depan' : '', { 'data-box': i }), () => tapBox(i))) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, `${label} (depan ← belakang)`));
    fill(board, progView(ops, k), el('div', { class: 'at-meja' },
      el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, source.length ? source.map((v) => onTap(itemView(v, '', { 'data-src': v }), () => tapSource(v))) : el('span', { class: 'at-kosong' }, '–')), el('small', null, stack ? 'Dari dapur' : 'Pintu masuk')),
      boxView,
      el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, out.length ? out.map((v) => itemView(v, 'jadi')) : el('span', { class: 'at-kosong' }, '–')), el('small', null, stack ? 'Sudah diambil' : 'Sudah dilayani'))));
  }
  draw();
  wrap.append(board, msg);
}

// Can `target` be taken out of a stack when `input` arrives in order?
export function stackPossible(input, target) {
  const st = [];
  let i = 0;
  for (const t of target) {
    while (st.at(-1) !== t) { if (i >= input.length) return false; st.push(input[i++]); }
    st.pop();
  }
  return true;
}

// Misi 1b · Tebak Urutan: make the requested order with TARUH/AMBIL, or declare it impossible.
function orderRound(wrap, ctx, { input, targets, done }) {
  let ti = 0;
  let st = [];
  let i = 0;
  let out = [];
  const msg = el('p', { class: 'reveal info' }, 'Piring datang berurutan. Susun urutan ambil yang diminta, atau nyatakan tidak mungkin.');
  const board = el('div', { class: 'at-papan' });
  const target = () => targets[ti];
  const reset = () => { st = []; i = 0; out = []; };
  function finishOne(text) {
    ctx.sound.good(); ti += 1; reset();
    if (ti === targets.length) { say(msg, '', `${text} Dari 24 urutan 4 piring, hanya 14 yang mungkin dengan satu tumpukan.`); draw(true); done(); return; }
    say(msg, 'info', `${text} Pesanan berikutnya.`); draw();
  }
  function taruh() { if (ti >= targets.length || i >= input.length) return; st.push(input[i++]); ctx.sound.tap(); draw(); }
  function ambil() {
    if (ti >= targets.length || !st.length) return;
    const c = st.at(-1);
    const want = target()[out.length];
    if (c !== want) { ctx.mistake(); shake(board); say(msg, 'bad', `Piring teratas ${c}, padahal yang diminta ${want}.${st.includes(want) ? ' Piring itu terkubur: tekan Ulang, atau nyatakan tidak mungkin.' : ''}`); return; }
    out.push(st.pop()); ctx.sound.tap();
    if (out.length === input.length) { finishOne(`${target().join('–')} mungkin!`); return; }
    draw();
  }
  function never() {
    if (ti >= targets.length) return;
    if (stackPossible(input, target())) { ctx.mistake(); say(msg, 'bad', 'Urutan ini sebenarnya mungkin. Coba lagi.'); return; }
    finishOne(`Benar, ${target().join('–')} tidak mungkin: piring yang diminta sudah tertindih piring lain.`);
  }
  function draw(over = false) {
    const t = target() || targets.at(-1);
    fill(board,
      el('div', { class: 'at-pesanan' }, el('small', null, over ? 'Semua pesanan selesai' : `Pesanan ${ti + 1} dari ${targets.length}`), el('div', { class: 'at-dapur' }, t.map((c, k) => el('span', { class: `at-piring ${k < out.length ? '' : 'bayang'}`, style: { '--w': WARNA[c] } }, c)))),
      el('div', { class: 'at-meja' },
        el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, input.slice(i).map((c) => el('span', { class: 'at-piring', style: { '--w': WARNA[c] } }, c))), el('small', null, 'Dari dapur')),
        el('div', { class: 'at-wadah' }, el('div', { class: 'at-tumpuk' }, st.length ? st.map((c, k) => el('span', { class: `at-piring ${k === st.length - 1 ? 'puncak' : ''}`, style: { '--w': WARNA[c] } }, c)) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, 'Tumpukan (atas ↑)'))),
      over ? null : el('div', { class: 'kode-baris' }, button('📥 TARUH', taruh, 'primary'), button('📤 AMBIL', ambil, 'primary'), button('↺ Ulang', () => { reset(); draw(); }), button('🚫 Tidak mungkin', never)));
  }
  draw();
  wrap.append(board, msg);
}

// Misi 3 · Satpam Kurung: go through the formula; push openers, match closers with the top.
function guardRound(wrap, ctx, formulas, done) {
  let f = 0;
  let pos = 0;
  let st = [];
  let verdict = false;
  const msg = el('p', { class: 'reveal info' }, 'Kurung buka masuk tumpukan. Kurung tutup harus cocok dengan puncak. Angka dan tanda dilewati.');
  const board = el('div', { class: 'at-papan' });
  const toks = () => formulas[f].split(' ');
  const skip = () => { while (pos < toks().length && !'()[]{}'.includes(toks()[pos])) pos += 1; if (pos >= toks().length) verdict = true; };
  function act(a) {
    if (f >= formulas.length) return;
    const tk = toks()[pos];
    const top = st.at(-1);
    let want;
    if (verdict) want = st.length ? 'terbuka' : 'sah';
    else if ('([{'.includes(tk)) want = 'taruh';
    else if (!st.length) want = 'kosong';
    else want = top === PAIR[tk] ? 'pasang' : 'pasangan';
    if (a !== want) {
      ctx.mistake(); shake(board);
      say(msg, 'bad', verdict ? 'Rumus sudah habis. Lihat isi tumpukan.' : '([{'.includes(tk) ? 'Kurung buka selalu ditaruh di tumpukan.' : !st.length ? 'Tumpukannya kosong. Kurung tutup ini tidak punya pasangan.' : `Puncak tumpukan ${top}, kurung tutupnya ${tk}.`);
      return;
    }
    ctx.sound.tap();
    if (a === 'taruh') { st.push(tk); pos += 1; skip(); draw(); return; }
    if (a === 'pasang') { st.pop(); pos += 1; skip(); draw(); return; }
    const text = a === 'sah' ? `${formulas[f]}: sah, tumpukan kosong di akhir.` : `${formulas[f]}: ${WHY[a]}.`;
    f += 1; pos = 0; st = []; verdict = false;
    if (f === formulas.length) { say(msg, '', text); draw(true); done(); return; }
    skip(); say(msg, 'info', `${text} Rumus berikutnya.`); draw();
  }
  function draw(over = false) {
    const t = formulas[Math.min(f, formulas.length - 1)].split(' ');
    fill(board,
      el('div', { class: 'au-status at-rumus' }, t.map((x, i) => el('span', { class: over ? '' : i < pos ? 'at-lewat' : i === pos && !verdict ? 'at-kini' : '' }, x)), ' '),
      el('div', { class: 'at-meja' }, el('div', { class: 'at-wadah at-kurung' }, el('div', { class: 'at-tumpuk' }, st.length ? st.map((c, k) => el('span', { class: `at-piring ${k === st.length - 1 ? 'puncak' : ''}` }, c)) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, 'Tumpukan satpam (atas ↑)'))),
      over ? null : el('div', { class: 'kpb-opsi' }, (verdict
        ? [['sah', '✅ Sah'], ['terbuka', '🚨 Masih ada kurung terbuka']]
        : [['taruh', '📥 Taruh di tumpukan'], ['pasang', '🔗 Pasangkan dengan puncak'], ['pasangan', '🚨 Tidak cocok'], ['kosong', '🚨 Tumpukan kosong']]).map(([a, l]) => onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-a': a }, l), () => act(a)))));
  }
  skip(); draw();
  wrap.append(board, msg);
}

// Misi 4 · Urungkan dan Ulangi with two visible stacks.
const AKSI = [['ketik', 'Selamat'], ['ketik', ' pagi'], ['tebal', 'pagi'], ['URUNGKAN'], ['URUNGKAN'], ['ketik', ' siang'], ['ULANGI']];
const aksiName = ([a, v]) => (a === 'ketik' ? `ketik "${v}"` : a === 'tebal' ? `tebalkan "${v}"` : a);
function undoRound(wrap, ctx, done) {
  let k = 0;
  const un = [];
  const re = [];
  let pushed = false;
  let cleared = false;
  const msg = el('p', { class: 'reveal info' }, 'Aksi baru masuk tumpukan Urungkan. URUNGKAN memindahkan puncaknya ke tumpukan Ulangi. ULANGI memindahkannya kembali.');
  const board = el('div', { class: 'at-papan' });
  const text = () => {
    let s = '';
    let bold = null;
    for (const [a, v] of un) { if (a === 'ketik') s += v; else bold = v; }
    if (bold && s.includes(bold)) { const i = s.lastIndexOf(bold); return [s.slice(0, i), el('b', null, bold), s.slice(i + bold.length)]; }
    return [s];
  };
  function act(a) {
    if (k >= AKSI.length) return;
    const cur = AKSI[k];
    const fresh = cur[0] === 'ketik' || cur[0] === 'tebal';
    let ok = false;
    if (fresh && a === 'taruh' && !pushed) { un.push(cur); pushed = true; ok = true; }
    else if (fresh && a === 'kosong' && re.length && !cleared) { re.length = 0; cleared = true; ok = true; }
    else if (cur[0] === 'URUNGKAN' && a === 'urung' && un.length) { re.push(un.pop()); ok = true; }
    else if (cur[0] === 'ULANGI' && a === 'ulang' && re.length) { un.push(re.pop()); ok = true; }
    else if (cur[0] === 'ULANGI' && a === 'tidak' && !re.length) ok = true;
    if (!ok) {
      ctx.mistake(); shake(board);
      say(msg, 'bad', fresh ? (pushed ? 'Aksi baru sudah masuk. Apa yang terjadi pada tumpukan Ulangi?' : 'Aksi baru masuk tumpukan Urungkan.') : cur[0] === 'URUNGKAN' ? 'URUNGKAN memindahkan puncak Urungkan ke Ulangi.' : re.length ? 'ULANGI memindahkan puncak Ulangi ke Urungkan.' : 'Tumpukan Ulangi kosong. Adakah yang bisa diulang?');
      return;
    }
    ctx.sound.tap();
    if (fresh && !(pushed && (cleared || !re.length))) { draw(); return; }
    k += 1; pushed = false; cleared = false;
    if (k === AKSI.length) { draw(); say(msg, '', 'Teks "Selamat siang". ULANGI tidak berbuat apa-apa karena aksi baru " siang" sudah mengosongkan tumpukan Ulangi.'); done(); return; }
    say(msg, 'info', `Aksi ${k + 1}: ${aksiName(AKSI[k])}.`); draw();
  }
  const tube = (items, label) => el('div', { class: 'at-wadah' }, el('div', { class: 'at-tumpuk' }, items.length ? items.map((x, i) => el('span', { class: `at-orang ${i === items.length - 1 ? 'depan' : ''}` }, aksiName(x))) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, label));
  function draw() {
    fill(board,
      el('div', { class: 'at-program' }, AKSI.map((x, i) => el('span', { class: `at-op ${x[0] === 'URUNGKAN' || x[0] === 'ULANGI' ? 'keluar' : ''} ${i < k ? 'lewat' : i === k ? 'kini' : ''}` }, `${i + 1}. ${aksiName(x)}`))),
      el('div', { class: 'au-status at-layar' }, '📝 ', ...text(), el('span', { class: 'at-kursor' }, '|')),
      el('div', { class: 'at-meja' }, tube(un, 'Urungkan (atas ↑)'), tube(re, 'Ulangi (atas ↑)')),
      k < AKSI.length ? el('div', { class: 'kpb-opsi' }, [['taruh', '📥 Taruh aksi di Urungkan'], ['urung', '↪ Urungkan → Ulangi'], ['ulang', '↩ Ulangi → Urungkan'], ['kosong', '🗑 Kosongkan Ulangi'], ['tidak', '🤷 Tidak ada yang diulang']].map(([a, l]) => onTap(el('button', { class: 'kpb-cap', type: 'button', 'data-a': a }, l), () => act(a)))) : null);
  }
  draw();
  wrap.append(board, msg);
}

// Misi Bos · antrean dari dua tumpukan MASUK dan KELUAR.
const DUA = [['DATANG', '1'], ['DATANG', '2'], ['DATANG', '3'], ['LAYANI'], ['DATANG', '4'], ['LAYANI'], ['LAYANI'], ['LAYANI']];
function twoStackRound(wrap, ctx, done) {
  let k = 0;
  const masuk = [];
  const keluar = [];
  const out = [];
  let poured = false;
  const msg = el('p', { class: 'reveal info' }, 'DATANG: ketuk tumpukan MASUK. LAYANI: ambil dari puncak KELUAR. Bila KELUAR kosong, tuang dulu MASUK ke KELUAR satu per satu.');
  const board = el('div', { class: 'at-papan' });
  function act(a) {
    if (k >= DUA.length) return;
    const [op, v] = DUA[k];
    if (op === 'DATANG') {
      if (a !== 'masuk') { ctx.mistake(); say(msg, 'bad', 'Orang yang datang masuk ke tumpukan MASUK.'); return; }
      masuk.push(v); k += 1; ctx.sound.tap();
    } else if (a === 'tuang') {
      if ((keluar.length && !poured) || !masuk.length) { ctx.mistake(); say(msg, 'bad', keluar.length ? 'KELUAR masih berisi. Tuang hanya bila KELUAR kosong.' : 'MASUK kosong.'); return; }
      keluar.push(masuk.pop()); poured = true; ctx.sound.tap(); draw(); return;
    } else if (a === 'keluar') {
      if (!keluar.length) { ctx.mistake(); say(msg, 'bad', 'KELUAR kosong. Tuang dulu dari MASUK.'); return; }
      if (poured && masuk.length) { ctx.mistake(); say(msg, 'bad', 'Tuang sampai MASUK kosong dulu, supaya yang datang paling awal ada di puncak KELUAR.'); return; }
      out.push(keluar.pop()); k += 1; poured = false; ctx.sound.tap();
    } else { ctx.mistake(); say(msg, 'bad', 'Puncak MASUK adalah orang yang datang paling akhir. Ambil dari KELUAR.'); return; }
    if (k === DUA.length) { draw(); say(msg, '', `Yang dilayani: ${out.join(', ')}. Dua tumpukan bekerja seperti satu antrean: urutan dibalik dua kali.`); done(); return; }
    say(msg, 'info', `Perintah ${k + 1}: ${DUA[k].filter(Boolean).join(' ')}.`); draw();
  }
  const tube = (items, label, a) => onTap(el('div', { class: 'at-wadah at-tabung', role: 'button', 'data-a': a }, el('div', { class: 'at-tumpuk' }, items.length ? items.map((x, i) => el('span', { class: `at-orang ${i === items.length - 1 ? 'depan' : ''}` }, x)) : el('span', { class: 'at-kosong' }, 'kosong')), el('small', null, label)), () => act(a));
  function draw() {
    const tuang = DUA[k] && DUA[k][0] === 'LAYANI' && !keluar.length && masuk.length;
    fill(board, progView(DUA, k),
      el('div', { class: 'at-meja' }, tube(masuk, 'MASUK (atas ↑)', 'masuk'),
        el('div', { class: 'at-wadah' }, onTap(el('button', { class: `kpb-cap ${tuang ? 'besar' : ''}`, type: 'button', 'data-a': 'tuang' }, '⤳ Tuang 1'), () => act('tuang'))),
        tube(keluar, 'KELUAR (atas ↑)', 'keluar'),
        el('div', { class: 'at-wadah' }, el('div', { class: 'at-dapur' }, out.length ? out.map((x) => el('span', { class: 'at-orang jadi' }, x)) : el('span', { class: 'at-kosong' }, '–')), el('small', null, 'Sudah dilayani'))));
  }
  draw();
  wrap.append(board, msg);
}

const HEAD03 = {
  piring: ['Meja Piring', 'Kalian mesin aplikasi puskesmas yang sedang diuji. Pemanasan di dapur hajatan: jalankan perintah tumpukan piring dengan tangan.'],
  urutan: ['Tebak Urutan', 'Piring merah, biru, hijau, kuning datang berurutan. Bisakah pesanan urutan ambil ini dibuat dengan satu tumpukan?'],
  loket: ['Loket', 'Loket pendaftaran puskesmas memakai antrean. Jalankan perintah DATANG dan LAYANI.'],
  salah: ['Loket Salah Pasang', 'Programnya keliru memakai tumpukan untuk loket! Jalankan perintah yang sama dan lihat siapa yang dilayani.'],
  kurung: ['Satpam Kurung', 'Aplikasi menghitung dosis obat dari rumus. Periksa pasangan kurung dengan tumpukan sebelum rumus dipakai.'],
  undo: ['Urungkan dan Ulangi', 'Petugas mengetik pengumuman. Jalankan aksi satu per satu dengan dua tumpukan.'],
  triase: ['Triase', 'Satu dokter, 10 menit per pasien, mulai 08.00. Gelang merah dulu, lalu kuning, lalu hijau.'],
  fifo: ['Triase: Antrean Biasa', 'Bandingkan: hari ini aplikasi memakai antrean biasa. Siapa datang dulu, dilayani dulu.'],
  boss: ['Antrean dari Dua Tumpukan', 'Mesin puskesmas hanya punya dua tumpukan, MASUK dan KELUAR. Bisakah keduanya melayani pasien seperti antrean?'],
};

export default {
  id: 'sma-03-antrean-tumpukan',
  title: 'Antrean Loket dan Tumpukan Piring',
  topic: 'Tumpukan (stack), antrean (queue), dan antrean prioritas',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🍽️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjalankan operasi tumpukan dan antrean, memeriksa pasangan kurung dan urungkan–ulangi dengan tumpukan, menjadwalkan pasien dengan antrean prioritas dan membandingkannya dengan antrean biasa, serta membangun antrean dari dua tumpukan.',
  extraModes: [
    { id: 'meja', icon: '🍽️', label: 'Meja Piring dan Loket', desc: 'Tekan TARUH, AMBIL, DATANG, dan LAYANI; piring dan orang bergerak di layar', create: createTable },
    { id: 'kurung', icon: '🧮', label: 'Pemeriksa Kurung', desc: 'Ketik rumus, lalu jalankan pemeriksaan langkah demi langkah dengan tumpukan yang tampak', create: createBrackets },
    { id: 'puskesmas', icon: '🏥', label: 'Simulasi Puskesmas', desc: 'Pasien acak berdatangan; pilih pasien berikutnya dengan aturan prioritas atau antrean biasa, lalu bandingkan lama menunggu', create: createClinic },
    { id: 'giliran', icon: '🔁', label: 'Tebak Isi Akhir', desc: 'Satu tim menyusun urutan perintah, tim berikutnya menebak isi akhir tumpukan atau antrean sebelum perintah dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act antrean-tumpukan at-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD03[key], '🏥'));
      if (r === 0) { head('piring', 1); boxGame(wrap, ctx, { kind: 'tumpukan', ops: STACK_OPS, label: 'Tumpukan piring', done: () => next(), end: 'Diambil hijau, kuning, biru; tersisa merah dan putih. Yang terakhir ditaruh, pertama diambil.' }); }
      else if (r === 1) { head('loket', 2); boxGame(wrap, ctx, { kind: 'antrean', ops: QUEUE_OPS, label: 'Antrean loket', done: () => next(), end: 'Dilayani Ani, Budi, Citra; masih mengantre Dodi dan Eka. Yang datang dulu, dilayani dulu.' }); }
      else if (r === 2) { head('urutan', 1); orderRound(wrap, ctx, { input: ['merah', 'biru', 'hijau', 'kuning'], targets: [['hijau', 'kuning', 'biru', 'merah'], ['hijau', 'merah', 'biru', 'kuning'], ['biru', 'hijau', 'merah', 'kuning']], done: () => next(4600) }); }
      else if (r === 3) { head('kurung', 3); guardRound(wrap, ctx, [RUMUS[0], RUMUS[1]], () => next()); }
      else if (r === 4) { head('undo', 4); undoRound(wrap, ctx, () => next(4600)); }
      else if (r === 5) { head('triase', 5); clinicRound(wrap, ctx, { done: () => next(4600) }); }
      else if (r === 6) { head('salah', 2); boxGame(wrap, ctx, { kind: 'tumpukan', ops: QUEUE_OPS.map(([op, v]) => [op, v]), label: 'Loket salah pasang', done: () => next(4600), end: 'Citra, Dodi, Eka dilayani, padahal Ani dan Budi datang paling awal dan masih menunggu. Tumpukan tidak adil untuk antrean.' }); }
      else if (r === 7) { head('kurung', 3); guardRound(wrap, ctx, [RUMUS[2], RUMUS[3], RUMUS[4]], () => next()); }
      else if (r === 8) {
        head('fifo', 5);
        clinicRound(wrap, ctx, { rule: 'fifo', done: () => { wrap.append(el('p', { class: 'reveal info' }, 'Rata-rata menunggu sama, 109 : 6 ≈ 18,17 menit. Tetapi dengan prioritas Pak Jono (merah) menunggu 3 menit, dengan antrean biasa 23 menit.')); next(6000); } });
      } else { head('boss', 'Bos'); twoStackRound(wrap, ctx, () => next(4600)); }
    }
    render();
  },
};

function createTable(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  const st = [];
  const q = [];
  let taken = [];
  let served = [];
  let nameI = 0;
  const stage = el('div');
  const draw = () => stage.replaceChildren(el('div', { class: 'at-meja' },
    el('div', { class: 'at-kolom' }, stackView(st), el('div', { class: 'seg' }, Object.keys(WARNA).map((c) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: { '--w': WARNA[c] } }, `TARUH ${c}`), () => { if (st.length < 9) { st.push(c); ctx.sound.tap(); draw(); } })),
      onTap(el('button', { class: 'seg-btn on', type: 'button' }, 'AMBIL'), () => { if (st.length) { taken.push(st.pop()); ctx.sound.tap(); draw(); } })), el('small', null, `Diambil: ${taken.join(', ') || '–'}`)),
    el('div', { class: 'at-kolom' }, queueView(q), el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, `DATANG ${NAMA[nameI % NAMA.length]}`), () => { if (q.length < 8) { q.push(NAMA[nameI++ % NAMA.length]); ctx.sound.tap(); draw(); } }),
      onTap(el('button', { class: 'seg-btn on', type: 'button' }, 'LAYANI'), () => { if (q.length) { served.push(q.shift()); ctx.sound.tap(); draw(); } })), el('small', null, `Dilayani: ${served.join(', ') || '–'}`))));
  wrap.append(el('p', { class: 'prompt' }, 'Tumpukan: masuk dan keluar dari atas. Antrean: masuk di belakang, keluar di depan.'), stage,
    el('div', { class: 'kode-baris' }, button('Kosongkan', () => { st.length = 0; q.length = 0; taken = []; served = []; nameI = 0; draw(); })));
  draw();
}

function createBrackets(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  let text = RUMUS[1];
  let k = 0;
  const input = el('input', { class: 'kh-masukan', value: text, 'aria-label': 'Rumus' });
  input.addEventListener('input', () => { text = input.value; k = 0; draw(); });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  const out = el('div');
  function draw() {
    const chars = [...text];
    const idx = chars.map((c, i) => ('()[]{}'.includes(c) ? i : -1)).filter((i) => i >= 0);
    const st = [];
    let bad = null;
    for (const i of idx.slice(0, k)) {
      const c = chars[i];
      if ('([{'.includes(c)) st.push(c);
      else if (!st.length) { bad = 'kosong'; break; } else if (st.at(-1) !== PAIR[c]) { bad = 'pasangan'; break; } else st.pop();
    }
    const end = k >= idx.length;
    const verdict = bad ? WHY[bad] : end ? (st.length ? WHY.terbuka : 'Sah: semua kurung tutup cocok dan tumpukan kosong') : `Langkah ${k} dari ${idx.length}`;
    out.replaceChildren(el('div', { class: 'au-status at-rumus' }, chars.map((c, i) => el('span', { class: idx.indexOf(i) === k - 1 ? 'at-kini' : idx.indexOf(i) >= 0 && idx.indexOf(i) < k ? 'at-lewat' : '' }, c))),
      el('div', { class: 'at-tumpuk at-kurung' }, st.length ? st.map((c, i) => el('div', { class: `at-piring ${i === st.length - 1 ? 'puncak' : ''}`, style: { '--w': '#e0e7ff' } }, c)) : el('span', { class: 'at-kosong' }, 'kosong')),
      el('p', { class: bad || (end && st.length) ? 'reveal bad' : end ? 'reveal' : 'reveal info' }, verdict));
    return { done: bad || end };
  }
  wrap.append(el('p', { class: 'prompt' }, 'Pemeriksa kurung: kurung buka di-TARUH, kurung tutup harus cocok dengan puncak.'), input,
    el('div', { class: 'seg' }, RUMUS.map((r2, i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, 'abcde'[i]), () => { text = r2; input.value = r2; k = 0; draw(); }))),
    out, el('div', { class: 'kode-baris' }, button('Langkah ➜', () => { if (!draw().done) { k++; ctx.sound.tap(); draw(); } }, 'primary'), button('Jalankan semua', () => { k = 999; draw(); }), button('Ulang', () => { k = 0; draw(); })));
  draw();
}

function createClinic(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  const names = ['Pak Ahmad', 'Bu Sinta', 'Dek Raffi', 'Pak Jono', 'Nenek Ijah', 'Mas Bayu', 'Kak Lala', 'Om Teguh'];
  let rule = 'prioritas';
  let list = PASIEN;
  const results = {};
  function fresh() { const n = ctx.rand.int(6, 8); list = names.slice(0, n).map((nm) => [nm, ctx.rand.int(0, 40), ctx.rand.pick(['merah', 'kuning', 'hijau', 'hijau'])]).sort((a, b) => a[1] - b[1]); Object.keys(results).forEach((k) => delete results[k]); }
  function draw() {
    wrap.replaceChildren(el('div', { class: 'seg' }, [['prioritas', 'Antrean prioritas'], ['fifo', 'Antrean biasa']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${rule === k ? 'on' : ''}`, type: 'button' }, l), () => { rule = k; draw(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Pasien acak'), () => { fresh(); draw(); }), onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Pasien lembar kerja'), () => { list = PASIEN; Object.keys(results).forEach((k) => delete results[k]); draw(); })));
    clinicRound(wrap, ctx, { list, rule, free: true, done: (rows) => { results[rule] = rows; wrap.append(compare()); } });
  }
  const compare = () => el('div', { class: 'ab-lapisan' }, ['prioritas', 'fifo'].filter((k) => results[k]).map((k) => {
    const rows = results[k];
    const avg = (c) => { const w = rows.filter((r) => !c || r.color === c).map((r) => r.wait); return w.length ? fmtNum(w.reduce((a, b) => a + b, 0) / w.length) : '–'; };
    return el('div', { class: 'ab-lap-baris' }, el('span', null, k === 'prioritas' ? 'Prioritas' : 'Antrean biasa'), el('b', null, `rata-rata ${avg()} mnt · merah ${avg('merah')} · kuning ${avg('kuning')} · hijau ${avg('hijau')}`));
  }));
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act antrean-tumpukan' });
  root.append(wrap);
  let n = 2;
  let pts = [];
  let turn = 0;
  const ROUNDS = 2;
  function start(k) { n = k; pts = Array(n).fill(0); turn = 0; compose(); }
  function compose() {
    if (turn >= n * ROUNDS) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Tebak Isi Akhir', start) });
    const maker = turn % n;
    const guesser = (maker + 1) % n;
    const kind = Math.floor(turn / n) % 2 ? 'antrean' : 'tumpukan';
    const ops = [];
    const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: susun 5–8 perintah. Tim ${guesser + 1} jangan dulu melihat jawabannya!`);
    const prog = el('div');
    const items = kind === 'tumpukan' ? ['merah', 'biru', 'hijau', 'kuning'] : NAMA.slice(0, 5);
    const drawProg = () => prog.replaceChildren(ops.length ? opsView(ops) : el('p', { class: 'reveal hint' }, 'Belum ada perintah.'));
    drawProg();
    const put = kind === 'tumpukan' ? 'TARUH' : 'DATANG';
    const take = kind === 'tumpukan' ? 'AMBIL' : 'LAYANI';
    wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Tim ${maker + 1} menyusun perintah ${kind}`), prog,
      el('div', { class: 'seg' }, items.map((v) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: kind === 'tumpukan' ? { '--w': WARNA[v] } : null }, `${put} ${v}`), () => { if (ops.length < 8) { ops.push([put, v]); drawProg(); } })),
        onTap(el('button', { class: 'seg-btn on', type: 'button' }, take), () => { if (ops.length < 8) { ops.push([take]); drawProg(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button' }, '⌫'), () => { ops.pop(); drawProg(); })),
      el('div', { class: 'kode-baris' }, button('Selesai, giliran menebak ➜', () => { if (ops.length < 5) { say(msg, 'bad', 'Butuh sedikitnya 5 perintah.'); return; } guess(kind, ops, items, maker, guesser); }, 'primary')), msg);
  }
  function guess(kind, ops, items, maker, guesser) {
    const want = runOps(kind, ops).box;
    const g = [];
    const msg = el('p', { class: 'reveal info' }, `Tim ${guesser + 1}: susun isi akhir ${kind === 'tumpukan' ? 'dari bawah ke atas' : 'dari depan ke belakang'}, lalu Kunci.`);
    const view = el('div');
    const drawG = () => view.replaceChildren(kind === 'tumpukan' ? stackView(g, 'Tebakan') : queueView(g));
    drawG();
    let locked = false;
    wrap.replaceChildren(scoreBar(pts, guesser), el('p', { class: 'prompt' }, `Tim ${guesser + 1} menebak isi akhir`), opsView(ops), view,
      el('div', { class: 'seg' }, items.map((v) => onTap(el('button', { class: 'seg-btn at-warna', type: 'button', style: kind === 'tumpukan' ? { '--w': WARNA[v] } : null }, v), () => { if (!locked && g.length < 8) { g.push(v); drawG(); } })),
        onTap(el('button', { class: 'seg-btn', type: 'button' }, '⌫'), () => { if (!locked) { g.pop(); drawG(); } })),
      el('div', { class: 'kode-baris' }, button('Kunci', () => {
        if (locked) return;
        locked = true;
        const ok = g.join() === want.join();
        if (ok) { pts[guesser]++; ctx.sound.good(); } else { pts[maker]++; ctx.sound.bad(); }
        view.append(el('div', { class: 'at-meja' }, el('b', null, 'Isi sebenarnya:'), kind === 'tumpukan' ? stackView(want) : queueView(want)));
        say(msg, ok ? '' : 'bad', ok ? `Tepat! Poin untuk Tim ${guesser + 1}.` : `Belum tepat. Poin untuk Tim ${maker + 1}.`);
        turn++;
        setTimeout(compose, 3200);
      }, 'primary')), msg);
  }
  pickTeams(wrap, 'Tebak Isi Akhir', start);
}
