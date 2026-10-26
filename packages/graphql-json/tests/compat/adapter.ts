/**
 * Compatibility adapter for graphql-js style tests
 *
 * This module provides graphql-js compatible API that internally uses our JSON schema engine.
 * It allows running graphql-js tests with minimal modifications.
 */

import {
	execute as jsonExecute,
	executeSync as jsonExecuteSync,
	type ExecutionResult,
	type IsTypeOfResolverMap,
	type ResolverMap,
	type Schema,
	TypeKind,
	TypePattern,
	type TypeResolverMap,
} from '../../src/index.js'
import { type DocumentNode, parse } from 'graphql'

// Type helpers
type Maybe<T> = T | null | undefined
type ThunkOrValue<T> = T | (() => T)

// Resolver types
type GraphQLFieldResolver<TSource, TContext, TArgs = Record<string, unknown>> = (
	source: TSource,
	args: TArgs,
	context: TContext,
	info: unknown,
) => unknown

type GraphQLTypeResolver<TSource, TContext> = (
	value: TSource,
	context: TContext,
	info: unknown,
	abstractType: GraphQLAbstractType,
) => string | null | undefined | Promise<string | null | undefined>

type GraphQLIsTypeOfFn<TSource, TContext> = (
	source: TSource,
	context: TContext,
	info: unknown,
) => boolean | Promise<boolean>

// Base type class
abstract class GraphQLNamedType {
	name: string
	description?: Maybe<string>

	constructor(name: string, description?: Maybe<string>) {
		this.name = name
		this.description = description ?? undefined
	}

	toString(): string {
		return this.name
	}

	toJSON(): string {
		return this.name
	}
}

// Scalar type
export interface GraphQLScalarTypeConfig<TInternal, TExternal> {
	name: string
	description?: Maybe<string>
	serialize?: (value: unknown) => TExternal
	parseValue?: (value: unknown) => TInternal
	parseLiteral?: (ast: unknown) => TInternal
}

export class GraphQLScalarType<TInternal = unknown, TExternal = TInternal> extends GraphQLNamedType {
	serialize?: (value: unknown) => TExternal
	parseValue?: (value: unknown) => TInternal
	parseLiteral?: (ast: unknown) => TInternal

	constructor(config: GraphQLScalarTypeConfig<TInternal, TExternal>) {
		super(config.name, config.description)
		this.serialize = config.serialize
		this.parseValue = config.parseValue
		this.parseLiteral = config.parseLiteral
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLScalarType'
	}
}

// Built-in scalars
export const GraphQLString = new GraphQLScalarType({ name: 'String' })
export const GraphQLInt = new GraphQLScalarType({ name: 'Int' })
export const GraphQLFloat = new GraphQLScalarType({ name: 'Float' })
export const GraphQLBoolean = new GraphQLScalarType({ name: 'Boolean' })
export const GraphQLID = new GraphQLScalarType({ name: 'ID' })

// Type wrappers
export class GraphQLList<T extends GraphQLOutputType | GraphQLInputType> {
	ofType: T

	constructor(type: T) {
		this.ofType = type
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLList'
	}

	toString(): string {
		return `[${this.ofType.toString()}]`
	}

	toJSON(): string {
		return this.toString()
	}
}

export class GraphQLNonNull<T extends GraphQLNullableType> {
	ofType: T

	constructor(type: T) {
		this.ofType = type
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLNonNull'
	}

	toString(): string {
		return `${this.ofType.toString()}!`
	}

	toJSON(): string {
		return this.toString()
	}
}

// Field and argument types
export interface GraphQLArgumentConfig {
	type: GraphQLInputType
	defaultValue?: unknown
	description?: Maybe<string>
}

export interface GraphQLFieldConfig<TSource, TContext, TArgs = Record<string, unknown>> {
	type: GraphQLOutputType
	args?: Record<string, GraphQLArgumentConfig>
	resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>
	description?: Maybe<string>
	deprecationReason?: Maybe<string>
}

