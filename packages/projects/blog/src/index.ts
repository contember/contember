import { GraphQLServer } from 'graphql-yoga'
import QueryRoot from './graphqlSchemaBuilder'
import { GraphQLSchema, printSchema } from "graphql";
import * as fs from 'fs'
import buildSql from "./sqlSchemaBuilder";
import model from "./model";

let graphQLSchema = new GraphQLSchema({
  query: QueryRoot
});

const fileData = printSchema(graphQLSchema);

let builderClass = require('node-pg-migrate/dist/migration-builder').default

let migrationBuilder = new builderClass({}, {
  query: null,
  select: null,
});
buildSql(model, migrationBuilder)
console.log((migrationBuilder as any).getSql())


fs.writeFile(__dirname + '/schemxa.graphql', fileData, error => console.error(error));

console.log(6)

// const result = generate
const server = new GraphQLServer({
  schema: graphQLSchema,
})
server.start(() => console.log('Server is running on localhost:4000'))
