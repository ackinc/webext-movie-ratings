import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting, type BoolExtensionSettings } from "@common";
import CheckboxInput from "@common/components/Inputs/CheckboxInput/CheckboxInput";

interface SettingToggleProps {
  name: keyof BoolExtensionSettings;
  label: string;
  onChange?: ((newVal: boolean) => void | Promise<void>) | undefined;
}

export default function SettingToggle({
  name,
  label,
  onChange = undefined,
}: SettingToggleProps) {
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
    const newVal = !enabled;
    if (onChange) await onChange(newVal);
    await setSetting(name, newVal);
    setEnabled(newVal);
  }
}
