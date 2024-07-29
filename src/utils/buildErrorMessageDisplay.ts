function buildErrorMessageDisplay(errorReason: string, errorMessage?: string): string {
  let displayMessage: string;

  if (errorReason === "no_api_key") {
    displayMessage = "You have not provided an API key, please do so in the extension's popup";
  } else if (errorReason === "invalid_api_key" && !errorMessage) {
    displayMessage = "Your API key is invalid, please modify it in the extension's popup";
  } else if (errorReason === "invalid_api_key" && errorMessage) {
    displayMessage = `Openai indicated that your API key is no longer valid, please modify it in the extension's popup\nThe error message they provided: ${errorMessage}`;
  } else {
    displayMessage = "Unknown error, sorry";
  }

  return displayMessage;
}

export default buildErrorMessageDisplay;
