// Jadwal Pentas Seni — SMA/SMK (16–18 tahun), graf berarah dan penjadwalan.
// Prerequisite graph of twelve tasks: topological order, earliest schedule,
// critical path and slack, a shifting critical path, a cycle, and a schedule
// for a two-person committee.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const TUGAS = {
  A: ['Rapat tema dan tanggal', 1, []],
  B: ['Anggaran dan izin', 3, ['A']],
  C: ['Audisi pengisi acara', 3, ['A']],
  D: ['Sewa pengeras suara dan lampu', 2, ['B']],
  E: ['Susunan acara', 2, ['C']],
  F: ['Latihan pengisi acara', 8, ['E']],
  G: ['Desain poster dan tiket', 3, ['E']],
  H: ['Menjual tiket', 5, ['B', 'G']],
  I: ['Dekorasi panggung', 5, ['B']],
  J: ['Gladi resik', 1, ['D', 'F', 'I']],
  K: ['Menata panggung dan kursi', 1, ['D', 'I']],
  L: ['Hari pentas', 1, ['H', 'J', 'K']],
};
export const KODE = Object.keys(TUGAS);
const POS = { A: [0, 1.6], B: [1, 0.7], C: [1, 2.5], D: [3, 0], I: [2, 1.5], E: [2, 2.5], K: [4, 0.3], G: [3, 1.5], F: [3, 3], H: [4, 1.3], J: [4, 2.7], L: [5, 1.8] };

const pre = (t, extra = {}) => [...TUGAS[t][2], ...(extra[t] || [])];
export function isValidOrder(order, extra = {}) {
  const done = new Set();
  for (const t of order) { if (pre(t, extra).some((p) => !done.has(p))) return { ok: false, bad: t, missing: pre(t, extra).filter((p) => !done.has(p)) }; done.add(t); }
  return { ok: done.size === KODE.length };
}
// Earliest/latest days (1-based, inclusive) with durations dur.
export function cpm(dur = {}) {
  const d = (t) => dur[t] ?? TUGAS[t][1];
  const es = {}; const ef = {};
  for (const t of KODE) { es[t] = Math.max(0, ...pre(t).map((p) => ef[p])) + 1; ef[t] = es[t] + d(t) - 1; }
  const end = ef.L;
  const lf = {}; const ls = {};
  for (const t of [...KODE].reverse()) { const succ = KODE.filter((s) => pre(s).includes(t)); lf[t] = succ.length ? Math.min(...succ.map((s) => ls[s])) - 1 : end; ls[t] = lf[t] - d(t) + 1; }
  const slack = Object.fromEntries(KODE.map((t) => [t, lf[t] - ef[t]]));
  return { es, ef, ls, lf, slack, end, critical: KODE.filter((t) => slack[t] === 0) };
}
export function countOrders() {
  const memo = new Map();
  const go = (mask) => { if (mask === (1 << 12) - 1) return 1; if (memo.has(mask)) return memo.get(mask); let s = 0; KODE.forEach((t, i) => { if (!(mask & (1 << i)) && pre(t).every((p) => mask & (1 << KODE.indexOf(p)))) s += go(mask | (1 << i)); }); memo.set(mask, s); return s; };
  return go(0);
}
export function findCycle(extra) {
  const color = {};
  const stack = [];
  let found = null;
  const succ = (t) => KODE.filter((s) => pre(s, extra).includes(t));
  const dfs = (t) => { color[t] = 1; stack.push(t); for (const s of succ(t)) { if (found) return; if (color[s] === 1) { found = [...stack.slice(stack.indexOf(s)), s]; return; } if (!color[s]) dfs(s); } stack.pop(); color[t] = 2; };
  for (const t of KODE) if (!color[t] && !found) dfs(t);
  return found;
}

