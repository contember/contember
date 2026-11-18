/**
 * Known argument names
 *
 * A GraphQL field is only valid if all supplied arguments are defined by
 * that field.
 *
 * See https://spec.graphql.org/draft/#sec-Argument-Names
 */
import type { ArgumentNode, ASTVisitor, DirectiveNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import { D, F } from '../../types/schema.js'
import { getSchemaDirectives } from '../../introspection/types.js'
import type { ValidationContext } from '../ValidationContext.js'
import { didYouMean, isASTNode, suggestionList } from '../helpers.js'

export function KnownArgumentNamesRule(context: ValidationContext): ASTVisitor {
	return {
		...KnownArgumentNamesOnDirectivesRule(context),

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

function KnownArgumentNamesOnDirectivesRule(context: ValidationContext): ASTVisitor {
	const directiveArgs = new Map<string, string[]>()
	for (const [name, directive] of Object.entries(getSchemaDirectives(context.getSchema()))) {
		directiveArgs.set(name, Object.keys(D.args(directive)))
	}
	for (const def of context.getDocument().definitions) {
		if (def.kind === Kind.DIRECTIVE_DEFINITION) {
			directiveArgs.set(def.name.value, (def.arguments ?? []).map(arg => arg.name.value))
		}
	}

	return {
		Directive(directiveNode: DirectiveNode) {
			const directiveName = directiveNode.name.value
			const knownArgs = directiveArgs.get(directiveName)

			if (directiveNode.arguments && knownArgs) {
				for (const argNode of directiveNode.arguments) {
					const argName = argNode.name.value
					if (!knownArgs.includes(argName)) {
						const suggestions = suggestionList(argName, knownArgs)
						context.reportError(
							new GraphQLError(`Unknown argument "${argName}" on directive "@${directiveName}".` + didYouMean(suggestions), { nodes: argNode }),
						)
					}
				}
			}

			return false
		},
	}
}
