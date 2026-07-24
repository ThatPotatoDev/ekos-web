import { DEVICE_PROPERTY_GET } from "./messageTypes";

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



const processDeviceProperty = (dispatch, state, prop) => {
  if (!prop) return;
  const selectedProfile = state.profiles.profiles[state.profiles.selectedProfileIndex];
  if (!selectedProfile) return;

  if (!state.deviceTypeMap.has(prop.device)) {
    let deviceType = "";
    switch (prop.device) {
      case selectedProfile.ccd: {
        deviceType = "ccd"; break;
      } case selectedProfile.mount: {
        deviceType = "mount"; break;
      } default: {
        return;
      }
    }
    state.deviceTypeMap.set(prop.device, deviceType);
  };
  // console.log(prop.device)
  const deviceType = state.deviceTypeMap.get(prop.device);

  const labels = state.propLabelsMap.get(deviceType);
  if (labels?.[prop.name] === undefined) return;
  if (prop.switches?.map(p => p.label)?.includes(undefined)) {
    dispatch('sendMsg', [DEVICE_PROPERTY_GET, { device: prop.device, property: prop.name, compact: false }]);
    return;
  } else if (prop.switches) {
    labels[prop.name] = prop.switches.map(p => p.label);
  }

  switch (prop.device) {
    case selectedProfile.ccd: {
      switch (prop.name) {
        case "CCD_INFO": {
          state.deviceInfo.ccd.pixelSize = parseFloat(prop.numbers.find(n => n.name === "CCD_PIXEL_SIZE").value.toFixed(3));
          break;
        }
      }
      break;
    }
    case selectedProfile.mount: {
      switch (prop.name) {
        case "TELESCOPE_SLEW_RATE": {
          prop.switches.forEach((v, i) => {
            state.deviceInfo.mount.slewRates[i] = { label: v.label ?? labels[prop.name][i], name: v.name, index: i };
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
