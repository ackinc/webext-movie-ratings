import { supportedSites, type Sitename } from "./common";
import loadingIndicator from "../../images/loading.svg";

interface SiteChooserFormControlProps {
  site: Sitename;
  checked: boolean;
  loading?: boolean;
  disabled?: boolean;
  helperText?: string;
  onToggle: (site: Sitename) => void;
}

export default function SiteChooserFormControl({
  site,
  checked,
  loading = false,
  disabled = false,
  helperText,
  onToggle,
}: SiteChooserFormControlProps) {
  const label = `sitePermFor${supportedSites[site].displayName.replace(/\s/g, "")}`;

  return (
    <div className="form-control">
      <input
        type="checkbox"
        id={label}
        name={label}
        disabled={disabled}
        checked={checked}
        onChange={() => onToggle(site)}
        style={{ accentColor: loading ? "transparent" : "initial" }}
      />
      <label for={label}>
        {supportedSites[site].displayName}
        {loading ? <img src={loadingIndicator} /> : null}
      </label>

      {helperText && checked ? <p>{helperText}</p> : null}
    </div>
  );
}
