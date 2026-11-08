// The sea's wave sum, the JS twin of the shader's: finite, swells of 1 to 2 meters as the spec asks, and moving.
import {loadBlock, check, done} from './block.mjs';

const {seaHeightAt, WAVES} = loadBlock('SEA');

check(Number.isFinite(seaHeightAt(0, 0, 0)), 'finite at the origin');
let peak = 0;
for (let x = -50; x < 50; x += 2)
for (let z = -50; z < 50; z += 2)
    peak = Math.max(peak, Math.abs(seaHeightAt(x, z, 3)));
check(peak >= .8 && peak <= 2.2, `swells between .8 and 2.2m (peak ${peak.toFixed(2)})`);
check(seaHeightAt(10, 10, 1) !== seaHeightAt(10, 10, 2), 'the surface moves');
check(WAVES.length >= 3, 'at least three waves so it never reads as one sine');
done('sea');
