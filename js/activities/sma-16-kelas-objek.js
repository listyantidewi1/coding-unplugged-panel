// Kelas dan Objek: Angkot dan Ojek — SMA/SMK (16–18 tahun), pemrograman berorientasi objek.
// The Python classes run on screen: predict each object's attributes before a
// method call, watch the executed method light up on the class card, and see
// inherited bugs appear in the "awal" and "soal 6" versions.

import { el, onTap, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
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

// Predict-then-run: before each call, players choose the new values of the touched object.
function predictRound(wrap, ctx, { v = 'awal', objs, steps, prompt, done }) {
  let k = 0; let lit = []; let changed = {};
  const stage = el('div', { class: 'ko-papan' });
  const list = el('div', { class: 'ko-langkah' });
  const ask = el('div', { class: 'ko-tanya' });
  const msg = el('p', { class: 'reveal info' });
  const draw = () => {
    stage.replaceChildren(classCard(v, lit), el('div', { class: 'ko-objek-daftar' }, Object.entries(objs).map(([n, o]) => objCard(n, o, changed[n] || []))));
    list.replaceChildren(...steps.map(([n, m, x], j) => el('code', { class: j === k ? 'kini' : j < k ? 'sudah' : '' }, `${n}.${m}(${x})`)));
  };
  const options = (n, m, x) => {
    const o = objs[n]; const keys = watch(o);
    const sim = (ver, tweak) => { const c = { ...o }; call(ver, c, m, x); if (tweak) tweak(c); return keys.map((q) => `${n}.${q} ${fmtNum(c[q])}`).join(' · '); };
    const right = sim(v);
    const cands = [sim(v, (c) => { if (o.cls === A) c.pendapatan = o.pendapatan; else c.jarak_total = o.jarak_total; }), keys.map((q) => `${n}.${q} ${fmtNum(o[q])}`).join(' · '), sim(v, (c) => { c.penumpang = o.penumpang + (m === 'turun' ? x : m === 'antar' ? 1 : -x); }), sim(v, (c) => { c.penumpang += 1; }), sim(v, (c) => { if (o.cls === A) c.pendapatan += o.tarif; else c.jarak_total += 1; })];
    const wrong = [...new Set(cands.filter((c) => c !== right))].slice(0, 3);
    return ctx.rand.shuffle([[right, true], ...wrong.map((w) => [w, false])]);
  };
  const step = () => {
    if (k >= steps.length) { ask.replaceChildren(); done(); return; }
    const [n, m, x] = steps[k];
    msg.textContent = `Sebelum menjalankan ${n}.${m}(${x}): berapa nilai atribut ${n} sesudahnya?`;
    msg.className = 'reveal info';
    ask.replaceChildren(...options(n, m, x).map(([label, ok]) => onTap(el('button', { class: 'ko-pilih', type: 'button' }, label), () => {
      if (!ok) { ctx.mistake(); shake(ask); say(msg, 'bad', 'Belum tepat. Lihat metode mana yang dijalankan objek ini.'); return; }
      const before = { ...objs[n] };
      const r = call(v, objs[n], m, x);
      lit = r.trace; changed = { [n]: attrs(objs[n]).filter((q) => objs[n][q] !== before[q]) };
      ctx.sound.tap(); k++; draw();
      say(msg, '', `${n}.${m}(${x}) menjalankan ${r.trace.map((t) => t.replace('K.', 'Kendaraan.').replace('A.', 'Angkot.').replace('O.', 'Ojek.')).join(' → ')}${r.ret === false ? ' dan mengembalikan False' : r.ret === true ? ' dan mengembalikan True' : ''}.`);
      ask.replaceChildren(); setTimeout(step, 1500);
    })));
  };
  wrap.append(el('p', { class: 'prompt' }, prompt), list, stage, ask, msg);
  draw();
  step();
}

const code = (s) => el('pre', { class: 'ko-kelas kecil' }, s);

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
    const wrap = el('div', { class: 'act kelas-objek' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const card = (v = 'awal') => classCard(v);
      if (r === 0) ask('Apa saja atribut dan metode kelas Kendaraan?', [['Atribut: nomor, kapasitas, penumpang. Metode: __init__, naik, turun', true], ['Atribut: naik, turun. Metode: nomor, kapasitas'], ['Atribut: nomor, trayek, tarif. Metode: naik'], ['Atribut: self, n. Metode: class']], 1, card());
      else if (r === 1) ask('Objek Angkot punya atribut apa saja, dan mengapa ia bisa memakai turun padahal turun tidak ditulis di kelas Angkot?', [['nomor, kapasitas, penumpang (diwarisi) serta trayek, tarif, pendapatan; Angkot turunan Kendaraan, jadi metode yang tidak ditimpa ikut diwarisi', true], ['Hanya trayek, tarif, pendapatan; turun disalin otomatis oleh Python'], ['nomor dan trayek saja; turun tidak bisa dipakai'], ['Semua atribut Ojek juga; karena Ojek dan Angkot bersaudara']], 1, card());
      else if (r === 2) ask('a = Angkot("WS-07", "Terminal–Pasar", 4000). Metode naik mana yang dijalankan saat a.naik(5), dan berapa kapasitas a?', [['naik milik Angkot (menimpa milik Kendaraan; di dalamnya super().naik(n) menjalankan milik Kendaraan); kapasitas 12', true], ['naik milik Kendaraan saja; kapasitas 4000'], ['Keduanya bergantian; kapasitas 1'], ['Tidak ada, karena naik ditulis dua kali; kapasitas 0']], 1, card());
      else if (r === 3) predictRound(wrap, ctx, { objs: { a: angkot(), o: ojek() }, steps: [['a', 'naik', 5], ['a', 'naik', 4], ['a', 'turun', 3], ['o', 'naik', 1], ['a', 'naik', 6], ['o', 'antar', 7], ['a', 'turun', 2]], prompt: 'Jalankan pemanggilan metode soal 3. Tebak dulu, lalu layar menjalankannya.', done: next });
      else if (r === 4) {
        const a = { ...angkot(), penumpang: 10, pendapatan: 60000 }; const o = { ...ojek(), jarak_total: 7 };
        predictRound(wrap, ctx, { objs: { a, o }, steps: [['a', 'naik', 1], ['o', 'naik', 1]], prompt: 'for k in [a, o]: k.naik(1)', done: () => setTimeout(then(() => ask('Mengapa perintah k.naik(1) yang sama menghasilkan perubahan berbeda pada a dan o?', [['Setiap objek menjalankan naik milik kelasnya sendiri (Angkot menambah pendapatan, Ojek tidak): polimorfisme', true], ['Karena a dibuat lebih dulu'], ['Karena Python memilih metode secara acak'], ['Karena o tidak punya metode naik']])), 1800) });
      } else if (r === 5) predictRound(wrap, ctx, { objs: { a: angkot(), o: ojek() }, steps: [['a', 'naik', 8], ['a', 'naik', 6], ['o', 'naik', 2], ['a', 'turun', 15]], prompt: 'Soal 5: objek baru, lalu empat pemanggilan. Keadaan mana yang mustahil?', done: () => setTimeout(then(() => ask('Keadaan mana yang mustahil di dunia nyata?', [['Angkot 14 penumpang (kapasitas 12), ojek 2 penumpang (kapasitas 1), lalu angkot −1 penumpang', true], ['Pendapatan 56.000'], ['Ojek tanpa penumpang'], ['Tidak ada yang mustahil']])), 1800) });
      else if (r === 6) ask('Perbaikan mana untuk naik di kelas Kendaraan yang benar?', [['if self.penumpang + n > self.kapasitas: return False, lalu tambah penumpang dan return True', true], ['if self.penumpang > self.kapasitas: return False, lalu tambah penumpang'], ['tambah penumpang dulu, lalu if self.penumpang > self.kapasitas: return False'], ['if n > self.penumpang: return False, lalu tambah penumpang']], 1, code('def naik(self, n):\n    ...\ndef turun(self, n):\n    if n > self.penumpang:\n        return False\n    self.penumpang = self.penumpang - n\n    return True'));
      else if (r === 7) predictRound(wrap, ctx, { v: 'soal6', objs: { a: angkot() }, steps: [['a', 'naik', 8], ['a', 'naik', 6]], prompt: 'Soal 6: hanya naik milik Kendaraan yang diperbaiki. Jalankan a.naik(8) lalu a.naik(6).', done: () => setTimeout(then(() => ask('Enam penumpang ditolak, tetapi pendapatan tetap bertambah 24.000. Perbaikan naik di kelas Angkot yang benar?', [['if super().naik(n): tambah pendapatan dan return True; selain itu return False', true], ['super().naik(n) lalu tambah pendapatan dua kali'], ['Hapus super().naik(n)'], ['Tambah pendapatan dulu, lalu if super().naik(n): return True']], 1, classCard('soal6', ['A.naik']))), 1800) });
      else if (r === 8) ask('Kelas BusSekolah (gratis, kapasitas 30, berhenti di halte berurutan). Rancangan mana yang paling tepat?', [['class BusSekolah(Kendaraan): __init__ memanggil super().__init__(nomor, 30), menyimpan daftar_halte dan posisi = 0; berangkat() menambah posisi bila belum di halte terakhir', true], ['class BusSekolah: menulis ulang nomor, kapasitas, penumpang tanpa pewarisan, ditambah tarif 0'], ['class BusSekolah(Angkot): super().__init__(nomor, "Sekolah", 30)'], ['class BusSekolah(Kendaraan): tanpa __init__; berangkat() mengubah kapasitas menjadi 30']]);
      else predictRound(wrap, ctx, { objs: { o: ojek() }, steps: [['o', 'antar', 5]], prompt: 'Tantangan: ojek belum membawa penumpang, lalu o.antar(5).', done: () => setTimeout(then(() => ask('Jarak bertambah dan penumpang menjadi −1. Perbaikan antar yang tepat?', [['if self.penumpang == 0: return False; baru tambah jarak_total, turun(1), dan return True', true], ['Tambah jarak_total, lalu if self.penumpang == 0: return False'], ['Ganti turun(1) dengan naik(1)'], ['Hapus baris jarak_total']], 1, classCard('awal', ['O.antar']))), 1800) });
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
