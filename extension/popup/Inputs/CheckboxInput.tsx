import "./CheckboxInput.css";

interface CheckboxInputProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: unknown) => void;
  className?: string;
  disabled?: boolean;
  style?: Record<string, string>;
}

export default function CheckboxInput({
  className,
  name,
  label,
  style,
  ...restProps
}: CheckboxInputProps) {
  return (
    <div className={`${className ?? ""} form-control input-checkbox`}>
      <label>
        <input
          type="checkbox"
          name="optIn"
          style={{ ...style }}
          {...restProps}
        />
        {label}
      </label>
    </div>
  );
}
