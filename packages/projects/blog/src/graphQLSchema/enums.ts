import singletonFactory from "../utils/singletonFactory"
import { GraphQLEnumValueConfigMap } from "graphql/type/definition"
import { GraphQLEnumType } from "graphql"
import { Schema } from "../model"
import { capitalizeFirstLetter } from "../utils/strings";

const enumSingleton = singletonFactory((name, schema: Schema) => {
  if (schema.enums[name] === undefined) {
    return undefined
  }

  const valuesConfig: GraphQLEnumValueConfigMap = {}
  for (let val of schema.enums[name]) {
    valuesConfig[val] = {value: val}
  }

  return new GraphQLEnumType({
    name: capitalizeFirstLetter(name),
    values: valuesConfig
  })
})

const getEnum = (schema: Schema) => (name: string) => enumSingleton(name, schema)

export default getEnum
