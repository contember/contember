import { GraphQLServer } from 'graphql-yoga'
import GraphQlSchemaBuilder from './graphQLSchema/GraphQlSchemaBuilder'
import { printSchema } from "graphql"
import * as fs from 'fs'
import buildSql from "./sqlSchema/sqlSchemaBuilder"
import model from "./model"
import * as knex from 'knex'
import * as dotenv from 'dotenv'

dotenv.config()

const builder = new GraphQlSchemaBuilder(model)
let graphQLSchema = builder.build()

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
    host: process.env.DB_HOST as string,
    port: process.env.DB_PORT as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
  }
})

// const result = generate
const server = new GraphQLServer({
  schema: graphQLSchema,
  context: {
    db: connection,
  },

})
server.start({port: process.env.SERVER_PORT}, (options) => console.log(`Server is running on localhost:${options.port}`))
