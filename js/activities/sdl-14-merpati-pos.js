// Merpati Pos — SD Lanjut (10–12 tahun), protokol dan paket data. Each
// pigeon carries one word; some get lost and they arrive out of order.
// Sequence numbers show what is missing, a reply says what arrived, and
// resending fills the gaps: the same rules a network protocol uses.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const MESSAGE = ['ADIK', 'MINTA', 'KAKAK', 'MENJEMPUT', 'DI', 'PASAR', 'JAM', 'LIMA'];
const POOL = [
  'IBU MINTA BELIKAN TELUR DAN GULA DI WARUNG',
  'BESOK PAGI KITA KERJA BAKTI DI BALAI DESA',
  'PANEN PADI DIMULAI HARI SABTU PAGI JAM TUJUH',
  'JANGAN LUPA BAWA BUKU GAMBAR DAN PENSIL WARNA',
  'LATIHAN PRAMUKA PINDAH KE LAPANGAN DEKAT SEKOLAH',
  'NENEK DATANG NAIK KERETA SORE INI JAM EMPAT',
].map((s) => s.split(' '));
const LOSS = { 0: 'tidak pernah', 6: '1 dari 6', 3: '1 dari 3' };
const FLY_MS = 1500;
const GAP_MS = 260;

// Which cards get lost and the order the rest arrive in.
export function flight(cards, rand, { loss = 6, shuffle = true } = {}) {
  const lost = cards.filter(() => loss && rand.int(1, loss) === 1);
  const safe = cards.filter((c) => !lost.includes(c));
  return { lost, arrived: shuffle ? rand.shuffle(safe) : safe };
}
// The resend rule: everything the sender is not yet sure has arrived.
export const toResend = (n, confirmed) => Array.from({ length: n }, (_, i) => i + 1).filter((k) => !confirmed.has(k));
const label = (c, n) => (c.no ? `${c.no}/${n} ${c.word}` : c.word);

// The two villages with the hill and the sky between them.
function valley(left, right) {
  const sky = el('div', { class: 'langit' }, el('div', { class: 'bukit' }));
  let timers = [];
  return {
    node: el('div', { class: 'lembah' }, el('div', { class: 'desa atas' }, el('b', null, '🏠 Desa Atas'), left), sky, el('div', { class: 'desa bawah' }, el('b', null, '🏡 Desa Bawah'), right)),
    // Fly cards across; `onLand` runs as each one arrives, `done` at the end.
    fly({ arrived, lost }, { back = false, n, onLand, done }) {
      const all = [...arrived.map((c, k) => ({ c, t: k * GAP_MS, lost: false })), ...lost.map((c, k) => ({ c, t: (k + 0.5) * GAP_MS * 1.5, lost: true }))];
      let end = 0;
      all.forEach(({ c, t, lost: gone }, k) => {
        const bird = el('div', { class: `merpati ${back ? 'balik' : ''} ${gone ? 'sesat' : ''}`, style: { '--lane': `${12 + ((k * 37) % 60)}%`, animationDelay: `${t}ms`, animationDuration: `${FLY_MS}ms` } },
          '🕊️', el('small', null, label(c, n)));
        sky.append(bird);
        end = Math.max(end, t + FLY_MS);
        timers.push(setTimeout(() => { bird.remove(); if (!gone) onLand?.(c); }, t + FLY_MS));
      });
      timers.push(setTimeout(() => done?.(), end + 120));
    },
    stop() { timers.forEach(clearTimeout); timers = []; },
  };
}

// Receiver board: slots by number, or a plain list when cards have no number.
function receiverBoard(n, { numbered, onSlot }) {
  const slots = numbered ? Array.from({ length: n }, (_, i) => onTap(el('button', { class: 'slot-kata', type: 'button', 'data-no': i + 1 }, el('small', null, i + 1), el('span', null, '…')), () => onSlot?.(i + 1))) : [];
  const list = el('div', { class: 'kata-tiba' });
  const node = el('div', { class: 'penerima' }, numbered ? el('div', { class: 'slot-row' }, slots) : list);
  const have = new Map();
  let dup = 0;
  return {
    node, have,
    get dup() { return dup; },
    land(c) {
      if (!numbered) { list.append(el('span', { class: 'kartu-kata' }, c.word)); return; }
      if (have.has(c.no)) { dup++; const s = slots[c.no - 1]; s.classList.add('dobel'); setTimeout(() => s.classList.remove('dobel'), 900); return; }
      have.set(c.no, c.word);
      const s = slots[c.no - 1];
      s.classList.add('ada');
      s.lastChild.textContent = c.word;
    },
    mark(no, on) { slots[no - 1].classList.toggle('tanda', on); },
  };
}

