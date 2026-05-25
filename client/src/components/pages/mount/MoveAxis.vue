<!-- 'borrowed' from https://github.com/Touch-N-Stars/Touch-N-Stars/blob/ffa0de520c05843d633150144e5728695398f5b7/src/components/mount/moveAxis.vue -->
<template>
  <div class="move-axis-wrapper">
    <div class="move-axis-grid">
      <!-- Obere Reihe (Nord) -->
      <div></div>
      <button
        @mousedown="sendCommand('N')" 
        @mouseup="sendStop('N')" 
        @mouseleave="sendStop('N')"
        @touchstart.prevent="handleTouchStart('N', $event)" 
        @touchend.prevent="handleTouchEnd('N', $event)"
        @touchcancel.prevent="handleTouchEnd('N', $event)"
        @blur="sendStop('N')" 
        @contextmenu.prevent 
        class="btn"
        :class="{glowGreen: pressedDirs.indexOf('N') !== -1}"
      >
        <ArrowUpCircleLineIcon
          :class="pressedDirs.indexOf('N') !== -1 ? 'text-green-500' : 'text-gray-400'"
          class="move-axis-icon" 
        />
      </button>
      <div></div>

      <button 
        @mousedown="sendCommand('W')" 
        @mouseup="sendStop('W')" 
        @mouseleave="sendStop('W')"
        @touchstart.prevent="handleTouchStart('W', $event)" 
        @touchend.prevent="handleTouchEnd('W', $event)"
        @touchcancel.prevent="handleTouchEnd('W', $event)" 
        @blur="sendStop('W')" 
        @contextmenu.prevent 
        class="btn"
        :class="{glowGreen: pressedDirs.indexOf('W') !== -1}"
      >
        <ArrowLeftCircleLineIcon
          :class="pressedDirs.indexOf('W') !== -1 ? 'text-green-500' : 'text-gray-400'"
          class="move-axis-icon" 
        />
      </button>

      <button 
        @click="sendStop('')" 
        class="btn btn-stop">
        <StopCircleLineIcon
          class="move-axis-icon"
          :class="pressedDirs.length === 0 ? 'text-red-500' : 'text-gray-400'" />
      </button>

      <button 
        @mousedown="sendCommand('E')" 
        @mouseup="sendStop('E')" 
        @mouseleave="sendStop('E')"
        @touchstart.prevent="handleTouchStart('E', $event)" 
        @touchend.prevent="handleTouchEnd('E', $event)"
        @touchcancel.prevent="handleTouchEnd('E', $event)" 
        @blur="sendStop('E')" 
        @contextmenu.prevent 
        class="btn"
        :class="{glowGreen: pressedDirs.indexOf('E') !== -1}"
      >
        <ArrowRightCircleLineIcon
          :class="pressedDirs.indexOf('E') !== -1 ? 'text-green-500' : 'text-gray-400'"
          class="move-axis-icon" 
        />
      </button>

      <div></div>
      <button 
        @mousedown="sendCommand('S')" 
        @mouseup="sendStop('S')"
        @mouseleave="sendStop('S')"
        @touchstart.prevent="handleTouchStart('S', $event)" 
        @touchend.prevent="handleTouchEnd('S', $event)"
        @touchcancel.prevent="handleTouchEnd('S', $event)" 
        @blur="sendStop('S')"
        @contextmenu.prevent 
        class="btn"
        :class="{glowGreen: pressedDirs.indexOf('S') !== -1}"
      >
        <ArrowDownCircleLineIcon
          :class="pressedDirs.indexOf('S') !== -1 ? 'text-green-500' : 'text-gray-400'"
          class="move-axis-icon" 
        />
      </button>
    </div>
    <div class="control-panel">
      <!-- <SetSlewRate /> -->
    </div>
  </div>
</template>
<script>
import ArrowUpCircleLineIcon from '@iconify-vue/mingcute/arrow-up-circle-line';
import ArrowRightCircleLineIcon from '@iconify-vue/mingcute/arrow-right-circle-line';
import ArrowLeftCircleLineIcon from '@iconify-vue/mingcute/arrow-left-circle-line';
import ArrowDownCircleLineIcon from '@iconify-vue/mingcute/arrow-down-circle-line';
import StopCircleLineIcon from '@iconify-vue/mingcute/stop-circle-line';

import { Icon, addIcon } from '@iconify/vue';
import { mapActions, mapGetters, mapState } from "vuex";
import { MOUNT_SET_MOTION, MOUNT_ABORT } from '../../../util/messageTypes';

let debug = false;

