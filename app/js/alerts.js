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

window.updateMotionVectorsVisibility = function () {
  if (!window.map || !window.map.getLayer("alerts-arrows-layer")) return;
  const visibility =
    window.alertsEnabled && window.motionVectorsEnabled ? "visible" : "none";
  window.map.setLayoutProperty("alerts-arrows-layer", "visibility", visibility);
};

window.spcSources = [
  {
    id: "spc-day1-cat",
    url: "https://www.spc.noaa.gov/products/outlook/day1otlk_cat.nolyr.geojson",
  },
  {
    id: "spc-day1-torn",
    url: "https://www.spc.noaa.gov/products/outlook/day1otlk_torn.nolyr.geojson",
  },
  {
    id: "spc-day1-hail",
    url: "https://www.spc.noaa.gov/products/outlook/day1otlk_hail.nolyr.geojson",
  },
  {
    id: "spc-day1-wind",
    url: "https://www.spc.noaa.gov/products/outlook/day1otlk_wind.nolyr.geojson",
  },
  {
    id: "spc-day2-cat",
    url: "https://www.spc.noaa.gov/products/outlook/day2otlk_cat.nolyr.geojson",
  },
  {
    id: "spc-day2-torn",
    url: "https://www.spc.noaa.gov/products/outlook/day2otlk_torn.nolyr.geojson",
  },
  {
    id: "spc-day2-hail",
    url: "https://www.spc.noaa.gov/products/outlook/day2otlk_hail.nolyr.geojson",
  },
  {
    id: "spc-day2-wind",
    url: "https://www.spc.noaa.gov/products/outlook/day2otlk_wind.nolyr.geojson",
  },
  {
    id: "spc-day3-cat",
    url: "https://www.spc.noaa.gov/products/outlook/day3otlk_cat.nolyr.geojson",
  },
  {
    id: "spc-day3-prob",
    url: "https://www.spc.noaa.gov/products/outlook/day3otlk_prob.nolyr.geojson",
  },
  {
    id: "spc-day4-prob",
    url: "https://www.spc.noaa.gov/products/exper/day4-8/day4prob.nolyr.geojson",
  },
  {
    id: "spc-day5-prob",
    url: "https://www.spc.noaa.gov/products/exper/day4-8/day5prob.nolyr.geojson",
  },
  {
    id: "spc-day6-prob",
    url: "https://www.spc.noaa.gov/products/exper/day4-8/day6prob.nolyr.geojson",
  },
  {
    id: "spc-day7-prob",
    url: "https://www.spc.noaa.gov/products/exper/day4-8/day7prob.nolyr.geojson",
  },
  {
    id: "spc-day8-prob",
    url: "https://www.spc.noaa.gov/products/exper/day4-8/day8prob.nolyr.geojson",
  },
];

