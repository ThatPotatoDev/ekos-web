<template>
  <v-app id="app">
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Ekos Web</v-toolbar-title>
      <v-icon icon="mdi-cloud" height="24" class="mr-2" :class="socket.isConnected ? 'greenFilledIn' : 'redFilledIn'"/>
      <v-icon icon="mdi-laptop" height="24" class="mr-2" :class="connected ? 'greenFilledIn' : 'redFilledIn'"/>
      <v-icon icon="mdi-telescope" height="24" class="mr-2" :class="connection?.online ? ekosStartedClass : 'redFilledIn'"/>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" app>
      <v-list dense>
        <v-list-item link exact :to="{name: r.name}" v-for="r in routes" :key="r.name">
          <v-list-item-action>
            <v-icon :icon="r.icon" height="24" />
          </v-list-item-action>
          <v-list-item-title>{{r.label || r.name}}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <template v-if="connection?.online || $route.path === '/settings'">
        <router-view :key="$route.fullPath" />
      </template>
      <div v-else class="pa-2">
        <v-select v-model="profiles.selectedProfile" :items="profiles.profiles.map(p => p.name)" label="Profile" item-text="name" item-value="name" />
        <v-btn @click.stop="startProfileClicked">Start Profile</v-btn>
      </div>
    </v-main>
  </v-app>
</template>
<script>
import { routes } from "@/util/routes";
import { mapActions, mapState } from "vuex";
import { START_PROFILE, IndiStatus } from "./util/messageTypes";

export default {
  computed: {
    ...mapState(["connection", "indiStatus", "socket", "profiles"]),
    connected() {
      return this.connection?.connected;
    },
    ekosStartedClass() {
      switch (this.indiStatus) {
        case IndiStatus.Idle:
        case IndiStatus.Pending: {
          return "orangeFilledIn";
        }
        case IndiStatus.Success: {
          return "greenFilledIn";
        }
        case IndiStatus.Error: {
          return "redFilledIn"
        }
      }
    },
  },
  data: () => ({
    drawer: null,
    routes: routes,
  }),
  methods: {
    ...mapActions(["sendMsg", "findDeviceDetails"]),
    startProfileClicked() {
      this.sendMsg([START_PROFILE, {name: this.profiles.selectedProfile} ])
      this.findDeviceDetails();
    }
  }
};
</script>
