<template>
<div class="d-flex flex-column align-center justify-center">
  <v-btn
    icon
    variant="text"
    width="4.25em"
    height="4.25em"
    @pointerdown="startHold"
    @click="!menu && click()"
    @pointerup="stopHold"
    @pointerleave="stopHold"
  >
    <v-progress-circular
      :model-value="progress"
      :rotate="180"
      size="53"
      width="3.5"
      class="position-absolute long-press"
      style="pointer-events: none;"
    />
    <img draggable="false"
      :src="img"
      width="40em"
      height="40em"
      :style="{filter: currVal ? 'opacity(1)' : 'opacity(0.5)'}"
    />
  </v-btn>
  <span class="text-label-tiny label mb-1 font-weight-light text-white">{{ $t(`stellarium.settings.${label}`) }}</span>
</div>
</template>
<script>
import { mapState } from "vuex";
import _ from "lodash";
import { set } from "../stelUtil";
import { markRaw } from 'vue'

export default {
  data: () => ({
    currVal: null,
    progress: 0,
    startTime: null,
    transitionDuration: '500ms'    
  }),
  props: {
    img: String,
    label: String,
    setting: String | Boolean,
    menu: Object,
    isStelCore: {
      type: Boolean,
      required: false,
      default: true
    },
    onChange: {
      type: Function,
      required: false,
      default: null
    }
  },
  computed: {
    ...mapState([
      "stelStore"
    ]),
    // for resetSettings on menu
    ...mapState({
      settings: s => s.stelStore.settings,
      sSettings: s => s.stelStore.settings.stel
    })
  },
  mounted() {
    if (this.isStelCore) this.currVal = _.get(this.stelStore.stel.core, this.setting);
    else this.currVal = this.setting;
  },
  methods: {
    click() {
      this.currVal = !this.currVal;
      if (this.currVal === false 
        && this.menu 
        && this.menu.methods?.resetSettings
      ) {
        this.menu.methods.resetSettings.call(this);
        return;
      }
      if (this.onChange !== null) {
        this.onChange(this.currVal);
        return;
      }
      // lodash doesnt work here for some reason
      set(this.stelStore.stel.core, this.setting, this.currVal);
    },

    startHold(e) {
      if (!this.menu) return;
      this.hasTriggeredLongPress = false;
      this.transitionDuration = '500ms';
      this.progress = 100;
      this.holdTimer = setTimeout(() => {
        this.hasTriggeredLongPress = true;
        this.progress = 0;
        this.stelStore.currSettingMenu = {
          label: this.label,
          component: markRaw(this.menu)
        };
      }, 500);
    },
    stopHold() {
      if (!this.menu) return;
      if (!this.holdTimer) return;
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
      this.transitionDuration = '250ms';
      this.progress = 0;
      if (!this.hasTriggeredLongPress) {
        this.click();
      }
    },
  }
}
</script>
<style scoped>

.long-press :deep(.v-progress-circular__underlay) {
  opacity: 0 !important;
}
.long-press :deep(.v-progress-circular__overlay) {
  /* transition: all v-bind(transitionDuration) linear, stroke-width 0s !important; */
  transition: all v-bind(transitionDuration) ease-in-out, stroke-width 0s !important;
}

.label {
  white-space: nowrap;
  overflow: visible;
}

.text-label-tiny {
  font-size: 0.5625rem;
  /* font-weight: 500; */
  line-height: 0.8125rem;
  letter-spacing: 0.025rem;
}

</style>