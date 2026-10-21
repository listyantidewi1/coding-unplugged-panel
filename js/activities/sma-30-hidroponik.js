// Kebun Hidroponik IoT — SMA/SMK (16–18 tahun), Internet of Things.
// Sensors publish to a message broker, the controller runs event rules, and
// pump, fan, dashboard and phone subscribe to topics. Ten events reveal a broken
// sensor and a lost message; version 2 adds validation, periodic messages and a watchdog.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';

export const TOPICS = [['kebun/suhu', 'Sensor suhu larutan', ['pengendali', 'dasbor']], ['kebun/ph', 'Sensor pH', ['pengendali', 'dasbor']], ['kebun/air', 'Sensor ketinggian air tandon (cm)', ['pengendali', 'dasbor']], ['kebun/perintah/pompa', 'Pengendali', ['pompa']], ['kebun/perintah/kipas', 'Pengendali', ['kipas']], ['kebun/peringatan', 'Pengendali', ['dasbor', 'ponsel']]];
export const TYPES = [['sensor', 'sensor'], ['aktuator', 'aktuator'], ['perantara', 'perantara'], ['pengendali', 'pengendali'], ['antarmuka', 'antarmuka']];
export const DEVICES = [['Sensor pH', 'sensor', 'Mengukur keasaman larutan, lalu mengirim pesan.'], ['Pompa', 'aktuator', 'Menggerakkan air: aktuator.'], ['Kipas', 'aktuator', 'Menggerakkan udara: aktuator.'], ['Perantara pesan', 'perantara', 'Meneruskan pesan kepada pelanggan topiknya.'], ['Program pengendali', 'pengendali', 'Menjalankan aturan dan mengirim perintah.'], ['Dasbor', 'antarmuka', 'Tampilan untuk manusia.'], ['Ponsel Pak Darto', 'antarmuka', 'Menampilkan peringatan untuk manusia.']];
// [kejadian, pukul, topik, nilai, keterangan, hilang]
export const EVENTS = [['K1', '08.00', 'air', 35], ['K2', '08.00', 'suhu', 27], ['K3', '08.00', 'ph', 6.1], ['K4', '11.00', 'suhu', 31], ['K5', '11.30', 'suhu', 29], ['K6', '12.00', 'ph', 7], ['K7', '12.30', 'suhu', -127, 'Kabel sensor suhu lepas'], ['K8', '13.00', 'suhu', 32, 'Kabel dipasang lagi'], ['K9', '14.00', 'air', 18], ['K10', '15.00', 'air', 40, 'Pak Darto mengisi tandon, tetapi jaringan nirkabel terputus', true]];
export const ROUTINE = ['K11', '15.10', 'air', 40, 'Pesan rutin 10 menit'];
export const TEST = [30, 28, 27.9, 50, 51, -1, 0];

export const fmt = (topic, x) => (topic === 'ph' ? x.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : fmtNum(x, 1));
const UNIT = { suhu: ' °C', ph: '', air: ' cm' };

export function controller(topic, x, v2 = false) {
  const out = []; const hit = []; const f = fmt(topic, x);
  if (topic === 'air') {
    hit.push('a0', 'a1');
    if (x < 20) { hit.push('a2', 'a3'); out.push(['pompa', 'MATI'], ['peringatan', `Air tandon rendah: ${f} cm`]); } else { hit.push('a4', 'a5'); out.push(['pompa', 'NYALA']); }
  } else if (topic === 'suhu') {
    hit.push('s0', 's1');
    if (v2) {
      if (x < 0 || x > 50) { hit.push('s2'); out.push(['peringatan', `Sensor suhu rusak? Nilai: ${f}`]); }
      else { hit.push('s3'); if (x > 30) { hit.push('s4'); out.push(['kipas', 'NYALA']); } else { hit.push('s5'); if (x < 28) { hit.push('s6'); out.push(['kipas', 'MATI']); } } }
    } else {
      if (x > 30) { hit.push('s2'); out.push(['kipas', 'NYALA']); }
      hit.push('s3'); if (x < 28) { hit.push('s4'); out.push(['kipas', 'MATI']); }
    }
  } else if (topic === 'ph') {
    hit.push('p0', 'p1');
    if (x < 5.5 || x > 6.5) { hit.push('p2'); out.push(['peringatan', `pH di luar batas: ${f}`]); }
  }
  return { out, hit };
}

