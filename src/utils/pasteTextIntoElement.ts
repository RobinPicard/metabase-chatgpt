function pasteTextIntoElement(element: Element, text: string): void {
  // insert into the query editor's textarea the answer from chatgpt
  if (!text) {
    return;
  }

  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);

  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: clipboardData,
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(pasteEvent);
}

export default pasteTextIntoElement;
