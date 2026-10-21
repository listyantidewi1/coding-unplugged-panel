// Data Koperasi Sekolah — SMP (13–15 tahun), data terstruktur. Two tables
// linked by a unique code: Barang (code, name, price) and Penjualan (day,
// code, amount). Hunt problems in an old notebook, filter rows, sum with a
// condition, join prices by code, and read SUMIF/COUNTIF formulas.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

export const BARANG = [['B01', 'Buku tulis', 4000], ['B02', 'Pensil', 2500], ['B03', 'Penghapus', 2000], ['B04', 'Pulpen', 3000], ['B05', 'Penggaris', 3500], ['B06', 'Air mineral', 3000]];
export const JUAL = [['Senin', 'B01', 3], ['Senin', 'B02', 5], ['Senin', 'B06', 4], ['Selasa', 'B04', 2], ['Selasa', 'B01', 2], ['Selasa', 'B06', 6], ['Rabu', 'B03', 4], ['Rabu', 'B02', 3], ['Rabu', 'B01', 1], ['Kamis', 'B06', 5], ['Kamis', 'B05', 2], ['Kamis', 'B04', 3], ['Jumat', 'B01', 4], ['Jumat', 'B06', 7], ['Jumat', 'B02', 2]]
  .map(([hari, kode, jumlah], i) => ({ no: i + 1, hari, kode, jumlah }));
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const NOTES = ['Senin — buku tulis 3 biji @ Rp4.000', 'Senin — Buku Tulis 3 @ 4rb', 'Selasa — bolpoin 2 @ Rp3.000', 'Selasa — pulpen 1 @ Rp3.500', 'Rabu — penghapus @ Rp2.000'];
export const PROBLEMS = [
  ['Catatan yang sama ditulis dua kali', [1, 2]],
  ['Satu barang ditulis dengan dua nama berbeda', [3, 4]],
  ['Harga barang yang sama berbeda', [3, 4]],
  ['Ada data yang tidak lengkap (jumlahnya hilang)', [5]],
];

export const rp = (n) => `Rp${n.toLocaleString('id-ID')}`;
export const priceOf = (kode, prices = BARANG) => prices.find((b) => b[0] === kode)[2];
export const nameOf = (kode) => BARANG.find((b) => b[0] === kode)[1];
export const sold = (kode, rows = JUAL) => rows.filter((r) => r.kode === kode).reduce((s, r) => s + r.jumlah, 0);
export const income = (kode, prices = BARANG) => sold(kode) * priceOf(kode, prices);
export const dayIncome = (hari) => JUAL.filter((r) => r.hari === hari).reduce((s, r) => s + r.jumlah * priceOf(r.kode), 0);
// A filter: { col: 'hari' | 'kode' | 'min', v }.
export const match = (f) => (r) => (f.col === 'min' ? r.jumlah >= f.v : r[f.col] === f.v);
export function formula(f, op) {
  const range = { hari: 'B2:B16', kode: 'C2:C16', min: 'D2:D16' }[f.col];
  const crit = f.col === 'min' ? `">=${f.v}"` : `"${f.v}"`;
  return op === 'count' ? `=COUNTIF(${range};${crit})` : `=SUMIF(${range};${crit};D2:D16)`;
}

