// Data Panen dalam CSV dan JSON — SMA/SMK (16–18 tahun), coding. Kelompok Tani
// Makmur's panen.csv (with the trailing newline), Rudi's program that stops with
// ValueError at file row 6 after Pak Joko's silent 75, the periksa validator that
// skips blank rows and records file row numbers, productivity as total ÷ total
// luas, and json.dumps with indent=2. Every result comes from running the
// worksheet code in mini-py on the same file contents.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, pyCode, pyTracer, fmtNum } from './smp-kit.js';
import { misiHead, fill, codeView, codeFill, rowsView, fillBoard, layar, play } from './misi-kit.js';
import { runPy, pyRepr } from './mini-py.js';

export const CSV = 'nama,luas_ha,hasil_kg\nPak Darto,0.5,2900\nBu Wati,0.25,1450\nPak Joko,0,75,4100\nPak Slamet,0.75,4200\nBu Ani,1.0,\nBu Lastri,1.0,5800\nPak Budi,satu,3800\nPak Yanto,0.5,3050\nBu Rina,0.6,-500\n';
export const RUDI = ['with open("panen.csv") as f:', '    semua = f.read().split("\\n")', 'total = 0', 'for baris in semua[1:]:', '    kolom = baris.split(",")', '    total = total + int(kolom[2])', 'print("Rata-rata hasil:", total / (len(semua) - 1))'];
export const VALID = ['def periksa(baris):', '    kolom = baris.split(",")', '    if len(kolom) != 3:', '        return None, "jumlah kolom " + str(len(kolom))', '    nama = kolom[0].strip()', '    try:', '        luas = float(kolom[1])', '        hasil = int(kolom[2])', '    except ValueError:', '        return None, "bukan angka"', '    if luas <= 0 or hasil <= 0:', '        return None, "angka harus positif"', '    return {"nama": nama, "luas_ha": luas, "hasil_kg": hasil}, "ok"', 'with open("panen.csv") as f:', '    semua = f.read().split("\\n")', 'data = []', 'rusak = []', 'for i in range(1, len(semua)):', '    if semua[i].strip() == "":', '        continue', '    isi, pesan = periksa(semua[i])', '    if isi is None:', '        rusak.append((i + 1, pesan))', '    else:', '        data.append(isi)'];
const ISIAN = { 2: '    if ..............................:', 10: '    if ..............................:', 18: '    if ..............................:', 22: '        rusak.append(..............................)' };
export const VALID_KOSONG = VALID.map((x, i) => ISIAN[i] ?? x);
export const HITUNG = ['total_luas = 0', 'total_hasil = 0', 'for d in data:', '    total_luas = total_luas + d["luas_ha"]', '    total_hasil = total_hasil + d["hasil_kg"]', 'print(len(data), total_hasil / len(data), total_hasil / total_luas)'];
export const SIMPAN = ['import json', 'laporan = {"kelompok": "Kelompok Tani Makmur", "musim": "2026-1", "panen": data}', 'teks = json.dumps(laporan, indent=2)', 'with open("panen.json", "w") as f:', '    f.write(teks)'];
export const PROGRAM = [...VALID, ...HITUNG, ...SIMPAN];
// Tantangan checks, used by the team mode: plausibility and duplicate names on top of periksa.
export const LENGKAP = [...VALID.slice(0, 13), 'def periksa_lengkap(baris, terlihat):', '    isi, pesan = periksa(baris)', '    if isi is None:', '        return pesan', '    if isi["hasil_kg"] / isi["luas_ha"] > 10000:', '        return "tidak masuk akal"', '    if isi["nama"] in terlihat:', '        return "nama ganda"', '    return "ok"'];

const lab = (from, n) => Array.from({ length: n }, (_, i) => String(from + i));
const q = (s) => JSON.stringify(s);
export const barisBerkas = (t) => t.split('\n');

// Run a program on a CSV text; returns the run and the files it left behind.
export function jalankan(lines, csv = CSV) {
  const files = { 'panen.csv': csv };
  const R = runPy(lines, { limit: 60000, files });
  return { R, files };
}
// The full worksheet program on a file: accepted rows, rejected rows with reasons, totals and JSON.
export function analisa(csv = CSV) {
  const { R, files } = jalankan(PROGRAM, csv);
  const v = R.vars; const rusak = new Map((v.rusak || []).map(([n, p]) => [n, p]));
  const data = (v.data || []).map((d) => ({ nama: d.get('nama'), luas: d.get('luas_ha'), hasil: d.get('hasil_kg') }));
  return { R, rusak, data, out: R.out, error: R.error, json: files['panen.json'] ?? null, totalLuas: v.total_luas, totalHasil: v.total_hasil };
}
export function rudi(csv = CSV) { return jalankan(RUDI, csv).R; }
// Rudi's loop row by row (file row, kolom[2] as Python shows it, total afterwards or the stop).
export function rudiJejak(csv = CSV) {
  const rows = barisBerkas(csv).slice(1); const out = []; let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const kol = rows[i].split(','); const k2 = kol[2];
    if (k2 === undefined) { out.push({ baris: i + 2, k2: null, total: null, galat: 'IndexError' }); break; }
    if (!/^\s*[-+]?\d+\s*$/.test(k2)) { out.push({ baris: i + 2, k2, total: null, galat: 'ValueError' }); break; }
    total += parseInt(k2, 10); out.push({ baris: i + 2, k2, total });
  }
  return out;
}
export function evalPy(expr) { const R = runPy([`print(repr(${expr}))`]); return R.error ? `${R.error.type}: ${R.error.message}` : R.out[0]; }
// Which rule catches a row (team mode), with the names already in the file.
const ATURAN = [['jumlah kolom', 'jumlah kolom'], ['bukan angka', 'angka'], ['angka harus positif', 'positif'], ['tidak masuk akal', 'kewajaran'], ['nama ganda', 'nama ganda'], ['ok', 'lolos semua aturan']];
export const ATURAN_LABEL = ATURAN.map((a) => a[1]);
export function periksaLengkap(baris, terlihat) {
  const R = runPy([...LENGKAP, `print(periksa_lengkap(${q(baris)}, ${q(terlihat)}))`], { limit: 5000 });
  if (R.error) return { pesan: `${R.error.type}: ${R.error.message}`, aturan: null };
  const pesan = R.out[0]; const a = ATURAN.find(([p]) => pesan.startsWith(p));
  return { pesan, aturan: a ? a[1] : null };
}

