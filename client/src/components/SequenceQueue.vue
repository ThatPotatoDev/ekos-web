<template>
  <v-list class="noBackgroundFr">
      <v-list-item>
        <v-btn block @click="addOrRemQueue" :disabled="!canModifyQueue()">{{addOrRemQueueText}}</v-btn>
      </v-list-item>
    </v-list>
  <fieldset class="sequence-box">
    <legend>Sequence Queue</legend>

    <div class="toolbar">
      <button class="icon-btn" :disabled="!canModifyQueue()" title="Add job to sequence queue" @click="addOrRemQueue">
        +
      </button>

      <button class="icon-btn" :disabled="selectedRow === null" title="Remove job from sequence queue" @click="addOrRemQueue">
        -
      </button>

      <div class="spacer"></div>

      <button class="icon-btn" :disabled="sequenceQueue.length === 0" title="Clear sequence queue" @click="clearQueue">
        ⟳
      </button>

      <div class="spacer large"></div>

      <button class="icon-btn" title="Load Capture Sequence from File..." @click="loadQueue">
        📂
      </button>

      <button class="icon-btn" :disabled="sequenceQueue.length === 0" title="Save Capture Sequence..." @click="saveQueue">
        💾
      </button>

      <button class="icon-btn" :disabled="sequenceQueue.length === 0" title="Save Capture Sequence As..." @click="saveQueueAs">
        📄
      </button>
    </div>

    <div class="table-wrapper">
      <table class="queue-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Filter</th>
            <th>Count</th>
            <th>Exp</th>
            <th>Type</th>
            <th>Bin</th>
            <th>ISO/Gain</th>
            <th>Offset</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in sequenceQueue" :key="index" :class="{ selected: selectedRow === index }"
            @click="selectedRow = index">
            <td>{{ item.Status }}</td>
            <td>{{ item.Filter }}</td>
            <td>{{ item.Count }}</td>
            <td>{{ item.Exp }}</td>
            <td>{{ item.Type }}</td>
            <td>{{ item.Bin }}</td>
            <td>{{ item["ISO/Gain"] }}</td>
            <td>{{ item.Offset }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </fieldset>
</template>
<script>
import { mapActions, mapState } from "vuex";
import { CAPTURE_ADD_SEQUENCE, CAPTURE_GET_SEQUENCES, CAPTURE_REMOVE_SEQUENCE } from '../util/messageTypes';

export default {
  data() {
    return {
      selectedRow: null,
    };
  },
  computed: {
    ...mapState([
      "sequenceQueue",
      "capture"
    ]),
    addOrRemQueueText() {
      if (this.selectedRow === null) {
        return "Add job to sequence queue";
      } else {
        return "Remove job from sequence queue";
      }
    },
  },
  mount() {
    this.sendMsg([CAPTURE_GET_SEQUENCES]);
  },
  methods: {
    ...mapActions([
      "sendMsg",
      "captureUpdateSettings"
    ]),
    canModifyQueue() {
      if (
        this.capture.status === "Idle" ||
        this.capture.status === "Complete"
      ) {
        return true;
      }

      return false;
    },
    addOrRemQueue() {
      if (this.selectedRow === null) {
        this.captureUpdateSettings();
        this.sendMsg([CAPTURE_ADD_SEQUENCE]);
      } else {
        this.sendMsg([CAPTURE_REMOVE_SEQUENCE, { index: this.selectedRow }]);
        this.selectedRow = null;
        this.sendMsg([CAPTURE_GET_SEQUENCES]);
      }
    },
    clearQueue() {
      this.selectedRow = null;
      for (const i in this.sequenceQueue) {
        this.sendMsg([CAPTURE_REMOVE_SEQUENCE, { index: i }]);
      }
    },
    loadQueue() {
      console.log('Load queue')
    },
    saveQueue() {
      console.log('Save queue')
    },
    saveQueueAs() {
      console.log('Save queue as')
    },
  },
};

</script>
<style scoped>
.sequence-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid #666;
  min-height: 400px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  cursor: pointer;
}

.spacer {
  flex: 1;
}

.spacer.large {
  flex: 2;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.queue-table {
  width: 100%;
  border-collapse: collapse;
}

.queue-table th,
.queue-table td {
  border: 1px solid #646161;
  padding: 3px;
  min-width: 10px;
  text-align: left;
}

.queue-table th {
  background: #757575;
}

.queue-table tr.selected {
  background: #cfe3ff;
}
</style>