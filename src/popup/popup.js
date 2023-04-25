import './popup.css';
import linkIcon from '../../assets/linkIcon.png'
import icon128 from '../../assets/icon128.png'


document.addEventListener('DOMContentLoaded', function() {

  var api = {};
  var errorMessage = ""

  var apiInputElement = document.getElementById('api-input');
  var submitButtonElement = document.getElementById('submit-button');
  var statusValueElement = document.getElementById('status-value');
  var errorMessageElement = document.getElementById('error-message');
  var linkImageElement = document.getElementById('api-key-link-img');
  var headerIconElement = document.getElementById('header-icon-img');

  linkImageElement.src = linkIcon
  headerIconElement.src = icon128

  // Retrieve the previously saved API key and status from the Chrome storage
  chrome.storage.sync.get('metabase_chatgpt_api', function(result) {
    if (result.metabase_chatgpt_api) {
      api = result.metabase_chatgpt_api
    }
    updateApiStatusDisplay()
  });

  function updateApiStatusDisplay() {
    if (Object.keys(api).length === 0) {
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

  submitButtonElement.addEventListener('click', function(event) {
    event.preventDefault();
    if (apiInputElement.value === "") {
      return
    };
    testApiToken(apiInputElement.value)
  });

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
          status: "invalid",
          key: apiToken
        }
        errorMessage = data.error.message
      } else if (data?.choices && data?.choices[0]?.message?.content) {
        api = {
          status: "valid",
          key: apiToken
        }
        errorMessage = ""
      } else {
        api = {}
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