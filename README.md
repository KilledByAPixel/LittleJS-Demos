# LittleJS Demos

Showcase demos made with [LittleJS](https://github.com/KilledByAPixel/LittleJS), the tiny fast JavaScript game engine.
Each demo is a self-contained folder with its own copy of the engine, so it runs straight from disk or any web server.

## Demos

### [Lighthouse](https://killedbyapixel.github.io/LittleJS-Demos/lighthouse/)

A lighthouse on a rocky islet in a blue-hour storm, in LittleJS 3D. Rain streaks through the turning beam, swells burst into spray on the rocks, and lightning lights the clouds, the sea and the rocks from where it strikes. Its sound is all made in code as it loads: rain, wind, the surge of the sea, and thunder that arrives after each flash, later and fainter the further off it strikes.

- **Click**: lightning where you point, on the sea, the clouds, or the lighthouse itself (the first click also starts the sound)
- **F**: free camera (WASD to move, drag to look, Q/E down and up, Shift faster)
- **R**: a new storm
- **Space**: slow motion
- **H**: hide the text
- **T**: show the title

Add `?cinematic` to the URL to play the 30 second sequence from the video.

Source: [lighthouse/index.html](lighthouse/index.html)

### [Murmuration](https://killedbyapixel.github.io/LittleJS-Demos/murmuration/)

40,000 starlings at dusk over a lake, in LittleJS 3D. Steer the hawk with the mouse to scatter the flock.

- **Mouse**: the hawk follows it, click to strike (the first click also starts the sound)
- **G**: the flock flies away over the mountains, then returns
- **F**: free camera (WASD to move, drag to look, Q/E down and up, Shift faster)
- **R**: a new flock
- **A**: hawk autopilot on/off
- **Space**: slow motion
- **H**: hide the text
- **Mouse wheel**: more or fewer birds

Add `?cinematic` to the URL to play the 32 second sequence from the video.

Source: [murmuration/index.html](murmuration/index.html)

## License

Copyright (c) 2026 Frank Force. The demos are licensed under the [GNU General Public License v3.0](LICENSE).

You're welcome to play them, study them and learn from them. If you share a copy or a changed version, it has to
stay open source under the same license, with credit kept. Each demo's `littlejs.js` is a copy of the
[LittleJS](https://github.com/KilledByAPixel/LittleJS) engine, which keeps its own MIT license.
