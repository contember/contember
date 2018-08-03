import { Model } from "cms-common"
import buildSqlSchema from "./sqlSchemaBuilder";


const getSql = (schema: Model.Schema): string => {
  const builderClass = require("node-pg-migrate/dist/migration-builder")
  const migrationBuilder = new builderClass({}, {
    query: null,
    select: null,
  })
  buildSqlSchema(schema, migrationBuilder)
  return (migrationBuilder as any).getSql()
}

export default getSql
