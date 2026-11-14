window.alertsEnabled = true;
window.zoneAlertsEnabled = true;
window.mesoDiscussionsEnabled = true;
window.fasterUpdatesEnabled = false;
window.activeSpcDay = "none";
window.activeSpcType = "none";
window.globalPolyAlerts = [];
window.globalZoneAlerts = [];
window.globalMdAlerts = [];
window.globalPolyWatchAlerts = [];
window.alertQueue = [];
window.knownAlertIds = new Set();
window.newAlertIds = new Set();
window.updatedAlertIds = new Set();
window.isDisplayingAlert = false;
window.isInitialLoad = true;
window.spcSourceCache = {};
window.spcIssueSnapshots = {};
window.nwsUpdateInterval = null;
window.placefileUpdateInterval = null;
window.motionVectorsEnabled = true;
window.stormReportsMarkers = [];
window.stormReportsInterval = null;

window.updateMotionVectorsVisibility = function () {
  if (!window.map || !window.map.getLayer("alerts-arrows-layer")) return;
  const visibility =
    window.alertsEnabled && window.motionVectorsEnabled ? "visible" : "none";
  window.map.setLayoutProperty("alerts-arrows-layer", "visibility", visibility);
};

const SPC_CONV_BASE =
  "https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer";
const SPC_FIRE_BASE =
  "https://mapservices.weather.noaa.gov/vector/rest/services/fire_weather/SPC_firewx/MapServer";

const spcSourceDefs = [
  ["spc-day1-cat", SPC_CONV_BASE, 1],
  ["spc-day1-torn", SPC_CONV_BASE, 3],
  ["spc-day1-torn-cig", SPC_CONV_BASE, 2],
  ["spc-day1-hail", SPC_CONV_BASE, 5],
  ["spc-day1-hail-cig", SPC_CONV_BASE, 4],
  ["spc-day1-wind", SPC_CONV_BASE, 7],
  ["spc-day1-wind-cig", SPC_CONV_BASE, 6],
  ["spc-day1-fire-cat", SPC_FIRE_BASE, 1],
  ["spc-day1-fire-dryt", SPC_FIRE_BASE, 2],
  ["spc-day2-cat", SPC_CONV_BASE, 9],
  ["spc-day2-torn", SPC_CONV_BASE, 11],
  ["spc-day2-torn-cig", SPC_CONV_BASE, 10],
  ["spc-day2-hail", SPC_CONV_BASE, 13],
  ["spc-day2-hail-cig", SPC_CONV_BASE, 12],
  ["spc-day2-wind", SPC_CONV_BASE, 15],
  ["spc-day2-wind-cig", SPC_CONV_BASE, 14],
  ["spc-day2-fire-cat", SPC_FIRE_BASE, 4],
  ["spc-day2-fire-dryt", SPC_FIRE_BASE, 5],
  ["spc-day3-cat", SPC_CONV_BASE, 17],
  ["spc-day3-prob", SPC_CONV_BASE, 19],
  ["spc-day3-prob-cig", SPC_CONV_BASE, 18],
  ["spc-day3-fire-cat", SPC_FIRE_BASE, 8],
  ["spc-day3-fire-dryt", SPC_FIRE_BASE, 7],
  ["spc-day4-prob", SPC_CONV_BASE, 21],
  ["spc-day4-fire-cat", SPC_FIRE_BASE, 11],
  ["spc-day4-fire-dryt", SPC_FIRE_BASE, 10],
  ["spc-day5-prob", SPC_CONV_BASE, 22],
  ["spc-day5-fire-cat", SPC_FIRE_BASE, 14],
  ["spc-day5-fire-dryt", SPC_FIRE_BASE, 13],
  ["spc-day6-prob", SPC_CONV_BASE, 23],
  ["spc-day6-fire-cat", SPC_FIRE_BASE, 17],
  ["spc-day6-fire-dryt", SPC_FIRE_BASE, 16],
  ["spc-day7-prob", SPC_CONV_BASE, 24],
  ["spc-day7-fire-cat", SPC_FIRE_BASE, 20],
  ["spc-day7-fire-dryt", SPC_FIRE_BASE, 19],
  ["spc-day8-prob", SPC_CONV_BASE, 25],
  ["spc-day8-fire-cat", SPC_FIRE_BASE, 23],
  ["spc-day8-fire-dryt", SPC_FIRE_BASE, 22],
];

window.spcSources = spcSourceDefs.map(([id, base, layer]) => ({
  id,
  url: `${base}/${layer}/query?where=1%3D1&outFields=*&f=geojson`,
}));

const spcCatOrder = ["HIGH", "MDT", "ENH", "SLGT", "MRGL", "TSTM"];

function getFeatureLabel(props) {
  if (!props) return "";
  return (
    props.LABEL ||
    props.LABEL2 ||
    props.label ||
    props.label2 ||
    ""
  ).toString();
}

function clearMapSource(sourceId) {
  const src = window.map?.getSource(sourceId);
  if (src) src.setData({ type: "FeatureCollection", features: [] });
}

window.getAlertColor = function (props) {
  const event = props.event;
  const params = props.parameters || {};
  if (event === "Tornado Warning") {
    const threat = params.tornadoDamageThreat?.[0];
    if (threat === "CATASTROPHIC") return "#E066FF";
    if (threat === "CONSIDERABLE") return "#FF66CC";
    return "#FF0000";
  }
  if (event === "Severe Thunderstorm Warning") {
    const threat = params.thunderstormDamageThreat?.[0];
    if (threat === "DESTRUCTIVE") return "#FF7000";
    if (threat === "CONSIDERABLE") return "#FF9000";
    if (params.tornadoDetection?.[0] === "POSSIBLE") return "#FFA020";
    return "#FFA500";
  }
  if (event && event.includes("Mesoscale Discussion")) return "#0000FF";
  return window.alertColorMap[event] || "#808080";
};

window.parseApiDate = function (dateString) {
  return new Date(dateString);
};

