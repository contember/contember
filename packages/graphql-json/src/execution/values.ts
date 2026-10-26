/**
 * Argument and variable coercion, ported from graphql-js `execution/values`, `valueFromAST` and `coerceInputValue`
 */

import { GraphQLError, Kind, print } from 'graphql'
import type { ArgumentNode, FieldNode, ObjectFieldNode, OperationDefinitionNode, ValueNode, VariableDefinitionNode } from 'graphql'
import type { Field, Schema } from '../types/schema.js'
import { TypeKind } from '../types/schema.js'
import type { ScalarMap } from '../types/resolvers.js'
import { formatTypeRef, getListItemType, isListType, isNonNullType, typeRefFromAST, unwrapNonNull } from '../utils/typeRef.js'
import { getOwn, inspect, isIterableObject, isObjectLike, setOwn } from '../utils/helpers.js'
import { addPath, type Path, pathToArray } from '../utils/path.js'
import { enumLiteralValue, parseEnumValue } from '../utils/enumValues.js'
import { didYouMean, isInputType, suggestionList } from '../validation/helpers.js'

const MAX_VARIABLE_COERCION_ERRORS = 50

/** The last node of the name, as graphql-js `keyMap` keeps it */
function findLastByName<T extends ArgumentNode | ObjectFieldNode>(nodes: readonly T[], name: string): T | undefined {
	for (let i = nodes.length - 1; i >= 0; i--) {
		if (nodes[i].name.value === name) {
			return nodes[i]
		}
	}
	return undefined
}

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
	const argDefs = fieldDef[1]
	if (!argDefs) {
		return coercedValues
	}
	const argumentNodes = fieldNode.arguments ?? []

	for (const name in argDefs) {
		const argDef = argDefs[name]
		const argType = argDef[0]
		const defaultValue = argDef[1]
		const argumentNode = findLastByName(argumentNodes, name)

		if (!argumentNode) {
			if (defaultValue !== undefined) {
				coercedValues[name] = defaultValue
			} else if (isNonNullType(argType[0])) {
				throw new GraphQLError(`Argument "${name}" of required type "${formatTypeRef(argType)}" was not provided.`, { nodes: fieldNode })
			}
			continue
		}

		const valueNode = argumentNode.value
		let isNull = valueNode.kind === Kind.NULL

		if (valueNode.kind === Kind.VARIABLE) {
			const variableName = valueNode.name.value
			if (!Object.hasOwn(variableValues, variableName)) {
				if (defaultValue !== undefined) {
					coercedValues[name] = defaultValue
				} else if (isNonNullType(argType[0])) {
					throw new GraphQLError(
						`Argument "${name}" of required type "${
							formatTypeRef(argType)
						}" was provided the variable "$${variableName}" which was not provided a runtime value.`,
						{ nodes: valueNode },
					)
				}
				continue
			}
			isNull = variableValues[variableName] == null
		}

		if (isNull && isNonNullType(argType[0])) {
			throw new GraphQLError(`Argument "${name}" of non-null type "${formatTypeRef(argType)}" must not be null.`, { nodes: valueNode })
		}

		const coercedValue = valueFromAST(schema, scalars, valueNode, argType[0], argType[1], variableValues)
		if (coercedValue === undefined) {
			throw new GraphQLError(`Argument "${name}" has invalid value ${print(valueNode)}.`, { nodes: valueNode })
		}
		coercedValues[name] = coercedValue
	}

	return coercedValues
}

/** A variable the variables do not provide a value for */
function isMissingVariable(valueNode: ValueNode, variables: Record<string, unknown> | undefined): boolean {
	return valueNode.kind === Kind.VARIABLE && (variables === undefined || getOwn(variables, valueNode.name.value) === undefined)
}

/**
 * Produce the value of a literal of the given type, or undefined when the literal is invalid (graphql-js `valueFromAST`)
 */