function senderCards(words, numbered, { onTap: tap } = {}) {
  const n = words.length;
  const cards = words.map((w, i) => onTap(el('button', { class: 'kartu-kata kirim', type: 'button', 'data-no': i + 1 }, numbered ? `${i + 1}/${n} ${w}` : w), () => tap?.(i + 1)));
  return { node: el('div', { class: 'tumpukan' }, cards), cards };
}

const counterBox = () => {
  const node = el('div', { class: 'hitung-merpati' });
  return { node, set(o) { node.replaceChildren(...Object.entries(o).map(([k, v]) => el('span', null, el('b', null, v), ` ${k}`))); } };
};

export default {
  id: 'sdl-14-merpati-pos',
  title: 'Merpati Pos',
  topic: 'Protokol dan paket data',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🕊️',
  source: { name: 'CS Unplugged: Network Protocols', url: 'https://www.csunplugged.org/en/topics/' },
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid melihat masalah kata hilang dan urutan tertukar, memakai nomor urut, balasan, dan kirim ulang sampai pesan utuh, lalu merumuskan protokolnya.',
  extraModes: [
    { id: 'simulasi', icon: '⛰️', label: 'Simulasi Dua Desa', desc: 'Atur peluang tersesat, urutan acak, nomor urut, balasan, dan kirim ulang otomatis', create: createSim },
    { id: 'dua-sisi', icon: '🤝', label: 'Pengirim dan Penerima', desc: 'Dua tim di dua sisi panel: satu mengirim, satu membalas; layar diam-diam menyesatkan merpati', create: createTwoSides },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act merpati-act' });
    root.append(wrap);
    let live = null;
    function render() {
      live?.stop();
      live = null;
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) live = roundPlain(wrap, ctx, next);
      else if (r === 1) live = roundNumbered(wrap, ctx, next);
      else if (r === 2) live = roundResend(wrap, ctx, next);
      else if (r === 3) ask(wrap, ctx, next, 'Penerima menerima kata yang sama dua kali. Mengapa bisa terjadi?', [
        ['Merpati balasan tersesat, jadi Pengirim mengirim ulang kata yang sebenarnya sudah tiba', true],
        ['Angin menggandakan merpati'], ['Pengirim salah menulis kata'],
      ]);
      else if (r === 4) ask(wrap, ctx, next, 'Bagaimana Penerima tahu bahwa kata itu dobel?', [
        ['Dari nomor urutnya: nomor itu sudah dimiliki, jadi kartunya dibuang', true],
        ['Dari warna kertasnya'], ['Tidak bisa tahu sama sekali'],
      ]);
      else if (r === 5) orderRound(wrap, ctx, next);
      else if (r === 6) ask(wrap, ctx, next, 'Mana yang BUKAN kesamaan merpati pos dan paket data di internet?', [
        ['Keduanya selalu tiba berurutan', true],
        ['Pesan dipecah menjadi potongan kecil'], ['Potongan bisa hilang di jalan'], ['Potongan diberi nomor urut'],
      ], 2);
      else live = roundReply(wrap, ctx, next, r);
    }
    render();
    return { destroy() { live?.stop(); } };
  },
};

function ask(wrap, ctx, next, prompt, opts, columns = 1) {
  choice(wrap, { prompt, ctx, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: l, correct })) });
}

