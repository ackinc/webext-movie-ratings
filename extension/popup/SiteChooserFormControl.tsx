import { supportedSites, type Sitename } from "./common";
import loadingIndicator from "../../images/loading.svg";

interface SiteChooserFormControlProps {
  site: Sitename;
  enabled: boolean;
  loading?: boolean;
  readOnly?: boolean;
  onToggle: (site: Sitename) => void;
}

export default function SiteChooserFormControl({
  site,
  enabled,
  loading = false,
  readOnly = false,
  onToggle,
}: SiteChooserFormControlProps) {
  const label = `sitePermFor${supportedSites[site].displayName.replace(/\s/g, "")}`;

  return (
    <div className="form-control">
      <input
        type="checkbox"
        id={label}
        name={label}
        readOnly={readOnly}
        checked={enabled}
        onChange={() => onToggle(site)}
        style={{ accentColor: loading ? "transparent" : "initial" }}
      />
      <label for={label}>
        {supportedSites[site].displayName}
        {loading ? <img src={loadingIndicator} /> : null}
      </label>
    </div>
  );
}
