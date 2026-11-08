// Drives one headless Edge over the DevTools protocol to look at the demo.
//
//   node capture.mjs shots  <outDir> [query] [count] [intervalMs] [width] [height]
//       real time screenshots of the running page, shot0.png, shot1.png...
//       MURM_EVAL=expr prints that page expression with each shot, MURM_PAGE=file.html loads another page,
//       MURM_BEFORE=expr runs before each shot
//   node capture.mjs record <out.mp4> [query] [seconds] [width] [height]
//       a frame exact 60fps video: the page runs with ?record (engine manual step),
//       each frame is stepped, screenshot and piped into ffmpeg
//
// Only one browser at a time: it kills any leftover instance of its own profile on
// start, kills its own process tree when done, and gives up after a hard time limit.
import {spawn, execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FFMPEG = 'C:/Users/frank/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe';
const PROFILE_TAG = 'lighthousecap-profile';
const profileDir = path.join(process.env.TEMP, PROFILE_TAG);
const PORT = 9333;

const [mode, out, query = '', ...rest] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function sweep()
{
    try
    {
        execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='msedge.exe'\\" | ` +
            `Where-Object { $_.CommandLine -like '*${PROFILE_TAG}*' } | ` +
            `ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, {stdio:'ignore'});
    }
    catch {}
}

let edge, ffmpeg, cleaned = false;
function cleanup()
{
    if (cleaned) return;
    cleaned = true;
    if (edge) try { execSync(`taskkill /pid ${edge.pid} /T /F`, {stdio:'ignore'}); } catch {}
    sweep();
    try { fs.rmSync(profileDir, {recursive:true, force:true}); } catch {}
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(1));

// hard limit, so a stuck page never leaves a browser running
const limitMinutes = mode == 'record' ? 60 : 5;
setTimeout(() => { console.error('hard time limit hit'); process.exit(2); }, limitMinutes*60e3).unref();

async function main()
{
    sweep();
    const width = +(mode == 'record' ? rest[1] : rest[2]) || 1920;
    const height = +(mode == 'record' ? rest[2] : rest[3]) || 1080;
    edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profileDir}`,
        '--mute-audio', '--hide-scrollbars', `--window-size=${width},${height}`,
        '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', 'about:blank'], {stdio:'ignore'});

    // wait for the debugger, then attach to the page
    let target;
    for (let k = 0; k < 50 && !target; ++k)
    {
        await sleep(200);
        try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type == 'page'); }
        catch {}
    }
    if (!target) throw new Error('no debugger target');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let nextId = 1;
    const pending = new Map(), listeners = [];
    ws.onmessage = e =>
    {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id))
        {
            const {resolve, reject} = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
        }
        else if (msg.method)
            for (const l of listeners) l(msg);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) =>
    {
        const id = nextId++;
        pending.set(id, {resolve, reject});
        ws.send(JSON.stringify({id, method, params}));
    });
    const evaluate = async expr =>
    {
        const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true});
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    listeners.push(msg =>
    {
        if (msg.method == 'Runtime.consoleAPICalled' && msg.params.type != 'log')
            console.log('console.' + msg.params.type + ':', msg.params.args.map(a => a.value ?? a.description).join(' '));
        if (msg.method == 'Runtime.exceptionThrown')
            console.log('page exception:', msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    });
    await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});

    const page = pathToFileURL(path.join(here, '../' + (process.env.MURM_PAGE || 'index.html'))).href;
    const loaded = new Promise(r => listeners.push(m => m.method == 'Page.loadEventFired' && r()));
    await send('Page.navigate', {url: page + (mode == 'record' ? (query ? query + '&record' : '?record') : query)});
    await loaded;
    await sleep(500);
    console.log('renderer:', await evaluate(`(() => { const gl = document.createElement('canvas').getContext('webgl2');
        const e = gl && gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`));

    if (mode == 'shots')
    {
        const count = +rest[0] || 4, interval = +rest[1] || 2000;
        fs.mkdirSync(out, {recursive: true});
        for (let k = 0; k < count; ++k)
        {
            await sleep(k ? interval : 1500);
            // MURM_INPUT=1 plays with it like a person: sweep the mouse across the middle before
            // every shot, click on the second, press G on the third
            if (process.env.MURM_INPUT)
            {
                for (let m = 0; m <= 30; ++m)
                {
                    await send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: width*(.2 + .6*m/30), y: height*(.35 + .1*Math.sin(m/5))});
                    await sleep(30);
                }
                if (k == 1)
                    for (const type of ['mousePressed', 'mouseReleased'])
                        await send('Input.dispatchMouseEvent', {type, x: width*.8, y: height*.4, button: 'left', clickCount: 1});
                if (k == 2)
                    for (const type of ['keyDown', 'keyUp'])
                        await send('Input.dispatchKeyEvent', {type, code: 'KeyG', key: 'g', windowsVirtualKeyCode: 71});
                await sleep(300);
            }
            // MURM_BEFORE=expression runs in the page before each shot, e.g. to set up the free cam
            if (process.env.MURM_BEFORE)
            {
                await evaluate(process.env.MURM_BEFORE);
                await sleep(500);
            }
            const shot = await send('Page.captureScreenshot', {format: 'png'});
            fs.writeFileSync(path.join(out, `shot${k}.png`), Buffer.from(shot.data, 'base64'));
            console.log(`shot${k}: fps ${Math.round(await evaluate('fpsSmooth'))}, storm time ${(await evaluate('stormTime')).toFixed(2)}s`);
            // MURM_EVAL=expression prints something from the page with each shot, e.g. its timings
            if (process.env.MURM_EVAL)
                console.log('  ' + JSON.stringify(await evaluate(process.env.MURM_EVAL)));
        }
    }
    else if (mode == 'record')
    {
        const seconds = +rest[0] || 20, frames = Math.round(seconds*60);
        await evaluate('new Promise(r => { const wait = () => recordReady ? r() : setTimeout(wait, 50); wait(); })');
        // MURM_SKIP=seconds steps the page ahead before recording, to look at the end of a shot quickly
        const skip = Math.round(+(process.env.MURM_SKIP || 0)*60);
        for (let k = 0; k < skip; k += 600) await evaluate(`engineStep(${Math.min(600, skip - k)})`);
        ffmpeg = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-i', '-',
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
            {stdio: ['pipe', 'inherit', 'inherit']});
        const start = Date.now();
        for (let f = 0; f < frames; ++f)
        {
            await evaluate('engineStep(1)');
            const shot = await send('Page.captureScreenshot', {format: 'png', optimizeForSpeed: true});
            if (!ffmpeg.stdin.write(Buffer.from(shot.data, 'base64')))
                await new Promise(r => ffmpeg.stdin.once('drain', r));
            if (f % 300 == 0)
                console.log(`frame ${f}/${frames}, ${((Date.now() - start)/1e3).toFixed(0)}s`);
        }
        ffmpeg.stdin.end();
        await new Promise(r => ffmpeg.on('close', r));
        console.log(`wrote ${out}: ${frames} frames in ${((Date.now() - start)/1e3).toFixed(0)}s`);
    }
    else
        throw new Error('mode is shots or record');
    ws.close();
}

main().then(() => process.exit(0), e => { console.error(e.message); process.exit(1); });
