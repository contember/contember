import { JSONValue } from '@contember/schema'

export interface JsonSchemaValidationError {
	/** JSON pointer-ish path within the validated value, e.g. `/foo/0/bar`. */
	path: string
	message: string
}

type JsonSchema = { readonly [key: string]: JSONValue } | boolean

/**
 * A pragmatic, dependency-free validator for a *subset* of JSON Schema. It is intentionally not a
 * full draft 2020-12 implementation — it only understands the keywords listed below.
 *
 * Supported keywords:
 * - `type` (string or array of strings: object, array, string, number, integer, boolean, null)
 * - `enum`, `const`
 * - object: `properties`, `required`, `additionalProperties`, `minProperties`, `maxProperties`
 * - array: `items` (applied to ALL elements, draft-07 style), `minItems`, `maxItems`, `uniqueItems`
 * - string: `minLength`, `maxLength`, `pattern`
 * - number: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
 * - combinators: `allOf`, `anyOf`, `oneOf`, `not`
 *
 * Any other keyword is SILENTLY IGNORED (treated as valid) — including `$ref`, `$defs`, `format`,
 * `patternProperties`, `propertyNames`, `dependentRequired`, `dependentSchemas`, `if`/`then`/`else`,
 * `contains`, and the 2020-12 tuple keyword `prefixItems`. Such keywords look validated but are not.
 */
export const validateJsonSchema = (schema: JSONValue, value: JSONValue | undefined): JsonSchemaValidationError[] => {
	const errors: JsonSchemaValidationError[] = []
	validateNode(schema as JsonSchema, value === undefined ? null : value, '', errors)
	return errors
}

const jsonType = (value: JSONValue): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' => {
	if (value === null) {
		return 'null'
	}
	if (Array.isArray(value)) {
		return 'array'
	}
	return typeof value as 'object' | 'string' | 'number' | 'boolean'
}

const matchesType = (expected: string, value: JSONValue): boolean => {
	const actual = jsonType(value)
	if (expected === 'integer') {
		return actual === 'number' && Number.isInteger(value as number)
	}
	if (expected === 'number') {
		return actual === 'number'
	}
	return actual === expected
}

const deepEqual = (a: JSONValue, b: JSONValue): boolean => {
	if (a === b) {
		return true
	}
	const ta = jsonType(a)
	const tb = jsonType(b)
	if (ta !== tb) {
		return false
	}
	if (ta === 'array') {
		const aa = a as readonly JSONValue[]
		const ba = b as readonly JSONValue[]
		return aa.length === ba.length && aa.every((it, i) => deepEqual(it, ba[i]))
	}
	if (ta === 'object') {
		const ao = a as { readonly [key: string]: JSONValue }
		const bo = b as { readonly [key: string]: JSONValue }
		const aKeys = Object.keys(ao)
		const bKeys = Object.keys(bo)
		return aKeys.length === bKeys.length && aKeys.every(key => key in bo && deepEqual(ao[key], bo[key]))
	}
	return false
}

const validateNode = (schema: JsonSchema, value: JSONValue, path: string, errors: JsonSchemaValidationError[]): void => {
	if (schema === true || schema === undefined) {
		return
	}
	if (schema === false) {
		errors.push({ path, message: 'Value is not allowed here' })
		return
	}

	if ('type' in schema) {
		const types = Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type as string]
		if (!types.some(it => matchesType(it, value))) {
			errors.push({ path, message: `Expected type ${types.join(' or ')}, got ${jsonType(value)}` })
			return
		}
	}

	if ('const' in schema && schema.const !== undefined) {
		if (!deepEqual(schema.const, value)) {
			errors.push({ path, message: 'Value does not match the expected constant' })
		}
	}

	if (Array.isArray(schema.enum)) {
		if (!schema.enum.some(it => deepEqual(it, value))) {
			errors.push({ path, message: 'Value is not one of the allowed values' })
		}
	}

	const type = jsonType(value)

	if (type === 'string') {
		validateString(schema, value as string, path, errors)
	}
	if (type === 'number') {
		validateNumber(schema, value as number, path, errors)
	}
	if (type === 'array') {
		validateArray(schema, value as readonly JSONValue[], path, errors)
	}
	if (type === 'object') {
		validateObject(schema, value as { readonly [key: string]: JSONValue }, path, errors)
	}

	validateCombinators(schema, value, path, errors)
}

const validateString = (schema: Exclude<JsonSchema, boolean>, value: string, path: string, errors: JsonSchemaValidationError[]): void => {
	if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
		errors.push({ path, message: `String is shorter than ${schema.minLength} characters` })
	}
	if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
		errors.push({ path, message: `String is longer than ${schema.maxLength} characters` })
	}
	if (typeof schema.pattern === 'string') {
		try {
			if (!new RegExp(schema.pattern).test(value)) {
				errors.push({ path, message: `String does not match pattern ${schema.pattern}` })
			}
		} catch {
			// invalid pattern in schema – ignore
		}
	}
}

