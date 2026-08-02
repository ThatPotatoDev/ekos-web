<template>
<div 
  class="main position-fixed d-flex stellarium-controls"
  style="left: 2vw;"
  :style="{bottom: `calc(${stelStore.lowerComponentHeight}px + 2vw)`}"
  v-click-outside="close"
>
  <div v-if="!isOpen">
    <v-btn
      icon 
      size="32"
      class="ma-2 pa-2"
      variant="text"
      @click="isOpen = true;"
    >
      <v-icon size="x-large" icon="mdi-cog" />
    </v-btn>
  </div>
  <div v-else-if="stelStore.currSettingMenu"
    class="pa-4 rounded-xl"
    style="background-color: rgba(40,40,40,0.8); width: calc(100vw - 4vw)"
  >
    <v-card flat color="transparent" :title="$t(`stellarium.settings.${stelStore.currSettingMenu.label}`)">
      <template v-slot:prepend>
        <v-btn icon variant="text" @click="stelStore.currSettingMenu = null">
          <v-icon size="x-large" icon="mdi-arrow-left" />
        </v-btn>
      </template>
      <v-card-text>
        <component :is="stelStore.currSettingMenu.component" />
      </v-card-text>
    </v-card>
  </div>
  <div v-else
    class="pa-4 rounded-xl"
    style="background-color: rgba(40,40,40,0.8)"
  >
    <v-row>
      <v-col><setting-button
        setting="lines.equatorial_jnow.visible"
        label="GridsAndLines"
        :menu="GridsAndLines"
        :img="IconEQGrid"
      /></v-col>
      <v-col><setting-button
        setting="constellations.lines_visible"
        :menu="Constellations"
        label="Constellations"
        :img="IconCstLines"
      /></v-col>
      <v-col><setting-button
        setting="landscapes.visible"
        label="Landscape"
        :img="IconLandscape"
      /></v-col>
    </v-row>
    <v-row>
      <v-col><setting-button
        setting="atmosphere.visible"
        label="Atmosphere"
        :img="IconAtmosphere"
      /></v-col>
      <v-col><setting-button 
        setting="stars.hints_visible"
        label="Labels"
        :img="IconLabels"
        :menu="Labels"
        :onChange="(v) => {
          const core = stelStore.stel.core;
          const modules = [
            'stars', 'dsos',
            'planets', 'minor_planets',
            'comets', 'satellites'
          ];
          modules.forEach(module => {
            core[module].hints_visible = v
          });
        }"
      /></v-col>
      <v-col>
        <setting-button
          :setting="stelStore.settings.nightMode"
          :isStelCore="false"
          label="NightMode"
          :menu="NightMode"
          :img="IconNightMode"
          :onChange="(v) => stelStore.settings.nightMode = v"
        />
      </v-col>
    </v-row>
  </div>
</div>
</template>
<script setup>
import Constellations from "./menus/Constellations.vue";
import GridsAndLines from "./menus/GridsAndLines.vue";

import Labels from "./menus/Labels.vue";
import NightMode from "./menus/NightMode.vue";

import IconEQGrid from '@/assets/svg/btn/equatorial-grid.svg'
import IconCstLines from '@/assets/svg/btn/cst-lines.svg'
import IconLandscape from '@/assets/svg/btn/landscape.svg'
import IconAtmosphere from '@/assets/svg/btn/atmosphere.svg'
import IconLabels from '@/assets/svg/btn/labels.svg'
import IconNightMode from '@/assets/svg/btn/night-mode.svg'
</script>
<script>
import { mapState } from "vuex";
import { computed } from "vue";
import SettingButton from "./SettingButton.vue"
import { set } from "../stelUtil";
import _ from "lodash";

export default {
  components: {
    SettingButton
  },
  data: () => ({
    isOpen: false
  }),
  mounted() {
    if (!this.stelStore.isStellariumReady) 
      return;
    this.registerChangeListener()
  },
  watch: {
    "stelStore.isStellariumReady"(v) {
      if (!v) return;
      this.registerChangeListener();

      const settings = this.stelStore.settings.stel;
      Object.keys(settings).forEach(k => {
        if (_.get(this.stelStore.stel.core, k) !== settings[k]) 
          set(this.stelStore.stel.core, k, settings[k]);
      });
    },
    "stelStore.settings.stel": {
      deep: true,
      handler(settings) {
        if (!this.stelStore.isStellariumReady) return;
        Object.keys(settings).forEach(k => {
          if (_.get(this.stelStore.stel.core, k) !== settings[k]) 
            set(this.stelStore.stel.core, k, settings[k]);
        });
      }
    }
  },
  computed: { ...mapState(["stelStore"]), },
  methods: {
    registerChangeListener() {
      this.stelStore.stel.change((obj, attr) => {
        if (!obj.path.startsWith("core.")) return;
        const path = obj.path.substring(5);
        if (
          path === ""
          || path.startsWith("observer")
          || attr === "fps" 
          || attr === "progressbars"
        ) return;
        this.stelStore.settings.stel[path+"."+attr] = obj[attr];
      }, "settings");
    },
    close() {
      this.isOpen = false;
      this.stelStore.currSettingMenu = null;
    }
  },
}
</script>
<style scoped>

.v-card :deep(.v-card-item) {
  padding-left: 0.5rem
}

.main {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.v-row + .v-row {
  --v-col-gap-y: 0px;
}
</style>