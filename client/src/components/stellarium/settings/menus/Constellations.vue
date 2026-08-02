<template>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['constellations.lines_visible']"
    :label="$t('stellarium.settings.lines')"
  /></v-col>
  <v-col><stel-switch 
    v-model="sSettings['constellations.labels_visible']"
    :label="$t('stellarium.settings.labels')"
  /></v-col>
</v-row>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['constellations.images_visible']"
    :label="$t('stellarium.settings.drawings')"
  /></v-col>
  <v-col><stel-switch 
    v-model="sSettings['constellations.bounds_visible']"
    :label="$t('stellarium.settings.boundaries')"
  /></v-col>
</v-row>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['constellations.show_only_pointed']"
    :label="$t('stellarium.settings.centeredOnly')"
  /></v-col>
</v-row>

</template>
<script>
import { mapState } from 'vuex';
import StelSwitch from '../StelSwitch.vue';

export default {
  components: {
    StelSwitch
  },
  computed: {
    ...mapState({
      sSettings: s => s.stelStore.settings.stel
    })
  },
  methods: {
    resetSettings() {
      this.sSettings['constellations.lines_visible'] = false;
      this.sSettings['constellations.labels_visible'] = false;
      this.sSettings['constellations.images_visible'] = false;
      this.sSettings['constellations.bounds_visible'] = false;
      this.sSettings['constellations.show_only_pointed'] = true;
    }
  }
}
</script>
<style scoped>
.v-row {
  --v-col-gap-x: 3.1em;
}
.v-row + .v-row {
  --v-col-gap-y: 0px;
}
</style>