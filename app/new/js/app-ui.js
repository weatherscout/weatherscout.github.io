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

window.menuHistory = [];

window.getCurrentOpenMenu = function () {
  if (document.getElementById("settings-popup").classList.contains("open"))
    return "settings";
  if (
    document.getElementById("alert-settings-popup").classList.contains("open")
  )
    return "alert-settings";
  if (document.getElementById("radar-panel").classList.contains("open"))
    return "radar";
  if (
    document.getElementById("radar-settings-popup").classList.contains("open")
  )
    return "radar-settings";
  if (document.getElementById("hidden-alerts-panel").classList.contains("open"))
    return "hidden-alerts";
  if (document.getElementById("alert-sounds-panel").classList.contains("open"))
    return "alert-sounds";
  if (
    document.getElementById("location-search-panel").classList.contains("open")
  )
    return "search";
  if (document.getElementById("spc-outlook-panel").classList.contains("open"))
    return "outlooks";
  if (document.getElementById("alerts-sidebar").classList.contains("open"))
    return "alerts-sidebar";
  if (
    document.getElementById("search-settings-popup").classList.contains("open")
  )
    return "search-settings";
  return null;
};

window.closeAllMenus = function () {
  const menus = [
    "settings-popup",
    "alert-settings-popup",
    "radar-panel",
    "radar-settings-popup",
    "hidden-alerts-panel",
    "alert-sounds-panel",
    "location-search-panel",
    "spc-outlook-panel",
    "alerts-sidebar",
    "search-settings-popup",
  ];
  menus.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  });
  const searchBtn = document.getElementById("fab-search-btn");
  if (searchBtn) searchBtn.classList.remove("active");
  const outlooksBtn = document.getElementById("fab-outlooks");
  if (outlooksBtn) outlooksBtn.classList.remove("active");
  const mosaicBtn = document.getElementById("fab-mosaic");
  if (mosaicBtn) mosaicBtn.classList.remove("active");
  const alertsBtn = document.getElementById("fab-alerts");
  if (alertsBtn) alertsBtn.classList.remove("active");
  const settingsBtn = document.getElementById("fab-settings");
  if (settingsBtn) settingsBtn.classList.remove("active");
  if (window.closeFullAlertPopup) window.closeFullAlertPopup();
};

window.goBack = function () {
  if (window.menuHistory.length > 0) {
    const prevMenu = window.menuHistory.pop();
    window.openMenuById(prevMenu, true);
  } else {
    window.closeAllMenus();
  }
};

window.openMenuById = function (id, isBack = false) {
  switch (id) {
    case "settings":
      window.openSettings(isBack);
      break;
    case "alert-settings":
      window.openAlertSettings(isBack);
      break;
    case "radar":
      window.openRadarPanel(isBack);
      break;
    case "radar-settings":
      window.openRadarSettingsFrom(null, isBack);
      break;
    case "hidden-alerts":
      window.openHiddenAlertsPanel(isBack);
      break;
    case "alert-sounds":
      window.openAlertSoundsPanel(isBack);
      break;
    case "search":
      window.openLocationSearch(isBack);
      break;
    case "outlooks":
      window.openSpcOutlookPanel(isBack);
      break;
    case "alerts-sidebar":
      window.openSidebar(isBack);
      break;
    case "search-settings":
      window.openSearchSettings(isBack);
      break;
  }
};

window.openSearchSettings = function (isBack = false) {
  if (!isBack) {
    const curr = window.getCurrentOpenMenu();
    if (curr) window.menuHistory.push(curr);
  }
  window.closeAllMenus();
  const searchSettingsPopup = document.getElementById("search-settings-popup");
  if (searchSettingsPopup) {
    searchSettingsPopup.classList.add("open");
    const body = searchSettingsPopup.querySelector(".settings-body");
    if (body) body.scrollTop = 0;
  }
};

window.closeSearchSettings = function () {
  const searchSettingsPopup = document.getElementById("search-settings-popup");
  if (searchSettingsPopup) {
    searchSettingsPopup.classList.remove("open");
  }
};

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
  window.updateSpcOutlookPanelState();
};

window.toggleFabMenu = function () {
  const menu = document.getElementById("fab-menu");
  const btn = document.getElementById("fab-menu-btn");
  menu.classList.toggle("open");
  btn.classList.toggle("active", menu.classList.contains("open"));
};

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
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          window.map.flyTo({
            center: window.myLocationMarker.getLngLat(),
            zoom: 9,
            essential: true,
          });
        });
        window.myLocationMarker = new maplibregl.Marker({ element: el })
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

window.map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  center: [-97, 39],
  zoom: 3,
  attributionControl: false,
});

let currentMapPopup = null;
let currentStackedAlertsOnMap = [];
let currentStackedAlertIndex = 0;
let locationSearchMarker = null;
let locationSearchTimeout = null;

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

