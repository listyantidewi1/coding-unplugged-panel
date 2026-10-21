// Jejak Digital Raka — SMP (13–15 tahun), keamanan dan etika digital. Ten
// public posts on a made-up profile leak small pieces that a stranger can
// combine; pupils find the leaks, sort private from public, fix the privacy
// settings, act as a bystander in a group-chat bullying story, and inspect
// a fake .apk wedding invitation (nothing is downloaded).

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

export const CATS = [['sekolah', 'Sekolah dan kelas'], ['umur', 'Umur dan tanggal lahir'], ['alamat', 'Alamat rumah'], ['rute', 'Jadwal dan rute pulang'], ['kosong', 'Kapan rumahnya kosong'], ['identitas', 'Nomor identitas'], ['ponsel', 'Nomor ponsel'], ['hewan', 'Nama hewan peliharaan']];
// [[key|text]] marks a leak; the rest is split into sentence pieces.
export const POSTS = [
  ['U1', 'Januari', 'Hari pertama semester 2! Seragam baru. 📷 Foto: bet sekolah [[sekolah|"SMP Negeri 5 Wanasari"]] terbaca jelas.'],
  ['U2', 'Februari', 'Akhirnya [[umur|14 tahun]]! Makasih ucapannya, teman-teman. [[umur|12-02]]'],
  ['U3', 'Maret', 'Rumah baru, cat baru! 📷 Foto: papan [[alamat|"Jl. Melati No. 27"]] terlihat jelas.'],
  ['U4', 'April', '[[hewan|Si Belang]], kucing kesayanganku, ulang tahun ke-3!'],
  ['U5', 'Mei', 'Latihan futsal [[rute|tiap Selasa dan Kamis jam 4 sore di GOR Wanasari]]. [[rute|Pulangnya jalan kaki lewat gang belakang pasar.]]'],
  ['U6', 'Juni', '[[kosong|Seminggu liburan ke rumah nenek]] di luar kota. [[kosong|Rumah kosong, deh!]]'],
  ['U7', 'Juli', 'Kartu pelajar baru, fotonya aneh banget! 📷 Foto: [[identitas|nama lengkap dan NISN]] serta [[umur|tanggal lahir]] terbaca.'],
  ['U8', 'Agustus', 'Guru matematika kami pelit nilai!!! Nyebelin!!! (disertai nama lengkap gurunya)'],
  ['U9', 'Oktober', 'Ganti nomor, ini nomor baruku: [[ponsel|08xx-xxxx-xxxx]]. Chat ya!'],
  ['U10', 'Desember', '🎥 Video: "Latihan pentas seni [[sekolah|kelas 8C]]!" Wajah teman-teman terlihat jelas, tanpa izin mereka.'],
].map(([id, month, text]) => ({ id, month, segs: split(text) }));
export function split(text) {
  const out = [];
  for (const part of text.split(/(\[\[[a-z]+\|[^\]]+\]\])/)) {
    const m = part.match(/^\[\[([a-z]+)\|([^\]]+)\]\]$/);
    if (m) out.push([m[2], m[1]]);
    else for (const piece of part.match(/[^.!?]+[.!?]*\s*|\s+/g) || []) out.push([piece, null]);
  }
  return out;
}
export const LEAKS = POSTS.flatMap((p) => p.segs.map((s, i) => [p.id, i, s[1]]).filter((x) => x[2]));
export const PB = [['Hobi bermain futsal', 'B'], ['Alamat rumah lengkap', 'P'], ['Tanggal lahir lengkap dengan tahun', 'P'], ['Nomor kartu pelajar atau NISN', 'P'], ['Foto lukisan Raka di pameran sekolah', 'B'], ['Jadwal latihan dan rute pulang', 'P'], ['Nomor ponsel', 'P'], ['Juara 2 lomba cerdas cermat tingkat kabupaten', 'B']];
// [key, question, options, safe options, unsafe start]
export const SETTINGS = [
  ['lihat', 'Siapa yang bisa melihat unggahanku', ['Publik', 'Teman', 'Hanya saya'], ['Teman', 'Hanya saya']],
  ['lokasi', 'Tampilkan lokasi pada unggahan', ['Ya', 'Tidak'], ['Tidak']],
  ['pesan', 'Siapa yang bisa mengirim pesan kepadaku', ['Semua orang', 'Teman'], ['Teman']],
  ['tag', 'Orang lain menandai (tag) aku', ['Langsung tampil', 'Minta persetujuanku dulu'], ['Minta persetujuanku dulu']],
  ['nomor', 'Tampilkan nomor ponsel di profil', ['Ya', 'Tidak'], ['Tidak']],
  ['lahir', 'Tampilkan tanggal lahir', ['Lengkap', 'Tanpa tahun', 'Tidak ditampilkan'], ['Tidak ditampilkan', 'Tanpa tahun']],
  ['cari', 'Profilku bisa ditemukan lewat mesin pencari', ['Ya', 'Tidak'], ['Tidak']],
];
export const UNSAFE = Object.fromEntries(SETTINGS.map(([k, , o]) => [k, o[0]]));
export const isSafe = (S) => SETTINGS.every(([k, , , ok]) => ok.includes(S[k]));
export const DELETE = ['U3', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10'];
export const DELETE_OK = ['U1', 'U2', 'U4'];
export const BYSTANDER = [
  ['A', 'Ikut mengirim stiker tertawa supaya tidak dianggap tidak asyik.', 'buruk', 'Wulan melihat namamu di antara yang tertawa. Ejekan makin ramai dan Doni merasa didukung.'],
  ['B', 'Diam saja, lalu keluar dari grup.', 'netral', 'Grup tetap ramai dan Wulan tidak tahu ada yang peduli. Tidak memperparah, tetapi juga tidak membantu.'],
  ['C', 'Mengirim pesan pribadi kepada Wulan untuk menunjukkan dukungan.', 'baik', 'Wulan membalas: "Makasih, aku kira semua orang ikut menertawakanku." Ia tidak merasa sendirian.'],
  ['D', 'Menulis di grup, "Ini tidak lucu. Tolong hapus fotonya."', 'baik', 'Dua teman ikut menulis "Setuju, hapus." Stiker tertawa berhenti.'],
  ['E', 'Menyimpan tangkapan layar sebagai bukti, lalu melapor kepada wali kelas atau guru BK.', 'baik', 'Wali kelas berbicara dengan Doni dan Wulan. Fotonya dihapus, dan Doni meminta maaf.'],
  ['F', 'Meneruskan foto itu ke grup lain supaya banyak orang tahu bahwa Doni salah.', 'buruk', 'Foto Wulan kini dilihat lebih banyak orang. Wulan makin malu, walaupun niatmu baik.'],
];
export const APK = [['Nomor tidak dikenal · +62 8xx-xxxx-xxxx', 'nomor'], ['Selamat siang, ', null], ['mohon doa restu. ', null], ['Undangan pernikahan kami', 'nama'], [' ', null], ['silakan dibuka', 'desak'], ['📎 Undangan_Pernikahan_Digital.apk', 'apk'], ['2,1 MB', null]];
export const APK_WHY = { nomor: 'nomor tidak dikenal', nama: 'tidak menyebut nama pengirim atau mempelai', desak: 'meminta segera dibuka', apk: 'berkas .apk adalah pemasang aplikasi, bukan undangan' };
export const MALWARE = [['Virus', 'C'], ['Worm (cacing)', 'E'], ['Trojan', 'A'], ['Ransomware', 'B'], ['Spyware', 'D']];
export const TRAITS = { A: 'Menyamar sebagai berkas atau program yang berguna.', B: 'Mengunci berkas di perangkat, lalu meminta tebusan.', C: 'Menempel pada berkas lain dan ikut menyebar saat berkas itu dibuka.', D: 'Diam-diam mencuri data, misalnya membaca SMS dan kode OTP.', E: 'Menyebar sendiri lewat jaringan tanpa perlu dibuka orang.' };

// Timeline of posts. opts: onSeg(postId, i), found ([id,i] keys), wrong, picked posts, onPost, hidden, small.
function timeline({ onSeg, found = [], wrong = null, onPost, picked = [], hidden = [], loc = false } = {}) {
  return el('div', { class: 'jd-lini' }, POSTS.filter((p) => !hidden.includes(p.id)).map((p) => {
    const card = el('div', { class: `jd-unggah ${picked.includes(p.id) ? 'pilih' : ''}`, 'data-u': p.id },
      el('div', { class: 'jd-atas' }, el('b', null, p.id), el('span', null, p.month), loc ? el('small', null, '📍 lokasi') : null),
      el('p', null, p.segs.map(([t, k], i) => {
        if (!onSeg || !t.trim()) return t;
        const key = `${p.id}-${i}`;
        return onTap(el('span', { class: `jd-seg ${found.includes(key) ? 'bocor' : ''} ${wrong === key ? 'salah' : ''}`, 'data-s': key }, t), () => onSeg(p.id, i));
      })));
    return onPost ? onTap(card, () => onPost(p.id)) : card;
  }));
}
function profileBox(foundCats) {
  return el('div', { class: 'jd-profil' }, el('b', null, '🕵️ Profil yang bisa dibuat orang asing'),
    el('ul', null, CATS.map(([k, l]) => el('li', { class: foundCats.includes(k) ? 'isi' : '' }, `${foundCats.includes(k) ? '✔' : '○'} ${l}`))));
}
function strangerView(S, hidden = []) {
  const seen = [];
  if (S.nomor === 'Ya') seen.push('📱 Nomor ponsel tampil di profil');
  if (S.lahir === 'Lengkap') seen.push('🎂 Tanggal lahir lengkap dengan tahun');
  if (S.lahir === 'Tanpa tahun') seen.push('🎂 Tanggal lahir tanpa tahun');
  if (S.pesan === 'Semua orang') seen.push('✉️ Siapa pun bisa mengirim pesan');
  if (S.tag === 'Langsung tampil') seen.push('🏷️ Foto yang menandai Raka langsung tampil');
  if (S.cari === 'Ya') seen.push('🔎 Profil muncul di mesin pencari');
  const posts = S.lihat === 'Publik' ? POSTS.filter((p) => !hidden.includes(p.id)) : [];
  if (posts.length) seen.push(`🖼️ ${posts.length} unggahan terlihat${S.lokasi === 'Ya' ? ', lengkap dengan lokasi' : ''}`);
  return el('div', { class: 'jd-asing' }, el('div', { class: 'jd-asing-kepala' }, '👤 Raka', el('small', null, 'dilihat oleh orang asing')),
    seen.length ? el('ul', null, seen.map((s) => el('li', null, s))) : el('p', null, '🔒 Hampir tidak ada yang terlihat.'),
    S.lihat !== 'Publik' ? el('p', { class: 'jd-kunci' }, `🔒 Unggahan hanya untuk ${S.lihat === 'Teman' ? 'teman' : 'Raka sendiri'}.`) : null);
}

export default {
  id: 'smp-23-jejak-digital',
  title: 'Jejak Digital Raka',
  topic: 'Jejak digital, data pribadi, pengaturan privasi, perundungan siber, dan malware',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '👣',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menemukan informasi pribadi yang bocor dari unggahan, membedakan informasi privat dan publik, mengatur privasi yang aman, memilih tindakan saksi yang membantu saat perundungan siber, dan mengenali pesan berisi malware.',
  extraModes: [
    { id: 'asing', icon: '👤', label: 'Lihat sebagai Orang Asing', desc: 'Ubah pengaturan privasi, sembunyikan unggahan, lalu lihat apa yang masih terlihat oleh orang asing', create: createStranger },
    { id: 'giliran', icon: '🔁', label: 'Cari Kebocoran Bergiliran', desc: 'Tim bergantian mengetuk satu kebocoran di lini masa Raka; temuan baru yang benar mendapat poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act jejakdigital' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) leakRound(wrap, ctx, { done: next });
      else if (r === 1) ask('Mengapa nama hewan peliharaan (U4) pun bisa berbahaya?', [['Sering dipakai sebagai kata sandi atau jawaban pertanyaan keamanan akun', true], ['Karena kucing tidak boleh difoto'], ['Karena orang asing bisa mencuri kucingnya'], ['Tidak berbahaya sama sekali']]);
      else if (r === 2) pbRound(wrap, ctx, { done: next });
      else if (r === 3) settingsRound(wrap, ctx, { done: next });
      else if (r === 4) deleteRound(wrap, ctx, { done: next });
      else if (r === 5) ask('U8 tidak membocorkan data Raka. Mengapa unggahan itu tetap bisa merugikan Raka dan gurunya?', [['Menghina dan merusak nama baik guru, bisa membuat Raka bermasalah, dan bisa ditemukan kelak oleh panitia beasiswa atau tempat kerja', true], ['Karena tanda seru dilarang'], ['Tidak merugikan, karena itu pendapat pribadi'], ['Karena guru tidak boleh punya media sosial']], 1, timeline({ hidden: POSTS.filter((p) => p.id !== 'U8').map((p) => p.id) }));
      else if (r === 6) ask('U10 menampilkan wajah teman-teman. Apa yang seharusnya Raka lakukan sebelum mengunggahnya?', [['Meminta izin teman-temannya dan tidak mengunggah bila ada yang keberatan', true], ['Mengunggah saja, nanti dihapus kalau ada yang protes'], ['Memberi stiker lucu di wajah mereka tanpa bertanya'], ['Mengunggah ke grup kelas, bukan ke profil']], 1, null,
        then(() => ask('Raka menghapus U3 (alamat rumah). Mengapa jejaknya belum tentu hilang?', [['Orang lain mungkin sudah menyimpan tangkapan layar atau meneruskannya, dan unggahan bisa tersimpan di arsip atau hasil mesin pencari', true], ['Karena tombol hapus tidak berfungsi'], ['Jejaknya pasti hilang begitu dihapus'], ['Karena alamat rumah tidak bisa dihapus']])));
      else if (r === 7) bullyRound(wrap, ctx, { done: () => { wrap.replaceChildren(); ask('Mengapa perundungan digital bisa terasa lebih berat daripada ejekan langsung?', [['Menyebar cepat ke banyak orang, bisa disimpan dan dibuka berulang kali, terjadi kapan saja termasuk di rumah, dan sulit dihapus', true], ['Karena tidak ada yang melihatnya'], ['Karena hanya terjadi di sekolah'], ['Karena pesan digital otomatis hilang']]); } });
      else if (r === 8) apkRound(wrap, ctx, { done: () => { wrap.replaceChildren(); ask('Jika dibuka, berkas itu meminta izin membaca SMS dan notifikasi. Mengapa berbahaya?', [['Aplikasi bisa membaca kode OTP, lalu penjahat masuk ke akun bank, dompet digital, atau aplikasi percakapan', true], ['Karena SMS jadi lambat'], ['Karena baterai cepat habis'], ['Tidak berbahaya kalau aplikasinya kecil']], 1, null,
        then(() => ask('Apa yang sebaiknya dilakukan Ibu Raka?', [['Tidak membuka berkas, menghapus pesan, memblokir dan melaporkan nomor, lalu memberi tahu keluarga', true], ['Membuka berkas untuk melihat siapa yang menikah'], ['Meneruskan ke grup keluarga untuk bertanya'], ['Membalas meminta nama pengirim, lalu membukanya']]))); } });
      else malwareRound(wrap, ctx, { done: () => { wrap.replaceChildren(); ask('Berkas undangan palsu itu termasuk jenis … yang berperilaku seperti …', [['Trojan, berperilaku seperti spyware', true], ['Worm, berperilaku seperti virus'], ['Ransomware, berperilaku seperti trojan'], ['Virus, berperilaku seperti worm']]); } });
    }
    render();
  },
};

