// Tumpukan dan Antrean dalam Kode — SMA/SMK (16–18 tahun), coding. Stack and
// queue as Python classes: the OSIS minutes app with undo and redo, the
// puskesmas queue, a bracket checker, list.pop(0) versus deque.popleft() (fixed
// worksheet times), encapsulation, and a queue made of two stacks.
// All programs run in mini-py; an undo on an empty stack shows a message.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, layar, play } from './misi-kit.js';
import { runPy, makePyRunner, pyRepr } from './mini-py.js';

export const TUMPUKAN = ['class Tumpukan:', '    def __init__(self):', '        self.isi = []', '    def taruh(self, x):', '        self.isi.append(x)', '    def ambil(self):', '        return self.isi.pop()', '    def puncak(self):', '        return self.isi[-1]', '    def kosong(self):', '        return len(self.isi) == 0'];
export const CATATAN = ['class Catatan:', '    def __init__(self):', '        self.teks = ""', '        self.riwayat = Tumpukan()', '    def ketik(self, kata):', '        self.riwayat.taruh(self.teks)', '        self.teks = self.teks + kata', '    def hapus(self, n):', '        self.riwayat.taruh(self.teks)', '        self.teks = self.teks[:-n]', '    def urungkan(self):', '        if not self.riwayat.kosong():', '            self.teks = self.riwayat.ambil()'];
export const PERINTAH = ['c = Catatan()', 'c.ketik("Rapat ")', 'c.ketik("OSIS ")', 'c.ketik("hari Senin")', 'c.hapus(5)', 'c.ketik("Rabu")', 'c.urungkan()', 'c.urungkan()', 'print(c.teks)'];
export const PROG1 = [...TUMPUKAN, ...CATATAN, ...PERINTAH];
// Undo and redo, as in the key of soal 2.
export const ULANGI = ['class Catatan:', '    def __init__(self):', '        self.teks = ""', '        self.riwayat = Tumpukan()', '        self.ulang = Tumpukan()', '    def ketik(self, kata):', '        self.riwayat.taruh(self.teks)', '        self.ulang = Tumpukan()', '        self.teks = self.teks + kata', '    def hapus(self, n):', '        self.riwayat.taruh(self.teks)', '        self.ulang = Tumpukan()', '        self.teks = self.teks[:-n]', '    def urungkan(self):', '        if not self.riwayat.kosong():', '            self.ulang.taruh(self.teks)', '            self.teks = self.riwayat.ambil()', '    def ulangi(self):', '        if not self.ulang.kosong():', '            self.riwayat.taruh(self.teks)', '            self.teks = self.ulang.ambil()'];
export const ANTREAN = ['class Antrean:', '    def __init__(self):', '        self.isi = []', '    def datang(self, x):', '        self.isi.append(x)', '    def layani(self):', '        return self.isi.pop(0)', '    def kosong(self):', '        return len(self.isi) == 0'];
export const KURUNG = ['PASANGAN = {")": "(", "]": "[", "}": "{"}', 'def kurung_seimbang(rumus):', '    t = Tumpukan()', '    for k in rumus:', '        if k in "([{":', '            t.taruh(k)', '        elif k in ")]}":', '            if t.kosong() or t.ambil() != PASANGAN[k]:', '                return False', '    return t.kosong()'];
export const KURUNG_DODI = KURUNG.map((x, i) => (i === 7 ? '            if t.ambil() != PASANGAN[k]:' : i === 9 ? '    return True' : x));
export const DUA = ['class AntreanDuaTumpukan:', '    def __init__(self):', '        self.masuk = Tumpukan()', '        self.keluar = Tumpukan()', '    def datang(self, x):', '        self.masuk.taruh(x)', '    def layani(self):', '        if self.keluar.kosong():', '            while not self.masuk.kosong():', '                self.keluar.taruh(self.masuk.ambil())', '        return self.keluar.ambil()', '    def kosong(self):', '        return self.masuk.kosong() and self.keluar.kosong()'];
export const RUMUS = ['(2 + 3]', '((2 + 3)', '2 + 3)', '{[()]}', '([)]', ''];
const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));

// Run a program and copy chosen values after given top-level lines (objects change in place, so read live).
export function potret(lines, at, read) {
  const r = makePyRunner(lines, { limit: 50000 }); const out = {}; let g;
  do { g = r.gen.next(); if (g.done) break; if (!r.state.frames.length && at.includes(g.value.line)) out[g.value.line] = read(r.state.vars); } while (!r.state.error);
  return { out, st: r.state };
}
const isi = (o) => [...o.attrs.isi];
const err = (st) => (st.error ? `${st.error.type}: ${st.error.message}` : null);
export const cekKurung = (rumus, dodi = false) => { const R = runPy([...TUMPUKAN, ...(dodi ? KURUNG_DODI : KURUNG), `x = kurung_seimbang(${JSON.stringify(rumus)})`], { limit: 20000 }); return R.error ? `${R.error.type}: ${R.error.message}` : pyRepr(R.vars.x); };
// Brackets step by step for the animation: [char, stack after, mismatch?].
export function langkahKurung(rumus, dodi = false) {
  const PAS = { ')': '(', ']': '[', '}': '{' }; const t = []; const steps = [];
  for (const k of rumus) {
    if ('([{'.includes(k)) { t.push(k); steps.push({ k, t: [...t], ok: true }); }
    else if (')]}'.includes(k)) {
      if (!dodi && !t.length) { steps.push({ k, t: [...t], ok: false, msg: 'tumpukan kosong saat bertemu kurung tutup' }); return { steps, hasil: 'False' }; }
      if (dodi && !t.length) { steps.push({ k, t: [...t], ok: false, msg: 'ambil() pada tumpukan kosong' }); return { steps, hasil: 'IndexError: pop from empty list' }; }
      const top = t.pop(); if (top !== PAS[k]) { steps.push({ k, t: [...t], ok: false, msg: `${top} tidak berpasangan dengan ${k}` }); return { steps, hasil: 'False' }; }
      steps.push({ k, t: [...t], ok: true });
    }
  }
  return { steps, hasil: dodi ? 'True' : t.length ? 'False' : 'True', sisa: t };
}

// Worksheet timing table (Python 3.13), milliseconds.
export const WAKTU = [[50000, 214, 1.8], [100000, 874, 3.7], [200000, 3585, 8.0]];

