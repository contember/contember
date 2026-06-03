import { JSONValue } from '@contember/schema'

/**
 * The TypeScript type emitted when a JSON Schema (or a subschema) cannot be faithfully expressed.
 * It is the universal JSON supertype, so falling back to it is always sound — never looser than the
 * actual data could be, just less precise.
 */
export const JSON_VALUE_TYPE = 'JSONValue'

const isPlainObject = (value: JSONValue): value is { readonly [key: string]: JSONValue } =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const isPrimitive = (value: JSONValue): value is string | number | boolean | null =>
	value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

const literal = (value: string | number | boolean | null): string => {
	if (value === null) {
		return 'null'
	}
	if (typeof value === 'string') {
		return JSON.stringify(value)
	}
	return String(value)
}

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

const propertyKey = (key: string): string => (VALID_IDENTIFIER.test(key) ? key : JSON.stringify(key))

/**
 * Derives a TypeScript type from the {@link SUPPORTED_JSON_SCHEMA_KEYWORDS supported subset} of JSON
 * Schema. For any construct it cannot faithfully and soundly express it returns {@link JSON_VALUE_TYPE},
 * never a type that is wider than the data could actually be.
 *
 * Mapping:
 * - `const` (primitive) / `enum` (primitives) → literal / union of literals
 * - `type` scalar: string → `string`, number|integer → `number`, boolean → `boolean`, null → `null`
 * - `type: 'object'` (+ `properties`/`required`) → object type with optional vs required props
 * - `type: 'array'` (+ `items`) → `T[]`
 * - `type` array → union of the per-type results
 * - `allOf` → intersection, `anyOf`/`oneOf` → union
 *
 * A boolean schema, an empty schema, or anything not covered → `JSONValue`.
 */
export const jsonSchemaToTsType = (schema: JSONValue): string => {
	const result = derive(schema)
	return result ?? JSON_VALUE_TYPE
}

/** Returns the derived type, or `null` if it must fall back to {@link JSON_VALUE_TYPE}. */
const derive = (schema: JSONValue): string | null => {
	if (!isPlainObject(schema)) {
		// boolean schema (`true`/`false`) – not faithfully expressible / not a constraint we model
		return null
	}

	// const – only primitives are faithfully expressible as a literal
	if ('const' in schema && schema.const !== undefined) {
		return isPrimitive(schema.const) ? literal(schema.const) : null
	}

	// enum – union of primitive literals
	if (Array.isArray(schema.enum)) {
		if (schema.enum.length === 0 || !schema.enum.every(isPrimitive)) {
			return null
		}
		return union(schema.enum.map(it => literal(it as string | number | boolean | null)))
	}

	// combinators (independent of `type`)
	if (Array.isArray(schema.allOf)) {
		const parts = mapAll(schema.allOf)
		return parts && parts.length > 0 ? intersection(parts) : null
	}
	if (Array.isArray(schema.anyOf)) {
		const parts = mapAll(schema.anyOf)
		return parts && parts.length > 0 ? union(parts) : null
	}
	if (Array.isArray(schema.oneOf)) {
		const parts = mapAll(schema.oneOf)
		return parts && parts.length > 0 ? union(parts) : null
	}
	// `not` is not expressible as a positive TS type
	if ('not' in schema) {
		return null
	}

	if (schema.type !== undefined) {
		return deriveFromType(schema)
	}

	// no recognized type-narrowing keyword → cannot tighten below JSONValue
	return null
}

const deriveFromType = (schema: { readonly [key: string]: JSONValue }): string | null => {
	const types = Array.isArray(schema.type) ? schema.type : [schema.type]
	const parts: string[] = []
	for (const type of types) {
		const part = deriveScalarOrContainer(type, schema)
		if (part === null) {
			return null
		}
		parts.push(part)
	}
	return parts.length > 0 ? union(parts) : null
}

const deriveScalarOrContainer = (type: JSONValue, schema: { readonly [key: string]: JSONValue }): string | null => {
	switch (type) {
		case 'string':
			return 'string'
		case 'number':
		case 'integer':
			return 'number'
		case 'boolean':
			return 'boolean'
		case 'null':
			return 'null'
		case 'array':
			return deriveArray(schema)
		case 'object':
			return deriveObject(schema)
		default:
			return null
	}
}

const deriveArray = (schema: { readonly [key: string]: JSONValue }): string | null => {
	const items = schema.items
	if (items === undefined) {
		// array of unknown element type
		return `readonly ${JSON_VALUE_TYPE}[]`
	}
	if (Array.isArray(items)) {
		// tuple form (`items` as array) is not part of the supported subset
		return null
	}
	const itemType = derive(items) ?? JSON_VALUE_TYPE
	return `readonly (${itemType})[]`
}

const deriveObject = (schema: { readonly [key: string]: JSONValue }): string | null => {
	const properties = schema.properties
	if (!isPlainObject(properties) || Object.keys(properties).length === 0) {
		// closed/open object with no declared properties – stay sound, do not emit `{}`
		return null
	}
	const requiredList = Array.isArray(schema.required) ? schema.required.filter((it): it is string => typeof it === 'string') : []
	const required = new Set<string>(requiredList)
	const members: string[] = []
	for (const key of Object.keys(properties)) {
		const propType = derive(properties[key]) ?? JSON_VALUE_TYPE
		const optional = required.has(key) ? '' : '?'
		members.push(`${propertyKey(key)}${optional}: ${propType}`)
	}
	return `{ ${members.join('; ')} }`
}

const mapAll = (schemas: readonly JSONValue[]): string[] | null => {
	const parts: string[] = []
	for (const sub of schemas) {
		const part = derive(sub)
		if (part === null) {
			return null
		}
		parts.push(part)
	}
	return parts
}

const union = (parts: readonly string[]): string => {
	const unique = [...new Set(parts)]
	return unique.length === 1 ? unique[0] : unique.map(wrapForUnion).join(' | ')
}

const intersection = (parts: readonly string[]): string => {
	const unique = [...new Set(parts)]
	return unique.length === 1 ? unique[0] : unique.map(wrapForUnion).join(' & ')
}

/** Wrap composite types in parentheses so unions/intersections compose unambiguously. */
const wrapForUnion = (type: string): string => {
	if (type.includes(' | ') || type.includes(' & ')) {
		return `(${type})`
	}
	return type
}
