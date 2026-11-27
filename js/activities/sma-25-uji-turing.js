// Manusia atau Mesin? — SMA/SMK (16–18 tahun), chatbot dan model bahasa.
// Stan Manusia atau Mesin?: run a rule-book chatbot (Sekar), stamp the replies
// that give it away, a Turing booth, patch the rule order, a bigram model
// built from two pantun with a die, a probability tree, fluent-but-wrong
// sentences, who is responsible, and the loop that never ends.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill, adeganDulu } from './misi-kit.js';

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


function chatLine(who, text, cls = '') { return el('div', { class: `tu-balon ${cls}` }, el('b', null, who), el('span', null, text)); }

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
  wrap.append(host, msg);
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


// --- game data (Stan Manusia atau Mesin?) ---
// Questions a visitor can send to the booth, with what a human at the booth answers.
export const BOOTH = [
  ['Halo!', 'Halo juga! Mau lihat-lihat stan kami?'],
  ['Siapa nama kamu?', 'Aku Raka, kelas sebelas. Kamu?'],
  ['Aku tidak suka pelajaran olahraga.', 'Kenapa? Capek lari keliling lapangan, ya?'],
  ['Ceritakan sarapanmu tadi pagi.', 'Nasi uduk dekat gerbang, pakai tempe orek.'],
  ['Berapa 12 tambah 30?', '42. Kenapa, mau mengetes aku?'],
  ['Aku capek habis upacara.', 'Sama, panas banget tadi. Sudah minum?'],
];
// Extra human replies for the two-team mode (the human team picks one).
const HUMAN_ALT = [
  ['Hai! Sini, coba mainan kami.', 'Halo. Kamu dari kelas mana?'],
  ['Panggil saja Dina.', 'Rahasia dong, tebak saja.'],
  ['Aku juga kurang suka, apalagi kalau siang.', 'Masa? Aku malah suka voli.'],
  ['Belum sarapan, nanti saja di kantin.', 'Roti sama teh manis, buru-buru.'],
  ['Empat puluh dua.', 'Tunggu… 42!'],
  ['Istirahat dulu, duduk sini.', 'Iya, lama banget tadi amanatnya.'],
];
const REVEALS = { 2: 'Sekar tidak mengerti kata "tidak" dan malah membalas "aku juga suka".', 3: 'Sekar tidak bisa bercerita, jadi hanya membalas "Oh, begitu. Terus?".', 4: 'Sekar menghindari hitungan.' };

export const PATCHES = [
  { keys: ['tidak suka'], reply: 'Oh, kamu tidak suka {sesudah}? Kenapa?', test: 'Aku tidak suka hujan.', why: 'Aturan "tidak suka" harus di atas aturan "suka"; kalau di bawahnya, aturan "suka" selalu cocok lebih dulu.' },
  { keys: ['gurumu'], reply: 'Aku tidak punya guru; aku program buatan OSIS.', test: 'Siapa nama gurumu?', why: 'Aturan "gurumu" harus di atas aturan "nama"; kalau di bawahnya, Sekar tetap menjawab namanya sendiri.' },
];
export const TARGETS = ['pergi ke desa', 'pergi ke sawah menanam padi ditanam di tepi kali', 'pergi ke pasar membeli kain dibawa pulang ke desa'];
export const CASES = [
  ['fajar', '📚', 'Fajar menyalin jawaban chatbot untuk tugas sejarah tanpa memeriksanya, dan ada tahun yang salah. Siapa yang bertanggung jawab?'],
  ['toko', '🛒', 'Chatbot toko daring menjanjikan pengembalian uang yang sebenarnya tidak berlaku. Siapa yang menanggungnya?'],
  ['osis', '👕', 'OSIS ingin chatbot memutuskan sendiri siapa yang mendapat bantuan seragam. Pantaskah?'],
  ['hak', '💬', 'Pembeli tidak tahu bahwa yang membalas pesannya adalah mesin. Bagaimana seharusnya?'],
];
export const VERDICTS = [
  ['fajar', '🧑 Fajar: yang memakai dan mengumpulkan wajib memeriksa'],
  ['toko', '🏪 Toko: chatbot berbicara atas nama toko'],
  ['osis', '🙅 Tidak pantas diserahkan penuh; manusia memutuskan dengan kriteria jelas'],
  ['hak', '📢 Ia berhak diberi tahu bahwa lawan bicaranya mesin'],
  [null, '🤖 Chatbot itu sendiri', 'Chatbot hanyalah alat; ia tidak bisa dimintai tanggung jawab.'],
  [null, '🤷 Tidak ada; itu kesalahan mesin', 'Selalu ada manusia yang memasang atau memakai mesin itu.'],
];

