let injectedTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  
  // wait for the page to be completed loaded
  if (changeInfo.status === "complete" && tab.active) {
    const url = tab.url;
    if (
      // only consider the page if it has a url pattern of the native query editor of Metabase
      url.includes("/question")
      && (
        url.includes("meta")
        || url.includes("localhost")
        || url.includes("127.0.0.1")
      )
    ) {
      // Check if script has already been injected for this tabId
      if (!injectedTabs.has(tabId)) {
        // If not, inject script and add tabId to the injectedTabs set
        injectedTabs.add(tabId);
        chrome.scripting.executeScript({
          target: {tabId: tabId, allFrames: true},
          files: ['dist/content.js'],
        });
      }
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // remove the tab id from the set when a tab is closed
  injectedTabs.delete(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // remove the tab id from the set when a page is reloaded
  if (details.frameId !== 0) {
    return;
  }
  injectedTabs.delete(details.tabId);
});