export default {
  components: {
    StopCircleLineIcon, 
    ArrowUpCircleLineIcon, ArrowRightCircleLineIcon,
    ArrowLeftCircleLineIcon, ArrowDownCircleLineIcon,
    IconifyIcon: Icon,
  },
  data() {
    return {
      failsafeTimeout: null,
      pressedDirs: [],
    };
  },
  mounted() {
    const handleGlobalStop = () => {
      if (this.pressedDirs.length !== 0) {
        console.log('Global emergency stop triggered');
        this.sendStop();
      }
    };

    document.addEventListener('visibilitychange', handleGlobalStop);
    window.addEventListener('blur', handleGlobalStop);
    window.addEventListener('pagehide', handleGlobalStop);
  },
  beforeUnmount() {
    if (this.pressedDirs.length !== 0) {
      this.sendStop();
    }
    // Cleanup
    this.clearCommandInterval();
    if (this.failsafeTimeout) {
      clearTimeout(this.failsafeTimeout);
      this.failsafeTimeout = null;
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    sendCommand(dir) {
      this.pressedDirs.push(dir)
      
      if (debug) console.log("message sent", dir);
      this.sendMsg([MOUNT_SET_MOTION, { direction: dir, action: true }]);

      if (this.failsafeTimeout) {
        clearTimeout(this.failsafeTimeout);
      }
      this.failsafeTimeout = setTimeout(() => {
        console.log('FAILSAFE: Automatischer Stop nach 30s');
        this.sendStop();
      }, 30000);
    },
    handleTouchStart(dir, event) {
      if (debug) console.log('handleTouchStart:', dir);
      event.preventDefault();
      event.stopPropagation();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      this.sendCommand(dir);

    },
    handleTouchEnd(dir, event) {
      if (debug) console.log('handleTouchEnd');
      event.preventDefault();
      event.stopPropagation();
      this.sendStop(dir);
    },
    sendStop(dir = '') {
      if (debug) console.log('sendStop called', dir);
      let dirsToStop = [];
      if (dir === '') {
        dirsToStop.push("N", "E", "W", "S");
      } else {
        dirsToStop.push(dir);
      }

      if (this.failsafeTimeout) {
        clearTimeout(this.failsafeTimeout);
        this.failsafeTimeout = null;
        if (debug) console.log('Failsafe timeout cleared');
      }

      if (debug) console.log('stop commands sent:', dirsToStop);
      for (let i = 0; i < dirsToStop.length; i++) {
        let d = dirsToStop[i];
        // if (this.pressedDirs.indexOf(d) === -1) {
        //   if (debug) console.log('No previous command to stop.');
        //   continue;
        // }
        // send anyway in case motion is set by external source
        if (dir === '') this.sendMsg([MOUNT_ABORT]); // stop button should be all powerful
        this.sendMsg([MOUNT_SET_MOTION, { direction: d, action: false }]);
        let index = this.pressedDirs.indexOf(d);
        if (index !== -1) {
          this.pressedDirs.splice(index, 1);
        }
      }
    }
  },
};
</script>
<style scoped>

.move-axis-wrapper {
  position: relative;
  width: 100%;
}

.move-axis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  width: 16rem;
  margin: 0 auto;
  padding: 1rem;

  place-items: center;

  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  touch-action: manipulation;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 4rem;
  height: 4rem;

  border: 1px solid #0a0a0a;
  border-radius: 1rem;

  background: #334155;
  color: #9ca3af;

  cursor: pointer;

  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.7);

  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
}

.btn:hover { background: #475569; }
.btn:active { transform: scale(0.96); }

.move-axis-icon {
  width: 3rem;
  height: 3rem;
}

.control-panel {
  display: flex;
  flex-direction: column;

  width: 100%;

  margin-top: 0.5rem;
  padding: 0.5rem;
  gap: 0.5rem;

  border: 1px solid #d1d5db;
  border-radius: 1rem;

  background: rgba(17, 24, 39, 0.8);
}

.glowGreen {
  box-shadow:
    0 0 10px #00ff00,
    0 0 20px rgba(0, 255, 0, 0.4);
}

/* Mobile */
@media (max-width: 640px) {
  .move-axis-grid {
    width: 12rem;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .btn {
    width: 3rem;
    height: 3rem;
    padding: 0.25rem;
  }

  .move-axis-icon {
    width: 2rem;
    height: 2rem;
  }
}

/* Landscape mode */
@media screen and (orientation: landscape) {
  .move-axis-grid {
    width: 12rem;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .btn {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.25rem;
  }

  .move-axis-icon {
    width: 2rem;
    height: 2rem;
  }
}
.text-gray-400 { color: #9ca3af; }
.text-green-500 { color: #22c55e; }
.text-red-500 { color: #ef4444; }
</style>