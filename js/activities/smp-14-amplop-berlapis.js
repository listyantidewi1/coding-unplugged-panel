// Surat dalam Amplop Berlapis — SMP (13–15 tahun), jaringan dan internet.
// A message travels the school network wrapped in layers: the application
// writes it, transport cuts it into numbered pieces, internet addresses each
// envelope and every router forwards it by the first matching table row.

import { el, onTap, button, shake, makeRng, newSeed } from '../core/util.js';
import { choice } from '../core/kit.js';

export const DEVICES = {
  rani: { name: 'Laptop Rani', ip: '10.1.0.12', icon: '💻' },
  joko: { name: 'Laptop Joko', ip: '10.1.0.15', icon: '💻' },
  printer: { name: 'Printer Lab', ip: '10.2.0.9', icon: '🖨️' },
  perpus: { name: 'Server Perpustakaan', ip: '10.3.0.7', icon: '🗄️' },
  nilai: { name: 'Server Nilai', ip: '10.3.0.8', icon: '🗄️' },
  dns: { name: 'Server DNS', ip: '10.3.0.2', icon: '📒' },
};
export const DNS = { 'perpus.sekolah': '10.3.0.7', 'nilai.sekolah': '10.3.0.8', 'printer.lab': '10.2.0.9' };
export const APP = { 'perpus.sekolah': 'perpustakaan', 'nilai.sekolah': 'nilai', 'printer.lab': 'cetak' };
export const TABLES = {
  R1: [['10.1.', 'langsung'], ['lainnya', 'R2']],
  R2: [['10.1.', 'R1'], ['10.2.', 'langsung'], ['10.3.', 'R3']],
  R3: [['10.3.', 'langsung'], ['lainnya', 'R2']],
};
// Backup cable R1–R3: the new rows are read before "lainnya".
export const BACKUP = {
  R1: [['10.1.', 'langsung'], ['10.3.', 'R3'], ['lainnya', 'R2']],
  R2: TABLES.R2,
  R3: [['10.3.', 'langsung'], ['10.1.', 'R1'], ['lainnya', 'R2']],
};
export const MESSAGE = 'PINJAM BUKU IPA KELAS 8';
export const LAYERS = ['Aplikasi', 'Transport', 'Internet', 'Jaringan fisik'];
export const JOBS = [
  ['Memilih jalan di setiap router', 'Internet'],
  ['Menyusun ulang potongan menurut nomor urut', 'Transport'],
  ['Mengubah amplop menjadi sinyal Wi-Fi', 'Jaringan fisik'],
  ['Menulis "PINJAM BUKU IPA KELAS 8"', 'Aplikasi'],
  ['Menulis alamat IP asal dan tujuan', 'Internet'],
  ['Meminta amplop yang hilang dikirim ulang', 'Transport'],
];

export const routerOf = (ip) => `R${ip.split('.')[1]}`;
export const deviceAt = (ip) => Object.keys(DEVICES).find((d) => DEVICES[d].ip === ip);
export const chunks = (msg, n = 8) => Array.from({ length: Math.ceil(msg.length / n) }, (_, i) => msg.slice(i * n, i * n + n));
export const rowFor = (tables, r, dest) => tables[r].findIndex(([p]) => p === 'lainnya' || dest.startsWith(p));
// Hops: [router, row index] until delivery; null if a router is down or a loop.
export function path(fromIp, toIp, tables = TABLES, down = new Set()) {
  const hops = [];
  let r = routerOf(fromIp);
  while (hops.length < 6) {
    if (down.has(r)) return { hops, ok: false, stop: r };
    const i = rowFor(tables, r, toIp);
    hops.push([r, i]);
    const to = tables[r][i][1];
    if (to === 'langsung') return { hops, ok: true };
    r = to;
  }
  return { hops, ok: false };
}
const vis = (s) => s.replace(/ /g, '␣');