// A generated file from another group (same for every race pane via ctx.rand).
const NAMA_LAIN = ['Pak Harjo', 'Bu Sumi', 'Pak Tarno', 'Bu Inah', 'Pak Wardi', 'Bu Yati', 'Pak Rohmat', 'Bu Karsih', 'Pak Sarju', 'Bu Warsini'];
export function berkasAcak(rand) {
  const pick = (xs) => xs[Math.floor(rand.next() * xs.length)];
  const nama = rand.shuffle([...NAMA_LAIN]);
  const jenis = ['ok', 'ok', pick(['kolom', 'kolom2']), pick(['kosong', 'huruf', 'ribuan']), pick(['negatif', 'nol']), pick(['ok', 'ribuan', 'kolom'])];
  const urut = rand.shuffle(jenis);
  const rows = urut.map((j, i) => {
    const luas = pick([0.25, 0.4, 0.5, 0.75, 1.0]); const ls = luas === 1 ? '1.0' : String(luas); const hasil = Math.round((luas * (5200 + Math.floor(rand.next() * 10) * 100)) / 10) * 10;
    const n = nama[i];
    return { ok: `${n},${ls},${hasil}`, kolom: `${n},${ls.replace('.', ',')},${hasil}`, kolom2: `${n},${ls}`, kosong: `${n},${ls},`, huruf: `${n},setengah,${hasil}`, ribuan: `${n},${ls},${fmtNum(hasil)}`, negatif: `${n},${ls},-${hasil}`, nol: `${n},0,${hasil}` }[j];
  });
  return `nama,luas_ha,hasil_kg\n${rows.join('\n')}\n`;
}

// ---- Permainan: Pos Periksa Data ----
// The team runs the data checkpoint of Kelompok Tani Makmur: rows are split
// into column cards, converted, checked at the periksa gate, counted and packed
// into JSON. Si Penyelundup Data sneaks broken rows past without an error.
const HEAD50 = {
  bongkar: ['Bongkar Baris CSV', 'Seret setiap baris ke kotak data atau rusak, lalu uji tiga ekspresi.', 'Baris rusakku menyamar!'],
  tumbang: ['Program yang Tumbang', 'Jadilah program Rudi: ketuk kolom[2] di setiap baris.', 'Pak Joko lewat diam-diam, hehe.'],
  gerbang: ['Rakit Gerbang Validasi', 'Lengkapi periksa dan perulangannya.', 'Gerbangmu bolong!'],
  jaga: ['Jaga Gerbang', 'Setiap baris tiba di gerbang: ketuk lampu dan alasannya.', 'Aku datang bersepuluh!'],
  hitung: ['Hitung Produktivitas', 'Masukkan kartu yang lolos ke kalkulator, lalu baca keluarannya.', 'Rata-rata saja, gampang!'],
  json: ['Kemas ke JSON', 'Isi kartu JSON Bu Wati, lalu bandingkan ukuran berkasnya.', 'Angka jadi teks, teks jadi angka!'],
  jelajah: ['Jelajah JSON', 'Ketuk jalan menuju nilai yang diminta.', 'Datamu kusembunyikan berlapis-lapis.'],
  selundup: ['Penyelundup lawan Penjaga', 'Ramalkan hasil periksa untuk lima baris selundupan.', 'Kali ini barisku lebih licik!'],
  subur: ['Berkas Tani Subur', 'Kelompok lain mengirim berkas baru. Jaga gerbangnya!', 'Berkas baru, penyamaran baru!'],
  bos: ['Gerbang Super', 'Tambah aturan kewajaran dan nama ganda, lalu kenali csv.reader.', 'Panen 29 ton dari setengah hektare!'],
};
const msg50 = (t) => el('p', { class: 'reveal info' }, t);
const pyq = (s) => pyRepr(s);
const BARIS50 = barisBerkas(CSV);

// Cards dropped into named boxes; cards are [text, boxId or null, hint].
function sortBoard50(ctx, { oops, msg, bins, cards, done, onPlace = null }) {
  let left = cards.filter((c) => c[1]).length;
  const binEls = bins.map(([id, lab]) => el('div', { class: `pd50-kotak ${id}`, 'data-drop': id }, el('b', null, lab), el('div', { class: 'pd50-isi' })));
  const tray = el('div', { class: 'pd50-baki' }, cards.map((c, i) => el('div', { class: 'pd50-baris', 'data-drag': String(i) }, c[0])));
  const host = el('div', { class: 'pd50-kolom' }, tray, el('div', { class: 'pd50-kotak-kotak' }, binEls));
  dnd(host, (chip, bin) => {
    if (!bin.classList.contains('pd50-kotak') || chip.classList.contains('locked')) return; const c = cards[+chip.dataset.drag];
    if (c[1] !== bin.dataset.drop) { oops(); shake(chip); say(msg, 'bad', c[2]); return; }
    chip.classList.add('locked'); bin.lastChild.append(onPlace ? onPlace(c, chip) : chip); ctx.sound.tap(); left--;
    if (left) { say(msg, 'info', c[3] || 'Tepat.'); return; }
    tray.remove(); done();
  });
  return host;
}
const potong = (b) => el('span', { class: 'pd50-potong' }, b.split(',').map((k, i) => el('code', null, el('sup', null, i), pyq(k))));