window.getSpecificAlertName = function (props) {
  const event = props.event;
  const params = props.parameters || {};
  let watchSuffix = "";
  const isConvectiveWatch =
    event === "Tornado Watch" || event === "Severe Thunderstorm Watch";
  if (params.VTEC && params.VTEC[0] && isConvectiveWatch) {
    const parts = params.VTEC[0].split(".");
    if (parts.length >= 6) {
      watchSuffix = " " + parseInt(parts[5], 10).toString();
    }
  }
  if (event === "Tornado Warning") return "Tornado Warning";
  if (event === "Severe Thunderstorm Warning") {
    const threat = params.thunderstormDamageThreat?.[0];
    if (threat === "DESTRUCTIVE") return "Destructive Thunderstorm";
    if (threat === "CONSIDERABLE") return "Considerable Thunderstorm";
    if (params.tornadoDetection?.[0] === "POSSIBLE") return "Tornado Possible";
  }
  if (
    event === "Special Marine Warning" ||
    event === "Marine Weather Statement"
  ) {
    const threat = params.waterspoutDetection?.[0];
    if (threat === "OBSERVED") return "Confirmed Waterspout";
    if (threat === "POSSIBLE") return "Waterspout Possible";
  }
  if (event === "Flash Flood Warning") return "Flash Flood Warning";
  return event + watchSuffix;
};

window.processRawAlertFeatures = async function (
  raw,
  filterType,
  isSilent = false,
) {
  if (!window.alertsEnabled) return;
  const valid = raw.filter(window.isValidAlert);
  const poly = [];
  const zone = [];

  valid.forEach((f) => {
    f.properties.specificEventName = window.getSpecificAlertName(f.properties);
    f.properties.displayColor = window.getAlertColor(f.properties);

    if (
      f.properties.event === "Tornado Watch" ||
      f.properties.event === "Severe Thunderstorm Watch"
    ) {
      const params = f.properties.parameters || {};
      if (params.VTEC && params.VTEC[0]) {
        const parts = params.VTEC[0].split(".");
        if (parts.length >= 6) {
          const watchNum = parts[5];
          const url = `https://www.spc.noaa.gov/products/watch/ww${watchNum}.html`;
          const isNewOrUpdated =
            !window.knownAlertIds.has(f.properties.id) ||
            (f.properties.messageType === "Update" &&
              !window.updatedAlertIds.has(f.properties.id));
          window.fetchMdWatchText(`ww${watchNum}`, url, isNewOrUpdated);
        }
      }
    }

    if (f.properties.event === "Tornado Warning") {
      if (!f.properties.parameters) f.properties.parameters = {};
      const params = f.properties.parameters;
      const desc = f.properties.description || "";
      const sourceMatch = desc.match(/SOURCE\.+\s*([^.\n\r]+)/i);
      let finalSource =
        sourceMatch && sourceMatch[1]
          ? sourceMatch[1].trim()
          : params.tornadoDetection?.[0] || "";
      if (finalSource) {
        const threat = (params.tornadoDamageThreat?.[0] || "").toUpperCase();
        if (threat === "CONSIDERABLE" || threat === "CATASTROPHIC") {
          const lowerThreat = threat.toLowerCase();
          const tornadoRegex = /\s+(tornado)/i;
          if (tornadoRegex.test(finalSource)) {
            finalSource = finalSource.replace(
              tornadoRegex,
              ", " + lowerThreat + " $1",
            );
          }
        }
        params.tornadoDetection = [finalSource];
        if (sourceMatch && sourceMatch[1]) {
          f.properties.customTornadoSource = true;
        }
      }
    }

    if (f.properties.event === "Flash Flood Warning") {
      if (!f.properties.parameters) f.properties.parameters = {};
      const params = f.properties.parameters;
      const desc = f.properties.description || "";
      const sourceMatch = desc.match(/SOURCE\.+\s*([^.\n\r]+)/i);
      const finalSource =
        sourceMatch && sourceMatch[1]
          ? sourceMatch[1].trim()
          : params.flashFloodDetection?.[0] || "";
      params.flashFloodDetection = [finalSource];
      if (sourceMatch && sourceMatch[1]) {
        f.properties.customFlashFloodSource = true;
      }
    }

    if (f.geometry) {
      f.properties.geometryType = "polygon";
      poly.push(f);
    } else {
      f.properties.geometryType = "zone";
      zone.push(f);
    }
  });

  if (filterType === "polygon") {
    poly.forEach((f) => {
      f.properties.priorityScore = window.getAlertPriorityScore(f);
    });
    if (window.map.getSource("alerts-poly")) {
      window.map
        .getSource("alerts-poly")
        .setData({ type: "FeatureCollection", features: poly });
    }
    window.globalPolyAlerts = poly;
    const arrowFeatures = [];
    poly.forEach((f) => {
      if (f.properties.parameters?.eventMotionDescription) {
        const motions = window.parseEventMotion(f);
        if (motions.length > 0) {
          const color = f.properties.displayColor || "#FF0000";
          motions.forEach((motion) => {
            arrowFeatures.push(window.createArrowFeature(motion, color));
          });
        }
      }
    });
    if (window.map.getSource("alerts-arrows")) {
      window.map
        .getSource("alerts-arrows")
        .setData({ type: "FeatureCollection", features: arrowFeatures });
    }
    poly.forEach((f) => window.addNewAlertToQueue(f, "alert", isSilent));
  } else if (filterType === "zone" && window.zoneAlertsEnabled) {
    await window.processZoneAlerts(zone, isSilent);
  }
};

window.isValidAlert = function (feature) {
  const props = feature.properties;
  if (!props) return false;
  if (props.parameters?.VTEC?.[0]?.startsWith("/O.CAN.")) return false;
  return true;
};

window.getDestinationCoords = function (lon, lat, bearing, distanceKm) {
  const R = 6371;
  const brng = (bearing * Math.PI) / 180;
  const dR = distanceKm / R;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dR) +
      Math.cos(lat1) * Math.sin(dR) * Math.cos(brng),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(dR) * Math.cos(lat1),
      Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
};

window.parseEventMotion = function (f) {
  const params = f.properties.parameters || {};
  const motionArr = params.eventMotionDescription;
  if (!motionArr || !motionArr[0]) return [];
  const parts = motionArr[0].split("...");
  if (parts.length < 5) return [];
  const bearingMatch = parts[2].match(/^(\d+)DEG$/i);
  const speedMatch = parts[3].match(/^(\d+)KT$/i);
  if (!bearingMatch || !speedMatch) return [];

  const bearingFrom = parseFloat(bearingMatch[1]);
  const speedKnots = parseFloat(speedMatch[1]);
  const bearing = (bearingFrom + 180) % 360;

  const coordPairs = parts[4].trim().split(/\s+/);
  const results = [];

  coordPairs.forEach((pair) => {
    const coords = pair.split(",");
    if (coords.length >= 2) {
      const lat = parseFloat(coords[0]);
      const lon = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        results.push({
          time: parts[0],
          type: parts[1],
          bearing,
          speed: speedKnots,
          lat,
          lon,
        });
      }
    }
  });

  return results;
};

