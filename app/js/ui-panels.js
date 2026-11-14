window.menuHistory = [];

const MENU_REGISTRY = {
  settings: {
    elId: "settings-popup",
    fabId: "fab-settings",
    open: (isBack) => window.openSettings(isBack),
  },
  "alert-settings": {
    elId: "alert-settings-popup",
    open: (isBack) => window.openAlertSettings(isBack),
  },
  radar: {
    elId: "radar-panel",
    fabId: "fab-mosaic",
    open: (isBack) => window.openRadarPanel(isBack),
  },
  "radar-settings": {
    elId: "radar-settings-popup",
    open: (isBack) => window.openRadarSettingsFrom(null, isBack),
  },
  "hidden-alerts": {
    elId: "hidden-alerts-panel",
    open: (isBack) => window.openHiddenAlertsPanel(isBack),
  },
  "alert-sounds": {
    elId: "alert-sounds-panel",
    open: (isBack) => window.openAlertSoundsPanel(isBack),
  },
  search: {
    elId: "location-search-panel",
    fabId: "fab-search-btn",
    open: (isBack) => window.openLocationSearch(isBack),
  },
  outlooks: {
    elId: "spc-outlook-panel",
    fabId: "fab-outlooks",
    open: (isBack) => window.openSpcOutlookPanel(isBack),
  },
  "alerts-sidebar": {
    elId: "alerts-sidebar",
    fabId: "fab-alerts",
    open: (isBack) => window.openSidebar(isBack),
  },
  "search-settings": {
    elId: "search-settings-popup",
    open: (isBack) => window.openSearchSettings(isBack),
  },
};

window.getCurrentOpenMenu = function () {
  for (const [key, cfg] of Object.entries(MENU_REGISTRY)) {
    if (document.getElementById(cfg.elId)?.classList.contains("open")) {
      return key;
    }
  }
  return null;
};

window.closeAllMenus = function () {
  Object.values(MENU_REGISTRY).forEach(({ elId, fabId }) => {
    document.getElementById(elId)?.classList.remove("open");
    if (fabId) document.getElementById(fabId)?.classList.remove("active");
  });
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
  MENU_REGISTRY[id]?.open(isBack);
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
  document.getElementById("search-settings-popup")?.classList.remove("open");
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
    document.getElementById("fab-search-btn")?.classList.add("active");
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
  document.getElementById("fab-search-btn")?.classList.remove("active");
  if (typeof locationSearchTimeout !== "undefined") {
    clearTimeout(locationSearchTimeout);
  }
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
  document.getElementById("fab-search-btn")?.classList.remove("status-on");
  window.showToast("Search Cleared");
};

window.outlookCurrentLevel = 0;
window.outlookSelectedDay = null;
window.outlookCategory = "convective";

window.openSpcOutlookPanel = function (isBack = false) {
  if (!isBack) window.menuHistory = [];
  window.closeAllMenus();
  window.outlookCurrentLevel = 0;
  window.outlookSelectedDay = null;
  window.outlookCategory = "convective";
  const panel = document.getElementById("spc-outlook-panel");
  const fabOutlooks = document.getElementById("fab-outlooks");
  if (panel) {
    panel.classList.add("open");
    const body = document.getElementById("spc-outlook-body");
    if (body) body.scrollTop = 0;
    window.renderSpcOutlookPanel();
    if (fabOutlooks) fabOutlooks.classList.add("active");
  }
};

window.closeSpcOutlookPanel = function () {
  document.getElementById("spc-outlook-panel")?.classList.remove("open");
  document.getElementById("fab-outlooks")?.classList.remove("active");
};

function applyCardColors(card, color) {
  if (color && color !== "transparent") {
    card.style.setProperty("--card-bg", `${color}26`);
    card.style.setProperty("--card-border", `${color}66`);
    card.style.setProperty("--card-bg-hover", `${color}3d`);
    card.style.setProperty("--card-border-hover", `${color}99`);
  } else {
    card.style.removeProperty("--card-bg");
    card.style.removeProperty("--card-border");
    card.style.removeProperty("--card-bg-hover");
    card.style.removeProperty("--card-border-hover");
  }
}

