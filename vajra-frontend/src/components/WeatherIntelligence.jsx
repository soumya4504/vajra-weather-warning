import { useEffect, useState } from "react";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" && window.location.port === "5173" ? "http://localhost:8001" : "");

function WeatherIntelligence({ weather: weatherProp }) {
  const [weather, setWeather] = useState(weatherProp || null);
  const [loading, setLoading] = useState(!weatherProp);
  const [error, setError] = useState("");


  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/weather`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error("Weather data is unavailable");
      }

      setWeather(result.data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };


  // If prop is provided, use it and keep in sync
  useEffect(() => {
    if (weatherProp) {
      setWeather(weatherProp);
      setLoading(false);
    }
  }, [weatherProp]);


  // Only self-fetch if no prop given
  useEffect(() => {
    if (!weatherProp) {
      fetchWeather();

      const interval = setInterval(
        fetchWeather,
        30000
      );

      return () => clearInterval(interval);
    }
  }, []);


  const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return "—";
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };


  if (loading) {
    return (
      <section className="weather-intelligence-section">
        Loading weather intelligence...
      </section>
    );
  }


  if (error) {
    return (
      <section className="weather-intelligence-section">

        <h2>🌦️ Weather Intelligence</h2>

        <p>Unable to load weather data: {error}</p>

        {!weatherProp && (
          <button onClick={fetchWeather}>
            Try Again
          </button>
        )}

      </section>
    );
  }

  if (!weather) return null;


  return (
    <section className="weather-intelligence-section">

      <div className="weather-header">

        <div>
          <h2>🌦️ Weather Intelligence</h2>

          <p>
            Live atmospheric conditions from{" "}
            {weather.city}, {weather.country}
          </p>
        </div>

        {!weatherProp && (
          <button onClick={fetchWeather}>
            🔄 Refresh
          </button>
        )}

      </div>


      <div className="weather-grid">

        <div className="weather-card">
          <span>🌡️</span>
          <h3>Temperature</h3>
          <strong>
            {weather.temperature_c}°C
          </strong>
          <p>
            Feels like {weather.feels_like_c}°C
          </p>
        </div>


        <div className="weather-card">
          <span>💧</span>
          <h3>Humidity</h3>
          <strong>
            {weather.humidity_percent}%
          </strong>
        </div>


        <div className="weather-card">
          <span>🌬️</span>
          <h3>Wind Speed</h3>
          <strong>
            {weather.wind_speed_kmh} km/h
          </strong>
          <p>
            Direction: {getWindDirection(weather.wind_direction_deg)} ({weather.wind_direction_deg}°)
          </p>
        </div>


        <div className="weather-card">
          <span>☁️</span>
          <h3>Cloudiness</h3>
          <strong>
            {weather.cloudiness_percent}%
          </strong>
        </div>


        <div className="weather-card">
          <span>🌧️</span>
          <h3>Rainfall</h3>
          <strong>
            {weather.rainfall_mm} mm
          </strong>
        </div>


        <div className="weather-card">
          <span>🎈</span>
          <h3>Pressure</h3>
          <strong>
            {weather.pressure_hpa} hPa
          </strong>
        </div>

      </div>


      <div className="atmospheric-signals">

        <h3>🧠 AI Prediction Signals</h3>

        <div className="signal-grid">

          <div>
            <span>IWV</span>
            <strong>{weather.iwv} mm</strong>
          </div>

          <div>
            <span>CAPE</span>
            <strong>{weather.cape} J/kg</strong>
          </div>

          <div>
            <span>Cloud Top Temperature</span>
            <strong>
              {weather.cloud_top_temp}°C
            </strong>
          </div>

          <div>
            <span>Condition</span>
            <strong>
              {weather.weather_condition}
            </strong>
          </div>

        </div>

      </div>


      <p className="weather-source">
        Data source: {weather.source}
      </p>

    </section>
  );
}


export default WeatherIntelligence;