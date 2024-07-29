function applyStyleObjectElement(element: HTMLElement, styleObject: { [key: string]: string }): void {
  for (const property in styleObject) {
    if (styleObject.hasOwnProperty(property)) {
      element.style[property as any] = styleObject[property];
    }
  }
}

export default applyStyleObjectElement;