function resolveRadarProductCode(type) {
  const isTdwr = type === "TDWR";
  if (!window.activeRadarProductCode) return isTdwr ? "bref1" : "sr_bref";
  if (window.activeRadarProductCode.includes("vel")) {
    return isTdwr ? "bvel" : "sr_bvel";
  }
  if (window.activeRadarProductCode === "brefl") {
    return isTdwr ? "brefl" : "sr_bref";
  }
  return isTdwr ? "bref1" : "sr_bref";
}

window.renderSpcOutlookPanel = function () {
  const body = document.getElementById("spc-outlook-body");
  if (!body) return;
  body.innerHTML = "";

  const spcBackBtn = document.getElementById("spc-outlook-back-btn");
  if (spcBackBtn) {
    spcBackBtn.style.display = window.outlookCurrentLevel > 0 ? "flex" : "none";
  }

  const typeNames = {
    cat: "Categorical",
    torn: "Tornado",
    wind: "Wind",
    hail: "Hail",
    prob: "Probabilistic",
    "fire-cat": "Categorical",
    "fire-dryt": "Dry Thunderstorms",
  };

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

  const fireConfigs = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    label: `Day ${i + 1}`,
    types: ["fire-cat", "fire-dryt"],
  }));

  const getHighestColor = (category) => {
    let absoluteHighest = null;
    let bestRank = 99;
    const configs = category === "convective" ? dayConfigs : fireConfigs;

    configs.forEach(({ id, types }) => {
      types.forEach((type) => {
        const highest = window.getSpcSourceHighest?.(`spc-day${id}-${type}`);
        if (!highest) return;
        const cleanLabel = highest.label.toUpperCase();
        let rank = 99;
        if (cleanLabel.includes("EXTREME") || cleanLabel.includes("HIGH"))
          rank = 1;
        else if (
          cleanLabel.includes("CRIT") ||
          cleanLabel.includes("MDT") ||
          cleanLabel.includes("MODERATE") ||
          cleanLabel.includes("50%")
        )
          rank = 2;
        else if (
          cleanLabel.includes("ELEV") ||
          cleanLabel.includes("ENH") ||
          cleanLabel.includes("ENHANCED") ||
          cleanLabel.includes("30%")
        )
          rank = 3;
        else if (
          cleanLabel.includes("SLGT") ||
          cleanLabel.includes("SLIGHT") ||
          cleanLabel.includes("15%")
        )
          rank = 4;
        else if (
          cleanLabel.includes("MRGL") ||
          cleanLabel.includes("MARGINAL") ||
          cleanLabel.includes("5%")
        )
          rank = 5;
        else if (
          cleanLabel.includes("TSTM") ||
          cleanLabel.includes("THUNDERSTORM") ||
          cleanLabel.includes("DRY")
        )
          rank = 6;

        if (rank < bestRank) {
          bestRank = rank;
          absoluteHighest = highest;
        }
      });
    });

    const isLowOrNoRisk =
      !absoluteHighest ||
      absoluteHighest.label.toUpperCase() === "NO RISK" ||
      absoluteHighest.label.toUpperCase() === "" ||
      absoluteHighest.label.toUpperCase().includes("TSTM");
    return absoluteHighest && !isLowOrNoRisk
      ? absoluteHighest.fill
      : "transparent";
  };

  const grid = document.createElement("div");
  grid.className = "outlook-menu-grid";

  if (window.outlookCurrentLevel === 0) {
    const categories = [
      {
        key: "convective",
        title: "Convective Outlooks",
        subtitle: "Probability for Severe Thunderstorms",
        isActive:
          window.activeSpcDay !== "none" &&
          window.activeSpcType !== "none" &&
          !window.activeSpcType.startsWith("fire"),
      },
      {
        key: "fire",
        title: "Fire Outlooks",
        subtitle: "Probability of Fire Weather",
        isActive:
          window.activeSpcDay !== "none" &&
          window.activeSpcType.startsWith("fire"),
      },
    ];

    categories.forEach(({ key, title, subtitle, isActive }) => {
      const card = document.createElement("div");
      card.className = "outlook-menu-card" + (isActive ? " active" : "");
      applyCardColors(card, getHighestColor(key));
      card.innerHTML = `<div class="card-title">${title}</div><div class="card-subtitle">${subtitle}</div>`;
      card.addEventListener("click", () => {
        window.outlookCategory = key;
        window.outlookCurrentLevel = 1;
        window.renderSpcOutlookPanel();
      });
      grid.appendChild(card);
    });
  } else if (window.outlookCurrentLevel === 1) {
    const activeConfigs =
      window.outlookCategory === "convective" ? dayConfigs : fireConfigs;

    activeConfigs.forEach(({ id, label, types }) => {
      let highestData = null;
      types.forEach((type) => {
        const highest = window.getSpcSourceHighest?.(`spc-day${id}-${type}`);
        if (highest) {
          if (
            !highestData ||
            type === "cat" ||
            type === "fire-cat" ||
            ((type === "prob" || type === "fire-dryt") &&
              highestData.type !== "cat" &&
              highestData.type !== "fire-cat")
          ) {
            highestData = { type, highest };
          }
        }
      });

      const card = document.createElement("div");
      card.className = "outlook-menu-card";

      if (types.length === 1) {
        if (window.activeSpcDay === id && window.activeSpcType === types[0]) {
          card.classList.add("active");
        }
      } else if (
        window.activeSpcDay === id &&
        window.activeSpcType !== "none" &&
        ((window.outlookCategory === "fire" &&
          window.activeSpcType.startsWith("fire")) ||
          (window.outlookCategory === "convective" &&
            !window.activeSpcType.startsWith("fire")))
      ) {
        card.classList.add("active");
      }

      let isLowOrNoRisk = false;
      if (window.outlookCategory === "fire") {
        const labelUpper = highestData
          ? highestData.highest.label.toUpperCase()
          : "";
        isLowOrNoRisk =
          !highestData ||
          labelUpper === "NO RISK" ||
          labelUpper === "" ||
          labelUpper.includes("TSTM");
      }

      const accentCol =
        highestData && !isLowOrNoRisk
          ? highestData.highest.fill
          : "transparent";
      applyCardColors(card, accentCol);

      const subtitleText = highestData
        ? window.formatSpcLabel
          ? window.formatSpcLabel(highestData.highest.label)
          : highestData.highest.label
        : window.outlookCategory === "convective"
          ? "No Risk"
          : "No active data";

      card.innerHTML = `<div class="card-title">${label}</div><div class="card-subtitle">${subtitleText}</div>`;

      if (types.length === 1) {
        const singleType = types[0];
        card.addEventListener("click", () => {
          if (
            window.activeSpcDay === id &&
            window.activeSpcType === singleType
          ) {
            window.activeSpcDay = "none";
            window.activeSpcType = "none";
            window.showToast("Outlook: Off");
          } else {
            window.activeSpcDay = id;
            window.activeSpcType = singleType;
            window.showToast(
              `Outlook: ${window.outlookCategory === "fire" ? "Fire" : "Convective"} ${label} ${typeNames[singleType] || "Prob."}`,
            );
          }
          window.updateSpcLayerVisibility?.();
          window.saveCurrentState?.();
          window.updateGreenStatusIndicators?.();
          window.renderSpcOutlookPanel();
        });
      } else {
        card.addEventListener("click", () => {
          window.outlookSelectedDay = id;
          window.outlookCurrentLevel = 2;
          window.renderSpcOutlookPanel();
        });
      }

      grid.appendChild(card);
    });
  } else if (window.outlookCurrentLevel === 2) {
    const dayId = window.outlookSelectedDay;
    const types =
      window.outlookCategory === "convective"
        ? window.outlookTypes[dayId] || []
        : ["fire-cat", "fire-dryt"];

    types.forEach((type) => {
      const highest = window.getSpcSourceHighest?.(`spc-day${dayId}-${type}`);
      const label = highest ? window.formatSpcLabel(highest.label) : "No Risk";
      const fill = highest ? highest.fill : "transparent";

      const card = document.createElement("div");
      card.className = "outlook-menu-card";
      if (window.activeSpcDay === dayId && window.activeSpcType === type) {
        card.classList.add("active");
      }

      let isLowOrNoRisk = false;
      if (window.outlookCategory === "fire") {
        const labelUpper = label.toUpperCase();
        isLowOrNoRisk =
          labelUpper === "NO RISK" ||
          labelUpper === "" ||
          labelUpper.includes("TSTM");
      }

      applyCardColors(
        card,
        fill !== "transparent" && !isLowOrNoRisk ? fill : "transparent",
      );

      card.innerHTML = `<div class="card-title">${typeNames[type] || type}</div><div class="card-subtitle">${label}</div>`;
      card.addEventListener("click", () => {
        if (window.activeSpcDay === dayId && window.activeSpcType === type) {
          window.activeSpcDay = "none";
          window.activeSpcType = "none";
          window.showToast("Outlook: Off");
        } else {
          window.activeSpcDay = dayId;
          window.activeSpcType = type;
          window.showToast(
            `Outlook: Day ${dayId} ${typeNames[type] || "Prob."}`,
          );
        }
        window.updateSpcLayerVisibility?.();
        window.saveCurrentState?.();
        window.updateGreenStatusIndicators?.();
        window.renderSpcOutlookPanel();
      });

      grid.appendChild(card);
    });
  }

  body.appendChild(grid);
};

