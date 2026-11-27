// Pengurutan Sisip dan Pencarian Biner dalam Python — SMA/SMK (16–18 tahun),
// coding. Queue numbers at a puskesmas: tracing insertion sort and binary
// search in mini-py, loop invariants, random versus nearly sorted data (fixed
// worksheet times), three off-by-one bugs, sorted() and bisect.
// Counting rule: a check is each evaluation of `a[j] > kunci`, a shift is each
// run of `a[j + 1] = a[j]`.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, pyTracer, stepper, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, layar, play } from './misi-kit.js';
import { runPy, makePyRunner, pyRepr } from './mini-py.js';

export const SISIP = ['def urut_sisip(a):', '    for i in range(1, len(a)):', '        kunci = a[i]', '        j = i - 1', '        while j >= 0 and a[j] > kunci:', '            a[j + 1] = a[j]', '            j = j - 1', '        a[j + 1] = kunci', '    return a'];
export const CARI = ['def cari_biner(a, x):', '    kiri = 0', '    kanan = len(a) - 1', '    while kiri <= kanan:', '        tengah = (kiri + kanan) // 2', '        if a[tengah] == x:', '            return tengah', '        elif a[tengah] < x:', '            kiri = tengah + 1', '        else:', '            kanan = tengah - 1', '    return -1'];
export const MASUK = [104, 101, 105, 102, 106, 103];
export const ANTREAN = [101, 102, 104, 105, 107, 108, 109, 111, 112, 114, 115, 117, 118, 119, 120];
export const HAMPIR = [101, 102, 104, 103, 105, 107, 106, 108];
export const TERBALIK = [108, 107, 106, 105, 104, 103, 102, 101];
// Off-by-one versions: [id, label, which function, line index, new text].
export const VERSI = [['benar', 'versi benar', null, null, null], ['A', 'versi A: baris 2 range(1, len(a) - 1)', 'sisip', 1, '    for i in range(1, len(a) - 1):'], ['B', 'versi B: baris 5 j > 0', 'sisip', 4, '        while j > 0 and a[j] > kunci:'], ['C', 'versi C: baris 13 kiri < kanan', 'cari', 3, '    while kiri < kanan:'],
  ['K', 'baris 12 kanan = len(a)', 'cari', 2, '    kanan = len(a)'], ['R', 'baris 2 range(2, len(a))', 'sisip', 1, '    for i in range(2, len(a)):']];
const verOf = (id) => VERSI.find((v) => v[0] === id);
export const sisipOf = (id = 'benar') => { const v = verOf(id); return SISIP.map((x, i) => (v[2] === 'sisip' && v[3] === i ? v[4] : x)); };
export const cariOf = (id = 'benar') => { const v = verOf(id); return CARI.map((x, i) => (v[2] === 'cari' && v[3] === i ? v[4] : x)); };
const L1 = SISIP.map((_, i) => String(i + 1)); const L2 = CARI.map((_, i) => String(i + 10));
const frameVars = (st) => (st.frames.length ? st.frames[st.frames.length - 1].vars : st.vars);

// Run urut_sisip on a copy of `list`; count checks and shifts, and record each pass.
export function jalanSisip(list, id = 'benar') {
  const lines = [...sisipOf(id), `hasil = urut_sisip(${pyRepr(list)})`]; const r = makePyRunner(lines, { limit: 20000 });
  let cek = 0; let geser = 0; let g; const rows = []; let gi = 0; const strict = id === 'B';
  do { g = r.gen.next(); if (g.done) break; const v = frameVars(r.state); const L = g.value.line;
    if (L === 4 && (strict ? v.j > 0 : v.j >= 0)) cek++;
    if (L === 5) { geser++; gi++; }
    if (L === 7) { rows.push({ i: v.i, kunci: v.kunci, a: [...v.a], geser: gi }); gi = 0; }
  } while (!r.state.error);
  return { cek, geser, rows, hasil: r.state.vars.hasil, error: r.state.error };
}
// Run cari_biner on `a`; record kiri, kanan, tengah and a[tengah] for every round.
export function jalanCari(x, id = 'benar', a = ANTREAN) {
  const lines = [...cariOf(id), `hasil = cari_biner(${pyRepr(a)}, ${x})`]; const r = makePyRunner(lines, { limit: 20000 }); const rows = []; let g;
  do { g = r.gen.next(); if (g.done) break; const v = frameVars(r.state); if (g.value.line === 4) rows.push({ kiri: v.kiri, kanan: v.kanan, tengah: v.tengah, nilai: v.a[v.tengah] }); } while (!r.state.error);
  const e = r.state.error; return { rows, hasil: e ? null : r.state.vars.hasil, error: e, keluaran: e ? `${e.type}: ${e.message}` : pyRepr(r.state.vars.hasil) };
}
export const keluaranSisip = (list, id) => { const R = jalanSisip(list, id); return R.error ? `${R.error.type}: ${R.error.message}` : pyRepr(R.hasil); };

// Worksheet timing table (Python 3.13), milliseconds.
export const WAKTU = [[1000, 26, 0.12, 0.06], [2000, 81, 0.25, 0.2], [4000, 415, 0.56, 0.52]];
export const SOAL6 = ['import bisect', 'masuk = [104, 101, 105, 102, 106, 103]', 'urut = sorted(masuk)', 'print(masuk, urut)', 'print(bisect.bisect_left(antrean, 114))', 'bisect.insort(antrean, 113)', 'print(len(antrean), antrean.index(113))'];
export const POSISI = ['def posisi_sisip(a, x):', '    kiri = 0', '    kanan = len(a)', '    while kiri < kanan:', '        tengah = (kiri + kanan) // 2', '        if a[tengah] < x:', '            kiri = tengah + 1', '        else:', '            kanan = tengah', '    return kiri'];

