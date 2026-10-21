// Diagram Alir Pendaftaran Ekskul — SMP (13–15 tahun), coding. Pupils read the
// OSIS registration flowchart, trace five forms with a token, find the 8 → 9 → 8
// path that never ends (Dodi's form, so Eka is never checked), fix box 9, turn
// the fixed chart into pseudocode, and draw their own chart with a checklist.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pairRound, pickSet, codeView } from './smp-kit.js';

// ekskul: [hari, kuota, terisi]
export const EKSKUL = { Futsal: ['Senin', 24, 24], 'Paduan Suara': ['Senin', 30, 21], Robotik: ['Selasa', 20, 18], Jurnalistik: ['Selasa', 15, 9], 'Tari Tradisional': ['Rabu', 25, 25], PMR: ['Kamis', 30, 12] };
// form: [nama, pilihan, sudah ikut, surat izin]
export const FORMS = [['Ayu', 'Robotik', ['PMR'], true], ['Bima', 'Paduan Suara', ['Futsal', 'Jurnalistik'], true], ['Citra', 'Paduan Suara', ['Futsal'], true], ['Dodi', 'Tari Tradisional', ['PMR'], true], ['Eka', 'Robotik', [], false]];
export const MORE = [['Fajar', 'Robotik', [], true], ['Gita', 'Robotik', ['PMR'], true]];
export const SHAPES = { oval: 'Oval', proses: 'Persegi panjang', io: 'Jajar genjang', kep: 'Belah ketupat' };
export const SHAPE_FN = { oval: 'mulai atau selesai', proses: 'proses atau perhitungan', io: 'masukan atau keluaran', kep: 'keputusan ya/tidak' };

const BASE = [
  [1, 'oval', 'Mulai', { next: 2 }],
  [2, 'kep', 'Masih ada formulir?', { ya: 3, tidak: 14 }],
  [3, 'io', 'Baca formulir: nama, pilihan, ekskul yang sudah diikuti, surat izin', { next: 4 }],
  [4, 'kep', 'Sudah ikut 2 ekskul?', { ya: 5, tidak: 6 }],
  [5, 'io', 'Tampilkan "Maksimal 2 ekskul"', { next: 2 }],
  [6, 'kep', 'Hari latihan pilihan sama dengan hari ekskul yang sudah diikuti?', { ya: 7, tidak: 8 }],
  [7, 'io', 'Tampilkan "Jadwal bentrok, pilih ekskul lain"', { next: 2 }],
  [8, 'kep', 'Kuota pilihan masih ada?', { ya: 10, tidak: 9 }],
  [9, 'proses', 'Tunggu sampai ada kuota', { next: 8 }],
  [10, 'kep', 'Ada surat izin orangtua?', { ya: 12, tidak: 11 }],
  [11, 'io', 'Tampilkan "Bawa surat izin orangtua dulu"', { next: 2 }],
  [12, 'proses', 'terisi pilihan ← terisi pilihan + 1', { next: 13 }],
  [13, 'io', 'Tampilkan "Diterima"', { next: 2 }],
  [14, 'oval', 'Selesai', {}],
];
const FIX9 = [9, 'io', 'Tampilkan "Kuota penuh, masuk daftar tunggu"', { next: 2 }];
export const chart = (fixed) => BASE.map((b) => (fixed && b[0] === 9 ? FIX9 : b));
const OUT = { 5: 'Maksimal 2 ekskul', 7: 'Jadwal bentrok, pilih ekskul lain', 11: 'Bawa surat izin orangtua dulu', 13: 'Diterima' };
export const LOOP = 'tidak berakhir';
export const LIMIT = 20;

// Step machine over a chart and a queue of forms.
export function machine(fixed, forms) {
  const boxes = Object.fromEntries(chart(fixed).map((b) => [b[0], b]));
  const st = { at: 1, queue: forms.map((f) => f), cur: null, terisi: Object.fromEntries(Object.entries(EKSKUL).map(([k, v]) => [k, v[2]])), rows: [], visits: {}, ended: false, stuck: false };
  const outText = (n) => (fixed && n === 9 ? 'Kuota penuh, masuk daftar tunggu' : OUT[n]);
  function decide(n) {
    const f = st.cur;
    if (n === 2) return st.queue.length > 0;
    if (n === 4) return f[2].length >= 2;
    if (n === 6) return f[2].some((e) => EKSKUL[e][0] === EKSKUL[f[1]][0]);
    if (n === 8) return st.terisi[f[1]] < EKSKUL[f[1]][1];
    if (n === 10) return f[3];
    return false;
  }
  function step() {
    if (st.ended || st.stuck) return null;
    const n = st.at; const b = boxes[n]; let ans = null; let out = null; let changed = false;
    if (n === 3) { st.cur = st.queue.shift(); st.rows.push({ name: st.cur[0], path: [2], out: null }); changed = true; st.visits = {}; }
    const row = st.rows[st.rows.length - 1];
    if (row && n !== 2 && row.out === null) row.path.push(n);
    if (b[1] === 'kep') { ans = decide(n); st.at = ans ? b[3].ya : b[3].tidak; }
    else st.at = b[3].next ?? null;
    if (n === 12) { st.terisi[st.cur[1]] += 1; changed = true; }
    if (outText(n)) { out = outText(n); if (row) row.out = out; }
    if (n === 14) st.ended = true;
    st.visits[n] = (st.visits[n] || 0) + 1;
    if (changed) st.visits = { [n]: 1 };
    if (!st.ended && st.visits[n] > LIMIT) { st.stuck = true; if (row) row.out = LOOP; }
    return { n, ans, out };
  }
  return { st, step, boxes };
}

