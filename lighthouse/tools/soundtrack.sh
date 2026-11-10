#!/bin/sh
# Builds the cinematic's soundtrack with ffmpeg filters and muxes it onto a silent render.
#   sh lighthouse/tools/soundtrack.sh <silent.mp4> <outDir>
# Writes <outDir>/lighthouse-master.mp4 (video stream untouched) and
# <outDir>/lighthouse-share.mp4 (smaller, for posting).
# Thunder for each strike comes from thunder.mjs, the page's own sound; rain that thickens from CINE_RAIN_START 18.5s to 25.5s;
# the sea surging on the long swell's period, about 4.9s.
set -e
FFB="/c/Users/frank/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin"
SILENT="$1"; OUT="$2"; LENGTH=30

# the thunder is the page's own, laid out for the cinematic's strikes by thunder.mjs: a crack and a long roll for
# each, late by its distance from the camera
node "$(dirname "$0")/thunder.mjs" "$OUT/lighthouse-thunder.wav" $LENGTH
RAIN="anoisesrc=d=$LENGTH:c=pink:a=0.5:r=48000,highpass=f=1200,lowpass=f=9000,volume='0.17+0.13*clip((t-18.5)/7\,0\,1)':eval=frame,afade=t=in:d=1.5[rain];"
WIND="anoisesrc=d=$LENGTH:c=brown:a=0.6:r=48000,lowpass=f=420,volume='0.22+0.1*sin(2*PI*t/7.3)':eval=frame[wind];"
SEA="anoisesrc=d=$LENGTH:c=brown:a=0.8:r=48000,lowpass=f=700,volume='0.1+0.18*pow(0.5+0.5*sin(2*PI*t/4.9)\,3)':eval=frame,afade=t=in:d=2[sea];"

"$FFB/ffmpeg" -v error -y -i "$OUT/lighthouse-thunder.wav" -filter_complex     "$RAIN$WIND$SEA[0:a]aresample=48000,volume=1.5[thunder];[rain][wind][sea][thunder]amix=inputs=4:normalize=0:duration=first,afade=t=out:st=$((LENGTH - 3)):d=3,alimiter=limit=0.8[a]"     -map "[a]" -t $LENGTH -c:a aac -b:a 192k "$OUT/lighthouse-soundtrack.m4a"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/lighthouse-soundtrack.m4a" -map 0:v -map 1:a -c copy -movflags +faststart -shortest "$OUT/lighthouse-master.mp4"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/lighthouse-soundtrack.m4a" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 \
    -pix_fmt yuv420p -c:a copy -movflags +faststart -shortest "$OUT/lighthouse-share.mp4"
ls -la "$OUT"
