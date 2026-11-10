// The islet's shape: one heightfield of crags and ledges, level where the tower and the cottage stand, sunk well
// under the swells at its edge so nothing floats, with skerries breaking the surface round it.
import {loadBlock, check, done} from './block.mjs';

const {islandHeightAt, islandShore, islandSprayPoints, ISLAND_SIZE, SHELF_Y, SKERRIES, PAD} = loadBlock('ISLAND');

check(islandHeightAt(0, 0) === SHELF_Y, 'the tower stands on the crown');
let level = true, finite = true, lowest = 0, highest = 0;
for (let a = 0; a < 6.28; a += .2)
for (const r of [1, 2.5, 4])
    if (islandHeightAt(Math.sin(a)*r, Math.cos(a)*r) !== SHELF_Y) level = false;
check(level, 'the crown is level out to 4m, room for the tower\'s foot');
for (let a = 0; a < 6.28; a += .3)
    if (islandHeightAt(PAD.x + Math.sin(a)*(PAD.r - .3), PAD.z + Math.cos(a)*(PAD.r - .3)) !== SHELF_Y) level = false;
check(level, 'and level under the cottage');
for (let x = -ISLAND_SIZE/2; x <= ISLAND_SIZE/2; x += .37)
for (let z = -ISLAND_SIZE/2; z <= ISLAND_SIZE/2; z += .37)
{
    const y = islandHeightAt(x, z);
    if (!Number.isFinite(y)) finite = false;
    lowest = Math.min(lowest, y), highest = Math.max(highest, y);
}
check(finite, 'a height everywhere');
check(highest <= SHELF_Y + 5 && highest > SHELF_Y, `outcrops stand above the crown, but under the gallery (${highest.toFixed(1)}m)`);
// the sea's swells reach 2m down in their troughs: the mesh's edge has to stay under them
let edge = -9;
for (let k = -ISLAND_SIZE/2; k <= ISLAND_SIZE/2; k += .25)
    for (const [x, z] of [[k, ISLAND_SIZE/2], [k, -ISLAND_SIZE/2], [ISLAND_SIZE/2, k], [-ISLAND_SIZE/2, k]])
        edge = Math.max(edge, islandHeightAt(x, z));
check(edge < -2.5, `the edge of the mesh is sunk under the troughs (${edge.toFixed(1)}m)`);
// the shore: rock above the water inside it, sea outside it
let dry = 0, wet = 0, n = 0;
for (let a = 0; a < 6.28; a += .05, ++n)
{
    const r = islandShore(a);
    if (islandHeightAt(Math.sin(a)*r*.6, Math.cos(a)*r*.6) > .5) ++dry;
    if (islandHeightAt(Math.sin(a)*r*1.02, Math.cos(a)*r*1.02) < 1.5) ++wet;
}
check(dry === n, `rock stands above the water inside the shore (${dry}/${n})`);
check(wet > n*.8, `and comes down to it at the shore (${wet}/${n})`);
check(SKERRIES.length >= 3 && SKERRIES.every(s => islandHeightAt(s.x, s.z) > .8), 'every skerry breaks the surface');
check(SKERRIES.every(s => Math.hypot(s.x, s.z) + s.r*1.7 < ISLAND_SIZE/2), 'and lies inside the mesh');
// spray: where the swells meet the rock on the side the wind comes from
const wind = [.29, -.96], points = islandSprayPoints(wind[0], wind[1]);
check(points.length >= 6 && points.length <= 12, `6 to 12 spray points (${points.length})`);
check(points.every(p => p.x*wind[0] + p.z*wind[1] < 2), 'all on the upwind side');
check(points.every(p => Math.abs(islandHeightAt(p.x, p.z)) < 1.6), 'each at the waterline');
check(JSON.stringify(islandSprayPoints(wind[0], wind[1])) === JSON.stringify(points), 'the same every time');
done('island');