// Misi 1: split rows, sort them, and test three expressions.
function bongkarRound(area, ctx, { oops, done }) {
  const msg = msg50('Seret setiap baris ke kotak. Saat jatuh, baris dipecah menjadi kolom.'); const box = el('div', { class: 'pd50-kolom' });
  const A = analisa(); const ALASAN = { 4: 'Koma desimal memecah 0,75 menjadi dua kolom: 4 kolom.', 6: 'Kolom hasil_kg kosong.', 8: 'Luas ditulis dengan huruf.', 10: 'Hasil panen negatif.' };
  const cards = BARIS50.slice(1, 10).map((b, i) => { const n = i + 2; const r = A.rusak.has(n); return [`${n} · ${b}`, r ? 'rusak' : 'data', r ? `${ALASAN[n]} Baris ini rusak.` : 'Tiga kolom, angka, dan positif: baris ini sah.', r ? `Baris ${n}: ${A.rusak.get(n)}.` : 'Tepat.']; });
  fill(box, el('div', { class: 'pd50-judul' }, el('code', null, `1 · ${BARIS50[0]}`), potong(BARIS50[0])), sortBoard50(ctx, { oops, msg, bins: [['data', '✅ data'], ['rusak', '🚫 rusak']], cards,
    onPlace: (c, chip) => { const b = c[0].split(' · ')[1]; chip.replaceChildren(el('b', null, c[0].split(' · ')[0]), potong(b)); return chip; },
    done: () => { say(msg, 'info', 'Baris rusak tertangkap. Sekarang uji tiga ekspresi.'); const papan = box.lastChild;
      fill(box, el('div', { class: 'pd50-dua' }, papan, fillBoard(ctx, { oops, msg, view: rowsView([['"Pak Joko,0,75,4100".split(",") → ', '_', ' kolom'], ['"0.5" + "0.25" → ', '_'], ['float("0.5") + float("0.25") → ', '_']]), chips: ['4', '3', evalPy('"0.5" + "0.25"'), evalPy('float("0.5") + float("0.25")'), '0.3'], want: ['4', evalPy('"0.5" + "0.25"'), evalPy('float("0.5") + float("0.25")')],
        hints: ['Hitung potongan setelah dipecah di setiap koma.', 'Dua teks yang dijumlah hanya disambung.', 'float mengubah teks menjadi bilangan dulu.'], done: () => { say(msg, '', 'Semua isi CSV adalah teks. Angka baru menjadi angka setelah int() atau float().'); done(); } }))); } }));
  area.append(box, msg);
}

// Misi 2: be Rudi's loop.
function tumbangRound(area, ctx, { oops, done }) {
  const msg = msg50('Untuk setiap baris, ketuk kolom[2] yang diambil baris kode 6.'); const box = el('div', { class: 'pd50-kolom' }); const J = rudiJejak(); const R = rudi(); let k = 0; let total = 0;
  const kiri = el('div', { class: 'pd50-kolom' }); const kanan = el('div', { class: 'pd50-kolom' });
  const kode = () => codeView(['with open("panen.csv") as f:', '  semua = f.read().split("\\n")', 'total = 0', 'for baris in semua[1:]:', '  kolom = baris.split(",")', '  total = total + int(kolom[2])', 'print("Rata-rata hasil:",', '      total / (len(semua) - 1))'], { labels: ['1', '2', '3', '4', '5', '6', '7', ''], hl: k < J.length ? [5] : [], warn: k >= J.length ? [5] : [] });
  const draw = () => { fill(kiri, kode(), el('div', { class: 'pd50-total' }, 'total = ', el('b', null, String(total))));
    if (k >= J.length) return; const b = BARIS50[J[k].baris - 1];
    fill(kanan, el('code', { class: 'pd50-soal' }, `baris berkas ${J[k].baris}`), el('div', { class: 'pd50-potong besar' }, b.split(',').map((x, i) => onTap(el('button', { type: 'button', class: 'pd50-kol', 'data-i': i }, el('sup', null, i), pyq(x)), () => tap(i))))); };
  function tap(i) {
    if (k >= J.length) return; const s = J[k];
    if (i !== 2) { oops(); say(msg, 'bad', 'Indeks dimulai dari 0: kolom[2] adalah potongan ketiga.'); return; }
    ctx.sound.tap();
    if (s.galat) { k = J.length; draw(); const out = layar(); kanan.append(out); play(out, [], { err: `${R.error.type}: ${R.error.message}` }); say(msg, 'info', `int('') gagal: program tumbang di baris kode 6. Satu pertanyaan lagi.`);
      kanan.append(fillBoard(ctx, { oops, msg, view: rowsView([['len(semua) - 1 → ', '_'], ['baris Pak Joko menyumbang ', '_']]), chips: ['10', '9', '11', '75', '4100'], want: ['10', '75'], hints: ['split("\\n") juga memberi baris kosong di akhir berkas.', 'Baris Pak Joko punya 4 kolom, dan kolom[2] berisi 75.'],
        done: () => { say(msg, '', 'Si Penyelundup menang dua kali: 75 masuk diam-diam, lalu program tumbang. Perlu gerbang!'); done(); } })); return; }
    total = s.total; k++; draw(); say(msg, 'info', s.k2 === '75' ? 'Hanya 75? Pak Joko lolos tanpa pesan galat!' : `total = ${total}.`);
  }
  draw(); fill(box, el('div', { class: 'pd50-dua' }, kiri, kanan));
  area.append(box, msg);
}

// Misi 3: assemble periksa and its loop.
function gerbangRound(area, ctx, { oops, done }) {
  const msg = msg50('Penjaga Gerbang: lengkapi dua pemeriksaan di periksa.'); const box = el('div', { class: 'pd50-kolom' }); const out = layar();
  const tahapB = () => { say(msg, 'info', 'Sekarang perulangan yang memanggil periksa.');
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['for i in range(1, len(semua)):', ['  if ', '_', ':'], '    continue', '  isi, pesan = periksa(semua[i])', '  if isi is None:', ['    rusak.append(', '_', ')'], '  else:', '    data.append(isi)'], { labels: lab(18, 8) }),
      chips: ['semua[i].strip() == ""', 'semua[i] is None', '(i + 1, pesan)', '(i, pesan)'], want: ['semua[i].strip() == ""', '(i + 1, pesan)'], hints: ['Lewati baris kosong di akhir berkas.', 'i dimulai dari 0 untuk baris pertama berkas: nomor barisnya i + 1.'],
      done: () => { const A = analisa(); say(msg, 'info', 'Gerbang dijalankan untuk seluruh berkas…'); box.append(out); play(out, [`rusak = ${pyRepr(A.R.vars.rusak)}`, `len(data) = ${A.data.length}`], { gap: 600, end: () => { say(msg, '', 'Empat penyelundup tertangkap dengan nomor baris dan alasannya. Lima catatan masuk.'); done(); } }); } })); };
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['def periksa(baris):', '  kolom = baris.split(",")', ['  if ', '_', ':'], '    return None, ("jumlah kolom "', '      + str(len(kolom)))', '  # 5–10: float, int, except ValueError', ['  if ', '_', ':'], '    return None, "angka harus positif"'], { labels: ['1', '2', '3', '4', '', '5', '11', '12'] }),
    chips: ['len(kolom) != 3', 'len(kolom) == 3', 'luas <= 0 or hasil <= 0', 'luas < 0 and hasil < 0'], want: ['len(kolom) != 3', 'luas <= 0 or hasil <= 0'], hints: ['Tolak bila jumlah kolomnya bukan 3.', 'Satu saja yang nol atau negatif sudah salah.'], done: () => setTimeout(tahapB, 800) }));
  area.append(box, msg);
}

