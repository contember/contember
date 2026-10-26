/**
 * Argument value extraction from AST and variable coercion
 */

import { GraphQLError, Kind } from 'graphql'
import type { ArgumentNode, FieldNode, OperationDefinitionNode, ValueNode } from 'graphql'
import type { EnumType, Field, InputObjectType, Schema, TypeRef } from '../types/schema.js'
import { A, EV, IF, TypeKind } from '../types/schema.js'
import type { ScalarMap } from '../types/resolvers.js'
import { formatTypeRef, getListItemType, isListType, isNonNullType, unwrapNonNull } from '../utils/typeRef.js'
import { typeRefFromAST } from '../utils/typeRef.js'
import { inspect, isIterableObject, isObjectLike } from '../utils/helpers.js'

/**
 * Get argument values for a field
 * Throws GraphQLError if required arguments are missing or null
 */
export function getArgumentValues(
	schema: Schema,
	fieldDef: Field,
	fieldNode: FieldNode,
	variableValues: Record<string, unknown>,
	scalars: ScalarMap,
): Record<string, unknown> {
	const coercedValues: Record<string, unknown> = {}
	const argumentNodes = fieldNode.arguments ?? []
	const argNodeMap = new Map<string, ArgumentNode>()

	for (const argNode of argumentNodes) {
		argNodeMap.set(argNode.name.value, argNode)
	}

	// Field: [typeRef, args, description?, deprecationReason?]
	const args = fieldDef[1]
	if (!args) {
		return coercedValues
	}

	for (const [argName, argDef] of Object.entries(args)) {
		const argumentNode = argNodeMap.get(argName)
		// Argument: [typeRef, defaultValue?, description?]
		const argTypeRef = A.type(argDef)
		const defaultValue = A.defaultValue(argDef)
		const isRequired = isNonNullType(argTypeRef[0])

		if (!argumentNode) {
			if (defaultValue !== undefined) {
				coercedValues[argName] = defaultValue
			} else if (isRequired) {
				// Missing required argument
				throw new GraphQLError(
					`Argument "${argName}" of required type "${formatTypeRef(argTypeRef)}" was not provided.`,
					{ nodes: fieldNode },
				)
			}
			continue
		}

		const valueNode = argumentNode.value

		// Check for explicit null on non-null argument
		if (valueNode.kind === Kind.NULL) {
			if (isRequired) {
				throw new GraphQLError(
					`Argument "${argName}" of non-null type "${formatTypeRef(argTypeRef)}" must not be null.`,
					{ nodes: argumentNode },
				)
			}
			coercedValues[argName] = null
			continue
		}

		if (valueNode.kind === Kind.VARIABLE) {
			const variableName = valueNode.name.value
			const hasValue = variableName in variableValues
			const variableValue = variableValues[variableName]

			if (!hasValue) {
				if (defaultValue !== undefined) {
					coercedValues[argName] = defaultValue
				} else if (isRequired) {
					// Variable not provided for required argument
					throw new GraphQLError(
						`Argument "${argName}" of required type "${
							formatTypeRef(argTypeRef)
						}" was provided the variable "$${variableName}" which was not provided a runtime value.`,
						{ nodes: argumentNode },
					)
				}
				continue
			}

			if (variableValue === null && isRequired) {
				// Variable is null but argument is required
				throw new GraphQLError(
					`Argument "${argName}" of non-null type "${formatTypeRef(argTypeRef)}" must not be null.`,
					{ nodes: argumentNode },
				)
			}

			coercedValues[argName] = variableValue
			continue
		}

		// Coerce literal value
		coercedValues[argName] = coerceInputValue(schema, argTypeRef, valueNode, variableValues, scalars)
	}

	return coercedValues
}

/**
 * Coerce input value from AST
 */
