// Plat Nomor yang Sah — SMA/SMK (16–18 tahun), automata hingga dan ekspresi reguler.
// Game "Palang Pintar": the team is the brain of a parking gate. Walk a pawn
// along the tape, assemble the plate machine, judge a queue of cars, fill the
// regular-expression holes, run the e-mail lane, and turn the machine into code.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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
export const verdict = (d, text) => { const r = run(d, text); return r.ok ? `diterima (berakhir di ${r.path[r.path.length - 1]})` : r.dead ? `ditolak: mati di ${r.dead.state} saat membaca "${show(r.dead.char)}"` : `ditolak: berhenti di ${r.path[r.path.length - 1]}, bukan keadaan terima`; };
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

export function diagram(d, { cur = null, deadAt = null, path = [], sel = [], pion = null } = {}) {
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
    const acc = d.accept.includes(s); const on = s === cur; const dead = s === deadAt; const was = path.includes(s); const pick = sel.includes(s);
    return `<g data-s="${s}" class="pn-keadaan"><circle cx="${x}" cy="${y}" r="24" fill="${dead ? '#fecaca' : on ? '#facc15' : pick ? '#bfdbfe' : was ? '#fef9c3' : '#fff'}" stroke="${dead ? '#b91c1c' : pick ? '#2563eb' : '#1e293b'}" stroke-width="${pick ? 5 : 3}"/>${acc ? `<circle cx="${x}" cy="${y}" r="19" fill="none" stroke="#1e293b" stroke-width="2"/>` : ''}<text x="${x}" y="${y + 6}" font-size="${s.length > 2 ? 14 : 16}" font-weight="900" text-anchor="middle">${s}</text>${s === pion ? pionSvg(x, y) : ''}</g>`;
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

// ---------- Permainan: Palang Pintar ----------
// The team is the brain of a parking gate: the tape reader moves the clip, the
// pawn mover walks the bottle cap through the automaton (or drops it in MATI),
// and the gate keeper opens or closes the boom.

const jenis = (d, c) => { const k = cls[d.cls](c); return k === SP ? 'spasi (␣)' : k === 'huruf' || k === 'titik' ? k : k === '@' ? 'tanda @' : /^[A-Z]$/.test(k) ? `huruf ${k}` : /\d/.test(c) ? `angka ${k === 'lain' ? c : k}` : `karakter ${show(c)}`; };
const tape = (t, k = -1, dead = false) => el('div', { class: 'pl17-pita' }, [...t].map((c, i) => el('span', { class: `${i < k ? 'sudah' : ''} ${i === k ? (dead ? 'mati' : 'kini') : ''}` }, c === ' ' ? SP : c)));
function gate() {
  const plate = el('b', { class: 'pl17-plat' });
  const node = el('div', { class: 'pl17-gerbang' }, el('span', { class: 'pl17-mobil' }, '🚗', plate), el('span', { class: 'pl17-tiang' }, el('i', { class: 'pl17-palang' })));
  return { node, show(t) { plate.textContent = show(t); node.className = 'pl17-gerbang'; }, set(k) { node.className = `pl17-gerbang ${k}`; } };
}
const gateButtons = (pick) => [button('🟢 Palang Buka', (e) => pick(true, e?.currentTarget), 'primary'), button('🔴 Palang Tutup', (e) => pick(false, e?.currentTarget))];
const onState = (box, fn) => box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-s]'); if (!g) return; e.preventDefault(); fn(g.dataset.s, g); });
const reWith = (anchors = true) => new RegExp(`${anchors ? '^' : ''}[A-Z]{1,2} [1-9][0-9]{0,3}( [A-Z]{1,3})?${anchors ? '$' : ''}`);

