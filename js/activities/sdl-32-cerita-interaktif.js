// Cerita Rakyat Interaktif — SD Lanjut (10–12 tahun), proyek: urutan,
// perulangan, percabangan, kejadian, dan variabel dalam satu cerita.
// Stories are scenes of cards. A session plays them; a checker tests the
// first four items of the worksheet checklist automatically. Stories made
// here stay on this screen only: nothing is saved or sent.

import { el, onTap, button, choice, shake } from '../core/kit.js';

// Cards.
const LATAR = (v) => ({ op: 'latar', v });
const SET = (v, n) => ({ op: 'atur', v, n });
const ADD = (v, n) => ({ op: 'tambah', v, n });
const SHOW = (v) => ({ op: 'tampil', v });
const SAY = (who, text) => ({ op: 'kata', who, text });
const ASK = (q, a, b) => ({ op: 'tanya', q, a, b });
const GO = (to) => ({ op: 'pindah', to });
const LOOP = (n, ...body) => ({ op: 'ulangi', n, body });
const MOVE = (who, to) => ({ op: 'berpindah', who, to });
const STEP = (who, n) => ({ op: 'maju', who, n });
const HIDE = (what) => ({ op: 'sembunyi', what });
const IF = (v, cmp, n, then, other) => ({ op: 'jika', v, cmp, n, then, other });
const END = () => ({ op: 'tamat' });

export const KANCIL = {
  title: 'Kancil dan Siput',
  scenes: {
    1: { name: 'Tepi sungai', start: [LATAR('tepi sungai'), SET('bintang', 0), SAY('Kancil', 'Hai Siput, jalanmu lambat sekali! Kamu tidak mungkin menang lomba lari melawanku.'), SAY('Siput', 'Kita buktikan besok pagi. Kita berlomba sampai ke pohon beringin!'),
      ASK('Apa yang sebaiknya Siput lakukan malam ini?', { label: 'Berlatih lari sendirian', to: 2 }, { label: 'Meminta bantuan teman-teman siput', to: 3 })] },
    2: { name: 'Semak pada malam hari', start: [LATAR('semak pada malam hari'), SAY('Siput', 'Semalaman berlatih, aku baru maju tiga jengkal. Aku perlu bantuan teman-temanku.'), GO(3)] },
    3: { name: 'Lomba lari', start: [LATAR('jalan di tepi sungai dengan 5 daun lebar'), SAY('Kancil', 'Satu, dua, tiga, mulai!'),
      LOOP(5, MOVE('Kancil', 'daun berikutnya'), SAY('Kancil', 'Siput, di mana kamu?'), SAY('Siput', 'Aku di depanmu!')),
      SAY('Kancil', 'Aduh, napasku habis! Siput sudah sampai lebih dulu.'), SAY('Siput', 'Ketuk daun-daun itu untuk melihat siapa yang membantuku.')],
    objects: { daun: { items: ['🍃', '🍃', '🍃', '🍃', '🍃'], cards: [HIDE('daun itu'), ADD('bintang', 1)] } }, buttons: { Lanjut: [GO(4)] } },
    4: { name: 'Pohon beringin', start: [LATAR('pohon beringin'), IF('bintang', '=', 5, [SAY('Siput', 'Kamu menemukan semua temanku! Kami menang karena bekerja sama.')], [SAY('Siput', 'Masih ada temanku yang bersembunyi di balik daun.')]),
      SAY('Kancil', 'Maafkan aku, Siput. Aku tidak akan sombong lagi.'), SHOW('bintang'), END()] },
  },
};

// The Timun Mas draft with its three bugs; `fix` turns each fix on.
export function timunMas(fix = {}) {
  const sack = { items: ['🥒', '📍', '🧂', '🦐'], names: ['biji mentimun', 'jarum', 'garam', 'terasi'], cards: [...(fix.hide ? [HIDE('kantong itu')] : []), SAY('Timun Mas', 'Rasakan ini, Buto Ijo!'), ADD('bintang', 1)] };
  const s = {
    1: { name: 'Rumah Mbok Srini', start: [LATAR('rumah di tepi hutan'), ...(fix.lateSet ? [] : [SET('bintang', 0)]), SAY('Mbok Srini', 'Buto Ijo datang! Bawalah empat kantong ajaib ini.'),
      ASK('Apa yang harus Timun Mas lakukan?', { label: 'Lari ke hutan', to: 2 }, { label: 'Bersembunyi di lumbung padi', to: 5 })] },
    2: { name: 'Hutan', start: [LATAR('hutan'), ...(fix.lateSet ? [SET('bintang', 0)] : []), SAY('Timun Mas', 'Ketuk kantong untuk melemparnya ke arah Buto Ijo!')], objects: { kantong: sack }, buttons: { Lari: [GO(3)] } },
    3: { name: 'Buto Ijo mengejar', start: [SAY('Buto Ijo', 'Tunggu aku, Timun Mas!'), LOOP(3, STEP('Buto Ijo', 1)), fix.ifStars ? IF('bintang', '≥', 4, [GO(4)], [GO(2)]) : GO(2)] },
    4: { name: 'Lautan lumpur', start: [LATAR('lautan lumpur'), SAY('Buto Ijo', 'Tolong! Kakiku terjebak lumpur!'), SAY('Timun Mas', 'Terima kasih, kantong ajaib! Aku bisa pulang dengan selamat.'), SHOW('bintang'), END()] },
  };
  if (fix.scene5) s[5] = { name: 'Lumbung padi', start: [LATAR('lumbung padi'), SAY('Timun Mas', 'Buto Ijo mencium bau timun! Aku harus lari ke hutan.'), GO(2)] };
  return { title: 'Timun Mas', scenes: s };
}
export const ALL_FIXES = { scene5: true, hide: true, ifStars: true };

const CMP = { '=': (a, b) => a === b, '≥': (a, b) => a >= b, '>': (a, b) => a > b };

