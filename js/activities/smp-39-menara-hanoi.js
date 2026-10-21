// Menara Hanoi dan Rekursi — SMP (13–15 tahun), coding. Playing the towers,
// finding the recursive pattern L(n) = 2 × L(n − 1) + 1, tracing the
// procedure PINDAH(n, asal, tujuan, bantu) with its call tree, Sari's version
// without a base case, Bayu's swapped parameters, and how fast 2ⁿ − 1 grows.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper, codeView } from './smp-kit.js';
import { runAll } from './pseudo.js';

const T = ['A', 'B', 'C'];
// The worksheet's procedure and the two buggy versions.
export const H = (v = 'benar') => v === 'sari'
  ? ['PROSEDUR PINDAH(n, asal, tujuan, bantu)', '    PINDAH(n − 1, asal, bantu, tujuan)', '    TAMPILKAN "Cakram", n, ":", asal, "→", tujuan', '    PINDAH(n − 1, bantu, tujuan, asal)']
  : ['PROSEDUR PINDAH(n, asal, tujuan, bantu)', '    JIKA n = 1 MAKA', '        TAMPILKAN "Cakram 1:", asal, "→", tujuan', '    SELAIN ITU', '        PINDAH(n − 1, asal, bantu, tujuan)', '        TAMPILKAN "Cakram", n, ":", asal, "→", tujuan',
    v === 'bayu' ? '        PINDAH(n − 1, bantu, asal, tujuan)' : '        PINDAH(n − 1, bantu, tujuan, asal)'];
export const prog = (n, v = 'benar') => [...H(v), `PINDAH(${n}, "A", "C", "B")`];
// TAMPILKAN joins with spaces; the worksheet writes "Cakram 2: A → C".
export const tidy = (t) => t.replace(/ :/g, ':');
export const parseMove = (t) => { const m = /Cakram (\d+)\s*:\s*(\w) → (\w)/.exec(t); return m ? [Number(m[1]), m[2], m[3]] : null; };
export const run = (n, v = 'benar') => runAll(prog(n, v), { limit: 20000 });
export const L = (n) => 2 ** n - 1;
// Optimal moves for both rules (the challenge only allows neighbouring pegs).
export function solve(n, a = 'A', c = 'C', b = 'B', out = []) { if (n === 0) return out; solve(n - 1, a, b, c, out); out.push([n, a, c]); solve(n - 1, b, c, a, out); return out; }
export function geser(n, a = 'A', c = 'C', m = 'B', out = []) { if (n === 0) return out; geser(n - 1, a, c, m, out); out.push([n, a, m]); geser(n - 1, c, a, m, out); out.push([n, m, c]); geser(n - 1, a, c, m, out); return out; }
export const mv = ([d, a, b]) => `${d}: ${a} → ${b}`;
export const seq = (ms) => ms.map(mv).join(', ');
// The call tree as data: { label, out, kids }.
export function treeOf(n, a = 'A', c = 'C', b = 'B') { return n === 1 ? { label: `PINDAH(1, ${a}, ${c}, ${b})`, out: `Cakram 1: ${a} → ${c}`, kids: [] } : { label: `PINDAH(${n}, ${a}, ${c}, ${b})`, out: `Cakram ${n}: ${a} → ${c}`, kids: [treeOf(n - 1, a, b, c), treeOf(n - 1, b, c, a)] }; }

// Three pegs drawn from a state { A: [4, 3, 2, 1], B: [], C: [] } (last = top).
function pegs(st, n, { sel = null, cls = '' } = {}) {
  return el('div', { class: `hn-tiang-tiang ${cls}` }, T.map((t) => el('div', { class: `hn-tiang ${sel === t ? 'pilih' : ''}`, 'data-t': t },
    el('div', { class: 'hn-tumpuk' }, el('i', { class: 'hn-batang' }), st[t].map((d) => el('span', { class: `hn-cakram c${((d - 1) % 6) + 1}`, style: { width: `${26 + (70 * d) / Math.max(n, 1)}%` } }, String(d)))),
    el('b', { class: 'hn-alas' }, t))));
}
const fresh = (n) => ({ A: Array.from({ length: n }, (_, k) => n - k), B: [], C: [] });

