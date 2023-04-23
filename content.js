// style

errorPopupStyle = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  top: "50px",
  right: "100px",
  maxWidth: "300px",
  padding: "5px 5px 15px 5px",
  backgroundColor: "#509ee333",
  borderRadius: "5px",
  gap: "2px",
}
errorPopupDismissStyle = {
  width: "20px",
  height: "20px",
  padding: "4px",
  cursor: "pointer",
  boxSizing: "border-box",
}
errorPopupTextStyle = {
  fontSize: "14px",
  lineHeight: "18px",
  color: "#509ee3",
  fontWeight: 600,
  padding: "0px 10px",
}

function applyStyle(element, styleObject) {
  for (const property in styleObject) {
    element.style[property] = styleObject[property];
  }
}



//////////

var queryContent = undefined
var queryError = undefined
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
    if (event.data.type && event.data.type === 'METABASE_CHATGPT_QUERY_ERROR_STATE') {
      queryError = event.data.payload;
    }
  });
}

function setupElements() {

  function onElementAddedOrRemoved(mutationList, observer) {
    setupFormatElement()
    setupErrorElement()
  }

  function setupFormatElement() {
    var openedEditorCloseLinkElement = document.querySelector('div.NativeQueryEditor a.Query-label:not(.hide)');
    var formatQueryButtonsContainer = document.querySelector('#metabase-chatgpt-format-query-button-container');
    if (!formatQueryButtonsContainer && !openedEditorCloseLinkElement) {
      return
    }
    if (formatQueryButtonsContainer && openedEditorCloseLinkElement) {
      return
    }
    if (formatQueryButtonsContainer && !openedEditorCloseLinkElement) {
      formatQueryButtonsContainer.remove();
      return
    }
    if (!formatQueryButtonsContainer && openedEditorCloseLinkElement) {
      constButtonStyle = "height: 32px; line-height: 32px; padding: 0px 10px; color: #509ee3; background-color: #509ee333; border-radius: 5px; cursor: pointer; font-weight: 600;"
      const parentElement = openedEditorCloseLinkElement.parentNode
      //
      formatQueryButtonsContainer = document.createElement('div');
      formatQueryButtonsContainer.id = "metabase-chatgpt-format-query-button-container";
      formatQueryButtonsContainer.style = "display: flex; gap: 16px"
      //
      formatQueryButton = document.createElement('div');
      formatQueryButton.className = "format"
      formatQueryButton.style = constButtonStyle
      formatQueryButton.innerHTML = "Reformat"
      //
      revertFormatQueryButton = document.createElement('div');
      revertFormatQueryButton.className = "revert"
      revertFormatQueryButton.style = constButtonStyle
      revertFormatQueryButton.innerHTML = "Revert"
      revertFormatQueryButton.style.display = "none"
      //
      formatQueryButtonsContainer.appendChild(revertFormatQueryButton);
      formatQueryButtonsContainer.appendChild(formatQueryButton);
      parentElement.insertBefore(formatQueryButtonsContainer, parentElement.firstChild);
      formatQueryButton.addEventListener('click', function(event) {
        mainFormatQuery()
      });
      revertFormatQueryButton.addEventListener('click', function(event) {
        mainRevertFormatQuery()
      });
    }
  }

  function setupErrorElement() {
    console.log('coucou')
    var iconWarningElement = document.querySelector('svg.Icon.Icon-warning');
    var errorButton = document.querySelector("#metabase-chatgpt-error-button");

    if (!iconWarningElement && !errorButton) {
      return
    }
    if (iconWarningElement && errorButton) {
      return
    }
    if (!iconWarningElement && errorButton) {
      errorButton.remove();
      return
    }
    if (iconWarningElement && !errorButton) {
      console.log('yay')
      var vizualizationRootElement = document.querySelector('div.spread.Visualization')
      //
      errorButton = document.createElement('div');
      errorButton.id = "metabase-chatgpt-error-button";
      errorButton.style = "position: absolute; top: 0; right: 16px; height: 32px; line-height: 32px; padding: 0px 10px; color: #509ee3; background-color: #509ee333; border-radius: 5px; cursor: pointer; font-weight: 600;"
      errorButton.innerHTML = "Explain"
      //
      vizualizationRootElement.appendChild(errorButton);
      errorButton.addEventListener('click', function(event) {
        mainInterpretError()
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
setupElements()


//////////////////////


function mainFormatQuery() {
  if (!queryContent) {
    return
  }
  previousQueryContents.push(queryContent)
  document.querySelector('#metabase-chatgpt-format-query-button-container div.revert').style.display = "block"
  deleteCurrentQuery(queryContent)
  chatgptFormatRequest(queryContent)
}

function mainRevertFormatQuery() {
  if (previousQueryContents.length === 0) {
    return
  }
  deleteCurrentQuery(queryContent)
  pasteTextQueryEditor(previousQueryContents.pop())
  if (previousQueryContents.length === 0) {
    document.querySelector('#metabase-chatgpt-format-query-button-container div.revert').style.display = "none"
  }
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
          "messages": [{"role": "user", "content": `Reformat the query with sqlfluff best practices (4-space indentation, line breaks after SELECT/FROM/WHERE, one column per line for SELECT, commmands in uppercase). Respond with only the updated query: "${query}"`}],
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


///////////


function mainInterpretError() {
  createErrorPopupElement()
  console.log(`Here are a db error messsage and the query that caused it, give the most likely explanation for the origin of the error in <500 characters (start with giving the line at which there's the error)\n${queryError};\n${queryContent};`)
  chatgptErrorRequest(queryContent, queryError)
}

function createErrorPopupElement() {
  //
  var errorPopup = document.querySelector("#metabase-chatgpt-error-popup");
  if (errorPopup) {
    return
  }
  var vizualizationRootElement = document.querySelector('div.spread.Visualization')
  //
  errorPopup = document.createElement('div');
  errorPopup.id = "metabase-chatgpt-error-popup";
  applyStyle(errorPopup, errorPopupStyle)
  //
  errorPopupDismiss = document.createElement('img');
  errorPopupDismiss.className = "dissmiss";
  applyStyle(errorPopupDismiss, errorPopupDismissStyle)
  errorPopupDismiss.src = chrome.runtime.getURL("images/dismissIcon.png")
  errorPopupDismiss.addEventListener('click', function(event) {
    errorPopup.remove()
  });
  //
  errorPopupText = document.createElement('div');
  errorPopupText.className = "text";
  applyStyle(errorPopupText, errorPopupTextStyle)
  //
  errorPopup.appendChild(errorPopupDismiss)
  errorPopup.appendChild(errorPopupText)
  vizualizationRootElement.appendChild(errorPopup);
}




function chatgptErrorRequest(query, error) {
  // make a post request to chatgpt to get the updated query content

  chrome.storage.sync.get('metabase_chatgpt_api_key', function(result) {
    if (result.metabase_chatgpt_api_key) {
      postRequest(result.metabase_chatgpt_api_key, query, error)
    }
  });

  async function postRequest(apiKey, query, error) {
    // make the post request to chatgpt and display the result progressively as it comes
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [{"role": "user", "content": `${query};\n${error};\n Here you have 1st a query and then the db error it returned, give the most likely explanation for the origin of the error`}],
          "temperature": 0,
          "stream": true,
      })
    })

    console.log("b")
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const regex = /data: ({.*?})(?=\n|$)/g;
    const textElement = document.querySelector('#metabase-chatgpt-error-popup div.text')

    console.log("textElement", textElement)

    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          console.log(completeResult)
          return
        }
        const streamData = decoder.decode(value)
        let match;
        while ((match = regex.exec(streamData)) !== null) {
          const content = JSON.parse(match[1]).choices[0].delta.content
          if (content) {
            textElement.innerHTML += content
          }
        }
        return readStream();
      });
    }
    await readStream();
  }
}