// The e-mail automaton drawn compactly: p0, p1 (loop), p2, and the 14-cell lane @contoh.sch.id.
function surelSvg({ cur = null, path = [], dead = null } = {}) {
  const node = (s, x, y) => { const on = s === cur; const dd = s === dead; const was = path.includes(s); return `<g data-s="${s}" class="pn-keadaan"><circle cx="${x}" cy="${y}" r="26" fill="${dd ? '#fecaca' : on ? '#facc15' : was ? '#fef9c3' : '#fff'}" stroke="${dd ? '#b91c1c' : '#1e293b'}" stroke-width="3"/><text x="${x}" y="${y + 6}" font-size="18" font-weight="900" text-anchor="middle">${s}</text>${on ? pionSvg(x, y) : ''}</g>`; };
  const lab = (x, y, t) => `<text x="${x}" y="${y}" font-size="17" font-weight="800" text-anchor="middle" fill="#1e3a8a" paint-order="stroke" stroke="#fff" stroke-width="5">${t}</text>`;
  const k = cur && cur[0] === 'c' ? +cur.slice(1) : path.filter((s) => s[0] === 'c').length;
  const cells = [...chain].map((c, i) => { const s = `c${i + 1}`; const on = s === cur; const dd = s === dead; const done = i + 1 < k || (i + 1 === k && !on); const x = 300 + i * 34; return `<g data-s="${s}" class="pn-keadaan"><rect x="${x}" y="88" width="32" height="44" rx="6" fill="${dd ? '#fecaca' : on ? '#facc15' : done ? '#fef9c3' : '#fff'}" stroke="#1e293b" stroke-width="${i === 13 ? 4 : 2}"/><text x="${x + 16}" y="117" font-size="18" font-weight="900" text-anchor="middle">${c}</text>${on ? pionSvg(x + 16, 110) : ''}</g>`; }).join('');
  return `<svg viewBox="0 0 800 250" role="img" aria-label="Automata alamat surel"><defs><marker id="as" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#475569"/></marker></defs>
    <line x1="8" y1="110" x2="32" y2="110" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>
    <line x1="86" y1="110" x2="150" y2="110" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>${lab(118, 100, 'huruf')}
    <path d="M165 88 C140 20 216 20 191 88" fill="none" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>${lab(178, 34, 'huruf')}
    <line x1="170" y1="136" x2="170" y2="190" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>${lab(140, 170, 'titik')}
    <line x1="186" y1="194" x2="186" y2="140" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>${lab(222, 170, 'huruf')}
    <line x1="204" y1="110" x2="296" y2="110" stroke="#475569" stroke-width="3" marker-end="url(#as)"/>${lab(250, 100, '@')}
    ${node('p0', 60, 110)}${node('p1', 178, 110)}${node('p2', 178, 220)}${cells}
    <text x="538" y="168" font-size="17" font-weight="800" text-anchor="middle" fill="#334155">lorong @contoh.sch.id: ${k}/14${dead && dead[0] === 'c' ? ' (mati)' : ''}</text>
    <circle cx="764" cy="200" r="13" fill="none" stroke="#1e293b" stroke-width="2"/><circle cx="764" cy="200" r="9" fill="none" stroke="#1e293b" stroke-width="2"/><text x="740" y="206" font-size="15" text-anchor="end" fill="#334155">c14 keadaan terima</text></svg>`;
}
const pionSvg = (x, y) => `<circle cx="${x + 19}" cy="${y - 19}" r="10" fill="#dc2626" stroke="#fff" stroke-width="3" pointer-events="none"/>`;

