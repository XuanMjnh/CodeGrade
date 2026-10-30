import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../src/lib/locale.js', import.meta.url), 'utf8');
const extra = JSON.parse(
  readFileSync(new URL('../src/lib/translations.json', import.meta.url), 'utf8'),
);
function translator(locale) {
  const context = { extra, locale };
  vm.createContext(context);
  vm.runInContext(
    src
      .slice(src.search(/const pairs\s*=/), src.indexOf('const create'))
      .replace('export function t', 'function t'),
    context,
  );
  return context.t;
}
for (const locale of ['en', 'vi'])
  test(`translation is idempotent across the ${locale} UI dictionary`, () => {
    const t = translator(locale);
    for (const value of [...Object.keys(extra), ...Object.values(extra)])
      assert.equal(t(t(value)), t(value), value);
  });
test('mixed-direction editor labels use the selected language', () => {
  assert.equal(translator('vi')('Save changes'), 'Lưu thay đổi');
  assert.equal(translator('en')('Lưu thay đổi'), 'Save changes');
  assert.equal(translator('en')(' Mức 6 '), ' Level 6 ');
});
