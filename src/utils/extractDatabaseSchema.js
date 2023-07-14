async function extractDatabaseSchema() {

  const databasesResponse = await apiGetRequest('/api/database?saved=true&include=tables')
  if (databasesResponse === undefined) {
    return
  }

  let result = {}

  for (const database of databasesResponse.data) {
    const tables = await getTables(database.tables)
    result[database.id] = tables
  }

  return result
}

async function apiGetRequest(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    return undefined;
  }
}

async function getTables(databaseTables) {
  let tables = []

  for (const table of databaseTables) {
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

  return tables.map(table => formatTableOutput(table))
}

function findFieldNameFromId(tables, id) {
  for (const table of tables) {
    for (const field of table.fields) {
      if (field.id === id) {
        return `${table.name}.${field.name}`
      }
    }
  }
}

function formatField(field) {
  return {
    id: field.id,
    description: field.description,
    name: field.name,
    table_id: field.table_id,
    fk_target_field_id: field.fk_target_field_id
  }
}

function formatTable(table, fields) {
  return {
    id: table.id,
    description: table.description,
    name: table.name,
    schema: table.schema,
    fields: fields
  }
}

function formatTableOutput(table) {
  const fields = table.fields.map(field => `${field.name}${field.description ? ", " + field.description : ""}${field.fk_target_field_id ? ", foreign key to " + field.fk_target_field_id : ""}`)
  return {
    short: `${table.schema}.${table.name}`,
    long: `${table.name}${table.description ? ": " + table.description : ""}, columns: ${fields.join(" ; ")}`
  }
}

export default extractDatabaseSchema
