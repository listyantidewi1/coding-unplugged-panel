// Manusia atau Mesin? — SMA/SMK (16–18 tahun), chatbot dan model bahasa.
// A rule-book chatbot (Sekar), the Turing test, rule order, a bigram model
// built from two pantun with a die, and how fluent sentences can be wrong.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (msg, w) => new RegExp(`(^|[^a-z0-9])${esc(w.toLowerCase())}($|[^a-z0-9])`).test(msg.toLowerCase());
const after = (msg, w) => { const m = new RegExp(`${esc(w)}\\s+([^.,!?;]*)`, 'i').exec(msg); return (m ? m[1] : '').trim(); };

// keys: words to look for; '#' = any digit, '?' = a question mark, [] = anything else.
export const RULES = [
  { keys: ['halo', 'hai'], reply: 'Halo juga! Aku Sekar. Lagi apa?' },
  { keys: ['nama'], reply: 'Namaku Sekar. Kalau kamu?' },
  { keys: ['suka'], reply: 'Aku juga suka {sesudah}! Kenapa kamu suka itu?' },
  { keys: ['kenapa', 'mengapa'], reply: 'Hmm, menurutmu sendiri kenapa?' },
  { keys: ['sedih', 'capek'], reply: 'Wah, aku ikut prihatin. Mau cerita?' },
  { keys: ['#'], reply: 'Aduh, aku payah berhitung. Bahas yang lain, yuk.' },
  { keys: ['?'], reply: 'Pertanyaan bagus! Kalau menurutmu bagaimana?' },
  { keys: [], reply: 'Oh, begitu. Terus?' },
];
const keyMatch = (msg, k) => (k === '#' ? /[0-9]/.test(msg) : k === '?' ? msg.includes('?') : hasWord(msg, k));
export function sekar(msg, rules = RULES) {
  const i = rules.findIndex((r) => !r.keys.length || r.keys.some((k) => keyMatch(msg, k)));
  if (i < 0) return { rule: -1, reply: '…' };
  const r = rules[i]; const k = r.keys.find((x) => keyMatch(msg, x));
  return { rule: i, reply: r.reply.replace('{sesudah}', k ? after(msg, k) : '') };
}
export const MESSAGES = [['a', 'Hai, apa kabar?', 0], ['b', 'Aku suka main bola.', 2], ['c', 'Berapa 17 ditambah 25?', 5], ['d', 'Kenapa langit berwarna biru?', 3], ['e', 'Aku tidak suka hujan.', 2], ['f', 'Siapa nama gurumu?', 1], ['g', 'Ceritakan liburanmu kemarin.', 7]];
const ruleText = (r) => (r.keys.length ? r.keys.map((k) => (k === '#' ? 'angka (0–9)' : k === '?' ? 'tanda tanya "?"' : `"${k}"`)).join(' atau ') : '(selain itu)');

export const PANTUN = ['pergi ke pasar membeli kain', 'kain dibawa pulang ke desa', 'mari belajar sambil bermain', 'belajar bersama setiap masa', 'pergi ke sawah menanam padi', 'padi ditanam di tepi kali', 'mari belajar sepenuh hati', 'belajar bersama setiap hari'];
export const TEACHERS = ['bu rina mengajar matematika di kelas sepuluh', 'pak joko mengajar bahasa di kelas sebelas'];
export const END = 'SELESAI';
const words = (line) => line.toLowerCase().replace(/[^a-z0-9À-ɏ\s-]/g, ' ').split(/\s+/).filter(Boolean);
// Next-word counts with a context of n words: Map("w1 w2" → Map(next → count)).
export function ngram(lines, n = 1) {
  const m = new Map();
  for (const l of lines) {
    const w = [...words(l), END];
    for (let i = 0; i < w.length - 1; i++) for (let c = 1; c <= n; c++) {
      if (i - c + 1 < 0) continue;
      const key = w.slice(i - c + 1, i + 1).join(' ');
      if (!m.has(key)) m.set(key, new Map());
      m.get(key).set(w[i + 1], (m.get(key).get(w[i + 1]) || 0) + 1);
    }
  }
  return m;
}
const nextOf = (m, sent, n) => { for (let c = Math.min(n, sent.length); c >= 1; c--) { const k = sent.slice(-c).join(' '); if (m.has(k)) return m.get(k); } return null; };
// Every sentence the model can make from `start`, with its probability.
export function allSentences(lines, start, n, limit = 30) {
  const m = ngram(lines, n); const out = [];
  const walk = (sent, p) => {
    if (sent.length > limit) { out.push([sent.join(' ') + ' …', p]); return; }
    const nx = nextOf(m, sent, n);
    if (!nx) { out.push([sent.join(' '), p]); return; }
    const tot = [...nx.values()].reduce((a, b) => a + b, 0);
    for (const [w, c] of nx) { if (w === END) out.push([sent.join(' '), (p * c) / tot]); else walk([...sent, w], (p * c) / tot); }
  };
  walk(words(start), 1);
  return out;
}
export const DICE = { ke: [[1, 2, 'pasar'], [3, 4, 'desa'], [5, 6, 'sawah']], kain: [[1, 3, 'dibawa'], [4, 6, END]], belajar: [[1, 2, 'bersama'], [3, 3, 'sambil'], [4, 4, 'sepenuh'], [5, 6, null]], setiap: [[1, 3, 'masa'], [4, 6, 'hari']], padi: [[1, 3, 'ditanam'], [4, 6, END]] };
const diceWord = (w, d) => DICE[w].find(([a, b]) => d >= a && d <= b)[2];
export const COUNT_WORDS = ['ke', 'kain', 'belajar', 'setiap', 'padi'];
export const LOOP = ['ke', 'pasar', 'membeli', 'kain', 'dibawa', 'pulang'];

