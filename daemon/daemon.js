const { exec } = require('child_process');
const WebSocket = require('ws');

const addr = "localhost:3000"; //hmmm....
const ws = new WebSocket(`ws://${addr}/daemon`);

ws.on("error", console.error);
ws.on("message", msg => {
  const data = JSON.parse(msg);
  console.log(data);
  switch (data.type) {
    case "power": {
      if (data.action == "reboot" || data.action == "shutdown") {
        exec(`sudo ${data.action} now`);
      }
      break;
    }
  }
});