// Runs the flock sim from index.html in node and renders a contact sheet PNG of frames
// through the same camera, so the flock's shape over time can be judged without a browser.
//   node demos/murmuration/tools/flockSheet.js out.png [birds] [startSec] [stepSec] [NAME=value ...]
// NAME=value arguments override sim constants. A hawk pass runs through the 3rd frame.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
let sim = html.slice(html.indexOf('// SIM BEGIN'), html.indexOf('// SIM END'));
const [out, birdsArg, startArg, stepArg, ...overrides] = process.argv.slice(2);
for (const arg of overrides)
{
    const [name, value] = arg.split('=');
    sim = sim.replace(new RegExp(name + ' = [^,;]+'), name + ' = ' + value);
}
const birds = +(birdsArg || 40000), start = +(startArg || 6), step = +(stepArg || 4);
const api = new Function(sim + `
return {spawnFlock, simStep, simHawk, flockCenter, bpx, bpy, bpz, bpanic,
    setCount: n => birdCount = n};`)();
api.setCount(birds);
api.spawnFlock(1);

// the page's camera
const cameraLine = html.match(/const VIEW_HEIGHT = [^;]+;/)[0];
const [VIEW_HEIGHT, HORIZON_Y, FOCAL, EYE_Y, CAM_DIST] = new Function(cameraLine + 'return [VIEW_HEIGHT, HORIZON_Y, FOCAL, EYE_Y, CAM_DIST]')();
const W = 480, H = 270, COLS = 3, ROWS = 2, pxPerUnit = H/VIEW_HEIGHT;
const sheet = Buffer.alloc(W*COLS*H*ROWS*3);

function renderFrame(col, row, yaw)
{
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const shade = new Float32Array(W*H).fill(1);
    let aboveTop = 0;
    for (let i = 0; i < birds; ++i)
    {
        const rx = api.bpx[i]*c - api.bpz[i]*s, rz = api.bpx[i]*s + api.bpz[i]*c;
        const depth = CAM_DIST - rz;
        if (depth < 8) continue;
        const scale = FOCAL/depth;
        const x = Math.floor(W/2 + rx*scale*pxPerUnit);
        const y = Math.floor(H/2 - ((api.bpy[i] - EYE_Y)*scale + HORIZON_Y)*pxPerUnit);
        if (y < 0) ++aboveTop;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        shade[x + y*W] *= .55 - .1*api.bpanic[i];
    }
    console.log(`frame ${col + row*COLS}: ${(aboveTop/birds*100).toFixed(1)}% above the top`);
    const horizon = Math.floor(H/2 - HORIZON_Y*pxPerUnit);
    for (let y = 0; y < H; ++y)
    for (let x = 0; x < W; ++x)
    {
        const t = y/horizon, sky = y < horizon;
        const r = sky ? 60 + 190*t : 120, g = sky ? 40 + 110*t : 80, b = sky ? 90 + 10*t : 90;
        const k = shade[x + y*W], o = ((row*H + y)*W*COLS + col*W + x)*3;
        sheet[o] = r*k; sheet[o+1] = g*k; sheet[o+2] = b*k;
    }
}

let simTime = 0, yaw = 0;
const dt = 1/60;
for (let frame = 0; frame < COLS*ROWS; ++frame)
{
    const target = start + frame*step;
    while (simTime < target - 1e-6)
    {
        // hawk sweeps across the flock center during the second before frame 3
        const h = api.simHawk, p = target - simTime;
        h.active = frame == 2 && p < 1;
        if (h.active)
            Object.assign(h, {ex:Math.sin(yaw)*CAM_DIST, ey:EYE_Y, ez:Math.cos(yaw)*CAM_DIST,
                hx:api.flockCenter.x + (.5 - p)*40, hy:api.flockCenter.y, hz:api.flockCenter.z});
        api.simStep(dt);
        simTime += dt; // the camera stands still
    }
    renderFrame(frame % COLS, frame/COLS|0, yaw);
}

// minimal PNG writer
const crcTable = Array.from({length:256}, (_, n) => { for (let k = 0; k < 8; ++k) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
const crc = buf => { let c = ~0; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ c >>> 8; return ~c >>> 0; };
function chunk(type, data)
{
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
}
const SW = W*COLS, SH = H*ROWS;
const raw = Buffer.alloc((SW*3 + 1)*SH);
for (let y = 0; y < SH; ++y) sheet.copy(raw, y*(SW*3 + 1) + 1, y*SW*3, (y + 1)*SW*3);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SW, 0); ihdr.writeUInt32BE(SH, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`wrote ${out}: frames at ${start}s every ${step}s, ${birds} birds`);
