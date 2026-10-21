// Tebak Provinsi, Tebak Huruf — SMP (13–15 tahun), informasi dan bit. Guess
// one of 38 provinces with yes/no questions (halving needs at most 6), let
// the computer guess yours, and guess a sentence letter by letter to feel
// how predictable text is.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

const W = { jawa: 'Pulau Jawa', sumatera: 'Pulau Sumatera', kalimantan: 'Kalimantan', sulawesi: 'Sulawesi', papua: 'Papua', nusa: 'Bali dan Nusa Tenggara', maluku: 'Maluku', kepri: 'Kep. Riau dan Babel' };
export const PROV = [
  ['Aceh', 'sumatera'], ['Bali', 'nusa'], ['Banten', 'jawa'], ['Bengkulu', 'sumatera'], ['DI Yogyakarta', 'jawa'], ['Gorontalo', 'sulawesi'], ['Jakarta', 'jawa'], ['Jambi', 'sumatera'],
  ['Jawa Barat', 'jawa'], ['Jawa Tengah', 'jawa'], ['Jawa Timur', 'jawa'], ['Kalimantan Barat', 'kalimantan'], ['Kalimantan Selatan', 'kalimantan'], ['Kalimantan Tengah', 'kalimantan'], ['Kalimantan Timur', 'kalimantan'], ['Kalimantan Utara', 'kalimantan'],
  ['Kepulauan Bangka Belitung', 'kepri'], ['Kepulauan Riau', 'kepri'], ['Lampung', 'sumatera'], ['Maluku', 'maluku'], ['Maluku Utara', 'maluku'], ['Nusa Tenggara Barat', 'nusa'], ['Nusa Tenggara Timur', 'nusa'], ['Papua', 'papua'],
  ['Papua Barat', 'papua'], ['Papua Barat Daya', 'papua'], ['Papua Pegunungan', 'papua'], ['Papua Selatan', 'papua'], ['Papua Tengah', 'papua'], ['Riau', 'sumatera'], ['Sulawesi Barat', 'sulawesi'], ['Sulawesi Selatan', 'sulawesi'],
  ['Sulawesi Tengah', 'sulawesi'], ['Sulawesi Tenggara', 'sulawesi'], ['Sulawesi Utara', 'sulawesi'], ['Sumatera Barat', 'sumatera'], ['Sumatera Selatan', 'sumatera'], ['Sumatera Utara', 'sumatera'],
].map(([name, w], i) => ({ no: i + 1, name, w }));
const INITIALS = [...new Set(PROV.map((p) => p.name[0]))].sort();
export const SENTENCES = ['IBU PERGI KE PASAR', 'AYO BELAJAR BERSAMA', 'ADIK MINUM SUSU', 'HARI INI HUJAN DERAS', 'BAPAK MEMBACA KORAN', 'KAMI BERMAIN BOLA', 'NENEK MENANAM PADI', 'KAKAK MENCUCI PIRING', 'GURU MENULIS DI PAPAN', 'AYAM BERKOKOK PAGI'];
export const RECORD = [['I', 4], ['B', 9], ['U', 2], [' ', 1], ['P', 5], ['E', 2], ['R', 3], ['G', 3], ['I', 1], [' ', 1], ['K', 6], ['E', 1], [' ', 1], ['P', 4], ['A', 1], ['S', 3], ['A', 1], ['R', 2]];
export const bitsFor = (n) => Math.ceil(Math.log2(n) - 1e-9);
// Worst case after each halving question: 38 → 19 → 10 → 5 → 3 → 2 → 1.
export const halving = (n) => { const a = [n]; while (a.at(-1) > 1) a.push(Math.ceil(a.at(-1) / 2)); return a; };

