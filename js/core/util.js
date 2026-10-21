// Small helpers shared by the shell and every activity.

// Deterministic RNG so every player pane gets the same puzzles in a race.
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle(arr) {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
  };
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// el('div', {class: 'x', onclick}, child, 'text', [more])
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) node.style.setProperty(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`), val);
    }
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  appendAll(node, children);
  return node;
}

function appendAll(node, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendAll(node, c);
    else node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// Activate on pointerdown so several children can press buttons at the same
// moment on a multi-touch panel (click events get dropped when touches overlap).
// The click that follows a touch is ignored; a click with no pointer before it
// comes from the keyboard and still activates.
export function onTap(node, handler) {
  let lastPointer = -Infinity;
  node.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    lastPointer = performance.now();
    handler(e);
  });
  node.addEventListener('click', (e) => {
    if (performance.now() - lastPointer > 1000) handler(e);
  });
  return node;
}

export function button(label, handler, cls = '') {
  return onTap(el('button', { class: `btn ${cls}`, type: 'button' }, label), handler);
}

export function formatTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
}
