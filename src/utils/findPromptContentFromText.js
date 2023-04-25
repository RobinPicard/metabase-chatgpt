function findPromptContentFromText(text) {
  const regex = /\/\*%([\s\S]*?)%\*\//g;
  const matchedPattern = regex.exec(text)
  if (matchedPattern) {
    return {
      matchWithPattern: matchedPattern[0],
      matchAlone: matchedPattern[1],
      textWithoutPattern: text.replace(regex, '')
    }
  }
} 

export default findPromptContentFromText
