// Plat Nomor yang Sah — SMA/SMK (16–18 tahun), automata hingga dan ekspresi reguler.
// Trace class codes and number plates through finite automata, complete the
// plate transition table, test twelve plates, link the automaton to a regular
// expression, and hunt for texts that fool a buggy automaton.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const SP = '␣';
export const show = (t) => t.replace(/ /g, SP);
const cls = {
  rombel: (c) => (c === 'X' || c === 'I' ? c : /[1-9]/.test(c) ? '1–9' : c === ' ' ? SP : 'lain'),
  plat: (c) => (/[A-Z]/.test(c) ? 'huruf' : /[1-9]/.test(c) ? '1–9' : c === '0' ? '0' : c === ' ' ? SP : 'lain'),
  surel: (c) => (/[a-z]/.test(c) ? 'huruf' : c === '.' ? 'titik' : c === '@' ? '@' : 'lain'),
};
const PLAT_T = {
  q0: { huruf: 'q1' }, q1: { huruf: 'q2', [SP]: 'q3' }, q2: { [SP]: 'q3' }, q3: { '1–9': 'q4' },
  q4: { '1–9': 'q5', 0: 'q5', [SP]: 'q8' }, q5: { '1–9': 'q6', 0: 'q6', [SP]: 'q8' }, q6: { '1–9': 'q7', 0: 'q7', [SP]: 'q8' }, q7: { [SP]: 'q8' },
  q8: { huruf: 'q9' }, q9: { huruf: 'q10' }, q10: { huruf: 'q11' }, q11: {},
};
const chain = '@contoh.sch.id';
const SUREL_T = { p0: { huruf: 'p1' }, p1: { huruf: 'p1', titik: 'p2', '@': 'c1' }, p2: { huruf: 'p1' } };
for (let i = 1; i < chain.length; i++) SUREL_T[`c${i}`] = { [`=${chain[i]}`]: `c${i + 1}` };
SUREL_T.c14 = {};
export const DFA = {
  rombel: { label: 'Kode rombel', start: 'k0', accept: ['k5'], cls: 'rombel', labels: ['X', 'I', SP, '1–9'], regex: `^(X|XI|XII)${SP}[1-9]$`, re: /^(X|XI|XII) [1-9]$/,
    T: { k0: { X: 'k1' }, k1: { I: 'k2', [SP]: 'k4' }, k2: { I: 'k3', [SP]: 'k4' }, k3: { [SP]: 'k4' }, k4: { '1–9': 'k5' }, k5: {} },
    pos: { k0: [70, 130], k1: [200, 130], k2: [330, 60], k3: [470, 60], k4: [470, 200], k5: [620, 200] }, samples: ['XI 3', 'XII 7', 'IX 2', 'XIII 2', 'X 0', 'XI'] },
  plat: { label: 'Plat nomor', start: 'q0', accept: ['q4', 'q5', 'q6', 'q7', 'q9', 'q10', 'q11'], cls: 'plat', labels: ['huruf', '1–9', '0', SP], regex: `^[A-Z]{1,2}${SP}[1-9][0-9]{0,3}(${SP}[A-Z]{1,3})?$`, re: /^[A-Z]{1,2} [1-9][0-9]{0,3}( [A-Z]{1,3})?$/, T: PLAT_T,
    pos: { q0: [50, 60], q1: [150, 60], q2: [250, 60], q3: [200, 165], q4: [300, 165], q5: [405, 165], q6: [510, 165], q7: [615, 165], q8: [440, 275], q9: [545, 275], q10: [650, 275], q11: [750, 275] } },
  surel: { label: 'Alamat surel', start: 'p0', accept: ['c14'], cls: 'surel', labels: ['huruf', 'titik', '@'], regex: '^[a-z]+(\\.[a-z]+)*@contoh\\.sch\\.id$', re: /^[a-z]+(\.[a-z]+)*@contoh\.sch\.id$/, T: SUREL_T,
    pos: { p0: [50, 120], p1: [160, 120], p2: [160, 250], ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`c${i + 1}`, [260 + (i % 7) * 75, i < 7 ? 120 : 250]])) }, samples: ['rina.ayu@contoh.sch.id', 'bayu@contoh.sch.id', '.rina@contoh.sch.id', 'rina..ayu@contoh.sch.id', 'rina.@contoh.sch.id', 'bayu@contoh.sch'] },
};
DFA.plat.samples = ['WS 1234 AB', 'Q 7 XYZ', 'WS 507', 'WSN 12 A', 'WS 0123 AB', 'X 12345 B', 'WS 88 ABCD', 'WS 1000', 'J 9 A1', 'WS 31 ', 'WS1234 AB', 'XY 2026 Q'];

