// Arisan yang Jujur — SMA/SMK (16–18 tahun), protokol kriptografi sederhana.
// A neighbourhood savings-club draw: why the last speaker can cheat, sealed
// envelopes (hiding and binding), digital commitments with a toy hash and salt,
// a secret average passed around a circle, and what a protocol cannot protect.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead } from './misi-kit.js';

export const ANGGOTA = ['Bu Rina', 'Pak Joko', 'Bu Sari', 'Pak Bowo', 'Bu Tini', 'Pak Darto'];
export const winner = (nums, m = 6) => nums.reduce((s, x) => s + x, 0) % m;
const rp = (x) => `Rp${x.toLocaleString('id-ID')}`;
const num = (x) => x.toLocaleString('id-ID');

// The worksheet's made-up hash machine; other texts use a 16-bit FNV-1a code.
export const SIDIK = ['7C1E', '2A9F', 'E04B', '91D6', '5B38', 'C4F2'];
export function sidik(text) {
  const t = String(text).trim();
  if (/^[0-5]$/.test(t)) return SIDIK[Number(t)];
  let h = 0x811c9dc5;
  for (const c of new TextEncoder().encode(t)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; }
  return ((h >>> 16) ^ (h & 0xffff)).toString(16).toUpperCase().padStart(4, '0');
}
export const SALTED = '2-kursi-hijau-pelangi-87';

export const RAND = 1234567;
export const SAKU = [['Ani', 50000], ['Budi', 75000], ['Citra', 40000], ['Dodi', 60000], ['Eka', 100000]];
export function ring(r = RAND, saku = SAKU.map((s) => s[1])) { const out = []; let x = r; for (const s of saku) { x += s; out.push(x); } return out; }

export const RULES = [['Lima amplop sudah dibuka; Bu Rina melihat dirinya kalah lalu menolak membuka amplopnya.', 'Amplop yang tidak dibuka dianggap berisi 0, atau pemiliknya kehilangan hak menang bulan itu', 'mengikat'], ['Pak Joko menulis "2 atau 4", lalu memilih setelah melihat angka lain.', 'Amplop hanya boleh berisi satu angka 0–5; isi yang tidak sah dianggap 0', 'mengikat'], ['Amplop Bu Sari tipis, angkanya terlihat bila diterawang.', 'Amplop harus tebal atau kertas dilipat sampai tidak tembus pandang', 'menyembunyikan'], ['Pak Bowo menukar amplopnya setelah beberapa amplop dibuka.', 'Amplop ditandatangani di segelnya dan dipegang bersama di tengah meja sampai dibuka', 'mengikat']];
export const LIMITS = [['Pemenang ditentukan oleh angka anggota yang mengirim paling akhir.', true, 'Undian amplop terkunci: semua angka dikunci dulu, lalu dibuka bersama'], ['Pengelola arisan daring tak dikenal menjanjikan untung 50% sebulan, lalu kabur.', false, 'Ikut hanya dengan orang yang dikenal dan catatan terbuka; untung besar dalam waktu singkat tanda arisan bodong'], ['Seseorang mengaku pengurus dan meminta kode OTP di ponselmu.', false, 'Jangan pernah memberikan kode sekali pakai kepada siapa pun'], ['Anggota mengaku belum menerima kiriman uang, padahal sudah dikirim.', false, 'Simpan bukti transaksi dan catat setoran di catatan bersama'], ['Tangkapan layar saldo semua anggota beredar di grup.', false, 'Jangan bagikan tangkapan layar saldo; atur privasi akun dan grup']];

// --- pieces ---
const envelopes = (nums, open = true, names = ANGGOTA) => el('div', { class: 'aw-amplop-amplop' }, nums.map((x, i) => el('div', { class: `aw-amplop ${open ? 'buka' : ''}` }, el('span', { class: 'aw-ikon' }, open ? '📄' : '✉️'), el('b', null, open ? x : '🔒'), el('small', null, `${i}. ${names[i]}`))));
const sumLine = (nums, m = 6) => el('div', { class: 'aw-hitung' }, `${nums.join(' + ')} = ${nums.reduce((s, x) => s + x, 0)} · sisa bagi ${m} = ${winner(nums, m)}`);

// The arisan table: six chairs around a cloth, a pot in the middle, and a
// pointer that walks chair by chair to count the remainder.
function meja({ onSeat = null } = {}) {
  const seats = ANGGOTA.map((nm, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    const node = el(onSeat ? 'button' : 'div', { class: 'aj22-kursi', type: onSeat ? 'button' : null, 'data-i': i, style: { left: `${50 + 38 * Math.cos(a)}%`, top: `${50 + 36 * Math.sin(a)}%` } }, el('small', null, `${i}. ${nm}`), el('span', { class: 'aj22-isi' }));
    return onSeat ? onTap(node, () => onSeat(i)) : node;
  });
  const pusat = el('div', { class: 'aj22-pusat' }, '💰');
  const node = el('div', { class: 'aj22-meja' }, el('div', { class: 'aj22-taplak' }), pusat, ...seats);
  let timer = null;
  const api = {
    node, seats,
    set(i, content, cls = '') { const s = seats[i].querySelector('.aj22-isi'); s.textContent = content; s.className = `aj22-isi ${cls}`; },
    center(t) { pusat.textContent = t; },
    mark(i, cls) { seats.forEach((s, k) => s.classList.toggle(cls, k === i)); },
    clear(cls) { seats.forEach((s) => s.classList.remove(cls)); },
    // Count 1, 2, …, sum around the table starting from chair 0; land on sum mod 6.
    spin(sum, cb) {
      clearInterval(timer); let k = 0; api.clear('menang'); api.mark(0, 'tunjuk'); pusat.textContent = '0';
      timer = setInterval(() => {
        if (!node.isConnected) { clearInterval(timer); return; }
        if (k >= sum) { clearInterval(timer); api.clear('tunjuk'); api.mark(sum % 6, 'menang'); pusat.textContent = `${sum} → sisa ${sum % 6}`; cb?.(sum % 6); return; }
        k++; api.mark(k % 6, 'tunjuk'); pusat.textContent = String(k);
      }, Math.max(45, Math.min(120, 1500 / Math.max(sum, 1))));
    },
  };
  return api;
}

const nomorPad = (label, onPick, extra = {}) => el('div', { class: 'aj22-tombol' }, el('small', null, label), ...[0, 1, 2, 3, 4, 5].map((x) => onTap(el('button', { class: 'aj22-nomor', type: 'button', 'data-x': x, ...extra }, x), () => onPick(x))));

