/**
 * Directive handling
 */

import { Kind } from 'graphql'
import type { FieldNode, FragmentSpreadNode, InlineFragmentNode, ValueNode } from 'graphql'

/**
 * Get directive values from a node
 */
export function getDirectiveValues(
	directiveName: string,
	node: FieldNode | InlineFragmentNode | FragmentSpreadNode,
	variableValues: Record<string, unknown>,
): Record<string, unknown> | undefined {
	const directives = node.directives
	if (!directives) {
		return undefined
	}

	const directive = directives.find((d) => d.name.value === directiveName)
	if (!directive) {
		return undefined
	}

	const args: Record<string, unknown> = {}
	for (const arg of directive.arguments ?? []) {
		args[arg.name.value] = valueFromAST(arg.value, variableValues)
	}

	return args
}

/**
 * Convert AST value to JavaScript value
 */
function valueFromAST(
	valueNode: ValueNode,
	variableValues: Record<string, unknown>,
): unknown {
	switch (valueNode.kind) {
		case Kind.NULL:
			return null

		case Kind.INT:
			return parseInt(valueNode.value, 10)

		case Kind.FLOAT:
			return parseFloat(valueNode.value)

		case Kind.STRING:
		case Kind.ENUM:
			return valueNode.value

		case Kind.BOOLEAN:
			return valueNode.value

		case Kind.LIST:
			return valueNode.values.map((v) => valueFromAST(v, variableValues))

		case Kind.OBJECT: {
			const obj: Record<string, unknown> = {}
			for (const field of valueNode.fields) {
				obj[field.name.value] = valueFromAST(field.value, variableValues)
			}
			return obj
		}

		case Kind.VARIABLE:
			return variableValues[valueNode.name.value]

		default:
			return undefined
	}
}
