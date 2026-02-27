import closeIcon from "../../images/close.svg";

function CloseButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`btn btn-close ${className ?? ""}`} onClick={onClick}>
      <img src={closeIcon} alt="Close" />
    </button>
  );
}
export default CloseButton;
