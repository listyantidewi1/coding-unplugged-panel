// Arisan yang Jujur — SMA/SMK (16–18 tahun), protokol kriptografi sederhana.
// A neighbourhood savings-club draw: why the last speaker can cheat, sealed
// envelopes (hiding and binding), digital commitments with a toy hash and salt,
// a secret average passed around a circle, and what a protocol cannot protect.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

export const ANGGOTA = ['Bu Rina', 'Pak Joko', 'Bu Sari', 'Pak Bowo', 'Bu Tini', 'Pak Darto'];
export const winner = (nums, m = 6) => nums.reduce((s, x) => s + x, 0) % m;
const rp = (x) => `Rp${x.toLocaleString('id-ID')}`;
const num = (x) => x.toLocaleString('id-ID');

// The worksheet's made-up hash machine; other texts use a 16-bit FNV-1a code.
export const SIDIK = ['7C1E', '2A9F', 'E04B', '91D6', '5B38', 'C4F2'];
export function sidik(text) {
  const t = String(text).trim();
  if (/^[0-5]$/.test(t)) return SIDIK[Number(t)];
  let h = 0x811c9dc5;
  for (const c of new TextEncoder().encode(t)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; }
  return ((h >>> 16) ^ (h & 0xffff)).toString(16).toUpperCase().padStart(4, '0');
}
export const SALTED = '2-kursi-hijau-pelangi-87';

export const RAND = 1234567;
export const SAKU = [['Ani', 50000], ['Budi', 75000], ['Citra', 40000], ['Dodi', 60000], ['Eka', 100000]];
export function ring(r = RAND, saku = SAKU.map((s) => s[1])) { const out = []; let x = r; for (const s of saku) { x += s; out.push(x); } return out; }

export const RULES = [['Lima amplop sudah dibuka; Bu Rina melihat dirinya kalah lalu menolak membuka amplopnya.', 'Amplop yang tidak dibuka dianggap berisi 0, atau pemiliknya kehilangan hak menang bulan itu', 'mengikat'], ['Pak Joko menulis "2 atau 4", lalu memilih setelah melihat angka lain.', 'Amplop hanya boleh berisi satu angka 0–5; isi yang tidak sah dianggap 0', 'mengikat'], ['Amplop Bu Sari tipis, angkanya terlihat bila diterawang.', 'Amplop harus tebal atau kertas dilipat sampai tidak tembus pandang', 'menyembunyikan'], ['Pak Bowo menukar amplopnya setelah beberapa amplop dibuka.', 'Amplop ditandatangani di segelnya dan dipegang bersama di tengah meja sampai dibuka', 'mengikat']];
export const LIMITS = [['Pemenang ditentukan oleh angka anggota yang mengirim paling akhir.', true, 'Undian amplop terkunci: semua angka dikunci dulu, lalu dibuka bersama'], ['Pengelola arisan daring tak dikenal menjanjikan untung 50% sebulan, lalu kabur.', false, 'Ikut hanya dengan orang yang dikenal dan catatan terbuka; untung besar dalam waktu singkat tanda arisan bodong'], ['Seseorang mengaku pengurus dan meminta kode OTP di ponselmu.', false, 'Jangan pernah memberikan kode sekali pakai kepada siapa pun'], ['Anggota mengaku belum menerima kiriman uang, padahal sudah dikirim.', false, 'Simpan bukti transaksi dan catat setoran di catatan bersama'], ['Tangkapan layar saldo semua anggota beredar di grup.', false, 'Jangan bagikan tangkapan layar saldo; atur privasi akun dan grup']];

// --- pieces ---
const envelopes = (nums, open = true, names = ANGGOTA) => el('div', { class: 'aw-amplop-amplop' }, nums.map((x, i) => el('div', { class: `aw-amplop ${open ? 'buka' : ''}` }, el('span', { class: 'aw-ikon' }, open ? '📄' : '✉️'), el('b', null, open ? x : '🔒'), el('small', null, `${i}. ${names[i]}`))));
const sumLine = (nums, m = 6) => el('div', { class: 'aw-hitung' }, `${nums.join(' + ')} = ${nums.reduce((s, x) => s + x, 0)} · sisa bagi ${m} = ${winner(nums, m)}`);

