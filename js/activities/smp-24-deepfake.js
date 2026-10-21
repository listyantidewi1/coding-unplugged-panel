// Asli atau Buatan KA? — SMP (13–15 tahun), literasi digital. Two pairs of
// drawn scenes (one of each pair has five planted flaws), a convincing
// tiger-in-the-market picture with no flaws, a written script of a cloned-
// voice phone scam, the right steps, a family code word, and ethics. No
// voice or image is generated; every picture is an inline drawing.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

const W = 400;
const H = 300;

// Flaws: id, label, hit circles [x, y, r] in the 400×300 drawing.
export const FLAWS = {
  B: [['jari', 'Tangan peserta berjari enam', [[208, 100, 18]]], ['spanduk', 'Tulisan spanduk berupa huruf acak', [[95, 77, 48]]], ['bayangan', 'Bayangan pohon pinang dan bayangan orang berlawanan arah', [[255, 238, 34], [128, 240, 24], [212, 242, 20]]], ['wajah', 'Wajah penonton kabur seperti meleleh', [[345, 190, 46]]], ['tali', 'Tali panjat menembus badan peserta', [[187, 138, 19]]]],
  D: [['anting', 'Anting kiri dan kanan berbeda bentuk', [[121, 138, 15], [179, 138, 15]]], ['kacamata', 'Gagang kacamata menyatu dengan rambut', [[186, 98, 14]]], ['pagar', 'Pagar jembatan terputus dan tidak menyambung', [[318, 218, 28]]], ['gunting', 'Gunting bermata tiga', [[236, 176, 22]]], ['papan', 'Papan nama jembatan berhuruf acak', [[97, 52, 55]]]],
};
export const AI_IN = { 1: 'B', 2: 'D' };
export const hit = (img, x, y) => (FLAWS[img] || []).find(([, , cs]) => cs.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r));

