<template>
<v-expansion-panel title="Client Settings">
<v-expansion-panel-text>
  <v-row density="compact">
    <v-col><v-number-input v-model="clientSettings.minPAError" hide-details :min="1" suffix="arcsec"
      label="Min PA Error"  
    /></v-col>
    <v-col><v-number-input v-model="clientSettings.defaultCamRotation" hide-details :min="-180" :max="180" suffix="deg"
      label="Def. Cam Rot."  
      /></v-col>
  </v-row>
  <v-row density="compact">
    <v-col><v-text-field v-model="clientSettings.stelQueryUrl" label="Stellarium Query Url" /></v-col>
  </v-row>
  <div style="justify-self: center;"><v-btn variant="outlined" width="150" @click.stop="saveSettings">Save</v-btn></div>
</v-expansion-panel-text>
</v-expansion-panel>
</template>
<script>
import { mapState, mapActions } from 'vuex';
import { CLIENT_SAVE_SETTINGS } from '@/util/messageTypes';

export default {
  computed: {
    ...mapState(["clientSettings"])
  },
  methods: {
    ...mapActions(["sendMsg"]),
    saveSettings() {
      this.sendMsg([CLIENT_SAVE_SETTINGS, this.clientSettings]);
    },
  }
}
</script>