// Mission 1: the last speaker chooses the winner.
function lastRound(host, ctx, { done }) {
  const said = [3, 1, 4, 0, 2]; const goals = [5, 2]; let g = 0; let busy = false;
  const m = meja();
  said.forEach((x, i) => m.set(i, String(x), 'angka'));
  const msg = el('p', { class: 'reveal info' });
  const ready = () => { busy = false; m.set(5, '?', 'angka tanya'); m.mark(goals[g], 'sasaran'); say(msg, 'info', g === 0 ? 'Lima angka sudah disebut. Pak Darto bicara terakhir. Ketuk angka Pak Darto supaya dirinya sendiri menang (kursi bertanda 🎯).' : 'Sekarang Pak Darto ingin Bu Sari yang menang. Angka berapa?'); };
  const pad = nomorPad('Angka Pak Darto:', (x) => {
    if (busy || g >= goals.length) return; busy = true;
    m.set(5, String(x), 'angka'); ctx.sound.tap();
    m.spin(10 + x, (w) => {
      if (w !== goals[g]) { ctx.mistake(); shake(m.node); say(msg, 'bad', `3 + 1 + 4 + 0 + 2 + ${x} = ${10 + x}, sisa bagi 6 = ${w}: ${ANGGOTA[w]} yang menang. Coba angka lain.`); setTimeout(() => { if (g < goals.length) ready(); }, 1600); return; }
      ctx.sound.good(); g++;
      if (g < goals.length) { say(msg, 'info', `Jumlah ${10 + x}, sisa ${w}: Pak Darto menang.`); setTimeout(ready, 1800); }
      else { busy = true; m.clear('sasaran'); say(msg, '', 'Dengan 1 Pak Darto menang, dengan 4 Bu Sari menang. Celahnya: orang yang bicara terakhir sudah tahu semua angka lain, jadi ia bisa memilih pemenang.'); done(); }
    });
  });
  host.append(m.node, pad, msg); ready();
}

// Mission 2: sealed envelopes opened together.
function envelopeRound(host, ctx, { done }) {
  const sets = [[4, 5, 2, 0, 3, 5], [5, 5, 5, 5, 5, 5]]; let s = 0; let opened = false; let busy = false;
  const m = meja({ onSeat: (i) => tapSeat(i) });
  const bar = el('div', { class: 'aj22-tombol' });
  const msg = el('p', { class: 'reveal info' });
  const sum = () => sets[s].reduce((a, b) => a + b, 0);
  const seal = () => {
    opened = false; busy = false; ANGGOTA.forEach((_, i) => m.set(i, '✉️', 'amplop')); m.center('💰'); m.clear('menang');
    bar.replaceChildren(button('📬 Buka bersama', open, 'primary'));
    say(msg, 'info', s === 0 ? 'Enam amplop sudah terkumpul dan terkunci di tengah meja. Bukalah bersama-sama.' : 'Bulan berikutnya semua anggota diam-diam menulis 5. Buka amplopnya.');
  };
  function open() {
    if (opened) return; opened = true; ctx.sound.tap();
    sets[s].forEach((x, i) => m.set(i, String(x), 'angka buka')); bar.replaceChildren(); m.center(`Σ ${sum()}`);
    say(msg, 'info', `Jumlahnya ${sum()}. Siapa pemenangnya (sisa bagi 6)? Ketuk kursinya.`);
  }
  function tapSeat(i) {
    if (!opened || busy) return;
    const w = sum() % 6;
    if (i !== w) { ctx.mistake(); shake(m.node); say(msg, 'bad', `Hitung lagi: ${sum()} dibagi 6, berapa sisanya? Pemenangnya kursi bernomor sisa itu.`); return; }
    busy = true; ctx.sound.tap();
    m.spin(sum(), () => {
      ctx.sound.good(); s++;
      if (s < sets.length) { say(msg, 'info', `19 dibagi 6 sisa 1: ${ANGGOTA[w]} menang!`); setTimeout(seal, 2400); }
      else { say(msg, '', '30 dibagi 6 sisa 0: Bu Rina. Semua angka dikunci dulu, baru dibuka bersama, jadi tidak ada yang bisa memilih angkanya setelah melihat angka orang lain.'); done(); }
    });
  }
  host.append(m.node, bar, msg); seal();
}

// Mission 3: five cheaters write 1; Bu Sari rolls honestly.
function conspiracyRound(host, ctx, { done }) {
  const m = meja();
  [0, 1, 3, 4, 5].forEach((i) => m.set(i, '1', 'angka'));
  m.set(2, '🎲', 'angka tanya');
  const filled = {}; let busy = false; let fin = false;
  const table = el('div', { class: 'aj22-tabel' });
  const verdict = el('div', { class: 'aj22-putus' });
  const msg = el('p', { class: 'reveal info' }, 'Lima anggota bersekongkol menulis 1 supaya Pak Darto menang. Bu Sari jujur dan mengocok dadu 0–5. Coba setiap kemungkinan angka Bu Sari.');
  const drawT = () => table.replaceChildren(el('div', { class: 'aj22-tb kepala' }, el('b', null, 'Bu Sari'), el('b', null, 'Jumlah'), el('b', null, 'Pemenang')),
    ...[0, 1, 2, 3, 4, 5].map((v) => el('div', { class: `aj22-tb ${v in filled ? 'isi' : ''} ${filled[v] === 5 ? 'darto' : ''}` }, el('span', null, v), el('span', null, v in filled ? 5 + v : ''), el('span', null, v in filled ? ANGGOTA[filled[v]] : ''))));
  const pad = nomorPad('Angka Bu Sari:', (v) => {
    if (busy || v in filled) return; busy = true; ctx.sound.tap();
    m.set(2, String(v), 'angka');
    m.spin(5 + v, (w) => {
      busy = false; filled[v] = w; pad.querySelector(`[data-x="${v}"]`).classList.add('on'); drawT();
      if (Object.keys(filled).length === 6) ask();
    });
  });
  function ask() {
    say(msg, 'info', 'Setiap anggota menang tepat sekali. Jadi, berapa peluang Pak Darto menang?');
    verdict.replaceChildren(...['1/6', '1/2', '5/6', '1'].map((p) => button(p, () => {
      if (fin) return;
      if (p !== '1/6') { ctx.mistake(); shake(verdict); say(msg, 'bad', 'Lihat tabel: Pak Darto muncul di berapa baris dari enam?'); return; }
      fin = true; ctx.sound.good(); verdict.replaceChildren();
      say(msg, '', 'Peluangnya tetap 1/6, sama seperti tanpa persekongkolan. Selama satu anggota jujur memilih acak, para pencurang tidak bisa mengatur pemenang.'); done();
    }, 'aj22-putus-btn')));
  }
  host.append(el('div', { class: 'aj22-dua' }, m.node, el('div', { class: 'aj22-sisi' }, pad, table)), verdict, msg);
  drawT();
}

