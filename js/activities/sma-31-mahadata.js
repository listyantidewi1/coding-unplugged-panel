// Menghitung Trending Topik — SMA/SMK (16–18 tahun), mahadata dan map–reduce.
// Sixty festival posts are split over four workers: map counts tags per part,
// grouping sends each count to the worker that owns the tag's first letter, and
// reduce adds them up. Then cleaning, fake accounts, timing, big-data traits and privacy.

import { el, onTap, button, shake } from '../core/util.js';
import { dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const CARDS = [
  [1, '@sekar.ayu', 'foto', 'Malam pembukaan meriah sekali', '#FESTIVALWANASARI #kulinerwanasari'],
  [2, '@budi_wsr', 'video', 'Lampion di alun-alun cantik', '#festivalwanasari'],
  [3, '@nina.kuliner', 'foto', 'Hari kedua makin ramai', '#FESTIVALWANASARI'],
  [4, '@rendy88', 'video', 'Datang bersama keluarga besar', '#FESTIVALWANASARI'],
  [5, '@tari_lestari', 'foto', 'Makan sate dulu, lalu ke stan batik', '#kulinerwanasari #BatikWanasari'],
  [6, '@pakde_jono', 'foto', 'Jalan menuju alun-alun padat', '#MacetAlunAlun'],
  [7, '@mbak_wulan', 'foto', 'Sampah plastik menumpuk di trotoar', '#SampahFestival #kulinerwanasari'],
  [8, '@dika.foto', 'teks', 'Pertama kali datang ke festival ini', '#FestivalWanasari'],
  [9, '@yusuf_r', 'foto', 'Pameran batik tulis motif kopi', '#BatikWanasari'],
  [10, '@lia_kirana', 'foto', 'Kembang api tepat pukul sembilan', '#festivalwanasari'],
  [11, '@ojek_anto', 'foto', 'Wedang jahe sambil menonton panggung', '#kulinerwanasari #PanggungRakyat'],
  [12, '@bu_endah', 'video', 'Parade kostum dari setiap desa', '#paradebudaya #batikwanasari'],
  [13, '@rara.batik', 'foto', 'Satu jam terjebak di perempatan', '#MacetAlunAlun #panggungrakyat'],
  [14, '@fajar_m', 'teks', 'Getuk lindri warna-warni', '#KulinerWanasari'],
  [15, '@cici_jalan', 'teks', 'Barisan kuda lumping memukau', '#PARADEBUDAYA #FestivalWanasari'],
  [16, '@gilang.p', 'teks', 'Panggung utama penuh penonton', '#FestivalWANASARI #KULINERWANASARI'],
  [17, '@hana_s', 'video', 'Naik delman lebih cepat daripada mobil', '#FestivalWanasari #MacetAlunAlun'],
  [18, '@wawan_sate', 'teks', 'Foto bersama maskot festival', '#FestivalWanasari'],
  [19, '@intan.dewi', 'foto', 'Drumben SD ikut parade', '#PARADEBUDAYA #BatikWanasari'],
  [20, '@ardi_kamera', 'foto', 'Tempat sampah kurang banyak', '#SampahFestival'],
  [21, '@mila_n', 'foto', 'Parkir penuh sampai ke gang', '#macetalunalun #PanggungRakyat'],
  [22, '@toni_wsr', 'foto', 'Banyak pengunjung dari luar kota', '#FestivalWANASARI #KULINERWANASARI'],
  [23, '@sari.rasa', 'video', 'Relawan memungut sampah pagi ini', '#SampahFestival'],
  [24, '@agus_b', 'video', 'Festival ramai, tetapi jalannya macet', '#FestivalWanasari #MacetAlunAlun'],
  [25, '@desi_k', 'foto', 'Nasi jagung khas desa', '#KulinerWanasari'],
  [26, '@rizal_t', 'foto', 'Gunungan hasil bumi diarak', '#ParadeBudaya'],
  [27, '@umi_kulsum', 'foto', 'Lampu hias sepanjang jalan', '#FESTIVALWANASARI #kulinerwanasari'],
  [28, '@bayu_aji', 'foto', 'Ke pameran batik, terjebak macet dulu', '#batikwanasari #macetalunalun'],
  [29, '@nanda.r', 'video', 'Ketoprak semalam suntuk', '#PanggungRakyat #paradebudaya'],
  [30, '@eka_putri', 'foto', 'Pulang jam sebelas, capek tapi senang', '#FestivalWanasari'],
  [31, '@joko_wsr', 'foto', 'Wahana bianglala antre panjang', '#festivalwanasari'],
  [32, '@vina_l', 'teks', 'Pawai pelajar berbaju adat', '#paradebudaya #panggungrakyat'],
  [33, '@heru_s', 'foto', 'Hujan pun tetap ramai', '#festivalwanasari #KULINERWANASARI'],
  [34, '@putri.ayu', 'teks', 'Kereta hias dari desa tetangga', '#paradebudaya #MACETALUNALUN'],
  [35, '@dodi_k', 'foto', 'Pentas band pelajar keren', '#PanggungRakyat'],
  [36, '@ratna_w', 'foto', 'Kirab lampion bersama teman sekelas', '#FestivalWanasari #KulinerWanasari'],
  [37, '@ilham_f', 'video', 'Batik pewarna alami dari daun', '#batikwanasari'],
  [38, '@yanti_m', 'foto', 'Jadwal acara besok sudah keluar', '#festivalwanasari #KULINERWANASARI'],
  [39, '@kiki_r', 'foto', 'Jalan kaki saja, trotoar penuh sampah', '#MacetAlunAlun #SampahFestival'],
  [40, '@andre_p', 'video', 'Gerbang festival berhias kain batik', '#FestivalWanasari #batikwanasari'],
  [41, '@lusi_a', 'foto', 'Es dawet paling segar', '#KulinerWanasari'],
  [42, '@benny_t', 'foto', 'Mendoan hangat di sebelah stan batik', '#KULINERWANASARI #BatikWanasari'],
  [43, '@rina_h', 'video', 'Penari topeng di barisan depan', '#PARADEBUDAYA'],
  [44, '@gita.s', 'foto', 'Lampu lalu lintas mati, semrawut', '#MACETALUNALUN #FestivalWANASARI'],
  [45, '@hendra_w', 'foto', 'Bawa botol minum sendiri, yuk', '#sampahfestival'],
  [46, '@novi_k', 'video', 'Makan tempe bacem sambil menunggu macet', '#FestivalWanasari #kulinerwanasari #macetalunalun'],
  [47, '@infopanggung_01', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#panggungrakyat'],
  [48, '@infopanggung_02', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#panggungrakyat'],
  [49, '@ucok_m', 'teks', 'Selesai parade, sampahnya banyak', '#FestivalWANASARI #PARADEBUDAYA #sampahfestival'],
  [50, '@infopanggung_03', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#PanggungRakyat'],
  [51, '@wati_s', 'video', 'Angkot berhenti sembarangan', '#FestivalWANASARI #MACETALUNALUN #ParadeBudaya'],
  [52, '@infopanggung_01', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#PanggungRakyat'],
  [53, '@infopanggung_02', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#panggungrakyat'],
  [54, '@zaki_r', 'video', 'Sega megono lauk lengkap', '#FestivalWanasari #KulinerWanasari'],
  [55, '@infopanggung_03', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#PanggungRakyat'],
  [56, '@melati_p', 'foto', 'Kain batik motif gunung', '#BatikWanasari #paradebudaya'],
  [57, '@infopanggung_01', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#PanggungRakyat'],
  [58, '@ferry_k', 'foto', 'Macet dari jembatan sampai pasar', '#festivalwanasari #MACETALUNALUN'],
  [59, '@infopanggung_02', 'teks', 'Panggung Rakyat malam ini, WAJIB datang!!!', '#panggungrakyat'],
  [60, '@ayu_n', 'teks', 'Jajan pasar murah, bungkusnya daun', '#KULINERWANASARI #SampahFestival #FESTIVALWANASARI'],
];
export const TAGS = ['batikwanasari', 'festivalwanasari', 'kulinerwanasari', 'macetalunalun', 'panggungrakyat', 'paradebudaya', 'sampahfestival'];
export const SHORT = { batikwanasari: 'batik', festivalwanasari: 'festival', kulinerwanasari: 'kuliner', macetalunalun: 'macet', panggungrakyat: 'panggung', paradebudaya: 'parade', sampahfestival: 'sampah' };
export const PARTS = [['A', 1, 15], ['B', 16, 30], ['C', 31, 45], ['D', 46, 60]];
export const FAKE = ['@infopanggung_01', '@infopanggung_02', '@infopanggung_03'];
export const tagsOf = (c, lower = true) => c[4].split(' ').map((t) => (lower ? t.slice(1).toLowerCase() : t.slice(1)));
export const partCards = (p, cards = CARDS) => cards.filter((c) => c[0] >= PARTS[p][1] && c[0] <= PARTS[p][2]);
export const clean = (dropFake) => (dropFake ? CARDS.filter((c) => !FAKE.includes(c[1])) : CARDS);
export function count(cards, lower = true) { const n = {}; for (const c of cards) for (const t of tagsOf(c, lower)) n[t] = (n[t] || 0) + 1; return n; }
export const ruleGroup = (tag) => { const ch = tag[0].toLowerCase(); return ch <= 'f' ? 0 : ch <= 'm' ? 1 : ch <= 'r' ? 2 : 3; };
export function loads(totals, assign = ruleGroup) { const L = [0, 0, 0, 0]; for (const [t, n] of Object.entries(totals)) L[typeof assign === 'function' ? assign(t) : assign[t]] += n; return L; }
export const ranking = (totals) => Object.entries(totals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
export function pairs(cards = CARDS) { const n = {}; for (const c of cards) { const t = [...new Set(tagsOf(c))].sort(); for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const k = `${t[i]} + ${t[j]}`; n[k] = (n[k] || 0) + 1; } } return n; }
export const TRAITS = [['1', 'Selama festival, setiap menit muncul ribuan unggahan baru.', 'KE'], ['2', 'Unggahan setahun dari seluruh Indonesia berukuran ratusan terabita.', 'VO'], ['3', 'Unggahan berisi teks, foto, video, dan lokasi.', 'RA'], ['4', 'Tiga akun baru mengunggah kalimat yang sama berulang kali.', 'BE'], ['5', 'Hasil hitungan dipakai untuk menambah kantong parkir dan tempat sampah tahun depan.', 'NI']];
export const TRAIT_NAME = { VO: 'volume', KE: 'kecepatan', RA: 'keragaman', BE: 'kebenaran', NI: 'nilai' };
export const PRIVACY = [['a', 'Jumlah unggahan setiap tagar per jam', 'A', 'Angka gabungan, tidak menunjuk orang.'], ['b', 'Daftar akun yang mengunggah tagar macetalunalun beserta lokasi dan jam unggahannya', 'T', 'Menunjuk orang tertentu, lengkap dengan lokasi dan waktunya.'], ['c', 'Peta keramaian per kotak 500 m × 500 m; kotak dengan kurang dari 20 unggahan tidak ditampilkan', 'A', 'Digabung per wilayah, dan kotak yang sepi disembunyikan.'], ['d', 'Foto-foto unggahan asli yang menampakkan wajah pengunjung', 'T', 'Wajah adalah data pribadi; fotonya juga milik pengunggah.'], ['e', 'Riwayat lokasi unggahan satu akun selama seminggu', 'T', 'Bisa menunjukkan rumah, sekolah, dan kebiasaan seseorang.']];

// --- view pieces ---
const G = ['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4'];
const RULE = ['a–f', 'g–m', 'n–r', 's–z'];
const fmtDur = (s) => (s >= 3600 ? `${fmtNum(s / 3600, 1)} jam` : s >= 60 ? `${fmtNum(s / 60, 1)} menit` : `${fmtNum(s, 1)} detik`);

function postCard(c, { lower = false, fake = false } = {}) {
  return el('div', { class: `mr-kartu ${fake && FAKE.includes(c[1]) ? 'palsu' : ''}` }, el('b', null, c[0]), el('span', { class: 'mr-akun' }, c[1]), el('span', { class: 'mr-tagar' }, tagsOf(c, lower).map((t) => `#${t}`).join(' ')));
}

function trendTable(totals, note = null) {
  const R = ranking(totals); const mx = R[0][1];
  return el('div', { class: 'mr-trend' }, R.map(([t, n]) => el('div', { class: 'mr-tbaris' }, el('span', null, `#${t}`), el('div', { class: 'mr-batang' }, el('i', { style: { width: `${(n / mx) * 100}%` } })), el('b', null, String(n)))), note ? el('small', null, note) : null);
}

// ---------- Pusat Data Trending: the ten missions ----------
const SERVERS = ['Server 1', 'Server 2', 'Server 3', 'Server 4'];
export const REDUCE_DECOYS = [24, 16, 10];
export const FAKE_IDS = [47, 48, 50, 52, 53, 55, 57, 59];
export const RACES = [
  [{ head: '60 kartu, 12 detik per kartu', lanes: [['🧑 1 orang', '60 kartu × 12 detik', '12 menit', 12], ['🖥 4 server', '15 kartu × 12 detik + 4 menit kirim, jumlah, lapor', '7 menit', 7]], extra: ['⚡ Lebih cepat', '12 menit ÷ 7 menit', '≈ 1,7 kali'], chips: ['12 menit', '7 menit', '≈ 1,7 kali', '3 menit', '48 menit', '4 kali'], end: 'Bukan 4 kali: kirim, jumlah, dan lapor tetap 4 menit. Untuk data kecil, waktu tambahan itu terasa besar.' }],
  [{ head: '60.000 kartu, 12 detik per kartu', lanes: [['🧑 1 orang', '60.000 kartu × 12 detik', '200 jam', 200], ['🖥 4 server', '15.000 kartu × 12 detik + 4 menit', '≈ 50 jam', 50]], extra: ['⚡ Lebih cepat', '200 jam ÷ 50 jam', '≈ 4 kali'], chips: ['200 jam', '≈ 50 jam', '≈ 4 kali', '20 jam', '5 jam', '1,7 kali'], end: 'Untuk data besar, waktu tambahan 4 menit hampir tidak terasa: empat server hampir 4 kali lebih cepat.' },
    { head: '60 juta unggahan, satu komputer 10.000 unggahan per detik', lanes: [['💻 1 komputer', '60.000.000 ÷ 10.000 per detik', '100 menit', 6000], ['🏢 100 komputer', '600.000 unggahan per komputer', '60 detik', 60]], chips: ['100 menit', '60 detik', '6 menit', '1 detik', '10 jam'], end: 'Pusat data sungguhan bekerja seperti ini: ribuan komputer, masing-masing mengerjakan satu bagian.' }],
];
export const HEAT = [['Alun-alun', 230], ['Pasar', 142], ['Stan kuliner', 87], ['Jembatan', 64], ['Sawah utara', 15], ['Parkir timur', 41], ['Gang Kenanga', 12], ['Balai desa', 25], ['Kebun tebu', 9], ['Terminal', 76], ['Tepi sungai', 3], ['Pos ronda', 18]];
const HEAD31 = {
  map: ['Tahap Map', 'Ketuk setiap tagar pada 15 kartu bagian A; Pencatat menulisnya dengan huruf kecil.'],
  ejaan: ['Gabungkan Ejaan', 'Ketuk dua ejaan dari tagar yang sama untuk menggabungkannya.'],
  kurir: ['Kurir Kertas', 'Seret setiap kertas tagar ke server menurut huruf pertamanya.'],
  imbang: ['Seimbangkan Beban', 'Pindahkan tagar antarserver sampai setiap server menerima 20–26 kertas.'],
  reduce: ['Penjumlah', 'Seret jumlah yang tepat ke setiap tagar: A + B + C + D.'],
  siluman: ['Tangkap Akun Siluman', 'Ketuk delapan unggahan dari akun siluman di bagian D.'],
  balap1: ['Balapan di Atas Kertas', 'Seret waktu yang tepat ke setiap lintasan, lalu tonton balapannya.'],
  balap2: ['Balapan Mahadata', 'Data makin besar: seret waktunya, lalu tonton balapannya.'],
  ciri: ['Lima Ciri Mahadata', 'Seret setiap kartu ciri ke pernyataannya.'],
  bos: ['Gerbang Privasi', 'Loloskan data gabungan, tahan data yang menunjuk orang, lalu tutup kotak peta yang sepi.'],
};
const msg31 = (t) => el('p', { class: 'reveal info' }, t);
const bar = (frac, cls = '') => el('div', { class: `md31-batang ${cls}` }, el('i', { style: { width: `${Math.min(100, frac * 100)}%` } }));

// Misi 1: tap every tag of part A while the lone computer plods through all sixty.
function mapRound(area, ctx, { done }) {
  const cards = partCards(0); const tally = Object.fromEntries(TAGS.map((t) => [t, 0]));
  let left = cards.reduce((a, c) => a + tagsOf(c).length, 0); let soloN = 0;
  const msg = msg31('Ketuk setiap tagar. Pencatat menulisnya dengan huruf kecil dan menambah satu turus.');
  const rows = Object.fromEntries(TAGS.map((t) => [t, el('div', { class: 'md31-turus-baris' }, el('span', null, t), el('span', { class: 'md31-turus' }), el('b', null, '0'))]));
  const solo = el('div', { class: 'md31-tunggal' });
  const drawSolo = () => fill(solo, el('span', null, '🖥 Komputer Tunggal'), bar(soloN / 60), el('b', null, `${soloN}/60 kartu`));
  drawSolo();
  const timer = setInterval(() => { if (!solo.isConnected) { clearInterval(timer); return; } if (left && soloN < 60) { soloN++; drawSolo(); } }, 1400);
  const grid = el('div', { class: 'md31-kartu-kartu' }, cards.map((c) => el('div', { class: 'md31-kartu' }, el('b', null, c[0]), el('span', { class: 'md31-tagar' }, c[4].split(' ').map((raw, i) => onTap(el('button', { class: 'md31-tag', type: 'button', 'data-c': c[0], 'data-i': i }, raw), (e) => {
    const b = e.currentTarget; if (b.classList.contains('on') || !left) return;
    const t = raw.slice(1).toLowerCase(); b.classList.add('on'); tally[t]++; left--; ctx.sound.tap();
    const r = rows[t]; fill(r.querySelector('.md31-turus'), Array.from({ length: tally[t] }, () => el('i'))); r.querySelector('b').textContent = String(tally[t]);
    r.classList.remove('kedip'); void r.offsetWidth; r.classList.add('kedip');
    if (left) return;
    clearInterval(timer);
    say(msg, '', `Map bagian A selesai: ${TAGS.map((x) => `${SHORT[x]} ${tally[x]}`).join(', ')}. Komputer Tunggal baru sampai kartu ${soloN} dari 60.`); done();
  }))))));
  area.append(solo, el('div', { class: 'md31-dua' }, grid, el('div', { class: 'md31-catat' }, el('b', null, '📝 Pencatat bagian A'), TAGS.map((t) => rows[t]))), msg);
}

// Misi 1: the raw count splits one tag into many spellings; merge them.
function mergeRound(area, ctx, { oops, done }) {
  const focus = ['festivalwanasari', 'kulinerwanasari', 'panggungrakyat', 'macetalunalun'];
  const tot = count(CARDS);
  let groups = Object.entries(count(CARDS, false)).filter(([t]) => focus.includes(t.toLowerCase())).map(([t, n]) => ({ id: t, low: t.toLowerCase(), k: 1, n }));
  const rest = TAGS.filter((t) => !focus.includes(t)).map((t) => ({ id: t, low: t, k: 1, n: tot[t], fixed: true }));
  let sel = null;
  const msg = msg31('Tanpa menyamakan huruf, #FestivalWanasari (10) dan #PanggungRakyat (8) tampak paling ramai. Ketuk dua ejaan yang sama untuk menggabungkannya.');
  const board = el('div', { class: 'md31-trend' });
  const draw = () => {
    const all = [...groups, ...rest].sort((a, b) => b.n - a.n || a.id.localeCompare(b.id)); const mx = all[0].n;
    fill(board, all.map((g, i) => onTap(el('button', { class: `md31-tbaris ${g.fixed ? 'tetap' : ''} ${sel === g ? 'pilih' : ''} ${g.k > 1 ? 'gabung' : ''} ${i < 3 ? 'atas' : ''}`, type: 'button', 'data-id': g.id, 'data-low': g.fixed ? '' : g.low }, el('em', null, String(i + 1)), el('span', null, g.k > 1 ? `#${g.low} · ${g.k} ejaan` : `#${g.id}`), bar(g.n / mx), el('b', null, String(g.n))), (e) => {
      if (groups.length === focus.length) return;
      if (g.fixed) { say(msg, 'info', `#${g.id} sudah dirapikan Pencatat lain.`); return; }
      if (!sel || sel === g) { sel = sel === g ? null : g; ctx.sound.tap(); draw(); return; }
      if (sel.low !== g.low) { oops(); shake(e.currentTarget); say(msg, 'bad', `#${sel.id} dan #${g.id} adalah tagar yang berbeda, bukan beda huruf besar-kecil saja.`); return; }
      sel.k += g.k; sel.n += g.n; sel.id = sel.low; groups = groups.filter((x) => x !== g); sel = null; ctx.sound.tap();
      if (groups.length > focus.length) { say(msg, '', 'Tergabung.'); draw(); return; }
      draw(); say(msg, '', 'Setelah disamakan, festivalwanasari 26 kali dan langsung menjadi trending nomor 1; panggungrakyat turun ke nomor 3.'); done();
    })));
  };
  draw();
  area.append(board, msg);
}

const serverBox = (i, extra = null) => el('div', { class: 'md31-server', 'data-drop': i }, el('div', { class: 'md31-server-kepala' }, el('span', { class: 'md31-led' }), el('b', null, SERVERS[i]), el('small', null, RULE[i])), el('div', { class: 'md31-server-isi' }), extra);

// Misi 2: couriers carry each tag's paper to the server that owns its first letter.
function courierRound(area, ctx, { oops, done }) {
  const per = PARTS.map((_, p) => count(partCards(p))); const tot = count(CARDS); const load = [0, 0, 0, 0]; let left = TAGS.length;
  const msg = msg31('Server 1 menerima tagar berawalan a–f, Server 2 g–m, Server 3 n–r, Server 4 s–z.');
  const meters = [0, 1, 2, 3].map(() => el('div', { class: 'md31-muatan' }));
  const drawLoad = () => meters.forEach((m, i) => fill(m, bar(load[i] / 40), el('small', null, `${load[i]} kertas`)));
  const servers = [0, 1, 2, 3].map((i) => serverBox(i, meters[i]));
  const tray = el('div', { class: 'md31-baki' }, ctx.rand.shuffle(TAGS.slice()).map((t) => el('div', { class: 'md31-kertas', 'data-drag': t }, el('b', null, `#${t}`), el('small', null, PARTS.map((p, i) => `${p[0]} ${per[i][t] || 0}`).join(' · ')))));
  const board = el('div', { class: 'md31-papan' }, el('div', { class: 'md31-server-server' }, servers), tray);
  dnd(board, (slip, box) => {
    if (!left) return;
    const t = slip.dataset.drag; const i = +box.dataset.drop;
    if (ruleGroup(t) !== i) { oops(); shake(slip); box.classList.remove('merah'); void box.offsetWidth; box.classList.add('merah'); say(msg, 'bad', `#${t} berawalan "${t[0]}", jadi bukan untuk ${SERVERS[i]} (${RULE[i]}).`); return; }
    slip.classList.add('locked'); box.querySelector('.md31-server-isi').append(slip); load[i] += tot[t]; drawLoad(); ctx.sound.tap(); left--;
    if (left) { say(msg, '', `#${t}: ${tot[t]} kertas ke ${SERVERS[i]}.`); return; }
    say(msg, '', 'Semua kertas sampai: 35, 29, 25, dan 7 kertas. Server 1 kebanjiran, Server 4 lebih banyak menganggur.'); done();
  });
  drawLoad();
  area.append(board, msg);
}

// Misi 2: move whole tags between servers until no server carries more than 26.
function balanceRound(area, ctx, { done }) {
  const tot = count(CARDS); let over = false;
  const msg = msg31('Beban sekarang 35, 29, 25, 7. Seret tagar ke server lain. Satu tagar harus tetap utuh di satu server supaya bisa dijumlahkan.');
  const meters = [0, 1, 2, 3].map(() => el('div', { class: 'md31-muatan' }));
  const servers = [0, 1, 2, 3].map((i) => serverBox(i, meters[i]));
  servers.forEach((s) => s.querySelector('small').remove());
  for (const t of TAGS) servers[ruleGroup(t)].querySelector('.md31-server-isi').append(el('div', { class: 'md31-kertas kecil', 'data-drag': t }, el('b', null, `#${SHORT[t]}`), el('small', null, `${tot[t]} kertas`)));
  const loadsNow = () => servers.map((s) => [...s.querySelectorAll('[data-drag]')].reduce((a, x) => a + tot[x.dataset.drag], 0));
  const drawLoad = () => { const L = loadsNow(); meters.forEach((m, i) => { m.classList.toggle('cukup', L[i] >= 20 && L[i] <= 26); fill(m, bar(L[i] / 40), el('small', null, `${L[i]} kertas`)); }); return L; };
  const board = el('div', { class: 'md31-papan' }, el('div', { class: 'md31-server-server' }, servers), el('div', { class: 'md31-pita' }, el('span', null, '🎯 Sasaran setiap server: 20–26 kertas (rata-rata 96 ÷ 4 = 24)')));
  dnd(board, (chip, box) => {
    if (over || chip.closest('.md31-server') === box) return;
    box.querySelector('.md31-server-isi').append(chip); ctx.sound.tap();
    const L = drawLoad();
    if (Math.max(...L) > 26 || Math.min(...L) < 20) { say(msg, 'info', `Beban: ${L.join(', ')} kertas.`); return; }
    over = true; board.querySelectorAll('[data-drag]').forEach((x) => x.classList.add('locked'));
    say(msg, '', `Seimbang: ${L.join(', ')} kertas. festivalwanasari (26) cukup sendirian; tagar lain berpasangan.`); done();
  });
  drawLoad();
  area.append(board, msg);
}

// Misi 3: each server adds up the four part counts.
function reduceRound(area, ctx, { oops, done }) {
  const per = PARTS.map((_, p) => count(partCards(p))); const tot = count(CARDS); let left = TAGS.length;
  const msg = msg31('Penjumlah di setiap server menambahkan angka dari bagian A, B, C, dan D.');
  const blanks = {};
  const order = TAGS.slice().sort((a, b) => ruleGroup(a) - ruleGroup(b) || a.localeCompare(b));
  const sumCell = el('td', { class: 'md31-total' }, '?');
  const table = el('table', { class: 'md31-tabel' }, el('tr', null, ['Server', 'Tagar', 'A', 'B', 'C', 'D', 'Jumlah'].map((h) => el('th', null, h))),
    order.map((t) => { blanks[t] = el('span', { class: 'md31-celah', 'data-drop': t }, '?'); return el('tr', { class: `g${ruleGroup(t)}` }, el('td', null, String(ruleGroup(t) + 1)), el('td', null, `#${t}`), per.map((c) => el('td', null, String(c[t] || 0))), el('td', null, blanks[t])); }),
    el('tr', { class: 'md31-jumlah' }, el('td', { colspan: 6 }, 'Semua kemunculan'), sumCell));
  const chips = ctx.rand.shuffle([...TAGS.map((t) => tot[t]), ...REDUCE_DECOYS]);
  const tray = el('div', { class: 'md31-angka-angka' }, chips.map((n) => el('div', { class: 'md31-angka', 'data-drag': String(n) }, String(n))));
  const board = el('div', { class: 'md31-dua' }, table, tray);
  dnd(board, (chip, blank) => {
    if (!left || blank.classList.contains('isi')) return;
    const t = blank.dataset.drop; const n = +chip.dataset.drag;
    if (n !== tot[t]) { oops(); shake(chip); say(msg, 'bad', `#${t}: ${per.map((c) => c[t] || 0).join(' + ')} bukan ${n}.`); return; }
    blank.textContent = String(n); blank.classList.add('isi'); chip.remove(); ctx.sound.tap(); left--;
    if (left) { say(msg, '', `#${t}: ${per.map((c) => c[t] || 0).join(' + ')} = ${n}.`); return; }
    sumCell.textContent = '96';
    say(msg, '', 'Reduce selesai: 96 kemunculan. Tiga teratas: festivalwanasari 26, kulinerwanasari 17, panggungrakyat 14.'); done();
  });
  area.append(board, msg);
}

// Misi 3: three look-alike accounts pumped #panggungrakyat; catch all eight posts.
function fakeRound(area, ctx, { oops, done }) {
  const cards = partCards(3); let left = FAKE_IDS.length; const found = new Set();
  const msg = msg31('panggungrakyat naik ke nomor 3. Selidiki bagian D: ketuk setiap unggahan dari akun siluman.');
  const trend = el('div', { class: 'md31-trend-kecil' });
  const drawTrend = (cleaned) => { const R = ranking(count(cleaned ? clean(true) : CARDS)).slice(0, 4); fill(trend, el('b', null, cleaned ? '📈 Setelah dibersihkan' : '📈 Trending sekarang'), R.map(([t, n], i) => el('div', { class: `md31-tkecil ${t === 'panggungrakyat' ? 'curiga' : ''}` }, el('em', null, String(i + 1)), el('span', null, `#${t}`), el('b', null, String(n))))); };
  const grid = el('div', { class: 'md31-unggah-unggah' }, cards.map((c) => onTap(el('button', { class: 'md31-unggah', type: 'button', 'data-n': c[0] }, el('span', { class: 'md31-akun' }, `${c[0]} · ${c[1]}`), el('span', null, c[3]), el('small', null, c[4])), (e) => {
    if (!left || found.has(c[0])) return;
    if (!FAKE_IDS.includes(c[0])) { oops(); shake(e.currentTarget); say(msg, 'bad', `${c[1]} unggahan asli: isinya berbeda dari yang lain.`); return; }
    found.add(c[0]); e.currentTarget.classList.add('palsu'); ctx.sound.tap(); left--;
    if (left) { say(msg, '', `Tertangkap ${found.size} dari 8.`); return; }
    drawTrend(true); say(msg, '', 'Delapan kalimat sama dari tiga akun yang dibuat sehari sebelum festival. Setelah dibuang: festivalwanasari 26, kulinerwanasari 17, macetalunalun 12.'); done();
  })));
  drawTrend(false);
  area.append(el('div', { class: 'md31-dua' }, grid, trend), msg);
}

// Misi 4: fill the lane times, then watch the race.
function raceRound(area, ctx, { oops, stages, done }) {
  let s = 0;
  const msg = msg31('Seret waktu ke setiap lintasan. Waktu tambahan (kirim, jumlah, lapor) selalu 4 menit.');
  function stage() {
    const st = stages[s]; let left = st.lanes.length + (st.extra ? 1 : 0); let busy = false;
    const runners = [];
    const lane = ([who, formula, want, val]) => { const runner = el('i', { class: 'md31-pelari' }); runners.push([runner, val]); return el('div', { class: 'md31-lintasan' }, el('b', null, who), el('small', null, formula), el('span', { class: 'md31-celah', 'data-drop': want }, '?'), el('div', { class: 'md31-jalur' }, runner, el('span', { class: 'md31-finis' }, '🏁'))); };
    const rows = [...st.lanes.map(lane), st.extra ? el('div', { class: 'md31-lintasan tambah' }, el('b', null, st.extra[0]), el('small', null, st.extra[1]), el('span', { class: 'md31-celah', 'data-drop': st.extra[2] }, '?')) : null];
    const tray = el('div', { class: 'md31-angka-angka' }, ctx.rand.shuffle(st.chips.map((c, i) => [c, i])).map(([c, i]) => el('div', { class: 'md31-angka', 'data-drag': String(i) }, c)));
    const board = el('div', { class: 'md31-papan' }, el('div', { class: 'md31-balap' }, el('b', { class: 'md31-balap-judul' }, `🏎 ${st.head}`), rows), tray);
    dnd(board, (chip, blank) => {
      if (busy || blank.classList.contains('isi')) return;
      const c = st.chips[+chip.dataset.drag];
      if (c !== blank.dataset.drop) { oops(); shake(chip); say(msg, 'bad', `${blank.parentElement.querySelector('small').textContent}: hitung lagi.`); return; }
      blank.textContent = c; blank.classList.add('isi'); chip.remove(); ctx.sound.tap();
      if (--left) { say(msg, '', 'Tepat.'); return; }
      busy = true; const mx = Math.max(...runners.map((r) => r[1]));
      for (const [r, v] of runners) { r.style.setProperty('--t', `${(2.6 * v) / mx}s`); r.classList.add('lari'); }
      say(msg, '', st.end);
      s++; setTimeout(() => { if (s < stages.length) stage(); else done(); }, 3800);
    });
    area.replaceChildren(board, msg);
  }
  stage();
}

// Misi 5: match each trait card to the statement it describes.
function traitRound(area, ctx, { oops, done }) {
  const msg = msg31('VO volume, KE kecepatan, RA keragaman, BE kebenaran, NI nilai.'); let left = TRAITS.length;
  const rows = TRAITS.map(([k, t]) => el('div', { class: 'md31-ciri-baris', 'data-drop': k }, el('span', { class: 'md31-ciri-slot' }, '?'), el('span', null, t)));
  const tray = el('div', { class: 'md31-ciri-ciri' }, ctx.rand.shuffle(Object.entries(TRAIT_NAME)).map(([k, n]) => el('div', { class: `md31-ciri c-${k}`, 'data-drag': k }, el('b', null, k), el('small', null, n))));
  const board = el('div', { class: 'md31-papan' }, el('div', { class: 'md31-ciri-daftar' }, rows), tray);
  dnd(board, (card, row) => {
    if (!left || row.classList.contains('isi')) return;
    const want = TRAITS.find((x) => x[0] === row.dataset.drop)[2];
    if (card.dataset.drag !== want) { oops(); shake(card); say(msg, 'bad', 'Belum tepat. Ukurannya, kecepatan datangnya, bentuknya, benar-tidaknya, atau manfaatnya?'); return; }
    card.classList.add('locked'); row.querySelector('.md31-ciri-slot').replaceWith(card); row.classList.add('isi'); ctx.sound.tap(); left--;
    if (left) { say(msg, '', `${want}: ${TRAIT_NAME[want]}.`); return; }
    say(msg, '', 'Lima ciri lengkap: volume, kecepatan, keragaman, kebenaran, dan nilai.'); done();
  });
  area.append(board, msg);
}

// Misi Bos: the privacy gate, then hide the quiet squares on the crowd map.
function privacyBoss(area, ctx, { oops, done }) {
  const msg = msg31('Dinas Pariwisata meminta lima data. Seret setiap permintaan: lewat gerbang atau ditahan.'); let left = PRIVACY.length;
  const bins = [['A', '✅ Lewat gerbang'], ['T', '⛔ Ditahan']].map(([k, l]) => el('div', { class: `md31-gerbang g-${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'md31-gerbang-isi' })));
  const tray = el('div', { class: 'md31-baki satu' }, ctx.rand.shuffle(PRIVACY.slice()).map(([k, t]) => el('div', { class: 'md31-minta', 'data-drag': k }, t)));
  const board = el('div', { class: 'md31-dua' }, tray, el('div', { class: 'md31-gerbang-gerbang' }, bins));
  dnd(board, (card, bin) => {
    if (!left) return;
    const p = PRIVACY.find((x) => x[0] === card.dataset.drag);
    if (p[2] !== bin.dataset.drop) { oops(); shake(card); say(msg, 'bad', p[3]); return; }
    card.classList.add('locked'); bin.querySelector('.md31-gerbang-isi').append(el('span', { class: 'md31-cap' }, p[1].split(' ').slice(0, 4).join(' ') + '…')); card.remove(); ctx.sound.tap(); left--;
    say(msg, '', p[3]);
    if (!left) setTimeout(heat, 1800);
  });
  area.append(board, msg);
  function heat() {
    let hide = HEAT.filter((h) => h[1] < 20).length;
    say(msg, 'info', 'Peta keramaian lolos dengan satu syarat: kotak dengan kurang dari 20 unggahan harus ditutup. Ketuk kotak itu.');
    const map = el('div', { class: 'md31-peta' }, HEAT.map(([name, n]) => onTap(el('button', { class: 'md31-sel', type: 'button', 'data-n': n, style: { '--panas': Math.min(1, n / 200) } }, el('b', null, String(n)), el('small', null, name)), (e) => {
      const b = e.currentTarget; if (!hide || b.classList.contains('tutup')) return;
      if (n >= 20) { oops(); shake(b); say(msg, 'bad', `${name}: ${n} unggahan cukup ramai, tidak menunjuk orang tertentu.`); return; }
      b.classList.add('tutup'); ctx.sound.tap(); hide--;
      if (hide) return;
      say(msg, '', 'Peta aman dibagikan: tempat sepi disembunyikan, sehingga tidak ada pengunggah yang bisa dikenali. Pusat data selesai!'); done();
    })));
    area.replaceChildren(map, msg);
  }
}

export default {
  id: 'sma-31-mahadata',
  title: 'Menghitung Trending Topik',
  topic: 'Mahadata dan map–reduce: membersihkan data, membagi beban, waktu paralel, ciri mahadata, dan privasi',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '📈',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Pusat Data Trending: jadilah server yang menghitung 60 unggahan Festival Budaya Wanasari dengan map–reduce, seimbangkan beban, tangkap akun siluman, balapan melawan Komputer Tunggal, dan jaga privasi warga.',
  extraModes: [
    { id: 'simulasi', icon: '🗂', label: 'Simulasi Map–Reduce', desc: 'Empat pekerja memproses 60 kartu bersamaan; nyalakan atau matikan "Samakan huruf" dan "Buang akun palsu", atur pembagian tagar, dan bandingkan waktunya', create: createSim },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Map Antartim', desc: 'Tim bergiliran memetakan satu kartu: tulis tagarnya dengan huruf kecil dan kirim ke kelompok yang benar; setiap tagar benar 1 poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act md31-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const area = el('div', { class: 'md31-area' });
      const go = (k, no) => wrap.append(misiHead(no, ...HEAD31[k], '📈'), area);
      const fin = (ms) => ({ oops: () => ctx.mistake(), done: () => next(ms) });
      if (r === 0) { go('map', 1); mapRound(area, ctx, fin(6000)); }
      else if (r === 1) { go('ejaan', 1); mergeRound(area, ctx, fin(6000)); }
      else if (r === 2) { go('kurir', 2); courierRound(area, ctx, fin(6000)); }
      else if (r === 3) { go('imbang', 2); balanceRound(area, ctx, fin(6000)); }
      else if (r === 4) { go('reduce', 3); reduceRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('siluman', 3); fakeRound(area, ctx, fin(6500)); }
      else if (r === 6) { go('balap1', 4); raceRound(area, ctx, { stages: RACES[0], ...fin(1500) }); }
      else if (r === 7) { go('balap2', 4); raceRound(area, ctx, { stages: RACES[1], ...fin(1500) }); }
      else if (r === 8) { go('ciri', 5); traitRound(area, ctx, fin(5500)); }
      else { go('bos', 'Bos'); privacyBoss(area, ctx, fin(7000)); }
    }
    render();
  },
};

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act mahadata' });
  root.append(wrap);
  const opt = { lower: true, dropFake: false, custom: false };
  const assign = Object.fromEntries(TAGS.map((t) => [t, ruleGroup(t)]));
  let timer = null; let nCards = 60;
  function start() {
    clearInterval(timer); timer = null;
    const cards = clean(opt.dropFake); const parts = PARTS.map((_, p) => partCards(p, cards));
    const groupOf = (t) => (opt.custom && t.toLowerCase() in assign ? assign[t.toLowerCase()] : ruleGroup(t));
    const tally = {}; const load = [0, 0, 0, 0]; const done = [0, 0, 0, 0]; let tick = 0;
    const workers = el('div', { class: 'mr-pekerja' });
    const reducers = el('div', { class: 'mr-kotak-kotak' });
    const trend = el('div', { class: 'mr-trend-wadah' });
    const drawWorkers = (fresh = []) => workers.replaceChildren(...parts.map((pc, p) => el('div', { class: 'mr-pk' }, el('b', null, `Pekerja ${PARTS[p][0]}`), el('small', null, `kartu ${done[p]}/${pc.length}`), el('div', { class: 'mr-batang' }, el('i', { style: { width: `${pc.length ? (done[p] / pc.length) * 100 : 0}%` } })), fresh[p] ? postCard(fresh[p], { lower: opt.lower, fake: true }) : el('div', { class: 'mr-kartu kosong' }, done[p] ? 'selesai' : 'siap'))));
    const drawReducers = (hot = []) => reducers.replaceChildren(...G.map((g, i) => el('div', { class: 'mr-kotak' }, el('b', null, `${g} ${opt.custom ? '' : `(${RULE[i]})`}`), el('div', { class: 'mr-chips' }, Object.entries(tally).filter(([t]) => groupOf(t) === i).sort((a, b) => b[1] - a[1]).map(([t, n]) => el('span', { class: `mr-chip ${hot.includes(t) ? 'baru' : ''}` }, `${t} ${n}`))), el('div', { class: 'mr-batang beban' }, el('i', { style: { width: `${Math.min(100, (load[i] / 40) * 100)}%` } })), el('small', null, `${load[i]} kertas`))));
    const drawTrend = () => trend.replaceChildren(Object.keys(tally).length ? trendTable(Object.fromEntries(ranking(tally).slice(0, 8)), `${Object.keys(tally).length} tagar berbeda · ${cards.length} kartu`) : el('p', { class: 'mr-kosong' }, 'Daftar trending muncul setelah map–reduce berjalan.'));
    const step = () => {
      const fresh = []; const hot = [];
      parts.forEach((pc, p) => { if (done[p] < pc.length) { const c = pc[done[p]++]; fresh[p] = c; for (const t of tagsOf(c, opt.lower)) { tally[t] = (tally[t] || 0) + 1; load[groupOf(t)]++; hot.push(t); } } });
      drawWorkers(fresh); drawReducers(hot); drawTrend(); tick++;
      if (parts.every((pc, p) => done[p] >= pc.length)) { clearInterval(timer); timer = null; ctx.sound.good(); say(msg, '', `Selesai dalam ${tick} langkah paralel. Beban: ${load.join(', ')} kertas.${opt.lower ? '' : ' Huruf tidak disamakan: tagar yang sama terpecah!'}`); }
    };
    const msg = el('p', { class: 'reveal info' }, 'Setiap langkah, keempat pekerja membaca satu kartu bersamaan.');
    const tog = (key, label) => onTap(el('button', { class: `seg-btn ${opt[key] ? 'on' : ''}`, type: 'button' }, `${opt[key] ? '☑' : '☐'} ${label}`), () => { opt[key] = !opt[key]; ctx.sound.tap(); start(); });
    const custom = el('div', { class: 'mr-atur' }, opt.custom ? [el('small', null, 'Ketuk tagar untuk memindahkan kelompoknya:'), ...TAGS.map((t) => onTap(el('button', { class: `mr-chip g${assign[t]}`, type: 'button' }, `${SHORT[t]} → ${assign[t] + 1}`), () => { assign[t] = (assign[t] + 1) % 4; start(); }))] : []);
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Simulasi map–reduce'),
      el('div', { class: 'mr-kendali' }, tog('lower', 'Samakan huruf'), tog('dropFake', 'Buang akun palsu'), tog('custom', 'Atur pembagian sendiri'), button('▶ Jalankan', () => { if (!timer && tick === 0) timer = setInterval(step, 450); }, 'primary'), button('⏭ Satu langkah', () => { if (!timer) step(); }), button('↺ Ulang', start)),
      custom, el('div', { class: 'mr-sim' }, el('div', { class: 'mr-kiri' }, workers, reducers), el('div', { class: 'mr-kanan' }, trend, timeBox())), msg);
    drawWorkers(); drawReducers(); drawTrend();
  }
  function timeBox() {
    const box = el('div', { class: 'mr-waktu' });
    const draw = () => {
      const one = nCards * 12; const four = (nCards / 4) * 12 + 240;
      box.replaceChildren(el('b', null, 'Pembanding waktu (12 detik per kartu):'), el('div', { class: 'seg' }, [60, 600, 60000].map((n) => onTap(el('button', { class: `seg-btn ${n === nCards ? 'on' : ''}`, type: 'button' }, `${fmtNum(n)} kartu`), () => { nCards = n; draw(); }))),
        el('div', { class: 'mr-bbaris' }, el('span', null, '1 orang'), el('div', { class: 'mr-batang' }, el('i', { style: { width: '100%' } })), el('b', null, fmtDur(one))),
        el('div', { class: 'mr-bbaris' }, el('span', null, '4 kelompok'), el('div', { class: 'mr-batang' }, el('i', { style: { width: `${(four / one) * 100}%` } })), el('b', null, fmtDur(four))),
        el('small', null, `${fmtNum(one / four, 1)} kali lebih cepat. Waktu tambahan 4 menit (pengelompokan, reduce, laporan) terasa besar untuk data kecil dan kecil untuk data besar.`));
    };
    draw();
    return box;
  }
  start();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act mahadata' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const deck = ctx.rand.shuffle(CARDS.filter((c) => tagsOf(c).length > 1)).slice(0, nT * 3); let k = 0;
    function turn() {
      if (k >= deck.length) { finishBoard(wrap, ctx, { title: 'Map antartim selesai', pts, again: () => pickTeams(wrap, 'Map Antartim', start) }); return; }
      const t = k % nT; const c = deck[k]; const raw = tagsOf(c, false); const pick = {};
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: kirim setiap tagar (huruf kecil) ke kelompoknya. a–f 1, g–m 2, n–r 3, s–z 4.`);
      const rows = el('div', { class: 'mr-pilih' });
      const draw = () => rows.replaceChildren(...raw.map((r, i) => { const low = r.toLowerCase(); const g = ruleGroup(low); return el('div', { class: `mr-pbaris ${i in pick ? (pick[i] === g ? 'beres' : 'salah') : ''}` }, el('span', null, i in pick ? `#${r} → #${low}` : `#${r}`), i in pick ? el('b', null, `${G[g]}${pick[i] === g ? ' ✓' : ` (bukan ${pick[i] + 1})`}`) : el('div', { class: 'seg' }, G.map((_, j) => onTap(el('button', { class: 'seg-btn', type: 'button' }, `${j + 1} (${RULE[j]})`), () => {
        if (i in pick) return; pick[i] = j; const ok = j === g; if (ok) pts[t] += 1; ctx.sound[ok ? 'good' : 'bad'](); draw(); wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, t));
        if (Object.keys(pick).length === raw.length) { say(msg, '', `Kartu ${c[0]} selesai.`); k++; setTimeout(turn, 2200); }
      })))); }));
      draw();
      wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: kartu ${c[0]}`), el('div', { class: 'mr-tumpuk kecil satu' }, el('div', { class: 'mr-kartu besar' }, el('b', null, c[0]), el('span', { class: 'mr-akun' }, c[1]), el('span', null, `${c[2]} · ${c[3]}`), el('span', { class: 'mr-tagar' }, c[4]))), rows, msg);
    }
    turn();
  }
  pickTeams(wrap, 'Map Antartim', start);
}
