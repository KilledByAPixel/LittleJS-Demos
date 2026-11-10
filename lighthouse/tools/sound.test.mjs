// The thunder's sound, worked out from noise: a crack that is one hard snap and done, a roll that goes on for
// seconds and dies away smoothly, neither with a steady flutter on it, and the wait after the flash by distance.
import {loadBlock, check, done} from './block.mjs';

const {thunderCrack, thunderRoll, thunderDelay, thunderLoudness, SOUND_RATE} = loadBlock('SOUND');

// loudness of a stretch of a sound, as a root mean square
const rms = (d, a, b) => { let q = 0; a = a*SOUND_RATE | 0, b = Math.min(d.length, b*SOUND_RATE | 0); for (let i = a; i < b; ++i) q += d[i]*d[i]; return Math.sqrt(q/(b - a)); };
const crack = thunderCrack(1), roll = thunderRoll(1);
check(crack.every(Number.isFinite) && roll.every(Number.isFinite), 'every sample is a number');
check(crack.every(v => Math.abs(v) <= 1) && roll.every(v => Math.abs(v) <= 1), 'nothing over full scale');
// its attack: how soon it first comes within a tenth of its loudest
let peak = 0;
for (const v of crack) peak = Math.max(peak, Math.abs(v));
const hitAt = crack.findIndex(v => Math.abs(v) > peak*.9)/SOUND_RATE;
check(hitAt < .01, `the crack hits at once (${(hitAt*1e3).toFixed(1)}ms)`);
check(rms(crack, 0, .08) > .3, `and hits hard (${rms(crack, 0, .08).toFixed(2)})`);
check(rms(crack, .7, crack.length/SOUND_RATE) < rms(crack, 0, .08)*.08, 'then it is over, no tail of its own');
check(roll.length/SOUND_RATE >= 5, 'the roll goes on for seconds');
check(rms(roll, 3, 4) > rms(roll, 0, 1)*.06, 'still heard three seconds in');
check(rms(roll, 3, 4) < rms(roll, 0, 1)*.6 && rms(roll, roll.length/SOUND_RATE - .3, 99) < rms(roll, 0, 1)*.02, 'dying away to nothing at its end');
// no steady flutter: the loudness of the roll's first seconds, taken every 10ms, must not swing at one fixed rate.
// A tremolo shows as the loudness curve matching itself strongly when slid along by its period
const steps = [];
for (let t = .2; t < 3; t += .01) steps.push(rms(roll, t, t + .01));
const trend = steps.map((v, i) => v/(steps.slice(Math.max(0, i - 15), i + 16).reduce((a, b) => a + b)/steps.slice(Math.max(0, i - 15), i + 16).length) - 1);
let flutter = 0;
for (let lag = 3; lag <= 40; ++lag)
{
    let same = 0, power = 0;
    for (let i = lag; i < trend.length; ++i) same += trend[i]*trend[i - lag], power += trend[i]*trend[i];
    flutter = Math.max(flutter, same/power);
}
check(flutter < .45, `the roll has no steady flutter on it (${flutter.toFixed(2)})`);
// the rumble has to be heard on small speakers, which carry little under 250Hz: with everything lower taken out,
// every roll must still be sounding seconds after its start, and swell again at least once, a peal coming back
const middle = d => { const k = 1 - Math.exp(-2*Math.PI*250/SOUND_RATE), o = new Float32Array(d.length); let low = 0; d.forEach((v, i) => { low += k*(v - low); o[i] = v - low; }); return o; };
let heard = 9, pealed = true;
for (let seed = 1; seed <= 7; ++seed)
{
    const m = middle(thunderRoll(seed));
    heard = Math.min(heard, rms(m, 1.5, 4)/rms(m, 0, .5));
    let rose = false;
    for (let t = .5; t < 4; t += .1) rms(m, t, t + .15) > rms(m, t - .25, t - .1)*1.4 && (rose = true);
    pealed &&= rose;
}
check(heard > .12, `every roll still rumbles in the middle range seconds on (${heard.toFixed(2)} of its start)`);
check(pealed, 'and every roll swells again after its start, a peal coming back');
// no two strikes alike: the cracks differ in how their loudness runs, not only in their noise
const curve = d => Array.from({length: 40}, (_, i) => rms(d, i*.015, i*.015 + .015));
const alike = (p, q) => { let pq = 0, pp = 0, qq = 0; p.forEach((v, i) => { pq += v*q[i]; pp += v*v; qq += q[i]*q[i]; }); return pq/Math.sqrt(pp*qq); };
const curves = [1, 2, 3, 4, 5, 6, 7].map(seed => curve(thunderCrack(seed)));
let closest = 0;
curves.forEach((p, i) => curves.forEach((q, j) => i < j && (closest = Math.max(closest, alike(p, q)))));
check(closest < .985, `the cracks are shaped differently from one another (the two most alike match ${closest.toFixed(3)})`);
check(JSON.stringify([...thunderCrack(1).slice(0, 2000)]) === JSON.stringify([...crack.slice(0, 2000)]), 'the same seed gives the same thunder');
check(JSON.stringify([...thunderRoll(2).slice(0, 2000)]) !== JSON.stringify([...roll.slice(0, 2000)]), 'another seed another');
check(thunderDelay(100) >= .4 && thunderDelay(100) <= .8, `a strike 100m off is heard a good half second after it is seen (${thunderDelay(100).toFixed(2)}s)`);
const loud = thunderLoudness;
check(loud(60).crack > loud(300).crack*8 && loud(60).roll > loud(300).roll*3, 'thunder close by is far louder than thunder far off');
check(loud(300).roll/loud(60).roll > loud(300).crack/loud(60).crack*2, 'and the crack fades faster than the roll, so far thunder is mostly roll');
check(loud(0).crack <= 1 && loud(0).roll <= 1 && loud(1e4).roll >= 0, 'between nothing and full');
check(thunderDelay(30) >= .3 && thunderDelay(30) < thunderDelay(100) && thunderDelay(100) < thunderDelay(200), 'nearer sooner, further later');
check(thunderDelay(5000) <= 2.5, 'never so late it comes loose from its flash');
done('sound');
