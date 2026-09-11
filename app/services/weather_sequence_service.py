from app.services.weather_data_service import (
    get_latest_weather_data,
    get_hourly_weather_history,
    calculate_physical_iwv,
    calculate_cloud_top_temperature,
    DEFAULT_LAT,
    DEFAULT_LON
)


def calculate_atmospheric_parameters(weather_data: dict) -> dict:
    """
    Derive meteorological features from raw weather observations.
    Features:
    - iwv: Integrated Water Vapor (kg/m² or mm)
    - cape: Convective Available Potential Energy (J/kg)
    - rainfall_mm: Recent rainfall accumulation (mm)
    - cloud_top_temp: Cloud top brightness temperature (°C)
    - wind_speed_kmh: Surface wind speed (km/h)
    """
    iwv = weather_data.get("iwv")
    cape = weather_data.get("cape")
    ctt = weather_data.get("cloud_top_temp")
    temp_c = float(weather_data.get("temperature_c", 28.0))
    humidity = float(weather_data.get("humidity_percent", 65.0))
    pressure = float(weather_data.get("pressure_hpa", 1012.0))
    clouds = float(weather_data.get("cloudiness_percent", 40.0))
    rain_mm = float(weather_data.get("rainfall_mm", 0.0))
    wind_kmh = float(weather_data.get("wind_speed_kmh", 12.0))

    if iwv is None:
        iwv = calculate_physical_iwv(temp_c, humidity, pressure)
    if cape is None:
        cape = max(0.0, (temp_c - 16.0) * (humidity - 30.0) * 2.5)
    if ctt is None:
        ctt = calculate_cloud_top_temperature(temp_c, clouds, cape, rain_mm)

    return {
        "iwv": round(float(iwv), 2),
        "cape": round(float(cape), 2),
        "rainfall_mm": round(rain_mm, 2),
        "cloud_top_temp": round(float(ctt), 2),
        "wind_speed_kmh": round(wind_kmh, 2)
    }


def build_weather_sequence(
    latitude: float | None = None,
    longitude: float | None = None,
    weather_data: dict | None = None
) -> list[list[float]]:
    """
    Build a time-aligned 5-timestep historical sequence [t-4, t-3, t-2, t-1, t0]
    for the exact target coordinates.

    Each row contains:
    [iwv, cape, rainfall_mm, cloud_top_temp, wind_speed_kmh]
    """
    lat = float(latitude) if latitude is not None else DEFAULT_LAT
    lon = float(longitude) if longitude is not None else DEFAULT_LON

    history = get_hourly_weather_history(lat, lon, steps=5)

    sequence = []
    for step in history:
        sequence.append([
            float(step["iwv"]),
            float(step["cape"]),
            float(step["rainfall_mm"]),
            float(step["cloud_top_temp"]),
            float(step["wind_speed_kmh"])
        ])

    return sequence


def extract_feature_attribution_deltas(weather_sequence: list[list[float]]) -> dict:
    """
    Compute physical dynamic deltas between t-4 and t0 across the 5-step sequence.
    Provides XAI (explainable AI) feature attribution metrics:
    - delta_iwv: rate of moisture convergence (kg/m² per 4h)
    - delta_cape: rate of convective instability accumulation (J/kg per 4h)
    - delta_ctt: rate of cloud top cooling (°C per 4h)
    - total_rainfall_window: cumulative precipitation across nowcasting window (mm)
    - delta_wind: kinetic acceleration (km/h)
    """
    if len(weather_sequence) < 2:
        return {}

    t_initial = weather_sequence[0]
    t_latest = weather_sequence[-1]

    delta_iwv = round(t_latest[0] - t_initial[0], 2)
    delta_cape = round(t_latest[1] - t_initial[1], 2)
    delta_ctt = round(t_latest[3] - t_initial[3], 2)  # negative means rapid cooling / towering storm
    delta_wind = round(t_latest[4] - t_initial[4], 2)
    total_rain = round(sum(step[2] for step in weather_sequence), 2)

    return {
        "latest_iwv": t_latest[0],
        "delta_iwv": delta_iwv,
        "latest_cape": t_latest[1],
        "delta_cape": delta_cape,
        "latest_rainfall_mm": t_latest[2],
        "total_rainfall_window_mm": total_rain,
        "latest_cloud_top_temp": t_latest[3],
        "delta_cloud_top_temp": delta_ctt,
        "latest_wind_speed_kmh": t_latest[4],
        "delta_wind_speed_kmh": delta_wind,
        "rapid_cooling_detected": delta_ctt < -5.0,
        "moisture_convergence_detected": delta_iwv > 2.0,
        "energy_buildup_detected": delta_cape > 150.0
    }