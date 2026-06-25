export const stelModule = {
  state: {
    settings: {
      lat: 39,
      lon: -77,
      elev: 130
    }
  },
  actions: {
    updateStellariumCore() {
      if (this.stel) {
        const core = this.stel.core;

        core.constellations.lines_visible = settings.stellarium.constellationsLinesVisible;
        core.constellations.labels_visible = settings.stellarium.constellationsLinesVisible;
        core.lines.azimuthal.visible = settings.stellarium.azimuthalLinesVisible;
        core.lines.equatorial.visible = settings.stellarium.equatorialLinesVisible;
        core.lines.meridian.visible = settings.stellarium.meridianLinesVisible;
        core.lines.ecliptic.visible = settings.stellarium.eclipticLinesVisible;
        core.atmosphere.visible = settings.stellarium.atmosphereVisible;
        core.dsos.visible = settings.stellarium.dsosVisible; // Deep Sky Objects (Messier, NGC, etc.)

        const landscapeConfig = resolveLandscapeSource(settings.stellarium, this.baseUrl);
        core.landscapes.visible = landscapeConfig.visible;

        if (landscapeConfig.visible && landscapeConfig.source) {
          const nextLandscapeSignature = `${landscapeConfig.source.key}|${landscapeConfig.source.url}`;

          if (activeLandscapes.get(core) !== nextLandscapeSignature) {
            core.landscapes.addDataSource(landscapeConfig.source);
            activeLandscapes.set(core, nextLandscapeSignature);
          }
        }

        console.log('Stellarium settings updated:');
      }
    },
  },
}