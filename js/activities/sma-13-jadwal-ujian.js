// Jadwal Ujian Tanpa Bentrok — SMA/SMK (16–18 tahun), pewarnaan graf.
// Nine students sit make-up exams in eight subjects: draw the conflict graph,
// colour it greedily in list order (5 sessions) and by degree (4), prove 4 is
// the minimum with a clique, then adapt when data or room limits change.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const MAPEL = ['Bio', 'Kim', 'Fis', 'MTL', 'Inf', 'Eko', 'Sos', 'Geo'];
export const NAMA = { Bio: 'Biologi', Kim: 'Kimia', Fis: 'Fisika', MTL: 'Matematika Tingkat Lanjut', Inf: 'Informatika', Eko: 'Ekonomi', Sos: 'Sosiologi', Geo: 'Geografi' };
export const MURID = { Ayu: ['Fis', 'Inf', 'Eko'], Bima: ['Bio', 'Inf', 'Sos'], Citra: ['Kim', 'Fis', 'Eko'], Dodi: ['Fis', 'Inf'], Eka: ['MTL', 'Inf', 'Sos'], Fajar: ['Fis', 'Geo'], Gita: ['Bio', 'Sos'], Hana: ['Fis', 'Inf', 'Sos'], Iwan: ['Eko', 'Sos'] };
export const SESI = ['#60a5fa', '#f472b6', '#facc15', '#4ade80', '#c084fc', '#fb923c'];
const POS = { Bio: [90, 230], Kim: [630, 230], Fis: [450, 130], MTL: [120, 50], Inf: [270, 130], Eko: [450, 320], Sos: [270, 320], Geo: [610, 50] };

export const key = (a, b) => (MAPEL.indexOf(a) < MAPEL.indexOf(b) ? `${a}|${b}` : `${b}|${a}`);
// Conflict edges: pair key -> students who sit both.
export function edges(murid = MURID) {
  const E = {};
  for (const [n, list] of Object.entries(murid)) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) (E[key(list[i], list[j])] ||= []).push(n);
  return E;
}
export const neighbours = (E, m) => MAPEL.filter((x) => x !== m && E[key(m, x)]);
export const degree = (E, m) => neighbours(E, m).length;
export const byDegree = (E) => [...MAPEL].sort((a, b) => degree(E, b) - degree(E, a) || MAPEL.indexOf(a) - MAPEL.indexOf(b));
export function greedy(E, order = MAPEL) {
  const col = {};
  const steps = order.map((m) => { const used = [...new Set(neighbours(E, m).filter((x) => col[x]).map((x) => col[x]))].sort((a, b) => a - b); let s = 1; while (used.includes(s)) s++; col[m] = s; return { m, used, s }; });
  return { col, steps, n: Math.max(...Object.values(col)) };
}
// Fewest sessions with at most `cap` subjects per session, and how many colourings use exactly k numbered colours.
export function fewest(E, cap = 8) {
  for (let k = 1; k <= 8; k++) { if (count(E, k, cap, 1)) return k; }
  return 8;
}
export function count(E, k, cap = 8, stop = Infinity) {
  const col = {}; const size = Array(k + 1).fill(0); let found = 0;
  const go = (i) => {
    if (found >= stop) return;
    if (i === MAPEL.length) { found++; return; }
    const m = MAPEL[i];
    for (let s = 1; s <= k; s++) {
      if (size[s] >= cap || neighbours(E, m).some((x) => col[x] === s)) continue;
      col[m] = s; size[s]++; go(i + 1); size[s]--; delete col[m];
    }
  };
  go(0);
  return found;
}
export const conflicts = (E, col) => Object.keys(E).filter((k) => { const [a, b] = k.split('|'); return col[a] && col[a] === col[b]; });