// Mission 4: catch the cheater from clue cards.
export const TRIK = [{ id: 'tolak', nama: 'Tolak Buka' }, { id: 'dua', nama: 'Dua Angka' }, { id: 'intip', nama: 'Intip Amplop' }, { id: 'tukar', nama: 'Tukar Amplop' }];
export function clues(id, X, Y) {
  return {
    tolak: [`Lima amplop sudah dibuka; tinggal amplop ${X}.`, `${X} berkata, "Amplop saya ketinggalan di rumah, ulang saja undiannya."`, `Dari lima angka yang terbuka, ${X} sudah tahu dirinya akan kalah.`],
    dua: [`Di kertas ${X} tertulis "2 atau 4".`, `${X} minta amplopnya dibuka paling akhir.`, `${X} berkata, "Maksud saya 4," dan ${X} menang.`],
    intip: [`Amplop ${Y} tipis, dan meja arisan dekat jendela yang terang.`, `${X} menulis angkanya paling lambat sambil memandangi amplop ${Y}.`, `Angka ${X} "pas sekali" membuat ${X} menang.`],
    tukar: [`${X} keluar sebentar mengambil minum, amplopnya ikut di saku.`, `Segel amplop ${X} berbeda dari amplop lain.`, `Saat amplop ${X} dibuka, angkanya tepat membuat ${X} menang.`],
  }[id];
}
function catchRound(host, ctx, { cheat, done }) {
  const X = ANGGOTA[cheat.x]; const Y = ANGGOTA[cheat.y];
  const texts = clues(cheat.id, X, Y);
  const shown = new Set(); let sus = null; let trik = null; let fin = false;
  const m = meja({ onSeat: (i) => { if (fin) return; if (!shown.size) { say(msg, 'bad', 'Buka minimal satu kartu petunjuk dulu.'); return; } sus = i; m.mark(i, 'curiga'); ctx.sound.tap(); check(); } });
  ANGGOTA.forEach((_, i) => m.set(i, '✉️', 'amplop'));
  const cards = el('div', { class: 'aj22-petunjuk' });
  const tricks = el('div', { class: 'aj22-tombol' });
  const msg = el('p', { class: 'reveal info' }, 'Bulan ini ada yang curang. Buka kartu petunjuk, lalu ketuk kursi pencurang dan kartu triknya. Makin sedikit petunjuk, makin hebat.');
  const drawCards = () => cards.replaceChildren(...texts.map((t, i) => shown.has(i) ? el('div', { class: 'aj22-kartu buka' }, el('small', null, `Petunjuk ${i + 1}`), t)
    : onTap(el('button', { class: 'aj22-kartu', type: 'button', 'data-c': i }, el('small', null, `Petunjuk ${i + 1}`), '❓ ketuk untuk membuka'), () => { if (fin) return; shown.add(i); ctx.sound.tap(); drawCards(); })));
  const drawTricks = () => tricks.replaceChildren(el('small', null, 'Trik:'), ...TRIK.map((t) => onTap(el('button', { class: `aj22-trik ${trik === t.id ? 'on' : ''}`, type: 'button', 'data-t': t.id }, t.nama), () => { if (fin) return; if (!shown.size) { say(msg, 'bad', 'Buka minimal satu kartu petunjuk dulu.'); return; } trik = t.id; ctx.sound.tap(); drawTricks(); check(); })));
  function check() {
    if (sus == null || trik == null) { say(msg, 'info', sus == null ? 'Sekarang ketuk kursi pencurangnya.' : 'Sekarang ketuk kartu triknya.'); return; }
    if (sus !== cheat.x || trik !== cheat.id) {
      ctx.mistake(); shake(host); say(msg, 'bad', sus !== cheat.x ? `${ANGGOTA[sus]} bukan pencurangnya. Baca petunjuknya lagi.` : `Pencurangnya benar, tetapi triknya bukan ${TRIK.find((t) => t.id === trik).nama}.`);
      sus = null; trik = null; m.clear('curiga'); drawTricks(); return;
    }
    fin = true; ctx.sound.good(); m.set(cheat.x, '🕵️', 'tangkap');
    say(msg, '', `Tertangkap: ${X} memakai trik ${TRIK.find((t) => t.id === trik).nama}, dengan ${shown.size} petunjuk.`);
    done();
  }
  host.append(el('div', { class: 'aj22-dua' }, m.node, cards), tricks, msg);
  drawCards(); drawTricks();
}

