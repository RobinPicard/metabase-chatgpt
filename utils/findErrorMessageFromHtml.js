function findErrorMessageFromHtml(rootElement) {
  const pattern = /Position: (\d+)$/;
  const descendantElementsList = rootElement.querySelectorAll('*');
  for (const element of descendantElementsList) {
    if (pattern.test(element.innerHTML)) {
      return element.innerHTML
    }
  }
}
  
export default findErrorMessageFromHtml