// ---- Permainan: Loket Kilat ----
// Counter staff at a puskesmas sort queue numbers by insertion and find them
// with left and right clips; Si Selisih Satu hides three off-by-one bugs.
const HEAD44 = {
  sisip: ['Sisipkan Kartu Antrean', 'Seret kartu kunci ke celah yang tepat. Setiap geseran satu token.', 'Nomor antrean datang acak!'],
  pita: ['Pita Bagian Urut', 'Ketuk kartu terakhir yang sudah pasti urut.', 'Bagian mana yang sudah aman?'],
  balap: ['Balap Data Hampir Urut', 'Ramalkan token dua deret, lalu lihat balapannya.', 'Data terbalik datang!'],
  j114: ['Jepit Kiri dan Kanan', 'Buka kartu tengah, lalu geser jepit. Cari nomor 114.', 'Lima belas kartu tertutup!'],
  j103: ['Nomor yang Tidak Ada', 'Cari nomor 103 dengan jepit kiri dan kanan.', 'Nomor 103 belum datang…'],
  ab: ['Bongkar Bug A dan B', 'Pilih kartu uji yang membongkar bug, lalu ketuk baris yang diubah.', 'Dua baris pengurutan kuubah sedikit!'],
  c: ['Bongkar Bug C', 'Pilih nomor uji yang membongkar bug pencarian biner, lalu perbaiki.', 'Pencarianku kadang melewatkan satu kartu!'],
  sort: ['Kotak Peralatan Pustaka', 'Ramalkan sorted() dan sort(), lalu bongkar jebakan None.', 'masuk = masuk.sort() kelihatan benar…'],
  bisect: ['Pakai bisect', 'Hitung bisect_left dan rakit fungsi ada().', 'bisect_left tidak pernah memberi -1!'],
  bos: ['Penyisip Setengah Terbuka', 'Lengkapi posisi_sisip dengan rentang setengah terbuka.', 'kanan = len(a)? Berani?'],
};
const msg44 = (t) => el('p', { class: 'reveal info' }, t);
const urutUrut = (a) => [...a].sort((x, y) => x - y);
const sisipView = (id = 'benar', o = {}) => el('div', { class: 'lk44-kolom' }, el('small', null, 'def urut_sisip(a):'), codeView(sisipOf(id).slice(1), { labels: L1.slice(1), ...o }));
const cariView = (id = 'benar', o = {}) => el('div', { class: 'lk44-kolom' }, el('small', null, 'def cari_biner(a, x):'), codeView(cariOf(id).slice(1, 9), { labels: L2.slice(1, 9), ...o }));
const deret = (a, { cls = () => '', idx = true } = {}) => el('div', { class: 'lk44-deret' }, a.map((v, k) => el('div', { class: `lk44-kartu ${cls(k)}`, 'data-k': String(k) }, idx ? el('small', null, String(k)) : null, el('b', null, String(v)))));

// Misi 1: be the insertion sort. Drag the key into its gap.
export function posSisip(a, i) { let p = 0; while (p < i && a[p] <= a[i]) p++; return p; }
function sisipRound(area, ctx, { oops, done }) {
  const msg = msg44('Kartu kunci sudah diangkat. Seret ke celah di bagian kiri tempat ia harus disisipkan.'); const a = [...MASUK]; let i = 1; let geser = 0; let cek = 0;
  const box = el('div', { class: 'lk44-kolom' }); const info = el('div', { class: 'lk44-token' }); const host = el('div', { class: 'lk44-kolom' });
  const draw = () => {
    fill(info, `i = ${i} · 🪙 geseran ${geser} · pemeriksaan ${cek}`);
    const row = []; for (let p = 0; p <= a.length; p++) { if (p <= i && i < a.length) row.push(el('div', { class: 'lk44-celah', 'data-drop': String(p) }, '▾')); if (p < a.length) row.push(p === i ? el('div', { class: 'lk44-kartu kosong' }, el('small', null, String(p)), el('b', null, ' ')) : el('div', { class: `lk44-kartu ${p < i ? 'urut' : ''}` }, el('small', null, String(p)), el('b', null, String(a[p])))); }
    fill(host, i < a.length ? el('div', { class: 'lk44-melayang' }, el('small', null, 'kunci = a[i]'), el('div', { class: 'lk44-kartu kunci', 'data-drag': 'kunci' }, el('b', null, String(a[i])))) : null, el('div', { class: 'lk44-deret' }, row));
  };
  dnd(host, (card, gap) => {
    if (!gap.classList.contains('lk44-celah')) return; const p = +gap.dataset.drop; const want = posSisip(a, i);
    if (p !== want) { oops(); shake(card); say(msg, 'bad', p < want ? `${a[p]} lebih kecil dari ${a[i]}: perulangan while berhenti sebelum sampai sini.` : `${a[p - 1]} lebih besar dari ${a[i]}, jadi ${a[p - 1]} harus digeser.`); return; }
    const k = a[i]; const s = i - p; geser += s; cek += s + (p > 0 ? 1 : 0); a.splice(i, 1); a.splice(p, 0, k); ctx.sound.tap(); i++; draw();
    if (i < a.length) { say(msg, 'info', s ? `${s} kartu digeser ke kanan. Kunci berikutnya.` : 'Tidak ada yang digeser: kunci sudah di tempatnya.'); return; }
    say(msg, 'info', `Urut: ${pyRepr(a)}. Catat token loket.`);
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['total geseran: ', '_'], ['total pemeriksaan a[j] > kunci: ', '_']]), chips: [String(geser), String(cek), '5', '15', '11'], want: [String(geser), String(cek)],
      hints: ['1 + 0 + 2 + 0 + 3.', 'Satu pemeriksaan lagi setiap kali while berhenti karena a[j] <= kunci: 1 + 1 + 3 + 1 + 4.'], done: () => { say(msg, '', `${geser} geseran dan ${cek} pemeriksaan. Tanpa kunci, geseran pertama akan menimpa a[i].`); done(); } }));
  });
  draw();
  fill(box, el('div', { class: 'lk44-dua' }, sisipView(), el('div', { class: 'lk44-kolom' }, host, info)));
  area.append(box, msg);
}

