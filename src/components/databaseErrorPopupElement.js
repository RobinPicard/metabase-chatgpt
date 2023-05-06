import applyStyleObjectElement from "./applyStyleObjectElement";
import dismissIcon from '../../assets/dismissIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const popupStyle = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  top: "50px",
  right: "18px",
  maxWidth: "380px",
  padding: "0px 0px 24px 0px",
  backgroundColor: "#F9FBFC",
  borderRadius: "5px",
  gap: "0px",
}

const dismissStyle = {
  width: "24px",
  height: "24px",
  padding: "8px",
  cursor: "pointer",
  boxSizing: "border-box",
}

const textStyle = {
  fontSize: "14px",
  lineHeight: "18px",
  color: "#519ee3",
  fontWeight: 400,
  padding: "0px 16px",
}

const databaseErrorPopupElement = document.createElement('div');
databaseErrorPopupElement.id = getComponentIdFromVariable({databaseErrorPopupElement})
databaseErrorPopupElement.setAttribute("error-message", "")
applyStyleObjectElement(databaseErrorPopupElement, popupStyle);

const dismissElement = document.createElement('img');
dismissElement.src = chrome.runtime.getURL(dismissIcon);
dismissElement.addEventListener('click', function(event) {
  databaseErrorPopupElement.remove()
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
