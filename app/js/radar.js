window.allRadarSitesData = [];
window.activeSiteIdForData = null;
window.activeRadarProductCode = null;
window.radarSiteSelectionMode = "WSR-88D";
window.showSitesMode = "Both";
window.flyToRadarSetting = false;
window.radarLoopMinutes = 30;

window.radarSiteDefaultColor = [
  "case",
  ["==", ["get", "statusError"], true],
  "#8800FF",
  ["==", ["get", "isOffline"], true],
  "#ff0000",
  ["==", ["get", "stationType"], "WSR-88D"],
  "#0099ff",
  ["==", ["get", "stationType"], "TDWR"],
  "#ff9900",
  "#808080",
];

window.mosaicVisible = function () {
  const radarToggle = document.getElementById("radar-toggle");
  return radarToggle ? (radarToggle.checked ? "visible" : "none") : "visible";
};

window.isMosaicVisible = function () {
  const toggle = document.getElementById("radar-toggle");
  const mosaicOn = toggle && toggle.checked;
  const isSingleActive = !!(
    window.activeSiteIdForData && window.activeRadarProductCode
  );
  return !!(
    mosaicOn &&
    !isSingleActive &&
    window.map.getSource("weather-radar")
  );
};

window.isSingleSiteVisible = function () {
  return !!(
    window.activeSiteIdForData &&
    window.activeRadarProductCode &&
    window.map.getLayer(window.layerIds.singleSiteRadar)
  );
};

window.isAnyRadarVisible = function () {
  return window.isMosaicVisible() || window.isSingleSiteVisible();
};

window.activeMosaicLayerId = window.layerIds.radar;
window.activeMosaicSourceId = "weather-radar";
window.activeSingleSiteLayerId = null;
window.activeSingleSiteSourceId = null;

window.updateMosaicVisibility = function () {
  const radarToggle = document.getElementById("radar-toggle");
  const mosaicOn = radarToggle ? radarToggle.checked : true;
  const siteActive = !!(
    window.activeSiteIdForData && window.activeRadarProductCode
  );
  const activeLayer = window.activeMosaicLayerId || window.layerIds.radar;
  const layersToControl = new Set([window.layerIds.radar, activeLayer]);

  layersToControl.forEach((layerId) => {
    if (window.map.getLayer(layerId)) {
      window.map.setLayoutProperty(
        layerId,
        "visibility",
        siteActive ? "none" : mosaicOn ? "visible" : "none",
      );
    }
  });
};

window.updateShowSitesFilter = function () {
  document.querySelectorAll(".show-sites-option").forEach((opt) => {
    opt.classList.toggle(
      "selected",
      opt.dataset.value === window.showSitesMode,
    );
  });
  if (window.map.getLayer(window.layerIds.radarSites)) {
    if (window.showSitesMode === "None") {
      window.map.setLayoutProperty(
        window.layerIds.radarSites,
        "visibility",
        "none",
      );
    } else {
      window.map.setLayoutProperty(
        window.layerIds.radarSites,
        "visibility",
        "visible",
      );
      let filter = ["all"];
      if (window.showSitesMode !== "Both") {
        filter.push(["==", ["get", "stationType"], window.showSitesMode]);
      }
      if (!window.showOfflineSites) {
        filter.push(["!=", ["get", "isOffline"], true]);
      }
      window.map.setFilter(
        window.layerIds.radarSites,
        filter.length > 1 ? filter : null,
      );
    }
  }
  const sitesToggle = document.getElementById("radar-sites-toggle");
  if (sitesToggle) {
    sitesToggle.checked = window.showSitesMode !== "None";
  }
  if (window.updateGreenStatusIndicators) {
    window.updateGreenStatusIndicators();
  }
};

