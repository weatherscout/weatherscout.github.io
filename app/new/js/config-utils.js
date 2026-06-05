window.debugModeEnabled = false;
window.appTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
window.appDstMode = "auto";
window.appHourMode = "auto";
window.myLocationEnabled = false;
window.myLocationMarker = null;
window.myLocationInterval = null;
window.alertSoundsMap = {};
window.searchLocationsEnabled = true;
window.searchRadarsMax = 3;
window.searchAlertsMax = 3;
window.searchOutlooksMax = 3;
window.searchSettingsMax = 3;
window.hiddenAlertTypes = new Set();

window.layerIds = {
  radar: "weather-radar-layer",
  alertsZone: "alerts-zone-layer",
  alertsZoneBorder: "alerts-zone-border-layer",
  alertsPolygon: "alerts-polygon-layer",
  alertsPolygonBorder: "alerts-polygon-border-layer",
  radarSites: "nws-radar-sites-layer",
  singleSiteRadar: "single-site-radar-layer",
  alertsMd: "alerts-md-layer",
  alertsMdBorder: "alerts-md-border-layer",
  alertsPolyWatch: "alerts-poly-watch-layer",
  alertsPolyWatchBorder: "alerts-poly-watch-border-layer",
  spc: {
    day1: {
      cat: "spc-day1-cat",
      torn: "spc-day1-torn",
      hail: "spc-day1-hail",
      wind: "spc-day1-wind",
    },
    day2: {
      cat: "spc-day2-cat",
      torn: "spc-day2-torn",
      hail: "spc-day2-hail",
      wind: "spc-day2-wind",
    },
    day3: { cat: "spc-day3-cat", prob: "spc-day3-prob" },
    day4: { prob: "spc-day4-prob" },
    day5: { prob: "spc-day5-prob" },
    day6: { prob: "spc-day6-prob" },
    day7: { prob: "spc-day7-prob" },
    day8: { prob: "spc-day8-prob" },
  },
};

window.baseSpcLayerIds = Object.values(window.layerIds.spc).flatMap((day) =>
  Object.values(day),
);
window.allSpcLayerIds = window.baseSpcLayerIds.flatMap((id) => [
  id,
  `${id}-border`,
]);

