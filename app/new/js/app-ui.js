/**
 * WeatherScout - Map Initialization & UI Coordination Module
 */

// --- WEBAUDIO SETUP & MEDIA CONTEXTS ---
window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
window.preloadedBuffers = new Map();

window.preloadAllAudio = async function() {
    for (const option of window.AUDIO_OPTIONS) {
        if (option.value === "none") continue;
        try {
            const response = await fetch(option.value, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const decodedData = await window.audioCtx.decodeAudioData(arrayBuffer);
            window.preloadedBuffers.set(option.value, decodedData);
        } catch (e) {
            console.error(`Failed to preload audio: ${option.label}`, e);
        }
    }
};

window.playAlertSound = function(url, title = "Weather Alert") {
    if (window.audioCtx.state === 'suspended') {
        window.audioCtx.resume();
    }
    const buffer = window.preloadedBuffers.get(url);
    if (!buffer) return;
    const source = window.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(window.audioCtx.destination);
    source.start(0);
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: 'WeatherScout',
            artwork: [{ src: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/refs/heads/main/assets/Sun%20behind%20small%20cloud/3D/sun_behind_small_cloud_3d.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.playbackState = "playing";
    }
};

document.addEventListener('click', () => {
    if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
}, { once: false });

// --- NAVIGATION HISTORY & MENUS CONTROL ---
window.menuHistory = [];

window.getCurrentOpenMenu = function() {
    if (document.getElementById("settings-popup").classList.contains("open")) return "settings";
    if (document.getElementById("alert-settings-popup").classList.contains("open")) return "alert-settings";
    if (document.getElementById("radar-panel").classList.contains("open")) return "radar";
    if (document.getElementById("radar-settings-popup").classList.contains("open")) return "radar-settings";
    if (document.getElementById("hidden-alerts-panel").classList.contains("open")) return "hidden-alerts";
    if (document.getElementById("alert-sounds-panel").classList.contains("open")) return "alert-sounds";
    if (document.getElementById("location-search-panel").classList.contains("open")) return "search";
    if (document.getElementById("spc-outlook-panel").classList.contains("open")) return "outlooks";
    if (document.getElementById("alerts-sidebar").classList.contains("open")) return "alerts-sidebar";
    return null;
};

window.closeAllMenus = function() {
    const menus = [
        "settings-popup", "alert-settings-popup", "radar-panel", 
        "radar-settings-popup", "hidden-alerts-panel", "alert-sounds-panel",
        "location-search-panel", "spc-outlook-panel", "alerts-sidebar"
    ];
    menus.forEach(id => {
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

window.goBack = function() {
    if (window.menuHistory.length > 0) {
        const prevMenu = window.menuHistory.pop();
        window.openMenuById(prevMenu, true);
    } else {
        window.closeAllMenus();
    }
};

window.openMenuById = function(id, isBack = false) {
    switch(id) {
        case "settings": window.openSettings(isBack); break;
        case "alert-settings": window.openAlertSettings(isBack); break;
        case "radar": window.openRadarPanel(isBack); break;
        case "radar-settings": window.openRadarSettingsFrom(null, isBack); break;
        case "hidden-alerts": window.openHiddenAlertsPanel(isBack); break;
        case "alert-sounds": window.openAlertSoundsPanel(isBack); break;
        case "search": window.openLocationSearch(isBack); break;
        case "outlooks": window.openSpcOutlookPanel(isBack); break;
        case "alerts-sidebar": window.openSidebar(isBack); break;
    }
};

// --- GENERAL NOTIFICATION TOAST ---
window.showToast = function(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerText = message;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add("show"); });
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { toast.remove(); }, 300);
    }, 1200);
};

// --- DYNAMIC VISUAL STATE CHECKS ---
window.updateGreenStatusIndicators = function() {
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
        sidebarToggle.classList.toggle("active", window.alertsEnabled);
    }
    const spcActive = window.activeSpcDay !== "none" && window.activeSpcType !== "none";
    const outlooksBtn = document.getElementById("fab-outlooks");
    if (outlooksBtn) {
        outlooksBtn.classList.toggle("status-on", spcActive);
    }
    const spcToggle = document.getElementById("spc-outlook-toggle");
    if (spcToggle) {
        spcToggle.classList.toggle("active", spcActive);
    }
    window.updateSpcOutlookPanelState();
};

window.toggleFabMenu = function() {
    const menu = document.getElementById("fab-menu");
    const btn = document.getElementById("fab-menu-btn");
    menu.classList.toggle("open");
    btn.classList.toggle("active", menu.classList.contains("open"));
};

// --- MY LOCATION (GEOLOCATION SERVICES) ---
window.updateMyLocation = function() {
    if (!window.myLocationEnabled) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { longitude, latitude } = pos.coords;
            const fabLoc = document.getElementById("fab-my-location");
            if (fabLoc) fabLoc.querySelector('i').textContent = "my_location";
            if (!window.myLocationMarker) {
                const el = document.createElement('div');
                el.className = 'my-location-dot';
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.map.flyTo({ center: window.myLocationMarker.getLngLat(), zoom: 9, essential: true });
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
        { enableHighAccuracy: true }
    );
};

