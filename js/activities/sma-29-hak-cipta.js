// Boleh Dipakai atau Tidak? — SMA/SMK (16–18 tahun), hak cipta, lisensi, dan etika digital.
// Copyright basics, Creative Commons symbols and a licence builder, ten bazaar
// cases, writing a full attribution, and the three Indonesian laws (HC, ITE, PDP).

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const FACTS = [['a', 'Hak cipta baru ada setelah karya didaftarkan.', 'S', 'Hak cipta timbul otomatis; pencatatan hanya membantu sebagai bukti.'], ['b', 'Foto yang diunggah di internet tetap dilindungi hak cipta.', 'B', 'Diunggah tidak berarti dilepas haknya.'], ['c', 'Ide cerita tidak dilindungi hak cipta, tetapi tulisan ceritanya dilindungi.', 'B', 'Ide, konsep, dan data tidak dilindungi; wujud karyanya dilindungi.'], ['d', 'Program komputer termasuk ciptaan yang dilindungi.', 'B', 'Program komputer adalah ciptaan.'], ['e', 'Asalkan nama penciptanya disebut, semua cara memakai karya orang lain menjadi boleh.', 'S', 'Atribusi wajib, tetapi tidak menggantikan izin.'], ['f', 'Hak cipta atas sebuah lagu berlaku selama pencipta hidup ditambah 70 tahun setelah ia meninggal.', 'B', 'Masa berlaku hak cipta lagu: seumur hidup pencipta + 70 tahun.']];
export const SYMBOLS = [['BY', '👤', 'gambar orang', 'R'], ['SA', '🔄', 'panah melingkar', 'S'], ['NC', '🚫$', 'mata uang dicoret', 'P'], ['ND', '🟰', 'tanda sama dengan', 'Q']];
export const MEANING = { P: 'Tidak boleh dipakai untuk tujuan komersial.', Q: 'Karya tidak boleh diubah.', R: 'Nama pencipta wajib dicantumkan.', S: 'Hasil ubahan wajib memakai lisensi yang sama.' };
export function license(on) {
  const has = (k) => on.includes(k);
  if (!on.length) return { name: 'CC0', valid: true, sell: true, modify: true, note: 'Dilepas ke domain publik: tanpa syarat, tetapi menyebut pencipta tetap baik.' };
  if (!has('BY')) return { name: 'tidak berlaku', valid: false, note: 'Semua lisensi CC (kecuali CC0) mewajibkan atribusi: BY harus menyala.' };
  if (has('SA') && has('ND')) return { name: 'tidak berlaku', valid: false, note: 'SA mengatur hasil ubahan, padahal ND melarang mengubah: keduanya tidak bisa bersama.' };
  const name = ['CC BY', has('NC') && 'NC', has('SA') && 'SA', has('ND') && 'ND'].filter(Boolean).join('-');
  return { name, valid: true, sell: !has('NC'), modify: !has('ND'), note: [has('NC') ? 'tidak boleh dijual' : 'boleh dijual', has('ND') ? 'tidak boleh diubah' : has('SA') ? 'boleh diubah, hasil ubahan berlisensi sama' : 'boleh diubah', 'wajib atribusi'].join(' · ') };
}
export const LICENSES = [['CC BY', ['BY']], ['CC BY-SA', ['BY', 'SA']], ['CC BY-NC', ['BY', 'NC']], ['CC BY-ND', ['BY', 'ND']], ['CC BY-NC-ND', ['BY', 'NC', 'ND']], ['CC0 (domain publik)', []]];

export const CASES = [
  [1, 'Lagu pop terbaru dari penyanyi terkenal dipakai sebagai musik latar video promosi bazar di kanal video sekolah, tanpa izin.', 'T', 'HC', 'Lagu dilindungi hak cipta; video promosi bazar bersifat komersial.', 'Musik berlisensi yang mengizinkan (misalnya CC BY dengan atribusi) atau musik buatan sendiri.'],
  [2, 'Foto pemandangan dari hasil mesin pencari dipakai untuk sampul katalog bazar, karena "fotonya ada di internet".', 'T', 'HC', 'Hak cipta timbul otomatis; foto di internet tetap milik pemotretnya.', 'Foto sendiri, foto berlisensi yang mengizinkan penggunaan komersial (bukan NC), atau minta izin pemotretnya.'],
  [3, 'Ilustrasi berlisensi CC BY-NC dipakai di poster pameran karya di perpustakaan yang gratis dan tidak menjual apa pun, dengan atribusi lengkap.', 'B', 'HC', 'Nonkomersial dan atribusinya lengkap: syarat BY dan NC terpenuhi.', ''],
  [4, 'Ilustrasi CC BY-NC yang sama dicetak di kaos untuk dijual di bazar.', 'T', 'HC', 'Kaos yang dijual adalah penggunaan komersial, dan NC melarangnya.', 'Desain sendiri, karya CC BY atau CC0, atau izin tersendiri dari pencipta.'],
  [5, 'Foto berlisensi CC BY dipakai di salindia presentasi kelas, tanpa menyebut nama pemotretnya.', 'BS', 'HC', 'CC BY membolehkan semua penggunaan asalkan ada atribusi.', 'Syarat: cantumkan judul, pemotret, sumber, dan lisensinya.'],
  [6, 'Dua paragraf dari buku sejarah dikutip di makalah tugas sekolah, dengan judul buku, nama penulis, dan halamannya.', 'B', 'HC', 'Pengutipan untuk pendidikan boleh bila sumbernya disebut dan tidak merugikan pencipta (UU Hak Cipta Pasal 44 ayat 1).', ''],
  [7, 'Aplikasi pengolah gambar berbayar versi bajakan dipasang di laptop kelas untuk membuat poster.', 'T', 'HC', 'Program komputer dilindungi; bajakan berarti menggandakan tanpa izin, dan sering berisi program jahat.', 'Aplikasi gratis atau sumber terbuka, atau beli lisensi resmi.'],
  [8, 'Bendahara bazar membagikan daftar pembeli (nama, nomor ponsel, dan alamat) kepada toko daring milik kakak kelas untuk promosi, tanpa memberi tahu pembeli.', 'T', 'PDP', 'Data pribadi diberikan untuk urusan pesanan, bukan untuk dibagikan.', 'Beri tahu pembeli tentang toko itu supaya mereka mendaftar sendiri bila berminat.'],
  [9, 'Seorang murid mengunggah ulasan "Penjual stan sebelah itu penipu, barangnya sampah!" disertai hinaan dan foto wajah penjualnya.', 'T', 'ITE', 'Menuduh dan menghina supaya diketahui umum dapat melanggar UU ITE; foto wajah tanpa izin melanggar privasi.', 'Sampaikan keluhan langsung kepada penjual atau panitia, dengan fakta dan bahasa santun.'],
  [10, 'Foto suasana bazar yang menampakkan jelas wajah pengunjung, termasuk anak-anak SD, diunggah ke kanal sekolah.', 'BS', 'PDP', 'Wajah yang tampak jelas termasuk data pribadi, dan data anak perlu perlindungan khusus.', 'Syarat: minta izin orang yang tampak jelas (untuk anak, izin orang tua atau walinya), atau samarkan wajahnya.'],
];
const VERDICT = [['B', 'Boleh'], ['BS', 'Boleh dengan syarat'], ['T', 'Tidak boleh']];
const LAW = { HC: 'UU Hak Cipta', ITE: 'UU ITE', PDP: 'UU Pelindungan Data Pribadi' };