export function graphSvg(E, { col = {}, red = [], lit = [], cur = null, pick = [], glow = [], showEdges = true } = {}) {
  const lines = showEdges ? Object.keys(E).map((k) => { const [a, b] = k.split('|'); const [x1, y1] = POS[a]; const [x2, y2] = POS[b]; const bad = red.includes(k); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bad ? '#dc2626' : lit.includes(k) ? '#f97316' : '#94a3b8'}" stroke-width="${bad || lit.includes(k) ? 8 : 4}" stroke-linecap="round"/>`; }) : [];
  const dots = MAPEL.map((m) => { const [x, y] = POS[m]; const c = col[m]; return `<g data-m="${m}" class="ju-simpul"><circle cx="${x}" cy="${y}" r="38" fill="${c ? SESI[c - 1] : '#fff'}" stroke="${m === cur ? '#2563eb' : pick.includes(m) ? '#f97316' : glow.includes(m) ? '#16a34a' : '#334155'}" stroke-width="${m === cur || pick.includes(m) || glow.includes(m) ? 7 : 3}"${glow.includes(m) && !pick.includes(m) ? ' stroke-dasharray="10 6"' : ''}/><text x="${x}" y="${y + (c ? 0 : 7)}" font-size="22" font-weight="900" text-anchor="middle">${m}</text>${c ? `<text x="${x}" y="${y + 24}" font-size="16" font-weight="700" text-anchor="middle">Sesi ${c}</text>` : ''}</g>`; });
  return `<svg viewBox="30 0 660 370" role="img" aria-label="Graf bentrok">${lines.join('')}${dots.join('')}</svg>`;
}
const studentTable = (murid = MURID) => el('div', { class: 'ju-murid' }, Object.entries(murid).map(([n, l]) => el('span', null, el('b', null, n), l.join(', '))));
const sessionList = (col) => { const by = {}; for (const m of MAPEL) if (col[m]) (by[col[m]] ||= []).push(m); return Object.keys(by).sort().map((s) => `Sesi ${s}: ${by[s].join(', ')}`).join(' · '); };

// Colour board: pick a session, tap subjects. strict rejects clashes instead of showing them red.
function colorBoard(host, ctx, { murid = MURID, cap = 8, strict = false, sessions = 6, onChange, onBad, locked = () => false }) {
  let E = edges(murid);
  let col = {};
  let sel = 1;
  const box = el('div', { class: 'ju-graf' });
  const seg = el('div', { class: 'seg ju-sesi' });
  const info = el('p', { class: 'reveal info' });
  const b = { get col() { return col; }, set(c) { col = { ...c }; draw(); }, reset() { col = {}; draw(); }, setData(m) { murid = m; E = edges(m); draw(); }, setCap(c) { cap = c; draw(); }, get E() { return E; }, draw };
  function draw() {
    const red = conflicts(E, col);
    box.innerHTML = graphSvg(E, { col, red });
    seg.replaceChildren(...Array.from({ length: sessions }, (_, i) => onTap(el('button', { class: `seg-btn ju-warna ${sel === i + 1 ? 'on' : ''}`, type: 'button', style: { '--w': SESI[i] } }, `Sesi ${i + 1}`), () => { sel = i + 1; draw(); })));
    const used = new Set(Object.values(col)).size;
    info.textContent = red.length ? `Bentrok: ${red.map((k) => `${k.replace('|', '–')} (${E[k].join(', ')})`).join('; ')}` : `${Object.keys(col).length} dari 8 mata pelajaran · ${used} sesi${cap < 8 ? ` · paling banyak ${cap} per sesi` : ''}`;
    info.className = `reveal ${red.length ? 'bad' : 'info'}`;
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-m]');
    if (!g || locked()) return;
    e.preventDefault();
    const m = g.dataset.m;
    if (strict && col[m]) { say(info, 'info', `${m} sudah di Sesi ${col[m]}.`); return; }
    if (col[m] === sel) { delete col[m]; draw(); if (onChange) onChange(col, false); return; }
    if (MAPEL.filter((x) => x !== m && col[x] === sel).length >= cap) { ctx.mistake(); shake(box); say(info, 'bad', `Sesi ${sel} sudah berisi ${cap} mata pelajaran. Ruang hanya ${cap}.`); if (onBad) onBad(m, 'ruang'); return; }
    const clash = neighbours(E, m).filter((x) => col[x] === sel);
    if (strict && clash.length) { ctx.mistake(); shake(box); say(info, 'bad', `${m} bentrok dengan ${clash.map((x) => `${x} (${E[key(m, x)].join(', ')})`).join(', ')} di Sesi ${sel}.`); if (onBad) onBad(m, 'bentrok'); return; }
    col[m] = sel; ctx.sound.tap();
    if (clash.length) { ctx.mistake(); shake(box); }
    draw();
    const ok = Object.keys(col).length === 8 && !conflicts(E, col).length;
    if (onChange) onChange(col, ok, m);
  });
  host.append(seg, box, info);
  draw();
  return b;
}

