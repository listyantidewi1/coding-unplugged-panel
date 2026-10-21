// Mesin Pesan Kantin — SD Lanjut (10–12 tahun), rancangan antarmuka. Find
// what is wrong with a hurried touch screen, test a better one as a buyer,
// look at it through other people's eyes, and build and test your own.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';

export const MENU = {
  nasi: { icon: '🍛', name: 'Nasi goreng', short: 'NSG', price: 10000, sambal: true },
  mie: { icon: '🍜', name: 'Mi ayam', short: 'MIE', price: 8000, sambal: true },
  soto: { icon: '🍲', name: 'Soto', short: 'SOTO', price: 12000 },
  esteh: { icon: '🥤', name: 'Es teh', short: 'ES T', price: 3000 },
  jus: { icon: '🍊', name: 'Jus jeruk', short: 'JRK', price: 4000 },
};
const rupiah = (n) => `Rp${n.toLocaleString('id-ID')}`;
const TASK = 'Pesan nasi goreng tanpa sambal dan es teh.';
// The test task: exactly nasi goreng and es teh, without sambal.
export const taskDone = (order, sambal) => order.size === 2 && order.has('nasi') && order.has('esteh') && sambal === false;

const T = (text, extra = {}) => ({ type: 'judul', text, size: 'besar', color: 'gelap', ...extra });
const M = (item, extra = {}) => ({ type: 'menu', item, size: 'besar', pic: true, full: true, ...extra });
const B = (label, to, color, extra = {}) => ({ type: 'tombol', label, to, color, size: 'besar', ...extra });

export const V1 = [{
  bg: 'gelap',
  items: [T('SILAKAN PILIH MENU', { size: 'kecil', color: 'abu' }), ...Object.keys(MENU).map((k) => M(k, { size: 'kecil', pic: false, full: false })),
    B('OK', 'pesan', 'hijau', { size: 'kecil' }), B('X', 'batal', 'merah', { size: 'kecil' })],
}];
export const V2 = [
  { bg: 'putih', items: [T('Pilih makanan dan minuman'), ...Object.keys(MENU).map((k) => M(k)), B('✗ Batal', 'batal', 'merah'), B('Lanjut ➜', 2, 'biru')] },
  { bg: 'putih', items: [T('Pakai sambal?'), { type: 'sambal', with: true, size: 'besar' }, { type: 'sambal', with: false, size: 'besar' }, B('⬅ Kembali', 1, 'abu'), B('Lanjut ➜', 3, 'biru')] },
  { bg: 'putih', items: [T('Periksa pesananmu'), { type: 'ringkasan', size: 'besar' }, B('⬅ Kembali', 2, 'abu'), B('✗ Batal', 'batal', 'merah'), B('✓ Pesan', 'pesan', 'hijau')] },
];
const clone = (d) => JSON.parse(JSON.stringify(d));

