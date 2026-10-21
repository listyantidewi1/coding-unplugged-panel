// Kurir Antar Kampung — SD Lanjut (10–12 tahun), jaringan dan kebuntuan.
// Every village has a sign "paket ke Harapan, oper ke …"; a packet follows
// the signs only, like a router hop by hop. A flood cuts a road and the
// signs must be updated. Part two: four cars in a small roundabout show how
// everyone waiting for everyone else becomes a deadlock.

import { el, onTap, button } from '../core/util.js';
import { choice } from '../core/kit.js';

// Places in a 100 × 74 box: Asri top left, Harapan bottom right.
export const PLACES = {
  A: { n: 'Asri', x: 14, y: 12 }, B: { n: 'Bambu', x: 50, y: 12 },
  C: { n: 'Cempaka', x: 14, y: 38 }, D: { n: 'Durian', x: 50, y: 38 }, F: { n: 'Flamboyan', x: 86, y: 38 },
  E: { n: 'Embung', x: 14, y: 62 }, G: { n: 'Gading', x: 50, y: 62 }, H: { n: 'Harapan', x: 86, y: 62 },
};
export const ROADS = [['A', 'B', 5], ['A', 'C', 3], ['B', 'D', 4], ['C', 'D', 7], ['C', 'E', 3], ['D', 'F', 3], ['E', 'F', 8], ['E', 'G', 6], ['F', 'H', 2], ['G', 'H', 5]];
const roadKey = (a, b) => [a, b].sort().join('');
const MAX_HOPS = 8;

const neighbours = (v, cut) => ROADS.filter(([a, b]) => (a === v || b === v) && !cut.has(roadKey(a, b))).map(([a, b, w]) => ({ to: a === v ? b : a, w }));

// Fastest time from every village to the target (Dijkstra; the map is tiny).
export function fastest(target = 'H', cut = new Set()) {
  const dist = Object.fromEntries(Object.keys(PLACES).map((v) => [v, Infinity]));
  dist[target] = 0;
  const done = new Set();
  while (done.size < 8) {
    const v = Object.keys(dist).filter((k) => !done.has(k)).sort((a, b) => dist[a] - dist[b])[0];
    done.add(v);
    for (const { to, w } of neighbours(v, cut)) dist[to] = Math.min(dist[to], dist[v] + w);
  }
  return dist;
}
// The sign each village should show (every equally fast choice counts).
export function bestSigns(target = 'H', cut = new Set()) {
  const dist = fastest(target, cut);
  const out = {};
  for (const v of Object.keys(PLACES)) if (v !== target) out[v] = neighbours(v, cut).filter(({ to, w }) => w + dist[to] === dist[v]).map((x) => x.to);
  return out;
}
// A packet reads only the sign where it is.
export function send(signs, from, target = 'H', cut = new Set()) {
  const path = [from];
  let time = 0;
  let cur = from;
  while (cur !== target) {
    const nxt = signs[cur];
    if (!nxt) return { path, time, end: 'kosong', at: cur };
    const road = neighbours(cur, cut).find((x) => x.to === nxt);
    if (!road) return { path, time, end: 'putus', at: cur };
    time += road.w;
    cur = nxt;
    path.push(cur);
    if (cur !== target && path.length > MAX_HOPS) return { path, time, end: 'putar', at: cur };
  }
  return { path, time, end: 'sampai' };
}
const pathText = (p) => p.map((v) => PLACES[v].n).join(' → ');

