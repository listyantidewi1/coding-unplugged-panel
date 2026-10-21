// Rel Kereta Pengurut — SD Lanjut (10–12 tahun), jaringan pengurutan.
// Six wagons roll down six tracks. At every switch post two wagons meet;
// the smaller goes to the left track. All posts in one row work at the
// same time, so the whole yard sorts in five steps.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

// The worksheet's schedule (tracks numbered from 0 here).
export const NETWORK = [
  [[0, 5], [1, 3], [2, 4]],
  [[1, 2], [3, 4]],
  [[0, 3], [2, 5]],
  [[0, 1], [2, 3], [4, 5]],
  [[1, 2], [3, 4]],
];
const LETTER = { 1: 'K', 2: 'E', 3: 'R', 4: 'E', 5: 'T', 6: 'A' };
const CITIES = ['Solo', 'Bandung', 'Semarang', 'Cirebon', 'Madiun', 'Kediri'];
export const before = (a, b) => (typeof a === 'number' ? a < b : a.localeCompare(b, 'id') < 0);

// Runs wagons through the posts; returns every stage and the swaps per row.
export function run(net, input) {
  const stages = [input.slice()];
  const swaps = [];
  let cur = input.slice();
  for (const row of net) {
    cur = cur.slice();
    let n = 0;
    for (const [a, b] of row) if (before(cur[b], cur[a])) { [cur[a], cur[b]] = [cur[b], cur[a]]; n++; }
    stages.push(cur);
    swaps.push(n);
  }
  return { stages, swaps };
}
const sorted = (arr) => arr.every((x, i) => i === 0 || !before(x, arr[i - 1]));

// Sub-level for each post so posts in one row that overlap don't collide.
function levels(row) {
  const lv = [];
  row.forEach(([a, b], k) => {
    let l = 0;
    while (row.some(([c, d], j) => j < k && lv[j] === l && !(d < a || c > b))) l++;
    lv.push(l);
  });
  return lv;
}

// Draws the yard: a row of wagons, then a band of posts, and so on.
// `onPost(r, k)` gets taps on posts; returns handles to update the view.
function yard(lanes, net, { onPost, onWagon, label = (v) => v } = {}) {
  const x = (i) => `${((i + 0.5) / lanes) * 100}%`;
  const wagonRows = [];
  const posts = [];
  const node = el('div', { class: 'yard-net', style: { '--lanes': lanes } });
  const wagons = (r) => {
    const row = el('div', { class: 'wagon-row' }, Array.from({ length: lanes }, (_, i) => {
      const w = el('button', { class: 'wagon', type: 'button' });
      if (onWagon) onTap(w, () => onWagon(r, i));
      return w;
    }));
    wagonRows.push(row);
    return row;
  };
  node.append(el('div', { class: 'lane-nums' }, Array.from({ length: lanes }, (_, i) => el('span', null, `Rel ${i + 1}`))), wagons(0));
  net.forEach((row, r) => {
    const lv = levels(row);
    const depth = Math.max(1, ...lv.map((l) => l + 1));
    const band = el('div', { class: 'post-band', style: { '--depth': depth } },
      Array.from({ length: lanes }, (_, i) => el('i', { class: 'track', style: { left: x(i) } })),
      el('span', { class: 'band-num' }, r + 1));
    posts.push(row.map(([a, b], k) => {
      const p = el('button', { class: 'post', type: 'button', style: { left: x(a), width: `${((b - a) / lanes) * 100}%`, top: `${((lv[k] + 0.5) / depth) * 100}%` }, 'aria-label': `pos ${a + 1}–${b + 1}` },
        el('i', { class: 'post-end' }), el('i', { class: 'post-end right' }));
      if (onPost) onTap(p, () => onPost(r, k));
      band.append(p);
      return p;
    }));
    node.append(band, wagons(r + 1));
  });
  return {
    node,
    posts,
    show(r, vals, cls = '') {
      wagonRows[r].classList.toggle('hidden', !vals);
      [...wagonRows[r].children].forEach((w, i) => {
        w.textContent = vals ? label(vals[i]) : '';
        w.className = `wagon ${cls}`;
      });
    },
    wagon: (r, i) => wagonRows[r].children[i],
  };
}