// Misi 1 and 5: walk the pawn along the tape, then decide the gate.
function pionRound(wrap, ctx, { d, texts, draw: paint, auto = () => false, win = '', done }) {
  let ti = 0; let k = 0; let s = null; let path = []; let dead = false; let phase = 'jalan';
  const g = gate();
  const pita = el('div', { class: 'pl17-pita-wadah' });
  const box = el('div', { class: 'pl17-mesin' });
  const mati = onTap(el('button', { type: 'button', class: 'pl17-mati' }, '💀', el('span', null, 'MATI')), (e) => tapDead(e.currentTarget));
  const tools = el('div', { class: 'pl17-tombol' });
  const msg = el('p', { class: 'reveal info' });
  const text = () => texts[ti];
  const draw = () => { fill(pita, el('small', null, `📎 Pita ${ti + 1}/${texts.length}`), tape(text(), phase === 'jalan' || dead ? k : -1, dead)); box.innerHTML = paint({ cur: dead ? null : s, path, dead: dead ? s : null }); mati.classList.toggle('isi', dead); };
  function start() { k = 0; s = d.start; path = [s]; dead = false; phase = 'jalan'; g.show(text()); fill(tools); draw(); say(msg, 'info', `Pembaca pita: ${jenis(d, text()[0])}. Ketuk keadaan tujuan pion, atau MATI.`); go(); }
  function go() {
    if (phase !== 'jalan') return;
    if (k >= text().length) { toGate(); return; }
    if (!auto(s)) return;
    setTimeout(() => {
      if (!box.isConnected || phase !== 'jalan') return;
      const n = step(d, s, text()[k]);
      if (!n) { dead = true; ctx.sound.bad(); toGate(); return; }
      s = n; path.push(n); k++; draw(); go();
    }, 260);
  }
  function tapState(t) {
    if (phase !== 'jalan' || auto(s) || k >= text().length) return;
    const c = text()[k]; const want = step(d, s, c);
    if (t !== want) { ctx.mistake(); shake(box); say(msg, 'bad', want ? `Yang dibaca ${jenis(d, c)}. Cari panah berlabel itu dari ${s}.` : `Tidak ada panah untuk ${jenis(d, c)} dari ${s}. Ke mana pion jatuh?`); return; }
    s = t; path.push(t); k++; ctx.sound.tap(); draw();
    if (k < text().length && !auto(s)) say(msg, 'info', `Berikutnya: ${jenis(d, text()[k])}.`);
    else if (auto(s) && k < text().length) say(msg, 'info', 'Pion masuk lorong: setiap karakter harus persis sama. Lihat penghitungnya.');
    go();
  }
  function tapDead(node) {
    if (phase !== 'jalan' || auto(s) || k >= text().length) return;
    const c = text()[k];
    if (step(d, s, c)) { ctx.mistake(); shake(node); say(msg, 'bad', `Masih ada panah untuk ${jenis(d, c)} dari ${s}.`); return; }
    dead = true; ctx.sound.tap(); toGate();
  }
  function toGate() {
    phase = 'palang'; draw();
    say(msg, 'info', dead ? `Pion jatuh ke MATI di ${s} saat membaca ${show(text()[k])}. Penjaga palang: buka atau tutup?` : `Pita habis, pion berhenti di ${s}. Penjaga palang: buka atau tutup?`);
    fill(tools, gateButtons(pickGate));
  }
  function pickGate(open, node) {
    if (phase !== 'palang') return;
    const ok = !dead && d.accept.includes(s);
    if (open !== ok) { ctx.mistake(); shake(node || tools); say(msg, 'bad', dead ? 'Pion sudah mati: teks pasti ditolak.' : ok ? `${s} keadaan terima (lingkaran ganda).` : `${s} bukan keadaan terima: tidak berlingkaran ganda.`); return; }
    phase = 'tunggu'; fill(tools); g.set(ok ? 'buka' : 'tolak'); ctx.sound.good();
    const t = text();
    ti++;
    if (ti >= texts.length) { say(msg, '', `${show(t)}: ${verdict(d, t)}. ${win}`); done(); return; }
    say(msg, '', `${show(t)}: ${verdict(d, t)}.`);
    setTimeout(() => { if (box.isConnected) start(); }, 2800);
  }
  onState(box, tapState);
  wrap.append(el('div', { class: 'pl17-atas' }, g.node, pita), el('div', { class: 'pl17-meja' }, box, mati), tools, msg);
  start();
}

