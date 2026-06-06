<template>
  <div class="pa-2">
    <div class="text-headline-large">Settings</div>
    <v-divider class="mb-2"></v-divider>
    <v-list class="no-v-list-background">
      <v-list-item v-if="connection?.online"><v-btn @click="stopProfile" block>Stop Profile</v-btn></v-list-item>
      <v-list-item><v-btn class="redButton" @click="power('shutdown')" block>Shutdown</v-btn></v-list-item>
      <v-list-item><v-btn class="redButton" @click="power('reboot')" block>Reboot</v-btn></v-list-item>
    </v-list>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import { DAEMON, STOP_PROFILE } from '../../util/messageTypes';
export default {
  computed: {
    ...mapState(["connection"]),
  },
  methods: {
    ...mapActions(["sendMsg", "reset"]),
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