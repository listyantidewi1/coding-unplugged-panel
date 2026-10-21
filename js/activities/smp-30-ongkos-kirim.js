// Ongkos Kirim Paket — SMP (13–15 tahun), coding. Nested JIKA … SELAIN ITU JIKA
// and boundary testing: pupils turn a parcel-rate board into pseudocode, see
// Bayu's "<" instead of "≤" pass three tests yet fail at exactly 1 kg and 5 kg,
// build boundary test cases, and find why Dewa's order and an early "kilat"
// give wrong prices.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pickSet, codeView, stepper } from './smp-kit.js';
import { runAll } from './pseudo.js';

export const F11 = ['15000 + (berat − 5) × 2000', '15000 + berat × 2000', '15000 + berat − 5 × 2000', '(15000 + berat − 5) × 2000'];
export const F13 = ['ongkos × 2', 'ongkos + 2', '8000 × 2', 'ongkos × ongkos'];
export function program({ op6 = '≤', op8 = '≤', f11 = F11[0], f13 = F13[0], dewa = false, kilatFirst = false } = {}) {
  const tiers = dewa ? ['    JIKA berat ≤ 5 MAKA', '        ongkos ← 12000', '    SELAIN ITU JIKA berat ≤ 1 MAKA', '        ongkos ← 8000']
    : [`    JIKA berat ${op6} 1 MAKA`, '        ongkos ← 8000', `    SELAIN ITU JIKA berat ${op8} 5 MAKA`, '        ongkos ← 12000'];
  const luar = ['    JIKA tujuan = "luar kota" MAKA', `        ongkos ← ${f13}`]; const kilat = ['    JIKA kilat = BENAR MAKA', '        ongkos ← ongkos + 10000'];
  return ['BACA berat, tujuan, kilat', 'berat ← BULATKAN_KE_ATAS(berat)', 'JIKA berat ≤ 0 MAKA', '    TAMPILKAN "Berat tidak valid"', 'SELAIN ITU', ...tiers, '    SELAIN ITU', `        ongkos ← ${f11}`, ...(kilatFirst ? [...kilat, ...luar] : [...luar, ...kilat]), '    TAMPILKAN ongkos'];
}
export const PROGRAMS = { benar: program(), bayu: program({ op6: '<', op8: '<' }), dewa: program({ dewa: true }) };
export const PNAME = { benar: 'program yang benar', bayu: 'program Bayu', dewa: 'program Dewa' };
export function send(lines, berat, tujuan = 'dalam kota', kilat = false) {
  const r = runAll(lines, { input: { berat, tujuan, kilat } });
  return { out: r.error ? `galat: ${r.error.message}` : r.out[0], lines: [...new Set(r.trace.map((t) => t.line))], berat: r.vars.berat };
}
export const price = (berat, tujuan, kilat, which = 'benar') => send(PROGRAMS[which], berat, tujuan, kilat).out;
export const CASES = [[0, 'dalam kota', false, 'batas data tidak valid'], [1, 'dalam kota', false, 'tepat di batas 1 kg'], [2, 'dalam kota', false, 'tepat di atas batas 1 kg'], [5, 'dalam kota', false, 'tepat di batas 5 kg'], [6, 'dalam kota', false, 'tepat di atas batas 5 kg, rumus per kg'], [6, 'luar kota', false, 'aturan luar kota'], [1, 'dalam kota', true, 'aturan kilat'], [1, 'luar kota', true, 'kilat tidak ikut dikalikan dua']];
export const bugFinders = (which = 'bayu') => CASES.map((c, i) => [i + 1, price(c[0], c[1], c[2]) !== price(c[0], c[1], c[2], which)]).filter((x) => x[1]).map((x) => x[0]);
const kg = (b) => String(b).replace('.', ',');
const pkt = ([b, t, k]) => `${kg(b)} kg, ${t}, ${k ? 'kilat' : 'biasa'}`;

// Weight line 0–10 kg coloured by tariff for the chosen signs.
function weightLine(op6, op8) {
  const cells = []; for (let b = 0; b <= 10; b++) { const o = send(program({ op6, op8 }), b).out; cells.push([b, o]); }
  const cls = (o) => (o === '8000' ? 't1' : o === '12000' ? 't2' : /tidak valid/.test(o) ? 't0' : 't3');
  return el('div', { class: 'ong-garis' }, cells.map(([b, o]) => el('div', { class: `ong-sel ${cls(o)}` }, el('b', null, `${b} kg`), el('small', null, /tidak valid/.test(o) ? 'tidak valid' : o))));
}

