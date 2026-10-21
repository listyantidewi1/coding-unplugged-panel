// Menghitung Trending Topik — SMA/SMK (16–18 tahun), mahadata dan map–reduce.
// Sixty festival posts are split over four workers: map counts tags per part,
// grouping sends each count to the worker that owns the tag's first letter, and
// reduce adds them up. Then cleaning, fake accounts, timing, big-data traits and privacy.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

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

function stepper(value, onChange) {
  const v = el('b', null, String(value));
  const set = (d) => { value = Math.max(0, value + d); v.textContent = String(value); onChange(value); };
  return el('div', { class: 'mr-stepper' }, button('−', () => set(-1)), v, button('+', () => set(1)));
}

function pickRows(wrap, ctx, { prompt, rows, opts, why, done, info, cls = '' }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `mr-pilih ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, a, w]) => el('div', { class: `mr-pbaris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, opts.find((o) => o[0] === a)[1]) : el('div', { class: 'seg' }, opts.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', why ? why(k, a, false) : 'Belum tepat.'); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', w || (why ? why(k, a, true) : 'Tepat.')); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1500);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function mapRound(wrap, ctx, { part, done }) {
  const cards = partCards(part); const want = count(cards); const got = Object.fromEntries(TAGS.map((t) => [t, 0]));
  const msg = el('p', { class: 'reveal info' }, 'Tulis setiap tagar dengan huruf kecil, lalu hitung kemunculannya.');
  const sum = el('b', null, '0');
  const table = el('div', { class: 'mr-isian' }, TAGS.map((t) => el('div', { class: 'mr-isi', 'data-t': t }, el('span', null, t), stepper(0, (v) => { got[t] = v; sum.textContent = String(Object.values(got).reduce((a, b) => a + b, 0)); }))), el('div', { class: 'mr-isi jumlah' }, el('span', null, 'Jumlah'), sum));
  const check = button('Periksa hasil map', () => {
    const wrong = TAGS.filter((t) => got[t] !== (want[t] || 0));
    for (const r of table.querySelectorAll('.mr-isi[data-t]')) r.classList.toggle('salah', wrong.includes(r.dataset.t));
    if (wrong.length) { ctx.mistake(); shake(table); say(msg, 'bad', `${wrong.length} tagar belum tepat (ditandai merah). Ingat: #FESTIVALWANASARI dan #FestivalWanasari adalah tagar yang sama.`); return; }
    for (const r of table.querySelectorAll('.mr-isi')) r.classList.add('beres');
    ctx.sound.good(); check.disabled = true; say(msg, '', `Map bagian ${PARTS[part][0]}: ${TAGS.map((t) => `${SHORT[t]} ${want[t] || 0}`).join(', ')}; jumlah ${cards.reduce((a, c) => a + tagsOf(c).length, 0)}.`); done();
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, `Tahap map: bagian ${PARTS[part][0]} (kartu ${PARTS[part][1]}–${PARTS[part][2]})`), el('div', { class: 'mr-dua' }, el('div', { class: 'mr-tumpuk' }, cards.map((c) => postCard(c))), el('div', { class: 'mr-kanan' }, table, check)), msg);
}

