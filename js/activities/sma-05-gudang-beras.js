// Quicksort di Gudang Beras — SMA/SMK (16–18 tahun), algoritma pengurutan.
// Quicksort on rice sacks: first-element pivot, median of three, worst case on
// sorted data, the best-case recurrence T(n) and the log2(n!) lower bound.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

export const KARUNG = [33, 68, 47, 63, 26, 51, 42, 56, 21, 38];
export const URUT = [...KARUNG].sort((a, b) => a - b);

// Stable partition around the item at index p of the group.
export function partition(group, p) {
  const pv = group[p];
  const rest = group.filter((_, i) => i !== p);
  return { pivot: pv, left: rest.filter((x) => x < pv), right: rest.filter((x) => x > pv), cmp: group.length - 1 };
}
export function median3Index(g) {
  if (g.length < 3) return 0;
  const idx = [0, Math.floor((g.length - 1) / 2), g.length - 1];
  return [...idx].sort((a, b) => g[a] - g[b])[1];
}
export const pickFirst = () => 0;
// Run quicksort; returns rows and total comparisons.
export function quicksort(arr, pick = pickFirst) {
  const rows = [];
  const go = (g) => {
    if (g.length < 2) return g;
    const r = partition(g, pick(g));
    rows.push({ group: g, ...r });
    return [...go(r.left), r.pivot, ...go(r.right)];
  };
  const sorted = go(arr);
  return { sorted, rows, total: rows.reduce((t, r) => t + r.cmp, 0) };
}
const memo = [0, 0];
export function best(n) { if (memo[n] != null) return memo[n]; const l = Math.floor((n - 1) / 2); memo[n] = n - 1 + best(l) + best(n - 1 - l); return memo[n]; }
export const lowerBound = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return Math.ceil(s - 1e-9); };
export const worst = (n) => (n * (n - 1)) / 2;