// ---------- Permainan: Ruang Kurikulum ----------
// Student cards spin conflict threads, robots colour the graph, subject cards
// go onto a session board where every schedule must pass the protest test,
// a four-way clash proves the minimum, and event cards change the data.

const usedSessions = (col) => new Set(Object.values(col)).size;
const protests = (murid, col) => Object.entries(murid).filter(([, l]) => { const s = l.map((m) => col[m]).filter(Boolean); return new Set(s).size < s.length; }).map(([n]) => n);

// Misi 1: one student card at a time; tap two subjects to stretch a thread.
function threadRound(wrap, ctx, { done }) {
  const E = edges();
  const names = Object.keys(MURID);
  const have = new Set();
  let n = 0;
  let first = null;
  let fin = false;
  const card = el('div');
  const box = el('div', { class: 'ju-graf' });
  const msg = el('p', { class: 'reveal info' });
  const tools = el('div', { class: 'kode-baris' });
  const pairsOf = (nm) => { const l = MURID[nm]; const out = []; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) out.push(key(l[i], l[j])); return out; };
  function draw() {
    const nm = names[n];
    fill(card, el('div', { class: 'rk13-murid-besar' }, el('small', null, `🧑‍🎓 Kartu murid ${n + 1} dari ${names.length}`), el('b', null, nm), el('span', null, MURID[nm].map((m) => NAMA[m]).join(' · '))));
    box.innerHTML = graphSvg(Object.fromEntries([...have].map((k) => [k, E[k]])), { pick: first ? [first] : [], glow: MURID[nm] });
  }
  function nextCard() {
    const missing = pairsOf(names[n]).filter((k) => !have.has(k));
    if (missing.length) { ctx.mistake(); shake(box); say(msg, 'bad', `Masih ada benang untuk ${names[n]}: ${missing.length}.`); return; }
    ctx.sound.tap();
    n++;
    first = null;
    if (n < names.length) { draw(); say(msg, 'info', 'Rentangkan benang antara setiap dua ujian murid ini, lalu ketuk Lengkap.'); return; }
    fin = true;
    fill(tools);
    box.innerHTML = graphSvg(E);
    say(msg, '', `13 benang. Derajat: Fis, Inf, Sos 5; Eko 4; Bio, Kim, MTL 2; Geo 1.`);
    done();
  }
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-m]');
    if (!g || fin) return;
    e.preventDefault();
    const m = g.dataset.m;
    if (!first || first === m) { first = first === m ? null : m; draw(); return; }
    const k = key(first, m);
    first = null;
    const nm = names[n];
    if (!pairsOf(nm).includes(k)) { ctx.mistake(); shake(box); say(msg, 'bad', `${nm} tidak mengikuti ${k.replace('|', ' dan ')} bersamaan.`); draw(); return; }
    if (have.has(k)) { say(msg, 'info', `Benang ${k.replace('|', '–')} sudah ada.`); draw(); return; }
    have.add(k);
    ctx.sound.tap();
    draw();
    say(msg, 'info', `Benang ${k.replace('|', '–')}. ${have.size} benang.`);
  });
  fill(tools, button('✓ Benang kartu ini lengkap', nextCard, 'primary'));
  wrap.append(card, box, tools, msg);
  draw();
  say(msg, 'info', 'Rentangkan benang antara setiap dua ujian murid ini, lalu ketuk Lengkap.');
}

