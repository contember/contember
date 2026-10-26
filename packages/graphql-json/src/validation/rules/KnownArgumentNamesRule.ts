/**
 * Known argument names
 *
 * A GraphQL field is only valid if all supplied arguments are defined by
 * that field.
 *
 * See https://spec.graphql.org/draft/#sec-Argument-Names
 */
import type { ArgumentNode, ASTVisitor } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import { F } from '../../types/schema.js'
import type { ValidationContext } from '../ValidationContext.js'
import { didYouMean, isASTNode, suggestionList } from '../helpers.js'

export function KnownArgumentNamesRule(context: ValidationContext): ASTVisitor {
	return {
		Argument(argNode: ArgumentNode, _key, _parent, _path, ancestors) {
			const argDef = context.getArgument()
			const fieldDef = context.getFieldDef()
			const parentType = context.getParentType()

			if (!argDef && fieldDef && parentType) {
				const argName = argNode.name.value
				const args = F.args(fieldDef)
				const knownArgsNames = args ? Object.keys(args) : []
				const suggestions = suggestionList(argName, knownArgsNames)

				// Get field name from AST ancestors
				const fieldNode = ancestors[ancestors.length - 1]
				const fieldName = fieldNode && isASTNode(fieldNode) && fieldNode.kind === Kind.FIELD
					? fieldNode.name.value
					: '(unknown)'

				const parentTypeName = context.getParentTypeName() ?? '(unknown)'

				context.reportError(
					new GraphQLError(
						`Unknown argument "${argName}" on field "${parentTypeName}.${fieldName}".${didYouMean(suggestions)}`,
						{ nodes: argNode },
					),
				)
			}
		},
	}
}