// The village map with signs. `signs` is edited in place.
function villageMap(ctx, { signs, target = 'H', cut = new Set(), editable = true, onChange, onPick }) {
  let selected = null;
  const box = el('div', { class: 'kurir-map' });
  const roads = el('div', { class: 'kurir-roads' });
  const chooser = el('div', { class: 'kurir-chooser' });
  const buttons = {};
  const paket = el('div', { class: 'paket', hidden: true }, '📦');
  function drawRoads() {
    roads.innerHTML = `<svg viewBox="0 0 100 74" aria-hidden="true">${ROADS.map(([a, b, w]) => {
      const p = PLACES[a];
      const q = PLACES[b];
      const off = cut.has(roadKey(a, b));
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="${off ? 'cut' : ''}"/>`
        + `<circle cx="${mx}" cy="${my}" r="3.4" class="${off ? 'cut' : ''}"/><text x="${mx}" y="${my + 1.3}">${off ? '🌊' : w}</text>`;
    }).join('')}</svg>`;
  }
  function drawSigns() {
    for (const [v, b] of Object.entries(buttons)) {
      const s = signs[v];
      const broken = s && cut.has(roadKey(v, s));
      b.classList.toggle('sel', v === selected);
      b.querySelector('.kp-sign').textContent = v === target ? '📮 tujuan' : s ? `➜ ${PLACES[s].n}${broken ? ' ✖' : ''}` : '➜ …';
      b.classList.toggle('broken', !!broken);
    }
  }
  function drawChooser() {
    if (!selected || !editable) { chooser.replaceChildren(el('small', { class: 'small-note' }, editable ? 'Ketuk kampung untuk mengisi papannya.' : '')); return; }
    chooser.replaceChildren(el('b', null, `Papan ${PLACES[selected].n}: oper ke`),
      ...neighbours(selected, cut).map(({ to, w }) => button(`${PLACES[to].n} (${w})`, () => {
        signs[selected] = to;
        ctx.sound.tap();
        selected = null;
        drawSigns();
        drawChooser();
        onChange?.();
      }, signs[selected] === to ? 'small on' : 'small')));
  }
  for (const [v, p] of Object.entries(PLACES)) {
    buttons[v] = onTap(el('button', { class: `kp ${v === target ? 'goal' : ''}`, type: 'button', 'data-v': v, style: { left: `${p.x}%`, top: `${(p.y / 74) * 100}%` } },
      el('b', null, p.n), el('small', { class: 'kp-sign' })), () => {
      if (onPick) { onPick(v); return; }
      if (!editable || v === target) return;
      selected = selected === v ? null : v;
      drawSigns();
      drawChooser();
    });
  }
  box.append(roads, ...Object.values(buttons), paket);
  drawRoads();
  drawSigns();
  drawChooser();
  let timer = null;
  return {
    node: box,
    chooser,
    redraw() { drawRoads(); drawSigns(); drawChooser(); },
    setCut(c) { cut = c; selected = null; this.redraw(); },
    // Moves the packet along a path; a loop blinks red.
    animate(r, speed, done) {
      clearTimeout(timer);
      let k = 0;
      paket.hidden = false;
      paket.className = 'paket';
      const hop = () => {
        const p = PLACES[r.path[k]];
        paket.style.left = `${p.x}%`;
        paket.style.top = `${(p.y / 74) * 100}%`;
        if (++k < r.path.length) timer = setTimeout(hop, speed);
        else {
          if (r.end !== 'sampai') paket.classList.add(r.end === 'putar' ? 'putar' : 'macet');
          timer = setTimeout(done, speed);
        }
      };
      hop();
    },
    stop() { clearTimeout(timer); },
  };
}

const END_TEXT = {
  sampai: (r) => `sampai, ${r.time} menit`,
  kosong: (r) => `tertahan di ${PLACES[r.at].n}: papannya kosong`,
  putus: (r) => `tertahan di ${PLACES[r.at].n}: jalannya putus`,
  putar: () => `berputar-putar, sudah dioper ${MAX_HOPS} kali`,
};

// Fill (or fix) the signs, then send packets from every village.
function signRound(wrap, ctx, { signs, cut = new Set(), prompt, done, extra = 3 }) {
  const map = villageMap(ctx, { signs, cut });
  const list = el('ol', { class: 'open-log kurir-log' });
  const total = el('p', { class: 'reveal' });
  const best = fastest('H', cut);
  const starts = [...'ABCDEFG', ...Array.from({ length: extra }, () => ctx.rand.pick([...'ABCDEG']))];
  let busy = false;
  const sendBtn = button(`📦 Kirim ${starts.length} paket`, () => {
    if (busy) return;
    const empty = Object.keys(PLACES).filter((v) => v !== 'H' && !signs[v]);
    if (empty.length) { total.className = 'reveal bad'; total.textContent = `Papan ${empty.map((v) => PLACES[v].n).join(', ')} masih kosong.`; return; }
    busy = true;
    list.replaceChildren();
    total.textContent = '';
    let k = 0;
    let sum = 0;
    let ok = true;
    const go = () => {
      if (k >= starts.length) {
        busy = false;
        const optimum = starts.reduce((s, v) => s + best[v], 0);
        total.className = ok ? 'reveal' : 'reveal bad';
        total.textContent = ok ? `Semua paket sampai, total ${sum} menit. Tidak ada yang lebih cepat! 🎉` : `Ada paket yang lambat atau tidak sampai. Periksa papannya lagi.${sum ? ` (Total ${sum} menit, terbaik ${optimum} menit.)` : ''}`;
        if (ok) done(); else ctx.mistake();
        return;
      }
      const from = starts[k++];
      const r = send(signs, from, 'H', cut);
      const fine = r.end === 'sampai' && r.time === best[from];
      if (!fine) ok = false;
      if (r.end === 'sampai') sum += r.time;
      map.animate(r, 200, () => {
        list.append(el('li', { class: fine ? '' : 'bad' }, `${PLACES[from].n}: ${END_TEXT[r.end](r)}${fine ? ' ✓' : r.end === 'sampai' ? ` (bisa ${best[from]})` : ''}`));
        list.scrollTop = list.scrollHeight;
        go();
      });
    };
    go();
  }, 'primary');
  wrap.append(el('p', { class: 'prompt' }, prompt),
    el('div', { class: 'kurir-layout' }, map.node, el('div', { class: 'kurir-side' }, map.chooser, sendBtn, total, list)));
  return map;
}

// Tap a route village by village, starting at `from`.
function routeRound(wrap, ctx, { from, prompt, done }) {
  const path = [from];
  const info = el('p', { class: 'reveal info' });
  const best = fastest('H')[from];
  let map;
  const show = () => {
    let t = 0;
    for (let i = 1; i < path.length; i++) t += neighbours(path[i - 1], new Set()).find((x) => x.to === path[i]).w;
    info.className = 'reveal info';
    info.textContent = `${pathText(path)} · ${t} menit`;
    map.node.querySelectorAll('.kp').forEach((b) => b.classList.toggle('on-path', path.includes(b.dataset.v)));
    if (path.at(-1) === 'H') {
      if (t === best) { info.className = 'reveal'; info.textContent += ' · paling cepat! 🎉'; done(); }
      else { info.className = 'reveal bad'; info.textContent += ' · masih ada jalur yang lebih cepat.'; ctx.mistake(); }
    }
  };
  map = villageMap(ctx, {
    signs: {}, editable: false,
    onPick(v) {
      if (path.at(-1) === 'H') return;
      if (!neighbours(path.at(-1), new Set()).some((x) => x.to === v)) return;
      path.push(v);
      ctx.sound.tap();
      show();
    },
  });
  const back = button('↩ Mundur', () => { if (path.length > 1) path.pop(); show(); }, 'small ghost');
  const again = button('Ulangi', () => { path.length = 1; show(); }, 'small ghost');
  wrap.append(el('p', { class: 'prompt' }, prompt), el('div', { class: 'kurir-layout' }, map.node, el('div', { class: 'kurir-side' }, info, el('div', { class: 'row' }, back, again))));
  show();
}

// ---- Bundaran ----
const SIDES = ['U', 'T', 'S', 'B'];
const SIDE_NAME = ['Utara', 'Timur', 'Selatan', 'Barat'];
export const RULES = {
  A: { label: 'A: Boleh masuk asal bagian di depanmu kosong.', need: 1, limit: 4, check: 'bersamaan', turn: 'bebas' },
  B: { label: 'B: Paling banyak 3 mobil di bundaran.', need: 1, limit: 3, check: 'bergantian', turn: 'bebas' },
  C: { label: 'C: Boleh masuk bila bagian di depanmu dan bagian sesudahnya kosong.', need: 2, limit: 4, check: 'bersamaan', turn: 'bebas' },
};

// One roundabout. Sections 0..3 = U, T, S, B, clockwise. A car from side i
// enters section i and leaves when it reaches section i + 2.
export function roundabout(rule, cars = [1, 1, 1, 1]) {
  const queue = cars.map((n, i) => Array.from({ length: n }, (_, k) => ({ from: i, id: `${SIDES[i]}${k + 1}` })));
  const ring = [null, null, null, null];
  let turns = 0;
  let out = 0;
  return {
    queue, ring,
    get turns() { return turns; },
    get out() { return out; },
    stuck: () => ring.every(Boolean),
    finished: () => ring.every((c) => !c) && queue.every((q) => !q.length),
    step() {
      turns++;
      const moved = [];
      // 1. Cars inside move one section if it was empty at the start of the turn.
      const snap = ring.slice();
      for (let s = 0; s < 4; s++) {
        const c = snap[s];
        const n = (s + 1) % 4;
        if (!c || snap[n]) continue;
        ring[s] = null;
        if (n === (c.from + 2) % 4) { out++; moved.push(`${c.id} keluar`); }
        else { ring[n] = c; moved.push(`${c.id} maju`); }
      }
      // 2. Waiting cars try to enter by the rule.
      const look = ring.slice();
      const open = (s, k) => Array.from({ length: k }, (_, j) => (s + j) % 4).every((x) => !(rule.check === 'bersamaan' ? look : ring)[x]);
      let inside = ring.filter(Boolean).length;
      const green = (i) => rule.turn === 'bebas'
        || (rule.turn === 'lampu' && (Math.floor((turns - 1) / 3) % 2 === 0 ? i % 2 === 0 : i % 2 === 1))
        || (rule.turn === 'bendera' && (turns - 1) % 4 === i);
      const entering = [];
      for (let i = 0; i < 4; i++) {
        if (!queue[i].length || !green(i) || !open(i, rule.need)) continue;
        if ((rule.check === 'bersamaan' ? look.filter(Boolean).length : inside) >= rule.limit) continue;
        entering.push(i);
        inside++;
        if (rule.check === 'bergantian') ring[i] = queue[i].shift();
      }
      if (rule.check === 'bersamaan') for (const i of entering) ring[i] = queue[i].shift();
      for (const i of entering) moved.push(`${ring[i].id} masuk`);
      return moved;
    },
  };
}

function roundaboutView(ctx, { rule, cars = [1, 1, 1, 1], onEnd }) {
  let sim = roundabout(rule, cars);
  let timer = null;
  const view = el('div', { class: 'bundaran' });
  const status = el('p', { class: 'reveal info' }, 'Tekan "Giliran!" untuk memulai.');
  const log = el('ol', { class: 'open-log kurir-log' });
  const carEl = (c) => el('span', { class: `mobil m${c.from}` }, '🚗', el('small', null, `${SIDES[c.from]}→${SIDES[(c.from + 2) % 4]}`));
  function draw() {
    const cell = (cls, ...kids) => el('div', { class: cls }, ...kids);
    view.replaceChildren(
      cell('bd-q q0', sim.queue[0].map(carEl)), cell('bd-s s0', el('i', null, 'U'), sim.ring[0] && carEl(sim.ring[0])),
      cell('bd-q q3', sim.queue[3].map(carEl)), cell('bd-s s3', el('i', null, 'B'), sim.ring[3] && carEl(sim.ring[3])),
      cell('bd-island', '↻'),
      cell('bd-s s1', el('i', null, 'T'), sim.ring[1] && carEl(sim.ring[1])), cell('bd-q q1', sim.queue[1].map(carEl)),
      cell('bd-s s2', el('i', null, 'S'), sim.ring[2] && carEl(sim.ring[2])), cell('bd-q q2', sim.queue[2].map(carEl)));
    view.classList.toggle('stuck', sim.stuck());
  }
  let ended = false;
  function step() {
    if (ended) return;
    const moved = sim.step();
    ctx.sound.tap();
    log.prepend(el('li', null, `Giliran ${sim.turns}: ${moved.length ? moved.join(', ') : 'tidak ada yang bergerak'}`));
    draw();
    if (sim.stuck()) {
      ended = true;
      clearInterval(timer);
      status.className = 'reveal bad';
      status.textContent = `MACET! Keempat bagian penuh dan semua saling menunggu (giliran ${sim.turns}).`;
      ctx.sound.bad();
      onEnd?.('macet');
    } else if (sim.finished()) {
      ended = true;
      clearInterval(timer);
      status.className = 'reveal';
      status.textContent = `Semua ${sim.out} mobil lewat dalam ${sim.turns} giliran.`;
      onEnd?.('lancar');
    } else status.textContent = `Giliran ${sim.turns} · di bundaran ${sim.ring.filter(Boolean).length} · sudah keluar ${sim.out}`;
  }
  const auto = button('▶ Otomatis', () => { clearInterval(timer); timer = setInterval(step, 650); }, 'small');
  const reset = button('Ulangi', () => { clearInterval(timer); sim = roundabout(rule, cars); ended = false; log.replaceChildren(); status.className = 'reveal info'; status.textContent = 'Tekan "Giliran!" untuk memulai.'; draw(); }, 'small ghost');
  draw();
  return {
    node: el('div', { class: 'kurir-layout' }, view, el('div', { class: 'kurir-side' }, el('p', { class: 'rule-card' }, rule.label || 'Aturanku'), el('div', { class: 'row' }, button('Giliran!', step, 'primary'), auto, reset), status, log)),
    destroy: () => clearInterval(timer),
  };
}

const BOUNDARY = {
  A: { q: 'Apa yang terjadi dengan Aturan A?', opts: [['Macet total: setiap mobil menunggu bagian di depannya yang terisi', true], ['Semua mobil keluar dengan lancar'], ['Hanya mobil dari Utara yang tertahan']] },
  B: { q: 'Aturan B: bisakah bundaran macet?', opts: [['Tidak: selalu ada satu bagian kosong, jadi mobil di belakangnya bisa maju', true], ['Ya, sama seperti Aturan A']] },
  C: { q: 'Aturan C: bisakah bundaran macet?', opts: [['Ya: kalau semua memeriksa bersamaan, semua melihat kosong lalu masuk bersamaan', true], ['Tidak pernah, karena mobil memeriksa dua bagian']] },
};

export default {
  id: 'sdl-13-kurir-kampung',
  title: 'Kurir Antar Kampung',
  topic: 'Jaringan, rute tercepat, kebuntuan',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🚲',
  source: { name: 'CS Unplugged: Routing and Deadlock', url: 'https://www.csunplugged.org/en/topics/' },
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mencari rute tercepat di peta berbobot, mengisi dan memperbarui papan petunjuk seperti router, serta menguji aturan masuk bundaran untuk mencegah kebuntuan.',
  extraModes: [
    { id: 'papan', icon: '🪧', label: 'Papan Petunjuk', desc: 'Isi papan, kirim paket dari kampung mana pun, lalu tekan "Banjir!"', create: createSigns },
    { id: 'bundaran', icon: '🚗', label: 'Bundaran', desc: 'Uji aturan masuk A, B, C, atau susun aturanmu sendiri', create: createRoundabout },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kurir' });
    root.append(wrap);
    let live = null;
    function render() {
      live?.destroy?.();
      live?.stop?.();
      live = null;
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2600); } };
      if (r === 0) routeRound(wrap, ctx, { from: 'A', prompt: 'Jalan dari Asri yang paling pendek ke Cempaka (3 menit). Apakah itu pasti paling cepat? Ketuk kampung satu per satu dari Asri sampai Harapan lewat jalur tercepat.', done: next });
      else if (r === 1) live = signRound(wrap, ctx, { signs: {}, prompt: 'Isi papan petunjuk setiap kampung: "Paket ke Harapan, oper ke …". Mulai dari kampung yang dekat Harapan.', done: next });
      else if (r === 2) {
        const sub = el('div', { class: 'kurir-sub' });
        const map = villageMap(ctx, { signs: KEY, editable: false });
        sub.append(map.node);
        choice(wrap, {
          prompt: 'Paket dari Cempaka berangkat. Setiap kurir hanya membaca papan di kampungnya. Lewat mana paketnya?', subject: sub, ctx, onRight: next, columns: 2,
          options: [['Cempaka → Durian → Flamboyan → Harapan, 12 menit', true], ['Cempaka → Embung → Flamboyan → Harapan, 13 menit'], ['Cempaka → Embung → Gading → Harapan, 14 menit'], ['Cempaka → Asri → Bambu → Durian → Flamboyan → Harapan']].map(([label, correct]) => ({ label, correct })),
        });
      } else if (r === 3) live = signRound(wrap, ctx, { signs: { ...KEY }, cut: new Set(['DF']), prompt: 'Banjir! Jalan Durian–Flamboyan putus. Perbarui papan yang perlu diganti, lalu kirim paket.', done: next });
      else if (r === 4) {
        choice(wrap, {
          prompt: 'Setelah banjir, Durian menulis "oper ke Bambu", padahal papan Bambu masih "oper ke Durian". Apa yang terjadi pada paket dari Durian?', ctx, onRight: next, columns: 1,
          options: [['Paket bolak-balik antara Durian dan Bambu terus dan tidak pernah sampai', true], ['Paket sampai, hanya sedikit lebih lambat'], ['Paket langsung kembali ke Durian dan berhenti']].map(([label, correct]) => ({ label, correct })),
        });
      } else if (r <= 7) {
        const id = 'ABC'[r - 5];
        const box = el('div', { class: 'kurir-sub' });
        const q = el('div');
        live = roundaboutView(ctx, {
          rule: RULES[id],
          onEnd() {
            if (q.childNodes.length) return;
            const b = BOUNDARY[id];
            choice(q, { prompt: b.q, ctx, onRight: next, columns: 1, options: b.opts.map(([label, correct]) => ({ label, correct })) });
          },
        });
        box.append(live.node);
        wrap.append(el('p', { class: 'prompt' }, `Bundaran Harapan · Aturan ${id}. Keempat mobil datang bersamaan. Jalankan giliran demi giliran.`), box, q);
      } else if (r === 8) {
        choice(wrap, {
          prompt: 'Mana yang termasuk kebuntuan (semua saling menunggu)?', ctx, onRight: next, columns: 1,
          options: [['Kakak memegang pensil dan menunggu penghapus dari adik; adik memegang penghapus dan menunggu pensil dari kakak', true], ['Antre membeli bakso dan dilayani satu per satu'], ['Dua kurir lewat jalan yang berbeda dan sampai bersamaan']].map(([label, correct]) => ({ label, correct })),
        });
      } else {
        // Only roads on the fastest routes, so some sign really has to change.
        const k = ctx.rand.pick(['AB', 'BD', 'CD', 'EF', 'FH', 'GH']);
        const road = [k[0], k[1]];
        live = signRound(wrap, ctx, { signs: { ...KEY }, cut: new Set([k]), prompt: `Banjir di jalan ${PLACES[road[0]].n}–${PLACES[road[1]].n}! Perbarui papan yang perlu diganti.`, done: next });
      }
    }
    render();
    return { destroy() { live?.destroy?.(); live?.stop?.(); } };
  },
};

// The answer-key signs for Harapan with every road open.
const KEY = { F: 'H', G: 'H', D: 'F', E: 'F', B: 'D', C: 'D', A: 'B' };

function createSigns(root, ctx) {
  const wrap = el('div', { class: 'act kurir' });
  root.append(wrap);
  let target = 'H';
  let signs = {};
  let cut = new Set();
  let from = null;
  let map;
  let send10;
  const info = el('p', { class: 'reveal info' }, 'Isi papan, lalu ketuk "Kirim paket".');
  const log = el('ol', { class: 'open-log kurir-log' });
  function go() {
    map?.stop();
    map = villageMap(ctx, { signs, target, cut });
    const sendOne = button('📦 Kirim paket dari…', () => {
      info.className = 'reveal info';
      info.textContent = 'Ketuk kampung asal paket.';
      from = 'pick';
    }, 'primary');
    let swallow = false;
    map.node.addEventListener('click', (e) => { if (swallow) { swallow = false; e.stopImmediatePropagation(); } }, true);
    map.node.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.kp');
      if (from !== 'pick' || !b || b.dataset.v === target) return;
      e.stopImmediatePropagation();
      swallow = true;
      from = null;
      const r = send(signs, b.dataset.v, target, cut);
      map.animate(r, 380, () => {
        info.className = r.end === 'sampai' ? 'reveal' : 'reveal bad';
        info.textContent = `${PLACES[b.dataset.v].n}: ${END_TEXT[r.end](r)}`;
        log.prepend(el('li', null, `${pathText(r.path)} · ${END_TEXT[r.end](r)}`));
      });
    }, true);
    send10 = button('Kirim 10 paket acak', () => {
      const starts = Array.from({ length: 10 }, () => Object.keys(PLACES).filter((v) => v !== target)[Math.floor(Math.random() * 7)]);
      let k = 0;
      let sum = 0;
      let bad = 0;
      const step = () => {
        if (k >= starts.length) { info.className = bad ? 'reveal bad' : 'reveal'; info.textContent = `Total ${sum} menit${bad ? `, ${bad} paket tidak sampai` : ', semua sampai'}.`; return; }
        const r = send(signs, starts[k++], target, cut);
        if (r.end === 'sampai') sum += r.time; else bad++;
        log.prepend(el('li', null, `${pathText(r.path)} · ${END_TEXT[r.end](r)}`));
        map.animate(r, 160, step);
      };
      step();
    }, 'small');
    const flood = (k) => { cut = new Set([k]); go(); info.className = 'reveal bad'; info.textContent = 'Banjir! Ada jalan yang putus. Papan mana yang harus diganti?'; };
    const tools = el('div', { class: 'row wrap' },
      button('🌊 Banjir Durian–Flamboyan', () => flood('DF'), 'small'),
      button('🌊 Banjir acak', () => { const [a, b] = ROADS[Math.floor(Math.random() * ROADS.length)]; flood(roadKey(a, b)); }, 'small'),
      button('🛠️ Perbaiki jalan', () => { cut = new Set(); go(); }, 'small ghost'),
      button(`Tujuan: ${PLACES[target].n}`, () => { target = target === 'H' ? 'A' : 'H'; signs = {}; go(); }, 'small ghost'),
      button('Hapus papan', () => { signs = {}; go(); }, 'small ghost'));
    wrap.replaceChildren(el('div', { class: 'kurir-layout' }, map.node, el('div', { class: 'kurir-side' }, map.chooser, el('div', { class: 'row wrap' }, sendOne, send10), tools, info, log)));
  }
  go();
  return { destroy() { map?.stop(); } };
}

function createRoundabout(root, ctx) {
  const wrap = el('div', { class: 'act kurir' });
  root.append(wrap);
  let pick = 'A';
  let many = false;
  const mine = { need: 1, limit: 4, check: 'bersamaan', turn: 'bebas' };
  let live = null;
  const opt = (label, on, fn) => button(label, () => { fn(); go(); }, on ? 'small on' : 'small');
  function go() {
    live?.destroy();
    const rule = pick === 'mine' ? { ...mine, label: `Aturanku: ${mine.need === 2 ? 'depan dan sesudahnya kosong' : 'depan kosong'}, paling banyak ${mine.limit} mobil, ${mine.turn === 'lampu' ? 'lampu bergantian' : mine.turn === 'bendera' ? 'bendera giliran' : 'tanpa giliran'}, periksa ${mine.check}.` } : RULES[pick];
    live = roundaboutView(ctx, { rule, cars: many ? [3, 3, 3, 3] : [1, 1, 1, 1] });
    const rows = [el('div', { class: 'row wrap' },
      ['A', 'B', 'C'].map((k) => opt(`Aturan ${k}`, pick === k, () => { pick = k; })), opt('Aturanku', pick === 'mine', () => { pick = 'mine'; }),
      opt('4 mobil', !many, () => { many = false; }), opt('12 mobil', many, () => { many = true; }))];
    if (pick === 'mine') {
      rows.push(el('div', { class: 'row wrap' },
        opt(mine.need === 2 ? 'Syarat: depan + sesudahnya' : 'Syarat: depan kosong', false, () => { mine.need = 3 - mine.need; }),
        opt(`Batas: ${mine.limit === 4 ? 'tidak ada' : `${mine.limit} mobil`}`, false, () => { mine.limit = mine.limit === 1 ? 4 : mine.limit - 1; }),
        opt(mine.turn === 'lampu' ? 'Lampu bergantian' : mine.turn === 'bendera' ? 'Bendera giliran' : 'Tanpa giliran', false, () => { mine.turn = { bebas: 'lampu', lampu: 'bendera', bendera: 'bebas' }[mine.turn]; }),
        opt(`Periksa ${mine.check}`, false, () => { mine.check = mine.check === 'bersamaan' ? 'bergantian' : 'bersamaan'; })));
    }
    wrap.replaceChildren(...rows, live.node);
  }
  go();
  return { destroy() { live?.destroy(); } };
}
