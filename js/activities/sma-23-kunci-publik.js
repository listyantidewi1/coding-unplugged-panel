// Gembok yang Dibagikan — SMA/SMK (16–18 tahun), kriptografi kunci publik.
// A box with two padlocks, agreeing on a key in public (Diffie–Hellman with
// p = 23, g = 5), mini RSA with n = 55, digital signatures, why the numbers
// must be huge, and the person in the middle.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead } from './misi-kit.js';

export const P = 23; export const G = 5;
export const RSA = { n: 55, e: 3, d: 27 };
export const BIG_P = 999999999989n;
const num = (x) => Number(x).toLocaleString('id-ID');
const sup = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

export function modpow(b, e, m) { let r = 1n; let x = BigInt(b) % BigInt(m); let k = BigInt(e); const M = BigInt(m); while (k > 0n) { if (k & 1n) r = (r * x) % M; x = (x * x) % M; k >>= 1n; } return Number(r); }
// Square-and-multiply steps: squares b^(2^i), then the product over the set bits.
export function steps(b, e, m) {
  const out = []; let x = b % m; let p = 1;
  const sq = [[1, x]];
  while (p * 2 <= e) { const y = (x * x) % m; out.push({ text: p === 1 ? `${b}² = ${num(x * x)}` : `${b}${sup(p * 2)} → ${x}² = ${num(x * x)}`, val: y }); x = y; p *= 2; sq.push([p, x]); }
  const parts = sq.filter(([q]) => e & q).reverse();
  let acc = parts[0][1]; let label = `${b}${sup(parts[0][0])}`;
  for (const [q, v] of parts.slice(1)) { const prod = acc * v; label += ` × ${b}${sup(q)}`; out.push({ text: `${label} → ${acc} × ${v} = ${num(prod)}`, val: prod % m }); acc = prod % m; }
  return { steps: out, result: acc };
}
export const POWERS = Array.from({ length: 22 }, (_, i) => modpow(G, i + 1, P));
export const BOX = [['Nadia memasukkan surat dan mengunci kotak dengan gemboknya.', 0, ['N']], ['Kurir membawa kotak bergembok Nadia kepada Fajar.', 2, ['N']], ['Fajar menambahkan gemboknya sendiri, lalu mengirim kotak kembali ke Nadia.', 1, ['N', 'F']], ['Nadia membuka gemboknya sendiri, lalu mengirim kotak yang kini hanya bergembok Fajar.', 1, ['F']], ['Fajar membuka gemboknya sendiri dan membaca surat.', 2, []]];

// --- pieces ---
function numPad(onEnter, { max = 4 } = {}) {
  let v = '';
  const disp = el('span', { class: 'kp-layar' }, '…');
  const set = (x) => { v = x; disp.textContent = v || '…'; };
  const pad = el('div', { class: 'kp-pad gp23-pad' }, disp, el('div', { class: 'kp-tombol' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => onTap(el('button', { class: `kp-t ${k === 'OK' ? 'ok' : ''}`, type: 'button', 'data-k': k }, k), () => {
    if (k === '⌫') set(v.slice(0, -1)); else if (k === 'OK') { if (v) { const x = Number(v); set(''); onEnter(x); } } else if (v.length < max) set(v + k);
  }))));
  return pad;
}

function boxTrack(state) {
  const [pos, locks] = state ?? [0, []];
  return el('div', { class: 'kp-jalur gp23-jalur' }, ...['Nadia', 'Kurir 👀', 'Fajar'].map((n, i) => el('div', { class: `kp-pos ${i === pos ? 'ada' : ''}` }, el('b', null, n), i === pos ? el('div', { class: 'kp-kotak' }, locks.length ? '📦' : '📬', ...locks.map((l) => el('span', { class: `kp-gembok ${l}` }, l === 'N' ? '🔒N' : '🔒F'))) : el('div', { class: 'kp-kosong' }))));
}
function boxRound(host, ctx, { done }) {
  const cards = ctx.rand.shuffle(BOX.map((b, i) => [i, b[0]]));
  let k = 0;
  const track = el('div', { class: 'gp23-lebar' });
  const box = el('div', { class: 'kp-kartu-kartu gp23-kartu-kartu' });
  const msg = el('p', { class: 'reveal info' }, 'Nadia ingin mengirim surat rahasia lewat kurir yang suka mengintip. Mereka tidak punya anak kunci yang sama. Ketuk langkahnya sesuai urutan.');
  const draw = () => {
    track.replaceChildren(boxTrack(k ? [BOX[k - 1][1], BOX[k - 1][2]] : null));
    box.replaceChildren(...cards.map(([i, t]) => onTap(el('button', { class: `kp-kartu ${i < k ? 'pakai' : ''}`, type: 'button', 'data-i': i }, i < k ? `${i + 1}. ${t}` : t), () => {
      if (i < k) return;
      if (i !== k) { ctx.mistake(); shake(box); say(msg, 'bad', k === 0 ? 'Kotak harus dikunci dulu sebelum diserahkan ke kurir.' : 'Belum saatnya. Di mana kotak sekarang, dan gembok siapa yang terpasang?'); return; }
      k++; ctx.sound.tap(); draw();
      if (k === BOX.length) { say(msg, '', 'Selama di tangan kurir, kotak selalu terkunci oleh paling sedikit satu gembok, dan anak kunci tidak pernah dikirim. Inilah gagasan kunci publik.'); done(); }
    })));
  };
  host.append(track, box, msg);
  draw();
}

