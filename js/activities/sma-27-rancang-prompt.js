// Merancang Prompt yang Baik — SMA/SMK (16–18 tahun), KA generatif.
// Six prompt components, grading scripted AI answers with a rubric (AK, SU,
// BI, RE), a card-based prompt assembler, follow-up prompts, and which data
// must never go into an online chatbot. No real AI is called: every answer is scripted.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

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
  goal: 'Bantu OSIS membuat kampanye hemat air: kenali enam komponen prompt, nilai jawaban KA dengan rubrik, rakit prompt dari kartu, perbaiki berulang, dan pilah data yang boleh dimasukkan ke KA.',
  extraModes: [
    { id: 'perakit', icon: '🧩', label: 'Perakit Prompt', desc: 'Rakit prompt dari tiga belas kartu; jawaban bernaskah berubah sesuai kartu pengecoh, lalu nilai dengan rubrik', create: createAssembler },
    { id: 'penilai', icon: '📋', label: 'Penilai Rubrik', desc: 'Beri kode AK, SU, BI, RE, atau ✓ pada Jawaban A, B, dan D, lalu lihat skor rubrik dan Kartu Fakta terkait', create: createGrader },
    { id: 'giliran', icon: '🎴', label: 'Prompt Antartim', desc: 'Tim bergiliran mengisi satu slot prompt-nya; skor tim adalah skor rubrik jawaban rakitannya. Kartu X membuat giliran hangus', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rancang-prompt' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const compCodes = COMPONENTS.map(([c, n]) => [c, `${c} · ${n}`]);
      if (r === 0) codeRound(wrap, ctx, { prompt: 'Prompt B: kalimat mana menjawab komponen apa?', sents: PROMPT_B, codes: compCodes, rubricAfter: false, hint: (s, c) => `Bukan ${c}. ${COMPONENTS.find((x) => x[0] === s[1])[2]}`,
        done: then(() => ask('Prompt A hanya berbunyi "Buatkan poster hemat air." Komponen apa saja yang ada?', [['Hanya tugas; pembaca, panjang, data sekolah, dan gaya harus ditebak sendiri oleh KA', true], ['Peran dan tugas'], ['Semua komponen, karena singkat itu baik'], ['Tugas dan format']])) });
      else if (r === 1) codeRound(wrap, ctx, { prompt: 'Menilai Jawaban A (jawaban KA untuk Prompt A)', title: ANSWERS.A.title, sents: ANSWERS.A.sents, hint: codeHint, done: next });
      else if (r === 2) ask('Skor rubrik Jawaban A: AK dua kalimat, SU satu, BI satu, RE dua. Berapa jumlahnya?', [['Akurasi 0, Sumber 1, Bias 1, Relevansi 0: jumlah 2 dari 8', true], ['Akurasi 1, Sumber 1, Bias 1, Relevansi 1: jumlah 4'], ['Jumlah 6 dari 8'], ['Jumlah 0 dari 8']], 1, el('div', { class: 'rp-aturan' }, 'Tidak ada masalah: 2 · satu masalah: 1 · dua masalah atau lebih: 0'));
      else if (r === 3) codeRound(wrap, ctx, { prompt: 'Menilai Jawaban B (jawaban KA untuk Prompt B)', title: ANSWERS.B.title, sents: ANSWERS.B.sents, hint: codeHint,
        done: then(() => ask('Skor Jawaban B 7 dari 8. Bolehkah langsung dicetak?', [['Belum: KA tetap bisa salah menyalin angka; setiap fakta harus diperiksa dengan sumbernya sebelum dicetak', true], ['Boleh, karena promptnya sudah kuat'], ['Boleh, karena skornya di atas 5'], ['Tidak, karena poster harus ditulis tangan']], 1, rubricTable(ANSWERS.B.sents.map((s) => s[1])))) });
      else if (r === 4) {
        const msg = el('p', { class: 'reveal info' }, 'Naskah upacara: pilih satu kartu untuk setiap komponen (ketuk kartu; ketuk slot untuk mengosongkan), lalu jalankan prompt.');
        const out = el('div');
        const a = assembler(ctx, {
          onX: () => { ctx.mistake(); say(msg, 'bad', '⚠️ Kartu X memuat data pribadi orang lain (nama dan kelas). Jangan dikirim ke KA.'); },
          onRun: (ids) => {
            if (!ids) { say(msg, 'bad', 'Isi keenam slot dulu.'); return; }
            const s = scripted(ids); out.replaceChildren(answerView(s));
            const bad = ids.filter((id) => !CARDS.find((c) => c[0] === id)[3]);
            if (bad.length) { ctx.mistake(); say(msg, 'bad', `Lihat masalah yang muncul karena kartu ${bad.join(', ')}. Ganti kartunya, lalu jalankan lagi.`); return; }
            say(msg, '', 'P1, K1, T1, F1, B1, C1: jawabannya Jawaban D dengan skor 8.');
            setTimeout(then(() => ask('Mengapa kartu X tidak boleh dipakai?', [['Memuat data pribadi orang lain yang dikirim ke layanan KA tanpa izin, dan mempermalukan satu orang di depan sekolah', true], ['Karena terlalu panjang'], ['Karena tidak termasuk komponen tugas'], ['Boleh saja, supaya Doni jera']])), 2600);
          } });
        wrap.append(el('p', { class: 'prompt' }, 'Menyusun prompt dari kartu'), a, out, msg);
      } else if (r === 5) ask('Apa bahayanya kartu B2 ("tambahkan data dan sumber dari mana saja") dan C2 ("salin pengumuman sekolah lain")?', [['B2 mengundang KA mengarang data dan sumber; C2 meminta KA meniru karya orang lain sehingga berisiko menjiplak', true], ['Keduanya membuat jawaban terlalu pendek'], ['Tidak berbahaya; makin banyak data makin baik'], ['B2 membuat bahasa kaku; C2 membuat naskah kurang lucu']], 1, el('div', { class: 'rp-kartu-kartu' }, CARDS.filter(([id]) => ['B2', 'C2'].includes(id)).map(([id, , t]) => el('div', { class: 'rp-kartu' }, el('b', null, id), el('span', null, t)))));
      else if (r === 6) ask('Jawaban C: nadanya bagus, tetapi 230 kata dan memuat "Menurut Dinas Sumber Air Wanasari, sekolah kita termasuk tiga sekolah paling boros air di kabupaten." Apa dua masalahnya?', [['RE: terlalu panjang (diminta sekitar 100 kata) · SU: Dinas Sumber Air Wanasari tidak ada di prompt maupun Kartu Fakta', true], ['AK: angka 230 salah · BI: menyalahkan dinas'], ['Tidak ada masalah'], ['RE: nadanya kurang bersemangat · AK: tidak ada angka']], 1, null,
        then(() => ask('Pilih prompt lanjutan yang paling tepat.', [['"Persingkat menjadi sekitar 100 kata. Hapus kalimat tentang Dinas Sumber Air Wanasari karena data itu tidak ada di prompt. Pakai hanya data tandon, pemakaian harian, dan keran bocor dari prompt pertama."', true], ['"Jawabanmu kurang bagus. Coba lagi."'], ['"Tambahkan lebih banyak data dari lembaga lain supaya naskahnya makin meyakinkan."'], ['"Ubah menjadi puisi."']])));
      else if (r === 7) codeRound(wrap, ctx, { prompt: 'Jawaban D: periksa setiap kalimat dengan Kartu Fakta.', sents: ANSWERS.D.sents, hint: codeHint,
        done: then(() => ask('Skornya 8. Bolehkah naskah ini langsung dibacakan?', [['Belum langsung: OSIS membaca ulang, menyesuaikan gaya, meminta persetujuan pembina, dan bertanggung jawab atas isinya', true], ['Boleh, skornya sempurna'], ['Boleh, KA yang bertanggung jawab'], ['Tidak boleh sama sekali karena dibuat KA']], 1, rubricTable(ANSWERS.D.sents.map((s) => s[1])))) });
      else if (r === 8) {
        const res = {};
        const msg = el('p', { class: 'reveal info' }, 'B: boleh dimasukkan ke chatbot KA. J: jangan.');
        const rows = el('div', { class: 'rp-data' });
        const draw = () => rows.replaceChildren(...DATA.map(([k, t, a, why]) => el('div', { class: `rp-d-baris ${k in res ? 'beres' : ''}` }, el('span', null, `${k}. ${t}`), k in res ? el('b', { class: a === 'B' ? 'ya' : 'tidak' }, a === 'B' ? 'B · boleh' : 'J · jangan') : el('div', { class: 'seg' }, [['B', 'B · boleh'], ['J', 'J · jangan']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
          if (v !== a) { ctx.mistake(); say(msg, 'bad', why); return; }
          res[k] = v; ctx.sound.tap(); say(msg, '', why); draw();
          if (Object.keys(res).length === DATA.length) setTimeout(next, 1200);
        }))))));
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Boleh atau jangan dimasukkan ke chatbot KA?'), rows, msg);
      } else ask('Mengapa data pribadi tidak boleh dimasukkan ke layanan KA daring?', [['Teks dikirim ke server penyedia dan bisa disimpan, dibaca petugas, dipakai melatih model, atau bocor; data orang lain dilindungi UU Pelindungan Data Pribadi', true], ['Karena KA tidak bisa membaca nama'], ['Karena membuat jawaban lebih lambat'], ['Boleh saja, asal chatbotnya terkenal']], 1, null,
        then(() => ask('Tantangan "Jadilah KA": kelompok lain menulis jawaban persis sesuai prompt kalian. Komponen mana yang biasanya paling sering terlupa?', [['Format dan batasan: tanpa itu jawaban terlalu panjang atau gayanya tidak diinginkan, karena KA tidak bisa membaca maksud yang tidak ditulis', true], ['Tugas'], ['Tidak ada; KA selalu mengerti maksud kita'], ['Peran, karena paling penting']])));
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
        el('div', { class: 'rp-kartu-kartu' }, CARDS.filter(([id, comp]) => !taken.includes(id) && (!comp || !slots[t][comp])).map(([id, comp, txt]) => onTap(el('button', { class: 'rp-kartu', type: 'button' }, el('b', null, id), el('span', null, txt)), () => {
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
