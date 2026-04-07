import { supportedSites, type Sitename } from "./common";
import CheckboxInput from "./Inputs/CheckboxInput";

interface SiteChooserFormControlProps {
  site: Sitename;
  checked: boolean;
  loading?: boolean;
  disabled?: boolean;
  onToggle: (site: Sitename) => void;
}

export default function SiteChooserFormControl({
  site,
  checked,
  loading = false,
  disabled = false,
  onToggle,
}: SiteChooserFormControlProps) {
  return (
    <CheckboxInput
      name={site}
      label={supportedSites[site].displayName}
      checked={checked}
      disabled={disabled}
      onChange={() => onToggle(site)}
      style={{ accentColor: loading ? "transparent" : "initial" }}
    />
  );
}
