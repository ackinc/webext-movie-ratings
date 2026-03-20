import { type Dispatch, type StateUpdater } from "preact/hooks";
import { supportedSites, type Sitename } from "../common";
import SiteChooserFormControl from "../SiteChooserFormControl";

interface WelcomePageProps {
  selectedSites: Sitename[];
  setSelectedSites: Dispatch<StateUpdater<Sitename[]>>;
}

export default function WelcomePage({
  selectedSites,
  setSelectedSites,
}: WelcomePageProps) {
  return (
    <div className="page welcome-page">
      <p>Thank you for choosing Sift!</p>

      <p>This extension can add ratings to a number of OTT websites.</p>

      <div>
        <h4 style={{ marginBottom: "8px" }}>
          Choose the ones you want to see ratings on below:
        </h4>
        {(Object.keys(supportedSites) as Sitename[]).map((site) => (
          <SiteChooserFormControl
            site={site}
            enabled={selectedSites.includes(site)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <p>
        You can change your choices later from <b>Settings</b>
      </p>
    </div>
  );

  function handleToggle(site: Sitename) {
    setSelectedSites((ss) =>
      ss.includes(site) ? ss.filter((s) => s !== site) : ss.concat(site),
    );
  }
}
