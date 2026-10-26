/**
 * Executable definitions
 *
 * A GraphQL document is only valid for execution if all definitions are
 * executable (operations and fragments). Schema definitions and extensions
 * are not executable.
 *
 * See https://spec.graphql.org/draft/#sec-Executable-Definitions
 */
import type { ASTVisitor, DefinitionNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function ExecutableDefinitionsRule(context: ValidationContext): ASTVisitor {
	return {
		Document(node) {
			for (const definition of node.definitions) {
				if (!isExecutableDefinitionNode(definition)) {
					const defName = 'name' in definition && definition.name
						? `"${definition.name.value}"`
						: 'schema'
					context.reportError(
						new GraphQLError(
							`The ${defName} definition is not executable.`,
							{ nodes: definition },
						),
					)
				}
			}
		},
	}
}

function isExecutableDefinitionNode(node: DefinitionNode): boolean {
	return (
		node.kind === Kind.OPERATION_DEFINITION
		|| node.kind === Kind.FRAGMENT_DEFINITION
	)
}
