// The cinematic camera path: where it starts, where each leg lands, and that it never dips into the swells.
import {loadBlock, check, done} from './block.mjs';

const vec3 = (x=0, y=0, z=0) => ({x, y, z});
const {cameraPathAt, EYE_MIN} = loadBlock('CAMERA', {vec3});

check(cameraPathAt(0).pos.z === 68, 'starts 68m out');
check(Math.abs(cameraPathAt(12).pos.z - 48) < .01, 'the dolly lands 48m out at 12s');
check(cameraPathAt(16).pos.x < -5, 'drifts round the island to the left by 16s');
check(cameraPathAt(100).pos.y >= EYE_MIN, 'stays above the swells long after the cut');
let bad = 0;
for (let t = 0; t <= 60; t += .1)
{
    const {pos, target} = cameraPathAt(t);
    const values = [pos.x, pos.y, pos.z, target.x, target.y, target.z];
    if (values.some(v => !Number.isFinite(v)) || pos.y < EYE_MIN) ++bad;
}
check(bad === 0, `every sample 0..60s finite and above EYE_MIN (${bad} bad)`);
done('cameraPath');
