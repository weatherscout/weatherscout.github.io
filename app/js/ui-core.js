window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
window.preloadedBuffers = new Map();

window.preloadAllAudio = async function () {
  for (const option of window.AUDIO_OPTIONS) {
    if (option.value === "none") continue;
    try {
      const response = await fetch(option.value, { mode: "cors" });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const decodedData = await window.audioCtx.decodeAudioData(arrayBuffer);
      window.preloadedBuffers.set(option.value, decodedData);
    } catch (e) {
      console.error(`Failed to preload audio: ${option.label}`, e);
    }
  }
};

window.playAlertSound = function (url, title = "Weather Alert") {
  if (window.audioCtx.state === "suspended") {
    window.audioCtx.resume();
  }
  const buffer = window.preloadedBuffers.get(url);
  if (!buffer) return;
  const source = window.audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(window.audioCtx.destination);
  source.start(0);
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "WeatherScout",
      artwork: [
        {
          src: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/refs/heads/main/assets/Sun%20behind%20small%20cloud/3D/sun_behind_small_cloud_3d.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
  }
};

document.addEventListener(
  "click",
  () => {
    if (window.audioCtx.state === "suspended") window.audioCtx.resume();
  },
  { once: false },
);

window.showToast = function (message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerText = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 1200);
};

window.resetAppData = function (toastMessage = "App Reset") {
  localStorage.clear();
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  if (toastMessage) window.showToast(toastMessage);
  setTimeout(() => location.reload(), toastMessage ? 600 : 0);
};

window.updateGreenStatusIndicators = function () {
  const radarToggle = document.getElementById("radar-toggle");
  const mosaicBtn = document.getElementById("fab-mosaic");
  if (mosaicBtn) {
    mosaicBtn.classList.toggle("status-on", radarToggle && radarToggle.checked);
  }
  const alertsBtn = document.getElementById("fab-alerts");
  if (alertsBtn) {
    alertsBtn.classList.toggle("status-on", window.alertsEnabled);
  }
  const sidebarToggle = document.getElementById("alerts-sidebar-toggle");
  if (sidebarToggle) {
    const icon = sidebarToggle.querySelector("i");
    if (icon) {
      icon.textContent = window.alertsEnabled
        ? "check_box"
        : "check_box_outline_blank";
    }
  }
  const spcActive =
    window.activeSpcDay !== "none" && window.activeSpcType !== "none";
  const outlooksBtn = document.getElementById("fab-outlooks");
  if (outlooksBtn) {
    outlooksBtn.classList.toggle("status-on", spcActive);
  }
  if (window.updateSpcOutlookPanelState) window.updateSpcOutlookPanelState();
};

window.myLocationZoomIndex = 0;

window.updateMyLocation = function () {
  if (!window.myLocationEnabled) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { longitude, latitude } = pos.coords;
      const fabLoc = document.getElementById("fab-my-location");
      if (fabLoc) fabLoc.querySelector("i").textContent = "my_location";
      if (!window.myLocationMarker) {
        const el = document.createElement("div");
        el.className = "my-location-dot";
        const zoomCycle = [13, 11, 9];

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const targetZoom = zoomCycle[window.myLocationZoomIndex];
          window.myLocationZoomIndex =
            (window.myLocationZoomIndex + 1) % zoomCycle.length;

          window.map.flyTo({
            center: window.myLocationMarker.getLngLat(),
            zoom: targetZoom,
            essential: true,
          });
        });
        window.myLocationMarker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([longitude, latitude])
          .addTo(window.map);
      } else {
        window.myLocationMarker.setLngLat([longitude, latitude]);
      }
    },
    () => {
      window.showToast("Location Error");
      window.toggleMyLocation(false);
    },
    { enableHighAccuracy: true },
  );
};

window.toggleMyLocation = function (enabled) {
  window.myLocationEnabled = enabled;
  const fabLoc = document.getElementById("fab-my-location");
  if (enabled) {
    if (fabLoc) {
      fabLoc.classList.add("status-on");
      fabLoc.querySelector("i").textContent = "location_searching";
    }
    window.updateMyLocation();
    window.myLocationInterval = setInterval(window.updateMyLocation, 5000);
    window.showToast("My Location: On");
  } else {
    if (fabLoc) {
      fabLoc.classList.remove("status-on");
      fabLoc.querySelector("i").textContent = "location_disabled";
    }
    if (window.myLocationInterval) clearInterval(window.myLocationInterval);
    if (window.myLocationMarker) {
      window.myLocationMarker.remove();
      window.myLocationMarker = null;
    }
    window.showToast("My Location: Off");
  }
  if (window.saveCurrentState) {
    window.saveCurrentState();
  }
};