export interface GraphQLField<TSource, TContext> {
	name: string
	type: GraphQLOutputType
	args: GraphQLArgument[]
	resolve?: GraphQLFieldResolver<TSource, TContext, any>
	description?: Maybe<string>
	deprecationReason?: Maybe<string>
}

export interface GraphQLArgument {
	name: string
	type: GraphQLInputType
	defaultValue?: unknown
	description?: Maybe<string>
}

// Object type
export interface GraphQLObjectTypeConfig<TSource, TContext> {
	name: string
	fields: ThunkOrValue<Record<string, GraphQLFieldConfig<TSource, TContext>>>
	interfaces?: ThunkOrValue<GraphQLInterfaceType[]>
	isTypeOf?: GraphQLIsTypeOfFn<TSource, TContext>
	description?: Maybe<string>
}

export class GraphQLObjectType<TSource = any, TContext = any> extends GraphQLNamedType {
	private _fields: ThunkOrValue<Record<string, GraphQLFieldConfig<TSource, TContext>>>
	private _interfaces: ThunkOrValue<GraphQLInterfaceType[]>
	isTypeOf?: GraphQLIsTypeOfFn<TSource, TContext>

	constructor(config: GraphQLObjectTypeConfig<TSource, TContext>) {
		super(config.name, config.description)
		this._fields = config.fields
		this._interfaces = config.interfaces ?? []
		this.isTypeOf = config.isTypeOf
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLObjectType'
	}

	getFields(): Record<string, GraphQLField<TSource, TContext>> {
		const fieldsThunk = typeof this._fields === 'function' ? this._fields() : this._fields
		const result: Record<string, GraphQLField<TSource, TContext>> = {}
		for (const [name, config] of Object.entries(fieldsThunk)) {
			result[name] = {
				name,
				type: config.type,
				args: config.args
					? Object.entries(config.args).map(([argName, argConfig]) => ({
						name: argName,
						type: argConfig.type,
						defaultValue: argConfig.defaultValue,
						description: argConfig.description,
					}))
					: [],
				resolve: config.resolve,
				description: config.description,
				deprecationReason: config.deprecationReason,
			}
		}
		return result
	}

	getInterfaces(): GraphQLInterfaceType[] {
		return typeof this._interfaces === 'function' ? this._interfaces() : this._interfaces
	}
}

// Interface type
export interface GraphQLInterfaceTypeConfig<TSource, TContext> {
	name: string
	fields: ThunkOrValue<Record<string, GraphQLFieldConfig<TSource, TContext>>>
	resolveType?: GraphQLTypeResolver<TSource, TContext>
	description?: Maybe<string>
}

export class GraphQLInterfaceType<TSource = any, TContext = any> extends GraphQLNamedType {
	private _fields: ThunkOrValue<Record<string, GraphQLFieldConfig<TSource, TContext>>>
	resolveType?: GraphQLTypeResolver<TSource, TContext>

	constructor(config: GraphQLInterfaceTypeConfig<TSource, TContext>) {
		super(config.name, config.description)
		this._fields = config.fields
		this.resolveType = config.resolveType
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLInterfaceType'
	}

	getFields(): Record<string, GraphQLField<TSource, TContext>> {
		const fieldsThunk = typeof this._fields === 'function' ? this._fields() : this._fields
		const result: Record<string, GraphQLField<TSource, TContext>> = {}
		for (const [name, config] of Object.entries(fieldsThunk)) {
			result[name] = {
				name,
				type: config.type,
				args: config.args
					? Object.entries(config.args).map(([argName, argConfig]) => ({
						name: argName,
						type: argConfig.type,
						defaultValue: argConfig.defaultValue,
						description: argConfig.description,
					}))
					: [],
				resolve: config.resolve,
				description: config.description,
				deprecationReason: config.deprecationReason,
			}
		}
		return result
	}
}

