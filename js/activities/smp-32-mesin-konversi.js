// Mesin Konversi Satuan — SMP (13–15 tahun), coding. Functions as machines:
// parameters, arguments and return values, functions that call functions
// (a visible call stack), a function that only prints (Raka), shortening a
// copy-paste program (Pak Darmo, bug on line 7), and guessing a secret rule.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, tracer, stepper, codeView } from './smp-kit.js';
import { runAll, fmt } from './pseudo.js';

export const FN = {
  keFahrenheit: ['FUNGSI keFahrenheit(c)', '    KEMBALIKAN c × 9 / 5 + 32'],
  keAre: ['FUNGSI keAre(m2)', '    KEMBALIKAN m2 / 100'],
  keHektare: ['FUNGSI keHektare(m2)', '    KEMBALIKAN keAre(m2) / 100'],
  genap: ['FUNGSI genap(n)', '    KEMBALIKAN n MOD 2 = 0'],
  dapatAir: ['FUNGSI dapatAir(petak, tanggal)', '    KEMBALIKAN genap(petak) = genap(tanggal)'],
  luasPetak: ['FUNGSI luasPetak(panjang, lebar)', '    KEMBALIKAN keHektare(panjang × lebar)'],
  keCelsius: ['FUNGSI keCelsius(f)', '    KEMBALIKAN (f − 32) × 5 / 9'],
};
export const raka = (kembali = false) => ['FUNGSI keAreRaka(m2)', `    ${kembali ? 'KEMBALIKAN' : 'TAMPILKAN'} m2 / 100`];
export const NEEDS = { keHektare: ['keAre'], dapatAir: ['genap'], luasPetak: ['keHektare', 'keAre'] };
export const LIB = Object.values(FN).flat();
// Lines for the functions a call needs, then the main program.
export const progFor = (name, main) => [...[name, ...(NEEDS[name] || [])].reverse().flatMap((n) => FN[n]), ...main];
export const call = (expr, name = expr.match(/^\w+/)[0]) => runAll(progFor(name, [`hasil ← ${expr}`]));
export const val = (expr) => fmt(call(expr).vars.hasil);
export const RAKA_MAIN = ['total ← keAreRaka(2500) + keAreRaka(1500)', 'TAMPILKAN total'];
export const DARMO = (fix = false) => [2500, 14000, 10000, 6000].flatMap((L, k) => [`luas${k + 1} ← ${L}`, `are${k + 1} ← luas${k + 1} / 100`, `ha${k + 1} ← are${k + 1} / ${k === 1 && !fix ? 10 : 100}`, `TAMPILKAN "Petak ${k + 1}", are${k + 1}, "are", ha${k + 1}, "ha"`]);
export const RINGKAS = ['luas ← [2500, 14000, 10000, 6000]', 'UNTUK i DARI 1 SAMPAI 4', '    TAMPILKAN "Petak", i, keAre(luas[i]), "are", keHektare(luas[i]), "ha"'];
export const secret = (a, b) => (n) => a * n + b;

// Nested machines from the call record of a run.
function machines(calls, { screen = [], running = false } = {}) {
  const root = el('div', { class: 'mk-mesin-wadah' }); const stack = [root];
  for (const c of calls) {
    while (stack.length > c.depth) stack.pop();
    const body = el('div', { class: 'mk-dalam' });
    const box = el('div', { class: `mk-mesin d${Math.min(c.depth, 3)}` }, el('div', { class: 'mk-corong' }, `⬇ ${c.args.map((a) => fmt(a)).join(', ')}`), el('b', null, `⚙️ ${c.name}`), body,
      c.ret === undefined && running ? el('div', { class: 'mk-saluran' }, '⬇ …') : el('div', { class: `mk-saluran ${c.ret === undefined ? 'kosong' : ''}` }, c.ret === undefined ? '⬇ (kosong)' : `⬇ ${fmt(c.ret)}`));
    stack[stack.length - 1].append(box); stack.push(body);
  }
  if (screen.length) root.append(el('div', { class: 'mk-layar' }, el('small', null, '📺 Layar'), el('b', null, screen.join('  '))));
  return root;
}

