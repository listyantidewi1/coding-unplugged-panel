// Videotron Alun-Alun — SMP (13–15 tahun), representasi gambar dan bunyi.
// A colour is three numbers (R, G, B) written as #RRGGBB; a picture is
// width × height × 3 bytes; a sound is a row of samples. Mix light with
// sliders, size up a town-square screen, and read or place samples.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const NAMED = [
  ['merah', [255, 0, 0]], ['hijau', [0, 255, 0]], ['biru', [0, 0, 255]], ['kuning', [255, 255, 0]], ['sian', [0, 255, 255]],
  ['magenta', [255, 0, 255]], ['putih', [255, 255, 255]], ['hitam', [0, 0, 0]], ['abu-abu', [128, 128, 128]],
];
export const KENTONGAN = [0, 3, 4, 2, -1, -3, -3, -1, 1, 2, 1, 0];
export const PELUIT = [0, 2, -2, 2, -2, 2, -2, 1, -1, 1, -1, 0];
const TARGETS = [[255, 128, 0], [128, 0, 0], [192, 192, 192], [75, 0, 130], [0, 128, 128], [255, 192, 203], [128, 128, 0], [0, 0, 128], [160, 82, 45], [64, 224, 208]];

export const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).toUpperCase().padStart(2, '0')).join('');
export const css = (rgb) => `rgb(${rgb.join(',')})`;
export const diff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
const fmt = (n) => n.toLocaleString('id-ID');
// WCAG relative luminance and contrast ratio.
const lum = (rgb) => { const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// The size steps for a w × h metre screen with 1 cm dot spacing.
export function sizeSteps(wm, hm, fps = 25, seconds = 60) {
  const dots = wm * 100 * hm * 100;
  return [
    { q: `Banyak titik: ${wm * 100} × ${hm * 100} =`, a: dots, unit: 'titik' },
    { q: `Satu gambar penuh: ${fmt(dots)} titik × 3 byte =`, a: dots * 3, unit: 'byte' },
    { q: `Satu detik video (${fps} gambar): ${fmt(dots * 3)} × ${fps} =`, a: dots * 3 * fps, unit: 'byte' },
    { q: `${seconds} detik video: ${fmt(dots * 3 * fps)} × ${seconds} =`, a: dots * 3 * fps * seconds, unit: 'byte' },
  ];
}

export default {
  id: 'smp-03-videotron',
  title: 'Videotron Alun-Alun',
  topic: 'Representasi gambar dan bunyi: RGB, ukuran berkas, sampel',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '📺',
  source: { name: 'CS Unplugged: Image Representation', url: 'https://www.csunplugged.org/en/topics/image-representation/' },
  rounds: 12,
  maxPlayers: 4,
  goal: 'Murid menulis warna sebagai RGB dan #RRGGBB, menghitung ukuran gambar dan video tanpa pemampatan, mengubah grafik bunyi menjadi sampel dan sebaliknya, serta menjelaskan akibat sampel yang terlalu jarang.',
  extraModes: [
    { id: 'pencampur', icon: '🔦', label: 'Pencampur Cahaya', desc: 'Tiga penggeser R, G, B dengan lingkaran cahaya bertumpuk dan kaca pembesar', create: createMixer },
    { id: 'tebak', icon: '🎨', label: 'Tebak Warna', desc: 'Pilih warna dari kodenya, atau geser R, G, B sampai cocok', create: createGuess },
    { id: 'kalkulator', icon: '🧮', label: 'Kalkulator Ukuran', desc: 'Hitung ukuran gambar dan video videotron langkah demi langkah', create: createCalc },
    { id: 'sampel', icon: '🎵', label: 'Sampel Bunyi', desc: 'Taruh 12 sampel, ambil setiap 2 sampel, dan dengarkan nadanya', create: createSamples },
    { id: 'pengumuman', icon: '📢', label: 'Rancang Pengumuman', desc: 'Pilih warna latar dan tulisan; lihat rasio kontrasnya', create: createPoster },
    { id: 'tim', icon: '🤝', label: 'Warna Rahasia', desc: 'Tim A memilih warna rahasia, tim B menirunya; makin kecil selisih, makin tinggi skor', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act videotron' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 2, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      if (r <= 1) {
        const pool = r === 0 ? NAMED.slice(3, 6) : NAMED.slice(6);
        const [name, rgb] = ctx.rand.pick(pool);
        colourByCode(wrap, ctx, { rgb, name, done: next });
      } else if (r === 2) ask('Kode #FF8000 berarti …', [['R 255, G 128, B 0: oranye', true], ['R 255, G 8, B 0: merah'], ['R 128, G 255, B 0: hijau muda'], ['R 15, G 128, B 0: hijau tua']], 1, swatchCode('#FF8000'));
      else if (r === 3) ask('Kode #4B0082 berarti …', [['R 75, G 0, B 130: ungu tua (nila)', true], ['R 4, G 0, B 82: biru tua'], ['R 75, G 0, B 82: cokelat'], ['R 130, G 0, B 75: merah tua']], 1, swatchCode('#4B0082'));
      else if (r === 4) matchRound(wrap, ctx, { target: ctx.rand.pick(TARGETS), done: next });
      else if (r === 5) calcRound(wrap, ctx, { steps: sizeSteps(6, 3), prompt: 'Videotron 6 m × 3 m, jarak antartitik 1 cm, 3 byte per titik.', done: next });
      else if (r === 6) ask('Foto ponsel 4.000 × 3.000 piksel, 3 byte per piksel. Tanpa dimampatkan ukurannya … , padahal berkasnya hanya beberapa MB karena …', [['36 MB; berkasnya dimampatkan (misalnya JPEG)', true], ['12 MB; ponsel membuang warnanya'], ['36 MB; layar ponsel kecil'], ['7 MB; fotonya hitam putih']], 1);
      else if (r === 7) sampleRound(wrap, ctx, { target: KENTONGAN, showCurve: true, prompt: 'Baca bunyi kentongan: ketuk nilai sampel di setiap waktu t.', done: next });
      else if (r === 8) sampleRound(wrap, ctx, { target: PELUIT, showList: true, prompt: 'Taruh sampel bunyi peluit pada grafik.', done: next });
      else if (r === 9) ask('Bunyi mana yang getarannya lebih cepat, sehingga nadanya lebih tinggi?', [['Peluit', true], ['Kentongan'], ['Sama saja']], 3, graphView(PELUIT, { compare: KENTONGAN }));
      else if (r === 10) ask('Hanya sampel t = 0, 2, 4, 6, 8, 10 dari peluit yang disimpan: 0, −2, −2, −2, −1, −1. Apa yang terjadi?', [['Zig-zag hilang; sampel harus diambil lebih rapat', true], ['Bunyinya tetap sama persis'], ['Nadanya jadi lebih tinggi'], ['Berkasnya jadi lebih besar']], 1, graphView(PELUIT, { every2: true }));
      else ask('Setiap sampel bernilai −4 sampai 4 (9 nilai). Berapa bit paling sedikit untuk 1 sampel, dan untuk 12 sampel?', [['4 bit; 48 bit', true], ['3 bit; 36 bit'], ['9 bit; 108 bit'], ['2 bit; 24 bit']], 2);
    }
    render();
  },
};

