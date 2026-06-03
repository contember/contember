import { JSONValue } from '@contember/schema'
import { isRecognizedJsonSchemaKeyword } from './keywords.js'

export interface UnsupportedJsonSchemaKeyword {
	/** The offending keyword, e.g. `$ref` or `format`. */
	keyword: string
	/** JSON pointer to the (sub)schema that contains the keyword, e.g. `` (root), `/properties/foo`. */
	path: string
}

const isPlainObject = (value: JSONValue): value is { readonly [key: string]: JSONValue } =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Recursively walks a supplied JSON Schema and collects every keyword that is neither
 * {@link SUPPORTED_JSON_SCHEMA_KEYWORDS supported} nor an
 * {@link ALLOWED_JSON_SCHEMA_ANNOTATION_KEYWORDS allowed annotation}.
 *
 * Descends into the applicator keywords the validator itself understands — `properties`, `items`,
 * `additionalProperties`, `allOf`, `anyOf`, `oneOf`, `not` — so that an unsupported keyword buried in
 * a nested subschema is still reported (with a JSON pointer to its location).
 *
 * A boolean schema (`true`/`false`) is valid and yields no findings.
 */
export const collectUnsupportedJsonSchemaKeywords = (schema: JSONValue): UnsupportedJsonSchemaKeyword[] => {
	const result: UnsupportedJsonSchemaKeyword[] = []
	walk(schema, '', result)
	return result
}

const walk = (schema: JSONValue, path: string, result: UnsupportedJsonSchemaKeyword[]): void => {
	if (!isPlainObject(schema)) {
		// boolean schema, or a non-schema leaf reached via a forgiving descent – nothing to check
		return
	}

	for (const keyword of Object.keys(schema)) {
		if (!isRecognizedJsonSchemaKeyword(keyword)) {
			result.push({ keyword, path })
		}
	}

	// object subschemas
	const properties = schema.properties
	if (isPlainObject(properties)) {
		for (const key of Object.keys(properties)) {
			walk(properties[key], `${path}/properties/${key}`, result)
		}
	}

	// `additionalProperties` may be a boolean or a subschema
	if (isPlainObject(schema.additionalProperties)) {
		walk(schema.additionalProperties, `${path}/additionalProperties`, result)
	}

	// `items` (draft-07 single schema). Tolerate an array form too so we still descend.
	const items = schema.items
	if (Array.isArray(items)) {
		items.forEach((item, index) => walk(item, `${path}/items/${index}`, result))
	} else if (items !== undefined) {
		walk(items, `${path}/items`, result)
	}

	// combinators
	for (const combinator of ['allOf', 'anyOf', 'oneOf'] as const) {
		const subSchemas = schema[combinator]
		if (Array.isArray(subSchemas)) {
			subSchemas.forEach((sub, index) => walk(sub, `${path}/${combinator}/${index}`, result))
		}
	}
	if (schema.not !== undefined) {
		walk(schema.not, `${path}/not`, result)
	}
}
