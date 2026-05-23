<!-- 'borrowed' from https://github.com/Touch-N-Stars/Touch-N-Stars/blob/ffa0de520c05843d633150144e5728695398f5b7/src/components/mount/moveAxis.vue -->
<template>
  <div class="relative">
    <div class="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-4 place-items-center w-48 sm:w-64 mx-auto move-axis-grid">
      <!-- Obere Reihe (Nord) -->
      <div></div>
      <button 
        @mousedown="sendCommand('N')" 
        @mouseup="sendStop" 
        @mouseleave="sendStop"
        @touchstart.prevent="handleTouchStart('N', $event)" 
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd" @blur="sendStop" 
        @contextmenu.prevent class="btn"
        :class="lastDirection === 'N' ? 'glow-green' : ''"
      >
        <!-- <ArrowUpCircleIcon  -->
        <iconify-icon icon="arrow-up-circle"
          :class="lastDirection === 'N' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon" 
        />
      </button>
      <div></div>

      <!-- Mittlere Reihe (West, Stop, Ost) -->
      <button 
        @mousedown="sendCommand('W')" 
        @mouseup="sendStop('E')" 
        @mouseleave="sendStop('E')"
        @touchstart.prevent="handleTouchStart('W', $event)" 
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd" 
        @blur="sendStop('E')" 
        @contextmenu.prevent class="btn"
        :class="lastDirection === 'W' ? 'glow-green' : ''"
      >
        <!-- <ArrowLeftCircleIcon  -->
        <iconify-icon icon="arrow-left-circle"
          :class="lastDirection === 'W' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon" 
        />
      </button>
      <button @click="sendStop" class="btn btn-stop">
        <!-- <StopCircleIcon  -->
        <iconify-icon icon="stop-circle"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
          :class="lastDirection === '' ? 'text-red-500' : 'text-gray-400'" />
      </button>
      <button 
        @mousedown="sendCommand('East')" 
        @mouseup="sendStop('East')" 
        @mouseleave="sendStop('East')"
        @touchstart.prevent="handleTouchStart('E', $event)" 
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd" 
        @blur="sendStop('blurEast')" 
        @contextmenu.prevent class="btn"
        :class="lastDirection === 'E' ? 'glow-green' : ''"
      >
        <!-- <ArrowRightCircleIcon  -->
        <iconify-icon icon="arrow-right-circle"
          :class="lastDirection === 'E' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon" 
        />
      </button>

      <div></div>
      <button 
        @mousedown="sendCommand('S')" 
        @mouseup="sendStop('S')"
        @mouseleave="sendStop('S')"
        @touchstart.prevent="handleTouchStart('S', $event)" 
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd" 
        @blur="sendStop('S')"
        @contextmenu.prevent class="btn"
        :class="{glowGreen: lastDirection === 'S'}"
      >
        <!-- <ArrowDownCircleIcon  -->
        <iconify-icon icon="arrow-down-circle"
          :class="lastDirection === 'S' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon" 
        />
      </button>
    </div>
     <div
      class="flex flex-col bg-gray-900/80 w-full border border-gray-300 p-1 sm:p-2 mt-1 rounded-xl gap-1"
    >
      <SetSlewRate v-if="!store.isPINS" />
      <setSlewRatePins v-else />
    </div>
  </div>
</template>
<script>
import arrowUpCircle from "@iconify/icons-mdi/arrow-up-circle"
import arrowLeftCircle from "@iconify/icons-mdi/arrow-left-circle"
import arrowRightCircle from "@iconify/icons-mdi/arrow-right-circle"
import arrowDownCircle from "@iconify/icons-mdi/arrow-down-circle"
import stopCircle from "@iconify/icons-mdi/stop-circle"

import { Icon, addIcon } from '@iconify/vue';
import { mapActions, mapGetters, mapState } from "vuex";
import { MOUNT_SET_MOTION } from '../../util/messageTypes';