// Misi 3 and 5: the session board. Tap a subject card, then a session column.
function sessionBoard(host, ctx, { murid = MURID, sessions = 5, cap = 8, start = {}, onUpdate }) {
  const col = { ...start };
  let sel = null;
  const tray = el('div', { class: 'rk13-baki', 'data-sesi': '0' });
  const cols = el('div', { class: 'rk13-sesi-baris', style: { '--n': sessions } });
  const people = el('div', { class: 'rk13-orang' });
  const status = el('p', { class: 'rk13-status' });
  const b = { col, murid, draw, lock: false };
  const cardOf = (m) => {
    const c = onTap(el('button', { class: `rk13-kartu ${sel === m ? 'pilih' : ''}`, type: 'button', 'data-m': m }, el('b', null, m), el('small', null, NAMA[m])), (ev) => { ev.stopPropagation(); if (b.lock) return; sel = sel === m ? null : m; ctx.sound.tap(); draw(); });
    c.addEventListener('click', (ev) => ev.stopPropagation());
    return c;
  };
  function draw() {
    const angry = protests(murid, col);
    fill(tray, MAPEL.filter((m) => !col[m]).map(cardOf), MAPEL.every((m) => col[m]) ? el('small', null, 'Semua kartu sudah ditempel.') : null);
    fill(cols, Array.from({ length: sessions }, (_, i) => {
      const s = i + 1;
      const inside = MAPEL.filter((m) => col[m] === s);
      const c = el('div', { class: `rk13-kolom ${sel ? 'siap' : ''}`, 'data-sesi': s, style: { '--w': SESI[i] } }, el('span', { class: 'rk13-kolom-kepala' }, `Sesi ${s}${cap < 8 ? ` · ${inside.length}/${cap}` : ''}`), inside.map(cardOf));
      return onTap(c, () => place(s));
    }));
    fill(people, Object.entries(murid).map(([n, l]) => el('span', { class: `rk13-orang-kartu ${angry.includes(n) ? 'protes' : ''}` }, el('b', null, angry.includes(n) ? `😠 ${n}` : n), l.map((m) => el('i', { style: col[m] ? { background: SESI[col[m] - 1] } : null }, m)))));
    const placed = MAPEL.filter((m) => col[m]).length;
    status.textContent = `${placed}/8 ditempel · ${usedSessions(col)} sesi dipakai${angry.length ? ` · ${angry.length} murid protes` : ''}`;
  }
  function place(s) {
    if (b.lock || !sel) return;
    const m = sel;
    if (col[m] === s) { sel = null; draw(); return; }
    if (s && MAPEL.filter((x) => x !== m && col[x] === s).length >= cap) { ctx.mistake(); shake(cols); say(status, 'bad', `Sesi ${s} sudah berisi ${cap}: ruang hanya ${cap}.`); return; }
    const before = protests(murid, col).length;
    if (s) col[m] = s; else delete col[m];
    sel = null;
    const after = protests(murid, col);
    if (after.length > before) { ctx.mistake(); ctx.sound.bad(); } else ctx.sound.tap();
    draw();
    if (after.length > before) people.querySelectorAll('.protes').forEach((x) => shake(x));
    if (onUpdate) onUpdate(col, after);
  }
  onTap(tray, () => place(0));
  host.append(tray, cols, people, status);
  draw();
  return b;
}

// Board round: done when every card is placed, nobody protests, and the session count is the minimum.
function boardRound(wrap, ctx, { murid = MURID, cap = 8, sessions = 5, start = {}, intro, win, done }) {
  const best = fewest(edges(murid), cap);
  const msg = el('p', { class: 'reveal info' }, intro);
  const host = el('div', { class: 'rk13-papan' });
  wrap.append(host, msg);
  const check = (col, angry) => {
    if (!MAPEL.every((m) => col[m]) || angry.length) { if (angry.length) say(msg, 'bad', `Protes dari ${angry.join(', ')}: dua ujian mereka di sesi yang sama.`); else say(msg, 'info', intro); return false; }
    const n = usedSessions(col);
    if (n > best) { say(msg, 'info', `Tanpa protes, tetapi ${n} sesi. Bisa lebih hemat?`); return false; }
    b.lock = true;
    ctx.sound.good();
    say(msg, '', win(col, n));
    done();
    return true;
  };
  const b = sessionBoard(host, ctx, { murid, sessions, cap, start, onUpdate: check });
  return { b, check: () => check(b.col, protests(murid, b.col)) };
}