export function step(d, s, c) {
  if (!s) return null;
  const row = d.T[s] || {};
  return row[`=${c}`] ?? row[cls[d.cls](c)] ?? null;
}
// Read text: path of states, where it died, and the verdict.
export function run(d, text) {
  const path = [d.start]; let s = d.start;
  for (let i = 0; i < text.length; i++) { const n = step(d, s, text[i]); if (!n) return { path, dead: { state: s, char: text[i], i }, ok: false }; s = n; path.push(s); }
  return { path, dead: null, ok: d.accept.includes(s) };
}
export const verdict = (d, text) => { const r = run(d, text); return r.ok ? `diterima (berakhir di ${r.path[r.path.length - 1]})` : r.dead ? `ditolak: mati di ${r.dead.state} saat membaca ${show(r.dead.char)}` : `ditolak: berhenti di ${r.path[r.path.length - 1]}, bukan keadaan terima`; };
// Shortest text on which two plate automata disagree (BFS over state pairs).
export function distinguish(d1, d2, alphabet = ['A', '1', '0', ' ', 'a']) {
  const seen = new Set(); const q = [[d1.start, d2.start, '']];
  while (q.length) {
    const [a, b, t] = q.shift();
    const k = `${a}|${b}`; if (seen.has(k)) continue; seen.add(k);
    if (!!(a && d1.accept.includes(a)) !== !!(b && d2.accept.includes(b))) return t;
    if (!a && !b) continue;
    for (const c of alphabet) q.push([step(d1, a, c), step(d2, b, c), t + c]);
  }
  return null;
}
export const BUGS = [
  { name: 'q3 juga menerima angka 0', edit: (T) => { T.q3[0] = 'q4'; } },
  { name: 'q8 dijadikan keadaan terima', acc: ['q8'] },
  { name: 'q7 masih menerima angka', edit: (T) => { T.q7['1–9'] = 'q7'; T.q7[0] = 'q7'; } },
  { name: 'q11 masih menerima huruf', edit: (T) => { T.q11.huruf = 'q11'; } },
  { name: 'q2 masih menerima huruf', edit: (T) => { T.q2.huruf = 'q2'; } },
  { name: 'q4 bukan keadaan terima', drop: ['q4'] },
];
export function buggy(b) {
  const T = Object.fromEntries(Object.entries(PLAT_T).map(([k, v]) => [k, { ...v }]));
  if (b.edit) b.edit(T);
  return { ...DFA.plat, T, accept: [...DFA.plat.accept.filter((s) => !(b.drop || []).includes(s)), ...(b.acc || [])] };
}