// Union type
export interface GraphQLUnionTypeConfig<TSource, TContext> {
	name: string
	types: ThunkOrValue<GraphQLObjectType[]>
	resolveType?: GraphQLTypeResolver<TSource, TContext>
	description?: Maybe<string>
}

export class GraphQLUnionType<TSource = any, TContext = any> extends GraphQLNamedType {
	private _types: ThunkOrValue<GraphQLObjectType[]>
	resolveType?: GraphQLTypeResolver<TSource, TContext>

	constructor(config: GraphQLUnionTypeConfig<TSource, TContext>) {
		super(config.name, config.description)
		this._types = config.types
		this.resolveType = config.resolveType
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLUnionType'
	}

	getTypes(): GraphQLObjectType[] {
		return typeof this._types === 'function' ? this._types() : this._types
	}
}

// Enum type
export interface GraphQLEnumValueConfig {
	value?: unknown
	description?: Maybe<string>
	deprecationReason?: Maybe<string>
}

export interface GraphQLEnumTypeConfig {
	name: string
	values: Record<string, GraphQLEnumValueConfig>
	description?: Maybe<string>
}

export class GraphQLEnumType extends GraphQLNamedType {
	private _values: Record<string, GraphQLEnumValueConfig>

	constructor(config: GraphQLEnumTypeConfig) {
		super(config.name, config.description)
		this._values = config.values
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLEnumType'
	}

	getValues(): Array<{ name: string; value: unknown; description?: string; deprecationReason?: string }> {
		return Object.entries(this._values).map(([name, config]) => ({
			name,
			value: config.value !== undefined ? config.value : name,
			description: config.description ?? undefined,
			deprecationReason: config.deprecationReason ?? undefined,
		}))
	}

	getValue(name: string): { name: string; value: unknown } | undefined {
		const config = this._values[name]
		if (!config) return undefined
		return { name, value: config.value !== undefined ? config.value : name }
	}
}

// Input object type
export interface GraphQLInputFieldConfig {
	type: GraphQLInputType
	defaultValue?: unknown
	description?: Maybe<string>
}

export interface GraphQLInputObjectTypeConfig {
	name: string
	fields: ThunkOrValue<Record<string, GraphQLInputFieldConfig>>
	description?: Maybe<string>
}

export class GraphQLInputObjectType extends GraphQLNamedType {
	private _fields: ThunkOrValue<Record<string, GraphQLInputFieldConfig>>

	constructor(config: GraphQLInputObjectTypeConfig) {
		super(config.name, config.description)
		this._fields = config.fields
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLInputObjectType'
	}

	getFields(): Record<string, { name: string; type: GraphQLInputType; defaultValue?: unknown }> {
		const fieldsThunk = typeof this._fields === 'function' ? this._fields() : this._fields
		const result: Record<string, { name: string; type: GraphQLInputType; defaultValue?: unknown }> = {}
		for (const [name, config] of Object.entries(fieldsThunk)) {
			result[name] = {
				name,
				type: config.type,
				defaultValue: config.defaultValue,
			}
		}
		return result
	}
}

// Type aliases
export type GraphQLOutputType =
	| GraphQLScalarType
	| GraphQLObjectType
	| GraphQLInterfaceType
	| GraphQLUnionType
	| GraphQLEnumType
	| GraphQLList<any>
	| GraphQLNonNull<any>

export type GraphQLInputType =
	| GraphQLScalarType
	| GraphQLEnumType
	| GraphQLInputObjectType
	| GraphQLList<any>
	| GraphQLNonNull<any>

export type GraphQLNullableType =
	| GraphQLScalarType
	| GraphQLObjectType
	| GraphQLInterfaceType
	| GraphQLUnionType
	| GraphQLEnumType
	| GraphQLInputObjectType
	| GraphQLList<any>

export type GraphQLAbstractType = GraphQLInterfaceType | GraphQLUnionType

