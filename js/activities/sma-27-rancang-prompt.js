// Merancang Prompt yang Baik — SMA/SMK (16–18 tahun), KA generatif.
// Six prompt components, grading scripted AI answers with a rubric (AK, SU,
// BI, RE), a card-based prompt assembler, follow-up prompts, and which data
// must never go into an online chatbot. No real AI is called: every answer is scripted.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const FACTS = [['F1', 'Pemakaian air sekolah rata-rata 6.000 liter per hari.'], ['F2', 'Tandon sekolah berisi 5.000 liter dan diisi pompa dari sumur bor setiap pagi.'], ['F3', 'Tetesan satu keran bocor selama satu jam berjumlah 1 liter, jadi sekitar 24 liter per hari.'], ['F4', 'Dari 24 keran di sekolah, 3 keran bocor.'], ['F5', 'Sekitar 97% air di Bumi adalah air laut. Air tawar yang mudah dipakai manusia kurang dari 1%.'], ['F6', 'Wudu dengan keran terbuka penuh memakai rata-rata 5 liter air, dengan keran setengah terbuka sekitar 2,5 liter.']];
export const COMPONENTS = [['PR', 'Peran', 'KA diminta bertindak sebagai siapa?'], ['KO', 'Konteks', 'Apa keadaannya, data apa yang dipakai, dan siapa pembacanya?'], ['TU', 'Tugas', 'Apa yang harus dibuat?'], ['FO', 'Format', 'Seperti apa bentuk dan panjang hasilnya?'], ['BA', 'Batasan', 'Apa yang tidak boleh dilakukan?'], ['CO', 'Contoh', 'Seperti apa gaya yang diinginkan?']];
export const CODES = [['AK', 'Tidak akurat', 'bertentangan dengan Kartu Fakta'], ['SU', 'Sumber karangan', 'lembaga atau tokoh yang tidak bisa diperiksa'], ['BI', 'Bias', 'menyalahkan atau menyamaratakan kelompok'], ['RE', 'Tidak relevan', 'tidak sesuai tugas, pembaca, atau format'], ['✓', 'Tidak bermasalah', '']];

export const PROMPT_B = [['Kamu adalah penulis kampanye lingkungan untuk remaja.', 'PR'], ['Sekolah kami memakai sekitar 6.000 liter air per hari, sedangkan tandonnya hanya 5.000 liter, sehingga pada musim kemarau tandon sering kosong sebelum jam pulang.', 'KO'], ['Pembacanya murid kelas 10–12 yang sering membiarkan keran menyala saat mencuci tangan dan berwudu.', 'KO', 'Kalimat ini menjelaskan siapa pembacanya, jadi termasuk konteks.'], ['Buatkan teks poster ajakan hemat air yang akan ditempel di dekat keran.', 'TU'], ['Susun dalam bentuk satu judul paling banyak enam kata, satu kalimat fakta, tiga ajakan singkat, dan satu kalimat penutup.', 'FO'], ['Pakai bahasa yang santun, jangan menyalahkan kelompok mana pun, dan jangan memakai angka yang tidak ada di prompt ini.', 'BA'], ['Contoh gaya yang kami sukai: "Setetes hari ini, seember esok hari."', 'CO']];

export const ANSWERS = {
  A: { title: 'Hemat Air, Selamatkan Bumi!', sents: [['Tahukah kamu? Sebanyak 80% air di Bumi bisa langsung diminum, tetapi manusia terus memboroskannya.', 'AK', 'F5: air tawar yang mudah dipakai kurang dari 1%, bukan 80%.'], ['Menurut laporan Lembaga Air Nusantara tahun 2023, setiap orang Indonesia memakai 400 liter air per hari.', 'SU', 'Lembaga dan laporannya tidak ada di Kartu Fakta dan tidak bisa diperiksa.'], ['Murid laki-laki paling sering lupa menutup keran, jadi merekalah penyebab tandon kosong.', 'BI', 'Menyalahkan satu kelompok tanpa data.'], ['Matikan lampu dan kipas angin saat kelas kosong.', 'RE', 'Membahas hemat listrik, bukan air.'], ['Tutup keran saat menyabuni tangan.', '✓', ''], ['Satu keran bocor membuang 1.000 liter air setiap hari.', 'AK', 'F3: sekitar 24 liter per hari, bukan 1.000 liter.'], ['Laporkan keran yang bocor kepada petugas kebersihan.', '✓', ''], ['Air adalah sumber kehidupan bagi semua makhluk hidup, dan tanpa air tidak akan ada kehidupan di planet ini, sehingga kita semua wajib menjaga, merawat, dan menghemat air setiap hari di mana pun kita berada tanpa terkecuali.', 'RE', 'Terlalu panjang (36 kata) untuk poster yang dibaca sambil lewat.']] },
  B: { title: 'Tandon Kosong, Kita Semua Repot', sents: [['Tandon kita hanya 6.000 liter, padahal kita memakai 5.000 liter setiap hari.', 'AK', 'Angkanya tertukar: tandon 5.000 liter (F2), pemakaian 6.000 liter (F1).'], ['Tutup keran saat menyabuni tangan.', '✓', ''], ['Saat berwudu, buka keran setengah saja.', '✓', 'Sesuai F6.'], ['Lihat keran menetes? Laporkan ke petugas kebersihan.', '✓', ''], ['Setetes hari ini, segalon esok hari.', '✓', '']] },
  D: { title: 'Naskah upacara (Jawaban D)', sents: [['Selamat pagi, teman-teman!', '✓', ''], ['Pernahkah kamu mendapati keran toilet tidak mengalirkan air saat istirahat kedua?', '✓', ''], ['Itu terjadi karena tandon sekolah kita hanya berisi 5.000 liter, sedangkan setiap hari kita memakai sekitar 6.000 liter.', '✓', 'F2 dan F1.'], ['Selain itu, 3 dari 24 keran kita bocor, dan satu keran bocor bisa membuang sekitar 24 liter air sehari.', '✓', 'F4 dan F3.'], ['Karena itu, mari lakukan dua hal sederhana.', '✓', ''], ['Pertama, tutup keran saat menyabuni tangan dan buka keran setengah saja saat berwudu.', '✓', 'F6.'], ['Kedua, bila melihat keran menetes, segera laporkan kepada petugas kebersihan.', '✓', ''], ['Teman-teman, tandon ini milik kita bersama.', '✓', ''], ['Kalau kita hemat hari ini, air masih mengalir sampai jam pulang. Terima kasih.', '✓', '']] },
};
export function rubric(codes) {
  const crit = ['AK', 'SU', 'BI', 'RE'].map((c) => { const n = codes.filter((x) => x === c).length; return [c, n === 0 ? 2 : n === 1 ? 1 : 0]; });
  return { crit, total: crit.reduce((s, [, v]) => s + v, 0) };
}

