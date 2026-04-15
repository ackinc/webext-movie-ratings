import { useEffect, useState } from "preact/hooks";
import TelemetryStore from "../common/TelemetryStore";
import type { DashboardData } from "./types";
import type { ErrorDetails, WebpageStats } from "../common/types";
import RatingsApiResponseTimesChart from "./RatingsApiResponseTimes";

interface DashboardProps {
  telemetryStore: TelemetryStore;
}

export default function Dashboard({ telemetryStore }: DashboardProps) {
  const [stats, setStats] = useState<DashboardData | null>(null);

  // pull data out of the telemetry store
  useEffect(() => {
    (async () => {
      const [
        nProgramRatingRequests,
        nRatingsApiRequests,
        ratingsApiResponseTimes,
        webpageRatingStats,
        errors,
      ] = await Promise.all([
        telemetryStore.getRecords<
          number,
          DashboardData["nProgramRatingRequests"][number]["metadata"]
        >("PROGRAM_RATING_REQUEST_RECEIVED"),
        telemetryStore.getRecords<number, unknown>("RATINGS_API_REQUEST_MADE"),
        telemetryStore.getRecords<number[], unknown>(
          "RATINGS_API_RESPONSE_RECEIVED",
        ),
        telemetryStore.getRecords<
          WebpageStats,
          DashboardData["webpageRatingStats"][number]["metadata"]
        >("WEBPAGE_RATING_STATS_RECEIVED"),
        telemetryStore.getRecords<ErrorDetails[], unknown>("ERROR"),
      ]);
      setStats({
        nProgramRatingRequests,
        nRatingsApiRequests,
        ratingsApiResponseTimes,
        webpageRatingStats,
        errors,
      });
    })();
  }, []);

  if (!stats) return null;

  return (
    <div class="dashboard">
      <RatingsApiResponseTimesChart data={stats.ratingsApiResponseTimes} />
    </div>
  );
}
