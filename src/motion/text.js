/* ============================================================
   text.js — split text into animatable chars / lines while
   preserving accessibility (original text kept as aria-label).
   ============================================================ */

/** Split an element's text into per-character spans. Returns the spans. */
export function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';

  const chars = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch;
    el.appendChild(span);
    chars.push(span);
  }
  return chars;
}

/**
 * Split into visual lines wrapped in an overflow-hidden mask, so each
 * line can slide up cleanly. Lines are detected by measuring word
 * offsetTop, so this must run after layout/fonts are ready.
 * Returns the inner (translatable) elements.
 */
export function splitLines(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);

  // 1. Lay every word out as an inline-block so we can measure wrap points.
  el.textContent = '';
  const wordSpans = text.split(/\s+/).map((w) => {
    const s = document.createElement('span');
    s.style.display = 'inline-block';
    s.textContent = w;
    return s;
  });
  wordSpans.forEach((s, i) => {
    el.appendChild(s);
    if (i < wordSpans.length - 1) el.appendChild(document.createTextNode(' '));
  });

  // 2. Group words into lines by their vertical offset.
  const lines = [];
  let current = null;
  let lastTop = null;
  wordSpans.forEach((s) => {
    const top = s.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      current = [];
      lines.push(current);
      lastTop = top;
    }
    current.push(s.textContent);
  });

  // 3. Rebuild as masked lines.
  el.textContent = '';
  const inners = [];
  lines.forEach((words) => {
    const line = document.createElement('span');
    line.className = 'split-line';
    line.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'split-line__inner';
    inner.textContent = words.join(' ');
    line.appendChild(inner);
    el.appendChild(line);
    inners.push(inner);
  });
  return inners;
}