export const CARDS = [['P1', 'PR', 'Kamu adalah penyiar radio sekolah yang ramah dan bersemangat.', true], ['P2', 'PR', 'Kamu adalah dosen yang menulis makalah ilmiah.'], ['K1', 'KO', 'Tandon sekolah kami berisi 5.000 liter, sedangkan pemakaian sekitar 6.000 liter per hari, dan 3 dari 24 keran bocor. Satu keran bocor membuang sekitar 24 liter sehari.', true], ['K2', 'KO', 'Air itu penting untuk kehidupan.'], ['T1', 'TU', 'Tulis naskah ajakan hemat air untuk dibacakan petugas upacara hari Senin.', true], ['T2', 'TU', 'Tulis tentang air.'], ['F1', 'FO', 'Panjangnya sekitar 100 kata (kira-kira satu menit dibacakan), terdiri atas sapaan, fakta dari data sekolah, dua ajakan, dan penutup.', true], ['F2', 'FO', 'Tulis sepanjang mungkin supaya lengkap.'], ['B1', 'BA', 'Pakai hanya data dari prompt ini, jangan menyalahkan kelompok mana pun, dan pakai bahasa yang santun.', true], ['B2', 'BA', 'Tambahkan data dan sumber dari mana saja supaya meyakinkan.'], ['C1', 'CO', 'Contoh nada yang kami inginkan: "Teman-teman, tandon ini milik kita bersama."', true], ['C2', 'CO', 'Contoh: salin saja pengumuman sekolah lain yang ada di internet.'], ['X', null, 'Sebutkan nama dan kelas murid yang kemarin ketahuan membiarkan keran menyala: Doni, kelas 11-2.']];
// The scripted answer: Jawaban D, with one problem added for each decoy card.
export function scripted(ids) {
  const s = ANSWERS.D.sents.map((x) => [...x]);
  const has = (id) => ids.includes(id);
  if (has('P2')) s[0] = ['Dengan hormat, tulisan ini membahas urgensi konservasi sumber daya air dalam konteks lingkungan pendidikan menengah.', 'RE', 'Kaku seperti makalah, bukan sapaan upacara (kartu P2).'];
  if (has('K2')) s[2] = ['Itu terjadi karena tandon sekolah kita berisi 10.000 liter, tetapi tetap saja habis.', 'AK', 'Tanpa data sekolah, KA mengarang angka; F2: tandon 5.000 liter (kartu K2).'];
  if (has('T2')) { s.splice(5, 2, ['Air laut menguap karena panas matahari, menjadi awan, lalu turun sebagai hujan.', 'RE', 'Ajakan diganti penjelasan siklus air (kartu T2).']); }
  if (has('B2')) s.splice(4, 0, ['Menurut Lembaga Air Nusantara, sekolah yang boros air akan kehabisan air dalam lima tahun.', 'SU', 'Lembaga karangan yang tidak bisa diperiksa (kartu B2).'], ['Biasanya murid laki-laki yang paling sering lupa menutup keran.', 'BI', 'Menyalahkan satu kelompok tanpa data (kartu B2).']);
  if (has('C2')) s.splice(s.length - 1, 0, ['"Kepada seluruh warga SMA Harapan Bangsa, mulai besok kantin tutup pukul 13.00."', 'RE', 'Salinan pengumuman sekolah lain yang tidak berhubungan (kartu C2).']);
  if (has('F2')) s.push(['(… naskah berlanjut sampai lebih dari 400 kata …)', 'RE', 'Terlalu panjang untuk upacara (kartu F2).']);
  return s;
}
export const DATA = [['a', 'Catatan pemakaian air sekolah per bulan dari meteran', 'B', 'Bukan data pribadi, tetapi tetap tanyakan dulu kepada pihak sekolah.'], ['b', 'Nama lengkap dan nomor ponsel murid yang ketahuan membiarkan keran menyala', 'J', 'Data pribadi orang lain tanpa izin.'], ['c', 'Draf slogan buatan kelompokmu untuk diperbaiki bahasanya', 'B', 'Karya sendiri tanpa data pribadi.'], ['d', 'Kata sandi akun media sosial OSIS supaya KA bisa mengunggah poster sendiri', 'J', 'Kata sandi tidak pernah diberikan kepada siapa pun.'], ['e', 'Foto kartu pelajar temanmu supaya poster terasa lebih dekat', 'J', 'Kartu pelajar memuat data pribadi teman.'], ['f', 'Ringkasan bab siklus air dari buku Geografi yang kamu tulis sendiri', 'B', 'Tulisan sendiri tanpa data pribadi.'], ['g', 'Daftar nilai rapor seluruh kelas untuk memilih "duta hemat air"', 'J', 'Nilai rapor adalah data pribadi.'], ['h', 'Hasil survei OSIS tentang kebiasaan memakai air, tanpa nama responden', 'B', 'Tanpa nama, sehingga tidak menunjuk orang tertentu.']];

// --- pieces ---
const factCards = (hi = []) => el('div', { class: 'rp-fakta' }, FACTS.map(([k, t]) => el('div', { class: hi.includes(k) ? 'tanda' : '' }, el('b', null, k), el('span', null, t))));
function rubricTable(codes) {
  const r = rubric(codes);
  return el('table', { class: 'rp-rubrik' }, el('tr', null, ...['Akurasi', 'Sumber', 'Bias', 'Relevansi', 'Jumlah'].map((h) => el('th', null, h))), el('tr', null, ...r.crit.map(([, v]) => el('td', { class: `s${v}` }, v)), el('td', null, el('b', null, `${r.total}/8`))));
}
// Give each sentence one code; reasons appear as the codes go in.
function codeRound(wrap, ctx, { prompt, sents, codes = CODES.map((c) => [c[0], `${c[0]} · ${c[1]}`]), title = null, rubricAfter = true, done, hint }) {
  let k = 0; const got = [];
  const msg = el('p', { class: 'reveal info' }, codes[0][0] === 'PR' ? 'Komponen apa yang dijawab kalimat yang menyala?' : 'Beri kode kalimat yang menyala. Bila ada lebih dari satu masalah, pilih kode yang paling atas.');
  const host = el('div', { class: 'rp-dua' });
  const draw = () => host.replaceChildren(el('div', { class: 'rp-naskah' }, title ? el('b', { class: 'rp-judul' }, title) : null, sents.map(([t], i) => el('div', { class: `rp-kal ${i === k ? 'kini' : i < k ? 'isi' : ''}` }, el('span', { class: 'rp-no' }, `(${i + 1})`), el('span', null, t), i < k ? el('b', { class: `rp-kode k-${got[i]}` }, got[i]) : null)),
    k >= sents.length && rubricAfter ? rubricTable(got) : null),
  el('div', { class: 'rp-kanan' }, k < sents.length ? el('div', { class: 'seg rp-pilih' }, codes.map(([c, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    const want = sents[k][1];
    if (c !== want) { ctx.mistake(); shake(host); say(msg, 'bad', hint ? hint(sents[k], c) : 'Belum tepat. Bandingkan dengan Kartu Fakta dan Kebutuhan OSIS.'); return; }
    got.push(c); ctx.sound.tap(); say(msg, '', sents[k][2] || (c === '✓' ? 'Tidak bermasalah.' : 'Tepat.')); k++; draw();
    if (k === sents.length) setTimeout(() => done(got), 1500);
  }))) : null, codes[0][0] === 'PR' ? el('div', { class: 'rp-komponen' }, COMPONENTS.map(([c, n, q]) => el('div', null, el('b', null, `${c} · ${n}`), el('span', null, q)))) : factCards()));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), host, msg);
}
const codeHint = (s, c) => (c === '✓' ? 'Ada masalah di kalimat ini. Periksa angka, sumber, nada, dan kesesuaiannya dengan tugas.' : s[1] === '✓' ? 'Kalimat ini tidak bermasalah.' : `Bukan ${c}. Ingat urutan: AK, SU, BI, RE.`);

// Six slots; a card goes to its own component's slot.
function assembler(ctx, { onRun, onX }) {
  const slots = Object.fromEntries(COMPONENTS.map(([c]) => [c, null]));
  const host = el('div', { class: 'rp-perakit' });
  const draw = () => host.replaceChildren(el('div', { class: 'rp-kartu-kartu' }, CARDS.filter(([id]) => !Object.values(slots).includes(id)).map(([id, comp, t]) => onTap(el('button', { class: `rp-kartu ${id === 'X' ? 'x' : ''}`, type: 'button' }, el('b', null, id), el('span', null, t)), () => {
    if (!comp) { onX?.(); shake(host); return; }
    slots[comp] = id; ctx.sound.tap(); draw();
  }))), el('div', { class: 'rp-slot-slot' }, COMPONENTS.map(([c, n]) => { const id = slots[c]; const card = id && CARDS.find((x) => x[0] === id); return onTap(el('div', { class: `rp-slot ${id ? 'isi' : ''}` }, el('b', null, `${c} · ${n}`), card ? el('span', null, `${id}: ${card[2]}`) : el('small', null, 'kosong')), () => { if (id) { slots[c] = null; draw(); } }); }),
    button('▶ Jalankan prompt', () => { if (Object.values(slots).some((v) => !v)) { shake(host); onRun?.(null); return; } onRun?.(Object.values(slots)); }, 'primary')));
  draw();
  host.slots = slots;
  return host;
}
const answerView = (sents, show = true) => el('div', { class: 'rp-naskah' }, el('b', { class: 'rp-judul' }, '🤖 Jawaban KA (bernaskah)'), sents.map(([t, c, why], i) => el('div', { class: `rp-kal ${show && c !== '✓' ? 'masalah' : ''}` }, el('span', { class: 'rp-no' }, `(${i + 1})`), el('span', null, t), show ? el('b', { class: `rp-kode k-${c}` }, c) : null, show && c !== '✓' ? el('small', null, why) : null)), show ? rubricTable(sents.map((s) => s[1])) : null);