function conspiracyRound(wrap, ctx, { done }) {
  const filled = { 0: 5 };
  const host = el('div', { class: 'aw-tabel' });
  const msg = el('p', { class: 'reveal info' }, 'Lima anggota menulis 1, 1, 1, 1, 1. Untuk setiap angka Bu Sari, ketuk pemenangnya.');
  let cur = 1;
  const draw = () => {
    host.replaceChildren(el('div', { class: 'aw-baris kepala' }, el('b', null, 'Angka Bu Sari'), ...[0, 1, 2, 3, 4, 5].map((x) => el('b', null, x))),
      el('div', { class: 'aw-baris' }, el('span', null, 'Jumlah'), ...[0, 1, 2, 3, 4, 5].map((x) => el('span', null, x in filled ? 5 + x : x === cur ? '?' : ''))),
      el('div', { class: 'aw-baris' }, el('span', null, 'Sisa bagi 6'), ...[0, 1, 2, 3, 4, 5].map((x) => el('span', null, x in filled ? (5 + x) % 6 : ''))),
      el('div', { class: 'aw-baris' }, el('span', null, 'Pemenang'), ...[0, 1, 2, 3, 4, 5].map((x) => el('span', { class: x in filled ? 'isi' : x === cur ? 'kini' : '' }, x in filled ? ANGGOTA[filled[x]] : ''))),
      cur <= 5 ? el('div', { class: 'seg' }, ANGGOTA.map((a, i) => onTap(el('button', { class: 'seg-btn', type: 'button' }, a), () => {
        const w = (5 + cur) % 6;
        if (i !== w) { ctx.mistake(); shake(host); say(msg, 'bad', `5 + ${cur} = ${5 + cur}, sisa bagi 6 = ${w}.`); return; }
        filled[cur] = w; cur++; ctx.sound.tap(); draw();
        if (cur > 5) { say(msg, '', 'Setiap anggota muncul tepat sekali.'); done(); }
      }))) : el('span'));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Persekongkolan supaya Pak Darto menang.'), host, msg);
  draw();
}

function matchRound(wrap, ctx, { done }) {
  const right = ctx.rand.shuffle(RULES.map((p) => p[1]));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'aw-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kejadian, lalu aturan tambahan yang menutup celahnya.');
  const draw = () => box.replaceChildren(el('div', { class: 'aw-kol' }, RULES.map(([l], i) => onTap(el('button', { class: `aw-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button' }, `${'abcd'[i]}. ${l}`), () => { if (!ok.has(i)) { sel = i; draw(); } }))),
    el('div', { class: 'aw-kol' }, right.map((r) => { const i = RULES.findIndex((p) => p[1] === r); return onTap(el('button', { class: `aw-item ${ok.has(i) ? 'cocok' : ''}`, type: 'button' }, r), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', 'Aturan itu tidak menutup celah kejadian ini.'); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === RULES.length) { say(msg, '', 'Semua celah tertutup.'); done(); }
    }); })));
  wrap.append(el('p', { class: 'prompt' }, 'Menutup celah: pasangkan kejadian dengan aturan tambahannya.'), box, msg);
  draw();
}

// Try numbers in the hash machine until one matches.
function guessHash(wrap, ctx, { target, done }) {
  const tried = [];
  const box = el('div', { class: 'aw-mesin' });
  const msg = el('p', { class: 'reveal info' }, `Bu Tini mengirim sidik ${target}. Masukkan angka ke mesin sidik sampai cocok.`);
  const draw = () => box.replaceChildren(el('div', { class: 'seg' }, [0, 1, 2, 3, 4, 5].map((x) => onTap(el('button', { class: `seg-btn ${tried.includes(x) ? 'on' : ''}`, type: 'button' }, `sidik("${x}")`), () => {
    if (tried.includes(x)) return; tried.push(x); ctx.sound.tap(); draw();
    if (sidik(String(x)) === target) { say(msg, '', `sidik("${x}") = ${target}. Bu Tini memilih ${x}, ditemukan setelah ${tried.length} percobaan.`); done(); } else say(msg, 'info', `sidik("${x}") = ${sidik(String(x))}, bukan ${target}.`);
  }))), el('div', { class: 'aw-sidik' }, tried.map((x) => el('code', { class: sidik(String(x)) === target ? 'cocok' : '' }, `${x} → ${sidik(String(x))}`))));
  wrap.append(el('p', { class: 'prompt' }, 'Amplop digital: tebak angka Bu Tini dari sidiknya.'), box, msg);
  draw();
}

// Check two openings against the hashes sent earlier.
function verifyRound(wrap, ctx, { done }) {
  const cases = [['Bu Tini', sidik(SALTED), SALTED, true], ['Pak Bowo', sidik('3-meja-biru-hujan-42'), '5-meja-biru-hujan-42', false]];
  const res = {};
  const box = el('div', { class: 'aw-buka' });
  const msg = el('p', { class: 'reveal info' }, 'Masukkan teks pembukaan ke mesin sidik, bandingkan dengan sidik yang dikirim sebelumnya, lalu putuskan.');
  const shown = {};
  const draw = () => box.replaceChildren(...cases.map(([who, sent, text, honest], i) => el('div', { class: `aw-kasus ${i in res ? 'beres' : ''}` }, el('b', null, who), el('span', null, `Sidik terkirim: ${sent}`), el('span', null, `Pembukaan: ${text}`),
    shown[i] ? el('code', { class: sidik(text) === sent ? 'cocok' : 'beda' }, `sidik = ${sidik(text)}`) : onTap(el('button', { class: 'seg-btn', type: 'button' }, '⚙️ Hitung sidik'), () => { shown[i] = true; ctx.sound.tap(); draw(); }),
    i in res ? el('small', null, honest ? '✓ Jujur: angkanya tidak diganti' : '✗ Mengganti angka: sidiknya tidak cocok') : el('div', { class: 'seg' }, [[true, 'Jujur'], [false, 'Mengganti angka']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (!shown[i]) { say(msg, 'bad', 'Hitung sidiknya dulu.'); shake(box); return; }
      if (v !== honest) { ctx.mistake(); shake(box); say(msg, 'bad', 'Bandingkan kedua sidik sekali lagi.'); return; }
      res[i] = v; ctx.sound.tap(); draw();
      if (Object.keys(res).length === cases.length) { say(msg, '', 'Sidik yang sama berarti teksnya sama; hampir mustahil menemukan teks lain dengan sidik yang sama.'); done(); }
    }))))));
  wrap.append(el('p', { class: 'prompt' }, 'Pembukaan amplop digital: siapa yang jujur?'), box, msg);
  draw();
}

function ringSvg(papers, hide = []) {
  const P = [[400, 70], [640, 200], [550, 400], [250, 400], [160, 200]];
  const arrows = P.map(([x1, y1], i) => { const [x2, y2] = P[(i + 1) % 5]; const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2; const t = papers[i]; return `<line x1="${x1 + (x2 - x1) * 0.2}" y1="${y1 + (y2 - y1) * 0.2}" x2="${x1 + (x2 - x1) * 0.8}" y2="${y1 + (y2 - y1) * 0.8}" stroke="#94a3b8" stroke-width="4" marker-end="url(#aw-panah)"/><rect x="${mx - 78}" y="${my - 20}" width="156" height="40" rx="8" fill="${t == null ? '#fff' : '#fef9c3'}" stroke="#ca8a04" stroke-width="2"/><text x="${mx}" y="${my + 8}" font-size="22" font-weight="800" text-anchor="middle" fill="#0f172a">${t == null ? '?' : hide.includes(i) ? '▒▒▒' : num(t)}</text>`; });
  const people = P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="42" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><text x="${x}" y="${y + 8}" font-size="24" font-weight="900" text-anchor="middle" fill="#0c4a6e">${SAKU[i][0]}</text>`);
  return `<svg viewBox="80 10 640 450" role="img" aria-label="Lingkaran kertas"><defs><marker id="aw-panah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#64748b"/></marker></defs>${arrows.join('')}${people.join('')}</svg>`;
}
const ringBox = (papers, hide) => { const b = el('div', { class: 'aw-lingkar' }); b.innerHTML = ringSvg(papers, hide); return b; };

function limitsRound(wrap, ctx, { done }) {
  const ans = {};
  const box = el('div', { class: 'aw-batas' });
  const msg = el('p', { class: 'reveal info' }, 'Bisakah protokol undian mencegah kejadian ini?');
  const draw = () => box.replaceChildren(...LIMITS.map(([t, yes, fix], i) => el('div', { class: `aw-batas-baris ${i in ans ? (yes ? 'ya' : 'tidak') : ''}` }, el('span', null, `${'abcde'[i]}. ${t}`),
    i in ans ? el('small', null, `${yes ? 'Ya' : 'Tidak'} · ${fix}`) : el('div', { class: 'seg' }, [[true, 'Ya'], [false, 'Tidak']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (v !== yes) { ctx.mistake(); shake(box); say(msg, 'bad', yes ? 'Inilah celah yang ditutup amplop terkunci.' : 'Protokol undian hanya mengatur cara memilih pemenang.'); return; }
      ans[i] = v; ctx.sound.tap(); draw();
      if (Object.keys(ans).length === LIMITS.length) { say(msg, '', 'Protokol membuat undian adil, tetapi penipuan, OTP, bukti transfer, dan privasi butuh perlindungan lain.'); done(); }
    }))))));
  wrap.append(el('p', { class: 'prompt' }, 'Batas perlindungan protokol.'), box, msg);
  draw();
}

export default {
  id: 'sma-22-arisan-jujur',
  title: 'Arisan yang Jujur',
  topic: 'Protokol keamanan: undian adil, amplop terkunci (komitmen), fungsi hash dan garam, serta komputasi rahasia bersama',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '✉️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menemukan celah pada undian yang bergantung pada satu orang atau orang terakhir, menghitung undian amplop terkunci dan menunjukkan bahwa persekongkolan tidak berguna selama satu anggota jujur, merumuskan sifat menyembunyikan dan mengikat, memakai sidik dengan garam sebagai amplop digital, menghitung rata-rata rahasia, dan membedakan apa yang bisa dan tidak bisa dilindungi sebuah protokol.',
  extraModes: [
    { id: 'undian', icon: '✉️', label: 'Undian Amplop', desc: '4–6 pemain bergiliran memasukkan angka rahasia; amplop terkunci, lalu dibuka bersama dan pemenang dihitung', create: createDraw },
    { id: 'curang', icon: '🎭', label: 'Coba Curang', desc: 'Atur angka para pencurang dan lihat peluang setiap anggota menang, dengan cara "orang terakhir" dan dengan amplop terkunci', create: createCheat },
    { id: 'sidik', icon: '🔏', label: 'Sidik Digital', desc: 'Mesin sidik rekaan: tebak angka dari sidik tanpa garam dan dengan garam, lalu periksa pembukaan', create: createHash },
    { id: 'rata', icon: '⭕', label: 'Rata-rata Rahasia', desc: 'Simulasi duduk melingkar: lihat kertas yang diterima setiap pemain dan apa yang terbongkar bila dua pemain bersekongkol', create: createRing },
    { id: 'giliran', icon: '🕵️', label: 'Tim Pencurang', desc: 'Satu tim diam-diam memakai satu celah; tim lain menebak celah dan aturan penutupnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act arisan-jujur' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const said = el('div', { class: 'aw-hitung' }, 'Bu Rina 3 · Pak Joko 1 · Bu Sari 4 · Pak Bowo 0 · Bu Tini 2 · Pak Darto ?');
      const papers = ring();
      if (r === 0) ask('Cara Pak Darto: angka berapa yang harus ia sebut terakhir supaya dirinya sendiri (nomor 5) menang?', [0, 1, 2, 3, 4, 5].map((x) => [x, x === 1]), 6, said,
        then(() => ask('Dan supaya Bu Sari (nomor 2) yang menang?', [0, 1, 2, 3, 4, 5].map((x) => [x, x === 4]), 6, said,
          then(() => ask('Apa kelemahan cara Pak Darto?', [['Orang yang menyebut angka terakhir bisa memilih pemenang, karena ia sudah tahu semua angka lain', true], ['Sisa bagi 6 tidak adil untuk nomor 0'], ['Angka 0–5 terlalu sedikit'], ['Tidak ada kelemahan; semua menyebut angka']])))));
      else if (r === 1) ask('Isi amplop 4, 5, 2, 0, 3, 5. Siapa pemenangnya?', ANGGOTA.map((a, i) => [a, i === winner([4, 5, 2, 0, 3, 5])]), 3, envelopes([4, 5, 2, 0, 3, 5]),
        then(() => ask('Jika semua anggota menulis 5, siapa pemenangnya?', ANGGOTA.map((a, i) => [a, i === winner([5, 5, 5, 5, 5, 5])]), 3, envelopes([5, 5, 5, 5, 5, 5]))));
      else if (r === 2) conspiracyRound(wrap, ctx, { done: then(() => ask('Berapa peluang Pak Darto menang, dan apa kesimpulannya?', [['1/6, sama seperti tanpa persekongkolan; persekongkolan tidak berguna selama satu anggota jujur memilih acak', true], ['5/6, karena lima orang menulis 1'], ['1/2; persekongkolan setengah berhasil'], ['1; Pak Darto pasti menang']], 1, null,
        then(() => ask('Mengapa semua amplop harus terkumpul sebelum ada yang dibuka?', [['Supaya tidak ada yang bisa memilih angka setelah melihat angka orang lain', true], ['Supaya lebih cepat'], ['Supaya amplop tidak hilang'], ['Supaya ketua bisa memeriksa isinya lebih dulu']])))) });
      else if (r === 3) matchRound(wrap, ctx, { done: next });
      else if (r === 4) ask('Amplop yang baik itu menyembunyikan dan mengikat. Kejadian mana yang melanggar sifat menyembunyikan, dan mana yang melanggar sifat mengikat?', [['Menyembunyikan: amplop tipis (c). Mengikat: menukar amplop (d), juga "2 atau 4" (b)', true], ['Menyembunyikan: menukar amplop (d). Mengikat: amplop tipis (c)'], ['Keduanya: menolak membuka (a)'], ['Menyembunyikan: "2 atau 4" (b). Mengikat: amplop tipis (c)']]);
      else if (r === 5) guessHash(wrap, ctx, { target: 'E04B', done: then(() => ask('Mengapa sidik tanpa garam bermasalah, dan mengapa garam memperbaikinya?', [['Hanya ada enam kemungkinan, jadi siapa pun bisa mencoba semuanya; garam acak yang panjang membuat kemungkinannya terlalu banyak untuk dicoba', true], ['Mesin sidiknya rusak; garam memperbaikinya'], ['Sidik terlalu pendek; garam memperpanjang sidik'], ['Tidak bermasalah; garam hanya hiasan']], 1, el('table', { class: 'aw-tabel-sidik' }, el('tr', null, el('th', null, 'Teks'), ...[0, 1, 2, 3, 4, 5].map((x) => el('th', null, x))), el('tr', null, el('td', null, 'Sidik'), ...SIDIK.map((s) => el('td', null, s)))))) });
      else if (r === 6) verifyRound(wrap, ctx, { done: next });
      else if (r === 7) {
        const k = [1, 2, 3, 4];
        const paper = (i) => (i >= k.length ? ask('Ani mengurangi angka acaknya dari kertas terakhir. Berapa jumlah dan rata-rata uang saku?', [['Jumlah Rp325.000, rata-rata Rp65.000', true], ['Jumlah Rp1.559.567, rata-rata Rp311.913'], ['Jumlah Rp325.000, rata-rata Rp81.250'], ['Jumlah Rp275.000, rata-rata Rp55.000']], 1, ringBox(papers))
          : ask(`Kertas ${SAKU[k[i]][0]} → ${SAKU[(k[i] + 1) % 5][0]}: berapa angkanya? (${SAKU[k[i]][0]} menambahkan uang sakunya ${rp(SAKU[k[i]][1])}.)`, [papers[k[i]], papers[k[i]] - 10000, papers[k[i]] + 10000, papers[k[i] - 1] - SAKU[k[i]][1]].map((x, j) => [x, j === 0]).sort((u, v) => u[0] - v[0]).map(([x, c]) => [num(x), c]), 4, ringBox(papers.map((p, j) => (j <= k[i] - 1 ? p : null))), then(() => paper(i + 1))));
        paper(0);
      } else if (r === 8) ask('Citra hanya melihat 1.359.567. Apa yang bisa ia ketahui tentang uang saku Ani atau Budi?', [['Tidak ada: angka itu tercampur angka acak Ani yang tidak ia ketahui', true], ['Uang saku Budi: 1.359.567 − 1.284.567'], ['Uang saku Ani dan Budi sama-sama Rp62.500'], ['Rata-rata kelompok']], 1, ringBox(papers, [0, 2, 3, 4]),
        then(() => ask('Budi dan Dodi diam-diam saling menunjukkan kertas yang mereka pegang. Uang saku siapa yang bisa mereka hitung?', [['Citra: 1.399.567 − 1.359.567 = Rp40.000', true], ['Ani: 1.284.567 − 1.234.567'], ['Eka: 1.559.567 − 1.459.567'], ['Tidak ada']], 1, ringBox(papers, [4]),
          then(() => ask('Apa yang terjadi jika Ani memilih angka acak kecil, misalnya 10?', [['Budi menerima 50.010 dan bisa menebak uang saku Ani sekitar Rp50.000; angka acak harus besar dan tak tertebak', true], ['Tidak ada bedanya'], ['Rata-ratanya menjadi salah'], ['Eka tidak bisa menambahkan uang sakunya']])))));
      else limitsRound(wrap, ctx, { done: then(() => ask('Tantangan: bagaimana supaya dua orang yang bersekongkol tidak bisa membongkar uang saku orang di antara mereka?', [['Setiap orang memecah uang sakunya menjadi beberapa bagian acak yang jumlahnya tetap, menyimpan satu, dan membagikan sisanya ke orang berbeda; tiap orang mengumumkan jumlah bagian yang ia pegang', true], ['Duduk berjauhan supaya tidak bisa saling melihat'], ['Ani memakai angka acak dua kali'], ['Semua menulis uang saku di amplop terkunci lalu dibuka bersama']])) });
    }
    render();
  },
};

function createDraw(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  const setup = () => {
    let n = 6;
    const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, 'Undian amplop'), el('p', { class: 'reveal info' }, 'Berapa pemain?'), el('div', { class: 'seg' }, [4, 5, 6].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} pemain`), () => { n = x; draw(); }))), el('div', { class: 'kode-baris' }, button('Mulai ➜', () => turn(n, []), 'primary')));
    draw();
  };
  const turn = (n, nums) => {
    if (nums.length === n) {
      wrap.replaceChildren(el('p', { class: 'prompt' }, 'Semua amplop terkunci.'), envelopes(nums, false, ANGGOTA), el('div', { class: 'kode-baris' }, button('Buka bersama 📬', () => {
        const w = winner(nums, n); ctx.sound.win();
        wrap.replaceChildren(el('p', { class: 'prompt' }, `Pemenang: ${ANGGOTA[w]} 🎉`), envelopes(nums, true), sumLine(nums, n), el('div', { class: 'kode-baris' }, button('Undian lagi', setup, 'primary')));
      }, 'primary')));
      return;
    }
    const i = nums.length;
    wrap.replaceChildren(el('p', { class: 'prompt' }, `${ANGGOTA[i]}: ketuk angkamu (0–${n - 1}). Pemain lain berpaling!`), envelopes(nums, false), el('div', { class: 'aw-angka' }, Array.from({ length: n }, (_, x) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, x)), () => { ctx.sound.tap(); turn(n, [...nums, x]); }))),
      el('div', { class: 'kode-baris' }, button('🎲 Pilih acak', () => { ctx.sound.tap(); turn(n, [...nums, ctx.rand.int(0, n - 1)]); })));
  };
  setup();
}

function createCheat(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  let mode = 'amplop'; let target = 5; const cheat = [1, 1, 1, 1, 1]; let honest = true;
  const draw = () => {
    // Player 2 (Bu Sari) is honest and random; others are set by the cheaters.
    const prob = Array(6).fill(0);
    if (mode === 'akhir') prob[target] = 1;
    else if (!honest) prob[winner([cheat[0], cheat[1], 1, cheat[2], cheat[3], cheat[4]])] = 1;
    else for (let h = 0; h < 6; h++) prob[winner([cheat[0], cheat[1], h, cheat[2], cheat[3], cheat[4]])] += 1 / 6;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Coba curang'), el('div', { class: 'seg' }, [['amplop', '✉️ Amplop terkunci'], ['akhir', '🗣️ Pak Darto bicara terakhir']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${mode === v ? 'on' : ''}`, type: 'button' }, l), () => { mode = v; draw(); }))),
      mode === 'akhir' ? el('div', { class: 'aw-atur' }, el('span', null, 'Pak Darto ingin yang menang:'), el('div', { class: 'seg' }, ANGGOTA.map((a, i) => onTap(el('button', { class: `seg-btn ${target === i ? 'on' : ''}`, type: 'button' }, a), () => { target = i; draw(); }))))
        : el('div', { class: 'aw-atur' }, ...[0, 1, 3, 4, 5].map((p, j) => el('div', { class: 'aw-atur-baris' }, el('span', null, `${ANGGOTA[p]} (curang)`), el('div', { class: 'seg' }, [0, 1, 2, 3, 4, 5].map((x) => onTap(el('button', { class: `seg-btn ${cheat[j] === x ? 'on' : ''}`, type: 'button' }, x), () => { cheat[j] = x; draw(); }))))), el('div', { class: 'aw-atur-baris' }, el('span', null, 'Bu Sari'), el('div', { class: 'seg' }, [[true, 'jujur, acak 0–5'], [false, 'ikut bersekongkol, menulis 1']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${honest === v ? 'on' : ''}`, type: 'button' }, l), () => { honest = v; draw(); }))))),
      el('div', { class: 'aw-peluang' }, ANGGOTA.map((a, i) => el('div', { class: 'aw-peluang-kol' }, el('small', null, `${Math.round(prob[i] * 100)}%`), el('div', { class: 'aw-peluang-jalur' }, el('i', { style: { height: `${prob[i] * 100}%` } })), el('span', null, a)))),
      el('p', { class: 'reveal info' }, mode === 'akhir' ? 'Orang terakhir yang tahu semua angka bisa memilih pemenang: peluangnya 100%.' : honest ? 'Apa pun angka para pencurang, setiap anggota tetap berpeluang 1/6 selama Bu Sari memilih acak.' : 'Jika semua anggota bersekongkol, mereka memang bisa memilih pemenang; satu anggota jujur sudah cukup untuk mencegahnya.'));
  };
  draw();
}

function createHash(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  const input = el('input', { class: 'aw-masuk', type: 'text', value: SALTED, 'aria-label': 'Teks', autocomplete: 'off', spellcheck: 'false' });
  const out = el('code', { class: 'aw-hasil' });
  const calc = () => { out.textContent = `sidik = ${sidik(input.value)}`; };
  input.addEventListener('input', calc);
  const game = el('div', { class: 'aw-game' });
  const words = ['kursi', 'hijau', 'pelangi', 'meja', 'biru', 'hujan', 'gunung', 'sepeda', 'kopi', 'layang'];
  const newGame = (salt) => {
    const x = ctx.rand.int(0, 5); const s = salt ? `${x}-${ctx.rand.pick(words)}-${ctx.rand.pick(words)}-${ctx.rand.int(10, 99)}` : String(x); const h = sidik(s); const tried = [];
    const drawG = () => game.replaceChildren(el('p', { class: 'aw-catat' }, `Sidik rahasia: ${h} ${salt ? '(dengan garam)' : '(tanpa garam)'}`), el('div', { class: 'seg' }, [0, 1, 2, 3, 4, 5].map((g) => onTap(el('button', { class: `seg-btn ${tried.includes(g) ? 'on' : ''}`, type: 'button' }, `coba ${g}`), () => { if (!tried.includes(g)) tried.push(g); drawG(); }))),
      el('div', { class: 'aw-sidik' }, tried.map((g) => el('code', { class: sidik(String(g)) === h ? 'cocok' : '' }, `${g} → ${sidik(String(g))}`))),
      el('p', { class: 'aw-catat' }, tried.some((g) => sidik(String(g)) === h) ? `Ketemu: angkanya ${tried.find((g) => sidik(String(g)) === h)}.` : salt && tried.length === 6 ? `Tidak ada yang cocok: tanpa tahu garamnya, keenam angka tidak membantu. Teks aslinya ${s}.` : ''));
    drawG();
  };
  wrap.append(el('p', { class: 'prompt' }, 'Mesin sidik rekaan'), el('label', { class: 'aw-label' }, 'Teks', input), out,
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Tebak tanpa garam'), () => newGame(false)), onTap(el('button', { class: 'seg-btn', type: 'button' }, '🧂 Tebak dengan garam'), () => newGame(true))), game);
  calc(); newGame(false);
}

function createRing(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  let r = RAND; let step = 0; let view = null; let duo = false;
  const draw = () => {
    const papers = ring(r);
    const shown = papers.map((p, i) => (i < step ? p : null));
    // A player sees only the paper they received (from the previous person) and the one they wrote.
    const hide = view == null ? (duo ? [4] : []) : papers.map((_, i) => i).filter((i) => i !== view && i !== (view + 4) % 5);
    const box = ringBox(shown, hide);
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Rata-rata rahasia'), el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, '⏭ Kertas berikutnya'), () => { if (step < 5) { step++; ctx.sound.tap(); draw(); } }), onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Ulang'), () => { step = 0; draw(); }),
      ...[[RAND, 'Angka acak besar'], [10, 'Angka acak 10']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${r === v ? 'on' : ''}`, type: 'button' }, l), () => { r = v; draw(); }))),
    el('div', { class: 'seg' }, el('span', { class: 'aw-catat' }, 'Lihat sebagai:'), onTap(el('button', { class: `seg-btn ${view == null && !duo ? 'on' : ''}`, type: 'button' }, 'Guru (semua)'), () => { view = null; duo = false; draw(); }), ...SAKU.map(([nm], i) => onTap(el('button', { class: `seg-btn ${view === i ? 'on' : ''}`, type: 'button' }, nm), () => { view = i; duo = false; draw(); })), onTap(el('button', { class: `seg-btn ${duo ? 'on' : ''}`, type: 'button' }, 'Budi + Dodi bersekongkol'), () => { view = null; duo = true; draw(); })),
    box,
    el('p', { class: 'reveal info' }, step < 5 ? `${step} dari 5 kertas berpindah.` : duo ? `Budi memegang ${num(papers[1])} (yang ia tulis) dan Dodi menerima ${num(papers[2])}: selisihnya ${rp(papers[2] - papers[1])} adalah uang saku Citra.` : r === 10 ? `Budi menerima ${num(papers[0])}: hampir pasti uang saku Ani sekitar ${rp(papers[0] - 10)}.` : `Ani: ${num(papers[4])} − ${num(r)} = ${rp(papers[4] - r)}; rata-rata ${rp((papers[4] - r) / 5)}.`));
  };
  draw();
}

