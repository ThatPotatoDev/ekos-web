import { exec } from "child_process";

export const handleDaemonMsg = msg => {
  console.log(msg);
  switch (msg.type) {
    case "power": {
      // systemctl should wait for service to stop so no need to deal w/ clean shutdown here 
      if (msg.action == "reboot" || msg.action == "shutdown") {
        exec(`sudo ${msg.action} now`);
      }
      break;
    }
  }
};
