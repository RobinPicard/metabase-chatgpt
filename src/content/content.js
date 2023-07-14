import findLineRankCharacterPosition from '../utils/findLineRankCharacterPosition.js'
import findErrorCharacterPositionInMessage from '../utils/findErrorCharacterPositionInMessage.js'
import findErrorMessageFromHtml from '../utils/findErrorMessageFromHtml.js'
import pasteTextIntoElement from '../utils/pasteTextIntoElement.js'
import deleteTextInputElement from '../utils/deleteTextInputElement.js'
import chatgptStreamRequest from '../utils/chatgptStreamRequest.js'
import formatQueryButtonElement from '../components/formatQueryButtonElement.js'
import promptQueryButtonElement from '../components/promptQueryButtonElement.js'
import revertQueryButtonElement from '../components/revertQueryButtonElement.js'
import updateQueryContainerElement from '../components/updateQueryContainerElement.js'
import databaseErrorButtonElement from '../components/databaseErrorButtonElement.js'
import databaseErrorPopupElement from '../components/databaseErrorPopupElement.js'
import getComponentIdFromVariable from '../utils/getComponentIdFromVariable.js'
import findPromptContentFromText from '../utils/findPromptContentFromText.js'
import addEmptyPatternText from '../utils/addEmptyPatternText.js'
import buildErrorMessageDisplay from '../utils/buildErrorMessageDisplay.js'
import highlightErrorLine from '../utils/highlightErrorLine.js'
import { createFormatQueryMessages, createPromptQueryMessages, createDatabaseErrorMessages } from '../utils/chatgptInputMessages'
import extractDatabaseSchema from '../utils/extractDatabaseSchema.js'


var previousQueryContents = []
var isQueryEditRunning = false
var isQueryEditDeactivated = false
var errorMessageDict = {
  errorContent: null,
  errorQuery: null,
  shouldDisplay: false
}
var embeddingModel = null
var embeddingsDict = {}





////// embedding-related things

require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const tf = require('@tensorflow/tfjs-core');

use.load().then(model => {
  embeddingModel = model
  embeddingsCreation()
});

function embeddingsCreation() {
  extractDatabaseSchema()
  .then(schema => {
    for (const database_id in schema) {
      embeddingModel.embed(schema[database_id].map(row => row.short)).then(embeddings => {
        const embeddingData = embeddings.arraySync();
        var embeddingsList = []
        schema[database_id].map((obj, index) => {
          obj.embedding = embeddingData[index];
          embeddingsList.push(obj)
        });
        embeddingsDict[database_id] = embeddingsList
      })
    }
  })
}

