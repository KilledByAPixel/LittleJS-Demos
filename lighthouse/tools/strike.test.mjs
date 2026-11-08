// Where a strike lands once resolved: a ground strike meets the water's moving surface, not the flat sea level a
// swell would hide it under; the tower and the cloud kinds keep their own heights.
import {loadBlock, check, done} from './block.mjs';

const {CLOUD_BASE_Y} = loadBlock('LIGHTNING'), {seaHeightAt} = loadBlock('SEA');
const {strikeTarget} = loadBlock('CLICK', {CLOUD_BASE_Y, ISLAND_RADIUS: 12, SHELF_Y: 4, TOWER_HEIGHT: 23.3, seaHeightAt});

for (const [x, z, t] of [[10, 10, 3], [-40, 25, 7.5], [80, -60, 12]])
{
    const p = strikeTarget('ground', x, 0, z, t);
    check(Math.abs(p.y - seaHeightAt(x, z, t)) < 1e-9 && p.x === x && p.z === z, `ground strike at (${x}, ${z}) meets the water`);
}
const rock = strikeTarget('ground', 3, 2.5, 4, 3);
check(rock.y === 2.5, 'a strike on the rocks keeps the rock height');
check(strikeTarget('tower', 0, 23.3, 0, 3).y === 23.3, 'a tower strike keeps the tower top');
check(strikeTarget('cloud', 5, CLOUD_BASE_Y, 5, 3).y === CLOUD_BASE_Y + 8, 'a cloud strike sits up in the layer');
done('strike');