// ---------- Redaksi Hemat Air: the ten missions ----------
export const FACT_SHORT = { F1: 'Pemakaian 6.000 liter per hari', F2: 'Tandon berisi 5.000 liter', F3: 'Satu keran bocor ≈ 24 liter per hari', F4: '3 dari 24 keran bocor', F5: 'Air tawar mudah dipakai < 1%', F6: 'Wudu: 5 liter (penuh), 2,5 liter (setengah)' };
export const CARD_SHORT = { P1: 'Penyiar radio sekolah yang ramah', P2: 'Dosen penulis makalah ilmiah', K1: 'Tandon 5.000 L, pemakaian 6.000 L per hari, 3 dari 24 keran bocor', K2: 'Air itu penting untuk kehidupan', T1: 'Naskah ajakan hemat air untuk upacara Senin', T2: 'Tulis tentang air', F1: '±100 kata: sapaan, fakta, dua ajakan, penutup', F2: 'Sepanjang mungkin supaya lengkap', B1: 'Hanya data prompt ini, santun, tidak menyalahkan', B2: 'Tambah data dan sumber dari mana saja', C1: 'Nada: "Tandon ini milik kita bersama."', C2: 'Salin pengumuman sekolah lain' };
// One decoy card at a time: the problem sentence it leaves in the answer.
export const TRACES = [
  ['P2', 'Dengan hormat, tulisan ini membahas urgensi konservasi sumber daya air dalam konteks lingkungan pendidikan menengah.', 'RE', 'Gayanya kaku seperti makalah. Kartu mana yang mengatur KA bertindak sebagai siapa?', 'P2 meminta gaya dosen, jadi sapaan upacara berubah menjadi pembuka makalah.'],
  ['K2', 'Itu terjadi karena tandon sekolah kita berisi 10.000 liter, tetapi tetap saja habis.', 'AK', 'Angkanya karangan. Kartu mana yang seharusnya memberi data sekolah?', 'K2 tidak memberi data sekolah, jadi KA mengarang angka tandon.'],
  ['T2', 'Air laut menguap karena panas matahari, menjadi awan, lalu turun sebagai hujan.', 'RE', 'Isinya melenceng dari ajakan. Kartu mana yang menentukan apa yang harus dibuat?', 'T2 hanya berkata "tulis tentang air", jadi ajakan berubah menjadi pelajaran siklus air.'],
  ['F2', '(… naskah berlanjut sampai lebih dari 400 kata …)', 'RE', 'Masalahnya panjang. Kartu mana yang mengatur bentuk dan panjang hasil?', 'F2 meminta sepanjang mungkin, padahal naskah upacara dibacakan sekitar satu menit.'],
  ['B2', 'Menurut Lembaga Air Nusantara, sekolah yang boros air akan kehabisan air dalam lima tahun.', 'SU', 'Ada sumber karangan. Kartu mana yang seharusnya melarang data dari luar prompt?', 'B2 mengizinkan data dan sumber dari mana saja, jadi KA mengarang lembaga.'],
  ['C2', '"Kepada seluruh warga SMA Harapan Bangsa, mulai besok kantin tutup pukul 13.00."', 'RE', 'Ada salinan pengumuman lain. Kartu mana yang memberi contoh gaya?', 'C2 menyuruh menyalin pengumuman sekolah lain, dan itu juga berisiko menjiplak.'],
];
export const ANSWER_C = [['Selamat pagi, teman-teman yang luar biasa!', '✓'], ['Menurut Dinas Sumber Air Wanasari, sekolah kita termasuk tiga sekolah paling boros air di kabupaten.', 'SU'], ['Tandon sekolah kita hanya berisi 5.000 liter, padahal setiap hari kita memakai sekitar 6.000 liter.', '✓'], ['Mari tutup keran saat menyabuni tangan dan buka keran setengah saja saat berwudu.', '✓']];
export const FOLLOW = [['Persingkat menjadi sekitar 100 kata.', true, 'Menyebut masalah panjang (RE) dengan ukuran yang jelas.'], ['Hapus kalimat tentang Dinas Sumber Air Wanasari karena data itu tidak ada di prompt.', true, 'Menyebut kalimat bermasalah (SU) dan alasannya.'], ['Pakai hanya data tandon, pemakaian harian, dan keran bocor dari prompt pertama.', true, 'Mengingatkan batasan supaya KA tidak mengarang lagi.'], ['Jawabanmu kurang bagus. Coba lagi.', false, 'Tidak menyebut apa yang salah, jadi KA hanya menebak lagi.'], ['Tambahkan data dari lembaga lain supaya naskahnya makin meyakinkan.', false, 'Justru mengundang KA mengarang sumber lagi (SU).'], ['Ubah menjadi puisi.', false, 'Tidak sesuai tugas: yang dibutuhkan naskah upacara (RE).']];
// Numbers in Jawaban D and the fact card that backs each one.
export const D_NUMS = { 2: [['5.000 liter', 'F2'], ['6.000 liter', 'F1']], 3: [['3 dari 24 keran', 'F4'], ['24 liter air sehari', 'F3']], 5: [['setengah saja', 'F6']] };
export const DUELS = [
  { team: 'Redaksi Merah', have: [['PR', 'Kamu penyiar radio sekolah yang ramah.'], ['KO', 'Tandon kami 5.000 liter, pemakaian 6.000 liter per hari.'], ['TU', 'Tulis naskah ajakan hemat air untuk upacara Senin.'], ['CO', 'Contoh nada: "Teman-teman, tandon ini milik kita bersama."']],
    dice: [['KA memilih panjang 600 kata, tiga halaman penuh.', 'FO'], ['KA menambah: "Menurut Lembaga Air Nusantara, 9 dari 10 sekolah boros air."', 'BA'], ['KA menulis: "Kelas 12 paling malas menutup keran."', 'BA']] },
  { team: 'Redaksi Biru', have: [['PR', 'Kamu penulis kampanye lingkungan untuk remaja.'], ['KO', 'Pembacanya murid kelas 10–12; 3 dari 24 keran sekolah bocor.'], ['TU', 'Buat teks poster ajakan hemat air.']],
    dice: [['KA memilih bentuk puisi lima bait.', 'FO'], ['KA memakai angka karangan: "90% air sekolah terbuang."', 'BA'], ['KA memilih gaya pengumuman resmi yang kaku.', 'CO']] },
];
const A_GUESS = { PR: 'Siapa yang menulis? KA memilih gaya sendiri.', KO: 'Data sekolah dan pembacanya? KA tidak tahu, jadi mengarang.', FO: 'Panjang dan bentuknya? KA menebak.', BA: 'Boleh mengarang angka atau menyalahkan? Tidak dilarang.', CO: 'Gaya yang disukai OSIS? KA menebak.' };
const CRIT = { AK: 'Akurasi', SU: 'Sumber', BI: 'Bias', RE: 'Relevansi' };
const COMP_N = Object.fromEntries(COMPONENTS.map(([c, n]) => [c, n]));
const COMP_Q = Object.fromEntries(COMPONENTS.map(([c, , q]) => [c, q]));
const HEAD27 = {
  bedah: ['Bedah Prompt', 'Cap setiap kalimat Prompt B dengan komponennya, lalu temukan yang hilang dari Prompt A.'],
  buru: ['Buru Masalah Jawaban A', 'Cap kedelapan kalimat. Untuk cap AK, tunjukkan Kartu Fakta buktinya.'],
  rapor: ['Rapor Rubrik', 'Hitung skor rubrik Jawaban A, lalu putuskan: cetak atau kembalikan ke redaksi.'],
  cetak: ['Siap Cetak?', 'Periksa Jawaban B dengan Kartu Fakta, putuskan, lalu perbaiki sebelum dicetak.'],
  rakit: ['Rakit Prompt', 'Isi enam slot dengan kartu sampai jawaban mesin mendapat skor 8.'],
  lacak: ['Lacak Kartu Pengecoh', 'Seret setiap kartu pengecoh ke kalimat bermasalah yang ditimbulkannya.'],
  ulang: ['Perbaiki Berulang', 'Temukan dua masalah Jawaban C, lalu rakit prompt lanjutan.'],
  periksa: ['Periksa Jawaban D', 'Pasang Kartu Fakta pada setiap angka, lalu isi lembar persetujuan.'],
  data: ['Boleh atau Jangan', 'Pilah delapan kartu data: boleh dimasukkan ke chatbot KA, atau jangan.'],
  bos: ['Duel Jadilah KA', 'Lacak setiap tebakan KA ke komponen yang lupa ditulis, lalu temukan yang paling sering terlupa.'],
};

