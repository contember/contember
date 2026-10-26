/**
 * Introspection resolvers
 *
 * Implements resolvers for introspection meta-fields (__schema, __type)
 * and all introspection types.
 */

import type { Argument, Directive, EnumValue, Field, InputField, Schema, TypeRef } from '../types/schema.js'
import { A, D, EV, F, isEnumType, isInputObjectType, isInterfaceType, isObjectType, isUnionType, T, TypeKind } from '../types/schema.js'
import { builtInDirectives, IntrospectionTypeKind } from './types.js'
import type { IntrospectionTypeKindValue } from './types.js'

/**
 * Introspection type wrapper - represents a type in introspection
 */
export interface IntrospectionTypeWrapper {
	kind: IntrospectionTypeKindValue
	name: string | null
	ofType: IntrospectionTypeWrapper | null
	// Schema reference for resolving additional fields
	_schema?: Schema
	_typeName?: string
}

/** The wrapper the introspection resolvers produce, so a `__Type` source can be recognized */
export class TypeWrapper implements IntrospectionTypeWrapper {
	constructor(
		readonly kind: IntrospectionTypeKindValue,
		readonly name: string | null,
		readonly ofType: TypeWrapper | null,
		readonly _schema?: Schema,
		readonly _typeName?: string,
	) {}
}

/**
 * Pattern metadata for each pattern ID
 * [isOuterNonNull, isOuterList, innerPattern or -1 if named]
 */
const PATTERN_META: readonly [boolean, boolean, number][] = [
	// 0: T (Named)
	[false, false, -1],
	// 1: T! (NonNull<Named>)
	[true, false, -1],
	// 2: [T] (List<Named>)
	[false, true, 0],
	// 3: [T!] (List<NonNull<Named>>)
	[false, true, 1],
	// 4: [T]! (NonNull<List<Named>>)
	[true, true, 0],
	// 5: [T!]! (NonNull<List<NonNull<Named>>>)
	[true, true, 1],
	// 6: [[T]] (List<List<Named>>)
	[false, true, 2],
	// 7: [[T!]] (List<List<NonNull<Named>>>)
	[false, true, 3],
	// 8: [[T]!] (List<NonNull<List<Named>>>)
	[false, true, 4],
	// 9: [[T!]!] (List<NonNull<List<NonNull<Named>>>>)
	[false, true, 5],
	// 10: [[T]]! (NonNull<List<List<Named>>>)
	[true, true, 2],
	// 11: [[T]!]! (NonNull<List<NonNull<List<Named>>>>)
	[true, true, 4],
	// 12: [[T!]]! (NonNull<List<List<NonNull<Named>>>>)
	[true, true, 3],
	// 13: [[T!]!]! (NonNull<List<NonNull<List<NonNull<Named>>>>>)
	[true, true, 5],
]

/**
 * Convert internal TypeKind to introspection __TypeKind
 */
function typeKindToIntrospection(kind: TypeKind): IntrospectionTypeKindValue {
	switch (kind) {
		case TypeKind.SCALAR:
			return IntrospectionTypeKind.SCALAR
		case TypeKind.OBJECT:
			return IntrospectionTypeKind.OBJECT
		case TypeKind.INTERFACE:
			return IntrospectionTypeKind.INTERFACE
		case TypeKind.UNION:
			return IntrospectionTypeKind.UNION
		case TypeKind.ENUM:
			return IntrospectionTypeKind.ENUM
		case TypeKind.INPUT_OBJECT:
			return IntrospectionTypeKind.INPUT_OBJECT
	}
}

/**
 * Convert TypeRef pattern to nested type wrapper for introspection
 *
 * Example: [5, "User"] = [User!]! becomes:
 * {
 *   kind: 'NON_NULL',
 *   name: null,
 *   ofType: {
 *     kind: 'LIST',
 *     name: null,
 *     ofType: {
 *       kind: 'NON_NULL',
 *       name: null,
 *       ofType: { kind: 'OBJECT', name: 'User', ofType: null }
 *     }
 *   }
 * }
 */
export function typeRefToWrapper(typeRef: TypeRef, schema: Schema): TypeWrapper {
	const [pattern, typeName] = typeRef
	return buildWrapper(pattern, typeName, schema)
}

