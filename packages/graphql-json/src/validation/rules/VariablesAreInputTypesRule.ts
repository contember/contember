/**
 * Variables are input types
 *
 * A GraphQL operation is only valid if all the variables it defines are of
 * input types (scalar, enum, or input object).
 *
 * See https://spec.graphql.org/draft/#sec-Variables-Are-Input-Types
 */
import type { ASTVisitor, VariableDefinitionNode } from 'graphql'
import { GraphQLError, print } from 'graphql'

import { getNamedType } from '../../utils/typeRef.js'
import { isInputType } from '../helpers.js'
import type { ValidationContext } from '../ValidationContext.js'

export function VariablesAreInputTypesRule(context: ValidationContext): ASTVisitor {
	return {
		VariableDefinition(node: VariableDefinitionNode) {
			const typeRef = context.getInputType()

			if (typeRef) {
				const schema = context.getSchema()
				const typeName = getNamedType(typeRef)
				const type = schema.t[typeName]

				if (type && !isInputType(type)) {
					const varName = node.variable.name.value
					context.reportError(
						new GraphQLError(
							`Variable "$${varName}" cannot be non-input type "${print(node.type)}".`,
							{ nodes: node.type },
						),
					)
				}
			}
		},
	}
}
