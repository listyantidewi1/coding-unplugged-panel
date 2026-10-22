// Kuis Buatanku — SD Lanjut (10–12 tahun), masukan, keluaran, dan variabel.
// A quiz program asks (TANYA, input), checks the answer, adds to a score
// variable and shows a message by score range (TAMPILKAN, output). Typed
// quizzes stay in this page only: nothing is saved or sent.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const WANASARI = [
  { q: 'Sungai terbesar di Wanasari?', a: 'Kali Jernih' },
  { q: 'Berapa banyak kecamatan di Wanasari?', a: '12' },
  { q: 'Makanan khas Wanasari?', a: 'keripik talas' },
  { q: 'Tarian khas Wanasari?', a: 'Tari Panen' },
  { q: 'Gunung di utara Wanasari?', a: 'Gunung Arga' },
];
const MSGS = { top: 'Hebat! Kamu ahli Wanasari!', mid: 'Bagus! Sedikit lagi.', low: 'Ayo jelajahi Wanasari lagi!' };
export const PLAYERS = {
  Dika: ['Kali Jernih', '12', 'keripik singkong', 'Tari Panen', 'Gunung Arga'],
  Rina: ['Kali Jernih', '10', 'keripik pisang', 'Tari Panen', 'Gunung Agung'],
  Toni: ['Kali Jernih', '12', 'keripik talas', 'Tari Panen', 'Gunung Arga'],
  skor3: ['Kali Jernih', '12', 'keripik pisang', 'Tari Panen', 'Gunung Agung'],
};
const RINA2 = { 1: '12', 2: 'keripik talas', 4: 'Gunung Arga' };

export const makeQuiz = (o = {}) => ({ title: 'Kuis Kenali Wanasari!', qs: WANASARI, msgs: MSGS, op: '≥', mid: 3, addVar: 'skor', second: false, ignoreCase: false, ...o });

// The program as lines. Line numbers follow the worksheet: 1 ATUR, 2 TAMPILKAN,
// then two lines (or seven, with a second chance) for every question.
export function programLines(quiz) {
  const L = [];
  const add = (text, depth = 0, extra = {}) => L.push({ text, depth, no: L.length + 1, ...extra });
  add('ATUR skor MENJADI 0', 0, { kind: 'atur' });
  add(`TAMPILKAN "${quiz.title}"`, 0, { kind: 'out' });
  quiz.qs.forEach((x, i) => {
    add(`TANYA "${x.q}" SIMPAN KE jawaban`, 0, { kind: 'in', q: i });
    if (!quiz.second) add(`JIKA jawaban = "${x.a}" MAKA TAMBAH ${quiz.addVar} 1`, 0, { kind: 'cek', q: i });
    else {
      add(`JIKA jawaban = "${x.a}" MAKA`, 0, { kind: 'cek', q: i });
      add(`TAMBAH ${quiz.addVar} 1`, 1, { kind: 'tambah', q: i });
      add('JIKA TIDAK', 0, { q: i });
      add('TAMPILKAN "Coba lagi!"', 1, { kind: 'out', q: i });
      add(`TANYA "${x.q}" SIMPAN KE jawaban`, 1, { kind: 'in', q: i });
      add(`JIKA jawaban = "${x.a}" MAKA TAMBAH ${quiz.addVar} 1`, 1, { kind: 'cek', q: i });
    }
  });
  const n = quiz.qs.length;
  add(`JIKA skor = ${n} MAKA`, 0, { kind: 'akhir' });
  add(`TAMPILKAN "${quiz.msgs.top}"`, 1, { kind: 'out' });
  add('JIKA TIDAK', 0);
  add(`JIKA skor ${quiz.op} ${quiz.mid} MAKA`, 1, { kind: 'akhir' });
  add(`TAMPILKAN "${quiz.msgs.mid}"`, 2, { kind: 'out' });
  add('JIKA TIDAK', 1);
  add(`TAMPILKAN "${quiz.msgs.low}"`, 2, { kind: 'out' });
  add('TAMPILKAN "Skormu: ", skor', 0, { kind: 'out' });
  return L;
}

