export interface ButtonProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant: "primary" | "outlined" | "ghost";
}
