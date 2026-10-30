import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const colors = Object.fromEntries(
  [...css.matchAll(/--([a-z-]+):\s*(#[a-f0-9]{6})/gi)].map((m) => [m[1], m[2]]),
);
function luminance(color) {
  return color
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  assert.ok(colors[a], a);
  assert.ok(colors[b], b);
  const x = luminance(colors[a]),
    y = luminance(colors[b]);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const pairs = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'muted'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'muted'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive', 'card'],
  ['popover-foreground', 'popover'],
  ...['syntax-keyword', 'syntax-string', 'syntax-comment', 'syntax-number', 'syntax-function'].map(
    (name) => [name, 'card'],
  ),
];
for (const [fg, bg] of pairs)
  test(`${fg} on ${bg} meets WCAG AA contrast`, () =>
    assert.ok(contrast(fg, bg) >= 4.5, contrast(fg, bg).toFixed(2)));
test('keyboard focus ring is visible against the application surface', () =>
  assert.ok(contrast('ring', 'card') >= 3));