const spcCatOrder = ["HIGH", "MDT", "ENH", "SLGT", "MRGL", "TSTM"];

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
  if (event === "Tornado Warning") {
    return "Tornado Warning";
  }
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
  if (event === "Flash Flood Warning") {
    return "Flash Flood Warning";
  }
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
      let finalSource =
        sourceMatch && sourceMatch[1]
          ? sourceMatch[1].trim()
          : params.flashFloodDetection?.[0] || "";
      params.flashFloodDetection = [finalSource];
      if (sourceMatch && sourceMatch[1]) {
        f.properties.customFlashFloodSource = true;
      }
    }

    if (!!f.geometry) {
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
      if (
        f.properties.parameters &&
        f.properties.parameters.eventMotionDescription
      ) {
        const motions = window.parseEventMotion(f);
        if (motions && motions.length > 0) {
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
  if (
    props.parameters &&
    props.parameters.VTEC &&
    props.parameters.VTEC[0] &&
    props.parameters.VTEC[0].startsWith("/O.CAN.")
  )
    return false;
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
          bearing: bearing,
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

window.getAlertPriorityScore = function (feature) {
  const p = feature.properties;
  const event = p.event;
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
    if (dmg === "CATASTROPHIC") return 1;
    if (dmg === "CONSIDERABLE") return 2;
    return 3;
  }
  if (event === "Severe Thunderstorm Warning") {
    if (dmg === "DESTRUCTIVE") return 4;
    if (dmg === "CONSIDERABLE") return 5;
    if (det === "POSSIBLE") return 6;
    return 7;
  }
  if (event === "Extreme Wind Warning") return 8;
  if (event === "Tsunami Warning") return 9;
  if (event === "Typhoon Warning") return 10;
  if (event === "Hurricane Warning") return 11;
  if (event === "Hurricane Force Wind Warning") return 12;
  if (event === "Storm Warning") return 13;
  if (event === "Tropical Storm Warning") return 14;
  if (event === "Typhoon Watch") return 15;
  if (event === "Hurricane Watch") return 16;
  if (event === "Hurricane Force Wind Watch") return 17;
  if (event === "Storm Surge Watch") return 18;
  if (event === "Tropical Storm Watch") return 19;
  if (event === "Tropical Cyclone Local Statement") return 20;
  if (event === "Flash Flood Warning") {
    if (dmg === "CATASTROPHIC") return 21;
    if (dmg === "CONSIDERABLE") return 22;
    return 23;
  }
  if (event === "Blizzard Warning") return 24;
  if (event === "Ice Storm Warning") return 25;
  if (event === "Snow Squall Warning") return 26;
  if (event === "Lake Effect Snow Warning") return 27;
  if (event === "Winter Storm Warning") return 28;
  if (event === "Heavy Freezing Spray Warning") return 29;
  if (event === "Extreme Heat Warning") return 30;
  if (event === "Extreme Cold Warning") return 31;
  if (event === "Dust Storm Warning") return 32;
  if (event === "Blowing Dust Warning") return 33;
  if (event === "High Wind Warning") return 34;
  if (event === "Red Flag Warning") return 35;
  if (event === "Extreme Fire Danger") return 36;
  if (event === "Fire Warning") return 37;
  if (event === "Avalanche Warning") return 38;
  if (event === "Earthquake Warning") return 39;
  if (event === "Volcano Warning") return 40;
  if (event === "Ashfall Warning") return 41;
  if (event === "Special Marine Warning") {
    if (det === "OBSERVED") return 42;
    if (det === "POSSIBLE") return 43;
    return 44;
  }
  if (event === "Hazardous Seas Warning") return 45;
  if (event === "Storm Warning") return 46;
  if (event === "Gale Warning") return 47;
  if (event === "High Surf Warning") return 48;
  if (event === "Coastal Flood Warning") return 49;
  if (event === "Lakeshore Flood Warning") return 50;
  if (event === "Flood Warning") return 51;
  if (event === "Freeze Warning") return 52;
  if (event === "Tornado Watch") return 53;
  if (event === "Severe Thunderstorm Watch") return 54;
  if (event === "Tsunami Watch") return 55;
  if (event === "Flash Flood Watch") return 56;
  if (event === "Winter Storm Watch") return 57;
  if (event === "Avalanche Watch") return 58;
  if (event === "Heavy Freezing Spray Watch") return 59;
  if (event === "High Wind Watch") return 60;
  if (event === "Extreme Heat Watch") return 61;
  if (event === "Extreme Cold Watch") return 62;
  if (event === "Fire Weather Watch") return 63;
  if (event === "Hazardous Weather Outlook") return 64;
  if (event === "Hazardous Seas Watch") return 65;
  if (event === "Storm Watch") return 66;
  if (event === "Gale Watch") return 67;
  if (event === "Coastal Flood Watch") return 68;
  if (event === "Lakeshore Flood Watch") return 69;
  if (event === "Flood Watch") return 70;
  if (event === "Freeze Watch") return 71;
  if (event === "Tsunami Advisory") return 72;
  if (event === "Flash Flood Statement") return 73;
  if (event === "Severe Weather Statement") return 74;
  if (event === "Special Weather Statement") return 75;
  if (event === "Wind Advisory") return 76;
  if (event === "Blowing Dust Advisory") return 77;
  if (event === "Dust Advisory") return 78;
  if (event === "Heat Advisory") return 79;
  if (event === "Cold Weather Advisory") return 80;
  if (event === "Winter Weather Advisory") return 81;
  if (event === "Frost Advisory") return 82;
  if (event === "Freezing Fog Advisory") return 83;
  if (event === "Freezing Spray Advisory") return 84;
  if (event === "Dense Fog Advisory") return 85;
  if (event === "Dense Smoke Advisory") return 86;
  if (event === "Air Quality Alert") return 87;
  if (event === "Air Stagnation Advisory") return 88;
  if (event === "Flood Statement") return 89;
  if (event === "Lakeshore Flood Statement") return 90;
  if (event === "Coastal Flood Statement") return 91;
  if (event === "Rip Current Statement") return 92;
  if (event === "Beach Hazards Statement") return 93;
  if (event === "Flood Advisory") return 94;
  if (event === "Coastal Flood Advisory") return 95;
  if (event === "Lakeshore Flood Advisory") return 96;
  if (event === "High Surf Advisory") return 97;
  if (event === "Small Craft Advisory") return 98;
  if (event === "Brisk Wind Advisory") return 99;
  if (event === "Lake Wind Advisory") return 100;
  if (event === "Low Water Advisory") return 101;
  if (event === "Ashfall Advisory") return 102;
  if (event === "Avalanche Advisory") return 103;
  if (event === "Marine Weather Statement") return 104;
  if (event === "Hazardous Weather Outlook") return 105;
  if (event === "Hydrologic Outlook") return 106;
  if (event === "Short Term Forecast") return 107;
  if (event.startsWith("Mesoscale Discussion")) return 108;
  if (event === "SPC Outlook") {
    const day = parseInt(p.spcDay);
    if (day === 1) return 109;
    if (day === 2) return 110;
    if (day === 3) return 111;
    if (day === 4) return 112;
    if (day === 5) return 113;
    if (day === 6) return 114;
    if (day === 7) return 115;
    if (day === 8) return 116;
    return 117;
  }
  return 120;
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
  if (window.map.getLayer("highlight-line"))
    window.map.setPaintProperty("highlight-line", "line-width", bw);

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
    source.setData({ type: "FeatureCollection", features: [] });
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
  let title =
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
    if (props.areaDesc && props.areaDesc.toUpperCase() !== "N/A")
      detailsHTML += `<p class="alert-popup-area-clamp"><strong>Affected:</strong> ${props.areaDesc}</p>`;
    if (
      params.tornadoDetection &&
      window.formatThreatValue(params.tornadoDetection[0])
    )
      detailsHTML += `<p><strong>Tornado:</strong> ${window.formatThreatValue(params.tornadoDetection[0])}</p>`;
    if (
      params.waterspoutDetection &&
      window.formatThreatValue(params.waterspoutDetection[0])
    )
      detailsHTML += `<p><strong>Waterspout:</strong> ${window.formatThreatValue(params.waterspoutDetection[0])}</p>`;

    const dmg =
      params.tornadoDamageThreat?.[0] ||
      params.thunderstormDamageThreat?.[0] ||
      params.flashFloodDamageThreat?.[0];
    if (dmg && window.formatThreatValue(dmg))
      detailsHTML += `<p><strong>Threat:</strong> ${window.formatThreatValue(dmg)}</p>`;
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
    )
      detailsHTML += `<p><strong>Source:</strong> ${window.formatThreatValue(params.flashFloodDetection[0])}</p>`;
  }
  popup.style.borderLeft = `5px solid ${accentColor}80`;
  popup.innerHTML = `<h4>${title}</h4>${detailsHTML}</div>`;

  popup.addEventListener("click", () => {
    if (props.event === "SPC Outlook") {
      const targetDay = String(props.spcDay);
      const targetType =
        props.spcType || (parseInt(targetDay) >= 4 ? "prob" : "cat");
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
    if (id.startsWith("md") && feature.properties.url) {
      window.fetchMdWatchText(id, feature.properties.url, true);
    }
    if (id.startsWith("ww") && feature.properties.url) {
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
  window.knownAlertIds = new Set(
    [...window.knownAlertIds].filter(
      (id) => (!id.startsWith("md") && !id.startsWith("ww")) || liveIds.has(id),
    ),
  );
  window.newAlertIds = new Set(
    [...window.newAlertIds].filter(
      (id) => (!id.startsWith("md") && !id.startsWith("ww")) || liveIds.has(id),
    ),
  );

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
    if (window.map.getSource("alerts-md")) {
      window.map
        .getSource("alerts-md")
        .setData({ type: "FeatureCollection", features: [] });
    }
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
    if (window.map.getSource("alerts-poly-watch")) {
      window.map
        .getSource("alerts-poly-watch")
        .setData({ type: "FeatureCollection", features: [] });
    }
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
          let parsedUrl;
          try {
            parsedUrl = new URL(task.url);
          } catch (e) {
            return;
          }
          const res = await fetch(parsedUrl.href);
          if (!res.ok) throw new Error();
          const data = await res.json();

          if (data.geometry && data.geometry.coordinates) {
            let geoms =
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

window.spcOutlookTextCache = {};
window.fetchSpcOutlookText = async function (day, force = false) {
  if (!force && window.spcOutlookTextCache[day]) {
    return window.spcOutlookTextCache[day];
  }
  let url =
    parseInt(day) >= 4
      ? "https://www.spc.noaa.gov/products/exper/day4-8/index.html"
      : `https://www.spc.noaa.gov/products/outlook/day${day}otlk.html`;
  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    const text = await res.text();
    const pre = new DOMParser()
      .parseFromString(text, "text/html")
      .querySelector("pre");
    const result = pre ? pre.textContent : "Not found.";
    window.spcOutlookTextCache[day] = result;
    return result;
  } catch (e) {
    return window.spcOutlookTextCache[day] || "Failed to load.";
  }
};

window.mdWatchTextCache = {};
window.fetchMdWatchText = async function (id, url, force = false) {
  if (!force && window.mdWatchTextCache[id]) {
    return window.mdWatchTextCache[id];
  }
  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    const text = await res.text();
    const pre = new DOMParser()
      .parseFromString(text, "text/html")
      .querySelector("pre");
    const result = pre ? pre.textContent : "Not found.";
    window.mdWatchTextCache[id] = result;
    return result;
  } catch (e) {
    return window.mdWatchTextCache[id] || "Failed to load.";
  }
};

window.getHighestSpcCatFeature = function (features) {
  if (!features || !features.length) return null;
  let best = null;
  let bestIdx = Infinity;
  for (const f of features) {
    const label = (
      f.properties.LABEL ||
      f.properties.LABEL2 ||
      ""
    ).toUpperCase();
    const idx = spcCatOrder.indexOf(label);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      best = f;
    }
  }
  return best || features[0];
};

window.spcGetIssueValue = function (feature) {
  return (
    feature.properties.ISSUE ||
    feature.properties.ISSUE_ISO ||
    ""
  ).toString();
};

window.updateSpcOutlooks = async function () {
  for (let d = 1; d <= 8; d++) {
    window.fetchSpcOutlookText(d, true);
  }
  await Promise.all(
    window.spcSources.map(async (s) => {
      if (!window.map.getSource(s.id)) return;
      try {
        const res = await fetch(`${s.url}?t=${new Date().getTime()}`);
        const data = await res.json();
        window.spcSourceCache[s.id] = data;
        window.map.getSource(s.id).setData(data);
        if (window.isInitialLoad) return;

        const isCat = s.id.endsWith("-cat");
        const isProb = s.id.endsWith("-prob");
        if (!isCat && !isProb) return;
        const dayMatch = s.id.match(/spc-day(\d+)-(?:cat|prob)/);
        if (!dayMatch) return;
        const day = dayMatch[1];
        if (isProb && day === "3") return;

        const newSnapshot = {};
        for (const f of data.features) {
          const lbl = (
            f.properties.LABEL ||
            f.properties.LABEL2 ||
            ""
          ).toUpperCase();
          if (lbl) newSnapshot[lbl] = window.spcGetIssueValue(f);
        }
        const prevSnapshot = window.spcIssueSnapshots[s.id];
        window.spcIssueSnapshots[s.id] = newSnapshot;
        if (!prevSnapshot) return;

        const newLabels = Object.keys(newSnapshot).filter(
          (lbl) => !(lbl in prevSnapshot),
        );
        const updatedLabels = Object.keys(newSnapshot).filter(
          (lbl) =>
            lbl in prevSnapshot && newSnapshot[lbl] !== prevSnapshot[lbl],
        );
        if (newLabels.length === 0 && updatedLabels.length === 0) return;

        let topFeature = isCat
          ? window.getHighestSpcCatFeature(data.features)
          : data.features.reduce((best, f) => {
              const val = parseFloat(
                f.properties.LABEL || f.properties.LABEL2 || 0,
              );
              const bestVal = parseFloat(
                best?.properties.LABEL || best?.properties.LABEL2 || 0,
              );
              return val > bestVal ? f : best;
            }, null);
        if (!topFeature) return;

        const topLabel = (
          topFeature.properties.LABEL ||
          topFeature.properties.LABEL2 ||
          ""
        ).toUpperCase();
        const spcType = isCat ? "cat" : "prob";
        const outlookKey = `spc-day${day}-${spcType}-${Date.now()}`;

        const syntheticFeature = {
          type: "Feature",
          geometry: topFeature.geometry,
          properties: {
            id: outlookKey,
            event: "SPC Outlook",
            specificEventName: `SPC Day ${day} Outlook`,
            displayColor: topFeature.properties.fill || "#808080",
            geometryType: "polygon",
            spcDay: day,
            spcType: spcType,
            spcTopLabel: topLabel,
            spcTopFill: topFeature.properties.fill || "#808080",
          },
        };
        const score = window.getAlertPriorityScore(syntheticFeature);
        syntheticFeature.properties.priorityScore = score;
        window.alertQueue.push({
          feature: syntheticFeature,
          type: "spcOutlook",
          score,
        });
        window.alertQueue.sort((a, b) => a.score - b.score);
        window.displayNextAlert();
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
  const isCat = sourceId.endsWith("-cat");

  if (isCat) {
    const best = window.getHighestSpcCatFeature(features);
    if (!best) return null;
    const lbl = (
      best.properties.LABEL ||
      best.properties.LABEL2 ||
      ""
    ).toUpperCase();
    if (!lbl) return null;
    return { label: lbl, fill: best.properties.fill || "#808080" };
  } else {
    const best = features.reduce((b, f) => {
      const v = parseFloat(f.properties.LABEL || f.properties.LABEL2 || 0);
      const bv = parseFloat(b?.properties.LABEL || b?.properties.LABEL2 || 0);
      return v > bv ? f : b;
    }, null);
    if (!best) return null;
    const val = parseFloat(
      best.properties.LABEL || best.properties.LABEL2 || 0,
    );
    if (!val || val <= 0) return null;
    return {
      label: window.formatSpcLabel(
        String(best.properties.LABEL || best.properties.LABEL2),
      ),
      fill: best.properties.fill || "#808080",
    };
  }
};

window.updateSpcLayerVisibility = function () {
  if (!window.map.isStyleLoaded()) return;
  window.allSpcLayerIds.forEach((id) => {
    if (window.map.getLayer(id))
      window.map.setLayoutProperty(id, "visibility", "none");
  });
  if (window.activeSpcDay !== "none") {
    const dayObj = window.layerIds.spc["day" + window.activeSpcDay];
    if (dayObj && dayObj[window.activeSpcType]) {
      const layerId = dayObj[window.activeSpcType];
      if (window.map.getLayer(layerId))
        window.map.setLayoutProperty(layerId, "visibility", "visible");
      if (window.map.getLayer(`${layerId}-border`)) {
        window.map.setLayoutProperty(
          `${layerId}-border`,
          "visibility",
          "visible",
        );
      }
    }
  }
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
    ].forEach((s) => {
      if (window.map.getSource(s))
        window.map
          .getSource(s)
          .setData({ type: "FeatureCollection", features: [] });
    });
    window.globalPolyAlerts = [];
    window.globalZoneAlerts = [];
    window.globalMdAlerts = [];
    window.globalPolyWatchAlerts = [];
    window.alertQueue = [];
    const highlight = window.map.getSource("highlight-source");
    if (highlight) {
      highlight.setData({ type: "FeatureCollection", features: [] });
    }
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