const HEAD25 = {
  jalan: ['Jalankan Sekar', 'Kamu Mesin di stan: cari aturan pertama yang cocok untuk setiap pesan.'],
  bongkar: ['Rekaman Stan', 'Jalankan pesan e–g, lalu tempel cap 🤖 pada balasan yang membongkar mesin.'],
  turing: ['Stan Uji Turing', 'Kirim tiga pertanyaan ke jendela A dan B, lalu tebak mana mesinnya.'],
  tambal: ['Tambal Buku Aturan', 'Seret kartu aturan baru ke celah yang membuat Sekar menjawab benar.'],
  hitung: ['Tabel Kata Berikutnya', 'Ketuk setiap kemunculan kata di pantun; tabelnya terisi sendiri.'],
  dadu: ['Mesin Pantun Berdadu', 'Lempar dadu dan sambung kata menurut tabel.'],
  pohon: ['Pohon Peluang', 'Telusuri jalur setiap kalimat; peluangnya dikalikan di setiap cabang.'],
  lancar: ['Lancar tetapi Salah', 'Cap setiap kalimat buatan model: benar atau salah menurut korpus.'],
  sidang: ['Sidang Tanggung Jawab', 'Seret kartu putusan ke kasus yang tepat.'],
  bos: ['Labirin Kata', 'Mulai dari "ke", cari jalan yang kembali ke "ke": kalimat tanpa akhir.'],
};

// --- game pieces ---
const msgLine = (t) => el('p', { class: 'reveal info' }, t);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };

function bookRows(rules, onRow, hi = -1) {
  return rules.map((r, i) => onTap(el('button', { class: `tu25-aturan ${i === hi ? 'kena' : ''}`, type: 'button', 'data-r': i }, el('b', null, i + 1), el('span', null, ruleText(r)), el('small', null, r.reply.replace('{sesudah}', '…'))), (e) => onRow(i, e.currentTarget)));
}

function runRound(area, ctx, { msgs, done }) {
  let k = 0;
  const msg = msgLine('Periksa aturan dari atas ke bawah. Ketuk aturan pertama yang cocok.');
  const book = el('div', { class: 'tu25-buku' });
  const paper = el('div', { class: 'tu25-kertas' });
  const log = el('div', { class: 'tu-chat tu25-chat' });
  const draw = (hi = -1) => {
    fill(book, el('b', { class: 'tu25-judul' }, '📕 Buku Aturan Sekar'), bookRows(RULES, (i, b) => {
      const m = msgs[k]; if (!m) return;
      if (i !== m[2]) { ctx.mistake(); shake(b); const fits = !RULES[i].keys.length || RULES[i].keys.some((x) => keyMatch(m[1], x)); say(msg, 'bad', fits ? `Aturan ${i + 1} memang cocok, tetapi ada aturan di atasnya yang cocok lebih dulu.` : `Aturan ${i + 1} tidak cocok: pesannya tidak memuat ${ruleText(RULES[i])}.`); return; }
      const s = sekar(m[1]); fill(log, chatLine('Pengunjung', m[1], 'kiri'), chatLine(`Sekar · aturan ${i + 1}`, s.reply, 'kanan')); ctx.sound.tap();
      say(msg, '', m[0] === 'c' ? 'Pesan c juga memuat "?", tetapi aturan 6 cocok lebih dulu.' : m[0] === 'e' ? 'Aturan tidak mengerti kata "tidak": Sekar salah paham.' : m[0] === 'f' ? 'Ditanya nama guru, Sekar menjawab namanya sendiri.' : m[0] === 'g' ? 'Tidak ada aturan yang cocok, jadi Sekar tidak bisa bercerita.' : 'Tepat.');
      k++; draw(i);
      if (k === msgs.length) { if (m[0] === 'd') say(msg, '', 'Empat pesan terbalas. Sekar tidak berpikir: ia hanya mencocokkan kata dan memakai aturan pertama yang cocok.'); setTimeout(done, 2000); }
    }, hi));
    const m = msgs[k];
    fill(paper, m ? [el('small', null, `✉️ Kertas pesan ${m[0]} (${k + 1} dari ${msgs.length})`), el('b', null, m[1])] : el('small', null, '✅ Semua pesan sudah dibalas'));
  };
  draw();
  area.append(el('div', { class: 'tu25-meja' }, book, el('div', { class: 'tu25-sisi' }, paper, log)), msg);
}