export const PHOTO = { judul: 'Sawah Terasering Pagi Hari', pencipta: 'Rina Kartika', sumber: 'https://galeri-foto.example/sawah-pagi', lisensi: 'CC BY 4.0' };
export const ATTRIB = [['i', '"Sumber: internet"', 'Kurang judul, pencipta, sumber yang jelas, dan lisensi.'], ['ii', '"Foto dari mesin pencari"', 'Mesin pencari bukan pencipta atau sumber karya; kurang semuanya.'], ['iii', '"Foto oleh Rina Kartika"', 'Kurang judul, sumber, lisensi, dan keterangan perubahan.'], ['iv', '"Foto "Sawah Terasering Pagi Hari" oleh Rina Kartika, https://galeri-foto.example/sawah-pagi, CC BY 4.0. Dipotong dan diberi tulisan oleh kelas 11-2."', null]];
export const PIECES = [['J', 'Foto "Sawah Terasering Pagi Hari"', true], ['P', 'oleh Rina Kartika', true], ['S', 'https://galeri-foto.example/sawah-pagi', true], ['L', 'CC BY 4.0', true], ['U', 'Dipotong dan diberi tulisan oleh kelas 11-2.', true], ['x1', 'Sumber: internet', false], ['x2', 'oleh mesin pencari', false], ['x3', '© Semua hak milik kelas 11-2', false]];
export const LAWS = [['a', 'Menjual salinan film dalam flashdisk', 'HC'], ['b', 'Menyebarkan nomor ponsel dan alamat rumah teman ke grup terbuka', 'PDP'], ['c', 'Menuduh seseorang mencuri lewat unggahan di media sosial, tanpa bukti', 'ITE'], ['d', 'Mengunggah ulang komik buatan orang lain dan mengakuinya sebagai karya sendiri', 'HC'], ['e', 'Aplikasi kuis yang meminta foto kartu identitas pengguna tanpa menjelaskan tujuannya', 'PDP'], ['f', 'Menyebarkan konten yang menghasut kebencian terhadap suatu suku', 'ITE']];