function buildWrapper(pattern: number, typeName: string, schema: Schema): TypeWrapper {
	const meta = PATTERN_META[pattern]
	if (!meta) {
		// Fallback to named type
		return createNamedTypeWrapper(typeName, schema)
	}

	const [isNonNull, isList, innerPattern] = meta

	// Base case: named type (pattern 0 or innerPattern is -1)
	if (innerPattern === -1 && !isNonNull) {
		return createNamedTypeWrapper(typeName, schema)
	}

	// NonNull wrapper
	if (isNonNull) {
		// Unwrap non-null and recurse
		const innerWithoutNonNull = unwrapNonNullPattern(pattern)
		return new TypeWrapper(IntrospectionTypeKind.NON_NULL, null, buildWrapper(innerWithoutNonNull, typeName, schema))
	}

	// List wrapper
	if (isList) {
		return new TypeWrapper(IntrospectionTypeKind.LIST, null, buildWrapper(innerPattern, typeName, schema))
	}

	// Fallback
	return createNamedTypeWrapper(typeName, schema)
}

/**
 * Unwrap NonNull from pattern, returning the inner pattern
 */
function unwrapNonNullPattern(pattern: number): number {
	switch (pattern) {
		case 1:
			return 0 // T! -> T
		case 4:
			return 2 // [T]! -> [T]
		case 5:
			return 3 // [T!]! -> [T!]
		case 10:
			return 6 // [[T]]! -> [[T]]
		case 11:
			return 8 // [[T]!]! -> [[T]!]
		case 12:
			return 7 // [[T!]]! -> [[T!]]
		case 13:
			return 9 // [[T!]!]! -> [[T!]!]
		default:
			return pattern
	}
}

/**
 * Create a wrapper for a named type
 */
function createNamedTypeWrapper(typeName: string, schema: Schema): TypeWrapper {
	const type = schema.t[typeName]
	const kind = type ? typeKindToIntrospection(T.kind(type)) : IntrospectionTypeKind.SCALAR

	return new TypeWrapper(kind, typeName, null, schema, typeName)
}

// =============================================================================
// Schema Introspection Data
// =============================================================================

// Classes rather than plain objects, so the introspection resolvers can recognize their sources with instanceof

export class SchemaIntrospectionData {
	constructor(readonly _schema: Schema) {}
}

export class TypeIntrospectionData {
	constructor(readonly _schema: Schema, readonly _typeName: string) {}
}

export class FieldIntrospectionData {
	constructor(readonly _schema: Schema, readonly _fieldName: string, readonly _field: Field) {}
}

export class InputValueIntrospectionData {
	constructor(
		readonly _schema: Schema,
		readonly _name: string,
		readonly _arg: Argument | InputField,
		readonly _deprecationReason?: string,
	) {}
}

export class EnumValueIntrospectionData {
	constructor(readonly _name: string, readonly _enumValue: EnumValue) {}
}

export class DirectiveIntrospectionData {
	constructor(readonly _schema: Schema, readonly _name: string, readonly _directive: Directive) {}
}

// =============================================================================
// __schema resolver
// =============================================================================

export function resolveSchema(schema: Schema): SchemaIntrospectionData {
	return new SchemaIntrospectionData(schema)
}

// =============================================================================
// __type(name: String!) resolver
// =============================================================================

export function resolveType(schema: Schema, name: string): TypeIntrospectionData | null {
	if (!schema.t[name]) {
		return null
	}
	return new TypeIntrospectionData(schema, name)
}

// =============================================================================
// __Schema resolvers
// =============================================================================

export const SchemaResolvers = {
	description: (_data: SchemaIntrospectionData): string | null => {
		return null // Schema description not stored in our format
	},

	types: (data: SchemaIntrospectionData): TypeIntrospectionData[] => {
		const schema = data._schema
		const types: TypeIntrospectionData[] = []

		for (const typeName of Object.keys(schema.t)) {
			types.push(new TypeIntrospectionData(schema, typeName))
		}

		// Sort alphabetically for consistent output
		types.sort((a, b) => a._typeName.localeCompare(b._typeName))

		return types
	},

	queryType: (data: SchemaIntrospectionData): TypeIntrospectionData => {
		return new TypeIntrospectionData(data._schema, data._schema.q)
	},

	mutationType: (data: SchemaIntrospectionData): TypeIntrospectionData | null => {
		const mutationType = data._schema.m
		if (!mutationType) return null
		return new TypeIntrospectionData(data._schema, mutationType)
	},

	subscriptionType: (data: SchemaIntrospectionData): TypeIntrospectionData | null => {
		const subscriptionType = data._schema.s
		if (!subscriptionType) return null
		return new TypeIntrospectionData(data._schema, subscriptionType)
	},

	directives: (data: SchemaIntrospectionData): DirectiveIntrospectionData[] => {
		const schema = data._schema
		const directives: DirectiveIntrospectionData[] = []

		// Add built-in directives
		for (const [name, directive] of Object.entries(builtInDirectives)) {
			directives.push(new DirectiveIntrospectionData(schema, name, directive))
		}

		// Add schema-defined directives
		if (schema.d) {
			for (const [name, directive] of Object.entries(schema.d)) {
				// Skip if already added as built-in
				if (name in builtInDirectives) continue
				directives.push(new DirectiveIntrospectionData(schema, name, directive))
			}
		}

		return directives
	},
}