function stampRound(area, ctx, { done }) {
  const msg = msgLine('Rekaman percakapan stan. Tempel cap 🤖 pada setiap balasan yang membongkar bahwa Sekar mesin.');
  let hit = 0; const need = ['e', 'f', 'g'];
  const pairs = MESSAGES.map(([id, t]) => el('div', { class: 'tu25-pasang' }, chatLine(`Pengunjung ${id}`, t, 'kiri'),
    onTap(el('button', { class: 'tu-balon kanan tu25-cap', type: 'button', 'data-m': id }, el('b', null, 'Sekar'), el('span', null, sekar(t).reply)), (e) => {
      const b = e.currentTarget; if (b.classList.contains('dicap') || hit === need.length) return;
      if (!need.includes(id)) { ctx.mistake(); shake(b); say(msg, 'bad', 'Balasan ini masih masuk akal untuk manusia. Cari balasan yang salah paham atau tidak nyambung.'); return; }
      b.classList.add('dicap'); ctx.sound.tap(); hit++;
      if (hit < need.length) { say(msg, '', `Cap ${hit} dari 3.`); return; }
      say(msg, '', 'Tiga balasan membongkar Sekar: salah paham kata "tidak", menjawab namanya sendiri saat ditanya nama guru, dan tidak bisa bercerita.'); done();
    })));
  fill(area, el('div', { class: 'tu25-rekaman' }, pairs), msg);
}

function turingRound(area, ctx, { done }) {
  const msg = msgLine('Kamu penanya. Pilih tiga pertanyaan; satu jendela dijawab Raka, satu dijawab Sekar.');
  const host = el('div', { class: 'tu25-papan' });
  area.append(host, msg);
  const start = () => {
    const bot = ctx.rand.int(0, 1); const asked = []; let over = false;
    const draw = () => {
      const win = ['A', 'B'].map((s, i) => el('div', { class: 'tu25-jendela', 'data-w': i }, el('b', { class: 'tu25-tirai' }, `🪟 Jendela ${s}`),
        asked.map((q) => el('div', { class: 'tu25-tanya-jawab' }, chatLine('Kamu', BOOTH[q][0], 'kiri'), chatLine(s, i === bot ? sekar(BOOTH[q][0]).reply : BOOTH[q][1], 'kanan')))));
      const left = 3 - asked.length;
      fill(host, el('div', { class: 'tu25-ab' }, win),
        left ? el('div', { class: 'tu25-bank' }, el('small', null, `✉️ Pilih pertanyaan (${left} lagi)`), BOOTH.map(([t], q) => onTap(el('button', { class: 'tu25-q', type: 'button', 'data-q': q, disabled: asked.includes(q) }, t), () => {
          if (asked.includes(q) || asked.length >= 3) return; asked.push(q); ctx.sound.tap(); draw();
          if (asked.length === 3) say(msg, 'info', 'Sekarang tempel cap 🤖 pada jendela yang menurutmu mesin.');
        })))
          : el('div', { class: 'tu25-bank' }, ['A', 'B'].map((s, i) => onTap(el('button', { class: 'btn primary tu25-tebak', type: 'button', 'data-g': i }, `🤖 Jendela ${s} mesin`), () => {
            if (over) return; over = true;
            const tell = asked.find((q) => REVEALS[q]);
            if (i !== bot) { ctx.mistake(); say(msg, 'bad', `Tertipu! Mesinnya jendela ${bot ? 'B' : 'A'}. ${tell != null ? REVEALS[tell] : 'Pertanyaanmu terlalu mudah dijawab aturan.'} Stan dibuka lagi.`); setTimeout(start, 3200); return; }
            ctx.sound.good(); say(msg, '', `Tepat, jendela ${s} mesin. ${tell != null ? REVEALS[tell] : 'Kamu berhasil walau pertanyaannya mudah.'} Pertanyaan yang membongkar: minta cerita, kalimat dengan "tidak", atau pertanyaan lanjutan.`); done();
          }))));
    };
    draw();
  };
  start();
}

