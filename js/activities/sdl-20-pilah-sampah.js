// Robot Pemilah Sampah — SD Lanjut (10–12 tahun), percabangan di dalam perulangan.
// UNTUK SETIAP sampah: JIKA … MAKA … JIKA TIDAK …, where each JIKA TIDAK
// holds the next check. The order of the checks decides the baskets.

import { el, onTap, button, choice, shake } from '../core/kit.js';

export const ITEMS = [
  { no: 1, name: 'kulit pisang', icon: '🍌', jenis: 'organik' },
  { no: 2, name: 'botol plastik', icon: '🧴', jenis: 'plastik' },
  { no: 3, name: 'kaleng minuman', icon: '🥫', jenis: 'logam' },
  { no: 4, name: 'koran bekas', icon: '📰', jenis: 'kertas' },
  { no: 5, name: 'daun kering', icon: '🍂', jenis: 'organik' },
  { no: 6, name: 'gelas plastik', icon: '🥤', jenis: 'plastik' },
  { no: 7, name: 'kardus', icon: '📦', jenis: 'kertas' },
  { no: 8, name: 'kaleng susu', icon: '🥫', jenis: 'logam' },
  { no: 9, name: 'sisa nasi', icon: '🍚', jenis: 'organik' },
  { no: 10, name: 'kantong plastik', icon: '🛍️', jenis: 'plastik' },
  { no: 11, name: 'kulit jeruk', icon: '🍊', jenis: 'organik' },
  { no: 12, name: 'buku tulis bekas', icon: '📓', jenis: 'kertas' },
];
// Tricky items for the testing team. "lainnya" is neither organik, plastik,
// kertas nor logam, so only a program whose last basket is ABU-ABU sorts it.
const POOL = [
  { name: 'kotak minuman', icon: '🧃', jenis: 'lainnya', note: 'bahan berlapis, tidak bisa dijual sebagai kertas' },
  { name: 'baterai bekas', icon: '🔋', jenis: 'lainnya', note: 'nanti dipisahkan petugas ke wadah khusus' },
  { name: 'pecahan genteng', icon: '🧱', jenis: 'lainnya' },
  { name: 'tulang ikan', icon: '🐟', jenis: 'organik' },
  { name: 'tempurung kelapa', icon: '🥥', jenis: 'organik' },
  { name: 'sendok plastik', icon: '🥄', jenis: 'plastik' },
  { name: 'paku bekas', icon: '🔩', jenis: 'logam' },
  { name: 'kertas fotokopi', icon: '📄', jenis: 'kertas' },
];
export const CONDS = ['organik', 'anorganik', 'plastik', 'kertas', 'logam'];
export const BINS = ['HIJAU', 'KUNING', 'BIRU', 'ABU-ABU'];
const BIN_CLS = { HIJAU: 'hijau', KUNING: 'kuning', BIRU: 'biru', 'ABU-ABU': 'abu' };
// The four-basket rule used to judge programs.
const RIGHT = { organik: 'HIJAU', plastik: 'KUNING', kertas: 'BIRU', logam: 'ABU-ABU', lainnya: 'ABU-ABU' };
const RULE_TEXT = 'Aturan 4 keranjang: organik HIJAU, plastik KUNING, kertas BIRU, logam dan lainnya ABU-ABU.';

export const test = (item, cond) => (cond === 'anorganik' ? item.jenis !== 'organik' : item.jenis === cond);

// A program is a chain: { rules: [{ cond, bin }], last: bin }.
export const PROG_A = { rules: [{ cond: 'organik', bin: 'HIJAU' }, { cond: 'plastik', bin: 'KUNING' }], last: 'ABU-ABU' };
export const PROG_DIKA = { rules: [{ cond: 'anorganik', bin: 'ABU-ABU' }, { cond: 'plastik', bin: 'KUNING' }], last: 'HIJAU' };
export const PROG_FIX = { rules: [{ cond: 'plastik', bin: 'KUNING' }, { cond: 'anorganik', bin: 'ABU-ABU' }], last: 'HIJAU' };
export const PROG_KERTAS = { rules: [{ cond: 'organik', bin: 'HIJAU' }, { cond: 'plastik', bin: 'KUNING' }, { cond: 'kertas', bin: 'BIRU' }], last: 'ABU-ABU' };

