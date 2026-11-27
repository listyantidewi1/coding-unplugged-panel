// Cek Dulu Sebelum Sebar — SMA/SMK (16–18 tahun), membaca lateral dan verifikasi.
// A fake article about an OSIS candidate: vertical vs lateral reading in a
// simulated browser, a photo in the wrong context, a cut video, the
// fact-checking ecosystem, and how to answer in the class group.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

const SVG = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...kids) { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) n.setAttribute(k, v); for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : document.createTextNode(String(c))); return n; }

// Pieces of the article; sus = a warning sign found by vertical reading.
export const ARTICLE = [
  ['situs', 'WANASARI TERKINI · Portal Berita Independen Paling Terpercaya', false, 'Mengaku "paling terpercaya" justru belum membuktikan apa pun.'],
  ['url', 'https://wanasari-terkini.example/terbongkar-calon-ketua-osis', false, 'Alamat situs saja belum menunjukkan apa-apa; periksa siapa pembuatnya dengan membaca lateral.'],
  ['judul', 'TERBONGKAR! Calon Ketua OSIS Fajar Pakai Uang Kas Kelas untuk Kampanye', true, 'Judul berhuruf kapital dan bombastis untuk memancing emosi.'],
  ['penulis', 'Redaksi', true, 'Tidak ada nama penulis yang bisa dimintai tanggung jawab.'],
  ['tanggal', 'Rabu, 21 Oktober 2026', false, 'Tanggal terbit wajar dan tidak mencurigakan.'],
  ['foto', 'Keterangan: "Fajar membagikan jajan yang dibeli dengan uang kas kelas, Selasa (20/10) pukul 07.00 di kantin sekolah."', false, 'Keterangan foto perlu diverifikasi nanti; dari halaman ini saja belum terlihat salah.'],
  ['anonim', 'Seorang murid yang tidak mau disebut namanya mengatakan bahwa Fajar memakai uang kas kelas 11-3 untuk membeli jajan bagi calon pemilihnya. "Semua orang di kelas sudah tahu," katanya.', true, 'Satu-satunya sumber anonim yang tidak bisa diperiksa.'],
  ['konfirmasi', 'Hingga berita ini diturunkan, redaksi tidak menghubungi Fajar maupun panitia pemilihan.', true, 'Tidak ada konfirmasi dari pihak yang diberitakan.'],
  ['video', 'Dalam video yang beredar, Fajar bahkan berteriak "Pokoknya kas kelas dipakai!"', false, 'Video perlu diperiksa rekaman lengkapnya; itu langkah lateral.'],
  ['emosi', 'Sungguh memalukan! Apakah calon seperti ini pantas memimpin OSIS?', true, 'Kalimat emosional yang menghakimi, bukan melaporkan.'],
  ['bagikan', 'BAGIKAN SEBELUM DIHAPUS!', true, 'Ajakan mendesak supaya orang menyebarkan tanpa berpikir.'],
  ['tentang', 'Tentang kami: Wanasari Terkini adalah portal berita independen paling terpercaya di Wanasari sejak 2010.', false, 'Situs bisa menulis apa saja tentang dirinya sendiri; penilaian harus datang dari pihak lain.'],
];

export const TABS = [
  ['T1', 'Data pendaftaran domain', '🌐', 'wanasari-terkini.example: didaftarkan Minggu, 18 Oktober 2026. Nama pendaftar disembunyikan.', 'lemah', 'Situs baru didaftarkan 3 hari sebelum artikel terbit, bukan "sejak 2010", dan pemiliknya disembunyikan.'],
  ['T2', 'Pencarian nama situs', '🔎', '"Wanasari Terkini": hanya dua hasil, keduanya unggahan akun anonim yang membagikan artikel yang sama. Tidak ada media lain yang pernah mengutip situs ini.', 'lemah', 'Situs tidak punya rekam jejak dan tidak pernah dikutip media lain.'],
  ['T3', 'Profil calon di situs sekolah', '🏫', '"Fajar, ketua kelas 11-3, calon ketua OSIS nomor urut 2."', 'netral', 'Hanya membuktikan Fajar ketua kelas 11-3 dan calon ketua OSIS; tidak membuktikan atau membantah klaim.'],
  ['T4', 'Pengumuman Panitia Pemilihan OSIS', '📢', 'Rabu, 21 Oktober 2026 pukul 10.00: "Panitia telah memeriksa laporan dana kampanye kedua calon dan rekap kas kelas 11-3. Tidak ada uang kas kelas yang dipakai untuk kampanye. Laporan dana kampanye dapat dilihat di ruang OSIS."', 'lemah', 'Sumber resmi yang memeriksa langsung membantah klaim.'],
  ['T5', 'Rekap kas kelas 11-3 bulan Oktober', '📒', 'Saldo awal Rp480.000; menjenguk teman yang dirawat Rp150.000; fotokopi soal latihan Rp20.000; saldo akhir Rp310.000.', 'lemah', 'Tidak ada pengeluaran untuk jajan atau kampanye, dan hitungannya cocok: 480.000 − 150.000 − 20.000 = 310.000.'],
  ['T6', 'Akun penyebar pertama', '👤', '@infoosis_wanasari: dibuat Sabtu, 17 Oktober 2026, punya tiga unggahan yang semuanya menyerang Fajar, dan tidak mencantumkan pengelolanya.', 'lemah', 'Akun baru, anonim, dan hanya menyerang satu calon: ciri akun yang sengaja dibuat untuk menjatuhkan seseorang.'],
];
export const EXTRA = [
  ['G', 'Cari gambar terbalik', '🖼', 'Urut dari yang paling lama: foto yang sama paling awal muncul di situs resmi sekolah pada Juni 2025 dengan keterangan "Bakti sosial kelas 10-3: membagikan makanan ringan kepada anak-anak panti asuhan yang berkunjung ke sekolah."', 'lemah', 'Foto asli, tetapi dari kejadian lain: konteks keliru.'],
  ['V', 'Cari video lengkap', '🎬', 'Rekaman lengkap rapat kelas 11-3 (3 menit), diunggah sekretaris kelas di kanal kelas pada Jumat, 2 Oktober 2026.', 'lemah', 'Klip 12 detik dipotong dari rapat kelas tentang menjenguk teman sakit.'],
];
const RATE = [['lemah', 'Melemahkan'], ['dukung', 'Mendukung'], ['netral', 'Netral']];
const RATE_HINT = { T1: 'Bandingkan tanggal pendaftaran dengan "sejak 2010" dan tanggal artikel.', T2: 'Bila situs berita sungguhan, apakah media lain pernah mengutipnya?', T3: 'Apakah kartu ini membuktikan atau membantah pemakaian kas? Atau hanya identitas?', T4: 'Siapa yang menulis ini, dan apa yang mereka periksa?', T5: 'Adakah pengeluaran untuk jajan atau kampanye? Cocokkah hitungannya?', T6: 'Kapan akun dibuat, siapa pengelolanya, dan siapa yang diserangnya?', G: 'Kapan dan untuk acara apa foto itu pertama muncul?', V: 'Apa isi rapat yang sebenarnya?' };

export const CLUES = [['spanduk', 'Spanduk di belakang bertuliskan "…akti Sosial 2025", bukan kegiatan Oktober 2026.'], ['bayangan', 'Bayangannya pendek, kira-kira setengah tinggi badan: sekitar tengah hari. Pukul 07.00 bayangan kira-kira dua kali tinggi badan.'], ['kantin', 'Kantin beratap seng di latar sudah dibongkar pada Januari 2026 (kartu K).']];
export const CARD_K = 'Kartu K · Pengumuman sekolah, Januari 2026: kantin lama beratap seng dibongkar dan diganti gedung kantin baru berdinding kaca.';

