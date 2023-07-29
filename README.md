# Metabase - chatGPT

## Introduction

Metabase - ChatGPT is a Google Chrome extension allowing users to benefit from Openai's chatGPT within Metabase. Thus, the use of this extension requires having a credited Openai account as you'll need to provide an api key. On that topic, the extension stores the user's api key in Chrome's storage. Make sure that you're fine with that security-wise before starting to use Metabase - chatGPT. All featurs offered by Metabase - chatGPT are made for the native query editor page of Metabase.

## Features

Metabase - chatGPT currently has 4 main features (more will be added in the future hopefully):
- query prompt: allows the user to enter a prompt for a SQL query creation/edition within the editor as a comment (1st click on the associated button insert the SQL comment in which to enter the prompt, 2nd does the actual request to the api with the prompt)
- query reformatting: asks chatGPT to reformat the SQL query to follow best practices
- database error explanation: asks chatGPT to give the most likely explanation for the error considering the query that was run and the error returned. If the database error include a character position at which there's an error, the extension will provide the line on which there is this error (without using chatGPT)
- error line highlight: for databases that provide the necessary information, highlight the line in the editor on which there's an error (does not rely on ChatGPT)

## Installation and Use

Download the extension in the Chrome webstore: https://chrome.google.com/webstore/detail/metabase-chatgpt/kkkpnhdoamjghmnjpailmpndjlegkmnh
Click on the extension's icon on top of your browser's window (on the right of the url bar). Then it will open the extension's popup in which you'll be presented with the settings. There, you must provide your api key. Upon submitting it, a test request will be made to Openai to check its validity. There are also 2 setting options you can interact with:
- model version: choose between gpt-3.5 and gpt-4. The former is faster and cheaper but the latter offers better performance. We recommend you use gpt-4 for more accurate answers
- whether to use database structure embedding. If you choose this option, a representation of the structure of your database will be stored in a set of vectors. When submitting a prompt, your prompt will be compared to the stored vectors to try to identify the most relevant tables for it. Information on those tables will be given to ChatGPT along with your prompt to provide it with context on your database, allowing it to make more accurate answers. The initial creation of the embedding vectors when first opening the query editor can take up to a few minutes if your database contains a lot of tables. Do not close your tab until the circular arrow icon gif has stopped turning. We recommend you turn on database structure embedding for more accurate answers


## Development

After having cloned the repository, you'll need to package it before being able to load it as an unpacked extension in Chrome. This step is necessary as the extension relies on webpack and the manifest.json points toward files located in the dist/ folder (ignored by git).

Start by installing the dependencies by running `npm install`
Then, you create the distribution with `npm run build`

This latest step will create the dist/ folder with the files that will be executed in Chrome. When uploading the extension to Chrome in development mode, just select the whole repo.

The organization of the files is the following:
- `background.js` runs continuously and is in charge of injecting content.js when a page whose url follows the pattern of a Metabase question page
- `content.js` is the main file that interacts with Metabase's pages
- `popup.html` is the settings popup of the extension in which the user can enter their api key

## Contribution

Contributions are very much welcomed! To contribute:
1. Fork the repository
2. Create a new branch with a descriptive name
3. Make your changes and commit them with a meaningful commit message
4. Submit a pull request and provide a clear description of your changes