// Scene drawings ---------------------------------------------------------
function person(x, y, { shirt = '#2563eb', skin = '#c68642', s = 1, face = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="0" width="18" height="26" rx="7" fill="${shirt}"/><circle cx="0" cy="-9" r="9" fill="${skin}"/>${face ? '<circle cx="-3" cy="-10" r="1.2" fill="#111"/><circle cx="3" cy="-10" r="1.2" fill="#111"/><path d="M-3 -5 q3 2 6 0" stroke="#111" fill="none" stroke-width="1"/>' : ''}<rect x="-8" y="26" width="6" height="14" fill="#1f2937"/><rect x="2" y="26" width="6" height="14" fill="#1f2937"/></g>`;
}
function hand(x, y, fingers) {
  const f = [];
  for (let i = 0; i < fingers; i++) { const a = -2.4 + (i * 1.6) / (fingers - 1); f.push(`<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * 11}" y2="${y + Math.sin(a) * 11}" stroke="#c68642" stroke-width="3" stroke-linecap="round"/>`); }
  return `<g>${f.join('')}<circle cx="${x}" cy="${y}" r="5.5" fill="#c68642"/></g>`;
}
export function scene1(ai) {
  const banner = ai ? 'DꟾRGQAH YVJ ꓤL' : 'DIRGAHAYU RI';
  const faces = [300, 322, 344, 366, 388].map((x, i) => (ai ? `<g filter="url(#lumer)"><ellipse cx="${x}" cy="${183 + (i % 2) * 4}" rx="9" ry="12" fill="#c68642"/><ellipse cx="${x + 2}" cy="${190 + (i % 2) * 4}" rx="7" ry="4" fill="#8b5a2b" opacity=".7"/></g><rect x="${x - 9}" y="${196 + (i % 2) * 4}" width="18" height="22" rx="6" fill="${['#16a34a', '#dc2626', '#7c3aed', '#f59e0b', '#0ea5e9'][i]}"/>` : person(x, 192 + (i % 2) * 4, { shirt: ['#16a34a', '#dc2626', '#7c3aed', '#f59e0b', '#0ea5e9'][i], s: 0.95 })));
  const poleShadow = ai ? '<polygon points="205,222 215,222 300,250 286,252" fill="#000" opacity=".22"/>' : '<polygon points="195,222 205,222 120,250 106,252" fill="#000" opacity=".22"/>';
  const rope = '<path d="M200 48 Q 186 120 197 214" stroke="#a16207" stroke-width="3" fill="none"/>';
  const ropeAi = '<path d="M172 118 L206 160" stroke="#a16207" stroke-width="3.5"/>';
  return `<defs><filter id="lumer"><feGaussianBlur stdDeviation="2.4"/></filter></defs>
  <rect width="400" height="220" fill="#bfe3ff"/><circle cx="365" cy="38" r="20" fill="#fde047"/>
  <rect y="220" width="400" height="80" fill="#d9b77a"/>
  ${poleShadow}
  <polygon points="144,236 156,236 122,248 106,248" fill="#000" opacity=".2"/><polygon points="226,238 238,238 206,249 192,249" fill="#000" opacity=".2"/>
  <rect x="20" y="58" width="150" height="38" fill="#fff" stroke="#dc2626" stroke-width="3"/><rect x="20" y="58" width="150" height="10" fill="#dc2626"/>
  <text x="95" y="88" text-anchor="middle" font-size="${ai ? 17 : 19}" font-weight="900" fill="#991b1b" font-family="sans-serif" ${ai ? 'transform="rotate(-2 95 85)" letter-spacing="1"' : ''}>${banner}</text>
  <line x1="28" y1="96" x2="28" y2="220" stroke="#6b7280" stroke-width="3"/><line x1="162" y1="96" x2="162" y2="220" stroke="#6b7280" stroke-width="3"/>
  ${ai ? '' : rope}
  <rect x="195" y="40" width="10" height="182" fill="#8b5a2b"/><rect x="197" y="40" width="3" height="182" fill="#c08a4a"/>
  <ellipse cx="200" cy="44" rx="34" ry="7" fill="none" stroke="#7c2d12" stroke-width="3"/>
  ${[175, 188, 212, 226].map((x, i) => `<line x1="${x}" y1="46" x2="${x}" y2="${60 + (i % 2) * 6}" stroke="#7c2d12"/><rect x="${x - 5}" y="${60 + (i % 2) * 6}" width="10" height="12" fill="${['#f97316', '#22c55e', '#e11d48', '#3b82f6'][i]}"/>`).join('')}
  ${person(186, 122, { shirt: '#f97316' })}
  <line x1="190" y1="126" x2="205" y2="104" stroke="#f97316" stroke-width="5" stroke-linecap="round"/>
  ${hand(206, 101, ai ? 6 : 5)}
  ${ai ? ropeAi : ''}
  ${person(150, 196, { shirt: '#1d4ed8' })}${person(232, 198, { shirt: '#be123c', s: 0.95 })}
  <rect x="285" y="214" width="115" height="4" fill="#78350f"/>
  ${faces.join('')}`;
}
export function scene2(ai) {
  const sign = ai ? 'JMEBTAN SKUAMKER' : 'JEMBATAN SUKAMEKAR';
  const earL = '<circle cx="121" cy="138" r="5" fill="#facc15" stroke="#a16207"/>';
  const earR = ai ? '<polygon points="179,131 186,144 172,144" fill="#facc15" stroke="#a16207"/>' : '<circle cx="179" cy="138" r="5" fill="#facc15" stroke="#a16207"/>';
  const rails = ai
    ? '<line x1="200" y1="205" x2="305" y2="205" stroke="#475569" stroke-width="5"/><line x1="330" y1="212" x2="400" y2="212" stroke="#475569" stroke-width="5"/><line x1="200" y1="232" x2="300" y2="232" stroke="#475569" stroke-width="5"/><line x1="334" y1="226" x2="400" y2="226" stroke="#475569" stroke-width="5"/>'
    : '<line x1="200" y1="205" x2="400" y2="205" stroke="#475569" stroke-width="5"/><line x1="200" y1="232" x2="400" y2="232" stroke="#475569" stroke-width="5"/>';
  const posts = [210, 250, 290, 345, 385].map((x) => `<rect x="${x - 3}" y="200" width="6" height="40" fill="#334155"/>`).join('');
  const blades = ai
    ? '<path d="M228 176 L262 162" stroke="#94a3b8" stroke-width="4"/><path d="M228 176 L264 176" stroke="#94a3b8" stroke-width="4"/><path d="M228 176 L262 190" stroke="#94a3b8" stroke-width="4"/>'
    : '<path d="M228 176 L262 166" stroke="#94a3b8" stroke-width="4"/><path d="M228 176 L262 186" stroke="#94a3b8" stroke-width="4"/>';
  const armR = ai ? '<path d="M174 103 C 186 96, 192 92, 190 78" stroke="#1f2937" stroke-width="6" fill="none" stroke-linecap="round"/>' : '<line x1="174" y1="103" x2="182" y2="110" stroke="#1f2937" stroke-width="2"/>';
  return `<rect width="400" height="300" fill="#dbeafe"/><rect y="240" width="400" height="60" fill="#60a5fa"/>
  <path d="M0 250 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfdbfe" fill="none" stroke-width="2"/>
  <rect x="200" y="236" width="200" height="12" fill="#94a3b8"/>
  ${rails}${posts}
  <rect x="12" y="28" width="170" height="48" rx="4" fill="#065f46"/><rect x="16" y="32" width="162" height="40" rx="3" fill="none" stroke="#ecfdf5"/>
  <text x="97" y="58" text-anchor="middle" font-size="12.5" font-weight="800" fill="#ecfdf5" font-family="sans-serif">${sign}</text>
  <line x1="60" y1="76" x2="60" y2="240" stroke="#475569" stroke-width="4"/><line x1="130" y1="76" x2="130" y2="240" stroke="#475569" stroke-width="4"/>
  <path d="M110 240 L120 150 L180 150 L190 240 Z" fill="#7c3aed"/><path d="M118 170 h64 M114 200 h72 M112 225 h76" stroke="#fde68a" stroke-width="3" stroke-dasharray="6 4"/>
  <path d="M120 112 q30 -42 60 0 v18 q-30 -18 -60 0 z" fill="#1f2937"/>
  <circle cx="150" cy="120" r="27" fill="#d29b6c"/><path d="M123 112 q27 -36 54 0 q-10 -14 -27 -14 q-17 0 -27 14 z" fill="#1f2937"/>
  <circle cx="139" cy="105" r="8" fill="none" stroke="#1f2937" stroke-width="2"/><circle cx="161" cy="105" r="8" fill="none" stroke="#1f2937" stroke-width="2"/><line x1="147" y1="105" x2="153" y2="105" stroke="#1f2937" stroke-width="2"/>
  <line x1="131" y1="103" x2="122" y2="110" stroke="#1f2937" stroke-width="2"/>${armR}
  <circle cx="139" cy="106" r="2" fill="#111"/><circle cx="161" cy="106" r="2" fill="#111"/><path d="M142 130 q8 6 16 0" stroke="#7f1d1d" stroke-width="2" fill="none"/>
  ${earL}${earR}
  <path d="M180 165 L225 176" stroke="#7c3aed" stroke-width="10" stroke-linecap="round"/><circle cx="228" cy="176" r="6" fill="#d29b6c"/>
  <circle cx="222" cy="182" r="5" fill="none" stroke="#e11d48" stroke-width="3"/><circle cx="232" cy="184" r="5" fill="none" stroke="#e11d48" stroke-width="3"/>
  ${blades}
  <path d="M262 176 C 300 172, 340 172, 400 176" stroke="#dc2626" stroke-width="5" fill="none"/><path d="M330 174 l-10 -10 l0 20 z M330 174 l10 -10 l0 20 z" fill="#dc2626"/>`;
}
export function scene3() {
  const stalls = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const lx = 10 + t * 120;
    const rx = 390 - t * 120;
    const y = 70 + t * 40;
    const h = 150 - t * 60;
    const col = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i];
    stalls.push(`<rect x="${lx}" y="${y}" width="${40 - t * 18}" height="${h}" fill="#78350f"/><polygon points="${lx - 6},${y} ${lx + 46 - t * 18},${y} ${lx + 40 - t * 18},${y - 16} ${lx},${y - 16}" fill="${col}"/>`);
    stalls.push(`<rect x="${rx - 40 + t * 18}" y="${y}" width="${40 - t * 18}" height="${h}" fill="#78350f"/><polygon points="${rx - 46 + t * 18},${y} ${rx + 6},${y} ${rx},${y - 16} ${rx - 40 + t * 18},${y - 16}" fill="${col}"/>`);
    for (let k = 0; k < 4; k++) stalls.push(`<circle cx="${lx + 6 + k * (8 - t * 3)}" cy="${y + h * 0.45}" r="${4 - t * 1.5}" fill="${['#facc15', '#16a34a', '#f97316', '#dc2626'][k]}"/><circle cx="${rx - 6 - k * (8 - t * 3)}" cy="${y + h * 0.45}" r="${4 - t * 1.5}" fill="${['#a3e635', '#fb923c', '#fde047', '#be123c'][k]}"/>`);
  }
  const stripes = [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${168 + i * 14} 196 q4 10 0 22" stroke="#111" stroke-width="4" fill="none"/>`).join('');
  return `<rect width="400" height="300" fill="#fef3c7"/><polygon points="0,300 400,300 260,130 140,130" fill="#a8a29e"/><rect x="140" y="40" width="120" height="90" fill="#fde68a"/>
  ${stalls.join('')}
  <ellipse cx="200" cy="262" rx="70" ry="9" fill="#000" opacity=".2"/>
  <path d="M262 210 q30 -10 40 -40" stroke="#ea580c" stroke-width="7" fill="none" stroke-linecap="round"/>
  <rect x="160" y="226" width="12" height="34" rx="5" fill="#ea580c"/><rect x="180" y="228" width="12" height="32" rx="5" fill="#ea580c"/><rect x="222" y="228" width="12" height="32" rx="5" fill="#ea580c"/><rect x="242" y="226" width="12" height="34" rx="5" fill="#ea580c"/>
  <ellipse cx="208" cy="214" rx="58" ry="24" fill="#f97316"/>${stripes}
  <circle cx="148" cy="198" r="24" fill="#f97316"/><circle cx="134" cy="178" r="7" fill="#f97316"/><circle cx="160" cy="176" r="7" fill="#f97316"/>
  <ellipse cx="140" cy="208" rx="12" ry="8" fill="#fff7ed"/><circle cx="140" cy="194" r="2.6" fill="#111"/><circle cx="156" cy="194" r="2.6" fill="#111"/><circle cx="136" cy="206" r="2.4" fill="#111"/>
  <path d="M152 184 l4 8 M144 182 l0 8" stroke="#111" stroke-width="2.5"/>`;
}
export const IMAGES = { A: () => scene1(false), B: () => scene1(true), C: () => scene2(false), D: () => scene2(true), E: scene3 };
function picture(id, { onPoint, found = [], reveal = false, caption } = {}) {
  const marks = [...found.map((f) => [f, 'ketemu']), ...(reveal ? (FLAWS[id] || []).filter(([f]) => !found.includes(f)).map(([f]) => [f, 'lewat']) : [])]
    .flatMap(([f, cls]) => FLAWS[id].find((x) => x[0] === f)[2].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="df-tanda ${cls}"/>`)).join('');
  const box = el('div', { class: 'df-gambar', 'data-g': id, html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gambar ${id}">${IMAGES[id]()}${marks}</svg>` },
    el('span', { class: 'df-huruf' }, id), caption ? el('span', { class: 'df-keterangan' }, caption) : null);
  if (onPoint) {
    box.addEventListener('pointerdown', (e) => {
      const svg = box.querySelector('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      onPoint(p.x, p.y);
    });
  }
  return box;
}