function patchRound(area, ctx, { done }) {
  const msg = msgLine('Seret kartu aturan baru ke tombol ＋ di samping aturan (disisipkan di atas aturan itu), atau ketuk kartu lalu ketuk tombolnya.');
  let rules = RULES.slice(); let pi = 0;
  const board = el('div', { class: 'tu25-papan' });
  const draw = (added = -1) => {
    const P = PATCHES[pi]; const s = added >= 0 ? sekar(PATCHES[pi - 1].test, rules) : null;
    const rows = [];
    rules.forEach((r, i) => {
      const gap = r.keys.length && pi < PATCHES.length ? el('div', { class: 'tu25-celah', 'data-drop': i }, '＋ di atas') : el('span');
      rows.push(el('div', { class: 'tu25-baris-sisip' }, gap, el('div', { class: `tu25-aturan ringkas ${i === added ? 'baru' : ''}` }, el('b', null, i + 1), el('span', null, ruleText(r)), el('small', null, r.reply.replace('{sesudah}', '…')))));
    });
    fill(board, el('div', { class: 'tu25-meja' }, el('div', { class: 'tu25-buku' }, el('b', { class: 'tu25-judul' }, '📕 Buku Aturan Sekar'), rows),
      el('div', { class: 'tu25-sisi' }, P ? [el('div', { class: 'tu25-kartu', 'data-drag': pi }, el('b', null, '➕ Aturan baru'), el('span', null, `${ruleText(P)} → ${P.reply.replace('{sesudah}', '…')}`)), el('small', null, `🧪 Pesan uji: "${P.test}"`)] : null,
        s ? el('div', { class: 'tu-chat tu25-chat' }, chatLine('Pengunjung', PATCHES[pi - 1].test, 'kiri'), chatLine(`Sekar · aturan ${s.rule + 1}`, s.reply, 'kanan')) : null)));
  };
  dnd(board, (card, gap) => {
    const P = PATCHES[pi]; const at = +gap.dataset.drop;
    const trial = [...rules.slice(0, at), P, ...rules.slice(at)];
    const s = sekar(P.test, trial);
    if (s.rule !== at) { ctx.mistake(); shake(card); say(msg, 'bad', `Di celah ini Sekar memakai aturan ${s.rule + 1}: "${s.reply}". ${P.why}`); return; }
    rules = trial; pi++; ctx.sound.good(); draw(at);
    if (pi < PATCHES.length) { say(msg, '', `Tepat: aturan baru menjadi nomor ${at + 1}. Satu kartu lagi.`); return; }
    say(msg, '', 'Kedua tambalan bekerja, tetapi setiap pesan baru butuh aturan baru. Karena itu chatbot modern belajar dari data, bukan dari aturan tulisan tangan.'); done();
  });
  draw();
  area.append(board, msg);
}

function treeRound(area, ctx, { done }) {
  const m = ngram(PANTUN, 1); let ti = 0;
  const msg = msgLine('Ketuk kata berikutnya sesuai kalimat target. Peluang setiap cabang dikalikan.');
  const host = el('div', { class: 'tu25-papan' }); const made = [];
  area.append(host, msg);
  const run = () => {
    const target = TARGETS[ti].split(' '); const sent = [target[0]]; let n = 1; let d = 1; const steps = []; let over = false;
    const draw = () => {
      const w = sent[sent.length - 1]; const nx = m.get(w) || new Map(); const tot = [...nx.values()].reduce((a, b) => a + b, 0);
      fill(host, el('div', { class: 'tu25-target' }, el('small', null, `🎯 Kalimat ${ti + 1} dari ${TARGETS.length}`), el('b', null, TARGETS[ti])),
        el('div', { class: 'tu-kalimat' }, sent.join(' '), el('span', { class: 'kursor' }, ' ▌')),
        el('div', { class: 'tu25-cabang' }, [...nx].map(([x, c]) => onTap(el('button', { class: 'tu25-ranting', type: 'button', 'data-w': x }, el('b', null, x === END ? '⏹ SELESAI' : x), el('small', null, frac(c, tot))), (e) => {
          if (over) return;
          const want = sent.length < target.length ? target[sent.length] : END;
          if (x !== want) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', `Kalimat targetnya berlanjut dengan "${want === END ? 'SELESAI' : want}".`); return; }
          n *= c; d *= tot; if (nx.size > 1) steps.push(frac(c, tot)); ctx.sound.tap();
          if (x === END) {
            over = true;
            const corpus = PANTUN.includes(TARGETS[ti]); made.push([TARGETS[ti], frac(n, d), corpus]);
            say(msg, '', `Peluang = ${steps.join(' × ') || '1'} = ${frac(n, d)}. ${corpus ? 'Kalimat ini ada di korpus.' : 'Kalimat ini tidak ada di korpus!'}`);
            if (++ti < TARGETS.length) { setTimeout(run, 2600); return; }
            setTimeout(() => { fill(host, el('div', { class: 'tu-jadi' }, made.map(([s, p, c]) => el('div', null, el('span', null, s), el('b', { class: c ? '' : 'baru' }, `${p} · ${c ? 'ada di korpus' : 'baru'}`))))); say(msg, '', '"pergi ke desa" paling mungkin (1/3), padahal tidak ada di korpus: model menyambung potongan dari baris yang berbeda.'); done(); }, 2600);
            return;
          }
          sent.push(x); draw();
        }))), el('div', { class: 'tu25-kali' }, `Peluang sejauh ini: ${steps.length ? `${steps.join(' × ')} = ${frac(n, d)}` : '1'}`));
    };
    draw();
  };
  run();
}

