import { Schema } from '../model'
import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import getQueries from "./queries";


const buildGraphQlSchema = (schema: Schema) => {

  type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

  const entityNames = Object.keys(schema.entities)

  const queries = entityNames.reduce<{ [queryName: string]: FieldConfig }>((queries, entityName) => {
    return {
      ...getQueries(schema)(entityName),
      ...queries,
    }
  }, {})

  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      version: {
        type: GraphQLString,
        resolve: () => 1
      },
      ...queries
    })
  })
}

export default buildGraphQlSchema
