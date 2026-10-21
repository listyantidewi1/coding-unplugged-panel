// Lomba Cari Kata di Kamus — SD Lanjut (10–12 tahun), efisiensi pencarian.
// A secret animal hides in a 31-word dictionary. Ask by number; the
// answer is "sebelum", "sesudah" or "ketemu". Asking in order takes up to
// 31 questions, asking in the middle at most 5; each extra question
// doubles the dictionary the middle way can handle.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

export const ANIMALS = ['anoa', 'badak', 'bangau', 'bekantan', 'beruang', 'buaya', 'cenderawasih', 'cicak', 'elang', 'gajah',
  'harimau', 'jalak', 'kakatua', 'kancil', 'komodo', 'kucing', 'kura-kura', 'lumba-lumba', 'maleo', 'merak', 'monyet',
  'nuri', 'owa', 'penyu', 'rusa', 'siamang', 'tapir', 'tarsius', 'tokek', 'ular', 'walet'];
export const maxMiddle = (n) => Math.ceil(Math.log2(n + 1));

// Made-up words for the thick dictionaries, already in alphabetical order.
function bigDictionary(n) {
  const syl = [];
  for (const c of 'bdgjklmnprst') for (const v of 'aiu') syl.push(c + v);
  const all = [];
  for (const a of syl) for (const b of syl) all.push(a + b);
  all.sort();
  return Array.from({ length: n }, (_, i) => all[Math.floor((i * all.length) / n)]);
}
const DICTS = { 31: ANIMALS, 100: bigDictionary(100), 1000: bigDictionary(1000) };

// One search: ask by number, the answer narrows the range. Small
// dictionaries show every word; big ones take a typed number.
function search(wrap, ctx, { words, secret, prompt, done, hintAfter = 0, terms = ['sebelum', 'sesudah'] }) {
  const n = words.length;
  let lo = 0;
  let hi = n - 1;
  let asks = 0;
  let over = false;
  const counter = el('span', { class: 'open-count' }, 'Tanya: 0');
  const answer = el('p', { class: 'reveal' });
  const log = el('ol', { class: 'open-log' });
  const strip = el('div', { class: 'range-strip' }, el('i', { class: 'range-in' }));
  let cells = null;
  function ask(i) {
    if (over || i < 0 || i >= n) return;
    asks++;
    counter.textContent = `Tanya: ${asks}`;
    ctx.sound.tap();
    let text;
    if (i === secret) { text = 'ketemu! 🎉'; over = true; }
    else if (secret < i) { text = `${terms[0]} ⬅️`; hi = Math.min(hi, i - 1); }
    else { text = `${terms[1]} ➡️`; lo = Math.max(lo, i + 1); }
    answer.className = over ? 'reveal' : 'reveal info';
    answer.textContent = words[i] === String(i + 1) ? `${i + 1}: ${text}` : `${i + 1}. ${words[i]}: ${text}`;
    log.prepend(el('li', null, `${words[i] === String(i + 1) ? i + 1 : `${i + 1} ${words[i]}`} → ${text.replace(/ [^ ]+$/, '')}`));
    if (cells) cells.forEach((c, k) => { c.classList.toggle('out', (k < lo || k > hi) && k !== secret); c.classList.toggle('found', over && k === secret); });
    strip.firstChild.style.left = `${(lo / n) * 100}%`;
    strip.firstChild.style.width = `${((hi - lo + 1) / n) * 100}%`;
    if (hintAfter && asks === hintAfter && !over) { answer.textContent += ' · Coba Cara Tengah!'; }
    if (over) done(asks);
  }
  let picker;
  if (n <= 31) {
    cells = words.map((w, i) => onTap(el('button', { class: 'word-cell', type: 'button' }, el('small', null, i + 1), ` ${w}`), () => ask(i)));
    picker = el('div', { class: 'word-grid' }, cells);
  } else {
    let typed = '';
    const shown = el('div', { class: 'msg-out' }, 'Ketik nomor');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) => onTap(el('button', { class: 'key', type: 'button' }, k), () => { if (typed.length < 4) { typed += k; shown.textContent = typed; } }));
    keys.push(onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { typed = typed.slice(0, -1); shown.textContent = typed || 'Ketik nomor'; }));
    const go = button('Tanya', () => {
      const k = Number(typed) - 1;
      typed = '';
      shown.textContent = 'Ketik nomor';
      if (k < 0 || k >= n) { shake(shown); return; }
      ask(k);
    }, 'primary');
    picker = el('div', { class: 'kuota-side' }, el('div', { class: 'row' }, shown, go), el('div', { class: 'keys keypad' }, keys), el('small', { class: 'small-note' }, `Nomor 1 sampai ${n}`));
  }
  wrap.append(
    el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'kata-layout' }, picker, el('div', { class: 'kata-side' }, counter, answer, strip, log)));
}