const swatchCode = (h) => el('div', { class: 'swatch-kode' }, el('i', { style: `background:${h}` }), el('b', null, h));

// The three overlapping light circles.
function lights(rgb) {
  return el('div', { class: 'cahaya' },
    el('i', { class: 'c-r', style: `background:rgb(${rgb[0]},0,0)` }),
    el('i', { class: 'c-g', style: `background:rgb(0,${rgb[1]},0)` }),
    el('i', { class: 'c-b', style: `background:rgb(0,0,${rgb[2]})` }));
}

// R, G, B sliders; returns { node, rgb, set }.
function sliders(onChange, start = [0, 0, 0]) {
  const rgb = [...start];
  const rows = ['R', 'G', 'B'].map((ch, i) => {
    const out = el('b', { class: 'geser-nilai' }, rgb[i]);
    const input = el('input', { type: 'range', min: 0, max: 255, step: 1, value: rgb[i], class: `geser geser-${ch.toLowerCase()}`, 'data-ch': i, 'aria-label': ch });
    input.addEventListener('input', () => { rgb[i] = Number(input.value); out.textContent = rgb[i]; onChange(rgb); });
    const nudge = (d) => onTap(el('button', { class: 'geser-tombol', type: 'button' }, d > 0 ? '+' : '−'), () => { rgb[i] = Math.max(0, Math.min(255, rgb[i] + d)); input.value = rgb[i]; out.textContent = rgb[i]; onChange(rgb); });
    return el('div', { class: 'geser-baris' }, el('span', { class: `geser-label ${ch.toLowerCase()}` }, ch), nudge(-1), input, nudge(1), out);
  });
  return { node: el('div', { class: 'geser-kotak' }, rows), rgb };
}