// Misi 2: the sorted ribbon before line 3.
export const PITA44 = [3, 5];
function pitaRound(area, ctx, { oops, done }) {
  const msg = msg44('Tepat sebelum baris 3 dengan i = 3. Ketuk kartu terakhir yang sudah pasti urut.'); const S = jalanSisip(MASUK); let q = 0; const box = el('div', { class: 'lk44-kolom' });
  const stateAt = (i) => S.rows.find((x) => x.i === i - 1).a;
  const draw = (lit = -1) => { const i = PITA44[Math.min(q, PITA44.length - 1)]; const a = stateAt(i);
    fill(box, el('div', { class: 'lk44-soal' }, `i = ${i}: a = ${pyRepr(a)}`), el('div', { class: 'lk44-deret' }, a.map((v, k) => onTap(el('button', { type: 'button', class: `lk44-kartu ${k <= lit ? 'urut' : ''}`, 'data-k': String(k) }, el('small', null, String(k)), el('b', null, String(v))), () => tap(k)))), lit >= 0 ? el('div', { class: 'lk44-pita', style: { width: `${((lit + 1) / a.length) * 100}%` } }, `a[0] sampai a[${lit}]`) : null); };
  function tap(k) {
    if (q >= PITA44.length) return; const i = PITA44[q];
    if (k !== i - 1) { oops(); say(msg, 'bad', k < i - 1 ? 'Masih ada kartu sesudahnya yang sudah pasti urut.' : `a[${k}] belum diproses: putaran i = ${i} baru akan dimulai.`); return; }
    ctx.sound.tap(); q++;
    if (q < PITA44.length) { draw(); say(msg, 'info', `Tepat: a[0] sampai a[${i - 1}]. Sekarang i = 5.`); return; }
    draw(k); say(msg, 'info', 'Pita selalu menutup a[0] sampai a[i − 1]. Lengkapi invariannya.');
    area.insertBefore(fillBoard(ctx, { oops, msg, view: rowsView([['sebelum baris 3, sudah urut: a[0] sampai a[', '_', ']'], ['saat i = 3, bagian kanan [102, 106, 103] ', '_'], ['di akhir, i = len(a), jadi pita menutup ', '_']]), chips: ['i - 1', 'tidak urut', 'seluruh list', 'i', 'urut', 'a[0] saja'], want: ['i - 1', 'tidak urut', 'seluruh list'],
      hints: ['Kartu a[i] belum disisipkan.', '106 lalu 103: belum urut.', 'Invarian benar di awal, tetap benar setiap putaran, dan di akhir mencakup semuanya.'], done: () => { say(msg, '', 'Invarian: benar di awal (a[0] sendirian), tetap benar setiap putaran, jadi di akhir seluruh list urut.'); done(); } }), msg);
  }
  draw();
  area.append(box, msg);
}

// Misi 3: nearly sorted against reversed data.
function balapRound(area, ctx, { oops, done }) {
  const msg = msg44('Ramalkan token pengurutan sisip untuk dua deret ini.'); const H = jalanSisip(HAMPIR); const T = jalanSisip(TERBALIK); const box = el('div', { class: 'lk44-kolom' });
  const lane = (nm, a, g) => el('div', { class: 'lk44-lajur' }, el('b', null, nm), deret(a, { idx: false }), el('span', { class: 'lk44-token' }, g === null ? '🪙 ?' : `🪙 ${g}`));
  fill(box, lane('hampir urut', HAMPIR, null), lane('terbalik', TERBALIK, null));
  area.append(box, fillBoard(ctx, { oops, msg, view: rowsView([['hampir urut: geseran ', '_', ' · pemeriksaan ', '_'], ['terbalik: geseran ', '_', ' · pemeriksaan ', '_']]), chips: [String(H.geser), String(H.cek), String(T.geser), String(T.cek), '7', '56', '8'], want: [String(H.geser), String(H.cek), String(T.geser), String(T.cek)],
    hints: ['Hanya 103 dan 106 yang salah tempat, masing-masing satu langkah.', 'Tujuh kunci, ditambah dua pemeriksaan untuk kunci yang digeser.', 'Setiap kunci harus digeser sampai ke depan: 1 + 2 + … + 7.', 'Setiap pemeriksaan berujung geseran; j habis sebelum ada pemeriksaan yang gagal.'],
    done: () => { say(msg, 'info', 'Balapan dimulai!'); race(); } }), msg);
  function race() {
    let k = 0; const n = Math.max(H.rows.length, T.rows.length); let gh = 0; let gt = 0;
    const tick = () => { if (!box.isConnected) return; if (k >= n) { finish(); return; } gh += H.rows[k]?.geser || 0; gt += T.rows[k]?.geser || 0;
      fill(box, lane('hampir urut', H.rows[k]?.a || H.hasil, gh), lane('terbalik', T.rows[k]?.a || T.hasil, gt)); k++; setTimeout(tick, 380); };
    tick();
  }
  function finish() {
    say(msg, 'info', 'Tabel waktu lembar kerja (ms). Bila n digandakan, waktunya kira-kira dikali berapa?');
    area.insertBefore(fillBoard(ctx, { oops, msg, view: rowsView([['data acak 26 → 81 → 415: kira-kira × ', '_'], ['hampir urut 0,12 → 0,25 → 0,56: kira-kira × ', '_']]), chips: ['4', '2', '1', '8'], want: ['4', '2'],
      hints: ['Seperti versi bersarang: kuadrat.', 'Hampir tidak ada geseran: linear.'], done: () => { say(msg, '', 'Sisip cocok untuk nomor yang tiba hampir urut: hampir tidak ada yang digeser, dan nomor baru bisa disisipkan satu per satu.'); done(); } }), msg);
  }
}

