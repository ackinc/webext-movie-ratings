import ErrorReportingOptIn from "./ErrorReportingOptIn";

export default function SettingsPage() {
  return (
    <div className="settings" style={{ padding: "16px 8px" }}>
      <h3>Settings</h3>
      <ErrorReportingOptIn />
    </div>
  );
}
