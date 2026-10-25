<template>
<div class="d-flex flex-column align-center justify-center">
  <slot> </slot>
  <span class="text-label-tiny label mb-1 font-weight-light text-white">{{ $t(label) }}</span>
</div>
</template>
<script>

export default {
  props: {
    label: String
  }
}

</script>
<style scoped>

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