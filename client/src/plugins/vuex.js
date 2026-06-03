import { buildDevice } from '@/util/device';
import { createStore } from 'vuex';


import {
  CAPTURE_SET_ALL_SETTINGS,
  CAPTURE_GET_ALL_SETTINGS,
  CAPTURE_GET_SEQUENCES,
  DEVICE_GET,
  DEVICE_PROPERTY_SET,
  FOCUS_RESET,
  FOCUS_START,
  FOCUS_STOP,
  GET_DEVICES,
  GET_PROFILES,
  GET_STATES,
  GUIDE_CLEAR,
  GUIDE_START,
  GUIDE_STOP,
  IMAGE_DATA,
  LIVESTACK_IMAGE,
  MOUNT_ABORT,
  MOUNT_PARK,
  MOUNT_SET_TRACKING,
  MOUNT_UNPARK,
  NEW_ALIGN_STATE,
  NEW_CAMERA_STATE,
  NEW_CAPTURE_STATE,
  NEW_CONNECTION_STATE,
  NEW_FOCUS_STATE,
  NEW_GPS_STATE,
  NEW_GUIDE_STATE,
  NEW_MOUNT_STATE,
  NEW_NOTIFICATION,
  SET_CLIENT_STATE,
  START_PROFILE,
  DIALOG_GET_INFO,
  CAPTURE_REMOVE_SEQUENCE,
  FM_GET_DATA,
  OPTION_SET,
  ASTRO_GET_NAMES,
  ASTRO_GET_DESIGNATIONS,
  ASTRO_SEARCH_OBJECTS,
  SKYOBJECT_PLANET,
  SKYOBJECT_COMET,
  GET_CONNECTION,
  NEW_POLAR_STATE,
  ALIGN_GET_ALL_SETTINGS,
} from '../util/messageTypes';


const defaultEkosStates = {
  preview: {
    image: null,
  },
  mount: {
    status: "Idle",
    slewRate: null,
    target: null,
    at: null,
    az: null,
    de: null,
    ra: null,
  },
  slewRates: [],
  guide: {
    status: "Idle"
  },
  focus: {
    status: "Idle"
  },
  capture: {
    status: "Idle",
    isoList: null,
    usesGain: false,
    filters: []
  },
  align: {
    status: "Idle"
  },
  polar: {

  },
  notifications: [],
  lastNotification: null,
  devices: {},
  livestack: {
    messages: [],
    image: null,
  },
  profiles: { profiles: [], selectedProfile: "", selectedProfileIndex: -1},
  sequenceQueue: [],
  captureSettings: {},
  alignSettings: {},
  currObjId: 0,
};

