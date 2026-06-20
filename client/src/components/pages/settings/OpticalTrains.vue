<template>
<!-- <v-expansion-panels variant="accordion" :rounded="[8, 0]" static> -->
<v-expansion-panel title="Module Trains">
  <v-expansion-panel-text>
    <v-row density="compact">
      <v-col><v-select
        v-model="moduleTrains.capture" :items="trains.trains"
        label="Capture" item-title="name" item-value="name" hide-details
      /></v-col>
      <v-col><v-select
        v-model="moduleTrains.focus" :items="trains.trains"
        label="Focus" item-title="name" item-value="name" hide-details
      /></v-col>
    </v-row>
    <v-row density="compact">
      <v-col><v-select
        v-model="moduleTrains.mount" :items="trains.trains"
        label="Mount" item-title="name" item-value="name" hide-details
      /></v-col>
      <v-col><v-select
        v-model="moduleTrains.guide" :items="trains.trains"
        label="Guide" item-title="name" item-value="name" hide-details
      /></v-col>
    </v-row>
    <v-row density="compact">
      <v-col><v-select
        v-model="moduleTrains.align" :items="trains.trains"
        label="Align" item-title="name" item-value="name" hide-details
      /></v-col>
      <v-col><v-select
        v-model="moduleTrains.darklibrary" :items="trains.trains"
        label="Dark Library" item-title="name" item-value="name" hide-details
      /></v-col>
    </v-row>
  </v-expansion-panel-text>
</v-expansion-panel>
<!-- </v-expansion-panels> -->
</template>
<script>
import { mapActions, mapState } from 'vuex';
import { OpticalTrains, TRAIN_GET_ALL, TRAIN_GET_PROFILES, TRAIN_SET } from '../../../util/messageTypes';

export default {
  data: () => ({
    moduleTrains: {},
    oldModuleTrains: {},
  }),
  computed: {
    ...mapState([
      "trains"
    ]),
    ...mapState({
      trainsProfiles: state => state.trains.profiles,
    })
  },
  mounted() {
    this.sendMsg([TRAIN_GET_ALL]);
    this.sendMsg([TRAIN_GET_PROFILES]);
  },
  watch: {
    trainsProfiles(val) {
      const updated = {};
      Object.keys(val).forEach(k => {
        updated[OpticalTrains[k]] = this.trains.trains.find(t => t.id === val[k])?.name;
      })
      this.moduleTrains = updated;
    },
    moduleTrains: {
      deep: true,
      handler(nv) {
        Object.keys(nv).forEach(k => {
          if (
            this.oldModuleTrains[k] !== undefined
            && nv[k] !== this.oldModuleTrains[k]
          ) {
            this.sendMsg([TRAIN_SET, { module: k, name: nv[k] }]);
          }
        });
        this.oldModuleTrains = JSON.parse(JSON.stringify(nv));
      }
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
  }
}
</script>