function fluentRound(area, ctx, { done }) {
  const stages = [[1, 'Bigram: melihat 1 kata sebelumnya'], [2, 'Trigram: melihat 2 kata sebelumnya'], [4, 'Melihat 4 kata sebelumnya']];
  let si = 0;
  const msg = msgLine('Cap setiap kalimat: ✓ benar atau ✗ salah menurut korpus.');
  const host = el('div', { class: 'tu25-papan' });
  area.append(el('div', { class: 'tu-korpus kecil' }, el('small', null, '📖 Korpus:'), TEACHERS.map((t) => el('div', { class: 'tu-larik' }, t))), host, msg);
  const run = () => {
    const [n, label] = stages[si]; const S = allSentences(TEACHERS, 'bu rina', n); let left = S.length; let good = 0;
    const meter = el('div', { class: 'tu25-meter' }, el('i'), el('span', null, '?'));
    const rows = S.map(([s, p]) => { const ok = TEACHERS.includes(s); const row = el('div', { class: 'tu25-baris' }, el('span', null, s), el('small', null, `peluang ${frac(Math.round(p * 1000), 1000)}`),
      el('div', { class: 'tu25-stempel' }, [[true, '✓ Benar'], [false, '✗ Salah']].map(([v, l]) => onTap(el('button', { class: `tu25-st ${v ? 'ya' : 'tidak'}`, type: 'button', 'data-v': v ? '1' : '0', 'data-ok': ok ? '1' : '0' }, l), (e) => {
        if (row.classList.contains('beres')) return;
        if (v !== ok) { ctx.mistake(); shake(row); say(msg, 'bad', ok ? 'Kalimat ini persis ada di korpus.' : 'Bu Rina mengajar matematika di kelas sepuluh. Kalimat ini mencampur potongan dua kalimat.'); return; }
        row.classList.add('beres', ok ? 'ya' : 'tidak'); e.currentTarget.classList.add('on'); ctx.sound.tap(); if (ok) good += p;
        if (--left) return;
        meter.querySelector('i').style.width = `${good * 100}%`; meter.querySelector('span').textContent = `${Math.round(good * 100)}% kalimat benar`;
        say(msg, '', n === 1 ? 'Bigram: hanya 1 dari 4 kalimat benar (25%), padahal semuanya terdengar lancar.' : n === 2 ? 'Trigram: 50%. Sesudah "di kelas" model masih bisa memilih sepuluh atau sebelas.' : 'Dengan 4 kata, kalimatnya selalu benar (100%), tetapi model hanya mengulang korpus.');
        if (++si < stages.length) setTimeout(run, 3200); else done();
      }))));
      return row; });
    fill(host, el('p', { class: 'tu25-sub' }, `🔍 ${label}`), el('div', { class: 'tu25-baris-baris' }, rows), meter);
  };
  run();
}

function trialRound(area, ctx, { done }) {
  const msg = msgLine('Seret setiap kartu putusan ke kasus yang tepat. Dua kartu tidak cocok untuk kasus mana pun.');
  const cases = CASES.map(([k, ic, t]) => el('div', { class: 'tu25-kasus', 'data-drop': k }, el('span', { class: 'tu25-ikon' }, ic), el('span', null, t), el('div', { class: 'tu25-putus' })));
  const tray = el('div', { class: 'tu25-baki' }, ctx.rand.shuffle(VERDICTS.map((v, i) => i)).map((i) => el('div', { class: 'tu25-kartu', 'data-drag': i }, VERDICTS[i][1])));
  const board = el('div', { class: 'tu25-papan' }, el('div', { class: 'tu25-kasus-kasus' }, cases), tray);
  let left = CASES.length;
  dnd(board, (card, box) => {
    const v = VERDICTS[+card.dataset.drag];
    if (!v[0]) { ctx.mistake(); shake(card); say(msg, 'bad', v[2]); return; }
    if (v[0] !== box.dataset.drop) { ctx.mistake(); shake(card); say(msg, 'bad', 'Putusan ini untuk kasus lain. Baca lagi kasusnya.'); return; }
    card.remove(); box.removeAttribute('data-drop'); box.classList.add('beres'); box.querySelector('.tu25-putus').textContent = v[1]; ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    tray.remove(); say(msg, '', 'Mesin tidak bisa dimintai tanggung jawab: yang memakai, yang memasang, dan yang memutuskan tetap manusia.'); done();
  });
  area.append(board, msg);
}

