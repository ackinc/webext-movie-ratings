import { addMinutes, endOfMinute } from "date-fns";
import Chart from "react-apexcharts";
import { percentile } from "../common";

interface Props {
  data: { timestamp: number; value: number[] }[];
}

export default function RatingsApiResponseTimesChart({ data }: Props) {
  const periodInMs = 60 * 1000;

  const dataToRender = data
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce(
      (acc, { timestamp, value }) => {
        const periodTimestamp = Math.ceil(timestamp / periodInMs) * periodInMs;
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

  const options = {
    chart: { id: "api-response-times" },
    xaxis: { categories: getTimestampsForLastNMinutes(30) },
  };

  const series = (["p50", "p95", "p99"] as const).map((name) => ({
    name,
    data: options.xaxis.categories.map(
      (ts) => dataToRender.find((d) => d.timestamp === ts)?.[name],
    ),
  }));

  return (
    <div className="ratings-api-response-times">
      <Chart type="line" width="600" options={options} series={series} />
    </div>
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
    .map((x) => +x + 1);
}