document.addEventListener("DOMContentLoaded", () => {
  window.preloadAllAudio();

  const saveSettingsBtn = document.getElementById("save-settings-btn");
  const saveSettingsToggleUI = document.getElementById(
    "save-settings-toggle-ui",
  );
  const resetAppBtn = document.getElementById("reset-app-settings-btn");
  const selectOfflineBtn = document.getElementById("select-offline-toggle-btn");
  const selectOfflineToggleUI = document.getElementById(
    "select-offline-toggle-ui",
  );
  const showOfflineBtn = document.getElementById("show-offline-toggle-btn");
  const showOfflineToggleUI = document.getElementById("show-offline-toggle-ui");
  const flySettingsBtn = document.getElementById("fly-settings-btn");
  const flySettingsToggleUI = document.getElementById("fly-settings-toggle-ui");
  const zoneAlertsBtn = document.getElementById("zone-alerts-settings-btn");
  const zoneAlertsToggleUI = document.getElementById(
    "zone-alerts-settings-toggle-ui",
  );
  const mesoDiscussionsBtn = document.getElementById(
    "meso-discussions-settings-btn",
  );
  const mesoDiscussionsToggleUI = document.getElementById(
    "meso-discussions-settings-toggle-ui",
  );
  const fasterUpdatesBtn = document.getElementById(
    "faster-updates-settings-btn",
  );
  const fasterUpdatesToggleUI = document.getElementById(
    "faster-updates-settings-toggle-ui",
  );
  const debugSettingsBtn = document.getElementById("debug-settings-btn");
  const debugSettingsToggleUI = document.getElementById(
    "debug-settings-toggle-ui",
  );
  const fabLocBtn = document.getElementById("fab-my-location");
  const radarToggle = document.getElementById("radar-toggle");
  const sitesToggle = document.getElementById("radar-sites-toggle");
  const debugInput = document.getElementById("debug-file-input");

  const mosaicSettingsBtn = document.getElementById(
    "mosaic-toggle-settings-btn",
  );
  const mosaicSettingsToggleUI = document.getElementById(
    "mosaic-toggle-settings-toggle-ui",
  );
  const radarToggleEl = document.getElementById("radar-toggle");

  const locationSearchPanel = document.getElementById("location-search-panel");
  const locationSearchInput = document.getElementById("location-search-input");
  const locationSearchResults = document.getElementById(
    "location-search-results",
  );
  const locationSearchEmpty = document.getElementById("location-search-empty");
  const locationSearchEmptyText = document.getElementById(
    "location-search-empty-text",
  );

  const searchSettingsBtn = document.getElementById(
    "location-search-settings-btn",
  );
  const searchSettingsBackBtn = document.getElementById(
    "search-settings-back-btn",
  );
  const searchSettingsCloseBtn = document.getElementById(
    "search-settings-close-btn",
  );
  const settingsOpenSearchBtn = document.getElementById(
    "settings-open-search-btn",
  );
  const locationSearchSettingsBtn = document.getElementById(
    "location-search-settings-btn",
  );

  const searchLocationsToggleBtn = document.getElementById(
    "search-locations-toggle-btn",
  );
  const searchLocationsToggleUI = document.getElementById(
    "search-locations-toggle-ui",
  );
  const searchRadarsLimit = document.getElementById("search-radars-limit");
  const searchAlertsLimit = document.getElementById("search-alerts-limit");
  const searchOutlooksLimit = document.getElementById("search-outlooks-limit");
  const searchSettingsLimit = document.getElementById("search-settings-limit");

  if (searchSettingsBtn) {
    searchSettingsBtn.addEventListener("click", () =>
      window.openSearchSettings(),
    );
  }
  if (searchSettingsBackBtn)
    searchSettingsBackBtn.addEventListener("click", window.goBack);
  if (searchSettingsCloseBtn)
    searchSettingsCloseBtn.addEventListener(
      "click",
      window.closeSearchSettings,
    );
  if (settingsOpenSearchBtn)
    settingsOpenSearchBtn.addEventListener("click", () =>
      window.openSearchSettings(),
    );
  if (locationSearchSettingsBtn)
    locationSearchSettingsBtn.addEventListener("click", () =>
      window.openSearchSettings(),
    );

  if (
    searchLocationsToggleBtn &&
    searchLocationsToggleUI &&
    searchRadarsLimit &&
    searchAlertsLimit &&
    searchOutlooksLimit &&
    searchSettingsLimit
  ) {
    searchLocationsToggleUI.classList.toggle(
      "active",
      window.searchLocationsEnabled,
    );
    searchRadarsLimit.value = window.searchRadarsMax;
    searchAlertsLimit.value = window.searchAlertsMax;
    searchOutlooksLimit.value = window.searchOutlooksMax;
    searchSettingsLimit.value = window.searchSettingsMax;

    searchLocationsToggleBtn.addEventListener("click", () => {
      window.searchLocationsEnabled = !window.searchLocationsEnabled;
      searchLocationsToggleUI.classList.toggle(
        "active",
        window.searchLocationsEnabled,
      );
      window.saveCurrentState();
      window.showToast(
        `Location Results: ${window.searchLocationsEnabled ? "On" : "Off"}`,
      );
    });

    searchRadarsLimit.addEventListener("change", (e) => {
      window.searchRadarsMax = parseInt(e.target.value, 10);
      window.saveCurrentState();
    });

    searchAlertsLimit.addEventListener("change", (e) => {
      window.searchAlertsMax = parseInt(e.target.value, 10);
      window.saveCurrentState();
    });

    searchOutlooksLimit.addEventListener("change", (e) => {
      window.searchOutlooksMax = parseInt(e.target.value, 10);
      window.saveCurrentState();
    });

    searchSettingsLimit.addEventListener("change", (e) => {
      window.searchSettingsMax = parseInt(e.target.value, 10);
      window.saveCurrentState();
    });
  }

  if (mosaicSettingsBtn && mosaicSettingsToggleUI && radarToggleEl) {
    mosaicSettingsToggleUI.classList.toggle("active", radarToggleEl.checked);
    mosaicSettingsBtn.addEventListener("click", () => {
      radarToggleEl.checked = !radarToggleEl.checked;
      mosaicSettingsToggleUI.classList.toggle("active", radarToggleEl.checked);
      window.updateMosaicVisibility();
      window.saveCurrentState();
      window.updateGreenStatusIndicators();
      if (window.updateRadarPanelToggles) window.updateRadarPanelToggles();
      window.showToast(`Radar Mosaic: ${radarToggleEl.checked ? "On" : "Off"}`);
    });
  }

  if (locationSearchInput) {
    function createSearchSectionHeader(title, icon) {
      const h = document.createElement("div");
      h.className = "search-section-header";
      h.style.cssText =
        "display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#ffffff61;padding:12px 6px 6px;";
      h.innerHTML = `<i class="material-symbols-rounded" style="font-size:14px;">${icon}</i><span>${title}</span>`;
      return h;
    }

    function createSearchResultItem(title, detail, icon, clickCallback) {
      const item = document.createElement("div");
      item.className = "location-result-item";
      item.innerHTML = `<i class="material-symbols-rounded" style="color:#ffffff61;font-size:18px;">${icon}</i><div class="location-result-text"><div class="location-result-name">${title}</div>${detail ? `<div class="location-result-detail">${detail}</div>` : ""}</div>`;
      item.addEventListener("click", clickCallback);
      return item;
    }

    locationSearchInput.addEventListener("input", () => {
      const q = locationSearchInput.value.trim();
      const query = q.toLowerCase();
      clearTimeout(locationSearchTimeout);

      if (locationSearchResults) {
        locationSearchResults
          .querySelectorAll(
            ".location-result-item, .search-section-header, .settings-row",
          )
          .forEach((el) => el.remove());
      }

      if (!q) {
        if (locationSearchEmpty) locationSearchEmpty.style.display = "flex";
        setLocationSearchEmpty("travel_explore", "Results show up here");
        return;
      }

      if (locationSearchEmpty) locationSearchEmpty.style.display = "none";
      let localResultsRendered = false;

      if (window.searchRadarsMax > 0) {
        const matchedRadars = window.allRadarSitesData
          .filter((site) => {
            const id = (site.properties.id || "").toLowerCase();
            const name = (site.properties.name || "").toLowerCase();
            return id.includes(query) || name.includes(query);
          })
          .slice(0, window.searchRadarsMax);

        if (matchedRadars.length > 0) {
          locationSearchResults.appendChild(
            createSearchSectionHeader("Radar Sites", "radar"),
          );
          matchedRadars.forEach((site) => {
            const id = site.properties.id;
            const name = site.properties.name;
            const type = site.properties.stationType;
            const row = createSearchResultItem(
              `${id} – ${name}`,
              `${type} Station`,
              "location_on",
              () => {
                window.closeLocationSearch();
                const siteId = id.toLowerCase();
                const prodCode = window.activeRadarProductCode
                  ? window.activeRadarProductCode.includes("vel")
                    ? type === "TDWR"
                      ? "bvel"
                      : "sr_bvel"
                    : window.activeRadarProductCode === "brefl"
                      ? type === "TDWR"
                        ? "brefl"
                        : "sr_bref"
                      : type === "TDWR"
                        ? "bref1"
                        : "sr_bref"
                  : type === "TDWR"
                    ? "bref1"
                    : "sr_bref";
                if (
                  window.activeSiteIdForData !== siteId ||
                  window.activeRadarProductCode !== prodCode
                ) {
                  window.toggleRadarProduct(siteId, prodCode);
                }
                window.map.flyTo({
                  center: site.geometry.coordinates,
                  zoom: 7,
                  essential: true,
                });
                window.updateGreenStatusIndicators();
              },
            );
            locationSearchResults.appendChild(row);
          });
          localResultsRendered = true;
        }
      }

      if (window.searchAlertsMax > 0) {
        const allAlerts = [
          ...window.globalPolyAlerts,
          ...window.globalZoneAlerts,
          ...(window.mesoDiscussionsEnabled ? window.globalMdAlerts : []),
          ...window.globalPolyWatchAlerts,
        ];
        const seenAlertIds = new Set();
        const uniqueAlerts = allAlerts.filter((f) => {
          const id = f.properties.id;
          if (seenAlertIds.has(id)) return false;
          seenAlertIds.add(id);
          return true;
        });

        const matchedAlerts = uniqueAlerts
          .filter((f) => {
            const event = (f.properties.event || "").toLowerCase();
            const specificName = (
              f.properties.specificEventName || ""
            ).toLowerCase();
            const area = (f.properties.areaDesc || "").toLowerCase();
            return (
              event.includes(query) ||
              specificName.includes(query) ||
              area.includes(query)
            );
          })
          .slice(0, window.searchAlertsMax);

        if (matchedAlerts.length > 0) {
          locationSearchResults.appendChild(
            createSearchSectionHeader("Active Warnings", "warning"),
          );
          matchedAlerts.forEach((f) => {
            const name = f.properties.specificEventName || f.properties.event;
            const area = f.properties.areaDesc || "Overlapping Region";
            const row = createSearchResultItem(name, area, "warning", () => {
              window.closeLocationSearch();
              window.flyToAlert(f);
            });
            locationSearchResults.appendChild(row);
          });
          localResultsRendered = true;
        }
      }

      if (window.searchOutlooksMax > 0) {
        const matchedOutlooks = [];
        const seenOutlooks = new Set();

        window.spcSources.forEach((s) => {
          const data = window.spcSourceCache[s.id];
          if (!data || !data.features) return;

          const dayMatch = s.id.match(/spc-day(\d+)-(\w+)/);
          if (!dayMatch) return;
          const day = dayMatch[1];
          const type = dayMatch[2];

          data.features.forEach((feature) => {
            const rawLabel = (
              feature.properties.LABEL ||
              feature.properties.LABEL2 ||
              ""
            ).trim();
            if (!rawLabel) return;
            const formattedLabel = window.formatSpcLabel(rawLabel);
            const typeName =
              {
                cat: "Categorical",
                torn: "Tornado",
                wind: "Wind",
                hail: "Hail",
                prob: "Probabilistic",
              }[type] || "Outlook";
            const searchStr =
              `spc outlook day ${day} ${typeName} ${formattedLabel} ${rawLabel}`.toLowerCase();

            if (searchStr.includes(query)) {
              const uniqueKey = `${day}-${type}-${rawLabel}`;
              if (!seenOutlooks.has(uniqueKey)) {
                seenOutlooks.add(uniqueKey);
                matchedOutlooks.push({
                  day,
                  type,
                  typeName,
                  label: formattedLabel,
                  fill: feature.properties.fill || "#808080",
                  feature,
                });
              }
            }
          });
        });

        const limitedOutlooks = matchedOutlooks.slice(
          0,
          window.searchOutlooksMax,
        );
        if (limitedOutlooks.length > 0) {
          locationSearchResults.appendChild(
            createSearchSectionHeader("SPC Outlooks", "map"),
          );
          limitedOutlooks.forEach((o) => {
            const title = `Day ${o.day} ${o.typeName}`;
            const detail = `Risk: ${o.label}`;
            const row = createSearchResultItem(title, detail, "map", () => {
              window.closeLocationSearch();

              window.activeSpcDay = o.day;
              window.activeSpcType = o.type;
              window.updateSpcLayerVisibility();
              window.saveCurrentState();
              window.updateGreenStatusIndicators();

              const bounds = new maplibregl.LngLatBounds();
              const processCoords = (coords) => {
                for (const coord of coords) {
                  if (Array.isArray(coord[0])) processCoords(coord);
                  else bounds.extend(coord);
                }
              };
              if (o.feature.geometry && o.feature.geometry.coordinates) {
                try {
                  processCoords(o.feature.geometry.coordinates);
                  if (bounds.getNorthEast() && bounds.getSouthWest()) {
                    window.map.fitBounds(bounds, {
                      padding: 40,
                      essential: true,
                    });
                  }
                } catch (e) {
                  console.error(
                    "Bounds parsing failed for outlook polygon.",
                    e,
                  );
                }
              }
            });
            locationSearchResults.appendChild(row);
          });
          localResultsRendered = true;
        }
      }

      if (window.searchSettingsMax > 0) {
        const excludedIds = [
          "settings-open-alerts-btn",
          "settings-open-radar-btn",
          "settings-open-search-btn",
        ];

        const allSettingsRows = Array.from(
          document.querySelectorAll(".settings-popup .settings-row"),
        ).filter((row) => !excludedIds.includes(row.id));

        const matchedSettings = allSettingsRows
          .filter((row) => {
            if (!row.textContent.trim()) return false;
            return row.textContent.toLowerCase().includes(query);
          })
          .slice(0, window.searchSettingsMax);

        if (matchedSettings.length > 0) {
          locationSearchResults.appendChild(
            createSearchSectionHeader("App Settings", "settings"),
          );

          matchedSettings.forEach((origRow) => {
            const liveClone = origRow.cloneNode(true);

            liveClone.removeAttribute("id");
            liveClone
              .querySelectorAll("*")
              .forEach((child) => child.removeAttribute("id"));

            liveClone.style.marginBottom = "6px";
            liveClone.style.background = "var(--glass-bg)";
            liveClone.style.border = "var(--glass-border)";
            liveClone.style.borderRadius = "var(--glass-radius)";

            liveClone.addEventListener("click", (e) => {
              if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT")
                return;

              const cloneElements = Array.from(liveClone.querySelectorAll("*"));
              const targetIndex = cloneElements.indexOf(e.target);

              if (targetIndex !== -1) {
                const origElements = Array.from(origRow.querySelectorAll("*"));
                if (origElements[targetIndex])
                  origElements[targetIndex].click();
                else origRow.click();
              } else {
                origRow.click();
              }

              const isNavigation = origRow
                .querySelector("i.material-symbols-rounded:last-child")
                ?.textContent.includes("chevron_right");
              if (isNavigation) {
                window.closeLocationSearch();
              } else {
                setTimeout(() => {
                  const origToggles =
                    origRow.querySelectorAll(".settings-toggle");
                  const cloneToggles =
                    liveClone.querySelectorAll(".settings-toggle");
                  origToggles.forEach((t, i) => {
                    if (cloneToggles[i])
                      cloneToggles[i].className = t.className;
                  });

                  const origBtns = origRow.querySelectorAll("button");
                  const cloneBtns = liveClone.querySelectorAll("button");
                  origBtns.forEach((b, i) => {
                    if (cloneBtns[i]) cloneBtns[i].className = b.className;
                  });
                }, 50);
              }
            });

            const cloneInputs = liveClone.querySelectorAll("select, input");
            const origInputs = origRow.querySelectorAll("select, input");
            cloneInputs.forEach((input, index) => {
              input.addEventListener("change", (e) => {
                origInputs[index].value = e.target.value;
                origInputs[index].dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              });
              input.addEventListener("input", (e) => {
                origInputs[index].value = e.target.value;
                origInputs[index].dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
              });
            });

            locationSearchResults.appendChild(liveClone);
          });
          localResultsRendered = true;
        }
      }

      if (window.searchLocationsEnabled) {
        const mapHeader = createSearchSectionHeader(
          "Map Locations",
          "travel_explore",
        );
        const mapLoading = document.createElement("div");
        mapLoading.className = "location-result-item";
        mapLoading.style.cssText =
          "color:#ffffff40; font-size:13px; font-style:italic; pointer-events:none; border-style:dashed;";
        mapLoading.innerHTML = `<i class="material-symbols-rounded">hourglass_empty</i><span>Querying Nominatim maps database...</span>`;

        locationSearchResults.appendChild(mapHeader);
        locationSearchResults.appendChild(mapLoading);

        locationSearchTimeout = setTimeout(async () => {
          const activeQuery = locationSearchInput.value.trim();
          if (!activeQuery) {
            if (mapLoading) mapLoading.remove();
            if (mapHeader) mapHeader.remove();
            return;
          }

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(activeQuery)}&format=json&limit=5&addressdetails=1`,
            );
            const data = await res.json();

            if (!locationSearchInput.value.trim()) {
              if (mapLoading) mapLoading.remove();
              if (mapHeader) mapHeader.remove();
              return;
            }

            if (mapLoading) mapLoading.remove();

            if (data && data.length > 0) {
              data.forEach((result) => {
                const lon = parseFloat(result.lon),
                  lat = parseFloat(result.lat);
                const nameParts = (result.display_name || "").split(", ");
                const name = nameParts[0],
                  detail = nameParts.slice(1).join(", ");
                const row = createSearchResultItem(
                  name,
                  detail,
                  "location_on",
                  () => {
                    if (locationSearchMarker) locationSearchMarker.remove();
                    locationSearchMarker = new maplibregl.Marker({
                      color: "#FFC300",
                      scale: 0.6,
                    })
                      .setLngLat([lon, lat])
                      .addTo(window.map);
                    const sBtn = document.getElementById("fab-search-btn");
                    if (sBtn) sBtn.classList.add("status-on");
                    window.map.flyTo({
                      center: [lon, lat],
                      zoom: getLocationZoom(result),
                      essential: true,
                    });
                    window.closeLocationSearch();
                  },
                );
                locationSearchResults.appendChild(row);
              });
            } else {
              const mapEmpty = document.createElement("div");
              mapEmpty.className = "location-result-item";
              mapEmpty.style.cssText =
                "color:#ffffff40; font-size:13px; font-style:italic; pointer-events:none;";
              mapEmpty.innerHTML = `<i class="material-symbols-rounded">search_off</i><span>No matching map locations found</span>`;
              locationSearchResults.appendChild(mapEmpty);
              if (!localResultsRendered) {
                if (mapHeader) mapHeader.remove();
                if (mapEmpty) mapEmpty.remove();
                setLocationSearchEmpty("search_off", "No results found");
              }
            }
          } catch (e) {
            if (mapLoading) mapLoading.remove();
            const mapError = document.createElement("div");
            mapError.className = "location-result-item";
            mapError.style.cssText =
              "color:#ff6b6b40; font-size:13px; font-style:italic; pointer-events:none;";
            mapError.innerHTML = `<i class="material-symbols-rounded">error</i><span>Maps database connection failed</span>`;
            locationSearchResults.appendChild(mapError);
          }
        }, 400);
      } else {
        if (!localResultsRendered) {
          setLocationSearchEmpty("search_off", "No results found");
        }
      }
    });

    locationSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        window.closeLocationSearch();
        e.stopPropagation();
      }
    });
  }

  window.saveSettingsEnabled = localStorage.getItem("saveSettings") === "true";
  if (window.saveSettingsEnabled) {
    window.debugModeEnabled = localStorage.getItem("debugMode") === "true";
    if (localStorage.getItem("radarVisible") === "false")
      radarToggle.checked = false;
    if (localStorage.getItem("sitesVisible") === "false")
      sitesToggle.checked = false;
    if (localStorage.getItem("alertsVisible") === "false")
      window.alertsEnabled = false;

    window.activeSpcDay = localStorage.getItem("activeSpcDay") || "none";
    window.activeSpcType = localStorage.getItem("activeSpcType") || "none";
    window.activeSiteIdForData = localStorage.getItem("activeSiteId") || null;
    window.activeRadarProductCode =
      localStorage.getItem("activeProduct") || null;
    window.radarSiteSelectionMode =
      localStorage.getItem("siteSelection") || "Both";
    window.showSitesMode = localStorage.getItem("showSites") || "Both";
    window.selectOfflineSites =
      localStorage.getItem("selectOfflineSites") === "true";
    window.showOfflineSites =
      localStorage.getItem("showOfflineSites") !== "false";
    window.flyToRadarSetting = localStorage.getItem("flyToRadar") === "true";

    if (localStorage.getItem("zoneAlertsVisible") === "false")
      window.zoneAlertsEnabled = false;
    if (localStorage.getItem("mesoDiscussionsVisible") === "false")
      window.mesoDiscussionsEnabled = false;
    if (localStorage.getItem("fasterUpdates") === "true")
      window.fasterUpdatesEnabled = true;

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
  let urlRadarRequest = null;

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
          radarToggle.checked = true;
          break;
        case "xrm":
          radarToggle.checked = false;
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
        default:
          if (flag.length === 5 && /^[rvl][a-z0-9]{4}$/i.test(flag)) {
            urlRadarRequest = {
              id: flag.substring(1).toUpperCase(),
              type: flag.charAt(0),
            };
          }
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

  if (window.saveSettingsEnabled) saveSettingsToggleUI.classList.add("active");
  else saveSettingsToggleUI.classList.remove("active");

  if (window.debugModeEnabled) debugSettingsToggleUI.classList.add("active");
  else debugSettingsToggleUI.classList.remove("active");

  if (window.selectOfflineSites) selectOfflineToggleUI.classList.add("active");
  else selectOfflineToggleUI.classList.remove("active");

  if (window.showOfflineSites) showOfflineToggleUI.classList.add("active");
  else showOfflineToggleUI.classList.remove("active");

  if (window.flyToRadarSetting) flySettingsToggleUI.classList.add("active");
  else flySettingsToggleUI.classList.remove("active");

  if (window.zoneAlertsEnabled) zoneAlertsToggleUI.classList.add("active");
  else zoneAlertsToggleUI.classList.remove("active");

  if (window.mesoDiscussionsEnabled)
    mesoDiscussionsToggleUI.classList.add("active");
  else mesoDiscussionsToggleUI.classList.remove("active");

  if (window.fasterUpdatesEnabled)
    fasterUpdatesToggleUI.classList.add("active");
  else fasterUpdatesToggleUI.classList.remove("active");

  if (window.myLocationEnabled) window.toggleMyLocation(true);

  const hiddenCountEl = document.getElementById("hidden-alert-types-count");
  if (hiddenCountEl && window.hiddenAlertTypes.size > 0) {
    hiddenCountEl.textContent = window.hiddenAlertTypes.size;
  }

  window.updateAlertSoundsCountLabel = function () {
    const countEl = document.getElementById("alert-sounds-count");
    const internalLabel = document.getElementById("alert-sounds-count-label");
    const activeCount = Object.values(window.alertSoundsMap).filter(
      (v) => v !== "none",
    ).length;
    if (countEl) countEl.textContent = activeCount > 0 ? activeCount : "";
    if (internalLabel) {
      internalLabel.textContent =
        activeCount === 0
          ? "No alerts with sounds"
          : `${activeCount} alert${activeCount >= 2 ? "s" : ""} with sounds`;
    }
  };
  window.updateAlertSoundsCountLabel();

  function updateSiteSelectionUI() {
    document.querySelectorAll(".site-select-option").forEach((opt) => {
      opt.classList.toggle(
        "selected",
        opt.dataset.value === window.radarSiteSelectionMode,
      );
    });
  }
  updateSiteSelectionUI();

  document.querySelectorAll(".site-select-option").forEach((option) => {
    option.addEventListener("click", () => {
      window.radarSiteSelectionMode = option.dataset.value;
      window.showToast(`Site Selection: ${window.radarSiteSelectionMode}`);
      updateSiteSelectionUI();
      window.saveCurrentState();
    });
  });

  if (window.updateShowSitesFilter) {
    window.updateShowSitesFilter();
  }

  document.querySelectorAll(".show-sites-option").forEach((option) => {
    option.addEventListener("click", () => {
      window.showSitesMode = option.dataset.value;
      window.showToast(`Show Sites: ${window.showSitesMode}`);
      if (window.updateShowSitesFilter) window.updateShowSitesFilter();
      window.saveCurrentState();
    });
  });

  window.saveCurrentState = function () {
    const radarToggle = document.getElementById("radar-toggle");
    const sitesToggle = document.getElementById("radar-sites-toggle");
    if (window.map && localStorage.getItem("saveSettings") === "true") {
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

  saveSettingsBtn.addEventListener("click", () => {
    if (saveSettingsToggleUI.classList.contains("active")) {
      saveSettingsToggleUI.classList.remove("active");
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
      location.reload();
    } else {
      saveSettingsToggleUI.classList.add("active");
      localStorage.setItem("saveSettings", "true");
      window.saveCurrentState();
      window.showToast("Settings Saved");
    }
  });

  if (resetAppBtn) {
    resetAppBtn.addEventListener("click", () => {
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
    });
  }

  debugSettingsBtn.addEventListener("click", () => {
    window.debugModeEnabled = !window.debugModeEnabled;
    debugSettingsToggleUI.classList.toggle("active");
    window.saveCurrentState();
    window.showToast(`Debug Mode: ${window.debugModeEnabled ? "On" : "Off"}`);
  });

  selectOfflineBtn.addEventListener("click", () => {
    window.selectOfflineSites = !window.selectOfflineSites;
    selectOfflineToggleUI.classList.toggle("active", window.selectOfflineSites);
    window.saveCurrentState();
    window.showToast(
      `Select Offline Sites: ${window.selectOfflineSites ? "On" : "Off"}`,
    );
  });

  showOfflineBtn.addEventListener("click", () => {
    window.showOfflineSites = !window.showOfflineSites;
    showOfflineToggleUI.classList.toggle("active", window.showOfflineSites);
    if (window.updateShowSitesFilter) window.updateShowSitesFilter();
    window.saveCurrentState();
    window.showToast(
      `Show Offline Sites: ${window.showOfflineSites ? "On" : "Off"}`,
    );
  });

  if (fabLocBtn) {
    fabLocBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.toggleMyLocation(!window.myLocationEnabled);
    });
  }

  const tzCustomInput = document.getElementById("tz-custom-input");
  const localBrowserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function updateTzSelector() {
    const isLocal = window.appTimeZone === localBrowserTz;
    const isUTC = window.appTimeZone === "UTC";
    document
      .querySelector('.tz-option[data-value="local"]')
      .classList.toggle("selected", isLocal);
    document
      .querySelector('.tz-option[data-value="UTC"]')
      .classList.toggle("selected", isUTC && !isLocal);
    if (tzCustomInput)
      tzCustomInput.classList.toggle("active", !isLocal && !isUTC);
  }

  function updateDstSelector() {
    const fixed = window.isFixedOffset(window.appTimeZone);
    if (fixed && window.appDstMode !== "auto") window.appDstMode = "auto";
    document.querySelectorAll(".dst-option").forEach((btn) => {
      const forcedOption = btn.dataset.value !== "auto";
      btn.classList.toggle("selected", btn.dataset.value === window.appDstMode);
      btn.disabled = fixed && forcedOption;
      btn.style.opacity = fixed && forcedOption ? "0.3" : "";
      btn.style.cursor = fixed && forcedOption ? "default" : "";
      btn.style.pointerEvents = fixed && forcedOption ? "none" : "";
    });
  }

  function updateHourSelector() {
    const utcZero = window.isUTCZero(window.appTimeZone);
    if (utcZero && window.appHourMode !== "auto") {
      window.appHourMode = "auto";
      window.saveCurrentState();
    }
    document.querySelectorAll(".hour-option").forEach((btn) => {
      const forcedOption = btn.dataset.value !== "auto";
      btn.classList.toggle(
        "selected",
        btn.dataset.value === window.appHourMode,
      );
      btn.disabled = utcZero && forcedOption;
      btn.style.opacity = utcZero && forcedOption ? "0.3" : "";
      btn.style.cursor = utcZero && forcedOption ? "default" : "";
      btn.style.pointerEvents = utcZero && forcedOption ? "none" : "";
    });
  }

  updateTzSelector();
  updateDstSelector();
  updateHourSelector();

  if (
    window.appTimeZone !== localBrowserTz &&
    window.appTimeZone !== "UTC" &&
    tzCustomInput
  ) {
    tzCustomInput.value = window.tzToDisplay(window.appTimeZone);
  }

  document.querySelectorAll(".tz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.value;
      window.appTimeZone = val === "local" ? localBrowserTz : val;
      if (val !== "custom" && tzCustomInput) tzCustomInput.value = "";
      updateTzSelector();
      updateDstSelector();
      updateHourSelector();
      window.saveCurrentState();
      window.showToast("Time Zone: " + btn.textContent.trim());
    });
  });

  if (tzCustomInput) {
    tzCustomInput.addEventListener("focus", () => {
      tzCustomInput.classList.remove("invalid");
    });
    tzCustomInput.addEventListener("input", () => {
      const resolved = window.resolveCustomInput(tzCustomInput.value);
      const hasVal = tzCustomInput.value.trim() !== "";
      tzCustomInput.classList.toggle("invalid", hasVal && !resolved);
    });
    tzCustomInput.addEventListener("change", () => {
      const resolved = window.resolveCustomInput(tzCustomInput.value);
      if (resolved) {
        window.appTimeZone = resolved;
        tzCustomInput.classList.remove("invalid");
        updateTzSelector();
        updateDstSelector();
        updateHourSelector();
        window.saveCurrentState();
        window.showToast("Time Zone: " + tzCustomInput.value.trim());
      }
    });
    tzCustomInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        tzCustomInput.blur();
        e.preventDefault();
      }
    });
  }

  document.querySelectorAll(".dst-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.appDstMode = btn.dataset.value;
      updateDstSelector();
      window.saveCurrentState();
      window.showToast("Time Mode: " + btn.textContent.trim());
    });
  });

  document.querySelectorAll(".hour-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      window.appHourMode = btn.dataset.value;
      updateHourSelector();
      window.saveCurrentState();
      window.showToast("Hour Format: " + btn.textContent.trim());
    });
  });

  flySettingsBtn.addEventListener("click", () => {
    window.flyToRadarSetting = !window.flyToRadarSetting;
    flySettingsToggleUI.classList.toggle("active");
    window.saveCurrentState();
  });

  (function () {
    const loopCustomInput = document.getElementById("loop-time-custom-input");
    function updateLoopTimeUI() {
      const mins = window.radarLoopMinutes;
      const isPreset = mins === 30 || mins === 60;
      document.querySelectorAll(".loop-time-option").forEach((btn) => {
        btn.classList.toggle(
          "selected",
          isPreset && parseInt(btn.dataset.value) === mins,
        );
      });
      if (loopCustomInput) {
        loopCustomInput.classList.toggle("active", !isPreset);
        loopCustomInput.value = !isPreset ? `${mins} min` : "";
      }
    }
    document.querySelectorAll(".loop-time-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.dataset.value);
        if (window.setRadarLoopMinutes) window.setRadarLoopMinutes(val);
        updateLoopTimeUI();
        window.showToast(`Loop Time: ${val} min`);
      });
    });
    if (loopCustomInput) {
      loopCustomInput.addEventListener("focus", () => {
        loopCustomInput.classList.remove("invalid");
        loopCustomInput.value = loopCustomInput.value
          .replace(/\s*min$/i, "")
          .trim();
      });
      loopCustomInput.addEventListener("input", () => {
        loopCustomInput.value = loopCustomInput.value.replace(/[^0-9]/g, "");
        const val = parseInt(loopCustomInput.value);
        const hasVal = loopCustomInput.value.trim() !== "";
        loopCustomInput.classList.toggle(
          "invalid",
          hasVal && (isNaN(val) || val < 5 || val > 120),
        );
      });
      loopCustomInput.addEventListener("change", () => {
        const raw = parseInt(loopCustomInput.value.replace(/[^0-9]/g, ""));
        if (!isNaN(raw) && raw >= 5 && raw <= 120) {
          const snapped = Math.round(raw / 5) * 5;
          loopCustomInput.classList.remove("invalid");
          document
            .querySelectorAll(".loop-time-option")
            .forEach((b) => b.classList.remove("selected"));
          loopCustomInput.classList.add("active");
          loopCustomInput.value = `${snapped} min`;
          if (window.setRadarLoopMinutes) window.setRadarLoopMinutes(snapped);
          window.showToast(`Loop Time: ${snapped} min`);
        } else {
          updateLoopTimeUI();
        }
      });
      loopCustomInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          loopCustomInput.blur();
          e.preventDefault();
        }
      });
    }
    updateLoopTimeUI();
  })();

  zoneAlertsBtn.addEventListener("click", () => {
    window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
    zoneAlertsToggleUI.classList.toggle("active");
    window.saveCurrentState();
    if (window.zoneAlertsEnabled) {
      window.showToast("Zone Alerts: On");
      if (window.map.getSource("alerts-poly-watch"))
        window.map
          .getSource("alerts-poly-watch")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalPolyWatchAlerts = [];
      if (window.alertsEnabled) window.refreshNwsAlerts(true);
    } else {
      window.showToast("Zone Alerts: Off");
      if (window.map.getSource("alerts-zone"))
        window.map
          .getSource("alerts-zone")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalZoneAlerts = [];
      if (window.alertsEnabled) {
        window.refreshNwsAlerts(true);
        window.updatePlacefileAlerts(true);
      }
    }
  });

  mesoDiscussionsBtn.addEventListener("click", () => {
    window.mesoDiscussionsEnabled = !window.mesoDiscussionsEnabled;
    mesoDiscussionsToggleUI.classList.toggle("active");
    window.saveCurrentState();
    if (window.mesoDiscussionsEnabled) {
      window.showToast("Mesoscale Discussions: On");
      if (window.alertsEnabled) window.updatePlacefileAlerts(true);
    } else {
      window.showToast("Mesoscale Discussions: Off");
      if (window.map.getSource("alerts-md"))
        window.map
          .getSource("alerts-md")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalMdAlerts = [];
      if (window.renderAlertsSidebar) window.renderAlertsSidebar();
    }
  });

  fasterUpdatesBtn.addEventListener("click", () => {
    window.fasterUpdatesEnabled = !window.fasterUpdatesEnabled;
    fasterUpdatesToggleUI.classList.toggle("active");
    window.saveCurrentState();
    window.startAlertIntervals();
    window.showToast(
      `Faster Updates: ${window.fasterUpdatesEnabled ? "On" : "Off"}`,
    );
  });

  const fabMenuBtn = document.getElementById("fab-menu-btn");
  const fabOutlooks = document.getElementById("fab-outlooks");
  const fabMosaic = document.getElementById("fab-mosaic");
  const fabAlerts = document.getElementById("fab-alerts");
  const fabSettings = document.getElementById("fab-settings");
  const settingsPopup = document.getElementById("settings-popup");
  const settingsCloseBtn = document.getElementById("settings-close-btn");
  const pillInfoBtn = document.getElementById("pill-info-btn");

  window.openSettings = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    window.closeAllMenus();
    settingsPopup.classList.add("open");
    settingsPopup.querySelector(".settings-body").scrollTop = 0;
    fabSettings.classList.add("active");
  };

  window.closeSettings = function () {
    settingsPopup.classList.remove("open");
    if (fabSettings) fabSettings.classList.remove("active");
  };

  if (settingsCloseBtn)
    settingsCloseBtn.addEventListener("click", window.closeSettings);
  document
    .getElementById("settings-open-alerts-btn")
    .addEventListener("click", () => {
      window.openAlertSettings();
    });
  document
    .getElementById("settings-open-radar-btn")
    .addEventListener("click", () => {
      window.openRadarSettingsFrom();
    });

  const alertSettingsPopup = document.getElementById("alert-settings-popup");
  const alertSettingsCloseBtn = document.getElementById(
    "alert-settings-close-btn",
  );

  window.openAlertSettings = function (isBack = false) {
    if (!isBack) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    window.closeAllMenus();
    if (alertSettingsPopup) {
      alertSettingsPopup.classList.add("open");
      alertSettingsPopup.querySelector(".settings-body").scrollTop = 0;
    }
  };

  window.closeAlertSettings = function () {
    if (alertSettingsPopup) alertSettingsPopup.classList.remove("open");
  };

  if (alertSettingsCloseBtn)
    alertSettingsCloseBtn.addEventListener("click", window.closeAlertSettings);
  document
    .getElementById("alert-settings-back-btn")
    .addEventListener("click", window.goBack);

  const hiddenAlertsPanel = document.getElementById("hidden-alerts-panel");
  const hiddenAlertsBackBtn = document.getElementById("hidden-alerts-back-btn");
  const hiddenAlertsCloseBtn = document.getElementById(
    "hidden-alerts-close-btn",
  );
  const hiddenAlertsSearch = document.getElementById("hidden-alerts-search");
  const hiddenAlertsListEl = document.getElementById("hidden-alerts-list");
  const hiddenAlertsCountLabel = document.getElementById(
    "hidden-alerts-count-label",
  );
  const hiddenAlertsResetBtn = document.getElementById(
    "hidden-alerts-reset-btn",
  );

  function updateHiddenAlertsCountLabel() {
    const n = window.hiddenAlertTypes.size;
    if (hiddenAlertsCountLabel) {
      hiddenAlertsCountLabel.textContent =
        n === 0 ? "No alerts hidden" : `${n} alert${n >= 2 ? "s" : ""} hidden`;
    }
  }

  function renderHiddenAlertsList(filter) {
    if (!hiddenAlertsListEl) return;
    const query = (filter || "").toLowerCase();
    const allTypes = Object.keys(window.alertColorMap);
    const sorted = allTypes.slice().sort((a, b) => {
      const aHidden = window.hiddenAlertTypes.has(a) ? 1 : 0;
      const bHidden = window.hiddenAlertTypes.has(b) ? 1 : 0;
      if (aHidden !== bHidden) return aHidden - bHidden;
      return (
        window.getAlertPriorityScore({
          properties: { event: a, parameters: {} },
        }) -
        window.getAlertPriorityScore({
          properties: { event: b, parameters: {} },
        })
      );
    });
    const visible = query
      ? sorted.filter((t) => t.toLowerCase().includes(query))
      : sorted;
    const existingRows = Array.from(
      hiddenAlertsListEl.querySelectorAll(".hidden-alert-row"),
    );
    const existingMap = new Map(
      existingRows.map((r) => [r.dataset.eventType, r]),
    );
    const newKeys = new Set(visible);

    existingRows.forEach((r) => {
      if (!newKeys.has(r.dataset.eventType)) r.remove();
    });
    visible.forEach((eventType, i) => {
      const isHidden = window.hiddenAlertTypes.has(eventType);
      const color = window.alertColorMap[eventType] || "#808080";
      if (existingMap.has(eventType)) {
        const row = existingMap.get(eventType);
        row.className = "hidden-alert-row" + (isHidden ? " is-hidden" : "");
        row.style.borderLeftColor = isHidden
          ? "var(--glass-border-color)"
          : `${color}80`;
        row.querySelector(".hidden-alert-eye").textContent = isHidden
          ? "visibility_off"
          : "visibility";
        const after = hiddenAlertsListEl.children[i];
        if (after !== row) hiddenAlertsListEl.insertBefore(row, after || null);
      } else {
        const row = document.createElement("div");
        row.className = "hidden-alert-row" + (isHidden ? " is-hidden" : "");
        row.dataset.eventType = eventType;
        row.style.borderLeftColor = isHidden
          ? "var(--glass-border-color)"
          : `${color}80`;
        row.innerHTML = `<span class="hidden-alert-label">${eventType}</span><i class="material-symbols-rounded hidden-alert-eye">${isHidden ? "visibility_off" : "visibility"}</i>`;
        row.addEventListener("click", () => {
          if (window.hiddenAlertTypes.has(eventType))
            window.hiddenAlertTypes.delete(eventType);
          else window.hiddenAlertTypes.add(eventType);
          window.applyMapAlertFilters();
          window.saveCurrentState();
          updateHiddenAlertsCountLabel();
          renderHiddenAlertsList(hiddenAlertsSearch.value);
        });
        const after = hiddenAlertsListEl.children[i];
        hiddenAlertsListEl.insertBefore(row, after || null);
      }
    });
    updateHiddenAlertsCountLabel();
  }

  window.openHiddenAlertsPanel = function (isBack = false) {
    if (!isBack) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    window.closeAllMenus();
    if (hiddenAlertsSearch) hiddenAlertsSearch.value = "";
    renderHiddenAlertsList("");
    if (hiddenAlertsPanel) {
      hiddenAlertsPanel.classList.add("open");
      const lst = document.getElementById("hidden-alerts-list");
      if (lst) lst.scrollTop = 0;
    }
  };

  window.closeHiddenAlertsPanel = function () {
    if (hiddenAlertsPanel) hiddenAlertsPanel.classList.remove("open");
  };

  if (hiddenAlertsBackBtn)
    hiddenAlertsBackBtn.addEventListener("click", window.goBack);
  if (hiddenAlertsCloseBtn)
    hiddenAlertsCloseBtn.addEventListener(
      "click",
      window.closeHiddenAlertsPanel,
    );
  if (hiddenAlertsSearch)
    hiddenAlertsSearch.addEventListener("input", () =>
      renderHiddenAlertsList(hiddenAlertsSearch.value),
    );
  if (hiddenAlertsResetBtn) {
    hiddenAlertsResetBtn.addEventListener("click", () => {
      window.hiddenAlertTypes.clear();
      window.applyMapAlertFilters();
      window.saveCurrentState();
      renderHiddenAlertsList(hiddenAlertsSearch.value);
      window.showToast("All alert types visible");
    });
  }
  const hiddenAlertsTrigger = document.getElementById("hidden-alert-types-btn");
  if (hiddenAlertsTrigger)
    hiddenAlertsTrigger.addEventListener("click", () =>
      window.openHiddenAlertsPanel(),
    );

  const alertSoundsPanel = document.getElementById("alert-sounds-panel");
  const alertSoundsBackBtn = document.getElementById("alert-sounds-back-btn");
  const alertSoundsCloseBtn = document.getElementById("alert-sounds-close-btn");
  const alertSoundsSearch = document.getElementById("alert-sounds-search");
  const alertSoundsListEl = document.getElementById("alert-sounds-list");
  const alertSoundsResetBtn = document.getElementById("alert-sounds-reset-btn");

  function renderAlertSoundsList(filter) {
    if (!alertSoundsListEl) return;
    const query = (filter || "").toLowerCase();
    const allTypes = Object.keys(window.alertColorMap);
    const sorted = allTypes.slice().sort((a, b) => {
      const aHasSound =
        window.alertSoundsMap[a] && window.alertSoundsMap[a] !== "none" ? 0 : 1;
      const bHasSound =
        window.alertSoundsMap[b] && window.alertSoundsMap[b] !== "none" ? 0 : 1;
      if (aHasSound !== bHasSound) return aHasSound - bHasSound;
      return (
        window.getAlertPriorityScore({
          properties: { event: a, parameters: {} },
        }) -
        window.getAlertPriorityScore({
          properties: { event: b, parameters: {} },
        })
      );
    });
    const visible = query
      ? sorted.filter((t) => t.toLowerCase().includes(query))
      : sorted;
    const existingRows = Array.from(
      alertSoundsListEl.querySelectorAll(".alert-sound-row"),
    );
    const existingMap = new Map(
      existingRows.map((r) => [r.dataset.eventType, r]),
    );
    const newKeys = new Set(visible);

    existingRows.forEach((r) => {
      if (!newKeys.has(r.dataset.eventType)) r.remove();
    });
    visible.forEach((eventType, i) => {
      const currentColor = window.alertColorMap[eventType] || "#808080";
      const currentValue = window.alertSoundsMap[eventType] || "none";
      if (existingMap.has(eventType)) {
        const row = existingMap.get(eventType);
        const select = row.querySelector("select");
        if (select.value !== currentValue) select.value = currentValue;
        const after = alertSoundsListEl.children[i];
        if (after !== row) alertSoundsListEl.insertBefore(row, after || null);
      } else {
        const row = document.createElement("div");
        row.className = "alert-sound-row";
        row.dataset.eventType = eventType;
        row.style.borderLeftColor = `${currentColor}80`;
        let optionsHtml = window.AUDIO_OPTIONS.map(
          (opt) =>
            `<option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>${opt.label}</option>`,
        ).join("");
        row.innerHTML = `<span class="alert-sound-label">${eventType}</span>
                                 <select class="alert-sound-select">${optionsHtml}</select>`;
        row.querySelector("select").addEventListener("change", (e) => {
          const val = e.target.value;
          if (val === "none") {
            delete window.alertSoundsMap[eventType];
          } else {
            window.alertSoundsMap[eventType] = val;
            window.playAlertSound(val, eventType);
          }
          window.saveCurrentState();
          window.updateAlertSoundsCountLabel();
          renderAlertSoundsList(alertSoundsSearch.value);
        });
        const after = alertSoundsListEl.children[i];
        alertSoundsListEl.insertBefore(row, after || null);
      }
    });
    window.updateAlertSoundsCountLabel();
  }

  window.openAlertSoundsPanel = function (isBack = false) {
    if (!isBack) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    window.closeAllMenus();
    if (alertSoundsSearch) alertSoundsSearch.value = "";
    renderAlertSoundsList("");
    if (alertSoundsPanel) {
      alertSoundsPanel.classList.add("open");
      const lst = document.getElementById("alert-sounds-list");
      if (lst) lst.scrollTop = 0;
    }
  };

  window.closeAlertSoundsPanel = function () {
    if (alertSoundsPanel) alertSoundsPanel.classList.remove("open");
  };

  if (alertSoundsBackBtn)
    alertSoundsBackBtn.addEventListener("click", window.goBack);
  if (alertSoundsCloseBtn)
    alertSoundsCloseBtn.addEventListener("click", window.closeAlertSoundsPanel);
  if (alertSoundsSearch)
    alertSoundsSearch.addEventListener("input", () =>
      renderAlertSoundsList(alertSoundsSearch.value),
    );
  if (alertSoundsResetBtn) {
    alertSoundsResetBtn.addEventListener("click", () => {
      window.alertSoundsMap = {};
      window.saveCurrentState();
      renderAlertSoundsList(alertSoundsSearch.value);
      window.showToast("Alert sounds reset to None");
    });
  }
  const alertSoundsTrigger = document.getElementById("alert-sounds-btn");
  if (alertSoundsTrigger)
    alertSoundsTrigger.addEventListener("click", () =>
      window.openAlertSoundsPanel(),
    );

  window.openLocationSearch = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    window.closeAllMenus();
    if (locationSearchPanel) {
      locationSearchPanel.classList.add("open");
      const sBtn = document.getElementById("fab-search-btn");
      if (sBtn) sBtn.classList.add("active");
      if (locationSearchResults) locationSearchResults.scrollTop = 0;
      if (locationSearchInput)
        setTimeout(() => locationSearchInput.focus(), 50);
    }
  };

  window.closeLocationSearch = function () {
    if (locationSearchPanel) locationSearchPanel.classList.remove("open");
    const sBtn = document.getElementById("fab-search-btn");
    if (sBtn) sBtn.classList.remove("active");
    clearTimeout(locationSearchTimeout);
    if (locationSearchInput) locationSearchInput.value = "";

    if (locationSearchResults) {
      Array.from(
        locationSearchResults.querySelectorAll(
          ".location-result-item, .search-section-header, .settings-row",
        ),
      ).forEach((el) => el.remove());
    }

    setLocationSearchEmpty("travel_explore", "Results show up here");
  };

  window.clearLocationMarker = function () {
    if (locationSearchMarker) {
      locationSearchMarker.remove();
      locationSearchMarker = null;
    }
    const sBtn = document.getElementById("fab-search-btn");
    if (sBtn) sBtn.classList.remove("status-on");
    window.showToast("Search Cleared");
  };

  const locCloseBtn = document.getElementById("location-search-close-btn");
  if (locCloseBtn)
    locCloseBtn.addEventListener("click", window.closeLocationSearch);

  const searchFab = document.getElementById("fab-search-btn");
  if (searchFab) {
    searchFab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (searchFab.classList.contains("status-on")) {
        window.clearLocationMarker();
        if (
          locationSearchPanel &&
          locationSearchPanel.classList.contains("open")
        ) {
          window.closeLocationSearch();
        }
      } else {
        if (locationSearchPanel) {
          locationSearchPanel.classList.contains("open")
            ? window.closeLocationSearch()
            : window.openLocationSearch();
        }
      }
    });
  }

  function setLocationSearchEmpty(icon, text) {
    if (locationSearchEmpty) {
      locationSearchEmpty.style.display = "flex";
      locationSearchEmpty.querySelector(
        ".material-symbols-rounded",
      ).textContent = icon;
      if (locationSearchEmptyText) locationSearchEmptyText.textContent = text;
    }
  }

  function getLocationZoom(result) {
    const rank = result.place_rank || 0;
    if (rank <= 4) return 3;
    if (rank <= 8) return 5;
    if (rank <= 12) return 9;
    if (rank <= 16) return 11;
    if (rank <= 22) return 13;
    return 16;
  }

  function renderLocationResults(results) {
    if (!locationSearchResults) return;
    Array.from(
      locationSearchResults.querySelectorAll(".location-result-item"),
    ).forEach((el) => el.remove());
    if (results.length === 0) {
      setLocationSearchEmpty("search_off", "No results found");
      return;
    }
    if (locationSearchEmpty) locationSearchEmpty.style.display = "none";

    results.forEach((result) => {
      const lon = parseFloat(result.lon),
        lat = parseFloat(result.lat);
      const nameParts = (result.display_name || "").split(", ");
      const name = nameParts[0],
        detail = nameParts.slice(1).join(", ");
      const item = document.createElement("div");
      item.className = "location-result-item";
      item.innerHTML = `<i class="material-symbols-rounded">location_on</i><div class="location-result-text"><div class="location-result-name">${name}</div>${detail ? `<div class="location-result-detail">${detail}</div>` : ""}</div>`;
      item.addEventListener("click", () => {
        if (locationSearchMarker) locationSearchMarker.remove();
        locationSearchMarker = new maplibregl.Marker({
          color: "#FFC300",
          scale: 0.6,
        })
          .setLngLat([lon, lat])
          .addTo(window.map);
        const sBtn = document.getElementById("fab-search-btn");
        if (sBtn) sBtn.classList.add("status-on");
        window.map.flyTo({
          center: [lon, lat],
          zoom: getLocationZoom(result),
          essential: true,
        });
        window.closeLocationSearch();
      });
      locationSearchResults.appendChild(item);
    });
  }

  if (fabMenuBtn)
    fabMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.toggleFabMenu();
    });

  window.openSpcOutlookPanel = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    window.closeAllMenus();
    const panel = document.getElementById("spc-outlook-panel");
    if (panel) {
      panel.classList.add("open");
      const body = document.getElementById("spc-outlook-body");
      if (body) body.scrollTop = 0;
      window.renderSpcOutlookPanel();
      document
        .querySelectorAll("#spc-outlook-body .sidebar-alert-group")
        .forEach((g) => g.classList.remove("open"));
      if (fabOutlooks) fabOutlooks.classList.add("active");
    }
  };

  window.closeSpcOutlookPanel = function () {
    const panel = document.getElementById("spc-outlook-panel");
    if (panel) panel.classList.remove("open");
    document
      .querySelectorAll("#spc-outlook-body .sidebar-alert-group")
      .forEach((g) => g.classList.remove("open"));
    if (fabOutlooks) fabOutlooks.classList.remove("active");
  };

  const spcCloseBtn = document.getElementById("spc-outlook-close-btn");
  if (spcCloseBtn)
    spcCloseBtn.addEventListener("click", window.closeSpcOutlookPanel);

  if (fabOutlooks)
    fabOutlooks.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = document.getElementById("spc-outlook-panel");
      if (panel)
        panel.classList.contains("open")
          ? window.closeSpcOutlookPanel()
          : window.openSpcOutlookPanel();
    });

  const radarPanel = document.getElementById("radar-panel");
  window.isAnyRadarOn = function () {
    const toggle = document.getElementById("radar-toggle");
    return (
      (toggle && toggle.checked) ||
      window.showSitesMode !== "None" ||
      !!(window.activeSiteIdForData && window.activeRadarProductCode)
    );
  };

  window.updateRadarPanelToggles = function () {
    const toggle = document.getElementById("radar-toggle");
    const panelToggle = document.getElementById("radar-panel-toggle");
    if (panelToggle && toggle)
      panelToggle.classList.toggle("active", toggle.checked);

    const settingsToggle = document.getElementById(
      "mosaic-toggle-settings-toggle-ui",
    );
    if (settingsToggle && toggle)
      settingsToggle.classList.toggle("active", toggle.checked);
  };

  window.renderRadarSiteList = function () {
    const listEl = document.getElementById("radar-panel-list"),
      emptyEl = document.getElementById("radar-panel-empty"),
      emptyTxt = document.getElementById("radar-panel-empty-text");
    if (!listEl) return;
    const query = (document.getElementById("radar-panel-search")?.value || "")
      .toLowerCase()
      .trim();
    Array.from(listEl.children).forEach((c) => {
      if (c.id !== "radar-panel-empty") c.remove();
    });

    if (!window.allRadarSitesData.length) {
      if (emptyTxt) emptyTxt.textContent = "Loading radar sites...";
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }
    const filtered = window.allRadarSitesData
      .filter((site) => {
        const props = site.properties;
        if (props.isOffline && !window.showOfflineSites) return false;
        const id = (props.id || "").toLowerCase(),
          name = (props.name || "").toLowerCase();
        return !query || id.includes(query) || name.includes(query);
      })
      .slice()
      .sort((a, b) => {
        const na = (a.properties.name || a.properties.id || "").toLowerCase(),
          nb = (b.properties.name || b.properties.id || "").toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });

    if (!filtered.length) {
      if (emptyTxt) emptyTxt.textContent = "No radars found";
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    filtered.forEach((site) => {
      const props = site.properties,
        id = props.id || "",
        name = props.name || id,
        type = props.stationType || "",
        offline = !!props.isOffline;
      const accentColor = offline
        ? "#ff4444"
        : type === "TDWR"
          ? "#ff9900"
          : "#0099ff";
      const item = document.createElement("div");
      item.className = "radar-site-item";
      item.style.borderLeftColor = accentColor + "99";
      item.innerHTML = `<div class="radar-site-item-content"><div class="radar-site-item-label">${id} – ${name}</div></div><i class="material-symbols-rounded radar-site-item-icon">chevron_right</i>`;

      item.addEventListener("click", () => {
        if (offline) return;
        window.closeRadarPanel();
        const siteId = id.toLowerCase();
        const prodCode = window.activeRadarProductCode
          ? window.activeRadarProductCode.includes("vel")
            ? type === "TDWR"
              ? "bvel"
              : "sr_bvel"
            : window.activeRadarProductCode === "brefl"
              ? type === "TDWR"
                ? "brefl"
                : "sr_bref"
              : type === "TDWR"
                ? "bref1"
                : "sr_bref"
          : type === "TDWR"
            ? "bref1"
            : "sr_bref";
        window.toggleRadarProduct(siteId, prodCode);
        window.map.flyTo({
          center: site.geometry.coordinates,
          zoom: 7,
          essential: true,
        });
        window.updateGreenStatusIndicators();
        if (window.saveCurrentState) window.saveCurrentState();
      });
      listEl.appendChild(item);
    });
  };

  window.openRadarPanel = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    window.closeAllMenus();
    window.updateRadarPanelToggles();
    window.renderRadarSiteList();
    if (radarPanel) radarPanel.classList.add("open");
    if (fabMosaic) fabMosaic.classList.add("active");
  };

  window.closeRadarPanel = function () {
    if (radarPanel) radarPanel.classList.remove("open");
    if (window.closeRadarSettings) window.closeRadarSettings();
    if (fabMosaic) fabMosaic.classList.remove("active");
  };

  const rPanelClose = document.getElementById("radar-panel-close-btn");
  if (rPanelClose)
    rPanelClose.addEventListener("click", window.closeRadarPanel);
  const rPanelSrch = document.getElementById("radar-panel-search");
  if (rPanelSrch)
    rPanelSrch.addEventListener("input", window.renderRadarSiteList);

  const rPanelTgl = document.getElementById("radar-panel-toggle");
  if (rPanelTgl) {
    rPanelTgl.addEventListener("click", () => {
      const toggle = document.getElementById("radar-toggle");
      if (toggle) {
        toggle.checked = !toggle.checked;
        window.updateMosaicVisibility();
        window.saveCurrentState();
        window.updateGreenStatusIndicators();
        window.updateRadarPanelToggles();
      }
    });
  }

  const radarSettingsPopup = document.getElementById("radar-settings-popup");
  window.openRadarSettingsFrom = function (opener, isBack = false) {
    if (!isBack) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    window.closeAllMenus();
    if (radarSettingsPopup) radarSettingsPopup.classList.add("open");
  };
  window.closeRadarSettings = function () {
    if (radarSettingsPopup) radarSettingsPopup.classList.remove("open");
  };

  const rPanelSett = document.getElementById("radar-panel-settings-btn");
  if (rPanelSett)
    rPanelSett.addEventListener("click", () =>
      window.openRadarSettingsFrom("radar"),
    );
  const rSettClose = document.getElementById("radar-settings-close-btn");
  if (rSettClose)
    rSettClose.addEventListener("click", window.closeRadarSettings);
  const rSettBack = document.getElementById("radar-settings-back-btn");
  if (rSettBack) rSettBack.addEventListener("click", window.goBack);

  if (fabMosaic)
    fabMosaic.addEventListener("click", (e) => {
      e.stopPropagation();
      if (radarPanel)
        radarPanel.classList.contains("open")
          ? window.closeRadarPanel()
          : window.openRadarPanel();
    });
  if (fabSettings)
    fabSettings.addEventListener("click", () => {
      if (settingsPopup)
        settingsPopup.classList.contains("open")
          ? window.closeSettings()
          : window.openSettings();
    });
  if (debugInput)
    debugInput.addEventListener("change", window.handleDebugUpload);

  if (pillInfoBtn) {
    pillInfoBtn.addEventListener("click", () => {
      if (!window.activeSiteIdForData || !window.activeRadarProductCode) return;
      const site = window.allRadarSitesData.find(
        (s) => s.properties.id.toLowerCase() === window.activeSiteIdForData,
      );
      if (!site) return;
      const type = site.properties.stationType;
      let next;
      if (type === "TDWR") {
        if (window.activeRadarProductCode === "bref1") next = "brefl";
        else if (window.activeRadarProductCode === "brefl") next = "bvel";
        else next = "bref1";
      } else {
        next =
          window.activeRadarProductCode === "sr_bref" ? "sr_bvel" : "sr_bref";
      }
      window.toggleRadarProduct(window.activeSiteIdForData, next);
    });
  }

  const fullAlertPopup = document.createElement("div");
  fullAlertPopup.id = "full-alert-text-popup";
  fullAlertPopup.className = "standard-glass";
  fullAlertPopup.innerHTML = `<div id="full-alert-text-popup-header"><div id="full-alert-text-popup-title"><i class="material-symbols-rounded">warning</i><span id="full-alert-text-popup-title-text"></span></div><div style="display:flex;gap:6px;align-items:center;"><button class="settings-close-btn" id="full-alert-text-popup-copy" aria-label="Copy"><i class="material-symbols-rounded">content_copy</i></button><button class="settings-close-btn" id="full-alert-text-popup-close" aria-label="Close"><i class="material-symbols-rounded">close</i></button></div></div><div id="full-alert-text-popup-body"><div id="full-alert-text-content"></div></div>`;
  document.body.appendChild(fullAlertPopup);

  document
    .getElementById("full-alert-text-popup-close")
    .addEventListener("click", () => {
      fullAlertPopup.classList.remove("open");
    });

  document
    .getElementById("full-alert-text-popup-copy")
    .addEventListener("click", () => {
      const titleContent = document.getElementById(
        "full-alert-text-popup-title-text",
      ).innerText;
      const bodyContent = document.getElementById(
        "full-alert-text-popup-body",
      ).innerText;
      const fullTextToCopy = `${titleContent}\n\n${bodyContent}`;

      navigator.clipboard
        .writeText(fullTextToCopy)
        .then(() => {
          window.showToast("Text copied to clipboard");
        })
        .catch(() => {
          window.showToast("Failed to copy text");
        });
    });

  window.closeFullAlertPopup = () => fullAlertPopup.classList.remove("open");

  const attributionBubble = document.getElementById("attribution-bubble");
  attributionBubble.addEventListener("click", (event) => {
    event.stopPropagation();
    attributionBubble.classList.toggle("expanded");
  });

  if (window.saveSettingsEnabled && urlParams.get("s"))
    window.saveCurrentState();
  setTimeout(window.updateGreenStatusIndicators, 500);
});

window.geocodeAndPlaceMarker = async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const loc = urlParams.get("l");
  if (!loc) return;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.replace(/-/g, " "))}&format=json&limit=1`,
    );
    const data = await res.json();
    if (data.length > 0) {
      const lon = parseFloat(data[0].lon),
        lat = parseFloat(data[0].lat);
      locationSearchMarker = new maplibregl.Marker({
        color: "#FFC300",
        scale: 0.6,
      })
        .setLngLat([lon, lat])
        .addTo(window.map);
      const sBtn = document.getElementById("fab-search-btn");
      if (sBtn) sBtn.classList.add("status-on");
      window.map.flyTo({ center: [lon, lat], zoom: 7, essential: true });
    }
  } catch (e) {}
};

window.closeAllPopups = function () {
  document.querySelectorAll(".maplibregl-popup").forEach((p) => p.remove());
  currentMapPopup = null;
  currentStackedAlertsOnMap = [];
  currentStackedAlertIndex = 0;
};

window.showAlertMapPopup = function (
  items,
  clicked,
  index = 0,
  direction = "next",
) {
  window.currentStackedAlertIndex = index;

  const renderContent = (idx) => {
    const targetItem = items[idx];
    const targetProps = targetItem.properties;
    const targetParams = targetProps.parameters || {};
    let targetTitle,
      targetMetaHtml = "",
      targetColor,
      targetIcon;

    if (targetItem.type === "alert") {
      targetTitle = targetProps.specificEventName || targetProps.event;
      targetColor = targetProps.displayColor || "#808080";
      targetIcon = "warning";

      let sentenceParts = [];
      let phenomenon = "";
      let adjectives = [];

      if (targetParams.tornadoDetection || targetParams.tornadoDamageThreat) {
        phenomenon = "tornado";
        if (targetParams.tornadoDetection)
          adjectives.push(targetParams.tornadoDetection[0].toLowerCase());
        if (targetParams.tornadoDamageThreat)
          adjectives.push(targetParams.tornadoDamageThreat[0].toLowerCase());
      } else if (
        targetParams.flashFloodDetection ||
        targetParams.flashFloodDamageThreat
      ) {
        phenomenon = "flash flooding";
        if (targetParams.flashFloodDetection)
          adjectives.push(targetParams.flashFloodDetection[0].toLowerCase());
        if (targetParams.flashFloodDamageThreat)
          adjectives.push(targetParams.flashFloodDamageThreat[0].toLowerCase());
      } else if (targetParams.waterspoutDetection) {
        phenomenon = "waterspout";
        if (targetParams.waterspoutDetection)
          adjectives.push(targetParams.waterspoutDetection[0].toLowerCase());
      } else if (targetParams.thunderstormDamageThreat) {
        phenomenon = "thunderstorm";
        if (targetParams.thunderstormDamageThreat)
          adjectives.push(
            targetParams.thunderstormDamageThreat[0].toLowerCase(),
          );
      }

      let corePhenomenon = "";
      if (phenomenon) {
        const cleanAdjs = adjectives
          .filter((a) => a && a !== "n/a" && a !== "none")
          .filter((v, i, a) => a.indexOf(v) === i);
        const mappedAdjs = cleanAdjs.map((a) => {
          if (a === "possible")
            return `${phenomenon.replace(" flooding", "")} possible`;
          if (a === "radar indicated" && phenomenon === "tornado")
            return "radar indicated rotation";
          if (a === "destructive" && phenomenon === "thunderstorm")
            return "destructive thunderstorm";
          return a;
        });

        if (mappedAdjs.length > 0) {
          if (
            mappedAdjs.some(
              (a) =>
                a.includes(phenomenon) ||
                a.includes("rotation") ||
                a.includes("thunderstorm"),
            )
          ) {
            corePhenomenon = mappedAdjs.join(", ");
          } else {
            corePhenomenon = `${mappedAdjs.join(", ")} ${phenomenon}`;
          }
        }
      }
      if (corePhenomenon) sentenceParts.push(corePhenomenon);
      if (targetParams.maxWindGust && targetParams.maxWindGust[0] !== "0 MPH") {
        sentenceParts.push(
          `${targetParams.maxWindGust[0].toLowerCase()} winds`,
        );
      }
      if (targetParams.maxHailSize && targetParams.maxHailSize[0] !== "0.00") {
        sentenceParts.push(
          `${targetParams.maxHailSize[0].toLowerCase()}" hail`,
        );
      }
      let mainSentence = "";
      if (sentenceParts.length > 1) {
        const last = sentenceParts.pop();
        mainSentence = sentenceParts.join(", ") + " and " + last;
      } else if (sentenceParts.length === 1) {
        mainSentence = sentenceParts[0];
      }
      if (mainSentence)
        mainSentence =
          mainSentence.charAt(0).toUpperCase() + mainSentence.slice(1);
      if (targetProps.expires) {
        const sentDate = window.parseApiDate(targetProps.sent);
        const expireDate = window.parseApiDate(targetProps.expires);
        const timeStr = window.formatDateWithTz(
          expireDate,
          window.getEffectiveTz(),
          window.getSmartDateOptions(expireDate, sentDate),
        );
        mainSentence = mainSentence
          ? `${mainSentence}; expires ${timeStr}`
          : `Expires ${timeStr}`;
      }
      targetMetaHtml = `${mainSentence}.`;
    } else {
      targetTitle = `Day ${window.activeSpcDay} Outlook`;
      targetColor = targetProps.fill || "#FFFFFF";
      targetIcon = "map";
      const rawLabel = (
        targetProps.LABEL ||
        targetProps.LABEL2 ||
        ""
      ).toUpperCase();
      const type = window.activeSpcType;
      let finalRiskPhrase = "";
      if (rawLabel.startsWith("CIG")) {
        const num = rawLabel.replace("CIG", "");
        const cigIntensityMap = {
          1: { torn: "strong", wind: "damaging", hail: "large" },
          2: { torn: "intense", wind: "destructive", hail: "very large" },
          3: { torn: "violent", wind: "extreme", hail: "giant" },
        };
        const intensity =
          cigIntensityMap[num]?.[type] || rawLabel.toLowerCase();
        const phenom =
          { torn: "tornado", wind: "wind", hail: "hail" }[type] || "";
        finalRiskPhrase = `${intensity} ${phenom}`;
      } else {
        const riskVal = window.formatSpcLabel(rawLabel);
        let riskTypeSuffix = "";
        if (type === "torn") riskTypeSuffix = " tornado";
        else if (type === "wind") riskTypeSuffix = " wind";
        else if (type === "hail") riskTypeSuffix = " hail";
        else if (type === "prob") riskTypeSuffix = " severe";
        finalRiskPhrase = `${riskVal.toLowerCase()}${riskTypeSuffix}`;
      }
      targetMetaHtml = `There is a ${finalRiskPhrase} risk for this location.`;
    }
    return {
      title: targetTitle,
      metaHtml: targetMetaHtml,
      color: targetColor,
      icon: targetIcon,
      item: targetItem,
    };
  };

  const getGradientBg = (idx, col) => {
    const segWidth = 100 / items.length;
    const start = idx * segWidth;
    const end = (idx + 1) * segWidth;
    const fade = Math.min(segWidth / 2, 8);
    let stops = [];
    if (items.length === 1) stops.push(`${col}33 0%, ${col}33 100%`);
    else {
      if (idx > 0) {
        stops.push(`transparent ${start - fade}%`);
        stops.push(`${col}33 ${start}%`);
      } else stops.push(`${col}33 0%`);
      stops.push(`${col}33 ${start}%`, `${col}33 ${end}%`);
      if (idx < items.length - 1) {
        stops.push(`${col}33 ${end}%`);
        stops.push(`transparent ${end + fade}%`);
      } else stops.push(`${col}33 100%`);
    }
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const bindButtons = (dom, item) => {
    const fullBtn = dom.querySelector("#full-text-button");
    if (fullBtn) {
      fullBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.type === "alert") {
          window.showFullAlertTextPopup(item.feature || item);
        } else {
          window.showFullSpcTextPopup(item);
        }
      };
    }
    const fitBtn = dom.querySelector("#fit-screen-button");
    if (fitBtn) {
      fitBtn.onclick = (e) => {
        e.stopPropagation();
        window.flyToAlert(item.type === "alert" ? item.feature : item);
      };
    }
    const sumBtn = dom.querySelector("#summarize-button");
    if (sumBtn) {
      sumBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.type === "alert") {
          window.createAndShowAlertPopup(item.feature, "manual");
        } else {
          const highest = window.getSpcSourceHighest(
            `spc-day${window.activeSpcDay}-${window.activeSpcType || "cat"}`,
          );
          window.createAndShowAlertPopup(
            {
              properties: {
                event: "SPC Outlook",
                specificEventName: `Day ${window.activeSpcDay} Outlook`,
                displayColor: highest ? highest.fill : "#FFFFFF",
                spcTopLabel: highest ? highest.label : "N/A",
                spcDay: window.activeSpcDay,
                spcType: window.activeSpcType,
              },
            },
            "manual",
          );
        }
      };
    }
    const prevBtn = dom.querySelector("#prev-alert-button");
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex - 1 + items.length) % items.length,
          "prev",
        );
      };
    }
    const nextBtn = dom.querySelector("#next-alert-button");
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex + 1) % items.length,
          "next",
        );
      };
    }
  };

  const cur = renderContent(index);
  const existingPopup = document.querySelector(".custom-map-popup-container");

  if (existingPopup && currentStackedAlertsOnMap === items) {
    const header = existingPopup.querySelector(".map-popup-header");
    const titleSpan = existingPopup.querySelector(".map-popup-title span");
    const titleIcon = existingPopup.querySelector(".map-popup-title i");
    const scroller = existingPopup.querySelector("#popup-text-scroller");
    const wrapper = existingPopup.querySelector("#popup-text-wrapper");
    const progressLayer = existingPopup.querySelector("#action-bar-progress");

    if (header && scroller && wrapper && progressLayer) {
      const curHeight = scroller.offsetHeight;
      wrapper.style.height = `${curHeight}px`;
      scroller.style.transition =
        "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease";
      scroller.style.transform =
        direction === "next" ? "translateX(-40px)" : "translateX(40px)";
      scroller.style.opacity = "0";

      setTimeout(() => {
        header.style.background = `${cur.color}1a`;
        if (titleSpan) titleSpan.textContent = cur.title;
        if (titleIcon) titleIcon.textContent = cur.icon;
        scroller.style.transition = "none";
        scroller.style.transform =
          direction === "next" ? "translateX(40px)" : "translateX(-40px)";
        scroller.innerHTML = cur.metaHtml;
        wrapper.style.transition = "height 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
        wrapper.style.height = `${scroller.offsetHeight}px`;
        progressLayer.style.background = getGradientBg(index, cur.color);
        setTimeout(() => {
          scroller.style.transition =
            "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease";
          scroller.style.transform = "translateX(0)";
          scroller.style.opacity = "1";
        }, 30);
        bindButtons(existingPopup, cur.item);
      }, 20);
      return;
    }
  }

  window.closeAllPopups();
  currentStackedAlertsOnMap = items;
  const div = document.createElement("div");
  div.className = "map-popup-base";
  div.style.width = "260px";
  div.style.boxSizing = "border-box";
  div.innerHTML = `
        <div class="map-popup-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--glass-border-color); background: ${cur.color}1a; transition: background 0.3s ease;">
            <div class="map-popup-title" style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%;">
                <i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">${cur.icon}</i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cur.title}</span>
            </div>
            <button class="map-popup-close-btn" aria-label="Close" style="width: 24px; height: 24px; border-radius: 50%; border: none; background: #ffffff14; color: #ffffffb2; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.18s; padding: 0;"><i class="material-symbols-rounded" style="font-size: 14px;">close</i></button>
        </div>
        <div class="map-popup-body" style="padding: 14px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box;">
            <div id="popup-text-wrapper" style="margin-bottom: 6px; position: relative; overflow: hidden; height: auto; user-select: none; -webkit-user-select: none; display: flex; align-items: center; justify-content: center; min-height: 48px;"><div id="popup-text-scroller" style="text-align: center; line-height: 1.4; transform: translateX(0); opacity: 1;">${cur.metaHtml}</div></div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin: 4px auto 0;">
                ${items.length > 1 ? `<button id="prev-alert-button" style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff14; border: 1px solid var(--glass-border-color); color: #ffffffb2; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_left</i></button>` : ""}
                <div style="position: relative; display: flex; align-items: center; gap: 6px; width: max-content; padding: 4px; border-radius: 22px; border: 1px solid var(--glass-border-color); box-sizing: border-box; overflow: hidden; height: 42px;">
                    <div id="action-bar-progress" style="position: absolute; top: -5px; left: -5px; right: -5px; bottom: -5px; background: ${getGradientBg(index, cur.color)}; z-index: 0; transition: background 0.4s cubic-bezier(0.25, 1, 0.5, 1); filter: blur(6px); opacity: 0.7; pointer-events: none;"></div>
                    <button id="full-text-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">description</i></button>
                    <button id="fit-screen-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">fit_screen</i></button>
                    <button id="summarize-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">summarize</i></button>
                </div>
                ${items.length > 1 ? `<button id="next-alert-button" style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff14; border: 1px solid var(--glass-border-color); color: #ffffffb2; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_right</i></button>` : ""}
            </div>
        </div>
    `;

  bindButtons(div, cur.item);

  if (items.length > 1) {
    let tX = 0,
      mX = 0,
      isM = false,
      lInt = 0;
    div.addEventListener(
      "touchstart",
      (e) => {
        tX = e.touches[0].clientX;
      },
      { passive: true },
    );
    div.addEventListener(
      "touchend",
      (e) => {
        const d = e.changedTouches[0].clientX - tX;
        if (Math.abs(d) > 35)
          window.showAlertMapPopup(
            items,
            clicked,
            (window.currentStackedAlertIndex +
              (d > 0 ? -1 : 1) +
              items.length) %
              items.length,
            d > 0 ? "prev" : "next",
          );
      },
      { passive: true },
    );
    div.addEventListener("mousedown", (e) => {
      mX = e.clientX;
      isM = true;
    });
    div.addEventListener("mouseup", (e) => {
      if (!isM) return;
      isM = false;
      const d = e.clientX - mX;
      if (Math.abs(d) > 35)
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex + (d > 0 ? -1 : 1) + items.length) %
            items.length,
          d > 0 ? "prev" : "next",
        );
    });
    div.addEventListener(
      "wheel",
      (e) => {
        const n = Date.now();
        if (n - lInt < 120) return;
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(d) > 5) {
          lInt = n;
          window.showAlertMapPopup(
            items,
            clicked,
            (window.currentStackedAlertIndex +
              (d > 0 ? 1 : -1) +
              items.length) %
              items.length,
            d > 0 ? "next" : "prev",
          );
        }
      },
      { passive: true },
    );
  }

  const setH = (btn) => {
    if (btn) {
      btn.onmouseenter = () => (btn.style.background = "#ffffff1f");
      btn.onmouseleave = () => (btn.style.background = "transparent");
    }
  };
  [
    div.querySelector("#full-text-button"),
    div.querySelector("#fit-screen-button"),
    div.querySelector("#summarize-button"),
  ].forEach(setH);
  const closeBtn = div.querySelector(".map-popup-close-btn");
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    window.closeAllPopups();
  };
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#ffffff29";
    closeBtn.style.color = "white";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#ffffff14";
    closeBtn.style.color = "#ffffffb2";
  };
  currentMapPopup = new maplibregl.Popup({
    closeOnClick: true,
    closeButton: false,
    offset: 10,
    className: "custom-map-popup-container",
  })
    .setLngLat(clicked)
    .setDOMContent(div)
    .addTo(window.map);
};
window.showAlertMapPopup = function (
  items,
  clicked,
  index = 0,
  direction = "next",
) {
  window.currentStackedAlertIndex = index;

  const renderContent = (idx) => {
    const targetItem = items[idx];
    const targetProps = targetItem.properties;
    const targetParams = targetProps.parameters || {};
    let targetTitle,
      targetMetaHtml = "",
      targetColor,
      targetIcon;

    if (targetItem.type === "alert") {
      targetTitle = targetProps.specificEventName || targetProps.event;
      targetColor = targetProps.displayColor || "#808080";
      targetIcon = "warning";

      let sentenceParts = [];
      let phenomenon = "";
      let adjectives = [];

      if (targetParams.tornadoDetection || targetParams.tornadoDamageThreat) {
        phenomenon = "tornado";
        if (targetParams.tornadoDetection)
          adjectives.push(targetParams.tornadoDetection[0].toLowerCase());
        if (targetParams.tornadoDamageThreat)
          adjectives.push(targetParams.tornadoDamageThreat[0].toLowerCase());
      } else if (
        targetParams.flashFloodDetection ||
        targetParams.flashFloodDamageThreat
      ) {
        phenomenon = "flash flooding";
        if (targetParams.flashFloodDetection)
          adjectives.push(targetParams.flashFloodDetection[0].toLowerCase());
        if (targetParams.flashFloodDamageThreat)
          adjectives.push(targetParams.flashFloodDamageThreat[0].toLowerCase());
      } else if (targetParams.waterspoutDetection) {
        phenomenon = "waterspout";
        if (targetParams.waterspoutDetection)
          adjectives.push(targetParams.waterspoutDetection[0].toLowerCase());
      } else if (targetParams.thunderstormDamageThreat) {
        phenomenon = "thunderstorm";
        if (targetParams.thunderstormDamageThreat)
          adjectives.push(
            targetParams.thunderstormDamageThreat[0].toLowerCase(),
          );
      }

      let corePhenomenon = "";
      if (phenomenon) {
        const cleanAdjs = adjectives
          .filter((a) => a && a !== "n/a" && a !== "none")
          .filter((v, i, a) => a.indexOf(v) === i);
        const mappedAdjs = cleanAdjs.map((a) => {
          if (a === "possible")
            return `${phenomenon.replace(" flooding", "")} possible`;
          if (a === "radar indicated" && phenomenon === "tornado")
            return "radar indicated rotation";
          if (a === "destructive" && phenomenon === "thunderstorm")
            return "destructive thunderstorm";
          return a;
        });

        if (mappedAdjs.length > 0) {
          if (
            mappedAdjs.some(
              (a) =>
                a.includes(phenomenon) ||
                a.includes("rotation") ||
                a.includes("thunderstorm"),
            )
          ) {
            corePhenomenon = mappedAdjs.join(", ");
          } else {
            corePhenomenon = `${mappedAdjs.join(", ")} ${phenomenon}`;
          }
        }
      }
      if (corePhenomenon) sentenceParts.push(corePhenomenon);
      if (targetParams.maxWindGust && targetParams.maxWindGust[0] !== "0 MPH") {
        sentenceParts.push(
          `${targetParams.maxWindGust[0].toLowerCase()} winds`,
        );
      }
      if (targetParams.maxHailSize && targetParams.maxHailSize[0] !== "0.00") {
        sentenceParts.push(
          `${targetParams.maxHailSize[0].toLowerCase()}" hail`,
        );
      }
      let mainSentence = "";
      if (sentenceParts.length > 1) {
        const last = sentenceParts.pop();
        mainSentence = sentenceParts.join(", ") + " and " + last;
      } else if (sentenceParts.length === 1) {
        mainSentence = sentenceParts[0];
      }
      if (mainSentence)
        mainSentence =
          mainSentence.charAt(0).toUpperCase() + mainSentence.slice(1);
      if (targetProps.expires) {
        const sentDate = window.parseApiDate(targetProps.sent);
        const expireDate = window.parseApiDate(targetProps.expires);
        const timeStr = window.formatDateWithTz(
          expireDate,
          window.getEffectiveTz(),
          window.getSmartDateOptions(expireDate, sentDate),
        );
        mainSentence = mainSentence
          ? `${mainSentence}; expires ${timeStr}`
          : `Expires ${timeStr}`;
      }
      targetMetaHtml = `${mainSentence}.`;
    } else {
      targetTitle = `Day ${window.activeSpcDay} Outlook`;
      targetColor = targetProps.fill || "#FFFFFF";
      targetIcon = "map";
      const rawLabel = (
        targetProps.LABEL ||
        targetProps.LABEL2 ||
        ""
      ).toUpperCase();
      const type = window.activeSpcType;
      let finalRiskPhrase = "";
      if (rawLabel.startsWith("CIG")) {
        const num = rawLabel.replace("CIG", "");
        const cigIntensityMap = {
          1: { torn: "strong", wind: "damaging", hail: "large" },
          2: { torn: "intense", wind: "destructive", hail: "very large" },
          3: { torn: "violent", wind: "extreme", hail: "giant" },
        };
        const intensity =
          cigIntensityMap[num]?.[type] || rawLabel.toLowerCase();
        const phenom =
          { torn: "tornado", wind: "wind", hail: "hail" }[type] || "";
        finalRiskPhrase = `${intensity} ${phenom}`;
      } else {
        const riskVal = window.formatSpcLabel(rawLabel);
        let riskTypeSuffix = "";
        if (type === "torn") riskTypeSuffix = " tornado";
        else if (type === "wind") riskTypeSuffix = " wind";
        else if (type === "hail") riskTypeSuffix = " hail";
        else if (type === "prob") riskTypeSuffix = " severe";
        finalRiskPhrase = `${riskVal.toLowerCase()}${riskTypeSuffix}`;
      }
      targetMetaHtml = `There is a ${finalRiskPhrase} risk for this location.`;
    }
    return {
      title: targetTitle,
      metaHtml: targetMetaHtml,
      color: targetColor,
      icon: targetIcon,
      item: targetItem,
    };
  };

  const getGradientBg = (idx, col) => {
    const segWidth = 100 / items.length;
    const start = idx * segWidth;
    const end = (idx + 1) * segWidth;
    const fade = Math.min(segWidth / 2, 8);
    let stops = [];
    if (items.length === 1) stops.push(`${col}33 0%, ${col}33 100%`);
    else {
      if (idx > 0) {
        stops.push(`transparent ${start - fade}%`);
        stops.push(`${col}33 ${start}%`);
      } else stops.push(`${col}33 0%`);
      stops.push(`${col}33 ${start}%`, `${col}33 ${end}%`);
      if (idx < items.length - 1) {
        stops.push(`${col}33 ${end}%`);
        stops.push(`transparent ${end + fade}%`);
      } else stops.push(`${col}33 100%`);
    }
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const bindButtons = (dom, item) => {
    const fullBtn = dom.querySelector("#full-text-button");
    if (fullBtn) {
      fullBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.type === "alert") {
          window.showFullAlertTextPopup(item.feature || item);
        } else {
          window.showFullSpcTextPopup(item);
        }
      };
    }
    const fitBtn = dom.querySelector("#fit-screen-button");
    if (fitBtn) {
      fitBtn.onclick = (e) => {
        e.stopPropagation();
        window.flyToAlert(item.type === "alert" ? item.feature : item);
      };
    }
    const sumBtn = dom.querySelector("#summarize-button");
    if (sumBtn) {
      sumBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.type === "alert") {
          window.createAndShowAlertPopup(item.feature, "manual");
        } else {
          const highest = window.getSpcSourceHighest(
            `spc-day${window.activeSpcDay}-${window.activeSpcType || "cat"}`,
          );
          window.createAndShowAlertPopup(
            {
              properties: {
                event: "SPC Outlook",
                specificEventName: `Day ${window.activeSpcDay} Outlook`,
                displayColor: highest ? highest.fill : "#FFFFFF",
                spcTopLabel: highest ? highest.label : "N/A",
                spcDay: window.activeSpcDay,
                spcType: window.activeSpcType,
              },
            },
            "manual",
          );
        }
      };
    }
    const prevBtn = dom.querySelector("#prev-alert-button");
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex - 1 + items.length) % items.length,
          "prev",
        );
      };
    }
    const nextBtn = dom.querySelector("#next-alert-button");
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex + 1) % items.length,
          "next",
        );
      };
    }
  };

  const cur = renderContent(index);
  const existingPopup = document.querySelector(".custom-map-popup-container");

  if (existingPopup && currentStackedAlertsOnMap === items) {
    const header = existingPopup.querySelector(".map-popup-header");
    const titleSpan = existingPopup.querySelector(".map-popup-title span");
    const titleIcon = existingPopup.querySelector(".map-popup-title i");
    const scroller = existingPopup.querySelector("#popup-text-scroller");
    const wrapper = existingPopup.querySelector("#popup-text-wrapper");
    const progressLayer = existingPopup.querySelector("#action-bar-progress");

    if (header && scroller && wrapper && progressLayer) {
      const curHeight = scroller.offsetHeight;
      wrapper.style.height = `${curHeight}px`;
      scroller.style.transition =
        "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease";
      scroller.style.transform =
        direction === "next" ? "translateX(-40px)" : "translateX(40px)";
      scroller.style.opacity = "0";

      setTimeout(() => {
        header.style.background = `${cur.color}1a`;
        if (titleSpan) titleSpan.textContent = cur.title;
        if (titleIcon) titleIcon.textContent = cur.icon;
        scroller.style.transition = "none";
        scroller.style.transform =
          direction === "next" ? "translateX(40px)" : "translateX(-40px)";
        scroller.innerHTML = cur.metaHtml;
        wrapper.style.transition = "height 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
        wrapper.style.height = `${scroller.offsetHeight}px`;
        progressLayer.style.background = getGradientBg(index, cur.color);
        setTimeout(() => {
          scroller.style.transition =
            "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease";
          scroller.style.transform = "translateX(0)";
          scroller.style.opacity = "1";
        }, 30);
        bindButtons(existingPopup, cur.item);
      }, 20);
      return;
    }
  }

  window.closeAllPopups();
  currentStackedAlertsOnMap = items;
  const div = document.createElement("div");
  div.className = "map-popup-base";
  div.style.width = "260px";
  div.style.boxSizing = "border-box";
  div.innerHTML = `
        <div class="map-popup-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--glass-border-color); background: ${cur.color}1a; transition: background 0.3s ease;">
            <div class="map-popup-title" style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%;">
                <i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">${cur.icon}</i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cur.title}</span>
            </div>
            <button class="map-popup-close-btn" aria-label="Close" style="width: 24px; height: 24px; border-radius: 50%; border: none; background: #ffffff14; color: #ffffffb2; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.18s; padding: 0;"><i class="material-symbols-rounded" style="font-size: 14px;">close</i></button>
        </div>
        <div class="map-popup-body" style="padding: 14px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box;">
            <div id="popup-text-wrapper" style="margin-bottom: 6px; position: relative; overflow: hidden; height: auto; user-select: none; -webkit-user-select: none; display: flex; align-items: center; justify-content: center; min-height: 48px;"><div id="popup-text-scroller" style="text-align: center; line-height: 1.4; transform: translateX(0); opacity: 1;">${cur.metaHtml}</div></div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin: 4px auto 0;">
                ${items.length > 1 ? `<button id="prev-alert-button" style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff14; border: 1px solid var(--glass-border-color); color: #ffffffb2; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_left</i></button>` : ""}
                <div style="position: relative; display: flex; align-items: center; gap: 6px; width: max-content; padding: 4px; border-radius: 22px; border: 1px solid var(--glass-border-color); box-sizing: border-box; overflow: hidden; height: 42px;">
                    <div id="action-bar-progress" style="position: absolute; top: -5px; left: -5px; right: -5px; bottom: -5px; background: ${getGradientBg(index, cur.color)}; z-index: 0; transition: background 0.4s cubic-bezier(0.25, 1, 0.5, 1); filter: blur(6px); opacity: 0.7; pointer-events: none;"></div>
                    <button id="full-text-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">description</i></button>
                    <button id="fit-screen-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">fit_screen</i></button>
                    <button id="summarize-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 50%; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">summarize</i></button>
                </div>
                ${items.length > 1 ? `<button id="next-alert-button" style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff14; border: 1px solid var(--glass-border-color); color: #ffffffb2; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_right</i></button>` : ""}
            </div>
        </div>
    `;

  bindButtons(div, cur.item);

  if (items.length > 1) {
    let tX = 0,
      mX = 0,
      isM = false,
      lInt = 0;
    div.addEventListener(
      "touchstart",
      (e) => {
        tX = e.touches[0].clientX;
      },
      { passive: true },
    );
    div.addEventListener(
      "touchend",
      (e) => {
        const d = e.changedTouches[0].clientX - tX;
        if (Math.abs(d) > 35)
          window.showAlertMapPopup(
            items,
            clicked,
            (window.currentStackedAlertIndex +
              (d > 0 ? -1 : 1) +
              items.length) %
              items.length,
            d > 0 ? "prev" : "next",
          );
      },
      { passive: true },
    );
    div.addEventListener("mousedown", (e) => {
      mX = e.clientX;
      isM = true;
    });
    div.addEventListener("mouseup", (e) => {
      if (!isM) return;
      isM = false;
      const d = e.clientX - mX;
      if (Math.abs(d) > 35)
        window.showAlertMapPopup(
          items,
          clicked,
          (window.currentStackedAlertIndex + (d > 0 ? -1 : 1) + items.length) %
            items.length,
          d > 0 ? "prev" : "next",
        );
    });
    div.addEventListener(
      "wheel",
      (e) => {
        const n = Date.now();
        if (n - lInt < 120) return;
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(d) > 5) {
          lInt = n;
          window.showAlertMapPopup(
            items,
            clicked,
            (window.currentStackedAlertIndex +
              (d > 0 ? 1 : -1) +
              items.length) %
              items.length,
            d > 0 ? "next" : "prev",
          );
        }
      },
      { passive: true },
    );
  }

  const setH = (btn) => {
    if (btn) {
      btn.onmouseenter = () => (btn.style.background = "#ffffff1f");
      btn.onmouseleave = () => (btn.style.background = "transparent");
    }
  };
  [
    div.querySelector("#full-text-button"),
    div.querySelector("#fit-screen-button"),
    div.querySelector("#summarize-button"),
  ].forEach(setH);
  const closeBtn = div.querySelector(".map-popup-close-btn");
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    window.closeAllPopups();
  };
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#ffffff29";
    closeBtn.style.color = "white";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#ffffff14";
    closeBtn.style.color = "#ffffffb2";
  };
  currentMapPopup = new maplibregl.Popup({
    closeOnClick: true,
    closeButton: false,
    offset: 10,
    className: "custom-map-popup-container",
  })
    .setLngLat(clicked)
    .setDOMContent(div)
    .addTo(window.map);
};

window.showFullAlertTextPopup = async function (f) {
  const props = f.properties;
  const params = props.parameters || {};
  const popup = document.getElementById("full-alert-text-popup");
  const titleEl = document.getElementById("full-alert-text-popup-title-text");
  const contentEl = document.getElementById("full-alert-text-content");
  const headerEl = document.getElementById("full-alert-text-popup-header");

  window.closeAllMenus();
  const sentD = window.parseApiDate(props.sent);
  const onsetD = props.onset ? window.parseApiDate(props.onset) : null;
  const expireD = window.parseApiDate(props.expires);

  const sentStr = props.sent
    ? `<div class="full-alert-meta-row"><strong>Sent:</strong> ${window.formatDateFull(sentD, window.getEffectiveTz())}</div>`
    : "";
  const onsetStr =
    onsetD && !isNaN(onsetD.getTime())
      ? `<div class="full-alert-meta-row"><strong>Onset:</strong> ${window.formatDateFull(onsetD, window.getEffectiveTz())}</div>`
      : "";
  const expiresStr = props.expires
    ? `<div class="full-alert-meta-row"><strong>Expires:</strong> ${window.formatDateFull(expireD, window.getEffectiveTz())}</div>`
    : "";
  const areaStr = props.areaDesc
    ? `<div class="full-alert-meta-row"><strong>Affected:</strong> ${props.areaDesc}</div>`
    : "";

  const metaHTML = `${sentStr}${onsetStr}${expiresStr}${areaStr}<div class="full-alert-section-label" style="padding-top:10px;">Description</div>`;

  const color = props.displayColor || "#808080";
  const iconName =
    props.id && (props.id.startsWith("md") || props.id.startsWith("ww"))
      ? "map"
      : "warning";
  if (headerEl) {
    headerEl.style.background = `${color}1a`;
    const iconEl = headerEl.querySelector(".material-symbols-rounded");
    if (iconEl) iconEl.textContent = iconName;
  }

  if (
    props.url &&
    typeof props.url === "string" &&
    props.id &&
    (props.id.startsWith("md") || props.id.startsWith("ww"))
  ) {
    let validatedUrl = null;
    try {
      validatedUrl = new URL(props.url).href;
    } catch (e) {}
    if (titleEl) titleEl.textContent = props.specificEventName;
    if (contentEl) contentEl.innerHTML = `${metaHTML}<p>Loading...</p>`;
    if (popup) popup.classList.add("open");
    const body = document.getElementById("full-alert-text-popup-body");
    if (body) body.scrollTop = 0;
    if (!validatedUrl) {
      if (contentEl)
        contentEl.innerHTML = `${metaHTML}<p>Could not load text.</p>`;
      return;
    }
    try {
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(validatedUrl)}`,
      );
      const text = await res.text();
      const pre = new DOMParser()
        .parseFromString(text, "text/html")
        .querySelector("pre");
      if (contentEl)
        contentEl.innerHTML = `${metaHTML}<p>${window.formatNwsText(pre ? pre.textContent : "Not found.")}</p>`;
    } catch (e) {
      if (contentEl)
        contentEl.innerHTML = `${metaHTML}<p>Failed to load text.</p><p><a href="${validatedUrl}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
    }
    return;
  }
  const formattedD = window.formatNwsText(props.description);
  const formattedI = window.formatNwsText(props.instruction);
  const isConvectiveWatch =
    props.event === "Tornado Watch" ||
    props.event === "Severe Thunderstorm Watch";

  let watchNumber = null;
  if (isConvectiveWatch && params.VTEC && params.VTEC[0]) {
    const vtecParts = params.VTEC[0].split(".");
    if (vtecParts.length >= 6) watchNumber = vtecParts[5];
  }

  if (titleEl) titleEl.textContent = props.specificEventName || props.event;
  if (contentEl)
    contentEl.innerHTML = `${metaHTML}<div id="alert-description-container"><p>${watchNumber ? "Loading..." : formattedD}</p></div>${props.instruction ? `<div class="full-alert-section-label">Instructions</div><p>${formattedI}</p>` : ""}`;
  if (popup) popup.classList.add("open");
  const body = document.getElementById("full-alert-text-popup-body");
  if (body) body.scrollTop = 0;

  if (watchNumber) {
    try {
      const url = `https://www.spc.noaa.gov/products/watch/ww${watchNumber}.html`;
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      );
      const text = await res.text();
      const pre = new DOMParser()
        .parseFromString(text, "text/html")
        .querySelector("pre");
      const spcText = pre ? pre.textContent : null;
      const descContainer = document.getElementById(
        "alert-description-container",
      );
      if (spcText && descContainer)
        descContainer.innerHTML = `<p>${window.formatNwsText(spcText)}</p>`;
      else if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
    } catch (e) {
      const descContainer = document.getElementById(
        "alert-description-container",
      );
      if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
    }
  }
};

