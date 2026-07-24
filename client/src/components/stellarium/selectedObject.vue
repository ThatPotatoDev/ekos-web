<template>
<div class="selectedObj rounded-t-xl" 
  ref="selectedObjRef" :class="{ dragging }"
  :style="{ height: `${currentHeight}px` }"
>
  <v-card>
    <div v-if="showSelectedInfoButtons" style="position: absolute; right: 10px; top: 10px">
      <v-fab v-if="showPointToButton" icon size="small" variant="text" v-on:click.native="lockToSelection()">
        <img src="@/assets/svg/point_to.svg" height="40px" style="min-height: 40px" />
      </v-fab>
      <v-fab v-if="!showPointToButton && !isMount" icon size="small" variant="text" v-on:click.native="showGotoDialog = true">
        <img src="@/assets/svg/outline.svg" height="40px" style="min-height: 40px">
          <v-icon icon="mdi-telescope" class="position-absolute" />
        </img>
      </v-fab>
      <v-fab v-if="!showPointToButton" class="ml-4" icon size="small" variant="text" @mousedown="zoomOutButtonClicked()">
        <img :class="{bt_disabled: !zoomButtonsEnabled}" src="@/assets/svg/remove_circle_outline.svg" height="40px" style="min-height: 40px"></img>
      </v-fab>
      <v-fab v-if="!showPointToButton" class="ml-4" icon size="small" variant="text" @mousedown="zoomInButtonClicked()">
        <img :class="{bt_disabled: !zoomButtonsEnabled}" src="@/assets/svg/add_circle_outline.svg" height="40px" style="min-height: 40px"></img>
      </v-fab>
    </div>
    <v-card-title ref="cardTitle" class="bottom-elevation-3" style="cursor: grab; user-select: none;" primary-title @pointerdown="startDrag">
      <div class="drag-handle-container">
        <div class="drag-handle" :style="{ 
          background: `rgba(255,255,255,${dragging?'.6':'.3'})`
        }">
      </div>
    </div>
      <div style="width: 100%" class="d-flex align-start">
        <img v-if="!isMount" :src="icon" height="48" width="48" align="left" style="margin-top: 3px; margin-right: 10px"/>
        <v-icon v-else icon="mdi-telescope" size="48" align="left" 
          style="margin-top: 3px; margin-right: 10px"
        />
        <div style="overflow: hidden; text-overflow: ellipsis;">
          <div class="text-headline-small">{{ title }}</div>
          <div class="text-grey text-body-medium">{{ type }}</div>
        </div>
      </div>
    </v-card-title>
    <v-card-text v-if="this.selectedObject" class="pt-1" style="padding-bottom: 0px;">
      <v-row v-if="otherNames.length > 1" style="width: 100%;">
        <v-col cols="12">
          <span style="position: absolute; color: #FFFFFFB2">{{ $t('Also known as') }}</span>
          <span style="padding-left: 33.3333%">&nbsp;</span>
          <span class="text-body-small text-white" v-for="mname in otherNames1to7" :key="mname" style="margin-right: 15px; font-weight: 500;">{{ mname }}</span>
          <v-btn size="small" variant="text" icon="mdi-dots-horizontal" class="text-grey" v-if="otherNames.length > 8" v-on:click.native="showMinorNames = !showMinorNames" style="margin-top: -5px; margin-bottom: -5px;" />
          <span class="text-body-small text-white" v-for="mname in otherNames8andMore" :key="mname" style="margin-right: 15px; font-weight: 500">{{ mname }}</span>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-if="this.selectedObject" class="pt-2">
      <template v-for="item in items" :key="item.key">
        <v-row style="width: 100%" no-gutters>
          <v-col cols="4" style="color: #dddddd">{{ item.key }}</v-col>
          <v-col cols="8" style="font-weight: 500" class="text-white"><span v-html="item.value"></span></v-col>
        </v-row>
      </template>
      <!-- <div style="margin-top: 15px" class="white--text" v-html="wikipediaSummary"></div> -->
    </v-card-text>
    <v-dialog v-model="showGotoDialog">
      <v-card transparent 
        style="overflow: visible;"
        :title="$t('stellarium.sel.slew')"
      >
        <template v-slot:actions>
          <v-spacer />
          <v-btn @click="goto()" :text="$t('stellarium.sel.slew')"/>
        </template>
      </v-card>
    </v-dialog>
  </v-card>
</div>
</template>
<script>
import { mapActions, mapState } from "vuex";
import swh from '@/assets/swh_helpers.js';
import Moment from "moment";
import { ASTRO_GET_OBJECTS_INFO, MOUNT_GOTO_RADE, MOUNT_GOTO_TARGET } from "../../util/messageTypes";
import { hmsFromH, dms } from "@/util/coords"