export function dagSvg({ lit = [], red = [], ready = [], tap = false, extra = {}, slack = null, dur = {} } = {}) {
  const X = (c) => 50 + c * 108;
  const Y = (r) => 36 + r * 64;
  const arrows = [];
  for (const t of KODE) for (const p of pre(t, extra)) {
    const [x1, y1] = [X(POS[p][0]), Y(POS[p][1])];
    const [x2, y2] = [X(POS[t][0]), Y(POS[t][1])];
    const L = Math.hypot(x2 - x1, y2 - y1);
    const [ux, uy] = [(x2 - x1) / L, (y2 - y1) / L];
    const back = x2 <= x1;
    const isRed = red.includes(p) && red.includes(t);
    const isLit = lit.includes(p) && lit.includes(t);
    const col = isRed ? '#dc2626' : isLit ? '#f97316' : '#94a3b8';
    const path = back ? `M${x1 + ux * 24} ${y1 + uy * 24} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + 70} ${x2 - ux * 26} ${y2 - uy * 26}` : `M${x1 + ux * 24} ${y1 + uy * 24} L${x2 - ux * 27} ${y2 - uy * 27}`;
    arrows.push(`<path d="${path}" fill="none" stroke="${col}" stroke-width="${isRed || isLit ? 4 : 2}" marker-end="url(#ps8-${isRed ? 'm' : isLit ? 'o' : 'g'})"/>`);
  }
  const nodes = KODE.map((t) => {
    const [x, y] = [X(POS[t][0]), Y(POS[t][1])];
    const rd = ready.includes(t);
    const fill = red.includes(t) ? '#fecaca' : lit.includes(t) ? '#fed7aa' : rd ? '#dcfce7' : '#fff';
    return `<g ${tap ? `data-t="${t}" class="ps8-ketuk"` : ''}><circle cx="${x}" cy="${y}" r="23" fill="${fill}" stroke="${lit.includes(t) ? '#ea580c' : rd ? '#16a34a' : '#475569'}" stroke-width="${rd ? 4 : 2.5}"${rd ? ' stroke-dasharray="5 3"' : ''}/><text x="${x}" y="${y + 2}" font-size="18" font-weight="900" text-anchor="middle" fill="#111827">${t}</text><text x="${x}" y="${y + 15}" font-size="9" text-anchor="middle" fill="#475569">${dur[t] ?? TUGAS[t][1]} hr</text>${slack ? `<text x="${x}" y="${y - 28}" font-size="11" font-weight="800" text-anchor="middle" fill="${slack[t] ? '#16a34a' : '#dc2626'}">${slack[t] ? `longgar ${slack[t]}` : 'kritis'}</text>` : ''}</g>`;
  });
  const mk = (id, c) => `<marker id="ps8-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  return `<svg viewBox="0 0 640 ${Object.keys(extra).length ? 300 : 260}" role="img" aria-label="Graf prasyarat"><defs>${mk('g', '#94a3b8')}${mk('o', '#f97316')}${mk('m', '#dc2626')}</defs>${arrows.join('')}${nodes.join('')}</svg>`;
}
function dagBox(opts, onTapT) {
  const box = el('div', { class: 'ps8-graf', html: dagSvg(opts) });
  if (onTapT) box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-t]'); if (!g) return; e.preventDefault(); onTapT(g.dataset.t, box); });
  return box;
}

// Timeline: staff = 'banyak' (one row per task) or a number of people.
function timeline(host, ctx, { staff = 'banyak', days = 20, onPlace, onDone, onBad }) {
  const placed = {};
  let sel = null;
  const rows = staff === 'banyak' ? KODE.length : staff;
  const b = { placed, enabled: true, end: () => (placed.L ? placed.L.start : null), reset() { for (const k of Object.keys(placed)) delete placed[k]; sel = null; draw(); } };
  const finish = (t) => placed[t].start + TUGAS[t][1] - 1;
  const grid = el('div', { class: 'ps8-garis' });
  const palette = el('div', { class: 'seg ps8-palet' });
  grid.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('[data-r]');
    if (!c || !b.enabled) return;
    e.preventDefault();
    const bar = e.target.closest('[data-bar]');
    if (bar) { remove(bar.dataset.bar); return; }
    put(Number(c.dataset.r), Number(c.dataset.d));
  });
  function remove(t) {
    const dep = KODE.filter((s) => placed[s] && pre(s).includes(t));
    if (dep.length) { say(info, 'bad', `${t} tidak bisa diangkat: ${dep.join(', ')} sudah dijadwalkan sesudahnya.`); return; }
    delete placed[t]; draw();
  }
  const info = el('p', { class: 'reveal info' });
  function put(r, d) {
    const t = staff === 'banyak' ? KODE[r] : sel;
    if (!t) { say(info, 'bad', 'Pilih kartu tugas dulu.'); return; }
    if (placed[t]) { say(info, 'bad', `${t} sudah dijadwalkan. Ketuk balok ${t} untuk mengangkatnya.`); return; }
    const len = TUGAS[t][1];
    const bad = pre(t).filter((p) => !placed[p] || finish(p) >= d);
    if (bad.length) { ctx.mistake(); shake(grid); say(info, 'bad', `${t} (${TUGAS[t][0]}) belum boleh mulai hari ${d}: prasyarat ${bad.map((p) => (placed[p] ? `${p} selesai hari ${finish(p)}` : `${p} belum dijadwalkan`)).join(', ')}.`); if (onBad) onBad(t, bad); return; }
    if (d + len - 1 > days) { say(info, 'bad', `${t} butuh ${len} hari, melewati hari ${days}.`); return; }
    if (staff !== 'banyak') {
      const clash = KODE.find((s) => placed[s] && placed[s].row === r && !(finish(s) < d || placed[s].start > d + len - 1));
      if (clash) { ctx.mistake(); shake(grid); say(info, 'bad', `Orang ${r + 1} sedang mengerjakan ${clash} pada hari itu.`); if (onBad) onBad(t, [clash]); return; }
    }
    placed[t] = { row: r, start: d };
    sel = null;
    ctx.sound.tap();
    draw();
    say(info, 'info', `${t} hari ${d}–${d + len - 1}.`);
    if (onPlace) onPlace(t);
    if (KODE.every((x) => placed[x]) && onDone) onDone(finish('L'));
  }
  function draw() {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      cells.push(el('div', { class: 'ps8-label', style: { gridRow: r + 2, gridColumn: 1 } }, staff === 'banyak' ? `${KODE[r]} · ${TUGAS[KODE[r]][1]} hr` : `Orang ${r + 1}`));
      for (let d = 1; d <= days; d++) cells.push(el('div', { class: `ps8-sel ${d % 5 === 0 ? 'lima' : ''}`, 'data-r': r, 'data-d': d, style: { gridRow: r + 2, gridColumn: d + 1 } }));
    }
    const head = [el('div', { class: 'ps8-label', style: { gridRow: 1, gridColumn: 1 } }, 'Hari'), ...Array.from({ length: days }, (_, i) => el('div', { class: 'ps8-hari', style: { gridRow: 1, gridColumn: i + 2 } }, i + 1))];
    const bars = KODE.filter((t) => placed[t]).map((t) => el('div', { class: `ps8-balok ${t === 'L' ? 'pentas' : ''}`, 'data-bar': t, 'data-r': placed[t].row, 'data-d': placed[t].start, style: { gridRow: placed[t].row + 2, gridColumn: `${placed[t].start + 1} / span ${TUGAS[t][1]}` } }, t));
    grid.style.setProperty('--hari', days);
    grid.replaceChildren(...head, ...cells, ...bars);
    if (staff !== 'banyak') palette.replaceChildren(...KODE.filter((t) => !placed[t]).map((t) => onTap(el('button', { class: `seg-btn ${sel === t ? 'on' : ''}`, type: 'button' }, `${t} ${TUGAS[t][1]} hr`), () => { sel = t; draw(); })));
  }
  host.append(...[staff !== 'banyak' ? palette : null, el('div', { class: 'ps8-gulir' }, grid), info].filter(Boolean));
  draw();
  return b;
}


const readyOf = (got) => KODE.filter((t) => !got.includes(t) && pre(t).every((p) => got.includes(p)));
function orderRound(wrap, ctx, { done }) {
  const got = [];
  const out = el('div', { class: 'au-status' }, '…');
  const msg = el('p', { class: 'reveal info' }, 'Lingkaran hijau bergaris: tugas yang sudah siap (semua panah masuknya selesai). Ketuk salah satu.');
  const box = dagBox({}, (t, b) => {
    if (got.includes(t)) return;
    const miss = pre(t).filter((p) => !got.includes(p));
    if (miss.length) { ctx.mistake(); shake(b); say(msg, 'bad', `${t} masih menunggu ${miss.join(', ')}.`); return; }
    got.push(t); ctx.sound.tap();
    b.innerHTML = dagSvg({ lit: got, tap: true, ready: readyOf(got) });
    out.textContent = got.join(', ');
    if (got.length === KODE.length) { say(msg, '', 'Urutan sah! Ada 1.816 urutan sah yang berbeda.'); done(); }
  });
  box.innerHTML = dagSvg({ tap: true, ready: readyOf(got) });
  wrap.append(box, out, msg);
}

function pathRound(wrap, ctx, { want, prompt, done, dur = {} }) {
  const got = [];
  const msg = el('p', { class: 'reveal info' }, 'Ketuk tugas-tugas jalur kritis dari A sampai L.');
  const box = dagBox({}, (t, b) => {
    if (got.includes(t)) return;
    if (t !== want[got.length]) { ctx.mistake(); shake(b); say(msg, 'bad', `${t} bukan tugas berikutnya di jalur terpanjang. Jumlahkan lama tugas di setiap jalur.`); return; }
    got.push(t); ctx.sound.tap();
    b.innerHTML = dagSvg({ lit: got, tap: true });
    if (got.length === want.length) { say(msg, '', `Jalur kritis ${want.join(' → ')}: ${want.reduce((s, x) => s + (dur[x] ?? TUGAS[x][1]), 0)} hari.`); done(); }
  });
  box.innerHTML = dagSvg({ tap: true });
  wrap.append(el('p', { class: 'prompt' }, prompt), box, msg);
}

function scheduleRound(wrap, ctx, { staff, days, target, prompt, done }) {
  const host = el('div', { class: 'ps8-papan' });
  const msg = el('p', { class: 'reveal hint' }, staff === 'banyak' ? 'Ketuk hari mulai di baris setiap tugas. Ketuk balok untuk mengangkatnya.' : 'Pilih kartu tugas, lalu ketuk hari mulai di baris seorang panitia.');
  let tl;
  wrap.append(el('p', { class: 'prompt' }, prompt), host, el('div', { class: 'kode-baris' }, button('Ulang', () => tl.reset())), msg);
  tl = timeline(host, ctx, { staff, days, onDone(end) { if (end > target) { ctx.mistake(); say(msg, 'bad', `Sah, tetapi pentas hari ke-${end}. Bisa hari ke-${target}: angkat balok dan geser lebih awal.`); return; } tl.enabled = false; say(msg, '', `Jadwal sah: pentas hari ke-${end}.`); done(); } });
}

// ---- Papan Proyek Pentas: the missions ----

// Misi Periksa Usulan: a proposed order is played card by card; judge each card
// "siap" (all its arrows are done) or "belum siap".
function proposalRound(wrap, ctx, { proposals, done }) {
  let p = 0;
  let k = 0;
  const graph = el('div', { class: 'ps8-graf' });
  const row = el('div', { class: 'pp8-usulan' });
  const ctl = el('div', { class: 'kode-baris' });
  const msg = el('p', { class: 'reveal info' }, 'Kartu usulan dimainkan satu per satu. Siap: semua panah yang masuk sudah selesai.');
  const draw = () => {
    const seq = proposals[p];
    const doneT = seq.slice(0, k);
    graph.innerHTML = dagSvg({ lit: doneT, red: k < seq.length ? [seq[k]] : [] });
    fill(row, el('small', null, `Usulan ${p + 1}:`), seq.map((t, i) => el('span', { class: i < k ? 'sudah' : i === k ? 'kini' : '' }, t)));
    fill(ctl, k < seq.length ? [
      onTap(el('button', { class: 'btn primary', type: 'button', 'data-nilai': 'siap' }, `✔ ${seq[k]} siap`), () => judge(true)),
      onTap(el('button', { class: 'btn', type: 'button', 'data-nilai': 'belum' }, `✖ ${seq[k]} belum siap`), () => judge(false))] : null);
  };
  function judge(ok) {
    const seq = proposals[p];
    const t = seq[k];
    const miss = pre(t).filter((x) => !seq.slice(0, k).includes(x));
    if (ok !== !miss.length) { ctx.mistake(); shake(row); say(msg, 'bad', miss.length ? `${t} masih menunggu ${miss.join(', ')}.` : `Semua prasyarat ${t} (${pre(t).join(', ') || 'tidak ada'}) sudah selesai.`); return; }
    ctx.sound.tap();
    if (!ok) {
      say(msg, 'bad', `Usulan ${p + 1} ditolak: ${t} dikerjakan sebelum ${miss.join(' dan ')}.`);
      setTimeout(advance, 2400);
      return;
    }
    k++;
    draw();
    if (k === seq.length) { say(msg, 'info', `Usulan ${p + 1} sah: semua 12 kartu siap pada gilirannya.`); setTimeout(advance, 2000); }
  }
  function advance() {
    p++;
    k = 0;
    if (p >= proposals.length) { say(msg, '', 'Semua usulan diperiksa. Urutan sah selalu menaruh setiap tugas sesudah semua prasyaratnya: urutan topologis.'); fill(ctl); done(); return; }
    draw();
    say(msg, 'info', `Usulan ${p + 1}.`);
  }
  draw();
  wrap.append(row, graph, ctl, msg);
}

// Misi Kartu Kejadian: an event changes one task's length; predict how the show day moves.
function eventRound(wrap, ctx, { events, showSlack = false, done }) {
  const base = cpm();
  let e = 0;
  const graph = el('div', { class: 'ps8-graf' });
  const card = el('div', { class: 'pp8-kejadian' });
  const opts = el('div', { class: 'seg pp8-opsi' });
  const msg = el('p', { class: 'reveal info' }, `Pentas semula hari ke-${base.end}. Jalur kritis ${base.critical.join(' → ')}.`);
  const CH = [[-2, '⏪ maju 2'], [-1, '⏪ maju 1'], [0, '✅ aman'], [1, '⏩ mundur 1'], [2, '⏩ mundur 2'], [3, '⏩ mundur 3']];
  const draw = (after = null) => {
    const [t, d] = events[e];
    graph.innerHTML = after ? dagSvg({ lit: after.critical, slack: after.slack, dur: { [t]: d } }) : dagSvg({ red: [t], slack: showSlack ? base.slack : null });
    fill(card, el('small', null, `Kartu kejadian ${e + 1} dari ${events.length}`), el('b', null, `${t} (${TUGAS[t][0]}): ${TUGAS[t][1]} → ${d} hari`));
    fill(opts, after ? null : CH.map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button', 'data-geser': v }, l), () => answer(v))));
  };
  function answer(v) {
    const [t, d] = events[e];
    const after = cpm({ [t]: d });
    const want = after.end - base.end;
    if (v !== want) { ctx.mistake(); shake(opts); say(msg, 'bad', `Belum. Kelonggaran ${t} semula ${base.slack[t]} hari, dan lamanya berubah ${d - TUGAS[t][1] > 0 ? '+' : ''}${d - TUGAS[t][1]} hari. Periksa juga jalur lain lewat ${t}.`); return; }
    ctx.sound.good();
    draw(after);
    const path = after.critical.join(' → ');
    say(msg, 'info', `${want === 0 ? 'Aman' : want > 0 ? `Mundur ${want} hari` : `Maju ${-want} hari`}: pentas hari ke-${after.end}. Jalur kritis kini ${path}.`);
    e++;
    if (e === events.length) { setTimeout(() => { say(msg, '', 'Tugas dengan kelonggaran boleh terlambat sebanyak kelonggarannya. Tugas di jalur kritis tidak boleh terlambat sehari pun, dan jalur kritis bisa berpindah.'); done(); }, 1600); return; }
    setTimeout(() => draw(), 2600);
  }
  draw();
  wrap.append(card, graph, opts, msg);
}

// Misi Siklus: with a new rule, tap the tasks that wait on each other in a circle.
function cycleRound(wrap, ctx, { extra, done }) {
  const want = [...new Set(findCycle(extra))];
  const picked = new Set();
  const graph = el('div', { class: 'ps8-graf' });
  const msg = el('p', { class: 'reveal info' }, 'Aturan baru: E (susunan acara) baru boleh dibuat setelah H (menjual tiket) selesai. Rencana macet. Ketuk tugas-tugas yang saling menunggu melingkar, lalu periksa.');
  const draw = (red = []) => { graph.innerHTML = dagSvg({ extra, lit: [...picked], red, tap: true }); };
  graph.addEventListener('pointerdown', (ev) => { const g = ev.target.closest('[data-t]'); if (!g) return; ev.preventDefault(); const t = g.dataset.t; if (picked.has(t)) picked.delete(t); else picked.add(t); ctx.sound.tap(); draw(); });
  const check = onTap(el('button', { class: 'btn primary', type: 'button', 'data-aksi': 'periksa' }, '🔍 Periksa lingkaran'), () => {
    const ok = picked.size === want.length && want.every((t) => picked.has(t));
    if (!ok) { ctx.mistake(); shake(graph); say(msg, 'bad', picked.size ? `Belum tepat. Mulai dari E dan ikuti panah keluar sampai kembali ke E.` : 'Ketuk dulu tugas-tugasnya.'); return; }
    draw(want);
    const c = findCycle(extra).slice(0, -1);
    const i = Math.max(0, c.indexOf('E'));
    say(msg, '', `Siklus ${[...c.slice(i), ...c.slice(0, i), c[i]].join(' → ')}: E menunggu H, H menunggu G, G menunggu E. Tidak ada yang boleh mulai, jadi tidak ada urutan sah sama sekali.`);
    check.remove();
    done();
  });
  draw();
  wrap.append(graph, el('div', { class: 'kode-baris' }, check), msg);
}

const HEAD08 = {
  urut: ['Urutan Sah', 'Satu orang mengerjakan semua tugas. Ketuk tugas yang sudah siap, satu per satu.'],
  usul: ['Periksa Usulan', 'Dua anggota panitia mengusulkan urutan kerja. Mainkan kartunya dan putuskan.'],
  waktu: ['Garis Waktu', 'Letakkan setiap tugas di garis waktu tanpa mendahului prasyaratnya.'],
  kritis: ['Spidol Jalur Kritis', 'Tandai rangkaian tugas yang menentukan hari pentas.'],
  kejadian: ['Kartu Kejadian', 'Lama satu tugas berubah. Apakah hari pentas aman, maju, atau mundur?'],
  siklus: ['Rencana Mustahil', 'Satu aturan baru membuat rencana macet total.'],
  boss: ['Panitia Dua Orang', 'Hanya dua orang yang bekerja. Pentas paling cepat hari ke-19.'],
};

export default {
  id: 'sma-08-pentas-seni',
  title: 'Jadwal Pentas Seni',
  topic: 'Graf berarah, urutan topologis, jalur kritis, dan siklus',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🎭',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjadi panitia pentas yang menempel kartu tugas di papan panah: menyusun dan memeriksa urutan kerja yang sah, meletakkan tugas di garis waktu, menandai jalur kritis, menghadapi kartu kejadian yang mengubah lama tugas, membongkar rencana yang mengandung siklus, dan menjadwalkan panitia dua orang.',
  extraModes: [
    { id: 'jadwal', icon: '🗓️', label: 'Garis Waktu', desc: 'Pilih banyak panitia (1, 2, 3, atau cukup banyak), lalu letakkan kartu tugas di garis waktu; pemeriksa menolak tugas yang mendahului prasyaratnya atau bentrok pada satu orang', create: createTimeline },
    { id: 'kritis', icon: '🔥', label: 'Jalur Kritis dan Siklus', desc: 'Ubah lama tugas dan lihat jalur kritis serta kelonggaran berpindah; tambah aturan E menunggu H untuk melihat siklus', create: createCritical },
    { id: 'giliran', icon: '🔁', label: 'Jadwal Bergiliran', desc: 'Tim bergantian meletakkan satu kartu tugas di garis waktu dua orang; peletakan yang melanggar membuat tim kehilangan giliran', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act pentas-seni pp8-main' });
    root.append(wrap);
    const pool = [['H', 6], ['K', 6], ['B', 4], ['E', 3], ['J', 2], ['I', 7], ['G', 4], ['D', 4]];
    const extraEvents = ctx.rand.shuffle(pool).slice(0, 3);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD08[key], '🎭'));
      wrap.classList.toggle('pp8-jadwal', [2, 7, 9].includes(r));
      if (r === 0) { head('urut', 1); orderRound(wrap, ctx, { done: () => next(4600) }); }
      else if (r === 1) { head('usul', 1); proposalRound(wrap, ctx, { proposals: ['ABDCEGHIFKJL'.split(''), 'ACEFJBDIGHKL'.split('')], done: () => next(4600) }); }
      else if (r === 2) { head('waktu', 2); scheduleRound(wrap, ctx, { staff: 'banyak', days: 20, target: 16, prompt: 'Panitia cukup banyak: setiap tugas punya barisnya sendiri. Ketuk hari mulai.', done: () => next(4600) }); }
      else if (r === 3) { head('kejadian', 3); eventRound(wrap, ctx, { events: [['I', 8], ['G', 5]], done: () => next(5200) }); }
      else if (r === 4) { head('kritis', 2); pathRound(wrap, ctx, { want: cpm().critical, prompt: 'Ketuk tugas jalur kritis dari A sampai L: jalur yang jumlah harinya terbesar.', done: () => next(4600) }); }
      else if (r === 5) { head('kejadian', 3); eventRound(wrap, ctx, { events: [['D', 7], ['C', 4], ['F', 6]], done: () => next(5200) }); }
      else if (r === 6) { head('siklus', 4); cycleRound(wrap, ctx, { extra: { E: ['H'] }, done: () => next(5600) }); }
      else if (r === 7) { head('waktu', 2); scheduleRound(wrap, ctx, { staff: 3, days: 20, target: 16, prompt: 'Panitia tiga orang. Pilih kartu tugas, lalu ketuk hari mulai di baris seorang panitia. Bisakah tetap hari ke-16?', done: () => next(4600) }); }
      else if (r === 8) { head('kejadian', 3); eventRound(wrap, ctx, { events: extraEvents, showSlack: true, done: () => next(5200) }); }
      else { head('boss', 'Bos'); scheduleRound(wrap, ctx, { staff: 2, days: 22, target: 19, prompt: 'Pilih kartu tugas, lalu ketuk hari mulai di baris seorang panitia. Ada 35 hari kerja untuk 2 orang.', done: () => next(5200) }); }
    }
    render();
  },
};

function createTimeline(root, ctx) {
  const wrap = el('div', { class: 'act pentas-seni' });
  root.append(wrap);
  let staff = 'banyak';
  const host = el('div', { class: 'ps8-papan' });
  const best = { 1: 35, 2: 19, 3: 16, banyak: 16 };
  const msg = el('p', { class: 'reveal hint' });
  function reset() { host.replaceChildren(); msg.textContent = `Paling cepat dengan pilihan ini: hari ke-${best[staff]}.`; timeline(host, ctx, { staff, days: staff === 1 ? 36 : 22, onDone: (end) => { ctx.sound.win(); say(msg, '', `Jadwal sah: pentas hari ke-${end} (paling cepat ${best[staff]}).`); } }); seg(); }
  const segBox = el('div', { class: 'seg' });
  function seg() { segBox.replaceChildren(...[[1, '1 orang'], [2, '2 orang'], [3, '3 orang'], ['banyak', 'Cukup banyak']].map(([v, l]) => onTap(el('button', { class: `seg-btn ${staff === v ? 'on' : ''}`, type: 'button' }, l), () => { staff = v; reset(); }))); }
  wrap.append(el('p', { class: 'prompt' }, 'Garis waktu pentas seni'), segBox, host, msg);
  reset();
}

function createCritical(root, ctx) {
  const wrap = el('div', { class: 'act pentas-seni' });
  root.append(wrap);
  const dur = {};
  let cyc = false;
  const out = el('div');
  function draw() {
    const extra = cyc ? { E: ['H'] } : {};
    if (cyc) {
      out.replaceChildren(el('div', { class: 'ps8-graf', html: dagSvg({ extra, red: findCycle(extra) }) }), el('p', { class: 'reveal bad' }, `Siklus: ${findCycle(extra).join(' → ')}. Tidak ada urutan sah.`));
      return;
    }
    const c = cpm(dur);
    out.replaceChildren(el('div', { class: 'ps8-graf', html: dagSvg({ lit: c.critical, slack: c.slack, dur }) }),
      el('p', { class: 'reveal info' }, `Pentas paling cepat hari ke-${c.end} · jalur kritis ${c.critical.join(' → ')}`),
      el('div', { class: 'ps8-durasi' }, KODE.map((t) => el('span', null, el('b', null, t), onTap(el('button', { class: 'seg-btn', type: 'button' }, '−'), () => { dur[t] = Math.max(1, (dur[t] ?? TUGAS[t][1]) - 1); draw(); }), ` ${dur[t] ?? TUGAS[t][1]} `, onTap(el('button', { class: 'seg-btn', type: 'button' }, '+'), () => { dur[t] = Math.min(12, (dur[t] ?? TUGAS[t][1]) + 1); draw(); })))));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Ubah lama tugas dan lihat jalur kritis berpindah.'),
    el('div', { class: 'seg' }, onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Lama semula'), () => { for (const k of Object.keys(dur)) delete dur[k]; cyc = false; draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'F jadi 6 hari'), () => { dur.F = 6; cyc = false; draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Aturan baru: E menunggu H'), () => { cyc = !cyc; draw(); })), out);
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act pentas-seni' });
  root.append(wrap);
  let pts = [];
  let team = 0;
  function start(n) {
    pts = Array(n).fill(0);
    team = 0;
    const head = el('div');
    const host = el('div', { class: 'ps8-papan' });
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}: letakkan satu kartu (panitia dua orang)`));
    wrap.replaceChildren(head, host);
    drawHead();
    timeline(host, ctx, {
      staff: 2,
      days: 22,
      onPlace() { pts[team]++; ctx.sound.good(); team = (team + 1) % n; drawHead(); },
      onBad() { team = (team + 1) % n; drawHead(); },
      onDone(end) { setTimeout(() => finishBoard(wrap, ctx, { title: `Jadwal lengkap: pentas hari ke-${end} (paling cepat 19). Satu poin untuk setiap kartu yang sah.`, pts, again: () => pickTeams(wrap, 'Jadwal Bergiliran', start) }), 1500); },
    });
  }
  pickTeams(wrap, 'Jadwal Bergiliran', start);
}