// Round 1: no rules. At least one pigeon is lost and the order is mixed.
function roundPlain(wrap, ctx, next) {
  const cards = MESSAGE.map((word, i) => ({ word, i }));
  let f;
  do f = flight(cards, ctx.rand, { loss: 4 }); while (!f.lost.length || f.lost.length > 3 || f.arrived.every((c, k) => k === 0 || c.i > f.arrived[k - 1].i));
  const send = senderCards(MESSAGE, false);
  const recv = receiverBoard(8, { numbered: false });
  const v = valley(send.node, recv.node);
  const q = el('div');
  const go = button('🕊️ Lepaskan merpati', () => {
    go.disabled = true;
    v.fly(f, { n: 8, onLand: (c) => recv.land(c), done: () => ask(q, ctx, next, 'Kata-kata tiba seperti di Desa Bawah. Apa masalahnya?', [
      ['Ada kata yang hilang dan urutannya tertukar, jadi artinya bisa berubah', true], ['Tidak ada masalah, pesannya utuh'], ['Hanya urutannya yang tertukar'],
    ]) });
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, 'Ronde 1, tanpa aturan: satu merpati membawa satu kata. Lepaskan merpatinya!'), v.node, el('div', { class: 'row' }, go), q);
  return v;
}

// Round 2: sequence numbers. Tap the missing numbers.
function roundNumbered(wrap, ctx, next) {
  const cards = MESSAGE.map((word, i) => ({ word, no: i + 1 }));
  let f;
  do f = flight(cards, ctx.rand, { loss: 4 }); while (!f.lost.length || f.lost.length > 3);
  const marked = new Set();
  let ready = false;
  const recv = receiverBoard(8, { numbered: true, onSlot(no) { if (!ready || recv.have.has(no)) return; marked.has(no) ? marked.delete(no) : marked.add(no); recv.mark(no, marked.has(no)); ctx.sound.tap(); } });
  const send = senderCards(MESSAGE, true);
  const v = valley(send.node, recv.node);
  const q = el('div', { class: 'col' });
  const go = button('🕊️ Lepaskan merpati', () => {
    go.disabled = true;
    v.fly(f, {
      n: 8, onLand: (c) => recv.land(c),
      done() {
        ready = true;
        const msg = el('p', { class: 'reveal info' }, 'Ketuk kotak nomor yang hilang, lalu Periksa.');
        const check = button('Periksa', () => {
          const want = f.lost.map((c) => c.no).sort().join();
          if ([...marked].sort().join() !== want) { msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Nomor mana yang belum tiba?'; shake(msg); ctx.mistake(); return; }
          q.replaceChildren();
          ask(q, ctx, next, `Nomor yang hilang: ${f.lost.map((c) => c.no).join(', ')}. Apakah Penerima tahu KATA yang hilang?`, [['Tidak, Penerima hanya tahu nomornya', true], ['Ya, katanya bisa ditebak dengan pasti']]);
        }, 'primary');
        q.append(msg, check);
      },
    });
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, 'Ronde 2, nomor urut: setiap kartu diberi nomor dan jumlah kartu.'), v.node, el('div', { class: 'row' }, go), q);
  return v;
}

// Round 3: the pupil is the sender. Pick what to resend after each reply.
function roundResend(wrap, ctx, next) {
  const n = 8;
  const confirmed = new Set();
  const picked = new Set(Array.from({ length: n }, (_, i) => i + 1));
  let birds = 0;
  let batch = 0;
  let busy = false;
  const send = senderCards(MESSAGE, true, {
    onTap(no) {
      if (busy || confirmed.has(no) || batch === 0) return;
      picked.has(no) ? picked.delete(no) : picked.add(no);
      ctx.sound.tap();
      paint();
    },
  });
  const recv = receiverBoard(n, { numbered: true });
  const v = valley(send.node, recv.node);
  const msg = el('p', { class: 'reveal info' }, 'Kiriman 1: kirim semua nomor 1 sampai 8.');
  const table = el('tbody');
  const counter = counterBox();
  const paint = () => {
    send.cards.forEach((c, i) => { c.classList.toggle('pilih', picked.has(i + 1)); c.classList.toggle('pasti', confirmed.has(i + 1)); });
    counter.set({ 'merpati dipakai': birds, kiriman: batch });
  };
  const go = button('🕊️ Kirim', () => {
    if (busy) return;
    const want = toResend(n, confirmed);
    if ([...picked].sort((a, b) => a - b).join() !== want.join()) {
      msg.className = 'reveal bad';
      msg.textContent = confirmed.size ? 'Kirim ulang semua nomor yang belum disebut di balasan.' : 'Balasan belum pernah datang, jadi belum ada nomor yang pasti diterima.';
      shake(msg);
      ctx.mistake();
      return;
    }
    busy = true;
    batch++;
    const cards = want.map((no) => ({ no, word: MESSAGE[no - 1] }));
    let f;
    // Kiriman 1 always loses something; from kiriman 4 nothing is lost.
    do f = flight(cards, ctx.rand, { loss: batch >= 4 ? 0 : 6 }); while (batch === 1 && (!f.lost.length || f.lost.length > 3));
    birds += cards.length;
    paint();
    msg.className = 'reveal info';
    msg.textContent = `Kiriman ${batch} terbang…`;
    v.fly(f, {
      n, onLand: (c) => recv.land(c),
      done() {
        const got = [...recv.have.keys()].sort((a, b) => a - b);
        const replyLost = batch < 4 && ctx.rand.int(1, 6) === 1;
        birds++;
        const reply = { no: 0, word: `DITERIMA ${got.join(' ')}` };
        v.fly(replyLost ? { arrived: [], lost: [reply] } : { arrived: [reply], lost: [] }, {
          back: true, n,
          done() {
            busy = false;
            table.append(el('tr', null, el('td', null, batch), el('td', null, want.join(' ')), el('td', null, f.arrived.map((c) => c.no).sort((a, b) => a - b).join(' ') || '–'), el('td', null, replyLost ? 'tidak' : 'ya')));
            if (!replyLost) got.forEach((k) => confirmed.add(k));
            picked.clear();
            paint();
            if (confirmed.size === n) {
              msg.className = 'reveal';
              msg.textContent = `Balasan "DITERIMA 1–8" tiba. Pesan utuh! 🎉`;
              go.disabled = true;
              const opts = ctx.rand.shuffle([birds, birds - 1, birds + 1, birds + 2]);
              const q = el('div');
              wrap.append(q);
              ask(q, ctx, next, 'Berapa merpati yang dipakai sampai pesan lengkap, termasuk merpati balasan?', opts.map((x) => [String(x), x === birds]), 4);
              return;
            }
            msg.className = replyLost ? 'reveal bad' : 'reveal info';
            msg.textContent = replyLost ? 'Merpati balasan tersesat! Pilih nomor yang dikirim ulang, lalu Kirim.' : `Balasan tiba: "${reply.word}". Pilih nomor yang dikirim ulang, lalu Kirim.`;
          },
        });
      },
    });
  }, 'primary');
  paint();
  wrap.append(el('p', { class: 'prompt' }, 'Ronde 3, balasan dan kirim ulang: kamu Pengirimnya. Kirim sampai pesan lengkap.'), v.node,
    el('div', { class: 'merpati-bawah' }, el('div', { class: 'col' }, el('div', { class: 'row' }, go, counter.node), msg),
      el('table', { class: 'tabel-kiriman' }, el('thead', null, el('tr', null, ['Kiriman', 'Dikirim', 'Tiba', 'Balasan?'].map((h) => el('th', null, h)))), table)));
  return v;
}

// Put the sender's rules in order.
function orderRound(wrap, ctx, next) {
  const rules = [
    'Beri setiap kata nomor urut dan jumlah kartu',
    'Kirim semua kartu',
    'Tunggu balasan, lalu kirim ulang nomor yang tidak disebut',
    'Bila balasan tidak datang, kirim ulang semua nomor yang belum pasti diterima',
    'Berhenti bila balasan menyebut semua nomor',
  ];
  let k = 0;
  const list = el('ol', { class: 'protokol' });
  const buttons = ctx.rand.shuffle(rules.map((t, i) => ({ t, i }))).map(({ t, i }) => {
    const b = onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, t)), () => {
      if (b.disabled) return;
      if (i !== k) { shake(b); ctx.mistake(); return; }
      k++;
      b.disabled = true;
      b.classList.add('right');
      list.append(el('li', null, t));
      ctx.sound.tap();
      if (k === rules.length) next();
    });
    return b;
  });
  wrap.append(el('p', { class: 'prompt' }, 'Susun protokol untuk Pengirim: ketuk aturannya sesuai urutan.'),
    el('div', { class: 'protokol-wrap' }, el('div', { class: 'opts', style: { '--cols': 1 } }, buttons), list));
}

