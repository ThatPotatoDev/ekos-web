<template>
<v-row density="compact">
  <v-col><v-select
    v-model="currScope" :items="scopes" hide-details
    label="Scope" item-title="name" return-object
  /></v-col>
  <v-col class="d-flex align-center">
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;" 
      class="ml-4 mr-2" @click.stop="addScope"
     ><v-icon icon="mdi-plus"/></v-btn>
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;" 
      :disabled="!currScope" class="mr-2" @click.stop="deleteScope"
    ><v-icon icon="mdi-close"/></v-btn>
    <v-btn min-height="40" min-width="40" variant="outlined" style="padding: 0;"
      :disabled="!currScope" @click.stop="resetScope"
    ><v-icon icon="mdi-refresh"/></v-btn>
  </v-col>
</v-row>
<div class="mt-2" v-if="currScope">
<v-row density="compact">
  <v-col><v-text-field
    v-model="currScope.name" hide-details
    label="Name" readonly
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-text-field
    v-model="currScope.vendor" hide-details
    label="Vendor"
  /></v-col>
  <v-col><v-text-field
    v-model="currScope.model" hide-details
    label="Model"
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-select
    v-model="currScope.type" :items="['Refractor', 'Newtonian', 'Maksutov', 'Schmidt-Cassegrain', 'Cassegrain', 'Ritchey-Chretien']" hide-details
    label="Type"
  /></v-col>
</v-row>
<v-row density="compact">
  <v-col><v-number-input
    v-model="currScope.aperture" :step="10" :precision="2" :min="1" :max="100_000"
    label="Aperture"
  /></v-col>
  <v-col><v-number-input
    v-model="currScope.focal_length" :step="10" :precision="2" :min="1" :max="100_000"
    label="Focal length"
  /></v-col>
</v-row>
<div style="justify-self: center;"><v-btn width="150" @click.stop="saveScope">Save</v-btn></div>
</div>
</template>
<script>
import { mapState } from 'vuex';
import { ADD_SCOPE, DELETE_SCOPE, UPDATE_SCOPE } from '../../../util/messageTypes';
import { mapActions } from 'vuex/dist/vuex.cjs.js';

const blankScope = {
  //todo
}

export default {
  data: () => ({
    currScope: {},
    awaitingScopeAdd: false,
  }),
  computed: {
    ...mapState([
      "scopes"
    ]),
  },
  mounted() {
    this.currScope = this.scopes[0];
  },
  watch: {
    scopes(v) {
      if (!this.awaitingScopeAdd) return;
      this.currScope = v[v.length - 1];
      this.awaitingScopeAdd = false;
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    addScope() {
      this.sendMsg([ADD_SCOPE, blankScope]);
      this.awaitingScopeAdd = true;
    },
    deleteScope() {
      this.sendMsg([DELETE_SCOPE, { id: this.currScope.id }]);
      this.currScope = null;
    },
    resetScope() {
      this.currScope = {
        ...this.currScope,
        ...blankScope
      };
      this.saveScope();
    },
    saveScope() {
      this.sendMsg([UPDATE_SCOPE, this.currScope]);
      this.awaitingScopeAdd = true; //FIXME: updated scope isnt always last
    },
  },
}
</script>