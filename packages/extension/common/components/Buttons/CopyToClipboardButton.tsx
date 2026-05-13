import { useEffect, useState } from "preact/hooks";
import IconButton from "./IconButton";
import copyIcon from "@/images/copy.svg";
import tickIcon from "@/images/tick.svg";

interface CopyToClipboardButtonProps {
  textToCopy: string;
  copyTimeout?: number;
}

function CopyToClipboardButton({
  textToCopy,
  copyTimeout = 1000,
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), copyTimeout);
  }, [copied]);

  return (
    <IconButton
      className="icon-btn-copy"
      variant="ghost"
      disabled={copied}
      onClick={() =>
        navigator.clipboard.writeText(textToCopy).then(() => setCopied(true))
      }
    >
      <img src={copied ? tickIcon : copyIcon} alt="Copy email" />
    </IconButton>
  );
}

export default CopyToClipboardButton;