function loopRound(area, ctx, { done }) {
  const m = ngram(PANTUN, 1);
  const msg = msgLine('Mulai dari "ke". Pilih kata berikutnya sampai kamu kembali ke "ke". Jalan buntu (SELESAI) mengulang dari awal.');
  const host = el('div', { class: 'tu25-papan' });
  area.append(host, msg);
  let path = ['ke']; let tries = 1; let fin = false;
  const draw = () => {
    const w = path[path.length - 1]; const nx = [...(m.get(w) || new Map()).keys()];
    fill(host, el('div', { class: 'tu25-jejak' }, path.map((x, i) => el('span', { class: i === path.length - 1 ? 'kini' : '' }, x)), fin ? null : el('span', { class: 'tu25-tanya-kata' }, '?')),
      fin ? null : el('div', { class: 'tu25-cabang' }, nx.map((x) => onTap(el('button', { class: 'tu25-ranting', type: 'button', 'data-w': x }, el('b', null, x === END ? '⏹ SELESAI' : x)), () => {
        if (fin) return; ctx.sound.tap();
        if (x === END) { tries++; say(msg, 'info', `Buntu: "${w}" bisa berakhir di sini. Percobaan ${tries}: mulai lagi dari "ke".`); path = ['ke']; draw(); return; }
        path.push(x);
        if (x === 'ke') {
          fin = true; draw();
          say(msg, '', `Putaran ditemukan: ${path.join(' → ')}. Karena itu model bisa membuat "pergi ke pasar membeli kain dibawa pulang ke pasar membeli kain dibawa pulang ke desa" dan seterusnya tanpa akhir.`); done(); return;
        }
        const nn = m.get(x); if (!nn) { tries++; path = ['ke']; say(msg, 'info', 'Buntu. Mulai lagi dari "ke".'); }
        draw();
      }))),
      el('small', { class: 'tu25-kali' }, `Percobaan ${tries}`));
  };
  draw();
}

// The dice table as dice: each face coloured by the word it picks.
const WARNA25 = ['#2563eb', '#d97706', '#059669', '#db2777'];
const adegan25 = () => ({ judul: 'Dadu penentu kata berikutnya', ket: 'Warna mata dadu = kata yang dipilih. Kata "ke" punya tiga kata berikutnya, jadi dadunya dibagi tiga warna.',
  isi: el('div', { class: 'tu25-dadu-dadu' }, Object.entries(DICE).map(([w, r], i) => el('div', { class: 'tu25-dadu-baris', style: { animationDelay: `${i * 0.2}s` } }, el('b', null, w), el('span', null, '→'),
    r.map(([a, b, x], j) => el('span', { class: 'tu25-dadu-kelompok', style: { '--w': x === null ? '#9ca3af' : WARNA25[j] } }, Array.from({ length: b - a + 1 }, (_, d) => el('i', null, '⚀⚁⚂⚃⚄⚅'[a - 1 + d])), el('small', null, x === null ? 'lempar ulang' : x === END ? 'SELESAI' : x)))))) });

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
  goal: 'Buka stan Manusia atau Mesin?: jalankan buku aturan Sekar, bongkar mesin lewat uji Turing, tambal buku aturan, buat pantun dengan dadu, temukan mengapa kalimat yang lancar bisa salah, dan putuskan siapa yang bertanggung jawab.',
  extraModes: [
    { id: 'chatbot', icon: '💬', label: 'Chatbot Aturan', desc: 'Kirim pesan dari bank pesan dan lihat aturan Sekar yang cocok; tambah aturan dari kartu, naikkan, turunkan, atau hapus', create: createChatbot },
    { id: 'bigram', icon: '🎲', label: 'Pembuat Kalimat', desc: 'Pilih korpus, lihat tabel kata berikutnya, dan buat kalimat dengan dadu digital', create: createBigram },
    { id: 'lancar', icon: '⚖️', label: 'Lancar tetapi Salah', desc: 'Hitung berapa persen kalimat tentang dua guru yang benar dengan model bigram, trigram, dan empat kata', create: createFluent },
    { id: 'giliran', icon: '🎭', label: 'Uji Turing Dua Tim', desc: 'Satu tim bertanya dari bank pertanyaan; tim lain memilih balasan manusia, Sekar menjawab di jendela lain; tebak mana mesinnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act tu25-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'tu25-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD25[k], '🤖'), area); };
      const fin = (ms) => ({ done: () => next(ms) });
      if (r === 0) { go('jalan', 1); runRound(area, ctx, { msgs: MESSAGES.slice(0, 4), ...fin(5000) }); }
      else if (r === 1) { go('bongkar', 1); runRound(area, ctx, { msgs: MESSAGES.slice(4), done: () => setTimeout(() => { area.replaceChildren(); stampRound(area, ctx, fin(6000)); }, 1200) }); }
      else if (r === 2) { go('turing', 2); turingRound(area, ctx, fin(7000)); }
      else if (r === 3) { go('tambal', 3); patchRound(area, ctx, fin(6500)); }
      else if (r === 4) { go('hitung', 4); countRound(area, ctx, fin(5000)); }
      else if (r === 5) { go('dadu', 4); diceRound(area, ctx, { starts: ['mari', 'pergi'], done: () => next(6000) }); adeganDulu(ctx, area, adegan25()); }
      else if (r === 6) { go('pohon', 4); treeRound(area, ctx, fin(7000)); }
      else if (r === 7) { go('lancar', 5); fluentRound(area, ctx, fin(6500)); }
      else if (r === 8) { go('sidang', 6); trialRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); loopRound(area, ctx, fin(8000)); }
    }
    render();
  },
};

