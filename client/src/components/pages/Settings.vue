<template>
  <div class="pa-2">
    <div class="text-headline-large">Settings</div>
    <v-divider class="mb-2"></v-divider>
    <OpticalTrains v-if="connection?.online" class="mb-3" />
    <v-row density="compact">
      <v-col><v-number-input v-model="clientSettings.minPAError" label="Min PA Error" :min="1" suffix="arcsec" /></v-col>
      <v-col></v-col>
    </v-row>
    <v-list class="no-v-list-background">
      <v-list-item><v-btn @click="saveSettings" block>Save Settings</v-btn></v-list-item>
    </v-list>
    <v-list class="no-v-list-background">
      <v-list-item v-if="connection?.online"><v-btn @click="stopProfile" block>Stop Profile</v-btn></v-list-item>
      <v-list-item><v-btn class="redButton" @click="power('shutdown')" block>Shutdown</v-btn></v-list-item>
      <v-list-item><v-btn class="redButton" @click="power('reboot')" block>Reboot</v-btn></v-list-item>
    </v-list>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import { CLIENT_SAVE_SETTINGS, DAEMON, STOP_PROFILE } from '../../util/messageTypes';
import OpticalTrains from './settings/OpticalTrains.vue';
export default {
  components: {
    OpticalTrains
  },
  computed: {
    ...mapState([
      "connection", "clientSettings"
    ]),
  },
  methods: {
    ...mapActions(["sendMsg", "reset"]),
    saveSettings() {
      this.sendMsg([CLIENT_SAVE_SETTINGS, this.clientSettings]);
    },
    stopProfile() {
      this.sendMsg([STOP_PROFILE]);
    },
    power(action) {
      this.reset();
      this.sendMsg([DAEMON, { type: "power", action: action }])
    }
  },
}
</script>
<style scoped>
.redButton {
  background: rgba(186, 32, 32, 0.8)
}
</style>