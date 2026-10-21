// Ordering worksheets share one engine: drag step cards into numbered slots,
// press the play button to watch the steps happen in the child's order, and
// answer a follow-up question ("which step is missing?", "what if…?").
//   paud-03-langkah     — Memakai Sepatu (dekomposisi)
//   paud-05-kacang-hijau — Menanam Kacang Hijau (urutan)

import { el, button, choice, orderBoard, playSteps } from '../core/kit.js';

function orderRound(wrap, ctx, task, playLabel, next) {
  const stage = el('div', { class: 'stage-box' }, el('span', { class: 'stage-icon' }, task.icon), el('span', null, task.title));
  const play = button(playLabel, () => {
    if (!placed) return;
    play.disabled = true;
    board.lock();
    playSteps(stage, task.steps, placed, {
      ok: task.ok,
      oops: (i) => task.oops?.(i) ?? `Ups! "${task.steps[i].label}" belum waktunya.`,
      done(right) {
        if (right) { next(); return; }
        ctx.mistake();
        setTimeout(() => {
          board.returnWrong();
          wrap.querySelectorAll('.ocard').forEach((c) => c.classList.remove('locked'));
          placed = null;
        }, 1400);
      },
    });
  }, 'primary');
  play.disabled = true;
  let placed = null;
  const board = orderBoard({
    steps: task.steps,
    rand: ctx.rand,
    onFull(order) { placed = order; play.disabled = false; },
  });
  wrap.append(
    el('p', { class: 'prompt' }, task.prompt),
    el('div', { class: 'order-layout' }, board.node, el('div', { class: 'order-side' }, stage, play)));
}

function makeSequence({ tasks, questions, playLabel, ...meta }) {
  return {
    ...meta,
    maxPlayers: 4,
    create(root, ctx) {
      const wrap = el('div', { class: 'act urutan' });
      root.append(wrap);
      // Rounds alternate: ordering task, question, ordering task, question …
      function render() {
        wrap.replaceChildren();
        const r = ctx.round;
        const next = () => { if (ctx.solved()) setTimeout(render, 1300); };
        if (r % 2 === 0) {
          orderRound(wrap, ctx, tasks[(r / 2) % tasks.length], playLabel, next);
        } else {
          const q = questions[((r - 1) / 2) % questions.length];
          choice(wrap, {
            prompt: q.prompt,
            subject: q.subject ? el('div', { class: 'chain' }, q.subject) : null,
            ctx, onRight: next, columns: q.columns,
            options: ctx.rand.shuffle(q.options.map(([icon, label], i) => ({ icon, label, correct: i === 0 }))),
          });
        }
      }
      render();
    },
  };
}

