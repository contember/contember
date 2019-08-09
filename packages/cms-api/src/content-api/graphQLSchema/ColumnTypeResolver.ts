import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLScalarType, GraphQLString } from 'graphql'
import { Model } from '@contember/schema'
import { GraphQLDate, GraphQLDateTime, GraphQLUUID } from './customTypes'
import EnumsProvider from './EnumsProvider'

export default class ColumnTypeResolver {
	private schema: Model.Schema
	private enumsProvider: EnumsProvider

	constructor(schema: Model.Schema, enumsProvider: EnumsProvider) {
		this.schema = schema
		this.enumsProvider = enumsProvider
	}

	public getType(column: Model.AnyColumnDefinition): GraphQLScalarType | GraphQLEnumType {
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
				return GraphQLDateTime
			case Model.ColumnType.Date:
				return GraphQLDate
			case Model.ColumnType.Enum:
				if (this.enumsProvider.hasEnum(column.enumName)) {
					return this.enumsProvider.getEnum(column.enumName)
				}
				throw new Error(`Undefined enum ${column.enumName}`)
			default:
				;(({  }: never): never => {
					throw new Error()
				})(column)
		}
	}
}