// A play session. Every call returns the events it caused.
export function session(story) {
  const st = { vars: {}, hidden: new Set(), path: [], steps: {}, scene: null, ask: null, ended: false, stuck: null };
  const exec = (cards, sceneId, events, ref) => {
    for (const c of cards) {
      if (st.ended || st.stuck) return null;
      events.push({ card: c, scene: sceneId });
      switch (c.op) {
        case 'latar': events.push({ latar: c.v }); break;
        case 'atur': st.vars[c.v] = c.n; break;
        case 'tambah': st.vars[c.v] = (st.vars[c.v] ?? 0) + c.n; events.push({ vars: { ...st.vars } }); break;
        case 'tampil': events.push({ show: c.v, value: st.vars[c.v] }); break;
        case 'kata': events.push({ who: c.who, text: c.text }); break;
        case 'berpindah': events.push({ move: `${c.who} berpindah ke ${c.to}` }); break;
        case 'maju': st.steps[c.who] = (st.steps[c.who] ?? 0) + c.n; events.push({ move: `${c.who} maju ${c.n} langkah` }); break;
        case 'sembunyi': if (ref) st.hidden.add(ref); events.push({ hide: ref }); break;
        case 'ulangi': for (let k = 0; k < c.n; k++) { const sig = exec(c.body, sceneId, events, ref); if (sig) return sig; } break;
        case 'jika': { const sig = exec(CMP[c.cmp](st.vars[c.v] ?? 0, c.n) ? c.then : c.other ?? [], sceneId, events, ref); if (sig) return sig; break; }
        case 'tanya': return { ask: c };
        case 'pindah': return { go: c.to };
        case 'tamat': return { end: true };
        default: break;
      }
    }
    return null;
  };
  const handle = (sig, events) => {
    if (!sig) return;
    if (sig.ask) { st.ask = sig.ask; events.push({ ask: sig.ask }); }
    else if (sig.go !== undefined) enter(sig.go, events);
    else if (sig.end) { st.ended = true; events.push({ end: true, vars: { ...st.vars } }); }
  };
  const enter = (n, events) => {
    if (st.path.length > 40) { st.stuck = 'Cerita berputar terus dan tidak pernah sampai TAMAT.'; events.push({ stuck: st.stuck }); return; }
    if (!story.scenes[n]) { st.stuck = `Cerita macet: adegan ${n} tidak ada.`; events.push({ stuck: st.stuck }); return; }
    st.scene = n; st.ask = null; st.path.push(n);
    events.push({ scene: n });
    handle(exec(story.scenes[n].start, n, events), events);
  };
  return {
    st,
    start() { const ev = []; enter(1, ev); return ev; },
    choose(which) {
      const ev = [];
      if (!st.ask || st.ended || st.stuck) return ev;
      const opt = st.ask[which === 'A' ? 'a' : 'b'];
      enter(opt.to, ev);
      return ev;
    },
    tap(obj, i) {
      const ev = [];
      const sc = story.scenes[st.scene];
      const ref = `${obj}:${i}`;
      if (st.ask || st.ended || st.stuck || !sc?.objects?.[obj] || st.hidden.has(ref)) return ev;
      handle(exec(sc.objects[obj].cards, st.scene, ev, ref), ev);
      return ev;
    },
    press(label) {
      const ev = [];
      const sc = story.scenes[st.scene];
      if (st.ask || st.ended || st.stuck || !sc?.buttons?.[label]) return ev;
      handle(exec(sc.buttons[label], st.scene, ev), ev);
      return ev;
    },
  };
}

// Plays a script such as ['A', 'tap:daun:0', 'btn:Lanjut'] and sums it up.
export function runStory(story, script) {
  const s = session(story);
  const events = s.start();
  for (const a of script) {
    if (a === 'A' || a === 'B') events.push(...s.choose(a));
    else if (a.startsWith('tap:')) { const [, o, i] = a.split(':'); events.push(...s.tap(o, Number(i))); }
    else if (a.startsWith('btn:')) events.push(...s.press(a.slice(4)));
  }
  return { ...s.st, events, says: events.filter((e) => e.who) };
}

// Checklist items 1–4.
export function check(story) {
  const ids = Object.keys(story.scenes).map(Number);
  const targets = (cards, out = []) => {
    cards.forEach((c) => {
      if (c.op === 'tanya') out.push(c.a.to, c.b.to);
      if (c.op === 'pindah') out.push(c.to);
      if (c.body) targets(c.body, out);
      if (c.op === 'jika') { targets(c.then, out); targets(c.other ?? [], out); }
    });
    return out;
  };
  const hasEnd = (cards) => cards.some((c) => c.op === 'tamat' || (c.body && hasEnd(c.body)) || (c.op === 'jika' && (hasEnd(c.then) || hasEnd(c.other ?? []))));
  const cardsOf = (sc) => [...sc.start, ...Object.values(sc.objects ?? {}).flatMap((o) => o.cards), ...Object.values(sc.buttons ?? {}).flat()];
  const edges = Object.fromEntries(ids.map((n) => [n, targets(cardsOf(story.scenes[n]))]));
  const missing = [...new Set(ids.flatMap((n) => edges[n].filter((t) => !story.scenes[t]).map((t) => `adegan ${n} menuju adegan ${t} yang tidak ada`)))];
  const reach = (from) => { const seen = new Set([from]); const q = [from]; while (q.length) { const n = q.shift(); (edges[n] ?? []).forEach((t) => { if (story.scenes[t] && !seen.has(t)) { seen.add(t); q.push(t); } }); } return seen; };
  const reachable = [...reach(1)];
  const ends = ids.filter((n) => hasEnd(cardsOf(story.scenes[n])));
  const noEnd = reachable.filter((n) => ![...reach(n)].some((m) => ends.includes(m)));
  const many = ids.flatMap((n) => Object.entries(story.scenes[n].objects ?? {}).filter(([, o]) => o.cards.some((c) => c.op === 'tambah') && !o.cards.some((c) => c.op === 'sembunyi')).map(([k]) => `${k} di adegan ${n}`));
  const setsAt = ids.filter((n) => cardsOf(story.scenes[n]).some((c) => c.op === 'atur' && c.v === 'bintang'));
  const shown = ids.some((n) => cardsOf(story.scenes[n]).some((c) => c.op === 'tampil' && c.v === 'bintang'));
  const usesStars = ids.some((n) => cardsOf(story.scenes[n]).some((c) => c.op === 'tambah' && c.v === 'bintang'));
  const set0 = story.scenes[1]?.start.some((c) => c.op === 'atur' && c.v === 'bintang' && c.n === 0);
  const r4 = !usesStars ? [] : [!set0 ? 'bintang tidak diatur menjadi 0 di adegan 1' : null, setsAt.some((n) => n !== 1) ? `bintang diatur lagi di adegan ${setsAt.filter((n) => n !== 1).join(', ')}` : null, !shown ? 'bintang tidak ditampilkan' : null].filter(Boolean);
  return [
    { no: 1, ok: !missing.length, why: missing.join('; ') },
    { no: 2, ok: !noEnd.length, why: noEnd.length ? `dari adegan ${noEnd.join(', ')} cerita tidak bisa sampai TAMAT` : '' },
    { no: 3, ok: !many.length, why: many.length ? `${many.join(', ')} bisa memberi bintang berkali-kali` : '' },
    { no: 4, ok: !r4.length, why: r4.join('; ') },
  ];
}
export const CHECKLIST = [
  'Setiap pilihan pembaca menuju adegan yang ada.',
  'Apa pun pilihan pembaca, cerita selalu bisa sampai TAMAT.',
  'Setiap benda hanya bisa memberi bintang satu kali.',
  'Bintang diatur menjadi 0 di awal dan jumlahnya ditampilkan di akhir.',
  'Kalimat tokoh mudah dibaca dan sesuai dengan jalan ceritanya.',
  'Halaman judul menyebut asal cerita rakyat, dan pembuatnya cukup ditulis dengan nama panggilan.',
  'Gambar dibuat sendiri atau memang boleh dipakai, dan tidak ada data pribadi.',
];