addIcon("arrow-up-circle", arrowUpCircle);
addIcon("arrow-left-circle", arrowLeftCircle);
addIcon("arrow-right-circle", arrowRightCircle);
addIcon("arrow-down-circle", arrowDownCircle);
addIcon("stop-circle", stopCircle);


export default {
  components: {
    IconifyIcon: Icon,
  },
  data() {
    return {
      commandInterval: null,
      failsafeTimeout: null,
      lastDirection: "",
    };
  },
  computed: {
    // ...mapState([
    //   "sendMsg", //"mount"
    // ]),
  },
  mounted() {
    const handleGlobalStop = () => {
      if (this.lastDirection) {
        console.log('Global emergency stop triggered');
        this.sendStop();
      }
    };

    document.addEventListener('visibilitychange', handleGlobalStop);
    window.addEventListener('blur', handleGlobalStop);
    window.addEventListener('pagehide', handleGlobalStop);
  },
  beforeUnmount() {
    if (this.lastDirection) {
      sendStop('unmount');
    }
    // Cleanup
    if (this.commandInterval) {
      clearInterval(this.commandInterval);
      this.commandInterval = null;
    }
    if (this.failsafeTimeout) {
      clearTimeout(this.failsafeTimeout);
      this.failsafeTimeout = null;
    }

    this.lastDirection = '';
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    
    sendCommand(direction) {
      if (this.commandInterval) {
        clearInterval(this.commandInterval);
        this.commandInterval = null;
      }

      this.lastDirection = direction;

      const sendMessage = () => {
        this.sendMsg([MOUNT_SET_MOTION, { direction: direction, action: true }]);
      };
      sendMessage();
      this.commandInterval = setInterval(this.sendMessage, 800);

      if (this.failsafeTimeout) {
        clearTimeout(this.failsafeTimeout);
      }
      this.failsafeTimeout = setTimeout(() => {
        console.log('FAILSAFE: Automatischer Stop nach 30s');
        this.sendStop();
      }, 30000);
    },
    handleTouchStart(direction, event) {

      console.log('handleTouchStart:', direction);
      event.preventDefault();
      event.stopPropagation();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      sendCommand(direction);

    },
    handleTouchEnd() {
      console.log('handleTouchEnd');
      event.preventDefault();
      event.stopPropagation();
      this.sendStop();
    },
    sendStop() {
      this.sendStop('empty');
    },
    sendStop(s) {
      console.log('sendStop called', s);

      if (!this.lastDirection) {
        console.log('No previous command to stop.');
        return;
      }
      if (this.commandInterval) {
        clearInterval(this.commandInterval);
        this.commandInterval = null;
        console.log('Command interval cleared');
      }
      if (this.failsafeTimeout) {
        clearTimeout(this.failsafeTimeout);
        this.failsafeTimeout = null;
        console.log('Failsafe timeout cleared');
      }

      this.sendMsg([MOUNT_SET_MOTION, { direction: this.lastDirection, action: false }])
      console.log('stop command sent:');
      this.lastDirection = '';
    }
  },
};
</script>
<style scoped>
.move-axis-grid {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.btn {
  border-radius: 1rem;
  background-color: #334155;
  padding: 0.5rem;
  box-shadow: 0 2px 15px black;
  border: 1px solid #0a0a0a;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 3rem;
  min-height: 3rem;
}

@media (min-width: 640px) {
  .btn {
    padding: 0.75rem;
    min-width: 4rem;
    min-height: 4rem;
  }
}

/* Landscape-Modus Anpassungen */
@media screen and (orientation: landscape) {
  .move-axis-grid {
    width: 12rem;
    /* w-48 */
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .move-axis-icon {
    width: 2rem;
    /* w-8 */
    height: 2rem;
    /* h-8 */
  }

  .btn {
    padding: 0.375rem;
    min-width: 2.5rem;
    min-height: 2.5rem;
  }
}

.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
.glowGreen {
  box-shadow: 0 0 10px #00ff00;
}

.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0);
  /* Roter Schein */
}
</style>