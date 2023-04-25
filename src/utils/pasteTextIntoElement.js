function pasteTextIntoElement(element, text) {
  // insert into the query editor's textarea the answer from chatgpt
  if (!text) {
    return
  }
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: new DataTransfer(),
  });
  pasteEvent.clipboardData.setData('text/plain', text);
  element.dispatchEvent(pasteEvent)
}

export default pasteTextIntoElement
