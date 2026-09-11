function AIExplanation({ weather, prediction }) {

  if (!weather) {
    return null;
  }


  const getSignalLevel = (value, type) => {

    if (type === "humidity") {
      if (value >= 85) return "High";
      if (value >= 70) return "Moderate";
      return "Normal";
    }

    if (type === "cloudiness") {
      if (value >= 80) return "High";
      if (value >= 50) return "Moderate";
      return "Low";
    }

    if (type === "cape") {
      if (value >= 2000) return "Very High";
      if (value >= 1000) return "High";
      if (value >= 500) return "Moderate";
      return "Low";
    }

    if (type === "iwv") {
      if (value >= 60) return "High";
      if (value >= 40) return "Moderate";
      return "Low";
    }

    return "Available";
  };


  const signals = [
    {
      icon: "💧",
      name: "Atmospheric Moisture",
      value: weather.iwv,
      unit: "",
      level: getSignalLevel(weather.iwv, "iwv"),
      explanation:
        "Higher atmospheric moisture can support intense rainfall development."
    },

    {
      icon: "⚡",
      name: "Atmospheric Instability",
      value: weather.cape,
      unit: " J/kg",
      level: getSignalLevel(weather.cape, "cape"),
      explanation:
        "CAPE represents the potential energy available for convective storm development."
    },

    {
      icon: "💦",
      name: "Humidity",
      value: weather.humidity_percent,
      unit: "%",
      level: getSignalLevel(
        weather.humidity_percent,
        "humidity"
      ),
      explanation:
        "High humidity indicates increased moisture available in the atmosphere."
    },

    {
      icon: "☁️",
      name: "Cloud Coverage",
      value: weather.cloudiness_percent,
      unit: "%",
      level: getSignalLevel(
        weather.cloudiness_percent,
        "cloudiness"
      ),
      explanation:
        "Dense cloud coverage can indicate active atmospheric conditions."
    }
  ];


  return (
    <section className="ai-explanation-section">

      <div className="ai-explanation-header">

        <div>
          <h2>🧠 AI Prediction Intelligence</h2>

          <p>
            Key atmospheric signals contributing to
            hazard risk analysis
          </p>
        </div>

        <div className="ai-status-badge">
          AI ANALYSIS ACTIVE
        </div>

      </div>


      <div className="signal-analysis-grid">

        {signals.map((signal) => (

          <div
            className="signal-analysis-card"
            key={signal.name}
          >

            <div className="signal-icon">
              {signal.icon}
            </div>


            <div className="signal-content">

              <h3>{signal.name}</h3>

              <div className="signal-value">

                {signal.value}
                {signal.unit}

              </div>


              <span className="signal-level">
                {signal.level}
              </span>


              <p>
                {signal.explanation}
              </p>

            </div>

          </div>

        ))}

      </div>


      <div className="ai-explanation-footer">

        <strong>
          How Vajra analyzes risk:
        </strong>

        <span>
          Atmospheric signals are processed together to
          estimate the probability of thunderstorm,
          cloudburst, and flash flood hazards.
        </span>

      </div>

    </section>
  );
}


export default AIExplanation;