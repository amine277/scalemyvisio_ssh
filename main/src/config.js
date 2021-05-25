const os = require('os')

module.exports = {
    listenIp: '0.0.0.0',
    listenPort: process.env.PORT || 3016,
    sslCrt: '../ssl/cert.pem',
    sslKey: '../ssl/key.pem',
    
    mediasoup: {
      // Worker settings
      numWorkers : Object.keys(os.cpus()).length,
      worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: 'warn',
        logTags: [
          'info',
          'ice',
          'dtls',
          'rtp',
          'srtp',
          'rtcp',
          // 'rtx',
          // 'bwe',
          // 'score',
          // 'simulcast',
          // 'svc'
        ],
      },
      // Router settings
      router: {
        // RtpCodecCapability[]
        mediaCodecs: [
          {
            kind: "audio",
            mimeType: "audio/opus",
            preferredPayloadType: 111,
            clockRate: 48000,
            channels: 2,
            parameters: {
              minptime: 10,
              useinbandfec: 1,
            },
          },
          /*{
            kind: "video",
            mimeType: "video/VP8",
            preferredPayloadType: 96,
            clockRate: 90000,
          },*/
          {
            kind: "video",
            mimeType: "video/H264",
            preferredPayloadType: 125,
            clockRate: 90000,
            parameters: {
              "level-asymmetry-allowed": 1,
              "packetization-mode": 1,
              "profile-level-id": "42e01f",
            },
          },
        ],
      },
    // WebRtcTransport settings
    webRtcTransport: {
      listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 300000,
    },
    // PlainTransportOptions
    plainTransport: {
      listenIp: { ip: "127.0.0.1", announcedIp: null },
    },

     // Target IP and port for RTP recording
     recording: {
      ip: "127.0.0.1",

      // GStreamer's sdpdemux only supports RTCP = RTP + 1
      audioPort: 5004,
      audioPortRtcp: 5005,
      videoPort: 5006,
      videoPortRtcp: 5007,
    },

    
    }
  };
  