const ck = (c) => (c === '✓' ? 'ok' : c);
const msgLine = (t) => el('p', { class: 'reveal info' }, t);
const stampMark = (c) => el('b', { class: `rd27-stempel k-${ck(c)}` }, c);
const sentence = (t, i) => el('div', { class: 'rd27-kal', 'data-i': i }, el('span', { class: 'rd27-no' }, `(${i + 1})`), el('span', { class: 'rd27-teks' }, t));
const paperOf = (title, kids) => el('div', { class: 'rd27-kertas' }, el('b', { class: 'rd27-judul' }, title), kids);
function stampBar(ctx, stamps) {
  const st = { cur: null };
  const btns = stamps.map(([c, l]) => onTap(el('button', { class: `rd27-cap k-${ck(c)}`, type: 'button', 'data-c': c }, el('b', null, c), l ? el('small', null, l) : null), () => {
    st.cur = c; btns.forEach((b) => b.classList.toggle('on', b.dataset.c === c)); ctx.sound.tap();
  }));
  st.node = el('div', { class: 'rd27-cap-cap' }, el('small', null, '🔖 Pilih cap:'), btns);
  return st;
}
function factBoard(onPick) {
  return el('div', { class: 'rd27-fakta-fakta' }, el('small', null, '📇 Kartu Fakta'), FACTS.map(([k]) => {
    const n = el(onPick ? 'button' : 'div', { class: 'rd27-fakta', 'data-f': k, type: onPick ? 'button' : null }, el('b', null, k), el('span', null, FACT_SHORT[k]));
    if (onPick) onTap(n, () => onPick(k, n));
    return n;
  }));
}
const lampRow = (have, extra = {}) => el('div', { class: 'rd27-lampu-lampu' }, COMPONENTS.map(([c, n]) => el('span', { class: `rd27-lampu ${have.includes(c) ? 'on' : ''}`, 'data-c': c, ...(extra[c] || {}) }, el('b', null, c), el('small', null, n))));
function scoreStrip(codes) {
  const r = rubric(codes);
  return el('div', { class: 'rd27-rapor' }, r.crit.map(([c, v]) => el('span', { class: `s${v}` }, `${CRIT[c]} ${v}`)), el('b', null, `Skor ${r.total}/8`));
}

// Misi 1: stamp Prompt B, then see what Prompt A leaves for the machine to guess.
function dissectRound(area, ctx, { done }) {
  const msg = msgLine('Pilih cap komponen, lalu ketuk kalimat Prompt B yang menjawabnya.');
  const pad = stampBar(ctx, COMPONENTS.map(([c, n]) => [c, n]));
  const have = new Set(); const right = el('div', { class: 'rd27-kanan' });
  const lampsB = () => fill(right, el('small', { class: 'rd27-label' }, '💡 Lampu komponen Prompt B'), lampRow([...have]));
  let left = PROMPT_B.length;
  const rows = PROMPT_B.map(([t, want, why], i) => {
    const s = sentence(t, i); s.classList.add('tombol');
    return onTap(s, () => {
      if (s.classList.contains('isi') || !left) return;
      if (!pad.cur) { say(msg, 'info', 'Pilih dulu salah satu cap komponen.'); return; }
      if (pad.cur !== want) { ctx.mistake(); shake(s); say(msg, 'bad', `Bukan ${pad.cur}. Kalimat ini menjawab: ${COMP_Q[want]}`); return; }
      s.classList.add('isi'); s.append(stampMark(want)); have.add(want); lampsB(); ctx.sound.tap();
      say(msg, '', why || `${want} · ${COMP_N[want]}: ${COMP_Q[want]}`);
      if (!--left) setTimeout(stageA, 1600);
    });
  });
  const desk = el('div', { class: 'rd27-dua' }, paperOf('📝 Prompt B', rows), right);
  lampsB();
  area.append(pad.node, desk, msg);
  function stageA() {
    say(msg, 'info', 'Prompt A hanya satu kalimat. Beri cap kalimat itu.');
    const s = sentence('Buatkan poster hemat air.', 0); s.classList.add('tombol');
    let stamped = false; const seen = new Set();
    onTap(s, () => {
      if (stamped) return;
      if (!pad.cur) { say(msg, 'info', 'Pilih dulu salah satu cap komponen.'); return; }
      if (pad.cur !== 'TU') { ctx.mistake(); shake(s); say(msg, 'bad', `Bukan ${pad.cur}. Kalimat ini hanya meminta sesuatu dibuat.`); return; }
      stamped = true; s.classList.add('isi'); s.append(stampMark('TU')); ctx.sound.tap();
      say(msg, 'info', 'Hanya lampu TU yang menyala. Ketuk setiap lampu yang mati: apa yang harus ditebak KA sendiri?');
      const guesses = el('div', { class: 'rd27-tebakan' });
      const lamps = lampRow(['TU']);
      lamps.querySelectorAll('.rd27-lampu:not(.on)').forEach((lp) => { lp.classList.add('tombol'); onTap(lp, () => {
        const c = lp.dataset.c; if (seen.has(c)) return; seen.add(c); lp.classList.add('dilihat'); ctx.sound.tap();
        guesses.append(el('span', null, el('b', null, `🤔 ${c}`), A_GUESS[c]));
        if (seen.size === 5) { say(msg, '', 'Prompt A hanya berisi tugas. Lima hal lain ditebak sendiri oleh KA, dan tebakan itulah yang nanti bermasalah.'); done(); }
      }); });
      fill(right, el('small', { class: 'rd27-label' }, '💡 Lampu komponen Prompt A'), lamps, guesses);
    });
    fill(desk, paperOf('📝 Prompt A', [s]), right);
    fill(right, el('small', { class: 'rd27-label' }, '💡 Lampu komponen Prompt A'), lampRow([]));
  }
}

// Misi 2 and 3: stamp every sentence of a scripted answer; an AK stamp needs its fact card.
function huntRound(area, ctx, { key, evid, done }) {
  const A = ANSWERS[key];
  const msg = msgLine('Pilih cap, lalu ketuk kalimat. Bila ada lebih dari satu masalah, pakai cap yang paling kiri.');
  const pad = stampBar(ctx, CODES.map(([c, n]) => [c, n]));
  let pending = null; let left = A.sents.length;
  const finish = () => { if (left || pending != null) return; const n = (c) => A.sents.filter((s) => s[1] === c).length; say(msg, '', `Semua kalimat bercap: AK ${n('AK')}, SU ${n('SU')}, BI ${n('BI')}, RE ${n('RE')}, ✓ ${n('✓')}.`); done(); };
  const facts = factBoard((f, node) => {
    if (pending == null) { say(msg, 'info', 'Kartu Fakta dipakai sebagai bukti setelah sebuah kalimat diberi cap AK.'); return; }
    if (![].concat(evid[pending]).includes(f)) { ctx.mistake(); shake(node); say(msg, 'bad', `${f} tidak membantah kalimat (${pending + 1}). Cari kartu yang membahas hal yang sama.`); return; }
    node.classList.add('tanda'); rows[pending].append(el('small', { class: 'rd27-bukti' }, `bukti ${f}`)); ctx.sound.tap();
    say(msg, '', A.sents[pending][2]); pending = null; facts.classList.remove('tunggu'); finish();
  });
  const rows = A.sents.map(([t, want, why], i) => {
    const s = sentence(t, i); s.classList.add('tombol');
    return onTap(s, () => {
      if (s.classList.contains('isi') || !left) return;
      if (pending != null) { say(msg, 'info', `Ketuk dulu Kartu Fakta yang membantah kalimat (${pending + 1}).`); return; }
      if (!pad.cur) { say(msg, 'info', 'Pilih dulu salah satu cap.'); return; }
      if (pad.cur !== want) { ctx.mistake(); shake(s); say(msg, 'bad', codeHint(A.sents[i], pad.cur)); return; }
      s.classList.add('isi'); s.append(stampMark(want)); ctx.sound.tap(); left--;
      if (want === 'AK' && evid[i]) { pending = i; facts.classList.add('tunggu'); say(msg, 'info', `Cap AK. Sekarang ketuk Kartu Fakta yang membantah kalimat (${i + 1}).`); return; }
      say(msg, '', why || 'Tidak bermasalah.'); finish();
    });
  });
  area.append(pad.node, el('div', { class: 'rd27-dua' }, paperOf(`🤖 ${A.title}`, rows), facts), msg);
}

