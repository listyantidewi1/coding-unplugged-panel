// A small interpreter for the Indonesian pseudocode used in the SMP coding
// worksheets (smp-27 onward). Programs run one line at a time as a generator,
// so the screen can show the current line, the variables and the output.
// Arrays and text are indexed from 1, as in the worksheets. A step limit
// turns a loop that never ends into a clear message instead of a frozen tab.
//
//   x ← e · a[i] ← e · TAMPILKAN e, … · PINDAH BARIS · BACA a, b · TUNGGU …
//   JIKA c MAKA / SELAIN ITU JIKA c MAKA / SELAIN ITU · SELAMA c
//   UNTUK v DARI a SAMPAI b · UNTUK v DARI a TURUN SAMPAI b · UNTUK SETIAP v DALAM e
//   ULANGI n KALI · FUNGSI f(p) / PROSEDUR f(p) · KEMBALIKAN e · f(args)
//   + − × / MOD DIV · = ≠ < > ≤ ≥ · DAN ATAU TIDAK · "teks" · BENAR SALAH · e ada di e

export class PseudoError extends Error {
  constructor(message, line = null, kind = 'galat') { super(message); this.line = line; this.kind = kind; }
}

// ---------- numbers and values ----------
export function fmt(v, { quote = false } = {}) {
  if (v === undefined) return '';
  if (v === true) return 'BENAR';
  if (v === false) return 'SALAH';
  if (Array.isArray(v)) return `[${v.map((x) => fmt(x, { quote: true })).join(', ')}]`;
  if (typeof v === 'string') return quote ? `"${v}"` : v;
  if (typeof v === 'number') {
    // Programs print plain numbers (8000, not 8.000) with a decimal comma.
    if (Number.isInteger(v)) return String(v).replace('-', '−');
    const r = Math.round(v * 100) / 100;
    const s = String(r).replace('.', ',').replace('-', '−');
    return Math.abs(r - v) > 1e-9 ? `${s}…` : s;
  }
  return String(v);
}
export const typeOf = (v) => (typeof v === 'boolean' ? 'benar/salah' : typeof v === 'string' ? 'teks' : Array.isArray(v) ? 'larik' : Number.isInteger(v) ? 'bulat' : 'desimal');

// ---------- tokenizer ----------
const OPS = ['←', '<-', '≠', '≤', '≥', '<=', '>=', '<>', '×', '*', '/', '+', '−', '-', '=', '<', '>', '(', ')', '[', ']', ','];
export function tokenize(src, line = null) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"' || c === '“') { let j = i + 1; while (j < src.length && src[j] !== '"' && src[j] !== '”') j++; if (j >= src.length) throw new PseudoError('Tanda petik penutup teks hilang.', line); t.push({ k: 'str', v: src.slice(i + 1, j) }); i = j + 1; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < src.length && /[0-9]/.test(src[j])) j++; if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { j++; while (j < src.length && /[0-9]/.test(src[j])) j++; } t.push({ k: 'num', v: Number(src.slice(i, j)) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; t.push({ k: 'id', v: src.slice(i, j) }); i = j; continue; }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new PseudoError(`Tanda "${c}" tidak dikenal.`, line);
    const norm = { '<-': '←', '<=': '≤', '>=': '≥', '<>': '≠', '*': '×', '-': '−' }[op] || op;
    t.push({ k: 'op', v: norm }); i += op.length;
  }
  return t;
}