const validateNumber = (schema: Exclude<JsonSchema, boolean>, value: number, path: string, errors: JsonSchemaValidationError[]): void => {
	if (typeof schema.minimum === 'number' && value < schema.minimum) {
		errors.push({ path, message: `Value is less than minimum ${schema.minimum}` })
	}
	if (typeof schema.maximum === 'number' && value > schema.maximum) {
		errors.push({ path, message: `Value is greater than maximum ${schema.maximum}` })
	}
	if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
		errors.push({ path, message: `Value is not greater than ${schema.exclusiveMinimum}` })
	}
	if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
		errors.push({ path, message: `Value is not less than ${schema.exclusiveMaximum}` })
	}
	if (typeof schema.multipleOf === 'number' && schema.multipleOf > 0 && !Number.isInteger(value / schema.multipleOf)) {
		errors.push({ path, message: `Value is not a multiple of ${schema.multipleOf}` })
	}
}

const validateArray = (
	schema: Exclude<JsonSchema, boolean>,
	value: readonly JSONValue[],
	path: string,
	errors: JsonSchemaValidationError[],
): void => {
	if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
		errors.push({ path, message: `Array has fewer than ${schema.minItems} items` })
	}
	if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
		errors.push({ path, message: `Array has more than ${schema.maxItems} items` })
	}
	if (schema.uniqueItems === true) {
		for (let i = 0; i < value.length; i++) {
			for (let j = i + 1; j < value.length; j++) {
				if (deepEqual(value[i], value[j])) {
					errors.push({ path, message: 'Array items are not unique' })
					i = value.length
					break
				}
			}
		}
	}
	if (schema.items !== undefined) {
		value.forEach((item, index) => {
			validateNode(schema.items as JsonSchema, item, `${path}/${index}`, errors)
		})
	}
}

const validateObject = (
	schema: Exclude<JsonSchema, boolean>,
	value: { readonly [key: string]: JSONValue },
	path: string,
	errors: JsonSchemaValidationError[],
): void => {
	const keys = Object.keys(value)
	if (Array.isArray(schema.required)) {
		for (const required of schema.required as string[]) {
			if (!(required in value)) {
				errors.push({ path: `${path}/${required}`, message: 'Required property is missing' })
			}
		}
	}
	if (typeof schema.minProperties === 'number' && keys.length < schema.minProperties) {
		errors.push({ path, message: `Object has fewer than ${schema.minProperties} properties` })
	}
	if (typeof schema.maxProperties === 'number' && keys.length > schema.maxProperties) {
		errors.push({ path, message: `Object has more than ${schema.maxProperties} properties` })
	}
	const properties = (schema.properties ?? {}) as { readonly [key: string]: JSONValue }
	for (const key of keys) {
		if (key in properties) {
			validateNode(properties[key] as JsonSchema, value[key], `${path}/${key}`, errors)
		} else if (schema.additionalProperties === false) {
			errors.push({ path: `${path}/${key}`, message: 'Additional property is not allowed' })
		} else if (schema.additionalProperties !== undefined && schema.additionalProperties !== true) {
			validateNode(schema.additionalProperties as JsonSchema, value[key], `${path}/${key}`, errors)
		}
	}
}

const validateCombinators = (schema: Exclude<JsonSchema, boolean>, value: JSONValue, path: string, errors: JsonSchemaValidationError[]): void => {
	if (Array.isArray(schema.allOf)) {
		for (const sub of schema.allOf) {
			validateNode(sub as JsonSchema, value, path, errors)
		}
	}
	if (Array.isArray(schema.anyOf)) {
		const matches = (schema.anyOf as JsonSchema[]).some(sub => {
			const subErrors: JsonSchemaValidationError[] = []
			validateNode(sub, value, path, subErrors)
			return subErrors.length === 0
		})
		if (!matches) {
			errors.push({ path, message: 'Value does not match any of the allowed schemas' })
		}
	}
	if (Array.isArray(schema.oneOf)) {
		const matchCount = (schema.oneOf as JsonSchema[]).filter(sub => {
			const subErrors: JsonSchemaValidationError[] = []
			validateNode(sub, value, path, subErrors)
			return subErrors.length === 0
		}).length
		if (matchCount !== 1) {
			errors.push({ path, message: 'Value must match exactly one of the allowed schemas' })
		}
	}
	if (schema.not !== undefined) {
		const subErrors: JsonSchemaValidationError[] = []
		validateNode(schema.not as JsonSchema, value, path, subErrors)
		if (subErrors.length === 0) {
			errors.push({ path, message: 'Value matches a forbidden schema' })
		}
	}
}
