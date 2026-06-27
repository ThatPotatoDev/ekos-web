<template>
  <div class="stellarium-container" :class="containerClasses">
    <!-- Canvas für Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- Button für das Suchfeld (Lupe) -->
    <!-- <button
      @click="toggleSearch"
      :class="searchButtonClasses"
      class="absolute p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    >
      <MagnifyingGlassIcon class="w-6 h-6 text-white" />
    </button> -->

    <!-- Mount Position Component -->
    <!-- <stellariumMount
      v-if="this.stelStore.stel && store.mountInfo.Connected"
      ref="mountComponent"
      :canvasRef="stelCanvas"
      :isSearchVisible="isSearchVisible"
    /> -->

    <!-- Camera FOV Frame Overlay -->
    <!-- <StellariumFovFrame v-if="showFovFrame" /> -->

    <!-- Camera FOV Rotation Control + View-Center Actions -->
    <!-- <StellariumFovRotation v-if="showFovFrame" /> -->

    <!-- Overlay für das Suchfeld -->
    <!-- <div
      v-if="isSearchVisible"
      :class="searchModalClasses"
      class="absolute bg-black bg-opacity-80 p-4 rounded-lg shadow-lg text-white w-80"
      style="z-index: 100"
    >
      <steallriumSearch ref="searchComponent" />
    </div> -->

    <!-- Overlay für das ausgewählte Objekt -->
    <!-- <SelectedObject
      v-if="selectedObject"
      :selectedObject="selectedObject"
      :selectedObjectRa="selectedObjectRa"
      :selectedObjectDec="selectedObjectDec"
      :selectedObjectRaDeg="selectedObjectRaDeg"
      :selectedObjectDecDeg="selectedObjectDecDeg"
      @setFramingCoordinates="setFramingCoordinates"
    /> -->
    <div
      class="left-2 position-fixed d-flex ga-2 pa-2 rounded-pill stellarium-controls"
      style="bottom: 8px; background-color: rgba(0, 0, 0, 0.5); left: 8px;"
    >
      <!-- <stellariumCredits /> -->
      <stellariumSettings />

      <!-- Clock -->
      <!-- <stellariumClock v-if="this.stelStore.stel" /> -->
    </div>

    <!-- Horizon overlay (renders into SWE GeoJSON layer, no visible DOM element) -->
    <!-- <StellariumHorizonOverlay v-if="this.stelStore.stel" /> -->

    <!-- View Direction Display (hidden when camera FOV frame is rendered) -->
    <!-- <StellariumViewDirection v-if="this.stelStore.stel && !showFovFrame" /> -->
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex';
import stellariumSettings from "@/components/stellarium/stellariumSettings.vue"
import { degreesToDMS, degreesToHMS, rad2deg } from './stelUtil';
const wasmPath = '/stellarium-js/stellarium-web-engine.wasm';
export default {
  components: {
    stellariumSettings,
  },
  data: () => ({
    isSearchVisible: false,
    selectedObject: null,
    selectedObjectRa: null,
    selectedObjectDec: null,
    selectedObjectRaDeg: null,
    selectedObjectDecDeg: null,
  }),
  computed: {
    ...mapState([
      "stelStore"
    ]),
    containerClasses() {
      return {
        'stellarium-portrait': !this.$store.state.isLandscape,
        'stellarium-landscape': this.$store.state.isLandscape,
      };
    }
  },
  methods: {
    ...mapActions(["updateStellariumCore"])
  },
  async mounted() {
    const utcToMJD = utcDate => {
      return utcDate.getTime() / 86400000 + 40587;
    }
    const stelStore = this.stelStore;
    const settings = stelStore.settings;
    const updateStellariumCore = this.updateStellariumCore;
    //NINA vorbereiten
    // await store.fetchProfilInfos();

    // Schritt 1) Stellarium-Web-Engine-Skript dynamisch laden
    const script = document.createElement('script');
    script.src = '/stellarium-js/stellarium-web-engine.js';
    console.log('Loading Stellarium Web Engine script...');

    script.onload = async () => {
      if (!window.StelWebEngine) {
        console.error('StelWebEngine global object not found!');
        return;
      }

      try {
        const response = await fetch(wasmPath);
        if (!response.ok) {
          throw new Error(`Error loading WASM file: ${response.statusText}`);
        }
        const wasmArrayBuffer = await response.arrayBuffer();
        console.log('WASM file loaded successfully. Size (bytes):', wasmArrayBuffer.byteLength);

        window.StelWebEngine({
          wasmFile: wasmPath,

          canvas: this.$refs.stelCanvas,
          onReady: async (stel) => {
            console.log('Stellarium is ready!');
            stelStore.stel = stel;

            // Beobachter-Standort setzen (Koordinaten müssen in Radian sein):
            stel.core.observer.latitude = settings.loc.latitude * stel.D2R;
            stel.core.observer.longitude = settings.loc.longitude * stel.D2R;
            stel.core.observer.elevation = settings.loc.elevation;

            // Ensure timeSync is synced, then set server time
            // await timeSync.ensureSync();
            const serverTime = new Date(); //(timeSync.getServerTime());
            const mjd = utcToMJD(serverTime);
            stel.core.observer.utc = mjd;
            console.log('Stellarium initialized with server time:', serverTime.toISOString());

            stel.core.time_speed = 1;

            // Speichere Stellarium für späteren Zugriff
            stelStore.stel = stel;

            // Hilfsfunktion zum Auslesen der aktuellen Blickrichtung (RA/Dec)
            function getCurrentViewDirection() {
              const obs = stel.core.observer;

              // Im VIEW-Frame zeigt [0, 0, -1] nach vorne (wo die Kamera hinzeigt)
              // Im VIEW-Frame zeigt [0, 0, 1] nach hinten (hinter die Kamera)
              const viewVec = [0, 0, -1];

              // Konvertiere von VIEW zu CIRS
              const cirsVec = stel.convertFrame(stel.observer, 'VIEW', 'CIRS', viewVec);

              // Konvertiere zu sphärischen Koordinaten (RA/Dec)
              const raDecSpherical = stel.c2s(cirsVec);

              const alt = obs.azalt[0];
              const az = obs.azalt[1];

              return {
                ra: raDecSpherical[0],
                dec: raDecSpherical[1],
                alt,
                az,
              };
            }

            // Hilfsfunktion zum Setzen der Blickrichtung (RA/Dec)
            function setViewDirection(raDeg, decDeg) {
              try {
                // Convert degrees to radians
                const raRad = raDeg * stel.D2R;
                const decRad = decDeg * stel.D2R;

                // Create ICRF vector from RA/Dec
                const icrfVec = stel.s2c(raRad, decRad);

                // Convert from ICRF to CIRS frame
                const cirsVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

                // Create a virtual circle object at the specified position
                const targetCircle = stel.createObj('circle', {
                  id: 'framingTarget',
                  pos: cirsVec,
                  color: [0, 0, 0, 0.1],
                  size: [0.05, 0.05],
                });

                // Update the object and select it
                targetCircle.pos = cirsVec;
                targetCircle.update();
                stel.core.selection = targetCircle;
                stel.pointAndLock(targetCircle);

                console.log('Updated Stellarium view to RA:', raDeg, 'Dec:', decDeg);
              } catch (error) {
                console.error('Error setting view direction:', error);
              }
            }

            stelStore.getCurrentViewDirection = getCurrentViewDirection;
            stelStore.setViewDirection = setViewDirection;

            // Schritt 3) Datenquellen (Kataloge) hinzufügen
            //IP und Port vom Plugin ermitteln
            const protocol = settings.backendProtocol || 'http';
            const host = settings.connection?.ip || window.location.hostname;
            const port = settings.connection?.port || window.location.port;
            const baseUrl = `${protocol}://${host}:${port}/stellarium-data/`;
            stelStore.baseUrl = baseUrl;
            const core = stel.core;

            core.dsos.hints_mag_offset = 4;
            //core.stars.hints_mag_offset = 3;

            //Daten hinzufügen
            core.stars.addDataSource({ url: baseUrl + 'stars' });
            core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
            core.dsos.addDataSource({ url: baseUrl + 'dso' });
            core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
            //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
            //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/gray', key: 'guereins' });
            core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
            core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
            // Planeten mit offiziellen HiPS-Texturen
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mercury', key: 'mercury' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/venus', key: 'venus' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mars', key: 'mars' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/jupiter', key: 'jupiter' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/saturn', key: 'saturn' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/uranus', key: 'uranus' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/neptune', key: 'neptune' });

            // Jupiter-Monde
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/io', key: 'io' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/europa', key: 'europa' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/ganymede', key: 'ganymede' });
            core.planets.addDataSource({ url: baseUrl + 'surveys/sso/callisto', key: 'callisto' });

            core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
            core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
            // core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz',key: 'jsonl/sat', });

            updateStellariumCore();

            // Schritt 4) Selektion beobachten
            stel.change((obj, attr) => {
              if (attr === 'selection') {
                const selection = core.selection;
                if (!selection) {
                  // Abwahl
                  this.selectedObject = null;
                  console.log('No selection (deselected).');
                  return;
                }
                if (stel.core.selection) {
                  const sel = stel.core.selection;
                  this.isSearchVisible = false;
                  const selectedDesignations = sel.designations() || [];
                  // For coordinate-based search results (NGC, etc.) designations()
                  // returns nothing useful — prepend the last searched name so it
                  // gets passed on to framing/sequence.
                  const searchedName = stelStore.lastSearchedName;
                  stelStore.lastSearchedName = '';
                  const designationsList = Array.isArray(selectedDesignations)
                    ? selectedDesignations
                    : [];
                  if (searchedName && !designationsList.includes(searchedName)) {
                    this.selectedObject = [searchedName, ...designationsList];
                  } else {
                    this.selectedObject = designationsList;
                  }
                  const info = sel;

                  const raDec = info.getInfo('RADEC');
                  //const cirs = stel.convertFrame(stel.observer, 'ICRF', 'ICRF', raDec);
                  const radecCIRS = stel.c2s(raDec);
                  const ra = stel.anp(radecCIRS[0]); // RA in Radian
                  const dec = stel.anpm(radecCIRS[1]); // Dec in Radian

                  this.selectedObjectRa = degreesToHMS(rad2deg(ra));
                  this.selectedObjectDec = degreesToDMS(rad2deg(dec));
                  this.selectedObjectRaDeg = rad2deg(ra);
                  this.selectedObjectDecDeg = rad2deg(dec);
                  console.log(this.selectedObjectRa, this.selectedObjectDec, ra, dec);
                  console.log(stel.a2tf(ra, 1),stel.a2af(dec, 1));
                }
              }
            });
          },
        });
      } catch (err) {
        console.error('Error with Fetch or StelWebEngine:', err);
      }
    };
    document.head.appendChild(script);
  },
  beforeUnmount() {
    if (this.stelStore.stel) {
      console.log('Destroying Stellarium...');
  
      // Entferne die Stellarium-Instanz
      this.stelStore.stel = null;
  
      if (this.$refs.stelCanvas.value) {
        this.$refs.stelCanvas.value.width = 0;
        this.$refs.stelCanvas.value.height = 0;
      }
  
      console.log('Stellarium successfully terminated.');
  }
  }
}
</script>
<style scoped>
.stellarium-container {
  position: fixed;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Landscape Mode  */
.stellarium-landscape {
  top: 0;
  left: 8rem;
  width: calc(100vw - 8rem);
  height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px));
}

@media screen and (orientation: landscape) {
  .stellarium-controls.left-2 {
    left: 9rem !important;
  }
}

.stellarium-portrait {
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
}
</style>