// ---------- expression parser (Pratt) ----------
const BIN = { ATAU: 1, DAN: 2, '=': 4, '≠': 4, '<': 4, '>': 4, '≤': 4, '≥': 4, ada: 4, '+': 5, '−': 5, '×': 6, '/': 6, MOD: 6, DIV: 6 };
export function parseExpr(tokens, line = null) {
  let p = 0;
  const peek = () => tokens[p]; const next = () => tokens[p++];
  const isOp = (v) => peek() && (peek().k === 'op' || peek().k === 'id') && peek().v === v;
  const expect = (v) => { if (!isOp(v)) throw new PseudoError(`Diharapkan "${v}".`, line); next(); };
  function primary() {
    const tk = next();
    if (!tk) throw new PseudoError('Ekspresi belum lengkap.', line);
    if (tk.k === 'num') return { t: 'num', v: tk.v };
    if (tk.k === 'str') return { t: 'str', v: tk.v };
    if (tk.k === 'op' && tk.v === '(') { const e = expr(0); expect(')'); return { t: 'par', e }; }
    if (tk.k === 'op' && tk.v === '−') return { t: 'neg', e: unaryOperand() };
    if (tk.k === 'op' && tk.v === '[') { const items = []; if (!isOp(']')) { items.push(expr(0)); while (isOp(',')) { next(); items.push(expr(0)); } } expect(']'); return postfix({ t: 'list', items }); }
    if (tk.k === 'id') {
      if (tk.v === 'BENAR') return { t: 'bool', v: true };
      if (tk.v === 'SALAH') return { t: 'bool', v: false };
      if (tk.v === 'TIDAK') return { t: 'not', e: unaryOperand() };
      let node = { t: 'var', name: tk.v };
      if (isOp('(')) { next(); const args = []; if (!isOp(')')) { args.push(expr(0)); while (isOp(',')) { next(); args.push(expr(0)); } } expect(')'); node = { t: 'call', name: tk.v, args }; }
      return postfix(node);
    }
    throw new PseudoError(`Tanda "${tk.v}" tidak bisa dipakai di sini.`, line);
  }
  function unaryOperand() { return primary(); }
  function postfix(node) { while (isOp('[')) { next(); const i = expr(0); expect(']'); node = { t: 'idx', a: node, i }; } return node; }
  function expr(min) {
    let left = primary();
    for (;;) {
      const tk = peek(); if (!tk) break;
      let op = tk.v;
      if (tk.k === 'id' && op === 'ada' && tokens[p + 1]?.v === 'di') op = 'ada';
      else if (!(op in BIN) || (tk.k === 'id' && !['ATAU', 'DAN', 'MOD', 'DIV'].includes(op))) break;
      const prec = BIN[op]; if (prec <= min) break;
      next(); if (op === 'ada') next();
      const right = expr(prec);
      left = { t: 'bin', op, l: left, r: right };
    }
    return left;
  }
  const e = expr(0);
  if (p < tokens.length) throw new PseudoError(`Ada sisa "${tokens[p].v}" yang tidak dimengerti.`, line);
  return e;
}

// Pure evaluation of an expression with no user function calls (for order-of-operations views).
export function evalPure(node, vars = {}) {
  switch (node.t) {
    case 'num': case 'str': case 'bool': case 'val': return node.v;
    case 'par': return evalPure(node.e, vars);
    case 'neg': return -evalPure(node.e, vars);
    case 'not': return !evalPure(node.e, vars);
    case 'var': if (!(node.name in vars)) throw new PseudoError(`Variabel ${node.name} belum punya nilai.`); return vars[node.name];
    case 'bin': return binop(node.op, evalPure(node.l, vars), evalPure(node.r, vars));
    case 'call': return BUILTINS[node.name.toUpperCase()]?.(...node.args.map((a) => evalPure(a, vars)));
    default: throw new PseudoError('Ekspresi tidak bisa dihitung.');
  }
}
function binop(op, a, b, line = null) {
  const num = (x) => { if (typeof x !== 'number') throw new PseudoError(`Operasi ${op} butuh bilangan, tetapi mendapat ${typeOf(x)} ${fmt(x, { quote: true })}.`, line); return x; };
  switch (op) {
    case '+': if (typeof a === 'string' || typeof b === 'string') return fmt(a) + fmt(b); return num(a) + num(b);
    case '−': return num(a) - num(b);
    case '×': return num(a) * num(b);
    case '/': if (num(b) === 0) throw new PseudoError('Pembagian dengan nol.', line); return num(a) / b;
    case 'MOD': return ((num(a) % num(b)) + b) % b;
    case 'DIV': return Math.floor(num(a) / num(b));
    case '=': return eq(a, b);
    case '≠': return !eq(a, b);
    case '<': return a < b; case '>': return a > b; case '≤': return a <= b; case '≥': return a >= b;
    case 'DAN': return !!a && !!b;
    case 'ATAU': return !!a || !!b;
    case 'ada': return Array.isArray(b) ? b.some((x) => eq(x, a)) : String(b).includes(String(a));
    default: throw new PseudoError(`Operasi ${op} tidak dikenal.`, line);
  }
}
const eq = (a, b) => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => eq(x, b[i])) : a === b);

