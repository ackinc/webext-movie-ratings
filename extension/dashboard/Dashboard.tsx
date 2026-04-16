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
        >("PROGRAM_RATING_REQUEST_RECEIVED", period.from, period.to),
        telemetryStore.getRecords<number, unknown>(
          "RATINGS_API_REQUEST_MADE",
          period.from,
          period.to,
        ),
        telemetryStore.getRecords<number[], unknown>(
          "RATINGS_API_RESPONSE_RECEIVED",
          period.from,
          period.to,
        ),
        telemetryStore.getRecords<
          WebpageStats,
          DashboardData["webpageRatingStats"][number]["metadata"]
        >("WEBPAGE_RATING_STATS_RECEIVED", period.from, period.to),
        telemetryStore.getRecords<ErrorDetails[], unknown>(
          "ERROR",
          period.from,
          period.to,
        ),
      ]);
      setStats({
        nProgramRatingRequests,
        nRatingsApiRequests,
        ratingsApiResponseTimes,
        webpageRatingStats,
        errors,
      });
    })();
  }, [period]);

  if (!stats) return null;

  return (
    <div className="dashboard">
      <header>
        <h1>Sift - dashboard</h1>
        <TimePeriodControls period={period} setPeriod={setPeriod} />
      </header>

      <div className="charts-container">
        <RatingRequestsAndApiCallsChart data={stats} period={period} />
        <RatingsApiResponseTimesChart
          data={stats.ratingsApiResponseTimes}
          period={period}
        />
        <WebPageStatsChart data={stats.webpageRatingStats} />
      </div>
    </div>
  );
}