// Misi 2: the rubric dials, then print or send back.
function rubricRound(area, ctx, { done }) {
  const codes = ANSWERS.A.sents.map((s) => s[1]);
  const want = Object.fromEntries(rubric(codes).crit);
  const msg = msgLine('Hitung cap di lembar Jawaban A, lalu putar setiap dial ke skornya.');
  const set = {}; const total = el('b', { class: 'rd27-total' }, 'Skor ?/8');
  const lever = el('div', { class: 'rd27-yt' });
  const dials = Object.keys(CRIT).map((c) => {
    const row = el('div', { class: 'rd27-dial', 'data-c': c }, el('b', null, `${CRIT[c]} (${c})`));
    const btns = [2, 1, 0].map((v) => onTap(el('button', { class: 'rd27-nilai', type: 'button', 'data-v': v }, v), () => {
      if (c in set) return;
      if (v !== want[c]) { ctx.mistake(); shake(row); say(msg, 'bad', `Hitung lagi cap ${c} di lembar: tidak ada → 2, satu → 1, dua atau lebih → 0.`); return; }
      set[c] = v; btns.forEach((b) => b.classList.toggle('on', +b.dataset.v === v)); row.classList.add('beres'); ctx.sound.tap();
      if (Object.keys(set).length < 4) { say(msg, '', `${CRIT[c]}: ${v}.`); return; }
      total.textContent = `Skor ${rubric(codes).total}/8`; total.classList.add('rendah');
      say(msg, 'info', 'Skor 2 dari 8. Apa keputusan Pemimpin Redaksi?');
      fill(lever, onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'cetak' }, '🖨️ Cetak poster'), () => { if (over) return; ctx.mistake(); say(msg, 'bad', 'Poster ini memuat angka salah, sumber karangan, dan menyalahkan kelompok. Jangan dicetak.'); }),
        onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'balik' }, '↩️ Kembalikan ke redaksi'), () => { if (over) return; over = true; ctx.sound.tap(); say(msg, '', 'Dikembalikan. Penyebab utamanya Prompt A yang hanya berisi tugas, jadi redaksi menulis Prompt B yang lengkap.'); done(); }));
    }));
    row.append(el('span', { class: 'rd27-nilai-nilai' }, btns));
    return row;
  });
  let over = false;
  const sheet = el('div', { class: 'rd27-lembar' }, el('small', { class: 'rd27-label' }, '🗂️ Lembar cap Jawaban A'), el('div', { class: 'rd27-cap-baris' }, codes.map((c, i) => el('span', null, `(${i + 1})`, stampMark(c)))));
  const rule = el('div', { class: 'rd27-aturan' }, 'Setiap kriteria: tidak ada masalah → 2 · satu masalah → 1 · dua atau lebih → 0');
  area.append(sheet, rule, el('div', { class: 'rd27-dial-dial' }, dials, total), lever, msg);
}

// Misi 3: Jawaban B scores 7, but the swapped numbers must be fixed before printing.
function printRound(area, ctx, { done }) {
  huntRound(area, ctx, { key: 'B', evid: { 0: ['F1', 'F2'] }, done: () => setTimeout(decide, 1800) });
  function decide() {
    area.replaceChildren();
    const msg = msgLine('Skor Jawaban B 7 dari 8. Pemimpin Redaksi, apa keputusanmu?');
    const nums = ['6.000 liter', '5.000 liter'];
    const chips = nums.map((t, i) => el('button', { class: 'rd27-angka-tukar', type: 'button', 'data-i': i }, t));
    const first = el('div', { class: 'rd27-kal masalah' }, el('span', { class: 'rd27-no' }, '(1)'), el('span', { class: 'rd27-teks' }, 'Tandon kita hanya ', chips[0], ', padahal kita memakai ', chips[1], ' setiap hari.'), stampMark('AK'));
    const rest = ANSWERS.B.sents.slice(1).map(([t], i) => { const s = sentence(t, i + 1); s.append(stampMark('✓')); return s; });
    const strip = el('div', null, scoreStrip(ANSWERS.B.sents.map((s) => s[1])));
    const lever = el('div', { class: 'rd27-yt' });
    let fixing = false; let pick = null; let over = false;
    fill(lever, onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'cetak' }, '🖨️ Cetak sekarang'), () => { if (fixing) return; ctx.mistake(); say(msg, 'bad', 'Skor 7 berarti masih ada kalimat yang salah. Poster dengan angka tertukar tetap salah dan memalukan OSIS.'); }),
      onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'perbaiki' }, '✏️ Perbaiki dulu'), () => { if (fixing) return; fixing = true; lever.replaceChildren(); ctx.sound.tap(); chips.forEach((c) => c.classList.add('aktif')); say(msg, 'info', 'Ketuk kedua angka yang tertukar untuk menukar tempatnya. Cocokkan dengan F1 dan F2.'); }));
    chips.forEach((c) => onTap(c, () => {
      if (!fixing || over) return;
      if (pick == null) { pick = c; c.classList.add('pilih'); ctx.sound.tap(); return; }
      if (pick === c) { pick = null; c.classList.remove('pilih'); return; }
      over = true; chips[0].textContent = '5.000 liter'; chips[1].textContent = '6.000 liter'; chips.forEach((x) => x.classList.remove('pilih', 'aktif'));
      first.classList.remove('masalah'); first.querySelector('.rd27-stempel').replaceWith(stampMark('✓'));
      fill(strip, scoreStrip(['✓', '✓', '✓', '✓', '✓']), el('span', { class: 'rd27-cap-setuju' }, '✅ Siap dicetak setelah dibaca ulang OSIS'));
      ctx.sound.good?.(); say(msg, '', 'Tandon 5.000 liter (F2), pemakaian 6.000 liter (F1). Prompt yang kuat pun tidak menjamin KA menyalin angka dengan benar: setiap fakta tetap diperiksa.'); done();
    }));
    area.append(el('div', { class: 'rd27-dua' }, paperOf(`🤖 ${ANSWERS.B.title}`, [first, ...rest]), el('div', { class: 'rd27-kanan' }, factBoard(), strip)), lever, msg);
  }
}