// Expression to text, keeping the brackets the writer typed.
export function exprText(n) {
  switch (n.t) {
    case 'num': return fmt(n.v);
    case 'str': return `"${n.v}"`;
    case 'bool': return n.v ? 'BENAR' : 'SALAH';
    case 'var': return n.name;
    case 'par': return `(${exprText(n.e)})`;
    case 'neg': return `−${exprText(n.e)}`;
    case 'not': return `TIDAK ${exprText(n.e)}`;
    case 'bin': return `${exprText(n.l)} ${n.op === 'ada' ? 'ada di' : n.op} ${exprText(n.r)}`;
    case 'call': return `${n.name}(${n.args.map(exprText).join(', ')})`;
    case 'idx': return `${exprText(n.a)}[${exprText(n.i)}]`;
    case 'val': return fmt(n.v, { quote: true });
    default: return '?';
  }
}
// Order of operations: list of [text before, part computed, value] until one value is left.
export function reduceSteps(src, vars = {}) {
  let node = parseExpr(tokenize(src));
  const steps = [];
  const leaf = (n) => ['num', 'str', 'bool', 'val'].includes(n.t);
  const PREC = { ...BIN, call: 9, neg: 8, not: 3, var: 10 };
  // Rule order: innermost brackets first, then ×, /, MOD, DIV, then + and −, each from left to right.
  function cands(n, path = [], depth = 0, acc = []) {
    if (n.t === 'par') cands(n.e, [...path, 'e'], depth + 1, acc);
    else if (n.t === 'var') acc.push({ path, n, depth, prec: PREC.var });
    else if (n.t === 'neg' || n.t === 'not') { if (leaf(n.e)) acc.push({ path, n, depth, prec: PREC[n.t] }); else cands(n.e, [...path, 'e'], depth, acc); }
    else if (n.t === 'call') { if (n.args.every(leaf)) acc.push({ path, n, depth, prec: PREC.call }); else n.args.forEach((a, i) => cands(a, [...path, 'args', i], depth, acc)); }
    else if (n.t === 'bin') { cands(n.l, [...path, 'l'], depth, acc); if (leaf(n.l) && leaf(n.r)) acc.push({ path, n, depth, prec: BIN[n.op] }); cands(n.r, [...path, 'r'], depth, acc); }
    return acc;
  }
  const set = (root, path, val) => { if (!path.length) return val; const copy = Array.isArray(root) ? [...root] : { ...root }; copy[path[0]] = set(root[path[0]], path.slice(1), val); return copy; };
  const unwrap = (n) => { if (!n || typeof n !== 'object') return n; if (n.t === 'par' && leaf(n.e)) return n.e; const c = Array.isArray(n) ? n.map(unwrap) : { ...n }; if (!Array.isArray(n)) for (const k of ['e', 'l', 'r', 'a', 'i']) if (c[k]) c[k] = unwrap(c[k]); if (c.args) c.args = c.args.map(unwrap); return c; };
  for (let g = 0; g < 60 && !leaf(node); g++) {
    const all = cands(node); if (!all.length) break;
    const f = all.reduce((b, c) => (c.depth > b.depth || (c.depth === b.depth && c.prec > b.prec) ? c : b));
    const v = evalPure(f.n, vars);
    steps.push([markText(set(node, f.path, { t: 'mark', n: f.n })), exprText(f.n), v]);
    node = unwrap(set(node, f.path, { t: 'val', v }));
  }
  return { steps, value: leaf(node) ? node.v : undefined };
}
function markText(n) {
  if (n.t === 'mark') return `⟦${exprText(n.n)}⟧`;
  switch (n.t) {
    case 'par': return `(${markText(n.e)})`;
    case 'neg': return `−${markText(n.e)}`;
    case 'not': return `TIDAK ${markText(n.e)}`;
    case 'bin': return `${markText(n.l)} ${n.op === 'ada' ? 'ada di' : n.op} ${markText(n.r)}`;
    case 'call': return `${n.name}(${n.args.map(markText).join(', ')})`;
    default: return exprText(n);
  }
}

