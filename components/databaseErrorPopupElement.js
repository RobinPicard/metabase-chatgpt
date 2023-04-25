import applyStyleObjectElement from "./applyStyleObjectElement";
import dismissIcon from '../images/dismissIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const popupStyle = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  top: "50px",
  right: "100px",
  maxWidth: "300px",
  padding: "5px 5px 15px 5px",
  backgroundColor: "#509ee333",
  borderRadius: "5px",
  gap: "2px",
}

const dismissStyle = {
  width: "20px",
  height: "20px",
  padding: "4px",
  cursor: "pointer",
  boxSizing: "border-box",
}

const textStyle = {
  fontSize: "14px",
  lineHeight: "18px",
  color: "#509ee3",
  fontWeight: 600,
  padding: "0px 10px",
}

const databaseErrorPopupElement = document.createElement('div');
databaseErrorPopupElement.id = getComponentIdFromVariable({databaseErrorPopupElement})
databaseErrorPopupElement.setAttribute("error-message", "")
applyStyleObjectElement(databaseErrorPopupElement, popupStyle);

const dismissElement = document.createElement('img');
dismissElement.src = chrome.runtime.getURL(dismissIcon);
dismissElement.addEventListener('click', function(event) {
  databaseErrorPopupElement.remove()
  databaseErrorPopupElement.setAttribute("error-message", "")
});
applyStyleObjectElement(dismissElement, dismissStyle);

const textElement = document.createElement('span');
applyStyleObjectElement(textElement, textStyle);

databaseErrorPopupElement.appendChild(dismissElement)
databaseErrorPopupElement.appendChild(textElement)

// Create a MutationObserver instance to watch for attribute changes on the parent element
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'error-message') {
      textElement.innerHTML = databaseErrorPopupElement.getAttribute("error-message")
    }
  });
});
// Configure the observer to watch for attribute changes on the parent element
observer.observe(databaseErrorPopupElement, { attributes: true });

export default databaseErrorPopupElement
