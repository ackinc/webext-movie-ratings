import { useState } from "preact/hooks";
import { IconButton } from "@chakra-ui/react";

import siftLogoIcon from "@/images/logo48.png";
import closeIcon from "@/images/close.svg";

interface PageControlPanelProps {
  className?: string;
}

export default function PageControlPanel({ className }: PageControlPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${className ?? ""} page-control-panel`}>
      {expanded ? null : null}
      <IconButton onClick={() => setExpanded((x) => !x)}>
        <img src={expanded ? closeIcon : siftLogoIcon} />
      </IconButton>
    </div>
  );
}
