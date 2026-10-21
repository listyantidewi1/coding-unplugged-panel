// Gerakan yang Diberi Nama — SD Awal (7–9 tahun), prosedur.
// A row of moves gets a name (Bintang, Kupu-Kupu) and is written once; the
// dance then uses the name. Changing the meaning changes every use.

import { el, onTap, button, choice, shake } from '../core/kit.js';

const MOVES = {
  atas: { icon: '🙌', label: 'tangan ke atas', play: (s) => s.tap() },
  buka: { icon: '🦶', label: 'kaki dibuka', play: (s) => s.stomp() },
  tepuk: { icon: '👏', label: 'tepuk', play: (s) => s.clap() },
  kepak: { icon: '🦋', label: 'tangan mengepak', play: (s) => s.tap() },
  putar: { icon: '🔄', label: 'berputar', play: (s) => s.spin() },
  lompat: { icon: '🦘', label: 'lompat', play: (s) => s.stomp() },
  bungkuk: { icon: '🙇', label: 'membungkuk', play: (s) => s.tap() },
};
const BEAT = 700;

// Named moves are { id, name, icon, body: [move keys] }.
const bintang = () => ({ id: 'N1', name: 'Bintang', icon: '⭐', body: ['atas', 'buka', 'tepuk'] });
const kupu = () => ({ id: 'N2', name: 'Kupu-Kupu', icon: '🦋', body: ['kepak', 'kepak', 'putar'] });
const DANCE = ['N1', 'N2', 'N1', 'lompat', 'N1', 'N2'];

// Expands a dance into single moves, remembering which card each came from.
export function expand(dance, named) {
  const byId = Object.fromEntries(named.map((n) => [n.id, n]));
  const out = [];
  dance.forEach((c, i) => {
    if (MOVES[c]) out.push({ m: c, card: i });
    else (byId[c]?.body ?? []).forEach((m, j) => out.push({ m, card: i, named: c, inner: j }));
  });
  return out;
}
const cardsWithNames = (dance, named) => dance.length + named.filter((n) => dance.includes(n.id)).reduce((s, n) => s + n.body.length, 0);
const moveOpt = (k, ans) => ({ icon: MOVES[k].icon, label: MOVES[k].label, correct: k === ans });

function cardNode(c, named, cls = '') {
  if (MOVES[c]) return el('span', { class: `gn-kartu ${cls}` }, el('span', null, MOVES[c].icon), el('small', null, MOVES[c].label));
  const n = named.find((x) => x.id === c);
  return el('span', { class: `gn-kartu bernama ${cls}` }, el('span', null, n?.icon ?? '❓'), el('small', null, n?.name ?? '?'));
}
function meaning(n) {
  return el('div', { class: 'gn-arti', 'data-id': n.id }, el('b', null, `${n.icon} ${n.name} =`),
    n.body.length ? n.body.map((m) => el('span', { class: 'gn-mini', title: MOVES[m].label }, MOVES[m].icon)) : el('span', { class: 'gn-mini' }, '❓'));
}
function danceView(dance, named) {
  return el('div', { class: 'gn-soal' }, el('div', { class: 'gn-artis' }, named.map(meaning)),
    el('div', { class: 'gn-tarian' }, dance.map((c) => cardNode(c, named))));
}

// The dancer: shows each move big and counts "5 dari 16".
function dancer() {
  const pose = el('span', { class: 'gym-pose' }, '🧍');
  const count = el('span', { class: 'gym-count' });
  const node = el('div', { class: 'gym gn-penari' }, pose, count);
  let timers = [];
  return {
    node,
    perform(moves, sound, { onMove, done } = {}) {
      timers.forEach(clearTimeout);
      timers = moves.map((x, i) => setTimeout(() => {
        pose.textContent = MOVES[x.m].icon;
        count.textContent = `${i + 1} dari ${moves.length}`;
        node.classList.remove('beat'); void node.offsetWidth; node.classList.add('beat');
        MOVES[x.m].play(sound);
        onMove?.(x, i);
      }, i * BEAT));
      timers.push(setTimeout(() => { pose.textContent = '🧍'; done?.(); }, moves.length * BEAT + 300));
    },
    stop() { timers.forEach(clearTimeout); pose.textContent = '🧍'; count.textContent = ''; },
  };
}

