import IconButton from "./IconButton";
import type { ButtonProps } from "./types";
import SettingsIcon from "@images/settings.svg";

export default function CloseButton(props: Partial<ButtonProps>) {
  return (
    <IconButton variant="ghost" {...props}>
      <img src={SettingsIcon} alt="Close" />
    </IconButton>
  );
}
