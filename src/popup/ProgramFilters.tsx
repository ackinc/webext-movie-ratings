import { useEffect, useState } from "preact/hooks";
import { browser, getSetting, setSetting, SettingsKey } from "../common";
import type { ProgramFilterSettings } from "../common";

function ProgramFilters() {
  const [settings, setSettings] = useState({ minRating: 10, transparency: 0 });

  useEffect(() => {
    (async () => {
      const savedSettings = (await getSetting(
        SettingsKey.programFiltersSettings
      )) as ProgramFilterSettings | undefined;
      if (savedSettings) setSettings(savedSettings);
    })();
  }, []);

  return (
    <div
      className="program-filters-container"
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h3>Filter programs</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label for="min-imdb-rating">
          Fade programs rated below:{" "}
          <span style={{ fontWeight: "bold" }}>
            {settings.minRating.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          id="min-imdb-rating"
          name="min-imdb-rating"
          min="0"
          max="10"
          value={settings.minRating}
          step="0.1"
          onInput={(e) =>
            updateSettings({
              minRating: parseFloat((e.target as HTMLInputElement).value),
            })
          }
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label for="filtered-out-program-node-transparency">
          Make them this transparent:
        </label>
        <input
          type="range"
          id="filtered-out-program-node-transparency"
          name="filtered-out-program-node-transparency"
          min="0"
          max="100"
          value={settings.transparency}
          step="1"
          onInput={(e) =>
            updateSettings({
              transparency: parseInt((e.target as HTMLInputElement).value),
            })
          }
        />
      </div>
    </div>
  );

  async function updateSettings(data: Partial<ProgramFilterSettings>) {
    const updatedSettings = { ...settings, ...data };
    await setSetting(SettingsKey.programFiltersSettings, updatedSettings);
    setSettings(updatedSettings);

    // let any relevant tabs know that the filter settings have changed
    // bundling the updated settings into the message saves the content
    //   scripts a lookup from storage
    (
      await browser.tabs.query({
        url: browser.runtime.getManifest()["host_permissions"],
      })
    ).forEach((tab) =>
      browser.tabs.sendMessage(tab.id as number, {
        message: "filterSettingsChange",
        data: updatedSettings,
      })
    );
  }
}

export default ProgramFilters;
