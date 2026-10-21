// Lagu yang Dimampatkan — SMP (13–15 tahun), kompresi. Repeated words are
// replaced by a pointer [mundur, panjang] that copies earlier words, one
// word at a time, so a pointer may copy what it has just copied. Unpack
// messages, compress the "Kentongan Pagi" song to its cheapest form, and
// tell lossless from lossy compression.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const BAIT1 = ['tong tong tong kentongan berbunyi', 'tong tong tong kentongan berbunyi', 'ayo bangun ayo bangun hari sudah pagi', 'tong tong tong kentongan berbunyi'];
export const BAIT2 = ['cuci muka cuci tangan lalu sarapan', 'cuci muka cuci tangan lalu sarapan', 'ayo berangkat ayo berangkat ke sekolah', 'tong tong tong kentongan berbunyi'];
const PANTUN = [
  ['main layang layang di tanah lapang', 'main layang layang sampai petang', 'pulang pulang pulang ke rumah', 'main layang layang di tanah lapang'],
  ['ombak datang ombak pergi', 'perahu nelayan pulang pagi', 'ombak datang ombak pergi', 'ikan segar ikan segar dibawa pulang'],
  ['hujan turun hujan turun di atas genting', 'tik tik tik tik bunyinya', 'hujan turun hujan turun di atas genting', 'ayo tidur ayo tidur sudah malam'],
];
export const SOAL1 = 'padi menguning di sawah [4,4] petani tersenyum [6,4] panen tiba [2,2]';
const UNPACK = [SOAL1, 'ha [1,5]', 'tik tok [2,4]', 'la [1,7]', 'gotong royong [2,2] kerja bakti [4,4] bersama', 'satu dua tiga [3,3] empat lima [4,2]', 'ayo menabung [2,2] sedikit demi sedikit [3,3] lama lama [2,2] menjadi bukit'];

const words = (lines) => (lines.length ? lines.join(' ').split(' ') : []);
export const letters = (w) => w.replace(/\s/g, '').length;

// "kata [b,l] kata" → [{ w } | { b, l }]
export function parse(text) {
  return text.trim().split(/\s+/).map((t) => { const m = /^\[(\d+),(\d+)\]$/.exec(t); return m ? { b: +m[1], l: +m[2] } : { w: t }; });
}
// Unpack word by word; a pointer may copy words it has just written.
export function decode(tokens, prefix = []) {
  const out = [...prefix];
  for (const t of tokens) {
    if (t.w) { out.push(t.w); continue; }
    if (t.b < 1 || t.b > out.length || t.l < 2) return null;
    for (let k = 0; k < t.l; k++) out.push(out[out.length - t.b]);
  }
  return out.slice(prefix.length);
}
export const cost = (tokens) => tokens.reduce((s, t) => s + (t.w ? letters(t.w) : 2), 0);
export const show = (tokens) => tokens.map((t) => (t.w ? t.w : `[${t.b},${t.l}]`)).join(' ');

// The nearest earlier start s < i (in all = prefix + text) whose words match
// all[i .. i+len). Overlap with the copied part itself is allowed.
export function source(all, i, len) {
  for (let s = i - 1; s >= 0; s--) {
    let ok = true;
    for (let k = 0; k < len && ok; k++) ok = all[s + k] === all[i + k];
    if (ok) return s;
  }
  return -1;
}
// Cheapest cost for text words after a prefix (dynamic programming).
export function optimal(text, prefix = []) {
  const all = [...prefix, ...text];
  const P = prefix.length;
  const n = text.length;
  const best = Array(n + 1).fill(Infinity);
  best[0] = 0;
  for (let i = 0; i < n; i++) {
    if (best[i] === Infinity) continue;
    best[i + 1] = Math.min(best[i + 1], best[i] + letters(text[i]));
    for (let len = 2; i + len <= n; len++) if (source(all, P + i, len) >= 0) best[i + len] = Math.min(best[i + len], best[i] + 2);
  }
  return best[n];
}