// Misi 2: the robots. The screen offers subjects in order; tap the smallest free session.
function robotRound13(wrap, ctx, { order, robot, rule, done }) {
  const E = edges();
  const g = greedy(E, order);
  const col = {};
  let k = 0;
  const box = el('div', { class: 'ju-graf' });
  const row = el('div', { class: 'ju-urut' });
  const msg = el('p', { class: 'reveal info' });
  const draw = () => {
    const cur = g.steps[k];
    box.innerHTML = graphSvg(E, { col, cur: cur?.m, lit: cur ? neighbours(E, cur.m).filter((x) => col[x]).map((x) => key(cur.m, x)) : [] });
    fill(row, el('span', { class: 'rk13-robot' }, '🤖 ', el('b', null, robot), el('small', null, rule)), g.steps.map((s, j) => el('span', { class: `ju-kartu ${j === k ? 'kini' : ''}`, style: j < k ? { background: SESI[s.s - 1] } : {} }, s.m, j < k ? el('small', null, `Sesi ${s.s}`) : null)));
    if (cur) say(msg, 'info', `${cur.m}: ${cur.used.length ? `tetangga sudah memakai Sesi ${cur.used.join(', ')}` : 'belum ada tetangga bersesi'}. Sesi berapa yang dipilih robot?`);
  };
  const pick = (s) => {
    const cur = g.steps[k];
    if (!cur) return;
    if (s !== cur.s) { ctx.mistake(); shake(box); say(msg, 'bad', cur.used.includes(s) ? `Sesi ${s} sudah dipakai tetangga ${cur.m}.` : 'Robot memilih nomor sesi terkecil yang masih bebas.'); return; }
    col[cur.m] = s; k++; ctx.sound.tap(); draw();
    if (k === g.steps.length) { say(msg, '', `${robot}: ${g.n} sesi. Derajat terbesar 5, jadi robot rakus tidak pernah butuh lebih dari 6.`); done(g); }
  };
  wrap.append(row, box, el('div', { class: 'seg ju-sesi' }, SESI.map((c, i) => onTap(el('button', { class: 'seg-btn ju-warna', type: 'button', style: { '--w': c } }, `Sesi ${i + 1}`), () => pick(i + 1)))), msg);
  draw();
}

// Misi 4: tap four subjects that all clash with each other.
function cliqueRound(wrap, ctx, { done }) {
  const E = edges();
  const pick = [];
  let fin = false;
  const box = el('div', { class: 'ju-graf' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk empat mata pelajaran yang setiap pasangannya bentrok.');
  const draw = () => { box.innerHTML = graphSvg(E, { pick, lit: pick.flatMap((a) => pick.filter((b) => E[key(a, b)]).map((b) => key(a, b))) }); };
  box.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-m]');
    if (!g || fin) return;
    e.preventDefault();
    const m = g.dataset.m;
    if (pick.includes(m)) { pick.splice(pick.indexOf(m), 1); draw(); return; }
    const miss = pick.filter((x) => !E[key(x, m)]);
    if (miss.length) { ctx.mistake(); shake(box); say(msg, 'bad', `${m} tidak bentrok dengan ${miss.join(', ')}.`); return; }
    pick.push(m); ctx.sound.tap(); draw();
    if (pick.length < 4) return;
    fin = true;
    const only = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const k = key(pick[i], pick[j]); if (E[k].length === 1) only.push(`${k.replace('|', '–')} hanya ${E[k][0]}`); }
    say(msg, '', `${pick.join(', ')} saling bentrok: perlu 4 sesi berbeda, jadi 3 sesi mustahil. (${only.join('; ')}.)`);
    done();
  });
  wrap.append(box, msg);
  draw();
}

