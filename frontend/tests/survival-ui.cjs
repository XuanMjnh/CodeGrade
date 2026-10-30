// Compatibility entry point: live UI verification now uses a real browser.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const result = spawnSync(
  process.execPath,
  [require.resolve('@playwright/test/cli'), 'test', ...process.argv.slice(2)],
  { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: process.env },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