export default {
  id: 'smp-07-koperasi',
  title: 'Data Koperasi Sekolah',
  topic: 'Data terstruktur: tabel, kunci, saringan, dan rumus',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🧾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menemukan masalah catatan yang tidak rapi, menyaring dan menjumlah data dengan syarat, menghubungkan dua tabel lewat kode unik, dan membaca rumus SUMIF dan COUNTIF.',
  extraModes: [
    { id: 'saringan', icon: '🔎', label: 'Saringan dan Penjumlah', desc: 'Pilih syarat, hitung baris atau jumlahkan kolom; rumus lembar kerjanya ikut tampil', create: createFilter },
    { id: 'harga', icon: '🏷️', label: 'Uji Perubahan Harga', desc: 'Ubah satu harga di tabel Barang dan lihat semua pendapatan ikut berubah', create: createPrices },
    { id: 'masalah', icon: '🕵️', label: 'Pemburu Masalah', desc: 'Ketuk baris catatan lama yang bermasalah', create: createHunt },
    { id: 'tim', icon: '🤝', label: 'Tim Bertanya, Tim Menjawab', desc: 'Tim A menyusun pertanyaan dari templat, tim B menjawab dengan saringan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act koperasi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r === 0) huntRound(wrap, ctx, { done: next });
      else if (r === 1) selectRound(wrap, ctx, { prompt: 'Saring: ketuk semua baris penjualan hari Rabu.', want: JUAL.filter(match({ col: 'hari', v: 'Rabu' })).map((x) => x.no), done: next });
      else if (r === 2) selectRound(wrap, ctx, { prompt: 'Saring: ketuk semua baris dengan jumlah 5 atau lebih.', want: JUAL.filter(match({ col: 'min', v: 5 })).map((x) => x.no), done: next });
      else if (r === 3) numberRound(wrap, ctx, { prompt: 'Berapa buku tulis (B01) yang terjual minggu ini?', boxes: [['Buku tulis', sold('B01')]], done: next });
      else if (r === 4) numberRound(wrap, ctx, { prompt: 'Air mineral (B06): berapa kali tercatat, dan berapa botol semuanya?', boxes: [['Kali tercatat', JUAL.filter((x) => x.kode === 'B06').length], ['Botol', sold('B06')]], done: next });
      else if (r === 5) incomeRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Urutkan barang dari pendapatan terbesar ke terkecil.', [['Air mineral, buku tulis, pensil, pulpen, penghapus, penggaris', true], ['Buku tulis, air mineral, pensil, pulpen, penggaris, penghapus'], ['Air mineral, pensil, buku tulis, pulpen, penghapus, penggaris'], ['Pensil, buku tulis, air mineral, penggaris, pulpen, penghapus']]);
      else if (r === 7) ask('Hari apa pendapatannya terbesar?', [['Jumat, Rp42.000', true], ['Senin, Rp36.500'], ['Selasa, Rp32.000'], ['Jumat, Rp36.500']], 2, tables({ compact: true }));
      else if (r === 8) {
        const [f, op, right, wrong] = ctx.rand.pick([[{ col: 'kode', v: 'B01' }, 'sum', '10: jumlah buku tulis yang terjual', ['3: jumlah baris buku tulis', '4: jumlah buku tulis hari Jumat', '40.000: pendapatan buku tulis']], [{ col: 'kode', v: 'B06' }, 'count', '4: berapa kali air mineral tercatat', ['22: banyak botol air mineral', '6: kode barang terakhir', '7: jumlah terbesar']]]);
        ask(`Rumus ${formula(f, op)} menghasilkan …`, [[right, true], ...wrong.map((w) => [w])], 1, tables({ compact: true, sheet: true }));
      } else ask('Harga pulpen naik menjadi Rp3.500. Di mana harga diubah, dan masalah apa yang hilang dengan dua tabel dan kode?', [['Tabel Barang, cukup 1 sel; nama ganda dan harga berbeda tidak terjadi lagi', true], ['Tabel Penjualan, semua baris pulpen'], ['Tabel Barang, 1 sel; catatan ganda tidak mungkin lagi'], ['Kedua tabel, 6 sel']]);
    }
    render();
  },
};

// The two linked tables. `pick` makes Penjualan rows tappable.
function tables({ selected = new Set(), onRow, compact, sheet, hiKode, onKode, prices = BARANG, hiRows } = {}) {
  const barang = el('table', { class: 'kop-tabel barang' },
    el('thead', null, el('tr', null, el('th', null, 'Kode'), el('th', null, 'Nama barang'), el('th', null, 'Harga'))),
    el('tbody', null, prices.map(([k, n, h]) => el('tr', { class: hiKode === k ? 'hi' : '', 'data-kode': k }, el('td', null, k), el('td', null, n), el('td', null, rp(h))))));
  const head = sheet ? [['', 'A'], ['', 'B'], ['', 'C'], ['', 'D']] : null;
  const jual = el('table', { class: `kop-tabel jual ${onRow ? 'pilih' : ''}` },
    el('thead', null, head ? el('tr', { class: 'kolom' }, el('th', null, ''), ...head.map(([, c]) => el('th', null, c))) : null,
      el('tr', null, sheet ? el('th', null, '1') : null, el('th', null, 'No.'), el('th', null, 'Hari'), el('th', null, 'Kode'), el('th', null, 'Jumlah'))),
    el('tbody', null, JUAL.map((r) => {
      const tr = el('tr', { class: `${selected.has(r.no) ? 'pilih-on' : ''} ${hiRows?.has(r.no) ? 'hi' : ''}`, 'data-no': r.no },
        sheet ? el('th', null, r.no + 1) : null, el('td', null, r.no), el('td', null, r.hari),
        el('td', null, onKode ? onTap(el('button', { class: 'kop-kode', type: 'button', 'data-kode': r.kode }, r.kode), (e) => { e?.stopPropagation?.(); onKode(r.kode); }) : r.kode), el('td', null, r.jumlah));
      return onRow ? onTap(tr, () => onRow(r.no)) : tr;
    })));
  return el('div', { class: `kop-dua ${compact ? 'ringkas' : ''}` }, el('div', null, el('small', null, 'Tabel Barang'), barang), el('div', null, el('small', null, 'Tabel Penjualan'), jual));
}