// Later rounds: be the receiver. Reply with every number you have, or find the duplicate.
function roundReply(wrap, ctx, next, r) {
  const words = ctx.rand.pick(POOL);
  const n = words.length;
  const cards = words.map((word, i) => ({ word, no: i + 1 }));
  let f;
  do f = flight(cards, ctx.rand, { loss: 3 }); while (!f.lost.length || f.lost.length > 4);
  const findDup = r % 2 === 0;
  if (findDup) f.arrived.splice(ctx.rand.int(2, f.arrived.length), 0, { ...ctx.rand.pick(f.arrived) });
  const marked = new Set();
  let ready = false;
  let dupAt = null;
  const recv = receiverBoard(n, {
    numbered: true,
    onSlot(no) {
      if (!ready || findDup) return;
      marked.has(no) ? marked.delete(no) : marked.add(no);
      recv.mark(no, marked.has(no));
      ctx.sound.tap();
    },
  });
  const arrivedList = el('div', { class: 'kata-tiba' });
  const send = senderCards(words, true);
  const v = valley(send.node, el('div', { class: 'col' }, recv.node, arrivedList));
  const q = el('div', { class: 'col' });
  const msg = el('p', { class: 'reveal info' });
  let seen = new Set();
  const go = button('🕊️ Lepaskan merpati', () => {
    go.disabled = true;
    v.fly(f, {
      n,
      onLand(c) {
        recv.land(c);
        const isDup = seen.has(c.no);
        seen.add(c.no);
        const chip = onTap(el('button', { class: 'kartu-kata', type: 'button' }, `${c.no}/${n} ${c.word}`), () => {
          if (!ready || !findDup) return;
          if (chip === dupAt) { chip.classList.add('right'); msg.className = 'reveal'; msg.textContent = `Benar! Nomor ${c.no} sudah ada, jadi kartu ini dibuang.`; next(); } else { shake(chip); ctx.mistake(); }
        });
        if (isDup) dupAt = chip;
        arrivedList.append(chip);
      },
      done() {
        ready = true;
        if (findDup) { msg.textContent = 'Ada kartu yang tiba dua kali. Ketuk kartu dobel di daftar kartu yang tiba.'; q.append(msg); return; }
        msg.textContent = 'Susun balasan: ketuk nomor yang SUDAH diterima, lalu Kirim balasan.';
        q.append(msg, button('Kirim balasan', () => {
          const want = [...recv.have.keys()].sort((a, b) => a - b).join();
          if ([...marked].sort((a, b) => a - b).join() !== want) { msg.className = 'reveal bad'; msg.textContent = 'Balasan harus menyebut semua nomor yang sudah diterima, tidak lebih.'; shake(msg); ctx.mistake(); return; }
          msg.className = 'reveal';
          msg.textContent = `"DITERIMA ${want.split(',').join(' ')}" terbang ke Desa Atas. Pengirim akan mengirim ulang ${toResend(n, new Set(recv.have.keys())).join(', ')}.`;
          next();
        }, 'primary'));
      },
    });
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, findDup ? 'Kamu Penerima. Cari kartu yang dobel!' : 'Kamu Penerima. Tulis balasan untuk Pengirim.'), v.node, el('div', { class: 'row' }, go), q);
  return v;
}

