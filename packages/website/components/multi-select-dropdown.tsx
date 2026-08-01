import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";

export function MultiSelectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex w-full items-center justify-between gap-2 rounded-md border bg-background py-2 pl-3 pr-2 text-left text-sm focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          className={`truncate ${value.length === 0 ? "text-gray-400" : "text-foreground"}`}
        >
          {value.length === 0 ? placeholder : value.join(", ")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <ul className="absolute top-full z-300 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {options.map((option) => {
            const checked = value.includes(option);
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => toggleOption(option)}
                  className="cursor-pointer flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-primary bg-primary" : "border-input"
                    }`}
                  >
                    {checked && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
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