export function code(v2 = false) {
  const L = [['a0', 'SAAT menerima "kebun/air" dengan nilai x:', 0], ['a1', 'JIKA x < 20 MAKA', 1], ['a2', 'kirim "kebun/perintah/pompa" "MATI"', 2], ['a3', 'kirim "kebun/peringatan" "Air tandon rendah: x cm"', 2], ['a4', 'LAINNYA', 1], ['a5', 'kirim "kebun/perintah/pompa" "NYALA"', 2], ['', '', 0], ['s0', 'SAAT menerima "kebun/suhu" dengan nilai x:', 0]];
  if (v2) L.push(['s1', 'JIKA x < 0 ATAU x > 50 MAKA', 1, true], ['s2', 'kirim "kebun/peringatan" "Sensor suhu rusak? Nilai: x"', 2, true], ['s3', 'LAINNYA JIKA x > 30 MAKA', 1], ['s4', 'kirim "kebun/perintah/kipas" "NYALA"', 2], ['s5', 'LAINNYA JIKA x < 28 MAKA', 1], ['s6', 'kirim "kebun/perintah/kipas" "MATI"', 2]);
  else L.push(['s1', 'JIKA x > 30 MAKA', 1], ['s2', 'kirim "kebun/perintah/kipas" "NYALA"', 2], ['s3', 'JIKA x < 28 MAKA', 1], ['s4', 'kirim "kebun/perintah/kipas" "MATI"', 2]);
  L.push(['', '', 0], ['p0', 'SAAT menerima "kebun/ph" dengan nilai x:', 0], ['p1', 'JIKA x < 5,5 ATAU x > 6,5 MAKA', 1], ['p2', 'kirim "kebun/peringatan" "pH di luar batas: x"', 2]);
  if (v2) L.push(['', '', 0], ['w0', 'SETIAP 10 menit:', 0, true], ['w1', 'JIKA pesan "kebun/air" terakhir diterima lebih dari 30 menit yang lalu MAKA', 1, true], ['w2', 'kirim "kebun/peringatan" "Sensor air tidak mengirim data"', 2, true]);
  return L;
}

// Runs every event from the morning state; one snapshot per event.
export function simulate(v2 = false) {
  const st = { pompa: 'MATI', kipas: 'MATI', dash: {}, alerts: [] };
  const evs = v2 ? [...EVENTS, ROUTINE] : EVENTS;
  return evs.map((e) => {
    const [, , topic, x, , lost] = e;
    let r = { out: [], hit: [] };
    if (!lost) { st.dash[topic] = x; r = controller(topic, x, v2); for (const [d, v] of r.out) { if (d === 'peringatan') st.alerts.push(v); else st[d] = v; } }
    return { e, ...r, pompa: st.pompa, kipas: st.kipas, dash: { ...st.dash }, alerts: st.alerts.slice() };
  });
}

export const cmdText = ([d, v]) => (d === 'peringatan' ? `peringatan "${v}"` : `${d} ${v}`);
export const describe = (out) => (out.length ? out.map(cmdText).join(' + ') : 'tidak ada');
export function traceOptions(row) {
  const [, , topic, x] = row.e; const f = fmt(topic, x);
  const pool = topic === 'air' ? ['pompa NYALA', 'pompa MATI', `pompa MATI + peringatan "Air tandon rendah: ${f} cm"`, 'tidak ada']
    : topic === 'suhu' ? ['kipas NYALA', 'kipas MATI', 'tidak ada', 'pompa NYALA']
      : [`peringatan "pH di luar batas: ${f}"`, 'tidak ada', 'pompa MATI', 'kipas NYALA'];
  const right = describe(row.out);
  return [...new Set([right, ...pool])].slice(0, 4).map((l) => [l, l === right]);
}
export const msgText = (e) => `kebun/${e[2]} ${fmt(e[2], e[3])}`;
export function testResult(x) { const { out } = controller('suhu', x, true); return !out.length ? 'tidak ada' : out[0][0] === 'peringatan' ? 'peringatan sensor rusak' : `kipas ${out[0][1]}`; }
export const TEST_OPTS = ['tidak ada', 'kipas NYALA', 'kipas MATI', 'peringatan sensor rusak'];

