
export const stelModule = {
  state: {
    isStellariumReady: false,
    currentOverlay: null,
    lowerComponent: null,
    lowerComponentHeight: 0,
    currSettingMenu: null,
    loc: {},
    settings: {
      nightMode: false,
      nightModeIntensity: 75,
      stel: {
        "constellations.bounds_visible": false,
        "constellations.show_only_pointed": true,
        "constellations.images_visible": false,
        "constellations.lines_visible": true,
        "constellations.labels_visible": true,
        
        "stars.hints_visible": true,
        "dsos.hints_visible": true,
        "planets.hints_visible": true,
        "minor_planets.hints_visible": true,
        "comets.hints_visible": true,
      },
    }
  },
};