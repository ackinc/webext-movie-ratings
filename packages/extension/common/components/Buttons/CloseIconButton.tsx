import IconButton from "./IconButton";
import type { ButtonProps } from "./types";
import closeIcon from "@images/close.svg";

export default function CloseButton(props: Partial<ButtonProps>) {
  return (
    <IconButton variant="ghost" {...props}>
      <img src={closeIcon} alt="Close" />
    </IconButton>
  );
}