window.showFullSpcTextPopup = async function (item) {
  const popup = document.getElementById("full-alert-text-popup");
  const titleEl = document.getElementById("full-alert-text-popup-title-text");
  const contentEl = document.getElementById("full-alert-text-content");
  const headerEl = document.getElementById("full-alert-text-popup-header");

  window.closeAllMenus();
  const spcDay = parseInt(window.activeSpcDay);

  if (titleEl)
    titleEl.textContent =
      spcDay >= 4
        ? "SPC Day 4-8 Discussion"
        : `SPC Day ${window.activeSpcDay} Discussion`;
  if (contentEl)
    contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Loading...</p>`;

  const activeDayInt = parseInt(window.activeSpcDay);
  const maxType = activeDayInt >= 4 ? "prob" : "cat";
  const highestCategorical = window.getSpcSourceHighest(
    `spc-day${window.activeSpcDay}-${maxType}`,
  );
  const color = highestCategorical ? highestCategorical.fill : "#FFFFFF";

  if (headerEl) {
    headerEl.style.background = `${color}1a`;
    const iconEl = headerEl.querySelector(".material-symbols-rounded");
    if (iconEl) iconEl.textContent = "map";
  }

  if (popup) popup.classList.add("open");
  const body = document.getElementById("full-alert-text-popup-body");
  if (body) body.scrollTop = 0;

  const text = await window.fetchSpcOutlookText(window.activeSpcDay);
  if (text === "Failed to load.") {
    const url =
      parseInt(window.activeSpcDay) >= 4
        ? "https://www.spc.noaa.gov/products/exper/day4-8/index.html"
        : `https://www.spc.noaa.gov/products/outlook/day${window.activeSpcDay}otlk.html`;
    if (contentEl)
      contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Failed to load text.</p><p><a href="${url}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
  } else if (contentEl) {
    contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>${window.formatNwsText(text)}</p>`;
  }
};

window.handleDebugUpload = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.features) throw new Error();
      window.knownAlertIds.clear();
      window.newAlertIds.clear();
      window.updatedAlertIds.clear();
      window.isInitialLoad = false;
      await window.processRawAlertFeatures(data.features, "polygon", false);
      await window.processRawAlertFeatures(data.features, "zone", false);
      window.displayNextAlert();
    } catch (err) {
      alert("Error parsing GeoJSON.");
    }
  };
  reader.readAsText(file);
};

window.map.on("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let willFlyToRadar = false;
  await window.PersistentCache.init();

  let symbolId;
  for (const l of window.map.getStyle().layers) {
    if (l.type === "symbol") {
      symbolId = l.id;
      break;
    }
  }

  window.spcSources.forEach((s) => {
    if (!window.map.getSource(s.id))
      window.map.addSource(s.id, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
  });

  if (!window.map.getSource("weather-radar")) {
    const ts = Math.floor(Date.now() / 60000) * 60000;
    window.map.addSource("weather-radar", {
      type: "raster",
      tiles: [
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${ts}`,
      ],
      tileSize: 256,
      scheme: "xyz",
    });
  }

  if (!window.map.getSource("alerts-poly"))
    window.map.addSource("alerts-poly", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  if (!window.map.getSource("alerts-zone"))
    window.map.addSource("alerts-zone", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  if (!window.map.getSource("alerts-md"))
    window.map.addSource("alerts-md", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  if (!window.map.getSource("alerts-poly-watch"))
    window.map.addSource("alerts-poly-watch", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  if (!window.map.getSource("highlight-source"))
    window.map.addSource("highlight-source", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

  if (window.allRadarSitesData.length === 0) {
    try {
      const res = await fetch(
        "https://api.weather.gov/radar/stations?stationType=WSR-88D,TDWR",
      );
      const data = await res.json();
      window.allRadarSitesData = data.features.map((f) => ({
        ...f,
        properties: { ...f.properties, isOffline: false, statusError: false },
      }));
    } catch (e) {
      console.error("Critical: Station directory fetch failed.", e);
    }
  }

  if (!window.map.getSource("radar-sites")) {
    window.map.addSource("radar-sites", {
      type: "geojson",
      data: { type: "FeatureCollection", features: window.allRadarSitesData },
    });
  }

  const colorExp = ["coalesce", ["get", "displayColor"], "#808080"];
  const aVis = window.alertsEnabled ? "visible" : "none";
  const sortKeyExp = ["-", 200, ["coalesce", ["get", "priorityScore"], 200]];

  if (!window.map.getLayer(window.layerIds.alertsZone)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsZone,
        type: "fill",
        source: "alerts-zone",
        paint: { "fill-color": colorExp, "fill-opacity": 0.05 },
        layout: { visibility: aVis, "fill-sort-key": sortKeyExp },
        filter: ["==", "geometryType", "zone"],
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsZoneBorder)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsZoneBorder,
        type: "line",
        source: "alerts-zone",
        paint: { "line-color": colorExp, "line-width": 1 },
        layout: { visibility: aVis, "line-sort-key": sortKeyExp },
        filter: ["==", "geometryType", "zone"],
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsPolyWatch)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsPolyWatch,
        type: "fill",
        source: "alerts-poly-watch",
        paint: { "fill-color": colorExp, "fill-opacity": 0.05 },
        layout: { visibility: aVis, "fill-sort-key": sortKeyExp },
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsPolyWatchBorder)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsPolyWatchBorder,
        type: "line",
        source: "alerts-poly-watch",
        paint: { "line-color": colorExp, "line-width": 2 },
        layout: { visibility: aVis, "line-sort-key": sortKeyExp },
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsMd)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsMd,
        type: "fill",
        source: "alerts-md",
        paint: { "fill-color": colorExp, "fill-opacity": 0.05 },
        layout: { visibility: aVis, "fill-sort-key": sortKeyExp },
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsMdBorder)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsMdBorder,
        type: "line",
        source: "alerts-md",
        paint: { "line-color": colorExp, "line-width": 2 },
        layout: { visibility: aVis, "line-sort-key": sortKeyExp },
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsPolygon)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsPolygon,
        type: "fill",
        source: "alerts-poly",
        paint: { "fill-color": colorExp, "fill-opacity": 0.15 },
        layout: { visibility: aVis, "fill-sort-key": sortKeyExp },
        filter: ["==", "geometryType", "polygon"],
      },
      symbolId,
    );
  }
  if (!window.map.getLayer(window.layerIds.alertsPolygonBorder)) {
    window.map.addLayer(
      {
        id: window.layerIds.alertsPolygonBorder,
        type: "line",
        source: "alerts-poly",
        paint: { "line-color": colorExp, "line-width": 2 },
        layout: { visibility: aVis, "line-sort-key": sortKeyExp },
        filter: ["==", "geometryType", "polygon"],
      },
      symbolId,
    );
  }

  if (!window.map.getLayer("highlight-fill"))
    window.map.addLayer({
      id: "highlight-fill",
      type: "fill",
      source: "highlight-source",
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0,
        "fill-opacity-transition": { duration: 750 },
      },
    });
  if (!window.map.getLayer("highlight-line"))
    window.map.addLayer({
      id: "highlight-line",
      type: "line",
      source: "highlight-source",
      paint: {
        "line-color": "#ffffff",
        "line-width": 3,
        "line-opacity": 0,
        "line-opacity-transition": { duration: 750 },
      },
    });
  if (!window.map.getLayer(window.layerIds.radar)) {
    window.map.addLayer(
      {
        id: window.layerIds.radar,
        type: "raster",
        source: "weather-radar",
        layout: { visibility: window.mosaicVisible() },
      },
      window.layerIds.alertsZone,
    );
  }

  window.spcSources.forEach((s) => {
    let isVis =
      window.activeSpcDay !== "none" &&
      window.layerIds.spc["day" + window.activeSpcDay]?.[
        window.activeSpcType
      ] === s.id
        ? "visible"
        : "none";
    if (!window.map.getLayer(s.id))
      window.map.addLayer(
        {
          id: s.id,
          type: "fill",
          source: s.id,
          paint: { "fill-color": ["get", "fill"], "fill-opacity": 0.05 },
          layout: { visibility: isVis },
        },
        window.layerIds.radar,
      );
    if (!window.map.getLayer(`${s.id}-border`))
      window.map.addLayer(
        {
          id: `${s.id}-border`,
          type: "line",
          source: s.id,
          paint: { "line-color": ["get", "fill"], "line-width": 2 },
          layout: { visibility: isVis },
        },
        window.layerIds.radar,
      );
  });

  const sitesToggle = document.getElementById("radar-sites-toggle");
  if (!window.map.getLayer(window.layerIds.radarSites)) {
    window.map.addLayer({
      id: window.layerIds.radarSites,
      type: "circle",
      source: "radar-sites",
      paint: {
        "circle-radius": 4,
        "circle-stroke-color": "white",
        "circle-stroke-width": 1.5,
        "circle-color": window.radarSiteDefaultColor,
      },
      layout: {
        visibility: sitesToggle
          ? sitesToggle.checked
            ? "visible"
            : "none"
          : "visible",
      },
    });
  }

  if (window.applyMapAlertFilters) window.applyMapAlertFilters();
  window.updateSpcLayerVisibility();
  window.updateSpcOutlooks();
  window.geocodeAndPlaceMarker();
  window.checkRadarStatus();

  let urlRadarRequest = null;
  const sParam = urlParams.get("s");
  if (sParam) {
    const flags = sParam.toLowerCase().split(",");
    flags.forEach((flag) => {
      if (flag.length === 5 && /^[rvl][a-z0-9]{4}$/i.test(flag)) {
        urlRadarRequest = {
          id: flag.substring(1).toUpperCase(),
          type: flag.charAt(0),
        };
      }
    });
  }

  if (urlRadarRequest) {
    const site = window.allRadarSitesData.find(
      (s) => s.properties.id === urlRadarRequest.id,
    );
    if (site) {
      window.activeRadarProductCode =
        urlRadarRequest.type === "r"
          ? site.properties.stationType === "TDWR"
            ? "bref1"
            : "sr_bref"
          : urlRadarRequest.type === "v"
            ? site.properties.stationType === "TDWR"
              ? "bvel"
              : "sr_bvel"
            : site.properties.stationType === "TDWR"
              ? "brefl"
              : "sr_bref";
      window.activeSiteIdForData = urlRadarRequest.id.toLowerCase();
    }
  }

  if (window.activeSiteIdForData && window.activeRadarProductCode) {
    const s = window.activeSiteIdForData,
      p = window.activeRadarProductCode;
    window.activeSiteIdForData = window.activeRadarProductCode = null;
    window.toggleRadarProduct(s, p);
    if (window.flyToRadarSetting) {
      const site = window.allRadarSitesData.find(
        (site) => site.properties.id.toLowerCase() === s,
      );
      if (site) {
        willFlyToRadar = true;
        window.map.flyTo({
          center: site.geometry.coordinates,
          zoom: 7,
          essential: true,
        });
      }
    }
  }

  if (!willFlyToRadar && window.saveSettingsEnabled) {
    const savedZoom = localStorage.getItem("lastZoom"),
      savedCenter = localStorage.getItem("lastCenter");
    if (savedZoom && savedCenter) {
      try {
        window.map.flyTo({
          center: JSON.parse(savedCenter),
          zoom: parseFloat(savedZoom),
          essential: true,
        });
      } catch (e) {}
    }
  }

  setInterval(window.checkRadarStatus, 480000);
  setInterval(window.updateSpcOutlooks, 480000);
  await Promise.all([
    window.refreshNwsAlerts(true),
    window.updatePlacefileAlerts(true),
  ]);
  window.isInitialLoad = false;
  window.startAlertIntervals();

  setInterval(window.updateRadar, 90000);
  setInterval(window.updateSingleSiteRadar, 60000);

  window.map.on("moveend", () => {
    if (window.saveSettingsEnabled) {
      localStorage.setItem("lastZoom", window.map.getZoom());
      localStorage.setItem(
        "lastCenter",
        JSON.stringify(window.map.getCenter()),
      );
    }
  });

  window.map.on("contextmenu", (e) => {
    e.preventDefault();
    window.closeAllPopups();
    let nearest = null;
    let min = Infinity;
    window.allRadarSitesData.forEach((s) => {
      const props = s.properties;
      if (props.isOffline && !window.selectOfflineSites) return;
      if (
        window.radarSiteSelectionMode === "Both" ||
        window.radarSiteSelectionMode === props.stationType
      ) {
        const dist = e.lngLat.distanceTo(
          new maplibregl.LngLat(
            s.geometry.coordinates[0],
            s.geometry.coordinates[1],
          ),
        );
        if (dist < min) {
          min = dist;
          nearest = s;
        }
      }
    });
    if (nearest) {
      const id = nearest.properties.id.toLowerCase(),
        type = nearest.properties.stationType;
      let prod = window.activeRadarProductCode
        ? window.activeRadarProductCode.includes("vel")
          ? type === "TDWR"
            ? "bvel"
            : "sr_bvel"
          : window.activeRadarProductCode === "brefl"
            ? type === "TDWR"
              ? "brefl"
              : "sr_bref"
            : type === "TDWR"
              ? "bref1"
              : "sr_bref"
        : type === "TDWR"
          ? "bref1"
          : "sr_bref";
      if (window.flyToRadarSetting) {
        window.map.flyTo({
          center: nearest.geometry.coordinates,
          zoom: 7,
          essential: true,
        });
        if (window.activeSiteIdForData !== id)
          window.toggleRadarProduct(id, prod);
      } else {
        window.toggleRadarProduct(id, prod);
      }
    }
  });
});