async function showFullSpcPopup({
  title,
  icon,
  sourceId,
  fallbackColor,
  targetUrl,
}) {
  const popup = document.getElementById("full-alert-text-popup");
  const titleEl = document.getElementById("full-alert-text-popup-title-text");
  const contentEl = document.getElementById("full-alert-text-content");
  const headerEl = document.getElementById("full-alert-text-popup-header");

  if (window.closeAllMenus) window.closeAllMenus();
  if (titleEl) titleEl.textContent = title;
  if (contentEl) {
    contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Loading...</p>`;
  }

  const highest = window.getSpcSourceHighest?.(sourceId);
  const color = highest ? highest.fill : fallbackColor;

  if (headerEl) {
    headerEl.style.background = `${color}1a`;
    const iconEl = headerEl.querySelector(".material-symbols-rounded");
    if (iconEl) iconEl.textContent = icon;
  }

  const extBtn = document.getElementById("full-alert-text-popup-open-external");
  if (targetUrl) {
    extBtn.style.display = "flex";
    extBtn.onclick = () => window.open(targetUrl, "_blank");
  } else {
    extBtn.style.display = "none";
  }

  if (popup) popup.classList.add("open");
  const body = document.getElementById("full-alert-text-popup-body");
  if (body) body.scrollTop = 0;

  const text = window.fetchSpcOutlookText
    ? await window.fetchSpcOutlookText(window.activeSpcDay, false, targetUrl)
    : "Failed to load.";

  if (text === "Failed to load." || text === "Not found.") {
    if (contentEl) {
      contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Failed to load text.</p><p><a href="${targetUrl}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
    }
  } else if (contentEl && window.formatNwsText) {
    contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>${window.formatNwsText(text)}</p>`;
  }
}