// The 5^k mod 23 table; cells can be tapped.
function powerGrid({ onCell = null, mark = [], upto = 22, kini = null } = {}) {
  return el('div', { class: 'kp-tabel kecil gp23-tabel' }, ...[[1, 11], [12, 22]].map(([a, b]) => el('div', { class: 'kp-tabel-baris' }, el('b', null, 'k'),
    ...Array.from({ length: b - a + 1 }, (_, i) => el('span', { class: 'kepala' }, a + i)), el('b', null, '5ᵏ mod 23'),
    ...Array.from({ length: b - a + 1 }, (_, i) => { const k = a + i; const txt = k <= upto ? POWERS[k - 1] : k === kini ? '?' : ''; const cls = `${mark.includes(k) ? 'tanda' : ''} ${k === kini ? 'kini' : ''}`; return onCell && k <= upto ? onTap(el('button', { class: `gp23-sel ${cls}`, type: 'button', 'data-k': k }, txt), () => onCell(k)) : el('span', { class: cls }, txt); }))));
}
const papan = (nadia = '?', fajar = '?', extra = {}) => el('div', { class: 'kp-papan gp23-papan' }, el('b', null, '📌 Papan umum'), el('span', null, `p = ${P}, g = ${G}`), el('span', { class: extra.n || '' }, `Nadia: ${nadia}`), el('span', { class: extra.f || '' }, `Fajar: ${fajar}`));

// Mission 2a: fill the table, then post 5^6 and 5^9.
function tableRound(host, ctx, { from = 5, to = 11, done }) {
  let k = from;
  const box = el('div', { class: 'gp23-lebar' });
  const side = el('div', { class: 'gp23-sisi' });
  const msg = el('p', { class: 'reveal info' }, 'Setiap kotak = kotak sebelumnya × 5, lalu ambil sisa bagi 23. Isi dengan papan angka.');
  const pad = numPad((x) => {
    const want = POWERS[k - 1];
    if (x !== want) { ctx.mistake(); shake(box); say(msg, 'bad', `${POWERS[k - 2]} × 5 = ${POWERS[k - 2] * 5}; berapa sisanya bila dibagi 23?`); return; }
    ctx.sound.tap(); k++;
    if (k > to) { pad.remove(); post(); return; }
    say(msg, 'info', `5${sup(k - 1)} → ${want}`); draw();
  }, { max: 2 });
  const draw = () => box.replaceChildren(powerGrid({ upto: k - 1, kini: k }));
  host.append(el('div', { class: 'gp23-dua' }, box, side), msg);
  side.append(pad);
  draw();
  function post() {
    const posted = [null, null]; const want = [6, 9]; let w = 0;
    say(msg, 'info', 'Tabel lengkap: setiap angka 1–22 muncul tepat sekali. Nadia memilih angka rahasia 6. Ketuk kotak 5⁶ untuk ditempel di papan.');
    const drawP = () => { box.replaceChildren(powerGrid({ onCell: tap, mark: want.slice(0, w) })); side.replaceChildren(papan(posted[0] ?? '?', posted[1] ?? '?')); };
    function tap(kk) {
      if (w >= 2) return;
      if (kk !== want[w]) { ctx.mistake(); shake(box); say(msg, 'bad', `Angka rahasia ${w ? 'Fajar 9' : 'Nadia 6'}: cari kolom k = ${want[w]}.`); return; }
      posted[w] = POWERS[kk - 1]; w++; ctx.sound.tap(); drawP();
      if (w === 1) say(msg, 'info', 'Nadia menempel 8. Fajar memilih angka rahasia 9. Ketuk kotaknya.');
      else { say(msg, '', 'Papan umum kini memuat 8 dan 11. Angka rahasia 6 dan 9 tidak pernah ditempel.'); done(); }
    }
    drawP();
  }
}

// Square-and-multiply step by step with the keypad.
function stepRound(host, ctx, { b, e, m, intro, done, after = '' }) {
  const { steps: S, result } = steps(b, e, m);
  let k = 0;
  const list = el('div', { class: 'kp-langkah gp23-langkah' });
  const msg = el('p', { class: 'reveal info' }, intro);
  const draw = () => list.replaceChildren(...S.map((s, i) => el('div', { class: `kp-l ${i === k ? 'kini' : i < k ? 'isi' : ''}` }, el('span', null, i <= k ? s.text : '…'), el('b', null, i < k ? `sisa ${s.val}` : i === k ? 'sisa ?' : ''))));
  const pad = numPad((x) => {
    if (x !== S[k].val) { ctx.mistake(); shake(list); say(msg, 'bad', `Bagi dengan ${m} dan ambil sisanya.`); return; }
    k++; ctx.sound.tap(); draw();
    if (k === S.length) { pad.remove(); say(msg, '', `${b}${sup(e)} mod ${m} = ${result}. ${after}`); done(result); }
  }, { max: 3 });
  host.append(el('div', { class: 'gp23-dua' }, list, pad), msg);
  draw();
}