// Program lines per scene, numbered as on the worksheet.
const cardText = (c) => ({
  latar: () => `TAMPILKAN LATAR ${c.v}`, atur: () => `ATUR ${c.v} MENJADI ${c.n}`, tambah: () => `TAMBAH ${c.v} ${c.n}`, tampil: () => `TAMPILKAN ${c.v}`,
  kata: () => `${c.who} BERKATA "${c.text}"`, tanya: () => `TANYA PEMBACA "${c.q}"`, pindah: () => `PINDAH KE ADEGAN ${c.to}`, ulangi: () => `ULANGI ${c.n} KALI [`,
  berpindah: () => `${c.who} BERPINDAH KE ${c.to}`, maju: () => `${c.who} MAJU ${c.n} langkah`, sembunyi: () => `SEMBUNYIKAN ${c.what}`,
  jika: () => `JIKA ${c.v} ${c.cmp} ${c.n} MAKA`, tamat: () => 'TAMAT',
}[c.op]());

function sceneNode(story, n) {
  const sc = story.scenes[n];
  const box = el('div', { class: 'cri-adegan-kode', 'data-scene': n }, el('b', { class: 'cri-judul-adegan' }, `ADEGAN ${n}: ${sc.name}`));
  let no = 0;
  const row = (text, depth, card, numbered = true) => {
    const r = el('div', { class: 'cri-baris', style: { '--d': depth } }, el('span', { class: 'cri-no' }, numbered ? ++no : ''), el('span', null, text));
    if (card) cardRows.set(card, [...(cardRows.get(card) ?? []), r]);
    box.append(r);
  };
  const walk = (cards, depth) => cards.forEach((c) => {
    row(cardText(c), depth, c);
    if (c.op === 'tanya') { row(`A: "${c.a.label}" → ADEGAN ${c.a.to}`, depth + 1, null, false); row(`B: "${c.b.label}" → ADEGAN ${c.b.to}`, depth + 1, null, false); }
    if (c.op === 'ulangi') { walk(c.body, depth + 1); row(']', depth); }
    if (c.op === 'jika') { walk(c.then, depth + 1); if (c.other?.length) { row('JIKA TIDAK', depth); walk(c.other, depth + 1); } }
  });
  row('KETIKA ADEGAN DIMULAI', 0);
  walk(sc.start, 1);
  Object.entries(sc.objects ?? {}).forEach(([k, o]) => { row(`KETIKA ${k} DIKETUK`, 0); walk(o.cards, 1); });
  Object.entries(sc.buttons ?? {}).forEach(([k, cards]) => { row(`KETIKA tombol ${k} DIKETUK`, 0); walk(cards, 1); });
  return box;
}
let cardRows = new Map();
function storyNode(story, only) {
  cardRows = new Map();
  const node = el('div', { class: 'cri-kode' }, Object.keys(story.scenes).filter((n) => !only || only.includes(Number(n))).map((n) => sceneNode(story, Number(n))));
  node.rows = cardRows;
  return node;
}
function lightCard(code, card) {
  code.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
  const rows = code.rows?.get(card);
  rows?.[0]?.classList.add('nyala');
  rows?.[0]?.scrollIntoView?.({ block: 'nearest' });
}

