function findErrorCharacterPositionInMessage(message) {
  const positionRegex = /Position: (\d+)/;
  const match = message.match(positionRegex);
  if (match) {
    // return the text matched by the capturing group (the number)
    return match[1];
  }
}

export default findErrorCharacterPositionInMessage
