import "dotenv/config";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { pick } from "siftutils";

const { OTEL_COLLECTOR_BASE_URL, OTEL_METRIC_EXPORT_INTERVAL } = pick(
  process.env,
  ["OTEL_COLLECTOR_BASE_URL", "OTEL_METRIC_EXPORT_INTERVAL"],
  true,
);

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: `${OTEL_COLLECTOR_BASE_URL}/v1/traces`,
  }),
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${OTEL_COLLECTOR_BASE_URL}/v1/metrics`,
      }),
      exportIntervalMillis: +OTEL_METRIC_EXPORT_INTERVAL!,
    }),
  ],
  instrumentations: [
    getNodeAutoInstrumentations(),
    new FastifyOtelInstrumentation({ registerOnInitialization: true }),
  ],
});

sdk.start();
