// Runs the flock sim from index.html in node and prints how the flock behaves:
// spread, speed, how much of it is in front of the camera, and step cost.
//   node demos/murmuration/tools/simStats.js [seconds] [birds]
'use strict';
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
let sim = html.slice(html.indexOf('// SIM BEGIN'), html.indexOf('// SIM END'));
// NAME=value arguments override sim constants, for tuning without editing the page
for (const arg of process.argv.slice(4))
{
    const [name, value] = arg.split('=');
    sim = sim.replace(new RegExp(name + ' = [^,;]+'), name + ' = ' + value);
}
const seconds = +(process.argv[2] || 20), birds = +(process.argv[3] || 30000);
const api = new Function(sim + `
return {spawnFlock, simStep, simHawk, flockCenter, bpx, bpy, bpz, bvx, bvy, bvz, bpanic, bcool,
    setCount: n => birdCount = n, get time() { return simTime; }};`)();
api.setCount(birds);
api.spawnFlock(1);

function stats()
{
    let sx=0, sy=0, sz=0, sxx=0, syy=0, szz=0, speed=0, panic=0, reached=0;
    for (let i = 0; i < birds; ++i)
    {
        sx += api.bpx[i]; sy += api.bpy[i]; sz += api.bpz[i];
        sxx += api.bpx[i]**2; syy += api.bpy[i]**2; szz += api.bpz[i]**2;
        speed += Math.hypot(api.bvx[i], api.bvy[i], api.bvz[i]);
        panic += api.bpanic[i]; reached += api.bcool[i] > 0;
    }
    const m = v => v/birds, sd = (s, ss) => Math.sqrt(Math.max(0, m(ss) - m(s)**2));
    return `c=(${m(sx).toFixed(1)},${m(sy).toFixed(1)},${m(sz).toFixed(1)}) ` +
        `sd=(${sd(sx,sxx).toFixed(1)},${sd(sy,syy).toFixed(1)},${sd(sz,szz).toFixed(1)}) ` +
        `speed=${m(speed).toFixed(1)} panic=${m(panic).toFixed(3)} reached=${m(reached).toFixed(2)}`;
}

let ms = 0, steps = 0;
for (let f = 0; f < seconds*60; ++f)
{
    // a hawk pass through the middle from 10s to 11s
    const h = api.simHawk;
    h.active = f > 600 && f < 660;
    const fc = api.flockCenter;
    Object.assign(h, {ex:fc.x, ey:3, ez:fc.z + 150, hx:fc.x - 20 + (f-600)*.66, hy:fc.y, hz:fc.z});
    const t0 = performance.now();
    api.simStep(1/60);
    ms += performance.now() - t0; ++steps;
    if (f % 30 == 0 && f >= 600 && f < 780 || f % 120 == 0) console.log(`t=${(f/60).toFixed(0).padStart(3)} ${stats()}`);
}
console.log(`avg step ${(ms/steps).toFixed(2)}ms for ${birds} birds`);
