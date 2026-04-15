import { useEffect, useState } from "preact/hooks";
import { addHours } from "date-fns";
import TelemetryStore from "../common/TelemetryStore";
import type { DashboardData, TimePeriod } from "./types";
import type { ErrorDetails, WebpageStats } from "../common/types";
import TimePeriodControls from "./TimePeriodControls";
import RatingsApiResponseTimesChart from "./RatingsApiResponseTimes";
import WebPageStatsChart from "./WebPageStats";
import RatingRequestsAndApiCallsChart from "./RatingRequestsAndApiCalls";

interface DashboardProps {
  telemetryStore: TelemetryStore;
}

export default function Dashboard({ telemetryStore }: DashboardProps) {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<TimePeriod>({
    from: addHours(new Date(), -1),
    to: new Date(),
  });

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
    <div className="dashboard">
      <header>
        <h1>Sift - dashboard</h1>
        <TimePeriodControls period={period} setPeriod={setPeriod} />
      </header>

      <div className="charts-container">
        <RatingRequestsAndApiCallsChart
          data={stats}
          style={{ width: "640px" }}
        />
        <RatingsApiResponseTimesChart
          data={stats.ratingsApiResponseTimes}
          style={{ width: "640px" }}
        />
        <WebPageStatsChart
          data={stats.webpageRatingStats}
          style={{ width: "640px" }}
        />
      </div>
    </div>
  );
}
