function findLineRankCharacterPosition(text, characterRank) {
  const linesList = text.split('\n');
  let totalCharacterCount = 0;
  for (let i = 0; i < linesList.length; i++) {
    const line = linesList[i];
    const lineCharacterCount = line.length + 1; // add 1 for the line break character
    // check if the character rank falls within this line
    if (characterRank < totalCharacterCount + lineCharacterCount) {
      return i + 1; // return the line number (add 1 because line numbers start at 1)
    }
    totalCharacterCount += lineCharacterCount;
  }
}

export default findLineRankCharacterPosition
