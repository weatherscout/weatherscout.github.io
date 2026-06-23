window.map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  center: [-96.5, 38],
  zoom: 4,
  attributionControl: false,
  maxTileCacheSize: 1000,
});

let currentMapPopup = null;
let currentStackedAlertsOnMap = [];
let currentStackedAlertIndex = 0;
let locationSearchMarker = null;
let locationSearchTimeout = null;

window.unselectRadar = function () {
  if (window.activeSiteIdForData) {
    window.removeSingleSiteLayer();
    window.activeRadarProductCode = window.activeSiteIdForData = null;
    if (window.map.getLayer(window.layerIds.radarSites)) {
      window.map.setPaintProperty(
        window.layerIds.radarSites,
        "circle-color",
        window.radarSiteDefaultColor,
      );
    }
    if (window.updateMosaicVisibility) window.updateMosaicVisibility();
    if (window.saveCurrentState) window.saveCurrentState();
    if (window.updateGreenStatusIndicators)
      window.updateGreenStatusIndicators();
    window.showToast("Radar Unselected");
  }
};

window.applyMapConstraints = function () {
  if (window.lockNorth) {
    window.map.setBearing(0);
    window.map.touchZoomRotate.disableRotation();
  } else {
    window.map.touchZoomRotate.enableRotation();
  }
  if (window.lockTilt) {
    window.map.setPitch(0);
    window.map.setMaxPitch(0);
  } else {
    window.map.setMaxPitch(60);
  }
  if (window.lockNorth && window.lockTilt) {
    window.map.dragRotate.disable();
  } else {
    window.map.dragRotate.enable();
  }
};

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

  const getArticle = (word) => {
    if (!word) return "a";
    const firstChar = word.trim().charAt(0).toLowerCase();
    return ["a", "e", "i", "o", "u"].includes(firstChar) ? "an" : "a";
  };

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

      let corePhenomenon = "";

      if (targetProps.event === "Flash Flood Warning") {
        let rawSource = (
          targetParams.flashFloodDetection?.[0] || "Radar"
        ).trim();
        if (rawSource.endsWith(".")) {
          rawSource = rawSource.slice(0, -1).trim();
        }
        let sourceStr = rawSource;
        const lowerSource = rawSource.toLowerCase();
        if (
          !lowerSource.endsWith("reported") &&
          !lowerSource.endsWith("indicated")
        ) {
          sourceStr = rawSource + " indicated";
        }
        const threat = (targetParams.flashFloodDamageThreat?.[0] || "")
          .trim()
          .toLowerCase();
        if (threat && threat !== "n/a" && threat !== "none") {
          corePhenomenon = `${sourceStr} ${threat} flash flooding`;
        } else {
          corePhenomenon = `${sourceStr} flash flooding`;
        }
      } else {
        let phenomenon = "";
        let adjectives = [];

        if (targetParams.tornadoDetection || targetParams.tornadoDamageThreat) {
          phenomenon = "tornado";
          if (targetParams.tornadoDetection)
            adjectives.push(targetParams.tornadoDetection[0].toLowerCase());
          if (targetParams.tornadoDamageThreat) {
            const threatVal = targetParams.tornadoDamageThreat[0].toLowerCase();
            const detectionStr =
              targetParams.tornadoDetection?.[0]?.toLowerCase() || "";
            if (!detectionStr.includes(threatVal)) {
              adjectives.push(threatVal);
            }
          }
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

        if (phenomenon) {
          const cleanAdjs = adjectives
            .filter((a) => a && a !== "n/a" && a !== "none")
            .filter((v, i, a) => a.indexOf(v) === i);
          const mappedAdjs = cleanAdjs.map((a) => {
            if (a === "possible")
              return `${phenomenon.replace(" flooding", "")} possible`;
            if (a === "destructive" && phenomenon === "thunderstorm")
              return "destructive thunderstorm";
            return a;
          });

          if (mappedAdjs.length > 0) {
            if (
              targetProps.customTornadoSource ||
              mappedAdjs.some(
                (a) =>
                  a.includes(phenomenon) ||
                  a.includes("rotation") ||
                  a.includes("thunderstorm") ||
                  a.includes("flooding") ||
                  a.includes("flood"),
              )
            ) {
              corePhenomenon = mappedAdjs.join(", ");
            } else {
              corePhenomenon = `${mappedAdjs.join(", ")} ${phenomenon}`;
            }
          }
        }
      }

      let mainSentence = "";
      const isTornadoWarning = targetProps.event === "Tornado Warning";
      const isFlashFloodWarning = targetProps.event === "Flash Flood Warning";

      if (isTornadoWarning || isFlashFloodWarning) {
        let additionalThreatParts = [];
        if (
          targetParams.maxWindGust &&
          targetParams.maxWindGust[0] !== "0 MPH"
        ) {
          additionalThreatParts.push(
            `${targetParams.maxWindGust[0].toLowerCase()} winds`,
          );
        }
        if (
          targetParams.maxHailSize &&
          targetParams.maxHailSize[0] !== "0.00"
        ) {
          additionalThreatParts.push(
            `${targetParams.maxHailSize[0].toLowerCase()}" hail`,
          );
        }

        if (corePhenomenon) {
          mainSentence = corePhenomenon;
          if (additionalThreatParts.length > 0) {
            mainSentence +=
              "; additional threats include " +
              additionalThreatParts.join(" and ");
          }
        } else if (additionalThreatParts.length > 0) {
          if (additionalThreatParts.length > 1) {
            const last = additionalThreatParts.pop();
            mainSentence = additionalThreatParts.join(", ") + " and " + last;
          } else {
            mainSentence = additionalThreatParts[0];
          }
        }
      } else {
        let sentenceParts = [];
        if (corePhenomenon) sentenceParts.push(corePhenomenon);
        if (
          targetParams.maxWindGust &&
          targetParams.maxWindGust[0] !== "0 MPH"
        ) {
          sentenceParts.push(
            `${targetParams.maxWindGust[0].toLowerCase()} winds`,
          );
        }
        if (
          targetParams.maxHailSize &&
          targetParams.maxHailSize[0] !== "0.00"
        ) {
          sentenceParts.push(
            `${targetParams.maxHailSize[0].toLowerCase()}" hail`,
          );
        }

        if (sentenceParts.length > 1) {
          const last = sentenceParts.pop();
          mainSentence = sentenceParts.join(", ") + " and " + last;
        } else if (sentenceParts.length === 1) {
          mainSentence = sentenceParts[0];
        }
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
      const type = window.activeSpcType;
      if (type === "fire" || type === "fire-cat" || type === "fire-dryt") {
        targetTitle = `Day ${window.activeSpcDay} Fire`;
        targetColor = targetProps.fill || targetProps.FILL || "#ff6600";
        targetIcon = "local_fire_department";
        const rawLabel = (
          targetProps.LABEL ||
          targetProps.LABEL2 ||
          targetProps.label ||
          targetProps.label2 ||
          ""
        ).toUpperCase();
        let finalRiskPhrase = "";
        if (rawLabel === "EXTM" || rawLabel.includes("EXTREME"))
          finalRiskPhrase = "extremely critical";
        else if (
          rawLabel === "CRIT" ||
          (rawLabel.includes("CRITICAL") && !rawLabel.includes("40%"))
        )
          finalRiskPhrase = "critical";
        else if (rawLabel === "ELEV" || rawLabel.includes("ELEVATED"))
          finalRiskPhrase = "elevated";
        else if (rawLabel.includes("DRY") || rawLabel.includes("TSTM"))
          finalRiskPhrase = "dry thunderstorm";
        else {
          finalRiskPhrase = window.formatSpcLabel
            ? window.formatSpcLabel(rawLabel).toLowerCase()
            : rawLabel.toLowerCase();
        }

        if (finalRiskPhrase.includes("fire weather")) {
          targetMetaHtml = `There is ${getArticle(finalRiskPhrase)} ${finalRiskPhrase} for this location.`;
        } else {
          targetMetaHtml = `There is ${getArticle(finalRiskPhrase)} ${finalRiskPhrase} fire weather risk for this location.`;
        }
      } else {
        targetTitle = `Day ${window.activeSpcDay} Convective`;
        targetColor = targetProps.fill || targetProps.FILL || "#FFFFFF";
        targetIcon = "map";
        const rawLabel = (
          targetProps.LABEL ||
          targetProps.LABEL2 ||
          targetProps.label ||
          targetProps.label2 ||
          ""
        ).toUpperCase();
        if (rawLabel.includes("CIG1")) {
          targetColor = "#E60000";
        } else if (rawLabel.includes("CIG2")) {
          targetColor = "#E066FF";
        } else if (rawLabel.includes("CIG3")) {
          targetColor = "#7F00FF";
        }
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
        targetMetaHtml = `There is ${getArticle(finalRiskPhrase)} ${finalRiskPhrase} risk for this location.`;
      }
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
          if (
            window.activeSpcType === "fire" ||
            window.activeSpcType === "fire-cat" ||
            window.activeSpcType === "fire-dryt"
          ) {
            window.showFullSpcFireTextPopup(item);
          } else {
            window.showFullSpcTextPopup(item);
          }
        }
        window.closeAllPopups();
      };
    }
    const fitBtn = dom.querySelector("#fit-screen-button");
    if (fitBtn) {
      fitBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.type === "alert") {
          window.flyToAlert(item.feature);
        } else {
          const day = window.activeSpcDay;
          const type = window.activeSpcType;
          const sourceId = `spc-day${day}-${type}`;
          const cachedData = window.spcSourceCache[sourceId];
          if (
            cachedData &&
            cachedData.features &&
            cachedData.features.length > 0
          ) {
            const isCat =
              sourceId.endsWith("-cat") ||
              sourceId.includes("-fire-cat") ||
              sourceId.includes("-fire-dryt");
            const topFeature = isCat
              ? window.getHighestSpcCatFeature(cachedData.features)
              : cachedData.features.reduce((best, f) => {
                  const val = parseFloat(
                    f.properties.LABEL ||
                      f.properties.LABEL2 ||
                      f.properties.label ||
                      f.properties.label2 ||
                      f.properties.dn ||
                      0,
                  );
                  const bestVal = parseFloat(
                    best?.properties.LABEL ||
                      best?.properties.LABEL2 ||
                      best?.properties.label ||
                      best?.properties.label2 ||
                      best?.properties.dn ||
                      0,
                  );
                  return val > bestVal ? f : best;
                }, null);
            if (topFeature) {
              const feat = {
                type: "Feature",
                geometry: topFeature.geometry,
                properties: {
                  ...topFeature.properties,
                  geometryType: "polygon",
                },
              };
              window.flyToAlert(feat);
            }
          }
        }
        window.closeAllPopups();
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
          const isFire =
            window.activeSpcType === "fire" ||
            window.activeSpcType === "fire_dryt" ||
            window.activeSpcType === "fire_windrh";
          window.createAndShowAlertPopup(
            {
              properties: {
                event: "SPC Outlook",
                specificEventName: isFire
                  ? `Day ${window.activeSpcDay} Fire`
                  : `Day ${window.activeSpcDay} Convective`,
                displayColor: highest ? highest.fill : "#FFFFFF",
                spcTopLabel: highest ? highest.label : "N/A",
                spcDay: window.activeSpcDay,
                spcType: window.activeSpcType,
              },
            },
            "manual",
          );
        }
        window.closeAllPopups();
      };
    }
    const radBtn = dom.querySelector("#radar-site-button");
    if (radBtn) {
      radBtn.onclick = (e) => {
        e.stopPropagation();
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
            const dist = clicked.distanceTo(
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
          }
          if (window.activeSiteIdForData !== id) {
            window.toggleRadarProduct(id, prod);
          }
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
${items.length > 1 ? `<button id="prev-alert-button" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_left</i></button>` : ""}                <div style="position: relative; display: flex; align-items: center; gap: 0px; width: max-content; padding: 5px; border-radius: 22px; border: 1px solid var(--glass-border-color); box-sizing: border-box; overflow: hidden; height: 44px;">
                    <div id="action-bar-progress" style="position: absolute; top: -5px; left: -5px; right: -5px; bottom: -5px; background: ${getGradientBg(index, cur.color)}; z-index: 0; transition: background 0.4s cubic-bezier(0.25, 1, 0.5, 1); filter: blur(6px); opacity: 0.7; pointer-events: none;"></div>
                    <button id="full-text-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 16px 4px 4px 16px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">description</i></button>
                    <button id="fit-screen-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 4px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">fit_screen</i></button>
                    <button id="radar-site-button" style="position: relative; z-index: 1; width: 32px; height: 32px; padding: 0; border-radius: 4px 16px 16px 4px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; outline: none; box-sizing: border-box;"><i class="material-symbols-rounded" style="font-size: 18px; color: #ffffffb2;">radar</i></button>
                </div>
${items.length > 1 ? `<button id="next-alert-button" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; outline: none;"><i class="material-symbols-rounded" style="font-size: 18px;">chevron_right</i></button>` : ""}            </div>
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
            (window.currentStackedAlertIndex - 1 + items.length) % items.length,
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
          (window.currentStackedAlertIndex + 1) % items.length,
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
    div.querySelector("#radar-site-button"),
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

window.map.on("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let willFlyToRadar = false;
  if (window.PersistentCache) await window.PersistentCache.init();

  let symbolId;
  for (const l of window.map.getStyle().layers) {
    if (l.type === "symbol") {
      symbolId = l.id;
      break;
    }
  }

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

  if (!window.allRadarSitesData || window.allRadarSitesData.length === 0) {
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

  if (!window.map.getSource("alerts-arrows"))
    window.map.addSource("alerts-arrows", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

  if (!window.map.getLayer("alerts-arrows-layer")) {
    window.map.addLayer(
      {
        id: "alerts-arrows-layer",
        type: "line",
        source: "alerts-arrows",
        minzoom: 8,
        paint: {
          "line-color": ["coalesce", ["get", "displayColor"], "#FF0000"],
          "line-width": 2,
        },
        layout: {
          visibility:
            window.alertsEnabled && window.motionVectorsEnabled
              ? "visible"
              : "none",
          "line-cap": "round",
          "line-join": "round",
        },
      },
      symbolId,
    );
  }

  if (!window.map.getLayer(window.layerIds.radar)) {
    window.map.addLayer(
      {
        id: window.layerIds.radar,
        type: "raster",
        source: "weather-radar",
        layout: {
          visibility: window.mosaicVisible ? window.mosaicVisible() : "none",
        },
      },
      window.layerIds.alertsZone,
    );
  }

  window.spcSources.forEach((s) => {
    if (!window.map.getSource(s.id)) {
      window.map.addSource(s.id, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    let isVis =
      window.activeSpcDay !== "none" &&
      (window.layerIds.spc["day" + window.activeSpcDay]?.[
        window.activeSpcType
      ] === s.id ||
        window.layerIds.spc["day" + window.activeSpcDay]?.[
          window.activeSpcType + "-cig"
        ] === s.id)
        ? "visible"
        : "none";

    if (!window.map.getLayer(s.id)) {
      window.map.addLayer(
        {
          id: s.id,
          type: "fill",
          source: s.id,
          paint: {
            "fill-color": [
              "case",
              [
                "in",
                "CIG1",
                [
                  "upcase",
                  [
                    "coalesce",
                    ["get", "label"],
                    ["get", "LABEL"],
                    ["get", "label2"],
                    ["get", "LABEL2"],
                    "",
                  ],
                ],
              ],
              "#E60000",
              [
                "in",
                "CIG2",
                [
                  "upcase",
                  [
                    "coalesce",
                    ["get", "label"],
                    ["get", "LABEL"],
                    ["get", "label2"],
                    ["get", "LABEL2"],
                    "",
                  ],
                ],
              ],
              "#E066FF",
              [
                "in",
                "CIG3",
                [
                  "upcase",
                  [
                    "coalesce",
                    ["get", "label"],
                    ["get", "LABEL"],
                    ["get", "label2"],
                    ["get", "LABEL2"],
                    "",
                  ],
                ],
              ],
              "#7F00FF",
              ["coalesce", ["get", "fill"], ["get", "FILL"], "#808080"],
            ],
            "fill-opacity": s.id.endsWith("-cig") ? 0.01 : 0.05,
          },
          layout: { visibility: isVis },
        },
        window.layerIds.radar,
      );
    }

    if (!window.map.getLayer(`${s.id}-border`)) {
      const linePaint = {
        "line-color": [
          "case",
          [
            "in",
            "CIG1",
            [
              "upcase",
              [
                "coalesce",
                ["get", "label"],
                ["get", "LABEL"],
                ["get", "label2"],
                ["get", "LABEL2"],
                "",
              ],
            ],
          ],
          "#E60000",
          [
            "in",
            "CIG2",
            [
              "upcase",
              [
                "coalesce",
                ["get", "label"],
                ["get", "LABEL"],
                ["get", "label2"],
                ["get", "LABEL2"],
                "",
              ],
            ],
          ],
          "#E066FF",
          [
            "in",
            "CIG3",
            [
              "upcase",
              [
                "coalesce",
                ["get", "label"],
                ["get", "LABEL"],
                ["get", "label2"],
                ["get", "LABEL2"],
                "",
              ],
            ],
          ],
          "#7F00FF",
          [
            "coalesce",
            ["get", "stroke"],
            ["get", "STROKE"],
            ["get", "fill"],
            ["get", "FILL"],
            "#808080",
          ],
        ],
        "line-width": s.id.endsWith("-cig") ? 1.5 : 2,
      };
      if (s.id.endsWith("-cig")) {
        linePaint["line-dasharray"] = [2, 3];
      }
      window.map.addLayer(
        {
          id: `${s.id}-border`,
          type: "line",
          source: s.id,
          paint: linePaint,
          layout: {
            visibility: isVis,
            "line-cap": "round",
            "line-join": "round",
          },
        },
        window.layerIds.radar,
      );
    }
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
        "circle-color": window.radarSiteDefaultColor || "#ffffff",
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

  if (window.updateShowSitesFilter) window.updateShowSitesFilter();
  if (window.applyMapAlertFilters) window.applyMapAlertFilters();
  if (window.updateSpcLayerVisibility) window.updateSpcLayerVisibility();
  if (window.updateSpcOutlooks) window.updateSpcOutlooks();
  window.geocodeAndPlaceMarker();
  if (window.checkRadarStatus) window.checkRadarStatus();
  window.applyMapConstraints();

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
    if (window.toggleRadarProduct) window.toggleRadarProduct(s, p);
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

  if (window.checkRadarStatus) setInterval(window.checkRadarStatus, 480000);
  if (window.updateSpcOutlooks) setInterval(window.updateSpcOutlooks, 480000);

  if (window.refreshNwsAlerts && window.updatePlacefileAlerts) {
    await Promise.all([
      window.refreshNwsAlerts(true),
      window.updatePlacefileAlerts(true),
    ]);
  }

  window.isInitialLoad = false;
  if (window.startAlertIntervals) window.startAlertIntervals();

  if (window.stormReportsEnabled && window.fetchAndRenderStormReports) {
    window.fetchAndRenderStormReports();
    window.stormReportsInterval = setInterval(
      window.fetchAndRenderStormReports,
      60000,
    );
  }

  if (window.updateRadar) setInterval(window.updateRadar, 90000);
  if (window.updateSingleSiteRadar)
    setInterval(window.updateSingleSiteRadar, 60000);
});

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
  if (window.allRadarSitesData) {
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
  }
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
    }
    if (window.activeSiteIdForData !== id && window.toggleRadarProduct) {
      window.toggleRadarProduct(id, prod);
    }
  }
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
      ...(window.allSpcLayerIds || []),
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
        if (window.removeSingleSiteLayer) window.removeSingleSiteLayer();
        window.activeRadarProductCode = window.activeSiteIdForData = null;
        window.map.setPaintProperty(
          window.layerIds.radarSites,
          "circle-color",
          window.radarSiteDefaultColor,
        );
        if (window.updateMosaicVisibility) window.updateMosaicVisibility();
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
      if (window.toggleRadarProduct) window.toggleRadarProduct(id, prod);
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
          ...(window.globalPolyAlerts || []),
          ...(window.globalZoneAlerts || []),
          ...(window.globalMdAlerts || []),
          ...(window.globalPolyWatchAlerts || []),
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
        alerts.concat(spc).map((i) => {
          const key =
            i.properties.id ||
            i.properties.LABEL ||
            i.properties.label ||
            i.properties.LABEL2 ||
            i.properties.label2 ||
            (i.properties.event
              ? i.properties.event + "-" + Math.random()
              : Math.random().toString());
          return [key, i];
        }),
      ).values(),
    ];
    if (items.length) window.showAlertMapPopup(items, e.lngLat);
  }
});

if (window.layerIds && window.allSpcLayerIds) {
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
}

window.map.on("movestart", (e) => {
  if (e.originalEvent) {
    window.myLocationZoomIndex = 0;
  }
});
