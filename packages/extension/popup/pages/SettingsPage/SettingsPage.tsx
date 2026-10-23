import { useContext } from "preact/hooks";
import SetCurPageContext from "@popup/contexts/SetCurPageContext";
import ErrorReportingOptIn from "@popup/components/ErrorReportingOptIn/ErrorReportingOptIn";
import SiteChooserForm from "@popup/components/SiteChooserForm/SiteChooserForm";
import Separator from "@popup/components/Separator";
import SettingToggle from "@popup/components/SettingToggle";
import {
  boolSettings,
  type BoolSettingName,
  type BoolSettingConf,
} from "@common";
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

      {APP_ENV === "development" ? (
        <>
          <Separator />
          {(
            Object.entries(boolSettings) as [BoolSettingName, BoolSettingConf][]
          )
            .filter(([_name, conf]) => conf.for === "dev")
            .map(([name, conf]) => (
              <SettingToggle
                key={name}
                name={name}
                label={conf.label}
                onChange={
                  "onChange" in conf
                    ? (conf.onChange as (
                        value: boolean,
                      ) => void | Promise<void>)
                    : undefined
                }
              />
            ))}
        </>
      ) : null}
    </div>
  );
}