// Code shown; choose the colour swatch.
function colourByCode(wrap, ctx, { rgb, name, done, rand = ctx.rand }) {
  const opts = rand.shuffle(NAMED.filter(([n]) => n !== name)).slice(0, 3).concat([[name, rgb]]);
  choice(wrap, {
    prompt: `Titik videotron menyala (${rgb.join(', ')}). Warnanya …`, ctx, onRight: done, columns: 4,
    options: rand.shuffle(opts).map(([n, c]) => ({ label: n, correct: n === name, icon: el('i', { class: 'swatch-bulat', style: `background:${css(c)}` }) })),
  });
}

// Copy a colour with the sliders; pass when the total difference is small.
function matchRound(wrap, ctx, { target, done, limit = 60, onScore }) {
  const mine = el('div', { class: 'swatch-besar' }, el('small', null, 'Warnamu'));
  const goal = el('div', { class: 'swatch-besar', style: `background:${css(target)}` }, el('small', null, 'Tiru warna ini'));
  const code = el('p', { class: 'kode-warna' });
  const s = sliders((rgb) => paint(rgb));
  const msg = el('p', { class: 'reveal info' }, `Geser R, G, B sampai warnanya cocok (selisih total paling banyak ${limit}).`);
  let finished = false;
  function paint(rgb) { mine.style.background = css(rgb); code.textContent = `${hex(rgb)} · (${rgb.join(', ')})`; }
  paint(s.rgb);
  wrap.append(el('p', { class: 'prompt' }, 'Tiru warna di videotron dengan penggeser.'), el('div', { class: 'swatch-pasang' }, goal, mine), code, s.node, msg, button('Periksa', () => {
    if (finished) return;
    const d = diff(s.rgb, target);
    if (onScore) { finished = true; onScore(d); return; }
    if (d > limit) { msg.className = 'reveal bad'; msg.textContent = `Selisih ${d}. ${['R', 'G', 'B'].map((ch, i) => (s.rgb[i] < target[i] - 20 ? `${ch} kurang` : s.rgb[i] > target[i] + 20 ? `${ch} terlalu banyak` : '')).filter(Boolean).join(', ')}.`; shake(mine); ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = `Cocok! Selisih ${d}. Warna aslinya ${hex(target)} = (${target.join(', ')}).`;
    done();
  }, 'primary'));
}

// Number entry with a keypad, checked step by step.
function numberPad(onDigit, onBack) {
  return el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => onDigit(d))),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}
