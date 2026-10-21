// Loker Tas Bernomor — SMP (13–15 tahun), fungsi hash. A name becomes a
// locker number: letter values A = 1 … Z = 26, summed, remainder after
// dividing by 11. Collisions move on to the next empty locker (wrapping to
// 0); a search stops at the name or at an empty locker.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const NAMES = ['ANI', 'BUDI', 'EKO', 'INDAH', 'ZAHRA', 'RAKA', 'MADE', 'GITA'];
const MORE = ['DEWI', 'TONO', 'RINA', 'JOKO', 'SITI', 'YUSUF', 'LINA', 'WAYAN', 'PUTU', 'OKTA', 'FAJAR', 'NUR', 'KETUT', 'HANA', 'UCOK', 'VINA'];
export const val = (ch) => ch.charCodeAt(0) - 64;
export const total = (name, weighted = false) => [...name].reduce((s, ch, i) => s + val(ch) * (weighted ? i + 1 : 1), 0);
export const hash = (name, n = 11, weighted = false) => total(name, weighted) % n;
// Linear probing: the lockers visited; the last is where the name lands.
export function insert(lockers, name, weighted = false) {
  const n = lockers.length;
  const path = [];
  for (let k = 0, i = hash(name, n, weighted); k < n; k++, i = (i + 1) % n) { path.push(i); if (lockers[i] === null) { lockers[i] = name; return path; } }
  return [...path, -1];
}
export function search(lockers, name, weighted = false) {
  const n = lockers.length;
  const path = [];
  for (let k = 0, i = hash(name, n, weighted); k < n; k++, i = (i + 1) % n) {
    path.push(i);
    if (lockers[i] === null) return { path, found: false };
    if (lockers[i] === name) return { path, found: true };
  }
  return { path, found: false };
}
export function filled(names, n = 11, weighted = false) {
  const lockers = Array(n).fill(null);
  names.forEach((x) => insert(lockers, x, weighted));
  return lockers;
}
// Way B: binary search on the names sorted alphabetically.
export function binaryOpens(names, name) {
  const s = [...names].sort();
  let lo = 0;
  let hi = s.length - 1;
  let opens = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    opens++;
    if (s[mid] === name) return opens;
    if (s[mid] < name) lo = mid + 1; else hi = mid - 1;
  }
  return opens;
}
const sumText = (name, weighted) => [...name].map((ch, i) => (weighted ? `${val(ch)}×${i + 1}` : val(ch))).join(' + ');

export default {
  id: 'smp-08-loker',
  title: 'Loker Tas Bernomor',
  topic: 'Fungsi hash, tabrakan, dan pencarian cepat',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '🗄️',
  source: null,
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid menghitung nomor loker dengan fungsi hash, menangani tabrakan dengan loker kosong berikutnya, mencari tas dengan sedikit bukaan, dan membandingkan hash dengan pencarian berurutan dan biner.',
  extraModes: [
    { id: 'mesin', icon: '🧮', label: 'Mesin Hash', desc: 'Ketik nama; lihat nilai huruf, jumlah, dan sisanya. Ganti banyak loker atau pakai bobot posisi', create: createMachine },
    { id: 'lorong', icon: '🚪', label: 'Lorong Loker', desc: 'Masukkan nama, lihat tabrakan, cari tas, dan bandingkan cara A, B, C', create: createHallway },
    { id: 'tim', icon: '🤝', label: 'Loker Tertutup', desc: 'Tim A menyimpan nama secara rahasia, tim B mencari dengan bukaan sesedikit mungkin', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act loker' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([label, correct]) => ({ label: String(label), correct })) });
      const full = filled(NAMES);
      if (r === 0) hashRound(wrap, ctx, { name: 'BUDI', done: next });
      else if (r === 1) hashRound(wrap, ctx, { name: ctx.rand.pick(NAMES.slice(2)), done: next });
      else if (r === 2) placeRound(wrap, ctx, { names: NAMES, done: next });
      else if (r === 3) ask('Siapa saja yang mengalami tabrakan?', [['INDAH, RAKA, dan GITA', true], ['BUDI dan INDAH'], ['EKO dan RAKA'], ['Tidak ada']], 1, hallView(full));
      else if (r === 4) searchRound(wrap, ctx, { lockers: full, name: ctx.rand.pick(['INDAH', 'RAKA', 'GITA']), done: next });
      else if (r === 5) searchRound(wrap, ctx, { lockers: full, name: 'HADI', done: next });
      else if (r === 6) ask('Mencari kedelapan nama butuh 1, 1, 1, 2, 1, 3, 1, 2 bukaan. Total dan rata-ratanya …', [['Total 12, rata-rata 1,5', true], ['Total 8, rata-rata 1'], ['Total 12, rata-rata 2'], ['Total 14, rata-rata 1,75']], 2);
      else if (r === 7) ask('Untuk sekolah dengan 1.000 loker, cara mana yang biasanya paling cepat?', [['C, fungsi hash: langsung ke loker yang tepat, asal loker tidak terlalu penuh', true], ['A, urutan datang: cukup buka dari loker 0'], ['B, pencarian biner: selalu 1 bukaan'], ['Semua cara sama cepat']]);
      else ask('INA dan NIA sama-sama berjumlah 24, jadi keduanya ke loker 2. Perbaikan apa yang membuat lokernya berbeda?', [['Beri bobot posisi: huruf ke-1 dikali 1, ke-2 dikali 2, …', true], ['Bagi dengan 10, bukan 11'], ['Abaikan huruf vokal'], ['Pakai huruf pertama saja']]);
    }
    render();
  },
};

