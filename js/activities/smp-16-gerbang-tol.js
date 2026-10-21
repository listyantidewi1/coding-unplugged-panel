// Gerbang Tol Otomatis — SMP (13–15 tahun), mesin keadaan hingga. The toll
// gate only remembers its state and moves on events; a 2-7-1 locker lock
// remembers the matching digits so far; a hidden A/B toy machine is guessed
// from experiments and checked on every button sequence up to length 8.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const STATES = ['MENUNGGU', 'MEMERIKSA', 'SALDO KURANG', 'TERBUKA'];
export const EVENTS = ['kartu', 'cukup', 'kurang', 'lewat', 'batal'];
export const MOVES = { MENUNGGU: { kartu: 'MEMERIKSA' }, MEMERIKSA: { cukup: 'TERBUKA', kurang: 'SALDO KURANG', 'waktu habis': 'MENUNGGU' }, 'SALDO KURANG': { kartu: 'MEMERIKSA', batal: 'MENUNGGU' }, TERBUKA: { lewat: 'MENUNGGU' } };
export const nextToll = (s, e, timeout = true) => (e === 'waktu habis' && !timeout ? s : MOVES[s][e] || s);
export function runToll(events) {
  let s = 'MENUNGGU';
  let charged = 0;
  const seen = events.map((e) => { if (s === 'MEMERIKSA' && e === 'cukup') charged++; s = nextToll(s, e); return s; });
  return { seen, charged };
}
export const SEQS = [['kartu', 'cukup', 'lewat'], ['kartu', 'kurang', 'kartu', 'cukup', 'lewat'], ['kartu', 'cukup', 'kartu', 'lewat'], ['kartu', 'kurang', 'batal', 'lewat']];

export const LOCK = ['AWAL', '2', '27', 'TERBUKA'];
export const INPUTS = ['2', '7', '1', 'lainnya'];
export const LOCK_RIGHT = { AWAL: ['2', 'AWAL', 'AWAL', 'AWAL'], 2: ['2', '27', 'AWAL', 'AWAL'], 27: ['2', 'AWAL', 'TERBUKA', 'AWAL'] };
export const LOCK_SARI = { AWAL: ['2', 'AWAL', 'AWAL', 'AWAL'], 2: ['AWAL', '27', 'AWAL', 'AWAL'], 27: ['AWAL', 'AWAL', 'TERBUKA', 'AWAL'] };
export const LOCK_TESTS = ['271', '5271', '2271', '27271', '721', '2771'];
const col = (d) => Math.max(0, INPUTS.indexOf(d)) + (INPUTS.includes(d) ? 0 : 3);
export function runLock(table, digits) {
  let s = 'AWAL';
  return [...digits].map((d) => { if (s !== 'TERBUKA') s = table[s][col(d)]; return s; });
}
export const shouldOpen = (digits) => digits.includes('271');

// Toy machines: { light: [bool…], A: [next…], B: [next…] }, start in state 0.
export const BIMA = { light: [false, true], A: [0, 1], B: [1, 0] };
export const lightAfter = (m, seq) => { let s = 0; for (const c of seq) s = m[c][s]; return m.light[s]; };
// First sequence up to length max where two machines disagree (null if none).
export function differ(m1, m2, max = 8) {
  let level = [''];
  for (let n = 0; n <= max; n++) {
    for (const q of level) if (lightAfter(m1, q) !== lightAfter(m2, q)) return q;
    level = level.flatMap((q) => [`${q}A`, `${q}B`]);
  }
  return null;
}

