import { type IconProps } from "./types";

export default function TickIcon(props: IconProps) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -0.5 25 25"
      stroke="#464455"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <path d="M5.5 12.5L10.167 17L19.5 8" />
    </svg>
  );
}
