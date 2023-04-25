import applyStyleObjectElement from "./applyStyleObjectElement";
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  position: "absolute",
  top: "0",
  right: "16px",
  height: "32px",
  lineHeight: "32px",
  padding: "0px 10px",
  color: "#509ee3",
  backgroundColor: "#509ee333",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "600"
}

const databaseErrorButtonElement = document.createElement('div');
databaseErrorButtonElement.id = getComponentIdFromVariable({databaseErrorButtonElement})
databaseErrorButtonElement.innerHTML = 'Explain'
applyStyleObjectElement(databaseErrorButtonElement, buttonStyle);

export default databaseErrorButtonElement