// Simulation with every switch.
function createSim(root, ctx) {
  const wrap = el('div', { class: 'act merpati-act' });
  root.append(wrap);
  const opt = { loss: 6, shuffle: true, numbered: true, reply: true, resend: true, words: MESSAGE };
  let live = null;
  function go() {
    live?.stop();
    const rand = makeRng(newSeed());
    const n = opt.words.length;
    const send = senderCards(opt.words, opt.numbered);
    const recv = receiverBoard(n, { numbered: opt.numbered });
    const v = valley(send.node, recv.node);
    live = v;
    const counter = counterBox();
    const status = el('p', { class: 'reveal info' }, 'Tekan "Kirim pesan".');
    const stats = { terkirim: 0, tersesat: 0, dobel: 0 };
    const show = (whole) => counter.set({ 'merpati terkirim': stats.terkirim, tersesat: stats.tersesat, 'kata dobel': recv.dup, 'pesan utuh': whole == null ? '…' : whole ? '✓' : '✗' });
    show(null);
    const confirmed = new Set();
    const order = [];
    let batches = 0;
    function batch(nums) {
      batches++;
      const cards = nums.map((no) => ({ no: opt.numbered ? no : 0, word: opt.words[no - 1], i: no }));
      const f = flight(cards, rand, { loss: opt.loss, shuffle: opt.shuffle });
      stats.terkirim += cards.length;
      stats.tersesat += f.lost.length;
      show(null);
      v.fly(f, {
        n, onLand: (c) => { recv.land(c); order.push(c.i); show(null); },
        done() {
          if (!opt.numbered) { finish(order.length === n && order.every((x, k) => x === k + 1)); return; }
          if (!opt.reply) { finish(recv.have.size === n); return; }
          const got = [...recv.have.keys()].sort((a, b) => a - b);
          const lost = opt.loss && rand.int(1, opt.loss) === 1;
          stats.terkirim++;
          if (lost) stats.tersesat++;
          const reply = { no: 0, word: `DITERIMA ${got.join(' ') || '–'}` };
          v.fly(lost ? { arrived: [], lost: [reply] } : { arrived: [reply], lost: [] }, {
            back: true, n,
            done() {
              if (!lost) got.forEach((k) => confirmed.add(k));
              if (confirmed.size === n) { finish(true); return; }
              if (!opt.resend || batches >= 12) { finish(recv.have.size === n); return; }
              status.textContent = lost ? 'Balasan tersesat. Kirim ulang semua yang belum pasti…' : `Balasan: ${reply.word}. Kirim ulang ${toResend(n, confirmed).join(' ')}…`;
              batch(toResend(n, confirmed));
            },
          });
        },
      });
    }
    function finish(whole) {
      show(whole);
      status.className = whole ? 'reveal' : 'reveal bad';
      status.textContent = whole ? `Pesan tiba utuh dengan ${stats.terkirim} merpati.` : 'Pesan tidak utuh atau urutannya kacau.';
      whole ? ctx.sound.win() : ctx.sound.bad();
    }
    const toggle = (labelText, key, dep) => button(`${opt[key] ? '✓' : '✗'} ${labelText}`, () => { opt[key] = !opt[key]; if (!opt.numbered) opt.reply = false; if (!opt.reply) opt.resend = false; go(); }, `small ${opt[key] ? 'on' : ''} ${dep === false ? 'off' : ''}`);
    const settings = el('div', { class: 'row wrap' },
      button(`Tersesat: ${LOSS[opt.loss]}`, () => { opt.loss = { 0: 6, 6: 3, 3: 0 }[opt.loss]; go(); }, 'small'),
      toggle('urutan acak', 'shuffle'), toggle('nomor urut', 'numbered'), toggle('balasan', 'reply', opt.numbered), toggle('kirim ulang otomatis', 'resend', opt.reply),
      button('Pesan lain', () => { opt.words = POOL[Math.floor(Math.random() * POOL.length)]; go(); }, 'small ghost'));
    const run = button('🕊️ Kirim pesan', () => { run.disabled = true; status.textContent = 'Merpati terbang…'; batch(Array.from({ length: n }, (_, i) => i + 1)); }, 'primary');
    wrap.replaceChildren(settings, v.node, el('div', { class: 'row' }, run, button('Ulangi', go, 'small ghost'), counter.node), status);
  }
  go();
  return { destroy() { live?.stop(); } };
}