window.createArrowFeature = function (motion, color) {
  const startLon = motion.lon;
  const startLat = motion.lat;
  const bearing = motion.bearing;
  const distanceKm = motion.speed * 1.852 * 0.5;
  const end = window.getDestinationCoords(
    startLon,
    startLat,
    bearing,
    distanceKm,
  );

  const wingLength = Math.max(0.6, distanceKm * 0.08);
  const leftWing = window.getDestinationCoords(
    end[0],
    end[1],
    (bearing + 162) % 360,
    wingLength,
  );
  const rightWing = window.getDestinationCoords(
    end[0],
    end[1],
    (bearing - 162 + 360) % 360,
    wingLength,
  );

  return {
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: [
        [[startLon, startLat], end],
        [end, leftWing],
        [end, rightWing],
      ],
    },
    properties: {
      displayColor: color || "#FF0000",
    },
  };
};

const EVENT_PRIORITY_MAP = {
  "Extreme Wind Warning": 8,
  "Tsunami Warning": 9,
  "Typhoon Warning": 10,
  "Hurricane Warning": 11,
  "Hurricane Force Wind Warning": 12,
  "Storm Warning": 13,
  "Tropical Storm Warning": 14,
  "Typhoon Watch": 15,
  "Hurricane Watch": 16,
  "Hurricane Force Wind Watch": 17,
  "Storm Surge Watch": 18,
  "Tropical Storm Watch": 19,
  "Tropical Cyclone Local Statement": 20,
  "Blizzard Warning": 24,
  "Ice Storm Warning": 25,
  "Snow Squall Warning": 26,
  "Lake Effect Snow Warning": 27,
  "Winter Storm Warning": 28,
  "Heavy Freezing Spray Warning": 29,
  "Extreme Heat Warning": 30,
  "Extreme Cold Warning": 31,
  "Dust Storm Warning": 32,
  "Blowing Dust Warning": 33,
  "High Wind Warning": 34,
  "Red Flag Warning": 35,
  "Extreme Fire Danger": 36,
  "Fire Warning": 37,
  "Avalanche Warning": 38,
  "Earthquake Warning": 39,
  "Volcano Warning": 40,
  "Ashfall Warning": 41,
  "Hazardous Seas Warning": 45,
  "Gale Warning": 47,
  "High Surf Warning": 48,
  "Coastal Flood Warning": 49,
  "Lakeshore Flood Warning": 50,
  "Flood Warning": 51,
  "Freeze Warning": 52,
  "Tornado Watch": 53,
  "Severe Thunderstorm Watch": 54,
  "Tsunami Watch": 55,
  "Flash Flood Watch": 56,
  "Winter Storm Watch": 57,
  "Avalanche Watch": 58,
  "Heavy Freezing Spray Watch": 59,
  "High Wind Watch": 60,
  "Extreme Heat Watch": 61,
  "Extreme Cold Watch": 62,
  "Freeze Watch": 71,
  "Tsunami Advisory": 72,
  "Flash Flood Statement": 73,
  "Severe Weather Statement": 74,
  "Special Weather Statement": 75,
  "Wind Advisory": 76,
  "Blowing Dust Advisory": 77,
  "Dust Advisory": 78,
  "Heat Advisory": 79,
  "Cold Weather Advisory": 80,
  "Winter Weather Advisory": 81,
  "Frost Advisory": 82,
  "Freezing Fog Advisory": 83,
  "Freezing Spray Advisory": 84,
  "Dense Fog Advisory": 85,
  "Dense Smoke Advisory": 86,
  "Air Quality Alert": 87,
  "Air Stagnation Advisory": 88,
  "Flood Statement": 89,
  "Lakeshore Flood Statement": 90,
  "Coastal Flood Statement": 91,
  "Rip Current Statement": 92,
  "Beach Hazards Statement": 93,
  "Flood Advisory": 94,
  "Coastal Flood Advisory": 95,
  "Lakeshore Flood Advisory": 96,
  "High Surf Advisory": 97,
  "Small Craft Advisory": 98,
  "Brisk Wind Advisory": 99,
  "Lake Wind Advisory": 100,
  "Low Water Advisory": 101,
  "Ashfall Advisory": 102,
  "Avalanche Advisory": 103,
  "Marine Weather Statement": 104,
  "Hazardous Weather Outlook": 105,
  "Hydrologic Outlook": 106,
  "Short Term Forecast": 107,
};

window.getAlertPriorityScore = function (feature) {
  const p = feature.properties;
  const event = p.event || "";
  const params = p.parameters || {};
  const dmg = (
    params.tornadoDamageThreat?.[0] ||
    params.thunderstormDamageThreat?.[0] ||
    params.flashFloodDamageThreat?.[0] ||
    ""
  ).toUpperCase();
  const det = (
    params.tornadoDetection?.[0] ||
    params.waterspoutDetection?.[0] ||
    ""
  ).toUpperCase();

  if (event === "Tornado Warning") {
    return dmg === "CATASTROPHIC" ? 1 : dmg === "CONSIDERABLE" ? 2 : 3;
  }
  if (event === "Severe Thunderstorm Warning") {
    if (dmg === "DESTRUCTIVE") return 4;
    if (dmg === "CONSIDERABLE") return 5;
    return det === "POSSIBLE" ? 6 : 7;
  }
  if (event === "Flash Flood Warning") {
    return dmg === "CATASTROPHIC" ? 21 : dmg === "CONSIDERABLE" ? 22 : 23;
  }
  if (event === "Special Marine Warning") {
    return det === "OBSERVED" ? 42 : det === "POSSIBLE" ? 43 : 44;
  }
  if (event.startsWith("Mesoscale Discussion")) return 108;
  if (event === "SPC Outlook") {
    const day = parseInt(p.spcDay, 10);
    return day >= 1 && day <= 8 ? 108 + day : 117;
  }
  return EVENT_PRIORITY_MAP[event] ?? 120;
};

