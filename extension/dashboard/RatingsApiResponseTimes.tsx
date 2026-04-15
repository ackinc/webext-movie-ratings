import { addMinutes, endOfMinute, format } from "date-fns";
import { useEffect, useState, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import {
  ONE_MINUTE_IN_MS,
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  ONE_WEEK_IN_MS,
  mergeTimeSeriesData,
  percentile,
} from "../common";

interface Props {
  data: { timestamp: number; value: number[] }[];
}

type TimePeriodSize = "minute" | "hour" | "day" | "week";

export default function RatingsApiResponseTimesChart({
  data,
  ...restProps
}: Props) {
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
    const mergedData = mergeTimeSeriesData(data, periodSizeInMs, (a, b) =>
      a.concat(b),
    ).map((obs) => {
      obs.value = obs.value.sort((a, b) => a - b);

      return {
        timestamp: obs.timestamp,
        mean: obs.value.reduce((acc, x) => acc + x) / obs.value.length,
        p50: percentile(obs.value, 50),
        p95: percentile(obs.value, 95),
        p99: percentile(obs.value, 99),
      };
    });

    const prev30Mins = getTimestampsForLastNMinutes(
      30,
      mergedData.length > 0
        ? new Date(mergedData.at(-1)!.timestamp)
        : undefined,
    );

    const options = {
      title: { text: "Ratings API Response Times" },
      chart: {
        id: "ratings-api-response-times",
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
        title: { text: "ms" },
        decimalsInFloat: 0,
      },
    };

    const series = (["p50", "p95", "p99"] as const).map((name) => ({
      name,
      data: options.xaxis.categories.map(
        (ts) => mergedData.find((d) => d.timestamp === ts)?.[name] ?? 0,
      ),
    }));

    const chart = new ApexCharts(chartContainerRef.current!, {
      ...options,
      series,
    });
    chart.render();
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className="ratings-api-response-times"
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