// Play the yard row by row: tap the posts that should swap, then "Jalankan".
function playRound(wrap, ctx, input, next, { prompt, label, net = NETWORK } = {}) {
  const lanes = input.length;
  const { stages } = run(net, input);
  let r = 0;
  let swaps = 0;
  const marks = net.map((row) => row.map(() => false));
  const counter = el('span', { class: 'open-count' }, 'Tukar: 0');
  const msg = el('p', { class: 'reveal' });
  const y = yard(lanes, net, {
    label,
    onPost(row, k) {
      if (row !== r) return;
      marks[row][k] = !marks[row][k];
      y.posts[row][k].classList.toggle('on', marks[row][k]);
      ctx.sound.tap();
    },
  });
  function focus() {
    y.posts.forEach((row, k) => row.forEach((p) => p.classList.toggle('active', k === r)));
    for (let k = 0; k <= net.length; k++) y.show(k, k <= r ? stages[k] : null);
  }
  const go = button('▶ Jalankan baris', () => {
    if (r >= net.length) return;
    const cur = stages[r];
    const wrong = net[r].filter(([a, b], k) => marks[r][k] !== before(cur[b], cur[a]));
    if (wrong.length) {
      ctx.mistake();
      net[r].forEach(([a, b], k) => { if (marks[r][k] !== before(cur[b], cur[a])) shake(y.posts[r][k]); });
      msg.className = 'reveal bad';
      msg.textContent = 'Periksa lagi: nomor lebih kecil harus ke rel kiri.';
      return;
    }
    swaps += marks[r].filter(Boolean).length;
    counter.textContent = `Tukar: ${swaps}`;
    msg.textContent = '';
    ctx.sound.good();
    r++;
    focus();
    if (r === net.length) {
      go.hidden = true;
      const out = stages[r];
      const letters = typeof out[0] === 'number' && lanes === 6 ? ` Balik tokennya: ${out.map((v) => LETTER[v]).join('')}!` : '';
      msg.className = 'reveal';
      msg.textContent = `Keluar: ${out.join(', ')}. Jumlah tukar ${swaps}.${letters}`;
      next();
    }
  }, 'primary');
  focus();
  wrap.append(
    el('p', { class: 'prompt' }, prompt || 'Ketuk pos yang harus MENUKAR gerbong di baris yang menyala, lalu Jalankan.'),
    y.node, el('div', { class: 'row' }, go, counter), msg);
}

// Animate a run; `done(out)` at the end.
function animate(y, net, input, done, speed = 700) {
  const { stages } = run(net, input);
  let k = 0;
  y.show(0, stages[0]);
  for (let r = 1; r <= net.length; r++) y.show(r, null);
  const timers = [];
  const step = () => {
    if (k > 0) y.posts[k - 1].forEach((p) => p.classList.remove('flash'));
    if (k === net.length) { done(stages[k]); return; }
    const cur = stages[k];
    net[k].forEach(([a, b], j) => { if (before(cur[b], cur[a])) y.posts[k][j].classList.add('flash'); });
    k++;
    y.show(k, stages[k]);
    timers.push(setTimeout(step, speed));
  };
  timers.push(setTimeout(step, speed));
  return () => timers.forEach(clearTimeout);
}

const BROKEN = NETWORK.map((row, r) => (r === 3 ? row.filter(([a, b]) => !(a === 0 && b === 1)) : row));

