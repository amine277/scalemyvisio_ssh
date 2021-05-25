#!/bin/sh

cd recording

ffmpeg -flags low_delay -fflags +igndts -y -probesize 32 -analyzeduration 0 -protocol_whitelist crypto,file,udp,rtp,rtmp -thread_queue_size 9999  -f sdp -i input-h264.sdp -map 0:v -c:v libx264  -preset veryfast -r 30 -strict experimental -force_key_frames 'expr:gte(t,n_forced*1)' -fflags nobuffer -f flv rtmp://127.0.0.1:1935/live/test