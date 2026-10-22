// A tiny SQL interpreter that runs in the browser, for sma-34. It understands
// SELECT (columns, *, aliases, COUNT/SUM/AVG/MIN/MAX, JOIN … ON, WHERE,
// GROUP BY, HAVING, ORDER BY, LIMIT), INSERT, UPDATE and DELETE on a small
// in-memory database, with primary and foreign key checks and Indonesian errors.

export class SqlError extends Error {}
const fail = (m) => { throw new SqlError(m); };

const KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'AS', 'AND', 'OR', 'NOT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'NULL', 'IS', 'LIKE', 'DISTINCT']);
const AGG = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);

export function tokenize(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '-' && src[i + 1] === '-') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === "'") { let j = i + 1; let s = ''; for (;;) { if (j >= src.length) fail('Tanda petik penutup \' tidak ditemukan.'); if (src[j] === "'") { if (src[j + 1] === "'") { s += "'"; j += 2; continue; } break; } s += src[j++]; } out.push({ t: 'str', v: s }); i = j + 1; continue; }
    if (c === '"' || c === '‘' || c === '’' || c === '“' || c === '”') fail(`Pakai tanda petik tunggal ' untuk teks, bukan ${c}.`);
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; const raw = src.slice(i, j); if ((raw.match(/\./g) || []).length > 1 || /^\d{1,3}\.\d{3}$/.test(raw)) fail(`Angka "${raw}" tidak dikenal. Di SQL, angka ditulis tanpa titik ribuan, misalnya 20000.`); out.push({ t: 'num', v: Number(raw) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); const U = w.toUpperCase(); out.push(KEYWORDS.has(U) || AGG.has(U) ? { t: 'kw', v: U, raw: w } : { t: 'id', v: w.toLowerCase(), raw: w }); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '<>', '!='].includes(two)) { out.push({ t: 'op', v: two === '!=' ? '<>' : two }); i += 2; continue; }
    if ('=<>,()*.;+-/'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    fail(`Tanda "${c}" tidak dikenal.`);
  }
  return out;
}