export default {
  id: 'sdl-09-rel-kereta',
  title: 'Rel Kereta Pengurut',
  topic: 'Jaringan pengurutan dan kerja paralel',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🚃',
  source: { name: 'CS Unplugged: Sorting Networks', url: 'https://www.csunplugged.org/en/topics/sorting-networks/' },
  rounds: 7,
  maxPlayers: 4,
  goal: 'Murid menjalankan gerbong melalui pos wesel, melihat bahwa semua urutan keluar terurut, mencoba rel yang rusak, dan merancang rel 3 jalur.',
  extraModes: [
    { id: 'jelajah', icon: '🛤️', label: 'Peta Rel', desc: 'Susun gerbong atau Acak, pilih muatan angka, huruf, atau kota, tekan Jalan; coba juga Hapus pos', create: createExplore },
    { id: 'rancang', icon: '🛠️', label: 'Rancang Rel', desc: 'Rel 3 atau 4 jalur kosong: pasang pos, lalu uji semua urutan', create: createDesign },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act rel' });
    root.append(wrap);
    let stop = null;
    function render() {
      stop?.();
      stop = null;
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 2800); };
      if (r === 0) playRound(wrap, ctx, [6, 4, 3, 2, 1, 5], next, { prompt: 'Kereta pertama: 6 4 3 2 1 5. Ketuk pos yang harus menukar di baris yang menyala, lalu Jalankan.' });
      else if (r === 1) playRound(wrap, ctx, CITIES, next, { prompt: 'Gerbong tujuan kota: nama yang lebih awal menurut abjad ke rel kiri.' });
      else if (r === 2) {
        const y = yard(6, BROKEN);
        const ask = el('div');
        stop = animate(y, BROKEN, [2, 1, 3, 4, 5, 6], (out) => {
          choice(ask, {
            prompt: `Pos 1–2 di baris 4 hilang. Keluar: ${out.join(' ')}. Apakah rel ini masih bisa dipercaya?`, ctx, onRight: next, columns: 1,
            options: [
              { label: 'Tidak. Satu urutan yang gagal sudah membuktikan rancangannya salah.', correct: true },
              { label: 'Ya. Hampir semua gerbong sudah urut.' },
            ],
          });
        }, 900);
        wrap.append(el('p', { class: 'prompt' }, 'Rel yang rusak: perhatikan gerbong 2, 1, 3, 4, 5, 6.'), y.node, ask);
      } else if (r === 3) {
        choice(wrap, {
          prompt: 'Rel ini punya 12 pos, tetapi gerbong hanya melewati 5 baris. Mengapa lebih cepat daripada satu petugas yang membandingkan satu per satu?', ctx, onRight: next, columns: 1,
          options: ctx.rand.shuffle([
            { label: 'Pos dalam satu baris menghubungkan rel yang berbeda, jadi bekerja bersamaan', correct: true },
            { label: 'Gerbongnya lebih cepat daripada petugas' },
            { label: 'Rel ini tidak perlu membandingkan gerbong' },
          ]),
        });
      } else playRound(wrap, ctx, ctx.rand.shuffle([1, 2, 3, 4, 5, 6]), next);
    }
    render();
    return { destroy() { stop?.(); } };
  },
};

const LOADS = {
  angka: () => [1, 2, 3, 4, 5, 6],
  huruf: () => ['A', 'G', 'K', 'M', 'R', 'U'],
  kota: () => CITIES.slice(),
};