export default {
  id: 'smp-06-tebak-huruf',
  title: 'Tebak Provinsi, Tebak Huruf',
  topic: 'Informasi dan bit: pertanyaan ya/tidak dan teks yang bisa ditebak',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '❓',
  source: { name: 'CS Unplugged: Information Theory', url: 'https://www.csunplugged.org/en/topics/information-theory/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid memilih pertanyaan ya/tidak yang membagi dua, menghitung banyak bit untuk sejumlah pilihan, dan menyadari bahwa teks punya bagian yang bisa ditebak.',
  extraModes: [
    { id: 'provinsi', icon: '🗺️', label: 'Tebak Provinsi', desc: 'Komputer menyimpan provinsi rahasia; tanya dengan templat ya/tidak', create: (r, c) => freeProvince(r, c) },
    { id: 'komputer', icon: '🤖', label: 'Lawan Komputer', desc: 'Pilih provinsi; komputer menebak dengan membagi dua, paling banyak 6 pertanyaan', create: (r, c) => freeComputer(r, c) },
    { id: 'huruf', icon: '🔤', label: 'Tebak Huruf', desc: 'Tebak kalimat huruf demi huruf; huruf mudah hijau, huruf sulit merah', create: (r, c) => freeLetters(r, c) },
    { id: 'tim', icon: '🤝', label: 'Paling Sedikit Bertanya', desc: 'Tim bergantian menebak provinsi rahasia; pertanyaan paling sedikit menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tebak-huruf' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 2, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) provinceGame(wrap, ctx, { secret: ctx.rand.pick(PROV), done: next });
      else if (r === 1) ask('Pertanyaan pertama mana yang lebih baik bila jawabannya sedang tidak beruntung?', [['"Nomornya 19 atau kurang?": ya 19, tidak 19', true], ['"Di Pulau Jawa?": ya 6, tidak 32'], ['"Di Pulau Jawa?": ya 19, tidak 19'], ['Keduanya sama saja']], 1);
      else if (r === 2) fillNumbers(wrap, ctx, { prompt: 'Strategi membagi dua: isi sisa provinsi pada keadaan paling tidak beruntung.', heads: [0, 1, 2, 3, 4, 5, 6].map((k) => `ke-${k}`), want: halving(38), given: [0], label: 'Sisa', done: next });
      else if (r === 3) ask('Lima jawaban ya/tidak membentuk berapa pola? Apa artinya untuk 38 provinsi?', [['32 pola; paling sedikit dua provinsi punya pola yang sama', true], ['25 pola; cukup untuk 38 provinsi'], ['32 pola; cukup untuk 38 provinsi'], ['10 pola; hanya 10 provinsi tertebak']], 1);
      else if (r === 4) fillNumbers(wrap, ctx, { prompt: 'Berapa pertanyaan (bit) paling sedikit untuk sekian pilihan?', heads: ['2', '4', '8', '16', '38', '100', '1.000', '1.000.000'], want: [2, 4, 8, 16, 38, 100, 1000, 1e6].map(bitsFor), given: [0, 1], label: 'Bit', done: next });
      else if (r === 5) computerGame(wrap, ctx, { done: next });
      else if (r === 6) letterGame(wrap, ctx, { sentence: ctx.rand.pick(SENTENCES), done: next });
      else if (r === 7) ask('Pada catatan Rina, berapa total tebakan dan rata-rata tebakan per huruf?', [['Total 50, rata-rata sekitar 2,8', true], ['Total 18, rata-rata 1'], ['Total 50, rata-rata 27'], ['Total 45, rata-rata 2,5']], 2, recordView());
      else if (r === 8) ask('Mengapa huruf di akhir kata biasanya mudah ditebak?', [['Setelah beberapa huruf, hanya sedikit kata yang mungkin', true], ['Karena huruf akhir selalu vokal'], ['Karena huruf akhir paling sering A'], ['Karena penebak sudah lelah']], 1, recordView());
      else ask('Baca: MNGP KT MSH BS MMBC KLMT N? Apa artinya bagi komputer?', [['"Mengapa kita masih bisa membaca kalimat ini?" Teks bisa ditebak, jadi bisa disimpan lebih hemat', true], ['"Mengapa kita masih bisa membaca kalimat ini?" Huruf vokal tidak pernah perlu disimpan'], ['"Mangga kita masih basah?" Komputer tidak bisa membacanya'], ['Kalimat ini tidak bisa dibaca sama sekali']], 1);
    }
    render();
  },
};

