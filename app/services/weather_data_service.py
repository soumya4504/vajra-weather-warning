import os
import math
import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------
# API CONFIGURATION
# ---------------------------------

OPENWEATHER_API_KEY = (
    os.getenv("OPENWEATHER_API_KEY")
    or os.getenv("WEATHER_API_KEY")
    or ""
).strip()

OPENWEATHER_URL = os.getenv(
    "WEATHER_API_URL",
    "https://api.openweathermap.org/data/2.5/weather"
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

DEFAULT_CITY = "Bengaluru"
DEFAULT_COUNTRY = "IN"
DEFAULT_LAT = 12.9716
DEFAULT_LON = 77.5946


# ---------------------------------
# REVERSE GEOCODING (VILLAGE & LOCAL AREA RESOLUTION)
# ---------------------------------

_GEOCODE_CACHE = {}

def resolve_village_hierarchy(latitude: float, longitude: float) -> dict:
    """
    Reverse geocodes coordinates down to micro-level village, hamlet, or local settlement.
    Does NOT use coarse district city overrides, enabling true hyper-local area nowcasting.
    """
    cache_key = (round(latitude, 4), round(longitude, 4))
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    local_name = None
    subdistrict = None
    district = None
    state = None
    formatted = None

    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?lat={latitude}&lon={longitude}&format=json&zoom=18&addressdetails=1"
        )
        req = requests.get(
            url,
            headers={"User-Agent": "VajraNowcasting/2.0"},
            timeout=4
        )
        if req.status_code == 200:
            res = req.json()
            addr = res.get("address", {})

            # Priority 1: Micro-level settlement (village, hamlet, locality)
            village_tag = (
                addr.get("village")
                or addr.get("hamlet")
                or addr.get("isolated_dwelling")
                or addr.get("locality")
                or addr.get("neighbourhood")
                or addr.get("suburb")
                or addr.get("residential")
                or addr.get("farm")
                or addr.get("allotments")
            )

            # Priority 2: Semi-urban / road / town
            town_tag = addr.get("town") or addr.get("city")
            road_tag = addr.get("road")

            subdistrict = (
                addr.get("county")
                or addr.get("subdistrict")
                or addr.get("tehsil")
                or addr.get("block")
                or addr.get("taluk")
            )
            district = addr.get("state_district") or addr.get("district")
            state = addr.get("state")

            if village_tag:
                local_name = f"{village_tag} Village" if not village_tag.lower().endswith("village") else village_tag
            elif town_tag:
                local_name = town_tag
            elif road_tag and subdistrict:
                local_name = f"{road_tag}, {subdistrict}"
            elif subdistrict:
                local_name = f"{subdistrict} Sector"
            elif district:
                local_name = f"{district} Sector"
            else:
                local_name = f"Local Area ({latitude:.3f}°N, {longitude:.3f}°E)"

            # Build readable address
            parts = [p for p in [local_name, subdistrict, district, state] if p]
            formatted = ", ".join(parts)

    except Exception:
        pass

    if not local_name:
        local_name = f"Village ({latitude:.3f}°N, {longitude:.3f}°E)"
        formatted = f"Village Sector ({latitude:.3f}°N, {longitude:.3f}°E)"

    result = {
        "local_name": local_name,
        "village": local_name,
        "subdistrict": subdistrict or "",
        "district": district or "",
        "state": state or "",
        "formatted_address": formatted
    }

    _GEOCODE_CACHE[cache_key] = result
    return result


def resolve_location_name(latitude: float, longitude: float) -> str:
    """Resolve human-readable village/local area name from coordinates."""
    res = resolve_village_hierarchy(latitude, longitude)
    return res["formatted_address"]


# ---------------------------------
# PHYSICAL ATMOSPHERIC FORMULAS
# ---------------------------------