function calcRound(wrap, ctx, { steps, prompt, done }) {
  let k = 0;
  let typed = '';
  const list = el('div', { class: 'hitung' });
  const msg = el('p', { class: 'reveal info' }, 'Ketik hasilnya, lalu Periksa. Kalkulator boleh dipakai.');
  let finished = false;
  function draw() {
    list.replaceChildren(...steps.map((s, i) => el('div', { class: `hitung-baris ${i < k ? 'beres' : i === k ? 'aktif' : ''}` },
      el('span', null, s.q), el('b', { class: 'hitung-isi' }, i < k ? `${fmt(s.a)} ${s.unit}` : i === k ? (typed ? fmt(Number(typed)) : '…') : ''))));
  }
  draw();
  const pad = numberPad((d) => { if (finished || typed.length >= 12) return; typed = (typed + d).replace(/^0+(?=\d)/, ''); ctx.sound.tap(); draw(); }, () => { typed = typed.slice(0, -1); draw(); });
  wrap.append(el('p', { class: 'prompt' }, prompt), list, el('div', { class: 'kode-baris' }, pad, button('Periksa', () => {
    if (finished) return;
    if (Number(typed) !== steps[k].a) { msg.className = 'reveal bad'; msg.textContent = 'Belum tepat. Periksa perkaliannya lagi.'; shake(list); ctx.mistake(); return; }
    k++;
    typed = '';
    ctx.sound.good();
    draw();
    if (k < steps.length) { msg.className = 'reveal info'; msg.textContent = 'Tepat. Lanjut ke langkah berikutnya.'; return; }
    finished = true;
    const last = steps.at(-1).a;
    msg.className = 'reveal';
    msg.textContent = `Selesai: ${fmt(last)} byte, sekitar ${fmt(Math.round(last / 1e6))} MB tanpa pemampatan.`;
    done();
  }, 'primary')), msg);
}

// The sample graph: 12 columns (t = 0..11) and 9 rows (value 4 .. −4).
function graphView(values, { picked = null, onPick, compare, every2, showCurve = true } = {}) {
  const g = el('div', { class: 'grafik' });
  for (let v = 4; v >= -4; v--) {
    g.append(el('span', { class: 'grafik-y' }, v));
    for (let t = 0; t < 12; t++) {
      const on = picked ? picked[t] === v : false;
      const c = el('button', { class: `grafik-sel ${v === 0 ? 'nol' : ''} ${on ? 'on' : ''}`, type: 'button', 'data-t': t, 'data-v': v });
      g.append(onPick ? onTap(c, () => onPick(t, v)) : c);
    }
  }
  g.append(el('span'), ...Array.from({ length: 12 }, (_, t) => el('span', { class: 'grafik-x' }, t)));
  const pts = (vals, step = 1) => vals.map((v, t) => [t, v]).filter(([t]) => t % step === 0).map(([t, v]) => `${t + 0.5},${4 - v + 0.5}`).join(' ');
  const lines = [];
  if (values && showCurve) lines.push(`<polyline points="${pts(values)}" class="kurva ${every2 ? 'pudar' : ''}"/>`, ...values.map((v, t) => `<circle cx="${t + 0.5}" cy="${4 - v + 0.5}" r="0.16" class="titik ${every2 && t % 2 ? 'pudar' : ''}"/>`));
  if (compare) lines.push(`<polyline points="${pts(compare)}" class="kurva banding"/>`);
  if (every2) lines.push(`<polyline points="${pts(values, 2)}" class="kurva jarang"/>`);
  const overlay = el('div', { class: 'grafik-lapis' });
  overlay.style.height = 'calc(var(--s) * 9)';
  overlay.innerHTML = `<svg viewBox="0 0 12 9" preserveAspectRatio="none">${lines.join('')}</svg>`;
  const legend = compare ? el('p', { class: 'small-note grafik-ket' }, el('span', { class: 'k-utama' }, '— peluit'), ' ', el('span', { class: 'k-banding' }, '— kentongan')) : null;
  return el('div', { class: 'grafik-wadah' }, el('div', { class: 'grafik-bingkai' }, g, overlay), legend);
}

function sampleRound(wrap, ctx, { target, showCurve, showList, prompt, done }) {
  const picked = Array(12).fill(null);
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, showList ? `Sampel: ${target.join(', ').replace(/-/g, '−')}` : 'Satu sampel untuk setiap t.');
  let finished = false;
  function draw() {
    const filled = finished ? target : picked;
    stage.replaceChildren(graphView(showCurve || finished ? target : null, { picked: filled, showCurve: showCurve || finished, onPick: finished ? null : (t, v) => { picked[t] = picked[t] === v ? null : v; ctx.sound.tap(); draw(); } }));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, msg, button('Periksa', () => {
    if (finished) return;
    const wrong = target.map((v, t) => (picked[t] === v ? null : t)).filter((t) => t !== null);
    if (wrong.length) {
      msg.className = 'reveal bad';
      msg.textContent = picked.some((v) => v === null) ? `Masih ada t yang belum diberi sampel.` : `Sampel di t = ${wrong.join(', ')} belum tepat.`;
      shake(stage); ctx.mistake(); return;
    }
    finished = true;
    draw();
    msg.className = 'reveal';
    msg.textContent = `Benar: ${target.join(', ').replace(/-/g, '−')}. Bagi komputer, bunyi adalah deretan angka.`;
    done();
  }, 'primary'));
}

