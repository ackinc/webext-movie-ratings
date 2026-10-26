import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./multi-select-dropdown.module.css";

export function MultiSelectDropdown({
  defaultOpen,
  value,
  onChange,
  options,
  placeholder,
}: {
  defaultOpen?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleOption(option: string) {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );
  }

  return (
    <div ref={ref} className={styles["dropdown"]}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={styles["trigger"]}
      >
        <span
          className={
            value.length === 0 ? styles["placeholder"] : styles["value"]
          }
        >
          {value.length === 0 ? placeholder : value.join(", ")}
        </span>
        <ChevronDown className={styles["chevron"]} />
      </button>
      {open && (
        <ul className={styles["menu"]}>
          {options.map((option) => {
            const checked = value.includes(option);
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={styles["option"]}
                >
                  <span
                    className={`${styles["checkbox"]} ${checked ? styles["checked"] : ""}`}
                  >
                    {checked && <Check className={styles["check"]} />}
                  </span>
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
