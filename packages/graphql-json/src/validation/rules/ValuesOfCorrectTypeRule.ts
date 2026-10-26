/**
 * Value literals of correct type
 *
 * A GraphQL document is only valid if all value literals are of the type
 * expected at their position.
 *
 * See https://spec.graphql.org/draft/#sec-Values-of-Correct-Type
 */
import type { ASTVisitor, ObjectFieldNode, ObjectValueNode, ValueNode } from 'graphql'
import { GraphQLError, Kind, print } from 'graphql'

import type { TypeRef } from '../../types/schema.js'
import { isEnumType, isInputObjectType, isLeafType } from '../../types/schema.js'
import { formatTypeRef, getTypeName, isListType, isNonNullType } from '../../utils/typeRef.js'
import { parseEnumLiteral } from '../../utils/enumValues.js'
import { getOwn } from '../../utils/helpers.js'
import { didYouMean, suggestionList } from '../helpers.js'
import type { ValidationContext } from '../ValidationContext.js'

export function ValuesOfCorrectTypeRule(context: ValidationContext): ASTVisitor {
	const getNamedInputType = (typeRef: TypeRef | null | undefined) => (typeRef ? getOwn(context.getSchema().t, getTypeName(typeRef)) : undefined)

	return {
		ListValue(node) {
			// Note: TypeInfo will traverse into a list's item type, so look to the parent input type to check if it is a list.
			const type = context.getParentInputType()
			if (!type || !isListType(type[0])) {
				isValidValueNode(context, node)
				return false // Don't traverse further.
			}
			return undefined
		},

		ObjectValue(node) {
			const typeRef = context.getInputType()
			const type = getNamedInputType(typeRef)
			if (!typeRef || !type || !isInputObjectType(type)) {
				isValidValueNode(context, node)
				return false // Don't traverse further.
			}
			const typeName = getTypeName(typeRef)

			// Ensure every required field exists.
			const fieldNodeMap = new Map<string, ObjectFieldNode>()
			for (const field of node.fields) {
				fieldNodeMap.set(field.name.value, field)
			}
			const fieldDefs = type[1]
			for (const fieldName in fieldDefs) {
				const fieldDef = fieldDefs[fieldName]
				if (!fieldNodeMap.has(fieldName) && isNonNullType(fieldDef[0][0]) && fieldDef[1] === undefined) {
					context.reportError(
						new GraphQLError(`Field "${typeName}.${fieldName}" of required type "${formatTypeRef(fieldDef[0])}" was not provided.`, { nodes: node }),
					)
				}
			}

			if (type[2]) {
				validateOneOfInputObject(context, node, typeName, fieldNodeMap)
			}
			return undefined
		},

		ObjectField(node) {
			const parentTypeRef = context.getParentInputType()
			const parentType = getNamedInputType(parentTypeRef)
			const fieldType = context.getInputType()
			if (!fieldType && parentTypeRef && parentType && isInputObjectType(parentType)) {
				const suggestions = suggestionList(node.name.value, Object.keys(parentType[1]))
				context.reportError(
					new GraphQLError(`Field "${node.name.value}" is not defined by type "${getTypeName(parentTypeRef)}".` + didYouMean(suggestions), {
						nodes: node,
					}),
				)
			}
		},

		NullValue(node) {
			const type = context.getInputType()
			if (type && isNonNullType(type[0])) {
				context.reportError(new GraphQLError(`Expected value of type "${formatTypeRef(type)}", found ${print(node)}.`, { nodes: node }))
			}
		},

		EnumValue: node => isValidValueNode(context, node),
		IntValue: node => isValidValueNode(context, node),
		FloatValue: node => isValidValueNode(context, node),
		StringValue: node => isValidValueNode(context, node),
		BooleanValue: node => isValidValueNode(context, node),
	}
}

/**
 * Any value literal may be a valid representation of a Scalar, depending on that scalar type.
 */
function isValidValueNode(context: ValidationContext, node: ValueNode): void {
	// Report any error at the full type expected by the location.
	const locationType = context.getInputType()
	if (!locationType) {
		return
	}

	const typeName = getTypeName(locationType)
	const type = getOwn(context.getSchema().t, typeName)
	if (!type) {
		return
	}

	if (!isLeafType(type)) {
		context.reportError(new GraphQLError(`Expected value of type "${formatTypeRef(locationType)}", found ${print(node)}.`, { nodes: node }))
		return
	}

	// Scalars and Enums determine if a literal value is valid via parseLiteral(), which may throw or return an invalid value to indicate failure.
	try {
		let parseResult: unknown
		if (isEnumType(type)) {
			parseResult = parseEnumLiteral(typeName, type, node)
		} else {
			const scalar = getOwn(context.getScalars(), typeName)
			// a scalar without an implementation accepts any literal, as a graphql-js scalar without parsers does
			parseResult = scalar ? scalar.parseLiteral(node, undefined) : true
		}
		if (parseResult === undefined) {
			context.reportError(new GraphQLError(`Expected value of type "${formatTypeRef(locationType)}", found ${print(node)}.`, { nodes: node }))
		}
	} catch (error) {
		if (error instanceof GraphQLError) {
			context.reportError(error)
		} else {
			const message: unknown = typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined
			context.reportError(
				new GraphQLError(`Expected value of type "${formatTypeRef(locationType)}", found ${print(node)}; ` + String(message), {
					nodes: node,
					originalError: error instanceof Error ? error : undefined,
				}),
			)
		}
	}
}

function validateOneOfInputObject(
	context: ValidationContext,
	node: ObjectValueNode,
	typeName: string,
	fieldNodeMap: ReadonlyMap<string, ObjectFieldNode>,
): void {
	const keys = [...fieldNodeMap.keys()]
	if (keys.length !== 1) {
		context.reportError(new GraphQLError(`OneOf Input Object "${typeName}" must specify exactly one key.`, { nodes: [node] }))
		return
	}

	const value = fieldNodeMap.get(keys[0])?.value
	if (!value || value.kind === Kind.NULL) {
		context.reportError(new GraphQLError(`Field "${typeName}.${keys[0]}" must be non-null.`, { nodes: [node] }))
	}
}
