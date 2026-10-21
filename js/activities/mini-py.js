// A small Python 3 subset for the SMP/SMA coding activities: assignment,
// for … in range(…), while, if/elif/else, def/return, print, lists, len,
// str, int, round, and functions supplied by the activity (Kancil moves).
// It runs line by line as a generator (like pseudo.js) so the screen can
// step through it. Syntax errors use Python 3.13 messages; each error also
// carries a short explanation in Bahasa Indonesia.

export class PyError extends Error {
  constructor(type, message, line, penjelasan = '') { super(message); this.type = type; this.line = line; this.penjelasan = penjelasan; }
  get text() { return this.message ? `${this.type}: ${this.message}` : this.type; }
}
export class PyFloat { constructor(v) { this.v = v; } }
// dict keeps insertion order like Python 3.7+; tuples are arrays marked tup.
export class PyDict extends Map { toJSON() { return { dict: [...this] }; } }
// set keeps CPython's slot order for small non-negative ints (hash = the int,
// table of 8 slots, 9 linear probes then perturbation, resize at 3/5 full);
// other keys fall back to insertion order.
export class PySet {
  constructor(items = []) { this.order = []; this.tab = new Array(8).fill(undefined); this.fill = 0; this.plain = false; for (const x of items) this.add(x); }
  static ok(x) { return Number.isInteger(x) && x >= 0 && x < 2 ** 30; }
  static slot(tab, h) { const mask = tab.length - 1; let perturb = h; let i = h & mask; for (;;) { const probes = i + 9 <= mask ? 9 : 0; for (let j = 0; j <= probes; j++) if (tab[i + j] === undefined) return i + j; perturb = Math.floor(perturb / 32); i = (i * 5 + 1 + perturb) & mask; } }
  has(x) { return this.order.some((y) => y === x || (typeof y === 'object' && JSON.stringify(y) === JSON.stringify(x))); }
  add(x) {
    if (this.has(x)) return; this.order.push(x);
    if (this.plain || !PySet.ok(x)) { this.plain = true; return; }
    this.tab[PySet.slot(this.tab, x)] = x; this.fill++;
    const mask = this.tab.length - 1;
    if (this.fill * 5 >= mask * 3) { const used = this.fill; const min = used > 50000 ? used * 2 : used * 4; let n = 8; while (n <= min) n *= 2; const old = this.tab; this.tab = new Array(n).fill(undefined); for (const k of old) if (k !== undefined) this.tab[PySet.slot(this.tab, k)] = k; }
  }
  get size() { return this.order.length; }
  items() { return this.plain ? [...this.order] : this.tab.filter((k) => k !== undefined); }
  toJSON() { return { set: this.items() }; }
}
// Instances of user classes; attributes in insertion order.
export class PyObj { constructor(cls) { this.cls = cls; this.attrs = {}; } toJSON() { return { obj: this.cls.name, attrs: this.attrs }; } }
// collections.deque, kept as an array so indexing, len and for work as on a list.
export class PyDeque extends Array {}
export const tuple = (a) => { Object.defineProperty(a, 'tup', { value: true }); return a; };
const isTup = (v) => Array.isArray(v) && v.tup === true;
const isNum = (x) => typeof x === 'number' || x instanceof PyFloat;
const num = (x) => (x instanceof PyFloat ? x.v : x);
const BLOCK = /^(for|while|if|elif|else|def|class)\b/;

export function pyRepr(v, inner = false) {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (v instanceof PyFloat) { const x = v.v; if (!Number.isFinite(x)) return x > 0 ? 'inf' : x < 0 ? '-inf' : 'nan'; return Number.isInteger(x) ? `${x}.0` : String(x); }
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') { if (!inner) return v; const q = v.includes("'") && !v.includes('"') ? '"' : "'"; return q + v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(q === "'" ? /'/g : /(?!)/g, "\\'") + q; }
  if (v instanceof PyDeque) return `deque([${[...v].map((x) => pyRepr(x, true)).join(', ')}])`;
  if (isTup(v)) return v.length === 1 ? `(${pyRepr(v[0], true)},)` : `(${v.map((x) => pyRepr(x, true)).join(', ')})`;
  if (Array.isArray(v)) return `[${v.map((x) => pyRepr(x, true)).join(', ')}]`;
  if (v instanceof PySet) return v.size ? `{${v.items().map((x) => pyRepr(x, true)).join(', ')}}` : 'set()';
  if (v instanceof PyDict) return `{${[...v].map(([k, x]) => `${pyRepr(k, true)}: ${pyRepr(x, true)}`).join(', ')}}`;
  if (v && v.py === 'fn') return `<function ${v.name}>`;
  if (v && v.py === 'mod') return `<module '${v.name}'>`;
  if (v instanceof PyObj) return `<__main__.${v.cls.name} object>`;
  if (v && v.py === 'class') return `<class '__main__.${v.name}'>`;
  return String(v);
}
export const pyType = (v) => (v instanceof PyObj ? v.cls.name : v instanceof PyDeque ? 'deque' : v && v.py === 'class' ? 'type' : v === null || v === undefined ? 'NoneType' : typeof v === 'boolean' ? 'bool' : v instanceof PyFloat ? 'float' : typeof v === 'number' ? 'int' : typeof v === 'string' ? 'str' : isTup(v) ? 'tuple' : Array.isArray(v) ? 'list' : v instanceof PyDict ? 'dict' : v instanceof PySet ? 'set' : v && v.py === 'mod' ? 'module' : 'function');

// Screen display of a value: like repr, but objects show their attributes.
export function pyShow(v, depth = 0) {
  if (v instanceof PyObj) return depth > 2 ? `${v.cls.name}(…)` : `${v.cls.name}(${Object.entries(v.attrs).map(([k, x]) => `${k}=${pyShow(x, depth + 1)}`).join(', ')})`;
  if (Array.isArray(v) && !(v instanceof PyDeque) && !isTup(v) && v.some((x) => x instanceof PyObj)) return `[${v.map((x) => pyShow(x, depth + 1)).join(', ')}]`;
  return pyRepr(v, true);
}

