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
      title: title,
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
          let targetZoom = zoomCycle[window.myLocationZoomIndex];
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
    (err) => {
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
  let next =
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
      if (window.stepFrame) window.stepFrame(e.key === "," ? -1 : +1);
    }
  }

  if (!e.shiftKey) return;
  if (e.code === "KeyX") {
    if (window.unselectRadar) window.unselectRadar();
    return;
  }
  if (e.code === "KeyU") {
    if (window.debugModeEnabled) {
      const dbgIn = document.getElementById("debug-file-input");
      if (dbgIn) dbgIn.click();
      window.showToast("Upload Debug File");
    }
    return;
  }
  if (e.code === "KeyA") {
    if (window.toggleAllAlerts) window.toggleAllAlerts();
    return;
  }
  if (e.code === "Backspace") {
    localStorage.clear();
    document.cookie
      .split(";")
      .forEach(
        (c) =>
          (document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/",
            )),
      );
    window.showToast("App Reset");
    setTimeout(() => location.reload(), 600);
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
      if (window.map && window.map.getSource("alerts-poly-watch"))
        window.map
          .getSource("alerts-poly-watch")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalPolyWatchAlerts = [];
      if (window.refreshNwsAlerts) window.refreshNwsAlerts(true);
    } else if (!window.zoneAlertsEnabled) {
      window.showToast("Zone Alerts: Off");
      if (window.map && window.map.getSource("alerts-zone"))
        window.map
          .getSource("alerts-zone")
          .setData({ type: "FeatureCollection", features: [] });
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
        if (s.properties.stationType === "TDWR") {
          p = window.activeRadarProductCode === "bref1" ? "brefl" : "bref1";
        } else {
          p = "sr_bref";
        }
      } else if (e.code === "KeyV") {
        p = s.properties.stationType === "TDWR" ? "bvel" : "sr_bvel";
      }
      if (p && p !== window.activeRadarProductCode && window.toggleRadarProduct)
        window.toggleRadarProduct(window.activeSiteIdForData, p);
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
    const radarToggle = document.getElementById("radar-toggle");
    const sitesToggle = document.getElementById("radar-sites-toggle");
    if (window.map && localStorage.getItem("saveSettings") === "true") {
      if (localStorage.getItem("motionVectorsEnabled") === "false") {
        window.motionVectorsEnabled = false;
      } else {
        window.motionVectorsEnabled = true;
      }
      localStorage.setItem(
        "radarVisible",
        radarToggle ? radarToggle.checked : true,
      );
      localStorage.setItem(
        "sitesVisible",
        sitesToggle ? sitesToggle.checked : true,
      );
      localStorage.setItem("alertsVisible", window.alertsEnabled);
      localStorage.setItem("activeSpcDay", window.activeSpcDay);
      localStorage.setItem("activeSpcType", window.activeSpcType);
      localStorage.setItem("activeSiteId", window.activeSiteIdForData || "");
      localStorage.setItem(
        "activeProduct",
        window.activeRadarProductCode || "",
      );
      localStorage.setItem("siteSelection", window.radarSiteSelectionMode);
      localStorage.setItem("showSites", window.showSitesMode);
      localStorage.setItem("selectOfflineSites", window.selectOfflineSites);
      localStorage.setItem("showOfflineSites", window.showOfflineSites);
      localStorage.setItem("lockNorth", window.lockNorth);
      localStorage.setItem("lockTilt", window.lockTilt);
      localStorage.setItem("flyToRadar", window.flyToRadarSetting);
      localStorage.setItem("zoneAlertsVisible", window.zoneAlertsEnabled);
      localStorage.setItem(
        "mesoDiscussionsVisible",
        window.mesoDiscussionsEnabled,
      );
      localStorage.setItem("fasterUpdates", window.fasterUpdatesEnabled);
      localStorage.setItem(
        "hiddenAlertTypes",
        JSON.stringify([...window.hiddenAlertTypes]),
      );
      localStorage.setItem(
        "alertSoundsMap",
        JSON.stringify(window.alertSoundsMap),
      );
      localStorage.setItem("debugMode", window.debugModeEnabled);
      localStorage.setItem("lastZoom", window.map.getZoom());
      localStorage.setItem(
        "lastCenter",
        JSON.stringify(window.map.getCenter()),
      );
      localStorage.setItem("appTimeZone", window.appTimeZone);
      localStorage.setItem("appDstMode", window.appDstMode);
      localStorage.setItem("appHourMode", window.appHourMode);
      localStorage.setItem("myLocationEnabled", window.myLocationEnabled);
      localStorage.setItem(
        "searchLocationsEnabled",
        window.searchLocationsEnabled,
      );
      localStorage.setItem("searchRadarsMax", window.searchRadarsMax);
      localStorage.setItem("searchAlertsMax", window.searchAlertsMax);
      localStorage.setItem("searchOutlooksMax", window.searchOutlooksMax);
      localStorage.setItem("searchSettingsMax", window.searchSettingsMax);
    }
  };

  window.saveSettingsEnabled = localStorage.getItem("saveSettings") === "true";
  if (window.saveSettingsEnabled) {
    window.debugModeEnabled = localStorage.getItem("debugMode") === "true";
    if (localStorage.getItem("radarVisible") === "false") {
      const radarToggle = document.getElementById("radar-toggle");
      if (radarToggle) radarToggle.checked = false;
    }
    if (localStorage.getItem("sitesVisible") === "false") {
      const sitesToggle = document.getElementById("radar-sites-toggle");
      if (sitesToggle) sitesToggle.checked = false;
    }
    if (localStorage.getItem("alertsVisible") === "false")
      window.alertsEnabled = false;

    window.activeSpcDay = localStorage.getItem("activeSpcDay") || "none";
    window.activeSpcType = localStorage.getItem("activeSpcType") || "none";
    window.activeSiteIdForData = localStorage.getItem("activeSiteId") || null;
    window.activeRadarProductCode =
      localStorage.getItem("activeProduct") || null;
    window.radarSiteSelectionMode =
      localStorage.getItem("siteSelection") || "WSR-88D";
    window.showSitesMode = localStorage.getItem("showSites") || "Both";
    window.selectOfflineSites =
      localStorage.getItem("selectOfflineSites") === "true";
    window.showOfflineSites =
      localStorage.getItem("showOfflineSites") !== "false";
    window.lockNorth = localStorage.getItem("lockNorth") !== "false";
    window.lockTilt = localStorage.getItem("lockTilt") !== "false";
    window.flyToRadarSetting = localStorage.getItem("flyToRadar") === "true";

    if (localStorage.getItem("zoneAlertsVisible") === "false")
      window.zoneAlertsEnabled = false;
    if (localStorage.getItem("mesoDiscussionsVisible") === "false")
      window.mesoDiscussionsEnabled = false;
    if (localStorage.getItem("fasterUpdates") === "true")
      window.fasterUpdatesEnabled = true;

    if (localStorage.getItem("stormReportsEnabled") === "true")
      window.stormReportsEnabled = true;

    const savedHidden = localStorage.getItem("hiddenAlertTypes");
    if (savedHidden) {
      try {
        window.hiddenAlertTypes = new Set(JSON.parse(savedHidden));
      } catch (e) {}
    }
    const savedSounds = localStorage.getItem("alertSoundsMap");
    if (savedSounds) {
      try {
        window.alertSoundsMap = JSON.parse(savedSounds);
      } catch (e) {}
    }

    const savedTz = localStorage.getItem("appTimeZone");
    if (savedTz) window.appTimeZone = savedTz;
    const savedDst = localStorage.getItem("appDstMode");
    if (savedDst) window.appDstMode = savedDst;
    const savedHour = localStorage.getItem("appHourMode");
    if (savedHour) window.appHourMode = savedHour;
    if (localStorage.getItem("myLocationEnabled") === "true")
      window.myLocationEnabled = true;

    if (localStorage.getItem("searchLocationsEnabled") === "false")
      window.searchLocationsEnabled = false;
    const sRadars = localStorage.getItem("searchRadarsMax");
    if (sRadars !== null) window.searchRadarsMax = parseInt(sRadars, 10);
    const sAlerts = localStorage.getItem("searchAlertsMax");
    if (sAlerts !== null) window.searchAlertsMax = parseInt(sAlerts, 10);
    const sOutlooks = localStorage.getItem("searchOutlooksMax");
    if (sOutlooks !== null) window.searchOutlooksMax = parseInt(sOutlooks, 10);
    const sSettings = localStorage.getItem("searchSettingsMax");
    if (sSettings !== null) window.searchSettingsMax = parseInt(sSettings, 10);
  } else {
    window.hiddenAlertTypes = new Set();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const sParam = urlParams.get("s");
  let overrodeSaveSettings = null;

  if (sParam) {
    const flags = sParam.toLowerCase().split(",");
    flags.forEach((flag) => {
      switch (flag) {
        case "ssb":
          window.radarSiteSelectionMode = "Both";
          break;
        case "ssw":
          window.radarSiteSelectionMode = "WSR-88D";
          break;
        case "sst":
          window.radarSiteSelectionMode = "TDWR";
          break;
        case "xss":
          window.radarSiteSelectionMode = "None";
          break;
        case "ftr":
          window.flyToRadarSetting = true;
          break;
        case "xfr":
          window.flyToRadarSetting = false;
          break;
        case "zna":
          window.zoneAlertsEnabled = true;
          break;
        case "xza":
          window.zoneAlertsEnabled = false;
          break;
        case "dbg":
          window.debugModeEnabled = true;
          break;
        case "xdb":
          window.debugModeEnabled = false;
          break;
        case "sav":
          overrodeSaveSettings = true;
          break;
        case "xsv":
          overrodeSaveSettings = false;
          break;
        case "d1c":
          window.activeSpcDay = "1";
          window.activeSpcType = "cat";
          break;
        case "d1t":
          window.activeSpcDay = "1";
          window.activeSpcType = "torn";
          break;
        case "d1h":
          window.activeSpcDay = "1";
          window.activeSpcType = "hail";
          break;
        case "d1w":
          window.activeSpcDay = "1";
          window.activeSpcType = "wind";
          break;
        case "d2c":
          window.activeSpcDay = "2";
          window.activeSpcType = "cat";
          break;
        case "d2t":
          window.activeSpcDay = "2";
          window.activeSpcType = "torn";
          break;
        case "d2h":
          window.activeSpcDay = "2";
          window.activeSpcType = "hail";
          break;
        case "d2w":
          window.activeSpcDay = "2";
          window.activeSpcType = "wind";
          break;
        case "d3c":
          window.activeSpcDay = "3";
          window.activeSpcType = "cat";
          break;
        case "d3p":
          window.activeSpcDay = "3";
          window.activeSpcType = "prob";
          break;
        case "d4p":
          window.activeSpcDay = "4";
          window.activeSpcType = "prob";
          break;
        case "d5p":
          window.activeSpcDay = "5";
          window.activeSpcType = "prob";
          break;
        case "d6p":
          window.activeSpcDay = "6";
          window.activeSpcType = "prob";
          break;
        case "d7p":
          window.activeSpcDay = "7";
          window.activeSpcType = "prob";
          break;
        case "d8p":
          window.activeSpcDay = "8";
          window.activeSpcType = "prob";
          break;
        case "xlk":
          window.activeSpcDay = "none";
          window.activeSpcType = "none";
          break;
        case "irm":
          const rtOn = document.getElementById("radar-toggle");
          if (rtOn) rtOn.checked = true;
          break;
        case "xrm":
          const rtOff = document.getElementById("radar-toggle");
          if (rtOff) rtOff.checked = false;
          break;
        case "alt":
          window.alertsEnabled = true;
          break;
        case "xal":
          window.alertsEnabled = false;
          break;
        case "myl":
          window.myLocationEnabled = true;
          break;
        case "xml":
          window.myLocationEnabled = false;
          break;
        case "fup":
          window.fasterUpdatesEnabled = true;
          break;
        case "xfu":
          window.fasterUpdatesEnabled = false;
          break;
        case "srp":
          window.stormReportsEnabled = true;
          break;
        case "xsr":
          window.stormReportsEnabled = false;
          break;
      }
    });
    if (overrodeSaveSettings === true) {
      window.saveSettingsEnabled = true;
      localStorage.setItem("saveSettings", "true");
    } else if (overrodeSaveSettings === false) {
      window.saveSettingsEnabled = false;
      localStorage.setItem("saveSettings", "false");
    }
  }

  if (window.saveSettingsEnabled && urlParams.get("s")) {
    window.saveCurrentState();
  }

  setTimeout(window.updateGreenStatusIndicators, 500);
});