export default {
  data: () => ({
    selectedObject: undefined,
    selectedSweObj: undefined,
    showMinorNames: false,
    items: [],
    showSelectedInfoButtons: true,
    showGotoDialog: false,

    dragging: false,
    startY: 0,
    currentHeight: 0,
    titleHeight: 0,
    fullHeight: 0,
    lastSnapHeight: 0,
  }),
  computed: {
    ...mapState([
      "stelStore",
      "objectsInfo",
      "profiles"
    ]),
    ...mapState({
      stel: s => s.stelStore.stel,
      stelT: s => s.stelStore.stelT,
    }),
    isMount(){
      return this.selectedSweObj?.label === "MOUNT";
    },
    stelSelectionId() {
      return this.stelT?.selection;
    },
    title() {
      return this.selectedObject ? this.otherNames[0] : 'Selection';
    },
    otherNames() {
      return this.selectedObject ? (this.isMount ? ["Mount"] : swh.namesForSkySource(this.selectedObject, 26)) : undefined;
    },
    otherNames1to7() {
      return this.otherNames.slice(1, 8);
    },
    otherNames8andMore() {
      return this.showMinorNames ? this.otherNames.slice(8) : [];
    },
    type() {
      if (!this.selectedObject) return 'Unknown';
      if (this.isMount) return this.profiles.profiles[this.profiles.selectedProfileIndex]?.mount ?? "Mount";
      let morpho = '';
      if (this.selectedObject.model_data && this.selectedObject.model_data.morpho) {
        morpho = swh.nameForGalaxyMorpho(this.selectedObject.model_data.morpho);
        if (morpho) morpho = morpho+' ';
      }
      return morpho + swh.nameForSkySourceType(this.selectedObject.types[0]);
    },
    showPointToButton() {
      if (!this.stelT.lock) return true
      if (this.stelT.lock !== this.stelT.selection) return true
      return false
    },
    icon() {
      return this.selectedObject ? swh.iconForSkySource(this.selectedObject) : ""
    },
    zoomButtonsEnabled() {
      if (!this.stelStore.stelT.lock || !this.selectedObject) return false
      return true
    },
    expandedHeight() {
      return this.fullHeight || (window.innerHeight * 0.4);
    },
    collapsedHeight() {
      return this.titleHeight || 0
    }
  },
  watch: {
    selectedObject(s) {
      this.showMinorNames = false;
      if (!s) {
        this.currentHeight = 0;
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
        return;
      }
      if (this.stelStore.lowerComponent && this.stelStore.lowerComponent !== "selected") {
        this.stelStore.stel.core.selection = 0
        return;
      }
      const prevFullHeight = this.fullHeight;
      const prevTitleHeight = this.titleHeight;
      requestAnimationFrame(() => {
        this.updateCollapsedHeight();
        
        if (this.currentHeight === 0) {
          this.stelStore.lowerComponent = "selected";
          this.currentHeight = this.titleHeight;
          this.lastSnapHeight = this.currentHeight;
        } else if (this.currentHeight === prevFullHeight) {
          this.currentHeight = this.fullHeight;
        } else if (this.currentHeight === prevTitleHeight) {
          this.currentHeight = this.titleHeight;
        }
      });
      var that = this;
      that.items = that.computeItems();
      if (that.timer) clearInterval(that.timer);
      that.timer = setInterval(() => { that.items = that.computeItems() }, 1000)

    },
    stelSelectionId(s) {
      // this.sendMsg(["log_dbg", {msg: JSON.stringify(this.stel.core)}])
      if (!this.stel.core.selection) {
        this.selectedObject = 0;
        return;
      }
      this.selectedObject = this.stel.core.selection.jsonData;
      this.selectedSweObj = this.stel.core.selection;
    },
    'stelStore.currentOverlay'(v) {
      this.selectedObject = 0;
    }
  },
  methods: {
    ...mapActions([
      "sendMsg"
    ]),
    startDrag(event) {
      this.dragging = true;

      this.startY = event.clientY;
      this.startHeight = this.currentHeight;

      window.addEventListener('pointermove', this.onDrag);
      window.addEventListener('pointerup', this.endDrag);
    },
    onDrag(event) {
      if (!this.dragging) return;
      const deltaY = event.clientY - this.startY;

      this.currentHeight = Math.min(
        this.expandedHeight,
        this.startHeight - deltaY
      );
    },
    endDrag() {
      this.dragging = false;
      const snaps = [0, this.titleHeight, this.fullHeight]
      window.removeEventListener('pointermove', this.onDrag);
      window.removeEventListener('pointerup', this.endDrag);

      if (snaps.includes(this.currentHeight)) {
        this.currentHeight = 
          this.lastSnapHeight === this.titleHeight 
          ? this.fullHeight 
          : this.titleHeight
      } else this.currentHeight = snaps.reduce((prev, curr) => {
        return Math.abs(curr - this.currentHeight) < Math.abs(prev - this.currentHeight) ? curr : prev;
      });
      this.lastSnapHeight = this.currentHeight;
    },

    computeItems() {
      const obj = this.stel.core.selection
      if (!obj) return []
      const that = this;
      const stel = this.stelStore.stel;

      const ret = []

      const addAttr = (key, attr, format) => {
        const v = obj.getInfo(attr)
        if (v && !isNaN(v)) {
          ret.push({
            key: key,
            value: format ? format(v) : v.toString()
          })
        }
      }

      addAttr(that.$t('Magnitude'), 'vmag', this.formatMagnitude)
      addAttr(that.$t('Distance'), 'distance', this.formatDistance)
      if (this.selectedObject.model_data) {
        if (this.selectedObject.model_data.radius) {
          ret.push({
            key: that.$t('Radius'),
            value: this.selectedObject.model_data.radius.toString() + ' Km'
          })
        }
        if (this.selectedObject.model_data.spect_t) {
          ret.push({
            key: that.$t('Spectral Type'),
            value: this.selectedObject.model_data.spect_t
          })
        }
        if (this.selectedObject.model_data.dimx) {
          const dimy = this.selectedObject.model_data.dimy ? this.selectedObject.model_data.dimy : this.selectedObject.model_data.dimx
          ret.push({
            key: that.$t('Size'),
            value: this.selectedObject.model_data.dimx.toFixed(1) + "' x " + dimy.toFixed(1) + "'"
          })
        }
      }
      const formatInt = function (num, padLen) {
        const pad = new Array(1 + padLen).join('0')
        return (pad + num).slice(-pad.length)
      }
      const formatRA = function (a) {
        const raf = stel.a2tf(a, 1)
        return '<div class="radecVal">' + formatInt(raf.hours, 2) + '<span class="radecUnit">h</span>&nbsp;</div><div class="radecVal">' + formatInt(raf.minutes, 2) + '<span class="radecUnit">m</span></div><div class="radecVal">' + formatInt(raf.seconds, 2) + '.' + raf.fraction + '<span class="radecUnit">s</span></div>'
      }
      const formatAz = function (a) {
        const raf = stel.a2af(a, 1)
        return '<div class="radecVal">' + formatInt(raf.degrees < 0 ? raf.degrees + 180 : raf.degrees, 3) + '<span class="radecUnit">°</span></div><div class="radecVal">' + formatInt(raf.arcminutes, 2) + '<span class="radecUnit">\'</span></div><div class="radecVal">' + formatInt(raf.arcseconds, 2) + '.' + raf.fraction + '<span class="radecUnit">"</span></div>'
      }
      const formatDec = function (a) {
        const raf = stel.a2af(a, 1)
        return '<div class="radecVal">' + raf.sign + formatInt(raf.degrees, 2) + '<span class="radecUnit">°</span></div><div class="radecVal">' + formatInt(raf.arcminutes, 2) + '<span class="radecUnit">\'</span></div><div class="radecVal">' + formatInt(raf.arcseconds, 2) + '.' + raf.fraction + '<span class="radecUnit">"</span></div>'
      }
      const raDecF = (jnow) => {
        let posCIRS
        if (jnow) {
          posCIRS = stel.convertFrame(stel.core.observer, 'ICRF', 'JNOW', obj.getInfo('radec'))
        } else {
          posCIRS = obj.getInfo('radec')
        }
        const radecCIRS = stel.c2s(posCIRS)
        const raCIRS = stel.anp(radecCIRS[0])
        const decCIRS = stel.anpm(radecCIRS[1])
        return [raCIRS, decCIRS]
      }
      let raDec = raDecF(true)
      this.raDe = [stel.a2tf(raDec[0], 2), stel.a2af(raDec[1], 2)]
      ret.push({
        key: that.$t('Ra/Dec (JNOW)'),
        value: formatRA(raDec[0]) + '&nbsp;&nbsp;&nbsp;' + formatDec(raDec[1])
      })
      raDec = raDecF(false)
      ret.push({
        key: that.$t('Ra/Dec (J2000)'),
        value: formatRA(raDec[0]) + '&nbsp;&nbsp;&nbsp;' + formatDec(raDec[1])
      })
      const azalt = this.stel.c2s(this.stel.convertFrame(this.stel.core.observer, 'ICRF', 'OBSERVED', obj.getInfo('radec')))
      const az = this.stel.anp(azalt[0])
      const alt = this.stel.anpm(azalt[1])
      ret.push({
        key: that.$t('Az/Alt'),
        value: formatAz(az) + '&nbsp;&nbsp;&nbsp;' + formatDec(alt)
      })
      addAttr(that.$t('Phase'), 'phase', this.formatPhase)
      const vis = obj.computeVisibility()
      let str = ''
      if (vis.length === 0) {
        str = that.$t('Not visible tonight')
      } else if (vis[0].rise === null) {
        str = that.$t('Always visible tonight')
      } else {
        str = that.$t('Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}', [this.formatTime(vis[0].rise), this.formatTime(vis[0].set)])
      }
      ret.push({
        key: that.$t('Visibility'),
        value: str
      })
      return ret
    },
    formatPhase(v) {
      return (v * 100).toFixed(0) + '%'
    },
    formatMagnitude(v) {
      if (!v) {
        return 'Unknown'
      }
      return v.toFixed(2)
    },
    formatDistance(d) {
      // d is in AU
      if (!d) {
        return 'NAN'
      }
      const ly = d * swh.astroConstants.ERFA_AULT / swh.astroConstants.ERFA_DAYSEC / swh.astroConstants.ERFA_DJY
      if (ly >= 0.1) {
        return ly.toFixed(2) + '<span class="radecUnit"> light years</span>'
      }
      if (d >= 0.1) {
        return d.toFixed(2) + '<span class="radecUnit"> AU</span>'
      }
      const meter = d * swh.astroConstants.ERFA_DAU
      if (meter >= 1000) {
        return (meter / 1000).toFixed(2) + '<span class="radecUnit"> km</span>'
      }
      return meter.toFixed(2) + '<span class="radecUnit"> m</span>'
    },
    formatTime(jdm) {
      var d = new Date()
      d.setMJD(jdm)
      const utc = new Moment(d)
      utc.utcOffset(this.stelT.utcoffset)
      return utc.format('HH:mm')
    },
    unselect() {
      this.stel.core.selection = 0
    },
    lockToSelection() {
      if (this.stel.core.selection) {
        this.stel.pointAndLock(this.stel.core.selection, 0.5)
      }
    },
    zoomInButtonClicked() {
      this.stopZoom()
      this.zooming = true
      this._zoomIn()
    },
    _zoomIn() {
      if (!this.zooming) return

      const currentFov = this.stelT.fov * 180 / Math.PI
      this.stel.zoomTo(currentFov * 0.3 * Math.PI / 180, 0.4)

      this.zoomTimeout = setTimeout(() => {
        this._zoomIn()
      }, 300)
    },
    zoomOutButtonClicked() {
      this.stopZoom()
      this.zooming = true
      this._zoomOut()
    },
    _zoomOut() {
      if (!this.zooming) return

      const currentFov = this.stelT.fov * 180 / Math.PI
      this.stel.zoomTo(currentFov * 3 * Math.PI / 180, 0.6)

      this.zoomTimeout = setTimeout(() => {
        this._zoomOut()
      }, 200)
    },
    stopZoom() {
      this.zooming = false
      if (this.zoomTimeout) {
        clearTimeout(this.zoomTimeout)
        this.zoomTimeout = null
      }
    },
    goto() {
      this.showGotoDialog = false;
      
      const format = (o) => {
        return `${o.sign}${o.hours ?? o.degrees}:${o.minutes ?? o.arcminutes}:${o.seconds ?? o.arcseconds}.${o.fraction}`;
      }
      this.sendMsg([MOUNT_GOTO_RADE, { ra: format(this.raDe[0]), de: format(this.raDe[1])}])
    },
    updateCollapsedHeight() {
      if (this.$refs.cardTitle) {
        this.titleHeight = this.$refs.cardTitle.$el.getBoundingClientRect().height;
        this.fullHeight = this.$refs.cardTitle.$el.parentElement.getBoundingClientRect().height;
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.stelStore.lowerComponentHeight = entry.contentRect.height;
          if (entry.contentRect.height === 0) {
            this.stelStore.lowerComponent = null;
          }
        }
      });

      if (this.$refs.selectedObjRef) {
        resizeObserver.observe(this.$refs.selectedObjRef);
      }

      this.resizeObserver = resizeObserver;
    });
    window.addEventListener('resize', this.updateCollapsedHeight);

    const that = this
    window.addEventListener('mouseup', function (event) {
      that.stopZoom()
    })
  },
  beforeUnmount() {
    this.resizeObserver.disconnect();
  }
}
</script>
<style>
.bt_disabled {
  filter: opacity(0.2);
}

.radecVal {
  display: inline-block;
  font-family: monospace;
  padding-right: 2px;
  font-size: 13px;
  font-weight: bold;
}

.radecUnit {
  color: #dddddd;
  font-weight: normal
}

.selectedObj {
  position: absolute;
  bottom: 0;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  touch-action: none;
  transition: height 0.25s ease;
}
.selectedObj.dragging {
    transition: none;
}

.drag-handle-container {
  display: flex;
  justify-content: center;
  padding-top: 3px;
  padding-bottom: 3px;
  cursor: grab;
}

.drag-handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
}
.bottom-elevation-3 {
  box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}
</style>