// Network map: three rooms, routers in the middle row, an envelope marker.
const SPOT = { rani: [7, 18], joko: [7, 70], R1: [26, 44], printer: [50, 14], R2: [50, 60], R3: [74, 44], perpus: [93, 14], nilai: [93, 44], dns: [93, 76] };
const WIRES = [['rani', 'R1', 'wifi'], ['joko', 'R1', 'wifi'], ['R1', 'R2'], ['printer', 'R2'], ['R2', 'R3'], ['R3', 'perpus'], ['R3', 'nilai'], ['R3', 'dns']];
function netMap({ at = null, down = new Set(), backup = false, hi = [] } = {}) {
  const wires = backup ? [...WIRES, ['R1', 'R3', 'cadangan']] : WIRES;
  const svg = el('div', { class: 'ab-kabel' });
  svg.innerHTML = `<svg viewBox="0 0 100 90" preserveAspectRatio="none"><rect x="1" y="2" width="33" height="86" rx="2" class="ruang"/><rect x="37" y="2" width="26" height="86" rx="2" class="ruang"/><rect x="66" y="2" width="33" height="86" rx="2" class="ruang"/>
    ${wires.map(([a, b, k]) => `<line x1="${SPOT[a][0]}" y1="${SPOT[a][1]}" x2="${SPOT[b][0]}" y2="${SPOT[b][1]}" class="${k || ''}"/>`).join('')}</svg>`;
  const rooms = [['Kelas 8A', 17], ['Lab Komputer', 50], ['Ruang Server', 82]].map(([t, x]) => el('span', { class: 'ab-ruang', style: `left:${x}%` }, t));
  const nodes = Object.entries(SPOT).map(([k, [x, y]]) => {
    const d = DEVICES[k];
    return el('span', { class: `ab-simpul ${d ? 'perangkat' : 'router'} ${down.has(k) ? 'mati' : ''} ${hi.includes(k) ? 'hi' : ''}`, style: `left:${x}%;top:${(y / 90) * 100}%`, 'data-k': k },
      d ? [el('b', null, d.icon), el('small', null, d.name.replace('Server ', '').replace('Laptop ', '')), el('small', { class: 'ab-ip' }, d.ip)] : [el('b', null, down.has(k) ? '✖' : '📡'), el('small', null, k)]);
  });
  const env = at ? el('span', { class: 'ab-amplop', style: `left:${SPOT[at][0] + 4}%;top:${((SPOT[at][1] - 8) / 90) * 100}%` }, '✉️') : null;
  return el('div', { class: 'ab-peta' }, ...[svg, ...rooms, ...nodes, env].filter(Boolean));
}

function tableView(tables, r, { onRow, hi = -1, bad = -1 } = {}) {
  return el('div', { class: 'ab-tabel' }, el('b', null, `Tabel penerusan ${r}`), ...tables[r].map(([p, to], i) => {
    const b = el('button', { class: `ab-baris ${hi === i ? 'benar' : ''} ${bad === i ? 'salah' : ''}`, type: 'button', 'data-row': i }, el('span', null, p === 'lainnya' ? 'lainnya' : `diawali ${p}`), el('span', null, '→'), el('span', null, to === 'langsung' ? 'langsung ke perangkat' : to));
    return onRow ? onTap(b, () => onRow(i)) : b;
  }));
}

function envelope(e, { lost = false } = {}) {
  return el('div', { class: `ab-luar ${lost ? 'hilang' : ''}` }, el('small', null, `IP ${e.src} → ${e.dst}`),
    el('div', { class: 'ab-tengah' }, el('small', null, `${e.seq} dari ${e.total} · ${e.app}`), el('div', { class: 'ab-isi' }, lost ? '?' : vis(e.text))));
}
export const wrapAll = (msg, src, name) => chunks(msg).map((text, i, a) => ({ text, seq: i + 1, total: a.length, app: APP[name], src, dst: DNS[name] }));

