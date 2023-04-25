import applyStyleObjectElement from "./applyStyleObjectElement";
import magicWandIcon from '../../assets/magicWandIcon.png'
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

const promptQueryButtonElement = document.createElement('div');
promptQueryButtonElement.id = getComponentIdFromVariable({promptQueryButtonElement})
applyStyleObjectElement(promptQueryButtonElement, buttonStyle);

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(magicWandIcon);
applyStyleObjectElement(imageElement, imageStyle);

const textElement = document.createElement('span');
textElement.innerHTML = 'Run prompt'
applyStyleObjectElement(textElement, textStyle);

promptQueryButtonElement.appendChild(imageElement)
promptQueryButtonElement.appendChild(textElement)

export default promptQueryButtonElement
