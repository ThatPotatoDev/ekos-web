<template>
  <v-list class="no-v-list-background">
    <v-list-item>
      <v-btn block @click="addOrRemQueue" :disabled="!canModifyQueue()">{{addOrRemQueueText}}</v-btn>
    </v-list-item>
  </v-list>
  <v-data-table
    v-model="selectedRow"
    return-object
    :headers="[
      { title: 'Status', key: 'Status'},
      { title: 'Filter', key: 'Filter'},
      { title: 'Count', key: 'Count'},
      { title: 'Exp', key: 'Exp'},
      { title: 'Type', key: 'Type'},
      { title: 'Bin', key: 'Bin'},
      { title: 'ISO/Gain', key: 'ISO/Gain'},
      { title: 'Offset', key: 'Offset'},
    ]"
    density="compact"
    :items="localSeqQ"
    :items-per-page="-1"
    select-strategy="single"
    show-select
  > <template v-slot:bottom />
  </v-data-table>
</template>
<script>
import { mapActions, mapState } from "vuex";
import { CAPTURE_ADD_SEQUENCE, CAPTURE_GET_SEQUENCES, CAPTURE_REMOVE_SEQUENCE } from '@/util/messageTypes';

export default {
  data() {
    return {
      selectedRow: [],
      localSeqQ: []
    };
  },
  computed: {
    ...mapState([
      "sequenceQueue",
      "capture"
    ]),
    addOrRemQueueText() {
      if (this.selectedRow[0] === undefined) {
        return "Add job to Sequence Queue";
      } else {
        return "Remove job from Sequence Queue";
      }
    },
  },
  mount() {
    this.sendMsg([CAPTURE_GET_SEQUENCES]);
  },
  watch: {
    sequenceQueue: {
      immediate: true,
      handler(v) {
        this.localSeqQ = v.map((item, i) => ({
          ...item,
          rowIndex: i
        }))
      }
    }
  },
  methods: {
    ...mapActions([
      "sendMsg",
      "captureUpdateSettings"
    ]),
    canModifyQueue() {
      if (
        this.capture.status === "Idle"
        || this.capture.status === "Complete"
        || this.capture.status === "Aborted"
      ) {
        return true;
      }

      return false;
    },
    addOrRemQueue() {
      if (this.selectedRow[0] === undefined) {
        this.captureUpdateSettings();
        this.sendMsg([CAPTURE_ADD_SEQUENCE]);
      } else {
        this.sendMsg([CAPTURE_REMOVE_SEQUENCE, { index: this.selectedRow.rowIndex }]);
        this.selectedRow = [];
        this.sendMsg([CAPTURE_GET_SEQUENCES]);
      }
    },
    clearQueue() {
      this.selectedRow = [];
      for (const i in this.localSeqQ) {
        this.sendMsg([CAPTURE_REMOVE_SEQUENCE, { index: i }]);
      }
    },
  },
};
</script>