// Misi 2: build part of the plate machine, then test it on the 12 plates.
function buildRound(wrap, ctx, { keep, keepAcc, done }) {
  const P = DFA.plat;
  const T = Object.fromEntries(Object.entries(PLAT_T).map(([s, row]) => [s, Object.fromEntries(Object.entries(row).filter(([l]) => keep(s, l)))]));
  const acc = new Set(keepAcc);
  let mode = 'panah'; let from = null; let to = null; let fin = false;
  const box = el('div', { class: 'pn-diagram pl17-rakit' });
  const modes = el('div', { class: 'pl17-mode' });
  const picker = el('div', { class: 'pl17-label' });
  const grid = el('div', { class: 'pl17-hasil' });
  const msg = el('p', { class: 'reveal info' }, 'Sebagian panah sudah terpasang. Ketuk keadaan asal, lalu tujuan, lalu pilih labelnya.');
  const mine = () => ({ ...P, T, accept: [...acc] });
  function draw() {
    box.innerHTML = diagram(mine(), { sel: [from, to].filter(Boolean) });
    fill(modes, [['panah', '➡️ Pasang panah'], ['terima', '◎ Keadaan terima']].map(([m, t]) => onTap(el('button', { type: 'button', class: `pl17-chip ${mode === m ? 'on' : ''}` }, t), () => { if (fin) return; mode = m; from = null; to = null; draw(); say(msg, 'info', m === 'panah' ? 'Ketuk keadaan asal, lalu tujuan.' : 'Ketuk keadaan untuk memberi atau melepas lingkaran ganda.'); })),
      button('▶ Uji 12 plat', () => test(), 'primary'));
    fill(picker, from && to ? [el('small', null, `${from} → ${to}:`), ...P.labels.map((l) => {
      const on = T[from][l] === to;
      return onTap(el('button', { type: 'button', class: `pl17-chip ${on ? 'on' : ''}` }, l), () => {
        if (fin) return;
        if (keep(from, l) && PLAT_T[from][l]) { shake(picker); say(msg, 'info', 'Panah ini sudah terpasang dari awal.'); return; }
        if (on) delete T[from][l]; else T[from][l] = to;
        ctx.sound.tap(); draw();
      });
    }), button('✓', () => { from = null; to = null; draw(); })] : null);
  }
  onState(box, (s) => {
    if (fin) return;
    if (mode === 'terima') { if (keepAcc.includes(s)) { say(msg, 'info', `${s} sudah keadaan terima dari awal.`); return; } if (acc.has(s)) acc.delete(s); else acc.add(s); ctx.sound.tap(); draw(); return; }
    if (!from || to) { from = s; to = null; } else if (s === from) from = null; else to = s;
    ctx.sound.tap(); draw();
    if (from && !to) say(msg, 'info', `Asal ${from}. Ketuk keadaan tujuan.`);
    else if (to) say(msg, 'info', `Pilih label untuk panah ${from} → ${to}. Ketuk lagi untuk melepas.`);
  });
  function test() {
    if (fin) return;
    const d = mine();
    const res = P.samples.map((t) => ({ t, want: P.re.test(t), got: run(d, t).ok }));
    fill(grid, res.map(({ t, want, got }) => el('span', { class: want === got ? 'v-ok' : 'v-no' }, `${want === got ? '✓' : '✗'} ${show(t)}`)));
    const bad = res.filter((x) => x.want !== x.got);
    if (bad.length) { ctx.mistake(); say(msg, 'bad', `${bad.length} plat dijawab salah, misalnya ${show(bad[0].t)}: seharusnya ${bad[0].want ? 'sah' : 'tidak sah'}, mesinmu ${verdict(d, bad[0].t)}.`); return; }
    const t = distinguish(d, P);
    if (t !== null) { ctx.mistake(); say(msg, 'bad', `Lulus 12 plat, tetapi pengecoh ${show(t) || '(kosong)'} dijawab salah: mesinmu ${verdict(d, t)}.`); return; }
    fin = true; from = null; to = null; draw(); ctx.sound.good();
    say(msg, '', 'Mesin lulus! Bukan hanya 12 plat: untuk teks apa pun jawabannya sama dengan mesin acuan.');
    done();
  }
  wrap.append(modes, picker, box, grid, msg);
  draw();
}