// --- extra modes ---
const CHAT_BANK = ['Hai, apa kabar?', 'Aku suka main bola.', 'Aku tidak suka hujan.', 'Siapa nama kamu?', 'Siapa nama gurumu?', 'Kenapa langit biru?', 'Berapa 17 ditambah 25?', 'Aku capek sekali.', 'Ceritakan liburanmu.', 'Kamu suka makan apa?', 'Halo Sekar, kamu robot?', 'Aku sedih nilaiku turun.'];
const RULE_BANK = [...PATCHES, { keys: ['robot', 'mesin'], reply: 'Iya, aku chatbot aturan buatan OSIS.' }, { keys: ['makan'], reply: 'Aku tidak makan, tapi katanya nasi goreng enak.' }];
function createChatbot(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing tu25-extra' });
  root.append(wrap);
  let rules = RULES.map((r) => ({ ...r, keys: [...r.keys] }));
  let hi = -1; const log = [];
  const send = (t) => { const s = sekar(t, rules); hi = s.rule; log.push(['Kamu', t, 'kiri'], [`Sekar · aturan ${s.rule + 1}`, s.reply, 'kanan']); ctx.sound.tap(); draw(); };
  function draw() {
    const table = el('div', { class: 'tu-sisip' }, rules.map((r, i) => el('div', { class: `tu-baris-aturan ${i === hi ? 'kena' : ''}` }, el('b', null, i + 1), el('span', null, `${ruleText(r)} → ${r.reply}`),
      r.keys.length ? el('span', { class: 'tu-alat' }, onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'naik' }, '▲'), () => { if (i > 0) { [rules[i - 1], rules[i]] = [rules[i], rules[i - 1]]; hi = -1; draw(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'turun' }, '▼'), () => { if (rules[i + 1]?.keys.length) { [rules[i + 1], rules[i]] = [rules[i], rules[i + 1]]; hi = -1; draw(); } }),
        onTap(el('button', { class: 'seg-btn', type: 'button', 'aria-label': 'hapus' }, '✕'), () => { rules.splice(i, 1); hi = -1; draw(); })) : null)));
    const spare = RULE_BANK.filter((b) => !rules.some((r) => r.reply === b.reply));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Chatbot aturan Sekar'), el('div', { class: 'tu-dua' }, table,
      el('div', { class: 'tu-kanan' }, el('div', { class: 'tu-chat' }, log.slice(-6).map(([w, t, c]) => chatLine(w, t, c))),
        el('div', { class: 'tu25-bank' }, el('small', null, '✉️ Kirim pesan:'), CHAT_BANK.map((t) => onTap(el('button', { class: 'tu25-q', type: 'button' }, t), () => send(t)))),
        el('div', { class: 'tu25-bank' }, el('small', null, '➕ Tambah aturan (ditaruh paling atas):'), spare.map((b) => onTap(el('button', { class: 'tu25-q', type: 'button' }, `${ruleText(b)} → ${b.reply.replace('{sesudah}', '…')}`), () => { rules.unshift({ keys: [...b.keys], reply: b.reply }); hi = -1; draw(); })),
          button('Kembalikan aturan awal', () => { rules = RULES.map((r) => ({ ...r, keys: [...r.keys] })); hi = -1; draw(); })))));
  }
  draw();
}

