window.menuHistory = [];

window.getCurrentOpenMenu = function () {
  if (document.getElementById("settings-popup")?.classList.contains("open"))
    return "settings";
  if (
    document.getElementById("alert-settings-popup")?.classList.contains("open")
  )
    return "alert-settings";
  if (document.getElementById("radar-panel")?.classList.contains("open"))
    return "radar";
  if (
    document.getElementById("radar-settings-popup")?.classList.contains("open")
  )
    return "radar-settings";
  if (
    document.getElementById("hidden-alerts-panel")?.classList.contains("open")
  )
    return "hidden-alerts";
  if (document.getElementById("alert-sounds-panel")?.classList.contains("open"))
    return "alert-sounds";
  if (
    document.getElementById("location-search-panel")?.classList.contains("open")
  )
    return "search";
  if (document.getElementById("spc-outlook-panel")?.classList.contains("open"))
    return "outlooks";
  if (document.getElementById("alerts-sidebar")?.classList.contains("open"))
    return "alerts-sidebar";
  if (
    document.getElementById("search-settings-popup")?.classList.contains("open")
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

window.toggleFabMenu = function () {
  const menu = document.getElementById("fab-menu");
  const btn = document.getElementById("fab-menu-btn");
  if (menu && btn) {
    menu.classList.toggle("open");
    btn.classList.toggle("active", menu.classList.contains("open"));
  }
};

window.openLocationSearch = function (isBack = false) {
  if (!isBack) window.menuHistory = [];
  window.closeAllMenus();
  const locationSearchPanel = document.getElementById("location-search-panel");
  const locationSearchResults = document.getElementById(
    "location-search-results",
  );
  const locationSearchInput = document.getElementById("location-search-input");

  if (locationSearchPanel) {
    locationSearchPanel.classList.add("open");
    const sBtn = document.getElementById("fab-search-btn");
    if (sBtn) sBtn.classList.add("active");
    if (locationSearchResults) locationSearchResults.scrollTop = 0;
    if (locationSearchInput) setTimeout(() => locationSearchInput.focus(), 50);
  }
};

window.closeLocationSearch = function () {
  const locationSearchPanel = document.getElementById("location-search-panel");
  const locationSearchInput = document.getElementById("location-search-input");
  const locationSearchResults = document.getElementById(
    "location-search-results",
  );

  if (locationSearchPanel) locationSearchPanel.classList.remove("open");
  const sBtn = document.getElementById("fab-search-btn");
  if (sBtn) sBtn.classList.remove("active");
  if (typeof locationSearchTimeout !== "undefined")
    clearTimeout(locationSearchTimeout);
  if (locationSearchInput) locationSearchInput.value = "";

  if (locationSearchResults) {
    Array.from(
      locationSearchResults.querySelectorAll(
        ".location-result-item, .search-section-header, .settings-row",
      ),
    ).forEach((el) => el.remove());
  }

  const locationSearchEmpty = document.getElementById("location-search-empty");
  const locationSearchEmptyText = document.getElementById(
    "location-search-empty-text",
  );
  if (locationSearchEmpty) {
    locationSearchEmpty.style.display = "flex";
    locationSearchEmpty.querySelector(".material-symbols-rounded").textContent =
      "travel_explore";
    if (locationSearchEmptyText)
      locationSearchEmptyText.textContent = "Results show up here";
  }
};

window.clearLocationMarker = function () {
  if (typeof locationSearchMarker !== "undefined" && locationSearchMarker) {
    locationSearchMarker.remove();
    locationSearchMarker = null;
  }
  const sBtn = document.getElementById("fab-search-btn");
  if (sBtn) sBtn.classList.remove("status-on");
  window.showToast("Search Cleared");
};

window.openSpcOutlookPanel = function (isBack = false) {
  if (!isBack) window.menuHistory = [];
  window.closeAllMenus();
  const panel = document.getElementById("spc-outlook-panel");
  const fabOutlooks = document.getElementById("fab-outlooks");
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
  const fabOutlooks = document.getElementById("fab-outlooks");
  if (panel) panel.classList.remove("open");
  document
    .querySelectorAll("#spc-outlook-body .sidebar-alert-group")
    .forEach((g) => g.classList.remove("open"));
  if (fabOutlooks) fabOutlooks.classList.remove("active");
};

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
      if (window.getSpcSourceHighest) {
        const highest = window.getSpcSourceHighest(sourceId);
        if (highest) typeData.push({ type, highest, sourceId });
      }
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

    let formattedLabel = catData.highest.label;
    if (window.formatSpcLabel)
      formattedLabel = window.formatSpcLabel(catData.highest.label);

    header.innerHTML = `<span class="group-label">${label}</span><span class="group-count">${formattedLabel}</span><i class="material-symbols-rounded group-chevron">expand_more</i>`;
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

      let itemFormattedLabel = highest.label;
      if (window.formatSpcLabel)
        itemFormattedLabel = window.formatSpcLabel(highest.label);

      item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name">${typeNames[type] || type}</div><div class="sidebar-alert-area">${itemFormattedLabel}</div></div>`;

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
        if (window.updateSpcLayerVisibility) window.updateSpcLayerVisibility();
        if (window.saveCurrentState) window.saveCurrentState();
        if (window.updateGreenStatusIndicators)
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
    const isLoading = window.spcSourceCache
      ? Object.keys(window.spcSourceCache).length === 0
      : false;
    empty.innerHTML = `<i class="material-symbols-rounded" style="font-size:36px;">${isLoading ? "hourglass_empty" : "check_circle"}</i><span>${isLoading ? "Loading outlooks..." : "No active outlooks"}</span>`;
    body.appendChild(empty);
  }
};