// Bars: most questions in order vs from the middle, plus the pupil's result.
function chart(results) {
  const sizes = [31, 100, 1000];
  const top = 40;
  const bar = (v, cls) => el('div', { class: `bar-col ${cls}`, style: { height: `${(Math.min(v, top) / top) * 100}%` } }, el('span', null, v > top ? `↑ ${v}` : v));
  return el('div', { class: 'chart' },
    el('div', { class: 'chart-bars' }, sizes.map((s) => el('div', { class: 'chart-group' },
      el('div', { class: 'chart-pair' }, bar(s, 'urut'), bar(maxMiddle(s), 'tengah'),
        results[s] != null ? el('i', { class: 'dot-result', style: { bottom: `${(Math.min(results[s], top) / top) * 100}%` }, title: `kamu: ${results[s]}` }) : null),
      el('small', null, `${s} kata`)))),
    el('div', { class: 'chart-key' }, el('span', { class: 'k urut' }, 'Cara Urut (paling banyak)'), el('span', { class: 'k tengah' }, 'Cara Tengah (paling banyak)'), el('span', { class: 'k dot' }, 'hasilmu')));
}

const QUESTIONS = [
  { q: 'Kamus 31 kata: paling banyak berapa tanya dengan Cara Tengah?', opts: [5, 8, 15, 31], a: 5 },
  { q: 'Tangga gandakan: 1 tanya → 1 kata, 2 → 3, 3 → 7, 4 → 15, 5 → 31. Dengan 6 tanya, paling banyak berapa kata?', opts: [36, 62, 63, 64], a: 63 },
  { q: 'Kamus 1.000 kata: paling banyak berapa tanya dengan Cara Tengah?', opts: [10, 50, 100, 500], a: 10 },
];

