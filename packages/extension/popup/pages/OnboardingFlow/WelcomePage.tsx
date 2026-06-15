import { supportedSites, type Sitename } from "@common";
import SiteChooserFormControl from "@popup/components/SiteChooserFormControl";
import SettingsIcon from "@common/components/Icons/Settings";

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
            site={site}
            checked={selectedSites.includes(site)}
            onToggle={() => toggleSite(site)}
          />
        ))}
      </div>

      <p style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <span>You can change your choices later from </span>
        <span>
          <SettingsIcon className="inline-icon" />
          <b>Settings</b>
        </span>
      </p>
    </div>
  );
}
