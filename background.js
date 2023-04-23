// inject content.js into the tab when the url changes
//chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//  if (changeInfo.status !== "complete") {
//    return;
//  }
//  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//    if (tabId !== tabs[0].id) {
//      return;
//    }
//    var url = tabs[0].url;
//    if (url && url.includes("metabase") && url.includes("/question")) {
//      console.log(tabId, url)
//      chrome.scripting.executeScript({
//        target: {tabId: tabId, allFrames: true},
//        files: ['content.js'],
//      });
//    }
//  });
//});

chrome.webNavigation.onCommitted.addListener((details) => {
  // Ensure that the event is for the main frame
  if (details.frameId !== 0) {
    return;
  }
  const url = details.url
  const tabId = details.tabId
  if (url.includes("metabase") && url.includes("/question")) {
    console.log(tabId, url)
    chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      files: ['content.js'],
    });
  }
});