<template>
  <div class="pa-2">
    <div class="text-headline-large">Mount</div>
    <v-divider class="mb-2" />
    <div class="text-headline-small">{{ mount.status }}</div>
    <v-divider class="mb-2 mt-2" />
    <v-row>
      <v-col>
        RA: {{ hms(mount.ra) ?? '?' }}
      </v-col>
      <v-col>
        DE: {{ dms(mount.de) ?? '?' }}
      </v-col>
    </v-row>
    <li>{{ mount.meridianFlipText ?? '?'}}</li>
    <li>Pier Side: {{ mount.pierSide != undefined ? pierSide : '?' }}</li>
    <LastNotification />
    <v-divider class="mb-2" />
    <v-list class="no-v-list-background">
      <v-list-item>
        <v-btn block
          :disabled="mount.status === 'Idle' || mount.status === 'Tracking'"
          @click="mountAbort"
        >Abort</v-btn>
      </v-list-item>
      <v-list-item>
        <v-btn block :disabled="parkButtonText === 'Parking'" @click="togglePark">{{ parkButtonText }}</v-btn>
      </v-list-item>
      <v-list-item>
        <v-btn block
          @click="toggleTracking"
          :disabled="mount.status !== 'Idle' && mount.status !== 'Tracking'"
        >{{ trackingButtonText }}</v-btn>
      </v-list-item>
    </v-list>
    <v-expansion-panels class="pl-4 pr-4 mb-3" variant="accordion" :rounded="[8, 0]" static>
      <v-expansion-panel :title="$t('mount.settings.MeridianFlip')">
      <v-expansion-panel-text>
        <v-row density="compact">
          <v-col cols="1" class="pl-4 d-flex align-center justify-center"><v-checkbox
              v-model="settings.executeMeridianFlip" density="compact" hide-details /></v-col>
          <v-col class="d-flex align-center justify-center">{{ $t('mount.settings.flipIfHAGreaterThan') }}</v-col>
          <v-col class="pr-2"><v-number-input v-model="settings.meridianFlipOffsetDegrees" suffix="&deg;"
              density="compact" :min="0" :max="120" :step="5" hide-details /></v-col>
        </v-row>
      </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :title="$t('mount.settings.Limits')">
      <v-expansion-panel-text>
        <v-row density="compact">
          <v-col><v-checkbox
            v-model="settings.enableAltitudeLimits" density="compact"
            :label="$t('mount.settings.enableAltitudeLimits')" hide-details 
          /></v-col>
          <v-col><v-checkbox
            v-model="settings.enableAltitudeLimitsTrackingOnly" density="compact"
            :label="$t('mount.settings.enableAltitudeLimitsTrackingOnly')" :disabled="!settings.enableAltitudeLimits" hide-details 
          /></v-col>
        </v-row>
        <v-row density="compact">
          <v-col><v-number-input 
            v-model="settings.minimumAltLimit" suffix="&deg;" density="compact" :disabled="!settings.enableAltitudeLimits"
            :label="$t('mount.settings.minimumAltLimit')" :min="-90" :max="90" hide-details 
          /></v-col>
          <v-col><v-number-input 
            v-model="settings.maximumAltLimit" suffix="&deg;" density="compact" :disabled="!settings.enableAltitudeLimits"
            :label="$t('mount.settings.maximumAltLimit')" :min="-90" :max="90" hide-details 
          /></v-col>
        </v-row>
        <v-checkbox
          v-model="settings.enableHaLimit" density="compact"
          :label="$t('mount.settings.enableHaLimits')" hide-details 
        />
        <v-number-input 
          v-model="settings.maximumHaLimit" density="compact" :disabled="!settings.enableHaLimit"
          :label="$t('mount.settings.maximumHaLimit')" :min="-2" :max="2" :step="0.1" :precision="1" hide-details 
        />
      </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <SearchObjects />
    <MoveAxis />
  </div>
</template>
<script setup>
import { hms, dms } from "@/util/coords.js";
</script>
<script>
import SkyMap from "./SkyMap.vue";
import SearchObjects from "./SearchObjects.vue";
import MoveAxis from "./MoveAxis.vue";
import LastNotification from "../../common/LastNotification.vue";
import { mapActions, mapGetters, mapState } from "vuex";
import { MOUNT_GET_ALL_SETTINGS, MOUNT_SET_ALL_SETTINGS } from "@/util/messageTypes.js";

export default {
  data: () => ({
    settings: {},
    modifiableOptions: [
      "executeMeridianFlip", "meridianFlipOffsetDegrees",
      "enableAltitudeLimits", "enableAltitudeLimitsTrackingOnly",
      "minimumAltLimit", "maximumAltLimit",
      "enableHaLimit", "maximumHaLimit"
    ],
    ignoreUpdates: false,
  }),
  components: {
    SkyMap,
    SearchObjects,
    MoveAxis,
    LastNotification,
  },
  watch: {
    settings: {
      deep: true,
      handler(v) {
        if (this.ignoreUpdates) return;
        let hasDiffVal = false;
        for (const k of Object.keys(v)) {
          if (this.mount.settings[k] !== v[k]) {
            hasDiffVal = true;
            break;
          }
        }
        if (!hasDiffVal) return;
        this.updateSettings(v);
      }
    },
    mount: {
      immediate: true,
      deep: true,
      handler(val) {
        if (!val?.settings) return;
        this.ignoreUpdates = true;
        for (const k of Object.keys(val.settings)) {
          if (
            this.modifiableOptions.includes(k)
            && (
              this.settings[k] === undefined
              || this.settings[k] === null
            )
          ) {
            this.settings[k] = val.settings[k];
          }
        }
        this.ignoreUpdates = false;
      }
    }
  },
  computed: {
    ...mapGetters([
      "mountPosition",
      "pierSide"
    ]),
    ...mapState([
      "mount"
    ]),
    trackingButtonText() {
      if (this.mount.status == "Idle") {
        return "Start Tracking";
      } else if (this.mount.status == "Tracking") {
        return "Stop Tracking";
      } else if (this.mount.status == "Parked") {
        return "Parked";
      } else {
        return "Moving";
      }
    },
    parkButtonText() {
      if (this.mount.status == "Parked") {
        return "Unpark";
      } else if (this.mount.status == "Parking") {
        return "Parking";
      } else {
        return "Park";
      }
    },
  },
  methods: {
    ...mapActions([
      'mountPark',
      'mountUnpark',
      'mountAbort',
      'mountSetTracking',
      'sendMsg'
    ]),
    updateSettings(settings) {
      const newSettings = {
        ...this.mount.settings,
        ...(settings ?? this.settings)
      };
      this.sendMsg([MOUNT_SET_ALL_SETTINGS, newSettings]);
      this.mount.settings = newSettings;
    },
    togglePark() {
      if (this.mount.status == "Parked") {
        this.mountUnpark();
      } else {
        this.mountPark();
      }
    },
    toggleTracking() {
      if (this.mount.status == "Idle") {
        this.mountSetTracking(true);
      } else if (this.mount.status == "Tracking") {
        this.mountSetTracking(false);
      }
    },
  },
  mounted() {
    this.sendMsg([MOUNT_GET_ALL_SETTINGS])
  }
};
</script>
