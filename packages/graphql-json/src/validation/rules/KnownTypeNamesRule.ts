/**
 * Known type names
 *
 * A GraphQL document is only valid if referenced types (specifically
 * variable definitions and fragment conditions) are defined by the type schema.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-Spread-Type-Existence
 */
import type { ASTVisitor, NamedTypeNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'
import { getOwn } from '../../utils/helpers.js'
import { didYouMean, suggestionList } from '../helpers.js'

// Built-in introspection types that should always be valid
const INTROSPECTION_TYPES = new Set([
	'__Schema',
	'__Type',
	'__Field',
	'__InputValue',
	'__EnumValue',
	'__Directive',
	'__DirectiveLocation',
])

export function KnownTypeNamesRule(context: ValidationContext): ASTVisitor {
	const schema = context.getSchema()

	return {
		NamedType(node: NamedTypeNode) {
			const typeName = node.name.value

			// Allow introspection types
			if (INTROSPECTION_TYPES.has(typeName)) {
				return
			}

			// Check if type exists in schema
			if (!getOwn(schema.t, typeName)) {
				const suggestions = suggestionList(typeName, Object.keys(schema.t))
				context.reportError(
					new GraphQLError(
						`Unknown type "${typeName}".${didYouMean(suggestions)}`,
						{ nodes: node },
					),
				)
			}
		},
	}
}
