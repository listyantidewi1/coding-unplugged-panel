// Kode Huruf di Balik Layar — SMP (13–15 tahun), bilangan biner dan
// heksadesimal. Letters are 8-bit codes (A = 65, spasi = 32). Translate
// messages written as numbers, bits or hex, add binary numbers column by
// column with carries, watch an 8-lamp scoreboard overflow, and turn lower
// case into upper case by flipping the 32 bit.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const WORDS = ['MAKAN', 'MINUM', 'BUKU', 'PENSIL', 'PASAR', 'SAWAH', 'KOPI', 'NASI', 'SATE', 'BATIK', 'PANTAI', 'KAPAL', 'KERETA', 'HUJAN', 'RUMAH', 'SEPEDA', 'GURU', 'TEMAN', 'BOLA', 'IKAN', 'APEL', 'ROTI', 'TAHU', 'JERUK', 'AYO MAIN', 'AYO MAKAN', 'PULANG'];
const LOWER = ['budi', 'sapi', 'kota', 'desa', 'laut', 'padi', 'meja', 'kuda'];

export const code = (ch) => ch.charCodeAt(0);
export const bin8 = (n) => (n & 255).toString(2).padStart(8, '0');
export const hex2 = (n) => (n & 255).toString(16).toUpperCase().padStart(2, '0');
export const letterOf = (n) => (n === 32 ? 'spasi' : n >= 65 && n <= 90 ? String.fromCharCode(n) : n >= 97 && n <= 122 ? String.fromCharCode(n) : '–');
export const FORMATS = {
  angka: { label: 'kode angka', write: (w) => [...w].map((c) => String(code(c))) },
  biner: { label: 'biner 8 bit', write: (w) => [...w].map((c) => bin8(code(c))) },
  heksa: { label: 'heksadesimal', write: (w) => [...w].map((c) => hex2(code(c))) },
};

// Column-by-column addition: for column i (0 = rightmost) returns the
// written bit and the carry. A carry out of column 7 lands on lamp 9.
export function addSteps(a, b) {
  const steps = [];
  let carry = 0;
  for (let i = 0; i < 8; i++) {
    const s = ((a >> i) & 1) + ((b >> i) & 1) + carry;
    steps.push({ bit: s & 1, carry: s >> 1, cin: carry });
    carry = s >> 1;
  }
  return steps;
}

