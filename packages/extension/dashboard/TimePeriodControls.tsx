import { format, parseISO } from "date-fns";
import type { Dispatch, StateUpdater } from "preact/hooks";
import type { TimePeriod } from "./types";
import "./TimePeriodControls.css";

interface Props {
  period: TimePeriod;
  setPeriod: Dispatch<StateUpdater<TimePeriod>>;
}

export default function TimePeriodControls({ period, setPeriod }: Props) {
  return (
    <div className="time-period-controls">
      <label>
        <span>From</span>
        <input
          type="datetime-local"
          name="period-start"
          value={format(period.from, "yyyy-MM-dd HH:mm")}
          onChange={(e) =>
            setPeriod((x) => ({
              ...x,
              from: parseISO((e.target as HTMLInputElement).value),
            }))
          }
        />
      </label>

      <label>
        <span>To</span>
        <input
          type="datetime-local"
          name="period-start"
          value={format(period.to, "yyyy-MM-dd HH:mm")}
          onChange={(e) =>
            setPeriod((x) => ({
              ...x,
              to: parseISO((e.target as HTMLInputElement).value),
            }))
          }
        />
      </label>
    </div>
  );
}