window.showFullSpcTextPopup = function () {
  const spcDay = parseInt(window.activeSpcDay, 10);
  const maxType = spcDay >= 4 ? "prob" : "cat";
  const targetUrl =
    spcDay >= 4
      ? "https://www.spc.noaa.gov/products/exper/day4-8/index.html"
      : `https://www.spc.noaa.gov/products/outlook/day${window.activeSpcDay}otlk.html`;
  return showFullSpcPopup({
    title:
      spcDay >= 4
        ? "Day 4-8 Convective"
        : `Day ${window.activeSpcDay} Convective`,
    icon: "map",
    sourceId: `spc-day${window.activeSpcDay}-${maxType}`,
    fallbackColor: "#FFFFFF",
    targetUrl,
  });
};

window.showFullSpcFireTextPopup = function () {
  const spcDay = parseInt(window.activeSpcDay, 10);
  const targetUrl =
    spcDay <= 2
      ? `https://www.spc.noaa.gov/products/fire_wx/fwdy${spcDay}.html`
      : "https://www.spc.noaa.gov/products/exper/fire_wx/index.html";
  return showFullSpcPopup({
    title: spcDay >= 3 ? "Day 3-8 Fire" : `Day ${window.activeSpcDay} Fire`,
    icon: "local_fire_department",
    sourceId: `spc-day${window.activeSpcDay}-${window.activeSpcType || "fire-cat"}`,
    fallbackColor: "#ff6600",
    targetUrl,
  });
};

window.updateSpcOutlookPanelState = function () {
  window.renderSpcOutlookPanel();
};