function parser(tokens) {
  let p = 0;
  const peek = (k = 0) => tokens[p + k];
  const isKw = (v, k = 0) => peek(k)?.t === 'kw' && peek(k).v === v;
  const isOp = (v) => peek()?.t === 'op' && peek().v === v;
  const eatKw = (v) => { if (!isKw(v)) fail(`Seharusnya ada ${v} ${peek() ? `sebelum "${peek().raw ?? peek().v}"` : 'di akhir kueri'}.`); p++; };
  const eatOp = (v) => { if (!isOp(v)) fail(`Seharusnya ada "${v}" ${peek() ? `sebelum "${peek().raw ?? peek().v}"` : 'di akhir kueri'}.`); p++; };
  const ident = (what) => { const t = peek(); if (t?.t !== 'id') fail(`Seharusnya ada nama ${what}${t ? ` sebelum "${t.raw ?? t.v}"` : ''}.`); p++; return t.v; };

  function expr() { return or(); }
  function or() { let a = and(); while (isKw('OR')) { p++; a = { k: 'bin', op: 'OR', a, b: and() }; } return a; }
  function and() { let a = not(); while (isKw('AND')) { p++; a = { k: 'bin', op: 'AND', a, b: not() }; } return a; }
  function not() { if (isKw('NOT')) { p++; return { k: 'not', a: not() }; } return cmp(); }
  function cmp() {
    const a = add();
    if (peek()?.t === 'op' && ['=', '<', '>', '<=', '>=', '<>'].includes(peek().v)) { const op = tokens[p++].v; return { k: 'bin', op, a, b: add() }; }
    if (isKw('IS')) { p++; const neg = isKw('NOT') ? (p++, true) : false; eatKw('NULL'); return { k: 'isnull', a, neg }; }
    if (isKw('LIKE')) { p++; return { k: 'bin', op: 'LIKE', a, b: add() }; }
    return a;
  }
  function add() { let a = mul(); while (isOp('+') || isOp('-')) { const op = tokens[p++].v; a = { k: 'bin', op, a, b: mul() }; } return a; }
  function mul() { let a = unary(); while (isOp('*') || isOp('/')) { const op = tokens[p++].v; a = { k: 'bin', op, a, b: unary() }; } return a; }
  function unary() { if (isOp('-')) { p++; return { k: 'bin', op: '-', a: { k: 'lit', v: 0 }, b: unary() }; } return prim(); }
  function prim() {
    const t = peek();
    if (!t) fail('Kueri berakhir terlalu cepat.');
    if (t.t === 'num' || t.t === 'str') { p++; return { k: 'lit', v: t.v }; }
    if (t.t === 'kw' && t.v === 'NULL') { p++; return { k: 'lit', v: null }; }
    if (t.t === 'kw' && AGG.has(t.v)) {
      p++; eatOp('(');
      let arg = null; let distinct = false;
      if (isOp('*')) { if (t.v !== 'COUNT') fail(`${t.v}(*) tidak bisa dipakai; tulis nama kolomnya.`); p++; } else { if (isKw('DISTINCT')) { p++; distinct = true; } arg = expr(); }
      eatOp(')');
      return { k: 'agg', fn: t.v, arg, distinct };
    }
    if (t.t === 'op' && t.v === '(') { p++; const e = expr(); eatOp(')'); return e; }
    if (t.t === 'id') {
      p++;
      if (isOp('.')) { p++; const col = ident('kolom'); return { k: 'col', table: t.v, col }; }
      if (isOp('(')) fail(`Fungsi ${t.raw} tidak dikenal. Yang bisa dipakai: COUNT, SUM, AVG, MIN, MAX.`);
      return { k: 'col', table: null, col: t.v };
    }
    fail(`"${t.raw ?? t.v}" tidak diharapkan di sini.`);
  }

  function select() {
    eatKw('SELECT');
    const distinct = isKw('DISTINCT') ? (p++, true) : false;
    const cols = [];
    do {
      if (isOp('*')) { p++; cols.push({ star: true }); continue; }
      const start = p; const e = expr(); const end = p; let alias = null;
      if (isKw('AS')) { p++; alias = ident('alias'); } else if (peek()?.t === 'id') alias = ident('alias');
      cols.push({ e, alias, text: textOf(tokens.slice(start, end)) });
    } while (isOp(',') && ++p);
    eatKw('FROM');
    const from = [{ table: ident('tabel'), on: null }];
    while (isKw('JOIN') || isKw('INNER')) { if (isKw('INNER')) p++; eatKw('JOIN'); const table = ident('tabel'); eatKw('ON'); from.push({ table, on: expr() }); }
    const q = { k: 'select', distinct, cols, from, where: null, group: [], having: null, order: [], limit: null };
    if (isKw('WHERE')) { p++; q.where = expr(); }
    if (isKw('GROUP')) { p++; eatKw('BY'); do q.group.push(expr()); while (isOp(',') && ++p); }
    if (isKw('HAVING')) { p++; q.having = expr(); }
    if (isKw('ORDER')) { p++; eatKw('BY'); do { const e = expr(); let desc = false; if (isKw('DESC')) { p++; desc = true; } else if (isKw('ASC')) p++; q.order.push({ e, desc }); } while (isOp(',') && ++p); }
    if (isKw('LIMIT')) { p++; const t = tokens[p++]; if (t?.t !== 'num') fail('LIMIT harus diikuti angka.'); q.limit = t.v; }
    return q;
  }
  function insert() {
    eatKw('INSERT'); eatKw('INTO'); const table = ident('tabel'); let cols = null;
    if (isOp('(')) { p++; cols = []; do cols.push(ident('kolom')); while (isOp(',') && ++p); eatOp(')'); }
    eatKw('VALUES'); const rows = [];
    do { eatOp('('); const r = []; do r.push(expr()); while (isOp(',') && ++p); eatOp(')'); rows.push(r); } while (isOp(',') && ++p);
    return { k: 'insert', table, cols, rows };
  }
  function update() {
    eatKw('UPDATE'); const table = ident('tabel'); eatKw('SET'); const sets = [];
    do { const col = ident('kolom'); eatOp('='); sets.push([col, expr()]); } while (isOp(',') && ++p);
    let where = null; if (isKw('WHERE')) { p++; where = expr(); }
    return { k: 'update', table, sets, where };
  }
  function del() { eatKw('DELETE'); eatKw('FROM'); const table = ident('tabel'); let where = null; if (isKw('WHERE')) { p++; where = expr(); } return { k: 'delete', table, where }; }
  function statement() {
    if (isKw('SELECT')) return select();
    if (isKw('INSERT')) return insert();
    if (isKw('UPDATE')) return update();
    if (isKw('DELETE')) return del();
    fail(`Kueri harus diawali SELECT, INSERT, UPDATE, atau DELETE${peek() ? `, bukan "${peek().raw ?? peek().v}"` : ''}.`);
  }
  const stmts = [];
  while (p < tokens.length) {
    if (isOp(';')) { p++; continue; }
    stmts.push(statement());
    if (p < tokens.length && !isOp(';')) fail(`Ada yang tersisa setelah kueri: "${peek().raw ?? peek().v}". Lupa tanda koma atau titik koma?`);
  }
  return stmts;
}
function textOf(ts) {
  let out = '';
  ts.forEach((t, i) => {
    const s = t.t === 'str' ? `'${t.v}'` : t.t === 'op' ? t.v : (t.raw ?? String(t.v));
    const prev = ts[i - 1];
    const tight = !prev || [',', ')', '.', '('].includes(t.v) && t.t === 'op' || (prev.t === 'op' && ['(', '.'].includes(prev.v));
    out += (tight ? '' : ' ') + s;
    if (t.t === 'op' && t.v === ',') out += '';
  });
  return out.replace(/,(?! )/g, ', ');
}