// Story screen: background, characters, speech, choices, objects, buttons.
const FACES = { Kancil: '🦌', Siput: '🐌', Buaya: '🐊', 'Timun Mas': '👧', 'Buto Ijo': '👹', 'Mbok Srini': '👵', Anak: '🧒', Raja: '🤴', Putri: '👸', Nelayan: '🧑' };
function player(story, { onEvent, onDone, speed = 900 } = {}) {
  const s = session(story);
  const stage = el('div', { class: 'cri-panggung' });
  const bg = el('div', { class: 'cri-latar' });
  const bubble = el('div', { class: 'cri-balon' });
  const things = el('div', { class: 'cri-benda' });
  const controls = el('div', { class: 'cri-kendali' });
  const stars = el('b', { class: 'cri-bintang' });
  const log = el('div', { class: 'cri-catatan' });
  stage.append(bg, stars, bubble, things, controls, log);
  let queue = [], timer = null;
  const drawScene = () => {
    const sc = story.scenes[s.st.scene];
    things.replaceChildren();
    if (!sc) return;
    Object.entries(sc.objects ?? {}).forEach(([k, o]) => o.items.forEach((icon, i) => {
      const ref = `${k}:${i}`;
      if (s.st.hidden.has(ref)) return;
      things.append(onTap(el('button', { class: 'cri-ketuk', type: 'button', title: o.names?.[i] ?? k }, icon, o.names ? el('small', null, o.names[i]) : null), () => { if (!queue.length) feed(s.tap(k, i)); }));
    }));
  };
  const drawControls = () => {
    controls.replaceChildren();
    if (s.st.ended || s.st.stuck) return;
    if (s.st.ask) {
      controls.append(el('p', { class: 'cri-tanya' }, `❓ ${s.st.ask.q}`),
        button(`A: ${s.st.ask.a.label}`, () => feed(s.choose('A')), 'small'), button(`B: ${s.st.ask.b.label}`, () => feed(s.choose('B')), 'small'));
    } else if (!s.st.ended && !s.st.stuck) {
      Object.keys(story.scenes[s.st.scene]?.buttons ?? {}).forEach((k) => controls.append(button(`${k} ▸`, () => { if (!queue.length) feed(s.press(k)); }, 'primary')));
    }
  };
  const show = (e) => {
    onEvent?.(e);
    if (e.scene && !e.card) { bg.textContent = `ADEGAN ${e.scene}: ${story.scenes[e.scene].name}`; drawScene(); }
    if (e.latar) bg.textContent = `ADEGAN ${s.st.scene}: 🖼️ ${e.latar}`;
    if (e.who) { bubble.replaceChildren(el('span', { class: 'cri-wajah' }, FACES[e.who] ?? '🙂'), el('b', null, e.who), el('span', null, `"${e.text}"`)); bubble.classList.remove('baru'); void bubble.offsetWidth; bubble.classList.add('baru'); }
    if (e.move) log.prepend(el('p', null, `👣 ${e.move}`));
    if (e.vars || e.show) stars.textContent = `⭐ ${s.st.vars.bintang ?? 0}`;
    if (e.show) log.prepend(el('p', null, `🖥️ ${e.show} = ${e.value}`));
    if (e.hide) drawScene();
    if (e.stuck) { bubble.replaceChildren(el('b', null, `⛔ ${e.stuck}`)); stage.classList.add('macet'); }
    if (e.end) { bubble.replaceChildren(el('b', null, `TAMAT · ⭐ ${s.st.vars.bintang ?? 0}`)); stage.classList.add('tamat'); }
  };
  const pump = () => {
    if (!queue.length) { timer = null; drawControls(); drawScene(); if (s.st.ended || s.st.stuck) onDone?.(s.st); return; }
    const e = queue.shift();
    show(e);
    timer = setTimeout(pump, e.who ? speed : e.move ? speed / 3 : 0);
  };
  const feed = (events) => { queue.push(...events); controls.replaceChildren(); if (!timer) pump(); };
  stars.textContent = '⭐ 0';
  return { node: stage, start() { feed(s.start()); }, stop() { clearTimeout(timer); queue = []; }, st: s.st };
}

function checkNode(story, manual) {
  const res = check(story);
  return el('div', { class: 'cri-periksa' }, el('b', null, 'Daftar periksa'), CHECKLIST.map((t, i) => {
    const r = res[i];
    return el('div', { class: `cri-cek ${r ? (r.ok ? 'lolos' : 'gagal') : 'manual'}` }, el('span', null, r ? (r.ok ? '✓' : '✗') : '✎'), el('span', null, `${i + 1}. ${t}`), r && !r.ok ? el('small', null, r.why) : null, !r && manual ? el('small', null, 'diisi oleh teman penguji') : null);
  }));
}

const textOpts = (right, wrongs) => [right, ...wrongs].map((t, i) => ({ label: t, correct: i === 0 }));
const nums = (list, ans) => ({ nums: list, ans });
const D = timunMas();
const FIXED = timunMas(ALL_FIXES);
const RINA = ['B', 'tap:daun:0', 'tap:daun:1', 'tap:daun:2', 'btn:Lanjut'];
const TONI = ['B', ...Array(6).fill('tap:daun:0'), 'btn:Lanjut'];
const DIMAS = ['A', 'tap:kantong:0', 'tap:kantong:1', 'tap:kantong:2', 'tap:kantong:3', 'btn:Lari'];
const SARI = ['A', 'tap:kantong:0', 'btn:Lari', 'tap:kantong:1', 'tap:kantong:2', 'tap:kantong:3', 'btn:Lari'];