// --- pieces ---
function segRows(wrap, ctx, { prompt, rows, opts, cls = '', why, done, info }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `hc-baris-baris ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, a, ...rest]) => el('div', { class: `hc-baris ${k in res ? 'beres' : ''}` }, el('span', null, `${k}. ${t}`), k in res ? el('b', null, opts.find((o) => o[0] === a)[1]) : el('div', { class: 'seg' }, opts.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', why ? why([k, t, a, ...rest], false) : 'Belum tepat.'); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', why ? why([k, t, a, ...rest], true) : 'Tepat.'); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1500);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function symbolRound(wrap, ctx, { done }) {
  const got = {}; let sel = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk lambang, lalu ketuk artinya.');
  const host = el('div', { class: 'hc-pasang' });
  const letters = ctx.rand.shuffle(Object.keys(MEANING));
  const draw = () => host.replaceChildren(el('div', { class: 'hc-kol' }, SYMBOLS.map(([k, ic, d, a]) => onTap(el('button', { class: `hc-item ${sel === k ? 'pilih' : ''} ${k in got ? 'beres' : ''}`, type: 'button' }, el('span', { class: 'hc-lambang' }, ic), el('b', null, k), el('small', null, d), k in got ? el('em', null, `→ ${a}`) : null), () => { if (!(k in got)) { sel = k; draw(); } }))),
    el('div', { class: 'hc-kol' }, letters.map((L) => onTap(el('button', { class: `hc-item ${Object.values(got).includes(L) ? 'beres' : ''}`, type: 'button' }, el('b', null, L), MEANING[L]), () => {
      if (!sel) return; const want = SYMBOLS.find((s) => s[0] === sel)[3];
      if (L !== want) { ctx.mistake(); shake(host); say(msg, 'bad', 'Belum cocok. BY = by (oleh), SA = share alike, NC = noncommercial, ND = no derivatives.'); return; }
      got[sel] = L; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === SYMBOLS.length) { say(msg, '', 'BY nama pencipta, SA lisensi sama, NC nonkomersial, ND tanpa ubahan.'); done(); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lambang Creative Commons: pasangkan dengan artinya.'), host, msg);
}

function tableRound(wrap, ctx, { done }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, 'Isi ✓ (boleh) atau ✗ (tidak boleh). Semua lisensi kecuali CC0 mewajibkan atribusi.');
  const host = el('table', { class: 'hc-tabel' });
  const cell = (name, on, col) => {
    const L = license(on); const ok = col === 'sell' ? L.sell : L.modify; const key = `${name}|${col}`;
    return el('td', { class: key in res ? (ok ? 'ya' : 'tidak') : '' }, key in res ? (ok ? '✓' : '✗') : el('div', { class: 'seg' }, [[true, '✓'], [false, '✗']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (v !== ok) { ctx.mistake(); say(msg, 'bad', col === 'sell' ? 'Menjual kaos = komersial. Lisensi mana yang punya NC?' : 'Mengubah = membuat karya turunan. Lisensi mana yang punya ND?'); return; }
      res[key] = v; ctx.sound.tap(); draw();
      if (Object.keys(res).length === LICENSES.length * 2) { say(msg, '', 'NC melarang dijual, ND melarang diubah, SA mewajibkan hasil ubahan berlisensi sama.'); done(); }
    }))));
  };
  const draw = () => host.replaceChildren(el('tr', null, el('th', null, 'Lisensi'), el('th', null, 'Dicetak utuh di kaos untuk dijual'), el('th', null, 'Diubah (diberi warna baru)')), ...LICENSES.map(([n, on]) => el('tr', null, el('th', null, n), cell(n, on, 'sell'), cell(n, on, 'mod'))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lisensi mana yang membolehkan apa?'), host, msg);
}

function caseRound(wrap, ctx, { cases, done }) {
  let k = 0;
  const msg = el('p', { class: 'reveal info' }, 'Pilih: boleh, boleh dengan syarat, atau tidak boleh.');
  const host = el('div', { class: 'hc-kasus-wadah' });
  const draw = (last) => host.replaceChildren(...[
    k < cases.length ? el('div', { class: 'hc-kasus' }, el('b', null, `Kasus ${cases[k][0]}`), el('p', null, cases[k][1])) : null,
    k < cases.length ? el('div', { class: 'hc-keranjang' }, VERDICT.map(([v, l]) => onTap(el('button', { class: `hc-kotak v-${v}`, type: 'button' }, l), () => {
      const c = cases[k];
      if (v !== c[2]) { ctx.mistake(); shake(host); say(msg, 'bad', v === 'B' ? 'Ada aturan yang dilanggar atau syarat yang belum dipenuhi.' : v === 'T' ? 'Coba periksa lagi lisensi dan tujuannya: mungkin boleh, atau boleh dengan syarat.' : 'Periksa: apakah ada syarat yang bisa dipenuhi, atau memang dilarang?'); return; }
      ctx.sound.good(); k++; draw(c);
      if (k === cases.length) setTimeout(done, 2600);
    }))) : null,
    last ? el('div', { class: 'hc-bahas' }, el('b', null, `Kasus ${last[0]}: ${VERDICT.find((x) => x[0] === last[2])[1]} · ${LAW[last[3]]}`), el('span', null, last[4]), last[5] ? el('span', { class: 'lain' }, `${last[2] === 'BS' ? '' : 'Cara lain: '}${last[5]}`) : null) : null].filter(Boolean));
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Kasus bazar ${cases[0][0]}–${cases[cases.length - 1][0]}`), host, msg);
}

function attribBuilder(ctx, { onDone }) {
  const picked = [];
  const order = ctx.rand.shuffle(PIECES.slice());
  const msg = el('p', { class: 'reveal info' }, 'Ketuk potongan untuk menyusun atribusi: Judul, Pencipta, Sumber, Lisensi, dan keterangan perubahan.');
  const host = el('div', { class: 'hc-atribusi' });
  const draw = () => host.replaceChildren(el('div', { class: 'hc-potongan' }, order.filter((p) => !picked.includes(p[0])).map(([k, t]) => onTap(el('button', { class: 'hc-pot', type: 'button' }, t), () => {
    const p = PIECES.find((x) => x[0] === k);
    if (!p[2]) { ctx.mistake(); say(msg, 'bad', k === 'x2' ? 'Mesin pencari bukan pencipta.' : k === 'x1' ? '"Internet" bukan sumber yang jelas; pakai tautan halaman aslinya.' : 'Kelas 11-2 bukan pemegang hak cipta foto itu.'); return; }
    picked.push(k); ctx.sound.tap(); draw();
    if (PIECES.filter((x) => x[2]).every((x) => picked.includes(x[0]))) { say(msg, '', 'Atribusi lengkap: J-P-S-L ditambah keterangan perubahan.'); onDone?.(); }
  }))), el('div', { class: 'hc-hasil' }, el('b', null, 'Atribusi:'), el('span', null, picked.map((k) => PIECES.find((p) => p[0] === k)[1]).join(', ') || '…'),
    el('div', { class: 'hc-jpsl' }, ['J', 'P', 'S', 'L', 'U'].map((k) => el('span', { class: picked.includes(k) ? 'ya' : '' }, k === 'U' ? 'Ubah' : k)))), msg);
  draw();
  return host;
}

function licenseBuilder(ctx, { target = null, onDone } = {}) {
  const on = [];
  const host = el('div', { class: 'hc-perakit' });
  const msg = el('p', { class: 'reveal info' }, target ? 'Nyalakan lambang yang sesuai keinginan kelas, lalu pakai lisensinya.' : 'Nyalakan atau matikan lambang untuk melihat lisensinya.');
  const draw = () => { const L = license(on); host.replaceChildren(el('div', { class: 'hc-saklar' }, SYMBOLS.map(([k, ic, d, a]) => onTap(el('button', { class: `hc-sak ${on.includes(k) ? 'on' : ''}`, type: 'button' }, el('span', { class: 'hc-lambang' }, ic), el('b', null, k), el('small', null, MEANING[a])), () => { if (on.includes(k)) on.splice(on.indexOf(k), 1); else on.push(k); ctx.sound.tap(); draw(); }))),
    el('div', { class: `hc-lisensi ${L.valid ? '' : 'salah'}` }, el('b', null, L.name), L.valid ? el('div', { class: 'hc-dua-tanya' }, el('span', { class: L.sell ? 'ya' : 'tidak' }, `Boleh dijual? ${L.sell ? '✓' : '✗'}`), el('span', { class: L.modify ? 'ya' : 'tidak' }, `Boleh diubah? ${L.modify ? '✓' : '✗'}`)) : null, el('small', null, L.note)),
    target ? button('Pakai lisensi ini', () => {
      if (L.name !== target) { ctx.mistake(); shake(host); say(msg, 'bad', 'Belum sesuai: nama kelas harus disebut, tidak boleh dijual, boleh diubah, dan ubahan berlisensi sama.'); return; }
      ctx.sound.good(); say(msg, '', `${target}: BY karena nama kelas disebut, NC karena tidak boleh dijual, SA karena ubahan berlisensi sama.`); onDone?.();
    }, 'primary') : null, msg); };
  draw();
  return host;
}

