// Shell: hash router, activity list, start screen and toolbar.
// Routes (the QR code on each worksheet points at #/<id>):
//   #/                          daftar aktivitas (?jenjang=paud untuk menyaring)
//   #/<id>                      layar mulai satu aktivitas
//   #/<id>?mode=sendiri         langsung main sendiri / satu kelas
//   #/<id>?mode=giliran-3       3 tim bergiliran di satu papan
//   #/<id>?mode=lomba-2         2 pemain berlomba, layar dibagi
//   #/<id>?mode=<extra>         mode khusus aktivitas (kreasi, pasangan, …)
//   #/tentang                   tentang & lisensi

import { activities, findActivity, JENJANG } from './activities/registry.js';
import { el, button, onTap, newSeed } from './core/util.js';
import { runSession, PLAYER_COLORS } from './core/session.js';
import { sound } from './core/sound.js';

const app = document.getElementById('app');
let current = null;

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  current?.destroy?.();
  current = null;
  app.replaceChildren();
  const [path, query] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query || '');
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'tentang') return renderAbout();
  // #/aktivitas/<id> is the older long form; keep it working.
  const id = parts[0] === 'aktivitas' ? parts[1] : parts[0];
  if (id) {
    const a = findActivity(decodeURIComponent(id));
    if (!a) return renderNotFound();
    const mode = parseMode(a, params.get('mode'));
    return mode ? renderPlay(a, mode) : renderStart(a);
  }
  renderHome(params.get('jenjang'));
}

function parseMode(a, value) {
  if (!value) return null;
  if (value === 'sendiri') return { mode: 'solo', players: 1 };
  const m = /^(giliran|lomba)-([2-4])$/.exec(value);
  if (m && Number(m[2]) <= a.maxPlayers) return { mode: m[1] === 'giliran' ? 'turns' : 'race', players: Number(m[2]) };
  const extra = a.extraModes?.find((x) => x.id === value);
  return extra ? { mode: 'extra', players: 1, extra } : null;
}

