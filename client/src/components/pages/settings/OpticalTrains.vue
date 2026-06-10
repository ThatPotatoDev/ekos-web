<template>
  <v-expansion-panels :rounded="[8, 0]" static>
    <v-expansion-panel title="Optical Trains">
      <v-expansion-panel-text>
        <v-row density="compact">
          <v-col>
            <v-select
              v-model="moduleTrains.capture" :items="trains.trains"
              label="Capture" item-title="name" item-value="name" hide-details
            />
          </v-col>
          <v-col>
            <v-select
              v-model="moduleTrains.focus" :items="trains.trains"
              label="Focus" item-title="name" item-value="name" hide-details
            />
          </v-col>
        </v-row>
        <v-row density="compact">
          <v-col>
            <v-select
              v-model="moduleTrains.mount" :items="trains.trains"
              label="Mount" item-title="name" item-value="name" hide-details
            />
          </v-col>
          <v-col>
            <v-select
              v-model="moduleTrains.guide" :items="trains.trains"
              label="Guide" item-title="name" item-value="name" hide-details
            />
          </v-col>
        </v-row>
        <v-row density="compact">
          <v-col>
            <v-select
              v-model="moduleTrains.align" :items="trains.trains"
              label="Align" item-title="name" item-value="name" hide-details
            />
          </v-col>
          <v-col>

          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import { OpticalTrains, TRAIN_GET_PROFILES, TRAIN_SET } from '../../../util/messageTypes';

export default {
  data: () => ({
    moduleTrains: {},
  }),
  computed: {
    ...mapState([
      "trains"
    ]),
    ...mapState({
      trainsProfiles: state => state.trains.profiles,
    }),
    moduleTrainsSnapshot() {
      return JSON.stringify(this.moduleTrains);
    }
  },
  mounted() {
    this.sendMsg([TRAIN_GET_PROFILES]);
  },
  watch: {
    trainsProfiles(val) {
      Object.keys(val).forEach(k => {
        this.moduleTrains[OpticalTrains[k]] = this.trains.trains.find(t => t.id === val[k])?.name;
      })
    },
    moduleTrainsSnapshot(nv, ov) {
      const newObj = JSON.parse(nv);
      const oldObj = ov ? JSON.parse(ov) : {};

      Object.keys(newObj).forEach(k => {
        if (newObj[k] !== oldObj[k]) {
          console.log(newObj[k]);
          this.sendMsg([TRAIN_SET, { module: k, name: newObj[k] }]);
        } else console.log(oldObj, newObj, k);
      });
    }

  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
  }
}
</script>