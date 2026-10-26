/**
 * Introspection type definitions
 *
 * These types are added to the schema at execution time when introspection queries
 * are detected (__schema or __type meta-fields).
 */

import { type Directive, type Schema, type Type, TypeKind, TypePattern } from '../types/schema.js'

/**
 * __TypeKind enum values as defined by the GraphQL spec
 */
export const IntrospectionTypeKind = {
	SCALAR: 'SCALAR',
	OBJECT: 'OBJECT',
	INTERFACE: 'INTERFACE',
	UNION: 'UNION',
	ENUM: 'ENUM',
	INPUT_OBJECT: 'INPUT_OBJECT',
	LIST: 'LIST',
	NON_NULL: 'NON_NULL',
} as const

export type IntrospectionTypeKindValue = typeof IntrospectionTypeKind[keyof typeof IntrospectionTypeKind]

/**
 * __DirectiveLocation enum values as defined by the GraphQL spec
 */
export const DirectiveLocation = {
	// Executable locations
	QUERY: 'QUERY',
	MUTATION: 'MUTATION',
	SUBSCRIPTION: 'SUBSCRIPTION',
	FIELD: 'FIELD',
	FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
	FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
	INLINE_FRAGMENT: 'INLINE_FRAGMENT',
	VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
	// Type system locations
	SCHEMA: 'SCHEMA',
	SCALAR: 'SCALAR',
	OBJECT: 'OBJECT',
	FIELD_DEFINITION: 'FIELD_DEFINITION',
	ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
	INTERFACE: 'INTERFACE',
	UNION: 'UNION',
	ENUM: 'ENUM',
	ENUM_VALUE: 'ENUM_VALUE',
	INPUT_OBJECT: 'INPUT_OBJECT',
	INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION',
} as const

export type DirectiveLocationValue = typeof DirectiveLocation[keyof typeof DirectiveLocation]

/**
 * Introspection types in compact JSON format
 *
 * These are the 8 introspection types defined by the GraphQL specification:
 * - __Schema
 * - __Type
 * - __Field
 * - __InputValue
 * - __EnumValue
 * - __Directive
 * - __TypeKind (enum)
 * - __DirectiveLocation (enum)
 */
export const introspectionTypes: Record<string, Type> = {
	// __Schema type
	__Schema: [
		TypeKind.OBJECT,
		{
			description: [[TypePattern.T, 'String'], null],
			types: [[TypePattern.L_NN_T_NN, '__Type'], null, 'A list of all types supported by this server.'],
			queryType: [[TypePattern.T_NN, '__Type'], null, 'The type that query operations will be rooted at.'],
			mutationType: [[TypePattern.T, '__Type'], null, 'If this server supports mutation, the type that mutation operations will be rooted at.'],
			subscriptionType: [
				[TypePattern.T, '__Type'],
				null,
				'If this server support subscription, the type that subscription operations will be rooted at.',
			],
			directives: [[TypePattern.L_NN_T_NN, '__Directive'], null, 'A list of all directives supported by this server.'],
		},
		[],
		'A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.',
	],

	// __Type type
	__Type: [
		TypeKind.OBJECT,
		{
			kind: [[TypePattern.T_NN, '__TypeKind'], null],
			name: [[TypePattern.T, 'String'], null],
			description: [[TypePattern.T, 'String'], null],
			specifiedByURL: [[TypePattern.T, 'String'], null],
			fields: [
				[TypePattern.L_T_NN, '__Field'],
				{ includeDeprecated: [[TypePattern.T, 'Boolean'], false] },
			],
			interfaces: [[TypePattern.L_T_NN, '__Type'], null],
			possibleTypes: [[TypePattern.L_T_NN, '__Type'], null],
			enumValues: [
				[TypePattern.L_T_NN, '__EnumValue'],
				{ includeDeprecated: [[TypePattern.T, 'Boolean'], false] },
			],
			inputFields: [
				[TypePattern.L_T_NN, '__InputValue'],
				{ includeDeprecated: [[TypePattern.T, 'Boolean'], false] },
			],
			ofType: [[TypePattern.T, '__Type'], null],
			isOneOf: [[TypePattern.T, 'Boolean'], null],
		},
		[],
		'The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.',
	],

	// __Field type
	__Field: [
		TypeKind.OBJECT,
		{
			name: [[TypePattern.T_NN, 'String'], null],
			description: [[TypePattern.T, 'String'], null],
			args: [
				[TypePattern.L_NN_T_NN, '__InputValue'],
				{ includeDeprecated: [[TypePattern.T, 'Boolean'], false] },
			],
			type: [[TypePattern.T_NN, '__Type'], null],
			isDeprecated: [[TypePattern.T_NN, 'Boolean'], null],
			deprecationReason: [[TypePattern.T, 'String'], null],
		},
		[],
		'Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.',
	],

	// __InputValue type
	__InputValue: [
		TypeKind.OBJECT,
		{
			name: [[TypePattern.T_NN, 'String'], null],
			description: [[TypePattern.T, 'String'], null],
			type: [[TypePattern.T_NN, '__Type'], null],
			defaultValue: [[TypePattern.T, 'String'], null, 'A GraphQL-formatted string representing the default value for this input value.'],
			isDeprecated: [[TypePattern.T_NN, 'Boolean'], null],
			deprecationReason: [[TypePattern.T, 'String'], null],
		},
		[],
		'Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.',
	],

	// __EnumValue type
	__EnumValue: [
		TypeKind.OBJECT,
		{
			name: [[TypePattern.T_NN, 'String'], null],
			description: [[TypePattern.T, 'String'], null],
			isDeprecated: [[TypePattern.T_NN, 'Boolean'], null],
			deprecationReason: [[TypePattern.T, 'String'], null],
		},
		[],
		'One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.',
	],

	// __Directive type
	__Directive: [
		TypeKind.OBJECT,
		{
			name: [[TypePattern.T_NN, 'String'], null],
			description: [[TypePattern.T, 'String'], null],
			isRepeatable: [[TypePattern.T_NN, 'Boolean'], null],
			locations: [[TypePattern.L_NN_T_NN, '__DirectiveLocation'], null],
			args: [
				[TypePattern.L_NN_T_NN, '__InputValue'],
				{ includeDeprecated: [[TypePattern.T, 'Boolean'], false] },
			],
		},
		[],
		"A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
	],

	// __TypeKind enum
	__TypeKind: [
		TypeKind.ENUM,
		{
			SCALAR: [undefined, 'Indicates this type is a scalar.'],
			OBJECT: [undefined, 'Indicates this type is an object. `fields` and `interfaces` are valid fields.'],
			INTERFACE: [undefined, 'Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields.'],
			UNION: [undefined, 'Indicates this type is a union. `possibleTypes` is a valid field.'],
			ENUM: [undefined, 'Indicates this type is an enum. `enumValues` is a valid field.'],
			INPUT_OBJECT: [undefined, 'Indicates this type is an input object. `inputFields` is a valid field.'],
			LIST: [undefined, 'Indicates this type is a list. `ofType` is a valid field.'],
			NON_NULL: [undefined, 'Indicates this type is a non-null. `ofType` is a valid field.'],
		},
		'An enum describing what kind of type a given `__Type` is.',
	],

	// __DirectiveLocation enum
	__DirectiveLocation: [
		TypeKind.ENUM,
		{
			QUERY: [undefined, 'Location adjacent to a query operation.'],
			MUTATION: [undefined, 'Location adjacent to a mutation operation.'],
			SUBSCRIPTION: [undefined, 'Location adjacent to a subscription operation.'],
			FIELD: [undefined, 'Location adjacent to a field.'],
			FRAGMENT_DEFINITION: [undefined, 'Location adjacent to a fragment definition.'],
			FRAGMENT_SPREAD: [undefined, 'Location adjacent to a fragment spread.'],
			INLINE_FRAGMENT: [undefined, 'Location adjacent to an inline fragment.'],
			VARIABLE_DEFINITION: [undefined, 'Location adjacent to a variable definition.'],
			SCHEMA: [undefined, 'Location adjacent to a schema definition.'],
			SCALAR: [undefined, 'Location adjacent to a scalar definition.'],
			OBJECT: [undefined, 'Location adjacent to an object type definition.'],
			FIELD_DEFINITION: [undefined, 'Location adjacent to a field definition.'],
			ARGUMENT_DEFINITION: [undefined, 'Location adjacent to an argument definition.'],
			INTERFACE: [undefined, 'Location adjacent to an interface definition.'],
			UNION: [undefined, 'Location adjacent to a union definition.'],
			ENUM: [undefined, 'Location adjacent to an enum definition.'],
			ENUM_VALUE: [undefined, 'Location adjacent to an enum value definition.'],
			INPUT_OBJECT: [undefined, 'Location adjacent to an input object type definition.'],
			INPUT_FIELD_DEFINITION: [undefined, 'Location adjacent to an input object field definition.'],
		},
		'A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.',
	],
}