// Route one envelope: tap the right row of each router's table.
function routeRound(wrap, ctx, { from, to, prompt, tables = TABLES, done, turn }) {
  const dest = DEVICES[to].ip;
  const want = path(DEVICES[from].ip, dest, tables).hops;
  let k = 0;
  let finished = false;
  const stage = el('div', { class: 'ab-samping' });
  const msg = el('p', { class: 'reveal info' });
  const trail = [];
  function draw(bad = -1) {
    const r = finished ? null : want[k][0];
    if (!finished && bad < 0) { msg.className = 'reveal info'; msg.textContent = `Amplop di ${r}. Tujuan ${dest}. Ketuk baris tabel yang cocok (dibaca dari atas).`; }
    stage.replaceChildren(netMap({ at: finished ? to : r, hi: [from, to] }), el('div', { class: 'ab-kanan' }, r ? tableView(tables, r, { onRow: row, bad }) : null,
      el('p', { class: 'ab-jejak' }, [DEVICES[from].name, ...trail, ...(finished ? [DEVICES[to].name] : [])].join(' → '))));
  }
  function row(i) {
    if (finished) return;
    const [r, w] = want[k];
    if (i !== w) {
      const [p, t] = tables[r][i];
      msg.className = 'reveal bad';
      msg.textContent = p !== 'lainnya' && !dest.startsWith(p) ? `${dest} tidak diawali ${p}. Amplop ditolak.` : `Ada baris di atasnya yang sudah cocok. Bila diteruskan ke ${t}, amplop tersesat.`;
      ctx.mistake();
      turn?.(false);
      shake(stage);
      draw(i);
      return;
    }
    ctx.sound.tap();
    turn?.(true);
    const [p, t] = tables[r][i];
    trail.push(`${r} (${p} → ${t})`);
    k++;
    if (k === want.length) {
      finished = true;
      draw();
      msg.className = 'reveal';
      msg.textContent = `Sampai di ${DEVICES[to].name} lewat ${want.length} router.`;
      done?.();
      return;
    }
    draw();
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, prompt), stage, msg);
}

// Fill the envelopes: place pieces by number, then choose both addresses.
function wrapRound(wrap, ctx, { msg: text, from, name, done }) {
  const want = wrapAll(text, DEVICES[from].ip, name);
  const order = ctx.rand.shuffle(want.map((_, i) => i));
  const slots = want.map(() => null);
  let held = null;
  let src = null;
  let dst = null;
  let finished = false;
  const stage = el('div');
  const note = el('p', { class: 'reveal info' }, 'Ketuk potongan, lalu ketuk amplop bernomor yang tepat. Spasi ditulis ␣.');
  const ips = [...new Set(Object.values(DEVICES).map((d) => d.ip))];
  const ipSeg = (cur, set) => el('div', { class: 'seg' }, ips.map((ip) => onTap(el('button', { class: `seg-btn ${cur === ip ? 'on' : ''}`, type: 'button', 'data-ip': ip }, ip), () => { set(ip); draw(); })));
  function draw(bad = []) {
    stage.replaceChildren(
      el('div', { class: 'ab-potongan' }, order.filter((i) => !slots.includes(i)).map((i) => onTap(el('button', { class: `ab-chip ${held === i ? 'pegang' : ''}`, type: 'button', 'data-i': i }, vis(want[i].text)), () => { held = i; draw(); }))),
      el('div', { class: 'ab-amplop-baris' }, want.map((e, s) => onTap(el('button', { class: `ab-luar ${bad.includes(s) ? 'salah' : ''}`, type: 'button', 'data-s': s }, el('small', null, `IP ${src || '?'} → ${dst || '?'}`),
        el('div', { class: 'ab-tengah' }, el('small', null, `${s + 1} dari ${want.length} · ${e.app}`), el('div', { class: 'ab-isi' }, slots[s] === null ? '…' : vis(want[slots[s]].text)))), () => {
        if (finished) return;
        if (held === null) { if (slots[s] !== null) { slots[s] = null; draw(); } return; }
        slots[s] = held; held = null; ctx.sound.tap(); draw();
      }))),
      el('div', { class: 'ab-alamat' }, el('span', null, 'Alamat asal'), ipSeg(src, (v) => { src = v; }), el('span', null, 'Alamat tujuan'), ipSeg(dst, (v) => { dst = v; })));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, `${DEVICES[from].name} (${DEVICES[from].ip}) mengirim "${text}" ke ${name}. DNS: ${name} = ${DNS[name]}. Potong setiap 8 karakter.`), stage,
    el('div', { class: 'kode-baris' }, button('Periksa', () => {
      if (finished) return;
      const bad = slots.map((v, s) => (v !== s ? s : -1)).filter((s) => s >= 0);
      const errs = [];
      if (bad.length) errs.push('urutan potongan');
      if (src !== DEVICES[from].ip) errs.push('alamat asal');
      if (dst !== DNS[name]) errs.push('alamat tujuan');
      if (errs.length) { draw(bad); note.className = 'reveal bad'; note.textContent = `Periksa lagi: ${errs.join(', ')}.`; ctx.mistake(); return; }
      finished = true;
      note.className = 'reveal';
      note.textContent = `Tiga amplop siap: ${want.map((e) => `"${vis(e.text)}"`).join(', ')}, semuanya dari ${src} ke ${dst}.`;
      done();
    }, 'primary')), note);
}