export function runAll(fixed, forms) {
  const m = machine(fixed, forms); let s; let guard = 0;
  do { s = m.step(); guard++; } while (s && guard < 2000);
  return { rows: m.st.rows, terisi: m.st.terisi, stuck: m.st.stuck, ended: m.st.ended, never: m.st.stuck ? m.st.queue.map((f) => f[0]) : [] };
}
export const pathText = (row) => (row.out === LOOP ? `${row.path.slice(0, 7).join(', ')}, …` : row.path.join(', '));

export const PSEUDO = [
  'SELAMA masih ada formulir',
  '    BACA nama, pilihan, diikuti, izin',
  '    JIKA banyak(diikuti) = 2 MAKA',
  '        TAMPILKAN "Maksimal 2 ekskul"',
  '    SELAIN ITU JIKA hari[pilihan] sama dengan hari salah satu ekskul di diikuti MAKA',
  '        TAMPILKAN "Jadwal bentrok, pilih ekskul lain"',
  '    SELAIN ITU JIKA terisi[pilihan] ≥ kuota[pilihan] MAKA',
  '        TAMPILKAN "Kuota penuh, masuk daftar tunggu"',
  '    SELAIN ITU JIKA izin = "belum ada" MAKA',
  '        TAMPILKAN "Bawa surat izin orangtua dulu"',
  '    SELAIN ITU',
  '        terisi[pilihan] ← terisi[pilihan] + 1',
  '        TAMPILKAN "Diterima"',
  'TAMPILKAN "Selesai"',
];
export const BOX_LINE = { 2: [0], 3: [1], 4: [2], 5: [3], 6: [4], 7: [5], 8: [6], 9: [7], 10: [8], 11: [9], 12: [10, 11], 13: [12], 14: [13] };

// --- views ---
function flowView(boxes, { at = null, seen = [], onBox = null, cls = '', bad = [] } = {}) {
  return el('div', { class: `fa-bagan ${cls}`, style: { 'grid-template-rows': `repeat(${Math.max(1, Math.ceil(boxes.length / 2))}, auto)` } }, boxes.map(([n, shape, text, to]) => {
    const arrows = shape === 'kep' ? `ya → ${to.ya ?? '?'} · tidak → ${to.tidak ?? '?'}` : to.next ? `→ ${to.next}` : '';
    const node = el('div', { class: `fa-kotak s-${shape} ${n === at ? 'token' : ''} ${seen.includes(n) ? 'lewat' : ''} ${bad.includes(n) ? 'buruk' : ''}` },
      el('div', { class: 'fa-isi' }, el('b', { class: 'fa-no' }, String(n)), el('span', null, text)), arrows ? el('small', { class: 'fa-panah' }, arrows) : null);
    if (onBox) onTap(node, () => onBox(n));
    return node;
  }));
}
const formText = (f) => `${f[0]}: ${f[1]} · sudah ikut ${f[2].length ? f[2].join(', ') : '–'} · surat izin ${f[3] ? 'ada' : 'belum ada'}`;
const ekskulView = (terisi, hl = null) => el('table', { class: 'fa-tabel' }, el('tr', null, ['Ekskul', 'Hari', 'Kuota', 'Terisi'].map((h) => el('th', null, h))),
  Object.entries(EKSKUL).map(([k, [h, q]]) => el('tr', { class: `${k === hl ? 'hl' : ''} ${terisi[k] >= q ? 'penuh' : ''}` }, el('td', null, k), el('td', null, h), el('td', { class: 'n' }, String(q)), el('td', { class: 'n' }, String(terisi[k])))));