const bigBintang = () => ({ ...bintang(), body: ['atas', 'buka', 'tepuk', 'tepuk'] });
// Worksheet questions 1–4.
const PLAN = [
  { prompt: 'Berapa kartu di program tarian kelas 3?', opts: [4, 6, 9, 16], ans: 6 },
  { prompt: 'Kalau semua gerakan ditulis satu per satu tanpa nama, berapa kartu yang diperlukan?', opts: [12, 14, 16, 18], ans: 16, dance: true },
  { prompt: 'Dengan nama, kita menulis program tarian dan arti kedua gerakan bernama. Berapa kartunya?', opts: [9, 12, 16, 18], ans: 12 },
  { prompt: 'Ikuti tarian dari awal. Gerakan ke-5 adalah …', moves: ['kepak', 'putar', 'tepuk', 'buka'], ans: 'kepak', dance: true },
  { prompt: 'Gerakan ke-10 adalah …', moves: ['tepuk', 'lompat', 'atas', 'putar'], ans: 'lompat', dance: true },
  { prompt: 'Gerakan terakhir adalah …', moves: ['tepuk', 'kepak', 'putar', 'lompat'], ans: 'putar', dance: true },
  { prompt: 'Bu Guru menambah satu tepuk pada Bintang. Berapa tempat yang harus diubah di karton?', opts: [1, 3, 4], ans: 1, named: () => [bigBintang(), kupu()] },
  { prompt: 'Dengan Bintang yang baru, berapa gerakan di tarian sekarang?', opts: [16, 18, 19, 22], ans: 19, named: () => [bigBintang(), kupu()], dance: true },
  { prompt: 'Dika menulis ⭐ Bintang · 🌊 Ombak · ⭐ Bintang. Teman-temannya bingung di "Ombak". Mengapa?', dika: true,
    texts: ['Ombak belum pernah diberi arti', 'Ombak terlalu sulit ditarikan', 'Bintang dipakai dua kali'] },
  { prompt: 'Apa yang harus Dika tulis lebih dulu?', dika: true, texts: ['arti Ombak, misalnya 🦋 🙇 🔄', 'Bintang sekali lagi', 'tarian yang lebih pendek'] },
];

function round(wrap, ctx, p, next) {
  const named = p.named ? p.named() : [bintang(), kupu()];
  let subject;
  if (p.dika) {
    const ombak = { id: 'N3', name: 'Ombak', icon: '🌊', body: [] };
    subject = danceView(['N1', 'N3', 'N1'], [bintang(), ombak]);
  } else {
    subject = danceView(DANCE, named);
    if (p.dance) {
      const d = dancer();
      const moves = expand(DANCE, named);
      subject.append(el('div', { class: 'gn-main' }, d.node, button('▶ Tarikan', () => d.perform(moves, ctx.sound), 'small')));
    }
  }
  let options;
  if (p.moves) options = p.moves.map((k) => moveOpt(k, p.ans));
  else if (p.texts) options = p.texts.map((t, i) => ({ label: t, correct: i === 0 }));
  else options = p.opts.map((o) => ({ label: String(o), correct: o === p.ans }));
  if (p.texts) options = ctx.rand.shuffle(options);
  choice(wrap, { prompt: p.prompt, subject, ctx, onRight: next, columns: p.texts ? 1 : options.length, options });
}

export default {
  id: 'sda-16-gerak-bernama',
  title: 'Gerakan yang Diberi Nama',
  topic: 'Prosedur',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '⭐',
  source: null,
  rounds: PLAN.length,
  maxPlayers: 4,
  goal: 'Murid menjalankan tarian yang memakai gerakan bernama, menghitung kartu yang dihemat, mengubah arti sebuah gerakan, dan membuat gerakan bernamanya sendiri.',
  extraModes: [
    { id: 'studio', icon: '💃', label: 'Studio Tari', desc: 'Buat gerakan bernama, susun tarian, dan menari bersama', create: (r, c) => createStudio(r, c, 'studio') },
    { id: 'tim', icon: '🤝', label: 'Gerakan Tim', desc: 'Tim A membuat gerakan bernama, tim B menyusun tarian', create: (r, c) => createStudio(r, c, 'tim') },
    { id: 'ringkas', icon: '✂️', label: 'Ringkas Tarian', desc: 'Ringkas tarian panjang dengan gerakan bernama', create: createSummary },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gerak-bernama' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      round(wrap, ctx, PLAN[ctx.round % PLAN.length], () => { if (ctx.solved()) setTimeout(render, 900); });
    }
    render();
  },
};

const ICONS = ['⭐', '🦋', '🌊', '🌸', '🐒', '🌙'];

