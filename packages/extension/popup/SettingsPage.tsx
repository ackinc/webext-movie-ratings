import { useContext } from "preact/hooks";
import SetCurPageContext from "./Contexts/SetCurPageContext";
import ErrorReportingOptIn from "./ErrorReportingOptIn";
import SiteChooserForm from "./SiteChooserForm";
import Separator from "./Separator";
import "./SettingsPage.css";

export default function SettingsPage() {
  const setCurPage = useContext(SetCurPageContext);

  return (
    <div className="settings">
      <SiteChooserForm />
      <Separator />
      <ErrorReportingOptIn
        onClickShowDetails={() => setCurPage("pitchErrorReporting")}
      />
    </div>
  );
}