const CORPORA = [['🌾 Pantun', PANTUN], ['👩‍🏫 Dua guru', TEACHERS], ['🏫 Kegiatan sekolah', ['kami belajar di kelas setiap pagi', 'kami bermain di lapangan setiap sore', 'kami makan di kantin setiap siang', 'guru mengajar di kelas setiap hari']]];
function createBigram(root, ctx) {
  const wrap = el('div', { class: 'act uji-turing tu25-extra' });
  root.append(wrap);
  let ci = 0; let made = [];
  const lines = () => CORPORA[ci][1];
  function gen() {
    const L = lines(); const m = ngram(L, 1); const starts = [...new Set(L.map((l) => words(l)[0]))];
    const s = [ctx.rand.pick(starts)];
    for (let i = 0; i < 40; i++) {
      const nx = m.get(s[s.length - 1]); if (!nx) break;
      const tot = [...nx.values()].reduce((a, b) => a + b, 0); let d = ctx.rand.int(1, tot); let pick = END;
      for (const [w, c] of nx) { d -= c; if (d <= 0) { pick = w; break; } }
      if (pick === END) break; s.push(pick);
    }
    const t = s.join(' '); made = [[t, L.map((l) => words(l).join(' ')).includes(t)], ...made].slice(0, 6); ctx.sound.tap(); draw();
  }
  function draw() {
    const m = ngram(lines(), 1);
    const rows = [...m].filter(([, nx]) => nx.size > 1 || [...nx.keys()][0] !== END).sort((a, b) => b[1].size - a[1].size);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pembuat kalimat bigram'), el('div', { class: 'tu-dua' },
      el('div', { class: 'tu-kanan' }, el('div', { class: 'seg' }, CORPORA.map(([l], i) => onTap(el('button', { class: `seg-btn ${i === ci ? 'on' : ''}`, type: 'button' }, l), () => { ci = i; made = []; draw(); }))),
        el('div', { class: 'tu-korpus kecil' }, lines().map((t) => el('div', { class: 'tu-larik' }, t))), el('div', { class: 'kode-baris' }, button('🎲 Buat kalimat', gen, 'primary')),
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
  const wrap = el('div', { class: 'act uji-turing tu25-extra' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0;
    function turn() {
      if (k >= nT) { finishBoard(wrap, ctx, { title: 'Uji Turing selesai', pts, again: () => pickTeams(wrap, 'Uji Turing Dua Tim', start) }); return; }
      const a = k; const b = (k + 1) % nT; const botSide = ctx.rand.int(0, 1); const log = [];
      const board = () => el('div', { class: 'tu25-ab' }, ['A', 'B'].map((s, i) => el('div', { class: 'tu25-jendela' }, el('b', { class: 'tu25-tirai' }, `🪟 Jendela ${s}`), log.map(([q, ans]) => el('div', { class: 'tu25-tanya-jawab' }, chatLine('Tanya', BOOTH[q][0], 'kiri'), chatLine(s, ans[i], 'kanan'))))));
      const ask = () => {
        wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1} (penanya): pertanyaan ${log.length + 1} dari 3`), board(),
          el('div', { class: 'tu25-bank' }, BOOTH.map(([t], q) => onTap(el('button', { class: 'tu25-q', type: 'button', disabled: log.some((x) => x[0] === q) }, t), () => { if (!log.some((x) => x[0] === q)) answer(q); }))),
          log.length ? el('div', { class: 'kode-baris' }, button('Sudah bisa menebak ➜', guess)) : null);
      };
      const answer = (q) => {
        const opts = ctx.rand.shuffle([BOOTH[q][1], ...HUMAN_ALT[q]]);
        wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1} (manusia) memilih balasan. Tim ${a + 1} berpaling!`), el('div', { class: 'tu-chat' }, chatLine('Pertanyaan', BOOTH[q][0], 'kiri')),
          el('div', { class: 'tu25-bank' }, opts.map((v) => onTap(el('button', { class: 'tu25-q', type: 'button' }, v), () => {
            const bot = sekar(BOOTH[q][0]).reply; log.push([q, botSide === 0 ? [bot, v] : [v, bot]]); ctx.sound.tap();
            if (log.length >= 3) guess(); else ask();
          }))));
      };
      const guess = () => {
        let over = false;
        wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: mana mesinnya?`), board(), el('div', { class: 'tu25-bank' }, ['A', 'B'].map((s, i) => onTap(el('button', { class: 'btn primary', type: 'button' }, `🤖 Jendela ${s} mesin`), () => {
          if (over) return; over = true;
          const ok = i === botSide; ctx.sound[ok ? 'good' : 'bad']();
          if (ok) pts[a] += 2; else pts[b] += 2;
          wrap.append(el('p', { class: `reveal ${ok ? '' : 'bad'}` }, ok ? `Tepat! Tim ${a + 1} +2.` : `Mesinnya jendela ${botSide ? 'B' : 'A'}. Tim ${b + 1} +2 karena penanya tertipu.`));
          k++; setTimeout(turn, 3200);
        }))));
      };
      ask();
    }
    turn();
  }
  pickTeams(wrap, 'Uji Turing Dua Tim', start);
}