// Misi 5: an event changes one student's exams. Predict, then fix the board.
function eventRound13(wrap, ctx, { events, done }) {
  const E0 = edges();
  const base = greedy(E0, byDegree(E0)).col;
  let n = 0;
  const area = el('div', { class: 'rk13-kejadian-area' });
  wrap.append(area);
  function show() {
    const ev = events[n];
    const murid = ev.murid;
    const best = fewest(edges(murid));
    const was = 4;
    const dir = best > was ? 'naik' : best < was ? 'turun' : 'tetap';
    const msg = el('p', { class: 'reveal info' }, 'Tebak: banyak sesi paling sedikit naik, turun, atau tetap?');
    const tools = el('div', { class: 'kode-baris' });
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `🃏 Kartu kejadian ${n + 1} dari ${events.length}`), el('b', null, ev.text), el('span', null, 'Jadwal lama: 4 sesi (Robot Derajat).')), tools, msg);
    fill(tools, [['⬆️ Naik', 'naik'], ['⬇️ Turun', 'turun'], ['➡️ Tetap', 'tetap']].map(([l, v]) => button(l, (e) => {
      if (v !== dir) { ctx.mistake(); shake(e?.currentTarget || tools); say(msg, 'bad', 'Lihat benang yang muncul atau hilang. Coba lagi.'); return; }
      ctx.sound.good();
      fill(tools);
      const intro = `Tebakan benar: ${best} sesi. Susun ulang sampai tidak ada protes.`;
      msg.remove();
      const after = () => { n++; if (n < events.length) setTimeout(() => { if (area.isConnected) show(); }, 3000); else done(); };
      const r = boardRound(area, ctx, { murid, start: base, intro, win: (col, k) => `${k} sesi tanpa protes. ${ev.why}`, done: after });
      if (!protests(murid, base).length && usedSessions(base) === best) r.check();
    })));
  }
  show();
}

// Web variation: 8–10 random students with 2–3 exams each.
function randomClass(rand) {
  const pool = ['Ayu', 'Bima', 'Citra', 'Dodi', 'Eka', 'Fajar', 'Gita', 'Hana', 'Iwan', 'Joko', 'Kiki', 'Lala'];
  for (let t = 0; t < 200; t++) {
    const names = rand.shuffle(pool).slice(0, rand.int(8, 10)).sort();
    const murid = Object.fromEntries(names.map((nm) => [nm, rand.shuffle(MAPEL).slice(0, rand.int(2, 3))]));
    const k = fewest(edges(murid));
    if (k >= 3 && k <= 4 && MAPEL.every((m) => names.some((nm) => murid[nm].includes(m)))) return murid;
  }
  return MURID;
}
// A random event: one student drops or adds one exam.
function randomEvent(rand) {
  const nm = rand.pick(Object.keys(MURID));
  const l = MURID[nm];
  if (l.length > 2 && rand.next() < 0.5) {
    const drop = rand.pick(l);
    return { text: `${nm} sudah ikut ujian ${NAMA[drop]} minggu lalu.`, murid: { ...MURID, [nm]: l.filter((m) => m !== drop) }, why: `${nm} kini hanya ${l.filter((m) => m !== drop).join(', ')}.` };
  }
  const add = rand.pick(MAPEL.filter((m) => !l.includes(m)));
  return { text: `${nm} ternyata juga harus menyusul ${NAMA[add]}.`, murid: { ...MURID, [nm]: [...l, add] }, why: `${nm} kini ${[...l, add].join(', ')}.` };
}

const KEJADIAN13 = {
  iwan: { text: 'Iwan ternyata hanya perlu susulan Ekonomi.', murid: { ...MURID, Iwan: ['Eko'] }, why: 'Benang Eko–Sos hilang, tetapi Fis, Inf, Sos masih saling bentrok, jadi tidak bisa kurang dari 3.' },
  joko: { text: 'Murid baru, Joko, perlu susulan Biologi, Fisika, dan Ekonomi.', murid: { ...MURID, Joko: ['Bio', 'Fis', 'Eko'] }, why: 'Benang Bio–Fis dan Bio–Eko baru: Bio, Fis, Inf, Eko, Sos kini saling bentrok.' },
  kiki: { text: 'Murid baru, Kiki, perlu susulan Kimia dan Matematika Tingkat Lanjut.', murid: { ...MURID, Kiki: ['Kim', 'MTL'] }, why: 'Benang Kim–MTL baru, tetapi Kim dan MTL sudah beda sesi. Jadwal lama tetap sah.' },
};

const HEAD13 = {
  benang: ['Benang Bentrok', 'Setiap dua ujian dari satu murid tidak boleh satu sesi: hubungkan dengan benang.'],
  robot: ['Robot Penjadwal', 'Tebak sesi yang dipilih robot: nomor terkecil yang belum dipakai tetangga.'],
  warnai: ['Warnai Jadwal', 'Tempel kartu mata pelajaran di papan sesi. Jadwal harus lolos uji protes dengan sesi paling sedikit.'],
  bukti: ['Bukti Hemat', 'Buktikan bahwa jadwal tidak bisa lebih hemat dari 4 sesi.'],
  kejadian: ['Kartu Kejadian', 'Data berubah. Tebak arah perubahannya, lalu perbaiki jadwal.'],
  boss: ['Dua Ruang', 'Hanya ada dua ruang: setiap sesi paling banyak 2 ujian.'],
};

