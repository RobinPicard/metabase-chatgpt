import applyStyleObjectElement from "./applyStyleObjectElement";
import loadImage from '../../assets/loadIcon.png'
import loadGif from '../../assets/loadIcon.gif'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const buttonStyle = {
  position: "relative",
  height: "36px",
  width: "36px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "8px",
  color: "#509ee3",
  backgroundColor: "#519EE3",
  borderRadius: "5px",
  cursor: "pointer",
}

const imageStyle = {
  width: "20px",
  height: "20px",
}

const tootltipStyle = {
  visibility: "hidden",
  position: "absolute",
  top: "50px",
  right: "0px",
  zIndex: 10,
  width: "120px",
  fontSize: "12px",
  padding: "10px",
  backgroundColor: "rgb(181 186 199)",
  borderRadius: "5px",
  color: "white"
}

const updateEmbeddingsButtonElement = document.createElement('div');
updateEmbeddingsButtonElement.id = getComponentIdFromVariable({updateEmbeddingsButtonElement})
updateEmbeddingsButtonElement.setAttribute("animate", false)
applyStyleObjectElement(updateEmbeddingsButtonElement, buttonStyle);

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(loadImage);
applyStyleObjectElement(imageElement, imageStyle);

const tooltipElement = document.createElement('div');
tooltipElement.innerHTML = "Click to launch an update of the database structure embedding"
applyStyleObjectElement(tooltipElement, tootltipStyle);

updateEmbeddingsButtonElement.appendChild(imageElement)
updateEmbeddingsButtonElement.appendChild(tooltipElement)

// Create a MutationObserver instance to watch for attribute changes on the parent element
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'animate') {
      const animateValue = updateEmbeddingsButtonElement.getAttribute("animate")
      if (animateValue === "true") {
        imageElement.src = chrome.runtime.getURL(loadGif);
      } else {
        imageElement.src = chrome.runtime.getURL(loadImage);
      }
    }
  });
});
// Configure the observer to watch for attribute changes on the parent element
observer.observe(updateEmbeddingsButtonElement, { attributes: true });

// make the tooltip visible onHover
let timeoutId;
updateEmbeddingsButtonElement.addEventListener('mouseover', function(event) {
  // set a timeout to show the tooltip after 0.2 seconds
  timeoutId = setTimeout(function() {
    tooltipElement.style.visibility = 'visible';
  }, 200);
});
updateEmbeddingsButtonElement.addEventListener('mouseout', function() {
  // clear the timeout if it's set and hide the tooltip
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  tooltipElement.style.visibility = 'hidden';
});

export default updateEmbeddingsButtonElement
