import IconButton from "./IconButton";
import CopyIcon from "@common/components/Icons/Copy";
import TickIcon from "@common/components/Icons/Tick";
import useSticky from "@common/hooks/useSticky";

interface CopyToClipboardButtonProps {
  textToCopy: string;
  copyTimeout?: number;
}

function CopyToClipboardButton({
  textToCopy,
  copyTimeout = 1000,
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useSticky(false, new Map([[true, copyTimeout]]));

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
