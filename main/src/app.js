const express = require("express");

const app = express();
const https = require("httpolyglot");
const fs = require("fs");
const mediasoup = require("mediasoup");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { socket_disconnect } = require("../routes/BackEndScripts");
const { exec } = require("child_process");

//Import Routes

const config = require("./config");
const path = require("path");
const { routers } = require("./router");
const Room = require("./Room");
const Peer = require("./Peer");

const authRoute = require("../routes/auth");
const Page_Request = require("../routes/Page_Request");

const _ = require("lodash");
const cors = require("cors");

const shell = require("shelljs");

dotenv.config();

//ssl
const options = {
  key: fs.readFileSync(path.join(__dirname, config.sslKey), "utf-8"),
  cert: fs.readFileSync(path.join(__dirname, config.sslCrt), "utf-8"),
};

const httpsServer = https.createServer(options, app);
const io = require("socket.io")(httpsServer);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));
app.use(express.static("public"));
app.use(express.static(__dirname + "/css"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({ exposedHeaders: "*" }));

app.routers = routers(app);

httpsServer.listen(config.listenPort, () => {
  console.log("listening https " + config.listenPort);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Connnection to Database
mongoose.connect(process.env.DB_URL, { useUnifiedTopology: true }, () =>
  console.log("Connected to DB!")
);

/*app.get('/test', function(req, res) {
    res.sendFile('Register.html', {root: __dirname })
});*/

//Middleware
app.use("/", authRoute);
app.use("/", Page_Request);
app.use(express.json());

// all mediasoup workers
let workers = [];
let nextMediasoupWorkerIdx = 0;

/**
 * roomList
 * {
 *  room_id: Room {
 *      id:
 *      router:
 *      peers: {
 *          id:,
 *          name:,
 *          master: [boolean],
 *          transports: [Map],
 *          producers: [Map],
 *          consumers: [Map],
 *          rtpCapabilities:
 *      }
 *  }
 * }
 */
let roomList = new Map();

function findClientsSocket(roomId, namespace) {
  var res = [],
    // the default namespace is "/"
    ns = io.of(namespace || "/");

  if (ns) {
    for (var id in ns.connected) {
      if (roomId) {
        var index = ns.connected[id].rooms.indexOf(roomId);
        if (index !== -1) {
          res.push(ns.connected[id]);
        }
      } else {
        res.push(ns.connected[id]);
      }
    }
  }
  return res;
}

(async () => {
  await createWorkers();
})();

async function createWorkers() {
  let { numWorkers } = config.mediasoup;

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on("died", () => {
      console.error(
        "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
        worker.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });
    workers.push(worker);

    // log worker resource usage
    /*setInterval(async () => {
            const usage = await worker.getResourceUsage();

            console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);*/
  }
}

io.on("connection", (socket) => {
  socket.on("createRoom", async ({ room_id, adminId }, callback) => {
    if (roomList.has(room_id)) {
      callback("already exists");
    } else {
      console.log("---created room--- ", room_id);
      console.log("---admin is ----", adminId);
      let worker = await getMediasoupWorker();
      roomList.set(room_id, new Room(room_id, worker, io, socket.id));
      callback(room_id);
    }
  });

  socket.on("addViewer", ({ viewerId, roomId }) => {
    console.log("---Joining Room as Viewer: ", viewerId);
    socket.userId = viewerId;
  });

  socket.on("SendInvit", ({ viewerId, roomToJoin }) => {
    console.log("---Inviting  Viewer:----", viewerId);
    const socketAdmin = roomList.get(roomToJoin).getAdmin();
    findClientsSocket().forEach((user) => {
      if (user.userId == viewerId) {
        console.log("dkheeel");
        io.to(user.id).emit("adminInviteYou", {
          socketAdmin: socketAdmin,
        });
      }
    });

    /* */
  });

  socket.on("SendInvitToViewer", ({ viewerId, roomToJoin }) => {
    console.log("---Inviting  Viewer: ", viewerId);
  });

  socket.on("letmein", ({ viewerId, viewerName, roomToJoin }) => {
    console.log("---viewer want to get in ", viewerId);

    const socketAdmin = roomList.get(roomToJoin).getAdmin();

    io.to(socketAdmin).emit("lethimin", {
      viewerId: viewerId,
      viewerSocket: socket.id,
      viewerName: viewerName,
    });
  });

  socket.on("okay", ({ viewerId, viewerSocket }) => {
    io.to(viewerSocket).emit("hereyougo");
  });

  socket.on("mabghitch", ({ viewerId, viewerSocket }) => {
    io.to(viewerSocket).emit("sorry");
  });

  socket.on("userId", (Id) => {
    socket.Id = Id;
  });

  socket.on("join", ({ room_id, Id, name }, cb) => {
    console.log('---user joined--- "' + room_id + '": ' + name);
    if (!roomList.has(room_id)) {
      return cb({
        error: "room does not exist",
      });
    }
    roomList.get(room_id).addPeer(new Peer(socket.id, name, Id));
    socket.room_id = room_id;
    socket.name = name;
    cb(roomList.get(room_id).toJson());
  });

  socket.on("getProducers", () => {
    console.log(
      `---get producers--- name:${
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`
    );
    // send all the current producer to newly joined member
    if (!roomList.has(socket.room_id)) return;
    let producerList = roomList
      .get(socket.room_id)
      .getProducerListForPeer(socket.id);

    socket.emit("newProducers", producerList);
  });

  socket.on("getRouterRtpCapabilities", (_, callback) => {
    console.log(
      `---get RouterRtpCapabilities--- name: ${
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`
    );
    try {
      callback(roomList.get(socket.room_id).getRtpCapabilities());
    } catch (e) {
      callback({
        error: e.message,
      });
    }
  });

  socket.on("createWebRtcTransport", async (_, callback) => {
    console.log(
      `---create webrtc transport--- name: ${
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`
    );
    try {
      const { params } = await roomList
        .get(socket.room_id)
        .createWebRtcTransport(socket.id);

      callback(params);
    } catch (err) {
      console.error(err);
      callback({
        error: err.message,
      });
    }
  });

  socket.on(
    "connectTransport",
    async ({ transport_id, dtlsParameters }, callback) => {
      console.log(
        `---connect transport--- name: ${
          roomList.get(socket.room_id).getPeers().get(socket.id).name
        }`
      );
      if (!roomList.has(socket.room_id)) return;
      await roomList
        .get(socket.room_id)
        .connectPeerTransport(socket.id, transport_id, dtlsParameters);

      callback("success");
    }
  );

  socket.on(
    "produce",
    async ({ kind, rtpParameters, producerTransportId }, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: "not is a room" });
      }

      //  console.log(`rtpppp : ${rtpParameters}`)

      let producer_id = await roomList
        .get(socket.room_id)
        .produce(socket.id, producerTransportId, rtpParameters, kind);

      //let router = await roomList.get(socket.room_id).getRouter();
      // console.log(router);
      //handleStartRecording(router,producer_id);

      console.log(
        `---produce--- type: ${kind} name: ${
          roomList.get(socket.room_id).getPeers().get(socket.id).name
        } id: ${producer_id}`
      );
      callback({
        producer_id,
      });
    }
  );

  socket.on("startStream", async ({ kind, rtpParameters, id }) => {
    /*if(!roomList.has(socket.room_id)) {
          return callback({error: 'not is a room'})
      }*/

    console.log("sockeeeeet", socket.room_id);

    let producer_id = id;

    // let producer_id = await roomList.get(socket.room_id).produce(socket.id, id , rtpParameters, kind)

    let router = await roomList.get(socket.room_id).getRouter();
    // console.log(router);
    handleStartRecording(router, producer_id);
    console.log("Staaart Streaaaam");

    console.log(
      `---produce--- type: ${kind} name: ${
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      } id: ${producer_id}`
    );
  });

  socket.on(
    "consume",
    async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
      //TODO null handling
      let params = await roomList
        .get(socket.room_id)
        .consume(socket.id, consumerTransportId, producerId, rtpCapabilities);

      console.log(
        `---consuming--- name: ${
          roomList.get(socket.room_id) &&
          roomList.get(socket.room_id).getPeers().get(socket.id).name
        } prod_id:${producerId} consumer_id:${params.id}`
      );
      callback(params);
    }
  );

  socket.on("resume", async (data, callback) => {
    await consumer.resume();
    callback();
  });

  socket.on("getMyRoomInfo", (_, cb) => {
    cb(roomList.get(socket.room_id).toJson());
  });

  socket.on("disconnect", () => {
    if (roomList.get(socket.room_id)) {
      usr1 = roomList.get(socket.room_id).getPeers().get(socket.id);

      if (usr1) {
        const Id = usr1.Id;
        socket_disconnect(Id);
      }
    }

    if (!socket.room_id) return;
    roomList.get(socket.room_id).removePeer(socket.id);
  });

  socket.on("producerClosed", ({ producer_id }) => {
    console.log(
      `---producer close--- name: ${
        roomList.get(socket.room_id) &&
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`
    );
    roomList.get(socket.room_id).closeProducer(socket.id, producer_id);
  });

  socket.on("message", (msg) => {
    io.emit("serverMessage", /*{msg : msg, nick: socket.name}*/ msg);
  });

  socket.on("exitRoom", async (_, callback) => {
    console.log(
      `---exit room--- name: ${
        roomList.get(socket.room_id) &&
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`
    );
    if (!roomList.has(socket.room_id)) {
      callback({
        error: "not currently in a room",
      });
      return;
    }
    // close transports
    await roomList.get(socket.room_id).removePeer(socket.id);
    if (roomList.get(socket.room_id).getPeers().size === 0) {
      roomList.delete(socket.room_id);
    }

    socket.room_id = null;

    callback("successfully exited room");
  });
});