// Board: rows of sacks; groups are processed left first. rule: 'bebas' | 'pertama' | 'tengah3'.
function board(host, ctx, { arr, rule = 'bebas', onDone, onRound, speed = 170 }) {
  let items = arr.map((w) => ({ w, fixed: false }));
  let stack = [[0, items.length]];
  let total = 0;
  let busy = false;
  let cmpI = -1;
  let pivotI = -1;
  const row = el('div', { class: 'gb-baris' });
  const info = el('p', { class: 'reveal info' });
  const max = Math.max(...arr);
  const b = { get total() { return total; }, enabled: true, auto: null };
  const cur = () => { while (stack.length) { const [lo, hi] = stack.at(-1); if (hi - lo < 2) { for (let i = lo; i < hi; i++) items[i].fixed = true; stack.pop(); } else return [lo, hi]; } return null; };
  function draw() {
    const g = cur();
    row.replaceChildren(...items.map((it, i) => {
      const inG = g && i >= g[0] && i < g[1];
      const cls = ['gb-karung', it.fixed ? 'tetap' : '', inG ? 'kelompok' : '', i === pivotI ? 'pivot' : '', i === cmpI ? 'banding' : '', it.side ? `ke-${it.side}` : ''].join(' ');
      return onTap(el('button', { class: cls, type: 'button', style: { '--h': `${30 + (it.w / max) * 70}%` }, 'data-i': i }, el('span', null, it.w)), () => tap(i));
    }));
    info.textContent = g ? `Kelompok: ${items.slice(g[0], g[1]).map((x) => x.w).join(', ')} · perbandingan: ${total}` : `Urut! Total ${total} perbandingan.`;
  }
  function tap(i) {
    const g = cur();
    if (!g || busy || !b.enabled || i < g[0] || i >= g[1]) return;
    const group = items.slice(g[0], g[1]).map((x) => x.w);
    const want = rule === 'pertama' ? 0 : rule === 'tengah3' ? median3Index(group) : null;
    if (want !== null && i - g[0] !== want) {
      ctx.mistake();
      shake(row);
      say(info, 'bad', rule === 'pertama' ? `Aturannya: pivot adalah karung pertama di kelompok (${group[0]}).` : group.length < 3 ? `Kelompok 2 karung memakai karung pertama (${group[0]}).` : `Lihat pertama, tengah, dan terakhir: ${[0, Math.floor((group.length - 1) / 2), group.length - 1].map((k) => group[k]).join(', ')}. Yang beratnya di tengah: ${group[want]}.`);
      return;
    }
    run(g, i - g[0]);
  }
  function run([lo, hi], p) {
    busy = true;
    const group = items.slice(lo, hi).map((x) => x.w);
    const r = partition(group, p);
    pivotI = lo + p;
    const others = group.map((w, k) => [w, k]).filter(([, k]) => k !== p);
    let k = 0;
    const step = () => {
      if (!host.isConnected) return;
      if (k < others.length) {
        const [w, idx] = others[k];
        cmpI = lo + idx;
        items[lo + idx].side = w < r.pivot ? 'kiri' : 'kanan';
        total++;
        ctx.sound.tap();
        draw();
        info.textContent = `${w} dibanding pivot ${r.pivot}: ${w < r.pivot ? 'lebih ringan → kiri' : 'lebih berat → kanan'} · perbandingan: ${total}`;
        k++;
        setTimeout(step, speed);
        return;
      }
      const next = [...r.left, r.pivot, ...r.right].map((w) => ({ w, fixed: false }));
      items.splice(lo, hi - lo, ...next);
      items[lo + r.left.length].fixed = true;
      items.forEach((x) => { delete x.side; });
      stack.pop();
      const mid = lo + r.left.length;
      stack.push([mid + 1, hi], [lo, mid]);
      cmpI = -1;
      pivotI = -1;
      busy = false;
      if (onRound) onRound({ group, ...r });
      draw();
      if (!cur()) { if (onDone) onDone(total); } else if (b.auto) setTimeout(autoStep, speed * 2);
    };
    step();
  }
  function autoStep() { const g = cur(); if (!g || !host.isConnected) return; const group = items.slice(g[0], g[1]).map((x) => x.w); run(g, b.auto === 'tengah3' ? median3Index(group) : 0); }
  b.start = (mode) => { b.auto = mode; if (!busy) autoStep(); };
  host.append(row, info);
  draw();
  return b;
}

// ---- Regu Hemat Tenaga: the missions ----

// A strip of coupons; each weighing tears one.
function couponBag(max) {
  const node = el('div', { class: 'rh-kupon', 'aria-label': 'Kantong kupon tenaga' });
  const num = el('b');
  const strip = el('div', { class: 'rh-sobek' }, Array.from({ length: max }, () => el('i')));
  node.append(el('small', null, '🎟 Kupon'), strip, num);
  return {
    node,
    set(used) {
      [...strip.children].forEach((c, k) => c.classList.toggle('robek', k < used));
      num.textContent = `${Math.max(0, max - used)} sisa`;
      node.classList.toggle('tipis', max - used <= 5);
    },
  };
}

