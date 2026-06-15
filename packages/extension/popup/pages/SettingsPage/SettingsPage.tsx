import { useContext } from "preact/hooks";
import SetCurPageContext from "@popup/contexts/SetCurPageContext";
import ErrorReportingOptIn from "@popup/components/ErrorReportingOptIn/ErrorReportingOptIn";
import SiteChooserForm from "@popup/components/SiteChooserForm/SiteChooserForm";
import Separator from "@popup/components/Separator";
import ToggleMediaRequestBlocking from "@popup/components/ToggleMediaRequestBlocking";
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
      {APP_ENV === "development" ? <ToggleMediaRequestBlocking /> : null}
    </div>
  );
}
