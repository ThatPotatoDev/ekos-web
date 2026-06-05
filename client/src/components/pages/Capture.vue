<template>
  <div class="pa-2">
    <div class="text-h4">Capture</div>
    <v-img class="ma-1" v-if="preview.image" :src="preview.image.image" :max-width="Math.min(preview.image.width, 800)">
      <v-overlay absolute :value="this.showCrosshairs" color="rgba(0,0,0,0)">
        <v-img :src="crosshairs"></v-img>
      </v-overlay>
    </v-img>
    <v-divider class="mb-2"></v-divider>
    <v-btn :outlined="this.showCrosshairs" @click.stop="this.showCrosshairs = !this.showCrosshairs">
      <v-icon icon="mdi-target" height="24" />
    </v-btn>
    <v-divider class="mb-2 mt-2"></v-divider>
    <div class="text-h6">{{ capture.status }}</div>
    <div v-if="capture.expr">
      <v-row v-if="capture.seqv !== capture.seqr" no-gutters>
        <v-col>Exposure:</v-col>              <v-col>{{ capture.expv.toFixed(2) }} of {{ capture.expr }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Overall Time Remaining:</v-col><v-col>{{ capture.ovt }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Time Remaining:</v-col>    <v-col>{{ capture.seqt }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Label:</v-col>             <v-col>{{ capture.seql }}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Job Exposures:</v-col>         <v-col>{{ capture.seqv }} of {{ capture.seqr }}</v-col>
      </v-row>
    </div>
    <LastNotification />
    <v-divider class="mb-2"></v-divider>
    <!-- TODO: see if rules are necessary  -->
    <v-form class="ma-1" validate-on="blur">
      <v-row dense>
        <v-col>
          <v-select 
            v-model="captureSettings.captureTypeS" 
            :items="['Light', 'Dark', 'Bias', 'Flat']" 
            label="Frame Type" hide-details
          />
        </v-col>
        <v-col>
          <v-select 
            v-model="captureSettings.captureEncodingS" 
            :items="deviceInfo.ccd.transferFormats" 
            label="File Format" hide-details
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-number-input
            v-model="captureSettings.captureCountN" 
            label="Count" :min="1" :max="100000" hide-details
          />
        </v-col>
        <v-col v-if="deviceInfo.ccd.filters.length !== 0">
          <v-select
            v-model="captureSettings.FilterPosCombo" 
            :items="deviceInfo.ccd.filters" 
            label="Filter" hide-details
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <non-linear-number-input
          v-model="captureSettings.captureExposureN"
          label="Exposure (sec)" :rules="[val => {if (val > 0) return true; return 'Exposure must be > 0'}]"
        />
        </v-col>
        <v-col>
          <v-select v-if="deviceInfo.ccd.isoList != null"
            v-model="captureSettings.captureISOS" 
            :items="capture.isoList" 
            label="ISO"
          />
          <v-number-input v-else-if="deviceInfo.ccd.usesGain"
            v-model="captureSettings.captureGainN" :rules="[val => {if (val >= 1) return true; return 'Gain must be >= 1'}]"
            label="Gain" :step="50" :min="1" :max="10000"
          />
        </v-col>
      </v-row>
    </v-form>
    <v-divider class="mb-2"></v-divider>
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block @click="onPreviewClick"
          :disabled="this.startStopText !== 'Start'">Preview</v-btn>
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
import SequenceQueue from "@/components/SequenceQueue.vue"
import NonLinearNumberInput from "../util/NonLinearNumberInput.vue";
import { mapActions, mapState } from "vuex";
import { CAPTURE_GET_ALL_SETTINGS, CAPTURE_PREVIEW, CAPTURE_START, CAPTURE_STOP } from "../../util/messageTypes";

export default {
  components: {
    LastNotification,
    SequenceQueue,
    NonLinearNumberInput
  },
  data: () => ({
    showCrosshairs: false,
    modifiableOptions: [
      "captureTypeS", "FilterPosCombo",
      "captureExposureN", "captureCountN",
      "captureISOS", "captureGainN",
      "captureEncodingS"
    ],
  }),
  computed: {
    ...mapState([
      "capture",
      "preview",
      "captureSettings",
      "deviceInfo"
    ]),
    startStopText() {
      if (
        this.capture.status === "Idle"
        || this.capture.status === "Complete"
        || this.capture.status === "Aborted"
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
    capture: {
      deep: true,
      handler(val) {
        if (val?.settings) {
          Object.keys(val.settings).forEach(k => {
            if (this.modifiableOptions.indexOf(k) !== -1
              && (this.captureSettings[k] === undefined || this.captureSettings[k] === null)) {
              this.captureSettings[k] = val.settings[k];
            }
          });
        }
      }
    }
  },
  mounted() {
    this.sendMsg([CAPTURE_GET_ALL_SETTINGS]);
  },
  methods: {
    ...mapActions(["sendMsg", "captureUpdateSettings", "captureSetAllSettings", "captureStop", "captureStart", "capturePreview"]),
    toggleCapture() {
      this.captureUpdateSettings();
      if (this.startStopText === "Start") {
        this.sendMsg([CAPTURE_START]);
      } else {
        this.sendMsg([CAPTURE_STOP]);
      }
    },
    onPreviewClick() {
      this.captureUpdateSettings();
      this.sendMsg([CAPTURE_PREVIEW]);
    },
  },
};
</script>
