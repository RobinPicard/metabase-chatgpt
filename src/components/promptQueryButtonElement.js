import applyStyleObjectElement from "./applyStyleObjectElement";
import magicWandIcon from '../../assets/magicWandIcon.png'
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
