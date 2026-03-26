import ErrorReportingOptIn from "./ErrorReportingOptIn";
import SiteChooserForm from "./SiteChooserForm";
import Separator from "./Separator";
import "./SettingsPage.css";

export default function SettingsPage() {
  return (
    <div className="settings">
      <SiteChooserForm />
      <Separator />
      <ErrorReportingOptIn allowShowDetails />
    </div>
  );
}
