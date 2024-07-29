interface databaseSchema {
  engine: string;
  tables: string;
};

export function createPromptQueryMessages(initialQuery: string, promptMessage: string, databaseSchema: databaseSchema) : Array<Object> {
  var systemMessage = (
    "You are SQL writing assistant. Your objective is to write a SQL to answer the question of the user. "
    + "You should respond only with a SQL query, without any additional text message or comment. "
    + "Do not start your response with ```sql, it should be able to run in an SQL engine without any parsing. "
    + `You will receive ${initialQuery ? '3' : '2'} messages:\n`
    + "- A yaml representation of the database of the user.\n"
    + `${initialQuery ? '- The existing SQL query the user already has if they are not starting from scratch.\n' : ''}`
    + "- The question from the user to which you must answer with a SQL query.\n"
    + `Write the SQL query such that it can be executed by a ${databaseSchema.engine} engine.`
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": databaseSchema.tables.slice(0, 440000)}, // make sure not to exceed context window
    ...(initialQuery ? [{"role": "user", "content": initialQuery}] : []),
    {"role": "user", "content": promptMessage},
  ]
}

export function createDatabaseErrorMessages(initialQuery: string, errorMessage: string, databaseSchema: databaseSchema) : Array<Object> {
  var systemMessage = (
    "You are SQL assistant. The user's query caused an error. Your objective is to explain what's wrong with their query. "
    + "You will receive 3 messages.\n"
    + "- A yaml representation of the database of the user.\n"
    + "- The SQL query of the user. "
    + `- The error message returned by the database (it uses a ${databaseSchema.engine} engine).\n`
    + "Give the most likely explanation for the origin of the error. "
    + "Do your best to be short (no more than 400 characters, ideally 250), go straight to the point."
    + "If possible, tell the user that they would need to change to fix the problem."
  )
  return [
    {"role": "system", "content": systemMessage},
    {"role": "user", "content": databaseSchema.tables},
    {"role": "user", "content": initialQuery},
    {"role": "user", "content": errorMessage},
  ]
}
