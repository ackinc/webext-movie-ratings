import { format } from "date-fns";
import { useEffect, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import {
  chooseAppropriateTimeIntervalUnit,
  getFormatStringForTimeIntervalUnit,
  splitTimePeriod,
  mergeTimeSeriesData,
} from "./common";
import type { DashboardData, TimePeriod } from "./types";

type Props = {
  data: Pick<DashboardData, "nProgramRatingRequests" | "nRatingsApiRequests">;
  period: TimePeriod;
};

export default function RatingRequestsAndApiCallsChart({
  data,
  period,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalSize = chooseAppropriateTimeIntervalUnit(period);
    const timeAxis = splitTimePeriod(period, intervalSize);

    const nProgramRatingRequests = mergeTimeSeriesData(
      data.nProgramRatingRequests,
      intervalSize,
      (x, y) => x + y,
    );
    const nRatingsApiRequests = mergeTimeSeriesData(
      data.nRatingsApiRequests,
      intervalSize,
      (x, y) => x + y,
    );

    const options: ApexCharts.ApexOptions = {
      chart: {
        id: "rating-requests-and-api-calls",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      legend: { show: false },
      tooltip: { x: { show: false } },
      xaxis: {
        tooltip: { enabled: false },
        type: "category" as const,
        categories: timeAxis,
        overwriteCategories: timeAxis.map((date: Date) =>
          format(date, getFormatStringForTimeIntervalUnit(intervalSize)),
        ),
      },
      yaxis: { decimalsInFloat: 0 },
      series: [
        {
          name: "nProgramRatingRequests",
          data: timeAxis.map(
            (date) =>
              nProgramRatingRequests.find((d) => d.timestamp === +date)
                ?.value ?? 0,
          ),
        },
        {
          name: "nRatingsApiRequests",
          data: timeAxis.map(
            (date) =>
              nRatingsApiRequests.find((d) => d.timestamp === +date)?.value ??
              0,
          ),
        },
      ],
    };

    const chart = new ApexCharts(chartContainerRef.current!, options);
    chart.render();

    return () => chart.destroy();
  }, [data, period]);

  return (
    <div className="container">
      <div className="chart-header">
        <h1>Rating requests & API calls</h1>
      </div>
      <div ref={chartContainerRef} className="rating-requests-and-api-calls" />
    </div>
  );
}