function play(values) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const rate = 8000;
    const buf = ac.createBuffer(1, rate * 0.7, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (values[i % 12] ?? 0) / 4 * 0.3 * (1 - i / d.length);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start();
    src.onended = () => ac.close();
  } catch { /* no audio on this panel */ }
}

function createMixer(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  const view = el('div', { class: 'campur' });
  const code = el('p', { class: 'kode-warna' });
  let zoom = false;
  const s = sliders((rgb) => paint(rgb), [255, 255, 0]);
  function paint(rgb) {
    view.replaceChildren(lights(rgb), zoom
      ? el('div', { class: 'kaca' }, Array.from({ length: 12 }, () => el('div', { class: 'titik-led' }, el('i', { style: `background:rgb(${rgb[0]},0,0)` }), el('i', { style: `background:rgb(0,${rgb[1]},0)` }), el('i', { style: `background:rgb(0,0,${rgb[2]})` }))))
      : el('div', { class: 'swatch-besar', style: `background:${css(rgb)}` }, el('small', null, 'Hasil campuran')));
    code.textContent = `${hex(rgb)} · (${rgb.join(', ')})`;
  }
  paint(s.rgb);
  wrap.append(el('p', { class: 'prompt' }, 'Campur cahaya merah, hijau, dan biru.'), view, code, s.node,
    el('div', { class: 'kode-baris' }, ...NAMED.slice(3, 7).map(([n, c]) => button(n, () => { c.forEach((v, i) => { s.rgb[i] = v; }); s.node.querySelectorAll('.geser').forEach((g, i) => { g.value = c[i]; g.closest('.geser-baris').querySelector('.geser-nilai').textContent = c[i]; }); paint(s.rgb); }, 'small')),
      button('🔍 Kaca pembesar', () => { zoom = !zoom; paint(s.rgb); }, 'small')),
    el('p', { class: 'small-note' }, 'Ini campuran cahaya, bukan cat: merah + hijau = kuning.'));
}

function createGuess(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  let n = 0;
  let score = 0;
  function go() {
    wrap.replaceChildren(el('p', { class: 'small-note' }, `Soal ke-${++n} · benar ${score}`));
    const done = () => { score++; ctx.sound.win(); wrap.append(button('Soal berikutnya ➜', go, 'primary')); };
    if (rand.int(0, 1)) { const [name, rgb] = rand.pick(NAMED); colourByCode(wrap, ctx, { rgb, name, done, rand }); } else matchRound(wrap, ctx, { target: rand.pick(TARGETS), done });
  }
  go();
}

function createCalc(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  function go() {
    const w = rand.int(3, 10);
    const h = rand.int(2, 5);
    const sec = rand.pick([10, 15, 30, 60]);
    wrap.replaceChildren();
    calcRound(wrap, ctx, { steps: sizeSteps(w, h, 25, sec), prompt: `Videotron ${w} m × ${h} m, jarak antartitik 1 cm, 3 byte per titik, 25 gambar per detik.`, done() { ctx.sound.win(); wrap.append(button('Videotron lain ➜', go, 'primary')); } });
  }
  go();
}