// Runs the program for every item. Each row keeps the answer of every check
// (true, false, or null when not run) and the basket.
export function sortAll(prog, items = ITEMS) {
  const checks = prog.rules.map(() => 0);
  const ran = new Set(); // index of the MAKA blocks that ran; rules.length is the last JIKA TIDAK
  const bins = Object.fromEntries(BINS.map((b) => [b, []]));
  const rows = items.map((item) => {
    const answers = prog.rules.map(() => null);
    let bin = prog.last, at = prog.rules.length;
    for (let i = 0; i < prog.rules.length; i++) {
      checks[i]++;
      answers[i] = test(item, prog.rules[i].cond);
      if (answers[i]) { bin = prog.rules[i].bin; at = i; break; }
    }
    ran.add(at);
    bins[bin].push(item);
    return { item, answers, bin, at };
  });
  return { rows, checks, bins, ran, total: checks.reduce((a, b) => a + b, 0) };
}

// The program as nested JIKA … MAKA … JIKA TIDAK blocks.
function progNode(prog, { marks } = {}) {
  const box = el('div', { class: 'pls-kode' }, el('div', { class: 'pls-baris' }, 'UNTUK SETIAP sampah di ban berjalan:'));
  prog.rules.forEach((r, i) => {
    box.append(
      el('div', { class: 'pls-baris pls-jika', style: { '--d': i + 1 }, 'data-cek': i }, `JIKA sampah ${r.cond} MAKA`),
      el('div', { class: `pls-baris pls-aksi${marks && !marks.has(i) ? ' mati' : ''}`, style: { '--d': i + 2 }, 'data-aksi': i }, 'masukkan ke keranjang ', binChip(r.bin)),
      el('div', { class: 'pls-baris', style: { '--d': i + 1 } }, 'JIKA TIDAK'));
  });
  const n = prog.rules.length;
  box.append(el('div', { class: `pls-baris pls-aksi${marks && !marks.has(n) ? ' mati' : ''}`, style: { '--d': n + 1 }, 'data-aksi': n }, 'masukkan ke keranjang ', binChip(prog.last)));
  return box;
}
const binChip = (b) => el('b', { class: `pls-chip ${BIN_CLS[b]}` }, b);
const itemCard = (it) => el('div', { class: 'pls-sampah' }, el('span', null, it.icon), el('small', null, `${it.no ? `${it.no}. ` : ''}${it.name}`));
const tally = (r) => BINS.filter((b) => r.bins[b].length || b !== 'BIRU').map((b) => `${b} ${r.bins[b].length}`).join(', ');

const yn = (v) => (v === null ? '–' : v ? 'ya' : 'tidak');
const traceLabel = (row) => `${row.answers.map(yn).join(', ')} → ${row.bin}`;
const A = sortAll(PROG_A), DIKA = sortAll(PROG_DIKA);
const tallyOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));

