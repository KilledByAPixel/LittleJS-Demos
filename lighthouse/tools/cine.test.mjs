// The cinematic's own curves: the rain thickening toward the end, and the chromatic kick of the big strike.
import {loadBlock, check, done} from './block.mjs';

const {flicker, STRIKE_LENGTH} = loadBlock('LIGHTNING');
const {cineRainRate, bigStrikeChroma} = loadBlock('CINE', {flicker, STRIKE_LENGTH});

check(cineRainRate(10) === 1 && cineRainRate(18.4) === 1, 'normal rain before 18.5s');
check(Math.abs(cineRainRate(25.5) - 1.6) < .01, 'thickened to 1.6 by 25.5s');
check(cineRainRate(40) === 1.6, 'and holds there');
check(cineRainRate(22) > 1 && cineRainRate(22) < 1.6, 'rising in between');
check(bigStrikeChroma(-.01) === 0 && bigStrikeChroma(STRIKE_LENGTH + .01) === 0, 'no fringe outside the strike');
check(bigStrikeChroma(.02) > .005, 'a clear fringe at the strike\'s peak');
done('cine');