// Mission 2c: Rudi only sees the board.
function rudiRound(host, ctx, { done }) {
  const found = {}; let stage = 0;
  const box = el('div', { class: 'gp23-lebar' });
  const side = el('div', { class: 'gp23-sisi' });
  const msg = el('p', { class: 'reveal info' }, 'Kamu Tim Rudi. Kamu hanya melihat papan: 8 dan 11. Cari angka 8 di baris bawah tabel: kolomnya adalah angka rahasia Nadia.');
  const want = [8, 11];
  const draw = () => { box.replaceChildren(powerGrid({ onCell: tap, mark: Object.values(found) })); side.replaceChildren(papan(8, 11), el('div', { class: 'gp23-catat' }, `Rahasia Nadia: ${found[8] ?? '?'}`), el('div', { class: 'gp23-catat' }, `Rahasia Fajar: ${found[11] ?? '?'}`)); };
  function tap(k) {
    if (stage) return;
    const v = want[Object.keys(found).length];
    if (POWERS[k - 1] !== v) { ctx.mistake(); shake(box); say(msg, 'bad', `Di kolom ${k} isinya ${POWERS[k - 1]}, bukan ${v}.`); return; }
    found[v] = k; ctx.sound.tap(); draw();
    if (Object.keys(found).length === 1) { say(msg, 'info', 'Rahasia Nadia 6! Sekarang cari 11.'); return; }
    stage = 1;
    say(msg, 'info', `Rahasia Fajar 9. Rudi menghitung 11⁶ mod 23 = ${modpow(11, 6, 23)}: kunci bersama terbongkar. Sekarang p diganti ${num(Number(BIG_P))}. Coba tebak.`);
    let tries = 0;
    side.append(el('div', { class: 'gp23-besar' }, el('b', null, `p = ${num(Number(BIG_P))}`), el('span', null, 'Tabelnya hampir satu triliun kotak. Tempelan Nadia:'), el('code', null, modpowBig(5n, 123456789n, BIG_P).toLocaleString('id-ID')), button('🎲 Tebak angka rahasia', (e) => {
      tries++; const g = BigInt(ctx.rand.int(2, 999999999)); const v = modpowBig(5n, g, BIG_P);
      side.querySelector('.gp23-besar').append(el('small', null, `5^${g.toLocaleString('id-ID')} → ${v.toLocaleString('id-ID')} ✗`));
      if (tries >= 3) { e?.currentTarget?.remove?.(); side.querySelector('.gp23-besar .btn')?.remove(); say(msg, '', 'Tiga tebakan, tiga kali meleset. Dengan p ratusan digit, tabelnya lebih besar dari banyak atom di alam semesta: menebak tidak mungkin.'); done(); }
    }, 'primary')));
  }
  host.append(el('div', { class: 'gp23-dua' }, box, side), msg);
  draw();
}

// Mission 3a: a paper multiplier: × m, then take the remainder mod n.
function mulMachine(host, ctx, { m, e, n, who, done }) {
  let cur = 1; let used = 0; const hist = ['1'];
  const disp = el('div', { class: 'gp23-layar' });
  const log = el('div', { class: 'gp23-log' });
  const msg = el('p', { class: 'reveal info' }, `${who} mengirim ${m} kepada Nadia dengan kunci publik (n = ${n}, e = ${e}): kalikan ${m} sebanyak ${e} kali, dan ambil sisa bagi ${n} setiap kali angkanya ${n} atau lebih.`);
  const draw = () => { disp.textContent = num(cur); log.replaceChildren(...hist.map((h) => el('code', null, h))); };
  const bar = el('div', { class: 'gp23-tombol' }, button(`× ${m}`, () => {
    if (used >= e) return;
    if (cur >= n) { ctx.mistake(); shake(bar); say(msg, 'bad', `${num(cur)} sudah ${n} atau lebih. Ambil sisa bagi ${n} dulu supaya angkanya tetap kecil.`); return; }
    cur *= m; used++; hist.push(`× ${m} = ${num(cur)}`); ctx.sound.tap(); draw(); fin();
  }, 'gp23-kali'), button(`sisa bagi ${n}`, () => {
    if (cur < n) { say(msg, 'info', `${cur} sudah lebih kecil dari ${n}.`); return; }
    cur %= n; hist.push(`sisa ${cur}`); ctx.sound.tap(); draw(); fin();
  }, 'gp23-mod'));
  function fin() {
    if (used === e && cur < n) { bar.remove(); ctx.sound.good(); say(msg, '', `Sandi ${m}: ${cur}. Penyadap melihat ${cur}, tetapi tanpa kunci privat tidak bisa kembali ke ${m}.`); done(cur); }
  }
  host.append(el('div', { class: 'gp23-mesin' }, el('b', null, `🔐 ${m}${sup(e)} mod ${n}`), disp), bar, log, msg);
  draw();
}

// Trial division by primes in order.
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
function factorRound(host, ctx, { n, intro, done }) {
  const tried = [];
  const box = el('div', { class: 'kp-faktor gp23-faktor' });
  const msg = el('p', { class: 'reveal info' }, intro);
  const draw = () => box.replaceChildren(el('div', { class: 'seg' }, PRIMES.filter((p) => p * p <= n || n % p === 0 || p <= 7).map((p) => onTap(el('button', { class: `seg-btn ${tried.includes(p) ? (n % p ? 'on' : 'kena') : ''}`, type: 'button', 'data-p': p }, p), () => {
    if (tried.includes(p) || tried.some((q) => n % q === 0)) return;
    const next = PRIMES.find((q) => !tried.includes(q));
    if (p !== next) { ctx.mistake(); shake(box); say(msg, 'bad', `Coba berurutan: ${next} dulu.`); return; }
    tried.push(p); ctx.sound.tap(); draw();
    if (n % p === 0) done(p, tried.length); else say(msg, 'info', `${num(n)} : ${p} = ${Math.floor(n / p)} sisa ${n % p}`);
  }))), el('div', { class: 'kp-coba' }, tried.map((p) => el('code', { class: n % p ? '' : 'cocok' }, `: ${p} → sisa ${n % p}`))));
  host.append(box, msg);
  draw();
  return msg;
}