// ---------- built-in functions ----------
const roundHalfUp = (x) => Math.floor(x + 0.5 + 1e-9);
export const BUILTINS = {
  BULATKAN: (x) => roundHalfUp(x),
  BULATKAN_KE_ATAS: (x) => Math.ceil(x - 1e-9),
  BULATKAN_KE_BAWAH: (x) => Math.floor(x + 1e-9),
  PANJANG: (x) => x.length,
  BANYAK: (x) => x.length,
  PISAH: (t, s) => t.split(s).filter((x) => x !== ''),
  KECIL: (t) => t.toLowerCase(),
  BESAR: (t) => t.toUpperCase(),
  POTONG: (t, a, n) => t.slice(a - 1, a - 1 + n),
  TEKS: (x) => fmt(x),
  BILANGAN: (t) => Number(String(t).replace(',', '.')),
  MAKS: (...a) => Math.max(...(Array.isArray(a[0]) ? a[0] : a)),
  MIN: (...a) => Math.min(...(Array.isArray(a[0]) ? a[0] : a)),
  JUMLAH: (a) => a.reduce((s, x) => s + x, 0),
};

// ---------- program parser ----------
const indentOf = (s) => s.match(/^ */)[0].length;
export function parseProgram(lines, { custom = [] } = {}) {
  const items = lines.map((raw, i) => ({ raw, i, ind: indentOf(raw), s: raw.trim() })).filter((x) => x.s && !x.s.startsWith('//'));
  let p = 0;
  function block(ind) {
    const out = [];
    while (p < items.length && items[p].ind >= ind) {
      if (items[p].ind > ind && out.length === 0) ind = items[p].ind;
      if (items[p].ind !== ind) throw new PseudoError('Indentasi tidak rata.', items[p].i);
      out.push(stmt(ind));
    }
    return out;
  }
  const inner = (ind) => (p < items.length && items[p].ind > ind ? block(items[p].ind) : []);
  const E = (s, line) => parseExpr(tokenize(s, line), line);
  function stmt(ind) {
    const it = items[p++]; const s = it.s; const line = it.i; let m;
    for (const c of custom) { const mm = s.match(c.re); if (mm) return { t: 'custom', line, run: c.run, m: mm, body: inner(ind) }; }
    if ((m = s.match(/^JIKA (.+) MAKA$/))) {
      const arms = [{ cond: E(m[1], line), line, body: inner(ind) }]; let els = null; let elsLine = null;
      while (p < items.length && items[p].ind === ind && /^SELAIN ITU/.test(items[p].s)) {
        const e = items[p++]; let mm;
        if ((mm = e.s.match(/^SELAIN ITU JIKA (.+) MAKA$/))) arms.push({ cond: E(mm[1], e.i), line: e.i, body: inner(ind) });
        else if (e.s === 'SELAIN ITU') { els = inner(ind); elsLine = e.i; break; }
        else throw new PseudoError('Baris SELAIN ITU tidak lengkap.', e.i);
      }
      return { t: 'if', line, arms, els, elsLine };
    }
    if ((m = s.match(/^SELAMA (.+)$/))) return { t: 'while', line, cond: E(m[1], line), body: inner(ind) };
    if ((m = s.match(/^UNTUK SETIAP ([A-Za-z_]\w*) DALAM (.+)$/))) return { t: 'each', line, v: m[1], list: E(m[2], line), body: inner(ind) };
    if ((m = s.match(/^UNTUK ([A-Za-z_]\w*) DARI (.+?) (TURUN )?SAMPAI (.+)$/))) return { t: 'for', line, v: m[1], from: E(m[2], line), down: !!m[3], to: E(m[4], line), body: inner(ind) };
    if ((m = s.match(/^ULANGI (.+) KALI$/))) return { t: 'repeat', line, n: E(m[1], line), body: inner(ind) };
    if ((m = s.match(/^(FUNGSI|PROSEDUR) ([A-Za-z_]\w*)\((.*)\)$/))) return { t: 'def', line, name: m[2], params: m[3].split(',').map((x) => x.trim()).filter(Boolean), body: inner(ind) };
    if ((m = s.match(/^KEMBALIKAN(?: (.+))?$/))) return { t: 'ret', line, e: m[1] ? E(m[1], line) : null };
    if ((m = s.match(/^TAMPILKAN (.+)$/))) return { t: 'show', line, items: splitArgs(m[1]).map((a) => E(a, line)) };
    if (s === 'PINDAH BARIS') return { t: 'nl', line };
    if ((m = s.match(/^BACA (.+)$/))) return { t: 'read', line, names: m[1].split(',').map((x) => x.trim()) };
    if ((m = s.match(/^TUNGGU(.*)$/))) return { t: 'wait', line, what: m[1].trim() };
    if ((m = s.match(/^(.+?)\s*(←|<-)\s*larik (\d+) kotak, semua berisi (.+)$/))) return { t: 'set', line, target: E(m[1], line), e: { t: 'fill', n: Number(m[3]), v: E(m[4], line) } };
    if ((m = s.match(/^(.+?)\s*(?:←|<-)\s*(.+)$/))) return { t: 'set', line, target: E(m[1], line), e: E(m[2], line) };
    const e = E(s, line);
    if (e.t === 'call') return { t: 'exprstmt', line, e };
    throw new PseudoError('Baris ini tidak dimengerti.', line);
  }
  const prog = block(items.length ? items[0].ind : 0);
  return prog;
}
function splitArgs(s) {
  const out = []; let depth = 0; let q = false; let cur = '';
  for (const c of s) {
    if (c === '"') q = !q;
    if (!q && (c === '(' || c === '[')) depth++;
    if (!q && (c === ')' || c === ']')) depth--;
    if (!q && depth === 0 && c === ',') { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ---------- interpreter ----------
// run(lines, opts) → { gen, state }. Each next() runs up to one line and yields
// { line, note }. state: { vars (global), frames, out, rows, steps }.
export function makeRunner(lines, { vars = {}, input = {}, builtins = {}, limit = 2000, custom = [] } = {}) {
  const prog = parseProgram(lines, { custom });
  const usesRows = prog && JSON.stringify(prog, (k, v) => (typeof v === 'function' ? undefined : v)).includes('"t":"nl"');
  const st = { vars: { ...clone(vars) }, frames: [], funcs: {}, out: [], row: [], steps: 0, done: false, error: null, calls: [], current: null };
  const B = { ...BUILTINS, ...builtins };
  const scope = () => (st.frames.length ? st.frames[st.frames.length - 1].vars : st.vars);
  const look = (name, line) => {
    const sc = scope();
    if (name in sc) return sc[name];
    if (st.frames.length && name in st.vars) return st.vars[name];
    throw new PseudoError(`Variabel ${name} belum punya nilai.`, line);
  };
  function tick(line) { st.steps++; if (st.steps > limit) throw new PseudoError(`Program sudah menjalankan ${limit} langkah dan belum selesai. Mungkin ada perulangan yang tidak pernah berhenti.`, line, 'batas'); }
  function* ev(n, line) {
    switch (n.t) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'par': return yield* ev(n.e, line);
      case 'neg': return -(yield* ev(n.e, line));
      case 'not': return !(yield* ev(n.e, line));
      case 'var': return look(n.name, line);
      case 'list': { const a = []; for (const x of n.items) a.push(yield* ev(x, line)); return a; }
      case 'fill': { const v = yield* ev(n.v, line); return Array.from({ length: n.n }, () => v); }
      case 'idx': {
        const a = yield* ev(n.a, line); const i = yield* ev(n.i, line);
        if (typeof a !== 'string' && !Array.isArray(a)) throw new PseudoError(`${exprText(n.a)} bukan larik atau teks.`, line);
        if (!Number.isInteger(i) || i < 1 || i > a.length) throw new PseudoError(`Indeks ${fmt(i)} di luar batas larik ${exprText(n.a)} (1 sampai ${a.length}).`, line);
        return a[i - 1];
      }
      case 'bin': {
        const a = yield* ev(n.l, line);
        if (n.op === 'DAN' && !a) return false;
        if (n.op === 'ATAU' && a) return true;
        return binop(n.op, a, yield* ev(n.r, line), line);
      }
      case 'call': {
        const args = []; for (const x of n.args) args.push(yield* ev(x, line));
        if (st.funcs[n.name]) return yield* call(st.funcs[n.name], args, line);
        const f = B[n.name] || B[n.name.toUpperCase()];
        if (!f) throw new PseudoError(`Fungsi ${n.name} belum dibuat.`, line);
        return f(...args, st);
      }
      default: throw new PseudoError('Ekspresi tidak bisa dihitung.', line);
    }
  }
  function* call(fn, args, line) {
    if (args.length !== fn.params.length) throw new PseudoError(`${fn.name} butuh ${fn.params.length} masukan, tetapi diberi ${args.length}.`, line);
    if (st.frames.length > 60) throw new PseudoError('Pemanggilan fungsi terlalu dalam. Mungkin tidak ada kasus dasar yang menghentikannya.', line, 'batas');
    const frame = { name: fn.name, args, vars: Object.fromEntries(fn.params.map((p, i) => [p, clone(args[i])])), line };
    st.frames.push(frame); st.calls.push({ name: fn.name, args, depth: st.frames.length, ret: undefined });
    const rec = st.calls[st.calls.length - 1];
    yield { line: fn.line, note: `masuk ${fn.name}(${args.map((a) => fmt(a, { quote: true })).join(', ')})` };
    const sig = yield* block(fn.body);
    st.frames.pop();
    rec.ret = sig?.ret;
    return sig ? sig.ret : undefined;
  }
  function* assign(target, v, line) {
    if (target.t === 'var') { scope()[target.name] = v; return; }
    if (target.t === 'idx') {
      const arr = yield* ev(target.a, line); const i = yield* ev(target.i, line);
      if (!Array.isArray(arr)) throw new PseudoError(`${exprText(target.a)} bukan larik.`, line);
      if (!Number.isInteger(i) || i < 1 || i > arr.length) throw new PseudoError(`Indeks ${fmt(i)} di luar batas larik ${exprText(target.a)} (1 sampai ${arr.length}).`, line);
      arr[i - 1] = v; return;
    }
    throw new PseudoError('Sisi kiri ← harus nama variabel.', line);
  }
  function* block(body) {
    for (const s of body) { const sig = yield* exec(s); if (sig) return sig; }
    return null;
  }
  function* exec(s) {
    const L = s.line; st.current = L;
    switch (s.t) {
      case 'def': st.funcs[s.name] = s; return null;
      case 'set': { const v = yield* ev(s.e, L); yield* assign(s.target, clone(v), L); tick(L); yield { line: L, note: `${exprText(s.target)} ← ${fmt(v, { quote: true })}` }; return null; }
      case 'show': {
        const vals = []; for (const x of s.items) vals.push(yield* ev(x, L));
        const text = vals.map((v) => fmt(v)).join(' ');
        if (usesRows) st.row.push(text); else st.out.push(text);
        tick(L); yield { line: L, note: `tampil: ${text}` }; return null;
      }
      case 'nl': st.out.push(st.row.join(' ')); st.row = []; tick(L); yield { line: L, note: 'pindah baris' }; return null;
      case 'read': for (const n of s.names) { const v = typeof input === 'function' ? input(n, st) : input[n]; if (v === undefined) throw new PseudoError(`Tidak ada masukan untuk ${n}.`, L); scope()[n] = clone(v); } tick(L); yield { line: L, note: `baca ${s.names.join(', ')}` }; return null;
      case 'wait': tick(L); yield { line: L, note: `tunggu ${s.what}`.trim(), wait: true }; return null;
      case 'exprstmt': { yield* ev(s.e, L); tick(L); yield { line: L, note: `selesai ${s.e.name}` }; return null; }
      case 'ret': { const v = s.e ? yield* ev(s.e, L) : undefined; tick(L); yield { line: L, note: `kembalikan ${fmt(v, { quote: true })}` }; return { ret: v }; }
      case 'if': {
        for (const a of s.arms) {
          const c = yield* ev(a.cond, a.line); tick(a.line); yield { line: a.line, note: `${exprText(a.cond)} → ${c ? 'BENAR' : 'SALAH'}`, cond: !!c };
          if (c) return yield* block(a.body);
        }
        if (s.els) { tick(s.elsLine); yield { line: s.elsLine, note: 'selain itu' }; return yield* block(s.els); }
        return null;
      }
      case 'while': for (;;) {
        const c = yield* ev(s.cond, L); tick(L); yield { line: L, note: `${exprText(s.cond)} → ${c ? 'BENAR' : 'SALAH'}`, cond: !!c };
        if (!c) return null;
        const sig = yield* block(s.body); if (sig) return sig;
      }
      case 'for': {
        const a = yield* ev(s.from, L); const b = yield* ev(s.to, L); const d = s.down ? -1 : 1;
        for (let i = a; s.down ? i >= b : i <= b; i += d) {
          scope()[s.v] = i; tick(L); yield { line: L, note: `${s.v} = ${fmt(i)}` };
          const sig = yield* block(s.body); if (sig) return sig;
        }
        return null;
      }
      case 'each': {
        const list = yield* ev(s.list, L);
        for (const x of list) { scope()[s.v] = x; tick(L); yield { line: L, note: `${s.v} = ${fmt(x, { quote: true })}` }; const sig = yield* block(s.body); if (sig) return sig; }
        return null;
      }
      case 'repeat': {
        const n = yield* ev(s.n, L);
        for (let i = 1; i <= n; i++) { tick(L); yield { line: L, note: `putaran ${i} dari ${n}` }; const sig = yield* block(s.body); if (sig) return sig; }
        return null;
      }
      case 'custom': { const r = yield* s.run(s.m, { st, ev: (src) => ev(parseExpr(tokenize(src, L), L), L), assign: (src, v) => assign(parseExpr(tokenize(src, L), L), v, L), line: L, block: () => block(s.body), scope }); tick(L); yield { line: L, note: r || '' }; return null; }
      default: return null;
    }
  }
  function* main() {
    try { yield* block(prog); if (st.row.length) { st.out.push(st.row.join(' ')); st.row = []; } st.done = true; }
    catch (e) { if (!(e instanceof PseudoError)) throw e; if (e.line === null) e.line = st.current; st.error = e; }
  }
  return { gen: main(), state: st, prog };
}
const clone = (v) => (Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);

// Run to the end; returns the final state.
export function runAll(lines, opts = {}) {
  const r = makeRunner(lines, opts); let g; const trace = [];
  do { g = r.gen.next(); if (!g.done) trace.push({ ...g.value, vars: { ...flat(r.state) } }); } while (!g.done);
  return { ...r.state, trace };
}
export const flat = (st) => (st.frames.length ? { ...st.vars, ...st.frames[st.frames.length - 1].vars } : st.vars);
// Worksheet listings carry line numbers in a fixed-width column ("1  x ← 1",
// "10 y ← 2"); strip that column and keep the indentation after it.
export function unnumber(src) {
  const lines = src.replace(/^\n+|\s+$/g, '').split('\n');
  const w = (lines[0].match(/^\d+\s+/) || [''])[0].length;
  return lines.map((l) => l.slice(w));
}