// ---- Permainan: Pabrik Wadah ----
// Factory workers build data containers: an upright stack for the OSIS notes,
// a level queue for the puskesmas, a bracket machine; Si Tangan Kosong keeps
// taking from empty containers.
const HEAD45 = {
  urung: ['Tumpukan Urungkan', 'Jadilah kelas Catatan: taruh teks lama di riwayat, ambil puncaknya saat urungkan.', 'Aplikasi catatan OSIS butuh tombol urungkan!'],
  kosong: ['Serangan Tangan Kosong', 'Baris 23 dihapus. Layani setiap urungkan, lalu pasang lagi penjaganya.', 'Aku tekan urungkan enam kali!'],
  ulangi: ['Tombol Ulangi', 'Dua tumpukan: riwayat dan ulang. Jalankan urungkan, ulangi, dan ketik.', 'Bolak-balik urungkan dan ulangi!'],
  loket: ['Loket Antrean', 'Seret nomor yang datang ke belakang antrean, ketuk yang depan saat layani.', 'Aku layani terus sampai habis!'],
  kurung: ['Mesin Kurung', 'Kurung buka ditaruh, kurung tutup mengambil pasangannya.', 'Kurungnya kucampur aduk!'],
  tabel: ['Tabel Kurung', 'Cap hasil kurung_seimbang, lalu uji versi Dodi.', 'Dodi lupa memeriksa kosong()!'],
  raksasa: ['Antrean Raksasa', 'Layani dengan pop(0): setiap pasien sisanya harus bergeser.', 'Pasiennya ratusan ribu!'],
  waktu: ['Geser atau Tidak', 'Bandingkan pop(0) dengan popleft() dari deque.', 'Antreanku makin panjang…'],
  ganti: ['Ganti Mesin Diam-Diam', 'Ganti isi kelas Antrean dengan deque tanpa mengubah program loket.', 'Program loket jangan sampai rusak!'],
  bos: ['Dua Tumpukan Jadi Antrean', 'Jadilah AntreanDuaTumpukan: masuk dan keluar.', 'Antrean dari dua tumpukan? Mustahil!'],
};
const msg45 = (t) => el('p', { class: 'reveal info' }, t);
const tq = (s) => pyRepr(s, true);
const plate = (name, items, { top = true, cls = '' } = {}) => el('div', { class: `pw45-tumpuk ${cls}`, 'data-drop': name }, el('small', null, name),
  el('div', { class: 'pw45-piring' }, items.length ? items.map((x, i) => el('div', { class: `pw45-kotak ${i === items.length - 1 && top ? 'puncak' : ''}`, 'data-ambil': i === items.length - 1 ? name : null }, typeof x === 'string' ? tq(x) : String(x))).reverse() : el('i', null, 'kosong')));
const HINT45 = { 'taruh:riwayat': 'Sebelum teks berubah, simpan teks lama: seret kartu teks ke tumpukan riwayat.', 'taruh:ulang': 'urungkan menyimpan teks sekarang ke tumpukan ulang dulu.', 'ambil:riwayat': 'Ambil puncak riwayat: ketuk kartu teratasnya.', 'ambil:ulang': 'Ambil puncak tumpukan ulang.', 'kosong:ulang': 'Aksi baru mengosongkan tumpukan ulang.', lewat: 'Tumpukan ulang kosong, jadi if not self.ulang.kosong() salah: tidak terjadi apa-apa.', galat: 'Tumpukan riwayat kosong, dan tanpa baris 23 ambil() tetap dijalankan…' };

// The notes machine: each command is a list of stack actions done by hand.
function notesEngine(area, ctx, { oops }, { msg, stacks, teks, cmds, extra = [], code, onEnd }) {
  let ci = 0; let ai = 0; const S = stacks; let t = teks;
  const left = el('div', { class: 'pw45-kolom' }); const host = el('div', { class: 'pw45-kolom' });
  const draw = () => {
    fill(left, code, el('div', { class: 'pw45-perintah' }, cmds.map((c, k) => el('code', { class: k === ci ? 'aktif' : k < ci ? 'beres' : '' }, c.label))));
    fill(host, el('div', { class: 'pw45-teks-baris' }, el('small', null, 'self.teks'), el('div', { class: 'pw45-teks', 'data-drag': 'teks' }, tq(t))),
      el('div', { class: 'pw45-tumpuk-tumpuk', 'data-act': ci < cmds.length ? cmds[ci].acts[ai] : '' }, Object.keys(S).map((n) => plate(n, S[n]))),
      extra.length ? el('div', { class: 'pw45-tombol' }, extra.map(([k, lab]) => onTap(el('button', { type: 'button', class: 'pw45-pilih', 'data-v': k }, lab), () => act(k)))) : null);
    host.querySelectorAll('[data-ambil]').forEach((p) => onTap(p, () => { if (!host.querySelector('.selected')) act(`ambil:${p.dataset.ambil}`); }));
  };
  function act(a) {
    if (ci >= cmds.length) return; const want = cmds[ci].acts[ai];
    if (a !== want) { oops(); say(msg, 'bad', HINT45[want] || 'Belum tepat.'); return; }
    const [op, nm] = a.split(':');
    if (op === 'taruh') S[nm].push(t); else if (op === 'ambil') t = S[nm].pop(); else if (op === 'kosong') S[nm] = [];
    ctx.sound.tap(); ai++;
    if (ai >= cmds[ci].acts.length) { if (cmds[ci].after) t = cmds[ci].after(t); ci++; ai = 0; }
    draw();
    if (ci >= cmds.length) { duo.classList.add('selesai'); onEnd(t, S); return; }
    say(msg, 'info', ai ? 'Langkah berikutnya untuk perintah yang sama.' : `Sekarang ${cmds[ci].label}.`);
  }
  dnd(host, (card, s) => { if (!s.classList.contains('pw45-tumpuk')) return; act(`taruh:${s.dataset.drop}`); });
  const duo = el('div', { class: 'pw45-dua' }, left, host);
  draw();
  return duo;
}
const ketik = (kata, ulang = false) => ({ label: `c.ketik(${JSON.stringify(kata)})`, acts: ulang ? ['taruh:riwayat', 'kosong:ulang'] : ['taruh:riwayat'], after: (t) => t + kata });
const hapus = (n) => ({ label: `c.hapus(${n})`, acts: ['taruh:riwayat'], after: (t) => t.slice(0, -n) });
const urung = (ulang = false) => ({ label: 'c.urungkan()', acts: ulang ? ['taruh:ulang', 'ambil:riwayat'] : ['ambil:riwayat'] });
export const AWAL45 = { teks: 'Rapat OSIS hari Rabu', riwayat: ['', 'Rapat ', 'Rapat OSIS ', 'Rapat OSIS hari Senin', 'Rapat OSIS hari '] };

