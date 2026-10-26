/**
 * Value literals of correct type
 *
 * A GraphQL document is only valid if all value literals are of the type
 * expected at their position.
 *
 * See https://spec.graphql.org/draft/#sec-Values-of-Correct-Type
 */
import type { ASTVisitor, ListValueNode, ObjectValueNode, ValueNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { EnumType, InputObjectType, Type, TypeRef } from '../../types/schema.js'
import { IF, isEnumType, isInputObjectType, isScalarType } from '../../types/schema.js'
import { formatTypeRef, getTypeName, isListType, isNonNullType, unwrapNonNull } from '../../utils/typeRef.js'
import { didYouMean, suggestionList } from '../helpers.js'
import type { ValidationContext } from '../ValidationContext.js'

export function ValuesOfCorrectTypeRule(context: ValidationContext): ASTVisitor {
	return {
		NullValue(node) {
			const typeRef = context.getInputType()
			if (typeRef && isNonNullType(typeRef[0])) {
				context.reportError(
					new GraphQLError(
						`Expected value of type "${formatTypeRef(typeRef)}", found null.`,
						{ nodes: node },
					),
				)
			}
		},

		ListValue(node: ListValueNode) {
			// Note: TypeInfo will push the item type as the current input type,
			// so we need to get the parent type to check if it's a list
			const parentType = context.getParentInputType()
			if (parentType) {
				const nullable = getNullableType(parentType)
				if (nullable && !isListType(nullable[0])) {
					isValidValueNode(context, node)
				}
			}
		},

		ObjectValue(node: ObjectValueNode) {
			const typeRef = context.getInputType()
			if (!typeRef) {
				return undefined
			}

			const typeName = getTypeName(typeRef)
			const type = context.getSchema().t[typeName]

			if (!type || !isInputObjectType(type)) {
				isValidValueNode(context, node)
				return false // Don't visit children - we already reported the error
			}

			// InputObjectType: [kind, fields, isOneOf?, description?]
			const inputType = type as InputObjectType
			const fields = inputType[1]
			const isOneOf = inputType[2]

			// Check for unknown fields
			const fieldNames = Object.keys(fields)
			for (const fieldNode of node.fields) {
				const fieldName = fieldNode.name.value
				if (!fields[fieldName]) {
					const suggestions = suggestionList(fieldName, fieldNames)
					context.reportError(
						new GraphQLError(
							`Field "${fieldName}" is not defined by type "${typeName}".${didYouMean(suggestions)}`,
							{ nodes: fieldNode },
						),
					)
				}
			}

			// Check for missing required fields
			const providedFields = new Set(node.fields.map((f) => f.name.value))
			for (const [fieldName, fieldDef] of Object.entries(fields)) {
				// InputField: [typeRef, defaultValue?, description?]
				const fieldTypeRef = IF.type(fieldDef)
				const defaultValue = IF.defaultValue(fieldDef)
				// Required = NonNull without default value
				if (
					isNonNullType(fieldTypeRef[0])
					&& defaultValue === undefined
					&& !providedFields.has(fieldName)
				) {
					context.reportError(
						new GraphQLError(
							`Field "${typeName}.${fieldName}" of required type "${formatTypeRef(fieldTypeRef)}" was not provided.`,
							{ nodes: node },
						),
					)
				}
			}

			// Check OneOf constraint
			if (isOneOf) {
				if (node.fields.length !== 1) {
					context.reportError(
						new GraphQLError(
							`Exactly one field must be provided for OneOf type "${typeName}".`,
							{ nodes: node },
						),
					)
				} else {
					const field = node.fields[0]
					if (field.value.kind === Kind.NULL) {
						context.reportError(
							new GraphQLError(
								`Field "${typeName}.${field.name.value}" must be non-null.`,
								{ nodes: field },
							),
						)
					}
				}
			}

			return undefined
		},

		ObjectField(node) {
			const parentType = context.getParentInputType()
			if (!parentType) {
				return
			}

			const parentTypeName = getTypeName(parentType)
			const parentTypeObj = context.getSchema().t[parentTypeName]

			if (!parentTypeObj || !isInputObjectType(parentTypeObj)) {
				return
			}

			// InputObjectType: [kind, fields, isOneOf?, description?]
			const fields = (parentTypeObj as InputObjectType)[1]
			const fieldDef = fields[node.name.value]
			if (!fieldDef) {
				return // Already reported by ObjectValue
			}

			// TypeInfo will push the field type, but we need to check it here for scalars/enums
		},

		EnumValue(node) {
			const typeRef = context.getInputType()
			if (!typeRef) {
				return
			}

			const typeName = getTypeName(typeRef)
			const type = context.getSchema().t[typeName]

			if (!type || !isEnumType(type)) {
				isValidValueNode(context, node)
				return
			}

			// EnumType: [kind, values, description?]
			const values = (type as EnumType)[1]
			// Check if enum value exists
			if (!values[node.value]) {
				const suggestions = suggestionList(node.value, Object.keys(values))
				context.reportError(
					new GraphQLError(
						`Value "${node.value}" does not exist in "${typeName}" enum.${didYouMean(suggestions)}`,
						{ nodes: node },
					),
				)
			}
		},

		IntValue(node) {
			isValidValueNode(context, node)
		},

		FloatValue(node) {
			isValidValueNode(context, node)
		},

		StringValue(node) {
			isValidValueNode(context, node)
		},

		BooleanValue(node) {
			isValidValueNode(context, node)
		},
	}
}

/**
 * Check if a value node is valid for the current input type.
 * Reports error if not.
 */
function isValidValueNode(context: ValidationContext, node: ValueNode): void {
	const typeRef = context.getInputType()
	if (!typeRef) {
		return
	}

	const typeName = getTypeName(typeRef)
	const type = context.getSchema().t[typeName]

	if (!type) {
		// Unknown type - already handled by KnownTypeNamesRule
		return
	}

	// Check type compatibility
	const error = checkValueTypeCompatibility(type, typeName, typeRef, node, context)
	if (error) {
		context.reportError(error)
	}
}

/**
 * Check if a value node is compatible with a type.
 */
function checkValueTypeCompatibility(
	type: Type,
	typeName: string,
	typeRef: TypeRef,
	node: ValueNode,
	context: ValidationContext,
): GraphQLError | null {
	// Handle scalars using parseLiteral
	if (isScalarType(type)) {
		const scalars = context.getScalars()
		const scalar = scalars[typeName]

		if (scalar?.parseLiteral) {
			try {
				// as in graphql-js, a parser signals an invalid literal by returning undefined
				if (scalar.parseLiteral(node) === undefined) {
					return new GraphQLError(`Expected value of type "${formatTypeRef(typeRef)}", found ${print(node)}.`, { nodes: node })
				}
				return null
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				return new GraphQLError(
					`Expected value of type "${formatTypeRef(typeRef)}", found ${print(node)}; ${message}`,
					{ nodes: node },
				)
			}
		}

		// Fallback: check AST kind
		const validKinds = getValidASTKindsForScalar(typeName)
		if (!validKinds.includes(node.kind)) {
			return new GraphQLError(
				`Expected value of type "${formatTypeRef(typeRef)}", found ${print(node)}.`,
				{ nodes: node },
			)
		}

		return null
	}

	// Handle enums
	if (isEnumType(type)) {
		if (node.kind !== Kind.ENUM && node.kind !== Kind.STRING) {
			return new GraphQLError(
				`Expected value of type "${formatTypeRef(typeRef)}", found ${print(node)}.`,
				{ nodes: node },
			)
		}
		return null
	}

	// Handle input objects
	if (isInputObjectType(type)) {
		if (node.kind !== Kind.OBJECT) {
			return new GraphQLError(
				`Expected value of type "${formatTypeRef(typeRef)}", found ${print(node)}.`,
				{ nodes: node },
			)
		}
		return null
	}

	return null
}

/**
 * Get valid AST node kinds for a scalar type
 */
function getValidASTKindsForScalar(scalarName: string): string[] {
	switch (scalarName) {
		case 'Int':
			return [Kind.INT]
		case 'Float':
			return [Kind.INT, Kind.FLOAT]
		case 'String':
			return [Kind.STRING]
		case 'Boolean':
			return [Kind.BOOLEAN]
		case 'ID':
			return [Kind.STRING, Kind.INT]
		default:
			// Custom scalar - accept any literal
			return [Kind.INT, Kind.FLOAT, Kind.STRING, Kind.BOOLEAN]
	}
}

/**
 * Get nullable type (unwrap NonNull if present)
 */
function getNullableType(typeRef: TypeRef): TypeRef {
	if (isNonNullType(typeRef[0])) {
		return [unwrapNonNull(typeRef[0]), typeRef[1]]
	}
	return typeRef
}

/**
 * Simple print function for value nodes
 */
function print(node: ValueNode): string {
	switch (node.kind) {
		case Kind.NULL:
			return 'null'
		case Kind.INT:
		case Kind.FLOAT:
			return node.value
		case Kind.STRING:
			return JSON.stringify(node.value)
		case Kind.BOOLEAN:
			return node.value ? 'true' : 'false'
		case Kind.ENUM:
			return node.value
		case Kind.LIST:
			return `[${node.values.map(print).join(', ')}]`
		case Kind.OBJECT:
			return `{${node.fields.map((f) => `${f.name.value}: ${print(f.value)}`).join(', ')}}`
		case Kind.VARIABLE:
			return `$${node.name.value}`
		default:
			return '(unknown)'
	}
}