export default {
  id: 'smp-32-mesin-konversi',
  title: 'Mesin Konversi Satuan',
  topic: 'Fungsi: parameter, argumen, nilai kembalian, fungsi yang memanggil fungsi, TAMPILKAN atau KEMBALIKAN, dan meringkas program',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '⚙️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Jalankan mesin-mesin fungsi Klub Sains, telusuri fungsi yang memanggil fungsi lain, perbaiki fungsi Raka yang hanya menampilkan, ringkas program Pak Darmo, dan tebak aturan fungsi rahasia.',
  extraModes: [
    { id: 'mesin', icon: '⚙️', label: 'Mesin Fungsi', desc: 'Masukkan angka ke corong mesin; mesin yang memanggil mesin lain menampilkan mesin kecil di dalamnya. Coba juga fungsi Raka dengan TAMPILKAN atau KEMBALIKAN', create: createMachine },
    { id: 'ringkas', icon: '✂️', label: 'Ringkas Program', desc: 'Program Pak Darmo dan program dengan fungsi berdampingan; ubah rumus di dalam fungsi dan lihat semua petak ikut berubah', create: createShort },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Fungsi Rahasia', desc: 'Satu tim membuat fungsi rahasia, tim lain memasukkan angka sesedikit mungkin lalu menebak aturannya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mesin-konversi' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const opt = (right, wrong) => [...new Set([String(right), ...wrong.map(String)])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
      const row = (expr, wrong, why) => [expr, expr, opt(val(expr), wrong), val(expr), why];
      const lib = (names) => el('div', { class: 'mk-pustaka' }, codeView(names.flatMap((n) => FN[n])));
      if (r === 0) { wrap.append(lib(['keFahrenheit', 'keAre'])); rowsChoose(wrap, ctx, { prompt: 'Jalankan mesin: berapa nilai yang dikembalikan?', rows: [row('keFahrenheit(30)', [62, 54, 70]), row('keFahrenheit(100)', [180, 132, 100]), row('keFahrenheit(0)', [0, 9, 5]), row('keAre(2500)', [250, 2.5, 2600].map((x) => fmt(x)))], done: next }); }
      else if (r === 1) { wrap.append(lib(['keFahrenheit', 'genap'])); rowsChoose(wrap, ctx, { prompt: 'Jalankan mesin lagi', rows: [row('keFahrenheit(−40)', ['−8', '40', '−72']), row('keFahrenheit(37)', ['66,6', '98', '69']), row('genap(14)', ['SALAH', '0', '7']), row('genap(7)', ['BENAR', '1', '3,5'])],
        done: then(() => ask('Apa yang istimewa dari keFahrenheit(−40)?', [['Hasilnya −40: pada −40, angka Celsius dan Fahrenheit sama', true], ['Hasilnya 0, titik beku air'], ['Mesin tidak bisa menerima bilangan negatif'], ['Hasilnya selalu lebih besar dari masukan']])) }); }
      else if (r === 2) rowsChoose(wrap, ctx, { prompt: 'Baris x ← keAre(2500) + 5', info: 'Parameter adalah nama di dalam kurung pada baris FUNGSI; argumen adalah nilai yang dikirim saat fungsi dipanggil.', rows: [['p', 'Parameter fungsi keAre', ['m2', '2500', '25', 'x'], 'm2'], ['a', 'Argumen yang dikirim', ['m2', '2500', '25', '5'], '2500'], ['k', 'Nilai kembalian keAre(2500)', ['2500', '25', '30', '0,25'], '25'], ['x', 'Isi x', ['25', '30', '2505', '7,5'], fmt(runAll([...FN.keAre, 'x ← keAre(2500) + 5']).vars.x)], ['d', 'dapatAir: banyak parameter · tipe kembalian', ['2 · benar/salah', '1 · bilangan', '2 · bilangan', '4 · teks'], '2 · benar/salah']], done: next });
      else if (r === 3) { const lines = progFor('keHektare', ['h ← keHektare(2500)']); const res = runAll(lines); const tr = tracer(lines, { speed: 500, onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Lengkapi tumpukan pemanggilan keHektare(2500)', rows: [['a', 'memanggil keAre(2500) → mengembalikan', ['25', '2500', '0,25', '250'], fmt(res.calls[1].ret)], ['b', 'menghitung … / 100', ['25', '2500', '250'], '25'], ['c', 'keHektare mengembalikan', ['0,25', '25', '2,5', '0,025'], fmt(res.vars.h)], ['d', 'keHektare(14000)', ['1,4', '14', '140', '0,14'], val('keHektare(14000)')]], done: next })), 1400),
        extra: (st) => machines(st.calls, { running: !st.done && !st.error }) }); wrap.append(el('p', { class: 'prompt' }, 'Jalankan keHektare(2500) dan perhatikan mesin di dalam mesin'), tr); }
      else if (r === 4) { const res = call('luasPetak(125, 80)'); wrap.append(machines(res.calls)); rowsChoose(wrap, ctx, { prompt: 'luasPetak(125, 80)', rows: [['v', 'Nilai kembalian (hektare)', opt(fmt(res.vars.hasil), ['10000', '100', '0,1']), fmt(res.vars.hasil)], ['u', 'Urutan fungsi yang dipanggil', ['luasPetak → keHektare(10000) → keAre(10000)', 'keAre → keHektare → luasPetak', 'luasPetak → keAre(125) → keHektare(80)'], 'luasPetak → keHektare(10000) → keAre(10000)', 'Hasilnya kembali berurutan: keAre mengembalikan 100, keHektare 1, luasPetak 1.']], done: next }); }
      else if (r === 5) rowsChoose(wrap, ctx, { prompt: 'Anjuran pupuk 250 kg per hektare. Petak 2.500 m²', rows: [['c', 'pupuk ← …', ['keHektare(2500) × 250', 'keAre(2500) × 250', 'keHektare(250) × 2500', '2500 × 250'], 'keHektare(2500) × 250'], ['h', 'Hasil', ['62,5 kg', '6250 kg', '625000 kg', '25 kg'], `${fmt(runAll(progFor('keHektare', ['p ← keHektare(2500) × 250'])).vars.p)} kg`]], done: next });
      else if (r === 6) { wrap.append(lib(['genap', 'dapatAir'])); const tri = (p, t) => { const g = (x) => (x % 2 === 0 ? 'BENAR' : 'SALAH'); return `${g(p)} · ${g(t)} · ${val(`dapatAir(${p}, ${t})`)}`; }; const all = ['BENAR · BENAR · BENAR', 'SALAH · BENAR · SALAH', 'SALAH · SALAH · BENAR', 'BENAR · SALAH · SALAH', 'SALAH · SALAH · SALAH'];
        rowsChoose(wrap, ctx, { prompt: 'Giliran air: genap(petak) · genap(tanggal) · dapatAir', info: 'BENAR bila keduanya sama-sama BENAR atau sama-sama SALAH.', rows: [[4, 12], [7, 12], [7, 13], [10, 1]].map(([p, t]) => [`${p}-${t}`, `dapatAir(${p}, ${t})`, all.slice(0, 4), tri(p, t)]), done: next }); }
      else if (r === 7) { const lines = [...raka(), ...RAKA_MAIN]; const tr = tracer(lines, { speed: 500, onEnd: () => setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Fungsi Raka yang hanya menampilkan', rows: [['l', 'Yang muncul di layar', ['25 dan 15', '40', '0,4', 'tidak ada'], '25 dan 15'], ['t', 'Isi total', ['40', 'tidak berisi bilangan: keAreRaka tidak mengembalikan apa pun', '2515', '0'], 'tidak berisi bilangan: keAreRaka tidak mengembalikan apa pun'], ['f', 'Perbaikan baris 2', ['KEMBALIKAN m2 / 100', 'TAMPILKAN m2 / 10', 'TAMPILKAN total', 'hapus baris 2'], 'KEMBALIKAN m2 / 100', 'Bila ingin dilihat, tampilkan di luar fungsi: TAMPILKAN keAreRaka(2500).']],
        done: then(() => ask('Mengapa keHektare tidak bisa memakai keAreRaka?', [['keHektare butuh nilai yang dikembalikan untuk dibagi 100, sedangkan keAreRaka hanya menampilkannya ke layar', true], ['Karena nama fungsinya berbeda'], ['Karena keAreRaka punya dua parameter'], ['Karena hasil keAreRaka terlalu besar']])) })), 1600), extra: (st) => machines(st.calls, { screen: st.out, running: !st.done && !st.error && st.frames.length > 0 }) });
        wrap.append(el('p', { class: 'prompt' }, 'Jalankan total ← keAreRaka(2500) + keAreRaka(1500)'), tr); }
      else if (r === 8) { const out = runAll(DARMO()).out; let found = false; const msg = el('p', { class: 'reveal info' }, 'Ketuk baris yang salah karena salin-tempel.');
        const code = codeView(DARMO(), { cls: 'mk-darmo', onLine: (i) => { if (found) return; if (i !== 6) { ctx.mistake(); say(msg, 'bad', `Baris ${i + 1} benar. Bandingkan baris-baris yang mirip.`); return; } found = true; ctx.sound.good(); say(msg, '', 'Baris 7 membagi dengan 10, seharusnya 100.'); setTimeout(then(() => rowsChoose(wrap, ctx, { prompt: 'Akibat bug baris 7', rows: [['s', 'Petak 2 tercatat …', ['14 ha', '1,4 ha', '140 ha', '0,14 ha'], `${out[1].split(' ')[4]} ha`], ['b', 'Seharusnya …', ['1,4 ha', '14 ha', '140 ha'], `${runAll(DARMO(true)).out[1].split(' ')[4]} ha`]],
          done: then(() => ask('Program baru dengan larik dan fungsi. Keuntungannya?', [['Lebih pendek dan rumus hanya ditulis sekali, jadi bug salin-tempel tidak bisa terjadi dan perbaikan cukup di satu tempat', true], ['Program lebih cepat karena komputer tidak perlu membagi'], ['Tidak perlu menguji program lagi'], ['Hasilnya selalu bilangan bulat']], 1, el('div', null, codeView(RINGKAS), el('pre', { class: 'mk-keluaran' }, runAll([...FN.keAre, ...FN.keHektare, ...RINGKAS]).out.join('\n'))))) })), 1600); } });
        wrap.append(el('p', { class: 'prompt' }, 'Program Pak Darmo sebelum mengenal fungsi'), el('div', { class: 'mk-dua' }, code, el('pre', { class: 'mk-keluaran' }, out.join('\n'))), msg); }
      else { const f = secret(2, 3); rowsChoose(wrap, ctx, { prompt: 'Fungsi rahasia: 1 → 5, 2 → 7, 3 → 9, 10 → 23', rows: [['k', 'KEMBALIKAN …', ['2 × n + 3', 'n + 4', '3 × n + 2', '2 × n + 1'], '2 × n + 3', 'Setiap n naik 1, hasil naik 2; lalu 2 × 1 + 3 = 5.'], ['z', 'rahasia(0)', ['3', '0', '5', '2'], String(f(0))]],
        done: then(() => { const c = runAll([...FN.keFahrenheit, ...FN.keCelsius, 'a ← keCelsius(212)', 'b ← keCelsius(98.6)', 'c ← keCelsius(keFahrenheit(25))']).vars; ask(`Tantangan: keCelsius(212) = ${fmt(c.a)}, keCelsius(98.6) = ${fmt(c.b)}, keCelsius(keFahrenheit(25)) = ${fmt(c.c)}. Mengapa hasil terakhir selalu sama dengan masukan?`, [['keCelsius adalah fungsi kebalikan keFahrenheit: langkahnya membatalkan langkah keFahrenheit dengan urutan terbalik', true], ['Karena 25 adalah bilangan istimewa'], ['Karena kedua fungsi memakai angka 32'], ['Karena komputer membulatkan hasilnya']], 1, codeView(FN.keCelsius)); }) }); }
    }
    render();
  },
};