const CHEATS = [['akhir', 'Bicara paling akhir setelah tahu semua angka', 'Semua angka dikunci di amplop lalu dibuka bersama'], ['tolak', 'Menolak membuka amplop ketika tahu akan kalah', 'Amplop yang tidak dibuka dianggap 0 atau pemiliknya kehilangan hak menang'], ['tukar', 'Menukar amplop setelah beberapa amplop dibuka', 'Segel ditandatangani dan amplop dipegang bersama di tengah meja'], ['tipis', 'Mengintip amplop tipis orang lain sebelum menulis', 'Amplop tebal atau kertas dilipat sampai tidak tembus pandang']];
const STORY = {
  akhir: (w) => [`Undian lewat grup: lima anggota menyebut angka satu per satu.`, `Anggota terakhir menunggu lama, lalu menyebut angkanya.`, `Pemenangnya ${w}, sahabat anggota terakhir.`],
  tolak: (w) => ['Lima amplop sudah dibuka bergiliran.', 'Satu anggota tiba-tiba berkata, "Amplop saya ketinggalan di rumah, undian diulang saja."', `Jika dihitung tanpa amplopnya, pemenangnya ${w}.`],
  tukar: (w) => ['Amplop dibuka satu per satu oleh pemiliknya.', 'Seorang anggota keluar sebentar mengambil minum dengan amplop di saku.', `Saat amplopnya dibuka, angkanya tepat membuat ${w} menang.`],
  tipis: (w) => ['Amplop dikumpulkan di atas meja dekat jendela yang terang.', 'Seorang anggota menulis paling lambat sambil memandangi amplop lain.', `Hasilnya ${w} menang dengan angka yang "pas sekali".`],
};
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act arisan-jujur' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); let k = 0; const turns = nT * 2;
    function secret() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Tim Pencurang selesai', pts, again: () => pickTeams(wrap, 'Tim Pencurang', start) }); return; }
      const a = k % nT; const b = (k + 1) % nT;
      wrap.replaceChildren(scoreBar(pts, a), el('p', { class: 'prompt' }, `Tim ${a + 1} diam-diam memilih celah yang dipakai. Tim ${b + 1} berpaling!`),
        el('div', { class: 'opts', style: { '--cols': 2 } }, CHEATS.map(([id, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), () => { ctx.sound.tap(); guess(id, b); }))));
    }
    function guess(id, b) {
      const story = STORY[id](ctx.rand.pick(ANGGOTA));
      let stage = 0; let got = 0;
      const msg = el('p', { class: 'reveal hint' });
      const area = el('div');
      const askCheat = () => area.replaceChildren(el('p', { class: 'aw-catat' }, 'Celah apa yang dipakai?'), el('div', { class: 'opts', style: { '--cols': 2 } }, CHEATS.map(([c, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), (e) => {
        if (stage !== 0) return; stage = 1; const ok = c === id; if (ok) got++; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        say(msg, ok ? '' : 'bad', ok ? 'Celahnya tepat.' : `Celahnya: ${CHEATS.find((x) => x[0] === id)[1].toLowerCase()}.`); setTimeout(askRule, 1400);
      }))));
      const askRule = () => area.replaceChildren(el('p', { class: 'aw-catat' }, 'Aturan apa yang menutupnya?'), el('div', { class: 'opts', style: { '--cols': 2 } }, ctx.rand.shuffle(CHEATS.slice()).map(([c, , rule]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, rule)), (e) => {
        if (stage !== 1) return; stage = 2; const ok = c === id; if (ok) got++; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        pts[b] += got; say(msg, got ? '' : 'bad', `Tim ${b + 1} mendapat ${got} poin. Aturan penutupnya: ${CHEATS.find((x) => x[0] === id)[2].toLowerCase()}.`);
        k++; setTimeout(secret, 3000);
      }))));
      wrap.replaceChildren(scoreBar(pts, b), el('p', { class: 'prompt' }, `Tim ${b + 1}: apa yang terjadi di arisan bulan ini?`), el('ol', { class: 'aw-cerita' }, story.map((s) => el('li', null, s))), area, msg);
      askCheat();
    }
    secret();
  }
  pickTeams(wrap, 'Tim Pencurang', start);
}