window.removeSingleSiteLayer = function (preventLoopRestart = false) {
  const activeLayer =
    window.activeSingleSiteLayerId || window.layerIds.singleSiteRadar;
  const activeSource =
    window.activeSingleSiteSourceId || "single-site-radar-source";

  if (window.map.getLayer(activeLayer)) {
    window.map.removeLayer(activeLayer);
  }
  if (window.map.getLayer(window.layerIds.singleSiteRadar)) {
    window.map.removeLayer(window.layerIds.singleSiteRadar);
  }
  if (window.map.getSource(activeSource)) {
    window.map.removeSource(activeSource);
  }
  if (window.map.getSource("single-site-radar-source")) {
    window.map.removeSource("single-site-radar-source");
  }

  window.activeSingleSiteLayerId = null;
  window.activeSingleSiteSourceId = null;

  const pill = document.getElementById("radar-info-pill");
  if (pill) {
    pill.style.display = "none";
  }
  if (
    !preventLoopRestart &&
    window.isRadarLoopActive &&
    window.isRadarLoopActive()
  ) {
    window.stopLoop();
    window.startLoop();
  }
};

window.toggleRadarProduct = function (stationId, productCode) {
  window.removeSingleSiteLayer(true);
  const site = window.allRadarSitesData.find(
    (s) => s.properties.id.toLowerCase() === stationId.toLowerCase(),
  );
  if (site && site.properties.isOffline && !window.selectOfflineSites) {
    return;
  }
  if (
    window.activeSiteIdForData === stationId &&
    window.activeRadarProductCode === productCode
  ) {
    window.activeRadarProductCode = window.activeSiteIdForData = null;
    window.map.setPaintProperty(
      window.layerIds.radarSites,
      "circle-color",
      window.radarSiteDefaultColor,
    );
  } else {
    window.activeRadarProductCode = productCode;
    window.activeSiteIdForData = stationId;
    window.activeSingleSiteLayerId = window.layerIds.singleSiteRadar;
    window.activeSingleSiteSourceId = "single-site-radar-source";

    const ts = Math.floor(Date.now() / 120000) * 120000;
    const tileUrl = `https://opengeo.ncep.noaa.gov/geoserver/${stationId}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${stationId}_${productCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}&_=${ts}`;

    window.map.addSource("single-site-radar-source", {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      attribution: "NOAA",
    });
    window.map.addLayer(
      {
        id: window.layerIds.singleSiteRadar,
        type: "raster",
        source: "single-site-radar-source",
        paint: {},
      },
      window.layerIds.alertsZone,
    );

    window.map.setPaintProperty(window.layerIds.radarSites, "circle-color", [
      "case",
      ["==", ["get", "id"], stationId.toUpperCase()],
      "#00ff00",
      ...window.radarSiteDefaultColor.slice(1),
    ]);

    const pillId = document.getElementById("pill-id-time");
    const pillProd = document.getElementById("pill-product");
    if (pillId) pillId.innerText = stationId.toUpperCase();
    if (pillProd) {
      pillProd.innerText = productCode.includes("vel")
        ? "Velocity"
        : productCode === "brefl"
          ? "LR Reflectivity"
          : "Reflectivity";
    }

    const radarPill = document.getElementById("radar-info-pill");
    if (radarPill) {
      radarPill.style.display = "flex";
    }
  }
  window.updateMosaicVisibility();
  if (window.isRadarLoopActive && window.isRadarLoopActive()) {
    window.stopLoop();
    window.startLoop();
  }
  if (window.saveCurrentState) {
    window.saveCurrentState();
  }
};

