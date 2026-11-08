// Where a click's ray calls down a strike: the island, the sea, the cloud base, or far along a ray that meets none,
// and never a position that isn't a number.
import {loadBlock, check, done} from './block.mjs';

const {CLOUD_BASE_Y} = loadBlock('LIGHTNING');
const {resolveStrike} = loadBlock('CLICK', {CLOUD_BASE_Y, ISLAND_RADIUS: 12, SHELF_Y: 4, TOWER_HEIGHT: 23.3});

const finite = r => [r.x, r.y, r.z].every(Number.isFinite);
const norm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x/l, y/l, z/l]; };

let r = resolveStrike(0, 4, 65, ...norm(0, -.1, -1));
check(r.kind === 'ground' && Math.abs(r.z) < 200 && finite(r), 'a ray down toward the sea strikes the sea');
r = resolveStrike(0, 4, 65, ...norm(0, .6, -1));
check(r.kind === 'cloud' && Math.abs(r.y - CLOUD_BASE_Y) < .5 && finite(r), 'a ray up into the sky strikes the cloud base');
r = resolveStrike(0, 4, 65, 0, 0, -1);
check(finite(r), 'a level ray still gives a finite strike');
r = resolveStrike(0, 4, 65, 0, 1, 0);
check(r.kind === 'cloud' && Math.abs(r.y - CLOUD_BASE_Y) < .5 && finite(r), 'straight up strikes the cloud base');
r = resolveStrike(0, 4, 65, 0, -1, 0);
check(r.kind === 'ground' && Math.abs(r.z - 65) < .01 && finite(r), 'straight down strikes the sea under the camera');
r = resolveStrike(0, 4, 65, ...norm(0, -.02, -1));
check(r.kind === 'ground' && Math.hypot(r.x, r.z) <= 12.5 && finite(r), 'a ray at the island strikes the island');
r = resolveStrike(0, 4, 65, ...norm(0, -.0001, -1));
check(finite(r) && Math.hypot(r.x - 0, r.z - 65) <= 400.5, 'a ray grazing the water lands within 400m');
r = resolveStrike(0, 4, 65, ...norm(0, .1, -1));
check(r.kind === 'tower' && Math.abs(r.y - 23.3) < .01 && finite(r), 'a ray at the tower strikes the lighthouse itself');
done('click');