function euclideanDistance(v1, v2) {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    let diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

async function selectContextSentences(userPrompt) {
  const embeddings = await embeddingModel.embed([userPrompt])
  const embeddingData = embeddings.arraySync();
  const value = embeddingData[0]
  var distancesList = []
  for (const row of embeddingsDict["1"]) {
    distancesList.push({...row, distance: euclideanDistance(value, row.embedding)})
  }
  let sortedDistancesList = distancesList.sort((a, b) => a.distance - b.distance);
  return sortedDistancesList.slice(0, 3).map(row => row.long); 
}





////////// metabase redux store states's variables and listener //////////


var storeQueryContent = undefined
var storeQueryError = undefined
  
function setStoreListener() {
  // inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('dist/injectedScriptStoreUpdates.js');
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
    setupQueryEditingElements()
    setupErrorExplanationElements()
    errorLineDisplay(mutationList)
  }

  function setupQueryEditingElements() {
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

  function setupErrorExplanationElements() {
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

  function errorLineDisplay(mutationList) {

    // messy part, to be refactored

    const errorWarningElement = document.querySelector('svg.Icon.Icon-warning')
    const lineElementsList = document.querySelectorAll('div.ace_gutter-cell');

    // no error message in the page
    if (!errorWarningElement) {
      errorMessageDict = {
        errorContent: null,
        errorQuery: null,
        shouldDisplay: false
      }
      highlightErrorLine(lineElementsList, -1)
    } else {
      // if there's an error message, we look at whether its content is equal to the previous value
      const elementErrorMessage = findErrorMessageFromHtml(document.querySelector('div.spread.Visualization'))
      if (!elementErrorMessage) {
        // it's an error message without a character position, reset all colors (treat as if there's were no error)
        errorMessageDict = {
          errorContent: null,
          errorQuery: null,
          shouldDisplay: false
        }
        highlightErrorLine(lineElementsList, -1)
      } else if (elementErrorMessage !== errorMessageDict.errorContent) {
        // it's a new error message, display the color highlight
        const errorCharacterPosition = findErrorCharacterPositionInMessage(elementErrorMessage)
        const errorLineRank = findLineRankCharacterPosition(storeQueryContent, errorCharacterPosition)
        errorMessageDict = {
          errorContent: elementErrorMessage,
          errorQuery: storeQueryContent,
          shouldDisplay: true  
        }
        highlightErrorLine(lineElementsList, errorLineRank)
      } else {
        // if it's the same error message
        if (!errorMessageDict.shouldDisplay) {
          // it you should already not display, just update the value of query
          errorMessageDict = {...errorMessageDict, errorQuery: storeQueryContent}
        } else {
          // if you're supposed to display
          if (storeQueryContent === errorMessageDict.errorQuery) {
            // if it's still the same query as before, try to display
            const errorCharacterPosition = findErrorCharacterPositionInMessage(elementErrorMessage)
            const errorLineRank = findLineRankCharacterPosition(storeQueryContent, errorCharacterPosition)
            highlightErrorLine(lineElementsList, errorLineRank)
          } else {
            // if the query has changed, reset the display + change shouldDisplay to false
            errorMessageDict = {
              errorContent: elementErrorMessage,
              errorQuery: storeQueryContent,
              shouldDisplay: false  
            }
            highlightErrorLine(lineElementsList, -1)
          }
        }
      }
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
    pasteTextIntoElement(queryEditorTextarea, `${patternMatch.matchWithPattern}\n\n`)
    var responseContentQueu = ""
    selectContextSentences(storeQueryContent).then(contextSentences => {
      console.log("contextSentences")
      console.log(contextSentences)
      const promptMessages = createPromptQueryMessages(patternMatch.textWithoutPattern, patternMatch.matchAlone, contextSentences)
      chatgptStreamRequest(promptMessages, onApiResponseData, onApiRequestError)
      document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block"
    })
  }

  function onApiRequestError(errorReason, errorMessage) {
    const variableMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    const errorMessageToInsert = `/*\n${variableMessage}\n*/`
    // copy the last value of previousQueryContents by replacing the pattern by the error message
    const previousQueryContentsLastIndex = previousQueryContents.length - 1;
    const previousQueryWithoutPattern = findPromptContentFromText(previousQueryContents[previousQueryContentsLastIndex]).textWithoutPattern
    // use mainRevertQuery to update the display value by pushing our new value to previousQueryContents
    previousQueryContents.push(errorMessageToInsert + previousQueryWithoutPattern)
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
  var responseContentQueu = ""

  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block"
  const promptMessages = createFormatQueryMessages(storeQueryContent)
  chatgptStreamRequest(promptMessages, onApiResponseData, onApiRequestError)

  function onApiRequestError(errorReason, errorMessage) {
    const variableMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    const errorMessageToInsert = `/*\n${variableMessage}\n*/\n\n`
    // copy the last value of previousQueryContents and add before the error message
    const previousQueryContentsLastIndex = previousQueryContents.length - 1;
    // use mainRevertQuery to update the display value by pushing our new value to previousQueryContents
    previousQueryContents.push(errorMessageToInsert + previousQueryContents[previousQueryContentsLastIndex])
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
  console.group(previousQueryContents.length)
  if (previousQueryContents.length === 0) {
    document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "none"
  }
}


////////// Database error function //////////


function mainDatabaseError() {

  databaseErrorPopupElement.setAttribute("error-message", "")
  displayErrorPopupElement()
  // if we can find it, use the error message from the html elements, otherwise stick to the one from the store
  var errorMessage = storeQueryError
  const elementErrorMessage = findErrorMessageFromHtml(document.querySelector('div.spread.Visualization'))
  if (elementErrorMessage) {
    errorMessage = elementErrorMessage
  }
  const promptMessages = createDatabaseErrorMessages(storeQueryContent, errorMessage)
  chatgptStreamRequest(promptMessages, onApiResponseData, onApiRequestError)

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
