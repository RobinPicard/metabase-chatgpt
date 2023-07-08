// triggered each time a page is loaded/reloaded
chrome.webNavigation.onCommitted.addListener((details) => {
  // Ensure that the event is for the main frame
  if (details.frameId !== 0) {
    return;
  }
  const url = details.url
  const tabId = details.tabId
  if (
    url.includes("/question")
    && (
      url.includes("metabase")
      || url.includes("localhost")
      || url.includes("127.0.0.1")
    )
  ) {
    chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      files: ['dist/content.js'],
    });
  }
});
