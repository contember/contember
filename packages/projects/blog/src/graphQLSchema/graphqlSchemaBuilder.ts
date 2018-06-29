import { Schema } from '../model'
import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import { completeEntityWhereType, getEntityWhereType } from "./where";
import getQueries from "./queries";
import { completeEntityType, getEntityType } from "./entities";


const buildGraphQlSchema = (schema: Schema) => {

  type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

  const entityNames = Object.keys(schema.entities)
  entityNames.forEach(getEntityType(schema))
  entityNames.forEach(getEntityWhereType)

  const queries = entityNames.reduce<{ [queryName: string]: FieldConfig }>((queries, entityName) => {
    return {
      ...getQueries(schema)(entityName),
      ...queries,
    }
  }, {})

  entityNames.forEach(completeEntityType(schema))
  entityNames.forEach(completeEntityWhereType(schema))

  return new GraphQLObjectType({
    description: 'global query object',
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
