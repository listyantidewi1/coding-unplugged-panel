// Kelas dan Objek: Angkot dan Ojek — SMA/SMK (16–18 tahun), pemrograman berorientasi objek.
// Game "Ruang Kendali Armada": the team is the computer. The line pointer walks
// one method at a time and jumps to the parent class on super(), keepers update
// the object cards, testers hunt impossible states, and two inherited bugs get fixed.

import { el, onTap, shake, button } from '../core/util.js';
import { misiHead, fill } from './misi-kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

// Class source per version: [text, block] where block names the method the line belongs to.
const A = 'Angkot'; const O = 'Ojek';
const SRC = {
  kInit: [['class Kendaraan:', null], ['    def __init__(self, nomor, kapasitas):', 'K.init'], ['        self.nomor = nomor', 'K.init'], ['        self.kapasitas = kapasitas', 'K.init'], ['        self.penumpang = 0', 'K.init']],
  kNaik0: [['    def naik(self, n):', 'K.naik'], ['        self.penumpang = self.penumpang + n', 'K.naik']],
  kNaik1: [['    def naik(self, n):', 'K.naik'], ['        if self.penumpang + n > self.kapasitas:', 'K.naik'], ['            return False', 'K.naik'], ['        self.penumpang = self.penumpang + n', 'K.naik'], ['        return True', 'K.naik']],
  kTurun0: [['    def turun(self, n):', 'K.turun'], ['        self.penumpang = self.penumpang - n', 'K.turun']],
  kTurun1: [['    def turun(self, n):', 'K.turun'], ['        if n > self.penumpang:', 'K.turun'], ['            return False', 'K.turun'], ['        self.penumpang = self.penumpang - n', 'K.turun'], ['        return True', 'K.turun']],
  aInit: [['', null], ['class Angkot(Kendaraan):', null], ['    def __init__(self, nomor, trayek, tarif):', 'A.init'], ['        super().__init__(nomor, 12)', 'A.init'], ['        self.trayek = trayek', 'A.init'], ['        self.tarif = tarif', 'A.init'], ['        self.pendapatan = 0', 'A.init']],
  aNaik0: [['    def naik(self, n):', 'A.naik'], ['        super().naik(n)', 'A.naik'], ['        self.pendapatan = self.pendapatan + n * self.tarif', 'A.naik']],
  aNaik1: [['    def naik(self, n):', 'A.naik'], ['        if super().naik(n):', 'A.naik'], ['            self.pendapatan = self.pendapatan + n * self.tarif', 'A.naik'], ['            return True', 'A.naik'], ['        return False', 'A.naik']],
  oInit: [['', null], ['class Ojek(Kendaraan):', null], ['    def __init__(self, nomor):', 'O.init'], ['        super().__init__(nomor, 1)', 'O.init'], ['        self.jarak_total = 0', 'O.init']],
  oAntar0: [['    def antar(self, km):', 'O.antar'], ['        self.jarak_total = self.jarak_total + km', 'O.antar'], ['        self.turun(1)', 'O.antar']],
  oAntar1: [['    def antar(self, km):', 'O.antar'], ['        if self.penumpang == 0:', 'O.antar'], ['            return False', 'O.antar'], ['        self.jarak_total = self.jarak_total + km', 'O.antar'], ['        self.turun(1)', 'O.antar'], ['        return True', 'O.antar']],
};
export const VERSI = {
  awal: { label: 'Kelas awal', fixNaik: false, fixTurun: false, fixAngkot: false, fixAntar: false },
  soal6: { label: 'Perbaikan soal 6 (bug pendapatan)', fixNaik: true, fixTurun: false, fixAngkot: false, fixAntar: false },
  benar: { label: 'Versi benar', fixNaik: true, fixTurun: true, fixAngkot: true, fixAntar: true },
};
export function source(v) {
  const V = VERSI[v];
  return [...SRC.kInit, ...(V.fixNaik ? SRC.kNaik1 : SRC.kNaik0), ...(V.fixTurun ? SRC.kTurun1 : SRC.kTurun0), ...SRC.aInit, ...(V.fixAngkot ? SRC.aNaik1 : SRC.aNaik0), ...SRC.oInit, ...(V.fixAntar ? SRC.oAntar1 : SRC.oAntar0)];
}

export const angkot = (nomor = 'WS-07', trayek = 'Terminal–Pasar', tarif = 4000) => ({ cls: A, nomor, kapasitas: 12, penumpang: 0, trayek, tarif, pendapatan: 0 });
export const ojek = (nomor = 'OJ-21') => ({ cls: O, nomor, kapasitas: 1, penumpang: 0, jarak_total: 0 });
// Run obj.method(n) under a class version; mutates obj, returns { ret, trace }.
export function call(v, obj, method, n) {
  const V = VERSI[v]; const trace = [];
  const kNaik = () => { trace.push('K.naik'); if (V.fixNaik) { if (obj.penumpang + n > obj.kapasitas) return false; obj.penumpang += n; return true; } obj.penumpang += n; return null; };
  const kTurun = (m) => { trace.push('K.turun'); if (V.fixTurun) { if (m > obj.penumpang) return false; obj.penumpang -= m; return true; } obj.penumpang -= m; return null; };
  let ret = null;
  if (method === 'naik') {
    if (obj.cls === A) { trace.push('A.naik'); const ok = kNaik(); if (V.fixAngkot) { if (ok) { obj.pendapatan += n * obj.tarif; ret = true; } else ret = false; } else obj.pendapatan += n * obj.tarif; } else ret = kNaik();
  } else if (method === 'turun') ret = kTurun(n);
  else if (method === 'antar') {
    trace.push('O.antar');
    if (V.fixAntar && obj.penumpang === 0) ret = false; else { obj.jarak_total += n; kTurun(1); if (V.fixAntar) ret = true; }
  }
  return { ret, trace };
}
export const attrs = (o) => (o.cls === A ? ['nomor', 'kapasitas', 'penumpang', 'trayek', 'tarif', 'pendapatan'] : ['nomor', 'kapasitas', 'penumpang', 'jarak_total']);
const val = (x) => (typeof x === 'string' ? `"${x}"` : fmtNum(x));
const watch = (o) => (o.cls === A ? ['penumpang', 'pendapatan'] : ['penumpang', 'jarak_total']);

export function classCard(v, lit = []) {
  return el('pre', { class: 'ko-kelas' }, source(v).map(([t, b]) => el('span', { class: `ko-baris ${b && lit.includes(b) ? 'nyala' : ''}` }, t || ' ')));
}
export function objCard(name, o, changed = []) {
  return el('div', { class: `ko-objek ${o.cls === A ? 'angkot' : 'ojek'}` }, el('div', { class: 'ko-objek-kepala' }, `${o.cls === A ? '🚐' : '🏍️'} ${name} : ${o.cls}`),
    ...attrs(o).map((k) => el('div', { class: `ko-attr ${changed.includes(k) ? 'baru' : ''} ${o[k] < 0 || (k === 'penumpang' && o[k] > o.kapasitas) ? 'salah' : ''}` }, el('span', null, k), el('b', null, val(o[k])))));
}