export default {
  id: 'smp-30-ongkos-kirim',
  title: 'Ongkos Kirim Paket',
  topic: 'Percabangan bertingkat (JIKA … SELAIN ITU JIKA), urutan pemeriksaan, dan kasus uji nilai batas',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '📦',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Ubah papan tarif loket paket menjadi pseudocode, temukan bug yang hanya muncul tepat di batas 1 kg dan 5 kg, susun kasus uji nilai batas, dan perbaiki urutan pemeriksaan.',
  extraModes: [
    { id: 'kalkulator', icon: '🧾', label: 'Kalkulator dari Pseudocode', desc: 'Pilih tanda dan rumus di program, kirim paket, lihat cabang yang menyala; cabang yang belum pernah dijalankan tampil abu-abu', create: createCalc },
    { id: 'uji', icon: '🧪', label: 'Tabel Kasus Uji', desc: 'Tambahkan kasus uji dan hasil yang diharapkan; semua kasus dijalankan pada program benar, program Bayu, dan program Dewa', create: createTests },
    { id: 'garis', icon: '📏', label: 'Garis Bilangan Berat', desc: 'Berat 0–10 kg diwarnai menurut tarif; lihat batasnya bergeser saat tanda < diganti ≤', create: createLine },
    { id: 'giliran', icon: '🕵️', label: 'Tebak Program Rahasia', desc: 'Satu tim memilih program rahasia, tim lain mengirim paket pengecoh dan menebak programnya dengan kasus uji sesedikit mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act ongkos-kirim' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      const pkRow = (k, p, wrong) => { const s = send(PROGRAMS.benar, ...p); const a = `${s.berat} kg · ${s.out}`; return [k, pkt(p), opt(a, wrong), a]; };
      const board = el('table', { class: 'ong-papan' }, [['sampai 1 kg', 'Rp8.000'], ['lebih dari 1 kg sampai 5 kg', 'Rp12.000'], ['lebih dari 5 kg', 'Rp15.000 + Rp2.000 per kg di atas 5 kg']].map(([a, b]) => el('tr', null, el('td', null, a), el('td', null, b))),
        el('tr', null, el('td', { colspan: 2 }, 'Dibulatkan ke atas · luar kota × 2 · kilat + Rp10.000 (tidak dikali dua)')));
      if (r === 0) rowsChoose(wrap, ctx, { prompt: 'Hitung dari papan tarif: berat setelah dibulatkan · ongkos', info: 'Kilat ditambahkan setelah dikali dua.', rows: [pkRow('a', [1, 'dalam kota', false], ['1 kg · 12000', '1 kg · 16000']), pkRow('b', [3, 'luar kota', false], ['3 kg · 12000', '3 kg · 34000']), pkRow('c', [5, 'dalam kota', true], ['5 kg · 12000', '5 kg · 25000'])], done: next });
      else if (r === 1) rowsChoose(wrap, ctx, { prompt: 'Hitung lagi: berat setelah dibulatkan · ongkos', rows: [pkRow('d', [8, 'luar kota', true], ['8 kg · 62000', '8 kg · 42000']), pkRow('e', [0.4, 'dalam kota', false], ['0 kg · Berat tidak valid', '0,4 kg · 3200']), pkRow('f', [5.2, 'dalam kota', false], ['5 kg · 12000', '6 kg · 27000'])], done: next });
      else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Lengkapi pseudocode dari papan tarif', rows: [['6', 'Baris 6: JIKA berat … 1 MAKA', ['<', '≤', '>'], '≤'], ['8', 'Baris 8: SELAIN ITU JIKA berat … 5 MAKA', ['<', '≤', '≥'], '≤'], ['11', 'Baris 11: ongkos ← …', F11, F11[0]], ['13', 'Baris 13: ongkos ← …', F13, F13[0]]], done: next });
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Program Bayu (baris 6: berat < 1, baris 8: berat < 5). Ongkos dalam kota biasa:', rows: [1, 2, 5, 6].map((b) => { const ok = price(b, 'dalam kota', false); const bayu = price(b, 'dalam kota', false, 'bayu'); const a = `benar ${ok} · Bayu ${bayu} · ${ok === bayu ? 'sesuai' : 'tidak sesuai'}`; return [b, `${b} kg`, opt(a, [`benar ${ok} · Bayu ${ok} · sesuai`, `benar ${bayu} · Bayu ${ok} · tidak sesuai`, `benar ${ok} · Bayu 17000 · tidak sesuai`].filter((x) => x !== a)), a]; }), done: next });
      else if (r === 4) ask('Bayu menguji 2 kg, 3 kg, dan 8 kg, dan semuanya benar. Mengapa bug tidak ketahuan?', [['Ketiganya tidak berada di batas, sehingga < dan ≤ memberi hasil sama; bug hanya terlihat tepat di 1 kg dan 5 kg', true], ['Karena programnya memang benar'], ['Karena tiga uji sudah cukup untuk program apa pun'], ['Karena paket luar kota tidak diuji']], 1, codeView(PROGRAMS.bayu, { hl: [5, 7] }),
        then(() => ask('Berat selalu dibulatkan ke atas, jadi berat valid paling kecil 1 kg. Apa artinya bagi baris 6 milik Bayu (berat < 1)?', [['Syaratnya tidak pernah benar untuk paket valid, jadi tarif Rp8.000 tidak pernah dipakai dan paket 1 kg membayar terlalu mahal', true], ['Tidak ada artinya'], ['Paket 1 kg menjadi gratis'], ['Paket 1 kg ditolak']])));
      else if (r === 5 || r === 6) { const part = r === 5 ? CASES.slice(0, 4) : CASES.slice(4); const base = r === 5 ? 1 : 5; rowsChoose(wrap, ctx, { prompt: `Tabel kasus uji ${base}–${base + 3}: hasil yang diharapkan`, info: 'Pilih kasus tepat di batas dan tepat di atas batas.', rows: part.map((c, i) => { const a = price(c[0], c[1], c[2]); return [i, `${base + i}. ${pkt(c)} — ${c[3]}`, opt(a, ['8000', '12000', '17000', '34000', '18000', '26000', '36000', 'Berat tidak valid'].filter((x) => x !== a).slice(i, i + 3)), a]; }), done: next }); }
      else if (r === 7) pickSet(wrap, ctx, { prompt: 'Kasus uji nomor berapa saja yang menemukan bug program Bayu?', items: CASES.map((c, i) => [i + 1, `${i + 1}. ${pkt(c)}`]), right: bugFinders('bayu'), why: `Kasus ${bugFinders('bayu').join(', ')}: semuanya memakai berat 1 kg atau 5 kg.`, done: next });
      else if (r === 8) ask('Dewa memeriksa berat ≤ 5 lebih dulu. Berapa ongkos paket 1 kg dalam kota, dan kapan ongkos ← 8000 dijalankan?', [[`${price(1, 'dalam kota', false, 'dewa')}; tidak pernah, karena setiap berat ≤ 1 juga ≤ 5 dan sudah tertangkap syarat pertama`, true], ['8000; setiap paket 1 kg'], ['12000; hanya untuk paket 0,4 kg'], ['8000; bila berat kurang dari 1']], 1, codeView(PROGRAMS.dewa, { hl: [5, 7], warn: [8] }));
      else { const early = send(program({ kilatFirst: true }), 1, 'luar kota', true).out; ask('Baris kilat dipindah ke atas baris luar kota. Paket 1 kg luar kota kilat menjadi berapa, dan seharusnya berapa?', [[`${early}, seharusnya ${price(1, 'luar kota', true)}: biaya kilat ikut dikalikan dua karena ditambahkan sebelum perkalian`, true], [`${price(1, 'luar kota', true)}, sama saja`], ['18000, karena luar kota diabaikan'], [`${early}, dan memang seharusnya begitu`]], 1, el('div', { class: 'ong-dua' }, codeView(program({ kilatFirst: true }).slice(11)), board)); }
    }
    render();
  },
};