window.map.on("click", (e) => {
  if (currentMapPopup) {
    window.closeAllPopups();
    return;
  }
  const features = window.map.queryRenderedFeatures(e.point, {
    layers: [
      window.layerIds.radarSites,
      window.layerIds.alertsZone,
      window.layerIds.alertsPolygon,
      window.layerIds.alertsMd,
      window.layerIds.alertsPolyWatch,
      ...window.allSpcLayerIds,
    ],
  });
  window.closeAllPopups();
  if (!features.length) return;
  const top = features[0];

  if (top.layer.id === window.layerIds.radarSites) {
    const site = window.allRadarSitesData.find(
      (s) => s.properties.id === top.properties.id,
    );
    if (site && (!site.properties.isOffline || window.selectOfflineSites)) {
      const id = site.properties.id.toLowerCase(),
        type = site.properties.stationType;
      if (window.activeSiteIdForData === id) {
        window.removeSingleSiteLayer();
        window.activeRadarProductCode = window.activeSiteIdForData = null;
        window.map.setPaintProperty(
          window.layerIds.radarSites,
          "circle-color",
          window.radarSiteDefaultColor,
        );
        window.updateMosaicVisibility();
        if (window.saveCurrentState) window.saveCurrentState();
        return;
      }
      let prod = window.activeRadarProductCode
        ? window.activeRadarProductCode.includes("vel")
          ? type === "TDWR"
            ? "bvel"
            : "sr_bvel"
          : window.activeRadarProductCode === "brefl"
            ? type === "TDWR"
              ? "brefl"
              : "sr_bref"
            : type === "TDWR"
              ? "bref1"
              : "sr_bref"
        : type === "TDWR"
          ? "bref1"
          : "sr_bref";
      window.toggleRadarProduct(id, prod);
      if (window.flyToRadarSetting)
        window.map.flyTo({
          center: site.geometry.coordinates,
          zoom: 7,
          essential: true,
        });
    }
  } else {
    const alerts = window.map
      .queryRenderedFeatures(e.point, {
        layers: [
          window.layerIds.alertsZone,
          window.layerIds.alertsPolygon,
          window.layerIds.alertsMd,
          window.layerIds.alertsPolyWatch,
        ],
      })
      .map((f) => {
        const found = [
          ...window.globalPolyAlerts,
          ...window.globalZoneAlerts,
          ...window.globalMdAlerts,
          ...window.globalPolyWatchAlerts,
        ].find((a) => a.properties.id === f.properties.id);
        return found
          ? { type: "alert", feature: found, properties: found.properties }
          : null;
      })
      .filter(Boolean);

    const spc =
      window.activeSpcDay !== "none"
        ? window.map
            .queryRenderedFeatures(e.point, { layers: window.allSpcLayerIds })
            .map((f) => ({ type: "outlook", properties: f.properties }))
        : [];
    const items = [
      ...new Map(
        alerts
          .concat(spc)
          .map((i) => [i.properties.id || i.properties.LABEL, i]),
      ).values(),
    ];
    if (items.length) window.showAlertMapPopup(items, e.lngLat);
  }
});