// ---------- Permainan: Ruang Kendali Armada ----------
// The team is the computer: the line pointer walks through one method at a time
// (jumping to the parent class card on super()), the keepers update the object
// cards, the calculator decides each if, and testers hunt impossible states.

// Method snippets as shown on screen: at most 8 lines of 40 characters.
const SNIP = {
  'K.init': ['def __init__(self, nomor, kapasitas):', '    self.nomor = nomor', '    self.kapasitas = kapasitas', '    self.penumpang = 0'],
  'K.naik0': ['def naik(self, n):', '    self.penumpang += n'],
  'K.naik1': ['def naik(self, n):', '    if (self.penumpang + n', '            > self.kapasitas):', '        return False', '    self.penumpang += n', '    return True'],
  'K.turun0': ['def turun(self, n):', '    self.penumpang -= n'],
  'K.turun1': ['def turun(self, n):', '    if n > self.penumpang:', '        return False', '    self.penumpang -= n', '    return True'],
  'A.init': ['def __init__(self, nomor, trayek,', '             tarif):', '    super().__init__(nomor, 12)', '    self.trayek = trayek', '    self.tarif = tarif', '    self.pendapatan = 0'],
  'A.naik0': ['def naik(self, n):', '    super().naik(n)', '    self.pendapatan += n * self.tarif'],
  'A.naik1': ['def naik(self, n):', '    if super().naik(n):', '        uang = n * self.tarif', '        self.pendapatan += uang', '        return True', '    return False'],
  'O.init': ['def __init__(self, nomor):', '    super().__init__(nomor, 1)', '    self.jarak_total = 0'],
  'O.antar0': ['def antar(self, km):', '    self.jarak_total += km', '    self.turun(1)'],
  'O.antar1': ['def antar(self, km):', '    if self.penumpang == 0:', '        return False', '    self.jarak_total += km', '    self.turun(1)', '    return True'],
};
const OWNER = { K: 'Kendaraan', A: 'Angkot', O: 'Ojek' };
const ownerOf = (s) => OWNER[s[0]];
const methodOf = (s) => s.slice(2).replace(/\d$/, '').replace(/^init$/, '__init__');
const VER = { awal: { kn: 0, kt: 0, an: 0, oa: 0 }, soal6: { kn: 1, kt: 0, an: 0, oa: 0 }, benar: { kn: 1, kt: 1, an: 1, oa: 1 } };
const METHODS = { Kendaraan: ['__init__', 'naik', 'turun'], Angkot: ['__init__', 'naik'], Ojek: ['__init__', 'antar'] };
const PARENT = { Angkot: 'Kendaraan', Ojek: 'Kendaraan', Kendaraan: null };
const KEYS16 = { Angkot: ['nomor', 'kapasitas', 'penumpang', 'trayek', 'tarif', 'pendapatan'], Ojek: ['nomor', 'kapasitas', 'penumpang', 'jarak_total'] };

const show = (v) => (typeof v === 'string' ? `"${v}"` : typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v));
const isBad = (o) => o && 'penumpang' in o && 'kapasitas' in o && (o.penumpang > o.kapasitas || o.penumpang < 0);
// Four answer choices: the right value first, then distractors, padded with neighbours.
function choices(v, xs, step = 1) {
  const out = [];
  for (const x of [v, ...xs]) if (x !== undefined && !out.includes(x)) out.push(x);
  for (let d = 1; out.length < 4 && typeof v === 'number'; d++) for (const y of [v + d * step, v - d * step]) if (out.length < 4 && !out.includes(y)) out.push(y);
  return out.slice(0, 4);
}

// Run one call on o (mutated) under a class version and record every executed line.
function trace(V, o, m, arg) {
  const S = [];
  let back = false;
  const add = (s, line, x = {}) => { S.push({ s, line, span: 1, ...x, back }); back = false; };
  const def = (s, span = 1) => add(s, 0, { kind: 'def', span });
  const set = (s, line, attr, v, opts) => { const old = o[attr]; o[attr] = v; add(s, line, { kind: 'set', attr, v, old, opts }); };
  const call = (s, line, fn) => { add(s, line, { kind: 'call' }); const r = fn(); back = true; return r; };
  const plus = (attr, d, step = 1) => { const old = o[attr]; return [old + d, choices(old + d, [old, old - d, d], step)]; };
  const minus = (attr, d) => { const old = o[attr]; return [old - d, choices(old - d, [old, old + d, d])]; };
  function kInit(nomor, kap, pool) { const s = 'K.init'; def(s); set(s, 1, 'nomor', nomor, choices(nomor, pool)); set(s, 2, 'kapasitas', kap, choices(kap, pool)); set(s, 3, 'penumpang', 0, choices(0, pool)); }
  function kNaik(n) {
    if (!V.kn) { const s = 'K.naik0'; def(s); set(s, 1, 'penumpang', ...plus('penumpang', n)); return null; }
    const s = 'K.naik1'; def(s);
    const c = o.penumpang + n > o.kapasitas;
    add(s, 1, { kind: 'if', span: 2, cond: c, expr: `${o.penumpang} + ${n} > ${o.kapasitas}` });
    if (c) { add(s, 3, { kind: 'ret', ret: false }); return false; }
    set(s, 4, 'penumpang', ...plus('penumpang', n)); add(s, 5, { kind: 'ret', ret: true }); return true;
  }
  function kTurun(n) {
    if (!V.kt) { const s = 'K.turun0'; def(s); set(s, 1, 'penumpang', ...minus('penumpang', n)); return null; }
    const s = 'K.turun1'; def(s);
    const c = n > o.penumpang;
    add(s, 1, { kind: 'if', cond: c, expr: `${n} > ${o.penumpang}` });
    if (c) { add(s, 2, { kind: 'ret', ret: false }); return false; }
    set(s, 3, 'penumpang', ...minus('penumpang', n)); add(s, 4, { kind: 'ret', ret: true }); return true;
  }
  function aNaik(n) {
    const t = o.tarif;
    if (!V.an) { const s = 'A.naik0'; def(s); call(s, 1, () => kNaik(n)); set(s, 2, 'pendapatan', ...plus('pendapatan', n * t, t)); return null; }
    const s = 'A.naik1'; def(s);
    const ok = call(s, 1, () => kNaik(n));
    add(s, 1, { kind: 'if', cond: ok, same: true, expr: `super().naik(${n}) mengembalikan ${ok ? 'True' : 'False'}` });
    if (!ok) { add(s, 5, { kind: 'ret', ret: false }); return false; }
    add(s, 2, { kind: 'plain' }); set(s, 3, 'pendapatan', ...plus('pendapatan', n * t, t)); add(s, 4, { kind: 'ret', ret: true }); return true;
  }
  function oAntar(km) {
    if (!V.oa) { const s = 'O.antar0'; def(s); set(s, 1, 'jarak_total', ...plus('jarak_total', km)); call(s, 2, () => kTurun(1)); return null; }
    const s = 'O.antar1'; def(s);
    const c = o.penumpang === 0;
    add(s, 1, { kind: 'if', cond: c, expr: `${o.penumpang} == 0` });
    if (c) { add(s, 2, { kind: 'ret', ret: false }); return false; }
    set(s, 3, 'jarak_total', ...plus('jarak_total', km)); call(s, 4, () => kTurun(1)); add(s, 5, { kind: 'ret', ret: true }); return true;
  }
  let ret = null;
  if (m === 'new' && o.cls === 'Angkot') {
    const [nomor, trayek, tarif] = arg; const pool = [nomor, trayek, tarif, 12, 0]; const s = 'A.init';
    def(s, 2); call(s, 2, () => kInit(nomor, 12, pool)); set(s, 3, 'trayek', trayek, choices(trayek, pool)); set(s, 4, 'tarif', tarif, choices(tarif, pool)); set(s, 5, 'pendapatan', 0, choices(0, pool));
  } else if (m === 'new') {
    const [nomor] = arg; const pool = [nomor, 1, 0, 12]; const s = 'O.init';
    def(s); call(s, 1, () => kInit(nomor, 1, pool)); set(s, 2, 'jarak_total', 0, choices(0, pool));
  } else if (m === 'naik') ret = o.cls === 'Angkot' ? aNaik(arg) : kNaik(arg);
  else if (m === 'turun') ret = kTurun(arg);
  else ret = oAntar(arg);
  return { steps: S, ret };
}
const cmdText = (c) => (c.m === 'new' ? `${c.o} = ${c.cls}(${c.x.map(show).join(', ')})` : `${c.o}.${c.m}(${c.x})`);
const C = (o, m, x, label) => ({ o, m, x, label });