let activeFlashTimeouts = [];
window.flashAlertOnMap = function (feature, duration = 7500) {
  if (!feature || !feature.geometry) return;
  const source = window.map.getSource("highlight-source");
  if (!source) return;
  activeFlashTimeouts.forEach(clearTimeout);
  activeFlashTimeouts = [];
  source.setData(feature);
  const bw = feature.properties.geometryType === "zone" ? 1 : 2;
  if (window.map.getLayer("highlight-line")) {
    window.map.setPaintProperty("highlight-line", "line-width", bw);
  }

  const setOpacity = (f, l) => {
    if (window.map.getLayer("highlight-fill"))
      window.map.setPaintProperty("highlight-fill", "fill-opacity", f);
    if (window.map.getLayer("highlight-line"))
      window.map.setPaintProperty("highlight-line", "line-opacity", l);
  };

  const segment = 750;
  for (let t = 0; t < duration; t += segment) {
    const isOff = (t / segment) % 2 !== 0;
    const timeoutId = setTimeout(() => {
      setOpacity(isOff ? 0 : 0.3, isOff ? 0 : 1.0);
    }, t);
    activeFlashTimeouts.push(timeoutId);
  }
  const endTimeoutId = setTimeout(() => {
    clearMapSource("highlight-source");
    setOpacity(0, 0);
  }, duration + 50);
  activeFlashTimeouts.push(endTimeoutId);
};

window.flyToAlert = function (feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return;
  const bounds = new maplibregl.LngLatBounds();
  try {
    const processCoords = (coords) => {
      for (const coord of coords) {
        if (Array.isArray(coord[0])) processCoords(coord);
        else bounds.extend(coord);
      }
    };
    processCoords(feature.geometry.coordinates);
    if (bounds.getNorthEast() && bounds.getSouthWest()) {
      window.map.fitBounds(bounds, { padding: 24, essential: true });
      window.map.once("moveend", () => window.flashAlertOnMap(feature, 7500));
    }
  } catch (e) {
    console.error("Fly to alert geometry parse failed.", e);
  }
};

window.createAndShowAlertPopup = function (feature, source) {
  const props = feature.properties;
  const params = props.parameters || {};
  const container = document.getElementById("alert-popup-container");
  const popup = document.createElement("div");
  popup.className = "alert-popup";

  const specificAlertName = props.specificEventName;
  const accentColor = props.displayColor || "#808080";
  const title =
    (props.messageType === "Update" ? "Updated - " : "") + specificAlertName;
  let detailsHTML = "<div>";

  if (props.event === "SPC Outlook") {
    detailsHTML += `<p><strong>Risk:</strong> ${window.formatSpcLabel(props.spcTopLabel)}</p>`;
  } else {
    const sentDate = window.parseApiDate(props.sent);
    const expireDate = window.parseApiDate(props.expires);
    if (expireDate && !isNaN(expireDate.getTime())) {
      detailsHTML += `<p><strong>Expires:</strong> ${window.formatDateWithTz(expireDate, window.getEffectiveTz(), window.getSmartDateOptions(expireDate, sentDate))}</p>`;
    }
    if (props.areaDesc && props.areaDesc.toUpperCase() !== "N/A") {
      detailsHTML += `<p class="alert-popup-area-clamp"><strong>Affected:</strong> ${props.areaDesc}</p>`;
    }
    if (
      params.tornadoDetection &&
      window.formatThreatValue(params.tornadoDetection[0])
    ) {
      detailsHTML += `<p><strong>Tornado:</strong> ${window.formatThreatValue(params.tornadoDetection[0])}</p>`;
    }
    if (
      params.waterspoutDetection &&
      window.formatThreatValue(params.waterspoutDetection[0])
    ) {
      detailsHTML += `<p><strong>Waterspout:</strong> ${window.formatThreatValue(params.waterspoutDetection[0])}</p>`;
    }

    const dmg =
      params.tornadoDamageThreat?.[0] ||
      params.thunderstormDamageThreat?.[0] ||
      params.flashFloodDamageThreat?.[0];
    if (dmg && window.formatThreatValue(dmg)) {
      detailsHTML += `<p><strong>Threat:</strong> ${window.formatThreatValue(dmg)}</p>`;
    }
    if (
      params.maxWindGust &&
      params.maxWindGust[0] !== "0 MPH" &&
      window.formatThreatValue(params.maxWindGust[0])
    ) {
      detailsHTML += `<p><strong>Winds:</strong> ${params.maxWindGust[0].replace("MPH", "mph")}${params.windThreat && window.formatThreatValue(params.windThreat[0]) ? ", " + window.formatThreatValue(params.windThreat[0]) : ""}</p>`;
    }
    if (
      params.maxHailSize &&
      params.maxHailSize[0] !== "0.00" &&
      window.formatThreatValue(params.maxHailSize[0])
    ) {
      detailsHTML += `<p><strong>Hail:</strong> ${params.maxHailSize[0]}"${params.hailThreat && window.formatThreatValue(params.hailThreat[0]) ? ", " + window.formatThreatValue(params.hailThreat[0]) : ""}</p>`;
    }
    if (
      params.flashFloodDetection &&
      window.formatThreatValue(params.flashFloodDetection[0])
    ) {
      detailsHTML += `<p><strong>Source:</strong> ${window.formatThreatValue(params.flashFloodDetection[0])}</p>`;
    }
  }
  popup.style.borderLeft = `5px solid ${accentColor}80`;
  popup.innerHTML = `<h4>${title}</h4>${detailsHTML}</div>`;

  popup.addEventListener("click", () => {
    if (props.event === "SPC Outlook") {
      const targetDay = String(props.spcDay);
      const targetType =
        props.spcType || (parseInt(targetDay, 10) >= 4 ? "prob" : "cat");
      if (
        window.activeSpcDay !== targetDay ||
        window.activeSpcType !== targetType
      ) {
        window.activeSpcDay = targetDay;
        window.activeSpcType = targetType;
        window.updateSpcLayerVisibility();
        window.saveCurrentState();
        window.updateGreenStatusIndicators();
      }
    } else {
      window.flyToAlert(feature);
    }
  });

  container.appendChild(popup);
  setTimeout(() => popup.classList.add("fly-in"), 10);
  setTimeout(() => {
    popup.classList.remove("fly-in");
    popup.classList.add("fly-out");
  }, 7000);
  setTimeout(() => {
    popup.remove();
    if (source === "new") {
      setTimeout(() => {
        window.isDisplayingAlert = false;
        window.displayNextAlert();
      }, 1000);
    }
  }, 7500);
};

window.displayNextAlert = function () {
  if (window.isDisplayingAlert || window.alertQueue.length === 0) return;
  const nextItem = window.alertQueue[0];
  if (!window.alertsEnabled && nextItem.type !== "spcOutlook") return;
  if (
    nextItem.feature.properties.geometryType === "zone" &&
    !window.zoneAlertsEnabled
  ) {
    window.alertQueue.shift();
    window.displayNextAlert();
    return;
  }
  if (
    nextItem.type !== "spcOutlook" &&
    window.hiddenAlertTypes.has(nextItem.feature.properties.event)
  ) {
    window.alertQueue.shift();
    window.displayNextAlert();
    return;
  }
  window.isDisplayingAlert = true;
  const { feature, type } = window.alertQueue.shift();
  if (type !== "spcOutlook") {
    window.flashAlertOnMap(feature, 7500);
  }
  window.createAndShowAlertPopup(feature, "new");

  const eventType = feature.properties.event;
  const soundUrl = window.alertSoundsMap[eventType];
  if (soundUrl && soundUrl !== "none" && window.playAlertSound) {
    window.playAlertSound(soundUrl, eventType);
  }
};

