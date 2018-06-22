import { GraphQLServer } from 'graphql-yoga'
import QueryRoot from './graphqlSchemaBuilder'
import { GraphQLSchema, printSchema } from "graphql";
import * as fs from 'fs'

let graphQLSchema = new GraphQLSchema({
  query: QueryRoot
});

const fileData = printSchema(graphQLSchema);

fs.writeFile(__dirname + '/schema.graphql', fileData, error => console.error(error));

let typesUsed = Object.values(graphQLSchema.getTypeMap())
console.log(typesUsed)
// const result = generate
const server = new GraphQLServer({
  schema: graphQLSchema,
})
server.start(() => console.log('Server is running on localhost:4000'))