// One screen. `state` holds the order while testing; `onItem` gets taps
// in the other modes (spot the problem, edit).
function renderScreen(screen, { state, live = false, onAction, onItem, selected, lens = '' } = {}) {
  const node = el('div', { class: `layar bg-${screen.bg} ${lens ? `lensa-${lens}` : ''}` });
  const txt = (t) => el('span', { class: 'teks' }, t);
  screen.items.forEach((it, i) => {
    let n;
    const sel = selected === i ? 'sel' : '';
    if (it.type === 'judul') n = el('div', { class: `l-judul s-${it.size} c-${it.color} ${sel}` }, txt(it.text));
    else if (it.type === 'menu') {
      const m = MENU[it.item];
      n = el('button', { class: `l-menu s-${it.size} ${sel} ${state?.order.has(it.item) ? 'dipilih' : ''}`, type: 'button' },
        it.pic ? el('span', { class: 'gambar' }, m.icon) : null, txt(it.full ? m.name : m.short), el('small', { class: 'teks harga' }, it.full ? rupiah(m.price) : `${m.price / 1000}K`));
    } else if (it.type === 'sambal') {
      n = el('button', { class: `l-menu s-${it.size} ${sel} ${state && state.sambal === it.with ? 'dipilih' : ''}`, type: 'button' },
        el('span', { class: 'gambar' }, it.with ? '🌶️' : '🚫🌶️'), txt(it.with ? 'Dengan sambal' : 'Tanpa sambal'));
    } else if (it.type === 'tombol') {
      n = el('button', { class: `l-tombol s-${it.size} c-${it.color} ${sel}`, type: 'button' }, it.label ? txt(it.label) : el('span', { class: 'teks' }, ' '));
    } else if (it.type === 'ringkasan') {
      const lines = state ? [...state.order].map((k) => `${MENU[k].name}${MENU[k].sambal && state.sambal != null ? (state.sambal ? ' (sambal)' : ' (tanpa sambal)') : ''} · ${rupiah(MENU[k].price)}`) : ['Nasi goreng (tanpa sambal) · Rp10.000', 'Es teh · Rp3.000'];
      const total = state ? [...state.order].reduce((s, k) => s + MENU[k].price, 0) : 13000;
      n = el('div', { class: `l-ringkasan s-${it.size} ${sel}` }, lines.length ? lines.map((l) => el('div', null, txt(l))) : el('div', null, txt('Belum ada pesanan')), el('b', null, txt(`Total ${rupiah(total)}`)));
    }
    n.dataset.i = i;
    if (live) {
      if (it.type === 'menu') onTap(n, () => { state.order.has(it.item) ? state.order.delete(it.item) : state.order.add(it.item); onAction('ubah'); });
      else if (it.type === 'sambal') onTap(n, () => { state.sambal = it.with; onAction('ubah'); });
      else if (it.type === 'tombol') onTap(n, () => onAction(it.to));
    } else if (onItem) onTap(n, (e) => { e.stopPropagation(); onItem(i, it, e.target.closest('.harga') ? 'harga' : 'isi'); });
    node.append(n);
  });
  ensureLensFilter();
  return node;
}
function ensureLensFilter() {
  if (document.getElementById('lensa-mh')) return;
  document.body.append(el('div', { style: { position: 'absolute', width: 0, height: 0, overflow: 'hidden' }, html: '<svg><filter id="lensa-mh"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/></filter></svg>' }));
}

// A usability test: the design is live, every tap is logged and timed.
function runTest(host, design, ctx, { onDone, prompt = `Tugas: ${TASK}` }) {
  const state = { order: new Set(), sambal: null };
  let at = 0;
  let taps = 0;
  const misses = [];
  let t0 = null;
  const frame = el('div', { class: 'layar-bingkai' });
  const info = el('p', { class: 'reveal info' }, prompt);
  function show() {
    const scr = renderScreen(design[at], { state, live: true, onAction });
    scr.addEventListener('pointerdown', (e) => {
      t0 ??= performance.now();
      taps++;
      if (!e.target.closest('button')) {
        const r = scr.getBoundingClientRect();
        misses.push([((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100, at]);
      }
    }, true);
    frame.replaceChildren(scr, el('small', { class: 'layar-no' }, `Layar ${at + 1}`));
  }
  function onAction(to) {
    if (to === 'ubah') { ctx.sound.tap(); show(); return; }
    if (to === 'batal') { state.order.clear(); state.sambal = null; at = 0; show(); return; }
    if (to === 'pesan') {
      const ms = t0 ? performance.now() - t0 : 0;
      const ok = taskDone(state.order, state.sambal);
      frame.replaceChildren(el('div', { class: `layar bg-${design[0].bg} selesai` }, el('div', { class: 'l-judul s-besar' }, 'TERIMA KASIH'),
        ...misses.filter((m) => m[2] === at).map(([x, y]) => el('i', { class: 'meleset', style: { left: `${x}%`, top: `${y}%` } }))));
      onDone({ ok, order: [...state.order], sambal: state.sambal, taps, misses: misses.length, ms });
      return;
    }
    if (design[to - 1]) { at = to - 1; ctx.sound.tap(); show(); }
  }
  show();
  host.append(info, frame);
  return { restart() { state.order.clear(); state.sambal = null; at = 0; taps = 0; misses.length = 0; t0 = null; show(); } };
}
const orderText = (r) => (r.order.length ? r.order.map((k) => MENU[k].name + (MENU[k].sambal ? (r.sambal === false ? ' tanpa sambal' : r.sambal ? ' dengan sambal' : ' (sambal belum dipilih)') : '')).join(' + ') : 'kosong');

// Round 1: spot the problems on Versi 1.
const PROBLEMS = {
  kontras: 'Tulisan kecil abu-abu di latar biru tua, sulit dibaca',
  singkatan: 'Singkatan menu tidak jelas (NSG, ES T, JRK)',
  harga: 'Harga ditulis singkat "10K", bukan Rp10.000',
  gambar: 'Tidak ada gambar makanan',
  warna: 'OK dan X hanya dibedakan warna, arti X tidak jelas',
  ringkasan: 'Setelah OK langsung "TERIMA KASIH": pesanan dan total tidak ditampilkan',
  sambal: 'Tidak ada pilihan dengan atau tanpa sambal',
};
function spotRound(wrap, ctx, next) {
  const found = new Set();
  const list = el('ol', { class: 'open-log masalah' });
  const count = el('span', { class: 'open-count' });
  const frame = el('div', { class: 'layar-bingkai' });
  const add = (k) => {
    if (found.has(k)) return;
    found.add(k);
    ctx.sound.good();
    list.append(el('li', null, PROBLEMS[k]));
    count.textContent = `Masalah: ${found.size} dari 5`;
    if (found.size === 5) next();
  };
  function show() {
    const scr = renderScreen(V1[0], {
      onItem(i, it, part) {
        if (it.type === 'judul') add('kontras');
        else if (it.type === 'menu') add(part === 'harga' ? 'harga' : 'singkatan');
        else if (it.label === 'OK') {
          add('warna');
          frame.replaceChildren(el('div', { class: 'layar bg-gelap' }, el('div', { class: 'l-judul s-kecil c-abu' }, 'TERIMA KASIH')));
          setTimeout(() => { add('ringkasan'); show(); }, 1200);
        } else add('warna');
      },
    });
    scr.addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-i]')) add('gambar'); });
    frame.replaceChildren(scr);
  }
  show();
  count.textContent = 'Masalah: 0 dari 5';
  wrap.append(el('p', { class: 'prompt' }, 'Layar Versi 1 dibuat terburu-buru. Ketuk bagian layar yang bermasalah sampai kamu menemukan 5 masalah.'),
    el('div', { class: 'kantin-layout' }, frame, el('div', { class: 'kantin-side' }, count, list, button('Coba tekan OK', () => frame.querySelector('.l-tombol')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })), 'small ghost'))));
}