export function diagram(d, { cur = null, deadAt = null, path = [] } = {}) {
  const P = d.pos; const groups = {};
  for (const [s, row] of Object.entries(d.T)) for (const [lab, t] of Object.entries(row)) (groups[`${s}>${t}`] ||= []).push(lab.startsWith('=') ? lab.slice(1) : lab);
  const label = (ls) => (ls.includes('1–9') && ls.includes('0') ? [...ls.filter((x) => x !== '1–9' && x !== '0'), '0–9'] : ls).join(', ');
  const edges = Object.entries(groups).map(([k, ls]) => {
    const [a, b] = k.split('>'); const [x1, y1] = P[a]; const [x2, y2] = P[b];
    if (a === b) return `<path d="M${x1 - 12} ${y1 - 22} C${x1 - 40} ${y1 - 80} ${x1 + 40} ${y1 - 80} ${x1 + 12} ${y1 - 22}" fill="none" stroke="#475569" stroke-width="3" marker-end="url(#ap)"/><text x="${x1}" y="${y1 - 70}" font-size="16" font-weight="800" text-anchor="middle" fill="#1e3a8a">${label(ls)}</text>`;
    const back = groups[`${b}>${a}`]; const dx = x2 - x1; const dy = y2 - y1; const L = Math.hypot(dx, dy); const ux = dx / L; const uy = dy / L;
    const off = back ? 16 : 0; const nx = -uy * off; const ny = ux * off;
    const sx = x1 + ux * 25 + nx; const sy = y1 + uy * 25 + ny; const ex = x2 - ux * 29 + nx; const ey = y2 - uy * 29 + ny;
    return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#475569" stroke-width="3" marker-end="url(#ap)"/><text x="${(sx + ex) / 2 + nx * 0.8 - uy * 12}" y="${(sy + ey) / 2 + ny * 0.8 + ux * 12 + 5}" font-size="${label(ls) === SP ? 28 : 16}" font-weight="800" text-anchor="middle" fill="#1e3a8a" paint-order="stroke" stroke="#fff" stroke-width="5">${label(ls)}</text>`;
  });
  const nodes = Object.entries(P).map(([s, [x, y]]) => {
    const acc = d.accept.includes(s); const on = s === cur; const dead = s === deadAt; const was = path.includes(s);
    return `<g data-s="${s}" class="pn-keadaan"><circle cx="${x}" cy="${y}" r="24" fill="${dead ? '#fecaca' : on ? '#facc15' : was ? '#fef9c3' : '#fff'}" stroke="${dead ? '#b91c1c' : '#1e293b'}" stroke-width="3"/>${acc ? `<circle cx="${x}" cy="${y}" r="19" fill="none" stroke="#1e293b" stroke-width="2"/>` : ''}<text x="${x}" y="${y + 6}" font-size="${s.length > 2 ? 14 : 16}" font-weight="900" text-anchor="middle">${s}</text></g>`;
  });
  const [sx, sy] = P[d.start];
  return `<svg viewBox="0 0 800 320" role="img" aria-label="Diagram automata"><defs><marker id="ap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#475569"/></marker></defs><line x1="${sx - 50}" y1="${sy}" x2="${sx - 28}" y2="${sy}" stroke="#475569" stroke-width="3" marker-end="url(#ap)"/>${edges.join('')}${nodes.join('')}</svg>`;
}

// Animated run of a text on a diagram.
export function animate(box, d, text, onEnd, speed = 600) {
  const r = run(d, text); let i = 0;
  const tick = () => {
    if (!box.isConnected) return;
    if (i < r.path.length) { box.innerHTML = diagram(d, { cur: r.path[i], path: r.path.slice(0, i) }); i++; setTimeout(tick, speed); return; }
    box.innerHTML = diagram(d, { cur: r.dead ? null : r.path[r.path.length - 1], deadAt: r.dead?.state, path: r.path });
    if (onEnd) onEnd(r);
  };
  tick();
  return r;
}
const textChips = (t, k = -1) => el('div', { class: 'pn-teks' }, [...t].map((c, i) => el('span', { class: i < k ? 'sudah' : i === k ? 'kini' : '' }, c === ' ' ? SP : c)));

// On-screen keyboard for typing texts on the panel.
function keyboard(onKey, { lower = false } = {}) {
  let low = lower;
  const box = el('div', { class: 'pn-kunci' });
  const draw = () => box.replaceChildren(...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c) => (low ? c.toLowerCase() : c)).concat([...'0123456789'], [SP, '.', '@']).map((c) => onTap(el('button', { class: 'pn-tombol', type: 'button' }, c), () => onKey(c === SP ? ' ' : c))),
    onTap(el('button', { class: 'pn-tombol lebar', type: 'button' }, low ? 'ABC' : 'abc'), () => { low = !low; draw(); }),
    onTap(el('button', { class: 'pn-tombol lebar', type: 'button' }, '⌫'), () => onKey('⌫')),
    onTap(el('button', { class: 'pn-tombol lebar', type: 'button' }, 'Hapus'), () => onKey('clear')));
  draw();
  return box;
}

