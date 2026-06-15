import { useEffect, useState } from "preact/hooks";
import IconButton from "./IconButton";
import CopyIcon from "@common/components/Icons/Copy";
import TickIcon from "@common/components/Icons/Tick";

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
      {copied ? <TickIcon /> : <CopyIcon />}
    </IconButton>
  );
}

export default CopyToClipboardButton;
