import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting, type ExtensionSettings } from "@common";
import CheckboxInput from "@common/components/Inputs/CheckboxInput/CheckboxInput";

interface SettingToggleProps {
  name: keyof ExtensionSettings;
  label: string;
}

export default function SettingToggle({ name, label }: SettingToggleProps) {
  const [enabled, setEnabled] = useState(false);

  // load initial state
  useEffect(() => {
    (async () => {
      const isEnabled = Boolean(await getSetting(name));
      setEnabled(isEnabled);
    })();
  }, []);

  return (
    <CheckboxInput
      name={`enable-${name}`}
      label={label}
      checked={enabled}
      onChange={handleChange}
      className={`setting-toggle setting-${name}`}
    />
  );

  async function handleChange() {
    await setSetting(name, !enabled);
    setEnabled(!enabled);
  }
}