// Misi 4: left and right clips on fifteen closed cards.
function jepitRound(area, ctx, { oops, done }, x) {
  const msg = msg44(`Cari nomor ${x}. Ketuk kartu tengah = (kiri + kanan) // 2 untuk membukanya.`); const C = jalanCari(x); const a = ANTREAN;
  let kiri = 0; let kanan = a.length - 1; let tengah = null; const buka = new Set(); let fase = 'tengah'; const log = [];
  const box = el('div', { class: 'lk44-kolom' }); const left = el('div', { class: 'lk44-kolom' });
  const draw = () => {
    fill(left, cariView('benar', { hl: fase === 'tengah' ? [3] : [4, 6] }));
    fill(box, el('div', { class: 'lk44-token' }, `kiri = ${kiri} · kanan = ${kanan}${tengah !== null ? ` · tengah = ${tengah}` : ''} · kartu dibuka: ${buka.size}`),
      el('div', { class: 'lk44-deret tutup', 'data-fase': fase }, a.map((v, k) => onTap(el('button', { type: 'button', class: `lk44-kartu ${buka.has(k) ? 'buka' : 'tertutup'} ${k < kiri || k > kanan ? 'luar' : ''} ${k === tengah ? 'tengah' : ''}`, 'data-k': String(k) },
        el('small', null, `${k === kiri ? '⟦' : ''}${k}${k === kanan ? '⟧' : ''}`), el('b', null, buka.has(k) ? String(v) : '?')), () => tapCard(k)))),
      el('div', { class: 'lk44-tombol' }, (fase === 'tengah' ? [['habis', 'kiri > kanan: return -1']] : [['ketemu', 'a[tengah] == x: return tengah'], ['kiri', 'a[tengah] < x: kiri = tengah + 1'], ['kanan', 'a[tengah] > x: kanan = tengah - 1']]).map(([k, t]) => onTap(el('button', { type: 'button', class: 'lk44-pilih', 'data-v': k }, t), () => act(k)))),
      el('div', { class: 'lk44-log' }, log.map((r) => el('span', null, r))));
  };
  function tapCard(k) {
    if (fase !== 'tengah') return;
    if (kiri > kanan) { oops(); say(msg, 'bad', 'kiri sudah melewati kanan: rentangnya kosong.'); return; }
    const t = Math.floor((kiri + kanan) / 2);
    if (k !== t) { oops(); say(msg, 'bad', `tengah = (${kiri} + ${kanan}) // 2 = ${t}.`); return; }
    tengah = t; buka.add(t); fase = 'geser'; ctx.sound.tap(); log.push(`(${kiri}, ${kanan}, ${t}, ${a[t]})`); draw();
    say(msg, 'info', `a[${t}] = ${a[t]}. Bandingkan dengan ${x}, lalu pilih langkahnya.`);
  }
  function act(k) {
    if (fase === 'tengah') {
      if (k !== 'habis') return;
      if (kiri <= kanan) { oops(); say(msg, 'bad', 'Rentangnya belum kosong: buka kartu tengah dulu.'); return; }
      return finish(-1);
    }
    const v = a[tengah]; const want = v === x ? 'ketemu' : v < x ? 'kiri' : 'kanan';
    if (k !== want) { oops(); say(msg, 'bad', `Bandingkan ${v} dengan ${x}.`); return; }
    ctx.sound.tap();
    if (k === 'ketemu') return finish(tengah);
    if (k === 'kiri') kiri = tengah + 1; else kanan = tengah - 1;
    tengah = null; fase = 'tengah'; draw();
    say(msg, 'info', kiri > kanan ? `kiri = ${kiri}, kanan = ${kanan}. Apa artinya?` : `Rentang tinggal indeks ${kiri} sampai ${kanan}. Buka kartu tengah berikutnya.`);
  }
  function finish(h) {
    fase = 'selesai'; ctx.sound.good(); draw(); say(msg, 'info', `cari_biner(antrean, ${x}) = ${h}, ${buka.size} kartu dibuka. Catat hasilnya.`);
    const last = x === 103;
    area.insertBefore(fillBoard(ctx, { oops, msg, view: rowsView([['hasil: ', '_', ' · kartu dibuka: ', '_'], ...(last ? [['putaran paling banyak: 15 nomor ', '_', ', 1.000 nomor ', '_']] : [])]),
      chips: last ? [C.keluaran, String(C.rows.length), '4', '10', '15', '2'] : [C.keluaran, String(C.rows.length), '10', '4', '-1'], want: last ? [C.keluaran, String(C.rows.length), '4', '10'] : [C.keluaran, String(C.rows.length)],
      hints: ['Lihat langkah terakhir.', 'Hitung kartu yang terbuka.', '15 → 7 → 3 → 1.', 'Setiap putaran membuang separuh: 2¹⁰ = 1.024.'],
      done: () => { say(msg, '', last ? 'Rentang kosong berarti 103 pasti tidak ada (invarian). Setiap putaran membuang separuh rentang.' : `Hanya ${buka.size} dari 15 kartu dibuka.`); done(); } }), msg);
  }
  draw();
  area.append(el('div', { class: 'lk44-dua' }, left, box), msg);
}