// Mission 3c: Rudi breaks the mini key: factor 55, then search d.
function breakRound(host, ctx, { done }) {
  const step = el('div', { class: 'gp23-langkah2' });
  host.append(step);
  const msg = factorRound(step, ctx, { n: 55, intro: 'Rudi tahu kunci publik n = 55, e = 3. Langkah 1: faktorkan 55. Coba bagi dengan bilangan prima berurutan.', done: (p) => {
    say(msg, 'info', `55 = ${p} × ${55 / p}. Langkah 2: (${p} − 1) × (${55 / p} − 1) = 40. Langkah 3: cari d sehingga 3 × d bersisa 1 bila dibagi 40. Ketuk calon d.`);
    const grid = el('div', { class: 'gp23-d' });
    const tried = new Set(); let fin = false;
    const drawD = () => grid.replaceChildren(...Array.from({ length: 39 }, (_, i) => i + 1).map((d) => onTap(el('button', { class: `gp23-dbtn ${tried.has(d) ? ((3 * d) % 40 === 1 ? 'kena' : 'on') : ''}`, type: 'button', 'data-d': d }, tried.has(d) ? `${d}: ${(3 * d) % 40}` : d), () => {
      if (fin || tried.has(d)) return;
      tried.add(d); ctx.sound.tap(); drawD();
      if ((3 * d) % 40 === 1) { fin = true; say(msg, '', `3 × 27 = 81, sisa bagi 40 = 1. Rudi menemukan kunci privat d = 27! Keamanan RSA bergantung pada sulitnya memfaktorkan n yang sangat besar.`); done(); }
      else say(msg, 'info', `3 × ${d} = ${3 * d}, sisa bagi 40 = ${(3 * d) % 40}. Belum 1.`);
    })));
    step.insertBefore(grid, msg); drawD();
  } });
}

function sigRound(host, ctx, { done }) {
  const cases = [[7, 28], [9, 30]]; const res = {}; const shown = {};
  const box = el('div', { class: 'kp-ttd gp23-ttd' });
  const msg = el('p', { class: 'reveal info' }, 'Dua pengumuman "dari Nadia" tertempel. Periksa dengan kunci publik Nadia (n = 55, e = 3): tanda tangan³ mod 55 harus sama dengan kode rapat.');
  const draw = () => box.replaceChildren(...cases.map(([code, sig], i) => { const v = modpow(sig, 3, 55); const ok = v === code; return el('div', { class: `kp-kasus ${i in res ? 'beres' : ''}`, 'data-c': i }, el('b', null, `📜 "Kode rapat ${code}" · ttd ${sig}`),
    shown[i] ? el('code', { class: ok ? 'cocok' : 'beda' }, `${sig}³ = ${num(sig ** 3)} → sisa ${v}`) : onTap(el('button', { class: 'seg-btn gp23-periksa', type: 'button' }, '🔍 Periksa'), () => { shown[i] = true; ctx.sound.tap(); draw(); }),
    i in res ? el('span', { class: `gp23-cap ${ok ? 'sah' : 'palsu'}` }, ok ? 'SAH' : 'PALSU') : el('div', { class: 'seg' }, [[true, '✅ Sah'], [false, '❌ Palsu']].map(([v2, l]) => onTap(el('button', { class: 'seg-btn gp23-vonis', type: 'button' }, l), () => {
      if (!shown[i]) { shake(box); say(msg, 'bad', 'Periksa dulu dengan kunci publik.'); return; }
      if (v2 !== ok) { ctx.mistake(); shake(box); say(msg, 'bad', `Bandingkan ${v} dengan kode rapat ${code}.`); return; }
      res[i] = v2; ctx.sound.tap(); draw();
      if (Object.keys(res).length === cases.length) { say(msg, 'info', 'Tanda tangan 28 sah. Tanda tangan 30 palsu: hasilnya 50, bukan 9 (yang sah untuk 9 adalah 4).'); done(); }
    })))); }));
  host.append(box, msg);
  draw();
}

export const KUNCI_TUGAS = [['Fajar menyandikan pesan rahasia untuk Nadia', 'pub'], ['Nadia membuka pesan rahasia itu', 'priv'], ['Nadia menandatangani kode rapat', 'priv'], ['Siapa pun memeriksa tanda tangan Nadia', 'pub']];
function keySort(host, ctx, { done }) {
  const order = ctx.rand.shuffle(KUNCI_TUGAS.map((_, i) => i)); const placed = {}; let sel = null;
  const tray = el('div', { class: 'gp23-baki' });
  const bins = el('div', { class: 'gp23-wadah' });
  const msg = el('p', { class: 'reveal info' }, 'Kunci mana yang dipakai? Ketuk kartu tugas, lalu kotak kuncinya.');
  const draw = () => {
    tray.replaceChildren(...order.filter((i) => !(i in placed)).map((i) => onTap(el('button', { class: `gp23-kartu ${sel === i ? 'pilih' : ''}`, type: 'button', 'data-k': i }, KUNCI_TUGAS[i][0]), () => { sel = i; ctx.sound.tap(); draw(); })));
    bins.replaceChildren(...[['pub', '🔓 Kunci publik Nadia (55, 3)'], ['priv', '🗝️ Kunci privat Nadia (27)']].map(([id, label]) => onTap(el('div', { class: 'gp23-kotak', role: 'button', tabindex: 0, 'data-b': id }, el('b', null, label), ...Object.entries(placed).filter(([, b]) => b === id).map(([i]) => el('span', null, KUNCI_TUGAS[i][0]))), () => {
      if (sel == null) { say(msg, 'info', 'Ketuk kartunya dulu.'); return; }
      if (KUNCI_TUGAS[sel][1] !== id) { ctx.mistake(); shake(bins); say(msg, 'bad', id === 'pub' ? 'Kunci publik dimiliki semua orang. Kalau ini bisa dilakukan siapa saja, apa gunanya?' : 'Kunci privat hanya dipegang Nadia.'); return; }
      placed[sel] = id; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(placed).length === KUNCI_TUGAS.length) { say(msg, '', 'Publik untuk menyandikan dan memeriksa; privat untuk membuka dan menandatangani.'); done(); }
    })));
  };
  host.append(tray, bins, msg);
  draw();
}

