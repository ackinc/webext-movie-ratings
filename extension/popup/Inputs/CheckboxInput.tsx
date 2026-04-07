import "./CheckboxInput.css";

interface CheckboxInputProps {
  className?: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: unknown) => void;
}

export default function CheckboxInput({
  className,
  name,
  label,
  ...restProps
}: CheckboxInputProps) {
  return (
    <div className={`${className ?? ""} form-control input-checkbox`}>
      <label>
        <input type="checkbox" name="optIn" {...restProps} />
        {label}
      </label>
    </div>
  );
}