const same = (x, y, ic) => (ic ? x.trim().toLowerCase() === y.trim().toLowerCase() : x.trim() === y.trim());
const CMP = { '≥': (a, b) => a >= b, '>': (a, b) => a > b };

// Runs the quiz with prepared answers: `answers[i]` is the first answer and
// `again[i]` the second-chance answer. Every line run makes a step.
export function runQuiz(quiz, answers, again = {}) {
  const lines = programLines(quiz);
  const vars = { skor: 0 };
  const steps = [], outputs = [], marks = [];
  const find = (pred) => lines.findIndex(pred);
  const step = (i, extra = {}) => steps.push({ line: i, vars: { ...vars }, ...extra });
  const bump = () => { if (quiz.addVar === 'skor') vars.skor += 1; else if (typeof vars[quiz.addVar] === 'number') vars[quiz.addVar] += 1; };
  step(0);
  outputs.push(quiz.title); step(1, { out: quiz.title });
  quiz.qs.forEach((x, i) => {
    const qLines = lines.map((l, k) => [l, k]).filter(([l]) => l.q === i);
    const [ask1, check1] = [qLines[0][1], qLines[1][1]];
    vars.jawaban = answers[i] ?? ''; step(ask1, { ask: x.q, given: vars.jawaban });
    const ok1 = same(vars.jawaban, x.a, quiz.ignoreCase);
    step(check1, { check: ok1 });
    if (ok1) { bump(); if (quiz.second) step(qLines[2][1]); else step(check1); marks.push(true); return; }
    if (!quiz.second) { marks.push(false); return; }
    step(qLines[3][1]);
    outputs.push('Coba lagi!'); step(qLines[4][1], { out: 'Coba lagi!' });
    vars.jawaban = again[i] ?? answers[i] ?? ''; step(qLines[5][1], { ask: x.q, given: vars.jawaban });
    const ok2 = same(vars.jawaban, x.a, quiz.ignoreCase);
    step(qLines[6][1], { check: ok2 });
    if (ok2) bump();
    marks.push(ok2 ? 'lagi' : false);
  });
  const top = find((l) => l.kind === 'akhir');
  const n = quiz.qs.length;
  let msg;
  step(top, { check: vars.skor === n });
  if (vars.skor === n) { msg = quiz.msgs.top; step(top + 1, { out: msg }); }
  else {
    step(top + 2);
    const ok = CMP[quiz.op](vars.skor, quiz.mid);
    step(top + 3, { check: ok });
    if (ok) { msg = quiz.msgs.mid; step(top + 4, { out: msg }); }
    else { step(top + 5); msg = quiz.msgs.low; step(top + 6, { out: msg }); }
  }
  outputs.push(msg);
  const last = `Skormu: ${vars.skor}`;
  outputs.push(last); step(lines.length - 1, { out: last });
  return { lines, steps, outputs, marks, score: vars.skor, msg, vars };
}

// The program as rows. `collapse` keeps questions 1–2 and folds 3–5 into one
// comment line, as on the worksheet.
function progNode(quiz, { collapse } = {}) {
  const lines = programLines(quiz);
  const box = el('div', { class: 'kbk-kode' });
  const fold = el('div', { class: 'kbk-baris lipat' }, el('span', { class: 'kbk-no' }, ''), el('span', null, `(pertanyaan 3, 4, dan 5 ditulis dengan cara yang sama di baris ${lines.find((l) => l.q === 2)?.no}–${lines.filter((l) => l.q === 4).at(-1)?.no})`));
  let folded = false;
  lines.forEach((l, i) => {
    if (collapse && l.q >= 2) {
      fold.dataset.lines = `${fold.dataset.lines ?? ''} ${i} `;
      if (!folded) { box.append(fold); folded = true; }
      return;
    }
    box.append(el('div', { class: `kbk-baris${l.kind === 'in' ? ' masuk' : l.kind === 'out' ? ' keluar' : ''}`, style: { '--d': l.depth }, 'data-line': i },
      el('span', { class: 'kbk-no' }, l.no), el('span', null, l.text)));
  });
  return box;
}

