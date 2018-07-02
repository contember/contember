import { Schema } from "../model"
import singletonFactory from "../utils/singletonFactory"
import { GraphQLNonNull } from "graphql/type/definition"
import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList } from "graphql"
import getColumnType from "./columns";
import { capitalizeFirstLetter } from "../utils/strings";

const conditionSingleton = singletonFactory((typeName, schema: Schema) => {
  const basicType = getColumnType(schema)(typeName)
  const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: capitalizeFirstLetter(typeName) + "Condition",
    fields: () => ({
      and: {type: new GraphQLList(new GraphQLNonNull(condition))},
      or: {type: new GraphQLList(new GraphQLNonNull(condition))},
      not: {type: condition},

      eq: {type: basicType},
      null: {type: GraphQLBoolean},
      notEq: {type: basicType},
      in: {type: new GraphQLList(new GraphQLNonNull(basicType))},
      notIn: {type: new GraphQLList(new GraphQLNonNull(basicType))},
      lt: {type: basicType},
      lte: {type: basicType},
      gt: {type: basicType},
      gte: {type: basicType},
    })
  })
  return condition
})

const getConditionType = (schema: Schema) => (typeName: string) => conditionSingleton(typeName, schema)

export { getConditionType }