// Worksheet questions in order. `story` and `script` run after the right
// answer; `only` keeps the program short.
const PLAN = [
  { story: KANCIL, only: [1], script: ['A', 'tap:daun:0', 'btn:Lanjut'], prompt: 'Soal 1a. Pembaca memilih A. Adegan mana saja yang tampil sampai TAMAT?', opts: textOpts('1 → 2 → 3 → 4', ['1 → 2 → 4', '1 → 3 → 4', '1 → 2 → 3']) },
  { story: KANCIL, only: [1], script: ['B', 'btn:Lanjut'], prompt: 'Bila pembaca memilih B?', opts: textOpts('1 → 3 → 4', ['1 → 2 → 3 → 4', '1 → 3', '1 → 4']) },
  { story: KANCIL, only: [3], script: ['B'], prompt: 'b. Berapa kali Kancil bertanya "Siput, di mana kamu?"', ...nums([1, 3, 5, 15], 5) },
  { story: KANCIL, only: [3], script: ['B'], prompt: 'Tanpa kartu ULANGI, berapa kartu untuk menggantikan baris 4–8 adegan 3?', ...nums([5, 8, 15, 20], 15) },
  { story: KANCIL, only: [3], script: ['B'], prompt: 'Dengan ULANGI, berapa kartu?', ...nums([3, 4, 5, 15], 4) },
  { story: KANCIL, only: [4], script: RINA, prompt: 'c. Rina mengetuk 3 daun, lalu Lanjut. Apa kata Siput di adegan 4?', opts: textOpts('"Masih ada temanku yang bersembunyi di balik daun."', ['"Kamu menemukan semua temanku! Kami menang karena bekerja sama."']) },
  { story: KANCIL, only: [4], script: RINA, prompt: 'Berapa bintang yang tampil?', ...nums([0, 3, 5, 6], 3) },
  { story: KANCIL, only: [3], script: TONI, prompt: 'd. Toni mengetuk daun yang sama enam kali. Berapa bintang dari daun itu?', ...nums([0, 1, 5, 6], 1) },
  { story: KANCIL, only: [3], script: TONI, prompt: 'Kartu mana yang membuatnya begitu?', opts: textOpts('SEMBUNYIKAN daun itu (adegan 3 baris 12)', ['TAMBAH bintang 1 (adegan 3 baris 13)', 'ULANGI 5 KALI (adegan 3 baris 4)']) },
  { story: KANCIL, only: [3, 4], prompt: 'Bila kartu itu dibuang, apa yang bisa terjadi di adegan 4?', opts: textOpts('Satu daun diketuk 5 kali sudah memberi 5 bintang, jadi Siput berkata "Kamu menemukan semua temanku!"', ['Daun tidak bisa diketuk sama sekali.', 'Bintang selalu 0.']) },
  { story: KANCIL, only: [3], prompt: 'e. Contoh perulangan di program Kancil dan Siput?', opts: textOpts('Adegan 3 baris 4–8: ULANGI 5 KALI', ['Adegan 1 baris 6: TANYA PEMBACA', 'Adegan 3 baris 11: KETIKA daun DIKETUK', 'Adegan 1 baris 3: ATUR bintang MENJADI 0']) },
  { story: KANCIL, only: [3], prompt: 'Contoh kejadian?', opts: textOpts('Adegan 3 baris 11: KETIKA daun DIKETUK', ['Adegan 3 baris 4: ULANGI 5 KALI', 'Adegan 4 baris 3: JIKA bintang = 5']) },
  { story: D, only: [1], script: ['B'], prompt: 'Soal 2a. Draf Timun Mas. Uji pilihan B. Apa yang terjadi?', opts: textOpts('Cerita macet karena adegan 5 tidak ada.', ['Cerita langsung TAMAT.', 'Timun Mas kembali ke adegan 1.']) },
  { story: D, only: [1], script: ['B'], prompt: 'Nomor daftar periksa yang tidak lolos?', ...nums([1, 2, 3, 4], 1), checklist: true },
  { story: D, only: [2], script: ['A', 'tap:kantong:2', 'tap:kantong:2', 'tap:kantong:2', 'tap:kantong:2'], prompt: 'b. Ani mengetuk kantong garam empat kali. Berapa bintangnya?', ...nums([0, 1, 4, 8], 4) },
  { story: D, only: [2], prompt: 'Perbaikannya?', opts: textOpts('Tambahkan SEMBUNYIKAN kantong itu di bawah KETIKA kantong DIKETUK.', ['Ganti TAMBAH bintang 1 menjadi TAMBAH bintang 4.', 'Hapus TAMBAH bintang 1.']), play: timunMas({ hide: true }), script: ['A', 'tap:kantong:2', 'tap:kantong:2'], playOnly: [2] },
  { story: D, only: [2, 3], script: DIMAS, prompt: 'c. Dimas memilih A, mengetuk keempat kantong, lalu Lari. Adegan apa yang tampil setelah adegan 3?', opts: textOpts('adegan 2 lagi', ['adegan 4', 'TAMAT']) },
  { story: D, only: [3], prompt: 'Perbaikan baris 6 adegan 3 (pakai JIKA dan bintang)?', opts: textOpts('JIKA bintang ≥ 4 MAKA PINDAH KE ADEGAN 4 JIKA TIDAK PINDAH KE ADEGAN 2', ['JIKA bintang = 0 MAKA PINDAH KE ADEGAN 4 JIKA TIDAK PINDAH KE ADEGAN 2', 'JIKA bintang ≥ 4 MAKA PINDAH KE ADEGAN 2 JIKA TIDAK PINDAH KE ADEGAN 4']), play: timunMas({ ifStars: true, hide: true }), script: DIMAS, playOnly: [3] },
  { story: FIXED, only: [2, 3], script: SARI, prompt: 'd. Setelah ketiga perbaikan: A, 1 kantong, Lari, 3 kantong lagi, Lari. Adegan yang tampil?', opts: textOpts('1 → 2 → 3 → 2 → 3 → 4', ['1 → 2 → 3 → 4', '1 → 2 → 3 → 2 → 4']) },
  { story: FIXED, only: [3], script: SARI, prompt: 'Berapa langkah Buto Ijo maju seluruhnya?', ...nums([3, 6, 9, 12], 6) },
  { story: FIXED, only: [4], script: SARI, prompt: 'Berapa bintang yang tampil di akhir?', ...nums([1, 3, 4, 5], 4) },
  { prompt: 'Soal 6a. Mengapa asal cerita rakyat perlu ditulis di halaman judul?', opts: textOpts('Untuk menghargai masyarakat yang mewariskannya, dan supaya pembaca tahu cerita ini diceritakan ulang.', ['Supaya ceritanya lebih panjang.', 'Karena aplikasi mewajibkannya.']) },
  { prompt: 'b. Data apa yang tidak boleh ditulis di halaman judul cerita yang dibagikan?', opts: textOpts('nama lengkap, alamat rumah, nomor telepon, tanggal lahir, dan foto diri', ['nama panggilan dan kelas', 'judul cerita dan asal daerahnya']) },
];

