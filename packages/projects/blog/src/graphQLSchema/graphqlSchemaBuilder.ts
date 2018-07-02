import { Schema } from '../model'
import { GraphQLFieldConfig, GraphQLObjectType, GraphQLSchema } from "graphql"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import getQueries from "./queries";
import { getMutations } from "./mutations";


const buildGraphQlSchema = (schema: Schema): GraphQLSchema => {

  type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: () => Object.keys(schema.entities).reduce<{ [queryName: string]: FieldConfig }>((queries, entityName) => {
        return {
          ...getQueries(schema)(entityName),
          ...queries,
        }
      }, {})
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: () => Object.keys(schema.entities).reduce<{ [queryName: string]: FieldConfig }>((mutations, entityName) => {
        return {
          ...getMutations(schema)(entityName),
          ...mutations,
        }
      }, {})
    }),
  })
}


export default buildGraphQlSchema
