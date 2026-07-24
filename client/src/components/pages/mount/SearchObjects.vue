<template>
  <div>
    <v-list class="no-v-list-background">
      <v-list-item>
        <div class="d-flex w-100 ga-2">
          <v-btn class="flex-grow-1" @click="openPopup">
            Search Objects
          </v-btn>
          <v-btn @click="refresh" style="flex: 0 0 5%; display: flex; ">
            <v-icon icon="mdi-refresh" style="display:flex; width: 1rem; height: 1rem;" />
          </v-btn>
        </div>
      </v-list-item>
      <v-list-item v-if="target">
        <v-text-field
          v-model="target"
          label="Target"
          hide-details readonly
        />
      </v-list-item>
      <v-list-item v-if="target">
        <v-btn block @click="goto">GOTO</v-btn>
      </v-list-item>
    </v-list>

    <div
      v-if="open"
      class="overlay"
      @click.self="open = false"
    >
      <div class="popup">
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search object..."
        />

        <div class="results">
          <div
            v-for="item in filtered"
            :key="item.id"
            class="result"
            @click="selectItem(item)"
          >
            {{ item.display }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { nextTick } from "vue";
import { mapActions, mapState } from "vuex";
import { ASTRO_GET_NAMES, MOUNT_GOTO_TARGET } from "../../../util/messageTypes";

export default {
  data: () => ({
    open: false,
    query: "",
    target: null,
  }),
  computed: {
    ...mapState([
      "gotoObjects",
      "gotoObjectsFuse",
      "mount"
    ]),
    gotoList() {
      return Array.from(this.gotoObjects.values());
    },
    filtered() {
      if (this.query.trim() === "") return this.gotoList.slice(0, 50);
      return this.gotoObjectsFuse
        .search(this.query)
        .slice(0, 50)
        .map(r => r.item);
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    async openPopup() {
      this.open = true;
      await nextTick();
      this.$refs.searchInput?.focus();
    },
    selectItem(item) {
      this.open = false;
      this.target = item.primary;
      this.query = "";
    },
    goto() {
      this.sendMsg([MOUNT_GOTO_TARGET, { target: this.target } ])
    },
    refresh() {
      this.sendMsg([ASTRO_GET_NAMES]);
    }
  },
  mounted() {
    this.target = this.mount.target;
  }
}

</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);

  display: flex;
  justify-content: center;
  align-items: start;

  padding-top: 10vh;

  z-index: 9999;
}

.popup {
  width: 600px;
  max-height: 70vh;

  background: rgb(var(--v-theme-background));
  border-radius: 12px;
  overflow: hidden;

  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
}

.popup input {
  background-color: rgb(var(--v-theme-surface));
  width: 100%;
  padding: 16px;
  border: none;
  border-bottom: 1px solid rgb(var(--v-theme-surface));
  font-size: 18px;
  outline: none;
}

.results {
  overflow-y: auto;
  max-height: 60vh;
}

.result {
  padding: 12px 16px;
  cursor: pointer;
}

.result:hover {
  background: rgb(50,50,50);
}
</style>