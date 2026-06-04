/**
 * WeatherScout - Radar & Station Loop Control Module
 */

// --- GLOBAL RADAR STATE ---
window.allRadarSitesData = [];
window.activeSiteIdForData = null;
window.activeRadarProductCode = null;
window.radarSiteSelectionMode = "Both";
window.showSitesMode = "Both";
window.flyToRadarSetting = false;
window.radarLoopMinutes = 30;

// --- RADAR COLOR MAPS ---
window.radarSiteDefaultColor = [
    "case",
    ["==", ["get", "statusError"], true], "#8800FF",
    ["==", ["get", "isOffline"], true], "#ff0000",
    ["==", ["get", "stationType"], "WSR-88D"], "#0099ff",
    ["==", ["get", "stationType"], "TDWR"], "#ff9900",
    "#808080"
];

// --- CORE RADAR VISIBILITY LOGIC ---
window.mosaicVisible = function() {
    const radarToggle = document.getElementById("radar-toggle");
    return radarToggle ? (radarToggle.checked ? "visible" : "none") : "visible";
};

window.isMosaicVisible = function() {
    const toggle = document.getElementById("radar-toggle");
    return toggle && toggle.checked && window.map.getSource("weather-radar");
};

window.isSingleSiteVisible = function() {
    return !!(window.activeSiteIdForData && window.activeRadarProductCode && window.map.getLayer(window.layerIds.singleSiteRadar));
};

window.isAnyRadarVisible = function() {
    return window.isMosaicVisible() || window.isSingleSiteVisible();
};

window.updateMosaicVisibility = function() {
    const radarToggle = document.getElementById("radar-toggle");
    const mosaicOn = radarToggle ? radarToggle.checked : true;
    const siteActive = window.map.getLayer(window.layerIds.singleSiteRadar);
    
    if (window.map.getLayer(window.layerIds.radar)) {
        window.map.setLayoutProperty(window.layerIds.radar, "visibility", siteActive ? "none" : mosaicOn ? "visible" : "none");
    }
};

