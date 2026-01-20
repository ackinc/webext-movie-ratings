import { useEffect, useState } from "preact/hooks";
import {
  browser,
  getSetting,
  setSetting,
  MessageType,
  SettingsKey,
  defaultProgramFilterSettings,
} from "../common";
import type { ProgramFilterSettings } from "../common";
import Slider from "./Slider";

function ProgramFilters() {
  const [settings, setSettings] = useState(defaultProgramFilterSettings);
  const [savedSettingsLoaded, setSavedSettingsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const savedSettings = (await getSetting(
        SettingsKey.programFiltersSettings,
      )) as ProgramFilterSettings | undefined;
      if (savedSettings) {
        // merging instead of replacing in case a new property has been
        //   introduced that hasn't yet been persisted to storage
        setSettings((s) => ({ ...s, ...savedSettings }));
      }
      setSavedSettingsLoaded(true);
    })();
  }, []);

  if (!savedSettingsLoaded) return null;

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

      <div
        className="imdb-rating-filter-setting"
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
      >
        <label>
          I want programs rated between{" "}
          <span style={{ fontWeight: "bold" }}>
            {settings.minRating.toFixed(1)}
          </span>{" "}
          and{" "}
          <span style={{ fontWeight: "bold" }}>
            {settings.maxRating.toFixed(1)}
          </span>
        </label>
        <Slider
          className="imdb-rating-filter-slider"
          range={{ min: [0, 0.1], "20%": [4, 0.1], max: [10] }}
          start={[settings.minRating, settings.maxRating]}
          onInput={([min, max]) =>
            updateSettings({ minRating: min!, maxRating: max! })
          }
        />
      </div>

      <div
        className="fopn-transparency-setting"
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
      >
        {settings.transparency > 100 ? (
          <label>Hide other programs completely</label>
        ) : (
          <label>
            Make other programs{" "}
            <span style={{ fontWeight: "bold" }}>{settings.transparency}%</span>{" "}
            transparent
          </label>
        )}
        <Slider
          className="fopn-transparency-slider"
          range={{ min: [0, 1], max: [100] }}
          start={[settings.transparency]}
          onInput={([t]) => updateSettings({ transparency: t! })}
        />
      </div>
    </div>
  );

  async function updateSettings(data: Partial<ProgramFilterSettings>) {
    if (
      Object.entries(data).every(
        ([k, v]) => v === settings[k as keyof ProgramFilterSettings],
      )
    ) {
      return;
    }

    const updatedSettings = { ...settings, ...data };
    setSettings(updatedSettings);

    // persist the change in storage
    await setSetting(SettingsKey.programFiltersSettings, updatedSettings);

    // let any relevant tabs know that the filter settings have changed
    // bundling the updated settings into the message saves the content
    //   scripts a lookup from storage
    (
      await browser.tabs.query({
        url: browser.runtime.getManifest()["host_permissions"],
      })
    ).forEach((tab) =>
      browser.tabs.sendMessage(tab.id as number, {
        messageType: MessageType.filterSettingsChange,
        data: updatedSettings,
      }),
    );
  }
}

export default ProgramFilters;