function reduceRound(wrap, ctx, { done }) {
  const per = PARTS.map((_, p) => count(partCards(p))); const tot = count(CARDS); const ok = {};
  const msg = el('p', { class: 'reveal info' }, 'Setiap kelompok menjumlahkan kertas yang diterimanya untuk setiap tagar.');
  const host = el('table', { class: 'mr-tabel' });
  const draw = () => host.replaceChildren(el('tr', null, ['Tagar', 'Kelompok', 'Dari A', 'Dari B', 'Dari C', 'Dari D', 'Jumlah'].map((h) => el('th', null, h))), ...TAGS.map((t) => {
    const opts = [...new Set([tot[t], tot[t] - 2, tot[t] + 1, tot[t] + 3])].sort((a, b) => a - b);
    return el('tr', null, el('td', null, t), el('td', null, String(ruleGroup(t) + 1)), per.map((c) => el('td', null, String(c[t] || 0))), el('td', { class: t in ok ? 'ya' : '' }, t in ok ? String(tot[t]) : el('div', { class: 'seg' }, opts.map((v) => onTap(el('button', { class: 'seg-btn', type: 'button' }, String(v)), () => {
      if (v !== tot[t]) { ctx.mistake(); say(msg, 'bad', `${t}: jumlahkan keempat angka di barisnya.`); return; }
      ok[t] = true; ctx.sound.tap(); draw();
      if (Object.keys(ok).length === TAGS.length) { say(msg, '', 'Reduce selesai: jumlah semua kemunculan 96.'); done(); }
    })))));
  }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Tahap reduce: jumlahkan hasil keempat bagian'), host, msg);
}

function loadBars(L, max = 40) {
  return el('div', { class: 'mr-beban' }, L.map((n, i) => el('div', { class: 'mr-bbaris' }, el('span', null, G[i]), el('div', { class: 'mr-batang' }, el('i', { style: { width: `${Math.min(100, (n / max) * 100)}%` } })), el('b', null, `${n} kertas`))));
}

function balanceRound(wrap, ctx, { done }) {
  const tot = count(CARDS); const assign = Object.fromEntries(TAGS.map((t) => [t, ruleGroup(t)]));
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tagar untuk memindahkannya ke kelompok lain. Usahakan setiap kelompok menerima sekitar 24 kertas.');
  const host = el('div', { class: 'mr-imbang' });
  let finished = false;
  const draw = () => { const L = loads(tot, assign); host.replaceChildren(el('div', { class: 'mr-kotak-kotak' }, G.map((g, i) => el('div', { class: 'mr-kotak' }, el('b', null, g), TAGS.filter((t) => assign[t] === i).map((t) => onTap(el('button', { class: 'mr-chip', type: 'button' }, `${t} ${tot[t]}`), () => { if (finished) return; assign[t] = (assign[t] + 1) % 4; ctx.sound.tap(); draw(); }))))), loadBars(L)); };
  draw();
  const check = button('Periksa keseimbangan', () => {
    const L = loads(tot, assign); const mx = Math.max(...L);
    if (mx > 26 || Math.min(...L) < 20) { ctx.mistake(); shake(host); say(msg, 'bad', `Beban terbesar ${mx} dan terkecil ${Math.min(...L)} kertas. Usahakan semua antara 20 dan 26.`); return; }
    finished = true; check.disabled = true; ctx.sound.good(); say(msg, '', `Seimbang: ${L.join(', ')} kertas. festivalwanasari (26) sebaiknya sendirian, lalu tagar lain dipasangkan.`); done();
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, 'Bagi tagar ke empat kelompok supaya bebannya seimbang'), host, check, msg);
}

function trendTable(totals, note = null) {
  const R = ranking(totals); const mx = R[0][1];
  return el('div', { class: 'mr-trend' }, R.map(([t, n]) => el('div', { class: 'mr-tbaris' }, el('span', null, `#${t}`), el('div', { class: 'mr-batang' }, el('i', { style: { width: `${(n / mx) * 100}%` } })), el('b', null, String(n)))), note ? el('small', null, note) : null);
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
  goal: 'Bantu Dinas Pariwisata Wanasari menemukan topik yang paling ramai dibicarakan di Festival Budaya: hitung 60 unggahan dengan map–reduce, bersihkan datanya, dan jaga privasi warga.',
  extraModes: [
    { id: 'simulasi', icon: '🗂', label: 'Simulasi Map–Reduce', desc: 'Empat pekerja memproses 60 kartu bersamaan; nyalakan atau matikan "Samakan huruf" dan "Buang akun palsu", atur pembagian tagar, dan bandingkan waktunya', create: createSim },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Map Antartim', desc: 'Tim bergiliran memetakan satu kartu: tulis tagarnya dengan huruf kecil dan kirim ke kelompok yang benar; setiap tagar benar 1 poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act mahadata' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const tot = count(CARDS);
      if (r === 0) mapRound(wrap, ctx, { part: 0, done: next });
      else if (r === 1) ask('Ada berapa cara penulisan tagar festivalwanasari pada keenam puluh kartu?', [[2], [3], [4, true], [5]], 4, el('div', { class: 'mr-tumpuk kecil' }, CARDS.filter((c) => /festivalwanasari/i.test(c[4])).slice(0, 18).map((c) => postCard(c))),
        then(() => ask('Tanpa menyamakan huruf, #FestivalWanasari terhitung 10 kali dan #PanggungRakyat 8 kali. Mengapa hasil ini menyesatkan?', [['Satu tagar terpecah menjadi beberapa hitungan; setelah disamakan, festivalwanasari muncul 26 kali', true], ['Karena huruf besar lebih penting'], ['Karena 10 dan 8 terlalu kecil untuk dihitung'], ['Tidak menyesatkan; huruf besar berarti tagar yang berbeda']], 1, trendTable(count(CARDS, false), 'Hitungan tanpa menyamakan huruf (sebagian)'))));
      else if (r === 2) pickRows(wrap, ctx, { prompt: 'Pengelompokan: kirim setiap tagar ke kelompok menurut huruf pertamanya', rows: TAGS.map((t) => [t, t, String(ruleGroup(t))]), opts: G.map((g, i) => [String(i), `${i + 1} (${RULE[i]})`]), info: 'a–f Kelompok 1, g–m Kelompok 2, n–r Kelompok 3, s–z Kelompok 4.', why: (k, a, ok) => (ok ? `${k} dimulai huruf "${k[0]}": ${G[+a]}.` : `Lihat huruf pertama "${k[0]}".`),
        done: then(() => ask('Bila setiap kemunculan dikirim di kertas tersendiri, berapa kertas yang diterima tiap kelompok?', [['Kelompok 1: 35, Kelompok 2: 29, Kelompok 3: 25, Kelompok 4: 7', true], ['Semua kelompok 24'], ['Kelompok 1: 26, Kelompok 2: 17, Kelompok 3: 14, Kelompok 4: 7'], ['Kelompok 1: 9, Kelompok 2: 26, Kelompok 3: 17, Kelompok 4: 12']], 1, el('pre', { class: 'mr-pre' }, TAGS.map((t) => `${t.padEnd(17)} ${String(tot[t]).padStart(2)} → ${G[ruleGroup(t)]}`).join('\n')))) });
      else if (r === 3) reduceRound(wrap, ctx, { done: next });
      else if (r === 4) balanceRound(wrap, ctx, { done: next });
      else if (r === 5) ask('Daftar trending: apa tiga tagar teratas?', [['festivalwanasari, kulinerwanasari, panggungrakyat', true], ['festivalwanasari, kulinerwanasari, macetalunalun'], ['festivalwanasari, panggungrakyat, paradebudaya'], ['kulinerwanasari, macetalunalun, sampahfestival']], 1, trendTable(tot),
        then(() => ask('Kartu 47, 48, 50, 52, 53, 55, 57, dan 59: apa persamaannya?', [['Isinya sama persis, hanya bertagar panggungrakyat, dan diunggah bergiliran oleh tiga akun bernama mirip', true], ['Semuanya foto parade'], ['Semuanya diunggah pengunjung dari luar kota'], ['Tidak ada persamaan']], 1, el('div', { class: 'mr-tumpuk kecil' }, CARDS.filter((c) => FAKE.includes(c[1])).map((c) => el('div', { class: 'mr-kartu' }, el('b', null, c[0]), el('span', { class: 'mr-akun' }, c[1]), el('span', null, c[3])))),
          then(() => ask('Akun @infopanggung dibuat sehari sebelum festival. Tanpa kedelapan kartu itu, apa tiga teratas?', [['festivalwanasari, kulinerwanasari, macetalunalun', true], ['festivalwanasari, kulinerwanasari, panggungrakyat'], ['festivalwanasari, macetalunalun, paradebudaya'], ['kulinerwanasari, panggungrakyat, macetalunalun']], 1, null,
            then(() => ask('Apa yang sebaiknya dilakukan Dinas Pariwisata berdasarkan hasil yang sudah dibersihkan?', [['Menambah kantong parkir dan jalur kendaraan umum karena kemacetan banyak dikeluhkan, serta mendukung stan kuliner', true], ['Menambah panggung karena panggungrakyat paling ramai'], ['Tidak mengubah apa pun'], ['Membeli lebih banyak akun untuk mempromosikan festival']], 1, trendTable(count(clean(true)), 'Setelah akun palsu dibuang'))))))));
      else if (r === 6) ask('Satu orang memerlukan 12 detik per kartu. Berapa menit untuk 60 kartu?', [[6], [7], [12, true], [15]], 4, null,
        then(() => ask('Empat kelompok: map 15 kartu, ditambah pengelompokan 2 menit, reduce 1 menit, laporan 1 menit. Berapa menit semuanya?', [[3], [4], [7, true], [12]], 4, null,
          then(() => ask('12 menit dibanding 7 menit: berapa kali lebih cepat, dan mengapa tidak 4 kali?', [['Sekitar 1,7 kali; ada waktu tambahan untuk mengantar kertas, menjumlahkan, dan melapor', true], ['4 kali, karena ada empat kelompok'], ['Sekitar 1,7 kali, karena kelompok bekerja lebih lambat daripada satu orang'], ['Tidak lebih cepat sama sekali']])))));
      else if (r === 7) ask('Untuk 60.000 kartu (waktu tambahan tetap 4 menit), berapa lama satu orang dan empat kelompok?', [['Satu orang 200 jam, empat kelompok sekitar 50 jam', true], ['Satu orang 12 jam, empat kelompok 7 jam'], ['Satu orang 200 jam, empat kelompok 100 jam'], ['Satu orang 20 jam, empat kelompok 5 jam']], 1, null,
        then(() => ask('Satu komputer memproses 10.000 unggahan per detik. Untuk 60 juta unggahan?', [['1 komputer 100 menit; 100 komputer 60 detik', true], ['1 komputer 6 menit; 100 komputer 6 detik'], ['1 komputer 100 detik; 100 komputer 1 detik'], ['1 komputer 10 jam; 100 komputer 6 menit']], 1, null,
          then(() => ask('Kapan pemrosesan paralel paling berguna?', [['Saat datanya sangat besar, sehingga waktu koordinasi kecil dibanding waktu mengolah data', true], ['Saat datanya sedikit'], ['Selalu, berapa pun ukuran datanya, pasti 4 kali lebih cepat'], ['Saat hanya ada satu komputer']])))));
      else if (r === 8) pickRows(wrap, ctx, { prompt: 'Ciri mahadata: pasangkan setiap pernyataan', rows: TRAITS.map(([k, t, a]) => [k, `${k}. ${t}`, a]), opts: Object.entries(TRAIT_NAME).map(([k, n]) => [k, `${k} ${n}`]), info: 'VO volume, KE kecepatan, RA keragaman, BE kebenaran, NI nilai.', why: (k, a, ok) => (ok ? `${a}: ${TRAIT_NAME[a]}.` : 'Ukuran, kecepatan datang, bentuk, benar-tidaknya, atau manfaatnya?'), done: next });
      else pickRows(wrap, ctx, { prompt: 'Privasi: data mana yang aman dibagikan ke Dinas Pariwisata?', rows: PRIVACY.map(([k, t, a, w]) => [k, `${k}. ${t}`, a, w]), opts: [['A', 'A · aman'], ['T', 'T · tidak aman']], info: 'Data gabungan biasanya aman; data yang menunjuk orang tertentu tidak.',
        done: then(() => ask('Mengapa kotak peta dengan kurang dari 20 unggahan tidak ditampilkan?', [['Orang yang mengunggah dari tempat sepi mudah dikenali', true], ['Supaya petanya lebih berwarna'], ['Karena datanya pasti palsu'], ['Supaya menghemat kertas']], 1, null,
          then(() => ask('Kelompokmu ingin mengumpulkan unggahan bertagar festivalwanasari dengan program. Mana yang membuat datanya terbuka, terpercaya, dan legal?', [['Memakai akses data resmi platform, hanya unggahan publik yang diperlukan, menyamarkan data pribadi, dan membuang akun palsu', true], ['Menyalin semua unggahan, termasuk akun yang dikunci'], ['Membeli data pengguna dari situs tidak resmi'], ['Menyimpan nama dan lokasi semua pengunggah selamanya']], 1, null,
            then(() => ask('Tantangan: pasangan tagar apa yang paling sering muncul bersama di satu kartu?', [['festivalwanasari + kulinerwanasari, 10 kali', true], ['festivalwanasari + macetalunalun, 10 kali'], ['batikwanasari + paradebudaya, 6 kali'], ['festivalwanasari + panggungrakyat, 8 kali']])))))) });
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