function toolbar(title, backHash) {
  const soundBtn = button(sound.muted ? '🔇' : '🔊', () => {
    sound.setMuted(!sound.muted);
    soundBtn.textContent = sound.muted ? '🔇' : '🔊';
  }, 'icon');
  soundBtn.setAttribute('aria-label', 'Suara');
  const fsBtn = button('⛶', toggleFullscreen, 'icon');
  fsBtn.setAttribute('aria-label', 'Layar penuh');
  return el('header', { class: 'toolbar' },
    backHash ? button('← Kembali', () => go(backHash), 'ghost') : el('span', { class: 'logo' }, '🧩'),
    el('h1', null, title),
    soundBtn, fsBtn);
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function jenjangOf(a) {
  return JENJANG.find((j) => j.id === a.jenjang);
}

function renderHome(filter) {
  const tabs = el('nav', { class: 'tabs' },
    [{ id: '', label: 'Semua' }, ...JENJANG].map((j) => {
      const b = button(j.label, () => go(j.id ? `#/?jenjang=${j.id}` : '#/'), (filter || '') === j.id ? 'tab on' : 'tab');
      return b;
    }));
  const list = activities.filter((a) => !filter || a.jenjang === filter);
  const grid = el('div', { class: 'cards' },
    list.length ? list.map((a) => onTap(el('button', { class: 'card', type: 'button' },
      el('span', { class: 'card-icon' }, a.icon),
      el('span', { class: 'card-title' }, a.title),
      el('span', { class: 'card-topic' }, a.topic),
      el('span', { class: 'badge' }, `${jenjangOf(a).label} · ${a.age}`)), () => go(`#/${a.id}`)))
      : el('p', { class: 'empty' }, 'Aktivitas untuk jenjang ini sedang disiapkan.'));
  app.append(
    toolbar('Coding & Computational Thinking'),
    el('div', { class: 'page' }, tabs, grid,
      el('footer', { class: 'foot' },
        el('a', { href: '#/tentang' }, 'Tentang & lisensi'))));
}

function renderStart(a) {
  const open = (value) => go(`#/${a.id}?mode=${value}`);
  const counts = [2, 3, 4].filter((n) => n <= a.maxPlayers);
  const dots = (n) => el('span', { class: 'mode-dots' }, PLAYER_COLORS.slice(0, n).map((c) => el('i', { style: { background: c } })));
  const pick = (prefix, unit) => el('div', { class: 'mode-pick' },
    counts.map((n) => {
      const b = button(String(n), () => open(`${prefix}-${n}`), 'small');
      b.setAttribute('aria-label', `${n} ${unit}`);
      return b;
    }));

  const modes = [
    onTap(el('button', { class: 'mode', type: 'button' }, dots(1),
      el('b', null, 'Sendiri / Kelas'),
      el('small', null, 'Satu papan besar, dipandu guru')), () => open('sendiri')),
    el('div', { class: 'mode' }, dots(4),
      el('b', null, 'Bergiliran'),
      el('small', null, 'Pilih jumlah tim:'),
      pick('giliran', 'tim')),
    el('div', { class: 'mode' }, el('span', { class: 'mode-dots split' }, '◧'),
      el('b', null, 'Berlomba'),
      el('small', null, 'Layar dibagi. Jumlah pemain:'),
      pick('lomba', 'pemain')),
    ...(a.extraModes || []).map((x) => onTap(el('button', { class: 'mode free', type: 'button' },
      el('span', { class: 'mode-dots' }, x.icon),
      el('b', null, x.label),
      el('small', null, x.desc)), () => open(x.id))),
  ];
  app.append(
    toolbar(a.title, '#/'),
    el('div', { class: 'page start' },
      el('div', { class: 'start-icon' }, a.icon),
      el('p', { class: 'meta' }, `${a.id} · ${jenjangOf(a).label} · ${a.age} · ${a.topic}`),
      el('p', { class: 'goal' }, a.goal),
      el('div', { class: 'modes' }, modes),
      a.source && el('p', { class: 'credit' }, 'Konsep terinspirasi dari ',
        el('a', { href: a.source.url, target: '_blank', rel: 'noopener' }, a.source.name), '.')));
}

function renderPlay(a, { mode, players, extra }) {
  const back = `#/${a.id}`;
  app.append(toolbar(a.title, back));
  const holder = el('div', { class: 'play' });
  app.append(holder);
  const start = () => {
    current?.destroy?.();
    holder.replaceChildren();
    current = runSession(holder, a, {
      mode, players, extra, seed: newSeed(),
      onExit: () => go(back),
      onReplay: start,
    });
  };
  start();
}

function renderAbout() {
  app.append(
    toolbar('Tentang', '#/'),
    el('div', { class: 'page prose' },
      el('h2', null, 'Coding & Computational Thinking Unplugged'),
      el('p', null, 'Situs ini adalah versi digital lembar kerja dalam buku. Setiap aktivitas dapat dimainkan sendiri, bersama satu kelas, atau oleh 2–4 anak sekaligus pada interactive flat panel dengan layar dibagi.'),
      el('p', null, 'Situs berjalan sepenuhnya di peramban: tidak ada data anak yang dikirim atau disimpan di server, dan setelah dibuka sekali dapat digunakan tanpa internet.'),
      el('h3', null, 'Atribusi'),
      el('p', null, 'Konsep sebagian aktivitas terinspirasi dari ',
        el('a', { href: 'https://www.csunplugged.org/', target: '_blank', rel: 'noopener' }, 'CS Unplugged'),
        ' (csunplugged.org), karya University of Canterbury, Selandia Baru. Aktivitas di buku dan situs ini dirancang ulang untuk kurikulum Indonesia.')));
}

function renderNotFound() {
  app.append(toolbar('Tidak ditemukan', '#/'),
    el('div', { class: 'page start' }, el('p', { class: 'goal' }, 'Aktivitas ini belum tersedia. Periksa kembali kode QR atau pilih dari daftar.')));
}

// Long-press on a panel opens the context menu; it only gets in the way here.
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