// Misi 1: undo with one stack.
function urungRound(area, ctx, { oops, done }) {
  const msg = msg45('Untuk setiap perintah yang menyala, kerjakan langkah tumpukannya. ketik dan hapus menaruh teks lama dulu.');
  const box = el('div', { class: 'pw45-kolom' });
  fill(box, notesEngine(area, ctx, { oops }, { msg, stacks: { riwayat: [] }, teks: '', cmds: [ketik('Rapat '), ketik('OSIS '), ketik('hari Senin'), hapus(5), ketik('Rabu'), urung(), urung()], code: codeView(['def ketik(self, kata):', '    self.riwayat.taruh(self.teks)', '    self.teks = self.teks + kata', 'def urungkan(self):', '    if not self.riwayat.kosong():', '        self.teks = self.riwayat.ambil()'], { labels: ['16', '17', '18', '22', '23', '24'] }),
    onEnd: (t, S) => { say(msg, 'info', 'Semua perintah selesai. Apa yang dicetak baris 33?');
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['print(c.teks) → ', '_'], ['riwayat tersisa ', '_', ' kartu']]), chips: [t, 'Rapat OSIS hari Rabu', 'Rapat OSIS hari ', String(S.riwayat.length), '5'], want: [t, String(S.riwayat.length)],
        hints: ['Dua kali urungkan membatalkan "Rabu" lalu hapus(5).', 'Tujuh perintah: lima menaruh, dua mengambil.'], done: () => { say(msg, '', `${t}. Tumpukan: yang terakhir ditaruh, pertama diambil.`); done(); } })); } }));
  area.append(box, msg);
}

// Misi 1b: the empty-hand attack without line 23.
function kosongRound(area, ctx, { oops, done }) {
  const msg = msg45('Si Tangan Kosong menekan urungkan enam kali. Baris 23 dihapus, jadi tidak ada pemeriksaan kosong().'); const box = el('div', { class: 'pw45-kolom' }); const out = layar();
  const cmds = [...Array(5).fill(0).map(() => urung()), { label: 'c.urungkan()', acts: ['galat'] }];
  fill(box, notesEngine(area, ctx, { oops }, { msg, stacks: { riwayat: [...AWAL45.riwayat] }, teks: AWAL45.teks, cmds, extra: [['lewat', 'tumpukan kosong: lewati'], ['galat', '💥 ambil() dari tumpukan kosong']], code: codeView(['def urungkan(self):', '    self.teks = self.riwayat.ambil()'], { labels: ['22', '24'], warn: [1] }),
    onEnd: () => { say(msg, 'info', 'Program berhenti! Pasang lagi penjaga baris 23.'); box.append(out); play(out, [], { err: 'IndexError: pop from empty list' });
      box.append(fillBoard(ctx, { oops, msg, view: codeFill(['def urungkan(self):', ['    if not self.riwayat.', '_', ':'], '        self.teks = self.riwayat.ambil()'], { labels: ['22', '23', '24'] }), chips: ['kosong()', 'puncak()', 'ambil()'], want: ['kosong()'],
        hints: ['Periksa dulu apakah tumpukannya kosong.'], done: () => { say(msg, '', 'Pemeriksaan di dalam kelas Catatan melindungi setiap program yang memakainya.'); done(); } })); } }));
  area.append(box, msg);
}

// Misi 2: undo and redo with two stacks.
function ulangiRound(area, ctx, { oops, done }) {
  const msg = msg45('Versi baru punya tumpukan ulang. urungkan menaruh teks sekarang ke ulang, lalu mengambil puncak riwayat.'); const box = el('div', { class: 'pw45-kolom' });
  const cmds = [urung(true), urung(true), { label: 'c.ulangi()', acts: ['taruh:riwayat', 'ambil:ulang'] }, ketik('Kamis', true), { label: 'c.ulangi()', acts: ['lewat'] }];
  fill(box, notesEngine(area, ctx, { oops }, { msg, stacks: { riwayat: [...AWAL45.riwayat], ulang: [] }, teks: AWAL45.teks, cmds, extra: [['kosong:ulang', '🗑️ self.ulang = Tumpukan()'], ['lewat', 'ulang kosong: lewati']],
    code: codeView(['def urungkan(self):', '    if not self.riwayat.kosong():', '        self.ulang.taruh(self.teks)', '        self.teks = self.riwayat.ambil()', 'def ulangi(self):', '    if not self.ulang.kosong():', '        self.riwayat.taruh(self.teks)', '        self.teks = self.ulang.ambil()']),
    onEnd: (t) => { say(msg, 'info', 'Selesai. Isi papan pabrik.');
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['teks akhir: ', '_'], ['ketik baru mengosongkan ulang karena ', '_']]), chips: [t, 'Rapat OSIS hari Rabu', '"masa depan" lama sudah ditinggalkan', 'agar memori hemat'], want: [t, '"masa depan" lama sudah ditinggalkan'],
        hints: ['ulangi yang terakhir tidak mengubah apa pun.', 'Tanpa itu, ulangi bisa menimpa "Kamis" dengan "Rabu".'], done: () => { say(msg, '', `${t}: ulangi terakhir tidak berbuat apa-apa karena tumpukan ulang kosong.`); done(); } })); } }));
  area.append(box, msg);
}

// Misi 3: the counter queue.
export const OPS45 = [['d', 101], ['d', 102], ['d', 104], ['l'], ['d', 105], ['l'], ['d', 107], ['l'], ['l'], ['l'], ['x']];
function loketRound(area, ctx, { oops, done }) {
  const msg = msg45('Seret nomor yang datang ke belakang antrean. Saat layani(), ketuk pasien paling depan.'); let k = 0; const q = []; const served = []; const box = el('div', { class: 'pw45-kolom' }); const out = layar();
  const label = ([o, x]) => (o === 'd' ? `q.datang(${x})` : o === 'l' ? 'q.layani()' : 'q.layani()');
  const host = el('div', { class: 'pw45-kolom' });
  const draw = () => {
    fill(host, el('div', { class: 'pw45-perintah baris' }, OPS45.map((op, i) => el('code', { class: i === k ? 'aktif' : i < k ? 'beres' : '' }, label(op)))),
      el('div', { class: 'pw45-antre', 'data-op': k < OPS45.length ? OPS45[k][0] : '' }, el('span', { class: 'pw45-loket' }, '🏥'), q.map((x, i) => el('div', { class: `pw45-kotak ${i === 0 ? 'depan' : ''}`, 'data-depan': i === 0 ? '1' : null }, String(x))), el('div', { class: 'pw45-belakang', 'data-drop': 'belakang' }, '＋ belakang')),
      el('div', { class: 'pw45-baki' }, [101, 102, 103, 104, 105, 106, 107].map((x) => el('div', { class: 'pw45-nomor', 'data-drag': String(x) }, String(x)))),
      el('div', { class: 'pw45-tombol' }, onTap(el('button', { type: 'button', class: 'pw45-pilih', 'data-v': 'galat' }, '💥 antrean kosong'), () => step('x'))), el('small', null, `dilayani: ${served.join(', ') || '-'}`));
    host.querySelectorAll('[data-depan]').forEach((p) => onTap(p, () => { if (!host.querySelector('.selected')) step('l'); }));
  };
  function step(a, x) {
    if (k >= OPS45.length) return; const [o, want] = OPS45[k];
    if (a !== o) { oops(); say(msg, 'bad', o === 'd' ? 'Perintahnya datang: seret nomornya ke belakang.' : o === 'l' ? 'layani() mengambil pasien paling depan.' : 'Antrean masih berisi.'); return; }
    if (o === 'd' && x !== want) { oops(); say(msg, 'bad', `Yang datang nomor ${want}.`); return; }
    if (o === 'd') q.push(x); else if (o === 'l') served.push(q.shift());
    ctx.sound.tap(); k++; draw();
    if (o === 'x') { host.classList.add('selesai'); box.append(out); play(out, [], { err: 'IndexError: pop from empty list' }); finish(); return; }
    say(msg, 'info', k === 9 ? `Dilayani ${served.join(', ')}, sisa ${pyRepr(q)}. Si Tangan Kosong menekan layani() lagi…` : k === 10 ? 'Antrean kosong. Si Tangan Kosong menekan layani() sekali lagi!' : 'Tepat.');
  }
  dnd(host, (card, t) => { if (t.dataset.drop !== 'belakang') return; step('d', +card.dataset.drag); });
  function finish() {
    say(msg, 'info', 'pop(0) pada list kosong: program berhenti. Satu angka menentukan ujungnya.');
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['Tumpukan: isi.pop() mengambil ujung ', '_'], ['Antrean: isi.pop(0) mengambil ujung ', '_']]), chips: ['belakang', 'depan', 'tengah'], want: ['belakang', 'depan'],
      hints: ['Yang terakhir ditaruh.', 'Yang pertama datang.'], done: () => { say(msg, '', 'Dilayani 101, 102, 104, 105, sisa [107]: yang datang pertama dilayani pertama.'); done(); } }));
  }
  draw();
  fill(box, host);
  area.append(box, msg);
}

