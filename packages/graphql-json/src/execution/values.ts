/**
 * Argument value extraction from AST and variable coercion
 */

import { GraphQLError, Kind, print } from 'graphql'
import type { ArgumentNode, FieldNode, OperationDefinitionNode, ValueNode } from 'graphql'
import type { Field, Schema, TypeRef } from '../types/schema.js'
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
		try {
			coercedValues[argName] = coerceInputValue(schema, argTypeRef, valueNode, variableValues, scalars)
		} catch (error) {
			if (error instanceof InvalidLiteralError) {
				throw new GraphQLError(`Argument "${argName}" has invalid value ${print(valueNode)}.`, { nodes: valueNode })
			}
			throw error
		}
	}

	return coercedValues
}

/** Thrown from within literal coercion and reported as an invalid argument by getArgumentValues */
class InvalidLiteralError extends Error {}

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

	switch (type[0]) {
		case TypeKind.SCALAR: {
			const scalar = scalars[typeName]
			if (scalar) {
				const parsed = scalar.parseLiteral(valueNode, variableValues)
				// as in graphql-js valueFromAST, a parser signals an invalid literal by returning undefined
				if (parsed === undefined) {
					throw new InvalidLiteralError()
				}
				return parsed
			}
			return valueFromASTUntyped(valueNode, variableValues)
		}

		case TypeKind.ENUM: {
			if (valueNode.kind === Kind.ENUM) {
				const values = type[1]
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

			const fields = type[1]

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
			[varName],
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

/** Variable name followed by the field names and list indices leading to a nested value */
type VariablePath = readonly [variableName: string, ...keys: (string | number)[]]

/**
 * Variable coercion error in the graphql-js format
 */
function invalidVariableValue(path: VariablePath, value: unknown, message: string): GraphQLError {
	const [variableName, ...keys] = path
	const location = keys.length > 0 ? ` at "${variableName}${keys.map(key => (typeof key === 'number' ? `[${key}]` : `.${key}`)).join('')}"` : ''
	return new GraphQLError(`Variable "$${variableName}" got invalid value ${inspect(value)}${location}; ${message}`)
}

/**
 * Coerce an input value from a runtime JavaScript value (not AST)
 */
function coerceInputValueFromVariable(
	schema: Schema,
	typeRef: TypeRef,
	value: unknown,
	scalars: ScalarMap,
	path: VariablePath,
	onError: (error: GraphQLError) => void,
): unknown {
	const pattern = typeRef[0]
	const typeName = typeRef[1]

	// Handle NonNull
	if (isNonNullType(pattern)) {
		if (value === null || value === undefined) {
			onError(invalidVariableValue(path, value, `Expected non-nullable type "${formatTypeRef(typeRef)}" not to be null.`))
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
				value,
				(item, index) => coerceInputValueFromVariable(schema, innerTypeRef, item, scalars, [...path, index], onError),
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

	switch (type[0]) {
		case TypeKind.SCALAR: {
			const scalar = scalars[typeName]
			if (!scalar) {
				// No scalar implementation - pass through
				return value
			}
			let parsed: unknown
			try {
				parsed = scalar.parseValue(value)
			} catch (error) {
				onError(invalidVariableValue(path, value, `Expected type "${typeName}". ${error instanceof Error ? error.message : String(error)}`))
				return undefined
			}
			// as in graphql-js, a parser signals an invalid value by returning undefined
			if (parsed === undefined) {
				onError(invalidVariableValue(path, value, `Expected type "${typeName}".`))
			}
			return parsed
		}

		case TypeKind.ENUM: {
			const values = type[1]
			if (typeof value !== 'string') {
				onError(invalidVariableValue(path, value, `Enum "${typeName}" cannot represent non-string value.`))
				return undefined
			}
			const enumValue = values[value]
			if (!enumValue) {
				const validValues = Object.keys(values).join(', ')
				onError(invalidVariableValue(path, value, `Value "${value}" does not exist in "${typeName}" enum. Valid values: ${validValues}.`))
				return undefined
			}
			// Return internal value if defined, otherwise the enum name
			const internalValue = EV.value(enumValue)
			return internalValue !== undefined ? internalValue : value
		}

		case TypeKind.INPUT_OBJECT: {
			const fields = type[1]
			const isOneOf = type[2]

			if (!isObjectLike(value) || Array.isArray(value)) {
				onError(invalidVariableValue(path, value, `Expected type "${typeName}" to be an object.`))
				return undefined
			}

			const coercedObj: Record<string, unknown> = {}

			// Process defined fields
			for (const [fieldName, fieldDef] of Object.entries(fields)) {
				const fieldValue = value[fieldName]
				const fieldPath: VariablePath = [...path, fieldName]
				// InputField: [typeRef, defaultValue?, description?]
				const fieldTypeRef = IF.type(fieldDef)
				const fieldDefaultValue = IF.defaultValue(fieldDef)

				if (fieldValue === undefined) {
					if (fieldDefaultValue !== undefined) {
						coercedObj[fieldName] = fieldDefaultValue
					} else if (isNonNullType(fieldTypeRef[0])) {
						onError(invalidVariableValue(path, value, `Field "${fieldName}" of required type "${formatTypeRef(fieldTypeRef)}" was not provided.`))
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
			for (const fieldName of Object.keys(value)) {
				if (!(fieldName in fields)) {
					onError(invalidVariableValue(path, value, `Field "${fieldName}" is not defined by type "${typeName}".`))
				}
			}

			// Handle OneOf input objects
			if (isOneOf) {
				const providedKeys = Object.keys(value)
				if (providedKeys.length !== 1) {
					onError(invalidVariableValue(path, value, `Exactly one key must be specified for OneOf type "${typeName}".`))
				} else if (value[providedKeys[0]] === null) {
					onError(invalidVariableValue(path, value, `Field "${providedKeys[0]}" must be non-null for OneOf type "${typeName}".`))
				}
			}

			return coercedObj
		}

		default:
			// Unknown type kind - pass through
			return value
	}
}