const formsView = (forms) => el('table', { class: 'fa-tabel' }, el('tr', null, ['Nama', 'Pilihan', 'Sudah ikut', 'Surat izin'].map((h) => el('th', null, h))),
  forms.map((f) => el('tr', null, el('td', null, f[0]), el('td', null, f[1]), el('td', null, f[2].join(', ') || '–'), el('td', null, f[3] ? 'ada' : 'belum ada'))));

// Token player: runs the machine with Langkah / Otomatis, shows the log.
function player(fixed, forms, { onEnd = null, auto = false, compact = false } = {}) {
  let m = machine(fixed, forms); let timer = null; let last = null;
  const host = el('div', { class: `fa-main ${compact ? 'ringkas' : ''}` });
  const draw = () => {
    const seen = m.st.rows.length ? m.st.rows[m.st.rows.length - 1].path : [];
    const status = m.st.stuck ? el('p', { class: 'fa-peringatan' }, `⚠ Jalur mungkin tidak berakhir: token melewati kotak yang sama lebih dari ${LIMIT} kali tanpa ada nilai yang berubah.`)
      : m.st.ended ? el('p', { class: 'fa-selesai' }, '✓ Token sampai di Selesai.') : null;
    host.replaceChildren(flowView(chart(fixed), { at: m.st.ended || m.st.stuck ? null : m.st.at, seen, bad: m.st.stuck ? [8, 9] : [] }),
      el('div', { class: 'fa-samping' },
        el('div', { class: 'fa-baris-tombol' }, button('▶ Langkah', () => go(1), 'primary'), button(timer ? '⏸ Berhenti' : '⏩ Otomatis', toggle), button('↺ Ulang', reset)),
        last ? el('p', { class: 'fa-info' }, `Kotak ${last.n}${last.ans === null ? '' : `: ${last.ans ? 'ya' : 'tidak'}`}${last.out ? ` → tampil "${last.out}"` : ''}`) : el('p', { class: 'fa-info' }, 'Token di kotak 1 (Mulai).'),
        m.st.cur ? el('p', { class: 'fa-form' }, `Formulir: ${formText(m.st.cur)}`) : null,
        ...[status].filter(Boolean),
        el('ol', { class: 'fa-log' }, m.st.rows.map((r) => el('li', { class: r.out === LOOP ? 'loop' : '' }, el('b', null, r.name), ` ${r.out === LOOP ? pathText(r) : r.path.length > 12 ? `${r.path.slice(0, 10).join(', ')}, … (${r.path.length} kotak)` : r.path.join(', ')}`, r.out ? el('em', null, r.out === LOOP ? ' berputar terus' : ` "${r.out}"`) : null)),
          (m.st.stuck ? m.st.queue : []).map((f) => el('li', { class: 'loop' }, el('b', null, f[0]), ' tidak pernah diperiksa'))),
        ekskulView(m.st.terisi, m.st.cur?.[1])));
  };
  function go(k) { for (let i = 0; i < k; i++) { const s = m.step(); if (!s) break; last = s; } draw(); if ((m.st.ended || m.st.stuck)) { stop(); onEnd?.(m.st); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; draw(); } }
  function toggle() { if (timer) stop(); else { timer = setInterval(() => go(1), 260); draw(); } }
  function reset() { stop(); m = machine(fixed, forms); last = null; draw(); }
  draw();
  if (auto) toggle();
  host.stop = stop;
  return host;
}

