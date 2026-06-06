const PERM = {
  IP_RO: 0,
  IP_WO: 1,
  IP_RW: 2,
};

const PROP_STATE = {
  IPS_IDLE: 0,
  IPS_OK: 1,
  IPS_BUSY: 2,
  IPS_ALERT: 3,
};

const RULE = {
  ISR_1OFMANY: 0,
  ISR_ATMOST1: 1,
  ISR_NOFMANY: 2,
};

const SWITCH_STATE = {
  ISS_OFF: 0,
  ISS_ON: 1,
};

const processDeviceProperty = (state, prop) => {
  if (!prop) return;
  const selectedProfile = state.profiles.profiles[state.profiles.selectedProfileIndex];
  if (!selectedProfile) return;
  switch (prop.device) {
    case selectedProfile.ccd: {
      switch (prop.name) {
        case "CCD_ISO": {
          console.log("iso")
          state.deviceInfo.ccd.isoList = prop.switches.map(p => p.label);
          state.deviceInfo.ccd.usesGain = false;
          break;
        }
        //TODO: smth w/ device prop subscribe
        case "CCD_TRANSFER_FORMAT": {
          console.log("format")
          console.log(state.deviceInfo.ccd.transferFormats, prop);
          state.deviceInfo.ccd.transferFormats = prop.switches.map(p => p.label);
          break;
        }
      }
      break;
    }
    case selectedProfile.mount: {
      switch (prop.name) {
        case "TELESCOPE_SLEW_RATE": {
          console.log("slew")
          prop.switches.forEach((v, i) => {
            state.deviceInfo.mount.slewRates[i] = { label: v.label, name: v.name, index: i };
          });
          break;
        }
      }
      break;
    }
  }
};

const buildDevice = (payload) => {
  if (!payload) {
    return null;
  }

  let properties = payload.properties;

  let device = {
    name: payload.device,
    groups: {},
  };

  properties.forEach(p => {
    if (!device.groups[p.group]) {
      device.groups[p.group] = { name: p.group, properties: [] };
    }

    device.groups[p.group].properties.push(p);

  });

  return device;
};

export {
  PERM,
  PROP_STATE,
  RULE,
  SWITCH_STATE,
  buildDevice,
  processDeviceProperty,
};