window.updateSpcOutlookPanelState = function () {
  window.renderSpcOutlookPanel();
};

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

  if (!window.allRadarSitesData || !window.allRadarSitesData.length) {
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
      if (window.toggleRadarProduct)
        window.toggleRadarProduct(siteId, prodCode);
      if (window.map)
        window.map.flyTo({
          center: site.geometry.coordinates,
          zoom: 7,
          essential: true,
        });
      if (window.updateGreenStatusIndicators)
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
  const radarPanel = document.getElementById("radar-panel");
  const fabMosaic = document.getElementById("fab-mosaic");
  if (radarPanel) radarPanel.classList.add("open");
  if (fabMosaic) fabMosaic.classList.add("active");
};

window.closeRadarPanel = function () {
  const radarPanel = document.getElementById("radar-panel");
  const fabMosaic = document.getElementById("fab-mosaic");
  if (radarPanel) radarPanel.classList.remove("open");
  if (window.closeRadarSettings) window.closeRadarSettings();
  if (fabMosaic) fabMosaic.classList.remove("active");
};

document.addEventListener("DOMContentLoaded", () => {
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

  if (searchSettingsBtn)
    searchSettingsBtn.addEventListener("click", () =>
      window.openSearchSettings(),
    );
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

  if (
    searchLocationsToggleBtn &&
    searchLocationsToggleUI &&
    searchRadarsLimit
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

  const mosaicSettingsBtn = document.getElementById(
    "mosaic-toggle-settings-btn",
  );
  const mosaicSettingsToggleUI = document.getElementById(
    "mosaic-toggle-settings-toggle-ui",
  );
  const radarToggleEl = document.getElementById("radar-toggle");

  if (mosaicSettingsBtn && mosaicSettingsToggleUI && radarToggleEl) {
    mosaicSettingsToggleUI.classList.toggle("active", radarToggleEl.checked);
    mosaicSettingsBtn.addEventListener("click", () => {
      radarToggleEl.checked = !radarToggleEl.checked;
      mosaicSettingsToggleUI.classList.toggle("active", radarToggleEl.checked);
      if (window.updateMosaicVisibility) window.updateMosaicVisibility();
      window.saveCurrentState();
      window.updateGreenStatusIndicators();
      window.updateRadarPanelToggles();
      window.showToast(`Radar Mosaic: ${radarToggleEl.checked ? "On" : "Off"}`);
    });
  }

  const locationSearchInput = document.getElementById("location-search-input");
  const locationSearchResults = document.getElementById(
    "location-search-results",
  );
  const locationSearchEmpty = document.getElementById("location-search-empty");
  const locationSearchEmptyText = document.getElementById(
    "location-search-empty-text",
  );

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

    locationSearchInput.addEventListener("input", () => {
      const q = locationSearchInput.value.trim();
      const query = q.toLowerCase();
      if (typeof locationSearchTimeout !== "undefined")
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

      if (window.searchRadarsMax > 0 && window.allRadarSitesData) {
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
                  if (window.toggleRadarProduct)
                    window.toggleRadarProduct(siteId, prodCode);
                }
                if (window.map)
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
          ...(window.globalPolyAlerts || []),
          ...(window.globalZoneAlerts || []),
          ...(window.mesoDiscussionsEnabled && window.globalMdAlerts
            ? window.globalMdAlerts
            : []),
          ...(window.globalPolyWatchAlerts || []),
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
              if (window.flyToAlert) window.flyToAlert(f);
            });
            locationSearchResults.appendChild(row);
          });
          localResultsRendered = true;
        }
      }

      if (
        window.searchOutlooksMax > 0 &&
        window.spcSources &&
        window.spcSourceCache
      ) {
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
            let formattedLabel = rawLabel;
            if (window.formatSpcLabel)
              formattedLabel = window.formatSpcLabel(rawLabel);
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
              if (window.updateSpcLayerVisibility)
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
                  if (
                    bounds.getNorthEast() &&
                    bounds.getSouthWest() &&
                    window.map
                  ) {
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
                    if (
                      typeof locationSearchMarker !== "undefined" &&
                      locationSearchMarker
                    )
                      locationSearchMarker.remove();
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

  const locCloseBtn = document.getElementById("location-search-close-btn");
  if (locCloseBtn)
    locCloseBtn.addEventListener("click", window.closeLocationSearch);

  const searchFab = document.getElementById("fab-search-btn");
  if (searchFab) {
    searchFab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (searchFab.classList.contains("status-on")) {
        window.clearLocationMarker();
        const locationSearchPanel = document.getElementById(
          "location-search-panel",
        );
        if (
          locationSearchPanel &&
          locationSearchPanel.classList.contains("open")
        ) {
          window.closeLocationSearch();
        }
      } else {
        const locationSearchPanel = document.getElementById(
          "location-search-panel",
        );
        if (locationSearchPanel) {
          locationSearchPanel.classList.contains("open")
            ? window.closeLocationSearch()
            : window.openLocationSearch();
        }
      }
    });
  }

  const fabMenuBtn = document.getElementById("fab-menu-btn");
  if (fabMenuBtn)
    fabMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.toggleFabMenu();
    });

  const spcCloseBtn = document.getElementById("spc-outlook-close-btn");
  if (spcCloseBtn)
    spcCloseBtn.addEventListener("click", window.closeSpcOutlookPanel);

  const fabOutlooks = document.getElementById("fab-outlooks");
  if (fabOutlooks)
    fabOutlooks.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = document.getElementById("spc-outlook-panel");
      if (panel)
        panel.classList.contains("open")
          ? window.closeSpcOutlookPanel()
          : window.openSpcOutlookPanel();
    });

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
        if (window.updateMosaicVisibility) window.updateMosaicVisibility();
        window.saveCurrentState();
        window.updateGreenStatusIndicators();
        window.updateRadarPanelToggles();
      }
    });
  }

  const rPanelSett = document.getElementById("radar-panel-settings-btn");
  if (rPanelSett)
    rPanelSett.addEventListener("click", () => {
      if (window.openRadarSettingsFrom) window.openRadarSettingsFrom("radar");
    });

  const fabMosaic = document.getElementById("fab-mosaic");
  if (fabMosaic)
    fabMosaic.addEventListener("click", (e) => {
      e.stopPropagation();
      const radarPanel = document.getElementById("radar-panel");
      if (radarPanel)
        radarPanel.classList.contains("open")
          ? window.closeRadarPanel()
          : window.openRadarPanel();
    });

  const fabSettings = document.getElementById("fab-settings");
  if (fabSettings)
    fabSettings.addEventListener("click", () => {
      const settingsPopup = document.getElementById("settings-popup");
      if (settingsPopup)
        settingsPopup.classList.contains("open")
          ? window.closeSettings && window.closeSettings()
          : window.openSettings && window.openSettings();
    });

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
      if (window.openAlertSettings) window.openAlertSettings();
    });

  const sidebarTgl = document.getElementById("alerts-sidebar-toggle");
  if (sidebarTgl)
    sidebarTgl.addEventListener("click", () => {
      if (window.toggleAllAlerts) window.toggleAllAlerts();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeSidebar();
  });

  function getAllActiveAlerts() {
    const all = [
        ...(window.globalPolyAlerts || []),
        ...(window.globalZoneAlerts || []),
        ...(window.mesoDiscussionsEnabled && window.globalMdAlerts
          ? window.globalMdAlerts
          : []),
        ...(window.globalPolyWatchAlerts || []),
      ],
      seen = new Set();
    const unique = all.filter((f) => {
      const id = f.properties.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    unique.sort((a, b) => {
      let scoreA = 0,
        scoreB = 0;
      if (window.getAlertPriorityScore) {
        scoreA = window.getAlertPriorityScore(a);
        scoreB = window.getAlertPriorityScore(b);
      }
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

    if (listEl) {
      Array.from(listEl.querySelectorAll(".sidebar-alert-group.open")).forEach(
        (g) => {
          openGroups.add(g.dataset.eventType);
        },
      );
      Array.from(listEl.children).forEach((c) => {
        if (c.id !== "alerts-sidebar-empty") c.remove();
      });
    }

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
          itemIsNew =
            props.messageType === "Alert" && isRecentlySent(props.sent),
          itemIsUpdated =
            props.messageType === "Update" && isRecentlySent(props.sent);

        let timeRange = "";
        if (window.formatAlertTimeRange)
          timeRange = window.formatAlertTimeRange(props.sent, props.expires);

        const item = document.createElement("div");
        item.className = "sidebar-alert-item";
        item.style.borderLeftColor = `${itemColor}80`;
        item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name" style="display:flex;align-items:center;gap:6px;"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>${itemIsNew ? `<span class="alert-new-tag">New</span>` : ""}${itemIsUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}</div>${area ? `<div class="sidebar-alert-area">${area}</div>` : ""}${timeRange ? `<div class="sidebar-alert-expires">${timeRange}</div>` : ""}</div>`;

        item.addEventListener("click", () => {
          if (window.flyToAlert) window.flyToAlert(feature);
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
});
