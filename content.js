import findLineRankCharacterPosition from './utils/findLineRankCharacterPosition.js'
import findErrorCharacterPositionInMessage from './utils/findErrorCharacterPositionInMessage.js'
import findErrorMessageFromHtml from './utils/findErrorMessageFromHtml.js'
import pasteTextIntoElement from './utils/pasteTextIntoElement.js'
import deleteTextInputElement from './utils/deleteTextInputElement.js'
import chatgptStreamRequest from './utils/chatgptStreamRequest.js'
import formatQueryButtonElement from './components/formatQueryButtonElement.js'
import promptQueryButtonElement from './components/promptQueryButtonElement.js'
import revertQueryButtonElement from './components/revertQueryButtonElement.js'
import updateQueryContainerElement from './components/updateQueryContainerElement.js'
import databaseErrorButtonElement from './components/databaseErrorButtonElement.js'
import databaseErrorPopupElement from './components/databaseErrorPopupElement.js'
import getComponentIdFromVariable from './utils/getComponentIdFromVariable.js'
import findPromptContentFromText from './utils/findPromptContentFromText.js'
import addEmptyPatternText from './utils/addEmptyPatternText.js'
import buildErrorMessageDisplay from './utils/buildErrorMessageDisplay.js'


var previousQueryContents = []
var isQueryEditRunning = false
var isQueryEditDeactivated = false


////////// metabase redux store states's variables and listener //////////


var storeQueryContent = undefined
var storeQueryError = undefined
  
function setStoreListener() {
  // inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('injectedScriptStoreUpdates.js');
  (document.head || document.documentElement).appendChild(injectedScriptStoreUpdates);
  // listen from messages from the script about updates of the store states
  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return
    };
    if (event.data.type && event.data.type === 'METABASE_CHATGPT_QUERY_CONTENT_STATE') {
      storeQueryContent = event.data.payload;
    }
    if (event.data.type && event.data.type === 'METABASE_CHATGPT_QUERY_ERROR_STATE') {
      storeQueryError = event.data.payload;
    }
  });
}

setStoreListener()


////////// check the state of the DOM to see whether our elements should be inserted/removed //////////


function setupElements() {

  function onElementAddedOrRemoved(mutationList, observer) {
    setupFormatElement()
    setupErrorElement()
  }

  function setupFormatElement() {
    var openedEditorCloseLinkElement = document.querySelector('div.NativeQueryEditor a.Query-label:not(.hide)');
    var existingUpdateQueryContainerElement = document.getElementById(getComponentIdFromVariable({updateQueryContainerElement}))
    if (!existingUpdateQueryContainerElement && !openedEditorCloseLinkElement) {
      return
    }
    if (existingUpdateQueryContainerElement && openedEditorCloseLinkElement) {
      return
    }
    if (existingUpdateQueryContainerElement && !openedEditorCloseLinkElement) {
      existingUpdateQueryContainerElement.remove();
      return
    }
    if (!existingUpdateQueryContainerElement && openedEditorCloseLinkElement) {
      const parentElement = openedEditorCloseLinkElement.parentNode
      //
      updateQueryContainerElement.appendChild(revertQueryButtonElement);
      updateQueryContainerElement.appendChild(promptQueryButtonElement);
      updateQueryContainerElement.appendChild(formatQueryButtonElement);
      parentElement.insertBefore(updateQueryContainerElement, parentElement.firstChild);
    }
  }

  function setupErrorElement() {
    var iconWarningElement = document.querySelector('svg.Icon.Icon-warning');
    var existingDatabaseErrorButtonElement = document.getElementById(getComponentIdFromVariable({databaseErrorButtonElement}));
    if (!iconWarningElement && !existingDatabaseErrorButtonElement) {
      return
    }
    if (iconWarningElement && existingDatabaseErrorButtonElement) {
      return
    }
    if (!iconWarningElement && existingDatabaseErrorButtonElement) {
      existingDatabaseErrorButtonElement.remove();
      const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}));
      if (existingdatabaseErrorPopupElement) {
        existingdatabaseErrorPopupElement.remove()
      }
      return
    }
    if (iconWarningElement && !existingDatabaseErrorButtonElement) {
      var vizualizationRootElement = document.querySelector('div.spread.Visualization')
      vizualizationRootElement.appendChild(databaseErrorButtonElement);
    }
  }

  // Add the listeners to the elements
  promptQueryButtonElement.addEventListener('click', function(event) {
    mainPromptQuery()
  });
  formatQueryButtonElement.addEventListener('click', function(event) {
    mainFormatQuery()
  });
  revertQueryButtonElement.addEventListener('click', function(event) {
    mainRevertQuery()
  });
  databaseErrorButtonElement.addEventListener('click', function(event) {
    mainDatabaseError()
  });

  // Setup the DOM change observer
  const observer = new MutationObserver(onElementAddedOrRemoved);
  const targetElement = document.body;
  const config = {
    childList: true,
    subtree: true,
  };
  observer.observe(targetElement, config);
} 

setupElements()


////////// Query-edition functions //////////


