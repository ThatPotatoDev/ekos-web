import http from 'http';
import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import url from 'url';
import nodeGpsd from 'node-gpsd';
import nodeStatic from 'node-static';
import enableGracefulShutdown from 'server-graceful-shutdown';
import { handleDaemonMsg } from './daemon.js';

const debug = process.env.EKOS_WEB_DEBUG === "1";

const server = http.createServer();

// These three listen for messages from Ekos.
const messageEkos = new WebSocket.Server({ noServer: true });
const mediaServer = new WebSocket.Server({ noServer: true });
const cloudServer = new WebSocket.Server({ noServer: true });
// This one listens for messages from the web client.
const messageUser = new WebSocket.Server({ noServer: true });

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};

// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  console.log("shutdown!");

  messageEkos.close();
  mediaServer.close();
  cloudServer.close();
  messageUser.close();

  server.shutdown(() => {
    console.log(`server stopped by ${signal} with value ${value}`);
    process.exit(128 + value);
  });
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});

const gpsdListener = new nodeGpsd.Listener({
  hostname: process.env.GPSD_HOST || "127.0.0.1",
  parse: true,
  logger: {
    info: () => { },
    warn: () => { },
    error: () => { },
  }
});

// Keep track of the last messages of each type (merging them together) so we can
// send new web clients our current status immediately.
const lastMessages = new Map();
const saveToLastMessages = (msg) => {
  if (typeof msg.payload.type == "string" && msg.payload.type.startsWith("astro_") && msg.payload.type != "astro_get_names") {
    
  } else if (Array.isArray(msg.payload)) {
    lastMessages.set(msg.type, msg.payload);
  } else if (typeof msg.payload === "object") {
    lastMessages.set(msg.type, {
      ...lastMessages.get(msg.type),
      ...msg.payload,
    });
  } else {
    lastMessages.set(msg.type, msg.payload);
  }
};

const sendJSON = (ws, msg) => {
  if (debug) {
    console.log('sending message', msg);
  }
  ws.send(JSON.stringify(msg));
};

const setupMediaServerOptions = (ws) => {
  sendJSON(ws, { type: "set_blobs", payload: true });
}

gpsdListener.on('TPV', (loc) => {
  const msg = {
    type: "new_gps_state",
    payload: {
      lat: loc.lat,
      lon: loc.lon,
      alt: loc.alt,
      mode: loc.mode,
    },
  };

  saveToLastMessages(msg);

  messageUser.clients.forEach(c => {
    sendJSON(c, msg);
  });
});

gpsdListener.on("error", () => { });
gpsdListener.connect(() => {
  gpsdListener.watch();
});

messageUser.on("connection", (userWs) => {
  userWs.on("message", (msg) => {
    const msgObj = JSON.parse(msg)

    if (msgObj.type === "daemon") {
      handleDaemonMsg(msgObj.payload);
      return;
    }

    // Every message we get from the client should be forwarded to Ekos.
    messageEkos.clients.forEach(c => {
      sendJSON(c, msgObj);
    });
  });

  // Update the web client with our current state.
  lastMessages.forEach((val, key) => {
    sendJSON(userWs, { type: key, payload: val });
  });
  lastMessages.delete("ekos_connected");

  // Tell Ekos to send us images.
  mediaServer.clients.forEach(c => {
    setupMediaServerOptions(c);
  });
});

