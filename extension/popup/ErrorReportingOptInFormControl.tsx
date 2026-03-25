interface ErrorReportingOptInFormControlProps {
  checked: boolean;
  onToggle: () => void;
}

export default function ErrorReportingOptInFormControl({
  checked,
  onToggle,
}: ErrorReportingOptInFormControlProps) {
  return (
    <div className="form-control">
      <input
        type="checkbox"
        id="optInToErrorReporting"
        name="optIn"
        checked={checked}
        onChange={onToggle}
      />
      <label for="optInToErrorReporting">Opt-in to error reporting</label>
    </div>
  );
}
