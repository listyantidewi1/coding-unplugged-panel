// Data Panen dalam CSV dan JSON — SMA/SMK (16–18 tahun), coding. Kelompok Tani
// Makmur's panen.csv (with the trailing newline), Rudi's program that stops with
// ValueError at file row 6 after Pak Joko's silent 75, the periksa validator that
// skips blank rows and records file row numbers, productivity as total ÷ total
// luas, and json.dumps with indent=2. Every result comes from running the
// worksheet code in mini-py on the same file contents.

import { el, onTap, button } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard, rowsChoose, pickSet, pyCode, pyTracer, fmtNum } from './smp-kit.js';
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
const uniq = (xs) => [...new Set(xs)];
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
    const wrap = el('div', { class: 'act csv-json' });
    root.append(wrap);
    const A = analisa(CSV); const RR = rudi(CSV); const J = rudiJejak(CSV); const semua = barisBerkas(CSV);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      if (r === 0) {
        wrap.append(berkas(CSV));
        rowsChoose(wrap, ctx, { prompt: 'Mengenal berkas CSV', cls: 'cj-isi', rows: [
          ['k', 'Gunanya baris 1 (kepala)', ['menyebutkan nama dan urutan kolom; bukan data, jadi dilewati program', 'berisi data petani pertama', 'menandai akhir berkas', 'tidak ada gunanya'], 'menyebutkan nama dan urutan kolom; bukan data, jadi dilewati program'],
          ['n', 'Banyak kolom di setiap baris', ['2', '3', '4', '10'], '3'],
          ['p', 'Pemisah kolom', ['koma', 'titik', 'spasi', 'titik koma'], 'koma'],
          ['b', 'Baris 11', ['kosong karena berkas diakhiri tanda baris baru; cukup dilewati', 'baris rusak yang harus dilaporkan', 'kepala kedua', 'data Bu Rina'], 'kosong karena berkas diakhiri tanda baris baru; cukup dilewati'],
        ], done: next });
      }
      else if (r === 1) {
        wrap.append(berkas(CSV));
        pickSet(wrap, ctx, { prompt: 'Tanpa program: ketuk baris berkas yang rusak', items: lab(2, 9).map((n) => [n, `baris ${n}`]), right: [...A.rusak.keys()].map(String), done: next,
          why: 'Baris 4 memakai koma desimal (0,75), baris 6 hasilnya kosong, baris 8 luasnya ditulis dengan huruf, dan baris 10 hasilnya negatif.' });
      }
      else if (r === 2) {
        const E = [['"Pak Darto,0.5,2900".split(",")', ["['Pak Darto 0.5 2900']", "['Pak Darto', 0.5, 2900]", "('Pak Darto', '0.5', '2900')"]], ['"Pak Joko,0,75,4100".split(",")', ["['Pak Joko', '0,75', '4100']", "['Pak Joko', '0', '75']", "['Pak Joko', 0.75, 4100]"]], ['"Bu Ani,1.0,".split(",")', ["['Bu Ani', '1.0']", "['Bu Ani', '1.0', None]", "['Bu Ani', '1.0', '0']"]],
          ['"0.5" + "0.25"', ['0.75', "'0.75'", 'TypeError']], ['float("0.5") + float("0.25")', ["'0.50.25'", '0.7', '1']], ['int("2900") + 100', ["'2900100'", '2910', 'TypeError']], ['int(" 3000 ")', ['ValueError', "' 3000 '", '300']]];
        rowsChoose(wrap, ctx, { prompt: 'Hasil setiap ekspresi Python', cls: 'cj-isi cj-mono', rows: E.map(([e, salah], i) => { const v = evalPy(e); return [`e${i}`, e, uniq([v, ...salah]), v]; }), done: next,
          info: 'Hasil split selalu list teks. Tanda + pada teks menyambung, jadi teks diubah dulu dengan int atau float.' });
      }
      else if (r === 3) {
        wrap.append(el('div', { class: 'cj-dua' }, pyCode(RUDI, { labels: lab(1, 7), cls: 'cj-kecil' }), berkas(CSV, { sampai: 6, cls: 'kecil' })));
        rowsChoose(wrap, ctx, { prompt: 'Telusuri program Rudi: kolom[2] → total sesudahnya', cls: 'cj-isi cj-mono', rows: J.map((x) => {
          const right = x.galat ? `${pyRepr(x.k2, true)} → program berhenti` : `${pyRepr(x.k2, true)} → ${x.total}`;
          const salah = x.galat ? [`'' → ${J.at(-2).total}`, `'0' → ${J.at(-2).total}`, `${pyRepr(semua[x.baris - 1].split(',')[1], true)} → ${J.at(-2).total + 1}`] : [`${pyRepr(x.k2, true)} → ${x.total - parseInt(x.k2, 10) + 1}`, `${pyRepr(semua[x.baris - 1].split(',').at(-1), true)} → ${x.total - parseInt(x.k2, 10) + parseInt(semua[x.baris - 1].split(',').at(-1), 10)}`, `${pyRepr(x.k2, true)} → ${x.k2}`];
          return [`b${x.baris}`, `Baris berkas ${x.baris}`, uniq([right, ...salah]), right]; }), done: next });
      }
      else if (r === 4) {
        const E = RR.error;
        wrap.append(el('div', { class: 'cj-dua' }, pyCode(RUDI, { labels: lab(1, 7), cls: 'cj-kecil', warn: [E.line] }), el('pre', { class: 'cj-layar' }, `⚠ Baris ${E.line + 1} · ${E.type}: ${E.message}`)));
        rowsChoose(wrap, ctx, { prompt: 'Program Rudi berhenti', cls: 'cj-isi', rows: [
          ['l', 'Baris kode tempat berhenti', ['2', '4', '6', '7'], String(E.line + 1)],
          ['m', 'Pesan galat', uniq([`${E.type}: ${E.message}`, 'IndexError: list index out of range', "ValueError: could not convert string to float: ''", "TypeError: unsupported operand type(s) for +: 'int' and 'str'"]), `${E.type}: ${E.message}`],
          ['d', 'Baris Pak Joko (berkas 4)', ['diam-diam salah: kolom[2] berisi 75, padahal hasilnya 4.100 kg, dan program tetap berjalan', 'membuat program berhenti', 'dibaca dengan benar', 'dilewati program'], 'diam-diam salah: kolom[2] berisi 75, padahal hasilnya 4.100 kg, dan program tetap berjalan'],
          ['n', 'len(semua) − 1 untuk berkas ini', ['9', '10', '11', '8'], String(semua.length - 1)],
          ['w', 'Mengapa pembagi di baris 7 tetap salah', ['ada baris kosong di akhir berkas, dan pembagi harus menghitung baris yang benar-benar dipakai', 'kepala ikut dihitung dua kali', 'len menghitung huruf, bukan baris', 'pembaginya sudah benar'], 'ada baris kosong di akhir berkas, dan pembagi harus menghitung baris yang benar-benar dipakai'],
        ], done: next });
      }
      else if (r === 5) {
        wrap.append(pyCode(VALID_KOSONG, { labels: lab(1, 25), cls: 'cj-kecil', warn: [2, 10, 18, 22] }));
        rowsChoose(wrap, ctx, { prompt: 'Lengkapi baris 3, 11, 19, dan 23', cls: 'cj-isi cj-mono', rows: [
          ['l3', 'Baris 3', ['len(kolom) != 3', 'len(kolom) == 3', 'len(baris) != 3', 'kolom != 3'], 'len(kolom) != 3'],
          ['l11', 'Baris 11', ['luas <= 0 or hasil <= 0', 'luas < 0 and hasil < 0', 'luas <= 0 and hasil <= 0', 'luas > 0 or hasil > 0'], 'luas <= 0 or hasil <= 0'],
          ['l19', 'Baris 19', ['semua[i].strip() == ""', 'semua[i] == None', 'len(semua) == 0', 'semua[i].strip() != ""'], 'semua[i].strip() == ""'],
          ['l23', 'Baris 23', ['(i + 1, pesan)', '(i, pesan)', '(i - 1, pesan)', 'pesan'], '(i + 1, pesan)'],
        ], done: next, info: 'Indeks list mulai dari 0, sedangkan nomor baris berkas mulai dari 1.' });
      }
      else if (r === 6) {
        const opsi = ['diterima · ok', 'ditolak · jumlah kolom 4', 'ditolak · bukan angka', 'ditolak · angka harus positif'];
        wrap.append(berkas(CSV, { cls: 'kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Jalankan periksa untuk setiap baris data', cls: 'cj-isi', rows: lab(2, 9).map((n) => { const p = A.rusak.get(Number(n)); return [`b${n}`, `${n}. ${semua[n - 1]}`, opsi, p ? `ditolak · ${p}` : 'diterima · ok']; }), done: next });
      }
      else if (r === 7) {
        const csv = berkasAcak(ctx.rand); const B = analisa(csv); const bs = barisBerkas(csv);
        const opsi = ['ok', 'jumlah kolom 2', 'jumlah kolom 4', 'bukan angka', 'angka harus positif'];
        wrap.append(berkas(csv, { cls: 'kecil' }));
        rowsChoose(wrap, ctx, { prompt: 'Berkas dari Kelompok Tani Subur: hasil periksa setiap baris', cls: 'cj-isi', rows: bs.slice(1, -1).map((t, i) => { const n = i + 2; const p = B.rusak.get(n) ?? 'ok'; return [`b${n}`, `${n}. ${t}`, uniq([p, ...opsi]), p]; }), done: next,
          info: 'Titik ribuan (2.900) ditolak int. Koma desimal menambah satu kolom.' });
      }
      else if (r === 8) {
        const [nD, rata, prod] = A.out[0].split(' ');
        wrap.append(el('div', { class: 'cj-dua' }, pyCode(HITUNG, { labels: lab(26, 6), cls: 'cj-kecil' }), tabelData(A.data)));
        rowsChoose(wrap, ctx, { prompt: 'Menghitung dari data yang sah', cls: 'cj-isi cj-mono', rows: [
          ['r', 'Isi rusak', uniq([pyRepr(A.R.vars.rusak), '[4, 6, 8, 10]', "[(3, 'jumlah kolom 4'), (5, 'bukan angka'), (7, 'bukan angka'), (9, 'angka harus positif')]", "[(4, 'jumlah kolom 4'), (6, 'bukan angka'), (8, 'bukan angka'), (10, 'angka harus positif'), (11, 'jumlah kolom 1')]"]), pyRepr(A.R.vars.rusak)],
          ['o', 'Keluaran baris 31', uniq([A.out[0], `${nD} ${prod} ${rata}`, '9 3480.0 5800.0', `${nD} ${prod} ${prod}`]), A.out[0]],
          ['s', 'Produktivitas kelompok', ['5,8 ton gabah per hektare (kg per hektare)', '5.800 ton per hektare', '3,48 ton per hektare', '5,8 kg per hektare'], `${fmtNum(Number(prod) / 1000)} ton gabah per hektare (kg per hektare)`],
          ['c', 'Cara Sari (rata-rata 5.820)', ['salah untuk kelompok: sawah 0,25 ha dan 1 ha diberi bobot sama; yang tepat total hasil ÷ total luas', 'lebih tepat karena memakai semua petani', 'sama saja, selisihnya pembulatan', 'tepat bila datanya lima'], 'salah untuk kelompok: sawah 0,25 ha dan 1 ha diberi bobot sama; yang tepat total hasil ÷ total luas'],
        ], done: next });
      }
      else {
        const wati = A.data[1]; const rec = `{"nama": ${q(wati.nama)}, "luas_ha": ${pyRepr(wati.luas)}, "hasil_kg": ${wati.hasil}}`;
        const v3 = runPy([...PROGRAM, 'print(json.loads(teks)["panen"][3]["hasil_kg"])'], { limit: 60000, files: { 'panen.csv': CSV } }).out.at(-1);
        wrap.append(el('div', { class: 'cj-dua' }, pyCode(SIMPAN, { labels: lab(32, 5), cls: 'cj-kecil' }), el('pre', { class: 'cj-layar json' }, A.json.split('\n').slice(0, 14).join('\n') + '\n  …')));
        rowsChoose(wrap, ctx, { prompt: 'Menyimpan sebagai JSON', cls: 'cj-isi cj-mono', rows: [
          ['w', 'Catatan Bu Wati di JSON', uniq([rec, `{'nama': 'Bu Wati', 'luas_ha': 0.25, 'hasil_kg': 1450}`, '{"nama": "Bu Wati", "luas_ha": "0.25", "hasil_kg": "1450"}', 'Bu Wati,0.25,1450']), rec],
          ['k', 'Tanpa tanda kutip berarti', ['angka; aplikasi langsung mendapat angka tanpa int atau float', 'teks', 'nilai kosong', 'nama kolom'], 'angka; aplikasi langsung mendapat angka tanpa int atau float'],
          ['i', 'json.loads(teks)["panen"][3]["hasil_kg"]', uniq([v3, '4200', '3050', '4100']), v3],
          ['u', 'Mengapa JSON lebih besar', ['nama kunci ditulis ulang di setiap catatan, ditambah kurung, kutip, dan indentasi', 'angka disimpan dua kali', 'JSON memakai huruf kapital', 'JSON menyimpan baris rusak juga'], 'nama kunci ditulis ulang di setiap catatan, ditambah kurung, kutip, dan indentasi'],
        ], done: next });
      }
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
function tabelData(data) {
  return el('table', { class: 'cj-tabel' }, el('tr', null, ['nama', 'luas_ha', 'hasil_kg'].map((h) => el('th', null, h))), data.map((d) => el('tr', null, el('td', null, d.nama), el('td', null, pyRepr(d.luas)), el('td', null, String(d.hasil)))));
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
