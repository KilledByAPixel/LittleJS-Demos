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
check(JSON.stringify(cine.map(s => s.t)) === '[3.5,11,15,18.5,23]', 'the cinematic strikes at 3.5, 11, 15, 18.5 and 23s');
check(cine.map(s => s.kind + (s.big ? '!' : '')).join() === 'cloud,ground,cloud,ground!,cloud',
    'cloud, ground, cloud, the big one, and a last flash in the cloud');
const live = makeSchedule(seeded(7), false), again = makeSchedule(seeded(7), false);
const gaps = live.slice(1).map((s, i) => s.t - live[i].t);
check(live.length > 20, `the live schedule covers a long run (${live.length})`);
check(gaps.every(g => g >= 4 && g <= 9), 'live strikes 4 to 9 seconds apart');
check(JSON.stringify(live) === JSON.stringify(again), 'the same seed gives the same schedule');
check(live.every(s => [s.x, s.y, s.z].every(Number.isFinite)), 'every strike has a finite position');

const a = {x: 0, y: 45, z: -40}, b = {x: 10, y: 0, z: -50};
const bolt = boltPoints(a, b, 1);
const near = (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < .01;
check(bolt.main.length >= 30 && bolt.main.length <= 130, `the main channel is finely jagged, 30 to 130 points (${bolt.main.length})`);
check(near(bolt.main[0], a) && near(bolt.main.at(-1), b), 'the bolt runs from cloud to strike point');
check(bolt.main.every((p, i) => !i || p.y <= bolt.main[i-1].y + 1e-9), 'it only ever comes down, never loops back up');
// it wanders sideways, but never more than a share of its length off the straight line
const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
const off = p => { const t = (a.y - p.y)/(a.y - b.y); return Math.hypot(p.x - (a.x + (b.x - a.x)*t), p.z - (a.z + (b.z - a.z)*t)); };
const wander = Math.max(...bolt.main.map(off));
check(wander > len*.03 && wander < len*.3, `it wanders, but stays a bolt (${(wander/len).toFixed(2)} of its length)`);
check(bolt.branches.length >= 3 && bolt.branches.length <= 8, `3 to 8 branches fork off it (${bolt.branches.length})`);
check(bolt.branches.every(br => br.points.length >= 4 && br.weight > 0 && br.weight < 1), 'each branch is thinner than the main channel');
check(bolt.branches.every(br => br.points.at(-1).y < br.points[0].y), 'and heads down');
check(bolt.branches.every(br => bolt.main.some(p => near(p, br.points[0])) || bolt.branches.some(o => o !== br && o.points.some(p => near(p, br.points[0])))),
    'every branch starts on the channel or on another branch');
check(boltPoints(a, b, 1, true).branches.length > bolt.branches.length, 'a big strike forks more');
check(JSON.stringify(boltPoints(a, b, 1)) === JSON.stringify(bolt), 'the same seed gives the same bolt');
check(JSON.stringify(boltPoints(a, b, 2)) !== JSON.stringify(bolt), 'another seed gives another bolt');
// a cloud to cloud bolt runs level: it still goes from end to end without turning back on itself
const c = {x: -30, y: 50, z: -90}, d = {x: 30, y: 46, z: -90};
const level = boltPoints(c, d, 3).main;
check(level.every((p, i) => !i || p.x >= level[i-1].x - 1e-9), 'a level bolt never doubles back along its way');
done('lightning');
