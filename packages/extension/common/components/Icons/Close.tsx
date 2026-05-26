import { type IconProps } from "./types";

export default function CloseIcon(props: IconProps) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="#464455"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <path d="M7 17L16.8995 7.10051" />
      <path d="M7 7.00001L16.8995 16.8995" />
    </svg>
  );
}