// =============================================================================
// __Type resolvers
// =============================================================================

export const TypeResolvers = {
	kind: (data: TypeIntrospectionData | TypeWrapper): IntrospectionTypeKindValue => {
		if (data instanceof TypeWrapper) {
			return data.kind
		}
		const type = data._schema.t[data._typeName]
		return type ? typeKindToIntrospection(T.kind(type)) : IntrospectionTypeKind.SCALAR
	},

	name: (data: TypeIntrospectionData | TypeWrapper): string | null => {
		if (data instanceof TypeWrapper) {
			return data.name
		}
		return data._typeName
	},

	description: (data: TypeIntrospectionData | TypeWrapper): string | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null
		const type = typeData._schema.t[typeData._typeName]
		return type ? T.description(type) ?? null : null
	},

	specifiedByURL: (_data: TypeIntrospectionData | TypeWrapper): string | null => {
		// Not implemented in our schema format
		return null
	},

	fields: (
		data: TypeIntrospectionData | TypeWrapper,
		args: { includeDeprecated?: boolean },
	): FieldIntrospectionData[] | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || (!isObjectType(type) && !isInterfaceType(type))) {
			return null
		}

		const fields = type[1]
		const result: FieldIntrospectionData[] = []

		for (const [fieldName, field] of Object.entries(fields)) {
			const deprecationReason = F.deprecationReason(field)
			if (!args.includeDeprecated && deprecationReason !== undefined) {
				continue
			}
			result.push(new FieldIntrospectionData(typeData._schema, fieldName, field))
		}

		// Sort alphabetically
		result.sort((a, b) => a._fieldName.localeCompare(b._fieldName))

		return result
	},

	interfaces: (data: TypeIntrospectionData | TypeWrapper): TypeIntrospectionData[] | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || (!isObjectType(type) && !isInterfaceType(type))) {
			return null
		}

		const interfaces = T.interfaces(type)
		return interfaces.map(name => new TypeIntrospectionData(typeData._schema, name))
	},

	possibleTypes: (data: TypeIntrospectionData | TypeWrapper): TypeIntrospectionData[] | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || (!isInterfaceType(type) && !isUnionType(type))) {
			return null
		}

		const possibleTypes = T.possibleTypes(type)
		return possibleTypes.map(name => new TypeIntrospectionData(typeData._schema, name))
	},

	enumValues: (
		data: TypeIntrospectionData | TypeWrapper,
		args: { includeDeprecated?: boolean },
	): EnumValueIntrospectionData[] | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || !isEnumType(type)) {
			return null
		}

		const values = T.values(type)
		const result: EnumValueIntrospectionData[] = []

		for (const [name, value] of Object.entries(values)) {
			const deprecationReason = EV.deprecationReason(value)
			if (!args.includeDeprecated && deprecationReason !== undefined) {
				continue
			}
			result.push(new EnumValueIntrospectionData(name, value))
		}

		// Sort alphabetically
		result.sort((a, b) => a._name.localeCompare(b._name))

		return result
	},

	inputFields: (
		data: TypeIntrospectionData | TypeWrapper,
		_args: { includeDeprecated?: boolean },
	): InputValueIntrospectionData[] | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || !isInputObjectType(type)) {
			return null
		}

		const fields = T.inputFields(type)
		const result: InputValueIntrospectionData[] = []

		for (const [name, field] of Object.entries(fields)) {
			// Input fields don't have deprecation in our format, but we include the check for compatibility
			result.push(new InputValueIntrospectionData(typeData._schema, name, field))
		}

		// Sort alphabetically
		result.sort((a, b) => a._name.localeCompare(b._name))

		return result
	},

	ofType: (data: TypeIntrospectionData | TypeWrapper): TypeWrapper | null => {
		if (data instanceof TypeWrapper) {
			return data.ofType
		}
		return null
	},

	isOneOf: (data: TypeIntrospectionData | TypeWrapper): boolean | null => {
		const typeData = getTypeData(data)
		if (!typeData) return null

		const type = typeData._schema.t[typeData._typeName]
		if (!type || !isInputObjectType(type)) {
			return null
		}

		return T.isOneOf(type) ?? null
	},
}