document.addEventListener("DOMContentLoaded", () => {
  const spcBackBtn = document.getElementById("spc-outlook-back-btn");
  if (spcBackBtn) {
    spcBackBtn.addEventListener("click", () => {
      if (window.outlookCurrentLevel === 2) {
        window.outlookCurrentLevel = 1;
        window.outlookSelectedDay = null;
      } else if (window.outlookCurrentLevel === 1) {
        window.outlookCurrentLevel = 0;
      }
      window.renderSpcOutlookPanel();
    });
  }
});

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
  if (!toggle) return;
  document
    .getElementById("radar-panel-toggle")
    ?.classList.toggle("active", toggle.checked);
  document
    .getElementById("mosaic-toggle-settings-toggle-ui")
    ?.classList.toggle("active", toggle.checked);
};

window.renderRadarSiteList = function () {
  const listEl = document.getElementById("radar-panel-list");
  const emptyEl = document.getElementById("radar-panel-empty");
  const emptyTxt = document.getElementById("radar-panel-empty-text");
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
      const id = (props.id || "").toLowerCase();
      const name = (props.name || "").toLowerCase();
      return !query || id.includes(query) || name.includes(query);
    })
    .slice()
    .sort((a, b) => {
      const na = (a.properties.name || a.properties.id || "").toLowerCase();
      const nb = (b.properties.name || b.properties.id || "").toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

  if (!filtered.length) {
    if (emptyTxt) emptyTxt.textContent = "No radars found";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  filtered.forEach((site) => {
    const props = site.properties;
    const id = props.id || "";
    const name = props.name || id;
    const type = props.stationType || "";
    const offline = !!props.isOffline;
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
      const prodCode = resolveRadarProductCode(type);
      window.toggleRadarProduct?.(siteId, prodCode);
      window.map?.flyTo({
        center: site.geometry.coordinates,
        zoom: 7,
        essential: true,
      });
      window.updateGreenStatusIndicators?.();
      window.saveCurrentState?.();
    });
    listEl.appendChild(item);
  });
};

window.openRadarPanel = function (isBack = false) {
  if (!isBack) window.menuHistory = [];
  window.closeAllMenus();
  window.updateRadarPanelToggles();
  window.renderRadarSiteList();
  document.getElementById("radar-panel")?.classList.add("open");
  document.getElementById("fab-mosaic")?.classList.add("active");
};

