<template>
<div v-if="showSearch" class="d-flex justify-center align-center" >
  <v-card class="rounded-lg" style="top: 12px; width: 90%; position: absolute; overflow: visible">
  <div class="tsearch" style="position: relative;" v-click-outside="closeSearch">
    <v-text-field 
      :label="$t('Search...')" clearable ref="textField"
      v-model="searchText" @keyup.native.esc="closeSearch()" single-line
      :variant="showList ? undefined :'solo-filled'" density="comfortable" hide-details
    >
      <template #prepend-inner>
        <v-btn
          variant="text"
          icon="mdi-arrow-left"
          density="comfortable"
          class="me-1"
          @click="closeSearch()"
        />
      </template>
    </v-text-field>
    <v-virtual-scroll
      :items="autoCompleteChoices"
      v-if="showList" height="600"
    >
    <template v-slot:default="{ item }">
      <v-list dense two-line :style="listStyle">
        <v-list-item v-for="item in autoCompleteChoices" :key="item.display" @click="sourceClicked(item)" prepend-gap="16">
          <template v-slot:prepend>
            <img :src="iconForSkySource(item)" />
          </template>
          <!-- <v-list-item-title>{{ nameForSkySource(source) }}</v-list-item-title> -->
          <v-list-item-title class="vListTitle">{{ nameForSkySource(item) }}</v-list-item-title>
          <v-list-item-subtitle class="vListSubTitle">{{ typeToName(item.types[0]) }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </template>
    </v-virtual-scroll>
  </div>
  </v-card>
</div>
</template>
<script>
import swh from '@/assets/swh_helpers.js'
import vClickOutside from 'v-click-outside'
import _ from 'lodash'
import { mapActions, mapState } from 'vuex';
import { ASTRO_GET_OBJECT_INFO } from '../../util/messageTypes';

export default {
  data: function () {
    return {
      autoCompleteChoices: [],
      searchText: '',
      lastQuery: undefined
    }
  },
  watch: {
    showSearch(v, ov) {
      if (v === ov) return;
      if (!v) return;
      this.$nextTick(() => this.$refs.textField.focus());
    },
    searchText: function() {
      if (this.searchText === '') {
        this.autoCompleteChoices = []
        this.lastQuery = undefined
        return
      }
      this.refresh()
    },
  },
  computed: {
    ...mapState([
      "stelStore",
      "gotoObjectsFuse",
      "gotoObjects",
      "awaitingSearchObjectInfoObj"
    ]),
    listStyle: function () {
      return 'width: 100%; position: absolute; z-index: 1000; margin-top: 8px'
    },
    showList: function () {
      return this.searchText !== ''
    },
    showSearch() {
      return this.stelStore.currentOverlay === 'search'
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    tryFindObj(names) {
      let res = null;
      for (const n of names) {
        res = this.stelStore.stel.getObj(n);
        if (!res) res = this.stelStore.stel.getObj("NAME "+n);
        if (res) break;
      }
      return res;
    },
    sourceClicked: function(ss) {
      if (!ss) return;
      
      let obj = swh.skySource2SweObj(ss);
      if (!obj) {
        obj = this.stelStore.stel.createObj(ss.model, ss);
        this.stelStore.selectionLayer.add(obj);
      }
      if (!obj) {
        console.warning("Can't find object in SWE: " + ss.names[0]);
        return;
      }
      this.closeSearch();
      swh.setSweObjAsSelection(obj);
    },
    closeSearch: function () {
      this.searchText = ''
      this.stelStore.currentOverlay = null;
    },
    refresh: _.debounce(function () {
      var that = this;
      let str = that.searchText?.trim() ?? ""
      if (this.lastQuery === str) return;
      this.lastQuery = str;
      swh.querySkySources(str, 10).then(results => {
        if (str !== that.lastQuery) {
          console.log("cancelled query:", str);
          return;
        }
        that.autoCompleteChoices = results;
      }, err => console.log(err));
    }, 200),
    nameForSkySource: function (s) {
      const cn = swh.cleanupOneSkySourceName(s.match, 10);
      const n = swh.nameForSkySource(s, 10)
      if (!s.match || cn === n) {
        return n
      } else {
        return cn + ' (' + n + ')'
      }
    },
    typeToName: function (t) {
      return swh.nameForSkySourceType(t)
    },
    iconForSkySource: function (t) {
      return swh.iconForSkySource(t)
    },
  },
  async mounted() {
    // this.collectObjs();
  },
  directives: {
    clickOutside: vClickOutside.directive
  }
}
</script>
<style scoped>
.vListTitle {
  font-size: .8125rem;
  font-weight: 500;
  line-height: 1rem;
}

.vListSubTitle {
  font-size: .7900rem;
  font-weight: 450;
  line-height: .9rem;
}
@media all and (min-width: 600px) {
  .tsearch {
    z-index: 2;
  }
}
</style>