function round(wrap, ctx, p, next) {
  const holder = el('div', { class: 'cri-soal' });
  if (p.story) holder.append(storyNode(p.story, p.only));
  else holder.append(el('div', { class: 'cri-judul-cerita' }, el('b', null, 'Halaman judul'), el('span', null, 'Judul: Kancil dan Siput'), el('span', null, 'Diceritakan ulang dari cerita rakyat Nusantara'), el('span', null, 'Dibuat oleh: (nama panggilan), kelas 6')));
  const after = () => {
    const story = p.play ?? p.story;
    if (!story || !p.script) { if (p.checklist) holder.append(checkNode(p.story)); setTimeout(next, p.checklist ? 1800 : 900); return; }
    const code = storyNode(story, p.playOnly ?? p.only);
    holder.replaceChildren(code);
    const r = runStory(story, p.script);
    const box = el('div', { class: 'cri-hasil' },
      el('p', null, el('b', null, 'Adegan: '), r.path.join(' → '), r.stuck ? ` · ⛔ ${r.stuck}` : r.ended ? ' · TAMAT' : ''),
      el('p', null, `⭐ bintang: ${r.vars.bintang ?? 0}`, Object.keys(r.steps).length ? ` · 👣 ${Object.entries(r.steps).map(([k, v]) => `${k} maju ${v} langkah`).join(', ')}` : ''),
      el('div', { class: 'cri-kata-kata' }, r.says.slice(-3).map((e) => el('p', null, `${FACES[e.who] ?? '🙂'} ${e.who}: "${e.text}"`))));
    holder.append(box);
    if (p.checklist) holder.append(checkNode(p.story));
    setTimeout(next, 2200);
  };
  let options, columns;
  if (p.nums) { options = p.nums.map((v) => ({ label: String(v), correct: v === p.ans })); columns = 4; }
  else { options = ctx.rand.shuffle(p.opts); columns = p.opts.some((o) => o.label.length > 26) ? 1 : 2; }
  choice(wrap, { prompt: p.prompt, subject: holder, ctx, onRight: after, columns, options });
}

