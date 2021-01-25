import { GraphQLEnumType, GraphQLScalarType } from 'graphql'
import { Model } from '@contember/schema'
import { EnumsProvider } from './EnumsProvider'
import { CustomTypesProvider } from './CustomTypesProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { ImplementationException } from '../exception'

export class ColumnTypeResolver {
	private schema: Model.Schema
	private enumsProvider: EnumsProvider

	constructor(
		schema: Model.Schema,
		enumsProvider: EnumsProvider,
		private readonly customTypeProvider: CustomTypesProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {
		this.schema = schema
		this.enumsProvider = enumsProvider
	}

	public getType(column: Model.AnyColumn): GraphQLScalarType | GraphQLEnumType {
		const type = column.type
		switch (type) {
			case Model.ColumnType.Int:
				return this.graphqlObjectFactories.int
			case Model.ColumnType.String:
				return this.graphqlObjectFactories.string
			case Model.ColumnType.Uuid:
				return this.customTypeProvider.uuidType
			case Model.ColumnType.Double:
				return this.graphqlObjectFactories.float
			case Model.ColumnType.Bool:
				return this.graphqlObjectFactories.boolean
			case Model.ColumnType.DateTime:
				return this.customTypeProvider.dateTimeType
			case Model.ColumnType.Date:
				return this.customTypeProvider.dateType
			case Model.ColumnType.Json:
				return this.customTypeProvider.jsonType
			case Model.ColumnType.Enum:
				if (this.enumsProvider.hasEnum(column.columnType)) {
					return this.enumsProvider.getEnum(column.columnType)
				}
				throw new Error(`Undefined enum ${column.columnType}`)
			default:
				;(({}: never): never => {
					throw new ImplementationException('Invalid column type')
				})(type)
		}
	}
}