function createSamples(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  let vals = [...PELUIT];
  let every2 = false;
  function draw() {
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ketuk grafik untuk menaruh sampel.'),
      graphView(vals, { picked: vals, every2, onPick: (t, v) => { vals[t] = v; ctx.sound.tap(); draw(); } }),
      el('p', { class: 'reveal info' }, `Sampel: ${vals.join(', ').replace(/-/g, '−')}${every2 ? ` · setiap 2: ${vals.filter((_, t) => t % 2 === 0).join(', ').replace(/-/g, '−')}` : ''}`),
      el('div', { class: 'kode-baris' },
        button('Kentongan', () => { vals = [...KENTONGAN]; draw(); }, 'small'), button('Peluit', () => { vals = [...PELUIT]; draw(); }, 'small'), button('Nol', () => { vals = Array(12).fill(0); draw(); }, 'small'),
        button(every2 ? 'Semua sampel' : 'Ambil setiap 2 sampel', () => { every2 = !every2; draw(); }, 'small'),
        button('🔊 Dengar', () => play(every2 ? vals.map((v, t) => vals[t - (t % 2)]) : vals), 'small')));
  }
  draw();
}

function createPoster(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  let which = 0;
  const cols = [[0, 0, 128], [255, 255, 0]];
  const board = el('div', { class: 'pengumuman' }, 'Pentas Seni Sabtu 08.00');
  const info = el('p', { class: 'reveal info' });
  const holder = el('div');
  const tabs = el('div', { class: 'kode-baris' });
  function paint() {
    board.style.background = css(cols[0]);
    board.style.color = css(cols[1]);
    const c = contrast(cols[0], cols[1]);
    info.className = c >= 7 ? 'reveal' : c >= 4.5 ? 'reveal info' : 'reveal bad';
    info.textContent = `Latar ${hex(cols[0])} · tulisan ${hex(cols[1])} · rasio kontras ${c.toFixed(1)} : 1 ${c >= 7 ? '(sangat mudah dibaca)' : c >= 4.5 ? '(cukup)' : '(sulit dibaca dari jauh)'}`;
  }
  function pick(i) {
    which = i;
    const s = sliders((rgb) => { cols[which] = [...rgb]; paint(); }, cols[i]);
    holder.replaceChildren(s.node);
    tabs.replaceChildren(button('Warna latar', () => pick(0), which === 0 ? 'primary small' : 'small'), button('Warna tulisan', () => pick(1), which === 1 ? 'primary small' : 'small'),
      button('Merah di atas hijau', () => { cols[0] = [0, 160, 0]; cols[1] = [220, 0, 0]; pick(which); }, 'small'));
    paint();
  }
  wrap.append(el('p', { class: 'prompt' }, 'Rancang pengumuman OSIS yang mudah dibaca dari jauh.'), board, info, tabs, holder,
    el('p', { class: 'small-note' }, 'Pilih kontras terang–gelap yang tinggi. Hindari merah–hijau yang terangnya mirip.'));
  pick(0);
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act videotron' });
  root.append(wrap);
  const score = [0, 0];
  let writer = 0;
  function secret() {
    const s = sliders((rgb) => { prev.style.background = css(rgb); });
    const prev = el('div', { class: 'swatch-besar', style: `background:${css(s.rgb)}` }, el('small', null, 'Warna rahasia'));
    wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${writer + 1}: pilih warna rahasia. Tim ${2 - writer} jangan melihat penggesernya!`), prev, s.node,
      el('p', { class: 'reveal info' }, `Skor: Tim 1 ${score[0]} · Tim 2 ${score[1]}`),
      button('Kunci warna ➜', () => guess([...s.rgb]), 'primary'));
  }
  function guess(target) {
    const reader = 1 - writer;
    wrap.replaceChildren();
    matchRound(wrap, ctx, {
      target, onScore(d) {
        const pts = Math.max(0, Math.round(100 - d / 7.65));
        score[reader] += pts;
        ctx.sound.good();
        wrap.append(el('p', { class: 'reveal' }, `Selisih ${d}: Tim ${reader + 1} mendapat ${pts} poin. Rahasianya ${hex(target)}.`), button('Tukar peran ➜', () => { writer = reader; secret(); }, 'primary'));
      },
    });
    wrap.querySelector('.prompt').textContent = `Tim ${reader + 1}: tiru warna rahasia ini.`;
  }
  secret();
}