// Two teams: the sender taps cards to send, the receiver writes replies.
function createTwoSides(root, ctx) {
  const wrap = el('div', { class: 'act merpati-act' });
  root.append(wrap);
  let live = null;
  let words = MESSAGE;
  function setup() {
    live?.stop();
    const input = el('input', { class: 'txt wide', value: words.join(' '), 'aria-label': 'pesan', maxlength: 80 });
    const pick = button('Pesan contoh lain', () => { input.value = POOL[Math.floor(Math.random() * POOL.length)].join(' '); }, 'small ghost');
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tim Pengirim: tulis pesan (3 sampai 10 kata), lalu Mulai.'), el('div', { class: 'row wrap' }, input, pick),
      button('Mulai', () => {
        const w = input.value.trim().toUpperCase().split(/\s+/).filter(Boolean).slice(0, 10);
        if (w.length < 3) { shake(input); return; }
        words = w;
        play();
      }, 'primary'));
  }
  function play() {
    const rand = makeRng(newSeed());
    const n = words.length;
    const picked = new Set();
    const replyPick = new Set();
    let birds = 0;
    let flying = false;
    const send = senderCards(words, true, { onTap(no) { picked.has(no) ? picked.delete(no) : picked.add(no); paint(); } });
    const replyKeys = Array.from({ length: n }, (_, i) => onTap(el('button', { class: 'key', type: 'button' }, i + 1), () => { replyPick.has(i + 1) ? replyPick.delete(i + 1) : replyPick.add(i + 1); paint(); }));
    const recv = receiverBoard(n, { numbered: true });
    const inbox = el('p', { class: 'kotak-balasan' }, 'Belum ada balasan.');
    const counter = counterBox();
    const status = el('p', { class: 'reveal info' }, 'Pengirim: ketuk kartu yang mau dikirim.');
    const paint = () => {
      send.cards.forEach((c, i) => c.classList.toggle('pilih', picked.has(i + 1)));
      replyKeys.forEach((k, i) => k.classList.toggle('on', replyPick.has(i + 1)));
      counter.set({ 'merpati dipakai': birds });
    };
    const sendBtn = button('🕊️ Kirim merpati', () => {
      if (flying || !picked.size) return;
      flying = true;
      const cards = [...picked].sort((a, b) => a - b).map((no) => ({ no, word: words[no - 1] }));
      birds += cards.length;
      picked.clear();
      paint();
      v.fly(flight(cards, rand, { loss: 6 }), { n, onLand: (c) => recv.land(c), done: () => { flying = false; status.textContent = 'Penerima: ketuk nomor yang sudah diterima, lalu Kirim balasan.'; } });
    }, 'primary');
    const replyBtn = button('🕊️ Kirim balasan', () => {
      if (flying) return;
      flying = true;
      birds++;
      const reply = { no: 0, word: `DITERIMA ${[...replyPick].sort((a, b) => a - b).join(' ') || '–'}` };
      replyPick.clear();
      paint();
      const lost = rand.int(1, 6) === 1;
      v.fly(lost ? { arrived: [], lost: [reply] } : { arrived: [reply], lost: [] }, { back: true, n, onLand: () => { inbox.textContent = `Balasan: ${reply.word}`; }, done: () => { flying = false; status.textContent = 'Pengirim: kirim ulang yang perlu.'; } });
    }, 'primary');
    const readBtn = button('📜 Baca pesan', () => {
      if (recv.have.size === n) {
        status.className = 'reveal';
        status.textContent = `Pesan utuh: "${words.join(' ')}" dengan ${birds} merpati. 🎉`;
        ctx.sound.win();
      } else { status.className = 'reveal bad'; status.textContent = `Masih kurang ${n - recv.have.size} kata.`; ctx.sound.bad(); }
    }, 'small');
    const v = valley(el('div', { class: 'col' }, send.node, sendBtn, inbox), el('div', { class: 'col' }, recv.node, el('div', { class: 'keys balas-keys' }, replyKeys), el('div', { class: 'row' }, replyBtn, readBtn)));
    live = v;
    paint();
    wrap.replaceChildren(v.node, el('div', { class: 'row' }, counter.node, button('Pesan baru', setup, 'small ghost')), status);
  }
  setup();
  return { destroy() { live?.stop(); } };
}