function room() {
  return Object.values(roomList).map((r) => {
    return {
      router: r.router.id,
      peers: Object.values(r.peers).map((p) => {
        return {
          name: p.name,
        };
      }),
      id: r.id,
    };
  });
}

/**
 * Get next mediasoup Worker.
 */
function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];

  if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0;

  return worker;
}

async function handleStartRecording(router, producer_id) {
  const rtpTransport = await router.createPlainTransport({
    // No RTP will be received from the remote side
    comedia: false,

    // FFmpeg and GStreamer don't support RTP/RTCP multiplexing ("a=rtcp-mux" in SDP)
    rtcpMux: false,

    listenIp: "127.0.0.1",
  });
  // config.mediasoup.rtp.videoTransport = rtpTransport;

  await rtpTransport.connect({
    ip: config.mediasoup.recording.ip,
    port: config.mediasoup.recording.videoPort,
    rtcpPort: config.mediasoup.recording.videoPortRtcp,
  });

  console.log("prooducer  id  : %s", producer_id);

  console.log(
    "mediasoup VIDEO RTP SEND transport connected: %s:%d <--> %s:%d (%s)",
    rtpTransport.tuple.localIp,
    rtpTransport.tuple.localPort,
    rtpTransport.tuple.remoteIp,
    rtpTransport.tuple.remotePort,
    rtpTransport.tuple.protocol
  );

  const rtpConsumer = await rtpTransport.consume({
    producerId: producer_id,
    rtpCapabilities: router.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
    //paused: true,
  });
  // config.mediasoup.rtp.videoConsumer = rtpConsumer;
  const consumer = rtpConsumer;

  //await startRecordingFfmpeg(consumer,rtpTransport);

  consumer.resume();

  /*  console.log(
        "Resume mediasoup RTP consumer, kind: %s, type: %s",
        consumer.kind,
        consumer.type
      );
      consumer.resume();*/
  // }
}