window.alertColorMap = {
  "Tsunami Warning": "#FD6347",
  "Tornado Warning": "#FF0000",
  "Extreme Wind Warning": "#FF8C00",
  "Severe Thunderstorm Warning": "#FFA500",
  "Flash Flood Warning": "#8B0000",
  "Flash Flood Statement": "#8B0000",
  "Severe Weather Statement": "#00FFFF",
  "Shelter In Place Warning": "#FA8072",
  "Evacuation Immediate": "#7FFF00",
  "Civil Danger Warning": "#FFB6C1",
  "Nuclear Power Plant Warning": "#4B0082",
  "Radiological Hazard Warning": "#4B0082",
  "Hazardous Materials Warning": "#4B0082",
  "Fire Warning": "#A0522D",
  "Civil Emergency Message": "#FFB6C1",
  "Law Enforcement Warning": "#C0C0C0",
  "Storm Surge Warning": "#B524F7",
  "Hurricane Force Wind Warning": "#CD5C5C",
  "Hurricane Warning": "#DC143C",
  "Typhoon Warning": "#DC143C",
  "Special Marine Warning": "#FFA500",
  "Blizzard Warning": "#FF4500",
  "Snow Squall Warning": "#C71585",
  "Ice Storm Warning": "#8B008B",
  "Heavy Freezing Spray Warning": "#00BFFF",
  "Winter Storm Warning": "#FF69B4",
  "Lake Effect Snow Warning": "#008B8B",
  "Dust Storm Warning": "#FFE4C4",
  "Blowing Dust Warning": "#FFE4C4",
  "High Wind Warning": "#DAA520",
  "Tropical Storm Warning": "#B22222",
  "Storm Warning": "#9400D3",
  "Tsunami Advisory": "#D2691E",
  "Tsunami Watch": "#FF00FF",
  "Avalanche Warning": "#1E90FF",
  "Earthquake Warning": "#8B4513",
  "Volcano Warning": "#2F4F4F",
  "Ashfall Warning": "#A9A9A9",
  "Flood Warning": "#00FF00",
  "Coastal Flood Warning": "#228B22",
  "Lakeshore Flood Warning": "#228B22",
  "Ashfall Advisory": "#696969",
  "High Surf Warning": "#228B22",
  "Extreme Heat Warning": "#C71585",
  "Tornado Watch": "#FFFF00",
  "Severe Thunderstorm Watch": "#DB7093",
  "Flash Flood Watch": "#2E8B57",
  "Gale Warning": "#DDA0DD",
  "Flood Statement": "#00FF00",
  "Extreme Cold Warning": "#0000FF",
  "Freeze Warning": "#483D8B",
  "Red Flag Warning": "#FF1493",
  "Storm Surge Watch": "#DB7FF7",
  "Hurricane Watch": "#FF00FF",
  "Hurricane Force Wind Watch": "#9932CC",
  "Typhoon Watch": "#FF00FF",
  "Tropical Storm Watch": "#F08080",
  "Storm Watch": "#FFE4B5",
  "Tropical Cyclone Local Statement": "#FFE4B5",
  "Winter Weather Advisory": "#7B68EE",
  "Avalanche Advisory": "#CD853F",
  "Cold Weather Advisory": "#AFEEEE",
  "Heat Advisory": "#FF7F50",
  "Flood Advisory": "#00FF7F",
  "Coastal Flood Advisory": "#7CFC00",
  "Lakeshore Flood Advisory": "#7CFC00",
  "High Surf Advisory": "#BA55D3",
  "Dense Fog Advisory": "#708090",
  "Dense Smoke Advisory": "#F0E68C",
  "Small Craft Advisory": "#D8BFD8",
  "Brisk Wind Advisory": "#D8BFD8",
  "Hazardous Seas Warning": "#D8BFD8",
  "Dust Advisory": "#BDB76B",
  "Blowing Dust Advisory": "#BDB76B",
  "Lake Wind Advisory": "#D2B48C",
  "Wind Advisory": "#D2B48C",
  "Frost Advisory": "#6495ED",
  "Freezing Fog Advisory": "#008080",
  "Freezing Spray Advisory": "#00BFFF",
  "Low Water Advisory": "#A52A2A",
  "Local Area Emergency": "#C0C0C0",
  "Winter Storm Watch": "#4682B4",
  "Rip Current Statement": "#40E0D0",
  "Beach Hazards Statement": "#40E0D0",
  "Gale Watch": "#FFC0CB",
  "Avalanche Watch": "#F4A460",
  "Hazardous Seas Watch": "#483D8B",
  "Heavy Freezing Spray Watch": "#BC8F8F",
  "Flood Watch": "#2E8B57",
  "Coastal Flood Watch": "#66CDAA",
  "Lakeshore Flood Watch": "#66CDAA",
  "High Wind Watch": "#B8860B",
  "Extreme Heat Watch": "#800000",
  "Extreme Cold Watch": "#5F9EA0",
  "Freeze Watch": "#00FFFF",
  "Fire Weather Watch": "#FFDEAD",
  "Extreme Fire Danger": "#E9967A",
  "911 Telephone Outage": "#C0C0C0",
  "Coastal Flood Statement": "#6B8E23",
  "Lakeshore Flood Statement": "#6B8E23",
  "Special Weather Statement": "#FFE4B5",
  "Marine Weather Statement": "#FFDAB9",
  "Air Quality Alert": "#808080",
  "Air Stagnation Advisory": "#808080",
  "Hazardous Weather Outlook": "#EEE8AA",
  "Hydrologic Outlook": "#90EE90",
  "Short Term Forecast": "#98FB98",
  "Administrative Message": "#C0C0C0",
  "Child Abduction Emergency": "#FFFFFF",
  "Blue Alert": "#FFFFFF",
  Test: "#F0FFFF",
};

window.outlookTypes = {
  1: ["cat", "torn", "wind", "hail"],
  2: ["cat", "torn", "wind", "hail"],
  3: ["cat", "prob"],
  4: ["prob"],
  5: ["prob"],
  6: ["prob"],
  7: ["prob"],
  8: ["prob"],
};

window.typeLabels = {
  cat: "Categorical",
  torn: "Tornado",
  wind: "Wind",
  hail: "Hail",
  prob: "Prob.",
};

window.AUDIO_OPTIONS = [
  { label: "None", value: "none" },
  {
    label: "Beep Warning",
    value:
      "https://raw.githubusercontent.com/weatherscout/weatherscout.github.io/main/app/audio/beep_warning.mp3",
  },
  {
    label: "Radio Wave",
    value:
      "https://raw.githubusercontent.com/weatherscout/weatherscout.github.io/main/app/audio/radio_wave.mp3",
  },
  {
    label: "Short Beep",
    value:
      "https://raw.githubusercontent.com/weatherscout/weatherscout.github.io/main/app/audio/short_beep.mp3",
  },
  {
    label: "Woosh 1",
    value:
      "https://raw.githubusercontent.com/weatherscout/weatherscout.github.io/main/app/audio/woosh1.mp3",
  },
  {
    label: "Woosh 2",
    value:
      "https://raw.githubusercontent.com/weatherscout/weatherscout.github.io/main/app/audio/woosh2.mp3",
  },
];

