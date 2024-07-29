# Metabase - chatGPT

## Introduction

Metabase-ChatGPT is a Google Chrome extension allowing users to benefit from Openai's ChatGPT within Metabase. Thus, the use of this extension requires having a credited Openai account as you'll need to provide an api key. On that topic, the extension stores the user's api key in Chrome's storage. Make sure that you're fine with that security-wise before starting to use Metabase - chatGPT. All featurs offered by Metabase-ChatGPT are made for the native query editor page of Metabase.

## Features

Metabase-ChatGPT has 2 main features:
- query prompt: allows the user to enter a prompt for a SQL query creation/edition
- database error explanation: asks chatGPT to give the most likely explanation for the error considering the query that was run and the error returned

## Installation and Use

Download the extension in the Chrome webstore: https://chrome.google.com/webstore/detail/metabase-chatgpt/kkkpnhdoamjghmnjpailmpndjlegkmnh

Click on the extension's icon on top of your browser's window (on the right of the url bar). Then it will open the extension's popup in which you'll be presented with the settings. There, you must provide your api key. Upon submitting it, a test request will be made to Openai to check its validity. 

Then, go to the Metabase native query editor and wait for the database schema extraction to finish running (the circular arrows gif)

Finally, you can go back to the extension's popup, see the cost estimation for the 2 models proposed; gpt-4o and gpt-4o-mini and choose which one you want to use.

## Development

After having cloned the repository, you'll need to package it before being able to load it as an unpacked extension in Chrome. This step is necessary as the extension relies on webpack and the manifest.json points toward files located in the dist/ folder (ignored by git).

Start by installing the dependencies by running `npm install`
Then, you create the distribution with `npm run build`

This latest step will create the dist/ folder with the files that will be executed in Chrome. When uploading the extension to Chrome in development mode, just select the whole repo.

The organization of the files is the following:
- `background.ts` runs continuously and is in charge of injecting content.js when a page whose url follows the pattern of a Metabase question page
- `content.ts` is the main file that interacts with Metabase's pages
- `popup.html` is the settings popup of the extension in which the user can enter their api key

## Contribution

Contributions are very much welcomed! To contribute:
1. Fork the repository
2. Create a new branch with a descriptive name
3. Make your changes and commit them with a meaningful commit message
4. Submit a pull request and provide a clear description of your changes
