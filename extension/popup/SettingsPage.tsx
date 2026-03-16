import ErrorReportingOptIn from "./ErrorReportingOptIn";
import SitePermsControlForm from "./SitePermsControlForm";
import Separator from "./Separator";
import "./SettingsPage.css";

export default function SettingsPage() {
  return (
    <div className="settings">
      <SitePermsControlForm />
      <Separator />
      <ErrorReportingOptIn />
    </div>
  );
}