export default {
  id: 'sma-13-jadwal-ujian',
  title: 'Jadwal Ujian Tanpa Bentrok',
  topic: 'Pewarnaan graf: cara rakus, urutan derajat, dan batas bawah',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🗓️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menggambar graf bentrok dari daftar murid, mewarnainya dengan cara rakus menurut urutan daftar dan menurut derajat, membuktikan banyak sesi paling sedikit dengan kelompok yang saling bentrok, dan menyesuaikan jadwal ketika data atau batas ruang berubah.',
  extraModes: [
    { id: 'papan', icon: '🗂️', label: 'Papan Jadwal', desc: 'Warnai bebas dengan pemeriksa bentrok, ubah data ujian setiap murid, jalankan cara rakus langkah demi langkah, dan batasi dua ruang per sesi', create: createBoard },
    { id: 'giliran', icon: '🔁', label: 'Warna Bergiliran', desc: 'Tim bergantian mewarnai satu mata pelajaran; warna yang bentrok ditolak dan mengurangi poin tim', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act jadwal-ujian rk13-main' });
    root.append(wrap);
    const E = edges();
    const kelas = randomClass(ctx.rand);
    const acak = randomEvent(ctx.rand);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 4800) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD13[k], '🗓️'));
      if (r === 0) { head('benang', 1); threadRound(wrap, ctx, { done: () => next(5200) }); }
      else if (r === 1) { head('robot', 2); robotRound13(wrap, ctx, { order: MAPEL, robot: 'Robot Daftar', rule: 'urutan daftar', done: () => next(5200) }); }
      else if (r === 2) { head('robot', 2); robotRound13(wrap, ctx, { order: byDegree(E), robot: 'Robot Derajat', rule: 'derajat terbesar dulu', done: () => next(5200) }); }
      else if (r === 3) { head('warnai', 3); boardRound(wrap, ctx, { intro: 'Ketuk kartu mata pelajaran, lalu ketuk kolom sesinya.', win: (col, n) => `${n} sesi tanpa protes. Ada 576 cara mewarnai dengan 4 sesi bernomor.`, done: () => next(5200) }); }
      else if (r === 4) { head('bukti', 4); cliqueRound(wrap, ctx, { done: () => next(5600) }); }
      else if (r === 5) { head('kejadian', 5); eventRound13(wrap, ctx, { events: [KEJADIAN13.iwan], done: () => next(5600) }); }
      else if (r === 6) { head('kejadian', 5); eventRound13(wrap, ctx, { events: [KEJADIAN13.joko], done: () => next(5600) }); }
      else if (r === 7) { head('warnai', 3); boardRound(wrap, ctx, { murid: kelas, intro: 'Kelas lain, murid lain. Ketuk kartu, lalu ketuk kolom sesinya.', win: (col, n) => `${n} sesi tanpa protes: paling sedikit untuk kelas ini.`, done: () => next(5200) }); }
      else if (r === 8) { head('kejadian', 5); eventRound13(wrap, ctx, { events: [KEJADIAN13.kiki, acak], done: () => next(5600) }); }
      else { head('boss', 'Bos'); boardRound(wrap, ctx, { cap: 2, intro: 'Setiap sesi paling banyak 2 kartu. Berapa sesi paling sedikit?', win: (col, n) => `${n} sesi: 8 ujian, 2 per sesi. Hanya ada 4 jadwal seperti ini (tanpa melihat nomor sesi).`, done: () => next(5600) }); }
    }
    render();
  },
};

