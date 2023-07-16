export function createFormatQueryMessages(initialQuery) {
  const systemMessage = (
    "You will receive a SQL query as an input. "
    + "Reformat the query with sqlfluff best practices (4-space indentation, line breaks after SELECT/FROM/WHERE blocks, one column per line for SELECT, commmands in uppercase). "
    + "Under no circumstances should you respond with anything else than a raw SQL query. "
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
  ]
}

export function createPromptQueryMessages(initialQuery, promptMessage, contextSentences=undefined) {
  var systemMessage = (
    "You will receive 2 messages. "
    + "The 1st one will contain a SQL query (or will be empty). "
    + "The 2nd one will contain instructions on how to modify the query (or create it if the previous message was empty). "
  )
  if (contextSentences) {
    const additionalContext = (
      + "To give you some context on the database, here are the descriptions of 3 tables in the db that were judged related to the prompt through sentence embedding. "
      + "They may not be useful to you. If they do not contain the necessary information, just ignore them and guess. "
      + "The descriptions follow the model: <table schema>.<table name>: <description (if exists)>, columns: [<field name>, <field description (if exists), foreign key to <table schema>.<table name>(if exists) ; ...]. "
      + "1) " + contextSentences[0] + " 2) " + contextSentences[1] + " 3) " + contextSentences[2] + ". "
    )
    systemMessage += additionalContext
  }
  systemMessage += "Always answer with a raw SQL query. Never answer you don't know, just guess something"
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
    {"role": "user", "content": promptMessage + "\n\n Remember, I only want a raw SQL query as a reponse: no comment, no explanation, no I'm sorry or I don't have enough info. Just write the most likely to work SQL query"},
  ]
}

export function createDatabaseErrorMessages(initialQuery, errorMessage, contextSentences=undefined) {
  var systemMessage = (
    "You will receive 2 messages. "
    + "The 1st one will contain a SQL query. "
    + "The 2nd one will contain an error message returned by the database. "
    + "Give the most likely explanation for the origin of the error. "
    + "Do your best to be short, go straight to the point. "
  )
  if (contextSentences) {
    const additionalContext = (
      + "To give you some context on the database, here are the description of 3 tables in the db that were judged related to the SQL query and the database error through sentence embedding. "
      + "They may not be useful to you. The description follow the model: <table schema>.<table name>: <description (if exists)>, columns: [<field name>, <field description (if exists), foreign key to <table schema>.<table name>(if exists) ; ...]. "
      + "1) " + contextSentences[0] + " 2) " + contextSentences[1] + " 3) " + contextSentences[2]
    )
    systemMessage += additionalContext
  } 
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": initialQuery},
    {"role": "user", "content": errorMessage},
  ]
}
