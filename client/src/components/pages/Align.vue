<template>
  <div class="pa-2">
    <div class="text-h4">Align</div>
    <v-img class="ma-1" v-if="align.image" :src="align.image.image" :max-width="Math.min(align.image.width, 800)"></v-img>
    <v-divider class="mb-2"></v-divider>
    <div class="text-h6">{{align.status}}</div>
    <div v-if="align.solution">
      <v-row no-gutters>
        <v-col>&Delta; RA:</v-col>    <v-col>{{align.solution.dRA}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>&Delta; Dec:</v-col>   <v-col>{{align.solution.dDE}}</v-col>
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
    <div v-if="polar.vector">
      <v-row no-gutters>
        <v-col>Center X:</v-col>      <v-col>{{polar.vector.center_x}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Center Y:</v-col>      <v-col>{{polar.vector.center_y}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Mag:</v-col>           <v-col>{{polar.vector.mag}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Pa:</v-col>            <v-col>{{polar.vector.pa}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Error:</v-col>         <v-col>{{polar.updatedError ?? polar.vector.error}}</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Azimuth Error:</v-col> <v-col>{{polar.updatedAZError ?? polar.vector.azError}}&deg;</v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>Altitude Error:</v-col><v-col>{{polar.updatedAZError ?? polar.vector.altError}}"</v-col>
      </v-row>
    </div>
    <v-select 
      v-model="settings.pAHDirection" 
      :items="['East', 'West']" 
      label="Direction"
    />
    <v-number-input
      v-model="settings.pAHRotation" 
      label="Rotation magnitude (&deg;)" :step="15" :min="15" :max="60"
    />
    <v-select
      v-model="settings.pAHMountSpeed"
      :items="slewRates"
      label="Speed"
      :item-title="(item) => `${item.label} (${item.name})`"
      item-value="label"
      hide-details
    ></v-select>
    <v-checkbox v-model="settings.pAHManualSlew" label="Manual slew" hide-details></v-checkbox>
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block @click="onClickPA">{{textPA}}</v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>
<script>
import LastNotification from "@/components/common/LastNotification.vue";
import { mapActions, mapState } from "vuex";
import { ALIGN_GET_ALL_SETTINGS, ALIGN_SET_ALL_SETTINGS, ALIGN_SOLVE, ALIGN_STOP, PAH_START, PAH_STOP } from "../../util/messageTypes";

export default {
  components: {
    LastNotification,
  },
  data() {
    return {
      modifiableOptions: ["pAHDirection", "pAHRotation", "pAHMountSpeed", "pAHManualSlew"],
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
      if (this.align.status === 'Idle' || this.align.status === 'Failed' || this.align.status === 'Complete' || this.align.status === 'Aborted') {
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
    }
  }
};
</script>