// Tap the leaking pieces until every profile category is filled.
function leakRound(wrap, ctx, { done }) {
  const found = [];
  let wrong = null;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk bagian unggahan yang membocorkan informasi tentang Raka.');
  const cats = () => [...new Set(found.map((k) => LEAKS.find(([p, i]) => `${p}-${i}` === k)[2]))];
  function draw() { stage.replaceChildren(el('div', { class: 'jd-samping' }, timeline({ onSeg: tap, found, wrong }), profileBox(cats()))); }
  function tap(p, i) {
    if (finished) return;
    const key = `${p}-${i}`;
    if (found.includes(key)) return;
    const leak = LEAKS.find(([a, b]) => a === p && b === i);
    if (!leak) { wrong = key; msg.className = 'reveal bad'; msg.textContent = 'Bagian itu tidak membocorkan informasi pribadi Raka.'; ctx.mistake(); draw(); return; }
    wrong = null;
    found.push(key);
    ctx.sound.good();
    const label = CATS.find(([k]) => k === leak[2])[1];
    msg.className = 'reveal info'; msg.textContent = `${p}: ${label.toLowerCase()}.`;
    if (cats().length === CATS.length) { finished = true; msg.className = 'reveal'; msg.textContent = 'Delapan potongan kecil kini terangkai: orang asing bisa berpura-pura kenal, menunggu di gang pada hari Selasa, atau datang saat rumah kosong.'; done(); }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Lini masa publik Raka (14 tahun). Apa yang bisa dirangkai orang asing?'), stage, msg);
}

function pbRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'P: privat. B: boleh dibagikan secara publik.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'ab-lapisan' }, PB.map(([t], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, t),
    el('div', { class: 'seg' }, [['P', 'Privat'], ['B', 'Boleh publik']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${pick[i] === k ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-k': k }, l), () => { if (!finished) { pick[i] = k; draw(); } })))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Privat atau boleh publik?'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = PB.map(([, k], i) => (pick[i] !== k ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} belum tepat.`; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar. Prestasi dan karya boleh dibagikan; data yang bisa dipakai untuk menemukan atau menyamar sebagai Raka tetap privat.'; done();
  }, 'primary')), msg);
}

function settingsPanel(S, redraw, bad = []) {
  return el('table', { class: 'kls-tabel jd-atur' }, el('tbody', null, ...SETTINGS.map(([k, q, opts], i) => el('tr', { class: bad.includes(k) ? 'salah' : '' }, el('th', null, q),
    el('td', null, el('div', { class: 'seg' }, opts.map((o) => onTap(el('button', { class: `seg-btn ${S[k] === o ? 'on' : ''}`, type: 'button', 'data-k': k, 'data-o': o }, o), () => { S[k] = o; redraw(); }))))))));
}

function settingsRound(wrap, ctx, { done }) {
  const S = { ...UNSAFE };
  let finished = false;
  let bad = [];
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Semua pengaturan masih terbuka. Pilih yang paling aman.');
  const draw = () => stage.replaceChildren(el('div', { class: 'jd-samping' }, settingsPanel(S, () => { if (!finished) draw(); }, bad), strangerView(S)));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Atur ulang privasi Raka. Di kanan: apa yang terlihat oleh orang asing.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    bad = SETTINGS.filter(([k, , , ok]) => !ok.includes(S[k])).map(([k]) => k);
    if (bad.length) { draw(); msg.className = 'reveal bad'; msg.textContent = `${bad.length} pengaturan belum aman.`; ctx.mistake(); return; }
    finished = true; draw(); msg.className = 'reveal'; msg.textContent = 'Aman. Ingat: "teman" sebaiknya hanya orang yang benar-benar dikenal.'; done();
  }, 'primary')), msg);
}

function deleteRound(wrap, ctx, { done }) {
  const picked = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pikirkan juga unggahan yang merugikan orang lain.');
  const draw = () => stage.replaceChildren(timeline({ picked, onPost: (id) => { if (finished) return; const i = picked.indexOf(id); if (i >= 0) picked.splice(i, 1); else picked.push(id); ctx.sound.tap(); draw(); } }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Ketuk unggahan yang sebaiknya dihapus atau disembunyikan.'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const miss = DELETE.filter((x) => !picked.includes(x));
    const extra = picked.filter((x) => !DELETE.includes(x) && !DELETE_OK.includes(x));
    if (miss.length || extra.length) { msg.className = 'reveal bad'; msg.textContent = miss.length ? `Masih ada ${miss.length} unggahan yang sebaiknya dihapus.` : 'Ada pilihan yang tidak perlu.'; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal';
    msg.textContent = `Benar: U3, U5, U6, U7, U9 membocorkan data; U8 menghina guru; U10 tanpa izin teman.${picked.some((x) => DELETE_OK.includes(x)) ? ' Menyembunyikan U1, U2, atau U4 juga boleh.' : ''}`;
    done();
  }, 'primary')), msg);
}

function bullyRound(wrap, ctx, { done }) {
  const tried = [];
  let finished = false;
  const out = el('div', { class: 'jd-akibat' });
  const msg = el('p', { class: 'reveal info' }, 'Cari semua tindakan yang membantu Wulan.');
  const opts = el('div', { class: 'jd-pilihan' });
  const draw = () => opts.replaceChildren(...BYSTANDER.map(([k, t, kind]) => onTap(el('button', { class: `jd-aksi ${tried.includes(k) ? kind : ''}`, type: 'button', 'data-k': k }, el('b', null, k), ` ${t}`), () => pickAct(k))));
  function pickAct(k) {
    if (finished || tried.includes(k)) return;
    const [, , kind, result] = BYSTANDER.find((x) => x[0] === k);
    tried.push(k);
    out.replaceChildren(el('b', null, `${k}: `), result);
    out.className = `jd-akibat ${kind}`;
    if (kind === 'buruk') { ctx.mistake(); ctx.sound.bad(); } else if (kind === 'baik') ctx.sound.good();
    const left = BYSTANDER.filter((x) => x[2] === 'baik' && !tried.includes(x[0])).length;
    msg.className = 'reveal info';
    msg.textContent = left ? `Masih ada ${left} tindakan yang membantu.` : '';
    draw();
    if (!left) { finished = true; msg.className = 'reveal'; msg.textContent = 'C, D, dan E membantu. Urutan yang baik: E dan C dulu, lalu D bila Raka merasa aman.'; setTimeout(done, 2600); }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Di grup kelas 8C, Doni mengunggah foto Wulan yang diedit menjadi bahan ejekan. Beberapa teman membalas stiker tertawa. Wulan diam. Apa yang Raka lakukan?'), opts, out, msg);
}

function apkRound(wrap, ctx, { done }) {
  const found = [];
  let finished = false;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk paling sedikit tiga tanda mencurigakan. Tidak ada berkas yang diunduh.');
  const stage = el('div');
  const draw = (wrong = -1) => stage.replaceChildren(el('div', { class: 'jd-pesan' }, APK.map(([t, k], i) => onTap(el('span', { class: `jd-seg ${i === 0 ? 'jd-nomor' : ''} ${i === 6 ? 'jd-berkas' : ''} ${found.includes(i) ? 'bocor' : ''} ${wrong === i ? 'salah' : ''}`, 'data-a': i }, t), () => {
    if (finished || found.includes(i)) return;
    if (!k) { msg.className = 'reveal bad'; msg.textContent = 'Bagian itu sendiri tidak mencurigakan.'; ctx.mistake(); draw(i); return; }
    found.push(i); ctx.sound.good();
    msg.className = 'reveal info'; msg.textContent = `Tanda: ${APK_WHY[k]}.`;
    if (found.length >= 3) { finished = true; msg.className = 'reveal'; msg.textContent = `Tanda: ${found.map((x) => APK_WHY[APK[x][1]]).join('; ')}.`; setTimeout(done, 2400); }
    draw();
  }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Ibu Raka menerima pesan ini. Apa yang mencurigakan?'), stage, msg);
}

function malwareRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pasangkan setiap jenis malware dengan cirinya.');
  const draw = (bad = []) => stage.replaceChildren(el('div', { class: 'jd-samping' },
    el('ol', { class: 'jd-ciri', type: 'A' }, Object.values(TRAITS).map((t) => el('li', null, t))),
    el('div', { class: 'ab-lapisan' }, MALWARE.map(([m], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, m),
      el('div', { class: 'seg' }, Object.keys(TRAITS).map((k) => onTap(el('button', { class: `seg-btn ${pick[i] === k ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-k': k }, k), () => { if (!finished) { pick[i] = k; draw(); } }))))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Jenis-jenis malware'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = MALWARE.map(([, k], i) => (pick[i] !== k ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} belum tepat.`; ctx.mistake(); return; }
    finished = true; done();
  }, 'primary')), msg);
}

function createStranger(root, ctx) {
  const wrap = el('div', { class: 'act jejakdigital' });
  root.append(wrap);
  const S = { ...UNSAFE };
  const hidden = [];
  let view = 'atur';
  function draw() {
    wrap.replaceChildren(el('div', { class: 'seg' }, [['atur', '⚙️ Pengaturan'], ['unggahan', '🖼️ Sembunyikan unggahan'], ['asing', '👤 Lihat sebagai orang asing']].map(([k, l]) => onTap(el('button', { class: `seg-btn ${view === k ? 'on' : ''}`, type: 'button', 'data-v': k }, l), () => { view = k; draw(); }))),
      view === 'atur' ? settingsPanel(S, draw)
        : view === 'unggahan' ? el('div', null, el('p', { class: 'reveal info' }, 'Ketuk unggahan untuk menyembunyikan atau menampilkannya.'), timeline({ picked: hidden, onPost: (id) => { const i = hidden.indexOf(id); if (i >= 0) hidden.splice(i, 1); else hidden.push(id); draw(); } }))
          : el('div', { class: 'jd-samping' }, strangerView(S, hidden), S.lihat === 'Publik' ? timeline({ hidden, loc: S.lokasi === 'Ya' }) : null),
      el('p', { class: isSafe(S) ? 'reveal' : 'reveal info' }, isSafe(S) ? '✔ Semua pengaturan sudah aman.' : `${SETTINGS.filter(([k, , , ok]) => !ok.includes(S[k])).length} pengaturan masih terbuka.`));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act jejakdigital' });
  root.append(wrap);
  let n = 2;
  let turn = 0;
  const found = [];
  const pts = [];
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { turn = 0; found.length = 0; pts.length = 0; for (let i = 0; i < n; i++) pts.push(0); play(''); }, 'primary')));
  }
  function play(note, wrong = null) {
    const team = turn % n;
    wrap.replaceChildren(el('div', { class: 'pb-skor' }, pts.map((p, i) => el('span', { class: i === team ? 'giliran' : '' }, `Tim ${i + 1}: ${p}`))),
      el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}: ketuk satu kebocoran (${found.length}/${LEAKS.length} ditemukan).`),
      timeline({ found, wrong, onSeg: (p, i) => {
        const key = `${p}-${i}`;
        if (found.includes(key)) return;
        const leak = LEAKS.find(([a, b]) => a === p && b === i);
        turn++;
        if (leak) { found.push(key); pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
        if (found.length === LEAKS.length) return finish();
        play(leak ? `Tim ${team + 1} menemukan: ${CATS.find(([k]) => k === leak[2])[1].toLowerCase()}.` : `Tim ${team + 1}: itu bukan kebocoran.`, leak ? null : key);
      } }),
      el('p', { class: 'reveal info' }, note || 'Kebocoran yang sudah ditemukan tidak bisa diketuk lagi.'));
  }
  function finish() {
    const best = Math.max(...pts);
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Semua ${LEAKS.length} kebocoran ditemukan.`),
      el('div', { class: 'ab-lapisan' }, pts.map((p, i) => el('div', { class: `ab-lap-baris ${p === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}`), el('b', null, `${p} poin${p === best ? ' 🏆' : ''}`)))),
      el('div', { class: 'kode-baris' }, button('Main lagi', setup, 'primary')));
  }
  setup();
}
