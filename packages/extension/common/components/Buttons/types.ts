export interface ButtonProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  style?: Record<string, string>;
  variant: "primary" | "outlined" | "ghost";
}
