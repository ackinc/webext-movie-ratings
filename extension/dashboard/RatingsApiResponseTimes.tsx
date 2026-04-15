import { addMinutes, endOfMinute, format } from "date-fns";
import { useEffect, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import { percentile } from "../common";

interface Props {
  data: { timestamp: number; value: number[] }[];
}

export default function RatingsApiResponseTimesChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const periodInMs = 60 * 1000;

  useEffect(() => {
    const dataToRender = data
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce(
        (acc, { timestamp, value }) => {
          const periodTimestamp =
            Math.ceil(timestamp / periodInMs) * periodInMs;
          const last = acc.at(-1);

          if (!last) {
            acc.push({ timestamp, value });
          } else if (last.timestamp === periodTimestamp) {
            last.value.push(...value);
          } else {
            acc.push({ timestamp: periodTimestamp, value });
          }

          return acc;
        },
        [] as typeof data,
      )
      .map((obs) => {
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
      dataToRender.length > 0
        ? new Date(dataToRender.at(-1)!.timestamp)
        : undefined,
    );

    const options = {
      chart: { id: "api-response-times" },
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
        (ts) => dataToRender.find((d) => d.timestamp === ts)?.[name] ?? 0,
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
      style={{ width: "600px", height: "480px" }}
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
