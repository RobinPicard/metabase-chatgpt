function deleteTextInputElement(element: Element, currentText: string): void {
  // remove the current query text from the editor
  if (!currentText) {
    return;
  }
  const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', keyCode: 46 });
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  for (let i = 0; i < currentText.length; i++) {
    element.dispatchEvent(deleteEvent);
  }
}

export default deleteTextInputElement;