// Playable towers: drag a disk to another peg, or tap the source and then the target.
export function game(n, { ctx, rule = 'bebas', onDone = null, onMove = null, canMove = null, note = '' } = {}) {
  let st = fresh(n); let sel = null; let moves = []; let finished = false; let from = null;
  const min = rule === 'sebelah' ? 3 ** n - 1 : L(n);
  const host = el('div', { class: 'hn-main' });
  host.setAttribute('data-solusi', (rule === 'sebelah' ? geser(n) : solve(n)).map(([, a, b]) => a + b).join(' '));
  const msg = el('p', { class: 'reveal info' }, note);
  const why = (a, b) => {
    if (!st[a].length) return `Tiang ${a} kosong.`;
    if (rule === 'sebelah' && Math.abs(T.indexOf(a) - T.indexOf(b)) !== 1) return `Aturan baru: cakram hanya boleh ke tiang sebelahnya, tidak boleh langsung ${a} → ${b}.`;
    if (st[b].length && st[b].at(-1) < st[a].at(-1)) return `Cakram ${st[a].at(-1)} lebih besar dari cakram ${st[b].at(-1)}: cakram besar tidak boleh di atas cakram kecil.`;
    return '';
  };
  function move(a, b) {
    sel = null;
    if (finished || a === b) { draw(); return; }
    if (canMove && !canMove()) { draw(); return; }
    const w = why(a, b);
    if (w) { ctx?.sound.bad(); say(msg, 'bad', w); draw(); return; }
    const d = st[a].pop(); st[b].push(d); moves.push([d, a, b]); ctx?.sound.tap(); say(msg, '', `${mv([d, a, b])}`); onMove?.([d, a, b], st, moves);
    if (st.C.length === n) { finished = true; host.classList.add('beres'); draw(); onDone?.(moves.length, moves, min); return; }
    draw();
  }
  function draw() {
    host.replaceChildren(el('div', { class: 'hn-info' }, el('span', null, `Langkah: `, el('b', null, String(moves.length))), el('span', null, `paling sedikit: `, el('b', null, String(min))), button('↺ Ulang', () => host.reset())),
      pegs(st, n, { sel }), ...(moves.length ? [el('p', { class: 'hn-catat' }, seq(moves.slice(-8)) + (moves.length > 8 ? ' …' : ''))] : []), msg);
  }
  host.addEventListener('pointerdown', (e) => {
    const t = e.target.closest?.('[data-t]')?.getAttribute('data-t'); if (!t) return;
    if (sel && sel !== t) { from = null; move(sel, t); return; }
    if (st[t].length) { sel = t; from = t; draw(); }
  });
  host.addEventListener('pointerup', (e) => {
    if (!from) return; const f = from; from = null;
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-t]')?.getAttribute('data-t');
    if (t && t !== f) move(f, t);
  });
  host.reset = () => { st = fresh(n); sel = null; moves = []; finished = false; host.classList.remove('beres'); msg.textContent = note; msg.className = 'reveal info'; draw(); };
  host.state = () => st;
  draw();
  return host;
}