window.closeRadarPanel = function () {
  document.getElementById("radar-panel")?.classList.remove("open");
  window.closeRadarSettings?.();
  document.getElementById("fab-mosaic")?.classList.remove("active");
};

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("location-search-settings-btn")
    ?.addEventListener("click", () => window.openSearchSettings());
  document
    .getElementById("search-settings-back-btn")
    ?.addEventListener("click", window.goBack);
  document
    .getElementById("search-settings-close-btn")
    ?.addEventListener("click", window.closeSearchSettings);
  document
    .getElementById("settings-open-search-btn")
    ?.addEventListener("click", () => window.openSearchSettings());

  const searchLocationsToggleBtn = document.getElementById(
    "search-locations-toggle-btn",
  );
  const searchLocationsToggleUI = document.getElementById(
    "search-locations-toggle-ui",
  );
  const searchLimitBindings = [
    ["search-radars-limit", "searchRadarsMax"],
    ["search-alerts-limit", "searchAlertsMax"],
    ["search-outlooks-limit", "searchOutlooksMax"],
    ["search-settings-limit", "searchSettingsMax"],
  ];

  if (searchLocationsToggleBtn && searchLocationsToggleUI) {
    searchLocationsToggleUI.classList.toggle(
      "active",
      window.searchLocationsEnabled,
    );
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
  }

  searchLimitBindings.forEach(([elId, prop]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.value = window[prop];
    el.addEventListener("change", (e) => {
      window[prop] = parseInt(e.target.value, 10);
      window.saveCurrentState();
    });
  });

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
      window.updateMosaicVisibility?.();
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
      if (typeof locationSearchTimeout !== "undefined") {
        clearTimeout(locationSearchTimeout);
      }

      if (locationSearchResults) {
        locationSearchResults
          .querySelectorAll(
            ".location-result-item, .search-section-header, .settings-row",
          )
          .forEach((el) => el.remove());
      }

      if (!q) {
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
                const prodCode = resolveRadarProductCode(type);
                if (
                  window.activeSiteIdForData !== siteId ||
                  window.activeRadarProductCode !== prodCode
                ) {
                  window.toggleRadarProduct?.(siteId, prodCode);
                }
                window.map?.flyTo({
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
              window.flyToAlert?.(f);
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
              feature.properties.label ||
              feature.properties.label2 ||
              ""
            ).trim();
            if (!rawLabel) return;
            const formattedLabel = window.formatSpcLabel
              ? window.formatSpcLabel(rawLabel)
              : rawLabel;
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
              window.updateSpcLayerVisibility?.();
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
          .filter(
            (row) =>
              row.textContent.trim() &&
              row.textContent.toLowerCase().includes(query),
          )
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
            mapLoading.remove();
            mapHeader.remove();
            return;
          }

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(activeQuery)}&format=json&limit=5&addressdetails=1`,
            );
            const data = await res.json();

            if (!locationSearchInput.value.trim()) {
              mapLoading.remove();
              mapHeader.remove();
              return;
            }

            mapLoading.remove();

            if (data && data.length > 0) {
              data.forEach((result) => {
                const lon = parseFloat(result.lon);
                const lat = parseFloat(result.lat);
                const nameParts = (result.display_name || "").split(", ");
                const name = nameParts[0];
                const detail = nameParts.slice(1).join(", ");
                const row = createSearchResultItem(
                  name,
                  detail,
                  "location_on",
                  () => {
                    if (
                      typeof locationSearchMarker !== "undefined" &&
                      locationSearchMarker
                    ) {
                      locationSearchMarker.remove();
                    }
                    locationSearchMarker = new maplibregl.Marker({
                      color: "#FFC300",
                      scale: 0.6,
                    })
                      .setLngLat([lon, lat])
                      .addTo(window.map);
                    document
                      .getElementById("fab-search-btn")
                      ?.classList.add("status-on");
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
                mapHeader.remove();
                mapEmpty.remove();
                setLocationSearchEmpty("search_off", "No results found");
              }
            }
          } catch (e) {
            mapLoading.remove();
            const mapError = document.createElement("div");
            mapError.className = "location-result-item";
            mapError.style.cssText =
              "color:#ff6b6b40; font-size:13px; font-style:italic; pointer-events:none;";
            mapError.innerHTML = `<i class="material-symbols-rounded">error</i><span>Maps database connection failed</span>`;
            locationSearchResults.appendChild(mapError);
          }
        }, 400);
      } else if (!localResultsRendered) {
        setLocationSearchEmpty("search_off", "No results found");
      }
    });

    locationSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        window.closeLocationSearch();
        e.stopPropagation();
      }
    });
  }

  document
    .getElementById("location-search-close-btn")
    ?.addEventListener("click", window.closeLocationSearch);

  const searchFab = document.getElementById("fab-search-btn");
  if (searchFab) {
    searchFab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (searchFab.classList.contains("status-on")) {
        window.clearLocationMarker();
        if (
          document
            .getElementById("location-search-panel")
            ?.classList.contains("open")
        ) {
          window.closeLocationSearch();
        }
      } else {
        const panel = document.getElementById("location-search-panel");
        if (panel) {
          panel.classList.contains("open")
            ? window.closeLocationSearch()
            : window.openLocationSearch();
        }
      }
    });
  }

  document.getElementById("fab-menu-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.toggleFabMenu();
  });

  document
    .getElementById("spc-outlook-close-btn")
    ?.addEventListener("click", window.closeSpcOutlookPanel);

  document.getElementById("fab-outlooks")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const panel = document.getElementById("spc-outlook-panel");
    if (panel) {
      panel.classList.contains("open")
        ? window.closeSpcOutlookPanel()
        : window.openSpcOutlookPanel();
    }
  });

  document
    .getElementById("radar-panel-close-btn")
    ?.addEventListener("click", window.closeRadarPanel);

  document
    .getElementById("radar-panel-search")
    ?.addEventListener("input", window.renderRadarSiteList);

  document
    .getElementById("radar-panel-toggle")
    ?.addEventListener("click", () => {
      const toggle = document.getElementById("radar-toggle");
      if (toggle) {
        toggle.checked = !toggle.checked;
        window.updateMosaicVisibility?.();
        window.saveCurrentState();
        window.updateGreenStatusIndicators();
        window.updateRadarPanelToggles();
      }
    });

  document
    .getElementById("radar-panel-settings-btn")
    ?.addEventListener("click", () => {
      window.openRadarSettingsFrom?.("radar");
    });

  document.getElementById("fab-mosaic")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const radarPanel = document.getElementById("radar-panel");
    if (radarPanel) {
      radarPanel.classList.contains("open")
        ? window.closeRadarPanel()
        : window.openRadarPanel();
    }
  });

  document.getElementById("fab-settings")?.addEventListener("click", () => {
    const settingsPopup = document.getElementById("settings-popup");
    if (settingsPopup) {
      settingsPopup.classList.contains("open")
        ? window.closeSettings?.()
        : window.openSettings?.();
    }
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
    if (listEl) {
      listEl
        .querySelectorAll(".sidebar-alert-group.open")
        .forEach((g) => g.classList.remove("open"));
    }
  };

  sidebarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (sidebar) {
      sidebar.classList.contains("open")
        ? window.closeSidebar()
        : window.openSidebar();
    }
  });
  closeBtn?.addEventListener("click", window.closeSidebar);

  document
    .getElementById("alerts-sidebar-settings")
    ?.addEventListener("click", () => {
      window.openAlertSettings?.();
    });

  document
    .getElementById("alerts-sidebar-toggle")
    ?.addEventListener("click", () => {
      window.toggleAllAlerts?.();
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
    ];
    const seen = new Set();
    const unique = all.filter((f) => {
      const id = f.properties.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    unique.sort((a, b) => {
      const scoreA = window.getAlertPriorityScore
        ? window.getAlertPriorityScore(a)
        : 0;
      const scoreB = window.getAlertPriorityScore
        ? window.getAlertPriorityScore(b)
        : 0;
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
    const alerts = getAllActiveAlerts();
    const count = alerts.length;
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
      const icon = document.getElementById("alerts-sidebar-empty-icon");
      const text = document.getElementById("alerts-sidebar-empty-text");
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
      const evt = feature.properties.event || "Alert";
      const key = evt.startsWith("Mesoscale Discussion")
        ? "Mesoscale Discussion"
        : evt;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(feature);
    });

    const isRecentlySent = (sentIso) => {
      if (!sentIso) return false;
      const d = new Date(sentIso);
      return !isNaN(d.getTime()) && Date.now() - d.getTime() <= 300000;
    };

    groups.forEach((groupAlerts, eventType) => {
      if (searchQuery && !eventType.toLowerCase().includes(searchQuery)) return;
      const color = groupAlerts[0].properties.displayColor || "#808080";
      const group = document.createElement("div");
      group.className = "sidebar-alert-group";
      group.dataset.eventType = eventType;

      const groupHasNew = groupAlerts.some(
        (f) =>
          f.properties.messageType === "Alert" &&
          isRecentlySent(f.properties.sent),
      );
      const groupHasUpdated = groupAlerts.some(
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
        const props = feature.properties;
        const itemColor = props.displayColor || "#808080";
        const name = props.specificEventName || props.event || "Alert";
        const area = props.areaDesc || "";
        const itemIsNew =
          props.messageType === "Alert" && isRecentlySent(props.sent);
        const itemIsUpdated =
          props.messageType === "Update" && isRecentlySent(props.sent);

        const timeRange = window.formatAlertTimeRange
          ? window.formatAlertTimeRange(props.sent, props.expires)
          : "";

        const item = document.createElement("div");
        item.className = "sidebar-alert-item";
        item.style.borderLeftColor = `${itemColor}80`;
        item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name" style="display:flex;align-items:center;gap:6px;"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>${itemIsNew ? `<span class="alert-new-tag">New</span>` : ""}${itemIsUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}</div>${area ? `<div class="sidebar-alert-area">${area}</div>` : ""}${timeRange ? `<div class="sidebar-alert-expires">${timeRange}</div>` : ""}</div>`;

        item.addEventListener("click", () => {
          window.flyToAlert?.(feature);
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
  sidebarBtn?.addEventListener("click", () => {
    if (sidebar && sidebar.classList.contains("open")) renderSidebar();
  });
  setInterval(renderSidebar, 10000);

  document
    .getElementById("alerts-sidebar-search")
    ?.addEventListener("input", renderSidebar);
  setTimeout(renderSidebar, 3000);
});