// --- pieces ---
function rulebook(hi = -1, rules = RULES) {
  return el('table', { class: 'tu-aturan' }, el('tr', null, el('th', null, 'No.'), el('th', null, 'Jika pesan memuat…'), el('th', null, 'Balas dengan…')),
    rules.map((r, i) => el('tr', { class: i === hi ? 'kena' : '' }, el('td', null, i + 1), el('td', null, ruleText(r)), el('td', null, r.reply.replace('{sesudah}', '(kata sesudah "suka")')))));
}
function chatLine(who, text, cls = '') { return el('div', { class: `tu-balon ${cls}` }, el('b', null, who), el('span', null, text)); }

function ruleRound(wrap, ctx, { msgs, done }) {
  let k = 0;
  const host = el('div', { class: 'tu-dua' });
  const msg = el('p', { class: 'reveal info' }, 'Periksa aturan dari atas ke bawah; pakai aturan pertama yang cocok.');
  const log = el('div', { class: 'tu-chat' });
  const draw = (hi = -1) => {
    const m = msgs[k];
    host.replaceChildren(rulebook(hi), el('div', { class: 'tu-kanan' }, log, m ? el('div', null, el('p', { class: 'tu-tanya' }, `Pesan ${m[0]}: aturan nomor berapa?`), el('div', { class: 'seg tu-nomor' }, RULES.map((_, i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, i + 1), () => {
      if (i !== m[2]) { ctx.mistake(); shake(host); const first = RULES.findIndex((r, j) => j > i && false); void first; say(msg, 'bad', i < m[2] ? `Aturan ${i + 1} tidak cocok: pesannya tidak memuat ${ruleText(RULES[i])}.` : `Aturan ${i + 1} memang cocok, tetapi ada aturan di atasnya yang cocok lebih dulu.`); return; }
      const s = sekar(m[1]); log.append(chatLine('Pengunjung', m[1], 'kiri'), chatLine(`Sekar · aturan ${i + 1}`, s.reply, 'kanan')); ctx.sound.tap();
      say(msg, '', m[0] === 'c' ? 'Pesan c juga memuat "?", tetapi aturan 6 lebih dulu cocok.' : m[0] === 'e' ? 'Aturan tidak mengerti kata "tidak": Sekar salah paham.' : m[0] === 'f' ? 'Ditanya nama guru, Sekar menjawab namanya sendiri.' : m[0] === 'g' ? 'Tidak ada aturan yang cocok, jadi Sekar tidak bisa bercerita.' : 'Tepat.');
      k++; draw(i); if (k === msgs.length) setTimeout(done, 1800);
    })))) : null));
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Menjalankan Buku Aturan Sekar'), host, msg);
}

