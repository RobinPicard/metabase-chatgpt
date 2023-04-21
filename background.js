var metabaseElement = document.createElement("div");
metabaseElement.innerHTML = "<div style='position: fixed; bottom: 0; right: 0; background-color: #f1c40f; padding: 8px;'>This is a Metabase page</div>";


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  if (changeInfo.status == "complete") {

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

      var url = tabs[0].url;
      console.log("Current URL:", url);

      if (url && url.includes("/question")) {
        chrome.scripting.executeScript({
          target: {tabId: tabId, allFrames: true},
          function: myFunc,
        });
      } else {
        metabaseElement.remove();
      }

    });

  }
});

function myFunc() {
  document.body.insertAdjacentElement("beforeend", metabaseElement);
}
