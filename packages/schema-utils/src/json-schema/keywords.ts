/**
 * The single source of truth for the JSON Schema subset Contember supports on a
 * {@link Model.ColumnType.Json} column.
 *
 * Three independent consumers MUST agree on this set:
 * - the runtime input validator (`@contember/engine-content-api` `validateJsonSchema`),
 * - the schema-build keyword check ({@link collectUnsupportedJsonSchemaKeywords}, wired into
 *   `ModelValidator`),
 * - the generated-client type derivation (`@contember/client-content-generator` `jsonSchemaToTsType`).
 *
 * Keep this list in sync with the keywords actually honored by the validator. Adding a keyword here
 * without also implementing it in the validator would make the schema-build check accept a schema the
 * runtime silently ignores — exactly the bug this set exists to prevent.
 */
export const SUPPORTED_JSON_SCHEMA_KEYWORDS = [
	// generic
	'type',
	'enum',
	'const',
	// object
	'properties',
	'required',
	'additionalProperties',
	'minProperties',
	'maxProperties',
	// array (draft-07 style `items` applied to all elements)
	'items',
	'minItems',
	'maxItems',
	'uniqueItems',
	// string
	'minLength',
	'maxLength',
	'pattern',
	// number
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum',
	'multipleOf',
	// combinators
	'allOf',
	'anyOf',
	'oneOf',
	'not',
] as const

export type SupportedJsonSchemaKeyword = (typeof SUPPORTED_JSON_SCHEMA_KEYWORDS)[number]

/**
 * Non-validating annotation/metadata keywords. They have no effect on validation but are explicitly
 * allowed in a supplied schema so that documentation, defaults and authoring hints do not trigger a
 * "unsupported keyword" schema error.
 */
export const ALLOWED_JSON_SCHEMA_ANNOTATION_KEYWORDS = [
	'title',
	'description',
	'$schema',
	'$id',
	'$comment',
	'examples',
	'default',
	'readOnly',
	'writeOnly',
	'deprecated',
] as const

export type AllowedJsonSchemaAnnotationKeyword = (typeof ALLOWED_JSON_SCHEMA_ANNOTATION_KEYWORDS)[number]

const supportedKeywordSet: ReadonlySet<string> = new Set<string>(SUPPORTED_JSON_SCHEMA_KEYWORDS)
const annotationKeywordSet: ReadonlySet<string> = new Set<string>(ALLOWED_JSON_SCHEMA_ANNOTATION_KEYWORDS)

export const isSupportedJsonSchemaKeyword = (keyword: string): keyword is SupportedJsonSchemaKeyword => supportedKeywordSet.has(keyword)

export const isAllowedJsonSchemaAnnotationKeyword = (keyword: string): keyword is AllowedJsonSchemaAnnotationKeyword =>
	annotationKeywordSet.has(keyword)

/** A keyword is recognized if it is either a supported validation keyword or an allowed annotation. */
export const isRecognizedJsonSchemaKeyword = (keyword: string): boolean => supportedKeywordSet.has(keyword) || annotationKeywordSet.has(keyword)
