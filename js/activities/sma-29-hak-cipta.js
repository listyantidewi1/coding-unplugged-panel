// Boleh Dipakai atau Tidak? — SMA/SMK (16–18 tahun), hak cipta, lisensi, dan etika digital.
// Copyright basics, Creative Commons symbols and a licence builder, ten bazaar
// cases, writing a full attribution, and the three Indonesian laws (HC, ITE, PDP).

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

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
  goal: 'Bantu kelas 11-2 menyiapkan bazar: kenali hak cipta dan lisensi CC, pilah sepuluh kasus, tulis atribusi yang lengkap, dan kaitkan setiap kasus dengan undang-undangnya.',
  extraModes: [
    { id: 'kasus', icon: '🗂', label: 'Kuis Kasus', desc: 'Sepuluh kartu kasus bazar dipilah ke boleh, boleh dengan syarat, atau tidak boleh, lengkap dengan pembahasan, undang-undang, dan cara lain', create: createCases },
    { id: 'lisensi', icon: '🎛', label: 'Perakit Lisensi', desc: 'Nyalakan lambang BY, SA, NC, dan ND; lihat nama lisensinya dan apakah karya boleh dijual dan diubah', create: createLicense },
    { id: 'atribusi', icon: '🏷', label: 'Penyusun Atribusi', desc: 'Susun atribusi lengkap dari potongan judul, pencipta, sumber, lisensi, dan keterangan perubahan', create: createAttrib },
    { id: 'giliran', icon: '⚖️', label: 'Kasus Antartim', desc: 'Tim bergiliran memilah satu kartu kasus: jawaban benar 2 poin, alasan yang tepat 1 poin tambahan', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hak-cipta' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) segRows(wrap, ctx, { prompt: 'Benar atau salah?', rows: FACTS, opts: [['B', 'B · benar'], ['S', 'S · salah']], info: 'Hak cipta timbul otomatis setelah karya diwujudkan.', why: (f) => f[3], done: next });
      else if (r === 1) symbolRound(wrap, ctx, { done: next });
      else if (r === 2) tableRound(wrap, ctx, { done: next });
      else if (r === 3) caseRound(wrap, ctx, { cases: CASES.slice(0, 5), done: next });
      else if (r === 4) caseRound(wrap, ctx, { cases: CASES.slice(5), done: next });
      else if (r === 5) ask('Kasus 1: lagu pop dipakai tanpa izin untuk video promosi bazar. Cara lain mana yang tepat?', [['Musik yang lisensinya mengizinkan (misalnya CC BY dengan atribusi) atau musik buatan sendiri', true], ['Tetap pakai lagu itu tetapi kecilkan suaranya'], ['Pakai lagu itu asal hanya 30 detik'], ['Pakai lagu itu dan sebut nama penyanyinya']], 1, null,
        then(() => ask('Kasus 9: ulasan "penjual stan sebelah itu penipu" dengan hinaan dan foto wajah. Cara yang tepat menyampaikan keluhan?', [['Sampaikan langsung kepada penjual atau panitia, dengan fakta dan bahasa santun', true], ['Unggah ulang tanpa foto wajah'], ['Kirim ke grup kelas saja'], ['Pakai akun anonim supaya aman']])));
      else if (r === 6) segRows(wrap, ctx, { prompt: 'Menilai atribusi foto "Sawah Terasering Pagi Hari"', cls: 'atribusi', rows: ATTRIB.map(([k, t, w]) => [k, t, w ? 'kurang' : 'ok', w]), opts: [['ok', '✓ lengkap'], ['kurang', 'Ada yang kurang']], info: 'Atribusi yang baik memuat Judul, Pencipta, Sumber, Lisensi, dan keterangan bila diubah.', why: (a) => a[3] || 'Lengkap: J-P-S-L dan keterangan perubahan.',
        done: then(() => { const b = attribBuilder(ctx, { onDone: () => setTimeout(next, 1600) }); wrap.append(el('p', { class: 'prompt' }, 'Susun atribusi yang lengkap'), el('div', { class: 'hc-info' }, `Judul: ${PHOTO.judul} · Pencipta: ${PHOTO.pencipta} · Sumber: ${PHOTO.sumber} · Lisensi: ${PHOTO.lisensi} · Kelas memotongnya dan menambahkan tulisan "Pameran Karya 11-2".`), b); }) });
      else if (r === 7) ask('Mengapa atribusi perlu menyebut bahwa fotonya diubah?', [['Supaya orang tahu potongan dan tulisan itu bukan buatan Rina Kartika: menghormati hak moral, dan CC BY 4.0 mewajibkannya', true], ['Supaya atribusinya lebih panjang'], ['Supaya kelas 11-2 menjadi pemegang hak cipta'], ['Tidak perlu disebut']]);
      else if (r === 8) segRows(wrap, ctx, { prompt: 'Tiga undang-undang: mana yang paling terkait?', rows: LAWS, opts: [['HC', 'HC'], ['ITE', 'ITE'], ['PDP', 'PDP']], info: 'HC: hak cipta. ITE: informasi dan transaksi elektronik (nama baik, kebencian). PDP: data pribadi.', why: (l, ok) => (ok ? `${LAW[l[2]]}.` : 'Apakah ini tentang karya, tentang ucapan di internet, atau tentang data pribadi?'),
        done: then(() => ask('Di sepuluh kasus bazar, kasus mana yang terkait UU PDP dan mana yang terkait UU ITE?', [['PDP: kasus 8 dan 10 · ITE: kasus 9', true], ['PDP: kasus 7 · ITE: kasus 1'], ['PDP: kasus 9 · ITE: kasus 8 dan 10'], ['Semua kasus terkait UU Hak Cipta saja']])) });
      else { const b = licenseBuilder(ctx, { target: 'CC BY-NC-SA', onDone: () => setTimeout(then(() => ask('Tantangan: pertanyaan mana yang paling perlu ada di daftar periksa "Sebelum Memakai dan Mengunggah"?', [['Siapa penciptanya dan apakah ada izin atau lisensinya; bolehkah komersial dan diubah; atribusinya lengkap; ada wajah atau data pribadi yang belum diizinkan; apakah unggahan menuduh atau menghina', true], ['Apakah jumlah suka di unggahan akan banyak'], ['Apakah ukuran file cukup kecil'], ['Apakah warna poster sudah cerah']])), 1800) }); wrap.append(el('p', { class: 'prompt' }, 'Video dokumenter kelas: boleh dipakai dan diubah, tidak boleh dijual, harus menyebut nama kelas, dan ubahan berlisensi sama.'), b); }
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