export default {
  id: 'smp-26-diagram-alir',
  title: 'Diagram Alir Pendaftaran Ekskul',
  topic: 'Diagram alir: simbol baku, percabangan dan perulangan, jalur yang tidak pernah berakhir, dan terjemahan ke pseudocode',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🔀',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri diagram alir pendaftaran ekskul OSIS dengan lima formulir, temukan jalur yang tidak pernah berakhir, perbaiki diagramnya, lalu terjemahkan menjadi pseudocode.',
  extraModes: [
    { id: 'jalankan', icon: '🔴', label: 'Jalankan dengan Data', desc: 'Pilih diagram lama atau yang sudah diperbaiki, lalu token berjalan mengikuti panah; kotak yang dilewati menyala dan jalur tak berakhir diberi peringatan', create: createRun },
    { id: 'pseudocode', icon: '📝', label: 'Ke Pseudocode', desc: 'Diagram yang sudah diperbaiki berdampingan dengan pseudocode; ketuk kotak untuk menyorot baris yang sama', create: createPseudo },
    { id: 'susun', icon: '✏️', label: 'Penyusun Diagram', desc: 'Susun kotak oval, persegi panjang, jajar genjang, dan belah ketupat, hubungkan dengan panah, lalu periksa dengan daftar periksa', create: createBuilder },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Formulir Pengecoh', desc: 'Satu tim membuat formulir pengecoh, tim lain menebak hasilnya sebelum token dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act diagram-alir' });
    root.append(wrap);
    const all = runAll(false, FORMS); const fix = runAll(true, FORMS); const more = runAll(true, [...FORMS, ...MORE]);
    const row = (res, name) => res.rows.find((r) => r.name === name);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const small = (fixed = false, opts = {}) => flowView(chart(fixed), { cls: 'kecil', ...opts });
      if (r === 0) pairRound(wrap, ctx, { prompt: 'Pasangkan setiap bentuk dengan fungsinya', left: Object.keys(SHAPES).map((k) => [k, SHAPES[k], k]), texts: SHAPE_FN, finalMsg: 'Bentuk kotak memberi tahu jenis langkahnya sebelum isinya dibaca.', done: next });
      else if (r === 1) pickSet(wrap, ctx, { prompt: 'Ketuk semua kotak keputusan (belah ketupat) di diagram OSIS', items: BASE.map(([n, , t]) => [n, `${n}. ${t}`]), right: [2, 4, 6, 8, 10], why: 'Kotak 2, 4, 6, 8, dan 10 adalah keputusan: masing-masing punya panah "ya" dan "tidak".', done: then(() => ask('Kotak mana saja yang berbentuk jajar genjang (masukan atau keluaran)?', [['3, 5, 7, 11, 13', true], ['9, 12'], ['1, 14'], ['3, 9, 12, 13']], 2, small())) });
      else if (r === 2) {
        const p = player(false, [FORMS[0]], { onEnd: () => setTimeout(then(() => ask('Setelah formulir Ayu diproses, Robotik terisi berapa dari 20?', [[18], [19, true], [20], [21]], 4, el('p', { class: 'fa-info' }, `Jalur Ayu: ${row(all, 'Ayu').path.join(', ')} → "Diterima"`))), 1400) });
        wrap.append(el('p', { class: 'prompt' }, 'Telusuri formulir Ayu: ketuk Langkah sampai token berhenti'), el('p', { class: 'fa-form' }, formText(FORMS[0])), p);
      } else if (r === 3) ask('Formulir Bima: kotak mana yang dilewati dan apa yang ditampilkan?', [[`${row(all, 'Bima').path.join(', ')} → "Maksimal 2 ekskul"`, true], ['2, 3, 4, 6, 7 → "Jadwal bentrok, pilih ekskul lain"'], ['2, 3, 4, 6, 8, 10, 12, 13 → "Diterima"'], ['2, 3, 4, 6, 8, 9 → "Kuota penuh"']], 1, el('div', { class: 'fa-dua' }, small(), formsView(FORMS.slice(1, 2))),
        then(() => ask('Formulir Citra (Paduan Suara, sudah ikut Futsal): apa yang ditampilkan, dan mengapa?', [['"Jadwal bentrok, pilih ekskul lain": Futsal dan Paduan Suara sama-sama hari Senin', true], ['"Diterima": kuota Paduan Suara masih ada'], ['"Maksimal 2 ekskul"'], ['"Bawa surat izin orangtua dulu"']], 1, ekskulView(Object.fromEntries(Object.entries(EKSKUL).map(([k, v]) => [k, v[2]])), 'Paduan Suara'))));
      else if (r === 4) {
        const p = player(false, FORMS.slice(3), { onEnd: () => setTimeout(then(() => ask('Apa yang terjadi pada formulir Dodi dan Eka?', [['Dodi berputar di kotak 8 dan 9 tanpa henti, sehingga formulir Eka tidak pernah diperiksa', true], ['Dodi diterima, Eka diminta membawa surat izin'], ['Dodi masuk daftar tunggu, Eka diterima'], ['Keduanya ditolak karena jadwal bentrok']], 1, el('p', { class: 'fa-peringatan' }, 'Tari Tradisional: 25 dari 25'))), 1600) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan formulir Dodi lalu Eka dengan diagram OSIS (ketuk Otomatis)'), p);
      } else if (r === 5) ask('Mengapa jalur 8 → 9 → 8 tidak pernah berakhir?', [['Di dalam jalur itu tidak ada yang mengubah kuota atau isi ekskul, sehingga jawaban kotak 8 selalu "tidak"', true], ['Karena kotak 9 berbentuk persegi panjang'], ['Karena Dodi sudah ikut 2 ekskul'], ['Karena komputer terlalu lambat']], 1, small(false, { bad: [8, 9] }),
        then(() => ask('Perbaikan kotak 9 mana yang membuat pendaftaran tetap berjalan?', [['Jajar genjang: Tampilkan "Kuota penuh, masuk daftar tunggu", lalu panah ke kotak 2', true], ['Persegi panjang: Tunggu 1 menit, lalu panah ke kotak 8'], ['Tampilkan "Kuota penuh", lalu panah ke kotak 9'], ['Hapus kotak 9 dan biarkan "tidak" dari kotak 8 tanpa panah']])));
      else if (r === 6) {
        const p = player(true, FORMS, { onEnd: () => setTimeout(then(() => ask('Dengan diagram yang sudah diperbaiki, apa hasil Dodi dan Eka?', [['Dodi: "Kuota penuh, masuk daftar tunggu" · Eka: "Bawa surat izin orangtua dulu"', true], ['Dodi: "Diterima" · Eka: "Diterima"'], ['Dodi masih berputar · Eka tidak diperiksa'], ['Dodi: "Jadwal bentrok" · Eka: "Bawa surat izin orangtua dulu"']])), 1400) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan kelima formulir dengan diagram yang sudah diperbaiki'), p);
      } else if (r === 7) ask('Datang Fajar (Robotik, belum ikut ekskul, surat izin ada) lalu Gita (Robotik, ikut PMR, surat izin ada). Apa hasilnya?', [['Fajar: "Diterima" (Robotik 20 dari 20) · Gita: "Kuota penuh, masuk daftar tunggu"', true], ['Fajar: "Diterima" · Gita: "Diterima"'], ['Fajar: "Kuota penuh" · Gita: "Diterima"'], ['Fajar: "Diterima" · Gita: "Jadwal bentrok, pilih ekskul lain"']], 1, el('div', { class: 'fa-dua' }, ekskulView({ ...fix.terisi }, 'Robotik'), formsView(MORE)));
      else if (r === 8) rowsChoose(wrap, ctx, { prompt: 'Lengkapi pseudocode untuk diagram yang sudah diperbaiki', info: 'Setiap keputusan menjadi JIKA … SELAIN ITU JIKA.', rows: [
        ['a', 'SELAIN ITU JIKA … MAKA  (sebelum "Jadwal bentrok")', ['hari[pilihan] sama dengan hari salah satu ekskul di diikuti', 'banyak(diikuti) = 2', 'izin = "ada"'], 'hari[pilihan] sama dengan hari salah satu ekskul di diikuti'],
        ['b', 'SELAIN ITU JIKA terisi[pilihan] … kuota[pilihan] MAKA', ['<', '≥', '='], '≥'],
        ['c', 'SELAIN ITU JIKA … MAKA  (sebelum "Bawa surat izin")', ['izin = "belum ada"', 'izin = "ada"', 'terisi[pilihan] < kuota[pilihan]'], 'izin = "belum ada"'],
        ['d', 'SELAIN ITU: baris sebelum TAMPILKAN "Diterima"', ['terisi[pilihan] ← terisi[pilihan] + 1', 'kuota[pilihan] ← kuota[pilihan] + 1', 'TUNGGU'], 'terisi[pilihan] ← terisi[pilihan] + 1'],
      ], done: next });
      else rowsChoose(wrap, ctx, { prompt: 'Kotak mana menjadi apa di pseudocode?', info: 'Kotak 8 pada diagram yang diperbaiki tidak lagi berputar.', rows: [
        ['2', 'Kotak 2 "Masih ada formulir?"', ['SELAMA', 'JIKA'], 'SELAMA'], ['4', 'Kotak 4 "Sudah ikut 2 ekskul?"', ['SELAMA', 'JIKA'], 'JIKA'],
        ['6', 'Kotak 6 "Hari latihan sama?"', ['SELAMA', 'JIKA'], 'JIKA'], ['8', 'Kotak 8 "Kuota masih ada?" (sudah diperbaiki)', ['SELAMA', 'JIKA'], 'JIKA'], ['10', 'Kotak 10 "Ada surat izin?"', ['SELAMA', 'JIKA'], 'JIKA'],
      ], done: then(() => ask('Diagram lama sama dengan SELAMA terisi[pilihan] ≥ kuota[pilihan] lalu TUNGGU. Mengapa berbahaya di program pendaftaran?', [['Syaratnya tidak pernah berubah selama menunggu, sehingga program macet selamanya dan pendaftar berikutnya tidak dilayani', true], ['Program menjadi terlalu cepat'], ['Kuota otomatis bertambah'], ['Tidak berbahaya, karena nanti pasti ada yang keluar']], 1, codeView(['SELAMA terisi[pilihan] ≥ kuota[pilihan]', '    TUNGGU'], { warn: [0, 1] }))) });
    }
    render();
  },
};

// --- Jalankan dengan data ---
function createRun(root, ctx) {
  const wrap = el('div', { class: 'act diagram-alir' });
  root.append(wrap);
  const pool = [...FORMS, ...MORE];
  let fixed = false; let chosen = new Set(FORMS.map((f) => f[0])); let p = null;
  const draw = () => {
    p?.stop?.();
    const forms = pool.filter((f) => chosen.has(f[0]));
    p = player(fixed, forms);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Jalankan dengan data'),
      el('div', { class: 'fa-baris-tombol' }, el('div', { class: 'seg' }, [[false, 'Diagram lama'], [true, 'Diagram diperbaiki']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${fixed === v ? 'on' : ''}`, type: 'button' }, l), () => { fixed = v; draw(); }))),
        el('div', { class: 'seg' }, pool.map((f) => onTap(el('button', { class: `seg-btn ${chosen.has(f[0]) ? 'on' : ''}`, type: 'button' }, f[0]), () => { chosen.has(f[0]) ? chosen.delete(f[0]) : chosen.add(f[0]); draw(); })))),
      p);
  };
  draw();
}

// --- Ke pseudocode ---
function createPseudo(root, ctx) {
  const wrap = el('div', { class: 'act diagram-alir' });
  root.append(wrap);
  let sel = null;
  const draw = () => {
    const lines = sel ? BOX_LINE[sel] || [] : [];
    const back = (i) => Number(Object.keys(BOX_LINE).find((k) => BOX_LINE[k].includes(i)));
    wrap.replaceChildren(el('p', { class: 'prompt' }, sel ? `Kotak ${sel} ${sel === 1 ? 'tidak punya baris sendiri: program mulai di baris 1.' : `= baris ${lines.map((i) => i + 1).join(' dan ')}`}` : 'Ketuk sebuah kotak atau baris'),
      el('div', { class: 'fa-main' }, flowView(chart(true), { at: sel, onBox: (n) => { sel = n; draw(); } }), el('div', { class: 'fa-samping' }, codeView(PSEUDO, { hl: lines, onLine: (i) => { sel = back(i); draw(); } }),
        el('p', { class: 'fa-info' }, 'Kotak 2 menjadi SELAMA. Kotak 4, 6, 8, dan 10 menjadi JIKA … SELAIN ITU JIKA.'))));
  };
  draw();
}

// --- Penyusun diagram ---
export const LIB = [
  [1, 'oval', 'Mulai', { next: 2 }], [2, 'io', 'Baca kartu perpustakaan', { next: 3 }], [3, 'kep', 'Kartu aktif?', { ya: 5, tidak: 4 }],
  [4, 'io', 'Tampilkan "Aktifkan kartu di meja petugas"', { next: 17 }], [5, 'kep', 'Ada buku terlambat?', { ya: 6, tidak: 7 }], [6, 'io', 'Tampilkan "Kembalikan buku yang terlambat dulu"', { next: 17 }],
  [7, 'proses', 'dibawa ← 0', { next: 8 }], [8, 'kep', 'Masih ingin meminjam buku?', { ya: 9, tidak: 17 }], [9, 'kep', 'dibawa < 3?', { ya: 11, tidak: 10 }],
  [10, 'io', 'Tampilkan "Batas 3 buku"', { next: 17 }], [11, 'io', 'Baca judul buku', { next: 12 }], [12, 'kep', 'Buku tersedia?', { ya: 14, tidak: 13 }],
  [13, 'io', 'Tampilkan "Buku sedang dipinjam"', { next: 8 }], [14, 'proses', 'Catat pinjaman; dibawa ← dibawa + 1', { next: 15 }], [15, 'io', 'Tampilkan tanggal kembali: hari ini + 7 hari', { next: 8 }],
  [17, 'oval', 'Selesai', {}],
];
export function checkChart(boxes) {
  const by = Object.fromEntries(boxes.map((b) => [b[0], b]));
  const isEnd = (b) => b[1] === 'oval' && /selesai/i.test(b[2]);
  const starts = boxes.filter((b) => b[1] === 'oval' && /mulai/i.test(b[2]));
  const ends = boxes.filter(isEnd);
  const outs = (b) => (b[1] === 'kep' ? [b[3].ya, b[3].tidak] : [b[3].next]).filter((x) => by[x]);
  const c1 = starts.length === 1 && ends.length >= 1;
  const c2 = boxes.filter((b) => b[1] === 'kep').every((b) => by[b[3].ya] && by[b[3].tidak] && b[3].ya !== b[3].tidak);
  // every box reachable from Mulai can reach a Selesai, and no non-end box is a dead end
  const reach = new Set(); const stack = starts.map((b) => b[0]);
  while (stack.length) { const n = stack.pop(); if (reach.has(n)) continue; reach.add(n); outs(by[n]).forEach((x) => stack.push(x)); }
  const canEnd = new Set(ends.map((b) => b[0])); let grew = true;
  while (grew) { grew = false; for (const b of boxes) if (!canEnd.has(b[0]) && outs(b).some((x) => canEnd.has(x))) { canEnd.add(b[0]); grew = true; } }
  const dead = boxes.filter((b) => !isEnd(b) && outs(b).length === 0).map((b) => b[0]);
  const stuck = [...reach].filter((n) => !canEnd.has(n));
  const c3 = starts.length === 1 && dead.length === 0 && stuck.length === 0;
  return { c1, c2, c3, dead, stuck, unreached: boxes.filter((b) => !reach.has(b[0])).map((b) => b[0]) };
}
const CHECKS = ['Ada satu Mulai dan setidaknya satu Selesai.', 'Setiap keputusan punya dua panah keluar berlabel "ya" dan "tidak".', 'Setiap jalur bisa sampai ke Selesai, tidak ada jalan buntu.', 'Di setiap perulangan ada sesuatu yang berubah sehingga perulangannya suatu saat berhenti.', 'Setiap bentuk dipakai sesuai fungsinya.'];

function createBuilder(root, ctx) {
  const wrap = el('div', { class: 'act diagram-alir' });
  root.append(wrap);
  let boxes = []; let manual = [null, null];
  const load = (src) => { boxes = src.map(([n, s, t, to]) => [n, s, t, { ...to }]); manual = [null, null]; draw(); };
  const nums = () => boxes.map((b) => b[0]);
  const target = (b, key) => el('label', { class: 'fa-pilih-panah' }, key === 'next' ? '→' : `${key} →`, (() => {
    const s = el('select', { 'aria-label': `panah ${key} dari kotak ${b[0]}` }, el('option', { value: '' }, '–'), nums().filter((n) => n !== b[0]).map((n) => el('option', { value: String(n) }, String(n))));
    s.value = b[3][key] ? String(b[3][key]) : ''; s.addEventListener('change', () => { b[3][key] = s.value ? Number(s.value) : undefined; draw(); }); return s;
  })());
  function draw() {
    const res = checkChart(boxes);
    const auto = [res.c1, res.c2, res.c3];
    const list = el('div', { class: 'fa-daftar' }, boxes.map((b, i) => el('div', { class: `fa-edit s-${b[1]}` }, el('b', null, String(b[0])),
      el('div', { class: 'seg' }, Object.keys(SHAPES).map((s) => onTap(el('button', { class: `seg-btn ${b[1] === s ? 'on' : ''}`, type: 'button', title: SHAPES[s] }, { oval: '⬭', proses: '▭', io: '▱', kep: '◇' }[s]), () => { b[1] = s; b[3] = s === 'kep' ? { ya: b[3].ya ?? b[3].next, tidak: b[3].tidak } : { next: b[3].next ?? b[3].ya }; draw(); }))),
      (() => { const t = el('input', { type: 'text', value: b[2], maxlength: 60, 'aria-label': `isi kotak ${b[0]}`, autocomplete: 'off' }); t.addEventListener('change', () => { b[2] = t.value.slice(0, 60); draw(); }); return t; })(),
      ...(b[1] === 'kep' ? [target(b, 'ya'), target(b, 'tidak')] : [target(b, 'next')]),
      button('✕', () => { boxes.splice(i, 1); draw(); }))));
    const add = button('+ Tambah kotak', () => { const n = Math.max(0, ...nums()) + 1; boxes.push([n, 'proses', '', {}]); draw(); });
    const checks = el('table', { class: 'fa-tabel periksa' }, CHECKS.map((c, i) => {
      const v = i < 3 ? auto[i] : manual[i - 3];
      const cell = el('td', { class: v === true ? 'ok' : v === false ? 'ng' : '' }, i < 3 ? (v ? '✓' : '✗') : el('div', { class: 'seg' }, [[true, '✓'], [false, '✗']].map(([x, l]) => onTap(el('button', { class: `seg-btn ${manual[i - 3] === x ? 'on' : ''}`, type: 'button' }, l), () => { manual[i - 3] = x; draw(); }))));
      return el('tr', null, el('td', { class: 'n' }, String(i + 1)), el('td', null, c), cell);
    }));
    const notes = [res.dead.length ? `Jalan buntu di kotak ${res.dead.join(', ')}.` : '', res.stuck.length ? `Dari kotak ${res.stuck.join(', ')} tidak ada jalan ke Selesai.` : '', res.unreached.length ? `Kotak ${res.unreached.join(', ')} tidak bisa dicapai dari Mulai.` : ''].filter(Boolean).join(' ');
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penyusun diagram alir'),
      el('div', { class: 'fa-baris-tombol' }, button('Contoh perpustakaan', () => load(LIB)), button('Diagram OSIS lama', () => load(chart(false))), button('Mulai kosong', () => load([[1, 'oval', 'Mulai', {}], [2, 'oval', 'Selesai', {}]]))),
      el('div', { class: 'fa-main susun' }, el('div', { class: 'fa-kiri' }, list, add), el('div', { class: 'fa-samping' }, ...[checks, notes ? el('p', { class: 'fa-peringatan' }, notes) : null, flowView(boxes, { cls: 'mini', bad: [...res.dead, ...res.stuck] })].filter(Boolean))));
  }
  load([[1, 'oval', 'Mulai', { next: 2 }], [2, 'kep', 'Hujan?', { ya: 3, tidak: 4 }], [3, 'proses', 'Bawa payung', { next: 4 }], [4, 'proses', 'Berangkat sekolah', { next: 5 }], [5, 'oval', 'Selesai', {}]]);
}

// --- Bergiliran: formulir pengecoh ---
export const RESULTS = ['Diterima', 'Maksimal 2 ekskul', 'Jadwal bentrok, pilih ekskul lain', 'Kuota penuh, masuk daftar tunggu', 'Bawa surat izin orangtua dulu', LOOP];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act diagram-alir' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Formulir pengecoh selesai', pts, again: () => pickTeams(wrap, 'Formulir Pengecoh', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT;
      const f = ['Pendaftar', 'Robotik', [], true]; let fixed = k % 2 === 1;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: susun formulir yang sulit ditebak, lalu ketuk Serahkan.`);
      const host = el('div', { class: 'fa-pengecoh' });
      const draw = () => host.replaceChildren(
        el('div', { class: 'sk-baris' }, el('span', null, 'Diagram'), el('div', { class: 'seg' }, [[false, 'lama'], [true, 'diperbaiki']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${fixed === v ? 'on' : ''}`, type: 'button' }, l), () => { fixed = v; draw(); })))),
        el('div', { class: 'sk-baris' }, el('span', null, 'Pilihan'), el('div', { class: 'seg' }, Object.keys(EKSKUL).map((e) => onTap(el('button', { class: `seg-btn ${f[1] === e ? 'on' : ''}`, type: 'button' }, e), () => { f[1] = e; f[2] = f[2].filter((x) => x !== e); draw(); })))),
        el('div', { class: 'sk-baris' }, el('span', null, 'Sudah ikut (0–2)'), el('div', { class: 'seg' }, Object.keys(EKSKUL).filter((e) => e !== f[1]).map((e) => onTap(el('button', { class: `seg-btn ${f[2].includes(e) ? 'on' : ''}`, type: 'button' }, e), () => { if (f[2].includes(e)) f[2] = f[2].filter((x) => x !== e); else if (f[2].length < 2) f[2] = [...f[2], e]; else shake(host); draw(); })))),
        el('div', { class: 'sk-baris' }, el('span', null, 'Surat izin'), el('div', { class: 'seg' }, [[true, 'ada'], [false, 'belum ada']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${f[3] === v ? 'on' : ''}`, type: 'button' }, l), () => { f[3] = v; draw(); })))),
        ekskulView(Object.fromEntries(Object.entries(EKSKUL).map(([e, v]) => [e, v[2]])), f[1]),
        button('Serahkan ke tim lawan', guess, 'primary'));
      draw();
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} membuat formulir, Tim ${guesser + 1} menebak`), host, msg);
      function guess() {
        const res = runAll(fixed, [f]).rows[0]; const right = res.out;
        say(msg, '', `Tim ${guesser + 1}: diagram ${fixed ? 'diperbaiki' : 'lama'}. Apa hasil formulir ini?`);
        host.replaceChildren(el('p', { class: 'fa-form' }, formText(f)), el('div', { class: 'opts', style: { '--cols': 2 } }, RESULTS.filter((x) => fixed || x !== 'Kuota penuh, masuk daftar tunggu').filter((x) => !fixed || x !== LOOP).map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o === LOOP ? 'Berputar, tidak pernah berakhir' : `"${o}"`)), (e) => {
          if (host.dataset.done) return; host.dataset.done = '1';
          const ok = o === right; if (ok) pts[guesser] += 2; else pts[maker] += 1;
          e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', ok ? `Tepat! Tim ${guesser + 1} +2.` : `Pengecoh berhasil, Tim ${maker + 1} +1. Hasilnya: ${right === LOOP ? 'berputar di kotak 8 dan 9' : `"${right}"`}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker));
          host.append(el('p', { class: 'fa-info' }, `Jalur: ${pathText(res)}`)); k++; setTimeout(turn, 4200);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Formulir Pengecoh', start);
}