// Tap a left item, then the matching right item.
function pairRound(host, ctx, { left, right, tag = 'abcde', bad, end, done }) {
  const order = ctx.rand.shuffle(right.map((_, i) => i));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'aw-cocok aj22-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu di kiri, lalu pasangannya di kanan.');
  const draw = () => box.replaceChildren(el('div', { class: 'aw-kol' }, left.map((l, i) => onTap(el('button', { class: `aw-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button', 'data-l': i }, `${tag[i]}. ${l}`), () => { if (!ok.has(i)) { sel = i; draw(); } }))),
    el('div', { class: 'aw-kol' }, order.map((i) => onTap(el('button', { class: `aw-item ${ok.has(i) ? 'cocok' : ''}`, type: 'button', 'data-r': i }, right[i]), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', bad); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === left.length) { say(msg, '', end); done(); }
    }))));
  host.append(box, msg);
  draw();
}

// Tap a card, then the bin it belongs to.
function sortRound(host, ctx, { cards, bins, intro, wrong, end, done }) {
  const left = ctx.rand.shuffle(cards.map((_, i) => i)); const placed = {}; let sel = null;
  const tray = el('div', { class: 'aj22-baki' });
  const box = el('div', { class: 'aj22-wadah' });
  const msg = el('p', { class: 'reveal info' }, intro);
  const draw = () => {
    tray.replaceChildren(...left.filter((i) => !(i in placed)).map((i) => onTap(el('button', { class: `aj22-kartu-sifat ${sel === i ? 'pilih' : ''}`, type: 'button', 'data-k': i }, cards[i][0]), () => { sel = i; ctx.sound.tap(); draw(); })));
    box.replaceChildren(...bins.map(([id, label]) => onTap(el('div', { class: 'aj22-kotak', role: 'button', tabindex: 0, 'data-b': id }, el('b', null, label), el('div', { class: 'aj22-kotak-isi' }, ...Object.entries(placed).filter(([, b]) => b === id).map(([i]) => el('span', null, cards[i][2] || cards[i][0])))), () => {
      if (sel == null) { say(msg, 'info', 'Ketuk kartunya dulu, lalu kotaknya.'); return; }
      if (cards[sel][1] !== id) { ctx.mistake(); shake(box); say(msg, 'bad', wrong(cards[sel])); return; }
      placed[sel] = id; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(placed).length === cards.length) { say(msg, '', end); done(); }
    })));
  };
  host.append(tray, box, msg);
  draw();
}

export const SIFAT = [['🙈 Intip Amplop', 'sembunyi', 'Intip Amplop'], ['🔢 Dua Angka', 'ikat', 'Dua Angka'], ['🔄 Tukar Amplop', 'ikat', 'Tukar Amplop'], ['🙅 Tolak Buka', 'bukan', 'Tolak Buka']];
const KOTAK_SIFAT = [['sembunyi', 'Melanggar sifat MENYEMBUNYIKAN'], ['ikat', 'Melanggar sifat MENGIKAT'], ['bukan', 'Bukan keduanya: membatalkan']];

// Mission 5: the hash machine, without and with salt, then checking openings.
function hashRound(host, ctx, { done }) {
  const salted = sidik(SALTED);
  const step = el('div', { class: 'aj22-langkah' });
  host.append(step);
  const machine = (target, label, onTry) => {
    const tried = [];
    const log = el('div', { class: 'aj22-log' });
    const msg = el('p', { class: 'reveal info' }, label);
    const pad = nomorPad('Masukkan ke mesin:', (x) => {
      if (tried.includes(x)) return; tried.push(x); ctx.sound.tap(); pad.querySelector(`[data-x="${x}"]`).classList.add('on');
      const h = sidik(String(x));
      log.append(el('code', { class: h === target ? 'cocok' : '' }, `sidik("${x}") = ${h}`));
      onTry(x, h, tried, msg);
    });
    step.replaceChildren(el('div', { class: 'aj22-mesin' }, el('b', null, '⚙️ Mesin Sidik'), el('span', null, `Sidik yang dikirim: ${target}`)), pad, log, msg);
  };
  machine('E04B', 'Bu Tini mengirim sidik E04B sebagai amplop digitalnya. Tim Rudi mencoba angka 0–5 di mesin sidik.', (x, h, tried, msg) => {
    if (h !== 'E04B') { say(msg, 'info', `${h} bukan E04B. Coba lagi.`); return; }
    say(msg, 'info', `Ketemu dalam ${tried.length} percobaan: angka Bu Tini 2. Tanpa garam hanya ada enam kemungkinan.`);
    setTimeout(() => machine(salted, `Bulan depan Bu Tini menambahkan garam: ia mengirim sidik dari "angka-kata-kata-angka", yaitu ${salted}. Coba lagi semua angka 0–5.`, (x2, h2, tried2, msg2) => {
      if (tried2.length < 6) { say(msg2, 'info', `${h2} bukan ${salted}.`); return; }
      say(msg2, 'info', 'Keenam angka tidak ada yang cocok. Tanpa tahu garamnya, Tim Rudi tidak bisa menebak.');
      setTimeout(() => { step.replaceChildren(); verifyRound(step, ctx, { done }); }, 2600);
    }), 2600);
  });
}

// Check two openings against the hashes sent earlier.
function verifyRound(host, ctx, { done }) {
  const cases = [['Bu Tini', sidik(SALTED), SALTED, true], ['Pak Bowo', sidik('3-meja-biru-hujan-42'), '5-meja-biru-hujan-42', false]];
  const res = {}; const shown = {};
  const box = el('div', { class: 'aw-buka aj22-buka' });
  const msg = el('p', { class: 'reveal info' }, 'Saat undian dibuka, setiap anggota mengumumkan teks pembukaannya. Hitung sidiknya, bandingkan, lalu beri cap.');
  const draw = () => box.replaceChildren(...cases.map(([who, sent, text, honest], i) => el('div', { class: `aw-kasus ${i in res ? 'beres' : ''}`, 'data-c': i }, el('b', null, who), el('span', null, `Sidik terkirim: ${sent}`), el('span', null, `Pembukaan: ${text}`),
    shown[i] ? el('code', { class: sidik(text) === sent ? 'cocok' : 'beda' }, `sidik = ${sidik(text)}`) : onTap(el('button', { class: 'seg-btn aj22-hitung', type: 'button' }, '⚙️ Hitung sidik'), () => { shown[i] = true; ctx.sound.tap(); draw(); }),
    i in res ? el('span', { class: `aj22-cap ${honest ? 'sah' : 'palsu'}` }, honest ? 'SAH' : 'DIGANTI') : el('div', { class: 'seg' }, [[true, '✅ Sah'], [false, '❌ Angkanya diganti']].map(([v, l]) => onTap(el('button', { class: 'seg-btn aj22-vonis', type: 'button', 'data-v': v }, l), () => {
      if (!shown[i]) { say(msg, 'bad', 'Hitung sidiknya dulu.'); shake(box); return; }
      if (v !== honest) { ctx.mistake(); shake(box); say(msg, 'bad', 'Bandingkan kedua sidik sekali lagi.'); return; }
      res[i] = v; ctx.sound.tap(); draw();
      if (Object.keys(res).length === cases.length) { say(msg, '', 'Sidik yang sama berarti teksnya sama; mencari teks lain dengan sidik yang sama hampir mustahil. Amplop digital ini menyembunyikan (garam) dan mengikat (sidik).'); done(); }
    }))))));
  host.append(box, msg);
  draw();
}

// The ring of five friends; papers lie between neighbours.
function lingkar({ onPerson = null } = {}) {
  const pos = SAKU.map((_, i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return [50 + 36 * Math.cos(a), 50 + 37 * Math.sin(a)]; });
  const people = SAKU.map(([nm], i) => { const b = el(onPerson ? 'button' : 'div', { class: 'aj22-orang', type: onPerson ? 'button' : null, 'data-i': i, style: { left: `${pos[i][0]}%`, top: `${pos[i][1]}%` } }, el('b', null, nm), el('small', null, '')); return onPerson ? onTap(b, () => onPerson(i)) : b; });
  const papers = pos.map(([x1, y1], i) => { const [x2, y2] = pos[(i + 1) % 5]; return el('span', { class: 'aj22-kertas kosong', style: { left: `${(x1 + x2) / 2}%`, top: `${(y1 + y2) / 2}%` }, 'data-i': i }); });
  const pusat = el('div', { class: 'aj22-pusat' });
  const node = el('div', { class: 'aj22-lingkar' }, el('div', { class: 'aj22-taplak bulat' }), pusat, ...papers, ...people);
  return {
    node, people, papers,
    paper(i, text, cls = '') { papers[i].textContent = text == null ? '' : `${SAKU[i][0][0]}→${SAKU[(i + 1) % 5][0][0]} ${text}`; papers[i].className = `aj22-kertas ${text == null ? 'kosong' : ''} ${cls}`; },
    note(i, t) { people[i].querySelector('small').textContent = t; },
    mark(i, cls, on = true) { people[i].classList.toggle(cls, on); },
    center(t) { pusat.textContent = t; },
  };
}

// Mission 6: pass the paper around the circle.
function ringRound(host, ctx, { done }) {
  const P = ring(); let at = 0; let stage = 0;
  const L = lingkar({ onPerson: (i) => give(i) });
  SAKU.forEach((_, i) => L.paper(i, null));
  const bar = el('div', { class: 'aj22-tombol' });
  const msg = el('p', { class: 'reveal info' });
  L.mark(0, 'pegang'); L.note(0, '✏️');
  say(msg, 'info', `Lima sahabat ingin tahu rata-rata uang saku tanpa membuka uang saku masing-masing. Ani menulis angka acak ${num(RAND)} ditambah uang sakunya. Ketuk orang yang menerima kertas berikutnya.`);
  function give(i) {
    if (stage) return;
    const to = (at + 1) % 5;
    if (i !== to) { ctx.mistake(); shake(L.node); say(msg, 'bad', `Kertas berjalan searah lingkaran: dari ${SAKU[at][0]} ke ${SAKU[to][0]}.`); return; }
    L.paper(at, num(P[at]), 'baru'); L.mark(at, 'pegang', false); L.mark(i, 'pegang'); ctx.sound.tap();
    at = i;
    if (i === 0) {
      stage = 1; say(msg, 'info', `Kertas kembali ke Ani: ${num(P[4])}. Apa yang dilakukan Ani?`);
      bar.replaceChildren(button(`− ${num(RAND)} (angka acak)`, () => calc('kurang')), button('÷ 5', () => calc('bagi')));
    } else say(msg, 'info', `${SAKU[i][0]} menambahkan uang sakunya. Ketuk penerima berikutnya.`);
  }
  let total = null;
  function calc(op) {
    if (op === 'bagi' && total == null) { ctx.mistake(); shake(bar); say(msg, 'bad', `${num(P[4])} masih mengandung angka acak Ani. Kurangi dulu.`); return; }
    ctx.sound.tap();
    if (op === 'kurang') { if (total != null) return; total = P[4] - RAND; L.center(`Jumlah ${rp(total)}`); say(msg, 'info', `${num(P[4])} − ${num(RAND)} = ${num(total)}: jumlah uang saku kelima sahabat. Sekarang rata-ratanya.`); return; }
    bar.replaceChildren(); L.center(`Rata-rata ${rp(total / 5)}`);
    say(msg, '', `Jumlah ${rp(total)}, rata-rata ${rp(total / 5)}. Setiap orang hanya melihat angka besar yang tercampur angka acak Ani, jadi tidak ada yang tahu uang saku orang lain.`); done();
  }
  host.append(L.node, bar, msg);
}

// Mission 6b: two friends compare papers; a tiny random number leaks.
function leakRound(host, ctx, { done }) {
  let P = ring(); const pick = new Set(); let stage = 0; let busy = false;
  const L = lingkar({ onPerson: (i) => tap(i) });
  const bar = el('div', { class: 'aj22-tombol' });
  const msg = el('p', { class: 'reveal info' }, 'Semua kertas sudah berpindah. Dua orang diam-diam saling menunjukkan kertas yang mereka tulis dan terima. Ketuk dua orang yang bersekongkol: bisakah mereka membongkar uang saku seseorang?');
  const drawP = () => SAKU.forEach((_, i) => L.paper(i, num(P[i])));
  drawP();
  function tap(i) {
    if (stage || busy) return;
    if (pick.has(i)) { pick.delete(i); L.mark(i, 'sekongkol', false); return; }
    pick.add(i); L.mark(i, 'sekongkol'); ctx.sound.tap();
    if (pick.size < 2) return;
    const [a, b] = [...pick].sort((x, y) => x - y);
    const gap = (b - a + 5) % 5;
    if (gap === 1 || gap === 4) {
      busy = true; say(msg, 'info', `${SAKU[a][0]} dan ${SAKU[b][0]} duduk bersebelahan: kertas mereka tidak membongkar siapa pun. Coba pasangan lain.`);
      setTimeout(() => { pick.forEach((k) => L.mark(k, 'sekongkol', false)); pick.clear(); busy = false; }, 1800); return;
    }
    const [s, mid] = gap === 2 ? [a, (a + 1) % 5] : [b, (b + 1) % 5];
    const e = (mid + 1) % 5;
    stage = 1; ctx.sound.good(); L.note(mid, rp(SAKU[mid][1])); L.mark(mid, 'bocor');
    L.paper(s, num(P[s]), 'sorot'); L.paper(mid, num(P[mid]), 'sorot');
    say(msg, 'info', `${SAKU[s][0]} menulis ${num(P[s])} dan ${SAKU[e][0]} menerima ${num(P[mid])}. Selisihnya ${rp(P[mid] - P[s])}: uang saku ${SAKU[mid][0]} terbongkar! Sekarang lihat bila Ani memilih angka acak kecil.`);
    bar.replaceChildren(...[[RAND, num(RAND)], [10, '10']].map(([v, l]) => button(`Angka acak ${l}`, () => small(v))));
  }
  function small(v) {
    if (stage !== 1) return;
    if (v !== 10) { say(msg, 'info', 'Itu angka acak yang sekarang. Coba angka acak yang kecil.'); return; }
    stage = 2; ctx.sound.tap(); P = ring(10); drawP(); L.paper(0, num(P[0]), 'sorot'); bar.replaceChildren();
    say(msg, '', `Dengan angka acak 10, Budi menerima ${num(P[0])} dan langsung menebak uang saku Ani sekitar ${rp(50000)}. Angka acak harus besar dan tidak tertebak, dan cara melingkar ini rapuh bila dua orang bersekongkol.`); done();
  }
  host.append(L.node, bar, msg);
}

// Boss: split into three shares, keep one, give two to the next two friends.
const BAGI = [[18000, 9000, 23000], [30000, 25000, 20000], [12000, 21000, 7000], [26000, 14000, 20000], [45000, 35000, 20000]];
const N15 = 15;
function rank(rows) {
  const m = rows.map((r) => r.slice()); let r = 0;
  for (let c = 0; c < N15 && r < m.length; c++) {
    const p = m.findIndex((row, j) => j >= r && Math.abs(row[c]) > 1e-9); if (p < 0) continue;
    [m[r], m[p]] = [m[p], m[r]];
    for (let j = 0; j < m.length; j++) if (j !== r && Math.abs(m[j][c]) > 1e-9) { const f = m[j][c] / m[r][c]; for (let cc = 0; cc < N15; cc++) m[j][cc] -= f * m[r][cc]; }
    r++;
  }
  return r;
}
// Which friends' pocket money can coalition S compute? Shares go i → i, i+1, i+2.
export function bocor(S) {
  const idx = (i, k) => i * 3 + k; const holder = (i, k) => (i + k) % 5;
  const unit = (v) => { const a = Array(N15).fill(0); a[v] = 1; return a; };
  const known = [];
  for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) if (S.includes(i) || S.includes(holder(i, k))) known.push(unit(idx(i, k)));
  for (let h = 0; h < 5; h++) { const a = Array(N15).fill(0); for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) if (holder(i, k) === h) a[idx(i, k)] = 1; known.push(a); }
  const r0 = rank(known);
  return [0, 1, 2, 3, 4].filter((t) => !S.includes(t) && rank([...known, [0, 1, 2, 3, 4].flatMap((i) => [0, 1, 2].map(() => (i === t ? 1 : 0)))]) === r0);
}
function bossRound(host, ctx, { done }) {
  const L = lingkar({ onPerson: (i) => tapPerson(i) });
  const chips = el('div', { class: 'aj22-tombol' });
  const bar = el('div', { class: 'aj22-tombol' });
  const msg = el('p', { class: 'reveal info' });
  const at = [null, null, null]; let sel = null; let stage = 0; const coal = new Set();
  const want = [0, 1, 2];
  const drawChips = () => chips.replaceChildren(el('small', null, `Uang saku Ani ${rp(50000)} dipecah:`), ...BAGI[0].map((v, k) => onTap(el('button', { class: `aj22-trik ${sel === k ? 'on' : ''} ${at[k] != null ? 'pakai' : ''}`, type: 'button', 'data-k': k, disabled: at[k] != null }, `${rp(v)}${at[k] != null ? ` → ${SAKU[at[k]][0]}` : ''}`), () => { if (stage) return; sel = k; ctx.sound.tap(); drawChips(); })));
  say(msg, 'info', 'Cara lebih kuat: setiap orang memecah uang sakunya menjadi 3 bagian, menyimpan 1, dan memberikan 2 bagian kepada dua orang berikutnya searah lingkaran. Ketuk bagian Ani, lalu orang yang memegangnya.');
  function tapPerson(i) {
    if (stage === 0) {
      if (sel == null) { say(msg, 'info', 'Ketuk dulu salah satu bagian uang saku Ani.'); return; }
      if (!want.includes(i)) { ctx.mistake(); shake(L.node); say(msg, 'bad', `Aturannya: Ani menyimpan satu bagian dan memberi dua bagian kepada Budi dan Citra (dua orang berikutnya).`); return; }
      if (at.includes(i)) { ctx.mistake(); shake(L.node); say(msg, 'bad', `${SAKU[i][0]} sudah memegang satu bagian Ani. Setiap orang hanya boleh menerima satu bagian.`); return; }
      at[sel] = i; sel = null; ctx.sound.tap(); drawChips();
      if (at.every((x) => x != null)) {
        stage = 1;
        const held = [0, 1, 2, 3, 4].map((h) => BAGI.reduce((s, parts, j) => s + parts.reduce((t, v, k) => t + ((j === 0 ? at[k] : (j + k) % 5) === h ? v : 0), 0), 0));
        held.forEach((v, h) => L.note(h, `📢 ${rp(v)}`));
        say(msg, 'info', 'Yang lain melakukan hal yang sama. Setiap orang mengumumkan jumlah bagian yang ia pegang. Jumlahkan pengumumannya.');
        bar.replaceChildren(button('Σ Jumlahkan pengumuman', () => {
          if (stage !== 1) return; stage = 2; bar.replaceChildren(); ctx.sound.good();
          L.center(`${rp(held.reduce((a, b) => a + b, 0))} ÷ 5 = ${rp(65000)}`);
          say(msg, 'info', `Jumlahnya tetap ${rp(325000)}, rata-rata ${rp(65000)}. Sekarang uji keamanannya: ketuk anggota persekongkolan (boleh 1 sampai 4 orang). Berapa orang yang dibutuhkan untuk membongkar uang saku seseorang?`);
        }, 'primary'));
      }
      return;
    }
    if (stage !== 2) return;
    if (coal.has(i)) coal.delete(i); else coal.add(i);
    ctx.sound.tap(); SAKU.forEach((_, k) => { L.mark(k, 'sekongkol', coal.has(k)); L.mark(k, 'bocor', false); });
    const S = [...coal];
    if (!S.length) return;
    const leak = bocor(S);
    if (!leak.length) { say(msg, 'info', `${S.length} orang bersekongkol (${S.map((k) => SAKU[k][0]).join(', ')}): tidak ada uang saku yang terbongkar.${S.length < 4 ? ' Tambah anggotanya.' : ''}`); return; }
    leak.forEach((k) => L.mark(k, 'bocor'));
    stage = 3;
    say(msg, '', `Baru ${S.length} orang bersekongkol yang bisa membongkar uang saku ${leak.map((k) => SAKU[k][0]).join(', ')}: ${rp(325000)} dikurangi uang saku mereka sendiri. Dengan pembagian rahasia, persekongkolan 1 sampai 3 orang tidak membongkar siapa pun.`);
    done();
  }
  host.append(L.node, chips, bar, msg);
  drawChips();
}

const HEAD22 = {
  akhir: ['Undian Curang', 'Pak Darto bicara paling akhir. Bisakah ia memilih pemenang?'],
  amplop: ['Undian Amplop', 'Kunci semua angka di amplop, buka bersama, hitung pemenangnya.'],
  sekongkol: ['Persekongkolan', 'Lima orang bersekongkol, satu orang jujur. Siapa yang menang?'],
  tangkap: ['Tangkap Pencurang', 'Buka petunjuk, tunjuk pencurang dan triknya.'],
  celah: ['Tutup Celahnya', 'Pasangkan kejadian dengan aturan penutup, lalu pilah sifatnya.'],
  sidik: ['Sidik Digital', 'Mesin sidik sebagai amplop digital: tanpa garam dan dengan garam.'],
  lingkar: ['Rata-rata Rahasia', 'Jalankan kertas melingkar, lalu hitung rata-ratanya.'],
  bocor: ['Kertas yang Bocor', 'Dua orang bersekongkol. Siapa yang terbongkar?'],
  ancam: ['Kartu Ancaman', 'Mana yang dicegah protokol undian, mana yang butuh perlindungan lain?'],
  boss: ['Pembagian Rahasia', 'Pecah uang saku jadi tiga bagian. Berapa orang yang dibutuhkan untuk membongkarnya?'],
};

export default {
  id: 'sma-22-arisan-jujur',
  title: 'Arisan yang Jujur',
  topic: 'Protokol keamanan: undian adil, amplop terkunci (komitmen), fungsi hash dan garam, serta komputasi rahasia bersama',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '✉️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menemukan celah pada undian yang bergantung pada satu orang atau orang terakhir, menghitung undian amplop terkunci dan menunjukkan bahwa persekongkolan tidak berguna selama satu anggota jujur, merumuskan sifat menyembunyikan dan mengikat, memakai sidik dengan garam sebagai amplop digital, menghitung rata-rata rahasia, dan membedakan apa yang bisa dan tidak bisa dilindungi sebuah protokol.',
  extraModes: [
    { id: 'undian', icon: '✉️', label: 'Undian Amplop', desc: '4–6 pemain bergiliran memasukkan angka rahasia; amplop terkunci, lalu dibuka bersama dan pemenang dihitung', create: createDraw },
    { id: 'curang', icon: '🎭', label: 'Coba Curang', desc: 'Atur angka para pencurang dan lihat peluang setiap anggota menang, dengan cara "orang terakhir" dan dengan amplop terkunci', create: createCheat },
    { id: 'sidik', icon: '🔏', label: 'Sidik Digital', desc: 'Mesin sidik rekaan: tebak angka dari sidik tanpa garam dan dengan garam, lalu periksa pembukaan', create: createHash },
    { id: 'rata', icon: '⭕', label: 'Rata-rata Rahasia', desc: 'Simulasi duduk melingkar: lihat kertas yang diterima setiap pemain dan apa yang terbongkar bila dua pemain bersekongkol', create: createRing },
    { id: 'giliran', icon: '🕵️', label: 'Tim Pencurang', desc: 'Satu tim diam-diam memakai satu celah; tim lain menebak celah dan aturan penutupnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act arisan-jujur aj22-main' });
    root.append(wrap);
    const x = ctx.rand.int(0, 5);
    const cheat = { id: ctx.rand.pick(TRIK).id, x, y: (x + ctx.rand.int(1, 5)) % 6 };
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'aj22-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD22[k], '✉️'), area); };
      if (r === 0) { go('akhir', 1); lastRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 1) { go('amplop', 2); envelopeRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 2) { go('sekongkol', 3); conspiracyRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 3) { go('tangkap', 4); catchRound(area, ctx, { cheat, done: () => next(5000) }); }
      else if (r === 4) {
        go('celah', 4);
        pairRound(area, ctx, { left: RULES.map((x) => x[0]), right: RULES.map((x) => x[1]), bad: 'Aturan itu tidak menutup celah kejadian ini.', end: 'Semua celah tertutup.', done: () => setTimeout(() => {
          area.replaceChildren();
          sortRound(area, ctx, { cards: SIFAT, bins: KOTAK_SIFAT, intro: 'Amplop yang baik menyembunyikan (isinya tidak terlihat) dan mengikat (isinya tidak bisa diganti). Trik mana melanggar sifat yang mana? Ketuk trik, lalu kotaknya.', wrong: (c) => (c[1] === 'bukan' ? 'Menolak membuka tidak mengintip dan tidak mengganti angka: itu membatalkan undian.' : c[1] === 'sembunyi' ? 'Mengintip berarti isi amplop terlihat sebelum waktunya.' : 'Trik ini mengganti atau memilih angka setelah amplop dikunci.'), end: 'Intip Amplop melanggar sifat menyembunyikan; Dua Angka dan Tukar Amplop melanggar sifat mengikat; Tolak Buka adalah pembatalan, ditangani aturan "tidak dibuka dianggap 0".', done: () => next(6500) });
        }, 2200) });
      } else if (r === 5) { go('sidik', 5); hashRound(area, ctx, { done: () => next(6500) }); }
      else if (r === 6) { go('lingkar', 6); ringRound(area, ctx, { done: () => next(6500) }); }
      else if (r === 7) { go('bocor', 6); leakRound(area, ctx, { done: () => next(7000) }); }
      else if (r === 8) {
        go('ancam', 7);
        sortRound(area, ctx, { cards: LIMITS.map(([t, yes]) => [t, yes ? 'ya' : 'tidak']), bins: [['ya', '🛡️ Dicegah protokol undian'], ['tidak', '🧰 Butuh perlindungan lain']], intro: 'Ketuk kartu ancaman, lalu kotaknya. Protokol undian hanya mengatur cara memilih pemenang.', wrong: (c) => (c[1] === 'ya' ? 'Inilah celah yang ditutup amplop terkunci.' : 'Protokol undian tidak bisa mencegah ini.'), end: 'Hanya kartu pemilih angka terakhir yang dicegah protokol. Sekarang pasangkan yang lain dengan perlindungannya.', done: () => setTimeout(() => {
          area.replaceChildren();
          const rest = LIMITS.filter((l) => !l[1]);
          pairRound(area, ctx, { left: rest.map((l) => l[0]), right: rest.map((l) => l[2]), tag: 'bcde', bad: 'Perlindungan itu untuk ancaman lain.', end: 'Protokol membuat undian adil, tetapi penipuan, OTP, bukti transfer, dan privasi butuh perlindungan lain.', done: () => next(6500) });
        }, 2600) });
      } else { go('boss', 'Bos'); bossRound(area, ctx, { done: () => next(8000) }); }
    }
    render();
  },
};

function ringSvg(papers, hide = []) {
  const P = [[400, 70], [640, 200], [550, 400], [250, 400], [160, 200]];
  const arrows = P.map(([x1, y1], i) => { const [x2, y2] = P[(i + 1) % 5]; const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2; const t = papers[i]; return `<line x1="${x1 + (x2 - x1) * 0.2}" y1="${y1 + (y2 - y1) * 0.2}" x2="${x1 + (x2 - x1) * 0.8}" y2="${y1 + (y2 - y1) * 0.8}" stroke="#94a3b8" stroke-width="4" marker-end="url(#aw-panah)"/><rect x="${mx - 78}" y="${my - 20}" width="156" height="40" rx="8" fill="${t == null ? '#fff' : '#fef9c3'}" stroke="#ca8a04" stroke-width="2"/><text x="${mx}" y="${my + 8}" font-size="22" font-weight="800" text-anchor="middle" fill="#0f172a">${t == null ? '?' : hide.includes(i) ? '▒▒▒' : num(t)}</text>`; });
  const people = P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="42" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><text x="${x}" y="${y + 8}" font-size="24" font-weight="900" text-anchor="middle" fill="#0c4a6e">${SAKU[i][0]}</text>`);
  return `<svg viewBox="80 10 640 450" role="img" aria-label="Lingkaran kertas"><defs><marker id="aw-panah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#64748b"/></marker></defs>${arrows.join('')}${people.join('')}</svg>`;
}
const ringBox = (papers, hide) => { const b = el('div', { class: 'aw-lingkar' }); b.innerHTML = ringSvg(papers, hide); return b; };

function createDraw(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  const setup = () => {
    let n = 6;
    const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Undian amplop'), el('p', { class: 'reveal info' }, 'Berapa pemain?'), el('div', { class: 'seg' }, [4, 5, 6].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} pemain`), () => { n = x; draw(); }))), el('div', { class: 'kode-baris' }, button('Mulai ➜', () => turn(n, []), 'primary')));
    draw();
  };
  const turn = (n, nums) => {
    if (nums.length === n) {
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Semua amplop terkunci.'), envelopes(nums, false, ANGGOTA), el('div', { class: 'kode-baris' }, button('Buka bersama 📬', () => {
        const w = winner(nums, n); ctx.sound.win();
        wrap.replaceChildren(el('p', { class: 'prompt' }, `Pemenang: ${ANGGOTA[w]} 🎉`), envelopes(nums, true), sumLine(nums, n), el('div', { class: 'kode-baris' }, button('Undian lagi', setup, 'primary')));
      }, 'primary')));
      return;
    }
    const i = nums.length;
    wrap.replaceChildren(el('p', { class: 'prompt' }, `${ANGGOTA[i]}: ketuk angkamu (0–${n - 1}). Pemain lain berpaling!`), envelopes(nums, false), el('div', { class: 'aw-angka' }, Array.from({ length: n }, (_, x) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, x)), () => { ctx.sound.tap(); turn(n, [...nums, x]); }))),
      el('div', { class: 'kode-baris' }, button('🎲 Pilih acak', () => { ctx.sound.tap(); turn(n, [...nums, ctx.rand.int(0, n - 1)]); })));
  };
  setup();
}