// Misi 3b: rows arrive at the gate one by one.
function jagaRound(area, ctx, { oops, done }, csv = null) {
  const msg = msg50('Baris berikutnya tiba. Lampu hijau, lampu merah dengan alasan, atau lewati baris kosong?'); const box = el('div', { class: 'pd50-kolom' }); const A = analisa(csv || CSV); const BARIS = barisBerkas(csv || CSV); let n = 2;
  const masuk = el('div', { class: 'pd50-kotak data' }, el('b', null, '✅ data'), el('div', { class: 'pd50-isi' })); const tolak = el('div', { class: 'pd50-kotak rusak' }, el('b', null, '🚫 rusak'), el('div', { class: 'pd50-isi' }));
  const gate = el('div', { class: 'pd50-kolom' });
  const asli = (m) => (BARIS[m - 1].trim() === '' ? 'lewat' : A.rusak.has(m) ? A.rusak.get(m) : 'ok');
  const want = (m) => asli(m).replace(/^jumlah kolom \d+$/, 'jumlah kolom');
  const draw = () => { if (n > BARIS.length) { fill(gate); return; } const b = BARIS[n - 1];
    fill(gate, el('code', { class: 'pd50-soal' }, `baris ${n}: ${b === '' ? "''" : b}`), el('div', { class: 'pd50-tombol', 'data-want': want(n) }, [['ok', '🟢 masuk data'], ['jumlah kolom', '🔴 jumlah kolom'], ['bukan angka', '🔴 bukan angka'], ['angka harus positif', '🔴 angka harus positif'], ['lewat', '⏭️ continue']].map(([v, t]) => onTap(el('button', { type: 'button', class: 'pd50-pilih', 'data-v': v }, t), () => jawab(v))))); };
  function jawab(v) {
    if (n > BARIS.length) return; const w = want(n); const b = BARIS[n - 1];
    if (v !== w) { oops(); say(msg, 'bad', w === 'lewat' ? 'Baris kosong: strip() == "" sehingga continue.' : w === 'ok' ? 'Tiga kolom, angka, positif: lampu hijau.' : w.startsWith('jumlah') ? 'Hitung kolomnya dulu: pemeriksaan pertama.' : w === 'bukan angka' ? 'float atau int gagal: except ValueError.' : 'Ada angka nol atau negatif.'); return; }
    ctx.sound.tap(); if (w === 'ok') masuk.lastChild.append(el('span', { class: 'pd50-cap' }, b.split(',')[0])); else if (w !== 'lewat') tolak.lastChild.append(el('span', { class: 'pd50-cap' }, `${n}: ${asli(n)}`)); n++; draw();
    if (n <= BARIS.length) { say(msg, 'info', 'Tepat.'); return; }
    if (csv) { const J = rudiJejak(csv); const g = J.find((x) => x.galat); const nomor = BARIS.slice(1, -1).map((_, i) => String(i + 2)); gate.dataset.tumbang = g ? String(g.baris) : 'tidak tumbang';
      say(msg, 'info', 'Berkas habis. Bagaimana kalau berkas ini diberikan ke program Rudi?');
      fill(gate, fillBoard(ctx, { oops, msg, view: rowsView([['program Rudi tumbang di baris berkas ', '_']]), chips: [...nomor, 'tidak tumbang'], want: [g ? String(g.baris) : 'tidak tumbang'], hints: ['Program Rudi hanya membaca kolom[2]: tumbang bila kolom itu tidak ada atau bukan bilangan bulat.'],
        done: () => { say(msg, '', g ? `Di baris ${g.baris} ${g.galat}. Gerbang periksa tetap jalan sampai baris terakhir.` : 'Program Rudi tidak tumbang, tetapi menjumlah baris rusak diam-diam. Itu lebih berbahaya!'); done(); } })); return; }
    say(msg, 'info', 'Berkas habis.'); box.append(fillBoard(ctx, { oops, msg, view: rowsView([['catatan di data: ', '_', ', di rusak: ', '_']]), chips: [String(A.data.length), String(A.rusak.size), '9', '10'], want: [String(A.data.length), String(A.rusak.size)], hints: ['Hitung kartu hijau.', 'Hitung kartu merah.'],
      done: () => { say(msg, '', 'Tidak ada yang tumbang: setiap baris rusak dicatat dengan nomor dan alasannya.'); done(); } }));
  }
  draw(); fill(box, el('div', { class: 'pd50-dua' }, gate, el('div', { class: 'pd50-kolom' }, masuk, tolak)));
  area.append(box, msg);
}

