import promptQueryButtonElement from '../components/promptQueryButtonElement'
import promptQueryPopupElement from '../components/promptQueryPopupElement'
import revertQueryButtonElement from '../components/revertQueryButtonElement'
import updateQueryContainerElement from '../components/updateQueryContainerElement'
import updateSchemaExtractionElement from '../components/updateSchemaExtractionElement'
import databaseErrorButtonElement from '../components/databaseErrorButtonElement'
import databaseErrorPopupElement from '../components/databaseErrorPopupElement'

import pasteTextIntoElement from '../utils/pasteTextIntoElement'
import deleteTextInputElement from '../utils/deleteTextInputElement'
import getComponentIdFromVariable from '../utils/getComponentIdFromVariable'
import buildErrorMessageDisplay from '../utils/buildErrorMessageDisplay'

import chatgptStreamRequest from '../services/chatgptStreamRequest'
import { createPromptQueryMessages, createDatabaseErrorMessages } from '../services/chatgptInputMessages'
import extractDatabaseSchema from '../services/extractDatabaseSchema'
import getMetabaseVersion from '../services/getMetabaseVersion'

import getEditorOpenedElement from '../page_elements/getEditorOpenedElement'
import getErrorWarningElement from '../page_elements/getErrorWarningElement'
import getQueryEditorTextarea from '../page_elements/getQueryEditorTextarea'
import getVisualizationRootElement from '../page_elements/getVisualizationRootElement'
import getEditorTopBar from '../page_elements/getEditorTopBar'


////////////// types //////////////


interface databasesSchema {
  [key: number]: {
    engine: string;
    tables: string;
  };
};

interface config {
  schema: databasesSchema | undefined,
  schemaExtractedAt: string | undefined,
  key: string | undefined,
  status: 'error' | 'invalid' | 'valid' | undefined,
  modelName: string | undefined,
};


////////////// global variables //////////////


// values stored in chrome
var configDict: config = {
  schema: undefined,
  schemaExtractedAt: undefined,
  key: undefined,
  status: undefined,
  modelName: undefined,
}

// store
let storeQueryContent: string | undefined = undefined;
let storeQueryError: string | undefined = undefined;
let storeDatabaseSelected: number | undefined = undefined;

// others
let version: [number, number] = [50, 13]
let previousQueryContents: string[] = [];
let isQueryEditRunning: boolean = false;
let isDatabaseErrorRunning: boolean = false;
let isDatabasesSchemaExtractionRunning: boolean = false;


////////////// metabase redux store state's variables and listener //////////////
  

// Function to set a listener for store updates
function setStoreListener(): void {
  // Inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('dist/injectedScriptStoreUpdates.js');
  document.head?.appendChild(injectedScriptStoreUpdates);

  // Listen for messages from the script about updates of the store states
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window || !event.data.type) {
      return;
    }
    if (event.data.type === 'METABASE_CHATGPT_QUERY_CONTENT_STATE') {
      storeQueryContent = event.data.payload;
    }
    if (event.data.type === 'METABASE_CHATGPT_QUERY_ERROR_STATE') {
      storeQueryError = event.data.payload;
    }
    if (event.data.type === 'METABASE_CHATGPT_DATABASE_SELECTED_STATE') {
      storeDatabaseSelected = event.data.payload;
    }
  });
}


////////////// databases schema things //////////////


function onClickUpdateDatabasesSchema(): void {
  // Launch the gif animation and call updateEmbeddings
  if (isDatabasesSchemaExtractionRunning) {
    return;
  }
  isDatabasesSchemaExtractionRunning = true;
  updateSchemaExtractionElement.setAttribute("animate", "true");
  updateDatabasesSchema().then(response => {
    updateSchemaExtractionElement.setAttribute("animate", "false");
    updateSchemaExtractionElement.setAttribute("schema_extracted_at", configDict.schemaExtractedAt);
    isDatabasesSchemaExtractionRunning = false;
  });
}

async function updateDatabasesSchema(): Promise<void> {
  console.log("Retrieving the database structure through the Metabase API, this can take a while");
  const schema: databasesSchema = await extractDatabaseSchema();
  configDict.schema = schema;
  configDict.schemaExtractedAt = new Date().toLocaleDateString("ja-JP");
  chrome.storage.local.set({ 'metabase_chatgpt': configDict });
}


////////////// insert elements + add listeners to buttons //////////////


function setupElements() {

  function onElementAddedOrRemoved() {
    setupQueryEditingElements()
    setupErrorExplanationElements()
  }

  function setupQueryEditingElements() {
    const editorOpenedElement = getEditorOpenedElement(version);
    var existingUpdateQueryContainerElement = document.getElementById(getComponentIdFromVariable({updateQueryContainerElement}))
    if (!existingUpdateQueryContainerElement && !editorOpenedElement) {
      return
    }
    if (existingUpdateQueryContainerElement && editorOpenedElement) {
      return
    }
    if (existingUpdateQueryContainerElement && !editorOpenedElement) {
      existingUpdateQueryContainerElement.remove();
      return
    }
    if (!existingUpdateQueryContainerElement && editorOpenedElement) {
      const editorTopBar = getEditorTopBar(version)
      updateQueryContainerElement.appendChild(revertQueryButtonElement);
      updateQueryContainerElement.appendChild(promptQueryButtonElement);
      updateQueryContainerElement.appendChild(updateSchemaExtractionElement);
      editorTopBar.insertBefore(updateQueryContainerElement, editorTopBar.firstChild);
      updateSchemaExtractionElement.setAttribute("schema_extracted_at", configDict?.schemaExtractedAt);
    }
  }

  function setupErrorExplanationElements() {
    const errorWarningElement = getErrorWarningElement(version);
    var existingDatabaseErrorButtonElement = document.getElementById(getComponentIdFromVariable({databaseErrorButtonElement}));
    if (!errorWarningElement && !existingDatabaseErrorButtonElement) {
      return
    }
    if (errorWarningElement && existingDatabaseErrorButtonElement) {
      return
    }
    if (!errorWarningElement && existingDatabaseErrorButtonElement) {
      existingDatabaseErrorButtonElement.remove();
      const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}));
      if (existingdatabaseErrorPopupElement) {
        existingdatabaseErrorPopupElement.remove()
      }
      return
    }
    if (errorWarningElement && !existingDatabaseErrorButtonElement) {
      const visualizationRootElement = getVisualizationRootElement(version);
      visualizationRootElement.appendChild(databaseErrorButtonElement);
    }
  }

  // Add the listeners to the elements
  promptQueryButtonElement.addEventListener('click', function(event) {
    mainPromptQuery()
  });
  updateSchemaExtractionElement.addEventListener('click', function(event) {
    onClickUpdateDatabasesSchema()
  })
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


