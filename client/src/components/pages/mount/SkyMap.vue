<template>
  <div id="celestial-map"></div>
</template>
<style>
#celestial-map {
  max-width: 800px;
}
#celestial-map canvas {
  margin: auto;
  display: block;
  position: relative;
}
</style>
<script>
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
export default {
  props: {
    center: Array,
  },
  async mounted() {
    await loadScript('/js/d3.min.js');
    await loadScript('/js/d3.geo.projection.min.js');
    await loadScript('/js/celestial.js'); //https://ofrohn.github.io/celestial.js

    this.Celestial = Celestial;
    this.Celestial.display(this.buildConfig());
    this.ready = true;
  },
  data() {
    return {
      Celestial: null,
      ready: false,
    };
  },
  methods: {
    buildConfig() {
      return {
        projection: "orthographic",
        transform: "equatorial",
        planets: { show: true, names: true },
        horizon: { show: true, opacity: 1 },
        stars: { propername: true },
        follow: "center",
        center: this.center,
        controls: false,
        form: false,
        zoomlevel: 10,
        datapath: "/celestial-data/",
      };
    },
  },
  watch: {
    center(newVal, oldVal) {
      if (!this.ready) return;

      let update = false;
      if (!oldVal || oldVal.length != 2 || newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
        update = true;
      }

      if (update && newVal.length === 2) {
        this.Celestial.stop(true);
        this.Celestial.rotate({ center: [...newVal, 0] });
      }
    },
  },
};
</script>