// Mission 5b: how long would trial division take for n with d digits?
function scaleRound(host, ctx, { done }) {
  const UMUR = 4.4e17; let fin = false;
  const out = el('div', { class: 'gp23-skala' });
  const msg = el('p', { class: 'reveal info' }, 'Komputer cepat mencoba 10¹² pembagian per detik. Coba ukuran n yang lain: berapa lama mencoba semua prima sampai √n? Kunci perbankan memakai n sekitar 617 digit.');
  const fmt = (lg) => (lg < 0 ? 'kurang dari sedetik' : lg < 4 ? `${num(Math.round(10 ** lg))} detik` : `10${sup(Math.round(lg))} detik`);
  const pick = (d) => {
    const lg = d / 2 - 12; ctx.sound.tap();
    const ratio = lg - Math.log10(UMUR);
    out.replaceChildren(el('b', null, `n ${num(d)} digit`), el('span', null, `√n ≈ 10${sup(d / 2)}, waktu ≈ ${fmt(lg)}`), el('span', null, ratio > 0 ? `≈ 10${sup(Math.round(ratio))} kali umur alam semesta (4,4 × 10¹⁷ detik)` : lg > 7.5 ? `≈ ${num(Math.round(10 ** lg / 3.15e7))} tahun` : 'masih bisa ditunggu'));
    out.className = `gp23-skala ${ratio > 0 ? 'mustahil' : ''}`;
    if (d >= 600 && !fin) { fin = true; say(msg, '', 'Untuk n 617 digit: 10³⁰⁸ ÷ 10¹² = 10²⁹⁶ detik, kira-kira 2,3 × 10²⁷⁸ kali umur alam semesta. Mengalikan dua prima itu mudah, memfaktorkan hasilnya hampir mustahil.'); done(); }
  };
  host.append(el('div', { class: 'gp23-tombol' }, el('small', null, 'Ukuran n:'), ...[4, 24, 40, 100, 617].map((d) => button(`${d} digit`, () => pick(d), 'gp23-digit'))), out, msg);
}

// Boss: Rudi swaps both posted numbers for 10 (his secret 3).
function mitmRound(host, ctx, { done }) {
  let stage = 0; const swapped = { n: false, f: false };
  const board = el('div');
  const keys = el('div', { class: 'gp23-kunci-kunci' });
  const bar = el('div', { class: 'gp23-tombol' });
  const msg = el('p', { class: 'reveal info' }, 'Kamu Tim Rudi lagi, kali ini lebih licik. Rudi memilih rahasia 3 dan menempel 5³ mod 23 = 10. Ketuk tempelan Nadia dan Fajar untuk menukarnya dengan 10.');
  const drawB = () => board.replaceChildren(el('div', { class: 'kp-papan gp23-papan' }, el('b', null, '📌 Papan umum'), el('span', null, `p = ${P}, g = ${G}`),
    ...[['n', 'Nadia', 8], ['f', 'Fajar', 11]].map(([id, nm, v]) => onTap(el('button', { class: `gp23-tempel ${swapped[id] ? 'tukar' : ''} ${stage === 3 ? 'ditolak' : ''}`, type: 'button', 'data-id': id }, `${nm}: ${swapped[id] ? '10 (dari Rudi)' : v}`), () => {
      if (stage !== 0 || swapped[id]) return;
      swapped[id] = true; ctx.sound.tap(); drawB();
      if (swapped.n && swapped.f) compute();
    }))));
  const lock = (who, how, val, side) => el('button', { class: 'gp23-gembok', type: 'button', 'data-v': val, 'data-s': side }, el('b', null, who), el('small', null, how), el('code', null, `🔑 ${val}`));
  let sel = null; const paired = new Set();
  function compute() {
    stage = 1;
    const L = [lock('Nadia', 'menerima 10: 10⁶ mod 23', modpow(10, 6, 23), 'k'), lock('Fajar', 'menerima 10: 10⁹ mod 23', modpow(10, 9, 23), 'k'), lock('Rudi', 'pakai 8 Nadia: 8³ mod 23', modpow(8, 3, 23), 'r'), lock('Rudi', 'pakai 11 Fajar: 11³ mod 23', modpow(11, 3, 23), 'r')];
    L.forEach((b) => onTap(b, () => {
      if (stage !== 1 || paired.has(b)) return;
      if (!sel) { sel = b; b.classList.add('pilih'); ctx.sound.tap(); return; }
      if (sel === b) { sel.classList.remove('pilih'); sel = null; return; }
      if (sel.dataset.s === b.dataset.s || sel.dataset.v !== b.dataset.v) { ctx.mistake(); shake(keys); say(msg, 'bad', 'Pasangkan kunci Nadia atau Fajar dengan kunci Rudi yang angkanya sama.'); sel.classList.remove('pilih'); sel = null; return; }
      [sel, b].forEach((x) => { x.classList.remove('pilih'); x.classList.add('cocok'); paired.add(x); }); sel = null; ctx.sound.tap();
      if (paired.size === 4) fix();
    }));
    keys.replaceChildren(...L);
    say(msg, 'info', 'Nadia dan Fajar mengira sudah berbagi kunci. Ketuk dua kunci yang sama untuk memasangkannya.');
  }
  function fix() {
    stage = 2;
    say(msg, 'info', 'Nadia berbagi kunci 6 dengan Rudi, Fajar berbagi kunci 20 dengan Rudi. Rudi bisa membaca dan mengubah semua pesan tanpa ketahuan. Apa penangkalnya?');
    bar.replaceChildren(...ctx.rand.shuffle([['✍️ Tempelan ditandatangani kunci privat pemiliknya (sertifikat)', true], ['📏 Pakai p yang lebih besar', false], ['📌 Tempel angka dua kali', false]]).map(([l, ok]) => button(l, () => {
      if (stage !== 2) return;
      if (!ok) { ctx.mistake(); shake(bar); say(msg, 'bad', 'Rudi tidak perlu menebak rahasia apa pun; ia cukup menukar tempelan. Yang perlu dicegah adalah tempelan palsu.'); return; }
      stage = 3; bar.replaceChildren(); drawB(); ctx.sound.good();
      say(msg, '', 'Dengan tanda tangan, tempelan 10 milik Rudi tidak punya tanda tangan sah Nadia atau Fajar, jadi langsung ditolak. Inilah tugas sertifikat pada HTTPS.'); done();
    }, 'gp23-pilihan')));
  }
  host.append(el('div', { class: 'gp23-dua' }, board, keys), bar, msg);
  drawB();
}

