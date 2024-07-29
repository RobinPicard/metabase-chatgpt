function getEditorOpenedElement(version : [number, number]) : Element {
  const elements = document.querySelectorAll('svg.Icon.Icon-contract');
  if (elements) {
    return elements[0]
  }
  return null
}

export default getEditorOpenedElement;