let mosaicUpdateCount = 0;
window.updateRadar = function () {
  if (window.isRadarLoopActive && window.isRadarLoopActive()) return;
  try {
    const isVisible = window.isMosaicVisible();
    if (!isVisible) return;

    mosaicUpdateCount++;
    const ts = Math.floor(Date.now() / 60000) * 60000;
    const nextSourceId = `weather-radar-base-${mosaicUpdateCount}`;
    const nextLayerId = `${window.layerIds.radar}-${mosaicUpdateCount}`;
    const tileUrl = `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${ts}`;

    window.map.addSource(nextSourceId, {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      scheme: "xyz",
    });

    const currentLayerId = window.activeMosaicLayerId || window.layerIds.radar;

    window.map.addLayer(
      {
        id: nextLayerId,
        type: "raster",
        source: nextSourceId,
        paint: {
          "raster-opacity": 0.0001,
          "raster-opacity-transition": { duration: 0 },
        },
      },
      currentLayerId,
    );

    let swapAttempted = false;
    let fallbackTimeout = null;

    const performSwap = () => {
      if (swapAttempted) return;
      swapAttempted = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);

      if (window.isRadarLoopActive && window.isRadarLoopActive()) {
        if (window.map.getLayer(nextLayerId))
          window.map.removeLayer(nextLayerId);
        if (window.map.getSource(nextSourceId))
          window.map.removeSource(nextSourceId);
        return;
      }

      const siteActive = !!(
        window.activeSiteIdForData && window.activeRadarProductCode
      );
      if (siteActive) {
        if (window.map.getLayer(nextLayerId))
          window.map.removeLayer(nextLayerId);
        if (window.map.getSource(nextSourceId))
          window.map.removeSource(nextSourceId);
        return;
      }

      if (window.map.getLayer(nextLayerId)) {
        window.map.setPaintProperty(nextLayerId, "raster-opacity", 1.0);
      }

      const oldLayerId = window.activeMosaicLayerId || window.layerIds.radar;
      const oldSourceId = window.activeMosaicSourceId || "weather-radar";

      window.activeMosaicLayerId = nextLayerId;
      window.activeMosaicSourceId = nextSourceId;

      if (
        window.map.getLayer(oldLayerId) &&
        oldLayerId !== window.layerIds.radar
      ) {
        window.map.removeLayer(oldLayerId);
      }
      if (
        window.map.getSource(oldSourceId) &&
        oldSourceId !== "weather-radar"
      ) {
        window.map.removeSource(oldSourceId);
      }
    };

    window.map.once("idle", performSwap);
    fallbackTimeout = setTimeout(performSwap, 6000);
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  }
};

let singleSiteUpdateCount = 0;
window.updateSingleSiteRadar = function (offsetMinutes) {
  if (window.isRadarLoopActive && window.isRadarLoopActive()) return;
  try {
    if (window.activeSiteIdForData && window.activeRadarProductCode) {
      singleSiteUpdateCount++;
      const ts = Math.floor(Date.now() / 120000) * 120000;
      const timeParam =
        offsetMinutes && offsetMinutes !== 0
          ? `&TIME=${encodeURIComponent(new Date(Date.now() + offsetMinutes * 60000).toISOString())}`
          : "";

      const nextSourceId = `single-site-radar-source-${singleSiteUpdateCount}`;
      const nextLayerId = `${window.layerIds.singleSiteRadar}-${singleSiteUpdateCount}`;
      const tileUrl = `https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${ts}`;

      window.map.addSource(nextSourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "NOAA",
      });

      const currentLayerId =
        window.activeSingleSiteLayerId || window.layerIds.singleSiteRadar;

      window.map.addLayer(
        {
          id: nextLayerId,
          type: "raster",
          source: nextSourceId,
          paint: {
            "raster-opacity": 0.0001,
            "raster-opacity-transition": { duration: 0 },
          },
        },
        currentLayerId,
      );

      let swapAttempted = false;
      let fallbackTimeout = null;

      const performSwap = () => {
        if (swapAttempted) return;
        swapAttempted = true;
        if (fallbackTimeout) clearTimeout(fallbackTimeout);

        if (window.isRadarLoopActive && window.isRadarLoopActive()) {
          if (window.map.getLayer(nextLayerId))
            window.map.removeLayer(nextLayerId);
          if (window.map.getSource(nextSourceId))
            window.map.removeSource(nextSourceId);
          return;
        }

        if (window.map.getLayer(nextLayerId)) {
          window.map.setPaintProperty(nextLayerId, "raster-opacity", 1.0);
        }

        const oldLayerId =
          window.activeSingleSiteLayerId || window.layerIds.singleSiteRadar;
        const oldSourceId =
          window.activeSingleSiteSourceId || "single-site-radar-source";

        window.activeSingleSiteLayerId = nextLayerId;
        window.activeSingleSiteSourceId = nextSourceId;

        if (
          window.map.getLayer(oldLayerId) &&
          oldLayerId !== window.layerIds.singleSiteRadar
        ) {
          window.map.removeLayer(oldLayerId);
        }
        if (
          window.map.getSource(oldSourceId) &&
          oldSourceId !== "single-site-radar-source"
        ) {
          window.map.removeSource(oldSourceId);
        }
      };

      window.map.once("idle", performSwap);
      fallbackTimeout = setTimeout(performSwap, 6000);
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  }
};