function getTypeData(data: TypeIntrospectionData | TypeWrapper): TypeIntrospectionData | null {
	if (data instanceof TypeIntrospectionData) {
		return data
	}
	// Only a named wrapper carries a schema
	if (data._schema && data.name) {
		return new TypeIntrospectionData(data._schema, data.name)
	}
	return null
}

// =============================================================================
// __Field resolvers
// =============================================================================

export const FieldResolvers = {
	name: (data: FieldIntrospectionData): string => {
		return data._fieldName
	},

	description: (data: FieldIntrospectionData): string | null => {
		return F.description(data._field) ?? null
	},

	args: (
		data: FieldIntrospectionData,
		_args: { includeDeprecated?: boolean },
	): InputValueIntrospectionData[] => {
		const fieldArgs = F.args(data._field)
		if (!fieldArgs) return []

		const result: InputValueIntrospectionData[] = []
		for (const [name, arg] of Object.entries(fieldArgs)) {
			// Arguments don't have deprecation in our format
			result.push(new InputValueIntrospectionData(data._schema, name, arg))
		}

		// Sort alphabetically
		result.sort((a, b) => a._name.localeCompare(b._name))

		return result
	},

	type: (data: FieldIntrospectionData): TypeWrapper => {
		return typeRefToWrapper(F.type(data._field), data._schema)
	},

	isDeprecated: (data: FieldIntrospectionData): boolean => {
		return F.deprecationReason(data._field) !== undefined
	},

	deprecationReason: (data: FieldIntrospectionData): string | null => {
		return F.deprecationReason(data._field) ?? null
	},
}

// =============================================================================
// __InputValue resolvers
// =============================================================================

export const InputValueResolvers = {
	name: (data: InputValueIntrospectionData): string => {
		return data._name
	},

	description: (data: InputValueIntrospectionData): string | null => {
		return A.description(data._arg) ?? null
	},

	type: (data: InputValueIntrospectionData): TypeWrapper => {
		return typeRefToWrapper(A.type(data._arg), data._schema)
	},

	defaultValue: (data: InputValueIntrospectionData): string | null => {
		const defaultVal = A.defaultValue(data._arg)
		if (defaultVal === undefined) return null
		// Format as GraphQL literal
		return formatValueAsGraphQL(defaultVal)
	},

	isDeprecated: (data: InputValueIntrospectionData): boolean => {
		return data._deprecationReason !== undefined
	},

	deprecationReason: (data: InputValueIntrospectionData): string | null => {
		return data._deprecationReason ?? null
	},
}

/**
 * Format a value as a GraphQL literal string
 */
function formatValueAsGraphQL(value: unknown): string {
	if (value === null) {
		return 'null'
	}
	if (typeof value === 'string') {
		return JSON.stringify(value)
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}
	if (Array.isArray(value)) {
		return '[' + value.map(formatValueAsGraphQL).join(', ') + ']'
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value)
		return '{' + entries.map(([k, v]) => `${k}: ${formatValueAsGraphQL(v)}`).join(', ') + '}'
	}
	return String(value)
}

// =============================================================================
// __EnumValue resolvers
// =============================================================================

export const EnumValueResolvers = {
	name: (data: EnumValueIntrospectionData): string => {
		return data._name
	},

	description: (data: EnumValueIntrospectionData): string | null => {
		return EV.description(data._enumValue) ?? null
	},

	isDeprecated: (data: EnumValueIntrospectionData): boolean => {
		return EV.deprecationReason(data._enumValue) !== undefined
	},

	deprecationReason: (data: EnumValueIntrospectionData): string | null => {
		return EV.deprecationReason(data._enumValue) ?? null
	},
}

// =============================================================================
// __Directive resolvers
// =============================================================================

export const DirectiveResolvers = {
	name: (data: DirectiveIntrospectionData): string => {
		return data._name
	},

	description: (data: DirectiveIntrospectionData): string | null => {
		return D.description(data._directive) ?? null
	},

	isRepeatable: (data: DirectiveIntrospectionData): boolean => {
		return D.isRepeatable(data._directive) ?? false
	},

	locations: (data: DirectiveIntrospectionData): string[] => {
		return D.locations(data._directive)
	},

	args: (
		data: DirectiveIntrospectionData,
		_args: { includeDeprecated?: boolean },
	): InputValueIntrospectionData[] => {
		const directiveArgs = D.args(data._directive)
		if (!directiveArgs) return []

		const result: InputValueIntrospectionData[] = []
		for (const [name, arg] of Object.entries(directiveArgs)) {
			result.push(new InputValueIntrospectionData(data._schema, name, arg))
		}

		// Sort alphabetically
		result.sort((a, b) => a._name.localeCompare(b._name))

		return result
	},
}
