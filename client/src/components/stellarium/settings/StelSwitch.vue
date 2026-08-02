<template>
  <v-switch
    class="vSwitch"
    hide-details
    size="small"
    color="#CAD6EB"
    thumb-color="#2B4571"
    inset="material"
    v-bind="$attrs"
  >
    <slot></slot>
  </v-switch>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
})
</script>
<style scoped>
.vSwitch :deep(.v-selection-control) {
  min-height: 12vw !important;
}
.vSwitch :deep(.v-switch__track) {
  background-color: rgba(0, 0, 0, 0);
}
.vSwitch :deep(.v-label) {
  white-space: nowrap;
  overflow: visible;
}
</style>