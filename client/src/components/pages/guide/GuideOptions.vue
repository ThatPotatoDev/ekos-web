<template>
<v-expansion-panels :rounded="[8, 0]" static>
<v-expansion-panel title="Options">
<v-expansion-panel-text>
<v-expansion-panels :rounded="[8, 0]" variant="accordion" static>
  <v-expansion-panel title="Guide">

  </v-expansion-panel>
  <v-expansion-panel title="Calibration">

  </v-expansion-panel>
  <v-expansion-panel title="Dither">
  <v-expansion-panel-text>
    <v-row density="compact" class="mb-2">
      <v-col cols="4">
        <v-checkbox
          label="Dither" v-model="settings.kcfg_DitherEnabled" hide-details
        />
      </v-col>
      <v-col>
        <v-number-input
          v-model="settings.kcfg_DitherPixels" hide-details 
          :min="0.1" :max="30" :step="0.1" :precision="1" suffix="pixels" 
        />
      </v-col>
    </v-row>
    <v-number-input
      label="Frequency" v-model="settings.kcfg_DitherFrames" 
      :min="1" :max="60" suffix="frames" hide-details class="mb-2"
    />
    <v-number-input
      label="PHD2 Dither Threshold" v-model="settings.kcfg_DitherThreshold"
      :disabled="profiles.profiles[profiles.selectedProfileIndex].guiding !== GuiderType.GUIDE_PHD2"
      :min="1" :max="50" suffix="pixels" hide-details class="mb-2"
    />
    <v-number-input
      label="Settle" v-model="settings.kcfg_DitherSettle"
      :min="0" :max="360" suffix="seconds" hide-details class="mb-2"
    />
    <v-number-input
      label="PHD2 Dither Timeout" v-model="settings.kcfg_DitherTimeout"
      :disabled="profiles.profiles[profiles.selectedProfileIndex].guiding !== GuiderType.GUIDE_PHD2"
      :min="0" :max="360" suffix="seconds" hide-details class="mb-2"
    />
  </v-expansion-panel-text>
  </v-expansion-panel>
  <v-expansion-panel title="GPG RA Guider">

  </v-expansion-panel>
</v-expansion-panels>
</v-expansion-panel-text>
</v-expansion-panel>
</v-expansion-panels>
</template>
<script setup>
import { GuiderType } from '@/util/messageTypes';
</script>
<script>
import { mapState } from 'vuex';
export default {
  data: () => ({
    settings: {}
  }),
  computed: {
    ...mapState([
      "profiles"
    ]),
    ...mapState({
      guideSettings: state => state.guide.settings,
    })
  },
  watch: {
    guideSettings: {
      immediate: true,
      handler(v) {
        this.settings = v;
      }
    }
  }
}
</script>