export const FULL = [['FAJAR', 'Minggu lalu Dimas dirawat di puskesmas.', true], ['FAJAR', 'Jadi kesepakatannya begini: kalau ada teman kita yang sakit dan dirawat,', true], ['FAJAR', 'pokoknya kas kelas dipakai! Setuju?', false], ['MURID-MURID', 'Setujuuu!', false], ['FAJAR', 'Satu lagi. Aku memang mau mencalonkan diri jadi ketua OSIS,', true], ['FAJAR', 'tapi untuk kampanye aku tidak akan memakai kas kelas sepeser pun.', true]];
export const ROLES = [['1', 'Lembaga periksa fakta independen', 'S'], ['2', 'Media berita yang mengikuti kode etik jurnalistik', 'Q'], ['3', 'Platform media sosial', 'R'], ['4', 'Kanal aduan konten milik pemerintah', 'U'], ['5', 'Panitia pemilihan', 'T'], ['6', 'Pembaca seperti kamu', 'P']];
export const ROLE_TEXT = { P: 'Memeriksa sebelum membagikan dan melaporkan konten yang keliru', Q: 'Meminta konfirmasi kepada pihak yang diberitakan sebelum menerbitkan berita', R: 'Memberi label atau mengurangi penyebaran konten yang terbukti keliru', S: 'Meneliti klaim yang viral dan menerbitkan hasil pemeriksaan beserta buktinya', T: 'Memberi keterangan resmi tentang aturan dan fakta pemilihan', U: 'Menerima aduan tentang konten yang melanggar hukum' };
export const EVIDENCE = [['T4', 'Panitia sudah memeriksa: tidak ada kas kelas untuk kampanye (pengumuman panitia 21/10)', true], ['G', 'Foto berasal dari bakti sosial Juni 2025 (situs resmi sekolah)', true], ['V', 'Video dipotong dari rapat kelas 2/10 tentang menjenguk teman sakit (kanal kelas)', true], ['T3', 'Fajar ketua kelas 11-3 (profil calon)', false], ['X1', 'Banyak teman bilang artikelnya bohong (grup kelas)', false], ['X2', 'Fajar orangnya baik (pendapat pribadi)', false]];

// --- pieces ---
// A share button that is always there; pressing it before the check is done spreads the hoax.
function shareBar(ctx, state) {
  const out = el('span', { class: 'bl-sebar' });
  const b = onTap(el('button', { class: 'bl-bagikan', type: 'button' }, '📤 Bagikan'), () => {
    if (state.checked) { out.textContent = 'Pemeriksaan selesai: jangan teruskan tautannya; bagikan kartu cek fakta.'; return; }
    state.shared = (state.shared || 0) + 1; ctx.mistake(); shake(b); ctx.sound.bad();
    const n = 40 * 3 ** state.shared; out.textContent = `Terkirim ke grup lain: sekitar ${n.toLocaleString('id-ID')} orang ikut menerima hoaks. Berhenti dulu!`;
  });
  return el('div', { class: 'bl-bar' }, b, out);
}

function articleView({ tap = null, found = new Set() } = {}) {
  const part = (k, cls, tag = 'span') => { const p = ARTICLE.find((x) => x[0] === k); const n = el(tag, { class: `bl-a ${cls} ${found.has(k) ? (p[2] ? 'curiga' : 'aman') : ''}`, 'data-k': k }, p[1]); return tap ? onTap(n, () => tap(p)) : n; };
  return el('div', { class: 'bl-artikel' }, el('div', { class: 'bl-kepala' }, part('situs', 'situs'), part('url', 'url')),
    part('judul', 'judul', 'h3'), el('div', { class: 'bl-meta' }, part('penulis', ''), ' · ', part('tanggal', '')),
    el('div', { class: 'bl-foto-kecil' }, photo({ small: true }), part('foto', 'ket')),
    el('p', null, part('anonim', ''), ' ', part('konfirmasi', ''), ' ', part('video', ''), ' ', part('emosi', '')), part('bagikan', 'bagikan', 'p'), part('tentang', 'tentang', 'p'));
}

// The photo: an old canteen with a zinc roof, a 2025 banner and short noon shadows.
function photo({ small = false, onClue = null, found = new Set() } = {}) {
  const hot = (k, ...kids) => { const g = svg('g', { class: `bl-hot ${found.has(k) ? 'ketemu' : ''}`, 'data-k': k }, ...kids); if (onClue) g.addEventListener('pointerdown', (e) => { e.preventDefault(); onClue(k); }); return g; };
  const person = (x, h, c) => svg('g', null, svg('ellipse', { cx: x + 8, cy: 330, rx: h * 0.28, ry: 7, fill: '#00000055' }), svg('rect', { x: x - 12, y: 330 - h, width: 24, height: h * 0.62, rx: 8, fill: c }), svg('rect', { x: x - 10, y: 330 - h * 0.4, width: 8, height: h * 0.4, fill: '#334155' }), svg('rect', { x: x + 2, y: 330 - h * 0.4, width: 8, height: h * 0.4, fill: '#334155' }), svg('circle', { cx: x, cy: 330 - h - 14, r: 15, fill: '#a16207' }));
  const roof = Array.from({ length: 22 }, (_, i) => `${40 + i * 20},${i % 2 ? 70 : 82}`).join(' ');
  return svg('svg', { class: `bl-foto ${small ? 'kecil' : ''}`, viewBox: '0 0 520 360', role: 'img', 'aria-label': 'Foto di artikel' },
    svg('rect', { x: 0, y: 0, width: 520, height: 360, fill: '#bae6fd' }), svg('circle', { cx: 260, cy: 22, r: 18, fill: '#fde047' }),
    hot('kantin', svg('rect', { x: 40, y: 82, width: 430, height: 120, fill: '#d6d3d1', stroke: '#78716c' }), svg('polyline', { points: roof, fill: 'none', stroke: '#94a3b8', 'stroke-width': 10 }), svg('rect', { x: 70, y: 120, width: 70, height: 82, fill: '#a8a29e' }), svg('text', { x: 300, y: 112, 'font-size': 18, 'font-weight': 800, fill: '#57534e', 'text-anchor': 'middle' }, 'KANTIN')),
    hot('spanduk', svg('rect', { x: 170, y: 130, width: 270, height: 44, fill: '#dc2626', stroke: '#7f1d1d' }), svg('text', { x: 305, y: 160, 'font-size': 22, 'font-weight': 900, fill: '#fff', 'text-anchor': 'middle' }, '…akti Sosial 2025')),
    svg('rect', { x: 0, y: 300, width: 520, height: 60, fill: '#a3a3a3' }),
    svg('rect', { x: 210, y: 250, width: 120, height: 14, fill: '#92400e' }), svg('rect', { x: 220, y: 264, width: 8, height: 50, fill: '#92400e' }), svg('rect', { x: 312, y: 264, width: 8, height: 50, fill: '#92400e' }),
    ...[0, 1, 2, 3].map((i) => svg('rect', { x: 222 + i * 26, y: 238, width: 18, height: 12, fill: ['#f97316', '#22c55e', '#eab308', '#ec4899'][i] })),
    hot('bayangan', person(170, 120, '#2563eb'), person(370, 90, '#16a34a'), person(420, 84, '#db2777')));
}
function shadowSim(time) {
  const len = { 7: 2, 9: 1, 12: 0.5, 15: 1 }[time] ?? 1; const h = 44;
  const sx = 18 + ((time - 6) / 12) * 264; const sy = 14 + (Math.abs(time - 12) / 5) * 66; const dir = time < 12 ? 1 : -1;
  return svg('svg', { class: 'bl-bayang', viewBox: '0 0 300 120' }, svg('rect', { x: 0, y: 0, width: 300, height: 120, fill: time <= 7 ? '#fed7aa' : '#bae6fd' }), svg('circle', { cx: sx, cy: sy, r: 10, fill: '#facc15' }),
    svg('rect', { x: 0, y: 100, width: 300, height: 20, fill: '#a3a3a3' }), svg('ellipse', { cx: 150 + (dir * h * len) / 2, cy: 101, rx: (h * len) / 2, ry: 4, fill: '#00000066' }), svg('rect', { x: 144, y: 100 - h, width: 12, height: h, rx: 5, fill: '#2563eb' }), svg('circle', { cx: 150, cy: 100 - h - 7, r: 7, fill: '#a16207' }),
    svg('text', { x: 290, y: 116, 'font-size': 13, 'font-weight': 800, 'text-anchor': 'end', fill: '#0f172a' }, `pukul ${String(time).padStart(2, '0')}.00`));
}

function tabCard([id, name, icon, text], rated) {
  return el('div', { class: `bl-tab ${rated ? `dinilai ${rated}` : ''}` }, el('div', { class: 'bl-tab-kepala' }, el('b', null, `${icon} ${id}`), el('span', null, name)), el('p', null, text));
}