// Schema
export interface GraphQLSchemaConfig {
	query?: Maybe<GraphQLObjectType>
	mutation?: Maybe<GraphQLObjectType>
	subscription?: Maybe<GraphQLObjectType>
	types?: GraphQLNamedType[]
	directives?: unknown[]
	description?: Maybe<string>
}

export class GraphQLSchema {
	private _queryType?: GraphQLObjectType
	private _mutationType?: GraphQLObjectType
	private _subscriptionType?: GraphQLObjectType
	private _typeMap: Map<string, GraphQLNamedType> = new Map()
	description?: string

	constructor(config: GraphQLSchemaConfig) {
		this._queryType = config.query ?? undefined
		this._mutationType = config.mutation ?? undefined
		this._subscriptionType = config.subscription ?? undefined
		this.description = config.description ?? undefined

		// Collect all types
		if (config.types) {
			for (const type of config.types) {
				this._typeMap.set(type.name, type)
			}
		}

		// Collect types from root types
		this._collectTypes(this._queryType)
		this._collectTypes(this._mutationType)
		this._collectTypes(this._subscriptionType)
	}

	private _collectTypes(type?: GraphQLOutputType | GraphQLInputType): void {
		if (!type) return

		if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
			this._collectTypes(type.ofType)
			return
		}

		if (this._typeMap.has(type.name)) return
		this._typeMap.set(type.name, type)

		if (type instanceof GraphQLObjectType) {
			for (const iface of type.getInterfaces()) {
				this._collectTypes(iface)
			}
			for (const field of Object.values(type.getFields())) {
				this._collectTypes(field.type)
				for (const arg of field.args) {
					this._collectTypes(arg.type)
				}
			}
		} else if (type instanceof GraphQLInterfaceType) {
			for (const field of Object.values(type.getFields())) {
				this._collectTypes(field.type)
				for (const arg of field.args) {
					this._collectTypes(arg.type)
				}
			}
		} else if (type instanceof GraphQLUnionType) {
			for (const memberType of type.getTypes()) {
				this._collectTypes(memberType)
			}
		} else if (type instanceof GraphQLInputObjectType) {
			for (const field of Object.values(type.getFields())) {
				this._collectTypes(field.type)
			}
		}
	}

	get [Symbol.toStringTag]() {
		return 'GraphQLSchema'
	}

	getQueryType(): GraphQLObjectType | undefined {
		return this._queryType
	}

	getMutationType(): GraphQLObjectType | undefined {
		return this._mutationType
	}

	getSubscriptionType(): GraphQLObjectType | undefined {
		return this._subscriptionType
	}

	getTypeMap(): Map<string, GraphQLNamedType> {
		return this._typeMap
	}

	getType(name: string): GraphQLNamedType | undefined {
		return this._typeMap.get(name)
	}
}

// Type predicates
export function isObjectType(type: unknown): type is GraphQLObjectType {
	return type instanceof GraphQLObjectType
}

export function isInterfaceType(type: unknown): type is GraphQLInterfaceType {
	return type instanceof GraphQLInterfaceType
}

export function isUnionType(type: unknown): type is GraphQLUnionType {
	return type instanceof GraphQLUnionType
}

export function isEnumType(type: unknown): type is GraphQLEnumType {
	return type instanceof GraphQLEnumType
}

export function isScalarType(type: unknown): type is GraphQLScalarType {
	return type instanceof GraphQLScalarType
}

export function isInputObjectType(type: unknown): type is GraphQLInputObjectType {
	return type instanceof GraphQLInputObjectType
}

export function isListType(type: unknown): type is GraphQLList<any> {
	return type instanceof GraphQLList
}

export function isNonNullType(type: unknown): type is GraphQLNonNull<any> {
	return type instanceof GraphQLNonNull
}

export function isAbstractType(type: unknown): type is GraphQLAbstractType {
	return isInterfaceType(type) || isUnionType(type)
}

// Conversion utilities