// Box for one named move: name (shown only, never saved), icon, and 2 to 4
// moves. `onChange` runs after every edit.
function namedBox(n, { onChange, locked = () => false }) {
  const body = el('div', { class: 'gn-isi' });
  const name = el('input', { class: 'gn-nama', type: 'text', maxlength: '12', value: n.name, 'aria-label': 'nama gerakan', autocomplete: 'off', spellcheck: 'false' });
  name.addEventListener('input', () => { n.name = name.value.trim() || '?'; onChange(); });
  const icons = el('div', { class: 'gn-ikon' }, ICONS.map((ic) => onTap(el('button', { class: `gn-ikon-btn${ic === n.icon ? ' on' : ''}`, type: 'button' }, ic), (e) => {
    if (locked()) return;
    n.icon = ic;
    icons.querySelectorAll('.gn-ikon-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
    onChange();
  })));
  const draw = () => {
    body.replaceChildren(...(n.body.length ? n.body.map((m, i) => onTap(el('button', { class: 'gn-mini-btn', type: 'button', title: `lepas ${MOVES[m].label}` }, MOVES[m].icon), () => {
      if (locked()) return;
      n.body.splice(i, 1); draw(); onChange();
    })) : [el('span', { class: 'gn-kosong' }, 'kosong')]));
  };
  draw();
  const node = el('div', { class: 'gn-kotak', 'data-id': n.id }, el('div', { class: 'gn-kepala' }, name, icons), body);
  return { node, n, draw, add(m) { if (locked() || n.body.length >= 4) return false; n.body.push(m); draw(); onChange(); return true; } };
}

// Studio (Sendiri/Kelas) and the team version. The dance board takes basic
// and named cards; the counter compares cards with and without names.
function createStudio(root, ctx, mode) {
  const wrap = el('div', { class: 'act gerak-bernama' });
  root.append(wrap);
  const team = mode === 'tim';
  let turn = 0;
  let phase = team ? 'buat' : 'bebas';
  let named, dance, boxes, active, playing = false;
  const d = dancer();
  const head = el('p', { class: 'prompt' });
  const boxRow = el('div', { class: 'gn-kotak-baris' });
  const board = el('div', { class: 'gn-tarian papan' });
  const counter = el('div', { class: 'gn-hitung' });
  const palette = el('div', { class: 'gn-palet' });
  const info = el('p', { class: 'gn-info' });
  const named_ok = (id) => named.find((n) => n.id === id)?.body.length >= 2;
  function reset() {
    named = team ? [{ id: 'N1', name: 'Gerakan A', icon: '🌸', body: [] }] : [bintang(), kupu()];
    dance = team ? [] : DANCE.slice();
    active = named[0].id;
    phase = team ? 'buat' : 'bebas';
    drawAll();
  }
  const canEditNamed = () => !playing && phase !== 'tari';
  const canEditDance = () => !playing && phase !== 'buat';
  function drawBoxes() {
    boxes = named.map((n) => namedBox(n, { onChange: drawBoard, locked: () => !canEditNamed() }));
    boxRow.replaceChildren(...[...boxes.map((b) => {
      b.node.classList.toggle('aktif', b.n.id === active);
      b.node.addEventListener('click', () => { active = b.n.id; boxRow.querySelectorAll('.gn-kotak').forEach((x) => x.classList.toggle('aktif', x === b.node)); });
      return b.node;
    }), named.length < 2 && canEditNamed() ? button('+ Gerakan bernama', () => {
      const id = `N${named.length + 1}`;
      named.push({ id, name: team ? 'Gerakan B' : 'Ombak', icon: '🌊', body: [] });
      active = id; drawAll();
    }, 'small') : null].filter(Boolean));
  }
  function drawBoard() {
    board.replaceChildren(...(dance.length ? dance.map((c, i) => {
      const node = cardNode(c, named, MOVES[c] || named_ok(c) ? '' : 'belum');
      node.dataset.i = i;
      node.addEventListener('click', () => { if (canEditDance()) { dance.splice(i, 1); drawBoard(); } });
      return node;
    }) : [el('span', { class: 'gn-kosong' }, team && phase === 'buat' ? 'Tim B menyusun tarian setelah gerakan bernama selesai.' : 'Ketuk kartu untuk menyusun tarian.')]));
    const flat = expand(dance, named).length;
    counter.textContent = `Banyak gerakan: ${flat} · kartu tanpa nama: ${flat} · kartu dengan nama: ${cardsWithNames(dance, named)}`;
    palette.replaceChildren(
      ...Object.keys(MOVES).map((k) => onTap(el('button', { class: 'gn-pilih', type: 'button', title: MOVES[k].label, 'data-m': k }, MOVES[k].icon, el('small', null, MOVES[k].label)), () => addMove(k))),
      ...named.map((n) => onTap(el('button', { class: 'gn-pilih bernama', type: 'button', 'data-m': n.id }, n.icon, el('small', null, n.name)), () => addCard(n.id))));
  }
  function addMove(k) {
    // While making named moves, basic moves go into the active box.
    if (phase === 'buat' || (phase === 'bebas' && boxRow.querySelector('.gn-kotak.aktif.isi'))) {
      const b = boxes.find((x) => x.n.id === active);
      if (!b?.add(k)) shake(boxRow);
      else ctx.sound.tap();
      return;
    }
    addCard(k);
  }
  function addCard(c) {
    if (!canEditDance() || dance.length >= 12) { shake(board); return; }
    dance.push(c); ctx.sound.tap(); drawBoard();
  }
  // In the studio, a toggle says where basic moves go.
  const target = el('div', { class: 'row' });
  function drawTarget() {
    if (team) { target.replaceChildren(); return; }
    const intoBox = boxRow.querySelector('.gn-kotak.aktif.isi');
    target.replaceChildren(el('span', { class: 'label' }, 'Kartu gerak masuk ke:'),
      button('papan tarian', () => { boxRow.querySelectorAll('.gn-kotak').forEach((x) => x.classList.remove('isi')); drawTarget(); }, intoBox ? 'small' : 'small on'),
      button('gerakan bernama yang dipilih', () => { boxRow.querySelector('.gn-kotak.aktif')?.classList.add('isi'); drawTarget(); }, intoBox ? 'small on' : 'small'));
  }
  const play = button('▶ Menari', () => {
    if (!dance.length) { shake(board); return; }
    const missing = dance.filter((c) => !MOVES[c] && !named_ok(c));
    if (missing.length) { info.textContent = '❓ Ada gerakan bernama yang belum punya arti (minimal 2 gerakan), jadi tarian tidak bisa dijalankan.'; shake(board); ctx.sound.bad(); return; }
    playing = true; info.textContent = '';
    const moves = expand(dance, named);
    d.perform(moves, ctx.sound, {
      onMove: (x) => {
        board.querySelectorAll('.gn-kartu').forEach((n) => n.classList.toggle('nyala', Number(n.dataset.i) === x.card));
        boxRow.querySelectorAll('.gn-kotak').forEach((b) => {
          const on = b.dataset.id === x.named;
          b.classList.toggle('buka', on);
          b.querySelectorAll('.gn-mini-btn').forEach((m, j) => m.classList.toggle('nyala', on && j === x.inner));
        });
      },
      done: () => {
        playing = false;
        board.querySelectorAll('.nyala').forEach((n) => n.classList.remove('nyala'));
        boxRow.querySelectorAll('.buka, .nyala').forEach((n) => n.classList.remove('buka', 'nyala'));
        ctx.sound.win();
        if (team && phase === 'tari') info.textContent = 'Kedua tim menari bersama! Tekan Tukar peran untuk bergantian.';
      },
    });
  }, 'primary');
  const next = el('div', { class: 'row' });
  function drawHead() {
    const a = turn % 2 + 1, b = 3 - a;
    if (!team) { head.textContent = 'Buat gerakan bernama, susun tarian, lalu menari bersama!'; next.replaceChildren(); return; }
    if (phase === 'buat') {
      head.textContent = `Tim ${a}: beri nama, pilih ikon, lalu ketuk 2–4 kartu gerak untuk gerakan bernama.`;
      next.replaceChildren(button(`Selesai, giliran Tim ${b} ▶`, () => {
        if (!named.some((n) => n.body.length >= 2)) { shake(boxRow); return; }
        phase = 'susun'; drawAll();
      }, 'primary'));
    } else if (phase === 'susun') {
      head.textContent = `Tim ${b}: susun tarian dengan gerakan bernama milik Tim ${a}.`;
      next.replaceChildren(button('Siap menari ▶', () => { if (!dance.length) { shake(board); return; } phase = 'tari'; drawAll(); }, 'primary'));
    } else {
      head.textContent = 'Kedua tim menari bersama!';
      next.replaceChildren(button('🔁 Tukar peran', () => { turn++; reset(); }, 'primary'));
    }
  }
  function drawAll() { drawBoxes(); drawBoard(); drawHead(); drawTarget(); }
  reset();
  wrap.append(head, boxRow, target, el('div', { class: 'gn-tengah' }, d.node, el('div', { class: 'gn-kanan' }, board, palette, counter)),
    el('div', { class: 'row' }, play, next), info);
  return { destroy() { d.stop(); } };
}

// Ringkas: a long dance written move by move. Make named moves and a short
// dance that gives exactly the same moves, with as few cards as possible.
const LONG_DANCES = [
  { title: 'Tarian kelas 3', moves: expand(DANCE, [bintang(), kupu()]).map((x) => x.m) },
  { title: 'Tarian penutup', moves: ['kepak', 'bungkuk', 'putar', 'lompat', 'kepak', 'bungkuk', 'putar', 'lompat', 'tepuk', 'kepak', 'bungkuk', 'putar'] },
];
function createSummary(root, ctx) {
  const wrap = el('div', { class: 'act gerak-bernama' });
  root.append(wrap);
  let idx = 0;
  function show() {
    const L = LONG_DANCES[idx % LONG_DANCES.length];
    const named = [{ id: 'N1', name: 'Gerakan A', icon: '⭐', body: [] }, { id: 'N2', name: 'Gerakan B', icon: '🦋', body: [] }];
    const dance = [];
    let into = 'N1';
    const boxes = named.map((n) => namedBox(n, { onChange: draw }));
    const boxRow = el('div', { class: 'gn-kotak-baris' }, boxes.map((b) => b.node));
    const pick = el('div', { class: 'row' });
    const board = el('div', { class: 'gn-tarian papan' });
    const info = el('p', { class: 'gn-info' });
    function drawPick() {
      pick.replaceChildren(el('span', { class: 'label' }, 'Kartu gerak masuk ke:'),
        ...[['N1', 'Gerakan A'], ['N2', 'Gerakan B'], ['tari', 'tarian']].map(([k, l]) => button(k === 'tari' ? 'tarian' : named.find((n) => n.id === k).name || l, () => { into = k; drawPick(); }, into === k ? 'small on' : 'small')));
      boxes.forEach((b) => b.node.classList.toggle('aktif', b.n.id === into));
    }
    function draw() {
      board.replaceChildren(...(dance.length ? dance.map((c, i) => {
        const node = cardNode(c, named);
        node.addEventListener('click', () => { dance.splice(i, 1); draw(); });
        return node;
      }) : [el('span', { class: 'gn-kosong' }, 'Tarian ringkasmu muncul di sini.')]));
      palette.replaceChildren(
        ...Object.keys(MOVES).map((k) => onTap(el('button', { class: 'gn-pilih', type: 'button', 'data-m': k, title: MOVES[k].label }, MOVES[k].icon), () => {
          if (into === 'tari') { if (dance.length < 16) dance.push(k); } else boxes.find((b) => b.n.id === into).add(k);
          ctx.sound.tap(); draw();
        })),
        ...named.map((n) => onTap(el('button', { class: 'gn-pilih bernama', type: 'button', 'data-m': n.id }, n.icon, el('small', null, n.name)), () => {
          if (dance.length < 16) dance.push(n.id); ctx.sound.tap(); draw();
        })));
      drawPick();
    }
    const palette = el('div', { class: 'gn-palet' });
    const check = button('Periksa', () => {
      const got = expand(dance, named).map((x) => x.m);
      const ok = got.length === L.moves.length && got.every((m, i) => m === L.moves[i]);
      if (ok) {
        info.textContent = `✅ Sama persis! Kartu dengan nama: ${cardsWithNames(dance, named)}, padahal tanpa nama ${L.moves.length} kartu.`;
        ctx.sound.win();
      } else {
        const at = got.findIndex((m, i) => m !== L.moves[i]);
        info.textContent = `✗ Belum sama. ${at >= 0 ? `Gerakan ke-${at + 1} berbeda.` : got.length < L.moves.length ? 'Tarianmu lebih pendek.' : 'Tarianmu lebih panjang.'}`;
        ctx.sound.bad();
      }
    }, 'primary');
    draw();
    wrap.replaceChildren(el('p', { class: 'prompt' }, `${L.title} ditulis satu per satu (${L.moves.length} kartu). Ringkas dengan gerakan bernama!`),
      el('div', { class: 'gn-tarian panjang' }, L.moves.map((m) => el('span', { class: 'gn-mini', title: MOVES[m].label }, MOVES[m].icon))),
      boxRow, pick, board, palette, el('div', { class: 'row' }, check, button('Tarian lain ▶', () => { idx++; show(); }, 'small')), info);
  }
  show();
}