function startRecordingFfmpeg(consumer, rtpTransport) {
  // Return a Promise that can be awaited
  let recResolve;
  const promise = new Promise((res, _rej) => {
    recResolve = res;
  });

  const useAudio = false; //audioEnabled();
  const useVideo = true; //videoEnabled();
  const useH264 = true; //h264Enabled();

  // const cmdProgram = "ffmpeg"; // Found through $PATH
  const cmdProgram = FFmpegStatic; // From package "ffmpeg-static"

  let cmdInputPath = `${__dirname}/recording/input-vp8.sdp`;
  let cmdOutputPath = `${__dirname}/recording/output-ffmpeg-vp8.webm`;
  let cmdCodec = "";
  let cmdFormat = "-f webm -flags +global_header";

  // Ensure correct FFmpeg version is installed
  const ffmpegOut = Process.execSync(cmdProgram + " -version", {
    encoding: "utf8",
  });
  const ffmpegVerMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/.exec(ffmpegOut);
  let ffmpegOk = false;
  if (ffmpegOut.startsWith("ffmpeg version git")) {
    // Accept any Git build (it's up to the developer to ensure that a recent
    // enough version of the FFmpeg source code has been built)
    ffmpegOk = true;
  } else if (ffmpegVerMatch) {
    const ffmpegVerMajor = parseInt(ffmpegVerMatch[1], 10);
    if (ffmpegVerMajor >= 4) {
      ffmpegOk = true;
    }
  }

  if (!ffmpegOk) {
    console.error("FFmpeg >= 4.0.0 not found in $PATH; please install it");
    process.exit(1);
  }

  if (useAudio) {
    cmdCodec += " -map 0:a:0 -c:a copy";
  }
  if (useVideo) {
    cmdCodec += " -map 0:v:0 -c:v copy";

    if (useH264) {
      cmdInputPath = `${__dirname}/recording/input-h264.sdp`;
      cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.ts`;

      // "-strict experimental" is required to allow storing
      // OPUS audio into MP4 container
      cmdFormat = "-f mp4 -strict experimental";
    }
  }

  // Run process
  const cmdArgStr = [
    "-nostdin",
    "-protocol_whitelist file,rtp,udp",
    // "-loglevel debug",
    // "-analyzeduration 5M",
    // "-probesize 5M",
    "-fflags +genpts",
    `-i ${cmdInputPath}`,
    cmdCodec,
    cmdFormat,
    `-y ${cmdOutputPath}`,
  ]
    .join(" ")
    .trim();

  console.log(`Run command: ${cmdProgram} ${cmdArgStr}`);

  let recProcess = Process.spawn(cmdProgram, cmdArgStr.split(/\s+/));
  global.recProcess = recProcess;

  recProcess.on("error", (err) => {
    console.error("Recording process error:", err);
  });

  recProcess.on("exit", (code, signal) => {
    console.log("Recording process exit, code: %d, signal: %s", code, signal);

    global.recProcess = null;
    stopMediasoupRtp(consumer, rtpTransport);

    if (!signal || signal === "SIGINT") {
      console.log("Recording stopped");
    } else {
      console.warn(
        "Recording process didn't exit cleanly, output file might be corrupt"
      );
    }
  });

  // FFmpeg writes its logs to stderr
  recProcess.stderr.on("data", (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/g)
      .filter(Boolean) // Filter out empty strings
      .forEach((line) => {
        console.log(line);
        if (line.startsWith("ffmpeg version")) {
          setTimeout(() => {
            recResolve();
          }, 1000);
        }
      });
  });

  return promise;
}

// ----------------------------------------------------------------------------

async function handleStopRecording(consumer, rtpTransport) {
  if (global.recProcess) {
    global.recProcess.kill("SIGINT");
  } else {
    stopMediasoupRtp(consumer, rtpTransport);
  }
}

// ----

function stopMediasoupRtp(consumer, transport) {
  console.log("Stop mediasoup RTP transport and consumer");

  consumer.close();
  transport.close();
  //}
}