// Worksheet questions in order.
const PLAN = [
  ...[3, 6, 9].map((no) => {
    const row = A.rows[no - 1];
    const fake = ['tidak, tidak → ABU-ABU', 'tidak, ya → KUNING', 'ya, – → HIJAU', 'tidak, – → ABU-ABU'].filter((t) => t !== traceLabel(row)).slice(0, 3);
    return { prog: PROG_A, item: row.item, prompt: `Soal 1. Tabel jejak sampah nomor ${no}: Organik? Plastik? Keranjang?`, opts: tallyOpts(traceLabel(row), fake) };
  }),
  { prog: PROG_A, prompt: 'Isi keranjang setelah 12 sampah lewat?', opts: tallyOpts(tally(A), ['HIJAU 4, KUNING 4, ABU-ABU 4', 'HIJAU 4, KUNING 3, ABU-ABU 2', 'HIJAU 5, KUNING 3, ABU-ABU 4']) },
  { prog: PROG_A, prompt: 'Berapa kali pemeriksaan "Organik?" dijalankan?', nums: [4, 8, 12, 20], ans: A.checks[0] },
  { prog: PROG_A, prompt: 'Berapa kali pemeriksaan "Plastik?" dijalankan?', nums: [3, 8, 12, 20], ans: A.checks[1] },
  { prog: PROG_A, prompt: 'Mengapa jumlah pemeriksaan "Plastik?" lebih sedikit?',
    opts: tallyOpts('"Plastik?" ada di JIKA TIDAK, jadi hanya diperiksa untuk sampah yang bukan organik', ['robot lupa memeriksa sebagian sampah', 'sampah plastik hanya 3 buah']) },
  { prog: PROG_DIKA, item: ITEMS[1], prompt: 'Soal 2. Program Dika: botol plastik masuk keranjang apa?', opts: tallyOpts(DIKA.rows[1].bin, ['KUNING', 'HIJAU']) },
  { prog: PROG_DIKA, prompt: 'Isi keranjang program Dika untuk 12 sampah?', opts: tallyOpts(tally(DIKA), ['HIJAU 4, KUNING 3, ABU-ABU 5', 'HIJAU 0, KUNING 3, ABU-ABU 9', 'HIJAU 4, KUNING 8, ABU-ABU 0']) },
  { prog: PROG_DIKA, prompt: 'Mengapa keranjang KUNING tidak pernah terisi?',
    opts: tallyOpts('plastik juga anorganik, jadi sudah masuk ABU-ABU pada pemeriksaan pertama', ['tidak ada sampah plastik di ban berjalan', 'keranjang KUNING terlalu jauh']) },
  { prompt: 'Soal 3. Program mana yang tetap memakai "anorganik" dan hasilnya sama dengan Program A?',
    progs: [PROG_FIX, PROG_DIKA,
      { rules: [{ cond: 'anorganik', bin: 'KUNING' }, { cond: 'plastik', bin: 'ABU-ABU' }], last: 'HIJAU' },
      { rules: [{ cond: 'plastik', bin: 'KUNING' }, { cond: 'anorganik', bin: 'HIJAU' }], last: 'ABU-ABU' }] },
  { prog: PROG_KERTAS, prompt: 'Soal 4. Dengan keranjang BIRU untuk kertas, isi keranjangnya?',
    opts: tallyOpts(tally(sortAll(PROG_KERTAS)), ['HIJAU 4, KUNING 3, BIRU 3, ABU-ABU 5', 'HIJAU 4, KUNING 3, BIRU 5, ABU-ABU 0', 'HIJAU 4, KUNING 0, BIRU 3, ABU-ABU 5']) },
  { prog: PROG_KERTAS, prompt: 'Sampah nomor berapa saja yang masuk keranjang BIRU?',
    opts: tallyOpts(sortAll(PROG_KERTAS).bins.BIRU.map((i) => i.no).join(', '), ['3, 8', '2, 6, 10', '4, 7']) },
  { prog: PROG_A, prompt: 'Tantangan. Setengah sampah bulan depan adalah plastik. Periksa apa lebih dulu supaya pemeriksaannya lebih sedikit?',
    opts: tallyOpts('plastik', ['organik', 'anorganik', 'logam']) },
];

function round(wrap, ctx, p, next) {
  const subject = p.progs ? null : el('div', { class: 'pls-soal' }, progNode(p.prog), p.item ? itemCard(p.item) : null);
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else if (p.progs) { options = ctx.rand.shuffle(p.progs.map((pr, i) => ({ icon: progNode(pr), correct: i === 0 }))); columns = 2; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.opts.some((o) => o.label.length > 30) ? 1 : 2; }
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: () => setTimeout(next, 600), columns, options });
}

