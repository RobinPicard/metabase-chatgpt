function chatgptStreamRequest(configDict, promptMessages, streamContentCallback, errorCallback) {

  function apiError(configDict, errorMessage) {
    // if there was an api key, set the status to invalid
    if (configDict && configDict.key) {
      chrome.storage.local.set({
        metabase_chatgpt_api: {
          ...configDict,
          status: "invalid",
        }
      })
    }
    if (configDict && configDict.key) {
      errorCallback("invalid_api_key", errorMessage)
    } else {
      errorCallback("no_api_key", errorMessage)
    }
  }

  async function postRequest(configDict, promptMessages) {
    // make the api request and read the reponse stream

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configDict.key}`
      },
      body: JSON.stringify({
        "model": configDict.modelName,
        "messages": promptMessages,
        "temperature": 0,
        "stream": true,
      })
    })

    // in case of error, stop there and call apiError
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message
      apiError(configDict, errorMessage)
      return;
    }
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const dataRegex = /data: ({.*?})(?=\n|$)/g;

    function readStream() {
      return reader.read().then(({ done, value }) => {
        // after the end of the content, an extra message is sent with done=true
        if (done) {
          streamContentCallback("", true)
          return
        }
        const streamData = decoder.decode(value)
        // in case of error stop there
        if (streamData.error) {          
          return
        }
        // parse the response and call streamContentCallback with the content
        let match;
        while ((match = dataRegex.exec(streamData)) !== null) {
          const content = JSON.parse(match[1]).choices[0].delta.content
          if (content) {
            streamContentCallback(content, false)
          }
        }
        // call itself again to read the next message
        return readStream();
      })
    }

    await readStream();
  }

  postRequest(configDict, promptMessages, streamContentCallback)

}
  
export default chatgptStreamRequest