const store = createStore({
  state: {
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
    },
    connection: {
      connected: false,
      online: false,
    },
    gps: {
      mode: 0,
      lat: null,
      lon: null,
    },
    gotoObjects: new Map(),
    ...JSON.parse(JSON.stringify(defaultEkosStates)),
  },
  getters: {
    mountPosition: state => {
      if (state.mount.ra === null || state.mount.de === null) return null;
      return [
        parseFloat(state.mount.ra.toFixed(3)),
        parseFloat(state.mount.de.toFixed(3)),
      ];
    },
    gpsLocation: state => {
      if (state.gps.lat === null || state.gps.lon === null) return null;
      return [
        parseFloat(state.gps.lat.toFixed(3)),
        parseFloat(state.gps.lon.toFixed(3)),
      ];
    },
    lastNotificationFormatted: state => {
      if (!state.lastNotification) return null;
      return state.lastNotification.message+" "+state.lastNotification.ts.toLocaleTimeString("en-US");
    }
  },
  mutations: {
    SOCKET_ONOPEN(state, event) {
      state.socket.connection = event.currentTarget;
      state.socket.isConnected = true;
      this.dispatch("sendMsg", [GET_CONNECTION]);
    },
    SOCKET_ONCLOSE(state) {
      state.socket.isConnected = false
    },
    SOCKET_ONERROR(state, event) {
      console.error(state, event)
    },
    // default handler called for all methods
    SOCKET_ONMESSAGE(state, message) {
      // turn this into a dumb object
      message = JSON.parse(JSON.stringify(message));
      state.socket.message = message

      this.commit(message.type, message);
    },
    // mutations for reconnect methods
    SOCKET_RECONNECT(state, count) {
      console.info(state, count)
    },
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true;
    },
    [IMAGE_DATA](state, message) {
      const shape = message.payload.resolution.split('x');

      message.payload.width = parseInt(shape[0]);
      message.payload.height = parseInt(shape[1]);

      switch (message.payload.uuid) {
        case "+G":
          state.guide.image = message.payload;
          break;
        case "+A":
          state.align.image = message.payload;
          break;
        case "+F":
          state.focus.image = message.payload;
          break;
        default:
          state.preview.image = message.payload;
      }
    },
    [NEW_CONNECTION_STATE](state, message) {
      state.connection = {
        ...state.connection,
        ...message.payload,
      };
      if (message.payload.connected) {
        this.dispatch('sendMsg', [GET_PROFILES]);
        if (message.payload.online) {
          this.dispatch("sendMsg", [OPTION_SET, {
            options: [
              { name: "ekosLiveNotifications", value: true },
              { name: "ekosLiveCloud", value: true }
            ]
          }]);
          this.dispatch("sendMsg", [GET_STATES]);
        } else {
          // Still connected to KStars, but Ekos was closed. Reset states to default.
          this.dispatch("reset");
        }
      } else {
        this.dispatch("reset");
      }
    },
    ["ekos_connected"](state, message) {
      this.dispatch("sendMsg", [SET_CLIENT_STATE, { state: true }]);
      this.dispatch("sendMsg", [GET_CONNECTION]);
    },
    [GET_PROFILES](state, message) {
      state.profiles = message.payload;
      this.dispatch("findDeviceDetails");
    },
    [NEW_MOUNT_STATE](state, message) {
      state.mount = {
        ...state.mount,
        ...message.payload,
      };
    },
    [NEW_GUIDE_STATE](state, message) {
      state.guide = {
        ...state.guide,
        ...message.payload,
      };
    },
    [NEW_FOCUS_STATE](state, message) {
      state.focus = {
        ...state.focus,
        ...message.payload,
      };
    },
    [NEW_CAPTURE_STATE](state, message) {
      state.capture = {
        ...state.capture,
        ...message.payload,
      };
    },
    [NEW_ALIGN_STATE](state, message) {
      state.align = {
        ...state.align,
        ...message.payload,
      };
    },
    [NEW_GPS_STATE](state, message) {
      state.gps = {
        ...state.gps,
        ...message.payload,
      };
    },
    [NEW_CAMERA_STATE](state, message) {
      state.camera = {
        ...state.camera,
        ...message.payload,
      };
    },
    [NEW_POLAR_STATE](state, message) {
      state.polar = {
        ...state.polar,
        ...message.payload,
      };
    },
    [NEW_NOTIFICATION](state, message) {
      const msg = { ts: new Date(), ...message.payload }
      state.notifications.push(msg);
      state.lastNotification = msg;
    },
    [FM_GET_DATA](state, message) {
      state.capture.filters = message.payload.filters.map(f => f.label);
    },
    [ALIGN_GET_ALL_SETTINGS](state, message) {
      state.align.settings = message.payload;
    },
    [CAPTURE_GET_ALL_SETTINGS](state, message) {
      state.capture.settings = message.payload;
      if (state.capture.filters.length === 0) {
        this.dispatch("sendMsg", [FM_GET_DATA]);
      }
    },
    [CAPTURE_GET_SEQUENCES](state, message) {
      state.sequenceQueue = message.payload;
    },
    [DIALOG_GET_INFO](state, message) {
      //todo: pop up dialogs
      // console.log(message.payload)
    },
    [GET_DEVICES](state, message) {
      for (const key in message.payload) {
        const item = JSON.parse(JSON.stringify(message.payload[key]));
        this.dispatch("sendMessage", { type: DEVICE_GET, payload: { device: item.name } });
      }
    },
    [DEVICE_GET](state, message) {
      const selectedProfile = state.profiles.profiles[state.profiles.selectedProfileIndex];
      if (message.payload.device === selectedProfile?.ccd) {
        let prop = message.payload.properties.find(p => p.name === "CCD_ISO");
        if (prop !== undefined) {
          state.capture.isoList = prop.switches.map(p => p.label);
          state.capture.usesGain = false;
        } else {
          prop = message.payload.properties.find(p => p.name === "CCD_GAIN");
          state.capture.isoList = null;
          state.capture.usesGain = true;
        }
      } else if (message.payload.device === selectedProfile?.mount) {
        let prop = message.payload.properties.find(p => p.name === "TELESCOPE_SLEW_RATE");
        if (prop !== undefined) {
          prop.switches.forEach((v, i) => {
            state.slewRates[i] = { label: v.label, name: v.name, index: i };
          });
        }
      }
      const device = buildDevice(message.payload);
      state.devices[device.name] = device;
    },
    [ASTRO_GET_NAMES](state, message) {
      state.currObjId = 0;

      const removeSet = new Set();

      for (const raw of message.payload) {
        const base = raw.split(" (")[0];
        removeSet.add(base);
      }

      const map = new Map();

      for (const raw of message.payload) {
        if (removeSet.has(raw)) continue;
        map.set(raw, {
          id: state.currObjId++,
          primary: raw,
          display: raw
        });
      }

      state.gotoObjects = map;
      this.dispatch("sendMsg", [ASTRO_SEARCH_OBJECTS, { type: SKYOBJECT_PLANET, maxMagnitude: 100, minAlt: -180 } ])
      this.dispatch("sendMsg", [ASTRO_SEARCH_OBJECTS, { type: SKYOBJECT_COMET, maxMagnitude: 25, minAlt: 0 } ])
      this.dispatch("sendMsg", [ASTRO_GET_DESIGNATIONS]);
    },
    [ASTRO_GET_DESIGNATIONS](state, message) {
      const map = state.gotoObjects;

      for (const obj of message.payload) {
        const primary = obj.primary;
        const designations = obj.designations.filter(d => d !== primary);
        const display =
          designations.length > 0
            ? `${primary} (${designations.join(", ")})`
            : primary;

        map.set(primary, {
          id: state.currObjId++,
          primary,
          display
        });
      }
    },
    [ASTRO_SEARCH_OBJECTS](state, message) {
      const map = state.gotoObjects;
      for (const o of message.payload) {
        map.set(o, { id: state.currObjId++, primary: o, display: o });
      }
    },
    // [LIVESTACK_LOG](state, message) {
    //   const msg = { ts: new Date(), message: message.payload }
    //   state.livestack.messages.push(msg);
    // },
    [LIVESTACK_IMAGE](state, message) {
      state.livestack.image = message.payload;
    },
  },
  actions: {
    reset: ({ state }) => {
      Object.keys(defaultEkosStates).forEach(k => {
        state[k] = defaultEkosStates[k];
      });
      state.gotoObjects.clear();
    },
    sendMessage: ({ state }, message) => {
      state.socket.connection?.send(JSON.stringify(message));
    },
    mountPark: ({ dispatch }) => { dispatch('sendMessage', { type: MOUNT_PARK }); },
    mountUnpark: ({ dispatch }) => { dispatch('sendMessage', { type: MOUNT_UNPARK }); },
    mountAbort: ({ dispatch }) => { dispatch('sendMsg', [MOUNT_ABORT]); },
    mountSetTracking: ({ dispatch }, enabled) => { dispatch('sendMsg', [MOUNT_SET_TRACKING, { enabled: enabled }]); },

    guideStart: ({ dispatch }) => { dispatch('sendMsg', [GUIDE_START]); },
    guideStop: ({ dispatch }) => { dispatch('sendMsg', [GUIDE_STOP]); },
    guideClear: ({ dispatch }) => { dispatch('sendMsg', [GUIDE_CLEAR]); },

    focusStop: ({ dispatch }) => { dispatch('sendMsg', [FOCUS_STOP]); },
    focusStart: ({ dispatch }) => { dispatch('sendMsg', [FOCUS_START]); },
    focusReset: ({ dispatch }) => { dispatch('sendMsg', [FOCUS_RESET]); },

    captureSetAllSettings: ({ dispatch }, settings) => { dispatch('sendMsg', [CAPTURE_SET_ALL_SETTINGS, settings]); },
    captureRemoveSequence: ({ dispatch }, seqIndex) => { dispatch('sendMsg', [CAPTURE_REMOVE_SEQUENCE, { index: seqIndex }]); },
    captureUpdateSettings: ({ dispatch }) => {
      dispatch('captureSetAllSettings', {
        ...store.state.capture.settings,
        ...store.state.captureSettings,
      });
    },
    devicePropertySet: ({ dispatch }, data) => {
      dispatch('sendMsg', [DEVICE_PROPERTY_SET, data]);
    },
    startProfile: ({ dispatch }, profile) => {
      dispatch('sendMsg', [START_PROFILE, { name: profile }]);
      dispatch("findDeviceDetails");
    },
    findDeviceDetails: ({ dispatch, state }) => {
      const profiles = state.profiles;
      if (profiles.selectedProfileIndex === -1 || profiles.profiles[profiles.selectedProfileIndex]?.name !== profiles.selectedProfile) {
        state.profiles.selectedProfileIndex = profiles.profiles.findIndex(p => p.name === profiles.selectedProfile);
      }
      //ISO or gain
      dispatch("sendMsg", [DEVICE_GET, { device: state.profiles.profiles[state.profiles.selectedProfileIndex].ccd }]);

      dispatch("sendMsg", [DEVICE_GET, { device: state.profiles.profiles[state.profiles.selectedProfileIndex].mount }]);
    },

    sendMsg: ({ dispatch }, args) => {
      if (typeof args === 'string') {
        throw new Error("typeof args must not be 'string'");
      }
      const [type, payload = {}] = args;
      dispatch('sendMessage', { type: type, payload: payload });
    },
  }
});

export default store;