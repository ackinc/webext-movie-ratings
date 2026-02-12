import { useEffect, useState } from "preact/hooks";
import copyIcon from "../../images/copy.svg";
import tickIcon from "../../images/tick.svg";

function CopyToClipboardButton({
  textToCopy,
  className,
}: {
  textToCopy: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 1000);
  }, [copied]);

  return (
    <button
      className={`btn btn-copy ${className ?? ""}`}
      onClick={() =>
        navigator.clipboard.writeText(textToCopy).then(() => setCopied(true))
      }
    >
      <img src={copied ? tickIcon : copyIcon} alt="Copy email" />
    </button>
  );
}

export default CopyToClipboardButton;