// Misi 4: the bracket machine.
export const KURUNG45 = ['(2 + 3) * [4 - (1 + 1)]', '([)]'];
function kurungRound(area, ctx, { oops, done }) {
  const msg = msg45('Kurung buka: seret ke tumpukan. Kurung tutup: ketuk puncak bila pasangannya cocok, atau tekan "tidak cocok".'); let ri = 0; let i = 0; let t = []; const box = el('div', { class: 'pw45-kolom' }); const host = el('div', { class: 'pw45-kolom' });
  const PAS = { ')': '(', ']': '[', '}': '{' };
  const skip = () => { const f = KURUNG45[ri]; while (i < f.length && !'([{)]}'.includes(f[i])) i++; };
  const draw = () => {
    const f = KURUNG45[ri]; const end = i >= f.length;
    fill(host, el('div', { class: 'pw45-rumus', 'data-k': end ? '' : f[i] }, [...f].map((c, j) => (j === i && !end ? el('b', { class: 'pw45-kar', 'data-drag': 'k' }, c) : el('span', { class: j < i ? 'lewat' : '' }, c)))),
      el('div', { class: 'pw45-tumpuk-tumpuk' }, plate('t', t)),
      el('div', { class: 'pw45-tombol' }, end ? [['True', 'return t.kosong() → True'], ['False', 'return t.kosong() → False']].map(([v, l]) => onTap(el('button', { type: 'button', class: 'pw45-pilih', 'data-v': v }, l), () => akhir(v)))
        : onTap(el('button', { type: 'button', class: 'pw45-pilih', 'data-v': 'tidak' }, '❌ tidak cocok / kosong: return False'), () => tutup(false))));
    host.querySelectorAll('[data-ambil]').forEach((p) => onTap(p, () => { if (!host.querySelector('.selected')) tutup(true); }));
  };
  function buka() { const c = KURUNG45[ri][i]; if (!'([{'.includes(c)) { oops(); say(msg, 'bad', 'Kurung tutup tidak ditaruh: ia mengambil pasangannya.'); return; } t.push(c); i++; skip(); ctx.sound.tap(); draw(); say(msg, 'info', 'Ditaruh.'); }
  function tutup(cocok) {
    const c = KURUNG45[ri][i]; if (!c || '([{'.includes(c)) { oops(); say(msg, 'bad', 'Kurung buka ditaruh ke tumpukan.'); return; }
    const ok = t.length && t[t.length - 1] === PAS[c];
    if (cocok !== !!ok) { oops(); say(msg, 'bad', ok ? `Puncak ${t[t.length - 1]} berpasangan dengan ${c}.` : t.length ? `Puncak ${t[t.length - 1]} bukan pasangan ${c}.` : 'Tumpukan kosong.'); return; }
    ctx.sound.tap();
    if (!ok) { say(msg, 'info', `${c} tidak punya pasangan di puncak: return False.`); next(); return; }
    t.pop(); i++; skip(); draw(); say(msg, 'info', 'Cocok, pasangan diambil.');
  }
  function akhir(v) { const want = t.length ? 'False' : 'True'; if (v !== want) { oops(); say(msg, 'bad', t.length ? 'Masih ada kurung yang tertinggal.' : 'Tumpukannya kosong.'); return; } ctx.sound.good(); next(); }
  function next() {
    ri++; if (ri < KURUNG45.length) { i = 0; t = []; skip(); draw(); say(msg, 'info', `"${KURUNG45[0]}" seimbang: True. Sekarang "${KURUNG45[1]}".`); return; }
    fill(host, el('div', { class: 'pw45-rumus' }, '"([)]" → False')); say(msg, '', 'Tumpukan cocok untuk kurung: yang terakhir dibuka harus pertama ditutup.'); done();
  }
  dnd(host, (card, s) => { if (s.dataset.drop !== 't') return; buka(); });
  skip(); draw();
  fill(box, host);
  area.append(box, msg);
}

// Misi 4b: stamp the table, then Dodi's version.
function tabelRound(area, ctx, { oops, done }) {
  const msg = msg45('Seret hasil kurung_seimbang ke setiap rumus.'); const box = el('div', { class: 'pw45-kolom' }); const H = RUMUS.map((f) => cekKurung(f));
  fill(box, fillBoard(ctx, { oops, msg, view: rowsView(RUMUS.map((f) => [`"${f}" → `, '_'])), chips: H, want: H, hints: ['] menutup ( : tidak cocok.', 'Satu ( tertinggal.', ') datang saat tumpukan kosong.', 'Bersarang rapi.', ') datang saat puncaknya [.', 'Tidak ada kurung: tumpukan kosong.'],
    done: () => { say(msg, 'info', 'Dodi menghapus t.kosong() di baris 50 dan menulis return True. Ramalkan versinya.');
      const d1 = cekKurung('((2 + 3)', true); const d2 = cekKurung('2 + 3)', true);
      fill(box, codeView(KURUNG_DODI.slice(6), { labels: ['49', '50', '51', '52'], warn: [1, 3] }), fillBoard(ctx, { oops, msg, view: rowsView([['Dodi, "((2 + 3)" → ', '_'], ['Dodi, "2 + 3)" → ', '_']]), chips: [d1, d2, 'False'], want: [d1, d2],
        hints: ['Sisa ( tidak pernah diperiksa: return True.', 'ambil() pada tumpukan kosong.'], done: () => { say(msg, '', 't.kosong() or t.ambil(): or berhenti bila kiri benar, jadi ambil() tidak dijalankan pada tumpukan kosong.'); done(); } })); } }));
  area.append(box, msg);
}

