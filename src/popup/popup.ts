import './popup.css';
import icon512 from '../../assets/icon512.png';

interface databasesSchema {
  [key: number]: {
    engine: string;
    tables: string;
  };
};

interface ConfigDict {
  schema?: databasesSchema,
  schemaExtractedAt?: string,
  status?: 'error' | 'invalid' | 'valid';
  key?: string;
  modelName?: string;
}

const priceGpt4o = 5.0;
const priceGpt4oMini = 0.15;

document.addEventListener('DOMContentLoaded', function() {
  let configDict: ConfigDict = {};
  let errorMessage: string = "";

  const apiInputElement = document.getElementById('api-input') as HTMLInputElement;
  const submitButtonElement = document.getElementById('submit-button') as HTMLButtonElement;
  const statusValueElement = document.getElementById('status-value') as HTMLDivElement;
  const costEstimationElement = document.getElementById('cost-estimation-container') as HTMLDivElement;
  const errorMessageElement = document.getElementById('error-message') as HTMLDivElement;
  const headerIconElement = document.getElementById('header-icon-img') as HTMLImageElement;
  const modelElements = document.getElementsByClassName('model-button') as HTMLCollectionOf<HTMLButtonElement>;

  headerIconElement.src = icon512;

  // Chrome Storage to retrieve API key and other settings
  chrome.storage.local.get('metabase_chatgpt', function(result: {metabase_chatgpt?: ConfigDict}) {
    if (result.metabase_chatgpt) {
      configDict = result.metabase_chatgpt;
    }
    if (!configDict.modelName) {
      configDict.modelName = 'gpt-4o-mini';
    }
    updateModelDisplay();
    updateApiStatusDisplay();
    setCostEstimationDisplay();
  });

  function updateModelDisplay(): void {
    const currentModel = configDict.modelName || 'gpt-4o-mini';
    Array.from(modelElements).forEach((element: HTMLButtonElement) => {
      element.style.fontWeight = element.id === currentModel ? '600' : '400';
      element.style.borderBottom = element.id === currentModel ? '2px solid #E5106D' : '2px solid transparent';
    });
  }

  function updateApiStatusDisplay(): void {
    if (!configDict.status || configDict.status === "error") {
      statusValueElement.textContent = "Missing API key";
      statusValueElement.style.backgroundColor = "#EDEDED";
      apiInputElement.placeholder = "Enter your API key";
    } else if (configDict.status === "invalid") {
      statusValueElement.textContent = "Invalid API key";
      statusValueElement.style.backgroundColor = "#FFBBBB";
      apiInputElement.placeholder = `${configDict.key!.slice(0, 4)}...${configDict.key!.slice(-3)}`;
    } else if (configDict.status === "valid") {
      statusValueElement.textContent = "Valid API key";
      statusValueElement.style.backgroundColor = "#CAFFAA";
      apiInputElement.placeholder = `${configDict.key!.slice(0, 4)}...${configDict.key!.slice(-3)}`;
    }
    errorMessageElement.textContent = errorMessage;
  }

  function setCostEstimationDisplay(): void {
    if (!configDict.schema) {
      costEstimationElement.innerHTML = (
        "Average estimated cost per query cannot be computed until the database schema has been extracted. "
        + "Go to the native query editor of Metabase to launch database schema extraction."
      )
    } else {
      let numCharacters = 0;
      for (const databaseId in configDict.schema) {
        const tablesString = configDict.schema[databaseId].tables;
        if (tablesString.length > numCharacters) {
          numCharacters = tablesString.length;
        }
      }
      // 600 is a constant for the rest of the prompt and the answer (everything except the schema)
      const numTokens = Math.floor(numCharacters / 3) + 600;
      const gpt4oCost = Math.round(numTokens * priceGpt4o / 100) / 10000;
      const gpt4oMiniCost = Math.round(numTokens * priceGpt4oMini / 100) / 10000;
      costEstimationElement.innerHTML = (
        "Average estimated cost per query:"
        + `<ul><li>gpt-4o: $${gpt4oCost}</li><li>gpt-4o-mini: $${gpt4oMiniCost}</li></ul>`
      )
    }
  }

  Array.from(modelElements).forEach(element => {
    element.addEventListener('click', function() {
      configDict = {
        ...configDict,
        modelName: element.id
      };
      updateModelDisplay();
      chrome.storage.local.set({'metabase_chatgpt': configDict });
    });
  });

  submitButtonElement.addEventListener('click', function(event) {
    event.preventDefault();
    if (!apiInputElement.value) {
      return;
    }
    testApiToken(apiInputElement.value);
  });

  function testApiToken(apiToken: string): void {
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Test"}],
        "max_tokens": 3
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error?.message) {
        configDict = {
          ...configDict,
          status: "invalid",
          key: apiToken
        };
        errorMessage = data.error.message;
      } else if (data.choices && data.choices[0].message?.content) {
        configDict = {
          ...configDict,
          status: "valid",
          key: apiToken
        };
        errorMessage = "";
      } else {
        configDict = {
          ...configDict,
          status: "error",
          key: null
        };
        errorMessage = "Unknown error, sorry";
      }
      updateApiStatusDisplay();
      chrome.storage.local.set({'metabase_chatgpt': configDict });
    })
    .catch(error => {
      errorMessage = "Something went wrong, sorry, could not make the API request";
      updateApiStatusDisplay();
    });
  }
});
