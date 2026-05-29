import { useState } from "preact/hooks";
import Button from "@common/components/Buttons/Button";
import IconButton from "@common/components/Buttons/IconButton";
import type AbstractPage from "../AbstractPage";
import CloseIcon from "@common/components/Icons/Close";
import siftLogoIcon from "@images/logo48.png";

interface PageControlPanelProps {
  className?: string;
  page: AbstractPage;
}

export default function PageControlPanel({
  className,
  page,
}: PageControlPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [inSelectProgramMode, setInSelectProgramMode] = useState(
    page.inSelectProgramMode,
  );

  return (
    <div
      className={`${className ?? ""} page-control-panel`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: expanded ? "16px" : "0px",
        transition: "all 0.2s ease-out",
      }}
      onMouseLeave={() => {
        if (expanded) setExpanded(false);
      }}
    >
      <Button
        variant="primary"
        onClick={() => {
          page.toggleSelectProgramMode();
          setInSelectProgramMode((x) => !x);
        }}
        style={{
          opacity: expanded ? "1" : "0",
          pointerEvents: expanded ? "all" : "none",
          minHeight: "unset",
          margin: "0",
          padding: "8px 8px",
          backgroundColor: "#f5c618",
          backgroundImage: "unset",
          transition: "all 0.2s ease-out",
        }}
      >
        {inSelectProgramMode ? "Exit" : "Turn on"} select program mode
      </Button>

      <IconButton
        variant="primary"
        onMouseEnter={() => {
          if (!expanded) setExpanded(true);
        }}
        onClick={() => setExpanded((x) => !x)}
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "#f5c618",
          border: "0",
          padding: "8px",
          borderRadius: "50%",
          overflow: "hidden",
          transform: expanded ? "rotateZ(90deg)" : "rotateZ(0deg)",
          transition: "all 0.2s ease-out",
        }}
      >
        {expanded ? (
          <CloseIcon />
        ) : (
          <img
            src={siftLogoIcon}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </IconButton>
    </div>
  );
}