window.startAlertIntervals = function () {
  if (window.nwsUpdateInterval) clearInterval(window.nwsUpdateInterval);
  if (window.placefileUpdateInterval)
    clearInterval(window.placefileUpdateInterval);

  const nwsTime = window.fasterUpdatesEnabled ? 15000 : 60000;
  const placeTime = window.fasterUpdatesEnabled ? 75000 : 300000;

  window.nwsUpdateInterval = setInterval(window.refreshNwsAlerts, nwsTime);
  window.placefileUpdateInterval = setInterval(
    window.updatePlacefileAlerts,
    placeTime,
  );
};

window.handleOutlookShortcut = function (day) {
  const types = window.outlookTypes[day];
  if (!types) return;
  const next =
    window.activeSpcDay === day
      ? types[(types.indexOf(window.activeSpcType) + 1) % types.length]
      : types[0];
  window.activeSpcDay = day;
  window.activeSpcType = next;
  if (window.updateSpcLayerVisibility) window.updateSpcLayerVisibility();
  if (window.saveCurrentState) window.saveCurrentState();
  window.showToast(`Outlook: Day ${day} ${window.typeLabels[next]}`);
  window.updateGreenStatusIndicators();
  if (window.updateSpcOutlookPanelState) window.updateSpcOutlookPanelState();
};

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (window.isAnyRadarVisible && window.isAnyRadarVisible()) {
    if (e.code === "Space") {
      e.preventDefault();
      if (window.toggleRadarLoop) window.toggleRadarLoop();
    } else if (e.key === "," || e.key === ".") {
      e.preventDefault();
      if (window.stepFrame) window.stepFrame(e.key === "," ? -1 : 1);
    }
  }

  if (!e.shiftKey) return;
  if (e.code === "KeyX") {
    if (window.unselectRadar) window.unselectRadar();
    return;
  }
  if (e.code === "KeyU") {
    if (window.debugModeEnabled) {
      document.getElementById("debug-file-input")?.click();
      window.showToast("Upload Debug File");
    }
    return;
  }
  if (e.code === "KeyA") {
    if (window.toggleAllAlerts) window.toggleAllAlerts();
    return;
  }
  if (e.code === "Backspace") {
    window.resetAppData("App Reset");
    return;
  }
  if (e.code === "KeyM") {
    const radarToggle = document.getElementById("radar-toggle");
    if (radarToggle) {
      radarToggle.checked = !radarToggle.checked;
      if (window.updateMosaicVisibility) window.updateMosaicVisibility();
      if (window.saveCurrentState) window.saveCurrentState();
      window.updateGreenStatusIndicators();
      if (window.updateRadarPanelToggles) window.updateRadarPanelToggles();
      window.showToast(`Radar Mosaic: ${radarToggle.checked ? "On" : "Off"}`);
    }
    return;
  }
  if (e.code === "KeyS") {
    window.showSitesMode = window.showSitesMode === "None" ? "Both" : "None";
    if (window.updateShowSitesFilter) window.updateShowSitesFilter();
    if (window.saveCurrentState) window.saveCurrentState();
    window.showToast(
      `Radar Sites: ${window.showSitesMode === "None" ? "Off" : "On"}`,
    );
    return;
  }
  if (e.code === "KeyL") {
    window.toggleMyLocation(!window.myLocationEnabled);
    return;
  }
  if (e.code === "KeyZ") {
    window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
    const toggleUI = document.getElementById("zone-alerts-settings-toggle-ui");
    if (toggleUI) toggleUI.classList.toggle("active");
    if (window.zoneAlertsEnabled && window.alertsEnabled) {
      window.showToast("Zone Alerts: On");
      if (window.map && window.map.getSource("alerts-poly-watch")) {
        window.map
          .getSource("alerts-poly-watch")
          .setData({ type: "FeatureCollection", features: [] });
      }
      window.globalPolyWatchAlerts = [];
      if (window.refreshNwsAlerts) window.refreshNwsAlerts(true);
    } else if (!window.zoneAlertsEnabled) {
      window.showToast("Zone Alerts: Off");
      if (window.map && window.map.getSource("alerts-zone")) {
        window.map
          .getSource("alerts-zone")
          .setData({ type: "FeatureCollection", features: [] });
      }
      window.globalZoneAlerts = [];
      if (window.alertsEnabled) {
        if (window.refreshNwsAlerts) window.refreshNwsAlerts(true);
        if (window.updatePlacefileAlerts) window.updatePlacefileAlerts(true);
      }
    }
  } else if (e.code === "Backquote") {
    window.activeSpcDay = window.activeSpcType = "none";
    if (window.updateSpcLayerVisibility) window.updateSpcLayerVisibility();
    if (window.saveCurrentState) window.saveCurrentState();
    window.showToast("Outlook: Off");
    window.updateGreenStatusIndicators();
  } else if (e.code.startsWith("Digit")) {
    window.handleOutlookShortcut(e.code.slice(5));
  }

  if (window.activeSiteIdForData) {
    const s = window.allRadarSitesData.find(
      (site) => site.properties.id.toLowerCase() === window.activeSiteIdForData,
    );
    if (s) {
      let p = null;
      if (e.code === "KeyR") {
        p =
          s.properties.stationType === "TDWR"
            ? window.activeRadarProductCode === "bref1"
              ? "brefl"
              : "bref1"
            : "sr_bref";
      } else if (e.code === "KeyV") {
        p = s.properties.stationType === "TDWR" ? "bvel" : "sr_bvel";
      }
      if (
        p &&
        p !== window.activeRadarProductCode &&
        window.toggleRadarProduct
      ) {
        window.toggleRadarProduct(window.activeSiteIdForData, p);
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  window.preloadAllAudio();

  const fabLocBtn = document.getElementById("fab-my-location");
  if (fabLocBtn) {
    fabLocBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.toggleMyLocation(!window.myLocationEnabled);
    });
  }

  window.saveCurrentState = function () {
    localStorage.setItem("motionVectorsEnabled", window.motionVectorsEnabled);
    localStorage.setItem("stormReportsEnabled", window.stormReportsEnabled);
    if (!window.map || localStorage.getItem("saveSettings") !== "true") return;

    const radarToggle = document.getElementById("radar-toggle");
    const sitesToggle = document.getElementById("radar-sites-toggle");
    const entries = {
      radarVisible: radarToggle ? radarToggle.checked : true,
      sitesVisible: sitesToggle ? sitesToggle.checked : true,
      alertsVisible: window.alertsEnabled,
      activeSpcDay: window.activeSpcDay,
      activeSpcType: window.activeSpcType,
      activeSiteId: window.activeSiteIdForData || "",
      activeProduct: window.activeRadarProductCode || "",
      siteSelection: window.radarSiteSelectionMode,
      showSites: window.showSitesMode,
      selectOfflineSites: window.selectOfflineSites,
      showOfflineSites: window.showOfflineSites,
      lockNorth: window.lockNorth,
      lockTilt: window.lockTilt,
      flyToRadar: window.flyToRadarSetting,
      zoneAlertsVisible: window.zoneAlertsEnabled,
      mesoDiscussionsVisible: window.mesoDiscussionsEnabled,
      fasterUpdates: window.fasterUpdatesEnabled,
      hiddenAlertTypes: JSON.stringify([...window.hiddenAlertTypes]),
      alertSoundsMap: JSON.stringify(window.alertSoundsMap),
      debugMode: window.debugModeEnabled,
      lastZoom: window.map.getZoom(),
      lastCenter: JSON.stringify(window.map.getCenter()),
      appTimeZone: window.appTimeZone,
      appDstMode: window.appDstMode,
      appHourMode: window.appHourMode,
      myLocationEnabled: window.myLocationEnabled,
      searchLocationsEnabled: window.searchLocationsEnabled,
      searchRadarsMax: window.searchRadarsMax,
      searchAlertsMax: window.searchAlertsMax,
      searchOutlooksMax: window.searchOutlooksMax,
      searchSettingsMax: window.searchSettingsMax,
    };
    Object.entries(entries).forEach(([k, v]) => localStorage.setItem(k, v));
  };

  window.saveSettingsEnabled = localStorage.getItem("saveSettings") === "true";
  if (window.saveSettingsEnabled) {
    const getBool = (key, defaultVal) => {
      const v = localStorage.getItem(key);
      return v === null ? defaultVal : v === "true";
    };
    const getInt = (key, defaultVal) => {
      const v = localStorage.getItem(key);
      return v === null ? defaultVal : parseInt(v, 10);
    };

    window.debugModeEnabled = getBool("debugMode", false);
    if (!getBool("radarVisible", true)) {
      const radarToggle = document.getElementById("radar-toggle");
      if (radarToggle) radarToggle.checked = false;
    }
    if (!getBool("sitesVisible", true)) {
      const sitesToggle = document.getElementById("radar-sites-toggle");
      if (sitesToggle) sitesToggle.checked = false;
    }
    window.alertsEnabled = getBool("alertsVisible", true);
    window.activeSpcDay = localStorage.getItem("activeSpcDay") || "none";
    window.activeSpcType = localStorage.getItem("activeSpcType") || "none";
    window.activeSiteIdForData = localStorage.getItem("activeSiteId") || null;
    window.activeRadarProductCode =
      localStorage.getItem("activeProduct") || null;
    window.radarSiteSelectionMode =
      localStorage.getItem("siteSelection") || "WSR-88D";
    window.showSitesMode = localStorage.getItem("showSites") || "Both";
    window.selectOfflineSites = getBool("selectOfflineSites", false);
    window.showOfflineSites = getBool("showOfflineSites", true);
    window.lockNorth = getBool("lockNorth", true);
    window.lockTilt = getBool("lockTilt", true);
    window.flyToRadarSetting = getBool("flyToRadar", false);
    window.zoneAlertsEnabled = getBool("zoneAlertsVisible", true);
    window.mesoDiscussionsEnabled = getBool("mesoDiscussionsVisible", true);
    window.fasterUpdatesEnabled = getBool("fasterUpdates", false);
    window.stormReportsEnabled = getBool("stormReportsEnabled", false);
    window.motionVectorsEnabled = getBool("motionVectorsEnabled", true);

    try {
      const savedHidden = localStorage.getItem("hiddenAlertTypes");
      if (savedHidden)
        window.hiddenAlertTypes = new Set(JSON.parse(savedHidden));
    } catch (e) {}
    try {
      const savedSounds = localStorage.getItem("alertSoundsMap");
      if (savedSounds) window.alertSoundsMap = JSON.parse(savedSounds);
    } catch (e) {}

    window.appTimeZone =
      localStorage.getItem("appTimeZone") || window.appTimeZone;
    window.appDstMode = localStorage.getItem("appDstMode") || window.appDstMode;
    window.appHourMode =
      localStorage.getItem("appHourMode") || window.appHourMode;
    window.myLocationEnabled = getBool("myLocationEnabled", false);
    window.searchLocationsEnabled = getBool("searchLocationsEnabled", true);
    window.searchRadarsMax = getInt("searchRadarsMax", 3);
    window.searchAlertsMax = getInt("searchAlertsMax", 3);
    window.searchOutlooksMax = getInt("searchOutlooksMax", 3);
    window.searchSettingsMax = getInt("searchSettingsMax", 3);
  } else {
    window.hiddenAlertTypes = new Set();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const sParam = urlParams.get("s");
  let overrodeSaveSettings = null;

  if (sParam) {
    const spcCodeMap = {
      c: "cat",
      t: "torn",
      h: "hail",
      w: "wind",
      p: "prob",
    };
    const setRadarToggle = (checked) => {
      const rt = document.getElementById("radar-toggle");
      if (rt) rt.checked = checked;
    };
    const flagHandlers = {
      ssb: () => (window.radarSiteSelectionMode = "Both"),
      ssw: () => (window.radarSiteSelectionMode = "WSR-88D"),
      sst: () => (window.radarSiteSelectionMode = "TDWR"),
      xss: () => (window.radarSiteSelectionMode = "None"),
      ftr: () => (window.flyToRadarSetting = true),
      xfr: () => (window.flyToRadarSetting = false),
      zna: () => (window.zoneAlertsEnabled = true),
      xza: () => (window.zoneAlertsEnabled = false),
      dbg: () => (window.debugModeEnabled = true),
      xdb: () => (window.debugModeEnabled = false),
      sav: () => (overrodeSaveSettings = true),
      xsv: () => (overrodeSaveSettings = false),
      xlk: () => {
        window.activeSpcDay = "none";
        window.activeSpcType = "none";
      },
      irm: () => setRadarToggle(true),
      xrm: () => setRadarToggle(false),
      alt: () => (window.alertsEnabled = true),
      xal: () => (window.alertsEnabled = false),
      myl: () => (window.myLocationEnabled = true),
      xml: () => (window.myLocationEnabled = false),
      fup: () => (window.fasterUpdatesEnabled = true),
      xfu: () => (window.fasterUpdatesEnabled = false),
      srp: () => (window.stormReportsEnabled = true),
      xsr: () => (window.stormReportsEnabled = false),
    };

    sParam
      .toLowerCase()
      .split(",")
      .forEach((flag) => {
        if (flagHandlers[flag]) {
          flagHandlers[flag]();
          return;
        }
        const m = flag.match(/^d([1-8])([cthwp])$/);
        if (m) {
          const day = m[1];
          const type = spcCodeMap[m[2]];
          if (window.outlookTypes[day]?.includes(type)) {
            window.activeSpcDay = day;
            window.activeSpcType = type;
          }
        }
      });

    if (overrodeSaveSettings !== null) {
      window.saveSettingsEnabled = overrodeSaveSettings;
      localStorage.setItem("saveSettings", String(overrodeSaveSettings));
    }
  }

  if (window.saveSettingsEnabled && sParam) {
    window.saveCurrentState();
  }

  setTimeout(window.updateGreenStatusIndicators, 500);
});
