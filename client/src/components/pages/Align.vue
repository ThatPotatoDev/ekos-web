<template>
  <div class="pa-2">
    <div class="text-h4">Align</div>
    <v-img class="ma-1" v-if="align.image" :src="align.image.image" :max-width="Math.min(align.image.width, 800)"></v-img>
    <v-divider class="mb-2"></v-divider>
    <div class="text-h6">{{align.status}}</div>
    <div v-if="align.solution">
      <v-row no-gutters>
        <v-col>&Delta; RA:</v-col>    <v-col>{{hms(align.solution.dRA)}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>&Delta; Dec:</v-col>   <v-col>{{dms(align.solution.dDE)}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>RA:</v-col>            <v-col>{{align.solution.ra}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Dec:</v-col>           <v-col>{{align.solution.de}}</v-col>
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
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block @click="onClickAlign">{{alignText}}</v-btn>
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
      Updated:
      <v-row no-gutters v-if="polar.updatedError">
        <v-col>Err: {{dms(polar.updatedError)}}</v-col>
        <v-col>Alt: {{dms(polar.updatedALTError)}}</v-col>
        <v-col>Az: {{dms(polar.updatedAZError)}}</v-col>
      </v-row>
      <v-row no-gutters v-if="polar.vector || polar.updatedError">
        <v-col></v-col><!-- TODO: arrows -->
        <v-col></v-col>
        <v-col></v-col>
      </v-row>
      
      <v-divider class="mb-3 ma-2"></v-divider>
    </div>
    <div v-if="polar.stage === 'Idle'">
      <v-select 
        v-model="settings.pAHDirection" 
        :items="['East', 'West']" 
        label="Direction"
      />
      <v-number-input
        v-model="settings.pAHRotation" 
        label="Rotation magnitude (&deg;)" :step="15" :min="15" :max="60"
      />
      <v-row>
        <v-col>
        <v-select
          v-model="settings.pAHMountSpeed"
          :items="slewRates"
          label="Speed"
          :item-title="(item) => `${item.label} (${item.name})`"
          item-value="label"
        ></v-select>
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
import { hms, dms } from "../../util/coords";
</script>
<script>
import LastNotification from "@/components/common/LastNotification.vue";
import { mapActions, mapState } from "vuex";
import { ALIGN_GET_ALL_SETTINGS, ALIGN_SET_ALL_SETTINGS, ALIGN_SOLVE, ALIGN_STOP, PAH_REFRESH, PAH_START, PAH_STOP } from "../../util/messageTypes";

export default {
  components: {
    LastNotification,
  },
  data() {
    return {
      modifiableOptions: ["pAHDirection", "pAHRotation", "pAHMountSpeed", "pAHManualSlew", "pAHExposure", "pAHRefreshAlgorithm"],
    };
  },
  computed: {
    ...mapState([
      "align",
      "polar",
      "slewRates"
    ]),
    ...mapState({
      settings: state => state.alignSettings
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
        if (val?.settings) {
          Object.keys(val.settings).forEach(k => {
            if (this.modifiableOptions.indexOf(k) !== -1) {
              this.settings[k] = val.settings[k];
            }
          });
        }
      }
    }
  },
  mounted() {
    this.sendMsg([ALIGN_GET_ALL_SETTINGS]);
  },
  methods: {
    ...mapActions([
      "sendMsg",
    ]),
    onClickAlign() {
      if (this.alignText === "Solve") {
        this.updateSettings();
        this.sendMsg([ALIGN_SOLVE]);
      } else {
        this.sendMsg([ALIGN_STOP]);
      }
    },
    updateSettings() {
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