// Misi 5: shifting a list queue by hand.
function raksasaRound(area, ctx, { oops, done }) {
  const msg = msg45('Ketuk pasien depan untuk pop(0). Lalu setiap pasien sisanya harus bergeser satu tempat: ketuk dari depan ke belakang.'); const box = el('div', { class: 'pw45-kolom' });
  let q = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']; let geser = 0; let fase = 'layani'; let k = 0; const host = el('div', { class: 'pw45-kolom' });
  const draw = () => fill(host, el('div', { class: 'pw45-token' }, `🪙 geseran: ${geser}`), el('div', { class: 'pw45-antre', 'data-fase': fase }, el('span', { class: 'pw45-loket' }, '🏥'),
    q.map((x, i) => onTap(el('button', { type: 'button', class: `pw45-kotak ${fase === 'layani' && i === 0 ? 'depan' : ''} ${fase === 'geser' && i < k ? 'sudah' : ''} ${fase === 'geser' && i >= k ? 'belum' : ''}`, 'data-i': String(i) }, `${fase === 'geser' && i >= k ? '◀ ' : ''}${x}`), () => tap(i)))));
  function tap(i) {
    if (fase === 'layani') { if (i !== 0) { oops(); say(msg, 'bad', 'pop(0) mengambil yang paling depan.'); return; } q = q.slice(1); ctx.sound.tap(); if (!q.length) return end(); fase = 'geser'; k = 0; draw(); say(msg, 'info', `Sisa ${q.length} pasien harus bergeser.`); return; }
    if (fase !== 'geser') return;
    if (i !== k) { oops(); say(msg, 'bad', 'Geser dari depan ke belakang, satu per satu.'); return; }
    k++; geser++; ctx.sound.tap();
    if (k < q.length) { draw(); return; }
    fase = 'layani'; draw(); say(msg, 'info', 'Semua sudah bergeser. layani() lagi.');
  }
  function end() {
    fase = 'selesai'; draw(); say(msg, 'info', `Antrean kosong. ${geser} geseran untuk 6 pasien!`);
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['6 pasien: ', '_', ' geseran'], ['n pasien: ', '_', ' geseran']]), chips: [String(geser), '21', '36', 'n(n − 1)/2', 'n²'], want: [String(geser), 'n(n − 1)/2'],
      hints: ['5 + 4 + 3 + 2 + 1.', 'Sama seperti perbandingan pasangan.'], done: () => { say(msg, '', 'Untuk 200.000 pasien: sekitar 20 miliar geseran. Pertumbuhannya kuadrat.'); done(); } }));
  }
  draw();
  fill(box, host);
  area.append(box, msg);
}

// Misi 5b: deque moves a front marker instead.
function waktuRound(area, ctx, { oops, done }) {
  const msg = msg45('deque.popleft() hanya memindahkan penanda depan. Ketuk pasien depan tiga kali.'); const box = el('div', { class: 'pw45-kolom' }); let depan = 0; const q = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  const draw = () => fill(box, el('div', { class: 'pw45-token' }, '🪙 geseran: 0'), el('div', { class: 'pw45-antre' }, el('span', { class: 'pw45-loket' }, '🏥'), q.map((x, i) => onTap(el('button', { type: 'button', class: `pw45-kotak ${i < depan ? 'pergi' : ''} ${i === depan ? 'depan' : ''}`, 'data-i': String(i) }, x), () => tap(i)))));
  function tap(i) {
    if (depan >= 3) return; if (i !== depan) { oops(); say(msg, 'bad', 'popleft() mengambil yang paling depan.'); return; }
    depan++; ctx.sound.tap(); draw();
    if (depan < 3) { say(msg, 'info', 'Tidak ada yang bergeser: hanya penanda depan yang pindah.'); return; }
    say(msg, 'info', 'Tabel waktu lembar kerja (ms). Bila n digandakan, waktunya kira-kira dikali berapa?');
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['list.pop(0): 214 → 874 → 3.585, × ', '_', ' (', '_', ')'], ['deque.popleft(): 1,8 → 3,7 → 8,0, × ', '_', ' (', '_', ')']]), chips: ['4', 'kuadrat', '2', 'linear', '8', 'tetap'], want: ['4', 'kuadrat', '2', 'linear'],
      hints: ['874 / 214 ≈ 4.', 'n(n − 1)/2 geseran.', '3,7 / 1,8 ≈ 2.', 'Satu langkah per pasien.'], done: () => { say(msg, '', 'Untuk antrean raksasa, deque jauh lebih cepat karena tidak ada geseran.'); done(); } }));
  }
  draw();
  area.append(box, msg);
}

// Misi 6: swap the engine; the counter program keeps working.
function gantiRound(area, ctx, { oops, done }) {
  const msg = msg45('Ganti mesin di dalam kelas Antrean. Program loket tidak boleh diubah.'); const box = el('div', { class: 'pw45-kolom' }); const out = layar();
  const D = ['from collections import deque', ...ANTREAN.map((x, i) => (i === 2 ? '        self.isi = deque()' : i === 6 ? '        return self.isi.popleft()' : x))];
  fill(box, el('small', null, 'class Antrean:  (kosong() tetap)'), fillBoard(ctx, { oops, msg, view: codeFill([['from collections import ', '_'], '    def __init__(self):', ['        self.isi = ', '_'], '    def datang(self, x):', '        self.isi.append(x)', '    def layani(self):', ['        return self.isi.', '_']], { labels: ['', '35', '36', '37', '38', '39', '40'] }),
    chips: ['deque', 'deque()', 'popleft()', '[]', 'pop(0)', 'pop()'], want: ['deque', 'deque()', 'popleft()'], hints: ['Impor kelas deque dari collections.', 'Buat deque kosong.', 'popleft() mengambil dari depan tanpa menggeser.'],
    done: () => { const R = runPy([...D, 'q = Antrean()', ...OPS45.slice(0, 9).map(([o, x], i) => (o === 'd' ? `q.datang(${x})` : `x${i} = q.layani()`)), 'print(x3, x5, x7, x8, list(q.isi))'], { limit: 5000 });
      say(msg, 'info', 'Program loket yang sama dijalankan dengan mesin baru…'); fill(box, out); play(out, R.out, { end: () => {
        box.append(fillBoard(ctx, { oops, msg, view: rowsView([['150 pasien sehari dengan list: ', '_', ' geseran'], ['program loket tidak berubah karena ', '_']]), chips: [fmtNum(geserTotal(150)), fmtNum(150 * 150), 'enkapsulasi', 'deque sama dengan list'], want: [fmtNum(geserTotal(150)), 'enkapsulasi'],
          hints: ['150 × 149 / 2.', 'Program loket hanya memakai datang, layani, dan kosong.'], done: () => { say(msg, '', `${fmtNum(geserTotal(150))} geseran masih ringan: list cukup untuk satu puskesmas. Tetapi mesin bisa diganti diam-diam kapan saja.`); done(); } })); } }); } }));
  area.append(box, msg);
}

