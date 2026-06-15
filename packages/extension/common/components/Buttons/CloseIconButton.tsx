import IconButton from "./IconButton";
import type { ButtonProps } from "./types";
import CloseIcon from "@common/components/Icons/Close";

export default function CloseButton(props: Partial<ButtonProps>) {
  return (
    <IconButton variant="ghost" {...props}>
      <CloseIcon />
    </IconButton>
  );
}