const WEIGHTS = [-1, 0, 0.4, 1, 1.2, 2, 3, 5, 5.2, 6, 8, 20, 21];
function pkgPicker(st, onChange) {
  const seg = (label, items, key) => el('div', { class: 'sk-baris' }, el('span', null, label), el('div', { class: 'seg' }, items.map(([v, l]) => onTap(el('button', { class: `seg-btn ${st[key] === v ? 'on' : ''}`, type: 'button' }, l), () => { st[key] = v; onChange(); }))));
  return el('div', { class: 'ong-paket' }, seg('Berat', WEIGHTS.map((w) => [w, `${kg(w)} kg`]), 'berat'), seg('Tujuan', [['dalam kota', 'dalam kota'], ['luar kota', 'luar kota']], 'tujuan'), seg('Layanan', [[false, 'biasa'], [true, 'kilat']], 'kilat'));
}

function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act ongkos-kirim' });
  root.append(wrap);
  const cfg = { op6: '≤', op8: '≤', f11: F11[0], f13: F13[0] }; const pk = { berat: 1, tujuan: 'dalam kota', kilat: false }; let seen = new Set(); let runs = [];
  const draw = () => {
    const lines = program(cfg); const res = send(lines, pk.berat, pk.tujuan, pk.kilat);
    const branchLines = [6, 8, 10, 12, 14, 3];
    const never = branchLines.filter((l) => !seen.has(l)).sort((a, b) => a - b);
    const seg = (key, items) => el('div', { class: 'seg' }, items.map((v) => onTap(el('button', { class: `seg-btn ${cfg[key] === v ? 'on' : ''}`, type: 'button' }, v), () => { cfg[key] = v; seen = new Set(); runs = []; draw(); })));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Kalkulator dari pseudocode'),
      el('div', { class: 'ong-dua' },
        el('div', { class: 'ong-kiri' }, el('div', { class: 'ong-atur' }, el('span', null, 'Baris 6'), seg('op6', ['<', '≤']), el('span', null, 'Baris 8'), seg('op8', ['<', '≤'])), el('div', { class: 'ong-atur' }, el('span', null, 'Baris 11'), seg('f11', F11)), el('div', { class: 'ong-atur' }, el('span', null, 'Baris 13'), seg('f13', F13)),
          codeView(lines, { hl: res.lines, cls: 'ong-kode', warn: [] }), el('p', { class: 'ong-ket' }, never.length ? `Abu-abu: cabang baris ${never.map((l) => l + 1).join(', ')} belum pernah dijalankan oleh paket yang dikirim.` : 'Semua cabang sudah pernah dijalankan.')),
        el('div', { class: 'ong-kanan' }, pkgPicker(pk, draw), button('📦 Kirim paket ini', () => { res.lines.forEach((l) => seen.add(l)); runs.unshift([{ ...pk }, res.out]); draw(); }, 'primary'), el('p', { class: 'ong-hasil' }, `Hasil: ${res.out}`),
          el('ol', { class: 'ong-riwayat' }, runs.slice(0, 6).map(([p, o]) => el('li', null, `${pkt([p.berat, p.tujuan, p.kilat])} → ${o}`))))));
    wrap.querySelectorAll('.ong-kode li').forEach((li, i) => { if (never.includes(i)) li.classList.add('abu'); });
  };
  draw();
}

