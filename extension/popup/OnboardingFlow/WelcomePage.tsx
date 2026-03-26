import { supportedSites, type Sitename } from "../common";
import SiteChooserFormControl from "../SiteChooserFormControl";
import SettingsIcon from "../../../images/settings.svg";

interface WelcomePageProps {
  selectedSites: Sitename[];
  toggleSite: (site: Sitename) => void;
}

export default function WelcomePage({
  selectedSites,
  toggleSite,
}: WelcomePageProps) {
  return (
    <div className="page welcome-page">
      <p>Thank you for choosing Sift!</p>

      <p>You can now select exactly which OTT websites Sift operates on.</p>

      <div>
        <h4 style={{ marginBottom: "4px" }}>
          Choose the ones you want to see ratings on below:
        </h4>
        {(Object.keys(supportedSites) as Sitename[]).map((site) => (
          <SiteChooserFormControl
            key={site}
            site={site}
            checked={selectedSites.includes(site)}
            helperText={supportedSites[site].helperText}
            onToggle={() => toggleSite(site)}
          />
        ))}
      </div>

      <p style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <span>You can change your choices later from </span>
        <span>
          <img src={SettingsIcon} className="inline-icon" />
          <b>Settings</b>
        </span>
      </p>
    </div>
  );
}
