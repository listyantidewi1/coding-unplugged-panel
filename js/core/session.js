// Runs one activity on the panel in one of these modes:
//   solo    – 1 pane, one child or the whole class with the teacher
//   race    – 2–4 panes side by side, children race on the same puzzles
//   turns   – 1 pane, 2–4 teams take turns, points per puzzle
//   extra   – 1 pane running one of the activity's own extraModes
//             (open-ended creation, pair play, …), without rounds or timer

import { el, button, makeRng, formatTime } from './util.js';
import { sound } from './sound.js';

export const PLAYER_COLORS = ['#2563eb', '#ea580c', '#16a34a', '#9333ea'];
const MEDALS = ['🥇', '🥈', '🥉', '🏅'];

export function runSession(root, activity, { mode, players, extra, seed, onExit, onReplay }) {
  const paneCount = mode === 'race' ? players : 1;
  const teams = mode === 'turns' ? players : 0;
  const stage = el('div', { class: `stage players-${paneCount}` });
  root.append(stage);

  const startedAt = performance.now();
  const panes = [];
  const finished = [];

  for (let i = 0; i < paneCount; i++) panes.push(createPane(i));
  const ticker = setInterval(() => panes.forEach((p) => p.tick()), 1000);

  function nameOf(i) {
    return teams ? `Tim ${i + 1}` : `Pemain ${i + 1}`;
  }

  function createPane(index) {
    let color = PLAYER_COLORS[index];
    // In turn mode every team gets the same number of puzzles.
    const total = extra ? 0
      : teams ? Math.ceil(activity.rounds / teams) * teams
        : activity.rounds;
    const state = { solved: 0, mistakes: 0, doneAt: null, points: new Array(teams).fill(0), puzzleMistakes: 0 };

    const progress = el('div', { class: 'pane-progress' });
    for (let r = 0; r < total; r++) progress.append(el('i'));
    const nameEl = el('span', { class: 'pane-name' },
      mode === 'race' ? nameOf(index) : extra ? `${activity.title} · ${extra.label}` : activity.title);
    const timeEl = el('span', { class: 'pane-time' }, extra ? '' : '0:00');
    const mistakesEl = el('span', { class: 'pane-mistakes' });
    const scoreEl = el('div', { class: 'scoreboard' });
    const head = el('div', { class: 'pane-head' }, nameEl, progress, mistakesEl, timeEl);
    const body = el('div', { class: 'pane-body' });
    const pane = el('section', { class: 'pane' }, head, teams ? scoreEl : null, body);
    stage.append(pane);

    function setColor(c) {
      color = c;
      pane.style.setProperty('--player', c);
      head.style.background = c;
    }
    function drawTurn() {
      const t = state.solved % teams;
      setColor(PLAYER_COLORS[t]);
      nameEl.textContent = `Giliran ${nameOf(t)}`;
      scoreEl.replaceChildren(...state.points.map((p, i) => el('span',
        { class: i === t ? 'chip on' : 'chip', style: { '--player': PLAYER_COLORS[i] } },
        `${nameOf(i)}: ${p}`)));
    }
    setColor(color);
    if (teams) drawTurn();

    const ctx = {
      rand: makeRng(seed),
      player: index,
      total,
      sound,
      get round() { return state.solved; },
      // Returns true while puzzles remain, so the activity knows whether to
      // render the next one.
      solved() {
        if (state.doneAt) return false;
        if (teams) {
          state.points[state.solved % teams] += Math.max(1, 3 - state.puzzleMistakes);
          state.puzzleMistakes = 0;
        }
        progress.children[state.solved]?.classList.add('on');
        state.solved++;
        if (state.solved >= total) {
          if (teams) drawTurn();
          finishPane();
          return false;
        }
        sound.good();
        if (teams) setTimeout(drawTurn, 700);
        return true;
      },
      mistake() {
        state.mistakes++;
        state.puzzleMistakes++;
        mistakesEl.textContent = `✗ ${state.mistakes}`;
        sound.bad();
      },
    };

    function finishPane() {
      state.doneAt = performance.now() - startedAt;
      finished.push(index);
      sound.win();
      if (mode === 'race') {
        const place = finished.length;
        body.append(el('div', { class: 'pane-done' },
          el('div', { class: 'big' }, MEDALS[place - 1]),
          el('div', null, `Juara ${place}!`),
          el('div', { class: 'small' }, `Waktu ${formatTime(state.doneAt)} · Salah ${state.mistakes}`)));
      }
      if (finished.length === paneCount) setTimeout(showResults, mode === 'race' ? 900 : 300);
    }

    const handle = (extra ? extra.create : activity.create)(body, ctx);

    return {
      state,
      tick() {
        if (!state.doneAt && !extra) timeEl.textContent = formatTime(performance.now() - startedAt);
      },
      destroy() { handle?.destroy?.(); },
    };
  }

  function resultRows() {
    if (mode === 'race') {
      return finished.map((i, place) => row(i, `${MEDALS[place]} ${nameOf(i)}`,
        `${formatTime(panes[i].state.doneAt)} · salah ${panes[i].state.mistakes}`));
    }
    const s = panes[0].state;
    if (teams) {
      return s.points.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p)
        .map(({ p, i }) => row(i, nameOf(i), `${p} poin`));
    }
    return [row(0, '⭐ Hebat!', `${formatTime(s.doneAt)} · salah ${s.mistakes}`)];
  }

  function row(i, label, detail) {
    return el('li', { style: { '--player': PLAYER_COLORS[i] } }, el('b', null, label), el('span', null, detail));
  }

  function showResults() {
    const title = mode === 'race' ? 'Hasil Lomba' : teams ? 'Skor Akhir' : 'Aktivitas Selesai';
    stage.append(el('div', { class: 'results' },
      el('div', { class: 'results-card' },
        el('h2', null, title),
        teams ? el('p', { class: 'small-note' }, 'Benar tanpa salah 3 poin, salah sekali 2 poin, selebihnya 1 poin.') : null,
        el('ol', null, resultRows()),
        el('div', { class: 'row' },
          button('Main lagi', () => onReplay(), 'primary'),
          button('Ganti mode', () => onExit())))));
  }

  return {
    destroy() {
      clearInterval(ticker);
      panes.forEach((p) => p.destroy());
    },
  };
}
