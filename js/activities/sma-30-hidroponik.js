// Kebun Hidroponik IoT — SMA/SMK (16–18 tahun), Internet of Things.
// Sensors publish to a message broker, the controller runs event rules, and
// pump, fan, dashboard and phone subscribe to topics. Ten events reveal a broken
// sensor and a lost message; version 2 adds validation, periodic messages and a watchdog.

import { el, onTap, button, shake } from '../core/util.js';
import { choice, dnd } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard, fmtNum } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

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

// The program, one short block card per rule (at most 8 lines of 40 characters).
export function ruleCards(v2 = false) {
  const air = [['a0', 'SAAT kebun/air = x:'], ['a1', '  JIKA x < 20:'], ['a2', '    pompa MATI'], ['a3', '    peringatan "Air rendah"'], ['a4', '  LAINNYA:'], ['a5', '    pompa NYALA']];
  const suhu = v2 ? [['s0', 'SAAT kebun/suhu = x:'], ['s1', '  JIKA x < 0 ATAU x > 50:', true], ['s2', '    peringatan "Sensor rusak?"', true], ['s3', '  LAINNYA JIKA x > 30:'], ['s4', '    kipas NYALA'], ['s5', '  LAINNYA JIKA x < 28:'], ['s6', '    kipas MATI']]
    : [['s0', 'SAAT kebun/suhu = x:'], ['s1', '  JIKA x > 30:'], ['s2', '    kipas NYALA'], ['s3', '  JIKA x < 28:'], ['s4', '    kipas MATI']];
  const ph = [['p0', 'SAAT kebun/ph = x:'], ['p1', '  JIKA x < 5,5 ATAU x > 6,5:'], ['p2', '    peringatan "pH di luar batas"']];
  const cards = [['a', 'Aturan air', air], ['s', 'Aturan suhu', suhu], ['p', 'Aturan pH', ph]];
  if (v2) cards.push(['w', 'Pengawas', [['w0', 'SETIAP 10 menit:', true], ['w1', '  JIKA air diam > 30 menit:', true], ['w2', '    peringatan "Sensor air diam"', true]]]);
  return cards;
}
function makeCode(v2) {
  const cards = ruleCards(v2);
  const tabs = el('div', { class: 'hk-tab-aturan' });
  const body = el('div', { class: 'hk-kode' });
  let cur = 'a'; let hit = [];
  const draw = () => {
    fill(tabs, cards.map(([k, l]) => onTap(el('button', { class: `hk-tab ${k === cur ? 'on' : ''}`, type: 'button' }, l), () => { cur = k; draw(); })));
    const card = cards.find((c) => c[0] === cur);
    fill(body, card[2].map(([k, t, nu]) => el('div', { class: `hk-baris ${nu ? 'baru' : ''} ${hit.includes(k) ? 'jalan' : ''}`, 'data-k': k }, t)));
  };
  const root = el('div', { class: 'hk-program' }, tabs, body);
  const mark = (h) => { hit = h; if (h.length) cur = h[0][0]; draw(); };
  draw();
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

// ---------- Kebun Tetap Hijau: the ten missions ----------
export const PICKS = [['pompa', 'NYALA', '⛲ pompa NYALA'], ['pompa', 'MATI', '⛲ pompa MATI'], ['kipas', 'NYALA', '🌀 kipas NYALA'], ['kipas', 'MATI', '🌀 kipas MATI'], ['peringatan', '', '⚠️ peringatan']];
const pickKey = ([d, v]) => (d === 'peringatan' ? 'peringatan' : `${d} ${v}`);
export const HARM = { K7: 'Kipas mati padahal larutan makin panas: satu daun layu!', K10: 'Tandon sudah penuh, tetapi pompa tetap mati: satu daun layu!' };
export const NUMS = [-127, 0, 20, 28, 30, 50, 100];
export const SAFETY = [['pelampung', '🎚️ Saklar pelampung di tandon', true, 'Saklar pelampung memutus listrik pompa langsung, tanpa jaringan.'], ['dasbor3', '🖥 Dasbor ketiga', false, 'Dasbor juga butuh jaringan dan hanya menampilkan.'], ['ponsel2', '📱 Ponsel tambahan', false, 'Ponsel juga butuh jaringan; perintah yang hilang tetap hilang.']];
export const SLOTS7 = [['sensor', 'Sensor'], ['awas', 'Ambang peringatan'], ['sirene', 'Ambang sirene'], ['tahan', 'Anti salah baca'], ['valid', 'Batas validasi'], ['pengawas', 'Pengawas'], ['daya', 'Daya cadangan']];
export const CARDS7 = [['c1', 'sensor', '📏 Sensor tinggi air sungai', true], ['c2', 'sensor', '🌡 Sensor suhu air', false, 'Yang perlu diukur tinggi air, bukan suhu.'], ['c3', 'awas', '> 2 m: peringatan ke ponsel ketua RT', true], ['c4', 'awas', '> 1 m: peringatan ke semua warga', false, 'Kebutuhannya 2 m; 1 m membuat peringatan terlalu sering sehingga diabaikan.'], ['c5', 'sirene', '> 3 m: sirene di balai desa', true], ['c6', 'tahan', 'Sirene bila dua pembacaan berturut-turut > 3 m', true], ['c7', 'tahan', 'Sirene langsung pada satu pembacaan > 3 m', false, 'Satu pembacaan salah bisa membunyikan sirene dan membuat warga panik.'], ['c8', 'valid', '< 0 m atau > 8 m: peringatan "sensor rusak?"', true], ['c9', 'pengawas', 'Tanpa pesan lebih dari 30 menit: peringatan', true], ['c10', 'daya', '🔋 Baterai cadangan dan panel surya', true], ['c11', 'daya', '🎨 Dasbor berwarna biru', false, 'Warna tidak membuat sistem tetap hidup saat listrik padam.']];
export const STORMS = [['b1', 'Tinggi air 1,5 m', 'tidak', 'Di bawah 2 m: tidak ada tindakan.'], ['b2', 'Tinggi air 2,4 m', 'awas', 'Lebih dari 2 m: peringatan ke ponsel ketua RT.'], ['b3', '3,2 m, lalu 3,4 m', 'sirene', 'Dua pembacaan berturut-turut lebih dari 3 m: sirene menyala pada pembacaan kedua.'], ['b4', 'Satu pembacaan 9,9 m', 'rusak', 'Di luar 0–8 m: peringatan sensor rusak, sirene tidak menyala.'], ['b5', 'Listrik padam, sensor diam 30 menit', 'diam', 'Pengawas memberi peringatan karena tidak ada pesan.']];
export const OUTCOMES = [['tidak', '😴 Tidak ada'], ['awas', '⚠️ Peringatan'], ['sirene', '🚨 Sirene'], ['rusak', '🔧 Sensor rusak?'], ['diam', '⏱️ Pengawas']];
export const QUOTA = [[3, 'sensor'], [6, 'pesan per jam'], [24, 'jam'], [50, 'byte per pesan'], [30, 'hari']];
export const QUOTA_CHIPS = [3, 6, 24, 50, 30, 10, 60, 12];
export const SAVERS = [['ubah', 'Kirim hanya bila nilai berubah cukup banyak, ditambah pesan rutin setiap 30 menit', true, 'Pesan jauh berkurang, dan pengawas tetap tahu sensor masih hidup.'], ['pengawas', 'Matikan pengawas supaya pesan rutin tidak perlu', false, 'Tanpa pengawas, sensor yang mati tidak ketahuan.'], ['jarang', 'Kirim setiap 6 jam saja', false, 'Air bisa habis dalam 6 jam tanpa ada yang tahu.']];
const HEAD30 = {
  perangkat: ['Kenali Perangkat', 'Seret setiap perangkat ke jenisnya, lalu langgankan dasbor kedua.'],
  hari1: ['Hari Pertama: Pagi', 'K1–K3: isi kotak keluar pengendali sesuai aturan, lalu jalankan.'],
  hari2: ['Hari Pertama: Siang', 'K4–K6: isi kotak keluar pengendali sesuai aturan, lalu jalankan.'],
  hari3: ['Hari Pertama: Sore', 'K7–K10: jalankan, lalu tunjuk kejadian yang membuat daun layu.'],
  bug: ['Buru Bug Sensor', 'Pasang batas validasi supaya nilai −127 tidak mematikan kipas.'],
  hilang: ['Pesan yang Hilang', 'Nyalakan pesan rutin dan pengawas, lalu pasang pengaman tanpa jaringan.'],
  batas: ['Uji Nilai Batas', 'Seret tujuh nilai uji ke hasil aturan suhu versi 2.'],
  sungai: ['Rancang Pemantau Sungai', 'Rakit pemantau banjir Desa Sukamakmur dari kartu blok.'],
  badai: ['Uji Badai', 'Seret setiap kartu badai ke hasil yang akan terjadi pada rakitanmu.'],
  bos: ['Hemat Kuota', 'Hitung pesan dan byte sebulan, lalu pilih cara hemat yang tetap aman.'],
};
const msg30 = (t) => el('p', { class: 'reveal info' }, t);
function leafPot(start = 10) {
  let n = start; const leaves = el('span', { class: 'hk30-daun' });
  const draw = () => fill(leaves, Array.from({ length: 10 }, (_, i) => el('i', { class: i < n ? '' : 'gugur' }, i < n ? '🍃' : '·')));
  const node = el('div', { class: 'hk30-pot' }, el('span', null, '🪴 Daun kebun'), leaves);
  draw();
  return { node, drop() { if (n > 0) { n--; draw(); node.classList.remove('goyang'); void node.offsetWidth; node.classList.add('goyang'); } }, grow() { if (n < 10) { n++; draw(); } } };
}
const dropBins = (defs, cls = '') => defs.map(([k, l]) => el('div', { class: `hk30-kotak ${cls} k-${k}`, 'data-drop': k }, el('b', null, l), el('div', { class: 'hk30-kotak-isi' })));
function sortGame(area, ctx, { oops, msg, items, bins, cols, check, chip, after, done }) {
  const tray = el('div', { class: 'hk30-baki' }, ctx.rand.shuffle(items.map((x) => x[0])).map((k) => el('div', { class: 'hk30-kartu', 'data-drag': k }, items.find((x) => x[0] === k)[1])));
  let left = items.length;
  const board = el('div', { class: 'hk30-papan' }, el('div', { class: 'hk30-kotak-kotak', style: { '--kol': cols || bins.length } }, bins), tray);
  dnd(board, (card, box) => {
    if (!left) return;
    const it = items.find((x) => x[0] === card.dataset.drag); const why = check(it, box.dataset.drop);
    if (why) { oops(); shake(card); say(msg, 'bad', why); return; }
    card.remove(); box.querySelector('.hk30-kotak-isi').append(chip ? chip(it) : el('span', { class: 'hk30-chip' }, it[1])); ctx.sound.tap(); left--;
    after?.(it, left); if (!left) done();
  });
  area.append(board, msg);
}

// Misi 1: device types, then a second dashboard by subscription only.
function deviceRound(area, ctx, { oops, done }) {
  const msg = msg30('Seret setiap perangkat ke jenisnya: sensor mengukur, aktuator menggerakkan, perantara meneruskan, pengendali memutuskan, antarmuka menampilkan.');
  sortGame(area, ctx, { oops, msg, items: DEVICES.map(([n, t, w]) => [n, n, t, w]), bins: dropBins(TYPES), check: (d, k) => (k !== d[2] ? 'Belum tepat. Aktuator menggerakkan sesuatu; antarmuka adalah tampilan untuk manusia.' : ''), after: (d) => say(msg, '', d[3]), done: () => setTimeout(subs, 1600) });
  function subs() {
    area.replaceChildren();
    say(msg, 'info', 'Kelompok tani menambah dasbor kedua di balai desa. Seret kartunya ke setiap topik yang perlu dilanggani.');
    const want = ['suhu', 'ph', 'air', 'peringatan'];
    const rows = TOPICS.map(([t, by, s]) => { const key = t.split('/').pop(); return el('div', { class: 'hk30-topik', 'data-drop': key }, el('code', null, t), el('small', null, `dari ${by}`), el('span', { class: 'hk30-pelanggan' }, s.map((x) => el('i', null, x)))); });
    const token = el('div', { class: 'hk30-kartu dasbor2', 'data-drag': 'd2' }, '🖥 Dasbor balai desa');
    const got = new Set();
    const board = el('div', { class: 'hk30-dua' }, el('div', { class: 'hk30-langganan' }, el('b', null, '📮 Daftar langganan perantara'), rows), el('div', { class: 'hk30-kanan' }, token));
    dnd(board, (card, row) => {
      const key = row.dataset.drop; if (got.has(key) || got.size === 4) return;
      if (!want.includes(key)) { oops(); shake(row); say(msg, 'bad', 'Dasbor hanya menampilkan data untuk manusia; perintah pompa dan kipas tidak untuknya.'); return; }
      got.add(key); row.querySelector('.hk30-pelanggan').append(el('i', { class: 'baru' }, 'dasbor 2')); row.classList.add('isi'); ctx.sound.tap();
      if (got.size < 4) { say(msg, '', `Dasbor 2 berlangganan ${row.querySelector('code').textContent}.`); return; }
      token.remove(); say(msg, '', 'Selesai tanpa mengubah satu baris program pun: sensor tetap mengirim ke perantara, perantara yang meneruskan. Itulah kekuatan publish–subscribe.'); done();
    });
    area.append(board, msg);
  }
}

// Misi 2: fill the controller's outbox for each event, then watch the envelopes travel.
function dayRound(area, ctx, { oops, pot, from, to, finale, done }) {
  const rows = simulate(false); let i = from; let busy = false;
  const board = makeBoard(); const cv = makeCode(false);
  if (from > 0) board.show({ pompa: rows[from - 1].pompa, kipas: rows[from - 1].kipas, dash: rows[from - 1].dash, alerts: rows[from - 1].alerts });
  const msg = msg30('Baca aturannya, isi kotak keluar pengendali (kosong berarti tidak ada perintah), lalu jalankan.');
  const ev = el('div', { class: 'hk30-ev' }); const box = el('div', { class: 'hk30-keluar' });
  const sel = new Set();
  const drawBox = () => fill(box, el('b', null, '📤 Kotak keluar pengendali'), el('div', { class: 'hk30-pilih' }, PICKS.map(([d, v, l]) => onTap(el('button', { class: `hk30-tindak ${sel.has(pickKey([d, v])) ? 'on' : ''}`, type: 'button', 'data-k': pickKey([d, v]) }, l), () => {
    if (busy) return; const k = pickKey([d, v]);
    if (sel.has(k)) sel.delete(k); else { sel.add(k); if (d !== 'peringatan') sel.delete(pickKey([d, v === 'NYALA' ? 'MATI' : 'NYALA'])); }
    ctx.sound.tap(); drawBox();
  })), button('🧠 Jalankan', run, 'primary')));
  function show() { busy = false; box.classList.remove('sibuk'); const row = rows[i]; fill(ev, eventCard(row.e)); cv.mark([`${row.e[2][0]}0`]); sel.clear(); drawBox(); }
  function run() {
    if (busy) return; const row = rows[i];
    const want = new Set(row.out.map(pickKey));
    if (want.size !== sel.size || [...want].some((k) => !sel.has(k))) { oops(); shake(box); say(msg, 'bad', row.e[5] ? 'Pesannya tidak sampai ke perantara, jadi pengendali tidak menerima apa-apa.' : `Ikuti aturan untuk nilai ${fmt(row.e[2], row.e[3])}: periksa setiap JIKA.`); return; }
    busy = true; box.classList.add('sibuk'); ctx.sound.tap(); cv.mark(row.hit);
    say(msg, '', `${row.e[0]}: ${describe(row.out)}${row.e[5] ? ', karena pesannya hilang' : ''}.`);
    board.play(row, () => {
      if (HARM[row.e[0]]) { pot.drop(); say(msg, 'info', HARM[row.e[0]]); }
      i++;
      if (i < to) setTimeout(show, HARM[row.e[0]] ? 2200 : 700); else setTimeout(finale ? finale : done, 1500);
    }, 320);
  }
  area.append(el('div', { class: 'hk30-dua' }, board.el, el('div', { class: 'hk30-kanan' }, ev, cv.el, box)), msg);
  show();
  if (finale) finale = finaleFn;
  function finaleFn() {
    say(msg, 'info', 'Dua kejadian membuat daun layu. Ketuk keduanya.'); box.remove();
    const got = new Set();
    const chips = el('div', { class: 'hk30-riwayat' }, rows.map((r) => onTap(el('button', { class: 'hk30-k', type: 'button', 'data-k': r.e[0] }, `${r.e[0]} · ${r.e[1]}`), (e) => {
      const k = r.e[0]; if (got.has(k) || got.size === 2) return;
      if (!HARM[k]) { oops(); shake(e.currentTarget); say(msg, 'bad', `${k} berjalan sesuai harapan.`); return; }
      got.add(k); e.currentTarget.classList.add('on'); ctx.sound.tap();
      if (got.size === 2) { say(msg, '', 'K7: sensor rusak (−127) dikira dingin. K10: pesan hilang, pompa tidak pernah dinyalakan lagi. Dasbor masih menunjukkan air 18 cm.'); done(); }
    })));
    fill(ev, chips);
  }
}

// Misi 3: validation bounds for the temperature rule.
function bugRound(area, ctx, { oops, pot, done }) {
  const msg = msg30('K7: nilai −127 berarti kabel sensor lepas. Seret angka ke dua kotak supaya nilai mustahil ditandai rusak (suhu larutan selalu 0–50 °C).');
  const blanks = [0, 50].map((w, i) => el('span', { class: 'hk30-celah', 'data-drop': i }, '?'));
  const cardV = el('div', { class: 'hk30-kartu-aturan' }, el('div', null, 'SAAT kebun/suhu = x:'), el('div', { class: 'baru' }, '  JIKA x < ', blanks[0], ' ATAU x > ', blanks[1], ':'), el('div', { class: 'baru' }, '    peringatan "Sensor rusak?"'), el('div', null, '  LAINNYA JIKA x > 30:'), el('div', null, '    kipas NYALA'), el('div', null, '  LAINNYA JIKA x < 28:'), el('div', null, '    kipas MATI'));
  const tray = el('div', { class: 'hk30-angka-angka' }, NUMS.map((x) => el('div', { class: 'hk30-angka', 'data-drag': x }, fmt('suhu', x))));
  let left = 2;
  const board = el('div', { class: 'hk30-dua' }, cardV, el('div', { class: 'hk30-kanan' }, tray));
  dnd(board, (chip, blank) => {
    if (!left || blank.classList.contains('isi')) return;
    const x = +chip.dataset.drag; const w = [0, 50][+blank.dataset.drop];
    if (x !== w) { oops(); shake(chip); say(msg, 'bad', x === -127 ? 'Kalau hanya −127, kerusakan lain (misalnya 85 atau −50) tetap lolos.' : +blank.dataset.drop === 0 ? 'Suhu larutan tidak mungkin di bawah 0 °C; angka ini masih mungkin.' : 'Suhu larutan tidak mungkin di atas 50 °C; batas ini terlalu rendah atau terlalu tinggi.'); return; }
    blank.textContent = fmt('suhu', x); blank.classList.add('isi'); chip.remove(); ctx.sound.tap();
    if (--left) { say(msg, '', 'Tepat.'); return; }
    const { out } = controller('suhu', -127, true);
    say(msg, '', `Uji ulang K7 dengan versi 2: ${describe(out)}. Kipas tetap NYALA, satu daun segar kembali.`); pot.grow(); done();
  });
  area.append(board, msg);
}

// Misi 3: routine messages, a watchdog, and a safety that needs no network.
function lostRound(area, ctx, { oops, done }) {
  const msg = msg30('K10: pesan 15.00 hilang, pompa tidak pernah menyala lagi. Nyalakan pesan rutin, lalu pilih batas pengawas.');
  let routine = false; let wd = null; let stage = 1;
  const panel = el('div', { class: 'hk30-panel' });
  const drawPanel = () => fill(panel, onTap(el('button', { class: `hk30-sakelar ${routine ? 'on' : ''}`, type: 'button', 'data-k': 'rutin' }, `📨 Pesan rutin sensor setiap 10 menit: ${routine ? 'NYALA' : 'mati'}`), () => { if (routine) return; routine = true; ctx.sound.tap(); drawPanel(); say(msg, '', 'Sensor kini mengirim nilai setiap 10 menit, berubah atau tidak.'); }),
    el('div', { class: 'hk30-pengawas' }, el('b', null, '⏱️ Pengawas: peringatan bila pesan air diam lebih dari'), el('div', { class: 'hk30-yt' }, [[5, 'Lebih cepat dari pesan rutin, jadi peringatan muncul terus-menerus.'], [30, ''], [1440, 'Sehari penuh terlalu lambat; tanaman sudah layu.']].map(([m, why]) => onTap(el('button', { class: `hk30-tindak ${wd === m ? 'on' : ''}`, type: 'button', 'data-m': m }, `${m === 1440 ? '24 jam' : `${m} menit`}`), (e) => {
      if (wd) return; if (!routine) { say(msg, 'info', 'Nyalakan dulu pesan rutin: pengawas butuh pesan yang datang teratur.'); return; }
      if (why) { oops(); shake(e.currentTarget); say(msg, 'bad', why); return; }
      wd = m; ctx.sound.tap(); drawPanel(); stage = 2; timeline();
    })))));
  const line = el('div', { class: 'hk30-garis' });
  function timeline() {
    say(msg, 'info', 'Pesan 15.00 tetap hilang. Ketuk waktu pompa menyala lagi.');
    fill(line, [['15.00', '✗ pesan hilang'], ['15.10', '📨 pesan rutin'], ['15.20', '📨 pesan rutin'], ['15.30', '⏱️ batas pengawas']].map(([t, l]) => onTap(el('button', { class: 'hk30-waktu', type: 'button', 'data-t': t }, el('b', null, t), el('small', null, l)), (e) => {
      if (stage !== 2) return;
      if (t !== '15.10') { oops(); shake(e.currentTarget); say(msg, 'bad', t === '15.00' ? 'Pesan 15.00 hilang, jadi belum ada yang menyalakan pompa.' : 'Ada pesan rutin yang datang lebih awal.'); return; }
      stage = 3; e.currentTarget.classList.add('on'); ctx.sound.tap(); say(msg, '', 'Pesan rutin 15.10 membawa nilai 40 cm, dan pengendali menyalakan pompa.'); setTimeout(safety, 1500);
    })));
  }
  function safety() {
    say(msg, 'info', 'Bagaimana bila yang hilang perintah "pompa MATI" pada K9? Seret pengaman yang tidak bergantung pada jaringan ke tandon.');
    const tank = el('div', { class: 'hk30-tandon', 'data-drop': 'tandon' }, el('b', null, '🛢️ Tandon dan pompa'), el('div', { class: 'hk30-kotak-isi' }));
    const tray = el('div', { class: 'hk30-baki' }, SAFETY.map(([k, l]) => el('div', { class: 'hk30-kartu', 'data-drag': k }, l)));
    const board = el('div', { class: 'hk30-dua' }, tank, tray);
    dnd(board, (card) => {
      if (stage !== 3) return;
      const s = SAFETY.find((x) => x[0] === card.dataset.drag);
      if (!s[2]) { oops(); shake(card); say(msg, 'bad', s[3]); return; }
      stage = 4; card.classList.add('locked'); tank.querySelector('.hk30-kotak-isi').append(card); ctx.sound.tap(); say(msg, '', s[3]); done();
    });
    area.replaceChildren(board, msg);
  }
  drawPanel();
  area.append(panel, line, msg);
}

// Misi 4: boundary tests for version 2.
function boundaryRound(area, ctx, { oops, done }) {
  const msg = msg30('Aturan suhu versi 2: rusak (x < 0 ATAU x > 50)? lebih dari 30? kurang dari 28? Seret setiap nilai uji ke hasilnya.');
  const card = el('div', { class: 'hk30-kartu-aturan kecil' }, ['SAAT kebun/suhu = x:', '  JIKA x < 0 ATAU x > 50:', '    peringatan "Sensor rusak?"', '  LAINNYA JIKA x > 30:', '    kipas NYALA', '  LAINNYA JIKA x < 28:', '    kipas MATI'].map((t) => el('div', null, t)));
  area.append(card);
  sortGame(area, ctx, { oops, msg, items: TEST.map((x) => [String(x), `x = ${fmt('suhu', x)}`, testResult(x)]), bins: dropBins(TEST_OPTS.map((o) => [o, o])),
    check: (it, k) => (k !== it[2] ? `Periksa urutannya untuk ${it[1]}: rusak? lebih dari 30? kurang dari 28? Ingat: 30 tidak lebih dari 30.` : ''), chip: (it) => el('span', { class: 'hk30-chip' }, fmt('suhu', +it[0])),
    after: (it) => say(msg, '', `${it[1]}: ${it[2]}.`), done: () => { say(msg, '', 'Nilai batas 28, 30, 0, dan 50 adalah tempat bug paling sering bersembunyi. Semua lolos uji.'); done(); } });
}

// Misi 5: build the river monitor from block cards.
function riverRound(area, ctx, { oops, done }) {
  const msg = msg30('Ketua RT: peringatan bila air > 2 m, sirene bila > 3 m, tidak boleh berbunyi karena satu salah baca, dan tetap hidup saat listrik padam.');
  const slots = SLOTS7.map(([k, l]) => el('div', { class: 'hk30-slot', 'data-drop': k }, el('small', null, l)));
  const tray = el('div', { class: 'hk30-baki' }, ctx.rand.shuffle(CARDS7.map((c) => c[0])).map((k) => el('div', { class: 'hk30-kartu', 'data-drag': k }, CARDS7.find((c) => c[0] === k)[2])));
  let left = SLOTS7.length;
  const board = el('div', { class: 'hk30-papan' }, el('div', { class: 'hk30-rakit' }, el('b', null, '🌊 Pemantau Sungai Sukamakmur'), el('div', { class: 'hk30-slot-slot' }, slots)), tray);
  dnd(board, (card, slot) => {
    if (!left || slot.classList.contains('isi')) return;
    const c = CARDS7.find((x) => x[0] === card.dataset.drag);
    if (c[1] !== slot.dataset.drop) { oops(); shake(card); say(msg, 'bad', `Kartu ini untuk slot "${SLOTS7.find((s) => s[0] === c[1])[1]}".`); return; }
    if (!c[3]) { oops(); shake(card); say(msg, 'bad', c[4]); return; }
    card.classList.add('locked'); slot.replaceChildren(card); slot.classList.add('isi'); ctx.sound.tap();
    if (--left) { say(msg, '', 'Terpasang.'); return; }
    say(msg, '', 'Rakitan lengkap: yang dilakukan sistem (peringatan dan sirene) ditambah syarat keandalan (anti salah baca, validasi, pengawas, daya cadangan).'); done();
  });
  area.append(board, msg);
}

// Misi 6: storm cards on the finished design.
function stormRound(area, ctx, { oops, done }) {
  const msg = msg30('Dalang Badai mengirim lima kartu. Seret setiap kartu ke hasil yang akan terjadi pada rakitanmu.');
  sortGame(area, ctx, { oops, msg, items: STORMS.map(([k, t, a, why]) => [k, t, a, why]), bins: dropBins(OUTCOMES), cols: 5,
    check: (it, k) => (k !== it[2] ? 'Belum tepat. Periksa ambang 2 m dan 3 m, dua pembacaan berturut-turut, batas 0–8 m, dan pengawas 30 menit.' : ''), chip: (it) => el('span', { class: 'hk30-chip' }, it[1]),
    after: (it) => say(msg, '', it[3]), done: () => { say(msg, '', 'Rakitan lolos uji badai: sirene hanya berbunyi bila memang perlu, dan kerusakan tetap ketahuan.'); done(); } });
}

// Misi Bos: quota arithmetic and a safe way to save.
function quotaBoss(area, ctx, { oops, done }) {
  const msg = msg30('Seret angka ke rumus dari kiri ke kanan. Paket data kebun terbatas!');
  const blanks = QUOTA.map(([, l], i) => el('span', { class: 'hk30-celah', 'data-drop': i }, '?'));
  const res = [el('b', { class: 'hk30-hasil' }, '…'), el('b', { class: 'hk30-hasil' }, '…'), el('b', { class: 'hk30-hasil' }, '…')];
  const formula = el('div', { class: 'hk30-rumus' },
    el('div', null, blanks[0], ' sensor × ', blanks[1], ' pesan/jam × ', blanks[2], ' jam = ', res[0], ' pesan sehari'),
    el('div', null, '× ', blanks[3], ' byte per pesan = ', res[1], ' byte sehari'),
    el('div', null, '× ', blanks[4], ' hari = ', res[2], ' byte sebulan'));
  const tray = el('div', { class: 'hk30-angka-angka' }, QUOTA_CHIPS.map((x, i) => el('div', { class: 'hk30-angka', 'data-drag': `${i}` }, fmtNum(x))));
  let k = 0;
  const board = el('div', { class: 'hk30-papan' }, formula, tray);
  dnd(board, (chip, blank) => {
    if (k >= QUOTA.length) return;
    const x = QUOTA_CHIPS[+chip.dataset.drag]; const i = +blank.dataset.drop;
    if (i !== k) { say(msg, 'info', 'Isi rumus dari kiri ke kanan.'); return; }
    if (x !== QUOTA[i][0]) { oops(); shake(chip); say(msg, 'bad', ['Ada berapa sensor di kebun?', 'Pesan setiap 10 menit: berapa pesan dalam satu jam?', 'Berapa jam dalam sehari?', 'Setiap pesan sekitar 50 byte.', 'Satu bulan dihitung 30 hari.'][i]); return; }
    blank.textContent = fmtNum(x); blank.classList.add('isi'); chip.remove(); ctx.sound.tap(); k++;
    if (k === 3) res[0].textContent = fmtNum(432); if (k === 4) res[1].textContent = fmtNum(21600); if (k === 5) res[2].textContent = fmtNum(648000);
    if (k < QUOTA.length) { say(msg, '', 'Tepat.'); return; }
    say(msg, 'info', '648.000 byte sebulan hanya untuk tiga sensor. Pilih cara hemat yang tetap aman.');
    const row = el('div', { class: 'hk30-hemat' }, SAVERS.map(([key, t, ok, why]) => onTap(el('button', { class: 'hk30-tindak lebar', type: 'button', 'data-k': key }, t), (e) => {
      if (row.classList.contains('beres')) return;
      if (!ok) { oops(); shake(e.currentTarget); say(msg, 'bad', why); return; }
      row.classList.add('beres'); e.currentTarget.classList.add('on'); ctx.sound.tap(); say(msg, '', `${why} Kebun tetap hijau!`); done();
    })));
    area.insertBefore(row, msg);
  });
  area.append(board, msg);
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
  goal: 'Kebun Tetap Hijau: kenali perangkat IoT, jalankan aturan pengendali untuk sepuluh kejadian sambil menjaga daun kebun, buru bug sensor dan pesan hilang, uji nilai batas, lalu rancang dan uji pemantau sungai.',
  extraModes: [
    { id: 'simulasi', icon: '📮', label: 'Simulasi Perantara', desc: 'Jalankan K1–K10 satu per satu: amplop pesan bergerak lewat perantara, baris program disorot, lalu ubah ke versi 2 dan uji nilai batas', create: createSim },
    { id: 'giliran', icon: '🧑‍🤝‍🧑', label: 'Kejadian Antartim', desc: 'Tim bergiliran mengisi kotak keluar pengendali untuk setiap kejadian; jawaban benar 2 poin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hk30-main' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const pot = leafPot(r === 4 ? 9 : 10); const oops = () => { ctx.mistake(); pot.drop(); };
      const area = el('div', { class: 'hk30-area' });
      const go = (k, no) => { wrap.append(el('div', { class: 'hk30-kepala' }, misiHead(no, ...HEAD30[k], '🥬'), pot.node), area); };
      const fin = (ms) => ({ oops, pot, done: () => next(ms) });
      if (r === 0) { go('perangkat', 1); deviceRound(area, ctx, fin(6000)); }
      else if (r === 1) { go('hari1', 2); dayRound(area, ctx, { from: 0, to: 3, ...fin(5000) }); }
      else if (r === 2) { go('hari2', 2); dayRound(area, ctx, { from: 3, to: 6, ...fin(5000) }); }
      else if (r === 3) { go('hari3', 2); dayRound(area, ctx, { from: 6, to: 10, finale: true, ...fin(6500) }); }
      else if (r === 4) { go('bug', 3); bugRound(area, ctx, fin(6000)); }
      else if (r === 5) { go('hilang', 3); lostRound(area, ctx, fin(6000)); }
      else if (r === 6) { go('batas', 4); boundaryRound(area, ctx, fin(6000)); }
      else if (r === 7) { go('sungai', 5); riverRound(area, ctx, fin(6500)); }
      else if (r === 8) { go('badai', 6); stormRound(area, ctx, fin(6000)); }
      else { go('bos', 'Bos'); quotaBoss(area, ctx, fin(7500)); }
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
      const msg = el('p', { class: 'reveal info' }, `Tim ${t + 1}: baca aturannya, isi kotak keluar pengendali, lalu jalankan.`);
      const cv = makeCode(false); cv.mark([`${row.e[2][0]}0`]);
      const sel = new Set(); const box = el('div', { class: 'hk30-keluar' });
      const drawBox = () => fill(box, el('b', null, `📤 Kotak keluar pengendali · Tim ${t + 1}`), el('div', { class: 'hk30-pilih' }, PICKS.map(([d, v, l]) => onTap(el('button', { class: `hk30-tindak ${sel.has(pickKey([d, v])) ? 'on' : ''}`, type: 'button' }, l), () => {
        if (answered) return; const key = pickKey([d, v]);
        if (sel.has(key)) sel.delete(key); else { sel.add(key); if (d !== 'peringatan') sel.delete(pickKey([d, v === 'NYALA' ? 'MATI' : 'NYALA'])); }
        ctx.sound.tap(); drawBox();
      })), button('🧠 Jalankan', () => {
        if (answered) return; answered = true; box.classList.add('sibuk');
        const want = new Set(row.out.map(pickKey)); const ok = want.size === sel.size && [...want].every((x) => sel.has(x));
        if (ok) pts[t] += 2; ctx.sound[ok ? 'good' : 'bad'](); cv.mark(row.hit);
        say(msg, ok ? '' : 'bad', `${ok ? 'Tepat, +2. ' : 'Belum tepat. '}${row.e[0]}: ${describe(row.out)}${row.e[5] ? ', karena pesannya tidak sampai' : ''}.`);
        wrap.querySelector('.pb-skor')?.replaceWith(scoreBar(pts, t));
        board.play(row, () => { k++; setTimeout(turn, 1600); }, 300);
      }, 'primary')));
      drawBox();
      wrap.replaceChildren(scoreBar(pts, t), el('div', { class: 'hk30-area' }, el('div', { class: 'hk30-dua' }, board.el, el('div', { class: 'hk30-kanan' }, eventCard(row.e), cv.el, box)), msg));
    }
    turn();
  }
  pickTeams(wrap, 'Kejadian Antartim', start);
}
