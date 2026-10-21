// Shared pieces for the SMP coding activities (smp-26 onward): row pickers,
// two-column matching, a step player with a step limit, and code listings.
// Team helpers come from sma-kit.js and are re-exported here.

import { el, onTap, button, shake } from '../core/util.js';

export { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { say } from './sma-kit.js';

// rows: [key, label, options[], right, explain]; every row must be answered.
export function rowsChoose(wrap, ctx, { prompt, rows, done, info = '', cls = '' }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `sk-baris-baris ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, opts, a, w]) => el('div', { class: `sk-baris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, a) : el('div', { class: 'seg' }, opts.map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, v), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', `${t}: belum tepat.`); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', w || 'Tepat.'); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1600);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

// left: [key, text, rightKey]; texts: {rightKey: text}. Tap left, then right.
export function pairRound(wrap, ctx, { prompt, left, texts, done, finalMsg = 'Semua pasangan tepat.', hint = 'Belum tepat, coba pasangan lain.' }) {
  const got = {}; let sel = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu kiri, lalu pasangannya di kanan.');
  const host = el('div', { class: 'sk-pasang' });
  const keys = ctx.rand.shuffle(Object.keys(texts));
  const draw = () => host.replaceChildren(el('div', { class: 'sk-kol' }, left.map(([k, n, a]) => onTap(el('button', { class: `sk-item ${sel === k ? 'pilih' : ''} ${k in got ? 'beres' : ''}`, type: 'button' }, el('span', null, n), k in got ? el('em', null, `→ ${texts[a]}`) : null), () => { if (!(k in got)) { sel = k; draw(); } }))),
    el('div', { class: 'sk-kol' }, keys.map((L) => onTap(el('button', { class: `sk-item ${Object.values(got).includes(L) ? 'beres' : ''}`, type: 'button' }, el('span', null, texts[L])), () => {
      if (!sel || Object.values(got).includes(L)) return; const want = left.find((p) => p[0] === sel)[2];
      if (L !== want) { ctx.mistake(); shake(host); say(msg, 'bad', hint); return; }
      got[sel] = L; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === left.length) { say(msg, '', finalMsg); setTimeout(done, 1400); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
}

// Multi-select: tap every right item, then Periksa.
export function pickSet(wrap, ctx, { prompt, items, right, done, info = 'Ketuk semua yang benar, lalu Periksa.', subject = null, why = '' }) {
  const on = new Set(); let fin = false;
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: 'sk-set' });
  const draw = () => box.replaceChildren(...items.map(([k, t]) => onTap(el('button', { class: `sk-chip ${on.has(k) ? 'on' : ''}`, type: 'button' }, t), () => { if (fin) return; on.has(k) ? on.delete(k) : on.add(k); draw(); })));
  draw();
  const check = button('Periksa', () => {
    if (fin) return;
    const ok = right.length === on.size && right.every((k) => on.has(k));
    if (!ok) { ctx.mistake(); shake(box); say(msg, 'bad', `Belum tepat: ada ${right.length} jawaban yang benar.`); return; }
    fin = true; ctx.sound.good(); say(msg, '', why || 'Tepat.'); setTimeout(done, 1800);
  }, 'primary');
  wrap.append(...[el('p', { class: 'prompt' }, prompt), subject ? el('div', { class: 'subject' }, subject) : null, box, check, msg].filter(Boolean));
}

// Code listing with line numbers; hl = set of highlighted line indexes (0-based).
export function codeView(lines, { hl = [], cls = '', onLine = null, warn = [], counts = null, labels = null } = {}) {
  return el('ol', { class: `sk-kode ${labels ? 'berlabel' : ''} ${cls}` }, lines.map((t, i) => {
    const li = el('li', { class: `${hl.includes(i) ? 'hl' : ''} ${warn.includes(i) ? 'warn' : ''}` }, labels ? el('span', { class: 'sk-label' }, labels[i] ?? '') : null, el('code', null, t || ' '), counts && counts[i] ? el('span', { class: 'sk-hitung' }, `×${counts[i]}`) : null);
    if (onLine) onTap(li, () => onLine(i));
    return li;
  }));
}

// Variable table: [[name, value]].
export const varView = (vars, changed = []) => el('div', { class: 'sk-var' }, vars.map(([n, v]) => el('div', { class: changed.includes(n) ? 'ubah' : '' }, el('small', null, n), el('b', null, String(v)))));

// Step-through runner for pseudocode: code with the current line lit, variable
// boxes coloured by data type, output, and a clear message when the step
// limit is reached. opts are passed to makeRunner (vars, input, builtins, limit).
import { makeRunner, fmt, typeOf, flat } from './pseudo.js';
export function tracer(lines, { opts = {}, title = '', onEnd = null, onStep = null, speed = 450, showTypes = true, hideVars = [], extra = null, cls = '', counts: showCounts = false, fmtOut = (t) => t } = {}) {
  let r; let last = null; let timer = null; let prev = {}; let counts = {};
  const host = el('div', { class: `sk-jejak ${cls}` });
  const draw = () => {
    const st = r.state; const vars = flat(st);
    const names = Object.keys(vars).filter((n) => !hideVars.includes(n));
    const changed = names.filter((n) => JSON.stringify(vars[n]) !== JSON.stringify(prev[n]));
    const msg = st.error ? el('p', { class: `sk-galat ${st.error.kind}` }, `${st.error.kind === 'batas' ? '⏱' : '⚠'} ${st.error.message}`)
      : st.done ? el('p', { class: 'sk-beres' }, `✓ Program selesai (${st.steps} langkah).`) : null;
    host.replaceChildren(
      el('div', { class: 'sk-jejak-kode' }, title ? el('b', null, title) : null, codeView(lines, { hl: last && !st.done ? [last.line] : [], warn: st.error ? [st.error.line] : [], counts: showCounts ? counts : null })),
      el('div', { class: 'sk-jejak-samping' },
        el('div', { class: 'sk-tombol' }, button('▶ Langkah', () => go(1), 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', toggle), button('⏭ Sampai selesai', () => { stop(); go(100000); }), button('↺ Ulang', reset)),
        el('p', { class: 'sk-catatan' }, last ? `Baris ${last.line + 1}: ${last.note}` : 'Ketuk Langkah untuk menjalankan baris pertama.'),
        msg,
        el('div', { class: 'sk-var' }, names.map((n) => el('div', { class: `${changed.includes(n) ? 'ubah' : ''} t-${typeOf(vars[n]).replace('/', '-')}` }, el('small', null, n), el('b', null, fmt(vars[n], { quote: true })), showTypes ? el('i', null, typeOf(vars[n])) : null))),
        st.frames.length ? el('p', { class: 'sk-tumpukan' }, `Tumpukan: ${st.frames.map((f) => `${f.name}(${f.args.map((a) => fmt(a, { quote: true })).join(', ')})`).join(' → ')}`) : null,
        el('div', { class: 'sk-keluaran' }, el('small', null, 'Keluaran'), el('pre', null, [...st.out, ...(st.row.length ? [st.row.join(' ')] : [])].map(fmtOut).join('\n') || ' ')),
        extra ? extra(st) : null));
    prev = JSON.parse(JSON.stringify(vars));
  };
  function go(k) {
    for (let i = 0; i < k; i++) { const g = r.gen.next(); if (g.done) break; last = g.value; counts[last.line] = (counts[last.line] || 0) + 1; onStep?.(last, r.state); if (i < k - 1 && (r.state.done || r.state.error)) break; }
    draw();
    if (r.state.done || r.state.error) { stop(); onEnd?.(r.state); }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { if (timer) { stop(); draw(); } else { timer = setInterval(() => go(1), speed); draw(); } }
  function reset(newOpts) { stop(); if (newOpts && !newOpts.type) opts = { ...opts, ...newOpts }; r = makeRunner(lines, opts); last = null; counts = {}; onStep?.(null, r.state); prev = { ...r.state.vars }; draw(); }
  reset();
  host.stop = stop; host.reset = reset; host.play = () => { if (!timer) toggle(); }; host.setLines = (ls) => { lines = ls; reset(); };
  return host;
}

// Number stepper: − value +.
export function stepper(value, onChange, { min = -Infinity, max = Infinity, step = 1, label = '' } = {}) {
  let v = value; const out = el('b', null, String(v));
  const set = (d) => { v = Math.min(max, Math.max(min, v + d)); out.textContent = String(v); onChange(v); };
  return el('div', { class: 'sk-stepper' }, label ? el('small', null, label) : null, button('−', () => set(-step)), out, button('+', () => set(step)));
}
// Distinct number options around a right answer.
export function numOpts(right, wrong, ctx) {
  const set = [...new Set([right, ...wrong.filter((x) => x !== right)])].slice(0, 4);
  return set.map((x) => [x, x === right]);
}

// Python listing with indentation guides (one guide per 4 spaces).
export function pyCode(lines, { hl = [], warn = [], cls = '', onLine = null, counts = null } = {}) {
  return el('ol', { class: `sk-kode py ${cls}` }, lines.map((t, i) => {
    const sp = (t.match(/^ */) || [''])[0].length; const lv = Math.floor(sp / 4);
    const li = el('li', { class: `${hl.includes(i) ? 'hl' : ''} ${warn.includes(i) ? 'warn' : ''}` }, el('code', null, ...Array.from({ length: lv }, () => el('span', { class: 'py-jorok' }, '    ')), ' '.repeat(sp % 4) + t.slice(sp) || ' '), counts && counts[i] ? el('span', { class: 'sk-hitung' }, `×${counts[i]}`) : null);
    if (onLine) onTap(li, () => onLine(i));
    return li;
  }));
}
// Step player for mini-py programs (same buttons as tracer).
import { makePyRunner, pyRepr, pyType } from './mini-py.js';
export function pyTracer(lines, { opts = {}, onEnd = null, onStep = null, speed = 450, hideVars = [], extra = null, cls = '', counts: showCounts = false } = {}) {
  let r; let last = null; let timer = null; let prev = {}; let counts = {};
  const host = el('div', { class: `sk-jejak ${cls}` });
  const draw = () => {
    const st = r.state; const vars = st.frames.length ? { ...st.vars, ...st.frames[st.frames.length - 1].vars } : st.vars;
    const names = Object.keys(vars).filter((n) => !hideVars.includes(n) && !(vars[n] && vars[n].py === 'fn'));
    const changed = names.filter((n) => JSON.stringify(vars[n]) !== JSON.stringify(prev[n]));
    const e = st.error;
    const msg = e ? el('div', { class: `sk-galat ${e.type === 'Batas' ? 'batas' : ''}` }, e.type === 'Batas' ? `⏱ ${e.message}` : `⚠ Baris ${e.line + 1} · ${e.type}: ${e.message}`, e.type !== 'Batas' && e.penjelasan ? el('small', { class: 'sk-penjelasan' }, e.penjelasan) : null)
      : st.done ? el('p', { class: 'sk-beres' }, `✓ Program selesai (${st.steps} langkah).`) : null;
    host.replaceChildren(
      el('div', { class: 'sk-jejak-kode' }, pyCode(lines, { hl: last && !st.done && !e ? [last.line] : [], warn: e && e.line != null ? [e.line] : [], counts: showCounts ? counts : null })),
      el('div', { class: 'sk-jejak-samping' },
        el('div', { class: 'sk-tombol' }, button('▶ Langkah', () => go(1), 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', toggle), button('⏭ Sampai selesai', () => { stop(); go(100000); }), button('↺ Ulang', reset)),
        el('p', { class: 'sk-catatan' }, last ? `Baris ${last.line + 1}: ${last.note.length > 90 ? `${last.note.slice(0, 88)}…` : last.note}` : 'Ketuk Langkah untuk menjalankan baris pertama.'),
        msg,
        names.length ? el('div', { class: 'sk-var' }, names.map((n) => el('div', { class: `${changed.includes(n) ? 'ubah' : ''} t-py-${pyType(vars[n])}` }, el('small', null, n), el('b', null, pyRepr(vars[n], true)), el('i', null, pyType(vars[n]))))) : null,
        el('div', { class: 'sk-keluaran' }, el('small', null, 'Keluaran'), el('pre', null, st.out.join('\n') || ' ')),
        extra ? extra(st) : null));
    prev = JSON.parse(JSON.stringify(vars, (k, v) => (v && v.py === 'fn' ? undefined : v)));
  };
  function go(k) {
    for (let i = 0; i < k; i++) { const g = r.gen.next(); if (g.done) break; last = g.value; counts[last.line] = (counts[last.line] || 0) + 1; onStep?.(last, r.state); if (r.state.done || r.state.error) break; }
    draw();
    if (r.state.done || r.state.error) { stop(); onEnd?.(r.state); }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { if (timer) { stop(); draw(); } else { timer = setInterval(() => go(1), speed); draw(); } }
  function reset() { stop(); const o = typeof opts === 'function' ? opts() : opts; r = makePyRunner(lines, o); last = null; counts = {}; onStep?.(null, r.state); prev = {}; draw(); }
  host.stop = stop; host.reset = reset; host.setLines = (ls) => { lines = ls; reset(); };
  reset();
  return host;
}