// ---- tokenizer ----
function tokenize(src, line) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '#') break;
    if (c === '"' || c === "'") { let j = i + 1; let v = ''; const ESC = { n: '\n', t: '\t', '\\': '\\', '"': '"', "'": "'" }; while (j < src.length && src[j] !== c) { if (src[j] === '\\' && j + 1 < src.length) { v += ESC[src[j + 1]] ?? `\\${src[j + 1]}`; j += 2; } else v += src[j++]; } if (j >= src.length) throw new PyError('SyntaxError', `unterminated string literal (detected at line ${line + 1})`, line, 'Tanda petik penutup teks hilang.'); t.push({ k: 'str', v }); i = j + 1; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < src.length && /[0-9_]/.test(src[j])) j++; let f = false; if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { f = true; j++; while (j < src.length && /[0-9]/.test(src[j])) j++; } const v = Number(src.slice(i, j).replace(/_/g, '')); t.push({ k: 'num', v: f ? new PyFloat(v) : v }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /\w/.test(src[j])) j++; const w = src.slice(i, j); t.push(['and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'].includes(w) ? { k: 'kw', v: w } : { k: 'name', v: w }); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '+=', '-=', '*=', '**'].includes(two)) { t.push({ k: 'op', v: two }); i += 2; continue; }
    if ('+-*/%<>=(),:[].{}&'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
    throw new PyError('SyntaxError', 'invalid syntax', line, `Tanda "${c}" tidak dikenal.`);
  }
  return t;
}

// ---- expression parser (precedence climbing) ----
const PREC = { or: 1, and: 2, not: 3, '==': 4, '!=': 4, '<': 4, '>': 4, '<=': 4, '>=': 4, in: 4, is: 4, '+': 5, '-': 5, '*': 6, '/': 6, '//': 6, '%': 6, '**': 8, '&': 4.5 };
function parseExpr(toks, line) {
  let p = 0;
  const peek = () => toks[p]; const next = () => toks[p++];
  const isOp = (v) => peek() && (peek().k === 'op' || peek().k === 'kw') && peek().v === v;
  const expect = (v) => { if (!isOp(v)) throw new PyError('SyntaxError', v === ')' ? "'(' was never closed" : v === ']' ? "'[' was never closed" : 'invalid syntax', line, v === ')' ? 'Kurung buka tidak ditutup.' : 'Penulisan tidak sesuai aturan Python.'); next(); };
  function primary() {
    const t = next();
    if (!t) throw new PyError('SyntaxError', 'invalid syntax', line, 'Ekspresi belum lengkap.');
    let n;
    if (t.k === 'num') n = { t: 'val', v: t.v };
    else if (t.k === 'str') n = { t: 'val', v: t.v };
    else if (t.k === 'kw' && ['True', 'False', 'None'].includes(t.v)) n = { t: 'val', v: t.v === 'True' ? true : t.v === 'False' ? false : null };
    else if (t.k === 'name') n = { t: 'var', name: t.v };
    else if (t.k === 'op' && t.v === '(') { if (isOp(')')) { next(); n = { t: 'tuple', items: [] }; } else { const first = expr(0); if (isOp(',')) { const items = [first]; while (isOp(',')) { next(); if (isOp(')')) break; items.push(expr(0)); } n = { t: 'tuple', items }; } else n = first; expect(')'); } }
    else if (t.k === 'op' && t.v === '{') { const pairs = []; while (!isOp('}')) { const k = expr(0); expect(':'); pairs.push([k, expr(0)]); if (isOp(',')) next(); else break; } expect('}'); n = { t: 'dict', pairs }; }
    else if (t.k === 'op' && t.v === '[') { const items = []; if (!isOp(']')) { items.push(expr(0)); while (isOp(',')) { next(); if (isOp(']')) break; items.push(expr(0)); } } expect(']'); n = { t: 'list', items }; }
    else if (t.k === 'op' && t.v === '-') n = { t: 'neg', e: unary() };
    else throw new PyError('SyntaxError', 'invalid syntax', line, 'Penulisan tidak sesuai aturan Python.');
    for (;;) {
      if (isOp('(')) { next(); const args = []; const kw = {}; const arg = () => { if (peek()?.k === 'name' && toks[p + 1]?.v === '=') { const k2 = next().v; next(); kw[k2] = expr(0); } else args.push(expr(0)); }; if (!isOp(')')) { arg(); while (isOp(',')) { next(); if (isOp(')')) break; arg(); } } expect(')'); n = { t: 'call', f: n, args, kw }; }
      else if (isOp('[')) { next(); const i = isOp(':') ? null : expr(0); if (isOp(':')) { next(); const hi = isOp(']') || isOp(':') ? null : expr(0); let st = null; if (isOp(':')) { next(); st = isOp(']') ? null : expr(0); } expect(']'); n = { t: 'slice', a: n, lo: i, hi, st }; } else { expect(']'); n = { t: 'idx', a: n, i }; } }
      else if (isOp('.')) { next(); const m = next(); if (!m || m.k !== 'name') throw new PyError('SyntaxError', 'invalid syntax', line); n = { t: 'attr', o: n, name: m.v }; }
      else break;
    }
    return n;
  }
  function unary() { if (isOp('not')) { next(); return { t: 'not', e: expr(PREC.not) }; } return primary(); }
  function expr(min) {
    let l = unary();
    for (;;) {
      const t = peek(); if (!t || !(t.k === 'op' || t.k === 'kw')) break;
      let op = t.v; if (op === 'not' && toks[p + 1]?.v === 'in') op = 'not in'; if (op === 'is' && toks[p + 1]?.v === 'not') op = 'is not';
      const pr = PREC[op === 'not in' ? 'in' : op === 'is not' ? 'is' : op]; if (!pr || pr < min) break;
      next(); if (op === 'not in' || op === 'is not') next();
      const r = expr(op === '**' ? pr : pr + 1); l = { t: 'bin', op, l, r };
    }
    return l;
  }
  let e = expr(0);
  if (isOp(',')) { const items = [e]; while (isOp(',')) { next(); if (p >= toks.length) break; items.push(expr(0)); } e = { t: 'tuple', items }; }
  if (p < toks.length) { const t = toks[p]; if (t.v === '=') throw new PyError('SyntaxError', "invalid syntax. Maybe you meant '==' or ':=' instead of '='?", line, 'Untuk membandingkan, pakai == (dua tanda sama dengan).'); if (t.v === ':') throw new PyError('SyntaxError', 'invalid syntax', line); throw new PyError('SyntaxError', 'invalid syntax', line, 'Ada bagian yang berlebih atau tanda yang hilang.'); }
  return e;
}

