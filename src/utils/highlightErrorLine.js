function highlightErrorLine(parentElement, errorLineRank) {
  parentElement.forEach((element) => {
    if (element.innerHTML.match(/^(\d+)/)[1] === `${errorLineRank}`) {
      element.style.backgroundColor = '#ff6b6b'
    } else {
      element.style.backgroundColor = 'transparent'
    }
  })
}

export default highlightErrorLine