// ---------- Stan Bazar Lolos Inspeksi: the ten missions ----------
export const ORDERS = [
  ['Siapa pun boleh memakai, menjual, dan mengubah tanpa syarat apa pun.', 'CC0'],
  ['Boleh dijual, tetapi tidak boleh diubah; nama pencipta wajib disebut.', 'CC BY-ND'],
  ['Tidak boleh dijual dan tidak boleh diubah; nama pencipta wajib disebut.', 'CC BY-NC-ND'],
  ['Boleh dijual dan diubah, asal ubahannya memakai lisensi yang sama.', 'CC BY-SA'],
];
export const COMMISSIONS = [
  ['🎬 Video dokumenter kelas 11-2', 'Boleh dipakai dan diubah, tidak boleh dijual, nama kelas wajib disebut, dan ubahan berlisensi sama.', 'CC BY-NC-SA'],
  ['📷 Foto lomba karya Dimas', 'Boleh dibagikan bahkan dijual, nama Dimas wajib disebut, tetapi fotonya tidak boleh diubah.', 'CC BY-ND'],
];
export const OBJECTIONS = { 2: ['Tetap pakai foto itu asal ukurannya kecil.', 'Pakai foto itu dan tulis "Sumber: internet".'], 9: ['Unggah ulang tanpa foto wajah; tuduhannya tetap.', 'Kirim ke grup kelas saja supaya tidak diketahui umum.'] };
export const CHECKS = [['c1', 'Siapa penciptanya, dan adakah izin atau lisensinya?', true], ['c2', 'Bolehkah dipakai untuk dijual (komersial)?', true], ['c3', 'Bolehkah diubah, dan apa syarat ubahannya?', true], ['c4', 'Sudahkah atribusinya lengkap: judul, pencipta, sumber, lisensi?', true], ['c5', 'Adakah wajah atau data pribadi yang belum diizinkan?', true], ['c6', 'Apakah unggahan menuduh atau menghina orang?', true], ['x1', 'Apakah jumlah suka akan banyak?', false, 'Jumlah suka tidak menentukan boleh atau tidaknya memakai karya.'], ['x2', 'Apakah ukuran filenya cukup kecil?', false, 'Ukuran file urusan teknis, bukan hak cipta atau privasi.'], ['x3', 'Apakah warna posternya sudah cerah?', false, 'Warna urusan selera, bukan hukum.']];
// The stall: each spot has a fine version and a violating version taken from a bazaar case.
export const SPOTS = [
  ['musik', '🎵', 'Musik video promosi', 'Lagu ciptaan anggota kelas sendiri.', 'Lagu pop terbaru penyanyi terkenal, tanpa izin.', 1],
  ['katalog', '📒', 'Sampul katalog', 'Foto CC0 dari galeri-foto.example, sumbernya dicantumkan.', 'Foto dari mesin pencari, karena "ada di internet".', 2],
  ['kaos', '👕', 'Kaos yang dijual', 'Desain buatan kelas sendiri.', 'Ilustrasi berlisensi CC BY-NC.', 4],
  ['salindia', '🖥️', 'Salindia presentasi', 'Foto CC BY dengan atribusi lengkap.', 'Foto CC BY tanpa nama pemotretnya.', 5],
  ['laptop', '💻', 'Laptop kasir', 'Aplikasi pengolah gambar sumber terbuka.', 'Aplikasi pengolah gambar berbayar versi bajakan.', 7],
  ['pembeli', '📋', 'Daftar pembeli', 'Hanya dipakai untuk mengirim pesanan.', 'Dibagikan ke toko daring kakak kelas untuk promosi.', 8],
  ['ulasan', '💬', 'Ulasan di kanal kelas', 'Keluhan disampaikan ke panitia dengan santun.', '"Penjual stan sebelah penipu!" dengan foto wajahnya.', 9],
  ['suasana', '📸', 'Foto suasana bazar', 'Wajah pengunjung disamarkan.', 'Wajah anak-anak SD tampak jelas, tanpa izin orang tua.', 10],
];
const HEAD29 = {
  mitos: ['Mitos atau Fakta', 'Seret enam kartu pernyataan ke kotak Fakta atau Mitos.'],
  lambang: ['Lambang Lisensi', 'Tempelkan setiap lambang Creative Commons pada artinya.'],
  mesin: ['Mesin Lisensi', 'Nyalakan sakelar lambang untuk mencetak empat label lisensi yang dipesan.'],
  sidang1: ['Sidang Kasus I', 'Seret kasus 1–5 ke kotak putusan, lalu jawab keberatan Inspektur.'],
  sidang2: ['Sidang Kasus II', 'Seret kasus 6–10 ke kotak putusan, lalu jawab keberatan Inspektur.'],
  label: ['Label Pameran', 'Temukan label yang lengkap, lalu rakit label foto dari potongan.'],
  meja: ['Tiga Meja Hukum', 'Seret setiap perbuatan dan kasus ke meja undang-undangnya.'],
  pesanan: ['Lisensi Pesanan', 'Dua pemesan datang. Nyalakan lambang yang sesuai keinginan mereka.'],
  periksa: ['Daftar Periksa', 'Isi daftar periksa "Sebelum Memakai dan Mengunggah" dengan pertanyaan yang penting.'],
  bos: ['Inspeksi Stan', 'Inspektur datang. Periksa delapan titik stan: lolos atau melanggar?'],
};
const msg29 = (t) => el('p', { class: 'reveal info' }, t);
const bin = (k, label, cls = '') => el('div', { class: `hc29-kotak ${cls}`, 'data-drop': k }, el('b', null, label), el('div', { class: 'hc29-kotak-isi' }));
function sortBoard(area, ctx, { msg, items, bins, check, after, done, chip }) {
  const tray = el('div', { class: 'hc29-baki' }, ctx.rand.shuffle(items.map((x) => x[0])).map((k) => el('div', { class: 'hc29-kartu', 'data-drag': k }, items.find((x) => x[0] === k)[1])));
  let left = items.length;
  const board = el('div', { class: 'hc29-papan' }, el('div', { class: `hc29-kotak-kotak n${bins.length}` }, bins), tray);
  dnd(board, (card, box) => {
    if (!left) return;
    const it = items.find((x) => x[0] === card.dataset.drag);
    const why = check(it, box.dataset.drop);
    if (why) { ctx.mistake(); shake(card); say(msg, 'bad', why); return; }
    card.remove(); box.querySelector('.hc29-kotak-isi').append(chip ? chip(it) : el('span', { class: 'hc29-chip' }, it[0])); ctx.sound.tap();
    left--; after?.(it, left);
    if (!left) done();
  });
  area.append(board, msg);
}

