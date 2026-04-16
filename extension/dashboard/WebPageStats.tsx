import { format } from "date-fns";
import { useEffect, useState, useRef } from "preact/hooks";
import ApexCharts from "apexcharts";
import type { DashboardData } from "./types";

interface Props {
  data: DashboardData["webpageRatingStats"];
}

type Metric = "nPrograms" | "failCount" | "failRate";

export default function WebpageStatsChart({ data, ...restProps }: Props) {
  const [metric, setMetric] = useState<Metric>("failRate");

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dataToRender = data
      .map(({ value, metadata }) => {
        const { nPrograms, nProgramsRatedNF, nProgramsWithNoRatingNode } =
          value;
        const failCount = nProgramsRatedNF + nProgramsWithNoRatingNode;
        const failRate = (failCount / nPrograms) * 100;

        const { pageUrl, statsCollectionTime } = metadata;

        const label = `${pageUrl.replace(/^https:\/\/www\./, "")}__${format(new Date(statsCollectionTime), "yyyyMMddHHmmss")}`;

        return { label, nPrograms, failCount, failRate };
      })
      .filter((d) => d.nPrograms > 0)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 15);

    const options: ApexCharts.ApexOptions = {
      chart: {
        id: "webpage-stats",
        toolbar: { show: false },
        type: "bar",
        zoom: { enabled: false },
      } as const,
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
          },
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: -10,
        textAnchor: "end",
        formatter: function (
          val: number,
          { dataPointIndex }: ApexCharts.ApexFormatterOpts,
        ) {
          if (metric === "failRate") {
            return `${Math.round(val)}%`;
          } else if (metric === "failCount") {
            const data = dataToRender[dataPointIndex]!;
            return `${val} (${Math.round(data.failRate)}% of ${data.nPrograms})`;
          } else {
            return val;
          }
        },
      },
      series: [
        {
          name: metric,
          data: dataToRender.map((d) => ({ x: d.label, y: d[metric] })),
        },
      ],
    };

    const chart = new ApexCharts(chartContainerRef.current!, options);
    chart.render();

    return () => chart.destroy();
  }, [data, metric]);

  return (
    <div className="container" {...restProps}>
      <div className="chart-header">
        <h1>WebPageStats:</h1>
        <select
          name="webpagestats-metric"
          value={metric}
          style={{ padding: "4px" }}
          onChange={(e) => {
            setMetric((e.target as HTMLSelectElement).value as Metric);
          }}
        >
          {["nPrograms", "failCount", "failRate"].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      <div ref={chartContainerRef} className="missing-ratings" />
    </div>
  );
}
