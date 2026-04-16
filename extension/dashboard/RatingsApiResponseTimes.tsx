import { format } from "date-fns";
import { useEffect, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import { percentile } from "../common";
import {
  chooseAppropriateTimeIntervalUnit,
  getFormatStringForTimeIntervalUnit,
  mergeTimeSeriesData,
  splitTimePeriod,
} from "./common";
import type { TimePeriod } from "./types";

interface Props {
  data: { timestamp: number; value: number[] }[];
  period: TimePeriod;
}

export default function RatingsApiResponseTimesChart({
  data,
  period,
  ...restProps
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalSize = chooseAppropriateTimeIntervalUnit(period);
    const timeAxis = splitTimePeriod(period, intervalSize);

    const mergedData = mergeTimeSeriesData(data, intervalSize, (a, b) =>
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

    const options: ApexCharts.ApexOptions = {
      chart: {
        id: "ratings-api-response-times",
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
      yaxis: { title: { text: "ms" }, decimalsInFloat: 0 },
    };

    const series = (["p50", "p95", "p99"] as const).map((name) => ({
      name,
      data: timeAxis.map(
        (date) => mergedData.find((d) => d.timestamp === +date)?.[name] ?? 0,
      ),
    }));

    const chart = new ApexCharts(chartContainerRef.current!, {
      ...options,
      series,
    });
    chart.render();

    return () => chart.destroy();
  }, [data, period]);

  return (
    <div className="container" {...restProps}>
      <div className="chart-header">
        <h1>Rating requests & API calls</h1>
      </div>
      <div
        ref={chartContainerRef}
        className="ratings-api-response-times"
        {...restProps}
      />
    </div>
  );
}