// Misi 3: a queue of cars. Open or close the gate; the reference pawn shows why.
function queueRound(wrap, ctx, { plates, done }) {
  const P = DFA.plat;
  let i = 0; let busy = false;
  const marks = [];
  const g = gate();
  const line = el('div', { class: 'pl17-antre' });
  const box = el('div', { class: 'pn-diagram kecil' });
  const tools = el('div', { class: 'pl17-tombol' });
  const msg = el('p', { class: 'reveal info' }, 'Sah atau tidak? Putuskan dulu, lalu pion acuan menelusurinya.');
  const draw = () => { g.show(plates[i] ?? ''); box.innerHTML = diagram(P); fill(line, plates.map((t, j) => el('span', { class: j < i ? (marks[j] ? 'v-ok' : 'v-no') : j === i ? 'kini' : '' }, j < i ? (marks[j] ? '✓' : '✗') : '🚗', el('small', null, show(t))))); };
  function pick(open) {
    if (busy || i >= plates.length) return;
    busy = true;
    const t = plates[i]; const ok = P.re.test(t);
    if (open !== ok) ctx.mistake(); else ctx.sound.tap();
    marks[i] = open === ok;
    g.set(open ? 'buka' : 'tolak');
    animate(box, P, t, () => {
      say(msg, open === ok ? '' : 'bad', `${show(t)}: ${ok ? 'sah' : 'tidak sah'}, ${verdict(P, t)}.${open === ok ? '' : open ? ' 🚨 Mobil tak sah lolos!' : ' 😠 Mobil sah tertahan!'}`);
      setTimeout(() => {
        if (!box.isConnected) return;
        i++; busy = false;
        if (i >= plates.length) { const n = marks.filter(Boolean).length; draw(); fill(tools); ctx.sound.good(); say(msg, '', `${n} dari ${plates.length} keputusan tepat. Pion acuan memeriksa setiap plat dengan satu langkah per karakter.`); done(); return; }
        draw();
      }, 1700);
    }, 110);
  }
  fill(tools, gateButtons(pick));
  wrap.append(el('div', { class: 'pl17-atas' }, g.node, line), box, tools, msg);
  draw();
}

