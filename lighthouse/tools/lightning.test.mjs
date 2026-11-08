// Lightning's math: the flicker curve's shape, the seeded strike schedule, and the bolt's jagged path.
import {loadBlock, check, done} from './block.mjs';

const {flicker, STRIKE_LENGTH, makeSchedule, boltPoints} = loadBlock('LIGHTNING');

// a seeded stand in for RandomGenerator.float: xorshift, 0..1
const seeded = seed => { let s = seed; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0)/4294967296; }; };

check(flicker(0) >= .9, 'a strike starts at full brightness');
check(flicker(STRIKE_LENGTH) === 0, 'and is dark once it is over');
check(flicker(-.01) === 0, 'and dark before it starts');
check(flicker(.1) < flicker(.14), 'it flickers: a second peak after the first dip');

const cine = makeSchedule(seeded(7), true);
check(cine.length === 3 && cine[0].t === 4 && cine[1].t === 12 && cine[2].t === 20, 'the cinematic strikes at 4, 12 and 20s');
check(cine[0].kind === 'cloud' && cine[1].kind === 'ground' && cine[2].kind === 'ground' && cine[2].big, 'cloud, ground, then the big one');
const live = makeSchedule(seeded(7), false), again = makeSchedule(seeded(7), false);
const gaps = live.slice(1).map((s, i) => s.t - live[i].t);
check(live.length > 20, `the live schedule covers a long run (${live.length})`);
check(gaps.every(g => g >= 4 && g <= 9), 'live strikes 4 to 9 seconds apart');
check(JSON.stringify(live) === JSON.stringify(again), 'the same seed gives the same schedule');
check(live.every(s => [s.x, s.y, s.z].every(Number.isFinite)), 'every strike has a finite position');

const a = {x: 0, y: 45, z: -40}, b = {x: 10, y: 0, z: -50};
const bolt = boltPoints(a, b, 1);
const near = (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < .01;
check(bolt.main.length >= 10 && bolt.main.length <= 40, `bolt has 10 to 40 points (${bolt.main.length})`);
check(near(bolt.main[0], a) && near(bolt.main.at(-1), b), 'the bolt runs from cloud to strike point');
check(bolt.branch.length >= 3, 'it has a branch');
check(JSON.stringify(boltPoints(a, b, 1)) === JSON.stringify(bolt), 'the same seed gives the same bolt');
check(JSON.stringify(boltPoints(a, b, 2)) !== JSON.stringify(bolt), 'another seed gives another bolt');
done('lightning');