function light(code, step) {
  code.querySelectorAll('.nyala, .ya, .tidak').forEach((n) => n.classList.remove('nyala', 'ya', 'tidak'));
  if (!step) return;
  const row = code.querySelector(`[data-line="${step.line}"]`) ?? [...code.querySelectorAll('[data-lines]')].find((n) => n.dataset.lines.includes(` ${step.line} `));
  row?.classList.add('nyala');
  if ('check' in step) row?.classList.add(step.check ? 'ya' : 'tidak');
  row?.scrollIntoView?.({ block: 'nearest' });
}

// Variables in the corner and the quiz screen with the outputs.
function sideView() {
  const skor = el('b', { class: 'kbk-nilai' }, '–');
  const jawaban = el('b', { class: 'kbk-nilai teks' }, '–');
  const screen = el('div', { class: 'kbk-layar' });
  const node = el('div', { class: 'kbk-samping' },
    el('div', { class: 'kbk-kotak-kotak' }, el('div', { class: 'kbk-kotak' }, el('span', null, 'skor'), skor), el('div', { class: 'kbk-kotak' }, el('span', null, 'jawaban'), jawaban)), screen);
  return {
    node,
    reset() { skor.textContent = '–'; jawaban.textContent = '–'; screen.replaceChildren(); },
    show(s) {
      const v = String(s.vars.skor);
      if (skor.textContent !== v) { skor.textContent = v; skor.parentNode.classList.remove('baru'); void skor.offsetWidth; skor.parentNode.classList.add('baru'); }
      jawaban.textContent = 'jawaban' in s.vars ? `"${s.vars.jawaban}"` : '–';
      if (s.ask) screen.append(el('p', { class: 'kbk-tanya' }, `❓ ${s.ask}`, el('br'), el('span', null, `⌨️ ${s.given}`)));
      if (s.out) screen.append(el('p', { class: 'kbk-keluar' }, `🖥️ ${s.out}`));
      screen.scrollTop = screen.scrollHeight;
    },
  };
}

function play(code, side, result, { speed = 200, done, upto } = {}) {
  let i = 0, t = null;
  const end = upto ?? result.steps.length;
  const tick = () => {
    if (i >= end) { if (!upto) light(code, null); done?.(); return; }
    const s = result.steps[i++];
    light(code, s); side.show(s);
    t = setTimeout(tick, speed);
  };
  t = setTimeout(tick, 150);
  return () => clearTimeout(t);
}

function marksRow(name, answers, result) {
  return el('div', { class: 'kbk-pemain' }, el('b', null, name), ...answers.map((a, i) => el('span', { class: `kbk-jawab${result ? (result.marks[i] ? ' benar' : ' salah') : ''}` }, a)));
}

const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });
const BASE = makeQuiz();
const RAKA = makeQuiz({ addVar: 'jawaban' });
const GT = makeQuiz({ op: '>' });
const SECOND = makeQuiz({ second: true });
const q = (x) => `"${x}"`;