function huntRound(wrap, ctx, { done, free }) {
  let step = 0;
  const pick = new Set();
  let finished = false;
  const notes = el('div', { class: 'catatan-lama' });
  const q = el('p', { class: 'reveal info' });
  const msg = el('p', { class: 'reveal info' });
  function draw() {
    q.textContent = step < PROBLEMS.length ? `${'abcd'[step]}. ${PROBLEMS[step][0]}: ketuk barisnya.` : 'Semua masalah ditemukan.';
    notes.replaceChildren(...NOTES.map((t, i) => onTap(el('button', { class: `catatan-baris ${pick.has(i + 1) ? 'on' : ''}`, type: 'button', 'data-line': i + 1 }, el('b', null, `${i + 1}.`), t), () => { if (finished) return; pick.has(i + 1) ? pick.delete(i + 1) : pick.add(i + 1); ctx.sound.tap(); draw(); })));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Buku catatan lama koperasi: temukan empat masalah.'), notes, q, button('Periksa', () => {
    if (finished) return;
    const want = PROBLEMS[step][1];
    if (pick.size !== want.length || want.some((x) => !pick.has(x))) { msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Baca lagi baris-barisnya.'; shake(notes); if (!free) ctx.mistake(); return; }
    msg.className = 'reveal';
    msg.textContent = `Tepat: baris ${want.join(' dan ')}.`;
    ctx.sound.good();
    pick.clear();
    step++;
    draw();
    if (step === PROBLEMS.length) { finished = true; msg.textContent = 'Dua tabel dengan kode membuat nama dan harga cukup ditulis sekali.'; done(); }
  }, 'primary'), msg);
}

function selectRound(wrap, ctx, { prompt, want, done }) {
  const sel = new Set();
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk baris di tabel Penjualan, lalu Periksa.');
  const draw = () => stage.replaceChildren(tables({ selected: sel, onRow: (no) => { if (finished) return; sel.has(no) ? sel.delete(no) : sel.add(no); ctx.sound.tap(); draw(); } }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const extra = [...sel].filter((x) => !want.includes(x));
    const missing = want.filter((x) => !sel.has(x));
    if (extra.length || missing.length) { msg.className = 'reveal bad'; msg.textContent = `${extra.length} baris tidak memenuhi syarat, ${missing.length} baris terlewat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Benar: baris ${want.join(', ')}.`;
    done();
  }, 'primary'), msg));
}

function keypad(onDigit, onBack) {
  return el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => onDigit(d))),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}
