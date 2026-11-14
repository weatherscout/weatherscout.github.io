document.addEventListener("DOMContentLoaded", () => {
  function bindBooleanSetting({
    btnId,
    toggleId,
    get,
    set,
    toastLabel,
    onChange,
  }) {
    const btn = document.getElementById(btnId);
    const toggleUI = document.getElementById(toggleId);
    if (toggleUI) toggleUI.classList.toggle("active", Boolean(get()));
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = !get();
      set(next);
      if (toggleUI) toggleUI.classList.toggle("active", next);
      onChange?.(next);
      window.saveCurrentState?.();
      if (toastLabel) {
        window.showToast(`${toastLabel}: ${next ? "On" : "Off"}`);
      }
    });
  }

  function pushMenuHistory(isBack) {
    if (!isBack && window.getCurrentOpenMenu) {
      const curr = window.getCurrentOpenMenu();
      if (curr) window.menuHistory.push(curr);
    }
  }

  function applySelectorState(selector, activeValue, disableForced) {
    document.querySelectorAll(selector).forEach((btn) => {
      const forcedOption = btn.dataset.value !== "auto";
      const isDisabled = disableForced && forcedOption;
      btn.classList.toggle("selected", btn.dataset.value === activeValue);
      btn.disabled = isDisabled;
      btn.style.opacity = isDisabled ? "0.3" : "";
      btn.style.cursor = isDisabled ? "default" : "";
      btn.style.pointerEvents = isDisabled ? "none" : "";
    });
  }

  const saveSettingsBtn = document.getElementById("save-settings-btn");
  const saveSettingsToggleUI = document.getElementById(
    "save-settings-toggle-ui",
  );
  const resetAppBtn = document.getElementById("reset-app-settings-btn");

  if (window.saveSettingsEnabled && saveSettingsToggleUI) {
    saveSettingsToggleUI.classList.add("active");
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
      if (saveSettingsToggleUI.classList.contains("active")) {
        saveSettingsToggleUI.classList.remove("active");
        window.resetAppData(null);
      } else {
        saveSettingsToggleUI.classList.add("active");
        localStorage.setItem("saveSettings", "true");
        window.saveCurrentState?.();
        window.showToast("Settings Saved");
      }
    });
  }

  if (resetAppBtn) {
    resetAppBtn.addEventListener("click", () => {
      window.resetAppData("App Reset");
    });
  }

  bindBooleanSetting({
    btnId: "motion-vectors-settings-btn",
    toggleId: "motion-vectors-settings-toggle-ui",
    get: () => window.motionVectorsEnabled,
    set: (v) => (window.motionVectorsEnabled = v),
    toastLabel: "Storm Vectors",
    onChange: () => window.updateMotionVectorsVisibility?.(),
  });

  bindBooleanSetting({
    btnId: "debug-settings-btn",
    toggleId: "debug-settings-toggle-ui",
    get: () => window.debugModeEnabled,
    set: (v) => (window.debugModeEnabled = v),
    toastLabel: "Debug Mode",
  });

  bindBooleanSetting({
    btnId: "select-offline-toggle-btn",
    toggleId: "select-offline-toggle-ui",
    get: () => window.selectOfflineSites,
    set: (v) => (window.selectOfflineSites = v),
    toastLabel: "Select Offline Sites",
  });

  bindBooleanSetting({
    btnId: "show-offline-toggle-btn",
    toggleId: "show-offline-toggle-ui",
    get: () => window.showOfflineSites,
    set: (v) => (window.showOfflineSites = v),
    toastLabel: "Show Offline Sites",
    onChange: () => window.updateShowSitesFilter?.(),
  });

  bindBooleanSetting({
    btnId: "settings-lock-north-btn",
    toggleId: "settings-lock-north-toggle-ui",
    get: () => window.lockNorth,
    set: (v) => (window.lockNorth = v),
    toastLabel: "Lock North",
    onChange: () => window.applyMapConstraints?.(),
  });

  bindBooleanSetting({
    btnId: "settings-lock-tilt-btn",
    toggleId: "settings-lock-tilt-toggle-ui",
    get: () => window.lockTilt,
    set: (v) => (window.lockTilt = v),
    toastLabel: "Lock Tilt",
    onChange: () => window.applyMapConstraints?.(),
  });

  bindBooleanSetting({
    btnId: "fly-settings-btn",
    toggleId: "fly-settings-toggle-ui",
    get: () => window.flyToRadarSetting,
    set: (v) => (window.flyToRadarSetting = v),
    toastLabel: null,
  });

  bindBooleanSetting({
    btnId: "faster-updates-settings-btn",
    toggleId: "faster-updates-settings-toggle-ui",
    get: () => window.fasterUpdatesEnabled,
    set: (v) => (window.fasterUpdatesEnabled = v),
    toastLabel: "Faster Updates",
    onChange: () => window.startAlertIntervals?.(),
  });

  const stormReportsBtn = document.getElementById("settings-storm-reports-btn");
  const stormReportsToggleUI = document.getElementById(
    "settings-storm-reports-toggle-ui",
  );
  if (stormReportsToggleUI) {
    stormReportsToggleUI.classList.toggle("active", window.stormReportsEnabled);
  }
  if (stormReportsBtn) {
    stormReportsBtn.addEventListener("click", () => {
      window.toggleStormReports?.();
      if (stormReportsToggleUI) {
        stormReportsToggleUI.classList.toggle(
          "active",
          window.stormReportsEnabled,
        );
      }
    });
  }

  const zoneAlertsBtn = document.getElementById("zone-alerts-settings-btn");
  const zoneAlertsToggleUI = document.getElementById(
    "zone-alerts-settings-toggle-ui",
  );
  if (zoneAlertsToggleUI && window.zoneAlertsEnabled) {
    zoneAlertsToggleUI.classList.add("active");
  }
  if (zoneAlertsBtn) {
    zoneAlertsBtn.addEventListener("click", () => {
      window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
      zoneAlertsToggleUI.classList.toggle("active");
      window.saveCurrentState?.();
      if (window.zoneAlertsEnabled) {
        window.showToast("Zone Alerts: On");
        window.map
          ?.getSource("alerts-poly-watch")
          ?.setData({ type: "FeatureCollection", features: [] });
        window.globalPolyWatchAlerts = [];
        if (window.alertsEnabled) window.refreshNwsAlerts?.(true);
      } else {
        window.showToast("Zone Alerts: Off");
        window.map
          ?.getSource("alerts-zone")
          ?.setData({ type: "FeatureCollection", features: [] });
        window.globalZoneAlerts = [];
        if (window.alertsEnabled) {
          window.refreshNwsAlerts?.(true);
          window.updatePlacefileAlerts?.(true);
        }
      }
    });
  }

  const mesoDiscussionsBtn = document.getElementById(
    "meso-discussions-settings-btn",
  );
  const mesoDiscussionsToggleUI = document.getElementById(
    "meso-discussions-settings-toggle-ui",
  );
  if (mesoDiscussionsToggleUI && window.mesoDiscussionsEnabled) {
    mesoDiscussionsToggleUI.classList.add("active");
  }
  if (mesoDiscussionsBtn) {
    mesoDiscussionsBtn.addEventListener("click", () => {
      window.mesoDiscussionsEnabled = !window.mesoDiscussionsEnabled;
      mesoDiscussionsToggleUI.classList.toggle("active");
      window.saveCurrentState?.();
      if (window.mesoDiscussionsEnabled) {
        window.showToast("Mesoscale Discussions: On");
        if (window.alertsEnabled) window.updatePlacefileAlerts?.(true);
      } else {
        window.showToast("Mesoscale Discussions: Off");
        window.map
          ?.getSource("alerts-md")
          ?.setData({ type: "FeatureCollection", features: [] });
        window.globalMdAlerts = [];
        window.renderAlertsSidebar?.();
      }
    });
  }

  const tzCustomInput = document.getElementById("tz-custom-input");
  const localBrowserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function updateTzSelector() {
    const isLocal = window.appTimeZone === localBrowserTz;
    const isUTC = window.appTimeZone === "UTC";
    document
      .querySelector('.tz-option[data-value="local"]')
      ?.classList.toggle("selected", isLocal);
    document
      .querySelector('.tz-option[data-value="UTC"]')
      ?.classList.toggle("selected", isUTC && !isLocal);
    tzCustomInput?.classList.toggle("active", !isLocal && !isUTC);
  }

  function updateDstSelector() {
    const fixed = window.isFixedOffset
      ? window.isFixedOffset(window.appTimeZone)
      : false;
    if (fixed && window.appDstMode !== "auto") window.appDstMode = "auto";
    applySelectorState(".dst-option", window.appDstMode, fixed);
  }

  function updateHourSelector() {
    const utcZero = window.isUTCZero
      ? window.isUTCZero(window.appTimeZone)
      : false;
    if (utcZero && window.appHourMode !== "auto") {
      window.appHourMode = "auto";
      window.saveCurrentState?.();
    }
    applySelectorState(".hour-option", window.appHourMode, utcZero);
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
      window.saveCurrentState?.();
      window.showToast("Time Zone: " + btn.textContent.trim());
    });
  });

  if (tzCustomInput) {
    tzCustomInput.addEventListener("focus", () =>
      tzCustomInput.classList.remove("invalid"),
    );
    tzCustomInput.addEventListener("input", () => {
      const resolved = window.resolveCustomInput?.(tzCustomInput.value);
      const hasVal = tzCustomInput.value.trim() !== "";
      tzCustomInput.classList.toggle("invalid", hasVal && !resolved);
    });
    tzCustomInput.addEventListener("change", () => {
      const resolved = window.resolveCustomInput?.(tzCustomInput.value);
      if (resolved) {
        window.appTimeZone = resolved;
        tzCustomInput.classList.remove("invalid");
        updateTzSelector();
        updateDstSelector();
        updateHourSelector();
        window.saveCurrentState?.();
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
      window.saveCurrentState?.();
      window.showToast("Time Mode: " + btn.textContent.trim());
    });
  });

  document.querySelectorAll(".hour-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      window.appHourMode = btn.dataset.value;
      updateHourSelector();
      window.saveCurrentState?.();
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
        isPreset && parseInt(btn.dataset.value, 10) === mins,
      );
    });
    if (loopCustomInput) {
      loopCustomInput.classList.toggle("active", !isPreset);
      loopCustomInput.value = !isPreset ? `${mins} min` : "";
    }
  }

  document.querySelectorAll(".loop-time-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.value, 10);
      window.setRadarLoopMinutes?.(val);
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
      const val = parseInt(loopCustomInput.value, 10);
      const hasVal = loopCustomInput.value.trim() !== "";
      loopCustomInput.classList.toggle(
        "invalid",
        hasVal && (isNaN(val) || val < 5 || val > 120),
      );
    });
    loopCustomInput.addEventListener("change", () => {
      const raw = parseInt(loopCustomInput.value.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(raw) && raw >= 5 && raw <= 120) {
        const snapped = Math.round(raw / 5) * 5;
        loopCustomInput.classList.remove("invalid");
        document
          .querySelectorAll(".loop-time-option")
          .forEach((b) => b.classList.remove("selected"));
        loopCustomInput.classList.add("active");
        loopCustomInput.value = `${snapped} min`;
        window.setRadarLoopMinutes?.(snapped);
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
      window.saveCurrentState?.();
    });
  });

  document.querySelectorAll(".show-sites-option").forEach((option) => {
    option.addEventListener("click", () => {
      window.showSitesMode = option.dataset.value;
      window.showToast(`Show Sites: ${window.showSitesMode}`);
      window.updateShowSitesFilter?.();
      window.saveCurrentState?.();
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
    window.closeAllMenus?.();
    const settingsPopup = document.getElementById("settings-popup");
    const fabSettings = document.getElementById("fab-settings");
    if (settingsPopup) {
      settingsPopup.classList.add("open");
      settingsPopup.querySelector(".settings-body").scrollTop = 0;
    }
    if (fabSettings) fabSettings.classList.add("active");
  };

  window.closeSettings = function () {
    document.getElementById("settings-popup")?.classList.remove("open");
    document.getElementById("fab-settings")?.classList.remove("active");
  };

  document
    .getElementById("settings-close-btn")
    ?.addEventListener("click", window.closeSettings);
  document
    .getElementById("settings-open-alerts-btn")
    ?.addEventListener("click", () => window.openAlertSettings());
  document
    .getElementById("settings-open-radar-btn")
    ?.addEventListener("click", () => window.openRadarSettingsFrom("settings"));

  const alertSettingsPopup = document.getElementById("alert-settings-popup");

  window.openAlertSettings = function (isBack = false) {
    pushMenuHistory(isBack);
    window.closeAllMenus?.();
    if (alertSettingsPopup) {
      alertSettingsPopup.classList.add("open");
      alertSettingsPopup.querySelector(".settings-body").scrollTop = 0;
    }
  };

  window.closeAlertSettings = function () {
    alertSettingsPopup?.classList.remove("open");
  };

  document
    .getElementById("alert-settings-close-btn")
    ?.addEventListener("click", window.closeAlertSettings);
  document
    .getElementById("alert-settings-back-btn")
    ?.addEventListener("click", window.goBack);

  const radarSettingsPopup = document.getElementById("radar-settings-popup");
  window.openRadarSettingsFrom = function (opener, isBack = false) {
    pushMenuHistory(isBack);
    window.closeAllMenus?.();
    radarSettingsPopup?.classList.add("open");
  };

  window.closeRadarSettings = function () {
    radarSettingsPopup?.classList.remove("open");
  };

  document
    .getElementById("radar-settings-close-btn")
    ?.addEventListener("click", window.closeRadarSettings);
  document
    .getElementById("radar-settings-back-btn")
    ?.addEventListener("click", window.goBack);

  const hiddenAlertsPanel = document.getElementById("hidden-alerts-panel");
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
    if (!hiddenAlertsCountLabel) return;
    hiddenAlertsCountLabel.textContent =
      n === 0 ? "No alerts hidden" : `${n} alert${n >= 2 ? "s" : ""} hidden`;
    hiddenAlertsCountLabel.style.width = n === 0 ? "100%" : "";
    hiddenAlertsCountLabel.style.textAlign = n === 0 ? "center" : "";
    if (hiddenAlertsResetBtn) {
      hiddenAlertsResetBtn.style.display = n === 0 ? "none" : "block";
    }
  }

  function renderHiddenAlertsList(filter) {
    if (!hiddenAlertsListEl || !window.alertColorMap) return;
    const query = (filter || "").toLowerCase();
    const sorted = Object.keys(window.alertColorMap).sort((a, b) => {
      const aHidden = window.hiddenAlertTypes.has(a) ? 1 : 0;
      const bHidden = window.hiddenAlertTypes.has(b) ? 1 : 0;
      if (aHidden !== bHidden) return aHidden - bHidden;
      const scoreA = window.getAlertPriorityScore
        ? window.getAlertPriorityScore({
            properties: { event: a, parameters: {} },
          })
        : 0;
      const scoreB = window.getAlertPriorityScore
        ? window.getAlertPriorityScore({
            properties: { event: b, parameters: {} },
          })
        : 0;
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
          if (window.hiddenAlertTypes.has(eventType)) {
            window.hiddenAlertTypes.delete(eventType);
          } else {
            window.hiddenAlertTypes.add(eventType);
          }
          window.applyMapAlertFilters?.();
          window.saveCurrentState?.();
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
    pushMenuHistory(isBack);
    window.closeAllMenus?.();
    if (hiddenAlertsSearch) hiddenAlertsSearch.value = "";
    renderHiddenAlertsList("");
    if (hiddenAlertsPanel) {
      hiddenAlertsPanel.classList.add("open");
      const lst = document.getElementById("hidden-alerts-list");
      if (lst) lst.scrollTop = 0;
    }
  };

  window.closeHiddenAlertsPanel = function () {
    hiddenAlertsPanel?.classList.remove("open");
  };

  document
    .getElementById("hidden-alerts-back-btn")
    ?.addEventListener("click", window.goBack);
  document
    .getElementById("hidden-alerts-close-btn")
    ?.addEventListener("click", window.closeHiddenAlertsPanel);
  hiddenAlertsSearch?.addEventListener("input", () =>
    renderHiddenAlertsList(hiddenAlertsSearch.value),
  );
  hiddenAlertsResetBtn?.addEventListener("click", () => {
    window.hiddenAlertTypes.clear();
    window.applyMapAlertFilters?.();
    window.saveCurrentState?.();
    renderHiddenAlertsList(hiddenAlertsSearch ? hiddenAlertsSearch.value : "");
    window.showToast("All alert types visible");
  });
  document
    .getElementById("hidden-alert-types-btn")
    ?.addEventListener("click", () => window.openHiddenAlertsPanel());

  const alertSoundsPanel = document.getElementById("alert-sounds-panel");
  const alertSoundsSearch = document.getElementById("alert-sounds-search");
  const alertSoundsListEl = document.getElementById("alert-sounds-list");

  function renderAlertSoundsList(filter) {
    if (!alertSoundsListEl || !window.alertColorMap) return;
    const query = (filter || "").toLowerCase();
    const sorted = Object.keys(window.alertColorMap).sort((a, b) => {
      const aHasSound =
        window.alertSoundsMap[a] && window.alertSoundsMap[a] !== "none" ? 0 : 1;
      const bHasSound =
        window.alertSoundsMap[b] && window.alertSoundsMap[b] !== "none" ? 0 : 1;
      if (aHasSound !== bHasSound) return aHasSound - bHasSound;
      const scoreA = window.getAlertPriorityScore
        ? window.getAlertPriorityScore({
            properties: { event: a, parameters: {} },
          })
        : 0;
      const scoreB = window.getAlertPriorityScore
        ? window.getAlertPriorityScore({
            properties: { event: b, parameters: {} },
          })
        : 0;
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
        const optionsHtml = window.AUDIO_OPTIONS
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
            window.playAlertSound?.(val, eventType);
          }
          window.saveCurrentState?.();
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
    pushMenuHistory(isBack);
    window.closeAllMenus?.();
    if (alertSoundsSearch) alertSoundsSearch.value = "";
    renderAlertSoundsList("");
    if (alertSoundsPanel) {
      alertSoundsPanel.classList.add("open");
      const lst = document.getElementById("alert-sounds-list");
      if (lst) lst.scrollTop = 0;
    }
  };

  window.closeAlertSoundsPanel = function () {
    alertSoundsPanel?.classList.remove("open");
  };

  document
    .getElementById("alert-sounds-back-btn")
    ?.addEventListener("click", window.goBack);
  document
    .getElementById("alert-sounds-close-btn")
    ?.addEventListener("click", window.closeAlertSoundsPanel);
  alertSoundsSearch?.addEventListener("input", () =>
    renderAlertSoundsList(alertSoundsSearch.value),
  );
  document
    .getElementById("alert-sounds-reset-btn")
    ?.addEventListener("click", () => {
      window.alertSoundsMap = {};
      window.saveCurrentState?.();
      renderAlertSoundsList(alertSoundsSearch ? alertSoundsSearch.value : "");
      window.showToast("Alert sounds reset to None");
    });
  document
    .getElementById("alert-sounds-btn")
    ?.addEventListener("click", () => window.openAlertSoundsPanel());

  window.handleDebugUpload = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.features) throw new Error();
        window.knownAlertIds?.clear();
        window.newAlertIds?.clear();
        window.updatedAlertIds?.clear();
        window.isInitialLoad = false;
        if (window.processRawAlertFeatures) {
          await window.processRawAlertFeatures(data.features, "polygon", false);
          await window.processRawAlertFeatures(data.features, "zone", false);
        }
        window.displayNextAlert?.();
      } catch (err) {
        alert("Error parsing GeoJSON.");
      }
    };
    reader.readAsText(file);
  };

  document
    .getElementById("debug-file-input")
    ?.addEventListener("change", window.handleDebugUpload);

  document.getElementById("pill-info-btn")?.addEventListener("click", () => {
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
    window.toggleRadarProduct?.(window.activeSiteIdForData, next);
  });

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

      navigator.clipboard
        .writeText(`${titleContent}\n\n${bodyContent}`)
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

    window.closeAllMenus?.();

    const parseTime = (val) => {
      if (!val || !window.parseApiDate) return null;
      const d = window.parseApiDate(val);
      return d && !isNaN(d.getTime()) ? d : null;
    };

    const sentD = parseTime(props.sent);
    const effectiveD = parseTime(props.effective);
    const onsetD = parseTime(props.onset);
    const expireD = parseTime(props.expires);
    const endsD = parseTime(props.ends);

    const sentTime = sentD?.getTime() ?? null;
    const effectiveTime = effectiveD?.getTime() ?? null;
    const onsetTime = onsetD?.getTime() ?? null;
    const expiresTime = expireD?.getTime() ?? null;
    const endsTime = endsD?.getTime() ?? null;

    const effTz = window.getEffectiveTz ? window.getEffectiveTz() : "local";
    const formatMetaRow = (label, date) =>
      window.formatDateFull
        ? `<div class="full-alert-meta-row"><strong>${label}:</strong> ${window.formatDateFull(date, effTz)}</div>`
        : "";

    const sentStr = sentTime !== null ? formatMetaRow("Sent", sentD) : "";
    const effectiveStr =
      effectiveTime !== null &&
      effectiveTime !== sentTime &&
      effectiveTime !== onsetTime
        ? formatMetaRow("Effective", effectiveD)
        : "";
    const onsetStr =
      onsetTime !== null && onsetTime !== sentTime
        ? formatMetaRow("Onset", onsetD)
        : "";
    const expiresStr =
      expiresTime !== null ? formatMetaRow("Expires", expireD) : "";
    const endsStr =
      endsTime !== null && endsTime !== expiresTime
        ? formatMetaRow("Ends", endsD)
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
        if (contentEl) {
          contentEl.innerHTML = `${metaHTML}<p>Could not load text.</p>`;
        }
        return;
      }
      try {
        const text = window.fetchMdWatchText
          ? await window.fetchMdWatchText(props.id, validatedUrl, false)
          : "";
        if (contentEl && window.formatNwsText) {
          contentEl.innerHTML = `${metaHTML}<p>${window.formatNwsText(text)}</p>`;
        }
      } catch (e) {
        if (contentEl) {
          contentEl.innerHTML = `${metaHTML}<p>Failed to load text.</p><p><a href="${validatedUrl}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
        }
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
    if (contentEl) {
      contentEl.innerHTML = `${metaHTML}<div id="alert-description-container"><p>${watchNumber ? "Loading..." : formattedD}</p></div>${props.instruction ? `<div class="full-alert-section-label">Instructions</div><p>${formattedI}</p>` : ""}`;
    }
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
        if (text && descContainer && window.formatNwsText) {
          descContainer.innerHTML = `<p>${window.formatNwsText(text)}</p>`;
        } else if (descContainer) {
          descContainer.innerHTML = `<p>${formattedD}</p>`;
        }
      } catch (e) {
        const descContainer = document.getElementById(
          "alert-description-container",
        );
        if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
      }
    }
  };
});
