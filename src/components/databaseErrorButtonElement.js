import applyStyleObjectElement from "./applyStyleObjectElement";
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  position: "absolute",
  top: "0px",
  right: "16px",
  height: "36px",
  lineHeight: "36px",
  padding: "0px 16px",
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
