// The thunder's sound, worked out from noise: a crack that is one hard snap and done, a roll that goes on for
// seconds and dies away smoothly, neither with a steady flutter on it, and the wait after the flash by distance.
import {loadBlock, check, done} from './block.mjs';

const {thunderCrack, thunderRoll, thunderDelay, SOUND_RATE} = loadBlock('SOUND');

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
check(JSON.stringify([...thunderCrack(1).slice(0, 2000)]) === JSON.stringify([...crack.slice(0, 2000)]), 'the same seed gives the same thunder');
check(JSON.stringify([...thunderRoll(2).slice(0, 2000)]) !== JSON.stringify([...roll.slice(0, 2000)]), 'another seed another');
check(thunderDelay(100) >= .5 && thunderDelay(100) <= 1.2, `a strike 100m off is heard about a second after it is seen (${thunderDelay(100).toFixed(2)}s)`);
check(thunderDelay(30) >= .3 && thunderDelay(30) < thunderDelay(100) && thunderDelay(100) < thunderDelay(200), 'nearer sooner, further later');
check(thunderDelay(5000) <= 2.5, 'never so late it comes loose from its flash');
done('sound');
