/**
 * Fragments on composite types
 *
 * Fragments use a type condition to determine if they apply, since fragments
 * can only be spread into a composite type (object, interface, or union), the
 * type condition must also be a composite type.
 *
 * See https://spec.graphql.org/draft/#sec-Fragments-On-Composite-Types
 */
import type { ASTVisitor, NamedTypeNode } from 'graphql'
import { GraphQLError } from 'graphql'

import { isCompositeType, type Schema } from '../../types/schema.js'
import type { ValidationContext } from '../ValidationContext.js'
import { getOwn } from '../../utils/helpers.js'

export function FragmentsOnCompositeTypesRule(context: ValidationContext): ASTVisitor {
	return {
		InlineFragment(node) {
			const typeCondition = node.typeCondition
			if (typeCondition) {
				const type = getTypeFromCondition(context.getSchema(), typeCondition)
				if (type && !isCompositeType(type)) {
					context.reportError(
						new GraphQLError(
							`Fragment cannot condition on non composite type "${typeCondition.name.value}".`,
							{ nodes: typeCondition },
						),
					)
				}
			}
		},
		FragmentDefinition(node) {
			const type = getTypeFromCondition(context.getSchema(), node.typeCondition)
			if (type && !isCompositeType(type)) {
				context.reportError(
					new GraphQLError(
						`Fragment "${node.name.value}" cannot condition on non composite type "${node.typeCondition.name.value}".`,
						{ nodes: node.typeCondition },
					),
				)
			}
		},
	}
}

function getTypeFromCondition(schema: Schema, typeCondition: NamedTypeNode) {
	return getOwn(schema.t, typeCondition.name.value)
}