// Misi 5: test cards against Si Selisih Satu.
export const UJI_AB = [[104, 101, 105, 102, 106, 103], [101, 102, 103], [15, 12], [12, 15], [7]];
export const BUG44 = { A: 0, B: 3 };
function abRound(area, ctx, { oops, done }) {
  const msg = msg44('Si Selisih Satu mengubah versi A. Ketuk kartu uji: layar menjalankan versi benar dan versi A.'); let v = 'A'; let fase = 'uji'; let tok = 0;
  const left = el('div', { class: 'lk44-kolom' }); const right = el('div', { class: 'lk44-kolom' }); const log = el('div', { class: 'lk44-log' });
  const draw = () => {
    fill(left, el('b', null, `Versi ${v}`), sisipView(v, { cls: fase === 'baris' ? 'ketuk' : '', onLine: fase === 'baris' ? tapLine : null }));
    fill(right, el('div', { class: 'lk44-token' }, `🪙 token uji: ${tok}`), el('div', { class: 'lk44-uji', 'data-v': v }, UJI_AB.map((t, k) => onTap(el('button', { type: 'button', class: 'lk44-kartu-uji', 'data-k': String(k) }, pyRepr(t)), () => uji(k)))), log);
  };
  function uji(k) {
    if (fase !== 'uji') return; const t = UJI_AB[k]; tok++; const b = keluaranSisip(t, 'benar'); const s = keluaranSisip(t, v); const beda = b !== s;
    log.append(el('span', { class: beda ? 'beda' : 'sama' }, `${pyRepr(t)} → benar ${b} | ${v} ${s} ${beda ? '✗' : '='}`)); ctx.sound.tap();
    if (!beda) { oops(); say(msg, 'bad', 'Keluarannya sama: bug tidak terlihat, token terbuang. Pilih masukan yang lebih tajam.'); return; }
    fase = 'baris'; draw(); say(msg, 'info', 'Bug terbongkar! Ketuk baris yang diubah Si Selisih Satu.');
  }
  function tapLine(i) {
    if (fase !== 'baris') return;
    if (i !== BUG44[v]) { oops(); say(msg, 'bad', v === 'A' ? 'Lihat keluarannya: anggota terakhir tidak pernah disisipkan.' : 'Lihat keluarannya: tidak ada nomor yang bisa pindah ke depan.'); return; }
    ctx.sound.good();
    if (v === 'A') { v = 'B'; fase = 'uji'; fill(log); draw(); say(msg, 'info', 'Baris 2: range(1, len(a) - 1) tidak pernah menjalankan i = len(a) - 1. Sekarang versi B.'); return; }
    fase = 'beres'; draw(); say(msg, '', `Baris 5: j > 0 tidak pernah membandingkan dengan a[0]. Dua bug dengan ${tok} token uji.`); done();
  }
  draw();
  area.append(el('div', { class: 'lk44-dua' }, left, right), msg);
}

export const UJI_C = [114, 111, 117, 125, 101, 120];
function cRound(area, ctx, { oops, done }) {
  const msg = msg44('Versi C: ketuk nomor uji. Layar mencari nomor itu di antrean dengan versi benar dan versi C.'); let fase = 'uji'; let tok = 0;
  const left = el('div', { class: 'lk44-kolom' }); const right = el('div', { class: 'lk44-kolom' }); const log = el('div', { class: 'lk44-log' });
  const draw = () => {
    fill(left, el('b', null, 'Versi C'), cariView('C', { cls: fase === 'baris' ? 'ketuk' : '', onLine: fase === 'baris' ? tapLine : null }));
    fill(right, el('div', { class: 'lk44-token' }, `🪙 token uji: ${tok}`), deret(ANTREAN, { idx: false }), el('div', { class: 'lk44-uji' }, UJI_C.map((x, k) => onTap(el('button', { type: 'button', class: 'lk44-kartu-uji', 'data-k': String(k) }, `cari ${x}`), () => uji(x)))), log);
  };
  function uji(x) {
    if (fase !== 'uji') return; tok++; const b = jalanCari(x).keluaran; const s = jalanCari(x, 'C').keluaran; const beda = b !== s; ctx.sound.tap();
    log.append(el('span', { class: beda ? 'beda' : 'sama' }, `cari ${x} → benar ${b} | C ${s} ${beda ? '✗' : '='}`));
    if (!beda) { oops(); say(msg, 'bad', x === 125 ? 'Dua-duanya -1: 125 memang tidak ada.' : `${x} ketemu sebelum rentangnya menyusut menjadi satu kartu. Coba nomor di ujung.`); return; }
    fase = 'baris'; draw(); say(msg, 'info', 'Bug terbongkar! Ketuk baris yang diubah.');
  }
  function tapLine(i) {
    if (fase !== 'baris') return;
    if (i !== 2) { oops(); say(msg, 'bad', 'Bugnya membuat pencarian berhenti terlalu cepat.'); return; }
    fase = 'perbaiki'; ctx.sound.good(); draw(); say(msg, 'info', 'Baris 13: berhenti ketika kiri = kanan, padahal satu kartu itu belum dibuka. Perbaiki.');
    left.append(fillBoard(ctx, { oops, msg, view: codeFill([['    while kiri ', '_', ' kanan:']], { labels: ['13'] }), chips: ['<=', '<', '>=', '!='], want: ['<='], hints: ['Rentang satu kartu (kiri = kanan) masih harus diperiksa.'],
      done: () => { const F = ANTREAN.filter((x) => jalanCari(x, 'C').keluaran !== jalanCari(x).keluaran); say(msg, '', `Versi C gagal untuk ${F.length} dari 15 nomor (${F.join(', ')}). Uji selalu ujung pertama dan terakhir! Total ${tok} token uji.`); done(); } }));
  }
  draw();
  area.append(el('div', { class: 'lk44-dua' }, left, right), msg);
}

// Misi 6: sorted(), sort() and bisect.
function sortRound(area, ctx, { oops, done }) {
  const msg = msg44('Ramalkan keluaran baris 25.'); const box = el('div', { class: 'lk44-kolom' }); const out = layar();
  const R6 = runPy([`antrean = ${pyRepr(ANTREAN)}`, ...SOAL6], { limit: 2000 }); const E = runPy(['import bisect', `masuk = ${pyRepr(MASUK)}`, 'masuk = masuk.sort()', 'x = bisect.bisect_left(masuk, 103)'], { limit: 2000 });
  const [o1, o2] = [pyRepr(MASUK), pyRepr(urutUrut(MASUK))];
  fill(box, codeView(SOAL6.slice(0, 4), { labels: ['22', '23', '24', '25'] }), fillBoard(ctx, { oops, msg, view: rowsView([['print(masuk, urut) → ', '_', ' ', '_']]), chips: [o1, o2, 'None'], want: [o1, o2], hints: ['sorted membuat list baru; masuk tidak berubah.', 'urut berisi list baru yang sudah urut.'],
    done: () => { say(msg, 'info', `${R6.out[0]}. Sekarang Si Selisih Satu menulis masuk = masuk.sort().`);
      fill(box, codeView(['masuk = [104, 101, 105, 102, 106, 103]', 'masuk = masuk.sort()', 'x = bisect.bisect_left(masuk, 103)']), out, fillBoard(ctx, { oops, msg, view: rowsView([['setelah baris 2, masuk berisi ', '_'], ['baris 3 berhenti dengan ', '_']]), chips: ['None', o2, 'TypeError', 'IndexError'], want: ['None', 'TypeError'],
        hints: ['sort() mengurutkan di tempat dan mengembalikan None.', 'bisect_left memanggil len(masuk), padahal masuk berisi None.'],
        done: () => { play(out, [], { err: `${E.error.type}: ${E.error.message}`, end: () => { say(msg, '', 'Pakai masuk.sort() saja, atau urut = sorted(masuk). Jangan keduanya digabung.'); done(); } }); } })); } }));
  area.append(box, msg);
}