const TZ_ABBREV_MINS = {
  BIT: -720,
  SST: -660,
  HST: -600,
  HAST: -600,
  AKST: -540,
  HDT: -540,
  HADT: -540,
  PST: -480,
  AKDT: -480,
  MST: -420,
  PDT: -420,
  CST: -360,
  MDT: -360,
  EST: -300,
  CDT: -300,
  AST: -240,
  EDT: -240,
  ADT: -180,
  CHST: 600,
  WAKT: 720,
};

window.PersistentCache = {
  DB_NAME: "WeatherScoutDB",
  STORE_NAME: "ZoneGeometries",
  DB_VERSION: 1,
  EXPIRY: 86400000,
  db: null,
  init: () => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(
        window.PersistentCache.DB_NAME,
        window.PersistentCache.DB_VERSION,
      );
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(window.PersistentCache.STORE_NAME);
      };
      req.onsuccess = (e) => {
        window.PersistentCache.db = e.target.result;
        resolve();
      };
      req.onerror = (e) => reject(e);
    });
  },
  get: (key) => {
    return new Promise((resolve) => {
      if (!window.PersistentCache.db) return resolve(null);
      const tx = window.PersistentCache.db.transaction(
        window.PersistentCache.STORE_NAME,
        "readonly",
      );
      const req = tx.objectStore(window.PersistentCache.STORE_NAME).get(key);
      req.onsuccess = () => {
        const val = req.result;
        if (val && Date.now() - val.ts < window.PersistentCache.EXPIRY)
          resolve(val.data);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  },
  set: (key, data) => {
    if (!window.PersistentCache.db || !data) return;
    const tx = window.PersistentCache.db.transaction(
      window.PersistentCache.STORE_NAME,
      "readwrite",
    );
    tx.objectStore(window.PersistentCache.STORE_NAME).put(
      { ts: Date.now(), data },
      key,
    );
  },
};

window.getOffsetMins = function (date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const off = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  const m = off.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  return (m[1] === "+" ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3] || 0));
};

window.getEffectiveTz = function () {
  const tz = window.appTimeZone;
  if (tz.startsWith("FIXED:")) return tz;
  if (window.appDstMode === "auto") return tz;
  try {
    const jan = new Date(Date.UTC(2024, 0, 15));
    const jul = new Date(Date.UTC(2024, 6, 15));
    const janMins = window.getOffsetMins(jan, tz);
    const julMins = window.getOffsetMins(jul, tz);
    if (janMins === julMins) return tz;
    const dstMins = Math.max(janMins, julMins);
    const stdMins = Math.min(janMins, julMins);
    const targetMins = window.appDstMode === "daylight" ? dstMins : stdMins;
    const etcHours = -Math.round(targetMins / 60);
    const candidate =
      etcHours === 0
        ? "Etc/GMT"
        : "Etc/GMT" + (etcHours > 0 ? "+" : "") + etcHours;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: candidate });
      return candidate;
    } catch (e) {
      return tz;
    }
  } catch (e) {
    return tz;
  }
};

window.getHour12 = function () {
  if (window.appHourMode === "12") return true;
  if (window.appHourMode === "24") return false;
  const tz = window.appTimeZone;
  const utcZero =
    tz === "UTC" ||
    tz === "Etc/GMT" ||
    (tz.startsWith("FIXED:") && parseInt(tz.slice(6), 10) === 0);
  if (utcZero) return false;
  return undefined;
};

window.formatDateWithTz = function (date, tz, options) {
  if (!tz || !tz.startsWith("FIXED:")) {
    return date.toLocaleString("en-US", { ...options, timeZone: tz || "UTC" });
  }
  const offsetMins = parseInt(tz.slice(6), 10);
  const shifted = new Date(date.getTime() + offsetMins * 60000);
  return shifted.toLocaleString("en-US", { ...options, timeZone: "UTC" });
};

window.formatDateFull = function (date, tz) {
  const opts = {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
    hour12: window.getHour12(),
  };
  if (!tz || !tz.startsWith("FIXED:")) {
    return date.toLocaleString("en-US", { ...opts, timeZone: tz || "UTC" });
  }
  const offsetMins = parseInt(tz.slice(6), 10);
  const shifted = new Date(date.getTime() + offsetMins * 60000);
  return shifted.toLocaleString("en-US", { ...opts, timeZone: "UTC" });
};

