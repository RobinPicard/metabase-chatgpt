import './popup.css';
import linkIcon from '../../assets/linkIcon.png'
import icon512 from '../../assets/icon512.png'


document.addEventListener('DOMContentLoaded', function() {

  var api = {};
  var errorMessage = ""

  var apiInputElement = document.getElementById('api-input');
  var submitButtonElement = document.getElementById('submit-button');
  var statusValueElement = document.getElementById('status-value');
  var errorMessageElement = document.getElementById('error-message');
  var linkImageElement = document.getElementById('api-key-link-img');
  var headerIconElement = document.getElementById('header-icon-img');
  var modelElements = document.getElementsByClassName('model-button')

  linkImageElement.src = linkIcon
  headerIconElement.src = icon512

  // Retrieve the previously saved API key, status and model name from the Chrome storage
  chrome.storage.sync.get('metabase_chatgpt_api', function(result) {
    if (result.metabase_chatgpt_api) {
      api = result.metabase_chatgpt_api
    }
    updateModelDisplay()
    updateApiStatusDisplay()
  });

  // Highlight the model that is currently selected
  function updateModelDisplay() {
    var currentModel = 'gpt-3.5-turbo'
    if (api && api.modelName === 'gpt-4') {
      currentModel = 'gpt-4'
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

  // Display a message corresponding to the status of the current api key
  function updateApiStatusDisplay() {
    if (Object.keys(api).length === 0 || api.status === "error") {
      statusValueElement.innerHTML = "Missing API key"
      statusValueElement.style.backgroundColor = "#EDEDED"
      apiInputElement.placeholder = "Enter your API key"
    } else if (api.status === "invalid") {
      statusValueElement.innerHTML = "Invalid API key"
      statusValueElement.style.backgroundColor = "#FFBBBB"
      apiInputElement.placeholder = `${api.key.slice(0, 4)}...${api.key.slice(-3)}`
    } else if (api.status === "valid") {
      statusValueElement.innerHTML = "Valid API key"
      statusValueElement.style.backgroundColor = "#CAFFAA"
      apiInputElement.placeholder = `${api.key.slice(0, 4)}...${api.key.slice(-3)}`
    }
    errorMessageElement.innerHTML = errorMessage
  }

  // For each model name element, add a listener that updates the api dict with the model selected + triggers updateModelDisplay
  Array.from(modelElements).forEach(element => {
    element.addEventListener('click', function() {
      api = {
        ...api,
        modelName: element.id
      }
      updateModelDisplay()
      chrome.storage.sync.set({'metabase_chatgpt_api': api })
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

  // Check the validity of the provided api key and then update the api dict + call updateApiStatusDisplay
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
        api = {
          ...api,
          status: "invalid",
          key: apiToken
        }
        errorMessage = data.error.message
      } else if (data?.choices && data?.choices[0]?.message?.content) {
        api = {
          ...api,
          status: "valid",
          key: apiToken
        }
        errorMessage = ""
      } else {
        api = {
          ...api,
          status: "error",
          key: null
        }
        errorMessage = "Unknown error, sorry"
      }
      updateApiStatusDisplay()
      chrome.storage.sync.set({'metabase_chatgpt_api': api })
    })
    .catch(error => {
      errorMessage = "Something went wrong sorry, could not make the API request"
      updateApiStatusDisplay()
    });
  }

});