function insertRound(wrap, ctx, { done }) {
  const NEW = { keys: ['tidak suka'], reply: 'Oh, kamu tidak suka {sesudah}? Kenapa?' };
  const msg = el('p', { class: 'reveal info' }, 'Aturan baru: jika pesan memuat "tidak suka", balas "Oh, kamu tidak suka (kata sesudahnya)? Kenapa?". Ketuk celah tempat aturan itu disisipkan.');
  const host = el('div', { class: 'tu-dua' });
  let fin = false;
  const draw = (pos = -1) => {
    const rules = pos < 0 ? RULES : [...RULES.slice(0, pos), NEW, ...RULES.slice(pos)];
    const s = pos < 0 ? null : sekar('Aku tidak suka hujan.', rules);
    host.replaceChildren(el('div', { class: 'tu-sisip' }, ...RULES.flatMap((r, i) => [onTap(el('button', { class: `tu-celah ${pos === i ? 'on' : ''}`, type: 'button' }, pos === i ? `➕ ${ruleText(NEW)}` : '＋ sisipkan di sini'), () => {
      if (fin) return; draw(i);
      const ok = sekar('Aku tidak suka hujan.', [...RULES.slice(0, i), NEW, ...RULES.slice(i)]).rule === i;
      if (!ok) { ctx.mistake(); say(msg, 'bad', `Di posisi ini aturan "suka" (sekarang nomor ${i < 3 ? 4 : 3}) cocok lebih dulu, jadi aturan baru tidak pernah dipakai.`); return; }
      fin = true; ctx.sound.good(); say(msg, '', `Aturan baru menjadi nomor ${i + 1}, sebelum aturan "suka", sehingga cocok lebih dulu.`); setTimeout(done, 2200);
    }), el('div', { class: 'tu-baris-aturan' }, el('b', null, i + 1), `${ruleText(r)} → ${r.reply.replace('{sesudah}', '…')}`)])),
    el('div', { class: 'tu-kanan' }, el('div', { class: 'tu-chat' }, chatLine('Pengunjung', 'Aku tidak suka hujan.', 'kiri'), s ? chatLine(`Sekar · aturan ${s.rule + 1}`, s.reply, 'kanan') : null)));
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Memperbaiki buku aturan: di mana aturan "tidak suka" diletakkan?'), host, msg);
}

// Tap every occurrence of the word in the corpus; the table fills itself.
function countRound(wrap, ctx, { done }) {
  let t = 0; const seen = new Set();
  const lines = PANTUN.map(words);
  const msg = el('p', { class: 'reveal info' }, 'Ketuk setiap kemunculan kata yang ditanyakan di pantun. Kata sesudahnya akan dicatat.');
  const host = el('div', { class: 'tu-dua' });
  const tally = COUNT_WORDS.map(() => new Map());
  const draw = () => {
    const target = COUNT_WORDS[t];
    host.replaceChildren(el('div', { class: 'tu-korpus' }, lines.map((ws, li) => el('div', { class: `tu-larik ${li === 4 ? 'jeda' : ''}` }, ws.map((w, wi) => {
      const id = `${li}-${wi}`; const nx = ws[wi + 1] || END; const isNext = [...seen].some((s) => { const [a, b] = s.split('-').map(Number); return a === li && b === wi - 1; });
      return onTap(el('button', { class: `tu-kata ${seen.has(id) ? 'pilih' : ''} ${isNext ? 'sesudah' : ''}`, type: 'button' }, w), () => {
        if (t >= COUNT_WORDS.length || seen.has(id)) return;
        if (w !== target) { ctx.mistake(); shake(host); say(msg, 'bad', `Itu kata "${w}". Cari kata "${target}".`); return; }
        seen.add(id); const m = tally[t]; m.set(nx, (m.get(nx) || 0) + 1); ctx.sound.tap();
        const total = lines.flat().filter((x) => x === target).length;
        const got = [...m.values()].reduce((a, b) => a + b, 0);
        if (got === total) { t++; seen.clear(); say(msg, '', `${target} → ${[...m].map(([a, b]) => `${a} (${b})`).join(', ')}.`); if (t === COUNT_WORDS.length) setTimeout(done, 1600); }
        draw();
      });
    }), ws.length ? el('span', { class: 'tu-akhir' }, '⏎') : null))),
    el('table', { class: 'tu-tabel' }, el('tr', null, el('th', null, 'Kata'), el('th', null, 'Kata berikutnya (banyak)')), el('tr', null, el('td', null, 'pergi'), el('td', null, 'ke (2)')),
      COUNT_WORDS.map((w, i) => el('tr', { class: i === t ? 'kini' : '' }, el('td', null, w), el('td', null, [...tally[i]].map(([a, b]) => `${a} (${b})`).join(', ') || (i === t ? '?' : ''))))));
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Model bigram: lengkapi tabel kata berikutnya dari korpus pantun.'), host, msg);
}

function diceTable() {
  return el('table', { class: 'tu-tabel kecil' }, el('tr', null, el('th', null, 'Kata'), el('th', null, 'Hasil dadu')),
    Object.entries(DICE).map(([w, r]) => el('tr', null, el('td', null, w), el('td', null, r.map(([a, b, x]) => `${a === b ? a : `${a}–${b}`} ${x || 'lempar ulang'}`).join(', ')))));
}
// Build a sentence with the die; the player picks the next word each time.
function diceRound(wrap, ctx, { starts, done }) {
  const m = ngram(PANTUN, 1); let si = 0; let sent = [starts[0]]; let die = null; const made = [];
  const msg = el('p', { class: 'reveal info' }, 'Bila kata punya beberapa kata berikutnya, lempar dadu lalu pilih kata menurut tabel.');
  const host = el('div', { class: 'tu-dua' });
  const draw = () => {
    const w = sent[sent.length - 1]; const nx = [...(m.get(w) || new Map()).keys()];
    const many = nx.length > 1;
    const opts = many && die == null ? [] : nx;
    host.replaceChildren(el('div', { class: 'tu-kanan' }, el('div', { class: 'tu-kalimat' }, sent.join(' '), el('span', { class: 'kursor' }, ' ▌')),
      many ? el('div', { class: 'tu-dadu-baris' }, onTap(el('button', { class: 'btn primary', type: 'button' }, '🎲 Lempar dadu'), () => { die = ctx.rand.int(1, 6); ctx.sound.tap(); draw(); }), el('span', { class: 'tu-dadu' }, die == null ? '–' : '⚀⚁⚂⚃⚄⚅'[die - 1]), die != null ? el('b', null, die) : null) : null,
      el('div', { class: 'seg tu-pilih' }, opts.map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, x === END ? '⏹ SELESAI' : x), () => {
        if (many) {
          const want = diceWord(w, die);
          if (want == null) { ctx.mistake(); say(msg, 'bad', `Dadu ${die} untuk "${w}" berarti lempar ulang.`); return; }
          if (x !== want) { ctx.mistake(); shake(host); say(msg, 'bad', `Menurut tabel, dadu ${die} untuk "${w}" berarti "${want}".`); return; }
        }
        die = null; ctx.sound.tap();
        if (x === END) {
          const s = sent.join(' '); const inCorpus = PANTUN.includes(s); made.push([s, inCorpus]);
          say(msg, '', `"${s}" ${inCorpus ? 'ada di korpus.' : 'kalimat baru, tidak ada di korpus!'}`);
          si++; if (si === starts.length) { setTimeout(() => done(made), 2200); draw(); return; }
          sent = [starts[si]];
        } else sent.push(x);
        draw();
      }))), el('div', { class: 'tu-jadi' }, made.map(([s, c]) => el('div', null, el('span', null, s), el('b', { class: c ? '' : 'baru' }, c ? 'ada di korpus' : 'baru'))))), diceTable());
  };
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Buat kalimat dengan dadu, mulai dari "${starts.join('" lalu "')}".`), host, msg);
}

function truthRound(wrap, ctx, { done }) {
  const S = allSentences(TEACHERS, 'bu rina', 1).map(([s]) => s);
  const res = {};
  const msg = el('p', { class: 'reveal info' }, 'Tandai setiap kalimat buatan model: benar atau salah menurut korpus.');
  const rows = el('div', { class: 'tu-benar' });
  const draw = () => rows.replaceChildren(...S.map((s, i) => { const ok = TEACHERS.includes(s); return el('div', { class: `tu-b-baris ${i in res ? 'beres' : ''}` }, el('span', null, s), i in res ? el('b', { class: ok ? 'ya' : 'tidak' }, ok ? '✓ Benar' : '✗ Salah') : el('div', { class: 'seg' }, [[true, 'Benar'], [false, 'Salah']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== ok) { ctx.mistake(); say(msg, 'bad', ok ? 'Kalimat ini persis ada di korpus.' : 'Bu Rina mengajar matematika di kelas sepuluh. Kalimat ini mencampur potongan dua kalimat.'); return; }
    res[i] = v; ctx.sound.tap(); draw();
    if (Object.keys(res).length === S.length) { say(msg, '', 'Hanya satu dari empat yang benar, padahal semuanya terdengar lancar.'); done(); }
  })))); }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lancar, tetapi salah: semua kalimat yang bisa dibuat model dari "bu rina"'), el('div', { class: 'tu-korpus kecil' }, TEACHERS.map((t) => el('div', { class: 'tu-larik' }, t))), rows, msg);
}

export default {
  id: 'sma-25-uji-turing',
  title: 'Manusia atau Mesin?',
  topic: 'Chatbot aturan, uji Turing, dan model bahasa',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🤖',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Jalankan buku aturan chatbot Sekar, perbaiki urutan aturannya, buat model bahasa dari pantun dengan dadu, lalu temukan mengapa kalimat yang lancar bisa salah.',
  extraModes: [
    { id: 'chatbot', icon: '💬', label: 'Chatbot Aturan', desc: 'Ketik pesan dan lihat aturan Sekar yang cocok; tambah, hapus, dan urutkan ulang aturannya', create: createChatbot },
    { id: 'bigram', icon: '🎲', label: 'Pembuat Kalimat', desc: 'Ganti korpus dengan pantun buatanmu; lihat tabel kata berikutnya dan buat kalimat dengan dadu digital', create: createBigram },
    { id: 'lancar', icon: '⚖️', label: 'Lancar tetapi Salah', desc: 'Hitung berapa persen kalimat tentang dua guru yang benar dengan model bigram, trigram, dan empat kata', create: createFluent },
    { id: 'giliran', icon: '🎭', label: 'Uji Turing Dua Tim', desc: 'Satu tim bertanya; jendela A dan B dijawab tim lain dan chatbot aturan secara acak; tebak mana mesinnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act uji-turing' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const korpus = (ls = PANTUN) => el('div', { class: 'tu-korpus kecil' }, ls.map((t) => el('div', { class: 'tu-larik' }, t)));
      if (r === 0) ruleRound(wrap, ctx, { msgs: MESSAGES.slice(0, 4), done: next });
      else if (r === 1) ruleRound(wrap, ctx, { msgs: MESSAGES.slice(4), done: then(() => ask('Balasan untuk pesan e, f, dan g: mana yang membongkar Sekar sebagai mesin?', [['Ketiganya: e salah paham kata "tidak", f menjawab nama sendiri, g tidak bisa bercerita', true], ['Hanya g'], ['Hanya e'], ['Tidak ada; semuanya terdengar seperti manusia']])) });
      else if (r === 2) ask('Bermain uji Turing: pertanyaan seperti apa yang paling cepat membongkar mesin?', [['Meminta cerita, pertanyaan lanjutan yang merujuk jawaban sebelumnya, atau kalimat dengan kata "tidak"', true], ['Menyapa "halo"'], ['Bertanya nama'], ['Pertanyaan pendek yang diakhiri tanda tanya']], 1, null,
        then(() => ask('Jika suatu hari mesin selalu lolos uji Turing, apakah itu berarti mesin memahami percakapannya?', [['Belum tentu: uji Turing mengukur kemampuan meniru percakapan; murid yang menjadi mesin pun menjawab tanpa memahami', true], ['Ya, pasti memahami'], ['Tidak mungkin ada mesin yang lolos'], ['Ya, karena mesin lebih pintar dari manusia']])));
      else if (r === 3) insertRound(wrap, ctx, { done: then(() => ask('Berapa banyak aturan yang dibutuhkan supaya Sekar bisa menjawab semua pesan dengan masuk akal?', [['Tidak terhingga; aturan cocok untuk tugas sempit, sehingga chatbot modern belajar dari data', true], ['Sekitar 100 aturan'], ['Cukup 8 aturan yang ada'], ['Sebanyak kata dalam KBBI']])) });
      else if (r === 4) countRound(wrap, ctx, { done: then(() => ask('Mengapa pembagian dadu untuk "belajar" dibuat tidak sama rata (1–2 bersama, 3 sambil, 4 sepenuh, 5–6 ulang)?', [['"bersama" muncul dua kali sesudah "belajar", jadi peluangnya 2/4; lemparan 5–6 diulang supaya pembagiannya tepat', true], ['Supaya lebih seru'], ['Karena "bersama" kata yang lebih panjang'], ['Supaya kalimat lebih cepat selesai']], 1, diceTable())) });
      else if (r === 5) diceRound(wrap, ctx, { starts: ['mari', 'pergi'], done: (made) => { wrap.replaceChildren(); ask('Mengapa model bisa membuat kalimat yang tidak pernah ada di korpus?', [['Model hanya mengingat pasangan kata berurutan, sehingga bisa menyambung potongan dari baris yang berbeda', true], ['Dadunya rusak'], ['Model mengarang kata baru'], ['Tidak bisa; semua kalimat pasti ada di korpus']], 1, el('div', { class: 'tu-jadi' }, made.map(([s, c]) => el('div', null, el('span', null, s), el('b', { class: c ? '' : 'baru' }, c ? 'ada di korpus' : 'baru'))))); } });
      else if (r === 6) ask('Korpus baru: dua kalimat yang benar. Dengan model bigram, "mengajar" bisa diikuti… dan "kelas" bisa diikuti…', [['matematika atau bahasa; sepuluh atau sebelas', true], ['matematika saja; sepuluh saja'], ['di atau kelas; bu atau pak'], ['rina atau joko; matematika atau bahasa']], 1, korpus(TEACHERS), then(() => truthRound(wrap, ctx, { done: next })));
      else if (r === 7) ask('Berapa peluang model bigram membuat kalimat yang benar tentang Bu Rina?', [['1/4', true], ['1/2'], ['3/4'], ['1']], 4, korpus(TEACHERS),
        then(() => ask('Model trigram melihat dua kata sebelumnya: sesudah "rina mengajar" pasti "matematika". Berapa peluang kalimat benar sekarang, dan mengapa belum semuanya benar?', [['1/2: sesudah "di kelas" model masih bisa memilih sepuluh atau sebelas, karena "di kelas" ada di kedua kalimat', true], ['1: semuanya sudah benar'], ['1/4: tidak ada bedanya'], ['1/3: ada tiga kemungkinan']], 1, korpus(TEACHERS))));
      else if (r === 8) ask('Chatbot modern melihat ribuan kata dan belajar dari miliaran kalimat. Mengapa jawabannya tetap bisa salah?', [['Ia belajar kata apa yang biasanya muncul berikutnya, bukan memeriksa kebenaran; kesalahan yang meyakinkan ini disebut halusinasi', true], ['Karena komputernya kurang cepat'], ['Karena ia sengaja berbohong'], ['Tidak bisa salah bila datanya miliaran']], 1, null,
        then(() => ask('Fajar menyalin jawaban chatbot untuk tugas sejarah tanpa memeriksanya, dan ada tahun yang salah. Siapa yang bertanggung jawab?', [['Fajar: chatbot alat bantu; yang memakai dan mengumpulkan jawabannya wajib memeriksa', true], ['Chatbot'], ['Perusahaan pembuat chatbot saja'], ['Guru sejarah']], 1, null,
          then(() => ask('Chatbot layanan pelanggan toko daring menjanjikan pengembalian uang yang sebenarnya tidak berlaku. Siapa yang menanggungnya?', [['Toko yang memasang chatbot itu, karena chatbot berbicara atas nama toko', true], ['Pembeli, karena percaya pada mesin'], ['Tidak ada, karena itu kesalahan mesin'], ['Penyedia internet']])))));
      else ask('OSIS ingin memakai chatbot untuk memutuskan siapa yang mendapat bantuan seragam. Pantaskah?', [['Tidak pantas bila diserahkan sepenuhnya; KA boleh merangkum data, tetapi manusia yang memutuskan dengan kriteria jelas', true], ['Pantas, karena mesin tidak pilih kasih'], ['Pantas, asalkan chatbotnya mahal'], ['Tidak boleh memakai komputer sama sekali']], 1, null,
        then(() => ask('Apakah orang berhak tahu bahwa lawan bicaranya mesin?', [['Berhak, supaya bisa menilai jawaban dengan hati-hati, tidak tertipu, dan bisa meminta dilayani manusia', true], ['Tidak perlu, selama jawabannya lancar'], ['Hanya bila ditanya'], ['Tidak, supaya chatbot terasa alami']], 1, null,
          then(() => ask('Tantangan: pada model pantun ada kalimat tanpa akhir. Kata-kata apa saja di putaran itu?', [['ke → pasar → membeli → kain → dibawa → pulang → ke', true], ['mari → belajar → bersama → setiap → mari'], ['padi → ditanam → di → tepi → kali → padi'], ['belajar → sambil → bermain → belajar']], 1, el('div', { class: 'tu-korpus kecil' }, PANTUN.map((t) => el('div', { class: 'tu-larik' }, t))),
            then(() => ask('Kalimat mana yang melewati putaran itu dua kali?', [['pergi ke pasar membeli kain dibawa pulang ke pasar membeli kain dibawa pulang ke desa', true], ['pergi ke pasar membeli kain dibawa pulang ke desa'], ['pergi ke sawah menanam padi ditanam di tepi kali'], ['mari belajar bersama setiap hari']])))))));
    }
    render();
  },
};

// --- extra modes ---
function createChatbot(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing' });
  root.append(wrap);
  let rules = RULES.map((r) => ({ ...r, keys: [...r.keys] }));
  let hi = -1; const log = [];
  const input = el('input', { class: 'txt wide', type: 'text', maxlength: 80, autocomplete: 'off', 'aria-label': 'pesan', placeholder: 'Ketik pesan untuk Sekar' });
  const kIn = el('input', { class: 'txt', type: 'text', maxlength: 30, 'aria-label': 'kata kunci', placeholder: 'kata kunci, mis. tidak suka' });
  const rIn = el('input', { class: 'txt wide', type: 'text', maxlength: 80, 'aria-label': 'balasan', placeholder: 'balasan; {sesudah} = kata sesudah kata kunci' });
  const send = () => { const t = input.value.trim(); if (!t) return; const s = sekar(t, rules); hi = s.rule; log.push(['Kamu', t, 'kiri'], [`Sekar · aturan ${s.rule + 1}`, s.reply, 'kanan']); input.value = ''; ctx.sound.tap(); draw(); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  function draw() {
    const table = el('div', { class: 'tu-sisip' }, rules.map((r, i) => el('div', { class: `tu-baris-aturan ${i === hi ? 'kena' : ''}` }, el('b', null, i + 1), el('span', null, `${ruleText(r)} → ${r.reply}`),
      r.keys.length ? el('span', { class: 'tu-alat' }, onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'naik' }, '▲'), () => { if (i > 0) { [rules[i - 1], rules[i]] = [rules[i], rules[i - 1]]; hi = -1; draw(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'turun' }, '▼'), () => { if (rules[i + 1]?.keys.length) { [rules[i + 1], rules[i]] = [rules[i], rules[i + 1]]; hi = -1; draw(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { rules.splice(i, 1); hi = -1; draw(); })) : null)));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Chatbot aturan Sekar'), el('div', { class: 'tu-dua' }, table,
      el('div', { class: 'tu-kanan' }, el('div', { class: 'tu-chat' }, log.slice(-8).map(([w, t, c]) => chatLine(w, t, c))), el('div', { class: 'kode-baris' }, input, button('Kirim', send, 'primary')),
        el('div', { class: 'tu-tambah' }, el('b', null, 'Aturan baru (ditaruh paling atas)'), kIn, rIn, button('Tambah aturan', () => { const k = kIn.value.trim().toLowerCase(); const rp = rIn.value.trim(); if (!k || !rp) return; rules.unshift({ keys: k.split(/\s+atau\s+|,\s*/).filter(Boolean), reply: rp }); kIn.value = ''; rIn.value = ''; hi = -1; draw(); }), button('Kembalikan aturan awal', () => { rules = RULES.map((r) => ({ ...r, keys: [...r.keys] })); hi = -1; draw(); })))));
  }
  draw();
}

function createBigram(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing' });
  root.append(wrap);
  const area = el('textarea', { class: 'tu-teks', rows: 8, 'aria-label': 'korpus', spellcheck: 'false' });
  area.value = PANTUN.join('\n');
  let made = [];
  function gen() {
    const lines = area.value.split('\n').map((l) => l.trim()).filter(Boolean);
    const m = ngram(lines, 1); const starts = [...new Set(lines.map((l) => words(l)[0]).filter(Boolean))];
    if (!starts.length) return;
    const s = [ctx.rand.pick(starts)];
    for (let i = 0; i < 40; i++) {
      const nx = m.get(s[s.length - 1]); if (!nx) break;
      const tot = [...nx.values()].reduce((a, b) => a + b, 0); let d = ctx.rand.int(1, tot); let pick = END;
      for (const [w, c] of nx) { d -= c; if (d <= 0) { pick = w; break; } }
      if (pick === END) break; s.push(pick);
    }
    const t = s.join(' '); made = [[t, lines.map((l) => words(l).join(' ')).includes(t)], ...made].slice(0, 6); ctx.sound.tap(); draw();
  }
  function draw() {
    const lines = area.value.split('\n').map((l) => l.trim()).filter(Boolean);
    const m = ngram(lines, 1);
    const rows = [...m].filter(([, nx]) => nx.size > 1 || [...nx.keys()][0] !== END).sort((a, b) => b[1].size - a[1].size);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pembuat kalimat bigram'), el('div', { class: 'tu-dua' },
      el('div', { class: 'tu-kanan' }, el('b', null, 'Korpus (satu baris satu kalimat)'), area, el('div', { class: 'kode-baris' }, button('Bangun ulang tabel', draw), button('🎲 Buat kalimat', gen, 'primary')),
        el('div', { class: 'tu-jadi' }, made.map(([s, c]) => el('div', null, el('span', null, s), el('b', { class: c ? '' : 'baru' }, c ? 'ada di korpus' : 'baru'))))),
      el('div', { class: 'tu-panah' }, rows.slice(0, 40).map(([w, nx]) => el('div', { class: nx.size > 1 ? 'cabang' : '' }, el('b', null, w), ' → ', [...nx].map(([a, c]) => `${a === END ? '⏹' : a}${c > 1 ? ` (${c})` : ''}`).join(' · '))))));
  }
  draw();
}

function createFluent(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing' });
  root.append(wrap);
  let n = 1; let start = 'bu rina';
  function draw() {
    const S = allSentences(TEACHERS, start, n);
    const good = S.filter(([s]) => TEACHERS.includes(s)).reduce((a, [, p]) => a + p, 0);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Lancar tetapi salah'), el('div', { class: 'tu-korpus kecil' }, TEACHERS.map((t) => el('div', { class: 'tu-larik' }, t))),
      el('div', { class: 'tu-dadu-baris' }, el('div', { class: 'seg' }, [[1, 'Bigram (1 kata)'], [2, 'Trigram (2 kata)'], [3, '3 kata'], [4, 'Empat kata']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${n === v ? 'on' : ''}`, type: 'button' }, l), () => { n = v; draw(); }))),
        el('div', { class: 'seg' }, ['bu rina', 'pak joko'].map((v) => onTap(el('button', { class: `seg-btn ${start === v ? 'on' : ''}`, type: 'button' }, `mulai "${v}"`), () => { start = v; draw(); })))),
      el('div', { class: 'tu-benar' }, S.map(([s, p]) => { const ok = TEACHERS.includes(s); return el('div', { class: 'tu-b-baris beres' }, el('span', null, s), el('b', { class: ok ? 'ya' : 'tidak' }, `${ok ? '✓ benar' : '✗ salah'} · peluang ${Math.round(p * 100)}%`)); })),
      el('p', { class: 'reveal' }, `Peluang kalimat benar: ${Math.round(good * 100)}%. ${good < 1 ? 'Semua kalimat terdengar lancar, tetapi tidak semuanya benar.' : 'Konteksnya cukup panjang untuk korpus sekecil ini.'}`));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0;
    function turn() {
      if (k >= nT) { finishBoard(wrap, ctx, { title: 'Uji Turing selesai', pts, again: () => pickTeams(wrap, 'Uji Turing Dua Tim', start) }); return; }
      const a = k; const b = (k + 1) % nT; const botSide = ctx.rand.int(0, 1); const log = [];
      const ask = () => {
        const q = el('input', { class: 'txt wide', type: 'text', maxlength: 80, autocomplete: 'off', 'aria-label': 'pertanyaan', placeholder: 'Tulis pertanyaan untuk A dan B' });
        const go = () => { const t = q.value.trim(); if (!t) return; answer(t); };
        q.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1} (penanya): pertanyaan ${log.length + 1} dari 3`), board(), el('div', { class: 'kode-baris' }, q, button('Kirim', go, 'primary')),
          log.length ? el('div', { class: 'kode-baris' }, button('Sudah bisa menebak ➜', guess)) : null);
        q.focus();
      };
      const answer = (t) => {
        const h = el('input', { class: 'txt wide', type: 'text', maxlength: 80, autocomplete: 'off', 'aria-label': 'jawaban', placeholder: 'Jawab dengan pikiranmu sendiri' });
        const go = () => { const v = h.value.trim(); if (!v) return; const bot = sekar(t).reply; log.push([t, botSide === 0 ? [bot, v] : [v, bot]]); ctx.sound.tap(); if (log.length >= 3) guess(); else ask(); };
        h.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1} (manusia) menjawab. Tim ${a + 1} berpaling!`), el('div', { class: 'tu-chat' }, chatLine('Pertanyaan', t, 'kiri')), el('div', { class: 'kode-baris' }, h, button('Kirim', go, 'primary')));
        h.focus();
      };
      const board = () => el('div', { class: 'tu-ab' }, ['A', 'B'].map((s, i) => el('div', { class: 'tu-jendela' }, el('b', null, `Jendela ${s}`), log.map(([t, ans]) => el('div', null, chatLine('Tanya', t, 'kiri'), chatLine(s, ans[i], 'kanan'))))));
      const guess = () => {
        wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: mana mesinnya?`), board(), el('div', { class: 'opts', style: { '--cols': 2 } }, ['A', 'B'].map((s, i) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, `Jendela ${s} mesin`)), (e) => {
          const ok = i === botSide; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          if (ok) pts[a] += 2; else pts[b] += 2;
          wrap.append(el('p', { class: 'reveal' }, ok ? `Tepat! Tim ${a + 1} +2.` : `Mesinnya jendela ${botSide ? 'B' : 'A'}. Tim ${b + 1} +2 karena penanya tertipu.`));
          k++; setTimeout(turn, 3200);
        }))));
      };
      ask();
    }
    turn();
  }
  pickTeams(wrap, 'Uji Turing Dua Tim', start);
}
