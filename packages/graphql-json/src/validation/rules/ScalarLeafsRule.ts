/**
 * Scalar leafs
 *
 * A GraphQL document is only valid if all leaf fields (fields without sub selections)
 * are of scalar or enum types.
 *
 * See https://spec.graphql.org/draft/#sec-Leaf-Field-Selections
 */
import type { ASTVisitor, FieldNode } from 'graphql'
import { GraphQLError } from 'graphql'

import { isLeafType } from '../../types/schema.js'
import { formatTypeRef, getNamedType } from '../../utils/typeRef.js'
import type { ValidationContext } from '../ValidationContext.js'

export function ScalarLeafsRule(context: ValidationContext): ASTVisitor {
	return {
		Field(node: FieldNode) {
			const typeRef = context.getType()
			const selectionSet = node.selectionSet

			if (typeRef) {
				const schema = context.getSchema()
				const typeName = getNamedType(typeRef)
				const type = schema.t[typeName]

				if (type) {
					if (isLeafType(type)) {
						if (selectionSet) {
							context.reportError(
								new GraphQLError(
									`Field "${node.name.value}" must not have a selection since type "${formatTypeRef(typeRef)}" has no subfields.`,
									{ nodes: selectionSet },
								),
							)
						}
					} else if (!selectionSet) {
						context.reportError(
							new GraphQLError(
								`Field "${node.name.value}" of type "${
									formatTypeRef(typeRef)
								}" must have a selection of subfields. Did you mean "${node.name.value} { ... }"?`,
								{ nodes: node },
							),
						)
					}
				}
			}
		},
	}
}