// Simulated browser: open a tab from the search menu, then rate it.
function browserRound(wrap, ctx, { sources, title, done, state }) {
  const rated = {}; let open = null;
  const msg = el('p', { class: 'reveal info' }, 'Buka tab baru, lalu nilai: apakah isinya melemahkan artikel, mendukung, atau netral?');
  const host = el('div', { class: 'bl-peramban' });
  const draw = () => host.replaceChildren(
    el('div', { class: 'bl-tabbar' }, el('span', { class: 'bl-tabk aktif-kecil' }, '📰 Artikel'), ...Object.keys(rated).map((id) => el('span', { class: `bl-tabk ${rated[id]}` }, id)), open && !rated[open[0]] ? el('span', { class: 'bl-tabk aktif' }, open[0]) : null),
    el('div', { class: 'bl-isi' }, el('div', { class: 'bl-menu' }, el('b', null, '＋ Buka tab baru'), ...sources.map((s) => onTap(el('button', { class: `seg-btn ${s[0] in rated ? 'on' : ''}`, type: 'button' }, `${s[2]} ${s[1]}`), () => { open = s; ctx.sound.tap(); draw(); }))),
      open ? el('div', { class: 'bl-buka' }, tabCard(open, rated[open[0]]), open[0] in rated ? el('p', { class: 'bl-alasan' }, open[5]) : el('div', { class: 'seg' }, RATE.map(([v, l]) => onTap(el('button', { class: 'seg-btn besar', type: 'button' }, l), () => {
        if (v !== open[4]) { ctx.mistake(); shake(host); say(msg, 'bad', RATE_HINT[open[0]]); return; }
        rated[open[0]] = v; ctx.sound.good(); say(msg, '', open[5]); draw();
        if (Object.keys(rated).length === sources.length) { state.checked = true; setTimeout(done, 1800); }
      })))) : el('div', { class: 'bl-buka kosong' }, 'Pilih sumber di menu untuk membuka tab.')));
  draw();
  wrap.append(el('p', { class: 'prompt' }, title), shareBar(ctx, state), host, msg);
}

function photoRound(wrap, ctx, { done, state }) {
  const found = new Set(); let gOpen = false; let time = 12;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tiga petunjuk di foto yang membantah keterangan "Selasa (20/10) pukul 07.00 di kantin sekolah", lalu cari gambar terbalik.');
  const host = el('div', { class: 'bl-dua' });
  const check = () => { if (found.size === 3 && gOpen) { state.checked = true; say(msg, '', 'Empat petunjuk: spanduk 2025, bayangan siang, kantin lama, dan foto Juni 2025.'); setTimeout(done, 2000); } };
  const draw = () => host.replaceChildren(el('div', { class: 'bl-foto-wadah' }, photo({ found, onClue: (k) => { if (found.has(k)) return; found.add(k); ctx.sound.good(); say(msg, '', CLUES.find((c) => c[0] === k)[1]); draw(); check(); } }), el('small', null, 'Keterangan artikel: "Fajar membagikan jajan…, Selasa (20/10) pukul 07.00 di kantin sekolah."')),
    el('div', { class: 'bl-kanan' }, el('div', { class: 'bl-temuan' }, CLUES.map(([k, t]) => el('div', { class: found.has(k) ? 'ya' : '' }, found.has(k) ? `✓ ${t}` : '…')), found.has('kantin') ? el('div', { class: 'kartu' }, CARD_K) : null),
      el('div', { class: 'seg' }, [7, 12].map((t) => onTap(el('button', { class: `seg-btn ${time === t ? 'on' : ''}`, type: 'button' }, `Bayangan pukul ${t === 7 ? '07.00' : '12.00'}`), () => { time = t; draw(); }))), shadowSim(time),
      gOpen ? tabCard(EXTRA[0], 'lemah') : onTap(el('button', { class: 'btn primary', type: 'button' }, '🖼 Cari gambar terbalik (urut paling lama)'), () => { gOpen = true; ctx.sound.tap(); draw(); check(); })));
  draw();
  host.addEventListener('pointerdown', (e) => { if (e.target.closest('svg.bl-foto') && !e.target.closest('.bl-hot')) { ctx.mistake(); say(msg, 'bad', 'Bagian itu tidak membantah keterangannya. Perhatikan tulisan, bayangan, dan bangunan.'); } });
  wrap.append(el('p', { class: 'prompt' }, 'Verifikasi foto'), shareBar(ctx, state), host, msg);
}

