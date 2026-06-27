import { resolveLandscapeSource } from "../components/stellarium/stelUtil.js";

const activeLandscapes = new WeakMap();

export const stelModule = {
  state: {
    settings: {
      loc: {},
      stellarium: {
        constellationsLinesVisible: true,
        azimuthalLinesVisible: false,
        equatorialLinesVisible: false,
        meridianLinesVisible: false,
        eclipticLinesVisible: false,
        atmosphereVisible: true,
        landscapesVisible: true,
        landscapeSourceMode: 'default',
        customLandscapeUrl: '',
        customLandscapeKey: 'custom',
        dsosVisible: true,
      },
    }
  },
  actions: {
    updateStellariumCore: ({ state }) => {
      if (state.stel) {
        const core = state.stel.core;
        const settings = state.settings.stellarium

        core.constellations.lines_visible = settings.constellationsLinesVisible;
        core.constellations.labels_visible = settings.constellationsLinesVisible;
        core.lines.azimuthal.visible = settings.azimuthalLinesVisible;
        core.lines.equatorial.visible = settings.equatorialLinesVisible;
        core.lines.meridian.visible = settings.meridianLinesVisible;
        core.lines.ecliptic.visible = settings.eclipticLinesVisible;
        core.atmosphere.visible = settings.atmosphereVisible;
        core.dsos.visible = settings.dsosVisible; // Deep Sky Objects (Messier, NGC, etc.)

        const landscapeConfig = resolveLandscapeSource(settings, state.baseUrl);
        core.landscapes.visible = landscapeConfig.visible;
        console.log(landscapeConfig);

        if (landscapeConfig.visible && landscapeConfig.source) {
          const nextLandscapeSignature = `${landscapeConfig.source.key}|${landscapeConfig.source.url}`;

          if (activeLandscapes.get(core) !== nextLandscapeSignature) {
            core.landscapes.addDataSource(landscapeConfig.source);
            activeLandscapes.set(core, nextLandscapeSignature);
          }
        }

        console.log('Stellarium settings updated:',);
      }
    },
  },
}