export default {
  id: 'smp-02-kode-huruf',
  title: 'Kode Huruf di Balik Layar',
  topic: 'Bilangan biner, heksadesimal, dan kode huruf 8 bit',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🔡',
  source: { name: 'CS Unplugged: Binary Numbers', url: 'https://www.csunplugged.org/en/topics/binary-numbers/' },
  rounds: 12,
  maxPlayers: 4,
  goal: 'Murid mengubah huruf menjadi kode angka, 8 bit, dan heksadesimal, menjumlahkan bilangan biner dengan simpanan, menjelaskan luapan pada papan skor 8 bit, dan menemukan bit pembeda huruf besar dan kecil.',
  extraModes: [
    { id: 'pengubah', icon: '🔀', label: 'Pengubah Kode', desc: '8 sakelar bit: lihat bilangan, heksadesimal, dan huruf; atau ketik huruf untuk melihat bitnya', create: createConverter },
    { id: 'kuis', icon: '💬', label: 'Kuis Pesan', desc: 'Pesan acak dalam kode angka, biner, atau heksadesimal; ketik terjemahannya', create: createQuiz },
    { id: 'penjumlah', icon: '➕', label: 'Penjumlah Biner', desc: 'Jumlahkan dua bilangan 8 bit dari kanan; lihat papan skor meluap setelah 255', create: createAdderFree },
    { id: 'besar-kecil', icon: '🔠', label: 'Huruf Besar–Kecil', desc: 'Ketuk satu bit pada setiap huruf kecil agar menjadi huruf besar', create: createCase },
    { id: 'tim', icon: '🤝', label: 'Tim Menyandi, Tim Menerjemah', desc: 'Satu tim menyandikan kata rahasia ke 8 bit, tim lain menerjemahkannya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kode-huruf' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 4, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) messageRound(wrap, ctx, { word: 'SELAMAT', format: 'angka', done: next });
      else if (r === 1) messageRound(wrap, ctx, { word: 'PAGI', format: 'biner', done: next });
      else if (r === 2) messageRound(wrap, ctx, { word: 'JALAN', format: 'heksa', done: next });
      else if (r === 3) ask('Nilai heksadesimal FF dalam biner dan bilangan biasa adalah …', [['11111111 = 255', true], ['11110000 = 240'], ['10101010 = 170'], ['11111111 = 256']], 2);
      else if (r === 4) encodeRound(wrap, ctx, { letter: ctx.rand.pick(LETTERS), done: next });
      else if (r === 5) adderRound(wrap, ctx, { a: 90, b: 55, done: next });
      else if (r === 6) adderRound(wrap, ctx, { a: 100, b: 27, done: next });
      else if (r === 7) adderRound(wrap, ctx, { a: 200, b: 100, prompt: 'Tim Merah punya 200 poin, lalu mendapat 100 poin. Jumlahkan pada papan skor 8 lampu.', done: next });
      else if (r === 8) ask('Papan skor 8 bit menampilkan 255 (11111111). Tim mendapat 1 poin lagi. Papan sekarang menampilkan …', [['00000000 = 0', true], ['100000000 = 256'], ['11111111 = 255'], ['00000001 = 1']], 2);
      else if (r === 9) caseRound(wrap, ctx, { word: 'budi', done: next });
      else if (r === 10) ask('8 bit bisa menyimpan berapa kode berbeda? Apakah cukup untuk aksara Jawa, huruf Arab, huruf Tionghoa, dan emoji?', [['256, tidak cukup', true], ['255, cukup'], ['8, tidak cukup'], ['256, cukup']], 2);
      else {
        const format = ctx.rand.pick(['angka', 'biner', 'heksa']);
        messageRound(wrap, ctx, { word: pickWord(ctx.rand, format), format, done: next });
      }
    }
    render();
  },
};

const pickWord = (rand, format) => rand.pick(WORDS.filter((w) => w.length <= (format === 'biner' ? 5 : 9)));

