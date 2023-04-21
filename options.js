document.addEventListener('DOMContentLoaded', function() {

  var form = document.getElementById('options-form');
  var message = document.getElementById('message');

  // Retrieve the previously saved API key value from the Chrome storage
  chrome.storage.sync.get('metabase_chatgpt_api_key', function(result) {
    console.log('HERE')
    console.log(result)
    if (result.metabase_chatgpt_api_key) {
      message.textContent = 'You already have an API key saved.';
    }
  });

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    var apiKey = document.getElementById('api-key').value;
    chrome.storage.sync.set({'metabase_chatgpt_api_key': apiKey }, function() {
      console.log('API key saved successfully');
    });
  });
});
  