function mainPromptQuery() {

  if (isQueryEditRunning || isQueryEditDeactivated) {
    return
  }

  var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  previousQueryContents.push(storeQueryContent)
  document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block"
  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  const patternMatch = findPromptContentFromText(storeQueryContent)

  if (!patternMatch) {
    const updatedQueryContent = addEmptyPatternText(storeQueryContent)
    pasteTextIntoElement(queryEditorTextarea, updatedQueryContent)
  } else {
    const prompt = `I'm giving you 1st a sql query and then an instruction prompt. Respond with only the updated query. ${patternMatch.textWithoutPattern}; ${patternMatch.matchAlone}`
    pasteTextIntoElement(queryEditorTextarea, `${patternMatch.matchWithPattern}\n\n`)
    var responseContentQueu = ""
    chatgptStreamRequest(prompt, onApiResponseData, onApiRequestError)
    document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block"
  }

  function onApiRequestError(errorReason, errorMessage) {
    const variableMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    const errorMessageToInsert = `/*\n${variableMessage}\n*/`
    // update the last value of previousQueryContents by replacing the pattern by the error message and then call mainRevertQuery
    const previousQueryContentsLastIndex = previousQueryContents.length - 1;
    const previousQueryWithoutPattern = findPromptContentFromText(previousQueryContents[previousQueryContentsLastIndex]).textWithoutPattern
    previousQueryContents[previousQueryContentsLastIndex] = errorMessageToInsert + previousQueryWithoutPattern
    mainRevertQuery()
  }

  function onApiResponseData(content, isFinished) {
    isQueryEditRunning = !isFinished
    // dirty way of ignoring the running async function after cancellation
    if (isQueryEditDeactivated && isFinished) {
      isQueryEditDeactivated = false;
    }
    if (isQueryEditDeactivated) {
      return
    }
    responseContentQueu += content
    if (!responseContentQueu.endsWith("\n") || (isFinished)) {
      pasteTextIntoElement(queryEditorTextarea, responseContentQueu)
      responseContentQueu = ""
    }
  }
}


function mainFormatQuery() {

  if (!storeQueryContent || isQueryEditRunning || isQueryEditDeactivated) {
    return
  }
  previousQueryContents.push(storeQueryContent)

  var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  const prompt = `Reformat the query with sqlfluff best practices (4-space indentation, line breaks after SELECT/FROM/WHERE, one column per line for SELECT, commmands in uppercase). Respond with only the updated query: "${storeQueryContent}"`
  var responseContentQueu = ""

  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  chatgptStreamRequest(prompt, onApiResponseData, onApiRequestError)
  document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block"

  function onApiRequestError(errorReason, errorMessage) {
    const variableMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    const errorMessageToInsert = `/*\n${variableMessage}\n*/\n`
    // update the last value of previousQueryContents by replacing the pattern by the error message and then call mainRevertQuery
    const previousQueryContentsLastIndex = previousQueryContents.length - 1;
    previousQueryContents[previousQueryContentsLastIndex] = errorMessageToInsert + previousQueryContents[previousQueryContentsLastIndex]
    mainRevertQuery()
  }
  
  function onApiResponseData(content, isFinished) {
    isQueryEditRunning = !isFinished
    // dirty way of ignoring the running async function after cancellation
    if (isQueryEditDeactivated && isFinished) {
      isQueryEditDeactivated = false;
    }
    if (isQueryEditDeactivated) {
      return
    }
    responseContentQueu += content
    if (!responseContentQueu.endsWith("\n") || (isFinished)) {
      pasteTextIntoElement(queryEditorTextarea, responseContentQueu)
      responseContentQueu = ""
    }
  }
}


function mainRevertQuery() {
  if (previousQueryContents.length === 0) {
    return
  }
  if (isQueryEditRunning) {
    isQueryEditDeactivated = true;
  }
  var queryEditorTextarea = document.querySelector('textarea.ace_text-input');
  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  pasteTextIntoElement(queryEditorTextarea, previousQueryContents.pop())
  if (previousQueryContents.length === 0) {
    document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "none"
  }
}


////////// Database error function //////////


function mainDatabaseError() {

  displayErrorPopupElement()
  // if we can find it, use the error message from the html elements, otherwise stick to the one from the store
  var errorMessage = storeQueryError
  const elementErrorMessage = findErrorMessageFromHtml(document.querySelector('div.spread.Visualization'))
  if (elementErrorMessage) {
    const errorCharacterPosition = findErrorCharacterPositionInMessage(elementErrorMessage)
    if (errorCharacterPosition) {
      const errorLineRank = findLineRankCharacterPosition(elementErrorMessage, errorCharacterPosition)
      databaseErrorPopupElement.setAttribute("error-message", `Error at line ${errorLineRank}.\n`)
    }
    errorMessage = elementErrorMessage
  }
  const prompt = `${storeQueryContent};\n${errorMessage};\n Here you have 1st a query and then the db error it returned, give the most likely explanation for the origin of the error`
  chatgptStreamRequest(prompt, onApiResponseData, onApiRequestError)

  function onApiRequestError(errorReason, errorMessage) {
    const variableErrorMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    onApiResponseData(variableErrorMessage)
  }
  
  function onApiResponseData(content) {
    const previousContent = databaseErrorPopupElement.getAttribute("error-message")
    databaseErrorPopupElement.setAttribute("error-message", previousContent+content)
  }

  function displayErrorPopupElement() {
    if (document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))) {
      databaseErrorPopupElement.remove()
      databaseErrorPopupElement.setAttribute("error-message", "")
    }
    var vizualizationRootElement = document.querySelector('div.spread.Visualization')
    vizualizationRootElement.appendChild(databaseErrorPopupElement);
  }

}