// Call tree from a live run: one box per call, the active one lit.
function treeView(root, { activeNode = null, maxDepth = 9 } = {}) {
  const node = (x, d) => el('div', { class: 'hn-simpul' }, el('div', { class: `hn-kotak ${x === activeNode ? 'aktif' : ''} ${x.out ? '' : 'kosong'}` }, el('b', null, x.label), el('small', null, x.out ? `tampil: ${x.out}` : (x.hide ? 'tampil: ?' : '…'))),
    x.kids.length ? (d >= maxDepth ? el('p', { class: 'hn-dalam' }, `⋮ masih ${x.kids.length === 1 ? 'terus' : ''} makin dalam`) : el('div', { class: `hn-anak ${x.kids.length === 1 ? 'satu' : ''}` }, x.kids.map((k) => node(k, d + 1)))) : null);
  return el('div', { class: 'hn-pohon' }, root ? node(root, 0) : el('small', null, 'Pohon pemanggilan muncul saat PINDAH dipanggil.'));
}

// Tracer with towers and the growing call tree.
export function treeTracer(n, v = 'benar', o = {}) {
  let path = []; let root = null; let st = fresh(n); let outs = 0; let depth = 0;
  return tracer(prog(n, v), { speed: 380, fmtOut: tidy, hideVars: [], cls: 'hn-jejak', ...o,
    onStep: (y, s) => {
      if (!y) { path = []; root = null; st = fresh(n); outs = 0; depth = 0; return; }
      const fr = s.frames;
      let k = 0; while (k < path.length && k < fr.length && path[k].frame === fr[k]) k++;
      path.length = k;
      for (let i = k; i < fr.length; i++) { const x = { frame: fr[i], label: `PINDAH(${fr[i].args.join(', ')})`, out: '', kids: [] }; if (i === 0) root = x; else path[i - 1].kids.push(x); path.push(x); }
      depth = Math.max(depth, fr.length);
      while (outs < s.out.length) { const t = tidy(s.out[outs++]); if (path.length) path[path.length - 1].out = t; const m = parseMove(t); if (m && st[m[1]].length) st[m[2]].push(st[m[1]].pop()); }
      o.onStep?.(y, s);
    },
    extra: (s) => el('div', { class: 'hn-ekstra' }, pegs(st, n, { cls: 'kecil' }),
      el('p', { class: 'hn-ket' }, `Pemanggilan: ${s.calls.length} · kedalaman sekarang: ${s.frames.length}`),
      s.error?.kind === 'batas' ? el('p', { class: 'sk-galat batas' }, `Pemanggilan terlalu dalam: tidak ada kasus dasar, jadi PINDAH(${n}) memanggil PINDAH(${n - 1}), PINDAH(${n - 2}), … tanpa berhenti.`) : null,
      treeView(root, { activeNode: s.done ? null : path[path.length - 1] })) });
}