// Worksheet questions in order. `who` is whose answers run after the right
// answer; `upto` stops the run early.
const PLAN = [
  { quiz: BASE, who: 'Toni', upto: 6, prompt: 'Soal 1a. Baris mana yang menerima masukan dari pemain?', opts: textOpts('baris 3 dan 5', ['baris 2 dan 20', 'baris 4 dan 6', 'baris 1 dan 13']) },
  { quiz: BASE, who: 'Toni', prompt: 'b. Baris mana yang menampilkan keluaran?', opts: textOpts('baris 2, 14, 17, 19, dan 20', ['baris 3 dan 5', 'baris 1, 13, dan 16', 'baris 14, 17, dan 19 saja']) },
  { quiz: BASE, who: 'Toni', upto: 6, prompt: 'c. Apa isi jawaban tepat setelah baris 5 dijalankan (Toni)?', opts: textOpts('"12"', ['"Kali Jernih"', '"Kali Jernih" dan "12"', '1']) },
  { quiz: BASE, who: 'Dika', prompt: 'Soal 2. Berapa skor Dika?', ...nums([2, 3, 4, 5], 4) },
  { quiz: BASE, who: 'Dika', prompt: 'Pesan apa yang didapat Dika?', opts: textOpts(q(MSGS.mid), [q(MSGS.top), q(MSGS.low)]) },
  { quiz: BASE, who: 'Rina', prompt: 'Berapa skor Rina?', ...nums([1, 2, 3, 4], 2) },
  { quiz: BASE, who: 'Rina', prompt: 'Pesan apa yang didapat Rina?', opts: textOpts(q(MSGS.low), [q(MSGS.mid), q(MSGS.top)]) },
  { quiz: BASE, who: 'Toni', prompt: 'Skor Toni dan pesannya?', opts: textOpts(`5, ${q(MSGS.top)}`, [`4, ${q(MSGS.mid)}`, `5, ${q(MSGS.mid)}`]) },
  { quiz: RAKA, who: 'Toni', prompt: 'Soal 3. Program Raka. Toni menjawab semuanya benar. Apa yang ditampilkan di akhir?', opts: textOpts(`${q(MSGS.low)} lalu "Skormu: 0"`, [`${q(MSGS.top)} lalu "Skormu: 5"`, 'Program berhenti karena error.']) },
  { quiz: RAKA, who: 'Toni', prompt: 'b. Apa kesalahan Raka?', opts: textOpts('Ia menambah variabel jawaban, bukan skor. Seharusnya TAMBAH skor 1.', ['Toni salah menulis jawabannya.', 'ATUR skor MENJADI 0 harus dihapus.']) },
  { quiz: GT, who: 'skor3', name: 'Pemain dengan skor 3', prompt: 'Soal 4. Baris 16 menjadi JIKA skor > 3. Pemain dengan skor 3 mendapat pesan apa?', opts: textOpts(q(MSGS.low), [q(MSGS.mid), q(MSGS.top)]) },
  { quiz: GT, who: 'skor3', name: 'Pemain dengan skor 3', prompt: 'b. Apakah itu sesuai aturan (skor 3–4 mendapat "Bagus! Sedikit lagi.")?', opts: textOpts('Tidak. Syaratnya harus skor ≥ 3 (atau skor > 2).', ['Ya, sudah sesuai.', 'Tidak. Syaratnya harus skor < 3.']), playQuiz: BASE },
  { quiz: SECOND, collapse: true, who: 'Rina', prompt: 'Soal 5. Kesempatan kedua: TANYA … SIMPAN KE apa?', opts: textOpts('jawaban', ['skor', 'pertanyaan']) },
  { quiz: SECOND, collapse: true, who: 'Rina', prompt: 'Lalu JIKA jawaban = "Kali Jernih" MAKA …?', opts: textOpts('TAMBAH skor 1', ['TAMBAH jawaban 1', 'ATUR skor MENJADI 1', 'TAMPILKAN skor']) },
  { quiz: SECOND, collapse: true, who: 'Rina', again: RINA2, prompt: 'Rina menjawab "12", "keripik talas", dan "Gunung Arga" pada kesempatan kedua. Skornya sekarang?', ...nums([2, 3, 4, 5], 5) },
  { quiz: SECOND, collapse: true, who: 'Rina', again: RINA2, prompt: 'Pesan apa yang didapat Rina sekarang?', opts: textOpts(q(MSGS.top), [q(MSGS.mid), q(MSGS.low)]) },
  { quiz: SECOND, collapse: true, who: 'Rina', again: RINA2, prompt: 'Apa yang perlu dipikirkan pembuat kuis?', opts: textOpts('Kesempatan kedua membuat "Hebat!" lebih mudah didapat. Apakah itu adil?', ['Kesempatan kedua membuat skor berkurang.', 'Tidak ada yang berubah.']) },
];