[
  window.layerIds.alertsZone,
  window.layerIds.alertsPolygon,
  window.layerIds.alertsMd,
  window.layerIds.alertsPolyWatch,
  window.layerIds.radarSites,
  ...window.allSpcLayerIds,
].forEach((l) => {
  window.map.on(
    "mouseenter",
    l,
    () => (window.map.getCanvas().style.cursor = "pointer"),
  );
  window.map.on(
    "mouseleave",
    l,
    () => (window.map.getCanvas().style.cursor = ""),
  );
});

function handleOutlookShortcut(day) {
  const types = window.outlookTypes[day];
  if (!types) return;
  let next =
    window.activeSpcDay === day
      ? types[(types.indexOf(window.activeSpcType) + 1) % types.length]
      : types[0];
  window.activeSpcDay = day;
  window.activeSpcType = next;
  window.updateSpcLayerVisibility();
  if (window.saveCurrentState) window.saveCurrentState();
  window.showToast(`Outlook: Day ${day} ${window.typeLabels[next]}`);
  window.updateGreenStatusIndicators();
  window.updateSpcOutlookPanelState();
}

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (window.isAnyRadarVisible()) {
    if (e.code === "Space") {
      e.preventDefault();
      window.toggleRadarLoop();
    } else if (e.key === "," || e.key === ".") {
      e.preventDefault();
      window.stepFrame(e.key === "," ? -1 : +1);
    }
  }

  if (!e.shiftKey) return;
  if (e.code === "KeyU") {
    if (window.debugModeEnabled) {
      const dbgIn = document.getElementById("debug-file-input");
      if (dbgIn) dbgIn.click();
      window.showToast("Upload Debug File");
    }
    return;
  }
  if (e.code === "KeyA") {
    window.toggleAllAlerts();
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
      window.updateMosaicVisibility();
      window.saveCurrentState();
      window.updateGreenStatusIndicators();
      if (window.updateRadarPanelToggles) window.updateRadarPanelToggles();
      window.showToast(`Radar Mosaic: ${radarToggle.checked ? "On" : "Off"}`);
    }
    return;
  }
  if (e.code === "KeyS") {
    window.showSitesMode = window.showSitesMode === "None" ? "Both" : "None";
    if (window.updateShowSitesFilter) window.updateShowSitesFilter();
    window.saveCurrentState();
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
      if (window.map.getSource("alerts-poly-watch"))
        window.map
          .getSource("alerts-poly-watch")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalPolyWatchAlerts = [];
      window.refreshNwsAlerts(true);
    } else if (!window.zoneAlertsEnabled) {
      window.showToast("Zone Alerts: Off");
      if (window.map.getSource("alerts-zone"))
        window.map
          .getSource("alerts-zone")
          .setData({ type: "FeatureCollection", features: [] });
      window.globalZoneAlerts = [];
      if (window.alertsEnabled) {
        window.refreshNwsAlerts(true);
        window.updatePlacefileAlerts(true);
      }
    }
  } else if (e.code === "Backquote") {
    window.activeSpcDay = window.activeSpcType = "none";
    window.updateSpcLayerVisibility();
    if (window.saveCurrentState) window.saveCurrentState();
    window.showToast("Outlook: Off");
    window.updateGreenStatusIndicators();
  } else if (e.code.startsWith("Digit")) {
    handleOutlookShortcut(e.code.slice(5));
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
      if (p && p !== window.activeRadarProductCode)
        window.toggleRadarProduct(window.activeSiteIdForData, p);
    }
  }
});

