import {
  addMinutes,
  startOfToday,
  endOfMinute,
  endOfToday,
  format,
} from "date-fns";
import { useEffect, useState, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import {
  ONE_MINUTE_IN_MS,
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  ONE_WEEK_IN_MS,
  mergeTimeSeriesData,
} from "../common";
import type { DashboardData } from "./types";

type Props = {
  data: Pick<DashboardData, "nProgramRatingRequests" | "nRatingsApiRequests">;
};

type TimePeriodSize = "minute" | "hour" | "day" | "week";

export default function RatingRequestsAndApiCallsChart({
  data,
  ...restProps
}: Props) {
  const [period, setPeriod] = useState({
    from: startOfToday(),
    to: endOfToday(),
  });
  const [periodSize, setPeriodSize] = useState<TimePeriodSize>("minute");
  const periodSizeInMs =
    periodSize === "minute"
      ? ONE_MINUTE_IN_MS
      : periodSize === "hour"
        ? ONE_HOUR_IN_MS
        : periodSize === "day"
          ? ONE_DAY_IN_MS
          : ONE_WEEK_IN_MS;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nProgramRatingRequests = mergeTimeSeriesData(
      data.nProgramRatingRequests,
      periodSizeInMs,
      (x, y) => x + y,
    );
    const nRatingsApiRequests = mergeTimeSeriesData(
      data.nRatingsApiRequests,
      periodSizeInMs,
      (x, y) => x + y,
    );

    const prev30Mins = getTimestampsForLastNMinutes(
      30,
      nProgramRatingRequests.length > 0 && nRatingsApiRequests.length > 0
        ? new Date(
            Math.max(
              nProgramRatingRequests.at(-1)!.timestamp,
              nRatingsApiRequests.at(-1)!.timestamp,
            ),
          )
        : nProgramRatingRequests.length > 0
          ? new Date(nProgramRatingRequests.at(-1)!.timestamp)
          : nRatingsApiRequests.length > 0
            ? new Date(nRatingsApiRequests.at(-1)!.timestamp)
            : undefined,
    );
    const options = {
      title: { text: "# rating requests, # API calls" },
      chart: {
        id: "rating-requests-and-api-calls",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      legend: { show: false },
      xaxis: {
        type: "category" as const,
        categories: prev30Mins,
        overwriteCategories: prev30Mins.map((ts) =>
          format(new Date(ts), "HH:mm"),
        ),
      },
      yaxis: {
        decimalsInFloat: 0,
      },
      series: [
        {
          name: "nProgramRatingRequests",
          data: prev30Mins.map(
            (ts) =>
              nProgramRatingRequests.find((d) => d.timestamp === ts)?.value ??
              0,
          ),
        },
        {
          name: "nRatingsApiRequests",
          data: prev30Mins.map(
            (ts) =>
              nRatingsApiRequests.find((d) => d.timestamp === ts)?.value ?? 0,
          ),
        },
      ],
    };

    const chart = new ApexCharts(chartContainerRef.current!, options);
    chart.render();
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className="rating-requests-and-api-calls"
      {...restProps}
    />
  );
}

function getTimestampsForLastNMinutes(
  n: number,
  from = endOfMinute(new Date()),
): number[] {
  return new Array(n)
    .fill(0)
    .map((_x, idx) => addMinutes(from, -idx))
    .reverse()
    .map((x) => +x);
}
