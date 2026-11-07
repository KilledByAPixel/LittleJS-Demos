#!/bin/sh
# Builds the cinematic's soundtrack with ffmpeg filters and muxes it onto a silent render.
#   sh demos/murmuration/tools/soundtrack.sh <silent.mp4> <outDir>
# Writes <outDir>/murmuration-master.mp4 (video stream untouched) and
# <outDir>/murmuration-share.mp4 (smaller, for posting).
# Times follow index.html: a whoosh at each hawk strike (CINE_PASSES time + 1.75s, started
# .3s early), a swell of wings while the flock pours down to roost (CINE_ROOST 20.5s on).
set -e
FFB="/c/Users/frank/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin"
SILENT="$1"; OUT="$2"; LENGTH=32

WHOOSH=""
for T in 7450 12950 17950; do
    WHOOSH="$WHOOSH anoisesrc=d=2.4:c=pink:a=0.7:r=48000,bandpass=f=700:width_type=o:w=1.6,tremolo=f=17:d=0.55,afade=t=in:d=0.35,afade=t=out:st=0.6:d=1.7,volume=6,adelay=$T,apad=whole_dur=$LENGTH[w$T];"
done
ROOST="anoisesrc=d=10:c=pink:a=0.5:r=48000,bandpass=f=900:width_type=o:w=2,tremolo=f=21:d=0.35,afade=t=in:d=3,afade=t=out:st=5:d=5,volume=3,adelay=21000,apad=whole_dur=$LENGTH[roost];"
WIND="anoisesrc=d=$LENGTH:c=brown:a=0.6:r=48000,lowpass=f=380,volume='0.4+0.2*sin(2*PI*t/6.5)':eval=frame,afade=t=in:d=2.5,afade=t=out:st=29:d=3[wind];"

"$FFB/ffmpeg" -v error -y -filter_complex \
    "$WIND$WHOOSH$ROOST[wind][w7450][w12950][w17950][roost]amix=inputs=5:normalize=0:duration=first,alimiter=limit=0.8[a]" \
    -map "[a]" -t $LENGTH -c:a aac -b:a 192k "$OUT/soundtrack.m4a"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/soundtrack.m4a" -map 0:v -map 1:a -c copy -movflags +faststart -shortest "$OUT/murmuration-master.mp4"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/soundtrack.m4a" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 \
    -pix_fmt yuv420p -c:a copy -movflags +faststart -shortest "$OUT/murmuration-share.mp4"
ls -la "$OUT"
