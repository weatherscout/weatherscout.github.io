document.addEventListener("DOMContentLoaded", () => {
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
  const motionVectorsBtn = document.getElementById(
    "motion-vectors-settings-btn",
  );
  const motionVectorsToggleUI = document.getElementById(
    "motion-vectors-settings-toggle-ui",
  );

  if (motionVectorsToggleUI) {
    motionVectorsToggleUI.classList.toggle(
      "active",
      window.motionVectorsEnabled,
    );
  }

  if (motionVectorsBtn) {
    motionVectorsBtn.addEventListener("click", () => {
      window.motionVectorsEnabled = !window.motionVectorsEnabled;
      motionVectorsToggleUI.classList.toggle(
        "active",
        window.motionVectorsEnabled,
      );
      if (window.updateMotionVectorsVisibility)
        window.updateMotionVectorsVisibility();
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(
        `Storm Vectors: ${window.motionVectorsEnabled ? "On" : "Off"}`,
      );
    });
  }
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
  const debugInput = document.getElementById("debug-file-input");

  const lockNorthToggleUI = document.getElementById(
    "settings-lock-north-toggle-ui",
  );
  const lockTiltToggleUI = document.getElementById(
    "settings-lock-tilt-toggle-ui",
  );
  const lockNorthBtn = document.getElementById("settings-lock-north-btn");
  const lockTiltBtn = document.getElementById("settings-lock-tilt-btn");

  if (window.saveSettingsEnabled && saveSettingsToggleUI)
    saveSettingsToggleUI.classList.add("active");
  if (window.debugModeEnabled && debugSettingsToggleUI)
    debugSettingsToggleUI.classList.add("active");
  if (window.selectOfflineSites && selectOfflineToggleUI)
    selectOfflineToggleUI.classList.add("active");
  if (window.showOfflineSites && showOfflineToggleUI)
    showOfflineToggleUI.classList.add("active");
  if (window.lockNorth && lockNorthToggleUI)
    lockNorthToggleUI.classList.add("active");
  if (window.lockTilt && lockTiltToggleUI)
    lockTiltToggleUI.classList.add("active");
  if (window.flyToRadarSetting && flySettingsToggleUI)
    flySettingsToggleUI.classList.add("active");
  if (window.zoneAlertsEnabled && zoneAlertsToggleUI)
    zoneAlertsToggleUI.classList.add("active");
  if (window.mesoDiscussionsEnabled && mesoDiscussionsToggleUI)
    mesoDiscussionsToggleUI.classList.add("active");
  if (window.fasterUpdatesEnabled && fasterUpdatesToggleUI)
    fasterUpdatesToggleUI.classList.add("active");

  if (saveSettingsBtn) {
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
        if (window.saveCurrentState) window.saveCurrentState();
        window.showToast("Settings Saved");
      }
    });
  }

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

  if (debugSettingsBtn) {
    debugSettingsBtn.addEventListener("click", () => {
      window.debugModeEnabled = !window.debugModeEnabled;
      debugSettingsToggleUI.classList.toggle("active");
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(`Debug Mode: ${window.debugModeEnabled ? "On" : "Off"}`);
    });
  }

  if (selectOfflineBtn) {
    selectOfflineBtn.addEventListener("click", () => {
      window.selectOfflineSites = !window.selectOfflineSites;
      selectOfflineToggleUI.classList.toggle(
        "active",
        window.selectOfflineSites,
      );
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(
        `Select Offline Sites: ${window.selectOfflineSites ? "On" : "Off"}`,
      );
    });
  }

  if (showOfflineBtn) {
    showOfflineBtn.addEventListener("click", () => {
      window.showOfflineSites = !window.showOfflineSites;
      showOfflineToggleUI.classList.toggle("active", window.showOfflineSites);
      if (window.updateShowSitesFilter) window.updateShowSitesFilter();
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(
        `Show Offline Sites: ${window.showOfflineSites ? "On" : "Off"}`,
      );
    });
  }

  if (lockNorthBtn) {
    lockNorthBtn.addEventListener("click", () => {
      window.lockNorth = !window.lockNorth;
      lockNorthToggleUI.classList.toggle("active", window.lockNorth);
      if (window.applyMapConstraints) window.applyMapConstraints();
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(`Lock North: ${window.lockNorth ? "On" : "Off"}`);
    });
  }

  if (lockTiltBtn) {
    lockTiltBtn.addEventListener("click", () => {
      window.lockTilt = !window.lockTilt;
      lockTiltToggleUI.classList.toggle("active", window.lockTilt);
      if (window.applyMapConstraints) window.applyMapConstraints();
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast(`Lock Tilt: ${window.lockTilt ? "On" : "Off"}`);
    });
  }

  if (flySettingsBtn) {
    flySettingsBtn.addEventListener("click", () => {
      window.flyToRadarSetting = !window.flyToRadarSetting;
      flySettingsToggleUI.classList.toggle("active");
      if (window.saveCurrentState) window.saveCurrentState();
    });
  }

  if (zoneAlertsBtn) {
    zoneAlertsBtn.addEventListener("click", () => {
      window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
      zoneAlertsToggleUI.classList.toggle("active");
      if (window.saveCurrentState) window.saveCurrentState();
      if (window.zoneAlertsEnabled) {
        window.showToast("Zone Alerts: On");
        if (window.map && window.map.getSource("alerts-poly-watch"))
          window.map
            .getSource("alerts-poly-watch")
            .setData({ type: "FeatureCollection", features: [] });
        window.globalPolyWatchAlerts = [];
        if (window.alertsEnabled && window.refreshNwsAlerts)
          window.refreshNwsAlerts(true);
      } else {
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
    });
  }

  if (mesoDiscussionsBtn) {
    mesoDiscussionsBtn.addEventListener("click", () => {
      window.mesoDiscussionsEnabled = !window.mesoDiscussionsEnabled;
      mesoDiscussionsToggleUI.classList.toggle("active");
      if (window.saveCurrentState) window.saveCurrentState();
      if (window.mesoDiscussionsEnabled) {
        window.showToast("Mesoscale Discussions: On");
        if (window.alertsEnabled && window.updatePlacefileAlerts)
          window.updatePlacefileAlerts(true);
      } else {
        window.showToast("Mesoscale Discussions: Off");
        if (window.map && window.map.getSource("alerts-md"))
          window.map
            .getSource("alerts-md")
            .setData({ type: "FeatureCollection", features: [] });
        window.globalMdAlerts = [];
        if (window.renderAlertsSidebar) window.renderAlertsSidebar();
      }
    });
  }

  if (fasterUpdatesBtn) {
    fasterUpdatesBtn.addEventListener("click", () => {
      window.fasterUpdatesEnabled = !window.fasterUpdatesEnabled;
      fasterUpdatesToggleUI.classList.toggle("active");
      if (window.saveCurrentState) window.saveCurrentState();
      if (window.startAlertIntervals) window.startAlertIntervals();
      window.showToast(
        `Faster Updates: ${window.fasterUpdatesEnabled ? "On" : "Off"}`,
      );
    });
  }

  const tzCustomInput = document.getElementById("tz-custom-input");
  const localBrowserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function updateTzSelector() {
    const isLocal = window.appTimeZone === localBrowserTz;
    const isUTC = window.appTimeZone === "UTC";
    const localOpt = document.querySelector('.tz-option[data-value="local"]');
    const utcOpt = document.querySelector('.tz-option[data-value="UTC"]');
    if (localOpt) localOpt.classList.toggle("selected", isLocal);
    if (utcOpt) utcOpt.classList.toggle("selected", isUTC && !isLocal);
    if (tzCustomInput)
      tzCustomInput.classList.toggle("active", !isLocal && !isUTC);
  }

  function updateDstSelector() {
    let fixed = false;
    if (window.isFixedOffset) fixed = window.isFixedOffset(window.appTimeZone);
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
    let utcZero = false;
    if (window.isUTCZero) utcZero = window.isUTCZero(window.appTimeZone);
    if (utcZero && window.appHourMode !== "auto") {
      window.appHourMode = "auto";
      if (window.saveCurrentState) window.saveCurrentState();
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
    tzCustomInput &&
    window.tzToDisplay
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
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast("Time Zone: " + btn.textContent.trim());
    });
  });

  if (tzCustomInput) {
    tzCustomInput.addEventListener("focus", () =>
      tzCustomInput.classList.remove("invalid"),
    );
    tzCustomInput.addEventListener("input", () => {
      let resolved = null;
      if (window.resolveCustomInput)
        resolved = window.resolveCustomInput(tzCustomInput.value);
      const hasVal = tzCustomInput.value.trim() !== "";
      tzCustomInput.classList.toggle("invalid", hasVal && !resolved);
    });
    tzCustomInput.addEventListener("change", () => {
      let resolved = null;
      if (window.resolveCustomInput)
        resolved = window.resolveCustomInput(tzCustomInput.value);
      if (resolved) {
        window.appTimeZone = resolved;
        tzCustomInput.classList.remove("invalid");
        updateTzSelector();
        updateDstSelector();
        updateHourSelector();
        if (window.saveCurrentState) window.saveCurrentState();
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
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast("Time Mode: " + btn.textContent.trim());
    });
  });

  document.querySelectorAll(".hour-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      window.appHourMode = btn.dataset.value;
      updateHourSelector();
      if (window.saveCurrentState) window.saveCurrentState();
      window.showToast("Hour Format: " + btn.textContent.trim());
    });
  });

  const loopCustomInput = document.getElementById("loop-time-custom-input");
  function updateLoopTimeUI() {
    const mins = window.radarLoopMinutes || 30;
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
      if (window.saveCurrentState) window.saveCurrentState();
    });
  });

  document.querySelectorAll(".show-sites-option").forEach((option) => {
    option.addEventListener("click", () => {
      window.showSitesMode = option.dataset.value;
      window.showToast(`Show Sites: ${window.showSitesMode}`);
      if (window.updateShowSitesFilter) window.updateShowSitesFilter();
      if (window.saveCurrentState) window.saveCurrentState();
    });
  });

  const hiddenCountEl = document.getElementById("hidden-alert-types-count");
  if (hiddenCountEl && window.hiddenAlertTypes.size > 0) {
    hiddenCountEl.textContent = window.hiddenAlertTypes.size;
  }

  window.updateAlertSoundsCountLabel = function () {
    const countEl = document.getElementById("alert-sounds-count");
    const internalLabel = document.getElementById("alert-sounds-count-label");
    const activeCount = window.alertSoundsMap
      ? Object.values(window.alertSoundsMap).filter((v) => v !== "none").length
      : 0;
    if (countEl) countEl.textContent = activeCount > 0 ? activeCount : "";
    if (internalLabel) {
      internalLabel.textContent =
        activeCount === 0
          ? "No alerts with sounds"
          : `${activeCount} alert${activeCount >= 2 ? "s" : ""} with sounds`;
    }
  };
  window.updateAlertSoundsCountLabel();

  window.openSettings = function (isBack = false) {
    if (!isBack) window.menuHistory = [];
    if (window.closeAllMenus) window.closeAllMenus();
    const settingsPopup = document.getElementById("settings-popup");
    const fabSettings = document.getElementById("fab-settings");
    if (settingsPopup) {
      settingsPopup.classList.add("open");
      settingsPopup.querySelector(".settings-body").scrollTop = 0;
    }
    if (fabSettings) fabSettings.classList.add("active");
  };

  window.closeSettings = function () {
    const settingsPopup = document.getElementById("settings-popup");
    const fabSettings = document.getElementById("fab-settings");
    if (settingsPopup) settingsPopup.classList.remove("open");
    if (fabSettings) fabSettings.classList.remove("active");
  };

  const settingsCloseBtn = document.getElementById("settings-close-btn");
  if (settingsCloseBtn)
    settingsCloseBtn.addEventListener("click", window.closeSettings);

  const setOpenAlertsBtn = document.getElementById("settings-open-alerts-btn");
  if (setOpenAlertsBtn)
    setOpenAlertsBtn.addEventListener("click", () =>
      window.openAlertSettings(),
    );

  const setOpenRadarBtn = document.getElementById("settings-open-radar-btn");
  if (setOpenRadarBtn)
    setOpenRadarBtn.addEventListener("click", () =>
      window.openRadarSettingsFrom("settings"),
    );

  const alertSettingsPopup = document.getElementById("alert-settings-popup");
  const alertSettingsCloseBtn = document.getElementById(
    "alert-settings-close-btn",
  );

  window.openAlertSettings = function (isBack = false) {
    if (!isBack && window.getCurrentOpenMenu) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    if (window.closeAllMenus) window.closeAllMenus();
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

  const alertSettBack = document.getElementById("alert-settings-back-btn");
  if (alertSettBack) alertSettBack.addEventListener("click", window.goBack);

  const radarSettingsPopup = document.getElementById("radar-settings-popup");
  window.openRadarSettingsFrom = function (opener, isBack = false) {
    if (!isBack && window.getCurrentOpenMenu) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    if (window.closeAllMenus) window.closeAllMenus();
    if (radarSettingsPopup) radarSettingsPopup.classList.add("open");
  };

  window.closeRadarSettings = function () {
    if (radarSettingsPopup) radarSettingsPopup.classList.remove("open");
  };

  const rSettClose = document.getElementById("radar-settings-close-btn");
  if (rSettClose)
    rSettClose.addEventListener("click", window.closeRadarSettings);
  const rSettBack = document.getElementById("radar-settings-back-btn");
  if (rSettBack) rSettBack.addEventListener("click", window.goBack);

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
      if (n === 0) {
        hiddenAlertsCountLabel.style.width = "100%";
        hiddenAlertsCountLabel.style.textAlign = "center";
        if (hiddenAlertsResetBtn) hiddenAlertsResetBtn.style.display = "none";
      } else {
        hiddenAlertsCountLabel.style.width = "";
        hiddenAlertsCountLabel.style.textAlign = "";
        if (hiddenAlertsResetBtn) hiddenAlertsResetBtn.style.display = "block";
      }
    }
  }

  function renderHiddenAlertsList(filter) {
    if (!hiddenAlertsListEl || !window.alertColorMap) return;
    const query = (filter || "").toLowerCase();
    const allTypes = Object.keys(window.alertColorMap);
    const sorted = allTypes.slice().sort((a, b) => {
      const aHidden = window.hiddenAlertTypes.has(a) ? 1 : 0;
      const bHidden = window.hiddenAlertTypes.has(b) ? 1 : 0;
      if (aHidden !== bHidden) return aHidden - bHidden;
      let scoreA = 0,
        scoreB = 0;
      if (window.getAlertPriorityScore) {
        scoreA = window.getAlertPriorityScore({
          properties: { event: a, parameters: {} },
        });
        scoreB = window.getAlertPriorityScore({
          properties: { event: b, parameters: {} },
        });
      }
      return scoreA - scoreB;
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
          if (window.applyMapAlertFilters) window.applyMapAlertFilters();
          if (window.saveCurrentState) window.saveCurrentState();
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
    if (!isBack && window.getCurrentOpenMenu) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    if (window.closeAllMenus) window.closeAllMenus();
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
      if (window.applyMapAlertFilters) window.applyMapAlertFilters();
      if (window.saveCurrentState) window.saveCurrentState();
      renderHiddenAlertsList(
        hiddenAlertsSearch ? hiddenAlertsSearch.value : "",
      );
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
    if (!alertSoundsListEl || !window.alertColorMap) return;
    const query = (filter || "").toLowerCase();
    const allTypes = Object.keys(window.alertColorMap);
    const sorted = allTypes.slice().sort((a, b) => {
      const aHasSound =
        window.alertSoundsMap[a] && window.alertSoundsMap[a] !== "none" ? 0 : 1;
      const bHasSound =
        window.alertSoundsMap[b] && window.alertSoundsMap[b] !== "none" ? 0 : 1;
      if (aHasSound !== bHasSound) return aHasSound - bHasSound;
      let scoreA = 0,
        scoreB = 0;
      if (window.getAlertPriorityScore) {
        scoreA = window.getAlertPriorityScore({
          properties: { event: a, parameters: {} },
        });
        scoreB = window.getAlertPriorityScore({
          properties: { event: b, parameters: {} },
        });
      }
      return scoreA - scoreB;
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
        let optionsHtml = window.AUDIO_OPTIONS
          ? window.AUDIO_OPTIONS.map(
              (opt) =>
                `<option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>${opt.label}</option>`,
            ).join("")
          : "";
        row.innerHTML = `<span class="alert-sound-label">${eventType}</span><select class="alert-sound-select">${optionsHtml}</select>`;
        row.querySelector("select").addEventListener("change", (e) => {
          const val = e.target.value;
          if (val === "none") {
            delete window.alertSoundsMap[eventType];
          } else {
            window.alertSoundsMap[eventType] = val;
            if (window.playAlertSound) window.playAlertSound(val, eventType);
          }
          if (window.saveCurrentState) window.saveCurrentState();
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
    if (!isBack && window.getCurrentOpenMenu) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
    if (window.closeAllMenus) window.closeAllMenus();
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
      if (window.saveCurrentState) window.saveCurrentState();
      renderAlertSoundsList(alertSoundsSearch ? alertSoundsSearch.value : "");
      window.showToast("Alert sounds reset to None");
    });
  }

  const alertSoundsTrigger = document.getElementById("alert-sounds-btn");
  if (alertSoundsTrigger)
    alertSoundsTrigger.addEventListener("click", () =>
      window.openAlertSoundsPanel(),
    );

  window.handleDebugUpload = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.features) throw new Error();
        if (window.knownAlertIds) window.knownAlertIds.clear();
        if (window.newAlertIds) window.newAlertIds.clear();
        if (window.updatedAlertIds) window.updatedAlertIds.clear();
        window.isInitialLoad = false;
        if (window.processRawAlertFeatures) {
          await window.processRawAlertFeatures(data.features, "polygon", false);
          await window.processRawAlertFeatures(data.features, "zone", false);
        }
        if (window.displayNextAlert) window.displayNextAlert();
      } catch (err) {
        alert("Error parsing GeoJSON.");
      }
    };
    reader.readAsText(file);
  };

  if (debugInput)
    debugInput.addEventListener("change", window.handleDebugUpload);

  const pillInfoBtn = document.getElementById("pill-info-btn");
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
      if (window.toggleRadarProduct)
        window.toggleRadarProduct(window.activeSiteIdForData, next);
    });
  }

  const attributionBubble = document.getElementById("attribution-bubble");
  if (attributionBubble) {
    attributionBubble.addEventListener("click", (event) => {
      event.stopPropagation();
      attributionBubble.classList.toggle("expanded");
    });
  }

  const fullAlertPopup = document.createElement("div");
  fullAlertPopup.id = "full-alert-text-popup";
  fullAlertPopup.className = "standard-glass";
  fullAlertPopup.innerHTML = `<div id="full-alert-text-popup-header"><div id="full-alert-text-popup-title"><i class="material-symbols-rounded">warning</i><span id="full-alert-text-popup-title-text"></span></div><div style="display:flex;gap:6px;align-items:center;"><button class="settings-close-btn" id="full-alert-text-popup-open-external" aria-label="Open Link" style="display:none;"><i class="material-symbols-rounded">open_in_new</i></button><button class="settings-close-btn" id="full-alert-text-popup-copy" aria-label="Copy"><i class="material-symbols-rounded">content_copy</i></button><button class="settings-close-btn" id="full-alert-text-popup-close" aria-label="Close"><i class="material-symbols-rounded">close</i></button></div></div><div id="full-alert-text-popup-body"><div id="full-alert-text-content"></div></div>`;
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

  window.showFullAlertTextPopup = async function (f) {
    const props = f.properties;
    const params = props.parameters || {};
    const popup = document.getElementById("full-alert-text-popup");
    const titleEl = document.getElementById("full-alert-text-popup-title-text");
    const contentEl = document.getElementById("full-alert-text-content");
    const headerEl = document.getElementById("full-alert-text-popup-header");

    if (window.closeAllMenus) window.closeAllMenus();

    let sentD = null,
      effectiveD = null,
      onsetD = null,
      expireD = null,
      endsD = null;

    if (window.parseApiDate) {
      sentD = props.sent ? window.parseApiDate(props.sent) : null;
      effectiveD = props.effective
        ? window.parseApiDate(props.effective)
        : null;
      onsetD = props.onset ? window.parseApiDate(props.onset) : null;
      expireD = props.expires ? window.parseApiDate(props.expires) : null;
      endsD = props.ends ? window.parseApiDate(props.ends) : null;
    }

    const sentTime = sentD && !isNaN(sentD.getTime()) ? sentD.getTime() : null;
    const effectiveTime =
      effectiveD && !isNaN(effectiveD.getTime()) ? effectiveD.getTime() : null;
    const onsetTime =
      onsetD && !isNaN(onsetD.getTime()) ? onsetD.getTime() : null;
    const expiresTime =
      expireD && !isNaN(expireD.getTime()) ? expireD.getTime() : null;
    const endsTime = endsD && !isNaN(endsD.getTime()) ? endsD.getTime() : null;

    const showSent = sentTime !== null;
    const showEffective =
      effectiveTime !== null &&
      effectiveTime !== sentTime &&
      effectiveTime !== onsetTime;
    const showOnset = onsetTime !== null && onsetTime !== sentTime;
    const showExpires = expiresTime !== null;
    const showEnds = endsTime !== null && endsTime !== expiresTime;

    const effTz = window.getEffectiveTz ? window.getEffectiveTz() : "local";

    const sentStr =
      showSent && window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>Sent:</strong> ${window.formatDateFull(sentD, effTz)}</div>`
        : "";
    const effectiveStr =
      showEffective && window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>Effective:</strong> ${window.formatDateFull(effectiveD, effTz)}</div>`
        : "";
    const onsetStr =
      showOnset && window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>Onset:</strong> ${window.formatDateFull(onsetD, effTz)}</div>`
        : "";
    const expiresStr =
      showExpires && window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>Expires:</strong> ${window.formatDateFull(expireD, effTz)}</div>`
        : "";
    const endsStr =
      showEnds && window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>Ends:</strong> ${window.formatDateFull(endsD, effTz)}</div>`
        : "";
    const areaStr = props.areaDesc
      ? `<div class="full-alert-meta-row"><strong>Affected:</strong> ${props.areaDesc}</div>`
      : "";

    const metaHTML = `${sentStr}${effectiveStr}${onsetStr}${expiresStr}${endsStr}${areaStr}<div class="full-alert-section-label" style="padding-top:10px;">Description</div>`;

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

    const isConvectiveWatch =
      props.event === "Tornado Watch" ||
      props.event === "Severe Thunderstorm Watch";

    let watchNumber = null;
    if (isConvectiveWatch && params.VTEC && params.VTEC[0]) {
      const vtecParts = params.VTEC[0].split(".");
      if (vtecParts.length >= 6) watchNumber = vtecParts[5];
    }

    const extBtn = document.getElementById(
      "full-alert-text-popup-open-external",
    );
    let targetUrl = null;
    if (props.id && (props.id.startsWith("md") || props.id.startsWith("ww"))) {
      targetUrl = props.url;
    } else if (watchNumber) {
      targetUrl = `https://www.spc.noaa.gov/products/watch/ww${watchNumber}.html`;
    }

    if (targetUrl) {
      extBtn.style.display = "flex";
      extBtn.onclick = () => window.open(targetUrl, "_blank");
    } else {
      extBtn.style.display = "none";
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
        const text = window.fetchMdWatchText
          ? await window.fetchMdWatchText(props.id, validatedUrl, false)
          : "";
        if (contentEl && window.formatNwsText)
          contentEl.innerHTML = `${metaHTML}<p>${window.formatNwsText(text)}</p>`;
      } catch (e) {
        if (contentEl)
          contentEl.innerHTML = `${metaHTML}<p>Failed to load text.</p><p><a href="${validatedUrl}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
      }
      return;
    }

    const formattedD = window.formatNwsText
      ? window.formatNwsText(props.description)
      : props.description;
    const formattedI =
      window.formatNwsText && props.instruction
        ? window.formatNwsText(props.instruction)
        : props.instruction;

    if (titleEl) titleEl.textContent = props.specificEventName || props.event;
    if (contentEl)
      contentEl.innerHTML = `${metaHTML}<div id="alert-description-container"><p>${watchNumber ? "Loading..." : formattedD}</p></div>${props.instruction ? `<div class="full-alert-section-label">Instructions</div><p>${formattedI}</p>` : ""}`;
    if (popup) popup.classList.add("open");
    const body = document.getElementById("full-alert-text-popup-body");
    if (body) body.scrollTop = 0;

    if (watchNumber && window.fetchMdWatchText) {
      try {
        const url = `https://www.spc.noaa.gov/products/watch/ww${watchNumber}.html`;
        const text = await window.fetchMdWatchText(
          `ww${watchNumber}`,
          url,
          false,
        );
        const descContainer = document.getElementById(
          "alert-description-container",
        );
        if (text && descContainer && window.formatNwsText)
          descContainer.innerHTML = `<p>${window.formatNwsText(text)}</p>`;
        else if (descContainer)
          descContainer.innerHTML = `<p>${formattedD}</p>`;
      } catch (e) {
        const descContainer = document.getElementById(
          "alert-description-container",
        );
        if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
      }
    }
  };
});