(function () {
  const sidebarBtn = document.getElementById("fab-alerts");
  const sidebar = document.getElementById("alerts-sidebar");
  const closeBtn = document.getElementById("alerts-sidebar-close");
  const listEl = document.getElementById("alerts-sidebar-list");
  const emptyEl = document.getElementById("alerts-sidebar-empty");
  const countEl = document.getElementById("alerts-sidebar-count");

  window.openSidebar = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    window.closeAllMenus();
    if (sidebar) sidebar.classList.add("open");
    if (sidebarBtn) sidebarBtn.classList.add("active");
    if (listEl) listEl.scrollTop = 0;
    renderSidebar();
  };

  window.closeSidebar = function () {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarBtn) sidebarBtn.classList.remove("active");
    if (listEl)
      listEl
        .querySelectorAll(".sidebar-alert-group.open")
        .forEach((g) => g.classList.remove("open"));
  };

  if (sidebarBtn)
    sidebarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sidebar)
        sidebar.classList.contains("open")
          ? window.closeSidebar()
          : window.openSidebar();
    });
  if (closeBtn) closeBtn.addEventListener("click", window.closeSidebar);

  const sidebarSett = document.getElementById("alerts-sidebar-settings");
  if (sidebarSett)
    sidebarSett.addEventListener("click", () => {
      window.openAlertSettings();
    });
  const sidebarTgl = document.getElementById("alerts-sidebar-toggle");
  if (sidebarTgl)
    sidebarTgl.addEventListener("click", () => {
      window.toggleAllAlerts();
    });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeSidebar();
  });

  function getAllActiveAlerts() {
    const all = [
        ...window.globalPolyAlerts,
        ...window.globalZoneAlerts,
        ...(window.mesoDiscussionsEnabled ? window.globalMdAlerts : []),
        ...window.globalPolyWatchAlerts,
      ],
      seen = new Set();
    const unique = all.filter((f) => {
      const id = f.properties.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    unique.sort((a, b) => {
      const scoreA = window.getAlertPriorityScore(a);
      const scoreB = window.getAlertPriorityScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      const timeA = a.properties.sent
        ? new Date(a.properties.sent).getTime()
        : 0;
      const timeB = b.properties.sent
        ? new Date(b.properties.sent).getTime()
        : 0;
      return timeB - timeA;
    });
    return unique;
  }

  function renderSidebar() {
    const alerts = getAllActiveAlerts(),
      count = alerts.length;
    if (countEl) countEl.textContent = count > 0 ? `(${count})` : "";
    const searchQuery = (
      document.getElementById("alerts-sidebar-search")?.value || ""
    )
      .toLowerCase()
      .trim();
    const openGroups = new Set();
    if (listEl)
      Array.from(listEl.querySelectorAll(".sidebar-alert-group.open")).forEach(
        (g) => {
          openGroups.add(g.dataset.eventType);
        },
      );
    if (listEl)
      Array.from(listEl.children).forEach((c) => {
        if (c.id !== "alerts-sidebar-empty") c.remove();
      });

    if (count === 0) {
      const icon = document.getElementById("alerts-sidebar-empty-icon"),
        text = document.getElementById("alerts-sidebar-empty-text");
      if (!window.alertsEnabled) {
        if (icon) icon.textContent = "notifications_off";
        if (text) text.textContent = "Alerts are off";
      } else if (window.isInitialLoad || window.isAlertsLoading) {
        if (icon) icon.textContent = "hourglass_empty";
        if (text) text.textContent = "Loading alerts...";
      } else {
        if (icon) icon.textContent = "check_circle";
        if (text) text.textContent = "No active alerts";
      }
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    const groups = new Map();
    alerts.forEach((feature) => {
      const evt = feature.properties.event || "Alert",
        key = evt.startsWith("Mesoscale Discussion")
          ? "Mesoscale Discussion"
          : evt;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(feature);
    });

    groups.forEach((groupAlerts, eventType) => {
      if (searchQuery && !eventType.toLowerCase().includes(searchQuery)) return;
      const color = groupAlerts[0].properties.displayColor || "#808080",
        group = document.createElement("div");
      group.className = "sidebar-alert-group";
      group.dataset.eventType = eventType;
      const isRecentlySent = (sentIso) => {
        if (!sentIso) return false;
        const d = new Date(sentIso);
        return !isNaN(d.getTime()) && Date.now() - d.getTime() <= 300000;
      };
      const groupHasNew = groupAlerts.some(
          (f) =>
            f.properties.messageType === "Alert" &&
            isRecentlySent(f.properties.sent),
        ),
        groupHasUpdated = groupAlerts.some(
          (f) =>
            f.properties.messageType === "Update" &&
            isRecentlySent(f.properties.sent),
        );

      const header = document.createElement("div");
      header.className = "sidebar-alert-group-header";
      header.style.borderLeftColor = `${color}80`;
      header.innerHTML = `<span class="group-label">${eventType}</span>${groupHasNew ? `<span class="alert-new-tag">New</span>` : ""}${groupHasUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}<span class="group-count">${groupAlerts.length}</span><i class="material-symbols-rounded group-chevron">expand_more</i>`;

      const items = document.createElement("div");
      items.className = "sidebar-alert-group-items";
      if (openGroups.has(eventType)) group.classList.add("open");
      header.addEventListener("click", () => group.classList.toggle("open"));

      groupAlerts.forEach((feature) => {
        const props = feature.properties,
          itemColor = props.displayColor || "#808080",
          name = props.specificEventName || props.event || "Alert",
          area = props.areaDesc || "",
          timeRange = window.formatAlertTimeRange(props.sent, props.expires),
          itemIsNew =
            props.messageType === "Alert" && isRecentlySent(props.sent),
          itemIsUpdated =
            props.messageType === "Update" && isRecentlySent(props.sent);
        const item = document.createElement("div");
        item.className = "sidebar-alert-item";
        item.style.borderLeftColor = `${itemColor}80`;
        item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name" style="display:flex;align-items:center;gap:6px;"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>${itemIsNew ? `<span class="alert-new-tag">New</span>` : ""}${itemIsUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}</div>${area ? `<div class="sidebar-alert-area">${area}</div>` : ""}${timeRange ? `<div class="sidebar-alert-expires">${timeRange}</div>` : ""}</div>`;

        item.addEventListener("click", () => {
          window.flyToAlert(feature);
          window.closeSidebar();
        });
        items.appendChild(item);
      });
      group.appendChild(header);
      group.appendChild(items);
      if (listEl) listEl.appendChild(group);
    });
  }

  window.renderAlertsSidebar = renderSidebar;
  if (sidebarBtn)
    sidebarBtn.addEventListener("click", () => {
      if (sidebar && sidebar.classList.contains("open")) renderSidebar();
    });
  setInterval(renderSidebar, 10000);
  const sidebarSearchInput = document.getElementById("alerts-sidebar-search");
  if (sidebarSearchInput)
    sidebarSearchInput.addEventListener("input", renderSidebar);
  setTimeout(renderSidebar, 3000);
})();

window.renderSpcOutlookPanel = function () {
  const body = document.getElementById("spc-outlook-body");
  if (!body) return;
  body.innerHTML = "";

  const dayConfigs = [
    { id: "1", label: "Day 1", types: ["cat", "torn", "wind", "hail"] },
    { id: "2", label: "Day 2", types: ["cat", "torn", "wind", "hail"] },
    { id: "3", label: "Day 3", types: ["cat", "prob"] },
    { id: "4", label: "Day 4", types: ["prob"] },
    { id: "5", label: "Day 5", types: ["prob"] },
    { id: "6", label: "Day 6", types: ["prob"] },
    { id: "7", label: "Day 7", types: ["prob"] },
    { id: "8", label: "Day 8", types: ["prob"] },
  ];
  const typeNames = {
    cat: "Categorical",
    torn: "Tornado",
    wind: "Wind",
    hail: "Hail",
    prob: "Probabilistic",
  };
  let anyDay = false;

  dayConfigs.forEach(({ id, label, types }) => {
    const typeData = [];
    types.forEach((type) => {
      const sourceId = `spc-day${id}-${type}`;
      const highest = window.getSpcSourceHighest(sourceId);
      if (highest) typeData.push({ type, highest, sourceId });
    });
    if (typeData.length === 0) return;
    anyDay = true;

    const catData =
      typeData.find((t) => t.type === "cat") ||
      typeData.find((t) => t.type === "prob") ||
      typeData[0];
    const headerColor = catData.highest.fill;
    const isActiveDay = window.activeSpcDay === id;
    const group = document.createElement("div");
    group.className = "sidebar-alert-group";
    const header = document.createElement("div");
    header.className = "sidebar-alert-group-header";
    header.style.borderLeftColor = `${headerColor}80`;

    if (isActiveDay) {
      header.style.background = "var(--status-green)";
      header.style.borderTopColor = "var(--status-green-border)";
      header.style.borderRightColor = "var(--status-green-border)";
      header.style.borderBottomColor = "var(--status-green-border)";
    }
    header.innerHTML = `<span class="group-label">${label}</span><span class="group-count">${window.formatSpcLabel(catData.highest.label)}</span><i class="material-symbols-rounded group-chevron">expand_more</i>`;
    header.addEventListener("click", () => group.classList.toggle("open"));

    const items = document.createElement("div");
    items.className = "sidebar-alert-group-items";

    typeData.forEach(({ type, highest }) => {
      const item = document.createElement("div");
      item.className = "sidebar-alert-item spc-type-btn";
      item.dataset.day = id;
      item.dataset.type = type;
      item.style.borderLeftColor = `${highest.fill}80`;

      if (window.activeSpcDay === id && window.activeSpcType === type) {
        item.style.background = "var(--status-green)";
        item.style.borderTopColor = "var(--status-green-border)";
        item.style.borderRightColor = "var(--status-green-border)";
        item.style.borderBottomColor = "var(--status-green-border)";
      }
      item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name">${typeNames[type] || type}</div><div class="sidebar-alert-area">${window.formatSpcLabel(highest.label)}</div></div>`;

      item.addEventListener("click", () => {
        if (window.activeSpcDay === id && window.activeSpcType === type) {
          window.activeSpcDay = "none";
          window.activeSpcType = "none";
          window.showToast("Outlook: Off");
        } else {
          window.activeSpcDay = id;
          window.activeSpcType = type;
          window.showToast(`Outlook: Day ${id} ${typeNames[type] || "Prob."}`);
        }
        window.updateSpcLayerVisibility();
        if (window.saveCurrentState) window.saveCurrentState();
        window.updateGreenStatusIndicators();
        window.renderSpcOutlookPanel();
      });
      items.appendChild(item);
    });
    group.appendChild(header);
    group.appendChild(items);
    body.appendChild(group);
  });

  if (!anyDay) {
    const empty = document.createElement("div");
    empty.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#ffffff40;font-size:14px;padding:40px 20px;text-align:center;";
    const isLoading = Object.keys(window.spcSourceCache).length === 0;
    empty.innerHTML = `<i class="material-symbols-rounded" style="font-size:36px;">${isLoading ? "hourglass_empty" : "check_circle"}</i><span>${isLoading ? "Loading outlooks..." : "No active outlooks"}</span>`;
    body.appendChild(empty);
  }
};

window.updateSpcOutlookPanelState = function () {
  window.renderSpcOutlookPanel();
};