export const REQS = [['a', 'Kirim peringatan ke ponsel ketua RT bila tinggi air lebih dari 2 meter', 'f'], ['b', 'Bunyikan sirene di balai desa bila tinggi air lebih dari 3 meter', 'f'], ['c', 'Tetap bekerja saat listrik padam (baterai atau panel surya)', 'a'], ['d', 'Sirene tidak berbunyi hanya karena satu pembacaan yang salah', 'a'], ['e', 'Memberi tahu bila sensor tidak mengirim data', 'a'], ['f', 'Dasbor berwarna biru supaya menarik', 'x']];
const REQ_OPTS = [['f', 'Yang dilakukan'], ['a', 'Syarat keandalan'], ['x', 'Bukan kebutuhan']];
const REQ_WHY = { f: 'Ini hal yang harus dilakukan sistem.', a: 'Ini syarat supaya sistem tetap bisa diandalkan.', x: 'Warna tidak disebut di kartu kebutuhan dan tidak membuat warga lebih aman.' };

// --- view pieces ---
const NODES = [['s-suhu', '🌡', 'Sensor suhu'], ['s-ph', '🧪', 'Sensor pH'], ['s-air', '📏', 'Sensor air'], ['perantara', '📮', 'Perantara pesan'], ['pengendali', '🧠', 'Pengendali'], ['pompa', '⛲', 'Pompa'], ['kipas', '🌀', 'Kipas'], ['dasbor', '🖥', 'Dasbor'], ['ponsel', '📱', 'Ponsel Pak Darto']];
const SUBS = Object.fromEntries(TOPICS.map(([t, , s]) => [t.split('/').pop(), s]));

