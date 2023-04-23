var queryContent = undefined
var previousQueryContents = []
  
function setStoreListener() {
  // inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('injectedScriptStoreUpdates.js');
  (document.head || document.documentElement).appendChild(injectedScriptStoreUpdates);
  // listen from messages from the script about updates of the queryContent
  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return
    };
    if (event.data.type && event.data.type === 'METABASE_CHATGPT_QUERY_CONTENT_STATE') {
      queryContent = event.data.payload;
    }
  });
}

function setFormatQueryButton() {
  function onElementAddedOrRemoved(mutationList, observer) {
    var openedEditorCloseLinkElement = document.querySelector('div.NativeQueryEditor a.Query-label:not(.hide)');
    var formatQueryButton = document.querySelector('#metabase-chatgpt-format-query-button');
    if (!formatQueryButton && !openedEditorCloseLinkElement) {
      return
    }
    if (formatQueryButton && openedEditorCloseLinkElement) {
      return
    }
    if (formatQueryButton && !openedEditorCloseLinkElement) {
      formatQueryButton.remove();
      return
    }
    if (!formatQueryButton && openedEditorCloseLinkElement) {
      formatQueryButton = document.createElement('div');
      formatQueryButton.id = "metabase-chatgpt-format-query-button"
      formatQueryButton.innerHTML = '<button style="height: 40px;padding: 0px 10px;background-color: lightblue;border-radius: 5px;">Reformat</button>';
      openedEditorCloseLinkElement.parentNode.insertBefore(formatQueryButton, openedEditorCloseLinkElement.parentNode.firstChild);
      formatQueryButton.addEventListener('click', function(event) {
        mainFormatQuery()
      });

      cancelFormatQueryButton = document.createElement('div');
      cancelFormatQueryButton.id = "metabase-chatgpt-cancel-format-query-button"
      cancelFormatQueryButton.innerHTML = '<button style="height: 40px;padding: 0px 10px;background-color: lightblue;border-radius: 5px;">Cancel</button>';
      openedEditorCloseLinkElement.parentNode.insertBefore(cancelFormatQueryButton, openedEditorCloseLinkElement.parentNode.firstChild);
      cancelFormatQueryButton.addEventListener('click', function(event) {
        mainCancelFormatQuery()
      });

    }
  }
  // Setup the DOM change observer
  const observer = new MutationObserver(onElementAddedOrRemoved);
  const targetElement = document.body;
  const config = {
    childList: true,
    subtree: true,
  };
  observer.observe(targetElement, config);
} 


setStoreListener()
setFormatQueryButton()



//////////////////////:



// var queryEditorDisplayRoot = document.querySelector('div.ace_layer.ace_text-layer');


function mainFormatQuery() {
  previousQueryContents.push(queryContent)
  deleteCurrentQuery(queryContent)
  chatgptFormatRequest(queryContent)
}

function mainCancelFormatQuery() {
  deleteCurrentQuery(queryContent)
  pasteTextQueryEditor(previousQueryContents.pop())
}



function deleteCurrentQuery(query) {
  // remove the current query text from the editor
  if (!query) {
    return
  }
  var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  const deleteEvent = new KeyboardEvent('keydown', { keyCode: 46 });
  queryEditorTextarea.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  for (let i = 0; i < query.length; i++) {
    queryEditorTextarea.dispatchEvent(deleteEvent);
  }
}

function pasteTextQueryEditor(query) {
  // insert into the query editor's textarea the answer from chatgpt
  if (!query) {
    return
  }
  var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: new DataTransfer(),
  });
  pasteEvent.clipboardData.setData('text/plain', query);
  queryEditorTextarea.dispatchEvent(pasteEvent)
}

function chatgptFormatRequest(query) {
  // make a post request to chatgpt to get the updated query content

  chrome.storage.sync.get('metabase_chatgpt_api_key', function(result) {
    if (result.metabase_chatgpt_api_key) {
      postRequest(result.metabase_chatgpt_api_key, query)
    }
  });

  async function postRequest(apiKey, query) {
    // make the post request to chatgpt and display the result progressively as it comes
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [{"role": "user", "content": `Reformat the query with SQL best practices (4-space indentation, line breaks after SELECT/FROM/WHERE, one column per line for SELECT, commmands in uppercase). Respond with only the updated query: "${query}"`}],
          "temperature": 0,
          "stream": true,
      })
    })
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const regex = /data: ({.*?})(?=\n|$)/g;
    var queuResult = ""
    var completeResult = ""

    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          console.log(completeResult)
          return pasteTextQueryEditor(queuResult)
        }
        const streamData = decoder.decode(value)
        let match;
        while ((match = regex.exec(streamData)) !== null) {
          const content = JSON.parse(match[1]).choices[0].delta.content
          if (content) {
            queuResult += content
            completeResult += content
          }
        }
        if (!queuResult.endsWith("\n")) {
          pasteTextQueryEditor(queuResult)
          queuResult = ""
        }
        return readStream();
      });
    }
    await readStream();
  }
}