function coerceInputValue(
	schema: Schema,
	typeRef: TypeRef,
	valueNode: ValueNode,
	variableValues: Record<string, unknown>,
	scalars: ScalarMap,
): unknown {
	const pattern = typeRef[0]
	const typeName = typeRef[1]

	// Handle null
	if (valueNode.kind === Kind.NULL) {
		return null
	}

	// Handle variable
	if (valueNode.kind === Kind.VARIABLE) {
		return variableValues[valueNode.name.value]
	}

	// Handle NonNull - unwrap and recurse
	if (isNonNullType(pattern)) {
		const innerPattern = unwrapNonNull(pattern)
		const innerTypeRef: TypeRef = [innerPattern, typeName]
		return coerceInputValue(schema, innerTypeRef, valueNode, variableValues, scalars)
	}

	// Handle List
	if (isListType(pattern)) {
		const innerPattern = getListItemType(pattern)
		const innerTypeRef: TypeRef = [innerPattern, typeName]

		if (valueNode.kind === Kind.LIST) {
			return valueNode.values.map((v) => coerceInputValue(schema, innerTypeRef, v, variableValues, scalars))
		}

		// Single value coerced to list
		return [coerceInputValue(schema, innerTypeRef, valueNode, variableValues, scalars)]
	}

	// Named type
	const type = schema.t[typeName]

	if (!type) {
		// Unknown type - return raw value
		return valueFromASTUntyped(valueNode, variableValues)
	}

	const typeKind = type[0]

	switch (typeKind) {
		case TypeKind.SCALAR: {
			const scalar = scalars[typeName]
			if (scalar) {
				return scalar.parseLiteral(valueNode, variableValues)
			}
			return valueFromASTUntyped(valueNode, variableValues)
		}

		case TypeKind.ENUM: {
			if (valueNode.kind === Kind.ENUM) {
				// EnumType: [kind, values, description?]
				const enumType = type as EnumType
				const values = enumType[1]
				const enumValue = values[valueNode.value]
				if (enumValue) {
					// EnumValue: [value?, description?, deprecationReason?]
					const internalValue = EV.value(enumValue)
					return internalValue !== undefined ? internalValue : valueNode.value
				}
				return valueNode.value
			}
			return undefined
		}

		case TypeKind.INPUT_OBJECT: {
			if (valueNode.kind !== Kind.OBJECT) {
				return undefined
			}

			// InputObjectType: [kind, fields, isOneOf?, description?]
			const inputType = type as InputObjectType
			const fields = inputType[1]

			const obj: Record<string, unknown> = {}
			const fieldNodes = new Map<string, ValueNode>()

			for (const field of valueNode.fields) {
				fieldNodes.set(field.name.value, field.value)
			}

			for (const [fieldName, fieldDef] of Object.entries(fields)) {
				const fieldValueNode = fieldNodes.get(fieldName)
				// InputField: [typeRef, defaultValue?, description?]
				const fieldTypeRef = IF.type(fieldDef)
				const fieldDefaultValue = IF.defaultValue(fieldDef)

				if (fieldValueNode) {
					obj[fieldName] = coerceInputValue(
						schema,
						fieldTypeRef,
						fieldValueNode,
						variableValues,
						scalars,
					)
				} else if (fieldDefaultValue !== undefined) {
					obj[fieldName] = fieldDefaultValue
				}
			}

			return obj
		}

		default:
			return valueFromASTUntyped(valueNode, variableValues)
	}
}

/**
 * Convert AST value to JavaScript value without type information
 */
function valueFromASTUntyped(
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
			return valueNode.values.map((v) => valueFromASTUntyped(v, variableValues))

		case Kind.OBJECT: {
			const obj: Record<string, unknown> = {}
			for (const field of valueNode.fields) {
				obj[field.name.value] = valueFromASTUntyped(field.value, variableValues)
			}
			return obj
		}

		case Kind.VARIABLE:
			return variableValues[valueNode.name.value]

		default:
			return undefined
	}
}

/**
 * Coerce variable values according to GraphQL spec
 */