export const CALL = [
  ['', [['Pukul 22.15', 'malam'], [', Ibu menerima telepon dari ', null], ['nomor yang tidak dikenal.', 'nomor']]],
  ['Penelepon', [['Bu, ini Dimas. ', null], ['Ponselku jatuh, jadi aku pakai nomor teman. ', 'alasan'], ['Aku kecelakaan motor ', 'panik'], ['dan harus bayar rumah sakit sekarang juga. ', 'desak'], ['Tolong transfer lima juta ke rekening ini ya, Bu. ', 'rekening'], ['Jangan bilang Ayah dulu, nanti Ayah panik.', 'rahasia']]],
  ['Ibu', [['Dimas? Suaramu kok agak serak?', null]]],
  ['Penelepon', [['Iya, Bu, aku habis menangis. ', 'suara'], ['Cepat ya, Bu, waktunya tidak banyak!', 'desak']]],
];
export const CALL_WHY = { malam: 'menelepon larut malam', nomor: 'nomor tidak dikenal', alasan: 'alasan "ponsel jatuh" untuk nomor baru', panik: 'memancing panik dengan cerita kecelakaan', desak: 'mendesak supaya cepat', rekening: 'meminta transfer ke rekening orang lain', rahasia: 'meminta merahasiakan dari Ayah', suara: 'menjelaskan suara yang berbeda' };
export const STEPS = [['A', 'Tanyakan kata rahasia keluarga. Jika penelepon tidak tahu, tutup teleponnya.'], ['B', 'Segera transfer supaya Kak Dimas cepat ditolong.'], ['C', 'Telepon balik Kak Dimas ke nomor yang tersimpan di ponsel.'], ['D', 'Hubungi Ayah atau teman yang biasanya bersama Kak Dimas.'], ['E', 'Kirim foto KTP dan PIN rekening Ibu supaya urusan cepat selesai.'], ['F', 'Laporkan nomor penipu kepada bank dan polisi.']];
export const ORDERS = ['ACDF', 'ADCF'];
export const TRASH = ['B', 'E'];

