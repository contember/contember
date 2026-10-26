/**
 * Introspection resolvers for GraphQL execution
 *
 * These resolvers bridge the introspection data structures to the GraphQL resolver interface.
 */

import type { ResolverMap } from '../types/resolvers.js'
import {
	DirectiveResolvers,
	EnumValueResolvers,
	FieldResolvers,
	InputValueResolvers,
	resolveSchema,
	resolveType,
	SchemaResolvers,
	TypeResolvers,
} from '../introspection/resolvers.js'

/**
 * Introspection resolvers map
 *
 * Note: We use type assertions here because the introspection data structures
 * are internal and not exposed to the public API. The resolvers receive
 * properly typed data from the introspection system.
 */
export const introspectionResolvers: ResolverMap = {
	// __Schema resolvers
	__Schema: {
		description: (source) => SchemaResolvers.description(source as any),
		types: (source) => SchemaResolvers.types(source as any),
		queryType: (source) => SchemaResolvers.queryType(source as any),
		mutationType: (source) => SchemaResolvers.mutationType(source as any),
		subscriptionType: (source) => SchemaResolvers.subscriptionType(source as any),
		directives: (source) => SchemaResolvers.directives(source as any),
	},

	// __Type resolvers
	__Type: {
		kind: (source) => TypeResolvers.kind(source as any),
		name: (source) => TypeResolvers.name(source as any),
		description: (source) => TypeResolvers.description(source as any),
		specifiedByURL: (source) => TypeResolvers.specifiedByURL(source as any),
		fields: (source, args) => TypeResolvers.fields(source as any, (args ?? {}) as any),
		interfaces: (source) => TypeResolvers.interfaces(source as any),
		possibleTypes: (source) => TypeResolvers.possibleTypes(source as any),
		enumValues: (source, args) => TypeResolvers.enumValues(source as any, (args ?? {}) as any),
		inputFields: (source, args) => TypeResolvers.inputFields(source as any, (args ?? {}) as any),
		ofType: (source) => TypeResolvers.ofType(source as any),
		isOneOf: (source) => TypeResolvers.isOneOf(source as any),
	},

	// __Field resolvers
	__Field: {
		name: (source) => FieldResolvers.name(source as any),
		description: (source) => FieldResolvers.description(source as any),
		args: (source, args) => FieldResolvers.args(source as any, (args ?? {}) as any),
		type: (source) => FieldResolvers.type(source as any),
		isDeprecated: (source) => FieldResolvers.isDeprecated(source as any),
		deprecationReason: (source) => FieldResolvers.deprecationReason(source as any),
	},

	// __InputValue resolvers
	__InputValue: {
		name: (source) => InputValueResolvers.name(source as any),
		description: (source) => InputValueResolvers.description(source as any),
		type: (source) => InputValueResolvers.type(source as any),
		defaultValue: (source) => InputValueResolvers.defaultValue(source as any),
		isDeprecated: (source) => InputValueResolvers.isDeprecated(source as any),
		deprecationReason: (source) => InputValueResolvers.deprecationReason(source as any),
	},

	// __EnumValue resolvers
	__EnumValue: {
		name: (source) => EnumValueResolvers.name(source as any),
		description: (source) => EnumValueResolvers.description(source as any),
		isDeprecated: (source) => EnumValueResolvers.isDeprecated(source as any),
		deprecationReason: (source) => EnumValueResolvers.deprecationReason(source as any),
	},

	// __Directive resolvers
	__Directive: {
		name: (source) => DirectiveResolvers.name(source as any),
		description: (source) => DirectiveResolvers.description(source as any),
		isRepeatable: (source) => DirectiveResolvers.isRepeatable(source as any),
		locations: (source) => DirectiveResolvers.locations(source as any),
		args: (source, args) => DirectiveResolvers.args(source as any, (args ?? {}) as any),
	},
}

export { resolveSchema, resolveType }
