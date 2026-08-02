<template>
  <stel-switch 
    v-model="settings['nightMode']"
    :label="$t('stellarium.settings.enabled')"
  />
  <v-slider 
    v-model="settings['nightModeIntensity']"
    :min="1" :max="100" thumb-label="always"
    :label="$t('stellarium.settings.intensity')"
  />
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
      settings: s => s.stelStore.settings
    })
  },
}
</script>