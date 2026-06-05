<template>
  <div class="pa-2">
    <div class="text-h4">Align</div>
    <v-img class="ma-1" v-if="align.image" :src="align.image.image" :max-width="Math.min(align.image.width, 800)"></v-img>
    <v-divider class="mb-2"></v-divider>
    <div class="text-h6">{{align.status}}</div>
    <div v-if="align.solution">
      <v-row no-gutters>
        <v-col>RA:</v-col>            <v-col>{{hmsFromH(align.solution['ra.Hours'])}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Dec:</v-col>           <v-col>{{dms(align.solution['de.Degrees'])}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>FOV:</v-col>           <v-col>{{align.solution.fov}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Rotation:</v-col>      <v-col>{{align.solution.PA.toFixed(1)}}&deg;</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>ArcSec / Pixel:</v-col><v-col>{{align.solution.pix.toFixed(2)}}"</v-col>
      </v-row>
    </div>
    <LastNotification />
    <v-divider class="mb-2"></v-divider>
    <v-radio-group label="Solver Action" v-model="settings.$solverAction">
      <v-radio label="Sync" value="syncR" />
      <v-radio label="Slew to Target" value="slewR" />
      <v-radio label="Nothing" value="nothingR" />
    </v-radio-group>
    <v-row dense>
      <v-col>
        <v-number-input
          v-model="settings.alignAccuracyThreshold"
          label="Accuracy" :step="10" :min="1" :max="1200"
        />
      </v-col>
      <v-col>
        <v-number-input
          v-model="settings.alignSettlingTime"
          label="Settle" :step="100" :min="0" :max="15000"
        />
      </v-col>
    </v-row>
    <v-expansion-panels>
     <v-expansion-panel title="Capture Options">
      <v-expansion-panel-text>
        <v-row dense>
          <v-col>
            <v-number-input 
              v-model="settings.alignExposure" 
              label="Exposure" :step="1" :precision="1" :min="0.1" :max="60" 
            />
          </v-col>
          <v-col>
            <v-select v-if="deviceInfo.ccd.isoList != null"
              v-model="settings.alignISO" 
              :items="capture.isoList" 
              label="ISO"
            />
            <v-number-input v-else-if="deviceInfo.ccd.usesGain"
              v-model="settings.alignGain" :rules="[val => {if (val >= 1) return true; return 'Gain must be >= 1'}]"
              label="Gain" :step="50" :min="1" :max="10000"
            />
          </v-col>
        </v-row>
      </v-expansion-panel-text>
     </v-expansion-panel>
    </v-expansion-panels>
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block :disabled="settings.alignGain < 1" @click="onClickAlign">{{ alignText }}</v-btn>
      </v-list-item>
    </v-list>
    <v-divider class="mb-2"></v-divider>
    <div class="text-h5">Polar Alignment</div>
    <v-divider class="ma-2"></v-divider>
    <div class="text-h6">{{polar.stage}}</div>

    <div v-if="polar.vector">
      Measured:
      <v-row no-gutters v-if="polar.vector">
        <v-col>Err: {{dms(polar.vector.error)}}</v-col>
        <v-col>Alt: {{dms(polar.vector.altError)}}</v-col>
        <v-col>Az: {{dms(polar.vector.azError)}}</v-col>
      </v-row>
      <div v-if="polar.updatedError">Updated:</div>
      <v-row no-gutters v-if="polar.updatedError">
        <v-col>Err: {{dms(polar.updatedError)}}</v-col>
        <v-col>Alt: {{dms(polar.updatedALTError)}}</v-col>
        <v-col>Az: {{dms(polar.updatedAZError)}}</v-col>
      </v-row>
      <v-row no-gutters v-if="polar.vector || polar.updatedError">
        <v-col />
        <v-col><v-icon :icon="arrowAltPA.icon" :size="arrowAltPA.size" /></v-col>
        <v-col><v-icon :icon="arrowAzPA.icon" :size="arrowAzPA.size" /></v-col>
      </v-row>
      <v-divider class="mb-3 ma-2"></v-divider>
    </div>
    <div v-if="polar.stage === 'Idle'">
      <v-row dense>
        <v-col>
          <v-select 
            v-model="settings.pAHDirection" 
            :items="['East', 'West']" 
            label="Direction"
          />
        </v-col>
        <v-col>
          <v-number-input
            v-model="settings.pAHRotation" 
            label="Rotation magnitude" suffix="&deg;" :step="15" :min="15" :max="60"
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-select
            v-model="settings.pAHMountSpeed"
            :items="deviceInfo.mount.slewRates"
            label="Speed"
            :item-title="(item) => `${item.label} (${item.name})`"
            item-value="label"
          />
        </v-col>
        <v-col><v-checkbox v-model="settings.pAHManualSlew" label="Manual slew" /></v-col>
      </v-row>
    </div>
    <div v-else-if="polar.stage === 'Select Star'">
      <v-number-input
        v-model="settings.pAHExposure" 
        label="Refresh Exposure" :min="1" :max="10"
      />
      <v-select 
        v-model="settings.pAHRefreshAlgorithm" 
        :items="['Plate Solve','Move Star','Move Star & Calc Error']"
        label="Direction"
      />
      <v-list class="no-v-list-background">
        <v-list-item>
          <v-btn block @click="onClickPARefresh">Refresh</v-btn>
        </v-list-item>
      </v-list>
    </div>
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block @click="onClickPA">{{ textPA }}</v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>
<script setup>
import { hms, hmsFromH, dms } from "../../util/coords";
</script>
<script>
import LastNotification from "@/components/common/LastNotification.vue";
import { mapActions, mapState } from "vuex";
import { ALIGN_GET_ALL_SETTINGS, ALIGN_SET_ALL_SETTINGS, ALIGN_SOLVE, ALIGN_STOP, PAH_REFRESH, PAH_START, PAH_STOP } from "../../util/messageTypes";

const solverActions = [ "syncR", "slewR", "nothingR" ]

export default {
  components: {
    LastNotification,
  },
  data: () => ({
    arrowAltPA: {
      icon: "",
      size: "medium"
    },
    arrowAzPA: {
      icon: "",
      size: "medium"
    },
    modifiableOptions: [
      "alignAccuracyThreshold", "alignSettlingTime",
      "alignExposure",
      ...solverActions,

      "pAHDirection", "pAHRotation",
      "pAHMountSpeed", "pAHManualSlew",
      "pAHExposure", "pAHRefreshAlgorithm"
    ],
  }),
  computed: {
    ...mapState([
      "align",
      "polar",
      "deviceInfo"
    ]),
    ...mapState({
      settings: state => state.alignSettings,
      polarVector: state => state.polar?.vector,
      polarUpdatedErr: state => state.polar?.updatedError
    }),
    alignText() {
      if (this.align.status === 'Idle' || this.align.status === 'Failed'
        || this.align.status === 'Complete' || this.align.status === 'Aborted'
        || this.align.status === 'Successful'
      ) {
        return "Solve";
      }
      return "Stop";
    },
    textPA() {
      if (this.polar.stage === "Idle") {
        return "Start";
      }
      return "Stop"
    }
  },
  watch: {
    align: {
      deep: true,
      handler(val, oldVal) {
        if (!val?.settings) return;
        Object.keys(val.settings).forEach(k => {
          if (this.modifiableOptions.includes(k)) {
            this.settings[k] = val.settings[k];
            if (solverActions.includes(k) && this.settings[k] === true) {
              this.settings.$solverAction = k;
            }
          }
        });
      }
    },
    polarVector(nv) {
      if (!nv) return;
      this.arrows();
    },
    polarUpdatedErr(nv) {
      if (!nv) return;
      this.arrows();
    }
  },
  mounted() {
    if (this.polarVector || this.polarUpdatedErr) this.arrows();
    this.sendMsg([ALIGN_GET_ALL_SETTINGS]);
  },
  methods: {
    ...mapActions([
      "sendMsg",
    ]),
    arrows() {
      const altError = (this.polar?.updatedALTError ?? this.polar.vector?.altError) ?? 0;
      const azError = (this.polar?.updatedAZError ?? this.polar.vector?.azError) ?? 0;

      const minError = 20.0 / 3600.0;  // 20 arcsec

      // these constants are worked out so a 10' error gives a size of 50
      // and a 1' error gives a size of 20.
      const largeErr = 10.0 / 60.0, smallErr = 1.0 / 60.0,
       largeSize = "large", smallSize = "small";
      let size = "medium";      
      // alt
      let absError = Math.abs(altError);
      if (absError > largeErr)
        size = largeSize;
      else if (absError < smallErr)
        size = smallSize;

      this.arrowAltPA.size = size;
      if (altError > minError) {
        // downArrow(altPainter, size, size);
        this.arrowAltPA.icon = "mdi-arrow-down-bold";
      } else if (altError < -minError) {
        // upArrow(altPainter, size, size);
        this.arrowAltPA.icon = "mdi-arrow-up-bold";
      }

      // az
      absError = Math.abs(azError);
      if (absError > largeErr)
        size = largeSize;
      else if (absError < smallErr)
        size = smallSize;
      else size = "medium";

      this.arrowAzPA.size = size;
      if (azError > minError) {
        // leftArrow(azPainter, size, size);
        this.arrowAzPA.icon = "mdi-arrow-left-bold";
      } else if (azError < -minError) {
        // rightArrow(azPainter, size, size);
        this.arrowAzPA.icon = "mdi-arrow-right-bold";
      }
    },
    onClickAlign() {
      if (this.alignText === "Solve") {
        this.updateSettings();
        this.sendMsg([ALIGN_SOLVE]);
      } else {
        this.sendMsg([ALIGN_STOP]);
      }
    },
    updateSettings() {
      solverActions.forEach(a => this.settings[a] = false);
      this.settings[this.settings.$solverAction] = true;

      this.sendMsg([ALIGN_SET_ALL_SETTINGS, {
        ...this.align.settings,
        ...this.settings,
      }])
    },
    onClickPA() {
      if (this.textPA === "Start") {
        this.updateSettings();
        this.sendMsg([PAH_START])
      } else {
        this.sendMsg([PAH_STOP]);
      }
    },
    onClickPARefresh() {
      this.updateSettings();
      this.sendMsg([PAH_REFRESH, { value: this.settings.pAHExposure }])
    }
  }
};
</script>
