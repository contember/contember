import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLScalarType, GraphQLString } from "graphql"
import { Schema } from "../../content-schema/model"
import { GraphQLUUID } from "./customTypes"
import EnumsProvider from "./EnumsProvider"

export default class ColumnTypeResolver
{
  private schema: Schema
  private enumsProvider: EnumsProvider

  constructor(schema: Schema, enumsProvider: EnumsProvider)
  {
    this.schema = schema
    this.enumsProvider = enumsProvider
  }

  public getType(type: string): GraphQLScalarType | GraphQLEnumType
  {
    switch (type) {
      case "int":
      case "integer":
        return GraphQLInt
      case "string":
        return GraphQLString
      case "uuid":
        return GraphQLUUID
      case "float":
        return GraphQLFloat
      case "bool":
      case "boolean":
        return GraphQLBoolean
      case "datetime":
        return GraphQLString // todo
    }
    if (this.enumsProvider.hasEnum(type)) {
      return this.enumsProvider.getEnum(type)
    }
    throw new Error(`Undefined type ${type}`)
  }
}