// Trace round: tap the next state for each character, or "mati".
function traceRound(wrap, ctx, { d, texts, done }) {
  let ti = 0;
  const box = el('div', { class: 'pn-diagram' });
  const chips = el('div');
  const msg = el('p', { class: 'reveal info' });
  let k = 0; let s = d.start; let path = [s];
  const draw = () => { box.innerHTML = diagram(d, { cur: s, path }); chips.replaceChildren(textChips(texts[ti], k)); };
  const finish = (text) => { const r = run(d, text); say(msg, '', `${show(text)}: ${verdict(d, text)}.`); ti++; if (ti >= texts.length) done(); else setTimeout(() => { k = 0; s = d.start; path = [s]; draw(); msg.textContent = 'Ketuk keadaan berikutnya untuk setiap karakter.'; msg.className = 'reveal info'; }, 2200); return r; };
  const tapState = (t) => {
    const text = texts[ti]; if (k >= text.length) return;
    const want = step(d, s, text[k]);
    if (t !== want) { ctx.mistake(); shake(box); say(msg, 'bad', want ? `Dari ${s}, karakter ${show(text[k])} mengikuti panah ke ${want}.` : `Dari ${s} tidak ada panah untuk ${show(text[k])}: tekan "Mati".`); return; }
    s = t; path.push(t); k++; ctx.sound.tap(); draw();
    if (k === text.length) finish(text);
  };
  box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-s]'); if (!g) return; e.preventDefault(); tapState(g.dataset.s); });
  wrap.append(el('p', { class: 'prompt' }, `Telusuri teks pada automata ${d.label.toLowerCase()}.`), chips, box,
    el('div', { class: 'kode-baris' }, button('💀 Mati', () => { const text = texts[ti]; if (k >= text.length) return; if (step(d, s, text[k])) { ctx.mistake(); shake(box); say(msg, 'bad', `Masih ada panah untuk ${show(text[k])} dari ${s}.`); return; } ctx.sound.tap(); k = text.length; chips.replaceChildren(textChips(text, k)); box.innerHTML = diagram(d, { deadAt: s, path }); finish(text); })), msg);
  msg.textContent = 'Ketuk keadaan berikutnya untuk setiap karakter.';
  draw();
}

// Transition-table editor for the plate automaton.
function tableEditor(host, ctx, { T, accept, editable = (s) => true, onEdit }) {
  const d = DFA.plat; let sel = null;
  const box = el('div', { class: 'pn-tabel-wadah' });
  const picker = el('div', { class: 'seg pn-pilih' });
  const draw = () => {
    box.replaceChildren(el('table', { class: 'pn-tabel' }, el('tr', null, el('th', null, 'Keadaan'), ...d.labels.map((l) => el('th', null, l))),
      ...Object.keys(PLAT_T).map((s) => el('tr', null, onTap(el('th', { class: `pn-kepala ${accept.has(s) ? 'terima' : ''}` }, accept.has(s) ? `◎ ${s}` : s), () => { if (!editable(s)) return; if (accept.has(s)) accept.delete(s); else accept.add(s); ctx.sound.tap(); draw(); if (onEdit) onEdit(); }),
        ...d.labels.map((l) => onTap(el('td', { class: `${editable(s) ? 'ubah' : ''} ${sel && sel[0] === s && sel[1] === l ? 'pilih' : ''}` }, T[s][l] || '–'), () => { if (!editable(s)) return; sel = [s, l]; draw(); }))))));
    picker.replaceChildren(...(sel ? ['–', ...Object.keys(PLAT_T)].map((t) => onTap(el('button', { class: 'seg-btn', type: 'button' }, t), () => { if (t === '–') delete T[sel[0]][sel[1]]; else T[sel[0]][sel[1]] = t; sel = null; ctx.sound.tap(); draw(); if (onEdit) onEdit(); })) : [el('span', { class: 'pn-ket' }, 'Ketuk kotak untuk memilih tujuan; ketuk nama keadaan untuk menjadikannya keadaan terima (◎).')]));
  };
  host.append(box, picker);
  draw();
  return { draw, get dfa() { return { ...DFA.plat, T, accept: [...accept] }; } };
}