const PERSONAS = [
  { who: 'Dinda, kelas 1, belum lancar membaca', lens: 'baca', opts: [['Gambar besar untuk setiap menu dan tombol suara yang membacakan menu', true], ['Tulisan dibuat lebih banyak dan lebih panjang'], ['Warna latar dibuat lebih gelap']] },
  { who: 'Pak Darto, penjaga sekolah, sulit membaca tulisan kecil', lens: 'buram', opts: [['Tulisan besar dan kontras, hitam di atas putih, ada tombol perbesar tulisan', true], ['Pakai singkatan supaya tulisannya pendek'], ['Tulisan abu-abu supaya tampak lembut']] },
  { who: 'Bima, memakai kursi roda', lens: 'tinggi', opts: [['Layar dipasang lebih rendah atau bisa dimiringkan, tombol penting di bagian bawah', true], ['Tombol penting diletakkan di bagian paling atas'], ['Layar dipasang lebih tinggi agar terlihat dari jauh']] },
  { who: 'Lia, sulit membedakan merah dan hijau', lens: 'mh', opts: [['Tombol diberi tulisan dan bentuk, misalnya ✓ Pesan dan ✗ Batal', true], ['Hijau pada tombol OK dibuat lebih terang'], ['Tulisan di tombol dihapus supaya rapi']] },
];

// Checklist items and how to break each one in Versi 2.
export const CHECKS = {
  besar: { text: 'Ada gambar dan tulisan yang besar', screen: 0, break: (d) => d[0].items.forEach((it) => { it.size = 'kecil'; if (it.type === 'menu') it.pic = false; }) },
  arti: { text: 'Arti setiap tombol jelas', screen: 2, break: (d) => d.forEach((s) => s.items.forEach((it) => { if (it.type === 'tombol') it.label = { pesan: 'OK', batal: 'X' }[it.to] || '>>'; })) },
  kembali: { text: 'Ada tombol untuk kembali dan membatalkan', screen: 2, break: (d) => d.forEach((s) => { s.items = s.items.filter((it) => !(it.type === 'tombol' && (it.to === 'batal' || it.label.includes('Kembali')))); }) },
  ringkasan: { text: 'Layar menunjukkan apa yang sudah dipilih', screen: 2, break: (d) => { d[2].items = d[2].items.filter((it) => it.type !== 'ringkasan'); d[2].items[0].text = 'Selesai?'; } },
  warna: { text: 'Tombol tidak dibedakan hanya dengan warna', screen: 2, break: (d) => d[2].items.forEach((it) => { if (it.type === 'tombol') it.label = ''; }) },
};