// State diagram: circles at positions, curved arrows with event labels.
const TOLL_POS = { MENUNGGU: [14, 50], MEMERIKSA: [50, 16], 'SALDO KURANG': [86, 50], TERBUKA: [50, 84] };
const TOLL_EDGES = [['MENUNGGU', 'MEMERIKSA', 'kartu', 0], ['MEMERIKSA', 'TERBUKA', 'cukup', 0], ['MEMERIKSA', 'SALDO KURANG', 'kurang', 7], ['SALDO KURANG', 'MEMERIKSA', 'kartu', 7], ['SALDO KURANG', 'MENUNGGU', 'batal', -10], ['TERBUKA', 'MENUNGGU', 'lewat', 0], ['MEMERIKSA', 'MENUNGGU', 'waktu habis', 9]];
function diagram(pos, edges, { at = null, flash = null } = {}) {
  const R = 11;
  const arrows = edges.map(([a, b, label, bend]) => {
    const [x1, y1] = pos[a];
    const [x2, y2] = pos[b];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const [nx, ny] = [-dy / len, dx / len];
    const cx = (x1 + x2) / 2 + nx * bend;
    const cy = (y1 + y2) / 2 + ny * bend;
    const trim = (x, y, tx, ty) => { const l = Math.hypot(tx - x, ty - y); return [x + ((tx - x) / l) * R, y + ((ty - y) / l) * R]; };
    const [sx, sy] = trim(x1, y1, cx, cy);
    const [ex, ey] = trim(x2, y2, cx, cy);
    const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
    const ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
    const on = flash && flash[0] === a && flash[1] === b;
    return `<path d="M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}" class="${on ? 'on' : ''}" marker-end="url(#gt-${on ? 'on' : 'off'})"/><text x="${lx}" y="${ly}" class="${on ? 'on' : ''}">${label}</text>`;
  }).join('');
  const circles = Object.entries(pos).map(([s, [x, y]]) => `<circle cx="${x}" cy="${y}" r="${R}" class="${s === at ? 'aktif' : ''}"/><text x="${x}" y="${y + 1.2 - (s.split(' ').length - 1) * 1.8}" class="nama ${s === at ? 'aktif' : ''}">${s.split(' ').map((w, i) => `<tspan x="${x}" dy="${i ? 3.6 : 0}">${w}</tspan>`).join('')}</text>`).join('');
  const start = pos.MENUNGGU ? `<path d="M${pos.MENUNGGU[0]} ${pos.MENUNGGU[1] - 24} L${pos.MENUNGGU[0]} ${pos.MENUNGGU[1] - R}" marker-end="url(#gt-off)"/>` : '';
  const d = el('div', { class: 'gt-diagram' });
  d.innerHTML = `<svg viewBox="0 0 100 100"><defs>${['off', 'on'].map((k) => `<marker id="gt-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="${k}"/></marker>`).join('')}</defs>${start}${arrows}${circles}</svg>`;
  return d;
}
const barrier = (open) => el('div', { class: `gt-palang ${open ? 'buka' : ''}` }, el('span', { class: 'gt-tiang' }), el('span', { class: 'gt-lengan' }));

// Transition table with cells that cycle through the states on each tap.
function cycleTable(wrap, ctx, { rows, cols, options, want, given = {}, prompt, onDone, extra }) {
  const vals = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk sel untuk mengganti keadaan berikutnya. Kejadian lain tidak mengubah keadaan.');
  function draw(bad = []) {
    stage.replaceChildren(el('table', { class: 'kls-tabel gt-tabel' }, el('thead', null, el('tr', null, el('th', null, 'Keadaan sekarang'), ...cols.map((c) => el('th', null, c)))),
      el('tbody', null, ...rows.map((r) => el('tr', null, el('th', null, r), ...cols.map((c, j) => {
        const k = `${r}|${j}`;
        if (given[k]) return el('td', { class: 'tetap' }, want[r][j]);
        return el('td', null, onTap(el('button', { class: `gt-sel ${bad.includes(k) ? 'salah' : ''} ${vals[k] ? '' : 'kosong'}`, type: 'button', 'data-k': k }, vals[k] || '…'), () => {
          if (finished) return;
          const i = options.indexOf(vals[k]);
          vals[k] = options[(i + 1) % options.length];
          ctx.sound.tap();
          draw();
        }));
      }))))));
  }
  draw();
  wrap.append(...[el('p', { class: 'prompt' }, prompt), extra ? el('div', { class: 'gt-samping' }, extra, stage) : stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = rows.flatMap((r) => cols.map((_, j) => `${r}|${j}`)).filter((k) => !given[k] && vals[k] !== want[k.split('|')[0]][Number(k.split('|')[1])]);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} sel belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = onDone();
  }, 'primary')), msg].filter(Boolean));
}