function videoRound(wrap, ctx, { done, state }) {
  const marked = new Set();
  const need = FULL.map((f, i) => (f[2] ? i : -1)).filter((i) => i >= 0);
  const msg = el('p', { class: 'reveal info' }, 'Ketuk setiap bagian rekaman lengkap yang tidak ada di klip.');
  const host = el('div', { class: 'bl-dua' });
  const draw = () => host.replaceChildren(el('div', { class: 'bl-transkrip klip' }, el('b', null, '📱 Klip yang beredar (12 detik)'), el('p', null, el('i', null, 'FAJAR: '), '"…pokoknya kas kelas dipakai! Setuju?"'), el('p', null, el('i', null, 'MURID-MURID: '), '"Setujuuu!"')),
    el('div', { class: 'bl-transkrip' }, el('b', null, '🎬 Rekaman lengkap rapat kelas 11-3 · 2 Oktober 2026 · menit 00.30–01.10'), FULL.map(([who, t, cut], i) => onTap(el('p', { class: `bl-baris ${marked.has(i) ? 'potong' : ''}` }, el('i', null, `${who}: `), t), () => {
      if (marked.has(i)) return;
      if (!cut) { ctx.mistake(); say(msg, 'bad', 'Bagian ini ada di klip.'); return; }
      marked.add(i); ctx.sound.tap(); draw();
      if (need.every((n) => marked.has(n))) { state.checked = true; say(msg, '', 'Yang dipotong: alasan kas dipakai (teman sakit) dan janji tidak memakai kas untuk kampanye.'); setTimeout(done, 2000); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Verifikasi video: bagian mana yang dipotong?'), shareBar(ctx, state), host, msg);
}

function matchRound(wrap, ctx, { done }) {
  const got = {}; let sel = null;
  const msg = el('p', { class: 'reveal info' }, 'Ketuk satu pihak, lalu ketuk perannya.');
  const host = el('div', { class: 'bl-pasang' });
  const letters = ctx.rand.shuffle(Object.keys(ROLE_TEXT));
  const draw = () => host.replaceChildren(el('div', { class: 'bl-kol' }, ROLES.map(([n, t, a]) => onTap(el('button', { class: `bl-item ${sel === n ? 'pilih' : ''} ${n in got ? 'beres' : ''}`, type: 'button' }, el('b', null, n), t, n in got ? el('em', null, ` → ${a}`) : null), () => { if (!(n in got)) { sel = n; draw(); } }))),
    el('div', { class: 'bl-kol' }, letters.map((L) => onTap(el('button', { class: `bl-item ${Object.values(got).includes(L) ? 'beres' : ''}`, type: 'button' }, el('b', null, L), ROLE_TEXT[L]), () => {
      if (!sel || Object.values(got).includes(L)) return;
      const want = ROLES.find((r) => r[0] === sel)[2];
      if (L !== want) { ctx.mistake(); shake(host); say(msg, 'bad', 'Belum cocok. Siapa yang paling tepat melakukan peran itu?'); return; }
      got[sel] = L; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(got).length === ROLES.length) { say(msg, '', 'Memeriksa fakta adalah kerja bersama, dan pembaca adalah pertahanan terakhir.'); done(); }
    }))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Ekosistem periksa fakta: pasangkan pihak dan perannya.'), host, msg);
}

function factCardRound(wrap, ctx, { done }) {
  let status = null; const picked = new Set();
  const msg = el('p', { class: 'reveal info' }, 'Pilih status klaim dan tepat tiga bukti yang kuat beserta sumbernya.');
  const host = el('div', { class: 'bl-dua' });
  const draw = () => host.replaceChildren(el('div', { class: 'bl-kanan' }, el('b', null, 'Status klaim'), el('div', { class: 'seg' }, [['keliru', 'KELIRU'], ['konteks', 'KONTEKS KELIRU'], ['benar', 'BENAR']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${status === v ? 'on' : ''}`, type: 'button' }, l), () => { status = v; draw(); }))),
    el('b', null, 'Bukti (pilih tiga)'), el('div', { class: 'bl-bukti' }, EVIDENCE.map(([k, t]) => onTap(el('button', { class: `bl-item ${picked.has(k) ? 'pilih' : ''}`, type: 'button' }, t), () => { if (picked.has(k)) picked.delete(k); else if (picked.size < 3) picked.add(k); draw(); })))),
  el('div', { class: 'bl-kartu-cek' }, el('b', null, '✅ CEK FAKTA'), el('p', null, 'Klaim: Fajar memakai kas kelas untuk kampanye.'), el('p', null, `Status: ${status === 'keliru' ? 'KELIRU' : status === 'konteks' ? 'KONTEKS KELIRU' : status === 'benar' ? 'BENAR' : '…'}`), el('ol', null, [...picked].map((k) => el('li', null, EVIDENCE.find((e) => e[0] === k)[1]))), el('p', null, 'Jangan teruskan tautannya.'),
    button('Kirim kartu ke grup', () => {
      if (status !== 'keliru') { ctx.mistake(); say(msg, 'bad', status === 'konteks' ? 'Fotonya memang konteks keliru, tetapi klaim utamanya (kas dipakai untuk kampanye) dibantah panitia: keliru.' : 'Klaim itu dibantah panitia dan bukti lain.'); return; }
      const bad = [...picked].filter((k) => !EVIDENCE.find((e) => e[0] === k)[2]);
      if (picked.size < 3 || bad.length) { ctx.mistake(); say(msg, 'bad', bad.length ? 'Pendapat atau kartu identitas bukan bukti yang membantah klaim.' : 'Pilih tiga bukti.'); return; }
      ctx.sound.good(); say(msg, '', 'Kartu cek fakta singkat, berbukti, dan bersumber.'); done();
    }, 'primary')));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tantangan: kartu cek fakta untuk grup kelas'), host, msg);
}

// ---------- Tahan Hoaks Sebelum Pemilihan: the ten missions ----------
export const RESULTS = [['r1', 'Juni 2025', 'Situs resmi SMA Wanasari', '"Bakti sosial kelas 10-3: membagikan makanan ringan kepada anak-anak panti asuhan."'], ['r2', 'Juli 2025', 'Blog alumni (unggah ulang)', '"Kenangan bakti sosial tahun ini 💛"'], ['r3', '21 Okt 2026 · 06.30', 'wanasari-terkini.example', '"Fajar membagikan jajan yang dibeli dengan uang kas kelas…"'], ['r4', '21 Okt 2026 · 07.15', '@infoosis_wanasari', '"Lihat kelakuan calon ketua OSIS ini! Bagikan!"']];
export const KINDS = [['konteks', '📎 Foto asli, konteks keliru', true, 'Fotonya asli dari bakti sosial Juni 2025, lalu dipakai dengan keterangan baru yang salah.'], ['sunting', '✂️ Hasil suntingan', false, 'Foto yang sama sudah ada sejak Juni 2025 dengan isi yang sama; tidak ada yang disunting, hanya keterangannya yang diganti.'], ['ka', '🤖 Buatan KA', false, 'Foto ini sudah terbit di situs sekolah pada Juni 2025 dengan kejadian nyata, jadi bukan gambar buatan.']];
export const PROFILE = [['nama', '@infoosis_wanasari', false, 'Nama akun bisa dibuat siapa saja; nama saja belum membuktikan apa pun.'], ['bio', 'Info terpercaya seputar OSIS Wanasari ✅', false, 'Akun bisa menulis apa saja tentang dirinya, termasuk tanda centang di bio. Ini bukan bukti, tetapi juga bukan tanda bahaya yang kuat.'], ['dibuat', '📅 Bergabung Sabtu, 17 Oktober 2026', true, 'Akun baru dibuat beberapa hari sebelum pemilihan.'], ['pengelola', '👤 Pengelola: tidak dicantumkan', true, 'Tidak ada orang yang bisa dimintai tanggung jawab.'], ['u1', '"TERBONGKAR! Calon nomor 2 pakai kas kelas!" (tautan)', true, 'Unggahan ini menyerang Fajar.'], ['u2', '"Calon nomor 2 cuma pencitraan, jangan dipilih!"', true, 'Unggahan ini juga menyerang Fajar.'], ['u3', '"Masih mau pilih calon nomor 2? Mikir!"', true, 'Ketiga unggahannya menyerang satu calon yang sama.']];
export const CHAT1 = [['a', 'Kuteruskan ke grup lain: "Benar nggak sih ini?"', false, 'Tautannya tetap sampai ke lebih banyak orang, dan banyak yang hanya membaca judulnya. +100 penerima.'], ['b', '(Diam saja, tidak membalas apa pun.)', false, 'Hoaks tetap beredar di grup ini tanpa ada yang meluruskan.'], ['c', 'Teman-teman, artikel itu keliru: fotonya bakti sosial Juni 2025, videonya dipotong dari rapat kelas, dan panitia sudah mengumumkan tidak ada kas kelas untuk kampanye. Yuk jangan diteruskan, aku lapor ke panitia ya.', true, 'Sopan, berbukti, bersumber, mengajak berhenti, dan melapor.'], ['d', 'Pembuat artikel ini pasti anak kelas sebelah, dasar pengecut!', false, 'Menuduh dan menghina tanpa bukti justru menambah masalah baru.']];
export const CHAT2 = [['e', 'Iya, teruskan saja supaya adil, biar mereka menilai sendiri.', false, 'Banyak orang hanya membaca judulnya, jadi hoaksnya tetap menyebar. +100 penerima.'], ['f', 'Jangan diteruskan, Ran. Kalau mau, kirim kartu cek faktanya saja ke grup alumni.', true, 'Yang dibagikan bukti dan sumbernya, bukan tautan hoaksnya.']];
export const STATUS = [['KELIRU', true, ''], ['KONTEKS KELIRU', false, 'Fotonya memang konteks keliru, tetapi klaim utamanya (kas dipakai untuk kampanye) dibantah panitia: KELIRU.'], ['BENAR', false, 'Klaim itu dibantah panitia, rekap kas, foto asli, dan rekaman lengkap.']];
export const CALLS = [['ajak', 'Jangan teruskan tautannya; bagikan kartu ini.', true, ''], ['malu', 'Sebarkan ke semua grup supaya pembuatnya malu!', false, 'Kartu cek fakta meluruskan informasi, bukan mempermalukan orang.']];
export const CLAIM = 'Fajar memakai kas kelas untuk kampanye.';
export const words = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const HEAD28 = {
  vertikal: ['Baca Vertikal', 'Ketuk enam tanda mencurigakan di halaman artikel, lalu nilai "Tentang kami".'],
  tab1: ['Buka Tab', 'Buka tab baru dan taruh setiap temuan di timbangan: melemahkan, netral, atau mendukung.'],
  tab2: ['Buka Tab Lagi', 'Timbang tiga tab berikutnya, lalu cap artikelnya.'],
  foto: ['Selidiki Foto', 'Temukan tiga petunjuk di foto yang membantah keterangan "Selasa pukul 07.00 di kantin".'],
  balik: ['Cari Gambar Terbalik', 'Urutkan hasil pencarian dari yang paling lama, lalu tentukan jenis fotonya.'],
  video: ['Video Terpotong', 'Tandai bagian rekaman lengkap yang dibuang dari klip, lalu cari tab yang sejalan.'],
  ekosistem: ['Ekosistem Periksa Fakta', 'Seret setiap pihak ke perannya dalam melawan hoaks.'],
  grup: ['Tahan Sebaran di Grup', 'Pilih balasan yang menahan hoaks di grup kelas.'],
  akun: ['Akun Penyebar', 'Ketuk tanda bahaya di profil akun penyebar pertama, lalu ambil tindakan.'],
  bos: ['Kartu Cek Fakta', 'Rakit kartu cek fakta paling banyak 60 kata untuk menghentikan meteran.'],
};
const msg28 = (t) => el('p', { class: 'reveal info' }, t);

// The spread meter: +100 receivers every 20 seconds until the mission is done; sharing early adds 300.
function spreadMeter(ctx, start) {
  let n = start; let stopped = false;
  const num = el('b'); const bar = el('i'); const note = el('small', null, '+100 setiap 20 detik sampai hoaks ditahan');
  const node = el('div', { class: 'bl28-meteran' });
  const draw = () => { num.textContent = `${n.toLocaleString('id-ID')} penerima`; bar.style.width = `${Math.min(100, n / 30)}%`; };
  const share = onTap(el('button', { class: 'bl28-bagikan', type: 'button' }, '📤 Bagikan'), () => {
    if (stopped) { note.textContent = 'Yang dibagikan kartu cek fakta, bukan tautannya.'; return; }
    n += 300; ctx.mistake(); ctx.sound.bad(); shake(node); note.textContent = 'Kamu ikut menyebarkan sebelum memeriksa: +300 penerima!'; draw();
  });
  fill(node, el('span', null, '📈 Hoaks sampai ke'), num, el('span', { class: 'bl28-meter-batang' }, bar), note, share);
  draw();
  const iv = setInterval(() => { if (!node.isConnected) { clearInterval(iv); return; } if (!stopped) { n += 100; draw(); } }, 20000);
  return { node, bump(k) { if (!stopped) { n += k; draw(); } }, stop() { if (stopped) return; stopped = true; clearInterval(iv); node.classList.add('henti'); note.textContent = `🛑 Ditahan di ${n.toLocaleString('id-ID')} penerima`; }, get n() { return n; } };
}

// Misi 1: vertical reading.
function verticalRound(area, ctx, { meter, done }) {
  const need = ARTICLE.filter((a) => a[2]).length; const found = new Set();
  const msg = msg28(`Ketuk tanda yang mencurigakan di halaman ini (ada ${need}). Jangan tekan Bagikan sebelum selesai memeriksa!`);
  const host = el('div', { class: 'bl28-halaman' }); const pin = el('div', { class: 'bl28-yt' });
  let stage = 1;
  const draw = () => fill(host, articleView({ found, tap: (p) => {
    if (stage !== 1 || found.has(p[0])) return;
    if (p[0] === 'tentang') { say(msg, 'info', 'Bagian "Tentang kami" dinilai terakhir. Cari tanda lain dulu.'); return; }
    if (!p[2]) { ctx.mistake(); found.add(p[0]); say(msg, 'bad', p[3]); draw(); return; }
    found.add(p[0]); ctx.sound.tap(); say(msg, '', p[3]); draw();
    if (ARTICLE.filter((a) => a[2]).every((a) => found.has(a[0]))) { stage = 2; setTimeout(about, 1400); }
  } }));
  function about() {
    host.querySelector('.bl-a.tentang')?.classList.add('sorot');
    say(msg, 'info', 'Situs menulis tentang dirinya sendiri: "paling terpercaya sejak 2010". Tempel sebagai bukti?');
    fill(pin, onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': 'tempel' }, '📌 Tempel sebagai bukti'), () => { if (stage !== 2) return; ctx.mistake(); say(msg, 'bad', 'Situs bisa menulis apa saja tentang dirinya. Penilaian harus datang dari pihak lain.'); }),
      onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': 'lateral' }, '🗂️ Bukan bukti: cek lewat tab lain'), () => { if (stage !== 2) return; stage = 3; ctx.sound.tap(); meter.stop(); say(msg, '', 'Tepat. Untuk menilai situs, tinggalkan halaman dan baca lateral.'); done(); }));
  }
  draw();
  area.append(host, pin, msg);
}

// Misi 2: open tabs and weigh each finding on a balance.
function balanceRound(area, ctx, { meter, ids, pre = [], verdict = false, done }) {
  const sources = TABS.filter((t) => ids.includes(t[0]));
  const placed = Object.fromEntries(pre.map((id) => [id, TABS.find((t) => t[0] === id)[4]]));
  const msg = msg28('Buka tab dari menu. Seret kartu yang terbuka ke piringan timbangan, atau ketuk kartu lalu ketuk piringannya.');
  const menu = el('div', { class: 'bl28-menu' }); const open = el('div', { class: 'bl28-tabbuka' });
  const beam = el('div', { class: 'bl28-balok' });
  const pans = [['lemah', '⬇ Melemahkan'], ['netral', '⚖ Netral'], ['dukung', '⬆ Mendukung']].map(([k, l]) => el('div', { class: `bl28-piring p-${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'bl28-piring-isi' })));
  const tilt = () => { const v = Object.values(placed); const d = v.filter((x) => x === 'dukung').length - v.filter((x) => x === 'lemah').length; beam.style.setProperty('--miring', `${Math.max(-8, Math.min(8, d * 1.6))}deg`); pans.forEach((p) => fill(p.querySelector('.bl28-piring-isi'), Object.entries(placed).filter(([, x]) => x === p.dataset.drop).map(([id]) => el('span', { class: 'bl28-chip' }, id)))); };
  const drawMenu = () => fill(menu, el('b', null, '＋ Tab baru'), sources.map((s) => onTap(el('button', { class: `bl28-sumber ${s[0] in placed ? 'beres' : ''}`, type: 'button', 'data-t': s[0] }, `${s[2]} ${s[0]} · ${s[1]}`), () => {
    if (s[0] in placed) return; ctx.sound.tap(); menu.querySelectorAll('.bl28-sumber').forEach((b) => b.classList.toggle('on', b.dataset.t === s[0]));
    fill(open, el('div', { class: 'bl28-tab', 'data-drag': s[0] }, el('b', null, `${s[2]} ${s[0]} · ${s[1]}`), el('span', null, s[3])));
  })));
  const scale = el('div', { class: 'bl28-timbangan' }, beam, el('div', { class: 'bl28-piring-piring' }, pans));
  const board = el('div', { class: 'bl28-dua' }, el('div', { class: 'bl28-peramban' }, menu, open), scale);
  let over = false;
  dnd(board, (card, pan) => {
    if (over) return;
    const s = TABS.find((t) => t[0] === card.dataset.drag);
    if (pan.dataset.drop !== s[4]) { ctx.mistake(); shake(card); say(msg, 'bad', RATE_HINT[s[0]]); return; }
    placed[s[0]] = s[4]; open.replaceChildren(); ctx.sound.tap(); tilt(); drawMenu(); say(msg, '', s[5]);
    if (!sources.every((x) => x[0] in placed)) return;
    if (!verdict) { over = true; meter.stop(); setTimeout(() => say(msg, '', 'Tiga tab, tiga temuan. Timbangan mulai miring ke "melemahkan".'), 1600); done(); return; }
    over = true; setTimeout(stamp, 1500);
  });
  function stamp() {
    say(msg, 'info', 'Timbangan miring jauh ke "melemahkan". Cap artikelnya.');
    const row = el('div', { class: 'bl28-yt' }, [['percaya', '✅ Dapat dipercaya', 'Lima tab melemahkan dan tidak satu pun mendukung.'], ['separuh', '❓ Separuh benar', 'Tidak ada satu tab pun yang mendukung klaimnya.'], ['tidak', '⛔ Tidak dapat dipercaya', '']].map(([k, l, why]) => onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': k }, l), (e) => {
      if (row.classList.contains('beres')) return;
      if (why) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', why); return; }
      row.classList.add('beres'); e.currentTarget.classList.add('on'); ctx.sound.tap(); meter.stop();
      say(msg, '', 'Situs baru dan anonim, tanpa rekam jejak, akun penyebarnya dibuat untuk menyerang, dan klaimnya dibantah panitia serta rekap kas.'); done();
    })));
    area.insertBefore(row, msg);
  }
  drawMenu(); tilt();
  area.append(board, msg);
}

// Misi 3: three clues in the photo; the shadow clue needs the sun clock.
function photoClueRound(area, ctx, { meter, done }) {
  const found = new Set(); let time = 7; let over = false;
  const msg = msg28('Keterangan artikel: "Selasa (20/10) pukul 07.00 di kantin sekolah." Ketuk bagian foto yang membantahnya.');
  const photoBox = el('div', { class: 'bl28-foto' }); const side = el('div', { class: 'bl28-kanan' });
  const clueList = el('div', { class: 'bl-temuan' });
  const add = (k) => { found.add(k); ctx.sound.tap(); say(msg, '', CLUES.find((c) => c[0] === k)[1]); drawPhoto(); drawList(); if (found.size === 3 && !over) { over = true; meter.stop(); done(); } };
  const drawList = () => fill(clueList, CLUES.map(([k, t]) => el('div', { class: found.has(k) ? 'ya' : '' }, found.has(k) ? `✓ ${t}` : '🔍 …')));
  const drawPhoto = () => fill(photoBox, photo({ found, onClue: (k) => {
    if (found.has(k) || over) return;
    if (k === 'spanduk') add(k);
    else if (k === 'bayangan') sunClock();
    else kantin();
  } }));
  function sunClock() {
    say(msg, 'info', 'Bayangan di foto pendek, kira-kira setengah tinggi badan. Putar jam matahari: pukul berapa bayangannya sepanjang itu?');
    const sim = el('div', { class: 'bl28-sim' });
    const draw = () => { fill(sim, shadowSim(time)); jam.querySelectorAll('.bl28-jam').forEach((b) => b.classList.toggle('on', +b.dataset.t === time)); };
    const jam = el('div', { class: 'bl28-yt' }, [7, 9, 12, 15].map((t) => onTap(el('button', { class: 'bl28-jam', type: 'button', 'data-t': t }, `${String(t).padStart(2, '0')}.00`), () => { time = t; ctx.sound.tap(); draw(); })));
    const pinBtn = button('📌 Cocok dengan foto', () => {
      if (found.has('bayangan')) return;
      if (time !== 12) { ctx.mistake(); shake(sim); say(msg, 'bad', `Bayangan pukul ${String(time).padStart(2, '0')}.00 ${time === 7 ? 'kira-kira dua kali tinggi badan' : 'kira-kira sama dengan tinggi badan'}, lebih panjang dari bayangan di foto.`); return; }
      panel.remove(); add('bayangan');
    }, 'primary');
    const panel = el('div', { class: 'bl28-panel' }, el('b', null, '☀️ Jam matahari'), jam, sim, pinBtn);
    side.querySelector('.bl28-panel')?.remove(); side.append(panel); draw();
  }
  function kantin() {
    say(msg, 'info', 'Kantin di foto beratap seng. Masih seperti ini kantin sekolah sekarang? Ambil kartu K di meja guru.');
    side.querySelector('.bl28-panel')?.remove();
    const panel = el('div', { class: 'bl28-panel' }, onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': 'kartuK' }, '🗂️ Ambil kartu K'), () => { panel.replaceChildren(el('div', { class: 'bl28-kartuk' }, CARD_K)); add('kantin'); }));
    side.append(panel);
  }
  photoBox.addEventListener('pointerdown', (e) => { if (!over && e.target.closest('svg.bl-foto') && !e.target.closest('.bl-hot')) { ctx.mistake(); say(msg, 'bad', 'Bagian itu tidak membantah keterangannya. Perhatikan tulisan, bayangan, dan bangunan.'); } });
  drawPhoto(); drawList(); side.append(clueList);
  area.append(el('div', { class: 'bl28-dua' }, photoBox, side), msg);
}

// Misi 3: reverse image search, oldest first.
function reverseRound(area, ctx, { meter, done }) {
  const msg = msg28('Hasil pencarian gambar terbalik datang acak. Seret setiap hasil ke garis waktu, dari yang paling lama.');
  const slots = RESULTS.map((r, i) => el('div', { class: 'bl28-slot', 'data-drop': i }, el('small', null, i === 0 ? '⏮ paling lama' : i === RESULTS.length - 1 ? 'paling baru ⏭' : `${i + 1}`)));
  const tray = el('div', { class: 'bl28-baki' }, ctx.rand.shuffle(RESULTS.map((r) => r[0])).map((id) => { const r = RESULTS.find((x) => x[0] === id); return el('div', { class: 'bl28-hasil', 'data-drag': id }, el('b', null, r[1]), el('span', null, r[2]), el('small', null, r[3])); }));
  let left = RESULTS.length;
  const board = el('div', { class: 'bl28-papan' }, el('div', { class: 'bl28-garis' }, slots), tray);
  dnd(board, (card, slot) => {
    if (!left || slot.classList.contains('isi')) return;
    const i = RESULTS.findIndex((r) => r[0] === card.dataset.drag);
    if (+slot.dataset.drop !== i) { ctx.mistake(); shake(card); say(msg, 'bad', 'Belum urut. Bandingkan tanggalnya: tahun dulu, lalu bulan, lalu jam.'); return; }
    card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    say(msg, 'info', 'Kemunculan pertama: situs resmi sekolah, Juni 2025. Foto ini termasuk jenis apa?');
    const row = el('div', { class: 'bl28-yt' }, KINDS.map(([k, l, ok, why]) => onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': k }, l), (e) => {
      if (row.classList.contains('beres')) return;
      if (!ok) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', why); return; }
      row.classList.add('beres'); e.currentTarget.classList.add('on'); ctx.sound.tap(); meter.stop(); say(msg, '', `${why} Itulah sebabnya hasil diurutkan dari yang paling lama: yang dicari kemunculan pertama.`); done();
    })));
    area.insertBefore(row, msg);
  });
  area.append(board, msg);
}

// Misi 4: mark what the clip cut out, then link to the matching tab.
function cutRound(area, ctx, { meter, done }) {
  const marked = new Set(); const need = FULL.map((f, i) => (f[2] ? i : -1)).filter((i) => i >= 0); let stage = 1;
  const msg = msg28('Ketuk setiap baris rekaman lengkap yang tidak ada di klip.');
  const full = el('div', { class: 'bl-transkrip' }, el('b', null, '🎬 Rekaman lengkap rapat kelas 11-3 · 2 Oktober 2026'), FULL.map(([who, t, cut], i) => { const p = el('p', { class: 'bl-baris', 'data-i': i }, el('i', null, `${who}: `), t); return onTap(p, () => {
    if (stage !== 1 || marked.has(i)) return;
    if (!cut) { ctx.mistake(); shake(p); say(msg, 'bad', 'Bagian ini ada di klip.'); return; }
    marked.add(i); p.classList.add('potong'); ctx.sound.tap();
    if (need.every((n) => marked.has(n))) { stage = 2; say(msg, '', 'Yang dibuang: alasan kas dipakai (menjenguk teman yang dirawat) dan janji tidak memakai kas untuk kampanye.'); setTimeout(link, 1600); }
  }); }));
  const clip = el('div', { class: 'bl-transkrip klip' }, el('b', null, '📱 Klip yang beredar (12 detik)'), el('p', null, el('i', null, 'FAJAR: '), '"…pokoknya kas kelas dipakai! Setuju?"'), el('p', null, el('i', null, 'MURID-MURID: '), '"Setujuuu!"'));
  const side = el('div', { class: 'bl28-kanan' }, clip);
  function link() {
    say(msg, 'info', 'Tab mana yang sejalan dengan rekaman lengkap ini? Ketuk tab itu.');
    fill(side, el('b', null, '🗂️ Tab dari Misi 2'), el('div', { class: 'bl28-tab-tab' }, TABS.map(([id, n, ic]) => onTap(el('button', { class: 'bl28-sumber', type: 'button', 'data-t': id }, `${ic} ${id} · ${n}`), (e) => {
      if (stage !== 2) return;
      if (id !== 'T5') { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', 'Cari tab yang mencatat ke mana uang kas dipakai.'); return; }
      stage = 3; e.currentTarget.classList.add('on'); ctx.sound.tap(); meter.stop(); say(msg, '', 'T5: kas dipakai Rp150.000 untuk menjenguk teman yang dirawat, sejalan dengan rapat kelas. Klip yang dipotong membalik arti ucapan Fajar.'); done();
    }))));
  }
  area.append(el('div', { class: 'bl28-dua' }, full, side), msg);
}

// Misi 5: who does what against hoaxes.
function ecoRound(area, ctx, { meter, done }) {
  const msg = msg28('Seret setiap pihak ke perannya, atau ketuk pihak lalu ketuk perannya.');
  const roles = ctx.rand.shuffle(Object.keys(ROLE_TEXT)).map((L) => el('div', { class: 'bl28-peran', 'data-drop': L }, el('span', null, ROLE_TEXT[L]), el('div', { class: 'bl28-peran-isi' })));
  const tray = el('div', { class: 'bl28-baki' }, ctx.rand.shuffle(ROLES.map((r) => r[0])).map((n) => el('div', { class: 'bl28-pihak', 'data-drag': n }, ROLES.find((r) => r[0] === n)[1])));
  let left = ROLES.length;
  const board = el('div', { class: 'bl28-papan' }, el('div', { class: 'bl28-peran-peran' }, roles), tray);
  dnd(board, (card, box) => {
    if (!left || box.classList.contains('isi')) return;
    const want = ROLES.find((r) => r[0] === card.dataset.drag)[2];
    if (box.dataset.drop !== want) { ctx.mistake(); shake(card); say(msg, 'bad', 'Belum cocok. Siapa yang paling tepat melakukan peran itu?'); return; }
    card.classList.add('locked'); box.querySelector('.bl28-peran-isi').append(card); box.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    meter.stop(); say(msg, '', 'Melawan hoaks adalah kerja bersama, dan pembaca adalah pertahanan terakhir sebelum tombol Bagikan.'); done();
  });
  area.append(board, msg);
}

// Misi 6: the class group chat.
function chatRound(area, ctx, { meter, done }) {
  const msg = msg28('Grup kelas ramai. Ketuk balasan yang akan kamu kirim.');
  const log = el('div', { class: 'bl28-obrolan', 'aria-live': 'polite' }, el('div', { class: 'bl28-gelembung' }, el('b', null, 'Rani'), '🔗 wanasari-terkini.example · TERBONGKAR! Calon Ketua OSIS Fajar Pakai Uang Kas Kelas untuk Kampanye'), el('div', { class: 'bl28-gelembung' }, el('b', null, 'Bima'), 'Wah parah 😡'));
  const replies = el('div', { class: 'bl28-balasan' });
  const offer = (opts, after) => fill(replies, opts.map(([k, t, ok, why]) => onTap(el('button', { class: 'bl28-pilihan', type: 'button', 'data-k': k }, t), (e) => {
    if (replies.dataset.kunci) return;
    if (!ok) { ctx.mistake(); shake(e.currentTarget); if (why.includes('+100')) meter.bump(100); say(msg, 'bad', why); return; }
    replies.dataset.kunci = '1'; ctx.sound.tap(); log.append(el('div', { class: 'bl28-gelembung saya' }, el('b', null, 'Kamu'), t)); log.scrollTop = log.scrollHeight; say(msg, '', why);
    setTimeout(() => { delete replies.dataset.kunci; after(); }, 1500);
  })));
  offer(CHAT1, () => {
    log.append(el('div', { class: 'bl28-gelembung' }, el('b', null, 'Bima'), 'Oh, makasih. Kuhapus dari grup sebelah 🙏'), el('div', { class: 'bl28-gelembung' }, el('b', null, 'Rani'), 'Tapi bisa saja benar, kan? Kuteruskan ke grup alumni ya, biar mereka nilai sendiri.')); log.scrollTop = log.scrollHeight;
    say(msg, 'info', 'Rani mau meneruskan tautannya. Balas Rani.');
    offer(CHAT2, () => { replies.replaceChildren(); log.append(el('div', { class: 'bl28-gelembung' }, el('b', null, 'Rani'), 'Oke, kukirim kartu cek faktanya saja 👍')); log.scrollTop = log.scrollHeight; meter.stop(); say(msg, '', 'Tautan yang diteruskan dengan "benar nggak sih?" tetap menyebarkan hoaks. Yang diteruskan buktinya.'); done(); });
  });
  area.append(el('div', { class: 'bl28-dua' }, log, replies), msg);
}

// Misi 6: the first spreader's profile.
function accountRound(area, ctx, { meter, done }) {
  const need = PROFILE.filter((p) => p[2]).length; const found = new Set(); let stage = 1;
  const msg = msg28(`Ketuk tanda bahaya di profil akun penyebar pertama (ada ${need}).`);
  const part = ([k, t, sus, why], tag = 'div') => { const n = el(tag, { class: `bl28-profil-${k} bl28-ketuk`, 'data-k': k }, t); return onTap(n, () => {
    if (stage !== 1 || found.has(k)) return;
    found.add(k);
    if (!sus) { ctx.mistake(); n.classList.add('aman'); say(msg, 'bad', why); return; }
    n.classList.add('curiga'); ctx.sound.tap(); say(msg, '', why);
    if (PROFILE.filter((p) => p[2]).every((p) => found.has(p[0]))) { stage = 2; setTimeout(act, 1400); }
  }); };
  const P = Object.fromEntries(PROFILE.map((p) => [p[0], p]));
  const card = el('div', { class: 'bl28-profil' }, el('div', { class: 'bl28-profil-kepala' }, el('span', { class: 'bl28-avatar' }, '🏫'), el('div', null, part(P.nama, 'b'), part(P.bio))), el('div', { class: 'bl28-profil-meta' }, part(P.dibuat), part(P.pengelola)),
    el('small', null, '3 unggahan'), ['u1', 'u2', 'u3'].map((k) => part(P[k])));
  const acts = el('div', { class: 'bl28-yt' });
  function act() {
    say(msg, 'info', 'Akun baru, anonim, dan hanya menyerang satu calon. Apa tindakanmu?');
    fill(acts, [['lapor', '🚩 Laporkan ke platform dan panitia', ''], ['ikut', '➕ Ikuti supaya tahu unggahan berikutnya', 'Mengikuti dan berinteraksi justru menaikkan jangkauan akun itu.'], ['maki', '💬 Balas dengan makian', 'Makian memancing keributan dan ikut menaikkan jangkauan unggahannya.']].map(([k, l, why]) => onTap(el('button', { class: 'bl28-tuas', type: 'button', 'data-k': k }, l), (e) => {
      if (stage !== 2) return;
      if (why) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', why); return; }
      stage = 3; e.currentTarget.classList.add('on'); ctx.sound.tap(); meter.stop(); say(msg, '', 'Dilaporkan. Platform bisa memberi label atau membatasi sebarannya, dan panitia bisa memberi keterangan resmi.'); done();
    })));
  }
  area.append(card, acts, msg);
}

// Misi Bos: the fact-check card, at most 60 words.
function factCardBoss(area, ctx, { meter, done }) {
  const msg = msg28('Seret blok ke kartu: satu status, tiga bukti, dan satu ajakan. Paling banyak 60 kata.');
  const blocks = [...STATUS.map(([t, ok, why], i) => ({ id: `s${i}`, type: 'status', text: t, ok, why })), ...EVIDENCE.map(([k, t, ok]) => ({ id: `b${k}`, type: 'bukti', text: t, ok, why: k === 'T3' ? 'Profil calon hanya identitas; tidak membantah klaim.' : 'Pendapat bukan bukti yang bisa diperiksa.' })), ...CALLS.map(([k, t, ok, why]) => ({ id: `a${k}`, type: 'ajak', text: t, ok, why }))];
  const B = Object.fromEntries(blocks.map((b) => [b.id, b]));
  const slots = [['status', 'Status'], ['bukti', 'Bukti 1'], ['bukti', 'Bukti 2'], ['bukti', 'Bukti 3'], ['ajak', 'Ajakan']].map(([t, l], i) => el('div', { class: 'bl28-blok-slot', 'data-drop': `${t}-${i}` }, el('small', null, l)));
  const count = el('b', { class: 'bl28-kata' });
  const put = new Set();
  const drawCount = () => { const n = words(CLAIM) + [...put].reduce((s, id) => s + words(B[id].text), 0); count.textContent = `${n}/60 kata`; count.classList.toggle('lebih', n > 60); return n; };
  const cardBox = el('div', { class: 'bl28-kartu-cek' }, el('div', { class: 'bl28-kartu-kepala' }, el('b', null, '✅ CEK FAKTA'), count), el('p', null, el('b', null, 'Klaim: '), CLAIM), slots);
  const tray = el('div', { class: 'bl28-baki' }, ctx.rand.shuffle(blocks.map((b) => b.id)).map((id) => el('div', { class: `bl28-blok t-${B[id].type}`, 'data-drag': id }, B[id].text)));
  let left = slots.length;
  const board = el('div', { class: 'bl28-dua kartu' }, cardBox, tray);
  dnd(board, (card, slot) => {
    if (!left || slot.classList.contains('isi')) return;
    const b = B[card.dataset.drag]; const type = slot.dataset.drop.split('-')[0];
    if (b.type !== type) { ctx.mistake(); shake(card); say(msg, 'bad', `Blok ini bagian ${b.type === 'status' ? 'status' : b.type === 'bukti' ? 'bukti' : 'ajakan'}, bukan ${type === 'status' ? 'status' : type === 'bukti' ? 'bukti' : 'ajakan'}.`); return; }
    if (!b.ok) { ctx.mistake(); shake(card); say(msg, 'bad', b.why); return; }
    card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); put.add(b.id); ctx.sound.tap(); const n = drawCount();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    meter.stop(); say(msg, '', `Kartu cek fakta ${n} kata, berbukti dan bersumber. Meteran berhenti di ${meter.n.toLocaleString('id-ID')} penerima.`); done();
  });
  drawCount();
  area.append(board, msg);
}

export default {
  id: 'sma-28-baca-lateral',
  title: 'Cek Dulu Sebelum Sebar',
  topic: 'Membaca lateral, verifikasi foto dan video, dan ekosistem periksa fakta',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔍',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Tahan Hoaks Sebelum Pemilihan: baca vertikal lalu buka tab untuk membaca lateral, selidiki foto dan video, kenali ekosistem periksa fakta, tahan sebaran di grup kelas, lalu rakit kartu cek fakta sebelum meteran sebaran makin tinggi.',
  extraModes: [
    { id: 'peramban', icon: '🗂', label: 'Simulasi Peramban', desc: 'Artikel di tab utama; buka tab baru untuk data domain, nama situs, profil, pengumuman, rekap kas, akun penyebar, gambar, dan video lengkap', create: createBrowser },
    { id: 'giliran', icon: '🕵️', label: 'Tim Pemeriksa', desc: 'Tim bergiliran membuka satu tab dan menilainya; penilaian benar mendapat poin, dan menekan "Bagikan" sebelum pemeriksaan selesai mengurangi poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act bl28-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const meter = spreadMeter(ctx, 300 + 100 * r);
      const area = el('div', { class: 'bl28-area' });
      const go = (k, no) => { wrap.append(misiHead(no, ...HEAD28[k], '🔎'), meter.node, area); };
      const fin = (ms) => ({ meter, done: () => next(ms) });
      if (r === 0) { go('vertikal', 1); verticalRound(area, ctx, fin(5500)); }
      else if (r === 1) { go('tab1', 2); balanceRound(area, ctx, { ids: ['T1', 'T2', 'T3'], ...fin(5500) }); }
      else if (r === 2) { go('tab2', 2); balanceRound(area, ctx, { ids: ['T4', 'T5', 'T6'], pre: ['T1', 'T2', 'T3'], verdict: true, ...fin(6500) }); }
      else if (r === 3) { go('foto', 3); photoClueRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('balik', 3); reverseRound(area, ctx, fin(7000)); }
      else if (r === 5) { go('video', 4); cutRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('ekosistem', 5); ecoRound(area, ctx, fin(5500)); }
      else if (r === 7) { go('grup', 6); chatRound(area, ctx, fin(6000)); }
      else if (r === 8) { go('akun', 6); accountRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); factCardBoss(area, ctx, fin(7500)); }
    }
    render();
  },
};

// --- extra modes ---
function createBrowser(root, ctx) {
  const wrap = el('div', { class: 'act baca-lateral' });
  root.append(wrap);
  const state = { checked: false };
  let view = 'artikel'; const rated = {}; const found = new Set(); let time = 12;
  const sources = [...TABS, ...EXTRA];
  const msg = el('p', { class: 'reveal info' }, 'Membaca lateral: tinggalkan halaman, buka tab baru, dan periksa apa kata sumber lain.');
  function draw() {
    const S = sources.find((s) => s[0] === view);
    let body;
    if (view === 'artikel') body = el('div', { class: 'bl-dua' }, articleView(), el('div', { class: 'bl-kanan' }, photo({ found, onClue: (k) => { found.add(k); say(msg, '', CLUES.find((c) => c[0] === k)[1]); draw(); } }), found.has('kantin') ? el('div', { class: 'kartu' }, CARD_K) : null,
      el('div', { class: 'seg' }, [7, 12].map((t) => onTap(el('button', { class: `seg-btn ${time === t ? 'on' : ''}`, type: 'button' }, `Bayangan ${t === 7 ? '07.00' : '12.00'}`), () => { time = t; draw(); }))), shadowSim(time)));
    else body = el('div', { class: 'bl-buka' }, tabCard(S, rated[view]), view === 'V' ? el('div', { class: 'bl-transkrip' }, FULL.map(([w, t, cut]) => el('p', { class: `bl-baris ${cut ? 'potong' : ''}` }, el('i', null, `${w}: `), t)), el('small', null, 'Bagian berwarna tidak ada di klip 12 detik.')) : null,
      view in rated ? el('p', { class: 'bl-alasan' }, S[5]) : el('div', { class: 'seg' }, RATE.map(([v, l]) => onTap(el('button', { class: 'seg-btn besar', type: 'button' }, l), () => {
        if (v !== S[4]) { ctx.mistake(); say(msg, 'bad', RATE_HINT[view]); return; }
        rated[view] = v; ctx.sound.good(); say(msg, '', S[5]); if (Object.keys(rated).length === sources.length) state.checked = true; draw();
      }))));
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Simulasi peramban'), shareBar(ctx, state),
      el('div', { class: 'bl-tabbar' }, onTap(el('span', { class: `bl-tabk ${view === 'artikel' ? 'aktif' : ''}` }, '📰 Artikel'), () => { view = 'artikel'; draw(); }), ...sources.map((s) => onTap(el('span', { class: `bl-tabk ${view === s[0] ? 'aktif' : ''} ${rated[s[0]] || ''}` }, `${s[2]} ${s[0]}`), () => { view = s[0]; ctx.sound.tap(); draw(); }))), body, msg);
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act baca-lateral' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const left = ctx.rand.shuffle([...TABS, ...EXTRA]); let k = 0; const state = { checked: false };
    function turn() {
      if (!left.length) { finishBoard(wrap, ctx, { title: 'Pemeriksaan selesai', pts, again: () => pickTeams(wrap, 'Tim Pemeriksa', start) }); return; }
      const t = k % nT; let open = null;
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: buka satu tab dari menu, lalu nilai isinya.`);
      const bar = el('div', { class: 'bl-bar' }, onTap(el('button', { class: 'bl-bagikan', type: 'button' }, '📤 Bagikan'), () => { pts[t] -= 3; ctx.sound.bad(); say(msg, 'bad', `Tim ${t + 1} membagikan sebelum pemeriksaan selesai: −3 poin. Hoaks sampai ke ${(120 * (k + 1)).toLocaleString('id-ID')} orang.`); draw(); }));
      const host = el('div');
      const draw = () => { wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: buka satu tab`), bar, host, msg); };
      host.replaceChildren(el('div', { class: 'bl-dua' }, articleView(), el('div', { class: 'bl-menu' }, el('b', null, '＋ Buka tab baru'), left.map((s) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${s[2]} ${s[1]}`), () => {
        if (open) return; open = s; ctx.sound.tap();
        host.replaceChildren(el('div', { class: 'bl-buka' }, tabCard(s), el('div', { class: 'seg' }, RATE.map(([v, l]) => onTap(el('button', { class: 'seg-btn besar', type: 'button' }, l), () => {
          const ok = v === s[4]; if (ok) pts[t] += 2; ctx.sound[ok ? 'good' : 'bad']();
          left.splice(left.indexOf(s), 1); if (!left.length) state.checked = true;
          say(msg, ok ? '' : 'bad', `${ok ? '+2. ' : `Seharusnya "${RATE.find((x) => x[0] === s[4])[1].toLowerCase()}". `}${s[5]}`); draw();
          k++; setTimeout(turn, 3000);
        }))))); draw();
      })))));
      draw();
    }
    turn();
  }
  pickTeams(wrap, 'Tim Pemeriksa', start);
}
