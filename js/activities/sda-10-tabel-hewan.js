// Kebun Binatang Data — SD Awal (7–9 tahun), data dan klasifikasi.
// Sort the new animals into a table; a pictogram grows beside it. Then read
// the data, and place the turtle that fits two groups in a Venn diagram.

import { el, dnd, choice, button, shake } from '../core/kit.js';

const GROUPS = [
  { key: 'kaki', label: 'Berkaki empat', icon: '🐾' },
  { key: 'sayap', label: 'Bersayap', icon: '🪽' },
  { key: 'air', label: 'Hidup di air', icon: '💧' },
];
const ANIMALS = [
  { icon: '🐈', name: 'kucing', group: 'kaki' },
  { icon: '🐄', name: 'sapi', group: 'kaki' },
  { icon: '🐐', name: 'kambing', group: 'kaki' },
  { icon: '🐎', name: 'kuda', group: 'kaki' },
  { icon: '🐓', name: 'ayam', group: 'sayap' },
  { icon: '🐦', name: 'burung pipit', group: 'sayap' },
  { icon: '🦋', name: 'kupu-kupu', group: 'sayap' },
  { icon: '🐟', name: 'ikan mas', group: 'air' },
  { icon: '🐟', name: 'ikan lele', group: 'air' },
];
const COUNT = Object.fromEntries(GROUPS.map((g) => [g.key, ANIMALS.filter((a) => a.group === g.key).length]));
const label = (k) => GROUPS.find((g) => g.key === k).label;

const card = (a, extra = {}) => el('div', { class: 'animal', 'data-drag': '', 'data-name': a.name, ...extra }, el('span', { class: 'animal-icon' }, a.icon), el('small', null, a.name));

function pictogram(counts) {
  const rows = GROUPS.map((g) => {
    const stars = el('span', { class: 'stars' }, '⭐'.repeat(counts[g.key]));
    return { key: g.key, stars, node: el('tr', null, el('th', null, `${g.icon} ${g.label}`), el('td', null, stars)) };
  });
  return {
    node: el('table', { class: 'picto' }, el('caption', null, 'Piktogram (⭐ = 1 hewan)'), el('tbody', null, rows.map((r) => r.node))),
    set(key, n) { rows.find((r) => r.key === key).stars.textContent = '⭐'.repeat(n); },
  };
}