function seats(o) {
  const p = o.penumpang ?? 0;
  const k = o.kapasitas;
  const cells = [];
  for (let i = 0; i < k; i++) cells.push(el('i', { class: i < p ? 'isi' : '' }));
  if (p > k) cells.push(el('em', { class: 'lebih' }, `+${p - k}`));
  if (p < 0) cells.push(el('em', { class: 'hantu' }, `👻 ${p}`));
  return el('div', { class: 'ka16-kursi', 'aria-label': `${p} penumpang, ${k} kursi` }, cells);
}
function objCard16(name, o, { pend = null, changed = [] } = {}) {
  const A = o.cls === 'Angkot';
  const keys = KEYS16[o.cls].filter((k) => k in o || pend === k);
  return el('div', { class: `ka16-objek ${A ? 'is-angkot' : 'is-ojek'} ${isBad(o) ? 'mustahil' : ''}`, 'data-o': name },
    el('div', { class: 'ka16-objek-kepala' }, `${A ? '🚐' : '🏍️'} ${name} : ${o.cls}`),
    'kapasitas' in o ? seats(o) : null,
    el('div', { class: 'ka16-attrs' }, keys.length ? keys.map((k) => el('div', { class: `ka16-attr ${changed.includes(k) ? 'baru' : ''} ${pend === k ? 'tanya' : ''}` }, el('span', null, k), el('b', null, pend === k ? '?' : show(o[k])))) : el('div', { class: 'ka16-attr kosong' }, el('span', null, 'belum ada atribut'))),
    isBad(o) ? el('div', { class: 'ka16-merah' }, `⛔ Keadaan Mustahil! ${o.penumpang < 0 ? 'Penumpang minus.' : `${o.penumpang} penumpang, ${o.kapasitas} kursi.`}`) : null);
}