// Misi 4: fill the quantifier holes, test on 12 plates, then find what slips through without ^ and $.
function regexRound(wrap, ctx, { done }) {
  const P = DFA.plat;
  const TILES = ['{1,2}', '{0,3}', '{1,3}', '{2}', '{1,4}', '+', '*', '?'];
  const holes = [null, null, null, null];
  let sel = null; let phase = 'isi'; const found = new Set();
  const code = el('div', { class: 'pl17-regex' });
  const tray = el('div', { class: 'pl17-ubin' });
  const grid = el('div', { class: 'pl17-hasil' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk ubin, lalu ketuk lubang. Ketuk lubang terisi untuk mengembalikan ubinnya.');
  const hole = (j) => onTap(el('button', { type: 'button', class: `pl17-lubang ${holes[j] == null ? 'kosong' : ''}` }, holes[j] == null ? '▢' : TILES[holes[j]]), () => {
    if (phase !== 'isi') return;
    if (sel != null) { holes[j] = sel; sel = null; } else holes[j] = null;
    ctx.sound.tap(); draw(); if (holes.every((h) => h != null)) test();
  });
  function draw() {
    const a = phase === 'isi' || phase === 'menang' ? '' : 'coret';
    fill(code, el('div', null, el('span', { class: a }, '^'), '[A-Z]', hole(0), '␣[1-9][0-9]', hole(1)), el('div', null, '(␣[A-Z]', hole(2), ')', hole(3), el('span', { class: a }, '$')));
    fill(tray, phase === 'isi' ? TILES.map((t, j) => onTap(el('button', { type: 'button', class: `pl17-chip kode ${sel === j ? 'on' : ''}`, disabled: holes.includes(j) }, t), () => { if (holes.includes(j)) return; sel = sel === j ? null : j; draw(); })) : null);
  }
  function regex(anch = true) { const q = holes.map((h) => TILES[h]); return new RegExp(`${anch ? '^' : ''}[A-Z]${q[0]} [1-9][0-9]${q[1]}( [A-Z]${q[2]})${q[3]}${anch ? '$' : ''}`); }
  function showGrid(tapFn) {
    const re = regex(phase === 'isi');
    fill(grid, P.samples.map((t, j) => {
      const want = P.re.test(t); const got = re.test(t);
      const node = el('button', { type: 'button', class: `${phase === 'isi' ? (want === got ? 'v-ok' : 'v-no') : found.has(j) ? 'lolos' : ''}` }, phase === 'isi' ? `${want === got ? '✓' : '✗'} ${j + 1}. ${show(t)}` : `${j + 1}. ${show(t)}${found.has(j) ? ` → ${show(reWith(false).exec(t)[0])}` : ''}`);
      return tapFn ? onTap(node, () => tapFn(j, node)) : node;
    }));
  }
  function test() {
    showGrid();
    const re = regex();
    const bad = P.samples.filter((t) => P.re.test(t) !== re.test(t));
    if (bad.length) { ctx.mistake(); say(msg, 'bad', `${bad.length} plat salah dinilai, misalnya ${show(bad[0])}: seharusnya ${P.re.test(bad[0]) ? 'sah' : 'tidak sah'}. Tukar ubinnya.`); return; }
    if (TILES[holes[3]] === '*') { ctx.mistake(); say(msg, 'bad', 'Lulus 12 plat, tetapi pengecoh WS␣12␣A␣B juga lolos: * membolehkan grup huruf akhir berulang. Grup itu boleh ada paling banyak sekali.'); return; }
    ctx.sound.good(); phase = 'jangkar'; draw();
    say(msg, 'info', 'Tepat! Sekarang Andi menghapus ^ dan $, jadi pola boleh cocok di bagian mana pun. Ketuk semua plat tidak sah yang kini ikut lolos.');
    showGrid(tapPlate);
  }
  const sneaky = P.samples.map((t, j) => (!P.re.test(t) && reWith(false).test(t) ? j : null)).filter((j) => j != null);
  function tapPlate(j, node) {
    if (phase !== 'jangkar' || found.has(j)) return;
    const t = P.samples[j];
    if (!sneaky.includes(j)) { ctx.mistake(); shake(node); say(msg, 'bad', P.re.test(t) ? `${show(t)} memang sah, bukan menyelinap.` : `Tidak ada potongan ${show(t)} yang cocok dengan pola.`); return; }
    found.add(j); ctx.sound.tap(); showGrid(tapPlate);
    if (found.size < sneaky.length) { say(msg, 'info', `${show(t)} lolos karena potongan ${show(reWith(false).exec(t)[0])} cocok. Masih ada ${sneaky.length - found.size}.`); return; }
    phase = 'menang'; draw(); showGrid(); ctx.sound.good();
    say(msg, '', `Plat ${sneaky.map((x) => x + 1).join(', ')} lolos tanpa ^ dan $. Jangkar memaksa pola mencocokkan seluruh teks, dari awal sampai akhir.`);
    done();
  }
  wrap.append(code, tray, grid, msg);
  draw();
}

// Misi Bos: the automaton becomes an 8-line program.
const PROG17 = ['keadaan ← q0', 'UNTUK SETIAP c DALAM teks', '  keadaan ← TRANSISI[keadaan][JENIS(c)]', '  JIKA keadaan = mati MAKA', '    TAMPILKAN "tidak sah"; BERHENTI', 'JIKA ▢ MAKA', '  TAMPILKAN "sah"', 'SELAIN ITU TAMPILKAN "tidak sah"'];
function programRound(wrap, ctx, { done }) {
  const P = DFA.plat;
  let cond = null; let phase = 'syarat'; let lit = -1; let count = null;
  const code = el('div', { class: 'pl17-program' });
  const pita = el('div', { class: 'pl17-pita-wadah' });
  const tools = el('div', { class: 'pl17-tombol' });
  const grid = el('div', { class: 'pl17-hasil' });
  const msg = el('p', { class: 'reveal info' }, 'Baris 6 masih kosong. Pilih syarat yang membuat program sama dengan automata.');
  const draw = () => fill(code, PROG17.map((t, i) => el('div', { class: `${i === lit ? 'kini' : ''} ${phase === 'hapus' && i >= 5 ? 'coret' : ''}` }, el('small', null, i + 1), i === 5 ? (cond ? t.replace('▢', cond) : el('span', null, 'JIKA ', el('b', { class: 'pl17-lubang kosong' }, '▢'), ' MAKA')) : t, i === 2 && count != null ? el('em', null, ` ×${count}`) : null)));
  const OPTS = [['keadaan termasuk TERIMA', true], ['keadaan = q11', 'WS␣507 berhenti di q6 yang juga keadaan terima, tetapi akan ditolak.'], ['keadaan ≠ q0', 'WS␣31␣ berhenti di q8 tetapi akan dinyatakan sah.']];
  fill(tools, ctx.rand.shuffle([...OPTS]).map(([t, ok]) => onTap(el('button', { type: 'button', class: 'pl17-chip kode' }, t), (e) => {
    if (phase !== 'syarat') return;
    if (ok !== true) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', ok); return; }
    cond = t; phase = 'hapus'; ctx.sound.tap(); draw(); fill(tools);
    say(msg, 'info', 'Rudi menghapus syarat itu: baris 6–8 menjadi TAMPILKAN "sah" saja. Ketuk plat tidak sah yang kini lolos.');
    fill(grid, P.samples.map((x, j) => onTap(el('button', { type: 'button' }, `${j + 1}. ${show(x)}`), (ev) => tapPlate(j, ev.currentTarget))));
  })));
  function tapPlate(j, node) {
    if (phase !== 'hapus') return;
    const t = P.samples[j]; const r = run(P, t);
    if (r.ok) { ctx.mistake(); shake(node); say(msg, 'bad', `${show(t)} memang sah.`); return; }
    if (r.dead) { ctx.mistake(); shake(node); say(msg, 'bad', `${show(t)} mati di ${r.dead.state}, jadi program sudah BERHENTI di baris 5.`); return; }
    ctx.sound.tap(); phase = 'hitung'; draw(); fill(grid);
    say(msg, 'info', `${show(t)} tidak pernah mati: berhenti di q8, lalu dinyatakan sah. Terakhir: untuk WS␣1234␣AB, berapa kali baris 3 dijalankan?`);
    fill(tools, [4, 7, 10, 11].map((n) => onTap(el('button', { type: 'button', class: 'pl17-chip' }, `${n} kali`), (e) => {
      if (phase !== 'hitung') return;
      if (n !== 10) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', 'Baris 3 ada di dalam UNTUK SETIAP: hitung karakter pitanya, spasi juga.'); return; }
      phase = 'jalan'; fill(tools); ctx.sound.tap(); play('WS 1234 AB');
    })));
  }
  function play(t) {
    let k = 0; count = 0;
    const tick = () => {
      if (!code.isConnected) return;
      if (k >= t.length) { lit = 6; draw(); fill(pita, tape(t)); ctx.sound.good(); say(msg, '', `Baris 3 berjalan 10 kali, satu per karakter, dan paling banyak 11 kali untuk plat sah (WS␣1234␣ABC). Waktunya sebanding panjang teks. Bonus: plat sah berkode WS ada 9.999 × 18.279 = 182.771.721.`); done(); return; }
      lit = 2; count++; k++; draw(); fill(pita, tape(t, k - 1)); setTimeout(tick, 330);
    };
    tick();
  }
  wrap.append(code, pita, tools, grid, msg);
  draw();
}

// Web variation: valid plates mixed with plates that break exactly one rule.
function randomPlates(rand, n = 8) {
  const L = () => String.fromCharCode(65 + rand.int(0, 25));
  const word = (k) => Array.from({ length: k }, L).join('');
  const num = (k) => String(rand.int(1, 9)) + Array.from({ length: k - 1 }, () => rand.int(0, 9)).join('');
  const good = () => [word(rand.int(1, 2)), num(rand.int(1, 4)), rand.int(0, 3) ? word(rand.int(1, 3)) : ''];
  const glue = ([a, b, c]) => (c ? `${a} ${b} ${c}` : `${a} ${b}`);
  const RULES = [
    ([, b, c]) => glue([word(3), b, c]),
    ([a, , c]) => glue([a, `0${num(rand.int(1, 3))}`, c]),
    ([a, , c]) => glue([a, num(5), c]),
    ([a, b]) => glue([a, b, word(4)]),
    (p) => `${glue(p)} `,
    (p) => glue(p).replace(' ', ''),
    ([a, b]) => glue([a, b, `${L()}${rand.int(1, 9)}`]),
    ([a]) => glue([a, `${rand.int(1, 9)}O${rand.int(0, 9)}`, '']),
  ];
  const re = DFA.plat.re;
  const out = [];
  const rules = rand.shuffle([...RULES.keys()]).slice(0, n / 2);
  for (const r of rules) for (let t = 0; t < 50; t++) { const x = RULES[r](good()); if (!re.test(x) && !out.includes(x)) { out.push(x); break; } }
  while (out.length < n) { const x = glue(good()); if (re.test(x) && !out.includes(x)) out.push(x); }
  return rand.shuffle(out);
}

const HEAD17 = {
  pion: ['Pion Keadaan', 'Geser pion mengikuti pita, lalu putuskan palangnya.'],
  rakit: ['Rakit Mesin', 'Pasang panah dan keadaan terima sampai mesin lulus uji.'],
  antre: ['Antrean Mobil', 'Buka atau tutup palang untuk setiap plat. Pion acuan membuktikannya.'],
  pola: ['Rumus Pola', 'Isi lubang ekspresi reguler dengan ubin yang tepat.'],
  surel: ['Gerbang Surel', 'Automata dengan putaran: nama boleh sepanjang apa pun.'],
  boss: ['Mesin Jadi Program', 'Ubah automata menjadi program, lalu cari celahnya.'],
};

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
    const wrap = el('div', { class: 'act plat-nomor pl17-main' });
    root.append(wrap);
    const plates = randomPlates(ctx.rand, 8);
    const nama = ctx.rand.pick(['tika.putri', 'budi', 'andi.rahman', 'sri.wahyu']);
    const R = DFA.rombel;
    const rombel = (o) => diagram(R, { cur: o.cur, path: o.path, deadAt: o.dead, pion: o.cur });
    const isChain = (s) => s && s[0] === 'c';
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD17[k], '🚧'));
      if (r === 0) { head('pion', 1); pionRound(wrap, ctx, { d: R, texts: ['XI 3', 'XII 7', 'IX 2'], draw: rombel, win: 'Hanya X, XI, atau XII lalu spasi lalu 1–9 yang membuka palang.', done: () => next() }); }
      else if (r === 1) { head('pion', 1); pionRound(wrap, ctx, { d: R, texts: ['XIII 2', 'X 0', 'XI'], draw: rombel, win: 'XI tidak pernah mati, tetapi pita habis di k2 yang bukan keadaan terima.', done: () => next() }); }
      else if (r === 2) { head('rakit', 2); buildRound(wrap, ctx, { keep: (s, l) => !((['q4', 'q5', 'q6'].includes(s) && l !== SP) || (['q4', 'q5', 'q6', 'q7'].includes(s) && l === SP)), keepAcc: ['q9', 'q10', 'q11'], done: () => next(6000) }); }
      else if (r === 3) { head('antre', 3); queueRound(wrap, ctx, { plates: DFA.plat.samples, done: () => next() }); }
      else if (r === 4) { head('pola', 4); regexRound(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 5) { head('surel', 5); pionRound(wrap, ctx, { d: DFA.surel, texts: ['rina.ayu@contoh.sch.id', '.rina@contoh.sch.id', 'rina..ayu@contoh.sch.id'], draw: surelSvg, auto: isChain, win: 'Putaran di p1 membuat nama boleh sepanjang apa pun, tetapi titik tidak boleh di awal atau berdua.', done: () => next() }); }
      else if (r === 6) { head('antre', 3); queueRound(wrap, ctx, { plates, done: () => next() }); }
      else if (r === 7) { head('rakit', 2); buildRound(wrap, ctx, { keep: (s) => !['q0', 'q1', 'q2', 'q8', 'q9', 'q10'].includes(s), keepAcc: ['q4', 'q5', 'q6', 'q7'], done: () => next(6000) }); }
      else if (r === 8) { head('surel', 5); pionRound(wrap, ctx, { d: DFA.surel, texts: ['bayu@contoh.sch', 'rina.@contoh.sch.id', `${nama}@contoh.sch.id`], draw: surelSvg, auto: isChain, win: 'Lorong harus ditempuh sampai c14; berhenti di tengah sama dengan ditolak.', done: () => next() }); }
      else { head('boss', 'Bos'); programRound(wrap, ctx, { done: () => next(7000) }); }
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