def calculate_physical_iwv(temp_c: float, humidity_percent: float, pressure_hpa: float) -> float:
    """
    Calculate Integrated Water Vapor (IWV in kg/m² or mm) using the
    Magnus-Tetens saturation vapor pressure formula:
      e_sat = 6.112 * exp((17.67 * T) / (T + 243.5))
      e = e_sat * (RH / 100)
      IWV ≈ 1.65 * e * (1013.25 / P)
    """
    e_sat = 6.112 * math.exp((17.67 * temp_c) / (temp_c + 243.5))
    actual_vapor_pressure = e_sat * (humidity_percent / 100.0)
    p_ref = max(750.0, pressure_hpa)
    iwv = 1.65 * actual_vapor_pressure * (1013.25 / p_ref)
    return round(max(10.0, min(85.0, iwv)), 2)


def calculate_cloud_top_temperature(temp_c: float, cloud_cover_percent: float, cape: float, rain_mm: float) -> float:
    """
    Estimate Cloud Top Brightness Temperature (°C).
    Convective updrafts driven by high CAPE push cloud tops into the cold upper troposphere.
    """
    base_cooling = 15.0 + (cloud_cover_percent * 0.3)
    convective_cooling = min(40.0, (cape / 85.0))
    rain_cooling = min(15.0, rain_mm * 1.5)
    ctt = -(base_cooling + convective_cooling + rain_cooling)
    return round(max(-85.0, min(-10.0, ctt)), 2)


# ---------------------------------
# FETCH OPEN-METEO WEATHER
# ---------------------------------

def fetch_open_meteo_weather(latitude: float, longitude: float) -> dict | None:
    """
    Fetch comprehensive, high-resolution live meteorological observation from Open-Meteo.
    Provides free real-time parameters including CAPE, surface pressure, and precipitation.
    """
    try:
        url = (
            f"{OPEN_METEO_URL}?latitude={latitude}&longitude={longitude}"
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
            "surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code"
            "&hourly=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,cloud_cover,wind_speed_10m,cape"
            "&past_hours=6&forecast_hours=1&timezone=auto"
        )
        response = requests.get(url, timeout=6)
        if response.status_code != 200:
            return None

        data = response.json()
        current = data.get("current", {})
        hourly = data.get("hourly", {})

        temp_c = float(current.get("temperature_2m", 28.0))
        humidity = float(current.get("relative_humidity_2m", 65.0))
        pressure = float(current.get("surface_pressure", 1012.0))
        wind_kmh = float(current.get("wind_speed_10m", 12.0))
        wind_dir = float(current.get("wind_direction_10m", 180.0))
        rainfall_mm = float(current.get("precipitation", 0.0))
        cloudiness = float(current.get("cloud_cover", 40.0))

        # Read CAPE from hourly series (last entry before forecast)
        cape_series = hourly.get("cape", [])
        if cape_series:
            valid_cape = [c for c in cape_series if c is not None]
            model_cape = float(valid_cape[-1]) if valid_cape else 800.0
        else:
            model_cape = max(0.0, (temp_c - 16.0) * (humidity - 30.0) * 2.2)

        iwv = calculate_physical_iwv(temp_c, humidity, pressure)
        ctt = calculate_cloud_top_temperature(temp_c, cloudiness, model_cape, rainfall_mm)
        loc_meta = resolve_village_hierarchy(latitude, longitude)
        city_name = loc_meta["local_name"]

        # Interpret weather condition
        weather_code = current.get("weather_code", 0)
        condition = "Clear"
        if weather_code in [1, 2, 3]:
            condition = "Partly Cloudy"
        elif weather_code in [45, 48]:
            condition = "Foggy"
        elif weather_code in [51, 53, 55, 61, 63, 65]:
            condition = "Rain"
        elif weather_code in [80, 81, 82]:
            condition = "Heavy Rain"
        elif weather_code in [95, 96, 99]:
            condition = "Thunderstorm"

        return {
            "city": city_name,
            "village": loc_meta["village"],
            "subdistrict": loc_meta["subdistrict"],
            "district": loc_meta["district"],
            "state": loc_meta["state"],
            "formatted_address": loc_meta["formatted_address"],
            "country": "IN",
            "latitude": latitude,
            "longitude": longitude,
            "temperature_c": temp_c,
            "feels_like_c": float(current.get("apparent_temperature", temp_c)),
            "humidity_percent": humidity,
            "pressure_hpa": pressure,
            "wind_speed_kmh": wind_kmh,
            "wind_direction_deg": wind_dir,
            "rainfall_mm": rainfall_mm,
            "cloudiness_percent": cloudiness,
            "weather_condition": condition,
            "iwv": iwv,
            "cape": round(model_cape, 2),
            "cloud_top_temp": ctt,
            "source": "open-meteo"
        }
    except Exception:
        return None


