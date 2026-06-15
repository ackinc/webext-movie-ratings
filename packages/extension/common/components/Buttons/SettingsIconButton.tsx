import IconButton from "./IconButton";
import type { ButtonProps } from "./types";
import SettingsIcon from "@common/components/Icons/Settings";

export default function CloseButton(props: Partial<ButtonProps>) {
  return (
    <IconButton variant="ghost" {...props}>
      <SettingsIcon />
    </IconButton>
  );
}