function makeBoard() {
  const nodes = {}; const st = { pompa: 'MATI', kipas: 'MATI', dash: {}, alerts: [] };
  for (const [k, ic, name] of NODES) nodes[k] = el('div', { class: `hk-node n-${k}` }, el('span', { class: 'hk-ikon' }, ic), el('b', null, name), el('div', { class: 'hk-isi' }));
  const feed = el('div', { class: 'hk-alur' });
  const col = (...ks) => el('div', { class: 'hk-kol' }, ks.map((k) => nodes[k]));
  const root = el('div', { class: 'hk-papan' }, el('div', { class: 'hk-tiga' }, col('s-suhu', 's-ph', 's-air'), col('perantara', 'pengendali'), col('pompa', 'kipas', 'dasbor', 'ponsel')), feed);
  const sw = (v) => el('span', { class: `hk-saklar ${v === 'NYALA' ? 'on' : ''}` }, v);
  function show(s = st) {
    Object.assign(st, s);
    nodes.pompa.querySelector('.hk-isi').replaceChildren(sw(st.pompa));
    nodes.kipas.querySelector('.hk-isi').replaceChildren(sw(st.kipas));
    nodes.dasbor.querySelector('.hk-isi').replaceChildren(...['suhu', 'ph', 'air'].map((t) => el('span', null, `${t === 'ph' ? 'pH' : t}: ${t in st.dash ? fmt(t, st.dash[t]) + UNIT[t] : '–'}`)), el('span', { class: st.alerts.length ? 'awas' : '' }, `⚠ ${st.alerts.length}`));
    nodes.ponsel.querySelector('.hk-isi').replaceChildren(st.alerts.length ? el('small', null, `${st.alerts.length} peringatan · ${st.alerts[st.alerts.length - 1]}`) : el('small', null, 'belum ada pesan'));
  }
  const clear = () => { for (const n of Object.values(nodes)) n.classList.remove('kirim', 'terima', 'hilang'); };
  const line = (t, cls = '') => feed.append(el('div', { class: cls }, t));
  // Plays one event: the envelope goes sensor → broker → subscribers, then each command.
  function play(row, done, ms = 380) {
    const [k, time, topic, x, , lost] = row.e; const steps = [];
    steps.push(() => { clear(); feed.replaceChildren(); nodes[`s-${topic}`].classList.add('kirim'); nodes[`s-${topic}`].querySelector('.hk-isi').replaceChildren(el('code', null, `${fmt(topic, x)}`)); line(`${k} · ${time} · Sensor ${topic === 'ph' ? 'pH' : topic} kirim ✉ ${msgText(row.e)}`); });
    if (lost) steps.push(() => { nodes[`s-${topic}`].classList.add('hilang'); line('✗ Jaringan terputus: pesan hilang sebelum sampai ke perantara.', 'hilang'); });
    else {
      steps.push(() => { nodes.perantara.classList.add('kirim'); line(`📮 Perantara meneruskan ke: ${SUBS[topic].join(', ')}`); });
      steps.push(() => { for (const s of SUBS[topic]) nodes[s].classList.add('terima'); st.dash = { ...st.dash, [topic]: x }; show(); });
      for (const c of row.out) {
        const t = c[0] === 'peringatan' ? 'peringatan' : c[0];
        steps.push(() => { clear(); nodes.pengendali.classList.add('kirim'); nodes.perantara.classList.add('kirim'); line(`🧠 Pengendali kirim ✉ kebun/${c[0] === 'peringatan' ? 'peringatan' : `perintah/${c[0]}`} ${c[0] === 'peringatan' ? `"${c[1]}"` : c[1]} → ${SUBS[t].join(', ')}`); });
        steps.push(() => { for (const s of SUBS[t]) nodes[s].classList.add('terima'); if (c[0] === 'peringatan') st.alerts = [...st.alerts, c[1]]; else st[c[0]] = c[1]; show(); });
      }
      if (!row.out.length) steps.push(() => line('🧠 Pengendali: tidak ada perintah.'));
    }
    let i = 0;
    const tick = () => { if (!root.isConnected && i > 0) return; if (i < steps.length) { steps[i++](); setTimeout(tick, ms); } else { show({ pompa: row.pompa, kipas: row.kipas, dash: row.dash, alerts: row.alerts }); done?.(); } };
    tick();
  }
  show();
  return { el: root, show, play, clear, feed };
}

function makeCode(v2) {
  const rows = code(v2).map(([k, t, ind, nu]) => el('div', { class: `hk-baris ${nu ? 'baru' : ''}`, 'data-k': k }, el('span', { style: { paddingLeft: `${ind * 1.6}em` } }, t || ' ')));
  const root = el('div', { class: 'hk-kode' }, rows);
  const mark = (hit) => { for (const r of rows) r.classList.toggle('jalan', hit.includes(r.dataset.k)); };
  return { el: root, mark };
}

function pickRows(wrap, ctx, { prompt, rows, opts, why, done, info, cls = '' }) {
  const res = {};
  const msg = el('p', { class: 'reveal info' }, info);
  const box = el('div', { class: `hk-pilih ${cls}` });
  const draw = () => box.replaceChildren(...rows.map(([k, t, a, w]) => el('div', { class: `hk-pbaris ${k in res ? 'beres' : ''}` }, el('span', null, t), k in res ? el('b', null, opts.find((o) => o[0] === a)[1]) : el('div', { class: 'seg' }, opts.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
    if (v !== a) { ctx.mistake(); say(msg, 'bad', `${t}: belum tepat. ${why ? why(k, a, false) : ''}`); return; }
    res[k] = v; ctx.sound.tap(); say(msg, '', w || (why ? why(k, a, true) : 'Tepat.')); draw();
    if (Object.keys(res).length === rows.length) setTimeout(done, 1500);
  }))))));
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function topicTable() {
  return el('table', { class: 'hk-tabel' }, el('tr', null, el('th', null, 'Topik'), el('th', null, 'Dikirim oleh'), el('th', null, 'Pelanggan')), TOPICS.map(([t, by, subs]) => el('tr', null, el('td', null, el('code', null, t)), el('td', null, by), el('td', null, subs.map((s) => ({ pengendali: 'Pengendali', dasbor: 'Dasbor', pompa: 'Pompa', kipas: 'Kipas', ponsel: 'Ponsel Pak Darto' })[s]).join(', ')))));
}

