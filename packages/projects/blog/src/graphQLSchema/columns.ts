import getEnum from "./enums"
import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLScalarType, GraphQLString } from "graphql"
import { GraphQLUUID } from "./customTypes"
import { Schema } from "../model"


const getColumnType = (schema: Schema) => {
  const getSchemaEnum = getEnum(schema)

  return (type: string): GraphQLScalarType | GraphQLEnumType => {
    switch (type) {
      case 'int':
      case 'integer':
        return GraphQLInt
      case 'string':
        return GraphQLString
      case 'uuid':
        return GraphQLUUID
      case 'float':
        return GraphQLFloat
      case 'bool':
      case 'boolean':
        return GraphQLBoolean
      case 'datetime':
        return GraphQLString //todo
    }
    const enumType = getSchemaEnum(type)
    if (enumType !== undefined) {
      return enumType
    }
    throw new Error(`Undefined type ${type}`)
  }
}

export default getColumnType
