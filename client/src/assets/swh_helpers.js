// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

import store from "../plugins/vuex";

const stelStore = store.state.stelStore;

var DDDate = Date
DDDate.prototype.getJD = function () {
  return (this.getTime() / 86400000) + 2440587.5
}

DDDate.prototype.setJD = function (jd) {
  this.setTime((jd - 2440587.5) * 86400000)
}

DDDate.prototype.getMJD = function () {
  return this.getJD() - 2400000.5
}

DDDate.prototype.setMJD = function (mjd) {
  this.setJD(mjd + 2400000.5)
}

const swh = {

  monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  astroConstants: {
    // Light time for 1 au in s
    ERFA_AULT: 499.004782,
    // Seconds per day
    ERFA_DAYSEC: 86400.0,
    // Days per Julian year
    ERFA_DJY: 365.25,
    // Astronomical unit in m
    ERFA_DAU: 149597870000
  },

  iconForSkySourceTypes: function (skySourceTypes) {
    // Array sorted by specificity, i.e. the most generic names at the end
    const iconForType = {
      // Stars
      'Pec?': 'star',
      '**?': 'double_star',
      '**': 'double_star',
      'V*': 'variable_star',
      'V*?': 'variable_star',
      '*': 'star',

      // Candidates
      'As?': 'group_of_stars',
      'SC?': 'group_of_galaxies',
      'Gr?': 'group_of_galaxies',
      'C?G': 'group_of_galaxies',
      'G?': 'galaxy',

      // Multiple objects
      reg: 'region_defined_in_the_sky',
      SCG: 'group_of_galaxies',
      ClG: 'group_of_galaxies',
      GrG: 'group_of_galaxies',
      IG: 'interacting_galaxy',
      PaG: 'pair_of_galaxies',
      'C?*': 'open_galactic_cluster',
      'Gl?': 'globular_cluster',
      GlC: 'globular_cluster',
      OpC: 'open_galactic_cluster',
      'Cl*': 'open_galactic_cluster',
      'As*': 'group_of_stars',
      mul: 'multiple_objects',

      // Interstellar matter
      'PN?': 'planetary_nebula',
      PN: 'planetary_nebula',
      SNR: 'planetary_nebula',
      'SR?': 'planetary_nebula',
      ISM: 'interstellar_matter',

      // Galaxies
      PoG: 'part_of_galaxy',
      QSO: 'quasar',
      G: 'galaxy',

      dso: 'deep_sky',

      // Solar System
      Asa: 'artificial_satellite',
      Moo: 'moon',
      Sun: 'sun',
      Pla: 'planet',
      DPl: 'planet',
      Com: 'comet',
      MPl: 'minor_planet',
      SSO: 'minor_planet',

      Con: 'constellation',
      // SWE doesn't pack types field from stars into json data
      '': 'star'
    }
    for (const i in skySourceTypes) {
      if (skySourceTypes[i] in iconForType) {
        return window.location.origin + '/svg/target_types/' + iconForType[skySourceTypes[i]] + '.svg'
      }
    }
    return window.location.origin + '/svg/target_types/unknown.svg'
  },

  iconForSkySource: function (skySource) {
    return swh.iconForSkySourceTypes(skySource.types)
  },

  iconForObservation: function (obs) {
    if (obs && obs.target) {
      return this.iconForSkySource(obs.target)
    } else {
      return this.iconForSkySourceTypes(['reg'])
    }
  },

  cleanupOneSkySourceName: function (name, flags) {
    flags = flags || 4
    return stelStore.stel.designationCleanup(name, flags)
  },

  nameForSkySource: function (skySource, flags) {
    if (!skySource || !skySource.names) {
      return '?'
    }
    return this.cleanupOneSkySourceName(skySource.names[0], flags)
  },

  culturalNameToList: function (cn) {
    const res = []

    const formatNative = function (_cn) {
      if (cn.name_native && cn.name_pronounce) {
        return cn.name_native + ', <i>' + cn.name_pronounce + '</i>'
      }
      if (cn.name_native) {
        return cn.name_native
      }
      if (cn.name_pronounce) {
        return cn.name_pronounce
      }
    }

    const nativeName = formatNative(cn)
    if (cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    if (cn.name_translated) {
      res.push(cn.name_translated)
    }
    if (!cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    return res
  },

  namesForSkySource: function (ss, flags) {
    // Return a list of cleaned up names
    if (!ss || !ss.names) {
      return []
    }
    if (!flags) flags = 10
    let res = []
    if (ss.culturalNames) {
      for (const i in ss.culturalNames) {
        res = res.concat(this.culturalNameToList(ss.culturalNames[i]))
      }
    }
    res = res.concat(ss.names.map(n => stelStore.stel.designationCleanup(n, flags)))
    // Remove duplicates, this can happen between * and V* catalogs
    res = res.filter(function (v, i) { return res.indexOf(v) === i })
    res = res.filter(function (v, i) { return !v.startsWith('CON ') })
    return res
  },

  nameForSkySourceType: function (otype) {
    if (otype === '') return stelStore.stel.otypeToStr('*');
    const res = stelStore.stel.otypeToStr(otype)
    return res || 'Unknown Type'
  },

  nameForGalaxyMorpho: function (morpho) {
    const galTab = {
      E: 'Elliptical',
      SB: 'Barred Spiral',
      SAB: 'Intermediate Spiral',
      SA: 'Spiral',
      S0: 'Lenticular',
      S: 'Spiral',
      Im: 'Irregular',
      dSph: 'Dwarf Spheroidal',
      dE: 'Dwarf Elliptical'
    }
    for (const morp in galTab) {
      if (morpho.startsWith(morp)) {
        return galTab[morp]
      }
    }
    return ''
  },

  // Return a SweObj matching a passed sky source JSON object if it's already instanciated in SWE
  skySource2SweObj: function (ss) {
    if (!ss || !ss.model) {
      return undefined
    }
    const $stel = stelStore.stel
    let obj
    if (ss.model === 'tle_satellite') {
      const id = 'NORAD ' + ss.model_data.norad_number
      obj = $stel.getObj(id)
    } else if (ss.model === 'constellation' && ss.model_data.iau_abbreviation) {
      const id = 'CON western ' + ss.model_data.iau_abbreviation
      obj = $stel.getObj(id)
    }
    if (!obj) {
      obj = $stel.getObj(ss.names[0])
      if (!obj) obj = $stel.getObj("NAME "+ss.names[0])
    }
    if (!obj && ss.names[0].startsWith('Gaia DR2 ')) {
      const gname = ss.names[0].replace(/^Gaia DR2 /, 'GAIA ')
      obj = $stel.getObj(gname)
    }
    if (obj === null) return undefined
    return obj
  },

  lookupSkySourceByName: function (name) {
    return fetch(process.env.VUE_APP_NOCTUASKY_API_SERVER + '/api/v1/skysources/name/' + name)
      .then(function (response) {
        if (!response.ok) {
          throw response.body
        }
        return response.json()
      }, err => {
        throw err.response.body
      })
  },

  querySkySources: function (str, limit) {
    if (!limit) limit = 10
    return fetch(`${store.state.clientSettings.stelQueryUrl}?q=${encodeURIComponent(str.toLowerCase())}&limit=${limit}`)
      .then(function (response) {
        if (!response.ok) {
          throw response.body
        }
        return response.json()
      }, err => {
        throw err.response.body
      })
  },

  sweObj2SkySource: function (obj) {
    const names = obj.designations()
    const that = this

    if (!names || !names.length) {
      throw new Error("Can't find object without names")
    }

    // Several artifical satellites share the same common name, so we use
    // the unambiguous NORAD number instead
    for (const j in names) {
      if (names[j].startsWith('NORAD ')) {
        const tmpName = names[0]
        names[0] = names[j]
        names[j] = tmpName
      }
    }

    const printErr = function (n) {
      console.log("Couldn't find online skysource data for name: " + n)

      const ss = obj.jsonData
      if (!ss.model_data) {
        ss.model_data = {}
      }
      // Names fixup
      let i
      for (i in ss.names) {
        if (ss.names[i].startsWith('GAIA')) {
          ss.names[i] = ss.names[i].replace(/^GAIA /, 'Gaia DR2 ')
        }
      }
      ss.culturalNames = obj.culturalDesignations()
      return ss
    }

    return that.lookupSkySourceByName(names[0]).then(res => {
      return res
    }, () => {
      if (names.length === 1) return printErr(names)
      return that.lookupSkySourceByName(names[1]).then(res => {
        return res
      }, () => {
        if (names.length === 2) return printErr(names)
        return that.lookupSkySourceByName(names[2]).then(res => {
          return res
        }, () => {
          return printErr(names[2])
        })
      })
    }).then(res => {
      res.culturalNames = obj.culturalDesignations()
      return res
    })
  },

  setSweObjAsSelection: function (obj) {
    const $stel = stelStore.stel
    $stel.core.selection = obj
    $stel.pointAndLock(obj)
  },

  // Get data for a SkySource from wikipedia
  getSkySourceSummaryFromWikipedia: function (ss) {
    let title
    if (ss.model === 'jpl_sso') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase()
      if (['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'neptune', 'pluto'].indexOf(title) > -1) {
        title = title + '_(planet)'
      }
      if (ss.types[0] === 'Moo') {
        title = title + '_(moon)'
      }
    }
    if (ss.model === 'mpc_asteroid') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase()
    }
    if (ss.model === 'constellation') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase() + '_(constellation)'
    }
    if (ss.model === 'dso') {
      for (const i in ss.names) {
        if (ss.names[i].startsWith('M ')) {
          title = 'Messier_' + ss.names[i].substr(2)
          break
        }
        if (ss.names[i].startsWith('NGC ')) {
          title = ss.names[i]
          break
        }
        if (ss.names[i].startsWith('IC ')) {
          title = ss.names[i]
          break
        }
      }
    }
    if (ss.model === 'star') {
      for (const i in ss.names) {
        if (ss.names[i].startsWith('* ')) {
          title = this.cleanupOneSkySourceName(ss.names[i])
          break
        }
      }
    }
    if (!title) return Promise.reject(new Error("Can't find wikipedia compatible name"))

    return fetch('https://en.wikipedia.org/w/api.php?action=query&redirects&prop=extracts&exintro&exlimit=1&exchars=300&format=json&origin=*&titles=' + title,
      { headers: { 'Content-Type': 'application/json; charset=UTF-8' } })
      .then(response => {
        return response.json()
      })
  },


  delay: function (t, v) {
    return new Promise(function (resolve) {
      setTimeout(resolve.bind(null, v), t)
    })
  },

  getDistanceFromLatLonInM: function (lat1, lon1, lat2, lon2) {
    var deg2rad = function (deg) {
      return deg * (Math.PI / 180)
    }
    var R = 6371000 // Radius of the earth in m
    var dLat = deg2rad(lat2 - lat1)
    var dLon = deg2rad(lon2 - lon1)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in m
    return d
  },

  // Look for the next time starting from now on when the night Sky is visible
  // i.e. when sun is more than 10 degree below horizon.
  // If no such time was found (e.g. in a northern country in summer),
  // we default to current time.
  getTimeAfterSunset: function (stel) {
    const sun = stel.getObj('NAME Sun')
    const obs = stel.observer.clone()
    const utc = Math.floor(obs.utc * 24 * 60 / 5) / (24 * 60 / 5)
    let i
    for (i = 0; i < 24 * 60 / 5 + 1; i++) {
      obs.utc = utc + 1.0 / (24 * 60) * (i * 5)
      const sunRadec = sun.getInfo('RADEC', obs)
      const azalt = stel.convertFrame(obs, 'ICRF', 'OBSERVED', sunRadec)
      const alt = stel.anpm(stel.c2s(azalt)[1])
      if (alt < -13 * Math.PI / 180) {
        break
      }
    }
    if (i === 0 || i === 24 * 60 / 5 + 1) {
      return stel.observer.utc
    }
    return obs.utc
  },

  // Get the list of circumpolar stars in a given magnitude range
  //
  // Arguments:
  //   obs      - An observer.
  //   maxMag   - The maximum magnitude above which objects are discarded.
  //   filter   - a function called for each object returning false if the
  //              object must be filtered out.
  //
  // Return:
  //   An array SweObject. It is the responsibility of the caller to properly
  //   destroy all the objects of the list when they are not needed, by calling
  //   obj.destroy() on each of them.
  //
  // Example code:
  //   // Return all cicumpolar stars between mag -2 and 4
  //   let res = swh.getCircumpolarStars(this.$stel.observer, -2, 4)
  //   // Do something with the stars
  //   console.log(res.length)
  //   // Destroy the objects (don't forget this line!)
  //   res.map(e => e.destroy())
  getCircumpolarStars: function (obs, minMag, maxMag) {
    const $stel = stel
    const filter = function (obj) {
      if (obj.getInfo('vmag', obs) <= minMag) {
        return false
      }
      const posJNOW = $stel.convertFrame(obs, 'ICRF', 'JNOW', obj.getInfo('radec'))
      const radecJNOW = $stel.c2s(posJNOW)
      const decJNOW = $stel.anpm(radecJNOW[1])
      if (obs.latitude >= 0) {
        return decJNOW >= Math.PI / 2 - obs.latitude
      } else {
        return decJNOW <= -Math.PI / 2 + obs.latitude
      }
    }
    return $stel.core.stars.listObjs(obs, maxMag, filter)
  },

//   circumpolarMask: undefined,
//   showCircumpolarMask: function (obs, show) {
//     if (show === undefined) {
//       show = true
//     }
//     const layer = Vue.prototype.$skyHintsLayer
//     const $stel = stel
//     if (this.circumpolarMask) {
//       layer.remove(this.circumpolarMask)
//       this.circumpolarMask = undefined
//     }
//     if (show) {
//       const diam = 2.0 * Math.PI - Math.abs(obs.latitude) * 2
//       const shapeParams = {
//         pos: [0, 0, obs.latitude > 0 ? -1 : 1, 0],
//         frame: $stel.FRAME_JNOW,
//         size: [diam, diam],
//         color: [0.1, 0.1, 0.1, 0.8],
//         border_color: [0.1, 0.1, 0.6, 1]
//       }
//       this.circumpolarMask = layer.add('circle', shapeParams)
//     }
//   }
}

export default swh