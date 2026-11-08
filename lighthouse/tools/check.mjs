// Syntax checks the demo's inline script: node --check can not read HTML, so the last <script> block is written to
// a temp file first and checked there.
//   node lighthouse/tools/check.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const page = path.join(here, '../index.html');
if (!fs.existsSync(page)) { console.error('index.html not found: ' + page); process.exit(1); }
const html = fs.readFileSync(page, 'utf8');
const start = html.lastIndexOf('<script>'), end = html.lastIndexOf('</script>');
if (start < 0 || end < start) { console.error('no inline <script> block'); process.exit(1); }
const out = path.join(os.tmpdir(), 'lighthouse-check.js');
fs.writeFileSync(out, html.slice(start + 8, end));
try { execFileSync(process.execPath, ['--check', out], {stdio: 'inherit'}); }
catch { process.exit(1); }
