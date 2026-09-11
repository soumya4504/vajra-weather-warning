# ⚡ Vajra — Hyper-Local Deep Village Weather Warning & Nowcasting System

> **Vajra (वज्र)** is an advanced AI-powered meteorological nowcasting and early warning intelligence platform engineered for rural settlements, agricultural zones, and localized regions prone to convective weather hazards: **Thunderstorms & Severe Lightning**, **Cloudbursts**, and **Flash Floods**.

---

## 🌟 Key Features

- **🏡 Deep Village & Hamlet Level Nowcasting**:
  - Direct micro-settlement hierarchy resolution (`Village` → `Hamlet` → `Block/Tehsil` → `District` → `State`) without coarse district centroid overrides.
  - Interactive click-to-inspect point telemetry anywhere on the map across India.

- **🗺️ High-Resolution Geospatial Radar Mapping**:
  - Leaflet-powered GIS engine zooming up to **Zoom Level 19** (deep village roads, field boundaries, and water bodies).
  - Multi-layer tile switcher:
    - 🏡 **Village Map**: Deep OpenStreetMap network with vernacular names and rural paths.
    - 🛰️ **Satellite Hybrid**: Esri World Imagery with overlaid administrative place names.
    - 🏔️ **Topographic & Terrain**: Elevation contours, hill shading, and hydrological flow paths.
    - 🌙 **Tactical Dark**: CartoDB Voyager for high-contrast low-light operations.
  - Smooth pan/drag/zoom navigation with collapsible inspection drawers.

- **⚡ Real-Time Atmospheric Sounding & Physics Ingestion**:
  - Ingestion of thermodynamic instability parameters:
    - **CAPE** (Convective Available Potential Energy in J/kg)
    - **IWV** (Integrated Column Water Vapor in mm)
    - **Cloud Top Temperature** (°C)
    - **Wind Velocity & Direction**
    - **Precipitation & Rain Rate** (mm/h)

- **🤖 Multi-Hazard Machine Learning Inference**:
  - Pre-trained ensemble classifiers (Random Forest) combined with thermodynamic threshold rules to predict probability and risk levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).

- **🚨 Rural Emergency & Safety Action Directives**:
  - Tailored guidelines for farmers, open fields, tin-shed houses, cattle corrals, tubewell pump isolations, and riverine causeways.
  - Emergency kit checklists and immediate mitigation protocols.

---

## 🏗️ Architecture

```
vajra-weather-warning/
├── app/
│   ├── api/routes/           # FastAPI endpoints (weather, predict, risk-map, alerts, system-status)
│   ├── core/                 # App configuration & logging
│   ├── models/               # ML model loaders & inference pipeline
│   ├── schemas/              # Pydantic schemas with village hierarchy fields
│   ├── services/             # Weather ingestion, geocoding & nowcasting services
│   └── main.py               # FastAPI application entrypoint
├── scripts/
│   ├── train_model.py        # ML training pipeline for convective hazards
│   └── verify_*.py           # Sensor & API verification utilities
├── vajra-frontend/
│   ├── src/
│   │   ├── components/       # RiskMap, WeatherIntelligence, TopRiskMetrics, etc.
│   │   ├── App.jsx           # Master dashboard & navigation
│   │   ├── App.css           # Modern dark-mode glassmorphic design system
│   │   └── main.jsx          # React Vite root
│   └── package.json
├── requirements.txt          # Python backend dependencies
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to project directory
cd vajra-weather-warning

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Backend will be live at `http://127.0.0.1:8001` (Docs at `http://127.0.0.1:8001/docs`).

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd vajra-frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

Frontend dashboard will be accessible at `http://localhost:5173`.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic, Scikit-Learn, Joblib, NumPy
- **Frontend**: React 18, Vite, React-Leaflet, Leaflet, Lucide Icons, Vanilla CSS Design System
- **Geodata & Mapping**: OpenStreetMap, Esri World Imagery, OpenTopoMap, CARTO Voyager, Nominatim Reverse Geocoding

---

## 📄 License

This project is licensed under the MIT License.
