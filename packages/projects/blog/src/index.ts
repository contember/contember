import { GraphQLServer } from 'graphql-yoga'
import buildGraphQlSchema from './graphQLSchema/graphqlSchemaBuilder'
import { printSchema } from "graphql"
import * as fs from 'fs'
import buildSql from "./sqlSchema/sqlSchemaBuilder"
import model from "./model"
import * as knex from 'knex'

let graphQLSchema = buildGraphQlSchema(model)

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

const connection = knex({
  debug: true,
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 65432,
    user: 'cms',
    password: '123',
    database: 'cms',
  }
})

// const result = generate
const server = new GraphQLServer({
  schema: graphQLSchema,
  context: {
    db: connection,
  }

})
server.start(() => console.log('Server is running on localhost:4000'))