function valueFromAST(
	schema: Schema,
	scalars: ScalarMap,
	valueNode: ValueNode,
	pattern: number,
	typeName: string,
	variables: Record<string, unknown> | undefined,
): unknown {
	if (valueNode.kind === Kind.VARIABLE) {
		const variableValue = variables ? getOwn(variables, valueNode.name.value) : undefined
		if (variableValue === undefined) {
			return undefined
		}
		if (variableValue === null && isNonNullType(pattern)) {
			return undefined // Invalid: intentionally return no value.
		}
		// Note: This does no further checking that this variable is correct.
		return variableValue
	}

	if (isNonNullType(pattern)) {
		if (valueNode.kind === Kind.NULL) {
			return undefined // Invalid: intentionally return no value.
		}
		return valueFromAST(schema, scalars, valueNode, unwrapNonNull(pattern), typeName, variables)
	}

	if (valueNode.kind === Kind.NULL) {
		return null
	}

	if (isListType(pattern)) {
		const itemPattern = getListItemType(pattern)
		if (valueNode.kind === Kind.LIST) {
			const coercedValues: unknown[] = []
			for (const itemNode of valueNode.values) {
				if (isMissingVariable(itemNode, variables)) {
					if (isNonNullType(itemPattern)) {
						return undefined // Invalid: intentionally return no value.
					}
					coercedValues.push(null)
				} else {
					const itemValue = valueFromAST(schema, scalars, itemNode, itemPattern, typeName, variables)
					if (itemValue === undefined) {
						return undefined // Invalid: intentionally return no value.
					}
					coercedValues.push(itemValue)
				}
			}
			return coercedValues
		}
		const coercedValue = valueFromAST(schema, scalars, valueNode, itemPattern, typeName, variables)
		if (coercedValue === undefined) {
			return undefined // Invalid: intentionally return no value.
		}
		return [coercedValue]
	}

	const type = getOwn(schema.t, typeName)
	if (!type) {
		// a type the schema does not know is not coerced
		return valueFromASTUntyped(valueNode, variables)
	}

	switch (type[0]) {
		case TypeKind.INPUT_OBJECT: {
			if (valueNode.kind !== Kind.OBJECT) {
				return undefined // Invalid: intentionally return no value.
			}
			const coercedObj: Record<string, unknown> = {}
			const fieldDefs = type[1]
			for (const fieldName in fieldDefs) {
				const fieldDef = fieldDefs[fieldName]
				const fieldNode = findLastByName(valueNode.fields, fieldName)
				if (!fieldNode || isMissingVariable(fieldNode.value, variables)) {
					if (fieldDef[1] !== undefined) {
						coercedObj[fieldName] = fieldDef[1]
					} else if (isNonNullType(fieldDef[0][0])) {
						return undefined // Invalid: intentionally return no value.
					}
					continue
				}
				const fieldValue = valueFromAST(schema, scalars, fieldNode.value, fieldDef[0][0], fieldDef[0][1], variables)
				if (fieldValue === undefined) {
					return undefined // Invalid: intentionally return no value.
				}
				coercedObj[fieldName] = fieldValue
			}
			if (type[2]) {
				const keys = Object.keys(coercedObj)
				if (keys.length !== 1) {
					return undefined // Invalid: not exactly one key, intentionally return no value.
				}
				if (coercedObj[keys[0]] === null) {
					return undefined // Invalid: value not non-null, intentionally return no value.
				}
			}
			return coercedObj
		}

		case TypeKind.ENUM:
			return enumLiteralValue(type, valueNode)

		case TypeKind.SCALAR: {
			const scalar = getOwn(scalars, typeName)
			try {
				// a parser signals an invalid literal by throwing or returning undefined
				return scalar ? scalar.parseLiteral(valueNode, variables) : valueFromASTUntyped(valueNode, variables)
			} catch {
				return undefined // Invalid: intentionally return no value.
			}
		}

		default:
			return undefined
	}
}

/**
 * Convert AST value to JavaScript value without type information (graphql-js `valueFromASTUntyped`)
 */
function valueFromASTUntyped(valueNode: ValueNode, variables: Record<string, unknown> | undefined): unknown {
	switch (valueNode.kind) {
		case Kind.NULL:
			return null
		case Kind.INT:
			return parseInt(valueNode.value, 10)
		case Kind.FLOAT:
			return parseFloat(valueNode.value)
		case Kind.STRING:
		case Kind.ENUM:
		case Kind.BOOLEAN:
			return valueNode.value
		case Kind.LIST:
			return valueNode.values.map(node => valueFromASTUntyped(node, variables))
		case Kind.OBJECT: {
			const obj: Record<string, unknown> = {}
			for (const field of valueNode.fields) {
				setOwn(obj, field.name.value, valueFromASTUntyped(field.value, variables))
			}
			return obj
		}
		case Kind.VARIABLE:
			return variables ? getOwn(variables, valueNode.name.value) : undefined
	}
}