window.addNewAlertToQueue = function (feature, type, isSilent = false) {
  const id = feature.properties.id;
  const msgType = feature.properties.messageType;
  const isUpdate = msgType === "Update";
  const isNew = msgType === "Alert";

  const triggerPrefetch = () => {
    if (
      (id.startsWith("md") || id.startsWith("ww")) &&
      feature.properties.url
    ) {
      window.fetchMdWatchText(id, feature.properties.url, true);
    }
  };

  if (!window.knownAlertIds.has(id)) {
    window.knownAlertIds.add(id);
    if (isNew) window.newAlertIds.add(id);
    if (isUpdate) window.updatedAlertIds.add(id);
    triggerPrefetch();
    if (!window.isInitialLoad && !isSilent && window.alertsEnabled) {
      const score = window.getAlertPriorityScore(feature);
      feature.properties.priorityScore = score;
      window.alertQueue.push({ feature, type, score });
      window.alertQueue.sort((a, b) => a.score - b.score);
    }
  } else if (isUpdate && !window.updatedAlertIds.has(id)) {
    window.updatedAlertIds.add(id);
    window.newAlertIds.delete(id);
    triggerPrefetch();
    if (!window.isInitialLoad && !isSilent && window.alertsEnabled) {
      const score = window.getAlertPriorityScore(feature);
      feature.properties.priorityScore = score;
      window.alertQueue.push({ feature, type, score });
      window.alertQueue.sort((a, b) => a.score - b.score);
    }
  }
};

window.refreshNwsAlerts = async function (isSilent = false) {
  if (!window.alertsEnabled) return;
  window.isAlertsLoading = true;
  if (window.renderAlertsSidebar) window.renderAlertsSidebar();
  try {
    const response = await fetch(
      "https://api.weather.gov/alerts/active?status=actual&message_type=alert,update",
    );
    const data = await response.json();
    if (!window.alertsEnabled) return;

    const currentIds = new Set(data.features.map((f) => f.properties.id));
    const keepId = (id) =>
      currentIds.has(id) ||
      id.startsWith("debug") ||
      id.startsWith("md") ||
      id.startsWith("ww");
    window.knownAlertIds = new Set([...window.knownAlertIds].filter(keepId));
    window.newAlertIds = new Set([...window.newAlertIds].filter(keepId));
    window.updatedAlertIds = new Set(
      [...window.updatedAlertIds].filter(keepId),
    );

    await window.processRawAlertFeatures(data.features, "polygon", isSilent);
    if (window.zoneAlertsEnabled) {
      await window.processRawAlertFeatures(data.features, "zone", isSilent);
    }
    if (window.isInitialLoad) {
      window.isInitialLoad = false;
    }
    window.displayNextAlert();
    window.updateGreenStatusIndicators();
  } catch (e) {
    console.error("NWS alerts refresh ingestion failed.", e);
  } finally {
    window.isAlertsLoading = false;
    if (window.renderAlertsSidebar) {
      window.renderAlertsSidebar();
    }
  }
};

window.fetchIemMdFeatures = async function () {
  try {
    const res = await fetch(
      "https://mesonet.agron.iastate.edu/api/1/nws/spc_mcd.geojson",
    );
    const data = await res.json();
    return (data.features || []).map((f) => {
      const p = f.properties;
      const num = p.num;
      const numPadded = String(num).padStart(4, "0");
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          id: `md${numPadded}`,
          event: `Mesoscale Discussion ${num}`,
          specificEventName: `Mesoscale Discussion ${num}`,
          url: `https://www.spc.noaa.gov/products/md/md${numPadded}.html`,
          displayColor: "#0000FF",
          geometryType: "polygon",
          sent: p.issue,
          expires: p.expire,
          messageType: "Alert",
        },
      };
    });
  } catch (e) {
    return [];
  }
};

window.fetchIemWatchFeatures = async function () {
  try {
    const res = await fetch(
      "https://mesonet.agron.iastate.edu/api/1/spc_watch_outline.geojson",
    );
    const data = await res.json();
    return (data.features || []).map((f) => {
      const p = f.properties;
      const num = p.num;
      const numPadded = String(num).padStart(4, "0");
      const wType =
        p.type === "TOR" ? "Tornado Watch" : "Severe Thunderstorm Watch";
      const geometry =
        f.geometry.type === "MultiPolygon"
          ? { type: "Polygon", coordinates: f.geometry.coordinates[0] }
          : f.geometry;
      return {
        type: "Feature",
        geometry,
        properties: {
          id: `ww${numPadded}`,
          event: wType,
          specificEventName: `${wType} ${num}`,
          url: `https://www.spc.noaa.gov/products/watch/ww${numPadded}.html`,
          displayColor: window.alertColorMap[wType] || "#808080",
          geometryType: "polygon",
          sent: p.utc_issued,
          expires: p.utc_expired,
          messageType: "Alert",
        },
      };
    });
  } catch (e) {
    return [];
  }
};

