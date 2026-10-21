// Angka Cek di Sekitar Kita — SMP (13–15 tahun), deteksi kesalahan. A
// library card uses the Luhn way (double every other digit, subtract 9),
// a product barcode the EAN-13 way (weights 1, 3, 1, 3, …). Make check
// digits, check numbers, and find which typos slip through.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const METHODS = {
  luhn: { label: 'Luhn (kartu perpustakaan)', len: 8, mult: (i) => (i % 2 === 0 ? '×2' : '–'), term: (x, i) => (i % 2 === 0 ? (2 * x > 9 ? 2 * x - 9 : 2 * x) : x) },
  ean: { label: 'EAN-13 (kode batang)', len: 13, mult: (i) => (i % 2 ? '×3' : '×1'), term: (x, i) => x * (i % 2 ? 3 : 1) },
  plain: { label: 'jumlah biasa', len: 8, mult: () => '+', term: (x) => x },
};
export const digits = (s) => [...s].map(Number);
export const terms = (m, s) => digits(s).map((x, i) => METHODS[m].term(x, i));
export const total = (m, s) => terms(m, s).reduce((a, b) => a + b, 0);
export const valid = (m, s) => s.length === METHODS[m].len && total(m, s) % 10 === 0;
// The check digit sits at an odd position with weight 1 in both methods.
export const checkDigit = (m, body) => (10 - (total(m, body) % 10)) % 10;
export const swap = (s, i) => s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);

export function makeNumber(rand, m) {
  const body = Array.from({ length: METHODS[m].len - 1 }, (_, i) => (m === 'ean' && i < 3 ? '899'[i] : String(rand.int(i ? 0 : 1, 9)))).join('');
  return body + checkDigit(m, body);
}
// A typo: one wrong digit or two neighbours swapped (always a real change).
export function typo(rand, s) {
  for (;;) {
    if (rand.int(0, 1)) { const i = rand.int(0, s.length - 2); if (s[i] !== s[i + 1]) return swap(s, i); }
    const i = rand.int(0, s.length - 1);
    const d = String((Number(s[i]) + rand.int(1, 9)) % 10);
    return s.slice(0, i) + d + s.slice(i + 1);
  }
}

export default {
  id: 'smp-05-angka-cek',
  title: 'Angka Cek di Sekitar Kita',
  topic: 'Deteksi kesalahan dengan digit cek: Luhn dan EAN-13',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🔢',
  source: { name: 'CS Unplugged: Error Detection and Correction', url: 'https://www.csunplugged.org/en/topics/error-detection-and-correction/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menghitung dan memeriksa digit cek dengan cara Luhn dan EAN-13, menyelidiki salah ketik yang tertangkap dan yang lolos, dan menjelaskan mengapa pengali dibutuhkan.',
  extraModes: [
    { id: 'penghitung', icon: '🧮', label: 'Penghitung Langkah', desc: 'Ketik nomor 8 atau 13 angka; lihat setiap langkah dan keputusannya, atau cari digit ceknya', create: createCalculator },
    { id: 'lab', icon: '🔬', label: 'Laboratorium Salah Ketik', desc: 'Tukar dua angka bersebelahan atau ubah satu angka; catat kesalahan yang lolos', create: createLab },
    { id: 'tim', icon: '🤝', label: 'Salah Ketik Rahasia', desc: 'Tim A membuat salah ketik rahasia, tim B memeriksa dan menebak letaknya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act angka-cek' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 2, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) fillRound(wrap, ctx, { m: 'luhn', body: '1708194', prompt: 'Kartu perpustakaan 1708194?: isi hasil yang digandakan, jumlahnya, lalu digit ceknya.', done: next });
      else if (r === 1) fillRound(wrap, ctx, { m: 'luhn', body: ctx.rand.pick(['3141592', '2718281']), digitOnly: true, prompt: 'Cari digit cek kartu ini.', done: next });
      else if (r === 2) markRound(wrap, ctx, { items: [['luhn', '52034188'], ['luhn', '52534188'], ['luhn', '71628341'], ['luhn', '71682341']], prompt: 'Periksa nomor kartu: benar (✓) atau salah ketik (✗)?', done: next });
      else if (r === 3) ask('Nomor asli 34095521 salah ketik menjadi 34905521. Keduanya berjumlah 30 dengan cara Luhn. Apa artinya?', [['Komputer tidak tahu; angka 0 dan 9 tertukar', true], ['Komputer tahu; angka 0 dan 9 tertukar'], ['Komputer tidak tahu; angka 4 dan 0 tertukar'], ['Tidak ada yang salah ketik']], 1, numberView('luhn', '34905521'));
      else if (r === 4) fillRound(wrap, ctx, { m: 'ean', body: '899123456789', prompt: 'Kode batang keripik 899123456789?: isi hasil yang dikali 3, jumlahnya, lalu digit ceknya.', done: next });
      else if (r === 5) fillRound(wrap, ctx, { m: 'ean', body: '899765432101', digitOnly: true, prompt: 'Cari digit cek kode batang ini.', done: next });
      else if (r === 6) labRound(wrap, ctx, { m: 'ean', start: '8992016382701', goal: 3, swapsOnly: true, done: next });
      else if (r === 7) ask('Pada EAN-13, dua angka bersebelahan yang tertukar tidak ketahuan jika selisih kedua angka itu …', [[5, true], [1], [3], [9]], 4);
      else if (r === 8) ask('Mengapa jumlah biasa (tanpa pengali) tidak bisa mengetahui angka yang tertukar?', [['Urutan tidak mengubah hasil penjumlahan (1 + 2 = 2 + 1)', true], ['Karena angkanya terlalu banyak'], ['Karena jumlahnya selalu kelipatan 10'], ['Karena tidak ada digit cek']], 1);
      else {
        const items = Array.from({ length: 5 }, () => { const m = ctx.rand.pick(['luhn', 'ean']); const s = makeNumber(ctx.rand, m); return [m, ctx.rand.int(0, 1) ? s : typo(ctx.rand, s)]; });
        markRound(wrap, ctx, { items, prompt: 'Tandai kelima nomor ini: benar (✓) atau salah ketik (✗)?', done: next });
      }
    }
    render();
  },
};

