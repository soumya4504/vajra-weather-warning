import { useEffect, useState } from "react";

function LiveLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <h2>📍 Live Location</h2>
          <p>Your current device location</p>
        </div>
      </div>

      {error && (
        <div className="empty-state">
          <h3>Location unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {location && (
        <div className="weather-grid">
          <div className="weather-card">
            <span>🌐</span>
            <h3>Latitude</h3>
            <strong>{location.latitude.toFixed(6)}</strong>
          </div>

          <div className="weather-card">
            <span>🌐</span>
            <h3>Longitude</h3>
            <strong>{location.longitude.toFixed(6)}</strong>
          </div>

          <div className="weather-card">
            <span>🎯</span>
            <h3>Accuracy</h3>
            <strong>{location.accuracy.toFixed(0)} m</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default LiveLocation;