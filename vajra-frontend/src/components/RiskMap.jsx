import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" && window.location.port === "5173" ? "http://localhost:8001" : "");

// Custom Pulse Pin Icon for Clicked Coordinates
const createPulseIcon = () => {
  return L.divIcon({
    className: "custom-pulse-marker-wrapper",
    html: `
      <div class="custom-pulse-marker">
        <div class="pulse-pin-dot"></div>
        <div class="pulse-pin-ring"></div>
        <div class="pulse-pin-ring ring-delay"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Map Auto-Fitter to frame active areas cleanly without interrupting user dragging/panning
function MapAutoFitter({ center, features, fitTrigger }) {
  const map = useMap();
  const hasInitialFitRef = useRef(false);
  const prevFitTriggerRef = useRef(fitTrigger);
  const prevCenterKeyRef = useRef("");

  // Ensure leaflet interactions (drag, zoom, touch, wheel) are enabled on mount
  useEffect(() => {
    if (!map) return;
    try {
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
      if (map.touchZoom && !map.touchZoom.enabled()) {
        map.touchZoom.enable();
      }
      if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) {
        map.doubleClickZoom.enable();
      }
      if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.enable();
      }
      if (map.boxZoom && !map.boxZoom.enabled()) {
        map.boxZoom.enable();
      }
      if (map.keyboard && !map.keyboard.enabled()) {
        map.keyboard.enable();
      }
    } catch (e) {
      console.warn("Leaflet interaction enable warning:", e);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  // Only auto-fit on:
  // 1) Initial load when features arrive
  // 2) Explicit user click on '🎯 Center & Fit' button
  // 3) Significant coordinate change (new station / city chosen)
  useEffect(() => {
    if (!map) return;

    const lat = center?.[0];
    const lon = center?.[1];
    const centerKey = (typeof lat === "number" && typeof lon === "number")
      ? `${lat.toFixed(3)},${lon.toFixed(3)}`
      : "";

    const isExplicitTrigger = fitTrigger !== prevFitTriggerRef.current;
    const isFirstTimeWithFeatures = !hasInitialFitRef.current && features && features.length > 0;
    const isStationChanged = Boolean(
      centerKey && prevCenterKeyRef.current && centerKey !== prevCenterKeyRef.current
    );

    if (isFirstTimeWithFeatures || isExplicitTrigger || isStationChanged) {
      if (features && features.length > 0) {
        hasInitialFitRef.current = true;
      }
      prevFitTriggerRef.current = fitTrigger;
      if (centerKey) {
        prevCenterKeyRef.current = centerKey;
      }

      if (features && features.length > 0) {
        try {
          const bounds = L.latLngBounds(
            features.map((f) => [
              f.geometry.coordinates[1],
              f.geometry.coordinates[0],
            ])
          );
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            return;
          }
        } catch (e) {
          if (center) map.setView(center, 14);
        }
      } else if (center) {
        map.setView(center, 14);
      }
    }
  }, [map, center, features, fitTrigger]);

  return null;
}

// Click listener to register user map clicks and trigger smooth zoom to village
function MapClickHandler({ onMapClick }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng, map);
    },
  });
  return null;
}

// Track zoom level to display resolution indicator
function MapZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });
  return null;
}

// Emergency & Safety Guidelines Generator tailored for rural villages and local areas
function getSafetyProtocol(hazard, riskLevel, locationName) {
  const h = (hazard || "").toUpperCase();
  const level = (riskLevel || "").toUpperCase();
  const loc = locationName || "Local Village";

  const isCritical = level === "CRITICAL";
  const isHigh = level === "HIGH";

  if (h.includes("THUNDER") || h.includes("LIGHTNING")) {
    return {
      severityBadge: isCritical ? "CRITICAL ADVISORY" : isHigh ? "HIGH VIGILANCE" : "WEATHER WATCH",
      title: isCritical
        ? `🚨 Severe Thunderstorm & Cloud-to-Ground Lightning Threat in ${loc}`
        : `⚠️ Active Convective Lightning & Storm Advisory for ${loc}`,
      summary: isCritical
        ? "Extreme atmospheric convective instability. Deep vertical updrafts over local fields and settlements."
        : "Rapid convective storm cell formation. High likelihood of localized lightning strikes within 30-60 mins.",
      actionItems: [
        "Move immediately into a pucca / reinforced concrete structure or vehicle. Avoid temporary tin-shed shelters.",
        "Farmers and rural workers: Immediately vacate open agricultural fields, tractors, and elevated tubewell bunds.",
        "Secure livestock inside enclosed stables away from metallic wire fences and single standing trees.",
        "Disconnect electric water pumps, inverter mains, and antenna feeds to avoid catastrophic electrical surge.",
        "If stranded in open village grounds without shelter: Crouch low on balls of feet (lightning crouch); do not lie flat on wet soil."
      ],
      emergencyKit: ["Battery-operated radio/transistor", "Rechargeable torch / solar lantern", "Mobile power bank", "First-aid & antiseptic"]
    };
  } else if (h.includes("CLOUDBURST")) {
    return {
      severityBadge: isCritical ? "TORRENTIAL FLOOD RISK" : "FLASH PRECIPITATION WATCH",
      title: isCritical
        ? `🚨 Hyper-Intense Cloudburst & Inundation Imminent in ${loc}`
        : `⚠️ Localized Flash Precipitation Warning for ${loc}`,
      summary: isCritical
        ? "Extreme tropospheric water vapor saturation (IWV > 50 mm). Cloudburst deluge exceeding 50 mm/hr anticipated."
        : "Heavy cloudburst pockets forming. Drainage channels, canals, and riverine banks under overflow threat.",
      actionItems: [
        "Immediately evacuate mud houses, low-lying village dwellings, and dwellings adjacent to riverbanks / nullahs.",
        "Move elderly, children, and essential grain sacks to upper floors or village high-ground community centres.",
        "Never walk or drive carts/motorcycles across overflowing rural bridges, causeways, or inundated culverts.",
        "Keep cattle untied in corrals so they can swim to safety if floodwaters enter the village unexpectedly.",
        "Prepare boiled or bottled drinking water supplies in advance to prevent waterborne contamination."
      ],
      emergencyKit: ["3-day drinking water supply", "Dry food grains / chuda & gur", "Waterproof pouch for Aadhaar/land records", "Emergency whistle"]
    };
  } else {
    // Flash Flood
    return {
      severityBadge: isCritical ? "VILLAGE EVACUATION ALERT" : "FLOOD PREPAREDNESS",
      title: isCritical
        ? `🚨 Flash Flood & Water Inundation Threat in ${loc}`
        : `⚠️ Canal & River Overflow Readiness for ${loc}`,
      summary: isCritical
        ? "Sudden catchment surge. Village roads, low culverts, and agricultural fields subject to rapid flooding."
        : "Sustained monsoon precipitation saturating village terrain. Local water bodies nearing spill thresholds.",
      actionItems: [
        "Head immediately toward high-ground village cyclone/flood shelters or multi-story school buildings.",
        "Turn Around, Don't Drown: Flowing water 6 inches deep can knock down an adult; 12 inches can sweep away vehicles.",
        "Stay clear of deteriorating mud bunds, canal embankments, and collapsed culverts.",
        "Shut off household electrical mains and LPG cylinder regulators before evacuating.",
        "Monitor local Gram Panchayat and emergency disaster management radio broadcasts for rescue coordinates."
      ],
      emergencyKit: ["Potable drinking water", "Foil survival space blanket", "Water purification tablets", "Basic medical supplies"]
    };
  }
}

function RiskMap({ initialData, location, onSelectLocation, isFullMap = false }) {
  const [riskData, setRiskData] = useState(initialData || null);
  const [hazard, setHazard] = useState("thunderstorm");
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [fitTrigger, setFitTrigger] = useState(0);

  // Map Tile Layer: osm (Deep Village OSM), satellite (Esri World Imagery + Labels), topo (OpenTopoMap), dark (CartoDB)
  const [tileLayerType, setTileLayerType] = useState("osm");
  const [zoomLevel, setZoomLevel] = useState(14);

  // Clicked Point Telemetry & Safety Inspector State
  const [clickedCoords, setClickedCoords] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [pointData, setPointData] = useState(null);
  const [pointError, setPointError] = useState("");
  const [showInspector, setShowInspector] = useState(false);
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);

  // Fetch Risk Map for Hazard + Location
  const fetchRiskMap = useCallback(async (selectedHazard) => {
    try {
      setLoading(true);
      setError("");

      const hazardQuery = selectedHazard || hazard;
      let url = `${API_BASE_URL}/api/risk-map?hazard=${hazardQuery}`;
      if (location?.latitude && location?.longitude) {
        url += `&lat=${location.latitude}&lon=${location.longitude}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch risk map data");

      const result = await response.json();
      setRiskData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hazard, location]);

  useEffect(() => {
    if (initialData) {
      setRiskData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    fetchRiskMap(hazard);
  }, [hazard, fetchRiskMap]);

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchRiskMap(hazard);
    }
  }, [location?.latitude, location?.longitude, fetchRiskMap]);

  // Click on Map Handler: Fetches village-level details and zooms in
  const handleMapClick = async (latlng, mapInstance) => {
    const lat = latlng.lat;
    const lon = latlng.lng;

    setClickedCoords({ lat, lon });
    setShowInspector(true);
    setIsInspectorMinimized(false);
    setInspectorLoading(true);
    setPointError("");
    setPointData(null);

    // Smoothly fly to the clicked village coordinate at deep resolution
    if (mapInstance) {
      mapInstance.flyTo([lat, lon], Math.max(mapInstance.getZoom(), 15), {
        duration: 0.75,
      });
    }

    try {
      // Parallel fetch: backend weather/prediction + direct Nominatim deep village lookup
      const [weatherRes, predictRes, nominatimRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`),
        fetch(`${API_BASE_URL}/api/predict/live?lat=${lat}&lon=${lon}`),
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`, {
          headers: { "User-Agent": "VajraVillageNowcaster/2.0" }
        }).catch(() => null)
      ]);

      if (!weatherRes.ok || !predictRes.ok) {
        throw new Error("Unable to retrieve point telemetry from weather sensors.");
      }

      const weatherJson = await weatherRes.json();
      const predictJson = await predictRes.json();
      const nominatimJson = nominatimRes && nominatimRes.ok ? await nominatimRes.json() : null;

      // Extract exact village, hamlet, or locality
      let villageName = null;
      let subdistrict = null;
      let districtName = null;
      let stateName = null;

      if (nominatimJson?.address) {
        const addr = nominatimJson.address;
        const vTag = (
          addr.village ||
          addr.hamlet ||
          addr.isolated_dwelling ||
          addr.locality ||
          addr.neighbourhood ||
          addr.suburb ||
          addr.residential ||
          addr.farm
        );
        villageName = vTag ? (vTag.toLowerCase().endsWith("village") ? vTag : `${vTag} Village`) : (addr.town || addr.city || null);
        subdistrict = addr.county || addr.subdistrict || addr.tehsil || addr.block || null;
        districtName = addr.state_district || addr.district || null;
        stateName = addr.state || null;
      }

      if (!villageName) {
        villageName = weatherJson.data?.village || weatherJson.data?.city || `Village (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
      }
      if (!subdistrict) subdistrict = weatherJson.data?.subdistrict || "";
      if (!districtName) districtName = weatherJson.data?.district || "";
      if (!stateName) stateName = weatherJson.data?.state || "India";

      setPointData({
        lat,
        lon,
        village: villageName,
        subdistrict: subdistrict,
        district: districtName,
        state: stateName,
        weather: weatherJson.data,
        prediction: predictJson.prediction,
        alerts: predictJson.alerts || []
      });
    } catch (err) {
      setPointError(err.message || "Failed to inspect point");
    } finally {
      setInspectorLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#f97316";
      case "MODERATE":
        return "#eab308";
      default:
        return "#22c55e";
    }
  };

  const defaultPosition = useMemo(() => {
    const first = riskData?.features?.[0];
    if (first) {
      return [first.geometry.coordinates[1], first.geometry.coordinates[0]];
    }
    if (location?.latitude && location?.longitude) {
      return [location.latitude, location.longitude];
    }
    return [12.9716, 77.5946];
  }, [
    riskData?.features?.[0]?.geometry?.coordinates?.[0],
    riskData?.features?.[0]?.geometry?.coordinates?.[1],
    location?.latitude,
    location?.longitude
  ]);

  const locationLabel = riskData?.metadata?.location_name || "Monitored Zone";

  // Determine top hazard from clicked point
  const topHazardInfo = (() => {
    if (!pointData?.prediction) return { hazard: hazard, riskLevel: "MODERATE" };
    const preds = pointData.prediction;
    let highest = { hazard: "thunderstorm", probability: 0, riskLevel: "LOW" };

    Object.entries(preds).forEach(([name, val]) => {
      const prob = val.probability || 0;
      if (prob > highest.probability) {
        highest = { hazard: name, probability: prob, riskLevel: val.risk_level || "MODERATE" };
      }
    });
    return highest;
  })();

  const safetyProtocol = getSafetyProtocol(topHazardInfo.hazard, topHazardInfo.riskLevel, pointData?.village);

  return (
    <section className="risk-map-section interactive-map-card">
      {/* MAP TOP TOOLBAR */}
      <div className="section-header map-interactive-header">
        <div>
          <div className="map-title-row">
            <h2>🗺️ Deep Village & Rural Radar Nowcasting</h2>
            <span className="live-pill-tag">VILLAGE LEVEL</span>
          </div>
          <p className="map-caption">
            Click on any village, hamlet, or rural area to inspect local atmospheric nowcasting & emergency guidelines • <strong>{locationLabel}</strong> ({defaultPosition[0].toFixed(4)}°N, {defaultPosition[1].toFixed(4)}°E)
          </p>
        </div>

        <div className="map-header-actions">
          {/* Map Layer Switcher */}
          <div className="layer-switcher-group" title="Select Map Layer">
            <button
              type="button"
              className={`layer-btn ${tileLayerType === "osm" ? "active-layer" : ""}`}
              onClick={() => setTileLayerType("osm")}
            >
              🏡 Village Map
            </button>
            <button
              type="button"
              className={`layer-btn ${tileLayerType === "satellite" ? "active-layer" : ""}`}
              onClick={() => setTileLayerType("satellite")}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              className={`layer-btn ${tileLayerType === "topo" ? "active-layer" : ""}`}
              onClick={() => setTileLayerType("topo")}
            >
              🏔️ Topo Terrain
            </button>
            <button
              type="button"
              className={`layer-btn ${tileLayerType === "dark" ? "active-layer" : ""}`}
              onClick={() => setTileLayerType("dark")}
            >
              🌙 Dark
            </button>
          </div>

          {/* Interactive Hazard Pill Selector */}
          <div className="hazard-pill-group" role="group" aria-label="Hazard Type Selector">
            <button
              type="button"
              className={`hazard-pill-btn ${hazard === "thunderstorm" ? "active-thunder" : ""}`}
              onClick={() => setHazard("thunderstorm")}
            >
              ⚡ Thunderstorm
            </button>
            <button
              type="button"
              className={`hazard-pill-btn ${hazard === "cloudburst" ? "active-cloud" : ""}`}
              onClick={() => setHazard("cloudburst")}
            >
              ☁️ Cloudburst
            </button>
            <button
              type="button"
              className={`hazard-pill-btn ${hazard === "flash_flood" ? "active-flood" : ""}`}
              onClick={() => setHazard("flash_flood")}
            >
              🌊 Flash Flood
            </button>
          </div>

          <button
            type="button"
            className="fit-map-btn"
            onClick={() => setFitTrigger((prev) => prev + 1)}
            title="Auto-fit and center all risk zones"
          >
            🎯 Center & Fit
          </button>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="map-wrapper" style={{ height: isFullMap ? "640px" : "490px" }}>
        {loading && (
          <div className="map-loading-overlay">
            <span className="spinner-ring"></span>
            <p>Ingesting village-level convective radar telemetry...</p>
          </div>
        )}

        {error && (
          <div className="map-error-overlay">
            <p>⚠️ Radar Ingestion Error: {error}</p>
            <button onClick={() => fetchRiskMap(hazard)}>Retry Sensor Sync</button>
          </div>
        )}

        {/* Zoom Resolution Badge */}
        <div className="zoom-resolution-badge">
          🔍 Zoom: {zoomLevel} • {zoomLevel >= 15 ? "Deep Village Resolution" : zoomLevel >= 12 ? "Panchayat / Block Resolution" : "Regional View"}
        </div>

        <MapContainer
          center={defaultPosition}
          zoom={14}
          minZoom={3}
          maxZoom={19}
          dragging={true}
          scrollWheelZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          className="leaflet-full-fitted"
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "14px",
            background: "#081326",
            cursor: "grab"
          }}
        >
          <MapAutoFitter
            center={defaultPosition}
            features={riskData?.features}
            fitTrigger={fitTrigger}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapZoomTracker onZoomChange={setZoomLevel} />

          {/* Dynamic Tile Layer according to user selection */}
          {tileLayerType === "osm" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (Deep Village Network)'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              maxNativeZoom={19}
            />
          )}

          {tileLayerType === "satellite" && (
            <>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <TileLayer
                attribution='&copy; Esri Reference Labels'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </>
          )}

          {tileLayerType === "topo" && (
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          )}

          {tileLayerType === "dark" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}

          {/* User Clicked Pin Marker */}
          {clickedCoords && (
            <Marker
              position={[clickedCoords.lat, clickedCoords.lon]}
              icon={createPulseIcon()}
            >
              <Popup className="vajra-custom-popup">
                <div className="popup-point-box">
                  <strong>📍 Inspected Coordinate</strong>
                  <p>{clickedCoords.lat.toFixed(4)}°N, {clickedCoords.lon.toFixed(4)}°E</p>
                  <span className="inspecting-tag">Village telemetry analyzing below</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Monitored Circle Zone Markers */}
          {riskData?.features?.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            const properties = feature.properties;
            const probPct = (
              properties.probability > 1 ? properties.probability : properties.probability * 100
            ).toFixed(1);

            return (
              <CircleMarker
                key={properties.zone_id}
                center={[latitude, longitude]}
                radius={24}
                pathOptions={{
                  color: getRiskColor(properties.risk_level),
                  fillColor: getRiskColor(properties.risk_level),
                  fillOpacity: 0.55,
                  weight: 2
                }}
              >
                <Popup className="vajra-custom-popup">
                  <div className="popup-zone-content">
                    <div className="popup-zone-head">
                      <h3>{properties.zone_name}</h3>
                      <span
                        className="popup-risk-badge"
                        style={{ background: getRiskColor(properties.risk_level) }}
                      >
                        {properties.risk_level}
                      </span>
                    </div>

                    <div className="popup-zone-metrics">
                      <div>
                        <span>Hazard Type</span>
                        <strong>{properties.hazard}</strong>
                      </div>
                      <div>
                        <span>Nowcast Risk</span>
                        <strong style={{ color: getRiskColor(properties.risk_level) }}>
                          {probPct}%
                        </strong>
                      </div>
                    </div>

                    <p className="popup-zone-coords">
                      Center: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                    </p>

                    <button
                      className="popup-inspect-btn"
                      onClick={() => handleMapClick({ lat: latitude, lng: longitude })}
                    >
                      🔍 Inspect Village Safety Protocol
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* CLICK-TO-INSPECT SLIDE-UP DRAWER / MODAL */}
        {showInspector && (
          <div className={`point-inspector-drawer ${isInspectorMinimized ? "inspector-minimized" : ""}`}>
            <div className="inspector-header">
              <div className="inspector-title-area">
                <span className="pulse-indicator"></span>
                <div>
                  <div className="village-header-tag-row">
                    <span className="village-pill-badge">🏡 LOCAL AREA</span>
                    <h3>{pointData?.village || "Resolving Village..."}</h3>
                  </div>
                  <p className="inspector-coords">
                    {pointData?.subdistrict ? `${pointData.subdistrict} Block, ` : ""}
                    {pointData?.district ? `${pointData.district} District, ` : ""}
                    {pointData?.state ? `${pointData.state} ` : ""}
                    • ({clickedCoords?.lat.toFixed(4)}°N, {clickedCoords?.lon.toFixed(4)}°E)
                  </p>
                </div>
              </div>

              <div className="inspector-head-buttons">
                {onSelectLocation && pointData && (
                  <button
                    className="set-station-btn"
                    onClick={() => {
                      onSelectLocation({
                        latitude: clickedCoords.lat,
                        longitude: clickedCoords.lon,
                      });
                    }}
                    title="Monitor this village across the entire dashboard"
                  >
                    ⭐ Monitor this Village
                  </button>
                )}
                <button
                  className="minimize-inspector-btn"
                  onClick={() => setIsInspectorMinimized(!isInspectorMinimized)}
                  title={isInspectorMinimized ? "Expand inspector panel" : "Minimize panel to view and move map freely"}
                >
                  {isInspectorMinimized ? "⬆️ Expand" : "⬇️ Minimize"}
                </button>
                <button
                  className="close-inspector-btn"
                  onClick={() => setShowInspector(false)}
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>
            </div>

            {!isInspectorMinimized && (
              <>
                {inspectorLoading ? (
                  <div className="inspector-loading">
                    <span className="spinner-ring sm"></span>
                    <p>Pinpointing local village boundaries, ingesting atmospheric sounding & running convective nowcasting...</p>
                  </div>
                ) : pointError ? (
                  <div className="inspector-error">
                    <p>⚠️ {pointError}</p>
                  </div>
                ) : pointData ? (
                  <div className="inspector-content-grid">
                {/* 1. WEATHER CONDITIONS */}
                <div className="inspector-weather-card">
                  <h4>🌦️ Village Atmospheric Telemetry</h4>
                  <div className="inspector-weather-grid">
                    <div className="tele-item">
                      <span>Temperature</span>
                      <strong>{pointData.weather?.temperature_c ?? "—"}°C</strong>
                      <small>Feels {pointData.weather?.feels_like_c ?? "—"}°C</small>
                    </div>
                    <div className="tele-item">
                      <span>Humidity</span>
                      <strong>{pointData.weather?.humidity_percent ?? "—"}%</strong>
                    </div>
                    <div className="tele-item">
                      <span>Wind Velocity</span>
                      <strong>{pointData.weather?.wind_speed_kmh ?? "—"} km/h</strong>
                      <small>{pointData.weather?.wind_direction_deg ?? "—"}° direction</small>
                    </div>
                    <div className="tele-item">
                      <span>Precipitation</span>
                      <strong>{pointData.weather?.rainfall_mm ?? 0} mm/h</strong>
                    </div>
                    <div className="tele-item highlight">
                      <span>CAPE Instability</span>
                      <strong>{pointData.weather?.cape ?? "—"} J/kg</strong>
                    </div>
                    <div className="tele-item highlight">
                      <span>IWV Moisture</span>
                      <strong>{pointData.weather?.iwv ?? "—"} mm</strong>
                    </div>
                  </div>
                </div>

                {/* 2. HAZARD PREDICTIONS */}
                <div className="inspector-hazard-card">
                  <h4>⚡ Local Convective Hazard Nowcasting</h4>
                  <div className="hazard-scores-list">
                    {pointData.prediction &&
                      Object.entries(pointData.prediction).map(([hName, val]) => {
                        const pct = (
                          val.probability > 1 ? val.probability : val.probability * 100
                        ).toFixed(1);
                        const rColor = getRiskColor(val.risk_level);

                        return (
                          <div key={hName} className="hazard-score-row">
                            <div className="hazard-row-head">
                              <strong>{hName.replaceAll("_", " ").toUpperCase()}</strong>
                              <span
                                className="risk-level-badge"
                                style={{ background: rColor }}
                              >
                                {val.risk_level} ({pct}%)
                              </span>
                            </div>
                            <div className="hazard-prog-track">
                              <div
                                className="hazard-prog-bar"
                                style={{ width: `${Math.min(100, pct)}%`, background: rColor }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 3. SAFETY DIRECTIVES & ACTION PLAN */}
                <div className="inspector-safety-card">
                  <div className="safety-card-head">
                    <span className="safety-badge">{safetyProtocol.severityBadge}</span>
                    <h4>🛡️ Village Emergency Action Directive</h4>
                  </div>
                  <h5 className="safety-title">{safetyProtocol.title}</h5>
                  <p className="safety-summary">{safetyProtocol.summary}</p>

                  <div className="safety-checklist">
                    <strong>Village Preparedness Checklist:</strong>
                    <ul>
                      {safetyProtocol.actionItems.map((item, idx) => (
                        <li key={idx}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="emergency-kit-box">
                    <strong>🎒 Recommended Village Emergency Kit:</strong>
                    <div className="kit-tags">
                      {safetyProtocol.emergencyKit.map((gear, i) => (
                        <span key={i} className="kit-tag">
                          ● {gear}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
              </>
            )}
          </div>
        )}
      </div>

      {/* MAP FOOTER / LEGEND */}
      <div className="map-footer-bar">
        <div className="risk-legend-group">
          <span className="legend-item"><span className="dot dot-crit"></span> Critical (≥80%)</span>
          <span className="legend-item"><span className="dot dot-high"></span> High (60-79%)</span>
          <span className="legend-item"><span className="dot dot-mod"></span> Moderate (30-59%)</span>
          <span className="legend-item"><span className="dot dot-low"></span> Low (&lt;30%)</span>
        </div>

        <div className="map-hint-badge">
          💡 Click any rural village or field on the map to pinpoint hyper-local nowcasting & safety action plan
        </div>
      </div>
    </section>
  );
}

export default RiskMap;