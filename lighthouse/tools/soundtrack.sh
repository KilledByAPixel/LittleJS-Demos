#!/bin/sh
# Builds the cinematic's soundtrack with ffmpeg filters and muxes it onto a silent render.
#   sh lighthouse/tools/soundtrack.sh <silent.mp4> <outDir>
# Writes <outDir>/lighthouse-master.mp4 (video stream untouched) and
# <outDir>/lighthouse-share.mp4 (smaller, for posting).
# Times follow index.html's makeSchedule: thunder for each strike, its crack and rumble late by the
# distance from the camera at the speed of sound; rain that thickens from CINE_RAIN_START 18.5s to 25.5s;
# the sea surging on the long swell's period, about 4.9s.
set -e
FFB="/c/Users/frank/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin"
SILENT="$1"; OUT="$2"; LENGTH=30

# strike time in ms, delay in ms, boom loudness, crack loudness (cloud strikes are far up and crack less).
# A strike is a crack, a sharp tearing burst in the middle of the hearing range with its echoes coming back off the
# sea, then a boom that rolls on for seconds, kept wide enough (up to 700Hz) that small speakers still carry it
THUNDER=""; LABELS=""; N=0
for S in "3500 500 3 0.9" "11000 300 4.5 2.6" "15000 420 3.5 1.1" "18500 250 7 4.2" "23000 520 2.6 0.8"; do
    set -- $S
    T=$(($1 + $2)); N=$((N + 2))
    THUNDER="$THUNDER anoisesrc=d=0.55:c=pink:a=0.9:r=48000,highpass=f=220,lowpass=f=5200,tremolo=f=38:d=0.75,afade=t=out:st=0.015:d=0.5:curve=exp,apad=pad_dur=2,aecho=0.9:0.85:150|340|640|1100:0.5|0.36|0.24|0.14,volume=$4,adelay=$T,apad=whole_dur=$LENGTH[c$1];"
    THUNDER="$THUNDER anoisesrc=d=5:c=brown:a=0.9:r=48000,highpass=f=45,lowpass=f=700,tremolo=f=5:d=0.55,afade=t=in:d=0.06,afade=t=out:st=0.35:d=4.6,apad=pad_dur=2,aecho=0.8:0.75:900|1900:0.45|0.3,volume=$3,adelay=$T,apad=whole_dur=$LENGTH[r$1];"
    LABELS="$LABELS[c$1][r$1]"
done
RAIN="anoisesrc=d=$LENGTH:c=pink:a=0.5:r=48000,highpass=f=1200,lowpass=f=9000,volume='0.17+0.13*clip((t-18.5)/7\,0\,1)':eval=frame,afade=t=in:d=1.5[rain];"
WIND="anoisesrc=d=$LENGTH:c=brown:a=0.6:r=48000,lowpass=f=420,volume='0.22+0.1*sin(2*PI*t/7.3)':eval=frame[wind];"
SEA="anoisesrc=d=$LENGTH:c=brown:a=0.8:r=48000,lowpass=f=700,volume='0.1+0.18*pow(0.5+0.5*sin(2*PI*t/4.9)\,3)':eval=frame,afade=t=in:d=2[sea];"

"$FFB/ffmpeg" -v error -y -filter_complex \
    "$RAIN$WIND$SEA$THUNDER[rain][wind][sea]${LABELS}amix=inputs=$((N + 3)):normalize=0:duration=first,afade=t=out:st=$((LENGTH - 3)):d=3,alimiter=limit=0.8[a]" \
    -map "[a]" -t $LENGTH -c:a aac -b:a 192k "$OUT/lighthouse-soundtrack.m4a"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/lighthouse-soundtrack.m4a" -map 0:v -map 1:a -c copy -movflags +faststart -shortest "$OUT/lighthouse-master.mp4"
"$FFB/ffmpeg" -v error -y -i "$SILENT" -i "$OUT/lighthouse-soundtrack.m4a" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 \
    -pix_fmt yuv420p -c:a copy -movflags +faststart -shortest "$OUT/lighthouse-share.mp4"
ls -la "$OUT"
