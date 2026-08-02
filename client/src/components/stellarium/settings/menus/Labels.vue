<template>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['stars.hints_visible']"
    :label="$t('stellarium.settings.stars')"
  /></v-col>
  <v-col><stel-switch 
    v-model="sSettings['dsos.hints_visible']"
    :label="$t('stellarium.settings.dsos')"
  /></v-col>
</v-row>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['planets.hints_visible']"
    :label="$t('stellarium.settings.planets')"
  /></v-col>
  <v-col><stel-switch 
    v-model="sSettings['minor_planets.hints_visible']"
    :label="$t('stellarium.settings.minor_planets')"
  /></v-col>
</v-row>
<v-row>
  <v-col><stel-switch 
    v-model="sSettings['comets.hints_visible']"
    :label="$t('stellarium.settings.comets')"
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