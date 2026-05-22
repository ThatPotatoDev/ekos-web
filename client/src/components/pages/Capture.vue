<template>
  <div class="pa-2">
    <div class="text-h4">Capture</div>
    <v-img class="ma-1" v-if="preview.image" :src="preview.image.image" :max-width="Math.min(preview.image.width, 800)">
      <v-overlay absolute :value="showCrosshairs" color="rgba(0,0,0,0)">
        <v-img :src="crosshairs"></v-img>
      </v-overlay>
    </v-img>
    <v-divider class="mb-2"></v-divider>
    <v-btn :outlined="showCrosshairs" @click.stop="showCrosshairs = !showCrosshairs">
      <iconify-icon icon="target" height="24"></iconify-icon>
    </v-btn>
    <v-divider class="mb-2 mt-2"></v-divider>
    <div class="text-h6">{{ capture.status }}</div>
    <div v-if="capture.expr">
      <v-row v-if="capture.seqv !== capture.seqr" no-gutters>
        <v-col>Exposure:</v-col>
        <v-col>{{ capture.expv.toFixed(2) }} of {{ capture.expr }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Overall Time Remaining:</v-col>
        <v-col>{{ capture.ovt }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Time Remaining:</v-col>
        <v-col>{{ capture.seqt }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Label:</v-col>
        <v-col>{{ capture.seql }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Exposures:</v-col>
        <v-col>{{ capture.seqv }} of {{ capture.seqr }}</v-col>
      </v-row>
    </div>
    <LastNotification />
    <v-divider class="mb-2"></v-divider>
    <v-form class="ma-1">
      <v-select 
        v-model="captureSettings.captureTypeS" 
        :items="['Light', 'Dark', 'Bias', 'Flat']" 
        label="Frame Type"
      />
      <v-select v-if="capture.filters.length !== 0"
        v-model="captureSettings.FilterPosCombo" 
        :items="capture.filters" 
        label="Filter"
      />
      <v-text-field 
        v-model="captureSettings.captureExposureN" 
        label="Exposure" type="number" suffix="sec" min="0.000250"  max="3600"
      />
      <v-text-field 
        v-model="captureSettings.captureCountN" 
        label="Count" type="number" min="1" max="100000" 
      />
      <v-select v-if="capture.isoList"
        v-model="captureSettings.captureISOS" 
        :items="capture.isoList" 
        label="ISO"
      />
      <v-text-field v-if="capture.usesGain"
        v-model="captureSettings.captureGainN" 
        label="Gain" type="number" min="0" 
      />
    </v-form>
    <v-divider class="mb-2"></v-divider>
    <v-list class="noBackgroundFr">
      <v-list-item>
        <v-btn block @click="onPreviewClick"
          :disabled="this.capture.status !== 'Idle' && this.capture.status !== 'Complete'">Preview</v-btn>
      </v-list-item>
      <v-list-item>
        <v-btn block @click="toggleCapture">{{ startStopText }}</v-btn>
      </v-list-item>
    </v-list>
    <SequenceQueue />
  </div>
</template>
<script>
import LastNotification from "@/components/common/LastNotification.vue";
import target from "@iconify/icons-mdi/target";
import SequenceQueue from "@/components/SequenceQueue.vue"
import { Icon, addIcon } from '@iconify/vue';
import { mapActions, mapState } from "vuex";
import { CAPTURE_GET_ALL_SETTINGS } from "../../util/messageTypes";

addIcon('target', target);

export default {
  components: {
    LastNotification,
    SequenceQueue,
    IconifyIcon: Icon,
  },
  data() {
    return {
      selectedCamera: null,
      selectedType: null,
      exp: null,
      showCrosshairs: false,
      modifyableOptions: ["captureTypeS", "FilterPosCombo", "captureExposureN", "captureCountN", "captureISOS", "captureGainN"],
    };
  },
  computed: {
    ...mapState([
      "capture",
      "preview",
      "captureSettings"
    ]),
    startStopText() {
      if (
        this.capture.status === "Idle" ||
        this.capture.status === "Complete"
      ) {
        return "Start";
      }

      return "Stop";
    },
    crosshairs() {
      const svg =
        `<svg width='200' height='200' xmlns='http://www.w3.org/2000/svg'>
          <g>
            <circle r='50' cy='50%' cx='50%' stroke-width='1.5' stroke='rgba(255,255,255,0.5)' fill='rgba(0, 0, 0, 0)' />
            <circle r='10' cy='50%' cx='50%' stroke-width='1.5' stroke='rgba(255,255,255,0.5)' fill='rgba(0, 0, 0, 0)' />
            <line x1='50%' x2='50%' y1='0' y2='100%' stroke-width='1.5' stroke='rgba(255,255,255,0.5)' />
            <line x1='0' x2='100%' y1='50%' y2='50%' stroke-width='1.5' stroke='rgba(255,255,255,0.5)' />
          </g>
        </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },
  },
  watch: {
    capture(val) {
      if (val && val.settings) {
        Object.keys(val.settings).forEach(k => {
          if (this.modifyableOptions.indexOf(k) !== -1
            && this.captureSettings[k] === undefined
            || this.captureSettings[k] === null) {
            this.captureSettings[k] = val.settings[k];
          }
        });
      }
    },
  },
  mounted() {
    this.sendMsg([CAPTURE_GET_ALL_SETTINGS]);
  },
  methods: {
    ...mapActions(["sendMsg", "captureUpdateSettings", "captureSetAllSettings", "captureStop", "captureStart", "capturePreview"]),
    toggleCapture() {
      this.captureUpdateSettings();
      if (this.startStopText === "Start") {
        this.captureStart();
      } else {
        this.captureStop();
      }
    },
    onPreviewClick() {
      this.captureUpdateSettings();
      this.capturePreview();
    },
  },
};
</script>
