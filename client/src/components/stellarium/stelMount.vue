<template>
  <div style="position:fixed; top: calc(var(--v-layout-top) + 0.25em); left: 0.25em;">
    <v-fab v-if="stelStore.currentOverlay === null" @click="syncToMountView" 
      icon size="small" color="transparent" variant="text"
    >
      <v-icon icon="mdi-telescope" size="x-large" color="rgba(255,255,255,0.8)" /> 
    </v-fab>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import {
  buildFovPolygonGeoJSON,
  EMPTY_FEATURE_COLLECTION,
} from '@/util/fovGeometry';

export default {
  data: () => ({
    mountCircle: null,
    mountFov: null,
    raDeg: null,
    deDeg: null,
  }),
  computed: {
    ...mapState([
      "mount",
      "align", "clientSettings",
      "stelStore"
    ]),
    cameraFov() {
      const arcMinX = this.align.solution?.fovs?.[0] ?? this.align.settings?.kcfg_AstrometryImageScaleHigh;
      const arcMinY = this.align.solution?.fovs?.[1] ?? this.align.settings?.kcfg_AstrometryImageScaleLow;
      return {
        fovX: arcMinX / 60,
        fovY: arcMinY / 60,
        rotationDeg: this.align.solution?.PA ?? this.clientSettings.defaultCamRotation
      }
    },
  },
  watch: {
    cameraFov: {
      immedate: true,
      handler(v) {
        this.updateFovBox(this.mount.ra0, this.mount.de0);
      }
    },
    mount: {
      immedate: true,
      handler(v) {
        if (v.ra === undefined || v.de === undefined) 
          return;
        this.updateCirclePos(v.ra, v.de, v.ra0, v.de0, v.ra === this.raDeg && v.de === this.deDeg);
      }
    }
  },
  methods: {
    syncToMountView() {
      this.stelStore.stel.pointAndLock(this.mountCircle);
    },
    updateCirclePos(ra_deg = 0, dec_deg = 0, ra0 = 0, de0 = 0, isOldCoords = false) {
      if (this.$route.path !== "/sky") return;
      this.raDeg = ra_deg;
      this.deDeg = dec_deg;
      const stel = this.stelStore.stel;
      const ra_rad = ra_deg * stel.D2R - 0.0;
      const dec_rad = dec_deg * stel.D2R;
      const icrfVec = stel.s2c(ra_rad, dec_rad);
      const observedVec = stel.convertFrame(stel.observer, stel.FRAME_JNOW, stel.FRAME_MOUNT, icrfVec);
      this.mountCircle.pos = observedVec;
      this.mountCircle.color = [0, 0.5, 0, 0.25];
      this.mountCircle.border_color = [1, 1, 1, 1];
      this.mountCircle.size = [0.026, 0.026];
      this.mountCircle.frame = stel.FRAME_MOUNT;
      this.mountCircle.label = 'MOUNT';
      this.mountCircle.update();

      if (!isOldCoords) this.updateFovBox(ra0, de0);
    },
    updateFovBox(ra0, de0) {
      const fov = this.cameraFov;
      this.mountFov.data = buildFovPolygonGeoJSON({
        raDeg: ra0,
        decDeg: de0,
        fovXDeg: fov.fovX,
        fovYDeg: fov.fovY,
        rotationDeg: fov.rotationDeg,
        fillColor: '#facc15',
        fillOpacity: 0,
        strokeColor: '#ffffff',
        strokeOpacity: 0.9,
        strokeWidth: 1.5,
      })
    }
  },
  mounted() {
    const stel = this.stelStore.stel;
    const mountLayer = stel.createLayer({ id: 'mountLayer', z: 7, visible: true });
    this.mountCircle = stel.createObj('circle', {
      id: 'mountCircle',
      model_data: {},
    });
    this.mountCircle.update();
    mountLayer.add(this.mountCircle);

    this.mountFov = stel.createObj('geojson', { id: 'mountFovBox' });
    mountLayer.add(this.mountFov);
    this.mountFov.data = EMPTY_FEATURE_COLLECTION;

    this.updateCirclePos(this.mount.ra, this.mount.de, this.mount.ra0, this.mount.de0);
  },
  beforeUnmount() {
    this.mountFov = null;
  }
}
</script>