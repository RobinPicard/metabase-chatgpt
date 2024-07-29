// add dbt exclusion

import { dump } from 'js-yaml';

interface Database {
  id: number;
  engine: string;
  is_saved_questions: boolean;
  name: string;
  tables: DatabaseTable[];
}

interface DatabaseTable {
  id: number;
  active: boolean;
}

interface TableResponse {
  id: number;
  description?: string;
  name: string;
  schema: string;
  fields: ColumnResponse[];
}

interface ColumnResponse {
  id: number;
  active: boolean;
  description?: string;
  name: string;
  target?: {
    table_id: number;
    id: number;
  };
  database_type: string;
}

interface FormattedColumn {
  description?: string;
  name: string;
  fk_table_id?: number;
  fk_column_id?: number;
  type: string;
  foreign_key_target?: string | null;
}

interface FormattedTable {
  description?: string;
  name: string;
  schema: string;
  columns: { [key: number]: FormattedColumn };
}

interface Schema {
  [key: number]: {
    engine: string;
    tables: string;
  };
}

async function apiGetRequest(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
}

async function extractDatabaseSchema(): Promise<Schema> {
  const schema: Schema = {};
  try {
    const databasesResponse = await apiGetRequest('/api/database?saved=true&include=tables');

    for (const database of databasesResponse.data as Database[]) {
      if (database.is_saved_questions || database.name === "Saved Questions") {
        continue;
      }

      const tables = await getTables(database.tables);
      if (tables) {
        const filteredTables = removeDbtDevTables(tables)
        const formattedTables = replaceIdsWithNames(filteredTables);
        const yamlStrTables = dump(formattedTables, {indent: 2, lineWidth: -1, noRefs: true});
        schema[database.id] = {
          engine: database.engine,
          tables: yamlStrTables
        };
      }
    }
  } catch (error) {
    console.error('Error extracting database schema:', error);
  }
  return schema;
}

async function getTables(databaseTables: DatabaseTable[]): Promise<{ [key: number]: FormattedTable } | null> {
  const tables: { [key: number]: FormattedTable } = {};
  for (const databaseTable of databaseTables) {
    if (!databaseTable.active) continue;
    
    try {
      const tableResponse: TableResponse = await apiGetRequest(`/api/table/${databaseTable.id}/query_metadata`);
      const columns = tableResponse.fields.reduce((acc: { [key: number]: FormattedColumn }, columnResponse) => {
        if (columnResponse.active) {
          acc[columnResponse.id] = formatColumn(columnResponse);
        }
        return acc;
      }, {});

      tables[tableResponse.id] = { ...formatTable(tableResponse), columns };
    } catch (error) {
      console.error(`Error fetching table metadata for table ${databaseTable.id}:`, error);
    }
  }

  // Add foreign key information
  Object.values(tables).forEach(table => {
    Object.values(table.columns).forEach(column => {
      if (column.fk_column_id) {
        column.foreign_key_target = findFkTargetName(tables, column.fk_table_id, column.fk_column_id);
      }
    });
  });

  return tables;
}

function formatColumn(column: ColumnResponse): FormattedColumn {
  return {
    description: column.description,
    name: column.name,
    fk_table_id: column.target?.table_id,
    fk_column_id: column.target?.id,
    type: column.target?.id ? 'FOREIGN_KEY' : column.database_type,
  };
}

function formatTable(table: TableResponse): Omit<FormattedTable, 'columns'> {
  return {
    description: table.description,
    name: table.name,
    schema: table.schema,
  };
}

function findFkTargetName(tables: { [key: number]: FormattedTable }, fk_table_id?: number, fk_column_id?: number): string | null {
  if (!fk_table_id || !fk_column_id) return null;
  const fkTable = tables[fk_table_id];
  const fkColumn = fkTable?.columns[fk_column_id];
  return fkTable && fkColumn ? `${fkTable.schema}.${fkTable.name}.${fkColumn.name}` : null;
}

function removeDbtDevTables(tables: { [key: number]: FormattedTable }): { [key: number]: any } {
  const hasDbtProduction = Object.values(tables).some(table => table.schema === 'dbt_production');
  if (hasDbtProduction) {
    for (const key in tables) {
      if (tables[key].schema.startsWith('dbt_') && tables[key].schema !== 'dbt_production') {
        delete tables[key];
      }
    }
  }
  return tables;
}

function replaceIdsWithNames(tables: { [key: number]: FormattedTable }): { [key: string]: any } {
  return Object.values(tables).reduce((acc: { [key: string]: any }, table) => {
    const tableKey = `${table.schema}.${table.name}`;
    acc[tableKey] = {
      ...(table.description && { description: table.description }),
      columns: Object.values(table.columns).reduce((columnAcc: { [key: string]: any }, column) => {
        if (column.name) {
          columnAcc[column.name] = {
            ...(column.description && { description: column.description }),
            ...(column.type && { type: column.type }),
            ...(column.foreign_key_target && { foreign_key_target: column.foreign_key_target }),
          };
        }
        return columnAcc;
      }, {})
    };
    return acc;
  }, {});
}

export default extractDatabaseSchema;