export default {
  id: 'smp-39-menara-hanoi',
  title: 'Menara Hanoi dan Rekursi',
  topic: 'Rekursi: prosedur yang memanggil dirinya sendiri, kasus dasar, parameter yang bertukar peran, pohon pemanggilan, dan pertumbuhan 2ⁿ − 1',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🗼',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Mainkan Menara Hanoi, temukan pola rekursifnya, telusuri prosedur PINDAH dan pohon pemanggilannya, temukan bug Sari dan Bayu, lalu hitung banyak langkah untuk 5, 10, dan 64 cakram.',
  extraModes: [
    { id: 'menara', icon: '🗼', label: 'Menara Hanoi', desc: 'Seret cakram antartiang untuk 1 sampai 7 cakram. Layar menolak langkah yang melanggar aturan; coba juga aturan tiang sebelah', create: createGame },
    { id: 'pohon', icon: '🌳', label: 'Pohon Pemanggilan', desc: '"Selesaikan dengan rekursi" menjalankan PINDAH langkah demi langkah: kotak pemanggilan tumbuh dan cakram bergerak. Coba program Sari dan Bayu', create: createTree },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Menara Bersama', desc: 'Tim bergiliran memindahkan satu cakram; poin bila menara selesai dengan langkah paling sedikit', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act menara-hanoi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const play = (n, prompt, after) => {
        let warned = false; let at4 = null;
        const g = game(n, { ctx, onMove: (m, st) => { if (m[0] === n && !at4) { at4 = { A: [...st.A], B: [...st.B], C: [...st.C] }; at4[m[2]].pop(); at4[m[1]].push(m[0]); } }, onDone: (k, ms, min) => {
          if (k > min) { if (!warned) { warned = true; ctx.mistake(); } say(wrap.querySelector('.hn-main .reveal'), 'bad', `Menara pindah dalam ${k} langkah. Bisakah dengan ${min} langkah? Tekan Ulang.`); return; }
          ctx.sound.good(); say(wrap.querySelector('.hn-main .reveal'), '', `Hebat: ${k} langkah, paling sedikit.`); setTimeout(then(() => after(ms, at4)), 1700);
        } });
        wrap.append(el('p', { class: 'prompt' }, prompt), g);
      };
      const B2 = solve(2); const B3 = solve(3);
      if (r === 0) play(2, 'Pindahkan menara 2 cakram dari A ke C', () => ask('Langkah untuk 2 cakram', [[seq(B2), true], [seq(solve(2, 'A', 'B', 'C'))], ['1: A → C, 2: A → B, 1: C → B'], ['2: A → C, 1: A → B, 1: B → C']], 1, pegs(fresh(2), 2)));
      else if (r === 1) play(3, 'Pindahkan menara 3 cakram dari A ke C dengan langkah sesedikit mungkin', () => ask('Tulis ketujuh langkahnya', [[seq(B3), true], [seq(solve(3, 'A', 'B', 'C'))], ['1: A → B, 2: A → C, 1: B → C, 3: A → B, 1: C → A, 2: C → B, 1: A → B'], ['1: A → C, 2: A → B, 1: C → B, 3: A → C, 1: B → C, 2: B → C, 1: A → C']]));
      else if (r === 2) play(4, 'Pindahkan menara 4 cakram dari A ke C', (ms, at4) => { if (at4) wrap.append(el('p', { class: 'hn-ket' }, 'Tepat sebelum cakram 4 dipindah:'), pegs(at4, 4, { cls: 'kecil' })); rowsChoose(wrap, ctx, { prompt: 'Menara 4 cakram', rows: [['l', 'Banyak langkah paling sedikit', ['15', '16', '12', '8'], '15'], ['p', 'Tepat sebelum cakram 4 dipindah, cakram 1, 2, 3 ada di', ['tiang B, tertumpuk rapi; C kosong', 'tiang C', 'tersebar di B dan C', 'tiang A'], 'tiang B, tertumpuk rapi; C kosong']], done: next }); });
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Cara memindahkan n cakram dari asal ke tujuan', rows: [['a', '(1) pindahkan … cakram teratas dari asal ke …', ['n − 1 · bantu', 'n − 1 · tujuan', '1 · bantu', 'n · bantu'], 'n − 1 · bantu'], ['b', '(2) pindahkan cakram … dari asal ke tujuan', ['n', '1', 'n − 1'], 'n', 'Cakram terbesar.'], ['c', '(3) pindahkan n − 1 cakram itu dari … ke tujuan', ['bantu', 'asal', 'tujuan'], 'bantu'], ['d', 'L(n) = 2 × L(n − 1) + …', ['1', '2', '0', 'n'], '1', 'Dua kali menara n − 1, ditambah satu langkah untuk cakram n.'], ['e', 'L(2) · L(3) · L(4)', ['3 · 7 · 15', '4 · 8 · 16', '3 · 6 · 12', '3 · 9 · 27'], '3 · 7 · 15', '2 × 1 + 1 = 3, 2 × 3 + 1 = 7, 2 × 7 + 1 = 15.']], done: next });
      else if (r === 4) { const tr = treeTracer(2, 'benar', { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Telusuri PINDAH(2, A, C, B)', rows: [['5', 'Baris 5 memanggil', ['PINDAH(1, A, B, C)', 'PINDAH(1, A, C, B)', 'PINDAH(1, B, C, A)'], 'PINDAH(1, A, B, C)'], ['5t', '… yang menampilkan', ['Cakram 1: A → B', 'Cakram 1: A → C', 'Cakram 1: B → C'], 'Cakram 1: A → B'], ['6', 'Baris 6 menampilkan', ['Cakram 2: A → C', 'Cakram 2: A → B', 'Cakram 2: B → C'], 'Cakram 2: A → C'], ['7', 'Baris 7 memanggil', ['PINDAH(1, B, C, A)', 'PINDAH(1, B, A, C)', 'PINDAH(1, A, B, C)'], 'PINDAH(1, B, C, A)', 'Peran tiang bertukar: B menjadi asal, A menjadi bantu.'], ['7t', '… yang menampilkan', ['Cakram 1: B → C', 'Cakram 1: B → A', 'Cakram 1: A → C'], 'Cakram 1: B → C']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan PINDAH(2, A, C, B) langkah demi langkah'), tr); }
      else if (r === 5) {
        const t = treeOf(3); const [L2, R2] = t.kids; const hide = (x) => ({ ...x, kids: x.kids, hide: true, out: '' });
        const shown = { ...t, kids: [{ ...hide(L2), label: L2.label, kids: [L2.kids[0], { ...hide(L2.kids[1]), label: 'PINDAH(1, ?, ?, ?)' }] }, { ...hide(R2), label: 'PINDAH(2, ?, ?, ?)', kids: R2.kids.map((k) => ({ ...hide(k), label: 'PINDAH(1, ?, ?, ?)' })) }] };
        wrap.append(treeView(shown));
        rowsChoose(wrap, ctx, { prompt: 'Lengkapi pohon pemanggilan PINDAH(3, A, C, B)', cls: 'hn-isi', rows: [['l', 'PINDAH(2, A, B, C) tampil', ['Cakram 2: A → B', 'Cakram 2: A → C', 'Cakram 2: B → C'], 'Cakram 2: A → B'], ['r', 'Anak kanan', ['PINDAH(2, B, C, A)', 'PINDAH(2, B, A, C)', 'PINDAH(2, A, C, B)'], 'PINDAH(2, B, C, A)'], ['rt', '… tampil', ['Cakram 2: B → C', 'Cakram 2: B → A', 'Cakram 2: A → C'], 'Cakram 2: B → C'], ['d2', 'Daun ke-2', ['PINDAH(1, C, B, A) · 1: C → B', 'PINDAH(1, B, C, A) · 1: B → C', 'PINDAH(1, C, A, B) · 1: C → A'], 'PINDAH(1, C, B, A) · 1: C → B'], ['d3', 'Daun ke-3', ['PINDAH(1, B, A, C) · 1: B → A', 'PINDAH(1, B, C, A) · 1: B → C', 'PINDAH(1, A, B, C) · 1: A → B'], 'PINDAH(1, B, A, C) · 1: B → A'], ['d4', 'Daun ke-4', ['PINDAH(1, A, C, B) · 1: A → C', 'PINDAH(1, A, B, C) · 1: A → B', 'PINDAH(1, C, A, B) · 1: C → A'], 'PINDAH(1, A, C, B) · 1: A → C']], done: next });
      }
      else if (r === 6) { const tr = treeTracer(3, 'benar', { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Keluaran PINDAH(3, A, C, B)', rows: [['u', 'Urutan tampil', [seq(B3), 'Cakram 3: A → C, 2: A → B, 2: B → C, 1: A → C, 1: C → B, 1: B → A, 1: A → C', seq(solve(3, 'A', 'B', 'C'))], seq(B3), 'Isi pohon dibaca kiri ke kanan: anak kiri, kotak itu, anak kanan.'], ['s', 'Sama dengan jawaban soal 1b?', ['ya', 'tidak'], 'ya'], ['3', 'Banyak pemanggilan untuk n = 3', ['7', '3', '8', '15'], '7'], ['4', 'Banyak pemanggilan untuk n = 4', ['15', '16', '8', '31'], '15', 'Setiap pemanggilan menampilkan tepat satu langkah.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Selesaikan menara 3 cakram dengan rekursi'), tr); }
      else if (r === 7) { const tr = treeTracer(2, 'sari', { onEnd: () => setTimeout(then(() => ask('Sari menghapus baris 2–4. Apa yang terjadi saat PINDAH(2, A, C, B) dijalankan?', [['Pemanggilan tidak pernah berhenti: PINDAH(1) memanggil PINDAH(0), lalu PINDAH(−1), dan seterusnya tanpa menampilkan satu langkah pun, sampai tempat pencatat pemanggilan habis', true], ['Program menampilkan 3 langkah lalu berhenti'], ['Program berhenti di PINDAH(1) karena 1 adalah cakram terkecil'], ['Program menampilkan langkah yang sama berulang-ulang']], 1, codeView(H('sari')))), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Sari: tanpa JIKA'), tr); }
      else if (r === 8) { const tr = treeTracer(2, 'bayu', { onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Program Bayu: baris 7 PINDAH(n − 1, bantu, asal, tujuan)', rows: [['k', 'Keluaran', ['1: A → B, 2: A → C, 1: B → A', '1: A → B, 2: A → C, 1: B → C', '1: A → C, 2: A → B, 1: C → A'], '1: A → B, 2: A → C, 1: B → A'], ['a', 'Di akhir', ['cakram 2 di C, cakram 1 kembali ke A', 'keduanya di C', 'cakram 1 di B, cakram 2 di C'], 'cakram 2 di C, cakram 1 kembali ke A'], ['p', 'Apakah menaranya pindah?', ['ya', 'tidak'], 'tidak', 'Di baris 7 tujuan dan asal tertukar, jadi cakram 1 dikirim ke tiang yang salah.']], done: next })), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Program Bayu: telusuri PINDAH(2, A, C, B)'), tr); }
      else rowsChoose(wrap, ctx, { prompt: 'Berapa lama? L(n) = 2ⁿ − 1', rows: [['5', 'L(5)', ['31', '32', '25', '16'], '31'], ['10', 'L(10)', ['1.023', '1.024', '512', '100'], '1.023'], ['r', '2ⁿ − 1 untuk n = 1 sampai 5', ['benar: 1, 3, 7, 15, 31', 'salah'], 'benar: 1, 3, 7, 15, 31'], ['t', '10 cakram, 1 langkah per detik', ['kira-kira 17 menit', 'kira-kira 10 menit', 'kira-kira 1 jam', 'kira-kira 17 detik'], 'kira-kira 17 menit', '1.023 detik ≈ 17 menit.'], ['64', '64 cakram (2⁶⁴ − 1 = 18.446.744.073.709.551.615 detik)', ['kira-kira 585 miliar tahun', 'kira-kira 585 tahun', 'kira-kira 64 tahun', 'kira-kira 13,8 miliar tahun'], 'kira-kira 585 miliar tahun', 'Jauh lebih lama dari umur alam semesta, sekitar 13,8 miliar tahun.'], ['x', 'Cakram bertambah 1, langkahnya menjadi', ['kira-kira 2 kali lipat', 'bertambah 1', 'kira-kira 10 kali lipat'], 'kira-kira 2 kali lipat'], ['g', 'Tantangan tiang sebelah: 1 · 2 · 3 cakram', ['2 · 8 · 26', '1 · 3 · 7', '2 · 6 · 18', '2 · 4 · 8'], '2 · 8 · 26', 'Polanya 3ⁿ − 1, atau L(n) = 3 × L(n − 1) + 2.']], done: next });
    }
    render();
  },
};

function createGame(root, ctx) {
  const wrap = el('div', { class: 'act menara-hanoi' });
  root.append(wrap);
  let n = 3; let rule = 'bebas'; let g = null; let timer = null;
  const draw = () => {
    if (timer) { clearInterval(timer); timer = null; }
    g = game(n, { ctx, rule, note: rule === 'sebelah' ? 'Aturan baru: hanya ke tiang sebelah (A ↔ B, B ↔ C).' : 'Seret cakram teratas ke tiang lain, atau ketuk tiang asal lalu tiang tujuan.', onDone: (k, ms, min) => { ctx.sound.good(); say(g.querySelector('.reveal'), k === min ? '' : 'bad', k === min ? `Selesai dalam ${k} langkah: paling sedikit!` : `Selesai dalam ${k} langkah. Paling sedikit ${min}.`); } });
    const show = () => { g.reset(); const ms = rule === 'sebelah' ? geser(n) : solve(n); let k = 0; timer = setInterval(() => { if (k >= ms.length) { clearInterval(timer); timer = null; return; } const [, a, b] = ms[k++]; tapPeg(a); tapPeg(b); }, n > 5 ? 150 : 600); };
    const tapPeg = (t) => g.querySelector(`[data-t="${t}"]`)?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Menara Hanoi'),
      el('div', { class: 'hn-atur' }, stepper(n, (v) => { n = v; draw(); }, { min: 1, max: 7, label: 'cakram' }),
        el('div', { class: 'seg' }, [['bebas', 'aturan biasa'], ['sebelah', 'tantangan: tiang sebelah']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${rule === k ? 'on' : ''}`, type: 'button' }, t), () => { rule = k; draw(); }))),
        button('▶ Tunjukkan langkah terbaik', show)), g);
  };
  draw();
}

function createTree(root, ctx) {
  const wrap = el('div', { class: 'act menara-hanoi' });
  root.append(wrap);
  let n = 3; let v = 'benar'; let tr = null;
  const draw = () => {
    tr?.stop(); tr = treeTracer(n, v);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pohon pemanggilan'),
      el('div', { class: 'hn-atur' }, stepper(n, (x) => { n = x; draw(); }, { min: 1, max: 4, label: 'cakram' }),
        el('div', { class: 'seg' }, [['benar', 'prosedur benar'], ['sari', 'Sari: tanpa kasus dasar'], ['bayu', 'Bayu: baris 7 tertukar']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${v === k ? 'on' : ''}`, type: 'button' }, t), () => { v = k; draw(); }))),
        button('▶ Selesaikan dengan rekursi', () => tr.play(), 'primary')), tr);
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act menara-hanoi' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const sizes = [3, 4]; let round = 0;
    function turn() {
      if (round >= sizes.length) { finishBoard(wrap, ctx, { title: 'Menara bersama selesai', pts, again: () => pickTeams(wrap, 'Menara Bersama', start) }); return; }
      const n = sizes[round]; let team = 0;
      const head = el('p', { class: 'prompt' });
      const setHead = () => { head.textContent = `Menara ${n} cakram · giliran Tim ${team + 1}`; wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, team)); };
      const g = game(n, { ctx, note: 'Setiap tim memindahkan satu cakram, lalu giliran tim berikutnya.', onMove: () => { team = (team + 1) % nT; setHead(); },
        onDone: (k, ms, min) => {
          const p = k === min ? 3 : 1; for (let t = 0; t < nT; t++) pts[t] += p; ctx.sound.good();
          say(g.querySelector('.reveal'), k === min ? '' : 'bad', k === min ? `Selesai dalam ${k} langkah, paling sedikit! Setiap tim +3.` : `Selesai dalam ${k} langkah (paling sedikit ${min}). Setiap tim +1.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, -1)); round++; setTimeout(turn, 4200);
        } });
      wrap.replaceChildren(scoreBar(pts, team), head, g); setHead();
    }
    turn();
  }
  pickTeams(wrap, 'Menara Bersama', start);
}