// Tap the state after each event (or digit) in turn.
function sequenceRound(wrap, ctx, { items, want, options, prompt, after, done, start = options[0] }) {
  const got = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk keadaan setelah setiap kejadian, berurutan.');
  function draw() {
    stage.replaceChildren(el('div', { class: 'gt-urutan' }, items.map((e, i) => el('div', { class: `gt-langkah ${i === got.length && !finished ? 'kini' : ''}` }, el('b', null, e), el('span', null, got[i] || '…')))),
      el('div', { class: 'opts gt-pilih', style: { '--cols': options.length } }, options.map((o) => onTap(el('button', { class: 'opt', type: 'button', 'data-o': o }, o), () => pick(o)))));
  }
  function pick(o) {
    if (finished) return;
    if (o !== want[got.length]) { msg.className = 'reveal bad'; msg.textContent = `Dari ${got.at(-1) || start} dengan "${items[got.length]}", keadaannya bukan ${o}.`; ctx.mistake(); shake(stage); return; }
    got.push(o);
    ctx.sound.tap();
    msg.className = 'reveal info';
    msg.textContent = `${got.length} dari ${items.length}.`;
    if (got.length === items.length) {
      finished = true;
      draw();
      if (after) { after(wrap); return; }
      msg.className = 'reveal';
      msg.textContent = 'Benar.';
      done();
      return;
    }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, msg);
}