////////////// Query-edition functions //////////////


function mainPromptQuery() {

  if (isQueryEditRunning || isDatabasesSchemaExtractionRunning) {
    return
  }
  
  const queryEditorTextarea = getQueryEditorTextarea(version);

  // Add promptQueryPopupElement to DOM with an event listener on pressing Enter
  promptQueryButtonElement.appendChild(promptQueryPopupElement);
  promptQueryPopupElement.focus();
  promptQueryPopupElement.addEventListener('keypress', onPressEnterInsideElement);
  function onPressEnterInsideElement(event: KeyboardEvent) : void {
    if (event.key === 'Enter' && !event.shiftKey && !isQueryEditRunning) {
      isQueryEditRunning = true;
      event.preventDefault();
      previousQueryContents.push(storeQueryContent);
      document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block";
      deleteTextInputElement(queryEditorTextarea, storeQueryContent);
      const promptMessages = createPromptQueryMessages(storeQueryContent, promptQueryPopupElement.value, configDict.schema[storeDatabaseSelected]);
      chatgptStreamRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
      cleanupPopup();
    }
  };

  // Add event listener for clicks outside of promptQueryPopupElement
  document.addEventListener('click', onClickOutsideElement);
  function onClickOutsideElement(event: KeyboardEvent) : void {
    if (
      promptQueryButtonElement.contains(promptQueryPopupElement as Node)
      && (!promptQueryPopupElement.contains(event.target as Node))
      && (!promptQueryButtonElement.contains(event.target as Node))
    ) {
      cleanupPopup();
    }
  }

  // remove the popup from the DOM and remove the listeners
  function cleanupPopup() : void {
    promptQueryPopupElement.value = '';
    promptQueryPopupElement.remove();
    promptQueryPopupElement.removeEventListener('keypress', onPressEnterInsideElement);
    document.removeEventListener('click', onClickOutsideElement);
  }

  function onApiResponseData(content: string, isFinished: boolean) : void {
    isQueryEditRunning = !isFinished
    pasteTextIntoElement(queryEditorTextarea, content)
  }

  function onApiRequestError(errorReason: string, errorMessage: string) : void {
    const variableMessage = buildErrorMessageDisplay(errorReason, errorMessage)
    const errorMessageToInsert = `/*\n${variableMessage}\n*/`
    onApiResponseData(errorMessageToInsert, true);
  }

}


function mainRevertQuery() {
  if (isQueryEditRunning || isDatabasesSchemaExtractionRunning || previousQueryContents.length === 0) {
    return
  }
  const queryEditorTextarea = getQueryEditorTextarea(version);
  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  pasteTextIntoElement(queryEditorTextarea, previousQueryContents.pop())
  if (previousQueryContents.length === 0) {
    document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "none"
  }
}


////////////// Database error function //////////////


function mainDatabaseError() : void {

  function onApiRequestError(errorReason: string, errorMessage: string) : void {
    const variableErrorMessage = buildErrorMessageDisplay(errorReason, errorMessage);
    onApiResponseData(variableErrorMessage, true);
  }
  
  function onApiResponseData(content: string, isFinished: boolean) : void {
    const previousContent = databaseErrorPopupElement.getAttribute("error-message");
    databaseErrorPopupElement.setAttribute("error-message", previousContent+content);
    if (isFinished) {
      isDatabaseErrorRunning = false;
    }
  }

  if (isDatabaseErrorRunning) {
    return;
  }
  isDatabaseErrorRunning = true;

  databaseErrorPopupElement.setAttribute("error-message", "");
  if (!document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))) {
    const visualizationRootElement = getVisualizationRootElement(version);
    visualizationRootElement.appendChild(databaseErrorPopupElement);
  }

  const promptMessages = createDatabaseErrorMessages(
    storeQueryContent,
    storeQueryError,
    configDict.schema[storeDatabaseSelected]
  );
  chatgptStreamRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
}


////////////// main //////////////


function main() {
  getMetabaseVersion().then(response => {
    version = response;
  })
  chrome.storage.local.get('metabase_chatgpt', function(result) {
    if (result.metabase_chatgpt) {
      configDict = result.metabase_chatgpt;
    }
    setStoreListener();
    setupElements();
    console.log('result.metabase_chatgpt', result.metabase_chatgpt)
    if (!result.metabase_chatgpt?.schema){
      onClickUpdateDatabasesSchema();
    }
  });
}

main()