// ---- program parser ----
export function parsePy(lines) {
  const rows0 = lines.map((raw, i) => ({ raw, i, ind: raw.match(/^ */)[0].length, s: raw.replace(/#.*$/, '').trim() })).filter((r) => r.s);
  // Join lines inside open brackets (a list written over several lines).
  const depth = (t) => { let d = 0; let q = null; for (const c of t) { if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; } return d; };
  const rows = []; for (let j = 0; j < rows0.length; j++) { const r = { ...rows0[j] }; while (depth(r.s) > 0 && j + 1 < rows0.length) { j++; r.s += ` ${rows0[j].s}`; } rows.push(r); }
  let k = 0;
  function block(ind, header) {
    const body = [];
    if (header && (k >= rows.length || rows[k].ind <= header.ind)) { const at = k < rows.length ? rows[k].i : header.i + 1; throw new PyError('IndentationError', `expected an indented block after '${header.kw}' statement on line ${header.i + 1}`, at, `Baris sesudah ${header.kw} harus menjorok ke kanan.`); }
    const my = k < rows.length ? rows[k].ind : ind;
    while (k < rows.length) {
      const r = rows[k];
      if (r.ind < my) { if (header && r.ind > header.ind) throw new PyError('IndentationError', 'unindent does not match any outer indentation level', r.i, 'Jorok baris ini tidak sama dengan baris-baris di atasnya.'); break; }
      if (r.ind > my) throw new PyError('IndentationError', 'unexpected indent', r.i, 'Baris ini menjorok padahal tidak berada di dalam for, while, if, atau def.');
      k++; body.push(stmt(r));
    }
    return body;
  }
  function header(r, kw) { if (!r.s.endsWith(':')) throw new PyError('SyntaxError', "expected ':'", r.i, `Baris ${kw} harus diakhiri titik dua.`); return r.s.slice(kw.length, -1).trim(); }
  function stmt(r) {
    const L = r.i; let m;
    const kw = (r.s.match(BLOCK) || [])[1];
    if (kw === 'for') { const h = header(r, 'for'); m = h.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s+in\s+(.+)$/); if (!m) throw new PyError('SyntaxError', 'invalid syntax', L, 'Bentuknya: for nama in range(…):'); return { t: 'for', line: L, v: m[1], it: parseExpr(tokenize(m[2], L), L), body: block(r.ind, { ind: r.ind, i: L, kw }) }; }
    if (kw === 'while') { const h = header(r, 'while'); return { t: 'while', line: L, c: parseExpr(tokenize(h, L), L), body: block(r.ind, { ind: r.ind, i: L, kw }) }; }
    if (kw === 'if' || kw === 'elif') {
      const h = header(r, kw); const node = { t: 'if', line: L, c: parseExpr(tokenize(h, L), L), body: block(r.ind, { ind: r.ind, i: L, kw }), else: null };
      if (kw === 'elif') return node;
      let cur = node;
      while (k < rows.length && rows[k].ind === r.ind && /^(elif|else)\b/.test(rows[k].s)) {
        const e = rows[k]; k++;
        if (e.s.startsWith('elif')) { const n2 = stmt(e); cur.else = [n2]; cur = n2; }
        else { if (!/^else\s*:$/.test(e.s)) throw new PyError('SyntaxError', "expected ':'", e.i, 'Baris else harus diakhiri titik dua.'); cur.else = block(e.ind, { ind: e.ind, i: e.i, kw: 'else' }); break; }
      }
      return node;
    }
    if (kw === 'else') throw new PyError('SyntaxError', 'invalid syntax', L, 'else harus tepat di bawah if dengan jorok yang sama.');
    if (kw === 'def') { const h = header(r, 'def'); m = h.match(/^([A-Za-z_]\w*)\((.*)\)$/); if (!m) throw new PyError('SyntaxError', 'invalid syntax', L); const raw = m[2].split(',').map((x) => x.trim()).filter(Boolean); const params = raw.map((x) => x.split('=')[0].trim()); const defaults = Object.fromEntries(raw.filter((x) => x.includes('=')).map((x) => [x.split('=')[0].trim(), parseExpr(tokenize(x.slice(x.indexOf('=') + 1), L), L)])); const body = block(r.ind, { ind: r.ind, i: L, kw: 'function definition' }); const glob = new Set(); const loc = new Set(params);
      const walk = (b) => { for (const x of b) { if (x.t === 'global') x.names.forEach((n) => glob.add(n)); if ((x.t === 'set' || x.t === 'aug') && x.target.t === 'var') loc.add(x.target.name); if (x.t === 'set' && x.target.t === 'unpack') x.target.names.forEach((n) => loc.add(n)); if (x.t === 'for') x.v.split(',').forEach((n) => loc.add(n.trim())); for (const c of [x.body, x.else]) if (Array.isArray(c)) walk(c); } };
      walk(body); glob.forEach((n) => loc.delete(n)); return { t: 'def', line: L, name: m[1], params, defaults, body, locals: loc, globals: glob }; }
    if ((m = r.s.match(/^return\b\s*(.*)$/))) return { t: 'ret', line: L, e: m[1] ? parseExpr(tokenize(m[1], L), L) : null };
    if ((m = r.s.match(/^global\s+(.+)$/))) return { t: 'global', line: L, names: m[1].split(',').map((x) => x.trim()) };
    if ((m = r.s.match(/^assert\s+(.+)$/))) { const e = parseExpr(tokenize(m[1], L), L); return e.t === 'tuple' && e.items.length === 2 ? { t: 'assert', line: L, c: e.items[0], msg: e.items[1] } : { t: 'assert', line: L, c: e, msg: null }; }
    if (kw === 'class') { const h = header(r, 'class'); m = h.match(/^([A-Za-z_]\w*)\s*(?:\(\s*([A-Za-z_]\w*)?\s*\))?$/); if (!m) throw new PyError('SyntaxError', 'invalid syntax', L); return { t: 'class', line: L, name: m[1], base: m[2] || null, body: block(r.ind, { ind: r.ind, i: L, kw }) }; }
    if (r.s === 'pass') return { t: 'pass', line: L };
    if ((m = r.s.match(/^from\s+([A-Za-z_]\w*)\s+import\s+([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)$/))) return { t: 'from', line: L, mod: m[1], names: m[2].split(',').map((x) => x.trim()) };
    if ((m = r.s.match(/^import\s+([A-Za-z_]\w*)$/))) return { t: 'import', line: L, name: m[1] };
    if (r.s === 'break') return { t: 'break', line: L };
    if (r.s === 'continue') return { t: 'continue', line: L };
    if ((m = r.s.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[[^=]+\])*)\s*(\+=|-=|\*=)\s*(.+)$/))) return { t: 'aug', line: L, target: parseExpr(tokenize(m[1], L), L), op: m[2][0], e: parseExpr(tokenize(m[3], L), L) };
    if ((m = r.s.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=(?!=)\s*(.+)$/))) return { t: 'set', line: L, target: { t: 'unpack', names: m[1].split(',').map((x) => x.trim()) }, e: parseExpr(tokenize(m[2], L), L) };
    if ((m = r.s.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[[^=]+\])*)\s*=(?!=)\s*(.+)$/))) return { t: 'set', line: L, target: parseExpr(tokenize(m[1], L), L), e: parseExpr(tokenize(m[2], L), L) };
    return { t: 'expr', line: L, e: parseExpr(tokenize(r.s, L), L) };
  }
  const prog = block(0, null);
  return prog;
}

