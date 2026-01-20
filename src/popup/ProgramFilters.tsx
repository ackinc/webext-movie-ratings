import { useEffect, useState } from "preact/hooks";
import {
  getSetting,
  setSetting,
  MessageType,
  SettingsKey,
  defaultProgramFilterSettings,
  sendMessageToAllTabs,
} from "../common";
import type { ProgramFilterSettings } from "../common";
import Slider from "./Slider";

import "./ProgramFilters.css";

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
    <div className="program-filters-container">
      <h3>Filter programs</h3>

      <div className="imdb-rating-filter-setting filter-setting-container">
        <label>
          Watch shows rated{" "}
          <span style={{ fontWeight: "bold" }}>
            {settings.minRating.toFixed(1)}
          </span>{" "}
          to{" "}
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

      <div className="fopn-transparency-setting filter-setting-container">
        {settings.transparency > 100 ? (
          <label>Hide other shows completely</label>
        ) : (
          <label>
            Make other shows{" "}
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

    // let relevant tabs know that the filter settings have changed
    // bundling the updated settings into the message saves the content
    //   scripts a lookup from storage
    await sendMessageToAllTabs({
      messageType: MessageType.filterSettingsChange,
      data: updatedSettings,
    });
  }
}

export default ProgramFilters;
