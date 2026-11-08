// Runs the demo's whole suite: the syntax check, then every tools/*.test.mjs. Exits non zero if any fails.
//   node lighthouse/tools/test.mjs
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = ['check.mjs', ...fs.readdirSync(here).filter(f => f.endsWith('.test.mjs')).sort()];
let failed = 0;
for (const f of files)
{
    try { execFileSync(process.execPath, [path.join(here, f)], {stdio: 'inherit'}); }
    catch { ++failed; console.error(`${f} failed`); }
}
console.log(failed ? `suite: ${failed}/${files.length} failed` : `suite: ${files.length}/${files.length} passed`);
process.exit(failed ? 1 : 0);