window.updatePlacefileAlerts = async function (isSilent = false) {
  if (!window.alertsEnabled) return;
  const mdFeatures = await window.fetchIemMdFeatures();
  const watchFeatures =
    !window.zoneAlertsEnabled && window.alertsEnabled
      ? await window.fetchIemWatchFeatures()
      : [];

  const liveIds = new Set([
    ...mdFeatures.map((f) => f.properties.id),
    ...watchFeatures.map((f) => f.properties.id),
  ]);
  const keepPlacefileId = (id) =>
    (!id.startsWith("md") && !id.startsWith("ww")) || liveIds.has(id);
  window.knownAlertIds = new Set(
    [...window.knownAlertIds].filter(keepPlacefileId),
  );
  window.newAlertIds = new Set([...window.newAlertIds].filter(keepPlacefileId));

  if (window.alertsEnabled && window.mesoDiscussionsEnabled) {
    mdFeatures.forEach((f) => {
      f.properties.priorityScore = 108;
    });
    if (window.map.getSource("alerts-md")) {
      window.map
        .getSource("alerts-md")
        .setData({ type: "FeatureCollection", features: mdFeatures });
    }
    window.globalMdAlerts = mdFeatures;
    mdFeatures.forEach((f) => window.addNewAlertToQueue(f, "alert", isSilent));
  } else if (!window.mesoDiscussionsEnabled) {
    clearMapSource("alerts-md");
    window.globalMdAlerts = [];
  }

  if (!window.zoneAlertsEnabled && window.alertsEnabled) {
    watchFeatures.forEach((f) => {
      f.properties.priorityScore = 150;
    });
    if (window.map.getSource("alerts-poly-watch")) {
      window.map
        .getSource("alerts-poly-watch")
        .setData({ type: "FeatureCollection", features: watchFeatures });
    }
    window.globalPolyWatchAlerts = watchFeatures;
    watchFeatures.forEach((f) =>
      window.addNewAlertToQueue(f, "alert", isSilent),
    );
  } else {
    clearMapSource("alerts-poly-watch");
    window.globalPolyWatchAlerts = [];
  }
  window.displayNextAlert();
  if (window.renderAlertsSidebar) {
    window.renderAlertsSidebar();
  }
};

window.processZoneAlerts = async function (features, isSilent = false) {
  if (!window.zoneAlertsEnabled || !window.alertsEnabled) return;
  const tasks = features.flatMap((f) =>
    (f.properties.affectedZones || []).map((url) => ({
      url,
      parentFeature: f,
    })),
  );
  const resolvedFeatures = [];
  const featureGeometryMap = new Map();
  const toFetch = [];

  for (const task of tasks) {
    const cached = await window.PersistentCache.get(task.url);
    if (cached && Array.isArray(cached)) {
      const id = task.parentFeature.properties.id;
      if (!featureGeometryMap.has(id)) featureGeometryMap.set(id, []);
      featureGeometryMap.get(id).push(...cached);
    } else {
      toFetch.push(task);
    }
  }

  for (let i = 0; i < toFetch.length; i += 25) {
    if (!window.zoneAlertsEnabled || !window.alertsEnabled) break;
    const chunk = toFetch.slice(i, i + 25);
    await Promise.all(
      chunk.map(async (task) => {
        try {
          if (!task.url || typeof task.url !== "string") return;
          const parsedUrl = new URL(task.url);
          const res = await fetch(parsedUrl.href);
          if (!res.ok) throw new Error();
          const data = await res.json();

          if (data.geometry && data.geometry.coordinates) {
            const geoms =
              data.geometry.type === "Polygon"
                ? [data.geometry.coordinates]
                : data.geometry.coordinates;
            if (Array.isArray(geoms)) {
              window.PersistentCache.set(task.url, geoms);
              const id = task.parentFeature.properties.id;
              if (!featureGeometryMap.has(id)) featureGeometryMap.set(id, []);
              featureGeometryMap.get(id).push(...geoms);
            }
          }
        } catch (e) {}
      }),
    );
  }

  if (!window.zoneAlertsEnabled || !window.alertsEnabled) return;
  features.forEach((f) => {
    const geoms = featureGeometryMap.get(f.properties.id);
    if (geoms && geoms.length > 0) {
      const feature = {
        type: "Feature",
        geometry: { type: "MultiPolygon", coordinates: geoms },
        properties: { ...f.properties, geometryType: "zone" },
      };
      feature.properties.priorityScore = window.getAlertPriorityScore(feature);
      resolvedFeatures.push(feature);
      window.addNewAlertToQueue(feature, "alert", isSilent);
    }
  });

  if (window.map.getSource("alerts-zone")) {
    window.map
      .getSource("alerts-zone")
      .setData({ type: "FeatureCollection", features: resolvedFeatures });
  }
  window.globalZoneAlerts = resolvedFeatures;
};

async function fetchCachedPreText(cache, key, url, force) {
  if (!force && cache[key]) return cache[key];
  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    const text = await res.text();
    const pre = new DOMParser()
      .parseFromString(text, "text/html")
      .querySelector("pre");
    const result = pre ? pre.textContent : "Not found.";
    cache[key] = result;
    return result;
  } catch (e) {
    return cache[key] || "Failed to load.";
  }
}

window.spcOutlookTextCache = {};
window.fetchSpcOutlookText = function (day, force = false, customUrl = null) {
  const key = customUrl || `${day}_convective`;
  const url =
    customUrl ||
    (parseInt(day, 10) >= 4
      ? "https://www.spc.noaa.gov/products/exper/day4-8/index.html"
      : `https://www.spc.noaa.gov/products/outlook/day${day}otlk.html`);
  return fetchCachedPreText(window.spcOutlookTextCache, key, url, force);
};

window.mdWatchTextCache = {};
window.fetchMdWatchText = function (id, url, force = false) {
  return fetchCachedPreText(window.mdWatchTextCache, id, url, force);
};

window.getHighestSpcCatFeature = function (features) {
  if (!features || !features.length) return null;
  let best = null;
  let bestIdx = Infinity;
  const rankOrder = [
    "HIGH",
    "MODERATE",
    "MDT",
    "ENHANCED",
    "ENH",
    "SLIGHT",
    "SLGT",
    "MARGINAL",
    "MRGL",
    "THUNDERSTORM",
    "TSTM",
    "EXTREMELY CRITICAL",
    "CRITICAL FIRE WEATHER (40%)",
    "CRITICAL",
    "ELEVATED",
    "EXTM",
    "CRIT",
    "ELEV",
    "DRY TSTM",
    "SDRY",
    "MARGINAL FIRE WEATHER (10%)",
  ];
  for (const f of features) {
    const label = getFeatureLabel(f.properties).toUpperCase();
    const idx = rankOrder.indexOf(label);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      best = f;
    }
  }
  return best || features[0];
};

window.spcGetIssueValue = function (feature) {
  const p = feature.properties;
  return (
    p.ISSUE ||
    p.ISSUE_ISO ||
    p.issue ||
    p.issue_iso ||
    p.idp_filedate ||
    p.idp_source ||
    ""
  ).toString();
};