export default {
  id: 'smp-24-deepfake',
  title: 'Asli atau Buatan KA?',
  topic: 'Deep fake: kejanggalan gambar, telepon suara tiruan, memeriksa sumber, dan etika',
  jenjang: 'smp',
  age: '13–15 th',
  icon: '🎭',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menemukan kejanggalan pada gambar buatan KA, menyadari bahwa gambar tanpa kejanggalan belum tentu asli, mengenali tanda bahaya telepon suara tiruan, menyusun langkah yang benar, memilih kata rahasia keluarga, dan menimbang etika berkarya dengan KA.',
  extraModes: [
    { id: 'giliran', icon: '🔁', label: 'Tandai Bergiliran', desc: 'Tim bergantian menandai satu kejanggalan di gambar B dan D atau satu tanda bahaya di naskah telepon', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act deepfake' });
    root.append(wrap);
    const flip1 = ctx.rand.int(0, 1) === 1;
    const flip2 = ctx.rand.int(0, 1) === 1;
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) pairRound(wrap, ctx, { pair: flip1 ? ['B', 'A'] : ['A', 'B'], ai: 'B', title: 'Pasangan 1: lomba panjat pinang di Desa Sukamekar', done: next });
      else if (r === 1) pairRound(wrap, ctx, { pair: flip2 ? ['D', 'C'] : ['C', 'D'], ai: 'D', title: 'Pasangan 2: Bu Kepala Desa meresmikan jembatan', done: next });
      else if (r === 2) ask('"BARU SAJA!! Harimau lepas di Pasar Wanasari, jangan keluar rumah!!" Kamu tidak menemukan kejanggalan. Apakah gambar ini pasti asli?', [['Belum tentu: gambar KA bisa sangat meyakinkan, dan gambar asli bisa diberi keterangan palsu', true], ['Pasti asli, karena tidak ada kejanggalan'], ['Pasti palsu, karena harimau tidak mungkin ke pasar'], ['Pasti asli, karena banyak yang membagikan']], 1, picture('E', { caption: '@infoviral_terkini' }),
        then(() => ask('Apa yang perlu diperiksa sebelum percaya atau membagikannya?', [['Siapa pengunggah pertama, apakah akun resmi atau media pers memberitakannya, kapan dan di mana dibuat, dan pencarian gambar terbalik', true], ['Jumlah suka dan komentar'], ['Apakah gambarnya tajam dan berwarna'], ['Bagikan dulu supaya orang waspada, periksa belakangan']])));
      else if (r === 3) callRound(wrap, ctx, { done: next });
      else if (r === 4) ask('Mengapa suara penelepon bisa sangat mirip suara Kak Dimas?', [['KA bisa meniru suara dari rekaman pendek, misalnya video yang diunggah Kak Dimas', true], ['Karena penipunya saudara kembar Kak Dimas'], ['Karena semua suara di telepon terdengar sama'], ['Tidak mungkin; pasti itu memang Kak Dimas']]);
      else if (r === 5) stepsRound(wrap, ctx, { done: next });
      else if (r === 6) ask('Mana yang paling baik dijadikan kata rahasia keluarga?', [['"pisang goreng di bawah hujan" (frasa acak yang disepakati bersama)', true], ['Si Belang (nama kucing keluarga): bisa ditemukan dari unggahan'], ['12 Februari: tanggal lahir mudah dicari'], ['Dimas123: mudah ditebak']], 1, null,
        then(() => ask('Bagaimana aturan menyimpan kata rahasia keluarga?', [['Disepakati tatap muka, tidak ditulis di ponsel, tidak diunggah, tidak diberitahukan ke luar keluarga, diganti bila bocor', true], ['Disimpan di catatan ponsel supaya tidak lupa'], ['Diunggah ke grup keluarga supaya semua tahu'], ['Dipakai juga sebagai kata sandi media sosial']])));
      else if (r === 7) ask('Kesalahan seperti jari yang salah makin jarang. Apa akibatnya bagi cara kita memeriksa konten?', [['Mata saja tidak cukup; yang lebih penting memeriksa asal-usul: pengunggah, media pers, akun resmi, tanggal, pencarian gambar terbalik', true], ['Semua konten sekarang bisa dipercaya'], ['Cukup memperbesar gambar untuk mencari jari'], ['Jangan pernah melihat foto lagi']]);
      else if (r === 8) ask('Teman-teman ingin membuat video wajah Pak Guru "bernyanyi" dengan aplikasi KA lalu mengunggahnya. Bolehkah?', [['Tidak boleh tanpa izin: bisa mempermalukan, menyesatkan, termasuk perundungan, dan melanggar hukum. Berkarya dengan KA: minta izin, beri label "dibuat dengan KA", tidak merendahkan', true], ['Boleh, karena hanya bercanda'], ['Boleh, asal tidak diberi nama Pak Guru'], ['Boleh, karena aplikasinya gratis']]);
      else ask('Tantangan: cara teknologi membantu mengenali konten buatan KA, dan mengapa tidak sempurna?', [['Label atau tanda air, catatan asal-usul berkas, alat pendeteksi; tetapi label bisa hilang saat dipotong atau difoto ulang dan pendeteksi bisa salah', true], ['Alat pendeteksi selalu benar, jadi tidak perlu memeriksa sumber'], ['Tidak ada teknologi yang bisa membantu sama sekali'], ['Cukup melihat resolusi gambar']]);
    }
    render();
  },
};

