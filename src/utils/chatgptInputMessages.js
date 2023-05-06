export function createFormatQueryMessages(initialQuery) {
  const systemMessage = (
    "You will receive a SQL query as an input. " +
    "Reformat the query with sqlfluff best practices (4-space indentation, line breaks after SELECT/FROM/WHERE blocks, one column per line for SELECT, commmands in uppercase). " +
    "Respond with only the updated query"
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
  ]
}

export function createPromptQueryMessages(initialQuery, promptMessage) {
  const systemMessage = (
    "You will receive 2 messages. " +
    "The 1st one will contain a SQL query (or will be empty). " +
    "The 2nd one will contain instructions on how to modify the query (or create it if the previous message was empty). " +
    "Respond with only the updated/new query"
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
    {"role": "user", "content": promptMessage},
  ]
}

export function createDatabaseErrorMessages(initialQuery, errorMessage) {
  const systemMessage = (
    "You will receive 2 messages. " +
    "The 1st one will contain a SQL query. " +
    "The 2nd one will contain an error message returned by the database. " +
    "Give the most likely explanation for the origin of the error"
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
    {"role": "user", "content": errorMessage},
  ]
}