function recordView() {
  return el('div', { class: 'catatan' }, RECORD.map(([ch, n]) => el('span', { class: `cat-sel ${n === 1 ? 'mudah' : n >= 5 ? 'sulit' : ''}` }, el('b', null, ch === ' ' ? '▢' : ch), el('small', null, n))));
}

// The 38 tiles grouped by region; impossible ones are dimmed.
function provinceBoard(possible, { onPick, hi } = {}) {
  return el('div', { class: 'prov-papan' }, Object.entries(W).map(([w, label]) => el('div', { class: `prov-wilayah w-${w}` }, el('small', null, label),
    el('div', { class: 'prov-ubin' }, PROV.filter((p) => p.w === w).map((p) => {
      const t = el('button', { class: `prov ${possible.has(p.no) ? '' : 'gugur'} ${hi === p.no ? 'hi' : ''}`, type: 'button', 'data-no': p.no, title: p.name }, el('b', null, p.no), el('span', null, p.name));
      return onPick ? onTap(t, () => onPick(p)) : t;
    })))));
}

// Ask with templates until the secret province is guessed.
function provinceGame(wrap, ctx, { secret, done, prompt = 'Komputer menyimpan satu provinsi rahasia. Tanyakan ya/tidak, lalu ketuk provinsinya.' }) {
  const possible = new Set(PROV.map((p) => p.no));
  let asked = 0;
  let n = 19;
  let finished = false;
  const log = el('div', { class: 'prov-log' });
  const stage = el('div');
  const counter = el('p', { class: 'reveal info' });
  function answer(text, test) {
    if (finished) return;
    asked++;
    const yes = test(secret);
    for (const p of PROV) if (test(p) !== yes) possible.delete(p.no);
    log.prepend(el('span', { class: yes ? 'ya' : 'tidak' }, `${asked}. ${text} → ${yes ? 'ya' : 'tidak'} (sisa ${possible.size})`));
    ctx.sound.tap();
    draw();
  }
  function guess(p) {
    if (finished || !possible.has(p.no)) return;
    asked++;
    if (p.no !== secret.no) { possible.delete(p.no); log.prepend(el('span', { class: 'tidak' }, `${asked}. Apakah ${p.name}? → tidak`)); ctx.sound.bad(); draw(); return; }
    finished = true;
    draw();
    counter.className = 'reveal';
    counter.textContent = `Benar: ${secret.no}. ${secret.name}, dengan ${asked} pertanyaan.${asked <= 6 ? '' : ' Dengan membagi dua, 6 pertanyaan selalu cukup.'}`;
    done(asked);
  }
  function draw() {
    if (!finished) counter.textContent = `Pertanyaan: ${asked} · masih mungkin: ${possible.size}`;
    const nums = [...possible];
    stage.replaceChildren(el('div', { class: 'prov-tanya' },
      el('div', { class: 'templat' }, 'Apakah nomornya ', onTap(el('button', { class: 'geser-tombol', type: 'button' }, '−'), () => { n = Math.max(1, n - 1); draw(); }), el('b', { class: 'templat-n' }, n), onTap(el('button', { class: 'geser-tombol', type: 'button' }, '+'), () => { n = Math.min(38, n + 1); draw(); }), ' atau kurang? ',
        button('Tanya', () => answer(`Nomornya ${n} atau kurang?`, (p) => p.no <= n), 'small'), nums.length > 1 ? button('Tengah', () => { const s = nums.sort((a, b) => a - b); n = s[Math.ceil(s.length / 2) - 1]; draw(); }, 'small') : null),
      el('div', { class: 'templat' }, 'Apakah di ', ...Object.entries(W).map(([w, label]) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-w': w }, label), () => answer(`Di ${label}?`, (p) => p.w === w))), '?'),
      el('div', { class: 'templat' }, 'Apakah namanya diawali huruf ', ...INITIALS.map((h) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-h': h }, h), () => answer(`Diawali huruf ${h}?`, (p) => p.name[0] === h))), '?')),
    provinceBoard(possible, { onPick: guess, hi: finished ? secret.no : null }));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), counter, stage, log);
}

// The computer halves the numbers; the player answers honestly.
function computerGame(wrap, ctx, { done }) {
  let mine = null;
  let possible = PROV.map((p) => p.no);
  let asked = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih provinsimu secara rahasia dengan mengetuknya.');
  const log = el('div', { class: 'prov-log' });
  const mid = () => possible[Math.ceil(possible.length / 2) - 1];
  function reply(yes) {
    if (finished) return;
    const m = mid();
    if ((mine.no <= m) !== yes) { msg.className = 'reveal bad'; msg.textContent = `Periksa lagi: nomor provinsimu ${mine.no}.`; ctx.mistake(); shake(stage); return; }
    asked++;
    log.prepend(el('span', { class: yes ? 'ya' : 'tidak' }, `${asked}. Nomornya ${m} atau kurang? → ${yes ? 'ya' : 'tidak'} (sisa ${yes ? possible.filter((x) => x <= m).length : possible.filter((x) => x > m).length})`));
    possible = possible.filter((x) => (x <= m) === yes);
    ctx.sound.tap();
    draw();
  }
  function draw() {
    const set = new Set(possible);
    if (!mine) { stage.replaceChildren(provinceBoard(set, { onPick: (p) => { mine = p; msg.className = 'reveal info'; draw(); } })); return; }
    if (possible.length === 1) {
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Komputer: "Provinsimu ${PROV[possible[0] - 1].name}!" Hanya ${asked} pertanyaan (paling banyak 6).`;
      stage.replaceChildren(provinceBoard(set, { hi: possible[0] }));
      done();
      return;
    }
    msg.className = 'reveal info';
    msg.textContent = `Komputer bertanya: "Apakah nomornya ${mid()} atau kurang?"`;
    stage.replaceChildren(el('div', { class: 'kode-baris' }, button('Ya', () => reply(true), 'primary'), button('Tidak', () => reply(false), 'primary'), el('small', { class: 'prov-milik' }, `Rahasiamu: ${mine.no}. ${mine.name}`)), provinceBoard(set, { hi: mine.no }));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lawan komputer: pilih provinsi, komputer menebak dengan membagi dua.'), msg, stage, log);
}

// Guess a sentence letter by letter; count guesses per letter.
function letterGame(wrap, ctx, { sentence, done }) {
  const counts = [];
  let pos = 0;
  let tries = new Set();
  let finished = false;
  const slots = el('div', { class: 'tebak-slot' });
  const msg = el('p', { class: 'reveal info' }, 'Tebak huruf pertama. Spasi juga ditebak (▢).');
  const keys = el('div', { class: 'keys' });
  function draw() {
    slots.replaceChildren(...[...sentence].map((ch, i) => el('span', { class: `slot-huruf ${i < pos ? (counts[i] === 1 ? 'mudah' : counts[i] >= 5 ? 'sulit' : 'sedang') : i === pos ? 'aktif' : ''}` }, el('b', null, i < pos ? (ch === ' ' ? '▢' : ch) : ''), el('small', null, i < pos ? counts[i] : ''))));
    keys.replaceChildren(...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ' '].map((ch) => {
      const k = el('button', { class: `key ${ch === ' ' ? 'wide space' : ''} ${tries.has(ch) ? 'coba' : ''}`, type: 'button', 'data-ch': ch === ' ' ? 'spasi' : ch }, ch === ' ' ? '▢' : ch);
      return onTap(k, () => guess(ch));
    }));
  }
  function guess(ch) {
    if (finished || tries.has(ch)) return;
    tries.add(ch);
    if (ch !== sentence[pos]) { ctx.sound.tap(); msg.className = 'reveal info'; msg.textContent = `Bukan. Tebakan ke-${tries.size} untuk huruf ini.`; draw(); return; }
    counts[pos] = tries.size;
    pos++;
    tries = new Set();
    ctx.sound.good();
    if (pos === sentence.length) {
      finished = true;
      const sum = counts.reduce((a, b) => a + b, 0);
      draw();
      msg.className = 'reveal';
      msg.textContent = `Selesai! Total ${sum} tebakan, rata-rata ${(sum / sentence.length).toLocaleString('id-ID', { maximumFractionDigits: 1 })} per huruf (menebak asal bisa sampai 27).`;
      done(sum);
      return;
    }
    msg.className = 'reveal info';
    msg.textContent = 'Ya! Tebak huruf berikutnya.';
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tebak kalimat rahasia huruf demi huruf.'), slots, msg, keys);
}

// Number boxes for a table row, typed with a keypad.
function fillNumbers(wrap, ctx, { prompt, heads, want, given = [], label, done }) {
  const vals = {};
  given.forEach((k) => { vals[k] = want[k]; });
  let focus = want.findIndex((_, k) => !given.includes(k));
  let finished = false;
  const table = el('div', { class: 'isi-tabel' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kotak, lalu ketik angkanya.');
  function draw(wrong = []) {
    table.replaceChildren(el('div', { class: 'isi-baris kepala' }, ...heads.map((h) => el('span', null, h))),
      el('div', { class: 'isi-baris' }, ...want.map((_, k) => (given.includes(k) ? el('span', { class: 'isi-tetap' }, want[k])
        : onTap(el('button', { class: `ck-isi ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] ?? '…'), () => { focus = k; draw(); })))));
  }
  draw();
  const pad = el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => { if (finished || focus < 0) return; vals[focus] = Number(String(vals[focus] ?? '') + d) % 1000; ctx.sound.tap(); draw(); })),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { const v = String(vals[focus] ?? ''); vals[focus] = v.length > 1 ? Number(v.slice(0, -1)) : undefined; draw(); }));
  wrap.append(el('p', { class: 'prompt' }, prompt), el('small', null, label), table, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    const wrong = want.map((v, k) => (vals[k] === v ? -1 : k)).filter((k) => k >= 0);
    if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} kotak belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Benar: ${want.join(', ')}.`;
    done();
  }, 'primary')), msg);
}

function freeProvince(root, ctx) {
  const wrap = el('div', { class: 'act tebak-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const go = () => { wrap.replaceChildren(); provinceGame(wrap, ctx, { secret: rand.pick(PROV), done() { ctx.sound.win(); wrap.append(button('Provinsi lain ➜', go, 'primary')); } }); };
  go();
}
function freeComputer(root, ctx) {
  const wrap = el('div', { class: 'act tebak-huruf' });
  root.append(wrap);
  const go = () => { wrap.replaceChildren(); computerGame(wrap, ctx, { done() { ctx.sound.win(); wrap.append(button('Main lagi ➜', go, 'primary')); } }); };
  go();
}
function freeLetters(root, ctx) {
  const wrap = el('div', { class: 'act tebak-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let order = [];
  const go = () => { if (!order.length) order = rand.shuffle([...SENTENCES]); wrap.replaceChildren(); letterGame(wrap, ctx, { sentence: order.pop(), done() { ctx.sound.win(); wrap.append(button('Kalimat lain ➜', go, 'primary')); } }); };
  go();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act tebak-huruf' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const counts = [];
  function play(team) {
    wrap.replaceChildren();
    provinceGame(wrap, ctx, {
      secret: rand.pick(PROV), prompt: `Tim ${team + 1}: tebak provinsi rahasia dengan pertanyaan sesedikit mungkin.`,
      done(n) {
        counts[team] = n;
        ctx.sound.win();
        if (team === 0) { wrap.append(button('Giliran Tim 2 ➜', () => play(1), 'primary')); return; }
        const [a, b] = counts;
        wrap.append(el('p', { class: 'reveal' }, `Tim 1: ${a} pertanyaan · Tim 2: ${b} pertanyaan. ${a === b ? 'Seri!' : `Tim ${a < b ? 1 : 2} menang!`}`), button('Main lagi ➜', () => { counts.length = 0; play(0); }, 'primary'));
      },
    });
  }
  play(0);
}