function numberView(m, s, { onDigit, onSwap, hi = [] } = {}) {
  const parts = [];
  [...s].forEach((d, i) => {
    const c = el('button', { class: `ck-digit ${hi.includes(i) ? 'hi' : ''}`, type: 'button', 'data-i': i }, d);
    parts.push(onDigit ? onTap(c, () => onDigit(i)) : c);
    if (onSwap && i < s.length - 1) parts.push(onTap(el('button', { class: 'ck-tukar', type: 'button', 'data-swap': i, 'aria-label': `tukar ${i + 1} dan ${i + 2}` }, '⇄'), () => onSwap(i)));
  });
  return el('div', { class: `ck-nomor ${m}` }, parts);
}

// The step table; cells listed in `ask` become input boxes.
function stepTable(m, s, { ask = new Set(), vals = {}, focus, onFocus, showTerms = true, showSum = true }) {
  const t = terms(m, s.replace('?', '0'));
  const head = (label, cells) => el('div', { class: 'ck-baris' }, el('span', { class: 'ck-label' }, label), ...cells);
  const box = (key, text) => onTap(el('button', { class: `ck-isi ${focus === key ? 'fokus' : ''}`, type: 'button', 'data-key': key }, text ?? '…'), () => onFocus(key));
  return el('div', { class: `ck-tabel ${m}` },
    head('Angka', [...s].map((d) => el('span', { class: 'ck-sel' }, d))),
    head(m === 'luhn' ? 'Gandakan' : 'Dikali', [...s].map((_, i) => el('span', { class: 'ck-sel kecil' }, METHODS[m].mult(i)))),
    showTerms ? head('Hasil', [...s].map((d, i) => (d === '?' ? el('span', { class: 'ck-sel' }, '?') : ask.has(`t${i}`) ? box(`t${i}`, vals[`t${i}`]) : el('span', { class: 'ck-sel' }, t[i])))) : null,
    showSum ? el('div', { class: 'ck-jumlah' }, 'Jumlah tanpa ? = ', ask.has('sum') ? box('sum', vals.sum) : el('b', null, t.slice(0, -1).reduce((a, b) => a + b, 0))) : null);
}

function keypad(onDigit, onBack) {
  return el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => onDigit(d))),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}

