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
<!-- <script src="https://ofrohn.github.io/celestial.js"></script> -->
<script>
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}
export default {
  props: {
    center: Array,
  },
  async mounted() {
    await loadScript('/js/d3.min.js');
    await loadScript('/js/d3.geo.projection.min.js');
    await loadScript('/js/celestial.js');

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
        datapath: "https://ofrohn.github.io/data/",
      };
    },
  },
  watch: {
    center(nv, ov) {
      if (!this.ready) return;

      let update = false;
      if (!ov || ov.length != 2 || nv[0] !== ov[0] || nv[1] !== ov[1]) {
        update = true;
      }

      if (update && nv.length === 2) {
        this.Celestial.stop(true);
        this.Celestial.rotate({ center: [...nv, 0] });
      }
    },
  },
};
</script>
