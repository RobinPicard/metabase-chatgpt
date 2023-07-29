async function extractDatabaseSchema() {

  let result = {}

  const databasesResponse = await apiGetRequest('/api/database?saved=true&include=tables')

  for (const database of databasesResponse.data) {
    const tables = await getTables(database.tables);
    result[database.id] = tables;
  }

  // remove empty db if there's any
  Object.keys(result).forEach((key) => {
    if (Array.isArray(result[key]) && result[key].length === 0) {
        delete result[key];
    }
});

  return result
}

async function apiGetRequest(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// provided a list of tables, return this same list but formatted to be used for our embeddings
async function getTables(databaseTables) {
  let tables = []

  for (const table of databaseTables) {
    // skip saved questions
    if (/^card__/.test(table.id)) {
      continue;
    }
    const tableResponse = await apiGetRequest(`/api/table/${table.id}/query_metadata`)
    const fields = tableResponse.fields.filter(field => field.active).map(field => formatField(field))
    tables.push(formatTable(table, fields))
  }

  for (const table of tables) {
    for (const field of table.fields) {
      if (field.fk_target_field_id) {
        field.fk_target_field_id = findFieldNameFromId(tables, field.fk_target_field_id)
      }
    }
  }

  return tables.map(table => formatOutput(table))
}

// return the name of a field given its id
function findFieldNameFromId(tables, id) {
  for (const table of tables) {
    for (const field of table.fields) {
      if (field.id === id) {
        return `${table.name}.${field.name}`
      }
    }
  }
}

// select the relevant keys for a field
function formatField(field) {
  return {
    id: field.id,
    description: field.description,
    name: field.name,
    table_id: field.table_id,
    fk_target_field_id: field.fk_target_field_id
  }
}

// select the relevant keys for a table
function formatTable(table, fields) {
  return {
    id: table.id,
    description: table.description,
    name: table.name,
    schema: table.schema,
    fields: fields
  }
}

// given a table with its fields, return formatted sentences to be used in api requests
function formatOutput(table) {
  const fields = table.fields.map(field => `${field.name}${field.description ? ", " + field.description : ""}${field.fk_target_field_id ? ", foreign key to " + field.fk_target_field_id : ""}`)
  return {
    short: `${table.schema}.${table.name}${table.description ? ": " + table.description : ""}`,
    long: `${table.schema}.${table.name}${table.description ? ": " + table.description : ""}, columns: ${fields.join(" ; ")}`
  }
}

export default extractDatabaseSchema