window.updateSingleSiteRadar = function (offsetMinutes) {
  try {
    if (
      window.map.getSource("single-site-radar-source") &&
      window.activeSiteIdForData &&
      window.activeRadarProductCode
    ) {
      const ts = Math.floor(Date.now() / 120000) * 120000;
      const timeParam =
        offsetMinutes && offsetMinutes !== 0
          ? `&TIME=${encodeURIComponent(new Date(Date.now() + offsetMinutes * 60000).toISOString())}`
          : "";
      window.map
        .getSource("single-site-radar-source")
        .setTiles([
          `https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${ts}`,
        ]);
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  }
};

window.checkRadarStatus = async function (prefetchedData) {
  try {
    const bulk =
      prefetchedData ||
      (await (async () => {
        const res = await fetch(
          `https://api.weather.gov/radar/stations?stationType=WSR-88D,TDWR`,
        );
        if (!res.ok) throw new Error();
        return res.json();
      })());
    const now = Date.now();
    const twenty = now - 1200000;
    let changed = false;

    const statusMap = new Map(
      bulk.features.map((f) => [
        f.properties.id,
        f.properties.latency?.levelTwoLastReceivedTime,
      ]),
    );
    window.allRadarSitesData = window.allRadarSitesData.map((site) => {
      const lastTime = statusMap.get(site.properties.id);
      const offline = lastTime ? new Date(lastTime).getTime() < twenty : true;
      if (site.properties.isOffline !== offline) {
        changed = true;
        return {
          ...site,
          properties: {
            ...site.properties,
            isOffline: offline,
            statusError: false,
          },
        };
      }
      return site;
    });
    if (changed && window.map.getSource("radar-sites")) {
      window.map.getSource("radar-sites").setData({
        type: "FeatureCollection",
        features: window.allRadarSitesData,
      });
    }
  } catch (e) {
    console.error(e);
  }
};

(function () {
  const IEM_REL_MAP = {
    5: "nexrad-n0q-900913-m05m",
    10: "nexrad-n0q-900913-m10m",
    15: "nexrad-n0q-900913-m15m",
    20: "nexrad-n0q-900913-m20m",
    25: "nexrad-n0q-900913-m25m",
    30: "nexrad-n0q-900913-m30m",
    35: "nexrad-n0q-900913-m35m",
    40: "nexrad-n0q-900913-m40m",
    45: "nexrad-n0q-900913-m45m",
    50: "nexrad-n0q-900913-m50m",
  };
  const FRAME_INTERVAL = 600;
  let loopActive = false;
  let stepIndex = 0;
  let loopTimer = null;
  let OFFSETS = buildOffsets(window.radarLoopMinutes);
  let loopLayers = [];
  let updateCount = 0;
  let updateIntervalId = null;

  function buildOffsets(totalMinutes) {
    const steps = [];
    for (let m = totalMinutes; m > 0; m -= 5) {
      steps.push(-m);
    }
    steps.push(0);
    return steps;
  }

  function iemProductForOffset(offset) {
    const absMin = Math.abs(offset);
    if (absMin <= 50 && IEM_REL_MAP[absMin]) return IEM_REL_MAP[absMin];
    const ts = new Date(Date.now() + offset * 60000);
    const snapped = new Date(Math.round(ts.getTime() / 300000) * 300000);
    const pad = (n, w) => String(n).padStart(w, "0");
    const stamp =
      pad(snapped.getUTCFullYear(), 4) +
      pad(snapped.getUTCMonth() + 1, 2) +
      pad(snapped.getUTCDate(), 2) +
      pad(snapped.getUTCHours(), 2) +
      pad(snapped.getUTCMinutes(), 2);
    return `ridge::USCOMP-N0Q-${stamp}`;
  }

  window.setRadarLoopMinutes = function (minutes) {
    window.radarLoopMinutes = minutes;
    OFFSETS = buildOffsets(minutes);
    if (loopActive) {
      window.stopLoop();
      window.startLoop();
    }
  };

  function setupLoopLayers() {
    cleanupLoopLayers();
    const isMosaic = window.isMosaicVisible();
    const isSingle = window.isSingleSiteVisible();
    if (!isMosaic && !isSingle) return;

    const beforeLayer = isSingle
      ? window.layerIds.singleSiteRadar
      : window.layerIds.alertsZone;
    updateCount++;

    OFFSETS.forEach((offset) => {
      const sourceId = `loop-source-${offset}-${updateCount}`;
      const layerId = `loop-layer-${offset}-${updateCount}`;
      let tileUrl = "";

      if (isMosaic) {
        const product = iemProductForOffset(offset);
        const cacheBuster =
          offset < -50 ? product : Math.floor(Date.now() / 300000);
        tileUrl = `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/${product}/{z}/{x}/{y}.png?_=${cacheBuster}`;
      } else if (isSingle) {
        const ts = Math.floor(Date.now() / 120000) * 120000;
        const timeParam =
          offset !== 0
            ? `&TIME=${encodeURIComponent(new Date(Date.now() + offset * 60000).toISOString())}`
            : "";
        tileUrl = `https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${ts}`;
      }

      window.map.addSource(sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "NOAA",
      });

      window.map.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 0.0001,
            "raster-opacity-transition": { duration: 0 },
          },
        },
        beforeLayer,
      );

      loopLayers.push({ sourceId, layerId });
    });

    if (isMosaic) {
      const layersToHide = new Set([
        window.layerIds.radar,
        window.activeMosaicLayerId,
      ]);
      layersToHide.forEach((l) => {
        if (l && window.map.getLayer(l)) {
          window.map.setLayoutProperty(l, "visibility", "none");
        }
      });
    }
    if (isSingle && window.map.getLayer(window.layerIds.singleSiteRadar)) {
      window.map.setLayoutProperty(
        window.layerIds.singleSiteRadar,
        "visibility",
        "none",
      );
    }
  }

  function cleanupLoopLayers() {
    loopLayers.forEach((item) => {
      if (window.map.getLayer(item.layerId))
        window.map.removeLayer(item.layerId);
      if (window.map.getSource(item.sourceId))
        window.map.removeSource(item.sourceId);
    });
    loopLayers = [];

    const activeLayer = window.activeMosaicLayerId || window.layerIds.radar;
    const layersToRestore = new Set([window.layerIds.radar, activeLayer]);
    layersToRestore.forEach((l) => {
      if (l && window.map.getLayer(l)) {
        window.map.setLayoutProperty(
          l,
          "visibility",
          window.isMosaicVisible() ? "visible" : "none",
        );
      }
    });

    if (window.map.getLayer(window.layerIds.singleSiteRadar)) {
      window.map.setLayoutProperty(
        window.layerIds.singleSiteRadar,
        "visibility",
        "visible",
      );
    }
  }

  function cleanupLoopLayers() {
    loopLayers.forEach((item) => {
      if (window.map.getLayer(item.layerId))
        window.map.removeLayer(item.layerId);
      if (window.map.getSource(item.sourceId))
        window.map.removeSource(item.sourceId);
    });
    loopLayers = [];

    if (window.map.getLayer(window.layerIds.radar)) {
      window.map.setLayoutProperty(
        window.layerIds.radar,
        "visibility",
        window.isMosaicVisible() ? "visible" : "none",
      );
    }
    if (window.map.getLayer(window.layerIds.singleSiteRadar)) {
      window.map.setLayoutProperty(
        window.layerIds.singleSiteRadar,
        "visibility",
        "visible",
      );
    }
  }

  function performSeamlessUpdate() {
    if (!loopActive) return;
    updateCount++;
    const isMosaic = window.isMosaicVisible();
    const isSingle = window.isSingleSiteVisible();
    if (!isMosaic && !isSingle) return;

    const beforeLayer = isSingle
      ? window.layerIds.singleSiteRadar
      : window.layerIds.alertsZone;
    const nextLayers = [];

    OFFSETS.forEach((offset) => {
      const sourceId = `loop-source-${offset}-${updateCount}`;
      const layerId = `loop-layer-${offset}-${updateCount}`;
      let tileUrl = "";

      if (isMosaic) {
        const product = iemProductForOffset(offset);
        const cacheBuster =
          offset < -50 ? product : Math.floor(Date.now() / 300000);
        tileUrl = `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/${product}/{z}/{x}/{y}.png?_=${cacheBuster}`;
      } else if (isSingle) {
        const ts = Math.floor(Date.now() / 120000) * 120000;
        const timeParam =
          offset !== 0
            ? `&TIME=${encodeURIComponent(new Date(Date.now() + offset * 60000).toISOString())}`
            : "";
        tileUrl = `https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${ts}`;
      }

      window.map.addSource(sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "NOAA",
      });

      window.map.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 0.0001,
            "raster-opacity-transition": { duration: 0 },
          },
        },
        beforeLayer,
      );

      nextLayers.push({ sourceId, layerId });
    });

    let swapAttempted = false;
    let fallbackTimeout = null;

    const performSwap = () => {
      if (swapAttempted) return;
      swapAttempted = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);

      if (!loopActive) {
        nextLayers.forEach((item) => {
          if (window.map.getLayer(item.layerId))
            window.map.removeLayer(item.layerId);
          if (window.map.getSource(item.sourceId))
            window.map.removeSource(item.sourceId);
        });
        return;
      }

      const oldLayers = loopLayers;
      loopLayers = nextLayers;

      loopLayers.forEach((item, idx) => {
        if (window.map.getLayer(item.layerId)) {
          window.map.setPaintProperty(
            item.layerId,
            "raster-opacity",
            idx === stepIndex ? 1.0 : 0.0001,
          );
        }
      });

      oldLayers.forEach((item) => {
        if (window.map.getLayer(item.layerId))
          window.map.removeLayer(item.layerId);
        if (window.map.getSource(item.sourceId))
          window.map.removeSource(item.sourceId);
      });
    };

    window.map.once("idle", performSwap);
    fallbackTimeout = setTimeout(performSwap, 6000);
  }

  function playFrame() {
    if (!loopActive || loopLayers.length === 0) return;

    loopLayers.forEach((item, idx) => {
      if (window.map.getLayer(item.layerId)) {
        window.map.setPaintProperty(
          item.layerId,
          "raster-opacity",
          idx === stepIndex ? 1.0 : 0.0001,
        );
      }
    });

    stepIndex = (stepIndex + 1) % loopLayers.length;
    loopTimer = setTimeout(playFrame, FRAME_INTERVAL);
  }

  window.isRadarLoopActive = function () {
    return loopActive;
  };

  window.startLoop = function () {
    if (loopActive) return;
    loopActive = true;
    setupLoopLayers();
    stepIndex = 0;
    playFrame();
    updateIntervalId = setInterval(performSeamlessUpdate, 120000);
  };

  window.stopLoop = function () {
    loopActive = false;
    clearTimeout(loopTimer);
    if (updateIntervalId) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
    cleanupLoopLayers();
  };

  window.toggleRadarLoop = function () {
    loopActive ? window.stopLoop() : window.startLoop();
  };

  window.stepFrame = function (direction) {
    if (loopActive) {
      window.stopLoop();
    }
    if (loopLayers.length === 0) {
      setupLoopLayers();
    }
    stepIndex = (stepIndex + direction + OFFSETS.length) % OFFSETS.length;
    loopLayers.forEach((item, idx) => {
      if (window.map.getLayer(item.layerId)) {
        window.map.setPaintProperty(
          item.layerId,
          "raster-opacity",
          idx === stepIndex ? 1.0 : 0.0001,
        );
      }
    });
  };

  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    if (
      r &&
      (r.name === "AbortError" ||
        (typeof r.message === "string" &&
          r.message.toLowerCase().includes("abort")))
    ) {
      e.preventDefault();
    }
  });
})();
