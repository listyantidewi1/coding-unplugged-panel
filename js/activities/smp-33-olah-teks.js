// Olah Teks — SMP (13–15 tahun), coding. Strings as numbered boxes: index,
// POTONG and joining text, a username function that fails for Balinese names
// starting with Ni or I, counting vowels (capital I missed), reversing and
// palindromes (Malam fails), reversing word order, and counting words.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

export const FN = {
  namaPengguna: ['FUNGSI namaPengguna(namaLengkap, absen)', '    kata ← PISAH(namaLengkap, " ")', '    depan ← kata[1]', '    awal ← KECIL(POTONG(depan, 1, 4))', '    JIKA absen < 10 MAKA', '        nomor ← "0" + TEKS(absen)', '    SELAIN ITU', '        nomor ← TEKS(absen)', '    KEMBALIKAN awal + nomor'],
  hitungVokal: ['FUNGSI hitungVokal(t)', '    jumlah ← 0', '    UNTUK i DARI 1 SAMPAI PANJANG(t)', '        JIKA t[i] ada di "aiueo" MAKA', '            jumlah ← jumlah + 1', '    KEMBALIKAN jumlah'],
  balik: ['FUNGSI balik(t)', '    hasil ← ""', '    UNTUK i DARI PANJANG(t) TURUN SAMPAI 1', '        hasil ← hasil + t[i]', '    KEMBALIKAN hasil'],
  palindrom: ['FUNGSI palindrom(t)', '    KEMBALIKAN balik(t) = t'],
  balikKata: ['FUNGSI balikKata(kalimat)', '    kata ← PISAH(kalimat, " ")', '    hasil ← kata[PANJANG(kata)]', '    UNTUK i DARI PANJANG(kata) − 1 TURUN SAMPAI 1', '        hasil ← hasil + " " + kata[i]', '    KEMBALIKAN hasil'],
  hitungKata: ['FUNGSI hitungKata(kalimat)', '    spasi ← 0', '    UNTUK i DARI 1 SAMPAI PANJANG(kalimat)', '        JIKA kalimat[i] = " " MAKA', '            spasi ← spasi + 1', '    KEMBALIKAN spasi + 1'],
};
export const vokalFix = () => [FN.hitungVokal[0], '    t ← KECIL(t)', ...FN.hitungVokal.slice(1)];
export const palinFix = () => [FN.palindrom[0], '    KEMBALIKAN balik(KECIL(t)) = KECIL(t)'];
const NEEDS = { palindrom: ['balik'] };
export const prog = (name, args, { fix = false } = {}) => {
  const own = fix && name === 'hitungVokal' ? vokalFix() : fix && name === 'palindrom' ? palinFix() : FN[name];
  return [...(NEEDS[name] || []).flatMap((n) => FN[n]), ...own, `hasil ← ${name}(${args.map((a) => (typeof a === 'string' ? `"${a}"` : a)).join(', ')})`];
};
export const run = (name, args, o) => runAll(prog(name, args, o)).vars.hasil;
export const show = (v) => fmt(v, { quote: true });
// Alternative rule from the key: if the first word is shorter than 3 letters, use the last word.
export function namaBaru(nama, absen) {
  const k = nama.split(' ').filter(Boolean); const w = k[0].length < 3 ? k[k.length - 1] : k[0];
  return w.slice(0, 4).toLowerCase() + String(absen).padStart(2, '0');
}
export const KELAS = [['Rina Kartika', 7], ['Bagus Prasetyo', 21], ['Ani Lestari', 3], ['Suparman', 30], ['Ni Made Ayu Lestari', 12], ['Ni Kadek Sari', 15], ['I Putu Gede Arta', 9], ['I Made Wira', 18], ['Rinaldi Saputra', 25], ['Ni Luh Putu Ayu', 11], ['Bagas Wicaksono', 2], ['Yohana Manurung', 27]];

