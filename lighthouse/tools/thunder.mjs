// Writes the cinematic's thunder as one sound file, for soundtrack.sh to mix under the picture.
//   node lighthouse/tools/thunder.mjs <out.wav> [seconds]
// It is the page's own thunder: the same crack and roll, worked out by the page's SOUND block, for each strike of
// the cinematic's schedule, heard as late and as loud as the page would play it for the camera's place at that time.
import fs from 'node:fs';
import {loadBlock} from './block.mjs';

const [out, seconds = 30] = process.argv.slice(2);
if (!out) { console.error('usage: node thunder.mjs <out.wav> [seconds]'); process.exit(1); }

const {thunderCrack, thunderRoll, thunderDelay, SOUND_RATE} = loadBlock('SOUND');
const {makeSchedule, CLOUD_BASE_Y} = loadBlock('LIGHTNING');
const {cameraPathAt} = loadBlock('CAMERA', {vec3: (x=0, y=0, z=0) => ({x, y, z})});

const mix = new Float32Array(seconds*SOUND_RATE);
const add = (data, at, gain) =>
{
    for (let i = 0, k = at*SOUND_RATE | 0; i < data.length && k + i < mix.length; ++i) mix[k + i] += data[i]*gain;
};
makeSchedule(() => 0, true).forEach((strike, i) =>
{
    // as the page's queueThunder: up in the cloud mostly roll, down to the sea a hard crack first, the big one louder
    const camera = cameraPathAt(strike.t).pos, cloud = strike.kind == 'cloud';
    const distance = Math.hypot(strike.x - camera.x, (cloud ? CLOUD_BASE_Y + 8 : 0) - camera.y, strike.z - camera.z);
    const delay = thunderDelay(distance), near = 1/(1 + distance/300), size = strike.big ? 1 : .7;
    add(thunderCrack(i % 3 + 1), strike.t + delay, (cloud ? .45 : 1)*near*size*1.5);
    add(thunderRoll(i % 3 + 1), strike.t + delay, near*size*1.3);
    console.log(`strike at ${strike.t}s, ${distance.toFixed(0)}m off, heard ${delay.toFixed(2)}s later`);
});

// 16 bit mono wav, the loudest moment just under full scale
let peak = 1e-9;
for (const v of mix) peak = Math.max(peak, Math.abs(v));
const wav = Buffer.alloc(44 + mix.length*2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + mix.length*2, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SOUND_RATE, 24); wav.writeUInt32LE(SOUND_RATE*2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(mix.length*2, 40);
for (let i = 0; i < mix.length; ++i) wav.writeInt16LE(Math.round(mix[i]/peak*.95*32767), 44 + i*2);
fs.writeFileSync(out, wav);
console.log(`wrote ${out}`);