const cardNode = (id) => { const [, comp] = CARDS.find((c) => c[0] === id); return el('div', { class: 'rd27-seret', 'data-drag': id }, el('b', { class: 'rd27-kk' }, comp), el('span', null, CARD_SHORT[id])); };
// Misi 4: twelve cards into six slots; a sticky note asks for personal data.
function assembleRound(area, ctx, { done }) {
  const msg = msgLine('Seret kartu ke slot komponennya, atau ketuk kartu lalu ketuk slotnya. Putuskan juga titipan di meja.');
  const slots = Object.fromEntries(COMPONENTS.map(([c]) => [c, null]));
  let xDone = false; let over = false;
  const tray = el('div', { class: 'rd27-baki' }, ctx.rand.shuffle(CARDS.filter((c) => c[1]).map((c) => c[0])).map(cardNode));
  const boxes = COMPONENTS.map(([c, n]) => el('div', { class: 'rd27-slot', 'data-drop': c }, el('b', null, `${c} · ${n}`), el('div', { class: 'rd27-slot-isi' }, el('small', null, 'kosong'))));
  const out = el('div', { class: 'rd27-hasil' });
  const note = el('div', { class: 'rd27-titipan' }, el('b', null, '📌 Titipan di meja redaksi'), el('span', null, CARDS.find((c) => c[0] === 'X')[2]),
    el('div', { class: 'rd27-yt' }, onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'masuk' }, '➕ Masukkan ke prompt'), () => { if (xDone) return; ctx.mistake(); shake(note); say(msg, 'bad', '⚠️ Titipan ini memuat nama dan kelas murid lain. Data pribadi orang lain jangan dikirim ke KA, dan jangan mempermalukan siapa pun.'); }),
      onTap(el('button', { class: 'rd27-tuas', type: 'button', 'data-k': 'hancur' }, '🗑️ Hancurkan'), () => { if (xDone) return; xDone = true; ctx.sound.tap(); fill(note, el('b', null, '🗑️ Titipan dihancurkan: data pribadi tidak dikirim ke KA.')); note.classList.add('beres'); say(msg, '', 'Tepat. Sekarang lengkapi keenam slot.'); })));
  const run = button('▶ Jalankan mesin KA', () => {
    if (over) return;
    if (!xDone) { say(msg, 'info', 'Putuskan dulu titipan di meja.'); shake(note); return; }
    const ids = COMPONENTS.map(([c]) => slots[c]);
    if (ids.some((x) => !x)) { say(msg, 'info', 'Isi keenam slot dulu.'); return; }
    const s = scripted(ids); const probs = s.filter((x) => x[1] !== '✓'); const r = rubric(s.map((x) => x[1]));
    fill(out, el('b', null, `🤖 Jawaban mesin · skor ${r.total}/8`, probs.length ? null : ' · semua kalimat ✓'), probs.length ? el('div', { class: 'rd27-masalah' }, probs.map(([, c, why]) => el('span', { title: why }, stampMark(c), ` ${(why.match(/kartu \w+/) || [''])[0]}`))) : null);
    if (probs.length) { ctx.mistake(); say(msg, 'bad', `${probs.length} kalimat bermasalah. ${probs[0][2]} Ganti kartu penyebabnya, lalu jalankan lagi.`); return; }
    over = true; say(msg, '', 'Skor 8/8: P1, K1, T1, F1, B1, C1 menghasilkan naskah upacara yang rapi (Jawaban D).'); done();
  }, 'primary');
  const board = el('div', { class: 'rd27-dua rakit' }, el('div', { class: 'rd27-kiri' }, note, tray), el('div', { class: 'rd27-kanan' }, el('div', { class: 'rd27-slot-slot' }, boxes), el('div', { class: 'rd27-jalan' }, run, out)));
  dnd(board, (card, box) => {
    if (over) return;
    const id = card.dataset.drag; const comp = CARDS.find((c) => c[0] === id)[1]; const c = box.dataset.drop;
    if (comp !== c) { ctx.mistake(); shake(card); say(msg, 'bad', `Kartu ini mengisi slot ${comp} · ${COMP_N[comp]}, bukan ${c} · ${COMP_N[c]}.`); return; }
    const inner = box.querySelector('.rd27-slot-isi');
    const old = inner.querySelector('[data-drag]'); if (old === card) return;
    if (old) tray.append(old);
    fill(inner, card); slots[c] = id; box.classList.add('isi'); ctx.sound.tap(); out.replaceChildren();
    say(msg, 'info', Object.values(slots).every(Boolean) ? 'Keenam slot terisi. Jalankan mesin KA.' : `Slot ${c} terisi.`);
  });
  area.append(board, msg);
}

// Misi 4: which decoy card left which problem sentence?
function traceRound(area, ctx, { done }) {
  const msg = msgLine('Mesin dijalankan enam kali, setiap kali dengan satu kartu pengecoh. Seret kartu ke kalimat bermasalah yang ditimbulkannya.');
  const tray = el('div', { class: 'rd27-baki' }, ctx.rand.shuffle(TRACES.map((t) => t[0])).map(cardNode));
  const strips = ctx.rand.shuffle(TRACES.slice()).map(([id, t, c]) => el('div', { class: 'rd27-jejak', 'data-drop': id }, stampMark(c), el('span', { class: 'rd27-teks' }, t), el('div', { class: 'rd27-jejak-isi' })));
  let left = TRACES.length;
  const board = el('div', { class: 'rd27-papan' }, el('div', { class: 'rd27-jejak-jejak' }, strips), tray);
  dnd(board, (card, box) => {
    if (!left || box.classList.contains('isi')) return;
    const tr = TRACES.find((x) => x[0] === box.dataset.drop);
    if (card.dataset.drag !== tr[0]) { ctx.mistake(); shake(card); say(msg, 'bad', tr[3]); return; }
    card.classList.add('locked'); box.querySelector('.rd27-jejak-isi').append(card); box.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', tr[4]); return; }
    say(msg, '', 'Setiap pengecoh meninggalkan jejak: peran → gaya, konteks → angka, tugas → isi, format → panjang, batasan → sumber, contoh → tiruan.'); done();
  });
  area.append(board, msg);
}

// Misi 5: find the two problems in Jawaban C, then build the follow-up prompt.
function followRound(area, ctx, { done }) {
  const msg = msgLine('Jawaban C punya dua masalah. Pilih cap, lalu ketuk kalimat atau meteran panjangnya.');
  const pad = stampBar(ctx, ['AK', 'SU', 'BI', 'RE'].map((c) => [c, CRIT[c]]));
  const found = new Set();
  const check = () => { if (found.size === 2) setTimeout(stage2, 1600); };
  const tapStamp = (node, want, okText, notText) => onTap(node, () => {
    if (node.classList.contains('isi') || found.size === 2) return;
    if (!pad.cur) { say(msg, 'info', 'Pilih dulu salah satu cap.'); return; }
    if (!want) { ctx.mistake(); shake(node); say(msg, 'bad', notText); return; }
    if (pad.cur !== want) { ctx.mistake(); shake(node); say(msg, 'bad', notText); return; }
    node.classList.add('isi'); node.append(stampMark(want)); found.add(want); ctx.sound.tap(); say(msg, '', okText); check();
  });
  const rows = ANSWER_C.map(([t, c], i) => { const s = sentence(t, i); s.classList.add('tombol'); return tapStamp(s, c === '✓' ? null : c, 'SU: Dinas Sumber Air Wanasari tidak ada di prompt maupun Kartu Fakta, dan prompt melarang data dari luar.', c === '✓' ? 'Kalimat ini sesuai Kartu Fakta dan tugas.' : 'Masalah kalimat ini bukan itu: periksa apakah lembaganya bisa dicek.'); });
  const meter = el('div', { class: 'rd27-meteran tombol' }, el('b', null, '📏 Panjang naskah'), el('div', { class: 'rd27-batang' }, el('i', { style: { width: '100%' } }), el('span', null, '230 kata')), el('small', null, 'diminta sekitar 100 kata'));
  tapStamp(meter, 'RE', 'RE: 230 kata, padahal diminta sekitar 100 kata (kira-kira satu menit dibacakan).', 'Masalah panjang naskah termasuk relevansi: tidak sesuai format yang diminta.');
  area.append(pad.node, el('div', { class: 'rd27-dua' }, paperOf('🤖 Jawaban C (naskah upacara)', [...rows, el('div', { class: 'rd27-kal redup' }, '(… naskah berlanjut: sejarah air, siklus hujan, dan tujuh ajakan lagi …)')]), el('div', { class: 'rd27-kanan' }, meter, factBoard())), msg);
  function stage2() {
    area.replaceChildren();
    say(msg, 'info', 'Rakit prompt lanjutan: seret kalimat yang membantu ke kotak pesan.');
    const box = el('div', { class: 'rd27-pesan', 'data-drop': 'p' }, el('b', null, '💬 Prompt lanjutan untuk mesin KA'), el('div', { class: 'rd27-pesan-isi' }));
    const tray = el('div', { class: 'rd27-baki' }, ctx.rand.shuffle(FOLLOW.map((f, i) => i)).map((i) => el('div', { class: 'rd27-seret', 'data-drag': i }, el('span', null, FOLLOW[i][0]))));
    let left = 3; let sent = false;
    const send = el('div', { class: 'kode-baris' });
    const board = el('div', { class: 'rd27-papan' }, box, tray, send);
    dnd(board, (card) => {
      if (!left) return;
      const f = FOLLOW[+card.dataset.drag];
      if (!f[1]) { ctx.mistake(); shake(card); say(msg, 'bad', f[2]); return; }
      card.classList.add('locked'); box.querySelector('.rd27-pesan-isi').append(card); ctx.sound.tap();
      if (--left) { say(msg, '', f[2]); return; }
      say(msg, 'info', 'Prompt lanjutan lengkap. Kirim ke mesin KA.');
      send.append(button('📨 Kirim', () => {
        if (sent) return; sent = true;
        fill(send, el('div', { class: 'rd27-hasil' }, el('b', null, '🤖 Jawaban D · 100 kata'), el('span', null, '"Selamat pagi, teman-teman! … tandon sekolah kita hanya berisi 5.000 liter … Terima kasih."'), scoreStrip(ANSWERS.D.sents.map((s) => s[1]))));
        say(msg, '', 'Prompt lanjutan yang baik menyebut masalahnya dengan jelas. "Coba lagi" saja membuat KA menebak ulang.'); done();
      }, 'primary'));
    });
    area.append(board, msg);
  }
}