// Misi 4: the calculator.
function hitungRound(area, ctx, { oops, done }) {
  const msg = msg50('Seret setiap catatan yang lolos ke kalkulator.'); const box = el('div', { class: 'pd50-kolom' }); const nv = (x) => (x && typeof x === 'object' ? x.v : x); const A = analisa(); A.data = A.data.map((d) => ({ ...d, luas: nv(d.luas), hasil: nv(d.hasil) })); let L = 0; let H = 0; let n = 0;
  const angka = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(+x.toFixed(4))); const kal = el('div', { class: 'pd50-kal', 'data-drop': 'kal' }, el('b', null, '🧮 kalkulator'), el('code', null, 'total_luas = 0 · total_hasil = 0'));
  const per = A.data.map((d) => d.hasil / d.luas); const rata = per.reduce((s, x) => s + x, 0) / per.length;
  const host = el('div', { class: 'pd50-dua' }, el('div', { class: 'pd50-baki kolom' }, A.data.map((d, i) => el('div', { class: 'pd50-baris', 'data-drag': String(i) }, `${d.nama} · ${angka(d.luas)} ha · ${d.hasil} kg`))), kal);
  dnd(host, (c, t) => { if (t.dataset.drop !== 'kal' || c.classList.contains('locked')) return; const d = A.data[+c.dataset.drag]; L += d.luas; H += d.hasil; n++; c.classList.add('locked'); c.remove(); ctx.sound.tap();
    kal.lastChild.textContent = `total_luas = ${angka(L)} · total_hasil = ${H}`;
    if (n < A.data.length) { say(msg, 'info', `${d.nama} masuk.`); return; }
    say(msg, 'info', 'Baca keluaran baris terakhir program, lalu bandingkan dua cara menghitung produktivitas.');
    box.append(codeView(['print(len(data), total_hasil / len(data),', '      total_hasil / total_luas)']), fillBoard(ctx, { oops, msg, view: rowsView([['keluaran: ', '_'], ['rata-rata produktivitas 5 petani: ', '_'], ['produktivitas kelompok: ', '_', ' kg/ha']]),
      chips: [A.out[0], '5 3480 5800', fmtNum(rata), fmtNum(H / L), fmtNum(H / A.data.length)], want: [A.out[0], fmtNum(rata), fmtNum(H / L)],
      hints: ['Pembagian / selalu memberi float.', 'Jumlahkan lima produktivitas, lalu bagi 5.', 'Total hasil ÷ total luas: lahan besar berbobot lebih besar.'], done: () => { say(msg, '', `${fmtNum(H / L / 1000, 1)} ton per hektare. Rata-rata dari rata-rata (${fmtNum(rata)}) mengabaikan luas lahan.`); done(); } })); });
  fill(box, host);
  area.append(box, msg);
}

// Misi 5: pack a record into JSON, then compare sizes.
function jsonRound(area, ctx, { oops, done }) {
  const msg = msg50('Kemas catatan Bu Wati: teks pakai tanda kutip, angka tidak.'); const box = el('div', { class: 'pd50-kolom' }); const A = analisa();
  const sah = [BARIS50[0], ...BARIS50.filter((b, i) => i && A.data.some((d) => b.startsWith(`${d.nama},`)))].join('\n') + '\n'; const rasio = A.json.length / sah.length;
  fill(box, el('code', { class: 'pd50-soal' }, 'Bu Wati,0.25,1450'), fillBoard(ctx, { oops, msg, view: rowsView([['{"nama": ', '_', ','], [' "luas_ha": ', '_', ','], [' "hasil_kg": ', '_', '}']]), chips: ['"Bu Wati"', '0.25', '1450', '"0.25"', '"1450"', 'Bu Wati'], want: ['"Bu Wati"', '0.25', '1450'],
    hints: ['Teks JSON selalu di dalam tanda kutip ganda.', 'periksa sudah mengubahnya menjadi float.', 'periksa sudah mengubahnya menjadi int.'],
    done: () => { say(msg, 'info', `json.dumps(laporan, indent=2) menulis ${A.json.length} karakter. CSV lima baris sah ${sah.length} karakter.`);
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['JSON sekitar ', '_', ' kali lebih besar'], ['keuntungannya: ', '_']]), chips: [String(Math.round(rasio)), String(Math.round(rasio) + 3), 'nama kunci dan tipe ikut tersimpan', 'berkasnya lebih kecil'], want: [String(Math.round(rasio)), 'nama kunci dan tipe ikut tersimpan'],
        hints: [`${A.json.length} ÷ ${sah.length}.`, 'Setiap nilai berlabel, dan angka tetap angka.'], done: () => { say(msg, '', `${fmtNum(rasio, 2)} kali: JSON lebih boros, tetapi bisa bertingkat dan tidak perlu menebak tipe.`); done(); } })); } }));
  area.append(box, msg);
}

// Misi 5b: walk a nested JSON value by tapping keys and indexes.
export const JALAN50 = [['panen', 3, 'hasil_kg'], ['panen', 0, 'nama'], ['musim']];
function jelajahRound(area, ctx, { oops, done }) {
  const msg = msg50('Ketuk kunci atau indeks satu per satu.'); const box = el('div', { class: 'pd50-kolom' }); const A = analisa(); const lap = JSON.parse(A.json); let q = 0; let path = [];
  const tujuan = () => JALAN50[q]; const ekspr = (p) => `json.loads(teks)${p.map((x) => `[${typeof x === 'number' ? x : `"${x}"`}]`).join('')}`;
  const draw = () => {
    let cur = lap; path.forEach((p) => { cur = cur[p]; });
    const isObj = cur && typeof cur === 'object';
    const items = !isObj ? [] : Array.isArray(cur) ? cur.map((v, i) => [i, `[${i}] ${v.nama ?? ''}`]) : Object.keys(cur).map((k) => [k, `"${k}"`]);
    fill(box, el('code', { class: 'pd50-soal' }, `cari: ${ekspr(tujuan())}`), el('code', { class: 'pd50-jalan' }, ekspr(path) || 'json.loads(teks)'),
      el('div', { class: 'pd50-json' }, items.map(([k, t]) => onTap(el('button', { type: 'button', class: 'pd50-kunci', 'data-k': String(k) }, t, el('small', null, typeof cur[k] === 'object' ? (Array.isArray(cur[k]) ? ` [${cur[k].length}]` : ' {…}') : `: ${JSON.stringify(cur[k])}`)), () => tap(k)))));
  };
  function tap(k) {
    const w = tujuan()[path.length];
    if (k !== w) { oops(); say(msg, 'bad', typeof w === 'number' ? `List diakses dengan indeks; indeks dimulai dari 0.` : `Ketuk kunci "${w}".`); return; }
    path.push(k); ctx.sound.tap();
    if (path.length < tujuan().length) { draw(); say(msg, 'info', 'Masuk satu lapis.'); return; }
    box.querySelector('.pd50-json')?.replaceChildren(); let v = lap; path.forEach((p) => { v = v[p]; }); say(msg, 'info', `${ekspr(path)} → ${JSON.stringify(v)}`); q++; path = [];
    if (q < JALAN50.length) { setTimeout(draw, 900); return; }
    box.append(fillBoard(ctx, { oops, msg, view: rowsView([['["panen"][3] adalah catatan ', '_']]), chips: [lap.panen[3].nama, lap.panen[2].nama, lap.panen[4].nama], want: [lap.panen[3].nama], hints: ['Hitung dari 0.'], done: () => { say(msg, '', 'JSON bertingkat: dictionary berisi list berisi dictionary.'); done(); } }));
  }
  draw();
  area.append(box, msg);
}