// The control room. run(cmds, onEnd, opts) plays commands; the options decide which jobs are the players'.
function armada(wrap, ctx, { objs = {}, V = VER.awal, intro = '', loop = null, onSet = null } = {}) {
  const queue = el('div', { class: 'ka16-antre' });
  const classes = el('div', { class: 'ka16-kelas-baris' });
  const code = el('div', { class: 'ka16-kode' });
  const shelf = el('div', { class: 'ka16-rak' });
  const tray = el('div', { class: 'ka16-baki' });
  const msg = el('p', { class: 'reveal info' }, intro);
  const api = { objs, V, msg, tray, code };
  let cmds = []; let ci = -1; let steps = []; let si = 0; let res = null;
  let ptr = null; let view = null; let wait = null; let pend = null; let changed = {}; let opt = {}; let end = null;
  let lineTap = null; let lit = [];
  const later = (fn, ms) => setTimeout(() => { if (wrap.isConnected) fn(); }, (ms ?? 650) * (opt.fast ? 0.4 : 1));
  const cur = () => cmds[ci];

  function drawQueue() {
    fill(queue, loop ? el('code', { class: 'ka16-loop' }, loop) : null, cmds.map((c, j) => el('code', { class: `ka16-perintah ${j === ci ? 'kini' : j < ci ? 'sudah' : ''}` }, c.label || cmdText(c))));
  }
  function drawClasses() {
    const want = wait && (wait.kind === 'dispatch' || wait.kind === 'enter');
    fill(classes, Object.keys(METHODS).map((k) => {
      const node = el('button', { type: 'button', class: `ka16-kelas ${view && ownerOf(view) === k ? 'nyala' : ''} ${want ? 'tanya' : ''}`, 'data-k': k },
        el('b', null, el('span', null, `class ${k}`), PARENT[k] ? el('span', null, `(${PARENT[k]})`) : null),
        el('span', { class: 'ka16-metode' }, METHODS[k].map((m) => el('code', { class: view && ownerOf(view) === k && methodOf(view) === m ? 'on' : '' }, m))));
      return onTap(node, () => tapClass(k, node));
    }));
  }
  function drawCode() {
    if (!view) { fill(code, el('div', { class: 'ka16-kode-kepala' }, '🧷 Penunjuk baris menunggu'), el('div', { class: 'ka16-kode-isi kosong' }, el('span', null, wait?.kind === 'dispatch' ? 'Ketuk kartu kelas di atas.' : 'Menunggu perintah.'))); return; }
    const on = (i) => ptr && ptr.s === view && i >= ptr.line && i < ptr.line + ptr.span;
    fill(code, el('div', { class: 'ka16-kode-kepala' }, `🧷 ${ownerOf(view)}.${methodOf(view)}`),
      el('div', { class: `ka16-kode-isi ${wait?.kind === 'line' || lineTap ? 'ketuk' : ''}` }, SNIP[view].map((t, i) => onTap(el('div', { class: `ka16-baris ${on(i) ? 'kini' : ''} ${lit.includes(i) ? 'tanda' : ''}`, 'data-l': i }, el('span', { class: 'ka16-jepit' }, on(i) && i === ptr.line ? '➤' : ''), el('span', null, t || ' ')), (e) => tapLine(i, e.currentTarget)))));
  }
  function drawObjs() {
    fill(shelf, Object.entries(api.objs).map(([n, o]) => objCard16(n, o, { pend: pend && cur()?.o === n ? pend : null, changed: changed[n] || [] })));
  }
  function draw() { drawQueue(); drawClasses(); drawCode(); drawObjs(); }

  function nextCmd() {
    ci++; changed = {}; drawQueue();
    if (ci >= cmds.length) { wait = null; fill(tray); const f = end; end = null; f?.(res); return; }
    const c = cur();
    const t = trace(api.V, c.m === 'new' ? { cls: c.cls } : { ...api.objs[c.o] }, c.m, c.x);
    steps = t.steps; res = t.ret;
    si = 0;
    if (opt.dispatch) {
      wait = { kind: 'dispatch', cls: ownerOf(steps[0].s) }; view = null; ptr = null; draw();
      say(msg, 'info', c.m === 'new' ? `${cmdText(c)}: objek dibuat dari kelas mana? Ketuk kartu kelasnya.` : `${c.label ? `${c.label}: ` : ''}${c.o}.${c.m}(${c.x}). Metode ${c.m} milik kelas mana yang dijalankan? Ketuk kartu kelasnya.`);
      return;
    }
    if (c.m === 'new') api.objs[c.o] = { cls: c.cls };
    land();
  }
  function land() {
    const st = steps[si];
    view = st.s; ptr = st; draw();
    if (st.kind === 'set' && opt.pickSet !== false) return ask(st);
    if (st.kind === 'set') { apply(st); return later(advance); }
    if (st.kind === 'if' && opt.pickIf !== false) return ask(st);
    if (st.kind === 'ret') say(msg, 'info', `return ${show(st.ret)}: kembali ke pemanggil.`);
    if (st.kind === 'def' && si > 0) say(msg, 'info', `Masuk ke ${ownerOf(st.s)}.${methodOf(st.s)}.`);
    if (st.kind === 'call') say(msg, 'info', SNIP[st.s][st.line].includes('super()') ? 'super() memanggil metode milik kelas induk, Kendaraan.' : 'self.turun(1): Ojek tidak punya turun, jadi Python memakai turun milik Kendaraan.');
    later(advance);
  }
  function advance() {
    si++;
    if (si >= steps.length) return finishCmd();
    const st = steps[si];
    const prev = steps[si - 1];
    if (prev.kind === 'call') {
      if (opt.tap) { wait = { kind: 'enter', cls: ownerOf(st.s) }; drawClasses(); say(msg, 'info', `Penunjuk baris: ${SNIP[prev.s][prev.line].includes('super()') ? 'super() pindah ke kelas induk' : 'self.turun(1) mencari metode turun'}. Ketuk kartu kelas tujuannya.`); return; }
      return land();
    }
    if (opt.tap && st.kind !== 'def' && !st.same) {
      if (st.s !== view) { view = st.s; const call = [...steps.slice(0, si)].reverse().find((x) => x.s === st.s && x.kind === 'call'); ptr = call || null; }
      wait = { kind: 'line', st }; draw();
      say(msg, 'info', st.back ? `Kembali ke ${ownerOf(st.s)}.${methodOf(st.s)}. Ketuk baris berikutnya yang dijalankan.` : 'Penunjuk baris: ketuk baris berikutnya yang dijalankan.');
      return;
    }
    land();
  }
  function finishCmd() {
    const c = cur();
    ptr = null; draw();
    say(msg, '', `${c.label ? `${c.label}: ` : ''}${cmdText(c)} selesai${res === null ? '' : `, mengembalikan ${show(res)}`}.`);
    later(nextCmd, 1100);
  }
  function ask(st) {
    wait = { kind: 'pick', st }; pend = st.kind === 'set' ? st.attr : null; drawObjs();
    const c = cur();
    const opts = st.kind === 'if' ? [true, false] : ctx.rand.shuffle([...st.opts]);
    say(msg, 'info', st.kind === 'if' ? (st.same ? `Kendaraan.naik sudah selesai. Apa yang dikembalikannya ke if?` : 'Kalkulator: kondisi di baris ini True atau False?') : `Penjaga ${c.o}: ${c.o}.${st.attr} sekarang bernilai berapa?`);
    fill(tray, opts.map((v) => onTap(el('button', { class: `ka16-chip ${typeof v === 'boolean' ? 'bool' : ''}`, type: 'button' }, show(v)), (e) => pick(v, e.currentTarget))));
  }
  function pick(v, node) {
    if (wait?.kind !== 'pick') return;
    const st = wait.st;
    if (v !== (st.kind === 'if' ? st.cond : st.v)) {
      ctx.mistake(); shake(node || tray);
      say(msg, 'bad', st.kind === 'if' ? `Hitung dulu: ${st.expr}.` : v === st.old ? 'Baris ini mengubah nilainya. Hitung lagi.' : st.attr === 'pendapatan' ? `Pendapatan bertambah n × tarif: ${fmtNum(st.v - st.old)}.` : 'Belum tepat. Baca lagi barisnya.');
      return;
    }
    ctx.sound.tap(); wait = null; pend = null; fill(tray);
    if (st.kind === 'set') apply(st); else { drawObjs(); say(msg, 'info', `${show(st.cond)}: ${st.cond ? 'masuk ke isi if.' : 'isi if dilewati.'}`); }
    later(advance, 500);
  }
  function apply(st) {
    const c = cur();
    const o = api.objs[c.o];
    const was = isBad(o);
    o[st.attr] = st.v;
    changed = { [c.o]: [...(changed[c.o] || []), st.attr] };
    drawObjs();
    if (!was && isBad(o)) { onSet?.(c.o, o); say(msg, 'bad', `⛔ ${c.o}.penumpang = ${fmtNum(o.penumpang)}: keadaan mustahil!`); } else onSet?.(c.o, o);
  }
  function tapClass(k, node) {
    if (!wait || (wait.kind !== 'dispatch' && wait.kind !== 'enter')) return;
    const c = cur();
    if (k !== wait.cls) {
      ctx.mistake(); shake(node);
      const m = c.m === 'new' ? null : wait.kind === 'enter' ? methodOf(steps[si].s) : c.m;
      say(msg, 'bad', c.m === 'new' && wait.kind === 'dispatch' ? `Lihat nama kelas sesudah tanda = pada ${cmdText(c)}.` : wait.kind === 'enter' && SNIP[steps[si - 1].s][steps[si - 1].line].includes('super()') ? `super() menunjuk kelas induk ${wait.cls}.` : !METHODS[k].includes(m) ? `Kelas ${k} tidak punya metode ${m}. Python mencari ke kelas induknya.` : PARENT[k] === null ? `${api.objs[c.o].cls} punya ${m} sendiri yang menimpa milik ${k}.` : `${c.o} bukan objek ${k}.`);
      return;
    }
    ctx.sound.tap();
    const was = wait.kind; wait = null;
    if (was === 'dispatch' && c.m === 'new') api.objs[c.o] = { cls: c.cls };
    land();
  }
  function tapLine(i, node) {
    if (lineTap) { lineTap(i, node); return; }
    if (wait?.kind !== 'line') return;
    const st = wait.st;
    if (i < st.line || i >= st.line + st.span) {
      ctx.mistake(); shake(node);
      const prev = steps[si - 1];
      say(msg, 'bad', prev.kind === 'if' && prev.s === st.s ? `Kondisinya ${show(prev.cond)}: ${prev.cond ? 'masuk ke isi if.' : 'isi if dilewati.'}` : st.back ? 'Metode induk sudah selesai. Lanjut di baris sesudah pemanggilan.' : 'Baris dijalankan berurutan dari atas.');
      return;
    }
    ctx.sound.tap(); wait = null; land();
  }

  api.run = (list, onEnd, o = {}) => { cmds = list; ci = -1; opt = o; end = onEnd; lineTap = null; lit = []; nextCmd(); };
  api.reset = (objs2) => { api.objs = objs2; changed = {}; pend = null; drawObjs(); };
  api.view = (s, { mark = [], onLine = null } = {}) => { view = s; ptr = null; lit = mark; lineTap = onLine; wait = null; draw(); };
  api.cmds = (list) => { cmds = list; ci = -1; drawQueue(); };
  wrap.append(queue, el('div', { class: 'ka16-meja' }, el('div', { class: 'ka16-kiri' }, classes, code), shelf), tray, msg);
  draw();
  return api;
}