// Pieces arrive out of order: tap them in sequence-number order.
function reorderRound(wrap, ctx, { arrival, done }) {
  const want = wrapAll(MESSAGE, DEVICES.rani.ip, 'perpus.sekolah');
  const got = [];
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, `Dibaca menurut urutan tiba: "${arrival.map((i) => want[i].text).join('')}". Ketuk amplop menurut nomor urut.`);
  function draw() {
    stage.replaceChildren(el('div', { class: 'ab-amplop-baris' }, arrival.map((i) => onTap(el('div', { class: `ab-tiba ${got.includes(i) ? 'sudah' : ''}`, 'data-i': i }, envelope(want[i])), () => {
      if (finished || got.includes(i)) return;
      if (i !== got.length) { msg.className = 'reveal bad'; msg.textContent = `Berikutnya nomor ${got.length + 1}.`; ctx.mistake(); shake(stage); return; }
      got.push(i);
      ctx.sound.tap();
      if (got.length === want.length) { finished = true; msg.className = 'reveal'; msg.textContent = `Disusun ulang: "${MESSAGE}".`; done(); }
      draw();
    }))), el('p', { class: 'ab-jejak' }, `Pesan: ${got.map((i) => want[i].text).join('') || '…'}`));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Amplop tiba di server tidak berurutan.'), stage, msg);
}

// Choose a layer for each job.
function layerRound(wrap, ctx, { done }) {
  const pick = {};
  let finished = false;
  const stage = el('div');
  const msg = el('p', { class: 'reveal info' }, 'Pilih lapisan untuk setiap pekerjaan.');
  function draw(bad = []) {
    stage.replaceChildren(el('div', { class: 'ab-lapisan' }, JOBS.map(([job], i) => el('div', { class: `ab-lap-baris ${bad.includes(i) ? 'salah' : ''}` }, el('span', null, `${'abcdef'[i]}. ${job}`),
      el('div', { class: 'seg' }, LAYERS.map((l) => onTap(el('button', { class: `seg-btn ${pick[i] === l ? 'on' : ''}`, type: 'button', 'data-i': i, 'data-l': l }, l), () => { if (!finished) { pick[i] = l; draw(); } })))))));
  }
  draw();
  wrap.append(el('p', { class: 'prompt' }, 'Siapa mengerjakan apa?'), stage, el('div', { class: 'kode-baris' }, button('Periksa', () => {
    if (finished) return;
    const bad = JOBS.map(([, l], i) => (pick[i] !== l ? i : -1)).filter((i) => i >= 0);
    if (bad.length) { draw(bad); msg.className = 'reveal bad'; msg.textContent = `${bad.length} pekerjaan belum tepat.`; ctx.mistake(); return; }
    finished = true;
    msg.className = 'reveal';
    msg.textContent = 'Benar semua. Setiap lapisan mengurus tugasnya sendiri.';
    done();
  }, 'primary')), msg);
}

