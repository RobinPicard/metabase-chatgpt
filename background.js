// root of the file
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  if (changeInfo.status == "complete") {

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

      var url = tabs[0].url;
      console.log("Current URL:", url);

      if (url && url.includes("/question")) {
        chrome.scripting.executeScript({
          target: {tabId: tabId, allFrames: true},
          function: formattingFeatureRoot,
        });
      }

    });

  }
});


// Feature 1: query formatting
function formattingFeatureRoot() {

  createFormatButton()

  function createFormatButton() {
    // insert a button in the page; on click, it triggers formatMain()
    var openEditorLink = document.querySelector('div.NativeQueryEditor a.Query-label.hide');
    var openEditorLinkParentDiv = openEditorLink.parentNode
    var formatButton = document.createElement('div');
    formatButton.innerHTML = '<button style="height: 40px;padding: 0px 10px;background-color: lightblue;border-radius: 5px;">Reformat</button>';
    openEditorLinkParentDiv.insertBefore(formatButton, openEditorLinkParentDiv.firstChild);
    formatButton.addEventListener('click', function(event) {
      formatQueryMain()
    });
  }

  function formatQueryMain() {

    var queryEditorDisplayRoot = document.querySelector('div.ace_layer.ace_text-layer');
    var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  
    currentQuery = getCurrentQuery()
    //chatgptRequest(currentQuery)
    //deleteCurrentQuery(currentQuery.length)
  
    function getCurrentQuery() {
      // get the current content of the query editor
      var queryContent = '';
      console.log(queryEditorDisplayRoot)
      console.log(queryEditorDisplayRoot.children)
      for (let i = 0; i < queryEditorDisplayRoot.children.length; i++) {
        const row = queryEditorDisplayRoot.children[i];
        queryContent += row.textContent;
        queryContent += '\n'
      }
      console.log(queryContent)
      console.log(queryContent.length)
      return queryContent
    }
  
    function deleteCurrentQuery(currentTextLength) {
      // remove the current query text from the editor
      const deleteEvent = new KeyboardEvent('keydown', { keyCode: 46 });
      queryEditorTextarea.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      for (let i = 0; i < currentTextLength; i++) {
        queryEditorTextarea.dispatchEvent(deleteEvent);
      }
    }
  
    function displayAnswer(updatedQuery) {
      // insert into the query editor's textarea the answer from chatgpt
      if (!updatedQuery) {
        return
      }
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData.setData('text/plain', updatedQuery);
      queryEditorTextarea.dispatchEvent(pasteEvent)
    }
  
    function chatgptRequest(queryContent) {
      // make a post request to chatgpt to get the updated query content
  
      chrome.storage.sync.get('metabase_chatgpt_api_key', function(result) {
        if (result.metabase_chatgpt_api_key) {
          postRequest(result.metabase_chatgpt_api_key, queryContent)
          //displayAnswer("SELECT * FROM companies")
        }
      });
  
      async function postRequest(apiKey, queryContent) {
        console.log('making api request')

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
              "model": "gpt-3.5-turbo",
              "messages": [{"role": "user", "content": `Reformat the query with SQL best practices (4-space indentation, line breaks after SELECT, FROM, WHERE). Respond with only the updated query: "${queryContent}"`}],
              "temperature": 0,
              "stream": true,
          })
        })

        console.log(response)

        if (!response.body || !response.body.pipeTo) {
          throw new Error('ReadableStream not yet supported');
        }
      
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const regex = /data: ({.*?})(?=\n|$)/g;

        var completeResult = ""
        var queuResult = ""

        function readStream() {
          return reader.read().then(({ done, value }) => {
            // stop it if we're reached the end
            if (done) {
              console.log('Stream complete');
              displayAnswer(queuResult)
              return;
            }
            // Reponse processing
            const streamData = decoder.decode(value)
            let match;
            while ((match = regex.exec(streamData)) !== null) {
              var content = JSON.parse(match[1]).choices[0].delta.content
              if (content) {
                queuResult += JSON.parse(match[1]).choices[0].delta.content
                completeResult += JSON.parse(match[1]).choices[0].delta.content
              }
            }

            if (!queuResult.endsWith("\n")) {
              displayAnswer(queuResult)
              queuResult = ""
            }

            return readStream();
          });
        }
        await readStream();
    

      }
    }
  }

}
