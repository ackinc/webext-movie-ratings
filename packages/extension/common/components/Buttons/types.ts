export interface ButtonProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: Record<string, string>;
  variant: "primary" | "outlined" | "ghost";
}