// Misi 4: testers arrange up to four command cards to drive the objects into impossible states.
function testerRound(wrap, ctx, { hand, done }) {
  const KIND = { sesak: '🚐 Angkot lebih dari 12', dobel: '🏍️ Ojek lebih dari 1', minus: '👻 Penumpang minus' };
  const found = {};
  const slots = [];
  let runs = 0; let busy = false; let fin = false;
  const badges = el('div', { class: 'ka16-lencana' });
  const deck = el('div', { class: 'ka16-tangan' });
  const row = el('div', { class: 'ka16-slot-baris' });
  const go = button('▶ Jalankan', () => runIt(), 'primary');
  const drawBadges = () => fill(badges, Object.entries(KIND).map(([k, t]) => el('span', { class: found[k] ? 'dapat' : '' }, `${found[k] ? '⛔' : '❔'} ${t}`)));
  function drawCards() {
    fill(deck, hand.map((c, j) => onTap(el('button', { type: 'button', class: `ka16-perintah kartu ${slots.includes(j) ? 'pakai' : ''}` }, cmdText(c)), () => { if (busy || fin || slots.includes(j) || slots.length >= 4) return; slots.push(j); ctx.sound.tap(); drawCards(); })));
    fill(row, [0, 1, 2, 3].map((k) => (slots[k] == null ? el('span', { class: 'ka16-slot' }, `${k + 1}`) : onTap(el('button', { type: 'button', class: 'ka16-perintah kartu' }, cmdText(hand[slots[k]])), () => { if (busy || fin) return; slots.splice(k, 1); drawCards(); }))));
    go.disabled = busy || fin || slots.length < 2;
  }
  const m = armada(wrap, ctx, { objs: { a: angkot(), o: ojek() }, intro: 'Susun 2 sampai 4 kartu perintah, lalu tekan Jalankan. Kelas awal tidak memeriksa apa pun.', onSet: (n, o) => { if (o.penumpang < 0) found.minus = true; else if (o.penumpang > o.kapasitas) found[o.cls === 'Angkot' ? 'sesak' : 'dobel'] = true; drawBadges(); } });
  function runIt() {
    if (busy || fin || slots.length < 2) return;
    busy = true; runs++; drawCards();
    m.reset({ a: angkot(), o: ojek() });
    m.run(slots.map((j) => hand[j]), () => {
      busy = false;
      const a = m.objs.a;
      if (Object.keys(KIND).every((k) => found[k])) {
        fin = true; drawCards(); ctx.sound.good();
        say(m.msg, '', `Tiga keadaan mustahil${runs === 1 ? ' dalam satu susunan' : ` dalam ${runs} kali uji`}! Pendapatan angkot ${fmtNum(a.pendapatan)} untuk ${fmtNum(Math.max(a.penumpang, 0))} penumpang tersisa. Kelas awal tidak pernah memeriksa kapasitas: tugas penguji adalah mencari celah seperti ini.`);
        done(); return;
      }
      drawCards();
      say(m.msg, 'info', `Ditemukan ${Object.keys(found).length} dari 3 jenis. Ubah susunan dan jalankan lagi; objek dibuat baru setiap uji.`);
    }, { pickSet: false, pickIf: false, fast: true });
  }
  wrap.insertBefore(el('div', { class: 'ka16-uji' }, badges, el('div', { class: 'ka16-uji-baris' }, row, go), deck), m.tray);
  drawBadges(); drawCards();
}

// Misi 5: the inherited bug. Be the line pointer, then repair the line that ignores super()'s answer.
function inheritRound(wrap, ctx, { done }) {
  const cmds = [C('a', 'naik', 8), C('a', 'naik', 6)];
  const m = armada(wrap, ctx, { objs: { a: angkot() }, V: VER.soal6, intro: 'Versi baru: naik milik Kendaraan sudah menolak penumpang berlebih.' });
  m.run(cmds, () => {
    say(m.msg, 'bad', 'Enam penumpang ditolak, tetapi pendapatan tetap naik 24.000 menjadi 56.000. Seharusnya 32.000. Ketuk baris Angkot.naik yang membuat salah.');
    m.view('A.naik0', { onLine: (i, node) => {
      if (i !== 1) { ctx.mistake(); shake(node); say(m.msg, 'bad', i === 0 ? 'Baris def hanya nama metode.' : 'Baris ini benar bila hanya dijalankan saat naik berhasil. Cari baris yang mengabaikan jawaban Kendaraan.naik.'); return; }
      ctx.sound.tap();
      m.view('A.naik0', { mark: [1] });
      say(m.msg, 'info', 'super().naik(n) menjawab True atau False, tetapi jawabannya dibuang. Pilih baris pengganti.');
      fill(m.tray, ctx.rand.shuffle([['if super().naik(n):', true], ['return super().naik(n)', 'Metode langsung selesai: pendapatan tidak pernah bertambah.'], ['self.naik(n)', 'self.naik memanggil naik milik Angkot lagi, tanpa henti.']]).map(([t, ok]) => onTap(el('button', { type: 'button', class: 'ka16-chip kode' }, t), (e) => {
        if (ok !== true) { ctx.mistake(); shake(e.currentTarget); say(m.msg, 'bad', ok); return; }
        ctx.sound.tap(); fill(m.tray);
        m.V = { ...VER.soal6, an: 1 };
        m.reset({ a: angkot() });
        say(m.msg, 'info', 'Diperbaiki. Uji ulang dengan objek baru.');
        setTimeout(() => { if (!wrap.isConnected) return; m.run(cmds, () => { ctx.sound.good(); say(m.msg, '', 'a.naik(6) kini mengembalikan False dan pendapatan tetap 32.000. Pewarisan ikut membawa bug: metode yang menimpa harus memakai jawaban super().'); done(); }, { pickSet: false, pickIf: false, fast: true }); }, 900);
      })));
    } });
  }, { tap: true });
}