function graphqlTypeToTypeRef(type: GraphQLOutputType | GraphQLInputType): [number, string] {
	if (type instanceof GraphQLNonNull) {
		const inner = type.ofType
		if (inner instanceof GraphQLList) {
			const listInner = inner.ofType
			if (listInner instanceof GraphQLNonNull) {
				return [TypePattern.L_NN_T_NN, getNamedTypeName(listInner.ofType)]
			}
			return [TypePattern.L_T_NN_NN, getNamedTypeName(listInner)]
		}
		return [TypePattern.T_NN, getNamedTypeName(inner)]
	}

	if (type instanceof GraphQLList) {
		const inner = type.ofType
		if (inner instanceof GraphQLNonNull) {
			return [TypePattern.L_T_NN, getNamedTypeName(inner.ofType)]
		}
		return [TypePattern.L_T, getNamedTypeName(inner)]
	}

	return [TypePattern.T, getNamedTypeName(type)]
}

function getNamedTypeName(type: GraphQLOutputType | GraphQLInputType): string {
	if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
		return getNamedTypeName(type.ofType)
	}
	return type.name
}

function convertSchemaToJSON(schema: GraphQLSchema): {
	jsonSchema: Schema
	resolvers: ResolverMap
	typeResolvers: TypeResolverMap
	isTypeOfResolvers: IsTypeOfResolverMap
} {
	const types: Schema['t'] = {}
	const resolvers: ResolverMap = {}
	const typeResolvers: TypeResolverMap = {}
	const isTypeOfResolvers: IsTypeOfResolverMap = {}

	// Add built-in scalars
	types.String = [TypeKind.SCALAR]
	types.Int = [TypeKind.SCALAR]
	types.Float = [TypeKind.SCALAR]
	types.Boolean = [TypeKind.SCALAR]
	types.ID = [TypeKind.SCALAR]

	const typeMap = schema.getTypeMap()

	// First pass: register all types
	for (const [name, type] of typeMap) {
		if (types[name]) continue // Skip built-ins

		if (type instanceof GraphQLScalarType) {
			types[name] = [TypeKind.SCALAR]
		} else if (type instanceof GraphQLEnumType) {
			const values: Record<string, [unknown?]> = {}
			for (const enumValue of type.getValues()) {
				if (enumValue.value !== enumValue.name) {
					values[enumValue.name] = [enumValue.value]
				} else {
					values[enumValue.name] = []
				}
			}
			types[name] = [TypeKind.ENUM, values]
		} else if (type instanceof GraphQLUnionType) {
			types[name] = [TypeKind.UNION, type.getTypes().map((t) => t.name)]
			if (type.resolveType) {
				typeResolvers[name] = type.resolveType as any
			}
		} else if (type instanceof GraphQLInputObjectType) {
			const fields: Record<string, [[number, string], unknown?]> = {}
			for (const [fieldName, field] of Object.entries(type.getFields())) {
				const typeRef = graphqlTypeToTypeRef(field.type)
				if (field.defaultValue !== undefined) {
					fields[fieldName] = [typeRef, field.defaultValue]
				} else {
					fields[fieldName] = [typeRef]
				}
			}
			types[name] = [TypeKind.INPUT_OBJECT, fields]
		}
	}

	// Second pass: object and interface types (need all types registered for interfaces/possibleTypes)
	for (const [name, type] of typeMap) {
		if (type instanceof GraphQLObjectType) {
			const fields: Record<string, [[number, string], Record<string, [[number, string], unknown?]> | null]> = {}
			const typeResolversForType: Record<string, GraphQLFieldResolver<any, any>> = {}

			for (const [fieldName, field] of Object.entries(type.getFields())) {
				const typeRef = graphqlTypeToTypeRef(field.type)
				let args: Record<string, [[number, string], unknown?]> | null = null

				if (field.args.length > 0) {
					args = {}
					for (const arg of field.args) {
						const argTypeRef = graphqlTypeToTypeRef(arg.type)
						if (arg.defaultValue !== undefined) {
							args[arg.name] = [argTypeRef, arg.defaultValue]
						} else {
							args[arg.name] = [argTypeRef]
						}
					}
				}

				fields[fieldName] = [typeRef, args]

				if (field.resolve) {
					typeResolversForType[fieldName] = field.resolve
				}
			}

			if (Object.keys(typeResolversForType).length > 0) {
				resolvers[name] = typeResolversForType
			}

			const interfaces = type.getInterfaces().map((i) => i.name)
			types[name] = [TypeKind.OBJECT, fields, interfaces]

			if (type.isTypeOf) {
				// Store isTypeOf for abstract type resolution
				isTypeOfResolvers[name] = type.isTypeOf as any
			}
		} else if (type instanceof GraphQLInterfaceType) {
			const fields: Record<string, [[number, string], Record<string, [[number, string], unknown?]> | null]> = {}

			for (const [fieldName, field] of Object.entries(type.getFields())) {
				const typeRef = graphqlTypeToTypeRef(field.type)
				let args: Record<string, [[number, string], unknown?]> | null = null

				if (field.args.length > 0) {
					args = {}
					for (const arg of field.args) {
						const argTypeRef = graphqlTypeToTypeRef(arg.type)
						if (arg.defaultValue !== undefined) {
							args[arg.name] = [argTypeRef, arg.defaultValue]
						} else {
							args[arg.name] = [argTypeRef]
						}
					}
				}

				fields[fieldName] = [typeRef, args]
			}

			// Find implementing types
			const possibleTypes: string[] = []
			for (const [otherName, otherType] of typeMap) {
				if (otherType instanceof GraphQLObjectType) {
					if (otherType.getInterfaces().some((i) => i.name === name)) {
						possibleTypes.push(otherName)
					}
				}
			}

			types[name] = [TypeKind.INTERFACE, fields, [], possibleTypes]

			if (type.resolveType) {
				typeResolvers[name] = type.resolveType as any
			}
		}
	}

	const queryType = schema.getQueryType()
	if (!queryType) {
		throw new Error('Schema must have a query type.')
	}
	const mutationType = schema.getMutationType()
	const subscriptionType = schema.getSubscriptionType()

	return {
		jsonSchema: {
			q: queryType.name,
			m: mutationType?.name ?? null,
			s: subscriptionType?.name ?? null,
			t: types,
		},
		resolvers,
		typeResolvers,
		isTypeOfResolvers,
	}
}

