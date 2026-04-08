import { useEffect, useState } from "preact/hooks";
import TelemetryStore from "../common/TelemetryStore";
import type { ErrorDetails, WebpageStats } from "../common/types";

interface DashboardProps {
  telemetryStore: TelemetryStore;
}

interface Stats {
  nProgramRatingRequests: { timestamp: number; value: number }[];
  nRatingsApiRequests: { timestamp: number; value: number }[];
  ratingsApiResponseTimes: { timestamp: number; value: number[] }[];
  webpageRatingStats: { timestamp: number; value: WebpageStats }[];
  errors: { timestamp: number; value: ErrorDetails[] }[];
}

export default function Dashboard({ telemetryStore }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);

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
        telemetryStore.getRecords<number>("PROGRAM_RATING_REQUEST_RECEIVED"),
        telemetryStore.getRecords<number>("RATINGS_API_REQUEST_MADE"),
        telemetryStore.getRecords<number[]>("RATINGS_API_RESPONSE_RECEIVED"),
        telemetryStore.getRecords<WebpageStats>(
          "WEBPAGE_RATING_STATS_RECEIVED",
        ),
        telemetryStore.getRecords<ErrorDetails[]>("ERROR"),
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
    </div>
  );
}