const HEAD23 = {
  kotak: ['Kotak Dua Gembok', 'Kirim surat rahasia tanpa pernah mengirim anak kunci.'],
  tabel: ['Kunci di Papan Umum', 'Lengkapi tabel 5ᵏ mod 23, lalu tempel angka di papan.'],
  bersama: ['Kunci Bersama', 'Nadia dan Fajar menghitung kunci yang sama tanpa menempelnya.'],
  rudi: ['Tim Rudi Mengintip', 'Hanya melihat papan: bisakah Rudi menemukan rahasia?'],
  rsa: ['RSA Mini: Kirim', 'Sandikan angka dengan kunci publik Nadia.'],
  buka: ['RSA Mini: Buka', 'Nadia membuka sandi 17 dengan kunci privatnya.'],
  bongkar: ['Rudi Membongkar 55', 'Faktorkan n, lalu cari kunci privat d.'],
  ttd: ['Asli atau Palsu?', 'Periksa tanda tangan, lalu pilah tugas kunci publik dan privat.'],
  faktor: ['Lomba Faktor', 'Faktorkan 2.491, lalu bayangkan n 617 digit.'],
  boss: ['Rudi di Tengah', 'Rudi menukar tempelan di papan. Apa akibatnya, dan apa penangkalnya?'],
};

export default {
  id: 'sma-23-kunci-publik',
  title: 'Gembok yang Dibagikan',
  topic: 'Kriptografi kunci publik: pertukaran kunci Diffie–Hellman, RSA mini, tanda tangan digital, dan penyusup di tengah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔐',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjelaskan gagasan kotak dua gembok dan kunci publik, menghitung sisa bagi pangkat dengan kuadrat berulang, menyepakati kunci rahasia di depan umum, menyandikan dan membuka pesan dengan RSA mini, memeriksa tanda tangan digital, dan menjelaskan mengapa bilangannya harus sangat besar serta bahaya penyusup di tengah.',
  extraModes: [
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Pangkat Modular', desc: 'Masukkan bilangan pokok, pangkat, dan pembagi; lihat langkah kuadrat berulang dan sisa bagi setiap langkah', create: createCalc },
    { id: 'tukar', icon: '🤝', label: 'Pertukaran Kunci', desc: 'Dua pemain memilih angka rahasia di sisi masing-masing; papan umum hanya menampilkan p, g, dan angka yang ditukar', create: createSwap },
    { id: 'rsa', icon: '✍️', label: 'RSA Mini', desc: 'Kirim angka dengan kunci publik, buka dengan kunci privat, buat dan periksa tanda tangan digital', create: createRsa },
    { id: 'giliran', icon: '🕵️', label: 'Rudi Menebak', desc: 'Satu tim memilih angka rahasia, tim lain menjadi Rudi yang menebaknya dari papan umum; dengan p = 23 mudah, dengan p 12 digit tidak mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kunci-publik gp23-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'gp23-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD23[k], '🔐'), area); };
      const later = (fn, ms = 2600) => () => setTimeout(() => { area.replaceChildren(); fn(); }, ms);
      if (r === 0) { go('kotak', 1); boxRound(area, ctx, { done: () => next(6000) }); }
      else if (r === 1) { go('tabel', 2); tableRound(area, ctx, { done: () => next(5000) }); }
      else if (r === 2) {
        go('bersama', 2);
        stepRound(area, ctx, { b: 11, e: 6, m: 23, intro: 'Nadia mengambil 11 (tempelan Fajar) dan memangkatkannya dengan rahasianya 6. Ambil sisa bagi 23 setelah setiap perkalian.', after: 'Kunci Nadia 9.', done: later(() => stepRound(area, ctx, { b: 8, e: 9, m: 23, intro: 'Fajar mengambil 8 (tempelan Nadia) dan memangkatkannya dengan rahasianya 9.', after: 'Kunci Fajar juga 9, padahal angka 9 tidak pernah ditempel di papan.', done: () => next(5500) })) });
      } else if (r === 3) { go('rudi', 2); rudiRound(area, ctx, { done: () => next(6500) }); }
      else if (r === 4) { go('rsa', 3); mulMachine(area, ctx, { m: 14, e: 3, n: 55, who: 'Fajar', done: later(() => mulMachine(area, ctx, { m: 8, e: 3, n: 55, who: 'Raka', done: () => next(5500) })) }); }
      else if (r === 5) { go('buka', 3); stepRound(area, ctx, { b: 17, e: 27, m: 55, intro: 'Nadia menerima sandi 17 dan membukanya dengan kunci privat d = 27 (27 = 16 + 8 + 2 + 1): kuadratkan berulang, lalu kalikan.', after: 'Pesan aslinya 8, sama dengan angka Raka.', done: () => next(6000) }); }
      else if (r === 6) { go('bongkar', 3); breakRound(area, ctx, { done: () => next(6500) }); }
      else if (r === 7) { go('ttd', 4); sigRound(area, ctx, { done: later(() => keySort(area, ctx, { done: () => next(6000) }), 3000) }); }
      else if (r === 8) {
        go('faktor', 5);
        const msg = factorRound(area, ctx, { n: 2491, intro: 'Lomba faktor: bagi 2.491 dengan bilangan prima berurutan sampai ketemu.', done: (p, t) => { say(msg, 'info', `2.491 = ${p} × ${2491 / p}, pada percobaan ke-${t}. Cukup mencoba sampai √2.491 ≈ 49,9.`); later(() => scaleRound(area, ctx, { done: () => next(7000) }), 3200)(); } });
      } else { go('boss', 'Bos'); mitmRound(area, ctx, { done: () => next(8000) }); }
    }
    render();
  },
};