function createBoard(root, ctx) {
  const wrap = el('div', { class: 'act jadwal-ujian' });
  root.append(wrap);
  const murid = Object.fromEntries(Object.entries(MURID).map(([n, l]) => [n, [...l]]));
  let cap = 8;
  const out = el('p', { class: 'reveal hint' });
  const tools = el('div', { class: 'seg' });
  const data = el('div', { class: 'ju-data' });
  const host = el('div', { class: 'ju-host' });
  let timer = null;
  const b = colorBoard(host, ctx, { murid, onChange(col, ok) { if (ok) { const n = new Set(Object.values(col)).size; const best = fewest(b.E, cap); say(out, n === best ? '' : 'info', `Tanpa bentrok: ${n} sesi${n === best ? ', paling sedikit!' : `; paling sedikit ${best}`}.`); if (n === best) ctx.sound.win(); } } });
  const run = (order, label) => {
    clearInterval(timer); b.reset();
    const g = greedy(b.E, order); let k = 0;
    timer = setInterval(() => { if (!wrap.isConnected || k >= g.steps.length) { clearInterval(timer); if (wrap.isConnected) say(out, '', `${label}: ${g.n} sesi (paling sedikit ${fewest(b.E, 8)}).`); return; } const s = g.steps[k++]; b.set({ ...b.col, [s.m]: s.s }); say(out, 'info', `${s.m}: tetangga memakai ${s.used.length ? s.used.join(', ') : '–'} → Sesi ${s.s}`); }, 900);
  };
  function drawData() {
    data.replaceChildren(...Object.entries(murid).map(([n, l]) => el('div', { class: 'ju-baris' }, el('b', null, n), ...MAPEL.map((m) => onTap(el('button', { class: `ju-cek ${l.includes(m) ? 'on' : ''}`, type: 'button' }, m), () => { const i = l.indexOf(m); if (i >= 0) l.splice(i, 1); else l.push(m); clearInterval(timer); b.setData(murid); drawData(); out.textContent = `${Object.keys(b.E).length} garis · paling sedikit ${fewest(b.E, cap)} sesi.`; })))));
  }
  function drawTools() {
    tools.replaceChildren(
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: urutan daftar'), () => run(MAPEL, 'Urutan daftar')),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Rakus: derajat'), () => run(byDegree(b.E), 'Menurut derajat')),
      onTap(el('button', { class: `seg-btn ${cap === 2 ? 'on' : ''}`, type: 'button' }, '🚪 2 ruang per sesi'), () => { cap = cap === 2 ? 8 : 2; b.setCap(cap); b.reset(); drawTools(); out.textContent = `Paling sedikit ${fewest(b.E, cap)} sesi.`; }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Hapus warna'), () => { clearInterval(timer); b.reset(); out.textContent = ''; }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '📋 Data awal'), () => { clearInterval(timer); for (const [n, l] of Object.entries(MURID)) murid[n] = [...l]; b.setData(murid); b.reset(); drawData(); out.textContent = ''; }));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Papan jadwal ujian susulan'), tools, el('div', { class: 'ju-dua' }, host, data), out);
  drawTools();
  drawData();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act jadwal-ujian' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0);
    let team = 0;
    const best = fewest(edges());
    const head = el('div');
    const msg = el('p', { class: 'reveal hint' }, `Pilih sesi lalu ketuk satu mata pelajaran. Warna tanpa bentrok +1, bentrok −1. Usahakan ${best} sesi saja.`);
    const drawHead = () => head.replaceChildren(scoreBar(pts, team), el('p', { class: 'prompt' }, `Giliran Tim ${team + 1}`));
    wrap.replaceChildren(head);
    drawHead();
    let fin = false;
    colorBoard(wrap, ctx, {
      strict: true,
      sessions: 6,
      locked: () => fin,
      onBad() { pts[team]--; say(msg, 'bad', `Bentrok! Tim ${team + 1} −1.`); team = (team + 1) % n; drawHead(); },
      onChange(col, ok, m) {
        if (!m) return;
        pts[team]++; ctx.sound.good(); team = (team + 1) % n; drawHead();
        if (Object.keys(col).length === 8) {
          fin = true;
          const used = new Set(Object.values(col)).size;
          say(msg, '', `Semua terwarnai: ${used} sesi (paling sedikit ${best}).`);
          setTimeout(() => finishBoard(wrap, ctx, { title: `Jadwal ${used} sesi; paling sedikit ${best}.`, pts, again: () => pickTeams(wrap, 'Warna Bergiliran', start) }), 3000);
        }
      },
    });
    wrap.append(msg);
  }
  pickTeams(wrap, 'Warna Bergiliran', start);
}
