/**
 * Introspection resolvers for GraphQL execution
 *
 * These resolvers bridge the introspection data structures to the GraphQL resolver interface.
 */

import type { ResolverMap } from '../types/resolvers.js'
import {
	DirectiveIntrospectionData,
	DirectiveResolvers,
	EnumValueIntrospectionData,
	EnumValueResolvers,
	FieldIntrospectionData,
	FieldResolvers,
	InputValueIntrospectionData,
	InputValueResolvers,
	resolveSchema,
	resolveType,
	SchemaIntrospectionData,
	SchemaResolvers,
	TypeIntrospectionData,
	TypeResolvers,
	TypeWrapper,
} from '../introspection/resolvers.js'

/**
 * Narrow the source of an introspection field to the data the introspection system produced for its parent type
 */
function sourceOf<T>(dataClass: abstract new(...args: never[]) => T, source: unknown): T {
	if (source instanceof dataClass) {
		return source
	}
	throw new Error(`Introspection field resolved on a source that is not ${dataClass.name}.`)
}

function typeSource(source: unknown): TypeIntrospectionData | TypeWrapper {
	if (source instanceof TypeIntrospectionData || source instanceof TypeWrapper) {
		return source
	}
	throw new Error('Introspection field resolved on a source that is not a __Type.')
}

function deprecationArgs(args: Record<string, unknown>): { includeDeprecated: boolean } {
	return { includeDeprecated: Boolean(args.includeDeprecated) }
}

const schemaSource = (source: unknown) => sourceOf(SchemaIntrospectionData, source)
const fieldSource = (source: unknown) => sourceOf(FieldIntrospectionData, source)
const inputValueSource = (source: unknown) => sourceOf(InputValueIntrospectionData, source)
const enumValueSource = (source: unknown) => sourceOf(EnumValueIntrospectionData, source)
const directiveSource = (source: unknown) => sourceOf(DirectiveIntrospectionData, source)

/**
 * Introspection resolvers map
 */
export const introspectionResolvers: ResolverMap = {
	// __Schema resolvers
	__Schema: {
		description: (source) => SchemaResolvers.description(schemaSource(source)),
		types: (source) => SchemaResolvers.types(schemaSource(source)),
		queryType: (source) => SchemaResolvers.queryType(schemaSource(source)),
		mutationType: (source) => SchemaResolvers.mutationType(schemaSource(source)),
		subscriptionType: (source) => SchemaResolvers.subscriptionType(schemaSource(source)),
		directives: (source) => SchemaResolvers.directives(schemaSource(source)),
	},

	// __Type resolvers
	__Type: {
		kind: (source) => TypeResolvers.kind(typeSource(source)),
		name: (source) => TypeResolvers.name(typeSource(source)),
		description: (source) => TypeResolvers.description(typeSource(source)),
		specifiedByURL: (source) => TypeResolvers.specifiedByURL(typeSource(source)),
		fields: (source, args) => TypeResolvers.fields(typeSource(source), deprecationArgs(args)),
		interfaces: (source) => TypeResolvers.interfaces(typeSource(source)),
		possibleTypes: (source) => TypeResolvers.possibleTypes(typeSource(source)),
		enumValues: (source, args) => TypeResolvers.enumValues(typeSource(source), deprecationArgs(args)),
		inputFields: (source, args) => TypeResolvers.inputFields(typeSource(source), deprecationArgs(args)),
		ofType: (source) => TypeResolvers.ofType(typeSource(source)),
		isOneOf: (source) => TypeResolvers.isOneOf(typeSource(source)),
	},

	// __Field resolvers
	__Field: {
		name: (source) => FieldResolvers.name(fieldSource(source)),
		description: (source) => FieldResolvers.description(fieldSource(source)),
		args: (source, args) => FieldResolvers.args(fieldSource(source), deprecationArgs(args)),
		type: (source) => FieldResolvers.type(fieldSource(source)),
		isDeprecated: (source) => FieldResolvers.isDeprecated(fieldSource(source)),
		deprecationReason: (source) => FieldResolvers.deprecationReason(fieldSource(source)),
	},

	// __InputValue resolvers
	__InputValue: {
		name: (source) => InputValueResolvers.name(inputValueSource(source)),
		description: (source) => InputValueResolvers.description(inputValueSource(source)),
		type: (source) => InputValueResolvers.type(inputValueSource(source)),
		defaultValue: (source) => InputValueResolvers.defaultValue(inputValueSource(source)),
		isDeprecated: (source) => InputValueResolvers.isDeprecated(inputValueSource(source)),
		deprecationReason: (source) => InputValueResolvers.deprecationReason(inputValueSource(source)),
	},

	// __EnumValue resolvers
	__EnumValue: {
		name: (source) => EnumValueResolvers.name(enumValueSource(source)),
		description: (source) => EnumValueResolvers.description(enumValueSource(source)),
		isDeprecated: (source) => EnumValueResolvers.isDeprecated(enumValueSource(source)),
		deprecationReason: (source) => EnumValueResolvers.deprecationReason(enumValueSource(source)),
	},

	// __Directive resolvers
	__Directive: {
		name: (source) => DirectiveResolvers.name(directiveSource(source)),
		description: (source) => DirectiveResolvers.description(directiveSource(source)),
		isRepeatable: (source) => DirectiveResolvers.isRepeatable(directiveSource(source)),
		locations: (source) => DirectiveResolvers.locations(directiveSource(source)),
		args: (source, args) => DirectiveResolvers.args(directiveSource(source), deprecationArgs(args)),
	},
}

export { resolveSchema, resolveType }
