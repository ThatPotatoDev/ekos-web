
export function degreesToHMS(deg) {
  const totalHours = deg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;
  const hStr = String(h);
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

export function degreesToDMS(deg) {
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${sign}${dStr}:${mStr}:${sStr}`;
}

export function rad2deg(rad) {
  return rad * (180 / Math.PI);
}


// landscape

function normalizeBaseUrl(baseUrl) {
  const safeBaseUrl = (baseUrl || '').trim();
  if (!safeBaseUrl) return '';

  return safeBaseUrl.endsWith('/') ? safeBaseUrl : `${safeBaseUrl}/`;
}

function buildRelativeUrl(baseUrl, relativePath) {
  const normalizedRelative = (relativePath || '').replace(/^\.\//, '').replace(/^\//, '');
  return `${normalizeBaseUrl(baseUrl)}${normalizedRelative}`;
}

function normalizeLandscapeUrl(rawUrl, baseUrl) {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) return '';

  if (/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  return buildRelativeUrl(baseUrl, trimmedUrl);
}

export function resolveLandscapeSource(stellariumSettings, baseUrl) {
  if (!stellariumSettings?.landscapesVisible) {
    return {
      visible: false,
      source: null,
    };
  }

  if (stellariumSettings.landscapeSourceMode === 'neutral') {
    return {
      visible: true,
      source: {
        url: buildRelativeUrl(baseUrl, 'landscapes/gray'),
        key: 'gray',
      },
    };
  }

  if (stellariumSettings.landscapeSourceMode === 'custom') {
    const customUrl = normalizeLandscapeUrl(stellariumSettings.customLandscapeUrl, baseUrl);
    const customKey = (stellariumSettings.customLandscapeKey || 'custom').trim() || 'custom';

    if (customUrl) {
      return {
        visible: true,
        source: {
          url: customUrl,
          key: customKey,
        },
      };
    }
  }

  return {
    visible: true,
    source: {
      url: buildRelativeUrl(baseUrl, 'landscapes/guereins'),
      key: 'guereins',
    },
  };
}