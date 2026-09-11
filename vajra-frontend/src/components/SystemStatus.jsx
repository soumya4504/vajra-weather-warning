import { useEffect, useState } from "react";


function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:8001/api/system-status"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch system status");
      }

      const result = await response.json();

      setStatus(result);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSystemStatus();

    const interval = setInterval(
      fetchSystemStatus,
      30000
    );

    return () => clearInterval(interval);
  }, []);


  if (loading) {
    return (
      <section className="system-status-section">
        Loading system status...
      </section>
    );
  }


  if (error) {
    return (
      <section className="system-status-section">
        <h2>⚙️ System Status</h2>

        <p>
          Unable to connect to system status.
        </p>

        <button onClick={fetchSystemStatus}>
          Try Again
        </button>
      </section>
    );
  }


  return (
    <section className="system-status-section">

      <div className="system-status-header">

        <div>
          <h2>⚙️ AI System Status</h2>

          <p>
            {status.system}
          </p>
        </div>


        <div className="system-operational">
          🟢 {status.status}
        </div>

      </div>


      <div className="system-components">

        {Object.entries(
          status.components || {}
        ).map(([name, value]) => (

          <div
            className="system-component-card"
            key={name}
          >

            <span className="component-status">
              🟢
            </span>


            <div>

              <strong>
                {name
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </strong>


              <p>
                {value}
              </p>

            </div>

          </div>

        ))}

      </div>


      <p className="auto-refresh">
        🔄 System status automatically refreshes every 30 seconds
      </p>

    </section>
  );
}


export default SystemStatus;