const MACHINES = {
  keFahrenheit: [[30], [0, 37, 100, -40]],
  keAre: [[2500], [1500, 6000, 14000]],
  keHektare: [[2500], [10000, 14000, 6000]],
  genap: [[14], [7, 0, 13]],
  dapatAir: [[4, 12], [7, 12, 13, 10, 1]],
  luasPetak: [[125, 80], [100, 50, 200]],
  keCelsius: [[212], [32, 98.6, -40]],
  keAreRaka: [[2500, 1500], [6000, 14000]],
};

function createMachine(root, ctx) {
  const wrap = el('div', { class: 'act mesin-konversi' });
  root.append(wrap);
  let name = 'keHektare'; let args = [...MACHINES[name][0]]; let slot = 0; let kembali = false; let res = null;
  const draw = () => {
    const isRaka = name === 'keAreRaka';
    const lines = isRaka ? [...raka(kembali), `total ← keAreRaka(${args[0]}) + keAreRaka(${args[1]})`] : progFor(name, [`hasil ← ${name}(${args.join(', ')})`]);
    const code = isRaka ? lines : [...(NEEDS[name] || []).slice().reverse().flatMap((n) => FN[n]), ...FN[name]];
    const pool = [...new Set([...MACHINES[name][0], ...MACHINES[name][1]])];
    wrap.replaceChildren(...[el('p', { class: 'prompt' }, 'Mesin fungsi'),
      el('div', { class: 'seg' }, Object.keys(MACHINES).map((k) => onTap(el('button', { class: `seg-btn ${name === k ? 'on' : ''}`, type: 'button' }, k), () => { name = k; args = [...MACHINES[k][0]]; slot = 0; res = null; draw(); }))),
      isRaka ? el('div', { class: 'seg' }, [['TAMPILKAN', false], ['KEMBALIKAN', true]].map(([t, v]) => onTap(el('button', { class: `seg-btn ${kembali === v ? 'on' : ''}`, type: 'button' }, `baris 2: ${t}`), () => { kembali = v; res = null; draw(); }))) : null,
      el('div', { class: 'mk-kerja' },
        el('div', null, codeView(code), el('div', { class: 'mk-masuk' }, args.map((a, i) => onTap(el('button', { class: `mk-slot ${slot === i ? 'pilih' : ''}`, type: 'button' }, el('small', null, `masukan ${i + 1}`), el('b', null, fmt(a))), () => { slot = i; draw(); }))),
          el('div', { class: 'mk-angka' }, el('small', null, 'Ketuk angka untuk dimasukkan ke corong:'), pool.map((v) => onTap(el('button', { class: 'mk-chip', type: 'button' }, fmt(v)), () => { args[slot] = v; slot = (slot + 1) % args.length; res = null; draw(); })),
            stepper(args[slot], (v) => { args[slot] = v; res = null; }, { step: 1, label: 'atau atur' })),
          button('⚙️ Jalankan mesin', () => { res = runAll(lines); draw(); }, 'primary')),
        res ? el('div', { class: 'mk-hasil' }, machines(res.calls, { screen: res.out }), res.error ? el('p', { class: 'sk-galat' }, `⚠ ${res.error.message}`) : el('p', { class: 'sk-beres' }, isRaka ? `total = ${fmt(res.vars.total)}` : `${name}(${args.map((a) => fmt(a)).join(', ')}) = ${fmt(res.vars.hasil)}`)) : el('div', { class: 'mk-hasil kosong' }, 'Mesin menunggu masukan…'))].filter(Boolean));
  };
  draw();
}