function eventCard(e) {
  return el('div', { class: `hk-kejadian ${e[5] ? 'hilang' : ''}` }, el('b', null, `${e[0]} · pukul ${e[1]}`), el('span', null, e[4] ? `${e[4]}: ` : ''), el('code', null, msgText(e)), e[5] ? el('em', null, ' (pesan tidak sampai)') : null);
}

// Trace a range of events: pick the controller's output, then watch the envelopes.
function traceRound(wrap, ctx, { from, to, done }) {
  const rows = simulate(false); let i = from;
  const board = makeBoard(); const cv = makeCode(false);
  if (from > 0) board.show({ pompa: rows[from - 1].pompa, kipas: rows[from - 1].kipas, dash: rows[from - 1].dash, alerts: rows[from - 1].alerts });
  const area = el('div', { class: 'hk-tanya' });
  const msg = el('p', { class: 'reveal info' }, 'Pilih perintah atau peringatan yang dikirim pengendali.');
  wrap.append(el('p', { class: 'prompt' }, `Jalankan program: ${rows[from].e[0]}–${rows[to - 1].e[0]}`), el('div', { class: 'hk-dua' }, board.el, cv.el), area, msg);
  function ask() {
    if (i >= to) { done(); return; }
    const row = rows[i]; cv.mark([]);
    area.replaceChildren(eventCard(row.e));
    choice(area, { prompt: 'Apa yang dikirim pengendali?', ctx, shuffle: true, columns: 4, options: traceOptions(row).map(([l, c]) => ({ label: l, correct: c })), onRight: () => {
      ctx.sound.good(); cv.mark(row.hit);
      say(msg, '', `${row.e[0]}: ${describe(row.out)}${row.e[5] ? ', karena pesannya tidak sampai' : ''}. Pompa ${row.pompa}, kipas ${row.kipas}.`);
      board.play(row, () => { i++; setTimeout(ask, 900); });
    } });
  }
  ask();
}

