import { type PropsWithChildren } from "preact/compat";
import type { ButtonProps } from "./types";
import "./Button.css";

export default function Button({
  children,
  className,
  variant,
  ...restProps
}: PropsWithChildren<ButtonProps>) {
  return (
    <button className={`btn btn-${variant} ${className ?? ""}`} {...restProps}>
      {children}
    </button>
  );
}