function createCheat(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  let mode = 'amplop'; let target = 5; const cheat = [1, 1, 1, 1, 1]; let honest = true;
  const draw = () => {
    // Player 2 (Bu Sari) is honest and random; others are set by the cheaters.
    const prob = Array(6).fill(0);
    if (mode === 'akhir') prob[target] = 1;
    else if (!honest) prob[winner([cheat[0], cheat[1], 1, cheat[2], cheat[3], cheat[4]])] = 1;
    else for (let h = 0; h < 6; h++) prob[winner([cheat[0], cheat[1], h, cheat[2], cheat[3], cheat[4]])] += 1 / 6;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Coba curang'), el('div', { class: 'seg' }, [['amplop', '✉️ Amplop terkunci'], ['akhir', '🗣️ Pak Darto bicara terakhir']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${mode === v ? 'on' : ''}`, type: 'button' }, l), () => { mode = v; draw(); }))),
      mode === 'akhir' ? el('div', { class: 'aw-atur' }, el('span', null, 'Pak Darto ingin yang menang:'), el('div', { class: 'seg' }, ANGGOTA.map((a, i) => onTap(el('button', { class: `seg-btn ${target === i ? 'on' : ''}`, type: 'button' }, a), () => { target = i; draw(); }))))
        : el('div', { class: 'aw-atur' }, ...[0, 1, 3, 4, 5].map((p, j) => el('div', { class: 'aw-atur-baris' }, el('span', null, `${ANGGOTA[p]} (curang)`), el('div', { class: 'seg' }, [0, 1, 2, 3, 4, 5].map((x) => onTap(el('button', { class: `seg-btn ${cheat[j] === x ? 'on' : ''}`, type: 'button' }, x), () => { cheat[j] = x; draw(); }))))), el('div', { class: 'aw-atur-baris' }, el('span', null, 'Bu Sari'), el('div', { class: 'seg' }, [[true, 'jujur, acak 0–5'], [false, 'ikut bersekongkol, menulis 1']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${honest === v ? 'on' : ''}`, type: 'button' }, l), () => { honest = v; draw(); }))))),
      el('div', { class: 'aw-peluang' }, ANGGOTA.map((a, i) => el('div', { class: 'aw-peluang-kol' }, el('small', null, `${Math.round(prob[i] * 100)}%`), el('div', { class: 'aw-peluang-jalur' }, el('i', { style: { height: `${prob[i] * 100}%` } })), el('span', null, a)))),
      el('p', { class: 'reveal info' }, mode === 'akhir' ? 'Orang terakhir yang tahu semua angka bisa memilih pemenang: peluangnya 100%.' : honest ? 'Apa pun angka para pencurang, setiap anggota tetap berpeluang 1/6 selama Bu Sari memilih acak.' : 'Jika semua anggota bersekongkol, mereka memang bisa memilih pemenang; satu anggota jujur sudah cukup untuk mencegahnya.'));
  };
  draw();
}

function createHash(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  const input = el('input', { class: 'aw-masuk', type: 'text', value: SALTED, 'aria-label': 'Teks', autocomplete: 'off', spellcheck: 'false' });
  const out = el('code', { class: 'aw-hasil' });
  const calc = () => { out.textContent = `sidik = ${sidik(input.value)}`; };
  input.addEventListener('input', calc);
  const game = el('div', { class: 'aw-game' });
  const words = ['kursi', 'hijau', 'pelangi', 'meja', 'biru', 'hujan', 'gunung', 'sepeda', 'kopi', 'layang'];
  const newGame = (salt) => {
    const x = ctx.rand.int(0, 5); const s = salt ? `${x}-${ctx.rand.pick(words)}-${ctx.rand.pick(words)}-${ctx.rand.int(10, 99)}` : String(x); const h = sidik(s); const tried = [];
    const drawG = () => game.replaceChildren(el('p', { class: 'aw-catat' }, `Sidik rahasia: ${h} ${salt ? '(dengan garam)' : '(tanpa garam)'}`), el('div', { class: 'seg' }, [0, 1, 2, 3, 4, 5].map((g) => onTap(el('button', { class: `seg-btn ${tried.includes(g) ? 'on' : ''}`, type: 'button' }, `coba ${g}`), () => { if (!tried.includes(g)) tried.push(g); drawG(); }))),
      el('div', { class: 'aw-sidik' }, tried.map((g) => el('code', { class: sidik(String(g)) === h ? 'cocok' : '' }, `${g} → ${sidik(String(g))}`))),
      el('p', { class: 'aw-catat' }, tried.some((g) => sidik(String(g)) === h) ? `Ketemu: angkanya ${tried.find((g) => sidik(String(g)) === h)}.` : salt && tried.length === 6 ? `Tidak ada yang cocok: tanpa tahu garamnya, keenam angka tidak membantu. Teks aslinya ${s}.` : ''));
    drawG();
  };
  wrap.append(el('p', { class: 'prompt' }, 'Mesin sidik rekaan'), el('label', { class: 'aw-label' }, 'Teks', input), out,
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Tebak tanpa garam'), () => newGame(false)), onTap(el('button', { class: 'seg-btn', type: 'button' }, '🧂 Tebak dengan garam'), () => newGame(true))), game);
  calc(); newGame(false);
}

function createRing(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  let r = RAND; let step = 0; let view = null; let duo = false;
  const draw = () => {
    const papers = ring(r);
    const shown = papers.map((p, i) => (i < step ? p : null));
    // A player sees only the paper they received (from the previous person) and the one they wrote.
    const hide = view == null ? (duo ? [4] : []) : papers.map((_, i) => i).filter((i) => i !== view && i !== (view + 4) % 5);
    const box = ringBox(shown, hide);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Rata-rata rahasia'), el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '⏭ Kertas berikutnya'), () => { if (step < 5) { step++; ctx.sound.tap(); draw(); } }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Ulang'), () => { step = 0; draw(); }),
      ...[[RAND, 'Angka acak besar'], [10, 'Angka acak 10']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${r === v ? 'on' : ''}`, type: 'button' }, l), () => { r = v; draw(); }))),
    el('div', { class: 'seg' }, el('span', { class: 'aw-catat' }, 'Lihat sebagai:'), onTap(el('button', { class: `seg-btn ${view == null && !duo ? 'on' : ''}`, type: 'button' }, 'Guru (semua)'), () => { view = null; duo = false; draw(); }), ...SAKU.map(([nm], i) => onTap(el('button', { class: `seg-btn ${view === i ? 'on' : ''}`, type: 'button' }, nm), () => { view = i; duo = false; draw(); })), onTap(el('button', { class: `seg-btn ${duo ? 'on' : ''}`, type: 'button' }, 'Budi + Dodi bersekongkol'), () => { view = null; duo = true; draw(); })),
    box,
    el('p', { class: 'reveal info' }, step < 5 ? `${step} dari 5 kertas berpindah.` : duo ? `Budi memegang ${num(papers[1])} (yang ia tulis) dan Dodi menerima ${num(papers[2])}: selisihnya ${rp(papers[2] - papers[1])} adalah uang saku Citra.` : r === 10 ? `Budi menerima ${num(papers[0])}: hampir pasti uang saku Ani sekitar ${rp(papers[0] - 10)}.` : `Ani: ${num(papers[4])} − ${num(r)} = ${rp(papers[4] - r)}; rata-rata ${rp((papers[4] - r) / 5)}.`));
  };
  draw();
}

