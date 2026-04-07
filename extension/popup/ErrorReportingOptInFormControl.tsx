import CheckboxInput from "./Inputs/CheckboxInput";

interface ErrorReportingOptInFormControlProps {
  checked: boolean;
  onToggle: () => void;
}

export default function ErrorReportingOptInFormControl({
  checked,
  onToggle,
}: ErrorReportingOptInFormControlProps) {
  return (
    <CheckboxInput
      name="errorReportingOptIn"
      label="Opt-in to error reporting"
      checked={checked}
      onChange={onToggle}
    />
  );
}