// Misi Bos: a queue built from two stacks.
export const OPS_BOS = [['d', 1], ['d', 2], ['d', 3], ['l'], ['d', 4], ['l'], ['l'], ['l']];
function bosRound(area, ctx, { oops, done }) {
  const msg = msg45('datang menaruh di masuk. layani: bila keluar kosong, pindahkan semua dari masuk (ketuk puncak masuk), lalu ambil puncak keluar.'); const box = el('div', { class: 'pw45-kolom' });
  let k = 0; const S = { masuk: [], keluar: [] }; const served = []; let afterFirst = null; const host = el('div', { class: 'pw45-kolom' });
  const draw = () => {
    fill(host, el('div', { class: 'pw45-perintah baris' }, OPS_BOS.map(([o, x], i) => el('code', { class: i === k ? 'aktif' : i < k ? 'beres' : '' }, o === 'd' ? `datang(${x})` : 'layani()'))),
      el('div', { class: 'pw45-tumpuk-tumpuk' }, plate('masuk', S.masuk), plate('keluar', S.keluar)), el('div', { class: 'pw45-baki' }, [1, 2, 3, 4].map((x) => el('div', { class: 'pw45-nomor', 'data-drag': String(x) }, String(x)))), el('small', null, `dilayani: ${served.join(', ') || '-'}`));
    host.querySelectorAll('[data-ambil]').forEach((p) => onTap(p, () => { if (!host.querySelector('.selected')) tap(p.dataset.ambil); }));
  };
  let pindah = false;
  function tap(nm) {
    if (k >= OPS_BOS.length) return; const [o] = OPS_BOS[k];
    if (o !== 'l') { oops(); say(msg, 'bad', `Perintahnya datang(${OPS_BOS[k][1]}): seret nomornya ke masuk.`); return; }
    if (nm === 'masuk') { if (S.keluar.length && !pindah) { oops(); say(msg, 'bad', 'keluar belum kosong: ambil langsung dari keluar.'); return; } pindah = true; S.keluar.push(S.masuk.pop()); ctx.sound.tap(); draw(); say(msg, 'info', S.masuk.length ? 'Pindahkan terus sampai masuk kosong.' : 'masuk kosong. Ambil puncak keluar.'); return; }
    if (!S.keluar.length) { oops(); say(msg, 'bad', 'keluar kosong: pindahkan dulu semua dari masuk.'); return; }
    if (pindah && S.masuk.length) { oops(); say(msg, 'bad', 'Pindahkan semua dari masuk dulu.'); return; }
    pindah = false;
    served.push(S.keluar.pop()); k++; ctx.sound.tap(); if (served.length === 1) afterFirst = [...S.keluar]; draw();
    if (k < OPS_BOS.length) { say(msg, 'info', `Dilayani ${served[served.length - 1]}.`); return; }
    say(msg, 'info', `Dilayani ${served.join(', ')}: sama seperti antrean!`);
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['setelah layani() pertama, keluar = [', '_', ', ', '_', '] (puncak di kanan)'], ['setiap nomor dipindah paling banyak ', '_', ' kali']]), chips: [String(afterFirst[0]), String(afterFirst[1]), '1', '2', '4'], want: [String(afterFirst[0]), String(afterFirst[1]), '1'],
      hints: ['3 dipindah pertama, jadi di bawah.', '2 di puncak.', 'Sekali dari masuk ke keluar.'], done: () => { say(msg, '', 'Setiap anggota dipindah paling banyak sekali, jadi rata-rata layani() tetap cepat.'); done(); } }));
  }
  dnd(host, (card, s) => {
    if (k >= OPS_BOS.length) return; const [o, x] = OPS_BOS[k];
    if (o !== 'd') { oops(); say(msg, 'bad', 'Perintahnya layani().'); return; }
    if (s.dataset.drop !== 'masuk') { oops(); say(msg, 'bad', 'datang selalu menaruh di tumpukan masuk.'); return; }
    if (+card.dataset.drag !== x) { oops(); say(msg, 'bad', `Yang datang nomor ${x}.`); return; }
    S.masuk.push(x); k++; ctx.sound.tap(); draw(); say(msg, 'info', 'Ditaruh di masuk.');
  });
  draw();
  fill(box, host);
  area.append(box, msg);
}