export default {
  id: 'smp-16-gerbang-tol',
  title: 'Gerbang Tol Otomatis',
  topic: 'Mesin keadaan hingga: keadaan, kejadian, dan transisi',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🚧',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mengisi tabel transisi, menjalankan mesin keadaan untuk urutan kejadian, merancang mesin kunci loker, menemukan bug dengan uji yang tepat, dan menebak mesin rahasia dari percobaan.',
  extraModes: [
    { id: 'gerbang', icon: '🚗', label: 'Gerbang Hidup', desc: 'Tekan tombol kejadian; keadaan menyala, palang bergerak, dan saldo dipotong dihitung', create: createGate },
    { id: 'loker', icon: '🔐', label: 'Pembuat Mesin Loker', desc: 'Susun tabel transisi kunci 2-7-1 (atau pakai tabel Sari), lalu uji dengan urutan angka', create: createLocker },
    { id: 'rahasia', icon: '🕵️', label: 'Mesin Rahasia', desc: 'Tim A membuat mesin tombol A/B, tim B bereksperimen dan menyusun tebakan; layar memeriksa semua urutan sampai panjang 8', create: createSecret },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gerbang' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const seqRound = (events, prompt) => sequenceRound(wrap, ctx, { items: events, want: runToll(events).seen, options: STATES, prompt,
        after: (w) => choice(w, { prompt: 'Berapa kali saldo dipotong?', ctx, columns: 3, onRight: next, options: [0, 1, 2].map((n) => ({ label: `${n} kali`, correct: n === runToll(events).charged })) }) });
      if (r === 0) {
        const want = Object.fromEntries(STATES.map((s) => [s, EVENTS.map((e) => nextToll(s, e))]));
        cycleTable(wrap, ctx, { rows: STATES, cols: EVENTS, options: STATES, want, given: { 'MENUNGGU|0': 1, 'MEMERIKSA|1': 1 }, prompt: 'Isi tabel transisi gerbang tol.', extra: diagram(TOLL_POS, TOLL_EDGES.slice(0, 6)), onDone: () => { setTimeout(next, 0); return 'Benar. Sel yang berubah 6, sel yang tetap 14: sama dengan 6 panah di diagram.'; } });
      } else if (r === 1) seqRound(SEQS[1], 'Mulai dari MENUNGGU: kartu, kurang, kartu, cukup, lewat.');
      else if (r === 2) seqRound(SEQS[2], 'Pengemudi gugup: kartu, cukup, kartu, lewat.');
      else if (r === 3) ask('Pada urutan kartu, cukup, kartu, lewat, mengapa penting kartu kedua tidak mengubah keadaan?', [['Supaya saldo tidak terpotong dua kali untuk satu mobil: saat TERBUKA, kartu tidak memicu pemeriksaan baru', true], ['Supaya palang menutup lebih cepat'], ['Karena kartu kedua selalu saldonya kurang'], ['Supaya petugas menekan batal']], 1, diagram(TOLL_POS, TOLL_EDGES.slice(0, 6), { at: 'TERBUKA' }));
      else if (r === 4) ask('Pembaca kartu rusak dan tidak pernah mengirim cukup atau kurang. Gerbang terus di keadaan … dan kejadian "waktu habis" dipasang dari … ke …', [['MEMERIKSA; panah waktu habis dari MEMERIKSA ke MENUNGGU', true], ['MENUNGGU; dari MENUNGGU ke TERBUKA'], ['TERBUKA; dari TERBUKA ke MENUNGGU'], ['SALDO KURANG; dari SALDO KURANG ke MEMERIKSA']], 1, diagram(TOLL_POS, TOLL_EDGES.slice(0, 6), { at: 'MEMERIKSA' }));
      else if (r === 5) cycleTable(wrap, ctx, { rows: ['AWAL', '2', '27'], cols: INPUTS, options: LOCK, want: LOCK_RIGHT, given: { 'AWAL|0': 1, '2|1': 1, '27|2': 1 }, prompt: 'Kunci loker 2-7-1: terbuka begitu tiga angka terakhir adalah 2, 7, 1. Lengkapi tabelnya.', onDone: () => { setTimeout(next, 0); return 'Benar. Sel ("2", 2) dan ("27", 2) ke "2": angka 2 yang baru ditekan bisa menjadi awal kode.'; } });
      else if (r === 6) sequenceRound(wrap, ctx, { items: [...'27271'], want: runLock(LOCK_RIGHT, '27271'), options: LOCK, prompt: 'Uji tabel loker: tekan 2 7 2 7 1. Keadaan setelah setiap angka?', done: next });
      else if (r === 7) ask('Tabel Sari: ("2", 2) → AWAL dan ("27", 2) → AWAL. Urutan mana yang seharusnya membuka loker, tetapi tidak membuka loker Sari?', [['2 2 7 1', true], ['2 7 1'], ['5 2 7 1'], ['7 2 1']], 2,
        el('table', { class: 'kls-tabel gt-tabel' }, el('thead', null, el('tr', null, el('th', null, ''), ...INPUTS.map((c) => el('th', null, c)))), el('tbody', null, ...LOCK.slice(0, 3).map((s) => el('tr', null, el('th', null, s), ...LOCK_SARI[s].map((v) => el('td', null, v)))))));
      else if (r === 8) ask('Mainan Bima: A → mati, B → nyala, BB → mati, AB → nyala, BA → nyala, BAB → mati, ABBA → mati, BBB → nyala. Ramalkan ABABAB dan AABBA.', [['ABABAB nyala, AABBA mati (lampu nyala bila B ditekan ganjil kali)', true], ['ABABAB mati, AABBA nyala'], ['Keduanya nyala'], ['Keduanya mati']]);
      else {
        const events = Array.from({ length: 6 }, () => ctx.rand.pick(EVENTS));
        const res = runToll(events);
        choice(wrap, { prompt: `Mulai dari MENUNGGU: ${events.join(', ')}. Apa keadaan akhirnya?`, ctx, columns: 2, options: STATES.map((st) => ({ label: st, correct: st === res.seen.at(-1) })),
          onRight: () => choice(wrap, { prompt: 'Berapa kali saldo dipotong?', ctx, columns: 4, onRight: next, options: [0, 1, 2, 3].map((n) => ({ label: `${n} kali`, correct: n === res.charged })) }) });
      }
    }
    render();
  },
};