// Misi 1: myth or fact.
function mythRound(area, ctx, { done }) {
  const msg = msg29('Seret setiap kartu ke Fakta atau Mitos, atau ketuk kartu lalu ketuk kotaknya.');
  sortBoard(area, ctx, { msg, items: FACTS, bins: [bin('B', '📗 Fakta', 'fakta'), bin('S', '📕 Mitos', 'mitos')],
    check: (f, k) => (k !== f[2] ? (f[2] === 'S' ? `Ini mitos. ${f[3]}` : `Ini fakta. ${f[3]}`) : ''),
    after: (f) => say(msg, '', f[3]), done: () => { say(msg, '', 'Hak cipta timbul otomatis, melindungi wujud karya (bukan ide), dan atribusi tidak menggantikan izin.'); done(); } });
}

// Misi 2: CC symbols onto their meanings.
function symbolMatch(area, ctx, { done }) {
  const msg = msg29('Seret setiap lambang ke artinya.');
  const plates = ctx.rand.shuffle(Object.keys(MEANING)).map((L) => el('div', { class: 'hc29-arti', 'data-drop': L }, el('span', null, MEANING[L]), el('div', { class: 'hc29-arti-isi' })));
  const tray = el('div', { class: 'hc29-lambang-lambang' }, ctx.rand.shuffle(SYMBOLS.map((s) => s[0])).map((k) => { const s = SYMBOLS.find((x) => x[0] === k); return el('div', { class: 'hc29-lambang', 'data-drag': k }, el('span', null, s[1]), el('b', null, k), el('small', null, s[2])); }));
  let left = SYMBOLS.length;
  const board = el('div', { class: 'hc29-papan' }, el('div', { class: 'hc29-arti-arti' }, plates), tray);
  dnd(board, (card, plate) => {
    if (!left || plate.classList.contains('isi')) return;
    const s = SYMBOLS.find((x) => x[0] === card.dataset.drag);
    if (plate.dataset.drop !== s[3]) { ctx.mistake(); shake(card); say(msg, 'bad', 'Belum cocok. BY = by (oleh), SA = share alike, NC = noncommercial, ND = no derivatives.'); return; }
    card.classList.add('locked'); plate.querySelector('.hc29-arti-isi').append(card); plate.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', `${s[0]}: ${MEANING[s[3]]}`); return; }
    say(msg, '', 'BY nama pencipta, SA lisensi sama, NC nonkomersial, ND tanpa ubahan.'); done();
  });
  area.append(board, msg);
}

// The licence machine: four switches, a name, and two lamps.
function machine(ctx, onPrint) {
  const on = [];
  const host = el('div', { class: 'hc29-mesin' });
  const draw = () => {
    const L = license(on);
    fill(host, el('div', { class: 'hc29-sakelar-sakelar' }, SYMBOLS.map(([k, ic]) => onTap(el('button', { class: `hc29-sakelar ${on.includes(k) ? 'on' : ''}`, type: 'button', 'data-k': k }, el('span', null, ic), el('b', null, k), el('i', null, on.includes(k) ? 'NYALA' : 'mati')), () => { if (on.includes(k)) on.splice(on.indexOf(k), 1); else on.push(k); ctx.sound.tap(); draw(); }))),
      el('div', { class: `hc29-layar ${L.valid ? '' : 'salah'}` }, el('b', null, L.name), L.valid ? el('div', { class: 'hc29-lampu' }, el('span', { class: L.sell ? 'ya' : 'tidak' }, `💰 dijual ${L.sell ? '✓' : '✗'}`), el('span', { class: L.modify ? 'ya' : 'tidak' }, `✏️ diubah ${L.modify ? '✓' : '✗'}`)) : el('small', null, L.note)),
      button('🖨️ Cetak label', () => onPrint(L, on.slice()), 'primary'));
  };
  draw();
  host.reset = () => { on.length = 0; draw(); };
  return host;
}