export default {
  id: 'sma-30-hidroponik',
  title: 'Kebun Hidroponik IoT',
  topic: 'Internet of Things: sensor, aktuator, perantara pesan, publish–subscribe, dan proses rekayasa',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🥬',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Jaga kebun hidroponik Kelompok Tani Muda: jalankan program pengendali untuk sepuluh kejadian, temukan kesalahan akibat sensor rusak dan pesan hilang, perbaiki programnya, lalu uji ulang.',
  extraModes: [
    { id: 'simulasi', icon: '📮', label: 'Simulasi Perantara', desc: 'Jalankan K1–K10 satu per satu: amplop pesan bergerak lewat perantara, baris program disorot, lalu ubah ke versi 2 dan uji nilai batas', create: createSim },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Kejadian Antartim', desc: 'Tim bergiliran menebak perintah pengendali untuk setiap kejadian; tebakan benar 2 poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hidroponik' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      if (r === 0) pickRows(wrap, ctx, { prompt: 'Mengenal perangkat: apa jenis setiap perangkat?', rows: DEVICES.map(([n, t, w]) => [n, n, t, w]), opts: TYPES, info: 'Sensor mengukur, aktuator menggerakkan, perantara meneruskan, pengendali memutuskan, antarmuka menampilkan untuk manusia.', why: () => 'Ingat: aktuator menggerakkan sesuatu, antarmuka adalah tampilan untuk manusia.', done: next });
      else if (r === 1) ask('Kelompok tani ingin menambah dasbor kedua di balai desa. Apa yang perlu diubah?', [['Cukup daftar langganan: dasbor kedua berlangganan topik suhu, pH, air, dan peringatan', true], ['Program setiap sensor, supaya mengirim ke dua dasbor'], ['Program pengendali, supaya mengirim ulang setiap pesan'], ['Perantara harus diganti dengan yang lebih besar']], 1, topicTable(),
        then(() => ask('Mengapa pompa dimatikan bila air tandon kurang dari 20 cm?', [['Pompa yang berjalan tanpa air bisa panas dan rusak', true], ['Supaya hemat listrik saja'], ['Supaya tanaman tidak terlalu banyak minum'], ['Supaya dasbor tidak penuh']])));
      else if (r === 2) traceRound(wrap, ctx, { from: 0, to: 3, done: next });
      else if (r === 3) traceRound(wrap, ctx, { from: 3, to: 6, done: then(() => ask('Mengapa pada K5 kipas tidak dimatikan, padahal suhu turun ke 29?', [['29 tidak lebih dari 30 dan tidak kurang dari 28, jadi tidak ada perintah; dua batas mencegah kipas nyala-mati berulang-ulang', true], ['Karena pesannya hilang'], ['Karena kipas rusak'], ['Karena pengendali hanya membaca suhu setiap jam']])) });
      else if (r === 4) traceRound(wrap, ctx, { from: 6, to: 10, done: then(() => ask('Pukul 15.00, berapa nilai air tandon (cm) yang tampil di dasbor?', [[18, true], [20], [35], [40]], 4, null,
        then(() => ask('Berapa peringatan yang sudah diterima ponsel Pak Darto?', [[1], [2, true], [3], [4]], 4)))) });
      else if (r === 5) ask('Pada dua kejadian, sistem berperilaku salah. Kejadian mana?', [['K7 (kipas mati karena −127, padahal larutan panas) dan K10 (pompa tetap mati padahal tandon sudah diisi)', true], ['K5 dan K10'], ['K7 dan K9'], ['K6 dan K9']], 1, null,
        then(() => ask('Aturan suhu versi 2: kondisi mana yang menandai sensor rusak? (suhu larutan tidak mungkin di bawah 0 °C atau di atas 50 °C)', [['x < 0 ATAU x > 50', true], ['x < 0 DAN x > 50'], ['x = -127'], ['x > 50']], 2, el('pre', { class: 'hk-pre' }, 'SAAT menerima "kebun/suhu" dengan nilai x:\n    JIKA ........ MAKA\n        kirim "kebun/peringatan" "Sensor suhu rusak? Nilai: x"\n    LAINNYA JIKA x > 30 MAKA\n        kirim "kebun/perintah/kipas" "NYALA"\n    LAINNYA JIKA x < 28 MAKA\n        kirim "kebun/perintah/kipas" "MATI"'))));
      else if (r === 6) ask('Sensor mengirim nilai setiap 10 menit. Pengawas memberi peringatan bila pesan air terakhir lebih dari … menit yang lalu?', [['30 menit: cukup longgar untuk satu dua pesan terlambat, cukup cepat untuk tahu sensor diam', true], ['5 menit: lebih cepat dari pesan rutin, jadi peringatan muncul terus'], ['24 jam: terlambat, tanaman sudah layu'], ['0 menit']], 1, null,
        then(() => ask('Dengan pesan rutin, bila hanya pesan pukul 15.00 yang hilang, pukul berapa pompa menyala lagi?', [['15.00'], ['15.10', true], ['15.30'], ['16.00']], 4, null,
          then(() => ask('Bagaimana bila yang hilang adalah perintah "pompa MATI" pada K9? Pengaman apa yang tidak bergantung pada jaringan?', [['Saklar pelampung di tandon yang langsung memutus listrik pompa bila air terlalu rendah', true], ['Menambah dasbor ketiga'], ['Mengirim peringatan ke lebih banyak ponsel'], ['Memperbesar batas air menjadi 30 cm']])))));
      else if (r === 7) pickRows(wrap, ctx, { prompt: 'Uji ulang aturan suhu versi 2, termasuk nilai batas', rows: TEST.map((x) => [String(x), `x = ${fmt('suhu', x)}`, testResult(x)]), opts: TEST_OPTS.map((o) => [o, o]), cls: 'uji', info: 'Versi 2: dulu periksa x < 0 ATAU x > 50, lalu x > 30, lalu x < 28.', why: (k, a) => `Periksa urutannya: rusak (x < 0 ATAU x > 50)? lebih dari 30? kurang dari 28?`,
        done: then(() => ask('Jalankan lagi K7 (suhu −127) dengan versi 2. Apa yang terjadi?', [['Peringatan "Sensor suhu rusak? Nilai: -127" dikirim, dan kipas tetap NYALA', true], ['Kipas dimatikan seperti sebelumnya'], ['Kipas dimatikan dan peringatan dikirim'], ['Tidak terjadi apa-apa']])) });
      else if (r === 8) pickRows(wrap, ctx, { prompt: 'Kartu kebutuhan: pemantau sungai Desa Sukamakmur', rows: REQS.map(([k, t, a]) => [k, t, a]), opts: REQ_OPTS, info: 'Ketua RT ingin peringatan bila air > 2 m dan sirene bila > 3 m. Listrik sering padam, sinyal lemah, dan sirene tidak boleh berbunyi karena satu pembacaan salah.', why: (k, a, ok) => (ok ? REQ_WHY[a] : 'Apakah ini tindakan sistem, syarat agar tetap andal, atau tidak diminta?'),
        done: then(() => ask('Rancang: aturan mana yang memenuhi "sirene tidak boleh berbunyi hanya karena satu pembacaan salah"?', [['JIKA x > 3 DAN pembacaan sebelumnya juga > 3 MAKA kirim "sungai/perintah/sirene" "NYALA"', true], ['JIKA x > 3 MAKA kirim "sungai/perintah/sirene" "NYALA"'], ['JIKA x > 2 MAKA kirim "sungai/perintah/sirene" "NYALA"'], ['SETIAP 5 menit kirim "sungai/perintah/sirene" "NYALA"']], 1, null,
          then(() => ask('Uji: kasus uji mana yang memeriksa pembacaan yang salah?', [['Satu pembacaan 9,9 m: peringatan sensor rusak, sirene tidak menyala', true], ['Tinggi air 1,5 m: tidak ada'], ['Tinggi air 2,4 m: peringatan'], ['3,2 m lalu 3,4 m: sirene menyala']])))) });
      else ask('Tantangan: tiga sensor mengirim pesan setiap 10 menit. Berapa pesan dalam sehari?', [[72], [144], [432, true], ['1.296']], 4, null,
        then(() => ask('Setiap pesan sekitar 50 byte. Berapa byte dalam 30 hari?', [['21.600'], ['64.800'], ['648.000', true], ['6.480.000']], 4, null,
          then(() => ask('Cara mana mengurangi banyak pesan tanpa membuat sistem kurang aman?', [['Kirim hanya bila nilai berubah cukup banyak, ditambah pesan rutin setiap 30 menit supaya pengawas tahu sensor masih hidup', true], ['Matikan pengawas'], ['Kirim setiap 6 jam tanpa pengawas'], ['Hapus sensor pH']])))));
    }
    render();
  },
};

