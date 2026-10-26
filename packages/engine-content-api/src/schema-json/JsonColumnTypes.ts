import { Model } from '@contember/schema'
import { builtInScalars, ScalarImplementation, TypeRef } from '@contember/graphql-json'
import { GraphQLScalarType } from 'graphql'
import { CustomTypesProvider } from '../schema/CustomTypesProvider.js'
import { capitalizeFirstLetter } from '../utils/index.js'
import { ImplementationException } from '../exception.js'
import { JsonTypeRegistry, listOfNonNullRef, namedRef } from './JsonTypeRegistry.js'

type ScalarColumnType = Exclude<Model.ColumnType, Model.ColumnType.Enum>

const customTypes = new CustomTypesProvider()

const toScalarImplementation = (type: GraphQLScalarType): ScalarImplementation => ({
	serialize: value => type.serialize(value),
	parseValue: value => type.parseValue(value),
	parseLiteral: (ast, variables) => type.parseLiteral(ast, variables),
})

const scalarImplementations = new Map<GraphQLScalarType, ScalarImplementation>()
const getScalarImplementation = (type: GraphQLScalarType): ScalarImplementation => {
	let implementation = scalarImplementations.get(type)
	if (!implementation) {
		implementation = toScalarImplementation(type)
		scalarImplementations.set(type, implementation)
	}
	return implementation
}

export interface JsonColumnType {
	/** `T` or `[T!]` for a list column */
	type: TypeRef
	baseName: string
}

/** JSON counterpart of `ColumnTypeResolver` + `EnumsProvider`. */
export class JsonColumnTypes {
	private readonly aliasBaseTypes = new Map<string, ScalarColumnType>()

	constructor(
		private readonly schema: Model.Schema,
		private readonly registry: JsonTypeRegistry,
	) {}

	public getType(column: Model.AnyColumn): JsonColumnType {
		const baseName = this.getBaseTypeName(column)
		return {
			type: column.list ? listOfNonNullRef(baseName) : namedRef(baseName),
			baseName,
		}
	}

	public getScalar(type: ScalarColumnType): string {
		switch (type) {
			case Model.ColumnType.Int:
				return this.registry.scalar('Int', undefined)
			case Model.ColumnType.String:
				return this.registry.scalar('String', undefined)
			case Model.ColumnType.Double:
				return this.registry.scalar('Float', undefined)
			case Model.ColumnType.Bool:
				return this.registry.scalar('Boolean', undefined)
			case Model.ColumnType.Uuid:
				return this.registerCustomScalar(customTypes.uuidType.name, customTypes.uuidType)
			case Model.ColumnType.Numeric:
				return this.registerCustomScalar(customTypes.decimalType.name, customTypes.decimalType)
			case Model.ColumnType.DateTime:
				return this.registerCustomScalar(customTypes.dateTimeType.name, customTypes.dateTimeType)
			case Model.ColumnType.Time:
				return this.registerCustomScalar(customTypes.timeType.name, customTypes.timeType)
			case Model.ColumnType.Date:
				return this.registerCustomScalar(customTypes.dateType.name, customTypes.dateType)
			case Model.ColumnType.Json:
				return this.registerCustomScalar(customTypes.jsonType.name, customTypes.jsonType)
			default:
				;(({}: never): never => {
					throw new ImplementationException('Invalid column type')
				})(type)
		}
	}

	private getBaseTypeName(column: Model.AnyColumn): string {
		if (column.typeAlias) {
			if (column.type === Model.ColumnType.Enum) {
				throw new Error('GraphQL type alias cannot be specified for enum type')
			}
			return this.getAliasedType(column.typeAlias, column.type)
		}
		if (column.type === Model.ColumnType.Enum) {
			const values = this.schema.enums[column.columnType]
			if (values === undefined) {
				throw new Error(`Undefined enum ${column.columnType}`)
			}
			return this.registry.enum(capitalizeFirstLetter(column.columnType), values)
		}
		return this.getScalar(column.type)
	}

	private getAliasedType(name: string, baseType: ScalarColumnType): string {
		const existingBase = this.aliasBaseTypes.get(name)
		if (existingBase !== undefined) {
			if (existingBase !== baseType) {
				throw new Error('GraphQL type alias with different base type found')
			}
			return name
		}
		this.aliasBaseTypes.set(name, baseType)
		const baseName = this.getScalar(baseType)
		// An alias of a built-in scalar inherits the built-in coercion.
		const implementation = this.registry.scalars[baseName] ?? builtInScalars[baseName]
		return this.registry.scalar(name, implementation)
	}

	private registerCustomScalar(name: string, type: GraphQLScalarType): string {
		return this.registry.scalar(name, getScalarImplementation(type), type.description ?? undefined)
	}
}