// Misi 6: five smuggled rows versus periksa.
export const BANK50 = ['Pak Edi,0.5,2.900', 'Bu Siti, 0.5 , 3000 ', 'Pak Eko,0.5,29000', 'Pak Darto,0.5,2900', '"Darto, S.P.",0.5,2900'];
function selundupRound(area, ctx, { oops, done }) {
  const msg = msg50('Ramalkan: apakah periksa menerima atau menolak setiap baris?'); const box = el('div', { class: 'pd50-kolom' });
  const hasil = BANK50.map((b) => runPy([...VALID.slice(0, 13), `isi, pesan = periksa(${JSON.stringify(b)})`, 'print(pesan)']).out[0]);
  fill(box, sortBoard50(ctx, { oops, msg, bins: [['terima', '🟢 diterima'], ['tolak', '🔴 ditolak']], cards: BANK50.map((b, i) => [b, hasil[i] === 'ok' ? 'terima' : 'tolak', hasil[i] === 'ok' ? 'Jalankan periksa langkah demi langkah: semua pemeriksaannya lolos.' : `periksa menolaknya: ${hasil[i]}.`, `→ ${hasil[i]}`]),
    done: () => { say(msg, 'info', 'Tetapi apakah periksa selalu benar?');
      box.append(fillBoard(ctx, { oops, msg, view: rowsView([['lolos padahal salah: Pak Eko (29 ton) dan ', '_'], ['ditolak padahal sah: ', '_']]), chips: ['Pak Darto kedua', '"Darto, S.P."', 'Bu Siti', 'Pak Edi'], want: ['Pak Darto kedua', '"Darto, S.P."'],
        hints: ['Nama yang sudah ada di berkas.', 'Koma di dalam tanda kutip ikut dipecah split.'], done: () => { say(msg, '', 'Penyelundup licik lolos dari aturan yang ada. Misi Bos akan menambah aturannya.'); done(); } })); } }));
  area.append(box, msg);
}

// Misi Bos: the super gate.
function bosRound(area, ctx, { oops, done }) {
  const msg = msg50('Tolak panen yang tidak masuk akal: lebih dari 10.000 kg per hektare.'); const box = el('div', { class: 'pd50-kolom' }); const out = layar();
  const tahapC = () => { say(msg, 'info', 'Terakhir: modul csv paham tanda kutip.');
    fill(box, codeView(['import csv', 'for kolom in csv.reader(f):', '  ...']), fillBoard(ctx, { oops, msg, view: rowsView([['"Darto, S.P.",0.5,2900 → ', '_', ' kolom'], ['nama: ', '_']]), chips: ['3', '4', 'Darto, S.P.', '"Darto'], want: ['3', 'Darto, S.P.'], hints: ['Koma di dalam tanda kutip bukan pemisah.', 'Tanda kutipnya dibuang.'],
      done: () => { say(msg, '', 'Gerbang Super: kewajaran di periksa, nama ganda di perulangan, dan csv.reader untuk nama berkoma.'); done(); } })); };
  const tahapB = () => { say(msg, 'info', 'Nama ganda butuh ingatan tentang baris sebelumnya: periksa di perulangan dengan set.');
    fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['terlihat = set()', 'for i in range(1, len(semua)):', '  ...', '  if isi is None:', '    rusak.append((i + 1, pesan))', ['  elif ', '_', ':'], '    rusak.append((i + 1, "nama ganda"))', ['  else: data.append(isi); ', '_']]),
      chips: ['isi["nama"] in terlihat', 'terlihat.add(isi["nama"])', 'isi in data', 'terlihat.append(isi["nama"])'], want: ['isi["nama"] in terlihat', 'terlihat.add(isi["nama"])'], hints: ['Periksa apakah namanya sudah pernah terlihat.', 'set memakai add, bukan append.'], done: () => setTimeout(tahapC, 800) })); };
  fill(box, fillBoard(ctx, { oops, msg, view: codeFill(['  if luas <= 0 or hasil <= 0:', '    return None, "angka harus positif"', ['  if ', '_', ':'], '    return None, "tidak masuk akal"']), chips: ['hasil / luas > 10000', 'hasil > 10000', 'luas / hasil > 10000'], want: ['hasil / luas > 10000'], hints: ['Produktivitas = hasil ÷ luas.'],
    done: () => { const p = periksaLengkap('Pak Eko,0.5,29000', []); box.append(out); play(out, [`Pak Eko,0.5,29000 → ${p.pesan}`], { end: () => setTimeout(tahapB, 1000) }); } }));
  area.append(box, msg);
}

