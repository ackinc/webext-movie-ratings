import { supportedSites, type Sitename } from "./common";
import loadingIndicator from "../../images/loading.svg";

interface SiteChooserFormControlProps {
  site: Sitename;
  enabled: boolean;
  loading?: boolean;
  onToggle: (site: Sitename) => void;
}

export default function SiteChooserFormControl({
  site,
  enabled,
  loading = false,
  onToggle,
}: SiteChooserFormControlProps) {
  const label = `sitePermFor${supportedSites[site].displayName.replace(/\s/g, "")}`;

  return (
    <div className="form-control">
      <input
        type="checkbox"
        id={label}
        name={label}
        checked={enabled}
        onChange={() => onToggle(site)}
      />
      <label for={label}>
        {supportedSites[site].displayName}
        {loading ? <img src={loadingIndicator} /> : null}
      </label>
    </div>
  );
}
