const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
let count = 0;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'uploads'].includes(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.(js|cjs)$/.test(file)) { execFileSync(process.execPath, ['--check', file]); count++; }
  }
}
walk(path.join(__dirname, '..'));
console.log(`Syntax OK: ${count} backend files`);