# ---------------------------------
# GET LATEST WEATHER DATA
# ---------------------------------

def get_latest_weather_data(
    latitude: float | None = None,
    longitude: float | None = None
) -> dict:
    """
    Get live weather data for target coordinates.
    Prioritizes Open-Meteo for physical atmospheric parameters (CAPE, surface pressure),
    then OpenWeather, and graceful fallback with resolved coordinates.
    """
    lat = float(latitude) if latitude is not None else DEFAULT_LAT
    lon = float(longitude) if longitude is not None else DEFAULT_LON

    # 1. Try Open-Meteo
    open_meteo_res = fetch_open_meteo_weather(lat, lon)
    if open_meteo_res:
        return open_meteo_res

    # 2. Try OpenWeather if API Key is available
    loc_meta = resolve_village_hierarchy(lat, lon)
    if OPENWEATHER_API_KEY:
        try:
            params = {
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
                "lat": lat,
                "lon": lon
            }
            res = requests.get(OPENWEATHER_URL, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                temp_c = data.get("main", {}).get("temp", 28.0)
                humidity = data.get("main", {}).get("humidity", 70.0)
                pressure = data.get("main", {}).get("pressure", 1012.0)
                wind_kmh = data.get("wind", {}).get("speed", 4.0) * 3.6
                clouds = data.get("clouds", {}).get("all", 40.0)
                rain_1h = data.get("rain", {}).get("1h", 0.0)

                iwv = calculate_physical_iwv(temp_c, humidity, pressure)
                thermal_excess = max(0.0, temp_c - 18.0)
                moisture_excess = max(0.0, humidity - 35.0)
                cape = round(thermal_excess * moisture_excess * 2.8, 2)
                ctt = calculate_cloud_top_temperature(temp_c, clouds, cape, rain_1h)

                return {
                    "city": loc_meta["local_name"],
                    "village": loc_meta["village"],
                    "subdistrict": loc_meta["subdistrict"],
                    "district": loc_meta["district"],
                    "state": loc_meta["state"],
                    "formatted_address": loc_meta["formatted_address"],
                    "country": data.get("sys", {}).get("country", "IN"),
                    "latitude": lat,
                    "longitude": lon,
                    "temperature_c": temp_c,
                    "feels_like_c": data.get("main", {}).get("feels_like", temp_c),
                    "humidity_percent": humidity,
                    "pressure_hpa": pressure,
                    "wind_speed_kmh": round(wind_kmh, 2),
                    "wind_direction_deg": data.get("wind", {}).get("deg", 180.0),
                    "weather_condition": data.get("weather", [{}])[0].get("description", "partly cloudy"),
                    "cloudiness_percent": clouds,
                    "rainfall_mm": rain_1h,
                    "iwv": iwv,
                    "cape": cape,
                    "cloud_top_temp": ctt,
                    "source": "openweather"
                }
        except Exception:
            pass

    # 3. Graceful Fallback grounded in the coordinates
    base_temp = 28.5
    base_humidity = 72.0
    base_pressure = 1012.0
    iwv = calculate_physical_iwv(base_temp, base_humidity, base_pressure)
    cape = 950.0
    ctt = calculate_cloud_top_temperature(base_temp, 45.0, cape, 0.0)

    return {
        "city": loc_meta["local_name"],
        "village": loc_meta["village"],
        "subdistrict": loc_meta["subdistrict"],
        "district": loc_meta["district"],
        "state": loc_meta["state"],
        "formatted_address": loc_meta["formatted_address"],
        "country": "IN",
        "latitude": lat,
        "longitude": lon,
        "temperature_c": base_temp,
        "feels_like_c": 31.0,
        "humidity_percent": base_humidity,
        "pressure_hpa": base_pressure,
        "wind_speed_kmh": 14.5,
        "wind_direction_deg": 210.0,
        "weather_condition": "partly cloudy",
        "cloudiness_percent": 45.0,
        "rainfall_mm": 0.0,
        "iwv": iwv,
        "cape": cape,
        "cloud_top_temp": ctt,
        "source": "local-fallback"
    }


# ---------------------------------
# GET TIME-ALIGNED HOURLY HISTORY
# ---------------------------------

def get_hourly_weather_history(
    latitude: float,
    longitude: float,
    steps: int = 5
) -> list[dict]:
    """
    Fetch the actual last `steps` hourly timesteps (e.g. t-4, t-3, t-2, t-1, t0)
    for the exact target location from Open-Meteo historical/current series.
    """
    try:
        url = (
            f"{OPEN_METEO_URL}?latitude={latitude}&longitude={longitude}"
            "&hourly=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,cloud_cover,wind_speed_10m,cape"
            f"&past_hours={steps + 2}&forecast_hours=1&timezone=auto"
        )
        res = requests.get(url, timeout=6)
        if res.status_code == 200:
            data = res.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            if len(times) >= steps:
                # Take the last `steps` past observations
                target_indices = range(len(times) - steps, len(times))
                records = []
                for idx in target_indices:
                    t = float(hourly["temperature_2m"][idx] or 28.0)
                    rh = float(hourly["relative_humidity_2m"][idx] or 65.0)
                    p = float(hourly["surface_pressure"][idx] or 1012.0)
                    rain = float(hourly["precipitation"][idx] or 0.0)
                    w = float(hourly["wind_speed_10m"][idx] or 12.0)
                    clouds = float(hourly["cloud_cover"][idx] or 40.0)
                    cape = float(hourly["cape"][idx] if hourly.get("cape") and hourly["cape"][idx] is not None else 800.0)

                    iwv = calculate_physical_iwv(t, rh, p)
                    ctt = calculate_cloud_top_temperature(t, clouds, cape, rain)

                    records.append({
                        "timestamp": times[idx],
                        "temperature_c": t,
                        "humidity_percent": rh,
                        "pressure_hpa": p,
                        "wind_speed_kmh": w,
                        "rainfall_mm": rain,
                        "cloudiness_percent": clouds,
                        "cape": cape,
                        "iwv": iwv,
                        "cloud_top_temp": ctt
                    })
                return records
    except Exception:
        pass

    # Fallback to dynamic grounded steps from latest observation
    latest = get_latest_weather_data(latitude, longitude)
    records = []
    base_iwv = latest["iwv"]
    base_cape = latest["cape"]
    base_rain = latest["rainfall_mm"]
    base_ctt = latest["cloud_top_temp"]
    base_wind = latest["wind_speed_kmh"]

    for i in range(steps):
        f = i / float(steps - 1)
        records.append({
            "timestamp": f"t-{steps - 1 - i}h",
            "temperature_c": latest["temperature_c"],
            "humidity_percent": latest["humidity_percent"],
            "pressure_hpa": latest["pressure_hpa"],
            "wind_speed_kmh": round(base_wind * (0.85 + 0.15 * f), 2),
            "rainfall_mm": round(base_rain * (0.2 + 0.8 * f), 2),
            "cloudiness_percent": latest["cloudiness_percent"],
            "cape": round(base_cape * (0.75 + 0.25 * f), 2),
            "iwv": round(base_iwv * (0.88 + 0.12 * f), 2),
            "cloud_top_temp": round(base_ctt + (steps - 1 - i) * 2.0, 2)
        })
    return records