// Peta Rel: arrange the wagons (tap two to swap) or shuffle, choose the
// load, run it; "Hapus pos" lets you tap posts away to break the yard.
function createExplore(root, ctx) {
  const wrap = el('div', { class: 'act rel' });
  root.append(wrap);
  let load = 'angka';
  let input = [6, 4, 3, 2, 1, 5];
  let removed = new Set();
  let removing = false;
  let picked = -1;
  let stop = null;
  const msg = el('p', { class: 'reveal' });
  function net() { return NETWORK.map((row, r) => row.filter((_, k) => !removed.has(`${r}-${k}`))); }
  function draw() {
    stop?.();
    const y = yard(6, NETWORK, {
      onWagon(r, i) {
        if (r !== 0) return;
        if (picked < 0) { picked = i; y.wagon(0, i).classList.add('picked'); return; }
        [input[picked], input[i]] = [input[i], input[picked]];
        picked = -1;
        draw();
      },
      onPost(r, k) {
        if (!removing) return;
        const key = `${r}-${k}`;
        if (removed.has(key)) removed.delete(key); else removed.add(key);
        draw();
      },
    });
    y.posts.forEach((row, r) => row.forEach((p, k) => p.classList.toggle('gone', removed.has(`${r}-${k}`))));
    y.show(0, input);
    for (let r = 1; r <= NETWORK.length; r++) y.show(r, null);
    const bar = el('div', { class: 'row' },
      Object.keys(LOADS).map((k) => button(k[0].toUpperCase() + k.slice(1), () => { load = k; input = LOADS[k]().sort(() => Math.random() - 0.5); draw(); }, k === load ? 'small on' : 'small')),
      button('🎲 Acak', () => { input = input.slice().sort(() => Math.random() - 0.5); draw(); }, 'small'),
      button('▶ Jalan', () => {
        msg.textContent = '';
        const live = net();
        // Map the live (possibly broken) network back onto the drawn posts.
        stop = animate({ ...y, posts: NETWORK.map((row, r) => row.map((_, k) => y.posts[r][k]).filter((_, k) => !removed.has(`${r}-${k}`))) }, live, input, (out) => {
          const ok = sorted(out);
          msg.className = ok ? 'reveal' : 'reveal bad';
          msg.textContent = ok ? `Keluar berurutan: ${out.join(', ')}` : `Tidak urut: ${out.join(', ')}`;
          if (ok) ctx.sound.win(); else ctx.sound.bad();
        });
      }, 'primary'),
      button(removing ? '✅ Selesai hapus' : '✂️ Hapus pos', () => { removing = !removing; draw(); }, removing ? 'small on' : 'small'));
    wrap.replaceChildren(el('p', { class: 'prompt' }, removing ? 'Ketuk pos untuk menghapus atau memasangnya lagi.' : 'Ketuk dua gerbong di atas untuk menukar urutan masuk.'), y.node, bar, msg);
  }
  draw();
  return { destroy() { stop?.(); } };
}

// Rancang Rel: add posts one by one on 3 or 4 lanes, then test every order.
function createDesign(root, ctx) {
  const wrap = el('div', { class: 'act rel' });
  root.append(wrap);
  let lanes = 3;
  let posts = [];
  let first = -1;
  function perms(n) {
    const out = [];
    const go = (pre, rest) => { if (!rest.length) out.push(pre); rest.forEach((x, i) => go([...pre, x], rest.filter((_, j) => j !== i))); };
    go([], Array.from({ length: n }, (_, i) => i + 1));
    return out;
  }
  function draw(results) {
    const net = posts.map((p) => [p]);
    const y = yard(lanes, net, {
      onWagon(r, i) {
        if (r !== net.length) return;
        if (first < 0) { first = i; y.wagon(r, i).classList.add('picked'); return; }
        if (first !== i && posts.length < 8) posts.push([Math.min(first, i), Math.max(first, i)]);
        first = -1;
        draw();
      },
    });
    for (let r = 0; r <= net.length; r++) y.show(r, Array.from({ length: lanes }, (_, i) => (r === net.length ? '+' : r === 0 ? '▼' : '·')));
    const bar = el('div', { class: 'row' },
      [3, 4].map((n) => button(`${n} jalur`, () => { lanes = n; posts = []; draw(); }, n === lanes ? 'small on' : 'small')),
      button('↩️ Hapus pos terakhir', () => { posts.pop(); draw(); }, 'small'),
      button('🧪 Uji semua urutan', () => {
        const res = perms(lanes).map((p) => ({ p, ok: sorted(run(net, p).stages.at(-1)) }));
        const fails = res.filter((x) => !x.ok).length;
        if (fails) ctx.sound.bad(); else ctx.sound.win();
        draw(res);
      }, 'primary'),
      el('span', { class: 'open-count' }, `Pos: ${posts.length}`));
    const out = results ? el('div', { class: 'perm-chips' }, results.map((x) => el('span', { class: `chip-perm ${x.ok ? 'ok' : 'bad'}` }, x.p.join('-')))) : null;
    const note = results ? el('p', { class: results.every((x) => x.ok) ? 'reveal' : 'reveal bad' },
      results.every((x) => x.ok) ? `Berhasil untuk semua ${results.length} urutan dengan ${posts.length} pos!` : `${results.filter((x) => !x.ok).length} urutan gagal.`) : null;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Ketuk dua kotak "+" di bawah untuk memasang pos baru di antara dua rel.'), y.node, bar, out, note);
  }
  draw();
}