// ---- runner ----
const WS = ' \t\n\r\f\v';
const stripChars = (o, ch, left, right) => { const set = ch === undefined || ch === null ? WS : ch; let i = 0; let j = o.length; if (left) while (i < j && set.includes(o[i])) i++; if (right) while (j > i && set.includes(o[j - 1])) j--; return o.slice(i, j); };
const STRM = {
  upper: (o) => o.toUpperCase(), lower: (o) => o.toLowerCase(),
  strip: (o, ch) => stripChars(o, ch, true, true), lstrip: (o, ch) => stripChars(o, ch, true, false), rstrip: (o, ch) => stripChars(o, ch, false, true),
  split: (o, sep) => (sep === undefined || sep === null ? o.split(/[ \t\n\r\f\v]+/).filter(Boolean) : o.split(sep)),
  join: (o, xs) => { const a = Array.isArray(xs) ? xs : typeof xs === 'string' ? [...xs] : []; a.forEach((x, k) => { if (typeof x !== 'string') throw new PyError('TypeError', `sequence item ${k}: expected str instance, ${pyType(x)} found`, null); }); return a.join(o); },
  replace: (o, a, b) => o.split(a).join(b), count: (o, a) => (a === '' ? o.length + 1 : o.split(a).length - 1), find: (o, a) => o.indexOf(a),
  startswith: (o, a) => o.startsWith(a), endswith: (o, a) => o.endsWith(a), isdigit: (o) => o.length > 0 && /^[0-9]+$/.test(o),
};
export function makePyRunner(lines, { builtins = {}, vars = {}, limit = 3000, input = [], loopLimit = 0 } = {}) {
  const st = { vars: { ...vars }, frames: [], out: [], steps: 0, done: false, error: null, calls: [] };
  let prog = []; let parseErr = null;
  try { prog = parsePy(lines); } catch (e) { if (!(e instanceof PyError)) throw e; parseErr = e; }
  const fn = (name, f) => ({ py: 'fn', name, f });
  const inputs = [...input];
  const B = {
    print: fn('print', (...a) => { st.out.push(a.map((x) => pyRepr(x)).join(' ')); return null; }),
    range: fn('range', (a, b, s = 1) => { const [lo, hi] = b === undefined ? [0, num(a)] : [num(a), num(b)]; const r = []; if (s > 0) for (let x = lo; x < hi; x += s) r.push(x); else for (let x = lo; x > hi; x += s) r.push(x); return r; }),
    len: fn('len', (x) => { if (x instanceof PyDict || x instanceof PySet) return x.size; if (typeof x === 'string' || Array.isArray(x)) return x.length; throw new PyError('TypeError', `object of type '${pyType(x)}' has no len()`, null, 'len() hanya untuk teks, list, tuple, atau dictionary.'); }),
    list: fn('list', (x) => iter(x)),
    set: fn('set', (x) => new PySet(x === undefined ? [] : iter(x))),
    sorted: fn('sorted', (...a) => { const kw = kwOf(a); const xs = [...iter(a[0])]; xs.sort(truthy(kw.reverse) ? (x, y) => pyCmp(y, x) : pyCmp); return xs; }),
    sum: fn('sum', (x) => x.reduce((a, b) => bin('+', a, b, null), 0)),
    max: fn('max', (...a) => { const xs = a.length === 1 && Array.isArray(a[0]) ? a[0] : a; return xs.reduce((p, q) => (num(q) > num(p) ? q : p)); }),
    min: fn('min', (...a) => { const xs = a.length === 1 && Array.isArray(a[0]) ? a[0] : a; return xs.reduce((p, q) => (num(q) < num(p) ? q : p)); }),
    str: fn('str', (x) => pyRepr(x)),
    int: fn('int', (x) => { if (typeof x === 'string') { if (!/^\s*[-+]?\d+\s*$/.test(x)) throw new PyError('ValueError', `invalid literal for int() with base 10: '${x}'`, null, 'Teks itu bukan bilangan bulat.'); return parseInt(x, 10); } return Math.trunc(num(x)); }),
    float: fn('float', (x) => new PyFloat(Number(typeof x === 'string' ? x : num(x)))),
    abs: fn('abs', (x) => (x instanceof PyFloat ? new PyFloat(Math.abs(x.v)) : Math.abs(x))),
    round: fn('round', (x, d) => { const v = num(x); const even = (y) => { const f = Math.floor(y); const diff = y - f; return diff > 0.5 ? f + 1 : diff < 0.5 ? f : (f % 2 === 0 ? f : f + 1); }; if (d === undefined || d === null) return even(v); const r = d >= 0 ? even(v * 10 ** d) / 10 ** d : even(v / 10 ** -d) * 10 ** -d; return x instanceof PyFloat ? new PyFloat(r) : r; }),
    super: { py: 'superfn', name: 'super' },
    isinstance: fn('isinstance', (o, c) => { if (!(o instanceof PyObj)) return false; for (let k = o.cls; k; k = k.base) if (k === c) return true; return false; }),
    input: fn('input', () => (inputs.length ? inputs.shift() : '')),
    ...Object.fromEntries(Object.entries(builtins).map(([k, f]) => [k, fn(k, f)])),
  };
  function iter(x) { if (typeof x === 'string') return [...x]; if (x instanceof PyDict) return [...x.keys()]; if (x instanceof PySet) return x.items(); if (Array.isArray(x)) return [...x]; throw new PyError('TypeError', `'${pyType(x)}' object is not iterable`, null); }
  // Standard-library modules available to `import`.
  const seqLen = (a) => { if (!Array.isArray(a)) throw new PyError('TypeError', `object of type '${pyType(a)}' has no len()`, null, 'bisect memerlukan list yang urut.'); return a.length; };
  const bisectAt = (a, x, right) => { let lo = 0; let hi = seqLen(a); while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (right ? pyCmp(x, a[mid]) < 0 : pyCmp(a[mid], x) < 0) { if (right) hi = mid; else lo = mid + 1; } else if (right) lo = mid + 1; else hi = mid; } return lo; };
  const MODS = { collections: { deque: (x) => PyDeque.from(x === undefined ? [] : iter(x)) }, bisect: { bisect_left: (a, x) => bisectAt(a, x, false), bisect_right: (a, x) => bisectAt(a, x, true), bisect: (a, x) => bisectAt(a, x, true), insort: (a, x) => { a.splice(bisectAt(a, x, true), 0, x); return null; }, insort_left: (a, x) => { a.splice(bisectAt(a, x, false), 0, x); return null; }, insort_right: (a, x) => { a.splice(bisectAt(a, x, true), 0, x); return null; } } };
  const scope = () => (st.frames.length ? st.frames[st.frames.length - 1].vars : st.vars);
  const look = (n, L) => { const s = scope(); if (n in s) return s[n]; const f = st.frames[st.frames.length - 1]; if (f?.locals?.has(n)) throw new PyError('UnboundLocalError', `cannot access local variable '${n}' where it is not associated with a value`, L, `${n} diberi nilai di dalam fungsi, jadi Python menganggapnya variabel lokal, padahal belum punya nilai.`); if (n in st.vars) return st.vars[n]; if (n in B) return B[n]; throw new PyError('NameError', `name '${n}' is not defined`, L, `Variabel atau fungsi ${n} belum dibuat.`); };
  function tick(L) { st.steps++; if (st.steps > limit) throw new PyError('Batas', `Program sudah menjalankan ${limit} langkah dan belum selesai. Mungkin ada perulangan yang tidak pernah berhenti.`, L, 'batas'); }
  function bin(op, a, b, L) {
    const fl = a instanceof PyFloat || b instanceof PyFloat;
    const mk = (v, f = fl) => (f ? new PyFloat(v) : v);
    const bad = () => { if (op === '+' && typeof a === 'string') throw new PyError('TypeError', `can only concatenate str (not "${pyType(b)}") to str`, L, 'Teks hanya bisa digabung dengan teks.'); throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${pyType(a)}' and '${pyType(b)}'`, L, 'Jenis data kedua nilai tidak cocok untuk operasi ini.'); };
    switch (op) {
      case '+': if (typeof a === 'string' && typeof b === 'string') return a + b; if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b]; if (isNum(a) && isNum(b)) return mk(num(a) + num(b)); return bad();
      case '-': if (isNum(a) && isNum(b)) return mk(num(a) - num(b)); return bad();
      case '*': if (typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, b)); if (typeof a === 'number' && typeof b === 'string') return b.repeat(Math.max(0, a)); if (Array.isArray(a) && !a.tup && typeof b === 'number') return Array.from({ length: Math.max(0, b) }, () => a).flat(); if (typeof a === 'number' && Array.isArray(b) && !b.tup) return Array.from({ length: Math.max(0, a) }, () => b).flat(); if (isNum(a) && isNum(b)) return mk(num(a) * num(b)); return bad();
      case '/': if (!isNum(a) || !isNum(b)) return bad(); if (num(b) === 0) throw new PyError('ZeroDivisionError', 'division by zero', L, 'Pembagian dengan nol.'); return new PyFloat(num(a) / num(b));
      case '//': if (!isNum(a) || !isNum(b)) return bad(); if (num(b) === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', L, 'Pembagian dengan nol.'); return mk(Math.floor(num(a) / num(b)));
      case '%': if (!isNum(a) || !isNum(b)) return bad(); if (num(b) === 0) throw new PyError('ZeroDivisionError', 'integer modulo by zero', L, 'Pembagian dengan nol.'); return mk(((num(a) % num(b)) + num(b)) % num(b));
      case '**': return mk(num(a) ** num(b));
      case '==': return eq(a, b); case '!=': return !eq(a, b);
      case '<': case '>': case '<=': case '>=': { if (isNum(a) && isNum(b)) { const x = num(a); const y = num(b); return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y; } if (typeof a === 'string' && typeof b === 'string') return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b; if (Array.isArray(a) && Array.isArray(b) && !!a.tup === !!b.tup) { const c = pyCmp(a, b); return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0; } throw new PyError('TypeError', `'${op}' not supported between instances of '${pyType(a)}' and '${pyType(b)}'`, L, 'Kedua nilai tidak bisa dibandingkan.'); }
      case '&': if (a instanceof PySet && b instanceof PySet) { const [big, small] = b.size > a.size ? [b, a] : [a, b]; const r = new PySet(); for (const x of small.items()) if (big.has(x)) r.add(x); return r; } if (Number.isInteger(a) && Number.isInteger(b)) return a & b; return bad();
      case 'in': if (b instanceof PyDict || b instanceof PySet) return b.has(a); return Array.isArray(b) ? b.some((x) => eq(x, a)) : String(b).includes(a);
      case 'not in': if (b instanceof PyDict || b instanceof PySet) return !b.has(a); return !(Array.isArray(b) ? b.some((x) => eq(x, a)) : String(b).includes(a));
      case 'is': return a === b || (a == null && b == null); case 'is not': return !(a === b || (a == null && b == null));
      default: throw new PyError('SyntaxError', 'invalid syntax', L);
    }
  }
  const pyCmp = (a, b) => { if (isNum(a) && isNum(b)) return num(a) - num(b); if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0; if (Array.isArray(a) && Array.isArray(b)) { for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = pyCmp(a[i], b[i]); if (c) return c; } return a.length - b.length; } throw new PyError('TypeError', `'<' not supported between instances of '${pyType(a)}' and '${pyType(b)}'`, null); };
  const kwOf = (args) => (args.length && args.at(-1) && args.at(-1).kwargs ? args.pop().kwargs : {});
  const findMethod = (c, name) => { for (let k = c; k; k = k.base) if (k.methods[name]) return k.methods[name]; return null; };
  const classAttr = (c, name) => { for (let k = c; k; k = k.base) if (name in k.attrs) return k.attrs[name]; return undefined; };
  function methods(o, name, L) {
    if (o instanceof PyDeque) { if (name === 'popleft') return () => { if (!o.length) throw new PyError('IndexError', 'pop from an empty deque', L); return o.shift(); }; if (name === 'pop') return () => { if (!o.length) throw new PyError('IndexError', 'pop from an empty deque', L); return o.pop(); }; if (name === 'appendleft') return (x) => { o.unshift(x); return null; }; if (name === 'append') return (x) => { o.push(x); return null; }; }
    if (o && o.py === 'mod') { if (o.f[name]) return o.f[name]; throw new PyError('AttributeError', `module '${o.name}' has no attribute '${name}'`, L); }
    if (Array.isArray(o) && !isTup(o)) {
      if (name === 'append') return (x) => { o.push(x); return null; };
      if (name === 'sort') return (...a) => { const kw = kwOf(a); o.sort(truthy(kw.reverse) ? (x, y) => pyCmp(y, x) : pyCmp); return null; };
      if (name === 'copy') return () => [...o];
      if (name === 'reverse') return () => { o.reverse(); return null; };
      if (name === 'remove') return (x) => { const i = o.findIndex((y) => eq(y, x)); if (i < 0) throw new PyError('ValueError', 'list.remove(x): x not in list', L); o.splice(i, 1); return null; };
      if (name === 'pop') return (i = o.length - 1) => { if (!o.length) throw new PyError('IndexError', 'pop from empty list', L); return o.splice(i < 0 ? i + o.length : i, 1)[0]; };
      if (name === 'insert') return (i, x) => { o.splice(i, 0, x); return null; };
    }
    if (Array.isArray(o) && name === 'index') return (x) => { const i = o.findIndex((y) => eq(y, x)); if (i < 0) throw new PyError('ValueError', `${pyRepr(x, true)} is not in list`, L); return i; };
    if (Array.isArray(o) && name === 'count') return (x) => o.filter((y) => eq(y, x)).length;
    if (o instanceof PySet) {
      if (name === 'add') return (x) => { o.add(x); return null; };
      if (name === 'copy') return () => new PySet(o.items());
    }
    if (o instanceof PyDict) {
      if (name === 'get') return (k, d = null) => (o.has(k) ? o.get(k) : d);
      if (name === 'keys') return () => [...o.keys()];
      if (name === 'values') return () => [...o.values()];
      if (name === 'items') return () => [...o].map(([k, v]) => tuple([k, v]));
      if (name === 'copy') return () => new PyDict(o);
    }
    return null;
  }
  const eq = (a, b) => (a instanceof PyObj || b instanceof PyObj ? a === b : isNum(a) && isNum(b) ? num(a) === num(b) : JSON.stringify(a) === JSON.stringify(b));
  const truthy = (v) => !(v === false || v === null || v === undefined || v === 0 || v === '' || (Array.isArray(v) && !v.length) || ((v instanceof PyDict || v instanceof PySet) && !v.size) || (v instanceof PyFloat && v.v === 0));
  function* ev(n, L) {
    switch (n.t) {
      case 'val': return n.v;
      case 'var': return look(n.name, L);
      case 'list': { const a = []; for (const x of n.items) a.push(yield* ev(x, L)); return a; }
      case 'tuple': { const a = []; for (const x of n.items) a.push(yield* ev(x, L)); return tuple(a); }
      case 'dict': { const d = new PyDict(); for (const [k, x] of n.pairs) { const kv = yield* ev(k, L); d.set(kv, yield* ev(x, L)); } return d; }
      case 'neg': { const v = yield* ev(n.e, L); return v instanceof PyFloat ? new PyFloat(-v.v) : -v; }
      case 'not': return !truthy(yield* ev(n.e, L));
      case 'bin': { const a = yield* ev(n.l, L); if (n.op === 'and') return truthy(a) ? yield* ev(n.r, L) : a; if (n.op === 'or') return truthy(a) ? a : yield* ev(n.r, L); return bin(n.op, a, yield* ev(n.r, L), L); }
      case 'idx': { const a = yield* ev(n.a, L); let i = yield* ev(n.i, L); if (a instanceof PyDict) { if (!a.has(i)) throw new PyError('KeyError', pyRepr(i, true), L, 'Kunci itu tidak ada di dictionary.'); return a.get(i); } if (!Array.isArray(a) && typeof a !== 'string') throw new PyError('TypeError', `'${pyType(a)}' object is not subscriptable`, L); if (i < 0) i += a.length; if (i < 0 || i >= a.length) throw new PyError('IndexError', `${Array.isArray(a) ? 'list' : 'string'} index out of range`, L, 'Indeks di luar batas.'); return a[i]; }
      case 'slice': { const a = yield* ev(n.a, L); if (!Array.isArray(a) && typeof a !== 'string') throw new PyError('TypeError', `'${pyType(a)}' object is not subscriptable`, L); const len = a.length; const st = n.st ? yield* ev(n.st, L) : 1; if (st === 0) throw new PyError('ValueError', 'slice step cannot be zero', L);
        const norm = (x, d) => { if (x === null || x === undefined) return d; x = num(x); if (x < 0) x += len; return st > 0 ? Math.min(Math.max(x, 0), len) : Math.min(Math.max(x, -1), len - 1); };
        const lo = norm(n.lo ? yield* ev(n.lo, L) : null, st > 0 ? 0 : len - 1); const hi = norm(n.hi ? yield* ev(n.hi, L) : null, st > 0 ? len : -1); const out = []; if (st > 0) for (let k = lo; k < hi; k += st) out.push(a[k]); else for (let k = lo; k > hi; k += st) out.push(a[k]);
        return typeof a === 'string' ? out.join('') : isTup(a) ? tuple(out) : out; }
      case 'attr': { const o = yield* ev(n.o, L);
        if (o instanceof PyObj) { if (n.name in o.attrs) return o.attrs[n.name]; const d = findMethod(o.cls, n.name); if (d) return { py: 'fn', name: n.name, def: d, self: o }; const ca = classAttr(o.cls, n.name); if (ca !== undefined) return ca; throw new PyError('AttributeError', `'${o.cls.name}' object has no attribute '${n.name}'`, L, 'Objek ini tidak punya atribut atau metode dengan nama itu.'); }
        if (o && o.py === 'super') { const d = o.cls.base && findMethod(o.cls.base, n.name); if (d) return { py: 'fn', name: n.name, def: d, self: o.obj }; throw new PyError('AttributeError', `'super' object has no attribute '${n.name}'`, L); }
        if (o && o.py === 'class') { const d = findMethod(o, n.name); if (d) return { py: 'fn', name: n.name, def: d }; const ca = classAttr(o, n.name); if (ca !== undefined) return ca; throw new PyError('AttributeError', `type object '${o.name}' has no attribute '${n.name}'`, L); }
        const M = methods(o, n.name, L); if (M) return { py: 'fn', name: n.name, f: M }; if (typeof o === 'string' && STRM[n.name]) return { py: 'fn', name: n.name, f: (...x) => STRM[n.name](o, ...x) }; throw new PyError('AttributeError', `'${pyType(o)}' object has no attribute '${n.name}'`, L); }
      case 'call': {
        const f = yield* ev(n.f, L); const args = []; for (const x of n.args) args.push(yield* ev(x, L));
        if (f && f.py === 'class') { const obj = new PyObj(f); const init = findMethod(f, '__init__'); const kw = {}; for (const [k, x] of Object.entries(n.kw || {})) kw[k] = yield* ev(x, L);
          if (init) { const r = yield* callDef(init, [obj, ...args], L, kw); if (r !== null && r !== undefined) throw new PyError('TypeError', `__init__() should return None, not '${pyType(r)}'`, L); } else if (args.length) throw new PyError('TypeError', `${f.name}() takes no arguments`, L);
          return obj; }
        if (f && f.py === 'superfn') { const fr = st.frames[st.frames.length - 1]; if (!fr?.cls || !fr.vars.self) throw new PyError('RuntimeError', 'super(): no arguments', L); return { py: 'super', cls: fr.cls, obj: fr.vars.self }; }
        if (!f || f.py !== 'fn') throw new PyError('TypeError', `'${pyType(f)}' object is not callable`, L);
        if (f.def && f.self) { const kw = {}; for (const [k, x] of Object.entries(n.kw || {})) kw[k] = yield* ev(x, L); return yield* callDef(f.def, [f.self, ...args], L, kw); }
        if (f.def) { const kw = {}; for (const [k, x] of Object.entries(n.kw || {})) kw[k] = yield* ev(x, L); return yield* callDef(f.def, args, L, kw); }
        if (n.kw && Object.keys(n.kw).length) { const kw = {}; for (const [k, x] of Object.entries(n.kw)) kw[k] = yield* ev(x, L); args.push({ kwargs: kw }); }
        try { return f.f(...args); } catch (e) { if (e instanceof PyError && e.line == null) e.line = L; throw e; }
      }
      default: throw new PyError('SyntaxError', 'invalid syntax', L);
    }
  }
  function* callDef(d, args, L, kw = {}) {
    if (st.frames.length > 200) throw new PyError('RecursionError', 'maximum recursion depth exceeded', L, 'Fungsi memanggil dirinya terlalu dalam tanpa berhenti.');
    const nm = d.qual || d.name; const np = d.params.length; const plural = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
    if (args.length > np) { const need = np - Object.keys(d.defaults || {}).length; throw new PyError('TypeError', `${nm}() takes ${need === np ? '' : `from ${need} to `}${plural(np, 'positional argument').replace(/^\d+ /, `${np} `)} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`, L, `Fungsi ${d.name} hanya menerima ${np} masukan.`); }
    for (const k of Object.keys(kw)) if (!d.params.includes(k)) throw new PyError('TypeError', `${nm}() got an unexpected keyword argument '${k}'`, L);
    const vars = {}; const missing = [];
    for (let i = 0; i < np; i++) { const p = d.params[i]; if (i < args.length) vars[p] = args[i]; else if (p in kw) vars[p] = kw[p]; else if (d.defaults && p in d.defaults) vars[p] = yield* ev(d.defaults[p], L); else missing.push(p); }
    if (missing.length) throw new PyError('TypeError', `${nm}() missing ${plural(missing.length, 'required positional argument')}: ${missing.map((x) => `'${x}'`).join(missing.length === 2 ? ' and ' : ', ')}`, L, 'Ada masukan fungsi yang belum diberikan.');
    st.frames.push({ name: nm, vars, locals: d.locals, globals: d.globals, cls: d.cls || null });
    try { const sig = yield* block(d.body); return sig && 'ret' in sig ? sig.ret : null; } finally { st.frames.pop(); }
  }
  function* assign(target, v, L) {
    if (target.t === 'unpack') { const ns = target.names; const vs = typeof v === 'string' ? [...v] : v instanceof PyDict ? [...v.keys()] : v; if (!Array.isArray(vs)) throw new PyError('TypeError', `cannot unpack non-iterable ${pyType(v)} object`, L); if (vs.length > ns.length) throw new PyError('ValueError', `too many values to unpack (expected ${ns.length})`, L); if (vs.length < ns.length) throw new PyError('ValueError', `not enough values to unpack (expected ${ns.length}, got ${vs.length})`, L); for (let k = 0; k < ns.length; k++) yield* assign({ t: 'var', name: ns[k] }, vs[k], L); return; }
    if (target.t === 'var') { const f = st.frames[st.frames.length - 1]; (f?.globals?.has(target.name) ? st.vars : scope())[target.name] = v; return; }
    if (target.t === 'attr') { const o = yield* ev(target.o, L); if (o instanceof PyObj) { o.attrs[target.name] = v; return; } if (o && o.py === 'class') { o.attrs[target.name] = v; return; } throw new PyError('AttributeError', `'${pyType(o)}' object has no attribute '${target.name}'`, L); }
    if (target.t === 'idx') { const a = yield* ev(target.a, L); const i = yield* ev(target.i, L); if (a instanceof PyDict) { a.set(i, v); return; } if (isTup(a)) throw new PyError('TypeError', "'tuple' object does not support item assignment", L); if (i < 0 || i >= a.length) throw new PyError('IndexError', 'list assignment index out of range', L); a[i] = v; return; }
    throw new PyError('SyntaxError', 'cannot assign to expression', L);
  }
  function* block(body) { for (const s of body) { const sig = yield* exec(s); if (sig) return sig; } return null; }
  function* exec(s) {
    const L = s.line;
    switch (s.t) {
      case 'set': { const v = yield* ev(s.e, L); yield* assign(s.target, v, L); tick(L); yield { line: L, note: `${s.target.t === 'var' ? s.target.name : s.target.t === 'unpack' ? s.target.names.join(', ') : 'elemen'} = ${pyRepr(v, true)}` }; return null; }
      case 'aug': { const cur = yield* ev(s.target, L); const v = bin(s.op, cur, yield* ev(s.e, L), L); yield* assign(s.target, v, L); tick(L); yield { line: L, note: `= ${pyRepr(v, true)}` }; return null; }
      case 'expr': { const v = yield* ev(s.e, L); tick(L); yield { line: L, note: s.e.t === 'call' ? `${s.e.f.name ?? 'fungsi'}()` : v && v.py === 'fn' ? `${v.name} tidak dipanggil (tanpa tanda kurung)` : '' }; return null; }
      case 'pass': tick(L); yield { line: L, note: 'pass' }; return null;
      case 'import': { const mod = MODS[s.name]; if (!mod) throw new PyError('ModuleNotFoundError', `No module named '${s.name}'`, L, 'Modul itu tidak tersedia di layar ini.'); scope()[s.name] = { py: 'mod', name: s.name, f: mod }; tick(L); yield { line: L, note: `modul ${s.name} siap dipakai` }; return null; }
      case 'assert': { const c = truthy(yield* ev(s.c, L)); tick(L); if (!c) { const msg = s.msg ? pyRepr(yield* ev(s.msg, L)) : ''; throw new PyError('AssertionError', msg, L, 'Kondisi uji bernilai False.'); } yield { line: L, note: 'assert lulus' }; return null; }
      case 'global': tick(L); yield { line: L, note: `${s.names.join(', ')} memakai variabel global` }; return null;
      case 'break': tick(L); yield { line: L, note: 'break' }; return { brk: true };
      case 'continue': tick(L); yield { line: L, note: 'continue' }; return { cont: true };
      case 'ret': { const v = s.e ? yield* ev(s.e, L) : null; tick(L); yield { line: L, note: `return ${pyRepr(v, true)}` }; return { ret: v }; }
      case 'class': { const base = s.base ? look(s.base, L) : null; if (s.base && (!base || base.py !== 'class')) throw new PyError('TypeError', 'base must be a class', L); const cls = { py: 'class', name: s.name, base, methods: {}, attrs: {} };
        for (const x of s.body) { if (x.t === 'def') cls.methods[x.name] = { ...x, qual: `${s.name}.${x.name}`, cls }; else if (x.t === 'set' && x.target.t === 'var') cls.attrs[x.target.name] = yield* ev(x.e, x.line); }
        scope()[s.name] = cls; tick(L); yield { line: L, note: `kelas ${s.name} dibuat` }; return null; }
      case 'from': { const mod = MODS[s.mod]; if (!mod) throw new PyError('ModuleNotFoundError', `No module named '${s.mod}'`, L, 'Modul itu tidak tersedia di layar ini.'); for (const nmx of s.names) { if (!mod[nmx]) throw new PyError('ImportError', `cannot import name '${nmx}' from '${s.mod}'`, L); scope()[nmx] = { py: 'fn', name: nmx, f: mod[nmx] }; } tick(L); yield { line: L, note: `${s.names.join(', ')} dari ${s.mod} siap dipakai` }; return null; }
      case 'def': st.vars[s.name] = { py: 'fn', name: s.name, def: s }; tick(L); yield { line: L, note: `fungsi ${s.name} dibuat` }; return null;
      case 'if': { const c = truthy(yield* ev(s.c, L)); tick(L); yield { line: L, note: `syarat → ${c ? 'True' : 'False'}`, cond: c }; if (c) return yield* block(s.body); if (s.else) return yield* block(s.else); return null; }
      case 'while': { for (let rounds = 0; ; rounds++) { const c = truthy(yield* ev(s.c, L)); tick(L); if (c && loopLimit && rounds >= loopLimit) throw new PyError('Batas', `Perulangan tidak berhenti: sudah ${loopLimit} putaran dan syaratnya masih True.`, L, 'batas'); yield { line: L, note: `syarat → ${c ? 'True' : 'False'}`, cond: c }; if (!c) return null; const sig = yield* block(s.body); if (sig?.brk) return null; if (sig && !sig.cont) return sig; } }
      case 'for': { const it = yield* ev(s.it, L); const list = typeof it === 'string' ? [...it] : it instanceof PyDict ? [...it.keys()] : it instanceof PySet ? it.items() : it; if (!Array.isArray(list)) throw new PyError('TypeError', `'${pyType(it)}' object is not iterable`, L); for (const x of list) { if (s.v.includes(',')) yield* assign({ t: 'unpack', names: s.v.split(',').map((q) => q.trim()) }, x, L); else scope()[s.v] = x; tick(L); yield { line: L, note: `${s.v} = ${pyRepr(x, true)}` }; const sig = yield* block(s.body); if (sig?.brk) return null; if (sig && !sig.cont) return sig; } return null; }
      default: return null;
    }
  }
  function* main() {
    if (parseErr) { st.error = parseErr; return; }
    try { yield* block(prog); st.done = true; } catch (e) { if (!(e instanceof PyError)) throw e; st.error = e; }
  }
  return { gen: main(), state: st };
}
export function runPy(lines, opts = {}) {
  const r = makePyRunner(lines, opts); let g; const trace = [];
  do { g = r.gen.next(); if (!g.done) trace.push({ ...g.value, vars: { ...r.state.vars } }); } while (!g.done);
  return { ...r.state, trace };
}