function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  const inp = (v, l) => el('label', { class: 'kp-label' }, l, el('input', { class: 'kp-masuk', type: 'number', min: '0', value: String(v), 'aria-label': l }));
  const fb = inp(17, 'Bilangan pokok'); const fe = inp(27, 'Pangkat'); const fm = inp(55, 'Pembagi');
  const out = el('div', { class: 'kp-langkah' });
  const calc = () => {
    const [b, e, m] = [fb, fe, fm].map((f) => Math.floor(Number(f.querySelector('input').value)));
    if (!(b >= 0 && e >= 1 && m >= 2 && e <= 100000 && m <= 100000 && b <= 100000)) { out.replaceChildren(el('p', { class: 'kp-istilah' }, 'Pakai bilangan bulat: pangkat 1–100.000, pembagi 2–100.000.')); return; }
    const { steps: S, result } = steps(b, e, m);
    out.replaceChildren(...S.slice(0, 40).map((s) => el('div', { class: 'kp-l isi' }, el('span', null, s.text), el('b', null, `sisa ${s.val}`))), el('div', { class: 'kp-l hasil' }, el('span', null, `${b}${sup(e)} mod ${m}`), el('b', null, `= ${result}`)));
  };
  for (const f of [fb, fe, fm]) f.querySelector('input').addEventListener('input', calc);
  wrap.append(el('p', { class: 'prompt' }, 'Kalkulator pangkat modular'), el('div', { class: 'kp-baris-input' }, fb, fe, fm), out);
  calc();
}

function createSwap(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  const start = () => {
    const sec = [null, null]; const hidden = [true, true];
    const draw = () => {
      const post = sec.map((s) => (s == null ? '?' : modpow(G, s, P)));
      const side = (i) => {
        const name = ['Nadia', 'Fajar'][i]; const s = sec[i]; const other = post[1 - i];
        return el('div', { class: 'kp-sisi' }, el('b', null, name),
          s == null ? el('div', null, el('p', { class: 'kp-istilah' }, 'Pilih angka rahasia (2–21). Lawan berpaling!'), el('div', { class: 'kp-angka' }, Array.from({ length: 20 }, (_, j) => j + 2).map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, x), () => { sec[i] = x; ctx.sound.tap(); draw(); }))))
            : el('div', null, el('p', { class: 'kp-istilah' }, hidden[i] ? 'Angka rahasia: 🔒' : `Angka rahasia: ${s}`), onTap(el('button', { class: 'seg-btn', type: 'button' }, hidden[i] ? '👁 Intip' : '🙈 Tutup'), () => { hidden[i] = !hidden[i]; draw(); }),
              el('p', { class: 'kp-istilah' }, hidden[i] ? `Tempel: 5^🔒 mod 23 = ${post[i]}` : `Tempel: 5${sup(s)} mod 23 = ${post[i]}`), other !== '?' ? el('p', { class: 'kp-kunci' }, hidden[i] ? `Kunci bersama: ${other}^🔒 mod 23 = 🔒` : `Kunci bersama: ${other}${sup(s)} mod 23 = ${modpow(other, s, P)}`) : null));
      };
      const both = sec.every((s) => s != null);
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Pertukaran kunci di depan umum'), el('div', { class: 'kp-tukar' }, side(0), el('div', { class: 'kp-papan' }, el('b', null, '📌 Papan umum'), el('span', null, `p = ${P}`), el('span', null, `g = ${G}`), el('span', null, `Nadia: ${post[0]}`), el('span', null, `Fajar: ${post[1]}`)), side(1)),
        both ? el('p', { class: 'reveal' }, `Keduanya mendapat kunci yang sama, ${modpow(G, sec[0] * sec[1], P)}, tanpa pernah mengirim angka rahasia. Papan umum tidak pernah memuat kunci itu.`) : el('p', { class: 'reveal info' }, 'Setiap pemain memilih angka rahasia di sisinya.'),
        el('div', { class: 'kode-baris' }, button('Ulang', start)));
    };
    draw();
  };
  start();
}