export function coerceVariableValues(
	schema: Schema,
	operation: OperationDefinitionNode,
	variableValues: Record<string, unknown>,
	scalars: ScalarMap,
): Record<string, unknown> | readonly GraphQLError[] {
	const variableDefinitions = operation.variableDefinitions ?? []
	const coercedValues: Record<string, unknown> = {}
	const errors: GraphQLError[] = []

	for (const varDef of variableDefinitions) {
		const varName = varDef.variable.name.value
		const varTypeRef = typeRefFromAST(varDef.type)
		const hasValue = varName in variableValues
		const value = variableValues[varName]

		if (!hasValue && varDef.defaultValue) {
			// Use default value from variable definition
			coercedValues[varName] = valueFromASTUntyped(varDef.defaultValue, {})
			continue
		}

		if (isNonNullType(varTypeRef[0])) {
			if (!hasValue) {
				errors.push(
					new GraphQLError(
						`Variable "$${varName}" of required type "${formatTypeRef(varTypeRef)}" was not provided.`,
					),
				)
				continue
			}
			if (value === null) {
				errors.push(
					new GraphQLError(
						`Variable "$${varName}" of non-null type "${formatTypeRef(varTypeRef)}" must not be null.`,
					),
				)
				continue
			}
		}

		if (!hasValue) {
			// Optional variable not provided, skip
			continue
		}

		if (value === null) {
			// Nullable variable with null value
			coercedValues[varName] = null
			continue
		}

		// Coerce the value
		const coerced = coerceInputValueFromVariable(
			schema,
			varTypeRef,
			value,
			scalars,
			[`$${varName}`],
			(error) => errors.push(error),
		)

		if (errors.length === 0) {
			coercedValues[varName] = coerced
		}
	}

	if (errors.length > 0) {
		return errors
	}

	return coercedValues
}

/**
 * Coerce an input value from a runtime JavaScript value (not AST)
 */