window.normalizeFireProperties = function (props, sourceId) {
  if (props.dn !== undefined && !props.LABEL && !props.label) {
    const dnVal = parseFloat(props.dn);
    const isProbabilisticDryTstm =
      sourceId &&
      !sourceId.startsWith("spc-day1") &&
      !sourceId.startsWith("spc-day2");

    if (isProbabilisticDryTstm) {
      if (dnVal === 10 || dnVal === 0.1) {
        props.LABEL = "Marginal Fire Weather (10%)";
        props.fill = "#8B5A2B";
      } else if (dnVal === 40 || dnVal === 0.4) {
        props.LABEL = "Critical Fire Weather (40%)";
        props.fill = "#0070ff";
      } else {
        props.LABEL = dnVal < 1 ? `${Math.round(dnVal * 100)}%` : `${dnVal}%`;
        props.fill = "#a0522d";
      }
    } else {
      if (dnVal === 5) {
        props.LABEL = "Elevated";
        props.fill = "#e69800";
      } else if (dnVal === 8) {
        props.LABEL = "Critical";
        props.fill = "#ff0000";
      } else if (dnVal === 10) {
        props.LABEL = "Extremely Critical";
        props.fill = "#e600a9";
      } else {
        props.LABEL = String(dnVal);
        props.fill = "#ffaa00";
      }
    }
  }
};

window.normalizeConvectiveProperties = function (props, sourceId) {
  if (props.dn !== undefined && !props.LABEL && !props.label) {
    const dnVal = parseFloat(props.dn);
    props.LABEL = dnVal + "%";
    if (dnVal === 15) {
      props.fill = "#ffe600";
      props.stroke = "#e6c800";
    } else if (dnVal === 30) {
      props.fill = "#e60000";
      props.stroke = "#b30000";
    } else if (dnVal === 45 || dnVal === 50) {
      props.fill = "#ff00ff";
      props.stroke = "#cc00cc";
    } else {
      props.fill = "#808080";
      props.stroke = "#666666";
    }
  }
};

window.updateSpcOutlooks = async function () {
  for (let d = 1; d <= 8; d++) {
    window.fetchSpcOutlookText(d, true);
  }
  await Promise.all(
    window.spcSources.map(async (s) => {
      if (!window.map.getSource(s.id)) return;
      try {
        let fetchUrl = s.url;
        if (!fetchUrl.includes("mapservices.weather.noaa.gov")) {
          const separator = fetchUrl.includes("?") ? "&" : "?";
          fetchUrl = `${fetchUrl}${separator}t=${Date.now()}`;
        }
        const res = await fetch(fetchUrl);
        const data = await res.json();

        if (data.features) {
          data.features.forEach((f) => {
            if (f.properties) {
              if (s.id.includes("-fire")) {
                window.normalizeFireProperties(f.properties, s.id);
              } else {
                window.normalizeConvectiveProperties(f.properties, s.id);
              }
            }
          });
        }

        window.spcSourceCache[s.id] = data;
        window.map.getSource(s.id).setData(data);
        if (window.isInitialLoad) return;

        const isCat = s.id.endsWith("-cat") || s.id.includes("-fire");
        const isProb = s.id.endsWith("-prob");
        if (!isCat && !isProb) return;
        const dayMatch = s.id.match(
          /spc-day(\d+)-(?:cat|prob|fire-cat|fire-dryt)/,
        );
        if (!dayMatch) return;
        const day = dayMatch[1];
        if (isProb && day === "3") return;

        const newSnapshot = {};
        for (const f of data.features) {
          const lbl = getFeatureLabel(f.properties).toUpperCase();
          if (lbl) newSnapshot[lbl] = window.spcGetIssueValue(f);
        }
        const oldSnapshot = window.spcIssueSnapshots[s.id] || {};
        const changed = Object.keys(newSnapshot).some(
          (k) => newSnapshot[k] !== oldSnapshot[k],
        );
        if (changed) {
          window.spcIssueSnapshots[s.id] = newSnapshot;
        }
      } catch (e) {
        console.error("SPC outlook ingestion failed.", e);
      }
    }),
  );
  if (window.renderSpcOutlookPanel) {
    window.renderSpcOutlookPanel();
  }
};

window.getSpcSourceHighest = function (sourceId) {
  const data = window.spcSourceCache[sourceId];
  if (!data || !data.features || !data.features.length) return null;
  const features = data.features;
  const isCat = sourceId.endsWith("-cat") || sourceId.includes("-fire");
  const isLowLabel = (lbl) => {
    const up = lbl.toUpperCase();
    const trimmed = lbl.trim();
    return (
      !lbl ||
      up.includes("PROBABILITY TOO LOW") ||
      trimmed === "0%" ||
      trimmed === "0" ||
      trimmed === "0 %"
    );
  };

  if (isCat) {
    const best = window.getHighestSpcCatFeature(features);
    if (!best) return null;
    const lbl = getFeatureLabel(best.properties).toUpperCase();
    if (isLowLabel(lbl)) return null;
    return {
      label: lbl,
      fill: best.properties.fill || best.properties.FILL || "#808080",
    };
  }

  const getProbVal = (p) => parseFloat(getFeatureLabel(p) || p?.dn || 0);
  const best = features.reduce(
    (b, f) => (getProbVal(f.properties) > getProbVal(b?.properties) ? f : b),
    null,
  );
  if (!best) return null;
  const val = getProbVal(best.properties);
  if (!val || val <= 0) return null;
  const rawLabel = String(
    getFeatureLabel(best.properties) || best.properties.dn,
  );
  if (isLowLabel(rawLabel)) return null;
  return {
    label: window.formatSpcLabel(rawLabel),
    fill: best.properties.fill || best.properties.FILL || "#808080",
  };
};

window.updateSpcLayerVisibility = function () {
  if (!window.map.isStyleLoaded()) return;
  window.allSpcLayerIds.forEach((id) => {
    if (window.map.getLayer(id))
      window.map.setLayoutProperty(id, "visibility", "none");
  });
  if (window.activeSpcDay === "none") return;

  const dayObj = window.layerIds.spc["day" + window.activeSpcDay];
  if (!dayObj) return;

  [dayObj[window.activeSpcType], dayObj[`${window.activeSpcType}-cig`]].forEach(
    (layerId) => {
      if (!layerId) return;
      if (window.map.getLayer(layerId))
        window.map.setLayoutProperty(layerId, "visibility", "visible");
      if (window.map.getLayer(`${layerId}-border`))
        window.map.setLayoutProperty(
          `${layerId}-border`,
          "visibility",
          "visible",
        );
    },
  );
};

