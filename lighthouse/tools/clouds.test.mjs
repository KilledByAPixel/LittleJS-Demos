// The cloud deck's seeded layout and drift: banks of puffs in three layers, all wrapping inside their box however
// long it runs, each puff drawn with one of the baked cloud shapes.
import {loadBlock, check, done} from './block.mjs';

// the layer heights and the wind come from the lightning and sea blocks, as they do on the page
const {CLOUD_BASE_Y} = loadBlock('LIGHTNING'), {WIND_DIR} = loadBlock('SEA');
const {cloudLayout, cloudPosAt, CLOUD_BOX, CLOUD_LAYERS, CLOUD_VARIANTS, CLOUD_BANKS} =
    loadBlock('CLOUDS', {CLOUD_BASE_Y, WIND_DIR});

const clouds = cloudLayout(1);
check(clouds.length >= 90 && clouds.length <= 160, `a deck of 90 to 160 puffs (${clouds.length})`);
check(clouds.every(c => CLOUD_LAYERS.some(y => Math.abs(c.y - y) <= 4)), 'each puff sits in one of the three layers');
check(CLOUD_LAYERS.length === 3, 'three layers');
check(clouds.every(c => Number.isInteger(c.variant) && c.variant >= 0 && c.variant < CLOUD_VARIANTS),
    'each puff uses one of the baked shapes');
check(new Set(clouds.map(c => c.variant)).size === CLOUD_VARIANTS, 'and every shape is used');
check(new Set(clouds.map(c => c.bank)).size === CLOUD_BANKS, `puffs gather in ${CLOUD_BANKS} banks`);
// a bank's puffs stay together, so the sky shows between banks instead of an even haze
const spread = Math.max(...Array.from({length: CLOUD_BANKS}, (_, b) =>
{
    const p = clouds.filter(c => c.bank === b);
    return Math.max(...p.map(c => Math.hypot(c.x - p[0].x, c.z - p[0].z)));
}));
check(spread < CLOUD_BOX/3, `a bank keeps its puffs close (${spread.toFixed(0)}m)`);
let inside = true;
for (const t of [0, 10, 1000, 3600])
for (const c of clouds)
{
    const p = cloudPosAt(c, t);
    if (Math.abs(p.x) > CLOUD_BOX/2 || Math.abs(p.z) > CLOUD_BOX/2 || ![p.x, p.y, p.z].every(Number.isFinite)) inside = false;
}
check(inside, 'every puff stays inside the box, wrapping as it drifts');
check(cloudPosAt(clouds[0], 0).x !== cloudPosAt(clouds[0], 10).x, 'clouds drift');
check(JSON.stringify(cloudLayout(1)) === JSON.stringify(clouds), 'the same seed gives the same sky');
done('clouds');
