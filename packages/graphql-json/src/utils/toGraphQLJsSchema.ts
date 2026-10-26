import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLFieldConfigArgumentMap,
	GraphQLFieldConfigMap,
	GraphQLFloat,
	GraphQLID,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLInputType,
	GraphQLInt,
	GraphQLInterfaceType,
	GraphQLList,
	GraphQLNamedType,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLOutputType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	GraphQLType,
	GraphQLUnionType,
	isInputType,
	isInterfaceType,
	isObjectType,
	isOutputType,
} from 'graphql'
import { Argument, Field, Schema, TypeKind, TypeRef } from '../types/schema.js'
import { getListItemType, isListType, isNonNullType, unwrapNonNull } from './typeRef.js'

const builtInScalars: Record<string, GraphQLScalarType> = {
	Int: GraphQLInt,
	Float: GraphQLFloat,
	String: GraphQLString,
	Boolean: GraphQLBoolean,
	ID: GraphQLID,
}

/** Rebuilds a graphql-js schema from a JSON schema, e.g. to print it as SDL or to validate it with graphql-js. */
export const toGraphQLJsSchema = (schema: Schema): GraphQLSchema => {
	const named = new Map<string, GraphQLNamedType>()

	const getNamed = (name: string): GraphQLNamedType => {
		const existing = named.get(name) ?? builtInScalars[name]
		if (existing) {
			return existing
		}
		const type = createNamed(name)
		named.set(name, type)
		return type
	}

	const wrap = (ref: TypeRef): GraphQLType => {
		const wrapPattern = (pattern: number): GraphQLType => {
			if (isNonNullType(pattern)) {
				const inner = wrapPattern(unwrapNonNull(pattern))
				if (inner instanceof GraphQLNonNull) {
					throw new Error('Double non-null')
				}
				return new GraphQLNonNull(inner)
			}
			if (isListType(pattern)) {
				return new GraphQLList(wrapPattern(getListItemType(pattern)))
			}
			return getNamed(ref[1])
		}
		return wrapPattern(ref[0])
	}
	const outputType = (ref: TypeRef): GraphQLOutputType => {
		const type = wrap(ref)
		if (!isOutputType(type)) {
			throw new Error(`${ref[1]} is not an output type`)
		}
		return type
	}
	const inputType = (ref: TypeRef): GraphQLInputType => {
		const type = wrap(ref)
		if (!isInputType(type)) {
			throw new Error(`${ref[1]} is not an input type`)
		}
		return type
	}
	const args = (args: Record<string, Argument> | null): GraphQLFieldConfigArgumentMap =>
		Object.fromEntries(
			Object.entries(args ?? {}).map((
				[name, arg],
			) => [name, { type: inputType(arg[0]), defaultValue: arg[1], description: arg[2], deprecationReason: arg[3] }]),
		)
	const fields = (fields: Record<string, Field>) => (): GraphQLFieldConfigMap<unknown, unknown> =>
		Object.fromEntries(
			Object.entries(fields).map(([name, field]) => [
				name,
				{ type: outputType(field[0]), args: args(field[1]), description: field[2], deprecationReason: field[3] },
			]),
		)
	const objectType = (name: string): GraphQLObjectType => {
		const type = getNamed(name)
		if (!isObjectType(type)) {
			throw new Error(`${name} is not an object type`)
		}
		return type
	}
	const interfaceType = (name: string): GraphQLInterfaceType => {
		const type = getNamed(name)
		if (!isInterfaceType(type)) {
			throw new Error(`${name} is not an interface type`)
		}
		return type
	}

	const createNamed = (name: string): GraphQLNamedType => {
		const type = schema.t[name]
		if (!type) {
			throw new Error(`Unknown type ${name}`)
		}
		switch (type[0]) {
			case TypeKind.SCALAR:
				return new GraphQLScalarType({ name, description: type[1] })
			case TypeKind.OBJECT:
				return new GraphQLObjectType({
					name,
					description: type[3],
					fields: fields(type[1]),
					interfaces: () => type[2].map(interfaceType),
				})
			case TypeKind.INTERFACE:
				return new GraphQLInterfaceType({
					name,
					description: type[4],
					fields: fields(type[1]),
					interfaces: () => type[2].map(interfaceType),
				})
			case TypeKind.UNION:
				return new GraphQLUnionType({ name, description: type[2], types: () => type[1].map(objectType) })
			case TypeKind.ENUM:
				return new GraphQLEnumType({
					name,
					description: type[2],
					values: Object.fromEntries(Object.entries(type[1]).map(([value, def]) => [value, { description: def[1], deprecationReason: def[2] }])),
				})
			case TypeKind.INPUT_OBJECT:
				return new GraphQLInputObjectType({
					name,
					description: type[3],
					isOneOf: type[2],
					fields: (): GraphQLInputFieldConfigMap =>
						Object.fromEntries(
							Object.entries(type[1]).map(([fieldName, field]) => [
								fieldName,
								{ type: inputType(field[0]), defaultValue: field[1], description: field[2], deprecationReason: field[3] },
							]),
						),
				})
		}
	}

	return new GraphQLSchema({
		query: objectType(schema.q),
		mutation: schema.m ? objectType(schema.m) : undefined,
		// graphql-js adds its own introspection types
		types: Object.keys(schema.t).filter(name => !name.startsWith('__')).map(getNamed),
	})
}