export default {
  id: 'sma-50-csv-json',
  title: 'Data Panen dalam CSV dan JSON',
  topic: 'Membaca berkas CSV dengan Python, galat yang menghentikan program dan galat diam-diam, validasi baris data, rata-rata dan produktivitas, serta menyimpan data sebagai JSON',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Baca data panen Kelompok Tani Makmur dari berkas CSV, temukan baris yang rusak beserta alasannya, hitung produktivitas dari data yang sah, lalu simpan hasilnya sebagai JSON.',
  extraModes: [
    { id: 'pengurai', icon: '🧾', label: 'Pengurai CSV', desc: 'Sunting isi berkas dan lihat setiap baris dipecah menjadi kolom, baris rusak disorot, serta total, produktivitas, dan JSON yang terbentuk', create: createParser },
    { id: 'telusur', icon: '🔎', label: 'Penelusur Kode', desc: 'Jalankan program Rudi dan program validasi baris demi baris, dengan isi kolom, total, data, dan rusak di samping kode', create: createTrace },
    { id: 'giliran', icon: '🪤', label: 'Baris Jebakan', desc: 'Satu tim menyusun baris jebakan, tim lain memilih aturan validasi yang menangkapnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pd50-main' }); root.append(wrap);
    function render() {
      wrap.replaceChildren(); const r = ctx.round; let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'pd50-area' }); let foe = null;
      const go = (k, no) => { const [judul, tujuan, ulah] = HEAD50[k]; foe = el('div', { class: 'pd50-musuh' }, el('b', null, '🦹 Si Penyelundup Data'), el('span', null, ulah)); wrap.append(el('div', { class: 'pd50-kepala' }, misiHead(no, judul, tujuan, '🛂'), foe), area); };
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => { foe.classList.add('beres'); foe.lastChild.textContent = 'Data bersih ✓'; next(ms); } });
      if (r === 0) { go('bongkar', 1); bongkarRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('tumbang', 2); tumbangRound(area, ctx, fin(5500)); }
      else if (r === 2) { go('gerbang', 3); gerbangRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('jaga', 3); jagaRound(area, ctx, fin(5500)); }
      else if (r === 4) { go('subur', 4); jagaRound(area, ctx, fin(5500), berkasAcak(ctx.rand)); }
      else if (r === 5) { go('hitung', 5); hitungRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('json', 6); jsonRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('jelajah', 6); jelajahRound(area, ctx, fin(5500)); }
      else if (r === 8) { go('selundup', 7); selundupRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); bosRound(area, ctx, fin(7000)); }
    }
    render();
  },
};

// The file as numbered lines, each split into column boxes; rejected rows marked with the reason.
function berkas(csv, { sampai = null, rusak = null, cls = '' } = {}) {
  const rows = barisBerkas(csv); const n = sampai ? Math.min(sampai, rows.length) : rows.length;
  return el('div', { class: `cj-berkas ${cls}` }, rows.slice(0, n).map((t, i) => {
    const no = i + 1; const alasan = rusak?.get(no); const kol = t.split(',');
    return el('div', { class: `cj-baris ${no === 1 ? 'kepala' : ''} ${alasan ? 'rusak' : ''} ${t.trim() === '' ? 'kosong' : ''}` }, el('span', { class: 'cj-no' }, String(no)),
      el('span', { class: 'cj-kol' }, t === '' ? el('i', null, '(kosong)') : null, ...(t === '' ? [] : kol.map((c) => el('b', { class: c === '' ? 'nol' : '' }, c === '' ? '∅' : c.replace(/^ +| +$/g, (m) => '␣'.repeat(m.length)))))),
      rusak ? el('small', { class: 'cj-alasan' }, alasan ? `⚠ ${alasan}` : no === 1 ? 'kepala' : t.trim() === '' ? 'dilewati' : '✓ ok') : null);
  }));
}
// Parser: edit the file, every change reruns the worksheet program and Rudi's program.
const BERSIH = barisBerkas(CSV).filter((t, i) => i === 0 || (t && !analisa(CSV).rusak.has(i + 1))).join('\n') + '\n';
function createParser(root, ctx) {
  const wrap = el('div', { class: 'act csv-json' });
  root.append(wrap);
  let teks = CSV; let tab = 'hasil';
  const area = el('textarea', { class: 'cj-area', rows: 12, spellcheck: 'false', 'aria-label': 'isi panen.csv', oninput: (e) => { teks = e.target.value; clearTimeout(area.t); area.t = setTimeout(hasil, 250); } });
  area.value = teks;
  const panel = el('div', { class: 'cj-panel' });
  const muat = (t) => { teks = t; area.value = t; hasil(); ctx.sound.tap(); };
  function hasil() {
    const A = analisa(teks); const R = rudi(teks);
    const tabs = el('div', { class: 'seg' }, [['hasil', '✅ validasi'], ['json', '{ } JSON'], ['rudi', '⚠ program Rudi']].map(([k, t]) => onTap(el('button', { class: `seg-btn ${tab === k ? 'on' : ''}`, type: 'button' }, t), () => { tab = k; hasil(); })));
    let isi;
    if (tab === 'hasil') isi = el('div', { class: 'cj-ringkas' }, el('p', null, `data sah: ${A.data.length} · rusak: ${A.rusak.size}`),
      A.error ? el('p', { class: 'bad' }, `⚠ Baris ${A.error.line + 1} · ${A.error.type}: ${A.error.message}`) : el('p', { class: 'cj-mono' }, A.out.join('\n')),
      A.totalLuas != null && !A.error ? el('p', null, `Produktivitas ${fmtNum(Number(A.out[0]?.split(' ')[2] ?? 0))} kg per hektare (total hasil ÷ total luas)`) : null,
      el('p', { class: 'cj-mono' }, `rusak = ${pyRepr(A.R.vars.rusak ?? [])}`));
    else if (tab === 'json') isi = el('pre', { class: 'cj-layar json' }, A.json ?? '(panen.json belum terbentuk karena programnya berhenti)');
    else isi = el('div', { class: 'cj-ringkas' }, pyCode(RUDI, { labels: lab(1, 7), cls: 'cj-kecil', warn: R.error ? [R.error.line] : [] }),
      el('pre', { class: 'cj-layar' }, `${R.out.join('\n')}${R.error ? `${R.out.length ? '\n' : ''}⚠ Baris ${R.error.line + 1} · ${R.error.type}: ${R.error.message}` : ''}`), R.error ? null : el('p', { class: 'cj-ket' }, `Program Rudi membagi dengan len(semua) − 1 = ${barisBerkas(teks).length - 1}.`));
    panel.replaceChildren(berkas(teks, { rusak: A.rusak, cls: 'kecil' }), tabs, isi);
  }
  wrap.append(el('p', { class: 'prompt' }, 'Pengurai CSV: panen.csv'),
    el('div', { class: 'cj-atur' }, button('Berkas lembar kerja', () => muat(CSV)), button('Hanya baris sah', () => muat(BERSIH)), button('+ baris Pak Edi,0.5,2.900', () => muat(teks.replace(/\n?$/, '\nPak Edi,0.5,2.900\n'))), button('+ baris Pak Darto lagi', () => muat(teks.replace(/\n?$/, '\nPak Darto,0.5,2900\n')))),
    el('div', { class: 'cj-dua lebar' }, el('div', { class: 'cj-sunting' }, area, el('p', { class: 'cj-ket' }, 'Ketikan hanya tampil di layar ini dan tidak disimpan. Pakai nama rekaan.')), panel));
  hasil();
}