export default {
  id: 'sma-17-plat-nomor',
  title: 'Plat Nomor yang Sah',
  topic: 'Automata hingga, tabel transisi, dan ekspresi reguler',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🚗',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menelusuri teks pada automata, melengkapi tabel transisi dan keadaan terima automata plat nomor, menguji plat, membaca dan menulis ekspresi reguler sederhana, merancang automata dengan putaran, dan menjelaskan mengapa pemeriksaan automata cepat.',
  extraModes: [
    { id: 'lab', icon: '🧪', label: 'Lab Automata', desc: 'Pilih kode rombel, plat nomor, atau alamat surel; ketik teks dan jalankan langkah demi langkah; tampilkan ekspresi reguler; buat tabel plat sendiri dan bandingkan dengan acuan', create: createLab },
    { id: 'giliran', icon: '🔁', label: 'Teks Pengecoh', desc: 'Setiap giliran mendapat automata plat yang punya satu bug tersembunyi; tim menulis teks pengecoh dan mendapat poin bila automata itu menjawab salah', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act plat-nomor' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const pic = (d, o = {}) => el('div', { class: 'pn-diagram kecil', html: diagram(d, o) });
      const P = DFA.plat;
      if (r === 0) traceRound(wrap, ctx, { d: DFA.rombel, texts: ['XII 7', 'X 0', 'XIII 2'], done: next });
      else if (r === 1) ask(`Teks XI tidak pernah masuk keadaan mati, tetapi ditolak. Mengapa?`, [['Teks habis di k2, yang bukan keadaan terima; nomor rombel belum dibaca', true], ['Karena XI bukan angka Romawi'], ['Karena k2 adalah keadaan mati'], ['Sebenarnya XI diterima']], 1, pic(DFA.rombel, { cur: 'k2', path: ['k0', 'k1'] }));
      else if (r === 2) {
        const T = Object.fromEntries(Object.entries(PLAT_T).map(([k, v]) => [k, ['q0', 'q1', 'q2', 'q3'].includes(k) ? { ...v } : {}]));
        const msg = el('p', { class: 'reveal hint' }, 'Lengkapi baris q4–q11. Kotak kosong (–) berarti mati.');
        wrap.append(el('p', { class: 'prompt' }, 'Lengkapi tabel transisi automata plat nomor.'));
        const ed = tableEditor(wrap, ctx, { T, accept: new Set(), editable: (s) => !['q0', 'q1', 'q2', 'q3'].includes(s) });
        wrap.append(el('div', { class: 'kode-baris' }, button('Periksa', () => {
          if (solved) return;
          const bad = []; for (const s of Object.keys(PLAT_T)) for (const l of P.labels) if ((T[s][l] || null) !== (PLAT_T[s][l] || null)) bad.push(`${s}/${l}`);
          if (bad.length) { ctx.mistake(); shake(wrap); say(msg, 'bad', `${bad.length} kotak belum tepat, misalnya ${bad[0].replace('/', ' saat membaca ')}.`); return; }
          ed.draw(); say(msg, '', 'Tabel tepat. 1–9 dan 0 dipisah karena q3 hanya menerima 1–9, tetapi q4–q6 menerima keduanya.'); next();
        }, 'primary')), msg);
      } else if (r === 3) {
        const accept = new Set();
        const msg = el('p', { class: 'reveal hint' }, 'Ketuk nama keadaan untuk menjadikannya keadaan terima (◎), lalu periksa.');
        wrap.append(el('p', { class: 'prompt' }, 'Keadaan mana saja yang harus menjadi keadaan terima?'));
        tableEditor(wrap, ctx, { T: Object.fromEntries(Object.entries(PLAT_T).map(([k, v]) => [k, { ...v }])), accept, editable: () => true });
        wrap.append(el('div', { class: 'kode-baris' }, button('Periksa', () => {
          if (solved) return;
          const want = new Set(P.accept); const miss = P.accept.filter((s) => !accept.has(s)); const extra = [...accept].filter((s) => !want.has(s));
          if (miss.length || extra.length) { ctx.mistake(); shake(wrap); say(msg, 'bad', extra.length ? `${extra[0]} tidak boleh menjadi keadaan terima${extra[0] === 'q8' ? ': sesudah spasi itu harus ada huruf' : ''}.` : `Masih kurang ${miss.length} keadaan terima${miss[0] === 'q4' ? ' (huruf akhir boleh tidak ada)' : ''}.`); return; }
          say(msg, '', 'q4–q7 dan q9–q11: tujuh keadaan terima. q4–q7 karena huruf akhir boleh tidak ada.'); next();
        }, 'primary')), msg);
      } else if (r === 4) {
        let i = 0;
        const box = el('div', { class: 'pn-diagram' });
        const plate = el('div');
        const msg = el('p', { class: 'reveal info' }, 'Sah atau tidak? Pikirkan dulu, lalu automata menelusurinya.');
        const draw = () => { box.innerHTML = diagram(P); plate.replaceChildren(el('div', { class: 'pn-plat' }, show(P.samples[i]))); };
        const pick = (yes) => {
          if (i >= P.samples.length || box.dataset.busy) return;
          const t = P.samples[i]; const ok = P.re.test(t);
          if (yes !== ok) ctx.mistake();
          box.dataset.busy = '1';
          animate(box, P, t, () => { say(msg, yes === ok ? '' : 'bad', `${show(t)}: ${ok ? 'sah' : 'tidak sah'}, ${verdict(P, t)}.`); setTimeout(() => { delete box.dataset.busy; i++; if (i >= P.samples.length) next(); else draw(); }, 1500); }, 180);
        };
        wrap.append(el('p', { class: 'prompt' }, 'Uji 12 plat: sah atau tidak?'), plate, box, el('div', { class: 'kode-baris' }, button('✅ Sah', () => pick(true), 'primary'), button('❌ Tidak sah', () => pick(false))), msg);
        draw();
      } else if (r === 5) ask(`Lengkapi ekspresi reguler plat: ^[A-Z]{…}${SP}[1-9][0-9]{…}(${SP}[A-Z]{…})?$. Mengapa bukan [0-9]{1,4}?`, [['{1,2}, {0,3}, {1,3}; [0-9]{1,4} juga menerima nomor berawalan 0 seperti WS␣0123␣AB', true], ['{2}, {4}, {3}; supaya lebih pendek'], ['{1,2}, {1,4}, {1,3}; [0-9] tidak menerima angka 9'], ['{0,2}, {0,3}, {0,3}; supaya kode wilayah boleh kosong']]);
      else if (r === 6) ask('Andi menghapus ^ dan $, jadi pola dicari di bagian mana pun. Plat tidak sah mana yang sekarang dianggap mengandung plat?', [['4, 6, 7, 9, dan 10', true], ['Semua plat tidak sah'], ['Hanya 4'], ['5 dan 11']], 1, el('div', { class: 'pn-daftar' }, P.samples.map((t, j) => el('span', { class: P.re.test(t) ? 'sah' : '' }, `${j + 1}. ${show(t)}`))));
      else if (r === 7) ask('Automata nama surel: p0 –huruf→ p1, p1 –huruf→ ?, p1 –titik→ p2, p2 –huruf→ ?. Berapa keadaan seluruhnya (tanpa keadaan mati)?', [['p1 (putaran) dan p1; 3 + 14 rantai @contoh.sch.id = 17 keadaan', true], ['p2 dan p0; 3 + 14 = 17'], ['p1 dan p2; 3 + 13 = 16'], ['p0 dan p1; 14 keadaan']], 1, pic(DFA.surel));
      else if (r === 8) ask('Program automata: baris 8 "JIKA keadaan … MAKA sah". Rudi menggantinya dengan TAMPILKAN "sah" saja. Plat mana yang salah dinyatakan sah, dan berapa kali baris 4 dijalankan untuk WS␣1234␣AB?', [['Termasuk keadaan terima; plat 10 (WS␣31␣) lolos; 10 kali, satu per karakter', true], ['= q11; plat 4 lolos; 4 kali'], ['= mati; tidak ada; 12 kali'], ['Termasuk keadaan terima; plat 5 lolos; 100 kali']]);
      else ask('Tantangan: banyak plat sah dengan kode WS, dan automata nomor ponsel 08 + 8–11 angka?', [['9.999 × 18.279 = 182.771.721 plat; 14 keadaan dengan 4 keadaan terima, regex ^08[0-9]{8,11}$', true], ['9.999 × 26 = 259.974 plat; 11 keadaan dengan 1 keadaan terima'], ['10.000 × 17.576 plat; 13 keadaan dengan 3 keadaan terima'], ['182.771.721 plat; 12 keadaan dengan 12 keadaan terima']], 1, el('div', { class: 'au-status' }, 'Huruf akhir: 1 + 26 + 676 + 17.576 = 18.279 pilihan'));
    }
    render();
  },
};

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act plat-nomor' });
  root.append(wrap);
  let key = 'plat'; let text = 'WS 1234 AB'; let mine = null; let ed = null;
  const T = Object.fromEntries(Object.entries(PLAT_T).map(([k, v]) => [k, { ...v }])); const acc = new Set(DFA.plat.accept);
  const presets = el('div', { class: 'seg' });
  const samples = el('div', { class: 'seg pn-contoh' });
  const box = el('div', { class: 'pn-diagram kecil' });
  const chips = el('div');
  const tools = el('div', { class: 'kode-baris' });
  const extra = el('div', { class: 'pn-samping' });
  const out = el('p', { class: 'reveal hint' });
  const cur = () => (mine ? ed.dfa : DFA[key]);
  const draw = () => {
    presets.replaceChildren(...Object.entries(DFA).map(([k, d]) => onTap(el('button', { class: `seg-btn ${k === key && !mine ? 'on' : ''}`, type: 'button' }, d.label), () => { key = k; mine = null; extra.replaceChildren(); text = d.samples[0]; draw(); })),
      onTap(el('button', { class: `seg-btn ${mine ? 'on' : ''}`, type: 'button' }, '✏️ Tabel plat buatanku'), () => { key = 'plat'; mine = true; extra.replaceChildren(); ed = tableEditor(extra, ctx, { T, accept: acc, onEdit: () => { box.innerHTML = diagram(cur()); } }); draw(); }));
    samples.replaceChildren(...DFA[key].samples.map((t) => onTap(el('button', { class: 'seg-btn', type: 'button' }, show(t)), () => { text = t; draw(); })));
    box.innerHTML = diagram(cur());
    chips.replaceChildren(textChips(text));
  };
  tools.append(button('▶️ Jalankan', () => { const d = cur(); animate(box, d, text, () => { const ok = DFA[key].re.test(text); const r = run(d, text); say(out, r.ok === ok ? '' : 'bad', `${show(text) || '(kosong)'}: ${verdict(d, text)}. Ekspresi reguler acuan: ${ok ? 'cocok' : 'tidak cocok'}.`); }); }, 'primary'),
    button('Ekspresi reguler', () => say(out, 'info', DFA[key].regex)),
    button('Bandingkan dengan acuan', () => { if (!mine) { say(out, 'info', 'Pilih "Tabel plat buatanku" dulu.'); return; } const t = distinguish(ed.dfa, DFA.plat); say(out, t === null ? '' : 'bad', t === null ? 'Automatamu sama dengan acuan untuk semua teks.' : `Berbeda! Teks terpendek: "${show(t) || '(kosong)'}". Acuan: ${verdict(DFA.plat, t)}; punyamu: ${verdict(ed.dfa, t)}.`); }));
  const kb = keyboard((c) => { if (c === '⌫') text = text.slice(0, -1); else if (c === 'clear') text = ''; else if (text.length < 30) text += c; chips.replaceChildren(textChips(text)); });
  wrap.append(el('p', { class: 'prompt' }, 'Lab automata'), presets, samples, chips, kb, el('div', { class: 'pn-baris' }, box, extra), tools, out);
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act plat-nomor' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0);
    const order = ctx.rand.shuffle([...BUGS]);
    let turn = 0;
    function play() {
      if (turn >= Math.min(order.length, n * 2)) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Teks Pengecoh', start) });
      const team = turn % n; const bug = order[turn]; const d = buggy(bug);
      let text = ''; let tries = 0; let fin = false;
      const chips = el('div');
      const msg = el('p', { class: 'reveal hint' }, `Automata ini punya satu bug. Tulis teks yang dijawab salah olehnya. Tiga percobaan.`);
      const box = el('div', { class: 'pn-diagram kecil' });
      box.innerHTML = diagram(d);
      const draw = () => chips.replaceChildren(textChips(text));
      const go = () => {
        if (fin) return;
        tries++;
        const want = DFA.plat.re.test(text); const got = run(d, text).ok;
        if (want !== got) { fin = true; pts[team]++; ctx.sound.good(); say(msg, '', `Terkecoh! "${show(text)}" seharusnya ${want ? 'sah' : 'tidak sah'}, tetapi automata menjawab ${got ? 'sah' : 'tidak sah'}. Bugnya: ${bug.name}. Tim ${team + 1} +1.`); turn++; setTimeout(play, 3600); return; }
        ctx.sound.bad();
        if (tries >= 3) { fin = true; say(msg, 'bad', `Tidak terkecoh. Bugnya: ${bug.name}; contoh pengecoh terpendek "${show(distinguish(d, DFA.plat))}".`); turn++; setTimeout(play, 4200); return; }
        say(msg, 'bad', `Automata menjawab benar (${got ? 'sah' : 'tidak sah'}). Sisa ${3 - tries} percobaan.`);
      };
      wrap.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Tim ${team + 1}: kecoh automata plat ini`), box, chips,
        keyboard((c) => { if (c === '⌫') text = text.slice(0, -1); else if (c === 'clear') text = ''; else if (text.length < 16) text += c; draw(); }),
        el('div', { class: 'kode-baris' }, button('Uji teks', go, 'primary')), msg);
      draw();
    }
    play();
  }
  pickTeams(wrap, 'Teks Pengecoh', start);
}