export default {
  id: 'sdl-20-pilah-sampah',
  title: 'Robot Pemilah Sampah',
  topic: 'Percabangan dan perulangan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '♻️',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan program JIKA … MAKA … JIKA TIDAK di dalam perulangan dengan tabel jejak, menemukan urutan syarat yang salah, memperbaikinya, dan menambah cabang baru.',
  extraModes: [
    { id: 'pemilah', icon: '🤖', label: 'Pemilah Robot', desc: 'Susun aturan pemilah, jalankan ban berjalan, dan lihat tabel jejaknya', create: createSorter },
    { id: 'uji', icon: '🧪', label: 'Uji Pengecoh', desc: 'Satu tim menyusun program, tim lain mengujinya dengan sampah pengecoh', create: createTest },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pilah-sampah' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// Rule editor. Tapping a condition or a basket changes it to the next one.
function ruleEditor(ctx, start = PROG_A) {
  const prog = structuredClone(start);
  let locked = false;
  const node = el('div', { class: 'pls-editor' });
  const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
  const draw = () => {
    const rows = [el('div', { class: 'pls-baris' }, 'UNTUK SETIAP sampah di ban berjalan:')];
    prog.rules.forEach((r, i) => {
      const cond = onTap(el('button', { class: 'pls-pilih', type: 'button', 'data-cond': i }, r.cond, ' ▾'), () => { if (!locked) { r.cond = cycle(CONDS, r.cond); ctx.sound.tap(); draw(); } });
      const bin = onTap(el('button', { class: `pls-chip ${BIN_CLS[r.bin]}`, type: 'button', 'data-bin': i }, r.bin, ' ▾'), () => { if (!locked) { r.bin = cycle(BINS, r.bin); ctx.sound.tap(); draw(); } });
      const tools = el('span', { class: 'pls-alat' },
        i > 0 ? onTap(el('button', { class: 'pls-kecil', type: 'button', 'aria-label': 'naikkan' }, '↑'), () => { if (!locked) { [prog.rules[i - 1], prog.rules[i]] = [prog.rules[i], prog.rules[i - 1]]; draw(); } }) : null,
        prog.rules.length > 1 ? onTap(el('button', { class: 'pls-kecil hapus', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { if (!locked) { prog.rules.splice(i, 1); draw(); } }) : null);
      rows.push(
        el('div', { class: 'pls-baris pls-jika', style: { '--d': i + 1 }, 'data-cek': i }, 'JIKA sampah ', cond, ' MAKA', tools),
        el('div', { class: 'pls-baris pls-aksi', style: { '--d': i + 2 }, 'data-aksi': i }, 'masukkan ke keranjang ', bin),
        el('div', { class: 'pls-baris', style: { '--d': i + 1 } }, 'JIKA TIDAK'));
    });
    const n = prog.rules.length;
    const last = onTap(el('button', { class: `pls-chip ${BIN_CLS[prog.last]}`, type: 'button', 'data-bin': 'last' }, prog.last, ' ▾'), () => { if (!locked) { prog.last = cycle(BINS, prog.last); ctx.sound.tap(); draw(); } });
    rows.push(el('div', { class: 'pls-baris pls-aksi', style: { '--d': n + 1 }, 'data-aksi': n }, 'masukkan ke keranjang ', last));
    node.replaceChildren(el('div', { class: 'pls-kode' }, ...rows.filter(Boolean)));
  };
  draw();
  return {
    node, prog,
    set(p) { Object.assign(prog, structuredClone(p)); draw(); },
    add() {
      if (locked || prog.rules.length >= 4) { shake(node); return; }
      prog.rules.push({ cond: 'kertas', bin: 'BIRU' }); draw();
    },
    lock(v) { locked = v; node.classList.toggle('kunci', v); },
    light(sel, cls) {
      node.querySelectorAll('.ya, .tidak, .jalan').forEach((n) => n.classList.remove('ya', 'tidak', 'jalan'));
      if (sel) node.querySelector(sel)?.classList.add(cls);
    },
    mark(ran) {
      node.querySelectorAll('[data-aksi]').forEach((n) => n.classList.toggle('mati', !ran.has(Number(n.dataset.aksi))));
    },
    unmark() { node.querySelectorAll('.mati').forEach((n) => n.classList.remove('mati')); },
  };
}

// Baskets with the items inside.
function basketsView() {
  const node = el('div', { class: 'pls-keranjang' });
  const boxes = Object.fromEntries(BINS.map((b) => [b, el('div', { class: `pls-kotak ${BIN_CLS[b]}` })]));
  const counts = Object.fromEntries(BINS.map((b) => [b, el('b', null, '0')]));
  BINS.forEach((b) => node.append(el('div', { class: `pls-bin ${BIN_CLS[b]}` }, el('div', { class: 'pls-bin-kepala' }, b, ' ', counts[b]), boxes[b])));
  return {
    node,
    clear() { BINS.forEach((b) => { boxes[b].replaceChildren(); counts[b].textContent = '0'; }); },
    drop(b, it, wrong) {
      boxes[b].append(el('span', { class: `pls-isi${wrong ? ' salah' : ''}`, title: it.name }, it.icon));
      counts[b].textContent = boxes[b].children.length;
    },
  };
}

// Plays the run: each item on the belt, each check lit green (ya) or red
// (tidak), then the basket. `onRow(row)` fills the trace table.
function playRun(board, belt, baskets, result, { onRow, done, speed = 450, judge } = {}) {
  let t = null, cancelled = false;
  const wait = (ms) => new Promise((res) => { t = setTimeout(res, ms); });
  (async () => {
    baskets.clear(); board.unmark();
    for (const row of result.rows) {
      belt.replaceChildren(itemCard(row.item));
      for (let i = 0; i < row.answers.length && row.answers[i] !== null; i++) {
        board.light(`[data-cek="${i}"]`, row.answers[i] ? 'ya' : 'tidak');
        await wait(speed); if (cancelled) return;
      }
      board.light(`[data-aksi="${row.at}"]`, 'jalan');
      await wait(speed * 0.7); if (cancelled) return;
      baskets.drop(row.bin, row.item, judge && judge(row));
      onRow?.(row);
    }
    board.light(null); belt.replaceChildren();
    board.mark(result.ran);
    done?.();
  })();
  return () => { cancelled = true; clearTimeout(t); };
}

function traceTable(prog) {
  const body = el('tbody');
  const table = el('table', { class: 'pls-jejak' },
    el('thead', null, el('tr', null, el('th', null, 'No.'), ...prog.rules.map((r) => el('th', null, `${r.cond}?`)), el('th', null, 'Keranjang'))), body);
  return {
    node: el('div', { class: 'pls-jejak-tempat' }, table),
    add(row) {
      body.append(el('tr', null, el('td', null, `${row.item.icon} ${row.item.no ?? ''}`), ...row.answers.map((a) => el('td', { class: a === null ? '' : a ? 'ya' : 'tidak' }, yn(a))), el('td', null, binChip(row.bin))));
    },
  };
}

function createSorter(root, ctx) {
  const wrap = el('div', { class: 'act pilah-sampah' });
  root.append(wrap);
  const board = ruleEditor(ctx);
  const belt = el('div', { class: 'pls-ban' });
  const baskets = basketsView();
  const tableHolder = el('div', { class: 'pls-kanan' });
  const info = el('p', { class: 'pls-info' });
  let stop = null;
  const go = button('▶ Jalankan', () => {
    stop?.();
    const r = sortAll(board.prog);
    const trace = traceTable(board.prog);
    tableHolder.replaceChildren(trace.node);
    board.lock(true); info.textContent = '';
    stop = play(r, trace);
  }, 'primary');
  const play = (r, trace) => playRun(board, belt, baskets, r, {
    speed: 380,
    onRow: (row) => trace.add(row),
    done: () => {
      board.lock(false);
      const right = r.rows.filter((row) => row.bin === RIGHT[row.item.jenis]).length;
      const idle = [...Array(board.prog.rules.length + 1).keys()].filter((i) => !r.ran.has(i)).length;
      info.textContent = `Isi keranjang: ${tally(r)}. Pemeriksaan: ${r.checks.map((c, i) => `${board.prog.rules[i].cond}? ${c} kali`).join(', ')}, seluruhnya ${r.total}.`
        + `${idle ? ` ⚠️ ${idle} blok tidak pernah dijalankan (bergaris).` : ''} Menurut aturan 4 keranjang, ${right} dari 12 sampah benar.`;
      if (right === 12) ctx.sound.win(); else ctx.sound.good();
    },
  });
  wrap.append(
    el('p', { class: 'prompt' }, 'Ketuk syarat dan keranjang untuk mengubahnya, lalu jalankan ban berjalan.'),
    el('div', { class: 'row' }, el('span', { class: 'label' }, 'Contoh'),
      button('Program A', () => board.set(PROG_A), 'small'), button('Program Dika', () => board.set(PROG_DIKA), 'small'),
      button('+ JIKA', () => board.add(), 'small')),
    el('div', { class: 'pls-atas' }, el('div', { class: 'pls-kiri' }, board.node, el('div', { class: 'row' }, go, belt), baskets.node), tableHolder), info);
  info.textContent = RULE_TEXT;
  return { destroy() { stop?.(); } };
}

// Bergiliran: one team builds a sorter for the four-basket rule; the other
// team picks 4 tricky items. Each wrong basket is a point for the testers.
function createTest(root, ctx) {
  const wrap = el('div', { class: 'act pilah-sampah' });
  root.append(wrap);
  let turn = 0, stop = null;
  const score = [0, 0];
  function start() {
    stop?.();
    const a = turn % 2, b = 1 - a;
    const board = ruleEditor(ctx, PROG_A);
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: susun program untuk aturan 4 keranjang. Tim ${b + 1} akan mengujinya.`);
    const info = el('p', { class: 'pls-info' });
    const ready = button('Program siap ✓', () => {
      board.lock(true); ready.remove(); addBtn.remove();
      head.textContent = `Tim ${b + 1}: pilih 4 sampah pengecoh untuk menguji program Tim ${a + 1}.`;
      const picked = [];
      const pool = el('div', { class: 'pls-pool' }, POOL.map((it) => {
        const card = onTap(el('button', { class: 'pls-sampah pilih', type: 'button' }, el('span', null, it.icon), el('small', null, it.name)), () => {
          const k = picked.indexOf(it);
          if (k >= 0) picked.splice(k, 1); else if (picked.length < 4) picked.push(it); else { shake(card); return; }
          card.classList.toggle('on', picked.includes(it)); ctx.sound.tap();
          testBtn.disabled = picked.length !== 4;
        });
        return card;
      }));
      const testBtn = button('▶ Uji program', () => {
        testBtn.remove(); pool.classList.add('kunci');
        const items = picked.map((it, i) => ({ ...it, no: i + 1 }));
        const r = sortAll(board.prog, items);
        const belt = el('div', { class: 'pls-ban' });
        const baskets = basketsView();
        const isWrong = (row) => row.bin !== RIGHT[row.item.jenis];
        side.append(el('div', { class: 'row' }, belt), baskets.node, info);
        stop = playRun(board, belt, baskets, r, {
          speed: 420, judge: isWrong,
          done: () => {
            const wrong = r.rows.filter(isWrong);
            score[b] += wrong.length; score[a] += r.rows.length - wrong.length;
            info.textContent = `${wrong.length ? `✗ ${wrong.length} sampah salah keranjang: ${wrong.map((w) => `${w.item.name} (${w.item.jenis}, seharusnya ${RIGHT[w.item.jenis]})`).join('; ')}.` : '✅ Semua sampah pengecoh masuk keranjang yang benar.'}`
              + ` Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
            if (wrong.length) ctx.sound.bad(); else ctx.sound.win();
            side.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
          },
        });
      }, 'primary');
      testBtn.disabled = true;
      const side = el('div', { class: 'pls-kiri' }, pool, testBtn);
      wrap.replaceChildren(head, el('div', { class: 'pls-atas' }, board.node, side));
    }, 'primary');
    const addBtn = button('+ JIKA', () => board.add(), 'small');
    wrap.replaceChildren(head, el('p', { class: 'pls-aturan' }, RULE_TEXT),
      board.node, el('div', { class: 'row' }, addBtn, ready), info);
  }
  start();
  return { destroy() { stop?.(); } };
}