messageEkos.on("connection", (ekosWs, req) => {
  const connectedMsgObj = { type: "ekos_connected", payload: {} };
  messageUser.clients.forEach(c => {
    sendJSON(c, connectedMsgObj);
  });
  if (messageUser.clients.length === 0) {
    saveToLastMessages(connectedMsgObj);
  }
  ekosWs.on("message", (msg) => {
    // Forward all messages to the web client, remembering the last one of
    // each type for future connections.
    const msgObj = JSON.parse(msg);
    saveToLastMessages(msgObj);

    messageUser.clients.forEach(c => {
      sendJSON(c, msgObj);
    });

    if (msgObj.type === "new_connection_state") {
      if (msgObj.payload.online) {
        // Tell Ekos to send us images.
        mediaServer.clients.forEach(c => {
          setupMediaServerOptions(c);
        });
      } else {
        const hasConnectedMsg = lastMessages.has("ekos_connected");
        console.log("clearing messages")
        lastMessages.clear();
        if (hasConnectedMsg) lastMessages.set("ekos_connected", {});
      }
    }
  });

  ekosWs.on("error", console.error);
  ekosWs.on("close", () => {
    messageUser.clients.forEach(c => {
      sendJSON(c, { type: "new_connection_state", payload: { connected: false, online: false } });
    });
    console.log("clearing messages")
    lastMessages.clear();
  });
});

mediaServer.on("connection", (ws) => {
  ws.on("message", (msg) => {
    // The media connection either sends a JSON string or a binary blob.
    // The JSON string is image metadata, the blob is the jpeg image itself.
    // Let's turn those into well formed packets that match our other packet's
    // structure.

    const metaEnd = msg.indexOf('}');
    let data = { type: "image_data", payload: JSON.parse(Buffer.from(msg.subarray(0, metaEnd + 1))) };
    let imgStart = msg.indexOf(0xff, metaEnd + 1);
    const raw = Buffer.from(msg.subarray(imgStart));
    const encoded = raw.toString('base64');
    data.payload['image'] = "data:image/jpeg;base64," + encoded;

    messageUser.clients.forEach(c => {
      sendJSON(c, data);
    });

    saveToLastMessages(data);
  });
  setupMediaServerOptions(ws);
});

cloudServer.on("connection", (ws) => {
  // In offline mode, Ekos won't send any data here, but will still try to
  // connect to the web socket.
  // In online mode, it will send the full compressed FITS files.
  ws.on("message", (msg) => {
    const metaEnd = msg.indexOf('}');
    console.log('received cloud message', JSON.parse(Buffer.from(msg.subarray(0, metaEnd + 1))));
  });
});

var file = new nodeStatic.Server("./static");

server.addListener("request", (req, res) => {
  console.log('request started', req.url);

  switch (req.url) {
    // Ekos will send a call to this route on initial connection. It must
    // return a 200 response with a token and success == true for Ekos to
    // set up the web socket connections.
    case "/api/authenticate": {
      res.writeHead(200);
      res.end(JSON.stringify({
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmRzd2FydHoxMUBnbWFpbC5jb20iLCJpYXQiOjE3NzkzMDc4MjcsImV4cCI6MTc3OTU2NzAyN30.y-QaJH9CzDw0UoUhbI6aWElrC6mwwIG_iHtG7W4HxzM",
        "success": true,
      }));
      break;
    }
    default:
      file.serve(req, res);
  }
})

server.on("upgrade", (req, socket, head) => {
  console.log('upgrade started', req.url.split("?")[0]);

  const pathname = url.parse(req.url).pathname;

  switch (pathname) {
    case "/message/ekos": {
      messageEkos.handleUpgrade(req, socket, head, (ws) => {
        messageEkos.emit("connection", ws, req);
      });
      break;
    }
    case "/message/user": {
      messageUser.handleUpgrade(req, socket, head, (ws) => {
        messageUser.emit("connection", ws, req);
      });
      break;
    }
    case "/cloud/ekos": {
      cloudServer.handleUpgrade(req, socket, head, (ws) => {
        cloudServer.emit("connection", ws, req);
      });
      break;
    }
    case "/media/ekos": {
      mediaServer.handleUpgrade(req, socket, head, (ws) => {
        mediaServer.emit("connection", ws, req);
      });
      break;
    }
    default:
      socket.destroy();
  }
});

enableGracefulShutdown(server, 1000);

// Ekos in offline mode will try to connect to localhost:3000.
server.listen(3000);