// Misi 2 and 6: print the licence each order asks for.
function orderRound(area, ctx, { orders, done }) {
  let k = 0; const printed = el('div', { class: 'hc29-label-label' });
  const msg = msg29('Baca pesanan, nyalakan sakelar yang perlu, lalu cetak labelnya.');
  const ticket = el('div', { class: 'hc29-pesanan' });
  const drawTicket = () => fill(ticket, el('b', null, `🧾 Pesanan ${k + 1} dari ${orders.length}`), orders[k].length === 3 ? el('span', null, el('b', null, orders[k][0]), ` · ${orders[k][1]}`) : el('span', null, orders[k][0]));
  const m = machine(ctx, (L) => {
    if (k >= orders.length) return;
    const want = orders[k][orders[k].length - 1];
    if (!L.valid) { ctx.mistake(); shake(m); say(msg, 'bad', L.note); return; }
    if (L.name !== want) { ctx.mistake(); shake(m); say(msg, 'bad', `Mesin mencetak ${L.name}: ${L.note}. Bandingkan dengan pesanan.`); return; }
    printed.append(el('span', { class: 'hc29-label-cetak' }, `🏷️ ${L.name}`)); ctx.sound.tap(); k++;
    if (k < orders.length) { say(msg, '', `${L.name} tercetak.`); m.reset(); drawTicket(); return; }
    fill(ticket, el('b', null, '✅ Semua pesanan tercetak')); say(msg, '', orders.length === 2 ? 'CC BY-NC-SA untuk video kelas dan CC BY-ND untuk foto Dimas.' : 'Semua lisensi CC kecuali CC0 mewajibkan BY; NC melarang dijual, ND melarang diubah, SA mewajibkan lisensi sama, dan SA tidak bisa bersama ND.'); done();
  });
  drawTicket();
  area.append(el('div', { class: 'hc29-dua' }, el('div', { class: 'hc29-kiri' }, ticket, printed), m), msg);
}

// Misi 3: the case court, then the inspector's objection.
function courtRound(area, ctx, { cases, objection, done }) {
  const msg = msg29('Seret setiap kartu kasus ke kotak putusan.');
  const items = cases.map((c) => [String(c[0]), `${c[0]}. ${c[1]}`, c]);
  sortBoard(area, ctx, { msg, items, bins: VERDICT.map(([v, l]) => bin(v, l, `v-${v}`)),
    check: (it, k) => { const c = it[2]; if (k === c[2]) return ''; return k === 'B' ? 'Ada aturan yang dilanggar atau syarat yang belum dipenuhi.' : k === 'T' ? 'Periksa lagi lisensi dan tujuannya: mungkin boleh, atau boleh dengan syarat.' : 'Apakah ada syarat yang bisa dipenuhi, atau memang dilarang?'; },
    chip: (it) => el('span', { class: 'hc29-chip' }, it[0]),
    after: (it) => say(msg, '', `Kasus ${it[0]} · ${LAW[it[2][3]]}: ${it[2][4]}`),
    done: () => setTimeout(object, 1800) });
  function object() {
    const c = CASES.find((x) => x[0] === objection);
    say(msg, 'info', `🙋 Inspektur: "Keberatan! Kasus ${objection} tidak boleh, lalu apa jalan keluarnya?" Ketuk cara lain yang tepat.`);
    const opts = ctx.rand.shuffle([[c[5], true], ...OBJECTIONS[objection].map((t) => [t, false])]);
    const row = el('div', { class: 'hc29-keberatan' }, el('b', null, `Kasus ${objection}: ${c[1]}`), opts.map(([t, ok]) => onTap(el('button', { class: 'hc29-cara', type: 'button', 'data-ok': ok ? 1 : 0 }, t), (e) => {
      if (row.classList.contains('beres')) return;
      if (!ok) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', 'Cara itu masih melanggar. Cari cara yang tidak lagi memakai karya atau data orang tanpa izin.'); return; }
      row.classList.add('beres'); e.currentTarget.classList.add('on'); ctx.sound.tap(); say(msg, '', 'Keberatan dijawab. Putusan yang baik selalu menyertakan jalan keluar.'); done();
    })));
    area.replaceChildren(row, msg);
  }
}

// Misi 4: spot the complete label, then build one from pieces.
function labelRound(area, ctx, { done }) {
  const msg = msg29('Empat poster pameran memakai foto "Sawah Terasering Pagi Hari". Ketuk poster yang labelnya lengkap.');
  const posters = el('div', { class: 'hc29-poster-poster' }, ATTRIB.map(([k, t, why]) => onTap(el('button', { class: 'hc29-poster', type: 'button', 'data-k': k }, el('span', { class: 'hc29-sawah' }, '🌄'), el('small', null, t)), (e) => {
    if (area.dataset.tahap) return;
    if (why) { ctx.mistake(); shake(e.currentTarget); e.currentTarget.classList.add('kurang'); say(msg, 'bad', why); return; }
    area.dataset.tahap = '2'; e.currentTarget.classList.add('on'); ctx.sound.tap(); say(msg, '', 'Label (iv) lengkap: judul, pencipta, sumber, lisensi, dan keterangan perubahan.'); setTimeout(build, 1700);
  })));
  area.append(posters, msg);
  function build() {
    say(msg, 'info', 'Rakit label untuk poster kelas 11-2: seret potongan ke slotnya. Ada tiga potongan pengecoh.');
    const slotDefs = [['J', 'Judul'], ['P', 'Pencipta'], ['S', 'Sumber'], ['L', 'Lisensi'], ['U', 'Perubahan']];
    const slots = slotDefs.map(([k, l]) => el('div', { class: 'hc29-slot', 'data-drop': k }, el('small', null, l)));
    const tray = el('div', { class: 'hc29-baki' }, ctx.rand.shuffle(PIECES.map((p) => p[0])).map((k) => el('div', { class: 'hc29-kartu', 'data-drag': k }, PIECES.find((p) => p[0] === k)[1])));
    let left = 5;
    const board = el('div', { class: 'hc29-papan' }, el('div', { class: 'hc29-label-rakit' }, el('span', null, '🏷️'), slots), tray);
    dnd(board, (card, slot) => {
      if (!left || slot.classList.contains('isi')) return;
      const [k, , ok] = PIECES.find((p) => p[0] === card.dataset.drag);
      if (!ok) { ctx.mistake(); shake(card); say(msg, 'bad', k === 'x2' ? 'Mesin pencari bukan pencipta.' : k === 'x1' ? '"Internet" bukan sumber yang jelas; pakai tautan halaman aslinya.' : 'Kelas 11-2 bukan pemegang hak cipta foto itu.'); return; }
      if (slot.dataset.drop !== k) { ctx.mistake(); shake(card); say(msg, 'bad', `Potongan ini bukan ${slotDefs.find((s) => s[0] === slot.dataset.drop)[1].toLowerCase()}.`); return; }
      card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); ctx.sound.tap();
      if (--left) { say(msg, '', 'Tepat.'); return; }
      say(msg, '', 'Label lengkap. Keterangan perubahan memberi tahu bahwa potongan dan tulisan bukan buatan Rina Kartika.'); done();
    });
    area.replaceChildren(board, msg);
  }
}