// Character boxes; spaces get a special mark.
function chars(t, { cur = null, label = 't' } = {}) {
  return el('div', { class: 'ot-teks' }, [...t].map((c, k) => el('div', { class: `ot-kar ${c === ' ' ? 'spasi' : ''} ${cur === k + 1 ? 'baca' : ''}` }, el('small', null, String(k + 1)), el('b', null, c === ' ' ? '␣' : c))), t.length ? null : el('small', null, `${label} kosong`));
}
function textTracer(lines, o = {}) {
  return tracer(lines, { speed: 380, opts: { limit: 1500 }, ...o, extra: (st) => {
    const f = st.frames[st.frames.length - 1]; const v = f ? f.vars : st.vars;
    const t = ['t', 'kalimat', 'namaLengkap'].map((n) => v[n]).find((x) => typeof x === 'string');
    return t == null ? null : chars(t, { cur: !st.done && !st.error && Number.isInteger(v.i) && typeof v.kata !== 'object' ? v.i : null });
  } });
}

export default {
  id: 'smp-33-olah-teks',
  title: 'Olah Teks',
  topic: 'Teks: indeks karakter, POTONG, menggabung teks, nama pengguna, menghitung vokal, membalik teks, palindrom, dan membalik urutan kata',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🔤',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Baca teks sebagai deretan kotak bernomor, telusuri fungsi nama pengguna, penghitung vokal, dan pembalik teks, lalu temukan masukan yang membuat fungsinya salah.',
  extraModes: [
    { id: 'teks', icon: '🔍', label: 'Penelusur Teks', desc: 'Ketik sebuah teks, pilih fungsi, lalu jalankan langkah demi langkah; kotak yang sedang dibaca disorot dan spasi diberi tanda khusus', create: createTrace },
    { id: 'nama', icon: '🪪', label: 'Pembuat Nama Pengguna', desc: 'Ketik nama rekaan dan nomor absen; daftar kelas rekaan menandai nama pengguna yang sama atau mirip', create: createNames },
    { id: 'palindrom', icon: '🔁', label: 'Pemeriksa Palindrom', desc: 'Nyalakan atau matikan aturan "abaikan huruf kapital" dan "abaikan spasi" dan lihat pengaruhnya', create: createPalin },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Tebak Keluaran', desc: 'Satu tim memilih fungsi teks dan masukannya, tim lain menebak keluarannya sebelum fungsi dijalankan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act olah-teks' });
    root.append(wrap);
    const T = 'WANASARI';
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      const ev = (expr) => show(runAll([`t ← "${T}"`, `x ← ${expr}`]).vars.x);
      const runFirst = (prompt, lines, after) => { const tr = textTracer(lines, { onEnd: () => setTimeout(then(after), 1600) }); wrap.append(el('p', { class: 'prompt' }, prompt), tr); };
      const user = (n, a) => show(run('namaPengguna', [n, a]));
      if (r === 0) { wrap.append(chars(T)); rowsChoose(wrap, ctx, { prompt: 't ← "WANASARI"', rows: [['p', 'PANJANG(t)', opt(ev('PANJANG(t)'), [7, 9, 4]), ev('PANJANG(t)')], ['3', 't[3]', ['"A"', '"N"', '"S"', '"W"'], ev('t[3]')], ['z', 't[PANJANG(t)]', ['"I"', '"R"', '8', '"W"'], ev('t[PANJANG(t)]'), 't[8] adalah karakter terakhir.']], done: next }); }
      else if (r === 1) { wrap.append(chars(T)); rowsChoose(wrap, ctx, { prompt: 'POTONG(teks, awal, banyak) dan menggabung teks', rows: [['a', 'POTONG(t, 3, 4)', ['"NASA"', '"ANAS"', '"NAS"', '"NASAR"'], ev('POTONG(t, 3, 4)')], ['b', 'POTONG(t, 5, 4)', ['"SARI"', '"ASAR"', '"SAR"', '"ARI"'], ev('POTONG(t, 5, 4)')], ['c', 'POTONG(t, 7, 5)', ['"RI"', '"RI   "', 'galat', '"RIWAN"'], ev('POTONG(t, 7, 5)'), 'Karakternya hanya tersisa dua, jadi diambil sampai karakter terakhir.'], ['d', 'KECIL(POTONG(t, 1, 4)) + "!"', ['"wana!"', '"WANA!"', '"wana"', '"wanasari!"'], ev('KECIL(POTONG(t, 1, 4)) + "!"')]], done: next }); }
      else if (r === 2) { runFirst('Jalankan namaPengguna("Rina Kartika", 7)', prog('namaPengguna', ['Rina Kartika', 7]), () => rowsChoose(wrap, ctx, { prompt: 'Isi tabel nama pengguna', rows: [['r', 'namaPengguna("Rina Kartika", 7)', opt(user('Rina Kartika', 7), ['"rina7"', '"rinak07"', '"Rina07"']), user('Rina Kartika', 7)], ['b', 'namaPengguna("Bagus Prasetyo", 21)', opt(user('Bagus Prasetyo', 21), ['"bagus21"', '"bagu021"', '"pras21"']), user('Bagus Prasetyo', 21)], ['a', 'namaPengguna("Ani Lestari", 3)', opt(user('Ani Lestari', 3), ['"anil03"', '"ani3"', '"ani 03"']), user('Ani Lestari', 3), 'POTONG mengambil sampai karakter terakhir: "Ani" hanya 3 huruf.'], ['s', 'namaPengguna("Suparman", 30)', opt(user('Suparman', 30), ['"supar30"', '"supa030"', '"suparman30"']), user('Suparman', 30)]],
          done: then(() => ask('Apa gunanya bagian JIKA absen < 10?', [['Supaya nomor absen selalu dua digit, sehingga semua nama pengguna berbentuk sama, misalnya "rina07", bukan "rina7"', true], ['Supaya murid dengan absen kecil mendapat kata sandi'], ['Supaya nomor absen di atas 10 ditolak'], ['Supaya nama depan menjadi huruf kecil']])) })); }
      else if (r === 3) rowsChoose(wrap, ctx, { prompt: 'Dua murid dari Bali', rows: [['m', 'namaPengguna("Ni Made Ayu Lestari", 12)', opt(user('Ni Made Ayu Lestari', 12), ['"nima12"', '"made12"', '"lest12"']), user('Ni Made Ayu Lestari', 12)], ['k', 'namaPengguna("Ni Kadek Sari", 15)', opt(user('Ni Kadek Sari', 15), ['"nika15"', '"kade15"', '"sari15"']), user('Ni Kadek Sari', 15)]],
        done: then(() => ask('Apa masalah nama pengguna untuk kedua murid itu?', [['Hanya berisi "ni" dan nomor: tidak menunjukkan nama mereka, semua murid yang namanya diawali Ni mendapat nama pengguna yang hampir sama, dan kurang menghargai cara pemberian nama di daerah lain', true], ['Tidak ada masalah, nama pengguna boleh sependek apa pun'], ['Program berhenti dengan galat karena "Ni" kurang dari 4 huruf'], ['Nomor absennya salah karena lebih dari 10']])) });
      else if (r === 4) ask('Aturan baru: bila kata pertama kurang dari 3 huruf, pakai kata terakhir nama. Nama pengguna kedua murid itu menjadi …', [[`${show(namaBaru('Ni Made Ayu Lestari', 12))} dan ${show(namaBaru('Ni Kadek Sari', 15))}`, true], ['"made12" dan "kade15"', false], ['"ni12" dan "ni15"', false], ['"ayu12" dan "kadek15"', false]], 1, el('div', { class: 'ot-catatan' }, el('p', null, 'Jawaban lain juga bisa diterima di kelas, asalkan alasannya jelas dan aturannya bisa diterapkan untuk semua nama.')));
      else if (r === 5) { const v = (t, fix) => String(run('hitungVokal', [t], { fix })); runFirst('Jalankan hitungVokal("Indonesia")', prog('hitungVokal', ['Indonesia']), () => rowsChoose(wrap, ctx, { prompt: 'Menghitung huruf vokal', rows: [['w', 'hitungVokal("wanasari")', opt(v('wanasari'), [3, 5, 8]), v('wanasari')], ['s', 'hitungVokal("Sukamakmur")', opt(v('Sukamakmur'), [3, 5, 10]), v('Sukamakmur')], ['i', 'hitungVokal("Indonesia")', opt(v('Indonesia'), [5, 3, 9]), v('Indonesia')], ['b', 'Banyak vokal yang sebenarnya di "Indonesia"', opt(v('Indonesia', true), [4, 6, 9]), v('Indonesia', true), 'Huruf kapital "I" tidak ada di "aiueo", sehingga tidak terhitung.']],
        done: then(() => ask('Tambahkan satu baris di awal fungsi untuk memperbaiki bug itu', [['t ← KECIL(t)', true], ['jumlah ← 1'], ['t ← KAPITAL(t)'], ['UNTUK i DARI 0 SAMPAI PANJANG(t)']], 2, codeView(FN.hitungVokal))) })); }
      else if (r === 6) { const steps = []; let h = ''; for (let i = 5; i >= 1; i--) { h += 'makan'[i - 1]; steps.push(h); }
        runFirst('Telusuri balik("makan")', prog('balik', ['makan']), () => rowsChoose(wrap, ctx, { prompt: 'Isi hasil setelah setiap putaran', rows: [4, 3, 2, 1].map((i, k) => [`i${i}`, `i = ${i}, t[i] = "${'makan'[i - 1]}"`, opt(show(steps[k + 1]), [show(steps[k + 1].slice(0, -1) + 'x'), show([...steps[k + 1]].reverse().join('')), show('makan'.slice(i - 1))].filter((x) => x !== show(steps[k + 1]))).slice(0, 4), show(steps[k + 1])]), done: next })); }
      else if (r === 7) { wrap.append(codeView([...FN.balik, ...FN.palindrom])); rowsChoose(wrap, ctx, { prompt: 'Lengkapi hasil palindrom', rows: ['katak', 'makan', 'kasur rusak', 'Malam'].map((w) => [w, `palindrom("${w}")`, ['BENAR', 'SALAH'], fmt(run('palindrom', [w]))]),
        done: then(() => ask('Spasi di "kasur rusak" tidak mengganggu pemeriksaan. Mengapa?', [['Spasinya tepat di tengah (karakter ke-6 dari 11), sehingga tetap di tempat yang sama setelah teks dibalik', true], ['Fungsi balik melewati spasi'], ['Spasi tidak dihitung oleh PANJANG'], ['Karena kedua kata sama panjang, spasi selalu boleh diabaikan']], 1, chars('kasur rusak'))) }); }
      else if (r === 8) ask(`balik("Malam") = ${show(run('balik', ['Malam']))}. Bagaimana memperbaiki fungsi palindrom?`, [['KEMBALIKAN balik(KECIL(t)) = KECIL(t)', true], ['KEMBALIKAN balik(t) ≠ t'], ['KEMBALIKAN KECIL(balik(t)) = t'], ['KEMBALIKAN balik(balik(t)) = t']], 1, el('div', null, chars('Malam'), chars(run('balik', ['Malam']), { label: 'balik' })));
      else { const out = run('balikKata', ['aku suka sate ayam']); rowsChoose(wrap, ctx, { prompt: 'Lengkapi balikKata: "aku suka sate ayam" → "ayam sate suka aku"', cls: 'kode', rows: [['d', 'UNTUK i DARI … TURUN SAMPAI 1', ['PANJANG(kata) − 1', 'PANJANG(kata)', 'PANJANG(kalimat)', '1'], 'PANJANG(kata) − 1', 'Kata terakhir sudah diambil di baris hasil ← kata[PANJANG(kata)].'], ['h', 'hasil ← hasil + … + kata[i]', ['" "', '""', 'kata[i]', 'i'], '" "'], ['o', 'Hasil', [show(out), '"mayaetasakusuka"', '"ayamsatesukaaku"', '"maya etas akus uka"'], show(out)]],
        done: then(() => { const a = run('hitungKata', ['saya suka membaca']); const b = run('hitungKata', ['saya  suka membaca']); ask(`Tantangan: hitungKata("saya suka membaca") = ${a}, hitungKata("saya␣␣suka membaca") = ${b}. Mengapa yang kedua salah, dan bagaimana memperbaikinya?`, [['Dua spasi berurutan dihitung dua kali; hitung awal kata saja: karakter bukan spasi yang berada di indeks 1 atau tepat setelah spasi', true], ['PANJANG tidak menghitung spasi kedua; ganti dengan PISAH'], ['Kalimatnya terlalu panjang; potong menjadi 10 karakter'], ['Tidak ada yang salah, kalimat kedua memang 4 kata']], 1, el('div', null, chars('saya  suka membaca'), codeView(FN.hitungKata))); }) }); }
    }
    render();
  },
};

