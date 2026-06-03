<template>
  <v-number-input
    :key="modelValue"
    :model-value="modelValue"
    :label="label"
    :min="min"
    :max="max"
    :precision="5"
    :step="0"
    @update:model-value="onInput"
  >
    <template #increment>
      <v-btn :disabled="modelValue >= max" icon="mdi-chevron-up" variant="text" @click="stepBy(1)" />
    </template>
    <template #decrement>
      <v-btn :disabled="modelValue <= min" icon="mdi-chevron-down" variant="text" @click="stepBy(-1)" />
    </template>
  </v-number-input>
</template>

<script>
const recommendedValues = [
  0.00025, 0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5,
  1, 1.5, 2, 2.5, 3, 5, 6, 7, 8, 9, 10,
  20, 30, 40, 50, 60, 120, 180, 300, 600, 900
]
export default {
  name: "NonLinearNumberInput",
  props: {
    modelValue: Number,
    label: String,
  },
  emits: ["update:modelValue"],
  computed: {
    values() {
      return [...recommendedValues].sort((a, b) => a - b);
    },

    min() {
      return this.values[0] ?? 0;
    },

    max() {
      return this.values[this.values.length - 1] ?? 0;
    }
  },
  methods: {
    emit(val) {
      this.$emit("update:modelValue", val);
    },
    onInput(val) {
      const num = Number(val);
      if (Number.isFinite(num)) {
        this.emit(num);
      }
    },
    stepBy(steps) {
      const values = this.values;
      const current = Number(this.modelValue);

      let idx = values.indexOf(current);

      if (idx === -1) {
        let i = 0;
        while (i < values.length && current > values[i]) i++;
        idx = steps > 0 ? i : i - 1;
      } else {
        idx += steps;
      }

      if (idx < 0) idx = 0;
      if (idx >= values.length) idx = values.length - 1;

      this.emit(values[idx]);
    }
  }
};
</script>