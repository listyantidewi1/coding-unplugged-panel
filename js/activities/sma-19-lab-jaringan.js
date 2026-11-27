// Teknisi Lab Komputer — SMA/SMK (16–18 tahun), jaringan komputer dan troubleshooting.
// A small school network: devices and network models, valid addresses, faulty
// configuration cards, a five-step diagnosis tree, Wi-Fi security settings and
// splitting the network with a /25 mask. Pings travel across a tappable map.

import { el, onTap, button, shake } from '../core/util.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';
import { misiHead, fill } from './misi-kit.js';

const NET = '192.168.10.';
const ROUTER = '192.168.10.1';
const MASK = '255.255.255.0';
export const INTERNET = '203.0.113.10';

// Map nodes: [x, y, icon, name, fixed address]
export const NODES = {
  inet: [90, 75, '☁️', 'Internet', INTERNET], modem: [265, 75, '📶', 'Modem (ONT)', ''], router: [450, 75, '🔀', 'Router', ROUTER],
  ap: [680, 75, '📡', 'Titik akses', '192.168.10.3'], laptop: [915, 75, '💻', 'Laptop guru', null],
  sw: [450, 225, '🔌', 'Switch', ''], server: [90, 365, '🗄️', 'Server ujian', null], printer: [90, 500, '🖨️', 'Printer', null],
  PC1: [270, 365, '🖥️', 'PC1', null], PC2: [430, 365, '🖥️', 'PC2', null], PC3: [590, 365, '🖥️', 'PC3', null],
  PC4: [270, 500, '🖥️', 'PC4', null], PC5: [430, 500, '🖥️', 'PC5', null], PC6: [590, 500, '🖥️', 'PC6', null],
  perpus: [760, 365, '📚', 'Perpustakaan', null], tu: [925, 365, '🗂️', 'Ruang TU', null], kepsek: [845, 500, '🏫', 'Kepala sekolah', null],
};
const LINKS = [['inet', 'modem'], ['modem', 'router'], ['router', 'ap'], ['router', 'sw'], ['ap', 'laptop'], ...['server', 'printer', 'PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'perpus', 'tu', 'kepsek'].map((d) => ['sw', d])];
export const ENDS = ['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'perpus', 'tu', 'kepsek', 'laptop', 'server', 'printer'];
const START_IP = { server: 5, printer: 9, PC1: 21, PC2: 22, PC3: 23, PC4: 24, PC5: 25, PC6: 26, tu: 33, laptop: 57, perpus: 101, kepsek: 102 };

export function makeNet() {
  const cfg = {};
  for (const d of ENDS) cfg[d] = { link: true, ip: NET + START_IP[d], mask: MASK, gw: ROUTER, dns: ROUTER };
  return { cfg, isp: true, tick: 0 };
}
const octets = (ip) => (ip ? ip.split('.').map(Number) : []);
export const validIp = (ip) => { const o = octets(ip); return o.length === 4 && o.every((x) => Number.isInteger(x) && x >= 0 && x <= 255); };
// Usable host address in 192.168.10.0/24.
export const inNet = (ip, mask = MASK) => mask === MASK && validIp(ip) && ip.startsWith(NET) && octets(ip)[3] >= 1 && octets(ip)[3] <= 254;
export function owner(net, ip, except = null) {
  for (const [k, n] of Object.entries(NODES)) if (n[4] && n[4] === ip && k !== except) return k;
  for (const d of ENDS) if (d !== except && net.cfg[d].link && net.cfg[d].ip === ip) return d;
  return null;
}
const clashWith = (net, d) => { const ip = net.cfg[d].ip; return ip ? owner(net, ip, d) : null; };

const ADJ = {};
for (const [a, b] of LINKS) { (ADJ[a] ||= []).push(b); (ADJ[b] ||= []).push(a); }
export function route(a, b) {
  const prev = { [a]: null }; const q = [a];
  while (q.length) { const v = q.shift(); if (v === b) break; for (const w of ADJ[v] || []) if (!(w in prev)) { prev[w] = v; q.push(w); } }
  const path = []; for (let v = b; v != null; v = prev[v]) path.unshift(v);
  return path;
}
const hub = (d) => (d === 'laptop' ? 'ap' : 'sw');
const label = (k) => NODES[k][3];

// Send a ping from device d to an address. Returns { ok, path, text }; ok is false on failure.
export function ping(net, d, target) {
  const c = net.cfg[d];
  if (!c.link) return { ok: false, path: [d], text: d === 'laptop' ? 'Wi-Fi tidak tersambung.' : 'Kabel jaringan tidak tersambung.' };
  if (!c.ip) return { ok: false, path: [d], text: 'Perangkat belum punya alamat IP.' };
  if (!inNet(c.ip, c.mask)) return { ok: false, path: [d, hub(d)], text: `Tidak ada balasan: ${c.ip} tidak berada di jaringan 192.168.10.x, jadi tidak ada perangkat yang bisa menjawabnya.` };
  const other = clashWith(net, d);
  if (other && net.tick++ % 2 === 0) return { ok: false, path: [d, hub(d)], text: `Tidak ada balasan: alamat ${c.ip} bentrok dengan ${label(other)}, balasannya nyasar.` };
  if (target.startsWith(NET)) {
    const to = owner(net, target, d);
    if (!to) return { ok: false, path: [d, hub(d)], text: `Tidak ada balasan: tidak ada perangkat di ${target}.` };
    const p = route(d, to);
    const dc = net.cfg[to];
    if (dc && !dc.link) return { ok: false, path: p.slice(0, -1), text: `Tidak ada balasan: kabel ${label(to)} terlepas.` };
    return { ok: true, path: p, text: `Ada balasan dari ${target} (${label(to)}), lewat switch tanpa gateway.` };
  }
  const gw = owner(net, c.gw, d);
  if (gw !== 'router') return { ok: false, path: [d, hub(d)], text: c.gw ? `Tidak ada balasan: gateway ${c.gw} tidak ada, jadi data ke luar jaringan tidak bisa dikirim.` : 'Tidak ada balasan: gateway kosong.' };
  if (!net.isp) return { ok: false, path: route(d, 'modem'), text: 'Tidak ada balasan: router dan modem tidak mendapat sambungan dari penyedia internet.' };
  if (target !== INTERNET) return { ok: false, path: route(d, 'inet'), text: `Tidak ada balasan dari ${target}.` };
  return { ok: true, path: route(d, 'inet'), text: `Ada balasan dari ${INTERNET} di internet, lewat gateway ${ROUTER}.` };
}

export const SITES = { 'ujian.sekolah.example': '192.168.10.5', 'bahan.belajar.example': INTERNET };
// Open a site by name: DNS first, then the address.
export function open(net, d, name) {
  const c = net.cfg[d];
  const base = ping(net, d, ROUTER);
  if (!c.link || !c.ip || !inNet(c.ip, c.mask)) { const r = ping(net, d, SITES[name]); return { ...r, text: `Situs tidak terbuka. ${r.text}` }; }
  if (!c.dns) return { ok: false, path: [d], text: 'Alamat situs tidak ditemukan: DNS kosong, tidak ada yang menerjemahkan nama menjadi alamat IP.' };
  if (c.dns !== ROUTER) return { ok: false, path: [d, hub(d)], text: `Alamat situs tidak ditemukan: server DNS ${c.dns} tidak menjawab.` };
  if (!base.ok) return { ...base, text: `Alamat situs tidak ditemukan. ${base.text}` };
  const r = ping(net, d, SITES[name]);
  return { ...r, text: r.ok ? `DNS router menerjemahkan ${name} menjadi ${SITES[name]}; situs terbuka.` : `DNS menjawab ${SITES[name]}, tetapi situs tidak terbuka. ${r.text}` };
}

// The five steps of the diagnosis tree as test results; stop = first failing step (6 = all pass).
export const STEPS = ['Lampu port atau Wi-Fi', 'Alamat IP dan subnet mask', 'ping ke gateway', `ping ${INTERNET}`, 'Buka situs dengan nama'];
export function diagnose(net, d) {
  const c = net.cfg[d];
  const other = clashWith(net, d);
  const t0 = net.tick;
  const gw = c.link && c.ip ? ping(net, d, c.gw || '0.0.0.0') : { ok: false, text: 'tidak bisa diuji' };
  const out = ping(net, d, INTERNET);
  const site = open(net, d, 'bahan.belajar.example');
  net.tick = t0;
  const res = [
    { ok: c.link, text: c.link ? (d === 'laptop' ? 'Wi-Fi tersambung.' : 'Lampu port menyala.') : (d === 'laptop' ? 'Wi-Fi tidak tersambung.' : 'Lampu port mati; layar: "Kabel jaringan tidak tersambung".') },
    { ok: c.link && inNet(c.ip, c.mask) && !other, text: c.ip ? `IP ${c.ip} · mask ${c.mask} · gateway ${c.gw || '(kosong)'} · DNS ${c.dns || '(kosong)'}${other ? ' · layar: "Alamat IP bentrok dengan perangkat lain"' : ''}` : 'Alamat IP: tidak ada.' },
    { ok: other ? 'kadang' : gw.ok, text: other ? 'Kadang ada balasan, kadang tidak.' : `ping ${c.gw || '(gateway kosong)'}: ${gw.ok ? 'ada balasan' : 'tidak ada balasan'}.` },
    { ok: other ? 'kadang' : out.ok, text: other ? 'Kadang berhasil.' : `ping ${INTERNET}: ${out.ok ? 'ada balasan' : 'tidak ada balasan'}.` },
    { ok: other ? 'kadang' : site.ok, text: other ? 'Kadang terbuka.' : `bahan.belajar.example: ${site.ok ? 'terbuka' : '"Alamat situs tidak ditemukan"'}.` },
  ];
  const stop = res.findIndex((r) => r.ok !== true) + 1 || 6;
  return { res, stop };
}

export const FAULTS = {
  kabel: { label: 'Kabel terlepas', kind: 'Masalah fisik', step: 1, fix: 'Pasang kembali atau ganti kabel, coba port switch lain', apply: (n, d) => { n.cfg[d].link = false; n.cfg[d].ip = null; } },
  bentrok: { label: 'Alamat bentrok', kind: 'Masalah alamat', step: 2, fix: 'Ganti ke alamat yang belum terpakai, atau pakai DHCP', apply: (n, d, r) => { n.cfg[d].ip = n.cfg[r.pick(ENDS.filter((x) => x !== d && x !== 'laptop'))].ip; } },
  jaringan: { label: 'Alamat di jaringan lain', kind: 'Masalah alamat', step: 2, fix: 'Ubah alamat ke 192.168.10.x yang belum terpakai', apply: (n, d) => { n.cfg[d].ip = n.cfg[d].ip.replace(NET, '192.168.11.'); } },
  gateway: { label: 'Gateway salah', kind: 'Masalah gateway', step: 3, fix: 'Ubah gateway menjadi 192.168.10.1', apply: (n, d, r) => { n.cfg[d].gw = r.pick(['192.168.10.254', '192.168.10.10', '192.168.1.1']); } },
  isp: { label: 'Gangguan penyedia internet', kind: 'Masalah sambungan internet', step: 4, fix: 'Periksa dan nyalakan ulang modem, lalu hubungi penyedia internet', apply: (n) => { n.isp = false; } },
  dns: { label: 'DNS salah', kind: 'Masalah DNS', step: 5, fix: 'Ubah DNS menjadi 192.168.10.1', apply: (n, d, r) => { n.cfg[d].dns = r.pick(['192.168.100.1', '', '192.168.10.11']); } },
};
const STOP_LABEL = (s) => (s === 6 ? 'Semua lolos' : `Langkah ${s}`);

// --- map ---
export function mapSvg(net, { sel = null, hide = false, only = null } = {}) {
  const lines = LINKS.map(([a, b]) => { const [x1, y1] = NODES[a]; const [x2, y2] = NODES[b]; const wifi = b === 'laptop'; const off = !hide && net.cfg[b] && !net.cfg[b].link; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${off ? '#dc2626' : wifi ? '#7c3aed' : a === 'inet' ? '#f97316' : '#2563eb'}" stroke-width="5" ${wifi || off ? 'stroke-dasharray="10 9"' : ''}/>`; });
  const nodes = Object.entries(NODES).map(([k, [x, y, icon, name, fixed]]) => {
    const c = net.cfg[k]; const ip = fixed ?? (hide ? '?' : c.ip || 'tanpa alamat');
    const can = ENDS.includes(k) && (!only || only.includes(k));
    const bad = !hide && k === 'modem' && !net.isp;
    return `<g ${can ? `data-d="${k}" class="lj-node"` : ''}><rect x="${x - 78}" y="${y - 54}" width="156" height="108" rx="16" fill="${k === sel ? '#fef08a' : bad ? '#fecaca' : '#f8fafc'}" stroke="${k === sel ? '#ca8a04' : can ? '#1e293b' : '#94a3b8'}" stroke-width="${k === sel ? 7 : 3}"/><text x="${x}" y="${y - 12}" font-size="34" text-anchor="middle">${icon}</text><text x="${x}" y="${y + 18}" font-size="20" font-weight="800" text-anchor="middle" fill="#0f172a">${name}</text>${ip ? `<text x="${x}" y="${y + 42}" font-size="19" font-weight="600" text-anchor="middle" fill="#334155">${ip}</text>` : ''}</g>`;
  });
  return `<svg viewBox="0 15 1010 545" role="img" aria-label="Denah jaringan sekolah">${lines.join('')}${nodes.join('')}<g class="lj-anim"></g></svg>`;
}
// Move a dot along the path; mark ✓ or ✗ at the end.
function animate(box, path, ok, cb) {
  const svg = box.querySelector('svg'); const g = svg?.querySelector('.lj-anim');
  if (!g) { cb?.(); return; }
  const NS = 'http://www.w3.org/2000/svg';
  g.replaceChildren();
  const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '13'); dot.setAttribute('fill', ok ? '#16a34a' : '#f59e0b'); dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '3');
  g.append(dot);
  const pts = path.map((k) => NODES[k]);
  let i = 0; const seg = 260; let t0 = null;
  const end = () => {
    const [x, y] = pts[pts.length - 1];
    const mark = document.createElementNS(NS, 'text'); mark.setAttribute('x', x + 62); mark.setAttribute('y', y - 22); mark.setAttribute('font-size', '48'); mark.setAttribute('font-weight', '900'); mark.setAttribute('text-anchor', 'middle'); mark.setAttribute('fill', ok ? '#16a34a' : '#dc2626'); mark.textContent = ok ? '✓' : '✗';
    g.append(mark); cb?.();
  };
  if (pts.length < 2) { dot.setAttribute('cx', pts[0][0]); dot.setAttribute('cy', pts[0][1]); end(); return; }
  const step = (now) => {
    if (!svg.isConnected) return;
    t0 ??= now; const f = Math.min(1, (now - t0) / seg);
    const [x1, y1] = pts[i]; const [x2, y2] = pts[i + 1];
    dot.setAttribute('cx', x1 + (x2 - x1) * f); dot.setAttribute('cy', y1 + (y2 - y1) * f);
    if (f < 1) requestAnimationFrame(step);
    else if (++i < pts.length - 1) { t0 = now; requestAnimationFrame(step); } else end();
  };
  requestAnimationFrame(step);
}

// --- rounds ---
export const DEVICE_JOBS = [['Modem (ONT)', 'Mengubah sinyal dari penyedia internet menjadi sinyal untuk jaringan sekolah'], ['Router', 'Menghubungkan jaringan sekolah dengan jaringan lain dan menjadi pintu keluarnya (gateway)'], ['Switch', 'Menghubungkan semua perangkat berkabel sehingga bisa saling berkirim data di dalam sekolah'], ['Titik akses Wi-Fi', 'Menghubungkan perangkat tanpa kabel ke jaringan sekolah'], ['Kabel UTP', 'Membawa sinyal antara sebuah komputer dan switch'], ['Server ujian', 'Menyimpan soal dan mengirimkannya ketika diminta komputer murid']];
export const ADDRS = [['192.168.10.37', true, 'Di jaringan yang sama dan belum dipakai.'], ['192.168.10.0', false, 'Alamat jaringan.'], ['192.168.10.255', false, 'Alamat siaran.'], ['192.168.11.37', false, 'Jaringan lain: angka ketiganya 11.'], ['192.168.10.256', false, 'Bukan alamat sah: angka paling besar 255.'], ['192.168.10.1', false, 'Sudah dipakai router; alamatnya akan bentrok.']];
// PC1–PC6 config cards; the wrong field on each card, or null when it is right.
export const CARDS = [['PC1', '192.168.10.21', MASK, ROUTER, ROUTER, null, 'Benar'], ['PC2', '192.168.10.25', MASK, ROUTER, ROUTER, 'ip', 'Alamat bentrok dengan PC5 (.25); ganti, misalnya ke 192.168.10.22'], ['PC3', '192.168.11.23', MASK, ROUTER, ROUTER, 'ip', 'Alamat di jaringan lain; ubah ke 192.168.10.23'], ['PC4', '192.168.10.24', MASK, '192.168.10.254', ROUTER, 'gw', 'Gateway salah: tidak ada perangkat di .254; ubah ke 192.168.10.1'], ['PC5', '192.168.10.25', MASK, ROUTER, ROUTER, 'ip', 'Alamat bentrok dengan PC2 (.25); ganti salah satunya'], ['PC6', '192.168.10.26', MASK, ROUTER, '', 'dns', 'DNS kosong; isi 192.168.10.1']];
const FIELDS = [['ip', 'Alamat IP', 1], ['mask', 'Subnet mask', 2], ['gw', 'Gateway', 3], ['dns', 'DNS', 4]];
export const REPORTS = [
  { dev: 'perpus', fault: 'kabel', title: 'Laporan 1. Komputer perpustakaan (berkabel): "Internetnya tidak bisa!"' },
  { dev: 'laptop', fault: 'gateway', gw: '192.168.10.254', title: 'Laporan 2. Laptop Bu Wati di ruang guru (Wi-Fi), pengaturan diisi manual.' },
  { dev: 'tu', fault: 'dns', dns: '192.168.100.1', title: 'Laporan 3. Komputer ruang TU (berkabel).' },
];
export function reportNet(rep) {
  const n = makeNet();
  if (rep.fault === 'kabel') FAULTS.kabel.apply(n, rep.dev);
  if (rep.gw) n.cfg[rep.dev].gw = rep.gw;
  if (rep.dns) n.cfg[rep.dev].dns = rep.dns;
  return n;
}
export function randomFault(rand, f = rand.pick(Object.keys(FAULTS)), dev = rand.pick(['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'perpus', 'tu', 'kepsek', 'laptop'])) {
  const n = makeNet(); FAULTS[f].apply(n, dev, rand); return { net: n, dev, fault: f };
}

export const WIFI = [
  ['Jenis pengamanan', 'WEP', [['WPA2 atau WPA3', true, 'WEP bisa dipecahkan dalam hitungan menit.'], ['Terbuka tanpa kata sandi', false]]],
  ['Kata sandi Wi-Fi', '12345678, ditempel di dinding kantin', [['Kalimat sandi ≥ 12 karakter, hanya untuk yang berhak', true, '12345678 termasuk yang paling sering ditebak.'], ['sekolah2026, tidak ditempel', false]]],
  ['Akun pengelola', 'admin / admin', [['Kata sandi kuat yang hanya diketahui pengelola', true, 'admin/admin diketahui umum.'], ['admin / admin123', false]]],
  ['Jaringan ponsel murid dan tamu', 'sama dengan lab dan server ujian', [['Jaringan tamu yang terpisah', true, 'Ponsel berprogram jahat tidak lagi menjangkau server ujian.'], ['Tetap sama, tetapi kata sandinya diganti', false]]],
  ['WPS (tombol atau PIN 8 angka)', 'aktif', [['Matikan WPS', true, 'PIN diperiksa dua bagian dan angka terakhirnya angka cek: cukup 10.000 + 1.000 = 11.000 percobaan, bukan 100 juta.'], ['Ganti PIN dengan 8 angka lain', false]]],
  ['Perangkat lunak (firmware)', 'terakhir diperbarui 4 tahun lalu', [['Perbarui dan periksa pembaruan berkala', true, 'Firmware lama punya celah yang sudah diketahui umum.'], ['Biarkan, selama masih menyala', false]]],
  ['Halaman pengaturan', 'hanya dari ruang server lewat kabel', [['Buka juga dari Wi-Fi supaya praktis', false]]],
];
// ---------- Permainan: Teknisi Siaga ----------
// The school network must be green before tomorrow's 07.00 exam. Faulty devices
// carry a red sticker on the map and turn green once the fix is found.

const STIKER = { merah: '#dc2626', hijau: '#16a34a', kuning: '#f59e0b' };
const UTP = [345, 300];
// The network map with stickers, dark (powerless) devices, tags and a tappable UTP cable.
function denah(net, { sel = null, hide = false, tap = [], stick = {}, dark = [], tags = {}, cut = [], utp = false } = {}) {
  const off = (k) => dark.includes(k);
  const isCut = (a, b) => cut.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const lines = LINKS.map(([a, b]) => {
    const [x1, y1] = NODES[a]; const [x2, y2] = NODES[b]; const wifi = b === 'laptop';
    const c = isCut(a, b);
    const grey = off(a) || off(b);
    const stroke = c ? '#dc2626' : grey ? '#94a3b8' : wifi ? '#7c3aed' : a === 'inet' ? '#f97316' : '#2563eb';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="5" ${wifi || c || grey ? 'stroke-dasharray="10 9"' : ''}/>${c ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 12}" font-size="34" text-anchor="middle">✂️</text>` : ''}`;
  });
  const node = (k, [x, y, icon, name, fixed]) => {
    const c = net.cfg[k];
    const ip = fixed ?? (hide ? '?' : c.ip || 'tanpa alamat');
    const can = tap.includes(k);
    const d = off(k);
    const fillc = d ? '#475569' : k === sel ? '#fef08a' : '#f8fafc';
    const st = stick[k] ? `<g transform="rotate(10 ${x + 58} ${y - 48})"><rect x="${x + 36}" y="${y - 62}" width="46" height="30" rx="4" fill="${STIKER[stick[k]]}" stroke="#fff" stroke-width="3"/><text x="${x + 59}" y="${y - 40}" font-size="20" text-anchor="middle" fill="#fff" font-weight="900">${stick[k] === 'hijau' ? '✓' : '!'}</text></g>` : '';
    const sub = tags[k] ? `<text x="${x}" y="${y + 42}" font-size="18" font-weight="900" text-anchor="middle" fill="#15803d">${tags[k]}</text>` : ip ? `<text x="${x}" y="${y + 42}" font-size="19" font-weight="600" text-anchor="middle" fill="${d ? '#cbd5e1' : '#334155'}">${ip}</text>` : '';
    return `<g ${can ? `data-d="${k}" class="lj19-node"` : ''}><rect x="${x - 78}" y="${y - 54}" width="156" height="108" rx="16" fill="${fillc}" stroke="${k === sel ? '#ca8a04' : can ? '#1e293b' : '#94a3b8'}" stroke-width="${k === sel ? 7 : can ? 4 : 3}"/><text x="${x}" y="${y - 12}" font-size="34" text-anchor="middle" ${d ? 'opacity="0.45"' : ''}>${icon}</text><text x="${x}" y="${y + 18}" font-size="20" font-weight="800" text-anchor="middle" fill="${d ? '#e2e8f0' : '#0f172a'}">${name}</text>${sub}${st}</g>`;
  };
  const cable = utp ? `<g ${tap.includes('utp') ? 'data-d="utp" class="lj19-node"' : ''}><rect x="${UTP[0] - 70}" y="${UTP[1] - 22}" width="140" height="44" rx="22" fill="${tags.utp ? '#dcfce7' : '#fff'}" stroke="#1e293b" stroke-width="3"/><text x="${UTP[0]}" y="${UTP[1] + 8}" font-size="20" font-weight="800" text-anchor="middle" fill="#0f172a">🔗 ${tags.utp ? `${tags.utp}` : 'Kabel UTP'}</text></g>` : '';
  return `<svg viewBox="0 15 1010 545" role="img" aria-label="Denah jaringan sekolah">${lines.join('')}${Object.entries(NODES).map(([k, n]) => node(k, n)).join('')}${cable}<g class="lj-anim"></g></svg>`;
}
const tapDenah = (box, fn) => box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-d]'); if (!g) return; e.preventDefault(); fn(g.dataset.d, g); });

// +/− counter instead of typing a number.
function stepper(start, { lo = 0, hi = 999, onOk }) {
  let v = start;
  const num = el('b', { class: 'lj19-angka' });
  const set = (x) => { v = Math.max(lo, Math.min(hi, x)); num.textContent = v; };
  const node = el('div', { class: 'lj19-stepper' }, ...[[-10, '−10'], [-1, '−1']].map(([d, l]) => button(l, () => set(v + d))), num, ...[[1, '+1'], [10, '+10']].map(([d, l]) => button(l, () => set(v + d))), button('✓ Pasang', (e) => onOk(v, e?.currentTarget || node, node), 'primary'));
  set(start);
  return node;
}

// Tap a card from the tray, then a bin.
function sortRound(wrap, ctx, { cards, bins, intro, why, win, done }) {
  let sel = null; const placed = {};
  const tray = el('div', { class: 'lj19-baki' });
  const binBox = el('div', { class: 'lj19-kotak-kotak' });
  const msg = el('p', { class: 'reveal info' }, intro);
  function draw() {
    fill(tray, cards.filter((c) => !(c.id in placed)).map((c) => onTap(el('button', { type: 'button', class: `lj19-kartu ${sel === c.id ? 'pilih' : ''}` }, c.label), () => { sel = c.id; ctx.sound.tap(); draw(); })));
    fill(binBox, bins.map((b) => onTap(el('div', { class: 'lj19-kotak' }, el('b', null, b.label), b.sub ? el('small', null, b.sub) : null, el('div', { class: 'lj19-isi' }, cards.filter((c) => placed[c.id] === b.id).map((c) => el('span', null, c.short || c.label)))), (e) => drop(b.id, e.currentTarget))));
  }
  function drop(bin, node) {
    if (!sel) { say(msg, 'info', 'Ketuk kartu dulu, lalu kotaknya.'); return; }
    const c = cards.find((x) => x.id === sel);
    if (c.bin !== bin) { ctx.mistake(); shake(node); say(msg, 'bad', why(c, bin)); return; }
    placed[c.id] = bin; sel = null; ctx.sound.tap(); draw();
    if (Object.keys(placed).length === cards.length) { say(msg, '', win); done(); } else say(msg, 'info', c.note || 'Tepat. Kartu berikutnya.');
  }
  wrap.append(tray, binBox, msg);
  draw();
}

// Misi 1a: stick six job cards onto the devices on the map.
const TUGAS = [['modem', '📶', 'Mengubah sinyal dari penyedia internet'], ['router', '🔀', 'Pintu keluar ke jaringan lain (gateway)'], ['sw', '🔌', 'Menyambungkan semua perangkat berkabel'], ['ap', '📡', 'Menyambungkan perangkat tanpa kabel'], ['utp', '🔗', 'Membawa sinyal dari komputer ke switch'], ['server', '🗄️', 'Menyimpan soal ujian']];
function jobRound(wrap, ctx, { done }) {
  const net = makeNet(); let sel = null; const ok = {};
  const box = el('div', { class: 'lj19-peta' });
  const tray = el('div', { class: 'lj19-baki' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk kartu tugas, lalu ketuk perangkat yang bertugas begitu.');
  const nameOf = (k) => (k === 'utp' ? 'Kabel UTP' : label(k));
  function draw() {
    box.innerHTML = denah(net, { utp: true, tap: ['inet', 'modem', 'router', 'ap', 'sw', 'utp', 'server', 'printer', 'PC1', 'laptop'], tags: Object.fromEntries(Object.keys(ok).map((k) => [k, k === 'utp' ? '✓' : '✓ tugas cocok'])), stick: Object.fromEntries(Object.keys(ok).filter((k) => k !== 'utp').map((k) => [k, 'hijau'])) });
    fill(tray, TUGAS.filter(([k]) => !ok[k]).map(([k, , t]) => onTap(el('button', { type: 'button', class: `lj19-kartu ${sel === k ? 'pilih' : ''}` }, t), () => { sel = k; ctx.sound.tap(); draw(); })));
  }
  tapDenah(box, (k) => {
    if (!sel) { say(msg, 'info', 'Ketuk kartu tugas dulu.'); return; }
    if (k !== sel) { ctx.mistake(); shake(box); say(msg, 'bad', `${nameOf(k)} tidak bertugas "${TUGAS.find((x) => x[0] === sel)[2].toLowerCase()}".`); return; }
    ok[k] = true; sel = null; ctx.sound.tap(); draw();
    if (Object.keys(ok).length === TUGAS.length) { say(msg, '', 'Semua tugas tertempel: internet → modem → router → switch dan titik akses → perangkat.'); done(); }
    else say(msg, 'info', `${nameOf(k)}: tepat.`);
  });
  wrap.append(tray, box, msg);
  draw();
}

// Misi 1b: sort the four networks by size, then predict two outages on the map.
const MODEL = [['lab', 'Komputer dan printer di lab sekolah', 'LAN'], ['jam', 'Ponsel, jam tangan pintar, dan pengeras suara nirkabel milik satu orang', 'PAN'], ['kamera', 'Kamera lalu lintas di puluhan simpang satu kota', 'MAN'], ['bank', 'Bank dengan kantor cabang di 30 provinsi', 'WAN']];
function modelRound(wrap, ctx, { done }) {
  const area = el('div', { class: 'lj19-area' });
  wrap.append(area);
  sortRound(area, ctx, {
    cards: MODEL.map(([id, l, bin]) => ({ id, label: l, short: l.split(' ').slice(0, 3).join(' '), bin })),
    bins: [['PAN', '👤 satu orang'], ['LAN', '🏫 satu gedung'], ['MAN', '🏙️ satu kota'], ['WAN', '🌏 antarkota, antarnegara']].map(([id, sub]) => ({ id, label: id, sub })),
    intro: 'Ketuk kartu jaringan, lalu kotak jenisnya.',
    why: (c) => `Seberapa luas "${c.label.toLowerCase()}"?`,
    win: 'PAN satu orang, LAN satu gedung, MAN satu kota, WAN antarkota.',
    done: () => setTimeout(() => { if (area.isConnected) outage(); }, 2600),
  });
  const EV = [
    { text: '✂️ Kabel PC3 putus.', opts: [['Hanya PC3 terputus', true], ['Semua PC terputus'], ['Semua perangkat terputus']], cut: [['sw', 'PC3']], dark: ['PC3'], why: 'Topologi bintang: setiap perangkat punya kabel sendiri ke switch.' },
    { text: '⚡ Switch mati.', opts: [['Semua perangkat berkabel terputus; laptop Wi-Fi masih ke internet', true], ['Hanya switch yang mati'], ['Semua perangkat terputus, termasuk Wi-Fi']], dark: ['sw', 'server', 'printer', 'PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'perpus', 'tu', 'kepsek'], why: 'Switch adalah pusat bintang. Titik akses tersambung ke router, bukan ke switch.' },
  ];
  function outage(n = 0) {
    const ev = EV[n];
    const net = makeNet();
    const box = el('div', { class: 'lj19-peta' });
    const tools = el('div', { class: 'lj19-tombol' });
    const msg = el('p', { class: 'reveal info' }, 'Tebak dulu akibatnya.');
    box.innerHTML = denah(net, {});
    fill(area, el('div', { class: 'pp8-kejadian' }, el('small', null, `🃏 Kejadian ${n + 1} dari ${EV.length}`), el('b', null, ev.text)), box, tools, msg);
    fill(tools, ctx.rand.shuffle(ev.opts).map(([l, ok]) => button(l, (e) => {
      if (!ok) { ctx.mistake(); shake(e?.currentTarget || tools); say(msg, 'bad', 'Bayangkan jalur kabelnya di denah. Coba lagi.'); return; }
      ctx.sound.good(); box.innerHTML = denah(net, { cut: ev.cut || [], dark: ev.dark });
      if (n === 0) { fill(tools); say(msg, '', `Hanya PC3 padam. ${ev.why}`); setTimeout(() => { if (area.isConnected) outage(1); }, 3000); return; }
      say(msg, 'info', `${ev.why} Bisakah laptop guru membuka server ujian sekarang?`);
      fill(tools, [['Bisa', false], ['Tidak bisa', true]].map(([l2, ok2]) => button(l2, (e2) => {
        if (!ok2) { ctx.mistake(); shake(e2?.currentTarget || tools); say(msg, 'bad', 'Ikuti jalur dari laptop ke server ujian di denah.'); return; }
        fill(tools); ctx.sound.good();
        animate(box, route('laptop', 'inet'), true, () => setTimeout(() => { if (box.isConnected) animate(box, ['laptop', 'ap', 'router', 'sw'], false); }, 500));
        say(msg, '', 'Laptop masih ke internet lewat titik akses dan router, tetapi server ujian ada di balik switch yang mati.');
        done();
      })));
    })));
  }
}

// Misi 2a: sort six address stickers, then count the usable addresses.
function addrSortRound(wrap, ctx, { done }) {
  const area = el('div', { class: 'lj19-area' });
  wrap.append(el('div', { class: 'lj19-jaringan' }, el('b', null, '🏫 Jaringan lab: 192.168.10.0'), el('span', null, 'subnet mask 255.255.255.0 · router 192.168.10.1')), area);
  const REASON = { true: 'ok', 'Alamat jaringan.': 'jar', 'Alamat siaran.': 'siar', 'Jaringan lain: angka ketiganya 11.': 'lain', 'Bukan alamat sah: angka paling besar 255.': 'sah', 'Sudah dipakai router; alamatnya akan bentrok.': 'pakai' };
  sortRound(area, ctx, {
    cards: ctx.rand.shuffle(ADDRS.map(([ip, ok, why]) => ({ id: ip, label: ip, bin: ok ? 'ok' : REASON[why], note: `${ip}: ${why}` }))),
    bins: [['ok', '✅ Boleh dipakai'], ['jar', 'Alamat jaringan'], ['siar', 'Alamat siaran'], ['lain', 'Jaringan lain'], ['sah', 'Bukan alamat sah'], ['pakai', 'Sudah terpakai']].map(([id, l]) => ({ id, label: l })),
    intro: 'Ketuk stiker alamat, lalu kotak yang tepat.',
    why: (c) => `${c.label} bukan di kotak itu. Periksa angka ketiga, angka terakhir, dan alamat router.`,
    win: 'Semua stiker tersortir.',
    done: () => setTimeout(() => { if (area.isConnected) count(); }, 1800),
  });
  function count() {
    const grid = el('div', { class: 'lj19-rak' }, Array.from({ length: 256 }, (_, i) => el('i', { class: i === 0 || i === 255 ? 'tutup' : i === 1 ? 'router' : '' })));
    const msg = el('p', { class: 'reveal info' }, 'Rak 256 alamat (.0 sampai .255). Berapa perangkat paling banyak yang bisa diberi alamat?');
    fill(area, grid, stepper(256, { lo: 0, hi: 300, onOk: (v, node, st) => {
      if (v !== 254) { ctx.mistake(); shake(node); say(msg, 'bad', v > 254 ? 'Ada dua alamat yang tidak boleh dipakai perangkat.' : 'Terlalu sedikit: router juga perangkat.'); return; }
      ctx.sound.good(); st.replaceWith(el('b', { class: 'lj19-angka' }, '254')); say(msg, '', '254 perangkat: 256 alamat dikurangi alamat jaringan .0 dan alamat siaran .255. Router ikut dihitung: ia memakai .1.'); done();
    } }), msg);
  }
}

// Misi 2b: the DHCP machine hands out .100–.199 until it runs dry.
function dhcpRound(wrap, ctx, { done }) {
  const area = el('div', { class: 'lj19-area' });
  wrap.append(el('div', { class: 'lj19-jaringan' }, el('b', null, '🎰 Mesin DHCP di router'), el('span', null, 'membagikan 192.168.10.100 sampai 192.168.10.199')), area);
  const msg = el('p', { class: 'reveal info' }, 'Tebak dulu: berapa perangkat yang bisa mendapat alamat otomatis?');
  let given = 0;
  const grid = el('div', { class: 'lj19-rak kecil' }, Array.from({ length: 100 }, (_, i) => el('i', { title: `.${100 + i}` })));
  const paint = () => [...grid.children].forEach((c, i) => c.classList.toggle('isi', i < given));
  fill(area, grid, stepper(50, { lo: 0, hi: 300, onOk: (v, node, st) => {
    if (v !== 100) { ctx.mistake(); shake(node); say(msg, 'bad', v === 99 ? 'Hitung kedua ujungnya: .100 dan .199 ikut.' : 'Hitung dari .100 sampai .199.'); return; }
    ctx.sound.good(); st.remove(); pour();
  } }), msg);
  function pour() {
    const tools = el('div', { class: 'lj19-tombol' });
    area.append(tools); area.append(msg);
    say(msg, 'info', 'Tebakan tepat: 100. Datangkan ponsel murid ke Wi-Fi sekolah.');
    const more = () => fill(tools, given < 100 ? button('📱 Datangkan 25 ponsel', () => { given += 25; ctx.sound.tap(); paint(); say(msg, 'info', `${given} alamat terpakai, sisa ${100 - given}.`); more(); }, 'primary')
      : button('📱 Satu ponsel lagi', () => { ctx.sound.tap(); late(); }, 'primary'));
    more();
    function late() {
      fill(tools, el('div', { class: 'lj19-telat' }, el('b', null, '📱 Ponsel ke-101'), el('code', null, '169.254.80.3')), ...[['Bisa membuka server ujian', false], ['Tidak bisa', true]].map(([l, ok]) => button(l, (e) => {
        if (!ok) { ctx.mistake(); shake(e?.currentTarget || tools); say(msg, 'bad', 'Bandingkan angka depannya dengan 192.168.10.x.'); return; }
        ctx.sound.good(); fixed();
      })));
      say(msg, 'info', 'DHCP habis. Ponsel memberi dirinya alamat 169.254.80.3. Bisakah ia membuka server ujian?');
    }
    function fixed() {
      const net = makeNet(); const pick = new Set();
      const box = el('div', { class: 'lj19-peta' });
      const draw = () => { box.innerHTML = denah(net, { tap: ENDS, stick: Object.fromEntries([...pick].map((k) => [k, 'hijau'])), tags: Object.fromEntries([...pick].map((k) => [k, '📌 alamat tetap'])) }); };
      fill(area, box, msg);
      say(msg, 'info', '169.254.x.y bukan jaringan 192.168.10.x, jadi tidak ada yang bisa menjawabnya. Sekarang ketuk dua perangkat yang perlu alamat tetap di luar rentang DHCP.');
      draw();
      tapDenah(box, (k) => {
        if (pick.size === 2 || pick.has(k)) return;
        if (k !== 'server' && k !== 'printer') { ctx.mistake(); shake(box); say(msg, 'bad', `${label(k)} boleh berganti alamat setiap hari; tidak ada yang mencarinya lewat alamatnya.`); return; }
        pick.add(k); ctx.sound.tap(); draw();
        if (pick.size === 2) { ctx.sound.good(); say(msg, '', 'Server ujian .5 dan printer .9 dicari banyak komputer lewat alamatnya, jadi alamatnya tetap dan di luar .100–.199 supaya DHCP tidak membagikannya.'); done(); }
      });
    }
  }
}

// Misi 3: raid the configuration cards, then install the fix from buttons.
const PERBAIKAN = { PC2: [['192.168.10.22', true], ['192.168.10.21', 'Itu alamat PC1.'], ['192.168.10.5', 'Itu alamat server ujian.']], PC3: [['192.168.10.23', true], ['192.168.11.24', 'Masih jaringan lain.'], ['192.168.10.255', 'Itu alamat siaran.']], PC4: [['192.168.10.1', true], ['192.168.10.5', 'Server ujian bukan pintu keluar.'], ['192.168.11.1', 'Gateway harus di jaringan yang sama.']], PC6: [['192.168.10.1', true], ['192.168.100.1', 'Server itu tidak menjawab.'], ['192.168.10.255', 'Itu alamat siaran.']] };
function raidRound(wrap, ctx, { done }) {
  const cards = CARDS.map((c) => ({ id: c[0], v: { ip: c[1], mask: c[2], gw: c[3], dns: c[4] }, bad: c[5], note: c[6] }));
  const green = new Set(); let fixing = null;
  const box = el('div', { class: 'lj19-razia' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk isian yang salah pada kartu bertanda merah, atau ✓ Benar bila tidak ada masalah.');
  const badOf = (c) => (c.id === 'PC5' ? (green.has('PC2') ? null : 'ip') : c.bad);
  function hit(c, f, node) {
    if (green.has(c.id) || fixing) return;
    const want = badOf(c);
    if (c.id === 'PC5' && f === 'ip' && want) { say(msg, 'info', 'PC5 bentrok dengan PC2. Cukup ganti salah satu: kita ganti PC2.'); return; }
    if (f !== want) { ctx.mistake(); shake(node); say(msg, 'bad', f ? `${c.id}: ${FIELDS.find((x) => x[0] === f)[1].toLowerCase()} itu benar.` : `${c.id} masih punya masalah.`); return; }
    ctx.sound.tap();
    if (!f) { win(c); return; }
    fixing = { c, f }; say(msg, 'info', `${c.note.split(';')[0]}. Pilih perbaikannya.`); draw();
  }
  function fix(v, why, node) {
    const { c, f } = fixing;
    if (why !== true) { ctx.mistake(); shake(node); say(msg, 'bad', why); return; }
    c.v[f] = v; fixing = null; win(c);
  }
  function win(c) {
    green.add(c.id); draw();
    if (green.size === cards.length) { ctx.sound.good(); say(msg, '', 'Semua kartu hijau: PC1 benar, PC2 pindah ke .22 sehingga PC5 tidak bentrok lagi, PC3 ke .23, gateway PC4 .1, DNS PC6 .1.'); done(); }
    else say(msg, 'info', `${c.id} hijau.${c.id === 'PC2' ? ' PC5 kini tidak bentrok lagi.' : ''}`);
  }
  function draw() {
    fill(box, cards.map((c) => {
      const g = green.has(c.id);
      const isFix = fixing && fixing.c === c;
      return el('div', { class: `lj19-kartu-pc ${g ? 'hijau' : 'merah'}` }, el('div', { class: 'lj19-kepala' }, el('b', null, `🖥️ ${c.id}`), el('span', { class: 'lj19-stiker' }, g ? '✓' : '!')),
        FIELDS.map(([f, l]) => (isFix && fixing.f === f
          ? el('div', { class: 'lj19-pilih' }, el('small', null, l), ctx.rand.shuffle(PERBAIKAN[c.id]).map(([v, why]) => onTap(el('button', { type: 'button', class: 'lj19-nilai' }, v), (e) => fix(v, why, e.currentTarget))))
          : onTap(el('button', { type: 'button', class: `lj19-isian ${g && c.bad === f ? 'baru' : ''}` }, el('small', null, l), el('code', null, c.v[f] || '(kosong)')), (e) => hit(c, f, e.currentTarget)))),
        g ? null : onTap(el('button', { type: 'button', class: 'lj19-benar' }, '✓ Benar'), (e) => hit(c, null, e.currentTarget)));
    }));
  }
  wrap.append(box, msg);
  draw();
}

// Misi 4: five face-down test cards. Flip only what you need, stop at the first "no".
const CAUSES = { ...FAULTS, dhcp: { label: 'Tidak mendapat alamat dari DHCP', kind: 'Masalah alamat', step: 2, fix: 'Periksa mesin DHCP di router, perluas rentangnya, lalu minta alamat ulang' } };
function diagCards(wrap, ctx, { net, dev, fault, title, after, done }) {
  const { res, stop } = diagnose(net, dev);
  const seen = new Set(); let phase = 'uji';
  const box = el('div', { class: 'lj19-peta kecil' });
  const deck = el('div', { class: 'lj19-dek' });
  const tail = el('div', { class: 'lj19-ekor' });
  const count = el('span', { class: 'lj19-hitung' });
  const msg = el('p', { class: 'reveal info' }, 'Buka kartu uji seperlunya. Ketuk 🛑 pada langkah pertama yang jawabannya tidak.');
  const map = (s) => { box.innerHTML = denah(net, { sel: dev, hide: true, stick: { [dev]: s } }); };
  map('merah');
  function flip(k) {
    if (seen.has(k) || phase !== 'uji') return;
    seen.add(k); ctx.sound.tap();
    if (k >= 2) { const t0 = net.tick; const r = k === 2 ? ping(net, dev, net.cfg[dev].gw || '0.0.0.0') : k === 3 ? ping(net, dev, INTERNET) : open(net, dev, 'bahan.belajar.example'); net.tick = t0; animate(box, r.path, res[k].ok === true); }
    else animate(box, [dev], res[k].ok === true);
    draw();
  }
  function halt(k, node) {
    if (phase !== 'uji') return;
    if (k + 1 > stop) { ctx.mistake(); shake(node); say(msg, 'bad', 'Ada langkah lebih awal yang jawabannya tidak.'); return; }
    if (res[k].ok === true) { ctx.mistake(); shake(node); say(msg, 'bad', 'Langkah ini lolos. Lanjutkan.'); return; }
    const miss = [...Array(k).keys()].filter((j) => !seen.has(j));
    if (miss.length) { ctx.mistake(); shake(node); say(msg, 'bad', `Langkah ${miss.map((j) => j + 1).join(', ')} belum diperiksa. Pohon diagnosis dibaca dari bawah.`); return; }
    phase = 'sebab'; ctx.sound.good(); draw();
    say(msg, 'info', `Berhenti di langkah ${stop}, ${seen.size} kartu dibuka${seen.size > stop ? ` (cukup ${stop})` : ''}. Apa penyebabnya?`);
    const others = ctx.rand.shuffle(Object.keys(CAUSES).filter((f) => f !== fault)).sort((a, b) => Math.abs(CAUSES[a].step - stop) - Math.abs(CAUSES[b].step - stop)).slice(0, 3);
    fill(tail, el('small', null, '🔎 Penyebab'), el('div', { class: 'lj19-tombol' }, ctx.rand.shuffle([fault, ...others]).map((f) => button(CAUSES[f].label, (e) => {
      if (f !== fault) { ctx.mistake(); shake(e?.currentTarget || tail); say(msg, 'bad', `${CAUSES[f].label} akan berhenti di langkah ${CAUSES[f].step}${CAUSES[f].step === stop ? ', tetapi lihat lagi isi kartunya' : ''}.`); return; }
      ctx.sound.tap(); fixStep();
    }))));
  }
  function fixStep() {
    const wrong = ctx.rand.shuffle(Object.keys(CAUSES).filter((f) => f !== fault)).slice(0, 2);
    say(msg, 'info', `${CAUSES[fault].label}. Pilih perbaikannya.`);
    fill(tail, el('small', null, '🛠️ Perbaikan'), el('div', { class: 'lj19-tombol tegak' }, ctx.rand.shuffle([fault, ...wrong]).map((f) => button(CAUSES[f].fix, (e) => {
      if (f !== fault) { ctx.mistake(); shake(e?.currentTarget || tail); say(msg, 'bad', 'Perbaikan itu untuk masalah lain.'); return; }
      ctx.sound.good(); fill(tail); phase = 'beres'; map('hijau');
      animate(box, route(dev, 'inet'), true);
      if (after) after(tail, msg, () => done(seen.size)); else { say(msg, '', `${CAUSES[fault].fix}. ${label(dev)} kembali hijau.`); done(seen.size); }
    }))));
  }
  function draw() {
    count.textContent = `🃏 ${seen.size} kartu dibuka`;
    fill(deck, STEPS.map((s, k) => {
      const o = seen.has(k);
      const kind = o ? (res[k].ok === true ? 'ya' : res[k].ok === 'kadang' ? 'kadang' : 'tidak') : 'tutup';
      return el('div', { class: `lj19-uji ${kind}` }, el('b', null, k + 1), onTap(el('button', { type: 'button', class: 'lj19-muka' }, el('span', null, s), o ? el('small', null, `${res[k].ok === true ? '✓' : res[k].ok === 'kadang' ? '⚠️' : '✗'} ${res[k].text}`) : el('small', null, '🔒 ketuk untuk membuka')), () => flip(k)),
        o && phase === 'uji' && res[k].ok !== true ? onTap(el('button', { type: 'button', class: 'lj19-stop' }, '🛑'), (e) => halt(k, e.currentTarget)) : null);
    }).reverse());
  }
  wrap.append(el('div', { class: 'lj19-laporan' }, el('b', null, title), count), el('div', { class: 'lj19-diag' }, box, el('div', { class: 'lj19-kanan' }, deck, tail)), msg);
  draw();
}

const LAPORAN = [
  { dev: 'perpus', fault: 'kabel', title: '📞 Laporan 1 · Komputer perpustakaan (berkabel): "Internetnya tidak bisa!"' },
  { dev: 'laptop', fault: 'gateway', gw: '192.168.10.254', title: '📞 Laporan 2 · Laptop Bu Wati (Wi-Fi), pengaturan diisi manual.' },
  { dev: 'tu', fault: 'dns', dns: '192.168.100.1', title: '📞 Laporan 3 · Komputer ruang TU (berkabel): situs tidak terbuka.' },
  { dev: 'kepsek', fault: 'dhcp', title: '📞 Laporan 4 · Komputer kepala sekolah, pagi hari setelah 100 ponsel tersambung.' },
  { dev: 'PC1', fault: 'isp', title: '📞 Laporan 5 · Semua komputer bisa ping gateway, tetapi tidak bisa ping 203.0.113.10.' },
];
function laporanNet(L) {
  const n = makeNet();
  if (L.fault === 'kabel') FAULTS.kabel.apply(n, L.dev);
  if (L.gw) n.cfg[L.dev].gw = L.gw;
  if (L.dns) n.cfg[L.dev].dns = L.dns;
  if (L.fault === 'dhcp') Object.assign(n.cfg[L.dev], { ip: '169.254.80.3', mask: '255.255.0.0', gw: '', dns: '' });
  if (L.fault === 'isp') n.isp = false;
  return n;
}
const examAfter = (tail, msg, fin) => {
  say(msg, 'info', 'Gangguan di penyedia internet. Bisakah ujian besok tetap berjalan?');
  fill(tail, el('div', { class: 'lj19-tombol' }, [['Tetap jalan', true], ['Batal', false]].map(([l, ok]) => button(l, (e) => {
    if (!ok) { e?.currentTarget && shake(e.currentTarget); say(msg, 'bad', 'Di mana server ujian berada? Lihat denahnya.'); return; }
    fill(tail); say(msg, '', 'Ujian tetap jalan: server ujian ada di jaringan sekolah, dicapai lewat switch tanpa internet.'); fin();
  }))));
};
// Several reports in a row inside one round.
function reportChain(wrap, ctx, { list, done }) {
  const area = el('div', { class: 'lj19-area' });
  wrap.append(area);
  let total = 0; let min = 0;
  const go = (i) => {
    fill(area);
    const L = list[i];
    const net = L.net || laporanNet(L);
    min += diagnose(net, L.dev).stop;
    diagCards(area, ctx, { net, dev: L.dev, fault: L.fault, title: `${L.title}${list.length > 1 ? ` (${i + 1}/${list.length})` : ''}`, after: L.fault === 'isp' ? examAfter : null, done: (n) => {
      total += n;
      if (i + 1 < list.length) setTimeout(() => { if (area.isConnected) go(i + 1); }, 2600);
      else { area.querySelector('.reveal')?.append(` Total ${total} kartu dibuka, paling sedikit ${min}.`); done(); }
    } });
  };
  go(0);
}

// Misi 5: the Wi-Fi fortress. Each fix closes a gap; the meter climbs.
function wifiFort(wrap, ctx, { done }) {
  const fixed = WIFI.map(() => false);
  const box = el('div', { class: 'lj19-wifi' });
  const meter = el('div', { class: 'lj19-meter' });
  const msg = el('p', { class: 'reveal info' }, 'Tim Audit menemukan pengaturan titik akses ini. Tutup setiap celah, biarkan yang sudah aman.');
  const draw = () => {
    const s = fixed.filter(Boolean).length;
    fill(meter, el('i', { style: { width: `${(s / 7) * 100}%` } }), el('span', null, `🛡️ Nilai keamanan ${s} / 7`));
    fill(box, WIFI.map(([name, cur, opts], i) => el('div', { class: `lj19-atur ${fixed[i] ? 'aman' : ''}` }, el('b', null, `${fixed[i] ? '🛡️' : '⚠️'} ${name}`), el('span', null, fixed[i] && i !== 6 ? opts.find((o) => o[1])[0] : cur),
      fixed[i] ? null : el('div', { class: 'lj19-tombol kiri' }, ctx.rand.shuffle([['Biarkan', i === 6], ...opts.map(([l, ok]) => [l, ok])]).map(([l, ok]) => onTap(el('button', { class: 'lj19-opsi', type: 'button' }, l), (e) => {
        if (!ok) { ctx.mistake(); shake(e.currentTarget); say(msg, 'bad', i === 6 ? 'Jangan: siapa pun yang tersambung ke Wi-Fi bisa mencoba mengubah pengaturan.' : l === 'Biarkan' ? `"${cur}" masih celah.` : 'Perbaikan itu belum cukup aman.'); return; }
        fixed[i] = true; ctx.sound.tap(); say(msg, 'info', i === 6 ? 'Benar: halaman pengaturan hanya bisa dibuka lewat kabel dari ruang server.' : opts.find((o) => o[1])[2]); draw();
        if (fixed.every(Boolean)) { ctx.sound.good(); say(msg, '', 'Benteng Wi-Fi utuh: WPA2/WPA3, sandi panjang, akun pengelola kuat, jaringan tamu terpisah, WPS mati, firmware baru.'); done(); }
      }))))));
  };
  wrap.append(meter, box, msg);
  draw();
}

// Misi Bos: cut 192.168.10.0 into lab and office with mask .128.
function subnetBoss(wrap, ctx, { done }) {
  const area = el('div', { class: 'lj19-area' });
  const bar = el('div', { class: 'lj19-pita' });
  const msg = el('p', { class: 'reveal info' });
  wrap.append(el('div', { class: 'lj19-jaringan' }, el('b', null, '✂️ 192.168.10.0 · mask 255.255.255.128'), el('span', null, 'Lab dan kantor dipisah menjadi dua jaringan.')), bar, area, msg);
  let cutAt = null; const marks = [];
  const pos = (x) => `${(x / 256) * 100}%`;
  function drawBar(extra = []) {
    fill(bar, cutAt == null ? Array.from({ length: 15 }, (_, i) => (i + 1) * 16).map((x) => onTap(el('button', { type: 'button', class: 'lj19-potong', style: { left: pos(x) } }, `.${x}`), (e) => cut(x, e.currentTarget)))
      : [el('div', { class: 'lj19-bagian lab', style: { width: pos(128) } }, el('b', null, '🖥️ Lab'), el('small', null, '.0 · .1–.126 · .127')), el('div', { class: 'lj19-bagian kantor', style: { width: pos(128) } }, el('b', null, '🗂️ Kantor'), el('small', null, '.128 · .129–.254 · .255'))],
    [...marks, ...extra].map(([a, b, cls, t]) => el('i', { class: `lj19-rentang ${cls}`, style: { left: pos(a), width: pos(b - a + 1) } }, t)), el('em', { class: 'lj19-ujung kiri' }, '.0'), el('em', { class: 'lj19-ujung kanan' }, '.255'));
  }
  function cut(x, node) {
    if (cutAt != null) return;
    if (x !== 128) { ctx.mistake(); shake(node); say(msg, 'bad', `Mask .128 berarti setiap bagian 128 alamat. Potongan di .${x} membuat bagian ${x} dan ${256 - x}.`); return; }
    cutAt = 128; ctx.sound.good(); drawBar();
    say(msg, 'info', 'Dua bagian, masing-masing 128 alamat. Berapa yang bisa dipakai perangkat di setiap bagian?');
    fill(area, stepper(128, { lo: 0, hi: 200, onOk: (v, n) => {
      if (v !== 126) { ctx.mistake(); shake(n); say(msg, 'bad', 'Setiap bagian punya alamat jaringan dan alamat siarannya sendiri.'); return; }
      ctx.sound.good(); say(msg, 'info', '126 per bagian: lab .1–.126, kantor .129–.254. Ketuk perangkat, lalu bagiannya menurut alamat.'); place();
    } }));
  }
  function place() {
    const devs = [['pc', '🖥️ PC lab .100', 'lab'], ['kt', '🗂️ Komputer kantor .130', 'kantor'], ['tu', '🗂️ Ruang TU .33', 'lab']];
    let sel = null; const put = {};
    const draw = () => fill(area, el('div', { class: 'lj19-baki' }, devs.filter(([k]) => !put[k]).map(([k, l]) => onTap(el('button', { type: 'button', class: `lj19-kartu ${sel === k ? 'pilih' : ''}` }, l), () => { sel = k; ctx.sound.tap(); draw(); }))),
      el('div', { class: 'lj19-kotak-kotak dua' }, [['lab', '🖥️ Lab .0–.127'], ['kantor', '🗂️ Kantor .128–.255']].map(([b, l]) => onTap(el('div', { class: `lj19-kotak ${b}` }, el('b', null, l), el('div', { class: 'lj19-isi' }, devs.filter(([k]) => put[k] === b).map(([, t]) => el('span', null, t)))), (e) => drop(b, e.currentTarget)))));
    function drop(b, node) {
      if (!sel) { say(msg, 'info', 'Ketuk perangkat dulu.'); return; }
      const d = devs.find((x) => x[0] === sel);
      if (d[2] !== b) { ctx.mistake(); shake(node); say(msg, 'bad', sel === 'tu' ? 'Ruangnya memang kantor, tetapi alamat .33 jatuh di bagian mana?' : 'Lihat angka terakhir alamatnya.'); return; }
      put[sel] = b; sel = null; ctx.sound.tap(); draw();
      if (Object.keys(put).length === devs.length) moveTu();
    }
    draw();
  }
  function moveTu() {
    say(msg, 'info', 'Ruang TU itu kantor, tetapi alamatnya .33 ada di bagian lab. Pindahkan ke alamat mana?');
    fill(area, el('div', { class: 'lj19-tombol' }, ctx.rand.shuffle([['.133', true], ['.128', 'Itu alamat jaringan kantor.'], ['.255', 'Itu alamat siaran kantor.'], ['.127', 'Itu alamat siaran lab.']]).map(([l, ok]) => button(`192.168.10${l}`, (e) => {
      if (ok !== true) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', ok); return; }
      ctx.sound.good(); talk();
    }))));
  }
  function talk() {
    say(msg, 'info', 'TU pindah ke .133. Sekarang PC lab .100 mengirim berkas ke komputer kantor .130. Lewat mana?');
    fill(area, el('div', { class: 'lj19-tombol' }, ctx.rand.shuffle([['Langsung lewat switch', false], ['Lewat router (gateway)', true]]).map(([l, ok]) => button(l, (e) => {
      if (!ok) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', 'Satu switch, tetapi kini dua jaringan berbeda.'); return; }
      ctx.sound.good(); dhcp();
    }))));
  }
  function dhcp() {
    const pick = {};
    say(msg, 'info', 'Lewat router: .100 dan .130 kini berbeda jaringan. Rentang DHCP lama .100–.199 menyeberangi batas. Pilih rentang baru untuk lab dan kantor.');
    const draw = () => {
      const ex = [[100, 199, 'lama', 'DHCP lama .100–.199']];
      if (pick.lab) ex.push([50, 120, 'baru', 'lab .50–.120']);
      if (pick.kantor) ex.push([150, 250, 'baru', 'kantor .150–.250']);
      drawBar(pick.lab && pick.kantor ? ex.slice(1) : ex);
      fill(area, ...[['lab', [['.50–.120', true], ['.100–.127', 'Memuat .127, alamat siaran lab.'], ['.0–.100', 'Memuat .0, alamat jaringan lab.']]], ['kantor', [['.150–.250', true], ['.128–.199', 'Memuat .128, alamat jaringan kantor.'], ['.200–.255', 'Memuat .255, alamat siaran kantor.']]]].map(([b, opts]) => el('div', { class: 'lj19-baris' }, el('b', null, b === 'lab' ? '🖥️ Lab' : '🗂️ Kantor'),
        pick[b] ? el('span', { class: 'lj19-ok' }, `✓ ${opts[0][0]}`) : ctx.rand.shuffle(opts).map(([l, ok]) => button(l, (e) => {
          if (ok !== true) { ctx.mistake(); shake(e?.currentTarget || area); say(msg, 'bad', ok); return; }
          pick[b] = true; ctx.sound.tap(); draw();
          if (pick.lab && pick.kantor) { ctx.sound.good(); say(msg, '', 'Jaringan terbagi: lab .1–.126 dengan DHCP .50–.120, kantor .129–.254 dengan DHCP .150–.250, TU di .133. Lab dan kantor bicara lewat router.'); done(); }
        })))));
    };
    draw();
  }
  drawBar();
  say(msg, 'info', 'Ketuk tempat garis pemisah pada rak 256 alamat.');
}

const HEAD19 = {
  medan: ['Kenali Medan', 'Tempelkan kartu tugas ke perangkat di denah.'],
  model: ['Kenali Medan', 'Sortir jaringan menurut luasnya, lalu tebak akibat gangguan.'],
  alamat: ['Jatah Alamat', 'Alamat mana yang boleh dipakai komputer baru di lab?'],
  dhcp: ['Jatah Alamat', 'Mesin DHCP membagikan alamat sampai habis.'],
  razia: ['Razia Kartu', 'Temukan isian yang salah, lalu pasang perbaikannya.'],
  pohon: ['Pohon Diagnosis', 'Buka kartu uji seperlunya; berhenti di langkah pertama yang gagal.'],
  acak: ['Pohon Diagnosis', 'Laporan gangguan acak. Kartu sesedikit mungkin.'],
  wifi: ['Benteng Wi-Fi', 'Tutup celah titik akses sampai nilai keamanan penuh.'],
  boss: ['Lab dan Kantor', 'Bagi jaringan sekolah menjadi dua dengan mask 255.255.255.128.'],
};

export default {
  id: 'sma-19-lab-jaringan',
  title: 'Teknisi Lab Komputer',
  topic: 'Jaringan komputer: perangkat, model jaringan, alamat IP, gateway, DNS, troubleshooting, dan keamanan Wi-Fi',
  jenjang: 'sma',
  age: '16–18 th',
  icon: '🔌',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mengenali perangkat dan model jaringan, menentukan alamat IP yang sah, menemukan kesalahan konfigurasi alamat, gateway, dan DNS, mendiagnosis gangguan dengan pohon diagnosis lima langkah, mengatur Wi-Fi supaya aman, dan membagi jaringan dengan subnet mask 255.255.255.128.',
  extraModes: [
    { id: 'lab', icon: '🧪', label: 'Lab Jaringan Virtual', desc: 'Ketuk perangkat di denah, ubah konfigurasinya, jalankan ping atau buka situs, dan lihat pesannya berjalan; pasang masalah acak lalu temukan', create: createLab },
    { id: 'giliran', icon: '🕵️', label: 'Masalah Tersembunyi', desc: 'Satu tim memasang masalah tersembunyi, tim lain menjalankan uji satu per satu; makin sedikit uji, makin besar poinnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act lab-jaringan lj19-main' });
    root.append(wrap);
    const f1 = ctx.rand.pick(Object.keys(FAULTS));
    const f2 = ctx.rand.pick(Object.keys(FAULTS).filter((f) => FAULTS[f].step !== FAULTS[f1].step));
    const acak = [f1, f2].map((f, i) => { const r = randomFault(ctx.rand, f); return { ...r, title: `📞 Laporan acak ${i + 1} · ${label(r.dev)}: "Internetnya tidak bisa!"`, after: null }; });
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = (wait = 5200) => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, wait); } };
      const head = (k, no) => wrap.append(misiHead(no, ...HEAD19[k], '🔌'));
      if (r === 0) { head('medan', 1); jobRound(wrap, ctx, { done: () => next() }); }
      else if (r === 1) { head('model', 1); modelRound(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 2) { head('alamat', 2); addrSortRound(wrap, ctx, { done: () => next(6000) }); }
      else if (r === 3) { head('dhcp', 2); dhcpRound(wrap, ctx, { done: () => next(7000) }); }
      else if (r === 4) { head('razia', 3); raidRound(wrap, ctx, { done: () => next(6400) }); }
      else if (r === 5) { head('pohon', 4); reportChain(wrap, ctx, { list: LAPORAN.slice(0, 3), done: () => next(6000) }); }
      else if (r === 6) { head('pohon', 4); reportChain(wrap, ctx, { list: LAPORAN.slice(3), done: () => next(6400) }); }
      else if (r === 7) { head('acak', 4); reportChain(wrap, ctx, { list: acak, done: () => next(6000) }); }
      else if (r === 8) { head('wifi', 5); wifiFort(wrap, ctx, { done: () => next(6400) }); }
      else { head('boss', 'Bos'); subnetBoss(wrap, ctx, { done: () => next(7000) }); }
    }
    render();
  },
};

function createLab(root, ctx) {
  const wrap = el('div', { class: 'act lab-jaringan' });
  root.append(wrap);
  let net = makeNet(); let sel = 'PC1'; let hidden = null; let tests = 0;
  const box = el('div', { class: 'lj-peta' });
  const panel = el('div', { class: 'lj-panel' });
  const tools = el('div', { class: 'seg' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk perangkat di denah, lalu jalankan uji atau ubah pengaturannya.');
  box.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-d]'); if (!g) return; e.preventDefault(); sel = g.dataset.d; ctx.sound.tap(); draw(); });
  const show = (r) => { tests++; animate(box, r.path, r.ok); say(msg, r.ok ? '' : 'bad', `${label(sel)}: ${r.text}${hidden ? ` (uji ke-${tests})` : ''}`); };
  const set = (patch) => { Object.assign(net.cfg[sel], patch); draw(); say(msg, 'info', `${label(sel)}: pengaturan diubah.`); };
  const ipShift = (dx) => { const c = net.cfg[sel]; const o = octets(c.ip || `${NET}100`); o[3] = Math.min(254, Math.max(1, o[3] + dx)); set({ ip: o.join('.') }); };
  function draw() {
    const c = net.cfg[sel];
    box.innerHTML = mapSvg(net, { sel, hide: !!hidden });
    const row = (name, ...kids) => el('div', { class: 'lj-isi' }, el('small', null, name), ...kids);
    const opt = (cur, v, l, patch) => onTap(el('button', { class: `seg-btn ${cur === v ? 'on' : ''}`, type: 'button' }, l), () => set(patch));
    panel.replaceChildren(el('b', { class: 'lj-judul' }, `${NODES[sel][2]} ${label(sel)}`),
      el('div', { class: 'seg' }, ...[['🔌 Lampu/Wi-Fi', () => { const d = diagnose(net, sel); tests++; say(msg, d.res[0].ok ? '' : 'bad', `${label(sel)}: ${d.res[0].text}`); animate(box, [sel], d.res[0].ok); }],
        ['ping gateway', () => show(ping(net, sel, c.gw || '0.0.0.0'))], ['ping server ujian', () => show(ping(net, sel, '192.168.10.5'))], [`ping ${INTERNET}`, () => show(ping(net, sel, INTERNET))],
        ['buka ujian.sekolah.example', () => show(open(net, sel, 'ujian.sekolah.example'))], ['buka bahan.belajar.example', () => show(open(net, sel, 'bahan.belajar.example'))]].map(([l, fn]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), fn))),
      hidden ? el('p', { class: 'lj-kode' }, 'Pengaturan disembunyikan. Gunakan uji, lalu tebak masalahnya.') : el('div', { class: 'lj-isian-isian' },
        row('Kabel', opt(c.link, true, 'tersambung', { link: true, ip: c.ip || `${NET}1${String(ENDS.indexOf(sel)).padStart(2, '0')}` }), opt(c.link, false, 'terlepas', { link: false })),
        row('Alamat IP', el('code', null, c.ip || 'tidak ada'), ...[['−1', () => ipShift(-1)], ['+1', () => ipShift(1)], ['jaringan .10/.11', () => set({ ip: (c.ip || `${NET}100`).replace(/^192\.168\.(10|11)\./, (m, x) => `192.168.${x === '10' ? 11 : 10}.`) })], ['DHCP', () => { let k = 100; while (owner(net, NET + k, sel) && k < 199) k++; set({ ip: NET + k, gw: ROUTER, dns: ROUTER }); }]].map(([l, fn]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), fn))),
        row('Gateway', ...[ROUTER, '192.168.10.254'].map((v) => opt(c.gw, v, v, { gw: v }))),
        row('DNS', ...[[ROUTER, ROUTER], ['192.168.100.1', '192.168.100.1'], ['', 'kosong']].map(([v, l]) => opt(c.dns, v, l, { dns: v })))));
    tools.replaceChildren(...[hidden ? null : onTap(el('button', { class: `seg-btn ${net.isp ? '' : 'on'}`, type: 'button' }, net.isp ? '🌐 Penyedia internet: normal' : '🌐 Penyedia internet: gangguan'), () => { net.isp = !net.isp; draw(); }),
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '🎲 Masalah acak'), () => { const f = randomFault(ctx.rand); net = f.net; hidden = f; sel = f.dev; tests = 0; draw(); say(msg, 'info', `${label(f.dev)} melapor: "Internetnya tidak bisa!" Temukan masalahnya dengan uji sesedikit mungkin.`); }),
      hidden ? el('span', { class: 'lj-tebak' }, el('b', null, 'Tebak:'), ...Object.entries(FAULTS).map(([k, f]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, f.label), () => {
        if (k !== hidden.fault) { ctx.mistake(); say(msg, 'bad', `Bukan ${f.label.toLowerCase()}. Jalankan uji lain.`); return; }
        ctx.sound.good(); say(msg, '', `Benar: ${f.label.toLowerCase()} di ${label(hidden.dev)} setelah ${tests} uji. ${f.fix}.`); hidden = null; draw();
      }))) : null,
      onTap(el('button', { class: 'seg-btn', type: 'button' }, '↩️ Pulihkan semua'), () => { net = makeNet(); hidden = null; tests = 0; draw(); say(msg, 'info', 'Semua pengaturan kembali benar.'); })].filter(Boolean));
  }
  wrap.append(el('p', { class: 'prompt' }, 'Lab jaringan virtual'), el('div', { class: 'lj-lab' }, box, panel), tools, msg);
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act lab-jaringan' });
  root.append(wrap);
  function start(n) {
    const pts = Array(n).fill(0); const turns = n * 2; let k = 0;
    const setter = () => k % n; const guesser = () => (k + 1) % n;
    function pick() {
      if (k >= turns) { finishBoard(wrap, ctx, { title: 'Masalah Tersembunyi selesai', pts, again: () => pickTeams(wrap, 'Masalah Tersembunyi', start) }); return; }
      wrap.replaceChildren(scoreBar(pts, setter()), el('p', { class: 'prompt' }, `Tim ${setter() + 1} memasang masalah tersembunyi. Tim ${guesser() + 1} berpaling dulu!`),
        el('div', { class: 'opts', style: { '--cols': 2 } }, ...[...Object.entries(FAULTS).map(([f, x]) => [f, x.label]), [null, '🎲 Acak']].map(([f, l]) => onTap(el('button', { class: 'opt', type: 'button' }, el('span', { class: 'opt-label' }, l)), () => { ctx.sound.tap(); hand(f || ctx.rand.pick(Object.keys(FAULTS))); }))));
    }
    function hand(fault) {
      wrap.replaceChildren(scoreBar(pts, guesser()), el('p', { class: 'prompt' }, `Masalah sudah dipasang. Serahkan panel ke Tim ${guesser() + 1}.`), el('div', { class: 'kode-baris' }, button('Tim siap ➜', () => guess(randomFault(ctx.rand, fault)), 'primary')));
    }
    function guess({ net, dev, fault }) {
      wrap.replaceChildren(scoreBar(pts, guesser()));
      let used = 0;
      const info = el('p', { class: 'reveal hint' }, 'Setiap uji mengurangi poin: 5 uji atau lebih tetap mendapat 1 poin bila tebakan benar.');
      diagGuess(wrap, ctx, { net, dev, fault, onTest: (t) => { used = t; info.textContent = `${t} uji · poin bila benar: ${Math.max(1, 6 - t)}`; }, done: (right) => {
        const p = right ? Math.max(1, 6 - used) : 0; pts[guesser()] += p;
        info.textContent = right ? `Tim ${guesser() + 1} benar dengan ${used} uji: +${p}.` : `Tim ${guesser() + 1} belum tepat: masalahnya ${FAULTS[fault].label.toLowerCase()}.`;
        k++; setTimeout(pick, 2800);
      } });
      wrap.append(info);
    }
    pick();
  }
  pickTeams(wrap, 'Masalah Tersembunyi', start);
}

// Team version: run tests, then one guess of the fault type.
function diagGuess(wrap, ctx, { net, dev, fault, onTest, done }) {
  const { res } = diagnose(net, dev);
  const shown = new Set(); let over = false;
  const box = el('div', { class: 'lj-peta kecil' });
  const tree = el('div', { class: 'lj-pohon' });
  const tail = el('div', { class: 'lj-ekor' });
  box.innerHTML = mapSvg(net, { sel: dev, hide: true, only: [] });
  const draw = () => {
    tree.replaceChildren(...STEPS.map((s, k) => el('div', { class: `lj-langkah ${shown.has(k) ? (res[k].ok === true ? 'ya' : 'tidak') : ''}` }, el('b', null, `${k + 1}`), el('span', null, s),
      shown.has(k) ? el('small', null, res[k].text) : onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Uji'), () => {
        if (over) return; shown.add(k); ctx.sound.tap(); onTest(shown.size);
        if (k >= 2) { const t0 = net.tick; const r = k === 2 ? ping(net, dev, net.cfg[dev].gw || '0.0.0.0') : k === 3 ? ping(net, dev, INTERNET) : open(net, dev, 'bahan.belajar.example'); net.tick = t0; animate(box, r.path, res[k].ok === true); }
        draw();
      }))));
    tail.replaceChildren(el('p', { class: 'lj-tanya' }, 'Tebak masalahnya:'), el('div', { class: 'seg' }, Object.entries(FAULTS).map(([f, x]) => onTap(el('button', { class: `seg-btn ${over && f === fault ? 'on' : ''}`, type: 'button' }, x.label), () => {
      if (over) return; over = true; if (f === fault) ctx.sound.good(); else ctx.sound.bad(); draw(); done(f === fault);
    }))));
  };
  wrap.append(el('p', { class: 'prompt' }, `${label(dev)} melapor: "Internetnya tidak bisa!"`), el('div', { class: 'lj-diag' }, box, el('div', { class: 'lj-kanan' }, tree, tail)));
  draw();
}
