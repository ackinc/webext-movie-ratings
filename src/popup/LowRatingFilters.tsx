// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  getLowRatedProgramFilterSettingsState,
  setLowRatedProgramFilterSettingsState,
} from "../common";
import type { LowRatedProgramFilterSettings } from "../common";

function LowRatingFilters() {
  const [settings, setSettings] = useState({ minRating: 10, transparency: 0 });

  useEffect(() => {
    (async () => {
      const savedSettings = await getLowRatedProgramFilterSettingsState();
      if (savedSettings) setSettings(savedSettings);
    })();
  }, []);

  return (
    <div
      className="low-rated-program-filtering-controls"
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h3>Filter low-rated programs</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label for="min-imdb-rating">Min. IMDB rating:</label>
        <input
          type="range"
          id="min-imdb-rating"
          name="min-imdb-rating"
          min="0"
          max="10"
          value={settings.minRating}
          step="1"
          onChange={(e) =>
            updateSettings({
              minRating: parseInt((e.target as HTMLInputElement).value),
            })
          }
        />
        <p>{settings.minRating}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label for="low-rated-program-node-transparency">
          Make low-rated programs this transparent
        </label>
        <input
          type="range"
          id="low-rated-program-node-transparency"
          name="low-rated-program-node-transparency"
          min="0"
          max="100"
          value={settings.transparency}
          step="10"
          onChange={(e) =>
            updateSettings({
              transparency: parseInt((e.target as HTMLInputElement).value),
            })
          }
        />
      </div>
    </div>
  );

  async function updateSettings(data: Partial<LowRatedProgramFilterSettings>) {
    const updatedSettings = { ...settings, ...data };
    await setLowRatedProgramFilterSettingsState(updatedSettings);
    setSettings(updatedSettings);
  }
}

export default LowRatingFilters;