window.applyMapAlertFilters = function () {
  const hiddenArr = [...window.hiddenAlertTypes];
  const polyFilter =
    hiddenArr.length > 0
      ? [
          "all",
          ["==", "geometryType", "polygon"],
          ["!in", "event", ...hiddenArr],
        ]
      : ["==", "geometryType", "polygon"];
  const zoneFilter =
    hiddenArr.length > 0
      ? ["all", ["==", "geometryType", "zone"], ["!in", "event", ...hiddenArr]]
      : ["==", "geometryType", "zone"];
  const openFilter =
    hiddenArr.length > 0 ? ["!in", "event", ...hiddenArr] : null;

  const layerFilterMap = {
    [window.layerIds.alertsPolygon]: polyFilter,
    [window.layerIds.alertsPolygonBorder]: polyFilter,
    [window.layerIds.alertsZone]: zoneFilter,
    [window.layerIds.alertsZoneBorder]: zoneFilter,
    [window.layerIds.alertsMd]: openFilter,
    [window.layerIds.alertsMdBorder]: openFilter,
    [window.layerIds.alertsPolyWatch]: openFilter,
    [window.layerIds.alertsPolyWatchBorder]: openFilter,
  };
  Object.entries(layerFilterMap).forEach(([id, filter]) => {
    if (window.map.getLayer(id)) window.map.setFilter(id, filter);
  });
  const countEl = document.getElementById("hidden-alert-types-count");
  if (countEl) {
    countEl.textContent =
      window.hiddenAlertTypes.size > 0 ? window.hiddenAlertTypes.size : "";
  }
};

window.toggleAllAlerts = async function () {
  window.alertsEnabled = !window.alertsEnabled;
  window.updateGreenStatusIndicators();
  if (window.saveCurrentState) window.saveCurrentState();

  if (window.alertsEnabled) {
    window.showToast("Alerts: On");
    window.isAlertsLoading = true;
    if (window.renderAlertsSidebar) window.renderAlertsSidebar();
    await window.refreshNwsAlerts(true);
    await window.updatePlacefileAlerts(true);
  } else {
    window.isAlertsLoading = false;
    window.showToast("Alerts: Off");
    [
      "alerts-poly",
      "alerts-zone",
      "alerts-md",
      "alerts-poly-watch",
      "alerts-arrows",
      "highlight-source",
    ].forEach(clearMapSource);
    window.globalPolyAlerts = [];
    window.globalZoneAlerts = [];
    window.globalMdAlerts = [];
    window.globalPolyWatchAlerts = [];
    window.alertQueue = [];
  }
  const v = window.alertsEnabled ? "visible" : "none";
  [
    window.layerIds.alertsZone,
    window.layerIds.alertsZoneBorder,
    window.layerIds.alertsPolygon,
    window.layerIds.alertsPolygonBorder,
    window.layerIds.alertsMd,
    window.layerIds.alertsMdBorder,
    window.layerIds.alertsPolyWatch,
    window.layerIds.alertsPolyWatchBorder,
  ].forEach((l) => {
    if (window.map.getLayer(l))
      window.map.setLayoutProperty(l, "visibility", v);
  });
  if (window.updateMotionVectorsVisibility) {
    window.updateMotionVectorsVisibility();
  }
  window.updateGreenStatusIndicators();
  if (window.renderAlertsSidebar) {
    window.renderAlertsSidebar();
  }
};

window.fetchAndRenderStormReports = async function () {
  if (!window.stormReportsEnabled || !window.map) {
    window.clearStormReports();
    return;
  }
  const markers = [];
  const lsrIconMap = {
    T: "tornado",
    H: "weather_hail",
    G: "air",
    D: "air",
  };
  const snIconMap = {
    1: "tornado",
    2: "keyboard_double_arrow_down",
    3: "keyboard_arrow_down",
    4: "weather_hail",
  };

  const lsrPromise = (async () => {
    try {
      const res = await fetch(
        "https://mesonet.agron.iastate.edu/geojson/lsr.geojson?hours=3",
      );
      if (!res.ok) return;
      const data = await res.json();
      (data.features || []).forEach((f) => {
        if (!f.properties || !f.geometry || !f.geometry.coordinates) return;
        const type = (f.properties.type || f.properties.TYPE || "")
          .toString()
          .toUpperCase();
        const iconName = lsrIconMap[type];
        if (iconName) {
          markers.push({ coords: f.geometry.coordinates, iconName });
        }
      });
    } catch (e) {}
  })();

  const snPromise = (async () => {
    try {
      const res = await fetch(
        "https://www.spotternetwork.org/feeds/reports.txt",
      );
      if (!res.ok) return;
      const text = await res.text();
      text.split("\n").forEach((line) => {
        if (line.trim().toUpperCase().startsWith("ICON:")) {
          const cleanParts = line.replace(/^\s*Icon:\s*/i, "").split(",");
          if (cleanParts.length >= 5) {
            const lat = parseFloat(cleanParts[0]);
            const lon = parseFloat(cleanParts[1]);
            const type = parseInt(cleanParts[4], 10);
            const iconName = snIconMap[type];
            if (!isNaN(lat) && !isNaN(lon) && iconName) {
              markers.push({ coords: [lon, lat], iconName });
            }
          }
        }
      });
    } catch (e) {}
  })();

  await Promise.allSettled([lsrPromise, snPromise]);
  window.clearStormReports();
  if (!window.stormReportsEnabled) return;

  markers.forEach((m) => {
    const el = document.createElement("div");
    el.className = "storm-report-marker";
    el.style.pointerEvents = "none";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.color = "#ffffff";
    el.style.textShadow = "0 0 3px #000, 0 0 5px #000";
    const icon = document.createElement("i");
    icon.className = "material-symbols-rounded";
    icon.style.fontSize = "20px";
    icon.style.pointerEvents = "none";
    icon.textContent = m.iconName;
    el.appendChild(icon);
    const marker = new maplibregl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat(m.coords)
      .addTo(window.map);
    window.stormReportsMarkers.push(marker);
  });
};

window.clearStormReports = function () {
  if (window.stormReportsMarkers) {
    window.stormReportsMarkers.forEach((m) => m.remove());
  }
  window.stormReportsMarkers = [];
};

window.toggleStormReports = function () {
  window.stormReportsEnabled = !window.stormReportsEnabled;
  if (window.saveCurrentState) window.saveCurrentState();
  if (window.stormReportsEnabled) {
    window.showToast("Storm Reports: On");
    window.fetchAndRenderStormReports();
    if (window.stormReportsInterval) clearInterval(window.stormReportsInterval);
    window.stormReportsInterval = setInterval(
      window.fetchAndRenderStormReports,
      60000,
    );
  } else {
    window.showToast("Storm Reports: Off");
    window.clearStormReports();
    if (window.stormReportsInterval) {
      clearInterval(window.stormReportsInterval);
      window.stormReportsInterval = null;
    }
  }
};