function createShort(root, ctx) {
  const wrap = el('div', { class: 'act mesin-konversi' });
  root.append(wrap);
  let fix = false; let bagiAre = 100; let bagiHa = 100;
  const draw = () => {
    const f = [`FUNGSI keAre(m2)`, `    KEMBALIKAN m2 / ${bagiAre}`, 'FUNGSI keHektare(m2)', `    KEMBALIKAN keAre(m2) / ${bagiHa}`];
    const a = runAll(DARMO(fix)); const b = runAll([...f, ...RINGKAS]);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ringkas program'),
      el('div', { class: 'mk-dua' },
        el('div', null, el('b', null, `Program Pak Darmo (${DARMO().length} baris)`), codeView(DARMO(fix), { warn: fix ? [] : [6], cls: 'mk-darmo' }), button(fix ? 'Kembalikan baris 7 (/ 10)' : 'Perbaiki baris 7 (/ 100)', () => { fix = !fix; draw(); }), el('pre', { class: 'mk-keluaran' }, a.out.join('\n'))),
        el('div', null, el('b', null, `Dengan fungsi (${RINGKAS.length} baris + fungsi)`), codeView([...f, ...RINGKAS]),
          el('div', { class: 'mk-atur' }, stepper(bagiAre, (v) => { bagiAre = v; draw(); }, { min: 10, max: 1000, step: 10, label: 'keAre membagi' }), stepper(bagiHa, (v) => { bagiHa = v; draw(); }, { min: 10, max: 1000, step: 10, label: 'keHektare membagi' })),
          el('pre', { class: 'mk-keluaran' }, b.out.join('\n')), el('small', null, 'Ubah rumus di dalam fungsi: keluaran semua petak langsung ikut berubah.'))));
  };
  draw();
}