// Answer boxes typed with a keypad; the tables stay visible.
function numberRound(wrap, ctx, { prompt, boxes, done, extra }) {
  const vals = boxes.map(() => '');
  let focus = 0;
  let finished = false;
  const row = el('div', { class: 'kop-jawab' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kode untuk melihat barangnya. Ketik jawaban dengan papan angka.');
  let hiKode = null;
  const stage = el('div');
  const drawTables = () => stage.replaceChildren(tables({ compact: true, hiKode, hiRows: hiKode ? new Set(JUAL.filter((x) => x.kode === hiKode).map((x) => x.no)) : null, onKode: (k) => { hiKode = k; drawTables(); } }));
  function draw(wrong = []) {
    row.replaceChildren(...boxes.map(([label], k) => el('label', { class: 'kop-kotak' }, label, onTap(el('button', { class: `ck-isi ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] || '…'), () => { focus = k; draw(); }))));
  }
  draw();
  drawTables();
  const controls = el('div', { class: 'kop-kanan' }, row);
  wrap.append(el('p', { class: 'prompt' }, prompt), el('div', { class: 'kop-samping' }, extra || stage, controls));
  controls.append(el('div', { class: 'kode-baris' }, keypad((d) => { if (finished) return; vals[focus] = (vals[focus] + d).slice(0, 7).replace(/^0+(?=\d)/, ''); ctx.sound.tap(); draw(); }, () => { vals[focus] = vals[focus].slice(0, -1); draw(); }), button('Periksa', () => {
      if (finished) return;
      const wrong = boxes.map(([, v], k) => (Number(vals[k]) === v && vals[k] !== '' ? -1 : k)).filter((k) => k >= 0);
      if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Saring barisnya dengan mengetuk kode.'; ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Benar: ${boxes.map(([l, v]) => `${l} ${v.toLocaleString('id-ID')}`).join(', ')}.`;
      done();
    }, 'primary')), msg);
}

// Income per item: tap a code to look up its price, then type the income.
function incomeRound(wrap, ctx, { done }) {
  const seen = new Set();
  const vals = {};
  let focus = 'B01';
  let finished = false;
  const table = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kode untuk mengambil harganya dari tabel Barang, lalu ketik pendapatannya.');
  const keys = [...BARANG.map((b) => b[0]), 'total'];
  const want = Object.fromEntries(BARANG.map(([k]) => [k, income(k)]));
  want.total = BARANG.reduce((s, [k]) => s + income(k), 0);
  function draw(wrong = []) {
    const box = (k) => onTap(el('button', { class: `ck-isi lebar ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] ? Number(vals[k]).toLocaleString('id-ID') : '…'), () => { focus = k; draw(); });
    table.replaceChildren(el('table', { class: 'kop-tabel pendapatan' },
      el('thead', null, el('tr', null, ...['Kode', 'Nama', 'Terjual', 'Harga', 'Pendapatan'].map((h) => el('th', null, h)))),
      el('tbody', null, ...BARANG.map(([k]) => el('tr', null, el('td', null, onTap(el('button', { class: 'kop-kode', type: 'button', 'data-kode': k }, k), () => { seen.add(k); ctx.sound.tap(); draw(); })),
        el('td', null, seen.has(k) ? nameOf(k) : '?'), el('td', null, sold(k)), el('td', null, seen.has(k) ? rp(priceOf(k)) : '?'), el('td', null, box(k)))),
        el('tr', { class: 'total' }, el('td', { colspan: 4 }, 'Total'), el('td', null, box('total'))))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Pendapatan setiap barang = jumlah terjual × harga.'), table,
    el('div', { class: 'kode-baris' }, keypad((d) => { if (finished) return; vals[focus] = ((vals[focus] || '') + d).slice(0, 7).replace(/^0+(?=\d)/, ''); ctx.sound.tap(); draw(); }, () => { vals[focus] = (vals[focus] || '').slice(0, -1); draw(); }), button('Periksa', () => {
      if (finished) return;
      const wrong = keys.filter((k) => Number(vals[k]) !== want[k]);
      if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = `${wrong.length} kotak belum tepat.`; ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `Benar. Total pendapatan ${rp(want.total)}.`;
      done();
    }, 'primary')), msg);
}

function createFilter(root, ctx) {
  const wrap = el('div', { class: 'act koperasi' });
  root.append(wrap);
  let f = { col: 'kode', v: 'B01' };
  let op = 'sum';
  function draw() {
    const rows = JUAL.filter(match(f));
    const result = op === 'count' ? rows.length : rows.reduce((s, r) => s + r.jumlah, 0);
    const vals = f.col === 'hari' ? HARI : f.col === 'kode' ? BARANG.map((b) => b[0]) : [2, 3, 4, 5, 6];
    wrap.replaceChildren(
      el('div', { class: 'kode-baris' }, ...[['hari', 'Hari'], ['kode', 'Kode'], ['min', 'Jumlah ≥']].map(([c, l]) => button(l, () => { f = { col: c, v: c === 'hari' ? 'Senin' : c === 'kode' ? 'B01' : 5 }; draw(); }, f.col === c ? 'primary small' : 'small')),
        el('span', { class: 'kop-pisah' }), ...vals.map((v) => button(String(v), () => { f = { ...f, v }; draw(); }, f.v === v ? 'primary small' : 'small'))),
      el('div', { class: 'kode-baris' }, button('Hitung baris', () => { op = 'count'; draw(); }, op === 'count' ? 'primary small' : 'small'), button('Jumlahkan kolom Jumlah', () => { op = 'sum'; draw(); }, op === 'sum' ? 'primary small' : 'small')),
      tables({ compact: true, sheet: true, hiRows: new Set(rows.map((r) => r.no)) }),
      el('p', { class: 'reveal' }, `${formula(f, op)} → ${result}`));
  }
  draw();
}

function createPrices(root, ctx) {
  const wrap = el('div', { class: 'act koperasi' });
  root.append(wrap);
  const prices = BARANG.map((b) => [...b]);
  function draw() {
    const total = prices.reduce((s, [k]) => s + income(k, prices), 0);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ubah satu harga di tabel Barang; semua pendapatan ikut berubah.'),
      el('table', { class: 'kop-tabel pendapatan' },
        el('thead', null, el('tr', null, ...['Kode', 'Nama', 'Harga', 'Terjual', 'Pendapatan'].map((h) => el('th', null, h)))),
        el('tbody', null, ...prices.map((p) => el('tr', { class: p[2] !== priceOf(p[0]) ? 'berubah' : '' }, el('td', null, p[0]), el('td', null, p[1]),
          el('td', null, el('span', { class: 'harga-ubah' }, onTap(el('button', { class: 'geser-tombol', type: 'button' }, '−'), () => { p[2] = Math.max(500, p[2] - 500); ctx.sound.tap(); draw(); }), rp(p[2]), onTap(el('button', { class: 'geser-tombol', type: 'button' }, '+'), () => { p[2] += 500; ctx.sound.tap(); draw(); }))),
          el('td', null, sold(p[0])), el('td', null, rp(income(p[0], prices))))),
        el('tr', { class: 'total' }, el('td', { colspan: 4 }, 'Total'), el('td', null, rp(total))))),
      el('p', { class: 'reveal info' }, 'Satu sel harga diubah, tabel Penjualan tidak perlu disentuh sama sekali.'),
      button('Kembalikan harga', () => { prices.forEach((p, i) => { p[2] = BARANG[i][2]; }); draw(); }, 'small'));
  }
  draw();
}

function createHunt(root, ctx) {
  const wrap = el('div', { class: 'act koperasi' });
  root.append(wrap);
  huntRound(wrap, ctx, { free: true, done() { ctx.sound.win(); } });
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act koperasi' });
  root.append(wrap);
  const score = [0, 0];
  let asker = 0;
  function compose() {
    let kode = 'B01';
    let hari = 'Semua hari';
    const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${asker + 1}: susun pertanyaan untuk Tim ${2 - asker}.`),
      el('p', { class: 'reveal info' }, `"Berapa ${nameOf(kode).toLowerCase()} terjual ${hari === 'Semua hari' ? 'minggu ini' : `pada hari ${hari}`}?"`),
      el('div', { class: 'kode-baris' }, ...BARANG.map(([k, n]) => button(n, () => { kode = k; draw(); }, kode === k ? 'primary small' : 'small'))),
      el('div', { class: 'kode-baris' }, ...['Semua hari', ...HARI].map((h) => button(h, () => { hari = h; draw(); }, hari === h ? 'primary small' : 'small'))),
      el('p', { class: 'small-note' }, `Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`),
      button('Ajukan ➜', () => answer(kode, hari), 'primary'));
    draw();
  }
  function answer(kode, hari) {
    const reader = 1 - asker;
    const rows = JUAL.filter((r) => r.kode === kode && (hari === 'Semua hari' || r.hari === hari));
    const v = rows.reduce((s, r) => s + r.jumlah, 0);
    wrap.replaceChildren();
    let tries = 0;
    const real = ctx.mistake;
    numberRound(wrap, { ...ctx, mistake() { tries++; real(); } }, {
      prompt: `Tim ${reader + 1}: berapa ${nameOf(kode).toLowerCase()} terjual ${hari === 'Semua hari' ? 'minggu ini' : `pada hari ${hari}`}?`, boxes: [['Jawaban', v]],
      done() {
        const pts = tries ? 1 : 2;
        score[reader] += pts;
        ctx.sound.win();
        wrap.append(el('p', { class: 'reveal' }, `Tim ${reader + 1} mendapat ${pts} poin. Rumusnya: =SUMIFS(D2:D16;C2:C16;"${kode}"${hari === 'Semua hari' ? '' : `;B2:B16;"${hari}"`})`), button('Tukar peran ➜', () => { asker = reader; compose(); }, 'primary'));
      },
    });
  }
  compose();
}