const CHEATS = [['akhir', 'Bicara paling akhir setelah tahu semua angka', 'Semua angka dikunci di amplop lalu dibuka bersama'], ['tolak', 'Menolak membuka amplop ketika tahu akan kalah', 'Amplop yang tidak dibuka dianggap 0 atau pemiliknya kehilangan hak menang'], ['tukar', 'Menukar amplop setelah beberapa amplop dibuka', 'Segel ditandatangani dan amplop dipegang bersama di tengah meja'], ['tipis', 'Mengintip amplop tipis orang lain sebelum menulis', 'Amplop tebal atau kertas dilipat sampai tidak tembus pandang']];
const STORY = {
  akhir: (w) => [`Undian lewat grup: lima anggota menyebut angka satu per satu.`, `Anggota terakhir menunggu lama, lalu menyebut angkanya.`, `Pemenangnya ${w}, sahabat anggota terakhir.`],
  tolak: (w) => ['Lima amplop sudah dibuka bergiliran.', 'Satu anggota tiba-tiba berkata, "Amplop saya ketinggalan di rumah, undian diulang saja."', `Jika dihitung tanpa amplopnya, pemenangnya ${w}.`],
  tukar: (w) => ['Amplop dibuka satu per satu oleh pemiliknya.', 'Seorang anggota keluar sebentar mengambil minum dengan amplop di saku.', `Saat amplopnya dibuka, angkanya tepat membuat ${w} menang.`],
  tipis: (w) => ['Amplop dikumpulkan di atas meja dekat jendela yang terang.', 'Seorang anggota menulis paling lambat sambil memandangi amplop lain.', `Hasilnya ${w} menang dengan angka yang "pas sekali".`],
};
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const turns = nT * 2;
    function secret() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Tim Pencurang selesai', pts, again: () => pickTeams(wrap, 'Tim Pencurang', start) }); return; }
      const a = k % nT; const b = (k + 1) % nT;
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1} diam-diam memilih celah yang dipakai. Tim ${b + 1} berpaling!`),
        el('div', { class: 'opts', style: { '--cols': 2 } }, CHEATS.map(([id, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), () => { ctx.sound.tap(); guess(id, b); }))));
    }
    function guess(id, b) {
      const story = STORY[id](ctx.rand.pick(ANGGOTA));
      let stage = 0; let got = 0;
      const msg = el('p', { class: 'reveal hint' });
      const area = el('div');
      const askCheat = () => area.replaceChildren(el('p', { class: 'aw-catat' }, 'Celah apa yang dipakai?'), el('div', { class: 'opts', style: { '--cols': 2 } }, CHEATS.map(([c, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), (e) => {
        if (stage !== 0) return; stage = 1; const ok = c === id; if (ok) got++; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        say(msg, ok ? '' : 'bad', ok ? 'Celahnya tepat.' : `Celahnya: ${CHEATS.find((x) => x[0] === id)[1].toLowerCase()}.`); setTimeout(askRule, 1400);
      }))));
      const askRule = () => area.replaceChildren(el('p', { class: 'aw-catat' }, 'Aturan apa yang menutupnya?'), el('div', { class: 'opts', style: { '--cols': 2 } }, ctx.rand.shuffle(CHEATS.slice()).map(([c, , rule]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, rule)), (e) => {
        if (stage !== 1) return; stage = 2; const ok = c === id; if (ok) got++; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        pts[b] += got; say(msg, got ? '' : 'bad', `Tim ${b + 1} mendapat ${got} poin. Aturan penutupnya: ${CHEATS.find((x) => x[0] === id)[2].toLowerCase()}.`);
        k++; setTimeout(secret, 3000);
      }))));
      wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1}: apa yang terjadi di arisan bulan ini?`), el('ol', { class: 'aw-cerita' }, story.map((s) => el('li', null, s))), area, msg);
      askCheat();
    }
    secret();
  }
  pickTeams(wrap, 'Tim Pencurang', start);
}