// Fill the weighted cells, the sum and the check digit (or just the digit).
function fillRound(wrap, ctx, { m, body, digitOnly, prompt, done }) {
  const s = body + '?';
  const t = terms(m, body + '0');
  const ask = new Set(digitOnly ? [] : [...t.keys()].filter((i) => i < body.length && METHODS[m].mult(i) !== '–' && METHODS[m].mult(i) !== '×1').map((i) => `t${i}`).concat(['sum']));
  const want = { sum: t.slice(0, -1).reduce((a, b) => a + b, 0), cek: checkDigit(m, body) };
  t.forEach((v, i) => { want[`t${i}`] = v; });
  const vals = {};
  let focus = digitOnly ? 'cek' : [...ask][0];
  let finished = false;
  const stage = el('div', { class: 'ck-wadah' });
  const msg = el('p', { class: 'reveal info' }, m === 'luhn' ? 'Gandakan angka ke-1, 3, 5, 7; bila lebih dari 9, kurangi 9.' : 'Kalikan bergantian dengan 1 dan 3 dari kiri.');
  function draw(wrong = []) {
    stage.replaceChildren(stepTable(m, s, { ask, vals, focus, onFocus: (k) => { focus = k; draw(); }, showTerms: !digitOnly, showSum: !digitOnly }),
      el('div', { class: 'ck-jumlah' }, 'Digit cek ? = ', onTap(el('button', { class: `ck-isi ${focus === 'cek' ? 'fokus' : ''} ${wrong.includes('cek') ? 'salah' : ''}`, type: 'button', 'data-key': 'cek' }, vals.cek ?? '…'), () => { focus = 'cek'; draw(); })));
    wrong.forEach((k) => stage.querySelector(`[data-key="${k}"]`)?.classList.add('salah'));
  }
  draw();
  const pad = keypad((d) => { if (finished || !focus) return; vals[focus] = Number(String(vals[focus] ?? '') + d) % (focus === 'cek' ? 10 : 1000); ctx.sound.tap(); draw(); }, () => { if (finished || !focus) return; const v = String(vals[focus] ?? ''); vals[focus] = v.length > 1 ? Number(v.slice(0, -1)) : undefined; draw(); });
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const wrong = [...ask, 'cek'].filter((k) => vals[k] !== want[k]);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} isian belum tepat.`; ctx.mistake(); return; }
    finished = true;
    const full = body + want.cek;
    msg.className = 'reveal';
    msg.textContent = `Benar: digit cek ${want.cek}. Nomor ${full} berjumlah ${total(m, full)}, kelipatan 10.`;
    done();
  }, 'primary')), msg);
}

// Mark each number valid (✓) or mistyped (✗).
function markRound(wrap, ctx, { items, prompt, done, onEnd }) {
  const pick = {};
  const rows = el('div', { class: 'ck-daftar' });
  const msg = el('p', { class: 'reveal info' }, 'Jumlahkan dengan caranya masing-masing; benar bila kelipatan 10.');
  let finished = false;
  function draw(wrong = [], reveal = false) {
    rows.replaceChildren(...items.map(([m, s], k) => el('div', { class: `ck-cek ${wrong.includes(k) ? 'salah' : ''}`, 'data-k': k },
      el('small', null, m === 'luhn' ? 'Luhn' : 'EAN-13'), numberView(m, s), reveal ? el('b', { class: 'ck-total' }, total(m, s)) : null,
      ...[['ok', '✓'], ['x', '✗']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${pick[k] === v ? 'on' : ''}`, type: 'button', 'data-v': v }, l), () => { if (finished) return; pick[k] = v; ctx.sound.tap(); draw(); })))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), rows, msg, button('Periksa', () => {
    if (finished) return;
    const wrong = items.map(([m, s], k) => ((pick[k] === 'ok') !== valid(m, s) || !pick[k] ? k : -1)).filter((k) => k >= 0);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} tanda belum tepat.`; ctx.mistake(); return; }
    finished = true;
    draw([], true);
    msg.className = 'reveal';
    msg.textContent = 'Semua tanda benar. Jumlah setiap nomor tampil di sampingnya.';
    (onEnd || done)();
  }, 'primary'));
}

// Swap neighbours (or change a digit) and log which typos slip through.
function labRound(wrap, ctx, { m, start, goal, swapsOnly, done }) {
  let cur = start;
  const caught = [];
  const slipped = [];
  let finished = false;
  const stage = el('div', { class: 'ck-wadah' });
  const log = el('div', { class: 'ck-log' });
  const msg = el('p', { class: 'reveal info' }, swapsOnly ? `Ketuk ⇄ untuk menukar dua angka bersebelahan. Temukan ${goal} pertukaran yang lolos.` : 'Ketuk ⇄ untuk menukar, atau ketuk angka untuk mengubahnya.');
  function record(kind, label, s) {
    const ok = valid(m, s);
    const list = ok ? slipped : caught;
    if (!list.includes(label)) list.push(label);
    msg.className = ok ? 'reveal bad' : 'reveal';
    msg.textContent = `${kind} ${label}: jumlah ${total(m, s)} → ${ok ? 'LOLOS, tidak ketahuan!' : 'ketahuan.'}`;
    if (ok) ctx.sound.bad(); else ctx.sound.good();
  }
  function draw(hi = []) {
    stage.replaceChildren(el('small', null, METHODS[m].label), numberView(m, cur, {
      hi,
      onSwap: (i) => { if (finished) return; if (cur[i] === cur[i + 1]) { msg.className = 'reveal info'; msg.textContent = 'Kedua angka sama, jadi tidak ada yang berubah.'; return; } cur = swap(start, i); record('Tukar', `${start[i]}↔${start[i + 1]} (ke-${i + 1}, ${i + 2})`, cur); draw([i, i + 1]); after(); },
      onDigit: swapsOnly ? null : (i) => { const d = String((Number(cur[i]) + 1) % 10); cur = start.slice(0, i) + d + start.slice(i + 1); if (d === start[i]) { draw(); return; } record('Ubah', `ke-${i + 1}: ${start[i]}→${d}`, cur); draw([i]); },
    }), el('p', { class: 'ck-jumlah' }, `Jumlah ${total(m, cur)} ${valid(m, cur) ? '✓' : '✗'}`), button('Kembalikan', () => { cur = start; draw(); }, 'small'));
    log.replaceChildren(el('div', null, el('b', null, `Lolos (${slipped.length})`), ...slipped.map((x) => el('span', { class: 'lolos' }, x))), el('div', null, el('b', null, `Ketahuan (${caught.length})`), ...caught.slice(-6).map((x) => el('span', null, x))));
  }
  function after() {
    if (!goal || finished || slipped.length < goal) return;
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Pola: ${slipped.join(', ')}. Pertukaran lolos jika selisih kedua angka 5.`;
    done();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Laboratorium salah ketik: kode ${start}.`), el('div', { class: 'ck-lab' }, stage, log), msg);
}

function createCalculator(root, ctx) {
  const wrap = el('div', { class: 'act angka-cek' });
  root.append(wrap);
  let m = 'luhn';
  let typed = '17081944';
  function draw() {
    const len = METHODS[m].len;
    const full = typed.length === len;
    const body = typed.length === len - 1;
    const s = full ? typed : typed.padEnd(len, '?').slice(0, len);
    const known = s.replace(/\?/g, '0');
    const t = terms(m, known);
    let verdict = `Ketik ${len} angka, atau ${len - 1} angka lalu Cari digit cek.`;
    if (full) verdict = `Jumlah ${total(m, typed)} → ${valid(m, typed) ? 'BENAR (kelipatan 10)' : 'SALAH KETIK'}`;
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, ...Object.entries(METHODS).filter(([k]) => k !== 'plain').map(([k, v]) => button(v.label, () => { m = k; typed = ''; draw(); }, k === m ? 'primary small' : 'small'))),
      el('div', { class: `ck-tabel ${m}` },
        el('div', { class: 'ck-baris' }, el('span', { class: 'ck-label' }, 'Angka'), ...[...s].map((d) => el('span', { class: 'ck-sel' }, d))),
        el('div', { class: 'ck-baris' }, el('span', { class: 'ck-label' }, m === 'luhn' ? 'Gandakan' : 'Dikali'), ...[...s].map((_, i) => el('span', { class: 'ck-sel kecil' }, METHODS[m].mult(i)))),
        el('div', { class: 'ck-baris' }, el('span', { class: 'ck-label' }, 'Hasil'), ...[...s].map((d, i) => el('span', { class: `ck-sel ${m === 'luhn' && i % 2 === 0 && 2 * Number(d) > 9 ? 'kurang9' : ''}` }, d === '?' ? '' : t[i])))),
      el('p', { class: valid(m, typed) ? 'reveal' : full ? 'reveal bad' : 'reveal info' }, verdict),
      el('div', { class: 'kode-baris' }, keypad((d) => { if (typed.length < len) { typed += d; ctx.sound.tap(); draw(); } }, () => { typed = typed.slice(0, -1); draw(); }),
        button('Cari digit cek', () => { if (body) { typed += checkDigit(m, typed); ctx.sound.good(); draw(); } }, body ? 'primary' : 'small')),
      el('p', { class: 'small-note' }, m === 'luhn' ? 'Angka ke-1, 3, 5, 7 digandakan; hasil lebih dari 9 dikurangi 9 (ditandai).' : 'Kode Indonesia diawali 899. Semua nomor di sini rekaan.'));
  }
  draw();
}

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act angka-cek' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let m = 'ean';
  function go() {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, button('EAN-13', () => { m = 'ean'; go(); }, m === 'ean' ? 'primary small' : 'small'), button('Luhn', () => { m = 'luhn'; go(); }, m === 'luhn' ? 'primary small' : 'small'), button('Nomor lain', go, 'small')));
    labRound(wrap, ctx, { m, start: m === 'ean' ? (rand.int(0, 2) ? makeNumber(rand, m) : '8992016382701') : rand.pick(['34095521', makeNumber(rand, m), makeNumber(rand, m)]), done() {} });
  }
  go();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act angka-cek' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const score = [0, 0];
  let maker = 0;
  function make() {
    const m = rand.pick(['luhn', 'ean']);
    const start = makeNumber(rand, m);
    let cur = start;
    let changed = [];
    const view = el('div');
    const draw = () => view.replaceChildren(numberView(m, cur, {
      hi: changed,
      onSwap: (i) => { if (start[i] === start[i + 1]) return; cur = swap(start, i); changed = [i, i + 1]; ctx.sound.tap(); draw(); },
      onDigit: (i) => { const d = String((Number(cur[i]) + 1) % 10); cur = start.slice(0, i) + d + start.slice(i + 1); changed = d === start[i] ? [] : [i]; ctx.sound.tap(); draw(); },
    }));
    draw();
    const msg = el('p', { class: 'reveal info' }, `Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`);
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${maker + 1}: buat satu salah ketik rahasia (ketuk angka atau ⇄). Tim ${2 - maker} jangan melihat!`), el('small', null, `${METHODS[m].label} · nomor asli ${start}`), view, msg,
      button('Kirim ke tim lawan ➜', () => { if (!changed.length) { msg.className = 'reveal bad'; msg.textContent = 'Buat satu salah ketik dulu.'; shake(view); return; } check(m, start, cur, changed); }, 'primary'));
  }
  function check(m, start, cur, changed) {
    const reader = 1 - maker;
    const msg = el('p', { class: 'reveal info' }, 'Nomor ini benar atau salah ketik?');
    const finish = (text, who) => { if (who !== null) score[who]++; msg.className = 'reveal'; msg.textContent = `${text} Nomor asli ${start}. Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}.`; ctx.sound.good(); wrap.append(button('Tukar peran ➜', () => { maker = reader; make(); }, 'primary')); };
    const slipped = valid(m, cur);
    let stage = 'decide';
    const view = el('div');
    const draw = () => view.replaceChildren(numberView(m, cur, {
      onDigit: (i) => {
        if (stage !== 'where') return;
        stage = 'end';
        finish(changed.includes(i) ? `Tepat! Angka ke-${i + 1} memang berubah. Tim ${reader + 1} dapat poin.` : `Bukan angka itu. Yang berubah: ke-${changed.map((k) => k + 1).join(' dan ')}.`, changed.includes(i) ? reader : null);
      },
    }));
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${reader + 1}: periksa nomor ${METHODS[m].label} ini.`), view, msg,
      el('div', { class: 'kode-baris' }, button('✓ Benar', () => { if (stage !== 'decide') return; stage = 'end'; finish(slipped ? `Salah ketiknya lolos pemeriksaan! Tim ${maker + 1} dapat poin.` : `Jumlahnya ${total(m, cur)}, bukan kelipatan 10: ini salah ketik.`, slipped ? maker : null); }, 'small'),
        button('✗ Salah ketik', () => { if (stage !== 'decide') return; if (slipped) { stage = 'end'; finish('Jumlahnya kelipatan 10, jadi pemeriksaan tidak bisa tahu.', maker); return; } stage = 'where'; msg.textContent = `Benar, jumlahnya ${total(m, cur)}. Sekarang ketuk angka yang menurutmu berubah.`; }, 'small')));
  }
  make();
}
