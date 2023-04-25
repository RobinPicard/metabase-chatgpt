# Metabase-chatgpt

## Introduction

Metabase-chatgpt is a Google Chrome extension allowing users to benefit from Openai's chatgpt within Metabase. Thus, the use of this extension requires having a credited Openai account as you'll need to provide an api key. On that topic, the extension stores the user's api key in Chrome's storage. Make sure that you're fine with that security-wise before starting to use Metabase-chatgpt. All featurs offered by Metabase-chatgpt are made for the native query editor page of Metabase.

## Features

Metabase-chatgpt currently has 3 main features (more will be added in the future hopefully):
- query prompt: allows the user to enter a prompt for a SQL query creation/edition within the editor as a comment (1st click on the associated button insert the SQL comment in which to enter the prompt, 2nd does the actual request to the api with the prompt)
- query reformatting: asks chatgpt to reformat the SQL query to follow best practices
- database error explanation: asks chatgpt to give the most likely explanation for the error considering the query that was run and the error returned. If the database error include a character position at which there's an error, the extension will provide the line on which there is this error (without using chatgpt)

## Installation and Use

Download the extension in the Chrome webstore: *insert url*
Click on the extension's icon on top of your browser's window (on the right of the url bar). Then it will open the extension's popup in which you'll be asked to provide your api key. As mentioned previously, this api key will be stored in the Chrome storage.
After having provided a valid api key, you'll be able to use the extension's features described above in the native query editor pages of Metabase.

## Development

After having cloned the repository, you'll need to package it before being able to load it as an unpacked extension in Chrome. This step is necessary as the extension relies on webpack and the manifest.json points toward files located in the dist/ folder (ignored by git).

Start by installing the dependencies by running `npm install`
Then, you create the distribution with `npm run build`

This latest step will create the dist/ folder with the files that will be executed in Chrome. When uploading the extension to Chrome in development mode, just select the whole repo.

The organization of the files is the following:
- `background.js` runs continuously and is in charge of calling content.js when a page whose url follows the pattern of a Metabase question page
- `content.js` is the main file that interacts with Metabase's pages
- `popup.html` is the settings popup of the extension in which the user can enter their api key

## Contribution

Contributions are very much welcomed! To contribute:
1. Fork the repository
2. Create a new branch with a descriptive name
3. Make your changes and commit them with a meaningful commit message
4. Submit a pull request and provide a clear description of your changes

