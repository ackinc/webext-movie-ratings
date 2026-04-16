import {
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  endOfMinute,
  endOfHour,
  endOfDay,
  endOfWeek,
} from "date-fns";
import {
  ONE_MINUTE_IN_MS,
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  ONE_WEEK_IN_MS,
} from "../common/constants";
import type { TimePeriod, TimeIntervalUnit } from "./types";

export function getFormatStringForTimeIntervalUnit(unit: TimeIntervalUnit) {
  switch (unit) {
    case "minute":
      return "HH:mm";
    case "hour":
      return "dd MMM HH:mm";
    case "day":
      return "yyyy-MM-dd";
    case "week":
      return "yyyy-MM-dd";
    default:
      throw new Error(`Invalid TimeIntervalUnit: ${unit}`);
  }
}

export function splitTimePeriod(
  period: TimePeriod,
  unit: TimeIntervalUnit,
): Date[] {
  const { from, to } = period;
  if (from > to)
    throw new Error(
      `Invalid TimePeriod: [${from.toISOString()}, ${to.toISOString()}]`,
    );

  let addFn: (d: Date, n: number) => Date;
  let endFn: (d: Date) => Date;
  switch (unit) {
    case "minute":
      addFn = addMinutes;
      endFn = endOfMinute;
      break;
    case "hour":
      addFn = addHours;
      endFn = endOfHour;
      break;
    case "day":
      addFn = addDays;
      endFn = endOfDay;
      break;
    case "week":
      addFn = addWeeks;
      endFn = endOfWeek;
      break;
    default:
      throw new Error(`Invalid TimeIntervalUnit: ${unit}`);
  }

  let cur = from;
  const labels: Date[] = [];
  while (cur <= to) {
    labels.push(endFn(cur));
    cur = addFn(cur, 1);
  }

  return labels;
}

export function getTimestampsForLastNMinutes(
  n: number,
  from = endOfMinute(new Date()),
): number[] {
  return new Array(n)
    .fill(0)
    .map((_x, idx) => addMinutes(from, -idx))
    .reverse()
    .map((x) => +x);
}

export function mergeTimeSeriesData<T>(
  data: { timestamp: number; value: T }[],
  periodSize: TimeIntervalUnit | number,
  mergeFn: (prev: T, cur: T) => T,
): { timestamp: number; value: T }[] {
  const periodSizeInMs =
    typeof periodSize === "number"
      ? periodSize
      : getMsInTimeIntervalUnit(periodSize);

  return data
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce(
      (acc, { timestamp, value }) => {
        const periodTimestamp =
          Math.ceil(timestamp / periodSizeInMs) * periodSizeInMs;
        const last = acc.at(-1);
        if (last && last.timestamp === periodTimestamp) {
          last.value = mergeFn(last.value, value);
        } else {
          acc.push({ timestamp: periodTimestamp, value });
        }

        return acc;
      },
      [] as { timestamp: number; value: T }[],
    );
}

export function chooseAppropriateTimeIntervalUnit(
  period: TimePeriod,
): TimeIntervalUnit {
  const maxIntervals = 200;
  const periodSizeInMs = +period.to - +period.from;
  const candidates = (
    ["minute", "hour", "day", "week"] as TimeIntervalUnit[]
  ).map((u) => [u, getMsInTimeIntervalUnit(u)]) as [TimeIntervalUnit, number][];

  for (let i = 0; i < candidates.length; i++) {
    const nIntervals = periodSizeInMs / candidates[i]![1];
    if (nIntervals < maxIntervals) return candidates[i]![0];
  }

  return "week";
}

export function getMsInTimeIntervalUnit(unit: TimeIntervalUnit): number {
  switch (unit) {
    case "minute":
      return ONE_MINUTE_IN_MS;
    case "hour":
      return ONE_HOUR_IN_MS;
    case "day":
      return ONE_DAY_IN_MS;
    case "week":
      return ONE_WEEK_IN_MS;
    default:
      throw new Error(`Invalid TimeIntervalUnit: ${unit}`);
  }
}
