// The islet's seeded rock layout: a sensible count, all inside the island, reaching under the waves so nothing
// floats, the same for the same seed, and a clear footing for the tower.
import {loadBlock, check, done} from './block.mjs';

const {rockLayout, ISLAND_RADIUS} = loadBlock('ISLAND');

const rocks = rockLayout(1);
check(rocks.length >= 14 && rocks.length <= 30, `14 to 30 rocks (${rocks.length})`);
check(rocks.every(r => Math.hypot(r.x, r.z) <= ISLAND_RADIUS), 'every rock inside ISLAND_RADIUS');
check(Math.min(...rocks.map(r => r.y - r.sy/2)) <= -3, 'the lowest rock reaches 3m under the water');
check(JSON.stringify(rockLayout(1)) === JSON.stringify(rocks), 'the same seed gives the same layout');
check(JSON.stringify(rockLayout(2)) !== JSON.stringify(rocks), 'another seed gives another layout');
check(rocks.filter(r => Math.hypot(r.x, r.z) < 1.5).length < 2, 'the tower footing is clear');
check(rocks.every(r => [r.x, r.y, r.z, r.sx, r.sy, r.sz, r.yaw, r.pitch].every(Number.isFinite)), 'all finite');
done('island');
