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
export function codeView(lines, { hl = [], cls = '', onLine = null, warn = [] } = {}) {
  return el('ol', { class: `sk-kode ${cls}` }, lines.map((t, i) => {
    const li = el('li', { class: `${hl.includes(i) ? 'hl' : ''} ${warn.includes(i) ? 'warn' : ''}` }, el('code', null, t || ' '));
    if (onLine) onTap(li, () => onLine(i));
    return li;
  }));
}

// Variable table: [[name, value]].
export const varView = (vars, changed = []) => el('div', { class: 'sk-var' }, vars.map(([n, v]) => el('div', { class: changed.includes(n) ? 'ubah' : '' }, el('small', null, n), el('b', null, String(v)))));