// Execute function compatible with graphql-js
export interface ExecuteArgs {
	schema: GraphQLSchema
	document: DocumentNode
	rootValue?: unknown
	contextValue?: unknown
	variableValues?: Record<string, unknown> | null
	operationName?: string | null
	fieldResolver?: GraphQLFieldResolver<any, any>
	typeResolver?: GraphQLTypeResolver<any, any>
}

export function execute(args: ExecuteArgs): ExecutionResult | Promise<ExecutionResult> {
	// Validate required args
	if (!args.schema) {
		throw new Error('Expected undefined to be a GraphQL schema.')
	}
	if (!args.document) {
		throw new Error('Must provide document.')
	}
	if (args.variableValues !== undefined && args.variableValues !== null && typeof args.variableValues !== 'object') {
		throw new Error(
			'Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.',
		)
	}

	const { jsonSchema, resolvers, typeResolvers, isTypeOfResolvers } = convertSchemaToJSON(args.schema)

	return jsonExecute({
		schema: jsonSchema,
		document: args.document,
		rootValue: args.rootValue,
		contextValue: args.contextValue,
		variableValues: args.variableValues ?? undefined,
		operationName: args.operationName ?? undefined,
		resolvers,
		typeResolvers,
		isTypeOfResolvers,
	})
}

export function executeSync(args: ExecuteArgs): ExecutionResult {
	const result = execute(args)
	if (result instanceof Promise) {
		throw new Error('GraphQL execution failed to complete synchronously.')
	}
	return result
}

// Re-export parse for convenience
export { parse } from 'graphql'