/**
 * Coerce the variable values of an operation (graphql-js `getVariableValues` with the execute limit of 50 errors)
 */
export function coerceVariableValues(
	schema: Schema,
	operation: OperationDefinitionNode,
	inputs: Record<string, unknown>,
	scalars: ScalarMap,
): Record<string, unknown> | readonly GraphQLError[] {
	const errors: GraphQLError[] = []
	try {
		const coerced = coerceVariableDefinitions(schema, operation.variableDefinitions ?? [], inputs, scalars, error => {
			if (errors.length >= MAX_VARIABLE_COERCION_ERRORS) {
				throw new GraphQLError('Too many errors processing variables, error limit reached. Execution aborted.')
			}
			errors.push(error)
		})
		if (errors.length === 0) {
			return coerced
		}
	} catch (error) {
		if (!(error instanceof GraphQLError)) {
			throw error
		}
		errors.push(error)
	}
	return errors
}

function coerceVariableDefinitions(
	schema: Schema,
	varDefNodes: readonly VariableDefinitionNode[],
	inputs: Record<string, unknown>,
	scalars: ScalarMap,
	onError: (error: GraphQLError) => void,
): Record<string, unknown> {
	const coercedValues: Record<string, unknown> = {}

	for (const varDefNode of varDefNodes) {
		const varName = varDefNode.variable.name.value
		const varType = typeRefFromAST(varDefNode.type)
		const namedType = getOwn(schema.t, varType[1])

		if (!namedType || !isInputType(namedType)) {
			// Must use input types for variables. This should be caught during validation, however is checked again here for safety.
			onError(
				new GraphQLError(`Variable "$${varName}" expected value of type "${print(varDefNode.type)}" which cannot be used as an input type.`, {
					nodes: varDefNode.type,
				}),
			)
			continue
		}

		if (!Object.hasOwn(inputs, varName)) {
			if (varDefNode.defaultValue) {
				coercedValues[varName] = valueFromAST(schema, scalars, varDefNode.defaultValue, varType[0], varType[1], undefined)
			} else if (isNonNullType(varType[0])) {
				onError(new GraphQLError(`Variable "$${varName}" of required type "${formatTypeRef(varType)}" was not provided.`, { nodes: varDefNode }))
			}
			continue
		}

		const value = inputs[varName]
		if (value === null && isNonNullType(varType[0])) {
			onError(new GraphQLError(`Variable "$${varName}" of non-null type "${formatTypeRef(varType)}" must not be null.`, { nodes: varDefNode }))
			continue
		}

		coercedValues[varName] = coerceInputValue(schema, scalars, value, varType[0], varType[1], undefined, (path, invalidValue, error) => {
			let prefix = `Variable "$${varName}" got invalid value ${inspect(invalidValue)}`
			if (path.length > 0) {
				prefix += ` at "${varName}${printPathArray(path)}"`
			}
			onError(new GraphQLError(prefix + '; ' + error.message, { nodes: varDefNode, originalError: error }))
		})
	}

	return coercedValues
}

function printPathArray(path: readonly (string | number)[]): string {
	return path.map(key => (typeof key === 'number' ? '[' + key.toString() + ']' : '.' + key)).join('')
}

type CoercionErrorHandler = (path: readonly (string | number)[], invalidValue: unknown, error: GraphQLError) => void

/**
 * Coerce a runtime value to the given input type, reporting each invalid part (graphql-js `coerceInputValue`)
 */
