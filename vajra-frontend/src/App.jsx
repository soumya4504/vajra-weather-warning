import { useEffect, useState } from "react";
import "./App.css";

import WeatherIntelligence from "./components/WeatherIntelligence";
import AIExplanation from "./components/AIExplanation";
import RiskMap from "./components/RiskMap";
import SystemStatus from "./components/SystemStatus";
import LiveLocation from "./components/LiveLocation";

const API_BASE_URL = "http://localhost:8001";


function App() {
  const [predictionData, setPredictionData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [riskMap, setRiskMap] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState("ALL");
  const [selectedStation, setSelectedStation] = useState("LIVE");

  const LOCATION_PRESETS = [
    { label: "LIVE", name: "📍 Live GPS Coordinates", lat: null, lon: null },
    { label: "Bengaluru", name: "Bengaluru (12.97°N, 77.59°E)", lat: 12.9716, lon: 77.5946 },
    { label: "Bhubaneswar", name: "Bhubaneswar (20.30°N, 85.82°E)", lat: 20.2961, lon: 85.8245 },
    { label: "New Delhi", name: "New Delhi (28.61°N, 77.21°E)", lat: 28.6139, lon: 77.2090 },
    { label: "Mumbai", name: "Mumbai (19.08°N, 72.88°E)", lat: 19.0760, lon: 72.8777 },
    { label: "Kolkata", name: "Kolkata (22.57°N, 88.36°E)", lat: 22.5726, lon: 88.3639 },
    { label: "Chennai", name: "Chennai (13.08°N, 80.27°E)", lat: 13.0827, lon: 80.2707 },
    { label: "Hyderabad", name: "Hyderabad (17.38°N, 78.49°E)", lat: 17.3850, lon: 78.4867 },
  ];

  const viewTitles = {
    "Dashboard": {
      eyebrow: "REAL-TIME EARLY WARNING SYSTEM",
      title: "Weather Risk Command Center",
      subtitle: "AI-powered hyper-local weather monitoring and hazard prediction"
    },
    "Live Map": {
      eyebrow: "GEOSPATIAL RADAR MONITORING",
      title: "Hyper-Local Risk Geospatial Map",
      subtitle: "Interactive spatial tracking of convective storm cells and impact zones"
    },
    "Risk Forecast": {
      eyebrow: "CONVECTIVE HAZARD PROBABILITY",
      title: "Weather Hazard Risk Forecast",
      subtitle: "Multi-hazard machine learning predictions and safety action thresholds"
    },
    "Alerts": {
      eyebrow: "EARLY WARNING ADVISORIES",
      title: "Emergency Weather Alerts",
      subtitle: "Active incident alerts with lead times and emergency preparedness directives"
    },
    "Impact Analysis": {
      eyebrow: "VULNERABILITY & SEVERITY ASSESSMENT",
      title: "Atmospheric Impact & Convective Dynamics",
      subtitle: "Thermodynamic energy indicators and precipitation accumulation metrics"
    },
    "Data Layers": {
      eyebrow: "ENVIRONMENTAL TELEMETRY",
      title: "Multi-Parameter Weather Telemetry",
      subtitle: "Raw observational metrics, moisture indices, and sounding parameters"
    },
    "AI Explainability": {
      eyebrow: "TRANSPARENT MACHINE LEARNING",
      title: "AI Explainability & Signal Attribution",
      subtitle: "Explainable AI decomposition of atmospheric features driving predictions"
    },
    "Reports": {
      eyebrow: "SYSTEM PERFORMANCE & AUDIT",
      title: "Nowcasting Telemetry Reports",
      subtitle: "System health metrics, model validation summary, and audit telemetry"
    }
  };


  // ---------------------------------
  // GET LIVE LOCATION
  // ---------------------------------

  const getLiveLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by this browser.");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const liveLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          setLocation(liveLocation);
          setLocationError("");

          resolve(liveLocation);
        },
        (error) => {
          console.error("Location error:", error);

          setLocationError(
            "Unable to access live location. Using default weather location."
          );

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };


  // ---------------------------------
  // FETCH DASHBOARD DATA
  // ---------------------------------

  const fetchDashboardData = async (targetCoords = null) => {
    try {
      setRefreshing(true);
      setLoading(true);
      setError("");

      let activeLocation = targetCoords;

      if (!activeLocation) {
        if (location) {
          activeLocation = location;
        } else {
          activeLocation = await getLiveLocation();
        }
      }

      const locQuery = (activeLocation?.latitude && activeLocation?.longitude)
        ? `lat=${activeLocation.latitude}&lon=${activeLocation.longitude}`
        : "";

      const weatherUrl = locQuery
        ? `${API_BASE_URL}/api/weather?${locQuery}`
        : `${API_BASE_URL}/api/weather`;

      const predictUrl = locQuery
        ? `${API_BASE_URL}/api/predict/live?${locQuery}`
        : `${API_BASE_URL}/api/predict/live`;

      const alertsUrl = locQuery
        ? `${API_BASE_URL}/api/alerts?${locQuery}`
        : `${API_BASE_URL}/api/alerts`;

      const riskMapUrl = locQuery
        ? `${API_BASE_URL}/api/risk-map?hazard=thunderstorm&${locQuery}`
        : `${API_BASE_URL}/api/risk-map?hazard=thunderstorm`;

      const [
        weatherResponse,
        predictionResponse,
        alertsResponse,
        riskMapResponse
      ] = await Promise.all([
        fetch(weatherUrl),
        fetch(predictUrl),
        fetch(alertsUrl),
        fetch(riskMapUrl)
      ]);

      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch live weather");
      }

      if (!predictionResponse.ok) {
        throw new Error("Failed to fetch live prediction");
      }

      if (!alertsResponse.ok) {
        throw new Error("Failed to fetch alerts");
      }

      if (!riskMapResponse.ok) {
        throw new Error("Failed to fetch risk map");
      }

      const weatherResult =
        await weatherResponse.json();

      const predictionResult =
        await predictionResponse.json();

      const alertsResult =
        await alertsResponse.json();

      const riskMapResult =
        await riskMapResponse.json();

      setWeatherData(weatherResult.data);
      setPredictionData(predictionResult);
      setAlerts(
        Array.isArray(alertsResult)
          ? alertsResult
          : alertsResult.data || []
      );
      setRiskMap(riskMapResult);

      if (activeLocation) {
        setLocation(activeLocation);
      } else if (weatherResult.data?.latitude && weatherResult.data?.longitude) {
        setLocation({
          latitude: weatherResult.data.latitude,
          longitude: weatherResult.data.longitude
        });
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error(error);
      setError(error.message);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDetectGPS = async () => {
    setSelectedStation("LIVE");
    const gps = await getLiveLocation();
    if (gps) {
      setLocation(gps);
      fetchDashboardData(gps);
    } else {
      fetchDashboardData();
    }
  };

  const handleStationChange = (e) => {
    const val = e.target.value;
    setSelectedStation(val);
    if (val === "LIVE") {
      handleDetectGPS();
    } else {
      const preset = LOCATION_PRESETS.find(p => p.label === val);
      if (preset && preset.lat !== null) {
        const coords = { latitude: preset.lat, longitude: preset.lon };
        setLocation(coords);
        fetchDashboardData(coords);
      }
    }
  };


  // ---------------------------------
  // INITIAL LOAD
  // ---------------------------------

  useEffect(() => {
    fetchDashboardData();
  }, []);


  // ---------------------------------
  // AUTO REFRESH
  // ---------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  // ---------------------------------
  // FORMAT PROBABILITY
  // ---------------------------------

  const formatProbability = (probability) => {
    if (
      probability === undefined ||
      probability === null
    ) {
      return "N/A";
    }

    const value = Number(probability);

    if (Number.isNaN(value)) {
      return "N/A";
    }

    if (value > 1) {
      return `${value.toFixed(0)}%`;
    }

    return `${(value * 100).toFixed(0)}%`;
  };


  // ---------------------------------
  // RISK CLASS
  // ---------------------------------

  const getRiskClass = (riskLevel) => {
    const level =
      riskLevel?.toLowerCase() || "low";

    return `risk-${level}`;
  };


  // ---------------------------------
  // PREDICTIONS
  // ---------------------------------

  const predictions =
    predictionData?.prediction ||
    predictionData?.predictions ||
    {};


  const predictionEntries =
    Object.entries(predictions);


  // Dynamic overall confidence (avg of all hazard probabilities)
  const overallConfidence = (() => {
    const entries = predictionEntries;
    if (entries.length === 0) return 79;
    const total = entries.reduce((sum, [, p]) => {
      const prob = p.probability > 1 ? p.probability : p.probability * 100;
      return sum + prob;
    }, 0);
    return Math.round(total / entries.length);
  })();


  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === "ALL") return true;
    const sev = (alert.severity || "").toUpperCase();
    if (alertFilter === "CRITICAL") return sev === "CRITICAL" || sev === "SEVERE";
    return sev === alertFilter;
  });


  // Resolved city name from live data
  const resolvedCity =
    weatherData?.city ||
    predictionData?.location?.city ||
    "Loading...";


  // ---------------------------------
  // LOADING SCREEN
  // ---------------------------------

  if (loading && !predictionData) {
    return (
      <div className="app-loading">

        <div className="loading-box">

          <div className="loading-icon">
            ⚡
          </div>

          <h1>
            VAJRA
          </h1>

          <p>
            Initializing Weather Intelligence...
          </p>

        </div>

      </div>
    );
  }


  // ---------------------------------
  // ERROR SCREEN
  // ---------------------------------

  if (error && !predictionData) {
    return (
      <div className="app-loading">

        <div className="loading-box error-box">

          <div className="loading-icon">
            ⚠️
          </div>

          <h2>
            Backend Connection Error
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={fetchDashboardData}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // ---------------------------------
  // MAIN DASHBOARD
  // ---------------------------------

  return (
    <div className="vajra-app">


      {/* ===============================
          SIDEBAR
      =============================== */}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="sidebar-brand">

          <div className="brand-logo">
            ⚡
          </div>

          <div>
            <h1>
              VAJRA
            </h1>

            <p>
              AI Weather Intelligence
            </p>
          </div>

        </div>


        <nav className="sidebar-nav">

          {[
            { icon: "⌂", label: "Dashboard" },
            { icon: "◉", label: "Live Map" },
            { icon: "◈", label: "Risk Forecast" },
            { icon: "⚠", label: "Alerts" },
            { icon: "◫", label: "Impact Analysis" },
            { icon: "▤", label: "Data Layers" },
            { icon: "✦", label: "AI Explainability" },
            { icon: "▧", label: "Reports" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => {
                setActiveNav(label);
                setSidebarOpen(false);
              }}
            >
              <span>{icon}</span>
              {label}
            </div>
          ))}

        </nav>


        <div className="sidebar-system">

          <h3>
            SYSTEM STATUS
          </h3>

          <div className="status-row">
            <span>
              Data Ingestion
            </span>

            <strong>
              ● Live
            </strong>
          </div>

          <div className="status-row">
            <span>
              AI Model
            </span>

            <strong>
              ● Operational
            </strong>
          </div>

          <div className="status-row">
            <span>
              Alert System
            </span>

            <strong>
              ● Active
            </strong>
          </div>

          <div className="status-row">
            <span>
              Auto Refresh
            </span>

            <strong>
              60 sec
            </strong>
          </div>

        </div>

      </aside>



      {/* ===============================
          MAIN CONTENT
      =============================== */}

      <main className="main-content">


        {/* ===============================
            TOP HEADER
        =============================== */}

        <header className="top-header">

          <div className="header-left">

            <button
              className="menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <span className="live-badge">
              LIVE
            </span>

            <span className="last-update">

              Last Updated:{" "}

              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "Loading..."}

            </span>

          </div>


          <div className="header-right">

            {/* Station / GPS Selector */}
            <select
              className="station-dropdown"
              value={selectedStation}
              onChange={handleStationChange}
              title="Select location preset or use live GPS"
            >
              {LOCATION_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              className="gps-detect-button"
              onClick={handleDetectGPS}
              title="Detect device GPS coordinates"
            >
              🎯 GPS
            </button>

            <div className="location-box" title="Currently monitored coordinates">
              📍 {resolvedCity}
              {location?.latitude ? ` (${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°)` : ""}
            </div>

            <button
              className="refresh-top-button"
              onClick={() => fetchDashboardData(location)}
              disabled={refreshing}
            >
              <span style={{
                display: "inline-block",
                animation: refreshing ? "spin 0.7s linear infinite" : "none"
              }}>↻</span>
              {refreshing ? "Updating..." : "Refresh"}
            </button>

          </div>

        </header>



        {/* ===============================
            PAGE TITLE
        =============================== */}

        <section className="page-intro">

          <div>

            <p className="page-eyebrow">
              {viewTitles[activeNav]?.eyebrow || "REAL-TIME EARLY WARNING SYSTEM"}
            </p>

            <h2>
              {viewTitles[activeNav]?.title || "Weather Risk Command Center"}
            </h2>

            <p>
              {viewTitles[activeNav]?.subtitle || "AI-powered hyper-local weather monitoring and hazard prediction"}
            </p>

          </div>

          <div className="system-live">
            <span className="pulse-dot"></span>
            System Operational
          </div>

        </section>



        {activeNav === "Dashboard" ? (
          <>
            {/* ===============================
                ATMOSPHERIC TELEMETRY KPI STRIP
            =============================== */}
            <div className="kpi-ticker-strip">
              <div className="kpi-ticker-card">
                <div className="kpi-icon-box">📍</div>
                <div className="kpi-data">
                  <span className="kpi-label">Active Monitored Station</span>
                  <span className="kpi-value">{resolvedCity}</span>
                  <span className="kpi-sub">
                    {location?.latitude ? `${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E` : "Radar Ready"}
                  </span>
                </div>
              </div>

              <div className="kpi-ticker-card">
                <div className="kpi-icon-box" style={{ color: "var(--cyan)" }}>⚡</div>
                <div className="kpi-data">
                  <span className="kpi-label">CAPE Convective Energy</span>
                  <span className="kpi-value">
                    {weatherData?.cape ?? "0"} <span style={{ fontSize: "12px", fontWeight: 400 }}>J/kg</span>
                  </span>
                  <span className="kpi-sub">
                    {weatherData?.cape > 1500 ? "Severe Updraft Threat" : weatherData?.cape > 800 ? "Moderate Instability" : "Nominal Stability"}
                  </span>
                </div>
              </div>

              <div className="kpi-ticker-card">
                <div className="kpi-icon-box" style={{ color: "var(--blue)" }}>💧</div>
                <div className="kpi-data">
                  <span className="kpi-label">Tropospheric Vapor (IWV)</span>
                  <span className="kpi-value">
                    {weatherData?.iwv ?? "0"} <span style={{ fontSize: "12px", fontWeight: 400 }}>mm</span>
                  </span>
                  <span className="kpi-sub">
                    {weatherData?.iwv > 50 ? "Saturated Atmospheric Column" : "Normal Moisture"}
                  </span>
                </div>
              </div>

              <div className="kpi-ticker-card">
                <div className="kpi-icon-box" style={{ color: "var(--orange)" }}>🎯</div>
                <div className="kpi-data">
                  <span className="kpi-label">Dominant Risk Alert</span>
                  <span className="kpi-value" style={{ fontSize: "16px" }}>
                    {predictionEntries[0] ? predictionEntries[0][0].replaceAll("_", " ").toUpperCase() : "MONITORING"}
                  </span>
                  <span className="kpi-sub">
                    Confidence: {overallConfidence}% • {alerts.length} Active Bulletins
                  </span>
                </div>
              </div>
            </div>

            {/* ===============================
                TOP RISK CARDS
            =============================== */}

            <section className="top-risk-grid">

          {predictionEntries.length > 0 ? (

            predictionEntries
              .slice(0, 3)
              .map(([hazard, prediction], i) => (

                <div
                  key={hazard}
                  className={`top-risk-card ${getRiskClass(
                    prediction.risk_level
                  )}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >

                  <div className="risk-card-icon">

                    {hazard.toLowerCase().includes(
                      "thunder"
                    )
                      ? "⚡"
                      : hazard.toLowerCase().includes(
                          "cloud"
                        )
                      ? "☁️"
                      : "🌊"}

                  </div>


                  <div className="risk-card-content">

                    <p className="risk-card-title">

                      {hazard
                        .replaceAll("_", " ")
                        .toUpperCase()}

                    </p>


                    <div className="risk-card-main">

                      <strong>

                        {formatProbability(
                          prediction.probability
                        )}

                      </strong>

                      <span>

                        {prediction.risk_level ||
                          "LOW"}

                      </span>

                    </div>


                    <p className="impact-text">
                      AI prediction active
                    </p>

                  </div>

                </div>

              ))

          ) : (

            <div className="empty-panel">
              No live prediction data available.
            </div>

          )}



          {/* OVERALL CONFIDENCE */}

          <div className="confidence-card">

            <div>

              <p>
                OVERALL CONFIDENCE
              </p>

              <strong>
                {overallConfidence}%
              </strong>

              <span>
                Model Confidence
              </span>

            </div>

            <div className="confidence-icon">
              🛡️
            </div>

          </div>

        </section>



        {/* ===============================
            MAIN INTELLIGENCE GRID
        =============================== */}

        <section className="command-grid">


          {/* MAP */}

          <div className="command-map">

            <div className="panel-header">

              <div>

                <h3>
                  LIVE RISK MAP
                </h3>

                <p>
                  Hyper-local hazard monitoring
                </p>

              </div>

              <span className="panel-live">
                ● LIVE
              </span>

            </div>


            <div className="map-content">

              <RiskMap
                initialData={riskMap}
                location={location}
                onSelectLocation={(coords) => fetchDashboardData(coords)}
                isFullMap={false}
              />

            </div>

          </div>



          {/* AI INSIGHTS */}

          <div className="ai-insights-panel">

            <div className="panel-header">

              <div>

                <h3>
                  AI INSIGHTS
                </h3>

                <p>
                  Atmospheric intelligence
                </p>

              </div>

            </div>


            <AIExplanation
              weather={weatherData}
              prediction={predictionData}
            />

          </div>

        </section>



        {/* ===============================
            WEATHER INTELLIGENCE
        =============================== */}

        <section className="wide-panel">

          <div className="panel-header">

            <div>

              <h3>
                WEATHER INTELLIGENCE
              </h3>

              <p>
                Live atmospheric observations
                and environmental signals
              </p>

            </div>

          </div>


          <WeatherIntelligence weather={weatherData} />

        </section>



        {/* ===============================
            BOTTOM GRID
        =============================== */}

        <section className="bottom-grid">


          {/* RISK ZONES */}

          <div className="bottom-panel">

            <div className="panel-header">

              <div>

                <h3>
                  HIGH RISK AREAS
                </h3>

                <p>
                  Monitored geographic zones
                </p>

              </div>

            </div>


            <div className="risk-zones-list">

              {riskMap?.features?.length > 0 ? (

                riskMap.features.map(
                  (feature, index) => (

                    <div
                      className="risk-zone-row"
                      key={
                        feature.properties.zone_id
                      }
                    >

                      <span className="zone-number">
                        {index + 1}
                      </span>


                      <div className="zone-info">

                        <strong>
                          {
                            feature.properties
                              .zone_name
                          }
                        </strong>

                        <span>
                          {
                            feature.properties
                              .hazard
                          }
                        </span>

                      </div>


                      <div
                        className={`zone-score ${getRiskClass(
                          feature.properties
                            .risk_level
                        )}`}
                      >

                        {formatProbability(
                          feature.properties
                            .probability
                        )}

                      </div>

                    </div>

                  )
                )

              ) : (

                <p className="empty-text">
                  Risk zone data unavailable.
                </p>

              )}

            </div>

          </div>



          {/* ALERTS */}

          <div className="bottom-panel">

            <div className="panel-header">

              <div>

                <h3>
                  RECENT ALERTS
                </h3>

                <p>
                  Latest AI-generated warnings
                </p>

              </div>

            </div>


            <div className="recent-alerts">

              {alerts.length > 0 ? (

                alerts.slice(0, 5).map(
                  (alert, index) => (

                    <div
                      className="recent-alert"
                      key={
                        alert.alert_id ||
                        index
                      }
                    >

                      <div className="alert-symbol">
                        ⚠
                      </div>


                      <div className="recent-alert-info">

                        <strong>

                          {alert.hazard
                            ?.replaceAll(
                              "_",
                              " "
                            )
                            .toUpperCase() ||
                            "WEATHER ALERT"}

                        </strong>


                        <span>

                          {alert.location_name ||
                            "Monitored Area"}

                        </span>

                      </div>


                      <div className="alert-severity">

                        {alert.severity ||
                          "ACTIVE"}

                      </div>

                    </div>

                  )
                )

              ) : (

                <div className="no-alerts">

                  <span>
                    ✓
                  </span>

                  No active alerts

                </div>

              )}

            </div>

          </div>

        </section>



        {/* ===============================
            SYSTEM STATUS
        =============================== */}

        <section className="wide-panel">

          <SystemStatus />

        </section>



        {/* ===============================
            LIVE LOCATION
        =============================== */}

        <section className="wide-panel">

          <LiveLocation />

        </section>
      </>
    ) : (
      <div className="view-container">
        <div className="view-breadcrumb">
          <button onClick={() => setActiveNav("Dashboard")}>← Back to Dashboard</button>
          <span>/</span>
          <span>{activeNav}</span>
        </div>

        {activeNav === "Live Map" && (
          <div className="command-grid">
            <div className="command-map" style={{ width: "100%" }}>
              <RiskMap
                initialData={riskMap}
                location={location}
                onSelectLocation={(coords) => fetchDashboardData(coords)}
                isFullMap={true}
              />
            </div>

            <div className="bottom-panel">
              <div className="panel-header">
                <div>
                  <h3>MONITORED SECTORS</h3>
                  <p>Live radius zones and risk levels</p>
                </div>
              </div>

              <div className="risk-zones-list">
                {riskMap?.features?.length > 0 ? (
                  riskMap.features.map((feature, index) => (
                    <div className="risk-zone-row" key={feature.properties.zone_id || index}>
                      <span className="zone-number">{index + 1}</span>
                      <div className="zone-info">
                        <strong>{feature.properties.zone_name}</strong>
                        <span>{feature.properties.hazard}</span>
                      </div>
                      <div className={`zone-score ${getRiskClass(feature.properties.risk_level)}`}>
                        {formatProbability(feature.properties.probability)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No active risk zones reported.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeNav === "Risk Forecast" && (
          <>
            <div className="forecast-detail-grid">
              {predictionEntries.map(([hazard, prediction]) => (
                <div key={hazard} className={`forecast-card ${getRiskClass(prediction.risk_level)}`}>
                  <div className="forecast-header">
                    <h3>{hazard.replaceAll("_", " ")}</h3>
                    <span className={`risk-badge ${getRiskClass(prediction.risk_level)}`}>
                      {prediction.risk_level}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Risk Probability</span>
                      <strong style={{ fontSize: "20px", color: "#fff" }}>
                        {formatProbability(prediction.probability)}
                      </strong>
                    </div>

                    <div className="probability-bar-bg">
                      <div
                        className="probability-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, prediction.probability > 1 ? prediction.probability : prediction.probability * 100))}%`,
                          background:
                            prediction.risk_level === "CRITICAL"
                              ? "var(--red)"
                              : prediction.risk_level === "HIGH"
                              ? "var(--orange)"
                              : prediction.risk_level === "MODERATE"
                              ? "var(--yellow)"
                              : "var(--green)"
                        }}
                      />
                    </div>
                  </div>

                  <div className="action-box">
                    <strong>Precautionary Advisory:</strong>
                    <p style={{ margin: "6px 0 0" }}>
                      {prediction.risk_level === "CRITICAL"
                        ? "Immediate indoor shelter required. Evacuate low-lying zones, waterways, and unstable structures."
                        : prediction.risk_level === "HIGH"
                        ? "High vigilance advised. Suspend non-essential outdoor transit and secure high-risk infrastructure."
                        : prediction.risk_level === "MODERATE"
                        ? "Moderate vigilance advised. Monitor convective satellite radar updates and rain gauges."
                        : "Nominal safety thresholds. Standard seasonal precautions remain adequate."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <section className="wide-panel">
              <div className="panel-header">
                <div>
                  <h3>ATMOSPHERIC RADAR OBSERVATION</h3>
                  <p>Environmental parameters supporting prediction</p>
                </div>
              </div>
              <WeatherIntelligence weather={weatherData} />
            </section>
          </>
        )}

        {activeNav === "Alerts" && (
          <div className="bottom-panel" style={{ width: "100%" }}>
            <div className="alerts-filter-bar">
              {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map((level) => (
                <button
                  key={level}
                  className={`alerts-filter-btn ${alertFilter === level ? "active" : ""}`}
                  onClick={() => setAlertFilter(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="recent-alerts">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => (
                  <div className="recent-alert" key={alert.alert_id || index} style={{ padding: "16px" }}>
                    <div className="alert-symbol">⚠</div>
                    <div className="recent-alert-info">
                      <strong>{alert.hazard?.replaceAll("_", " ").toUpperCase() || "WEATHER ALERT"}</strong>
                      <span>
                        Target Area: {alert.location_name || "Monitored Location"}
                        {alert.lead_time_hours ? ` • Impact Time: ~${alert.lead_time_hours}h` : ""}
                      </span>
                      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text)" }}>
                        {alert.message || alert.recommended_action || "Stay alert and follow official weather bulletins."}
                      </p>
                    </div>
                    <div className="alert-severity" style={{ alignSelf: "flex-start" }}>
                      {alert.severity || "ACTIVE"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <span>✓</span>
                  No active warnings matching filter ({alertFilter}).
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === "AI Explainability" && (
          <>
            <AIExplanation
              weather={weatherData}
              prediction={predictionData}
            />

            <div className="wide-panel">
              <div className="panel-header">
                <div>
                  <h3>PHYSICAL CONVECTIVE TRIGGERS</h3>
                  <p>How atmospheric indices map to severe hazard probabilities</p>
                </div>
              </div>
              <div style={{ padding: "20px", fontSize: "13px", color: "var(--text)", lineHeight: "1.6" }}>
                <p>
                  The <strong>Vajra AI Engine</strong> computes nowcasting probability scores from a rolling 5-step time series matrix of atmospheric parameters:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "16px" }}>
                  <div className="action-box">
                    <strong style={{ color: "var(--cyan)" }}>⚡ Thunderstorm Trigger</strong>
                    <p style={{ margin: "4px 0 0" }}>High CAPE (&gt;1200 J/kg) combined with cloud top temperatures cooling below -40°C indicates violent vertical updrafts.</p>
                  </div>
                  <div className="action-box">
                    <strong style={{ color: "var(--blue)" }}>☁️ Cloudburst Trigger</strong>
                    <p style={{ margin: "4px 0 0" }}>Saturated Integrated Water Vapor (IWV &gt; 55 mm) combined with localized convergence creates hyper-intense precipitation bands.</p>
                  </div>
                  <div className="action-box">
                    <strong style={{ color: "var(--yellow)" }}>🌊 Flash Flood Trigger</strong>
                    <p style={{ margin: "4px 0 0" }}>Sudden spikes in hourly rainfall over 30 mm/h exceeding natural drainage capacity within monitored river catchment basins.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeNav === "Impact Analysis" && (
          <>
            <div className="wide-panel">
              <div className="panel-header">
                <div>
                  <h3>THERMODYNAMIC INSTABILITY PROFILE</h3>
                  <p>Surface & sounding convective indicators</p>
                </div>
              </div>
              <WeatherIntelligence weather={weatherData} />
            </div>

            <div className="command-grid">
              <div className="command-map">
                <RiskMap
                  initialData={riskMap}
                  location={location}
                  onSelectLocation={(coords) => fetchDashboardData(coords)}
                  isFullMap={false}
                />
              </div>
              <div className="ai-insights-panel">
                <AIExplanation weather={weatherData} prediction={predictionData} />
              </div>
            </div>
          </>
        )}

        {activeNav === "Data Layers" && (
          <>
            <div className="wide-panel">
              <div className="panel-header">
                <div>
                  <h3>RAW OBSERVATIONAL METRICS</h3>
                  <p>Real-time meteorological ingest</p>
                </div>
              </div>
              <WeatherIntelligence weather={weatherData} />
            </div>

            <div className="wide-panel">
              <LiveLocation />
            </div>
          </>
        )}

        {activeNav === "Reports" && (
          <>
            <div className="wide-panel">
              <div className="panel-header">
                <div>
                  <h3>SYSTEM AUDIT & PERFORMANCE LOGS</h3>
                  <p>Operational health metrics</p>
                </div>
              </div>

              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Status</th>
                    <th>Cadence</th>
                    <th>Last Verified</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ML Nowcasting Classifier</td>
                    <td><span style={{ color: "var(--green)" }}>● OPERATIONAL</span></td>
                    <td>5-step Window</td>
                    <td>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Recent"}</td>
                  </tr>
                  <tr>
                    <td>Live Weather Data Feed</td>
                    <td><span style={{ color: "var(--green)" }}>● LIVE</span></td>
                    <td>60 Seconds</td>
                    <td>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Recent"}</td>
                  </tr>
                  <tr>
                    <td>GeoJSON Risk Zones Engine</td>
                    <td><span style={{ color: "var(--green)" }}>● ACTIVE</span></td>
                    <td>Dynamic Filter</td>
                    <td>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Recent"}</td>
                  </tr>
                  <tr>
                    <td>Automated Warning Dispatch</td>
                    <td><span style={{ color: "var(--green)" }}>● LISTENING</span></td>
                    <td>Continuous Stream</td>
                    <td>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Recent"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="wide-panel">
              <SystemStatus />
            </div>
          </>
        )}

        {/* Defensive fallback for any unrecognised nav items */}
        {![
          "Live Map", "Risk Forecast", "Alerts",
          "AI Explainability", "Impact Analysis",
          "Data Layers", "Reports"
        ].includes(activeNav) && activeNav !== "Dashboard" && (
          <div className="empty-panel" style={{ textAlign: "center", padding: "60px" }}>
            <p>View <strong>{activeNav}</strong> is not yet available.</p>
            <button onClick={() => setActiveNav("Dashboard")}>← Back to Dashboard</button>
          </div>
        )}
      </div>
    )}



        {/* ===============================
            FOOTER
        =============================== */}

        <footer className="dashboard-footer">

          <span>
            © 2026 Vajra Weather Intelligence
          </span>

          <span>
            Built for Disaster Management
          </span>

          <span>
            AI-Powered Early Warning System
          </span>

        </footer>

      </main>

    </div>
  );
}


export default App;