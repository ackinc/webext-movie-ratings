import { type PropsWithChildren } from "preact/compat";
import type { ButtonProps } from "./types";
import "./IconButton.css";

function IconButton({
  children,
  className,
  variant,
  ...restProps
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`icon-btn icon-btn-${variant} ${className ?? ""}`}
      {...restProps}
    >
      {children}
    </button>
  );
}
export default IconButton;
