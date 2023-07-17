import './popup.css';
import linkIcon from '../../assets/linkIcon.png'
import icon512 from '../../assets/icon512.png'


document.addEventListener('DOMContentLoaded', function() {

  var configDict = {};
  var errorMessage = "";

  var apiInputElement = document.getElementById('api-input');
  var submitButtonElement = document.getElementById('submit-button');
  var statusValueElement = document.getElementById('status-value');
  var errorMessageElement = document.getElementById('error-message');
  var linkImageElement = document.getElementById('api-key-link-img');
  var headerIconElement = document.getElementById('header-icon-img');
  var modelElements = document.getElementsByClassName('model-button');
  var embeddingsElements = document.getElementsByClassName('embeddings-button');

  linkImageElement.src = linkIcon
  headerIconElement.src = icon512

  // Retrieve the previously saved config data (API key, status, model name and embeddings status) from the Chrome storage + display accordingly
  chrome.storage.local.get('metabase_chatgpt_api', function(result) {
    if (result.metabase_chatgpt_api) {
      configDict = result.metabase_chatgpt_api;
    }
    if (configDict.modelName === undefined) {configDict.modelName = 'gpt-4'}
    if (configDict.embeddingsActive === undefined) {configDict.embeddingsActive = true}
    updateModelDisplay();
    udpateEmbeddingsDisplay();
    updateApiStatusDisplay();
  });

  // Highlight the model that is currently selected
  function updateModelDisplay() {
    var currentModel = 'gpt-4'
    if (configDict && configDict.modelName === 'gpt-3.5-turbo') {
      currentModel = 'gpt-3.5-turbo'
    }
    for(let i = 0; i < modelElements.length; i++) {
      if (modelElements[i].id === currentModel) {
        modelElements[i].style.fontWeight = '600'
        modelElements[i].style.borderBottom = '2px solid #E5106D'
      } else {
        modelElements[i].style.fontWeight = '400'
        modelElements[i].style.borderBottom = '2px solid transparent'     
      }
    }
  }

  // Highlight the embeddings option that is currently selected
  function udpateEmbeddingsDisplay() {
    var currentChoice = 'embeddings-yes'
    if (configDict && configDict.embeddingsActive === false) {
      currentChoice = 'embeddings-no'
    }
    for(let i = 0; i < embeddingsElements.length; i++) {
      if (embeddingsElements[i].id === currentChoice) {
        embeddingsElements[i].style.fontWeight = '600'
        embeddingsElements[i].style.borderBottom = '2px solid #E5106D'
      } else {
        embeddingsElements[i].style.fontWeight = '400'
        embeddingsElements[i].style.borderBottom = '2px solid transparent'     
      }
    }
  }

  // Display a message corresponding to the status of the current api key
  function updateApiStatusDisplay() {
    if (!configDict.status || configDict.status === "error") {
      statusValueElement.innerHTML = "Missing API key"
      statusValueElement.style.backgroundColor = "#EDEDED"
      apiInputElement.placeholder = "Enter your API key"
    } else if (configDict.status === "invalid") {
      statusValueElement.innerHTML = "Invalid API key"
      statusValueElement.style.backgroundColor = "#FFBBBB"
      apiInputElement.placeholder = `${configDict.key.slice(0, 4)}...${configDict.key.slice(-3)}`
    } else if (configDict.status === "valid") {
      statusValueElement.innerHTML = "Valid API key"
      statusValueElement.style.backgroundColor = "#CAFFAA"
      apiInputElement.placeholder = `${configDict.key.slice(0, 4)}...${configDict.key.slice(-3)}`
    }
    errorMessageElement.innerHTML = errorMessage
  }

  // For each model name element, add a listener that updates the config dict with the model selected + triggers updateModelDisplay
  Array.from(modelElements).forEach(element => {
    element.addEventListener('click', function() {
      configDict = {
        ...configDict,
        modelName: element.id
      }
      updateModelDisplay()
      chrome.storage.local.set({'metabase_chatgpt_api': configDict })
    });
  });

  // For each embeddings option element, add a listener that updates the config dict with the option selected + triggers udpateEmbeddingsDisplay
  Array.from(embeddingsElements).forEach(element => {
    element.addEventListener('click', function() {
      configDict = {
        ...configDict,
        embeddingsActive: element.id === "embeddings-yes" ? true : false
      }
      udpateEmbeddingsDisplay()
      chrome.storage.local.set({'metabase_chatgpt_api': configDict })
    });
  });

  // Add a listener to the submit button that triggers testApiToken to test whether the api key is valid
  submitButtonElement.addEventListener('click', function(event) {
    event.preventDefault();
    if (apiInputElement.value === "") {
      return
    };
    testApiToken(apiInputElement.value)
  });

  // Check the validity of the provided api key and then update the config dict + call updateApiStatusDisplay
  function testApiToken(apiToken) {
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Test"}],
        "max_tokens": 3
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data?.error?.message) {
        configDict = {
          ...configDict,
          status: "invalid",
          key: apiToken
        }
        errorMessage = data.error.message
      } else if (data?.choices && data?.choices[0]?.message?.content) {
        configDict = {
          ...configDict,
          status: "valid",
          key: apiToken
        }
        errorMessage = ""
      } else {
        configDict = {
          ...configDict,
          status: "error",
          key: null
        }
        errorMessage = "Unknown error, sorry"
      }
      updateApiStatusDisplay()
      chrome.storage.local.set({'metabase_chatgpt_api': configDict })
    })
    .catch(error => {
      errorMessage = "Something went wrong sorry, could not make the API request"
      updateApiStatusDisplay()
    });
  }

});
