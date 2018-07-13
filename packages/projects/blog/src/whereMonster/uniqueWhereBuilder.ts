import { escapeParameter, quoteIdentifier } from "../sql/utils";
import { getColumnName } from "../schema/modelUtils";
import { UniqueWhere } from "../schema/input";
import { Entity, Schema } from "../schema/model";

const buildUniqueWhere = (schema: Schema, entity: Entity) => (tableName: string, where: UniqueWhere) => {
  const parts = []
  for (let field in where) {
    const columnName = getColumnName(schema, entity, field)
    parts.push(`${tableName}.${quoteIdentifier(columnName)} = ${escapeParameter(where[field])}`)
  }
  return parts.join(' AND ')
}

export default buildUniqueWhere
