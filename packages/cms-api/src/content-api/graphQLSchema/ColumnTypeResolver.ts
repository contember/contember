import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLScalarType, GraphQLString } from "graphql"
import { Model } from "cms-common"
import { GraphQLUUID } from "./customTypes"
import EnumsProvider from "./EnumsProvider"

export default class ColumnTypeResolver
{
  private schema: Model.Schema
  private enumsProvider: EnumsProvider

  constructor(schema: Model.Schema, enumsProvider: EnumsProvider)
  {
    this.schema = schema
    this.enumsProvider = enumsProvider
  }

  public getType(column: Model.AnyColumn): GraphQLScalarType | GraphQLEnumType
  {
    switch (column.type) {
      case Model.ColumnType.Int:
        return GraphQLInt
      case Model.ColumnType.String:
        return GraphQLString
      case Model.ColumnType.Uuid:
        return GraphQLUUID
      case Model.ColumnType.Double:
        return GraphQLFloat
      case Model.ColumnType.Bool:
        return GraphQLBoolean
      case Model.ColumnType.DateTime:
      case Model.ColumnType.Date:
        return GraphQLString // todo
      case Model.ColumnType.Enum:
        if (this.enumsProvider.hasEnum(column.enumName)) {
          return this.enumsProvider.getEnum(column.enumName)
        }
        throw new Error(`Undefined enum ${column.enumName}`)
      default:
        (({}: never): never => { throw new Error })(column)
    }
  }
}