export const RULES = [[2, 3], [3, 1], [1, 5], [4, 0], [5, 2], [2, 7], [3, 4], [10, 1]];
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act mesin-konversi' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const total = Math.max(6, nT * 2);
    function turn() {
      if (k >= total) { finishBoard(wrap, ctx, { title: 'Fungsi rahasia selesai', pts, again: () => pickTeams(wrap, 'Fungsi Rahasia', start) }); return; }
      const maker = k % nT; const guesser = (k + 1) % nT; let a = RULES[k % RULES.length][0]; let b = RULES[k % RULES.length][1];
      const msg = el('p', { class: 'reveal info' }, `Tim ${maker + 1}: atur rumus rahasia KEMBALIKAN a × n + b (tim lain jangan melihat), lalu Serahkan.`);
      const host = el('div', { class: 'mk-giliran' }, stepper(a, (v) => { a = v; }, { min: 0, max: 10, label: 'a' }), stepper(b, (v) => { b = v; }, { min: 0, max: 20, label: 'b' }), button('Serahkan ke tim lawan', play, 'primary'));
      wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Ronde ${k + 1}: Tim ${maker + 1} membuat fungsi rahasia, Tim ${guesser + 1} menebak`), host, msg);
      function play() {
        const f = secret(a, b); const log = []; let n = 1; let ga = 1; let gb = 0; let done = false;
        const draw = () => host.replaceChildren(
          el('div', { class: 'mk-mesin d1' }, el('b', null, '⚙️ rahasia(n)'), el('div', { class: 'mk-log' }, log.length ? log.map(([x, y]) => el('span', null, `${x} → ${y}`)) : el('small', null, 'Belum ada masukan'))),
          el('div', { class: 'mk-atur' }, stepper(n, (v) => { n = v; }, { min: 0, max: 50, label: 'masukan n' }), button('Masukkan', () => { if (done) return; log.push([n, f(n)]); ctx.sound.tap(); draw(); })),
          el('div', { class: 'mk-atur' }, el('span', null, 'Tebakan: KEMBALIKAN'), stepper(ga, (v) => { ga = v; }, { min: 0, max: 10, label: 'a' }), el('span', null, '× n +'), stepper(gb, (v) => { gb = v; }, { min: 0, max: 20, label: 'b' }), button('Tebak', guess, 'primary')));
        function guess() {
          if (done) return; done = true; const ok = ga === a && gb === b; const gain = ok ? Math.max(1, 5 - Math.max(0, log.length - 2)) : 0; pts[guesser] += gain; if (!ok) pts[maker] += 1;
          ctx.sound[ok ? 'good' : 'bad']();
          say(msg, ok ? '' : 'bad', `${ok ? `Tepat dengan ${log.length} masukan! Tim ${guesser + 1} +${gain}.` : `Belum tepat, Tim ${maker + 1} +1.`} Rumus rahasia: KEMBALIKAN ${a} × n + ${b}.`);
          wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, maker)); k++; setTimeout(turn, 4800);
        }
        say(msg, '', `Tim ${guesser + 1}: masukkan angka satu per satu, lalu tebak a dan b. Makin sedikit masukan, makin besar nilainya (2 masukan: 5 poin).`);
        draw();
      }
    }
    turn();
  }
  pickTeams(wrap, 'Fungsi Rahasia', start);
}
