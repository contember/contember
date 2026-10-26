/**
 * Unique directives per location
 *
 * A GraphQL document is only valid if all non-repeatable directives at a given
 * location are uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Directives-Are-Unique-Per-Location
 */
import type { ASTNode, ASTVisitor, DirectiveNode } from 'graphql'
import { GraphQLError } from 'graphql'

import { D } from '../../types/schema.js'
import type { ValidationContext } from '../ValidationContext.js'

// Built-in directives - none of them are repeatable
const NON_REPEATABLE_BUILT_INS = new Set(['skip', 'include', 'deprecated', 'specifiedBy'])

export function UniqueDirectivesPerLocationRule(context: ValidationContext): ASTVisitor {
	const schema = context.getSchema()

	// Build set of repeatable directive names from schema
	const repeatableDirectives = new Set<string>()
	if (schema.d) {
		for (const [name, directive] of Object.entries(schema.d)) {
			// Directive: [args, locations, isRepeatable?, description?]
			if (D.isRepeatable(directive)) {
				repeatableDirectives.add(name)
			}
		}
	}

	// Helper to check if a directive is repeatable
	const isRepeatable = (name: string): boolean => {
		if (repeatableDirectives.has(name)) {
			return true
		}
		// Built-in directives are not repeatable
		if (NON_REPEATABLE_BUILT_INS.has(name)) {
			return false
		}
		// Unknown directives are treated as non-repeatable by default
		return false
	}

	return {
		enter(node: ASTNode) {
			if (!('directives' in node) || !node.directives) {
				return
			}

			const seenDirectives = new Map<string, DirectiveNode>()

			for (const directive of node.directives as readonly DirectiveNode[]) {
				const directiveName = directive.name.value

				if (!isRepeatable(directiveName)) {
					const seenDirective = seenDirectives.get(directiveName)
					if (seenDirective) {
						context.reportError(
							new GraphQLError(
								`The directive "@${directiveName}" can only be used once at this location.`,
								{ nodes: [seenDirective, directive] },
							),
						)
					} else {
						seenDirectives.set(directiveName, directive)
					}
				}
			}
		},
	}
}