// Misi Bos: an empty ojek "delivers" a passenger. Place the guard in antar.
function ghostRound(wrap, ctx, { done }) {
  const m = armada(wrap, ctx, { objs: { o: ojek() }, intro: 'Ojek OJ-21 belum membawa penumpang, tetapi o.antar(5) dipanggil.' });
  const GUARD = [['if self.penumpang == 0:', '    return False'], ['if self.penumpang > 0:', '    return False']];
  m.run([C('o', 'antar', 5)], () => {
    say(m.msg, 'bad', 'Ojek hantu: jarak 5 km tercatat dan penumpang −1. Pilih kartu pengaman, lalu ketuk baris tempat menyisipkannya (di atas baris itu).');
    let g = null;
    const cards = () => fill(m.tray, GUARD.map((t, j) => onTap(el('button', { type: 'button', class: `ka16-chip kode ${g === j ? 'on' : ''}` }, t.join('\n')), () => { g = j; ctx.sound.tap(); cards(); say(m.msg, 'info', 'Sekarang ketuk baris yang akan didahului pengaman ini.'); })));
    cards();
    m.view('O.antar0', { onLine: (i, node) => {
      if (g == null) { shake(m.tray); say(m.msg, 'info', 'Pilih kartu pengaman dulu.'); return; }
      if (g === 1) { ctx.mistake(); shake(node); say(m.msg, 'bad', 'Pengaman ini menolak ojek yang sedang membawa penumpang: antar tidak pernah berjalan.'); return; }
      if (i !== 1) { ctx.mistake(); shake(node); say(m.msg, 'bad', i === 0 ? 'Pengaman harus ada di dalam metode, sesudah def.' : 'Terlambat: jarak_total sudah bertambah sebelum diperiksa.'); return; }
      ctx.sound.tap(); fill(m.tray);
      m.view('O.antar1', { mark: [1, 2] });
      m.V = { ...VER.awal, oa: 1 };
      m.reset({ o: ojek() });
      say(m.msg, 'info', 'Pengaman terpasang. Uji: antar saat kosong, naik, lalu antar.');
      setTimeout(() => { if (!wrap.isConnected) return; m.run([C('o', 'antar', 5), C('o', 'naik', 1), C('o', 'antar', 5)], () => { ctx.sound.good(); say(m.msg, '', 'Antar saat kosong mengembalikan False tanpa mengubah apa pun. Sesudah naik, antar mencatat 5 km dan penumpang kembali 0. Periksa dulu, baru ubah.'); done(); }, { pickSet: true, pickIf: true }); }, 900);
    } });
  });
}

function randomAngkot(rand, name = 'b') {
  const nomor = rand.pick(['KL-03', 'BR-09', 'WS-12', 'PS-05']);
  const trayek = rand.pick(['Pasar–Stasiun', 'Alun-alun–Terminal', 'Kampus–Pasar']);
  const tarif = rand.int(6, 10) * 500;
  return { name, nomor, trayek, tarif };
}
// Web variation (versi benar): five commands with numbers 1–6, at least one refused.
function randomCommands(rand) {
  for (let t = 0; t < 200; t++) {
    const tarif = rand.int(6, 10) * 500;
    const p = rand.int(5, 9);
    const objs = { a: { ...angkot('WS-07', 'Terminal–Pasar', tarif), penumpang: p, pendapatan: p * tarif }, o: ojek() };
    const cmds = Array.from({ length: 5 }, () => rand.pick([() => C('a', 'naik', rand.int(1, 6)), () => C('a', 'turun', rand.int(1, 6)), () => C('o', 'naik', rand.int(1, 2)), () => C('o', 'antar', rand.int(2, 9))])());
    const sim = { a: { ...objs.a }, o: { ...objs.o } };
    const rets = cmds.map((c) => trace(VER.benar, sim[c.o], c.m, c.x).ret);
    const no = rets.filter((r) => r === false).length;
    if (no >= 1 && no <= 2 && rets[0] !== false) return { objs, cmds, sim };
  }
  return { objs: { a: angkot(), o: ojek() }, cmds: [C('a', 'naik', 5), C('a', 'naik', 9), C('o', 'naik', 1), C('o', 'antar', 4), C('a', 'turun', 2)] };
}

const HEAD16 = {
  objek: ['Kartu Objek', 'Buat objek dari kelasnya dan isi kartu objek seperti komputer.'],
  perintah: ['Jalankan Perintah', 'Ikuti penunjuk baris dan perbarui kartu objek.'],
  dua: ['Satu Perintah, Dua Perilaku', 'Perintah yang sama untuk objek berbeda. Kelas mana yang bekerja?'],
  penguji: ['Tim Penguji', 'Susun kartu perintah sampai muncul tiga keadaan mustahil.'],
  warisan: ['Bug Warisan', 'Jadilah penunjuk baris, lalu perbaiki baris yang salah.'],
  boss: ['Ojek Hantu', 'Ojek kosong mengantar penumpang. Pasang pengaman di tempat yang tepat.'],
};

const NEW = (o, cls, x) => ({ o, m: 'new', cls, x });
const at = (o, extra) => ({ ...o, ...extra });

