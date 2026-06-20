<template>
<v-expansion-panel title="Edit Trains">
<v-expansion-panel-text>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain" :items="trains" hide-details
    label="Optical Train" item-title="name" return-object
  /></v-col>
  <v-col class="d-flex align-center">
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;" 
      class="ml-4 mr-2" @click.stop="addTrain"
     ><v-icon icon="mdi-plus"/></v-btn>
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;" 
      :disabled="!currTrain" class="mr-2" @click.stop="deleteTrain"
    ><v-icon icon="mdi-close"/></v-btn>
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;"
      :disabled="!currTrain" @click.stop="resetTrain"
    ><v-icon icon="mdi-refresh"/></v-btn>
  </v-col>
</v-row>
<div class="mt-2" v-if="currTrain">
<v-row density="compact">
  <v-col><v-text-field
    v-model="currTrain.name"
    label="Name" hide-details
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain.mount" :items="items(INDIInterfaces.TELESCOPE_INTERFACE)"
    label="Mount" hide-details
  /></v-col>
  <v-col><v-select
    v-model="currTrain.scope" :items="scopes.map(s => s.name)"
    label="Scope/Lens" item-title="name" item-value="name" hide-details
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain.camera" :items="items(INDIInterfaces.CCD_INTERFACE)"
    label="Camera" hide-details
  /></v-col>
  <v-col><v-select
    v-model="currTrain.filterwheel" :items="items(INDIInterfaces.FILTER_INTERFACE)"
    label="Filter wheel" hide-details
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain.rotator" :items="items(INDIInterfaces.ROTATOR_INTERFACE)"
    label="Rotator" hide-details
  /></v-col>
  <v-col><v-select
    v-model="currTrain.focuser" :items="items(INDIInterfaces.FOCUSER_INTERFACE)"
    label="Focuser" hide-details
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain.guider" :items="items(INDIInterfaces.GUIDER_INTERFACE)"
    label="Guide via" hide-details
  /></v-col>
  <v-col><v-number-input
    v-model="currTrain.reducer" :step="0.1" :precision="2" :min="0.1" :max="10"
    label="Reducer/Barlow" hide-details
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currTrain.dustcap" :items="items(INDIInterfaces.DUSTCAP_INTERFACE)"
    label="Dust cap"
  /></v-col>
  <v-col><v-select
    v-model="currTrain.lightbox" :items="items(INDIInterfaces.LIGHTBOX_INTERFACE)"
    label="Light box"
  /></v-col>
</v-row>
<div style="justify-self: center;"><v-btn variant="outlined" width="150" @click.stop="saveTrain">Save</v-btn></div>
</div>
</v-expansion-panel-text>
</v-expansion-panel>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import { INDIInterfaces, TRAIN_ADD, TRAIN_DELETE, TRAIN_UPDATE } from '../../../util/messageTypes';

const blankTrain = {
  camera: "--",
  dustcap: "--",
  filterwheel: "--",
  focuser: "--",
  guider: "--",
  lightbox: "--",
  mount: "--",
  reducer: 1,
  rotator: "--",
  scope: "--"
};

export default {
  data: () => ({
    currTrain: null,
    INDIInterfaces: INDIInterfaces,
    awaitingTrainAdd: false,
  }),
  computed: {
    ...mapState([
      "interfaceDevices", "scopes"
    ]),
    ...mapState({
      trains: state => state.trains.trains,
    })
  },
  watch: {
    trains(v) {
      if (!this.awaitingTrainAdd) return;
      this.currTrain = v[v.length - 1];
      this.awaitingTrainAdd = false;
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    addTrain() {
      this.sendMsg([TRAIN_ADD, {
        ...blankTrain,
        name: (() => {
          const names = this.trains.map(t => t.name);
          const name = "New Train";
          let res = name;
          let nr = 1;
          while (names.includes(res))
            res = `${name} (${nr++})`;
          
          return res;
        })(),
      }]);
      this.awaitingTrainAdd = true;
    },
    deleteTrain() {
      this.sendMsg([TRAIN_DELETE, { name: this.currTrain.name}]);
      this.currTrain = null;
    },
    resetTrain() {
      this.currTrain = {
        ...this.currTrain,
        ...blankTrain
      };
      this.saveTrain();
    },
    saveTrain() {
      this.sendMsg([TRAIN_UPDATE, this.currTrain])
    },
    items(driverInterface) {
      const arr = this.interfaceDevices
       .filter(d => d['interface'] & driverInterface)
       .map(d => d['name']);
      arr.push("--");
      return arr;
    },
  },
}
</script>