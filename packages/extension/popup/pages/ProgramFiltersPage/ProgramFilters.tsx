import { useEffect, useState } from "preact/hooks";
import {
  getSetting,
  setSetting,
  MessageType,
  defaultProgramFilterSettings,
  sendMessageToAllTabs,
} from "@common";
import type { ProgramFilterSettings } from "@common";
import Slider from "@popup/components/Slider";
import CheckboxInput from "@common/components/Inputs/CheckboxInput/CheckboxInput";

import "./ProgramFilters.css";

function ProgramFilters() {
  const [settings, setSettings] = useState(defaultProgramFilterSettings);
  const [savedSettingsLoaded, setSavedSettingsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const savedSettings = await getSetting("programFiltersSettings");
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
      <div className="info">
        <p>
          Use these controls to hide low-rated programs while browsing your
          favorite OTT websites
        </p>
      </div>

      <div className="imdb-rating-filter-setting filter-setting-container">
        <label>
          Include shows rated{" "}
          <span className="bolded">{settings.minRating.toFixed(1)}</span> to{" "}
          <span className="bolded">{settings.maxRating.toFixed(1)}</span>
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

      <CheckboxInput
        className="unrated-show-setting"
        name="exclude-unrated-programs"
        label="Exclude unrated shows"
        checked={settings.excludeUnratedPrograms}
        onChange={() =>
          updateSettings({
            excludeUnratedPrograms: !settings.excludeUnratedPrograms,
          })
        }
      />

      <div className="fopn-transparency-setting filter-setting-container">
        {settings.transparency > 100 ? (
          <label>Hide excluded shows completely</label>
        ) : (
          <label>
            Make excluded shows{" "}
            <span className="bolded">{settings.transparency}%</span> transparent
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
    await setSetting("programFiltersSettings", updatedSettings);

    // let relevant tabs know that the filter settings have changed
    // bundling the updated settings into the message saves the content
    //   scripts a lookup from storage
    await sendMessageToAllTabs({
      type: MessageType.filterSettingsChange,
      data: updatedSettings,
    });
  }
}

export default ProgramFilters;
