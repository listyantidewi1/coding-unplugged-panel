// Cek Dulu Sebelum Sebar — SMA/SMK (16–18 tahun), membaca lateral dan verifikasi.
// A fake article about an OSIS candidate: vertical vs lateral reading in a
// simulated browser, a photo in the wrong context, a cut video, the
// fact-checking ecosystem, and how to answer in the class group.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

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
  ['anonim', 'Seorang murid yang tidak mau disebut namanya mengatakan bahwa Fajar memakai uang kas kelas 11-3 untuk membeli jajan bagi calon pemilihnya. "Semua orang di kelas sudah tahu," katanya.', true, 'Satu-satunya sumber anonim, dan tidak ada konfirmasi dari Fajar, bendahara, atau panitia.'],
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

export const CLUES = [['spanduk', 'Spanduk di belakang bertuliskan "…akti Sosial 2025", bukan kegiatan Oktober 2026.'], ['bayangan', 'Bayangannya pendek, kira-kira setengah tinggi badan: sekitar tengah hari. Pukul 07.00 bayangan lebih dari tiga kali tinggi badan.'], ['kantin', 'Kantin beratap seng di latar sudah dibongkar pada Januari 2026 (kartu K).']];
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
    el('p', null, part('anonim', ''), ' ', part('video', ''), ' ', part('emosi', '')), part('bagikan', 'bagikan', 'p'), part('tentang', 'tentang', 'p'));
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
  const len = time === 7 ? 3.4 : 0.5; const h = 60;
  return svg('svg', { class: 'bl-bayang', viewBox: '0 0 300 120' }, svg('rect', { x: 0, y: 0, width: 300, height: 120, fill: time === 7 ? '#fed7aa' : '#bae6fd' }), svg('circle', { cx: time === 7 ? 18 : 150, cy: time === 7 ? 80 : 14, r: 10, fill: '#facc15' }),
    svg('rect', { x: 0, y: 100, width: 300, height: 20, fill: '#a3a3a3' }), svg('ellipse', { cx: 90 + (h * len) / 2, cy: 101, rx: (h * len) / 2, ry: 4, fill: '#00000066' }), svg('rect', { x: 84, y: 100 - h, width: 12, height: h, rx: 5, fill: '#2563eb' }), svg('circle', { cx: 90, cy: 100 - h - 7, r: 7, fill: '#a16207' }),
    svg('text', { x: 290, y: 20, 'font-size': 14, 'font-weight': 800, 'text-anchor': 'end', fill: '#0f172a' }, `pukul ${time === 7 ? '07.00' : '12.00'}`));
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
  goal: 'Periksa artikel tentang calon ketua OSIS: baca vertikal lalu lateral, verifikasi foto dan video, kenali peran lembaga periksa fakta, dan tulis tanggapan yang tepat di grup kelas.',
  extraModes: [
    { id: 'peramban', icon: '🗂', label: 'Simulasi Peramban', desc: 'Artikel di tab utama; buka tab baru untuk data domain, nama situs, profil, pengumuman, rekap kas, akun penyebar, gambar, dan video lengkap', create: createBrowser },
    { id: 'giliran', icon: '🕵️', label: 'Tim Pemeriksa', desc: 'Tim bergiliran membuka satu tab dan menilainya; penilaian benar mendapat poin, dan menekan "Bagikan" sebelum pemeriksaan selesai mengurangi poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act baca-lateral' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const state = { checked: false };
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) {
        const found = new Set(); const need = ARTICLE.filter((a) => a[2]).length;
        const msg = el('p', { class: 'reveal info' }, `Membaca vertikal: ketuk tanda yang mencurigakan di halaman ini (ada ${need}).`);
        const host = el('div');
        const draw = () => host.replaceChildren(articleView({ found, tap: (p) => {
          if (found.has(p[0])) return; found.add(p[0]);
          if (!p[2]) { ctx.mistake(); say(msg, 'bad', p[3]); draw(); return; }
          ctx.sound.tap(); say(msg, '', p[3]); draw();
          if (ARTICLE.filter((a) => a[2]).every((a) => found.has(a[0]))) { state.checked = true; setTimeout(then(() => ask('Mengapa bagian "Tentang kami" tidak bisa dipakai untuk menilai situs ini?', [['Situs bisa menulis apa saja tentang dirinya sendiri; penilaian yang adil harus datang dari pihak lain', true], ['Karena terlalu pendek'], ['Karena ditulis di bagian bawah'], ['Bisa dipakai; situs tidak mungkin berbohong tentang dirinya']])), 1800); }
        } }));
        draw();
        wrap.append(el('p', { class: 'prompt' }, 'Membaca vertikal: halaman artikel'), shareBar(ctx, state), host, msg);
      } else if (r === 1) browserRound(wrap, ctx, { sources: TABS, title: 'Membaca lateral: buka tab baru dan nilai isinya', state, done: next });
      else if (r === 2) ask('T5 (rekap kas) dibuat teman sekelas Fajar. Apakah T5 cukup sebagai bukti?', [['Belum cukup bila berdiri sendiri karena pembuatnya dekat dengan yang dituduh; kuat karena sejalan dengan pemeriksaan panitia (T4) dan rekaman rapat', true], ['Cukup, karena angkanya cocok'], ['Tidak berguna sama sekali'], ['Cukup, karena dibuat bendahara']], 1, tabCard(TABS[4]),
        then(() => ask('Apa kesimpulanmu tentang artikel itu?', [['Tidak dapat dipercaya: situsnya baru dan anonim, tidak ada sumber lain, dan klaimnya dibantah sumber resmi', true], ['Benar, karena ada foto dan video'], ['Separuh benar'], ['Belum bisa disimpulkan sama sekali']])));
      else if (r === 3) photoRound(wrap, ctx, { state, done: then(() => ask('Apakah foto itu hasil suntingan?', [['Tidak; fotonya asli tetapi dipakai dengan keterangan yang salah: konteks keliru', true], ['Ya, hasil suntingan (manipulasi)'], ['Ya, buatan KA'], ['Tidak; fotonya benar dan keterangannya juga benar']], 1, null,
        then(() => ask('Mengapa hasil pencarian gambar terbalik diurutkan dari yang paling lama?', [['Yang dicari kemunculan pertama; unggahan baru sering hanya menyalin foto dengan keterangan yang sudah diubah', true], ['Supaya hasilnya lebih sedikit'], ['Karena foto lama lebih jernih'], ['Tidak perlu diurutkan']])))) });
      else if (r === 4) videoRound(wrap, ctx, { state, done: then(() => ask('Bagaimana pemotongan itu mengubah arti ucapan Fajar?', [['Seolah-olah Fajar ingin memakai kas untuk kampanye, padahal kesepakatannya untuk menjenguk teman sakit dan Fajar justru menolak memakai kas untuk kampanye', true], ['Tidak mengubah arti apa pun'], ['Membuat Fajar terdengar lebih sopan'], ['Membuat video lebih pendek saja']], 1, null,
        then(() => ask('Tab mana di membaca lateral yang sejalan dengan rekaman lengkap ini?', TABS.map(([id, n]) => [`${id} · ${n}`, id === 'T5']), 2)))) });
      else if (r === 5) ask('Langkah mana yang tepat untuk memeriksa video yang beredar?', [['Cari rekaman lebih panjang, periksa kapan dan oleh siapa pertama diunggah, perhatikan lompatan gambar atau suara, bandingkan dengan saksi atau sumber resmi', true], ['Tonton berulang kali sampai yakin'], ['Hitung jumlah penonton; makin banyak makin benar'], ['Tanyakan di grup apakah videonya asli']]);
      else if (r === 6) matchRound(wrap, ctx, { done: then(() => ask('Mengapa hoaks menjelang pemilihan berbahaya bagi demokrasi?', [['Pemilih memutuskan berdasarkan informasi palsu, nama baik calon rusak, dan kepercayaan pada proses pemilihan turun', true], ['Karena membuat grup ramai'], ['Tidak berbahaya; pemilih bisa memilih sendiri'], ['Karena menghabiskan kuota internet']])) });
      else if (r === 7) ask('Tanggapan mana yang paling tepat di grup kelas?', [['Membalas sopan dengan bukti dan sumbernya (foto bakti sosial 2025, video dipotong, pengumuman panitia), mengajak tidak meneruskan, lalu melapor ke panitia', true], ['Meneruskan tautan ke grup lain dengan tambahan "Benar nggak sih ini?"'], ['Diam saja dan tidak melakukan apa pun'], ['Membalas dengan menghina pembuat artikel dan menebak siapa pembuatnya']], 1, null,
        then(() => ask('Mengapa meneruskan tautan dengan "Benar nggak sih ini?" tetap merugikan?', [['Tautan tetap sampai ke lebih banyak orang, dan banyak yang hanya membaca judulnya tanpa membaca pertanyaannya', true], ['Karena pertanyaannya tidak sopan'], ['Tidak merugikan, karena hanya bertanya'], ['Karena grup lain tidak kenal Fajar']])));
      else if (r === 8) {
        const sources = [...TABS, ...EXTRA];
        browserRound(wrap, ctx, { sources: EXTRA, title: 'Dua tab lagi: gambar terbalik dan video lengkap', state, done: then(() => ask('Dari delapan sumber, berapa yang melemahkan artikel?', [6, 7, 8, 5].sort((a, b) => a - b).map((x) => [x, x === sources.filter((s) => s[4] === 'lemah').length]), 4)) });
      } else factCardRound(wrap, ctx, { done: next });
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
