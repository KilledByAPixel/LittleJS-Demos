// The cloud layer's seeded layout and drift: three layers, all wrapping inside their box however long it runs.
import {loadBlock, check, done} from './block.mjs';

// the layer heights and the wind come from the lightning and sea blocks, as they do on the page
const {CLOUD_BASE_Y} = loadBlock('LIGHTNING'), {WIND_DIR} = loadBlock('SEA');
const {cloudLayout, cloudPosAt, CLOUD_COUNT, CLOUD_BOX, CLOUD_LAYERS} = loadBlock('CLOUDS', {CLOUD_BASE_Y, WIND_DIR});

const clouds = cloudLayout(1);
check(clouds.length === CLOUD_COUNT && CLOUD_COUNT === 48, `48 clouds (${clouds.length})`);
check(clouds.every(c => CLOUD_LAYERS.some(y => Math.abs(c.y - y) <= 3)), 'each cloud sits in one of the three layers');
check(CLOUD_LAYERS.length === 3, 'three layers');
let inside = true;
for (const t of [0, 10, 1000, 3600])
for (const c of clouds)
{
    const p = cloudPosAt(c, t);
    if (Math.abs(p.x) > CLOUD_BOX/2 || Math.abs(p.z) > CLOUD_BOX/2 || ![p.x, p.y, p.z].every(Number.isFinite)) inside = false;
}
check(inside, 'every cloud stays inside the box, wrapping as it drifts');
check(cloudPosAt(clouds[0], 0).x !== cloudPosAt(clouds[0], 10).x, 'clouds drift');
check(JSON.stringify(cloudLayout(1)) === JSON.stringify(clouds), 'the same seed gives the same sky');
done('clouds');