function bisectRound(area, ctx, { oops, done }) {
  const msg = msg44('bisect_left mengembalikan posisi sisip: indeks pertama yang isinya >= x.'); const box = el('div', { class: 'lk44-kolom' });
  const bl = (x) => String(runPy(['import bisect', `x = bisect.bisect_left(${pyRepr(ANTREAN)}, ${x})`]).vars.x); const R6 = runPy([`antrean = ${pyRepr(ANTREAN)}`, ...SOAL6], { limit: 2000 });
  const [d1, d2] = R6.out[2].split(' ');
  fill(box, deret(ANTREAN), codeView(SOAL6.slice(4), { labels: ['26', '27', '28'] }), fillBoard(ctx, { oops, msg, view: rowsView([['bisect_left(antrean, 114) → ', '_'], ['bisect_left(antrean, 103) → ', '_'], ['bisect_left(antrean, 125) → ', '_'], ['baris 28 → ', '_', ' ', '_']]),
    chips: [bl(114), bl(103), bl(125), d1, d2, '-1', '14', '10'], want: [bl(114), bl(103), bl(125), d1, d2], hints: ['114 ada di indeks 9.', '103 tidak ada; ia akan disisipkan sebelum 104 di indeks 2.', 'Lebih besar dari semuanya: posisi len(antrean).', 'insort menambah 113, jadi 16 anggota.', '113 disisipkan sebelum 114.'],
    done: () => { say(msg, 'info', 'bisect_left tidak pernah -1. Rakit fungsi ada(a, x) yang benar.');
      fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['def ada(a, x):', '    i = bisect.bisect_left(a, x)', ['    return ', '_', ' and ', '_']]), chips: ['i < len(a)', 'a[i] == x', 'i != -1', 'a[i] > x', 'x in a'], want: ['i < len(a)', 'a[i] == x'],
        hints: ['Untuk 125, i = 15 dan a[15] tidak ada: periksa batas dulu.', 'Posisi sisip belum tentu berisi x.'], done: () => { say(msg, '', 'ada(antrean, 114) True, ada(antrean, 125) False, ada(antrean, 103) False. Urutan and penting: batas diperiksa dulu.'); done(); } })); } }));
  area.append(box, msg);
}

// Misi Bos: the half-open insertion finder.
export const BOS44 = { atas: ['len(a)', '<'], bawah: ['tengah'] };
function bosRound(area, ctx, { oops, done }) {
  const msg = msg44('Rentang setengah terbuka: kiri ikut, kanan tidak. Lengkapi bagian atas.'); const box = el('div', { class: 'lk44-kolom' });
  const P = [114, 103, 125, 101].map((x) => String(runPy([...POSISI, `x = posisi_sisip(${pyRepr(ANTREAN)}, ${x})`], { limit: 2000 }).vars.x));
  fill(box, el('small', null, 'def posisi_sisip(a, x):'), fillBoard(ctx, { oops, msg, view: codeFill(['    kiri = 0', ['    kanan = ', '_'], ['    while kiri ', '_', ' kanan:'], '        tengah = (kiri + kanan) // 2'], { labels: ['2', '3', '4', '5'] }), chips: ['len(a)', 'len(a) - 1', '<', '<='], want: BOS44.atas,
    hints: ['Kanan menunjuk satu lewat ujung: x bisa disisipkan di akhir.', 'Rentang [kiri, kanan) kosong ketika kiri = kanan.'],
    done: () => { say(msg, 'info', 'Bagian bawah: bila a[tengah] >= x, tengah masih mungkin jawabannya.');
      fill(box, el('small', null, 'def posisi_sisip(a, x): … (baris 6–10)'), fillBoard(ctx, { oops, msg, view: codeFill(['        if a[tengah] < x:', '            kiri = tengah + 1', '        else:', ['            kanan = ', '_'], '    return kiri'], { labels: ['6', '7', '8', '9', '10'] }), chips: ['tengah', 'tengah - 1', 'tengah + 1'], want: BOS44.bawah,
        hints: ['a[tengah] bisa jadi posisi sisipnya, jadi jangan dibuang.'], done: () => { say(msg, 'info', 'Jalankan posisi_sisip pada antrean.');
          fill(box, deret(ANTREAN), fillBoard(ctx, { oops, msg, view: rowsView([['114 → ', '_', ' · 103 → ', '_'], ['125 → ', '_', ' · 101 → ', '_']]), chips: [...P, '-1', '14', '1'], want: P, hints: ['Indeks 114.', 'Sebelum 104.', 'Setelah semuanya: len(antrean).', 'Indeks pertama.'],
            done: () => { say(msg, '', `${P.join(', ')}: sama persis dengan bisect.bisect_left. Tanpa -1, tanpa selisih satu.`); done(); } })); } })); } }));
  area.append(box, msg);
}