// Misi 5: deeds and cases onto the three law desks.
function lawRound(area, ctx, { done }) {
  const msg = msg29('Seret setiap kartu ke meja undang-undang yang paling terkait.');
  const items = [...LAWS.map(([k, t, a]) => [k, t, a]), ...CASES.filter((c) => c[0] >= 8).map((c) => [`k${c[0]}`, `Kasus ${c[0]} bazar: ${c[1]}`, c[3]])];
  sortBoard(area, ctx, { msg, items, bins: Object.entries(LAW).map(([k, l]) => bin(k, `⚖️ ${k} · ${l}`, `m-${k}`)),
    check: (it, k) => (k !== it[2] ? 'Apakah ini tentang karya, tentang ucapan di internet, atau tentang data pribadi?' : ''),
    chip: (it) => el('span', { class: 'hc29-chip' }, it[0].startsWith('k') ? `#${it[0].slice(1)}` : it[0]),
    after: (it) => say(msg, '', `${LAW[it[2]]}.`),
    done: () => { say(msg, '', 'HC melindungi karya, ITE mengatur ucapan dan konten di internet, PDP melindungi data pribadi. Kasus 8 dan 10 PDP, kasus 9 ITE.'); done(); } });
}

// Misi 6: the checklist before using and uploading.
function checklistRound(area, ctx, { done }) {
  const msg = msg29('Seret pertanyaan yang penting ke daftar periksa. Pertanyaan yang tidak berguna ditolak.');
  const list = el('div', { class: 'hc29-daftar', 'data-drop': 'daftar' }, el('b', null, '📋 Sebelum Memakai dan Mengunggah'), el('ol', { class: 'hc29-daftar-isi' }));
  const tray = el('div', { class: 'hc29-baki' }, ctx.rand.shuffle(CHECKS.map((c) => c[0])).map((k) => el('div', { class: 'hc29-kartu', 'data-drag': k }, CHECKS.find((c) => c[0] === k)[1])));
  let left = CHECKS.filter((c) => c[2]).length;
  const board = el('div', { class: 'hc29-dua' }, list, tray);
  dnd(board, (card) => {
    if (!left) return;
    const c = CHECKS.find((x) => x[0] === card.dataset.drag);
    if (!c[2]) { ctx.mistake(); shake(card); say(msg, 'bad', c[3]); return; }
    card.remove(); list.querySelector('ol').append(el('li', null, c[1])); ctx.sound.tap();
    if (--left) { say(msg, '', 'Masuk daftar.'); return; }
    say(msg, '', 'Daftar periksa lengkap: pencipta dan izin, komersial, ubahan, atribusi, data pribadi, dan ucapan. Inspektur akan datang!'); done();
  });
  area.append(board, msg);
}

// Misi Bos: the inspector checks eight spots; three hide a violation.
function inspectBoss(area, ctx, { done }) {
  const bad = new Set(ctx.rand.shuffle(SPOTS.map((s) => s[0])).slice(0, 3));
  const msg = msg29('Tiga titik stan menyembunyikan pelanggaran. Periksa setiap titik: lolos atau melanggar?');
  let left = SPOTS.length;
  const tiles = SPOTS.map(([k, ic, name, fine, wrong, no]) => {
    const isBad = bad.has(k); const c = CASES.find((x) => x[0] === no);
    const tile = el('div', { class: 'hc29-titik', 'data-k': k, 'data-bad': isBad ? 1 : 0 }, el('div', { class: 'hc29-titik-kepala' }, el('span', null, ic), el('b', null, name)), el('small', null, isBad ? wrong : fine));
    const btns = el('div', { class: 'hc29-yt' }, [['lolos', '✅ Lolos'], ['langgar', '🚩 Melanggar']].map(([v, l]) => onTap(el('button', { class: 'hc29-putus', type: 'button', 'data-v': v }, l), () => {
      if (tile.classList.contains('beres')) return;
      if ((v === 'langgar') !== isBad) { ctx.mistake(); shake(tile); say(msg, 'bad', isBad ? `Periksa lagi dengan daftar periksa: ${c[4]}` : 'Titik ini memenuhi aturan. Jangan menuduh tanpa dasar.'); return; }
      tile.classList.add('beres', isBad ? 'langgar' : 'lolos'); btns.replaceChildren(el('b', null, isBad ? `🚩 ${LAW[c[3]]} · kasus ${no}` : '✅ Lolos')); ctx.sound.tap();
      say(msg, '', isBad ? `${c[4]} ${c[5]}` : 'Lolos.');
      if (!--left) { say(msg, '', 'Stan lolos inspeksi setelah tiga pelanggaran ditemukan dan diperbaiki. Daftar periksa membuat setiap masalah tertangkap.'); done(); }
    })));
    tile.append(btns);
    return tile;
  });
  area.append(el('div', { class: 'hc29-stan' }, el('div', { class: 'hc29-atap' }, el('span', null, '🎪 Stan Kelas 11-2')), el('div', { class: 'hc29-titik-titik' }, tiles)), msg);
}