function hallView(lockers, { open = new Set(), hi = -1, onTap: tap, closed, flash = -1 } = {}) {
  return el('div', { class: 'lorong' }, lockers.map((name, i) => {
    const shut = closed && !open.has(i);
    const n = el('button', { class: `loker-pintu ${name ? 'isi' : 'kosong'} ${open.has(i) ? 'buka' : ''} ${shut ? 'tutup' : ''} ${hi === i ? 'hi' : ''} ${flash === i ? 'kilat' : ''}`, type: 'button', 'data-i': i },
      el('small', null, i), el('b', null, shut ? '' : name || ''));
    return tap ? onTap(n, () => tap(i)) : n;
  }));
}

function keypad(onDigit, onBack) {
  return el('div', { class: 'keys keypad' }, [...'1234567890'].map((d) => onTap(el('button', { class: 'key', type: 'button' }, d), () => onDigit(d))),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}

// Type the sum and the remainder for one name.
function hashRound(wrap, ctx, { name, done }) {
  const vals = { sum: '', mod: '' };
  let focus = 'sum';
  let finished = false;
  const row = el('div', { class: 'hash-baris' });
  const msg = el('p', { class: 'reveal info' }, 'A = 1, B = 2, …, Z = 26. Jumlahkan, lalu cari sisa bagi 11.');
  function draw(wrong = []) {
    const box = (k) => onTap(el('button', { class: `ck-isi ${focus === k ? 'fokus' : ''} ${wrong.includes(k) ? 'salah' : ''}`, type: 'button', 'data-k': k }, vals[k] || '…'), () => { focus = k; draw(); });
    row.replaceChildren(el('div', { class: 'huruf-nilai' }, [...name].map((ch) => el('span', null, el('b', null, ch), el('small', null, val(ch))))),
      el('div', { class: 'hash-isi' }, 'Jumlah = ', box('sum'), ' · sisa bagi 11 = ', box('mod')));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Hitung nomor loker ${name}.`), row,
    el('div', { class: 'kode-baris' }, keypad((d) => { if (finished) return; vals[focus] = (vals[focus] + d).slice(0, 3); ctx.sound.tap(); draw(); }, () => { vals[focus] = vals[focus].slice(0, -1); draw(); }), button('Periksa', () => {
      if (finished) return;
      const wrong = [];
      if (Number(vals.sum) !== total(name) || vals.sum === '') wrong.push('sum');
      if (Number(vals.mod) !== hash(name) || vals.mod === '') wrong.push('mod');
      if (wrong.length) { draw(wrong); msg.className = 'reveal bad'; msg.textContent = wrong.includes('sum') ? 'Jumlahnya belum tepat.' : `${total(name)} : 11 = ${Math.floor(total(name) / 11)} sisa …?`; ctx.mistake(); return; }
      finished = true;
      msg.className = 'reveal';
      msg.textContent = `${name}: ${sumText(name)} = ${total(name)}; ${total(name)} : 11 = ${Math.floor(total(name) / 11)} sisa ${hash(name)}. Loker ${hash(name)}.`;
      done();
    }, 'primary')), msg);
}

// Names arrive in order; tap the locker where each one goes.
function placeRound(wrap, ctx, { names, done }) {
  const lockers = Array(11).fill(null);
  let k = 0;
  let finished = false;
  const stage = el('div');
  const info = el('p', { class: 'reveal info' });
  const collided = [];
  function draw(flash = -1) {
    const name = names[k];
    if (name) { info.className = 'reveal info'; info.textContent = `${name} datang: hash = ${total(name)} mod 11 = ${hash(name)}. Ketuk lokernya.`; }
    stage.replaceChildren(el('div', { class: 'antre' }, names.map((x, i) => el('span', { class: i < k ? 'lewat' : i === k ? 'aktif' : '' }, x))), hallView(lockers, { flash, onTap: (i) => tap(i) }));
  }
  function tap(i) {
    if (finished) return;
    const name = names[k];
    const want = insert([...lockers], name).at(-1);
    if (i !== want) {
      info.className = 'reveal bad';
      info.textContent = lockers[hash(name)] ? `Loker ${hash(name)} sudah terisi (tabrakan). Pakai loker kosong berikutnya; sesudah 10 kembali ke 0.` : `Loker ${name} adalah ${hash(name)}.`;
      shake(stage); ctx.mistake(); return;
    }
    if (want !== hash(name)) collided.push(name);
    lockers[i] = name;
    k++;
    ctx.sound.good();
    draw(i);
    if (k === names.length) {
      finished = true;
      info.className = 'reveal';
      info.textContent = `Semua tersimpan. Tabrakan: ${collided.join(', ')}.`;
      done();
    }
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Isi loker sesuai urutan datang. Bila terisi, pakai loker kosong berikutnya.'), info, stage);
}

// Open lockers one by one, following the rule, until found or empty.
function searchRound(wrap, ctx, { lockers, name, done, closed = false, free = false }) {
  const res = search(lockers, name);
  const open = new Set();
  let step = 0;
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, free ? `Hitung sendiri loker ${name} (A = 1 … Z = 26, sisa bagi ${lockers.length}), lalu buka.` : `Hash ${name} = ${total(name)} mod ${lockers.length} = ${hash(name, lockers.length)}. Buka loker mulai dari situ.`);
  function draw() { stage.replaceChildren(hallView(lockers, { open, closed: true, onTap: (i) => tap(i) })); }
  function tap(i) {
    if (finished || open.has(i)) return;
    if (!free && i !== res.path[step]) { msg.className = 'reveal bad'; msg.textContent = step ? 'Buka loker berikutnya, berurutan.' : `Mulai dari loker ${hash(name, lockers.length)}.`; ctx.mistake(); shake(stage); return; }
    open.add(i);
    step++;
    ctx.sound.tap();
    draw();
    const hit = lockers[i] === name;
    const empty = lockers[i] === null;
    if (free && !hit && step < lockers.length) { msg.className = 'reveal info'; msg.textContent = `Bukaan ke-${step}: ${lockers[i] || 'kosong'}.`; return; }
    if (!hit && !empty) { msg.className = 'reveal info'; msg.textContent = `Loker ${i} berisi ${lockers[i]}. Buka loker berikutnya.`; return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = hit ? `Ketemu ${name} di loker ${i}: ${step} bukaan.` : `Loker ${i} kosong, jadi ${name} tidak menyimpan tas: ${step} bukaan.${step > 3 ? ' Loker terisi berderet (penumpukan) membuat pencarian panjang.' : ''}`;
    done(step);
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `Cari tas ${name}.`), msg, stage);
  if (closed) stage.classList.add('rahasia');
}

function letterKeys(onKey, onBack) {
  return el('div', { class: 'keys' }, [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((ch) => onTap(el('button', { class: 'key', type: 'button' }, ch), () => onKey(ch))),
    onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), onBack));
}

function createMachine(root, ctx) {
  const wrap = el('div', { class: 'act loker' });
  root.append(wrap);
  let name = 'INA';
  let n = 11;
  let weighted = false;
  function draw() {
    const t = name ? total(name, weighted) : 0;
    wrap.replaceChildren(el('p', { class: 'prompt' }, 'Mesin hash: ketik nama.'),
      el('div', { class: 'huruf-nilai' }, [...(name || ' ')].map((ch, i) => el('span', null, el('b', null, ch), el('small', null, ch.trim() ? (weighted ? `${val(ch)}×${i + 1}` : val(ch)) : '')))),
      el('p', { class: 'reveal' }, name ? `Jumlah ${t} → ${t} : ${n} = ${Math.floor(t / n)} sisa ${t % n} → loker ${t % n}` : '…'),
      el('div', { class: 'kode-baris' }, ...[11, 13, 20].map((v) => button(`${v} loker`, () => { n = v; draw(); }, n === v ? 'primary small' : 'small')),
        button(weighted ? 'Bobot posisi: aktif' : 'Bobot posisi: mati', () => { weighted = !weighted; draw(); }, weighted ? 'primary small' : 'small'),
        button('INA', () => { name = 'INA'; draw(); }, 'small'), button('NIA', () => { name = 'NIA'; draw(); }, 'small')),
      letterKeys((ch) => { if (name.length < 10) { name += ch; ctx.sound.tap(); draw(); } }, () => { name = name.slice(0, -1); draw(); }));
  }
  draw();
}

function createHallway(root, ctx) {
  const wrap = el('div', { class: 'act loker' });
  root.append(wrap);
  let n = 11;
  let lockers = filled(NAMES, n);
  let typed = '';
  let flash = -1;
  let note = 'Ketik nama lalu Simpan, atau Cari untuk membuka loker.';
  let busy = false;
  function animate(path, after) {
    busy = true;
    let k = 0;
    const step = () => { flash = path[k]; draw(); ctx.sound.tap(); if (++k < path.length) setTimeout(step, 320); else { busy = false; after(); } };
    step();
  }
  function store() {
    if (busy || !typed) return;
    if (lockers.includes(typed)) { note = `${typed} sudah punya loker.`; draw(); return; }
    const copy = [...lockers];
    const path = insert(copy, typed);
    const name = typed;
    typed = '';
    animate(path.filter((x) => x >= 0), () => {
      lockers = copy;
      note = path.at(-1) < 0 ? `Semua loker penuh: ${name} tidak mendapat tempat.` : path.length > 1 ? `Tabrakan! ${name} pindah ${path.length - 1} kali ke loker ${path.at(-1)}.` : `${name} langsung ke loker ${path[0]}.`;
      draw();
    });
  }
  function find() {
    if (busy || !typed) return;
    const name = typed;
    const res = search(lockers, name);
    const names = lockers.filter(Boolean);
    const order = names.indexOf(name);
    animate(res.path, () => {
      const a = order >= 0 ? order + 1 : names.length;
      note = `${res.found ? `Ketemu di loker ${res.path.at(-1)}` : 'Tidak ada'}: hash ${res.path.length} bukaan · cara A (berurutan) ${a} · cara B (biner) ${binaryOpens(names, name)}.`;
      draw();
    });
  }
  function draw() {
    wrap.replaceChildren(el('div', { class: 'kode-baris' }, ...[11, 13, 20].map((v) => button(`${v} loker`, () => { n = v; lockers = filled(NAMES, n); flash = -1; draw(); }, n === v ? 'primary small' : 'small')), button('Kosongkan', () => { lockers = Array(n).fill(null); draw(); }, 'small'), button('Isi 8 nama', () => { lockers = filled(NAMES, n); draw(); }, 'small')),
      hallView(lockers, { flash }),
      el('p', { class: 'reveal info' }, note),
      el('div', { class: 'kode-baris' }, el('b', { class: 'ketik-nama' }, typed ? `${typed} → ${hash(typed, n)}` : 'nama…'), button('Simpan', store, 'primary small'), button('Cari & bandingkan', find, 'primary small'),
        button('Nama acak', () => { typed = MORE[Math.floor(Math.random() * MORE.length)]; draw(); }, 'small')),
      letterKeys((ch) => { if (typed.length < 10) { typed += ch; draw(); } }, () => { typed = typed.slice(0, -1); draw(); }));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act loker' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const score = [0, 0];
  let hider = 0;
  function hide() {
    const picked = new Set();
    const pool = rand.shuffle([...NAMES, ...MORE]).slice(0, 12);
    const draw = () => wrap.replaceChildren(el('p', { class: 'prompt' }, `Tim ${hider + 1}: pilih 5–8 nama untuk disimpan secara rahasia. Tim ${2 - hider} jangan melihat!`),
      el('div', { class: 'kode-baris' }, ...pool.map((x) => button(x, () => { picked.has(x) ? picked.delete(x) : picked.size < 8 && picked.add(x); draw(); }, picked.has(x) ? 'primary small' : 'small'))),
      el('p', { class: 'small-note' }, `Skor (bukaan, makin sedikit makin baik): Tim 1 ${score[0]} · Tim 2 ${score[1]}`),
      button('Kunci loker ➜', () => { if (picked.size < 5) return; seek([...picked]); }, 'primary'));
    draw();
  }
  function seek(names) {
    const seeker = 1 - hider;
    const lockers = filled(names);
    const target = rand.pick(names);
    wrap.replaceChildren();
    searchRound(wrap, ctx, {
      lockers, name: target, free: true,
      done(opens) {
        score[seeker] += opens;
        ctx.sound.win();
        wrap.append(el('p', { class: 'reveal' }, `Tim ${seeker + 1}: ${opens} bukaan. Dengan hash cukup ${search(lockers, target).path.length}.`), button('Tukar peran ➜', () => { hider = seeker; hide(); }, 'primary'));
      },
    });
    wrap.querySelector('.prompt').textContent = `Tim ${seeker + 1}: cari tas ${target}. Loker tertutup; buka sesedikit mungkin.`;
  }
  hide();
}