const TRACE_FN = { hitungVokal: 'hitungVokal', hitungVokalFix: 'hitungVokal (diperbaiki)', balik: 'balik', palindrom: 'palindrom', balikKata: 'balikKata', hitungKata: 'hitungKata' };
const textInput = (value, onInput, label = 'Teks', max = 24) => { const inp = el('input', { type: 'text', value, maxlength: String(max), 'aria-label': label, autocomplete: 'off', spellcheck: 'false' }); inp.addEventListener('input', () => onInput(inp.value)); return el('label', { class: 'ot-input' }, el('small', null, label), inp); };

function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act olah-teks' });
  root.append(wrap);
  let fnName = 'hitungVokal'; let text = 'Indonesia'; let tr = null; const host = el('div');
  const build = () => { tr?.stop(); const fix = fnName.endsWith('Fix'); const n = fix ? 'hitungVokal' : fnName; tr = textTracer(prog(n, [text.replace(/"/g, "'")], { fix })); host.replaceChildren(tr); };
  wrap.append(el('p', { class: 'prompt' }, 'Penelusur teks'),
    el('div', { class: 'ot-pilih' }, el('div', { class: 'seg' }, Object.entries(TRACE_FN).map(([k, t]) => onTap(el('button', { class: `seg-btn ${fnName === k ? 'on' : ''}`, type: 'button' }, t), (e) => { fnName = k; e.currentTarget.parentNode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); build(); }))),
      textInput(text, (v) => { text = v; build(); }, 'Ketik teks (maksimal 24 karakter)'), el('small', null, 'Teks yang diketik hanya dipakai di layar dan tidak disimpan.')), host);
  build();
}

function createNames(root, ctx) {
  const wrap = el('div', { class: 'act olah-teks' });
  root.append(wrap);
  let nama = 'Ni Luh Sari'; let absen = 5; let baru = false; const list = el('div');
  const gen = (n, a) => (baru ? namaBaru(n, a) : run('namaPengguna', [n.replace(/"/g, ''), a]));
  const draw = () => {
    const all = [...KELAS, [nama.trim() || '?', absen]].filter(([n]) => n.trim() && n !== '?');
    const users = all.map(([n, a]) => [n, a, gen(n, a)]);
    const head = (u) => u.replace(/\d+$/, '');
    list.replaceChildren(el('table', { class: 'ot-tabel' }, el('tr', null, el('th', null, 'Nama (rekaan)'), el('th', null, 'Absen'), el('th', null, 'Nama pengguna'), el('th', null, 'Catatan')),
      users.map(([n, a, u], k) => { const same = users.filter((x) => head(x[2]) === head(u)).length; const own = k === users.length - 1 && nama.trim();
        return el('tr', { class: `${own ? 'baru' : ''} ${same > 1 ? 'mirip' : ''}` }, el('td', null, n), el('td', null, String(a)), el('td', null, el('code', null, u)), el('td', null, same > 1 ? `mirip dengan ${same - 1} nama lain` : head(u).length < 3 ? 'terlalu pendek' : '')); })));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Pembuat nama pengguna'),
    el('div', { class: 'ot-pilih' }, textInput(nama, (v) => { nama = v.replace(/\s+/g, ' ').replace(/^ /, ''); draw(); }, 'Nama rekaan', 30),
      el('label', { class: 'ot-input' }, el('small', null, 'Nomor absen'), (() => { const i = el('input', { type: 'number', min: '1', max: '40', value: String(absen) }); i.addEventListener('input', () => { absen = Math.max(1, Math.min(40, Math.round(Number(i.value)) || 1)); draw(); }); return i; })()),
      el('div', { class: 'seg' }, [['Aturan lembar kerja', false], ['Aturan baru: kata terakhir bila kata pertama < 3 huruf', true]].map(([t, v]) => onTap(el('button', { class: `seg-btn ${baru === v ? 'on' : ''}`, type: 'button' }, t), (e) => { baru = v; e.currentTarget.parentNode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw(); }))),
      el('small', null, 'Gunakan nama rekaan. Nama yang diketik hanya dipakai di layar dan tidak disimpan.')), list);
  draw();
}

export function palinCheck(t, { kapital = false, spasi = false } = {}) { let s = t; if (kapital) s = s.toLowerCase(); if (spasi) s = s.replace(/ /g, ''); const rev = [...s].reverse().join(''); return { s, rev, ok: s === rev }; }
function createPalin(root, ctx) {
  const wrap = el('div', { class: 'act olah-teks' });
  root.append(wrap);
  let text = 'Malam'; let kapital = false; let spasi = false; const out = el('div', { class: 'ot-palin' });
  const draw = () => {
    const { s, rev, ok } = palinCheck(text, { kapital, spasi });
    out.replaceChildren(el('small', null, 'Teks yang diperiksa'), chars(s), el('small', null, 'Setelah dibalik'), chars(rev, { label: 'balik' }), el('p', { class: ok ? 'sk-beres' : 'sk-galat' }, ok ? '✓ BENAR: palindrom' : '✗ SALAH: bukan palindrom'),
      codeView([FN.palindrom[0], `    KEMBALIKAN balik(${kapital ? 'KECIL(t)' : 't'}${spasi ? ' tanpa spasi' : ''}) = ${kapital ? 'KECIL(t)' : 't'}${spasi ? ' tanpa spasi' : ''}`]));
  };
  const tog = (label, get, set) => onTap(el('button', { class: `seg-btn ${get() ? 'on' : ''}`, type: 'button' }, `${get() ? '☑' : '☐'} ${label}`), (e) => { set(!get()); e.currentTarget.classList.toggle('on', get()); e.currentTarget.textContent = `${get() ? '☑' : '☐'} ${label}`; draw(); });
  const inputWrap = el('div');
  const setText = (v) => { text = v; inputWrap.replaceChildren(textInput(text, (x) => { text = x; draw(); }, 'Ketik teks (maksimal 24 karakter)')); draw(); };
  wrap.append(el('p', { class: 'prompt' }, 'Pemeriksa palindrom'),
    el('div', { class: 'ot-pilih' }, el('div', { class: 'seg' }, ['katak', 'makan', 'kasur rusak', 'Malam', 'Ibu Ratna antar ubi', 'Kodok'].map((w) => onTap(el('button', { class: 'seg-btn', type: 'button' }, w), () => setText(w)))), inputWrap,
      el('div', { class: 'seg' }, tog('abaikan huruf kapital', () => kapital, (v) => { kapital = v; }), tog('abaikan spasi', () => spasi, (v) => { spasi = v; }))), out);
  setText(text);
}

// Team mode: output options for a function and input.
export const GAME_FN = ['hitungVokal', 'balik', 'palindrom', 'balikKata', 'hitungKata'];
export const PRESETS = ['Indonesia', 'katak', 'Malam', 'kasur rusak', 'aku suka sate ayam', 'ULANGAN', 'saya  suka membaca', 'Wanasari'];
export function gameOpts(name, t) {
  const right = show(run(name, [t]));
  if (name === 'palindrom') return { right, opts: ['BENAR', 'SALAH'] };
  let alts;
  if (name === 'hitungVokal' || name === 'hitungKata') { const n = run(name, [t]); alts = [n - 1, n + 1, name === 'hitungVokal' ? run('hitungVokal', [t], { fix: true }) : t.split(' ').filter(Boolean).length, n + 2].map(String); }
  else if (name === 'balik') alts = [show(t), show(run('balikKata', [t])), show(run('balik', [t]).toLowerCase()), show(run('balik', [t]).slice(1))];
  else alts = [show(run('balik', [t])), show(t), show(t.split(' ').slice(1).concat(t.split(' ')[0]).join(' ')), show(t.split(' ').reverse().join('')), show(t.toUpperCase()), show(`${t} ${t}`)];
  const opts = [...new Set([right, ...alts.filter((x) => x !== right && x !== '"-1"' && x !== '-1')])].slice(0, 4);
  return { right, opts };
}
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act olah-teks' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Tebak keluaran selesai', pts, again: () => pickTeams(wrap, 'Tebak Keluaran', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; let fnName = GAME_FN[k % GAME_FN.length]; let text = PRESETS[k % PRESETS.length];
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: pilih fungsi dan masukannya, lalu Serahkan.`);
      const inputWrap = el('div');
      const setText = (v) => { text = v; inputWrap.replaceChildren(textInput(text, (x) => { text = x; }, 'Masukan (maksimal 24 karakter)')); };
      const host = el('div', { class: 'ot-giliran' }, el('div', { class: 'seg' }, GAME_FN.map((f) => onTap(el('button', { class: `seg-btn ${f === fnName ? 'on' : ''}`, type: 'button' }, f), (e) => { fnName = f; e.currentTarget.parentNode.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }))),
        el('div', { class: 'seg' }, PRESETS.map((w) => onTap(el('button', { class: 'seg-btn', type: 'button' }, w.replace(/ {2}/, '␣␣')), () => setText(w)))), inputWrap, button('Serahkan ke tim lawan', guess, 'primary'));
      setText(text);
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} memilih, Tim ${guesser + 1} menebak keluaran`), host, msg);
      function guess() {
        const t = text.replace(/"/g, "'"); if (!t.trim()) { say(msg, 'bad', 'Masukan tidak boleh kosong.'); return; }
        const { right, opts } = gameOpts(fnName, t);
        say(msg, '', `Tim ${guesser + 1}: apa keluaran ${fnName}(${show(t)})?`);
        host.replaceChildren(codeView([...(fnName === 'palindrom' ? FN.balik : []), ...FN[fnName]]), chars(t), el('div', { class: 'opts', style: { '--cols': 2 } }, ctx.rand.shuffle(opts).map((o) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, o)), (e) => {
          if (host.classList.contains('selesai')) return; host.classList.add('selesai');
          const ok = o === right; if (ok) pts[guesser] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', `${ok ? `Tepat! Tim ${guesser + 1} +2.` : 'Belum tepat.'} ${fnName}(${show(t)}) = ${right}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4800);
        }))));
      }
    }
    turn();
  }
  pickTeams(wrap, 'Tebak Keluaran', start);
}