function createRsa(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  let m = 14; let c = 17; let code = 7; let sig = 28;
  const stepper = (get, set, lo, hi) => el('span', { class: 'kp-stepper' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { set(Math.max(lo, get() - 1)); draw(); }), el('b', null, get()), onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { set(Math.min(hi, get() + 1)); draw(); }));
  const draw = () => {
    const enc = modpow(m, 3, 55); const dec = modpow(c, 27, 55); const made = modpow(code, 27, 55); const chk = modpow(sig, 3, 55);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'RSA mini · kunci publik n = 55, e = 3 · kunci privat d = 27'), el('div', { class: 'kp-rsa' },
      el('div', { class: 'kp-sisi' }, el('b', null, '📨 Kirim ke Nadia (kunci publik)'), el('div', null, 'Pesan m: ', stepper(() => m, (v) => { m = v; }, 0, 54)), el('code', null, `${m}³ mod 55 = ${enc}`), button('Kirim sandinya ke kotak buka ➜', () => { c = enc; draw(); })),
      el('div', { class: 'kp-sisi' }, el('b', null, '🔓 Nadia membuka (kunci privat)'), el('div', null, 'Sandi c: ', stepper(() => c, (v) => { c = v; }, 0, 54)), el('code', null, `${c}²⁷ mod 55 = ${dec}`)),
      el('div', { class: 'kp-sisi' }, el('b', null, '✍️ Nadia menandatangani (kunci privat)'), el('div', null, 'Kode: ', stepper(() => code, (v) => { code = v; }, 0, 54)), el('code', null, `${code}²⁷ mod 55 = ${made}`), button('Pakai tanda tangan ini ➜', () => { sig = made; draw(); })),
      el('div', { class: 'kp-sisi' }, el('b', null, '🔍 Siapa pun memeriksa (kunci publik)'), el('div', null, 'Tanda tangan: ', stepper(() => sig, (v) => { sig = v; }, 0, 54)), el('code', { class: chk === code ? 'cocok' : 'beda' }, `${sig}³ mod 55 = ${chk} → ${chk === code ? `sah untuk kode ${code}` : `bukan ${code}, palsu`}`))));
  };
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act kunci-publik' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0); let k = 0; const turns = n * 2;
    function pick() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Rudi Menebak selesai', pts, again: () => pickTeams(wrap, 'Rudi Menebak', start) }); return; }
      const a = k % n; const b = (k + 1) % n; const big = k >= n;
      if (big) { guess(BigInt(ctx.rand.int(100000, 999999)) * 1000003n + BigInt(ctx.rand.int(0, 999)), b, true); return; }
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1}: pilih angka rahasia 2–21. Tim ${b + 1} berpaling!`), el('div', { class: 'kp-angka' }, Array.from({ length: 20 }, (_, j) => j + 2).map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, x), () => { ctx.sound.tap(); guess(BigInt(x), b, false); }))));
    }
    function guess(secret, b, big) {
      const p = big ? BIG_P : BigInt(P);
      const pub = modpowBig(5n, secret, p);
      let tries = 0; const max = big ? 5 : 3;
      const msg = el('p', { class: 'reveal hint' }, big ? `p sekarang ${num(Number(BIG_P))}. Tabelnya punya hampir satu triliun kotak. Coba tebak angka rahasia (${max} kesempatan).` : `Tim ${b + 1} menjadi Rudi: cari ${pub} di tabel (${max} kesempatan).`);
      const log = el('div', { class: 'kp-coba' });
      const finish = (ok) => { const g = ok ? (big ? 5 : 2) : 0; pts[b] += g; say(msg, ok ? '' : 'bad', ok ? `Ketemu! +${g}.` : `Gagal. Angka rahasianya ${secret.toLocaleString('id-ID')}.${big ? ' Tanpa tabel, menebak hampir pasti gagal: inilah yang melindungi kunci.' : ''}`); k++; setTimeout(pick, 3200); };
      const pad = numPad((x) => {
        tries++; const v = modpowBig(5n, BigInt(x), p);
        log.append(el('code', { class: v === pub ? 'cocok' : '' }, `5^${x} mod p = ${v.toLocaleString('id-ID')}`));
        if (v === pub) { pad.remove(); finish(true); } else if (tries >= max) { pad.remove(); finish(false); }
      }, { max: big ? 12 : 2 });
      wrap.replaceChildren(...[scoreBar(pts, b), el('p', { class: 'prompt' }, `Papan umum: p = ${num(Number(p))}, g = 5, angka tempelan = ${pub.toLocaleString('id-ID')}`), big ? null : powerGrid(), pad, log, msg].filter(Boolean));
    }
    pick();
  }
  pickTeams(wrap, 'Rudi Menebak', start);
}
function modpowBig(b, e, m) { let r = 1n; let x = b % m; let k = e; while (k > 0n) { if (k & 1n) r = (r * x) % m; x = (x * x) % m; k >>= 1n; } return r; }
