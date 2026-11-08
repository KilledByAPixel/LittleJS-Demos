// The beam's turn, the inside-the-cone test the rain reads, and the rain's box that follows the camera.
import {loadBlock, check, done} from './block.mjs';

const {CLOUD_BASE_Y} = loadBlock('LIGHTNING'), {WIND_DIR} = loadBlock('SEA');
const {beamYawAt, insideBeamMath, rainStep, BEAM_PERIOD, BEAM_LENGTH, RAIN_BOX} =
    loadBlock('BEAM', {CLOUD_BASE_Y, WIND_DIR, LANTERN_Y: 19.5});

check(beamYawAt(0) === 0, 'the beam starts facing its zero');
check(Math.abs(beamYawAt(BEAM_PERIOD) - 2*Math.PI) < 1e-6, 'one turn every BEAM_PERIOD seconds');

// yaw 0 points down -Z, as the camera's does
check(insideBeamMath(0, 19.5, -40, 0), 'a point 40m down the beam at lantern height is inside');
check(!insideBeamMath(0, 19.5, 40, 0), 'a point 40m behind it is not in this beam');
check(insideBeamMath(0, 19.5, 40, Math.PI), 'but is in the one turned half round, the back to back beam');
check(!insideBeamMath(0, 19.5, -(BEAM_LENGTH + 20), 0), 'nothing past the beam\'s end');
check(!insideBeamMath(30, 19.5, -10, 0), 'nothing far off to the side');

let state = {x: 5, y: 20, z: 5};
let ok = true;
for (let i = 0; i < 600; ++i)
{
    state = rainStep(state.x, state.y, state.z, 1/60, 0, 50);
    if (Math.abs(state.x) > RAIN_BOX/2 || Math.abs(state.z - 50) > RAIN_BOX/2 || state.y > CLOUD_BASE_Y || !Number.isFinite(state.y)) ok = false;
}
check(ok, 'a drop stepped 10s stays in the box round the camera and below the clouds');
done('beam');