export default {
  id: 'sdl-10-cari-kata',
  title: 'Lomba Cari Kata di Kamus',
  topic: 'Efisiensi pencarian',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '📕',
  source: { name: 'CS Unplugged: Searching Algorithms', url: 'https://www.csunplugged.org/en/topics/searching-algorithms/' },
  rounds: 8,
  maxPlayers: 4,
  goal: 'Murid membandingkan Cara Urut dan Cara Tengah, menemukan tangga gandakan, dan menebak bilangan 1–1.000 dalam 10 tebakan atau kurang.',
  extraModes: [
    { id: 'kamus', icon: '📗', label: 'Kamus Virtual', desc: 'Pilih 31, 100, atau 1.000 kata; cari kata rahasia dan lihat hasilnya di grafik', create: createDictionary },
    { id: 'angka', icon: '🔢', label: 'Tebak Angka 1–1.000', desc: 'Layar memikirkan bilangan; tebak dengan petunjuk lebih besar atau lebih kecil', create: createNumber },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kata' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2600); };
      if (r === 0) search(wrap, ctx, { words: ANIMALS, secret: ctx.rand.int(0, 30), prompt: 'Cari hewan rahasia dengan CARA URUT: tanya mulai nomor 1, 2, 3, …', done: next });
      else if (r === 1) search(wrap, ctx, { words: ANIMALS, secret: ctx.rand.int(0, 30), prompt: 'Sekarang CARA TENGAH: tanya nomor di tengah kata yang masih mungkin.', done: next });
      else if (r <= 4) {
        const q = QUESTIONS[r - 2];
        choice(wrap, { prompt: q.q, ctx, onRight: next, columns: 4, options: q.opts.map((x) => ({ label: x.toLocaleString('id-ID'), correct: x === q.a })) });
      } else if (r === 5) numberRound(wrap, ctx, ctx.rand.int(1, 1000), next);
      else if (r === 6) {
        choice(wrap, {
          prompt: 'Rina: "Kalau kamusnya dua kali lebih tebal, Cara Tengah hanya perlu satu tanya tambahan." Benar atau salah?', ctx, onRight: next, columns: 1,
          options: [
            { label: 'Benar: tanya pertama membuang separuh, sisanya setebal kamus semula', correct: true },
            { label: 'Salah: tanyanya juga jadi dua kali lipat' },
          ],
        });
      } else {
        const items = [
          { q: 'Mencari kaus kaki biru di keranjang cucian yang campur aduk. Pakai cara apa?', a: 'Cara Urut' },
          { q: 'Mencari nama "Wulan" di daftar absen yang urut abjad. Pakai cara apa?', a: 'Cara Tengah' },
          { q: 'Mencari kata "pelangi" di kamus. Pakai cara apa?', a: 'Cara Tengah' },
        ];
        const it = items[(r - 7) % items.length];
        choice(wrap, { prompt: it.q, ctx, onRight: next, columns: 2, options: ['Cara Urut', 'Cara Tengah'].map((x) => ({ label: x, correct: x === it.a })) });
      }
    }
    render();
  },
};

// Guess a number 1–1000 with "lebih besar" / "lebih kecil".
function numberRound(wrap, ctx, secret, done) {
  const words = Array.from({ length: 1000 }, (_, i) => String(i + 1));
  search(wrap, ctx, {
    words, secret: secret - 1, hintAfter: 10, terms: ['lebih kecil', 'lebih besar'],
    prompt: 'Tebak bilangan rahasia 1–1.000. Layar menjawab lebih kecil, lebih besar, atau ketemu.',
    done,
  });
}

function createDictionary(root, ctx) {
  const wrap = el('div', { class: 'act kata' });
  root.append(wrap);
  const results = {};
  let size = 31;
  function go() {
    wrap.replaceChildren(el('div', { class: 'row' }, [31, 100, 1000].map((s) => button(`${s.toLocaleString('id-ID')} kata`, () => { size = s; go(); }, s === size ? 'small on' : 'small'))));
    const inner = el('div', { class: 'kata-inner' });
    const graph = el('div', { class: 'chart-wrap' }, chart(results));
    wrap.append(inner, graph);
    search(inner, ctx, {
      words: DICTS[size], secret: Math.floor(Math.random() * size),
      prompt: size === 31 ? 'Cari hewan rahasia. Ketuk nomornya.' : `Kamus ${size.toLocaleString('id-ID')} kata: ketik nomor yang ditanyakan.`,
      done(asks) {
        results[size] = asks;
        ctx.sound.win();
        graph.replaceChildren(chart(results));
        inner.append(button('Cari lagi', go, 'primary'));
      },
    });
  }
  go();
}

function createNumber(root, ctx) {
  const wrap = el('div', { class: 'act kata' });
  root.append(wrap);
  function go() {
    wrap.replaceChildren();
    numberRound(wrap, ctx, 1 + Math.floor(Math.random() * 1000), (asks) => {
      ctx.sound.win();
      wrap.append(el('p', { class: 'reveal' }, asks <= 10 ? `Ketemu dalam ${asks} tebakan, tidak lebih dari 10!` : `Ketemu dalam ${asks} tebakan. Dengan Cara Tengah cukup 10.`), button('Main lagi', go, 'primary'));
    });
  }
  go();
}