function createGate(root, ctx) {
  const wrap = el('div', { class: 'act gerbang' });
  root.append(wrap);
  let s = 'MENUNGGU';
  let charged = 0;
  let timeout = false;
  let flash = null;
  const log = [];
  function fire(e) {
    const t = nextToll(s, e, timeout);
    if (s === 'MEMERIKSA' && e === 'cukup') { charged++; ctx.sound.good(); } else ctx.sound.tap();
    flash = t !== s ? [s, t] : null;
    log.push(`${e} → ${t}${t === s ? ' (tetap)' : ''}`);
    s = t;
    draw();
  }
  function draw() {
    const events = timeout ? [...EVENTS, 'waktu habis'] : EVENTS;
    wrap.replaceChildren(el('div', { class: 'gt-samping' }, diagram(TOLL_POS, timeout ? TOLL_EDGES : TOLL_EDGES.slice(0, 6), { at: s, flash }),
      el('div', { class: 'gt-kanan' }, barrier(s === 'TERBUKA'), el('p', { class: 'gt-layar' }, s === 'SALDO KURANG' ? 'Saldo kurang' : s === 'MEMERIKSA' ? 'Memeriksa…' : s === 'TERBUKA' ? 'Silakan lewat' : 'Tempel kartu'),
        el('p', { class: 'gt-hitung' }, `Saldo dipotong: ${charged}×`), el('div', { class: 'gt-log small-note' }, ...log.slice(-6).map((l) => el('div', null, l))))),
      el('div', { class: 'kode-baris gt-tombol' }, ...events.map((e) => button(e, () => fire(e), 'primary')),
        button(timeout ? 'Tanpa waktu habis' : 'Tambah waktu habis', () => { timeout = !timeout; draw(); }, 'small'), button('Ulangi', () => { s = 'MENUNGGU'; charged = 0; log.length = 0; flash = null; draw(); }, 'small')));
  }
  draw();
}

function lockEditor(table, onChange) {
  return el('table', { class: 'kls-tabel gt-tabel' }, el('thead', null, el('tr', null, el('th', null, 'Keadaan'), ...INPUTS.map((c) => el('th', null, c)))),
    el('tbody', null, ...LOCK.slice(0, 3).map((s) => el('tr', null, el('th', null, s), ...table[s].map((v, j) => el('td', null, onTap(el('button', { class: 'gt-sel', type: 'button' }, v), () => { table[s][j] = LOCK[(LOCK.indexOf(v) + 1) % LOCK.length]; onChange(); })))))));
}

function createLocker(root, ctx) {
  const wrap = el('div', { class: 'act gerbang' });
  root.append(wrap);
  const copy = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, [...v]]));
  let table = copy(LOCK_SARI);
  let typed = '';
  function draw() {
    const states = runLock(table, typed);
    const now = states.at(-1) || 'AWAL';
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('Tabel Sari', () => { table = copy(LOCK_SARI); draw(); }, 'small'), button('Tabel kosong', () => { table = { AWAL: Array(4).fill('AWAL'), 2: Array(4).fill('AWAL'), 27: Array(4).fill('AWAL') }; draw(); }, 'small'), button('Tabel benar', () => { table = copy(LOCK_RIGHT); draw(); }, 'small')),
      el('div', { class: 'gt-samping' }, el('div', null, lockEditor(table, draw)),
        el('div', { class: 'gt-kanan' }, el('div', { class: `gt-loker ${now === 'TERBUKA' ? 'buka' : ''}` }, now === 'TERBUKA' ? '🔓' : '🔒', el('small', null, now)),
          el('p', { class: 'gt-hitung' }, typed ? `${typed.split('').join(' ')} → ${states.join(', ')}` : 'Tekan angka'),
          el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { typed = (typed + d).slice(-10); ctx.sound.tap(); if (runLock(table, typed).at(-1) === 'TERBUKA') ctx.sound.win(); draw(); })),
            onTap(el('button', { class: 'key wide', type: 'button' }, 'Reset'), () => { typed = ''; draw(); })))),
      el('div', { class: 'gt-uji' }, el('b', null, 'Uji otomatis'), ...LOCK_TESTS.map((t) => {
        const got = runLock(table, t).at(-1) === 'TERBUKA';
        const ok = got === shouldOpen(t);
        return el('span', { class: ok ? 'lulus' : 'gagal' }, `${t.split('').join(' ')}: ${got ? 'terbuka' : 'tertutup'} ${ok ? '✓' : '✗'}`);
      })));
  }
  draw();
}