window.updateShowSitesFilter = function() {
    document.querySelectorAll(".show-sites-option").forEach((opt) => {
        opt.classList.toggle("selected", opt.dataset.value === window.showSitesMode);
    });
    if (window.map.getLayer(window.layerIds.radarSites)) {
        if (window.showSitesMode === "None") {
            window.map.setLayoutProperty(window.layerIds.radarSites, "visibility", "none");
        } else {
            window.map.setLayoutProperty(window.layerIds.radarSites, "visibility", "visible");
            if (window.showSitesMode === "Both") {
                window.map.setFilter(window.layerIds.radarSites, null);
            } else {
                window.map.setFilter(window.layerIds.radarSites, ["==", ["get", "stationType"], window.showSitesMode]);
            }
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

// --- SINGLE SITE LAYER MANAGEMENT ---
window.removeSingleSiteLayer = function() {
    if (window.map.getLayer(window.layerIds.singleSiteRadar)) {
        window.map.removeLayer(window.layerIds.singleSiteRadar);
    }
    if (window.map.getSource("single-site-radar-source")) {
        window.map.removeSource("single-site-radar-source");
    }
    const pill = document.getElementById("radar-info-pill");
    if (pill) {
        pill.style.display = "none";
    }
};

window.toggleRadarProduct = function(stationId, productCode) {
    window.removeSingleSiteLayer();
    if (window.activeSiteIdForData === stationId && window.activeRadarProductCode === productCode) {
        window.activeRadarProductCode = window.activeSiteIdForData = null;
        window.map.setPaintProperty(window.layerIds.radarSites, "circle-color", window.radarSiteDefaultColor);
    } else {
        window.activeRadarProductCode = productCode;
        window.activeSiteIdForData = stationId;
        const ts = Math.floor(Date.now() / 120000) * 120000;
        const tileUrl = `https://opengeo.ncep.noaa.gov/geoserver/${stationId}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${stationId}_${productCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}&_=${ts}`;
        
        window.map.addSource("single-site-radar-source", { type: "raster", tiles: [tileUrl], tileSize: 256, attribution: "NOAA" });
        window.map.addLayer({ id: window.layerIds.singleSiteRadar, type: "raster", source: "single-site-radar-source", paint: {} }, window.layerIds.alertsZone);
        
        window.map.setPaintProperty(window.layerIds.radarSites, "circle-color", [
            "case", 
            ["==", ["get", "id"], stationId.toUpperCase()], "#00ff00", 
            ...window.radarSiteDefaultColor.slice(1)
        ]);
        
        const pillId = document.getElementById("pill-id-time");
        const pillProd = document.getElementById("pill-product");
        if (pillId) pillId.innerText = stationId.toUpperCase();
        if (pillProd) {
            pillProd.innerText = productCode.includes("vel") ? "Velocity" : productCode === "brefl" ? "LR Reflectivity" : "Reflectivity";
        }
        
        const radarPill = document.getElementById("radar-info-pill");
        if (radarPill) {
            radarPill.style.display = "flex";
        }
    }
    window.updateMosaicVisibility();
    if (window.saveCurrentState) {
        window.saveCurrentState();
    }
};

// --- DATA SOURCE REFRESH INGESTION ---
window.updateRadar = function() {
    try {
        if (window.map.getSource("weather-radar")) { 
            const ts = Math.floor(Date.now() / 60000) * 60000; 
            window.map.getSource("weather-radar").setTiles([`https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${ts}`]); 
        } 
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
    }
};

window.updateSingleSiteRadar = function(offsetMinutes) {
    try {
        if (window.map.getSource("single-site-radar-source") && window.activeSiteIdForData && window.activeRadarProductCode) { 
            const ts = Math.floor(Date.now() / 120000) * 120000;
            const timeParam = (offsetMinutes && offsetMinutes !== 0) ? `&TIME=${encodeURIComponent(new Date(Date.now() + offsetMinutes * 60000).toISOString())}` : ""; 
            window.map.getSource("single-site-radar-source").setTiles([`https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${ts}`]); 
        } 
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
    }
};

window.checkRadarStatus = async function(prefetchedData) {
    try {
        const bulk = prefetchedData || await (async () => {
            const res = await fetch(`https://api.weather.gov/radar/stations?stationType=WSR-88D,TDWR`);
            if (!res.ok) throw new Error();
            return res.json();
        })();
        const now = Date.now();
        const twenty = now - 1200000; // 20-minute offline boundary
        let changed = false;
        
        const statusMap = new Map(bulk.features.map((f) => [f.properties.id, f.properties.latency?.levelTwoLastReceivedTime]));
        window.allRadarSitesData = window.allRadarSitesData.map((site) => {
            const lastTime = statusMap.get(site.properties.id);
            const offline = lastTime ? new Date(lastTime).getTime() < twenty : true;
            if (site.properties.isOffline !== offline) {
                changed = true;
                return { ...site, properties: { ...site.properties, isOffline: offline, statusError: false } };
            }
            return site;
        });
        if (changed && window.map.getSource("radar-sites")) {
            window.map.getSource("radar-sites").setData({ type: "FeatureCollection", features: window.allRadarSitesData });
        }
    } catch (e) {
        console.error("Failed to parse radar status.", e);
    }
};

// --- ANIMATION COMPOSITING & LOOP CONTROL ---
(function() {
    const IEM_REL_MAP = {
        5: "nexrad-n0q-900913-m05m", 10: "nexrad-n0q-900913-m10m",
        15: "nexrad-n0q-900913-m15m", 20: "nexrad-n0q-900913-m20m",
        25: "nexrad-n0q-900913-m25m", 30: "nexrad-n0q-900913-m30m",
        35: "nexrad-n0q-900913-m35m", 40: "nexrad-n0q-900913-m40m",
        45: "nexrad-n0q-900913-m45m", 50: "nexrad-n0q-900913-m50m"
    };
    const FRAME_INTERVAL = 1000;
    let loopActive = false;
    let stepIndex = 0;
    let loopTimer = null;
    let OFFSETS = buildOffsets(window.radarLoopMinutes);

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
        const stamp = pad(snapped.getUTCFullYear(), 4) + pad(snapped.getUTCMonth() + 1, 2) + pad(snapped.getUTCDate(), 2) + pad(snapped.getUTCHours(), 2) + pad(snapped.getUTCMinutes(), 2);
        return `ridge::USCOMP-N0Q-${stamp}`;
    }

    window.setRadarLoopMinutes = function(minutes) {
        window.radarLoopMinutes = minutes;
        OFFSETS = buildOffsets(minutes);
        stepIndex = Math.min(stepIndex, OFFSETS.length - 1);
        if (loopActive) {
            clearTimeout(loopTimer);
            stepIndex = 0;
            applyFrame(stepIndex);
            scheduleNext();
        }
    };

    function applyMosaicFrame(offset) { 
        try {
            if (!window.map.getSource("weather-radar")) return; 
            const product = iemProductForOffset(offset); 
            const cacheBuster = offset < -50 ? product : Math.floor(Date.now() / 300000); 
            window.map.getSource("weather-radar").setTiles([`https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/${product}/{z}/{x}/{y}.png?_=${cacheBuster}`]); 
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
    }

    function applySingleSiteFrame(offset) { 
        try {
            if (!window.map.getSource("single-site-radar-source") || !window.activeSiteIdForData || !window.activeRadarProductCode) return; 
            const timeParam = offset !== 0 ? `&TIME=${encodeURIComponent(new Date(Date.now() + offset * 60000).toISOString())}` : ""; 
            window.map.getSource("single-site-radar-source").setTiles([`https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}${timeParam}&_=${Date.now()}`]); 
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
    }

    function applyFrame(idx) {
        const offset = OFFSETS[idx];
        if (window.isMosaicVisible()) applyMosaicFrame(offset);
        if (window.isSingleSiteVisible()) applySingleSiteFrame(offset);
    }

    function applyLive() { 
        const ts = Date.now(); 
        try {
            if (window.isMosaicVisible() && window.map.getSource("weather-radar")) {
                window.map.getSource("weather-radar").setTiles([`https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${ts}`]); 
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
        try {
            if (window.isSingleSiteVisible() && window.map.getSource("single-site-radar-source")) {
                window.map.getSource("single-site-radar-source").setTiles([`https://opengeo.ncep.noaa.gov/geoserver/${window.activeSiteIdForData}/ows?service=WMS&version=1.3.0&request=GetMap&layers=${window.activeSiteIdForData}_${window.activeRadarProductCode}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}&_=${ts}`]); 
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
    }

    function scheduleNext() {
        if (!loopActive) return;
        const isLive = stepIndex === OFFSETS.length - 1;
        if (isLive) {
            loopActive = false;
            return;
        }
        loopTimer = setTimeout(() => {
            if (!loopActive) return;
            stepIndex += 1;
            if (stepIndex === OFFSETS.length - 1) {
                applyLive();
                loopActive = false;
            } else {
                applyFrame(stepIndex);
                scheduleNext();
            }
        }, FRAME_INTERVAL);
    }

    window.startLoop = function() {
        loopActive = true;
        stepIndex = 0;
        applyFrame(stepIndex);
        scheduleNext();
    };

    window.stopLoop = function() {
        loopActive = false;
        clearTimeout(loopTimer);
        applyLive();
    };

    window.toggleRadarLoop = function() {
        loopActive ? window.stopLoop() : window.startLoop();
    };

    window.stepFrame = function(direction) {
        if (loopActive) {
            loopActive = false;
            clearTimeout(loopTimer);
        }
        if (direction < 0 && stepIndex === 0) return;
        if (direction > 0 && stepIndex === OFFSETS.length - 1) return;
        stepIndex += direction;
        applyFrame(stepIndex);
        if (stepIndex === OFFSETS.length - 1) {
            applyLive();
        }
    };

    window.addEventListener("unhandledrejection", (e) => {
        const r = e.reason;
        if (r && (r.name === "AbortError" || (typeof r.message === "string" && r.message.toLowerCase().includes("abort")))) {
            e.preventDefault();
        }
    });
})();