window.toggleMyLocation = function(enabled) {
    window.myLocationEnabled = enabled;
    const fabLoc = document.getElementById("fab-my-location");
    if (enabled) {
        if (fabLoc) {
            fabLoc.classList.add("status-on");
            fabLoc.querySelector('i').textContent = "location_searching";
        }
        window.updateMyLocation();
        window.myLocationInterval = setInterval(window.updateMyLocation, 5000);
        window.showToast("My Location: On");
    } else {
        if (fabLoc) {
            fabLoc.classList.remove("status-on");
            fabLoc.querySelector('i').textContent = "location_disabled";
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

// --- INITIALIZE THE MAP CANVAS ---
window.map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    center: [-97, 39],
    zoom: 3,
    attributionControl: false
});

let currentMapPopup = null;
let currentStackedAlertsOnMap = [];
let currentStackedAlertIndex = 0;
let locationSearchMarker = null;
let locationSearchTimeout = null;

// --- DYNAMIC REFRESH TIMERS MANAGEMENT ---
window.startAlertIntervals = function() {
    if (window.nwsUpdateInterval) clearInterval(window.nwsUpdateInterval);
    if (window.placefileUpdateInterval) clearInterval(window.placefileUpdateInterval);
    
    const nwsTime = window.fasterUpdatesEnabled ? 15000 : 60000;
    const placeTime = window.fasterUpdatesEnabled ? 75000 : 300000;
    
    window.nwsUpdateInterval = setInterval(window.refreshNwsAlerts, nwsTime);
    window.placefileUpdateInterval = setInterval(window.updatePlacefileAlerts, placeTime);
};

// --- INITIALIZE UI EVENT BINDINGS ON DOM LOAD ---
document.addEventListener("DOMContentLoaded", () => {
    window.preloadAllAudio();
    
    // Core settings elements reference
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const saveSettingsToggleUI = document.getElementById("save-settings-toggle-ui");
    const resetAppBtn = document.getElementById("reset-app-settings-btn");
    const flySettingsBtn = document.getElementById("fly-settings-btn");
    const flySettingsToggleUI = document.getElementById("fly-settings-toggle-ui");
    const zoneAlertsBtn = document.getElementById("zone-alerts-settings-btn");
    const zoneAlertsToggleUI = document.getElementById("zone-alerts-settings-toggle-ui");
    const mesoDiscussionsBtn = document.getElementById("meso-discussions-settings-btn");
    const mesoDiscussionsToggleUI = document.getElementById("meso-discussions-settings-toggle-ui");
    const fasterUpdatesBtn = document.getElementById("faster-updates-settings-btn");
    const fasterUpdatesToggleUI = document.getElementById("faster-updates-settings-toggle-ui");
    const debugSettingsBtn = document.getElementById("debug-settings-btn");
    const debugSettingsToggleUI = document.getElementById("debug-settings-toggle-ui");
    const fabLocBtn = document.getElementById("fab-my-location");
    const radarToggle = document.getElementById("radar-toggle");
    const sitesToggle = document.getElementById("radar-sites-toggle");
    const debugInput = document.getElementById("debug-file-input");
    
    // --- LOAD PRESERVED SAVED VALUES ---
    window.saveSettingsEnabled = localStorage.getItem("saveSettings") === "true";
    if (window.saveSettingsEnabled) {
        window.debugModeEnabled = localStorage.getItem("debugMode") === "true";
        if (localStorage.getItem("radarVisible") === "false") radarToggle.checked = false;
        if (localStorage.getItem("sitesVisible") === "false") sitesToggle.checked = false;
        if (localStorage.getItem("alertsVisible") === "false") window.alertsEnabled = false;
        
        window.activeSpcDay = localStorage.getItem("activeSpcDay") || "none";
        window.activeSpcType = localStorage.getItem("activeSpcType") || "none";
        window.activeSiteIdForData = localStorage.getItem("activeSiteId") || null;
        window.activeRadarProductCode = localStorage.getItem("activeProduct") || null;
        window.radarSiteSelectionMode = localStorage.getItem("siteSelection") || "Both";
        window.showSitesMode = localStorage.getItem("showSites") || "Both";
        window.flyToRadarSetting = localStorage.getItem("flyToRadar") === "true";
        
        if (localStorage.getItem("zoneAlertsVisible") === "false") window.zoneAlertsEnabled = false;
        if (localStorage.getItem("mesoDiscussionsVisible") === "false") window.mesoDiscussionsEnabled = false;
        if (localStorage.getItem("fasterUpdates") === "true") window.fasterUpdatesEnabled = true;
        
        const savedHidden = localStorage.getItem("hiddenAlertTypes");
        if (savedHidden) { try { window.hiddenAlertTypes = new Set(JSON.parse(savedHidden)); } catch(e) {} }
        const savedSounds = localStorage.getItem("alertSoundsMap");
        if (savedSounds) { try { window.alertSoundsMap = JSON.parse(savedSounds); } catch(e) {} }
        
        const savedTz = localStorage.getItem("appTimeZone");
        if (savedTz) window.appTimeZone = savedTz;
        const savedDst = localStorage.getItem("appDstMode");
        if (savedDst) window.appDstMode = savedDst;
        const savedHour = localStorage.getItem("appHourMode");
        if (savedHour) window.appHourMode = savedHour;
        if (localStorage.getItem("myLocationEnabled") === "true") window.myLocationEnabled = true;
    } else {
        window.hiddenAlertTypes = new Set();
    }
    
    // --- URL PARAMETERS INTERPRETER ---
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get("s");
    let overrodeSaveSettings = null;
    let urlRadarRequest = null;
    
    if (sParam) {
        const flags = sParam.toLowerCase().split(",");
        flags.forEach((flag) => {
            switch (flag) {
                case "ssb": window.radarSiteSelectionMode = "Both"; break;
                case "ssw": window.radarSiteSelectionMode = "WSR-88D"; break;
                case "sst": window.radarSiteSelectionMode = "TDWR"; break;
                case "xss": window.radarSiteSelectionMode = "None"; break;
                case "ftr": window.flyToRadarSetting = true; break;
                case "xfr": window.flyToRadarSetting = false; break;
                case "zna": window.zoneAlertsEnabled = true; break;
                case "xza": window.zoneAlertsEnabled = false; break;
                case "dbg": window.debugModeEnabled = true; break;
                case "xdb": window.debugModeEnabled = false; break;
                case "sav": overrodeSaveSettings = true; break;
                case "xsv": overrodeSaveSettings = false; break;
                case "d1c": window.activeSpcDay = "1"; window.activeSpcType = "cat"; break;
                case "d1t": window.activeSpcDay = "1"; window.activeSpcType = "torn"; break;
                case "d1h": window.activeSpcDay = "1"; window.activeSpcType = "hail"; break;
                case "d1w": window.activeSpcDay = "1"; window.activeSpcType = "wind"; break;
                case "d2c": window.activeSpcDay = "2"; window.activeSpcType = "cat"; break;
                case "d2t": window.activeSpcDay = "2"; window.activeSpcType = "torn"; break;
                case "d2h": window.activeSpcDay = "2"; window.activeSpcType = "hail"; break;
                case "d2w": window.activeSpcDay = "2"; window.activeSpcType = "wind"; break;
                case "d3c": window.activeSpcDay = "3"; window.activeSpcType = "cat"; break;
                case "d3p": window.activeSpcDay = "3"; window.activeSpcType = "prob"; break;
                case "d4p": window.activeSpcDay = "4"; window.activeSpcType = "prob"; break;
                case "d5p": window.activeSpcDay = "5"; window.activeSpcType = "prob"; break;
                case "d6p": window.activeSpcDay = "6"; window.activeSpcType = "prob"; break;
                case "d7p": window.activeSpcDay = "7"; window.activeSpcType = "prob"; break;
                case "d8p": window.activeSpcDay = "8"; window.activeSpcType = "prob"; break;
                case "xlk": window.activeSpcDay = "none"; window.activeSpcType = "none"; break;
                case "irm": radarToggle.checked = true; break;
                case "xrm": radarToggle.checked = false; break;
                case "alt": window.alertsEnabled = true; break;
                case "xal": window.alertsEnabled = false; break;
                case "myl": window.myLocationEnabled = true; break;
                case "xml": window.myLocationEnabled = false; break;
                case "fup": window.fasterUpdatesEnabled = true; break;
                case "xfu": window.fasterUpdatesEnabled = false; break;
                default:
                    if (flag.length === 5 && /^[rvl][a-z0-9]{4}$/i.test(flag)) {
                        urlRadarRequest = { id: flag.substring(1).toUpperCase(), type: flag.charAt(0) };
                    }
                    break;
            }
        });
        if (overrodeSaveSettings === true) { window.saveSettingsEnabled = true; localStorage.setItem("saveSettings", "true"); }
        else if (overrodeSaveSettings === false) { window.saveSettingsEnabled = false; localStorage.setItem("saveSettings", "false"); }
    }
    
    // Dynamic states adjustments
    if (window.saveSettingsEnabled) saveSettingsToggleUI.classList.add("active");
    else saveSettingsToggleUI.classList.remove("active");
    
    if (window.debugModeEnabled) debugSettingsToggleUI.classList.add("active");
    else debugSettingsToggleUI.classList.remove("active");
    
    if (window.flyToRadarSetting) flySettingsToggleUI.classList.add("active");
    else flySettingsToggleUI.classList.remove("active");
    
    if (window.zoneAlertsEnabled) zoneAlertsToggleUI.classList.add("active");
    else zoneAlertsToggleUI.classList.remove("active");
    
    if (window.mesoDiscussionsEnabled) mesoDiscussionsToggleUI.classList.add("active");
    else mesoDiscussionsToggleUI.classList.remove("active");
    
    if (window.fasterUpdatesEnabled) fasterUpdatesToggleUI.classList.add("active");
    else fasterUpdatesToggleUI.classList.remove("active");
    
    if (window.myLocationEnabled) window.toggleMyLocation(true);
    
    const hiddenCountEl = document.getElementById("hidden-alert-types-count");
    if (hiddenCountEl && window.hiddenAlertTypes.size > 0) {
        hiddenCountEl.textContent = window.hiddenAlertTypes.size;
    }
    
    // --- SETTINGS CONTROLS & BINDINGS ---
    window.updateAlertSoundsCountLabel = function() { 
        const countEl = document.getElementById("alert-sounds-count");
        const internalLabel = document.getElementById("alert-sounds-count-label");
        const activeCount = Object.values(window.alertSoundsMap).filter(v => v !== "none").length;
        if (countEl) countEl.textContent = activeCount > 0 ? activeCount : "";
        if (internalLabel) {
            internalLabel.textContent = activeCount === 0 ? "No alerts with sounds" : `${activeCount} alert${activeCount >= 2 ? "s" : ""} with sounds`;
        }
    };
    window.updateAlertSoundsCountLabel();
    
    function updateSiteSelectionUI() {
        document.querySelectorAll(".site-select-option").forEach((opt) => {
            opt.classList.toggle("selected", opt.dataset.value === window.radarSiteSelectionMode);
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
    
    window.saveCurrentState = function() {
        const radarToggle = document.getElementById("radar-toggle");
        const sitesToggle = document.getElementById("radar-sites-toggle");
        if (window.map && localStorage.getItem("saveSettings") === "true") {
            localStorage.setItem("radarVisible", radarToggle ? radarToggle.checked : true);
            localStorage.setItem("sitesVisible", sitesToggle ? sitesToggle.checked : true);
            localStorage.setItem("alertsVisible", window.alertsEnabled);
            localStorage.setItem("activeSpcDay", window.activeSpcDay);
            localStorage.setItem("activeSpcType", window.activeSpcType);
            localStorage.setItem("activeSiteId", window.activeSiteIdForData || "");
            localStorage.setItem("activeProduct", window.activeRadarProductCode || "");
            localStorage.setItem("siteSelection", window.radarSiteSelectionMode);
            localStorage.setItem("showSites", window.showSitesMode);
            localStorage.setItem("flyToRadar", window.flyToRadarSetting);
            localStorage.setItem("zoneAlertsVisible", window.zoneAlertsEnabled);
            localStorage.setItem("mesoDiscussionsVisible", window.mesoDiscussionsEnabled);
            localStorage.setItem("fasterUpdates", window.fasterUpdatesEnabled);
            localStorage.setItem("hiddenAlertTypes", JSON.stringify([...window.hiddenAlertTypes]));
            localStorage.setItem("alertSoundsMap", JSON.stringify(window.alertSoundsMap));
            localStorage.setItem("debugMode", window.debugModeEnabled);
            localStorage.setItem("lastZoom", window.map.getZoom());
            localStorage.setItem("lastCenter", JSON.stringify(window.map.getCenter()));
            localStorage.setItem("appTimeZone", window.appTimeZone);
            localStorage.setItem("appDstMode", window.appDstMode);
            localStorage.setItem("appHourMode", window.appHourMode);
            localStorage.setItem("myLocationEnabled", window.myLocationEnabled);
        }
    };
    
    saveSettingsBtn.addEventListener("click", () => {
        if (saveSettingsToggleUI.classList.contains("active")) {
            saveSettingsToggleUI.classList.remove("active");
            localStorage.clear();
            document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
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
            document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
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
    
    if (fabLocBtn) {
        fabLocBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            window.toggleMyLocation(!window.myLocationEnabled);
        });
    }
    
    // --- TIMEZONE MANAGERS ---
    const tzCustomInput = document.getElementById("tz-custom-input");
    const localBrowserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    function updateTzSelector() {
        const isLocal = window.appTimeZone === localBrowserTz;
        const isUTC = window.appTimeZone === "UTC";
        document.querySelector('.tz-option[data-value="local"]').classList.toggle("selected", isLocal);
        document.querySelector('.tz-option[data-value="UTC"]').classList.toggle("selected", isUTC && !isLocal);
        if (tzCustomInput) tzCustomInput.classList.toggle("active", !isLocal && !isUTC);
    }
    
    function updateDstSelector() {
        const fixed = window.isFixedOffset(window.appTimeZone);
        if (fixed && window.appDstMode !== "auto") window.appDstMode = "auto";
        document.querySelectorAll(".dst-option").forEach(btn => {
            const forcedOption = btn.dataset.value !== "auto";
            btn.classList.toggle("selected", btn.dataset.value === window.appDstMode);
            btn.disabled = fixed && forcedOption;
            btn.style.opacity = (fixed && forcedOption) ? "0.3" : "";
            btn.style.cursor = (fixed && forcedOption) ? "default" : "";
            btn.style.pointerEvents = (fixed && forcedOption) ? "none" : "";
        });
    }
    
    function updateHourSelector() {
        const utcZero = window.isUTCZero(window.appTimeZone);
        if (utcZero && window.appHourMode !== "auto") {
            window.appHourMode = "auto";
            window.saveCurrentState();
        }
        document.querySelectorAll(".hour-option").forEach(btn => {
            const forcedOption = btn.dataset.value !== "auto";
            btn.classList.toggle("selected", btn.dataset.value === window.appHourMode);
            btn.disabled = utcZero && forcedOption;
            btn.style.opacity = (utcZero && forcedOption) ? "0.3" : "";
            btn.style.cursor = (utcZero && forcedOption) ? "default" : "";
            btn.style.pointerEvents = (utcZero && forcedOption) ? "none" : "";
        });
    }
    
    updateTzSelector();
    updateDstSelector();
    updateHourSelector();
    
    if (window.appTimeZone !== localBrowserTz && window.appTimeZone !== "UTC" && tzCustomInput) {
        tzCustomInput.value = window.tzToDisplay(window.appTimeZone);
    }
    
    document.querySelectorAll(".tz-option").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.dataset.value;
            window.appTimeZone = val === "local" ? localBrowserTz : val;
            if (val !== "custom" && tzCustomInput) tzCustomInput.value = "";
            updateTzSelector(); updateDstSelector(); updateHourSelector();
            window.saveCurrentState(); window.showToast("Time Zone: " + btn.textContent.trim());
        });
    });
    
    if (tzCustomInput) {
        tzCustomInput.addEventListener("focus", () => { tzCustomInput.classList.remove("invalid"); });
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
                updateTzSelector(); updateDstSelector(); updateHourSelector();
                window.saveCurrentState();
                window.showToast("Time Zone: " + tzCustomInput.value.trim());
            }
        });
        tzCustomInput.addEventListener("keydown", e => { if (e.key === "Enter") { tzCustomInput.blur(); e.preventDefault(); } });
    }
    
    document.querySelectorAll(".dst-option").forEach(btn => {
        btn.addEventListener("click", () => {
            window.appDstMode = btn.dataset.value;
            updateDstSelector(); window.saveCurrentState(); window.showToast("Time Mode: " + btn.textContent.trim());
        });
    });
    
    document.querySelectorAll(".hour-option").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;
            window.appHourMode = btn.dataset.value;
            updateHourSelector(); window.saveCurrentState(); window.showToast("Hour Format: " + btn.textContent.trim());
        });
    });
    
    flySettingsBtn.addEventListener("click", () => {
        window.flyToRadarSetting = !window.flyToRadarSetting;
        flySettingsToggleUI.classList.toggle("active");
        window.saveCurrentState();
    });
    
    // --- RADAR LOOPING CUSTOM TIME SELECTOR ---
    (function() {
        const loopCustomInput = document.getElementById("loop-time-custom-input");
        function updateLoopTimeUI() {
            const mins = window.radarLoopMinutes;
            const isPreset = mins === 30 || mins === 60;
            document.querySelectorAll(".loop-time-option").forEach(btn => { btn.classList.toggle("selected", isPreset && parseInt(btn.dataset.value) === mins); });
            if (loopCustomInput) {
                loopCustomInput.classList.toggle("active", !isPreset);
                loopCustomInput.value = !isPreset ? `${mins} min` : "";
            }
        }
        document.querySelectorAll(".loop-time-option").forEach(btn => {
            btn.addEventListener("click", () => {
                const val = parseInt(btn.dataset.value);
                if (window.setRadarLoopMinutes) window.setRadarLoopMinutes(val);
                updateLoopTimeUI(); window.showToast(`Loop Time: ${val} min`);
            });
        });
        if (loopCustomInput) {
            loopCustomInput.addEventListener("focus", () => { loopCustomInput.classList.remove("invalid"); loopCustomInput.value = loopCustomInput.value.replace(/\s*min$/i, "").trim(); });
            loopCustomInput.addEventListener("input", () => {
                loopCustomInput.value = loopCustomInput.value.replace(/[^0-9]/g, "");
                const val = parseInt(loopCustomInput.value);
                const hasVal = loopCustomInput.value.trim() !== "";
                loopCustomInput.classList.toggle("invalid", hasVal && (isNaN(val) || val < 5 || val > 120));
            });
            loopCustomInput.addEventListener("change", () => {
                const raw = parseInt(loopCustomInput.value.replace(/[^0-9]/g, ""));
                if (!isNaN(raw) && raw >= 5 && raw <= 120) {
                    const snapped = Math.round(raw / 5) * 5;
                    loopCustomInput.classList.remove("invalid");
                    document.querySelectorAll(".loop-time-option").forEach(b => b.classList.remove("selected"));
                    loopCustomInput.classList.add("active");
                    loopCustomInput.value = `${snapped} min`;
                    if (window.setRadarLoopMinutes) window.setRadarLoopMinutes(snapped);
                    window.showToast(`Loop Time: ${snapped} min`);
                } else {
                    updateLoopTimeUI();
                }
            });
            loopCustomInput.addEventListener("keydown", e => { if (e.key === "Enter") { loopCustomInput.blur(); e.preventDefault(); } });
        }
        updateLoopTimeUI();
    })();
    
    // --- DYNAMIC MODULE TOGGLES ---
    zoneAlertsBtn.addEventListener("click", () => {
        window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
        zoneAlertsToggleUI.classList.toggle("active");
        window.saveCurrentState();
        if (window.zoneAlertsEnabled) {
            window.showToast("Zone Alerts: On");
            if (window.map.getSource("alerts-poly-watch")) window.map.getSource("alerts-poly-watch").setData({ type: "FeatureCollection", features: [] });
            window.globalPolyWatchAlerts = [];
            if (window.alertsEnabled) window.refreshNwsAlerts(true);
        } else {
            window.showToast("Zone Alerts: Off");
            if (window.map.getSource("alerts-zone")) window.map.getSource("alerts-zone").setData({ type: "FeatureCollection", features: [] });
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
            if (window.map.getSource("alerts-md")) window.map.getSource("alerts-md").setData({ type: "FeatureCollection", features: [] });
            window.globalMdAlerts = [];
            if (window.renderAlertsSidebar) window.renderAlertsSidebar();
        }
    });
    
    fasterUpdatesBtn.addEventListener("click", () => {
        window.fasterUpdatesEnabled = !window.fasterUpdatesEnabled;
        fasterUpdatesToggleUI.classList.toggle("active");
        window.saveCurrentState();
        window.startAlertIntervals();
        window.showToast(`Faster Updates: ${window.fasterUpdatesEnabled ? "On" : "Off"}`);
    });
    
    // --- MAIN CORE NAVIGATION CLICKS ---
    const fabMenuBtn = document.getElementById("fab-menu-btn");
    const fabOutlooks = document.getElementById("fab-outlooks");
    const fabMosaic = document.getElementById("fab-mosaic");
    const fabAlerts = document.getElementById("fab-alerts");
    const fabSettings = document.getElementById("fab-settings");
    const settingsPopup = document.getElementById("settings-popup");
    const settingsCloseBtn = document.getElementById("settings-close-btn");
    const pillInfoBtn = document.getElementById("pill-info-btn");
    
    window.openSettings = function(isBack = false) {
        if (!isBack) window.menuHistory = [];
        window.closeAllMenus();
        settingsPopup.classList.add("open");
        settingsPopup.querySelector(".settings-body").scrollTop = 0;
        fabSettings.classList.add("active");
    };
    
    window.closeSettings = function() {
        settingsPopup.classList.remove("open");
        if (fabSettings) fabSettings.classList.remove("active");
    };
    
    if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", window.closeSettings);
    document.getElementById("settings-open-alerts-btn").addEventListener("click", () => { window.openAlertSettings(); });
    document.getElementById("settings-open-radar-btn").addEventListener("click", () => { window.openRadarSettingsFrom(); });
    
    const alertSettingsPopup = document.getElementById("alert-settings-popup");
    const alertSettingsCloseBtn = document.getElementById("alert-settings-close-btn");
    
    window.openAlertSettings = function(isBack = false) {
        if (!isBack) { const curr = window.getCurrentOpenMenu(); if (curr) window.menuHistory.push(curr); }
        window.closeAllMenus();
        if (alertSettingsPopup) {
            alertSettingsPopup.classList.add("open");
            alertSettingsPopup.querySelector(".settings-body").scrollTop = 0;
        }
    };
    
    window.closeAlertSettings = function() {
        if (alertSettingsPopup) alertSettingsPopup.classList.remove("open");
    };
    
    if (alertSettingsCloseBtn) alertSettingsCloseBtn.addEventListener("click", window.closeAlertSettings);
    document.getElementById("alert-settings-back-btn").addEventListener("click", window.goBack);
    
    // --- HIDDEN ALERTS OVERLAY MANAGER ---
    const hiddenAlertsPanel = document.getElementById("hidden-alerts-panel");
    const hiddenAlertsBackBtn = document.getElementById("hidden-alerts-back-btn");
    const hiddenAlertsCloseBtn = document.getElementById("hidden-alerts-close-btn");
    const hiddenAlertsSearch = document.getElementById("hidden-alerts-search");
    const hiddenAlertsListEl = document.getElementById("hidden-alerts-list");
    const hiddenAlertsCountLabel = document.getElementById("hidden-alerts-count-label");
    const hiddenAlertsResetBtn = document.getElementById("hidden-alerts-reset-btn");
    
    function updateHiddenAlertsCountLabel() {
        const n = window.hiddenAlertTypes.size;
        if (hiddenAlertsCountLabel) {
            hiddenAlertsCountLabel.textContent = n === 0 ? "No alerts hidden" : `${n} alert${n >= 2 ? "s" : ""} hidden`;
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
            return window.getAlertPriorityScore({ properties: { event: a, parameters: {} } }) - 
                   window.getAlertPriorityScore({ properties: { event: b, parameters: {} } });
        });
        const visible = query ? sorted.filter(t => t.toLowerCase().includes(query)) : sorted;
        const existingRows = Array.from(hiddenAlertsListEl.querySelectorAll(".hidden-alert-row"));
        const existingMap = new Map(existingRows.map(r => [r.dataset.eventType, r]));
        const newKeys = new Set(visible);
        
        existingRows.forEach(r => { if (!newKeys.has(r.dataset.eventType)) r.remove(); });
        visible.forEach((eventType, i) => {
            const isHidden = window.hiddenAlertTypes.has(eventType);
            const color = window.alertColorMap[eventType] || "#808080";
            if (existingMap.has(eventType)) {
                const row = existingMap.get(eventType);
                row.className = "hidden-alert-row" + (isHidden ? " is-hidden" : "");
                row.style.borderLeftColor = isHidden ? "var(--glass-border-color)" : `${color}80`;
                row.querySelector(".hidden-alert-eye").textContent = isHidden ? "visibility_off" : "visibility";
                const after = hiddenAlertsListEl.children[i];
                if (after !== row) hiddenAlertsListEl.insertBefore(row, after || null);
            } else {
                const row = document.createElement("div");
                row.className = "hidden-alert-row" + (isHidden ? " is-hidden" : "");
                row.dataset.eventType = eventType;
                row.style.borderLeftColor = isHidden ? "var(--glass-border-color)" : `${color}80`;
                row.innerHTML = `<span class="hidden-alert-label">${eventType}</span><i class="material-symbols-rounded hidden-alert-eye">${isHidden ? "visibility_off" : "visibility"}</i>`;
                row.addEventListener("click", () => {
                    if (window.hiddenAlertTypes.has(eventType)) window.hiddenAlertTypes.delete(eventType);
                    else window.hiddenAlertTypes.add(eventType);
                    window.applyMapAlertFilters(); window.saveCurrentState(); updateHiddenAlertsCountLabel(); renderHiddenAlertsList(hiddenAlertsSearch.value);
                });
                const after = hiddenAlertsListEl.children[i];
                hiddenAlertsListEl.insertBefore(row, after || null);
            }
        });
        updateHiddenAlertsCountLabel();
    }
    
    window.openHiddenAlertsPanel = function(isBack = false) {
        if (!isBack) { const curr = window.getCurrentOpenMenu(); if (curr) window.menuHistory.push(curr); }
        window.closeAllMenus();
        if (hiddenAlertsSearch) hiddenAlertsSearch.value = ""; 
        renderHiddenAlertsList("");
        if (hiddenAlertsPanel) {
            hiddenAlertsPanel.classList.add("open");
            const lst = document.getElementById("hidden-alerts-list");
            if (lst) lst.scrollTop = 0;
        }
    };
    
    window.closeHiddenAlertsPanel = function() {
        if (hiddenAlertsPanel) hiddenAlertsPanel.classList.remove("open");
    };
    
    if (hiddenAlertsBackBtn) hiddenAlertsBackBtn.addEventListener("click", window.goBack);
    if (hiddenAlertsCloseBtn) hiddenAlertsCloseBtn.addEventListener("click", window.closeHiddenAlertsPanel);
    if (hiddenAlertsSearch) hiddenAlertsSearch.addEventListener("input", () => renderHiddenAlertsList(hiddenAlertsSearch.value));
    if (hiddenAlertsResetBtn) {
        hiddenAlertsResetBtn.addEventListener("click", () => {
            window.hiddenAlertTypes.clear(); window.applyMapAlertFilters(); window.saveCurrentState(); renderHiddenAlertsList(hiddenAlertsSearch.value); window.showToast("All alert types visible");
        });
    }
    const hiddenAlertsTrigger = document.getElementById("hidden-alert-types-btn");
    if (hiddenAlertsTrigger) hiddenAlertsTrigger.addEventListener("click", () => window.openHiddenAlertsPanel());
    
    // --- ALERT SOUND REFRESH MODULE ---
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
            const aHasSound = (window.alertSoundsMap[a] && window.alertSoundsMap[a] !== "none") ? 0 : 1;
            const bHasSound = (window.alertSoundsMap[b] && window.alertSoundsMap[b] !== "none") ? 0 : 1;
            if (aHasSound !== bHasSound) return aHasSound - bHasSound;
            return window.getAlertPriorityScore({ properties: { event: a, parameters: {} } }) - 
                   window.getAlertPriorityScore({ properties: { event: b, parameters: {} } });
        });
        const visible = query ? sorted.filter(t => t.toLowerCase().includes(query)) : sorted;
        const existingRows = Array.from(alertSoundsListEl.querySelectorAll(".alert-sound-row"));
        const existingMap = new Map(existingRows.map(r => [r.dataset.eventType, r]));
        const newKeys = new Set(visible);
        
        existingRows.forEach(r => { if (!newKeys.has(r.dataset.eventType)) r.remove(); });
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
                let optionsHtml = window.AUDIO_OPTIONS.map(opt => `<option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>${opt.label}</option>`).join("");
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
    
    window.openAlertSoundsPanel = function(isBack = false) {
        if (!isBack) { const curr = window.getCurrentOpenMenu(); if (curr) window.menuHistory.push(curr); }
        window.closeAllMenus();
        if (alertSoundsSearch) alertSoundsSearch.value = ""; 
        renderAlertSoundsList("");
        if (alertSoundsPanel) {
            alertSoundsPanel.classList.add("open");
            const lst = document.getElementById("alert-sounds-list");
            if (lst) lst.scrollTop = 0;
        }
    };
    
    window.closeAlertSoundsPanel = function() {
        if (alertSoundsPanel) alertSoundsPanel.classList.remove("open");
    };
    
    if (alertSoundsBackBtn) alertSoundsBackBtn.addEventListener("click", window.goBack);
    if (alertSoundsCloseBtn) alertSoundsCloseBtn.addEventListener("click", window.closeAlertSoundsPanel);
    if (alertSoundsSearch) alertSoundsSearch.addEventListener("input", () => renderAlertSoundsList(alertSoundsSearch.value));
    if (alertSoundsResetBtn) {
        alertSoundsResetBtn.addEventListener("click", () => {
            window.alertSoundsMap = {}; window.saveCurrentState(); renderAlertSoundsList(alertSoundsSearch.value); window.showToast("Alert sounds reset to None");
        });
    }
    const alertSoundsTrigger = document.getElementById("alert-sounds-btn");
    if (alertSoundsTrigger) alertSoundsTrigger.addEventListener("click", () => window.openAlertSoundsPanel());
    
    // --- LOCATION SEARCH MODAL MANAGERS ---
    const locationSearchPanel = document.getElementById("location-search-panel");
    const locationSearchInput = document.getElementById("location-search-input");
    const locationSearchResults = document.getElementById("location-search-results");
    const locationSearchEmpty = document.getElementById("location-search-empty");
    const locationSearchEmptyText = document.getElementById("location-search-empty-text");
    
    window.openLocationSearch = function(isBack = false) {
        if (!isBack) window.menuHistory = [];
        window.closeAllMenus();
        if (locationSearchPanel) {
            locationSearchPanel.classList.add("open");
            const sBtn = document.getElementById("fab-search-btn");
            if (sBtn) sBtn.classList.add("active");
            if (locationSearchResults) locationSearchResults.scrollTop = 0;
            if (locationSearchInput) setTimeout(() => locationSearchInput.focus(), 50);
        }
    };
    
    window.closeLocationSearch = function() {
        if (locationSearchPanel) locationSearchPanel.classList.remove("open");
        const sBtn = document.getElementById("fab-search-btn");
        if (sBtn) sBtn.classList.remove("active");
        clearTimeout(locationSearchTimeout);
        if (locationSearchInput) locationSearchInput.value = "";
        if (locationSearchResults) Array.from(locationSearchResults.querySelectorAll(".location-result-item")).forEach(el => el.remove());
        setLocationSearchEmpty("travel_explore", "Results show up here");
    };
    
    window.clearLocationMarker = function() {
        if (locationSearchMarker) {
            locationSearchMarker.remove();
            locationSearchMarker = null;
        }
        const sBtn = document.getElementById("fab-search-btn");
        if (sBtn) sBtn.classList.remove("status-on");
        window.showToast("Search Cleared");
    };
    
    const locCloseBtn = document.getElementById("location-search-close-btn");
    if (locCloseBtn) locCloseBtn.addEventListener("click", window.closeLocationSearch);
    
    const searchFab = document.getElementById("fab-search-btn");
    if (searchFab) {
        searchFab.addEventListener("click", (e) => {
            e.stopPropagation();
            if (searchFab.classList.contains("status-on")) {
                window.clearLocationMarker();
                if (locationSearchPanel && locationSearchPanel.classList.contains("open")) {
                    window.closeLocationSearch();
                }
            } else {
                if (locationSearchPanel) {
                    locationSearchPanel.classList.contains("open") ? window.closeLocationSearch() : window.openLocationSearch();
                }
            }
        });
    }
    
    function setLocationSearchEmpty(icon, text) {
        if (locationSearchEmpty) {
            locationSearchEmpty.style.display = "flex";
            locationSearchEmpty.querySelector(".material-symbols-rounded").textContent = icon;
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
        Array.from(locationSearchResults.querySelectorAll(".location-result-item")).forEach(el => el.remove());
        if (results.length === 0) { setLocationSearchEmpty("search_off", "No results found"); return; }
        if (locationSearchEmpty) locationSearchEmpty.style.display = "none";
        
        results.forEach(result => {
            const lon = parseFloat(result.lon), lat = parseFloat(result.lat);
            const nameParts = (result.display_name || "").split(", ");
            const name = nameParts[0], detail = nameParts.slice(1).join(", ");
            const item = document.createElement("div");
            item.className = "location-result-item";
            item.innerHTML = `<i class="material-symbols-rounded">location_on</i><div class="location-result-text"><div class="location-result-name">${name}</div>${detail ? `<div class="location-result-detail">${detail}</div>` : ""}</div>`;
            item.addEventListener("click", () => {
                if (locationSearchMarker) locationSearchMarker.remove();
                locationSearchMarker = new maplibregl.Marker({ color: "#FFC300", scale: 0.6 }).setLngLat([lon, lat]).addTo(window.map);
                const sBtn = document.getElementById("fab-search-btn");
                if (sBtn) sBtn.classList.add("status-on");
                window.map.flyTo({ center: [lon, lat], zoom: getLocationZoom(result), essential: true });
                window.closeLocationSearch();
            });
            locationSearchResults.appendChild(item);
        });
    }
    
    if (locationSearchInput) {
        locationSearchInput.addEventListener("input", () => {
            const q = locationSearchInput.value.trim();
            clearTimeout(locationSearchTimeout);
            if (locationSearchResults) Array.from(locationSearchResults.querySelectorAll(".location-result-item")).forEach(el => el.remove());
            if (!q) { setLocationSearchEmpty("travel_explore", "Results show up here"); return; }
            setLocationSearchEmpty("hourglass_empty", "Searching...");
            locationSearchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1`);
                    const data = await res.json();
                    renderLocationResults(data);
                } catch (e) {
                    setLocationSearchEmpty("error", "Search failed");
                }
            }, 400);
        });
        locationSearchInput.addEventListener("keydown", e => { if (e.key === "Escape") { window.closeLocationSearch(); e.stopPropagation(); } });
    }
    
    if (fabMenuBtn) fabMenuBtn.addEventListener("click", (e) => { e.stopPropagation(); window.toggleFabMenu(); });
    
    // --- SPC OUTLOOK MODAL MANAGERS ---
    window.openSpcOutlookPanel = function(isBack = false) {
        if (!isBack) window.menuHistory = [];
        window.closeAllMenus();
        const panel = document.getElementById("spc-outlook-panel");
        if (panel) {
            panel.classList.add("open");
            const body = document.getElementById("spc-outlook-body");
            if (body) body.scrollTop = 0;
            window.renderSpcOutlookPanel();
            document.querySelectorAll("#spc-outlook-body .sidebar-alert-group").forEach(g => g.classList.remove("open"));
            const spcToggle = document.getElementById("spc-outlook-toggle");
            if (spcToggle) spcToggle.classList.toggle("active", window.activeSpcDay !== "none" && window.activeSpcType !== "none");
            if (fabOutlooks) fabOutlooks.classList.add("active");
        }
    };
    
    window.closeSpcOutlookPanel = function() {
        const panel = document.getElementById("spc-outlook-panel");
        if (panel) panel.classList.remove("open");
        document.querySelectorAll("#spc-outlook-body .sidebar-alert-group").forEach(g => g.classList.remove("open"));
        if (fabOutlooks) fabOutlooks.classList.remove("active");
    };
    
    const spcCloseBtn = document.getElementById("spc-outlook-close-btn");
    if (spcCloseBtn) spcCloseBtn.addEventListener("click", window.closeSpcOutlookPanel);
    
    const spcTglBtn = document.getElementById("spc-outlook-toggle");
    if (spcTglBtn) {
        spcTglBtn.addEventListener("click", () => {
            if (window.activeSpcDay !== "none") {
                window.activeSpcDay = "none"; window.activeSpcType = "none"; window.showToast("Outlook: Off");
            } else {
                const dayConfigs = [{ id: "1", types: ["cat", "torn", "wind", "hail"] }, { id: "2", types: ["cat", "torn", "wind", "hail"] }, { id: "3", types: ["cat", "prob"] }, { id: "4", types: ["prob"] }, { id: "5", types: ["prob"] }, { id: "6", types: ["prob"] }, { id: "7", types: ["prob"] }, { id: "8", types: ["prob"] }];
                for (const { id, types } of dayConfigs) {
                    const primaryType = types[0];
                    if (window.getSpcSourceHighest(`spc-day${id}-${primaryType}`)) {
                        window.activeSpcDay = id; window.activeSpcType = primaryType;
                        window.showToast(`Outlook: Day ${id} ${window.typeLabels[primaryType] || "Prob."}`);
                        break;
                    }
                }
            }
            window.updateSpcLayerVisibility();
            if (window.saveCurrentState) window.saveCurrentState();
            window.updateGreenStatusIndicators();
            window.renderSpcOutlookPanel();
        });
    }
    if (fabOutlooks) fabOutlooks.addEventListener("click", (e) => { e.stopPropagation(); const panel = document.getElementById("spc-outlook-panel"); if (panel) panel.classList.contains("open") ? window.closeSpcOutlookPanel() : window.openSpcOutlookPanel(); });
    
    // --- RADAR COMPONENT PANEL MANAGEMENT ---
    const radarPanel = document.getElementById("radar-panel");
    window.isAnyRadarOn = function() {
        const toggle = document.getElementById("radar-toggle");
        return (toggle && toggle.checked) || window.showSitesMode !== "None" || !!(window.activeSiteIdForData && window.activeRadarProductCode);
    };
    
    window.updateRadarPanelToggles = function() {
        const toggle = document.getElementById("radar-toggle");
        const panelToggle = document.getElementById("radar-panel-toggle");
        if (panelToggle && toggle) panelToggle.classList.toggle("active", toggle.checked);
    };
    
    window.renderRadarSiteList = function() {
        const listEl = document.getElementById("radar-panel-list"), emptyEl = document.getElementById("radar-panel-empty"), emptyTxt = document.getElementById("radar-panel-empty-text");
        if (!listEl) return;
        const query = (document.getElementById("radar-panel-search")?.value || "").toLowerCase().trim();
        Array.from(listEl.children).forEach(c => { if (c.id !== "radar-panel-empty") c.remove(); });
        
        if (!window.allRadarSitesData.length) {
            if (emptyTxt) emptyTxt.textContent = "Loading radar sites...";
            if (emptyEl) emptyEl.style.display = "flex";
            return;
        }
        const filtered = window.allRadarSitesData.filter(site => {
            const id = (site.properties.id || "").toLowerCase(), name = (site.properties.name || "").toLowerCase();
            return !query || id.includes(query) || name.includes(query);
        }).slice().sort((a, b) => {
            const na = (a.properties.name || a.properties.id || "").toLowerCase(), nb = (b.properties.name || b.properties.id || "").toLowerCase();
            return na < nb ? -1 : na > nb ? 1 : 0;
        });
        
        if (!filtered.length) {
            if (emptyTxt) emptyTxt.textContent = "No radars found";
            if (emptyEl) emptyEl.style.display = "flex";
            return;
        }
        if (emptyEl) emptyEl.style.display = "none";
        
        filtered.forEach(site => {
            const props = site.properties, id = props.id || "", name = props.name || id, type = props.stationType || "", offline = !!props.isOffline;
            const accentColor = offline ? "#ff4444" : type === "TDWR" ? "#ff9900" : "#0099ff";
            const item = document.createElement("div");
            item.className = "radar-site-item"; item.style.borderLeftColor = accentColor + "99";
            item.innerHTML = `<div class="radar-site-item-content"><div class="radar-site-item-label">${id} – ${name}</div></div><i class="material-symbols-rounded radar-site-item-icon">chevron_right</i>`;
            
            item.addEventListener("click", () => {
                if (offline) return;
                window.closeRadarPanel();
                const siteId = id.toLowerCase();
                const prodCode = window.activeRadarProductCode ? window.activeRadarProductCode.includes("vel") ? type === "TDWR" ? "bvel" : "sr_bvel" : window.activeRadarProductCode === "brefl" ? type === "TDWR" ? "brefl" : "sr_bref" : type === "TDWR" ? "bref1" : "sr_bref" : type === "TDWR" ? "bref1" : "sr_bref";
                window.toggleRadarProduct(siteId, prodCode);
                window.map.flyTo({ center: site.geometry.coordinates, zoom: 7, essential: true });
                window.updateGreenStatusIndicators();
                if (window.saveCurrentState) window.saveCurrentState();
            });
            listEl.appendChild(item);
        });
    };
    
    window.openRadarPanel = function(isBack = false) { 
        if (!isBack) window.menuHistory = [];
        window.closeAllMenus(); 
        window.updateRadarPanelToggles(); 
        window.renderRadarSiteList(); 
        if (radarPanel) radarPanel.classList.add("open"); 
        if (fabMosaic) fabMosaic.classList.add("active"); 
    };
    
    window.closeRadarPanel = function() {
        if (radarPanel) radarPanel.classList.remove("open");
        if (window.closeRadarSettings) window.closeRadarSettings();
        if (fabMosaic) fabMosaic.classList.remove("active");
    };
    
    const rPanelClose = document.getElementById("radar-panel-close-btn");
    if (rPanelClose) rPanelClose.addEventListener("click", window.closeRadarPanel);
    const rPanelSrch = document.getElementById("radar-panel-search");
    if (rPanelSrch) rPanelSrch.addEventListener("input", window.renderRadarSiteList);
    
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
    window.openRadarSettingsFrom = function(opener, isBack = false) { 
        if (!isBack) { const curr = window.getCurrentOpenMenu(); if (curr) window.menuHistory.push(curr); }
        window.closeAllMenus(); 
        if (radarSettingsPopup) radarSettingsPopup.classList.add("open"); 
    };
    window.closeRadarSettings = function() { if (radarSettingsPopup) radarSettingsPopup.classList.remove("open"); };
    
    const rPanelSett = document.getElementById("radar-panel-settings-btn");
    if (rPanelSett) rPanelSett.addEventListener("click", () => window.openRadarSettingsFrom("radar"));
    const rSettClose = document.getElementById("radar-settings-close-btn");
    if (rSettClose) rSettClose.addEventListener("click", window.closeRadarSettings);
    const rSettBack = document.getElementById("radar-settings-back-btn");
    if (rSettBack) rSettBack.addEventListener("click", window.goBack);
    
    if (fabMosaic) fabMosaic.addEventListener("click", (e) => { e.stopPropagation(); if (radarPanel) radarPanel.classList.contains("open") ? window.closeRadarPanel() : window.openRadarPanel(); });
    if (fabSettings) fabSettings.addEventListener("click", () => { if (settingsPopup) settingsPopup.classList.contains("open") ? window.closeSettings() : window.openSettings(); });
    if (debugInput) debugInput.addEventListener("change", window.handleDebugUpload);
    
    if (pillInfoBtn) {
        pillInfoBtn.addEventListener("click", () => {
            if (!window.activeSiteIdForData || !window.activeRadarProductCode) return;
            const site = window.allRadarSitesData.find((s) => s.properties.id.toLowerCase() === window.activeSiteIdForData);
            if (!site) return;
            const type = site.properties.stationType;
            let next;
            if (type === "TDWR") {
                if (window.activeRadarProductCode === "bref1") next = "brefl";
                else if (window.activeRadarProductCode === "brefl") next = "bvel";
                else next = "bref1";
            } else {
                next = window.activeRadarProductCode === "sr_bref" ? "sr_bvel" : "sr_bref";
            }
            window.toggleRadarProduct(window.activeSiteIdForData, next);
        });
    }
    
    // --- TEXT POPUP HANDLERS FOR MAP DETAILS ---
    const fullAlertPopup = document.createElement("div");
    fullAlertPopup.id = "full-alert-text-popup";
    fullAlertPopup.className = "standard-glass";
    fullAlertPopup.innerHTML = `<div id="full-alert-text-popup-header"><div id="full-alert-text-popup-title"><i class="material-symbols-rounded">warning</i><span id="full-alert-text-popup-title-text"></span></div><button id="full-alert-text-popup-close" aria-label="Close"><i class="material-symbols-rounded">close</i></button></div><div id="full-alert-text-popup-body"><div id="full-alert-text-content"></div></div>`;
    document.body.appendChild(fullAlertPopup);
    document.getElementById("full-alert-text-popup-close").addEventListener("click", () => { fullAlertPopup.classList.remove("open"); });
    window.closeFullAlertPopup = () => fullAlertPopup.classList.remove("open");
    
    const attributionBubble = document.getElementById("attribution-bubble");
    attributionBubble.addEventListener("click", (event) => { event.stopPropagation(); attributionBubble.classList.toggle("expanded"); });
    
    if (window.saveSettingsEnabled && urlParams.get("s")) window.saveCurrentState();
    setTimeout(window.updateGreenStatusIndicators, 500);
});

// --- GEOLOCATE INITIAL LANDING PAGE ATTEMPT ---
window.geocodeAndPlaceMarker = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const loc = urlParams.get("l");
    if (!loc) return;
    try { 
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.replace(/-/g, " "))}&format=json&limit=1`);
        const data = await res.json(); 
        if (data.length > 0) { 
            const lon = parseFloat(data[0].lon), lat = parseFloat(data[0].lat); 
            locationSearchMarker = new maplibregl.Marker({ color: "#FFC300", scale: 0.6 }).setLngLat([lon, lat]).addTo(window.map); 
            const sBtn = document.getElementById("fab-search-btn");
            if (sBtn) sBtn.classList.add("status-on");
            window.map.flyTo({ center: [lon, lat], zoom: 7, essential: true }); 
        } 
    } catch (e) {}
};

// --- MAP POPUP SYSTEM & INTERFACES ---
window.closeAllPopups = function() {
    document.querySelectorAll(".maplibregl-popup").forEach((p) => p.remove());
    currentMapPopup = null;
    currentStackedAlertsOnMap = [];
    currentStackedAlertIndex = 0;
    if (window.closeFullAlertPopup) window.closeFullAlertPopup();
};

window.showAlertMapPopup = function(items, clicked) {
    window.closeAllPopups();
    currentStackedAlertsOnMap = items;
    currentStackedAlertIndex = 0;
    const div = document.createElement("div");
    div.className = "map-popup-base map-alert-popup-accent-top";
    
    const update = () => {
        const item = currentStackedAlertsOnMap[currentStackedAlertIndex];
        if (!item) { window.closeAllPopups(); return; }
        const props = item.properties;
        let title, tags = "", color;
        
        if (item.type === "alert") {
            const params = props.parameters || {};
            title = props.specificEventName || props.event;
            color = props.displayColor || "#808080";
            if (props.expires) {
                const sentDate = window.parseApiDate(props.sent);
                const expireDate = window.parseApiDate(props.expires);
                tags += `<p><strong>Expires:</strong> ${window.formatDateWithTz(expireDate, window.getEffectiveTz(), window.getSmartDateOptions(expireDate, sentDate))}</p>`;
            }
            ["tornadoDetection", "waterspoutDetection", "flashFloodDetection"].forEach((k) => {
                if (params[k]) {
                    let label = k.replace("Detection", "").replace("flash", "Flash ");
                    label = label === "tornado" ? "Tornado" : label.charAt(0).toUpperCase() + label.slice(1);
                    tags += `<p><strong>${label}:</strong> ${window.formatThreatValue(params[k][0])}</p>`;
                }
            });
            const dmg = params.tornadoDamageThreat?.[0] || params.thunderstormDamageThreat?.[0] || params.flashFloodDamageThreat?.[0];
            if (dmg) tags += `<p><strong>Threat:</strong> ${window.formatThreatValue(dmg)}</p>`;
            if (params.maxWindGust && params.maxWindGust[0] !== "0 MPH") tags += `<p><strong>Winds:</strong> ${params.maxWindGust[0].replace("MPH", "mph")}</p>`;
            if (params.maxHailSize && params.maxHailSize[0] !== "0.00") tags += `<p><strong>Hail:</strong> ${params.maxHailSize[0]}"</p>`;
        } else {
            title = `SPC Day ${window.activeSpcDay} Outlook`;
            color = props.fill || "#FFFFFF";
            tags += `<p><strong>Risk:</strong> ${window.formatSpcLabel(props.LABEL || props.LABEL2)}</p>`;
        }
        
        div.style.borderTop = `5px solid ${color}80`;
        let pager = currentStackedAlertsOnMap.length > 1 ? `<div class="alert-pager">${currentStackedAlertsOnMap.map((_, i) => `<div class="pager-dot ${i === currentStackedAlertIndex ? "active" : ""}" data-index="${i}"></div>`).join("")}</div>` : "";
        div.innerHTML = `<h4>${title}</h4><div class="popup-content-area">${tags}<ul><li><button id="full-text-button">Full Text</button></li></ul></div>${pager}`;
        
        const fullTxtBtn = div.querySelector("#full-text-button");
        if (fullTxtBtn) {
            fullTxtBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (item.type === "alert") window.showFullAlertTextPopup(item.feature || item);
                else window.showFullSpcTextPopup(item);
            });
        }
        div.querySelectorAll(".pager-dot").forEach((d) => (d.onclick = (e) => {
            currentStackedAlertIndex = parseInt(e.target.dataset.index);
            update();
        }));
    };
    
    update();
    currentMapPopup = new maplibregl.Popup({ closeOnClick: true, closeButton: false, anchor: "bottom", className: "custom-map-popup-container" })
        .setLngLat(clicked)
        .setDOMContent(div)
        .addTo(window.map);
};