export default {
  id: 'sma-44-urut-cari-kode',
  title: 'Pengurutan Sisip dan Pencarian Biner',
  topic: 'Pengurutan sisip dan pencarian biner dalam Python: menelusuri kode, invarian perulangan, data acak dan data hampir urut, kesalahan selisih satu, serta sorted() dan modul bisect',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎫',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Telusuri pengurutan sisip dan pencarian biner pada nomor antrean puskesmas, tuliskan invariannya, temukan tiga kesalahan selisih satu dengan masukan yang tepat, lalu pakai sorted() dan bisect.',
  extraModes: [
    { id: 'telusur', icon: '🔎', label: 'Penelusur dengan Sorotan List', desc: 'Jalankan urut_sisip atau cari_biner langkah demi langkah: kunci, penunjuk j, kiri, kanan, tengah, dan bagian yang sudah urut terlihat di list', create: createTracer },
    { id: 'versi', icon: '🆚', label: 'Versi Kode Berdampingan', desc: 'Jalankan masukan yang sama pada versi benar dan versi A, B, atau C, lalu bandingkan keluarannya', create: createCompare },
    { id: 'giliran', icon: '🐞', label: 'Bongkar Selisih Satu', desc: 'Satu tim memilih perubahan selisih satu secara diam-diam, tim lain mengetik masukan uji sampai keluarannya berbeda', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lk44-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'lk44-area' });
      let foe = null;
      const go = (k, no) => {
        const [judul, tujuan, ulah] = HEAD44[k];
        foe = el('div', { class: 'lk44-musuh' }, el('b', null, '😈 Si Selisih Satu'), el('span', null, ulah));
        wrap.append(el('div', { class: 'lk44-kepala' }, misiHead(no, judul, tujuan, '🎫'), foe), area);
      };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Selisih satu terbongkar ✓'; next(ms); } });
      if (r === 0) { go('sisip', 1); sisipRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('pita', 2); pitaRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('balap', 3); balapRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('j114', 4); jepitRound(area, ctx, fin(5500), 114); }
      else if (r === 4) { go('j103', 4); jepitRound(area, ctx, fin(6000), 103); }
      else if (r === 5) { go('ab', 5); abRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('c', 5); cRound(area, ctx, fin(6500)); }
      else if (r === 7) { go('sort', 6); sortRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('bisect', 6); bisectRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};


// List as boxes; marks: sorted part, kunci above, pointers j / kiri / kanan / tengah, grey outside the search range.
export function listView(a, { idx = false, urut = -1, j = null, kunci = null, kiri = null, kanan = null, tengah = null, cari = false } = {}) {
  return el('div', { class: 'uc-list' }, a.map((v, i) => {
    const out = cari && kiri != null && kanan != null && (i < kiri || i > kanan);
    const ptr = [i === kiri ? 'kiri' : null, i === tengah ? 'tengah' : null, i === kanan ? 'kanan' : null, i === j ? 'j' : null].filter(Boolean);
    return el('div', { class: `uc-kotak ${i <= urut ? 'urut' : ''} ${out ? 'luar' : ''} ${i === tengah ? 'tengah' : ''}` }, el('small', null, ptr.join(' · ') || ' '), el('b', null, pyRepr(v)), idx || cari ? el('i', null, String(i)) : null);
  }), kunci != null ? el('div', { class: 'uc-kunci' }, el('small', null, 'kunci'), el('b', null, String(kunci))) : null);
}

// Step-by-step tracer with the list drawn as boxes.
function createTracer(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  let fn = 'sisip'; let data = MASUK; let x = 114;
  const LISTS = [['masuk', MASUK], ['hampir urut', HAMPIR], ['terbalik', TERBALIK]];
  const draw = () => {
    let cek = 0; let geser = 0;
    const lines = fn === 'sisip' ? [...SISIP, `hasil = urut_sisip(${pyRepr(data)})`] : [...CARI, `antrean = ${pyRepr(ANTREAN)}`, `hasil = cari_biner(antrean, ${x})`];
    const extra = (st) => { const v = frameVars(st); if (fn === 'sisip') { const a = v.a || data; const inLoop = v.i != null && !st.done; return el('div', { class: 'uc-samping' }, listView(a, { urut: inLoop ? v.i - 1 : st.done ? a.length - 1 : 0, j: inLoop ? v.j : null, kunci: inLoop ? v.kunci : null }), el('p', { class: 'uc-hitung' }, `geseran ${geser} · pemeriksaan a[j] > kunci ${cek}`)); }
      return el('div', { class: 'uc-samping' }, listView(ANTREAN, { cari: true, kiri: v.kiri, kanan: v.kanan, tengah: v.tengah })); };
    const tr = pyTracer(lines, { labels: fn === 'sisip' ? [...L1, ''] : [...L2, '', ''], cls: 'uc-jejak', speed: 500, hideVars: ['a', 'antrean'], extra, onStep: (g, st) => { if (!g) { cek = 0; geser = 0; return; } const v = frameVars(st); if (fn === 'sisip' && g.line === 4 && v.j >= 0) cek++; if (fn === 'sisip' && g.line === 5) geser++; } });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur dengan sorotan list'),
      el('div', { class: 'seg uc-pilih' }, [['sisip', 'urut_sisip'], ['cari', 'cari_biner']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${fn === k ? 'on' : ''}`, type: 'button' }, t), () => { fn = k; draw(); }))),
      fn === 'sisip' ? el('div', { class: 'seg uc-pilih' }, LISTS.map(([t, l]) => onTap(el('button', { class: `seg-btn ${data === l ? 'on' : ''}`, type: 'button' }, t), () => { data = l; draw(); })))
        : el('div', { class: 'seg uc-pilih' }, [114, 103, 101, 120, 125].map((v) => onTap(el('button', { class: `seg-btn ${x === v ? 'on' : ''}`, type: 'button' }, `x = ${v}`), () => { x = v; draw(); }))),
      tr);
  };
  draw();
}

// Same input on the correct version and a chosen buggy version.
function createCompare(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  let ver = 'A'; let list = MASUK; let x = 120;
  const LISTS = [MASUK, [15, 12], [101], [], HAMPIR, TERBALIK];
  const draw = () => {
    const v = verOf(ver); const isCari = v[2] === 'cari';
    const out = (id) => (isCari ? jalanCari(x, id).keluaran : keluaranSisip(list, id));
    const a = out('benar'); const b = out(ver);
    const code = (id) => pyCode(isCari ? cariOf(id) : sisipOf(id), { labels: isCari ? L2 : L1, cls: 'uc-kecil', warn: id === 'benar' ? [] : [v[3]] });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Versi kode berdampingan'),
      el('div', { class: 'seg uc-pilih' }, VERSI.slice(1).map(([id, label]) => onTap(el('button', { class: `seg-btn ${ver === id ? 'on' : ''}`, type: 'button' }, label), () => { ver = id; draw(); }))),
      isCari ? el('div', { class: 'seg uc-pilih' }, [114, 103, 101, 120, 125, 100].map((q) => onTap(el('button', { class: `seg-btn ${x === q ? 'on' : ''}`, type: 'button' }, `cari_biner(antrean, ${q})`), () => { x = q; draw(); })))
        : el('div', { class: 'seg uc-pilih' }, LISTS.map((l) => onTap(el('button', { class: `seg-btn ${list === l ? 'on' : ''}`, type: 'button' }, pyRepr(l)), () => { list = l; draw(); }))),
      el('div', { class: 'uc-dua' }, el('div', null, el('p', { class: 'uc-judul' }, 'versi benar'), code('benar'), el('p', { class: 'uc-hasil' }, a)), el('div', null, el('p', { class: 'uc-judul' }, v[1]), code(ver), el('p', { class: `uc-hasil ${a === b ? '' : 'beda'}` }, b))),
      el('p', { class: `reveal ${a === b ? 'info' : 'bad'}` }, a === b ? 'Keluarannya sama: masukan ini belum membongkar bug.' : 'Keluarannya berbeda: masukan ini membongkar bug.'));
  };
  draw();
}

// Parse a typed list of whole numbers; nothing typed is stored.
export const parseList = (t) => { const m = String(t).trim().replace(/^\[|\]$/g, ''); if (!m.trim()) return []; const xs = m.split(/[\s,]+/).filter(Boolean); if (xs.length > 10 || !xs.every((s) => /^-?\d{1,4}$/.test(s))) return null; return xs.map(Number); };

// Team mode: one team hides an off-by-one change; the others test until an output differs.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act urut-cari' });
  root.append(wrap);
  const BUGS = VERSI.slice(1); const MAX = 8;
  function start(nT) {
    const pts = Array(nT).fill(0); const turns = Math.max(3, nT); let t = 0;
    function step() {
      if (t >= turns) { finishBoard(wrap, ctx, { title: 'Bongkar Selisih Satu selesai', pts, again: () => pickTeams(wrap, 'Bongkar Selisih Satu', start) }); return; }
      const boss = t % nT;
      wrap.replaceChildren(scoreBar(pts, boss), el('p', { class: 'prompt' }, `Tim ${boss + 1}: pilih perubahan diam-diam (tim lain jangan melihat)`), el('div', { class: 'uc-bank' }, BUGS.map(([id, label]) => onTap(el('button', { class: 'uc-kartu', type: 'button' }, el('b', null, label.split(':')[0]), el('small', null, label.split(': ')[1] || label)), () => { ctx.sound.tap(); hunt(boss, id); }))));
    }
    function hunt(boss, id) {
      const hunters = Array.from({ length: nT }, (_, i) => i).filter((i) => i !== boss); let turn = 0; let used = 0; const log = []; let x = 114; let teks = '104, 101, 105';
      const finish = (msg) => { const v = verOf(id); wrap.replaceChildren(scoreBar(pts, -1), el('p', { class: 'prompt' }, v[1]), pyCode(v[2] === 'cari' ? cariOf(id) : sisipOf(id), { labels: v[2] === 'cari' ? L2 : L1, cls: 'uc-kecil', warn: [v[3]] }), el('p', { class: 'reveal' }, msg), button('Lanjut ➜', () => { t++; step(); }, 'primary')); };
      const test = (kind) => {
        const who = hunters[turn % hunters.length]; let call; let a; let b;
        if (kind === 'sisip') { const l = parseList(teks); if (!l) { draw('Tulis paling banyak 10 bilangan bulat dipisah koma, misalnya 104, 101, 105.', 'bad'); return; } call = `urut_sisip(${pyRepr(l)})`; a = keluaranSisip(l, 'benar'); b = keluaranSisip(l, id); }
        else { call = `cari_biner(antrean, ${x})`; a = jalanCari(x, 'benar').keluaran; b = jalanCari(x, id).keluaran; }
        used++; const beda = a !== b; log.push({ who, call, a, b, beda });
        if (beda) { const p = Math.max(1, 6 - used); pts[who] += p; ctx.sound.good(); return finish(`Bug terbongkar oleh Tim ${who + 1} setelah ${used} uji: +${p}.`); }
        if (used >= MAX) { pts[boss] += 3; return finish(`Bug lolos dari ${MAX} uji: Tim ${boss + 1} +3.`); }
        turn++; ctx.sound.tap(); draw('Keluarannya sama. Bug belum terbongkar.');
      };
      const draw = (msg = '', cls = 'info') => {
        const who = hunters[turn % hunters.length];
        const input = el('input', { class: 'uc-input', type: 'text', inputmode: 'numeric', value: teks, 'aria-label': 'masukan urut_sisip', autocomplete: 'off', oninput: (e) => { teks = e.target.value; } });
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: uji ke-${used + 1} dari ${MAX}`),
          el('div', { class: 'uc-dua' }, el('div', { class: 'uc-uji' }, el('small', null, 'urut_sisip( [ … ] )'), input, button('▶ Uji urut_sisip', () => test('sisip'), 'primary'), el('small', null, 'cari_biner(antrean, x)'), el('div', { class: 'uc-baris' }, stepper(x, (v) => { x = v; }, { min: 90, max: 130, label: 'x' }), button('▶ Uji cari_biner', () => test('cari'), 'primary'))),
            el('table', { class: 'uc-tabel' }, el('tr', null, ['tim', 'panggilan', 'versi benar', 'versi rahasia'].map((h) => el('th', null, h))), log.map((g) => el('tr', { class: g.beda ? 'beda' : '' }, el('td', null, `Tim ${g.who + 1}`), el('td', null, el('code', null, g.call)), el('td', null, g.a), el('td', null, g.b))))),
          listView(ANTREAN, { idx: true }), el('p', { class: `reveal ${cls}` }, msg || 'Masukan hanya tampil di layar dan tidak disimpan.'));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Bongkar Selisih Satu', start);
}