// Tracer: Rudi's program or the validation program on the worksheet file.
function createTrace(root, ctx) {
  const wrap = el('div', { class: 'act csv-json' });
  root.append(wrap);
  let prog = 'rudi'; let tr = null;
  const P = { rudi: ['program Rudi', RUDI, ['f', 'semua']], valid: ['validasi (1–25)', VALID, ['f', 'semua', 'periksa']], hitung: ['validasi + hitung + JSON', PROGRAM, ['f', 'semua', 'periksa', 'laporan', 'teks', 'json']] };
  const draw = () => {
    tr?.stop?.(); const [, lines, hide] = P[prog];
    tr = pyTracer(lines, { labels: lab(1, lines.length), cls: 'cj-kecil', hideVars: hide, opts: () => ({ limit: 60000, files: { 'panen.csv': CSV } }) });
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penelusur: membaca panen.csv'),
      el('div', { class: 'seg' }, Object.entries(P).map(([k, [t]]) => onTap(el('button', { class: `seg-btn ${prog === k ? 'on' : ''}`, type: 'button' }, t), () => { prog = k; draw(); }))),
      el('div', { class: 'cj-dua lebar' }, tr, berkas(CSV, { cls: 'kecil' })));
  };
  draw();
  return () => tr?.stop?.();
}

// Team mode: the maker team builds three trap rows, the other team names the rule that catches each one.
const POTONG = { nama: ['Pak Edi', 'Bu Siti', 'Pak Eko', 'Bu Tini', 'Pak Darto'], luas: ['0.5', '0,5', ' 0.5 ', 'setengah', '0', '-0.5', '1.0', ''], hasil: ['2900', '2.900', '29000', ' 3000 ', '2900.0', '-500', '0', ''] };
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act csv-json' });
  root.append(wrap);
  const terlihat = analisa(CSV).data.map((d) => d.nama);
  function start(nT) {
    const pts = Array(nT).fill(0); let t = 0;
    function step() {
      if (t >= nT) { finishBoard(wrap, ctx, { title: 'Baris Jebakan selesai', pts, again: () => pickTeams(wrap, 'Baris Jebakan', start) }); return; }
      const maker = t % nT; const rows = [0, 1, 2].map((i) => ({ nama: POTONG.nama[i], luas: '0.5', hasil: '2900' })); let k = 0;
      const draw = () => {
        const seg = (key) => el('div', { class: 'seg cj-seg' }, POTONG[key].map((v) => onTap(el('button', { class: `seg-btn ${rows[k][key] === v ? 'on' : ''}`, type: 'button' }, v === '' ? '(kosong)' : v.replace(/^ +| +$/g, (m) => '␣'.repeat(m.length))), () => { rows[k][key] = v; draw(); })));
        wrap.replaceChildren(scoreBar(pts, maker), el('p', { class: 'prompt' }, `Tim ${maker + 1}: susun 3 baris jebakan (tim lain jangan melihat)`),
          el('div', { class: 'seg' }, rows.map((_, i) => onTap(el('button', { class: `seg-btn ${k === i ? 'on' : ''}`, type: 'button' }, `baris ${i + 1}`), () => { k = i; draw(); }))),
          el('div', { class: 'cj-susun' }, ...['nama', 'luas', 'hasil'].map((key) => el('div', { class: 'cj-baris-atur' }, el('small', null, key), seg(key)))),
          el('pre', { class: 'cj-layar' }, rows.map((x) => `${x.nama},${x.luas},${x.hasil}`).join('\n')),
          el('p', { class: 'cj-ket' }, `Nama yang sudah ada di berkas: ${terlihat.join(', ')}.`),
          button('Selesai ➜ tim lain memeriksa', () => periksa(maker, rows.map((x) => `${x.nama},${x.luas},${x.hasil}`)), 'primary'));
      };
      draw();
    }
    function periksa(maker, baris) {
      const who = (maker + 1) % nT; const kunci = baris.map((b) => periksaLengkap(b, terlihat)); const pilih = {};
      const draw = () => {
        const selesai = Object.keys(pilih).length === baris.length;
        wrap.replaceChildren(scoreBar(pts, who), el('p', { class: 'prompt' }, `Tim ${who + 1}: aturan mana yang menangkap setiap baris?`),
          el('p', { class: 'cj-ket' }, 'Urutan aturan: jumlah kolom, angka, positif, kewajaran (lebih dari 10.000 kg per hektare), lalu nama ganda. Satu ketukan per baris.'),
          el('div', { class: 'sk-baris-baris cj-isi' }, baris.map((b, i) => el('div', { class: `sk-baris ${i in pilih ? 'beres' : ''}` }, el('span', { class: 'cj-mono' }, b.replace(/^ +| +$/g, (m) => '␣'.repeat(m.length))),
            i in pilih ? el('b', { class: pilih[i] === kunci[i].aturan ? 'cj-benar' : 'cj-salah' }, `${pilih[i] === kunci[i].aturan ? '✓' : `✗ ${pilih[i]} →`} ${kunci[i].aturan} · periksa: ${kunci[i].pesan}`)
              : el('div', { class: 'seg' }, ATURAN_LABEL.map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, v), () => {
                pilih[i] = v; if (v === kunci[i].aturan) { pts[who] += 1; ctx.sound.tap(); } else { pts[maker] += 1; } draw(); })))))),
          ...(selesai ? [el('p', { class: 'reveal info' }, `Tim ${who + 1} +1 untuk setiap aturan yang tepat, Tim ${maker + 1} +1 untuk setiap baris yang menjebak.`), button('Lanjut ➜', () => { t++; step(); }, 'primary')] : []));
      };
      draw();
    }
    step();
  }
  pickTeams(wrap, 'Baris Jebakan', start);
}
