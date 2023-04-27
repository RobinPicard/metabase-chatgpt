import applyStyleObjectElement from "./applyStyleObjectElement";
import cleanIcon from '../../assets/cleanIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  height: "36px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "10px 16px",
  gap: "10px",
  color: "#509ee3",
  backgroundColor: "#519EE3",
  borderRadius: "5px",
  cursor: "pointer",
}

const imageStyle = {
  width: "16px",
  height: "16px",
}

const textStyle = {
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "16px",
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
