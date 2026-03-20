interface ErrorReportingOptInFormControlProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function ErrorReportingOptInFormControl({
  enabled,
  onToggle,
}: ErrorReportingOptInFormControlProps) {
  return (
    <div className="form-control">
      <input
        type="checkbox"
        id="optInToErrorReporting"
        name="optIn"
        checked={enabled}
        onChange={onToggle}
      />
      <label for="optInToErrorReporting">Opt-in to error reporting</label>
    </div>
  );
}