// --- database ---
export function makeDb(schema) {
  // schema: { name: { cols: [...], pk: 'col', fk: { col: 'table' }, rows: [[...]] } }
  const fresh = () => Object.fromEntries(Object.entries(schema).map(([n, s]) => [n, { ...s, rows: s.rows.map((r) => Object.fromEntries(s.cols.map((c, i) => [c, r[i]]))) }]));
  let T = fresh();
  return { tables: () => T, reset: () => { T = fresh(); }, run: (sql) => run(T, sql) };
}

function truthy(v) { return v !== null && v !== undefined && v !== false && v !== 0; }
function compare(a, b) { if (a === null || b === null) return null; if (typeof a === 'number' && typeof b === 'number') return a - b; return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0; }
function evalExpr(e, ctx) {
  switch (e.k) {
    case 'lit': return e.v;
    case 'col': return ctx.col(e);
    case 'agg': return ctx.agg(e);
    case 'not': { const v = evalExpr(e.a, ctx); return v === null ? null : !truthy(v); }
    case 'isnull': { const v = evalExpr(e.a, ctx); return e.neg ? v !== null : v === null; }
    case 'bin': {
      if (e.op === 'AND') return truthy(evalExpr(e.a, ctx)) && truthy(evalExpr(e.b, ctx));
      if (e.op === 'OR') return truthy(evalExpr(e.a, ctx)) || truthy(evalExpr(e.b, ctx));
      const a = evalExpr(e.a, ctx); const b = evalExpr(e.b, ctx);
      if (['+', '-', '*', '/'].includes(e.op)) {
        if (a === null || b === null) return null;
        if (typeof a !== 'number' || typeof b !== 'number') fail(`Operasi ${e.op} hanya untuk angka, bukan teks.`);
        if (e.op === '/' && b === 0) return null;
        return e.op === '+' ? a + b : e.op === '-' ? a - b : e.op === '*' ? a * b : a / b;
      }
      if (e.op === 'LIKE') { if (a === null || b === null) return null; const re = new RegExp(`^${String(b).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i'); return re.test(String(a)); }
      const c = compare(a, b); if (c === null) return null;
      return { '=': c === 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0, '<>': c !== 0 }[e.op];
    }
    default: fail('Ekspresi tidak dikenal.');
  }
}
const hasAgg = (e) => !!e && (e.k === 'agg' || (e.a && hasAgg(e.a)) || (e.b && hasAgg(e.b)));

// Resolve a column reference against the tables in FROM/JOIN.
function resolver(T, used) {
  return (ref) => {
    if (ref.table) {
      if (!used.includes(ref.table)) fail(T[ref.table] ? `Tabel ${ref.table} belum digabungkan. Tambahkan JOIN ${ref.table} ON …` : `Tabel ${ref.table} tidak ada.`);
      if (!T[ref.table].cols.includes(ref.col)) fail(`Kolom ${ref.col} tidak ada di tabel ${ref.table}.`);
      return `${ref.table}.${ref.col}`;
    }
    const hits = used.filter((t) => T[t].cols.includes(ref.col));
    if (!hits.length) {
      const elsewhere = Object.keys(T).filter((t) => T[t].cols.includes(ref.col));
      fail(`Kolom ${ref.col} tidak ada di tabel ${used.join(' atau ')}.${elsewhere.length ? ` Kolom itu ada di tabel ${elsewhere.join(', ')}: gabungkan dulu dengan JOIN.` : ''}`);
    }
    if (hits.length > 1) fail(`Kolom ${ref.col} ada di tabel ${hits.join(' dan ')}. Tulis lengkap, misalnya ${hits[0]}.${ref.col}.`);
    return `${hits[0]}.${ref.col}`;
  };
}
function walk(e, f) { if (!e) return; f(e); if (e.a) walk(e.a, f); if (e.b) walk(e.b, f); if (e.arg) walk(e.arg, f); }

function runSelect(T, q) {
  const used = q.from.map((f) => { if (!T[f.table]) fail(`Tabel ${f.table} tidak ada. Tabel yang ada: ${Object.keys(T).join(', ')}.`); return f.table; });
  if (new Set(used).size !== used.length) fail('Tabel yang sama digabungkan dua kali.');
  const res = resolver(T, used);
  const aliases = q.cols.filter((c) => c.alias).map((c) => c.alias);
  // Check every column reference now, so errors show even when no rows match.
  const check = (e, allowAlias) => walk(e, (n) => { if (n.k === 'col' && !(allowAlias && !n.table && aliases.includes(n.col))) n.key = res(n); });
  for (const c of q.cols) if (!c.star) { check(c.e, false); }
  q.from.forEach((f) => check(f.on, false));
  if (q.where) { if (hasAgg(q.where)) fail('SUM atau COUNT tidak bisa dipakai di WHERE. Pakai HAVING setelah GROUP BY.'); check(q.where, false); }
  q.group.forEach((g) => check(g, true)); check(q.having, true); q.order.forEach((o) => check(o.e, true));
  // FROM and JOIN
  let rows = T[used[0]].rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [`${used[0]}.${k}`, v])));
  q.from.slice(1).forEach((f) => {
    const next = [];
    for (const a of rows) for (const r of T[f.table].rows) { const row = { ...a, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [`${f.table}.${k}`, v])) }; if (truthy(evalExpr(f.on, { col: (n) => row[n.key], agg: () => fail('SUM atau COUNT tidak bisa dipakai di ON.') }))) next.push(row); }
    rows = next;
  });
  const steps = [{ label: q.from.length > 1 ? 'GABUNG' : 'FROM', rows: rows.length }];
  if (q.where) { rows = rows.filter((row) => truthy(evalExpr(q.where, { col: (n) => row[n.key], agg: () => null }))); steps.push({ label: 'SARING', rows: rows.length }); }
  const star = q.cols.some((c) => c.star);
  const grouped = q.group.length > 0 || q.cols.some((c) => !c.star && hasAgg(c.e)) || hasAgg(q.having);
  if (star && grouped) fail('SELECT * tidak bisa dipakai bersama GROUP BY atau SUM/COUNT.');
  const dup = (c) => used.filter((t) => T[t].cols.includes(c)).length > 1;
  const outCols = star ? used.flatMap((t) => T[t].cols.map((c) => ({ name: dup(c) ? `${t}.${c}` : c, key: `${t}.${c}` }))) : q.cols.map((c) => ({ name: c.alias || (c.e.k === 'col' ? c.e.col : c.text), e: c.e }));
  // Contexts: one per row, or one per group.
  let ctxs;
  const rowCtx = (row) => ({ col: (n) => row[n.key], agg: () => fail('SUM atau COUNT perlu GROUP BY atau dipakai untuk seluruh tabel.'), rows: [row] });
  if (grouped) {
    const groups = new Map();
    for (const row of rows) { const key = JSON.stringify(q.group.map((g) => evalExpr(g, rowCtx(row)))); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
    if (!q.group.length && !groups.size) groups.set('[]', []);
    const ordered = [...groups.entries()].sort((x, y) => { const a = JSON.parse(x[0]); const b = JSON.parse(y[0]); for (let i = 0; i < a.length; i++) { const c = a[i] === null ? -1 : b[i] === null ? 1 : compare(a[i], b[i]); if (c) return c; } return 0; });
    groups.clear(); for (const [k, v] of ordered) groups.set(k, v);
    ctxs = [...groups.values()].map((g) => ({
      rows: g,
      col: (n) => (g.length ? g[0][n.key] : null),
      agg: (n) => {
        if (hasAgg(n.arg)) fail('SUM atau COUNT tidak boleh bersarang.');
        if (!n.arg) return g.length;
        let vals = g.map((row) => evalExpr(n.arg, rowCtx(row))).filter((v) => v !== null);
        if (n.distinct) vals = [...new Set(vals)];
        if (n.fn === 'COUNT') return vals.length;
        if (!vals.length) return null;
        if (n.fn !== 'MIN' && n.fn !== 'MAX' && vals.some((v) => typeof v !== 'number')) fail(`${n.fn} hanya untuk kolom angka.`);
        return n.fn === 'SUM' ? vals.reduce((a, b) => a + b, 0) : n.fn === 'AVG' ? vals.reduce((a, b) => a + b, 0) / vals.length : n.fn === 'MIN' ? vals.reduce((a, b) => (compare(a, b) <= 0 ? a : b)) : vals.reduce((a, b) => (compare(a, b) >= 0 ? a : b));
      },
    }));
    steps.push({ label: 'KELOMPOKKAN', rows: ctxs.length });
  } else ctxs = rows.map(rowCtx);
  // Output values; aliases can be used in HAVING and ORDER BY.
  let out = ctxs.map((c) => {
    const vals = outCols.map((oc) => (oc.key ? c.rows[0][oc.key] : evalExpr(oc.e, c)));
    const byAlias = Object.fromEntries(outCols.map((oc, i) => [oc.name, vals[i]]));
    const ac = { ...c, col: (n) => (!n.table && n.key === undefined && n.col in byAlias ? byAlias[n.col] : c.col(n)) };
    return { vals, ac };
  });
  if (q.having) { out = out.filter((o) => truthy(evalExpr(q.having, o.ac))); steps.push({ label: 'HAVING', rows: out.length }); }
  if (q.order.length) {
    const keyed = out.map((o) => ({ o, keys: q.order.map((ob) => evalExpr(ob.e, o.ac)) }));
    keyed.sort((x, y) => { for (let i = 0; i < q.order.length; i++) { const a = x.keys[i]; const b = y.keys[i]; const c = a === null ? (b === null ? 0 : -1) : b === null ? 1 : compare(a, b); if (c) return q.order[i].desc ? -c : c; } return 0; });
    out = keyed.map((k) => k.o); steps.push({ label: 'URUTKAN', rows: out.length });
  }
  let data = out.map((o) => o.vals);
  if (q.distinct) { const seen = new Set(); data = data.filter((r) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; }); }
  if (q.limit !== null) data = data.slice(0, q.limit);
  steps.push({ label: 'PILIH', rows: data.length });
  return { kind: 'rows', cols: outCols.map((c) => c.name), rows: data, steps };
}

function fkCheck(T, table, row) {
  for (const [col, ref] of Object.entries(T[table].fk || {})) if (row[col] !== null && row[col] !== undefined && !T[ref].rows.some((r) => r[T[ref].pk] === row[col])) fail(`Kunci asing gagal: ${col} = ${row[col]} tidak ada di tabel ${ref}.`);
}
function refCheck(T, table, removed) {
  for (const [name, t] of Object.entries(T)) for (const [col, ref] of Object.entries(t.fk || {})) if (ref === table) { const hit = t.rows.find((r) => removed.some((x) => x[T[table].pk] === r[col])); if (hit) fail(`Tidak bisa: ${T[table].pk} ${hit[col]} masih dipakai di tabel ${name}. Hapus dulu barisnya di ${name}.`); }
}

function run(T, sql) {
  const stmts = parser(tokenize(sql));
  if (!stmts.length) fail('Tulis kueri dulu.');
  const results = [];
  for (const s of stmts) {
    if (s.k !== 'select' && !T[s.table]) fail(`Tabel ${s.table} tidak ada. Tabel yang ada: ${Object.keys(T).join(', ')}.`);
    if (s.k === 'select') results.push(runSelect(T, s));
    else if (s.k === 'insert') {
      const t = T[s.table]; const cols = s.cols || t.cols;
      for (const c of cols) if (!t.cols.includes(c)) fail(`Kolom ${c} tidak ada di tabel ${s.table}.`);
      const added = [];
      for (const r of s.rows) {
        if (r.length !== cols.length) fail(`Banyak nilai (${r.length}) tidak sama dengan banyak kolom (${cols.length}).`);
        const row = Object.fromEntries(t.cols.map((c) => [c, null]));
        cols.forEach((c, i) => { row[c] = evalExpr(r[i], { col: () => fail('VALUES hanya boleh berisi nilai, bukan nama kolom. Teks ditulis di antara tanda petik tunggal.'), agg: () => fail('SUM atau COUNT tidak bisa dipakai di VALUES.') }); });
        if (row[t.pk] === null) fail(`Kunci primer ${t.pk} wajib diisi.`);
        if ([...t.rows, ...added].some((x) => x[t.pk] === row[t.pk])) fail(`Kunci primer ${t.pk} = ${row[t.pk]} sudah ada. Setiap baris harus punya kunci primer yang berbeda.`);
        fkCheck(T, s.table, row); added.push(row);
      }
      t.rows.push(...added); results.push({ kind: 'info', text: `${added.length} baris ditambahkan ke tabel ${s.table}.`, table: s.table });
    } else {
      const t = T[s.table]; const res = resolver(T, [s.table]);
      walk(s.where, (n) => { if (n.k === 'col') n.key = res(n); });
      const hit = t.rows.filter((r) => !s.where || truthy(evalExpr(s.where, { col: (n) => r[n.key.split('.')[1]], agg: () => fail('SUM atau COUNT tidak bisa dipakai di WHERE.') })));
      if (s.k === 'delete') { refCheck(T, s.table, hit); t.rows = t.rows.filter((r) => !hit.includes(r)); results.push({ kind: 'info', text: `${hit.length} baris dihapus dari tabel ${s.table}.${s.where ? '' : ' (Tanpa WHERE, semua baris terhapus!)'}`, table: s.table }); }
      else {
        for (const [c] of s.sets) if (!t.cols.includes(c)) fail(`Kolom ${c} tidak ada di tabel ${s.table}.`);
        for (const [, e] of s.sets) walk(e, (n) => { if (n.k === 'col') n.key = res(n); });
        const next = hit.map((r) => { const n = { ...r }; for (const [c, e] of s.sets) n[c] = evalExpr(e, { col: (x) => r[x.key.split('.')[1]], agg: () => fail('SUM atau COUNT tidak bisa dipakai di SET.') }); return n; });
        for (const n of next) { if (t.rows.some((r) => !hit.includes(r) && r[t.pk] === n[t.pk])) fail(`Kunci primer ${t.pk} = ${n[t.pk]} sudah ada.`); fkCheck(T, s.table, n); }
        if (s.sets.some(([c]) => c === t.pk)) refCheck(T, s.table, hit.filter((r, i) => r[t.pk] !== next[i][t.pk]));
        hit.forEach((r, i) => Object.assign(r, next[i]));
        results.push({ kind: 'info', text: `${hit.length} baris diubah di tabel ${s.table}.${s.where ? '' : ' (Tanpa WHERE, semua baris berubah!)'}`, table: s.table });
      }
    }
  }
  return results;
}
