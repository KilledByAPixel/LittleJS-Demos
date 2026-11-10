// The cloud deck's seeded layout and drift: one big sprite a cloud, spaced so no two overlap much where the draw
// order between them could change (that showed as popping), all drifting as one deck and wrapping inside their box,
// faded out at the box's edge so the wrap is never seen.
import {loadBlock, check, done} from './block.mjs';

// the base height and the wind come from the lightning and sea blocks, as they do on the page
const {CLOUD_BASE_Y} = loadBlock('LIGHTNING'), {WIND_DIR} = loadBlock('SEA');
const {cloudLayout, cloudPosAt, CLOUD_BOX, CLOUD_DECKS, CLOUD_VARIANTS, CLOUD_FOOT, CLOUD_BODY} = loadBlock('CLOUDS', {CLOUD_BASE_Y, WIND_DIR});

const clouds = cloudLayout(1);
check(clouds.length === CLOUD_DECKS.reduce((n, d) => n + d.grid*d.grid, 0) && clouds.length >= 25 && clouds.length <= 64, `a sky of 25 to 64 clouds (${clouds.length})`);
check(clouds.every(c => Number.isInteger(c.variant) && c.variant >= 0 && c.variant < CLOUD_VARIANTS), 'each uses one of the baked shapes');
check(new Set(clouds.map(c => c.variant)).size === CLOUD_VARIANTS, 'and every shape is used');
// two clouds the same distance from the camera sit side by side: they must not overlap by more than their thin ends
const wrapped = d => Math.abs(d) > CLOUD_BOX/2 ? CLOUD_BOX - Math.abs(d) : Math.abs(d);
let tightest = 9;
for (const a of clouds)
for (const b of clouds)
    if (a !== b && a.deck === b.deck) tightest = Math.min(tightest, Math.hypot(wrapped(a.x - b.x), wrapped(a.z - b.z))/((a.size + b.size)/2));
check(tightest >= .7, `neighbors in a deck keep their distance, ${tightest.toFixed(2)} of their width apart at the least`);
// a sprite is half as tall as wide, its cloud between CLOUD_FOOT and CLOUD_BODY of the way up it
const foot = c => c.y - c.size/4 + CLOUD_FOOT*c.size/2, top = c => c.y - c.size/4 + CLOUD_BODY*c.size/2;
const lowTop = Math.max(...clouds.filter(c => c.deck === 0).map(top)), highFoot = Math.min(...clouds.filter(c => c.deck === 1).map(foot));
check(highFoot > lowTop, `the high deck clears the low one, so they never meet (${highFoot.toFixed(0)}m over ${lowTop.toFixed(0)}m)`);
check(clouds.every(c => foot(c) >= CLOUD_BASE_Y - 1e-6), 'no cloud has its foot under the base the lightning comes from');
let inside = true, rigid = true, faded = true;
for (const t of [0, 10, 1000, 3600])
{
    const first = cloudPosAt(clouds[0], t), start = cloudPosAt(clouds[0], 0);
    for (const c of clouds)
    {
        const p = cloudPosAt(c, t), p0 = cloudPosAt(c, 0);
        if (Math.abs(p.x) > CLOUD_BOX/2 || Math.abs(p.z) > CLOUD_BOX/2 || ![p.x, p.y, p.z, p.fade].every(Number.isFinite)) inside = false;
        // the same drift for every cloud, give or take a wrap
        if (wrapped(wrapped(p.x - p0.x) - wrapped(first.x - start.x)) > 1e-6) rigid = false;
        if (p.fade < 0 || p.fade > 1 || Math.max(Math.abs(p.x), Math.abs(p.z)) > CLOUD_BOX/2 - 1 && p.fade > .05) faded = false;
    }
}
check(inside, 'every cloud stays inside the box, wrapping as it drifts');
check(rigid, 'the whole deck drifts as one, so no cloud ever passes through another');
check(faded, 'a cloud is faded out by the time it reaches the edge and wraps');
check(clouds.some(c => cloudPosAt(c, 0).fade === 1), 'and fully there away from the edge');
check(cloudPosAt(clouds[0], 0).x !== cloudPosAt(clouds[0], 10).x, 'clouds drift');
check(JSON.stringify(cloudLayout(1)) === JSON.stringify(clouds), 'the same seed gives the same sky');
done('clouds');
