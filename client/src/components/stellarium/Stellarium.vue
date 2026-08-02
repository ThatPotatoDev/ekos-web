<template>
<div>
  <div class="stellarium-container"
    :style="{
      height: `calc(100dvh - var(--v-layout-top))`
    }"
  >
    <div id="nightmode" :style="{opacity: `${stelStore.settings.nightMode ? stelStore.settings.nightModeIntensity : 0}%`}"></div>
    <canvas ref="stelCanvas" class="stellarium-canvas" :style="{
      transform: `translateY(-${lowerComponentHeight / 2}px)`
    }"></canvas>

    <div
      v-if="!stelStore.isStellariumReady"
      class="position-absolute top-0 left-0 w-100 h-100 d-flex flex-column align-center justify-center ga-4"
      style="z-index: 999; background: rgb(var(--v-theme-background), 255);"
    >
      <v-progress-circular
        indeterminate
        :size="48"
        color="cyan"
      />
      <span class="text-white text-body-2">
        {{ $t('common.loading') }}
      </span>
    </div>

    <div style="position:fixed; top: calc(var(--v-layout-top) + 2px); right: 2px;">
      <v-fab v-if="stelStore.currentOverlay === null" @click="stelStore.currentOverlay = 'search'" 
        icon size="small" color="transparent" variant="text"
      >
        <v-icon icon="mdi-magnify" style="font-size: 30px; width: 30px; height: 30px;" color="rgba(255,255,255,0.8)" /> 
      </v-fab>
    </div>

    <stelMount v-if="stelStore.stel" />

    <stelFraming v-if="stelStore.stel" />

    <stelSearch v-if="stelStore.stel" />

    <!-- Overlay für das ausgewählte Objekt -->

    <stellariumSettings v-if="stelStore.stel" />

    <!-- <stellariumCredits /> -->
    <!-- Clock -->
    <!-- <stellariumClock v-if="this.stelStore.stel" /> -->

    <!-- Horizon overlay (renders into SWE GeoJSON layer, no visible DOM element) -->
    <!-- <StellariumHorizonOverlay v-if="this.stelStore.stel" /> -->

    <!-- View Direction Display (hidden when camera FOV frame is rendered) -->
    <!-- <StellariumViewDirection v-if="this.stelStore.stel && !showFovFrame" /> -->
  </div>
  <selectedObject
    v-if="stelStore.stel"
    class="get-click"
    style="bottom: 0; width: 100vw; max-width: 100vw; background: rgba(0,0,0,0)"
  />
</div>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import stellariumSettings from "./settings/stellariumSettings.vue"
import selectedObject from "./selectedObject.vue"
import stelMount from './stelMount.vue';
import stelFraming from './stelFraming.vue';
import stelSearch from './stelSearch.vue';
import { degreesToDMS, degreesToHMS, rad2deg } from './stelUtil';
import _ from "lodash";

const wasmPath = '/stellarium-js/stellarium-web-engine.wasm';
const HIDDEN_UPDATE_INTERVAL_MS = 1000;

let lastHiddenUpdateTs = 0;
let renderActive = true;

