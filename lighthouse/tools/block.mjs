// Test helper: pulls one marked block out of the demo's inline script, // NAME BEGIN to // NAME END, and runs it in
// a sandbox, so the plain math parts of the page are tested in node without the engine.
//   const {cameraPathAt} = loadBlock('CAMERA', {vec3})
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadBlock(name, globals = {})
{
    const html = fs.readFileSync(path.join(here, '../index.html'), 'utf8');
    const a = html.indexOf(`// ${name} BEGIN`), b = html.indexOf(`// ${name} END`);
    if (a < 0 || b < a) throw new Error(`block ${name} not found`);
    const sandbox = {Math, Float32Array, Uint32Array, ...globals};
    vm.createContext(sandbox);
    // top level let/const stay in the script's scope, so the block hands back what it declared through a getter
    const block = html.slice(a, b);
    const names = [...block.matchAll(/^(?:function|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
    // every name a top level const or let declares, its declarators split on the commas outside brackets
    for (const m of block.matchAll(/^(?:const|let)\s+([^;]*)/gm))
    {
        const text = m[1];
        let depth = 0, start = 0;
        for (let i = 0; i <= text.length; ++i)
        {
            const c = text[i];
            if (c === '(' || c === '[' || c === '{') ++depth;
            else if (c === ')' || c === ']' || c === '}') --depth;
            else if (i === text.length || c === ',' && !depth)
            {
                const name = text.slice(start, i).match(/^\s*([A-Za-z_$][\w$]*)\s*(=|$)/);
                name && names.push(name[1]);
                start = i + 1;
            }
        }
    }
    vm.runInContext(block + `\n;globalThis.__block = {${[...new Set(names)].join(',')}};`, sandbox);
    return sandbox.__block;
}

// tiny assertion helpers that name what failed
let failures = 0;
export function check(ok, label)
{
    if (ok) return;
    ++failures;
    console.error('FAIL: ' + label);
}
export function done(name)
{
    if (failures) { console.error(`${name}: ${failures} failed`); process.exit(1); }
    console.log(`${name}: ok`);
}
