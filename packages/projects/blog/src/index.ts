import { GraphQLServer } from 'graphql-yoga'
import buildGraphQlSchema from './graphQLSchema/graphqlSchemaBuilder'
import { GraphQLSchema, printSchema } from "graphql"
import * as fs from 'fs'
import buildSql from "./sqlSchema/sqlSchemaBuilder"
import model from "./model"

let graphQLSchema = new GraphQLSchema({
  query: buildGraphQlSchema(model)
})

let builderClass = require('node-pg-migrate/dist/migration-builder').default
let migrationBuilder = new builderClass({}, {
  query: null,
  select: null,
})
buildSql(model, migrationBuilder)
const sql = (migrationBuilder as any).getSql()
fs.writeFile(__dirname + "/schema.sql", sql, error => console.error(error))

const fileData = printSchema(graphQLSchema)
fs.writeFile(__dirname + '/schema.graphql', fileData, error => console.error(error))

// const result = generate
const server = new GraphQLServer({
  schema: graphQLSchema,
})
server.start(() => console.log('Server is running on localhost:4000'))
