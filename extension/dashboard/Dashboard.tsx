import { useEffect, useState } from "preact/hooks";
import TelemetryStore from "../common/TelemetryStore";

interface DashboardProps {
  telemetryStore: TelemetryStore;
}

export default function Dashboard({ telemetryStore }: DashboardProps) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    // pull data out of the telemetry store
  }, []);

  return <div class="dashboard"></div>;
}