export default {
  id: 'sma-29-hak-cipta',
  title: 'Boleh Dipakai atau Tidak?',
  topic: 'Hak cipta, lisensi Creative Commons, atribusi, dan UU HC, ITE, PDP',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '©️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Stan Bazar Lolos Inspeksi: pilah mitos dan fakta hak cipta, jalankan mesin lisensi Creative Commons, sidangkan sepuluh kasus bazar, rakit label pameran, kenali tiga meja hukum, lalu lolos inspeksi stan.',
  extraModes: [
    { id: 'kasus', icon: '🗂', label: 'Kuis Kasus', desc: 'Sepuluh kartu kasus bazar dipilah ke boleh, boleh dengan syarat, atau tidak boleh, lengkap dengan pembahasan, undang-undang, dan cara lain', create: createCases },
    { id: 'lisensi', icon: '🎛', label: 'Perakit Lisensi', desc: 'Nyalakan lambang BY, SA, NC, dan ND; lihat nama lisensinya dan apakah karya boleh dijual dan diubah', create: createLicense },
    { id: 'atribusi', icon: '🏷', label: 'Penyusun Atribusi', desc: 'Susun atribusi lengkap dari potongan judul, pencipta, sumber, lisensi, dan keterangan perubahan', create: createAttrib },
    { id: 'giliran', icon: '⚖️', label: 'Kasus Antartim', desc: 'Tim bergiliran memilah satu kartu kasus: jawaban benar 2 poin, alasan yang tepat 1 poin tambahan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hc29-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'hc29-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD29[k], '🎪'), area); };
      const fin = (ms) => ({ done: () => next(ms) });
      if (r === 0) { go('mitos', 1); mythRound(area, ctx, fin(6000)); }
      else if (r === 1) { go('lambang', 2); symbolMatch(area, ctx, fin(5000)); }
      else if (r === 2) { go('mesin', 2); orderRound(area, ctx, { orders: ORDERS, ...fin(6500) }); }
      else if (r === 3) { go('sidang1', 3); courtRound(area, ctx, { cases: CASES.slice(0, 5), objection: 2, ...fin(5500) }); }
      else if (r === 4) { go('sidang2', 3); courtRound(area, ctx, { cases: CASES.slice(5), objection: 9, ...fin(5500) }); }
      else if (r === 5) { go('label', 4); labelRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('meja', 5); lawRound(area, ctx, fin(7000)); }
      else if (r === 7) { go('pesanan', 6); orderRound(area, ctx, { orders: COMMISSIONS, ...fin(5500) }); }
      else if (r === 8) { go('periksa', 6); checklistRound(area, ctx, fin(6500)); }
      else { go('bos', 'Bos'); inspectBoss(area, ctx, fin(7500)); }
    }
    render();
  },
};

// --- extra modes ---
function createCases(root, ctx) {
  const wrap = el('div', { class: 'act hak-cipta' });
  root.append(wrap);
  const go = () => { wrap.replaceChildren(); caseRound(wrap, ctx, { cases: CASES, done: () => { ctx.sound.win(); wrap.append(el('div', { class: 'kode-baris' }, button('Ulangi', go, 'primary'))); } }); };
  go();
}
function createLicense(root, ctx) {
  const wrap = el('div', { class: 'act hak-cipta' });
  const b = licenseBuilder(ctx);
  b.classList.add('mandiri');
  wrap.append(el('p', { class: 'prompt' }, 'Perakit lisensi Creative Commons'), b);
  root.append(wrap);
}
function createAttrib(root, ctx) {
  const wrap = el('div', { class: 'act hak-cipta' });
  root.append(wrap);
  const go = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penyusun atribusi'), el('div', { class: 'hc-info' }, `Judul: ${PHOTO.judul} · Pencipta: ${PHOTO.pencipta} · Sumber: ${PHOTO.sumber} · Lisensi: ${PHOTO.lisensi} · Diubah: dipotong dan diberi tulisan`), attribBuilder(ctx, { onDone: () => { ctx.sound.win(); wrap.append(el('div', { class: 'kode-baris' }, button('Ulangi', go, 'primary'))); } }));
  go();
}
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act hak-cipta' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const deck = ctx.rand.shuffle(CASES.slice()); let k = 0;
    function turn() {
      if (k >= deck.length) { finishBoard(wrap, ctx, { title: 'Kasus antartim selesai', pts, again: () => pickTeams(wrap, 'Kasus Antartim', start) }); return; }
      const t = k % nT; const c = deck[k]; let stage = 0;
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: boleh, boleh dengan syarat, atau tidak boleh?`);
      const area = el('div');
      const reasons = ctx.rand.shuffle([c, ...ctx.rand.shuffle(CASES.filter((x) => x !== c && x[4] !== c[4])).slice(0, 2)]);
      const askReason = () => area.replaceChildren(el('div', { class: 'opts', style: { '--cols': 1 } }, reasons.map((x) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, x[4])), (e) => {
        if (stage !== 1) return; stage = 2; const ok = x === c; if (ok) pts[t] += 1; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        say(msg, ok ? '' : 'bad', `${ok ? 'Alasan tepat, +1. ' : ''}${LAW[c[3]]}. ${c[5]}`); k++; setTimeout(turn, 3200);
      }))));
      area.replaceChildren(el('div', { class: 'hc-keranjang' }, VERDICT.map(([v, l]) => onTap(el('button', { class: `hc-kotak v-${v}`, type: 'button' }, l), () => {
        if (stage !== 0) return; stage = 1; const ok = v === c[2]; if (ok) pts[t] += 2; ctx.sound[ok ? 'good' : 'bad']();
        say(msg, ok ? '' : 'bad', `${ok ? 'Tepat, +2.' : `Jawabannya: ${VERDICT.find((x) => x[0] === c[2])[1].toLowerCase()}.`} Sekarang pilih alasannya.`); wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: kasus ${c[0]}`), el('div', { class: 'hc-kasus' }, el('p', null, c[1])), area, msg); askReason();
      }))));
      wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: kasus ${c[0]}`), el('div', { class: 'hc-kasus' }, el('p', null, c[1])), area, msg);
    }
    turn();
  }
  pickTeams(wrap, 'Kasus Antartim', start);
}