export default {
  id: 'sma-45-tumpukan-kode',
  title: 'Tumpukan dan Antrean dalam Kode',
  topic: 'Tumpukan dan antrean sebagai kelas Python: fitur urungkan dan ulangi, antrean loket, pemeriksa tanda kurung, list.pop(0) dan deque.popleft(), serta enkapsulasi',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🥞',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri kelas Tumpukan pada fitur urungkan catatan rapat, tambahkan fitur ulangi, layani antrean puskesmas, periksa tanda kurung, lalu bandingkan list.pop(0) dengan deque.',
  extraModes: [
    { id: 'catatan', icon: '📝', label: 'Aplikasi Catatan', desc: 'Ketik, hapus, urungkan, dan ulangi, sambil melihat tumpukan riwayat dan ulang', create: createNotes },
    { id: 'kurung', icon: '🧮', label: 'Pemeriksa Tanda Kurung', desc: 'Ketik rumus dan lihat setiap tanda kurung masuk atau keluar dari tumpukan, juga pada versi Dodi', create: createBrackets },
    { id: 'geser', icon: '🚶', label: 'pop(0) dan popleft()', desc: 'Lihat semua pasien bergeser setiap kali pop(0) dijalankan, sedangkan popleft() hanya memindahkan penanda depan', create: createShift },
    { id: 'giliran', icon: '🔮', label: 'Tebak Isi Akhir', desc: 'Satu tim menyusun delapan operasi pada tumpukan atau antrean, tim lain menebak isi akhirnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pw45-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pw45-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD45[k];
        foe = el('div', { class: 'pw45-musuh' }, el('b', null, '🫳 Si Tangan Kosong'), el('span', null, ulah));
        wrap.append(el('div', { class: 'pw45-kepala' }, misiHead(no, judul, tujuan, '🥞'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Wadah aman ✓'; next(ms); } });
      if (r === 0) { go('urung', 1); urungRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('kosong', 1); kosongRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('ulangi', 2); ulangiRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('loket', 3); loketRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('kurung', 4); kurungRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('tabel', 4); tabelRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('raksasa', 5); raksasaRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('waktu', 5); waktuRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('ganti', 6); gantiRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

export const geserTotal = (n) => (n * (n - 1)) / 2;

// A stack drawn upright like plates (top at the top), and a queue drawn towards the counter.
export const stackView = (items, { judul = '', kosong = 'kosong', salah = -1 } = {}) => el('div', { class: 'tk-tumpuk' }, el('small', null, judul), el('div', { class: 'tk-piring' }, items.length ? [...items].map((x, i) => el('div', { class: `tk-kotak ${i === salah ? 'salah' : ''} ${i === items.length - 1 ? 'puncak' : ''}` }, typeof x === 'string' ? pyRepr(x, true) : pyRepr(x))).reverse() : el('i', null, kosong)), el('code', null, pyRepr(items)));
export const queueView = (items, { judul = '', depan = 0 } = {}) => el('div', { class: 'tk-antre' }, el('small', null, judul), el('div', { class: 'tk-baris' }, el('span', { class: 'tk-loket' }, '🏥 loket'), items.length ? items.map((x, i) => el('div', { class: `tk-kotak ${i < depan ? 'pergi' : ''} ${i === depan ? 'depan' : ''}` }, pyRepr(x))) : el('i', null, 'kosong')), el('code', null, pyRepr(items.slice(depan))));

// Mock minutes app: the real class runs in mini-py after every button.
function createNotes(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  const KATA = ['Rapat ', 'OSIS ', 'hari Senin', 'Rabu', 'Kamis', '!'];
  let cmds = []; let n = 5; let msg = 'Ketuk kata untuk mengetik.';
  const run = (cs) => { const R = runPy([...TUMPUKAN, ...ULANGI, 'c = Catatan()', ...cs], { limit: 50000 }); const c = R.vars.c; return { teks: c.attrs.teks, riw: isi(c.attrs.riwayat), ul: isi(c.attrs.ulang), err: R.error }; };
  const draw = () => {
    const s = run(cmds);
    const act = (cmd, text) => { cmds.push(cmd); msg = text; ctx.sound.tap(); draw(); };
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Aplikasi catatan rapat OSIS'),
      el('div', { class: 'tk-tiga' }, stackView(s.riw, { judul: 'c.riwayat' }), el('div', { class: 'tk-app' },
        el('div', { class: 'tk-layar' }, s.teks || el('i', null, '(catatan kosong)'), el('span', { class: 'tk-kursor' }, '▏')),
        el('div', { class: 'seg tk-kata' }, KATA.map((k) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `Ketik "${k}"`), () => act(`c.ketik(${JSON.stringify(k)})`, `c.ketik(${JSON.stringify(k)})`)))),
        el('div', { class: 'tk-atur' }, stepper(n, (v) => { n = v; }, { min: 1, max: 10, label: 'n' }), button('⌫ Hapus n huruf', () => act(`c.hapus(${n})`, `c.hapus(${n})`)),
          button('↶ Urungkan', () => { if (!s.riw.length) { msg = 'Tidak ada yang bisa diurungkan: tumpukan riwayat kosong.'; ctx.sound.bad(); draw(); return; } act('c.urungkan()', 'c.urungkan()'); }),
          button('↷ Ulangi', () => { if (!s.ul.length) { msg = 'Tidak ada yang bisa diulangi: tumpukan ulang kosong.'; ctx.sound.bad(); draw(); return; } act('c.ulangi()', 'c.ulangi()'); }),
          button('↺ Mulai lagi', () => { cmds = []; msg = 'Catatan baru.'; draw(); })),
        el('pre', { class: 'tk-keluaran' }, cmds.slice(-6).join('\n') || ' ')), stackView(s.ul, { judul: 'c.ulang' })),
      el('p', { class: `reveal ${msg.startsWith('Tidak ada') ? 'bad' : 'info'}` }, msg));
  };
  draw();
}

// Bracket checker with a typed formula (shown on screen only).
function createBrackets(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  let rumus = '(2 + 3) * [4 - (1 + 1)]'; let dodi = false; let k = 0; let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const draw = () => {
    const S = langkahKurung(rumus, dodi); const s = k > 0 ? S.steps[k - 1] : null; const end = k >= S.steps.length;
    let pos = -1; if (k > 0) { let c = 0; for (let i = 0; i < rumus.length; i++) if ('()[]{}'.includes(rumus[i]) && ++c === k) { pos = i; break; } }
    const input = el('input', { class: 'tk-input', type: 'text', value: rumus, maxlength: 40, 'aria-label': 'rumus', autocomplete: 'off', onchange: (e) => { rumus = e.target.value; k = 0; stop(); draw(); } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pemeriksa tanda kurung'),
      el('div', { class: 'tk-atur' }, input, el('div', { class: 'seg' }, [['benar', false], ['versi Dodi', true]].map(([t, v]) => onTap(el('button', { class: `seg-btn ${dodi === v ? 'on' : ''}`, type: 'button' }, t), () => { dodi = v; k = 0; stop(); draw(); })))),
      el('div', { class: 'seg tk-kata' }, RUMUS.map((f) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `"${f}"`), () => { rumus = f; k = 0; stop(); draw(); }))),
      el('div', { class: 'tk-rumus' }, [...rumus].map((c, i) => el('span', { class: `${'()[]{}'.includes(c) ? 'kurung' : ''} ${i === pos ? (s?.ok ? 'kini' : 'salah') : ''}` }, c === ' ' ? ' ' : c))),
      el('div', { class: 'tk-dua' }, stackView(s ? s.t : [], { judul: 't (tumpukan)' }), el('div', { class: 'tk-samping' },
        el('div', { class: 'kode-baris' }, button('▶ Langkah', () => { if (k < S.steps.length) { k++; draw(); } }, 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', () => { if (timer) { stop(); draw(); return; } timer = setInterval(() => { if (k >= S.steps.length) { stop(); draw(); return; } k++; draw(); }, 700); draw(); }), button('↺ Ulang', () => { k = 0; stop(); draw(); })),
        el('p', { class: 'tk-ket' }, s ? (s.ok ? `${s.k} → ${'([{'.includes(s.k) ? 'taruh' : 'ambil, pasangannya cocok'}` : `${s.k}: ${s.msg}`) : 'Ketuk Langkah.'),
        end ? el('p', { class: `reveal ${S.hasil === 'True' ? 'good' : 'bad'}` }, `kurung_seimbang("${rumus}") → ${cekKurung(rumus, dodi)}`) : el('p', { class: 'tk-ket' }, `${k} dari ${S.steps.length} tanda kurung`))),
      el('p', { class: 'tk-ket' }, 'Rumus hanya tampil di layar dan tidak disimpan.'));
  };
  draw();
  return () => stop();
}

// pop(0) shifts everyone left; popleft() only moves the front marker.
function createShift(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  let n = 6; let served = 0; let geser = 0; let mode = 'list';
  const draw = () => {
    const all = Array.from({ length: n }, (_, i) => 101 + i);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'pop(0) dan popleft()'),
      el('div', { class: 'tk-atur' }, el('div', { class: 'seg' }, [['list', 'list.pop(0)'], ['deque', 'deque.popleft()']].map(([m, t]) => onTap(el('button', { class: `seg-btn ${mode === m ? 'on' : ''}`, type: 'button' }, t), () => { mode = m; served = 0; geser = 0; draw(); }))), stepper(n, (v) => { n = v; served = 0; geser = 0; draw(); }, { min: 2, max: 12, label: 'pasien' })),
      mode === 'list' ? queueView(all.slice(served), { judul: 'self.isi (list): setiap kotak bergeser ke kiri' }) : queueView(all, { judul: 'self.isi (deque): hanya penanda depan yang pindah', depan: served }),
      el('div', { class: 'pk-row tk-atur' }, button('Layani satu', () => { if (served >= n) return; if (mode === 'list') geser += n - served - 1; served++; ctx.sound.tap(); draw(); }, 'primary'), button('Layani semua', () => { while (served < n) { if (mode === 'list') geser += n - served - 1; served++; } draw(); }), button('↺ Ulang', () => { served = 0; geser = 0; draw(); })),
      el('div', { class: 'tk-hitung' }, el('small', null, 'total geseran'), el('b', null, fmtNum(geser)), el('small', null, served >= n ? (mode === 'list' ? `semua dilayani: ${n}(${n} − 1)/2 = ${geserTotal(n)}` : 'semua dilayani tanpa geseran') : `${served} dari ${n} dilayani`)));
  };
  draw();
}

// Team mode: one team builds eight operations, the next team guesses the final contents.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act tumpukan-kode' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = nT * 2; let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Tebak Isi Akhir selesai', pts, again: () => pickTeams(wrap, 'Tebak Isi Akhir', start) }); return; }
      const boss = t % nT; let jenis = 'tumpukan'; let ops = []; let nomor = 1;
      const draw = () => {
        const put = jenis === 'tumpukan' ? 'taruh' : 'datang'; const take = jenis === 'tumpukan' ? 'ambil' : 'layani';
        const hasil = simulate(jenis, ops);
        wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: susun ${ops.length} dari 8 operasi (tim lain jangan melihat)`),
          el('div', { class: 'seg' }, ['tumpukan', 'antrean'].map((j) => onTap(el('button', { class: `seg-btn ${jenis === j ? 'on' : ''}`, type: 'button' }, j), () => { jenis = j; ops = []; nomor = 1; draw(); }))),
          el('div', { class: 'tk-atur' }, button(`${put}(${nomor})`, () => { if (ops.length < 8) { ops.push(['+', nomor]); nomor++; draw(); } }, 'primary'), button(`${take}()`, () => { if (ops.length < 8 && hasil.isi.length) { ops.push(['-']); draw(); } }), button('⌫', () => { const o = ops.pop(); if (o && o[0] === '+') nomor--; draw(); })),
          el('pre', { class: 'tk-keluaran' }, opsText(jenis, ops) || ' '),
          ...(ops.length === 8 ? [button('Selesai ➜ giliran menebak', () => guess(boss, jenis, ops), 'primary')] : []));
      };
      draw();
    }
    function guess(boss, jenis, ops) {
      const who = (boss + 1) % nT; const S = simulate(jenis, ops); const right = pyRepr(S.isi);
      const nums = ops.filter((o) => o[0] === '+').map((o) => o[1]); const alt = [pyRepr(simulate(jenis === 'tumpukan' ? 'antrean' : 'tumpukan', ops).isi), pyRepr(nums.slice(0, S.isi.length)), pyRepr(nums.slice(-S.isi.length || nums.length)), pyRepr([...S.isi].reverse())];
      const opts = [right, ...[...new Set(alt)].filter((a) => a !== right)].slice(0, 4); const shuffled = ctx.rand?.shuffle ? ctx.rand.shuffle(opts) : opts;
      const draw = (pick = null) => wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: tebak isi akhir ${jenis} Tim ${boss + 1}`), el('pre', { class: 'tk-keluaran' }, opsText(jenis, ops)),
        pick == null ? el('div', { class: 'seg tk-kata' }, shuffled.map((o) => onTap(el('button', { class: 'seg-btn', type: 'button' }, o), () => { if (o === right) { pts[who] += 2; ctx.sound.good(); } else ctx.sound.bad(); draw(o); })))
          : el('div', { class: 'tk-dua' }, jenis === 'tumpukan' ? stackView(S.isi, { judul: 'isi akhir' }) : queueView(S.isi, { judul: 'isi akhir' }), el('div', { class: 'tk-samping' }, el('p', { class: `reveal ${pick === right ? 'good' : 'bad'}` }, pick === right ? `Tepat: ${right}. +2` : `Belum tepat: ${pick}. Isi akhirnya ${right}.`), el('p', { class: 'tk-ket' }, `Yang diambil: ${S.keluar.join(', ') || '-'}`), button('Lanjut ➜', () => { t++; step(); }, 'primary'))));
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Tebak Isi Akhir', start);
}
const opsText = (jenis, ops) => ops.map((o) => (o[0] === '+' ? `${jenis === 'tumpukan' ? 't.taruh' : 'q.datang'}(${o[1]})` : `${jenis === 'tumpukan' ? 't.ambil' : 'q.layani'}()`)).join('\n');
// Runs the class from soal 1 or 3 in mini-py.
export function simulate(jenis, ops) {
  const lines = jenis === 'tumpukan' ? [...TUMPUKAN, 'w = Tumpukan()'] : [...ANTREAN, 'w = Antrean()']; const keluar = [];
  ops.forEach((o, i) => lines.push(o[0] === '+' ? `w.${jenis === 'tumpukan' ? 'taruh' : 'datang'}(${o[1]})` : `k${i} = w.${jenis === 'tumpukan' ? 'ambil' : 'layani'}()`));
  const R = runPy(lines, { limit: 5000 }); ops.forEach((o, i) => { if (o[0] === '-' && `k${i}` in R.vars) keluar.push(R.vars[`k${i}`]); });
  return { isi: R.vars.w ? isi(R.vars.w) : [], keluar };
}
