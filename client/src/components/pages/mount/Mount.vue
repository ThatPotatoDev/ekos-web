<template>
  <div class="pa-2">
    <div class="text-headline-large">Mount</div>
    <v-divider class="mb-2" />
    <div class="text-headline-small">{{ mount.status }}</div>
    <SkyMap :center="mountPosition" />
    <v-divider class="mb-2 mt-2" />
    <li>RA: {{ hms(mount.ra) ?? '?' }}</li>
    <li>DE: {{ dms(mount.de, true) ?? '?' }}</li>
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

export default {
  components: {
    SkyMap,
    SearchObjects,
    MoveAxis,
    LastNotification,
  },
  computed: {
    ...mapGetters([
      "mountPosition",
      "pierSide"
    ]),
    ...mapState([
      "mount",
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
    ]),
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
};
</script>