// Misi 5: back every number in Jawaban D with a fact card, then sign off.
function checkDRound(area, ctx, { done }) {
  const msg = msgLine('Seret Kartu Fakta ke setiap angka yang disorot di Jawaban D.');
  const want = {}; let left = 0;
  const rows = ANSWERS.D.sents.map(([t], i) => {
    const s = sentence('', i); const tx = s.querySelector('.rd27-teks');
    let rest = t; const parts = [];
    for (const [sub, f] of D_NUMS[i] || []) { const at = rest.indexOf(sub); parts.push(rest.slice(0, at)); const key = `${i}-${f}`; want[key] = f; left++; parts.push(el('span', { class: 'rd27-angka', 'data-drop': key }, sub)); rest = rest.slice(at + sub.length); }
    parts.push(rest); tx.append(...parts);
    return s;
  });
  const tray = el('div', { class: 'rd27-baki fakta' }, ctx.rand.shuffle(FACTS.map(([k]) => k)).map((k) => el('div', { class: 'rd27-seret rd27-fakta', 'data-drag': k }, el('b', null, k), el('span', null, FACT_SHORT[k]))));
  const side = el('div', { class: 'rd27-kanan' }, el('small', { class: 'rd27-label' }, '📇 Kartu Fakta'), tray);
  const board = el('div', { class: 'rd27-dua' }, paperOf(`🤖 ${ANSWERS.D.title}`, rows), side);
  dnd(board, (card, box) => {
    if (!left || box.classList.contains('isi')) return;
    const f = card.dataset.drag; const w = want[box.dataset.drop];
    if (f !== w) { ctx.mistake(); shake(card); say(msg, 'bad', f === 'F5' ? 'F5 membahas air di Bumi; tidak ada angka itu di naskah ini.' : `${f} membahas hal lain. Angka "${box.textContent}" cocok dengan kartu yang menyebut hal yang sama.`); return; }
    card.remove(); box.classList.add('isi'); box.append(el('sup', null, f)); ctx.sound.tap();
    if (--left) { say(msg, '', `Cocok dengan ${f}.`); return; }
    say(msg, '', 'Kelima angka cocok dengan Kartu Fakta. Skor 8. Sekarang isi lembar persetujuan.');
    setTimeout(signOff, 1500);
  });
  area.append(board, msg);
  function signOff() {
    const ticks = new Set(); let who = null; let over = false;
    const fin = () => { if (!over && ticks.size === 2 && who === 'OSIS') { over = true; say(msg, '', 'Naskah boleh dibacakan. Yang bertanggung jawab atas isinya adalah OSIS, bukan KA: KA hanya alat bantu.'); done(); } };
    const tick = (k, t, trap) => { const b = el('button', { class: 'rd27-centang', type: 'button', 'data-k': k }, el('i', null, '☐'), t); return onTap(b, () => {
      if (over || b.classList.contains('on')) return;
      if (trap) { ctx.mistake(); shake(b); say(msg, 'bad', 'Skor 8 bukan alasan melewatkan pemeriksaan. KA tetap bisa salah, jadi manusia membaca ulang dulu.'); return; }
      b.classList.add('on'); b.querySelector('i').textContent = '☑'; ticks.add(k); ctx.sound.tap(); fin();
    }); };
    const pickWho = (k) => onTap(el('button', { class: 'rd27-tuas kecil', type: 'button', 'data-k': k }, k === 'OSIS' ? '🧑‍🤝‍🧑 OSIS' : '🤖 Mesin KA'), (e) => {
      if (over || who) return;
      if (k !== 'OSIS') { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', 'KA tidak bisa dimintai tanggung jawab. Yang memilih memakai dan membacakan naskah atas nama OSIS adalah OSIS.'); return; }
      who = k; e.currentTarget.classList.add('on'); ctx.sound.tap(); fin();
    });
    fill(side, el('div', { class: 'rd27-setuju' }, el('b', null, '📋 Lembar persetujuan'), scoreStrip(ANSWERS.D.sents.map((s) => s[1])),
      tick('baca', 'Dibaca ulang OSIS dan gayanya disesuaikan'), tick('lewat', 'Langsung dibacakan tanpa dibaca ulang karena skornya 8', true), tick('pembina', 'Disetujui pembina OSIS'),
      el('div', { class: 'rd27-yt' }, el('span', null, '⚖️ Penanggung jawab isi:'), pickWho('OSIS'), pickWho('KA'))));
  }
}

// Misi 6: sort data cards into the chatbot basket or the locked drawer.
function dataRound(area, ctx, { done }) {
  const msg = msgLine('Seret setiap kartu data ke keranjang yang tepat, atau ketuk kartu lalu ketuk keranjangnya.');
  const bins = [['B', '💬 Boleh dimasukkan ke chatbot KA'], ['J', '🔒 Jangan dimasukkan']].map(([k, l]) => el('div', { class: `rd27-keranjang k-${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'rd27-keranjang-isi' })));
  const tray = el('div', { class: 'rd27-baki' }, ctx.rand.shuffle(DATA.map((d) => d[0])).map((k) => el('div', { class: 'rd27-seret', 'data-drag': k }, el('b', { class: 'rd27-kk' }, k), el('span', null, DATA.find((d) => d[0] === k)[1]))));
  let left = DATA.length;
  const board = el('div', { class: 'rd27-papan' }, el('div', { class: 'rd27-keranjang-keranjang' }, bins), tray);
  dnd(board, (card, box) => {
    if (!left) return;
    const [k, , a, why] = DATA.find((d) => d[0] === card.dataset.drag);
    if (box.dataset.drop !== a) { ctx.mistake(); shake(card); say(msg, 'bad', a === 'J' ? `Kartu ${k}: ${why}` : `Kartu ${k} boleh: ${why}`); return; }
    card.remove(); box.querySelector('.rd27-keranjang-isi').append(el('span', { class: 'rd27-huruf' }, k)); ctx.sound.tap();
    if (--left) { say(msg, '', `${k}: ${why}`); return; }
    say(msg, '', 'Boleh: a, c, f, h. Jangan: b, d, e, g. Teks yang dikirim ke chatbot daring bisa disimpan dan dibaca pihak lain, jadi data pribadi dan kata sandi tidak pernah dimasukkan.'); done();
  });
  area.append(board, msg);
}

// Misi Bos: the rival team plays the machine and fills every missing part on a whim.
function duelRound(area, ctx, { done }) {
  const msg = msgLine('');
  const tally = {}; let d = 0;
  const play = () => {
    const D = DUELS[d]; const have = D.have.map((h) => h[0]); let left = D.dice.length;
    say(msg, 'info', `${D.team} menjadi KA dan mengisi bagian yang tidak ditulis sesuka hati. Seret setiap tebakan 🎲 ke lampu komponen yang lupa ditulis.`);
    const lamps = lampRow(have); lamps.querySelectorAll('.rd27-lampu').forEach((lp) => lp.setAttribute('data-drop', lp.dataset.c));
    const prompt = paperOf(`📝 Prompt ${D.team} · duel ${d + 1} dari ${DUELS.length}`, D.have.map(([c, t], i) => { const s = sentence(t, i); s.append(stampMark(c)); return s; }));
    const tray = el('div', { class: 'rd27-baki' }, D.dice.map(([t], i) => el('div', { class: 'rd27-seret dadu', 'data-drag': i }, el('b', null, '🎲'), el('span', null, t))));
    const board = el('div', { class: 'rd27-dua' }, prompt, el('div', { class: 'rd27-kanan' }, el('small', { class: 'rd27-label' }, '💡 Lampu komponen'), lamps, tray));
    dnd(board, (card, lamp) => {
      if (!left) return;
      const [, w] = D.dice[+card.dataset.drag]; const c = lamp.dataset.drop;
      if (have.includes(c)) { ctx.mistake(); shake(card); say(msg, 'bad', `${c} sudah ditulis, jadi KA tidak perlu menebaknya.`); return; }
      if (c !== w) { ctx.mistake(); shake(card); say(msg, 'bad', `Tebakan ini menjawab: ${COMP_Q[w]}`); return; }
      card.remove(); tally[c] = (tally[c] || 0) + 1; lamp.classList.add('terlupa'); lamp.setAttribute('data-n', `${tally[c]}×`); ctx.sound.tap();
      if (--left) { say(msg, '', `Tanpa ${c} · ${COMP_N[c]}, KA menebak sendiri.`); return; }
      d++;
      if (d < DUELS.length) { say(msg, '', 'Duel selesai. Redaksi berikutnya!'); setTimeout(() => { area.replaceChildren(); play(); }, 1600); return; }
      setTimeout(final, 1600);
    });
    area.append(board, msg);
  };
  function final() {
    area.replaceChildren();
    say(msg, 'info', 'Papan duel: berapa kali KA harus menebak setiap komponen? Ketuk dua komponen yang paling sering terlupa.');
    const picked = new Set(); let over = false;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
    const lamps = el('div', { class: 'rd27-lampu-lampu besar' }, COMPONENTS.map(([c, n]) => onTap(el('button', { class: `rd27-lampu tombol ${tally[c] ? 'terlupa' : 'on'}`, type: 'button', 'data-c': c, 'data-n': tally[c] ? `${tally[c]}×` : null }, el('b', null, c), el('small', null, n)), (e) => {
      if (over || picked.has(c)) return;
      if (!top.includes(c)) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', tally[c] ? 'Ada komponen lain yang lebih sering terlupa.' : `${c} selalu ditulis di kedua duel.`); return; }
      picked.add(c); e.currentTarget.classList.add('pilih'); ctx.sound.tap();
      if (picked.size === 2) { over = true; say(msg, '', 'Format dan batasan paling sering terlupa. Tanpa keduanya, jawaban terlalu panjang, gayanya acak, atau KA mengarang angka, karena KA tidak bisa membaca maksud yang tidak ditulis.'); done(); }
    })));
    area.append(lamps, msg);
  }
  play();
}

export default {
  id: 'sma-27-rancang-prompt',
  title: 'Merancang Prompt yang Baik',
  topic: 'Komponen prompt, menilai jawaban KA, dan data yang tidak boleh dimasukkan',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '✍️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Redaksi Hemat Air: bedah prompt kampanye OSIS, cap jawaban KA dengan rubrik dan Kartu Fakta, rakit prompt dari kartu, lacak kartu pengecoh, perbaiki berulang, pilah data yang boleh dimasukkan ke KA, lalu duel Jadilah KA.',
  extraModes: [
    { id: 'perakit', icon: '🧩', label: 'Perakit Prompt', desc: 'Rakit prompt dari tiga belas kartu; jawaban bernaskah berubah sesuai kartu pengecoh, lalu nilai dengan rubrik', create: createAssembler },
    { id: 'penilai', icon: '📋', label: 'Penilai Rubrik', desc: 'Beri kode AK, SU, BI, RE, atau ✓ pada Jawaban A, B, dan D, lalu lihat skor rubrik dan Kartu Fakta terkait', create: createGrader },
    { id: 'giliran', icon: '🎴', label: 'Prompt Antartim', desc: 'Tim bergiliran mengisi satu slot prompt-nya; skor tim adalah skor rubrik jawaban rakitannya. Kartu X membuat giliran hangus', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rd27-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'rd27-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD27[k], '📰'), area); };
      const fin = (ms) => ({ done: () => next(ms) });
      if (r === 0) { go('bedah', 1); dissectRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('buru', 2); huntRound(area, ctx, { key: 'A', evid: { 0: 'F5', 5: 'F3' }, ...fin(5000) }); }
      else if (r === 2) { go('rapor', 2); rubricRound(area, ctx, fin(5500)); }
      else if (r === 3) { go('cetak', 3); printRound(area, ctx, fin(6500)); }
      else if (r === 4) { go('rakit', 4); assembleRound(area, ctx, fin(5500)); }
      else if (r === 5) { go('lacak', 4); traceRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('ulang', 5); followRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('periksa', 5); checkDRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('data', 6); dataRound(area, ctx, fin(7000)); }
      else { go('bos', 'Bos'); duelRound(area, ctx, fin(7500)); }
    }
    render();
  },
};

// --- extra modes ---
function createAssembler(root, ctx) {
  const wrap = el('div', { class: 'act rancang-prompt' });
  root.append(wrap);
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu untuk mengisi slot komponennya. Tidak ada KA sungguhan: jawabannya naskah yang sudah disiapkan.');
  const out = el('div');
  const a = assembler(ctx, {
    onX: () => say(msg, 'bad', '⚠️ Kartu X ditolak: memuat data pribadi orang lain. Kartu kembali ke tumpukan.'),
    onRun: (ids) => {
      if (!ids) { say(msg, 'bad', 'Isi keenam slot dulu.'); return; }
      const s = scripted(ids);
      out.replaceChildren(answerView(s, false), el('div', { class: 'kode-baris' }, button('Nilai dengan rubrik', () => { out.replaceChildren(); codeRound(out, ctx, { prompt: 'Beri kode jawaban rakitanmu', sents: s, hint: codeHint, done: () => {} }); }, 'primary'), button('Tunjukkan kunci', () => out.replaceChildren(answerView(s)))));
      say(msg, '', 'Jawaban bernaskah muncul. Nilai sendiri dengan rubrik, lalu ganti kartu dan bandingkan.');
    } });
  wrap.append(el('p', { class: 'prompt' }, 'Perakit prompt: naskah upacara hemat air'), a, out, msg);
}

function createGrader(root, ctx) {
  const wrap = el('div', { class: 'act rancang-prompt' });
  root.append(wrap);
  const pick = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Penilai rubrik: pilih jawaban KA'), el('div', { class: 'opts', style: { '--cols': 3 } }, [['A', 'Jawaban A · Prompt A'], ['B', 'Jawaban B · Prompt B'], ['D', 'Jawaban D · prompt lanjutan']].map(([k, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), () => {
    wrap.replaceChildren(); codeRound(wrap, ctx, { prompt: `Menilai ${l}`, title: ANSWERS[k].title, sents: ANSWERS[k].sents, hint: codeHint, done: () => { ctx.sound.win(); wrap.append(el('div', { class: 'kode-baris' }, button('Pilih jawaban lain', pick, 'primary'))); } });
  }))));
  pick();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act rancang-prompt' });
  root.append(wrap);
  function start(nT) {
    const slots = Array.from({ length: nT }, () => Object.fromEntries(COMPONENTS.map(([c]) => [c, null])));
    let k = 0;
    const full = (t) => Object.values(slots[t]).every(Boolean);
    function turn() {
      if (slots.every((_, t) => full(t))) return finish();
      const t = k % nT; if (full(t)) { k++; return turn(); }
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: pilih satu kartu untuk satu slot yang masih kosong.`);
      const taken = Object.values(slots[t]);
      wrap.replaceChildren(scoreBar(slots.map((s) => Object.values(s).filter(Boolean).length), t, '/6 slot'), el('p', { class: 'prompt' }, `Tim ${t + 1}: isi satu slot`),
        el('div', { class: 'rp-slot-slot kecil' }, COMPONENTS.map(([c, n]) => el('div', { class: `rp-slot ${slots[t][c] ? 'isi' : ''}` }, el('b', null, `${c} · ${n}`), el('span', null, slots[t][c] || '—')))),
        el('div', { class: 'rp-kartu-kartu' }, CARDS.filter(([id, comp]) => !taken.includes(id) && (!comp || !slots[t][comp])).map(([id, comp, txt]) => onTap(el('button', { class: `rp-kartu ${comp ? '' : 'x'}`, type: 'button' }, el('b', null, id), el('span', null, txt)), () => {
          if (!comp) { ctx.sound.bad(); say(msg, 'bad', `⚠️ Kartu X memuat data pribadi. Giliran Tim ${t + 1} hangus.`); k++; setTimeout(turn, 2200); return; }
          slots[t][comp] = id; ctx.sound.tap(); k++; turn();
        }))), msg);
    }
    function finish() {
      const pts = slots.map((s) => rubric(scripted(Object.values(s)).map((x) => x[1])).total);
      finishBoard(wrap, ctx, { title: 'Skor rubrik jawaban rakitan setiap tim', pts, again: () => pickTeams(wrap, 'Prompt Antartim', start) });
      wrap.append(el('div', { class: 'rp-dua' }, slots.map((s, i) => el('div', null, el('b', null, `Tim ${i + 1}: ${Object.values(s).join(', ')}`), answerView(scripted(Object.values(s)))))));
    }
    turn();
  }
  pickTeams(wrap, 'Prompt Antartim', start);
}