let renderWaitHandle = null;
export default {
  components: {
    stellariumSettings,
    selectedObject,
    stelSearch,
    stelMount,
    stelFraming
  },
  data: () => ({
    isLandscape: false,
    lastHiddenUpdateTs: null,
  }),
  computed: {
    ...mapState([
      "stelStore"
    ]),
    ...mapState({
      loc: s => s.stelStore.loc,
      lowerComponentHeight: s => s.stelStore.lowerComponentHeight
    }),
    showFovFrame() {
      return !!this.stelStore.stel
        // && !!store.cameraInfo.Connected
        // && !!store.profileInfo?.TelescopeSettings?.FocalLength
    },
  },
  methods: {
    ...mapActions(["updateStellariumCore"]),
    waitForStellariumRender() {
      renderWaitHandle = setTimeout(() => {
        if (!this.stelStore.stel) return; // engine is gone in the meantime
        // Wait two more frames so the first rendered sky is visible.
        requestAnimationFrame(() => requestAnimationFrame(() => (this.stelStore.isStellariumReady = true)));
      }, 1500);
    },
    async initStellarium() {
      const stelStore = this.stelStore;
      const settings = stelStore.settings;
      if (!window.StelWebEngine) {
        console.error('StelWebEngine global object not found!');
        return;
      }
      try {
        const response = await fetch(wasmPath);
        if (!response.ok) {
          throw new Error(`Error loading WASM file: ${response.statusText}`);
        }
        const wasmArrayBuffer = await response.arrayBuffer();
        console.log('WASM file loaded successfully. Size (bytes):', wasmArrayBuffer.byteLength);

        window.StelWebEngine({
          wasmFile: wasmPath,
          canvas: this.$refs.stelCanvas,
          onReady: async (stel) => {
            console.log('Stellarium is ready!');

            const utcToMJD = utcDate => {
              return utcDate.getTime() / 86400000 + 40587;
            }
            stelStore.stel = stel;
            stelStore.stelT = stel.getTree();

            stel.onValueChanged((path, val) => {
              const tree = stelStore.stelT;
              _.set(tree, path, val);
              stelStore.stelT = tree;
            });
            stelStore.selectionLayer = stel.createLayer({ id: 'slayer', z: 50, visible: true });

            stel.core.observer.latitude = this.loc.latitude * stel.D2R;
            stel.core.observer.longitude = this.loc.longitude * stel.D2R;
            stel.core.observer.elevation = this.loc.elevation;

            const serverTime = new Date();
            const mjd = utcToMJD(serverTime);
            stel.core.observer.utc = mjd;
            console.log('Stellarium initialized with server time:', serverTime.toISOString());

            stel.core.time_speed = 1;

            stelStore.stel = stel;
            this.installRenderGate();

            const protocol = settings.backendProtocol || 'http';
            const host = window.location.hostname;
            const port = window.location.port;
            const baseUrl = `${protocol}://${host}:${port}/stellarium-data/`;
            stelStore.baseUrl = baseUrl;
            const core = stel.core;

            core.dsos.hints_mag_offset = 3;

            core.stars.addDataSource({ url: baseUrl + 'minimal/stars', key: 'minimal' });
            core.stars.addDataSource({ url: baseUrl + 'base/stars', key: 'base' });
            core.stars.addDataSource({ url: baseUrl + 'extended/stars', key: 'extended' });
            core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });

            core.dsos.addDataSource({ url: baseUrl + 'base/dso', key: 'base' });
            core.dsos.addDataSource({ url: baseUrl + 'extended/dso', key: 'extended' });

            core.dss.addDataSource({ url: baseUrl + 'dssGen/surveys/dss', key: 'dssGen' });
            core.milkyway.addDataSource({ url: baseUrl + 'base/surveys/milkyway/v1' });

            core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
            // core.landscapes.addDataSource({ url: baseUrl + 'landscapes/gray', key: 'gray' });
            //core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz',key: 'jsonl/sat', });
            core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
            core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
            
            const addSSOSources = (ids) => {
              for (const id of ids) {
                core.planets.addDataSource({ url: `${baseUrl}base/surveys/sso/${id}/v1`, key: id });
              }
            };
            
            addSSOSources([
              "moon", "sun",
              "mercury", "venus", "mars",
              "jupiter", "saturn", "uranus",
              "neptune",
              "io", "europa", "ganymede", "callisto"
            ]);
            
            this.waitForStellariumRender();
          },
        })
      } catch (err) {
        console.error('Error with Fetch or StelWebEngine:', err);
      }
    },
    loadStellarium(loc) {

      const script = document.createElement('script');
      script.src = '/stellarium-js/stellarium-web-engine.js';
      console.log('Loading Stellarium Web Engine script...');

      script.onload = this.initStellarium;
      document.head.appendChild(script);
    },
    installRenderGate() {
      const stel = this.stelStore.stel;
      if (!stel || stel._coreRenderGated) return;

      let renderImpl = stel._core_render;
      let updateImpl = stel._core_update;
      if (typeof renderImpl !== 'function' || typeof updateImpl !== 'function') return;

      const gatedRender = function (...args) {
        if (!renderActive) return; // skip rendering while hidden
        return renderImpl.apply(stel, args);
      };

      const gatedUpdate = function (...args) {
        if (!renderActive) {
          const now = performance.now();
          if (now - lastHiddenUpdateTs < HIDDEN_UPDATE_INTERVAL_MS) return;
          lastHiddenUpdateTs = now;
        }
        return updateImpl.apply(stel, args);
      };

      Object.defineProperty(stel, '_core_render', {
        configurable: true,
        get() {
          return gatedRender;
        },
        set(fn) {
          // The lazy-binding resolves to the real WASM function; keep it as impl
          // but keep exposing our gated wrapper.
          renderImpl = fn;
        },
      });

      Object.defineProperty(stel, '_core_update', {
        configurable: true,
        get() {
          return gatedUpdate;
        },
        set(fn) {
          updateImpl = fn;
        },
      });

      stel._coreRenderGated = true;
    },
    setRenderActive(active) {
      renderActive = active;
      this.stelStore.visible = active;
      if (active) {
        // Force one update so the canvas is up to date the instant it becomes visible.
        if (typeof this.stelStore.stel?._core_update === 'function') {
          this.stelStore.stel._core_update();
        }
      }
    },
    handleVisibilityChange() {
      if (document.hidden) {
        this.setRenderActive(false);
      } else {
        this.setRenderActive(this.$route.path === "/sky");
      }
    },
    handleTouchCancel(e) {
      const stel = this.stelStore.stel;
      if (typeof stel?._core_on_mouse !== 'function' || !this.$refs.stelCanvas) return;
      const rect = this.$refs.stelCanvas.getBoundingClientRect();
      for (const touch of e.changedTouches) {
        stel._core_on_mouse(touch.identifier, 0, touch.pageX - rect.left, touch.pageY - rect.top, 1);
      }
    }
  },
  watch: {
    loc: {
      immediate: true,
      handler(loc) {
        if (loc.latitude === undefined || loc.longitude === undefined) 
          return;
        if (this.stelStore.stel) return;
        // cant setup a telescope over an ocean so this is a safe check
        if (loc.latitude === 0 && loc.longitude === 0) return; 
        this.loadStellarium();
      }
    },
    "$route.path"(path) {
      this.setRenderActive(path === "/sky"); 
    }
  },
  mounted() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.$refs.stelCanvas?.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
    renderActive = this.stelStore.visible && this.$route.path === "/sky";
  },
  beforeUnmount() {
    this.stelStore.currentOverlay = null;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.$refs.stelCanvas?.removeEventListener('touchcancel', this.handleTouchCancel);

    // The engine's render loop cannot be stopped, so at least disable rendering so
    // it stops producing GPU work once the component is gone.
    renderActive = false;

    if (renderWaitHandle) {
      clearTimeout(renderWaitHandle);
      renderWaitHandle = null;
    }
    if (this.stelStore.stel) {
      console.log('Tearing down Stellarium...');
      this.stelStore.stel = null;

      if (this.$refs.stelCanvas) {
        this.$refs.stelCanvas.width = 0;
        this.$refs.stelCanvas.height = 0;
      }

      console.log('Stellarium torn down.');
    }
  }
}
</script>
<style scoped>

#nightmode {
  background: #ff2200;
  pointer-events: none;
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 1000;
  mix-blend-mode: multiply;
}

.stellarium-container {
  touch-action: none;
  -webkit-touch-callout: none;

  left: 0;
  width: 100%;
  overflow: hidden;
  position: relative;
  height: calc(100dvh - var(--v-layout-top));
}

.stellarium-canvas {
  min-height: 0;
  width: 100%;
  height: 100%;
  display: block;
  /* Keep the browser from claiming pan/pinch/double-tap gestures on the sky
     canvas — WebKit otherwise aborts engine touches with touchcancel. */
  /* touch-action: none; */
  /* No long-press text-selection/magnifier callout on iPadOS. */
  -webkit-user-select: none;
  user-select: none;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.get-click {
  pointer-events: all;
}

</style>