import applyStyleObjectElement from "./applyStyleObjectElement";
import cleanIcon from '../../assets/cleanIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  height: "35px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "9px 16px",
  gap: "10px",
  color: "#509ee3",
  backgroundColor: "#519EE3",
  borderRadius: "4px",
  cursor: "pointer",
}

const imageStyle = {
  width: "20px",
  height: "20px",
}

const textStyle = {
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "17px",
  color: "#FFFFFF",
  
}

const formatQueryButtonElement = document.createElement('div');
formatQueryButtonElement.id = getComponentIdFromVariable({formatQueryButtonElement})
applyStyleObjectElement(formatQueryButtonElement, buttonStyle);

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(cleanIcon);
applyStyleObjectElement(imageElement, imageStyle);

const textElement = document.createElement('span');
textElement.innerHTML = 'Clean query'
applyStyleObjectElement(textElement, textStyle);

formatQueryButtonElement.appendChild(imageElement)
formatQueryButtonElement.appendChild(textElement)

export default formatQueryButtonElement