// The warehouse floor. pick: who chooses the pivot ('pertama' | 'tengah3' | 'bebas'
// checked against the player's tap; auto: the machine picks with that rule).
// manual: the player sends every weighed sack to the light or heavy lane.
function regu(host, ctx, { arr, pick = 'pertama', auto = false, manual = false, kupon = 30, speed = 160, onDone, onEmpty }) {
  let items = arr.map((w) => ({ w, fixed: false }));
  const stack = [[0, items.length]];
  let total = 0;
  let busy = false;
  let over = false;
  let pivotI = -1;
  let cmpI = -1;
  let lanes = null;
  const bag = couponBag(kupon);
  const row = el('div', { class: 'gb-baris' });
  const scale = el('div', { class: 'rh-meja' });
  const info = el('p', { class: 'reveal info' });
  const max = Math.max(...arr);
  const cur = () => { while (stack.length) { const [lo, hi] = stack.at(-1); if (hi - lo < 2) { for (let i = lo; i < hi; i++) items[i].fixed = true; stack.pop(); } else return [lo, hi]; } return null; };
  const group = (g) => items.slice(g[0], g[1]).map((x) => x.w);
  const mid3 = (g) => { const gr = group(g); return gr.length < 3 ? [0] : [0, Math.floor((gr.length - 1) / 2), gr.length - 1]; };
  function draw() {
    const g = over ? null : cur();
    const lit = g && pick === 'tengah3' && pivotI < 0 ? mid3(g).map((k) => g[0] + k) : [];
    fill(row, items.map((it, i) => {
      const inG = g && i >= g[0] && i < g[1];
      const cls = ['gb-karung', it.fixed ? 'tetap' : '', inG ? 'kelompok' : '', i === pivotI ? 'pivot' : '', i === cmpI ? 'banding' : '', lit.includes(i) ? 'calon' : '', it.side ? `ke-${it.side}` : ''].join(' ');
      return onTap(el('button', { class: cls, type: 'button', style: { '--h': `${30 + (it.w / max) * 70}%` }, 'data-i': i }, i === pivotI ? el('em', null, '🚩') : null, el('span', null, it.w)), () => tapSack(i));
    }));
    bag.set(total);
  }
  function drawScale() {
    if (!lanes) { fill(scale); return; }
    const sack = lanes.queue[lanes.k];
    const lane = (side, label) => onTap(el('button', { class: `rh-lajur ${side}`, type: 'button', 'data-lajur': side, disabled: !manual || sack == null },
      el('small', null, label), el('div', null, lanes[side].length ? lanes[side].map((w) => el('span', null, w)) : el('span', { class: 'kosong' }, 'kosong'))), () => send(side));
    fill(scale,
      lane('kiri', '◀ lebih ringan'),
      el('div', { class: 'rh-timbangan' }, el('span', { class: 'rh-piv' }, `🚩 ${lanes.pivot}`), el('b', null, sack == null ? '⚖' : manual ? '⚖ ?' : sack < lanes.pivot ? '<' : '>'), el('span', { class: 'rh-cur' }, sack == null ? '–' : `${sack}`)),
      lane('kanan', 'lebih berat ▶'));
  }
  function tapSack(i) {
    const g = cur();
    if (over || busy || auto || !g || i < g[0] || i >= g[1]) return;
    const gr = group(g);
    const want = pick === 'pertama' || gr.length < 3 ? 0 : pick === 'tengah3' ? median3Index(gr) : null;
    if (want !== null && i - g[0] !== want) {
      ctx.mistake(); shake(row);
      say(info, 'bad', pick === 'pertama' ? `Aturan hari ini: pivot adalah karung pertama di kelompok yang menyala (${gr[0]}).` : gr.length < 3 ? `Kelompok 2 karung memakai karung pertama (${gr[0]}).` : `Bandingkan tiga karung yang menyala: ${mid3(g).map((k) => gr[k]).join(', ')}. Pivot adalah yang beratnya di tengah: bukan yang paling ringan, bukan yang paling berat.`);
      return;
    }
    start(g, i - g[0]);
  }
  function start([lo, hi], p) {
    busy = true;
    const gr = items.slice(lo, hi).map((x) => x.w);
    pivotI = lo + p;
    lanes = { lo, hi, pivot: gr[p], queue: gr.filter((_, k) => k !== p), idx: gr.map((_, k) => k).filter((k) => k !== p), k: 0, kiri: [], kanan: [] };
    say(info, 'info', manual ? `Pivot ${gr[p]} kg. Setiap karung naik ke timbangan (1 kupon), lalu kirim ke lajur yang tepat.` : `Pivot ${gr[p]} kg. Regu menimbang ${gr.length - 1} karung lain, satu kupon per timbangan.`);
    weigh();
  }
  function weigh() {
    if (!host.isConnected) return;
    if (lanes.k >= lanes.queue.length) { finish(); return; }
    if (total >= kupon) { over = true; busy = false; cmpI = -1; draw(); drawScale(); if (onEmpty) onEmpty({ total, fixed: items.filter((x) => x.fixed).map((x) => x.w) }); return; }
    total++;
    cmpI = lanes.lo + lanes.idx[lanes.k];
    ctx.sound.tap();
    draw();
    drawScale();
    if (!manual) setTimeout(() => send(lanes.queue[lanes.k] < lanes.pivot ? 'kiri' : 'kanan', true), speed);
  }
  function send(side, machine = false) {
    if (!lanes || lanes.k >= lanes.queue.length || (!machine && !manual)) return;
    const w = lanes.queue[lanes.k];
    const want = w < lanes.pivot ? 'kiri' : 'kanan';
    if (side !== want) { ctx.mistake(); shake(scale); say(info, 'bad', `${w} kg ${w < lanes.pivot ? 'lebih ringan' : 'lebih berat'} dari pivot ${lanes.pivot} kg: lajur ${want}.`); return; }
    items[cmpI].side = side;
    lanes[side].push(w);
    lanes.k++;
    if (manual) say(info, 'info', `${w} ke lajur ${side}.`);
    if (manual) weigh(); else setTimeout(weigh, speed / 2);
  }
  function finish() {
    const { lo, hi, pivot, kiri, kanan } = lanes;
    const next = [...kiri, pivot, ...kanan].map((w) => ({ w, fixed: false }));
    items.splice(lo, hi - lo, ...next);
    const mid = lo + kiri.length;
    items[mid].fixed = true;
    stack.pop();
    stack.push([mid + 1, hi], [lo, mid]);
    pivotI = -1;
    cmpI = -1;
    lanes = null;
    busy = false;
    drawScale();
    draw();
    const g = cur();
    if (!g) { draw(); say(info, '', `Semua karung berjajar. Kupon terpakai: ${total}.`); if (onDone) onDone(total); return; }
    say(info, 'info', `${pivot} kg sudah di tempatnya. Lanjut ke kelompok ${group(g).join(', ')} (kelompok kiri dulu).`);
    if (auto) setTimeout(() => { const gr = group(g); start(g, pick === 'tengah3' ? median3Index(gr) : 0); }, speed * 2);
  }
  host.append(bag.node, row, scale, info);
  draw();
  drawScale();
  if (auto) setTimeout(() => { const g = cur(); start(g, pick === 'tengah3' ? median3Index(group(g)) : 0); }, 500);
  else say(info, 'info', pick === 'pertama' ? 'Ketuk karung pertama di kelompok yang menyala untuk menancapkan bendera pivot.' : pick === 'tengah3' ? 'Tiga karung menyala bergaris. Ketuk yang beratnya di tengah sebagai pivot (memilih pivot tidak memakai kupon).' : 'Ketuk karung mana saja di kelompok yang menyala sebagai pivot.');
  return { get total() { return total; } };
}

