<template>
<div>
  <div style="position:fixed; top: calc(var(--v-layout-top) + 32px); left: 2px;">
    <v-fab v-if="stelStore.currentOverlay === null"
      icon size="small" variant="text"
      :disabled="stelStore.lowerComponent === 'framing'"
      @click="showFramingDialog()"
    >
      <div class="d-inline-flex align-center justify-center position-relative" style="width: 28px; height: 28px;">
        <v-icon color="rgba(255,255,255,0.8)" icon="mdi-crop-free" size="28" class="position-absolute" />
        <v-icon style="top: 7.5px" color="rgba(255,255,255,0.8)" icon="mdi-camera" size="14" class="position-absolute" />
      </div>
    </v-fab>
  </div>
  <v-bottom-sheet
    v-model="showFraming" 
    :scrim="false"
    :persistent="true"
    no-click-animation
  >
    <v-card class="rounded-t-xl" ref="stelFramingRef">
      <v-card-title class="d-flex align-center">
        Framing
        <v-spacer></v-spacer>
        <v-btn icon="mdi-telescope" size="small" variant="text" @click="slew()" style="right: 10px" />
        <v-btn icon="mdi-close" size="small" variant="text" @click="showFraming = false" />
      </v-card-title>
 
      <v-card-text class="pt-0">
        
        <v-slider hide-details readonly label="Rotation" v-model="rotation" :min="-180" :max="180" thumb-label="always" />
        
        <v-row class="pt-1">
          <v-col>
            RA: {{ formatRaDe(raDe[0]) }}
          </v-col>
          <v-col>
            DE: {{ formatRaDe(raDe[1]) }}
          </v-col>
        </v-row>
        
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</div>
</template>
<script setup>
import { hms, dms } from "@/util/coords"
</script>
<script>
import { mapState, mapActions } from 'vuex';
import {
  // computeCameraFovDeg,
  buildFovPolygonGeoJSON,
  EMPTY_FEATURE_COLLECTION,
} from '@/util/fovGeometry';
import { MOUNT_GOTO_RADE } from "@/util/messageTypes";

