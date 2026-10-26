/**
 * GraphQL Query Validation
 *
 * Implements the "Validation" section of the GraphQL spec.
 * Validates a GraphQL document against a schema and returns any errors.
 */
import type { DocumentNode } from 'graphql'
import { GraphQLError, visit, visitInParallel } from 'graphql'

import type { Schema } from '../types/schema.js'
import type { ScalarMap } from '../types/resolvers.js'
import { withBuiltInScalars } from '../scalars/builtIn.js'
import { getSchemaWithIntrospection } from '../introspection/types.js'

import { TypeInfo, visitWithTypeInfo } from './TypeInfo.js'
import { ValidationContext, type ValidationRule } from './ValidationContext.js'
import { specifiedRules } from './specifiedRules.js'

export interface ValidateOptions {
	/**
	 * Custom validation rules to use instead of default specifiedRules
	 */
	rules?: readonly ValidationRule[]

	/**
	 * Maximum number of errors to collect before aborting validation.
	 * Default: 100
	 */
	maxErrors?: number

	/**
	 * Custom scalar definitions for validating literal values.
	 * If not provided, built-in scalars are used.
	 */
	scalars?: ScalarMap
}

/**
 * Implements the "Validation" section of the spec.
 *
 * Validation runs synchronously, returning an array of encountered errors, or
 * an empty array if no errors were encountered and the document is valid.
 *
 * A list of specific validation rules may be provided. If not provided, the
 * default list of rules defined by the GraphQL specification will be used.
 *
 * @param schema - The Schema to validate against
 * @param document - The parsed GraphQL document to validate
 * @param options - Optional validation options
 * @returns Array of GraphQLError objects
 */
export function validate(
	schema: Schema,
	document: DocumentNode,
	options?: ValidateOptions,
): ReadonlyArray<GraphQLError> {
	const rules = options?.rules ?? specifiedRules
	const maxErrors = options?.maxErrors ?? 100
	const scalars = withBuiltInScalars(options?.scalars)

	// Use an object to signal abort
	const abortObj = Object.freeze({})
	const errors: GraphQLError[] = []

	// selections below __schema and __type are validated against the introspection types
	const schemaWithIntrospection = getSchemaWithIntrospection(schema)
	const typeInfo = new TypeInfo(schemaWithIntrospection)
	const context = new ValidationContext(schemaWithIntrospection, document, typeInfo, scalars, (error) => {
		if (errors.length >= maxErrors) {
			errors.push(
				new GraphQLError(
					'Too many validation errors, error limit reached. Validation aborted.',
				),
			)
			// eslint-disable-next-line @typescript-eslint/no-throw-literal
			throw abortObj
		}
		errors.push(error)
	})

	// Create visitors from all rules
	const visitors = rules.map((rule) => rule(context))

	// Visit the whole document with all rules in parallel
	const visitor = visitInParallel(visitors)

	try {
		visit(document, visitWithTypeInfo(typeInfo, visitor))
	} catch (e) {
		if (e !== abortObj) {
			throw e
		}
	}

	return errors
}

// Re-export types for convenience
export type { ValidationRule } from './ValidationContext.js'
export { ValidationContext } from './ValidationContext.js'
export { TypeInfo } from './TypeInfo.js'