// Misi Timbang Paling Sedikit: weights are hidden; the scale only says which of two
// is heavier. The scale is sly: it answers so that as many orders as possible stay open.
function fewestRound(wrap, ctx, { n, done }) {
  const names = ['A', 'B', 'C', 'D'].slice(0, n);
  const perms = [];
  const permute = (a, k = 0) => { if (k === a.length) { perms.push([...a]); return; } for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; permute(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
  permute(names.map((_, i) => i));
  // perm[i] = rank of sack i (0 = lightest)
  let open = perms;
  const facts = [];
  let sel = [];
  let order = [];
  let finished = false;
  const lb = lowerBound(n);
  const kg = ctx.rand.shuffle(Array.from({ length: 51 }, (_, i) => 20 + i)).slice(0, n).sort((a, b) => a - b);
  const bag = couponBag(8);
  const sacks = el('div', { class: 'rh-rahasia' });
  const log = el('div', { class: 'rh-fakta' });
  const line = el('div', { class: 'rh-jajar' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk dua karung untuk menimbangnya. Setelah yakin, ketuk karung dari yang paling ringan untuk menjajarkannya.');
  let mode = 'timbang';
  const modes = el('div', { class: 'seg' });
  const draw = () => {
    bag.set(facts.length);
    fill(modes,
      onTap(el('button', { class: `seg-btn ${mode === 'timbang' ? 'on' : ''}`, type: 'button', 'data-mode': 'timbang' }, '⚖ Timbang'), () => { mode = 'timbang'; sel = []; draw(); }),
      onTap(el('button', { class: `seg-btn ${mode === 'jajar' ? 'on' : ''}`, type: 'button', 'data-mode': 'jajar' }, '📏 Jajarkan'), () => { mode = 'jajar'; sel = []; draw(); }));
    fill(sacks, names.map((nm, i) => onTap(el('button', { class: `rh-karung ${sel.includes(i) ? 'pilih' : ''} ${order.includes(i) ? 'dipakai' : ''}`, type: 'button', 'data-s': nm },
      el('b', null, nm), el('span', null, finished ? `${kg[open[0][i]]} kg` : '? kg')), () => tap(i))));
    fill(log, el('small', null, `Susunan yang masih mungkin: ${open.length} dari ${perms.length}`), facts.map(([a, b]) => el('span', null, `${names[a]} < ${names[b]}`)));
    fill(line, el('small', null, 'Jajaran:'), Array.from({ length: n }, (_, k) => el('span', { class: order[k] != null ? 'isi' : '' }, order[k] != null ? names[order[k]] : '·')),
      order.length && !finished ? onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Ulang'), () => { order = []; draw(); }) : null);
  };
  function tap(i) {
    if (finished) return;
    if (mode === 'timbang') {
      if (sel.includes(i)) { sel = sel.filter((x) => x !== i); draw(); return; }
      sel.push(i);
      if (sel.length < 2) { draw(); return; }
      const [a, b] = sel;
      sel = [];
      const yes = open.filter((p) => p[a] < p[b]);
      const no = open.filter((p) => p[a] > p[b]);
      const lighterA = yes.length > no.length || (yes.length === no.length && ctx.rand.int(0, 1) === 0);
      open = lighterA ? yes : no;
      const known = facts.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      facts.push(lighterA ? [a, b] : [b, a]);
      ctx.sound.tap();
      say(msg, known ? 'bad' : 'info', `${names[lighterA ? b : a]} lebih berat dari ${names[lighterA ? a : b]}.${known ? ' Timbangan ini sudah kamu ketahui: kupon terbuang.' : ''} ${open.length === 1 ? 'Kini hanya satu susunan yang mungkin. Jajarkan!' : `${open.length} susunan masih mungkin.`}`);
      draw();
      return;
    }
    if (order.includes(i)) return;
    order.push(i);
    ctx.sound.tap();
    draw();
    if (order.length < n) return;
    const fits = open.filter((p) => order.every((s, k) => p[s] === k));
    if (open.length > 1 || !fits.length) {
      ctx.mistake(); shake(line);
      const other = open.find((p) => !order.every((s, k) => p[s] === k));
      const alt = other ? names.map((_, s) => s).sort((x, y) => other[x] - other[y]).map((s) => names[s]).join(' < ') : '';
      say(msg, 'bad', fits.length ? `Belum pasti: timbanganmu juga cocok dengan ${alt}. Timbang lagi.` : `Jajaran ini bertentangan dengan hasil timbangan.`);
      order = [];
      setTimeout(draw, 1400);
      return;
    }
    finished = true;
    ctx.sound.good();
    draw();
    const k = facts.length;
    say(msg, '', `Benar: ${order.map((s) => `${names[s]} ${kg[open[0][s]]} kg`).join(' < ')}. ${k} timbangan; batas bawah ⌈log₂ ${n}!⌉ = ${lb}${k <= lb ? ', tidak bisa lebih hemat!' : '. Bisakah lebih hemat?'}`);
    done(k);
  }
  draw();
  wrap.append(el('div', { class: 'rh-atas' }, bag.node, modes), sacks, log, line, msg);
}

// Misi Bos Penyabot: arrange 10 sacks so the rival crew (median of three) burns as many coupons as possible.
function saboteurRound(wrap, ctx, { goal = 23, done }) {
  const pool = [...URUT];
  let seq = [];
  let tries = 0;
  const slots = el('div', { class: 'rh-susun' });
  const pick = el('div', { class: 'seg rh-pool' });
  const host = el('div', { class: 'gb-papan' });
  const msg = el('p', { class: 'reveal info' }, `Susun 10 karung untuk regu lawan. Mereka memakai nilai tengah dari tiga. Buat mereka memakai paling sedikit ${goal} kupon (susunan urut hanya 19).`);
  const draw = () => {
    fill(slots, Array.from({ length: 10 }, (_, k) => el('span', { class: seq[k] != null ? 'isi' : '' }, seq[k] != null ? String(seq[k]) : '·')));
    if (seq.length >= 10) { fill(pick); return; }
    fill(pick, pool.map((w) => onTap(el('button', { class: `seg-btn ${seq.includes(w) ? 'pc-pakai' : ''}`, type: 'button', disabled: seq.includes(w), 'data-kg': w }, `${w}`), () => add(w))),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Ulang'), () => { seq = []; host.replaceChildren(); draw(); }));
  };
  function add(w) {
    if (seq.includes(w) || seq.length >= 10) return;
    seq.push(w);
    ctx.sound.tap();
    draw();
    if (seq.length < 10) return;
    host.replaceChildren();
    say(msg, 'info', 'Regu lawan mulai bekerja dengan nilai tengah dari tiga…');
    regu(host, ctx, { arr: seq, pick: 'tengah3', auto: true, speed: 70, onDone(total) {
      tries++;
      if (total < goal) {
        ctx.mistake();
        say(msg, 'bad', `Regu lawan hanya memakai ${total} kupon. ${tries > 1 ? 'Petunjuk: pastikan karung yang terlihat (pertama, tengah, terakhir) selalu memuat karung paling ringan, supaya pivotnya karung terkecil kedua.' : 'Coba susunan lain.'}`);
        setTimeout(() => { seq = []; host.replaceChildren(); draw(); }, 2600);
        return;
      }
      say(msg, '', `Sabotase berhasil: ${total} kupon, ${total - 19} di atas kasus terbaik 19. ${total >= 25 ? 'Itu maksimum untuk nilai tengah dari tiga!' : 'Maksimumnya 25.'}`);
      done(total);
    } });
  }
  draw();
  wrap.append(slots, pick, host, msg);
}

const HEAD05 = {
  pilah: ['Timbang dan Pilah', 'Pivot karung pertama. Kirim setiap karung yang ditimbang ke lajur ringan atau berat.'],
  urut: ['Hari Sial: Kiriman Sudah Urut', 'Karung datang sudah urut. Regu tetap memakai pivot pertama. Cukupkah 30 kupon?'],
  tengah: ['Nilai Tengah dari Tiga', 'Lihat karung pertama, tengah, dan terakhir; pilih yang beratnya di tengah sebagai pivot.'],
  bebas: ['Pilih Pivot Sendiri', 'Pilih pivot yang membagi kelompok hampir sama besar.'],
  sedikit: ['Timbang Paling Sedikit', 'Berat karung tersembunyi. Timbangan hanya menunjukkan yang lebih berat. Jajarkan dengan timbangan sesedikit mungkin.'],
  boss: ['Penyabot', 'Kini kamu regu lawan: susun karung supaya nilai tengah dari tiga memakai banyak kupon.'],
};

export default {
  id: 'sma-05-gudang-beras',
  title: 'Quicksort di Gudang Beras',
  topic: 'Quicksort, pemilihan pivot, kasus terbaik dan terburuk, batas bawah pengurutan',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🌾',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid menjalankan quicksort sebagai regu gudang yang membayar satu kupon per penimbangan: memilah karung dengan pivot pertama, mengalami kasus terburuk pada kiriman urut, memakai nilai tengah dari tiga, memilih pivot sendiri menuju kasus terbaik T(n), membuktikan batas bawah log₂(n!) dengan timbangan tersembunyi, dan menyusun kiriman penyabot.',
  extraModes: [
    { id: 'gudang', icon: '🏭', label: 'Lantai Gudang', desc: 'Pilih susunan karung (acak, urut, terbalik, lembar kerja, atau ketik sendiri), lalu pilih pivot sendiri atau jalankan otomatis; total dibandingkan dengan kasus terbaik dan batas bawah', create: createFloor },
    { id: 'giliran', icon: '🔁', label: 'Pivot Bergiliran', desc: 'Setiap tim mengurutkan susunan karung yang sama dengan memilih pivot sendiri; perbandingan paling sedikit menang', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act gudang-beras rh-main' });
    root.append(wrap);
    const race = ctx.mode === 'race';
    const kg = (n) => ctx.rand.shuffle(Array.from({ length: 51 }, (_, i) => 20 + i)).slice(0, n);
    const free8 = kg(8);
    const mix7 = kg(7);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 3600) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (key, no) => wrap.append(misiHead(no, ...HEAD05[key], '🌾'));
      const floor = () => { const h = el('div', { class: 'gb-papan' }); wrap.append(h); return h; };
      const target = (arr, rule, goal) => {
        const h = floor();
        const go = () => { h.replaceChildren(); regu(h, ctx, { arr, pick: rule, onDone(t) { if (t > goal) { ctx.mistake(); say(h.querySelector('.reveal'), 'bad', `${t} kupon, lebih dari ${goal}. Ulangi: pilih pivot yang membagi kelompok hampir sama besar.`); setTimeout(go, 2600); return; } say(h.querySelector('.reveal'), '', `${t} kupon: kasus terbaik untuk ${arr.length} karung adalah T(${arr.length}) = ${best(arr.length)}.`); next(4600); } }); };
        go();
      };
      if (r === 0) { head('pilah', 1); regu(floor(), ctx, { arr: race ? KARUNG.slice(0, 7) : KARUNG, pick: 'pertama', manual: true, onDone: (t) => { if (!race) say(wrap.querySelector('.gb-papan .reveal'), '', `Semua berjajar dengan ${t} kupon (9 + 1 + 6 + 5 + 1 + 2 + 1). Kelompok k karung selalu butuh k − 1 timbangan.`); next(5000); } }); }
      else if (r === 1) { head('urut', 1); regu(floor(), ctx, { arr: URUT, pick: 'pertama', speed: 110, onEmpty: ({ fixed }) => { say(wrap.querySelector('.gb-papan .reveal'), '', `Kupon habis setelah 30 timbangan, baru ${fixed.join(', ')} di tempatnya. Lajur ringan selalu kosong: 9 + 8 + … + 1 = 45 kupon untuk selesai.`); next(6500); } }); }
      else if (r === 2) { head('tengah', 2); regu(floor(), ctx, { arr: URUT, pick: 'tengah3', speed: 130, onDone: (t) => { say(wrap.querySelector('.gb-papan .reveal'), '', `Kiriman urut kini hanya ${t} kupon, bukan 45. Pivotnya 42, 26, 33, 56, 47, 63.`); next(5000); } }); }
      else if (r === 3) { head('tengah', 2); regu(floor(), ctx, { arr: KARUNG, pick: 'tengah3', speed: 130, onDone: (t) => { say(wrap.querySelector('.gb-papan .reveal'), '', `${t} kupon, lebih hemat dari 25 dengan pivot pertama.`); next(5000); } }); }
      else if (r === 4) { head('sedikit', 4); fewestRound(wrap, ctx, { n: 3, done: () => next(5000) }); }
      else if (r === 5) { head('bebas', 3); target(free8, 'bebas', best(8)); }
      else if (r === 6) { head('sedikit', 4); fewestRound(wrap, ctx, { n: 4, done: () => next(5600) }); }
      else if (r === 7) { head('pilah', 1); regu(floor(), ctx, { arr: mix7, pick: 'pertama', manual: true, onDone: () => next(4200) }); }
      else if (r === 8) { head('bebas', 3); target(race ? free8 : KARUNG, 'bebas', best(race ? 8 : 10)); }
      else { head('boss', 'Bos'); saboteurRound(wrap, ctx, { done: () => next(5000) }); }
    }
    render();
  },
};

function arrangement(kind, ctx, n = 10) {
  if (kind === 'lembar') return [...KARUNG];
  const base = kind === 'acak' ? ctx.rand.shuffle(Array.from({ length: 70 }, (_, i) => 20 + i)).slice(0, n) : [...URUT];
  if (kind === 'urut') return [...base].sort((a, b) => a - b);
  if (kind === 'terbalik') return [...base].sort((a, b) => b - a);
  return base;
}

function createFloor(root, ctx) {
  const wrap = el('div', { class: 'act gudang-beras' });
  root.append(wrap);
  let arr = [...KARUNG];
  let mode = 'bebas';
  const host = el('div', { class: 'gb-papan' });
  const sum = el('p', { class: 'reveal info' });
  const input = el('input', { class: 'kh-masukan gb-ketik', placeholder: 'ketik berat, pisahkan dengan koma', 'aria-label': 'Berat karung' });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('change', () => { const v = [...new Set(input.value.split(/[ ,;]+/).map(Number).filter((x) => x > 0))].slice(0, 16); if (v.length >= 2) { arr = v; reset(); } });
  function reset() {
    host.replaceChildren();
    const n = arr.length;
    sum.textContent = `${n} karung · kasus terbaik ${best(n)} · batas bawah ⌈log₂ ${n}!⌉ = ${lowerBound(n)} · pivot pertama: ${quicksort(arr).total} · tengah dari tiga: ${quicksort(arr, median3Index).total} · terburuk ${worst(n)}`;
    const b = board(host, ctx, { arr, onDone: (t) => { ctx.sound.win(); } });
    if (mode !== 'bebas') b.start(mode);
  }
  wrap.append(el('p', { class: 'prompt' }, 'Lantai gudang: urutkan karung dengan quicksort.'),
    el('div', { class: 'seg' }, [['lembar', 'Lembar kerja'], ['acak', '🎲 Acak'], ['urut', 'Sudah urut'], ['terbalik', 'Urut terbalik']].map(([k, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { arr = arrangement(k, ctx); reset(); })), input),
    el('div', { class: 'seg' }, [['bebas', 'Pilih pivot sendiri'], ['pertama', '▶ Pivot pertama'], ['tengah3', '▶ Nilai tengah dari tiga']].map(([k, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => { mode = k; reset(); }))),
    host, sum);
  reset();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act gudang-beras' });
  root.append(wrap);
  let pts = [];
  let arr = [];
  function start(n) { pts = Array(n).fill(null); arr = arrangement('acak', ctx, 10); turn(0); }
  function turn(t) {
    if (t >= pts.length) return finishBoard(wrap, ctx, { title: `Semua tim selesai. Kasus terbaik untuk 10 karung: ${best(10)} perbandingan.`, pts, unit: 'perbandingan', low: true, again: () => pickTeams(wrap, 'Pivot Bergiliran', start) });
    const host = el('div', { class: 'gb-papan' });
    wrap.replaceChildren(scoreBar(pts.map((p) => (p == null ? '–' : p)), t), el('p', { class: 'prompt' }, `Giliran Tim ${t + 1}: urutkan dengan perbandingan sesedikit mungkin.`), host);
    board(host, ctx, { arr, onDone: (total) => { pts[t] = total; ctx.sound.good(); setTimeout(() => turn(t + 1), 2000); } });
  }
  pickTeams(wrap, 'Pivot Bergiliran', start);
}