// On-screen A–Z keyboard with space and backspace.
function keyboard(onKey, onBack) {
  return el('div', { class: 'keys' },
    LETTERS.map((ch) => onTap(el('button', { class: 'key', type: 'button' }, ch), () => onKey(ch))),
    onTap(el('button', { class: 'key wide space', type: 'button', 'aria-label': 'spasi' }, '␣'), () => onKey(' ')),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}

function codeChips(word, format) {
  return el('div', { class: `kode-pesan ${format}` }, FORMATS[format].write(word).map((c) => el('span', { class: 'kode-chip' }, c)));
}

// Show a message in one format; type its translation.
function messageRound(wrap, ctx, { word, format, done, prompt }) {
  let typed = '';
  const shown = el('div', { class: 'ketikan' });
  const msg = el('p', { class: 'reveal info' }, 'Ketik terjemahannya, lalu Periksa.');
  const draw = () => shown.replaceChildren(...(typed ? [...typed].map((c) => el('span', { class: 'slot-letter' }, c === ' ' ? '␣' : c)) : [el('span', { class: 'small-note' }, 'ketik di sini')]));
  draw();
  let finished = false;
  const kb = keyboard((ch) => { if (finished || typed.length >= 12) return; typed += ch; ctx.sound.tap(); draw(); }, () => { if (finished) return; typed = typed.slice(0, -1); draw(); });
  wrap.append(el('p', { class: 'prompt' }, prompt || `Terjemahkan pesan dalam ${FORMATS[format].label} ini.`), codeChips(word, format), shown, msg,
    el('div', { class: 'kode-baris' }, kb, button('Periksa', () => {
      if (finished) return;
      if (typed.trim() !== word) { msg.className = 'reveal bad'; msg.textContent = typed.length === word.length ? 'Ada huruf yang belum tepat. Cocokkan lagi dengan tabel.' : `Pesan ini punya ${word.length} kode, jadi ${word.length} huruf atau spasi.`; shake(shown); ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Benar: ${word}. ${FORMATS.angka.write(word).join(' ')} · ${word.length} byte.`;
      done();
    }, 'primary')),
    el('p', { class: 'small-note tabel-kode' }, 'A = 65, B = 66, … Z = 90, spasi = 32 · nilai tempat 128 64 32 16 8 4 2 1'));
}

function switches(bits, onFlip, { locked = [] } = {}) {
  return el('div', { class: 'saklar-row' }, bits.map((b, i) => {
    const s = el('button', { class: `saklar ${b ? 'on' : ''}`, type: 'button', 'data-bit': i }, el('small', null, 2 ** (7 - i)), b);
    return locked.includes(i) || !onFlip ? s : onTap(s, () => onFlip(i));
  }));
}
const readout = (v) => el('div', { class: 'arti-grid' },
  el('div', { class: 'arti' }, el('small', null, 'Bilangan'), el('b', null, v)),
  el('div', { class: 'arti' }, el('small', null, 'Heksadesimal'), el('b', null, hex2(v)), el('small', null, `${bin8(v).slice(0, 4)} ${bin8(v).slice(4)}`)),
  el('div', { class: 'arti' }, el('small', null, 'Huruf'), el('b', null, letterOf(v))));

// Set 8 switches to a letter's code.
function encodeRound(wrap, ctx, { letter, done }) {
  const bits = Array(8).fill(0);
  const stage = el('div', { class: 'baca-kartu' });
  const msg = el('p', { class: 'reveal info' }, `${letter} = ${code(letter)}. Nyalakan sakelar yang nilainya berjumlah ${code(letter)}.`);
  let finished = false;
  const draw = () => stage.replaceChildren(switches(bits, finished ? null : (i) => { bits[i] = 1 - bits[i]; ctx.sound.tap(); draw(); }), readout(parseInt(bits.join(''), 2)));
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Tulis huruf ${letter} sebagai 8 bit.`), stage, msg, button('Periksa', () => {
    if (finished) return;
    if (bits.join('') !== bin8(code(letter))) { msg.className = 'reveal bad'; msg.textContent = `Sakelar ini bernilai ${parseInt(bits.join(''), 2)}, bukan ${code(letter)}.`; shake(stage); ctx.mistake(); return; }
    finished = true;
    draw();
    msg.className = 'reveal';
    msg.textContent = `Benar: ${letter} = ${code(letter)} = ${bin8(code(letter))} = ${hex2(code(letter))} heksa.`;
    done();
  }, 'primary'));
}

// Column addition from the right. Each column: write a bit and maybe carry.
function adderRound(wrap, ctx, { a, b, prompt, done }) {
  const steps = addSteps(a, b);
  const written = [];
  const carries = [];
  const board = el('div', { class: 'jumlah' });
  const msg = el('p', { class: 'reveal info' }, 'Mulai dari kolom paling kanan. Pilih yang ditulis dan apakah ada simpanan.');
  const options = el('div', { class: 'jumlah-pilih' });
  const lamps = el('div', { class: 'papan-skor' });
  const col = () => written.length;
  function cell(text, cls = '') { return el('span', { class: `jcell ${cls}` }, text); }
  function draw() {
    const c = col();
    const pos = (i) => 8 - i; // grid column (0 = lamp 9) for bit i
    const rows = [];
    rows.push(el('span', { class: 'jlabel' }, 'simpan'), ...Array.from({ length: 9 }, (_, g) => { const i = 8 - g; return cell(carries[i - 1] ? '1' : '', `simpan ${i === c && c < 8 ? 'aktif' : ''}`); }));
    rows.push(el('span', { class: 'jlabel' }, a), cell(''), ...bin8(a).split('').map((d, g) => cell(d, 7 - g === c ? 'aktif' : '')));
    rows.push(el('span', { class: 'jlabel' }, `+ ${b}`), cell(''), ...bin8(b).split('').map((d, g) => cell(d, 7 - g === c ? 'aktif' : '')));
    rows.push(el('span', { class: 'jlabel' }, 'hasil'), ...Array.from({ length: 9 }, (_, g) => {
      const i = 8 - g;
      if (i === 8) return cell(c === 8 && carries[7] ? '1' : '', `lampu9 ${c === 8 && carries[7] ? 'luap' : ''}`);
      return cell(i < c ? String(written[i]) : '', `hasil ${i === c ? 'aktif' : ''}`);
    }));
    board.replaceChildren(...rows);
    void pos;
    options.replaceChildren();
    if (c < 8) {
      const cin = steps[c].cin;
      const sum = `${(a >> c) & 1} + ${(b >> c) & 1}${cin ? ' + 1 (simpanan)' : ''}`;
      options.append(el('p', { class: 'small-note' }, `Kolom nilai ${2 ** c}: ${sum}`),
        ...[[0, 0, 'tulis 0'], [1, 0, 'tulis 1'], [0, 1, 'tulis 0, simpan 1'], [1, 1, 'tulis 1, simpan 1']].map(([bit, carry, label]) => button(label, () => {
          if (bit !== steps[c].bit || carry !== steps[c].carry) { msg.className = 'reveal bad'; msg.textContent = `${sum} = ${steps[c].bit + 2 * steps[c].carry}. Coba lagi.`; shake(board); ctx.mistake(); return; }
          written.push(bit);
          carries.push(carry);
          ctx.sound.tap();
          msg.className = 'reveal info';
          msg.textContent = carry ? 'Simpan 1 ke kolom berikutnya.' : 'Lanjut ke kolom berikutnya.';
          draw();
          if (written.length === 8) finish();
        }, 'small')));
    }
    const shown = written.length === 8 ? written.slice().reverse() : [];
    lamps.replaceChildren(el('small', null, 'Papan skor 8 lampu'), el('div', { class: 'lampu-row' }, Array.from({ length: 8 }, (_, g) => el('i', { class: shown[g] ? 'nyala' : '' }))), el('b', null, shown.length ? parseInt(shown.join(''), 2) : '…'));
  }
  function finish() {
    const total = a + b;
    const over = total > 255;
    msg.className = over ? 'reveal bad' : 'reveal';
    msg.textContent = over
      ? `Luapan! ${a} + ${b} = ${total} butuh 9 bit (${total.toString(2)}). Lampu ke-9 tidak ada, jadi papan menampilkan ${total & 255}.`
      : `Benar: ${bin8(total)} = ${total}. Periksa: ${a} + ${b} = ${total}.`;
    done();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt || `Jumlahkan ${a} + ${b} dalam biner.`), board, options, lamps, msg);
}

// Flip one bit of each lower-case letter to make it upper case.
function caseRound(wrap, ctx, { word, done }) {
  const bits = [...word].map((c) => bin8(code(c)).split('').map(Number));
  const fixed = [...word].map(() => false);
  const stage = el('div', { class: 'besar-kecil' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tepat satu bit pada setiap huruf.');
  let finished = false;
  function draw() {
    stage.replaceChildren(...bits.map((row, k) => {
      const v = parseInt(row.join(''), 2);
      return el('div', { class: `huruf-baris ${fixed[k] ? 'beres' : ''}` }, el('b', { class: 'huruf-besar' }, letterOf(v)),
        el('div', { class: 'bit-strip' }, row.map((b, i) => {
          const n = el('button', { class: 'bit-sel', type: 'button', 'data-k': k, 'data-i': i }, b);
          return fixed[k] ? n : onTap(n, () => tap(k, i));
        })));
    }));
  }
  function tap(k, i) {
    if (finished || fixed[k]) return;
    if (i !== 2) { msg.className = 'reveal bad'; msg.textContent = `Bit bernilai ${2 ** (7 - i)} mengubah ${word[k]} menjadi ${letterOf(code(word[k]) ^ (2 ** (7 - i)))}, bukan huruf besar.`; ctx.mistake(); return; }
    bits[k][i] = 0;
    fixed[k] = true;
    ctx.sound.good();
    draw();
    if (fixed.every(Boolean)) {
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `${word.toUpperCase()}! Huruf besar dan kecil hanya berbeda pada bit bernilai 32 (a = 97, A = 65).`;
      done();
    } else { msg.className = 'reveal info'; msg.textContent = 'Tepat. Lanjutkan huruf berikutnya.'; }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Ubah "${word}" menjadi huruf besar dengan mengganti satu bit per huruf.`), stage, msg);
}

function createConverter(root, ctx) {
  const wrap = el('div', { class: 'act kode-huruf' });
  root.append(wrap);
  let bits = bin8(65).split('').map(Number);
  function draw() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ketuk sakelar bit, atau ketik huruf untuk melihat bitnya.'),
      switches(bits, (i) => { bits[i] = 1 - bits[i]; ctx.sound.tap(); draw(); }), readout(parseInt(bits.join(''), 2)),
      keyboard((ch) => { bits = bin8(code(ch)).split('').map(Number); ctx.sound.tap(); draw(); }, () => { bits = Array(8).fill(0); draw(); }));
  }
  draw();
}

function createQuiz(root, ctx) {
  const wrap = el('div', { class: 'act kode-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let n = 0;
  let score = 0;
  function go() {
    const format = rand.pick(['angka', 'biner', 'heksa']);
    wrap.replaceChildren(el('p', { class: 'small-note' }, `Pesan ke-${++n} · benar ${score}`));
    messageRound(wrap, ctx, { word: pickWord(rand, format), format, done() { score++; ctx.sound.win(); wrap.append(button('Pesan berikutnya ➜', go, 'primary')); } });
  }
  go();
}

function createAdderFree(root, ctx) {
  const wrap = el('div', { class: 'act kode-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go() {
    const big = rand.int(1, 3) === 1;
    const a = big ? rand.int(150, 250) : rand.int(10, 140);
    const b = big ? rand.int(60, 120) : rand.int(5, 100);
    wrap.replaceChildren();
    adderRound(wrap, ctx, { a, b, done() { ctx.sound.win(); wrap.append(button('Soal berikutnya ➜', go, 'primary')); } });
  }
  go();
}

function createCase(root, ctx) {
  const wrap = el('div', { class: 'act kode-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go() {
    wrap.replaceChildren();
    caseRound(wrap, ctx, { word: rand.pick(LOWER), done() { ctx.sound.win(); wrap.append(button('Kata berikutnya ➜', go, 'primary')); } });
  }
  go();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kode-huruf' });
  root.append(wrap);
  const score = [0, 0];
  let writer = 0;
  function write() {
    let typed = '';
    const shown = el('div', { class: 'ketikan rahasia' });
    const msg = el('p', { class: 'reveal info' }, `Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`);
    const draw = () => shown.replaceChildren(...(typed ? [...typed].map(() => el('span', { class: 'slot-letter' }, '•')) : [el('span', { class: 'small-note' }, 'kata rahasia (2–5 huruf)')]));
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${writer + 1}: ketik kata rahasia. Tim ${2 - writer} jangan melihat!`), shown,
      keyboard((ch) => { if (ch === ' ' || typed.length >= 5) return; typed += ch; ctx.sound.tap(); draw(); }, () => { typed = typed.slice(0, -1); draw(); }),
      msg, button('Sandikan jadi bit ➜', () => {
        if (typed.length < 2) { msg.className = 'reveal bad'; msg.textContent = 'Kata rahasia paling sedikit 2 huruf.'; shake(shown); return; }
        read(typed);
      }, 'primary'));
  }
  function read(secret) {
    const reader = 1 - writer;
    wrap.replaceChildren();
    messageRound(wrap, ctx, {
      word: secret, format: 'biner', prompt: `Tim ${reader + 1}: terjemahkan kata rahasia ini.`,
      done() {
        score[reader]++;
        ctx.sound.win();
        wrap.append(button('Tukar peran ➜', () => { writer = reader; write(); }, 'primary'));
      },
    });
  }
  write();
}
