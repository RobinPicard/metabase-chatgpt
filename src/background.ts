type ChangeInfo = {
  status: 'loading' | 'complete';
};

interface Tab {
  active: boolean;
  url?: string;  // Making the url optional to match the Chrome API's definition
}

type RemoveInfo = {};

type Details = {
  frameId: number;
  tabId: number;
};

// Define a set to keep track of injected tabs
const injectedTabs = new Set<number>();

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: ChangeInfo, tab: Tab) => {
  // Wait for the page to be completely loaded
  if (changeInfo.status === "complete" && tab.active && tab.url) {  // Ensure tab.url is defined before using it
    // Only consider the page if it has a url pattern of the native query editor of Metabase
    if (tab.url.includes("/question") && (tab.url.includes("meta") || tab.url.includes("localhost") || tab.url.includes("127.0.0.1"))) {
      // Check if the script has already been injected for this tabId
      if (!injectedTabs.has(tabId)) {
        // If not, inject the script and add tabId to the injectedTabs set
        injectedTabs.add(tabId);
        chrome.scripting.executeScript({
          target: {tabId: tabId, allFrames: true},
          files: ['dist/content.js'],
        });
      }
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId: number, removeInfo: RemoveInfo) => {
  // Remove the tab id from the set when a tab is closed
  injectedTabs.delete(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener((details: Details) => {
  // Remove the tab id from the set when a page is reloaded
  if (details.frameId !== 0) {
    return;
  }
  injectedTabs.delete(details.tabId);
});