export default {
  id: 'sdl-32-cerita-interaktif',
  title: 'Cerita Rakyat Interaktif',
  topic: 'Proyek: urutan, perulangan, percabangan, kejadian, variabel',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '📖',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid membaca program cerita interaktif, menguji draf berbug dengan daftar periksa, lalu membuat, menguji, dan menyiapkan cerita rakyat interaktifnya sendiri.',
  extraModes: [
    { id: 'main', icon: '▶️', label: 'Main dan Periksa', desc: 'Mainkan Kancil dan Siput atau draf Timun Mas, lalu perbaiki bugnya', create: createPlay },
    { id: 'susun', icon: '🛠️', label: 'Penyusun Adegan', desc: 'Buat cerita tiga adegan, periksa, lalu mainkan', create: createBuilder },
    { id: 'uji', icon: '🔁', label: 'Uji Cerita Tim Lain', desc: 'Satu tim membuat cerita, tim lain memainkan dan mengisi daftar periksa', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act cerita-interaktif' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

// Play a story with its program and the checker beside it. The Timun Mas
// draft has three fix switches.
function createPlay(root, ctx) {
  const wrap = el('div', { class: 'act cerita-interaktif' });
  root.append(wrap);
  let which = 'kancil', fix = {}, pl = null;
  const host = el('div', { class: 'cri-kerja' });
  const fixes = el('div', { class: 'row' });
  const story = () => (which === 'kancil' ? KANCIL : which === 'tantangan' ? timunMas({ ...ALL_FIXES, lateSet: true }) : timunMas(fix));
  const start = () => {
    pl?.stop();
    const s = story();
    const code = storyNode(s);
    pl = player(s, { onEvent: (e) => { if (e.card) lightCard(code, e.card); }, onDone: (st) => { if (st.ended) ctx.sound.win(); else ctx.sound.bad(); } });
    fixes.replaceChildren();
    if (which === 'timun') {
      fixes.append(el('span', { class: 'label' }, 'Perbaikan'), ...[['scene5', 'tulis adegan 5'], ['hide', 'SEMBUNYIKAN kantong'], ['ifStars', 'JIKA bintang ≥ 4']].map(([k, label]) => {
        const b = button(`${fix[k] ? '✓' : '○'} ${label}`, () => { fix[k] = !fix[k]; ctx.sound.tap(); start(); }, 'small');
        return b;
      }));
    }
    host.replaceChildren(el('div', { class: 'cri-kiri' }, pl.node, button('⟲ Mulai lagi', start, 'small')), el('div', { class: 'cri-kiri' }, code, checkNode(s)));
    pl.start();
  };
  const tabs = el('div', { class: 'row' }, el('span', { class: 'label' }, 'Cerita'),
    button('Kancil dan Siput', () => { which = 'kancil'; start(); }, 'small'),
    button('Draf Timun Mas', () => { which = 'timun'; fix = {}; start(); }, 'small'),
    button('Tantangan: ATUR di adegan 2', () => { which = 'tantangan'; start(); }, 'small'));
  wrap.append(tabs, fixes, host);
  start();
  return { destroy() { pl?.stop(); } };
}

// Builder: three scenes from a small gallery. Typed text stays on screen
// only; the title page asks for a nickname.
const PLACES = ['tepi sungai', 'hutan', 'desa', 'sawah', 'pantai', 'gunung', 'istana', 'pohon beringin', 'lautan lumpur'];
const CHARS = Object.keys(FACES);
const THINGS = [['tidak ada', ''], ['daun', '🍃'], ['bunga', '🌺'], ['kerang', '🐚'], ['kantong', '👝'], ['bintang laut', '⭐']];
const ENDINGS = ['tanya', 'lanjut', 'tamat'];
const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

function blankDraft() {
  return {
    title: 'Ceritaku', origin: '', region: '', nick: '',
    scenes: [1, 2, 3].map((n) => ({ place: PLACES[n - 1], a: CHARS[n === 3 ? 2 : 0], b: CHARS[1], sayA: '', sayB: '', loop: n === 2 ? 3 : 0, thing: n === 2 ? 'kerang' : 'tidak ada', count: n === 2 ? 3 : 0, hide: true, end: n === 1 ? 'tanya' : n === 2 ? 'lanjut' : 'tamat', q: 'Ke mana tokoh pergi?', la: 'Ke pantai', ta: 2, lb: 'Ke istana', tb: 3, to: n + 1, ifStars: n === 3, need: 3 })),
    setStars: true, showStars: true,
  };
}

export function draftToStory(d) {
  const scenes = {};
  d.scenes.forEach((s, i) => {
    const n = i + 1;
    const start = [LATAR(s.place)];
    if (n === 1 && d.setStars) start.push(SET('bintang', 0));
    if (s.sayA.trim()) start.push(SAY(s.a, s.sayA.trim()));
    if (s.loop) start.push(LOOP(s.loop, STEP(s.a, 1)));
    if (s.sayB.trim()) start.push(SAY(s.b, s.sayB.trim()));
    const sc = { name: s.place, start };
    if (s.thing !== 'tidak ada' && s.count) {
      const icon = THINGS.find(([k]) => k === s.thing)[1];
      sc.objects = { [s.thing]: { items: Array(s.count).fill(icon), cards: [...(s.hide ? [HIDE(`${s.thing} itu`)] : []), ADD('bintang', 1)] } };
    }
    if (s.end === 'tanya') start.push(ASK(s.q, { label: s.la, to: s.ta }, { label: s.lb, to: s.tb }));
    else if (s.end === 'lanjut') sc.buttons = { Lanjut: [GO(s.to)] };
    else {
      if (s.ifStars) start.push(IF('bintang', '≥', s.need, [SAY(s.a, 'Hebat! Semua bintang terkumpul.')], [SAY(s.a, 'Masih ada bintang yang tertinggal.')]));
      if (d.showStars) start.push(SHOW('bintang'));
      start.push(END());
    }
    scenes[n] = sc;
  });
  return { title: d.title, scenes };
}

function builder(ctx, draft, onChange) {
  const node = el('div', { class: 'cri-penyusun' });
  const input = (obj, key, ph, max = 80, cls = '') => {
    const i = el('input', { class: `txt ${cls}`, type: 'text', maxlength: String(max), value: obj[key], placeholder: ph, autocomplete: 'off', spellcheck: 'false' });
    i.addEventListener('input', () => { obj[key] = i.value; onChange(); });
    return i;
  };
  const chip = (text, fn) => onTap(el('button', { class: 'cri-pilih', type: 'button' }, text), () => { fn(); ctx.sound.tap(); draw(); onChange(); });
  const draw = () => {
    node.replaceChildren(
      el('div', { class: 'cri-judul-form' }, el('b', null, 'Halaman judul'), input(draft, 'title', 'judul', 40), input(draft, 'origin', 'cerita rakyat apa', 40), input(draft, 'region', 'asal daerah', 30), input(draft, 'nick', 'nama panggilan saja', 16, 'pendek')),
      ...draft.scenes.map((s, i) => el('div', { class: 'cri-adegan-form' },
        el('b', null, `Adegan ${i + 1}`),
        el('div', { class: 'row' }, el('span', null, 'latar'), chip(`🖼️ ${s.place}`, () => { s.place = cycle(PLACES, s.place); }),
          el('span', null, 'tokoh'), chip(`${FACES[s.a]} ${s.a}`, () => { s.a = cycle(CHARS, s.a); }), chip(`${FACES[s.b]} ${s.b}`, () => { s.b = cycle(CHARS, s.b); })),
        el('div', { class: 'row' }, input(s, 'sayA', `${s.a} berkata …`), input(s, 'sayB', `${s.b} berkata …`)),
        el('div', { class: 'row' }, el('span', null, 'ULANGI'), chip(s.loop ? `${s.loop} KALI ${s.a} maju` : 'tidak ada', () => { s.loop = cycle([0, 2, 3, 5], s.loop); }),
          el('span', null, 'benda'), chip(`${THINGS.find(([k]) => k === s.thing)[1]} ${s.thing}`, () => { s.thing = cycle(THINGS.map(([k]) => k), s.thing); if (s.thing !== 'tidak ada' && !s.count) s.count = 3; }),
          s.thing !== 'tidak ada' ? chip(`× ${s.count}`, () => { s.count = cycle([1, 2, 3, 4, 5], s.count); }) : null,
          s.thing !== 'tidak ada' ? chip(s.hide ? '✓ SEMBUNYIKAN' : '○ SEMBUNYIKAN', () => { s.hide = !s.hide; }) : null),
        el('div', { class: 'row' }, el('span', null, 'akhir'), chip({ tanya: 'TANYA PEMBACA', lanjut: 'tombol Lanjut', tamat: 'TAMAT' }[s.end], () => { s.end = cycle(ENDINGS, s.end); }),
          ...(s.end === 'tanya' ? [input(s, 'q', 'pertanyaan', 60), input(s, 'la', 'pilihan A', 30, 'pendek'), chip(`→ ${s.ta}`, () => { s.ta = cycle([1, 2, 3, 4], s.ta); }), input(s, 'lb', 'pilihan B', 30, 'pendek'), chip(`→ ${s.tb}`, () => { s.tb = cycle([1, 2, 3, 4], s.tb); })]
            : s.end === 'lanjut' ? [chip(`→ ADEGAN ${s.to}`, () => { s.to = cycle([1, 2, 3, 4], s.to); })]
              : [chip(s.ifStars ? `JIKA bintang ≥ ${s.need}` : 'tanpa JIKA', () => { s.ifStars = !s.ifStars; }), s.ifStars ? chip(`≥ ${s.need}`, () => { s.need = cycle([1, 2, 3, 4, 5], s.need); }) : null])))),
      el('div', { class: 'row' }, chip(draft.setStars ? '✓ ATUR bintang MENJADI 0 di adegan 1' : '○ ATUR bintang MENJADI 0 di adegan 1', () => { draft.setStars = !draft.setStars; }),
        chip(draft.showStars ? '✓ TAMPILKAN bintang di akhir' : '○ TAMPILKAN bintang di akhir', () => { draft.showStars = !draft.showStars; })));
  };
  draw();
  return { node };
}

const NOTE = 'Cerita hanya ada di layar ini dan hilang saat halaman ditutup. Tulis nama panggilan saja, tanpa alamat, nomor telepon, atau data pribadi lain.';
const draftExample = () => {
  const d = blankDraft();
  Object.assign(d, { title: 'Kerang Ajaib', origin: 'cerita rekaan', region: 'pesisir' });
  d.scenes[0] = { ...d.scenes[0], place: 'desa', a: 'Nelayan', b: 'Anak', sayA: 'Ombak besar menyembunyikan kerang ajaib.', sayB: 'Ayo kita cari!', q: 'Ke mana mencari kerang?', la: 'Ke pantai', ta: 2, lb: 'Ke gunung', tb: 3 };
  d.scenes[1] = { ...d.scenes[1], place: 'pantai', a: 'Anak', b: 'Nelayan', sayA: 'Aku melihat kerang di pasir!', sayB: 'Ketuk kerangnya satu per satu.', loop: 3, thing: 'kerang', count: 3, end: 'lanjut', to: 3 };
  d.scenes[2] = { ...d.scenes[2], place: 'gunung', a: 'Nelayan', b: 'Anak', sayA: 'Dari puncak, laut terlihat tenang.', sayB: 'Terima kasih sudah membantu!', loop: 0, end: 'tamat', ifStars: true, need: 3 };
  return d;
};

function createBuilder(root, ctx) {
  const wrap = el('div', { class: 'act cerita-interaktif' });
  root.append(wrap);
  let draft = draftExample(), pl = null;
  const side = el('div', { class: 'cri-kiri' });
  const host = el('div', { class: 'cri-kerja' });
  const refresh = () => { const s = draftToStory(draft); side.replaceChildren(checkNode(s, true), storyNode(s)); };
  const edit = () => { pl?.stop(); const b = builder(ctx, draft, refresh); host.replaceChildren(b.node, side); refresh(); };
  const playBtn = button('▶ Mainkan', () => {
    const s = draftToStory(draft);
    pl?.stop();
    const code = storyNode(s);
    pl = player(s, { onEvent: (e) => { if (e.card) lightCard(code, e.card); } });
    host.replaceChildren(el('div', { class: 'cri-kiri' }, el('div', { class: 'cri-judul-cerita' }, el('b', null, draft.title || 'Ceritaku'), el('span', null, `Diceritakan ulang dari ${draft.origin || '…'}${draft.region ? ` dari ${draft.region}` : ''}`), el('span', null, `Dibuat oleh: ${draft.nick || '…'}`)), pl.node), code);
    pl.start();
  }, 'primary');
  wrap.append(el('div', { class: 'row' }, button('✏️ Ubah', edit, 'small'), playBtn, button('Contoh', () => { draft = draftExample(); edit(); }, 'small'), button('Kosongkan', () => { draft = blankDraft(); edit(); }, 'small')), host, el('p', { class: 'cri-catatan-kecil' }, NOTE));
  edit();
  return { destroy() { pl?.stop(); } };
}

// Bergiliran: team A builds, team B plays it twice and marks the checklist.
// B scores for each item it marks ✗ that the checker also fails; A scores
// for each item 1–4 that passes.
function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act cerita-interaktif' });
  root.append(wrap);
  const score = [0, 0];
  let turn = 0, pl = null;
  function start() {
    pl?.stop();
    const a = turn % 2, b = 1 - a;
    const draft = blankDraft();
    const head = el('p', { class: 'prompt' }, `Tim ${a + 1}: buat cerita tiga adegan. Bug boleh disengaja!`);
    const bld = builder(ctx, draft, () => {});
    wrap.replaceChildren(head, bld.node, button('Cerita siap ✓', test, 'primary'), el('p', { class: 'cri-catatan-kecil' }, NOTE));
    function test() {
      const s = draftToStory(draft);
      const marks = CHECKLIST.slice(0, 4).map(() => true);
      head.textContent = `Tim ${b + 1}: mainkan cerita ini dua kali dengan pilihan berbeda, lalu tandai daftar periksa.`;
      const list = el('div', { class: 'cri-periksa' }, el('b', null, 'Tandai yang tidak lolos'), ...CHECKLIST.slice(0, 4).map((t, i) => {
        const r = onTap(el('button', { class: 'cri-cek manual', type: 'button' }, el('span', null, '✓'), el('span', null, `${i + 1}. ${t}`)), () => { marks[i] = !marks[i]; r.className = `cri-cek ${marks[i] ? 'manual' : 'gagal'}`; r.firstChild.textContent = marks[i] ? '✓' : '✗'; ctx.sound.tap(); });
        return r;
      }));
      const playOnce = () => { pl?.stop(); pl = player(s); stageHost.replaceChildren(pl.node); pl.start(); };
      const stageHost = el('div');
      const info = el('p', { class: 'cri-info' });
      const done = button('Periksa ✓', () => {
        const res = check(s);
        let found = 0, ok = 0;
        res.forEach((r, i) => { if (!r.ok && !marks[i]) found++; if (r.ok) ok++; });
        score[b] += found; score[a] += ok;
        info.textContent = `Pemeriksa: ${res.map((r) => `${r.no} ${r.ok ? '✓' : '✗'}`).join(' · ')}. Tim ${b + 1} menemukan ${found} bug, Tim ${a + 1} lolos ${ok} nomor. Skor · Tim 1: ${score[0]} · Tim 2: ${score[1]}`;
        done.remove(); ctx.sound.good();
        wrap.append(button('🔁 Tukar peran', () => { turn++; start(); }, 'primary'));
      }, 'primary');
      wrap.replaceChildren(head, el('div', { class: 'cri-kerja' }, el('div', { class: 'cri-kiri' }, stageHost, button('⟲ Main lagi', playOnce, 'small')), el('div', { class: 'cri-kiri' }, list, done)), info);
      playOnce();
    }
  }
  start();
  return { destroy() { pl?.stop(); } };
}