window.getSmartDateOptions = function (date, otherDate, tz) {
  const effectiveTz = tz || window.getEffectiveTz();
  const alertDateStr = date.toLocaleString("en-US", {
    timeZone: effectiveTz,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
  const nowDateStr = new Date().toLocaleString("en-US", {
    timeZone: effectiveTz,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
  let otherDateStr = null;
  if (otherDate) {
    otherDateStr = otherDate.toLocaleString("en-US", {
      timeZone: effectiveTz,
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  }
  const isToday = alertDateStr === nowDateStr;
  const sameDayAsOther = otherDateStr ? alertDateStr === otherDateStr : true;
  if (isToday && sameDayAsOther) {
    return { hour: "numeric", minute: "numeric", hour12: window.getHour12() };
  } else {
    return {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: window.getHour12(),
    };
  }
};

window.formatAlertTimeRange = function (sentIso, expIso) {
  let sentStr = "",
    expStr = "";
  const tz = window.getEffectiveTz();
  const sDate = sentIso ? new Date(sentIso) : null;
  const eDate = expIso ? new Date(expIso) : null;
  if (sDate && !isNaN(sDate.getTime())) {
    sentStr = window.formatDateWithTz(
      sDate,
      tz,
      window.getSmartDateOptions(sDate, eDate),
    );
  }
  if (eDate && !isNaN(eDate.getTime())) {
    expStr = window.formatDateWithTz(
      eDate,
      tz,
      window.getSmartDateOptions(eDate, sDate),
    );
  }
  if (sentStr && expStr) return `${sentStr} to ${expStr}`;
  if (sentStr) return `Sent: ${sentStr}`;
  if (expStr) return `Expires: ${expStr}`;
  return "";
};

window.formatNwsText = function (text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\n+/g, "@@PARA@@")
    .replace(/\n/g, " ")
    .replace(/@@PARA@@/g, "<br><br>")
    .trim();
};

window.formatThreatValue = function (value) {
  if (!value || typeof value !== "string") return "";
  const cleanedValue = value.toUpperCase() === "N/A" ? "" : value;
  if (!cleanedValue) return "";
  return cleanedValue
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

window.formatSpcLabel = function (val) {
  if (!val) return "N/A";
  if (!isNaN(val))
    return parseFloat(val) < 1 ? parseFloat(val) * 100 + "%" : val + "%";
  const m = {
    TSTM: "General Thunderstorm",
    MRGL: "Marginal",
    SLGT: "Slight",
    ENH: "Enhanced",
    MDT: "Moderate",
    HIGH: "High",
  };
  return m[val.toUpperCase()] || val;
};

window.minsToStoredTz = function (totalMins) {
  if (totalMins === 0) return "UTC";
  if (totalMins % 60 === 0) {
    const etcN = -(totalMins / 60);
    const candidate = "Etc/GMT" + (etcN > 0 ? "+" : "") + etcN;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: candidate });
      return candidate;
    } catch (e) {}
  }
  return "FIXED:" + totalMins;
};

window.resolveCustomInput = function (raw) {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (!trimmed) return null;
  if (
    upper === "UTC" ||
    upper === "UT" ||
    upper === "Z" ||
    upper === "UTC+0" ||
    upper === "UTC-0" ||
    upper === "UTC+00" ||
    upper === "UTC+00:00"
  )
    return "UTC";
  if (upper === "GMT") return "GMT";
  if (Object.prototype.hasOwnProperty.call(TZ_ABBREV_MINS, upper)) {
    return window.minsToStoredTz(TZ_ABBREV_MINS[upper]);
  }
  const m = upper.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const sign = m[1] === "+" ? 1 : -1;
  const hours = parseInt(m[2], 10);
  const minutes = parseInt(m[3] || "0", 10);
  if (hours > 14 || minutes >= 60 || (hours === 14 && minutes > 0)) return null;
  return window.minsToStoredTz(sign * (hours * 60 + minutes));
};

window.tzToDisplay = function (tz) {
  if (!tz) return "";
  if (tz === "UTC" || tz === "GMT") return tz;
  if (tz.startsWith("FIXED:")) {
    const mins = parseInt(tz.slice(6), 10);
    const sign = mins >= 0 ? "+" : "-";
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return "UTC" + sign + h + (m ? ":" + String(m).padStart(2, "0") : "");
  }
  if (tz.startsWith("Etc/GMT")) {
    const rest = tz.slice(7);
    if (!rest) return "UTC";
    const etcSign = rest[0];
    const etcN = parseInt(rest.slice(1), 2);
    const utcSign = etcSign === "+" ? "-" : "+";
    return "UTC" + utcSign + etcN;
  }
  return tz;
};

window.isFixedOffset = function (tz) {
  return (
    tz === "UTC" ||
    tz === "GMT" ||
    tz.startsWith("Etc/GMT") ||
    tz.startsWith("FIXED:")
  );
};

window.isUTCZero = function (tz) {
  if (tz === "UTC" || tz === "Etc/GMT") return true;
  if (tz.startsWith("FIXED:")) return parseInt(tz.slice(6), 10) === 0;
  return false;
};