function sortRound(wrap, ctx, next) {
  const counts = { kaki: 0, sayap: 0, air: 0 };
  const pic = pictogram(counts);
  let left = ANIMALS.length;
  const tray = el('div', { class: 'animal-tray' }, ctx.rand.shuffle(ANIMALS).map((a) => card(a)));
  const cols = GROUPS.map((g) => el('div', { class: 'data-col', 'data-drop': g.key },
    el('div', { class: 'data-head' }, `${g.icon} ${g.label}`), el('div', { class: 'data-items' }), el('div', { class: 'data-sum' }, 'Jumlah: 0')));
  const area = el('div', { class: 'data-area' }, tray, el('div', { class: 'data-row' }, el('div', { class: 'data-table' }, cols), pic.node));
  dnd(area, (item, col) => {
    const a = ANIMALS.find((x) => x.name === item.dataset.name);
    if (a.group !== col.dataset.drop) { ctx.mistake(); shake(item); return; }
    item.classList.add('locked');
    col.querySelector('.data-items').append(item);
    counts[a.group]++;
    col.querySelector('.data-sum').textContent = `Jumlah: ${counts[a.group]}`;
    pic.set(a.group, counts[a.group]);
    ctx.sound.tap();
    if (--left === 0) next();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Petugas kebun binatang mendata hewan baru. Seret setiap hewan ke kolom yang tepat!'), area);
}

const QUESTIONS = [
  { q: 'Kelompok mana yang hewannya paling banyak?', options: GROUPS.map((g) => ({ icon: g.icon, label: g.label, correct: g.key === 'kaki' })) },
  { q: 'Kelompok mana yang hewannya paling sedikit?', options: GROUPS.map((g) => ({ icon: g.icon, label: g.label, correct: g.key === 'air' })) },
  { q: 'Berapa selisih kelompok terbanyak dan tersedikit?', options: [1, 2, 3, 4].map((n) => ({ label: String(n), correct: n === COUNT.kaki - COUNT.air })) },
  { q: 'Berapa jumlah semua hewan?', options: [7, 8, 9, 10].map((n) => ({ label: String(n), correct: n === ANIMALS.length })) },
];

function randomQuestion(rand) {
  const [a, b] = rand.shuffle(GROUPS.map((g) => g.key));
  if (rand.next() < 0.5) {
    const n = COUNT[a];
    return { q: `Berapa hewan di kelompok "${label(a)}"?`, options: [n - 1, n, n + 1, n + 2].filter((x) => x >= 0).map((x) => ({ label: String(x), correct: x === n })) };
  }
  const n = COUNT[a] + COUNT[b];
  return { q: `Berapa hewan "${label(a)}" dan "${label(b)}" jika digabung?`, options: [n - 1, n, n + 1].map((x) => ({ label: String(x), correct: x === n })) };
}

// Kura-kura: four legs AND lives in water, so it goes where the circles meet.
function vennRound(wrap, ctx, next) {
  const items = [
    { icon: '🐢', name: 'kura-kura', zone: 'dua' },
    { icon: '🐈', name: 'kucing', zone: 'kaki' },
    { icon: '🐟', name: 'ikan lele', zone: 'air' },
  ];
  let left = items.length;
  const zone = (key, text) => el('div', { class: `venn-zone z-${key}`, 'data-drop': key }, el('small', null, text));
  const venn = el('div', { class: 'venn' }, el('div', { class: 'venn-circle c1' }), el('div', { class: 'venn-circle c2' }),
    zone('kaki', 'Berkaki empat'), zone('dua', 'Keduanya'), zone('air', 'Hidup di air'));
  const tray = el('div', { class: 'animal-tray' }, items.map((a) => card(a)));
  const area = el('div', { class: 'data-area' }, tray, venn);
  dnd(area, (item, z) => {
    const a = items.find((x) => x.name === item.dataset.name);
    if (a.zone !== z.dataset.drop) { ctx.mistake(); shake(item); return; }
    item.classList.add('locked');
    z.append(item);
    ctx.sound.tap();
    if (--left === 0) next();
  });
  wrap.append(el('p', { class: 'prompt' }, 'Hewan baru datang: 🐢 kura-kura! Kura-kura berkaki empat DAN hidup di air. Taruh setiap hewan di tempatnya.'), area);
}

export default {
  id: 'sda-10-tabel-hewan',
  title: 'Kebun Binatang Data',
  topic: 'Data: tabel dan piktogram',
  jenjang: 'sd-awal',
  age: '7–9 tahun',
  icon: '🦒',
  source: null,
  rounds: 6,
  maxPlayers: 4,
  goal: 'Murid mengelompokkan hewan, mencatatnya dalam tabel dan piktogram, menjawab pertanyaan dari data, dan menaruh hewan yang cocok untuk dua kelompok di irisan diagram.',
  extraModes: [{ id: 'tanya', icon: '❓', label: 'Buat Pertanyaan', desc: 'Satu tim menyusun pertanyaan dari data, tim lain menjawab dari piktogram', create: createAsk }],
  create(root, ctx) {
    const wrap = el('div', { class: 'act hewan' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      const next = () => { if (ctx.solved()) setTimeout(render, 1300); };
      if (r === 0) { sortRound(wrap, ctx, next); return; }
      if (r === 5) { vennRound(wrap, ctx, next); return; }
      const q = QUESTIONS[r - 1] || randomQuestion(ctx.rand);
      choice(wrap, { prompt: q.q, subject: pictogram(COUNT).node, ctx, onRight: next, columns: q.options.length, options: q.options });
    }
    render();
  },
};

// Buat Pertanyaan: pick a question form and groups; the other team answers.
function createAsk(root, ctx) {
  const wrap = el('div', { class: 'act hewan' });
  root.append(wrap);
  const FORMS = [
    { id: 'berapa', text: (a) => `Berapa hewan yang ${label(a).toLowerCase()}?`, need: 1, answer: (a) => COUNT[a] },
    { id: 'gabung', text: (a, b) => `Berapa hewan ${label(a).toLowerCase()} dan ${label(b).toLowerCase()} jika digabung?`, need: 2, answer: (a, b) => COUNT[a] + COUNT[b] },
    { id: 'selisih', text: (a, b) => `Berapa selisih hewan ${label(a).toLowerCase()} dan ${label(b).toLowerCase()}?`, need: 2, answer: (a, b) => Math.abs(COUNT[a] - COUNT[b]) },
  ];
  function compose() {
    let form = FORMS[0];
    const picked = [];
    const preview = el('p', { class: 'reveal' });
    const formRow = el('div', { class: 'row' });
    const groupRow = el('div', { class: 'row' });
    function draw() {
      formRow.replaceChildren(...FORMS.map((f) => button(f.id === 'berapa' ? 'Berapa …?' : f.id === 'gabung' ? 'Digabung …?' : 'Selisih …?', () => { form = f; picked.length = 0; draw(); }, f === form ? 'small on' : 'small')));
      groupRow.replaceChildren(...GROUPS.map((g) => button(`${g.icon} ${g.label}`, () => {
        if (picked.includes(g.key)) picked.splice(picked.indexOf(g.key), 1);
        else { picked.push(g.key); if (picked.length > form.need) picked.shift(); }
        draw();
      }, picked.includes(g.key) ? 'small on' : 'small')));
      const ready = picked.length === form.need;
      preview.textContent = ready ? form.text(...picked) : `Pilih ${form.need} kelompok.`;
      ask.disabled = !ready;
    }
    const ask = button('Tanyakan!', () => answer(form.text(...picked), form.answer(...picked)), 'primary');
    wrap.replaceChildren(
      el('p', { class: 'prompt' }, 'Tim penanya: susun pertanyaan dari data kebun binatang.'),
      el('div', { class: 'label' }, 'Bentuk pertanyaan'), formRow, el('div', { class: 'label' }, 'Kelompok'), groupRow, preview, ask);
    draw();
  }
  function answer(q, n) {
    wrap.replaceChildren();
    const result = el('p', { class: 'reveal' });
    const nums = [...new Set([n, n + 1, Math.max(0, n - 1), n + 2])].sort((a, b) => a - b);
    choice(wrap, {
      prompt: `Tim penjawab: ${q} Baca piktogramnya!`,
      subject: pictogram(COUNT).node, ctx, columns: nums.length,
      onRight() { ctx.sound.win(); result.textContent = `Benar, ${n}!`; },
      options: nums.map((x) => ({ label: String(x), correct: x === n })),
    });
    wrap.append(result, button('Pertanyaan baru', compose, 'primary'));
  }
  compose();
}
