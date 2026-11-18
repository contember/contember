/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null without a
 * default value) field arguments have been provided.
 *
 * See https://spec.graphql.org/draft/#sec-Required-Arguments
 */
import type { ASTVisitor, DirectiveNode, FieldNode, InputValueDefinitionNode } from 'graphql'
import { GraphQLError, Kind, print } from 'graphql'

import { D } from '../../types/schema.js'
import { getSchemaDirectives } from '../../introspection/types.js'
import { formatTypeRef, isNonNullType } from '../../utils/typeRef.js'
import type { ValidationContext } from '../ValidationContext.js'

export function ProvidedRequiredArgumentsRule(context: ValidationContext): ASTVisitor {
	return {
		...ProvidedRequiredArgumentsOnDirectivesRule(context),

		Field: {
			// Validate on leave to allow for deeper errors to appear first.
			leave(fieldNode: FieldNode) {
				const fieldDef = context.getFieldDef()
				if (!fieldDef) {
					return false
				}

				const providedArgs = new Set(fieldNode.arguments?.map(arg => arg.name.value))

				// Field: [typeRef, args, description?, deprecationReason?]
				const args = fieldDef[1]
				if (!args) {
					return undefined
				}
				for (const argName in args) {
					const argDef = args[argName]
					// required: non-null without a default value
					if (!providedArgs.has(argName) && isNonNullType(argDef[0][0]) && argDef[1] === undefined) {
						context.reportError(
							new GraphQLError(
								`Field "${fieldNode.name.value}" argument "${argName}" of type "${formatTypeRef(argDef[0])}" is required, but it was not provided.`,
								{ nodes: fieldNode },
							),
						)
					}
				}
				return undefined
			},
		},
	}
}

function ProvidedRequiredArgumentsOnDirectivesRule(context: ValidationContext): ASTVisitor {
	// required argument names with their printed types, per directive
	const requiredArgsMap = new Map<string, Map<string, string>>()
	for (const [name, directive] of Object.entries(getSchemaDirectives(context.getSchema()))) {
		const requiredArgs = new Map<string, string>()
		const args = D.args(directive)
		for (const argName in args) {
			const argDef = args[argName]
			if (isNonNullType(argDef[0][0]) && argDef[1] === undefined) {
				requiredArgs.set(argName, formatTypeRef(argDef[0]))
			}
		}
		requiredArgsMap.set(name, requiredArgs)
	}
	for (const def of context.getDocument().definitions) {
		if (def.kind === Kind.DIRECTIVE_DEFINITION) {
			const requiredArgs = new Map<string, string>()
			for (const arg of def.arguments ?? []) {
				if (isRequiredArgumentNode(arg)) {
					requiredArgs.set(arg.name.value, print(arg.type))
				}
			}
			requiredArgsMap.set(def.name.value, requiredArgs)
		}
	}

	return {
		Directive: {
			// Validate on leave to allow for deeper errors to appear first.
			leave(directiveNode: DirectiveNode) {
				const directiveName = directiveNode.name.value
				const requiredArgs = requiredArgsMap.get(directiveName)
				if (requiredArgs) {
					const argNodeMap = new Set((directiveNode.arguments ?? []).map(arg => arg.name.value))
					for (const [argName, argType] of requiredArgs) {
						if (!argNodeMap.has(argName)) {
							context.reportError(
								new GraphQLError(`Directive "@${directiveName}" argument "${argName}" of type "${argType}" is required, but it was not provided.`, {
									nodes: directiveNode,
								}),
							)
						}
					}
				}
			},
		},
	}
}

function isRequiredArgumentNode(arg: InputValueDefinitionNode): boolean {
	return arg.type.kind === Kind.NON_NULL_TYPE && arg.defaultValue == null
}