function coerceInputValue(
	schema: Schema,
	scalars: ScalarMap,
	inputValue: unknown,
	pattern: number,
	typeName: string,
	path: Path | undefined,
	onError: CoercionErrorHandler,
): unknown {
	if (isNonNullType(pattern)) {
		if (inputValue != null) {
			return coerceInputValue(schema, scalars, inputValue, unwrapNonNull(pattern), typeName, path, onError)
		}
		onError(pathToArray(path), inputValue, new GraphQLError(`Expected non-nullable type "${formatTypeRef([pattern, typeName])}" not to be null.`))
		return undefined
	}

	if (inputValue == null) {
		// Explicitly return the value null.
		return null
	}

	if (isListType(pattern)) {
		const itemPattern = getListItemType(pattern)
		if (isIterableObject(inputValue)) {
			return Array.from(
				inputValue,
				(itemValue, index) => coerceInputValue(schema, scalars, itemValue, itemPattern, typeName, addPath(path, index, undefined), onError),
			)
		}
		// Lists accept a non-list value as a list of one.
		return [coerceInputValue(schema, scalars, inputValue, itemPattern, typeName, path, onError)]
	}

	const type = getOwn(schema.t, typeName)
	if (!type) {
		// a type the schema does not know is not coerced
		return inputValue
	}

	switch (type[0]) {
		case TypeKind.INPUT_OBJECT: {
			if (!isObjectLike(inputValue) || Array.isArray(inputValue)) {
				onError(pathToArray(path), inputValue, new GraphQLError(`Expected type "${typeName}" to be an object.`))
				return undefined
			}

			const coercedValue: Record<string, unknown> = {}
			const fieldDefs = type[1]

			for (const fieldName in fieldDefs) {
				const fieldDef = fieldDefs[fieldName]
				const fieldValue = getOwn(inputValue, fieldName)
				if (fieldValue === undefined) {
					if (fieldDef[1] !== undefined) {
						coercedValue[fieldName] = fieldDef[1]
					} else if (isNonNullType(fieldDef[0][0])) {
						onError(
							pathToArray(path),
							inputValue,
							new GraphQLError(`Field "${fieldName}" of required type "${formatTypeRef(fieldDef[0])}" was not provided.`),
						)
					}
					continue
				}
				coercedValue[fieldName] = coerceInputValue(
					schema,
					scalars,
					fieldValue,
					fieldDef[0][0],
					fieldDef[0][1],
					addPath(path, fieldName, typeName),
					onError,
				)
			}

			// Ensure every provided field is defined.
			for (const fieldName of Object.keys(inputValue)) {
				if (!Object.hasOwn(fieldDefs, fieldName)) {
					const suggestions = suggestionList(fieldName, Object.keys(fieldDefs))
					onError(
						pathToArray(path),
						inputValue,
						new GraphQLError(`Field "${fieldName}" is not defined by type "${typeName}".` + didYouMean(suggestions)),
					)
				}
			}

			if (type[2]) {
				const keys = Object.keys(coercedValue)
				if (keys.length !== 1) {
					onError(pathToArray(path), inputValue, new GraphQLError(`Exactly one key must be specified for OneOf type "${typeName}".`))
				}
				const key = keys[0]
				const value = coercedValue[key]
				if (value === null) {
					onError(pathToArray(path).concat(key), value, new GraphQLError(`Field "${key}" must be non-null.`))
				}
			}

			return coercedValue
		}

		case TypeKind.SCALAR:
		case TypeKind.ENUM: {
			// Scalars and Enums determine if an input value is valid via parseValue(), which can throw to indicate failure.
			let parseResult: unknown
			try {
				if (type[0] === TypeKind.ENUM) {
					parseResult = parseEnumValue(typeName, type, inputValue)
				} else {
					const scalar = getOwn(scalars, typeName)
					parseResult = scalar ? scalar.parseValue(inputValue) : inputValue
				}
			} catch (error) {
				if (error instanceof GraphQLError) {
					onError(pathToArray(path), inputValue, error)
				} else {
					const message: unknown = isObjectLike(error) ? error.message : undefined
					onError(
						pathToArray(path),
						inputValue,
						new GraphQLError(`Expected type "${typeName}". ` + String(message), {
							originalError: error instanceof Error ? error : undefined,
						}),
					)
				}
				return undefined
			}
			if (parseResult === undefined) {
				onError(pathToArray(path), inputValue, new GraphQLError(`Expected type "${typeName}".`))
			}
			return parseResult
		}

		default:
			return undefined
	}
}
