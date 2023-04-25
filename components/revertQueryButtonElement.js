import applyStyleObjectElement from "./applyStyleObjectElement";
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  height: "35px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "9px 16px",
  color: "#519EE3",
  backgroundColor: "transparent",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "17px",
  display: "none"
}

const revertQueryButtonElement = document.createElement('div');
revertQueryButtonElement.id = getComponentIdFromVariable({revertQueryButtonElement})
revertQueryButtonElement.innerHTML = 'Revert'
applyStyleObjectElement(revertQueryButtonElement, buttonStyle);

export default revertQueryButtonElement