export default {
  id: 'sdl-15-mesin-kantin',
  title: 'Mesin Pesan Kantin',
  topic: 'Rancangan antarmuka',
  jenjang: 'sd-lanjut',
  age: '10–12 tahun',
  icon: '🍛',
  source: { name: 'CS Unplugged: Human Computer Interaction', url: 'https://www.csunplugged.org/en/topics/human-computer-interaction/' },
  rounds: 9,
  maxPlayers: 4,
  goal: 'Murid menemukan masalah pada layar yang buruk, menguji layar yang lebih baik sebagai pembeli, memikirkan pengguna yang beragam, dan memeriksa rancangan dengan daftar periksa.',
  extraModes: [
    { id: 'bengkel', icon: '🛠️', label: 'Bengkel Layar', desc: 'Susun sampai tiga layar, hubungkan tombolnya, lalu uji dan lihat lewat Kacamata Pengguna', create: (root, ctx) => workshop(root, ctx, {}) },
    { id: 'penguji', icon: '🧪', label: 'Perancang dan Penguji', desc: 'Satu tim merancang, tim lain menguji tanpa melihat prosesnya; lalu bertukar peran', create: (root, ctx) => workshop(root, ctx, { handoff: true }) },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act kantin' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, subject) => choice(wrap, { prompt, subject, ctx, onRight: next, columns: 1, options: ctx.rand.shuffle(opts).map(([label, correct]) => ({ label, correct })) });
      if (r === 0) spotRound(wrap, ctx, next);
      else if (r === 1) ask(`Bisakah pembeli "${TASK.toLowerCase().replace('.', '')}" dengan Layar Versi 1?`, [
        ['Tidak: tidak ada pilihan sambal dan tidak jelas cara memilih dua menu', true], ['Bisa, cukup tekan NSG lalu OK'], ['Bisa, tekan X untuk tanpa sambal'],
      ], renderScreen(V1[0]));
      else if (r === 2) {
        const host = el('div', { class: 'kantin-uji' });
        const res = el('p', { class: 'reveal' });
        let test;
        const retry = button('Coba lagi', () => { res.textContent = ''; retry.hidden = true; test.restart(); }, 'small');
        retry.hidden = true;
        test = runTest(host, V2, ctx, {
          prompt: `Kamu pembeli. ${TASK}`,
          onDone(x) {
            res.className = x.ok ? 'reveal' : 'reveal bad';
            res.textContent = x.ok ? `Pesanan benar! ${x.taps} sentuhan, ${x.misses} meleset, ${Math.round(x.ms / 1000)} detik.` : `Pesananmu: ${orderText(x)}. Belum sesuai tugas.`;
            if (x.ok) next(); else { ctx.mistake(); retry.hidden = false; }
          },
        });
        wrap.append(el('p', { class: 'prompt' }, 'Layar Versi 2: uji sebagai pembeli.'), el('div', { class: 'kantin-layout' }, host, el('div', { class: 'kantin-side' }, res, retry)));
      } else if (r <= 6) {
        const p = PERSONAS[r - 3];
        const sub = el('div', { class: `persona-view ${p.lens === 'tinggi' ? 'tinggi' : ''}` }, renderScreen(V1[0], { lens: p.lens === 'tinggi' ? '' : p.lens }), p.lens === 'tinggi' ? el('span', { class: 'kursi' }, '🧑‍🦽') : null);
        ask(`Apa yang kamu ubah agar mesin mudah dipakai ${p.who}?`, p.opts, sub);
      } else {
        const keys = Object.keys(CHECKS);
        const k = keys[(r - 7 + ctx.rand.int(0, keys.length - 1)) % keys.length];
        const d = clone(V2);
        CHECKS[k].break(d);
        const opts = [k, ...ctx.rand.shuffle(keys.filter((x) => x !== k)).slice(0, 3)];
        ask('Rancangan ini melanggar daftar periksa yang mana?', opts.map((x) => [CHECKS[x].text, x === k]), renderScreen(d[CHECKS[k].screen], {}));
      }
    }
    render();
  },
};