window.showFullAlertTextPopup = async function(f) {
    const props = f.properties;
    const params = props.parameters || {};
    const popup = document.getElementById("full-alert-text-popup");
    const titleEl = document.getElementById("full-alert-text-popup-title-text");
    const contentEl = document.getElementById("full-alert-text-content");
    
    window.closeAllMenus();
    const sentD = window.parseApiDate(props.sent);
    const expireD = window.parseApiDate(props.expires);
    const sentStr = props.sent ? `<div class="full-alert-meta-row"><strong>Sent:</strong> ${window.formatDateFull(sentD, window.getEffectiveTz())}</div>` : "";
    const expiresStr = props.expires ? `<div class="full-alert-meta-row"><strong>Expires:</strong> ${window.formatDateFull(expireD, window.getEffectiveTz())}</div>` : "";
    const areaStr = props.areaDesc ? `<div class="full-alert-meta-row"><strong>Affected:</strong> ${props.areaDesc}</div>` : "";
    const metaHTML = `${sentStr}${expiresStr}${areaStr}<div class="full-alert-section-label" style="padding-top:10px;">Description</div>`;
    
    if (props.url && typeof props.url === "string" && props.id && (props.id.startsWith("md") || props.id.startsWith("ww"))) {
        let validatedUrl = null; try { validatedUrl = new URL(props.url).href; } catch (e) {}
        if (titleEl) titleEl.textContent = props.specificEventName;
        if (contentEl) contentEl.innerHTML = `${metaHTML}<p>Loading...</p>`;
        if (popup) popup.classList.add("open"); 
        const body = document.getElementById("full-alert-text-popup-body");
        if (body) body.scrollTop = 0;
        if (!validatedUrl) { if (contentEl) contentEl.innerHTML = `${metaHTML}<p>Could not load text.</p>`; return; }
        try {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(validatedUrl)}`);
            const text = await res.text();
            const pre = new DOMParser().parseFromString(text, "text/html").querySelector("pre");
            if (contentEl) contentEl.innerHTML = `${metaHTML}<p>${window.formatNwsText(pre ? pre.textContent : "Not found.")}</p>`;
        } catch (e) {
            if (contentEl) contentEl.innerHTML = `${metaHTML}<p>Failed to load text.</p><p><a href="${validatedUrl}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
        }
        return;
    }
    const formattedD = window.formatNwsText(props.description);
    const formattedI = window.formatNwsText(props.instruction);
    const isConvectiveWatch = props.event === "Tornado Watch" || props.event === "Severe Thunderstorm Watch";
    
    let watchNumber = null;
    if (isConvectiveWatch && params.VTEC && params.VTEC[0]) {
        const vtecParts = params.VTEC[0].split(".");
        if (vtecParts.length >= 6) watchNumber = vtecParts[5];
    }
    
    if (titleEl) titleEl.textContent = props.specificEventName || props.event;
    if (contentEl) contentEl.innerHTML = `${metaHTML}<div id="alert-description-container"><p>${watchNumber ? "Loading..." : formattedD}</p></div>${props.instruction ? `<div class="full-alert-section-label">Instructions</div><p>${formattedI}</p>` : ""}`;
    if (popup) popup.classList.add("open"); 
    const body = document.getElementById("full-alert-text-popup-body");
    if (body) body.scrollTop = 0;
    
    if (watchNumber) {
        try {
            const url = `https://www.spc.noaa.gov/products/watch/ww${watchNumber}.html`;
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            const text = await res.text();
            const pre = new DOMParser().parseFromString(text, "text/html").querySelector("pre");
            const spcText = pre ? pre.textContent : null;
            const descContainer = document.getElementById("alert-description-container");
            if (spcText && descContainer) descContainer.innerHTML = `<p>${window.formatNwsText(spcText)}</p>`;
            else if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
        } catch (e) {
            const descContainer = document.getElementById("alert-description-container");
            if (descContainer) descContainer.innerHTML = `<p>${formattedD}</p>`;
        }
    }
};