function createSim(root, ctx) {
  const wrap = el('div', { class: 'act hidroponik' });
  root.append(wrap);
  let v2 = false;
  function start() {
    const rows = simulate(v2); let i = 0; let busy = false;
    const board = makeBoard(); const cv = makeCode(v2);
    const hist = el('table', { class: 'hk-tabel riwayat' });
    const drawHist = () => hist.replaceChildren(el('tr', null, ['Kejadian', 'Pukul', 'Pesan', 'Perintah atau peringatan', 'Pompa', 'Kipas'].map((h) => el('th', null, h))), ...rows.slice(0, i).map((r) => el('tr', { class: r.e[5] ? 'hilang' : '' }, el('td', null, r.e[0]), el('td', null, r.e[1]), el('td', null, el('code', null, msgText(r.e)), r.e[5] ? ' ✗ hilang' : ''), el('td', null, describe(r.out)), el('td', { class: r.pompa === 'NYALA' ? 'on' : '' }, r.pompa), el('td', { class: r.kipas === 'NYALA' ? 'on' : '' }, r.kipas))));
    const card = el('div', { class: 'hk-tanya' });
    const showNext = () => card.replaceChildren(i < rows.length ? eventCard(rows[i].e) : el('p', null, v2 ? 'Semua kejadian selesai. Pesan rutin pukul 15.10 menyalakan pompa lagi.' : 'Semua kejadian selesai. Lihat K7 dan K10: apa yang salah?'));
    const stepBtn = button('▶ Jalankan kejadian berikutnya', () => {
      if (busy || i >= rows.length) return; busy = true; ctx.sound.tap(); const row = rows[i]; cv.mark(row.hit);
      board.play(row, () => { i++; busy = false; drawHist(); showNext(); });
    }, 'primary');
    const testBox = el('div', { class: 'hk-uji' });
    const testOut = el('p', { class: 'reveal info' }, 'Ketuk nilai suhu untuk menguji aturan suhu saja.');
    testBox.append(el('b', null, 'Uji nilai batas suhu:'), el('div', { class: 'seg' }, TEST.map((x) => onTap(el('button', { class: 'seg-btn', type: 'button' }, fmt('suhu', x)), () => {
      const { out, hit } = controller('suhu', x, v2); cv.mark(hit); ctx.sound.tap(); say(testOut, '', `x = ${fmt('suhu', x)}: ${describe(out)}`);
    }))), testOut);
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Simulasi perantara pesan'),
      el('div', { class: 'seg hk-versi' }, [[false, 'Program versi 1'], [true, 'Versi 2: validasi, pesan rutin, pengawas']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${v === v2 ? 'on' : ''}`, type: 'button' }, l), () => { if (v !== v2) { v2 = v; start(); } }))),
      el('div', { class: 'hk-dua' }, board.el, cv.el), el('div', { class: 'hk-langkah' }, card, el('div', { class: 'kode-baris' }, stepBtn, button('↺ Ulang dari pukul 08.00', start))),
      testBox, hist);
    drawHist(); showNext();
  }
  start();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act hidroponik' });
  root.append(wrap);
  function start(nT) {
    const pts = Array(nT).fill(0); const rows = simulate(false); let k = 0;
    const board = makeBoard();
    function turn() {
      if (k >= rows.length) { finishBoard(wrap, ctx, { title: 'Kejadian antartim selesai', pts, again: () => pickTeams(wrap, 'Kejadian Antartim', start) }); return; }
      const t = k % nT; const row = rows[k]; let answered = false;
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: apa yang dikirim pengendali?`);
      const opts = ctx.rand.shuffle(traceOptions(row));
      const area = el('div', { class: 'opts', style: { '--cols': 4 } }, opts.map(([l, ok]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), (e) => {
        if (answered) return; answered = true; if (ok) pts[t] += 2; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); ctx.sound[ok ? 'good' : 'bad']();
        say(msg, ok ? '' : 'bad', `${ok ? 'Tepat, +2. ' : 'Belum tepat. '}${row.e[0]}: ${describe(row.out)}. Pompa ${row.pompa}, kipas ${row.kipas}.`);
        wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, t));
        board.play(row, () => { k++; setTimeout(turn, 1600); }, 300);
      })));
      wrap.replaceChildren(scoreBar(pts, t), el('p', { class: 'prompt' }, `Tim ${t + 1}: kejadian ${row.e[0]}`), board.el, el('div', { class: 'hk-tanya' }, eventCard(row.e)), area, msg);
    }
    turn();
  }
  pickTeams(wrap, 'Kejadian Antartim', start);
}