export default {
  id: 'smp-04-lagu-mampat',
  title: 'Lagu yang Dimampatkan',
  topic: 'Kompresi tanpa kehilangan dan dengan kehilangan',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🎶',
  source: { name: 'CS Unplugged: Text Compression', url: 'https://www.csunplugged.org/en/topics/text-compression/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membongkar dan membuat teks mampat dengan penunjuk [mundur, panjang], menghitung penghematannya, dan membedakan kompresi tanpa kehilangan dan dengan kehilangan.',
  extraModes: [
    { id: 'pemampat', icon: '🗜️', label: 'Pemampat', desc: 'Pilih kata yang berulang; penunjuk dan biaya muncul langsung', create: createCompressor },
    { id: 'pembongkar', icon: '📦', label: 'Pembongkar', desc: 'Ketuk tempat setiap penunjuk mulai menyalin dan lihat kata-katanya disalin', create: createUnpacker },
    { id: 'foto', icon: '🖼️', label: 'Kompresi Foto', desc: 'Geser kualitas foto batik dari 100% sampai 5% dan lihat ukuran berkasnya', create: createPhoto },
    { id: 'tim', icon: '🤝', label: 'Berebut Hemat', desc: 'Tim bergiliran menambah satu penunjuk pada bait yang sama; huruf yang dihemat menjadi skor', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lagu-mampat' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 2, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) unpackRound(wrap, ctx, { text: SOAL1, prompt: 'Bongkar pesan teman: ketuk kata tempat setiap penunjuk mulai menyalin.', done: next });
      else if (r === 1) compressRound(wrap, ctx, { lines: BAIT1, title: 'Kentongan Pagi, bait 1', done: next });
      else if (r === 2) ask('Bait 1 sebelum dimampatkan 118 huruf, sesudahnya 51. Berapa yang dihemat?', [['67 huruf, sekitar 57%', true], ['51 huruf, sekitar 43%'], ['67 huruf, sekitar 67%'], ['118 huruf, 100%']]);
      else if (r === 3) unpackRound(wrap, ctx, { text: 'ha [1,5]', prompt: 'Penunjuk yang menyalin dirinya sendiri: bongkar "ha [1,5]".', done: next });
      else if (r === 4) ask('"la [1,7]" berisi berapa kata "la"?', [[7], [8, true], [2], [14]], 4);
      else if (r === 5) compressRound(wrap, ctx, { lines: ['dor dor dor dor dor dor dor dor dor dor'], title: 'Sepuluh kali dor', done: next });
      else if (r === 6) compressRound(wrap, ctx, { lines: BAIT2, prefix: BAIT1, title: 'Bait 2 (boleh menunjuk ke bait 1)', done: next });
      else if (r === 7) ask('Di baris "cuci muka cuci tangan …", mengapa "cuci" yang kedua tidak bisa diganti penunjuk?', [['Penunjuk harus menggantikan paling sedikit 2 kata, dan "cuci tangan" belum pernah muncul', true], ['Karena "cuci" terlalu pendek untuk disalin'], ['Karena penunjuk tidak boleh menunjuk mundur'], ['Karena kata yang sama tidak boleh diulang']], 1);
      else if (r === 8) {
        const photo = photoView(30);
        ask('Foto batik 100% = 3 MB, 30% = 0,5 MB, 5% = 0,1 MB. Versi mana untuk grup kelas, dan mana untuk spanduk?', [['Grup kelas 30%, spanduk 100%', true], ['Grup kelas 100%, spanduk 5%'], ['Keduanya 5%'], ['Grup kelas 5%, spanduk 30%']], 2, photo.node);
      } else sortRound(wrap, ctx, { done: next });
    }
    render();
  },
};

// Word cards for the compressor: prefix (dim) then the text lines.
function compressRound(wrap, ctx, { lines, prefix = [], title, done, team }) {
  const text = words(lines);
  const pre = words(prefix);
  const all = [...pre, ...text];
  const P = pre.length;
  const lineOf = lines.flatMap((l, k) => l.split(' ').map(() => k));
  const target = optimal(text, pre);
  const before = text.reduce((s, w) => s + letters(w), 0);
  const ptrs = []; // { i, len, b } in text positions
  let start = null;
  let flash = null;
  let finished = false;
  const stage = el('div', { class: 'mampat' });
  const out = el('p', { class: 'mampat-hasil' });
  const meter = el('div', { class: 'mampat-biaya' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kata pertama dan terakhir dari bagian yang berulang.');
  const covered = (i) => ptrs.find((p) => i >= p.i && i < p.i + p.len);
  const tokens = () => {
    const t = [];
    for (let i = 0; i < text.length;) { const p = covered(i); if (p && p.i === i) { t.push({ b: p.b, l: p.len }); i += p.len; } else { t.push({ w: text[i] }); i++; } }
    return t;
  };
  function card(i) {
    const p = covered(i);
    const src = flash && i + P >= flash.s && i + P < flash.s + flash.len;
    const n = onTap(el('button', { class: `kata ${p ? 'tertunjuk' : ''} ${start === i ? 'mulai' : ''} ${src ? 'sumber' : ''}`, type: 'button', 'data-i': i },
      el('small', null, i + 1 + P), text[i], p && p.i === i ? el('b', { class: 'kata-ptr' }, `[${p.b},${p.len}]`) : null), () => tap(i));
    return n;
  }
  function draw() {
    const rows = [];
    if (pre.length) rows.push(el('p', { class: 'mampat-awal' }, pre.map((w, k) => el('span', { class: flash && k >= flash.s && k < flash.s + flash.len ? 'sumber' : '' }, el('small', null, k + 1), w, ' '))));
    lines.forEach((_, k) => rows.push(el('div', { class: 'mampat-baris' }, text.map((_, i) => i).filter((i) => lineOf[i] === k).map(card))));
    stage.replaceChildren(...rows);
    const t = tokens();
    const c = cost(t);
    out.textContent = show(t);
    meter.replaceChildren(el('span', null, `Sebelum ${before}`), el('span', null, `Sesudah ${c}`), el('span', null, `Hemat ${before - c} (${Math.round((100 * (before - c)) / before)}%)`), team ? null : el('span', { class: 'biaya-target' }, `Target ${target}`));
  }
  function tap(i) {
    if (finished) return;
    const p = covered(i);
    if (p) { ptrs.splice(ptrs.indexOf(p), 1); start = null; ctx.sound.tap(); draw(); return; }
    if (start === null) { start = i; ctx.sound.tap(); draw(); return; }
    const a = Math.min(start, i);
    const len = Math.abs(start - i) + 1;
    start = null;
    if (len < 2) { draw(); return; }
    for (let k = a; k < a + len; k++) if (covered(k)) { msg.className = 'reveal bad'; msg.textContent = 'Bagian itu sudah tertunjuk.'; draw(); return; }
    const s = source(all, P + a, len);
    if (s < 0) { msg.className = 'reveal bad'; msg.textContent = `"${text.slice(a, a + len).join(' ')}" belum pernah muncul sebelumnya.`; shake(stage); if (!team) ctx.mistake(); draw(); return; }
    const p2 = { i: a, len, b: P + a - s };
    ptrs.push(p2);
    flash = { s, len };
    ctx.sound.good();
    msg.className = 'reveal info';
    msg.textContent = `[${p2.b},${len}]: mundur ${p2.b} kata, salin ${len} kata${s + len > P + a ? ' (ikut menyalin yang baru disalin)' : ''}.`;
    draw();
    setTimeout(() => { flash = null; draw(); }, 1500);
    if (team) { team(before - cost(tokens()), len); return; }
    if (cost(tokens()) <= target) {
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Paling hemat: biaya ${cost(tokens())}. Bongkar ulang menghasilkan lirik yang persis sama.`;
      done();
    }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, title), stage, meter, out, msg);
  return { tokens, remaining: () => { for (let i = 0; i + 1 < text.length; i++) if (!covered(i) && !covered(i + 1) && source(all, P + i, 2) >= 0) return true; return false; } };
}

// Unpack: literal words flow in; for each pointer tap where copying starts.
function unpackRound(wrap, ctx, { text, prompt, done }) {
  const tokens = parse(text);
  const out = [];
  let t = 0;
  let busy = false;
  const src = el('p', { class: 'bongkar-teks' });
  const stage = el('div', { class: 'bongkar-hasil' });
  const msg = el('p', { class: 'reveal info' });
  function draw(hi = -1) {
    src.replaceChildren(...tokens.map((k, i) => el('span', { class: `${k.w ? 'tk-kata' : 'tk-ptr'} ${i === t ? 'aktif' : i < t ? 'lewat' : ''}` }, k.w || `[${k.b},${k.l}]`)));
    stage.replaceChildren(...out.map((w, i) => onTap(el('button', { class: `kata ${i === hi ? 'sumber' : ''}`, type: 'button', 'data-i': i }, el('small', null, i + 1), w), () => pick(i))));
  }
  function advance() {
    while (t < tokens.length && tokens[t].w) out.push(tokens[t++].w);
    draw();
    if (t >= tokens.length) {
      msg.className = 'reveal';
      msg.textContent = `Hasil: ${out.join(' ')} (${out.length} kata).`;
      done();
      return;
    }
    const p = tokens[t];
    msg.className = 'reveal info';
    msg.textContent = `Penunjuk [${p.b},${p.l}]: hitung ${p.b} kata mundur, lalu ketuk kata tempat mulai menyalin.`;
  }
  function pick(i) {
    if (busy || t >= tokens.length) return;
    const p = tokens[t];
    const want = out.length - p.b;
    if (i !== want) { msg.className = 'reveal bad'; msg.textContent = `Hitung mundur dari kata tepat sebelum penunjuk sebagai 1: kata ke-${out.length} = 1, kata ke-${out.length - 1} = 2, …`; shake(stage); ctx.mistake(); return; }
    busy = true;
    let k = 0;
    const step = () => {
      if (k >= p.l) { busy = false; t++; advance(); return; }
      const from = out.length - p.b;
      out.push(out[from]);
      k++;
      ctx.sound.tap();
      draw(from);
      setTimeout(step, 260);
    };
    step();
  }
  wrap.append(el('p', { class: 'prompt' }, prompt), src, stage, msg);
  advance();
}

// Lossless (T) or lossy (K) for six kinds of file.
export const KINDS = [['lagu di aplikasi musik', 'K'], ['nomor rekening dalam pesan', 'T'], ['video unggahan kegiatan sekolah', 'K'], ['berkas program aplikasi', 'T'], ['dokumen nilai rapor', 'T'], ['foto untuk status', 'K']];
function sortRound(wrap, ctx, { done }) {
  const pick = {};
  const rows = el('div', { class: 'tk-pilih' });
  const msg = el('p', { class: 'reveal info' }, 'T = tanpa kehilangan (lossless), K = dengan kehilangan (lossy).');
  let finished = false;
  function draw(wrong = []) {
    rows.replaceChildren(...KINDS.map(([name]) => el('div', { class: `tk-baris ${wrong.includes(name) ? 'salah' : ''}`, 'data-name': name }, el('span', null, name),
      ...['T', 'K'].map((v) => onTap(el('button', { class: `seg-btn ${pick[name] === v ? 'on' : ''}`, type: 'button', 'data-v': v }, v), () => { if (finished) return; pick[name] = v; ctx.sound.tap(); draw(); })))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pilih cara kompresi yang tepat untuk setiap berkas.'), rows, msg, button('Periksa', () => {
    if (finished) return;
    const wrong = KINDS.filter(([n, v]) => pick[n] !== v).map(([n]) => n);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} belum tepat. Teks dan angka harus persis; foto, bunyi, dan video boleh kehilangan detail kecil.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = 'Benar. Satu angka yang berubah bisa mengubah arti, jadi teks, angka, dan program dimampatkan tanpa kehilangan.';
    done();
  }, 'primary'));
}

// A made-up parang batik drawn on canvas, re-rendered at a lower quality.
function drawBatik(c) {
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  g.fillStyle = '#f5e6c8';
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let d = -H; d < W + H; d += 40) {
    g.strokeStyle = '#5b3a1a';
    g.lineWidth = 9;
    g.beginPath();
    for (let y = 0; y <= H; y += 4) { const x = d + y + Math.sin(y / 9) * 7; y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.strokeStyle = '#a0522d';
    g.lineWidth = 3;
    for (let y = 10; y < H; y += 22) { g.beginPath(); g.arc(d + y + 18, y, 5, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#2b1a0c';
    for (let y = 0; y < H; y += 11) g.fillRect(d + y + 8, y, 2, 2);
  }
}
const SIZES = [[5, 0.1], [30, 0.5], [100, 3]];
export function sizeMB(q) {
  for (let k = 0; k < 2; k++) {
    const [q0, s0] = SIZES[k];
    const [q1, s1] = SIZES[k + 1];
    if (q <= q1) return Math.exp(Math.log(s0) + ((Math.log(s1) - Math.log(s0)) * (q - q0)) / (q1 - q0));
  }
  return 3;
}
function photoView(q0) {
  const full = el('canvas', { width: 320, height: 200 });
  drawBatik(full);
  const view = el('canvas', { class: 'batik', width: 320, height: 200 });
  const label = el('p', { class: 'kode-warna' });
  function set(q) {
    const g = view.getContext('2d');
    const w = Math.max(4, Math.round((320 * q) / 100));
    const h = Math.max(3, Math.round((200 * q) / 100));
    const tmp = el('canvas', { width: w, height: h });
    tmp.getContext('2d').drawImage(full, 0, 0, w, h);
    g.imageSmoothingEnabled = q > 12;
    g.clearRect(0, 0, 320, 200);
    g.drawImage(tmp, 0, 0, 320, 200);
    label.textContent = `Kualitas ${q}% · sekitar ${sizeMB(q).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MB`;
  }
  set(q0);
  return { node: el('div', { class: 'foto-wadah' }, view, label), set };
}

function createCompressor(root, ctx) {
  const wrap = el('div', { class: 'act lagu-mampat' });
  root.append(wrap);
  const songs = [['Bait 1', BAIT1, []], ['Bait 2', BAIT2, BAIT1], ...PANTUN.map((p, k) => [`Pantun ${k + 1}`, p, []])];
  function go(k) {
    const [name, lines, prefix] = songs[k];
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, songs.map(([n], j) => button(n, () => go(j), j === k ? 'primary small' : 'small'))));
    compressRound(wrap, ctx, { lines, prefix, title: name, done() { ctx.sound.win(); } });
  }
  go(0);
}

function createUnpacker(root, ctx) {
  const wrap = el('div', { class: 'act lagu-mampat' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let order = rand.shuffle([...UNPACK]);
  let n = 0;
  function go() {
    if (!order.length) order = rand.shuffle([...UNPACK]);
    const text = order.pop();
    wrap.replaceChildren(el('p', { class: 'small-note' }, `Pesan ke-${++n}`));
    unpackRound(wrap, ctx, { text, prompt: `Bongkar: ${text}`, done() { ctx.sound.win(); wrap.append(button('Pesan berikutnya ➜', go, 'primary')); } });
  }
  go();
}

function createPhoto(root, ctx) {
  const wrap = el('div', { class: 'act lagu-mampat' });
  root.append(wrap);
  const photo = photoView(100);
  const range = el('input', { type: 'range', min: 5, max: 100, value: 100, class: 'geser foto-geser', 'aria-label': 'kualitas' });
  range.addEventListener('input', () => photo.set(Number(range.value)));
  wrap.append(el('p', { class: 'prompt' }, 'Kompresi dengan kehilangan: geser kualitas foto batik.'), photo.node, range,
    el('div', { class: 'kode-baris' }, ...[100, 30, 5].map((q) => button(`${q}%`, () => { range.value = q; photo.set(q); }, 'small'))),
    el('p', { class: 'small-note' }, 'Detail yang dibuang tidak bisa dikembalikan. Teks dan angka tidak boleh dimampatkan dengan cara ini.'));
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act lagu-mampat' });
  root.append(wrap);
  const lines = BAIT1;
  const score = [0, 0];
  let turn = 0;
  let saved = 0;
  const board = el('p', { class: 'reveal info' });
  const paint = () => { board.textContent = `Giliran Tim ${turn + 1} · Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`; };
  paint();
  wrap.append(board);
  const game = compressRound(wrap, ctx, {
    lines, title: 'Bergiliran: tambahkan satu penunjuk, lalu giliran tim lain.',
    team(total) {
      score[turn] += total - saved;
      saved = total;
      turn = 1 - turn;
      paint();
      if (!game.remaining()) { board.className = 'reveal'; board.textContent = `Selesai! Tim 1 ${score[0]} · Tim 2 ${score[1]} huruf dihemat. ${score[0] === score[1] ? 'Seri!' : `Tim ${score[0] > score[1] ? 1 : 2} menang!`}`; ctx.sound.win(); }
    },
  });
}