// Choose the AI picture of a pair, then mark at least three flaws.
function pairRound(wrap, ctx, { pair, ai, title, done }) {
  let chosen = false;
  const found = [];
  let finished = false;
  const need = 3;
  const stage = el('div');
  const list = el('ol', { class: 'df-daftar' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk gambar yang dibuat dengan KA.');
  function draw() {
    stage.replaceChildren(el('div', { class: 'df-pasangan' }, pair.map((id) => picture(id, { found: id === ai ? found : [], reveal: finished && id === ai, onPoint: (x, y) => point(id, x, y) }))));
    list.replaceChildren(...found.map((f) => el('li', null, FLAWS[ai].find((x) => x[0] === f)[1])));
  }
  function point(id, x, y) {
    if (finished) return;
    if (!chosen) {
      if (id !== ai) { msg.className = 'reveal bad'; msg.textContent = `Gambar ${id} wajar. Bandingkan detailnya dengan gambar satunya.`; ctx.mistake(); return; }
      chosen = true; ctx.sound.good();
      msg.className = 'reveal info'; msg.textContent = `Benar, gambar ${ai}. Sekarang ketuk paling sedikit ${need} kejanggalan di gambar ${ai}.`;
      return;
    }
    if (id !== ai) return;
    const f = hit(ai, x, y);
    if (!f) { msg.className = 'reveal bad'; msg.textContent = 'Bagian itu tidak janggal.'; ctx.mistake(); return; }
    if (found.includes(f[0])) return;
    found.push(f[0]); ctx.sound.good();
    if (found.length >= need) { finished = true; msg.className = 'reveal'; msg.textContent = `Hebat! ${FLAWS[ai].length - found.length ? `Lingkaran kuning: ${FLAWS[ai].length - found.length} kejanggalan lain yang belum ditemukan.` : 'Kelima kejanggalan ditemukan.'}`; done(); }
    else { msg.className = 'reveal info'; msg.textContent = `${found.length} dari ${need}. Terus cari!`; }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, title), stage, list, msg);
}

function callView({ onSeg, found = [], wrong = null }) {
  return el('div', { class: 'df-naskah' }, CALL.map(([who, segs], li) => el('p', { class: who ? '' : 'df-narasi' }, who ? el('b', null, `${who}: `) : null,
    segs.map(([t, k], si) => onTap(el('span', { class: `jd-seg ${found.includes(`${li}-${si}`) ? 'bocor' : ''} ${wrong === `${li}-${si}` ? 'salah' : ''}`, 'data-c': `${li}-${si}` }, t), () => onSeg && onSeg(li, si, k))))));
}

function callRound(wrap, ctx, { done }) {
  const found = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk paling sedikit empat tanda bahaya. Aplikasi ini tidak memakai suara tiruan.');
  const draw = (wrong = null) => stage.replaceChildren(callView({ found, wrong, onSeg: (li, si, k) => {
    if (finished || found.includes(`${li}-${si}`)) return;
    if (!k) { msg.className = 'reveal bad'; msg.textContent = 'Kalimat itu sendiri bukan tanda bahaya.'; ctx.mistake(); draw(`${li}-${si}`); return; }
    found.push(`${li}-${si}`); ctx.sound.good();
    msg.className = 'reveal info'; msg.textContent = `Tanda bahaya: ${CALL_WHY[k]}.`;
    if (found.length >= 4) { finished = true; msg.className = 'reveal'; msg.textContent = `Tanda bahaya: ${[...new Set(found.map((x) => { const [a, b] = x.split('-').map(Number); return CALL_WHY[CALL[a][1][b][1]]; }))].join('; ')}.`; done(); }
    draw();
  } }));
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Telepon suara tiruan (naskah tertulis)'), stage, msg);
}

function stepsRound(wrap, ctx, { done }) {
  const order = [];
  const trash = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu untuk memberi nomor urut, atau 🗑 untuk membuang langkah yang salah.');
  const draw = () => stage.replaceChildren(el('div', { class: 'df-langkah' }, STEPS.map(([k, t]) => el('div', { class: `df-kartu ${trash.includes(k) ? 'buang' : ''} ${order.includes(k) ? 'urut' : ''}` },
    onTap(el('button', { class: 'df-nomor', type: 'button', 'data-k': k }, order.includes(k) ? String(order.indexOf(k) + 1) : '·'), () => toggle(order, k)),
    el('span', null, el('b', null, `${k}. `), t),
    onTap(el('button', { class: 'df-sampah', type: 'button', 'data-t': k, 'aria-label': `buang ${k}` }, '🗑'), () => toggle(trash, k))))));
  function toggle(list, k) {
    if (finished) return;
    const other = list === order ? trash : order;
    if (other.includes(k)) other.splice(other.indexOf(k), 1);
    if (list.includes(k)) list.splice(list.indexOf(k), 1); else list.push(k);
    ctx.sound.tap(); draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Langkah yang benar menghadapi telepon itu'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const okTrash = trash.length === 2 && TRASH.every((k) => trash.includes(k));
    if (!okTrash) { msg.className = 'reveal bad'; msg.textContent = 'Periksa lagi langkah mana yang berbahaya dan harus dibuang.'; ctx.mistake(); return; }
    if (!ORDERS.includes(order.join(''))) { msg.className = 'reveal bad'; msg.textContent = 'Langkah yang dibuang sudah tepat. Urutannya belum: apa yang dilakukan selagi penelepon masih di telepon?'; ctx.mistake(); return; }
    finished = true; msg.className = 'reveal'; msg.textContent = 'Benar: A, lalu C dan D (boleh bertukar), lalu F. Laporan tetap dibuat walaupun Kak Dimas ternyata baik-baik saja.'; done();
  }, 'primary')), msg);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act deepfake' });
  root.append(wrap);
  let n = 2;
  let turn = 0;
  let stage = 0;
  const found = { B: [], D: [], call: [] };
  const pts = [];
  const stages = ['B', 'D', 'call'];
  const total = { B: FLAWS.B.length, D: FLAWS.D.length, call: CALL.flatMap(([, s]) => s).filter(([, k]) => k).length };
  function setup() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Berapa tim?'), el('div', { class: 'seg' }, [2, 3, 4].map((x) => onTap(el('button', { class: `seg-btn ${n === x ? 'on' : ''}`, type: 'button' }, `${x} tim`), () => { n = x; setup(); }))),
      el('div', { class: 'kode-baris' }, button('Mulai ➜', () => { turn = 0; stage = 0; for (const k of stages) found[k] = []; pts.length = 0; for (let i = 0; i < n; i++) pts.push(0); play(''); }, 'primary')));
  }
  function score(ok, note) {
    const team = turn % n;
    if (ok) { pts[team]++; ctx.sound.good(); } else ctx.sound.bad();
    turn++;
    const s = stages[stage];
    if (found[s].length >= total[s]) { stage++; if (stage >= stages.length) return finish(); }
    play(note);
  }
  function play(note) {
    const team = turn % n;
    const s = stages[stage];
    const body = s === 'call'
      ? callView({ found: found.call, onSeg: (li, si, k) => { const key = `${li}-${si}`; if (found.call.includes(key)) return; if (k) found.call.push(key); score(!!k, k ? `Tim ${team + 1}: ${CALL_WHY[k]}.` : `Tim ${team + 1}: itu bukan tanda bahaya.`); } })
      : picture(s, { found: found[s], onPoint: (x, y) => { const f = hit(s, x, y); if (f && found[s].includes(f[0])) return; if (f) found[s].push(f[0]); score(!!f, f ? `Tim ${team + 1}: ${f[1].toLowerCase()}.` : `Tim ${team + 1}: bagian itu tidak janggal.`); } });
    wrap.replaceChildren(el('div', { class: 'pb-skor' }, pts.map((p, i) => el('span', { class: i === team ? 'giliran' : '' }, `Tim ${i + 1}: ${p}`))),
      el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}: ${s === 'call' ? 'ketuk satu tanda bahaya' : `ketuk satu kejanggalan di gambar ${s}`} (${found[s].length}/${total[s]}).`),
      el('div', { class: s === 'call' ? '' : 'df-satu' }, body), el('p', { class: 'reveal info' }, note || 'Jawaban benar mendapat poin.'));
  }
  function finish() {
    const best = Math.max(...pts);
    ctx.sound.win();
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Semua kejanggalan dan tanda bahaya ditemukan.'),
      el('div', { class: 'ab-lapisan' }, pts.map((p, i) => el('div', { class: `ab-lap-baris ${p === best ? 'menang' : ''}` }, el('span', null, `Tim ${i + 1}`), el('b', null, `${p} poin${p === best ? ' 🏆' : ''}`)))),
      el('div', { class: 'kode-baris' }, button('Main lagi', setup, 'primary')));
  }
  setup();
}
