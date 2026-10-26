/**
 * Known directives
 *
 * A GraphQL document is only valid if all `@directives` are known by the
 * schema and legally positioned.
 *
 * See https://spec.graphql.org/draft/#sec-Directives-Are-Defined
 */
import type { ASTNode, ASTVisitor, DirectiveNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import { D } from '../../types/schema.js'
import type { ValidationContext } from '../ValidationContext.js'
import { didYouMean, isASTNode, suggestionList } from '../helpers.js'

// Built-in directives with their allowed locations
const BUILT_IN_DIRECTIVES: Record<string, readonly string[]> = {
	skip: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
	include: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
	deprecated: ['FIELD_DEFINITION', 'ARGUMENT_DEFINITION', 'INPUT_FIELD_DEFINITION', 'ENUM_VALUE'],
	specifiedBy: ['SCALAR'],
}

export function KnownDirectivesRule(context: ValidationContext): ASTVisitor {
	const schema = context.getSchema()

	// Build locations map from schema directives or use built-ins
	const locationsMap = new Map<string, readonly string[]>()

	if (schema.d) {
		for (const [name, directive] of Object.entries(schema.d)) {
			// Directive: [args, locations, isRepeatable?, description?]
			locationsMap.set(name, D.locations(directive))
		}
	} else {
		// Use built-in directives if schema doesn't define any
		for (const [name, locations] of Object.entries(BUILT_IN_DIRECTIVES)) {
			locationsMap.set(name, locations)
		}
	}

	return {
		Directive(node: DirectiveNode, _key, _parent, _path, ancestors) {
			const name = node.name.value
			const locations = locationsMap.get(name)

			if (!locations) {
				const allDirectiveNames = Array.from(locationsMap.keys())
				const suggestions = suggestionList(name, allDirectiveNames)
				context.reportError(
					new GraphQLError(
						`Unknown directive "@${name}".${didYouMean(suggestions)}`,
						{ nodes: node },
					),
				)
				return
			}

			const candidateLocation = getDirectiveLocationForASTPath(ancestors)
			if (candidateLocation && !locations.includes(candidateLocation)) {
				context.reportError(
					new GraphQLError(
						`Directive "@${name}" may not be used on ${candidateLocation}.`,
						{ nodes: node },
					),
				)
			}
		},
	}
}

function getDirectiveLocationForASTPath(
	ancestors: readonly (ASTNode | readonly ASTNode[])[],
): string | undefined {
	const appliedTo = ancestors[ancestors.length - 1]

	if (isASTNode(appliedTo)) {
		switch (appliedTo.kind) {
			case Kind.OPERATION_DEFINITION:
				return getOperationLocation(appliedTo.operation)
			case Kind.FIELD:
				return 'FIELD'
			case Kind.FRAGMENT_SPREAD:
				return 'FRAGMENT_SPREAD'
			case Kind.INLINE_FRAGMENT:
				return 'INLINE_FRAGMENT'
			case Kind.FRAGMENT_DEFINITION:
				return 'FRAGMENT_DEFINITION'
			case Kind.VARIABLE_DEFINITION:
				return 'VARIABLE_DEFINITION'
			// Schema definitions (for schema validation, not typically used in query validation)
			case Kind.SCHEMA_DEFINITION:
			case Kind.SCHEMA_EXTENSION:
				return 'SCHEMA'
			case Kind.SCALAR_TYPE_DEFINITION:
			case Kind.SCALAR_TYPE_EXTENSION:
				return 'SCALAR'
			case Kind.OBJECT_TYPE_DEFINITION:
			case Kind.OBJECT_TYPE_EXTENSION:
				return 'OBJECT'
			case Kind.FIELD_DEFINITION:
				return 'FIELD_DEFINITION'
			case Kind.INTERFACE_TYPE_DEFINITION:
			case Kind.INTERFACE_TYPE_EXTENSION:
				return 'INTERFACE'
			case Kind.UNION_TYPE_DEFINITION:
			case Kind.UNION_TYPE_EXTENSION:
				return 'UNION'
			case Kind.ENUM_TYPE_DEFINITION:
			case Kind.ENUM_TYPE_EXTENSION:
				return 'ENUM'
			case Kind.ENUM_VALUE_DEFINITION:
				return 'ENUM_VALUE'
			case Kind.INPUT_OBJECT_TYPE_DEFINITION:
			case Kind.INPUT_OBJECT_TYPE_EXTENSION:
				return 'INPUT_OBJECT'
			case Kind.INPUT_VALUE_DEFINITION: {
				// Could be ARGUMENT_DEFINITION or INPUT_FIELD_DEFINITION depending on parent
				const parentNode = ancestors[ancestors.length - 3]
				return parentNode && isASTNode(parentNode)
						&& (parentNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION || parentNode.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION)
					? 'INPUT_FIELD_DEFINITION'
					: 'ARGUMENT_DEFINITION'
			}
		}
	}
	return undefined
}

function getOperationLocation(operation: string): string {
	switch (operation) {
		case 'query':
			return 'QUERY'
		case 'mutation':
			return 'MUTATION'
		case 'subscription':
			return 'SUBSCRIPTION'
	}
	return 'QUERY'
}