function coerceInputValueFromVariable(
	schema: Schema,
	typeRef: TypeRef,
	value: unknown,
	scalars: ScalarMap,
	path: readonly string[],
	onError: (error: GraphQLError) => void,
): unknown {
	const pattern = typeRef[0]
	const typeName = typeRef[1]

	// Handle NonNull
	if (isNonNullType(pattern)) {
		if (value === null || value === undefined) {
			onError(
				new GraphQLError(
					`Expected non-nullable type "${formatTypeRef(typeRef)}" not to be null at "${path.join('.')}".`,
				),
			)
			return undefined
		}
		const innerPattern = unwrapNonNull(pattern)
		const innerTypeRef: TypeRef = [innerPattern, typeName]
		return coerceInputValueFromVariable(schema, innerTypeRef, value, scalars, path, onError)
	}

	// Handle null for nullable types
	if (value === null || value === undefined) {
		return null
	}

	// Handle List
	if (isListType(pattern)) {
		const innerPattern = getListItemType(pattern)
		const innerTypeRef: TypeRef = [innerPattern, typeName]

		if (isIterableObject(value) && typeof value !== 'string') {
			return Array.from(
				value as Iterable<unknown>,
				(item, index) => coerceInputValueFromVariable(schema, innerTypeRef, item, scalars, [...path, String(index)], onError),
			)
		}

		// Per GraphQL spec: Single value coerced to list of one
		return [coerceInputValueFromVariable(schema, innerTypeRef, value, scalars, path, onError)]
	}

	// Named type
	const type = schema.t[typeName]

	if (!type) {
		// Unknown type - pass through (e.g., custom scalar without definition)
		return value
	}

	const typeKind = type[0]

	switch (typeKind) {
		case TypeKind.SCALAR: {
			const scalar = scalars[typeName]
			if (!scalar) {
				// No scalar implementation - pass through
				return value
			}
			try {
				return scalar.parseValue(value)
			} catch (error) {
				onError(
					new GraphQLError(
						`Variable "${path[0]}" got invalid value ${inspect(value)} at "${path.join('.')}"; `
							+ `Expected type "${typeName}". ${(error as Error).message}`,
					),
				)
				return undefined
			}
		}

		case TypeKind.ENUM: {
			// EnumType: [kind, values, description?]
			const enumType = type as EnumType
			const values = enumType[1]
			if (typeof value !== 'string') {
				onError(
					new GraphQLError(
						`Variable "${path[0]}" got invalid value ${inspect(value)} at "${path.join('.')}"; `
							+ `Enum "${typeName}" cannot represent non-string value.`,
					),
				)
				return undefined
			}
			const enumValue = values[value]
			if (!enumValue) {
				const validValues = Object.keys(values).join(', ')
				onError(
					new GraphQLError(
						`Variable "${path[0]}" got invalid value ${inspect(value)} at "${path.join('.')}"; `
							+ `Value "${value}" does not exist in "${typeName}" enum. Valid values: ${validValues}.`,
					),
				)
				return undefined
			}
			// Return internal value if defined, otherwise the enum name
			const internalValue = EV.value(enumValue)
			return internalValue !== undefined ? internalValue : value
		}

		case TypeKind.INPUT_OBJECT: {
			// InputObjectType: [kind, fields, isOneOf?, description?]
			const inputType = type as InputObjectType
			const fields = inputType[1]
			const isOneOf = inputType[2]

			if (!isObjectLike(value) || Array.isArray(value)) {
				onError(
					new GraphQLError(
						`Variable "${path[0]}" got invalid value ${inspect(value)} at "${path.join('.')}"; `
							+ `Expected type "${typeName}" to be an object.`,
					),
				)
				return undefined
			}

			const coercedObj: Record<string, unknown> = {}
			const inputValue = value as Record<string, unknown>

			// Process defined fields
			for (const [fieldName, fieldDef] of Object.entries(fields)) {
				const fieldValue = inputValue[fieldName]
				const fieldPath = [...path, fieldName]
				// InputField: [typeRef, defaultValue?, description?]
				const fieldTypeRef = IF.type(fieldDef)
				const fieldDefaultValue = IF.defaultValue(fieldDef)

				if (fieldValue === undefined) {
					if (fieldDefaultValue !== undefined) {
						coercedObj[fieldName] = fieldDefaultValue
					} else if (isNonNullType(fieldTypeRef[0])) {
						onError(
							new GraphQLError(
								`Variable "${path[0]}" got invalid value at "${path.join('.')}"; `
									+ `Field "${fieldName}" of required type "${formatTypeRef(fieldTypeRef)}" was not provided.`,
							),
						)
					}
					continue
				}

				coercedObj[fieldName] = coerceInputValueFromVariable(
					schema,
					fieldTypeRef,
					fieldValue,
					scalars,
					fieldPath,
					onError,
				)
			}

			// Check for unknown fields
			for (const fieldName of Object.keys(inputValue)) {
				if (!(fieldName in fields)) {
					onError(
						new GraphQLError(
							`Variable "${path[0]}" got invalid value at "${path.join('.')}"; `
								+ `Field "${fieldName}" is not defined by type "${typeName}".`,
						),
					)
				}
			}

			// Handle OneOf input objects
			if (isOneOf) {
				const providedKeys = Object.keys(inputValue)
				if (providedKeys.length !== 1) {
					onError(
						new GraphQLError(
							`Variable "${path[0]}" got invalid value at "${path.join('.')}"; `
								+ `Exactly one key must be specified for OneOf type "${typeName}".`,
						),
					)
				} else if (inputValue[providedKeys[0]] === null) {
					onError(
						new GraphQLError(
							`Variable "${path[0]}" got invalid value at "${path.join('.')}"; `
								+ `Field "${providedKeys[0]}" must be non-null for OneOf type "${typeName}".`,
						),
					)
				}
			}

			return coercedObj
		}

		default:
			// Unknown type kind - pass through
			return value
	}
}