window.showFullSpcTextPopup = async function(item) {
    const popup = document.getElementById("full-alert-text-popup");
    const titleEl = document.getElementById("full-alert-text-popup-title-text");
    const contentEl = document.getElementById("full-alert-text-content");
    
    window.closeAllMenus();
    const spcDay = parseInt(window.activeSpcDay);
    if (titleEl) titleEl.textContent = spcDay >= 4 ? "SPC Day 4-8 Discussion" : `SPC Day ${window.activeSpcDay} Discussion`;
    if (contentEl) contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Loading...</p>`;
    if (popup) popup.classList.add("open"); 
    const body = document.getElementById("full-alert-text-popup-body");
    if (body) body.scrollTop = 0;
    
    const text = await window.fetchSpcOutlookText(window.activeSpcDay);
    if (text === "Failed to load.") {
        const url = parseInt(window.activeSpcDay) >= 4 ? "https://www.spc.noaa.gov/products/exper/day4-8/index.html" : `https://www.spc.noaa.gov/products/outlook/day${window.activeSpcDay}otlk.html`;
        if (contentEl) contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>Failed to load text.</p><p><a href="${url}" target="_blank" style="color:#6cb8ff;text-decoration:underline;">View original page</a></p>`;
    } else if (contentEl) {
        contentEl.innerHTML = `<div class="full-alert-section-label">Description</div><p>${window.formatNwsText(text)}</p>`;
    }
};

window.handleDebugUpload = function(e) {
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

// --- MAP OVERLAYS EVENT HANDLERS ---
window.map.on("load", async () => {
    let willFlyToRadar = false;
    await window.PersistentCache.init();
    
    // Register sources & layers with MapLibre GL
    let symbolId;
    for (const l of window.map.getStyle().layers) {
        if (l.type === "symbol") { symbolId = l.id; break; }
    }
    
    window.spcSources.forEach((s) => {
        if (!window.map.getSource(s.id)) window.map.addSource(s.id, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    });
    
    if (!window.map.getSource("weather-radar")) {
        const ts = Math.floor(Date.now() / 60000) * 60000;
        window.map.addSource("weather-radar", { type: "raster", tiles: [`https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${ts}`], tileSize: 256, scheme: "xyz" });
    }
    
    if (!window.map.getSource("alerts-poly")) window.map.addSource("alerts-poly", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    if (!window.map.getSource("alerts-zone")) window.map.addSource("alerts-zone", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    if (!window.map.getSource("alerts-md")) window.map.addSource("alerts-md", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    if (!window.map.getSource("alerts-poly-watch")) window.map.addSource("alerts-poly-watch", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    if (!window.map.getSource("highlight-source")) window.map.addSource("highlight-source", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    
    if (window.allRadarSitesData.length === 0) {
        try {
            const res = await fetch("https://api.weather.gov/radar/stations?stationType=WSR-88D,TDWR");
            const data = await res.json();
            window.allRadarSitesData = data.features.map((f) => ({ ...f, properties: { ...f.properties, isOffline: false, statusError: false } }));
        } catch (e) {
            console.error("Critical: Station directory fetch failed.", e);
        }
    }
    
    if (!window.map.getSource("radar-sites")) {
        window.map.addSource("radar-sites", { type: "geojson", data: { type: "FeatureCollection", features: window.allRadarSitesData } });
    }
    
    const colorExp = ["coalesce", ["get", "displayColor"], "#808080"];
    const aVis = window.alertsEnabled ? "visible" : "none";
    const sortKeyExp = ["-", 200, ["coalesce", ["get", "priorityScore"], 200]];
    
    if (!window.map.getLayer(window.layerIds.alertsZone)) {
        window.map.addLayer({ id: window.layerIds.alertsZone, type: "fill", source: "alerts-zone", paint: { "fill-color": colorExp, "fill-opacity": 0.05 }, layout: { visibility: aVis, "fill-sort-key": sortKeyExp }, filter: ["==", "geometryType", "zone"] }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsZoneBorder)) {
        window.map.addLayer({ id: window.layerIds.alertsZoneBorder, type: "line", source: "alerts-zone", paint: { "line-color": colorExp, "line-width": 1 }, layout: { visibility: aVis, "line-sort-key": sortKeyExp }, filter: ["==", "geometryType", "zone"] }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsPolyWatch)) {
        window.map.addLayer({ id: window.layerIds.alertsPolyWatch, type: "fill", source: "alerts-poly-watch", paint: { "fill-color": colorExp, "fill-opacity": 0.05 }, layout: { visibility: aVis, "fill-sort-key": sortKeyExp } }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsPolyWatchBorder)) {
        window.map.addLayer({ id: window.layerIds.alertsPolyWatchBorder, type: "line", source: "alerts-poly-watch", paint: { "line-color": colorExp, "line-width": 2 }, layout: { visibility: aVis, "line-sort-key": sortKeyExp } }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsMd)) {
        window.map.addLayer({ id: window.layerIds.alertsMd, type: "fill", source: "alerts-md", paint: { "fill-color": colorExp, "fill-opacity": 0.05 }, layout: { visibility: aVis, "fill-sort-key": sortKeyExp } }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsMdBorder)) {
        window.map.addLayer({ id: window.layerIds.alertsMdBorder, type: "line", source: "alerts-md", paint: { "line-color": colorExp, "line-width": 2 }, layout: { visibility: aVis, "line-sort-key": sortKeyExp } }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsPolygon)) {
        window.map.addLayer({ id: window.layerIds.alertsPolygon, type: "fill", source: "alerts-poly", paint: { "fill-color": colorExp, "fill-opacity": 0.15 }, layout: { visibility: aVis, "fill-sort-key": sortKeyExp }, filter: ["==", "geometryType", "polygon"] }, symbolId);
    }
    if (!window.map.getLayer(window.layerIds.alertsPolygonBorder)) {
        window.map.addLayer({ id: window.layerIds.alertsPolygonBorder, type: "line", source: "alerts-poly", paint: { "line-color": colorExp, "line-width": 2 }, layout: { visibility: aVis, "line-sort-key": sortKeyExp }, filter: ["==", "geometryType", "polygon"] }, symbolId);
    }
    
    if (!window.map.getLayer("highlight-fill")) window.map.addLayer({ id: "highlight-fill", type: "fill", source: "highlight-source", paint: { "fill-color": "#ffffff", "fill-opacity": 0, "fill-opacity-transition": { duration: 750 } } });
    if (!window.map.getLayer("highlight-line")) window.map.addLayer({ id: "highlight-line", type: "line", source: "highlight-source", paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 0, "line-opacity-transition": { duration: 750 } } });
    if (!window.map.getLayer(window.layerIds.radar)) {
        window.map.addLayer({ id: window.layerIds.radar, type: "raster", source: "weather-radar", layout: { visibility: window.mosaicVisible() } }, window.layerIds.alertsZone);
    }
    
    window.spcSources.forEach((s) => {
        let isVis = window.activeSpcDay !== "none" && window.layerIds.spc["day" + window.activeSpcDay]?.[window.activeSpcType] === s.id ? "visible" : "none";
        if (!window.map.getLayer(s.id)) window.map.addLayer({ id: s.id, type: "fill", source: s.id, paint: { "fill-color": ["get", "fill"], "fill-opacity": 0.05 }, layout: { visibility: isVis } }, window.layerIds.radar);
        if (!window.map.getLayer(`${s.id}-border`)) window.map.addLayer({ id: `${s.id}-border`, type: "line", source: s.id, paint: { "line-color": ["get", "fill"], "line-width": 2 }, layout: { visibility: isVis } }, window.layerIds.radar);
    });
    
    const sitesToggle = document.getElementById("radar-sites-toggle");
    if (!window.map.getLayer(window.layerIds.radarSites)) {
        window.map.addLayer({ id: window.layerIds.radarSites, type: "circle", source: "radar-sites", paint: { "circle-radius": 4, "circle-stroke-color": "white", "circle-stroke-width": 1.5, "circle-color": window.radarSiteDefaultColor }, layout: { visibility: sitesToggle ? (sitesToggle.checked ? "visible" : "none") : "visible" } });
    }
    
    if (window.applyMapAlertFilters) window.applyMapAlertFilters();
    window.updateSpcLayerVisibility();
    window.updateSpcOutlooks();
    window.geocodeAndPlaceMarker();
    window.checkRadarStatus();
    
    // Process URL radar request queries
    const urlParams = new URLSearchParams(window.location.search);
    let urlRadarRequest = null;
    const sParam = urlParams.get("s");
    if (sParam) {
        const flags = sParam.toLowerCase().split(",");
        flags.forEach((flag) => {
            if (flag.length === 5 && /^[rvl][a-z0-9]{4}$/i.test(flag)) {
                urlRadarRequest = { id: flag.substring(1).toUpperCase(), type: flag.charAt(0) };
            }
        });
    }
    
    if (urlRadarRequest) {
        const site = window.allRadarSitesData.find((s) => s.properties.id === urlRadarRequest.id);
        if (site) {
            window.activeRadarProductCode = urlRadarRequest.type === "r" ? (site.properties.stationType === "TDWR" ? "bref1" : "sr_bref") : urlRadarRequest.type === "v" ? (site.properties.stationType === "TDWR" ? "bvel" : "sr_bvel") : (site.properties.stationType === "TDWR" ? "brefl" : "sr_bref");
            window.activeSiteIdForData = urlRadarRequest.id.toLowerCase();
        }
    }
    
    if (window.activeSiteIdForData && window.activeRadarProductCode) {
        const s = window.activeSiteIdForData, p = window.activeRadarProductCode;
        window.activeSiteIdForData = window.activeRadarProductCode = null;
        window.toggleRadarProduct(s, p);
        if (window.flyToRadarSetting) {
            const site = window.allRadarSitesData.find((site) => site.properties.id.toLowerCase() === s);
            if (site) {
                willFlyToRadar = true;
                window.map.flyTo({ center: site.geometry.coordinates, zoom: 7, essential: true });
            }
        }
    }
    
    if (!willFlyToRadar && window.saveSettingsEnabled) {
        const savedZoom = localStorage.getItem("lastZoom"), savedCenter = localStorage.getItem("lastCenter");
        if (savedZoom && savedCenter) {
            try { window.map.flyTo({ center: JSON.parse(savedCenter), zoom: parseFloat(savedZoom), essential: true }); } catch (e) {}
        }
    }
    
    // Core timed looping processes setup
    setInterval(window.checkRadarStatus, 480000);
    setInterval(window.updateSpcOutlooks, 480000);
    await Promise.all([window.refreshNwsAlerts(true), window.updatePlacefileAlerts(true)]);
    window.isInitialLoad = false;
    window.startAlertIntervals();
    
    setInterval(window.updateRadar, 90000);
    setInterval(window.updateSingleSiteRadar, 60000);
    
    window.map.on("moveend", () => {
        if (window.saveSettingsEnabled) {
            localStorage.setItem("lastZoom", window.map.getZoom());
            localStorage.setItem("lastCenter", JSON.stringify(window.map.getCenter()));
        }
    });
    
    window.map.on("contextmenu", (e) => {
        e.preventDefault();
        window.closeAllPopups();
        let nearest = null;
        let min = Infinity;
        window.allRadarSitesData.forEach((s) => {
            const props = s.properties;
            if (props.isOffline) return;
            if (window.radarSiteSelectionMode === "Both" || window.radarSiteSelectionMode === props.stationType) {
                const dist = e.lngLat.distanceTo(new maplibregl.LngLat(s.geometry.coordinates[0], s.geometry.coordinates[1]));
                if (dist < min) { min = dist; nearest = s; }
            }
        });
        if (nearest) {
            const id = nearest.properties.id.toLowerCase(), type = nearest.properties.stationType;
            let prod = window.activeRadarProductCode ? window.activeRadarProductCode.includes("vel") ? (type === "TDWR" ? "bvel" : "sr_bvel") : window.activeRadarProductCode === "brefl" ? (type === "TDWR" ? "brefl" : "sr_bref") : (type === "TDWR" ? "bref1" : "sr_bref") : (type === "TDWR" ? "bref1" : "sr_bref");
            if (window.flyToRadarSetting) {
                window.map.flyTo({ center: nearest.geometry.coordinates, zoom: 7, essential: true });
                if (window.activeSiteIdForData !== id) window.toggleRadarProduct(id, prod);
            } else {
                window.toggleRadarProduct(id, prod);
            }
        }
    });
});

window.map.on("click", (e) => {
    if (currentMapPopup) { window.closeAllPopups(); return; }
    const features = window.map.queryRenderedFeatures(e.point, { layers: [window.layerIds.radarSites, window.layerIds.alertsZone, window.layerIds.alertsPolygon, window.layerIds.alertsMd, window.layerIds.alertsPolyWatch, ...window.allSpcLayerIds] });
    window.closeAllPopups();
    if (!features.length) return;
    const top = features[0];
    
    if (top.layer.id === window.layerIds.radarSites) {
        const site = window.allRadarSitesData.find((s) => s.properties.id === top.properties.id);
        if (site && !site.properties.isOffline) {
            const id = site.properties.id.toLowerCase(), type = site.properties.stationType;
            if (window.activeSiteIdForData === id) {
                window.removeSingleSiteLayer();
                window.activeRadarProductCode = window.activeSiteIdForData = null;
                window.map.setPaintProperty(window.layerIds.radarSites, "circle-color", window.radarSiteDefaultColor);
                window.updateMosaicVisibility();
                if (window.saveCurrentState) window.saveCurrentState();
                return;
            }
            let prod = window.activeRadarProductCode ? window.activeRadarProductCode.includes("vel") ? (type === "TDWR" ? "bvel" : "sr_bvel") : window.activeRadarProductCode === "brefl" ? (type === "TDWR" ? "brefl" : "sr_bref") : (type === "TDWR" ? "bref1" : "sr_bref") : (type === "TDWR" ? "bref1" : "sr_bref");
            window.toggleRadarProduct(id, prod);
            if (window.flyToRadarSetting) window.map.flyTo({ center: site.geometry.coordinates, zoom: 7, essential: true });
        }
    } else {
        const alerts = window.map.queryRenderedFeatures(e.point, { layers: [window.layerIds.alertsZone, window.layerIds.alertsPolygon, window.layerIds.alertsMd, window.layerIds.alertsPolyWatch] }).map((f) => {
            const found = [...window.globalPolyAlerts, ...window.globalZoneAlerts, ...window.globalMdAlerts, ...window.globalPolyWatchAlerts].find((a) => a.properties.id === f.properties.id);
            return found ? { type: "alert", feature: found, properties: found.properties } : null;
        }).filter(Boolean);
        
        const spc = window.activeSpcDay !== "none" ? window.map.queryRenderedFeatures(e.point, { layers: window.allSpcLayerIds }).map((f) => ({ type: "outlook", properties: f.properties })) : [];
        const items = [...new Map(alerts.concat(spc).map((i) => [i.properties.id || i.properties.LABEL, i])).values()];
        if (items.length) window.showAlertMapPopup(items, e.lngLat);
    }
});

[window.layerIds.alertsZone, window.layerIds.alertsPolygon, window.layerIds.alertsMd, window.layerIds.alertsPolyWatch, window.layerIds.radarSites, ...window.allSpcLayerIds].forEach((l) => {
    window.map.on("mouseenter", l, () => (window.map.getCanvas().style.cursor = "pointer"));
    window.map.on("mouseleave", l, () => (window.map.getCanvas().style.cursor = ""));
});

// --- KEYBOARD ACCESSIBILITY & MACROS BINDINGS ---
function handleOutlookShortcut(day) {
    const types = window.outlookTypes[day];
    if (!types) return;
    let next = window.activeSpcDay === day ? types[(types.indexOf(window.activeSpcType) + 1) % types.length] : types[0];
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
    
    // Space and comma/period logic for frame loop navigation
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
    if (e.code === "KeyA") { window.toggleAllAlerts(); return; }
    if (e.code === "Backspace") {
        localStorage.clear();
        document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
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
        window.showToast(`Radar Sites: ${window.showSitesMode === "None" ? "Off" : "On"}`);
        return;
    }
    if (e.code === "KeyL") { window.toggleMyLocation(!window.myLocationEnabled); return; }
    if (e.code === "KeyZ") {
        window.zoneAlertsEnabled = !window.zoneAlertsEnabled;
        const toggleUI = document.getElementById("zone-alerts-settings-toggle-ui");
        if (toggleUI) toggleUI.classList.toggle("active");
        if (window.zoneAlertsEnabled && window.alertsEnabled) {
            window.showToast("Zone Alerts: On");
            if (window.map.getSource("alerts-poly-watch")) window.map.getSource("alerts-poly-watch").setData({ type: "FeatureCollection", features: [] });
            window.globalPolyWatchAlerts = [];
            window.refreshNwsAlerts(true);
        } else if (!window.zoneAlertsEnabled) {
            window.showToast("Zone Alerts: Off");
            if (window.map.getSource("alerts-zone")) window.map.getSource("alerts-zone").setData({ type: "FeatureCollection", features: [] });
            window.globalZoneAlerts = [];
            if (window.alertsEnabled) {
                window.refreshNwsAlerts(true);
                window.updatePlacefileAlerts(true);
            }
        }
    }
    else if (e.code === "Backquote") {
        window.activeSpcDay = window.activeSpcType = "none";
        window.updateSpcLayerVisibility();
        if (window.saveCurrentState) window.saveCurrentState();
        window.showToast("Outlook: Off");
        window.updateGreenStatusIndicators();
    }
    else if (e.code.startsWith("Digit")) {
        handleOutlookShortcut(e.code.slice(5));
    }
    
    if (window.activeSiteIdForData) { 
        const s = window.allRadarSitesData.find((site) => site.properties.id.toLowerCase() === window.activeSiteIdForData); 
        if (s) {
            let p = null;
            if (e.code === "KeyR") {
                if (s.properties.stationType === "TDWR") {
                    p = window.activeRadarProductCode === "bref1" ? "brefl" : "bref1";
                } else {
                    p = "sr_bref";
                }
            } else if (e.code === "KeyV") {
                p = (s.properties.stationType === "TDWR" ? "bvel" : "sr_bvel");
            }
            if (p && p !== window.activeRadarProductCode) window.toggleRadarProduct(window.activeSiteIdForData, p); 
        }
    }
});

// --- SIDEBAR MODULE COORD INJECTION ---
(function () {
    const sidebarBtn = document.getElementById("fab-alerts");
    const sidebar = document.getElementById("alerts-sidebar");
    const closeBtn = document.getElementById("alerts-sidebar-close");
    const listEl = document.getElementById("alerts-sidebar-list");
    const emptyEl = document.getElementById("alerts-sidebar-empty");
    const countEl = document.getElementById("alerts-sidebar-count");
    
    window.openSidebar = function(isBack = false) { 
        if (!isBack) window.menuHistory = [];
        window.closeAllMenus(); 
        if (sidebar) sidebar.classList.add("open"); 
        if (sidebarBtn) sidebarBtn.classList.add("active"); 
        if (listEl) listEl.scrollTop = 0; 
        renderSidebar(); 
    };
    
    window.closeSidebar = function() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBtn) sidebarBtn.classList.remove("active");
        if (listEl) listEl.querySelectorAll(".sidebar-alert-group.open").forEach((g) => g.classList.remove("open"));
    };
    
    if (sidebarBtn) sidebarBtn.addEventListener("click", (e) => { e.stopPropagation(); if (sidebar) sidebar.classList.contains("open") ? window.closeSidebar() : window.openSidebar(); });
    if (closeBtn) closeBtn.addEventListener("click", window.closeSidebar); 
    
    const sidebarSett = document.getElementById("alerts-sidebar-settings");
    if (sidebarSett) sidebarSett.addEventListener("click", () => { window.openAlertSettings(); }); 
    const sidebarTgl = document.getElementById("alerts-sidebar-toggle");
    if (sidebarTgl) sidebarTgl.addEventListener("click", () => { window.toggleAllAlerts(); }); 
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.closeSidebar(); });
    
    function getAllActiveAlerts() { 
        const all = [...window.globalPolyAlerts, ...window.globalZoneAlerts, ...(window.mesoDiscussionsEnabled ? window.globalMdAlerts : []), ...window.globalPolyWatchAlerts], seen = new Set(); 
        const unique = all.filter((f) => { const id = f.properties.id; if (seen.has(id)) return false; seen.add(id); return true; }); 
        unique.sort((a, b) => {
            const scoreA = window.getAlertPriorityScore(a);
            const scoreB = window.getAlertPriorityScore(b);
            if (scoreA !== scoreB) return scoreA - scoreB;
            const timeA = a.properties.sent ? new Date(a.properties.sent).getTime() : 0;
            const timeB = b.properties.sent ? new Date(b.properties.sent).getTime() : 0;
            return timeB - timeA;
        }); 
        return unique; 
    }
    
    function renderSidebar() {
        const alerts = getAllActiveAlerts(), count = alerts.length;
        if (countEl) countEl.textContent = count > 0 ? `(${count})` : "";
        const searchQuery = (document.getElementById("alerts-sidebar-search")?.value || "").toLowerCase().trim();
        const openGroups = new Set();
        if (listEl) Array.from(listEl.querySelectorAll(".sidebar-alert-group.open")).forEach((g) => { openGroups.add(g.dataset.eventType); });
        if (listEl) Array.from(listEl.children).forEach((c) => { if (c.id !== "alerts-sidebar-empty") c.remove(); });
        
        if (count === 0) {
            const icon = document.getElementById("alerts-sidebar-empty-icon"), text = document.getElementById("alerts-sidebar-empty-text");
            if (!window.alertsEnabled) {
                if (icon) icon.textContent = "notifications_off";
                if (text) text.textContent = "Alerts are off";
            } else if (window.isInitialLoad) {
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
            const evt = feature.properties.event || "Alert", key = evt.startsWith("Mesoscale Discussion") ? "Mesoscale Discussion" : evt; 
            if (!groups.has(key)) groups.set(key, []); 
            groups.get(key).push(feature); 
        });
        
        groups.forEach((groupAlerts, eventType) => {
            if (searchQuery && !eventType.toLowerCase().includes(searchQuery)) return;
            const color = groupAlerts[0].properties.displayColor || "#808080", group = document.createElement("div"); group.className = "sidebar-alert-group"; group.dataset.eventType = eventType;
            const isRecentlySent = (sentIso) => { if (!sentIso) return false; const d = new Date(sentIso); return !isNaN(d.getTime()) && (Date.now() - d.getTime()) <= 300000; };
            const groupHasNew = groupAlerts.some(f => f.properties.messageType === "Alert" && isRecentlySent(f.properties.sent)), groupHasUpdated = groupAlerts.some(f => f.properties.messageType === "Update" && isRecentlySent(f.properties.sent));
            
            const header = document.createElement("div"); header.className = "sidebar-alert-group-header"; header.style.borderLeftColor = `${color}80`;
            header.innerHTML = `<span class="group-label">${eventType}</span>${groupHasNew ? `<span class="alert-new-tag">New</span>` : ""}${groupHasUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}<span class="group-count">${groupAlerts.length}</span><i class="material-symbols-rounded group-chevron">expand_more</i>`;
            
            const items = document.createElement("div"); items.className = "sidebar-alert-group-items";
            if (openGroups.has(eventType)) group.classList.add("open");
            header.addEventListener("click", () => group.classList.toggle("open"));
            
            groupAlerts.forEach((feature) => {
                const props = feature.properties, itemColor = props.displayColor || "#808080", name = props.specificEventName || props.event || "Alert", area = props.areaDesc || "", timeRange = window.formatAlertTimeRange(props.sent, props.expires), itemIsNew = props.messageType === "Alert" && isRecentlySent(props.sent), itemIsUpdated = props.messageType === "Update" && isRecentlySent(props.sent);
                const item = document.createElement("div"); item.className = "sidebar-alert-item"; item.style.borderLeftColor = `${itemColor}80`;
                item.innerHTML = `<div class="sidebar-alert-content"><div class="sidebar-alert-name" style="display:flex;align-items:center;gap:6px;"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>${itemIsNew ? `<span class="alert-new-tag">New</span>` : ""}${itemIsUpdated ? `<span class="alert-updated-tag">Updated</span>` : ""}</div>${area ? `<div class="sidebar-alert-area">${area}</div>` : ""}${timeRange ? `<div class="sidebar-alert-expires">${timeRange}</div>` : ""}</div>`;
                
                item.addEventListener("click", () => { window.flyToAlert(feature); window.closeSidebar(); });
                items.appendChild(item);
            });
            group.appendChild(header); group.appendChild(items);
            if (listEl) listEl.appendChild(group);
        });
    }
    
    window.renderAlertsSidebar = renderSidebar;
    if (sidebarBtn) sidebarBtn.addEventListener("click", () => { if (sidebar && sidebar.classList.contains("open")) renderSidebar(); });
    setInterval(renderSidebar, 10000);
    const sidebarSearchInput = document.getElementById("alerts-sidebar-search");
    if (sidebarSearchInput) sidebarSearchInput.addEventListener("input", renderSidebar);
    setTimeout(renderSidebar, 3000);
})();

// --- SPC OUTLOOK SUBPANEL INJECTION ---
window.renderSpcOutlookPanel = function() {
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
    const typeNames = { cat: "Categorical", torn: "Tornado", wind: "Wind", hail: "Hail", prob: "Probabilistic" };
    let anyDay = false;
    
    dayConfigs.forEach(({ id, label, types }) => {
        const typeData = [];
        types.forEach(type => {
            const sourceId = `spc-day${id}-${type}`;
            const highest = window.getSpcSourceHighest(sourceId);
            if (highest) typeData.push({ type, highest, sourceId });
        });
        if (typeData.length === 0) return;
        anyDay = true;
        
        const catData = typeData.find(t => t.type === "cat") || typeData.find(t => t.type === "prob") || typeData[0];
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
                    window.activeSpcDay = "none"; window.activeSpcType = "none"; window.showToast("Outlook: Off");
                } else {
                    window.activeSpcDay = id; window.activeSpcType = type; window.showToast(`Outlook: Day ${id} ${typeNames[type] || "Prob."}`);
                }
                window.updateSpcLayerVisibility();
                if (window.saveCurrentState) window.saveCurrentState();
                window.updateGreenStatusIndicators();
                window.renderSpcOutlookPanel();
            });
            items.appendChild(item);
        });
        group.appendChild(header); group.appendChild(items);
        body.appendChild(group);
    });
    
    if (!anyDay) {
        const empty = document.createElement("div");
        empty.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#ffffff40;font-size:14px;padding:40px 20px;text-align:center;";
        const isLoading = Object.keys(window.spcSourceCache).length === 0;
        empty.innerHTML = `<i class="material-symbols-rounded" style="font-size:36px;">${isLoading ? "hourglass_empty" : "check_circle"}</i><span>${isLoading ? "Loading outlooks..." : "No active outlooks"}</span>`;
        body.appendChild(empty);
    }
};

window.updateSpcOutlookPanelState = function() {
    window.renderSpcOutlookPanel();
};