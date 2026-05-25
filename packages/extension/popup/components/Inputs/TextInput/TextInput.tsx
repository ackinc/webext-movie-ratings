import "./TextInput.css";

interface TextInputProps {
  name: string;
  type?: "text" | "email";
  value: string;
  label?: string;
  onChange: (value: string) => void;
  className?: string;
  autocomplete?: string;
  placeholder?: string;
  helperText?: string;
}

export default function TextInput({
  type,
  className,
  onChange,
  label,
  helperText,
  ...restProps
}: TextInputProps) {
  const inputElem = (
    <input
      type={type ?? "text"}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      className={`text-input ${className ?? ""}`}
      {...restProps}
    />
  );

  return (
    <div className="text-input">
      {label ? (
        <label>
          {label}
          {inputElem}
        </label>
      ) : (
        inputElem
      )}
      {helperText ? <p className="helper-text">{helperText}</p> : null}
    </div>
  );
}