export const paudLangkah = makeSequence({
  id: 'paud-03-langkah',
  title: 'Memakai Sepatu',
  topic: 'Dekomposisi',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '👟',
  source: null,
  rounds: 4,
  playLabel: '▶ Coba',
  goal: 'Anak memecah tugas besar menjadi langkah-langkah kecil, mengurutkannya, dan menemukan langkah yang hilang.',
  tasks: [
    {
      title: 'Memakai sepatu', icon: '👟',
      prompt: 'Memakai sepatu ada langkah-langkahnya. Seret ke nomor 1 sampai 4.',
      steps: [
        { icon: '🧦', label: 'memakai kaus kaki' },
        { icon: '🦶', label: 'memasukkan kaki ke sepatu' },
        { icon: '👟', label: 'merekatkan perekat' },
        { icon: '🚶', label: 'berdiri dan berjalan' },
      ],
      ok: 'Sepatu terpasang rapi. Ayo berangkat!',
      oops: (i) => (i === 0 ? 'Ups! Kaus kakinya jadi di luar sepatu!' : 'Ups! Langkahnya tertukar, sepatunya belum siap.'),
    },
    {
      title: 'Menggosok gigi', icon: '🪥',
      prompt: 'Urutkan langkah menggosok gigi.',
      steps: [
        { icon: '🪥', label: 'mengambil sikat gigi' },
        { icon: '🧴', label: 'memberi pasta gigi' },
        { icon: '😁', label: 'menggosok gigi' },
        { icon: '🥛', label: 'berkumur' },
      ],
      ok: 'Gigi bersih dan wangi!',
    },
    {
      title: 'Membereskan mainan', icon: '🧸',
      prompt: 'Urutkan langkah membereskan mainan.',
      steps: [
        { icon: '🖐️', label: 'mengambil mainan dari lantai' },
        { icon: '📦', label: 'memasukkan ke kotak' },
        { icon: '🗄️', label: 'menaruh kotak di rak' },
      ],
      ok: 'Kamar jadi rapi!',
    },
  ],
  questions: [
    {
      prompt: 'Ada langkah yang hilang dalam mencuci tangan! Pilih langkah yang hilang.',
      subject: '💧 basahi tangan → ❓ → 👐 gosok tangan → 🚿 bilas → 🧻 keringkan',
      options: [['🧼', 'memakai sabun'], ['🍚', 'makan'], ['🛏️', 'tidur']],
    },
    {
      prompt: 'Ada langkah yang hilang dalam memakai baju! Pilih langkah yang hilang.',
      subject: '👕 ambil baju → ❓ → 🔘 kancingkan → 🪞 berkaca',
      options: [['🙆', 'masukkan kepala dan tangan'], ['👟', 'pakai sepatu'], ['🥣', 'sarapan']],
    },
  ],
});

export const paudKacangHijau = makeSequence({
  id: 'paud-05-kacang-hijau',
  title: 'Menanam Kacang Hijau',
  topic: 'Urutan (sekuens)',
  jenjang: 'paud',
  age: '4–6 tahun',
  icon: '🌱',
  source: null,
  rounds: 4,
  playLabel: '🌱 Tumbuhkan',
  goal: 'Anak mengurutkan langkah menanam kacang hijau dan memahami bahwa urutan yang salah membuat hasilnya berbeda.',
  tasks: [
    {
      title: 'Kacang hijau', icon: '🫘',
      prompt: 'Bagaimana kacang hijau tumbuh? Seret gambar ke nomor 1 sampai 4.',
      steps: [
        { icon: '🥛', label: 'kapas dibasahi di gelas' },
        { icon: '🫘', label: 'biji ditaruh di atas kapas' },
        { icon: '🌿', label: 'biji pecah, akar keluar' },
        { icon: '🌱', label: 'kecambah berdaun' },
      ],
      ok: 'Kacang hijaumu tumbuh!',
      oops: (i) => (i === 1 ? 'Ups! Bijinya di gelas kosong, tidak ada air.' : 'Ups! Kacang hijau tidak tumbuh seperti itu.'),
    },
    {
      title: 'Menanam bunga', icon: '🌻',
      prompt: 'Urutkan cara menanam bunga di pot.',
      steps: [
        { icon: '🪴', label: 'isi pot dengan tanah' },
        { icon: '🌰', label: 'tanam biji' },
        { icon: '🚿', label: 'siram setiap hari' },
        { icon: '🌻', label: 'bunga mekar' },
      ],
      ok: 'Bunganya mekar!',
    },
  ],
  questions: [
    {
      prompt: 'Mana urutan yang benar?',
      options: [['B', '🥛 kapas dibasahi → 🫘 biji ditaruh → 🌱 tumbuh'], ['A', '🫘 biji di gelas kosong → 🥛 kapas dibasahi → 🌱 tumbuh']],
      columns: 1,
    },
    {
      prompt: 'Bagaimana jika kapasnya tidak pernah disiram?',
      subject: '🫘 + 🥛 kering … ❓',
      options: [['🫘', 'biji tetap kering dan tidak tumbuh'], ['🌳', 'tumbuh jadi pohon besar'], ['🌸', 'berubah jadi bunga']],
    },
  ],
});