function createTests(root, ctx) {
  const wrap = el('div', { class: 'act ongkos-kirim' });
  root.append(wrap);
  let cases = CASES.map(([b, t, k]) => ({ berat: b, tujuan: t, kilat: k, expect: price(b, t, k) }));
  const pk = { berat: 1, tujuan: 'dalam kota', kilat: false }; let exp = 8000; let invalid = false;
  const draw = () => {
    const tbl = el('table', { class: 'ong-uji' }, el('tr', null, ['No', 'Paket', 'Diharapkan', 'Benar', 'Bayu', 'Dewa', ''].map((h) => el('th', null, h))),
      cases.map((c, i) => { const got = ['benar', 'bayu', 'dewa'].map((w) => price(c.berat, c.tujuan, c.kilat, w)); return el('tr', null, el('td', null, String(i + 1)), el('td', null, pkt([c.berat, c.tujuan, c.kilat])), el('td', null, c.expect), got.map((g, j) => el('td', { class: g === c.expect ? 'ok' : 'bug' }, `${g === c.expect ? '✓' : '✗'} ${g}${j > 0 && g !== got[0] ? ' 🐞' : ''}`)), el('td', null, button('✕', () => { cases.splice(i, 1); draw(); }))); }));
    const found = ['bayu', 'dewa'].map((w) => [w, cases.filter((c) => price(c.berat, c.tujuan, c.kilat, w) !== price(c.berat, c.tujuan, c.kilat)).length]);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Tabel kasus uji'), tbl,
      el('p', { class: 'ong-ket' }, found.map(([w, n]) => `${PNAME[w]}: ${n ? `${n} kasus menemukan bug 🐞` : 'belum ada kasus yang menemukan bug'}`).join(' · ')),
      el('div', { class: 'ong-tambah' }, pkgPicker(pk, draw), el('div', { class: 'sk-tombol' }, el('span', null, 'Diharapkan:'), stepper(exp, (v) => { exp = v; }, { min: 0, max: 200000, step: 1000 }), onTap(el('button', { class: `seg-btn ${invalid ? 'on' : ''}`, type: 'button' }, 'Berat tidak valid'), () => { invalid = !invalid; draw(); }),
        button('+ Tambah kasus', () => { cases.push({ ...pk, expect: invalid ? 'Berat tidak valid' : String(exp) }); draw(); }, 'primary'), button('Kosongkan', () => { cases = []; draw(); }))));
  };
  draw();
}