/**
 * Built-in directives that are always available
 */
export const builtInDirectives: Record<'skip' | 'include' | 'deprecated' | 'specifiedBy' | 'oneOf', Directive> = {
	skip: [
		{ if: [[TypePattern.T_NN, 'Boolean'], undefined, 'Skipped when true.'] },
		['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
		false,
		'Directs the executor to skip this field or fragment when the `if` argument is true.',
	],
	include: [
		{ if: [[TypePattern.T_NN, 'Boolean'], undefined, 'Included when true.'] },
		['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
		false,
		'Directs the executor to include this field or fragment only when the `if` argument is true.',
	],
	deprecated: [
		{
			reason: [
				[TypePattern.T, 'String'],
				'No longer supported',
				'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).',
			],
		},
		['FIELD_DEFINITION', 'ARGUMENT_DEFINITION', 'INPUT_FIELD_DEFINITION', 'ENUM_VALUE'],
		false,
		'Marks an element of a GraphQL schema as no longer supported.',
	],
	specifiedBy: [
		{ url: [[TypePattern.T_NN, 'String'], undefined, 'The URL that specifies the behavior of this scalar.'] },
		['SCALAR'],
		false,
		'Exposes a URL that specifies the behavior of this scalar.',
	],
	oneOf: [
		{},
		['INPUT_OBJECT'],
		false,
		'Indicates exactly one field must be supplied and this field must not be `null`.',
	],
}

/**
 * Check if a type name is an introspection type
 */
export function isIntrospectionType(typeName: string): boolean {
	return typeName.startsWith('__')
}

const schemaWithIntrospectionCache = new WeakMap<Schema, Schema>()

const includesIntrospectionTypes = (schema: Schema): boolean => Object.entries(introspectionTypes).every(([name, type]) => schema.t[name] === type)

/**
 * Get the schema with introspection types merged in, memoized per `schema` object.
 * A schema that already holds them is returned as is, so it needs no per-schema copy of its type map.
 * The schema is treated as immutable once passed in.
 */
export function getSchemaWithIntrospection(schema: Schema): Schema {
	if (includesIntrospectionTypes(schema)) {
		return schema
	}
	let merged = schemaWithIntrospectionCache.get(schema)
	if (!merged) {
		merged = {
			...schema,
			t: {
				...schema.t,
				...introspectionTypes,
			},
		}
		schemaWithIntrospectionCache.set(schema, merged)
	}
	return merged
}