export default {
  data: () => ({
    fovLayer: null,
    viewFov: null,
    rafId: null,
    lastViewRa: null,
    lastViewDec: null,
    raDecRaf: null,
    raDe: [],
    showFraming: false,
    rotation: null,
    awaitingSelectedClose: false,
    currMenu: "framing",
  }),
  computed: {
    ...mapState([
      "align", "stelStore",
      "clientSettings",
    ]),
    cameraFov() {
      // const pixelSizeMicrons = this.deviceInfo.ccd.pixelSize;
      // const train = this.trains.trains.find(t => t.id === this.trains.profiles['0']);
      // console.log(train)
      // const focalLengthMm = this.scopes.find(s => s.name === train.scope).focal_length;
      // const sensorWidthPx = this.capture.settings.captureFrameWN;
      // const sensorHeightPx = this.capture.settings.captureFrameHN;
      // return computeCameraFovDeg({
      //   pixelSizeMicrons,
      //   focalLengthMm,
      //   sensorWidthPx,
      //   sensorHeightPx,
      // });
      const arcMinX = this.align.solution?.fovs?.[0] ?? this.align.settings?.kcfg_AstrometryImageScaleHigh;
      const arcMinY = this.align.solution?.fovs?.[1] ?? this.align.settings?.kcfg_AstrometryImageScaleLow;
      return {
        fovX: arcMinX / 60,
        fovY: arcMinY / 60,
        rotationDeg: this.align.solution?.PA ?? this.clientSettings.defaultCamRotation //this.rotation
      }
    },
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    updateViewFov() {
      if (!this.showFraming) return;
      if (!this.viewFov) return;
      const stel = this.stelStore.stel;
      const fov = this.cameraFov;
      if (!fov.fovX || !fov.fovY) {
        this.viewFov.data = EMPTY_FEATURE_COLLECTION;
        this.lastViewRa = null;
        this.lastViewDec = null;
        return;
      }
      let icrfVec = stel.convertFrame(stel.observer, 'VIEW', 'ICRF', [0, 0, -1]);
      let raDecRad = stel.c2s(icrfVec);
      let raDeg = raDecRad[0] * stel.R2D;
      const decDeg = raDecRad[1] * stel.R2D;
      if (raDeg < 0) raDeg += 360;
      if (
        this.lastViewRa !== null &&
        Math.abs(this.lastViewRa - raDeg) < 0.005 &&
        Math.abs(this.lastViewDec - decDeg) < 0.005
      ) {
        return;
      }
      this.lastViewRa = raDeg;
      this.lastViewDec = decDeg;
      icrfVec = stel.convertFrame(stel.observer, 'ICRF', 'JNOW', icrfVec);

      this.updateLock(icrfVec);

      raDecRad = stel.c2s(icrfVec);
      this.raDe = [stel.a2tf(stel.anp(raDecRad[0]), 2), stel.a2af(stel.anpm(raDecRad[1]), 2)];
      this.rotation = fov.rotationDeg;
      this.viewFov.data = buildFovPolygonGeoJSON({
        raDeg,
        decDeg,
        fovXDeg: fov.fovX,
        fovYDeg: fov.fovY,
        rotationDeg: fov.rotationDeg,
        fillColor: '#facc15',
        fillOpacity: 0,
        strokeColor: '#c42429',
        strokeOpacity: 0.9,
        strokeWidth: 1.5,
      });
    },
    viewFovLoop() {
      if (this.$route.path !== "/sky") {
        this.rafId = null;
        return;
      }
      this.updateViewFov();
      this.rafId = requestAnimationFrame(this.viewFovLoop);
    },
    startTrackingBottomSheet(el) {
      const loop = () => {
        const el = document.querySelector('.v-bottom-sheet__content');
        if (!el) {
          this.stelStore.lowerComponentHeight = 0;
          this.stelStore.lowerComponent = null;
          this.trackingBottomSheet = false;
          return;
        }
        const rect = el.getBoundingClientRect();
        this.stelStore.lowerComponentHeight = window.innerHeight - rect.top;
        if (this.trackingBottomSheet) requestAnimationFrame(loop);
      };
      this.trackingBottomSheet = true;
      requestAnimationFrame(loop);
    },
    showFramingDialog() {
      const bottomComponent = this.stelStore.lowerComponent
      if (bottomComponent !== null) {
        if (bottomComponent === "selected") {
          this.stelStore.stel.core.selection = 0;
          this.stelStore.stelT.selection = 0;
          this.awaitingSelectedClose = true;
        }
      }
      this.showFraming = true;
      this.stelStore.lowerComponent = "framing";
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const el = this.$refs.stelFramingRef?.$el?.parentElement
          if (el)
            el.addEventListener('transitionrun', () => {
              this.startTrackingBottomSheet();
            });
        })
      });
    },
    formatRaDe(o) {
      if (!o) return "?";
      const isDe = o.degrees !== undefined;
      if (isDe) {
        return `${o.sign}${o.degrees}° ${o.arcminutes}' ${o.arcseconds}.${o.fraction}"`;
      }
      return `${o.sign}${o.hours}h ${o.minutes}m ${o.seconds}.${o.fraction}s`;
    },
    slew() {      
      const format = (o) => {
        return `${o.sign}${o.hours ?? o.degrees}:${o.minutes ?? o.arcminutes}:${o.seconds ?? o.arcseconds}.${o.fraction}`;
      }
      this.sendMsg([MOUNT_GOTO_RADE, { ra: format(this.raDe[0]), de: format(this.raDe[1])}])
      console.log(format(this.raDe[0]), format(this.raDe[1]));
    },
    updateLock(pos) {
      if (!this.showFraming) return;
      const stel = this.stelStore.stel;
      if (stel.core.lock) return;
      this.coordinateLock.pos = pos;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        stel.core.lock = this.coordinateLock;
      }));
    }
  },
  watch: {
    "$route.path"(path) {
      if (path === "/sky" && this.rafId === null) {
        this.rafId = requestAnimationFrame(this.viewFovLoop);
      }
    },
    cameraFov() {
      this.lastViewRa = null;
      this.lastViewDec = null;
      this.updateViewFov();
    },
    'stelStore.lowerComponent'(v) {
      if (v) return;
      if (!this.awaitingSelectedClose) return;
      this.awaitingSelectedClose = false;
      this.showFramingDialog();
    },
    'stelStore.currentOverlay'(v) {
      this.showFraming = false;
    },
    showFraming(v) {
      if (v) return;
      this.viewFov.data = EMPTY_FEATURE_COLLECTION;
    }
  },
  mounted() {
    const stel = this.stelStore.stel;
    this.fovLayer = stel.createLayer({ id: 'fovFrameLayer', z: 8, visible: true });
    this.viewFov = stel.createObj('geojson', { id: 'viewFovBox' });
    this.coordinateLock = stel.createObj('coordinates', { })
    // ekos doesnt support rotation rn unless via scheduler
    // this.rotation = this.align.solution?.PA ?? this.clientSettings.defaultCamRotation
    this.fovLayer.add(this.viewFov);
    this.viewFov.data = EMPTY_FEATURE_COLLECTION;

    this.rafId = requestAnimationFrame(this.viewFovLoop);
  },
  beforeUnmount() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.viewFov = null;
    this.fovLayer = null;
  }
}

</script>