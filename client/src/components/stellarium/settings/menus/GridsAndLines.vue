<template>
  <v-row>
    <v-col><stel-switch 
      v-model="sSettings['lines.azimuthal.visible']"
      :label="$t('stellarium.settings.azimuthal')"
    /></v-col>
    <v-col><stel-switch 
      v-model="sSettings['lines.equatorial_jnow.visible']"
      :label="$t('stellarium.settings.equatorial_jnow')"
    /></v-col>
  </v-row>
  <v-row>
    <v-col><stel-switch 
      v-model="sSettings['lines.meridian.visible']"
      :label="$t('stellarium.settings.meridian')"
    /></v-col>
    <v-col><stel-switch 
      v-model="sSettings['lines.ecliptic.visible']"
      :label="$t('stellarium.settings.ecliptic')"
    /></v-col>
  </v-row>
  <v-row>
    <v-col><stel-switch 
      v-model="sSettings['lines.equator_line.visible']"
      :label="$t('stellarium.settings.equator')"
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
      this.sSettings['lines.azimuthal.visible'] = false;
      this.sSettings['lines.equatorial_jnow.visible'] = false;
      this.sSettings['lines.meridian.visible'] = false;
      this.sSettings['clines.ecliptic.visible'] = false;
      this.sSettings['clines.equator_line.visible'] = true;
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