export default {
  id: 'sma-16-kelas-objek',
  title: 'Kelas dan Objek: Angkot dan Ojek',
  topic: 'Pemrograman berorientasi objek: kelas, objek, pewarisan, polimorfisme, dan bug',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🚐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid membedakan kelas dan objek, atribut dan metode, menjelaskan pewarisan dan metode yang ditimpa, melacak keadaan objek setelah pemanggilan metode, menjelaskan polimorfisme, serta menemukan dan memperbaiki bug, termasuk bug karena pewarisan.',
  extraModes: [
    { id: 'lab', icon: '🧪', label: 'Lab Objek', desc: 'Pilih versi kelas, buat objek Angkot dan Ojek, panggil metode, dan lihat baris kode yang dijalankan serta atribut yang berubah', create: createLab },
    { id: 'giliran', icon: '🔁', label: 'Tebak Keadaan', desc: 'Satu tim menyusun tiga pemanggilan metode, tim lain menebak keadaan akhir objek; tebakan benar mendapat poin, lalu peran ditukar', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kelas-objek ka16-main' });
    root.append(wrap);
    const rb = randomAngkot(ctx.rand);
    const nb = ctx.rand.int(2, 6);
    const rc = randomCommands(ctx.rand);
    const t1 = ctx.rand.int(6, 10) * 500;
    const t2 = ctx.rand.pick([3000, 3500, 4000, 4500, 5000].filter((x) => x !== t1));
    const p1 = ctx.rand.int(3, 8);
    const p2 = ctx.rand.int(3, 8);
    const n8 = ctx.rand.int(1, 3);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD16[k], '🚐'));
      const win = (m, text) => () => { ctx.sound.good(); say(m.msg, '', text); next(); };
      if (r === 0) {
        head('objek', 1);
        const m = armada(wrap, ctx, {});
        m.run([NEW('a', 'Angkot', ['WS-07', 'Terminal–Pasar', 4000]), NEW('o', 'Ojek', ['OJ-21'])], win(m, 'Dua objek dari dua kelas. penumpang tidak ditulis di Angkot atau Ojek, tetapi ada di keduanya: diwarisi dari Kendaraan lewat super().__init__. Kapasitas 12 dan 1 pun datang dari super(), bukan dari argumen.'), { dispatch: true });
      } else if (r === 1) {
        head('perintah', 2);
        const m = armada(wrap, ctx, { objs: { a: angkot(), o: ojek() } });
        m.run([C('a', 'naik', 5), C('a', 'naik', 4), C('a', 'turun', 3), C('o', 'naik', 1)], win(m, 'a: 6 penumpang, pendapatan 36.000. o: 1 penumpang. Angkot tidak menulis turun, tetapi bisa memakainya karena mewarisi milik Kendaraan.'));
      } else if (r === 2) {
        head('perintah', 2);
        const m = armada(wrap, ctx, { objs: { a: at(angkot(), { penumpang: 6, pendapatan: 36000 }), o: at(ojek(), { penumpang: 1 }) } });
        m.run([C('a', 'naik', 6), C('o', 'antar', 7), C('a', 'turun', 2)], win(m, 'a: 10 penumpang, pendapatan 60.000. o: kosong lagi, jarak 7 km. Kini kamu yang memilih kelas: metode dicari dulu di kelas objeknya, lalu di kelas induk.'), { dispatch: true });
      } else if (r === 3) {
        head('dua', 3);
        const m = armada(wrap, ctx, { objs: { a: at(angkot(), { penumpang: 10, pendapatan: 60000 }), o: at(ojek(), { jarak_total: 7 }) }, loop: 'for k in [a, o]: k.naik(1)' });
        m.run([C('a', 'naik', 1, 'k = a'), C('o', 'naik', 1, 'k = o')], win(m, 'Perintah sama, dua perilaku: a menjadi 11 penumpang dan 64.000 (naik milik Angkot), o 1 penumpang (naik milik Kendaraan, karena Ojek tidak menimpanya). Inilah polimorfisme.'), { dispatch: true });
      } else if (r === 4) {
        head('penguji', 4);
        testerRound(wrap, ctx, { hand: [C('a', 'naik', 8), C('a', 'naik', 6), C('a', 'naik', 3), C('a', 'turun', 15), C('a', 'turun', 4), C('o', 'naik', 1), C('o', 'naik', 2), C('o', 'antar', 5)], done: () => next(6400) });
      } else if (r === 5) {
        head('warisan', 5);
        inheritRound(wrap, ctx, { done: () => next(6400) });
      } else if (r === 6) {
        head('objek', 1);
        const m = armada(wrap, ctx, {});
        m.run([NEW('b', 'Angkot', [rb.nomor, rb.trayek, rb.tarif]), C('b', 'naik', nb)], win(m, `Objek baru, kelas sama: b punya atribut sendiri. ${nb} × ${fmtNum(rb.tarif)} = ${fmtNum(nb * rb.tarif)} masuk ke pendapatan b, bukan ke angkot lain.`), { dispatch: true });
      } else if (r === 7) {
        head('perintah', 2);
        const m = armada(wrap, ctx, { objs: rc.objs, V: VER.benar, intro: 'Versi benar: setiap metode memeriksa dulu dengan if.' });
        m.run(rc.cmds, win(m, `Perintah yang ditolak mengembalikan False dan tidak mengubah apa pun. Akhirnya a: ${rc.sim.a.penumpang} penumpang, pendapatan ${fmtNum(rc.sim.a.pendapatan)}; o: ${rc.sim.o.penumpang} penumpang, ${rc.sim.o.jarak_total} km.`));
      } else if (r === 8) {
        head('dua', 3);
        const m = armada(wrap, ctx, { objs: { o: at(ojek(), { penumpang: 1, jarak_total: 4 }), a: at(angkot('WS-07', 'Terminal–Pasar', t1), { penumpang: p1, pendapatan: p1 * t1 }), b: at(angkot('KL-03', 'Pasar–Stasiun', t2), { penumpang: p2, pendapatan: p2 * t2 }) }, V: VER.benar, loop: `for k in [o, a, b]: k.naik(${n8})` });
        m.run([C('o', 'naik', n8, 'k = o'), C('a', 'naik', n8, 'k = a'), C('b', 'naik', n8, 'k = b')], win(m, `Satu baris, tiga objek: o memakai naik milik Kendaraan dan menolak (kursinya cuma 1), a dan b memakai naik milik Angkot dengan tarif masing-masing (${fmtNum(n8 * t1)} dan ${fmtNum(n8 * t2)}).`), { dispatch: true });
      } else {
        head('boss', 'Bos');
        ghostRound(wrap, ctx, { done: () => next(6400) });
      }
    }
    render();
  },
};

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act kelas-objek' });
  root.append(wrap);
  let v = 'awal'; let n = 1; let lit = []; let changed = {}; let tarif = 4000;
  let objs = {};
  const vers = el('div', { class: 'seg' });
  const make = el('div', { class: 'seg' });
  const stage = el('div', { class: 'ko-papan' });
  const out = el('p', { class: 'reveal hint' }, 'Buat objek, pilih angka, lalu ketuk metode pada kartu objek.');
  const draw = () => {
    vers.replaceChildren(...Object.entries(VERSI).map(([k, x]) => onTap(el('button', { class: `seg-btn ${v === k ? 'on' : ''}`, type: 'button' }, x.label), () => { v = k; lit = []; draw(); })));
    make.replaceChildren(
      onTap(el('button', { class: 'seg-btn', type: 'button' }, `➕ Angkot (tarif ${fmtNum(tarif)})`), () => { const c = Object.values(objs).filter((o) => o.cls === A).length; if (Object.keys(objs).length >= 4) return; objs[`a${c || ''}`] = angkot(`WS-0${7 + c}`, 'Terminal–Pasar', tarif); say(out, 'info', `Objek baru dibuat: __init__ Angkot memanggil __init__ Kendaraan (kapasitas 12).`); lit = ['A.init', 'K.init']; changed = {}; draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'tarif −'), () => { tarif = Math.max(2000, tarif - 1000); draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'tarif +'), () => { tarif = Math.min(10000, tarif + 1000); draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '➕ Ojek'), () => { const c = Object.values(objs).filter((o) => o.cls === O).length; if (Object.keys(objs).length >= 4) return; objs[`o${c || ''}`] = ojek(`OJ-${21 + c}`); lit = ['O.init', 'K.init']; changed = {}; say(out, 'info', 'Objek baru dibuat: __init__ Ojek memanggil __init__ Kendaraan (kapasitas 1).'); draw(); }),
      el('span', { class: 'ko-n' }, 'n = '),
      ...[1, 2, 3, 5, 6, 8, 15].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, x), () => { n = x; draw(); })),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🗑️ Hapus objek'), () => { objs = {}; lit = []; draw(); }));
    stage.replaceChildren(classCard(v, lit), el('div', { class: 'ko-objek-daftar' }, Object.entries(objs).map(([name, o]) => el('div', { class: 'ko-objek-wadah' }, objCard(name, o, changed[name] || []),
      el('div', { class: 'ko-metode' }, ...['naik', 'turun', ...(o.cls === O ? ['antar'] : [])].map((m) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${m}(${n})`), () => {
        const before = { ...o }; const r = call(v, o, m, n);
        lit = r.trace; changed = { [name]: attrs(o).filter((q) => o[q] !== before[q]) }; ctx.sound.tap();
        const bad = o.penumpang < 0 || o.penumpang > o.kapasitas;
        say(out, bad ? 'bad' : 'info', `${name}.${m}(${n})${r.ret === null ? '' : ` → ${r.ret ? 'True' : 'False'}`}${bad ? `: penumpang ${o.penumpang}, mustahil (kapasitas ${o.kapasitas})!` : ''}`);
        draw();
      })))))));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Lab objek'), vers, make, stage, out);
  objs = { a: angkot(), o: ojek() };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kelas-objek' });
  root.append(wrap);
  const STATE = (a, o) => `a.penumpang ${fmtNum(a.penumpang)} · a.pendapatan ${fmtNum(a.pendapatan)} · o.penumpang ${o.penumpang} · o.jarak_total ${o.jarak_total}`;
  function start(n) {
    const pts = Array(n).fill(0);
    let turn = 0;
    function make() {
      if (turn >= n * 2) return finishBoard(wrap, ctx, { title: 'Permainan selesai.', pts, again: () => pickTeams(wrap, 'Tebak Keadaan', start) });
      const maker = turn % n; const solver = (maker + 1) % n;
      const calls = [];
      let num = 2;
      const msg = el('p', { class: 'reveal hint' }, `Tim ${maker + 1}: susun tiga pemanggilan metode untuk objek a (Angkot, tarif 4.000) dan o (Ojek). Tim ${solver + 1} akan menebak keadaan akhirnya.`);
      const listBox = el('div', { class: 'ko-langkah' });
      const pads = el('div', { class: 'seg' });
      const draw = () => {
        listBox.replaceChildren(...calls.map(([x, m, k]) => el('code', null, `${x}.${m}(${k})`)), ...Array.from({ length: 3 - calls.length }, () => el('code', { class: 'kosong' }, '…')));
        pads.replaceChildren(el('span', { class: 'ko-n' }, 'n = '), ...[1, 2, 3, 4, 5, 6].map((x) => onTap(el('button', { class: `seg-btn ${num === x ? 'on' : ''}`, type: 'button' }, x), () => { num = x; draw(); })),
          ...[['a', 'naik'], ['a', 'turun'], ['o', 'naik'], ['o', 'turun'], ['o', 'antar']].map(([x, m]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${x}.${m}(${num})`), () => { if (calls.length >= 3) return; calls.push([x, m, num]); ctx.sound.tap(); draw(); if (calls.length === 3) setTimeout(() => solve(calls, maker, solver), 600); })));
      };
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Tim ${maker + 1} menyusun pemanggilan`), pads, listBox, msg);
      draw();
    }
    function solve(calls, maker, solver) {
      const run = (v, tweak) => { const o = { a: angkot(), o: ojek() }; for (const [x, m, k] of calls) { call(v, o[x], m, k); if (tweak) tweak(o, x, m, k); } return STATE(o.a, o.o); };
      const right = run('awal');
      const wrong = [...new Set([run('awal', (o, x, m, k) => { if (x === 'a' && m === 'naik') o.a.pendapatan -= k * 4000; }), run('benar'), run('awal', (o, x, m) => { if (m === 'antar') o.o.penumpang += 1; }), run('awal', (o, x, m, k) => { if (m === 'turun') o[x].penumpang += 2 * k; }), run('awal', (o) => { o.a.penumpang += 1; })].filter((s) => s !== right))].slice(0, 3);
      const msg = el('p', { class: 'reveal hint' }, `Tim ${solver + 1}: dengan kelas awal, bagaimana keadaan akhir objek?`);
      wrap.replaceChildren(scoreBar(pts, solver), el('p', { class: 'prompt' }, `Tim ${solver + 1} menebak`), el('div', { class: 'ko-langkah' }, calls.map(([x, m, k]) => el('code', null, `${x}.${m}(${k})`))), classCard('awal'),
        el('div', { class: 'ko-tanya' }, ctx.rand.shuffle([[right, true], ...wrong.map((w) => [w, false])]).map(([label, ok]) => onTap(el('button', { class: 'ko-pilih', type: 'button' }, label), () => {
          if (ok) { pts[solver]++; ctx.sound.good(); say(msg, '', `Benar! Tim ${solver + 1} +1.`); } else { ctx.sound.bad(); say(msg, 'bad', `Belum tepat. Jawabannya: ${right}.`); }
          wrap.querySelectorAll('.ko-pilih').forEach((b) => { b.disabled = true; if (b.textContent === right) b.classList.add('benar'); });
          turn++; setTimeout(make, 3200);
        }))), msg);
    }
    make();
  }
  pickTeams(wrap, 'Tebak Keadaan', start);
}
