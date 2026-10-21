// Teknisi Lab Komputer — SMA/SMK (16–18 tahun), jaringan komputer dan troubleshooting.
// A small school network: devices and network models, valid addresses, faulty
// configuration cards, a five-step diagnosis tree, Wi-Fi security settings and
// splitting the network with a /25 mask. Pings travel across a tappable map.

import { el, onTap, button, shake } from '../core/util.js';
import { choice } from '../core/kit.js';
import { say, pickTeams, scoreBar, finishBoard } from './sma-kit.js';

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
function matchRound(wrap, ctx, { done }) {
  const right = ctx.rand.shuffle(DEVICE_JOBS.map((p) => p[1]));
  const ok = new Set(); let sel = null;
  const box = el('div', { class: 'lj-cocok' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk perangkat, lalu tugasnya.');
  const draw = () => box.replaceChildren(el('div', { class: 'lj-kolom' }, DEVICE_JOBS.map(([l], i) => onTap(el('button', { class: `lj-item ${ok.has(i) ? 'cocok' : sel === i ? 'pilih' : ''}`, type: 'button' }, `${i + 1}. ${l}`), () => { if (ok.has(i)) return; sel = i; draw(); }))),
    el('div', { class: 'lj-kolom lebar' }, right.map((r) => { const i = DEVICE_JOBS.findIndex((p) => p[1] === r); return onTap(el('button', { class: `lj-item ${ok.has(i) ? 'cocok' : ''}`, type: 'button' }, r), () => {
      if (sel === null || ok.has(i)) return;
      if (sel !== i) { ctx.mistake(); shake(box); say(msg, 'bad', `${DEVICE_JOBS[sel][0]} bukan perangkat yang bertugas begitu.`); return; }
      ok.add(i); sel = null; ctx.sound.tap(); draw();
      if (ok.size === DEVICE_JOBS.length) { say(msg, '', 'Semua cocok: internet → modem → router → switch dan titik akses → komputer.'); done(); }
    }); })));
  wrap.append(el('p', { class: 'prompt' }, 'Perangkat jaringan sekolah: pasangkan setiap perangkat dengan tugasnya.'), box, msg);
  draw();
}

export const ADDRS = [['192.168.10.37', true, 'Di jaringan yang sama dan belum dipakai.'], ['192.168.10.0', false, 'Alamat jaringan.'], ['192.168.10.255', false, 'Alamat siaran.'], ['192.168.11.37', false, 'Jaringan lain: angka ketiganya 11.'], ['192.168.10.256', false, 'Bukan alamat sah: angka paling besar 255.'], ['192.168.10.1', false, 'Sudah dipakai router; alamatnya akan bentrok.']];
function addrRound(wrap, ctx, { done }) {
  const ans = {};
  const box = el('div', { class: 'lj-alamat' });
  const msg = el('p', { class: 'reveal info' }, 'Jaringan 192.168.10.0, subnet mask 255.255.255.0.');
  const draw = () => box.replaceChildren(...ADDRS.map(([ip, ok, why], i) => el('div', { class: `lj-baris ${i in ans ? (ok ? 'ya' : 'tidak') : ''}` }, el('code', null, ip),
    i in ans ? el('span', null, `${ok ? '✓ Boleh' : '✗ Tidak'} · ${why}`) : el('span', { class: 'lj-dua' }, ...[[true, 'Boleh'], [false, 'Tidak']].map(([v, l]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
      if (v !== ok) { ctx.mistake(); shake(box); say(msg, 'bad', ok ? `${ip} boleh: angka terakhir 1–254, jaringan sama, belum dipakai.` : `${ip} tidak boleh. Periksa angka ketiga, angka terakhir, dan alamat yang sudah dipakai.`); return; }
      ans[i] = v; ctx.sound.tap(); draw();
      if (Object.keys(ans).length === ADDRS.length) { say(msg, '', 'Semua alamat sudah diperiksa.'); done(); }
    }))))));
  wrap.append(el('p', { class: 'prompt' }, 'Komputer baru di lab: alamat mana yang boleh diberikan?'), box, msg);
  draw();
}

// PC1–PC6 config cards; the wrong field on each card, or null when it is right.
export const CARDS = [['PC1', '192.168.10.21', MASK, ROUTER, ROUTER, null, 'Benar'], ['PC2', '192.168.10.25', MASK, ROUTER, ROUTER, 'ip', 'Alamat bentrok dengan PC5 (.25); ganti, misalnya ke 192.168.10.22'], ['PC3', '192.168.11.23', MASK, ROUTER, ROUTER, 'ip', 'Alamat di jaringan lain; ubah ke 192.168.10.23'], ['PC4', '192.168.10.24', MASK, '192.168.10.254', ROUTER, 'gw', 'Gateway salah: tidak ada perangkat di .254; ubah ke 192.168.10.1'], ['PC5', '192.168.10.25', MASK, ROUTER, ROUTER, 'ip', 'Alamat bentrok dengan PC2 (.25); ganti salah satunya'], ['PC6', '192.168.10.26', MASK, ROUTER, '', 'dns', 'DNS kosong; isi 192.168.10.1']];
const FIELDS = [['ip', 'Alamat IP', 1], ['mask', 'Subnet mask', 2], ['gw', 'Gateway', 3], ['dns', 'DNS', 4]];
function cardsRound(wrap, ctx, { done }) {
  const solved = new Set();
  const box = el('div', { class: 'lj-kartu-kartu' });
  const msg = el('p', { class: 'reveal info' }, 'Ketuk isian yang salah pada setiap kartu, atau ✓ Benar bila tidak ada masalah.');
  const hit = (i, f) => {
    if (solved.has(i)) return;
    const card = CARDS[i];
    if (f !== card[5]) { ctx.mistake(); shake(box); say(msg, 'bad', f ? `${card[0]}: isian ${FIELDS.find((x) => x[0] === f)[1].toLowerCase()} itu benar.` : `${card[0]} masih punya masalah. Bandingkan dengan kartu lain.`); return; }
    solved.add(i); ctx.sound.tap(); say(msg, 'info', `${card[0]}: ${card[6]}.`); draw();
    if (solved.size === CARDS.length) { say(msg, '', 'Semua kartu diperiksa: PC1 benar, PC2 dan PC5 bentrok, PC3 di jaringan lain, PC4 gateway salah, PC6 DNS kosong.'); done(); }
  };
  const draw = () => box.replaceChildren(...CARDS.map((c, i) => el('div', { class: `lj-kartu ${solved.has(i) ? 'beres' : ''}` }, el('b', null, c[0]),
    ...FIELDS.map(([f, l, k]) => onTap(el('button', { class: `lj-isian ${solved.has(i) && c[5] === f ? 'salah' : ''}`, type: 'button' }, el('small', null, l), el('span', null, c[k] || '(kosong)')), () => hit(i, f))),
    solved.has(i) ? el('small', { class: 'lj-catat' }, c[6]) : onTap(el('button', { class: 'seg-btn', type: 'button' }, '✓ Benar'), () => hit(i, null)))));
  wrap.append(el('p', { class: 'prompt' }, 'Kartu konfigurasi lab: temukan isian yang salah.'), box, msg);
  draw();
}

// Diagnosis: run tests, choose where the check stops, then the cause and fix.
function diagFlow(wrap, ctx, { net, dev, title, lines = [], fault, done }) {
  const { res, stop } = diagnose(net, dev);
  const shown = new Set(); let tests = 0; let phase = 'uji';
  const box = el('div', { class: 'lj-peta kecil' });
  const tree = el('div', { class: 'lj-pohon' });
  const tail = el('div', { class: 'lj-ekor' });
  const msg = el('p', { class: 'reveal info' }, 'Jalankan uji pada pohon diagnosis. Berhenti pada langkah pertama yang jawabannya "tidak".');
  box.innerHTML = mapSvg(net, { sel: dev, hide: true, only: [] });
  const run = (k) => {
    if (shown.has(k) || phase !== 'uji') return;
    shown.add(k); tests++; ctx.sound.tap();
    if (k >= 2) { const t0 = net.tick; const r = k === 2 ? ping(net, dev, net.cfg[dev].gw || '0.0.0.0') : k === 3 ? ping(net, dev, INTERNET) : open(net, dev, 'bahan.belajar.example'); net.tick = t0; animate(box, r.path, res[k].ok === true); }
    draw();
  };
  const draw = () => {
    tree.replaceChildren(...STEPS.map((s, k) => el('div', { class: `lj-langkah ${shown.has(k) ? (res[k].ok === true ? 'ya' : 'tidak') : ''}` }, el('b', null, `${k + 1}`), el('span', null, s),
      shown.has(k) ? el('small', null, res[k].text) : onTap(el('button', { class: 'seg-btn', type: 'button' }, 'Uji'), () => run(k)))));
    tail.replaceChildren();
    if (phase === 'uji') tail.append(el('p', { class: 'lj-tanya' }, 'Pemeriksaan berhenti di:'), el('div', { class: 'seg' }, [1, 2, 3, 4, 5, 6].map((s) => onTap(el('button', { class: 'seg-btn', type: 'button' }, STOP_LABEL(s)), () => {
      if (s !== stop) { ctx.mistake(); shake(tail); say(msg, 'bad', shown.size < s ? 'Jalankan uji dulu sebelum menyimpulkan.' : s > stop ? `Ada langkah sebelum ${s} yang jawabannya "tidak".` : `Langkah ${s} lolos; lanjutkan uji.`); return; }
      phase = 'sebab'; ctx.sound.tap(); say(msg, 'info', `Berhenti di langkah ${stop}: ${fault ? FAULTS[fault].kind.toLowerCase() : 'jaringan baik'}.`); draw();
      const opts = ctx.rand.shuffle(Object.keys(FAULTS).filter((f) => f !== fault)).slice(0, 3).map((f) => [`${FAULTS[f].label}: ${FAULTS[f].fix.toLowerCase()}`]);
      choice(tail, { prompt: 'Penyebab dan perbaikannya?', ctx, shuffle: true, columns: 1, onRight: () => { say(msg, '', `${FAULTS[fault].label}. ${FAULTS[fault].fix}.`); done(tests); }, options: [[`${FAULTS[fault].label}: ${FAULTS[fault].fix.toLowerCase()}`, true], ...opts].map(([l, c]) => ({ label: l, correct: !!c })) });
    }))));
  };
  wrap.append(el('p', { class: 'prompt' }, title), el('div', { class: 'lj-diag' }, el('div', { class: 'lj-kiri' }, lines.length ? el('ul', { class: 'lj-laporan' }, lines.map((l) => el('li', null, l))) : null, box), el('div', { class: 'lj-kanan' }, tree, tail)), msg);
  draw();
}

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
  ['Kata sandi Wi-Fi', '12345678, ditempel di dinding kantin', [['Kalimat sandi panjang (≥ 12 karakter), hanya untuk yang berhak, diganti berkala', true, '12345678 termasuk yang paling sering ditebak.'], ['sekolah2026, tidak ditempel', false]]],
  ['Akun pengelola', 'admin / admin', [['Kata sandi kuat yang hanya diketahui pengelola', true, 'admin/admin diketahui umum.'], ['admin / admin123', false]]],
  ['Jaringan ponsel murid dan tamu', 'sama dengan lab dan server ujian', [['Jaringan tamu yang terpisah', true, 'Ponsel berprogram jahat tidak lagi menjangkau server ujian.'], ['Tetap sama, tetapi kata sandinya diganti', false]]],
  ['WPS (tombol atau PIN 8 angka)', 'aktif', [['Matikan WPS', true, 'PIN diperiksa dua bagian dan angka terakhirnya angka cek: cukup 10.000 + 1.000 = 11.000 percobaan, bukan 100 juta.'], ['Ganti PIN dengan 8 angka lain', false]]],
  ['Perangkat lunak (firmware)', 'terakhir diperbarui 4 tahun lalu', [['Perbarui dan periksa pembaruan berkala', true, 'Firmware lama punya celah yang sudah diketahui umum.'], ['Biarkan, selama masih menyala', false]]],
  ['Halaman pengaturan', 'hanya dari ruang server lewat kabel', [['Buka juga dari Wi-Fi supaya praktis', false]]],
];
function wifiRound(wrap, ctx, { done }) {
  const fixed = WIFI.map((w, i) => (i === 6 ? null : false));
  const box = el('div', { class: 'lj-wifi' });
  const meter = el('div', { class: 'lj-meter' });
  const msg = el('p', { class: 'reveal info' }, 'Untuk setiap pengaturan: biarkan bila sudah aman, atau pilih perbaikannya.');
  const draw = () => {
    const s = fixed.slice(0, 6).filter((x) => x === true).length + 1;
    meter.replaceChildren(el('span', null, `Nilai keamanan ${Math.round((s / 7) * 100)}`), el('i', { style: { width: `${(s / 7) * 100}%` } }));
    box.replaceChildren(...WIFI.map(([name, cur, opts], i) => el('div', { class: `lj-atur ${fixed[i] === true ? 'aman' : ''}` }, el('b', null, `${i + 1}. ${name}`), el('span', null, fixed[i] === true ? (i === 6 ? cur : opts.find((o) => o[1])[0]) : cur),
      fixed[i] === true ? el('small', null, i === 6 ? '✓ Sudah aman.' : `✓ ${opts.find((o) => o[1])[2]}`) : el('div', { class: 'seg' }, ...[['Biarkan (aman)', i === 6], ...opts.map(([l, ok]) => [l, ok])].map(([l, ok]) => onTap(el('button', { class: 'seg-btn', type: 'button' }, l), () => {
        if (!ok) { ctx.mistake(); shake(box); say(msg, 'bad', i === 6 ? 'Jangan: siapa pun yang tersambung ke Wi-Fi bisa mencoba mengubah pengaturan.' : l.startsWith('Biarkan') ? `"${cur}" belum aman.` : 'Perbaikan itu belum cukup aman.'); return; }
        fixed[i] = true; ctx.sound.tap(); say(msg, 'info', i === 6 ? 'Benar: halaman pengaturan hanya bisa dibuka lewat kabel dari ruang server.' : opts.find((o) => o[1])[2]); draw();
        if (fixed.every((x) => x === true)) { say(msg, '', 'Wi-Fi sekolah kini aman: WPA2/WPA3, sandi kuat, akun pengelola kuat, jaringan tamu, WPS mati, firmware baru.'); done(); }
      }))))));
  };
  wrap.append(el('p', { class: 'prompt' }, 'Wi-Fi sekolah yang aman: periksa ketujuh pengaturan titik akses.'), meter, box, msg);
  draw();
}