export default {
  id: 'smp-14-amplop-berlapis',
  title: 'Surat dalam Amplop Berlapis',
  topic: 'Jaringan: DNS, alamat IP, router, dan lapisan protokol',
  jenjang: 'smp',
  age: '13–15 tahun',
  icon: '✉️',
  source: null,
  rounds: 10,
  maxPlayers: 4,
  goal: 'Murid mengubah nama menjadi alamat IP, membungkus potongan pesan dengan nomor urut dan alamat, menelusuri jalan amplop dengan tabel penerusan, menyusun ulang potongan, dan menghubungkan pekerjaan dengan lapisannya.',
  extraModes: [
    { id: 'bungkus', icon: '📦', label: 'Pembungkus Amplop', desc: 'Ketik pesan, pilih tujuan, lihat DNS dan amplop berlapisnya', create: createWrapper },
    { id: 'jaringan', icon: '🛠️', label: 'Gangguan Jaringan', desc: 'Kirim pesan, lalu acak urutan tiba, hilangkan amplop, atau matikan router', create: createNetwork },
    { id: 'tim', icon: '🎯', label: 'Tim Router', desc: 'Tim menjadi R1, R2, R3, dan server; setiap tim memutuskan langkah untuk perangkatnya', create: createTeams },
  ],
  create(root, ctx) {
    const wrap = el('div', { class: 'act amplop' });
    root.append(wrap);
    function render() {
      wrap.replaceChildren();
      const r = ctx.round;
      let solved = false;
      const next = () => { if (!solved) { solved = true; if (ctx.solved()) setTimeout(render, 2400); } };
      const ask = (prompt, opts, columns = 1, subject = null) => choice(wrap, { prompt, subject, ctx, shuffle: true, onRight: next, columns, options: opts.map(([l, correct]) => ({ label: String(l), correct })) });
      if (r === 0) {
        const name = ctx.rand.pick(Object.keys(DNS));
        ask(`Komputer tidak mengerti nama. Tanya DNS: alamat IP ${name} adalah …`, Object.values(DEVICES).map((d) => [d.ip, d.ip === DNS[name]]), 3,
          el('table', { class: 'kls-tabel ab-dns' }, el('thead', null, el('tr', null, el('th', null, 'Nama'), el('th', null, 'Alamat IP'))), el('tbody', null, ...Object.entries(DNS).map(([n, ip]) => el('tr', null, el('td', null, n), el('td', null, ip))))));
      } else if (r === 1) wrapRound(wrap, ctx, { msg: MESSAGE, from: 'rani', name: 'perpus.sekolah', done: next });
      else if (r === 2) routeRound(wrap, ctx, { from: 'rani', to: 'perpus', prompt: 'Antar amplop Rani ke Server Perpustakaan (10.3.0.7).', done: next });
      else if (r === 3) routeRound(wrap, ctx, { from: 'perpus', to: 'rani', prompt: 'Server membalas "BUKU SIAP DIAMBIL" ke Rani (10.1.0.12).', done: next });
      else if (r === 4) routeRound(wrap, ctx, { from: 'joko', to: 'printer', prompt: 'Joko mencetak tugas ke printer.lab (10.2.0.9).', done: next });
      else if (r === 5) reorderRound(wrap, ctx, { arrival: [2, 0, 1], done: next });
      else if (r === 6) ask('Amplop 2 hilang. Server menerima "1 dari 3" dan "3 dari 3". Apa yang terjadi?', [['Dari nomor urut server tahu nomor 2 belum datang dan meminta kirim ulang; ini tugas lapisan Transport', true], ['Server menebak isinya; tugas lapisan Aplikasi'], ['Router mencari amplop yang hilang; tugas lapisan Internet'], ['Pesan dibaca tanpa potongan 2; tidak ada yang mengurus']], 1, el('div', { class: 'ab-amplop-baris' }, wrapAll(MESSAGE, DEVICES.rani.ip, 'perpus.sekolah').map((e, i) => envelope(e, { lost: i === 1 }))));
      else if (r === 7) layerRound(wrap, ctx, { done: next });
      else if (r === 8) ask('Rani tetap di Kelas 8A, tetapi sekarang memakai kabel, bukan Wi-Fi. Apa yang berubah?', [['Hanya lapisan jaringan fisik; isi, amplop tengah, dan amplop luar tetap sama', true], ['Alamat IP Rani berubah menjadi 10.2.'], ['Semua lapisan harus diubah'], ['Pesannya dipotong setiap 4 karakter']]);
      else ask('Di Wi-Fi, perangkat lain bisa menangkap amplop yang lewat. Mana yang tidak boleh dikirim tanpa dikunci (dienkripsi)?', [['Kata sandi dan data pribadi', true], ['Judul buku yang dipinjam saja'], ['Tidak ada; Wi-Fi sekolah selalu aman'], ['Alamat IP server DNS']]);
    }
    render();
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function createWrapper(root, ctx) {
  const wrap = el('div', { class: 'act amplop' });
  root.append(wrap);
  let text = MESSAGE;
  let name = 'perpus.sekolah';
  let from = 'rani';
  let size = 8;
  function draw() {
    const env = chunks(text, size).map((t, i, a) => ({ text: t, seq: i + 1, total: a.length, app: APP[name], src: DEVICES[from].ip, dst: DNS[name] }));
    wrap.replaceChildren(
      el('div', { class: 'ab-pilihan' }, el('span', null, 'Dari'), el('div', { class: 'seg' }, ['rani', 'joko'].map((d) => onTap(el('button', { class: `seg-btn ${from === d ? 'on' : ''}`, type: 'button' }, DEVICES[d].name), () => { from = d; draw(); }))),
        el('span', null, 'Ke'), el('div', { class: 'seg' }, Object.keys(DNS).map((n) => onTap(el('button', { class: `seg-btn ${name === n ? 'on' : ''}`, type: 'button' }, n), () => { name = n; draw(); }))),
        el('span', null, 'Potong'), el('div', { class: 'seg' }, [4, 8, 12].map((n) => onTap(el('button', { class: `seg-btn ${size === n ? 'on' : ''}`, type: 'button' }, `${n} karakter`), () => { size = n; draw(); })))),
      el('p', { class: 'ab-pesan' }, vis(text) || '…'),
      el('p', { class: 'reveal info' }, `Tanya DNS: ${name} = ${DNS[name]}. ${env.length} amplop.`),
      el('div', { class: 'ab-amplop-baris' }, env.map((e) => envelope(e))),
      el('div', { class: 'keys' }, [...LETTERS].map((ch) => onTap(el('button', { class: 'key', type: 'button' }, ch), () => { if (text.length < 40) { text += ch; ctx.sound.tap(); draw(); } })),
        onTap(el('button', { class: 'key wide space', type: 'button', 'aria-label': 'spasi' }, '␣'), () => { if (text.length < 40) { text += ' '; draw(); } }),
        onTap(el('button', { class: 'key wide', type: 'button', 'aria-label': 'hapus' }, '⌫'), () => { text = text.slice(0, -1); draw(); }),
        onTap(el('button', { class: 'key wide', type: 'button' }, 'Hapus semua'), () => { text = ''; draw(); })));
  }
  draw();
}

function createNetwork(root, ctx) {
  const wrap = el('div', { class: 'act amplop' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const down = new Set();
  let backup = false;
  let from = 'rani';
  let to = 'perpus';
  let arrived = null;
  let lost = -1;
  let note = 'Tekan Kirim.';
  const tables = () => (backup ? BACKUP : TABLES);
  const pieces = () => chunks(MESSAGE).map((t, i, a) => ({ text: t, seq: i + 1, total: a.length, app: 'perpustakaan', src: DEVICES[from].ip, dst: DEVICES[to].ip }));
  function send() {
    const p = path(DEVICES[from].ip, DEVICES[to].ip, tables(), down);
    const via = p.hops.map(([r, i]) => `${r} (${tables()[r][i][0]} → ${tables()[r][i][1]})`).join(' → ');
    if (!p.ok) { arrived = null; note = `Tidak sampai: ${p.stop || 'jalan'} mati. ${via ? `Sempat lewat ${via}.` : ''}`; ctx.sound.bad(); } else { arrived = [0, 1, 2]; lost = -1; note = `Sampai lewat ${via}.`; ctx.sound.good(); }
    draw();
  }
  function draw() {
    const env = pieces();
    const got = arrived ? arrived.filter((i) => i !== lost) : [];
    const missing = arrived ? env.map((_, i) => i).filter((i) => !got.includes(i)) : [];
    wrap.replaceChildren(
      el('div', { class: 'ab-pilihan' }, el('span', null, 'Dari'), el('div', { class: 'seg' }, Object.keys(DEVICES).map((d) => onTap(el('button', { class: `seg-btn ${from === d ? 'on' : ''}`, type: 'button' }, DEVICES[d].name.replace('Server ', '').replace('Laptop ', '')), () => { from = d; arrived = null; draw(); }))),
        el('span', null, 'Ke'), el('div', { class: 'seg' }, Object.keys(DEVICES).map((d) => onTap(el('button', { class: `seg-btn ${to === d ? 'on' : ''}`, type: 'button' }, DEVICES[d].name.replace('Server ', '').replace('Laptop ', '')), () => { to = d; arrived = null; draw(); })))),
      el('div', { class: 'ab-samping' }, netMap({ down, backup, hi: [from, to] }), el('div', { class: 'ab-kanan' },
        el('div', { class: 'ab-amplop-baris kecil' }, ...(arrived ? arrived.map((i) => envelope(env[i], { lost: i === lost })) : [el('p', { class: 'small-note' }, 'Belum ada amplop.')])),
        el('p', { class: 'ab-jejak' }, arrived ? `Pesan: ${missing.length ? `${got.slice().sort().map((i) => env[i].text).join('')} (nomor ${missing.map((i) => i + 1).join(', ')} belum datang)` : [...got].sort().map((i) => env[i].text).join('')}` : ''))),
      el('p', { class: 'reveal info' }, note),
      el('div', { class: 'kode-baris' }, button('Kirim ✉️', send, 'primary'),
        button('Acak urutan tiba', () => { if (arrived) { arrived = rand.shuffle(arrived); note = `Tiba: ${arrived.map((i) => i + 1).join(', ')}. Dibaca: "${arrived.filter((i) => i !== lost).map((i) => env[i].text).join('')}". Transport menyusun ulang menurut nomor urut.`; draw(); } }, 'small'),
        button('Hilangkan satu', () => { if (arrived) { lost = rand.int(0, 2); note = `Amplop ${lost + 1} hilang. Nomor urut memberi tahu penerima.`; draw(); } }, 'small'),
        button('Minta kirim ulang', () => { if (arrived && lost >= 0) { note = `Amplop ${lost + 1} dikirim ulang dan tiba.`; lost = -1; ctx.sound.good(); draw(); } }, 'small')),
      el('div', { class: 'kode-baris' }, ...['R1', 'R2', 'R3'].map((r) => button(down.has(r) ? `Nyalakan ${r}` : `Matikan ${r}`, () => { if (down.has(r)) down.delete(r); else down.add(r); arrived = null; draw(); }, 'small')),
        button(backup ? 'Lepas kabel R1–R3' : 'Tambah kabel R1–R3', () => { backup = !backup; arrived = null; note = backup ? 'Kabel cadangan R1–R3 terpasang. R1 mendapat baris "10.3. → R3", R3 mendapat "10.1. → R1".' : 'Kabel cadangan dilepas.'; draw(); }, 'small')));
  }
  draw();
}

function createTeams(root, ctx) {
  const wrap = el('div', { class: 'act amplop' });
  root.append(wrap);
  const rand = makeRng(newSeed());
  const ROLES = ['R1', 'R2', 'R3', 'Server'];
  const score = [0, 0, 0, 0];
  function round() {
    wrap.replaceChildren();
    const ends = Object.keys(DEVICES);
    const from = rand.pick(ends);
    const to = rand.pick(ends.filter((d) => routerOf(DEVICES[d].ip) !== routerOf(DEVICES[from].ip)));
    const hops = path(DEVICES[from].ip, DEVICES[to].ip).hops;
    let k = 0;
    const board = el('p', { class: 'small-note ab-skor' });
    const show = () => { board.textContent = ROLES.map((r, i) => `Tim ${r}: ${score[i]}`).join(' · '); };
    show();
    wrap.append(board);
    routeRound(wrap, ctx, {
      from, to, prompt: `${DEVICES[from].name} → ${DEVICES[to].name} (${DEVICES[to].ip}). Tim yang menjadi router tempat amplop berada memilih barisnya.`,
      turn: (ok) => { const r = ROLES.indexOf(hops[Math.min(k, hops.length - 1)][0]); if (ok) { score[r]++; k++; } else score[r] = Math.max(0, score[r] - 1); show(); },
      done: () => {
        const sv = el('div');
        wrap.append(sv);
        const room = Object.keys(DEVICES).filter((d) => routerOf(DEVICES[d].ip) === routerOf(DEVICES[to].ip));
        choice(sv, { prompt: 'Tim Server: amplop sampai di ruangan. Serahkan ke perangkat mana?', ctx, columns: room.length, onRight: () => { score[3]++; show(); ctx.sound.win(); sv.append(el('div', { class: 'kode-baris' }, button('Amplop berikutnya ➜', round, 'primary'))); },
          options: room.map((d) => ({ label: `${DEVICES[d].name} (${DEVICES[d].ip})`, correct: d === to })) });
      },
    });
  }
  round();
}
