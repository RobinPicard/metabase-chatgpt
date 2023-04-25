// triggered each time a page is loaded/reloaded
chrome.webNavigation.onCommitted.addListener((details) => {
  // Ensure that the event is for the main frame
  if (details.frameId !== 0) {
    return;
  }
  const url = details.url
  const tabId = details.tabId
  if (url.includes("metabase") && url.includes("/question")) {
    chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      files: ['dist/bundle.js'],
    });
  }
});