// ---- Bengkel Layar ----
const SIZES = ['kecil', 'sedang', 'besar'];
const COLORS = ['hijau', 'merah', 'biru', 'abu', 'gelap'];
const BGS = ['putih', 'kuning', 'gelap'];
const TITLES = ['Pilih makanan dan minuman', 'Pakai sambal?', 'Periksa pesananmu', 'SILAKAN PILIH MENU', 'Selamat datang'];
const LABELS = ['Lanjut ➜', '⬅ Kembali', '✗ Batal', '✓ Pesan', 'OK', 'X', ''];
const TARGETS = [1, 2, 3, 'pesan', 'batal'];
const targetName = (t) => (t === 'pesan' ? 'selesai memesan' : t === 'batal' ? 'batalkan' : `ke Layar ${t}`);
const cycle = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
const LENSES = [['', 'Normal'], ['mh', 'Sulit membedakan merah-hijau'], ['buram', 'Penglihatan buram'], ['baca', 'Belum bisa membaca']];

function workshop(root, ctx, { handoff = false }) {
  const wrap = el('div', { class: 'act kantin' });
  root.append(wrap);
  let design = clone(V1);
  let at = 0;
  let sel = null;
  let lens = '';
  let team = 1;
  const results = [];
  function edit() {
    const scr = design[at];
    const preview = renderScreen(scr, { selected: sel, lens, onItem(i) { sel = sel === i ? null : i; edit(); } });
    const tabs = el('div', { class: 'row wrap' },
      design.map((_, i) => button(`Layar ${i + 1}`, () => { at = i; sel = null; edit(); }, i === at ? 'small on' : 'small')),
      design.length < 3 ? button('+ Layar', () => { design.push({ bg: 'putih', items: [] }); at = design.length - 1; sel = null; edit(); }, 'small ghost') : null,
      design.length > 1 ? button('Hapus layar', () => { design.splice(at, 1); at = 0; sel = null; edit(); }, 'small ghost') : null);
    const addItem = (it) => { scr.items.push(it); sel = scr.items.length - 1; ctx.sound.tap(); edit(); };
    const palette = el('div', { class: 'row wrap' },
      button('+ Judul', () => addItem(T('Pilih makanan dan minuman', { size: 'sedang' })), 'small'),
      button('+ Menu', () => addItem(M('nasi', { size: 'sedang' })), 'small'),
      button('+ Sambal', () => addItem({ type: 'sambal', with: false, size: 'sedang' }), 'small'),
      button('+ Tombol', () => addItem(B('Lanjut ➜', Math.min(at + 2, 3), 'biru', { size: 'sedang' })), 'small'),
      button('+ Ringkasan', () => addItem({ type: 'ringkasan', size: 'sedang' }), 'small'),
      button(`Latar: ${scr.bg}`, () => { scr.bg = cycle(BGS, scr.bg); edit(); }, 'small ghost'));
    const props = el('div', { class: 'row wrap props' });
    const it = scr.items[sel];
    if (it) {
      const p = (lab, fn) => button(lab, () => { fn(); edit(); }, 'small');
      props.append(p(`Ukuran: ${it.size}`, () => { it.size = cycle(SIZES, it.size); }));
      if (it.type === 'judul') props.append(p(`Tulisan: ${it.text}`, () => { it.text = cycle(TITLES, it.text); }), p(`Warna: ${it.color}`, () => { it.color = cycle(COLORS, it.color); }));
      if (it.type === 'menu') props.append(p(`Menu: ${MENU[it.item].name}`, () => { it.item = cycle(Object.keys(MENU), it.item); }), p(it.pic ? 'Gambar: ada' : 'Gambar: tidak', () => { it.pic = !it.pic; }), p(it.full ? 'Nama lengkap' : 'Singkatan', () => { it.full = !it.full; }));
      if (it.type === 'sambal') props.append(p(it.with ? 'Dengan sambal' : 'Tanpa sambal', () => { it.with = !it.with; }));
      if (it.type === 'tombol') props.append(p(`Tulisan: ${it.label || '(kosong)'}`, () => { it.label = cycle(LABELS, it.label); }), p(`Warna: ${it.color}`, () => { it.color = cycle(COLORS, it.color); }), p(`Tujuan: ${targetName(it.to)}`, () => { it.to = cycle(TARGETS, it.to); }));
      props.append(p('⬆', () => { if (sel > 0) { [scr.items[sel - 1], scr.items[sel]] = [scr.items[sel], scr.items[sel - 1]]; sel--; } }),
        p('⬇', () => { if (sel < scr.items.length - 1) { [scr.items[sel + 1], scr.items[sel]] = [scr.items[sel], scr.items[sel + 1]]; sel++; } }),
        p('🗑️ Hapus', () => { scr.items.splice(sel, 1); sel = null; }));
    } else props.append(el('small', { class: 'small-note' }, 'Ketuk bagian layar untuk mengubahnya.'));
    const top = el('div', { class: 'row wrap' },
      handoff ? el('b', { class: 'tim-label' }, `Tim ${team} merancang`) : null,
      button('Mulai dari Versi 1', () => { design = clone(V1); at = 0; sel = null; edit(); }, 'small ghost'),
      button('Contoh Versi 2', () => { design = clone(V2); at = 0; sel = null; edit(); }, 'small ghost'),
      button('Kosong', () => { design = [{ bg: 'putih', items: [] }]; at = 0; sel = null; edit(); }, 'small ghost'),
      el('span', { class: 'small-note' }, '👓'),
      ...LENSES.map(([k, l]) => button(l, () => { lens = k; edit(); }, lens === k ? 'small on' : 'small')));
    const testBtn = button(handoff ? `Serahkan ke Tim ${3 - team} ➜` : '▶ Mode Uji', handoff ? cover : test, 'primary');
    wrap.replaceChildren(top, el('div', { class: 'kantin-layout' }, el('div', { class: 'layar-bingkai' }, preview), el('div', { class: 'kantin-side' }, tabs, palette, props, testBtn, results.length ? resultsTable() : null)));
  }
  function cover() {
    wrap.replaceChildren(el('div', { class: 'tutup-layar' }, el('p', { class: 'prompt' }, `Tim ${3 - team}, giliranmu menguji.`), el('p', { class: 'reveal info' }, `Tugas: ${TASK} Tim ${team} tidak boleh memberi petunjuk!`), button('Mulai uji', test, 'primary')));
  }
  function test() {
    const host = el('div', { class: 'kantin-uji' });
    const res = el('div', { class: 'kantin-side' });
    runTest(host, design, ctx, {
      onDone(x) {
        x.ok ? ctx.sound.win() : ctx.sound.bad();
        results.push({ team, ...x });
        res.replaceChildren(el('p', { class: x.ok ? 'reveal' : 'reveal bad' }, x.ok ? 'Pesanan benar!' : `Pesanan: ${orderText(x)}. Belum sesuai tugas.`),
          el('p', { class: 'reveal info' }, `${x.taps} sentuhan · ${x.misses} meleset (titik merah) · ${Math.round(x.ms / 1000)} detik`),
          el('div', { class: 'row wrap' }, button('Uji lagi', test, 'small'), button('✏️ Kembali merancang', edit, 'small'),
            handoff ? button('Tukar peran', () => { team = 3 - team; design = clone(V1); at = 0; sel = null; edit(); }, 'small primary') : null),
          resultsTable());
      },
    });
    res.append(button('✏️ Kembali merancang', edit, 'small ghost'));
    wrap.replaceChildren(el('div', { class: 'kantin-layout' }, host, res));
  }
  function resultsTable() {
    return el('table', { class: 'tabel-kiriman' }, el('thead', null, el('tr', null, ['Rancangan', 'Benar?', 'Sentuhan', 'Meleset', 'Detik'].map((h) => el('th', null, h)))),
      el('tbody', null, results.map((x) => el('tr', null, el('td', null, handoff ? `Tim ${x.team}` : '–'), el('td', null, x.ok ? '✓' : '✗'), el('td', null, x.taps), el('td', null, x.misses), el('td', null, Math.round(x.ms / 1000))))));
  }
  edit();
}