function subnetBar(marks = []) {
  return el('div', { class: 'lj-subnet' }, el('div', { class: 'lj-bagian lab' }, el('b', null, 'Lab'), el('span', null, '.0 jaringan · .1–.126 · .127 siaran')), el('div', { class: 'lj-bagian kantor' }, el('b', null, 'Kantor'), el('span', null, '.128 jaringan · .129–.254 · .255 siaran')),
    ...marks.map(([x, t]) => el('i', { class: 'lj-tanda', style: { left: `${(x / 256) * 100}%` } }, t)));
}

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
    const wrap = el('div', { class: 'act lab-jaringan' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null, onRight = next) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      const then = (fn) => () => { wrap.replaceChildren(); fn(); };
      const models = [['Komputer dan printer di lab sekolah', 'LAN'], ['Ponsel yang tersambung ke jam tangan pintar dan pengeras suara nirkabel pemiliknya', 'PAN'], ['Kamera lalu lintas di puluhan persimpangan satu kota', 'MAN'], ['Kantor pusat bank dengan kantor cabang di 30 provinsi', 'WAN']];
      const model = (i) => (i < models.length ? ask(`Jenis jaringan: ${models[i][0]}?`, ['PAN', 'LAN', 'MAN', 'WAN'].map((m) => [m, m === models[i][1]]), 4, null, then(() => model(i + 1)))
        : ask('Lab memakai topologi bintang. Apa akibatnya jika kabel PC3 putus, dan jika switch mati?', [['Kabel PC3 putus: hanya PC3 terputus. Switch mati: semua perangkat berkabel terputus, termasuk server ujian', true], ['Kabel PC3 putus: semua PC terputus. Switch mati: hanya PC3'], ['Keduanya hanya memutus PC3'], ['Keduanya tidak berakibat, karena ada Wi-Fi']]));
      if (r === 0) matchRound(wrap, ctx, { done: next });
      else if (r === 1) model(0);
      else if (r === 2) addrRound(wrap, ctx, { done: then(() => ask('Paling banyak berapa perangkat yang bisa diberi alamat di jaringan 192.168.10.0 dengan subnet mask 255.255.255.0?', [[254, true], [256], [255], [253]], 4)) });
      else if (r === 3) ask('DHCP membagikan alamat 192.168.10.100 sampai 192.168.10.199. Berapa perangkat yang bisa mendapat alamat otomatis?', [[100, true], [99], [199], [254]], 4, null,
        then(() => ask('Semua alamat DHCP terpakai, lalu perangkat berikutnya memberi dirinya alamat 169.254.80.3. Bisakah ia membuka server ujian?', [['Tidak: 169.254.x.y bukan jaringan 192.168.10.x, jadi ia tidak bisa berkirim data dengan server maupun router', true], ['Bisa, karena server ada di dalam sekolah'], ['Bisa, asal DNS-nya benar'], ['Tidak, karena kabelnya pasti terlepas']], 1, null,
          then(() => ask('Mengapa server ujian dan printer diberi alamat tetap di luar rentang DHCP?', [['Supaya alamatnya tidak berubah dan selalu ditemukan, dan DHCP tidak membagikan alamat yang sama ke perangkat lain', true], ['Supaya lebih cepat dari komputer murid'], ['Karena DHCP tidak bisa memberi alamat ke printer'], ['Supaya bisa dibuka dari internet']])))));
      else if (r === 4) cardsRound(wrap, ctx, { done: next });
      else if (r === 5) ask('PC4 (gateway 192.168.10.254) bisa membuka server ujian di 192.168.10.5, tetapi tidak bisa membuka situs di internet. Mengapa?', [['Server di jaringan yang sama, jadi data dikirim langsung lewat switch; gateway hanya dipakai untuk data ke luar jaringan', true], ['Server ujian tidak butuh kabel'], ['Gateway yang salah hanya mengganggu internet pada jam tertentu'], ['DNS PC4 kosong']], 1, el('div', { class: 'lj-kode' }, 'PC4 · IP 192.168.10.24 · mask 255.255.255.0 · gateway 192.168.10.254 · DNS 192.168.10.1'),
        then(() => ask('PC6 (DNS kosong) bisa membuka server jika mengetik 192.168.10.5, tetapi tidak jika mengetik ujian.sekolah.example. Mengapa?', [['Tidak ada DNS yang menerjemahkan nama menjadi 192.168.10.5; alamat yang diketik langsung tidak butuh DNS', true], ['Nama situsnya salah ketik'], ['Gateway PC6 salah'], ['Server ujian hanya menerima alamat IP pada hari ujian']], 1, el('div', { class: 'lj-kode' }, 'PC6 · IP 192.168.10.26 · mask 255.255.255.0 · gateway 192.168.10.1 · DNS (kosong)'))));
      else if (r === 6) {
        const rep = (i) => { const R = REPORTS[i]; diagFlow(wrap, ctx, { net: reportNet(R), dev: R.dev, fault: R.fault, title: R.title, done: then(() => (i < 2 ? rep(i + 1) : ask('Esok pagi semua komputer bisa ping gateway, tetapi tidak ada yang bisa ping 203.0.113.10. Di mana masalahnya, dan bisakah ujian tetap berjalan?', [['Sambungan internet (modem atau penyedia); ujian tetap jalan karena server ujian ada di jaringan sekolah', true], ['Switch; ujian batal'], ['DNS semua komputer; ujian batal'], ['Sambungan internet; ujian batal karena soal ada di internet']]))) }); };
        rep(0);
      } else if (r === 7) {
        const f = randomFault(ctx.rand);
        diagFlow(wrap, ctx, { ...f, title: `Laporan acak: ${label(f.dev)}, "Internetnya tidak bisa!"`, done: then(() => ask('Mengapa pemeriksaan dimulai dari kabel, bukan langsung dari DNS?', [['Setiap langkah bergantung pada langkah di bawahnya; kalau kabel lepas semua uji gagal, dan memeriksa lampu paling cepat', true], ['Karena kabel paling sering rusak, lainnya jarang'], ['Karena DNS tidak bisa diperiksa'], ['Urutannya bebas, hasilnya sama']])) });
      } else if (r === 8) wifiRound(wrap, ctx, { done: next });
      else ask('Tantangan: 192.168.10.0 dibagi dua dengan subnet mask 255.255.255.128. Berapa alamat yang bisa dipakai perangkat di setiap bagian?', [[126, true], [128], [127], [254]], 4, subnetBar(),
        then(() => ask('Komputer 192.168.10.100 dan 192.168.10.130 masuk bagian mana, dan bisakah keduanya berkirim data langsung lewat switch tanpa router?', [['.100 lab, .130 kantor; tidak bisa, karena kini berbeda jaringan dan data harus lewat gateway', true], ['Keduanya lab; bisa langsung'], ['.100 lab, .130 kantor; bisa langsung karena tersambung ke switch yang sama'], ['.100 kantor, .130 lab; tidak bisa']], 1, subnetBar([[100, '.100'], [130, '.130']]),
          then(() => ask('Mengapa rentang DHCP 192.168.10.100–192.168.10.199 harus diubah?', [['Rentang itu melewati batas kedua bagian dan memuat .127 (alamat siaran) dan .128 (alamat jaringan); setiap bagian perlu rentang sendiri', true], ['Karena terlalu sedikit alamat'], ['Karena DHCP tidak boleh dipakai di lab'], ['Tidak perlu diubah']], 1, subnetBar([[100, '100'], [199, '199']]))))));
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
