function applyStyleObjectElement(element, styleObject) {
  for (const property in styleObject) {
    element.style[property] = styleObject[property];
  }
}

export default applyStyleObjectElement