function round(wrap, ctx, p, next) {
  const quiz = p.quiz;
  const code = progNode(quiz, { collapse: p.collapse ?? true });
  const side = sideView();
  const answers = PLAYERS[p.who];
  const row = marksRow(p.name ?? p.who, answers, null);
  const subject = el('div', { class: 'kbk-soal' }, el('div', { class: 'kbk-kiri' }, row, code), side.node);
  const after = () => {
    const qz = p.playQuiz ?? quiz;
    const shown = p.playQuiz ? progNode(qz, { collapse: true }) : code;
    if (p.playQuiz) code.replaceWith(shown);
    const r = runQuiz(qz, answers, p.again);
    row.replaceWith(marksRow(p.name ?? p.who, answers, r));
    play(shown, side, r, { speed: p.upto ? 380 : r.steps.length > 30 ? 90 : 140, upto: p.upto, done: () => setTimeout(next, 1000) });
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.opts.some((o) => o.label.length > 28) ? 1 : 2; }
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-29-kuis-buatanku',
  title: 'Kuis Buatanku',
  topic: 'Masukan, keluaran, dan variabel',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '❓',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan program kuis dengan masukan pemain, menemukan bug variabel skor, memeriksa batas pesan, menambahkan kesempatan kedua, dan membuat kuis sendiri.',
  extraModes: [
    { id: 'susun', icon: '🛠️', label: 'Penyusun Kuis', desc: 'Ketik pertanyaan dan jawaban, lihat programnya, lalu mainkan kuisnya', create: createMaker },
    { id: 'antartim', icon: '🔁', label: 'Kuis Antar-Tim', desc: 'Tim membuat kuis untuk tim lain, lalu peran ditukar dan skor dibandingkan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kuis-buatanku' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// On-screen keyboard for the answer box.
function keyboard(input, onEnter) {
  let caps = false;
  const keys = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const type = (ch) => { input.value = (input.value + ch).slice(0, 40); input.dispatchEvent(new Event('input')); };
  const node = el('div', { class: 'kbk-papan-ketik' });
  const draw = () => node.replaceChildren(
    ...keys.map((r) => el('div', { class: 'kbk-baris-tombol' }, [...r].map((c) => onTap(el('button', { class: 'kbk-tombol', type: 'button' }, caps ? c.toUpperCase() : c), () => type(caps ? c.toUpperCase() : c))))),
    el('div', { class: 'kbk-baris-tombol' },
      onTap(el('button', { class: `kbk-tombol lebar${caps ? ' aktif' : ''}`, type: 'button' }, 'Aa'), () => { caps = !caps; draw(); }),
      onTap(el('button', { class: 'kbk-tombol spasi', type: 'button' }, 'spasi'), () => type(' ')),
      onTap(el('button', { class: 'kbk-tombol lebar', type: 'button' }, '⌫'), () => { input.value = input.value.slice(0, -1); }),
      onTap(el('button', { class: 'kbk-tombol kirim', type: 'button' }, 'Kirim ⏎'), onEnter)));
  draw();
  return node;
}

// Plays a quiz live: the player types answers; the program lights up.
function livePlay(host, ctx, quiz, { onDone, label = '' } = {}) {
  const code = progNode(quiz, { collapse: false });
  const side = sideView();
  const qText = el('p', { class: 'kbk-pertanyaan' });
  const input = el('input', { class: 'txt kbk-isian', type: 'text', maxlength: '40', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'jawaban' });
  const answers = [], again = {};
  let qi = 0, phase = 'first';
  const ask = () => {
    const x = quiz.qs[qi];
    qText.textContent = `${label}${phase === 'again' ? 'Coba lagi! ' : ''}Pertanyaan ${qi + 1} dari ${quiz.qs.length}: ${x.q}`;
    input.value = '';
    // Partial run so the program shows where the quiz is.
    const r = runQuiz(quiz, [...answers, ...quiz.qs.slice(answers.length).map(() => '\u0000')], again);
    const at = r.steps.findIndex((s, k) => s.ask && r.steps.slice(0, k + 1).filter((z) => z.ask).length === answers.length + Object.keys(again).length + 1);
    side.reset(); r.steps.slice(0, at).forEach((s) => side.show(s)); light(code, r.steps[at]);
  };
  const send = () => {
    const v = input.value.trim();
    if (!v) { shake(input); return; }
    ctx.sound.tap();
    const x = quiz.qs[qi];
    if (phase === 'first') {
      answers.push(v);
      if (quiz.second && !same(v, x.a, quiz.ignoreCase)) { phase = 'again'; ask(); return; }
    } else { again[qi] = v; phase = 'first'; }
    qi++;
    if (qi < quiz.qs.length) { ask(); return; }
    finish();
  };
  const finish = () => {
    const r = runQuiz(quiz, answers, again);
    qText.textContent = `${label}Kuis selesai.`;
    stage.querySelector('.kbk-main')?.replaceChildren(qText, el('div', { class: 'kbk-hasil' }, r.outputs.slice(1).map((o) => el('p', null, `🖥️ ${o}`))));
    side.reset(); r.steps.forEach((s) => side.show(s)); light(code, null);
    if (r.score === quiz.qs.length) ctx.sound.win(); else ctx.sound.good();
    onDone?.(r);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  const stage = el('div', { class: 'kbk-kerja' }, el('div', { class: 'kbk-main' }, qText, input, keyboard(input, send)), el('div', { class: 'kbk-kiri' }, code, side.node));
  host.replaceChildren(stage);
  ask();
  return stage;
}

// The maker form: up to 5 questions, three messages, and switches.
function makerForm(ctx, start, max = 5) {
  const st = structuredClone(start);
  const code = el('div', { class: 'kbk-pratinjau' });
  const redraw = () => code.replaceChildren(progNode(quiz(), { collapse: false }));
  const quiz = () => ({ ...st, qs: st.qs.filter((x) => x.q.trim() && x.a.trim()) });
  const field = (obj, key, ph, cls = '') => {
    const i = el('input', { class: `txt ${cls}`, type: 'text', maxlength: key === 'a' ? '30' : '60', value: obj[key], placeholder: ph, autocomplete: 'off', spellcheck: 'false' });
    i.addEventListener('input', () => { obj[key] = i.value; redraw(); });
    return i;
  };
  const rows = el('div', { class: 'kbk-form' });
  const drawRows = () => {
    while (st.qs.length < max) st.qs.push({ q: '', a: '' });
    st.qs.length = max;
    rows.replaceChildren(el('div', { class: 'kbk-form-kepala' }, el('span', null, 'Pertanyaan'), el('span', null, 'Jawaban benar')),
      ...st.qs.map((x, i) => el('div', { class: 'kbk-form-baris' }, el('b', null, i + 1), field(x, 'q', 'pertanyaan'), field(x, 'a', 'jawaban', 'pendek'))),
      el('div', { class: 'kbk-form-kepala' }, el('span', null, 'Pesan untuk skor penuh, sedang, dan rendah')),
      ...['top', 'mid', 'low'].map((k) => el('div', { class: 'kbk-form-baris' }, el('b', null, { top: '★', mid: '◐', low: '○' }[k]), field(st.msgs, k, 'pesan'))));
  };
  const toggle = (key, on, off) => {
    const b = button(st[key] ? on : off, () => { st[key] = !st[key]; b.textContent = st[key] ? on : off; ctx.sound.tap(); redraw(); }, 'small');
    return b;
  };
  st.msgs = { ...st.msgs };
  drawRows(); redraw();
  return {
    node: el('div', { class: 'kbk-kerja' }, el('div', { class: 'kbk-kiri' }, rows,
      el('div', { class: 'row' }, toggle('second', '🔁 Kesempatan kedua: ya', '🔁 Kesempatan kedua: tidak'), toggle('ignoreCase', 'Aa Abaikan huruf besar/kecil: ya', 'Aa Abaikan huruf besar/kecil: tidak'))), code),
    quiz,
    load(q2) { Object.assign(st, structuredClone(q2)); st.msgs = { ...q2.msgs }; drawRows(); redraw(); },
  };
}

const NOTE = 'Kuis ini hanya ada di layar ini. Tidak disimpan dan tidak dikirim ke mana pun. Jangan menulis nama asli atau data pribadi.';

function createMaker(root, ctx) {
  const wrap = el('div', { class: 'act kuis-buatanku' });
  root.append(wrap);
  const host = el('div', { class: 'kbk-tempat' });
  const form = makerForm(ctx, makeQuiz());
  const examples = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
    button('Kuis Wanasari', () => form.load(makeQuiz()), 'small'),
    button('Program Raka (bug)', () => form.load(RAKA), 'small'),
    button('Kosongkan', () => form.load(makeQuiz({ title: 'Kuis Buatanku!', qs: [], msgs: { top: 'Hebat!', mid: 'Bagus! Sedikit lagi.', low: 'Ayo coba lagi!' } })), 'small'));
  const playBtn = button('▶ Main kuis', () => {
    const q2 = form.quiz();
    if (!q2.qs.length) { shake(host); return; }
    q2.mid = Math.min(q2.mid, Math.max(1, q2.qs.length - 1));
    livePlay(host, ctx, q2, { onDone: () => host.append(el('div', { class: 'row' }, button('✏️ Ubah kuis', showForm, 'small'), button('🔁 Main lagi', () => playBtn.click(), 'primary'))) });
  }, 'primary');
  const showForm = () => host.replaceChildren(form.node, el('div', { class: 'row' }, playBtn));
  showForm();
  wrap.append(el('p', { class: 'prompt' }, 'Ketik pertanyaan dan jawabannya. Programnya tersusun sendiri di samping.'), examples, host, el('p', { class: 'kbk-catatan' }, NOTE));
  return { destroy() {} };
}

// Bergiliran: each team makes a 3-question quiz for the other team.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kuis-buatanku' });
  root.append(wrap);
  const scores = [];
  let turn = 0;
  function start() {
    const maker = turn % 2, player = 1 - maker;
    const host = el('div', { class: 'kbk-tempat' });
    const form = makerForm(ctx, makeQuiz({ title: `Kuis dari Tim ${maker + 1}!`, qs: [], msgs: { top: 'Hebat!', mid: 'Bagus! Sedikit lagi.', low: 'Ayo coba lagi!' }, mid: 2 }), 3);
    const ready = button('Kuis siap ✓', () => {
      const q2 = form.quiz();
      if (q2.qs.length < 3) { shake(host); head.textContent = `Tim ${maker + 1}: isi ketiga pertanyaan dan jawabannya dulu.`; return; }
      head.textContent = `Tim ${player + 1}: jawab kuis dari Tim ${maker + 1}.`;
      livePlay(host, ctx, q2, {
        onDone: (r) => {
          scores[player] = r.score;
          const text = scores.filter((x) => x !== undefined).length === 2
            ? `Skor · Tim 1: ${scores[0]} · Tim 2: ${scores[1]}. ${scores[0] === scores[1] ? 'Seri!' : `Tim ${scores[0] > scores[1] ? 1 : 2} menang.`}`
            : `Tim ${player + 1} mendapat skor ${r.score}. Sekarang tukar peran.`;
          host.append(el('p', { class: 'kbk-info' }, text), button('🔁 Tukar peran', () => { turn++; if (turn % 2 === 0) scores.length = 0; start(); }, 'primary'));
        },
      });
    }, 'primary');
    const head = el('p', { class: 'prompt' }, `Tim ${maker + 1}: buat 3 pertanyaan untuk Tim ${player + 1}. Tim ${player + 1} jangan melihat dulu.`);
    host.replaceChildren(form.node, ready);
    wrap.replaceChildren(head, host, el('p', { class: 'kbk-catatan' }, NOTE));
  }
  start();
  return { destroy() {} };
}