function createLine(root, ctx) {
  const wrap = el('div', { class: 'act ongkos-kirim' });
  root.append(wrap);
  let op6 = '≤'; let op8 = '≤';
  const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Garis bilangan berat (dalam kota, biasa)'),
    el('div', { class: 'ong-atur' }, el('span', null, 'JIKA berat'), el('div', { class: 'seg' }, ['<', '≤'].map((v) => onTap(el('button', { class: `seg-btn ${op6 === v ? 'on' : ''}`, type: 'button' }, v), () => { op6 = v; draw(); }))), el('span', null, '1 MAKA … SELAIN ITU JIKA berat'), el('div', { class: 'seg' }, ['<', '≤'].map((v) => onTap(el('button', { class: `seg-btn ${op8 === v ? 'on' : ''}`, type: 'button' }, v), () => { op8 = v; draw(); }))), el('span', null, '5 MAKA')),
    weightLine(op6, op8), el('p', { class: 'ong-ket' }, 'Bandingkan dengan papan tarif: sampai 1 kg Rp8.000, lebih dari 1 sampai 5 kg Rp12.000, lebih dari 5 kg Rp15.000 + Rp2.000 per kg.'));
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act ongkos-kirim' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Tebak program rahasia selesai', pts, again: () => pickTeams(wrap, 'Tebak Program Rahasia', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT;
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih program rahasia (tim lain jangan melihat).`);
      const host = el('div', { class: 'ong-paket' }, el('div', { class: 'sk-tombol' }, Object.keys(PROGRAMS).map((w) => button(PNAME[w], () => play(w)))));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih program, Tim ${guesser + 1} menebak`), host, msg);
      function play(secret) {
        const pk = { berat: 2, tujuan: 'dalam kota', kilat: false }; const log = [];
        say(msg, '', `Tim ${guesser + 1}: kirim paket pengecoh, lalu tebak programnya. Makin sedikit paket, makin besar poinnya.`);
        const draw = () => host.replaceChildren(...[pkgPicker(pk, draw), button('📦 Kirim', () => { log.push([{ ...pk }, price(pk.berat, pk.tujuan, pk.kilat, secret), price(pk.berat, pk.tujuan, pk.kilat)]); draw(); }, 'primary'),
          el('ol', { class: 'ong-riwayat' }, log.map(([p, o, ok]) => el('li', null, `${pkt([p.berat, p.tujuan, p.kilat])} → ${o}${o === ok ? '' : `  (papan tarif: ${ok})`}`))),
          log.length ? el('div', { class: 'sk-tombol' }, el('span', null, 'Tebakan:'), Object.keys(PROGRAMS).map((w) => button(PNAME[w], () => {
            const okk = w === secret; const gain = okk ? Math.max(1, 4 - (log.length - 1)) : 0; pts[guesser] += gain; ctx.sound[okk ? 'good' : 'bad']();
            say(msg, okk ? '' : 'bad', okk ? `Tepat dengan ${log.length} paket! Tim ${guesser + 1} +${gain}.` : `Belum tepat. Programnya: ${PNAME[secret]}.`);
            wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); host.replaceChildren(); k++; setTimeout(turn, 3600);
          }))) : null].filter(Boolean));
        draw();
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Program Rahasia', start);
}