// Machine editor: number of states, light per state, next state on A and B.
function machineEditor(m, onChange) {
  const n = m.light.length;
  return el('div', { class: 'gt-mesin' }, el('div', { class: 'seg' }, [2, 3].map((k) => onTap(el('button', { class: `seg-btn ${n === k ? 'on' : ''}`, type: 'button' }, `${k} keadaan`), () => {
    while (m.light.length < k) { m.light.push(false); m.A.push(0); m.B.push(0); }
    m.light.length = k; m.A = m.A.slice(0, k).map((v) => v % k); m.B = m.B.slice(0, k).map((v) => v % k);
    onChange();
  }))),
  el('table', { class: 'kls-tabel gt-tabel' }, el('thead', null, el('tr', null, ...['Keadaan', 'Lampu', 'Tombol A →', 'Tombol B →'].map((h) => el('th', null, h)))),
    el('tbody', null, ...m.light.map((on, i) => el('tr', null, el('th', null, `K${i + 1}${i === 0 ? ' (awal)' : ''}`),
      el('td', null, onTap(el('button', { class: 'gt-sel', type: 'button' }, on ? '💡 nyala' : '⚫ mati'), () => { m.light[i] = !on; onChange(); })),
      ...['A', 'B'].map((c) => el('td', null, onTap(el('button', { class: 'gt-sel', type: 'button' }, `K${m[c][i] + 1}`), () => { m[c][i] = (m[c][i] + 1) % n; onChange(); }))))))));
}

function createSecret(root, ctx) {
  const wrap = el('div', { class: 'act gerbang' });
  root.append(wrap);
  const blank = () => ({ light: [false, false], A: [0, 1], B: [0, 1] });
  let secret = blank();
  let guess = blank();
  let phase = 'buat';
  let seq = '';
  const tries = [];
  function draw(result) {
    if (phase === 'buat') {
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim A: buat mesin rahasia (tim B jangan melihat). Keadaan K1 adalah awal.'), machineEditor(secret, () => draw()),
        el('div', { class: 'kode-baris' }, button('Pakai mesin Bima', () => { secret = structuredClone(BIMA); draw(); }, 'small'), button('Sembunyikan dan serahkan ke tim B ➜', () => { phase = 'coba'; seq = ''; tries.length = 0; draw(); }, 'primary')));
      return;
    }
    const lamp = lightAfter(secret, seq);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim B: tekan tombol untuk bereksperimen, lalu susun mesin tebakan.'),
      el('div', { class: 'gt-samping' }, el('div', { class: 'gt-kanan' }, el('div', { class: `gt-lampu ${lamp ? 'nyala' : ''}` }, lamp ? '💡' : '⚫'), el('p', { class: 'gt-hitung' }, seq || '(baru dinyalakan)'),
        el('div', { class: 'kode-baris' }, button('A', () => { seq += 'A'; ctx.sound.tap(); draw(); }, 'primary'), button('B', () => { seq += 'B'; ctx.sound.tap(); draw(); }, 'primary'), button('Catat & matikan', () => { if (seq) tries.push([seq, lamp]); seq = ''; draw(); }, 'small')),
        el('div', { class: 'gt-log small-note' }, ...tries.slice(-8).map(([q, l]) => el('div', null, `${q} → ${l ? 'nyala' : 'mati'}`)))),
      el('div', null, el('b', null, 'Mesin tebakan'), machineEditor(guess, () => draw()))),
      ...[result ? el('p', { class: `reveal ${result.ok ? '' : 'bad'}` }, result.text) : null].filter(Boolean),
      el('div', { class: 'kode-baris' }, button('Periksa tebakan', () => {
        const d = differ(secret, guess);
        if (d === null) { ctx.sound.win(); draw({ ok: true, text: 'Sama! Kedua mesin memberi hasil yang sama untuk semua urutan tombol sampai panjang 8.' }); } else { ctx.sound.bad(); draw({ ok: false, text: `Berbeda untuk "${d || '(tanpa tombol)'}": mesin rahasia ${lightAfter(secret, d) ? 'nyala' : 'mati'}, tebakan ${lightAfter(guess, d) ? 'nyala' : 'mati'}.` }); }
      }, 'primary'), button('Mesin baru', () => { phase = 'buat'; secret = blank(); guess = blank(); draw(); }, 'small')));
  }
  draw();
}
